/**
 * HOTFIX-VIVO (2026-10-10): what the owner reported while playing the published Parte II.
 *
 *  (2) during a Momento only its song sounds: sfx, ambience (sea, wind, loops), voices and the procedural music fade
 *      out (core/audio SOLO) and the music playing before it is hushed; everything comes back after the cut.
 *  (3) the Momento ENDS the battle: its phase is an ending one (FaseDef.endsBattle) — the sim declares the player's
 *      victory right there, deterministically (screen = estimate), in the five battles that have a Momento.
 *  (1) the Part II islands live on the CARTA: an island the save already had stays there through the narrative
 *      reset (knownRegions), the ¡ZARPAR! button / the chart point at new ones, Luzterna says it once.
 *  (4) the Páginas Hundidas' pages: each one once, then no more float.
 *  (5) toasts never cover what is being read; new versions arrive as one toast.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const mem = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, String(v)),
  removeItem: (k: string) => void mem.delete(k),
  key: (i: number) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size;
  },
  clear: () => mem.clear(),
};

// ------------------------------------------------------------------ a tiny Web Audio stand-in (gains only)
class Param {
  value = 1;
  setValueAtTime(v: number) {
    this.value = v;
  }
  linearRampToValueAtTime(v: number) {
    this.value = v;
  }
  setTargetAtTime(v: number) {
    this.value = v;
  }
  cancelScheduledValues() {}
  cancelAndHoldAtTime() {}
  setValueCurveAtTime() {}
}
class Node {
  gain = new Param();
  connect<T>(n: T) {
    return n;
  }
  disconnect() {}
}
class FakeCtx {
  currentTime = 0;
  sampleRate = 48000;
  state = 'running';
  destination = new Node();
  createGain() {
    return new Node();
  }
  createDynamicsCompressor() {
    return Object.assign(new Node(), { threshold: new Param(), ratio: new Param() });
  }
  createBuffer(_c: number, len: number) {
    return { getChannelData: () => new Float32Array(len) };
  }
  resume() {
    return Promise.resolve();
  }
}
(globalThis as { AudioContext?: unknown }).AudioContext = FakeCtx;

const { audio } = await import('../src/core/audio');
const { G } = await import('../src/state');
const { SAVE_KEY } = await import('../src/core/save');
const { checkMissions } = await import('../src/state/sys/missions');
const { buildStoryBattle, STORY_BATTLES } = await import('../src/state/sys/storyBattles');
const { RESET_PATCH_ID } = await import('../src/state/sys/rupturasReset');
const R = await import('../src/state/sys/rupturas');
const { makeBattle, autoBattle } = await import('../src/battle/autoplay');
const { DIFFICULTY } = await import('../src/battle/ai');
const { fasesCheck, faseInterlude } = await import('../src/battle/fases');
const { momentoForFase, momentoIds, getMomento } = await import('../src/momentos/registry');
await import('../src/momentos/songs');
const { nextPage, pagesLeft, looseFlag } = await import('../src/regions/paginas/readPages');
const { versionsToast } = await import('../src/audio/versionsToast');
const { freeY } = await import('../src/ui/toastAvoid');
const { battleOver } = await import('../src/momentos/battle');

const envOf = (f: string) => JSON.parse(readFileSync(new URL(`../test-saves/${f}.json`, import.meta.url), 'utf8'));
function load(env: { state: { patches?: string[] } }) {
  mem.clear();
  mem.set(SAVE_KEY, JSON.stringify(env));
  G.load();
  checkMissions();
}
/** a fixture that has NOT had the narrative reset yet: it runs on load (like the owner's save did) */
function loadReset(f: string) {
  const env = envOf(f);
  env.state.patches = (env.state.patches ?? []).filter((p: string) => p !== RESET_PATCH_ID);
  if (env.state.ext?.rupturas) delete env.state.ext.rupturas.reset;
  load(env);
}

