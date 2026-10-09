/**
 * Isla Nácar's materials — the region's LENS (art bible §7: refraction, caustics, soft bloom), all in
 * code: faceted crystals that refract their own insides and shimmer like mother-of-pearl, nacre shells,
 * tide-pool water with caustics, a ground light layer (the beam's caustic strip + prism rainbows that
 * turn with the sun), the beam itself, soft additive halos (our "bloom"), mirrors and the crystal door.
 *
 * Every material reads one shared set of light uniforms (`Lit`), synced from the world once a frame.
 */
import * as THREE from 'three';
import { GLSL_NOISE } from '../../engine/world/ocean';
import { paperLighting } from '../../engine/world/paperCat';

export interface Lit {
  uSunDir: { value: THREE.Vector3 };
  uSunCol: { value: THREE.Color };
  uSunI: { value: number };
  uMoonDir: { value: THREE.Vector3 };
  uHemiSky: { value: THREE.Color };
  uHemiGround: { value: THREE.Color };
  uNight: { value: number };
  uTime: { value: number };
}

export function makeLit(): Lit {
  return {
    uSunDir: { value: new THREE.Vector3(0.3, 0.8, -0.3) },
    uSunCol: { value: new THREE.Color('#ffffff') },
    uSunI: { value: 1 },
    uMoonDir: { value: new THREE.Vector3(-0.3, 0.6, 0.2) },
    uHemiSky: { value: new THREE.Color('#cfe8ff') },
    uHemiGround: { value: new THREE.Color('#6b5a40') },
    uNight: { value: 0 },
    uTime: { value: 0 },
  };
}

/** copy the world's light (paperLighting is filled by World3D.frame before props update) */
export function syncLit(L: Lit, t: number) {
  const P = paperLighting;
  L.uSunDir.value.copy(P.sunDir);
  L.uSunCol.value.copy(P.sunCol);
  L.uSunI.value = P.sunI;
  L.uMoonDir.value.copy(P.moonDir);
  L.uHemiSky.value.copy(P.hemiSky);
  L.uHemiGround.value.copy(P.hemiGround);
  L.uNight.value = P.night;
  L.uTime.value = t;
}

const LIT_GLSL = /* glsl */ `
  uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uSunI; uniform vec3 uMoonDir;
  uniform vec3 uHemiSky; uniform vec3 uHemiGround; uniform float uNight; uniform float uTime;
  vec3 keyDir(){ return normalize(mix(uSunDir, uMoonDir, smoothstep(0.45, 0.8, uNight))); }
  vec3 keyCol(){ return uSunCol * uSunI + vec3(0.62, 0.68, 1.0) * 0.55 * uNight; }
  vec3 hsv(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
  ${GLSL_NOISE}
`;

const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

// ───────────────────────────── crystals ─────────────────────────────
/**
 * Faceted crystal (instanced or not). Flat facet normals come from screen derivatives, so any
 * instance scale stays correctly faceted. Body color per instance; the inside is a fake refraction
 * (noise veins sampled along the refracted view ray), the skin is a thin-film nacre iridescence,
 * sun glints per facet, and at night they breathe a faint inner glow.
 */
