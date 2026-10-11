/**
 * The yard's NEON (canvas-drawn, no raster files): every sign is painted once into one atlas canvas in
 * the game's typography (Bangers for shouting, Anton for signage, Space Grotesk for the small print),
 * and every sign in the world is a quad of ONE mesh sampling it — one draw call for all the neon.
 * The shader does the retrofuturo lens: tubes that buzz, a sign that blinks, soft scanlines, and the
 * glow growing when the yard's lights come on.
 */
import * as THREE from 'three';
import type { Bin } from '../paginas/kit';
import { F } from '../../ui/theme';
import type { U } from '../cielo/kit';

const AW = 2048;
const AH = 1024;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export type SignId = 'cometa' | 'taller' | 'abierto' | 'horas' | 'fuel' | 'rampa' | 'dique1' | 'dique2' | 'obs' | 'luz';
/** mode: 0 steady · 1 buzzing (now and then a tube stutters) · 2 blinking */
const ATLAS: Record<SignId, Rect & { mode: number }> = {
  cometa: { x: 0, y: 0, w: 2048, h: 300, mode: 1 },
  taller: { x: 0, y: 300, w: 1400, h: 260, mode: 0 },
  abierto: { x: 1400, y: 300, w: 648, h: 130, mode: 2 },
  horas: { x: 1400, y: 430, w: 648, h: 130, mode: 1 },
  fuel: { x: 0, y: 560, w: 1200, h: 240, mode: 0 },
  rampa: { x: 1200, y: 560, w: 848, h: 240, mode: 1 },
  dique1: { x: 0, y: 800, w: 400, h: 224, mode: 0 },
  dique2: { x: 400, y: 800, w: 400, h: 224, mode: 1 },
  obs: { x: 800, y: 800, w: 700, h: 224, mode: 0 },
  luz: { x: 1500, y: 800, w: 548, h: 224, mode: 1 },
};

/** wait for the game's webfonts (they are normally already in: the HUD uses them) */
export async function fontsReady() {
  const fams = [F.comic, F.poster, F.ui];
  try {
    await Promise.race([Promise.all(fams.map((f) => document.fonts.load(`64px "${f}"`))), new Promise((r) => setTimeout(r, 1500))]);
  } catch {
    /* system fallback fonts: still readable */
  }
}

