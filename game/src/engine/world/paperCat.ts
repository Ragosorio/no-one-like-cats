/**
 * PaperCat (AgentGameEngine `world/paperCat`): an illustrated MAI cat living inside the 3D world.
 *
 * Technique (the "2.5D contract" of the Parte II art bible):
 * - The painting is NOT replaced: the same PuppetBrain that animates cats on the 2D island deforms
 *   a grid mesh here (blinks, ears, tail, lean, walk, sleep, emotes are identical).
 * - Volume without repainting: a pillow height field is derived from the silhouette's distance field;
 *   its normals give a soft lambert + a sun-side rim. Painted shading stays dominant (≈70%).
 * - Grading: the sky's per-hour grade color tints the painting, so cats sit in dawn/night/storm light.
 * - Up to 4 local lights (lava, lanterns, lighthouse) splash color on the cat at night.
 * - Shadows: a contact blob + the cat's OWN silhouette projected along the sun onto its ground plane.
 * - Facing: cylindrical billboard; turning around is a quick card flip (scale.x through 0).
 */
import * as THREE from 'three';
import { PuppetBrain, type ActSet } from '../../art/puppetCore';
import { artCrossOrigin } from '../../art/artBase';

export interface PaperArt {
  map: THREE.Texture;
  nmap: THREE.DataTexture;
  w: number;
  h: number;
}

const artCache = new Map<string, Promise<PaperArt>>();

/** rasterize an SVG once and derive its pillow normal map (silhouette distance field) */
export function loadPaperArt(url: string, px = 512): Promise<PaperArt> {
  let p = artCache.get(url);
  if (!p) {
    p = (async () => {
      const img = new Image();
      img.decoding = 'async';
      // art on another origin (VITE_ART_BASE): CORS mode so the canvas below stays readable
      const co = artCrossOrigin(url);
      if (co) img.crossOrigin = co;
      img.src = url;
      await img.decode();
      const W = px;
      const H = Math.round((px * (img.naturalHeight || 700)) / (img.naturalWidth || 700));
      const cv = document.createElement('canvas');
      cv.width = W;
      cv.height = H;
      const g = cv.getContext('2d', { willReadFrequently: true })!;
      g.drawImage(img, 0, 0, W, H);
      const map = new THREE.CanvasTexture(cv);
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = 4;
      map.generateMipmaps = true;
      map.minFilter = THREE.LinearMipmapLinearFilter;
      const nmap = pillowNormals(g, W, H, 128);
      return { map, nmap, w: W, h: H };
    })();
    artCache.set(url, p);
  }
  return p;
}

/** silhouette → distance field → height (pillow) → normals, at low res (it is smooth by nature) */
function pillowNormals(g: CanvasRenderingContext2D, W: number, H: number, n: number): THREE.DataTexture {
  const small = document.createElement('canvas');
  small.width = n;
  small.height = n;
  const sg = small.getContext('2d', { willReadFrequently: true })!;
  sg.drawImage(g.canvas, 0, 0, W, H, 0, 0, n, n);
  const a = sg.getImageData(0, 0, n, n).data;
  const inside = new Uint8Array(n * n);
  for (let i = 0; i < n * n; i++) inside[i] = a[i * 4 + 3] > 96 ? 1 : 0;
  // two-pass chamfer distance transform (3-4 metric), cheap and good enough for a pillow
  const INF = 1e6;
  const d = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) d[i] = inside[i] ? INF : 0;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const i = y * n + x;
      if (!d[i]) continue;
      let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + 3);
      if (y > 0) v = Math.min(v, d[i - n] + 3);
      if (x > 0 && y > 0) v = Math.min(v, d[i - n - 1] + 4);
      if (x < n - 1 && y > 0) v = Math.min(v, d[i - n + 1] + 4);
      if (x === 0 || y === 0 || x === n - 1) v = Math.min(v, 3);
      d[i] = v;
    }
  for (let y = n - 1; y >= 0; y--)
    for (let x = n - 1; x >= 0; x--) {
      const i = y * n + x;
      if (!d[i]) continue;
      let v = d[i];
      if (x < n - 1) v = Math.min(v, d[i + 1] + 3);
      if (y < n - 1) v = Math.min(v, d[i + n] + 3);
      if (x < n - 1 && y < n - 1) v = Math.min(v, d[i + n + 1] + 4);
      if (x > 0 && y < n - 1) v = Math.min(v, d[i + n - 1] + 4);
      d[i] = v;
    }
  const R = n * 0.09 * 3; // pillow radius ≈ 9% of the painting
  const h = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) {
    const t = Math.min(1, d[i] / R);
    h[i] = Math.sqrt(1 - (1 - t) * (1 - t)); // round profile
  }
  const out = new Uint8Array(n * n * 4);
  const k = 2.2;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const i = y * n + x;
      const o = (n - 1 - y) * n + x; // DataTexture row 0 is the bottom (v = 0), like the flipped canvas
      const hl = h[y * n + Math.max(0, x - 1)];
      const hr = h[y * n + Math.min(n - 1, x + 1)];
      const hu = h[Math.max(0, y - 1) * n + x];
      const hd = h[Math.min(n - 1, y + 1) * n + x];
      let nx = (hl - hr) * k;
      let ny = (hd - hu) * k; // image y grows down; normal y points up
      let nz = 1;
      const l = Math.hypot(nx, ny, nz);
      nx /= l;
      ny /= l;
      nz /= l;
      out[o * 4] = (nx * 0.5 + 0.5) * 255;
      out[o * 4 + 1] = (ny * 0.5 + 0.5) * 255;
      out[o * 4 + 2] = (nz * 0.5 + 0.5) * 255;
      out[o * 4 + 3] = h[i] * 255;
    }
  const tex = new THREE.DataTexture(out, n, n, THREE.RGBAFormat);
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

