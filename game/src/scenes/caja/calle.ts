/**
 * THE ALLEY, directed (LUZ, docs/part-iii/13 §3.5): everything the set 'calle' of scenes/CajaScene.ts does per frame
 * during H67 «¿Dónde andabas, gordo?» (cine p3_salida). CajaScene keeps the fields the cines already drive (walkX,
 * luzX, luzOn, leash, lying, backs, cross, luzLook, luzFace…) and hands the frame to this director.
 *
 * Acting: Luzterna is BIG, floats, her lantern SWINGS (a real pendulum on the painting's lantern: the puppet's mesh),
 *   she leans in to scold (`luzLean`), grows huge on «DERECHO. DERECHO.» (`luzBig`, scaled about her head so her face
 *   stays in frame) and stamps the floor flat (fx 'stamp'). Canelo walks drunk (walk cycle, half-lidded), bobs on the
 *   waving floor, is yanked back when she stops (fx 'stop').
 * The four legs: 1 the alley bends (`bend`) · 2–3 the floor waves (`wave`) until her stamp · 3 the rain calms (`rainK`)
 *   and her light dips a little (`luzDim`) · 4 she stops.
 * L4: the shot turns 180° as his upside-down point of view (`pov`; «Reducir movimiento»: a dip to dark instead).
 * V1–V5: NO generic shapes — the REAL puppets through silueta.ts: backlit by the painted cat flap (`glow`), the scarf and
 *   the lantern in color, the tail flame lit; the color floods back when they turn to each other (`canOut`, `luzOut`);
 *   V4 an insert of her sleeve keeping the orange thread (fx 'thread'); V5 he squashes through the flap and dissolves
 *   into its light (`cross`), she glances back at the bar (`luzLook`).
 */
import { Graphics } from 'pixi.js';
import type { CajaScene, Toon } from '../CajaScene';
import { CALLE } from '../../momentos/songs/drunck/layout';
import { LW, TV } from '../../momentos/songs/drunck/tv';
import { GATERA_X, type StreetSet } from '../../momentos/songs/drunck/street';
import { siluetaKeep, type Silueta, type SiluetaLight } from '../../momentos/songs/drunck/silueta';
import { catRig } from '../../art/puppetCore';
import { settings } from '../../core/settings';
import { game } from '../../core/App';

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeOut = (k: number) => 1 - (1 - clamp(k, 0, 1)) ** 3;

/** the parameters a cine can drive here (CajaStage forwards them; SALTAR folds them to their end value) */
export const CALLE_DRIVES = ['luzBig', 'luzLean', 'pov', 'bend', 'wave', 'rainK', 'luzDim', 'glow', 'canOut', 'luzOut', 'flap', 'gap', 'camLead', 'canLids', 'luzLids', 'luzLow'] as const;
type DriveId = (typeof CALLE_DRIVES)[number];
/** the one-shot flourishes */
export const CALLE_FX = ['stamp', 'hairs', 'swing', 'stop', 'thread', 'bump'] as const;

/** Luzterna's painting: her raised paw (two fingers: the leash, the hairs, the thread) and the lantern's handle */
const LUZ_PAW: [number, number] = [380, 322];
const LUZ_LANTERN: [number, number] = [104, 318];
const LUZ_HANDLE: [number, number] = [100, 206];
/** Canelo flat on his back on the wet street, his head towards her (L1–L5): a quarter turn, lifted onto the street */
const LIE = Math.PI / 2;
const LIE_UP = 105;
/** her size and Canelo's in the alley (painting height, world px): she is bigger than before (13 §3.5) */
export const CALLE_SIZE = { canelo: 400, luzterna: 500 } as const;

