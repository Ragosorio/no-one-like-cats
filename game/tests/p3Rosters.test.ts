/**
 * Parte III · PLANTELES DE LA CARTA (docs/part-iii/mecanicas-v2/02-loop.md §6.4, 03-plan-implementacion.md §2.7).
 *
 * The control cats of Part II (Sonido stuns, Tiempo skips turns, Sombra stabs past shields, Vacío erases cells) decide
 * more than any number. So every stage of regiones.json must follow the roster rule:
 *   · a NORMAL stage of the first half of a route brings no control cat — unless it is marked `teaches` (it teaches it)
 *   · a stage with donuts or bottles never brings 2+ Sonido
 *   · no stage brings 3+ Sonido
 * …and every crew / captain is a real species (stand-ins included), every `teaches` is a control element.
 */
import { describe, expect, it } from 'vitest';
import REG from '../src/data/gateras/regiones.json';
import { CAT_BY_ID } from '../src/data/content';

type Stage = { n: number; name: string; kind: string; playable: boolean; crew?: string[]; captain?: string; mareo?: { donas?: unknown; botellas?: unknown }; teaches?: string[] };
const CONTROL = ['sound', 'time', 'shadow', 'void'];
const stagesByDim = (REG as unknown as { stages: Record<string, Stage[]> }).stages;

describe('the Carta’s rosters follow the control rule (02 §6.4)', () => {
  const all = Object.entries(stagesByDim).flatMap(([dim, st]) => st.map((s) => ({ dim, s, route: st.length })));
  const playable = all.filter((x) => x.s.playable && x.s.crew?.length);

  it('there is something to check (B-1…B-9 are playable)', () => {
    expect(playable.length).toBeGreaterThanOrEqual(9);
  });

  it('every crew cat and captain is a real species (stand-ins included)', () => {
    for (const { dim, s } of playable) {
      for (const id of [...(s.crew ?? []), ...(s.captain ? [s.captain] : [])]) expect(CAT_BY_ID.has(id), `${dim} ${s.n} ${s.name}: ${id}`).toBe(true);
      if (s.captain) expect(s.crew, `${dim} ${s.n}: the captain sails`).toContain(s.captain);
    }
  });

  it('`teaches` names control elements only', () => {
    for (const { dim, s } of playable) for (const e of s.teaches ?? []) expect(CONTROL, `${dim} ${s.n} teaches ${e}`).toContain(e);
  });

  const elementsOf = (s: Stage) => (s.crew ?? []).map((id) => CAT_BY_ID.get(id)!.elements as string[]);
  const count = (s: Stage, el: string) => elementsOf(s).filter((els) => els.includes(el)).length;

  it('a normal stage of the first half brings no control cat unless it teaches it', () => {
    const bad: string[] = [];
    for (const { dim, s, route } of playable) {
      if (s.kind !== 'normal' || s.n > Math.floor(route / 2)) continue;
      for (const el of CONTROL) if (count(s, el) > 0 && !(s.teaches ?? []).includes(el)) bad.push(`${dim} ${s.n} «${s.name}»: ${count(s, el)} de ${el} sin \`teaches\``);
    }
    expect(bad).toEqual([]);
  });

  it('donuts or bottles + 2 Sonido is a wall: never', () => {
    const bad = playable.filter(({ s }) => (s.mareo?.donas || s.mareo?.botellas) && count(s, 'sound') >= 2).map(({ dim, s }) => `${dim} ${s.n} «${s.name}»`);
    expect(bad).toEqual([]);
  });

  it('no stage brings 3+ Sonido', () => {
    const bad = playable.filter(({ s }) => count(s, 'sound') >= 3).map(({ dim, s }) => `${dim} ${s.n} «${s.name}»: ${count(s, 'sound')} de Sonido`);
    expect(bad).toEqual([]);
  });

  it('the rule bites: the first draft of B-8 (4 Sonido with donuts and bottles) would fail it', () => {
    const draft: Stage = { n: 8, name: 'La fila del baño (borrador)', kind: 'normal', playable: true, crew: ['e_diva', 'r_djbigotes', 'c_tamborin', 'r_grafitera'], mareo: { donas: {}, botellas: {} } };
    expect(count(draft, 'sound')).toBe(4);
    expect(!!(draft.mareo?.donas || draft.mareo?.botellas) && count(draft, 'sound') >= 2).toBe(true);
  });
});
