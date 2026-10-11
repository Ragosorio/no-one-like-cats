/**
 * An island that RISES out of the sea (Parte II · Páginas Hundidas, its first landing: cine h33_llegada).
 *
 * The whole island (terrain, flora, props: every scene child but the sea, the sky, the weather, the particle
 * pools, the lights and the cats) is lowered by `off` world units, and the ocean is told the ground is lower too
 * (the terrain's height texture is rewritten on the fly), so its foam lip draws exactly on the waterline that
 * climbs the cliffs. The cats wait hidden until the island is up. `set(0)` restores everything exactly.
 */
import * as THREE from 'three';
import type { World3D } from '../engine/world/World3D';

export interface Rise {
  /** how deep under the sea the island is (0 = where it belongs) */
  set(off: number): void;
  readonly off: number;
  /** a random point of the island right at the current waterline (for splashes), or null */
  shore(rnd?: () => number): THREE.Vector3 | null;
  /** the cats are back (all, or those `which` picks) */
  showCats(which?: (id: string) => boolean): void;
}

export function islandRise(w: World3D, depth: number): Rise {
  const tex = w.terrain.heightTex;
  const data = tex.image.data as Uint16Array;
  const ts = tex.image.width;
  const orig = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) orig[i] = THREE.DataUtils.fromHalfFloat(data[i]);
  const half = w.o.half;
  const skip = new Set<THREE.Object3D>([w.ocean.mesh, w.sky.mesh, w.weather.mesh, w.sun.target, w.camera, ...Object.values(w.pools).map((p) => p.points)]);
  const base = new Map<THREE.Object3D, number>();
  let cur = 0;
  let texOff = 0;
  const api: Rise = {
    get off() {
      return cur;
    },
    set(off: number) {
      off = Math.max(0, Math.min(depth, off));
      if (Math.abs(off - cur) < 1e-4 && base.size) return;
      cur = off;
      const cats = new Set<THREE.Object3D>(w.cats.map((c) => c.root));
      for (const o of w.scene.children) {
        if (skip.has(o) || cats.has(o) || (o as THREE.Light).isLight) continue;
        if (!base.has(o)) base.set(o, o.position.y);
        o.position.y = base.get(o)! - off;
      }
      // under water nobody is home; who comes back (and how) is up to the scene: showCats()
      if (off > 0.05) for (const c of w.cats) c.root.visible = false;
      // the ocean reads the ground from this texture: the shore foam climbs with the island (≥ 4 cm steps)
      if (Math.abs(texOff - off) > 0.04 || off === 0) {
        texOff = off;
        for (let i = 0; i < data.length; i++) data[i] = THREE.DataUtils.toHalfFloat(orig[i] - off);
        tex.needsUpdate = true;
      }
      w.renderer.shadowMap.needsUpdate = true;
    },
    showCats(which = () => true) {
      for (const [id, r] of w.residents) if (which(id)) r.cat.root.visible = true;
    },
    shore(rnd = Math.random) {
      for (let k = 0; k < 24; k++) {
        const i = Math.floor(rnd() * ts);
        const j = Math.floor(rnd() * ts);
        const h = orig[j * ts + i] - cur;
        if (Math.abs(h) > 0.7) continue;
        return new THREE.Vector3(-half + ((i + 0.5) / ts) * half * 2, 0.1, -half + ((j + 0.5) / ts) * half * 2);
      }
      return null;
    },
  };
  return api;
}
