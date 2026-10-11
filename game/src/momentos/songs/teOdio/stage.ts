/**
 * te ODIO — the set (H55: the void fight with the Disruptores turns into a fight between two ARTS).
 *
 * The same world exists twice: the box's clean COMIC and the Disruptores' STREET spray. `style` (0..1) says how much of
 * the frame is street: 0 = all comic, 1 = all street, in between a slanted front crosses the screen from the right
 * (their side) — a panel border on the comic side, overspray and torn paper on the street side. `rifts` (0..1) opens
 * two windows of the OTHER art (the glitch phase's rifts). Every actor wears its comic or its street painting by which
 * side of the front it stands on.
 *
 * World: our ship (A) left at A_X facing right; la Lata de Pintura (B) right at B_X facing left; two rocks between.
 * Everything is a function of momento time: props from the score's keys, state from the score's cues (wall tags,
 * panel breaks), per-frame requests from clips (poses, jolts, signal), and the ALWAYS-ON reactions to the onsets:
 * kick = a spray burst from la Lata's cannons + a camera punch + the hulls dip · 808 = the wall shudders, the low notes
 * hit like a wall impact (shake + chroma) · claps = paint pellets splat on the wall · hats = spray mist · melody = the
 * tags glow / the comic stars twinkle · voice = Brecha shouts along.
 */
import { Container, Graphics, RenderTexture, Sprite, type Texture } from 'pixi.js';
import type { Kit, StageApi } from '../../anime/kit';
import { W, H } from '../../anime/kit';
import { Actor, Studio } from '../../anime/actor';
import type { Palette } from '../../anime/palette';
import { rng } from '../../anime/draw';
import { G } from '../../../state/game';
import { catSlug } from '../../../state/sys/forms';
import { COMIC_CEL, bakeStencil } from './bake';
import { drawLata, drawOurShip, drawRock, drawVoidComic, drawVoidStreet, comicStar, type Art } from './art';
import { COMIC_INK, FLUO, INK, PRINT, SprayBook, WALL, benDayLayer, loadFonts, splat, sprayLine, sprayStar, drips } from './spray';
import { SignalFilter } from './post';
import { TE_VERBS } from './verbs';
import { SHOT_VERBS } from './shots';

export const A_X = 600;
export const B_X = 1340;
export const BASE_Y = 760;

export type Who = 'canelo' | 'luzterna' | 'crew' | 'brecha' | 'grafitera' | 'hueco' | 'ecomudo';
export interface PoseReq {
  name: string;
  lt: number;
  /** absolute world position override */
  x?: number;
  y?: number;
  rot?: number;
  s?: number;
  flip?: boolean;
}
interface PoseOut {
  dx?: number;
  dy?: number;
  rot?: number;
  sx?: number;
  sy?: number;
  lean?: number;
  crouch?: number;
  look?: number;
  hide?: boolean;
}
const st2 = (lt: number) => Math.floor(lt * 12) / 12;
export const POSES: Record<string, (lt: number) => PoseOut> = {
  idle: () => ({}),
  hang: (lt) => ({ rot: Math.PI + Math.sin(st2(lt) * 2.2) * 0.08, dx: Math.sin(st2(lt) * 2.2) * 10 }),
  spray: (lt) => ({ lean: 0.5, rot: -0.08 + Math.sin(st2(lt) * 18) * 0.02, dy: -Math.abs(Math.sin(st2(lt) * 9)) * 6 }),
  swing: (lt) => {
    const x = Math.min(1, lt / 0.25);
    return x < 0.35 ? { rot: -0.35, lean: -0.4, crouch: 0.3, dx: -20 } : { rot: 0.45, lean: 0.8, dx: 40, sx: 1.08, sy: 0.94 };
  },
  hit: (lt) => {
    const x = Math.min(1, lt / 0.6);
    return { dx: -60 * Math.sin(x * Math.PI), dy: -30 * Math.sin(x * Math.PI), rot: -0.4 * (1 - x), sx: 0.92, sy: 1.08 };
  },
  cheer: (lt) => ({ dy: -46 * Math.abs(Math.sin(st2(lt) * 6)), rot: Math.sin(st2(lt) * 12) * 0.06 }),
  point: () => ({ lean: 0.6, rot: -0.05 }),
  brace: () => ({ crouch: 0.6, lean: -0.2, sy: 0.92, sx: 1.05 }),
  shout: (lt) => ({ lean: 0.7, sy: 1.05 + 0.03 * Math.sin(st2(lt) * 20), rot: -0.06 }),
  push: (lt) => ({ lean: 0.9, crouch: 0.3, dx: 18 * Math.sin(st2(lt) * 16), rot: 0.05 }),
  sad: () => ({ crouch: 0.35, lean: -0.3, look: -0.6 }),
  fly: (lt) => ({ rot: Math.sin(st2(lt) * 3) * 0.1 }),
};

/** where each one stands (ship-local) and how big */
const HOMES: Record<Who, { ship: 'A' | 'B'; x: number; y: number; size: number; halo: number }> = {
  canelo: { ship: 'A', x: 120, y: -132, size: 270, halo: FLUO.orange },
  luzterna: { ship: 'A', x: -200, y: -250, size: 215, halo: FLUO.cyan },
  crew: { ship: 'A', x: -60, y: -132, size: 170, halo: FLUO.yellow },
  brecha: { ship: 'B', x: -196, y: -440, size: 260, halo: FLUO.pink },
  grafitera: { ship: 'B', x: -220, y: -146, size: 230, halo: FLUO.green },
  hueco: { ship: 'B', x: -60, y: -146, size: 170, halo: FLUO.violet },
  ecomudo: { ship: 'B', x: 170, y: -146, size: 165, halo: 0xffffff },
};

/** Canelo as the player has him (his form), else the Astral one he became in H53 */
function caneloSlug(): string {
  try {
    const c = G.s?.cats?.find((x) => x.species === 'c_canelo');
    if (c) return catSlug(c);
  } catch {
    /* no save */
  }
  return 'canelo_astral_cat';
}

