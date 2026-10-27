/**
 * CAJA — a 2D scene of another BOX (Parte III dimensions), first one: LA BORRACHA, a TV-cartoon box
 * (docs/part-iii/04, 06 §3). It is the CINE stage `caja` (src/cine/types.ts CineStage) with two sets:
 *
 *   'bar'    La Última Ronda, inside: the TV camera stands behind the counter (a fixed sitcom shot). Canelo at the bar,
 *            Doña Espuma at the far end polishing a glass, the rain on the window, the «APLAUSOS» box.
 *   'calle'  the alley outside: the neon sign whose last A flickers, puddles, lamp posts, and at the far end the cat flap
 *            painted on the wall. The interactive WALK home (tap = Luzterna tugs the scarf; it can never be lost).
 *
 * THE LISTENER RULE (04 §0): before the reveal, the camera NEVER goes right of Canelo. Two guards: the camera clamps its
 * right edge to BAR.hideX (wide screens included), and nothing right of it exists on screen — Hipólito, his donut and
 * the donut tower are not even visible until `reveal()`. No mirrors, no shadows, no name plates (OYENTE has none).
 *
 * Cats: the house cats who visit (Canelo, Luzterna) are BAKED through the Borracha's TV lens once (bakeTv, zero cost per
 * frame); the natives (Hipólito, Doña Espuma: CANDIDATE paintings, pending the owner's approval) are drawn as painted.
 *
 * Scripts: src/cine/scenes/p3Bar.ts (p3_bar_a, p3_bar_b) · p3Salida.ts (p3_salida). Flow: app/gaterasFlow.ts.
 * Dev: ?scene=caja&set=bar|calle (&cine=p3_bar_a) — window.__caja.
 */
import { Container, Graphics, Rectangle, Sprite, type FederatedPointerEvent } from 'pixi.js';
import { CRTFilter } from 'pixi-filters';
import { Scene } from '../core/scenes';
import { W, H, game } from '../core/App';
import { setCineStage } from '../cine/registry';
import type { ActorCmd, CineCtx, CineStage, FxCmd, InteractCmd, Target } from '../cine/types';
import { NORMAL_LOOK, type WorldLook } from '../state/sys/worldState';
import { Studio } from '../momentos/anime/actor';
import type { CatPuppet } from '../art/livingCat';
import { catRig } from '../art/puppetCore';
import { G } from '../state/game';
import { catSlug } from '../state/sys/forms';
import { settings } from '../core/settings';
import { BAR, BarSet, CALLE, StreetSet, tvText } from '../momentos/songs/drunck/bar';
import { frameCamera } from '../momentos/songs/drunck/layout';
import { CAST, LW, STAND_IN, TV, bakePlain, bakeTv, donut, mug } from '../momentos/songs/drunck/tv';
import { Silueta, type SiluetaOpts } from '../momentos/songs/drunck/silueta';
import { CALLE_SIZE, CalleDirector } from './caja/calle';
import { GATERA_X } from '../momentos/songs/drunck/street';
import { BAR_FX, BarDirector } from './caja/barDirector';
import { FloorShot, drawTowerAt, hipFall, leaveWobble } from './caja/barRemate';
import { bakeOneByOne } from './caja/barPrecarga';

