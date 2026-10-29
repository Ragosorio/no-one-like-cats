/**
 * PELÍCULAS — LA TRANSFORMACIÓN (agent P3-CINE, 2026-10-29). The owner, after playing Parte III:
 * «no me gusta la pantalla de carga, me gustaba más la parte dos que el entorno se convertía en lo que se iba a hacer».
 *
 * In Parte II a mission's moment happened ON the island: the light, the sky, the sea turned into what was coming
 * (state/sys/worldState.ts, src/cine). A Parte III film lives on its own stage, in its own art style — so instead of a
 * titled loading card, the screen the player is on (the Carta, the island, a battle) BECOMES the film's world while the
 * film is built behind it: the world is re-graded into the film's palette (Van Gogh's blue and yellow, Leonardo's
 * parchment, noir's black and white, the TV cartoon, the silent film, the ukiyo-e indigo, Saul Bass's two tones), the
 * camera leans in towards where it is going (the stage on the Carta, the faro at home), the style's own texture grows
 * over it (strokes, hatching, rain, scanlines, scratches, waves, bars), and the edges close in the film's deep colour
 * until only the film is left. The film then opens from that dark, as every film does (its first scene comes in from
 * black).
 *
 * Same surface as the loader (progress / hide / destroy + root) plus `close()`: the film engine closes the
 * transformation once the film is ready (built, its song decoded), mounts the film under the closed cover and lifts it.
 * A transformation lasts at least MORPH.minMs (a warm film still gets its moment); if the film is NOT ready after
 * MORPH.fallbackMs (a very slow device, a slow network), the titled loading screen appears over it as a FALLBACK.
 * «Reducir movimiento»: no lean, no moving texture — the grade and the closing edges only.
 *
 * Nothing here touches the save. The scene underneath is restored exactly (its layer's transform and filters) the
 * moment the cover is closed, before the film hides it.
 */
import { ColorMatrixFilter, Container, Graphics, Sprite, Texture, Ticker, type Filter } from 'pixi.js';
import type { FilmDef, TypeStyle } from './types';
import { FilmLoader } from './loader';
import { TYPE } from './present';

/** timings (tests set them) */
export const MORPH = {
  /** the transformation's shortest life before it may close (ms) */
  minMs: 1250,
  /** the closing (the edges meet on the focus) */
  closeMs: 400,
  /** lifting the closed cover off the film's first frame */
  revealMs: 350,
  /** not ready by then: the titled loading screen appears over the transformation (a slow device) */
  fallbackMs: 12000,
  /** waiting longer than this, a thin thread at the screen's foot (the film's accent) shows the build moving */
  threadMs: 3000,
};

export interface MorphLook {
  style: TypeStyle;
  /** the colour the edges close in (the film's dark) */
  deep: number;
  /** the grade the world turns into (applied once; the filter's alpha blends it in) */
  grade: (m: ColorMatrixFilter) => void;
  /** the style's texture over the world (one Graphics, redrawn each frame; k = 0..1 strength, t = seconds) */
  draw: (g: Graphics, t: number, k: number, v: View, rm: boolean) => void;
}
interface View {
  x: number;
  y: number;
  w: number;
  h: number;
}

// a seeded unit random (the textures don't flicker between frames unless they mean to)
const hash = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** the film's style: its loader's, else its first scene's style family */
export function morphStyleOf(def: Pick<FilmDef, 'loader' | 'scenes'>): TypeStyle {
  const ls = def.loader?.style;
  if (ls && ls in TYPE) return ls;
  const s0 = def.scenes?.[0]?.style;
  const id = (typeof s0 === 'string' ? s0 : (s0?.id ?? '')).split(/[.:/]/)[0];
  const map: Record<string, TypeStyle> = { vangogh: 'vangogh', davinci: 'davinci', libros: 'davinci', noir: 'noir', posada: 'silent', linterna: 'silent', pop: 'tv', vineta: 'tv', grafico: 'bass', klimt: 'vangogh' };
  return map[id] ?? 'default';
}

/**
 * the grade's steps in the order they act on a pixel. (Pixi's ColorMatrixFilter, with `multiply`, puts a NEW step
 * BEFORE the ones already there: the calls go in reverse, the first one resetting the matrix.)
 */
