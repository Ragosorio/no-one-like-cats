/**
 * CIRCUS MALUS — the set: «EL GRAN TEATRO DE LA CORRECCIÓN» (docs/part-ii/29 §15).
 *
 * A fairground stage in perfect symmetry, filmed like a 1930s rubber-hose cartoon (film.ts). Everything that belongs to
 * the Correctores is symmetric and moves in unison ON the beat; Canelo (and Luzterna, and the crew) are the only things
 * that are not. Every sound has a visible purpose, all the time (pure functions of the onset tracks):
 *
 *   kick     the whole world HOPS and squashes on it (rubber-hose bounce: the chorus line, Tachón, the calliopes, the
 *            bunting), the marquee bulbs all flare, the footlights pulse, the camera takes a small punch
 *   snare    the two white gloves of the wings slam their rubber stamps on the floor (backbeat 2 and 4), the chorus line
 *            kicks a leg (left on 2, right on 4, mirrored)
 *   perc     the marquee bulbs chase one step per hat, the clock's hands tick
 *   bass     the calliope pipe of that note shoots up (the riff is played by the pipes), the gears turn one notch per
 *            note, the pendulum swings
 *   melody   the piano stabs puff steam rings out of both calliopes and Tachón beats time with his marker
 *
 * Persistent state comes from the score and the judged prompts (seekable: a jump back redraws the same picture).
 */
import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import type { Kit, StageApi } from '../../anime/kit';
import { W, H } from '../../anime/kit';
import { Actor, Studio } from '../../anime/actor';
import type { Palette } from '../../anime/palette';
import { vnoise } from '../../anime/draw';
import { ease } from '../../score';
import { G } from '../../../state/game';
import { catSlug } from '../../../state/sys/forms';
import rigsJson from '../../../data/catRigs.json';
import { FilmFilter, bakeToon, type FilmState } from './film';
import { AXIS, CREAM, FLOOR, GOLD, GOLD_D, INK, OPEN, PAPER, RED, RED_D, TEAL, WOOD_D, both, bulb, bunting, drawBackdrop, drawCalliope, drawClock, drawCurtain, drawFloor, drawPodium, drawProscenium, drawValance, gear, glove, stamp, sunburst } from './art';
import { CIRCUS_VERBS } from './verbs';
import { SHOT_VERBS } from './shots';
import { KNOCKS, ORDER_T } from './score';

export type Who = 'canelo' | 'luzterna' | 'tachon' | 'ronron' | 'espejito' | 'farolillo' | 'crew0' | 'crew1';
export interface PoseReq {
  name: string;
  lt: number;
  dx?: number;
  dy?: number;
  rot?: number;
  sx?: number;
  sy?: number;
}

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

const RIGS = rigsJson as unknown as Record<string, { eyes?: number[][]; size?: number } | undefined>;
/** where a painting's face axis is (0..1 of its width): the midpoint of the eyes in its rig */
export function faceAxis(slug: string): number {
  const r = RIGS[slug];
  if (!r?.eyes || r.eyes.length < 2) return 0.5;
  const mx = (r.eyes[0][0] + r.eyes[0][2] + r.eyes[1][0] + r.eyes[1][2]) / 4;
  return Math.max(0.3, Math.min(0.7, mx / (r.size ?? 700)));
}

/**
 * A «corrected» cat: the left half of the painting and its mirror image — perfectly symmetric (anchor bottom-centre at
 * the face axis). Cheap: two sprites over one baked texture.
 */
export class SymCat extends Container {
  private subs: Texture[] = [];
  constructor(studio: Studio, slug: string, height: number) {
    super();
    const still = studio.still(slug, 0, 0);
    if (!still) return;
    const tex = still.texture;
    still.destroy();
    const w = tex.width;
    const h = tex.height;
    const ax = Math.round(w * faceAxis(slug));
    const left = new Texture({ source: tex.source, frame: new Rectangle(tex.frame.x, tex.frame.y, ax, h) });
    this.subs.push(left);
    const a = new Sprite(left);
    a.anchor.set(1, 0.97);
    const b = new Sprite(left);
    b.anchor.set(1, 0.97);
    b.scale.x = -1;
    const s = height / h;
    const inner = new Container();
    inner.addChild(a, b);
    inner.scale.set(s);
    this.addChild(inner);
  }
  override destroy(o?: Parameters<Container['destroy']>[0]) {
    super.destroy(o);
    for (const t of this.subs) t.destroy(false);
    this.subs = [];
  }
}

/** the chorus line: [slug key, distance from the axis, y, height] — each one has a mirror twin */
const LINE: { who: Who; dx: number; y: number; h: number }[] = [
  { who: 'ronron', dx: 190, y: 780, h: 220 },
  { who: 'espejito', dx: 400, y: 770, h: 215 },
  { who: 'farolillo', dx: 590, y: 760, h: 205 },
];
export const LINE_N = LINE.length * 2;

