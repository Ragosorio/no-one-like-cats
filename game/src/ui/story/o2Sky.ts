/**
 * Parte II · Oleada 2 «El Cielo Despierta» — WHAT THE STORY LEAVES IN YOUR SKY (docs/part-ii/22 «Pasada de cine»).
 * «Si la historia lo dice, pasa en el mundo»: everything here is DERIVED from mission progress (pure: `o2SkyFor`),
 * so a reload, a trip to the CARTA or the Parte II narrative reset draw the same sky. Part I never mounts it.
 *
 *   trombas   H42 active: three waterspouts stand up out of the Primer Mar and climb into the clouds (gulls ride them)
 *   elevator  H42 done: one waterspout stays far out — the way up
 *   islas     H42 done: islands hang upside down high over the archipelago, their waterfalls falling UP
 *   cascada   H44 active: a ship moored upside down under one of them
 *   corona    H45 on: Corona Celeste, a white symmetric city on a cloud bank, up there for good
 *   tilt      H49 active: the city leans toward its biggest oven; crumbs roll, the oven breathes steam
 *   embajada  H46 active: the embassy — a white tower with one door — floats by the city
 *   galeon    H47 active: a white galleon with a whale figurehead waits among the hanging islands
 *   leviatan  (scenes only) the Leviathan drawn in chalk across the sky, obedient
 *   signal    H48 active: your faro's lantern blinks a signal straight up (three short, one long);
 *             H48 done: a steady thread of light (she left it on)
 *   balloon   your ship has the Kit de Vuelo (or H43 is done): a striped balloon and two propellers on your boat
 *
 * Layers (nothing in IslandScene is edited: the prop finds its layers by label, like ui/story/o4Pagina.ts):
 *   skyWorld (world space, between the dimension skies and the islands, graded by the night) · an own ungraded light
 *   layer right above the graded world (the signal) · the boat itself (the balloon is its child; the hop is the boat's
 *   pivot).
 * At rest the sky things are SKY: behind the islands and lifted clear of the archipelago's top edge (ui/story/skyLine.ts),
 * so on a big archipelago they never cover the far islands. While a CINE scene drives any of them 0..1 (`drive`) they
 * come FORWARD (over the archipelago, at the places the scenes frame) and go back with `release()` (PULIDO 2026-10-10).
 * Pure Pixi drawing: no textures, nothing to load. app/oleada2Flow.ts keeps it in step twice a second.
 */
import { Container, Graphics, Text, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { IslandCat, preloadCats } from '../../art/catArt';
import { onomatopoeia } from '../../fx/juice';
import { C, F } from '../theme';
import { txt } from '../widgets';
import { scenes } from '../../core/scenes';
import { settings } from '../../core/settings';
import { G } from '../../state/game';
import { cineStage } from '../../cine/registry';
import type { WorldSave } from '../../state/sys/worldState';
import { SkyLine } from './skyLine';

export const O2_SKY_IDS = ['trombas', 'elevator', 'islas', 'cascada', 'corona', 'tilt', 'embajada', 'embajadaAway', 'galeon', 'leviatan', 'signal', 'balloon', 'hop', 'pebbles'] as const;
export type O2SkyId = (typeof O2_SKY_IDS)[number];
export type O2SkyState = Record<O2SkyId, number>;

/** pure: what the sky shows for this save (`kit` = a ship of yours flies) */
export function o2SkyFor(s: WorldSave | null | undefined, kit = false): O2SkyState {
  const out = Object.fromEntries(O2_SKY_IDS.map((k) => [k, 0])) as O2SkyState;
  if (!s?.missions) return out;
  const active = (id: string) => s.missions.active.includes(id);
  const done = (id: string) => s.missions.done.includes(id);
  const on = (id: string) => active(id) || done(id);
  if (active('H42')) out.trombas = 1;
  if (done('H42')) {
    out.elevator = 1;
    out.islas = 1;
  }
  if (active('H44')) out.cascada = 1;
  if (on('H45')) out.corona = 1;
  if (active('H49')) out.tilt = 1;
  if (active('H46')) out.embajada = 1;
  if (active('H47')) out.galeon = 1;
  if (active('H48')) out.signal = 1;
  else if (done('H48')) out.signal = 0.5;
  if (kit || done('H43')) out.balloon = 1;
  return out;
}
/** does this save draw anything at all? (Part I: never) */
export const o2SkyAny = (st: O2SkyState) => O2_SKY_IDS.some((k) => st[k] > 0);

// ------------------------------------------------------------------ palette (ink on paper, hazy like the far isle)
const INK = 0x2f3352;
const HAZE = 0x6f6c9f;
const LIT = 0xd8dcef;
const WATER = 0xa9d4f5;
const WHITE = 0xf6f5f0;
const CHALK = 0xf2efe6;

type Pt = { x: number; y: number };

function islet(seed: number, w: number): Graphics {
  const g = new Graphics();
  const r = (i: number) => 0.5 + 0.5 * Math.sin(seed * 12.9898 + i * 78.233);
  // the rock's underside, pointing UP (the island hangs upside down)
  const pts: number[] = [-w / 2, 0];
  const n = 7;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const x = -w / 2 + t * w;
    const peak = Math.sin(t * Math.PI);
    pts.push(x + (r(i) - 0.5) * 18, -peak * w * (0.55 + r(i + 9) * 0.25));
  }
  pts.push(w / 2, 0);
  g.poly(pts).fill(HAZE).stroke({ width: 4, color: INK, alpha: 0.9, join: 'round' });
  // strata
  for (let i = 1; i < 4; i++) g.moveTo(-w * 0.38 + i * 9, -i * w * 0.1).lineTo(w * 0.36 - i * 11, -i * w * 0.11).stroke({ width: 2, color: INK, alpha: 0.35 });
  // the grass, on the BOTTOM side, and trees hanging down
  g.rect(-w / 2, 0, w, 12).fill(0x7fb59a).stroke({ width: 3, color: INK, alpha: 0.85 });
  for (let i = 0; i < 5; i++) {
    const x = -w * 0.4 + (i / 4) * w * 0.8 + (r(i + 3) - 0.5) * 12;
    const h = 26 + r(i + 5) * 26;
    g.poly([x - 13, 12, x + 13, 12, x, 12 + h]).fill(0x4f8a76).stroke({ width: 3, color: INK, alpha: 0.85, join: 'round' });
  }
  return g;
}