function chain(m: ColorMatrixFilter, ...steps: ((m: ColorMatrixFilter, multiply: boolean) => void)[]) {
  steps
    .slice()
    .reverse()
    .forEach((f, i) => f(m, i > 0));
}

const stroke = (g: Graphics, color: number, width: number, alpha: number) => g.stroke({ width, color, alpha, cap: 'round', join: 'round' });

/** the seven looks (one per presentation style) — the colours are the styles' own (present.ts TYPE) */
export const MORPH_LOOKS: Record<TypeStyle, MorphLook> = {
  // the starry night: the world goes deep blue in its shadows and yellow in its lights; strokes swirl over it
  vangogh: {
    style: 'vangogh',
    deep: 0x0b1438,
    grade: (m) => chain(m, (x, k) => x.saturate(0.45, k), (x, k) => x.tint(0x7d96e8, k), (x, k) => x.contrast(0.18, k)),
    draw: (g, t, k, v, rm) => {
      const centers: [number, number, number][] = [
        [0.24, 0.3, 1],
        [0.7, 0.22, -1],
        [0.55, 0.7, 1],
      ];
      const cols = [0xf4c430, 0x3a6ad8, 0xe9eefc, 0x8fb8ff];
      for (let i = 0; i < 54; i++) {
        const c = centers[i % 3];
        const r0 = (0.06 + hash(i) * 0.2) * v.w;
        const spin = rm ? 0 : t * (0.35 + hash(i + 9) * 0.35) * c[2];
        const a0 = hash(i + 3) * Math.PI * 2 + spin;
        const len = 0.35 + hash(i + 5) * 0.5;
        const cx = v.x + c[0] * v.w;
        const cy = v.y + c[1] * v.h;
        const p = (a: number, r: number) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.62] as const;
        const [x0, y0] = p(a0, r0);
        const [x1, y1] = p(a0 + len * 0.5, r0 * 1.04);
        const [x2, y2] = p(a0 + len, r0 * 1.08);
        g.moveTo(x0, y0).quadraticCurveTo(x1, y1, x2, y2);
        stroke(g, cols[i % cols.length], 8 + hash(i + 7) * 10, k * (0.5 + hash(i + 11) * 0.4));
      }
    },
  },
  // Leonardo's notebook: parchment, and ink hatching that spreads from the corners
  davinci: {
    style: 'davinci',
    deep: 0x2a170a,
    grade: (m) => chain(m, (x, k) => x.sepia(k), (x, k) => x.brightness(1.04, k), (x, k) => x.contrast(0.12, k)),
    draw: (g, t, k, v) => {
      const n = Math.floor(70 * Math.min(1, k * 1.2));
      for (let i = 0; i < n; i++) {
        const corner = i % 4;
        const d = (Math.floor(i / 4) + 1) * 26;
        const sx = corner % 2 ? v.x + v.w : v.x;
        const sy = corner < 2 ? v.y : v.y + v.h;
        const dx = corner % 2 ? -1 : 1;
        const dy = corner < 2 ? 1 : -1;
        g.moveTo(sx + dx * d, sy).lineTo(sx, sy + dy * d * 0.9);
        stroke(g, 0x4a2c17, 2.5, 0.7 * k * (1 - Math.floor(i / 4) / 20));
      }
      // the proportion circle and square, drawn by a steady hand
      const cx = v.x + v.w / 2;
      const cy = v.y + v.h / 2;
      const r = v.h * 0.36;
      const sweep = Math.min(1, k * 1.3 + t * 0.05) * Math.PI * 2;
      g.moveTo(cx + r, cy).arc(cx, cy, r, 0, sweep);
      stroke(g, 0x8a3a1e, 2.5, 0.45 * k);
      g.rect(cx - r * 0.88, cy - r * 0.88, r * 1.76, r * 1.76);
      stroke(g, 0x8a3a1e, 1.5, 0.3 * k);
    },
  },
  // noir: black and white, hard contrast, and rain
  noir: {
    style: 'noir',
    deep: 0x050507,
    grade: (m) => chain(m, (x, k) => x.blackAndWhite(k), (x, k) => x.contrast(0.55, k), (x, k) => x.brightness(0.78, k)),
    draw: (g, t, k, v, rm) => {
      for (let i = 0; i < 90; i++) {
        const sp = 1400 + hash(i) * 900;
        const x0 = v.x + hash(i + 1) * (v.w + 300) - 150;
        const y = rm ? hash(i + 2) * v.h : (((hash(i + 2) * v.h + t * sp) % (v.h + 160)) - 80);
        g.moveTo(x0, v.y + y).lineTo(x0 - 18, v.y + y + 64);
        stroke(g, 0xd8d2c4, 2, 0.55 * k);
      }
    },
  },
  // the TV cartoon (La Borracha, the Comic): popping colours and the set's scanlines
  tv: {
    style: 'tv',
    deep: 0x1d1430,
    grade: (m) => chain(m, (x, k) => x.saturate(0.7, k), (x, k) => x.contrast(0.22, k), (x, k) => x.tint(0xffe2ef, k)),
    draw: (g, t, k, v, rm) => {
      const off = rm ? 0 : (t * 40) % 8;
      for (let y = v.y - 8 + off; y < v.y + v.h; y += 8) g.rect(v.x, y, v.w, 3);
      g.fill({ color: 0x1d1430, alpha: 0.3 * k });
      // a little static, like a channel changing
      for (let i = 0; i < 70; i++) {
        const j = rm ? i : i + Math.floor(t * 12) * 71;
        g.rect(v.x + hash(j) * v.w, v.y + hash(j + 1) * v.h, 6 + hash(j + 2) * 22, 3);
      }
      g.fill({ color: 0xfff6e0, alpha: 0.35 * k });
    },
  },
  // the silent film: sepia, grain, scratches and the projector's flicker
  silent: {
    style: 'silent',
    deep: 0x0d0b08,
    grade: (m) => chain(m, (x, k) => x.saturate(-1, k), (x, k) => x.tint(0xe8d6b4, k), (x, k) => x.contrast(0.28, k)),
    draw: (g, t, k, v, rm) => {
      const f = rm ? 0 : Math.floor(t * 18);
      for (let i = 0; i < 5; i++) {
        const j = i + f * 5;
        if (hash(j + 40) < 0.45) continue;
        const x = v.x + hash(j) * v.w;
        g.moveTo(x, v.y).lineTo(x + (hash(j + 1) - 0.5) * 30, v.y + v.h);
        stroke(g, 0xf1ead8, 1.5 + hash(j + 2) * 2, 0.5 * k);
      }
      for (let i = 0; i < 160; i++) {
        const j = i + f * 160;
        g.rect(v.x + hash(j + 3) * v.w, v.y + hash(j + 4) * v.h, 2, 2);
      }
      g.fill({ color: 0x0d0b08, alpha: 0.45 * k });
      if (!rm) g.rect(v.x, v.y, v.w, v.h).fill({ color: 0xf1ead8, alpha: 0.05 * k * hash(f + 99) });
    },
  },
  // ukiyo-e: indigo and paper, and the waves (seigaiha) rising from the bottom
  ukiyoe: {
    style: 'ukiyoe',
    deep: 0x0f1626,
    grade: (m) => chain(m, (x, k) => x.saturate(-0.8, k), (x, k) => x.tint(0xb9c6ea, k), (x, k) => x.contrast(0.15, k)),
    draw: (g, t, k, v, rm) => {
      // (≈ 240 half-rings at full rise: well under the ~25k-vertex budget of one Graphics)
      const R = 72;
      const rise = Math.min(1, k) * (rm ? 1 : Math.min(1, 0.6 + t * 0.1));
      const rows = Math.min(8, Math.ceil((v.h * 0.3 * rise) / (R * 0.5)));
      for (let r = 0; r < rows; r++) {
        const y = v.y + v.h + 10 - r * R * 0.5;
        const shift = r % 2 ? R : 0;
        for (let x = v.x - R + shift; x < v.x + v.w + R; x += R * 2) {
          for (let ring = 0; ring < 2; ring++) {
            const rr = R * (1 - ring * 0.42);
            g.moveTo(x + rr, y).arc(x, y, rr, Math.PI, Math.PI * 2, false);
          }
        }
      }
      stroke(g, 0xf3ead8, 3, 0.75 * k);
    },
  },
  // Saul Bass: two tones, and bold bars that slide in to frame what is coming
  bass: {
    style: 'bass',
    deep: 0x141414,
    grade: (m) => chain(m, (x, k) => x.saturate(-1, k), (x, k) => x.contrast(0.6, k), (x, k) => x.tint(0xf0a640, k)),
    draw: (g, t, k, v) => {
      const e = Math.min(1, k * 1.15);
      const bars: [number, number, number, number, number][] = [
        [0, 0.08, 0.34, 0.07, 0xc8402e],
        [1, 0.2, 0.26, 0.05, 0x141414],
        [0, 0.78, 0.4, 0.09, 0x141414],
        [1, 0.88, 0.3, 0.06, 0xe8a33a],
      ];
      for (const [side, y, len, hh, col] of bars) {
        const w = v.w * len * e;
        g.rect(side ? v.x + v.w - w : v.x, v.y + v.h * y, w, v.h * hh).fill({ color: col, alpha: 0.9 });
      }
      void t;
    },
  },
  // any other film: the light drops towards dusk and a warm leak crosses the screen
  default: {
    style: 'default',
    deep: 0x07050d,
    grade: (m) => chain(m, (x, k) => x.saturate(-0.35, k), (x, k) => x.tint(0xc9b8f0, k), (x, k) => x.brightness(0.82, k)),
    draw: (g, t, k, v, rm) => {
      const x = v.x + v.w * (rm ? 0.7 : 0.2 + ((t * 0.12) % 1) * 0.8);
      for (let i = 0; i < 6; i++) g.ellipse(x, v.y + v.h * 0.35, v.w * (0.08 + i * 0.05), v.h * (0.3 + i * 0.08)).fill({ color: 0xff2e88, alpha: 0.035 * k });
      for (let i = 0; i < 50; i++) {
        const y = rm ? hash(i) * v.h : (hash(i) * v.h - t * (20 + hash(i + 1) * 40) + v.h * 10) % v.h;
        g.circle(v.x + hash(i + 2) * v.w, v.y + y, 1.5 + hash(i + 3) * 2.5);
      }
      g.fill({ color: 0xf6f1e7, alpha: 0.4 * k });
    },
  },
};

