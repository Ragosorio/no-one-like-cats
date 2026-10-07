/**
 * Ambient life above everything on the island: seagulls (on twos), fish leaping in the water
 * lagoons, and each dimension's own atmosphere — sunbeams and dandelion seeds (COZY), fireflies
 * and leaves (VALLE), floating ink cubes (TINTA), embers and ash (INFERNO), drizzle and spectral
 * fog (NEÓN), snow (AURORA), rising pixels (GLITCH), bubbles (PRISMA), twinkles (ESTELAR).
 * Only islands on screen emit.
 */
import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { C, F } from '../ui/theme';
import { txt } from '../ui/widgets';
import { isoToScreen } from './iso';
import { DROP } from './terrain';
import { Tile } from './archipelago';
import type { TweenBag } from '../ui/hud/tweenBag';
import { dimWorld } from './dimensions/state';
import { dimOf, DimId, DimDef } from './dimensions/defs';
import { particleTex, wispTex } from './dimensions/bake';
import { raysTex } from './dimensions/sky';
import type { Plate } from './dimensions/plates';

interface Gull {
  g: Container;
  wingL: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ph: number;
}

type MoteKind = 'seed' | 'petal' | 'firefly' | 'leaf' | 'cube' | 'drop' | 'ember' | 'ash' | 'rain' | 'mote' | 'snow' | 'pixel' | 'bubble' | 'twinkle';
interface Mote {
  s: Sprite;
  kind: MoteKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  ph: number;
  a: number;
}
interface Recipe {
  kind: MoteKind;
  rate: number;
  tex: () => Texture;
  tint: number[];
  scale: [number, number];
  life: [number, number];
  add?: boolean;
  /** spawn height above the ground (negative = above) */
  y: [number, number];
  vx: [number, number];
  vy: [number, number];
  alpha: number;
}
const T = (k: Parameters<typeof particleTex>[0]) => () => particleTex(k);
const RECIPES: Record<DimId, Recipe[]> = {
  home: [
    { kind: 'seed', rate: 0.9, tex: T('seed'), tint: [0xffffff], scale: [0.35, 0.55], life: [6, 9], y: [-40, -160], vx: [10, 26], vy: [-10, -2], alpha: 0.9 },
    { kind: 'petal', rate: 0.6, tex: T('petal'), tint: [0xffb3c8, 0xfff0a0, 0xffffff], scale: [0.3, 0.45], life: [5, 8], y: [-120, -260], vx: [14, 30], vy: [8, 18], alpha: 0.95 },
  ],
  forest: [
    { kind: 'firefly', rate: 2.4, tex: T('ember'), tint: [0xd4ff6a, 0xfff07a, 0x9dff8a], scale: [0.35, 0.6], life: [4, 7], y: [-20, -140], vx: [-14, 14], vy: [-12, 4], alpha: 1, add: true },
    { kind: 'leaf', rate: 0.9, tex: T('leaf'), tint: [0x5fbf4a, 0x8fd46a, 0xd8e65a, 0x3f9c3a], scale: [0.4, 0.62], life: [5, 8], y: [-160, -320], vx: [10, 34], vy: [18, 34], alpha: 1 },
  ],
  cliff: [
    { kind: 'cube', rate: 0.9, tex: T('cube'), tint: [0x171317], scale: [0.7, 1.5], life: [6, 10], y: [0, -60], vx: [-6, 6], vy: [-22, -10], alpha: 0.85 },
    { kind: 'drop', rate: 0.6, tex: T('drop'), tint: [0x171317], scale: [0.28, 0.45], life: [2.5, 4], y: [-260, -380], vx: [0, 0], vy: [70, 110], alpha: 0.9 },
  ],
  volcano: [
    { kind: 'ember', rate: 11, tex: T('ember'), tint: [0xff6a1a, 0xffc94a, 0xff3a1a, 0xffe2a0], scale: [0.14, 0.34], life: [1.8, 3.6], y: [0, -40], vx: [-14, 14], vy: [-90, -40], alpha: 1, add: true },
    { kind: 'ash', rate: 1.8, tex: T('flake'), tint: [0x3a2a2a, 0x5a4444], scale: [0.18, 0.3], life: [4, 7], y: [-260, -380], vx: [6, 18], vy: [16, 32], alpha: 0.8 },
  ],
  ghost: [
    { kind: 'rain', rate: 14, tex: T('drop'), tint: [0x9fc8ff, 0xc8d8ff], scale: [0.14, 0.2], life: [0.9, 1.3], y: [-300, -420], vx: [-60, -60], vy: [420, 480], alpha: 0.45 },
    { kind: 'mote', rate: 1.2, tex: T('ember'), tint: [0x00e5ff, 0xff2e88, 0x8a5cff], scale: [0.18, 0.3], life: [3, 5], y: [-10, -100], vx: [-8, 8], vy: [-16, -4], alpha: 1, add: true },
  ],
  ice: [{ kind: 'snow', rate: 6, tex: T('flake'), tint: [0xffffff, 0xe6f6ff], scale: [0.22, 0.45], life: [4, 7], y: [-240, -380], vx: [-8, 10], vy: [26, 44], alpha: 0.95 }],
  ruins: [{ kind: 'pixel', rate: 5, tex: T('pixel'), tint: [0x00e5ff, 0xff2e88, 0xffe066, 0x7cff6a, 0xffffff], scale: [0.2, 0.5], life: [2, 4], y: [0, -60], vx: [0, 0], vy: [-46, -20], alpha: 1, add: true }],
  reef: [{ kind: 'bubble', rate: 3.2, tex: T('bubble'), tint: [0xffffff, 0xcff8ff, 0xffd8ee], scale: [0.25, 0.7], life: [3, 5], y: [0, -40], vx: [-4, 4], vy: [-50, -26], alpha: 0.9 }],
  cosmic: [{ kind: 'twinkle', rate: 3, tex: T('ember'), tint: [0xffffff, 0xc8b4ff, 0x9ff3ff, 0xff9ad8], scale: [0.12, 0.3], life: [2, 4], y: [0, -200], vx: [-5, 5], vy: [-8, 2], alpha: 1, add: true }],
  sakura: [{ kind: 'petal', rate: 4, tex: T('petal'), tint: [0xff9ec4, 0xffc9de, 0xffffff], scale: [0.3, 0.5], life: [5, 8], y: [-140, -300], vx: [12, 30], vy: [10, 22], alpha: 0.95 }],
  desert: [{ kind: 'ash', rate: 3, tex: T('flake'), tint: [0xf6e3b4, 0xe8c48a], scale: [0.16, 0.3], life: [3, 5], y: [0, -80], vx: [30, 60], vy: [-6, 4], alpha: 0.8 }],
  candy: [
    { kind: 'bubble', rate: 2.2, tex: T('bubble'), tint: [0xffffff, 0xffc4df, 0xc8f4ff], scale: [0.25, 0.6], life: [3, 5], y: [0, -40], vx: [-4, 4], vy: [-44, -22], alpha: 0.9 },
    { kind: 'petal', rate: 1.6, tex: T('petal'), tint: [0xff2e88, 0x7fe0c8, 0xffe066, 0x8a5cff], scale: [0.2, 0.32], life: [4, 6], y: [-160, -280], vx: [-8, 8], vy: [16, 30], alpha: 1 },
  ],
  void: [
    { kind: 'ash', rate: 2, tex: T('cube'), tint: [0xf3eee3], scale: [0.5, 1.1], life: [5, 8], y: [0, -40], vx: [-4, 4], vy: [-18, -8], alpha: 0.6 },
    { kind: 'mote', rate: 0.8, tex: T('ember'), tint: [0xff2e48], scale: [0.16, 0.3], life: [2, 4], y: [0, -120], vx: [-6, 6], vy: [-10, 4], alpha: 1, add: true },
  ],
};
const MAX_MOTES = 420;

