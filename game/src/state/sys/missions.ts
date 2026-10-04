/**
 * Missions = tutorial + story. Activated by progress triggers (never by calendar).
 * Counter-based goals measure progress since activation (baseline stored in progress[id]).
 */
import { G } from '../game';
import { MISSIONS, MISSION_BY_ID, MissionDef, catDef } from '../../data/content';
import { BAL } from '../econ';
import { speciesCount, setsCompleted, cat as getCat } from './cats';
import { mk, crew, crewSize } from './ship';
import { isCleared, stageUnlocked } from './campaign';

type GoalEval = { cur: number; need: number };

function counter(k: string) {
  return G.s.counters[k] ?? 0;
}
/** counter delta since activation */
function since(id: string, k: string) {
  return counter(k) - (G.s.missions.progress[`${id}:${k}`] ?? 0);
}
const COUNTER_KEY: Record<string, (g: Record<string, unknown>) => string> = {
  harvest_food: () => 'harvest_food',
  resonance_start: () => 'resonance_start',
  resonance_hatch: () => 'resonance_hatch',
  collect_gold: () => 'collect_gold',
  harvest: (g) => `harvest_${g.crop}`,
  use_ultimate: () => 'ultimates',
  win_by: () => 'wins_sink',
  destroy_module: (g) => `destroy_${g.module}`,
  destroy_module_arc: () => 'destroy_module_arc',
  use_feature: (g) => `feature_${g.feature}`,
  micro_complete: () => 'micro',
  gambit_play: () => 'gambit',
  win_perfect: () => 'wins_perfect',
  quick_assault: () => 'quick_assault',
  edit_layout: () => 'edit_layout',
  tap_cat: () => 'tap_cat',
  name_cat: () => 'name_cat',
  reaction_discovered: () => 'reactions_discovered',
};

export function evalGoal(m: MissionDef): GoalEval {
  const g = m.goal as Record<string, unknown> & { type: string };
  const n = (k: string, d = 1) => Number(g[k] ?? d);
  switch (g.type) {
    case 'tap_cat':
    case 'name_cat':
      return { cur: Math.min(1, since(m.id, COUNTER_KEY[g.type](g))), need: 1 };
    case 'harvest_food':
      return { cur: since(m.id, 'harvest_food'), need: n('amount', 50) };
    case 'cat_level':
      return { cur: Math.max(0, ...G.s.cats.map((c) => c.level)), need: n('level') };
    case 'win_battle': {
      if (g.stage) return { cur: isCleared(String(g.stage)) ? 1 : 0, need: 1 };
      if (g.zone) return { cur: since(m.id, `wins_zone_${g.zone}`), need: n('count') };
      if (g.battle) return { cur: G.has(`won_${g.battle}`) ? 1 : 0, need: 1 };
      return { cur: since(m.id, 'wins'), need: n('count') };
    }
    case 'reach_kl':
      return { cur: G.s.kl, need: n('kl') };
    case 'defeat_boss':
      return { cur: G.s.campaign.bossesDefeated >= n('boss') ? 1 : 0, need: 1 };
    case 'ship_upgrade': {
      const fam = String(g.family);
      const cur = fam === 'any' ? Math.max(mk('hull'), mk('weapon'), mk('engine'), mk('core'), mk('shield')) : mk(fam as 'hull');
      return { cur, need: n('mk') };
    }
    case 'own_ship':
      return { cur: G.s.ship.owned.includes(String(g.ship)) ? 1 : 0, need: 1 };
    case 'crew_full':
      return { cur: crew(String(g.ship)).length, need: crewSize(String(g.ship)) };
    case 'stages_cleared': {
      const z = n('zone');
      let c = 0;
      for (let s = 1; s < BAL.combat.stages_per_zone; s++) if (isCleared(`${z}-${s}`)) c++;
      return { cur: c, need: n('count') };
    }
    case 'build_habitat':
      return { cur: G.s.habitats.some((h) => h.element === g.element && !h.busy) ? 1 : 0, need: 1 };
    case 'upgrade_habitat':
      return { cur: Math.max(0, ...G.s.habitats.map((h) => (h.busy ? h.tier : h.tier))), need: n('tier') };
    case 'species_owned':
      return { cur: speciesCount(), need: n('count') };
    case 'orbs_of_species':
      return { cur: Math.max(0, ...Object.values(G.s.orbs)), need: n('amount') };
    case 'star_up':
      return { cur: Math.max(1, ...G.s.cats.map((c) => c.stars)), need: n('stars') };
    case 'own_rarity':
      return { cur: G.s.cats.some((c) => catDef(c.species).rarity === g.rarity) ? 1 : 0, need: 1 };
    case 'catdex_set':
      return { cur: setsCompleted().length, need: n('count') };
    case 'resonance_parallel':
      return { cur: G.s.resonance.jobs.filter((j) => !j.ready).length, need: n('count') };
    case 'buy_expansion':
      return { cur: G.s.expansions.bought.includes(n('n')) ? 1 : 0, need: 1 };
    case 'clear_expansion':
      return { cur: G.s.expansions.cleared.includes(n('n')) ? 1 : 0, need: 1 };
    case 'expansion_secret':
      return { cur: G.s.expansions.secrets.includes(n('n')) ? 1 : 0, need: 1 };
    case 'event_complete':
      return { cur: since(m.id, 'flash_done'), need: n('count') };
    default: {
      const key = COUNTER_KEY[g.type]?.(g);
      if (key) return { cur: since(m.id, key), need: n('count', n('times', 1)) };
      return { cur: 0, need: 1 };
    }
  }
}