export type CajaSetId = 'bar' | 'calle';
type Who = 'canelo' | 'espuma' | 'hipolito' | 'luzterna';

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const easeOut = (k: number) => 1 - (1 - clamp(k, 0, 1)) ** 3;
const easeInOut = (k: number) => {
  const x = clamp(k, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};

/** Canelo as the player has him (his form), else the cozy painting */
export function caneloSlug(): string {
  try {
    const c = G.s?.cats?.find((x) => x.species === 'c_canelo');
    if (c) return catSlug(c);
  } catch {
    /* no save */
  }
  return 'canelo_cozy_cat';
}
/** a native's painting, or its stand-in when the candidate is missing from this build */
export function castSlug(who: keyof typeof CAST): string {
  return catRig(CAST[who]) ? CAST[who] : STAND_IN[who];
}

/**
 * A candidate rig without its `floats` list (seen: espuma_bartender_cat, 2026-10-13) would crash the puppet: give it an
 * empty list IN MEMORY (catRigs.json is not ours to edit; reported to the coordinator).
 */
export function guardRig(slug: string) {
  const r = catRig(slug) as { floats?: unknown[] } | undefined;
  if (r && !Array.isArray(r.floats)) r.floats = [];
}

// ================================================================== a cat on the set
export class Toon extends Container {
  readonly inner = new Container();
  readonly puppet: CatPuppet | null;
  /** extra pose this frame (the scene writes it): rotation, offsets, squash */
  rot = 0;
  dx = 0;
  dy = 0;
  sx = 1;
  sy = 1;
  flip: boolean;
  private sc = 1;
  constructor(
    studio: Studio,
    readonly raw: string,
    readonly size: number,
    flip: boolean,
  ) {
    super();
    this.flip = flip;
    guardRig(raw);
    this.puppet = studio.puppet(raw);
    if (this.puppet) {
      const [, h] = studio.size(raw);
      this.sc = size / h;
      this.puppet.scale.set(this.sc);
      this.inner.addChild(this.puppet);
    }
    this.addChild(this.inner);
  }
  /**
   * The light treatment of docs/part-iii/13 §2.2 on THIS puppet (momentos/songs/drunck/silueta.ts): silhouette (`k`)
   * or rim mode (`rimRest`), built from the real painting — never a generic shape. The owner calls `sil.update(dt)`.
   */
  sil: Silueta | null = null;
  silhouette(o: SiluetaOpts = {}): Silueta | null {
    this.sil?.destroy();
    this.sil = this.puppet ? new Silueta(this.puppet, o) : null;
    return this.sil;
  }
  override destroy(o?: Parameters<Container['destroy']>[0]) {
    this.sil?.destroy();
    this.sil = null;
    super.destroy(o);
  }
  apply() {
    this.inner.position.set(this.dx, this.dy);
    this.inner.rotation = this.rot;
    this.inner.scale.set((this.flip ? -1 : 1) * this.sx, this.sy);
  }
  /** the head centre in the parent's space (world) */
  head(): { x: number; y: number } {
    const h = this.puppet?.brain.headLocal();
    return this.local(h ? h[0] : 0, h ? h[1] : -this.size * 0.7 / this.sc);
  }
  /** a point of the painting (rig units, 0..700) in the parent's space */
  point(px: number, py: number): { x: number; y: number } {
    const p = this.puppet;
    if (!p) return { x: this.x, y: this.y };
    return this.local(px - p.brain.anchor.x * p.W, py - p.brain.anchor.y * p.H);
  }
  private local(mx: number, my: number) {
    const fx = (this.flip ? -1 : 1) * this.sx * mx * this.sc;
    const fy = this.sy * my * this.sc;
    const c = Math.cos(this.rot);
    const s = Math.sin(this.rot);
    return { x: this.x + this.dx + fx * c - fy * s, y: this.y + this.dy + fx * s + fy * c };
  }
}

// ================================================================== the scene
export class CajaScene extends Scene {
  override bleed: number | null = null;
  readonly world = new Container();
  readonly screenL = new Container();
  private bar: BarSet | null = null;
  private calle: StreetSet | null = null;
  set: CajaSetId;
  readonly studioTv: Studio;
  readonly studioNative: Studio;
  readonly actors: Partial<Record<Who, Toon>> = {};
  readonly stage: CajaStage;
  ready = false;
  private alive = true;
  private crt: CRTFilter | null = null;
  t = 0;
  // ---- camera
  cam = { x: 820, y: 470, zoom: 1.25 };
  private shakeK = 0;
  private punchK = 0;
  // ---- the listener rule
  revealed = false;
  // ---- the bar's state (props on the counter)
  mugFill = 0.55;
  mugFoam = 1;
  /** the second mug (A3): 0 hidden … 1 there (its foam drops later: B10) */
  mug2 = 0;
  mug2Foam = 1;
  /** Espuma's slide (A6): 0..1 along the counter, null = none */
  slide: number | null = null;
  slideT0 = 0;
  /** Hipólito's donut tower falling (R6): seconds since it started, null = standing */
  fallT: number | null = null;
  snore = 0;
  snorePop: number | null = null;
  /** R8–R10: Canelo gets off his stool (0.5: gone below the counter) and shows up at the door (1) */
  leave = 0;
  /** B4: a fry on its way (start time) · B9′: the little flame at his tail tip (0 none … 1 as usual) · V4 the thread */
  fryT: number | null = null;
  flame = 0;
  threadT: number | null = null;
  /** B13: he turns his whole body to the listener (start time) */
  turnT: number | null = null;
  private counterG = new Graphics();
  private secretG = new Graphics();
  private fxG = new Graphics();
  private glowG = new Graphics();
  // ---- the alley
  /** Canelo's walk: world x, his lean (0 straight … 1 on the post), the leash tug, rolling out the door */
  walkX: number = CALLE.door.x + 280;
  lean = 0;
  tug = 0;
  roll: number | null = null;
  lying = 0;
  luzX = 3000;
  luzOn = 0;
  leash = 0;
  backs = 0;
  cross = 0;
  luzLook = 0;
  /** Canelo is not in the alley (A1: he is inside, drinking) */
  canHidden = false;
  /** where Luzterna faces: -1 left (towards him / the bar) · 1 right */
  luzFace = -1;
  /** the alley's director (scenes/caja/calle.ts, LUZ): acting, the legs, the light treatment, V1–V5 */
  calleDir: CalleDirector | null = null;
  /** the bar's polish pass (scenes/caja/barDirector.ts, BAR): acting, props, inserts, the cross */
  readonly barDir: BarDirector;
  // ---- screen shots (overlays)
  private gulp: { root: Container; bg: Graphics; face: Sprite | null; fg: Graphics } | null = null;
  private gulpT = 0;
  private card: Container | null = null;
  private cardT = 0;
  private floor: Container | null = null;
  private onTap = new Set<() => void>();
  private keys = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'Enter') for (const f of [...this.onTap]) f();
  };

  constructor(o: { set?: CajaSetId } = {}) {
    super();
    this.set = o.set ?? 'bar';
    this.studioTv = new Studio(game.pixi.renderer, true, {}, bakeTv);
    this.studioNative = new Studio(game.pixi.renderer, true, {}, bakePlain);
    this.stage = new CajaStage(this);
    this.barDir = new BarDirector(this);
  }

  override async enter() {
    this.addChild(this.world, this.screenL);
    this.eventMode = 'static';
    this.hitArea = new Rectangle(-4000, -4000, 12000, 12000);
    this.on('pointertap', (e: FederatedPointerEvent) => {
      if (e.button > 0) return;
      for (const f of [...this.onTap]) f();
    });
    window.addEventListener('keydown', this.keys);
    if (!settings.reduceFlashes) {
      // the TV texture lives in the picture, not in the paint: soft scanlines and a little curvature (06 §3)
      this.crt = new CRTFilter({ curvature: 2.2, lineWidth: 2.4, lineContrast: 0.08, noise: 0.035, noiseSize: 1.4, vignetting: 0.32, vignettingAlpha: 0.55, vignettingBlur: 0.4 });
      this.world.filters = [this.crt];
    }
    const can = caneloSlug();
    const fonts = Promise.all(['60px "Bangers"', '40px "Permanent Marker"', '60px "Anton"'].map((f) => document.fonts.load(f).catch(() => undefined)));
    // ONE painting per frame (each bake is a burst of GPU work + a texture upload): what's on screen meanwhile — the
    // cross's living light (caja/barLuz.ts) — keeps moving. The rasters themselves were asked early (barPrecarga.ts)
    const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
    // every raster in flight at once (the art queue decodes them in idle time); the uploads and bakes go one per frame
    await bakeOneByOne(
      game.pixi.renderer,
      [
        [this.studioTv, can],
        [this.studioTv, 'luzterna'],
        [this.studioNative, castSlug('espuma')],
        [this.studioNative, castSlug('hipolito')],
        ...this.barDir.extraTv().map((s): [Studio, string] => [this.studioTv, s]),
      ],
      () => this.isAlive,
    );
    await fonts;
    await nextFrame();
    if (this.destroyed || !this.alive) return;
    this.useSet(this.set);
    this.ready = true;
    setCineStage('caja', this.stage);
    if (import.meta.env.DEV) (window as unknown as { __caja: unknown }).__caja = this;
  }

  override exit() {
    this.alive = false;
    this.calleDir?.destroy();
    this.calleDir = null;
    this.barDir.dispose();
    setCineStage('caja', null);
    window.removeEventListener('keydown', this.keys);
    this.onTap.clear();
    this.studioTv.dispose();
    this.studioNative.dispose();
    this.crt?.destroy();
    if (import.meta.env.DEV) delete (window as unknown as { __caja?: unknown }).__caja;
  }
  get isAlive() {
    return this.alive && !this.destroyed;
  }

  // ---------------------------------------------------------------- sets
  useSet(id: CajaSetId) {
    this.set = id;
    this.calleDir?.destroy();
    this.calleDir = null;
    for (const a of Object.values(this.actors)) a?.destroy({ children: true });
    for (const k of Object.keys(this.actors)) delete this.actors[k as Who];
    this.bar?.destroy();
    this.calle?.destroy();
    this.bar = null;
    this.calle = null;
    this.world.removeChildren();
    // fresh drawing layers (the old ones went with the old set)
    this.counterG = new Graphics();
    this.secretG = new Graphics();
    this.fxG = new Graphics();
    if (id === 'bar') {
      const b = new BarSet();
      this.bar = b;
      this.world.addChild(b.root);
      b.props.addChild(this.counterG);
      b.secret.addChild(this.secretG);
      b.fx.addChild(this.fxG);
      this.mk('espuma', this.studioNative, castSlug('espuma'), BAR.espuma.h, true, b.cast, BAR.espuma.x, BAR.espuma.y);
      this.mk('canelo', this.studioTv, caneloSlug(), BAR.canelo.h, true, b.cast, BAR.canelo.x, BAR.canelo.y);
      // Hipólito exists only from the reveal on (the rule of the listener)
      const hip = this.mk('hipolito', this.studioNative, castSlug('hipolito'), BAR.hipolito.h, false, b.secret, BAR.hipolito.x, BAR.hipolito.y);
      if (hip?.puppet) hip.puppet.sleeping = true;
      // his donut goes OVER his face (drawn after him)
      b.secret.addChild(this.secretG);
      if (this.revealed) b.buildSecret();
      this.cam = { x: 820, y: 470, zoom: 1.25 };
    } else {
      const s = new StreetSet();
      this.calle = s;
      this.world.addChild(s.root);
      s.fx.addChild(this.fxG);
      this.glowG = new Graphics();
      s.back.addChild(this.glowG);
      // she floats a little behind him: her lantern and her giant moments never hide his face
      this.mk('luzterna', this.studioTv, 'luzterna', CALLE_SIZE.luzterna, false, s.cast, this.luzX, CALLE.ground - 140);
      this.mk('canelo', this.studioTv, caneloSlug(), CALLE_SIZE.canelo, true, s.cast, this.walkX, CALLE.ground);
      this.calleDir = new CalleDirector(this);
      this.cam = { x: 600, y: 460, zoom: 1.2 };
    }
    this.barDir.attach(id);
    this.applyCam();
  }
  private mk(who: Who, studio: Studio, raw: string, size: number, flip: boolean, parent: Container, x: number, y: number) {
    if (!studio.has(raw)) return null;
    const t = new Toon(studio, raw, size, flip);
    t.position.set(x, y);
    parent.addChild(t);
    this.actors[who] = t;
    return t;
  }
  get barSet() {
    return this.bar;
  }
  get streetSet() {
    return this.calle;
  }

  /** the reveal (R1): the counter's right part, Hipólito, the donut tower come into existence */
  reveal() {
    this.revealed = true;
    this.bar?.buildSecret();
  }

  // ---------------------------------------------------------------- camera
  /** the camera after the rules: inside the set, and (before the reveal) never right of the listener line */
  framed(x: number, y: number, zoom: number) {
    return frameCamera(x, y, zoom, game.view, this.set, this.revealed);
  }
  /** the right edge of what the camera shows (world x) */
  rightEdge() {
    const f = this.framed(this.cam.x, this.cam.y, this.cam.zoom);
    const v = game.view;
    return f.x + (v.x + v.w - W / 2) / (f.zoom * (1 + this.punchK)) + Math.abs(this.shakeK) * 30;
  }
  private applyCam() {
    const f = this.framed(this.cam.x, this.cam.y, this.cam.zoom);
    const sh = settings.reduceMotion ? 0 : this.shakeK;
    // a shake never pushes the frame past the listener line (it only goes left)
    const sx = Math.sin(this.t * 61) * 14 * sh;
    const sxSafe = this.set === 'bar' && !this.revealed ? -Math.abs(sx) : sx;
    this.world.pivot.set(f.x + sxSafe, f.y + Math.cos(this.t * 53) * 12 * sh);
    this.world.position.set(W / 2, H / 2);
    // a punch zooms IN: the frame only gets narrower
    this.world.scale.set(f.zoom * (1 + Math.max(0, this.punchK)) * (this.calleDir?.camZoom ?? 1));
    // the alley may turn the shot (L4: his upside-down point of view; the drunk tilt) — never the bar
    this.world.rotation = this.calleDir?.camRot ?? 0;
  }
  shake(k: number) {
    this.shakeK = Math.max(this.shakeK, k);
  }
  punch(k: number) {
    this.punchK = Math.max(this.punchK, k);
  }

  // ---------------------------------------------------------------- taps (the walk, interact prompts)
  listenTap(fn: () => void) {
    this.onTap.add(fn);
    return () => void this.onTap.delete(fn);
  }

  // ---------------------------------------------------------------- per frame
  override update(dt: number) {
    if (!this.ready) return;
    this.t += dt;
    const t = this.t;
    this.shakeK = Math.max(0, this.shakeK - dt * 2.2);
    this.punchK = Math.max(0, this.punchK - dt * 3);
    if (this.crt) {
      this.crt.time = t * 6;
      this.crt.seed = Math.random();
    }
    if (this.bar) this.updateBar(dt);
    if (this.calle) this.updateCalle(dt);
    this.barDir.update(dt);
    this.stage.tick(dt);
    for (const a of Object.values(this.actors)) a?.apply();
    this.updateShots(dt);
    this.applyCam();
  }

  private updateBar(dt: number) {
    const b = this.bar!;
    const t = this.t;
    b.update(t);
    // ---- Canelo: the rubber-hose breath of a happy drunk (he sways; a hiccup now and then is the cine's)
    const c = this.actors.canelo;
    if (c) {
      c.sy = 1 + 0.018 * Math.sin(t * 2.6);
      c.sx = 1 - 0.008 * Math.sin(t * 2.6);
      c.rot = 0.035 * Math.sin(t * 1.15) + this.hicK * -0.05;
      c.dy = -this.hicK * 26;
      // B13: the whole body turns (a cartoon turn: squash through the profile and back, wider, facing the listener)
      if (this.turnT !== null) {
        const k = clamp((t - this.turnT) / 0.5, 0, 1);
        c.sx *= 1 - 0.55 * Math.sin(k * Math.PI);
        c.sx *= 1 + 0.06 * k;
      }
      // getting off the stool, then at the door (small, far, full body above the counter line)
      const L = this.leave;
      if (L > 0) {
        const a = clamp(L * 2, 0, 1);
        const b = clamp(L * 2 - 1, 0, 1);
        c.position.set(lerp(BAR.canelo.x, -760, b), lerp(BAR.canelo.y + 260 * a, 690, b));
        // he staggers (caja/barRemate.ts): sways off the stool, zigzags at the door
        const w = leaveWobble(L, t);
        c.x += w.dx;
        c.rot += w.rot;
        c.dy += w.dy;
        if (b > 0) {
          c.sx *= lerp(1, 0.5, b);
          c.sy *= lerp(1, 0.5, b);
          c.rot += Math.sin(t * 7) * 0.08;
        }
        c.visible = a < 1 || b > 0;
      } else {
        c.position.set(BAR.canelo.x, BAR.canelo.y);
        c.visible = true;
      }
    }
    this.hicK = Math.max(0, this.hicK - dt * 4);
    // ---- Espuma polishes her glass (the painting does the rest): a small rhythmic wiggle
    const e = this.actors.espuma;
    if (e) {
      e.rot = 0.02 * Math.sin(t * 5.2);
      e.dy = Math.abs(Math.sin(t * 5.2)) * -3;
    }
    // ---- Hipólito (after the reveal): asleep, face in his donut, his snore bubble breathing
    const hp = this.actors.hipolito;
    if (hp && this.revealed && this.fallT === null) {
      // asleep face-down on the counter, his face in a donut
      hp.rot = -0.42 + 0.02 * Math.sin(t * 1.3);
      hp.dx = -30;
      hp.dy = 10;
    } else if (hp && this.fallT !== null) {
      // R6, slow motion (caja/barRemate.ts): anticipation, then he slides off the stool backwards, dragging the
      // tower, and drops behind the counter
      const f = hipFall(t - this.fallT);
      hp.rot = f.rot;
      hp.dx = f.dx;
      hp.dy = f.dy;
      hp.sx = f.sx;
      hp.sy = f.sy;
    }
    // ---- the counter: Canelo's mug, the second mug, Espuma's slide
    const g = this.counterG;
    g.clear();
    this.fxG.clear();
    const m1 = BAR.tarro;
    // the mug she slides: from her end of the counter to Canelo's paws (A6)
    if (this.slide !== null) {
      const k = clamp((t - this.slideT0) / 1.1, 0, 1);
      this.slide = k;
      const x = lerp(BAR.espuma.x + 120, m1.x - 150, easeOut(k));
      mug(g, x, m1.y + 10, m1.w * 0.9, m1.h * 0.9, { fill: 0.92, side: -1 });
      if (k < 1) for (let i = 0; i < 3; i++) g.moveTo(x - 30 - i * 26, m1.y + 60 + i * 30).lineTo(x - 90 - i * 40, m1.y + 60 + i * 30).stroke({ width: 5, color: TV.cream, alpha: 0.7 * (1 - k) });
    }
    mug(g, m1.x, m1.y, m1.w, m1.h, { fill: this.mugFill, foam: this.mugFoam, side: 1 });
    if (this.mug2 > 0) {
      const m2 = BAR.tarro2;
      const yy = m2.y + (1 - this.mug2) * 60;
      g.alpha = 1;
      mug(g, m2.x, yy, m2.w, m2.h, { fill: 0.7, foam: this.mug2Foam, side: 1 });
    }
    // ---- B4: a fry from the little plate to his mouth; half of it falls back
    if (this.fryT !== null && c) {
      const k = clamp((t - this.fryT) / 1.4, 0, 1);
      const hd = c.head();
      const from = { x: 1040, y: BAR.counterBack + 4 };
      const to = { x: hd.x + 40, y: hd.y + 50 };
      if (k < 0.5) {
        const q = easeInOut(k / 0.5);
        const x = lerp(from.x, to.x, q);
        const y = lerp(from.y, to.y, q) - Math.sin(q * Math.PI) * 80;
        g.roundRect(x - 5, y - 16, 10, 32, 3).fill(TV.amberL).stroke({ width: 3, color: TV.line });
      } else {
        const q = (k - 0.5) / 0.5;
        const x = to.x + q * 30;
        const y = to.y + 6 + q * q * (BAR.counterBack - to.y + 10);
        g.roundRect(x - 5, y - 8, 10, 16, 3).fill(TV.amberL).stroke({ width: 3, color: TV.line });
      }
    }
    // ---- B9′: the little flame at the tip of his tail (smaller than usual: it flickers low)
    if (this.flame > 0.01 && c) {
      const r = catRig(c.raw);
      const tip = r?.tail?.pts?.[r.tail.pts.length - 1];
      if (tip) {
        const p = c.point(tip[0], tip[1]);
        const f = this.flame * (0.8 + 0.2 * Math.sin(t * 13) * Math.sin(t * 5));
        const fg = this.fxG;
        fg.circle(p.x, p.y - 30 * f, 60 * f).fill({ color: 0xffb43a, alpha: 0.2 });
        fg.poly([p.x - 26 * f, p.y, p.x - 10 * f, p.y - 50 * f, p.x, p.y - 90 * f, p.x + 12 * f, p.y - 46 * f, p.x + 26 * f, p.y]).fill(0xff8a2a).stroke({ width: 4, color: TV.line });
        fg.poly([p.x - 11 * f, p.y - 4, p.x, p.y - 46 * f, p.x + 11 * f, p.y - 4]).fill(0xffe08a);
      }
    }
    // ---- the secret part (only after the reveal): Hipólito's donut on his face, the tower, the snore bubble
    const s = this.secretG;
    s.clear();
    if (this.revealed && hp) {
      const hd = hp.head();
      if (this.fallT === null) {
        // the donut sits ON the counter (above its top band): his face is in it
        donut(this.fxG, hd.x - 30, hd.y + 40, 84, 3);
        // the snore bubble grows and shrinks (pops at R6)
        if (this.snorePop === null) {
          const r = 22 + 30 * (0.5 + 0.5 * Math.sin(t * 1.6)) * this.snore;
          if (this.snore > 0.01) this.fxG.circle(hd.x - 120, hd.y - 50, r).fill({ color: 0xcff0ff, alpha: 0.55 }).stroke({ width: LW * 0.7, color: TV.line });
        }
      }
      this.drawTower(s, dt);
    }
    if (this.snorePop !== null) {
      const k = (t - this.snorePop) / 0.35;
      if (k < 1 && hp) {
        const hd = hp.head();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const r = 40 + 70 * k;
          this.fxG.moveTo(hd.x - 120 + Math.cos(a) * r * 0.6, hd.y - 50 + Math.sin(a) * r * 0.6).lineTo(hd.x - 120 + Math.cos(a) * r, hd.y - 50 + Math.sin(a) * r).stroke({ width: 5, color: TV.cream, alpha: 1 - k });
        }
      }
    }
  }
  private hicK = 0;
  hic(who: Who = 'canelo') {
    if (who === 'canelo') this.hicK = 1;
    this.actors[who]?.puppet?.emote('surprise', 0.8);
  }

  /** the donut tower on its stand; while falling (R6) the donuts fly in slow motion (closed form) */
  private drawTower(g: Graphics, _dt: number) {
    const ft = this.fallT === null ? -1 : this.t - this.fallT;
    // the set's own stand goes with the drag (it is drawn tilting with the donuts)
    const stand = this.bar?.secret.children[0];
    if (stand && stand !== this.secretG && ft > 0.5) stand.visible = false;
    drawTowerAt(g, ft);
  }

  /** the alley (H67): scenes/caja/calle.ts directs it (acting, the four legs, the light treatment, V1–V5) */
  private updateCalle(dt: number) {
    this.calleDir?.update(dt);
  }

  // ---------------------------------------------------------------- full-screen shots
  /** A8: the bottom of the mug seen from inside, the beer, Canelo's face up there through the glass */
  showGulp(on: boolean) {
    if (!on) {
      this.gulp?.root.destroy({ children: true });
      this.gulp = null;
      return;
    }
    if (this.gulp) return;
    const root = new Container();
    const bg = new Graphics();
    root.addChild(bg);
    const face = this.studioTv.still(caneloSlug(), 0.5, 0.5);
    if (face) {
      face.tint = 0xffc870;
      face.alpha = 0.7;
      root.addChild(face);
    }
    const fg = new Graphics();
    root.addChild(fg);
    this.gulp = { root, bg, face, fg };
    this.gulpT = this.t;
    this.screenL.addChild(root);
  }
  /** «GATERA DESCUBIERTA · La Última Ronda · Dimensión Borracha» (end of H66) */
  showCard(on: boolean) {
    if (!on) {
      this.card?.destroy({ children: true });
      this.card = null;
      return;
    }
    if (this.card) return;
    const c = new Container();
    const bg = new Graphics();
    c.addChild(bg);
    const t1 = tvText('¡GATERA DESCUBIERTA!', 120, TV.amberL, { strokeW: 12 });
    t1.position.set(W / 2, H / 2 - 60);
    const t2 = tvText('LA ÚLTIMA RONDA  ·  DIMENSIÓN BORRACHA', 46, TV.cream, { font: 'Anton', strokeW: 7, spacing: 4 });
    t2.position.set(W / 2, H / 2 + 70);
    c.addChild(t1, t2);
    this.card = c;
    this.cardT = this.t;
    this.screenL.addChild(c);
  }
  /** R7: the floor behind the counter — Hipólito on his back, a donut on each paw and one on his head */
  showFloor(on: boolean) {
    if (!on) {
      this.floor?.destroy({ children: true });
      this.floor = null;
      return;
    }
    if (this.floor) return;
    // caja/barRemate.ts: the donuts land on him (the crown last), his snore bubble comes back, a slow push in
    const shot = new FloorShot(this.studioNative.still(castSlug('hipolito'), 0.5, 0.5), this.t, settings.reduceMotion);
    this.floorShot = shot;
    this.floor = shot.root;
    this.screenL.addChild(shot.root);
  }
  private floorShot: FloorShot | null = null;
  /** A1: a patron flies out of the door, gets dizzy, gets up and goes back in — a REAL painting (caja/barCliente.ts) */
  ejectPatron() {
    this.barDir.eject();
  }

  private updateShots(_dt: number) {
    const t = this.t;
    if (this.floor && this.floorShot && !this.floorShot.root.destroyed) this.floorShot.update(t);
    // A8 the gulp
    if (this.gulp) {
      const k = clamp((t - this.gulpT) / 2.4, 0, 1);
      const v = game.view;
      const { bg, face, fg } = this.gulp;
      bg.clear();
      bg.rect(v.x, v.y, v.w, v.h).fill(lerpColor(0xffb43a, 0xb5651a, k));
      if (face) {
        const sc = (1.8 + k * 0.6) * (700 / Math.max(1, face.texture.height));
        face.position.set(W / 2 + Math.sin(t * 3) * 18, 330 - k * 120 + Math.sin(t * 2.3) * 10);
        face.rotation = Math.PI + Math.sin(t * 1.7) * 0.05;
        face.scale.set(-sc, sc * (1 + 0.04 * Math.sin(t * 5)));
      }
      fg.clear();
      // bubbles rising like stars
      for (let i = 0; i < 26; i++) {
        const x = v.x + ((i * 173) % v.w);
        const y = v.y + v.h - ((t * (120 + (i % 5) * 40) + i * 97) % (v.h + 80));
        fg.circle(x, y, 6 + (i % 4) * 3).fill({ color: TV.foam, alpha: 0.75 }).stroke({ width: 3, color: TV.amberD });
      }
      // the bottom of the glass coming at the camera: a thick ring that grows past the screen
      const r = lerp(380, 1500, k * k);
      fg.circle(W / 2, H / 2 + 60, r).stroke({ width: 60 + 200 * k, color: 0xffe0a0, alpha: 0.55 });
      fg.circle(W / 2, H / 2 + 60, r).stroke({ width: LW * 2, color: TV.line, alpha: 0.6 });
    }
    // the title card: TV end card, a starburst behind
    if (this.card) {
      const k = clamp((t - this.cardT) / 0.4, 0, 1);
      const bg = this.card.children[0] as Graphics;
      const v = game.view;
      bg.clear();
      bg.rect(v.x, v.y, v.w, v.h).fill(TV.nightD);
      const n = 18;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2 + t * 0.15;
        const a1 = a0 + Math.PI / n;
        if (i % 2) continue;
        bg.poly([W / 2, H / 2, W / 2 + Math.cos(a0) * 2200, H / 2 + Math.sin(a0) * 2200, W / 2 + Math.cos(a1) * 2200, H / 2 + Math.sin(a1) * 2200]).fill(TV.night);
      }
      this.card.alpha = k;
      this.card.children[1].scale.set(0.6 + 0.4 * easeOut(k * 1.4) + 0.02 * Math.sin(t * 6));
    }
  }

  override destroy(o?: Parameters<Container['destroy']>[0]) {
    this.alive = false;
    super.destroy(o);
  }
}

