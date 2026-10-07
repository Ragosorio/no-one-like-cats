/**
 * Island M2 helpers (owned by the island module): "sin casa" fixes, bank/expedition summaries for the
 * HUD and the island views. Pure reads + calls into state/sys — no new persistent schema.
 */
import { G, Habitat, OwnedCat } from '../game';
import { BAL, habitatTier } from '../econ';
import { EXPANSIONS, catDef } from '../../data/content';
import { buildersBusy, builders, expansionState, habitatCapacity, house, nextHabitatCost } from '../sys/island';
import { hasHabitatSpace } from '../../island/placement';
import { readyExpeditions, expeditions } from '../sys/workforce';
import { ctaVisible } from './island';

export type HomeFix =
  | { kind: 'move'; habitat: Habitat; element: string }
  | { kind: 'build'; element: string; cost: number; affordable: boolean; builderFree: boolean }
  | { kind: 'upgrade'; habitat: Habitat; element: string }
  | { kind: 'expand'; n: number; cost: number; affordable: boolean }
  | { kind: 'wait'; text: string };

/** the single best next step to give this cat a home */
export function homeFixFor(c: OwnedCat): HomeFix {
  const els = catDef(c.species).elements;
  const own = G.s.habitats.filter((h) => els.includes(h.element));
  const room = own.filter((h) => !h.busy && h.cats.length < habitatCapacity(h)).sort((a, b) => b.tier - a.tier)[0];
  if (room) return { kind: 'move', habitat: room, element: room.element };
  const el = els.find((e) => G.s.elements.includes(e)) ?? els[0];
  if (hasHabitatSpace()) {
    const cost = nextHabitatCost(el);
    return { kind: 'build', element: el, cost, affordable: G.s.gold >= cost, builderFree: buildersBusy() < builders() };
  }
  // a matching habitat that would gain capacity by upgrading
  const up = own.find((h) => {
    const next = BAL.habitats.tiers[h.tier];
    return !h.busy && next && next.capacity > habitatTier(h.tier).capacity && G.s.kl >= next.kl;
  });
  if (up) return { kind: 'upgrade', habitat: up, element: up.element };
  for (const e of EXPANSIONS) {
    const st = expansionState(e.n);
    if (st === 'cleared') continue;
    if (st === 'available') return { kind: 'expand', n: e.n, cost: e.balance.cost, affordable: G.s.gold >= e.balance.cost };
    if (st === 'clearing') return { kind: 'wait', text: `Están limpiando ${e.name}: ahí habrá espacio nuevo.` };
    return { kind: 'wait', text: `El próximo terreno (${e.name}) abre en Reino ${e.balance.kl}.` };
  }
  return { kind: 'wait', text: 'Mejora un hábitat para que quepan más gatos.' };
}

/** one-tap fix when possible (moving in). Returns true if the cat got a home. */
export function quickHouse(c: OwnedCat) {
  const f = homeFixFor(c);
  if (f.kind !== 'move') return false;
  return house(c.uid, f.habitat);
}

export function homeless() {
  return G.s.cats.filter((c) => !c.habitat);
}

/** HUD summary chips for the island (null = nothing to say) */
export function islandNotices() {
  const out: { id: string; text: string; color: number }[] = [];
  // onboarding: Brote's homelessness IS the K03 lesson — say nothing until the build CTA exists
  const h = ctaVisible('build') ? homeless() : [];
  if (h.length) out.push({ id: 'homeless', text: h.length === 1 ? `${h[0].name.toUpperCase()} NO TIENE CASA` : `${h.length} GATOS SIN CASA`, color: 0xc8102e });
  const rx = readyExpeditions().length;
  if (rx) out.push({ id: 'expedition', text: rx === 1 ? '¡VOLVIÓ UNA EXPEDICIÓN!' : `¡VOLVIERON ${rx} EXPEDICIONES!`, color: 0xffc94a });
  return out;
}

export function expeditionsAway() {
  return expeditions().filter((x) => !x.ready).length;
}