export const CIRCUS_PALETTES: Record<string, Palette> = {
  /** the drawn colors are true colors: the FILM filter makes them black-and-white or two-strip; the grade stays neutral */
  malus: {
    name: 'malus',
    ink: INK,
    shadow: 0x4a3f3a,
    base: 0x9a9086,
    light: CREAM,
    accent: RED,
    accent2: TEAL,
    sky: [0x2a2422, 0x3a3230, 0x4a403c],
    sea: [0x3a3230, 0x2a2422, 0x1a1514],
    grade: { shade: INK, glow: PAPER, sat: 1, tone: 0, vignette: 0 },
  },
  /** the big show: a little more glow in the lights */
  plan: {
    name: 'plan',
    ink: INK,
    shadow: 0x4a3f3a,
    base: 0xa89c90,
    light: PAPER,
    accent: RED,
    accent2: GOLD,
    sky: [0x2a2422, 0x3a3230, 0x4a403c],
    sea: [0x3a3230, 0x2a2422, 0x1a1514],
    grade: { shade: INK, glow: 0xfffbf0, sat: 1.05, tone: 0, vignette: 0 },
  },
  /** the weird final: pale, pristine */
  final: {
    name: 'final',
    ink: 0x2a2624,
    shadow: 0x8a837c,
    base: 0xd8d2c8,
    light: 0xffffff,
    accent: RED,
    accent2: TEAL,
    sky: [0xf4f0ea, 0xece6dc, 0xe4ddd2],
    sea: [0xe4ddd2, 0xd8d2c8, 0xccc4b8],
    grade: { shade: 0x2a2624, glow: 0xffffff, sat: 1, tone: 0, vignette: 0 },
  },
};

export class CircusStage implements StageApi {
  verbs = { ...CIRCUS_VERBS, ...SHOT_VERBS };
  palettes = CIRCUS_PALETTES;
  promptTheme = { ink: INK, paper: PAPER, hot: GOLD, body: RED_D, mash: TEAL, dim: 0x8a8078, kata: false };
  props: Record<string, number | string> = {
    pal: 'malus',
    'cam.x': AXIS,
    'cam.y': 540,
    'cam.zoom': 1,
    // the film: modes (0 b/w · 1 two-strip · 2 true color), the symmetric wipe, grain/flicker/scratches, the iris
    film0: 0,
    film1: 0,
    wipe: 0,
    grain: 1,
    iris: 2,
    irisX: 0.5,
    irisY: 0.5,
    sym: 0,
    burn: 0,
    burnX: 0.5,
    burnY: 0.45,
    tear: 0,
    slip: 0,
    // the set
    curtain: 0,
    can: 0,
    'can.x': 760,
    'can.y': 960,
    luz: 0,
    crew: 0,
    key: 0,
    gears: 0,
    rows: 0,
    still: 0,
    fade: 0,
  };
  readonly studio: Studio;
  film: FilmFilter;
  post: { filters: FilmFilter[]; live: () => boolean };
  slugs: Record<Who, string> = {
    canelo: 'canelo_admiral_cat',
    // Luzterna is drawn (a cartoon lantern spirit): her portrait is not a MAI painting and the toon bake muddies it
    luzterna: '',
    tachon: 'tachon_strikeout_cat',
    ronron: 'ronron_purr_cat',
    espejito: 'espejito_mirror_cat',
    farolillo: 'farolillo_angler_cat',
    crew0: '',
    crew1: '',
  };
  // ---- the set
  private back = new Container();
  private sun = new Graphics();
  private backdrop = new Graphics();
  private clock = new Graphics();
  private pendulum = new Graphics();
  private floor = new Graphics();
  private podium = new Graphics();
  private calli = new Graphics();
  private flags = new Graphics();
  private gearsG = new Graphics();
  private keyG = new Graphics();
  private seals = new Container();
  private cast = new Container();
  private rowBack = new Container();
  private front = new Container();
  private stamps = new Graphics();
  private frame = new Graphics();
  private valance = new Graphics();
  private curtainG = new Graphics();
  private bulbsG = new Graphics();
  private foot = new Graphics();
  private puffs = new Graphics();
  /** above the film (k.layers.ui, under the prompts): the TRUE COLORS — Luzterna's glow and the stains on the film */
  readonly over = new Container();
  private glow = new Graphics();
  private lantern = new Graphics();
  private bulbPts: [number, number][] = [];
  // ---- the cast
  tachon: SymCat | null = null;
  line: { c: SymCat; side: -1 | 1; i: number; dx: number; y: number }[] = [];
  extra: SymCat[] = [];
  actors: Partial<Record<Who, Actor>> = {};
  /** the symmetric «corrected» Canelo (shown when he is stamped flat, and in the final perfection) */
  canSym: SymCat | null = null;
  private poses = new Map<Who, PoseReq>();
  private anchors = new Map<string, [number, number]>();
  private bassRank = new Map<number, number>();
  /** clips ask for these each frame (max wins) */
  wantFilm: Partial<FilmState> = {};
  wantSym = 0;
  /** the chorus line's extra step this frame (lineStep): offsets mirrored per side */
  lineReq: { dx: number; dy: number; rot: number } | null = null;
  /** show the corrected (symmetric) Canelo this frame */
  canSymReq = false;
  /** Luzterna's charge this frame (the hold) */
  charge = 0;