/** the soft edge that closes: transparent in the middle, the deep colour at its rim (white: it is tinted) */
let edgeTex: Texture | null = null;
function edgeTexture(): Texture {
  if (edgeTex) return edgeTex;
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const c = cv.getContext('2d')!;
  const grd = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grd.addColorStop(0, 'rgba(255,255,255,0)');
  grd.addColorStop(0.3, 'rgba(255,255,255,0.04)');
  grd.addColorStop(0.62, 'rgba(255,255,255,0.3)');
  grd.addColorStop(1, 'rgba(255,255,255,1)');
  c.fillStyle = grd;
  c.fillRect(0, 0, S, S);
  edgeTex = Texture.from(cv);
  return edgeTex;
}

const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

/** what the transformation works on (core/scenes' layers; tests pass plain containers) */
export interface MorphWorld {
  /** the layer that is graded and leaned into (the scene) */
  world: Container;
  /** where the cover lives (above the world, below the film once it mounts) */
  host: Container;
  view: () => View;
  /** where the camera leans (design coords); default the middle of the screen */
  focus?: [number, number] | null;
}

export class WorldMorph {
  readonly root = new Container();
  private fx = new Graphics();
  /** the thin progress thread (only on a long wait) */
  private thread = new Graphics();
  private shownP = 0;
  private edge: Sprite;
  private frame = new Graphics();
  private grade = new ColorMatrixFilter();
  private look: MorphLook;
  private t = 0;
  /** 0..1 the transformation (grade, texture, lean) */
  private k = 0;
  /** the hole of the closing edge, as a fraction of the screen's diagonal (1 = wide open) */
  private hole = 1;
  private closing: { t: number; res: () => void } | null = null;
  /** 0..1 how far the edges have closed (the camera rushes in with them) */
  private closeK = 0;
  private lifting: { t: number; res: () => void } | null = null;
  private restored = false;
  private prevFilters: Filter[] | null = null;
  private loader: FilmLoader | null = null;
  private lastP: [number, string] = [0, ''];
  private born = performance.now();
  private focus: [number, number];
  private dead = false;
  private accent: number;