function upsideDownShip(): Graphics {
  const g = new Graphics();
  // hull UP (it's moored under the island, upside down), mast DOWN
  g.poly([-46, 0, 46, 0, 34, -20, -34, -20]).fill(0x8a6a5a).stroke({ width: 3, color: INK, alpha: 0.8, join: 'round' });
  g.rect(-2, 0, 4, 62).fill(0x5c463c);
  g.poly([2, 8, 34, 14, 2, 50]).fill(LIT).stroke({ width: 2, color: INK, alpha: 0.6, join: 'round' });
  // a tiny captain on the prow, upside down too, pointing «down» (up)
  g.circle(-38, 10, 6).fill(0x5fa8c9).stroke({ width: 2, color: INK });
  g.moveTo(-38, 4).lineTo(-38, -28).stroke({ width: 2, color: INK, alpha: 0.7 });
  return g;
}

function corona(): Container {
  const c = new Container();
  const g = new Graphics();
  // the cloud bank
  for (const [x, y, rx, ry] of [
    [-300, 30, 150, 46],
    [-120, 44, 190, 52],
    [90, 46, 200, 54],
    [290, 30, 150, 44],
    [0, 20, 330, 40],
  ] as [number, number, number, number][])
    g.ellipse(x, y, rx, ry).fill({ color: 0xf1f3f9, alpha: 0.95 });
  // symmetric: towers and domes, mirrored around x = 0 (perfect)
  const wall = 0xfbfaf6;
  const line = { width: 3, color: INK, alpha: 0.85 } as const;
  g.rect(-250, -40, 500, 50).fill(wall).stroke(line);
  for (const s of [-1, 1]) {
    g.rect(s * 190 - 22, -150, 44, 120).fill(wall).stroke(line);
    g.ellipse(s * 190, -150, 28, 26).fill(wall).stroke(line);
    g.rect(s * 110 - 30, -100, 60, 70).fill(wall).stroke(line);
    g.ellipse(s * 110, -100, 36, 30).fill(wall).stroke(line);
    for (let i = 0; i < 3; i++) g.rect(s * 190 - 4, -130 + i * 30, 8, 14).fill({ color: 0xd9a53a, alpha: 0.7 });
  }
  // the great central dome
  g.rect(-60, -120, 120, 90).fill(wall).stroke(line);
  g.ellipse(0, -120, 74, 66).fill(wall).stroke(line);
  g.rect(-3, -214, 6, 30).fill(0xd9a53a);
  g.circle(0, -218, 7).fill(0xe8b84a).stroke({ width: 2, color: INK, alpha: 0.6 });
  c.addChild(g);
  return c;
}

/** the biggest oven of the city (it shows when the city leans: H49) */
function oven(): Graphics {
  const g = new Graphics();
  g.rect(-34, -60, 68, 60).fill(0xf6e6c8).stroke({ width: 2.5, color: INK, alpha: 0.6 });
  g.ellipse(0, -60, 40, 34).fill(0xf6e6c8).stroke({ width: 2.5, color: INK, alpha: 0.6 });
  g.roundRect(-16, -34, 32, 30, 14).fill(0xe08a3a).stroke({ width: 2, color: INK, alpha: 0.7 });
  g.rect(14, -118, 14, 40).fill(0xd8cdb8).stroke({ width: 2, color: INK, alpha: 0.6 });
  return g;
}

function embassy(): Graphics {
  const g = new Graphics();
  g.ellipse(0, 18, 90, 24).fill({ color: 0xf1f3f9, alpha: 0.95 });
  g.rect(-34, -170, 68, 180).fill(WHITE).stroke({ width: 2.5, color: INK, alpha: 0.55 });
  g.poly([-40, -170, 40, -170, 0, -214]).fill(WHITE).stroke({ width: 2.5, color: INK, alpha: 0.55, join: 'round' });
  // one door, no windows
  g.roundRect(-11, -26, 22, 34, 10).fill(0xd9d6cc).stroke({ width: 2, color: INK, alpha: 0.6 });
  return g;
}

