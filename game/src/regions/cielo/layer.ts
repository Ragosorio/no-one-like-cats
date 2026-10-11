/**
 * Turns a World3D into a SKY-LAYER place (Oleada 2): no ocean at the bottom (the engine's Ocean is
 * hidden, never disposed early), the heightfield cut under the island (Heightfield.cutBelow), a sea of
 * clouds far below with the Primer Mar glimpsed through it, cumulus puffs and wind streams. The main
 * island's upside-down mountain is built here too, from the region's own height function.
 */
import * as THREE from 'three';
import type { World3D } from '../../engine/world/World3D';
import type { Bin } from '../paginas/kit';
import { CloudPuffs, CloudSea, type CloudPalette, type Puff } from './clouds';
import { WindRibbons, type Stream } from './wind';
import { Mesher, rimRadius } from './kit';
import { underside, type RockPalette } from './rock';

export interface SkyLayerOpts {
  cut: number;
  seaY: number;
  /** how far below the clouds the Primer Mar is (parallax) */
  depth?: number;
  /** 0..1: how much of the cloud floor is open (higher = more sea) */
  gap?: number;
  palette: CloudPalette;
  puffs: Puff[];
  streams: Stream[];
  windColor?: string;
  drift?: [number, number];
}

export function skyLayer(w: World3D, bin: Bin, o: SkyLayerOpts) {
  w.ocean.mesh.visible = false;
  w.terrain.cutBelow = o.cut;
  const group = new THREE.Group();
  group.name = 'sky-layer';
  const sea = new CloudSea(bin, { y: o.seaY, depth: o.depth, gap: o.gap, palette: o.palette, drift: o.drift });
  const puffs = new CloudPuffs(bin, o.puffs);
  const wind = new WindRibbons(bin, o.streams, o.windColor ?? '#ffffff');
  group.add(sea.mesh, puffs.mesh, wind.mesh);
  return {
    group,
    sea,
    puffs,
    wind,
    update(t: number) {
      const s = w.cycle.s;
      sea.update(t, s, w.cycle.overcast);
      puffs.update(t, sea);
      wind.update(t, s.night, w.cycle.overcast);
    },
  };
}

/**
 * The main island's underside: its outline is where the region's height crosses the cut, so the cut
 * terrain edge sits exactly on the top ring. Returns surface points (roots, hanging trees hang there).
 */
export function mainUnderside(M: Mesher, height: (x: number, z: number) => number, o: { cut: number; rMax: number; depth: number; seed: number; pal: RockPalette; grass: string; tip?: [number, number]; segs?: number; rings?: number; jag?: number; belly?: number; inset?: number }) {
  const S = o.segs ?? 96;
  const outl: number[] = [];
  const lipY: number[] = [];
  const inset = o.inset ?? 2.2;
  for (let s = 0; s < S; s++) {
    const a = (s / S) * Math.PI * 2;
    const r = rimRadius(height, a, o.cut, o.rMax) + 0.25;
    outl.push(r);
    // the lip sits on the highest ground of the last stretch before the rim (it must cover it)
    let top = -Infinity;
    for (let d = inset + 0.4; d >= 0.2; d -= 0.3) top = Math.max(top, height(Math.cos(a) * (r - d), Math.sin(a) * (r - d)));
    lipY.push(top + 0.07);
  }
  const lerpS = (arr: number[], a: number) => {
    const f = (((a / (Math.PI * 2)) % 1) + 1) % 1;
    const i = f * S;
    const i0 = Math.floor(i) % S;
    const k = i - Math.floor(i);
    return arr[i0] * (1 - k) + arr[(i0 + 1) % S] * k;
  };
  const outline = (a: number) => lerpS(outl, a);
  const u = underside(M, { outline, cx: 0, cz: 0, y0: o.cut + 0.25, depth: o.depth, tip: o.tip, segs: S, rings: o.rings ?? 11, seed: o.seed, pal: o.pal, jag: o.jag ?? 0.1, belly: o.belly ?? 0.12, lip: { y: (a) => lerpS(lipY, a), inset, grass: o.grass } });
  return { ...u, outline };
}

/** up here there is no sea to swim in: water cats keep their paws on the island (drops the 'swim' activity) */
export function noSwimming(w: World3D) {
  const acts = w.director?.activities;
  if (!acts) return;
  for (let i = acts.length - 1; i >= 0; i--) if (acts[i].id === 'swim') acts.splice(i, 1);
}
