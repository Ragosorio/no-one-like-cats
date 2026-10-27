/**
 * ⚠️ SPOILERS — Parte III · ACTOS II–IV (H75 → H92), NARRATIVA's scripts integrated (MECÁNICAS-IMPL).
 *
 *   · each act: its boxes in the data (shape, rule, rosters, gate), its missions chained, its beats with registered
 *     speakers, and a WALK from its fixture (scripts/make-act-fixtures.ts) with a reload at every step
 *   · the rules (battle/actRules.ts): deterministic, and each one does what it says
 *   · the chain: H66 → H97 without a gap (the last act sets `p3_final`; the finale wakes up)
 * The dialog, the prompts, the small playable pieces and the story lines are stubbed (no Pixi); the flows are real.
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
const ui: string[] = [];
vi.mock('../src/ui/story/finalUi', () => ({
  onePress: async (label: string) => void ui.push(`press:${label}`),
  desayuno: async () => 2,
  oscurasMira: async (_n: number, o: { label?: string } = {}) => (ui.push(`oscuras:${o.label ?? 'MIRA'}`), 'tap'),
  diselo: async () => void ui.push('diselo'),
  loQueQuedo: async () => void ui.push('quedo'),
  LISTA_ESCONDIDA: [],
  SOBRECITO: '',
}));
vi.mock('../src/app/flow', () => ({ goIsland: async () => void ui.push('home') }));
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
const AB = await import('../src/state/sys/actBattles');
const FS = await import('../src/state/sys/finalState');
const SI = await import('../src/app/stageIntro');
const AF = await import('../src/app/actsFlow');
const S = await import('../src/ui/story/gaterasScript');
const { speaker } = await import('../src/ui/story/text');
const { autoBattle, makeBattle } = await import('../src/battle/autoplay');
const { DIFFICULTY } = await import('../src/battle/ai');
const AR = await import('../src/battle/actRules');

type DimId = import('../src/state/sys/gateras').DimId;
const FIX = readdirSync(new URL('../test-saves/', import.meta.url)).filter((f) => f.endsWith('.json'));
const raw = (f: string) => readFileSync(new URL(`../test-saves/${f}`, import.meta.url), 'utf8');
const won = { won: true, reason: 'sunk', turns: 6, modulesDestroyed: 3, damageDealt: 100, catsLost: 0, perfect: false } as never;
const battles: string[] = [];
let lose = 0;

beforeEach(() => {
  said.length = 0;
  picks.length = 0;
  ui.length = 0;
  battles.length = 0;
  lose = 0;
  AF.ACTS_TIMING.laterMs = 0;
  SI.setFilmPort({ has: () => false, play: async () => null });
  AF.setActBattlePort(async (id) => {
    battles.push(id);
    if (lose > 0) {
      lose--;
      return 'lost';
    }
    return 'won';
  });
  AF.setFaroPort(async () => void ui.push('faro'));
});

function load(f: string) {
  mem.clear();
  mem.set(SAVE_KEY, raw(f));
  G.load();
  expect(G.loaded, f).toBe(true);
  checkMissions();
}
const reload = () => {
  G.save();
  G.load();
  expect(G.loaded).toBe(true);
};
const active = (id: string) => G.s.missions.active.includes(id);
const done = (id: string) => G.s.missions.done.includes(id);
const allSaid = () => said.flat().map(([sp, t]) => `${sp}: ${t}`);
function buy(dim: DimId) {
  G.s.gold = Math.max(G.s.gold, GT.gateraPrice(dim).gold * 2);
  const r = GT.buyGatera(dim);
  expect(r, dim).toMatchObject({ ok: true });
}
function win(dim: DimId, ...nodes: (string | number)[]) {
  for (const n of nodes) {
    expect(GT.nodeState(dim, String(n)), `${dim} ${n}`).toBe('open');
    GB.applyGateraResult(dim, n, won);
  }
}
const flow = async (id: string) => expect(await AF.playStoryFlow(id), id).toBe('done');
/** a mission's speakers are registered (stand-in portraits where the art is missing) */
function speakersOk(prefix: RegExp) {
  const fb = speaker('__NADIE__');
  const beats = [...BEAT_BY_ID.values()].filter((b) => prefix.test(b.id));
  expect(beats.length).toBeGreaterThan(0);
  for (const b of beats) for (const [sp] of b.lines) expect(speaker(sp).kind !== fb.kind || speaker(sp).slug !== fb.slug || speaker(sp).band !== fb.band, `${b.id}: ${sp}`).toBe(true);
}
/** every battle node a mission names is playable and every flow it queues exists */
function missionsOk(ids: string[]) {
  for (const [i, id] of ids.entries()) {
    const m = MISSION_BY_ID.get(id)!;
    expect(m, id).toBeTruthy();
    expect(m.trigger, id).toBe(`mission:H${Number(id.slice(1)) - 1}`);
    expect(m.card && Object.values(m.card).every((v) => typeof v === 'string' && v.length > 1), id).toBe(true);
    const g = m.goal as { type: string; battle?: string; feature?: string };
    if (g.type === 'win_battle') {
      const p = GT.parseBattleId(g.battle!);
      expect(p && GB.gateraBattleDef(p.dim, p.node), `${id}: ${g.battle}`).toBeTruthy();
    } else expect(Object.values(AF.ACT_FLOWS).some((f) => f.feature === g.feature), `${id}: ${g.feature}`).toBe(true);
    for (const r of [...(S.P3_ON_NEW[id] ?? []), ...(S.P3_ON_DONE[id] ?? [])]) if (r.special === 'flow') expect(AF.ACTS_FLOWS, `${id}: ${r.flow}`).toContain(r.flow);
    expect(S.P3_ON_NEW[id]?.[0], id).toMatchObject({ special: 'card', mission: id, phase: 'new' });
    void i;
  }
}