export class CalleDirector {
  // ---- the drives
  luzBig = 0;
  luzLean = 0;
  pov = 0;
  bend = 0;
  wave = 0;
  rainK = 1;
  luzDim = 1;
  glow = 0;
  canOut = 0;
  luzOut = 0;
  flap = 0;
  /** half-closed lids (the drunk look; her deadpan): the puppets' persistent 'sleepy' */
  canLids = 0.45;
  luzLids = 0;
  /** she floats lower, down to his eye level (the quiet parts: tramo 3–4) */
  luzLow = 0;
  /** Luzterna floats this far ahead of him on the walk (tramo 3–4: closer); the camera leads him by `camLead` */
  gap = 300;
  camLead = 160;
  // ---- one-shots
  private hairsT: number | null = null;
  private stampT: number | null = null;
  private stampHit = false;
  private stopT: number | null = null;
  private bumpT: number | null = null;
  /** V5: when he started to come apart into light motes (scene time) */
  private motesT: number | null = null;
  private swing = { a: 0, v: 0 };
  private prevLuzX = 0;
  private prevVx = 0;
  private prevWalkX = 0;
  private bigPrev = 0;
  private silC: Silueta | null = null;
  private silL: Silueta | null = null;
  private behind = new Graphics();
  private front = new Graphics();
  /** additive light (the flame's glow): light over a dark silhouette, never a brown smudge */
  private add = new Graphics();
  private dip: Graphics | null = null;
  private unhook: (() => void) | null = null;

  constructor(readonly scene: CajaScene) {
    const st = scene.streetSet;
    if (st) {
      st.back.addChild(this.behind);
      this.add.blendMode = 'add';
      st.fx.addChild(this.add, this.front);
    }
    this.prevLuzX = scene.luzX;
    this.prevWalkX = scene.walkX;
    this.dress();
  }

  private get st(): StreetSet | null {
    return this.scene.streetSet;
  }

  /** the real puppets get the light treatment (silueta.ts): a soft rim always (separation), silhouette when driven */
  private dress() {
    const c = this.scene.actors.canelo;
    const l = this.scene.actors.luzterna;
    if (c?.puppet) {
      // facing the camera in the dark: glowing amber eyes (cats see in the dark), a warm-brown body, the scarf in its
      // own colors in the shade of the backlight
      this.silC = c.silhouette({
        body: 0x261620,
        bodyTop: 0x4a2c24,
        keep: siluetaKeep(c.puppet.slug),
        keepShade: 0.4,
        eyes: 'glow',
        eyeColor: 0xffb340,
        rimRest: 1,
        detail: 0.06,
        dissolveColor: 0xffe2b0,
        halo: { color: 0xffb860, alpha: 0.3, spread: 40 },
      });
    }
    if (l?.puppet) {
      // her eyes glow in her own blue; violet body; her lantern lit; the gaps between her sparkles closed
      this.silL = l.silhouette({
        body: 0x1d1636,
        bodyTop: 0x3c2868,
        keep: siluetaKeep('luzterna'),
        keepGlow: 0.7,
        eyes: 'glow',
        eyeColor: 0x9fe6ff,
        rimRest: 1,
        detail: 0.06,
        close: 44,
        halo: { color: 0xffb860, alpha: 0.3, spread: 40 },
      });
      this.unhook = hookLantern(l, this.swing);
    }
  }

  // ---------------------------------------------------------------- the cine's handles
  drive(id: string, k: number): boolean {
    if (!(CALLE_DRIVES as readonly string[]).includes(id)) return false;
    this[id as DriveId] = k;
    return true;
  }
  driveGet(id: string): number | undefined {
    return (CALLE_DRIVES as readonly string[]).includes(id) ? this[id as DriveId] : undefined;
  }
  fx(id: string): (() => void) | void | false {
    const t = this.scene.t;
    switch (id) {
      case 'stamp':
        this.stampT = t;
        this.stampHit = false;
        return;
      case 'hairs':
        this.hairsT = t;
        return;
      case 'swing':
        this.swing.v += 3.2;
        return;
      case 'stop':
        this.stopT = t;
        this.swing.v -= 4;
        this.scene.tug = 1;
        return;
      case 'bump':
        this.bumpT = t;
        return;
      case 'thread':
        this.scene.threadT = t;
        return () => {
          this.scene.threadT = null;
        };
    }
    return false;
  }
  resolve(t: string): { x: number; y: number } | null {
    const c = this.scene.actors.canelo;
    const l = this.scene.actors.luzterna;
    switch (t) {
      case 'bufanda': {
        const r = c ? siluetaKeep(c.raw)?.[1] : null;
        return c ? (r ? c.point(r[0], r[1]) : { x: c.head().x, y: c.head().y + 120 }) : null;
      }
      case 'manga':
        return l ? l.point(LUZ_PAW[0], LUZ_PAW[1]) : null;
      case 'linterna':
        return l ? l.point(LUZ_LANTERN[0], LUZ_LANTERN[1]) : null;
      case 'pareja': {
        if (!c || !l) return null;
        const a = c.head();
        const b = l.head();
        return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      }
    }
    return null;
  }
  /** the camera's turn (L4 point of view, the drunk tilt) and the zoom that hides the corners while it turns */
  get camRot() {
    if (settings.reduceMotion) return this.pov >= 0.5 ? Math.PI : 0;
    const t = this.scene.t;
    return this.pov * Math.PI + Math.sin(t * 0.9) * 0.032 * this.bend + Math.sin(t * 1.25) * 0.02 * this.wave;
  }
  get camZoom() {
    if (settings.reduceMotion) return 1;
    return 1 + 0.42 * Math.sin(Math.PI * clamp(this.pov, 0, 1)) + 0.06 * Math.max(this.bend, this.wave);
  }