  constructor(private k: Kit) {
    this.studio = new Studio(k.renderer, k.quality === 'high', {}, bakeToon);
    this.film = new FilmFilter((k.renderer.screen.width / Math.max(1, k.view.w)) * k.renderer.resolution);
    this.post = { filters: [this.film], live: () => true };
  }

  async build(k: Kit) {
    this.slugs.canelo = caneloSlug();
    const crew = k.crew.filter((s) => s && !Object.values(this.slugs).includes(s)).slice(0, 2);
    this.slugs.crew0 = crew[0] ?? '';
    this.slugs.crew1 = crew[1] ?? '';
    await Promise.all([
      this.studio.loadAll(Object.values(this.slugs).filter(Boolean)),
      ...['80px "Anton"', '700 80px "Playfair Display"', '40px "Bebas Neue"'].map((f) => document.fonts.load(f).catch(() => undefined)),
    ]);
    const L = k.layers;
    // ---- world, back to front
    drawBackdrop(this.backdrop);
    drawFloor(this.floor);
    drawPodium(this.podium, 600);
    this.bulbPts = drawProscenium(this.frame);
    drawValance(this.valance);
    this.back.addChild(this.backdrop, this.sun, this.pendulum, this.clock, this.flags, this.calli, this.puffs, this.floor, this.seals, this.rowBack, this.podium);
    L.world.addChild(this.back, this.cast, this.stamps, this.front);
    this.front.addChild(this.curtainG, this.valance, this.frame, this.bulbsG, this.foot, this.gearsG, this.keyG);
    L.world.addChild(L.wfx);
    // the true-color layer rides above the film, under the prompts
    this.over.addChild(this.glow);
    L.ui.addChildAt(this.over, 0);
    // ---- the corrected cast: Tachón on the podium, the chorus line in mirror pairs, two back rows for the big show
    this.tachon = new SymCat(this.studio, this.slugs.tachon, 300);
    this.tachon.position.set(AXIS, 612);
    this.cast.addChild(this.tachon);
    LINE.forEach((l, i) => {
      for (const side of [-1, 1] as const) {
        const c = new SymCat(this.studio, this.slugs[l.who], l.h);
        c.position.set(AXIS + side * l.dx, l.y);
        this.cast.addChild(c);
        this.line.push({ c, side, i, dx: l.dx, y: l.y });
      }
    });
    // the back rows (the plan multiplies them): small, perfect, identical
    const rowSlugs = [this.slugs.ronron, this.slugs.espejito, this.slugs.farolillo, this.slugs.ronron];
    for (let r = 0; r < 2; r++) {
      for (let i = 0; i < 8; i++) {
        const side = i < 4 ? -1 : 1;
        const j = i % 4;
        const c = new SymCat(this.studio, rowSlugs[j], 120 - r * 22);
        c.position.set(AXIS + side * (250 + j * 95 + r * 30), 640 - r * 26);
        this.rowBack.addChild(c);
        this.extra.push(c);
      }
    }
    // ---- the free ones (asymmetric, alive): Canelo, Luzterna, the crew
    const mk = (who: Who, size: number) => {
      if (!this.slugs[who] || !this.studio.has(this.slugs[who])) return;
      const a = new Actor(this.studio, this.slugs[who], size);
      this.actors[who] = a;
      this.cast.addChild(a);
    };
    mk('crew0', 200);
    mk('crew1', 190);
    mk('canelo', 270);
    this.canSym = new SymCat(this.studio, this.slugs.canelo, 270);
    this.canSym.visible = false;
    this.cast.addChild(this.canSym, this.lantern);
    const FULL = new Set(['coldOpen', 'titleCard', 'stampShot', 'lineShot', 'rollShot', 'mirrorShot', 'gearsShot']);
    for (const c of k.score.cues) {
      if (!FULL.has(c.act.verb)) continue;
      const a = c.act.args;
      const d = typeof a.beats === 'number' ? (a.beats as number) * k.beat : typeof a.dur === 'number' ? (a.dur as number) : 1;
      this.shots.push([c.m, c.m + d]);
    }
    // the riff's notes → a pipe each (lowest to highest)
    const notes = [...new Set(k.onsetList('bass').map((o) => o.midi).filter((x): x is number => typeof x === 'number'))].sort((a, b) => a - b);
    notes.forEach((n, i) => this.bassRank.set(n, i / Math.max(1, notes.length - 1)));
  }

  // ---------------------------------------------------------------- requests from clips
  wantPose(who: Who, req: PoseReq) {
    this.poses.set(who, req);
  }
  film1(part: Partial<FilmState>) {
    const w = this.wantFilm as Record<string, number>;
    for (const [k, v] of Object.entries(part)) if (typeof v === 'number') w[k] = Math.max(w[k] ?? -1e9, v);
  }
  setAnchor(name: string, p: [number, number]) {
    this.anchors.set(name, p);
  }