  constructor(
    private w: MorphWorld,
    private def: Pick<FilmDef, 'id' | 'title' | 'loader' | 'scenes'>,
    private rm = false,
  ) {
    const style = morphStyleOf(def);
    this.look = MORPH_LOOKS[style] ?? MORPH_LOOKS.default;
    this.accent = (TYPE[style] ?? TYPE.default).accent;
    this.look.grade(this.grade);
    this.grade.alpha = 0;
    const v = w.view();
    this.focus = w.focus ?? [v.x + v.w / 2, v.y + v.h / 2];
    // the world: graded (the filter's alpha blends the look in) and leaned towards the focus
    const wf = w.world.filters;
    this.prevFilters = !wf ? [] : Array.isArray(wf) ? [...(wf as readonly Filter[])] : [wf as unknown as Filter];
    w.world.filters = [...this.prevFilters, this.grade];
    // the cover: the style's texture, the closing edge (and the solid frame around it), a blocker (no taps through)
    this.edge = new Sprite(edgeTexture());
    this.edge.anchor.set(0.5);
    this.edge.tint = this.look.deep;
    const block = new Graphics().rect(v.x - 20, v.y - 20, v.w + 40, v.h + 40).fill({ color: 0x000000, alpha: 0.001 });
    block.eventMode = 'static';
    this.root.addChild(block, this.fx, this.edge, this.frame, this.thread);
    this.root.label = 'filmMorph';
    w.host.addChild(this.root);
    if (import.meta.env.DEV) (window as unknown as { __filmMorph: string | null }).__filmMorph = def.id;
    Ticker.shared.add(this.tick, this);
    this.draw();
  }