function lerpColor(a: number, b: number, k: number) {
  const r = Math.round(lerp((a >> 16) & 255, (b >> 16) & 255, k));
  const gg = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, k));
  const bb = Math.round(lerp(a & 255, b & 255, k));
  return (r << 16) | (gg << 8) | bb;
}

// ================================================================== the cine stage
/** the walk home (04 §5.2): four legs between lamp posts; it can never be lost */
export const WALK_LEGS: [number, number][] = [
  [CALLE.door.x + 280, CALLE.posts[0]],
  [CALLE.posts[0], CALLE.posts[1]],
  [CALLE.posts[1], CALLE.posts[2]],
  [CALLE.posts[2], CALLE.posts[3]],
];
/** walk tuning: he totters on his own; a tap = a straight step; idle → he leans on a post; Luzterna pushes after 3 s */
export const WALK = { creep: 70, step: 150, idleToLean: 1.6, pushAfter: 3, pushSpeed: 520 } as const;

/** pure: one frame of a walk leg (tests drive it); returns the new state */
export interface WalkState {
  x: number;
  idle: number;
  leaning: number;
  pushing: boolean;
  done: boolean;
}
export function walkStep(s: WalkState, end: number, dt: number, taps: number): WalkState {
  if (s.done) return s;
  let { x, idle, leaning, pushing } = s;
  if (taps > 0) {
    x += WALK.step * taps;
    idle = 0;
    leaning = 0;
    pushing = false;
  } else if (pushing) {
    x += WALK.pushSpeed * dt;
  } else {
    idle += dt;
    if (idle < WALK.idleToLean) x += WALK.creep * dt;
    else {
      leaning += dt;
      if (leaning >= WALK.pushAfter) pushing = true;
    }
  }
  const done = x >= end;
  return { x: Math.min(x, end), idle, leaning, pushing, done };
}