  // ---------------------------------------------------------------- per frame
  update(dt: number) {
    const sc = this.scene;
    const st = this.st;
    const t = sc.t;
    const rm = settings.reduceMotion;
    const c = sc.actors.canelo;
    const l = sc.actors.luzterna;
    if (st) {
      st.lantern = sc.luzOn > 0.01 ? sc.luzX : null;
      st.lanternK = sc.luzOn * this.luzDim;
      st.bend = rm ? 0 : this.bend;
      st.wave = rm ? this.wave * 0.25 : this.wave;
      st.rainK = this.rainK;
      st.glow = this.glow;
      st.flap = Math.max(this.flap, this.crossFlap());
      st.update(t);
    }
    // ---- Canelo
    const moving = Math.abs(sc.walkX - this.prevWalkX) > 0.3;
    this.prevWalkX = sc.walkX;
    if (c) this.actCanelo(c, moving);
    // ---- Luzterna
    if (l) this.actLuz(l, dt);
    // ---- the light treatment
    this.light(c, l, dt);
    // ---- what is drawn around them
    this.draw(c, l);
    // ---- L4's dip (reduced motion: the turn is a cut under a quick dip to dark)
    this.updateDip();
  }

  private crossFlap() {
    const k = this.scene.cross;
    if (k <= 0) return 0;
    return smooth(0.42, 0.6, k) * (1 - smooth(0.78, 1, k)) + Math.sin(k * 40) * 0.08 * smooth(0.75, 0.85, k) * (1 - smooth(0.85, 1, k));
  }

  private actCanelo(c: Toon, moving: boolean) {
    const sc = this.scene;
    const t = sc.t;
    const st = this.st;
    if (sc.roll !== null) {
      // rolling out of the door: tumbling across the wet street
      const k = clamp((t - sc.roll) / 0.9, 0, 1);
      c.position.set(lerp(CALLE.door.x, CALLE.door.x + 280, easeOut(k)), CALLE.ground);
      c.rot = (1 - easeOut(k)) * -Math.PI * 4 + sc.lying * LIE;
      c.dy = -Math.sin(k * Math.PI) * 60 - sc.lying * LIE_UP;
      c.dx = 0;
      if (k >= 1) {
        sc.roll = null;
        this.bumpT = t;
      }
    } else {
      c.position.set(sc.walkX, CALLE.ground);
      // the zigzag: he sways and drifts in depth (y) unless the leash holds him straight
      const straight = Math.max(sc.tug, sc.lying);
      const zig = Math.sin(t * 2.2) * (1 - straight) * (1 + this.bend * 0.6);
      c.rot = sc.lying * LIE + (1 - sc.lying) * (zig * 0.16 + sc.lean * 0.32);
      const floor = st ? st.waveAt(sc.walkX) * 0.9 : 0;
      c.dy = -sc.lying * LIE_UP + zig * 18 * (1 - sc.lean) + floor * (1 - sc.lying);
      c.dx = sc.lean * 40;
      // she stopped: the leash yanks him back a step
      if (this.stopT !== null) {
        const k = (t - this.stopT) / 0.6;
        if (k < 1) c.dx -= Math.sin(k * Math.PI) * 46 * (1 - k);
      }
      c.sy = 1 + 0.02 * Math.sin(t * 4.4);
      c.sx = 1;
      // V5: he crosses the flap (anticipation → hop in → squash through → gone into its light)
      const k = sc.cross;
      if (k > 0) {
        const gx = GATERA_X;
        const x0 = sc.walkX;
        const hop = smooth(0.18, 0.6, k);
        c.position.set(lerp(x0, gx, hop), CALLE.ground);
        const shrink = lerp(1, 0.52, smooth(0.2, 0.62, k));
        const crouch = smooth(0, 0.16, k) * (1 - smooth(0.16, 0.24, k));
        const stretch = smooth(0.2, 0.32, k) * (1 - smooth(0.46, 0.56, k));
        const squash = smooth(0.52, 0.6, k) * (1 - smooth(0.66, 0.78, k));
        c.sx = shrink * (1 + 0.14 * crouch - 0.16 * stretch + 0.38 * squash);
        c.sy = shrink * (1 - 0.18 * crouch + 0.22 * stretch - 0.36 * squash);
        c.dy = -Math.sin(hop * Math.PI) * 90 * (1 - smooth(0.5, 0.6, k));
        c.rot = 0;
        if (c.puppet) c.puppet.crouch = crouch;
      }
    }
    if (c.puppet) {
      c.puppet.walk = moving && sc.cross <= 0 ? 1 : 0;
      c.puppet.emote('sleepy', clamp(this.canLids, 0, 1) * 0.8);
    }
    c.alpha = 1 - (sc.cross >= 0.999 ? 1 : 0);
    c.visible = c.alpha > 0.01 && !sc.canHidden;
  }