const pal = (p: Partial<Palette> & { name: string }): Palette => ({
  ink: INK,
  shadow: 0x2a2730,
  base: 0x5a5560,
  light: WALL,
  accent: FLUO.pink,
  accent2: FLUO.green,
  sky: [0x1c1a21, 0x1c1a21, 0x1c1a21],
  sea: [0x1c1a21, 0x1c1a21, 0x1c1a21],
  grade: { shade: 0x141218, glow: 0xfff8ec, sat: 1.0, tone: 0, vignette: 0.28 },
  ...p,
});
export const TE_PALETTES: Record<string, Palette> = {
  tvoid: pal({ name: 'tvoid', ink: 0x0b0716, shadow: 0x1c1830, base: 0x3a3550, light: 0xe8e0ff, accent: FLUO.pink, accent2: FLUO.cyan, grade: { shade: 0x0b0716, glow: 0xffffff, sat: 0.92, tone: 0, vignette: 0.35 } }),
  street: pal({ name: 'street', accent: FLUO.pink, accent2: FLUO.green, grade: { shade: 0x141218, glow: 0xfff8ec, sat: 1.06, tone: 0, vignette: 0.3 } }),
  comic: pal({ name: 'comic', ink: COMIC_INK, shadow: PRINT.blue, base: PRINT.cyan, light: PRINT.paper, accent: PRINT.yellow, accent2: PRINT.magenta, grade: { shade: 0x10183a, glow: 0xffffff, sat: 1.0, tone: 0, vignette: 0.16 } }),
  stencil: pal({ name: 'stencil', shadow: 0x5a5560, base: 0xb9b3a6, accent: FLUO.green, accent2: FLUO.pink, grade: { shade: 0x141218, glow: 0xfffaf0, sat: 1.0, tone: 0, vignette: 0.22 } }),
  night: pal({ name: 'night', ink: 0x120a24, shadow: 0x2a1a4a, base: 0x5a3a8a, light: 0xf0e8ff, accent: FLUO.orange, accent2: FLUO.cyan, grade: { shade: 0x120a24, glow: 0xfff0e8, sat: 1.1, tone: 0, vignette: 0.34 } }),
  hand: pal({ name: 'hand', ink: 0x14213a, shadow: 0x6a87b8, base: 0xbcd6ff, light: 0xffffff, accent: FLUO.cyan, accent2: FLUO.pink, grade: { shade: 0x14213a, glow: 0xffffff, sat: 0.95, tone: 0, vignette: 0.3 } }),
  riot: pal({ name: 'riot', ink: 0x1a0626, shadow: 0x5a1270, base: FLUO.pink, light: 0xffffff, accent: FLUO.yellow, accent2: FLUO.green, grade: { shade: 0x1a0626, glow: 0xffffff, sat: 1.18, tone: 0, vignette: 0.3 } }),
  signal: pal({ name: 'signal', ink: 0x061410, shadow: 0x0e3326, base: 0x2f8a6a, light: 0xc8ffe8, accent: 0x9effd9, accent2: FLUO.pink, grade: { shade: 0x061410, glow: 0xd8fff0, sat: 0.62, tone: 0, vignette: 0.55 } }),
  build: pal({ name: 'build', ink: 0x0b0716, shadow: 0x2a1a3a, base: 0x6a4a8a, light: 0xfff0d8, accent: FLUO.orange, accent2: 0x9effd9, grade: { shade: 0x0b0716, glow: 0xfff6e8, sat: 0.85, tone: 0, vignette: 0.45 } }),
  fusion: pal({ name: 'fusion', ink: COMIC_INK, shadow: 0x2a1a6b, base: PRINT.cyan, light: 0xffffff, accent: FLUO.green, accent2: FLUO.pink, grade: { shade: 0x10102e, glow: 0xffffff, sat: 1.22, tone: 0, vignette: 0.24 } }),
};

/** a ship = two drawings of the same thing (one per art), moved together */
class Ship {
  readonly comic = new Container();
  readonly street = new Container();
  readonly patchC = new Graphics();
  readonly patchS = new Graphics();
  x = 0;
  y = 0;
  rot = 0;
  sx = 1;
  sy = 1;
  constructor(draw: (g: Graphics, art: Art) => void) {
    const gc = new Graphics();
    draw(gc, 'comic');
    const gs = new Graphics();
    draw(gs, 'street');
    this.comic.addChild(gc, this.patchC);
    this.street.addChild(gs, this.patchS);
  }
  apply() {
    for (const c of [this.comic, this.street]) {
      c.position.set(this.x, this.y);
      c.rotation = this.rot;
      c.scale.set(this.sx, this.sy);
    }
  }
  /** a local point → world (live transform) */
  world(lx: number, ly: number): [number, number] {
    const cos = Math.cos(this.rot);
    const sin = Math.sin(this.rot);
    return [this.x + (lx * cos - ly * sin) * this.sx, this.y + (lx * sin + ly * cos) * this.sy];
  }
}

export interface Patch {
  ship: 'A' | 'B';
  m: number;
  x: number;
  y: number;
  /** 'splat' (street paint on the comic hull) · 'pow' (a comic sticker on la Lata) · 'tag' */
  kind: 'splat' | 'pow' | 'tag';
  color: number;
  seed: number;
}