  /** the build's progress (only the fallback loading screen shows it) */
  progress(p: number, label: string) {
    this.lastP = [p, label];
    this.loader?.progress(p, label);
  }

  private tick(tk: Ticker) {
    if (this.dead) return;
    const dt = Math.min(0.1, tk.deltaMS / 1000);
    this.t += dt;
    // the transformation grows in ~1.1 s, then keeps breathing while the film gets ready
    this.k = Math.min(1, this.k + dt / 1.1);
    if (this.closing) {
      this.closing.t += dt;
      const c = Math.min(1, this.closing.t / (MORPH.closeMs / 1000));
      this.closeK = c;
      this.hole = Math.max(0, this.holeOpen() * (1 - easeInOut(c)));
      if (c >= 1) {
        const r = this.closing.res;
        this.closing = null;
        this.hole = 0;
        this.restore();
        r();
      }
    } else if (!this.lifting) this.hole = this.holeOpen();
    if (this.lifting) {
      this.lifting.t += dt;
      const c = Math.min(1, this.lifting.t / (MORPH.revealMs / 1000));
      this.root.alpha = 1 - c;
      if (c >= 1) {
        const r = this.lifting.res;
        this.lifting = null;
        this.destroy();
        r();
        return;
      }
    }
    // a slow device: the titled loading screen comes as a fallback (never by default)
    if (!this.loader && !this.closing && !this.lifting && !this.restored && performance.now() - this.born > MORPH.fallbackMs) {
      const v = this.w.view();
      this.loader = new FilmLoader(this.root, v, this.def.title, this.def.loader?.style ?? 'default', this.def.loader?.caption ?? 'PELÍCULA', this.rm);
      this.loader.progress(this.lastP[0], this.lastP[1] || 'preparando');
    }
    this.draw();
  }
  /** the edge's opening while it waits: wide at first, creeping in slowly the longer the film takes */
  private holeOpen() {
    const wait = Math.max(0, this.t - 1.1);
    return 1.2 - 0.3 * easeInOut(this.k) - 0.22 * (1 - Math.exp(-wait / 3));
  }
  private draw() {
    const v = this.w.view();
    const k = easeInOut(this.k);
    if (!this.restored) {
      this.grade.alpha = k;
      if (!this.rm) {
        const s = Math.min(1.22, 1 + 0.12 * k + 0.015 * Math.max(0, this.t - 1.1)) + 0.35 * this.closeK * this.closeK;
        const wl = this.w.world;
        wl.pivot.set(this.focus[0], this.focus[1]);
        wl.position.set(this.focus[0], this.focus[1]);
        wl.scale.set(s);
      }
    }
    this.fx.clear();
    if (!this.restored) this.look.draw(this.fx, this.t, k, v, this.rm);
    // the closing edge: a soft ring centred on the focus; everything outside it is the deep colour
    const diag = Math.hypot(v.w, v.h);
    const size = Math.max(2, this.hole * diag * 1.25);
    const e = this.edge;
    e.position.set(this.focus[0], this.focus[1]);
    e.width = size;
    e.height = size * 0.82;
    e.alpha = this.restored ? 1 : Math.min(1, 0.25 + k * 0.75);
    const x0 = e.x - e.width / 2;
    const y0 = e.y - e.height / 2;
    const x1 = e.x + e.width / 2;
    const y1 = e.y + e.height / 2;
    const L = v.x - 20;
    const T = v.y - 20;
    const R = v.x + v.w + 20;
    const B = v.y + v.h + 20;
    const f = this.frame.clear();
    const col = this.look.deep;
    if (this.hole <= 0.001) f.rect(L, T, R - L, B - T).fill(col);
    else {
      if (y0 > T) f.rect(L, T, R - L, y0 - T + 1);
      if (y1 < B) f.rect(L, y1 - 1, R - L, B - y1 + 1);
      if (x0 > L) f.rect(L, y0, x0 - L + 1, y1 - y0);
      if (x1 < R) f.rect(x1 - 1, y0, R - x1 + 1, y1 - y0);
      f.fill({ color: col, alpha: e.alpha });
    }
    e.visible = this.hole > 0.001;
    // a long wait: a thin thread in the film's accent, at the screen's foot — the build is moving (not a loading card)
    this.thread.clear();
    const waited = this.age - MORPH.threadMs;
    if (!this.restored && !this.loader && waited > 0) {
      this.shownP += (this.lastP[0] - this.shownP) * 0.08;
      const a = Math.min(1, waited / 600) * 0.85;
      const tw = v.w * 0.36;
      const tx = v.x + (v.w - tw) / 2;
      const ty = v.y + v.h - 26;
      this.thread.rect(tx, ty, tw, 2).fill({ color: 0xf6f1e7, alpha: a * 0.18 }).rect(tx, ty, tw * Math.max(0.02, Math.min(1, this.shownP)), 2).fill({ color: this.accent, alpha: a });
    }
  }

