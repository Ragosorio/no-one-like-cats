/**
 * Parte III · the REVEAL of a box cat (GATOS-DATOS). The cat is already yours (state/sys/p3cats.ts adopted it when its
 * source was met); the director plays this when calm on the Carta (ui/story/p3CatsScript.ts → `p3cat_<id>`).
 * Same reveal as the story cats of the Parte II (fx/sequences/catReveal.ts), with a kicker that says where it came from.
 */
import { G } from '../state/game';
import { catDef } from '../data/content';
import { scenes } from '../core/scenes';
import { p3CatOfFlow } from '../ui/story/p3CatsScript';
import { stageOf, nodesOf, type DimId } from '../state/sys/gateras';
import type { FlowResult } from './acto1Flow';

const KICKER: Record<string, string> = {
  historia: 'SE UNE A TU TRIPULACIÓN',
  etapa: 'SE UNE A TU TRIPULACIÓN',
  rescate: 'RESCATE',
  actividad: 'ACTIVIDAD COMPLETA',
  recordar: 'DESPUÉS DE TODO',
};

/** the kicker over the reveal: an élite's captain «se queda contigo»; the rest, by its source */
export function p3Kicker(species: string): string {
  const d = catDef(species);
  const s = d.p3;
  if (!s) return KICKER.historia;
  if (s.kind === 'etapa' && s.dim && s.node) {
    const st = /^\d+$/.test(s.node) ? stageOf(s.dim as DimId, Number(s.node)) : nodesOf(s.dim as DimId).find((x) => x.id === s.node);
    if (st?.captain === species) return 'SE QUEDA CONTIGO';
  }
  return KICKER[s.kind] ?? KICKER.historia;
}

/** the director's entry (`special: 'flow'`, flow `p3cat_<id>`). Unknown or not yours (released): done, never a deadlock */
export async function playStoryFlow(id: string): Promise<FlowResult> {
  const species = p3CatOfFlow(id);
  if (!species) return 'done';
  const mine = G.s.cats.find((c) => c.species === species);
  if (!mine) return 'done';
  const cd = catDef(species);
  const { playCatReveal } = await import('../fx/sequences/catReveal');
  const r = await playCatReveal(scenes.fxLayer, {
    slug: cd.art.slug,
    name: mine.name || cd.name,
    elements: cd.elements,
    rarity: cd.rarity,
    species,
    caption: cd.lore,
    subtitle: `${cd.epithet} · ${cd.battleForm.cry}`,
    kicker: p3Kicker(species),
  });
  G.save();
  // «VER EN CATDEX»: its page (the Catdex opens over the Carta; closing it brings you back)
  if (r === 'catdex') void import('../panels/Catdex').then((m) => m.openCatdex(species));
  return 'done';
}
