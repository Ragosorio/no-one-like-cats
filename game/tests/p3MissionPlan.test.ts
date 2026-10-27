/**
 * Parte III · LAS MISIONES H66–H97 (docs/part-iii/historia-v2/02-mapa.md; plan: docs/part-iii/mecanicas-v2/04-misiones-h70-h97.md).
 *
 * No mission of the Parte III may reach a player without its content. This guard holds for whatever NARRATIVA adds:
 *   · every mission H66+ in the data is COMPLETE (a 5-field card, a goal with an evaluator, a trigger) — or DORMANT
 *     (gated by MISSION_GATES on a flag), never half-written and live
 *   · a `win_battle` goal of the Carta names a battle that exists and can be played
 *   · a box's story gate (`dims[].story`) names a mission that exists, or a flag
 *   · the numbering fits: the Parte III map runs H66–H97, H98–H99 stay in reserve, and H100+ already works (missionIds)
 */
import { describe, expect, it } from 'vitest';

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

await import('../src/state');
const { MISSIONS, MISSION_BY_ID } = await import('../src/data/content');
const { MISSION_GATES, goalSupported } = await import('../src/state/sys/missionGoals');
const { isAfterPart2Mission, missionNum } = await import('../src/state/sys/rupturasLedger');
const GT = await import('../src/state/sys/gateras');
const GB = await import('../src/state/sys/gaterasBattles');

const P3 = MISSIONS.filter((m) => isAfterPart2Mission(m.id));
/** placeholder markers (case-sensitive: «todo» is a Spanish word) */
const PLACEHOLDER = /\[(TODO|PENDIENTE|BORRADOR)\]|\bBORRADOR\b|\bTBD\b|\bXXX\b|\bLOREM\b/;

describe('Parte III missions are complete or dormant', () => {
  it('there are Parte III missions (the prologue H66–H69 at least) and they fit the numbering (≤ H97 + 2 in reserve)', () => {
    expect(P3.map((m) => m.id)).toEqual(expect.arrayContaining(['H66', 'H67', 'H68', 'H69']));
    for (const m of P3) expect(missionNum(m.id), m.id).toBeLessThanOrEqual(99);
  });

  it('every live Parte III mission has its content: 5-field card, an evaluated goal, a trigger, no placeholder text', () => {
    const bad: string[] = [];
    for (const m of P3) {
      const dormant = !!MISSION_GATES[m.id];
      const text = [m.title, m.goal.text, ...Object.values(m.card ?? {})].join(' ');
      const complete = !!m.card && ['pasa', 'importa', 'queremos', 'ahi', 'cambio'].every((k) => String((m.card as unknown as Record<string, string>)[k] ?? '').trim().length > 0) && goalSupported(m.goal.type) && !!m.trigger && !PLACEHOLDER.test(text);
      if (!complete && !dormant) bad.push(`${m.id}: incompleta y activable (o se completa, o va en MISSION_GATES hasta tener su contenido)`);
    }
    expect(bad).toEqual([]);
  });

  it('a Carta battle in a goal exists and is playable (stage, detour, locale, encounter)', () => {
    for (const m of P3) {
      const b = String((m.goal as { battle?: unknown }).battle ?? '');
      if (m.goal.type !== 'win_battle' || !b.startsWith('p3d_')) continue;
      const p = GT.parseBattleId(b);
      expect(p, `${m.id}: ${b}`).not.toBeNull();
      expect(GB.gateraBattleDef(p!.dim, p!.node)?.crew?.length, `${m.id}: ${b} no se puede jugar`).toBeGreaterThan(0);
    }
  });

  it('a box’s story gate names a mission that exists, or a flag', () => {
    for (const d of GT.DIMS) {
      if (!d.story || d.story.startsWith('flag:')) continue;
      const id = d.story.startsWith('mission:') ? d.story.slice(8) : d.story;
      expect(MISSION_BY_ID.has(id), `${d.id}: story ${d.story}`).toBe(true);
    }
  });

  it('the guard bites: a half-written H70 that could activate is caught', () => {
    const m = { ...MISSION_BY_ID.get('H69')!, id: 'H70', title: 'Borrón (BORRADOR)', trigger: 'mission:H69' };
    const text = [m.title, m.goal.text, ...Object.values(m.card ?? {})].join(' ');
    expect(PLACEHOLDER.test(text) && !MISSION_GATES.H70).toBe(true);
  });
});