describe('Acto II «Se rompen las cajas» (H75–H82): the Comic and the Shōnen', () => {
  it('the data: the boxes (line / bracket), their rules, rosters, gates; the missions chained; speakers registered', () => {
    missionsOk(['H75', 'H76', 'H77', 'H78', 'H79', 'H80', 'H81', 'H82']);
    speakersOk(/^b(7[5-9]|8[0-2])_/);
    expect(GT.shapeOf('p3d_superheroes')).toBe('line');
    expect(GT.shapeOf('p3d_anime')).toBe('bracket');
    expect(GT.dimDef('p3d_superheroes').rules).toEqual({ onomatopeya: { frac: 0.07, ttl: 2 } });
    expect(GT.dimDef('p3d_anime').rules).toEqual({ poder: { mul: 1.25, below: 0.5 } });
    expect(GT.dimDef('p3d_anime').story).toBe('mission:H78');
    expect(MISSION_BY_ID.get('H75')!.card!.cambio).toBe('Mi luz «llama» a los que la ven');
    expect(MISSION_BY_ID.get('H82')!.card!.cambio).toBe('Le dije que no. Itō se fue. Y miró al gordo');
    // the story battles carry their rules into the spec (the estimate plays the same)
    load('h75-acto2.json');
    GT.openGatera('p3d_superheroes');
    GT.openGatera('p3d_anime');
    expect(GB.buildGateraBattle('p3d_superheroes', 5, () => undefined).rules).toMatchObject({ onomatopeya: { frac: 0.07 } });
    expect(GB.buildGateraBattle('p3d_superheroes', 'eestambre', () => undefined).rules).toMatchObject({ enredo: { side: 0 }, onomatopeya: {} });
    expect(GB.buildGateraBattle('p3d_superheroes', 9, () => undefined).rules?.pausas).toEqual([{ side: 1, turn: 3, kind: 'rescate' }]);
    const ito = GB.buildGateraBattle('p3d_anime', 'a9', () => undefined);
    expect(ito.rules).toMatchObject({ duelo: true, poder: { mul: 1.25 } });
    expect(ito.rules?.fases?.phases[1]).toMatchObject({ id: 'daria', endsBattle: true });
    expect(GB.gateraBattleDef('p3d_anime', 'a9')!.label).toBe('A-9');
    expect(GB.gateraBattleDef('p3d_anime', 'a5')!.film).toBe('F13');
  });

  it('the walk from h75-acto2: the Comic bought, its battles, home for Cerito, the tournament, a reload at every step', async () => {
    load('h75-acto2.json');
    expect(active('H75')).toBe(true);
    expect(FS.llamaLabel()).toBeNull();
    // H75: buy the Comic (Maneki: huellas + gold), the arrival, S-1…S-5
    expect(GT.storyAllows('p3d_superheroes')).toBe(true);
    buy('p3d_superheroes');
    expect(FS.llamaCanelo()).toBe(95);
    await flow('h75_llegada');
    expect(allSaid()).toContain('CANELO: Luz… ¿eso lo haces tú?');
    reload();
    win('p3d_superheroes', 1, 2, 3, 4, 5);
    checkMissions();
    expect(done('H75')).toBe(true);
    await flow('h75_cierre');
    expect(allSaid()).toContain('LUZTERNA: Yo no le pedí que llamara a nadie.');
    reload();
    // H76: El Estambre appears with H75
    expect(GT.nodeState('p3d_superheroes', 'eestambre')).toBe('open');
    win('p3d_superheroes', 'eestambre');
    checkMissions();
    expect(done('H76')).toBe(true);
    await flow('h76_cierre');
    reload();
    // H77: S-6…S-9 (Cruceta waits for H76)
    win('p3d_superheroes', 6, 7, 8, 9);
    checkMissions();
    expect(done('H77')).toBe(true);
    await flow('h77_cierre');
    expect(allSaid().some((l) => l.startsWith('MURCIÉGATO:'))).toBe(true);
    reload();
    // H78 (home): F12's lines, the blanket by the palm tree
    picks.push('palmera');
    await flow('h78_cerito');
    expect(G.has('cobija:palmera')).toBe(true);
    expect(allSaid()).toContain('LUZTERNA: Te voy a decir Cerito.');
    checkMissions();
    expect(done('H78')).toBe(true);
    reload();
    // H79: the Shōnen opens with H78; the bracket: a2 and a3 after a1, a4 after both
    expect(GT.storyAllows('p3d_anime')).toBe(true);
    buy('p3d_anime');
    expect(FS.llamaCanelo()).toBe(90);
    await flow('h79_maneki');
    win('p3d_anime', 'a1');
    expect(GT.nodeState('p3d_anime', 'a4')).toBe('locked');
    win('p3d_anime', 'a3', 'a2', 'a4', 'a5');
    checkMissions();
    expect(done('H79')).toBe(true);
    await flow('h79_llave');
    reload();
    // H80: three arcs, each a short battle — one lost and retried
    lose = 1;
    picks.push('go');
    await flow('h80_entrenamiento');
    expect(battles).toEqual(['t1', 't1', 't2', 't3']);
    expect(allSaid()).toContain('LUZTERNA: ¡RAYO DE… LUZ… TERNA! (en letras enormes)');
    checkMissions();
    expect(done('H80')).toBe(true);
    reload();
    // H81: Itō waits for H80; F16's lines close the battle
    win('p3d_anime', 'a6', 'a7', 'a8', 'a9');
    checkMissions();
    expect(done('H81')).toBe(true);
    await flow('h81_daria');
    expect(allSaid()).toContain('ITŌ: Al gato no. Así no.');
    reload();
    // H82: F17, the hand in the sky; Libros opens with it
    await flow('h82_vocacion');
    checkMissions();
    expect(done('H82')).toBe(true);
    for (const id of ['H75', 'H76', 'H77', 'H78', 'H79', 'H80', 'H81', 'H82']) expect(done(id), id).toBe(true);
    // a flow played again plays nothing (every step is seen)
    said.length = 0;
    await flow('h80_entrenamiento');
    expect(said.length).toBe(0);
  }, 60_000);

  it('H78: F12 asks the blanket itself — its input is kept and the prompt stays only as the fallback (QA-P3)', async () => {
    const played: string[] = [];
    const port = (end: 'done' | 'exited', cobija?: string) =>
      SI.setFilmPort({ has: (id) => id === 'f12', ids: () => ['f12'], play: async (id) => (played.push(String(id)), { end, inputs: cobija ? { cobija } : {} }) });
    // watched to the end, the palm chosen in the film: no prompt, the flag and the prompt's beat saved
    load('h75-acto2.json');
    port('done', 'right');
    picks.push('faro');
    await AF.playStoryFlow('h78_cerito');
    expect(played).toEqual(['f12']);
    expect(G.has('cobija:palmera')).toBe(true);
    expect(G.has('cobija:faro')).toBe(false);
    expect(picks).toEqual(['faro']);
    expect(G.s.beatsSeen).toContain('b78_cobija');
    // untouched: the film's own fallback (the lighthouse)
    load('h75-acto2.json');
    played.length = 0;
    picks.length = 0;
    port('done', 'left');
    await AF.playStoryFlow('h78_cerito');
    expect(G.has('cobija:faro')).toBe(true);
    // left before the end: the prompt asks
    load('h75-acto2.json');
    picks.length = 0;
    port('exited', 'left');
    picks.push('palmera');
    await AF.playStoryFlow('h78_cerito');
    expect(G.has('cobija:palmera')).toBe(true);
    expect(G.has('cobija:faro')).toBe(false);
    expect(picks).toEqual([]);
  });

  it('a reload in the middle of an activity resumes at the next arc; «AHORA NO» waits', async () => {
    load('h75-acto2.json');
    G.s.beatsSeen.push('b80_apertura', 'b80_tira1', 'b80_arco1');
    reload();
    lose = 1;
    picks.push('later');
    AF.ACTS_TIMING.laterMs = 60_000;
    expect(await AF.playStoryFlow('h80_entrenamiento')).toBe('interrupted');
    expect(battles).toEqual(['t2']);
    expect(await AF.playStoryFlow('h80_entrenamiento')).toBe('interrupted');
    expect(battles).toEqual(['t2']);
  });
});

