/**
 * Parte III · ACTO I «La noche que no se reinicia» (H69 → H74) — NARRATIVA's story integrated (MECÁNICAS-IMPL).
 *
 *   · the data: H70–H74 chained after H69, the map's goals, the 5-field cards word for word, the beats with their
 *     speakers registered, TEMPERATURA's passes 4 (Doña Espuma answers «pago yo») and 5 (R7)
 *   · the walk: from a real save (h65-normal) at H69, every mission advances through its flows and battles to H74;
 *     a reload at any substep resumes there (nothing replays, nothing deadlocks)
 *   · old saves: no fixture gets an Acto I mission; the Part II fixtures load unchanged
 *   · the films: a registered film plays (and is listed in «Volver a ver»); without it, its lines play instead
 * The dialog, the choice prompt and the story lines are stubbed (no Pixi in tests); the flows are the real ones.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';

const said: [string, string][][] = [];
vi.mock('../src/ui/dialog', () => ({
  say: async (lines: [string, string][]) => void said.push(lines),
  storyLayer: () => ({}),
}));
const picks: string[] = [];
vi.mock('../src/ui/story/profile', () => ({
  choicePrompt: async (_l: unknown, o: { options: { value: string }[] }) => {
    const want = picks.shift();
    return (o.options.find((x) => x.value === want) ?? o.options[0]).value;
  },
}));
vi.mock('../src/app/story', async () => {
  const { BEAT_BY_ID } = await import('../src/data/content');
  return { storyLines: (beat: string, idx?: number[]) => (idx ?? BEAT_BY_ID.get(beat)!.lines.map((_, i) => i)).map((i) => BEAT_BY_ID.get(beat)!.lines[i]) };
});

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

const { G } = await import('../src/state');
const { SAVE_KEY } = await import('../src/core/save');
const { MISSION_BY_ID, BEAT_BY_ID } = await import('../src/data/content');
const { checkMissions } = await import('../src/state/sys/missions');
const GT = await import('../src/state/sys/gateras');
const GB = await import('../src/state/sys/gaterasBattles');
const SI = await import('../src/app/stageIntro');
const F = await import('../src/app/acto1Flow');
const S = await import('../src/ui/story/gaterasScript');
const { speaker } = await import('../src/ui/story/text');
const { autoBattle } = await import('../src/battle/autoplay');
const { DIFFICULTY } = await import('../src/battle/ai');
const X = await import('../src/state/sys/rupturasReset');

const B = 'p3d_borracha' as const;
const ACTO1 = ['H70', 'H71', 'H72', 'H73', 'H74'];
const won = { won: true, reason: 'sunk', turns: 6, modulesDestroyed: 3, damageDealt: 100, catsLost: 0, perfect: false } as never;
const FIX = readdirSync(new URL('../test-saves/', import.meta.url)).filter((f) => f.endsWith('.json'));
const raw = (f: string) => readFileSync(new URL(`../test-saves/${f}`, import.meta.url), 'utf8');

F.ACTO1_TIMING.quietMs = 0;
beforeEach(() => {
  said.length = 0;
  picks.length = 0;
  // no film engine in tests: every film plays its lines (a registered one is checked below)
  SI.setFilmPort({ has: () => false, play: async () => null });
});

/**
 * a save at H69: the fixture test-saves/h69-acto1.json (scripts/make-h69-fixture.ts: h65-normal played through the
 * prologue with the game's own systems, B-1…B-4 won) — or, without it, the same built here
 */
