/**
 * Parte II · Oleada 3 «La Era Astral» IN YOUR ISLAND'S WORLD — what the story put in the sky and on the island stays
 * there, derived from the save (a reload, a trip to the CARTA or the narrative reset land on the same picture):
 *
 *   SKY (screen space, drawn over the world but kept clear of the islands; a scene may bring one piece IN FRONT, at
 *   the place it frames, for its big moment). At rest the pieces that stay (rift, grieta) rise clear of the archipelago's top edge (ui/story/skyLine.ts) instead of hiding
 *   behind the far islands: they slide up out of the frame when the islands fill it (PULIDO 2026-10-10); the passing
 *   ones (tug, graffiti, lev, eye) do the same at rest and keep the place their scene frames while it holds them in
 *   front (MENORES 2026-10-10)
 *     rift      the seam opened a crack (b50 a): neon light through it and a chrome sign that buzzes «PUERTO COMETA»
 *     tug       H52 active after its scene: the Remolcadora crossing with a planetoid on a cable of light
 *     graffiti  H55 active after its scene: «NINGUNA CAJA ES HOGAR» and friends, sprayed in neon on the sky
 *     lev       H57 active after its scene: the Leviathan swimming upside down up there, in white chains
 *     grieta    H57 done: the astral rift that never closed — it breathes; through it, the edge of a page
 *   ISLAND (world space)
 *     seal      H53 active after its scene: a circle of runes breathing over the water by your faro
 *     vigil     Canelo sitting by the faro: staring at the seal (H53), and every night after it at the rock where
 *               sometimes nobody is (only he sees who). His walking self steps aside so there is one Canelo
 *     rock      after H53: the rock off your faro (the peñasco)
 *     maneki    H54 active after its scene: a cat with a bell sweeping star dust nobody else sees
 *     tag       after H55: a neon box with its door open, painted on your boat
 *
 * Mounted by app/oleada3Flow.ts on every island scene that has any Oleada 3 progress (Part I saves: never). Lives in
 * the island's own layers, found by label (`graded`), so nothing in IslandScene changes. The scenes (ui/story/o3Cines.ts)
 * drive its parameters through the island stage's registry (`{ drive: { id: 'o3:rift', to: 1, dur: 4 } }` — on the cine
 * clock: FPS-independent, paused with it, SALTAR lands on the end value) and its flourishes (`{ fx: { id: 'o3:shatter' } }`);
 * when a scene ends, every driven value goes back to what the save says.
 */
