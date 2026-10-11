/**
 * LIKY FIGHT — the set (H44: the sea battle with Cascada turns into a party in the sky).
 *
 * World space: the waterline is y = WATER; our ship (Canelo) sits left at x = A_X facing right, the party galleon
 * right at x = B_X facing left. Everything is a pure function of momento time: props from the score's key tracks
 * ('cam.*', 'shipA.*', 'shipB.*', 'kit', 'falls', 'wind', 'party', 'beams', 'shards', 'sun.y'), state derived from the
 * score's own cues (party lights from 'lightUp' / 'fiesta', cannon aim from 'cannonSwing'), beat bobs from the grid.
 * Clips (verbs.ts) ask for poses and ship jolts through want*(); late() applies them.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { Kit, StageApi } from '../../anime/kit';
import { W, H } from '../../anime/kit';
import { Actor } from '../../anime/actor';
import { bands, cloud, rng, starPts } from '../../anime/draw';
import { lerpColor } from '../../anime/palette';
import { ease } from '../../score';
import { songHits } from '../../time';
import { G } from '../../../state/game';
import { catSlug } from '../../../state/sys/forms';
import { INK, OurShip, PartyShip, drawScar } from './ships';
import { LIKY_VERBS } from './verbs';
import { SHOT_VERBS } from './shots';

export const WATER = 760;
export const A_X = 560;
export const B_X = 1380;

export type Who = 'canelo' | 'luzterna' | 'cascada' | 'plomito' | 'globito' | 'fly';
export interface PoseReq {
  name: string;
  lt: number;
  /** absolute world position override (fly) */
  x?: number;
  y?: number;
  rot?: number;
  s?: number;
}

/** Canelo as the player has him (his form), else the Almirante he became in H38 */
function caneloSlug(): string {
  try {
    const c = G.s?.cats?.find((x) => x.species === 'c_canelo');
    if (c) return catSlug(c);
  } catch {
    /* no save */
  }
  return 'canelo_admiral_cat';
}

export class LikyStage implements StageApi {
  verbs = { ...LIKY_VERBS, ...SHOT_VERBS };
  props: Record<string, number | string> = {
    pal: 'noir',
    'cam.x': B_X - 40,
    'cam.y': 520,
    'cam.zoom': 1.3,
    'shipA.y': 0,
    'shipA.x': 0,
    'shipA.rot': 0,
    'shipB.y': 0,
    'shipB.x': 0,
    'shipB.rot': 0,
    kit: 0,
    falls: 0,
    wind: 0,
    party: 0,
    beams: 0,
    shards: 0,
    'sun.y': 0.62,
    sea: 1,
    islands: 1,
    near: 0,
    floor: 0,
    lightsOff: 0,
    islandsNear: 0,
  };
  // ---- layers
  private sky = new Graphics();
  private sun = new Graphics();
  private stars = new Graphics();
  private shardsG = new Graphics();
  /** the sea of clouds under the sky scenes (screen space, scrolls with the wind) */
  private floorG = new Graphics();
  private far = new Container();
  private farIslands = new Graphics();
  private farClouds: Graphics[] = [];
  private seaG = new Graphics();
  private foam = new Graphics();
  private beamsG = new Graphics();
  private fallsG = new Graphics();
  private nearClouds: Graphics[] = [];
  private near = new Container();
  readonly A = new OurShip();
  readonly B = new PartyShip();
  // ---- actors
  actors: Partial<Record<Who, Actor>> = {};
  slugs: Record<Who, string> = { canelo: 'canelo_admiral_cat', luzterna: 'luzterna', cascada: 'cascada_upfall_cat', plomito: 'plomito_plumb_cat', globito: 'globito_balloon_cat', fly: '' };
  // ---- derived from the score
  private kicks: number[] = [];
  private beats: number[] = [];
  private lightTimes: number[] = [];
  private fiestaAt: { m: number; late: boolean }[] = [];
  private swingAt: { m: number; i: number }[] = [];
  private palKey = '';
  private lastSkyStep = -1;
  // ---- per frame requests from clips
  private poses = new Map<Who, PoseReq>();
  private jolts: { ship: 'A' | 'B'; dx: number; dy: number; rot: number; sx: number; sy: number }[] = [];
  private windAcc = { m: 0, x: 0 };
  /** scars on the hulls (momento time they appeared, ship-local position): they stay for the rest of the Momento */
  private scars: { ship: 'A' | 'B'; m: number; x: number; y: number; r: number; seed: number }[] = [];
  private scarStep = -1;
  /** a far mountain/island range on the horizon + long cloud streaks in the mid sky (two more parallax depths) */
  private horizon = new Graphics();
  private streaks = new Graphics();
  private mid = new Container();
  /** always-on reactions to the onsets: cannon puffs on accents, splashes, melody sparkles (one Graphics, redrawn) */
  private onsetFx = new Graphics();
  /** big upside-down islands passing in the foreground (the chase through the Islas Invertidas) */
  private nearIslands = new Graphics();
  /** sky tint on the bass, a glow on the kicks (screen space, additive) */
  private pulseG = new Graphics();
  /** screen anchors computed each frame */
  private anchors = new Map<string, [number, number]>();
  palettes = {};

  constructor(private k: Kit) {}

