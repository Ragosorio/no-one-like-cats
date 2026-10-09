/**
 * Heightfield terrain (AgentGameEngine `world/heightfield`): a grid mesh sampled from any pure
 * height function, painted per-vertex by a game-supplied painter, lit with 3-band toon shading.
 * Also bakes a height texture so water/fog shaders know the depth under any point for free.
 */
import * as THREE from 'three';

export type HeightFn = (x: number, z: number) => number;
export type Painter = (x: number, z: number, h: number, slope: number, out: THREE.Color) => void;

let toonRamp: THREE.DataTexture | null = null;
/** 3-band ramp shared by every toon material (shadow / mid / lit) */
export function toonGradient() {
  if (toonRamp) return toonRamp;
  const d = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
  toonRamp = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
  toonRamp.minFilter = toonRamp.magFilter = THREE.NearestFilter;
  toonRamp.needsUpdate = true;
  return toonRamp;
}

export interface HeightfieldOpts {
  half: number;
  segments: number;
  height: HeightFn;
  paint: Painter;
  /** resolution of the baked height texture */
  texSize?: number;
}

export class Heightfield {
  readonly mesh: THREE.Mesh;
  readonly heightTex: THREE.DataTexture;
  readonly material: THREE.MeshToonMaterial;
  /** 0..1: rain darkens and saturates the ground a little */
  private wetU = { value: 0 };
  /** 0..1: PAGE lens (flat Part I map look) */
  private pageU = { value: 0 };
  constructor(readonly o: HeightfieldOpts) {
    const { half, segments: n, height, paint } = o;
    const geo = new THREE.PlaneGeometry(half * 2, half * 2, n, n);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const col = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    const e = (half * 2) / n;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = height(x, z);
      pos.setY(i, h);
      const slope = Math.hypot(height(x + e, z) - height(x - e, z), height(x, z + e) - height(x, z - e)) / (2 * e);
      paint(x, z, h, slope, c);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    this.material = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toonGradient() });
    this.material.onBeforeCompile = (sh) => {
      sh.uniforms.uWet = this.wetU;
      sh.uniforms.uPage = this.pageU;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWPos; varying float vH;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vH = position.y; vWPos = (modelMatrix * vec4(position, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uWet; uniform float uPage; varying vec3 vWPos; varying float vH;')
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
  diffuseColor.rgb *= mix(1.0, 0.72, uWet);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.9, 0.95, 1.08), uWet);
  // PAGE lens (the island as the Archive writes it): flat map colors, iso diamond grid, inked coast
  if (uPage > 0.5 && vH < 0.02) discard; // underwater shelf: let the chart sea show
  if (uPage > 0.0) {
    vec2 g = vec2(vWPos.x + vWPos.z, vWPos.x - vWPos.z) / 4.0;
    vec2 f = abs(fract(g) - 0.5);
    float grid = 1.0 - smoothstep(0.0, 0.035, min(0.5 - f.x, 0.5 - f.y));
    float coast = 1.0 - smoothstep(0.0, 0.12, abs(vH - 0.3));
    vec3 ink = vec3(0.09, 0.07, 0.06);
    vec3 pageCol = mix(diffuseColor.rgb * 1.08, ink, grid * 0.16 + coast * 0.9);
    diffuseColor.rgb = mix(diffuseColor.rgb, pageCol, uPage);
  }`,
        );
    };
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    this.mesh.name = 'terrain';

    const ts = o.texSize ?? 128;
    const data = new Uint16Array(ts * ts);
    for (let j = 0; j < ts; j++)
      for (let i = 0; i < ts; i++) {
        const x = -half + ((i + 0.5) / ts) * half * 2;
        const z = -half + ((j + 0.5) / ts) * half * 2;
        data[j * ts + i] = THREE.DataUtils.toHalfFloat(height(x, z));
      }
    this.heightTex = new THREE.DataTexture(data, ts, ts, THREE.RedFormat, THREE.HalfFloatType); // half floats filter linearly everywhere
    this.heightTex.minFilter = this.heightTex.magFilter = THREE.LinearFilter;
    this.heightTex.needsUpdate = true;
  }
  set wetness(v: number) {
    this.wetU.value = v;
  }
  set page(v: number) {
    this.pageU.value = v;
  }
  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.heightTex.dispose();
  }
}