export interface LocalLight {
  pos: THREE.Vector3;
  color: THREE.Color;
  range: number;
  intensity: number;
}

/** shared lighting state every paper cat reads (filled by the world once per frame) */
export const paperLighting = {
  sunDir: new THREE.Vector3(0.3, 0.8, 0.2),
  sunCol: new THREE.Color('#fff4e0'),
  sunI: 1,
  moonDir: new THREE.Vector3(-0.3, 0.6, 0.2),
  hemiSky: new THREE.Color('#cfe8ff'),
  hemiGround: new THREE.Color('#6b5a40'),
  grade: new THREE.Color('#ffffff'),
  night: 0,
  wet: 0,
  lights: [] as LocalLight[],
};

const MAX_L = 4;

function catMaterial(art: PaperArt) {
  const u = THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    {
      map: { value: null },
      nmap: { value: null },
      uSunDir: { value: new THREE.Vector3() },
      uSunCol: { value: new THREE.Color() },
      uSunI: { value: 1 },
      uMoonDir: { value: new THREE.Vector3() },
      uHemiSky: { value: new THREE.Color() },
      uHemiGround: { value: new THREE.Color() },
      uGrade: { value: new THREE.Color() },
      uNight: { value: 0 },
      uWet: { value: 0 },
      uFlash: { value: new THREE.Vector4(1, 1, 1, 0) },
      uGhost: { value: 0 },
      uTime: { value: 0 },
      uFacing: { value: 1 },
      uFlat: { value: 0 },
      uLens: { value: 0 },
      uLensK: { value: 0 },
      uLPos: { value: Array.from({ length: MAX_L }, () => new THREE.Vector4()) },
      uLCol: { value: Array.from({ length: MAX_L }, () => new THREE.Vector3()) },
    },
  ]);
  u.map.value = art.map;
  u.nmap.value = art.nmap;
  return new THREE.ShaderMaterial({
    uniforms: u,
    fog: true,
    alphaToCoverage: true,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vWorld; varying vec3 vRight; varying vec3 vUp; varying vec3 vFwd;
      #include <fog_pars_vertex>
      void main(){
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vRight = normalize(modelMatrix[0].xyz); vUp = normalize(modelMatrix[1].xyz); vFwd = normalize(modelMatrix[2].xyz);
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D map; uniform sampler2D nmap;
      uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uSunI; uniform vec3 uMoonDir;
      uniform vec3 uHemiSky; uniform vec3 uHemiGround; uniform vec3 uGrade; uniform float uNight; uniform float uWet;
      uniform vec4 uFlash; uniform float uGhost; uniform float uTime; uniform float uFacing; uniform float uFlat; uniform int uLens; uniform float uLensK;
      uniform vec4 uLPos[${MAX_L}]; uniform vec3 uLCol[${MAX_L}];
      varying vec2 vUv; varying vec3 vWorld; varying vec3 vRight; varying vec3 vUp; varying vec3 vFwd;
      #include <fog_pars_fragment>
      float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
      void main(){
        vec4 a = texture2D(map, vUv);
        if (a.a < 0.08) discard;
        vec4 nh = texture2D(nmap, vUv);
        vec3 nt = nh.xyz * 2.0 - 1.0;
        vec3 N = normalize(vRight * nt.x * uFacing + vUp * nt.y + vFwd * nt.z);
        vec3 L = normalize(uSunDir);
        float ndl = max(dot(N, L), 0.0);
        float hemi = dot(N, vec3(0,1,0)) * 0.5 + 0.5;
        vec3 amb = mix(uHemiGround, uHemiSky, hemi);
        // painted shading dominates; light only shapes it
        vec3 lightTerm = amb * 0.55 + uSunCol * uSunI * ndl * 0.32;
        vec3 col = a.rgb * uGrade * (0.55 + lightTerm * 0.6);
        // rim: silhouette edge facing the sun (or the moon at night)
        float edge = 1.0 - smoothstep(0.15, 0.85, nh.a);
        vec3 rimDir = normalize(mix(L, normalize(uMoonDir), uNight));
        float rim = edge * max(dot(normalize(vRight*nt.x*uFacing + vUp*nt.y), rimDir), 0.0);
        col += mix(uSunCol * 0.55 * min(uSunI, 1.4), vec3(0.55,0.65,1.0) * 0.45, uNight) * rim;
        // local lights (lava, lanterns, lighthouse)
        for (int i=0;i<${MAX_L};i++){
          vec4 lp = uLPos[i]; if (lp.w <= 0.0) continue;
          vec3 d = lp.xyz - vWorld; float dist = length(d);
          float att = pow(clamp(1.0 - dist / lp.w, 0.0, 1.0), 2.0);
          float nl = max(dot(N, d / max(dist, 0.001)), 0.0) * 0.7 + 0.3;
          col += a.rgb * uLCol[i] * att * nl;
          col += uLCol[i] * att * edge * 0.6;
        }
        // rain: slightly darker, glossier top
        col *= mix(1.0, 0.86, uWet);
        col += uWet * 0.08 * smoothstep(0.6, 1.0, N.y) * uHemiSky;
        // ECO lenses: another possibility of the same cat, painted by the shader (no new art)
        if (uLens > 0 && uLensK > 0.0) {
          float lum = dot(a.rgb, vec3(0.299, 0.587, 0.114));
          vec3 e = col;
          if (uLens == 1) { // CRISTAL: faceted normals, icy tint, sparkles, cyan rim
            vec3 fn = normalize(floor(nt * 3.0 + 0.5) / 3.0);
            float facet = 0.55 + 0.45 * dot(fn, normalize(vec3(0.4, 0.7, 0.6)));
            float spark = step(0.985, h21(floor(vUv * 60.0) + floor(uTime * 3.0)));
            e = mix(vec3(0.62, 0.86, 1.0), vec3(0.95, 0.99, 1.0), lum) * facet + spark * 0.9 + edge * vec3(0.3, 0.9, 1.0) * 0.8;
          } else if (uLens == 2) { // ORO: gilded statue, moving specular band
            float band = smoothstep(0.85, 1.0, sin(vUv.y * 9.0 + vUv.x * 4.0 - uTime * 1.6) * 0.5 + 0.5);
            e = mix(vec3(0.42, 0.25, 0.05), vec3(1.0, 0.82, 0.35), smoothstep(0.1, 0.9, lum)) + band * 0.35 + edge * vec3(1.0, 0.85, 0.4) * 0.4;
          } else if (uLens == 3) { // TINTA: three inks on paper, the Archive's own print
            float t = lum < 0.33 ? 0.0 : lum < 0.66 ? 0.55 : 1.0;
            e = mix(vec3(0.1, 0.07, 0.06), vec3(0.96, 0.92, 0.84), t) * (0.92 + 0.08 * h21(floor(vUv * 220.0)));
            e = mix(e, vec3(0.1, 0.07, 0.06), edge * 0.8);
          } else if (uLens == 4) { // ACUARELA: soft pigment, paper grain, bled edges (Sueños)
            e = mix(a.rgb, vec3(lum), 0.25) * 1.08 + vec3(0.04, 0.02, 0.06);
            e *= 0.9 + 0.1 * h21(floor(vUv * 140.0));
            e = mix(e, e * vec3(0.75, 0.7, 0.95), edge * 0.6);
          } else if (uLens == 5) { // HOLOGRAMA: scanlines + hue drift (Puerto Cometa)
            float sl = 0.75 + 0.25 * step(0.5, fract(vUv.y * 120.0 + uTime * 2.0));
            e = (0.5 + 0.5 * cos(6.2831 * (lum + vUv.y * 0.6 + uTime * 0.15 + vec3(0.0, 0.33, 0.67)))) * sl + edge * 0.5;
          }
          col = mix(col, e, uLensK);
        }
        // PAGE lens: the painting exactly as Part I shows it (unlit sticker)
        col = mix(col, a.rgb, uFlat);
        // hit/ability flash
        col = mix(col, uFlash.rgb, uFlash.a);
        float alpha = a.a;
        // REGISTRO 000: a cat-shaped hole full of static, edged in light
        if (uGhost > 0.0) {
          float st = h21(floor(vUv * 90.0) + floor(uTime * 24.0));
          vec3 hole = vec3(st * 0.12) + vec3(0.8, 0.9, 1.0) * edge * 1.4;
          col = mix(col, hole, uGhost);
          alpha *= mix(1.0, 0.92 + 0.08 * st, uGhost);
        }
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}

function shadowMaterial(art: PaperArt) {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: art.map },
      uL: { value: new THREE.Vector3(0.3, 0.8, 0.2) },
      uGround: { value: 0 },
      uAlpha: { value: 0.32 },
      uColor: { value: new THREE.Color('#1b1630') },
    },
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      uniform vec3 uL; uniform float uGround; varying vec2 vUv;
      void main(){
        vUv = uv;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vec3 L = normalize(uL); float ly = max(L.y, 0.22);
        w.xyz -= vec3(L.x, ly, L.z) * ((w.y - uGround) / ly);
        w.y = uGround + 0.03;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D map; uniform float uAlpha; uniform vec3 uColor; varying vec2 vUv;
      void main(){ float a = texture2D(map, vUv).a; if (a < 0.4) discard; gl_FragColor = vec4(uColor, uAlpha); }`,
  });
}

let blobTex: THREE.Texture | null = null;
function contactBlob() {
  if (blobTex) return blobTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  gr.addColorStop(0, 'rgba(20,16,40,0.55)');
  gr.addColorStop(1, 'rgba(20,16,40,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  blobTex = new THREE.CanvasTexture(c);
  return blobTex;
}

export interface PaperCatOpts {
  slug: string;
  url: string;
  /** standing height in world units */
  height?: number;
  acts?: ActSet;
  fps?: number;
}

const tmpV = new THREE.Vector3();

export class PaperCat {
  readonly root = new THREE.Group();
  /** the card that turns to face the camera */
  readonly card = new THREE.Group();
  readonly brain: PuppetBrain;
  readonly body: THREE.Mesh;
  readonly shadow: THREE.Mesh;
  readonly blob: THREE.Mesh;
  readonly material: THREE.ShaderMaterial;
  private shadowMat: THREE.ShaderMaterial;
  private posAttr: THREE.BufferAttribute;
  private scale: number;
  /** +1 faces camera-right, -1 camera-left (animated card flip) */
  facing = 1;
  private shown = 1;
  /** height of the ground under the feet (shadow plane) */
  ground = 0;
  /** extra lift (jumps, floating, swimming bob) */
  lift = 0;
  readonly height: number;

  constructor(
    readonly o: PaperCatOpts,
    art: PaperArt,
  ) {
    this.brain = new PuppetBrain(o.slug, { anchorX: 0.5, anchorY: 0.94, acts: o.acts ?? 'all', fps: o.fps ?? 20 });
    this.height = o.height ?? 1.6;
    this.scale = this.height / this.brain.H;
    const b = this.brain;
    const nv = b.pos.length / 2;
    const pos = new Float32Array(nv * 3);
    const uv = new Float32Array(nv * 2);
    for (let i = 0; i < nv; i++) {
      uv[i * 2] = b.uvs[i * 2];
      uv[i * 2 + 1] = 1 - b.uvs[i * 2 + 1];
    }
    const geo = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(pos, 3);
    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.posAttr);
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(new THREE.BufferAttribute(b.indices, 1));
    this.writePositions();
    geo.computeBoundingSphere();
    geo.boundingSphere!.radius *= 1.6; // deformation headroom
    this.material = catMaterial(art);
    this.body = new THREE.Mesh(geo, this.material);
    this.body.renderOrder = 2;
    this.shadowMat = shadowMaterial(art);
    this.shadow = new THREE.Mesh(geo, this.shadowMat);
    this.shadow.renderOrder = 1;
    this.shadow.frustumCulled = false;
    const blobGeo = new THREE.PlaneGeometry(1, 1);
    blobGeo.rotateX(-Math.PI / 2);
    this.blob = new THREE.Mesh(blobGeo, new THREE.MeshBasicMaterial({ map: contactBlob(), transparent: true, depthWrite: false }));
    this.blob.scale.set(this.height * 0.9, 1, this.height * 0.45);
    this.blob.renderOrder = 1;
    this.card.add(this.body, this.shadow);
    this.root.add(this.card, this.blob);
  }

  private writePositions() {
    const b = this.brain.pos;
    const p = this.posAttr.array as Float32Array;
    const s = this.scale;
    for (let i = 0, j = 0; i < b.length; i += 2, j += 3) {
      p[j] = b[i] * s;
      p[j + 1] = -b[i + 1] * s;
      p[j + 2] = 0;
    }
    this.posAttr.needsUpdate = true;
  }

  /** advance acting, face the camera, light and shade */
  update(dt: number, camera: THREE.Camera, time: number) {
    if (this.brain.tick(dt)) this.writePositions();
    // cylindrical billboard
    const cp = camera.position;
    const wp = this.root.position;
    this.card.rotation.y = Math.atan2(cp.x - wp.x, cp.z - wp.z);
    this.card.position.y = this.lift;
    // card flip toward the facing direction (passes through 0 = edge-on, like turning paper)
    this.shown += (this.facing - this.shown) * (1 - Math.exp(-dt * 14));
    const sx = Math.abs(this.shown) < 0.04 ? 0.04 * Math.sign(this.shown || 1) : this.shown;
    this.body.scale.x = sx;
    this.shadow.scale.x = sx;
    const L = paperLighting;
    const u = this.material.uniforms;
    u.uSunDir.value.copy(L.sunDir);
    u.uSunCol.value.copy(L.sunCol);
    u.uSunI.value = L.sunI;
    u.uMoonDir.value.copy(L.moonDir);
    u.uHemiSky.value.copy(L.hemiSky);
    u.uHemiGround.value.copy(L.hemiGround);
    u.uGrade.value.copy(L.grade);
    u.uNight.value = L.night;
    u.uWet.value = L.wet;
    u.uTime.value = time;
    u.uFacing.value = Math.sign(this.shown) || 1;
    // lenses fade in/out (a manifestation "arrives", it doesn't pop)
    if (this.lens) u.uLens.value = this.lens;
    this.lensK += ((this.lens ? 1 : 0) - this.lensK) * (1 - Math.exp(-dt * 4));
    u.uLensK.value = this.lensK;
    // nearest local lights
    const pos = this.root.getWorldPosition(tmpV);
    const near = L.lights
      .map((l) => ({ l, d: l.pos.distanceToSquared(pos) }))
      .filter((x) => x.d < x.l.range * x.l.range)
      .sort((a, b) => a.d - b.d);
    for (let i = 0; i < MAX_L; i++) {
      const n = near[i]?.l;
      if (n) {
        u.uLPos.value[i].set(n.pos.x, n.pos.y, n.pos.z, n.range);
        u.uLCol.value[i].set(n.color.r * n.intensity, n.color.g * n.intensity, n.color.b * n.intensity);
      } else u.uLPos.value[i].w = 0;
    }
    // shadow: sun by day, faint moon shadow at night, none in heavy overcast
    const sh = this.shadowMat.uniforms;
    const useMoon = L.night > 0.6;
    sh.uL.value.copy(useMoon ? L.moonDir : L.sunDir);
    sh.uGround.value = this.ground;
    sh.uAlpha.value = (useMoon ? 0.12 : 0.3 * Math.min(1, L.sunI / 1.6)) * (1 - this.lift * 0.3);
    this.blob.position.set(0, this.ground - this.root.position.y + 0.04, 0);
    (this.blob.material as THREE.MeshBasicMaterial).opacity = Math.max(0.25, 1 - this.lift * 0.4);
  }

  flash(color: THREE.ColorRepresentation, a: number) {
    const f = this.material.uniforms.uFlash.value as THREE.Vector4;
    const c = new THREE.Color(color);
    f.set(c.r, c.g, c.b, a);
  }

  set ghost(v: number) {
    this.material.uniforms.uGhost.value = v;
  }

  /** 0..1: PAGE lens — unlit painting, no projected shadow (the Part I look) */
  set flat(v: number) {
    this.material.uniforms.uFlat.value = v;
    this.shadow.visible = v < 0.5 && this.shadowAllowed;
  }
  /** ECO lens: 0 none · 1 cristal · 2 oro · 3 tinta · 4 acuarela · 5 holograma (eased in) */
  lens: 0 | 1 | 2 | 3 | 4 | 5 = 0;
  private lensK = 0;
  /** quality tier switch for the projected silhouette shadow */
  shadowAllowed = true;

  dispose() {
    this.body.geometry.dispose();
    this.material.dispose();
    this.shadowMat.dispose();
    this.blob.geometry.dispose();
    (this.blob.material as THREE.Material).dispose();
  }
}
