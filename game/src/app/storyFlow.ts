/**
 * Story battle flow: (repair gate →) BattleScene → applyStoryResult → back to the island → the
 * discovery / reveal sequences (new element, new primordial or mythic cat) → a small loot toast.
 * Also the one shared "here's your new cat" helper for any place that grants a cat outside Results.
 */
import { scenes } from '../core/scenes';
import { music } from '../core/music';
import { BattleScene } from '../scenes/BattleScene';
import { G } from '../state/game';
import { CONTENT, catDef } from '../data/content';
import { fmt } from '../core/format';
import { toast } from '../ui/modal';
import { slugOf } from '../art/tint';
import { isRepairing } from '../state/sys/campaign';
import { resonancesWith } from '../state/ext/campaign';
import { STORY_BATTLES, applyStoryResult, buildStoryBattle, claimStoryCat, voidFragments, StoryLoot } from '../state/sys/storyBattles';
import { GRIETA_CAPTION } from '../ui/story/grietasScript';
import { ELEMENT_NAME } from '../data/elementsMeta';

let running = false;

export async function startStoryBattle(id: string) {
  if (running || !STORY_BATTLES[id]) return;
  if (isRepairing()) {
    const { openRepairGate } = await import('../battle/ui/repairGate');
    if (!(await openRepairGate())) return;
  }
  // Parte II · Oleada 2: a sky battle needs a ship with the Kit de Vuelo (app/oleada2Flow.ts)
  const { skyPreflight } = await import('./oleada2Flow');
  if (!(await skyPreflight(id))) return;
  // Parte II · Oleada 3: a void battle needs a nave astral and a trip's Combustible Astral (app/oleada3Flow.ts)
  const { astralPreflight } = await import('./oleada3Flow');
  if (!(await astralPreflight(id))) return;
  running = true;
  music.play(STORY_BATTLES[id].zone >= 5 ? 'boss' : 'battle');
  let ended = false;
  const spec = buildStoryBattle(id, (r) => {
    if (ended) return;
    ended = true;
    const loot = applyStoryResult(id, r);
    void afterStory(id, loot).finally(() => (running = false));
  });
  await scenes.go(new BattleScene(spec), 'blocks');
}

async function afterStory(id: string, loot: StoryLoot) {
  const { goIsland } = await import('./flow');
  await goIsland();
  await wait(700);
  // Parte II replay (rupturasLedger): an element / cat already yours plays its reveal again, granting nothing
  const el = loot.newElement ?? loot.replayElement ?? null;
  if (el) await revealElement(el, loot.newCat, { again: !loot.newElement, claimKey: loot.catKey });
  else if (loot.newCat) await revealCat(loot.newCat, { claimKey: loot.catKey });
  music.play('island');
  const def = STORY_BATTLES[id];
  if (def.grade === 'damage' && def.damageFragments !== false) {
    const pct = loot.damagePct ?? 0;
    toast(loot.won ? `¡${pct}% DE DAÑO!` : `Solo ${pct}%… necesitas ${def.passPct ?? 15}%`, {
      icon: loot.won ? 'star' : 'clock',
      color: loot.won ? 0xff2e88 : 0xede4d6,
      sub: loot.fragments ? `+${loot.fragments} Fragmento${loot.fragments > 1 ? 's' : ''} del Vacío (${voidFragments()}/10)` : loot.won ? 'Ya tenías esos fragmentos' : 'Se fue. Volverá a aparecer en el mapa.',
      dur: 4,
    });
    return;
  }
  // Parte II H46: a damage bar of its own and no fragments (it just has to leave with enough damage)
  if (def.grade === 'damage' && !loot.won) {
    toast(`Solo ${loot.damagePct ?? 0}%… necesitas ${def.passPct ?? 15}%`, { icon: 'clock', sub: 'Se fue. La misión sigue fijada: vuelve cuando quieras.', dur: 4 });
    return;
  }
  if (!loot.won) {
    toast('Esta vez no…', { icon: 'clock', sub: 'La misión sigue fijada: vuelve cuando estés listo.', dur: 3.5 });
    return;
  }
  const bits = [`+${fmt(loot.gold)} oro`];
  if (loot.gems) bits.push(`+${loot.gems} gemas`);
  if (loot.fragments) bits.push(`+${loot.fragments} Fragmento del Vacío (${voidFragments()}/10)`);
  if (loot.crystals) bits.push(`+${loot.crystals.n} cristales de ${(ELEMENT_NAME[loot.crystals.el] ?? loot.crystals.el).toLowerCase()}`);
  if (loot.alreadyPaid) bits.push('su premio especial ya era tuyo');
  toast(def.title, { icon: 'star', color: def.color, sub: bits.join(' · '), dur: 4 });
}

