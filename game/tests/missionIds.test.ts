/**
 * Parte III · EL TECHO H99 (docs/part-iii/mecanicas-v2/03-plan-implementacion.md §1.1–1.2).
 *
 * Mission ids are a chain letter + 2–3 digits: a synthetic H100 behaves like any mission (its `unlocks` that are
 * mission ids are never saved as flags), the Part II helpers keep H100 / b100 out of the Part II reset, the Bitácora
 * orders numerically, and the Carta's battle ids accept nodes of more than one digit (10, d1, a2, e…).
 */
import { afterEach, describe, expect, it } from 'vitest';
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

const { G } = await import('../src/state');
const { SAVE_KEY } = await import('../src/core/save');
const { MISSIONS, MISSION_BY_ID } = await import('../src/data/content');
const { checkMissions, MISSION_ID_RE } = await import('../src/state/sys/missions');
const L = await import('../src/state/sys/rupturasLedger');
const X = await import('../src/state/sys/rupturasReset');
const GW = await import('../src/state/sys/gaterasWorld');
const GT = await import('../src/state/sys/gateras');
type MissionDef = import('../src/data/content').MissionDef;

function load(f = 'h65-normal') {
  mem.clear();
  mem.set(SAVE_KEY, readFileSync(new URL(`../test-saves/${f}.json`, import.meta.url), 'utf8'));
  G.load();
  expect(G.loaded).toBe(true);
}

const card = (n: number) => ({ pasa: `pasa ${n}`, importa: 'importa', queremos: 'queremos', ahi: 'ahí', cambio: `cambió ${n}` });
const synth: MissionDef[] = [];
function addMission(m: MissionDef) {
  synth.push(m);
  MISSIONS.push(m);
  MISSION_BY_ID.set(m.id, m);
}
afterEach(() => {
  for (const m of synth) {
    const i = MISSIONS.indexOf(m);
    if (i >= 0) MISSIONS.splice(i, 1);
    MISSION_BY_ID.delete(m.id);
  }
  synth.length = 0;
});

describe('H100: three-digit mission ids', () => {
  it('the id pattern accepts 2–3 digits and nothing else', () => {
    for (const id of ['H01', 'H66', 'H99', 'H100', 'H101', 'H999', 'C01', 'K23', 'E17']) expect(MISSION_ID_RE.test(id), id).toBe(true);
    for (const id of ['H1', 'H1000', 'h100', 'X100', 'flag_x', 'H10a', '']) expect(MISSION_ID_RE.test(id), id).toBe(false);
  });

  it('a synthetic H100 completes: its mission unlock (H101) is NOT a flag, its flag unlock is; H101 follows', () => {
    load();
    addMission({
      id: 'H100',
      chain: 'historia',
      title: 'Misión sintética H100',
      goal: { type: 'win_battle', battle: 'p3d_borracha_10', text: 'gana la etapa 10' },
      trigger: 'test_h100_go',
      purpose: 'prueba',
      reward: { std: false },
      unlocks: ['H101', 'flag_x_h100'],
      card: card(100),
    });
    addMission({ id: 'H101', chain: 'historia', title: 'Misión sintética H101', goal: { type: 'win_battle', battle: 'p3d_borracha_d1', text: 'gana el desvío' }, trigger: 'mission:H100', purpose: 'prueba', reward: { std: false }, unlocks: [], card: card(101) });
    G.flag('test_h100_go');
    checkMissions();
    expect(G.s.missions.active).toContain('H100');
    G.flag('won_p3d_borracha_10');
    checkMissions();
    expect(G.s.missions.done).toContain('H100');
    expect(G.has('flag_x_h100')).toBe(true);
    expect(G.has('H101')).toBe(false);
    expect(G.s.flags.H101).toBeUndefined();
    // the chain goes on by its trigger, and a 2-char node battle id is a valid goal
    expect(G.s.missions.active).toContain('H101');
  });

  it('the Part II helpers: H100 is after Parte II, b100 is never a Part II beat', () => {
    expect(L.missionNum('H100')).toBe(100);
    expect(L.missionNum('H999')).toBe(999);
    expect(L.isPart2Mission('H100')).toBe(false);
    expect(L.isAfterPart2Mission('H100')).toBe(true);
    expect(X.isPart2Beat('b100_x')).toBe(false);
    expect(X.isPart2Beat('b100_x#a')).toBe(false);
  });

  it('the Bitácora orders numerically (H69 < H99 < H100), not as text', () => {
    load();
    for (const n of [100, 99]) addMission({ id: `H${n}`, chain: 'historia', title: `H${n}`, goal: { type: 'watch', beat: 'b00_never', text: '—' }, trigger: 'never_test', purpose: 'prueba', reward: { std: false }, unlocks: [], card: card(n) });
    const s = G.s;
    s.missions.done = [...new Set([...s.missions.done, 'H66', 'H67', 'H68', 'H69', 'H100', 'H99'])];
    const ids = GW.bitacoraEntries(s)
      .map((e) => e.mission.id)
      .filter((id) => ['H69', 'H99', 'H100'].includes(id));
    expect(ids).toEqual(['H69', 'H99', 'H100']);
  });
});

describe('Carta battle ids of more than one digit (03 §1.2)', () => {
  it('parseBattleId reads stages 1–99, detours, activities and encounters', () => {
    expect(GT.parseBattleId('p3d_borracha_3')).toEqual({ dim: 'p3d_borracha', node: '3', n: 3 });
    expect(GT.parseBattleId('p3d_borracha_10')).toEqual({ dim: 'p3d_borracha', node: '10', n: 10 });
    expect(GT.parseBattleId('p3d_borracha_d1')).toEqual({ dim: 'p3d_borracha', node: 'd1', n: null });
    expect(GT.parseBattleId('p3d_anime_a2')).toEqual({ dim: 'p3d_anime', node: 'a2', n: null });
    expect(GT.parseBattleId('p3d_pop_ecadenero')).toEqual({ dim: 'p3d_pop', node: 'ecadenero', n: null });
    // unknown dimension / garbage
    expect(GT.parseBattleId('p3d_otra_1')).toBeNull();
    expect(GT.parseBattleId('p3d_borracha_')).toBeNull();
    expect(GT.parseBattleId('p3d_borracha_D1')).toBeNull();
    expect(GT.parseBattleId('umbral_final')).toBeNull();
    expect(GT.gateraBattleId('p3d_borracha', 10)).toBe('p3d_borracha_10');
    expect(GT.gateraBattleId('p3d_borracha', 'd1')).toBe('p3d_borracha_d1');
  });

  it('the IR of a pinned mission takes the four kinds of node to the Carta (and nothing else)', () => {
    // cajasGoal (app/cajasFlow.ts) navigates with this pattern; calling it here would open the Pixi scene
    const src = readFileSync(new URL('../src/app/cajasFlow.ts', import.meta.url), 'utf8');
    expect(src).toContain("goal.type === 'win_battle' && GATERA_BATTLE_RE.test(b)");
    for (const b of ['p3d_borracha_5', 'p3d_borracha_10', 'p3d_borracha_d1', 'p3d_borracha_a2', 'p3d_superheroes_ecruceta']) expect(GT.GATERA_BATTLE_RE.test(b), b).toBe(true);
    for (const b of ['umbral_final', 'p3d_borracha', 'p3d_borracha_D1', 'x_p3d_borracha_1']) expect(GT.GATERA_BATTLE_RE.test(b), b).toBe(false);
  });
});
