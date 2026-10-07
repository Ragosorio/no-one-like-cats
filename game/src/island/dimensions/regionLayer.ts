/**
 * One island = one RegionLayer: floating-rock underside (+falls, wisps), lagoon, land tiles and the
 * dimension's terrain pattern. Static geometry is drawn once per look change; only cheap things
 * (frame swaps, alphas, tile offsets) animate.
 */
import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js';
import { TW, TH, isoToScreen } from '../iso';
import { key, N4 } from '../archipelago';
import { hatchTexture } from '../../art/textures';
import { DimDef, dimOf, VEIL } from './defs';
import { Plate, plateFaces, depthProfile, faceBottom, Face } from './plates';
import { patternTex, lavaGlowTex, rockTex, lagoonTex, LAGOON_FRAMES, fallTex, wispTex } from './bake';
import type { RegionLook } from './state';
import { txt } from '../../ui/widgets';
import { F } from '../../ui/theme';

const STAMP: Record<string, number> = { home: 0x171317, forest: 0x2f7a34, cliff: 0x171317, volcano: 0xc8102e, ghost: 0x1f5f8f, ice: 0x2a62a8, ruins: 0xb0107a, reef: 0xc83a7a, cosmic: 0x5a2ab8, sakura: 0xc83a7a, desert: 0x7a5630, candy: 0xff2e88, void: 0xff2e48 };

const DIRT = 0x9c7650;