import { Container, Graphics, Text, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { game } from '../../core/App';
import { scenes } from '../../core/scenes';
import { settings } from '../../core/settings';
import { sfx } from '../../core/audio';
import { C, F } from '../theme';
import { poster, txt } from '../widgets';
import { onomatopoeia, sparkles } from '../../fx/juice';
import { IslandCat, preloadCats } from '../../art/catArt';
import { applyCatTint } from '../../art/tint';
import { catSlug } from '../../state/sys/forms';
import { G } from '../../state/game';
import { cineStage, runningCine } from '../../cine/registry';
import type { CineCtx, FxCmd } from '../../cine/types';
import { registerIslandDrive, registerIslandFx, registerIslandTarget } from '../../island/night/stage';
import { clockNight, type WorldSave } from '../../state/sys/worldState';
import { islandHour } from '../../island/night/clock';
import { costuraOpen } from '../../state/sys/rupturasO3';
import { motif } from '../../cine/sound';
import { SkyLine } from './skyLine';
import { clearTile, manekiTile, type ManekiArea } from './manekiSpot';
import { islandPlan } from '../../island/layout';
import { decorTiles, habitatTiles, nearestHabitatSpot, ownedRegions, staticBlocked } from '../../island/placement';
import { isoToScreen, TH, TW } from '../../island/iso';
import './o3Sound';

// ================================================================== the picture the save asks for (pure)
export interface O3SkyState {
  rift: number;
  tug: number;
  seal: number;
  vigil: 'seal' | 'rock' | null;
  rock: number;
  graffiti: number;
  lev: number;
  grieta: number;
  maneki: number;
  tag: number;
}
export const O3_SKY_NONE: Readonly<O3SkyState> = Object.freeze({ rift: 0, tug: 0, seal: 0, vigil: null, rock: 0, graffiti: 0, lev: 0, grieta: 0, maneki: 0, tag: 0 });

/** what the save says the sky and the island hold (night = the island's clock is at night). Pure. */
export function o3SkyState(s: WorldSave | null | undefined, night = false): O3SkyState {
  if (!s?.missions || !s.beatsSeen) return { ...O3_SKY_NONE };
  const act = (id: string) => s.missions.active.includes(id);
  const dn = (id: string) => s.missions.done.includes(id);
  const sn = (k: string) => s.beatsSeen.includes(k) || s.beatsSeen.includes(k.split('#')[0]);
  const seal = act('H53') && sn('b53_canelo#a') ? 1 : 0;
  return {
    rift: costuraOpen(s) ? 1 : 0,
    tug: act('H52') && sn('b52_estrella#a') ? 1 : 0,
    seal,
    vigil: seal ? 'seal' : dn('H53') && night ? 'rock' : null,
    rock: dn('H53') ? 1 : 0,
    graffiti: act('H55') && sn('b55_disruptores#a') ? 1 : 0,
    lev: act('H57') && sn('b57_leviatan#a') ? 1 : 0,
    grieta: dn('H57') ? 1 : 0,
    maneki: act('H54') && sn('b54_maneki#a') ? 1 : 0,
    tag: dn('H55') ? 1 : 0,
  };
}
/** the save reached La Era Astral (something of this wave may show) */
export const o3Reached = (s: WorldSave | null | undefined) => !!s?.missions && ['H50', 'H51', 'H52', 'H53', 'H54', 'H55', 'H56', 'H57'].some((id) => s.missions.active.includes(id) || s.missions.done.includes(id));

// ================================================================== small drawing helpers
const TAU = Math.PI * 2;
const clamp01 = (k: number) => (k <= 0 ? 0 : k >= 1 ? 1 : k);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeOut = (k: number) => 1 - (1 - k) * (1 - k) * (1 - k);
const hash = (i: number) => {
  const n = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
};
/** a soft additive glow (concentric discs) */
function glow(r: number, color: number, a = 0.5, rings = 7) {
  const g = new Graphics();
  for (let i = rings; i >= 1; i--) g.circle(0, 0, (r * i) / rings).fill({ color, alpha: (a / rings) * 1.15 });
  g.blendMode = 'add';
  return g;
}
/** neon text: an ink-stroked word + an additive copy that hums */
function neon(text: string, o: { font?: string; size?: number; color: number; stroke?: number; letter?: number }) {
  const c = new Container();
  const style = { fontFamily: o.font ?? F.poster, fontSize: o.size ?? 40, fill: o.color, letterSpacing: o.letter ?? 2, padding: 14 };
  const base = txt(text, { ...style, stroke: { color: C.ink, width: o.stroke ?? 6, join: 'round' } }) as Text;
  base.anchor.set(0.5);
  const hum = txt(text, { ...style, stroke: { color: o.color, width: (o.stroke ?? 6) + 6, join: 'round' } }) as Text;
  hum.anchor.set(0.5);
  hum.blendMode = 'add';
  hum.alpha = 0.45;
  c.addChild(hum, base);
  return { c, base, hum };
}
/** a four-point star */
function star4(g: Graphics, x: number, y: number, r: number, color: number, alpha = 1) {
  g.poly([x, y - r, x + r * 0.22, y - r * 0.22, x + r, y, x + r * 0.22, y + r * 0.22, x, y + r, x - r * 0.22, y + r * 0.22, x - r, y, x - r * 0.22, y - r * 0.22]).fill({ color, alpha });
}
/** the buzz of a neon tube: mostly lit, now and then it stutters (deterministic in t) */
const buzz = (t: number, seed = 0) => (Math.sin(t * 37.1 + seed) * Math.sin(t * 13.3 + seed * 2) > 0.86 ? 0.35 : 1);

// ================================================================== SKY · the neon seam (H50)
class Rift {
  readonly root = new Container();
  private glowP = glow(420, 0xff5ce1, 0.32);
  private glowC = glow(330, 0x4ff2ff, 0.2);
  private lens = new Graphics();
  private rim = new Graphics();
  private inner = new Container();
  private mask = new Graphics();
  private sign = new Container();
  private signWords: ReturnType<typeof neon>[] = [];
  private k = -1;
  private readonly W = 680;
  private readonly HH = 190;
  constructor() {
    this.glowP.scale.set(1, 0.42);
    this.glowC.scale.set(1, 0.36);
    const stars = new Graphics();
    for (let i = 0; i < 46; i++) stars.circle((hash(i) - 0.5) * this.W * 0.95, (hash(i + 70) - 0.5) * this.HH * 0.9, hash(i + 140) < 0.2 ? 2.4 : 1.3).fill({ color: 0xeef2ff, alpha: 0.6 + hash(i + 9) * 0.4 });
    for (let i = 0; i < 4; i++) star4(stars, (hash(i + 300) - 0.5) * this.W * 0.8, (hash(i + 400) - 0.5) * this.HH * 0.6, 7, 0xffe7ff, 0.9);
    // the chrome sign hanging inside the crack, two cables up to the edge
    const plate = new Graphics()
      .moveTo(-120, -64)
      .lineTo(-120, -40)
      .moveTo(120, -64)
      .lineTo(120, -40)
      .stroke({ width: 3, color: 0x9aa6c0 })
      .roundRect(-188 + 6, -44 + 6, 376, 100, 20)
      .fill({ color: C.ink, alpha: 0.6 })
      .roundRect(-188, -44, 376, 100, 20)
      .fill(0xc9d3e6)
      .stroke({ width: 5, color: C.ink })
      .rect(-176, -34, 352, 14)
      .fill({ color: 0xffffff, alpha: 0.45 });
    for (const [x, y] of [[-172, -28], [172, -28], [-172, 44], [172, 44]]) plate.circle(x, y, 4).fill(0x5a6680);
    const title = neon('PUERTO COMETA', { size: 46, color: 0xff4fd8, letter: 4 });
    title.c.position.set(0, 0);
    const sub = neon('SE ACEPTAN NAVES · NO SE FÍA', { font: F.ui, size: 15, color: 0x4ff2ff, stroke: 4, letter: 2 });
    sub.c.position.set(0, 36);
    this.signWords = [title, sub];
    this.sign.addChild(plate, title.c, sub.c);
    this.sign.scale.set(0.78);
    this.inner.addChild(stars, this.sign);
    this.inner.addChild(this.mask);
    this.inner.mask = this.mask;
    this.rim.blendMode = 'add';
    this.root.addChild(this.glowP, this.glowC, this.lens, this.inner, this.rim);
  }
  private draw(k: number) {
    const N = 26;
    const top: number[] = [];
    const bot: number[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const x = -this.W / 2 + this.W * u;
      const e = Math.pow(Math.sin(Math.PI * u), 0.85);
      const j1 = (hash(i) - 0.5) * 16 * e;
      const j2 = (hash(i + 50) - 0.5) * 16 * e;
      top.push(x, -(this.HH / 2) * k * e + j1 * k);
      bot.push(x, (this.HH / 2) * k * e + j2 * k);
    }
    const pts = [...top];
    for (let i = bot.length - 2; i >= 0; i -= 2) pts.push(bot[i], bot[i + 1]);
    this.lens.clear();
    this.mask.clear();
    this.rim.clear();
    if (k < 0.02) {
      // still a stitched seam: a thin dark line with its stitches
      this.lens.moveTo(-this.W / 2, 0).lineTo(this.W / 2, 0).stroke({ width: 4, color: 0x2a1f4a, alpha: 0.7 });
      for (let i = 1; i < 14; i++) {
        const x = -this.W / 2 + (this.W * i) / 14;
        this.lens.moveTo(x - 6, -9).lineTo(x + 6, 9).stroke({ width: 3, color: 0x2a1f4a, alpha: 0.7 });
      }
      return;
    }
    this.lens.poly(pts).fill(0x0a0722).stroke({ width: 5, color: C.ink, alpha: 0.85 });
    this.mask.poly(pts).fill(0xffffff);
    this.rim.poly(pts).stroke({ width: 4, color: 0xff6fe0, alpha: 0.85 });
    this.rim.poly(pts).stroke({ width: 12, color: 0xff6fe0, alpha: 0.18 });
    // the stitches the seam had, torn: little threads hanging from both lips
    for (let i = 2; i < N - 1; i += 2) {
      const tx = top[i * 2];
      const ty = top[i * 2 + 1];
      const by = bot[i * 2 + 1];
      this.lens.moveTo(tx, ty).lineTo(tx + 4, ty + 10 + hash(i) * 8).stroke({ width: 2, color: 0x2a1f4a, alpha: 0.8 });
      this.lens.moveTo(tx, by).lineTo(tx - 4, by - 10 - hash(i + 3) * 8).stroke({ width: 2, color: 0x2a1f4a, alpha: 0.8 });
    }
  }
  update(t: number, k: number, signK: number) {
    if (Math.abs(k - this.k) > 0.003) {
      this.k = k;
      this.draw(k);
    }
    const rm = settings.reduceMotion;
    const breathe = rm ? 1 : 0.92 + 0.08 * Math.sin(t * 1.3);
    this.glowP.alpha = k * breathe;
    this.glowC.alpha = k * 0.8 * (rm ? 1 : 0.9 + 0.1 * Math.sin(t * 0.9 + 1));
    this.rim.alpha = k;
    this.sign.alpha = signK * (rm ? 1 : buzz(t));
    this.signWords[0].hum.alpha = 0.45 * buzz(t + 0.7, 3);
    this.signWords[1].hum.alpha = 0.5 * buzz(t + 1.9, 7);
    this.sign.position.set(0, k * 8 + (rm ? 0 : Math.sin(t * 0.8) * 3));
    this.sign.rotation = rm ? 0 : Math.sin(t * 0.6) * 0.02;
  }
}

// ================================================================== SKY · the Remolcadora (H52)
class Tug {
  readonly root = new Container();
  private ship = new Container();
  private planet = new Container();
  private cable = new Graphics();
  private beads = new Graphics();
  private thrust = glow(46, 0xff5ce1, 0.6);
  constructor() {
    // the planetoid: violet rock, craters, a thin ring
    const pg = new Graphics();
    pg.ellipse(0, 0, 118, 26).stroke({ width: 5, color: 0xd8c8ff, alpha: 0.8 });
    pg.circle(0, 0, 76).fill(0x8a7fb0).stroke({ width: 6, color: C.ink });
    for (let i = 0; i < 7; i++) pg.circle((hash(i) - 0.5) * 90, (hash(i + 9) - 0.5) * 90, 6 + hash(i + 3) * 12).fill({ color: 0x5f557f, alpha: 0.9 });
    pg.circle(-22, -26, 20).fill({ color: 0xffffff, alpha: 0.14 });
    const ringFront = new Graphics().arc(0, 0, 118, 0.15, Math.PI - 0.15).stroke({ width: 5, color: 0xd8c8ff });
    ringFront.scale.set(1, 0.22);
    this.planet.addChild(glow(130, 0xb79cff, 0.25), pg, ringFront);
    // the tug: boxy, hazard stripes, a cabin with a round window, a tow bar at the stern
    const s = new Graphics();
    s.poly([-110, -10, 70, -10, 96, 8, 96, 38, -96, 38, -118, 16]).fill(0x3b4a6b).stroke({ width: 6, color: C.ink });
    for (let i = 0; i < 9; i++) s.poly([-92 + i * 20, 24, -82 + i * 20, 24, -92 + i * 20, 38, -102 + i * 20, 38]).fill(i % 2 ? C.ink : 0xffc94a);
    s.roundRect(-40, -52, 70, 44, 8).fill(0xc9d3e6).stroke({ width: 5, color: C.ink });
    s.circle(-6, -30, 11).fill(0x4ff2ff).stroke({ width: 4, color: C.ink });
    s.rect(-30, -70, 8, 20).fill(0x9aa6c0).stroke({ width: 3, color: C.ink });
    s.rect(96, 14, 22, 12).fill(0x9aa6c0).stroke({ width: 3, color: C.ink });
    const name = txt('LA REMOLCADORA', { fontFamily: F.ui, fontWeight: '700', fontSize: 12, fill: 0xeef2ff, letterSpacing: 1 }) as Text;
    name.anchor.set(0.5);
    name.position.set(-6, 6);
    this.thrust.scale.set(1.2, 0.6);
    this.thrust.position.set(-120, 14);
    this.ship.addChild(this.thrust, s, name);
    this.cable.blendMode = 'add';
    this.beads.blendMode = 'add';
    this.root.addChild(this.cable, this.beads, this.planet, this.ship);
  }
  /** u: 0 enters from the right … 1 gone off the left · big: in front of the islands (a scene's close look) */
  update(t: number, u: number, v: { x: number; y: number; w: number; h: number }, big = false) {
    const rm = settings.reduceMotion;
    const sc = (v.w / 1920) * (big ? 1.55 : 0.85);
    this.root.scale.set(sc);
    this.root.position.set(v.x + v.w * lerp(1.18, -0.3, u), v.y + v.h * (big ? 0.22 : 0.18) + (rm ? 0 : Math.sin(t * 0.7) * 10));
    this.ship.position.set(0, 0);
    this.ship.rotation = rm ? 0 : Math.sin(t * 0.9) * 0.03;
    const px = 360;
    const py = 70 + (rm ? 0 : Math.sin(t * 0.5 + 1) * 16);
    this.planet.position.set(px, py);
    this.planet.rotation = t * 0.05;
    this.thrust.alpha = 0.7 + (rm ? 0 : 0.3 * Math.sin(t * 17));
    // the cable of light (violet and gold, like the one that pushed the Estrella): it sags and hums
    const sx = 118;
    const sy = 20;
    const tx = px - 70;
    const ty = py - 6;
    const sag = 40 + (rm ? 0 : Math.sin(t * 1.7) * 10);
    const mx = (sx + tx) / 2;
    const my = (sy + ty) / 2 + sag;
    this.cable.clear();
    this.cable.moveTo(sx, sy).quadraticCurveTo(mx, my, tx, ty).stroke({ width: 16, color: 0xb79cff, alpha: 0.28 });
    this.cable.moveTo(sx, sy).quadraticCurveTo(mx, my, tx, ty).stroke({ width: 4, color: 0xffe7a0, alpha: 0.95 });
    this.beads.clear();
    for (let i = 0; i < 6; i++) {
      const k = (t * 0.45 + i / 6) % 1;
      const bx = (1 - k) * (1 - k) * sx + 2 * (1 - k) * k * mx + k * k * tx;
      const by = (1 - k) * (1 - k) * sy + 2 * (1 - k) * k * my + k * k * ty;
      this.beads.circle(bx, by, 5).fill({ color: 0xfff4c8, alpha: 0.85 });
    }
  }
}

// ================================================================== SKY · the graffiti (H55)
interface Tag {
  c: Container;
  mask: Graphics;
  w: number;
  h: number;
  fx: number;
  fy: number;
  rot: number;
}
class Graffiti {
  readonly root = new Container();
  private tags: Tag[] = [];
  private k = -1;
  constructor() {
    const add = (c: Container, w: number, h: number, fx: number, fy: number, rot: number) => {
      const mask = new Graphics();
      c.addChild(mask);
      c.mask = mask;
      c.rotation = rot;
      this.root.addChild(c);
      this.tags.push({ c, mask, w, h, fx, fy, rot });
    };
    const word = (text: string, o: Parameters<typeof neon>[1], fx: number, fy: number, rot: number, drips = 0) => {
      const n = neon(text, o);
      const c = new Container();
      c.addChild(n.c);
      const w = n.base.width;
      const h = n.base.height;
      const d = new Graphics();
      for (let i = 0; i < drips; i++) {
        const x = -w / 2 + w * (0.1 + 0.8 * hash(i + fx * 100));
        const L = 18 + hash(i + 7) * 40;
        d.roundRect(x - 3, h * 0.25, 6, L, 3).fill(o.color).circle(x, h * 0.25 + L, 5).fill(o.color);
      }
      c.addChildAt(d, 0);
      add(c, w, h + 70, fx, fy, rot);
    };
    word('NINGUNA CAJA ES HOGAR', { font: F.brush, size: 66, color: 0xff3fd8, stroke: 7, letter: 1 }, 0.5, 0.13, -0.05, 5);
    word('DISRUPTORES', { font: F.glitch, size: 44, color: 0x4ff2ff, stroke: 6 }, 0.18, 0.25, 0.09, 2);
    word('¡ABRAN!', { font: F.comic, size: 58, color: 0xd6ff3f, stroke: 7 }, 0.84, 0.25, 0.12, 3);
    // a box with its door kicked open (their tag), and an arrow pointing out of it
    const box = new Container();
    const g = new Graphics();
    g.rect(-46, -40, 92, 80).stroke({ width: 16, color: 0xffc94a, alpha: 0.3 });
    g.rect(-46, -40, 92, 80).stroke({ width: 6, color: 0xffc94a });
    g.poly([46, -40, 96, -70, 96, 10, 46, 40]).stroke({ width: 6, color: 0xffc94a });
    g.moveTo(-10, 0).lineTo(150, -20).stroke({ width: 6, color: 0xff3fd8 });
    g.poly([150, -20, 128, -36, 132, -6]).fill(0xff3fd8);
    g.blendMode = 'add';
    box.addChild(g);
    add(box, 260, 160, 0.68, 0.36, -0.08);
  }
  /** `lift(i, x, y, half, below)`: the y that keeps tag i clear of the islands (o3Sky.settle) */
  update(t: number, k: number, v: { x: number; y: number; w: number; h: number }, lift?: (i: number, x: number, y: number, half: number, below: number) => number) {
    const rm = settings.reduceMotion;
    const n = this.tags.length;
    const redraw = Math.abs(k - this.k) > 0.002;
    this.tags.forEach((tg, i) => {
      tg.c.position.set(v.x + v.w * tg.fx + (rm ? 0 : Math.sin(t * 0.4 + i) * 6), v.y + v.h * tg.fy + (rm ? 0 : Math.cos(t * 0.33 + i * 2) * 5));
      if (lift) tg.c.y = lift(i, tg.c.x, tg.c.y, tg.w / 2 + 20, tg.h / 2 + 30);
      tg.c.alpha = buzz(t + i * 3.1, i) > 0.5 ? 1 : 0.75;
      if (!redraw) return;
      const kk = clamp01(k * n - i);
      tg.mask.clear();
      if (kk > 0) tg.mask.rect(-tg.w / 2 - 20, -tg.h / 2 - 20, (tg.w + 40) * kk, tg.h + 60).fill(0xffffff);
    });
    if (redraw) this.k = k;
  }
}

/** the Disruptores' ship: paint cans tied together, Brecha hanging upside down from the mast */
class CanShip {
  readonly root = new Container();
  private brecha: IslandCat | null = null;
  constructor() {
    const g = new Graphics();
    const cols = [0xff3fd8, 0x4ff2ff, 0xd6ff3f, 0xffc94a, 0xb79cff];
    cols.forEach((c, i) => {
      const x = -130 + i * 56;
      g.rect(x - 24, -34, 48, 66).fill(c).stroke({ width: 5, color: C.ink });
      g.ellipse(x, -34, 24, 8).fill(0xe6e6ee).stroke({ width: 4, color: C.ink });
      g.rect(x - 24, -14, 48, 16).fill({ color: 0xffffff, alpha: 0.55 });
      g.roundRect(x - 4 + (i % 2 ? 10 : -6), 30, 7, 14 + i * 3, 3).fill(c);
    });
    g.rect(-6, -170, 10, 140).fill(0x6b4a2b).stroke({ width: 4, color: C.ink });
    g.rect(-70, -158, 150, 8).fill(0x6b4a2b).stroke({ width: 3, color: C.ink });
    g.poly([4, -150, 92, -96, 4, -60]).fill(0xf2e6d8).stroke({ width: 4, color: C.ink });
    g.circle(42, -100, 12).stroke({ width: 4, color: 0xff3fd8 });
    this.root.addChild(g);
    const slug = 'brecha_crowbar_cat';
    void preloadCats([slug]).then(() => {
      if (this.root.destroyed) return;
      const cat = new IslandCat(slug, 92);
      const hold = new Container();
      hold.addChild(cat);
      hold.scale.set(1, -1);
      hold.position.set(-58, -150);
      this.root.addChild(hold);
      this.brecha = cat;
    });
  }
  update(t: number, u: number, v: { x: number; y: number; w: number; h: number }) {
    const rm = settings.reduceMotion;
    this.root.position.set(v.x + v.w * lerp(1.2, -0.25, u), v.y + v.h * 0.33 + (rm ? 0 : Math.sin(t * 1.1) * 8));
    this.root.rotation = rm ? 0 : Math.sin(t * 0.8) * 0.04;
    if (this.brecha) this.brecha.rotation = rm ? 0 : Math.sin(t * 2.2) * 0.12;
  }
}

// ================================================================== SKY · the Leviathan (H57)
class Leviathan {
  readonly root = new Container();
  private body = new Container();
  private tail = new Graphics();
  private chains = new Container();
  private links: { g: Container; vx: number; vy: number; vr: number }[] = [];
  private broke = 0;
  /** 0 = the scene's close look … 1 = resting small up there (eased: handing it back doesn't jump) */
  private far = -1;
  constructor() {
    const B = 0xeee3c8;
    const g = new Graphics();
    // upside down: the throat pleats face the sky, the bone ridge points down
    for (let i = 0; i < 14; i++) {
      const x = -250 + i * 34;
      g.poly([x - 12, 96, x, 150 + hash(i) * 26, x + 12, 96]).fill(0xd8ccb0).stroke({ width: 4, color: C.ink });
    }
    g.ellipse(0, 0, 330, 116).fill(B).stroke({ width: 8, color: C.ink });
    for (let i = 0; i < 9; i++) g.moveTo(-300 + i * 12, -40 - i * 4).quadraticCurveTo(-140, -110 + i * 6, 40 + i * 14, -96 + i * 2).stroke({ width: 3, color: 0xb9ad8f });
    // it was a ship once: planks and portholes along its flank
    for (let i = 0; i < 4; i++) g.moveTo(-230, 18 + i * 18).quadraticCurveTo(0, 30 + i * 20, 250, 12 + i * 16).stroke({ width: 3, color: 0x9c8f72 });
    for (let i = 0; i < 6; i++) g.circle(-150 + i * 62, 36, 13).fill(0x1c2a33).stroke({ width: 4, color: C.ink });
    for (let i = 0; i < 10; i++) g.circle(-260 + hash(i) * 480, -30 + hash(i + 4) * 90, 4 + hash(i + 8) * 6).fill({ color: 0xcfc3a5 }).stroke({ width: 2, color: 0x8a7f66 });
    // the head (left): a jaw line and an eye that is closed for now
    g.moveTo(-326, 8).quadraticCurveTo(-250, 46, -170, 40).stroke({ width: 6, color: C.ink });
    g.moveTo(-262, -18).quadraticCurveTo(-246, -8, -230, -18).stroke({ width: 5, color: C.ink });
    this.tail.poly([0, 0, 70, -70, 120, -60, 50, 0, 120, 60, 70, 70]).fill(B).stroke({ width: 7, color: C.ink });
    this.tail.position.set(318, 4);
    this.body.addChild(this.tail, g);
    // white chains: orders written on them
    const orders = ['CORRIGE ESE MAR', 'CORRIGE', 'ORDEN: NO FLOTAR', 'CORRIGE ESE MAR'];
    const bands = [
      [-220, -140, -120, 150],
      [-40, -150, 50, 150],
      [130, -140, 210, 140],
    ];
    bands.forEach(([x0, y0, x1, y1], b) => {
      const n = 11;
      for (let i = 0; i <= n; i++) {
        const k = i / n;
        const l = new Graphics();
        const vert = i % 2 === 0;
        l.ellipse(0, 0, vert ? 9 : 16, vert ? 16 : 9).stroke({ width: 6, color: 0xf7f7fb });
        l.ellipse(0, 0, vert ? 9 : 16, vert ? 16 : 9).stroke({ width: 2, color: 0x7d7d8c });
        l.position.set(lerp(x0, x1, k), lerp(y0, y1, k));
        this.chains.addChild(l);
        this.links.push({ g: l, vx: (hash(i + b * 20) - 0.5) * 300, vy: -80 - hash(i + b * 30) * 220, vr: (hash(i + b * 9) - 0.5) * 6 });
      }
      const tag = new Container();
      tag.addChild(new Graphics().rect(-62, -14, 124, 28).fill(0xfbf6ea).stroke({ width: 3, color: C.ink }));
      const tt = txt(orders[b], { fontFamily: F.ui, fontWeight: '700', fontSize: 11, fill: C.ink }) as Text;
      tt.anchor.set(0.5);
      tag.addChild(tt);
      tag.position.set(lerp(x0, x1, 0.62) + 28, lerp(y0, y1, 0.62) + 10);
      tag.rotation = 0.2 - b * 0.12;
      this.chains.addChild(tag);
      this.links.push({ g: tag, vx: (hash(b + 50) - 0.5) * 260, vy: -160, vr: (hash(b + 60) - 0.5) * 4 });
    });
    this.body.addChild(this.chains);
    this.root.addChild(this.body);
  }
  /** rise: 0 = under the archipelago … 1 = up in the sky · chains: 1 bound … 0 broken (they fly off) */
  update(t: number, dt: number, rise: number, chains: number, v: { x: number; y: number; w: number; h: number }, small: boolean) {
    const rm = settings.reduceMotion;
    const e = easeOut(clamp01(rise));
    const want = small ? 1 : 0;
    this.far = this.far < 0 || rm ? want : this.far + (want - this.far) * Math.min(1, dt * 1.6);
    const f = this.far;
    const sc = lerp(0.95, 0.5, f) * (v.w / 1920);
    this.root.scale.set(sc);
    // at rest it swims on the left of the sky: the rift's sign (0.66) stays clear (MENORES 2026-10-10)
    const x = v.x + v.w * lerp(0.52, 0.3, f) + (rm ? 0 : Math.sin(t * 0.13) * v.w * 0.03);
    const y = lerp(v.y + v.h * 1.4, v.y + v.h * lerp(0.26, 0.14, f), e) + (rm ? 0 : Math.sin(t * 0.6) * 8);
    this.root.position.set(x, y);
    this.root.rotation = lerp(-0.42, -0.04, e) + (rm ? 0 : Math.sin(t * 0.4) * 0.02);
    this.tail.rotation = rm ? 0 : Math.sin(t * 1.2) * 0.18;
    // the chains: bound, or flying apart (driven down to 0 once, they stay broken)
    if (chains < 0.999 && this.broke < 1) this.broke = Math.min(1, this.broke + dt / 1.6);
    if (chains >= 0.999) this.broke = 0;
    const b = this.broke;
    this.links.forEach((l, i) => {
      if (b <= 0) {
        l.g.alpha = 1;
        return;
      }
      const tt = b * 1.6;
      l.g.alpha = 1 - b;
      l.g.x += l.vx * dt * (1 - b);
      l.g.y += (l.vy + 260 * tt) * dt * (1 - b);
      l.g.rotation += l.vr * dt;
      void i;
    });
    this.chains.visible = b < 1;
  }
}

// ================================================================== SKY · the eye (H57 b)
class Eye {
  readonly root = new Container();
  private iris = new Container();
  private lidMask = new Graphics();
  private lids = new Graphics();
  private open = -1;
  private blink = 1;
  constructor() {
    const skin = new Graphics();
    skin.ellipse(0, 0, 330, 190).fill(0xb9ad96).stroke({ width: 9, color: C.ink });
    for (let i = 0; i < 6; i++) skin.arc(0, 0, 220 + i * 18, Math.PI * 1.1 + i * 0.03, Math.PI * 1.9 - i * 0.03).stroke({ width: 3, color: 0x8a7f6a });
    for (let i = 0; i < 6; i++) skin.arc(0, 0, 220 + i * 18, Math.PI * 0.1 + i * 0.03, Math.PI * 0.9 - i * 0.03).stroke({ width: 3, color: 0x8a7f6a });
    const ball = new Container();
    const sclera = new Graphics().ellipse(0, 0, 230, 112).fill(0xf6eedb);
    const ig = new Graphics();
    ig.circle(0, 0, 96).fill(0x1f6f78).stroke({ width: 8, color: 0xd8b24a });
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * TAU;
      ig.moveTo(Math.cos(a) * 46, Math.sin(a) * 46).lineTo(Math.cos(a) * 90, Math.sin(a) * 90).stroke({ width: 3, color: 0x3fa3a8, alpha: 0.7 });
    }
    ig.circle(0, 0, 44).fill(0x07121a);
    ig.circle(-30, -32, 16).fill({ color: 0xffffff, alpha: 0.9 });
    ig.circle(24, 26, 6).fill({ color: 0xffffff, alpha: 0.6 });
    this.iris.addChild(ig);
    ball.addChild(sclera, this.iris, this.lidMask);
    ball.mask = this.lidMask;
    this.root.addChild(glow(360, 0x9fe8ff, 0.22), skin, ball, this.lids);
  }
  private draw(k: number) {
    const ry = 112 * k;
    this.lidMask.clear().ellipse(0, 0, 230, Math.max(0.5, ry)).fill(0xffffff);
    this.lids.clear();
    this.lids.ellipse(0, 0, 232, Math.max(1, ry)).stroke({ width: 9, color: C.ink });
    // lashes of bone
    for (let i = 0; i < 9; i++) {
      const x = -180 + i * 45;
      const y = -ry * Math.sqrt(Math.max(0, 1 - (x / 232) ** 2));
      this.lids.moveTo(x, y).lineTo(x - 6, y - 20 - k * 10).stroke({ width: 5, color: C.ink });
    }
  }
  doBlink(rm: boolean) {
    if (rm) return;
    gsap.killTweensOf(this);
    gsap.to(this, { blink: 0, duration: 0.16, ease: 'power2.in', yoyo: true, repeat: 1 });
  }
  update(t: number, k: number, v: { x: number; y: number; w: number; h: number }) {
    const rm = settings.reduceMotion;
    const kk = clamp01(k) * this.blink;
    if (Math.abs(kk - this.open) > 0.002) {
      this.open = kk;
      this.draw(kk);
    }
    this.root.scale.set((v.w / 1920) * 1.45);
    this.root.position.set(v.x + v.w * 0.5, v.y + v.h * 0.3 + (rm ? 0 : Math.sin(t * 0.5) * 6));
    // it looks DOWN at your island, and drifts a little like something breathing
    this.iris.position.set(rm ? -10 : -10 + Math.sin(t * 0.37) * 10, 26 + (rm ? 0 : Math.sin(t * 0.29) * 4));
    this.root.alpha = smooth(0, 0.15, k);
  }
}