// ------------------------------------------------------------------ (2) SOLO
describe('(2) a Momento solos its song', () => {
  it('SOLO fades sfx / ambience / voices / procedural to 0 and brings them back; keyed holds; settings survive', () => {
    audio.unlock();
    audio.setGains({ master: 0.8, music: 0.4, sfx: 0.7, ambient: 0.5, voice: 0.6 });
    const g = () => ({ sfx: audio.sfxBus.gain.value, amb: audio.ambientBus.gain.value, voice: audio.voiceBus.gain.value, proc: audio.procGate.gain.value, music: audio.musicBus.gain.value });
    expect(g()).toEqual({ sfx: 0.7, amb: 0.5, voice: 0.6, proc: 1, music: 0.4 });
    expect(audio.solo('momento', true)).toBe(true);
    expect(g()).toEqual({ sfx: 0, amb: 0, voice: 0, proc: 0, music: 0.4 });
    // a settings change meanwhile keeps the solo
    audio.setGains({ sfx: 0.9 });
    expect(g().sfx).toBe(0);
    // a second hold: the first release doesn't end it
    expect(audio.solo('otro', true)).toBe(false);
    expect(audio.solo('momento', false)).toBe(false);
    expect(g().amb).toBe(0);
    expect(audio.solo('otro', false)).toBe(true);
    expect(g()).toEqual({ sfx: 0.9, amb: 0.5, voice: 0.6, proc: 1, music: 0.4 });
    expect(audio.soloed).toBe(false);
  });

  it('playMomento takes the SOLO (with the playing decks) before anything and always gives it back', () => {
    const src = readFileSync(new URL('../src/momentos/index.ts', import.meta.url), 'utf8');
    const on = src.indexOf("audioApi.solo(true, { key: 'momento'");
    const off = src.indexOf("audioApi.solo(false, { key: 'momento'");
    expect(on).toBeGreaterThan(src.indexOf("hush('momento', true)"));
    expect(on).toBeLessThan(src.indexOf('await inviteSound()'));
    expect(src.slice(on, on + 80)).toContain('decks: true');
    // released in the finally block (an error or an exit still restores the mix)
    expect(off).toBeGreaterThan(src.lastIndexOf('} finally {'));
  });
});