describe('the rules of the boxes (battle/actRules.ts): deterministic, and each does what it says', () => {
  it('Onomatopeya, Poder, Duelo limpio, Pausas, Enredo: same seed, same battle; their effects show in the state', () => {
    load('h75-acto2.json');
    GT.openGatera('p3d_superheroes');
    GT.openGatera('p3d_anime');
    for (const [dim, node] of [['p3d_superheroes', 5], ['p3d_superheroes', 'eestambre'], ['p3d_superheroes', 9], ['p3d_anime', 'a5'], ['p3d_anime', 'a9']] as [DimId, string | number][]) {
      const a = autoBattle(GB.buildGateraBattle(dim, node, () => undefined), DIFFICULTY.hard, 77, 30);
      const b = autoBattle(GB.buildGateraBattle(dim, node, () => undefined), DIFFICULTY.hard, 77, 30);
      expect(JSON.stringify(a), `${dim} ${node}`).toBe(JSON.stringify(b));
    }
    // duelo: no volleys, no extra shots
    const ito = makeBattle(GB.buildGateraBattle('p3d_anime', 'a9', () => undefined), 5);
    expect(ito.cannons(0)).toEqual([]);
    expect(ito.cannons(1)).toEqual([]);
    expect(ito.extraShots(0)).toBe(0);
    // pausas: on Cruceta's 3rd turn his cats don't act
    const cr = makeBattle(GB.buildGateraBattle('p3d_superheroes', 9, () => undefined), 5);
    cr.turn = 3;
    const ev = cr.startTurn(1);
    expect(cr.sides[1].cats.filter((c) => !c.ko).every((c) => c.stunned > 0)).toBe(true);
    expect(ev.some((e) => e.k === 'info' && /GATITO/.test(e.text))).toBe(true);
    expect(AR.actRuleLines(cr.cfg.rules).join(' ')).toMatch(/RESCATE/);
  });
});

