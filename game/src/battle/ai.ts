import { Battle, ShotPath } from './sim';
import { CELL } from './ship';
import { Rng } from '../core/rng';
import { ShotDef } from './types';

export type Personality = 'clumsy' | 'sniper' | 'tuner' | 'calculator' | 'avenger' | 'looter' | 'demolisher' | 'elementalist';

export interface AiProfile {
  sigmaAngleDeg: number;
  sigmaPower: number;
  windError: number;
  temperature: number;
  personality: Personality;
  /** chance to use ultimate when ready */
  ultChance: number;
}

export const DIFFICULTY: Record<'easy' | 'normal' | 'hard' | 'boss', AiProfile> = {
  easy: { sigmaAngleDeg: 6, sigmaPower: 0.12, windError: 0.4, temperature: 1.2, personality: 'clumsy', ultChance: 0.4 },
  normal: { sigmaAngleDeg: 3, sigmaPower: 0.06, windError: 0.2, temperature: 0.6, personality: 'tuner', ultChance: 0.7 },
  hard: { sigmaAngleDeg: 1.5, sigmaPower: 0.03, windError: 0.08, temperature: 0.25, personality: 'calculator', ultChance: 0.9 },
  boss: { sigmaAngleDeg: 0.9, sigmaPower: 0.018, windError: 0.03, temperature: 0.1, personality: 'calculator', ultChance: 1 },
};

const MODULE_VALUE: Record<string, number> = { core: 10, catroom: 6, cannon: 4, shield: 5, arcane: 5, powder: 7, mast: 2, engine: 3 };

function gauss(r: Rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = r.next();
  while (v === 0) v = r.next();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export interface AiDecision {
  shooter: string;
  ult: boolean;
  angle: number;
  power: number;
  target: { x: number; y: number };
}

/**
 * Samples angle/power pairs for each available shooter, scores the predicted landing point
 * by nearby module value, picks with softmax temperature and applies human-like error.
 * Uses a private RNG so the battle's RNG stream isn't disturbed by thinking.
 */
export function decide(b: Battle, side: 0 | 1, profile: AiProfile, memory: Map<string, number>, seed: number): AiDecision | null {
  const r = new Rng(seed);
  const enemy = 1 - side;
  const options: { shooter: string; ult: boolean; shot: ShotDef; angle: number; power: number; score: number; tx: number; ty: number }[] = [];
  const shooters: { id: string; shot: ShotDef; ult: boolean }[] = [];
  for (const c of b.shooters(side)) {
    const ult = b.canUlt(c) && r.chance(profile.ultChance);
    shooters.push({ id: c.def.uid, shot: ult ? c.def.ultimate! : c.def.shot, ult });
  }
  if (!shooters.length && b.canCannon(side)) shooters.push({ id: 'cannon', shot: { id: 'cannon', name: '', element: 'neutral', trajectory: 'ballistic', power: 1, radius: 70 }, ult: false });
  if (!shooters.length) return null;

  // targets: alive module centers with value
  const targets: { x: number; y: number; v: number; key: string }[] = [];
  const es = b.sides[enemy];
  for (const m of es.ship.modules) {
    if (!m.alive) continue;
    const cells = es.ship.moduleCells(m.id);
    if (!cells.length) continue;
    let v = MODULE_VALUE[m.kind] ?? 1;
    if (m.kind === 'catroom') {
      const cat = es.cats.find((c) => c.room === m.id);
      if (!cat || cat.ko) v = 1;
      else if (cat.charging > 0) v *= 5;
    }
    if (profile.personality === 'demolisher' && m.kind !== 'core') v *= 0.7;
    const cc = cells[Math.floor(cells.length / 2)];
    const p = b.cellCenter(enemy, cc.x, cc.y);
    targets.push({ x: p.x, y: p.y, v, key: `m${m.id}` });
  }
  for (const c of es.cats) {
    if (c.ko || !c.exposed) continue;
    const p = b.roomCenter(enemy, c.room);
    targets.push({ x: p.x, y: p.y, v: 8, key: `c${c.def.uid}` });
  }
  if (!targets.length) return null;

  const windGuess = b.wind * (1 + (r.next() * 2 - 1) * profile.windError);
  for (const s of shooters) {
    const o = b.muzzle(side, s.id === 'cannon' ? undefined : s.id);
    const dir = enemy === 1 ? 1 : -1;
    for (let ai = 0; ai < 22; ai++) {
      const elev = (8 + ai * 3.4) * (Math.PI / 180);
      const angle = dir > 0 ? -elev : Math.PI + elev;
      for (let pi = 0; pi < 9; pi++) {
        const power = 520 + pi * 95;
        const paths = b.buildPaths(s.shot, o, angle, power, windGuess, side);
        const score = scorePaths(b, paths, targets, enemy, s.shot);
        if (score > 0) {
          const end = paths[0].points[paths[0].points.length - 1];
          options.push({ shooter: s.id, ult: s.ult, shot: s.shot, angle, power, score, tx: end.x, ty: end.y });
        }
      }
    }
  }
  if (!options.length) {
    const s = shooters[0];
    return { shooter: s.id, ult: false, angle: enemy === 1 ? -0.7 : Math.PI + 0.7, power: 850, target: { x: 0, y: 0 } };
  }
  options.sort((a, b2) => b2.score - a.score);
  const top = options.slice(0, 12);
  const T = Math.max(0.05, profile.temperature);
  const maxS = top[0].score;
  const weights = top.map((o) => Math.exp((o.score - maxS) / (maxS * 0.25 * T + 1e-6)));
  let pick = top[0];
  let acc = r.next() * weights.reduce((a, w) => a + w, 0);
  for (let i = 0; i < top.length; i++) {
    acc -= weights[i];
    if (acc <= 0) {
      pick = top[i];
      break;
    }
  }
  // human error with bracketing (gets better on repeated targets)
  const key = `${Math.round(pick.tx / CELL)}`;
  const tries = memory.get(key) ?? 0;
  memory.set(key, tries + 1);
  const shrink = Math.pow(profile.personality === 'tuner' ? 0.6 : 0.8, tries);
  const angle = pick.angle + gauss(r) * ((profile.sigmaAngleDeg * Math.PI) / 180) * shrink;
  const power = pick.power * (1 + gauss(r) * profile.sigmaPower * shrink);
  return { shooter: pick.shooter, ult: pick.ult, angle, power, target: { x: pick.tx, y: pick.ty } };
}

function scorePaths(b: Battle, paths: ShotPath[], targets: { x: number; y: number; v: number }[], enemy: number, shot: ShotDef) {
  let score = 0;
  for (const p of paths) {
    if (!p.impacts.length) continue;
    const ip = p.points[p.impacts[p.impacts.length - 1]];
    const hit = b.cellAt(ip.x, ip.y);
    if (hit && hit.side !== enemy) return -1; // would hit own ship
    for (const t of targets) {
      const d = Math.hypot(t.x - ip.x, t.y - ip.y);
      const R = shot.radius + 40;
      if (d < R) score += t.v * (1 - d / R);
    }
    if (hit && hit.side === enemy) score += 0.5;
  }
  return score;
}
