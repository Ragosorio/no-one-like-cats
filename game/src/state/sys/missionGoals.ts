/**
 * Mission goal & trigger catalogue — PURE (no imports) so tooling can read it without a browser
 * (`node scripts/verify-missions.ts`). `missions.ts` evaluates exactly the types listed here.
 *
 *  · counter goals measure the delta of `G.count(key)` since the mission appeared (endowed progress
 *    is handled by the evaluator for state goals: they read the save directly).
 *  · state goals read the save (owned ships, tiers, catdex…); some also accept a counter/flag fallback.
 */
export type GoalSpec = Record<string, unknown> & { type: string };

export interface GoalHandler {
  how: 'counter' | 'state' | 'flag' | 'mixed';
  /** counter key(s) this goal reads (counter / mixed) */
  counters?: (g: GoalSpec) => string[];
  /** flag(s) this goal reads (flag / mixed) */
  flags?: (g: GoalSpec) => string[];
  /** who is expected to emit the counter/flag (for the verifier report) */
  owner?: string;
}

const one = (k: string) => () => [k];

export const GOAL_HANDLERS: Record<string, GoalHandler> = {
  // ---- counters
  tap_cat: { how: 'counter', counters: one('tap_cat'), owner: 'isla (state/ext/island.ts)' },
  name_cat: { how: 'counter', counters: one('name_cat'), owner: 'historia (state/ext/story.ts)' },
  harvest_food: { how: 'counter', counters: one('harvest_food'), owner: 'isla (state/sys/island.ts)' },
  resonance_start: { how: 'counter', counters: one('resonance_start'), owner: 'colección (state/sys/resonance.ts)' },
  resonance_hatch: { how: 'counter', counters: one('resonance_hatch'), owner: 'colección (state/sys/resonance.ts)' },
  collect_gold: { how: 'counter', counters: one('collect_gold'), owner: 'isla (state/sys/island.ts)' },
  harvest: { how: 'counter', counters: (g) => [`harvest_${g.crop}`], owner: 'isla (state/sys/island.ts)' },
  use_ultimate: { how: 'counter', counters: one('ultimates'), owner: 'combate (BattleScene)' },
  win_by: { how: 'counter', counters: (g) => [g.condition === 'sink' ? 'wins_sink' : `wins_${g.condition}`], owner: 'combate (state/sys/campaign.ts)' },
  destroy_module: { how: 'counter', counters: (g) => [`destroy_${g.module}`], owner: 'combate (BattleScene)' },
  destroy_module_arc: { how: 'counter', counters: one('destroy_module_arc'), owner: 'combate (BattleScene)' },
  use_feature: { how: 'counter', counters: (g) => [`feature_${g.feature}`], owner: 'isla / colección (feature UI)' },
  micro_complete: { how: 'counter', counters: one('micro'), owner: 'isla (state/sys/micro.ts)' },
  gambit_play: { how: 'counter', counters: one('gambit'), owner: 'M3 (Cat’s Gambit)' },
  win_perfect: { how: 'counter', counters: one('wins_perfect'), owner: 'combate (state/sys/campaign.ts)' },
  quick_assault: { how: 'counter', counters: one('quick_assault'), owner: 'historia (state/ext/campaign.ts)' },
  edit_layout: { how: 'counter', counters: one('edit_layout'), owner: 'astillero (editor de layout)' },
  reaction_discovered: { how: 'counter', counters: one('reactions_discovered'), owner: 'combate (BattleScene)' },
  expedition_complete: { how: 'counter', counters: (g) => (g.duration_s ? [`expeditions_done_${g.duration_s}`] : ['expeditions_done']), owner: 'isla (state/sys/workforce.ts)' },
  destroy_modules_with: { how: 'counter', counters: (g) => [`modules_with_${g.ship}`], owner: 'historia (state/ext/campaign.ts resolveBattle)' },
  plant: { how: 'counter', counters: (g) => [`plant_${g.crop}`], owner: 'isla (state/sys/island.ts)' },
  assign_worker: { how: 'counter', counters: one('workers_assigned'), owner: 'isla (state/sys/workforce.ts)' },
  inherit_trait: { how: 'counter', counters: one('inherit_trait'), owner: 'colección (Resonancia, M3)' },
  secret_rumors: { how: 'counter', counters: one('secret_rumors'), owner: 'isla (state/sys/secrets.ts)' },
  // ---- flags / mixed
  event_complete: {
    how: 'mixed',
    counters: (g) => (!g.event || g.event === 'flash' ? ['flash_done'] : [`event_done_${g.event}`]),
    flags: (g) => (!g.event || g.event === 'flash' ? [] : [`event_done_${g.event}`]),
    owner: 'M3 (eventos)',
  },
  own_ship_or_event: { how: 'mixed', flags: (g) => [`event_done_${g.event}`], owner: 'astillero (compra) / M3 (evento)' },
  errand: { how: 'mixed', flags: (g) => [`errand_done_${g.errand}`], owner: 'combate (G.s.errands.done)' },
  equip_weapon_types: { how: 'mixed', flags: () => ['equip_weapon_types_2'], owner: 'astillero (state/sys/ship.ts)' },
  equip_shield: { how: 'mixed', counters: one('equip_shield'), owner: 'astillero (state/sys/ship.ts)' },
  use_automation: { how: 'mixed', flags: (g) => [`automation_${g.automation}`], owner: 'M4' },
  // ---- state
  cat_level: { how: 'state' },
  win_battle: { how: 'mixed', counters: (g) => (g.stage || g.battle ? [] : [g.zone ? `wins_zone_${g.zone}` : 'wins']), flags: (g) => (g.battle ? [`won_${g.battle}`] : []), owner: 'combate (state/sys/campaign.ts)' },
  reach_kl: { how: 'state' },
  defeat_boss: { how: 'state' },
  // story (Capítulo 1 final): the credits beat, the Barco del Vacío damage, the fragments
  watch: { how: 'state', owner: 'historia (app/story.ts marks the beat)' },
  damage_pct: { how: 'state', owner: 'historia (state/sys/storyBattles.ts dmgpct_<battle>)' },
  void_fragments: { how: 'state', owner: 'historia (bosses 4–6, Orquesta, story battles)' },
  ship_upgrade: { how: 'state' },
  own_ship: { how: 'state' },
  own_ships: { how: 'state' },
  crew_full: { how: 'state' },
  stages_cleared: { how: 'state' },
  build_habitat: { how: 'state' },
  upgrade_habitat: { how: 'state' },
  species_owned: { how: 'state' },
  orbs_of_species: { how: 'state' },
  star_up: { how: 'state' },
  own_rarity: { how: 'state' },
  own_mutation: { how: 'state' },
  catdex_set: { how: 'state' },
  resonance_parallel: { how: 'state' },
  buy_expansion: { how: 'state' },
  clear_expansion: { how: 'state' },
  expansion_secret: { how: 'state' },
  cat_rank: { how: 'state' },
  // Parte 2: species registered of one element (the multiverse elements' criador chain K33–K38)
  element_species: { how: 'state' },
};