  /** the scene's layer back exactly as it was (its filters, no lean) */
  private restore() {
    if (this.restored) return;
    this.restored = true;
    const wl = this.w.world;
    if (!wl.destroyed) {
      wl.filters = this.prevFilters && this.prevFilters.length ? this.prevFilters : null;
      wl.pivot.set(0, 0);
      wl.position.set(0, 0);
      wl.scale.set(1);
    }
    this.fx.clear();
    this.loader?.destroy();
    this.loader = null;
  }

  /** milliseconds this transformation has been on screen */
  get age() {
    return performance.now() - this.born;
  }
  /**
   * The film is ready: let the transformation reach its shortest life, then close the edges on the focus. Resolves
   * when the screen is the film's deep colour (and the scene's layer is restored underneath).
   */
  async close(): Promise<void> {
    if (this.dead || this.restored) return;
    // (polled: the knob may change while it waits)
    while (!this.dead && !this.restored && this.age < MORPH.minMs) await new Promise((r) => setTimeout(r, Math.max(16, Math.min(100, MORPH.minMs - this.age))));
    if (this.dead || this.restored) return;
    if (this.loader) {
      // the fallback was up: it simply goes (the cover under it is already the film's dark)
      this.restore();
      this.hole = 0;
      this.draw();
      return;
    }
    await new Promise<void>((res) => (this.closing = { t: 0, res }));
  }
  /** lift the closed cover off the film's first frame (resolves when gone) */
  hide(): Promise<void> {
    if (this.dead) return Promise.resolve();
    if (!this.restored) {
      this.restore();
      this.hole = 0;
    }
    return new Promise((res) => (this.lifting = { t: 0, res }));
  }
  destroy() {
    if (this.dead) return;
    this.dead = true;
    Ticker.shared.remove(this.tick, this);
    this.restore();
    this.closing?.res();
    this.closing = null;
    this.lifting?.res();
    this.lifting = null;
    if (!this.root.destroyed) this.root.destroy({ children: true });
    this.grade.destroy();
    if (import.meta.env.DEV) {
      const W2 = window as unknown as { __filmMorph: string | null };
      if (W2.__filmMorph === this.def.id) W2.__filmMorph = null;
    }
  }
}