  async build(k: Kit) {
    this.slugs.canelo = caneloSlug();
    this.slugs.fly = this.slugs.canelo;
    const crew = k.crew.filter((s) => s && !Object.values(this.slugs).includes(s)).slice(0, 2);
    await k.studio.loadAll([...Object.values(this.slugs).filter(Boolean), ...crew]);
    (k as Kit & { crewLoaded?: string[] }).crewLoaded = crew.filter((s) => k.studio.has(s));
    const L = k.layers;
    L.bg.addChild(this.sky, this.stars, this.sun, this.shardsG, this.pulseG, this.floorG);
    this.pulseG.blendMode = 'add';
    this.far.addChild(this.farIslands);
    const R = rng(44);
    for (let i = 0; i < 9; i++) {
      const g = new Graphics();
      (g as Graphics & { seed?: number; w?: number }).seed = i * 13 + 7;
      g.position.set(-1600 + i * 620 + R() * 200, WATER - 260 - R() * 900);
      this.farClouds.push(g);
      this.far.addChild(g);
    }
    for (let i = 0; i < 7; i++) {
      const g = new Graphics();
      g.position.set(-800 + i * 760 + R() * 300, WATER - 700 - R() * 900);
      this.nearClouds.push(g);
      this.near.addChild(g);
    }
    this.mid.addChild(this.streaks);
    // world order, back to front: horizon range · far scenery · mid streaks · sea · foam · beams · waterfalls · ships
    // (then wfx, then the near clouds / islands) — wfx is already a child of world: keep it on top of the set
    for (const c of [this.horizon, this.far, this.mid, this.seaG, this.foam, this.beamsG, this.fallsG, this.A, this.B]) L.world.addChild(c);
    L.world.addChild(L.wfx);
    L.world.addChild(this.near);
    this.near.addChild(this.nearIslands);
    this.drawNearIslands();
    L.wfx.addChild(this.onsetFx);
    // actors on the decks
    const mk = (who: Who, size: number, parent: Container, x: number, y: number) => {
      const a = new Actor(k.studio, this.slugs[who], size);
      a.position.set(x, y);
      (a as Actor & { home?: [number, number] }).home = [x, y];
      parent.addChild(a);
      this.actors[who] = a;
    };
    mk('canelo', 250, this.A.deck, 165, -150);
    mk('luzterna', 200, this.A.deck, -300, -250);
    mk('cascada', 260, this.B.deck, -80, -150);
    mk('plomito', 120, this.B.deck, -215, -150);
    mk('globito', 120, this.B.deck, 290, -330);
    const fly = new Actor(k.studio, this.slugs.fly, 230);
    fly.visible = false;
    this.actors.fly = fly;
    L.wfx.addChild(fly);
    if (this.actors.luzterna) this.actors.luzterna.alpha = 0.9;
    // what the score says, precomputed
    const hits = songHits(k.map);
    this.kicks = hits.filter((h) => (h.kind === 'kick' || h.kind === 'drop' || h.kind === 'phrase') && h.strength >= 0.6).map((h) => h.time);
    this.beats = k.map.beats;
    const cues = k.score.cues;
    this.lightTimes = cues.filter((c) => c.act.verb === 'lightUp').map((c) => c.m).sort((a, b) => a - b);
    this.fiestaAt = [];
    this.swingAt = cues.filter((c) => c.act.verb === 'cannonSwing').map((c) => ({ m: c.m, i: Number(c.act.args.i ?? 0) }));
    this.drawFarIslands();
  }

  // ---------------------------------------------------------------- requests from clips
  /** a clip wants an actor in a pose this frame */
  wantPose(who: Who, req: PoseReq) {
    this.poses.set(who, req);
  }
  /** a clip jolts a ship this frame (bounces, recoils, rolls) */
  wantJolt(ship: 'A' | 'B', j: Partial<{ dx: number; dy: number; rot: number; sx: number; sy: number }>) {
    this.jolts.push({ ship, dx: j.dx ?? 0, dy: j.dy ?? 0, rot: j.rot ?? 0, sx: j.sx ?? 1, sy: j.sy ?? 1 });
  }
  /** a shot landed on a hull: a scar that stays (ship-local; registered once per cue) */
  addScar(ship: 'A' | 'B', m: number, wx: number, wy: number, r: number, seed: number) {
    if (this.scars.some((s) => s.seed === seed)) return;
    const c = ship === 'A' ? this.A : this.B;
    const cos = Math.cos(-c.rotation);
    const sin = Math.sin(-c.rotation);
    const dx = (wx - c.x) / (c.scale.x || 1);
    const dy = (wy - c.y) / (c.scale.y || 1);
    // keep scars on the hull band (below the rail, above the keel)
    const lx = Math.max(-240, Math.min(240, dx * cos - dy * sin));
    const ly = Math.max(-140, Math.min(-50, dx * sin + dy * cos));
    this.scars.push({ ship, m, x: lx, y: ly, r, seed });
    this.scars.sort((a, b) => a.m - b.m);
  }
  /** a fiesta happened (the stage lights everything from then on) */
  fiesta(m: number, late: boolean) {
    if (!this.fiestaAt.some((f) => Math.abs(f.m - m) < 0.01)) this.fiestaAt.push({ m, late });
  }

  // ---------------------------------------------------------------- geometry helpers (world)
  shipPos(s: 'A' | 'B') {
    const k = this.k;
    return s === 'A' ? { x: A_X + k.num('shipA.x'), y: WATER + k.num('shipA.y') } : { x: B_X + k.num('shipB.x'), y: WATER + k.num('shipB.y') };
  }
  /** a point in a ship's local space → world (uses the live container transform) */
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
  /** the 3 spots on our hull where batted / missed balls land */
  hullSpot(i: number): [number, number] {
    const spots: [number, number][] = [
      [190, -230],
      [60, -260],
      [250, -300],
    ];
    const s = spots[((i % 3) + 3) % 3];
    return this.world('A', s[0], s[1]);
  }

