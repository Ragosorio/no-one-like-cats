/**
 * WHEN I LOSE — the set (H35: the duel with the Bibliotecario Ahogado inside the drowned reading hall).
 *
 * World space: the water is y = WATER; our sloop sits left (A_X) facing right, his galleon right (B_X) facing left,
 * between galleries of bookcases under a vault with a rose window. Behind his ship the Bibliotecario can rise as a
 * COLOSSUS from the water (prop 'giant'), holding the great book (prop 'book': open 0..1).
 *
 * The whole world is drawn in color and passes through the INK FILTER (ink.ts): props 'style.in' / 'style.out' and the
 * front ('front.x', 'front.y', 'front.r', 'front.soft' — design px) choose sumi-e or illumination per pixel; 'blank'
 * drains it to an empty page. The plates (plates.ts) get the same art through a second filter on the panels layer.
 *
 * Always on (every sound has a visible purpose):
 *   kick   → an ink drop on the water (rings) + a small camera punch + the hulls dip
 *   sub    → the 808 swells (E1, every 4 bars): the CAMERA SINKS, the water swells, the hall breathes
 *   accent → a page tears off a shelf and flutters down to the water
 *   bass   → the lamps sway, the water rocks with the pitch
 *   voices → gold letters rise from the water (while he hushes them: snuffed in ink), the choir glows
 *   melody → the gold leaf catches the light · perc → dust in the light shafts
 */
import { Container, Graphics, RenderTexture, Sprite, type TextStyleOptions } from 'pixi.js';
import type { Kit, StageApi } from '../../anime/kit';
import { W, H } from '../../anime/kit';
import { Actor, Studio } from '../../anime/actor';
import { rng } from '../../anime/draw';
import { lerpColor, type Palette } from '../../anime/palette';
import { ease } from '../../score';
import { G } from '../../../state/game';
import { catSlug } from '../../../state/sys/forms';
import { InkFilter, LOOK, bakeMiniature } from './ink';
import { A_X, B_X, C, Galleon, Sloop, WATER, bookcase, drawFarWall, driftBook, lamp } from './set';
import { FRAKTUR, WIL_VERBS, warmWords } from './verbs';
import { PLATE_VERBS } from './plates';

export type Who = 'canelo' | 'luzterna' | 'biblio' | 'giant' | 'archivista' | 'tintero' | 'marcapaginas' | 'crew0' | 'crew1';
export interface PoseReq {
  name: string;
  lt: number;
}
export const SHIP_S = 0.78;
/** the Fraktur letters the voices write */
export const GLYPHS = 'ABCDEFGHIKLMNOPRSTV';
export const GLYPH_STYLE = (size: number): TextStyleOptions => ({ fontFamily: 'UnifrakturMaguntia', fontSize: size, fill: 0xffe7a3, stroke: { color: 0x8a5a12, width: Math.max(2, size * 0.06) } });

/** the manuscript palettes (post grade only — the ink filter draws the art; tone 0: never NEÓN CEL's screentone) */
const pal = (name: string, o: Partial<Palette> & { grade: Palette['grade'] }): Palette => ({
  name,
  ink: LOOK.ink,
  shadow: 0x3a3240,
  base: 0x8a7a66,
  light: LOOK.paper,
  accent: C.vermilion,
  accent2: LOOK.gold,
  sky: [0x15131c, 0x2a2430, 0x3a3240],
  sea: [0x15131c, 0x0d0b12, 0x060509],
  ...o,
});
export const WIL_PALETTES: Record<string, Palette> = {
  /** the silence: sumi on paper, the vermilion of his seals */
  sumi: pal('sumi', { grade: { shade: 0x15131c, glow: 0xfff6e6, sat: 1, tone: 0, vignette: 0.42 } }),
  /** the break: his reign — a colder paper, heavier vignette */
  sello: pal('sello', { accent: 0xd23a22, grade: { shade: 0x0e0d14, glow: 0xf4f0ea, sat: 0.95, tone: 0, vignette: 0.55 } }),
  /** under the water: almost night, one gold flame */
  abismo: pal('abismo', { light: 0xe9e4da, accent: LOOK.gold, grade: { shade: 0x06070d, glow: 0xe9eef5, sat: 0.9, tone: 0, vignette: 0.7 } }),
  /** the voices break through: warm gold */
  oro: pal('oro', { ink: 0x2a170c, accent: LOOK.gold, accent2: C.lapis, light: 0xfff4d8, grade: { shade: 0x1c1430, glow: 0xfff1cc, sat: 1.06, tone: 0, vignette: 0.3 } }),
  /** the bridge: stained glass, cooler, deeper */
  vitral: pal('vitral', { ink: 0x1a1430, accent: 0x7fb6ff, accent2: LOOK.gold, light: 0xf3ecff, grade: { shade: 0x120c2a, glow: 0xf2ecff, sat: 1.1, tone: 0, vignette: 0.42 } }),
  /** the illuminated duel */
  duelo: pal('duelo', { ink: 0x2a170c, accent: C.vermilion, accent2: LOOK.gold, light: 0xfff2d6, grade: { shade: 0x1a1022, glow: 0xfff3dc, sat: 1.1, tone: 0, vignette: 0.35 } }),
  /** the valley: the page empties */
  valle: pal('valle', { ink: 0x2a2630, accent: LOOK.gold, light: 0xfffaf0, grade: { shade: 0x5a5560, glow: 0xffffff, sat: 0.55, tone: 0, vignette: 0.15 } }),
  /** the climax: ink AND gold */
  gloria: pal('gloria', { ink: 0x1a0f08, accent: LOOK.gold, accent2: C.vermilion, light: 0xfff6e2, grade: { shade: 0x1a0f08, glow: 0xfff7e0, sat: 1.15, tone: 0, vignette: 0.32 } }),
  /** the outro: evening light on the page */
  ocaso: pal('ocaso', { ink: 0x2a170c, accent: LOOK.gold, accent2: C.vermilion, light: 0xffeed2, grade: { shade: 0x2a1622, glow: 0xffe8c8, sat: 1.0, tone: 0, vignette: 0.45 } }),
};

/** Canelo as the player has him (his form), else the Almirante */
function caneloSlug(): string {
  try {
    const c = G.s?.cats?.find((x) => x.species === 'c_canelo');
    if (c) return catSlug(c);
  } catch {
    /* no save */
  }
  return 'canelo_admiral_cat';
}

const CHOIR = ['lantern_spirit_cat', 'archivista_scholar_cat', 'arcanito_lantern_cat', 'aurea_halo_cat', 'astral_tarot_cat', 'marcapaginas_bookmark_cat'];

interface Kicked {
  t: number;
  s: number;
  i: number;
}