function atH69() {
  mem.clear();
  if (FIX.includes('h69-acto1.json')) {
    mem.set(SAVE_KEY, raw('h69-acto1.json'));
    G.load();
    expect(G.s.missions.active).toContain('H69');
    expect(GT.frontierOf(B)).toBe(5);
    return;
  }
  mem.set(SAVE_KEY, raw('h65-normal.json'));
  G.load();
  const m = G.s.missions;
  m.done = [...new Set([...m.done, 'H65', 'H66', 'H67', 'H68'])];
  m.active = m.active.filter((x) => !['H66', 'H67', 'H68'].includes(x));
  if (!m.active.includes('H69')) m.active.push('H69');
  GT.openGatera(B);
  for (let n = 1; n <= 4; n++) GT.recordWin(B, n);
  G.save();
  G.load();
}
const reload = () => {
  G.save();
  G.load();
  expect(G.loaded).toBe(true);
};
const active = (id: string) => G.s.missions.active.includes(id);
const done = (id: string) => G.s.missions.done.includes(id);
const allSaid = () => said.flat().map(([sp, t]) => `${sp}: ${t}`);

describe('Acto I data: NARRATIVA word for word', () => {
  it('H70–H74 chain after H69, with the map’s goals', () => {
    const want: Record<string, [string, string, string]> = {
      H70: ['mission:H69', 'use_feature', 'p3_borron'],
      H71: ['mission:H70', 'win_battle', 'p3d_borracha_ebrecha'],
      H72: ['mission:H71', 'use_feature', 'p3_resaca'],
      H73: ['mission:H72', 'win_battle', 'p3d_borracha_eemiau'],
      H74: ['mission:H73', 'win_battle', 'p3d_borracha_9'],
    };
    for (const id of ACTO1) {
      const m = MISSION_BY_ID.get(id)!;
      expect(m.trigger, id).toBe(want[id][0]);
      expect(m.goal.type, id).toBe(want[id][1]);
      expect(m.goal.feature ?? m.goal.battle, id).toBe(want[id][2]);
      expect(X.isPart2Beat(`b${id.slice(1)}_x`)).toBe(false);
    }
    expect(MISSION_BY_ID.get('H72')!.title).toBe('La resaca');
    expect(MISSION_BY_ID.get('H73')!.title).toBe('La Batalla de Gatos');
  });

  it('the cards are the map’s (02-mapa §3.1)', () => {
    expect(MISSION_BY_ID.get('H70')!.card).toEqual({ pasa: 'Hay un gato con una mano en la pata', importa: 'Puede saber qué es REGISTRO 000', queremos: 'Que nos cuente', ahi: 'Está en la Donería y no se quiere ir', cambio: 'Los Titiriteros bajaron como gatos. Y olvidan' });
    expect(MISSION_BY_ID.get('H73')!.card!.cambio).toBe('Canelo dijo que fue él. Y que paga él');
    expect(MISSION_BY_ID.get('H74')!.card!.cambio).toBe('Las cajas son muchas cajas. Y alguien viene siguiendo una luz');
  });

  it('every speaker of the Acto I beats is registered (stand-in portraits where art is missing)', () => {
    const fb = speaker('__NADIE__');
    const ids = ['b70_doneria', 'b70_sombras', 'b70_ficha', 'b71_cierre', 'b72_resaca', 'b73_entrada', 'b73_emen', 'b73_despues', 'b74_lista', 'b74_aviso', 'b74_ohshit'];
    for (const id of ids) {
      const b = BEAT_BY_ID.get(id)!;
      expect(b, id).toBeTruthy();
      for (const [sp] of b.lines) {
        const s = speaker(sp);
        expect(s.kind !== fb.kind || s.slug !== fb.slug || s.band !== fb.band, `${id}: ${sp}`).toBe(true);
      }
    }
  });

  it('TEMPERATURA: pass 4 (Doña Espuma answers «pago yo», Luzterna doesn’t) and pass 5 R7', () => {
    const emen = BEAT_BY_ID.get('b73_emen')!.lines;
    const promise = emen.findIndex(([, t]) => t.includes('pago yo'));
    expect(emen[promise][0]).toBe('CANELO');
    expect(emen.slice(promise + 1).some(([sp]) => sp === 'LUZTERNA')).toBe(false);
    expect(emen.at(-1)).toEqual(['DOÑA ESPUMA', 'Empieza por las catorce rondas.']);
    const aviso = BEAT_BY_ID.get('b74_aviso')!.lines;
    expect(aviso).toContainEqual(['CANELO', '¿Cuál luz?']);
    expect(aviso.some(([sp, t]) => sp === 'LUZTERNA' && t.includes('luz'))).toBe(false);
    expect(aviso).toContainEqual(['BORRÓN', 'Si lo digo, me borran otra línea.']);
    expect(aviso.some(([, t]) => t.includes('¡Hic!'))).toBe(false);
    const resaca = BEAT_BY_ID.get('b72_resaca')!.lines;
    expect(resaca.some(([, t]) => t === 'Es horrible.' || t === 'Es mi bufanda.')).toBe(false);
  });

  it('the story battles: Brecha (sillas voladoras), EMIAU (Rima, the song closes it), El Cadenero (Lista VIP, after H73)', () => {
    atH69();
    const br = GB.gateraBattleDef(B, 'ebrecha')!;
    expect(br.film).toBe('F03');
    expect(br.fases?.phases[0].env?.bodies?.length).toBe(3);
    const em = GB.buildGateraBattle(B, 'eemiau', () => undefined);
    expect(em.rules?.rima).toEqual({ boo: 0.8, combo: 1.1 });
    expect(em.rules?.fases?.phases[1]).toMatchObject({ id: 'emen', endsBattle: true });
    expect(em.intro?.lines.join(' ')).toMatch(/RIMA/);
    const b9 = GB.buildGateraBattle(B, 9, () => undefined);
    expect(b9.rules?.vip).toEqual({ side: 0, captain: 'e0' });
    expect(GT.stageOf(B, 9)!.line).toBe('Esta noche no pasa nadie.');
    // the song closes EMIAU's battle: a won fight ends with reason «momento»
    const r = autoBattle(em, DIFFICULTY.hard, 31, 30);
    if (r.won) expect(r.reason).toBe('momento');
  }, 60_000);
});