// ------------------------------------------------------------------ (3) the Momento ends the battle
/** every battle phase a Momento plays on: BattleScene's own path (MomentoDef.battle) + the FASES interludes */
const HOOKS: [string, string, string][] = [
  ['ruptura_bibliotecario', 'memoria', 'H35 when_i_lose'],
  ['cielo_invertidas', 'cielo', 'H44 liky_fight'],
  ['ruptura_disruptores', 'glitch', 'H55 te_odio'],
  ['ruptura_leviatan', 'cielo', 'H57 hemkade'],
  ['umbral_correctores', 'el_plan', 'H62 circus_malus'],
];
describe('(3) the Momento ends the battle (deterministic victory)', () => {
  it('the five Momento phases are ending phases, and no other phase is', () => {
    load({ ...envOf('rupturas-o4'), state: { ...envOf('rupturas-o4').state } });
    for (const [b, f, what] of HOOKS) {
      const hooked = !!momentoForFase(b, f) || !!faseInterlude(b, f);
      expect(hooked, what).toBe(true);
      const ph = STORY_BATTLES[b].rules?.fases?.phases.find((p) => p.id === f);
      expect(ph?.endsBattle, what).toBe(true);
    }
    // every Momento with a battle is one of them
    for (const id of momentoIds()) {
      const d = getMomento(id)!;
      if (d.battle) expect(HOOKS.some(([b, f]) => b === d.battle!.id && f === d.battle!.fase), id).toBe(true);
    }
    // an ending phase without a Momento would end a fight for nothing
    for (const [id, def] of Object.entries(STORY_BATTLES))
      for (const p of def.rules?.fases?.phases ?? []) if (p.endsBattle) expect(HOOKS.some(([b, f]) => b === id && f === p.id), `${id}:${p.id}`).toBe(true);
  });

  it('crossing the threshold → the player wins there (reason «momento»), with no rule of the phase applied', () => {
    load(envOf('rupturas-o4'));
    for (const [b, f, what] of HOOKS) {
      const sp = buildStoryBattle(b, () => undefined);
      const { onEnd: _drop, ...plain } = sp;
      for (const spec of [sp, structuredClone(plain) as typeof sp]) {
        const bt = makeBattle(spec, 4242);
        for (const c of bt.sides[1].cats) c.hp = Math.max(1, Math.floor(c.maxHp * 0.2));
        const ev = fasesCheck(bt);
        expect(ev.some((e) => e.k === 'boss' && (e as { what?: string }).what === 'fase'), what).toBe(true);
        expect(bt.winner, what).toBe(0);
        expect(bt.reason, what).toBe('momento');
        expect(ev.some((e) => e.k === 'boss' && (e as { what?: string }).what === 'umbral'), `${what}: no rule banner`).toBe(false);
        void f;
      }
    }
  });

  it('a fight won BEFORE the threshold (core, crew) still ends on the Momento: its phase is entered, the win keeps its reason', () => {
    load(envOf('rupturas-o4'));
    const sp = buildStoryBattle('umbral_correctores', () => undefined);
    const bt = makeBattle(sp, 7);
    bt.winner = 0;
    bt.reason = 'core';
    const ev = fasesCheck(bt);
    expect(ev.filter((e) => e.k === 'boss' && (e as { what?: string }).what === 'fase').map((e) => (e as { n?: number }).n)).toEqual([1]);
    expect(bt.reason).toBe('core');
    expect(fasesCheck(bt)).toEqual([]); // once
    // a lost fight never plays it
    const lost = makeBattle(sp, 7);
    lost.winner = 1;
    lost.reason = 'sunk';
    expect(fasesCheck(lost)).toEqual([]);
  });

  it('a full headless fight that reaches the Momento ends there, the same with the worker\'s copy of the spec', () => {
    load(envOf('rupturas-o4'));
    const sp = buildStoryBattle('ruptura_bibliotecario', () => undefined);
    const { onEnd: _drop, ...plain } = sp;
    const a = autoBattle(sp, DIFFICULTY.normal, 17, 30);
    const b = autoBattle(structuredClone(plain) as typeof sp, DIFFICULTY.normal, 17, 30);
    expect(b).toEqual(a);
    if (a.reason === 'momento') expect(a.won).toBe(true);
  }, 120_000);

  it('after the Momento nothing of the battle comes back when it is over (battleOver)', () => {
    expect(battleOver({ sim: { winner: 0 } })).toBe(true);
    expect(battleOver({ sim: { winner: null } })).toBe(false);
    expect(battleOver(null)).toBe(false);
  });
});

// ------------------------------------------------------------------ (1) the islands on the CARTA
describe('(1) known islands stay on the CARTA; the game says where they are', () => {
  it('a save that played Part II keeps every island it had through the reset (the owner\'s case)', () => {
    loadReset('rupturas-o4');
    expect(G.s.missions.active).toContain('H31');
    const ids = R.mapRegions().map((r) => r.id);
    for (const id of ['paginas', 'nacar', 'invertidas', 'corona', 'cometa']) expect(ids, id).toContain(id);
    expect((G.s.ext?.rupturas as { known?: string[] }).known).toEqual(expect.arrayContaining(['paginas', 'nacar']));
    // this pass hasn't visited them: new ink on the chart, but Luzterna waits for the story to reach the islands
    expect(R.freshChartIslands().length).toBeGreaterThan(0);
    expect(R.chartIslandsToTell()).toBeNull();
    // later in the replay (the owner: H36 «La página de Canelo»), she tells it once
    G.s.missions.active = G.s.missions.active.filter((id) => id !== 'H31');
    G.s.missions.active.push('H36');
    expect(R.chartIslandsToTell()).toBe('paginas');
    G.flag(R.CHART_ISLANDS_TOLD);
    expect(R.chartIslandsToTell()).toBeNull();
    // idempotent: loading again changes nothing
    const flags = JSON.stringify(G.s.flags);
    R.syncRegionFlags();
    expect(JSON.stringify(G.s.flags)).toBe(flags);
  });

  it('a new Part II player only sees the islands the story has shown (no spoilers)', () => {
    const env = envOf('post-finale');
    env.state.patches = [...(env.state.patches ?? []), RESET_PATCH_ID];
    load(env);
    expect(R.mapRegions()).toEqual([]);
    expect(R.freshChartIslands()).toEqual([]);
    expect(R.chartIslandsToTell()).toBeNull();
    expect(G.s.ext?.rupturas).toBeUndefined();
    // the story presents Páginas Hundidas (H33): it appears, alone, and Luzterna explains the chart
    G.s.missions.done.push('H31', 'H32');
    G.s.missions.active = G.s.missions.active.filter((id) => id !== 'H31' && id !== 'H32');
    G.s.missions.active.push('H33');
    R.syncRegionFlags();
    expect(R.mapRegions().map((r) => r.id)).toEqual(['paginas']);
    expect(R.freshChartIslands()).toEqual(['paginas']);
    expect(R.chartIslandsToTell()).toBe('paginas');
  });

  it('junk in the record never breaks a save', () => {
    loadReset('rupturas-mid');
    const ext = G.s.ext!.rupturas as Record<string, unknown>;
    ext.known = ['paginas', 42, null, 'inventada', { x: 1 }];
    expect(() => R.syncRegionFlags()).not.toThrow();
    expect(ext.known).toEqual(R.knownRegions());
    expect(R.knownRegions()).not.toContain('inventada');
  });
});