  // ---------------------------------------------------------------- music helpers
  /** stepped time: on twos, but restarting on every beat (the hop lands exactly on it) */
  stepM(m: number) {
    const b = this.k.beat;
    const i = Math.floor(m / b);
    return i * b + Math.floor((m - i * b) * 12) / 12;
  }
  /** the rubber-hose hop: 0 on the beat (contact), up between beats */
  hop(m: number, phase = 0) {
    const p = (((m / this.k.beat + phase) % 1) + 1) % 1;
    return Math.sin(p * Math.PI);
  }
  judgedBy(id: string, m: number) {
    const j = this.k.judged(id);
    return j && j.at <= m + 1e-6 ? j.r : null;
  }

  // ---------------------------------------------------------------- per frame
  /** when the full-frame shots cover the set (from the score): the set's redraws can wait, nobody sees them */
  private shots: [number, number][] = [];
  private coveredAt(m: number) {
    for (const [a, b] of this.shots) if (m >= a + 0.02 && m < b - 0.04) return true;
    return false;
  }
  update(k: Kit, m: number) {
    this.poses.clear();
    this.wantFilm = {};
    this.wantSym = 0;
    this.lineReq = null;
    this.canSymReq = false;
    this.charge = 0;
    const motion = k.reduceMotion ? 0.3 : 1;
    const ms = this.stepM(m);
    const still = k.num('still', 0);
    const live = 1 - still;
    const kick = k.env('kick', m, 0.09) * live;
    const snareE = k.env('snare', m, 0.12) * live;
    k.cam.punch(0.012 * kick);
    // gate weave: the old film wobbles in its gate at 12 fps (not in the pristine final)
    const gw = k.num('grain', 1) * motion;
    k.cam.offset(vnoise(Math.floor(m * 12) * 0.7, 3) * 2.2 * gw, vnoise(Math.floor(m * 12) * 0.7, 9) * 2.6 * gw);

    const hop = this.hop(ms) * live;
    const kickS = k.env('kick', ms, 0.09) * live;
    if (this.coveredAt(m)) return;
    // ---- the backdrop: the sun behind the clock turns one wedge per bar (mechanical), the clock ticks on the hats
    const bars = Math.floor(m / k.bar);
    this.sun.clear();
    sunburst(this.sun, AXIS, 370, 330, 20, (bars % 20) * ((Math.PI * 2) / 20) * 0.5, CREAM, 0xe8d8b8);
    this.sun.circle(AXIS, 370, 330).stroke({ width: 6, color: INK });
    const perc = k.env('perc', m, 0.06) * live;
    const skewed = this.clockSkew(m);
    this.clock.clear();
    drawClock(this.clock, AXIS, 360, 120, perc, skewed);
    this.clock.scale.set(1 + 0.03 * kickS);
    this.clock.pivot.set(AXIS * 0.03 * kickS, 360 * 0.03 * kickS);
    // the pendulum swings with the bass line (its note sets the angle: the riff becomes a swing)
    const bn = k.last('bass', m, 0.1);
    const rank = bn && typeof bn.o.midi === 'number' ? (this.bassRank.get(bn.o.midi) ?? 0.5) : 0.5;
    this.pendulum.clear();
    const pa = Math.sin((m / k.bar) * Math.PI * 2) * 0.22 * live;
    const px = AXIS + Math.sin(pa) * 150;
    const py = 360 + Math.cos(pa) * 150;
    this.pendulum.moveTo(AXIS, 360).lineTo(px, py).stroke({ width: 10, color: INK });
    this.pendulum.circle(px, py, 34 + 10 * rank * live).fill(GOLD).stroke({ width: 6, color: INK });
    // bunting across the top of the tent: flips on the hats
    this.flags.clear();
    const flip = k.last('perc', m)?.i ?? 0;
    both((sx) => bunting(this.flags, sx(OPEN.x0), OPEN.top + 150 - hop * 6, sx(AXIS), OPEN.top + 110 - hop * 6, 6, 50, flip % 2 ? 1 : -1));
    // ---- the calliopes: the pipe of the note shoots up, steam rings on the piano stabs
    this.calli.clear();
    const bassE = k.env('bass', m, 0.25) * live;
    const bent = this.calliBent(m);
    both((sx, side) => {
      const heights = Array.from({ length: 7 }, (_, i) => {
        const target = Math.round(rank * 6);
        const sideIdx = side < 0 ? i : 6 - i;
        return (sideIdx === target ? 1 : 0.15) * bassE;
      });
      const cx = sx(470);
      this.calli.position.set(0, -hop * 10 * live);
      drawCalliope(this.calli, cx, 760, heights, side, bent);
    });
    this.drawPuffs(k, m, live);
    // ---- the floor and podium hop too (rubber-hose: everything breathes on the beat)
    this.podium.pivot.set(0, 0);
    this.podium.scale.set(1, 1 - 0.02 * kickS);
    this.podium.position.set(0, 600 * 0.02 * kickS);
    // ---- the gloves stamp on the backbeat
    this.drawStamps(k, m, live);
    // ---- the proscenium: bulbs chase on the hats, flare on the kicks; footlights pulse
    this.drawBulbs(k, m, kick, live);
    this.curtainG.clear();
    drawCurtain(this.curtainG, ease('inOut', k.num('curtain', 0)), Math.sin(m * 1.3) * 0.5);
    this.foot.clear();
    for (let i = -7; i <= 7; i++) {
      const x = AXIS + i * 88;
      const y = FLOOR.frontY + 30;
      this.foot.ellipse(x, y + 6, 30, 16).fill(INK);
      this.foot.ellipse(x, y, 24, 14 + 4 * kick).fill(kick > 0.4 ? PAPER : GOLD);
    }
    // ---- the clockwork (build): gears turn one notch per bass note, the wind-up key a quarter turn per snare
    this.drawGears(k, m);
    // the back rows of the plan: as many as `rows` says, hopping in unison
    const rows = k.num('rows', 0);
    this.rowBack.visible = rows > 0.01;
    this.extra.forEach((c, i) => {
      const r = Math.floor(i / 8);
      c.visible = rows > r * 0.5 + 0.01;
      c.position.y = 640 - r * 26 - hop * 14;
      c.scale.set(1 + 0.06 * kickS, 1 - 0.08 * kickS);
    });
  }