describe('Acto III «Lo que está escrito» (H83–H88): the Library', () => {
  it('the data: the shelf, Capítulos, the collapse, the Correctores, Esquirla; missions chained; speakers registered', () => {
    missionsOk(['H83', 'H84', 'H85', 'H86', 'H87', 'H88']);
    speakersOk(/^b8[3-8]_/);
    expect(GT.shapeOf('p3d_libros')).toBe('shelf');
    expect(GT.dimDef('p3d_libros').rules).toEqual({ capitulos: { every: 3, order: ['lluvia', 'calma', 'raiz'] } });
    expect(GT.dimDef('p3d_libros').story).toBe('mission:H82');
    load('h83-acto3.json');
    GT.openGatera('p3d_libros');
    // the collapse: survive 4 turns (the enemy «leaves»: you get out) while shelves fall
    const idx = GB.buildGateraBattle('p3d_libros', 'l6', () => undefined);
    expect(idx.rules).toMatchObject({ retreat: { side: 1, turn: 4 }, capitulos: {} });
    expect(idx.rules?.fases?.phases.length).toBe(3);
    // the Correctores: Corrección + her light on the trajectories (a longer aim preview); No wey closes it
    const co = GB.buildGateraBattle('p3d_libros', 'l7', () => undefined);
    expect(co.rules).toMatchObject({ correccion: { side: 0, every: 2, dur: 2 } });
    expect(co.meta?.previewBonus).toBeGreaterThan(0);
    expect(co.rules?.fases?.phases[1]).toMatchObject({ id: 'nowey', endsBattle: true });
    // Esquirla: splinters; Bisagra helps a turn without the map, Brecha with it
    expect(GB.buildGateraBattle('p3d_libros', 'l9', () => undefined).rules?.pausas).toEqual([{ side: 1, turn: 2, kind: 'bisagra' }]);
    G.flag(GB.MAPA_BRECHA);
    expect(GB.buildGateraBattle('p3d_libros', 'l9', () => undefined).rules?.pausas).toEqual([{ side: 1, turn: 2, kind: 'brecha' }]);
  });

  it('the walk from h83-acto3: the stories in your order, the endings, the collapse and the dark, the map, Esquirla', async () => {
    load('h83-acto3.json');
    expect(active('H83')).toBe(true);
    buy('p3d_libros');
    expect(FS.llamaCanelo()).toBe(85);
    await flow('h83_llegada');
    // the shelf: three stories in any order after L-1; L-5 after all three
    win('p3d_libros', 'l1', 'l4', 'l2');
    expect(GT.nodeState('p3d_libros', 'l5')).toBe('locked');
    win('p3d_libros', 'l3', 'l5');
    checkMissions();
    expect(done('H83')).toBe(true);
    await flow('h83_costuras');
    reload();
    // H84: three short battles, an ending after each (kept)
    picks.push('croquetas', 'empate', 'pato');
    await flow('h84_finales');
    expect(battles).toEqual(['c1', 'c2', 'c3']);
    expect(['final_cerditos:croquetas', 'final_liebre:empate', 'final_patito:pato'].every((f) => G.has(f))).toBe(true);
    checkMissions();
    expect(done('H84')).toBe(true);
    reload();
    // H85: the index (after H84); then her lantern off — the cats' eyes; his flame at 60 % for good
    await flow('h85_ficha');
    win('p3d_libros', 'l6');
    checkMissions();
    expect(done('H85')).toBe(true);
    await flow('h85_oscuridad');
    expect(ui).toContain('oscuras:Sigue los ojos');
    expect(FS.llamaCanelo()).toBe(60);
    expect(FS.llamaLabel()).toBe('LLAMA 60 %');
    reload();
    expect(FS.llamaCanelo()).toBe(60);
    // H86: what the light brought
    await flow('h86_plan');
    checkMissions();
    expect(done('H86')).toBe(true);
    reload();
    // H87: the Correctores (after H86); No wey; the map: she gives it
    win('p3d_libros', 'l7');
    checkMissions();
    expect(done('H87')).toBe(true);
    picks.push('si');
    await flow('h87_nowey');
    expect(G.has(GB.MAPA_BRECHA)).toBe(true);
    expect(allSaid()).toContain('LUZTERNA: Si lo rayas, te rayo.');
    reload();
    // H88 (back to the Carta first): L-8, Esquirla; DISTOR
    win('p3d_libros', 'l8', 'l9');
    checkMissions();
    expect(done('H88')).toBe(true);
    await flow('h88_distor');
    for (const id of ['H83', 'H84', 'H85', 'H86', 'H87', 'H88']) expect(done(id), id).toBe(true);
  }, 60_000);

  it('without the map, DISTOR plays its Bisagra cut (f25_bisagra) when FILM-ACTO3 has it', async () => {
    load('h83-acto3.json');
    G.s.flags[GB.MAPA_BRECHA] = false;
    const played: string[] = [];
    SI.setFilmPort({ has: (id) => id === 'f25_bisagra' || id === 'f25', play: async (id) => (played.push(String(id)), { end: 'done' }) });
    await flow('h88_distor');
    expect(played).toEqual(['f25_bisagra']);
  });

  it('Capítulos turns the page every 3 turns; Corrección whitens a cannon; Esquirlas and the light', () => {
    load('h83-acto3.json');
    GT.openGatera('p3d_libros');
    const b = makeBattle(GB.buildGateraBattle('p3d_libros', 'l7', () => undefined), 9);
    b.turn = 1;
    b.startTurn(0);
    expect(AR.actState(b)!.chapter).toBe(0);
    b.turn = 4;
    const ev = b.startTurn(0);
    expect(AR.actState(b)!.chapter).toBe(1);
    expect(ev.some((e) => e.k === 'info' && /CAPÍTULO II: CALMA/.test(e.text))).toBe(true);
    expect(b.wind).toBe(0);
    // Corrección on the Correctores' 2nd turn: one of your cannons goes blank for 2 turns
    const before = b.cannons(0).length;
    b.turn = 2;
    b.startTurn(1);
    expect(b.cannons(0).length).toBe(before - 1);
  });
});

