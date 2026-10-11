/**
 * The island under a NARRATIVE WORLD STATE (src/state/sys/worldState.ts): the 2D Pixi renderer of the look.
 *
 * Layers it adds to IslandScene (bottom → top):
 *   sea (day void) · NightSky (astral sky, far rising stars) · worldRoot › world › GRADED [terrain, ground,
 *   objects, ambient] + wfx/bubbles (world UI, never graded) · NightLights (additive, mirrors the camera) ·
 *   vignette · HUD (never touched).
 * The grade is a ColorMatrixFilter on the GRADED container only, attached only when the look isn't neutral
 * (Part I saves pay nothing). It follows the derived state (polled), blends between states both ways, and lets a
 * cinematic drive it (`set` / `release`). Audio: the look's ambience bed + music state through audio/api.ts.
 */
import { ColorMatrixFilter, Container, Rectangle, Sprite } from 'pixi.js';
import { game } from '../../core/App';
import { settings } from '../../core/settings';
import { audioApi } from '../../audio/api';
import { G } from '../../state/game';
import { clockLook, currentWorldState, isNeutralGrade, lookOf, mixLook, type WorldLook, type WorldStateDef } from '../../state/sys/worldState';
import { followView } from '../../ui/screen';
import { isoToScreen } from '../iso';
import { dimOf } from '../dimensions/defs';
import { dimWorld } from '../dimensions/state';
import type { IslandPlan } from '../layout';
import type { CatActor } from '../catActor';
import type { Ambient } from '../ambient';
import { NightSky } from './sky';
import { NightLights, waterPoint, type LightSpot } from './lights';
import { RisingStars } from './stars';
import { gradeMatrix } from './grade';
import { clockGen, islandHour } from './clock';
import { caneloCarriesPage, caneloPageArt, farIsleArt, farIsleShown } from './farIsle';
import { syncO1Songs } from '../../cine/sound';
import { applyCatNight } from './cats';
import { seamTex, vignetteTex } from './textures';

export interface NightAnchors {
  faro: { x: number; y: number } | null;
  portal?: { x: number; y: number } | null;
  altar?: { x: number; y: number } | null;
  port?: { x: number; y: number } | null;
  bank?: { x: number; y: number } | null;
  boat?: { x: number; y: number } | null;
  /** extra named points for cinematics ('home', 'lagoon'…) */
  [k: string]: { x: number; y: number } | null | undefined;
}

export interface NightHost {
  scene: Container;
  sea: Container;
  worldRoot: Container;
  world: Container;
  graded: Container;
  plan: IslandPlan;
  ambient: Ambient;
  /** the dimension sky bubbles behind each island (terrain.backdrops): they step back at night */
  backdrops?: Container;
  /** world-space layer right above those bubbles and under the islands: the seam lives there by day */
  skyWorld?: Container;
  /** world UI (never graded): its paper cloud veils over locked expansions (label 'veilClouds') darken with the night */
  bubbles?: Container;
  anchors: () => NightAnchors;
  actors: () => CatActor[];
}