export function crystalMaterial(L: Lit, o: { glow?: number; color?: THREE.ColorRepresentation } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...L, ...fogU(), uGlow: { value: o.glow ?? 1 }, uColor: { value: new THREE.Color(o.color ?? '#ffffff') }, uCharge: { value: 0 } },
    fog: true,
    vertexShader: /* glsl */ `
      attribute float aSeed;
      varying vec3 vW; varying vec3 vCol; varying float vH; varying float vSeed;
      uniform vec3 uColor;
      #include <fog_pars_vertex>
      void main(){
        mat4 m = modelMatrix;
        #ifdef USE_INSTANCING
          m = modelMatrix * instanceMatrix;
        #endif
        vec4 w = m * vec4(position, 1.0);
        vW = w.xyz;
        vH = clamp(position.y, 0.0, 1.0);
        vCol = uColor;
        #ifdef USE_INSTANCING_COLOR
          vCol *= instanceColor;
        #endif
        #ifdef USE_INSTANCING
          vSeed = aSeed;
        #else
          vSeed = 0.37;
        #endif
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      ${LIT_GLSL}
      uniform float uGlow; uniform float uCharge;
      varying vec3 vW; varying vec3 vCol; varying float vH; varying float vSeed;
      #include <fog_pars_fragment>
      void main(){
        vec3 V = normalize(cameraPosition - vW);
        vec3 N = normalize(cross(dFdx(vW), dFdy(vW)));
        if (dot(N, V) < 0.0) N = -N;
        vec3 L = keyDir();
        float ndl = dot(N, L);
        float band = 0.42 + smoothstep(-0.02, 0.06, ndl) * 0.3 + smoothstep(0.5, 0.58, ndl) * 0.28;
        vec3 amb = mix(uHemiGround, uHemiSky, N.y * 0.5 + 0.5);
        float nv = clamp(dot(N, V), 0.0, 1.0);
        float fres = pow(1.0 - nv, 2.2);
        // inside: veins along the refracted ray (the crystal has depth)
        vec3 Rf = refract(-V, N, 0.66);
        vec2 q = vW.xz * 0.35 + Rf.xz * 2.6 + vec2(vSeed * 13.0, vW.y * 0.22);
        float inner = vn(q) * 0.65 + vn(q * 2.7 + 3.1) * 0.35;
        float vein = smoothstep(0.07, 0.0, abs(inner - 0.52));
        vec3 body = vCol;
        vec3 deep = body * body * vec3(0.55, 0.62, 0.95);
        vec3 col = mix(deep, body, 0.25 + 0.75 * vH);
        col *= amb * 0.62 + keyCol() * band * 0.42;
        col += mix(body, vec3(1.0), 0.5) * vein * (0.22 + 0.3 * uNight);
        // thin-film (mother-of-pearl) iridescence on the skin
        vec3 irid = 0.5 + 0.5 * cos(6.2831 * (fres * 0.85 + vH * 0.35 + vSeed + vec3(0.0, 0.33, 0.67)));
        col += irid * fres * (0.28 + 0.22 * uNight);
        col += vec3(0.96, 0.97, 1.0) * fres * 0.22;
        // facet glints
        vec3 Hh = normalize(L + V);
        col += keyCol() * pow(max(dot(N, Hh), 0.0), 70.0) * 0.9;
        col += keyCol() * smoothstep(0.985, 1.0, dot(reflect(-V, N), L)) * 0.6;
        // night: a faint breathing inner light; charge: the beam pours in
        float breathe = 0.7 + 0.3 * sin(uTime * 1.1 + vSeed * 30.0);
        col += body * uNight * uGlow * (0.1 + 0.42 * vH) * breathe;
        col += (body * 0.6 + 0.5) * uCharge * (0.35 + vein);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}

// ───────────────────────────── nacre (shells, pearls) ─────────────────────────────
/** mother-of-pearl: ribbed pastel outside, rainbow nacre inside (gl_FrontFacing picks the side) */
export function nacreMaterial(L: Lit, pearl = false) {
  return new THREE.ShaderMaterial({
    uniforms: { ...L, ...fogU() },
    fog: true,
    side: pearl ? THREE.FrontSide : THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying float vSeed;
      #include <fog_pars_vertex>
      void main(){
        mat4 m = modelMatrix;
        #ifdef USE_INSTANCING
          m = modelMatrix * instanceMatrix;
          vSeed = fract(instanceMatrix[3].x * 0.173 + instanceMatrix[3].z * 0.311);
        #else
          vSeed = 0.5;
        #endif
        vec4 w = m * vec4(position, 1.0);
        vW = w.xyz;
        vN = normalize(mat3(m) * normal);
        vUv = uv;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      ${LIT_GLSL}
      varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying float vSeed;
      #include <fog_pars_fragment>
      void main(){
        vec3 V = normalize(cameraPosition - vW);
        vec3 N = normalize(vN);
        bool inside = !gl_FrontFacing;
        if (inside) N = -N;
        vec3 L = keyDir();
        float ndl = dot(N, L);
        float band = 0.5 + smoothstep(-0.05, 0.08, ndl) * 0.25 + smoothstep(0.45, 0.55, ndl) * 0.25;
        vec3 amb = mix(uHemiGround, uHemiSky, N.y * 0.5 + 0.5);
        float nv = clamp(dot(N, V), 0.0, 1.0);
        float fres = pow(1.0 - nv, 1.6);
        ${
          pearl
            ? `vec3 base = vec3(0.97, 0.95, 1.0);
               vec3 film = 0.5 + 0.5 * cos(6.2831 * (fres * 1.1 + vSeed + vec3(0.0, 0.33, 0.67)));
               vec3 col = base * (amb * 0.7 + keyCol() * band * 0.45) + film * fres * 0.45;
               col += keyCol() * pow(max(dot(N, normalize(L + V)), 0.0), 50.0) * 0.8;
               col += vec3(0.85, 0.8, 1.0) * uNight * (0.45 + 0.25 * sin(uTime * 1.7 + vSeed * 20.0));`
            : `// growth rings + radial ribs
               float rings = 0.5 + 0.5 * sin(vUv.x * 46.0);
               float ribs = abs(sin(vUv.y * 3.1416 * 9.0));
               vec3 outside = mix(vec3(0.98, 0.78, 0.86), vec3(0.78, 0.7, 0.98), vUv.x * 0.8 + rings * 0.2);
               outside = mix(outside, vec3(1.0, 0.95, 0.97), smoothstep(0.85, 1.0, ribs) * 0.5);
               outside *= 0.8 + 0.2 * ribs;
               vec3 film = 0.5 + 0.5 * cos(6.2831 * (fres * 0.9 + vUv.x * 0.6 + vn(vW.xz * 1.3) * 0.5 + vSeed + vec3(0.0, 0.33, 0.67)));
               vec3 nacre = mix(vec3(0.97, 0.95, 1.0), film, 0.32 + fres * 0.4);
               vec3 base = inside ? nacre : outside;
               vec3 col = base * (amb * 0.62 + keyCol() * band * 0.48);
               col += (inside ? film * 0.3 : film * 0.12) * fres;
               col += keyCol() * pow(max(dot(N, normalize(L + V)), 0.0), inside ? 40.0 : 18.0) * (inside ? 0.7 : 0.2);
               col += base * uNight * (inside ? 0.16 : 0.05);`
        }
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}

// ───────────────────────────── tide pool water ─────────────────────────────
export function poolMaterial(L: Lit, sky: { uZenith: THREE.IUniform; uHorizon: THREE.IUniform }) {
  return new THREE.ShaderMaterial({
    uniforms: { ...L, uZenith: sky.uZenith, uHorizon: sky.uHorizon },
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      attribute float aR; varying vec3 vW; varying float vR;
      void main(){ vR = aR; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      ${LIT_GLSL}
      uniform vec3 uZenith; uniform vec3 uHorizon;
      varying vec3 vW; varying float vR;
      void main(){
        vec3 V = normalize(cameraPosition - vW);
        vec2 p = vW.xz;
        // tiny ripples
        vec3 N = normalize(vec3(sin(p.x * 3.0 + uTime * 1.7) * 0.05 + (vn(p * 2.0 + uTime * 0.4) - 0.5) * 0.12, 1.0, cos(p.y * 2.6 - uTime * 1.3) * 0.05));
        float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
        vec3 R = reflect(-V, N);
        vec3 sky = mix(uHorizon, uZenith, smoothstep(0.0, 0.7, R.y));
        float edge = smoothstep(0.55, 1.0, vR);
        vec3 water = mix(vec3(0.1, 0.62, 0.66), vec3(0.42, 0.86, 0.86), edge);
        // caustic net
        float v = vn(p * 1.6 + uTime * 0.35) + vn(p * 2.3 - uTime * 0.25);
        float caus = pow(1.0 - abs(sin(3.1416 * v * 1.6)), 8.0);
        vec3 lightC = keyCol();
        vec3 col = water * (uHemiSky * 0.5 + lightC * 0.22) + lightC * caus * 0.3 * (1.0 - uNight) + sky * fres * 0.6;
        col += keyCol() * pow(max(dot(R, keyDir()), 0.0), 120.0) * 2.0;
        // pearls under the surface light the pools at night
        col += vec3(0.45, 0.9, 1.0) * uNight * (0.25 + 0.2 * caus) * (1.0 - edge * 0.5);
        float a = mix(0.72, 0.9, fres) * smoothstep(1.0, 0.9, vR);
        gl_FragColor = vec4(col, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

// ───────────────────────────── ground light: beam caustics + prism rainbows ─────────────────────────────
export const MAX_SEG = 8;
export const MAX_FAN = 6;

export function groundLightMaterial(L: Lit) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...L,
      uSeg: { value: Array.from({ length: MAX_SEG }, () => new THREE.Vector4()) },
      uSegN: { value: 0 },
      uFan: { value: Array.from({ length: MAX_FAN }, () => new THREE.Vector4()) },
      uBeamCol: { value: new THREE.Color('#fff4ff') },
      uBeamI: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
    vertexShader: /* glsl */ `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      ${LIT_GLSL}
      uniform vec4 uSeg[${MAX_SEG}]; uniform int uSegN; uniform vec4 uFan[${MAX_FAN}];
      uniform vec3 uBeamCol; uniform float uBeamI;
      varying vec3 vW;
      void main(){
        vec2 p = vW.xz;
        // the beam's light on the ground: a caustic strip under every segment
        float g = 0.0;
        for (int i = 0; i < ${MAX_SEG}; i++) {
          if (i >= uSegN) break;
          vec2 a = uSeg[i].xy; vec2 b = uSeg[i].zw; vec2 pa = p - a; vec2 ba = b - a;
          float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
          float d = length(pa - ba * h);
          g = max(g, exp(-d * d * 0.42));
        }
        float v = vn(p * 0.9 + uTime * 0.45) + vn(p * 1.7 - uTime * 0.3) * 0.6;
        float caus = pow(1.0 - abs(sin(3.1416 * v * 1.4)), 7.0);
        vec3 col = uBeamCol * g * (0.05 + 0.42 * caus) * uBeamI;
        // prism rainbows: every source throws a spectral fan AWAY from the sun; it turns with the day
        float day = clamp(uSunI / 2.2, 0.0, 1.0) * (1.0 - uNight);
        vec2 away = -uSunDir.xz; float al = length(away);
        if (al > 1e-3 && day > 0.01) {
          away /= al;
          vec2 side = vec2(-away.y, away.x);
          for (int i = 0; i < ${MAX_FAN}; i++) {
            vec4 f = uFan[i];
            if (f.z <= 0.0) continue;
            vec2 d = p - f.xy;
            float along = dot(d, away);
            float lat = dot(d, side);
            float ang = atan(lat, max(along, 1e-3));
            float t = (ang - f.w) / 0.62 + 0.5;
            float mask = smoothstep(0.0, 0.2, t) * smoothstep(1.0, 0.8, t) * smoothstep(f.z * 0.2, f.z * 0.5, along) * smoothstep(f.z * 1.2, f.z * 0.6, along);
            col += hsv(0.8 * (1.0 - t)) * mask * day * 0.4;
          }
        }
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

// ───────────────────────────── the nacre path ─────────────────────────────
/** hexagonal mother-of-pearl tiles (world-space), toon-lit, each tile with its own sheen */
export function pathMaterial(L: Lit) {
  return new THREE.ShaderMaterial({
    uniforms: { ...L, ...fogU() },
    fog: true,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    vertexShader: /* glsl */ `
      varying vec3 vW;
      #include <fog_pars_vertex>
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      ${LIT_GLSL}
      varying vec3 vW;
      #include <fog_pars_fragment>
      void main(){
        vec2 p = vW.xz / 0.62;
        vec2 r = vec2(1.0, 1.7320508); vec2 hh = r * 0.5;
        vec2 a = mod(p, r) - hh; vec2 b = mod(p - hh, r) - hh;
        vec2 gv = dot(a, a) < dot(b, b) ? a : b;
        vec2 id = p - gv;
        vec2 q = abs(gv); float e = max(dot(q, normalize(r)), q.x);
        float grout = smoothstep(0.42, 0.47, e);
        float rnd = h21(id);
        vec3 V = normalize(cameraPosition - vW);
        vec3 base = mix(vec3(0.97, 0.95, 1.0), mix(vec3(0.84, 0.78, 0.98), vec3(0.78, 0.9, 1.0), h21(id + 7.0)), 0.25 + 0.35 * rnd);
        float ndl = keyDir().y;
        vec3 col = base * (mix(uHemiGround, uHemiSky, 0.85) * 0.6 + keyCol() * (0.3 + 0.2 * smoothstep(0.0, 0.5, ndl)) * 0.6);
        float fres = pow(1.0 - clamp(V.y, 0.0, 1.0), 2.0);
        vec3 film = 0.5 + 0.5 * cos(6.2831 * (fres * 0.8 + rnd + vec3(0.0, 0.33, 0.67)));
        col += film * (0.05 + 0.12 * fres) * (1.0 - grout);
        col = mix(col, col * vec3(0.7, 0.66, 0.86), grout);
        col += vec3(0.75, 0.7, 1.0) * uNight * 0.08 * (1.0 - grout) * (0.6 + 0.4 * sin(uTime * 0.8 + rnd * 20.0));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}

// ───────────────────────────── the beam ─────────────────────────────
/** additive volumetric ray: hot white core, prismatic fringe, pulses that flow along the path */
export function beamMaterial(L: Lit) {
  return new THREE.ShaderMaterial({
    uniforms: { ...L, uCol: { value: new THREE.Color('#fff6ff') }, uI: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      attribute vec4 aSeg; // length, start distance, fade-out length at the end (world units), width
      varying float vAlong; varying float vEdge; varying vec4 vS;
      void main(){
        vAlong = position.y; vS = aSeg;
        mat4 m = modelMatrix * instanceMatrix;
        vec4 w = m * vec4(position, 1.0);
        vec3 n = normalize(mat3(m) * vec3(normal.x, 0.0, normal.z));
        vec3 v = normalize(cameraPosition - w.xyz);
        vEdge = abs(dot(n, v));
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      ${LIT_GLSL}
      uniform vec3 uCol; uniform float uI;
      varying float vAlong; varying float vEdge; varying vec4 vS;
      void main(){
        float core = pow(vEdge, 12.0);
        float glow = pow(vEdge, 1.4);
        float dist = vS.y + vAlong * vS.x;
        float pulse = 0.72 + 0.28 * sin(dist * 1.2 - uTime * 8.0);
        float fade = vS.z > 0.0 ? smoothstep(vS.x, vS.x - vS.z, vAlong * vS.x) : 1.0;
        vec3 fringe = hsv(vEdge * 0.9 + dist * 0.015 - uTime * 0.08);
        vec3 c = uCol * core * 2.2 + mix(fringe, uCol, 0.35) * glow * 0.5 * pulse;
        gl_FragColor = vec4(c * fade * uI, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

/** a light shaft coming down from the sky into the prism (sun by day, moon by night) */
export function shaftMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uCol: { value: new THREE.Color('#fff2d8') }, uI: { value: 1 }, uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying float vAlong; varying float vEdge;
      void main(){ vAlong = position.y;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vec3 n = normalize(mat3(modelMatrix) * vec3(normal.x, 0.0, normal.z));
        vEdge = abs(dot(n, normalize(cameraPosition - w.xyz)));
        gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uCol; uniform float uI; uniform float uTime; varying float vAlong; varying float vEdge;
      float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
      void main(){
        float a = pow(vEdge, 3.0) * pow(1.0 - vAlong, 5.0) * smoothstep(0.0, 0.02, vAlong);
        vec2 mg = vec2(vEdge * 18.0, vAlong * 90.0 - uTime * 3.0);
        float motes = step(0.97, h21(floor(mg))) * smoothstep(0.45, 0.1, length(fract(mg) - 0.5));
        gl_FragColor = vec4(uCol * (a * 0.16 + motes * a * 0.7) * uI, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

// ───────────────────────────── halos (the soft bloom) ─────────────────────────────
/** camera-facing additive glow quads: instance translation = center, instance scale.x = size */
export function haloMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vC;
      void main(){
        vUv = uv - 0.5;
        vec3 center = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        float s = length(instanceMatrix[0].xyz);
        vec4 mv = viewMatrix * vec4(center, 1.0);
        mv.xy += position.xy * s;
        mv.z += s * 0.35; // pull toward the camera so it never slices into what it lights
        gl_Position = projectionMatrix * mv;
        vC = vec3(1.0);
        #ifdef USE_INSTANCING_COLOR
          vC = instanceColor;
        #endif
      }`,
    fragmentShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vC;
      void main(){
        float r = length(vUv) * 2.0;
        float a = exp(-r * r * 3.2) * 0.75 + exp(-r * r * 22.0) * 0.6;
        a *= smoothstep(1.0, 0.8, r);
        gl_FragColor = vec4(vC * a, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

// ───────────────────────────── mirrors ─────────────────────────────
/** a polished nacre mirror: reflects the sky gradient, iridescent rim, blazes when the beam hits */
export function mirrorMaterial(L: Lit, sky: { uZenith: THREE.IUniform; uHorizon: THREE.IUniform }) {
  return new THREE.ShaderMaterial({
    uniforms: { ...L, ...fogU(), uZenith: sky.uZenith, uHorizon: sky.uHorizon, uHit: { value: 0 } },
    fog: true,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying vec3 vW; varying vec3 vN; varying vec2 vUv;
      #include <fog_pars_vertex>
      void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      ${LIT_GLSL}
      uniform vec3 uZenith; uniform vec3 uHorizon; uniform float uHit;
      varying vec3 vW; varying vec3 vN; varying vec2 vUv;
      #include <fog_pars_fragment>
      void main(){
        vec3 V = normalize(cameraPosition - vW);
        vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
        vec3 R = reflect(-V, N);
        vec3 sky = mix(uHorizon, uZenith, smoothstep(-0.05, 0.6, R.y));
        sky = mix(sky * 0.55 + vec3(0.12, 0.1, 0.2), sky, smoothstep(-0.25, 0.05, R.y));
        float r = length(vUv - 0.5) * 2.0;
        float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.0);
        vec3 film = 0.5 + 0.5 * cos(6.2831 * (r * 0.8 + fres + vec3(0.0, 0.33, 0.67)));
        vec3 col = sky * 0.95 + film * 0.12 * (0.3 + r) + vec3(0.95, 0.93, 1.0) * fres * 0.25;
        col += keyCol() * pow(max(dot(R, keyDir()), 0.0), 200.0) * 2.5;
        float streak = smoothstep(0.06, 0.0, abs(vUv.x - vUv.y * 0.6 - 0.15 - 0.1 * sin(uTime * 0.3))) * 0.25;
        col += vec3(1.0) * streak;
        col = mix(col, vec3(1.0, 0.97, 1.0), uHit * (0.45 + 0.35 * smoothstep(0.9, 0.0, r)));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}

// ───────────────────────────── the crystal door ─────────────────────────────
/**
 * The door is one mesh of ~40 shards (attributes per shard: center, fly direction, spin axis, seed;
 * aEdge = 0 at a shard's center → 1 on its border so the seams glow). uHeart beats the seams
 * (corazón de cristal), uCharge floods them with the beam's light, uBreak (0→1) shatters it.
 */
export function doorMaterial(L: Lit) {
  return new THREE.ShaderMaterial({
    uniforms: { ...L, ...fogU(), uBreak: { value: 0 }, uCharge: { value: 0 }, uHeart: { value: 0 } },
    fog: true,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      attribute vec3 aCenter; attribute vec3 aDir; attribute vec3 aAxis; attribute float aRnd; attribute float aEdge;
      uniform float uBreak;
      varying vec3 vW; varying vec3 vL; varying float vEdge; varying float vRnd; varying float vGone;
      #include <fog_pars_vertex>
      vec3 rotA(vec3 v, vec3 ax, float a){ return v * cos(a) + cross(ax, v) * sin(a) + ax * dot(ax, v) * (1.0 - cos(a)); }
      void main(){
        vec3 p = position;
        float k = clamp(uBreak * (1.0 + aRnd * 0.6) - aRnd * 0.15, 0.0, 1.6);
        if (k > 0.0) {
          vec3 rel = rotA(p - aCenter, normalize(aAxis), k * (2.5 + aRnd * 7.0));
          vec3 c = aCenter + aDir * k * (5.0 + aRnd * 6.0) + vec3(0.0, -7.0 * k * k, 0.0);
          p = c + rel * (1.0 - smoothstep(0.55, 1.25, k));
        }
        vGone = smoothstep(0.7, 1.25, k);
        vL = position; vEdge = aEdge; vRnd = aRnd;
        vec4 w = modelMatrix * vec4(p, 1.0);
        vW = w.xyz;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      ${LIT_GLSL}
      uniform float uCharge; uniform float uHeart;
      varying vec3 vW; varying vec3 vL; varying float vEdge; varying float vRnd; varying float vGone;
      #include <fog_pars_fragment>
      void main(){
        vec3 V = normalize(cameraPosition - vW);
        vec3 N = normalize(cross(dFdx(vW), dFdy(vW)));
        if (dot(N, V) < 0.0) N = -N;
        float nv = clamp(dot(N, V), 0.0, 1.0);
        float fres = pow(1.0 - nv, 2.0);
        vec3 L = keyDir();
        vec3 body = mix(vec3(0.55, 0.42, 0.95), vec3(0.45, 0.75, 1.0), clamp(vL.y / 6.6 + vRnd * 0.45 - 0.2, 0.0, 1.0));
        vec3 col = body * (mix(uHemiGround, uHemiSky, 0.7) * 0.5 + keyCol() * (0.18 + 0.2 * max(dot(N, L), 0.0)));
        vec3 film = 0.5 + 0.5 * cos(6.2831 * (fres + vRnd + vL.y * 0.08 + vec3(0.0, 0.33, 0.67)));
        col += film * fres * 0.35 + vec3(1.0) * pow(max(dot(N, normalize(L + V)), 0.0), 60.0) * keyCol() * 0.6;
        // seams: the heartbeat, then the beam's flood
        float seam = smoothstep(0.72, 1.0, vEdge);
        float glow = seam * (0.2 + 0.8 * uHeart) * (0.3 + 0.7 * uNight) + seam * uCharge * 2.0 + uCharge * 0.35;
        col += mix(vec3(0.75, 0.6, 1.0), vec3(1.0, 0.97, 1.0), uCharge) * glow;
        float a = (0.55 + fres * 0.3 + seam * 0.25 + uCharge * 0.3) * (1.0 - vGone);
        if (a < 0.01) discard;
        gl_FragColor = vec4(col, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}

/** the tunnel behind the door: dark violet rock full of tiny crystal glints, a pearl glow inside */
export function caveMaterial(L: Lit) {
  return new THREE.ShaderMaterial({
    uniforms: { ...L, ...fogU(), uInner: { value: 1 }, uDepth: { value: 6.5 } },
    fog: true,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying vec3 vL; varying vec3 vW;
      #include <fog_pars_vertex>
      void main(){ vL = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      ${LIT_GLSL}
      uniform float uInner; uniform float uDepth;
      varying vec3 vL; varying vec3 vW;
      #include <fog_pars_fragment>
      void main(){
        float depth = clamp(-vL.z / uDepth, 0.0, 1.0);
        vec3 col = mix(vec3(0.2, 0.14, 0.34), vec3(0.04, 0.03, 0.09), pow(depth, 0.7));
        vec2 g = vec2(vL.x * 3.0 + vL.z * 2.0, vL.y * 3.0 - vL.z * 1.3);
        vec2 c = floor(g); float h = h21(c);
        float spark = step(0.9, h) * smoothstep(0.35, 0.0, length(fract(g) - 0.5)) * (0.5 + 0.5 * sin(uTime * (1.0 + h * 3.0) + h * 40.0));
        col += mix(vec3(0.55, 0.85, 1.0), vec3(0.8, 0.65, 1.0), h) * spark * (0.6 + 0.6 * uNight);
        // pearl glow from the floor deep inside (Madre Nácar's light)
        float glow = exp(-pow(vL.y / 2.2, 2.0)) * exp(-pow((-vL.z - uDepth * 0.55) / 2.4, 2.0)) * uInner;
        col += vec3(0.95, 0.88, 1.0) * glow * 0.55;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}