export class TeStage implements StageApi {
  verbs = { ...TE_VERBS, ...SHOT_VERBS };
  palettes = TE_PALETTES;
  /** the prompts in spray colors (no katakana: that's NEÓN CEL's) */
  promptTheme = { ink: INK, paper: WALL, hot: FLUO.yellow, body: 0x2a2730, mash: FLUO.pink, dim: 0x8a8592, kata: false };
  props: Record<string, number | string> = {
    pal: 'tvoid',
    'cam.x': 960,
    'cam.y': 520,
    'cam.zoom': 1,
    style: 1,
    rifts: 0,
    grid: 0,
    'A.x': 0,
    'A.y': 0,
    'B.x': 0,
    'B.y': 0,
    'B.rot': 0,
    brecha: 'hang',
    grafitera: 'deck',
    sig: 0,
    xerox: 0,
    phos: 0,
    low: 0,
    pix: 0,
    dim: 0,
    wallTags: 1,
    burst: 0,
  };
  readonly studio: Studio;
  readonly book: SprayBook;
  readonly signal: SignalFilter;
  post: StageApi['post'];
  private pxScale = 1;
  // ---- layers
  private bgComic = new Container();
  private bgStreetC = new Container();
  private bgStreet = new Graphics();
  private wallTagsC = new Container();
  private wallFx = new Graphics();
  private twinkle = new Graphics();
  private comicW = new Container();
  private streetW = new Container();
  private rocks: { c: Graphics; s: Graphics; x: number; y: number; r: number }[] = [];
  readonly A = new Ship((g, a) => drawOurShip(g, a));
  readonly B = new Ship((g, a) => drawLata(g, a));
  private actorsC = new Container();
  private onsetFx = new Graphics();
  private edge = new Graphics();
  private gridG = new Graphics();
  // masks (screen space): where the street art shows / where the comic shows
  private maskBgS = new Graphics();
  private maskWS = new Graphics();
  private maskWC = new Graphics();
  // ---- actors
  actors: Partial<Record<Who, Actor>> = {};
  slugs: Record<Who, string> = { canelo: 'canelo_astral_cat', luzterna: 'luzterna', crew: '', brecha: 'brecha_crowbar_cat', grafitera: 'grafitera_spray_cat', hueco: 'hueco_hole_cat', ecomudo: 'ecomudo_static_cat' };
  /** comic / street paintings per actor key */
  private tex = new Map<string, { comic: Texture; street: Texture }>();
  private ownTex: Texture[] = [];
  // ---- derived from the score
  private wallTags: { m: number; x: number; y: number; word: string; color: number; rot: number; s: number; seed: number; sp?: Sprite }[] = [];
  private gridEv: { m: number; i: number; fix: boolean }[] = [];
  // ---- per frame
  private poses = new Map<Who, PoseReq>();
  private jolts: { ship: 'A' | 'B'; dx: number; dy: number; rot: number }[] = [];
  private patches: Patch[] = [];
  private patchStep = -1;
  private anchors = new Map<string, [number, number]>();
  /** tuned moments of the broken tape (verbs push [from, to]) and the ¿ABRIR? answer — the crack shot reads them */
  tunes: [number, number][] = [];
  openWith: { m: number; left: boolean } | null = null;
  tuneAt(m: number): number {
    let v = 0;
    for (const [a, b] of this.tunes) if (m >= a && m < b) v = Math.max(v, Math.min(1, (m - a) / 0.08, (b - m) / 0.3));
    return v;
  }
  /** the wall tag a 'wallTag' cue at m paints (for its puff) */
  wallTagAt(m: number) {
    return this.wallTags.find((t) => Math.abs(t.m - m) < 1e-3) ?? null;
  }
  /** a cat's painting in one art (posters, close-ups) */
  paint(slug: string, art: Art): Texture | null {
    const t = this.tex.get(slug);
    return t ? t[art] : null;
  }
  /** where the front is this frame (screen x at y = 0 and at y = H) and the rifts (screen) */
  front = { s: 1, x0: 0, x1: 0, riftA: [0, 0, 0] as number[], riftB: [0, 0, 0] as number[] };

  constructor(private k: Kit) {
    this.studio = new Studio(k.renderer, k.quality === 'high', COMIC_CEL);
    this.book = new SprayBook(k.renderer);
    const r = k.renderer;
    this.pxScale = Math.max(0.5, ((r.screen?.width ?? W) / (k.view.w || W)) * (r.resolution || 1));
    this.signal = new SignalFilter(this.pxScale);
    const sig = this.signal;
    this.post = { filters: [sig], live: () => sig.live };
  }