export class Ambient extends Container {
  private gulls: Gull[] = [];
  private acc = 0;
  private t = 0;
  private fishT = 2;
  private motes: Mote[] = [];
  private emitAcc = new Map<string, number>();
  private rays = new Map<string, Sprite[]>();
  private fog = new Map<string, Sprite[]>();
  private moteLayer = new Container();
  private overLayer = new Container();
  private labelLayer = new Container();
  private labels = new Map<string, Container>();
  constructor(
    tiles: Map<string, Tile>,
    private bounds: { minX: number; maxX: number; minY: number; maxY: number },
    private bag: TweenBag,
  ) {
    super();
    void tiles;
    this.eventMode = 'none';
    this.addChild(this.overLayer, this.moteLayer, this.labelLayer);
    for (let i = 0; i < 6; i++) this.spawnGull(true);
  }

  private spawnGull(anywhere: boolean) {
    const g = new Container();
    const body = new Graphics();
    body.ellipse(0, 0, 10, 5).fill(C.paper).stroke({ width: 2.5, color: C.ink });
    body.poly([9, -1, 16, 1, 9, 3]).fill(C.yellow).stroke({ width: 1.5, color: C.ink });
    const wingL = new Graphics();
    const shadow = new Graphics().ellipse(0, 120, 12, 4).fill({ color: C.ink, alpha: 0.1 });
    g.addChild(shadow, wingL, body);
    const b = this.bounds;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const x = anywhere ? b.minX + Math.random() * (b.maxX - b.minX) : dir > 0 ? b.minX - 400 : b.maxX + 400;
    const y = b.minY - 200 + Math.random() * (b.maxY - b.minY + 200);
    g.scale.x = dir;
    this.addChild(g);
    this.gulls.push({ g, wingL, x, y, vx: dir * (60 + Math.random() * 50), vy: (Math.random() - 0.5) * 14, ph: Math.random() * 6 });
  }

