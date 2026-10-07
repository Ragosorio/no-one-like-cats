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
import { KO_RANKS } from './ranks';
import { GoalSpec, MISSION_GATES, goalCounters, goalSupported } from './missionGoals';

type GoalEval = { cur: number; need: number };

// dev guard: every goal type in content must have an evaluator (node scripts/verify-missions.ts for the full report)
if (import.meta.env?.DEV) {
  const bad = MISSIONS.filter((m) => !goalSupported(m.goal.type)).map((m) => `${m.id}:${m.goal.type}`);
  if (bad.length) console.warn('[missions] goal types sin evaluador:', bad.join(', '));
}

function counter(k: string) {
  return G.s.counters[k] ?? 0;
}
/** counter delta since activation */
function since(id: string, k: string) {
  return counter(k) - (G.s.missions.progress[`${id}:${k}`] ?? 0);
}
/** first counter key of a counter goal (see missionGoals.ts) */
function ck(g: GoalSpec) {
  return goalCounters(g)[0] ?? '';
}

export function evalGoal(m: MissionDef): GoalEval {
  const g = m.goal as GoalSpec;
  const n = (k: string, d = 1) => Number(g[k] ?? d);
  const bool = (v: boolean) => ({ cur: v ? 1 : 0, need: 1 });
  switch (g.type) {
    case 'tap_cat':
    case 'name_cat':
      return { cur: Math.min(1, since(m.id, ck(g))), need: 1 };
    case 'harvest_food':
      return { cur: since(m.id, 'harvest_food'), need: n('amount', 50) };
    case 'cat_level':
      return { cur: Math.max(0, ...G.s.cats.map((c) => c.level)), need: n('level') };
    case 'win_battle': {
      if (g.stage) return bool(isCleared(String(g.stage)));
      if (g.zone) return { cur: since(m.id, `wins_zone_${g.zone}`), need: n('count') };
      if (g.battle) return bool(G.has(`won_${g.battle}`));
      return { cur: since(m.id, 'wins'), need: n('count') };
    }
    case 'reach_kl':
      return { cur: G.s.kl, need: n('kl') };
    case 'watch':
      return bool((G.s.beatsSeen ?? []).includes(String(g.beat ?? 'b25_creditos')));
    case 'damage_pct': {
      const need = Math.round(n('pct', 0.15) * 100);
      return { cur: Math.min(need, counter(`dmgpct_${g.battle}`)), need };
    }
    case 'void_fragments':
      return { cur: Math.min(n('count', 7), counter('void_fragments')), need: n('count', 7) };
    case 'defeat_boss':
      return bool(G.s.campaign.bossesDefeated >= n('boss'));
    case 'ship_upgrade': {
      const fam = String(g.family);
      const cur = fam === 'any' ? Math.max(mk('hull'), mk('weapon'), mk('engine'), mk('core'), mk('shield')) : mk(fam as 'hull');
      return { cur, need: n('mk') };
    }
    case 'own_ship':
      return bool(G.s.ship.owned.includes(String(g.ship)));
    case 'own_ships':
      return { cur: G.s.ship.owned.length, need: n('count') };
    case 'own_ship_or_event':
      return bool(G.s.ship.owned.includes(String(g.ship)) || G.has(`event_done_${g.event}`));
    case 'crew_full':
      return { cur: crew(String(g.ship)).length, need: crewSize(String(g.ship)) };
    case 'stages_cleared': {
      const z = n('zone');
      let c = 0;
      for (let s = 1; s < BAL.combat.stages_per_zone; s++) if (isCleared(`${z}-${s}`)) c++;
      return { cur: c, need: n('count') };
    }
    case 'build_habitat':
      return bool(G.s.habitats.some((h) => h.element === g.element && !h.busy));
    case 'upgrade_habitat':
      return { cur: Math.max(0, ...G.s.habitats.map((h) => h.tier)), need: n('tier') };
    case 'species_owned':
      return { cur: speciesCount(), need: n('count') };
    case 'orbs_of_species':
      return { cur: Math.max(0, ...Object.values(G.s.orbs)), need: n('amount') };
    case 'star_up':
      return { cur: Math.max(1, ...G.s.cats.map((c) => c.stars)), need: n('stars') };
    case 'own_rarity':
      return bool(G.s.cats.some((c) => catDef(c.species).rarity === g.rarity));
    case 'own_mutation':
      return { cur: G.s.cats.filter((c) => !!c.mutation).length, need: n('count') };
    case 'catdex_set':
      return { cur: setsCompleted().length, need: n('count') };
    case 'resonance_parallel':
      return { cur: G.s.resonance.jobs.filter((j) => !j.ready).length, need: n('count') };
    case 'buy_expansion':
      return bool(G.s.expansions.bought.includes(n('n')));
    case 'clear_expansion':
      return bool(G.s.expansions.cleared.includes(n('n')));
    case 'expansion_secret':
      return bool(G.s.expansions.secrets.includes(n('n')));
    case 'event_complete': {
      if (!g.event || g.event === 'flash') return { cur: since(m.id, 'flash_done'), need: n('count') };
      return bool(G.has(`event_done_${g.event}`) || counter(`event_done_${g.event}`) > 0);
    }
    case 'errand':
      return bool(!!G.s.errands?.done.includes(String(g.errand)) || G.has(`errand_done_${g.errand}`));
    case 'equip_weapon_types': {
      let best = 0;
      for (const id of G.s.ship.owned) best = Math.max(best, new Set(G.s.ship.weapons?.[id] ?? []).size);
      if (G.has('equip_weapon_types_2') || counter('equip_weapon_types') > 0) best = Math.max(best, 2);
      return { cur: Math.min(best, n('distinct', 2)), need: n('distinct', 2) };
    }
    case 'equip_shield':
      return bool(mk('shield') >= 1 || counter('equip_shield') > 0);
    case 'cat_rank': {
      const want = KO_RANKS.find((r) => r.id === g.rank)?.min ?? 170;
      return { cur: Math.min(want, Math.max(0, ...G.s.cats.map((c) => c.kos ?? 0))), need: want };
    }
    case 'secret_rumors':
      // total rumors found so far (clues found before the mission appeared count too)
      return { cur: counter('secret_rumors'), need: n('count', 3) };
    case 'use_automation':
      return bool(G.has(`automation_${g.automation}`));
    default: {
      // generic counter goal (see GOAL_HANDLERS)
      const key = ck(g);
      if (key) return { cur: since(m.id, key), need: n('count', n('times', 1)) };
      return { cur: 0, need: 1 };
    }
  }
}

/** dormant until its feature exists (missionGoals.MISSION_GATES) */
function gateOpen(id: string) {
  const gt = MISSION_GATES[id];
  return !gt || gt.flags.some((f) => G.has(f));
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
  const g = m.goal as GoalSpec;
  // baselines for counter goals
  for (const k of goalCounters(g)) G.s.missions.progress[`${m.id}:${k}`] = counter(k);
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
    // a gated mission that is active in an old save goes back to sleep until its feature exists
    for (const id of [...s.active]) {
      if (gateOpen(id)) continue;
      s.active = s.active.filter((x) => x !== id);
      s.pinned = s.pinned.filter((x) => x !== id);
    }
    for (const m of MISSIONS) {
      if (s.done.includes(m.id) || s.active.includes(m.id)) continue;
      if (!gateOpen(m.id)) continue;
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