  async build(k: Kit) {
    this.slugs.canelo = caneloSlug();
    const crew = k.crew.filter((s) => s && !Object.values(this.slugs).includes(s)).slice(0, 1);
    this.slugs.crew = crew[0] ?? '';
    await Promise.all([loadFonts(), this.studio.loadAll(Object.values(this.slugs).filter(Boolean))]);
    // the street painting of every cat (a stencil re-spray of its comic bake)
    for (const who of Object.keys(this.slugs) as Who[]) {
      const slug = this.slugs[who];
      if (!slug || !this.studio.has(slug)) continue;
      const still = this.studio.still(slug);
      if (!still) continue;
      const comic = still.texture;
      still.destroy();
      const street = bakeStencil(k.renderer, comic, { halo: HOMES[who].halo });
      this.ownTex.push(street);
      this.tex.set(slug, { comic, street });
    }
    const L = k.layers;
    const v = k.view;
    {
      const base = new Graphics();
      const top = new Graphics();
      drawVoidComic(base, v, 5, top);
      this.bgComic.addChild(base, benDayLayer(k.renderer, v.x - 20, v.y + v.h * 0.5, v.w + 40, v.h * 0.55, 22, 0.5, 7, 0x2e4aa0, 1), top);
    }
    drawVoidStreet(this.bgStreet, v);
    // big faded murals on the wall (the canon graffiti of H55)
    const mural = (text: string, x: number, y: number, size: number, color: number, rot: number, alpha: number) => {
      const sp = this.book.sprite(text, { kind: 'tag', size, color, halo: color, seed: size });
      sp.position.set(x, y);
      sp.rotation = rot;
      sp.alpha = alpha;
      sp.scale.set(Math.min(1, (v.w * 0.92) / sp.width));
      return sp;
    };
    const murals = [mural('NINGUNA CAJA ES HOGAR', v.x + v.w * 0.42, v.y + v.h * 0.16, 130, FLUO.pink, -0.04, 0.2), mural('DISRUPTORES', v.x + v.w * 0.55, v.y + v.h * 0.83, 170, FLUO.green, 0.03, 0.16)];
    this.bgStreetC.addChild(this.bgStreet, ...murals, this.wallTagsC, this.wallFx);
    L.bg.addChild(this.bgComic, this.twinkle, this.bgStreetC, this.maskBgS);
    // rocks (the battle's debris)
    for (const [x, y, r, s] of [
      [900, 330, 46, 3],
      [1030, 560, 38, 4],
    ] as const) {
      const c = drawRock(new Graphics(), r, 'comic', s);
      const st = drawRock(new Graphics(), r, 'street', s);
      c.position.set(x, y);
      st.position.set(x, y);
      this.comicW.addChild(c);
      this.streetW.addChild(st);
      this.rocks.push({ c, s: st, x, y, r });
    }
    this.comicW.addChild(this.A.comic, this.B.comic);
    this.streetW.addChild(this.A.street, this.B.street);
    L.world.addChild(this.comicW, this.streetW, this.actorsC);
    L.world.addChild(L.wfx);
    L.wfx.addChild(this.onsetFx);
    L.screen.addChild(this.gridG, this.edge, this.maskWS, this.maskWC);
    // actors
    for (const who of Object.keys(HOMES) as Who[]) {
      const slug = this.slugs[who];
      if (!slug || !this.studio.has(slug)) continue;
      const a = new Actor(this.studio, slug, HOMES[who].size);
      this.actors[who] = a;
      this.actorsC.addChild(a);
    }
    // what the score says, precomputed (wall tags appear on their cues; panel borders break / get redrawn)
    const R = rng(55);
    const WORDS = ['¡ABRAN!', 'SIN CAJA', 'RESPIRA', 'NOP', 'DISRUPT', '¡FUERA!', 'LIBRES', 'TE ODIO'];
    const COLS = [FLUO.pink, FLUO.green, FLUO.cyan, FLUO.orange, FLUO.yellow, FLUO.violet];
    for (const c of k.score.cues) {
      if (c.act.verb === 'wallTag') {
        const i = this.wallTags.length;
        const word = typeof c.act.args.word === 'string' ? (c.act.args.word as string) : WORDS[i % WORDS.length];
        // slots along the upper wall (never on the ships), filled in an order that spreads them out
        const SLOTS: [number, number][] = [[0.14, 0.12], [0.62, 0.28], [0.36, 0.1], [0.86, 0.12], [0.24, 0.3], [0.5, 0.08], [0.78, 0.33], [0.07, 0.36], [0.95, 0.27], [0.42, 0.34]];
        const [sx, sy] = SLOTS[i % SLOTS.length];
        this.wallTags.push({ m: c.m, x: v.x + v.w * (sx + (R() - 0.5) * 0.04), y: v.y + v.h * (sy + (R() - 0.5) * 0.03), word, color: COLS[i % COLS.length], rot: (R() - 0.5) * 0.3, s: 0.42 + R() * 0.22, seed: 300 + i });
      } else if (c.act.verb === 'gridBreak' || c.act.verb === 'gridFix') this.gridEv.push({ m: c.m, i: Number(c.act.args.i ?? 0), fix: c.act.verb === 'gridFix' });
    }
    this.gridEv.sort((a, b) => a.m - b.m);
    for (const t of this.wallTags) {
      const sp = this.book.sprite(t.word, { kind: 'tag', size: 110, color: t.color, halo: t.color, seed: t.seed });
      sp.position.set(t.x, t.y);
      sp.rotation = t.rot;
      sp.scale.set(t.s);
      sp.visible = false;
      t.sp = sp;
      this.wallTagsC.addChild(sp);
    }
  }

  // ---------------------------------------------------------------- requests from clips
  wantPose(who: Who, req: PoseReq) {
    this.poses.set(who, req);
  }
  wantJolt(ship: 'A' | 'B', j: Partial<{ dx: number; dy: number; rot: number }>) {
    this.jolts.push({ ship, dx: j.dx ?? 0, dy: j.dy ?? 0, rot: j.rot ?? 0 });
  }
  /** a hit left paint on a hull: stays for the rest of the Momento (ship-local; once per seed) */
  addPatch(p: Patch) {
    if (this.patches.some((x) => x.seed === p.seed)) return;
    this.patches.push(p);
    this.patches.sort((a, b) => a.m - b.m);
    this.patchStep = -1;
  }
  ship(s: 'A' | 'B') {
    return s === 'A' ? this.A : this.B;
  }
  /** world position of an actor's head */
  head(who: Who): [number, number] {
    const a = this.actors[who];
    if (!a) return [W / 2, H / 2];
    const [hx, hy] = a.head();
    const p = a.toGlobal({ x: hx, y: hy });
    const w = this.k.layers.world.toLocal(p);
    return [w.x, w.y];
  }
  /** the home (world) of an actor this frame */
  home(who: Who): [number, number] {
    const h = HOMES[who];
    return this.ship(h.ship).world(h.x, h.y);
  }
  /** is a SCREEN point in the street art this frame */
  isStreet(sx: number, sy: number): boolean {
    const f = this.front;
    let street: boolean;
    if (f.s >= 0.999) street = true;
    else if (f.s <= 0.001) street = false;
    else {
      const t = (sy - this.k.view.y) / Math.max(1, this.k.view.h);
      street = sx > f.x0 + (f.x1 - f.x0) * t;
    }
    if (f.riftA[2] > 1 || f.riftB[2] > 1) {
      for (const r of [f.riftA, f.riftB]) if (r[2] > 1 && Math.hypot((sx - r[0]) / (r[2] * 0.62), (sy - r[1]) / r[2]) < 1) street = !street;
    }
    return street;
  }
  /** the art at a world point */
  artAt(wx: number, wy: number): Art {
    const [sx, sy] = this.k.cam.toScreen(wx, wy);
    return this.isStreet(sx, sy) ? 'street' : 'comic';
  }