function galleon(): Graphics {
  const g = new Graphics();
  const hull = 0xf4f2ec;
  // hull + a whale for a figurehead
  g.poly([-150, 0, 150, 0, 120, 46, -126, 46]).fill(hull).stroke({ width: 3, color: INK, alpha: 0.7, join: 'round' });
  g.ellipse(-176, 6, 40, 20).fill(hull).stroke({ width: 3, color: INK, alpha: 0.7 });
  g.poly([-212, 4, -236, -12, -232, 18]).fill(hull).stroke({ width: 2, color: INK, alpha: 0.7, join: 'round' });
  g.circle(-164, 2, 3).fill(INK);
  for (let i = 0; i < 6; i++) g.circle(-90 + i * 36, 24, 6).fill({ color: INK, alpha: 0.35 });
  // three masts, white sails
  for (const [x, h] of [
    [-70, 150],
    [10, 190],
    [90, 140],
  ] as [number, number][]) {
    g.rect(x - 3, -h, 6, h).fill(0x8a8578);
    g.poly([x + 4, -h + 14, x + 64, -h + 30, x + 60, -24, x + 4, -16]).fill(hull).stroke({ width: 2, color: INK, alpha: 0.55, join: 'round' });
  }
  // the admiral's insignia of Nadie's fleet… painted over in white (a ghost of it shows through)
  const ix = 42;
  const iy = -110;
  g.circle(ix, iy, 22).stroke({ width: 4, color: 0x2a2440, alpha: 0.18 });
  g.poly([ix - 14, iy + 8, ix, iy - 16, ix + 14, iy + 8]).stroke({ width: 4, color: 0x2a2440, alpha: 0.18 });
  g.roundRect(ix - 30, iy - 26, 60, 52, 8).fill({ color: WHITE, alpha: 0.75 });
  return g;
}

/** the Leviathan, a chalk outline (points along its back, head first) */
const LEVIATAN: [number, number][] = [
  [-900, 40], [-860, -20], [-780, -60], [-660, -80], [-520, -70], [-380, -110], [-220, -140], [-60, -130], [100, -100],
  [260, -120], [420, -160], [560, -150], [680, -100], [780, -40], [860, 30], [920, -40], [980, -100], [960, 20], [900, 90],
  [760, 110], [600, 120], [420, 110], [240, 130], [60, 140], [-120, 120], [-300, 130], [-480, 110], [-640, 100], [-780, 90], [-880, 80], [-900, 40],
];

function boatBalloon(): { root: Container; balloon: Graphics; props: Graphics[]; ropes: Graphics } {
  const root = new Container();
  root.label = 'o2Balloon';
  const ropes = new Graphics();
  for (const [x0, x1] of [
    [-30, -18],
    [30, 18],
    [-8, -4],
    [8, 4],
  ])
    ropes.moveTo(x0, -70).lineTo(x1, -26).stroke({ width: 2, color: 0x5c3b26, alpha: 0.85 });
  const balloon = new Graphics();
  // red and cream gores (like the 3D one up in the sky regions)
  balloon.ellipse(0, -112, 54, 46).fill(0xf3e6c8).stroke({ width: 3, color: 0x3a2a24, alpha: 0.9 });
  for (const dx of [-30, 0, 30]) balloon.ellipse(dx, -112, 9, 44).fill(0xc23b44);
  balloon.ellipse(0, -112, 54, 46).stroke({ width: 3, color: 0x3a2a24, alpha: 0.9 });
  balloon.rect(-20, -72, 40, 6).fill(0xd9a53a).stroke({ width: 2, color: 0x3a2a24, alpha: 0.8 });
  const props: Graphics[] = [];
  for (const s of [-1, 1]) {
    const p = new Graphics();
    p.rect(-2, -14, 4, 28).fill(0x5c3b26);
    p.rect(-14, -2, 28, 4).fill(0x5c3b26);
    p.circle(0, 0, 4).fill(0xd9a53a);
    p.position.set(s * 46, -34);
    props.push(p);
  }
  root.addChild(ropes, balloon, ...props);
  return { root, balloon, props, ropes };
}

// ------------------------------------------------------------------ the prop
export class O2Sky {
  private root = new Container();
  private light = new Container();
  private t = 0;
  private dead = false;
  /** what's on screen (eased toward `target`, or set by a scene) */
  readonly cur: O2SkyState;
  private target: O2SkyState;
  private driven = new Map<O2SkyId, number>();
  // parts
  private spouts = new Graphics();
  private islas = new Container();
  private isles: Graphics[] = [];
  private isleY: number[] = [];
  private ups = new Graphics();
  private ship = upsideDownShip();
  private city = corona();
  private ovenG = oven();
  private steam = new Graphics();
  private crumbs = new Graphics();
  private emb = embassy();
  private gal = galleon();
  private chalk = new Graphics();
  private chalkK = -1;
  private beam = new Graphics();
  private pebbleG = new Graphics();
  private pebbles: { uid: string; dx: number; dy: number; r: number; ph: number }[] = [];
  private bal: ReturnType<typeof boatBalloon> | null = null;
  private boat: Container | null = null;
  private boatPivot = 0;
  /** where things sit (world coords; from the island's anchors) */
  private P: { home: Pt; faro: Pt; boat: Pt | null };
  /** where the sky things sit (world coords), from the camera's reach */
  private L!: { top: number; spout: Pt & { h: number }; elev: Pt & { h: number }; city: Pt; emb: Pt; gal: Pt; chalk: Pt };
  /** where the scenes frame them (in front) and where they rest as sky (behind, clear of the islands) */
  private L0!: { city: number; emb: number; gal: number; isles: number[] };
  private Lup!: { city: number; emb: number; gal: number; isles: number[]; shipIsle: number };
  /** 0 = in front at the scenes' places, 1 = sky behind the islands (eased) */
  private restK = 1;
  private front = false;
  private lookTint = -1;