  // ---------------------------------------------------------------- per frame
  update(k: Kit, m: number) {
    this.poses.clear();
    this.jolts.length = 0;
    this.drawSky(k, m);
    // ---- every sound has a purpose: the kick punches the camera, the sub shakes it, the bass tints the sky
    const motion = k.reduceMotion ? 0.3 : 1;
    const kick = k.env('kick', m, 0.09);
    k.cam.punch(0.011 * kick);
    const bn = k.last('bass', m, 0.12);
    const bassE = k.env('bass', m, 0.4, 0.12);
    if (bn && bn.o.midi !== null && bn.o.midi !== undefined && bn.o.midi < 38 && m - bn.o.t < 0.25) k.cam.shake(5 * bassE * motion, m, 9, 18);
    const v = k.view;
    this.pulseG.clear();
    if (!k.fullFrame) {
      this.pulseG.rect(v.x, v.y, v.w, v.h * 0.75).fill({ color: k.pal.accent, alpha: 0.06 * bassE + 0.05 * kick });
      this.pulseG.rect(v.x, v.y + v.h * 0.55, v.w, v.h * 0.45).fill({ color: k.pal.accent2, alpha: 0.05 * kick });
    }
    this.sun.scale.set(1 + 0.035 * kick);
    this.sun.pivot.set(0, 0);
    // far scenery: slow parallax + the wind scroll
    const wind = this.windAt(k, m);
    const cx = k.cam.x;
    const cy = k.cam.y;
    this.far.position.set((cx - W / 2) * 0.72 + ((wind * 0.25) % 4000), (cy - H / 2) * 0.55);
    // depth 1 (farthest): the horizon range barely moves · depth 3: cloud streaks between far and near
    this.horizon.position.set((cx - W / 2) * 0.9 + ((wind * 0.05) % 3000), (cy - H / 2) * 0.8);
    this.mid.position.set((cx - W / 2) * 0.45 - ((wind * 0.6) % 3600), (cy - H / 2) * 0.35);
    this.near.position.set(-(cx - W / 2) * 0.3 - ((wind * 1.6) % 5320), -(cy - H / 2) * 0.15);
    // the foreground cloud bank exists only in the sky chase (never half-transparent over the set)
    const ni = k.num('islandsNear', 0) > 0.5;
    this.near.visible = k.num('near', 0) > 0.5 || ni;
    this.nearIslands.visible = ni;
    for (const c of this.nearClouds) c.visible = k.num('near', 0) > 0.5;

    this.farIslands.alpha = k.num('islands', 1);
    this.drawFloor(k, m, wind);
    this.drawSea(k, m);
    this.drawFalls(k, m);
    this.drawBeams(k, m);
  }

  /**
   * The accents (snare / güira / tambora) are the galleon's cannons: a flash + a puff at the next cannon on each strong
   * one while the party is armed; every other accent kicks up a splash beside us. Strong melody attacks sparkle on the
   * disco ball and the lanterns. Pure function of m (seekable), one Graphics.
   */
  private drawOnsetFx(k: Kit, m: number, lit: number) {
    const g = this.onsetFx;
    g.clear();
    if (k.fullFrame) return;
    const armed = this.swingAt.length > 0 && m >= this.swingAt[0].m && Math.abs(this.B.rotation) < 0.6;
    const acc = k.onsetList('snare');
    const x = k.last('snare', m);
    if (x) {
      for (let i = x.i; i >= 0 && i > x.i - 6; i--) {
        const o = acc[i];
        const age = m - o.t;
        if (age > 0.4) break;
        if (o.strength < 0.3) continue;
        if (armed && i % 2 === 0) {
          const [mx, my] = this.world('B', ...this.B.muzzle(i % 3));
          const s1 = Math.max(0, 1 - age / 0.12);
          if (s1 > 0) g.poly(starPts(mx - 20, my, 50 * s1 + 10, 14, 6, i)).fill(k.pal.ink).poly(starPts(mx - 20, my, 40 * s1 + 8, 11, 6, i)).fill(0xffe14a);
          const r = 16 + 40 * Math.min(1, age / 0.3);
          g.circle(mx - 40 - age * 120, my - age * 60, r + 4).fill({ color: k.pal.ink, alpha: 1 - age / 0.4 });
          g.circle(mx - 40 - age * 120, my - age * 60, r).fill({ color: 0xf2ece4, alpha: 1 - age / 0.4 });
        } else if (k.num('shipA.y', 0) > -40) {
          const p = this.shipPos('A');
          const sx = p.x + 340 + (i % 4) * 70;
          const h = 80 * Math.sin(Math.min(1, age / 0.3) * Math.PI) * o.strength;
          g.roundRect(sx - 9, WATER - h, 18, h + 6, 9).fill(0xffffff).stroke({ width: 3, color: k.pal.ink });
          g.ellipse(sx, WATER + 4, 40 * (0.6 + age), 8).stroke({ width: 3, color: 0xffffff, alpha: 1 - age / 0.4 });
        }
      }
    }
    const mel = k.last('melody', m, 0.35);
    if (mel && m - mel.o.t < 0.25 && lit >= 7) {
      const s1 = 1 - (m - mel.o.t) / 0.25;
      const [dx, dy] = this.world('B', 23, -640);
      g.poly(starPts(dx + ((mel.i * 37) % 60) - 30, dy - 10 + ((mel.i * 53) % 40) - 20, 26 * s1, 5, 4, mel.i)).fill(0xffffff);
      const [lx, ly] = this.world('B', mel.i % 2 ? -150 : 110, mel.i % 2 ? -330 : -420);
      g.circle(lx, ly, 30 * s1 + 10).fill({ color: 0xffd36b, alpha: 0.35 * s1 });
    }
  }

  /** wind scroll = ∫ wind dm (incremental; restarts on a seek back) */
  private windAt(k: Kit, m: number) {
    if (m < this.windAcc.m - 0.001) this.windAcc = { m: 0, x: 0 };
    const step = 1 / 30;
    let t = this.windAcc.m;
    let x = this.windAcc.x;
    const save = k.m;
    while (t + step <= m) {
      k.m = t;
      x += k.num('wind', 0) * step;
      t += step;
    }
    k.m = save;
    this.windAcc = { m: t, x };
    return x;
  }

