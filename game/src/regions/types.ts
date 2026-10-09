/**
 * What a Parte II region declares. The engine (World3D) runs it; RegionScene hosts it under the Pixi HUD.
 * Content only: terrain functions, props, residents, points of interest and (optionally) a cinematic.
 */
import type * as THREE from 'three';
import type { HeightFn, Painter } from '../engine/world/heightfield';
import type { SkyKey } from '../engine/world/sky';
import type { World3D } from '../engine/world/World3D';
import type { Line } from '../ui/dialog';
import type { RegionId } from './index';

export interface POI {
  id: string;
  pos: THREE.Vector3;
  label: string;
  /** battle = red, activity = gold, lore = paper, exit = ink */
  kind: 'battle' | 'activity' | 'lore' | 'exit';
  visible(): boolean;
  onTap(): void | Promise<void>;
}

export interface RegionCtx {
  world: World3D;
  three: typeof THREE;
  rng: () => number;
  /** comic dialog (the game's say) */
  say(lines: Line[]): Promise<void>;
  toast(text: string, sub?: string): void;
  /** G.count(`feature_<name>`) */
  feature(name: string): void;
  flag(f: string): void;
  has(f: string): boolean;
  /** id of the active story mission (historia chain) or null */
  activeStory(): string | null;
  missionDone(id: string): boolean;
  /** pick a resident by tap → info card (the scene shows it) */
  describe: Map<string, { title: string; text: string }>;
  /** short floating text at a world point */
  floatText(p: THREE.Vector3, text: string): void;
}

export interface RegionBuild {
  pois: POI[];
  update?(dt: number, t: number): void;
  dispose?(): void;
}

export interface CinematicShot {
  /** seconds into the cinematic */
  at: number;
  target: [number, number, number];
  yaw: number;
  pitch: number;
  dist: number;
  /** cut instead of easing */
  cut?: boolean;
  lines?: Line[];
}

export interface RegionDef {
  id: RegionId;
  name: string;
  subtitle: string;
  half: number;
  height: HeightFn;
  paint: Painter;
  walkable(x: number, z: number): boolean;
  skyKeys?: SkyKey[];
  rupture?: number;
  fog?: { near: number; far: number };
  camera: { target: [number, number, number]; yaw: number; pitch: number; dist: number; minDist?: number; maxDist?: number; bound?: number };
  /** where the player's visiting cats (Canelo & crew) start, and where the ship is moored */
  arrival: [number, number, number];
  /** where the generic story-battle marker floats */
  battleSpot?: [number, number, number];
  /** extra condition for a story battle marker (e.g. Nácar's beam puzzle solved) */
  battleGate?(battleId: string): boolean;
  /** fixed hour (cinematics); default = the player's real local time */
  hour?: number;
  weather?: 'despejado' | 'lluvia' | 'tormenta';
  /** a camera script that ends by returning to the island (no HUD but SALTAR) */
  cinematic?: { shots: CinematicShot[]; duration: number };
  build(ctx: RegionCtx): Promise<RegionBuild>;
}