  // ---------------------------------------------------------------- per frame
  update(k: Kit, m: number) {
    this.poses.clear();
    this.jolts.length = 0;
    this.signal.reset();
    // base signal from the keys (the filtered section, the zine moments…)
    this.signal.max({ scan: k.num('sig', 0) * 0.8, rgb: k.num('sig', 0) * 2.2, noise: k.num('sig', 0) * 0.25, low: k.num('low', 0), phos: k.num('phos', 0), xerox: k.num('xerox', 0), pixel: k.num('pix', 0), dim: k.num('dim', 0) });
    const motion = k.reduceMotion ? 0.3 : 1;
    // ---- every sound has a purpose
    const kick = k.env('kick', m, 0.09, 0.15);
    k.cam.punch(0.012 * kick);
    const bassE = k.env('bass', m, 0.35, 0.15);
    const bn = k.last('bass', m, 0.15);
    const sub = bn && bn.o.midi !== null && bn.o.midi !== undefined && bn.o.midi < 34 && m - bn.o.t < 0.22 ? 1 - (m - bn.o.t) / 0.22 : 0;
    if (sub > 0) {
      // the 808 hits like a wall impact
      k.cam.shake(7 * sub * motion, m, 9, 20);
      this.signal.max({ rgb: 2.4 * sub * (k.num('style', 1) > 0.5 ? 1 : 0.4) });
    }
    // the wall breathes with the 808
    const bgS = 1 + 0.006 * bassE * motion;
    for (const c of [this.bgComic, this.bgStreetC]) {
      c.scale.set(bgS);
      c.position.set((W / 2) * (1 - bgS), (H / 2) * (1 - bgS));
    }
    this.updateFront(k, m);
    this.drawWall(k, m, bassE);
  }

  /** the front between the two arts + the masks */
  private updateFront(k: Kit, m: number) {
    const v = k.view;
    const s = Math.max(0, Math.min(1, k.num('style', 1)));
    const tilt = 150;
    const xb = v.x + v.w * (1 - s);
    const f = this.front;
    f.s = s;
    f.x0 = xb + tilt;
    f.x1 = xb - tilt;
    // the rifts (world anchors → screen); radius in screen px
    const ro = k.num('rifts', 0);
    const [ax, ay] = k.cam.toScreen(700, 300);
    const [bx, by] = k.cam.toScreen(1230, 330);
    const rr = ro * 250 * k.cam.zoom;
    const wob = (i: number) => 1 + 0.05 * Math.sin(m * 7 + i);
    f.riftA = [ax, ay, rr * wob(0)];
    f.riftB = [bx, by, rr * wob(2)];
    const mixed = s > 0.001 && s < 0.999;
    const rifted = rr > 1;
    // the street regions: right of the front (XOR the rifts)
    const drawStreetRegion = (g: Graphics) => {
      g.clear();
      const B = 300;
      if (s >= 0.999) g.rect(v.x - B, v.y - B, v.w + 2 * B, v.h + 2 * B).fill(0xffffff);
      else if (s > 0.001) g.poly([f.x0, v.y - B, v.x + v.w + B, v.y - B, v.x + v.w + B, v.y + v.h + B, f.x1 - tilt * 0.6, v.y + v.h + B]).fill(0xffffff);
      if (rifted) {
        if (s >= 0.999) {
          for (const r of [f.riftA, f.riftB]) g.ellipse(r[0], r[1], r[2] * 0.62, r[2]).cut();
        } else if (s <= 0.001) for (const r of [f.riftA, f.riftB]) g.ellipse(r[0], r[1], r[2] * 0.62, r[2]).fill(0xffffff);
      }
    };
    const drawComicRegion = (g: Graphics) => {
      g.clear();
      const B = 300;
      if (s <= 0.001) g.rect(v.x - B, v.y - B, v.w + 2 * B, v.h + 2 * B).fill(0xffffff);
      else if (s < 0.999) g.poly([v.x - B, v.y - B, f.x0, v.y - B, f.x1 - tilt * 0.6, v.y + v.h + B, v.x - B, v.y + v.h + B]).fill(0xffffff);
      if (rifted) {
        if (s <= 0.001) {
          for (const r of [f.riftA, f.riftB]) g.ellipse(r[0], r[1], r[2] * 0.62, r[2]).cut();
        } else if (s >= 0.999) for (const r of [f.riftA, f.riftB]) g.ellipse(r[0], r[1], r[2] * 0.62, r[2]).fill(0xffffff);
      }
    };
    // street background
    const allStreet = s >= 0.999 && !rifted;
    const allComic = s <= 0.001 && !rifted;
    this.bgStreetC.visible = !allComic;
    this.bgComic.visible = !allStreet;
    this.twinkle.visible = !allStreet;
    this.streetW.visible = !allComic;
    this.comicW.visible = !allStreet;
    if (mixed || rifted) {
      drawStreetRegion(this.maskBgS);
      drawStreetRegion(this.maskWS);
      drawComicRegion(this.maskWC);
      this.bgStreetC.mask = this.maskBgS;
      this.streetW.mask = this.maskWS;
      this.comicW.mask = this.maskWC;
    } else {
      this.bgStreetC.mask = null;
      this.streetW.mask = null;
      this.comicW.mask = null;
      this.maskBgS.clear();
      this.maskWS.clear();
      this.maskWC.clear();
    }
    // the front itself: a panel border on the comic side, overspray + torn paper on the street side
    const e = this.edge;
    e.clear();
    if (rifted && !k.fullFrame) {
      // the rifts' lips: a crackling green/pink rim, on twos
      const st = Math.floor(m * 12);
      for (const [i, r] of [f.riftA, f.riftB].entries()) {
        const R = rng(st * 3 + i);
        const col = i ? FLUO.pink : FLUO.green;
        e.ellipse(r[0], r[1], r[2] * 0.62 + 30, r[2] + 30).stroke({ width: 40, color: col, alpha: 0.12 });
        e.ellipse(r[0], r[1], r[2] * 0.62 + 10, r[2] + 10).stroke({ width: 16, color: col, alpha: 0.5 });
        const pts: number[] = [];
        for (let j = 0; j <= 28; j++) {
          const an = (j / 28) * Math.PI * 2;
          const jag = 1 + (R() - 0.5) * 0.1;
          pts.push(r[0] + Math.cos(an) * r[2] * 0.62 * jag, r[1] + Math.sin(an) * r[2] * jag);
        }
        e.poly(pts).stroke({ width: 6, color: 0xffffff, join: 'miter' });
        for (let j = 0; j < 5; j++) {
          const an = R() * Math.PI * 2;
          const x0 = r[0] + Math.cos(an) * r[2] * 0.62;
          const y0 = r[1] + Math.sin(an) * r[2];
          e.moveTo(x0, y0).lineTo(x0 + Math.cos(an) * 50 + (R() - 0.5) * 30, y0 + Math.sin(an) * 50 + (R() - 0.5) * 30).stroke({ width: 4, color: col });
        }
      }
    }
    if (mixed && !k.fullFrame) {
      const B = 60;
      const top: [number, number] = [f.x0, v.y - B];
      const bot: [number, number] = [f.x1 - tilt * 0.6 * ((v.h + 2 * B) / (v.h + 600)), v.y + v.h + B];
      // gutter (white) + black panel line
      e.moveTo(top[0] - 16, top[1]).lineTo(bot[0] - 16, bot[1]).stroke({ width: 26, color: PRINT.paper });
      e.moveTo(top[0] - 30, top[1]).lineTo(bot[0] - 30, bot[1]).stroke({ width: 9, color: COMIC_INK });
      // street side: ragged overspray
      const st = Math.floor(m * 12);
      sprayLine(e, [top[0] + 4, top[1], (top[0] + bot[0]) / 2 + 10, (top[1] + bot[1]) / 2, bot[0] + 4, bot[1]], 10, k.pal.accent, 900 + st, { alpha: 0.9, speck: 1.4 });
    }
  }