  private actLuz(l: Toon, dt: number) {
    const sc = this.scene;
    const t = sc.t;
    const rm = settings.reduceMotion;
    const bob = Math.sin(t * 1.7) * 12;
    l.position.set(sc.luzX, CALLE.ground - 140 + bob * (1 - 0.5 * this.luzLow) + 105 * this.luzLow);
    l.alpha = sc.luzOn;
    l.flip = sc.luzFace > 0;
    // the lantern's pendulum: her own acceleration swings it, it settles slowly (a real swing on the painting)
    const vx = (sc.luzX - this.prevLuzX) / Math.max(1e-3, dt);
    this.prevLuzX = sc.luzX;
    const ax = clamp((vx - this.prevVx) / Math.max(1e-3, dt), -6000, 6000);
    this.prevVx = vx;
    const s = this.swing;
    if (dt > 0) {
      const acc = -26 * s.a - 2.2 * s.v - ax * 0.00045 * (l.flip ? -1 : 1) + Math.cos(t * 1.7) * 0.18;
      s.v += acc * dt;
      s.a = clamp(s.a + s.v * dt, -0.55, 0.55);
    }
    if (rm) s.a *= 0.4;
    // scolding: she leans in, body and head (her painting faces left: towards him)
    const lean = this.luzLean;
    if (l.puppet) {
      l.puppet.pose.lean = -0.55 * lean;
      l.puppet.pose.headDy = 9 * lean;
      l.puppet.pose.headA = -0.09 * lean;
      // she looks at him (head turned his way), or back at the bar (V5)
      l.puppet.look = lerp(-0.35, -1, Math.max(lean, sc.luzLook));
      l.puppet.emote('sleepy', clamp(this.luzLids, 0, 1) * 0.8);
    }
    const rot = -0.06 * lean;
    let sx = 1;
    let sy = 1;
    let dy = 0;
    // «DERECHO. DERECHO.»: huge, cartoon style (scaled about her head: her face stays in frame), squash & stretch
    const big = clamp(this.luzBig, 0, 1);
    const vBig = (big - this.bigPrev) / Math.max(1e-3, dt);
    this.bigPrev = big;
    const g = 1 + 1.45 * big;
    const ss = rm ? 0 : clamp(vBig * 0.08, -0.25, 0.25);
    sx = g * (1 - ss * 0.6);
    sy = g * (1 + ss);
    // her stamp: drop → hit (squash) → back up
    if (this.stampT !== null) {
      const p = t - this.stampT;
      if (p < 0.14) dy += 150 * (p / 0.14) ** 2;
      else if (p < 0.9) {
        if (!this.stampHit) {
          this.stampHit = true;
          if (this.st) {
            this.st.freeze = t;
            this.st.thunk = 1;
          }
          if (!rm) this.scene.shake(0.3);
          sc.actors.canelo?.puppet?.emote('surprise', 1);
        }
        const q = (p - 0.14) / 0.76;
        dy += 150 * (1 - easeOut(q));
        const sq = Math.exp(-q * 7) * Math.cos(q * 18);
        sx *= 1 + 0.24 * sq;
        sy *= 1 - 0.22 * sq;
      } else this.stampT = null;
    }
    // scale about her head (the inner container scales about the Toon's origin: shift it so the head stays put)
    const hl = l.puppet?.brain.headLocal();
    const ps = l.puppet?.scale.y ?? 1;
    const hx = (hl ? hl[0] * ps : 0) * (l.flip ? -1 : 1);
    const hy = hl ? hl[1] * ps : -350;
    l.sx = sx;
    l.sy = sy;
    l.rot = rot;
    l.dx = hx * (1 - sx);
    l.dy = hy * (1 - sy) + dy;
  }