  update(dt: number) {
    this.t += dt;
    this.acc += dt;
    if (this.acc >= 1 / 12) {
      const step = this.acc;
      this.acc = 0;
      const b = this.bounds;
      for (let i = this.gulls.length - 1; i >= 0; i--) {
        const gl = this.gulls[i];
        gl.x += gl.vx * step;
        gl.y += gl.vy * step + Math.sin(this.t * 0.8 + gl.ph) * 6 * step;
        gl.g.position.set(gl.x, gl.y);
        const flap = Math.sin(this.t * 7 + gl.ph);
        gl.wingL.clear();
        const wy = -6 - flap * 9;
        gl.wingL.moveTo(-14, wy).quadraticCurveTo(-6, -2, 0, 0).quadraticCurveTo(6, -2, 14, wy).stroke({ width: 3.5, color: C.ink, cap: 'round', join: 'round' });
        if (gl.x < b.minX - 700 || gl.x > b.maxX + 700) {
          gl.g.destroy({ children: true });
          this.gulls.splice(i, 1);
          this.spawnGull(false);
        }
      }
    }
    this.dimensions(dt);
    this.dimLabels();
    this.fishT -= dt;
    if (this.fishT <= 0) {
      this.fishT = 1.6 + Math.random() * 3;
      const p = this.lagoonSpot();
      if (p) this.leap(p.x + (Math.random() - 0.5) * 30, p.y, p.tint);
    }
  }

  // ------------------------------------------------------------------ dimension atmosphere
  private onScreen(p: Plate, pad = 300) {
    const c = dimWorld.cam;
    return p.maxX + pad > c.x0 && p.minX - pad < c.x1 && p.maxY + pad > c.y0 && p.minY - pad - 300 < c.y1;
  }