// ================================================================== SKY · the rift that stayed open (H57 c)
class Grieta {
  readonly root = new Container();
  private glowA = glow(260, 0x9fe8ff, 0.3);
  private glowB = glow(200, 0xb79cff, 0.3);
  private tear = new Graphics();
  private rim = new Graphics();
  private inside = new Container();
  private mask = new Graphics();
  private page = new Container();
  private w = -1;
  private readonly HH = 380;
  constructor() {
    this.glowA.scale.set(0.6, 1.25);
    this.glowB.scale.set(0.45, 1.1);
    const st = new Graphics();
    for (let i = 0; i < 40; i++) st.circle((hash(i + 500) - 0.5) * 200, (hash(i + 600) - 0.5) * this.HH, hash(i) < 0.2 ? 2.4 : 1.3).fill({ color: 0xeef2ff, alpha: 0.8 });
    // the other side: the edge of a page (deckled, ruled, a red margin line), far away
    const pg = new Graphics();
    pg.rect(8, -150, 220, 300).fill(0xf3ead6);
    for (let i = 0; i < 11; i++) pg.moveTo(8, -128 + i * 26).lineTo(228, -128 + i * 26).stroke({ width: 2, color: 0x9fb4c8, alpha: 0.8 });
    pg.moveTo(40, -150).lineTo(40, 150).stroke({ width: 3, color: 0xc8102e, alpha: 0.6 });
    const edge: number[] = [];
    for (let i = 0; i <= 20; i++) edge.push(8 + (hash(i + 900) - 0.5) * 10, -150 + i * 15);
    pg.poly([0, -160, ...edge, 0, 160], false).stroke({ width: 4, color: 0x8a7f6a });
    this.page.addChild(pg);
    this.page.position.set(-30, 0);
    this.inside.addChild(new Graphics().rect(-200, -this.HH / 2 - 20, 400, this.HH + 40).fill(0x05031a), st, this.page, this.mask);
    this.inside.mask = this.mask;
    this.rim.blendMode = 'add';
    this.root.addChild(this.glowA, this.glowB, this.tear, this.inside, this.rim);
  }
  private draw(w: number) {
    const N = 22;
    const L: number[] = [];
    const R: number[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const y = -this.HH / 2 + this.HH * u;
      const e = Math.pow(Math.sin(Math.PI * u), 0.7);
      L.push(-w * e + (hash(i + 1000) - 0.5) * 12 * e, y);
      R.push(w * e + (hash(i + 1100) - 0.5) * 12 * e, y);
    }
    const pts = [...L];
    for (let i = R.length - 2; i >= 0; i -= 2) pts.push(R[i], R[i + 1]);
    this.tear.clear();
    this.mask.clear();
    this.rim.clear();
    if (w < 1) return;
    this.tear.poly(pts).fill(0x05031a).stroke({ width: 6, color: C.ink });
    this.mask.poly(pts).fill(0xffffff);
    this.rim.poly(pts).stroke({ width: 5, color: 0x9fe8ff, alpha: 0.9 });
    this.rim.poly(pts).stroke({ width: 16, color: 0xb79cff, alpha: 0.22 });
  }
  update(t: number, k: number, pageK: number, v: { x: number; y: number; w: number; h: number }, small: boolean) {
    const rm = settings.reduceMotion;
    const breath = rm ? 1 : 1 + 0.09 * Math.sin(t * 0.75);
    const w = Math.round(104 * clamp01(k) * breath * 2) / 2;
    if (Math.abs(w - this.w) >= 0.5) {
      this.w = w;
      this.draw(w);
    }
    this.root.scale.set((v.w / 1920) * (small ? 0.7 : 1));
    this.root.position.set(v.x + v.w * (small ? 0.2 : 0.62), v.y + v.h * (small ? 0.16 : 0.24));
    this.root.rotation = 0.08;
    this.glowA.alpha = k * (rm ? 1 : 0.85 + 0.15 * Math.sin(t * 0.75));
    this.glowB.alpha = k;
    this.page.alpha = pageK;
    this.page.x = -30 + (rm ? 0 : Math.sin(t * 0.21) * 6);
  }
}