const POLL = 0.25;
/** how often a clock-following state (cielo_roto) re-reads the hour */
const CLOCK_EVERY = 20;
/** the color world UI multiplies by to sit in the look's light (the grade's tint × exposure + its lift) */
export function worldUiTint(l: WorldLook) {
  const ch = (sh: number) => {
    const t = ((l.tint >> sh) & 255) / 255;
    const lf = ((l.lift >> sh) & 255) / 255;
    return Math.round(Math.max(0, Math.min(1, t * l.exposure + lf)) * 255);
  };
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

export class IslandNight {
  readonly sky = new NightSky();
  readonly farStars = new RisingStars(70, 0.28);
  readonly lights = new NightLights();
  /** screen space, in front of the islands: shooting stars must read */
  private front = new Container();
  private lightsRoot = new Container();
  private lightsWorld = new Container();
  private vignette = new Sprite(vignetteTex());
  /** the seam stitched across the sky between the islands (world space, read by day) */
  private seams: Sprite[] = [];
  private filter: ColorMatrixFilter | null = null;
  private area = new Rectangle();
  /** what's on screen */
  look: WorldLook;
  private from: WorldLook;
  private to: WorldLook;
  private tw = 1;
  private twDur = 0;
  private derived: WorldStateDef;
  private overridden = false;
  private pollT = 0;
  private audioFor = '';
  private nearAcc = 0;
  private farAcc = 0;
  private catSig = '';
  private catT = 0;
  private glanceT = 0;
  private spotsSig = '';
  private reflectTo = 0;
  private stateMark: { off: () => void; key: string } | null = null;
  private t = 0;
  private dead = false;
  private clockT = CLOCK_EVERY;
  /** a scene overrides how the cats react (cine fx 'pose'): applied after the look's reactions, every sync */
  catOverride: ((actors: CatActor[]) => void) | null = null;
  private overrideOn = false;
  /** a scene released the world into a clock-following state on purpose (the dawn): keep the story's daylight
   *  until the next time you come home (then the real clock takes over again) */
  holdClock = false;
  /** the island of books on the horizon (farIsle.ts): derived from the story; a scene may drive it (0..1) */
  private far: Container | null = null;
  private farK = 0;
  farDrive: number | null = null;
  private page: { g: Container; owner: CatActor } | null = null;
  private songT = 0;
  private clockSeen = clockGen();
  private veilTint = -1;

  constructor(private h: NightHost) {
    this.derived = currentWorldState(G.s);
    this.look = this.targetLook(this.derived);
    this.from = this.to = this.look;
    const sc = h.scene;
    sc.addChildAt(this.sky, sc.children.indexOf(h.sea) + 1);
    sc.addChildAt(this.farStars, sc.children.indexOf(this.sky) + 1);
    this.lightsRoot.addChild(this.lightsWorld);
    this.lightsWorld.addChild(this.lights);
    sc.addChildAt(this.lightsRoot, sc.children.indexOf(h.worldRoot) + 1);
    sc.addChildAt(this.front, sc.children.indexOf(this.lightsRoot) + 1);
    sc.addChildAt(this.vignette, sc.children.indexOf(this.front) + 1);
    this.front.eventMode = 'none';
    this.sky.shootLayer = this.front;
    this.lightsRoot.eventMode = 'none';
    this.vignette.eventMode = 'none';
    this.vignette.tint = 0x07061c;
    followView(this.vignette, (v) => {
      this.vignette.position.set(v.x, v.y);
      this.vignette.width = v.w;
      this.vignette.height = v.h;
    });
    this.lights.setFaro(h.anchors().faro);
    const home = h.anchors().home;
    if (h.skyWorld && home) {
      // two long scars across the archipelago: they show in every gap between the islands (under the islands)
      for (const [dx, dy, w, rot] of [
        [0, -620, 5600, 0.115],
        [-300, 1150, 4600, -0.18],
      ] as [number, number, number, number][]) {
        const s = new Sprite(seamTex('day'));
        s.anchor.set(0.5);
        s.position.set(home.x + dx, home.y + dy);
        s.width = w;
        s.height = w * 0.22;
        s.rotation = rot;
        s.visible = false;
        h.skyWorld.addChild(s);
        this.seams.push(s);
      }
    }
    this.rebuildSpots();
    this.applyAudio();
    this.render(0);
    // the Fonoteca catches up with what the story already handed out (idempotent; after a calm moment at home)
    this.songT = window.setTimeout(() => !this.dead && syncO1Songs(), 6000);
  }

  // ------------------------------------------------------------------ state
  /** the state the save says (what the island returns to after a cinematic) */
  get state() {
    return this.derived;
  }
  /** the look on screen */
  get(): WorldLook {
    return { ...this.look };
  }
  /** a cinematic drives the world (until release) */
  set(l: WorldLook) {
    this.overridden = true;
    this.tw = 1;
    this.look = l;
  }
  /** the look a state shows right now (a clock-following state reads the player's real hour) */
  targetLook(st: WorldStateDef): WorldLook {
    const l = lookOf(st);
    return st.clock && !this.holdClock ? clockLook(l, islandHour()) : l;
  }
  /** back to the derived state, blending */
  release(blend = 1.5) {
    this.overridden = false;
    this.derived = currentWorldState(G.s);
    this.blendTo(this.targetLook(this.derived), blend);
    this.applyAudio();
    this.reflectTo = 0;
  }
  get driven() {
    return this.overridden;
  }
  private blendTo(l: WorldLook, dur: number) {
    this.from = this.look;
    this.to = l;
    this.twDur = Math.max(0, dur);
    this.tw = this.twDur > 0 ? 0 : 1;
    if (this.tw >= 1) this.look = l;
  }
  private applyAudio() {
    const id = this.derived.id;
    if (this.audioFor === id) return;
    this.audioFor = id;
    const l = lookOf(this.derived);
    try {
      audioApi.setState(l.music, { fade: 3, context: `world:${id}` });
      audioApi.ambience(l.ambience, { fade: 3 });
    } catch {
      /* audio never breaks the island */
    }
  }

  // ------------------------------------------------------------------ cinematic helpers
  /** n stars rising over `dur` seconds (from the lagoons and the void in view). The caller sizes it (a cine has
   *  its own reduce-motion variant) */
  burst(n: number, dur: number, opts: { far?: number } = {}) {
    const cam = this.camRect();
    const k = 1;
    const N = Math.round(n * k);
    for (let i = 0; i < N; i++) this.spawnNear(cam, (i / Math.max(1, N)) * dur + Math.random() * 0.25, true);
    const farN = Math.round((opts.far ?? n * 0.8) * k);
    for (let i = 0; i < farN; i++) this.spawnFar((i / Math.max(1, farN)) * dur + Math.random() * 0.3);
  }
  shoot(reverse: boolean) {
    return this.sky.shoot({ reverse });
  }
  ignite() {
    this.lights.ignite(settings.reduceFlashes);
  }
  /** the lagoons reflect something strange (0..1, eased) */
  setReflect(k: number) {
    this.reflectTo = k;
  }
  aimFaro(a: number | null) {
    this.lights.aim = a;
  }
  marker(at: { x: number; y: number }, text: string) {
    return this.lights.marker(at, text);
  }
  /** world point → global (for cats looking at things) */
  toGlobal(p: { x: number; y: number }) {
    return this.h.world.toGlobal(p);
  }

  // ------------------------------------------------------------------ frame
  /** camera moved (IslandScene's cam.onChange) */
  follow() {
    const w = this.h.world;
    this.sky.follow(w.x, w.y, w.scale.x);
    this.syncTransform();
  }
  private syncTransform() {
    const r = this.h.worldRoot;
    this.lightsRoot.position.copyFrom(r.position);
    this.lightsRoot.pivot.copyFrom(r.pivot);
    this.lightsRoot.rotation = r.rotation;
    const w = this.h.world;
    this.lightsWorld.position.copyFrom(w.position);
    this.lightsWorld.scale.copyFrom(w.scale);
  }
  private camRect() {
    const w = this.h.world;
    const r = this.h.worldRoot;
    const z = w.scale.x || 1;
    const v = game.view;
    const ox = r.x - r.pivot.x + w.x;
    const oy = r.y - r.pivot.y + w.y;
    const x0 = (v.x - ox) / z;
    const y0 = (v.y - oy) / z;
    return { x0, y0, x1: x0 + v.w / z, y1: y0 + v.h / z };
  }

  update(dt: number) {
    if (this.dead) return;
    this.t += dt;
    this.pollT -= dt;
    if (this.pollT <= 0) {
      this.pollT = POLL;
      // the save may move on while a cine drives the look: keep `state` true, blend only when not driven
      const st = currentWorldState(G.s);
      if (st.id !== this.derived.id) {
        this.derived = st;
        this.clockT = CLOCK_EVERY;
        if (!this.overridden) {
          this.blendTo(this.targetLook(st), settings.reduceMotion ? Math.min(2, st.blend ?? 4) : (st.blend ?? 4));
          this.applyAudio();
        }
      }
      this.syncMarker();
    }
    // the scar of the sky follows the player's clock: every few seconds, a slow drift toward the hour's light
    if (this.derived.clock && !this.holdClock && !this.overridden && this.tw >= 1) {
      const g = clockGen();
      this.clockT -= g !== this.clockSeen ? 1e9 : dt;
      this.clockSeen = g;
      if (this.clockT <= 0) {
        this.clockT = CLOCK_EVERY;
        const want = this.targetLook(this.derived);
        if (Math.abs(want.exposure - this.look.exposure) > 0.004 || Math.abs(want.sky - this.look.sky) > 0.004 || want.tint !== this.look.tint) this.blendTo(want, 8);
      }
    }
    if (!this.overridden && this.tw < 1) {
      this.tw = Math.min(1, this.tw + dt / Math.max(0.001, this.twDur));
      const k = this.tw * this.tw * (3 - 2 * this.tw);
      this.look = mixLook(this.from, this.to, k);
    }
    this.render(dt);
  }

  private render(dt: number) {
    const l = this.look;
    const rm = settings.reduceMotion;
    this.syncTransform();
    this.sky.follow(this.h.world.x, this.h.world.y, this.h.world.scale.x);
    // ---- grade (world layers only)
    const g = this.h.graded;
    if (isNeutralGrade(l)) {
      if (this.filter) {
        g.filters = [];
        g.filterArea = undefined as unknown as Rectangle;
        this.filter.destroy();
        this.filter = null;
      }
    } else {
      if (!this.filter) {
        this.filter = new ColorMatrixFilter();
        g.filters = [this.filter];
      }
      this.filter.matrix = gradeMatrix(l) as typeof this.filter.matrix;
      const c = this.camRect();
      const pad = 64;
      this.area.x = c.x0 - pad;
      this.area.y = c.y0 - pad;
      this.area.width = c.x1 - c.x0 + pad * 2;
      this.area.height = c.y1 - c.y0 + pad * 2;
      g.filterArea = this.area;
    }
    // ---- sky
    this.sky.update(dt, l, rm);
    this.h.sea.visible = l.sky < 0.995;
    if (this.h.backdrops) this.h.backdrops.alpha = 1 - 0.78 * l.sky;
    for (const s of this.seams) {
      const a = l.seam * (1 - 0.75 * l.sky) * (rm ? 0.9 : 0.85 + 0.15 * Math.sin(this.t * 0.8));
      s.alpha = a;
      s.visible = a > 0.01;
    }
    this.vignette.alpha = l.vignette * 0.8;
    this.vignette.visible = l.vignette > 0.003;
    // the paper clouds over locked expansions live in the world UI (never graded): they take the night's light
    const vt = worldUiTint(l);
    if (vt !== this.veilTint && this.h.bubbles) {
      this.veilTint = vt;
      for (const c of this.h.bubbles.children) if (c.label === 'veilClouds') c.tint = vt;
    }
    // ---- day life fades at night (gulls, sunbeams)
    this.h.ambient.dayLife = l.dayLife;
    // ---- lights
    const cam = this.camRect();
    const cur = this.lights.reflect;
    this.lights.reflect = cur + (this.reflectTo - cur) * Math.min(1, dt * 0.8);
    if (Math.abs(this.lights.reflect - this.reflectTo) < 0.002) this.lights.reflect = this.reflectTo;
    this.lights.update(dt, l, cam, rm);
    this.lightsRoot.visible = l.lights > 0.003 || l.faro > 0.003 || l.seaGlow > 0.003 || l.starFall > 0 || this.lights.stars.count > 0 || this.lights.reflect > 0.003;
    // ---- rising stars (near: world space; far: behind the islands)
    const rate = l.starFall * (rm ? 0.5 : 1);
    this.nearAcc += dt * rate * (l.sky > 0.3 ? 0.45 : 1);
    this.farAcc += dt * rate * (l.sky > 0.3 ? 1.3 : 0);
    while (this.nearAcc >= 1) {
      this.nearAcc -= 1;
      this.spawnNear(cam, 0, false);
    }
    while (this.farAcc >= 1) {
      this.farAcc -= 1;
      this.spawnFar(0);
    }
    const v = game.view;
    this.farStars.update(dt, v.y, rm);
    this.farStars.visible = this.farStars.count > 0;
    // ---- cats
    this.catT -= dt;
    if (this.catT <= 0) {
      this.catT = 0.2;
      this.syncCats();
    }
    this.glanceT -= dt;
    this.syncFar(dt);
  }

  /** where the island of books sits: out in the void, the way the faro's beam pointed that night */
  private farAnchor() {
    const f = this.h.anchors().faro ?? this.h.anchors().home;
    return f ? { x: f.x - 2300, y: f.y - 560 } : null;
  }
  private syncFar(dt: number) {
    const want = this.farDrive ?? (farIsleShown() ? 1 : 0);
    this.farK += (want - this.farK) * (this.farDrive !== null ? 1 : Math.min(1, dt * 0.8));
    if (this.farK > 0.01 && !this.far && this.h.skyWorld) {
      const at = this.farAnchor();
      if (at) {
        this.far = farIsleArt();
        this.far.position.set(at.x, at.y);
        this.far.scale.set(1.05);
        this.far.eventMode = 'none';
        this.h.skyWorld.addChild(this.far);
      }
    }
    if (this.far) {
      // a haze by day; at night only its lamp would show (it fades with the sky)
      this.far.alpha = this.farK * 0.88 * (1 - 0.7 * this.look.sky);
      this.far.visible = this.far.alpha > 0.01;
    }
    // Canelo's page under his paws (H37–H38)
    const want2 = caneloCarriesPage();
    const can = want2 ? this.h.actors().find((a) => a.species === 'c_canelo' && !a.destroyed) : undefined;
    if (this.page && (this.page.owner !== can || this.page.owner.destroyed)) {
      if (!this.page.g.destroyed) this.page.g.destroy();
      this.page = null;
    }
    if (can && !this.page) {
      const g = caneloPageArt();
      can.addChildAt(g, 0);
      g.position.set(4, -4);
      g.scale.set(1.5);
      this.page = { g, owner: can };
    }
  }

  private syncCats() {
    const actors = this.h.actors();
    const frac = Math.round(this.look.cats * 40) / 40;
    const faro = this.h.anchors().faro;
    const sky = faro ? this.h.world.toGlobal({ x: faro.x, y: faro.y - 260 }) : null;
    const sig = `${frac}|${actors.length}`;
    // an override going away re-applies the look's own reactions
    if (!this.catOverride && this.overrideOn) {
      this.overrideOn = false;
      this.catSig = '';
    }
    if (sig !== this.catSig) {
      this.catSig = sig;
      applyCatNight(actors, frac, sky);
    } else if (sky && !this.catOverride) for (const a of actors) a.skyAt = sky;
    if (this.catOverride) {
      this.overrideOn = true;
      this.catOverride(actors);
    }
  }

  private spawnNear(cam: { x0: number; y0: number; x1: number; y1: number }, delay: number, burst: boolean) {
    const fromWater = Math.random() < 0.62;
    const p = fromWater ? waterPoint(cam) : null;
    const x = p?.x ?? cam.x0 + Math.random() * (cam.x1 - cam.x0);
    const y = p?.y ?? cam.y0 + (0.45 + Math.random() * 0.6) * (cam.y1 - cam.y0);
    const day = this.look.sky < 0.5;
    this.lights.stars.spawn({
      x,
      y,
      delay,
      scale: (burst ? 0.8 + Math.random() * 0.7 : 0.7 + Math.random() * 0.5) * (day ? 1.3 : 1),
      look: day ? 'day' : 'night',
      onRise: (sx, sy) => {
        if (p) this.lights.ripple(sx, sy);
        if (day) this.glance(sx, sy);
      },
    });
  }
  private spawnFar(delay: number) {
    const v = game.view;
    this.farStars.spawn({ x: v.x + Math.random() * v.w, y: v.y + v.h * (0.55 + Math.random() * 0.5), delay, scale: 0.35 + Math.random() * 0.35, v0: 20 + Math.random() * 40, acc: 120 + Math.random() * 200 });
  }
  /** a stray star in daylight: the nearest curious cat turns to look at it */
  private glance(x: number, y: number) {
    if (this.glanceT > 0) return;
    this.glanceT = 3;
    let best: CatActor | null = null;
    let bd = 900;
    for (const a of this.h.actors()) {
      const d = Math.hypot(a.x - x, a.y - y);
      if (d < bd) {
        bd = d;
        best = a;
      }
    }
    if (!best) return;
    const at = this.h.world.toGlobal({ x, y: y - 200 });
    best.gazeAt(at, 2.6);
    best.cat.sprite.emote('surprise', 0.6);
    // the ones nearby notice too, one by one and each in character (catActor.react)
    for (const a of this.h.actors()) {
      if (a === best || a.destroyed) continue;
      const d = Math.hypot(a.x - x, a.y - y);
      if (d < 700) a.react('wonder', at, { delay: 0.25 + d / 1400 });
    }
  }

  /** the derived state's invitation (e.g. «toca el faro» while H31 waits at night) */
  private syncMarker() {
    const p = this.overridden ? null : this.derived.prompt;
    const ok = !!p && (!p.when || p.when(G.s));
    const key = ok ? `${p!.target}|${p!.text}` : '';
    if (this.stateMark?.key === key) return;
    this.stateMark?.off();
    this.stateMark = null;
    if (!ok) return;
    const at = this.h.anchors()[p!.target];
    if (at) this.stateMark = { off: this.lights.marker(at, p!.text), key };
  }
  /** cinematics clear the state marker while they run their own */
  hideMarker() {
    this.stateMark?.off();
    this.stateMark = null;
  }

  // ------------------------------------------------------------------ light positions
  /** windows, lanterns, portals, dimension glows (rebuilt when habitats move or islands open) */
  rebuildSpots() {
    const looks = [...dimWorld.looks.entries()].map(([k, v]) => `${k}:${v}`).join(',');
    const habs = G.s.habitats.map((x) => `${x.id}@${x.gx},${x.gy}:${x.region}`).join(';');
    const sig = `${looks}|${habs}`;
    if (sig === this.spotsSig) return;
    this.spotsSig = sig;
    const spots: LightSpot[] = [];
    const a = this.h.anchors();
    const open = (r: string) => dimWorld.looks.get(r) === 'open';
    // habitats: warm windows + a pool of light on the yard
    for (const hb of G.s.habitats) {
      if (!open(hb.region)) continue;
      // the little house sits in the footprint's back corner: its windows glow, the yard gets a soft pool
      // (never a white wash over the cats' paintings)
      const c = isoToScreen(hb.gx + 0.7, hb.gy + 0.7);
      spots.push({ x: c.x, y: c.y - 62, color: 0xffc46a, r: 82, kind: 'window', flicker: 0.4, pool: 96 });
    }
    const add = (p: { x: number; y: number } | null | undefined, s: Omit<LightSpot, 'x' | 'y'>, dy = 0) => {
      if (p) spots.push({ ...s, x: p.x, y: p.y + dy });
    };
    add(a.portal, { color: 0xff5fb8, r: 190, kind: 'portal', pool: 140 });
    add(a.altar, { color: 0xa98bff, r: 120, kind: 'portal' });
    add(a.port, { color: 0xffc46a, r: 110, kind: 'lantern', flicker: 1, pool: 60 }, -60);
    add(a.bank, { color: 0xffe0a0, r: 100, kind: 'window', pool: 60 }, -60);
    add(a.boat, { color: 0xffb35a, r: 70, kind: 'lantern', flicker: 1 }, -40);
    // decor that glows: lamps, crystals, lava, stars, mushrooms (only on open islands)
    for (const p of this.h.plan.plans.values()) {
      if (!open(p.def.id)) continue;
      for (const d of p.decor) {
        const s = isoToScreen(d.gx, d.gy);
        if (d.kind === 'lamp') spots.push({ x: s.x, y: s.y - 70, color: 0xffcf7a, r: 80, kind: 'lantern', flicker: 1, pool: 60 });
        else if (d.kind === 'crystal') spots.push({ x: s.x, y: s.y - 30, color: 0x9fe8ff, r: 60, kind: 'glow' });
        else if (d.kind === 'lava') spots.push({ x: s.x, y: s.y - 10, color: 0xff6a1a, r: 90, kind: 'glow', flicker: 0.8 });
        else if (d.kind === 'star') spots.push({ x: s.x, y: s.y - 40, color: 0xffe066, r: 60, kind: 'glow' });
        else if (d.kind === 'mushroom') spots.push({ x: s.x, y: s.y - 18, color: 0x5ff3d0, r: 44, kind: 'glow' });
      }
    }
    // each dimension keeps its own light at night (lava glows, neon hums, the cosmos shines)
    const plates = dimWorld.plates;
    if (plates)
      for (const p of plates.values()) {
        const d = dimOf(dimWorld.biome[p.id]);
        const lk = dimWorld.looks.get(p.id);
        if (d.id === 'home') continue;
        if (lk === 'open') {
          const n = Math.max(2, Math.min(6, Math.round(p.land.length / 30)));
          for (let i = 0; i < n; i++) {
            const t = p.land[Math.floor(((i + 0.5) / n) * p.land.length)];
            if (!t) continue;
            const s = isoToScreen(t.gx, t.gy);
            spots.push({ x: s.x, y: s.y - 30, color: d.accent, r: 170, kind: 'dim', flicker: d.id === 'volcano' ? 0.7 : 0 });
          }
        } else spots.push({ x: p.cx, y: p.cy - 120, color: d.accent, r: 200, kind: 'dim' });
      }
    this.lights.setSpots(spots);
  }

  destroy() {
    if (this.dead) return;
    this.dead = true;
    clearTimeout(this.songT);
    if (this.page && !this.page.g.destroyed) this.page.g.destroy();
    this.page = null;
    this.far?.destroy({ children: true });
    this.far = null;
    this.stateMark?.off();
    this.h.graded.filters = [];
    this.filter?.destroy();
    this.filter = null;
    this.h.ambient.dayLife = 1;
    if (this.h.backdrops) this.h.backdrops.alpha = 1;
    if (this.h.bubbles && !this.h.bubbles.destroyed) for (const c of this.h.bubbles.children) if (c.label === 'veilClouds') c.tint = 0xffffff;
    for (const a of this.h.actors()) a.night = null;
    this.sky.destroy({ children: true });
    this.farStars.destroy({ children: true });
    this.lightsRoot.destroy({ children: true });
    this.front.destroy({ children: true });
    for (const s of this.seams) s.destroy();
    this.vignette.destroy();
  }
}