export class WilStage implements StageApi {
  verbs = { ...WIL_VERBS, ...PLATE_VERBS };
  palettes = WIL_PALETTES;
  /** prompts in ink, paper and gold (never NEÓN CEL's indigo and yellow) */
  promptTheme = { ink: LOOK.ink, paper: LOOK.paper, hot: 0xe6b84a, body: 0x3a3240, mash: C.vermilion, dim: 0x8a8278, kata: false };
  props: Record<string, number | string> = {
    pal: 'sumi',
    'cam.x': W / 2,
    'cam.y': H / 2,
    'cam.zoom': 1,
    'style.in': 0,
    'style.out': 0,
    'front.x': W / 2,
    'front.y': H / 2,
    'front.r': -1,
    'front.soft': 120,
    blank: 0,
    line: 2.2,
    boil: 1,
    giant: 0,
    'giant.y': 0,
    book: 0,
    'book.y': 0,
    lantern: 0.35,
    choir: 0,
    glyphs: 0,
    hush: 1,
    pages: 0.4,
    flood: 0,
    rays: 0.3,
    'shipA.x': 0,
    'shipA.y': 0,
    'shipB.x': 0,
    'shipB.y': 0,
    lamps: 1,
    lfall: 0,
    mist: 0.6,
    'front.at': '',
  };
  studio!: Studio;
  /** the choir's silhouettes (lite paintings, cheap) */
  private choirStudio!: Studio;
  readonly ink: InkFilter;
  readonly inkP: InkFilter;
  // ---- layers
  private farWall = new Container();
  private rays = new Graphics();
  private lamps = new Container();
  private lampGs: Graphics[] = [];
  private giantC = new Container();
  private bookG = new Graphics();
  private midCases = new Container();
  /** atmospheric mist: the far hall fades into the paper (sumi-e depth); thinner once the gold comes */
  private mistFar = new Graphics();
  private mistNear = new Graphics();
  private backWater = new Graphics();
  private under = new Container();
  private underG = new Graphics();
  private shafts = new Graphics();
  private choirC = new Container();
  private choirSprites: Sprite[] = [];
  private choirHalo = new Graphics();
  readonly A = new Sloop();
  readonly B = new Galleon();
  private surf = new Graphics();
  private frontWater = new Graphics();
  private near = new Container();
  private nearG = new Graphics();
  private airPages = new Graphics();
  /** screen space, NOT inked: the gold of the voices and our lantern (the only color in the silence) */
  readonly glow = new Container();
  private glowG = new Graphics();
  private glyphSprites: Sprite[] = [];
  private gilt = new Graphics();
  // ---- actors
  actors: Partial<Record<Who, Actor>> = {};
  slugs: Record<Who, string> = {
    canelo: 'canelo_admiral_cat',
    luzterna: 'luzterna',
    biblio: 'bibliotecario_drowned_cat',
    giant: 'bibliotecario_drowned_cat',
    archivista: 'archivista_scholar_cat',
    tintero: 'tintero_ink_cat',
    marcapaginas: 'marcapaginas_bookmark_cat',
    crew0: '',
    crew1: '',
  };
  private poses = new Map<Who, PoseReq>();
  private jolts: { ship: 'A' | 'B'; dx: number; dy: number; rot: number }[] = [];
  /** the plates override the panels' ink filter this frame (null = follow the world) */
  plateStyle: { in: number; out: number; front: [number, number, number]; blank: number } | null = null;
  private anchors = new Map<string, [number, number]>();
  private subs: Kicked[] = [];
  private lastWaterStep = -1;
  private bookOpen = -1;
  private destroyed = false;

  constructor(private k: Kit) {
    this.ink = new InkFilter(k.quality === 'high');
    this.inkP = new InkFilter(k.quality === 'high');
  }

  async build(k: Kit) {
    this.slugs.canelo = caneloSlug();
    const crew = k.crew.filter((s) => s && !Object.values(this.slugs).includes(s)).slice(0, 2);
    this.slugs.crew0 = crew[0] ?? '';
    this.slugs.crew1 = crew[1] ?? '';
    this.studio = new Studio(k.renderer, k.quality === 'high', {}, bakeMiniature);
    this.choirStudio = new Studio(k.renderer, false, {}, bakeMiniature);
    const fonts = ['110px "Permanent Marker"', 'italic 700 90px "Playfair Display"', '90px "UnifrakturMaguntia"'].map((f) => document.fonts.load(f).catch(() => undefined));
    await Promise.all([this.studio.loadAll(Object.values(this.slugs).filter(Boolean)), this.choirStudio.loadAll(CHOIR), ...fonts]);
    const L = k.layers;
    // ---- world, back to front
    const wall = new Graphics();
    drawFarWall(wall);
    this.farWall.addChild(wall);
    this.rays.blendMode = 'add';
    for (let i = 0; i < 7; i++) {
      const g = new Graphics();
      lamp(g, 260 + (i % 3) * 140);
      g.position.set(-300 + i * 420, -260 + (i % 2) * 90);
      this.lampGs.push(g);
      this.lamps.addChild(g);
    }
    // the choir stands along the lower gallery (lit gold silhouettes; only once the voices break through)
    CHOIR.forEach((s, i) => {
      for (let j = 0; j < 2; j++) {
        // the paintings themselves (lite miniatures), each on a gold nimbus (drawChoir) — not flat gold blobs
        const sp = this.choirStudio.still(s, 0.5, 0.97);
        if (!sp) continue;
        const [, h] = this.choirStudio.size(s);
        sp.scale.set((j ? -1 : 1) * (170 / h), 170 / h);
        sp.position.set(-760 + (i * 2 + j) * 290 + (j ? 60 : 0), WATER - 600 - ((i + j) % 2) * 26);
        this.choirSprites.push(sp);
        this.choirC.addChild(sp);
      }
    });
    this.choirC.addChildAt(this.choirHalo, 0);
    // the colossus behind his ship
    const giant = new Actor(this.studio, this.slugs.giant, 1450);
    this.actors.giant = giant;
    this.giantC.addChild(giant, this.bookG);
    // bookcases standing in the water (two clusters, some drowned and tilted)
    const mc = new Graphics();
    for (const [x, w, h, s, seed] of [
      [-520, 380, 820, 0.95, 11],
      [-120, 300, 700, 0.9, 12],
      [1980, 360, 860, 0.95, 13],
      [2380, 300, 640, 0.9, 14],
    ] as const)
      bookcase(mc, x, WATER + 120, w, h, seed, s);
    const tilt = new Graphics();
    bookcase(tilt, -170, 0, 340, 760, 15, 0.9);
    tilt.position.set(860, WATER + 160);
    tilt.rotation = -0.18;
    const tilt2 = new Graphics();
    bookcase(tilt2, -150, 0, 300, 600, 16, 0.85);
    tilt2.position.set(160, WATER + 200);
    tilt2.rotation = 0.12;
    void tilt;
    this.midCases.addChild(tilt2, mc);
    this.under.addChild(this.underG);
    // the ships and their crews
    for (const s of [this.A, this.B]) s.scale.set(SHIP_S);
    const mk = (who: Who, size: number, parent: Container, x: number, y: number) => {
      if (!this.slugs[who]) return;
      const a = new Actor(this.studio, this.slugs[who], size);
      a.position.set(x, y);
      (a as Actor & { home?: [number, number] }).home = [x, y];
      parent.addChild(a);
      this.actors[who] = a;
    };
    mk('crew0', 170, this.A.deck, -200, -206);
    mk('crew1', 160, this.A.deck, -60, -206);
    mk('canelo', 280, this.A.deck, 150, -206);
    mk('luzterna', 230, this.A.deck, -150, -470);
    mk('archivista', 200, this.B.deck, 250, -232);
    mk('tintero', 160, this.B.deck, -260, -232);
    mk('marcapaginas', 130, this.B.deck, 120, -585);
    mk('biblio', 420, this.B.deck, -40, -232);
    if (this.actors.luzterna) this.actors.luzterna.alpha = 0.92;
    this.near.addChild(this.nearG, this.airPages);
    this.drawNear();
    for (const c of [this.farWall, this.rays, this.lamps, this.mistFar, this.giantC, this.mistNear, this.choirC, this.midCases, this.backWater, this.under, this.B, this.A, this.surf, this.frontWater, this.gilt]) L.world.addChild(c);
    L.world.addChild(L.wfx);
    L.world.addChild(this.near);
    // the ink art on the world and on the plates
    L.world.filters = [this.ink];
    L.panels.filters = [this.inkP];
    // the gold that the ink can't touch (screen space)
    this.glow.addChild(this.glowG);
    this.glowG.blendMode = 'add';
    for (let i = 0; i < 14; i++) {
      const sp = new Sprite();
      sp.anchor.set(0.5);
      sp.visible = false;
      this.glyphSprites.push(sp);
      this.glow.addChild(sp);
    }
    L.screen.addChildAt(this.glow, 0);
    // what the score says, precomputed: the 808 swells (the strongest E1 bass notes)
    this.subs = k
      .onsetList('bass')
      .map((o, i) => ({ t: o.t, s: o.strength, i }))
      .filter((o, i, all) => all[i].s >= 0.5 && (k.onsetList('bass')[o.i].midi ?? 0) <= 30);
    this.drawUnder();
  }