  private dimensions(dt: number) {
    const plates = dimWorld.plates;
    if (!plates) return;
    for (const p of plates.values()) {
      const open = dimWorld.looks.get(p.id) === 'open';
      const d = dimOf(dimWorld.biome[p.id]);
      const vis = open && this.onScreen(p);
      this.overFx(p, d.id, open, vis, dt);
      if (!vis) continue;
      const recipes = RECIPES[d.id] ?? [];
      // density scales with island size
      const k = Math.min(1.6, Math.max(0.6, p.land.length / 90));
      for (const [i, r] of recipes.entries()) {
        const id = `${p.id}:${i}`;
        let a = (this.emitAcc.get(id) ?? Math.random()) + dt * r.rate * k;
        while (a >= 1 && this.motes.length < MAX_MOTES) {
          a -= 1;
          this.spawnMote(p, r);
        }
        if (a > 3) a = 0;
        this.emitAcc.set(id, a);
      }
    }
    for (let i = this.motes.length - 1; i >= 0; i--) {
      const m = this.motes[i];
      m.life += dt;
      const k = m.life / m.max;
      if (k >= 1) {
        m.s.destroy();
        this.motes.splice(i, 1);
        continue;
      }
      let ax = 0;
      switch (m.kind) {
        case 'seed':
        case 'petal':
        case 'leaf':
        case 'snow':
        case 'ash':
          ax = Math.sin(this.t * 1.6 + m.ph) * 18;
          m.s.rotation += dt * (m.kind === 'leaf' || m.kind === 'petal' ? 2.2 : 0.6) * (m.ph > 3 ? 1 : -1);
          if (m.kind === 'leaf') m.s.scale.x = m.s.scale.y * Math.sin(this.t * 3 + m.ph);
          break;
        case 'firefly':
          m.vx += (Math.random() - 0.5) * 40 * dt;
          m.vy += (Math.random() - 0.5) * 40 * dt;
          m.s.alpha = m.a * (0.35 + 0.65 * Math.max(0, Math.sin(this.t * 3 + m.ph)));
          break;
        case 'ember':
          ax = Math.sin(this.t * 4 + m.ph) * 30;
          break;
        case 'cube':
          m.s.rotation += dt * 0.5 * (m.ph > 3 ? 1 : -1);
          break;
        case 'pixel':
          m.s.visible = Math.sin(this.t * 14 + m.ph * 5) > -0.4;
          if (Math.random() < dt * 2) m.x += (Math.random() < 0.5 ? -1 : 1) * 10;
          break;
        case 'bubble':
          ax = Math.sin(this.t * 2.4 + m.ph) * 14;
          break;
        case 'twinkle':
          m.s.alpha = m.a * Math.max(0, Math.sin(k * Math.PI)) * (0.5 + 0.5 * Math.sin(this.t * 9 + m.ph));
          break;
      }
      m.x += (m.vx + ax) * dt;
      m.y += m.vy * dt;
      m.s.position.set(m.x, m.y);
      if (m.kind !== 'firefly' && m.kind !== 'twinkle') m.s.alpha = m.a * Math.min(1, k * 6, (1 - k) * 4);
    }
  }

  private spawnMote(p: Plate, r: Recipe) {
    const t = p.land[Math.floor(Math.random() * p.land.length)];
    if (!t) return;
    const pos = isoToScreen(t.gx + Math.random() - 0.5, t.gy + Math.random() - 0.5);
    const rnd = (a: [number, number]) => a[0] + Math.random() * (a[1] - a[0]);
    const s = new Sprite(r.tex());
    s.anchor.set(0.5);
    s.tint = r.tint[Math.floor(Math.random() * r.tint.length)];
    const sc = rnd(r.scale);
    s.scale.set(sc);
    if (r.kind === 'rain') s.scale.set(sc, sc * 4.5);
    if (r.add) s.blendMode = 'add';
    s.alpha = 0;
    const x = pos.x;
    const y = pos.y + rnd(r.y);
    s.position.set(x, y);
    if (r.kind === 'rain') s.rotation = 0.12;
    this.moteLayer.addChild(s);
    this.motes.push({ s, kind: r.kind, x, y, vx: rnd(r.vx), vy: rnd(r.vy), life: 0, max: rnd(r.life), ph: Math.random() * 6.28, a: r.alpha });
  }