export class CajaStage implements CineStage {
  readonly id = 'caja';
  private legs: { n: number; s: WalkState; end: number; taps: number; resolve: () => void; off: () => void }[] = [];
  private markers: { g: Container; t: Target; off: () => void }[] = [];
  constructor(readonly scene: CajaScene) {}

  blocked() {
    return false;
  }
  alive() {
    return this.scene.isAlive && this.scene.ready;
  }
  resolve(t: Target): { x: number; y: number } | null {
    if (typeof t !== 'string') return t;
    const sc = this.scene;
    const a = sc.actors;
    switch (t) {
      case 'canelo':
      case 'espuma':
      case 'hipolito':
      case 'luzterna': {
        const x = a[t as Who];
        return x ? x.head() : null;
      }
      case 'tarro':
        return { x: BAR.tarro.x + BAR.tarro.w / 2, y: BAR.tarro.y + 60 };
      case 'tarro2':
        return { x: BAR.tarro2.x + BAR.tarro2.w / 2, y: BAR.tarro2.y + 50 };
      case 'barra':
        return { x: 720, y: 640 };
      case 'cola':
        return a.canelo ? { x: a.canelo.x - 170, y: a.canelo.y - 180 } : null;
      case 'plato':
        return { x: 1060, y: 690 };
      case 'cuarto':
        return { x: 300, y: 380 };
      case 'letrero':
        return { x: CALLE.sign.x, y: 280 };
      case 'puerta':
        return { x: CALLE.door.x + 120, y: CALLE.ground - 220 };
      case 'calle':
        return { x: (sc.walkX + sc.luzX) / 2, y: CALLE.ground - 280 };
      case 'gatera':
        return { x: GATERA_X, y: CALLE.ground - 200 };
      case 'fondo':
        return { x: 2600, y: CALLE.ground - 300 };
    }
    return sc.barDir.resolve(t) ?? sc.calleDir?.resolve(t) ?? null;
  }
  cameraGet() {
    return { ...this.scene.cam };
  }
  cameraSet(x: number, y: number, zoom: number) {
    this.scene.cam = { x, y, zoom };
  }
  worldGet(): WorldLook {
    return { ...NORMAL_LOOK };
  }
  worldSet(_l: WorldLook) {}
  worldRelease(_blend: number) {}
  hud(_v: boolean) {}