  /** plates built before the clock and not yet mounted (destroyed with the stage) */
  readonly prebuilt = new Set<Container>();
  private warmRT: RenderTexture | null = null;
  /** draw a container once off-screen: its shapes are tessellated and its textures bound before the clock */
  prewarmDraw(c: Container, target?: RenderTexture) {
    // through a throwaway wrapper: Pixi turns the container you render() into a render group for good, and a plate
    // or a layer that became one ignored its parent's mask later (a plate drew as a sliver)
    const parent = c.parent;
    const at = parent ? parent.getChildIndex(c) : -1;
    const wrap = new Container();
    try {
      this.warmRT ??= RenderTexture.create({ width: 64, height: 36 });
      wrap.addChild(c);
      this.k.renderer.render({ container: wrap, target: target ?? this.warmRT, clear: true });
    } catch (e) {
      console.warn('[when_i_lose] warm', e);
    } finally {
      if (parent) parent.addChildAt(c, at);
      else wrap.removeChild(c);
      wrap.destroy();
    }
  }

  prewarm(k: Kit) {
    for (const ch of GLYPHS) k.text.get(ch, GLYPH_STYLE(64));
    k.text.get('C', FRAKTUR(250, C.goldLight, 0x3a2410));
    // every word the score (and every branch) can write, baked before the clock
    for (const c of k.score.cues) warmWords(k, c.act.verb, c.act.args);
    for (const p of k.score.prompts) for (const list of Object.values(p.branches)) for (const a of list ?? []) warmWords(k, a.verb, a.args);
    // compile the ink filters and draw the WHOLE set once, off the clock — the parts that only appear later too (the
    // colossus, the choir, the drowned hall): their shapes are tessellated here, not on the frame they first show
    const hidden = [this.giantC, this.choirC, this.under].map((c) => [c, c.visible, c.alpha] as const);
    for (const [c] of hidden) {
      c.visible = true;
      c.alpha = 1;
    }
    // at the real screen size: the filters' textures are allocated now, not on the first frame of the song
    try {
      const sc = k.renderer.screen;
      const big = RenderTexture.create({ width: Math.max(64, sc.width), height: Math.max(36, sc.height), resolution: k.renderer.resolution });
      for (const c of [k.layers.world, k.layers.panels, k.layers.screen]) this.prewarmDraw(c, big);
      big.destroy(true);
    } catch (e) {
      console.warn('[when_i_lose] warm', e);
    }
    for (const [c, vis, al] of hidden) {
      c.visible = vis;
      c.alpha = al;
    }
  }

  // ---------------------------------------------------------------- requests from clips
  wantPose(who: Who, req: PoseReq) {
    this.poses.set(who, req);
  }
  wantJolt(ship: 'A' | 'B', j: Partial<{ dx: number; dy: number; rot: number }>) {
    this.jolts.push({ ship, dx: j.dx ?? 0, dy: j.dy ?? 0, rot: j.rot ?? 0 });
  }
  setAnchorP(name: string, p: [number, number]) {
    this.anchors.set(name, p);
  }