  /** wall tags (persistent, from the score), the melody glow, the comic twinkles */
  private drawWall(k: Kit, m: number, bassE: number) {
    const on = k.num('wallTags', 1) > 0.5;
    for (const t of this.wallTags) {
      if (!t.sp) continue;
      const age = m - t.m;
      t.sp.visible = on && age >= 0;
      if (age < 0) continue;
      // sprayed in over a few frames (on twos), then the drips keep breathing with the 808
      const a = Math.min(1, Math.floor(age * 12) / 3);
      t.sp.alpha = a;
      t.sp.scale.set(t.s * (age < 0.12 ? 1.12 : 1));
    }
    // melody: strong attacks make the tags glow (street) / stars twinkle (comic)
    const g = this.wallFx;
    g.clear();
    const mel = k.last('melody', m, 0.4);
    const tw = this.twinkle;
    tw.clear();
    if (mel && m - mel.o.t < 0.3) {
      const x = 1 - (m - mel.o.t) / 0.3;
      const R = rng(mel.i * 7 + 1);
      const v = k.view;
      for (let i = 0; i < 3; i++) {
        const px = v.x + R() * v.w;
        const py = v.y + R() * v.h * 0.7;
        sprayStar(g, px, py, 3 + 5 * x, [FLUO.cyan, FLUO.pink, FLUO.green][i], x);
        comicStar(tw, px, py, 6 + 16 * x);
      }
    }
    void bassE;
  }

  late(k: Kit, m: number) {
    const st = Math.floor(m * 12) / 12;
    const kickE = k.env('kick', m, 0.1, 0.15) * (k.reduceMotion ? 0.4 : 1);
    const bassE = k.env('bass', m, 0.4, 0.15) * (k.reduceMotion ? 0.4 : 1);
    const bn = k.last('bass', m, 0.15);
    const sway = bn ? bassE * (0.01 + 0.016 * Math.max(0, Math.min(1, (40 - (bn.o.midi ?? 36)) / 12))) * (bn.i % 2 ? 1 : -1) : 0;
    // ---- ships: drift in the void + the music
    for (const s of ['A', 'B'] as const) {
      const sh = this.ship(s);
      const base = s === 'A' ? [A_X + k.num('A.x'), BASE_Y + k.num('A.y')] : [B_X + k.num('B.x'), BASE_Y - 20 + k.num('B.y')];
      let dx = 0;
      let dy = Math.sin(st * 1.7 + (s === 'A' ? 0 : 1.4)) * 9 + 8 * kickE;
      let rot = (s === 'B' ? k.num('B.rot') : 0) + Math.sin(st * 1.3 + (s === 'A' ? 0.4 : 0)) * 0.016 + sway * (s === 'A' ? 1 : -1);
      for (const j of this.jolts) {
        if (j.ship !== s) continue;
        dx += j.dx;
        dy += j.dy;
        rot += j.rot;
      }
      sh.x = base[0] + dx;
      sh.y = base[1] + dy;
      sh.rot = rot;
      sh.sx = 1 + 0.018 * kickE;
      sh.sy = 1 - 0.024 * kickE;
      sh.apply();
    }
    for (const r of this.rocks) {
      const yy = r.y + Math.sin(st * 1.1 + r.x) * 12;
      r.c.position.set(r.x, yy);
      r.s.position.set(r.x, yy);
      r.c.rotation = r.s.rotation = st * 0.15 + r.x;
    }
    // ---- hull paint (persistent)
    const sst = Math.floor(m * 12);
    if (sst !== this.patchStep) {
      this.patchStep = sst;
      for (const s of ['A', 'B'] as const) {
        const sh = this.ship(s);
        sh.patchC.clear();
        sh.patchS.clear();
        for (const p of this.patches) {
          if (p.ship !== s || p.m > m) continue;
          const age = m - p.m;
          const grow = Math.min(1, age / 0.1);
          for (const [g, art] of [
            [sh.patchC, 'comic'],
            [sh.patchS, 'street'],
          ] as const) {
            if (p.kind === 'pow') {
              // a comic sticker: their spray can came back as a POW
              g.circle(p.x, p.y, 34 * grow).fill(art === 'comic' ? PRINT.yellow : FLUO.yellow).stroke({ width: 5, color: art === 'comic' ? COMIC_INK : INK });
              g.circle(p.x, p.y, 16 * grow).fill(art === 'comic' ? PRINT.red : FLUO.orange);
            } else {
              splat(g, p.x, p.y, 34 * grow, p.color, p.seed, { ink: art === 'comic' ? COMIC_INK : undefined });
              drips(g, p.x, p.y + 14, 40, 3, Math.min(1, age / 1.4), p.color, p.seed + 1);
            }
          }
        }
      }
    }
    // ---- onset FX: la Lata's spray cannons puff on kicks, spray mist on the hats
    this.drawOnsetFx(k, m);
    // ---- actors
    this.poseActors(k, m);
    // ---- the comic panel grid (the box) over the world
    this.drawGrid(k, m);
    // ---- anchors (screen)
    const sc = (wx: number, wy: number) => k.cam.toScreen(wx, wy);
    for (const who of Object.keys(HOMES) as Who[]) {
      if (!this.actors[who]) continue;
      const [hx, hy] = this.head(who);
      this.anchors.set(who, sc(hx, hy - 160));
      this.anchors.set(`${who}Head`, sc(hx, hy));
    }
    const [ax, ay] = this.A.world(0, -260);
    const [bx, by] = this.B.world(0, -300);
    this.anchors.set('shipA', sc(ax, ay));
    this.anchors.set('shipB', sc(bx, by));
    this.anchors.set('riftA', [this.front.riftA[0], this.front.riftA[1]]);
    this.anchors.set('riftB', [this.front.riftB[0], this.front.riftB[1]]);
    // the prompt sits on the rift's rim (upper left), never over Canelo's face inside it
    const rA = this.front.riftA;
    this.anchors.set('riftARim', [rA[0] - Math.max(150, rA[2] * 0.62) * 0.92, rA[1] - Math.max(150, rA[2]) * 0.38]);
    // commit the frame's signal (reduce motion calms the displacing parts)
    this.signal.commit(m, Math.floor(m * 12) % 97, k.reduceMotion ? 0.25 : 1, k.reduceFlashes);
  }