function board(g: CanvasRenderingContext2D, r: Rect, fill = '#151a3a', frame = '#9aa6c0') {
  const pad = 10;
  const x = r.x + pad;
  const y = r.y + pad;
  const w = r.w - pad * 2;
  const h = r.h - pad * 2;
  const rad = Math.min(36, h * 0.25);
  g.save();
  g.beginPath();
  g.roundRect(x, y, w, h, rad);
  g.fillStyle = fill;
  g.fill();
  g.lineWidth = 8;
  g.strokeStyle = frame;
  g.stroke();
  g.lineWidth = 2;
  g.strokeStyle = 'rgba(255,255,255,0.35)';
  g.beginPath();
  g.roundRect(x + 8, y + 8, w - 16, h - 16, rad * 0.7);
  g.stroke();
  // rivets
  g.fillStyle = '#c9d2e0';
  for (const [rx, ry] of [
    [x + 18, y + 18],
    [x + w - 18, y + 18],
    [x + 18, y + h - 18],
    [x + w - 18, y + h - 18],
  ]) {
    g.beginPath();
    g.arc(rx, ry, 5, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

/** a neon tube in the shape of the text: wide glow, tube color, a white-hot core */
function tube(g: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, color: string, glow: string, width = 1, fillA = 0) {
  g.save();
  g.font = font;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineCap = 'round';
  if (fillA > 0) {
    g.globalAlpha = fillA;
    g.fillStyle = color;
    g.fillText(text, x, y);
    g.globalAlpha = 1;
  }
  g.shadowColor = glow;
  g.shadowBlur = 34 * width;
  g.strokeStyle = color;
  g.lineWidth = 10 * width;
  g.strokeText(text, x, y);
  g.shadowBlur = 14 * width;
  g.lineWidth = 6 * width;
  g.strokeText(text, x, y);
  g.shadowBlur = 0;
  g.strokeStyle = 'rgba(255,255,255,0.85)';
  g.lineWidth = 2.2 * width;
  g.strokeText(text, x, y);
  g.restore();
}

/** a neon line drawing (icons): same three passes as the text */
function tubePath(g: CanvasRenderingContext2D, draw: () => void, color: string, glow: string, width = 1) {
  g.save();
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.shadowColor = glow;
  g.shadowBlur = 30 * width;
  g.strokeStyle = color;
  g.lineWidth = 9 * width;
  g.beginPath();
  draw();
  g.stroke();
  g.shadowBlur = 0;
  g.strokeStyle = 'rgba(255,255,255,0.85)';
  g.lineWidth = 2.4 * width;
  g.beginPath();
  draw();
  g.stroke();
  g.restore();
}

function paintAtlas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = AW;
  c.height = AH;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, AW, AH);
  const pink = '#ff4f9e';
  const cyan = '#4ff2ff';
  const gold = '#ffd23f';
  const violet = '#c86bff';
  const fuel = '#ff5ce1';
  const B = (s: number) => `${s}px "${F.comic}", Impact, sans-serif`;
  const A = (s: number) => `${s}px "${F.poster}", Impact, sans-serif`;
  const S = (s: number) => `700 ${s}px "${F.ui}", Arial, sans-serif`;

  // ── PUERTO COMETA: free-standing letters on the pylon (no board), a comet zooming through ──
  {
    const r = ATLAS.cometa;
    const cy = r.y + r.h / 2 + 8;
    tube(g, 'PUERTO COMETA', r.x + r.w / 2 + 110, cy, B(206), pink, '#ff2f86', 1.5, 0.28);
    // the comet glyph: a star with three swooshes
    tubePath(
      g,
      () => {
        const x = 250;
        const y = cy - 10;
        for (let i = 0; i < 3; i++) {
          g.moveTo(x - 30 - i * 10, y - 46 + i * 46);
          g.quadraticCurveTo(x - 140 - i * 20, y - 40 + i * 40, x - 210 - i * 10, y - 70 + i * 66);
        }
        const R = 40;
        for (let k = 0; k <= 10; k++) {
          const a = -Math.PI / 2 + (k / 10) * Math.PI * 2;
          const rr = k % 2 ? R * 0.45 : R;
          if (k === 0) g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
          else g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
        }
      },
      cyan,
      '#29d8ff',
      1.4,
    );
  }
  // ── TALLER DEL CASCO DE PECERA (with a fishbowl helmet: a round bowl with cat ears inside) ──
  {
    const r = ATLAS.taller;
    board(g, r, '#141838', '#c9d2e0');
    const ix = r.x + 170;
    const iy = r.y + r.h / 2;
    tubePath(
      g,
      () => {
        g.arc(ix, iy, 82, 0.12 * Math.PI, 2.88 * Math.PI);
        g.moveTo(ix - 76, iy + 40);
        g.lineTo(ix + 76, iy + 40);
        // the cat inside: ears and eyes
        g.moveTo(ix - 40, iy + 18);
        g.lineTo(ix - 40, iy - 30);
        g.lineTo(ix - 18, iy - 14);
        g.lineTo(ix + 18, iy - 14);
        g.lineTo(ix + 40, iy - 30);
        g.lineTo(ix + 40, iy + 18);
        g.moveTo(ix - 14, iy + 2);
        g.arc(ix - 18, iy + 2, 4, 0, Math.PI * 2);
        g.moveTo(ix + 22, iy + 2);
        g.arc(ix + 18, iy + 2, 4, 0, Math.PI * 2);
      },
      cyan,
      '#29d8ff',
      1.1,
    );
    tube(g, 'TALLER DEL', r.x + 790, r.y + 70, A(64), gold, '#ffb000', 0.8);
    tube(g, 'CASCO DE PECERA', r.x + 790, r.y + 168, B(118), pink, '#ff2f86', 1.1, 0.2);
  }
  // ── ABIERTO (blinks) and the small print ──
  {
    const r = ATLAS.abierto;
    board(g, r, '#1a1030', '#8a93a8');
    tube(g, 'ABIERTO', r.x + r.w / 2, r.y + r.h / 2 + 4, B(92), '#ff3b3b', '#ff1f1f', 0.9);
    const h = ATLAS.horas;
    board(g, h, '#101a30', '#8a93a8');
    tube(g, 'ÓRBITA INCLUIDA · 24/7', h.x + h.w / 2, h.y + h.h / 2 + 2, S(46), cyan, '#29d8ff', 0.55);
  }
  // ── COMBUSTIBLE ASTRAL ──
  {
    const r = ATLAS.fuel;
    board(g, r, '#1b0f2e', '#c9d2e0');
    tubePath(
      g,
      () => {
        // a drop
        const x = r.x + 120;
        const y = r.y + 120;
        g.moveTo(x, y - 70);
        g.bezierCurveTo(x + 60, y - 4, x + 52, y + 62, x, y + 62);
        g.bezierCurveTo(x - 52, y + 62, x - 60, y - 4, x, y - 70);
      },
      fuel,
      '#ff2fd8',
      1.1,
    );
    tube(g, 'COMBUSTIBLE ASTRAL', r.x + 660, r.y + 96, B(112), fuel, '#ff2fd8', 1.1, 0.25);
    tube(g, 'OCTANAJE CÓSMICO · PROHIBIDO FUMAR (NO HAY AIRE)', r.x + 660, r.y + 184, S(34), violet, '#a040ff', 0.5);
  }
  // ── RAMPA DE LANZAMIENTO ──
  {
    const r = ATLAS.rampa;
    board(g, r, '#22140e', '#c9d2e0');
    tube(g, 'RAMPA DE', r.x + r.w / 2, r.y + 62, A(62), gold, '#ffb000', 0.8);
    tube(g, 'LANZAMIENTO', r.x + r.w / 2, r.y + 140, B(104), '#ff8a3b', '#ff6a00', 1.0, 0.2);
    tube(g, 'NO SE PARE ENFRENTE. NI ATRÁS.', r.x + r.w / 2, r.y + 202, S(30), gold, '#ffb000', 0.45);
  }
  // ── DIQUE 1 / DIQUE 2 ──
  for (const [id, label] of [
    ['dique1', 'DIQUE 1'],
    ['dique2', 'DIQUE 2'],
  ] as const) {
    const r = ATLAS[id];
    board(g, r, '#0f1630', '#f2b632');
    tube(g, label, r.x + r.w / 2, r.y + r.h / 2 + 4, B(110), gold, '#ffb000', 1.0, 0.2);
  }
  // ── OBSERVATORIO ──
  {
    const r = ATLAS.obs;
    board(g, r, '#0c1430', '#c9d2e0');
    tube(g, 'OBSERVATORIO', r.x + r.w / 2, r.y + 86, B(98), cyan, '#29d8ff', 1.0, 0.2);
    tube(g, 'NO TOCAR LAS ESTRELLAS', r.x + r.w / 2, r.y + 168, S(36), '#ffffff', '#9fdcff', 0.5);
  }
  // ── VELOCIDAD MÁXIMA ──
  {
    const r = ATLAS.luz;
    board(g, r, '#ffffff', '#ff3b3b');
    g.save();
    g.fillStyle = '#1a1a24';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = A(46);
    g.fillText('VELOCIDAD MÁXIMA', r.x + r.w / 2, r.y + 70);
    g.font = B(78);
    g.fillStyle = '#e8574d';
    g.fillText('LA DE LA LUZ', r.x + r.w / 2, r.y + 148);
    g.restore();
  }
  return c;
}

export interface SignPlacement {
  id: SignId;
  pos: THREE.Vector3;
  /** world width (height follows the atlas cell) */
  width: number;
  /** yaw (the sign faces +z rotated by this) */
  ry: number;
  /** tilt back (radians) */
  rx?: number;
}

export function signSize(id: SignId, width: number) {
  const r = ATLAS[id];
  return { w: width, h: (width * r.h) / r.w };
}

/** all the signs as ONE mesh over ONE atlas texture */
export function neonSigns(bin: Bin, list: SignPlacement[], uNeon: U<number>, uTime: U<number>) {
  const tex = bin.add(new THREE.CanvasTexture(paintAtlas()));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const pos: number[] = [];
  const uv: number[] = [];
  const sign: number[] = [];
  const idx: number[] = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  list.forEach((s, i) => {
    const r = ATLAS[s.id];
    const { w, h } = signSize(s.id, s.width);
    e.set(s.rx ?? 0, s.ry, 0, 'YXZ');
    q.setFromEuler(e);
    // a hair in front of its backboard (along the sign's normal)
    m.compose(s.pos.clone().add(new THREE.Vector3(0, 0, 0.09).applyQuaternion(q)), q, new THREE.Vector3(1, 1, 1));
    const u0 = r.x / AW;
    const u1 = (r.x + r.w) / AW;
    const v0 = 1 - (r.y + r.h) / AH;
    const v1 = 1 - r.y / AH;
    const corners = [
      [-w / 2, -h / 2, u0, v0],
      [w / 2, -h / 2, u1, v0],
      [w / 2, h / 2, u1, v1],
      [-w / 2, h / 2, u0, v1],
    ];
    const b = i * 4;
    for (const [x, y, uu, vv] of corners) {
      v.set(x, y, 0).applyMatrix4(m);
      pos.push(v.x, v.y, v.z);
      uv.push(uu, vv);
      sign.push(i + r.mode * 100);
    }
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  const geo = bin.add(new THREE.BufferGeometry());
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('aSign', new THREE.Float32BufferAttribute(sign, 1));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  const mat = bin.add(
    new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, uNeon, uTime },
      transparent: true,
      depthWrite: false,
      fog: false,
      vertexShader: /* glsl */ `attribute float aSign; varying vec2 vUv; varying float vSign;
        void main(){ vUv = uv; vSign = aSign; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `uniform sampler2D map; uniform float uNeon; uniform float uTime; varying vec2 vUv; varying float vSign;
        float hh(float n){ return fract(sin(n * 91.345) * 47453.21); }
        void main(){
          vec4 t = texture2D(map, vUv);
          float mode = floor(vSign / 100.0 + 0.01);
          float id = vSign - mode * 100.0;
          float on = 1.0;
          if (mode > 0.5 && mode < 1.5) {
            // buzzing: every few seconds a tube stutters
            float k = floor(uTime * 14.0);
            float burst = step(0.82, hh(floor(uTime * 0.45 + id * 3.1)));
            on = mix(1.0, 0.25 + 0.75 * step(0.45, hh(k + id * 17.0)), burst);
          } else if (mode > 1.5) {
            on = step(0.38, fract(uTime * 0.55 + id * 0.17));
          }
          // a lit tube is brighter than its paint; an unlit one shows the dark glass
          float lum = max(t.r, max(t.g, t.b));
          vec3 lit = t.rgb * (1.0 + uNeon * 0.9) + t.rgb * smoothstep(0.75, 1.0, lum) * 0.35;
          vec3 off = t.rgb * 0.32;
          vec3 col = mix(off, lit, on);
          float a = t.a * mix(0.75, 1.0, on);
          // the lens: soft scanlines
          col *= 0.9 + 0.1 * sin(gl_FragCoord.y * 1.5708);
          gl_FragColor = vec4(col, a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }),
  );
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'neon';
  mesh.renderOrder = 6;
  return mesh;
}