describe('the walk: H69 → H74 on a real save', () => {
  it('every mission advances through its scenes and battles; reloads resume; Superhéroes waits for H74', async () => {
    atH69();
    // H69: B-5
    GB.applyGateraResult(B, 5, won);
    checkMissions();
    expect(done('H69')).toBe(true);
    expect(active('H70')).toBe(true);
    // the Brecha encounter isn't there before H70 is done
    expect(GT.nodeState(B, 'ebrecha')).toBe('hidden');

    // H70: the Donería — the intro, the dona (sprinkles), F02 (its lines), the card's scene C
    picks.push('chispas');
    // a reload in the middle: the intro was seen, the rest comes after
    G.s.beatsSeen.push('b70_doneria');
    reload();
    expect(await F.playStoryFlow('h70_doneria')).toBe('done');
    expect(allSaid()).not.toContain('CANELO: ¿Ese llora con una dona?');
    expect(allSaid()).toContain('HOMIAU: ¡Mi dona!');
    expect(allSaid()).toContain('BORRÓN: Allá arriba éramos manos.');
    expect(F.donaChoice()).toBe('chispas');
    for (const k of ['b70_donas', 'b70_sombras', 'b70_ficha']) expect(G.s.beatsSeen, k).toContain(k);
    checkMissions();
    expect(done('H70')).toBe(true);
    expect(active('H71')).toBe(true);
    // a flow that is played again plays nothing (all its substeps are seen)
    said.length = 0;
    await F.playStoryFlow('h70_doneria');
    expect(said.length).toBe(0);

    // H71: Brecha at La Última Ronda (revealed by H70), then the close
    reload();
    expect(GT.nodeState(B, 'ebrecha')).toBe('open');
    GB.applyGateraResult(B, 'ebrecha', won);
    checkMissions();
    expect(done('H71')).toBe(true);
    expect(await F.playStoryFlow('h71_cierre')).toBe('done');
    expect(allSaid()).toContain('DOÑA ESPUMA: El Cadenero. Desde anoche no deja entrar a nadie al baño.');
    expect(active('H72')).toBe(true);

    // H72: the morning — your order for three places, the bar last
    picks.push('parque', 'doneria');
    said.length = 0;
    expect(await F.playStoryFlow('h72_resaca')).toBe('done');
    const morning = allSaid();
    expect(morning.indexOf('CANELO: Luz… ¿tú te acuerdas de cuando estabas viva?')).toBeLessThan(morning.indexOf('HOMIAU: ¡ME ACUERDO DE ANOCHE!'));
    expect(morning.indexOf('HIPÓLITO: ¿Y luego?')).toBeGreaterThan(morning.indexOf('LUZTERNA: ¿Y tú qué miras?'));
    checkMissions();
    expect(done('H72')).toBe(true);
    expect(active('H73')).toBe(true);

    // H73: the mob, the Batalla de Gatos (revealed by H72), F06 (its lines), the calm close
    reload();
    expect(GT.nodeState(B, 'eemiau')).toBe('open');
    expect(await F.playStoryFlow('h73_entrada')).toBe('done');
    GB.applyGateraResult(B, 'eemiau', won);
    checkMissions();
    expect(done('H73')).toBe(true);
    said.length = 0;
    expect(await F.playStoryFlow('h73_emen')).toBe('done');
    expect(allSaid()).toContain('CANELO: Si esto lo rompí yo, lo arreglo yo; y si alguien paga… pago yo.');
    expect(allSaid()).toContain('EMIAU: Le tiene miedo a lo que suena ahí adentro.');
    expect(active('H74')).toBe(true);

    // H74: El Cadenero opens now (story gate), the warning, OH SHIT; then Superhéroes' story gate is met
    for (let n = 6; n <= 8; n++) GT.recordWin(B, n);
    reload();
    expect(GT.stageState(B, 9)).toBe('open');
    expect(await F.playStoryFlow('h74_lista')).toBe('done');
    GB.applyGateraResult(B, 9, won);
    checkMissions();
    expect(done('H74')).toBe(true);
    said.length = 0;
    expect(await F.playStoryFlow('h74_aviso')).toBe('done');
    expect(allSaid()).toContain('BORRÓN: No sigan. Mis jefes vienen siguiendo una luz.');
    expect(allSaid()).toContain('CANELO: Una noche nomás, dijo.');
    expect(GT.dimDef('p3d_superheroes').story).toBe('mission:H74');
    // the Acto II is in: Maneki sells the Comic once H74 is done (story gate; huellas and gold are its other keys)
    expect(GT.storyAllows('p3d_superheroes')).toBe(true);
    // everything survives a reload
    reload();
    for (const id of ['H69', ...ACTO1]) expect(done(id), id).toBe(true);
    for (const k of ['b70_ficha', 'b71_cierre', 'b72_resaca', 'b73_despues', 'b74_ohshit']) expect(G.s.beatsSeen, k).toContain(k);
  }, 60_000);

  it('nothing deadlocks: while each mission is active, what it needs is reachable', () => {
    atH69();
    const need: Record<string, () => boolean> = {
      // a scene on the Carta (its flow is queued by the mission's ON_NEW)
      H70: () => S.P3_ON_NEW.H70.some((r) => r.special === 'flow' && r.flow === 'h70_doneria'),
      H71: () => GT.nodeState(B, 'ebrecha') === 'open',
      H72: () => S.P3_ON_NEW.H72.some((r) => r.special === 'flow' && r.flow === 'h72_resaca'),
      H73: () => GT.nodeState(B, 'eemiau') === 'open',
      H74: () => GT.stageState(B, 9) === 'open' || GT.clearedIn(B) < 8,
    };
    for (const [i, id] of ACTO1.entries()) {
      G.s.missions.done = [...new Set([...G.s.missions.done, 'H69', ...ACTO1.slice(0, i)])];
      G.s.missions.active = [id];
      expect(need[id](), id).toBe(true);
    }
  });
});

