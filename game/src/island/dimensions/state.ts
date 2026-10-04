/** Shared, read-only snapshot of the dimension world (written by TerrainView, read by Ambient). */
import type { Plate } from './plates';

export type RegionLook = 'open' | 'veil' | 'available' | 'clearing';

export interface CamInfo {
  cx: number;
  cy: number;
  zoom: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export const dimWorld = {
  plates: null as Map<string, Plate> | null,
  biome: {} as Record<string, string>,
  looks: new Map<string, RegionLook>(),
  cam: { cx: 0, cy: 0, zoom: 1, x0: -1e9, y0: -1e9, x1: 1e9, y1: 1e9 } as CamInfo,
};

/** world-space view rect of a container's parent (the camera's world) */
export function camOf(world: { x: number; y: number; scale: { x: number } } | null, W: number, H: number): CamInfo {
  if (!world) return dimWorld.cam;
  const z = world.scale.x || 1;
  const x0 = -world.x / z;
  const y0 = -world.y / z;
  return { cx: x0 + W / (2 * z), cy: y0 + H / (2 * z), zoom: z, x0, y0, x1: x0 + W / z, y1: y0 + H / z };
}