  /** the rim lights and the silhouettes (silueta.ts on the real puppets) */
  private light(c: Toon | undefined, l: Toon | undefined, dt: number) {
    const sc = this.scene;
    const blue = sc.luzOn * this.luzDim;
    const gl = clamp(this.glow, 0, 1);
    // the backlight of the lit cat flap: a hot rim (white core, warm falloff), wide enough not to drown in the warm wall
    // (nominal 10: the TV outline's soft alpha eats about half, so ~5 design px show)
    const back: SiluetaLight = { dir: [0, 0], color: 0xffb35a, width: 10, alpha: gl };
    if (this.silC && c) {
      const s = this.silC;
      // her blue lantern on his side facing her
      const lp = l ? l.point(LUZ_LANTERN[0], LUZ_LANTERN[1]) : { x: c.x + 300, y: c.y - 300 };
      const hd = c.head();
      const d = Math.hypot(lp.x - hd.x, lp.y - hd.y);
      s.light = { dir: [lp.x - hd.x, lp.y - hd.y], color: TV.lantern, width: 5, alpha: blue * clamp(1.25 - d / 900, 0.25, 1) };
      s.light2 = gl > 0.01 ? back : { dir: [-0.3, -1], color: TV.amberL, width: 2.6, alpha: 0.45 };
      s.k = sc.backs;
      const gone = smooth(0.58, 1, sc.cross);
      if (gone > 0) {
        s.how = 'dissolve';
        s.out = gone;
      } else {
        s.how = 'flood';
        s.out = this.canOut;
      }
      s.update(dt);
    }
    if (this.silL && l) {
      const s = this.silL;
      s.light = { dir: [0.25, -1], color: TV.amberL, width: 3, alpha: 0.5 };
      s.light2 = gl > 0.01 ? back : null;
      s.keepGlow = 0.7 * this.luzDim;
      s.k = sc.backs;
      s.how = 'flood';
      s.out = this.luzOut;
      s.update(dt);
    }
  }

