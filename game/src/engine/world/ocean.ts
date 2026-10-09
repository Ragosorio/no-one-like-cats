/**
 * Stylized ocean (AgentGameEngine `world/ocean`): Gerstner waves evaluated identically on the GPU
 * (vertices) and on the CPU (`sample()`, so boats and swimming cats bob on the real surface), toon
 * sun glints, depth-tinted shallows and animated shore foam read from the terrain's height texture.
 * No reflection/refraction render targets: fresnel to the sky color is cheap and reads as water.
 */
import * as THREE from 'three';

export interface Wave {
  dir: [number, number];
  steep: number;
  len: number;
}

export const DEFAULT_WAVES: Wave[] = [
  { dir: [1, 0.35], steep: 0.09, len: 34 },
  { dir: [0.4, 1], steep: 0.08, len: 21 },
  { dir: [-0.6, 0.8], steep: 0.07, len: 13 },
  { dir: [0.9, -0.5], steep: 0.06, len: 7.5 },
];

const GLSL_NOISE = /* glsl */ `
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
`;

export interface OceanOpts {
  size: number;
  segments: number;
  heightTex: THREE.Texture;
  terrainHalf: number;
}

export class Ocean {
  readonly mesh: THREE.Mesh;
  readonly uniforms: Record<string, THREE.IUniform>;
  waves = DEFAULT_WAVES;
  /** global amplitude multiplier (storms raise it) */
  amp = 1;
  private time = 0;
  constructor(readonly o: OceanOpts) {
    const geo = new THREE.PlaneGeometry(o.size, o.size, o.segments, o.segments);
    geo.rotateX(-Math.PI / 2);
    const w = this.waves;
    this.uniforms = THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uTime: { value: 0 },
        uAmp: { value: 1 },
        uHeight: { value: o.heightTex },
        uHalf: { value: o.terrainHalf },
        uWaveA: { value: w.map((v) => new THREE.Vector4(v.dir[0], v.dir[1], v.steep, v.len)) },
        uDeep: { value: new THREE.Color('#0b4f7a') },
        uShallow: { value: new THREE.Color('#2fd4d0') },
        uSky: { value: new THREE.Color('#9fd8ff') },
        uSunDir: { value: new THREE.Vector3(0.3, 0.8, 0.2) },
        uSunCol: { value: new THREE.Color('#fff1d0') },
        uMoonDir: { value: new THREE.Vector3(-0.3, 0.6, -0.2) },
        uMoonCol: { value: new THREE.Color('#a8c0ff') },
        uNight: { value: 0 },
        uRain: { value: 0 },
        uFoam: { value: new THREE.Color('#f4fbff') },
        uPage: { value: 0 },
        uPageSea: { value: new THREE.Color('#4b93c4') },
        uPageShallow: { value: new THREE.Color('#7fd0de') },
      },
    ]);
    this.uniforms.uHeight.value = o.heightTex;
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      fog: true,
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        uniform float uTime; uniform float uAmp; uniform sampler2D uHeight; uniform float uHalf;
        uniform vec4 uWaveA[4];
        varying vec3 vWorld; varying vec3 vN; varying float vDepth; varying float vCrest;
        #include <fog_pars_vertex>
        float groundAt(vec2 xz){ vec2 uv = (xz + uHalf) / (2.0*uHalf);
          if (uv.x<0.0||uv.y<0.0||uv.x>1.0||uv.y>1.0) return -9.0; return texture2D(uHeight, uv).r; }
        void main(){
          vec3 p = (modelMatrix * vec4(position,1.0)).xyz;
          float g = groundAt(p.xz);
          float depth = -g;
          float damp = uAmp * smoothstep(-0.2, 3.5, depth);
          vec3 d = vec3(0.0); vec3 T = vec3(1,0,0); vec3 B = vec3(0,0,1);
          for (int i=0;i<4;i++){
            vec4 w = uWaveA[i]; vec2 dir = normalize(w.xy); float k = 6.28318/w.w; float c = sqrt(9.8/k);
            float a = (w.z/k) * damp; float f = k*(dot(dir,p.xz) - c*uTime*0.55);
            float cf = cos(f), sf = sin(f);
            d += vec3(dir.x*a*cf, a*sf, dir.y*a*cf);
            T += vec3(-dir.x*dir.x*w.z*damp*sf, dir.x*w.z*damp*cf, -dir.x*dir.y*w.z*damp*sf);
            B += vec3(-dir.x*dir.y*w.z*damp*sf, dir.y*w.z*damp*cf, -dir.y*dir.y*w.z*damp*sf);
          }
          p += d;
          vN = normalize(cross(B, T));
          vWorld = p; vDepth = depth; vCrest = d.y;
          vec4 mvPosition = viewMatrix * vec4(p,1.0);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uSky; uniform vec3 uFoam;
        uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uMoonDir; uniform vec3 uMoonCol; uniform float uNight; uniform float uRain;
        uniform float uPage; uniform vec3 uPageSea; uniform vec3 uPageShallow;
        varying vec3 vWorld; varying vec3 vN; varying float vDepth; varying float vCrest;
        #include <fog_pars_fragment>
        ${GLSL_NOISE}
        void main(){
          vec3 V = normalize(cameraPosition - vWorld);
          vec3 N = normalize(vN);
          // rain: tiny ring ripples perturb the normal
          if (uRain > 0.0) {
            vec2 cell = floor(vWorld.xz*1.3); vec2 f = fract(vWorld.xz*1.3)-0.5;
            float ph = fract(uTime*0.9 + h21(cell)*7.0);
            float ring = smoothstep(0.06,0.0,abs(length(f)-ph*0.45)) * (1.0-ph);
            N = normalize(N + vec3(f.x, 0.0, f.y) * ring * 2.5 * uRain);
          }
          float depthT = smoothstep(0.0, 7.0, vDepth);
          vec3 col = mix(uShallow, uDeep, depthT);
          float fres = pow(1.0 - max(dot(N, V), 0.0), 4.0);
          col = mix(col, uSky, clamp(fres * 0.55, 0.0, 0.5));
          // glints: sparkles, not sheets — a noise mask breaks the highlight into scattered flecks,
          // and they fade with distance (big Gerstner swells at grazing angles made flat white plates)
          float far = 1.0 - smoothstep(70.0, 180.0, length(vWorld - cameraPosition));
          float spark = step(0.62, vn(vWorld.xz * 2.1 + vec2(uTime * 0.7, -uTime * 0.5)));
          vec3 R = reflect(-normalize(uSunDir), N);
          float sp = dot(R, V);
          col += uSunCol * (step(0.996, sp) * spark * 0.9 + smoothstep(0.95, 0.997, sp) * 0.1) * (1.0-uNight) * far;
          vec3 Rm = reflect(-normalize(uMoonDir), N);
          float spm = dot(Rm, V);
          col += uMoonCol * (step(0.996, spm) * spark * 0.8 + smoothstep(0.96, 0.997, spm) * 0.08) * uNight * far;
          // shore foam: animated bands that crawl toward the beach + a solid lip
          float n = vn(vWorld.xz*0.7 + uTime*0.15);
          float band = step(0.62, fract(vDepth*1.6 - uTime*0.28 + n*0.6)) * (1.0 - smoothstep(0.15, 1.6, vDepth));
          float lip = 1.0 - smoothstep(0.05, 0.32 + n*0.15, vDepth);
          float crest = 0.45 * smoothstep(0.6, 0.8, vCrest + vn(vWorld.xz*2.3 - uTime*0.4)*0.25) * smoothstep(1.0, 4.0, vDepth) * (1.0 - smoothstep(60.0, 160.0, length(vWorld - cameraPosition)));
          float foam = clamp(max(max(band*0.85, lip), crest*0.7), 0.0, 1.0);
          col = mix(col, uFoam * mix(1.0, 0.55, uNight), foam);
          float alpha = mix(0.5, 0.97, smoothstep(0.0, 2.2, vDepth));
          alpha = max(alpha, foam);
          // PAGE lens: the Part I chart sea — two flat blues, a diamond grid and an inked shoreline ring
          if (uPage > 0.0) {
            vec2 g = vec2(vWorld.x + vWorld.z, vWorld.x - vWorld.z) / 8.0;
            vec2 f = abs(fract(g) - 0.5);
            float grid = 1.0 - smoothstep(0.0, 0.03, min(0.5 - f.x, 0.5 - f.y));
            vec3 pc = mix(uPageShallow, uPageSea, smoothstep(0.6, 3.0, vDepth));
            pc = mix(pc, vec3(1.0), (1.0 - smoothstep(0.05, 0.35, vDepth)) * 0.85);
            pc = mix(pc, pc * 0.82, grid);
            col = mix(col, pc, uPage);
            alpha = mix(alpha, 1.0, uPage);
          }
          gl_FragColor = vec4(col, alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.name = 'ocean';
    this.mesh.renderOrder = 1;
    this.mesh.frustumCulled = false;
  }

  update(dt: number) {
    this.time += dt;
    this.uniforms.uTime.value = this.time;
    this.uniforms.uAmp.value = this.amp;
  }

  /** CPU Gerstner (same math as the shader): surface height + normal-ish tilt at world x,z */
  sample(x: number, z: number, groundH = -9): { y: number; tiltX: number; tiltZ: number } {
    const damp = this.amp * smooth(-0.2, 3.5, -groundH);
    let y = 0;
    let tx = 0;
    let tz = 0;
    // fixed-point iteration so we sample the displaced surface, not the undisplaced grid point
    let px = x;
    let pz = z;
    for (let it = 0; it < 2; it++) {
      let dx = 0;
      let dz = 0;
      y = 0;
      tx = 0;
      tz = 0;
      for (const w of this.waves) {
        const l = Math.hypot(w.dir[0], w.dir[1]);
        const ddx = w.dir[0] / l;
        const ddz = w.dir[1] / l;
        const k = (2 * Math.PI) / w.len;
        const c = Math.sqrt(9.8 / k);
        const a = (w.steep / k) * damp;
        const f = k * (ddx * px + ddz * pz - c * this.time * 0.55);
        dx += ddx * a * Math.cos(f);
        dz += ddz * a * Math.cos(f);
        y += a * Math.sin(f);
        tx += ddx * w.steep * damp * Math.cos(f);
        tz += ddz * w.steep * damp * Math.cos(f);
      }
      px = x - dx;
      pz = z - dz;
    }
    return { y, tiltX: tx, tiltZ: tz };
  }

  dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

function smooth(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export { GLSL_NOISE };