  late(k: Kit, m: number) {
    const st = Math.floor(m * 12) / 12;
    // the beat: a bob for everyone (on twos), stronger on kicks
    const beatPh = this.phase(this.beats, st);
    const kickE = k.env('kick', m, 0.1) * (k.reduceMotion ? 0.4 : 1);
    const pump = Math.max(kickE, k.env('snare', m, 0.08, 0.3) * 0.6);
    const bob = Math.max(0, 1 - beatPh / 0.18);
    const bn = k.last('bass', m, 0.12);
    const bassE = k.env('bass', m, 0.45, 0.12) * (k.reduceMotion ? 0.4 : 1);
    const sway = bn ? bassE * (0.012 + 0.02 * Math.max(0, Math.min(1, (48 - (bn.o.midi ?? 44)) / 16))) * (bn.i % 2 ? 1 : -1) : 0;
    // ---- ships
    for (const s of ['A', 'B'] as const) {
      const c = s === 'A' ? this.A : this.B;
      const p = this.shipPos(s);
      let dx = 0;
      let dy = 0;
      let rot = k.num(`ship${s}.rot`, 0);
      let sx = 1;
      let sy = 1;
      const airborne = k.num(`ship${s}.y`, 0) < -60;
      // rocking: a slow roll (sea) / drift (air) + the music: the hull dips and squashes on EVERY kick, and sways with
      // each bass note (the pitch sets how far: low notes lean further)
      dy += airborne ? Math.sin(st * 2.2 + (s === 'A' ? 0 : 1.3)) * 10 - bob * 4 : Math.sin(st * 1.6 + (s === 'A' ? 0 : 2)) * 5;
      dy += 9 * kickE;
      sy *= 1 - 0.028 * kickE;
      sx *= 1 + 0.02 * kickE;
      rot += airborne ? Math.sin(st * 1.4 + (s === 'A' ? 0.5 : 0)) * 0.02 : Math.sin(st * 1.2 + (s === 'A' ? 1 : 0)) * 0.014;
      rot += sway * (s === 'A' ? 1 : -1);
      for (const j of this.jolts) {
        if (j.ship !== s) continue;
        dx += j.dx;
        dy += j.dy;
        rot += j.rot;
        sx *= j.sx;
        sy *= j.sy;
      }
      c.position.set(p.x + dx, p.y + dy);
      c.rotation = rot;
      c.scale.set(sx, sy);
    }
    // ---- before the party: the whole set is a night silhouette; only the lit party pieces carry color
    const dark = Math.max(0, 1 - k.num('party', 0));
    const night = lerpColor(0xffffff, 0x2a2440, dark * 0.85);
    const nightA = lerpColor(0xffffff, 0x2a2440, dark * 0.6);
    for (const o of [this.B.hull, this.B.rig, this.B.deck, ...this.B.cannons]) o.tint = night;
    (this.B as unknown as { woofersTint: (c: number) => void }).woofersTint?.(night);
    for (const o of [this.A.hull, this.A.deck, this.A.kitG, ...this.A.cannons]) o.tint = nightA;
    // ---- party lights (from the score) + the woofers
    // the outro switches the party off one piece at a time ('lightsOff' 0..9)
    const lit = Math.max(0, this.litCount(m) - Math.round(k.num('lightsOff', 0)));
    this.B.setLit(lit, m, this.lightTimes);
    this.B.pump(lit >= 4 ? pump : pump * 0.3, m);
    this.drawOnsetFx(k, m, lit);
    // cannons: stowed pointing UP (confetti cannons), swing down to aim at us
    this.B.cannons.forEach((c, i) => {
      const sw = this.swingAt.find((x) => x.i === i);
      const x = sw ? Math.max(0, Math.min(1, (m - sw.m) / 0.22)) : 0;
      const stepX = Math.floor(x * 4) / 4; // on twos-ish: a heavy clunk
      c.rotation = Math.PI / 2 + (-0.12 - Math.PI / 2) * ease('outBack', stepX);
      c.position.set(-205 + i * 160, -108);
    });
    this.A.cannons.forEach((c, i) => {
      c.rotation = -0.1;
      c.position.set(40 + i * 150, -106);
    });
    this.A.setKit(k.num('kit', 0), m);
    const sst = Math.floor(m * 12);
    if (sst !== this.scarStep) {
      this.scarStep = sst;
      this.A.damage.clear();
      this.B.damage.clear();
      for (const sc of this.scars) if (sc.m <= m) drawScar(sc.ship === 'A' ? this.A.damage : this.B.damage, sc.x, sc.y, sc.r, sc.seed, m - sc.m);
    }
    // ---- actors
    this.poseActors(k, m, bob, pump);
    // ---- anchors (screen) for prompts / screen-space verbs
    const sc = (wx: number, wy: number) => k.cam.toScreen(wx, wy);
    const [chx, chy] = this.head('canelo');
    this.anchors.set('canelo', sc(chx, chy - 150));
    const [bhx, bhy] = this.head('cascada');
    this.anchors.set('cascada', sc(bhx, bhy - 150));
    for (let i = 0; i < 3; i++) {
      const [x, y] = this.hullSpot(i);
      this.anchors.set(`hull${i}`, sc(x, y));
      // where a barrage prompt sits: below-right of the landing spot, never over Canelo's face
      const [hx, hy] = sc(x, y);
      this.anchors.set(`bat${i}`, [hx + 60 + i * 150, hy + 250 - i * 30]);
    }
    const pa = this.shipPos('A');
    const pb = this.shipPos('B');
    this.anchors.set('shipA', sc(pa.x, pa.y - 250));
    this.anchors.set('shipB', sc(pb.x, pb.y - 250));
    this.anchors.set('cloud', sc(this.cloudPos()[0], this.cloudPos()[1] - 40));
  }

  cloudPos(): [number, number] {
    return this.world('B', -40, -250);
  }

  private poseActors(k: Kit, m: number, bob: number, pump: number) {
    const dance = this.litCount(m) >= 9;
    for (const who of Object.keys(this.actors) as Who[]) {
      const a = this.actors[who];
      if (!a || who === 'fly') continue;
      const home = (a as Actor & { home?: [number, number] }).home ?? [0, 0];
      const req = this.poses.get(who);
      let x = home[0];
      let y = home[1];
      let rot = 0;
      let sx = 1;
      let sy = 1;
      let alpha = 1;
      const ghost = who === 'luzterna';
      if (ghost) {
        y += Math.sin(m * 2.4) * 14;
        alpha = 0.92;
      } else if (who === 'globito') y += Math.sin(m * 3) * 10 - pump * 8;
      else {
        // party bob: crew dance once the party is on, Canelo just taps his foot
        const amp = who === 'canelo' ? 0.5 : dance ? 1.6 : 0.7;
        y -= bob * 7 * amp;
        sy = 1 - bob * 0.035 * amp;
        sx = 1 + bob * 0.025 * amp;
        if (dance && who !== 'canelo') rot = (Math.floor(m / k.beat) % 2 ? 1 : -1) * 0.05;
      }
      if (req) {
        const P = POSES[req.name]?.(req.lt, k) ?? {};
        x += P.dx ?? 0;
        y += P.dy ?? 0;
        rot += P.rot ?? 0;
        sx *= P.sx ?? 1;
        sy *= P.sy ?? 1;
        if (P.hide) alpha = 0;
        if (a.puppet) {
          a.puppet.lean = P.lean ?? 0;
          a.puppet.crouch = P.crouch ?? 0;
          if (P.look !== undefined) a.puppet.look = P.look;
        }
      } else if (a.puppet) {
        a.puppet.lean = 0;
        a.puppet.crouch = 0;
      }
      a.pose(m, x, y, { rot, sx, sy, alpha, step: k.beatStep(m) });
    }
    // the flying Canelo (leap / fight / finale): absolute world pose
    const fly = this.actors.fly!;
    const fr = this.poses.get('fly');
    fly.visible = !!fr;
    if (fr) {
      const P = POSES[fr.name]?.(fr.lt, k) ?? {};
      fly.pose(m, fr.x ?? 0, fr.y ?? 0, { rot: (fr.rot ?? 0) + (P.rot ?? 0), sx: (fr.s ?? 1) * (P.sx ?? 1), sy: (fr.s ?? 1) * (P.sy ?? 1), alpha: P.hide ? 0 : 1, step: k.beatStep(m) });
      if (this.actors.canelo) this.actors.canelo.visible = false;
    } else if (this.actors.canelo) this.actors.canelo.visible = true;
  }

