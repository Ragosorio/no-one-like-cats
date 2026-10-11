/**
 * Distraxia, what's left of her: a BLANK PAGE that floats over the place where you put your first habitat, and
 * breathes (H61). Tap it and someone writes on it, regrets it, strikes it out, writes again — no face, no voice,
 * only handwriting (the strikethroughs themselves play as an overlay: app/oleada4Flow.ts). Afterwards the
 * strikethroughs gather into one line of ink that runs over the sea toward the edge of the chart (El Umbral).
 */
import * as THREE from 'three';
import type { Bin } from '../paginas/kit';

const PAGE_VERT = /* glsl */ `
  uniform float uTime; uniform float uBreath;
  varying vec2 vUv;
  #include <fog_pars_vertex>
  void main(){
    vUv = uv;
    vec3 p = position;
    float b = sin(uTime * 0.9) * 0.5 + 0.5;
    p *= 1.0 + b * 0.035 * uBreath;
    // the page breathes: a slow wave runs up it, a corner curls
    p.z += sin(uv.y * 3.2 + uTime * 0.9) * 0.22 * uBreath + pow(max(uv.x - 0.6, 0.0) * max(uv.y - 0.6, 0.0) * 6.0, 2.0) * 0.9;
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;

const PAGE_FRAG = /* glsl */ `
  uniform float uTime; uniform float uInk; uniform float uStrike; uniform float uGlow;
  varying vec2 vUv;
  #include <fog_pars_fragment>
  float ph(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
  float pn(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(ph(i), ph(i+vec2(1,0)), f.x), mix(ph(i+vec2(0,1)), ph(i+vec2(1,1)), f.x), f.y); }
  void main(){
    // torn edges (a page ripped out of something)
    vec2 e = min(vUv, 1.0 - vUv);
    float edge = min(e.x * 1.35, e.y);
    float rag = pn(vUv * vec2(40.0, 52.0)) * 0.03 + pn(vUv * 9.0) * 0.02;
    if (edge < rag) discard;
    vec3 paper = vec3(0.86, 0.845, 0.81) * (0.92 + 0.08 * pn(vUv * vec2(300.0, 20.0))) * (0.94 + 0.06 * pn(vUv * 7.0));
    paper *= 1.0 - smoothstep(0.06, 0.0, edge - rag) * 0.12;
    // handwriting: three rows of scribble (ink appears left to right), then the strikes over them
    float ink = 0.0;
    for (int r = 0; r < 3; r++) {
      float fr = float(r);
      float y0 = 0.68 - fr * 0.15;
      float x = vUv.x;
      float len = (fr == 1.0 ? 0.62 : 0.7) * clamp(uInk * 3.0 - fr, 0.0, 1.0);
      if (x < 0.15 || x > 0.15 + len) continue;
      float wave = sin(x * 90.0 + fr * 7.0) * 0.012 + sin(x * 31.0 + fr) * 0.01 + (pn(vec2(x * 40.0, fr)) - 0.5) * 0.02;
      ink = max(ink, smoothstep(0.006, 0.0, abs(vUv.y - y0 - wave)));
      // the strike: a heavy line through the row, a little crooked
      float sk = clamp(uStrike * 3.0 - fr, 0.0, 1.0);
      if (x < 0.13 + (len + 0.04) * sk) ink = max(ink, smoothstep(0.012, 0.004, abs(vUv.y - y0 - (x - 0.4) * 0.05 * (fr - 1.0))));
    }
    vec3 col = mix(paper, vec3(0.1, 0.07, 0.12), ink * 0.92);
    col += vec3(1.0, 0.96, 0.85) * uGlow * 0.07;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }`;

export function blankPage(bin: Bin) {
  const u = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uBreath: { value: 1 }, uInk: { value: 0 }, uStrike: { value: 0 }, uGlow: { value: 0.4 } }]);
  const m = bin.add(new THREE.ShaderMaterial({ uniforms: u, vertexShader: PAGE_VERT, fragmentShader: PAGE_FRAG, side: THREE.DoubleSide, fog: true }));
  const mesh = new THREE.Mesh(bin.add(new THREE.PlaneGeometry(3.4, 4.6, 14, 18)), m);
  mesh.name = 'blank-page';
  return { mesh, u };
}

/** the line of ink the strikethroughs gather into: from under the page, over the sea, toward the chart's edge */
export function inkLine(bin: Bin, from: THREE.Vector3, dir: THREE.Vector3, len = 80) {
  const pts: THREE.Vector3[] = [];
  const side = new THREE.Vector3(-dir.z, 0, dir.x);
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const p = from.clone().addScaledVector(dir, t * len).addScaledVector(side, Math.sin(t * 9) * 1.4 * t);
    p.y = 1.15;
    pts.push(p);
  }
  const pos: number[] = [];
  const uv: number[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const wA = 0.55 + (i / pts.length) * 0.5;
    const wB = 0.55 + ((i + 1) / pts.length) * 0.5;
    const quad = [a.clone().addScaledVector(side, -wA), a.clone().addScaledVector(side, wA), b.clone().addScaledVector(side, -wB), b.clone().addScaledVector(side, wB)];
    const t0 = i / (pts.length - 1);
    const t1 = (i + 1) / (pts.length - 1);
    for (const [q, uu, vv] of [
      [quad[0], 0, t0],
      [quad[2], 0, t1],
      [quad[1], 1, t0],
      [quad[1], 1, t0],
      [quad[2], 0, t1],
      [quad[3], 1, t1],
    ] as [THREE.Vector3, number, number][]) {
      pos.push(q.x, q.y, q.z);
      uv.push(uu, vv);
    }
  }
  const g = bin.add(new THREE.BufferGeometry());
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const u = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uLen: { value: 0 } }]);
  const m = bin.add(
    new THREE.ShaderMaterial({
      uniforms: u,
      transparent: true,
      depthWrite: false,
      fog: true,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      vertexShader: /* glsl */ `varying vec2 vUv;
        #include <fog_pars_vertex>
        void main(){
          vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform float uLen; varying vec2 vUv;
        #include <fog_pars_fragment>
        float ph(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
        void main(){
          if (vUv.y > uLen) discard;
          // dashes that close into one line as it grows (the strikes gathering)
          float gather = smoothstep(uLen - 0.25, uLen - 0.05, vUv.y);
          float dash = step(0.35 * gather, fract(vUv.y * 60.0));
          float w = abs(vUv.x - 0.5) * 2.0;
          float a = smoothstep(1.0, 0.55 + ph(floor(vUv.yy * 300.0)) * 0.3, w) * dash;
          a *= 0.85 * smoothstep(1.0, 0.92, vUv.y / max(uLen, 0.001)) + 0.15;
          // ink with a pale paper rim (it reads on the water by day and by night)
          float rim = smoothstep(0.55, 0.8, w) * smoothstep(1.0, 0.86, w) * dash;
          vec3 col = mix(vec3(0.07, 0.05, 0.1), vec3(0.95, 0.92, 0.85), rim);
          gl_FragColor = vec4(col, max(a * 0.9, rim * 0.85));
          #include <fog_fragment>
        }`,
    }),
  );
  const mesh = new THREE.Mesh(g, m);
  mesh.renderOrder = 3;
  mesh.name = 'ink-line';
  return { mesh, u, end: pts[pts.length - 1].clone() };
}