const CAPTION: Record<string, string> = {
  magic: 'Un barco que brilla, un escudo que hace ¡CLANK! y un elemento que no debería existir. Ahora es tuyo.',
  cosmic: 'Una estrella cayó al mar. No la empujaste tú. Pero ahora te sigue.',
  // Parte 2: Grietas del Multiverso
  ...GRIETA_CAPTION,
  // Parte II · Oleada 1: Isla Nácar (H39)
  crystal: 'Ganaste en Isla Nácar y el nácar te eligió. Ahora todo lo que te disparen puede rebotar. Y todo lo que tú dispares, también.',
  // Parte II · Oleada 2: Islas Invertidas (H44)
  gravity: 'Ganaste de cabeza en las Islas Invertidas y el peso del cielo se vino contigo. Ahora tú decides para dónde es abajo.',
};

/** T4 element discovery (+ the primordial that came with it), outside the Results screen.
 *  `again`: Parte II replay — the element was already yours, the scene plays with its own stamps. */
export async function revealElement(el: string, catSpecies: string | null, opts: { again?: boolean; claimKey?: string } = {}) {
  const [{ playElementDiscovery }, { ELEMENT_BY_ID }] = await Promise.all([import('../fx/sequences/elementDiscovery'), import('../data/content')]);
  const def = ELEMENT_BY_ID.get(el) as { name?: string } | undefined;
  await playElementDiscovery(scenes.fxLayer, {
    element: el,
    world: scenes.current ?? null,
    primordialSlug: catSpecies ? slugOf(catSpecies) : undefined,
    known: G.s.elements,
    resonances: resonancesWith(el),
    stamps: opts.again
      ? [`${(def?.name ?? el).toUpperCase()}: YA ERA TUYO`, 'TUS HÁBITATS Y CRISTALES SIGUEN CONTIGO']
      : [`NUEVO HÁBITAT: ${(def?.name ?? el).toUpperCase()}`, 'YA PUEDES CONSTRUIRLO EN LA TIENDA'],
    caption: CAPTION[el],
  });
  if (catSpecies) await revealCat(catSpecies, { claimKey: opts.claimKey });
}

/** adopt + the Pokémon-style reveal (primordial/mythic get the T4 treatment).
 *  `claimKey` (Parte II, rupturasLedger): adopted once; a replay shows the reveal without adopting anything. */
export async function revealCat(species: string, opts: { claimKey?: string } = {}) {
  const { playCatReveal } = await import('../fx/sequences/catReveal');
  const r = claimStoryCat(species, opts.claimKey);
  const cd = catDef(species);
  const mine = r.already ? G.s.cats.find((c) => c.species === species) : undefined;
  await playCatReveal(scenes.fxLayer, {
    slug: cd.art.slug,
    name: r.cat?.name ?? mine?.name ?? cd.name,
    elements: cd.elements,
    rarity: cd.primordial ? 'primordial' : cd.rarity,
    species,
    caption: cd.lore,
    subtitle: `${cd.epithet} · ${cd.battleForm.cry}`,
    duplicateOrbs: r.isNew || r.already ? undefined : r.orbs,
    // a story reward, not a Resonancia (it used to read «RESONANCIA Nº 001»); a replay: it's already home
    kicker: r.already ? 'YA ES PARTE DE TU TRIPULACIÓN' : 'RECOMPENSA DE LA HISTORIA',
    replay: r.already || undefined,
  });
  G.save();
}

/** boss / mission unlock tokens that name a cat (`cat:l_merlina`) */
export function catFromUnlocks(unlocks: string[]) {
  const u = unlocks.find((x) => x.startsWith('cat:'));
  const sp = u?.slice(4);
  return sp && CONTENT.cats.some((c) => c.id === sp) ? sp : null;
}

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