/** counter keys whose baseline is stored when the mission appears */
export function goalCounters(g: GoalSpec): string[] {
  return GOAL_HANDLERS[g.type]?.counters?.(g) ?? [];
}
export function goalFlags(g: GoalSpec): string[] {
  return GOAL_HANDLERS[g.type]?.flags?.(g) ?? [];
}
export function goalSupported(type: string) {
  return type in GOAL_HANDLERS;
}

/** trigger kinds missions.ts understands (anything else is read as a flag: `G.has(trigger)`) */
export const TRIGGER_KINDS: Record<string, { how: string; key?: (v: string) => string }> = {
  start: { how: 'always' },
  mission: { how: 'state' },
  kl: { how: 'state' },
  boss: { how: 'state' },
  stage_cleared: { how: 'state' },
  stage_reached: { how: 'state' },
  expansion: { how: 'state' },
  first_meter_full: { how: 'flag', key: () => 'first_meter_full' },
  first_orb_drop: { how: 'counter', key: () => 'orbs_any_drop' },
  first_micro: { how: 'counter', key: () => 'micro_seen' },
  can_quick_assault: { how: 'flag', key: () => 'can_quick_assault' },
  first_flash_presage: { how: 'flag', key: () => 'flash_presage_seen' },
  event_presage: { how: 'flag', key: (v) => `event_presage:${v}` },
};

/**
 * Missions whose feature does not exist yet stay dormant (not shown, not pinned) until the gate
 * flag appears — instead of sitting in the HUD as an impossible task. `flags` = any of them opens it.
 */
export const MISSION_GATES: Record<string, { flags: string[]; why: string }> = {
  E11: { flags: ['gambit_open'], why: 'La Mesa del Gato (Cat’s Gambit) llega en M3: su dueño debe poner el flag gambit_open al abrir la mesa.' },
};
