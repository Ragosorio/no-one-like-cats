/**
 * Archipiélago de los Sueños — where everything stands (pure: the engine samples `height`; the dream islets
 * are read from the save through state/sys/suenosDream.ts, so the same island always dreams the same).
 *
 * Units: 1 ≈ one cat-length. Sea level y = 0. +x east, +z south (toward the default camera).
 *
 *        islet  islet  islet          ← one floating islet per cat that sleeps on YOUR island (≤ 6),
 *     islet    ( moon )    islet         painted by what it dreams (its element), the sleeper on top
 *
 *   ≋≋ cloud bank ≋≋                  ← Duermevela's galleon, sunk to the waist in a cloud on the sea (W)
 *     [ship]   pillow hills
 *             the vane (plaza)        ← «La veleta de los sueños»: points at tonight's strongest dream
 *        beach · arrival
 *                   your ship (S)
 */
import { fbm, smoothstep } from '../../engine/core/noise';
import { islandHeight, walkableOn } from '../shapes';
import { dreamersOf, dreamElements, type Dreamer } from '../../state/sys/suenosDream';
import type { GameState } from '../../state/game';
import * as THREE from 'three';

export const HALF = 64;
export const PLAZA = { x: 1, z: 1, h: 2.1 };
export const ARRIVAL: [number, number, number] = [5, 1, 21];
export const SHIP = { x: 14, z: 33, ry: 0.55 };
/** Duermevela's galleon, half sunk in a cloud bank west of the island */
export const GALLEON = { x: -33, z: -8, ry: 1.05 };
/** the pillow hills (soft rounded bumps) */
const PILLOWS = [
  { x: -9, z: -10, r: 7, h: 3.4 },
  { x: 9, z: -12, r: 6, h: 2.8 },
  { x: -2, z: -17, r: 6.5, h: 3.8 },
  { x: -14, z: 4, r: 5, h: 1.8 },
];

export const height = islandHeight({
  radius: 27,
  seed: 23,
  base: 1.5,
  hills: 0.9,
  pads: [
    { x: PLAZA.x, z: PLAZA.z, r: 6.5, h: PLAZA.h },
    { x: ARRIVAL[0], z: ARRIVAL[2], r: 4.5, h: 1.0 },
  ],
  bumps: PILLOWS,
});
export const walkable = walkableOn(height);

const ca = new THREE.Color();
const cb = new THREE.Color();
/**
 * Watercolor ground: pastel washes that bleed into each other (mint, lilac, peach), pigment pooling a little
 * darker at the edge of each wash, paper-white where the wash is thin. Lilac rock on the slopes.
 */
export function paint(x: number, z: number, h: number, slope: number, out: THREE.Color) {
  const n = fbm(x * 0.045, z * 0.045, 3, 7) * 0.5 + 0.5;
  const n2 = fbm(x * 0.09 + 13, z * 0.09 - 4, 2, 9) * 0.5 + 0.5;
  if (h < 0.5) {
    out.set('#e7cbc0').lerp(ca.set('#cfe0e4'), smoothstep(0.5, -1.5, h));
    return;
  }
  if (h < 1.05) {
    out.set('#f6dfcf').lerp(ca.set('#fff4e8'), n2 * 0.5);
    return;
  }
  // three washes
  ca.set('#a9d9b9').lerp(cb.set('#c9b9e8'), smoothstep(0.42, 0.58, n));
  ca.lerp(cb.set('#f3cfc4'), smoothstep(0.55, 0.7, n2) * 0.8);
  // pigment pools at the edge of a wash
  const edge = Math.max(0, 1 - Math.abs(n - 0.5) * 16);
  ca.multiplyScalar(1 - edge * 0.09);
  // thin wash: paper shows through
  ca.lerp(cb.set('#fbf6ee'), smoothstep(0.62, 0.8, n2) * 0.35);
  if (slope > 0.85) ca.lerp(cb.set('#a397c4'), smoothstep(0.85, 1.4, slope));
  out.copy(ca);
}

// ------------------------------------------------------------------ the dream islets (from the save)
export interface DreamIsle {
  /** the dreamer (null = an islet nobody dreams: a cloud with nothing on it) */
  who: Dreamer | null;
  el: string;
  x: number;
  y: number;
  z: number;
  r: number;
  seed: number;
}

type DreamSave = Pick<GameState, 'cats'> & Partial<Pick<GameState, 'habitats'>>;

/**
 * One islet per cat that dreams tonight (dreamersOf: sleepy personalities first, then whoever lives in a
 * habitat), on an arc behind the island; at least 3 (the empty ones are clouds nobody dreams yet).
 * Deterministic for a save: same sleepers → same archipelago.
 */
export function dreamIsles(save: DreamSave | null | undefined): DreamIsle[] {
  const who = dreamersOf(save);
  const dom = dreamElements(save, 1)[0] ?? 'cosmic';
  const n = Math.max(3, who.length);
  const out: DreamIsle[] = [];
  for (let i = 0; i < n; i++) {
    const d = who[i] ?? null;
    // an arc over the north half, from west-north-west to east-north-east
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * (n > 4 ? 0.5 : 0.62);
    const rr = 44 + (i % 2) * 9;
    out.push({
      who: d,
      el: d?.elements[0] ?? (i === 0 ? dom : 'cosmic'),
      x: Math.cos(a) * rr + 4,
      y: 9 + ((i * 7) % 3) * 2.6 + (d?.sleepy ? 2 : 0),
      z: Math.sin(a) * rr * 0.92 - 4,
      r: d ? (d.sleepy ? 8 : 6.8) : 5,
      seed: 11 + i * 17,
    });
  }
  return out;
}

/** where the vane on the plaza points (the strongest dream's islet) */
export function vaneTarget(isles: DreamIsle[], el: string) {
  return isles.find((s) => s.who && s.el === el) ?? isles.find((s) => s.who) ?? isles[0];
}