  /** lights on at m: one per lightUp cue, all nine after a fiesta (a late fiesta flickers first) */
  litCount(m: number) {
    let n = 0;
    for (const t of this.lightTimes) if (t <= m) n++;
    for (const f of this.fiestaAt) {
      if (m < f.m) continue;
      if (f.late && m - f.m < 0.3) return Math.floor((m - f.m) * 40) % 2 ? 9 : Math.min(n, 3);
      return 9;
    }
    return Math.min(9, n);
  }
  /** seconds since the last time in `arr` at or before m */
  private age(arr: number[], m: number) {
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid] <= m) lo = mid + 1;
      else hi = mid;
    }
    return lo ? m - arr[lo - 1] : 99;
  }
  private phase(arr: number[], m: number) {
    return this.age(arr, m);
  }

  anchor(name: string): [number, number] | null {
    return this.anchors.get(name) ?? null;
  }

  // ---------------------------------------------------------------- drawing
  private drawSky(k: Kit, m: number) {
    const v = k.view;
    const pal = k.pal;
    const key = `${pal.sky.join(',')}|${pal.accent}`;
    const st = Math.floor(m * 12);
    if (key !== this.palKey) {
      this.palKey = key;
      const g = this.sky;
      g.clear();
      bands(g, v.x - 10, v.y - 10, v.w + 20, v.h + 20, pal.sky, [1.2, 1, 1, 0.9, 0.8]);
      this.redrawClouds(k);
      this.drawDepth(k);
      this.farIslands.tint = lerpColor(pal.shadow, pal.base, 0.35);
    }
    // stars: only under a dark sky
    const skyL = lum(pal.sky[0]);
    this.stars.alpha = Math.max(0, Math.min(1, (0.22 - skyL) / 0.12));
    if (this.stars.alpha > 0 && this.stars.children.length === 0 && (this.stars as Graphics & { drawn?: boolean }).drawn !== true) {
      const R = rng(9);
      for (let i = 0; i < 140; i++) this.stars.poly(starPts(v.x + R() * v.w, v.y + R() * v.h * 0.7, 2 + R() * 4, 0.6, 4, 0)).fill(0xffffff);
      (this.stars as Graphics & { drawn?: boolean }).drawn = true;
    }
    // the sun / moon: a disc of hard rings, rising / setting with 'sun.y'
    if (st !== this.lastSkyStep) {
      this.lastSkyStep = st;
      const s = this.sun;
      s.clear();
      const sy = v.y + v.h * k.num('sun.y', 0.62) - (k.cam.y - H / 2) * 0.08;
      const sx = W * 0.62 - (k.cam.x - W / 2) * 0.05;
      const r = 210;
      s.circle(sx, sy, r * 1.35).fill({ color: pal.light, alpha: 0.12 });
      s.circle(sx, sy, r * 1.15).fill({ color: pal.accent2, alpha: 0.22 });
      s.circle(sx, sy, r).fill(lerpColor(pal.light, pal.accent, 0.25));
      for (let i = 1; i <= 4; i++) s.rect(sx - r, sy + r * (0.15 + i * 0.17), r * 2, r * 0.05 * i).fill(pal.sky[3]);
      // light shards (drop / finale): geometric slivers of color drifting on twos
      const sh = this.shardsG;
      sh.clear();
      const amt = k.num('shards', 0);
      if (amt > 0.01) {
        const R = rng(1234);
        for (let i = 0; i < 26; i++) {
          const x = v.x + ((R() * v.w + st * (6 + R() * 18)) % v.w);
          const y = v.y + R() * v.h;
          const L = 60 + R() * 220;
          const a = -0.9 + R() * 0.3;
          const c = [pal.accent, pal.accent2, pal.light, pal.base][i % 4];
          sh.poly([x, y, x + Math.cos(a) * L, y + Math.sin(a) * L, x + Math.cos(a + 0.18) * L * 0.6, y + Math.sin(a + 0.18) * L * 0.6]).fill({ color: c, alpha: 0.35 * amt });
        }
      }
    }
  }
  /** a deck of big cel clouds along the bottom of the frame (sky scenes): two rows, the front one faster */
  private drawFloor(k: Kit, m: number, wind: number) {
    const g = this.floorG;
    const v = k.num('floor', 0);
    g.clear();
    if (v < 0.01) return;
    const st = Math.floor(m * 12) / 12;
    const pal = k.pal;
    const vw = k.view;
    const base = vw.y + vw.h + (1 - v) * 400 - (k.cam.y - 60) * 0.12;
    const rows: [number, number, number, number, number][] = [
      // [y offset, puff radius, spacing, speed, shade]
      [-250, 120, 190, 0.35, 0.45],
      [-120, 150, 230, 0.7, 0.15],
    ];
    rows.forEach(([dy, r, sp, speed, sh], ri) => {
      const off = ((wind + st * 40) * speed) % sp;
      const fill = lerpColor(pal.light, pal.sky[2], sh);
      const shade = lerpColor(fill, pal.shadow, 0.35);
      const y0 = base + dy;
      g.rect(vw.x - 20, y0, vw.w + 40, vw.y + vw.h - y0 + 20).fill(fill);
      for (let x = vw.x - sp - off; x < vw.x + vw.w + sp; x += sp) {
        const j = Math.sin((x + ri * 77) * 0.013) * 0.25 + 1;
        g.circle(x, y0, r * j + 6).fill(pal.ink);
      }
      g.rect(vw.x - 20, y0, vw.w + 40, vw.y + vw.h - y0 + 20).fill(fill);
      for (let x = vw.x - sp - off; x < vw.x + vw.w + sp; x += sp) {
        const j = Math.sin((x + ri * 77) * 0.013) * 0.25 + 1;
        g.circle(x, y0, r * j).fill(fill);
        g.ellipse(x - r * 0.25, y0 - r * 0.45 * j, r * 0.35, r * 0.14).fill({ color: 0xffffff, alpha: 0.6 });
      }
      g.rect(vw.x - 20, y0 + r * 0.55, vw.w + 40, 26).fill(shade);
    });
  }

  private drawNearIslands() {
    // two big upside-down islands in their own colors (rock, moss, hanging trees, the waterfall that climbs), ink lines
    const g = this.nearIslands;
    g.clear();
    const R = rng(91);
    for (let i = 0; i < 3; i++) {
      const x = 200 + i * 1800 + R() * 300;
      const y = WATER - 1500 - R() * 300;
      const w = 460 + R() * 160;
      const h = 330 + R() * 120;
      const rock = [x - w / 2, y, x - w * 0.4, y - h * 0.35, x - w * 0.18, y - h * 0.72, x, y - h, x + w * 0.2, y - h * 0.62, x + w * 0.42, y - h * 0.3, x + w / 2, y];
      g.poly(rock.map((v, j) => (j % 2 ? v + 9 : v + (v < x ? -9 : 9)))).fill(INK);
      g.poly(rock).fill(0x8a7a9e);
      g.poly([x, y - h, x + w * 0.2, y - h * 0.62, x + w * 0.42, y - h * 0.3, x + w / 2, y, x + w * 0.08, y]).fill(0x6a5c80);
      for (let j = 1; j < 4; j++) g.moveTo(x - w * (0.5 - j * 0.1), y - h * j * 0.22).lineTo(x + w * (0.5 - j * 0.11), y - h * j * 0.2).stroke({ width: 4, color: INK, alpha: 0.5 });
      // the grass lip and trees hanging DOWN
      g.roundRect(x - w / 2 - 12, y - 8, w + 24, 38, 18).fill(INK).roundRect(x - w / 2 - 5, y - 3, w + 10, 28, 13).fill(0x5fbf6a);
      for (let j = 0; j < 4; j++) {
        const tx = x - w * 0.36 + j * w * 0.24;
        const tl = 40 + R() * 60;
        g.rect(tx - 6, y + 22, 12, tl).fill(INK).rect(tx - 3, y + 22, 6, tl).fill(0x7a4a2a);
        g.circle(tx, y + 34 + tl, 46).fill(INK).circle(tx, y + 34 + tl, 39).fill(0x4fa85e).circle(tx - 12, y + 26 + tl, 16).fill(0x8ee05a);
      }
      // its waterfall climbing from the tip into the sky
      g.rect(x - 26, y - h - 900, 52, 900).fill(INK).rect(x - 20, y - h - 900, 40, 900).fill(0x9fe6ff);
      g.rect(x - 6, y - h - 900, 10, 900).fill(0xffffff);
      for (let j = 0; j < 6; j++) g.circle(x + (j % 2 ? 22 : -22), y - h - 6, 18 + (j % 3) * 4).fill(0xffffff);
    }
  }

  /** the two extra parallax depths, in the live palette */
  private drawDepth(k: Kit) {
    const pal = k.pal;
    const h = this.horizon;
    h.clear();
    const R = rng(21);
    // a range of far upside-down islands + sea stacks sitting on the horizon, two tones
    const far = lerpColor(pal.sky[3], pal.shadow, 0.35);
    const farD = lerpColor(far, pal.ink, 0.25);
    for (let i = 0; i < 18; i++) {
      const x = -3000 + i * 520 + R() * 200;
      const w = 160 + R() * 260;
      const hh = 40 + R() * 120;
      h.poly([x - w / 2, WATER + 2, x - w * 0.2, WATER - hh, x + w * 0.1, WATER - hh * 0.7, x + w / 2, WATER + 2]).fill(far);
      h.poly([x + w * 0.1, WATER - hh * 0.7, x + w / 2, WATER + 2, x, WATER + 2]).fill(farD);
    }
    const st = this.streaks;
    st.clear();
    const R2 = rng(33);
    const c = lerpColor(pal.light, pal.sky[1], 0.55);
    const cs = lerpColor(c, pal.shadow, 0.3);
    for (let i = 0; i < 14; i++) {
      const x = -3000 + i * 560 + R2() * 300;
      const y = WATER - 380 - R2() * 1300;
      const w = 360 + R2() * 520;
      const t = 16 + R2() * 18;
      st.roundRect(x, y, w, t, t / 2).fill(c);
      st.roundRect(x + w * 0.15, y + t * 0.55, w * 0.7, t * 0.45, t / 4).fill(cs);
      st.roundRect(x + w * 0.4, y - t * 0.9, w * 0.35, t * 0.8, t / 2).fill(c);
    }
  }

  private redrawClouds(k: Kit) {
    const pal = k.pal;
    this.farClouds.forEach((g, i) => {
      g.clear();
      cloud(g, 380 + (i % 3) * 120, 150 + (i % 2) * 40, lerpColor(pal.light, pal.sky[2], 0.45), lerpColor(pal.sky[2], pal.shadow, 0.3), lerpColor(pal.ink, pal.shadow, 0.3), i * 31 + 5, 5);
      g.alpha = 0.92;
    });
    this.nearClouds.forEach((g, i) => {
      g.clear();
      cloud(g, 620 + (i % 2) * 240, 230, lerpColor(pal.light, 0xffffff, 0.3), lerpColor(pal.light, pal.shadow, 0.45), pal.ink, i * 17 + 3, 7);
    });
  }
  private drawFarIslands() {
    // the Islas Invertidas: islands hanging UPSIDE DOWN in the sky — grass and trees hang from their underside, the rock
    // points up, and a waterfall climbs from the tip (drawn white + light grey = 2 tones; tinted by the palette)
    const g = this.farIslands;
    g.clear();
    const R = rng(77);
    for (let i = 0; i < 6; i++) {
      const x = -1400 + i * 900 + R() * 300;
      const y = WATER - 520 - R() * 520;
      const w = 240 + R() * 240;
      const h = 150 + R() * 150;
      // the rock: layered, narrowing upward, a little lopsided
      const tipX = x + (R() - 0.5) * w * 0.3;
      const rock = [x - w / 2, y, x - w * 0.42, y - h * 0.3, x - w * 0.26, y - h * 0.55, tipX - 14, y - h, tipX + 14, y - h, x + w * 0.24, y - h * 0.6, x + w * 0.4, y - h * 0.28, x + w / 2, y];
      g.poly(rock).fill(0xffffff);
      g.poly([tipX - 14, y - h, tipX + 14, y - h, x + w * 0.24, y - h * 0.6, x + w * 0.4, y - h * 0.28, x + w / 2, y, x + w * 0.1, y]).fill(0xd4d4d4);
      for (let j = 1; j <= 3; j++) g.moveTo(x - w * (0.5 - j * 0.09), y - h * j * 0.22).lineTo(x + w * (0.5 - j * 0.1), y - h * j * 0.2).stroke({ width: 3, color: 0xbdbdbd });
      // the grass lip and the trees hanging below it
      g.roundRect(x - w / 2 - 6, y - 4, w + 12, 20, 10).fill(0xe6e6e6);
      for (let j = 0; j < 4; j++) {
        const tx = x - w * 0.35 + j * w * 0.23 + (R() - 0.5) * 20;
        const tl = 30 + R() * 40;
        g.rect(tx - 3, y + 14, 6, tl).fill(0xcfcfcf);
        g.circle(tx, y + 14 + tl + 16, 22 + R() * 10).fill(0xf2f2f2);
        g.circle(tx + 14, y + 14 + tl + 6, 15).fill(0xdedede);
      }
      // the waterfall that falls UP from the tip
      g.rect(tipX - 9, y - h - 300, 18, 300).fill({ color: 0xffffff, alpha: 0.7 });
      g.rect(tipX - 3, y - h - 300, 5, 300).fill({ color: 0xffffff, alpha: 0.95 });
    }
  }
  private drawSea(k: Kit, m: number) {
    const g = this.seaG;
    const pal = k.pal;
    const st = Math.floor(m * 12);
    const key = `${pal.sea.join(',')}`;
    if ((g as Graphics & { key?: string }).key !== key) {
      (g as Graphics & { key?: string }).key = key;
      g.clear();
      bands(g, -6000, WATER, 14000, 3200, pal.sea, [0.12, 0.25, 3]);
    }
    const f = this.foam;
    if ((f as Graphics & { st?: number }).st === st) return;
    (f as Graphics & { st?: number }).st = st;
    f.clear();
    // rows of cel wave crests (bigger and slower toward the viewer), on twos
    const rows: [number, number, number, number][] = [
      [WATER + 4, 120, 14, 7],
      [WATER + 60, 190, 22, 5],
      [WATER + 150, 280, 32, 3.5],
      [WATER + 290, 400, 46, 2.4],
    ];
    const swell = 1 + 0.8 * k.env('bass', m, 0.45, 0.12);
    rows.forEach(([y, w, hgt0, sp], r) => {
      const hgt = hgt0 * swell;
      const off = (st * sp) % w;
      const crest = lerpColor(pal.light, pal.sea[Math.min(2, r)], 0.2 + r * 0.12);
      for (let x = -3200 - off - (r % 2) * w * 0.5; x < 6200; x += w) {
        // a curling crest: ink under-stroke, a light lip, a small white curl
        g2(f, x, y, w, hgt, crest, pal.ink);
      }
    });
    // party reflections: vertical light streaks under the galleon when it's lit
    const lit = this.litCount(m);
    if (lit >= 2 && k.num('shipB.y', 0) > -40) {
      const bx = B_X + k.num('shipB.x', 0);
      const cols = [pal.accent, pal.accent2, 0xffe14a];
      for (let i = 0; i < Math.min(9, lit); i++) {
        const x = bx - 260 + i * 62;
        for (let j = 0; j < 5; j++) f.rect(x + ((j * 13 + st * 3) % 18) - 9, WATER + 20 + j * 34, 26 - j * 4, 10).fill({ color: cols[i % 3], alpha: 0.5 - j * 0.08 });
      }
    }
  }
  private drawFalls(k: Kit, m: number) {
    const g = this.fallsG;
    g.clear();
    const v = k.num('falls', 0);
    const b = this.shipPos('B');
    if (v < 0.01 || Math.abs(this.B.rotation) > 0.6) return;
    const pal = k.pal;
    const st = Math.floor(m * 12);
    const top = b.y - 20;
    const base = WATER + 6;
    const h = (base - top) * v;
    if (h <= 6) return;
    const y0 = base - h;
    // ONE curtain of water rising from the sea to the hull: flared at the sea, wavy edges (on twos), cel bands
    const water = lerpColor(0x7fe3ff, pal.accent2, 0.25);
    const deep = lerpColor(water, pal.shadow, 0.35);
    const edge = (side: -1 | 1, inset: number) => {
      const pts: number[] = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        const y = base - h * t;
        const w = 300 - 120 * t + Math.sin(t * 9 + st * 0.9 * side) * 14 - inset;
        pts.push(b.x - 20 + side * w, y);
      }
      return pts;
    };
    const L = edge(-1, 0);
    const R = edge(1, 0);
    const poly = [...L, ...revPairs(R)];
    g.poly(poly.map((x, i) => (i % 2 ? x : x + (x < b.x ? -7 : 7)))).fill(pal.ink);
    g.poly(poly).fill(water);
    // a darker core band + rising white streaks (they climb: the cascade falls UP)
    const L2 = edge(-1, 120);
    const R2 = edge(1, 120);
    g.poly([...L2, ...revPairs(R2)]).fill(deep);
    const R0 = rng(st % 3);
    for (let i = 0; i < 9; i++) {
      const x = b.x - 20 + (i - 4) * 52 + (R0() - 0.5) * 10;
      const y = base - ((st * 30 + i * 47) % Math.max(60, h));
      g.roundRect(x - 5, y - 70, 10, 70, 5).fill({ color: 0xffffff, alpha: 0.85 });
    }
    // foam where it leaves the sea, and spray at the hull
    for (let i = -5; i <= 5; i++) g.circle(b.x - 20 + i * 58, base + Math.sin(i * 2 + st) * 4, 30 + ((i + st) % 3) * 6).fill(0xffffff);
    for (let i = -4; i <= 4; i++) g.circle(b.x - 20 + i * 44, y0 + 8, 18 + ((i + st) % 2) * 6).fill({ color: 0xffffff, alpha: 0.9 });
  }
  private drawBeams(k: Kit, m: number) {
    const g = this.beamsG;
    g.clear();
    const v = k.num('beams', 0);
    if (v < 0.01) return;
    const pal = k.pal;
    const st = Math.floor(m * 12) / 12;
    const [bx, by] = this.world('B', 160, -210);
    const cols = [pal.accent, pal.accent2, 0xffe14a, pal.light];
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + Math.sin(st * 1.7 + i * 1.6) * 0.75;
      const L = 1700;
      const w = 0.07;
      g.poly([bx, by, bx + Math.cos(a - w) * L, by + Math.sin(a - w) * L, bx + Math.cos(a + w) * L, by + Math.sin(a + w) * L]).fill({ color: cols[i], alpha: 0.16 * v });
    }
  }

  destroy() {
    this.poses.clear();
    // the layers own every display object (the runner destroys them); actors' puppets go with them
  }
}