  actor(cmd: ActorCmd, _ctx: CineCtx) {
    const who = cmd.who as Who;
    const a = this.scene.actors[who];
    if (!a?.puppet) return;
    const p = a.puppet;
    switch (cmd.do) {
      case 'emote':
        p.emote((cmd.arg ?? 'surprise') as Parameters<CatPuppet['emote']>[0], 1);
        break;
      case 'act':
        p.doAct((cmd.arg ?? 'look') as Parameters<CatPuppet['doAct']>[0]);
        break;
      case 'hop':
        this.scene.hic(who);
        break;
      case 'look':
        // the head turns (only a head: the body keeps facing where it faces)
        p.look = cmd.arg === 'left' ? -1 : cmd.arg === 'front' ? 0 : 1;
        break;
      case 'mark':
        this.scene.hic(who);
        break;
    }
  }

  /** the cine's named parameters (DriveCmd) — SALTAR folds them to their end value */
  driveGet(id: string): number | undefined {
    const s = this.scene;
    const mine = s.barDir.driveGet(id);
    if (mine !== undefined) return mine;
    switch (id) {
      case 'mug2':
        return s.mug2;
      case 'mug2Foam':
        return s.mug2Foam;
      case 'mug':
        return s.mugFill;
      case 'snore':
        return s.snore;
      case 'walkX':
        return s.walkX;
      case 'luzX':
        return s.luzX;
      case 'luz':
        return s.luzOn;
      case 'leash':
        return s.leash;
      case 'lying':
        return s.lying;
      case 'backs':
        return s.backs;
      case 'cross':
        return s.cross;
      case 'luzLook':
        return s.luzLook;
      case 'door':
        return s.streetSet?.door;
      case 'signA':
        return s.streetSet?.signOn;
      case 'applause':
        return s.barSet?.applause;
      case 'leave':
        return s.leave;
      case 'flame':
        return s.flame;
    }
    return s.calleDir?.driveGet(id);
  }
  drive(id: string, k: number, _ctx: CineCtx) {
    const s = this.scene;
    if (s.barDir.drive(id, k)) return;
    switch (id) {
      case 'mug2':
        s.mug2 = k;
        break;
      case 'mug2Foam':
        s.mug2Foam = k;
        break;
      case 'mug':
        s.mugFill = k;
        break;
      case 'snore':
        s.snore = k;
        break;
      case 'walkX':
        s.walkX = k;
        break;
      case 'luzX':
        s.luzX = k;
        break;
      case 'luz':
        s.luzOn = k;
        break;
      case 'leash':
        s.leash = k;
        break;
      case 'lying':
        s.lying = k;
        break;
      case 'backs':
        s.backs = k;
        break;
      case 'cross':
        s.cross = k;
        break;
      case 'luzLook':
        s.luzLook = k;
        break;
      case 'door':
        if (s.streetSet) s.streetSet.door = k;
        break;
      case 'signA':
        if (s.streetSet) s.streetSet.signOn = k;
        break;
      case 'applause':
        if (s.barSet) s.barSet.applause = k;
        break;
      case 'leave':
        s.leave = k;
        break;
      case 'flame':
        s.flame = k;
        break;
      default:
        s.calleDir?.drive(id, k);
    }
  }