function triggerMet(t: string): boolean {
  if (t.includes('&')) return t.split('&').every((p) => triggerMet(p.trim()));
  if (t === 'start') return true;
  const [k, v] = t.split(':');
  switch (k) {
    case 'mission':
      return G.s.missions.done.includes(v);
    case 'kl':
      return G.s.kl >= Number(v);
    case 'boss':
      return G.s.campaign.bossesDefeated >= Number(v);
    case 'stage_cleared':
      return isCleared(v);
    case 'stage_reached': {
      const [z, s] = v.split('-').map(Number);
      return stageUnlocked(z, s);
    }
    case 'expansion':
      return G.s.expansions.cleared.includes(Number(v));
    case 'first_meter_full':
      return G.has('first_meter_full');
    case 'first_orb_drop':
      return counter('orbs_any_drop') > 0;
    case 'first_micro':
      return counter('micro_seen') > 0;
    case 'can_quick_assault':
      return G.has('can_quick_assault');
    case 'first_flash_presage':
      return G.has('flash_presage_seen');
    default:
      return G.has(t);
  }
}

function activate(m: MissionDef) {
  G.s.missions.active.push(m.id);
  const g = m.goal as Record<string, unknown> & { type: string };
  // baselines for counter goals
  const keys: string[] = [];
  const ck = COUNTER_KEY[g.type]?.(g);
  if (ck) keys.push(ck);
  if (g.type === 'win_battle' && !g.stage && !g.battle) keys.push(g.zone ? `wins_zone_${g.zone}` : 'wins');
  if (g.type === 'event_complete') keys.push('flash_done');
  for (const k of keys) G.s.missions.progress[`${m.id}:${k}`] = counter(k);
  // pin: keep max 3 (story first)
  const pins = G.s.missions.pinned;
  if (pins.length < 3) pins.push(m.id);
  else if (m.chain === 'historia') {
    const idx = pins.findIndex((id) => MISSION_BY_ID.get(id)?.chain !== 'historia');
    if (idx >= 0) pins[idx] = m.id;
  }
  G.emit('mission', { id: m.id, kind: 'new' });
}

export function activeMissions() {
  return G.s.missions.active.map((id) => MISSION_BY_ID.get(id)!).filter(Boolean);
}

/** Run every second or after relevant actions: activate new missions, complete finished ones. */
export function checkMissions() {
  const s = G.s.missions;
  // loop until stable: completing a mission can activate the next one in its chain
  for (let pass = 0; pass < 6; pass++) {
    let changed = false;
    for (const m of MISSIONS) {
      if (s.done.includes(m.id) || s.active.includes(m.id)) continue;
      if (triggerMet(m.trigger)) {
        activate(m);
        changed = true;
      }
    }
    for (const id of [...s.active]) {
      const m = MISSION_BY_ID.get(id)!;
      const e = evalGoal(m);
      if (e.cur >= e.need) {
        complete(m);
        changed = true;
      }
    }
    if (!changed) break;
  }
}

export interface MissionReward {
  gold: number;
  food: number;
  gems: number;
  orbs: { species: string; n: number } | null;
}

function complete(m: MissionDef): MissionReward {
  const s = G.s.missions;
  s.active = s.active.filter((x) => x !== m.id);
  s.pinned = s.pinned.filter((x) => x !== m.id);
  s.done.push(m.id);
  const r = m.reward as Record<string, unknown> & { std: boolean };
  const out: MissionReward = { gold: 0, food: 0, gems: 0, orbs: null };
  if (r.std) {
    out.gold += Math.max(50, Math.round(G.goldPerSec * BAL.kingdom.mission_reward.gold_seconds_of_income));
    out.food += Math.max(20, Math.round(G.foodPerSec * BAL.kingdom.mission_reward.food_seconds_of_income));
    if (Math.random() < BAL.kingdom.mission_reward.gem_chance) out.gems += 1;
    const pool = G.s.cats;
    if (pool.length) out.orbs = { species: pool[Math.floor(Math.random() * pool.length)].species, n: BAL.kingdom.mission_reward.orbs };
    G.purr('mission', 'mission');
    G.bump('mission');
    G.xp('mission');
  }
  out.gold += Number(r.gold ?? 0);
  out.food += Number(r.food ?? 0);
  out.gems += Number(r.gems ?? 0);
  if (r.orbsOfFedCat) {
    const best = [...G.s.cats].sort((a, b) => b.level - a.level)[0];
    if (best) out.orbs = { species: best.species, n: Number(r.orbsOfFedCat) };
  }
  if (out.gold) G.add('gold', out.gold, 'mission');
  if (out.food) G.add('food', out.food, 'mission');
  if (out.gems) G.add('gems', out.gems, 'mission');
  if (out.orbs) G.addOrbs(out.orbs.species, out.orbs.n);
  for (const u of m.unlocks) if (!/^[HCKE]\d\d$/.test(u)) G.flag(u);
  G.count('missions_done');
  lastRewards.set(m.id, out);
  G.emit('mission', { id: m.id, kind: 'done' });
  return out;
}
export const lastRewards = new Map<string, MissionReward>();

export function pin(id: string) {
  const p = G.s.missions.pinned;
  if (p.includes(id)) G.s.missions.pinned = p.filter((x) => x !== id);
  else {
    if (p.length >= 3) p.shift();
    p.push(id);
  }
}

let acc = 0;
G.tickers.push((dt) => {
  acc += dt;
  if (acc > 700) {
    acc = 0;
    checkMissions();
  }
});

export { getCat };
