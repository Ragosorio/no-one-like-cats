import { Battle, ShotPath, isRayo } from './sim';
import { moduleImmune, lateCellMul } from './bossLate';
import { CELL, Cell } from './ship';
import { Rng } from '../core/rng';
import { ShotDef } from './types';
import { ultWorth } from './ults';
import { p2AimNoise, p2ShotValue } from './multiverso';
import { crShotValue } from './cristal';
import { nzShotValue } from './ruido';
import { sealValue } from './cataclysm';

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

/** content personalities (GDD 2.9.10) → AI personality */
export const PERSONALITY_ID: Record<string, Personality> = {
  torpe: 'clumsy',
  francotirador: 'sniper',
  afinador: 'tuner',
  calculador: 'calculator',
  vengativo: 'avenger',
  saqueador: 'looter',
  demoledor: 'demolisher',
  elementalista: 'elementalist',
};

/** difficulty profile with the stage's personality on top (keeps the difficulty's aim noise) */
export function aiProfile(difficulty: keyof typeof DIFFICULTY, personality?: string): AiProfile {
  const base = DIFFICULTY[difficulty];
  const p = personality ? PERSONALITY_ID[personality] ?? (personality as Personality) : undefined;
  if (!p) return base;
  return { ...base, personality: p };
}

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

interface Target {
  x: number;
  y: number;
  v: number;
  key: string;
}

/**
 * Samples angle/power pairs for each available shooter, scores the predicted landing point
 * by nearby module value, picks with softmax temperature and applies human-like error.
 * Uses a private RNG so the battle's RNG stream isn't disturbed by thinking.
 */