// ================================================================== ISLAND · the seal (H53)
class Seal {
  readonly root = new Container();
  private aura = glow(190, 0x8a5cff, 0.55);
  private disc = new Graphics();
  private runes = new Container();
  private star = new Graphics();
  private cracks = new Graphics();
  private crackN = -1;
  private shards: { g: Graphics; vx: number; vy: number; vr: number }[] = [];
  private shardT = -1;
  private ring = new Graphics();
  constructor() {
    const R = 120;
    this.disc.circle(0, 0, R + 26).fill({ color: 0x8a5cff, alpha: 0.12 });
    this.disc.circle(0, 0, R).fill({ color: 0x1d1440, alpha: 0.86 }).stroke({ width: 10, color: 0xc77dff });
    this.disc.circle(0, 0, R - 40).stroke({ width: 2, color: 0xf2e6ff, alpha: 0.7 });
    const rg = new Graphics();
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * TAU;
      const x = Math.cos(a) * (R - 22);
      const y = Math.sin(a) * (R - 22);
      if (k % 2) rg.poly([x, y - 9, x + 6, y, x, y + 9, x - 6, y]).fill(0xf2e6ff);
      else rg.rect(x - 2, y - 7, 4, 14).fill({ color: 0xc77dff, alpha: 0.95 });
    }
    this.runes.addChild(rg);
    star4(this.star, 0, 0, 46, 0xf2e6ff, 0.9);
    this.ring.blendMode = 'add';
    this.root.addChild(this.aura, this.disc, this.runes, this.star, this.cracks, this.ring);
  }
  private drawCracks(n: number) {
    const R = 120;
    const paths = [
      [-10, -R, 20, -60, -15, 10],
      [R, 10, 70, 25, 10, 5],
      [-R * 0.7, R * 0.7, -40, 60, 5, 10, 40, R * 0.9],
      [-R, -20, -50, -30, -10, -10],
    ];
    this.cracks.clear();
    for (let k = 0; k < Math.min(n, 3); k++) {
      this.cracks.poly(paths[k], false).stroke({ width: 10, color: C.ink });
      this.cracks.poly(paths[k], false).stroke({ width: 5, color: 0xffffff });
    }
    if (n >= 3) this.cracks.poly(paths[3], false).stroke({ width: 5, color: 0xffffff });
  }
  /** the egg breaks: shards fly, a ring of light, nothing left (it doesn't come back in this scene) */
  shatter(rm: boolean) {
    if (this.shardT >= 0) return;
    this.shardT = 0;
    this.disc.visible = this.runes.visible = this.star.visible = this.cracks.visible = false;
    const n = rm ? 8 : 20;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TAU;
      const a1 = ((i + 1) / n) * TAU;
      const r = 120;
      const g = new Graphics()
        .poly([0, 0, Math.cos(a0) * r, Math.sin(a0) * r, Math.cos((a0 + a1) / 2) * r * 1.05, Math.sin((a0 + a1) / 2) * r * 1.05, Math.cos(a1) * r, Math.sin(a1) * r])
        .fill(0x2a1d5a)
        .stroke({ width: 5, color: 0xc77dff });
      g.pivot.set(Math.cos((a0 + a1) / 2) * 60, Math.sin((a0 + a1) / 2) * 60);
      g.position.copyFrom(g.pivot);
      this.root.addChild(g);
      const sp = 300 + hash(i) * 380;
      this.shards.push({ g, vx: Math.cos((a0 + a1) / 2) * sp, vy: Math.sin((a0 + a1) / 2) * sp - 120, vr: (hash(i + 5) - 0.5) * 9 });
    }
  }
  get broken() {
    return this.shardT >= 0;
  }
  update(t: number, dt: number, k: number, crack: number) {
    const rm = settings.reduceMotion;
    // it breathes with Canelo's purr
    const br = rm ? 0 : Math.sin((t / 1.6) * TAU);
    const n = Math.floor(crack + 0.0001);
    if (n !== this.crackN) {
      this.crackN = n;
      this.drawCracks(n);
    }
    this.root.alpha = smooth(0, 1, k);
    if (this.shardT < 0) this.root.scale.set((0.55 + 0.45 * easeOut(clamp01(k))) * (1 + br * 0.035 + crack * 0.02));
    this.aura.alpha = 0.55 + 0.25 * br + crack * 0.12;
    this.star.scale.set(1 + br * 0.12 + crack * 0.08);
    this.runes.rotation = rm ? 0 : t * 0.08;
    if (this.shardT >= 0) {
      this.shardT += dt;
      const u = this.shardT;
      for (const s of this.shards) {
        s.vy += 520 * dt;
        s.g.x += s.vx * dt;
        s.g.y += s.vy * dt;
        s.g.rotation += s.vr * dt;
        s.g.alpha = clamp01(1 - (u - 0.6) / 1.2);
      }
      this.ring.clear();
      if (u < 0.9) {
        const r = 130 + u * 520;
        this.ring.circle(0, 0, r).stroke({ width: 26 * (1 - u / 0.9), color: 0xf2e6ff, alpha: (1 - u / 0.9) * (settings.reduceFlashes ? 0.35 : 0.9) });
      }
      this.aura.alpha = clamp01(1 - u / 1.2) * 1.4;
      this.aura.scale.set(1 + u * 1.5);
    }
  }
}