  /** the clock stamped crooked (big_hit_5 great) until the order is restored */
  private clockSkew(m: number) {
    const r = this.judgedBy('megasello', m);
    return r === 'great' && m < ORDER_T ? 0.07 : 0;
  }
  /** the calliope pipes bent by the organ mash, until the order is restored */
  private calliBent(m: number) {
    const r = this.judgedBy('organillo', m);
    if (!r || m >= ORDER_T) return 0;
    return r === 'great' ? 1 : r === 'hit' ? 0.5 : 0;
  }

  private updateCast(k: Kit, m: number, ms: number, hop: number, kickS: number, snareE: number, live: number) {
    const snareN = k.last('snare', m, 0.3);
    const kickSide = snareN ? (snareN.i % 2 ? 1 : -1) : 0;
    const legKick = snareE > 0.05 ? Math.min(1, snareE * 1.4) : 0;
    // Tachón: beats time with his marker on the piano stabs (the podium is his)
    if (this.tachon) {
      const mel = k.env('melody', m, 0.1) * live;
      this.tachon.position.set(AXIS, 612 - hop * 12);
      this.tachon.scale.set(1 + 0.05 * kickS + 0.03 * mel, 1 - 0.07 * kickS);
      this.tachon.rotation = 0;
    }
    for (const l of this.line) {
      // a knocked-out dancer (chorus2) dances off the beat, tilted, until the order comes back
      const out = this.knockedOut(l.i * 2 + (l.side > 0 ? 1 : 0), m);
      const ph = out ? 0.5 : 0;
      const h2 = out ? this.hop(this.stepM(m), ph) * live : hop;
      const tilt = out ? Math.sin(m * 7 + l.i) * 0.18 : (kickSide === l.side ? -1 : 1) * legKick * 0.09 * l.side;
      const rq = this.lineReq;
      l.c.position.set(AXIS + l.side * (l.dx + (rq?.dx ?? 0)) + (out ? Math.sin(m * 3.1 + l.i) * 30 : 0), l.y - h2 * 22 + (rq?.dy ?? 0));
      l.c.rotation = tilt + l.side * (rq?.rot ?? 0);
      l.c.scale.set(l.side * (1 + 0.07 * kickS), 1 - 0.1 * kickS);
    }
  }