  private draw(c: Toon | undefined, l: Toon | undefined) {
    const sc = this.scene;
    const t = sc.t;
    const g = this.front;
    const bg = this.behind;
    g.clear();
    bg.clear();
    this.add.clear();
    // her lantern light is BLUE: a soft halo behind her on the wall and the street (it dips with luzDim)
    if (l && sc.luzOn > 0.01) {
      const lp = l.point(LUZ_LANTERN[0], LUZ_LANTERN[1]);
      const k = sc.luzOn * this.luzDim * (0.94 + 0.06 * Math.sin(t * 7.3) * Math.sin(t * 2.1));
      const R = 1 + 0.6 * clamp(this.luzBig, 0, 1);
      bg.circle(lp.x, lp.y, 330 * R).fill({ color: TV.lantern, alpha: 0.09 * k });
      bg.circle(lp.x, lp.y, 190 * R).fill({ color: TV.lantern, alpha: 0.13 * k });
      bg.circle(lp.x, lp.y, 90 * R).fill({ color: 0xdff6ff, alpha: 0.12 * k });
      bg.ellipse(lp.x, CALLE.ground + 40, 280, 42).fill({ color: TV.lantern, alpha: 0.18 * k });
    }
    // the leash: two fingers hold his scarf (taut when she tugs, slack otherwise)
    if (sc.leash > 0.01 && c && l && sc.backs < 0.5 && sc.cross <= 0) {
      const a = this.scarf(c);
      const b = l.point(LUZ_PAW[0], LUZ_PAW[1]);
      const sag = 70 * (1 - sc.tug);
      const mx = (a.x + b.x) / 2;
      const my = Math.max(a.y, b.y) + sag;
      const la = sc.leash * (1 - clamp(this.luzBig * 2, 0, 1));
      g.moveTo(a.x, a.y).quadraticCurveTo(mx, my, b.x, b.y).stroke({ width: 10, color: TV.line, alpha: la });
      g.moveTo(a.x, a.y).quadraticCurveTo(mx, my, b.x, b.y).stroke({ width: 6, color: 0xc8622e, alpha: la });
    }
    // the tail flame: lit, in color, over his silhouette (V1–V5; on the walk it read as a third ear)
    const fk = sc.flame * smooth(0.05, 0.6, sc.backs) * (1 - smooth(0.85, 1, sc.cross));
    if (c && c.visible && fk > 0.01) {
      const r = catRig(c.raw);
      const tip = r?.tail?.pts?.[r.tail.pts.length - 1];
      if (tip) {
        const p = c.point(tip[0], tip[1]);
        const fs = fk * Math.min(Math.abs(c.sx), Math.abs(c.sy));
        // a soft glow (many faint rings, additive): no hard disc
        for (let i = 0; i < 7; i++) this.add.circle(p.x, p.y - 30 * fs, (20 + i * 8) * fs).fill({ color: 0xff9a40, alpha: 0.045 });
        flame(g, p.x, p.y + 6, fs, t);
      }
    }
    // L5: «Dejaste pelo en TRES cajas»: three orange hairs held up between two fingers
    if (this.hairsT !== null && l) {
      const k = t - this.hairsT;
      if (k > 2.8) this.hairsT = null;
      else {
        const p = l.point(LUZ_PAW[0], LUZ_PAW[1]);
        const pop = easeOut(k / 0.25) * (1 - smooth(2.4, 2.8, k));
        for (let i = 0; i < 3; i++) {
          // fanned up and AWAY from her face (her raised paw is on her right; mirrored when she faces right)
          const a = l.flip ? -Math.PI / 2 - 0.55 + (i - 1) * 0.42 + Math.sin(t * 6 + i) * 0.06 : -Math.PI / 2 + 0.55 + (i - 1) * 0.42 + Math.sin(t * 6 + i) * 0.06;
          const L = 120 * pop;
          const x1 = p.x + Math.cos(a) * L;
          const y1 = p.y - 12 + Math.sin(a) * L;
          const cx = p.x + Math.cos(a + 0.5) * L * 0.6;
          const cy = p.y - 12 + Math.sin(a + 0.5) * L * 0.6;
          g.moveTo(p.x, p.y - 12).quadraticCurveTo(cx, cy, x1, y1).stroke({ width: 13, color: TV.line, cap: 'round' });
          g.moveTo(p.x, p.y - 12).quadraticCurveTo(cx, cy, x1, y1).stroke({ width: 7, color: 0xf08a3a, cap: 'round' });
        }
      }
    }
    // the stamp: a flat ring and dust where she hit the ground
    if (this.stampT !== null && l && this.stampHit) {
      const k = (t - this.stampT - 0.14) / 0.6;
      if (k > 0 && k < 1) {
        const r = lerp(60, 520, easeOut(k));
        g.ellipse(l.x, CALLE.ground + 10, r, r * 0.12).stroke({ width: 8 * (1 - k), color: TV.cream, alpha: 1 - k });
        for (let i = 0; i < 6; i++) {
          const s = i % 2 ? 1 : -1;
          const x = l.x + s * (80 + i * 30 + k * 160);
          g.moveTo(x, CALLE.ground - 6).lineTo(x + s * 50, CALLE.ground - 40 - i * 6).stroke({ width: 6, color: TV.cream, alpha: (1 - k) * 0.9 });
        }
      }
    }
    // V5: he comes apart into warm light motes that fly into the flap (never static: that is REGISTRO 000's)
    if (sc.cross > 0.55 && this.motesT === null) this.motesT = t;
    if (sc.cross < 0.1) this.motesT = null;
    if (this.motesT !== null && c) {
      const e = t - this.motesT;
      const gx = GATERA_X;
      const gy = CALLE.ground - 150;
      const sx = Math.abs(c.sx) || 1;
      for (let i = 0; i < 46; i++) {
        const born = rnd(i) * 0.9;
        const q = (e - born) / (0.55 + 0.35 * rnd(i + 7));
        if (q <= 0 || q >= 1) continue;
        const x0 = c.x + (rnd(i + 3) * 2 - 1) * 120 * sx;
        const y0 = CALLE.ground - (0.1 + rnd(i + 5) * 0.8) * 330 * sx;
        const k = q * q * (3 - 2 * q);
        const x = lerp(x0, gx + (rnd(i + 11) - 0.5) * 60, k) + Math.sin(q * Math.PI * 2 + i) * 18 * (1 - q);
        const y = lerp(y0, gy + (rnd(i + 13) - 0.5) * 80, k) - Math.sin(q * Math.PI) * 60;
        const a = Math.sin(q * Math.PI);
        const r = (4 + rnd(i + 17) * 7) * (1 - 0.5 * q);
        const col = i % 3 ? 0xffc46a : 0xfff0d0;
        this.add.circle(x, y, r * 2.4).fill({ color: col, alpha: 0.18 * a });
        this.add.circle(x, y, r).fill({ color: col, alpha: 0.85 * a });
      }
    }
    // after the roll: little stars around his head
    if (this.bumpT !== null && c) {
      const k = (t - this.bumpT) / 1.6;
      if (k >= 1) this.bumpT = null;
      else {
        const h = c.head();
        for (let i = 0; i < 3; i++) {
          const a = t * 4 + (i * Math.PI * 2) / 3;
          const x = h.x + Math.cos(a) * 90;
          const y = h.y + 40 + Math.sin(a) * 26;
          star(g, x, y, 16 * (1 - k * 0.6), TV.amberL);
        }
      }
    }
    // V4: a loose orange thread of his scarf — she pinches it, it snaps off, she winds it and keeps it in her sleeve
    if (sc.threadT !== null && c && l) {
      const k = (t - sc.threadT) / 2.6;
      if (k <= 1) {
        const a = this.scarf(c, 1);
        const paw = l.point(LUZ_PAW[0], LUZ_PAW[1]);
        const reach = smooth(0, 0.3, k);
        const snap = smooth(0.38, 0.42, k);
        const wind = smooth(0.45, 0.85, k);
        const from = snap > 0.5 ? { x: lerp(a.x, paw.x, wind), y: lerp(a.y, paw.y, wind) } : a;
        const to = { x: lerp(a.x, paw.x, reach), y: lerp(a.y, paw.y, reach) };
        const sag = (1 - smooth(0.25, 0.38, k)) * 50 + snap * (1 - wind) * 30;
        const alive = 1 - smooth(0.85, 0.95, k);
        if (alive > 0.01) {
          const mx = (from.x + to.x) / 2;
          const my = Math.max(from.y, to.y) + sag;
          g.moveTo(from.x, from.y).quadraticCurveTo(mx, my, to.x, to.y).stroke({ width: 8, color: TV.line, alpha: alive, cap: 'round' });
          g.moveTo(from.x, from.y).quadraticCurveTo(mx, my, to.x, to.y).stroke({ width: 4, color: 0xff8a2a, alpha: alive, cap: 'round' });
          // wound round her finger
          if (wind > 0) for (let i = 0; i < 3; i++) g.circle(paw.x, paw.y - 6, 8 + i * 5 * wind).stroke({ width: 3, color: 0xff8a2a, alpha: alive * wind });
        }
        // the snap: a tiny spark at the scarf
        if (k > 0.38 && k < 0.5) star(g, a.x, a.y, 22 * (1 - (k - 0.38) / 0.12), TV.cream);
        // tucked into the sleeve: a glint
        if (k > 0.86) star(g, paw.x + 14, paw.y - 20, 18 * Math.sin(((k - 0.86) / 0.14) * Math.PI), 0xffd9a0);
      }
    }
  }