// ================================================================== the controller
type Key = 'rift' | 'sign' | 'tug' | 'seal' | 'crack' | 'graffiti' | 'can' | 'lev' | 'chains' | 'eye' | 'grieta' | 'page';
const KEYS: Key[] = ['rift', 'sign', 'tug', 'seal', 'crack', 'graffiti', 'can', 'lev', 'chains', 'eye', 'grieta', 'page'];
type View = { x: number; y: number; w: number; h: number };

/** what one island scene shows of Oleada 3 (one per IslandScene; app/oleada3Flow.ts mounts it) */
export class O3Sky {
  readonly scene: Container;
  private graded: Container;
  private world: Container;
  private objects: Container | null;
  private wfx: Container;
  private front = new Container();
  private glowW = new Container();
  private t = 0;
  private forced = new Map<Key, number>();
  private forcedVigil: 'seal' | 'rock' | null | undefined = undefined;
  private forcedManeki: number | undefined = undefined;
  private inFront = new Set<string>();
  private dead = false;
  private rift: Rift | null = null;
  private tug: Tug | null = null;
  private graffiti: Graffiti | null = null;
  private can: CanShip | null = null;
  private lev: Leviathan | null = null;
  private eye: Eye | null = null;
  private grieta: Grieta | null = null;
  private seal: Seal | null = null;
  private vigil: { holder: Container; cat: IslandCat | null; slug: string; bowl: Graphics; dir: number; at: 'seal' | 'rock' } | null = null;
  private rockG: Graphics | null = null;
  private maneki: { holder: Container; broom: Graphics; dust: Graphics; box: Graphics } | null = null;
  private tagG: Graphics | null = null;
  private hidden = new Set<Container>();
  private trail: { g: Graphics; life: number; vx: number; vy: number }[] = [];
  private trailT = 0;
  private nightT = 0;
  private night = false;
  private spots: { faro: P; vigil: P; seal: P; rock: P; maneki: P & { clear: boolean }; tag: P } | null = null;
  private astral = false;
  private line: SkyLine | null | undefined = undefined;

  constructor(scene: Container) {
    this.scene = scene;
    this.graded = scene.getChildByLabel('graded', true)!;
    this.world = this.graded.parent!;
    this.objects = (this.graded.children.find((c) => (c as Container).sortableChildren) as Container | undefined) ?? null;
    const wi = this.world.children.indexOf(this.graded);
    this.wfx = (this.world.children[wi + 1] as Container) ?? this.world;
    const worldRoot = this.world.parent!;
    this.front.label = 'o3SkyFront';
    // passing pieces under the ones that stay (the rift's sign stays readable), a scene's close look over both
    this.front.addChild(this.passL, this.stayL, this.heroL);
    this.glowW.label = 'o3Glow';
    for (const c of [this.front, this.glowW]) c.eventMode = 'none';
    scene.addChildAt(this.front, scene.children.indexOf(worldRoot) + 1);
    this.wfx.addChild(this.glowW);
    Ticker.shared.add(this.tick, this);
    scene.once('destroyed', () => this.destroy());
  }