  /** the free ones (after the clips: their pose requests are in) */
  private placeFree(k: Kit, m: number) {
    const hop = this.hop(this.stepM(m)) * (1 - k.num('still', 0));
    // ---- Canelo: alive, never on the beat — he breathes, looks around; clips ask for poses
    const a = this.actors.canelo;
    const on = k.num('can', 0) > 0.5;
    if (a) {
      a.visible = on;
      const req = this.poses.get('canelo');
      const x = k.num('can.x', 760);
      const y = k.num('can.y', 960);
      const p = this.poseOf(req, m);
      a.pose(m, x + p.dx, y + p.dy, { rot: p.rot, sx: p.sx, sy: p.sy, flip: p.flip, step: k.beatStep(m) + Math.floor(m * 12) });
      if (p.emote) a.emote(p.emote as Parameters<Actor['emote']>[0]);
      // the corrected Canelo replaces him while he is stamped flat (a clip shows it)
      if (this.canSym) {
        const sym = req?.name === 'sym' || this.canSymReq || k.num('canSym', 0) > 0.5;
        this.canSym.visible = on && sym;
        a.alpha = on && sym ? 0 : 1;
        this.canSym.position.set(x + p.dx, y + p.dy - hop * 16 * (sym ? 1 : 0));
        this.canSym.scale.set(p.sx ?? 1, p.sy ?? 1);
      }
      const head = a.head();
      const hp = a.toGlobal({ x: head[0], y: head[1] });
      const wp = k.layers.world.toLocal(hp);
      const sp = k.cam.toScreen(wp.x, wp.y);
      this.anchors.set('canelo', [sp[0] + 230, sp[1] - 20]);
      this.anchors.set('caneloHead', sp);
    }
    // Luzterna floats at his shoulder on her own (slow, off-beat) — her lantern is the only TRUE color on the film
    const luzOn = k.num('luz', 0);
    this.glow.clear();
    const lg = this.lantern;
    lg.clear();
    if (luzOn > 0.01 && on) {
      const req = this.poses.get('luzterna');
      const x = k.num('can.x', 760) - 200 + Math.sin(m * 1.7) * 18 + (req?.dx ?? 0);
      const y = k.num('can.y', 960) - 300 + Math.sin(m * 2.3) * 14 + (req?.dy ?? 0);
      const rot = Math.sin(m * 1.1) * 0.12;
      lg.position.set(x, y);
      lg.rotation = rot;
      lg.alpha = Math.min(1, luzOn);
      drawLantern(lg, m, this.charge);
      if (!k.fullFrame) {
        const [gx, gy] = k.cam.toScreen(x, y + 10);
        const z = k.cam.zoom;
        const fade = 1 - k.num('fade', 0);
        const r = (80 + 25 * Math.sin(m * 3) + 140 * this.charge) * z;
        this.glow.circle(gx, gy, r * 1.6).fill({ color: 0xffc35a, alpha: 0.08 * luzOn * fade });
        this.glow.circle(gx, gy, r).fill({ color: 0xffd27a, alpha: 0.14 * luzOn * fade });
        this.glow.circle(gx, gy, r * 0.4).fill({ color: 0xfff0b8, alpha: 0.24 * luzOn * fade });
      }
    }
    // the crew (chorus2): two more free cats, dancing their own dance, a little behind Canelo
    const crewOn = k.num('crew', 0) > 0.5;
    (['crew0', 'crew1'] as const).forEach((w, i) => {
      const c = this.actors[w];
      if (!c) return;
      c.visible = crewOn && on;
      const x = k.num('can.x', 760) + (i ? 330 : -260);
      const y = k.num('can.y', 960) - 30 - Math.abs(Math.sin(m * 4.2 + i * 1.3)) * 30;
      c.pose(m, x, y, { rot: Math.sin(m * 3.3 + i) * 0.1, flip: i === 1 });
    });
    // anchors for prompts in the set
    this.anchors.set('center', [W / 2, H * 0.32]);
  }

  /** has dancer n (0..5) been knocked out of step by a chorus2 tap? (until the order is restored) */
  private knockedOut(n: number, m: number) {
    if (m >= ORDER_T) return false;
    const id = KNOCKS[n];
    if (!id) return false;
    const r = this.judgedBy(id, m);
    return r === 'great' || r === 'hit';
  }

  /** a pose request → an offset transform (rubber-hose: squash, stretch, overshoot) */
  private poseOf(req: PoseReq | undefined, m: number): { dx: number; dy: number; rot: number; sx: number; sy: number; flip: boolean; emote?: string } {
    const idle = { dx: 0, dy: Math.sin(m * 2.1) * 3, rot: Math.sin(m * 0.9) * 0.02, sx: 1, sy: 1 + Math.sin(m * 2.1) * 0.01, flip: false };
    if (!req) return idle;
    const t = req.lt;
    const o = { ...idle, dx: req.dx ?? 0, dy: req.dy ?? 0, rot: req.rot ?? 0, sx: req.sx ?? 1, sy: req.sy ?? 1 } as ReturnType<CircusStage['poseOf']>;
    switch (req.name) {
      case 'flat': {
        // stamped flat like a pancake, then the accordion pop
        const k1 = Math.min(1, t / 0.5);
        o.sy = t < 0.5 ? 0.22 : 0.22 + 0.78 * ease('elastic', (t - 0.5) / 0.5);
        o.sx = t < 0.5 ? 1.6 : 1.6 - 0.6 * ease('elastic', (t - 0.5) / 0.5);
        o.emote = k1 < 1 ? 'hurt' : 'surprise';
        break;
      }
      case 'cool':
        o.rot = -0.12;
        o.sy = 1.06;
        o.emote = 'happy';
        break;
      case 'twirl':
        o.sx = Math.cos(t * Math.PI * 4);
        o.dy -= Math.sin(Math.min(1, t / 0.6) * Math.PI) * 120;
        o.emote = 'happy';
        break;
      case 'trip':
        o.rot = 0.5 * Math.sin(Math.min(1, t / 0.4) * Math.PI * 0.5);
        o.dy += 20;
        o.emote = 'surprise';
        break;
      case 'duck':
        o.sy = 0.62;
        o.sx = 1.25;
        o.emote = 'surprise';
        break;
      case 'stretch':
        // the rubber-hose dodge: stretched sideways, then snaps back
        o.sx = 1 + 0.6 * Math.max(0, 1 - t / 0.35);
        o.sy = 1 - 0.3 * Math.max(0, 1 - t / 0.35);
        o.emote = 'happy';
        break;
      case 'attack':
        o.rot = -0.08;
        o.emote = 'attack';
        break;
      case 'hold':
        o.sy = 0.88 + Math.sin(m * 30) * 0.01;
        o.sx = 1.08;
        o.rot = Math.sin(m * 25) * 0.02;
        o.emote = 'attack';
        break;
      case 'dizzy':
        o.rot = Math.sin(t * 9) * 0.12;
        o.emote = 'sleepy';
        break;
      case 'surprise':
        o.emote = 'surprise';
        o.sy = 1.08;
        break;
      case 'sleepy':
        o.emote = 'sleepy';
        break;
      default:
        break;
    }
    return o;
  }