  /** a point of his scarf (0 = the band at the neck, 1 = the end that hangs) in world space */
  private scarf(c: Toon, which = 0) {
    const r = siluetaKeep(c.raw);
    // the presets list the hanging end first, then the band
    const reg = r?.[which === 0 ? 1 : 0] ?? r?.[0];
    if (!reg) {
      const h = c.head();
      return { x: h.x + 10, y: h.y + 80 };
    }
    return c.point(reg[0], reg[1] + (which === 1 ? reg[3] * 0.7 : 0));
  }

  private updateDip() {
    const rm = settings.reduceMotion;
    const k = clamp(1 - Math.abs(this.pov - 0.5) * 4, 0, 1) * (this.pov > 0.001 && this.pov < 0.999 ? 1 : 0);
    if (!rm || k <= 0.001) {
      if (this.dip) this.dip.visible = false;
      return;
    }
    if (!this.dip) {
      this.dip = new Graphics();
      this.scene.screenL.addChild(this.dip);
    }
    const v = game.view;
    this.dip.clear().rect(v.x, v.y, v.w, v.h).fill({ color: TV.line, alpha: k });
    this.dip.visible = true;
  }

  destroy() {
    this.unhook?.();
    this.silC?.destroy();
    this.silL?.destroy();
    this.silC = null;
    this.silL = null;
    this.dip?.destroy();
    if (!this.behind.destroyed) this.behind.destroy();
    if (!this.front.destroyed) this.front.destroy();
    if (!this.add.destroyed) this.add.destroy();
  }
}

