/**
 * Simulacro (automation, Reino 40, mission C27): while it's on, your fleet replays the best stage you
 * already won "in the background" — one simulated victory every few minutes, also while you're away
 * (capped) — and pays 70% of that stage's normal replay loot. It never counts as a real battle: no
 * mission progress, no K.O. ranks, no stage records. It only saves you clicks.
 */
import { G } from '../game';
import { absStage, battleGold, battleScrap } from '../econ';
import { stagePower } from './campaign';
import { shipPower } from './ship';

const EVERY_MS = 3 * 60_000;
const SHARE = 0.7;
/** offline cap: 8 hours of simulations */
const OFFLINE_MAX = (8 * 3600_000) / EVERY_MS;
/** only stages your ship clearly outclasses */
const MIN_RATIO = 1.5;
export const SIMULACRO_KL = 40;

interface SimState {
  on: boolean;
  acc: number;
  runs: number;
  gold: number;
  scrap: number;
}

function st(): SimState {
  const ext = (G.s.ext ??= {});
  return ((ext.simulacro as SimState | undefined) ??= { on: false, acc: 0, runs: 0, gold: 0, scrap: 0 });
}

export function simulacroAvailable() {
  return G.s.kl >= SIMULACRO_KL;
}
export function simulacroOn() {
  return simulacroAvailable() && st().on;
}
export function simulacroStats() {
  const s = st();
  return { runs: s.runs, gold: s.gold, scrap: s.scrap, target: target() };
}

export function setSimulacro(on: boolean) {
  if (on && !simulacroAvailable()) return false;
  st().on = on;
  if (on) G.flag('automation_auto_battle');
  G.save();
  return true;
}

/** the highest won stage your ship outclasses (or null) */
export function target(): { zone: number; stage: number } | null {
  const sp = shipPower();
  let best: { zone: number; stage: number; abs: number } | null = null;
  for (const k of G.s.campaign.cleared) {
    const [zone, stage] = k.split('-').map(Number);
    if (!zone || !stage) continue;
    if (sp / Math.max(1e-9, stagePower(zone, stage)) < MIN_RATIO) continue;
    const abs = absStage(zone, stage);
    if (!best || abs > best.abs) best = { zone, stage, abs };
  }
  return best && { zone: best.zone, stage: best.stage };
}

function run(times: number) {
  const t = target();
  if (!t || times <= 0) return;
  const abs = absStage(t.zone, t.stage);
  const gold = Math.round(battleGold(abs, G.goldPerSec, false, false, 1) * SHARE * times);
  const scrap = Math.round(battleScrap(abs, false, 1) * SHARE * times);
  const s = st();
  s.runs += times;
  s.gold += gold;
  s.scrap += scrap;
  if (gold) G.add('gold', gold, 'simulacro');
  if (scrap) G.add('scrap', scrap, 'simulacro');
  G.count('simulacro_runs', times);
}

G.tickers.push((dt) => {
  if (!simulacroOn()) return;
  const s = st();
  s.acc += dt;
  if (s.acc < EVERY_MS) return;
  const n = Math.floor(s.acc / EVERY_MS);
  s.acc -= n * EVERY_MS;
  run(n);
});

G.offliners.push((ms) => {
  if (!simulacroOn()) return;
  const s = st();
  const n = Math.min(OFFLINE_MAX, Math.floor((s.acc + ms) / EVERY_MS));
  s.acc = (s.acc + ms) % EVERY_MS;
  run(n);
});