  private drawPuffs(k: Kit, m: number, live: number) {
    const g = this.puffs;
    g.clear();
    if (k.fullFrame || live < 0.01) return;
    const list = k.onsetList('melody');
    const x = k.last('melody', m, 0.3);
    if (!x) return;
    for (let i = x.i; i >= 0 && i > x.i - 4; i--) {
      const o = list[i];
      const age = m - o.t;
      if (age > 0.5) break;
      if (o.strength < 0.3) continue;
      const u = age / 0.5;
      both((sx) => {
        const cx = sx(470 + ((i % 3) - 1) * 40);
        const cy = 360 - u * 160;
        const r = 18 + 50 * ease('out', u);
        g.circle(cx, cy, r + 5).stroke({ width: 7, color: INK, alpha: 1 - u });
        g.circle(cx, cy, r).stroke({ width: 10, color: PAPER, alpha: 1 - u });
      });
    }
  }

  /** the two gloves of the wings slam their stamps on every backbeat (anticipation → slam on the onset → lift) */
  private drawStamps(k: Kit, m: number, live: number) {
    const g = this.stamps;
    g.clear();
    if (k.fullFrame || k.num('curtain', 0) < 0.5 || live < 0.01) return;
    const list = k.onsetList('snare');
    const prev = k.last('snare', m, 0.3);
    let next: { t: number } | null = null;
    for (let i = prev ? prev.i + 1 : 0; i < list.length; i++) {
      if (list[i].strength >= 0.3) {
        next = list[i];
        break;
      }
    }
    // the stamps only work while the band plays loud (from the snare's entry to the final)
    if (m < 29 || m > 115.2) return;
    const age = prev ? m - prev.o.t : 9;
    const until = next ? next.t - m : 9;
    // height above the floor: 0 = slammed. wind up 0.18 s before, slam on the onset, hold 0.07, lift
    let up = 1;
    if (age < 0.07) up = 0;
    else if (age < 0.35) up = ease('out', (age - 0.07) / 0.28);
    if (until < 0.18) up = Math.min(up, 1) + (1 - until / 0.18) * 0.25;
    const yFloor = 770;
    const y = yFloor - up * 330;
    both((sx, side) => {
      const x = sx(AXIS - 420);
      stamp(g, x, y, 0.55);
      glove(g, x, y - 135, 0.62, 1, -side);
      if (age < 0.25) {
        // the print it leaves: a check in a box (perfectly straight), fading
        const a = 1 - age / 0.25;
        g.rect(x - 70, yFloor + 4, 140, 26).stroke({ width: 5, color: RED, alpha: a });
        g.moveTo(x - 20, yFloor + 17).lineTo(x - 4, yFloor + 26).lineTo(x + 26, yFloor + 8).stroke({ width: 6, color: RED, alpha: a });
      }
    });
  }

  private drawBulbs(k: Kit, m: number, kick: number, live: number) {
    const g = this.bulbsG;
    g.clear();
    const chase = k.last('perc', m)?.i ?? 0;
    const all = kick > 0.45;
    this.bulbPts.forEach(([x, y], i) => {
      const on = live < 0.5 ? 1 : all ? 1 : (i + chase) % 3 === 0 ? 1 : 0.2;
      bulb(g, x, y, 13, on);
    });
  }