  constructor(
    private scene: Container,
    private skyWorld: Container,
    private graded: Container,
    anchors: { home: Pt; faro: Pt; boat: Pt | null },
    bounds?: { minX: number; maxX: number; minY: number; maxY: number },
  ) {
    this.P = anchors;
    this.target = this.derived();
    this.cur = { ...this.target };
    this.root.label = 'o2Sky';
    this.root.eventMode = 'none';
    this.light.label = 'o2SkyLight';
    this.light.eventMode = 'none';
    // at rest the sky things are sky: in skyWorld (graded with the world, behind the islands); a scene that drives
    // them brings them in front (see layer()). The light (the faro's signal) always rises over the world.
    skyWorld.addChild(this.root);
    const world = graded.parent;
    if (world) world.addChildAt(this.light, world.getChildIndex(graded) + 1);
    else skyWorld.addChild(this.light);
    const H = anchors.home;
    const top = bounds ? bounds.minY : H.y - 990;
    const right = bounds ? bounds.maxX : H.x + 1800;
    this.L = {
      top,
      spout: { x: H.x + 1250, y: top + 620, h: 1300 },
      elev: { x: right + 520, y: top + 700, h: 1500 },
      city: { x: H.x + 420, y: top - 470 },
      emb: { x: H.x + 1180, y: top - 520 },
      gal: { x: H.x - 560, y: top + 60 },
      chalk: { x: H.x + 60, y: top - 300 },
    };
    // the hanging islands, high over the archipelago
    const isleAt: [number, number, number, number][] = [
      [-1050, -60, 300, 1],
      [160, -300, 380, 2],
      [1150, -20, 280, 3],
    ];
    for (const [dx, dy, w, seed] of isleAt) {
      const g = islet(seed, w);
      g.position.set(H.x + dx, top + dy);
      this.isles.push(g);
      this.isleY.push(top + dy);
      this.islas.addChild(g);
    }
    this.ship.position.set(H.x + 160, top - 300 + 80);
    this.ship.scale.set(2);
    this.gal.scale.set(1.3);
    this.islas.addChild(this.ups, this.ship);
    this.city.position.set(this.L.city.x, this.L.city.y);
    this.city.scale.set(1.25);
    this.ovenG.position.set(230, -36);
    this.city.addChild(this.ovenG, this.steam, this.crumbs);
    this.emb.position.set(this.L.emb.x, this.L.emb.y);
    this.gal.position.set(this.L.gal.x, this.L.gal.y);
    this.chalk.position.set(this.L.chalk.x, this.L.chalk.y);
    this.root.addChild(this.city, this.emb, this.islas, this.gal, this.chalk, this.spouts);
    // resting places: each thing lifted (never lowered) until its lowest point clears the islands under it
    const line = SkyLine.of(scene);
    const up = (y: number, x: number, half: number, below: number) => (line ? line.clear(y, x - half, x + half, below) : y);
    this.L0 = { city: this.L.city.y, emb: this.L.emb.y, gal: this.L.gal.y, isles: [...this.isleY] };
    this.Lup = {
      city: up(this.L.city.y, this.L.city.x, 570, 130),
      emb: up(this.L.emb.y, this.L.emb.x, 100, 46),
      gal: up(this.L.gal.y, this.L.gal.x - 56, 260, 66),
      isles: this.isleY.map((y, i) => up(y, this.isles[i].x, isleAt[i][2] / 2 + 20, 70)),
      // the middle one while the upside-down ship is moored under it (H44)
      shipIsle: up(this.isleY[1], this.isles[1].x, isleAt[1][2] / 2 + 60, 220),
    };
    this.place();
    this.light.addChild(this.beam, this.pebbleG);
    this.beam.blendMode = 'add';
    Ticker.shared.add(this.tick, this);
    this.render(0);
  }