  // ------------------------------------------------------------------ driving (cine)
  get(k: Key): number {
    return this.forced.get(k) ?? this.derivedNum(k);
  }
  private seenCtx = new WeakMap<CineCtx, Set<Key>>();
  force(k: Key, v: number, ctx: CineCtx) {
    this.forced.set(k, v);
    let s = this.seenCtx.get(ctx);
    if (!s) this.seenCtx.set(ctx, (s = new Set()));
    if (!s.has(k)) {
      s.add(k);
      ctx.own(() => this.forced.delete(k));
    }
  }
  private before = false;
  /** `before`: the painting he had BEFORE the seal broke (a replay starts from there) */
  setVigil(at: 'seal' | 'rock' | null | undefined, before = false) {
    this.forcedVigil = at;
    this.before = at !== undefined && before;
    if (at === undefined) this.astral = false;
  }
  /** «¡TÓCALO!» under the seal, breathing (stopper removes it) */
  prompt(text: string) {
    const sp = this.spot();
    if (!sp) return () => undefined;
    const t = poster(text, 54, C.yellow, { stroke: { color: C.ink, width: 8 } });
    t.anchor.set(0.5);
    t.position.set(sp.seal.x, sp.seal.y + 170);
    this.wfx.addChild(t);
    const tw = settings.reduceMotion ? null : gsap.to(t.scale, { x: 1.12, y: 1.12, duration: 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    return () => {
      tw?.kill();
      if (!t.destroyed) t.destroy();
    };
  }
  setManeki(k: number | undefined) {
    this.forcedManeki = k;
  }
  bring(el: string, front: boolean) {
    if (front) this.inFront.add(el);
    else this.inFront.delete(el);
  }
  private derived(): O3SkyState {
    return o3SkyState(G.s, this.night);
  }
  private derivedNum(k: Key): number {
    const d = this.derived();
    switch (k) {
      case 'rift':
      case 'sign':
        return d.rift;
      case 'tug':
        return d.tug ? -1 : 0; // -1 = «crossing on its own» (looping)
      case 'seal':
        return d.seal;
      case 'crack':
        return 0;
      case 'graffiti':
        return d.graffiti;
      case 'can':
        return 0;
      case 'lev':
        return d.lev;
      case 'chains':
        return 1;
      case 'eye':
        return 0;
      case 'grieta':
      case 'page':
        return d.grieta;
    }
  }

  // ------------------------------------------------------------------ places on YOUR island
  /** where things stand, from the island's own landmarks (the faro, the rocks off it, home, the boat) */
  spot() {
    if (this.spots) return this.spots;
    const st = cineStage('island');
    const f = st?.resolve('faro');
    const r = st?.resolve('rocks');
    const h = st?.resolve('home');
    const b = st?.resolve('boat');
    if (!f || !h) return null;
    const rock = r ?? { x: f.x - 256, y: f.y + 282 };
    this.spots = {
      faro: f,
      vigil: { x: f.x - 104, y: f.y + 206 },
      seal: { x: f.x - 330, y: f.y + 70 },
      rock: { x: rock.x + 20, y: rock.y - 6 },
      maneki: manekiAt(h),
      tag: b ? { x: b.x - 6, y: b.y - 28 } : { x: h.x + 320, y: h.y + 330 },
    };
    return this.spots;
  }

  // ------------------------------------------------------------------ flourishes (cine)
  /** the seal breaks (H53): shards, a ring of light, Canelo goes through */
  shatter(ctx: CineCtx) {
    const sp = this.spot();
    this.seal?.shatter(ctx.reduceMotion);
    if (!sp) return;
    sparkles(this.wfx, sp.seal.x, sp.seal.y, 0xf2e6ff, ctx.reduceMotion ? 12 : 40, 320);
    onomatopoeia(this.wfx, sp.seal.x, sp.seal.y - 160, '¡¡CRAAAC!!', { size: 92, color: 0xf2e6ff });
  }
  crack(n: number, ctx: CineCtx) {
    const sp = this.spot();
    if (!sp) return;
    const words = ['crac.', '¡CRAC!', '¡¡CRAAAC!!'];
    onomatopoeia(this.wfx, sp.seal.x + (n - 1) * 30, sp.seal.y - 120, words[Math.max(0, Math.min(2, n - 1))], { size: 50 + n * 16, color: 0xffffff });
    if (!ctx.reduceMotion) sparkles(this.wfx, sp.seal.x, sp.seal.y, 0xc77dff, 10 + n * 6, 150);
  }
  /** Canelo comes out the other side: the stand-in becomes CANELO ASTRAL, with a tail full of stars */
  astralize(ctx: CineCtx) {
    this.astral = true;
    const v = this.vigil;
    if (!v) return;
    const slug = 'canelo_astral_cat';
    void preloadCats([slug]).then(() => {
      if (!this.vigil || this.vigil !== v || v.holder.destroyed) return;
      const next = new IslandCat(slug, 104);
      applyCatTint(next.sprite, 'c_canelo');
      next.face(v.dir as 1 | -1);
      v.cat?.destroy();
      v.holder.addChild(next);
      v.cat = next;
      v.slug = slug;
      next.hop();
      next.sprite.emote('happy', 1);
      if (!ctx.reduceMotion) gsap.from(next.scale, { x: 1.35, y: 0.7, duration: 0.5, ease: 'elastic.out(1.1,0.45)' });
    });
    const p = v.holder.position;
    sparkles(this.wfx, p.x, p.y - 80, 0xbfe8ff, ctx.reduceMotion ? 10 : 34, 200);
  }
  blinkEye(ctx: CineCtx) {
    this.eye?.doBlink(ctx.reduceMotion);
  }
  /** a short line floating in the world (Grafitera's «Me caen bien…») */
  floatAt(where: 'tag' | 'vigil' | 'maneki', text: string, hold = 4) {
    const sp = this.spot();
    if (!sp) return () => undefined;
    const p = sp[where];
    const t = txt(text, { fontFamily: F.brush, fontSize: 30, fill: C.paper, stroke: { color: C.ink, width: 7, join: 'round' }, padding: 10, wordWrap: true, wordWrapWidth: 520, align: 'center' }) as Text;
    t.anchor.set(0.5, 1);
    t.position.set(p.x, p.y - 120);
    this.wfx.addChild(t);
    t.alpha = 0;
    gsap.to(t, { alpha: 1, duration: 0.4 });
    gsap.to(t, { y: t.y - 16, duration: hold, ease: 'sine.out' });
    const tm = window.setTimeout(() => !t.destroyed && gsap.to(t, { alpha: 0, duration: 0.5, onComplete: () => t.destroy() }), hold * 1000);
    return () => {
      window.clearTimeout(tm);
      if (!t.destroyed) t.destroy();
    };
  }

  // ------------------------------------------------------------------ per frame
  private tick(tk: Ticker) {
    if (this.dead) return;
    if (this.scene.destroyed) return this.destroy();
    const dt = Math.min(0.1, tk.deltaMS / 1000);
    this.t += dt;
    this.nightT -= dt;
    if (this.nightT <= 0) {
      this.nightT = 5;
      this.night = clockNight(islandHour()) > 0.5;
    }
    const v: View = game.view;
    const t = this.t;
    const d = this.derived();
    // ---- the neon seam
    const rk = this.get('rift');
    if (rk > 0.001 || this.rift) {
      this.rift ??= this.mount(new Rift(), 'rift');
      this.place(this.rift.root, 'rift');
      this.rift.root.visible = rk > 0.001;
      this.rift.root.scale.set((v.w / 1920) * (this.inFront.has('rift') ? 1.15 : 0.82));
      this.rift.root.position.set(v.x + v.w * (this.inFront.has('rift') ? 0.5 : 0.66), v.y + v.h * (this.inFront.has('rift') ? 0.2 : 0.16));
      if (!this.inFront.has('rift')) {
        const sc = this.rift.root.scale.x;
        this.rift.root.y = this.clearOfIslands(this.rift.root.x, this.rift.root.y, 350 * sc, 130 * sc);
      }
      this.rift.root.rotation = -0.07;
      if (rk > 0.001) this.rift.update(t, rk, this.get('sign'));
    }
    // ---- the tug
    const tu = this.get('tug');
    if (tu !== 0 || this.tug) {
      this.tug ??= this.mount(new Tug(), 'tug');
      this.place(this.tug.root, 'tug');
      this.tug.root.visible = tu !== 0;
      if (tu !== 0) {
        this.tug.update(t, tu < 0 ? (t / 140) % 1 : tu, v, this.inFront.has('tug'));
        // ship (−120…120) + cable + planetoid (360 ± 130): the whole tow clears the islands
        this.settle('tug', this.tug.root, 185, 315, 175, dt);
      }
    }
    // ---- graffiti + the paint-can ship
    const gk = this.get('graffiti');
    if (gk > 0.001 || this.graffiti) {
      this.graffiti ??= this.mount(new Graffiti(), 'graffiti');
      this.place(this.graffiti.root, 'graffiti');
      this.graffiti.root.visible = gk > 0.001;
      if (gk > 0.001) this.graffiti.update(t, gk, v, (i, x, y, half, below) => y + this.lifted(`graffiti:${i}`, this.framed('graffiti') ? 0 : this.clearOfIslands(x, y, half, below) - y, dt));
    }
    const ck = this.get('can');
    if (ck > 0.001 && ck < 0.999) {
      this.can ??= this.mount(new CanShip(), 'can');
      this.place(this.can.root, 'can');
      this.can.root.visible = true;
      this.can.update(t, ck, v);
      this.settle('can', this.can.root, 0, 160, 60, dt);
    } else if (this.can) this.can.root.visible = false;
    // ---- the Leviathan
    const lk = this.get('lev');
    if (lk > 0.001 || this.lev) {
      this.lev ??= this.mount(new Leviathan(), 'lev');
      this.place(this.lev.root, 'lev');
      this.lev.root.visible = lk > 0.001;
      if (lk > 0.001) {
        this.lev.update(t, dt, lk, this.get('chains'), v, !this.inFront.has('lev'));
        // head (−330) to tail fin (+440); the throat pleats and the chains hang ~185 under its middle
        this.settle('lev', this.lev.root, 55, 390, 185, dt);
      }
    }
    const ek = this.get('eye');
    if (ek > 0.001 || this.eye) {
      this.eye ??= this.mount(new Eye(), 'eye');
      this.place(this.eye.root, 'eye');
      this.eye.root.visible = ek > 0.001;
      if (ek > 0.001) {
        this.eye.update(t, ek, v);
        this.settle('eye', this.eye.root, 0, 330, 190, dt);
      }
    }
    // ---- the rift that stays open
    const gr = this.get('grieta');
    if (gr > 0.001 || this.grieta) {
      this.grieta ??= this.mount(new Grieta(), 'grieta');
      this.place(this.grieta.root, 'grieta');
      this.grieta.root.visible = gr > 0.001;
      if (gr > 0.001) {
        this.grieta.update(t, gr, this.get('page'), v, !this.inFront.has('grieta'));
        if (!this.inFront.has('grieta')) {
          const sc = this.grieta.root.scale.x;
          this.grieta.root.y = this.clearOfIslands(this.grieta.root.x, this.grieta.root.y, 170 * sc, 215 * sc);
        }
      }
    }
    // ---- island things
    const sp = this.spot();
    if (sp) {
      const sk = this.get('seal');
      if (sk > 0.001 || this.seal) {
        if (!this.seal) {
          this.seal = new Seal();
          this.glowW.addChild(this.seal.root);
        }
        this.seal.root.position.set(sp.seal.x, sp.seal.y);
        this.seal.root.visible = sk > 0.001 || this.seal.broken;
        this.seal.update(t, dt, sk, this.get('crack'));
        if (sk <= 0.001 && !this.seal.broken && this.forced.get('seal') === undefined) {
          this.seal.root.destroy({ children: true });
          this.seal = null;
        }
      }
      this.syncRock(d.rock > 0 || this.forcedVigil === 'rock', sp);
      const vig = this.forcedVigil !== undefined ? this.forcedVigil : runningCine() ? null : d.vigil;
      this.syncVigil(vig, sp, dt);
      this.syncManeki((this.forcedManeki ?? d.maneki) > 0, sp, t);
      this.syncTag(d.tag > 0, sp, t);
    }
    this.syncTrail(dt);
  }
  /**
   * a screen-space sky piece at (x, y) whose lowest point hangs `below` under it and spans ±`half`: the y that keeps it
   * above the islands on screen (only ever higher than asked)
   */
  private clearOfIslands(x: number, y: number, half: number, below: number): number {
    if (this.line === undefined) this.line = SkyLine.of(this.scene);
    if (!this.line || this.world.destroyed) return y;
    const o = this.scene.toLocal({ x: 0, y: 0 }, this.world);
    const u = this.scene.toLocal({ x: 1000, y: 0 }, this.world);
    return this.line.clearOnScreen(x, y, half, below, o, (u.x - o.x) / 1000);
  }
  /**
   * the passing pieces (tug, graffiti + can ship, Leviathan, eye) at rest: like the rift and the grieta, they rise
   * clear of the islands under them (clearOfIslands, in local units of the piece: `cx` its middle, ±`half` its span,
   * `below` how far it hangs under its anchor). While a scene plays they keep the places the scene frames (in front or
   * handed back mid-scene: H57 a lets the Leviathan go up there, small, over everything). The lift eases (≈ 0.4 s) so
   * a scene ending doesn't make a piece jump (MENORES 2026-10-10)
   */
  private settle(id: string, root: Container, cx: number, half: number, below: number, dt: number) {
    const sc = Math.abs(root.scale.x) || 1;
    const want = this.framed(id) ? 0 : this.clearOfIslands(root.x + cx * sc, root.y, half * sc, below * sc) - root.y;
    root.y += this.lifted(id, want, dt);
  }
  private framed(id: string) {
    return this.inFront.has(id) || !!runningCine();
  }
  private lifts = new Map<string, number>();
  private lifted(id: string, want: number, dt: number): number {
    const had = this.lifts.get(id);
    const cur = had === undefined ? want : had + (want - had) * Math.min(1, dt * 2.5);
    this.lifts.set(id, cur);
    return cur;
  }
  /**
   * every sky piece clears the islands on screen (clearOfIslands / settle), so they all draw over the world: nothing
   * of the archipelago (dimension skies, Oleada 2's sky things) hides them any more (PULIDO: rift, grieta · MENORES:
   * the passing ones)
   */
  private passL = new Container();
  private stayL = new Container();
  private heroL = new Container();
  private layerOf(id: string) {
    return this.inFront.has(id) ? this.heroL : id === 'rift' || id === 'grieta' ? this.stayL : this.passL;
  }
  private mount<T extends { root: Container }>(el: T, id: string): T {
    el.root.label = `o3:${id}`;
    this.layerOf(id).addChild(el.root);
    return el;
  }
  private place(root: Container, id: string) {
    const want = this.layerOf(id);
    if (root.parent !== want) want.addChild(root);
  }

  private caneloActors(): Container[] {
    const out: Container[] = [];
    const root = this.objects ?? this.graded;
    const walk = (c: Container, depth: number) => {
      for (const ch of c.children as (Container & { species?: string; catUid?: string })[]) {
        if (ch.species === 'c_canelo' && typeof ch.catUid === 'string') out.push(ch);
        else if (depth < 2 && ch.children?.length) walk(ch, depth + 1);
      }
    };
    walk(root, 0);
    return out;
  }
  private syncVigil(at: 'seal' | 'rock' | null, sp: NonNullable<O3Sky['spots']>, dt: number) {
    if (!at) {
      if (this.vigil) {
        this.vigil.holder.destroy({ children: true });
        this.vigil = null;
        this.astral = false;
      }
      for (const a of this.hidden) if (!a.destroyed) gsap.to(a, { alpha: 1, duration: 0.3 });
      this.hidden.clear();
      return;
    }
    // one Canelo: his walking self steps aside while he sits here
    for (const a of this.caneloActors()) {
      a.alpha = 0;
      this.hidden.add(a);
    }
    const target = at === 'seal' ? sp.seal : sp.rock;
    const dir = target.x < sp.vigil.x ? -1 : 1;
    const own = G.s.cats.find((c) => c.species === 'c_canelo');
    let slug = this.astral ? 'canelo_astral_cat' : own ? catSlug(own) : 'canelo_cozy_cat';
    if (this.before && !this.astral && slug === 'canelo_astral_cat') slug = 'canelo_cozy_cat';
    if (!this.vigil || this.vigil.at !== at) {
      this.vigil?.holder.destroy({ children: true });
      const holder = new Container();
      holder.label = 'o3:vigil';
      const bowl = new Graphics();
      // his food, untouched: a bowl with a whole fish in it
      bowl.ellipse(0, 6, 26, 9).fill({ color: C.ink, alpha: 0.2 });
      bowl.poly([-24, -6, 24, -6, 16, 8, -16, 8]).fill(0xd94a3a).stroke({ width: 4, color: C.ink });
      bowl.ellipse(0, -6, 24, 6).fill(0x8a2a20).stroke({ width: 3, color: C.ink });
      bowl.ellipse(2, -10, 16, 6).fill(0x9fb4c8).stroke({ width: 3, color: C.ink });
      bowl.poly([16, -10, 28, -18, 28, -2]).fill(0x9fb4c8).stroke({ width: 3, color: C.ink });
      bowl.position.set(-dir * 54, 4);
      bowl.visible = at === 'seal';
      holder.addChild(bowl);
      holder.position.set(sp.vigil.x, sp.vigil.y);
      holder.zIndex = sp.vigil.y;
      (this.objects ?? this.graded).addChild(holder);
      this.vigil = { holder, cat: null, slug: '', bowl, dir, at };
    }
    const vg = this.vigil;
    if (vg.slug !== slug && !vg.holder.destroyed) {
      vg.slug = slug;
      void preloadCats([slug]).then(() => {
        if (this.vigil !== vg || vg.holder.destroyed || vg.slug !== slug) return;
        const cat = new IslandCat(slug, 104);
        applyCatTint(cat.sprite, 'c_canelo');
        cat.face(dir as 1 | -1);
        vg.cat?.destroy();
        vg.holder.addChild(cat);
        vg.cat = cat;
      });
    }
    // the stars he keeps in his tail (Canelo Astral)
    if (slug === 'canelo_astral_cat' && !settings.reduceMotion) {
      this.trailT -= dt;
      if (this.trailT <= 0) {
        this.trailT = 0.22;
        const g = new Graphics();
        star4(g, 0, 0, 6 + Math.random() * 5, Math.random() < 0.5 ? 0xbfe8ff : 0xfff4c8, 1);
        g.blendMode = 'add';
        g.position.set(sp.vigil.x - dir * (40 + Math.random() * 20), sp.vigil.y - 40 - Math.random() * 30);
        this.glowW.addChild(g);
        this.trail.push({ g, life: 1.8, vx: -dir * (10 + Math.random() * 16), vy: -18 - Math.random() * 16 });
      }
    }
  }
  private syncTrail(dt: number) {
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const s = this.trail[i];
      s.life -= dt;
      s.g.x += s.vx * dt;
      s.g.y += s.vy * dt;
      s.g.alpha = clamp01(s.life / 1.8);
      s.g.rotation += dt * 2;
      if (s.life <= 0) {
        s.g.destroy();
        this.trail.splice(i, 1);
      }
    }
  }
  private syncRock(on: boolean, sp: NonNullable<O3Sky['spots']>) {
    if (!on) {
      this.rockG?.destroy();
      this.rockG = null;
      return;
    }
    if (this.rockG) return;
    const g = new Graphics();
    // the rock off your faro, where sometimes nobody is
    g.ellipse(0, 10, 58, 14).fill({ color: 0xffffff, alpha: 0.35 });
    g.poly([-46, 10, -36, -18, -12, -34, 14, -30, 38, -12, 48, 10]).fill(0x5b5470).stroke({ width: 5, color: C.ink });
    g.poly([-12, -34, 14, -30, 4, -18, -16, -22]).fill({ color: 0xffffff, alpha: 0.18 });
    g.position.set(sp.rock.x, sp.rock.y);
    g.zIndex = sp.rock.y;
    g.label = 'o3:rock';
    (this.objects ?? this.graded).addChild(g);
    this.rockG = g;
  }
  private syncManeki(on: boolean, sp: NonNullable<O3Sky['spots']>, t: number) {
    if (!on) {
      if (this.maneki) {
        this.maneki.holder.destroy({ children: true });
        this.maneki = null;
      }
      return;
    }
    if (!this.maneki) {
      const holder = new Container();
      holder.label = 'o3:maneki';
      holder.position.set(sp.maneki.x, sp.maneki.y);
      holder.zIndex = sp.maneki.y;
      const box = new Graphics().rect(44, -18, 34, 22).fill(0xb98a5a).stroke({ width: 4, color: C.ink }).rect(44, -24, 34, 6).fill(0x8a6a44).stroke({ width: 3, color: C.ink });
      const dust = new Graphics();
      dust.blendMode = 'add';
      const broom = new Graphics();
      broom.rect(-3, -84, 6, 80).fill(0x8a5a2b).stroke({ width: 3, color: C.ink });
      broom.poly([-14, -6, 14, -6, 20, 18, -20, 18]).fill(0xe0c068).stroke({ width: 3, color: C.ink });
      broom.pivot.set(0, -84);
      broom.position.set(20, -84);
      holder.addChild(box, dust, broom);
      (this.objects ?? this.graded).addChild(holder);
      const m = { holder, broom, dust, box };
      this.maneki = m;
      void preloadCats(['mochi_bell_cat']).then(() => {
        if (this.maneki !== m || holder.destroyed) return;
        const cat = new IslandCat('mochi_bell_cat', 96);
        cat.face(1);
        holder.addChildAt(cat, 0);
      });
    }
    const m = this.maneki;
    const rm = settings.reduceMotion;
    // her scene (h54_maneki) holds her: bigger, so she reads at a glance; afterwards she's an island cat again
    // (PULIDO 2026-10-10). Her spot is clear of buildings (MENORES 2026-10-10: manekiAt); only when no clear tile
    // exists near home is she still drawn over what stands in front of her during the scene
    const star = this.forcedManeki !== undefined;
    const want = star ? 1.4 : 1;
    const sc = m.holder.scale.x;
    m.holder.scale.set(Math.abs(want - sc) < 0.01 ? want : sc + (want - sc) * 0.15);
    m.holder.zIndex = star && !sp.maneki.clear ? 1e6 : sp.maneki.y;
    m.broom.rotation = rm ? 0.2 : 0.35 * Math.sin(t * 3.2);
    // star dust nobody else sees, swept toward the little box
    m.dust.clear();
    for (let i = 0; i < 9; i++) {
      const k = rm ? i / 9 : (t * 0.35 + i / 9) % 1;
      const x = lerp(30, 60, k) + (hash(i) - 0.5) * 30 * (1 - k);
      const y = lerp(12, -10, k) + (hash(i + 3) - 0.5) * 10;
      star4(m.dust, x, y, 4 + hash(i + 6) * 3, 0xfff4c8, 0.85 * (1 - k * 0.6));
    }
  }
  private syncTag(on: boolean, sp: NonNullable<O3Sky['spots']>, t: number) {
    if (!on) {
      this.tagG?.destroy();
      this.tagG = null;
      return;
    }
    if (!this.tagG) {
      const g = new Graphics();
      // Grafitera's tag on your boat: a box with its door open
      g.rect(-16, -14, 32, 28).stroke({ width: 10, color: 0xff3fd8, alpha: 0.3 });
      g.rect(-16, -14, 32, 28).stroke({ width: 4, color: 0xff3fd8 });
      g.poly([16, -14, 34, -24, 34, 4, 16, 14]).stroke({ width: 4, color: 0x4ff2ff });
      g.blendMode = 'add';
      g.position.set(sp.tag.x, sp.tag.y);
      g.label = 'o3:tag';
      this.glowW.addChild(g);
      this.tagG = g;
    }
    this.tagG.alpha = settings.reduceMotion ? 0.9 : 0.75 + 0.25 * buzz(t, 11);
  }

  destroy() {
    if (this.dead) return;
    this.dead = true;
    Ticker.shared.remove(this.tick, this);
    for (const a of this.hidden) if (!a.destroyed) a.alpha = 1;
    this.hidden.clear();
    for (const s of this.trail) s.g.destroy();
    this.trail.length = 0;
    for (const c of [this.front, this.glowW]) if (!c.destroyed) c.destroy({ children: true });
    for (const c of [this.vigil?.holder, this.rockG, this.maneki?.holder, this.tagG]) if (c && !c.destroyed) c.destroy({ children: true });
    if (cur === this) cur = null;
  }
}
type P = { x: number; y: number };

/**
 * Maneki's spot (H54): home + (150, 96) as always when that tile is clear; on a big archipelago, where a building
 * stands on it or in front of it (the Puerto on `rupturas-o4`), the nearest clear tile of land you own
 * (ui/story/manekiSpot.ts). Never throws: any trouble → the old spot.
 */
function manekiAt(home: P): P & { clear: boolean } {
  const old = { x: home.x + 150, y: home.y + 96, clear: false };
  try {
    const plan = islandPlan();
    const owned = ownedRegions();
    const k = (gx: number, gy: number) => `${gx},${gy}`;
    const built = new Set<string>([...staticBlocked(), ...habitatTiles().keys(), ...decorTiles()]);
    const decor = new Set<string>();
    for (const r of plan.plans.values()) for (const d of r.decor) decor.add(k(Math.round(d.gx), Math.round(d.gy)));
    // where the homeless cats wait with their box (IslandScene.homelessArea): a crowd she'd get lost in
    const hs = nearestHabitatSpot() ?? plan.home.mesa;
    for (let x = hs.gx - 1; x <= hs.gx + 3; x++) for (let y = hs.gy - 1; y <= hs.gy + 3; y++) decor.add(k(x, y));
    // tiles are centered on isoToScreen(gx, gy)
    const want = { gx: Math.round((old.y / (TH / 2) + old.x / (TW / 2)) / 2), gy: Math.round((old.y / (TH / 2) - old.x / (TW / 2)) / 2) };
    const area: ManekiArea = {
      land: (gx, gy) => {
        const tile = plan.tiles.get(k(gx, gy));
        return !!tile && owned.has(tile.region);
      },
      built: (gx, gy) => built.has(k(gx, gy)),
      decor: (gx, gy) => decor.has(k(gx, gy)),
    };
    const t = manekiTile(want, area);
    if (!t) return old;
    // nothing tall right in front of her: no need to draw her over the buildings in her scene
    const clear = clearTile(t, area, 2, false);
    if (t.gx === want.gx && t.gy === want.gy) return { ...old, clear };
    return { ...isoToScreen(t.gx, t.gy), clear };
  } catch {
    return old;
  }
}

// ================================================================== which scene is on screen (minification-safe)
/** `instanceof` against the real classes (lazy: no scene is imported at boot), never `constructor.name` (a production
 *  build renames classes). RegionScene is duck-typed by its `regionId` (importing it would pull three.js at boot). */
let IslandCls: (abstract new (...a: never[]) => unknown) | null = null;
let MapCls: (abstract new (...a: never[]) => unknown) | null = null;
void import('../../scenes/IslandScene').then((m) => (IslandCls = m.IslandScene as never)).catch(() => undefined);
void import('../../scenes/MapScene').then((m) => (MapCls = m.MapScene as never)).catch(() => undefined);
export function sceneKind(c: unknown = scenes.current): 'island' | 'map' | 'region' | 'other' {
  if (!c) return 'other';
  if (IslandCls && c instanceof IslandCls) return 'island';
  if (MapCls && c instanceof MapCls) return 'map';
  if (typeof (c as { regionId?: unknown }).regionId === 'string') return 'region';
  return 'other';
}

// ================================================================== the one on screen + the island stage registry
let cur: O3Sky | null = null;
/** the Oleada 3 picture of the island on screen (null when not on the island) */
export function o3Sky(): O3Sky | null {
  return cur && !cur.scene.destroyed && scenes.current === cur.scene ? cur : null;
}
/** mount it on the island scene on screen when the save reached this wave (app/oleada3Flow calls it often; cheap) */
export function mountO3Sky(force = false): O3Sky | null {
  const sc = scenes.current as Container | null;
  if (!sc || sc.destroyed || sceneKind(sc) !== 'island') return null;
  if (cur && cur.scene === sc) return cur;
  if (!force && !o3Reached(G.s)) return null;
  if (!sc.getChildByLabel('graded', true) || !cineStage('island')?.alive()) return null;
  cur?.destroy();
  cur = new O3Sky(sc);
  return cur;
}

for (const k of KEYS)
  registerIslandDrive(`o3:${k}`, {
    get: () => o3Sky()?.get(k),
    set: (v, ctx) => (mountO3Sky(true) ?? null)?.force(k, v, ctx),
  });
/** where Maneki sweeps (her scene's camera goes there: a free tile on a big archipelago) */
registerIslandTarget('maneki', () => mountO3Sky(true)?.spot()?.maneki ?? null);
const fx = (id: string, fn: (s: O3Sky, cmd: FxCmd, ctx: CineCtx) => (() => void) | void) =>
  registerIslandFx(id, (cmd, ctx) => {
    const s = mountO3Sky(true);
    return s ? fn(s, cmd, ctx) : undefined;
  });
/** a sky piece comes IN FRONT of the islands for the scene (back behind them when it ends) */
fx('o3:front', (s, cmd) => {
  const el = String(cmd.el ?? '');
  s.bring(el, !cmd.off);
  return () => s.bring(el, false);
});
/** Canelo sits by the faro staring at `at` (seal | rock) for the scene */
fx('o3:vigil', (s, cmd) => {
  s.setVigil(cmd.at === 'rock' ? 'rock' : cmd.at === 'none' ? null : 'seal', !!cmd.before);
  return () => s.setVigil(undefined);
});
fx('o3:maneki', (s) => {
  s.setManeki(1);
  return () => s.setManeki(undefined);
});
let promptOff: (() => void) | null = null;
fx('o3:prompt', (s, cmd) => {
  promptOff?.();
  promptOff = null;
  if (cmd.off) return () => undefined;
  const off = s.prompt(String(cmd.text ?? '¡TÓCALO!'));
  promptOff = off;
  return () => {
    off();
    if (promptOff === off) promptOff = null;
  };
});
fx('o3:crack', (s, cmd, ctx) => s.crack(Number(cmd.n ?? 1), ctx));
fx('o3:shatter', (s, _cmd, ctx) => s.shatter(ctx));
fx('o3:astral', (s, _cmd, ctx) => s.astralize(ctx));
fx('o3:blink', (s, _cmd, ctx) => s.blinkEye(ctx));
fx('o3:say', (s, cmd) => s.floatAt((cmd.at as 'tag' | 'vigil' | 'maneki') ?? 'tag', String(cmd.text ?? ''), Number(cmd.hold ?? 4)));
fx('o3:motif', (_s, cmd) => void motif(String(cmd.m ?? '')));
fx('o3:sfx', (_s, cmd) => void sfx(String(cmd.s ?? 'pop') as Parameters<typeof sfx>[0], Number(cmd.v ?? 1)));

if (import.meta.env.DEV) (globalThis as unknown as { __o3sky: unknown }).__o3sky = { get: () => o3Sky(), mount: () => mountO3Sky(true), state: () => o3SkyState(G.s, clockNight(islandHour()) > 0.5) };