  private drawOnsetFx(k: Kit, m: number) {
    const g = this.onsetFx;
    g.clear();
    if (k.fullFrame) return;
    const kicks = k.onsetList('kick');
    const x = k.last('kick', m, 0.3);
    const cannons = [-218, -86, 168];
    if (x) {
      for (let i = x.i; i >= 0 && i > x.i - 4; i--) {
        const o = kicks[i];
        const age = m - o.t;
        if (age > 0.5) break;
        if (o.strength < 0.3) continue;
        const [mx, my] = this.B.world(cannons[i % 3] - 60, -168);
        const art = this.artAt(mx, my);
        const r = (14 + 70 * Math.min(1, age / 0.35)) * (1 + k.num('burst', 0));
        const al = Math.max(0, 1 - age / 0.5);
        const col = [FLUO.pink, FLUO.green, FLUO.cyan][i % 3];
        if (art === 'street') {
          g.circle(mx - age * 260, my - age * 40, r * 1.6).fill({ color: col, alpha: 0.12 * al });
          g.circle(mx - age * 260, my - age * 40, r).fill({ color: col, alpha: 0.32 * al });
          for (let j = 0; j < 7; j++) g.circle(mx - age * 300 - j * 12, my + Math.sin(i + j) * r * 0.8, 2 + (j % 3)).fill({ color: col, alpha: al });
        } else {
          // comic: three round puffs with an ink line
          for (let j = 0; j < 3; j++) g.circle(mx - age * 240 - j * r * 0.7, my - j * 8, r * (0.7 - j * 0.12)).fill({ color: 0xffffff, alpha: al }).stroke({ width: 4, color: COMIC_INK, alpha: al });
        }
      }
    }
    // hats: spray mist from Grafitera's can
    const gr = this.actors.grafitera;
    if (gr && gr.visible) {
      const ph = k.last('perc', m, 0.2);
      if (ph && m - ph.o.t < 0.2) {
        const [hx, hy] = this.head('grafitera');
        const a = 1 - (m - ph.o.t) / 0.2;
        const R = rng(ph.i * 3 + 7);
        for (let j = 0; j < 9; j++) g.circle(hx - 90 - R() * 80, hy + 40 + (R() - 0.5) * 60, 1.5 + R() * 3).fill({ color: FLUO.green, alpha: a * 0.9 });
      }
    }
  }