/** a little teardrop flame, base at (x, y), flickering */
function flame(g: Graphics, x: number, y: number, s: number, t: number) {
  const k = s * (0.9 + 0.1 * Math.sin(t * 13) * Math.sin(t * 5.3));
  const w = 24 * k;
  const h = 78 * k;
  const sway = Math.sin(t * 7.1) * 7 * k;
  const drop = (ww: number, hh: number, col: number, line: boolean) => {
    g.moveTo(x, y)
      .bezierCurveTo(x - ww * 1.25, y - hh * 0.12, x - ww * 0.55 + sway * 0.4, y - hh * 0.62, x + sway, y - hh)
      .bezierCurveTo(x + ww * 0.55 + sway * 0.4, y - hh * 0.62, x + ww * 1.25, y - hh * 0.12, x, y)
      .fill(col);
    if (line) g.stroke({ width: 4, color: TV.line });
  };
  drop(w, h, 0xff7a1a, true);
  drop(w * 0.55, h * 0.6, 0xffd36a, false);
}

const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function star(g: Graphics, x: number, y: number, r: number, color: number) {
  if (r <= 0.5) return;
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.poly(pts).fill(color).stroke({ width: LW * 0.5, color: TV.line });
}

/**
 * The lantern swings for real: after the puppet's own deformation (12 fps, on twos), the vertices of the painting's
 * lantern (the rig float nearest LUZ_LANTERN) turn around the handle where her paw holds it, by the pendulum's angle.
 * Returns the unhook.
 */
function hookLantern(l: Toon, swing: { a: number }) {
  const p = l.puppet;
  const m = p?.brain.model;
  if (!p || !m) return null;
  const fl = m.rig.floats;
  let idx = -1;
  let best = Infinity;
  fl.forEach(([x, y], i) => {
    const d = Math.hypot(x - LUZ_LANTERN[0], y - LUZ_LANTERN[1]);
    if (d < best) {
      best = d;
      idx = i;
    }
  });
  if (idx < 0 || best > 80) return null;
  const brain = p.brain;
  const orig = brain.deform.bind(brain);
  const ax = () => brain.anchor.x * m.W;
  const ay = () => brain.anchor.y * m.H;
  brain.deform = () => {
    orig();
    const a = swing.a;
    if (Math.abs(a) < 1e-4) return;
    const px = LUZ_HANDLE[0] - ax();
    const py = LUZ_HANDLE[1] - ay();
    const pos = brain.pos;
    for (let v = 0; v < m.n; v++) {
      if (m.floatI[v] !== idx) continue;
      const w = m.floatW[v];
      if (w <= 0) continue;
      const ang = a * w;
      const cs = Math.cos(ang);
      const sn = Math.sin(ang);
      const dx = pos[v * 2] - px;
      const dy = pos[v * 2 + 1] - py;
      pos[v * 2] = px + dx * cs - dy * sn;
      pos[v * 2 + 1] = py + dx * sn + dy * cs;
    }
  };
  return () => {
    brain.deform = orig;
  };
}