describe('Acto IV «La gira» (H89–H92): the Tour, and home', () => {
  it('the data: the tour, Ritmo (half the shots on the beat), the manager, Firma; missions chained; speakers registered', () => {
    missionsOk(['H89', 'H90', 'H91', 'H92']);
    speakersOk(/^b(89|9[0-2])_/);
    expect(GT.shapeOf('p3d_pop')).toBe('tour');
    expect(GT.dimDef('p3d_pop').rules).toEqual({ ritmo: { mul: 1.3, onBeat: 0.5 } });
    expect(GT.dimDef('p3d_pop').story).toBe('mission:H88');
    load('h89-acto4.json');
    GT.openGatera('p3d_pop');
    expect(GB.buildGateraBattle('p3d_pop', 'p5', () => undefined).rules?.ritmo).toEqual({ mul: 1.3, onBeat: 0.5, accel: { every: 3, onBeat: 0.35 } });
    const firma = GB.buildGateraBattle('p3d_pop', 'p9', () => undefined);
    expect(firma.rules).toMatchObject({ pose: { side: 1, mul: 0.6 }, ritmo: {} });
    expect(firma.rules?.fases?.phases[1]).toMatchObject({ id: 'nogame', endsBattle: true });
  });

  it('the walk from h89-acto4: the dates in your order, the photo, Firma, the playable return home, the finale wakes', async () => {
    load('h89-acto4.json');
    expect(active('H89')).toBe(true);
    buy('p3d_pop');
    expect(FS.llamaCanelo()).toBe(60);
    await flow('h89_llegada');
    win('p3d_pop', 'p1', 'p3', 'p2', 'p4', 'p5');
    checkMissions();
    expect(done('H89')).toBe(true);
    await flow('h89_telonero');
    reload();
    picks.push('4');
    await flow('h90_gira');
    expect(battles).toEqual(['g1', 'g2', 'g3']);
    expect(G.has('foto:4')).toBe(true);
    expect(allSaid()).toContain('CAPTION: Mi gordo.');
    checkMissions();
    expect(done('H90')).toBe(true);
    reload();
    win('p3d_pop', 'p6', 'p7', 'p8', 'p9');
    checkMissions();
    expect(done('H91')).toBe(true);
    await flow('h91_show');
    reload();
    // H92: home; the film starts when you tap the faro; the finale's gate opens with it
    await flow('h92_noche');
    expect(ui).toContain('faro');
    expect(allSaid()).toContain('CRONOS: Vi el final. Una bufanda en el suelo y alguien que no se levanta.');
    checkMissions();
    expect(done('H92')).toBe(true);
    expect(active('H93')).toBe(true);
  }, 60_000);

  it('Ritmo: a pair of the same element lands on the beat about half the time (seeded: the screen = the estimate)', () => {
    load('h89-acto4.json');
    GT.openGatera('p3d_pop');
    const spec = GB.buildGateraBattle('p3d_pop', 'p1', () => undefined);
    const a = autoBattle(GB.buildGateraBattle('p3d_pop', 'p1', () => undefined), DIFFICULTY.hard, 31, 30);
    const b = autoBattle(GB.buildGateraBattle('p3d_pop', 'p1', () => undefined), DIFFICULTY.hard, 31, 30);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(AR.actRuleLines(spec.rules).join(' ')).toMatch(/la mitad de los tiros en el beat/);
  });
});