  fx(cmd: FxCmd, ctx: CineCtx): (() => void) | void {
    const s = this.scene;
    if (BAR_FX.has(cmd.id)) return s.barDir.fx(cmd, ctx);
    switch (cmd.id) {
      case 'hic':
        s.hic((cmd.who as Who) ?? 'canelo');
        return;
      case 'shake':
        if (!ctx.reduceMotion) s.shake(Number(cmd.k ?? 0.4));
        return;
      case 'punch':
        if (!ctx.reduceMotion) s.punch(Number(cmd.k ?? 0.08));
        return;
      case 'slide':
        s.slide = 0;
        s.slideT0 = s.t;
        return () => {
          s.slide = null;
        };
      case 'catch':
        // he catches it with both paws without looking: the old mug is replaced by the full one
        s.slide = null;
        s.mugFill = 0.95;
        s.mugFoam = 1;
        s.hic('canelo');
        s.actors.canelo?.puppet?.emote('happy', 1);
        return;
      case 'gulp':
        s.showGulp(true);
        return () => s.showGulp(false);
      case 'card':
        s.showCard(true);
        return () => s.showCard(false);
      case 'floor':
        s.showFloor(true);
        return () => s.showFloor(false);
      case 'eject':
        s.ejectPatron();
        return;
      case 'fall':
        s.fallT = s.t;
        return;
      case 'pop':
        s.snorePop = s.t;
        return;
      case 'roll':
        s.roll = s.t;
        return;
      case 'tug':
        s.tug = 1;
        return;
      case 'fry':
        s.fryT = s.t;
        return () => {
          s.fryT = null;
        };
      case 'turn':
        s.turnT = s.t;
        s.actors.canelo?.puppet && (s.actors.canelo.puppet.look = 1);
        return;
      case 'twitch': {
        // R3: an eye trembles — a tiny rapid head shake
        const c = s.actors.canelo;
        if (!c) return;
        const t0 = s.t;
        const id = setInterval(() => {
          if (s.destroyed || s.t - t0 > 0.9) {
            clearInterval(id);
            if (!c.destroyed) c.dx = 0;
            return;
          }
          c.dx = Math.sin((s.t - t0) * 90) * 3;
        }, 16);
        return () => clearInterval(id);
      }
    }
    // the alley's flourishes (stamp, hairs, swing, stop, thread, bump)
    const r = s.calleDir?.fx(cmd.id);
    return r === false ? undefined : r;
  }