export function mixColor(a: number, b: number, t: number) {
  const r = ((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t;
  const g = ((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t;
  const bl = (a & 255) * (1 - t) + (b & 255) * t;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl);
}
export function shade(c: number, k: number) {
  const r = Math.min(255, Math.max(0, Math.round(((c >> 16) & 255) * k)));
  const g = Math.min(255, Math.max(0, Math.round(((c >> 8) & 255) * k)));
  const b = Math.min(255, Math.max(0, Math.round((c & 255) * k)));
  return (r << 16) | (g << 8) | b;
}
function h2(a: number, b: number, s = 0) {
  let h = (a * 374761393 + b * 668265263 + s * 974711) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const RIM_LIGHT: Partial<Record<string, number>> = { volcano: 0xff6a1a, ghost: 0x00e5ff, ruins: 0xff2e88, cosmic: 0x8a5cff, cliff: 0xf3eee3, void: 0xff2e48 };
const FALL_SPEED: Record<string, number> = { water: 190, lava: 60, ink: 130, data: 240, neon: 150, ice: 0, prism: 160, stars: 55 };

interface Fall {
  s: TilingSprite;
  speed: number;
  stepped: boolean;
  acc: number;
}
interface Wisp {
  s: Sprite;
  x0: number;
  x1: number;
  v: number;
}

export class RegionLayer extends Container {
  /** underside + falls + wisps */
  back = new Container();
  lagoon = new Container();
  land = new Graphics();
  /** pattern overlays (frames) */
  over = new Container();
  /** live per-dimension fx drawn on the terrain (below buildings) */
  fx = new Container();
  readonly dim: DimDef;
  look: RegionLook | '' = '';
  /** land drop (cliff px) */
  readonly drop: number;
  faces: Face[] = [];
  profile: ReturnType<typeof depthProfile>;
  /** pattern / lagoon / rock overlay frame sets (for boil / crossfade) */
  pat: Graphics[] = [];
  lagOv: Graphics[] = [];
  rockOv: Graphics[] = [];
  glow: Graphics | null = null;
  foam: Graphics[] = [];
  falls: Fall[] = [];
  wisps: Wisp[] = [];
  /** world bounds incl. underside (for culling) */
  bounds = { x0: 0, y0: 0, x1: 0, y1: 0 };
  private foamT = 0;
  constructor(
    public plate: Plate,
    biome: string,
    private hasTile: (gx: number, gy: number) => boolean,
    drop: number,
  ) {
    super();
    this.dim = dimOf(biome);
    this.drop = drop;
    this.addChild(this.back, this.lagoon, this.land, this.over, this.fx);
    this.faces = plateFaces(plate, drop);
    this.profile = depthProfile(plate, this.dim, plate.land.length * 7 + plate.id.length);
    this.bounds = { x0: plate.minX - 120, x1: plate.maxX + 120, y0: plate.minY - 200, y1: plate.maxY + drop + this.profile.D * 1.6 + 320 };
    this.eventMode = 'none';
  }

  get open() {
    return this.look === 'open';
  }
  get sealed() {
    return this.look === 'veil' || this.look === 'available';
  }

  build(look: RegionLook) {
    if (look === this.look) return;
    this.look = look;
    for (const c of [this.back, this.lagoon, this.over]) c.removeChildren().forEach((o) => o.destroy({ children: true }));
    this.land.clear();
    this.pat = [];
    this.lagOv = [];
    this.rockOv = [];
    this.glow = null;
    this.foam = [];
    this.falls = [];
    this.wisps = [];
    this.drawUnderside();
    this.drawLagoon();
    this.drawLand();
    this.drawPattern();
  }

  // ------------------------------------------------------------------ underside
  private drawUnderside() {
    const d = this.dim;
    const sealed = this.sealed;
    const g = new Graphics();
    const deco = new Graphics();
    this.back.addChild(g);
    const stepped = !sealed && (d.spikes === 'pixel' || d.spikes === 'city');
    const step = d.spikes === 'pixel' ? 24 : 34;
    const depth = sealed ? (x: number) => this.profile.fn(x) * 0.62 : this.profile.fn;
    const light = sealed ? VEIL.rock : this.look === 'clearing' ? mixColor(d.rock.light, DIRT, 0.35) : d.rock.light;
    const dark = sealed ? VEIL.rockDark : this.look === 'clearing' ? mixColor(d.rock.dark, DIRT, 0.35) : d.rock.dark;
    const ink = sealed ? 0x171317 : d.id === 'cliff' ? d.rock.line : d.ink;
    const polys: number[][] = [];
    const bottoms: [number, number][][] = [];
    for (const f of this.faces) {
      const bot = faceBottom(f, depth, stepped, step);
      const pts = [f.x0, f.y0, f.x1, f.y1];
      for (let i = bot.length - 1; i >= 0; i--) pts.push(bot[i][0], bot[i][1]);
      polys.push(pts);
      bottoms.push(bot);
      // cone lighting (light from the upper-left): hard cel terminator instead of per-face stripes
      const u = ((f.x0 + f.x1) / 2 - this.profile.cx) / this.profile.halfW;
      const k = 0.985 + h2(f.gx, f.gy, 3) * 0.03;
      const col = shade(u < 0.32 ? light : dark, k);
      g.poly(pts).fill(col);
      // anime cel shading: one hard shadow band on the lower half of the rock
      const mid = bot.map(([x, y]) => {
        const yt = f.y0 + ((x - f.x0) / (f.x1 - f.x0)) * (f.y1 - f.y0);
        return [x, yt + (y - yt) * 0.5] as [number, number];
      });
      const band: number[] = [];
      for (const [x, y] of mid) band.push(x, y);
      for (let i = bot.length - 1; i >= 0; i--) band.push(bot[i][0], bot[i][1]);
      g.poly(band).fill(shade(col, sealed ? 0.88 : 0.74));
    }
    // texture overlays (frames boil for the ink dimension)
    const frames = sealed ? 1 : d.id === 'cliff' ? 3 : 1;
    for (let fr = 0; fr < frames; fr++) {
      const o = new Graphics();
      const tex = sealed ? hatchTexture(0x171317, 9, 1.4) : rockTex(d, fr);
      for (const pts of polys) o.poly(pts).fill({ texture: tex, textureSpace: 'global', alpha: sealed ? 0.22 : 1 });
      o.visible = fr === 0;
      this.back.addChild(o);
      this.rockOv.push(o);
    }
    // dimension decorations hanging from the bottom
    if (!sealed && this.look === 'open') this.hangers(deco, bottoms);
    this.back.addChild(deco);
    // rim light + outline + top lip
    const outline = new Graphics();
    const rl = sealed ? undefined : RIM_LIGHT[d.id];
    for (let i = 0; i < this.faces.length; i++) {
      const f = this.faces[i];
      const bot = bottoms[i];
      if (rl !== undefined) {
        outline.moveTo(bot[0][0], bot[0][1] - 4);
        for (let k = 1; k < bot.length; k++) outline.lineTo(bot[k][0], bot[k][1] - 4);
        outline.stroke({ width: 3, color: rl, alpha: d.id === 'cliff' ? 0.4 : 0.75 });
      }
      outline.moveTo(bot[0][0], bot[0][1]);
      for (let k = 1; k < bot.length; k++) outline.lineTo(bot[k][0], bot[k][1]);
      outline.stroke({ width: 4, color: ink, join: 'round', cap: 'round' });
      // lip under the lagoon rim
      const lip = sealed ? VEIL.side : d.lagoon.rim;
      outline.poly([f.x0, f.y0, f.x1, f.y1, f.x1, f.y1 + 9, f.x0, f.y0 + 9]).fill(lip);
      outline.moveTo(f.x0, f.y0 + 9).lineTo(f.x1, f.y1 + 9).stroke({ width: 2, color: ink, alpha: 0.6 });
    }
    this.back.addChild(outline);
    if (!sealed && this.look === 'open') this.addFalls();
    if (sealed) this.stamp(depth);
    this.addWisps(sealed);
  }

  /** "DIMENSIÓN X — SELLADA" rubber stamp on the paper rock (a preview of what's inside) */
  private stamp(depth: (x: number) => number) {
    const d = this.dim;
    const col = STAMP[d.id] ?? 0x171317;
    const c = new Container();
    const R = Math.min(100, this.profile.halfW * 0.28);
    const g = new Graphics();
    g.circle(0, 0, R).stroke({ width: 6, color: col, alpha: 0.85 });
    g.circle(0, 0, R - 12).stroke({ width: 2.5, color: col, alpha: 0.85 });
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      g.circle(Math.cos(a) * (R - 6), Math.sin(a) * (R - 6), 1.8).fill({ color: col, alpha: 0.7 });
    }
    const top = txt('DIMENSIÓN', { fontFamily: F.poster, fontSize: R * 0.2, fill: col, letterSpacing: 3 });
    top.anchor.set(0.5);
    top.y = -R * 0.42;
    const mid = txt(d.short, { fontFamily: F.poster, fontSize: R * (d.short.length > 6 ? 0.36 : 0.44), fill: col });
    mid.anchor.set(0.5);
    const band = new Graphics().rect(-R * 0.98, -R * 0.26, R * 1.96, R * 0.52).fill({ color: 0xf3ecdc, alpha: 0.5 }).stroke({ width: 3, color: col, alpha: 0.85 });
    const bot = txt('SELLADA', { fontFamily: F.poster, fontSize: R * 0.2, fill: col, letterSpacing: 3 });
    bot.anchor.set(0.5);
    bot.y = R * 0.44;
    c.addChild(g, band, top, mid, bot);
    c.alpha = 0.9;
    c.rotation = -0.18;
    const x = this.profile.cx;
    c.position.set(x, this.plate.maxY + this.drop + Math.max(R + 14, depth(x) * 0.24));
    this.back.addChild(c);
  }

  /** roots, icicles, lava drips, antennas, data drips… */
  private hangers(g: Graphics, bottoms: [number, number][][]) {
    const d = this.dim;
    const pts: [number, number][] = [];
    bottoms.forEach((b) => b.forEach((p, i) => i % 2 === 0 && pts.push(p)));
    const D = this.profile.D;
    pts.forEach(([x, y], i) => {
      const r = h2(Math.round(x), i, 21);
      if (r > 0.45) return;
      const r2 = h2(Math.round(x), i, 22);
      switch (d.id) {
        case 'home':
        case 'forest': {
          const l = 20 + r2 * (d.id === 'forest' ? 90 : 50);
          g.moveTo(x, y - 4).bezierCurveTo(x + 8, y + l * 0.3, x - 8, y + l * 0.6, x + 3, y + l).stroke({ width: 3, color: r < 0.2 ? 0x6a4a2a : d.rock.accent, cap: 'round' });
          if (d.id === 'forest') g.ellipse(x + 3, y + l, 5, 3).fill(0x7fd05a).stroke({ width: 1.5, color: d.ink });
          break;
        }
        case 'ice': {
          const l = 18 + r2 * 60;
          g.poly([x - 6, y - 3, x + 6, y - 3, x, y + l]).fill({ color: 0xe6f8ff, alpha: 0.95 }).stroke({ width: 2, color: d.ink, join: 'round' });
          g.moveTo(x - 1, y).lineTo(x, y + l * 0.7).stroke({ width: 1.5, color: 0xffffff });
          break;
        }
        case 'volcano': {
          const l = 10 + r2 * 34;
          g.moveTo(x, y - 2).lineTo(x, y + l).stroke({ width: 4, color: 0xff6a1a, cap: 'round' });
          g.circle(x, y + l + 3, 4).fill(0xffc94a);
          break;
        }
        case 'ghost': {
          if (r < 0.2) {
            const l = 30 + r2 * 90;
            g.moveTo(x, y - 2).lineTo(x, y + l).stroke({ width: 2, color: 0x1a2032 });
            g.circle(x, y + l, 3.5).fill(0xff3a3a);
          } else {
            const l = 8 + r2 * 22;
            g.moveTo(x, y).lineTo(x, y + l).stroke({ width: 2, color: r2 < 0.5 ? 0x00e5ff : 0xff2e88, alpha: 0.9 });
          }
          break;
        }
        case 'ruins': {
          const l = 20 + r2 * 160;
          const cols = [0x00e5ff, 0xff2e88, 0xffc94a, 0x7cff6a, 0x8a5cff];
          g.rect(Math.round(x), y - 2, 2.5, l).fill({ color: cols[Math.floor(r2 * cols.length)], alpha: 0.85 });
          break;
        }
        case 'reef': {
          const l = 30 + r2 * 70;
          g.moveTo(x, y - 3).bezierCurveTo(x + 10, y + l * 0.33, x - 10, y + l * 0.66, x + 4, y + l).stroke({ width: 4, color: r < 0.2 ? 0xff7ab8 : 0x3fbf9a, cap: 'round' });
          break;
        }
        case 'cosmic': {
          const s = 4 + r2 * 9;
          const yy = y + 20 + r2 * 60;
          g.poly([x, yy - s, x + s * 0.6, yy, x, yy + s, x - s * 0.6, yy]).fill(r < 0.2 ? 0x00e5ff : 0x8a5cff).stroke({ width: 1.5, color: d.ink });
          break;
        }
        case 'sakura': {
          // hanging wisteria-ish petals
          const l = 16 + r2 * 46;
          g.moveTo(x, y - 3).bezierCurveTo(x + 6, y + l * 0.4, x - 6, y + l * 0.7, x + 2, y + l).stroke({ width: 2.5, color: 0x6e4656, cap: 'round' });
          g.circle(x + 2, y + l, 5).fill(r < 0.2 ? 0xffffff : 0xff9ec4).stroke({ width: 1.5, color: d.ink });
          break;
        }
        case 'desert': {
          // sand trickles
          const l = 14 + r2 * 70;
          g.moveTo(x, y - 2).lineTo(x + 1, y + l).stroke({ width: 2, color: 0xf6e3b4, alpha: 0.8 });
          break;
        }
        case 'candy': {
          // drips of syrup
          const l = 10 + r2 * 36;
          g.roundRect(x - 3.5, y - 3, 7, l, 3.5).fill(r < 0.2 ? 0xffffff : 0xff7ab8).stroke({ width: 1.5, color: d.ink });
          break;
        }
        case 'void': {
          const l = 20 + r2 * 120;
          g.rect(Math.round(x), y - 2, 2, l).fill({ color: r < 0.15 ? 0xff2e48 : 0xf3eee3, alpha: 0.8 });
          break;
        }
        case 'cliff': {
          // construction lines converging to a vanishing point far below (technical drawing)
          const vx = this.profile.cx;
          const vy = this.plate.maxY + this.drop + D * 2.4;
          g.moveTo(x, y).lineTo(x + (vx - x) * 0.35, y + (vy - y) * 0.35).stroke({ width: 1.2, color: 0xf3eee3, alpha: 0.45 });
          break;
        }
      }
    });
  }

  private addFalls() {
    const d = this.dim;
    const cands = this.faces.filter((f) => f.front && Math.abs((f.x0 + f.x1) / 2 - this.profile.cx) < this.profile.halfW * 0.72);
    cands.sort((a, b) => h2(a.gx, a.gy, 31) - h2(b.gx, b.gy, 31));
    const picked: Face[] = [];
    for (const f of cands) {
      if (picked.length >= d.fall.count) break;
      const mx = (f.x0 + f.x1) / 2;
      if (picked.some((p) => Math.abs((p.x0 + p.x1) / 2 - mx) < 110)) continue;
      // falls only from lagoon tiles (never from bare land cliffs)
      if (!this.plate.dist.has(key(f.gx, f.gy))) continue;
      picked.push(f);
    }
    const tex = fallTex(d.fall.kind);
    for (const f of picked) {
      const mx = (f.x0 + f.x1) / 2;
      const my = (f.y0 + f.y1) / 2;
      const dep = this.profile.fn(mx);
      const wdt = d.fall.kind === 'neon' || d.fall.kind === 'data' ? 30 : 34 + h2(f.gx, f.gy, 5) * 14;
      const len = dep + 260 + h2(f.gx, f.gy, 6) * 200;
      const s = new TilingSprite({ texture: tex, width: wdt, height: len });
      s.anchor.set(0.5, 0);
      s.position.set(mx, my - 3);
      s.tilePosition.y = h2(f.gx, f.gy, 7) * 256;
      if (d.fall.kind === 'lava' || d.fall.kind === 'neon' || d.fall.kind === 'stars') s.blendMode = d.fall.kind === 'lava' ? 'normal' : 'add';
      this.back.addChild(s);
      // lip splash
      const lip = new Graphics().ellipse(mx, my + 2, wdt * 0.7, 6).fill({ color: d.fall.core, alpha: 0.9 }).stroke({ width: 2, color: d.ink, alpha: 0.5 });
      this.back.addChild(lip);
      // mist where it disappears
      if (d.fall.kind === 'water' || d.fall.kind === 'prism' || d.fall.kind === 'ice' || d.fall.kind === 'lava') {
        const m = new Sprite(wispTex(2, d.fall.kind === 'lava' ? 0x4a1410 : 0xffffff, d.fall.kind === 'lava' ? 0x2a0806 : 0xd6e6f6));
        m.anchor.set(0.5);
        m.scale.set(0.55, 0.6);
        m.position.set(mx, my + len - 30);
        m.alpha = 0.9;
        this.back.addChild(m);
      }
      this.falls.push({ s, speed: FALL_SPEED[d.fall.kind] ?? 150, stepped: d.fall.kind === 'ink', acc: 0 });
    }
  }

  private addWisps(sealed: boolean) {
    const d = this.dim;
    const n = sealed ? 1 : 3;
    const tint: Record<string, [number, number, number]> = {
      home: [0xffffff, 0xcfdcf2, 0.95],
      forest: [0xffffff, 0xcfe4f2, 0.95],
      cliff: [0xf3eee3, 0xbdb6aa, 0.85],
      volcano: [0x6a2020, 0x3a0a0a, 0.85],
      ghost: [0xc8d0ff, 0x8a92c8, 0.45],
      ice: [0xffffff, 0xbfdcf0, 0.9],
      ruins: [0xffc0f0, 0x9a6ad8, 0.7],
      reef: [0xffffff, 0xffd0ea, 0.9],
      cosmic: [0xb9a4ff, 0x5a3a9a, 0.55],
      sakura: [0xffffff, 0xffd6e6, 0.95],
      desert: [0xfff4d0, 0xe8c48a, 0.9],
      candy: [0xffffff, 0xffc4df, 0.95],
      void: [0x2a2730, 0x0b0a0e, 0.8],
    };
    const [top, belly, alpha] = sealed ? [0xf6efe2, 0xd9cdb8, 0.95] : (tint[d.id] ?? tint.home);
    for (let i = 0; i < n; i++) {
      const s = new Sprite(wispTex(i % 2, top, belly));
      s.anchor.set(0.5);
      const sc = 0.9 + h2(i, this.plate.land.length, 2) * 0.9;
      s.scale.set(sc * (i % 2 ? -1 : 1), sc);
      s.alpha = alpha;
      const y = this.plate.maxY + this.drop + this.profile.D * (0.25 + i * 0.32);
      const x0 = this.plate.minX - 240;
      const x1 = this.plate.maxX + 240;
      s.position.set(x0 + h2(i, 9, this.plate.wet.length) * (x1 - x0), y);
      this.back.addChild(s);
      this.wisps.push({ s, x0, x1, v: (12 + i * 7) * (i % 2 ? -1 : 1) });
    }
  }

  // ------------------------------------------------------------------ lagoon
  private drawLagoon() {
    const d = this.dim;
    const sealed = this.sealed;
    const hw = TW / 2;
    const hh = TH / 2;
    const base = new Graphics();
    this.lagoon.addChild(base);
    const dia = (g: Graphics, gx: number, gy: number, k = 1.04) => {
      const p = isoToScreen(gx, gy);
      const y = p.y + this.drop;
      return g.poly([p.x, y - hh * k, p.x + hw * k, y, p.x, y + hh * k, p.x - hw * k, y]);
    };
    const la = sealed ? 0xd8dccb : d.lagoon.a;
    const lb = sealed ? 0xbfc4ae : d.lagoon.b;
    for (const t of this.plate.wet) {
      const dist = this.plate.dist.get(key(t.gx, t.gy)) ?? 1;
      dia(base, t.gx, t.gy).fill(mixColor(la, lb, Math.min(1, Math.max(0, (dist - 1) / 1.3))));
    }
    // overlays
    const frames = sealed ? 1 : (LAGOON_FRAMES[d.id] ?? 1);
    for (let f = 0; f < frames; f++) {
      const o = new Graphics();
      const tex = sealed ? hatchTexture(0x171317, 10, 1.2) : lagoonTex(d, f);
      for (const t of this.plate.wet) dia(o, t.gx, t.gy).fill({ texture: tex, textureSpace: 'global', alpha: sealed ? 0.16 : 1 });
      o.visible = f === 0;
      this.lagoon.addChild(o);
      this.lagOv.push(o);
    }
    // shore foam (front coast edges), two boil frames
    const foamC = sealed ? 0xffffff : d.lagoon.foam;
    for (let off = 0; off < 2; off++) {
      const g = new Graphics();
      for (const t of this.plate.land) {
        const p = isoToScreen(t.gx, t.gy);
        const y = p.y + this.drop;
        const wob = (h2(t.gx, t.gy, off) - 0.5) * 6;
        if (!this.hasTile(t.gx + 1, t.gy) && this.plate.has.has(key(t.gx + 1, t.gy)))
          g.moveTo(p.x + hw + 8, y + 4 + wob).lineTo(p.x + 6, y + hh + 6 + wob).stroke({ width: 4, color: foamC, alpha: 0.85, cap: 'round' });
        if (!this.hasTile(t.gx, t.gy + 1) && this.plate.has.has(key(t.gx, t.gy + 1)))
          g.moveTo(p.x - hw - 8, y + 4 + wob).lineTo(p.x - 6, y + hh + 6 + wob).stroke({ width: 4, color: foamC, alpha: 0.85, cap: 'round' });
      }
      g.visible = off === 0;
      if (d.id === 'volcano' && !sealed) g.blendMode = 'add';
      this.lagoon.addChild(g);
      this.foam.push(g);
    }
    // rim stone along the outer edge of the ring
    const rim = new Graphics();
    const rimC = sealed ? VEIL.side : d.lagoon.rim;
    const rimD = sealed ? 0x171317 : d.lagoon.rimDark;
    const all = [...this.plate.wet, ...this.plate.land];
    for (const t of all) {
      const p = isoToScreen(t.gx, t.gy);
      const y = p.y + this.drop;
      const edges: [number, number, number, number, number, number][] = [
        [0, -1, p.x, y - hh, p.x + hw, y],
        [1, 0, p.x + hw, y, p.x, y + hh],
        [0, 1, p.x, y + hh, p.x - hw, y],
        [-1, 0, p.x - hw, y, p.x, y - hh],
      ];
      for (const [dx, dy, x0, y0, x1, y1] of edges) {
        if (this.plate.has.has(key(t.gx + dx, t.gy + dy))) continue;
        if (this.hasTile(t.gx, t.gy) && (dx < 0 || dy < 0)) continue; // back edges of bare land: hidden by the land itself
        rim.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: 9, color: rimD, cap: 'round' });
        rim.moveTo(x0, y0 - 1).lineTo(x1, y1 - 1).stroke({ width: 5, color: rimC, cap: 'round' });
      }
    }
    this.lagoon.addChild(rim);
  }

  // ------------------------------------------------------------------ land
  private drawLand() {
    const g = this.land;
    const d = this.dim;
    const lk = this.look;
    const veil = this.sealed;
    const hw = TW / 2;
    const hh = TH / 2;
    const list = [...this.plate.land].sort((a, b) => a.gx + a.gy - (b.gx + b.gy) || a.gx - b.gx);
    const ink = veil ? 0x171317 : d.ink;
    const has = this.hasTile;
    for (const t of list) {
      const p = isoToScreen(t.gx, t.gy);
      let coast = false;
      for (const [dx, dy] of N4) if (!has(t.gx + dx, t.gy + dy)) coast = true;
      const alt = (t.gx + t.gy) % 2 === 1;
      let top = veil ? (alt ? VEIL.top : VEIL.topAlt) : coast ? d.beach : alt ? d.top : d.topAlt;
      let side = veil ? VEIL.side : d.side;
      let sideDark = veil ? VEIL.sideDark : d.sideDark;
      if (lk === 'clearing') {
        top = mixColor(top, DIRT, 0.55);
        side = mixColor(side, DIRT, 0.4);
        sideDark = mixColor(sideDark, DIRT, 0.3);
      }
      if (lk === 'available') top = mixColor(top, 0xfff3c4, 0.25);
      const inkS = { width: 3, color: ink, join: 'round' as const };
      const strata = veil ? 0x171317 : d.strata;
      const sa = veil ? 0.22 : d.id === 'home' || d.id === 'forest' ? 0.25 : 0.5;
      if (!has(t.gx + 1, t.gy)) {
        g.poly([p.x + hw, p.y, p.x, p.y + hh, p.x, p.y + hh + this.drop, p.x + hw, p.y + this.drop]).fill(sideDark).stroke(inkS);
        g.moveTo(p.x + hw, p.y + this.drop * 0.45).lineTo(p.x, p.y + hh + this.drop * 0.45).stroke({ width: 2, color: strata, alpha: sa });
      }
      if (!has(t.gx, t.gy + 1)) {
        g.poly([p.x - hw, p.y, p.x, p.y + hh, p.x, p.y + hh + this.drop, p.x - hw, p.y + this.drop]).fill(side).stroke(inkS);
        g.moveTo(p.x - hw, p.y + this.drop * 0.45).lineTo(p.x, p.y + hh + this.drop * 0.45).stroke({ width: 2, color: strata, alpha: sa * 0.85 });
      }
      g.poly([p.x, p.y - hh, p.x + hw, p.y, p.x, p.y + hh, p.x - hw, p.y]).fill(top);
      if (coast && !veil) {
        const inner = alt ? d.top : d.topAlt;
        const k = 0.5;
        const ox = (has(t.gx + 1, t.gy) ? 1 : 0) - (has(t.gx - 1, t.gy) ? 1 : 0);
        const oy = (has(t.gx, t.gy + 1) ? 1 : 0) - (has(t.gx, t.gy - 1) ? 1 : 0);
        const cx = p.x + (ox - oy) * hw * 0.25;
        const cy = p.y + (ox + oy) * hh * 0.25;
        g.poly([cx, cy - hh * k, cx + hw * k, cy, cx, cy + hh * k, cx - hw * k, cy]).fill({ color: lk === 'clearing' ? mixColor(inner, DIRT, 0.55) : inner, alpha: 0.9 });
      }
      const r = h2(t.gx, t.gy, 1);
      if (veil) {
        if ((t.gx * 7 + t.gy * 3) % 4 === 0) g.moveTo(p.x - 20, p.y + 7).lineTo(p.x + 20, p.y - 7).stroke({ width: 2, color: 0x171317, alpha: 0.18 });
      } else if (r < 0.35 && !coast && d.pattern !== 'hatch') {
        const tx = p.x + (h2(t.gx, t.gy, 2) - 0.5) * 50;
        const ty = p.y + (h2(t.gx, t.gy, 4) - 0.5) * 20;
        const tc = lk === 'clearing' ? shade(DIRT, 0.8) : d.tuft;
        g.moveTo(tx - 6, ty).lineTo(tx - 3, ty - 8).moveTo(tx, ty).lineTo(tx, ty - 10).moveTo(tx + 6, ty).lineTo(tx + 3, ty - 8).stroke({ width: 2.5, color: tc, cap: 'round', alpha: 0.85 });
      }
      const edges: [number, number, number, number, number, number][] = [
        [0, -1, p.x, p.y - hh, p.x + hw, p.y],
        [1, 0, p.x + hw, p.y, p.x, p.y + hh],
        [0, 1, p.x, p.y + hh, p.x - hw, p.y],
        [-1, 0, p.x - hw, p.y, p.x, p.y - hh],
      ];
      for (const [dx, dy, x0, y0, x1, y1] of edges) if (!has(t.gx + dx, t.gy + dy)) g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: 4, color: ink, cap: 'round' });
    }
  }

  private drawPattern() {
    if (this.sealed) return;
    const d = this.dim;
    const grassy = d.pattern === 'grass' || d.pattern === 'lush';
    const tiles = this.plate.land.filter((t) => {
      if (!grassy) return true;
      for (const [dx, dy] of N4) if (!this.hasTile(t.gx + dx, t.gy + dy)) return false;
      return true;
    });
    const hw = TW / 2;
    const hh = TH / 2;
    const alpha = this.look === 'clearing' ? 0.3 : d.patternAlpha;
    const frames = this.look === 'clearing' ? 1 : d.patternFrames;
    const mk = (tex: ReturnType<typeof patternTex>, a: number) => {
      const o = new Graphics();
      for (const t of tiles) {
        const p = isoToScreen(t.gx, t.gy);
        o.poly([p.x, p.y - hh, p.x + hw, p.y, p.x, p.y + hh, p.x - hw, p.y]).fill({ texture: tex, textureSpace: 'global', alpha: a });
      }
      return o;
    };
    for (let f = 0; f < frames; f++) {
      const o = mk(patternTex(d.pattern, f), alpha);
      o.visible = f === 0;
      this.over.addChild(o);
      this.pat.push(o);
    }
    if (d.pattern === 'lava' && this.look === 'open') {
      this.glow = mk(lavaGlowTex(), 0.7);
      this.glow.blendMode = 'add';
      this.over.addChild(this.glow);
    }
  }

  // ------------------------------------------------------------------ tick (cheap)
  tick(dt: number) {
    this.foamT += dt;
    if (this.foamT > 0.38 && this.foam.length === 2) {
      this.foamT = 0;
      this.foam[0].visible = !this.foam[0].visible;
      this.foam[1].visible = !this.foam[0].visible;
    }
    for (const f of this.falls) {
      if (!f.speed) continue;
      if (f.stepped) {
        f.acc += dt;
        if (f.acc >= 1 / 8) {
          f.s.tilePosition.y += f.speed * f.acc;
          f.acc = 0;
        }
      } else f.s.tilePosition.y += f.speed * dt;
    }
    for (const w of this.wisps) {
      w.s.x += w.v * dt;
      if (w.v > 0 && w.s.x > w.x1) w.s.x = w.x0;
      if (w.v < 0 && w.s.x < w.x0) w.s.x = w.x1;
    }
  }

  /** show frame i of a frame set (others hidden) */
  static frame(set: Graphics[], i: number) {
    if (!set.length) return;
    const k = ((i % set.length) + set.length) % set.length;
    set.forEach((o, j) => (o.visible = j === k));
  }
  /** crossfade between two frames of a set (t in 0..1) */
  static fade(set: Graphics[], t: number) {
    if (set.length < 2) return;
    set[0].visible = set[1].visible = true;
    set[0].alpha = 1;
    set[1].alpha = t;
  }
}