// ------------------------------------------------------------------ (4) pages once
describe('(4) the Páginas Hundidas give each page once', () => {
  const reader = (flags: string[], claimed: string[] = []) => ({ has: (f: string) => flags.includes(f), claimed: (k: string) => claimed.includes(k) });
  it('the eight DIARIO pages first (read in an earlier pass counts), then each loose page, then nothing', () => {
    expect(nextPage(reader([]), 6)).toEqual({ kind: 'diario', n: 1 });
    expect(nextPage(reader(['pagina_leida:1'], ['pagina:2']), 6)).toEqual({ kind: 'diario', n: 3 });
    const all8 = Array.from({ length: 8 }, (_, i) => `pagina_leida:${i + 1}`);
    expect(nextPage(reader(all8), 6)).toEqual({ kind: 'loose', i: 0 });
    expect(nextPage(reader([...all8, looseFlag(0), looseFlag(1)]), 6)).toEqual({ kind: 'loose', i: 2 });
    const everything = [...all8, ...Array.from({ length: 6 }, (_, i) => looseFlag(i))];
    expect(nextPage(reader(everything), 6)).toBeNull();
    expect(pagesLeft(reader(everything), 6)).toBe(0);
    expect(pagesLeft(reader([]), 6)).toBe(14);
    // after the reset (flags gone) the ledger still knows them: they don't come back
    const ledger = Array.from({ length: 8 }, (_, i) => `pagina:${i + 1}`);
    expect(pagesLeft(reader(Array.from({ length: 6 }, (_, i) => looseFlag(i)), ledger), 6)).toBe(0);
  });
});

// ------------------------------------------------------------------ (5) toasts
describe('(5) toasts', () => {
  it('several new versions at once make one toast with the names', () => {
    expect(versionsToast(['Cuernos de tinta'])).toEqual({ text: 'NUEVA VERSIÓN: Cuernos de tinta', sub: 'Ya suena en tu Fonoteca.' });
    const t = versionsToast(['A', 'B', 'C', 'D', 'E']);
    expect(t.text).toBe('5 VERSIONES NUEVAS');
    expect(t.sub).toBe('Ya suenan en tu Fonoteca: A · B · C y 2 más.');
  });
  it('a toast never lands on what is being read: a free band, or none (the caller waits / shrinks)', () => {
    const caption = { x: 60, y: 60, w: 960, h: 180 };
    expect(freeY(960, 600, 80, 130, [], 96, 1056)).toBe(130);
    const y = freeY(960, 600, 80, 130, [caption], 96, 1056)!;
    expect(y).toBeGreaterThanOrEqual(caption.y + caption.h);
    const panel = { x: 100, y: 40, w: 1720, h: 1010 };
    expect(freeY(960, 600, 80, 130, [panel], 96, 1056)).toBeNull();
  });
});