  /**
   * Interactions: 'walk:<1..4>' = a leg of the walk home (resolves when he reaches the post, whatever the player does);
   * any other target = «tap anywhere» with a marker there.
   */
  interact(cmd: InteractCmd, _ctx: CineCtx) {
    const id = typeof cmd.target === 'string' ? cmd.target : '';
    let res!: () => void;
    const done = new Promise<void>((r) => (res = r));
    if (id.startsWith('walk:')) {
      const n = Math.max(1, Math.min(4, Number(id.slice(5)) || 1));
      const [x0, end] = WALK_LEGS[n - 1];
      const sc = this.scene;
      sc.walkX = Math.max(sc.walkX, x0);
      const leg = { n, s: { x: sc.walkX, idle: 0, leaning: 0, pushing: false, done: false } as WalkState, end, taps: 0, resolve: res, off: () => undefined };
      leg.off = sc.listenTap(() => {
        leg.taps++;
        sc.tug = 1;
      });
      this.legs.push(leg);
      const hint = n === 1 ? this.marker(cmd.prompt ?? '¡TOCA!', () => ({ x: sc.walkX, y: CALLE.ground - 470 })) : null;
      return {
        done,
        cancel: () => {
          leg.off();
          hint?.();
          const i = this.legs.indexOf(leg);
          if (i >= 0) this.legs.splice(i, 1);
        },
      };
    }
    const at = () => this.resolve(cmd.target);
    const off1 = this.marker(cmd.prompt ?? '¡TOCA!', at);
    const off2 = this.scene.listenTap(() => res());
    return {
      done,
      cancel: () => {
        off1();
        off2();
      },
    };
  }
  /** a «¡TOCA!» marker over a world point (TV cartoon type) */
  private marker(text: string, at: () => { x: number; y: number } | null) {
    const t = tvText(text, 64, TV.amberL, { strokeW: 9 });
    const g = new Container();
    g.addChild(t);
    this.scene.world.addChild(g);
    const m = { g, t: '' as Target, off: () => undefined as void };
    const tick = () => {
      const p = at();
      if (p) g.position.set(p.x, p.y);
      t.scale.set(1 + 0.06 * Math.sin(this.scene.t * 8));
    };
    tick();
    const off = () => {
      const i = this.markers.indexOf(m);
      if (i >= 0) this.markers.splice(i, 1);
      if (!g.destroyed) g.destroy({ children: true });
    };
    m.off = off;
    (m as unknown as { tick: () => void }).tick = tick;
    this.markers.push(m);
    return off;
  }