  private drawGears(k: Kit, m: number) {
    const g = this.gearsG;
    g.clear();
    const show = k.num('gears', 0);
    if (show > 0.01) {
      // one notch per bass note since the Momento began (pure: the count of notes up to m)
      const b = k.last('bass', m);
      const notch = b ? b.i : 0;
      const a = notch * (Math.PI / 8);
      const y0 = OPEN.top + 40;
      const slide = (1 - ease('outBack', show)) * 300;
      both((sx, side) => {
        gear(g, sx(150) - side * slide, y0 + 40, 150, 12, side * a, GOLD);
        gear(g, sx(330) - side * slide, y0 - 90, 90, 9, -side * a * 1.4 + 0.2, CREAM);
        gear(g, sx(120) - side * slide, y0 + 330, 110, 10, -side * a * 1.2, GOLD);
      });
    }
    const kg = this.keyG;
    kg.clear();
    const key = k.num('key', 0);
    if (key > 0.01) {
      // the wind-up key on top of the theatre: a quarter turn per snare of the build (seen edge-on as it turns)
      const n = k.onsetList('snare').filter((o) => o.t >= 67.2 && o.t <= m && o.strength >= 0.3).length;
      const last = k.last('snare', m, 0.3);
      const age = last ? m - last.o.t : 1;
      const turn = n + Math.min(1, age / 0.18);
      const c = Math.cos((turn * Math.PI) / 2);
      const y = OPEN.top - 420 + (1 - key) * -400;
      kg.rect(AXIS - 26, y + 90, 52, 140).fill(GOLD_D).stroke({ width: 6, color: INK });
      const w = Math.max(0.12, Math.abs(c));
      both((sx) => {
        kg.ellipse(sx(AXIS - 120 * w), y, 110 * w, 95).fill(GOLD).stroke({ width: 7, color: INK });
        kg.ellipse(sx(AXIS - 120 * w), y, 50 * w, 40).fill(WOOD_D);
      });
      kg.circle(AXIS, y + 60, 40).fill(GOLD).stroke({ width: 6, color: INK });
    }
  }

  late(k: Kit, m: number) {
    {
      const live = 1 - k.num('still', 0);
      const ms = this.stepM(m);
      this.updateCast(k, m, ms, this.hop(ms) * live, k.env('kick', ms, 0.09) * live, k.env('snare', m, 0.12) * live, live);
    }
    this.placeFree(k, m);
    // ---- the film: props + what clips asked for this frame
    const w = this.wantFilm;
    const pick = (name: keyof FilmState, prop: string, d: number) => Math.max(k.num(prop, d), (w[name] as number | undefined) ?? -1e9);
    const grain = k.num('grain', 1);
    const st: FilmState = {
      mode0: k.num('film0', 0),
      mode1: k.num('film1', 0),
      wipe: k.num('wipe', 0),
      grain: 0.075 * grain,
      flick: 0.07 * grain * (k.reduceFlashes ? 0.4 : 1),
      vig: 0.42 + 0.18 * grain,
      scratch: grain,
      iris: Math.min(k.num('iris', 2), (w.iris as number | undefined) ?? 2),
      irisX: k.num('irisX', 0.5),
      irisY: k.num('irisY', 0.5),
      sym: Math.max(k.num('sym', 0), this.wantSym),
      burn: pick('burn', 'burn', 0),
      burnX: k.num('burnX', 0.5),
      burnY: k.num('burnY', 0.45),
      tear: pick('tear', 'tear', 0) * (k.reduceMotion ? 0.5 : 1),
      slip: k.num('slip', 0) * (k.reduceMotion ? 0.3 : 1),
    };
    if (w.mode0 !== undefined) st.mode0 = Math.max(st.mode0, w.mode0);
    this.film.set(st, Math.floor(m * 24));
  }

  anchor(name: string): [number, number] | null {
    return this.anchors.get(name) ?? null;
  }

  destroy() {
    this.over.destroy({ children: true });
    for (const c of [...this.line.map((l) => l.c), ...this.extra]) c.destroy({ children: true });
    this.tachon?.destroy({ children: true });
    this.canSym?.destroy({ children: true });
    for (const a of Object.values(this.actors)) a?.destroy({ children: true });
    this.film.destroy();
    // textures may still be bound to the last frame: free the studio a few frames later
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

/** Luzterna as a 1930s cartoon: a paper lantern with pie-cut eyes and a flame that leans on its own (off the beat) */
function drawLantern(g: Graphics, m: number, charge: number) {
  g.moveTo(0, -95).lineTo(0, -70).stroke({ width: 5, color: INK });
  g.roundRect(-34, -74, 68, 18, 6).fill(GOLD).stroke({ width: 5, color: INK });
  g.ellipse(0, 0, 58, 66).fill(PAPER).stroke({ width: 6, color: INK });
  for (const dx of [-30, 0, 30]) g.moveTo(dx, -58).quadraticCurveTo(dx * 1.4, 0, dx, 58).stroke({ width: 3, color: 0xcfc2a8 });
  g.roundRect(-30, 56, 60, 16, 6).fill(GOLD).stroke({ width: 5, color: INK });
  // the flame inside (she breathes on her own time)
  const f = 1 + 0.15 * Math.sin(m * 9) + 0.6 * charge;
  g.moveTo(0, 30).quadraticCurveTo(-18 * f, 10, 0, -26 * f).quadraticCurveTo(18 * f, 10, 0, 30).fill(GOLD);
  // pie-cut eyes and a little smile
  for (const ex of [-18, 18]) {
    g.ellipse(ex, -8, 8, 13).fill(INK);
    g.poly([ex, -8, ex + 9, -20, ex + 9, -6]).fill(PAPER);
  }
  g.arc(0, 12, 12, 0.2, Math.PI - 0.2).stroke({ width: 4, color: INK });
}

export default function createStage(k: Kit): StageApi {
  return new CircusStage(k);
}
