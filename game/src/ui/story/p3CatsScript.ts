/**
 * Parte III · WHEN the reveal of a box cat plays (GATOS-DATOS; ⚠️ spoilers). Pure: no Pixi, no G — tests read it.
 *
 * The cat is ALREADY yours when its source is met (state/sys/p3cats.ts adopts it and sets `p3cat_<id>`); this is only
 * the reveal, played by the story director (app/story.ts WHEN → special 'flow' `p3cat_<id>` → app/p3CatsFlow.ts):
 *   · on the Carta de las Cajas, when calm, AHEAD of the next story card (`first`: a battle's cat right after its stamp)
 *   · a story cat (its mission done) waits for that mission's CAMBIÓ card (`after`), so the chapter closes first
 *   · its key is the beat `p3cat_<id>` (G.s.beatsSeen): played once; a fixture / catch-up marks it seen
 *   · never during the mourning (the director mutes WHEN there) — and no source pays between SADIE and «Continuará»
 */
import especies from '../../data/gateras/especies.json';
import { cardKey } from './gaterasScript';

export interface P3CatWhen {
  /** the beat key and the flag that says it was earned (`p3cat_<id>`) */
  key: string;
  species: string;
  /** not before this beat is seen (a story cat: its mission's CAMBIÓ card) */
  after?: string;
  delay: number;
}
type Src = { kind: string; mission?: string };
/** one reveal per box cat with a source (data order) */
export const P3_CAT_WHEN: P3CatWhen[] = (especies.cats as { id: string; p3?: Src }[])
  .filter((c) => !!c.p3)
  .map((c) => {
    const s = c.p3!;
    const story = (s.kind === 'historia' || s.kind === 'actividad') && !!s.mission;
    return { key: `p3cat_${c.id}`, species: c.id, after: story ? cardKey(s.mission!, 'done') : undefined, delay: story ? 0.6 : 0.4 };
  });
/** the flow id → the species it reveals (app/p3CatsFlow.ts) */
export const p3CatOfFlow = (flow: string) => (flow.startsWith('p3cat_') ? flow.slice(6) : null);