  /** per frame (CajaScene.update): the walk legs, the markers */
  tick(dt: number) {
    const sc = this.scene;
    for (const m of this.markers) (m as unknown as { tick: () => void }).tick();
    for (const leg of [...this.legs]) {
      const taps = leg.taps;
      leg.taps = 0;
      leg.s = walkStep(leg.s, leg.end, dt, taps);
      sc.walkX = leg.s.x;
      // leaning on the post / the wall while you don't tap; straight while the leash holds him
      sc.lean += ((leg.s.leaning > 0 && !leg.s.pushing ? 1 : 0) - sc.lean) * Math.min(1, dt * 5);
      // Luzterna floats a step ahead of him; when she pushes she is right behind him
      const want = leg.s.pushing ? sc.walkX - 200 : sc.walkX + (sc.calleDir?.gap ?? 260);
      sc.luzX += (want - sc.luzX) * Math.min(1, dt * (leg.s.pushing ? 6 : 2.5));
      sc.luzFace = leg.s.pushing ? 1 : -1;
      if (leg.s.pushing) sc.tug = Math.max(sc.tug, 0.4);
      sc.cam.x += (sc.walkX + (sc.calleDir?.camLead ?? 160) - sc.cam.x) * Math.min(1, dt * 3);
      if (leg.s.done) {
        sc.lean = 0;
        leg.off();
        this.legs.splice(this.legs.indexOf(leg), 1);
        leg.resolve();
      }
    }
  }
}