  private poseActors(k: Kit, m: number) {
    const voxE = k.env('vox', m, 0.12, 0.35);
    const kickE = k.env('kick', m, 0.1, 0.15) * (k.reduceMotion ? 0.4 : 1);
    const beatPh = ((m % k.beat) + k.beat) % k.beat;
    const bob = Math.max(0, 1 - beatPh / (k.beat * 0.3));
    for (const who of Object.keys(this.actors) as Who[]) {
      const a = this.actors[who]!;
      const h = HOMES[who];
      const req = this.poses.get(who);
      // default stance by state
      let name = 'idle';
      if (who === 'brecha') {
        const s = k.str('brecha', 'hang');
        name = s === 'hang' ? 'hang' : s === 'gone' ? 'idle' : 'idle';
        a.visible = s !== 'gone';
      }
      const [hx, hy] = this.home(who);
      let x = hx;
      let y = hy;
      // Brecha aboard: she takes the bow, Canelo and the crew step back toward the mast (a readable face-off)
      const aboard = k.str('brecha', 'hang') === 'ours';
      if (who === 'brecha' && aboard) [x, y] = this.A.world(300, -132);
      if (who === 'canelo' && aboard) [x, y] = this.A.world(30, -132);
      if (who === 'crew' && aboard) [x, y] = this.A.world(-130, -132);
      if (who === 'brecha' && k.str('brecha', 'hang') === 'deck') [x, y] = this.B.world(-130, -146);
      let rot = 0;
      let sx = 1;
      let sy = 1;
      let alpha = 1;
      let flip = h.ship === 'B';
      if (who === 'luzterna') {
        y += Math.sin(m * 2.4) * 14;
        alpha = 0.95;
      } else if (name !== 'hang') {
        y -= bob * 6;
        sy = 1 - bob * 0.03;
        sx = 1 + bob * 0.02;
      }
      if (who === 'brecha' && voxE > 0.2) sy *= 1 + voxE * 0.05;
      if (who === 'brecha' && k.str('brecha', 'hang') === 'ours') flip = true;
      const P = POSES[req?.name ?? name]?.(req?.lt ?? m) ?? {};
      if (req?.x !== undefined) x = req.x;
      if (req?.y !== undefined) y = req.y;
      if (req?.flip !== undefined) flip = req.flip;
      x += P.dx ?? 0;
      y += P.dy ?? 0;
      rot += (P.rot ?? 0) + (req?.rot ?? 0);
      // hanging from the yard, whatever she does she does upside down
      if (who === 'brecha' && name === 'hang' && req && req.name !== 'hang' && req.name !== 'fly' && req.x === undefined) rot += Math.PI;
      sx *= (P.sx ?? 1) * (req?.s ?? 1);
      sy *= (P.sy ?? 1) * (req?.s ?? 1);
      if (P.hide) alpha = 0;
      if (a.puppet) {
        a.puppet.lean = P.lean ?? 0;
        a.puppet.crouch = P.crouch ?? 0;
        if (P.look !== undefined) a.puppet.look = P.look;
      }
      a.pose(m, x, y + kickE * 4, { rot, sx, sy, flip, alpha, step: k.beatStep(m) });
      // which painting it wears: the art of the side it stands on
      const t = this.tex.get(this.slugs[who]);
      if (t && a.puppet) {
        const [sx2, sy2] = k.cam.toScreen(x, y - h.size * 0.5);
        const ov = k.str(`art.${who}`, 'auto');
        const want = ov === 'street' ? t.street : ov === 'comic' ? t.comic : this.isStreet(sx2, sy2) ? t.street : t.comic;
        if (a.puppet.texture !== want) a.puppet.texture = want;
      }
    }
  }

  /** the box's panel grid (screen space): 3 × 2 panels; broken borders from the score */
  private drawGrid(k: Kit, m: number) {
    const g = this.gridG;
    g.clear();
    const gv = k.num('grid', 0);
    if (gv <= 0.01 || k.fullFrame) return;
    const v = k.view;
    const broken = new Set<number>();
    for (const e of this.gridEv) {
      if (e.m > m) break;
      if (e.fix) broken.delete(e.i);
      else broken.add(e.i);
    }
    // borders: 0,1 = verticals (x = 1/3, 2/3) · 2 = horizontal (y = 1/2) · 3 = the outer frame
    const lines: [number, number, number, number][] = [
      // gutters between the subjects, not through them: us | them | the margin, and a strip over our stern
      [v.x + v.w * 0.515, v.y, v.x + v.w * 0.485, v.y + v.h],
      [v.x + v.w * 0.885, v.y, v.x + v.w * 0.905, v.y + v.h],
      [v.x, v.y + v.h * 0.25, v.x + v.w * 0.505, v.y + v.h * 0.22],
    ];
    const al = Math.min(1, gv);
    lines.forEach(([x0, y0, x1, y1], i) => {
      if (broken.has(i)) {
        // a broken border: shattered stubs + flying chips (on twos)
        const R = rng(i * 13 + Math.floor(m * 12));
        for (let j = 0; j < 6; j++) {
          const t = R();
          const x = x0 + (x1 - x0) * t;
          const y = y0 + (y1 - y0) * t;
          g.rect(x - 12, y - 4, 24 + R() * 20, 8).fill({ color: COMIC_INK, alpha: 0.6 * al });
        }
        return;
      }
      g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: 30, color: PRINT.paper, alpha: al });
      g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: 30, color: COMIC_INK, alpha: al * 0.0 });
      g.moveTo(x0 - 15, y0).lineTo(x1 - 15, y1).stroke({ width: 6, color: COMIC_INK, alpha: al });
      g.moveTo(x0 + 15, y0).lineTo(x1 + 15, y1).stroke({ width: 6, color: COMIC_INK, alpha: al });
    });
    if (!broken.has(3)) {
      g.rect(v.x + 10, v.y + 10, v.w - 20, v.h - 20).stroke({ width: 22, color: PRINT.paper, alpha: al });
      g.rect(v.x + 24, v.y + 24, v.w - 48, v.h - 48).stroke({ width: 6, color: COMIC_INK, alpha: al });
    }
  }

  anchor(name: string): [number, number] | null {
    return this.anchors.get(name) ?? null;
  }

  /** heavy clip contents built BEFORE the clock (verb body) and drawn once off-screen (shapes tessellated, masks and
   * textures bound): their mount only parents them. Freed with the stage. */
  private prebuilt: Container[] = [];
  private warmRT: RenderTexture | null = null;
  prebuild<T extends Container>(c: T): T {
    this.prebuilt.push(c);
    try {
      this.warmRT ??= RenderTexture.create({ width: 64, height: 36 });
      this.k.renderer.render({ container: c, target: this.warmRT, clear: true });
    } catch (e) {
      console.warn('[te_odio] prebuild', e);
    }
    return c;
  }

  destroy() {
    for (const c of this.prebuilt) c.destroy({ children: true });
    this.prebuilt = [];
    this.warmRT?.destroy(true);
    this.warmRT = null;
    this.book.dispose();
    for (const t of this.ownTex) t.destroy(true);
    this.ownTex = [];
    this.tex.clear();
    this.signal.destroy();
    // the studio's textures may still be bound to the last frame: free them two frames later
    const studio = this.studio;
    let n = 0;
    const later = () => {
      if (++n < 3) return void requestAnimationFrame(later);
      studio.dispose();
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(later);
    else studio.dispose();
  }
}

export default function createStage(k: Kit): StageApi {
  return new TeStage(k);
}