  // ---------------------------------------------------------------- geometry
  shipPos(s: 'A' | 'B') {
    const k = this.k;
    return s === 'A' ? { x: A_X + k.num('shipA.x'), y: WATER + k.num('shipA.y') } : { x: B_X + k.num('shipB.x'), y: WATER + k.num('shipB.y') };
  }
  /** a ship-local point → world (live transform) */
  world(s: 'A' | 'B', lx: number, ly: number): [number, number] {
    const c = s === 'A' ? this.A : this.B;
    const cos = Math.cos(c.rotation);
    const sin = Math.sin(c.rotation);
    return [c.x + (lx * cos - ly * sin) * c.scale.x, c.y + (lx * sin + ly * cos) * c.scale.y];
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
  /** the bow lantern (world) — at the chorus' hit it falls overboard and sinks, still burning ('lfall' 0..1) */
  lanternAt(): [number, number] {
    const bow = this.world('A', 470, -200);
    const f = this.k.num('lfall', 0);
    if (f <= 0.001) return bow;
    const st = Math.floor(this.k.m * 12) / 12;
    const deep: [number, number] = [A_X + 420 + Math.sin(st * 0.7) * 40, WATER + 560 + Math.sin(st * 1.1) * 14];
    return [bow[0] + (deep[0] - bow[0]) * f, bow[1] + (deep[1] - bow[1]) * f];
  }
  /** a silhouette from either studio (the choir lives in the lite one) */
  sil(slug: string): Sprite | null {
    return this.studio.silhouette(slug, 0.5, 0.97) ?? this.choirStudio.silhouette(slug, 0.5, 0.97);
  }
  /** a still of a baked painting from either studio */
  stillAny(slug: string): Sprite | null {
    return this.studio.still(slug, 0.5, 0.97) ?? this.choirStudio.still(slug, 0.5, 0.97);
  }
  /** a painting's size from either studio */
  sizeAny(slug: string): [number, number] {
    return this.studio.still(slug) ? this.studio.size(slug) : this.choirStudio.size(slug);
  }
  /** the giant book (world) */
  bookAt(): [number, number] {
    const g = this.giantC;
    return [g.x + this.bookG.x, g.y + this.bookG.y];
  }

  // ---------------------------------------------------------------- per frame
  update(k: Kit, m: number) {
    this.poses.clear();
    this.jolts.length = 0;
    this.plateStyle = null;
    const motion = k.reduceMotion ? 0.3 : 1;
    // ---- the 808 swells sink the camera; every kick punches a little
    const kick = k.env('kick', m, 0.1, 0.25);
    k.cam.punch(0.008 * kick);
    const sub = this.subEnv(m);
    k.cam.offset(0, -46 * sub.slow * motion);
    if (sub.fast > 0.05) k.cam.shake(7 * sub.fast * motion, m, 5, 9);
    // ---- parallax around the camera
    const cx = k.cam.x;
    const cy = k.cam.y;
    this.farWall.position.set((cx - W / 2) * 0.82, (cy - H / 2) * 0.7);
    this.rays.position.copyFrom(this.farWall.position);
    this.choirC.position.copyFrom(this.farWall.position);
    this.lamps.position.set((cx - W / 2) * 0.6, (cy - H / 2) * 0.5);
    this.midCases.position.set((cx - W / 2) * 0.3, (cy - H / 2) * 0.15 - k.num('flood') * 160);
    this.near.position.set(-(cx - W / 2) * 0.28, -(cy - H / 2) * 0.1);
    // ---- lamps sway with the bass (pitch: lower → further)
    const bn = k.last('bass', m, 0.1);
    const bassE = k.env('bass', m, 0.45, 0.1);
    const sway = bn ? bassE * 0.05 * (bn.i % 2 ? 1 : -1) : 0;
    const st = Math.floor(m * 12) / 12;
    this.lampGs.forEach((g, i) => (g.rotation = Math.sin(st * 0.9 + i) * 0.03 + sway * motion));
    this.lamps.alpha = k.num('lamps', 1);
    this.drawRays(k, m);
    // ---- the colossus and his book
    const gA = k.num('giant', 0);
    this.giantC.visible = gA > 0.01;
    this.giantC.alpha = Math.min(1, gA * 1.2);
    this.giantC.position.set(B_X + 90 + (cx - W / 2) * 0.22, WATER + 1000 - gA * 420 + k.num('giant.y') + (cy - H / 2) * 0.2);
    this.drawBook(k);
    // ---- the choir
    const ch = k.num('choir', 0);
    this.choirC.visible = ch > 0.01;
    if (this.choirC.visible) this.drawChoir(k, m, ch);
    this.drawMist(k);
    this.drawShafts(k, m);
    // under the water the front veil lifts: the deep is night, the sinking lantern the only light
    this.frontWater.alpha = 1 - 0.85 * Math.min(1, k.num('lfall', 0));
    this.drawWater(k, m, sub.slow);
    this.drawAirPages(k, m);
  }

  /** the 808 swells: fast = the hit, slow = the sinking that follows (0..1) */
  private subEnv(m: number) {
    let fast = 0;
    let slow = 0;
    for (let i = this.subs.length - 1; i >= 0; i--) {
      const s = this.subs[i];
      if (s.t > m) continue;
      const age = m - s.t;
      if (age > 4) break;
      fast = Math.max(fast, s.s * Math.exp(-age / 0.18));
      // sink fast, float back up over ~2 s
      slow = Math.max(slow, s.s * (age < 0.25 ? ease('out', age / 0.25) : Math.exp(-(age - 0.25) / 1.1)));
    }
    return { fast, slow };
  }

  /** light shafts from the surface, seen from under the water (only when the camera is down there) */
  private drawShafts(k: Kit, m: number) {
    const g = this.shafts;
    g.clear();
    if (k.cam.y < WATER + 200 || k.fullFrame) return;
    const st = Math.floor(m * 8) / 8;
    for (let i = 0; i < 6; i++) {
      const x = 200 + i * 300 + Math.sin(st * 0.4 + i * 1.7) * 60;
      g.poly([x - 40, WATER + 10, x + 40, WATER + 10, x + 260 + i * 20, WATER + 1300, x + 60, WATER + 1300]).fill({ color: 0xd6e4ff, alpha: 0.1 + 0.04 * Math.sin(st + i) });
    }
  }

  /** two veils of mist between the far hall, the colossus and the set (in the gold: a warm dust, thinner) */
  private drawMist(k: Kit) {
    const mist = k.num('mist', 0.6);
    const v = k.view;
    const z = k.cam.zoom || 1;
    const x0 = k.cam.x - (v.w / 2) / z - 200;
    const w = v.w / z + 400;
    const y0 = k.cam.y - (v.h / 2) / z - 400;
    const h = v.h / z + 800;
    const col = lerpColor(0xe9dcc0, 0xf3d9a0, k.num('style.out', 0));
    this.mistFar.clear().rect(x0, y0, w, h).fill({ color: col, alpha: mist * 0.75 });
    this.mistNear.clear().rect(x0, y0, w, WATER - y0 + 40).fill({ color: col, alpha: mist * 0.3 });
  }

  private drawRays(k: Kit, m: number) {
    const g = this.rays;
    g.clear();
    const a = k.num('rays', 0.3);
    if (a <= 0.01 || k.fullFrame) return;
    const perc = k.env('perc', m, 0.12);
    const st = Math.floor(m * 8) / 8;
    for (let i = 0; i < 5; i++) {
      const x0 = 960 + (i - 2) * 70;
      const x1 = 960 + (i - 2) * 520 + Math.sin(st * 0.3 + i) * 40;
      g.poly([x0 - 30, -560, x0 + 30, -560, x1 + 140, WATER, x1 - 140, WATER]).fill({ color: 0xffe6a8, alpha: a * (0.07 + 0.02 * (i % 2)) });
    }
    // dust in the light: twinkles on the hats
    const R = rng(77);
    for (let i = 0; i < 40; i++) {
      const x = 400 + R() * 1100 + Math.sin(st * 0.4 + i) * 20;
      const y = -200 + ((R() * 900 + st * 14) % 900);
      g.circle(x, y, 2 + 2 * R()).fill({ color: 0xfff2c8, alpha: a * (0.25 + 0.6 * perc * (i % 3 === 0 ? 1 : 0.3)) });
    }
  }

  private drawBook(k: Kit) {
    const open = Math.round(Math.max(0, Math.min(1, k.num('book', 0))) * 40) / 40;
    this.bookG.position.set(-330, -1020 + k.num('book.y'));
    if (open === this.bookOpen) return;
    this.bookOpen = open;
    const g = this.bookG;
    g.clear();
    if (open <= 0.001) {
      // closed: a thick vermilion tome with gold corners
      g.roundRect(-150, -40, 300, 80, 10).fill(C.vermilion);
      g.rect(-150, -12, 300, 24).fill(C.parchShade);
      g.rect(-150, -40, 300, 10).fill(C.gold);
      for (const x of [-150, 130]) g.rect(x, -40, 20, 80).fill(C.gold);
      return;
    }
    // open: two covers swing apart (cos), the pages fan between them
    const a = (open * Math.PI) / 2;
    const cw = 230;
    const lx = -Math.sin(a) * cw;
    const ly = -Math.cos(a) * cw * 0.5;
    g.poly([0, 30, lx, 30 + ly * 0.2 - 10, lx, ly - 10, 0, -10]).fill(C.vermilion);
    g.poly([0, 30, -lx, 30 + ly * 0.2 - 10, -lx, ly - 10, 0, -10]).fill(C.vermilion);
    g.poly([0, 18, lx * 0.94, 18 + ly * 0.2 - 10, lx * 0.94, ly, 0, -20]).fill(C.parchment);
    g.poly([0, 18, -lx * 0.94, 18 + ly * 0.2 - 10, -lx * 0.94, ly, 0, -20]).fill(C.parchment);
    for (let i = 1; i < 6; i++) {
      const f = i / 6;
      g.moveTo(lx * 0.9 * f, ly * f + 8).lineTo(lx * 0.9 * f - 4, ly * f - 60 * open).stroke({ width: 2, color: C.parchShade });
      g.moveTo(-lx * 0.9 * f, ly * f + 8).lineTo(-lx * 0.9 * f + 4, ly * f - 60 * open).stroke({ width: 2, color: C.parchShade });
    }
    // an illuminated initial glows on the left page
    g.rect(lx * 0.7 - 30, ly * 0.6 - 40, 60, 60).fill(C.gold);
    g.rect(lx * 0.7 - 20, ly * 0.6 - 30, 40, 40).fill(C.lapis);
    g.rect(-150 * open, 22, 300 * open, 10).fill(C.gold);
  }

  private drawChoir(k: Kit, m: number, ch: number) {
    const vox = k.env('vox', m, 0.25, 0.3);
    const st = Math.floor(m * 12) / 12;
    this.choirC.alpha = ch;
    this.choirSprites.forEach((s, i) => {
      const lift = Math.sin(st * 1.3 + i * 0.7) * 6;
      s.y = WATER - 600 - ((i % 2) * 26) + lift - vox * 8 * ((i % 3) / 2);
      s.tint = lerpColor(0xc9b48e, 0xffffff, Math.min(1, vox * 0.8 + (i % 4 === 0 ? 0.2 : 0)));
    });
    const g = this.choirHalo;
    g.clear();
    for (const s of this.choirSprites) {
      g.circle(s.x, s.y - 122, 50 + vox * 10).fill({ color: C.gold, alpha: 0.9 });
      g.circle(s.x, s.y - 122, 42 + vox * 8).stroke({ width: 4, color: C.goldLight });
    }
  }

  /** water: drawn on twos (back fill, reflections, the surface line), ripples + floating pages on top of the hulls */
  private drawWater(k: Kit, m: number, sink: number) {
    const stp = Math.floor(m * 12);
    const st = stp / 12;
    const flood = k.num('flood', 0);
    const wy = WATER - flood * 60;
    const v = k.view;
    const x0 = k.cam.x - (W / 2) / k.cam.zoom - 600 - (v.w - W);
    const x1 = k.cam.x + (W / 2) / k.cam.zoom + 600 + (v.w - W);
    const bassE = k.env('bass', m, 0.5, 0.1);
    const swell = 10 * sink + 6 * bassE;
    if (stp !== this.lastWaterStep) {
      this.lastWaterStep = stp;
      const g = this.backWater;
      g.clear();
      g.rect(x0, wy, x1 - x0, 4000).fill(C.lapis);
      g.rect(x0, wy, x1 - x0, 80).fill(0x6f95d8);
      g.rect(x0, wy + 80, x1 - x0, 160).fill(0x4f78c4);
      g.rect(x0, wy + 240, x1 - x0, 200).fill(0x3a62b0);
      // long horizontal swells (in ink: the strokes of the water)
      for (let i = 0; i < 9; i++) {
        const yy = wy + 30 + i * i * 9;
        const xs = ((i * 397 + st * 30 * (i % 2 ? 1 : -1)) % 900) - 300;
        for (let x = x0 + xs; x < x1; x += 900) g.rect(x, yy, 260 + (i % 3) * 120, 3 + i * 0.6).fill(0x1f3f8f);
      }
      // reflections of the lamps and the windows: broken gold dashes that shimmer
      const R = rng(stp % 3);
      for (let i = 0; i < 26; i++) {
        const x = 0 + i * 90 + R() * 40;
        const y = wy + 14 + (i % 5) * 18;
        const w = 30 + R() * 60;
        g.rect(x, y, w, 4).fill({ color: C.goldLight, alpha: 0.5 + 0.4 * R() });
      }
      // the surface line (the swell)
      const pts: number[] = [];
      for (let x = x0; x <= x1; x += 40) pts.push(x, wy - swell * Math.sin(x * 0.004 + st * 1.4) - 3 * Math.sin(x * 0.03 + st * 3));
      g.poly([...pts, x1, wy + 12, x0, wy + 12]).fill(0x6f95d8);
      for (let i = 0; i < pts.length - 2; i += 2) g.moveTo(pts[i], pts[i + 1]).lineTo(pts[i + 2], pts[i + 3]);
      g.stroke({ width: 4, color: 0xbcd2ff });
      const f = this.frontWater;
      f.clear();
      f.rect(x0, wy + 6, x1 - x0, 4000).fill({ color: 0x3a62b0, alpha: 0.55 });
    }
    // ripples: every kick drops ink on the water (closed form over the last kicks)
    const g = this.surf;
    g.clear();
    if (k.fullFrame) return;
    const kicks = k.onsetList('kick');
    const lk = k.last('kick', m);
    if (lk) {
      for (let i = lk.i; i >= 0 && i > lk.i - 8; i--) {
        const o = kicks[i];
        const age = m - o.t;
        if (age > 1.2) break;
        if (o.strength < 0.25) continue;
        const R = rng(i * 7 + 3);
        const x = 300 + R() * 1300;
        const y = wy + 30 + R() * 120;
        const s = 0.5 + o.strength * 0.8;
        for (let j = 0; j < 3; j++) {
          const a = age - j * 0.12;
          if (a <= 0) continue;
          const r = (30 + 220 * ease('out', Math.min(1, a / 1.0))) * s;
          g.ellipse(x, y, r, r * 0.18).stroke({ width: 5 - j, color: 0xcfe0ff, alpha: Math.max(0, 1 - a / 1.1) });
        }
        // the drop itself, the first instant
        if (age < 0.16) g.ellipse(x, y, 18 * s, 34 * s * (1 - age / 0.16)).fill(C.ink);
      }
    }
    // pages torn off the shelves on every accent fall and float
    const acc = k.onsetList('snare');
    const la = k.last('snare', m, 0.3);
    if (la) {
      let n = 0;
      for (let i = la.i; i >= 0 && n < 12; i--) {
        const o = acc[i];
        const age = m - o.t;
        if (age > 2.4) break;
        if (o.strength < 0.3) continue;
        n++;
        const R = rng(i * 13 + 5);
        const sx = R() < 0.5 ? -200 + R() * 500 : 1500 + R() * 600;
        const sy = 120 + R() * 400;
        const vx = (sx < 960 ? 1 : -1) * (120 + R() * 200);
        const t = Math.floor(age * 12) / 12;
        const x = sx + vx * t + Math.sin(t * 5 + i) * 40;
        const y = Math.min(wy + 10, sy + 160 * t + 90 * t * t);
        const flip = Math.cos(t * 7 + i);
        const rot = Math.sin(t * 4 + i) * 0.8;
        this.page(g, x, y, 34, rot, flip, age > 2 ? 1 - (age - 2) / 0.4 : 1);
      }
    }
  }

  /** a page (parchment quad with lines), flipping (flip = cos of its turn) */
  page(g: Graphics, x: number, y: number, s: number, rot: number, flip: number, alpha = 1) {
    const c = Math.cos(rot);
    const sn = Math.sin(rot);
    const w = s * Math.max(0.08, Math.abs(flip));
    const h = s * 1.3;
    const P = (px: number, py: number) => [x + px * c - py * sn, y + px * sn + py * c];
    g.poly([...P(-w, -h), ...P(w, -h), ...P(w, h), ...P(-w, h)]).fill({ color: flip > 0 ? C.parchment : C.parchShade, alpha });
    if (Math.abs(flip) > 0.4)
      for (let i = 0; i < 4; i++) {
        const yy = -h * 0.6 + i * h * 0.35;
        g.moveTo(...(P(-w * 0.7, yy) as [number, number])).lineTo(...(P(w * 0.7, yy) as [number, number]));
      }
    g.stroke({ width: 2, color: C.umber, alpha: alpha * 0.8 });
  }

  /** pages drifting in the air like slow snow (prop 'pages' = density) */
  private drawAirPages(k: Kit, m: number) {
    const g = this.airPages;
    g.clear();
    const d = k.num('pages', 0);
    if (d <= 0.01 || k.fullFrame) return;
    const n = Math.round(26 * d * k.density);
    const t = Math.floor(m * 12) / 12;
    for (let i = 0; i < n; i++) {
      const R = rng(500 + i);
      const sp = 30 + R() * 50;
      const x = ((R() * 2600 + Math.sin(t * 0.5 + i) * 120 + t * (R() - 0.5) * 40) % 2600) - 340;
      const y = ((R() * 1400 + t * sp) % 1400) - 300;
      this.page(g, x, y, 14 + R() * 26, Math.sin(t * 0.8 + i) * 0.9, Math.cos(t * (1 + R()) + i), 0.9);
    }
  }

  /** the foreground: the edges of two colossal bookcases (left and right) and hanging chains */
  private drawNear() {
    const g = this.nearG;
    g.clear();
    bookcase(g, -460, WATER + 400, 380, 1500, 21, 1.6, { top: false });
    bookcase(g, 2000, WATER + 400, 380, 1500, 22, 1.6, { top: false });
    for (const x of [140, 1780]) g.moveTo(x, -400).lineTo(x + 20, 300).stroke({ width: 10, color: C.woodDark });
  }

  /** under the surface: shelves going down into the dark, drifting books (static; the stage moves the books) */
  private drawUnder() {
    const g = this.underG;
    g.clear();
    // the deep: dark water, drowned bookcases leaning in the murk, and an old keeper's statue at the bottom
    g.rect(-1500, WATER + 260, 5000, 2600).fill(0x0f1d44);
    for (const [x, w, s, rot] of [
      [-300, 420, 31, 0.08],
      [300, 360, 32, -0.12],
      [1500, 420, 34, 0.1],
    ] as const) {
      const b = new Graphics();
      bookcase(b, -w / 2, 0, w, 1250, s, 0.8, { top: false });
      b.position.set(x + w / 2, WATER + 1600);
      b.rotation = rot;
      b.alpha = 0.55;
      this.under.addChild(b);
    }
    const statue = this.choirStudio.silhouette('lantern_spirit_cat', 0.5, 0.97);
    if (statue) {
      statue.scale.set(1000 / statue.texture.height);
      statue.tint = 0x3d4f72;
      statue.position.set(1050, WATER + 1560);
      statue.rotation = -0.06;
      this.under.addChild(statue);
    }
    this.shafts.blendMode = 'add';
    this.under.addChild(this.shafts);
    for (let i = 0; i < 9; i++) {
      const R = rng(900 + i);
      const b = new Graphics();
      driftBook(b, [C.vermilion, C.malachite, C.lapis, C.ochre][i % 4], 1.3 + R() * 1.1);
      b.position.set(-100 + R() * 2100, WATER + 300 + R() * 1000);
      b.rotation = (R() - 0.5) * 0.8;
      (b as Graphics & { seed?: number }).seed = i;
      this.under.addChild(b);
    }
  }

  late(k: Kit, m: number) {
    const st = Math.floor(m * 12) / 12;
    const kickE = k.env('kick', m, 0.1, 0.25) * (k.reduceMotion ? 0.4 : 1);
    const sub = this.subEnv(m);
    const bn = k.last('bass', m, 0.1);
    const bassE = k.env('bass', m, 0.5, 0.1) * (k.reduceMotion ? 0.4 : 1);
    const sway = bn ? bassE * 0.012 * (bn.i % 2 ? 1 : -1) : 0;
    // ---- the ships ride the water: a slow rock, a dip on every kick, a lift on the 808
    for (const s of ['A', 'B'] as const) {
      const c = s === 'A' ? this.A : this.B;
      const p = this.shipPos(s);
      let dx = 0;
      let dy = Math.sin(st * 1.3 + (s === 'A' ? 0 : 1.7)) * 5 + 8 * kickE - 14 * sub.fast - k.num('flood') * 60;
      let rot = Math.sin(st * 1.1 + (s === 'A' ? 1 : 0)) * 0.012 + sway * (s === 'A' ? 1 : -1);
      for (const j of this.jolts) {
        if (j.ship !== s) continue;
        dx += j.dx;
        dy += j.dy;
        rot += j.rot;
      }
      c.position.set(p.x + dx, p.y + dy);
      c.rotation = rot;
    }
    // ---- drifting books under the surface (slow fall, sway)
    for (const ch of this.under.children) {
      const sd = (ch as Graphics & { seed?: number }).seed;
      if (sd === undefined) continue;
      const R = rng(900 + sd);
      const base = WATER + 300 + R() * 1000;
      ch.y = base + ((st * (12 + sd * 3)) % 400);
      ch.rotation = Math.sin(st * 0.6 + sd) * 0.4;
    }
    // ---- actors: idle bob on the beat, then the poses clips asked for
    for (const [who, a] of Object.entries(this.actors) as [Who, Actor][]) {
      const home = (a as Actor & { home?: [number, number] }).home ?? [0, 0];
      const req = this.poses.get(who);
      const flip = who === 'biblio' || who === 'archivista' || who === 'tintero' || who === 'marcapaginas';
      const bob = (who === 'luzterna' ? Math.sin(st * 2) * 10 : 0) - kickE * 3;
      let x = home[0];
      let y = home[1] + bob;
      let rot = 0;
      let sx = 1;
      let sy = 1 - kickE * 0.02;
      if (req) {
        const P = POSES[req.name];
        if (P) {
          const o = P(req.lt);
          x += o.dx ?? 0;
          y += o.dy ?? 0;
          rot = o.rot ?? 0;
          sx *= o.sx ?? 1;
          sy *= o.sy ?? 1;
          if (o.emote && a.puppet && Math.floor(req.lt * 12) === 0) a.emote(o.emote);
          if (a.puppet && o.crouch !== undefined) a.puppet.crouch = o.crouch;
          if (a.puppet && o.look !== undefined) a.puppet.look = o.look;
        }
      } else if (a.puppet) {
        a.puppet.crouch = 0;
      }
      if (who === 'giant') continue;
      a.pose(m, x, y, { rot: flip ? -rot : rot, sx, sy, flip, step: k.beatStep(m) });
    }
    const g = this.actors.giant;
    if (g) {
      const req = this.poses.get('giant');
      const o = req ? (POSES[req.name]?.(req.lt) ?? {}) : {};
      g.pose(m, o.dx ?? 0, (o.dy ?? 0) - sub.slow * 20, { rot: -(o.rot ?? 0), sx: o.sx ?? 1, sy: (o.sy ?? 1) * (1 + 0.01 * Math.sin(st * 1.2)), flip: true, step: Math.floor(m * 8) });
    }
    this.applyInk(k, m);
    this.drawGlow(k, m);
    // anchors for prompts (screen)
    // (kept inside the safe area: a prompt that shows a bar early while the camera is still travelling never sits in a corner)
    const toS = (p: [number, number]): [number, number] => {
      const [x, y] = k.cam.toScreen(p[0], p[1]);
      return [Math.max(170, Math.min(W - 170, x)), Math.max(150, Math.min(H - 150, y))];
    };
    this.anchors.set('canelo', toS(this.head('canelo')));
    // prompts sit ABOVE his head, never on his face (doc 29 §10)
    { const [hx, hy] = toS(this.head('canelo')); this.anchors.set('caneloP', [hx, Math.max(150, hy - 150 * k.cam.zoom)]); }
    this.anchors.set('biblio', toS(this.head('biblio')));
    this.anchors.set('lantern', toS(this.lanternAt()));
    this.anchors.set('A', toS([this.A.x, this.A.y - 120]));
    this.anchors.set('B', toS([this.B.x, this.B.y - 160]));
  }

  /** the ink filters follow the props (the plates may take over the panels' one this frame) */
  private applyInk(k: Kit, m: number) {
    const xf = k.layers.screen.worldTransform;
    const s = xf.a || 1;
    const time = Math.floor(m * 8 * k.num('boil', 1)) / 8;
    const beat = k.env('melody', m, 0.15, 0.4);
    for (const f of [this.ink, this.inkP]) {
      f.setXf(xf.tx, xf.ty, s);
      f.u.uTime = time;
      f.u.uBeat = beat;
      f.u.uLine = k.num('line', 2.2);
      f.u.uBoil = k.reduceMotion ? 0.6 : 1.6;
      // dark regions are lifted into washes (form, not blots) — except under the water: the deep stays night
      f.u.uLift = 0.17 * (1 - Math.min(1, k.num('lfall', 0) * 1.5));
    }
    const fr = k.num('front.r', -1);
    const set = (f: InkFilter, sIn: number, sOut: number, front: [number, number, number], blank: number) => {
      f.u.uStyleIn = sIn;
      f.u.uStyleOut = sOut;
      f.setFront(front[0], front[1], front[2]);
      f.u.uBlank = blank;
      f.u.uSoft = k.num('front.soft', 120);
    };
    let fx = k.num('front.x', W / 2);
    let fy = k.num('front.y', H / 2);
    if (k.str('front.at', '') === 'lantern') [fx, fy] = k.cam.toScreen(...this.lanternAt());
    const world: [number, number, number, number, number, number] = [k.num('style.in'), k.num('style.out'), fx, fy, fr, k.num('blank')];
    set(this.ink, world[0], world[1], [world[2], world[3], world[4]], world[5]);
    const p = this.plateStyle;
    if (p) set(this.inkP, p.in, p.out, p.front, p.blank);
    else set(this.inkP, world[0], world[1], [world[2], world[3], world[4]], world[5]);
  }

  /** the uninkable gold: our lantern's flame and the letters the voices write (screen space, additive glow) */
  private drawGlow(k: Kit, m: number) {
    const g = this.glowG;
    g.clear();
    for (const s of this.glyphSprites) s.visible = false;
    if (k.fullFrame) return;
    const st = Math.floor(m * 12) / 12;
    const vox = k.env('vox', m, 0.3, 0.3);
    // ---- the lantern (Luzterna's light at our bow)
    let lt = k.num('lantern', 0.35);
    // holding our light (prechorus): it grows while held; after, it burns as bright as the hold was good
    const luz = k.prompt('luz');
    if (luz && luz.from !== undefined && luz.from !== null && !luz.done) lt += Math.min(1, Math.max(0, k.m - luz.from) / 5) * 0.9;
    const j = k.judged('luz');
    if (j && k.m >= j.at) lt += j.r === 'great' ? 0.9 : j.r === 'hit' ? 0.5 : 0.05;
    if (lt > 0.01) {
      const [lx, ly] = k.cam.toScreen(...this.lanternAt());
      const z = k.cam.zoom;
      // under the water every kick is a heartbeat of the light: a thin gold ring
      if (k.num('lfall', 0) > 0.2) {
        const kk = k.onsetList('kick');
        const lk = k.last('kick', m, 0.3);
        if (lk)
          for (let i = lk.i; i >= 0 && i > lk.i - 4; i--) {
            const age = m - kk[i].t;
            if (age > 1.4) break;
            g.circle(lx, ly, 30 + age * 420).stroke({ width: 4, color: 0xffd27a, alpha: 0.5 * (1 - age / 1.4) });
          }
      }
      const fl = 1 + 0.08 * Math.sin(st * 17) + 0.25 * vox * k.num('glyphs', 0);
      const lc = Math.min(1.3, lt);
      const r = (14 + 26 * lc) * fl * z;
      g.circle(lx, ly, r * 3).fill({ color: 0xffb84a, alpha: 0.06 * lc });
      g.circle(lx, ly, r * 1.7).fill({ color: 0xffc860, alpha: 0.12 * lc });
      // under the water: bubbles rise from the light on every kick (paper-white)
      if (k.num('lfall', 0) > 0.2) {
        const kk = k.onsetList('kick');
        const lk = k.last('kick', m, 0.3);
        if (lk)
          for (let i = lk.i; i >= 0 && i > lk.i - 6; i--) {
            const age = m - kk[i].t;
            if (age > 2.2) break;
            const R = rng(i * 41 + 3);
            for (let b = 0; b < 5; b++) {
              const bx = lx + (R() - 0.5) * 90 + Math.sin(age * 4 + b) * 10;
              const by = ly - age * (140 + R() * 120) - 20;
              g.circle(bx, by, (4 + R() * 9) * z).stroke({ width: 2.5, color: 0xf6efe0, alpha: 0.8 * (1 - age / 2.2) });
            }
          }
      }
      g.ellipse(lx, ly - r * 0.3, r * 0.75, r * 1.25).fill({ color: 0xffd27a, alpha: 0.85 });
      g.ellipse(lx, ly - r * 0.1, r * 0.4, r * 0.7).fill({ color: 0xfff6d8, alpha: 0.95 });
    }
    // ---- the letters the voices write (rise from the water; while he hushes, an ink puff snuffs them)
    const gl = k.num('glyphs', 0);
    if (gl <= 0.01) return;
    const hush = k.num('hush', 1);
    const vx = k.onsetList('vox');
    const lv = k.last('vox', m, 0.35);
    if (!lv) return;
    let n = 0;
    let lastT = Infinity;
    for (let i = lv.i; i >= 0 && n < this.glyphSprites.length; i--) {
      const o = vx[i];
      const age = m - o.t;
      if (age > 3.2) break;
      if (o.strength < 0.35 || lastT - o.t < 0.22) continue;
      lastT = o.t;
      const R = rng(i * 31 + 9);
      const wx = 260 + R() * 1400;
      const wy = WATER + 20 - age * (90 + R() * 60);
      const [x, y] = k.cam.toScreen(wx + Math.sin(age * 2 + i) * 30, wy);
      const life = hush > 0.5 ? 0.9 + R() * 0.4 : 3.2;
      if (age > life + 0.35) continue;
      const sp = this.glyphSprites[n++];
      sp.texture = k.text.get(GLYPHS[i % GLYPHS.length], GLYPH_STYLE(64));
      sp.visible = true;
      sp.position.set(x, y);
      const grow = ease('outBack', Math.min(1, age / 0.25));
      const die = age > life ? 1 - (age - life) / 0.35 : 1;
      sp.scale.set((0.95 + o.strength * 0.6) * grow * Math.max(0.2, die) * k.cam.zoom);
      sp.alpha = gl * Math.max(0, die);
      sp.rotation = Math.sin(age * 1.5 + i) * 0.2;
      g.circle(x, y, 40 * sp.scale.x + 10).fill({ color: 0xffc860, alpha: 0.18 * sp.alpha });
      // snuffed: the letter blackens and shrinks into his silence
      sp.tint = hush > 0.5 && age > life ? lerpColor(0xffffff, 0x2a2430, (age - life) / 0.35) : 0xffffff;
    }
  }

  anchor(name: string, k: Kit): [number, number] | null {
    void k;
    return this.anchors.get(name) ?? null;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    const k = this.k;
    k.layers.world.filters = [];
    k.layers.panels.filters = [];
    this.ink.destroy();
    this.inkP.destroy();
    for (const c of this.prebuilt) c.destroy({ children: true });
    this.prebuilt.clear();
    this.warmRT?.destroy(true);
    this.warmRT = null;
    // textures may still be bound to the last frame: free them a few frames later (like the runner's studio)
    const studios = [this.studio, this.choirStudio];
    let n = 0;
    const later = () => {
      if (++n < 3) return void requestAnimationFrame(later);
      for (const s of studios) s?.dispose();
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(later);
    else for (const s of studios) s?.dispose();
  }
}

// ------------------------------------------------------------------ poses (actor-local offsets, by local time)
type PoseOut = { dx?: number; dy?: number; rot?: number; sx?: number; sy?: number; emote?: 'happy' | 'hurt' | 'surprise' | 'sleepy' | 'attack'; crouch?: number; look?: number };
const wave = (lt: number, f: number) => Math.sin(lt * f);
export const POSES: Record<string, (lt: number) => PoseOut> = {
  brace: (lt) => ({ dy: 8, sy: 0.9, sx: 1.06, crouch: 0.8, rot: -0.04 + 0.01 * wave(lt, 20) }),
  slash: (lt) => {
    const x = Math.min(1, lt / 0.12);
    return { dx: 60 * ease('out', x), dy: -30 * Math.sin(x * Math.PI), rot: 0.28 * ease('out', x) - 0.1 * Math.max(0, lt - 0.3), sx: 1.08, sy: 0.94, emote: 'attack' };
  },
  splat: (lt) => ({ sy: 0.8 + 0.2 * Math.min(1, lt / 0.6), sx: 1.18 - 0.18 * Math.min(1, lt / 0.6), dy: 10, rot: 0.06 * wave(lt, 14) * Math.max(0, 1 - lt), emote: 'hurt' }),
  bow: (lt) => {
    const x = ease('inOut', Math.min(1, lt / 0.8));
    return { rot: 0.42 * x, dy: 26 * x, dx: 14 * x, crouch: 0.6 * x, sy: 1 - 0.06 * x };
  },
  bowDeep: (lt) => {
    const x = ease('inOut', Math.min(1, lt / 1.2));
    return { rot: 0.62 * x, dy: 44 * x, dx: 22 * x, crouch: 1 * x, sy: 1 - 0.1 * x };
  },
  tumble: (lt) => ({ rot: 0.8 * Math.sin(Math.min(1, lt / 0.5) * Math.PI) * 0.6, dy: 30 * Math.min(1, lt / 0.3), sx: 1.1, sy: 0.88, emote: 'surprise' }),
  listen: (lt) => ({ rot: -0.1 - 0.02 * wave(lt, 2), look: -0.6, crouch: 0.2, emote: 'sleepy' }),
  sing: (lt) => ({ sy: 1.08 + 0.03 * wave(lt, 9), rot: -0.08, dy: -10, emote: 'happy' }),
  raise: (lt) => ({ sy: 1.06 + 0.02 * wave(lt, 6), dy: -14, rot: -0.05 }),
  shock: (lt) => ({ dx: -30 * Math.min(1, lt / 0.1), rot: -0.16, dy: -20 * Math.sin(Math.min(1, lt / 0.25) * Math.PI), emote: 'surprise' }),
  fire: (lt) => ({ dx: -20 * Math.exp(-lt / 0.15), rot: -0.08 * Math.exp(-lt / 0.2), sx: 1.04 }),
  proud: (lt) => ({ sy: 1.05, rot: -0.04, dy: -6 + 2 * wave(lt, 4), emote: 'happy' }),
  shhh: (lt) => ({ dx: -20 * ease('out', Math.min(1, lt / 0.3)), sy: 1.04, rot: 0.06 * ease('out', Math.min(1, lt / 0.3)) }),
  slam: (lt) => ({ sy: 0.9 + 0.1 * Math.min(1, lt / 0.4), sx: 1.1 - 0.1 * Math.min(1, lt / 0.4), dy: 12 * Math.exp(-lt / 0.3), rot: -0.12 * Math.exp(-lt / 0.4) }),
  stunned: (lt) => ({ rot: 0.12 * Math.min(1, lt / 0.3), dx: 18, emote: lt < 0.1 ? 'surprise' : undefined, look: 0.5 }),
  loom: (lt) => ({ dy: -60 * ease('out', Math.min(1, lt / 1.5)), sy: 1 + 0.02 * wave(lt, 1.5) }),
  lean: (lt) => ({ rot: 0.08 * ease('inOut', Math.min(1, lt / 1)), dx: -40 * ease('inOut', Math.min(1, lt / 1)) }),
  giantBow: (lt) => {
    const x = ease('inOut', Math.min(1, lt / 2));
    return { rot: 0.22 * x, dy: 90 * x, dx: -60 * x };
  },
  hurt: (lt) => ({ dx: 24 * Math.exp(-lt / 0.2), rot: 0.1 * Math.exp(-lt / 0.3), emote: 'hurt' }),
  cheer: (lt) => ({ dy: -36 * Math.abs(Math.sin(lt * 7)), emote: 'happy' }),
};

export default function createStage(k: Kit): StageApi {
  return new WilStage(k);
}