describe('old saves and the films', () => {
  it('no fixture gets an Acto I mission or a Parte III slice by loading; save → reload stays the same', () => {
    for (const f of FIX) {
      mem.clear();
      mem.set(SAVE_KEY, raw(f));
      G.load();
      // the fixtures from before the Parte III never get a slice by loading (h69-acto1 was built with one)
      if (!raw(f).includes('"gateras"')) expect(G.s.ext?.gateras, f).toBeUndefined();
      const once = JSON.stringify({ ...G.s, savedAt: 0 });
      reload();
      expect(JSON.stringify({ ...G.s, savedAt: 0 }), f).toBe(once);
      checkMissions();
      // the chain fixtures (scripts/make-act-fixtures.ts) are saves that already played the Acto I
      if (/^h(75|83|89|93)-/.test(f)) continue;
      for (const id of ACTO1) expect(active(id) || done(id), `${f}: ${id}`).toBe(false);
    }
  });

  it('a registered film plays (song films unskippable the first time), is marked seen and listed in «Volver a ver»', async () => {
    atH69();
    const played: { id: unknown; seen: boolean }[] = [];
    SI.setFilmPort({ has: (id) => id === 'f06', play: async (id, o) => (played.push({ id, seen: o.seen }), { end: 'done' }) });
    G.s.missions.done.push('H69', 'H70', 'H71', 'H72', 'H73');
    expect(await F.playStoryFlow('h73_emen')).toBe('done');
    expect(played).toEqual([{ id: 'f06', seen: false }]);
    // the film replaced its fallback lines
    expect(allSaid()).not.toContain('HOMIAU: ¡Del cumpleaños de mi hija!');
    expect(SI.filmSeen('F06')).toBe(true);
    expect(SI.seenFilms()).toEqual([{ id: 'film:f06', title: 'Cuadra 8' }]);
    // an aborted film is played again later (the substep isn't marked)
    G.s.beatsSeen = G.s.beatsSeen.filter((k) => k !== 'b74_ohshit');
    SI.setFilmPort({ has: () => true, play: async () => ({ end: 'aborted' }) });
    G.s.beatsSeen.push('b74_aviso');
    expect(await F.playStoryFlow('h74_aviso')).toBe('interrupted');
    expect(G.s.beatsSeen).not.toContain('b74_ohshit');
  });

  it('F04 is six films: the prologue, the three places in YOUR order, the bar, the epilogue; a cut resumes at the next one', async () => {
    atH69();
    G.s.missions.done.push('H69', 'H70', 'H71');
    const played: string[] = [];
    let abortAt = 'f04_hipomart';
    SI.setFilmPort({ has: (id) => String(id).startsWith('f04_'), play: async (id) => (played.push(String(id)), { end: id === abortAt ? 'aborted' : 'done' }) });
    // the order the player picks: el parque, then El Hipo-Mart (La Donería is the one left)
    picks.push('parque', 'hipomart');
    expect(await F.playStoryFlow('h72_resaca')).toBe('interrupted');
    expect(played).toEqual(['f04_prologo', 'f04_parque', 'f04_hipomart']);
    expect(G.s.beatsSeen).toEqual(expect.arrayContaining(['b72_prologo', 'b72_parque']));
    expect(G.s.beatsSeen).not.toContain('b72_hipomart');
    expect(G.s.counters.feature_p3_resaca ?? 0).toBe(0);
    // again (the reload): straight to the Hipo-Mart, then La Donería, the bar, the epilogue
    abortAt = '';
    picks.push('hipomart');
    played.length = 0;
    expect(await F.playStoryFlow('h72_resaca')).toBe('done');
    expect(played).toEqual(['f04_hipomart', 'f04_doneria', 'f04_bar', 'f04_epilogo']);
    expect(G.s.counters.feature_p3_resaca).toBe(1);
    expect(SI.seenFilms().map((x) => x.id)).toEqual(['film:f04_prologo', 'film:f04_doneria', 'film:f04_hipomart', 'film:f04_parque', 'film:f04_bar', 'film:f04_epilogo']);
  });
});