  /** persistent over-the-buildings effects: cozy sunbeams, valley light shafts, noir ground fog */
  private overFx(p: Plate, id: DimId, open: boolean, vis: boolean, dt: number) {
    if (id === 'home' || id === 'forest') {
      let list = this.rays.get(p.id);
      if (!list && open) {
        list = [];
        for (let i = 0; i < 2; i++) {
          const s = new Sprite(raysTex());
          s.anchor.set(0, 0);
          s.blendMode = 'add';
          s.tint = id === 'forest' ? 0xeaffc0 : 0xfff0c0;
          const w = (p.maxX - p.minX) * (i ? 0.8 : 1.15);
          s.width = w;
          s.height = w;
          s.position.set(p.minX - 120 + i * 220, p.minY - 380 + i * 60);
          s.alpha = 0;
          this.overLayer.addChild(s);
          list.push(s);
        }
        this.rays.set(p.id, list);
      }
      if (list) list.forEach((s, i) => {
        s.visible = vis;
        if (vis) s.alpha = (id === 'forest' ? 0.4 : 0.32) + Math.sin(this.t * (0.5 + i * 0.3) + i * 2) * 0.12;
      });
    }
    if (id === 'ghost' || id === 'ruins') {
      let list = this.fog.get(p.id);
      if (!list && open) {
        list = [];
        const n = id === 'ghost' ? 5 : 3;
        for (let i = 0; i < n; i++) {
          const s = new Sprite(wispTex(i % 3, id === 'ghost' ? 0xd8e0ff : 0xffc8f0, id === 'ghost' ? 0xa8b4e8 : 0xb98ae8));
          s.anchor.set(0.5);
          s.scale.set(1.6 + Math.random() * 1.2, 1 + Math.random() * 0.5);
          s.alpha = id === 'ghost' ? 0.15 : 0.12;
          const t = p.land[Math.floor(Math.random() * p.land.length)];
          const q = isoToScreen(t.gx, t.gy);
          s.position.set(q.x, q.y - 20);
          (s as Sprite & { v?: number }).v = (10 + Math.random() * 14) * (i % 2 ? 1 : -1);
          this.overLayer.addChild(s);
          list.push(s);
        }
        this.fog.set(p.id, list);
      }
      if (list)
        for (const s of list) {
          s.visible = vis;
          if (!vis) continue;
          s.x += ((s as Sprite & { v?: number }).v ?? 10) * dt;
          if (s.x > p.maxX + 100) s.x = p.minX - 100;
          if (s.x < p.minX - 100) s.x = p.maxX + 100;
        }
    }
    if (!open) {
      for (const m of [this.rays, this.fog]) {
        const l = m.get(p.id);
        if (l) {
          l.forEach((s) => s.destroy());
          m.delete(p.id);
        }
      }
    }
  }

  // ------------------------------------------------------------------ dimension title cards (overview only)
  private dimLabels() {
    const plates = dimWorld.plates;
    if (!plates) return;
    const z = dimWorld.cam.zoom;
    const show = Math.max(0, Math.min(1, (0.62 - z) / 0.14));
    for (const p of plates.values()) {
      const d = dimOf(dimWorld.biome[p.id]);
      const open = dimWorld.looks.get(p.id) === 'open';
      let l = this.labels.get(p.id);
      if (!l && open && show > 0) {
        l = titleCard(d);
        l.position.set(p.cx, p.minY - 70);
        this.labelLayer.addChild(l);
        this.labels.set(p.id, l);
      }
      if (!l) continue;
      if (!open) {
        l.destroy({ children: true });
        this.labels.delete(p.id);
        continue;
      }
      l.alpha = show;
      l.visible = show > 0.01;
      // keep a constant on-screen size
      l.scale.set(Math.min(2.6, 0.9 / Math.max(0.2, z)));
    }
  }

  // ------------------------------------------------------------------ fish (water lagoons only)
  private lagoonSpot() {
    const plates = dimWorld.plates;
    if (!plates) return null;
    const ok: { p: Plate; tint: number }[] = [];
    for (const p of plates.values()) {
      if (dimWorld.looks.get(p.id) !== 'open' || !p.wet.length || !this.onScreen(p, 0)) continue;
      const d = dimOf(dimWorld.biome[p.id]).id;
      const tint = d === 'home' || d === 'forest' ? 0x9fd6ea : d === 'reef' ? 0xffb3d0 : d === 'ice' ? 0xdff4ff : d === 'cosmic' ? 0xb9a4ff : d === 'ghost' ? 0x7ff3ff : -1;
      if (tint >= 0) ok.push({ p, tint });
    }
    if (!ok.length) return null;
    const { p, tint } = ok[Math.floor(Math.random() * ok.length)];
    const far = p.wet.filter((t) => (p.dist.get(`${t.gx},${t.gy}`) ?? 1) >= 1.4);
    const pool = far.length ? far : p.wet;
    const t = pool[Math.floor(Math.random() * pool.length)];
    const s = isoToScreen(t.gx, t.gy);
    return { x: s.x, y: s.y + DROP, tint };
  }