  // ------------------------------------------------------------------ state
  private derived(): O2SkyState {
    let kit = false;
    try {
      const fk = (G.s?.ext as { flightKit?: { ships?: unknown[] } } | undefined)?.flightKit;
      kit = Array.isArray(fk?.ships) && fk!.ships!.length > 0;
    } catch {
      /* never breaks the island */
    }
    return o2SkyFor(G.s, kit);
  }
  /** re-read the save (oleada2Flow calls it twice a second) */
  sync() {
    this.target = this.derived();
  }
  /** a scene drives a part (0..1) until `release` */
  drive(id: O2SkyId, k: number) {
    this.driven.set(id, k);
    this.cur[id] = k;
  }
  driveGet(id: O2SkyId) {
    return this.cur[id];
  }
  /** a scene hands everything back to what the story says (eased) */
  release() {
    this.driven.clear();
    this.sync();
  }
  /** a burst of pebbles floating up around your cats (Gravedad arrived): `on` false lets them settle */
  floatPebbles(on: boolean) {
    this.pebbles = [];
    if (!on) return;
    const st = cineStage('island');
    const cats = (G.s?.cats ?? []).slice(0, 24);
    let i = 0;
    for (const c of cats) {
      const p = st?.resolve(`cat:${c.uid}`);
      if (!p) continue;
      const n = settings.reduceMotion ? 2 : 4;
      for (let k = 0; k < n; k++) this.pebbles.push({ uid: c.uid, dx: ((k * 37 + i * 13) % 90) - 45, dy: 10 + ((k * 23 + i * 7) % 30), r: 4 + ((k + i) % 4) * 1.6, ph: (k + i) * 0.9 });
      i++;
    }
  }
  get alive() {
    return !this.dead && !this.scene.destroyed && !this.skyWorld.destroyed;
  }
  /**
   * H44 when Plomito isn't on your island (out with a fleet, or not yours yet): he drops out of the sky onto YOUR
   * boat's deck — the boat dips, he weighs like a piano — and falls asleep right there, «Zzz». His beat is never
   * skipped (PULIDO 2026-10-10). Returns the stopper (the scene owns it).
   */
  plomitoAboard(rm: boolean): () => void {
    if (!this.boat || this.boat.destroyed) this.boat = this.findBoat();
    const boat = this.boat;
    const holder = new Container();
    holder.label = 'o2Plomito';
    holder.eventMode = 'none';
    const home = this.P.boat ?? this.P.home;
    // on the deck (a child of the boat: it bobs with it), or by your home when there's no boat at all
    if (boat) {
      holder.position.set(10, -30);
      boat.addChild(holder);
    } else {
      holder.position.set(home.x + 120, home.y + 30);
      this.light.addChild(holder);
    }
    const at = boat ? { x: home.x + 10 * (Math.sign(boat.scale.x) || 1), y: home.y - 30 } : { x: holder.x, y: holder.y };
    const tweens: gsap.core.Animation[] = [];
    let zzz: Text | null = null;
    let dipped = 0;
    const dip = (v: number) => {
      if (!boat || boat.destroyed) return;
      boat.pivot.y += dipped - v;
      dipped = v;
    };
    let dead = false;
    void preloadCats(['plomito_plumb_cat']).then(() => {
      if (dead || holder.destroyed) return;
      const cat = new IslandCat('plomito_plumb_cat', 104);
      cat.face(-1);
      holder.addChild(cat);
      const land = () => {
        if (dead || holder.destroyed) return;
        cat.sleeping = true;
        cat.sprite.emote('sleepy', 1);
        const k = { v: 0 };
        if (!rm) tweens.push(gsap.timeline().to(k, { v: 12, duration: 0.07, onUpdate: () => dip(k.v) }).to(k, { v: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)', onUpdate: () => dip(k.v) }));
        onomatopoeia(this.light, at.x, at.y - 120, '¡CRIIIC!', { size: 54, color: C.paper });
        const z = txt('Zzz', { fontFamily: F.comic, fontSize: 46, fill: C.yellow, stroke: { color: C.ink, width: 8, join: 'round' } }) as Text;
        z.anchor.set(0.5, 1);
        z.position.set(at.x + 34, at.y - 96);
        this.light.addChild(z);
        zzz = z;
        if (!rm) tweens.push(gsap.to(z, { y: z.y - 16, alpha: 0.55, duration: 1.3, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
      };
      if (rm) return land();
      // from the sky, heavy: a straight drop, a squash on the deck
      cat.sprite.y = -320;
      tweens.push(
        gsap
          .timeline()
          .to(cat.sprite, { y: 0, duration: 0.5, ease: 'power3.in' })
          .call(() => (cat.sprite.crouch = 0.9))
          .call(land)
          .call(() => (cat.sprite.crouch = 0), [], '+=0.18'),
      );
    });
    return () => {
      dead = true;
      for (const t of tweens) t.kill();
      dip(0);
      if (zzz && !zzz.destroyed) zzz.destroy();
      if (!holder.destroyed) holder.destroy({ children: true });
    };
  }

  // ------------------------------------------------------------------ frame
  private tick(tk: Ticker) {
    if (!this.alive) return this.destroy();
    const dt = Math.min(0.1, tk.deltaMS / 1000);
    this.t += dt;
    for (const id of O2_SKY_IDS) {
      if (this.driven.has(id)) continue;
      const want = this.target[id];
      const c = this.cur[id];
      this.cur[id] = Math.abs(want - c) < 0.002 ? want : c + (want - c) * Math.min(1, dt * 0.9);
    }
    this.layer(this.driven.size > 0);
    const want = this.front ? 0 : 1;
    if (this.restK !== want) this.restK = Math.abs(want - this.restK) < 0.002 ? want : this.restK + (want - this.restK) * Math.min(1, dt * 2.2);
    this.place();
    this.render(dt);
  }

  /** in front of the archipelago (a scene is driving the sky) or sky behind it (at rest) */
  private layer(front: boolean) {
    if (front === this.front) return;
    this.front = front;
    const world = this.graded.parent;
    if (front && world) world.addChildAt(this.root, world.getChildIndex(this.graded) + 1);
    else this.skyWorld.addChild(this.root);
    // behind, the night grade of the world tints it; in front it takes the world's light by hand (render)
    this.lookTint = -1;
    this.root.tint = 0xffffff;
  }
  /** the resting places blended with the scenes' places */
  private place() {
    const k = this.restK;
    const mix = (a: number, b: number) => a + (b - a) * k;
    this.L.city.y = mix(this.L0.city, this.Lup.city);
    this.L.emb.y = mix(this.L0.emb, this.Lup.emb);
    this.L.gal.y = mix(this.L0.gal, this.Lup.gal);
    const ship = this.cur.cascada > 0.01;
    this.L0.isles.forEach((y, i) => (this.isleY[i] = mix(y, i === 1 && ship ? this.Lup.shipIsle : this.Lup.isles[i])));
  }

  private render(dt: number) {
    const c = this.cur;
    const t = this.t;
    const rm = settings.reduceMotion;
    const F = this.P.faro;
    // the world's light on the sky things (the graded world's tint × exposure + its lift, by hand)
    const wl = this.front ? cineStage('island')?.worldGet() : null;
    if (wl) {
      const ch = (sh: number) => Math.round(Math.max(0, Math.min(1, (((wl.tint >> sh) & 255) / 255) * wl.exposure + ((wl.lift >> sh) & 255) / 255)) * 255);
      const tn = (ch(16) << 16) | (ch(8) << 8) | ch(0);
      if (tn !== this.lookTint) {
        this.lookTint = tn;
        this.root.tint = tn;
      }
    }
    // ---- waterspouts
    const sp = this.spouts.clear();
    const spout = (bx: number, by: number, h: number, w: number, k: number, ph: number, a: number) => {
      if (k < 0.01 || a < 0.01) return;
      const n = 30;
      const top = h * k;
      // the splash on the sea
      sp.ellipse(bx, by, w * 2.4, w * 0.5).fill({ color: WATER, alpha: 0.35 * a }).stroke({ width: 2, color: INK, alpha: 0.25 * a });
      // the body: a twisting column of water with dark edges
      const L: number[] = [];
      const R: number[] = [];
      for (let i = 0; i <= n; i++) {
        const f = i / n;
        const rad = w * (1 - 0.55 * Math.sin(f * Math.PI * 0.9)) + (f > 0.85 ? (f - 0.85) * w * 9 : 0);
        const sway = Math.sin(t * 1.3 + f * 4 + ph) * (12 + f * 40) * (rm ? 0.5 : 1);
        L.push(bx + sway - rad, by - f * top);
        R.unshift(bx + sway + rad, by - f * top);
      }
      sp.poly([...L, ...R]).fill({ color: WATER, alpha: 0.62 * a }).stroke({ width: 3, color: INK, alpha: 0.55 * a, join: 'round' });
      for (let i = 0; i <= n; i++) {
        const y = by - (i / n) * top;
        const f = i / n;
        const rad = w * (1 - 0.55 * Math.sin(f * Math.PI * 0.9)) + (f > 0.85 ? (f - 0.85) * w * 9 : 0);
        const sway = Math.sin(t * 1.3 + f * 4 + ph) * (12 + f * 40) * (rm ? 0.5 : 1);
        // the rings climb: a stripe pattern moving up
        const stripe = 0.5 + 0.5 * Math.sin(f * 26 - t * (rm ? 2 : 5) + ph);
        if (stripe > 0.55) sp.ellipse(bx + sway, y, rad * 0.9, rad * 0.26).fill({ color: 0xf2faff, alpha: 0.7 * a });
      }
      // the cloud it climbs into
      const cy = by - top;
      const sway = Math.sin(t * 1.3 + 4 + ph) * 52 * (rm ? 0.5 : 1);
      for (const [dx, dy, r] of [
        [-60, 0, 54],
        [0, -24, 70],
        [64, -2, 50],
        [20, 18, 46],
      ] as [number, number, number][])
        sp.circle(bx + sway + dx * (0.6 + k * 0.4), cy + dy, r * (0.5 + 0.5 * k)).fill({ color: 0xf4f6fb, alpha: 0.9 * a });

      // gulls riding it up without flapping
      for (let g = 0; g < 2; g++) {
        const f = ((t * 0.07 + g * 0.5 + ph * 0.13) % 1) * k;
        const gx = bx + Math.sin(t * 1.3 + f * 4 + ph) * (12 + f * 40) + (g ? 46 : -40);
        const gy = by - f * h;
        sp.moveTo(gx - 10, gy - 4).lineTo(gx, gy + 2).lineTo(gx + 10, gy - 4).stroke({ width: 2.5, color: INK, alpha: 0.6 * a });
      }
    };
    const base = { x: this.L.spout.x, y: this.L.spout.y };
    const sh = this.L.spout.h;
    spout(base.x - 300, base.y + 60, sh * 0.8, 40, c.trombas, 0, Math.min(1, c.trombas * 3));
    spout(base.x, base.y, sh, 50, c.trombas, 2.1, Math.min(1, c.trombas * 3));
    spout(base.x + 340, base.y + 90, sh * 0.72, 36, c.trombas, 4.2, Math.min(1, c.trombas * 3));
    // the elevator that stays (farther out, thinner, hazy)
    spout(this.L.elev.x, this.L.elev.y, this.L.elev.h, 28, Math.max(c.elevator, 0.001), 1.3, c.elevator * 0.8 * (1 - Math.min(1, c.trombas)));
    // ---- the hanging islands (and their waterfalls falling UP)
    this.islas.alpha = Math.min(1, c.islas) * 0.9;
    this.islas.visible = this.islas.alpha > 0.01;
    if (this.islas.visible) {
      this.isles.forEach((g, i) => (g.y = this.isleY[i] + Math.sin(t * 0.4 + i * 2) * (rm ? 2 : 8)));
      const u = this.ups.clear();
      for (const g of this.isles) {
        const w = g.width * 0.5;
        for (const s of [-1, 1]) {
          const x = g.x + s * w * 0.62;
          // a ribbon of water climbing from the grass edge past the rock and away
          u.rect(x - 7, g.y - 260, 14, 270).fill({ color: WATER, alpha: 0.8 }).stroke({ width: 2, color: INK, alpha: 0.4 });
          for (let k = 0; k < 6; k++) {
            const yy = g.y + 4 - ((t * (rm ? 30 : 90) + k * 46) % 270);
            u.rect(x - 5, yy, 10, 18).fill({ color: 0xffffff, alpha: 0.9 });
          }
        }
      }
      this.ship.alpha = Math.min(1, c.cascada);
      this.ship.visible = this.ship.alpha > 0.01;
      this.ship.rotation = Math.sin(t * 0.7) * 0.03;
      this.ship.y = this.isles[1].y + 90;
    }
    // ---- Corona Celeste (and its lean toward the oven: H49)
    this.city.alpha = Math.min(1, c.corona) * 0.92;
    this.city.visible = this.city.alpha > 0.01;
    if (this.city.visible) {
      this.city.rotation = 0.13 * c.tilt;
      this.ovenG.alpha = Math.min(1, c.tilt * 2);
      this.city.y = this.L.city.y + Math.sin(t * 0.3) * 6;
      const st = this.steam.clear();
      const cr = this.crumbs.clear();
      if (c.tilt > 0.01) {
        // the oven breathes: puffs swell and drift up
        const br = 0.5 + 0.5 * Math.sin(t * 1.1);
        for (let k = 0; k < 4; k++) {
          const f = (t * 0.18 + k * 0.25) % 1;
          st.circle(251 - f * 30, -128 - f * 160, (22 + f * 40) * (0.8 + br * 0.3)).fill({ color: 0xffffff, alpha: (1 - f) * 0.9 * c.tilt }).stroke({ width: 2, color: INK, alpha: (1 - f) * 0.4 * c.tilt });
        }
        // crumbs, balls, a distracted cat: everything rolls toward the oven
        for (let k = 0; k < 9; k++) {
          const f = (t * (rm ? 0.05 : 0.12) + k * 0.111) % 1;
          const x = -220 + f * 420;
          cr.circle(x, -48 + (k % 3) * 3, k === 4 ? 10 : 5 + (k % 2) * 2).fill({ color: k === 4 ? 0xe39b52 : k % 3 ? 0xd9b47a : 0x6aa0c8, alpha: c.tilt * (f < 0.92 ? 1 : (1 - f) * 12) });
        }
      }
    }
    // ---- the embassy (it leaves: embajadaAway)
    const away = c.embajadaAway;
    this.emb.alpha = Math.min(1, c.embajada) * (1 - away) * 0.95;
    this.emb.visible = this.emb.alpha > 0.01;
    this.emb.position.set(this.L.emb.x + away * 700, this.L.emb.y - away * 260 + Math.sin(t * 0.5) * 8);
    // ---- the white galleon (it glides in)
    this.gal.alpha = Math.min(1, c.galeon) * 0.95;
    this.gal.visible = this.gal.alpha > 0.01;
    this.gal.position.set(this.L.gal.x - (1 - Math.min(1, c.galeon)) * 900, this.L.gal.y + Math.sin(t * 0.6) * 10);
    this.gal.rotation = Math.sin(t * 0.45) * 0.02;
    // ---- the Leviathan in chalk (drawn as k grows)
    const lk = Math.round(c.leviatan * 200) / 200;
    if (lk !== this.chalkK) {
      this.chalkK = lk;
      const g = this.chalk.clear();
      if (lk > 0) {
        const n = LEVIATAN.length - 1;
        const upto = lk * n;
        g.moveTo(LEVIATAN[0][0], LEVIATAN[0][1]);
        for (let i = 1; i <= Math.ceil(upto); i++) {
          const [x0, y0] = LEVIATAN[i - 1];
          const [x1, y1] = LEVIATAN[i];
          const f = Math.min(1, upto - (i - 1));
          g.lineTo(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f);
        }
        g.stroke({ width: 14, color: CHALK, alpha: 0.95, cap: 'round', join: 'round' });
        if (lk > 0.95) {
          // the eye, and the chalk lines of its fins: it bows its head (obedient)
          g.circle(-820, 0, 9).fill({ color: CHALK, alpha: 0.85 });
          g.moveTo(-200, 120).lineTo(-260, 220).lineTo(-120, 130).stroke({ width: 7, color: CHALK, alpha: 0.6, join: 'round' });
          g.moveTo(400, 115).lineTo(360, 210).lineTo(480, 120).stroke({ width: 7, color: CHALK, alpha: 0.6, join: 'round' });
        }
      }
    }
    this.chalk.visible = lk > 0;
    this.chalk.rotation = lk > 0.95 ? -0.04 : 0;
    // ---- the lantern's signal: a thread of light straight up from your faro
    const bm = this.beam.clear();
    if (c.signal > 0.01) {
      const look = cineStage('island')?.worldGet();
      const night = look ? Math.min(1, 0.2 + look.sky * 0.9) : 0.5;
      let on = 1;
      if (c.signal > 0.75) {
        // three short, one long (3.4 s): it's not a lantern's rhythm
        const p = t % 3.4;
        on = p < 0.18 || (p > 0.42 && p < 0.6) || (p > 0.84 && p < 1.02) || (p > 1.3 && p < 2.25) ? 1 : 0.12;
      } else on = 0.55 + 0.05 * Math.sin(t * 2);
      const a = on * night * Math.min(1, c.signal * 1.3);
      const top = F.y - 2400;
      for (const [w, al] of [
        [70, 0.1],
        [34, 0.22],
        [12, 0.6],
      ] as [number, number][])
        bm.poly([F.x - w * 0.25, F.y - 40, F.x + w * 0.25, F.y - 40, F.x + w, top, F.x - w, top]).fill({ color: 0xffe9b0, alpha: al * a });
      bm.circle(F.x, F.y - 40, 26).fill({ color: 0xfff3cf, alpha: 0.5 * a });
    }
    // ---- pebbles floating up around your cats (Gravedad)
    const pg = this.pebbleG.clear();
    if (c.pebbles > 0.01 && this.pebbles.length) {
      const st = cineStage('island');
      for (const p of this.pebbles) {
        const at = st?.resolve(`cat:${p.uid}`);
        if (!at) continue;
        const lift = c.pebbles * (40 + p.dy * 2) + Math.sin(t * 1.6 + p.ph) * 6 * c.pebbles;
        pg.circle(at.x + p.dx, at.y + 50 - lift, p.r).fill({ color: 0x9aa3b8, alpha: Math.min(1, c.pebbles * 2) * 0.9 }).stroke({ width: 1.5, color: INK, alpha: 0.7 * Math.min(1, c.pebbles * 2) });
      }
    }
    // ---- your aerobarco (the balloon rides the boat; the hop is the boat's own pivot)
    this.syncBoat(c, t, dt);
  }

  private findBoat(): Container | null {
    const b = this.P.boat;
    if (!b) return null;
    const walk = (n: Container, depth: number): Container | null => {
      for (const ch of n.children as Container[]) {
        if (ch.label === 'o2Sky' || ch.label === 'o2SkyLight') continue;
        if (Math.abs(ch.x - b.x) < 2 && Math.abs(ch.y - b.y) < 8 && !(ch as { catUid?: unknown }).catUid && ch.children.length) return ch;
        if (depth < 2 && ch.children.length) {
          const r = walk(ch, depth + 1);
          if (r) return r;
        }
      }
      return null;
    };
    return walk(this.graded, 0);
  }
  private syncBoat(c: O2SkyState, t: number, _dt: number) {
    if (c.balloon < 0.01 && !this.bal) return;
    if (!this.boat || this.boat.destroyed) {
      this.boat = this.findBoat();
      this.bal = null;
      if (!this.boat) return;
    }
    if (!this.bal) {
      this.bal = boatBalloon();
      this.boat.addChild(this.bal.root);
    }
    const k = Math.min(1, c.balloon);
    const b = this.bal;
    b.root.visible = k > 0.01;
    b.balloon.scale.set(0.2 + 0.8 * k, k);
    b.balloon.pivot.set(0, 0);
    b.balloon.position.set(0, (1 - k) * -40);
    b.ropes.alpha = k;
    for (const [i, p] of b.props.entries()) {
      p.scale.set(Math.max(0.01, (k - 0.5) * 2));
      p.rotation = t * (settings.reduceMotion ? 2 : 7) * (i ? -1 : 1);
    }
    // the little hop (pivot: IslandScene keeps writing the boat's position for its bob)
    const hop = c.hop * 34;
    if (Math.abs(hop - this.boatPivot) > 0.05) {
      this.boat.pivot.y += hop - this.boatPivot;
      this.boatPivot = hop;
    }
  }

  destroy() {
    if (this.dead) return;
    this.dead = true;
    Ticker.shared.remove(this.tick, this);
    if (this.boat && !this.boat.destroyed) this.boat.pivot.y -= this.boatPivot;
    if (this.bal && !this.bal.root.destroyed) this.bal.root.destroy({ children: true });
    if (!this.root.destroyed) this.root.destroy({ children: true });
    if (!this.light.destroyed) this.light.destroy({ children: true });
  }
}

// ------------------------------------------------------------------ mounting (one per island scene)
let sky: O2Sky | null = null;
let skyScene: Container | null = null;

/** the prop on the island on screen right now (null elsewhere) */
export function o2Sky(): O2Sky | null {
  return sky?.alive ? sky : null;
}

/** keep the prop in step with the save (app/oleada2Flow, twice a second). Mounts only when there's something to draw */
export function syncO2Sky(force = false) {
  const sc = scenes.current as Container | null;
  if (sky && (!sky.alive || skyScene !== sc)) {
    sky.destroy();
    sky = null;
    skyScene = null;
  }
  if (sky) {
    sky.sync();
    return sky;
  }
  if (!sc || sc.destroyed) return null;
  let kit = false;
  try {
    const fk = (G.s?.ext as { flightKit?: { ships?: unknown[] } } | undefined)?.flightKit;
    kit = Array.isArray(fk?.ships) && fk!.ships!.length > 0;
  } catch {
    /* ignore */
  }
  if (!force && !o2SkyAny(o2SkyFor(G.s, kit))) return null;
  const st = cineStage('island');
  if (!st?.alive()) return null;
  const skyWorld = sc.getChildByLabel('skyWorld', true);
  const graded = sc.getChildByLabel('graded', true);
  const home = st.resolve('home');
  const faro = st.resolve('faro') ?? home;
  if (!skyWorld || !graded || !home || !faro) return null;
  const bounds = (sc as unknown as { cam?: { bounds?: { minX: number; maxX: number; minY: number; maxY: number } } }).cam?.bounds;
  sky = new O2Sky(sc, skyWorld, graded, { home, faro, boat: st.resolve('boat') }, bounds ? { ...bounds } : undefined);
  skyScene = sc;
  return sky;
}