/** reverse a flat [x, y, x, y…] list by points */
function revPairs(a: number[]) {
  const out: number[] = [];
  for (let i = a.length - 2; i >= 0; i -= 2) out.push(a[i], a[i + 1]);
  return out;
}

function g2(f: Graphics, x: number, y: number, w: number, h: number, crest: number, ink: number) {
  f.moveTo(x, y).quadraticCurveTo(x + w * 0.3, y - h, x + w * 0.55, y - h * 0.4).quadraticCurveTo(x + w * 0.45, y + h * 0.15, x + w * 0.62, y + h * 0.1).lineTo(x + w, y).stroke({ width: Math.max(3, h * 0.28), color: ink, alpha: 0.55 });
  f.moveTo(x, y).quadraticCurveTo(x + w * 0.3, y - h, x + w * 0.55, y - h * 0.4).stroke({ width: Math.max(2, h * 0.18), color: crest });
  f.circle(x + w * 0.52, y - h * 0.45, Math.max(2, h * 0.16)).fill(0xffffff);
}

function lum(c: number) {
  return (0.299 * ((c >> 16) & 255) + 0.587 * ((c >> 8) & 255) + 0.114 * (c & 255)) / 255;
}

// ------------------------------------------------------------------ poses (procedural, stepped by the actor)
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
export const POSES: Record<string, (lt: number, k: Kit) => PoseOut> = {
  brace: () => ({ crouch: 0.85, sx: 1.06, sy: 0.92, lean: 0.25 }),
  point: (lt) => ({ lean: -0.7, rot: -0.06, dx: -10 * Math.min(1, lt * 8) }),
  swing: (lt) => {
    // anticipation → lunge (stretched) → recover
    if (lt < 0.05) return { crouch: 0.7, sx: 1.08, sy: 0.9, dx: -12 };
    if (lt < 0.2) return { sx: 1.22, sy: 0.84, dx: 46, rot: 0.2, lean: 0.9 };
    const r = Math.min(1, (lt - 0.2) / 0.3);
    return { sx: 1.22 - 0.22 * r, sy: 0.84 + 0.16 * r, dx: 46 * (1 - r), rot: 0.2 * (1 - r), lean: 0.9 * (1 - r) };
  },
  parry: (lt) => (lt < 0.15 ? { sx: 1.1, sy: 0.92, rot: -0.15, lean: -0.4, dx: 18 } : {}),
  dizzy: (lt) => ({ rot: Math.sin(lt * 18) * 0.16 * Math.max(0, 1 - lt / 1.2), dy: 6, crouch: 0.3 }),
  cool: (lt) => ({ lean: -0.35, rot: -0.05, sy: 1 + 0.04 * Math.min(1, lt * 10), dy: -4 }),
  trip: (lt) => (lt < 0.4 ? { rot: -0.45 * Math.sin(Math.min(1, lt / 0.4) * Math.PI), dy: 10, crouch: 0.6 } : {}),
  facepalm: () => ({ crouch: 0.4, lean: 0.3, rot: 0.06 }),
  taunt: (lt) => ({ lean: -0.4, rot: 0.08 + Math.sin(lt * 14) * 0.04, dy: -Math.abs(Math.sin(lt * 7)) * 18 }),
  dance: (lt, k) => ({ rot: Math.sin((lt / k.beat) * Math.PI) * 0.12, dy: -Math.abs(Math.sin((lt / k.beat) * Math.PI)) * 22, sx: 1.03 }),
  recover: (lt) => (lt < 0.8 ? { rot: Math.sin(lt * 22) * 0.18, crouch: 0.4 } : { rot: Math.sin(lt * 30) * 0.06 * Math.max(0, 1.4 - lt) }),
  hero: () => ({ sx: 1.12, sy: 1.12, lean: -0.2, dy: -10 }),
  rock: (lt) => ({ rot: Math.sin(lt * 16) * 0.22 * Math.max(0, 1 - lt / 0.8), dy: -Math.abs(Math.sin(lt * 10)) * 30 * Math.max(0, 1 - lt / 0.6) }),
  hidden: () => ({ hide: true }),
  fly: () => ({}),
  land: (lt) => (lt < 0.12 ? { sx: 1.25, sy: 0.75 } : {}),
  splat: () => ({ rot: -1.35, dy: 40, sx: 1.1, sy: 0.85 }),
};

export default function createStage(k: Kit): LikyStage {
  return new LikyStage(k);
}
void Sprite;