  private leap(x0: number, y0: number, tint = 0x9fd6ea) {
    const g = new Graphics();
    g.ellipse(0, 0, 12, 6).fill(tint).stroke({ width: 2.5, color: C.ink });
    g.poly([10, 0, 18, -6, 18, 6]).fill(tint).stroke({ width: 2.5, color: C.ink });
    const dir = Math.random() < 0.5 ? -1 : 1;
    g.scale.x = -dir;
    g.position.set(x0, y0);
    this.addChild(g);
    const o = { t: 0 };
    const ring = (x: number) => {
      const r = new Graphics().ellipse(0, 0, 9, 3.5).stroke({ width: 2.5, color: 0xffffff });
      r.position.set(x, y0);
      this.addChildAt(r, 0);
      this.bag.to(r.scale, { x: 3, y: 3, duration: 0.6, ease: 'power2.out' });
      this.bag.to(r, { alpha: 0, duration: 0.6, onComplete: () => r.destroy() });
    };
    ring(x0);
    this.bag.to(o, {
      t: 1,
      duration: 0.8,
      ease: 'none',
      onUpdate: () => {
        g.x = x0 + dir * 40 * o.t;
        g.y = y0 - Math.sin(o.t * Math.PI) * 60;
        g.rotation = dir * (o.t - 0.5) * 2.4;
      },
      onComplete: () => {
        ring(g.x);
        g.destroy();
      },
    });
  }
}

/** "DIMENSIÓN INFERNO" card in the dimension's own typography */
const CARD: Record<DimId, { font: string; fill: number; bg: number; ink: number; rot: number }> = {
  home: { font: F.comic, fill: 0x171317, bg: 0xffc94a, ink: 0x171317, rot: -0.03 },
  forest: { font: F.comic, fill: 0x14301a, bg: 0xd4f27a, ink: 0x14201a, rot: 0.03 },
  cliff: { font: F.brush, fill: 0x171317, bg: 0xf3eee3, ink: 0x171317, rot: -0.04 },
  volcano: { font: F.heavy, fill: 0xffc94a, bg: 0x4e0000, ink: 0x120404, rot: 0.02 },
  ghost: { font: F.bebas, fill: 0x00e5ff, bg: 0x0d111d, ink: 0xff2e88, rot: 0 },
  ice: { font: F.serif, fill: 0x14223a, bg: 0xdff6ff, ink: 0x14223a, rot: -0.02 },
  ruins: { font: F.glitch, fill: 0xff2e88, bg: 0x07040c, ink: 0x00e5ff, rot: 0.03 },
  reef: { font: F.comic, fill: 0x10243a, bg: 0xffd0ea, ink: 0x10243a, rot: -0.03 },
  cosmic: { font: F.bebas, fill: 0xffffff, bg: 0x2a1650, ink: 0x8a5cff, rot: 0.02 },
  sakura: { font: F.serif, fill: 0x3a1f2a, bg: 0xffe0ec, ink: 0x3a1f2a, rot: -0.02 },
  desert: { font: F.news, fill: 0x2a1a0a, bg: 0xf6e3b4, ink: 0x2a1a0a, rot: 0.02 },
  candy: { font: F.comic, fill: 0xff2e88, bg: 0xfff6d6, ink: 0x3a1030, rot: -0.03 },
  void: { font: F.heavy, fill: 0xf3eee3, bg: 0x0b0a0e, ink: 0xff2e48, rot: 0 },
};
function titleCard(d: DimDef): Container {
  const s = CARD[d.id];
  const c = new Container();
  const t = txt(d.name, { fontFamily: s.font, fontSize: 34, fill: s.fill, letterSpacing: 2 });
  t.anchor.set(0.5);
  const w = t.width + 40;
  const h = t.height + 14;
  const g = new Graphics();
  g.rect(-w / 2 + 6, -h / 2 + 6, w, h).fill(s.ink);
  g.rect(-w / 2, -h / 2, w, h).fill(s.bg).stroke({ width: 3.5, color: s.ink });
  if (d.id === 'ruins') {
    const g2 = txt(d.name, { fontFamily: s.font, fontSize: 34, fill: 0x00e5ff, letterSpacing: 2 });
    g2.anchor.set(0.5);
    g2.position.set(-3, 1);
    g2.alpha = 0.8;
    c.addChild(g, g2, t);
  } else c.addChild(g, t);
  c.rotation = s.rot;
  return c;
}
