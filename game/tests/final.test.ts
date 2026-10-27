/**
 * ⚠️ SPOILERS — Parte III · EL FINAL «Se apaga» (H93 → H97), NARRATIVA's scripts integrated (MECÁNICAS-IMPL).
 *
 *   · the data: H93–H97 chained after H92, the map's cards word for word, DORMANT behind FINAL_GATE (the Actos II–IV
 *     aren't in the game), every speaker registered, no goal that says «protégela / sálvala / aguanta»
 *   · the walk: from test-saves/h93-final.json (scripts/make-act-fixtures.ts) through the siege, the night, the dawn,
 *     SADIE, «A oscuras», the vigil, the errand and the bar — a reload at every substep resumes there, nothing replays
 *   · Canelo: his cabin benched the night of H94, his flame at 30 % for good (ext.fin, additive + its migrations)
 *   · after her death she never comes back alive by accident: the voice defaults, the dialog, the portraits (scan)
 *   · the battles: the siege's quiet win, «A oscuras» can't be lost and ends with «MIRA»
 * The dialog, the prompts, the small playable pieces and the story lines are stubbed (no Pixi); the flows are real.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';

const said: [string, string][][] = [];
vi.mock('../src/ui/dialog', () => ({
  say: async (lines: [string, string][]) => {
    const { ghostLines } = await import('../src/ui/story/ghost');
    said.push(ghostLines(lines));
  },
  storyLayer: () => ({}),
}));
const picks: string[] = [];
vi.mock('../src/ui/story/profile', () => ({
  choicePrompt: async (_l: unknown, o: { options: { value: string }[] }) => {
    const want = picks.shift();
    return (o.options.find((x) => x.value === want) ?? o.options[0]).value;
  },
}));
const ui: string[] = [];
vi.mock('../src/ui/story/finalUi', () => ({
  onePress: async (label: string) => void ui.push(`press:${label}`),
  desayuno: async (cats: unknown[]) => (ui.push(`desayuno:${cats.length}`), 2),
  oscurasMira: async () => (ui.push('mira'), 'tap'),
  diselo: async (note: string, _a: string, gris: string) => void ui.push(`diselo:${note}|${gris}`),
  loQueQuedo: async () => void ui.push('quedo'),
  LISTA_ESCONDIDA: [],
  SOBRECITO: '',
}));
vi.mock('../src/app/flow', () => ({ goIsland: async () => void ui.push('home') }));
vi.mock('../src/app/story', async () => {
  const { BEAT_BY_ID } = await import('../src/data/content');
  const { gtxt } = await import('../src/ui/gender');
  return { storyLines: (beat: string, idx?: number[]) => (idx ?? BEAT_BY_ID.get(beat)!.lines.map((_, i) => i)).map((i) => [BEAT_BY_ID.get(beat)!.lines[i][0], gtxt(BEAT_BY_ID.get(beat)!.lines[i][1])]) };
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
const { MISSION_GATES, FINAL_GATE } = await import('../src/state/sys/missionGoals');
const GW = await import('../src/state/sys/gaterasWorld');
const FS = await import('../src/state/sys/finalState');
const FB = await import('../src/state/sys/finalBattles');
const SHIP = await import('../src/state/sys/ship');
const SI = await import('../src/app/stageIntro');
const F = await import('../src/app/finalFlow');
const S = await import('../src/ui/story/gaterasScript');
const GH = await import('../src/ui/story/ghost');
const { speaker } = await import('../src/ui/story/text');
const { autoBattle } = await import('../src/battle/autoplay');
const { DIFFICULTY } = await import('../src/battle/ai');

const FINAL = ['H93', 'H94', 'H95', 'H96', 'H97'];
const FIX = readdirSync(new URL('../test-saves/', import.meta.url)).filter((f) => f.endsWith('.json'));
const raw = (f: string) => readFileSync(new URL(`../test-saves/${f}`, import.meta.url), 'utf8');
const battles: string[] = [];
let lose = 0;

beforeEach(() => {
  said.length = 0;
  picks.length = 0;
  ui.length = 0;
  battles.length = 0;
  lose = 0;
  F.FINAL_TIMING.laterMs = 0;
  F.FINAL_OPTS.oscuras = 'auto';
  SI.setFilmPort({ has: () => false, play: async () => null });
  F.setFinalBattlePort(async (id) => {
    battles.push(id);
    if (lose > 0) {
      lose--;
      return 'lost';
    }
    return 'won';
  });
});

function atH93() {
  mem.clear();
  mem.set(SAVE_KEY, raw('h93-final.json'));
  G.load();
  expect(G.loaded).toBe(true);
  checkMissions();
  expect(G.s.missions.active).toContain('H93');
}
const reload = () => {
  G.save();
  G.load();
  expect(G.loaded).toBe(true);
};
const active = (id: string) => G.s.missions.active.includes(id);
const done = (id: string) => G.s.missions.done.includes(id);
const allSaid = () => said.flat().map(([sp, t]) => `${sp}: ${t}`);
const canelo = () => G.s.cats.find((c) => c.species === 'c_canelo')!;

describe('the finale data: NARRATIVA word for word, dormant until the Actos II–IV', () => {
  it('H93–H97 chain after H92, their goals, no prize at the time (the mourning), the map’s cards (02-mapa §7.1)', () => {
    const want: Record<string, [string, string, string]> = {
      H93: ['La noche más oscura', 'mission:H92', 'p3_asedio'],
      H94: ['Sin llama', 'mission:H93', 'p3_sin_llama'],
      H95: ['Lo que no se ve', 'mission:H94', 'p3_vigilia'],
      H96: ['El recado', 'mission:H95', 'p3_recado'],
      H97: ['La última ronda', 'mission:H96', 'p3_ultima_ronda'],
    };
    for (const [id, [title, trigger, feature]] of Object.entries(want)) {
      const m = MISSION_BY_ID.get(id)!;
      expect(m.title, id).toBe(title);
      expect(m.trigger, id).toBe(trigger);
      expect(m.goal, id).toMatchObject({ type: 'use_feature', feature });
      expect(m.reward, id).toEqual({ std: false });
      expect(MISSION_GATES[id]?.flags, id).toEqual([FINAL_GATE]);
    }
    expect(MISSION_BY_ID.get('H93')!.card).toEqual({ pasa: 'Vienen esta noche', importa: 'Vienen por Cerito y por la luz', queremos: 'Que no se lo lleven', ahi: 'Es casa', cambio: 'SIN LLAMA.' });
    expect(MISSION_BY_ID.get('H94')!.card).toEqual({ pasa: 'El gordo no se levanta', importa: 'Es el gordo', queremos: 'Que vuelva', ahi: 'Es su palmera', cambio: 'Luzterna murió. Cerito eligió ser gato' });
    expect(MISSION_BY_ID.get('H95')!.card!.cambio).toBe('La Mano se olvidó de su nombre. Los gatos velaron toda la noche');
    expect(MISSION_BY_ID.get('H96')!.card!.cambio).toBe('El faro tiene luz de nuevo. No la suya');
    expect(MISSION_BY_ID.get('H97')!.card).toEqual({ pasa: 'Canelo volvió al bar', importa: 'Ahí empezó todo', queremos: 'Acompañarlo', ahi: 'La Última Ronda', cambio: 'Se acuerda. Todos los días' });
  });

  it('honesty (00-indice §2.5): no goal, why, card or line says «protégela», «sálvala», «aguanta» or «antes de que sea tarde»', () => {
    const bad = /protég|proteg|sálvala|salvala|aguanta|antes de que sea tarde|apúrate/i;
    for (const id of FINAL) {
      const m = MISSION_BY_ID.get(id)!;
      expect(JSON.stringify([m.goal, m.why, m.card]), id).not.toMatch(bad);
    }
    const beats = [...BEAT_BY_ID.values()].filter((b) => /^b9[3-7]_/.test(b.id));
    expect(beats.length).toBe(14);
    for (const b of beats) expect(JSON.stringify(b.lines), b.id).not.toMatch(bad);
    expect(FB.FINAL_BATTLES.oscuras.lines).toEqual(['Que no se lleven a Cerito']);
  });

  it('pasada 7: the b94_amanecer indexes read the right lines (the switch on; the control indexes stay valid)', () => {
    const L = BEAT_BY_ID.get('b94_amanecer')!.lines;
    const A = F.FINAL_LINES.b94_amanecer;
    const txt = (ix: readonly number[]) => ix.map((i) => L[i]?.[1]);
    expect(txt(A.regreso)).toContain('Me debes un vidrio, gordo.');
    expect(txt(A.regreso)).toContain('CANELO · LLAMA 30 %');
    expect(txt(A.golpe)[0]).toMatch(/^Luzterna levanta la linterna/);
    expect(txt(A.trazo)).toEqual(['…Entonces la luz primero.', '…y tú, si te vuelves a morir, te mato—', '…Ah.']);
    // the control's own return line (Cerito alone, no cost to her) is there for the switch off
    expect(L[14]?.[1]).toMatch(/Una chispa\. Después la llama… chiquita\.$/);
    expect(new Set([...A.regreso, ...A.golpe]).size).toBe(A.regreso.length + A.golpe.length);
  });

  it('every speaker of the finale is registered (stand-ins where art is missing); CERITO never speaks; Canelo talks only at the bar', () => {
    const fb = speaker('__NADIE__');
    for (const b of [...BEAT_BY_ID.values()].filter((x) => /^b9[3-7]_/.test(x.id))) {
      for (const [sp] of b.lines) {
        const s = speaker(sp);
        expect(s.kind !== fb.kind || s.slug !== fb.slug || s.band !== fb.band, `${b.id}: ${sp}`).toBe(true);
        expect(sp, b.id).not.toBe('CERITO');
        if (sp === 'CANELO') expect(b.id).toBe('b97_bar');
      }
    }
    // the lines as written: the blow is cut, the errand comes back whole
    const golpe = BEAT_BY_ID.get('b94_amanecer')!.lines.map((l) => l[1]);
    expect(golpe).toContain('…y tú, si te vuelves a morir, te mato—');
    expect(golpe).toContain('…Entonces la luz primero.');
    expect(BEAT_BY_ID.get('b96_recado')!.lines[3]).toEqual(['BITÁCORA', 'Dice que tu bufanda siempre le pareció horrible. Con cariño.']);
    expect(BEAT_BY_ID.get('b97_bar')!.lines.slice(3, 6).map((l) => l[1])).toEqual(['Ella siempre venía a buscarme.', '¿Y luego?', 'Luego me acuerdo de ella. Todos los días.']);
  });

  it('dormant: no fixture wakes the finale; H92 done alone doesn’t either; with the gate it does', () => {
    for (const f of FIX.filter((x) => x !== 'h93-final.json')) {
      mem.clear();
      mem.set(SAVE_KEY, raw(f));
      G.load();
      if (!G.loaded) continue;
      checkMissions();
      for (const id of FINAL) expect(active(id) || done(id), `${f}: ${id}`).toBe(false);
      // only the story writes ext.fin: after H85 (the Acto III) Canelo's flame is stored at 60 %
      if (!/^h89-/.test(f)) expect(G.s.ext?.fin, f).toBeUndefined();
      else expect(G.s.ext?.fin, f).toEqual({ v: 1, llama: 60 });
    }
    atH93();
    G.s.missions.active = G.s.missions.active.filter((x) => x !== 'H93');
    G.s.flags[FINAL_GATE] = false;
    checkMissions();
    expect(active('H93')).toBe(false);
    G.flag(FINAL_GATE);
    checkMissions();
    expect(active('H93')).toBe(true);
  });
});

describe('the walk: H93 → H97 on the fixture, a reload at every step', () => {
  it('the siege (lost once, retried), F32 instead of a victory screen; the night with Canelo benched', async () => {
    atH93();
    // lost once: «¡OTRA VEZ!» — the same fight again, at no cost
    lose = 1;
    picks.push('go');
    expect(await F.playStoryFlow('h93_asedio')).toBe('done');
    expect(battles).toEqual(['asedio1', 'asedio1', 'asedio2']);
    expect(allSaid()).toContain('ITŌ: Vienen esta noche. Por los ojos del gato.');
    expect(allSaid()).toContain('LUZTERNA: Al gordo no.');
    for (const k of F.FINAL_BEATS.H93) expect(G.s.beatsSeen, k).toContain(k);
    checkMissions();
    expect(done('H93')).toBe(true);
    expect(active('H94')).toBe(true);
    // the night: his flame went out — his cabin stays his, greyed out; he doesn't sail
    expect(GW.caneloSinLlama()).toBe(true);
    expect(FS.llamaCanelo()).toBe(0);
    expect(FS.llamaLabel()).toBe('SIN LLAMA');
    const c = canelo();
    const ship = G.s.ship.active;
    G.s.ship.crew[ship] = [c.uid, ...(G.s.ship.crew[ship] ?? []).filter((u) => u !== c.uid)].slice(0, SHIP.crewSize(ship));
    expect(SHIP.benched(c.uid)).toBe(true);
    expect(SHIP.crew()).not.toContain(c.uid);
    // re-choosing the crew that night keeps his cabin his (he's back at dawn, where he was)
    SHIP.setCrew(ship, SHIP.crew());
    expect(G.s.ship.crew[ship]).toContain(c.uid);
    SHIP.autoCrew(ship);
    expect(SHIP.crew()).not.toContain(c.uid);
    // she is alive all night
    expect(GW.luzternaFallecida()).toBe(false);
    reload();
    // «AHORA NO»: the flow waits, nothing is lost
    G.s.beatsSeen = G.s.beatsSeen.filter((k) => k !== 'b93_asedio1' && k !== 'b93_asedio2' && k !== 'b93_asedio' && k !== 'b93_caida');
    lose = 1;
    picks.push('later');
    F.FINAL_TIMING.laterMs = 60_000;
    expect(await F.playStoryFlow('h93_asedio')).toBe('interrupted');
    expect(await F.playStoryFlow('h93_asedio')).toBe('interrupted');
  });

  it('H94: the night, the dawn (30 % for good), the breakfast, the blow, SADIE once, «A oscuras», MIRA', async () => {
    atH93();
    expect(await F.playStoryFlow('h93_asedio')).toBe('done');
    checkMissions();
    reload();
    // a reload in the middle of the night: back to the night, never to the fall
    G.s.beatsSeen.push('b94_noche');
    reload();
    said.length = 0;
    battles.length = 0;
    // the dawn is cut (the scene went away): resumes there
    SI.setFilmPort({ has: (id) => id === 'f34_amanecer', play: async () => ({ end: 'aborted' }) });
    expect(await F.playStoryFlow('h94_sin_llama')).toBe('interrupted');
    expect(G.s.beatsSeen).not.toContain('b94_amanecer');
    expect(allSaid().some((l) => l.includes('Intenta prenderle la llama'))).toBe(false);
    SI.setFilmPort({ has: () => false, play: async () => null });
    reload();
    expect(await F.playStoryFlow('h94_sin_llama')).toBe('done');
    expect(allSaid()).toContain('LA MANO: …Entonces la luz primero.');
    expect(allSaid()).toContain('LUZTERNA: …Ah.');
    // pasada 7 (deuda falsa pagada): without the films, the fallback still tells it — together, the black pane, her joke
    expect(allSaid()).toContain('LUZTERNA: Me debes un vidrio, gordo.');
    expect(allSaid().some((l) => l.includes('Juntos, la chispa prende') && l.includes('vidrios de la linterna se pone negro'))).toBe(true);
    // each line once, in story order: the joke before the relief, the relief before the blow, the blow before «…Ah.»
    const order = ['LUZTERNA: Me debes un vidrio, gordo.', 'LUZTERNA: ¡Y eso no es desayuno, es un atentado!', 'LA MANO: La luz cuida lo que alumbra. A quien la carga, no.', 'LUZTERNA: …Ah.'].map((x) => allSaid().indexOf(x));
    expect(order.every((x, i) => x >= 0 && (i === 0 || x > order[i - 1]))).toBe(true);
    expect(allSaid().filter((l) => l === 'LA MANO: …Entonces la luz primero.').length).toBe(1);
    // SADIE's lines are hers (a memory: her own last scene)
    expect(allSaid()).toContain('LUZTERNA: Cuida la página, gordo. Y no te la comas.');
    expect(ui.some((x) => x.startsWith('desayuno:'))).toBe(true);
    // no F36: the 3-turn battle that can't be lost
    expect(battles).toEqual(['oscuras']);
    for (const k of F.FINAL_BEATS.H94) expect(G.s.beatsSeen, k).toContain(k);
    expect(FS.llamaCanelo()).toBe(30);
    expect(G.s.ext?.fin).toMatchObject({ v: 1, llama: 30 });
    expect(SHIP.benched(canelo().uid)).toBe(false);
    expect(GW.luzternaFallecida()).toBe(true);
    expect(GW.dueloActivo()).toBe(true);
    checkMissions();
    expect(done('H94')).toBe(true);
    // a reload after SADIE: it never plays again, and she is never alive again outside «Volver a ver»
    reload();
    said.length = 0;
    expect(await F.playStoryFlow('h94_sin_llama')).toBe('done');
    expect(said.length).toBe(0);
    expect(GH.ghostLines([['LUZTERNA', 'hola']])).toEqual([['BITÁCORA', 'hola']]);
    expect(await GH.asMemory(async () => GH.ghostLines([['LUZTERNA', 'hola']]))).toEqual([['LUZTERNA', 'hola']]);
    // the flame never goes back up
    FS.setLlama(80);
    expect(FS.llamaCanelo()).toBe(30);
  });

  it('with F36 registered «A oscuras» is only its input (MIRA), then the film', async () => {
    atH93();
    expect(await F.playStoryFlow('h93_asedio')).toBe('done');
    checkMissions();
    const played: string[] = [];
    SI.setFilmPort({ has: (id) => id === 'f36_mira', ids: () => ['f36_mira'], play: async (id) => (played.push(String(id)), { end: 'done' }) });
    battles.length = 0;
    expect(await F.playStoryFlow('h94_sin_llama')).toBe('done');
    expect(battles).toEqual([]);
    expect(ui).toContain('mira');
    expect(played).toEqual(['f36_mira']);
    const fin = SI.seenFilms().filter((x) => /^film:f(3\d|40)/.test(x.id));
    expect(fin).toEqual([{ id: 'film:f36_mira', title: 'MIRA' }]);
  });

  it('SADIE cut short (the tab closed mid-song): never replayed, but listed in «Volver a ver»; its first view is unskippable (QA-P3)', async () => {
    atH93();
    expect(await F.playStoryFlow('h93_asedio')).toBe('done');
    checkMissions();
    const played: [string, boolean][] = [];
    SI.setFilmPort({ has: (id) => id === 'f35_sadie', ids: () => ['f35_sadie'], play: async (id, o) => (played.push([String(id), o.seen]), { end: 'aborted' }) });
    await F.playStoryFlow('h94_sin_llama');
    expect(played).toEqual([['f35_sadie', false]]);
    expect(SI.seenFilms().map((x) => x.id)).toContain('film:f35_sadie');
    reload();
    played.length = 0;
    expect(await F.playStoryFlow('h94_sin_llama')).toBe('done');
    expect(played).toEqual([]);
  });

  it('CINE\'s split films all play: F34 3/3 (the stroke) before SADIE; F39 credits and «Continuará» after the errand (QA-P3)', async () => {
    atH93();
    expect(await F.playStoryFlow('h93_asedio')).toBe('done');
    checkMissions();
    const HAS = ['f34_amanecer', 'f34_golpe', 'f34_trazo', 'f35_sadie', 'f39_recado', 'f39_creditos', 'f39_continuara'];
    const played: string[] = [];
    SI.setFilmPort({ has: (id) => HAS.includes(id), ids: () => HAS, play: async (id) => (played.push(String(id)), { end: 'done' }) });
    expect(await F.playStoryFlow('h94_sin_llama')).toBe('done');
    expect(played).toEqual(['f34_amanecer', 'f34_golpe', 'f34_trazo', 'f35_sadie']);
    checkMissions();
    expect(await F.playStoryFlow('h95_vigilia')).toBe('done');
    checkMissions();
    played.length = 0;
    expect(await F.playStoryFlow('h96_recado')).toBe('done');
    expect(played).toEqual(['f39_recado', 'f39_creditos', 'f39_continuara']);
    for (const k of ['b96_recado', 'b96_luz', 'b96_creditos', 'b96_continuara']) expect(G.s.beatsSeen, k).toContain(k);
    expect(SI.seenFilms().map((x) => x.id)).toEqual(expect.arrayContaining(['film:f34_trazo', 'film:f39_creditos', 'film:f39_continuara']));
  });

  it('H95–H97: the lantern on the step and on the shelf, DÍSELO, the orange faro, «Continuará» ends the mourning, the bar', async () => {
    atH93();
    expect(await F.playStoryFlow('h93_asedio')).toBe('done');
    checkMissions();
    expect(await F.playStoryFlow('h94_sin_llama')).toBe('done');
    checkMissions();
    expect(active('H95')).toBe(true);
    reload();
    expect(await F.playStoryFlow('h95_vigilia')).toBe('done');
    expect(allSaid()).toContain('BORRÓN: Así le pasó a Itō. El que ve ya no puede tachar.');
    expect(ui).toContain('press:Seguir');
    expect(FS.linterna()).toBe('escalon');
    checkMissions();
    expect(done('H95')).toBe(true);
    reload();
    // the errand: cut after DÍSELO, resumes at the faro
    said.length = 0;
    G.s.beatsSeen.push('b96_recado');
    reload();
    expect(GW.dueloActivo()).toBe(true);
    expect(await F.playStoryFlow('h96_recado')).toBe('done');
    expect(ui.some((x) => x.startsWith('diselo:'))).toBe(false);
    expect(allSaid()).toContain('CAPTION: Continuará.');
    expect(FS.linterna()).toBe('estante');
    expect(FS.faroNaranja()).toBe(true);
    expect(GW.dueloActivo()).toBe(false);
    checkMissions();
    expect(done('H96')).toBe(true);
    // «Lo que quedó»: waiting for the notebook; its prizes once, in silence
    expect(FS.loQueQuedoDue()).toBe(true);
    const g0 = G.s.gems;
    FS.markQuedo();
    expect(FS.payPremiosFinal()).toBe(true);
    expect(FS.payPremiosFinal()).toBe(false);
    expect(G.s.gems).toBe(g0 + FS.PREMIOS_FINAL.gems);
    expect(FS.loQueQuedoDue()).toBe(false);
    expect(active('H97')).toBe(true);
    reload();
    said.length = 0;
    expect(await F.playStoryFlow('h97_bar')).toBe('done');
    expect(allSaid()).toContain('CANELO: Luego me acuerdo de ella. Todos los días.');
    checkMissions();
    for (const id of FINAL) expect(done(id), id).toBe(true);
    reload();
    expect(G.s.ext?.fin).toMatchObject({ v: 1, llama: 30, faro: 'naranja', linterna: 'estante', quedo: true, premios: true });
  });

  it('DÍSELO without the film: the Part I note with the player’s name, what she said that night in grey', async () => {
    atH93();
    G.s.player = { name: 'Rocío', gender: 'f' };
    for (const id of ['H93', 'H94', 'H95']) {
      G.s.missions.done.push(id);
      G.s.missions.active = G.s.missions.active.filter((x) => x !== id);
    }
    G.s.beatsSeen.push('b94_sadie');
    expect(await F.playStoryFlow('h96_recado')).toBe('done');
    const d = ui.find((x) => x.startsWith('diselo:'))!;
    expect(d).toContain('…Si algo me pasa, Rocío, dile a Canelo que su bufanda siempre me pareció horrible. Con cariño.');
    expect(d).toContain('Gordo… tu bufanda… siempre me… …me pareció horrible.');
    expect(allSaid()).toContain('BITÁCORA: Dice que tu bufanda siempre le pareció horrible. Con cariño.');
  });

  it('the director: the cards and flows of the finale, in order; at home (H93–H96) and on the Carta (H97); nothing deadlocks', () => {
    for (const id of FINAL) {
      const refs = S.P3_ON_NEW[id];
      expect(refs[0]).toMatchObject({ special: 'card', mission: id, phase: 'new' });
      expect(refs[1]).toMatchObject({ special: 'flow', after: S.cardKey(id, 'new'), onlyOn: id === 'H97' ? 'cajas' : 'island' });
      expect(F.FINAL_FLOWS).toContain(refs[1].flow);
      expect(S.P3_ON_DONE[id][0]).toMatchObject({ special: 'card', mission: id, phase: 'done' });
      expect(S.P3_COVERED).toContain(id);
    }
    // each mission's goal is met by its own flow (features), so the chain can't stall
    const src = readFileSync(new URL('../src/app/finalFlow.ts', import.meta.url), 'utf8');
    for (const id of FINAL) expect(src, id).toContain(`G.count('feature_${(MISSION_BY_ID.get(id)!.goal as { feature: string }).feature}')`);
  });
});

describe('ext.fin: additive, never subtracts, migrations', () => {
  it('a v1 slice reads back byte for byte; broken fields and broken slices are set aside; the flame clamps', () => {
    const v1 = { v: 1, llama: 30, faro: 'naranja', linterna: 'estante', quedo: true, premios: true, futuro: { x: 1 } };
    expect(FS.normalizeFin(JSON.parse(JSON.stringify(v1)))).toEqual(v1);
    expect(FS.normalizeFin({ v: 1, llama: '30', faro: 'azul', linterna: 3, quedo: 'sí' })).toEqual({ v: 1, llamaBroken: '30', faroBroken: 'azul', linternaBroken: 3, quedoBroken: 'sí' });
    expect(FS.normalizeFin({ llama: 250 })).toEqual({ v: 1, llama: 100 });
    expect(FS.normalizeFin([1, 2])).toBeNull();
    // through a real load
    atH93();
    G.s.ext = { ...(G.s.ext ?? {}), fin: 'roto' };
    reload();
    expect(G.s.ext?.fin).toBeUndefined();
    expect(G.s.ext?.finBroken).toBe('roto');
    G.s.ext!.fin = { ...v1 };
    reload();
    expect(G.s.ext?.fin).toEqual(v1);
    // the fixture carries only what the story wrote before the finale: the flame at 60 % (H85)
    expect(JSON.parse(raw('h93-final.json')).state.ext?.fin).toEqual({ v: 1, llama: 60 });
  });
});

describe('after her death she never comes back alive by accident (guard)', () => {
  it('the voice of every surface after H94 is not hers; before it, it is', () => {
    atH93();
    expect(GH.luzternaAllowed()).toBe(true);
    expect(GH.tipSpeaker()).toBe('LUZTERNA');
    G.s.beatsSeen.push('b94_sadie');
    expect(GW.luzternaFallecida()).toBe(true);
    const surfaces = ['tip', 'mision_nueva', 'mision_firma', 'mision_cumplida', 'reino', 'glosario', 'novedades', 'offline', 'nombrar', 'faro', 'islas3d', 'presentaciones', 'ajustes'] as const;
    for (const s of surfaces) {
      const v = GW.voiceFor(s);
      expect(v.speaker, s).not.toBe('LUZTERNA');
      expect(v.portrait, s).toBe(false);
    }
    expect(GH.luzternaAllowed()).toBe(false);
    expect(GH.luzternaPortraitOk()).toBe(false);
    expect(GH.tipSpeaker()).toBe('BITÁCORA');
    expect(GH.tipSpeaker('LUZTERNA')).toBe('BITÁCORA');
    expect(GH.tipSpeaker('HIPÓLITO')).toBe('HIPÓLITO');
    expect(GH.dueloMuted()).toBe(true);
  });

  it('scan: no default voice is hers and every portrait of her asks first (dialog, tip, NOVEDADES, offline, prompts, rewards…)', () => {
    const files = (dir: string): string[] =>
      readdirSync(new URL(`../src/${dir}/`, import.meta.url), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(`${dir}/${e.name}`) : e.name.endsWith('.ts') ? [`${dir}/${e.name}`] : []));
    const read = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8');
    const all = ['ui', 'panels', 'app', 'scenes', 'state'].flatMap(files);
    const bad: string[] = [];
    for (const f of all) {
      const lines = read(f).split('\n');
      lines.forEach((l, i) => {
        // a speaker that falls back to her
        if (/\?\?\s*'LUZTERNA'/.test(l) && !f.endsWith('ui/story/ghost.ts') && !/\btip\(/.test(l)) bad.push(`${f}:${i + 1} ${l.trim()}`);
        // her portrait: built only where it asks luzternaPortraitOk() (same line or the two after)
        if (/new LuzternaPortrait\(/.test(l) && !lines.slice(i, i + 3).join('\n').includes('luzternaPortraitOk()') && !/scenes\/(PrologueScene|CajaScene)|scenes\/caja\//.test(f)) bad.push(`${f}:${i + 1} ${l.trim()}`);
      });
    }
    expect(bad).toEqual([]);
    const dialog = read('ui/dialog.ts');
    expect(dialog).toContain('lines = ghostLines(lines);');
    expect(dialog).toContain('speaker: tipSpeaker(o.speaker)');
    expect(dialog).toMatch(/if \(!o\.force && dueloMuted\(\)\) return;/);
    expect(read('ui/updatesPanel.ts')).toMatch(/luzternaAllowed\(\) \? `LUZTERNA: /);
    expect(read('ui/updatesPanel.ts')).toMatch(/dueloMuted\(\)/);
    expect(read('scenes/IslandScene.ts')).toMatch(/if \(luzternaFallecida\(\)\) return '';/);
    expect(read('panels/Replays.ts')).toContain('void asMemory(');
    expect(read('app/story.ts')).toContain('const muted = dueloMuted();');
  });

  it('the Bitácora changes hands: H93 hers (CAMBIÓ trembling), H94 hers until CAMBIÓ, H95+ the Capi’s', async () => {
    const src = readFileSync(new URL('../src/panels/Bitacora.ts', import.meta.url), 'utf8');
    // pure rule, mirrored here (the panel itself needs Pixi)
    const fn = src.slice(src.indexOf('export function handOf'), src.indexOf('/** a field written by the hand'));
    expect(fn).toContain("if (n === 93) return field === 'cambio' ? 'temblando' : 'ella';");
    expect(fn).toContain("if (n === 94) return field === 'cambio' ? 'capi' : 'ella';");
    expect(fn).toContain("return 'capi';");
  });
});

describe('the finale battles', () => {
  it('the siege: two quiet wins in a row; «A oscuras»: dark, MIRA on turn 3, it can’t be lost', () => {
    atH93();
    const a = FB.buildFinalBattle('asedio1', () => undefined);
    expect(a.final).toEqual({ quietWin: true });
    expect(a.intro?.tag).toBe('EL ASEDIO · 1 DE 2');
    expect(a.intro?.subtitle).toBe('Cruceta');
    expect(FB.buildFinalBattle('asedio2', () => undefined).intro?.subtitle).toBe('Firma');
    const o = FB.buildFinalBattle('oscuras', () => undefined);
    expect(o.final).toMatchObject({ quietWin: true, dark: true, mira: { turn: 3, auto: 4 } });
    expect(o.rules).toMatchObject({ undying: [0], retreat: { side: 1, turn: 4 } });
    expect(o.intro?.lines).toEqual(['Que no se lleven a Cerito']);
    // whatever happens, side 0 never loses: the ink ships leave after turn 3
    for (const seed of [1, 7, 23]) {
      const r = autoBattle(o, DIFFICULTY.easy, seed, 12);
      expect(r.won, `seed ${seed}`).toBe(true);
    }
  }, 60_000);
});