describe('the whole Parte III chains: H66 → H97 without a gap', () => {
  it('every mission from H66 to H97 exists, triggers on the one before, and no one is dormant once the chain reaches it', () => {
    const ids = Array.from({ length: 32 }, (_, i) => `H${66 + i}`);
    for (const id of ids) {
      const m = MISSION_BY_ID.get(id);
      expect(m, id).toBeTruthy();
      if (id !== 'H66') expect(m!.trigger, id).toBe(`mission:H${Number(id.slice(1)) - 1}`);
      expect(S.P3_COVERED, id).toContain(id);
    }
    // the chain fixtures follow each other: each one is where its act begins
    for (const [f, id] of [['h69-acto1.json', 'H69'], ['h75-acto2.json', 'H75'], ['h83-acto3.json', 'H83'], ['h89-acto4.json', 'H89'], ['h93-final.json', 'H93']] as const) {
      load(f);
      expect(active(id), f).toBe(true);
      const n = Number(id.slice(1));
      for (const x of ids.filter((k) => Number(k.slice(1)) < n)) expect(done(x), `${f}: ${x}`).toBe(true);
      for (const x of ids.filter((k) => Number(k.slice(1)) > n)) expect(active(x) || done(x), `${f}: ${x}`).toBe(false);
      // a reload of the fixture is the same save
      const once = JSON.stringify({ ...G.s, savedAt: 0 });
      reload();
      expect(JSON.stringify({ ...G.s, savedAt: 0 }), f).toBe(once);
    }
    // the finale's gate was set by the story (H92), not by hand
    load('h93-final.json');
    expect(G.has('p3_final')).toBe(true);
    expect(done('H92')).toBe(true);
  });
});