export function decide(b: Battle, side: 0 | 1, profile: AiProfile, memory: Map<string, number>, seed: number, hint?: { demolisher?: boolean; dmgBy?: Map<string, number> }): AiDecision | null {
  const r = new Rng(seed);
  const enemy = 1 - side;
  const options: { shooter: string; ult: boolean; shot: ShotDef; angle: number; power: number; score: number; tx: number; ty: number }[] = [];
  const shooters: { id: string; shot: ShotDef; ult: boolean }[] = [];
  for (const c of b.shooters(side)) {
    const ult = b.canUlt(c) && ultWorth(b, c) && r.chance(profile.ultChance);
    shooters.push({ id: c.def.uid, shot: ult ? c.def.ultimate! : c.def.shot, ult });
  }
  if (!shooters.length) return null;
  const pers = profile.personality;

  // targets: alive module centers with value
  const targets: Target[] = [];
  const es = b.sides[enemy];
  for (const m of es.ship.modules) {
    if (!m.alive) continue;
    const cells = es.ship.moduleCells(m.id);
    if (!cells.length) continue;
    // a sleeping Leviatán core can't be hurt: don't waste shots on it
    if (moduleImmune(b, enemy, m.id)) continue;
    let v = MODULE_VALUE[m.kind] ?? 1;
    if (m.kind === 'catroom') {
      const cat = es.cats.find((c) => c.room === m.id);
      if (!cat || cat.ko) v = 1;
      else if (cat.charging > 0) v *= 5;
      else if (pers === 'looter') v *= 1.6;
      else if (pers === 'avenger' && hint?.dmgBy?.get(cat.def.uid)) v *= 1.8;
    }
    if (m.tag === 'throat') v = 9;
    // an exposed boss weak point (open Grimorio, charging star-core, the Espiráculo up for air): go for it
    if (b.cfg.boss?.side === enemy && m.kind === 'core') {
      const mul = lateCellMul(b, enemy, cells[0]);
      if (mul > 1) v *= 2.2;
      else if (b.boss?.id === 'leviathan') v *= 1.5;
    }
    if (m.tag === 'static') v = es.bubbleKind === 'static' ? 9 : 5;
    if (pers === 'sniper' && m.kind === 'core') v *= 1.5;
    if (pers === 'demolisher' && m.kind !== 'core') v *= 0.7;
    const cc = cells[Math.floor(cells.length / 2)];
    const p = b.cellCenter(enemy, cc.x, cc.y);
    targets.push({ x: p.x, y: p.y, v, key: `m${m.id}` });
  }
  for (const c of es.cats) {
    if (c.ko || !c.exposed || b.isFlying(c)) continue;
    const p = b.roomCenter(enemy, c.room);
    targets.push({ x: p.x, y: p.y, v: 8, key: `c${c.def.uid}` });
  }
  // boss parts: tentacles that hold our modules, the open eye, the flying gargoyle
  for (const p of es.parts) {
    if (!p.alive || !p.active) continue;
    const ctr = b.partCenter(p);
    const v = p.kind === 'eye' ? 16 : p.kind === 'gargoyle' ? 14 : p.kind === 'fog' ? (b.boss?.devour !== null && !b.boss?.fogHit ? 8 : 1) : p.kind === 'ink' ? 6 : p.grab !== null ? 7 : 4;
    targets.push({ x: ctr.x, y: ctr.y, v, key: `p${p.id}` });
  }
  // demolisher (Barón Ladrillo): the keel cells under modules — collapses are the goal
  if (pers === 'demolisher' || hint?.demolisher) {
    const keel = es.ship.rows - 1;
    for (const m of es.ship.modules) {
      if (!m.alive || (m.kind !== 'catroom' && m.kind !== 'cannon' && m.kind !== 'core')) continue;
      for (let y = m.y + m.h; y <= keel; y++) {
        const c = es.ship.get(m.x, y);
        if (c && c.module === undefined && (y === keel || !es.ship.get(m.x, y + 1))) {
          const p = b.cellCenter(enemy, c.x, c.y);
          targets.push({ x: p.x, y: p.y, v: (MODULE_VALUE[m.kind] ?? 2) * 0.9, key: `k${m.id}` });
          break;
        }
      }
    }
  }
  if (!targets.length) return null;
  const bubbleUp = es.bubble > 0 && !!es.bubbleKind;
  const wardUp = !!es.ward && es.ward.layers > 0;
  const lev = b.boss?.id === 'leviathan' && b.cfg.boss?.side === enemy;
  // Eclipse / Noctis: a blinded side aims much worse (no preview, decoys)
  const blind = b.sides[side].buffs.blind > 0 ? 3 : 1;

  const windGuess = b.wind * (1 + (r.next() * 2 - 1) * profile.windError * blind);
  // a cataclysm charging: a shot that ALSO flies through its seal is worth more (cataclysm.ts)
  const sealV = sealValue(b, side);
  for (const s of shooters) {
    const o = b.muzzle(side, s.id === 'cannon' ? undefined : s.id);
    const dir = enemy === 1 ? 1 : -1;
    let shotMul = 1;
    if (bubbleUp && !(s.shot.element === 'electric' && s.shot.trajectory !== 'gust') && s.shot.element !== 'void' && !((s.shot.projectiles ?? 1) > 1)) shotMul *= s.ult ? 0.2 : 0.55;
    const chills = s.shot.element === 'water' || s.shot.element === 'ice' || s.shot.trajectory === 'gust';
    if (b.boss?.submerged && b.cfg.boss?.side === enemy && !(s.shot.element === 'electric' || s.shot.trajectory === 'torpedo')) shotMul *= lev && chills ? 0.7 : 0.1;
    // arcane ward: rayo pops a layer, physical hits it ×1.5
    if (wardUp) shotMul *= isRayo(s.shot) ? 2.2 : s.shot.element === 'earth' || s.shot.element === 'neutral' ? 1.3 : 1;
    // a Luz ray flies dead straight: it's aimed almost flat (even a bit downward), not lobbed; rayos and ráfagas
    // (beam / gust) barely fall either: low (even negative) elevations, never lobs. Other low-gravity shots
    // (orbs, light rails) keep the lobs AND get low angles — a human can aim them flat (a low raft needs it)
    const ray = s.shot.trajectory === 'ray';
    const flat = s.shot.trajectory === 'beam' || s.shot.trajectory === 'gust';
    const g = s.shot.gravityScale ?? (s.shot.trajectory === 'orb' ? 0.5 : 1);
    const elevs = Array.from({ length: 22 }, (_, ai) => (ray ? -8 + ai * 1 : flat ? -14 + ai * 2.2 : 8 + ai * 3.4));
    if (!ray && !flat && g < 0.6) elevs.unshift(-10, -7, -4.5, -2, 0, 2, 4, 6);
    for (const deg of elevs) {
      const elev = deg * (Math.PI / 180);
      const angle = dir > 0 ? -elev : Math.PI + elev;
      for (let pi = 0; pi < 9; pi++) {
        const power = 520 + pi * 95;
        const paths = b.buildPaths(s.shot, o, angle, power, windGuess, side);
        let score = scorePaths(b, paths, targets, enemy, s.shot, sealV) * shotMul;
        if (score > 0 && (pers === 'elementalist' || pers === 'calculator')) score *= reactionBonus(b, paths, enemy, s.shot);
        // Parte 2: the AI plays the new elements on purpose (waves through cabins, ice on cannons…)
        if (score > 0) score *= p2ShotValue(b, side, s.shot, paths);
        // Parte II: Cristal combos (land on PRISMA with another element; keep a facet up)
        if (score > 0) score *= crShotValue(b, side, s.shot, paths);
        // H34: Sonido at the Bibliotecario hits ×2 (a bit less tempting when it's the hit that wakes him)
        if (score > 0) score *= nzShotValue(b, side, s.shot);
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
  // CEGADO (Luz, Parte 2): a blinded crew aims with ×2.2 error, same as the player losing the preview
  const shrink = Math.pow(pers === 'tuner' ? 0.6 : 0.8, tries) * p2AimNoise(b, side);
  const angle = pick.angle + gauss(r) * ((profile.sigmaAngleDeg * blind * Math.PI) / 180) * shrink;
  const power = pick.power * (1 + gauss(r) * profile.sigmaPower * blind * shrink);
  return { shooter: pick.shooter, ult: pick.ult, angle, power, target: { x: pick.tx, y: pick.ty } };
}

function scorePaths(b: Battle, paths: ShotPath[], targets: Target[], enemy: number, shot: ShotDef, sealV = 0) {
  let score = 0;
  for (const p of paths) {
    if (sealV && p.seal !== undefined) score += sealV;
    if (!p.impacts.length) continue;
    const ip = p.points[p.impacts[p.impacts.length - 1]];
    const hit = b.cellAt(ip.x, ip.y);
    if (hit && hit.side !== enemy) return -2; // would hit own ship (a portal turned it around)
    if (p.owners?.length && p.owners[p.owners.length - 1] !== 1 - enemy) return -2;
    for (const t of targets) {
      const d = Math.hypot(t.x - ip.x, t.y - ip.y);
      const R = shot.radius + 40;
      if (d < R) score += t.v * (1 - d / R);
    }
    if (hit && hit.side === enemy) score += 0.5;
  }
  return score;
}

/** elementalist: prefers shots that trigger reactions (wet + rayo, wet + nature, gust on fire…) */
function reactionBonus(b: Battle, paths: ShotPath[], enemy: number, shot: ShotDef) {
  const p = paths[0];
  if (!p.impacts.length) return 1;
  const ip = p.points[p.impacts[p.impacts.length - 1]];
  const cells: Cell[] = [];
  const ship = b.sides[enemy].ship;
  for (const c of ship.cells()) {
    const cc = b.cellCenter(enemy, c.x, c.y);
    if (Math.hypot(cc.x - ip.x, cc.y - ip.y) <= shot.radius + CELL) cells.push(c);
  }
  if (!cells.length) return 1;
  const wet = cells.filter((c) => c.status.wet).length / cells.length;
  const burning = cells.filter((c) => c.status.burning).length / cells.length;
  const frozen = cells.filter((c) => c.status.frozen).length / cells.length;
  const el = shot.element;
  if (el === 'electric' && shot.trajectory !== 'gust') return 1 + wet * 1.6;
  if (shot.trajectory === 'gust') return 1 + wet * 1.0 + burning * 1.2;
  if (el === 'water') return 1 + (1 - wet) * 0.5 + burning * 0.4;
  if (el === 'nature') return 1 + wet * 0.8;
  if (el === 'fire') return 1 - wet * 0.5 + frozen * 1.2; // + CHOQUE TÉRMICO
  if (el === 'earth') return 1 + frozen * 1.5;
  // Parte 2: NOTA ALTA, ARCOÍRIS, ACELERAR
  if (el === 'sound') return 1 + frozen * 1.5;
  if (el === 'light') return 1 + wet * 0.5;
  if (el === 'time') return 1 + burning * 0.8;
  return 1;
}

/**
 * Automatic ship cannons: they aim at the most valuable enemy module with modest accuracy.
 * `sigmaDeg` controls spread (upgrades/mast make it tighter).
 */
export function aimCannon(b: Battle, side: 0 | 1, cannonId: number, seed: number, sigmaDeg = 2.6, target?: { x: number; y: number }): { angle: number; power: number } {
  return aimFrom(b, side, b.cannonMuzzle(side, cannonId), b.cannonShot(side, cannonId), seed, sigmaDeg * (b.sides[side].buffs.blind > 0 ? 3 : 1), target);
}

/** aim any shot from any origin (cannons, the Arcanista's ink cats) at the most valuable target */
export function aimFrom(b: Battle, side: 0 | 1, o: { x: number; y: number }, shot: ShotDef, seed: number, sigmaDeg = 2.6, target?: { x: number; y: number }): { angle: number; power: number } {
  const r = new Rng(seed);
  const enemy = 1 - side;
  const es = b.sides[enemy];
  const targets: Target[] = [];
  for (const m of es.ship.modules) {
    if (!m.alive) continue;
    const cells = es.ship.moduleCells(m.id);
    if (!cells.length) continue;
    const cc = cells[Math.floor(cells.length / 2)];
    const p = b.cellCenter(enemy, cc.x, cc.y);
    targets.push({ x: p.x, y: p.y, v: MODULE_VALUE[m.kind] ?? 1, key: `m${m.id}` });
  }
  for (const p of es.parts) {
    if (!p.alive || !p.active) continue;
    const ctr = b.partCenter(p);
    targets.push({ x: ctr.x, y: ctr.y, v: p.kind === 'tentacle' ? 4 : 10, key: `p${p.id}` });
  }
  const dir = enemy === 1 ? 1 : -1;
  let best = { angle: dir > 0 ? -0.6 : Math.PI + 0.6, power: 800, score: -Infinity };
  for (let ai = 0; ai < 16; ai++) {
    const elev = (10 + ai * 3.5) * (Math.PI / 180);
    const angle = dir > 0 ? -elev : Math.PI + elev;
    for (let pi = 0; pi < 8; pi++) {
      const power = 560 + pi * 90;
      const paths = b.buildPaths(shot, o, angle, power, b.wind, side);
      let sc: number;
      if (target) {
        // concentrated fire: land as close as possible to where the cat hit
        const p = paths[0];
        const end = p.impacts.length ? p.points[p.impacts[p.impacts.length - 1]] : p.points[p.points.length - 1];
        const hit = p.impacts.length ? b.cellAt(end.x, end.y) : null;
        const flipped = !!p.owners?.length && p.owners[p.owners.length - 1] !== side;
        sc = (hit && hit.side !== enemy) || flipped ? -1e9 : -Math.hypot(end.x - target.x, end.y - target.y) + (hit || b.partAt(end.x, end.y, enemy, 4) ? 50 : 0);
      } else sc = scorePaths(b, paths, targets, enemy, shot) + r.next() * 0.3;
      if (sc > best.score) best = { angle, power, score: sc };
    }
  }
  return {
    angle: best.angle + gauss(r) * ((sigmaDeg * Math.PI) / 180),
    power: best.power * (1 + gauss(r) * 0.04),
  };
}
