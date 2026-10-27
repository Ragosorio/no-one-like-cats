/**
 * LA ÚLTIMA RONDA — the bar's polish pass, as a DIRECTOR that rides on CajaScene (docs/part-iii/13 §3.2, §3.4).
 * CajaScene only hooks it (attach on every set, update every frame, and fx/drive/resolve it doesn't know): the logic of
 * the pass lives here, so the shared scene file stays small and the alley (agent LUZ) stays untouched.
 *
 *  - ACTING. Canelo acts with his whole body (Toon squash/stretch/rotation + the puppet's pose layer + emotes) and with
 *    PAWS drawn in his colors (barKit.ts): he hugs the mug, gesticulates, rears up offended, draws in the foam, pats
 *    the napkin, counts with his claws, tucks the eraser into his scarf, pulls the scarf over his eyes. Espuma polishes
 *    faster, rolls her eyes, glides over with the pencil from her bun. `fx: { id: 'act', who, kind }`.
 *  - THE CROSS. The flap's light cover that the island's p3_pelo hands over (armCruce), the flat TV bands that wipe it
 *    away (`cruce`), the neon that buzzes on (`neon`), the trail of orange hairs to the door (`pelos`).
 *  - SCENE A. The honest clue (`ronquido`: the second mug's foam bubbles to a snore, never right of BAR.hideX), the
 *    front page (`portada`), the little door in the foam (`ins:espuma`, `gateraDibuja`, `gateraAbre`).
 *  - SCENE B. The counter becomes the diagram (`ins:barra` + its objects), the window's days and nights (`dianoche`),
 *    the TV with two identical fish (`tele2`), the board (`borrador`, `gis`, `rayas`), the PISAPAPELES placard, the
 *    blue beam (`haz`), the scarf (`bufanda`).
 *
 * THE LISTENER RULE holds here too: before the reveal nothing is drawn right of BAR.hideX (every world x below is left of
 * it; tests/p3BarPulido.test.ts checks the constants). «Reducir movimiento»: fades instead of shakes, spins and wipes.
 * Performance: every Text and Container is built once per set; per frame only a few Graphics are redrawn.
 */
import { Container, Graphics } from 'pixi.js';
import { catRig } from '../../art/puppetCore';
import type { CineCtx, FxCmd, Target } from '../../cine/types';
import { game } from '../../core/App';
import { sfx } from '../../core/audio';
import { settings } from '../../core/settings';
import { BAR, CALLE, tvText } from '../../momentos/songs/drunck/bar';
import { BAR_PULIDO as P } from '../../momentos/songs/drunck/layout';
import { LW, TV } from '../../momentos/songs/drunck/tv';
import type { CajaScene } from '../CajaScene';
import { CALICO, SCARF, arm, fogEraser, mix, napkin, paw, pencil, rollMark, speedLines, star, tally, zzz } from './barKit';
import { CounterInsert, CrossingInsert, FoamInsert, FrontInsert, type CounterState } from './barInsertos';
import { PATRON, PatronGag } from './barCliente';

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const out3 = (k: number) => 1 - (1 - clamp(k, 0, 1)) ** 3;
const in2 = (k: number) => clamp(k, 0, 1) ** 2;
const smooth = (k: number) => {
  const x = clamp(k, 0, 1);
  return x * x * (3 - 2 * x);
};
/** an envelope: up over `a` s, held, down over the last `b` s of `dur` */
const env = (u: number, dur: number, a = 0.15, b = 0.2) => (u < 0 || u > dur ? 0 : Math.min(1, smooth(u / a), smooth((dur - u) / b)));
const bump = (t: number, a: number, b: number, r = 0.3) => {
  if (t <= a || t >= b) return 0;
  const k = (t - a) / (b - a);
  return Math.min(1, k / r, (1 - k) / r);
};

/** the one-shot flourishes this director answers (CajaStage asks here first; none collides with the alley's) */
export const BAR_FX = new Set(['act', 'cruce', 'neon', 'portada', 'gateraDibuja', 'gateraAbre', 'latigo', 'palmea', 'azucar', 'blanco', 'catsup', 'rojo', 'manos', 'capi', 'capiEscribe', 'lapiz', 'dianoche', 'borrador', 'guarda', 'gis', 'rayas', 'limpia']);

// ------------------------------------------------------------------ the cross is armed by the flow (H66 for real)
let armedAt = -1;
/** the next CajaScene (made within 3 s) starts under the flap's light (the island's p3_pelo left the screen that color) */
export function armCruce() {
  armedAt = performance.now();
}

type Who = 'canelo' | 'espuma';
interface Move {
  who: Who;
  kind: string;
  t0: number;
  dur: number;
}
/** what a move adds to a body this frame */
interface Pose {
  rot: number;
  dx: number;
  dy: number;
  sx: number;
  sy: number;
  lean: number;
  crouch: number;
  headDy: number;
  headA: number;
  look: number;
  x: number;
}
const ZERO: Pose = { rot: 0, dx: 0, dy: 0, sx: 1, sy: 1, lean: 0, crouch: 0, headDy: 0, headA: 0, look: 0, x: 0 };

/** the moves' default lengths (s) */
const MOVE_DUR: Record<string, number> = {
  abrazo: 2.2,
  gesto: 1.6,
  inclina: 2.4,
  ofendido: 1.5,
  desinfla: 2.2,
  espuma: 2.0,
  atrapa: 0.9,
  aplana: 1.4,
  cabecea: 1.5,
  orgulloso: 2.2,
  serio: 3,
  risa: 1.8,
  encoge: 0.9,
  mira: 3.2,
  garras: 2.6,
  guarda: 1.3,
  tic: 0.9,
  sorbo: 1.2,
  pule: 2.0,
  ojos: 1.3,
  lapiz: 1.6,
  vuelve: 1.0,
};

export class BarDirector {
  // ---- per set (rebuilt by attach; destroyed with the set's root)
  private winG = new Graphics();
  private winMask = new Graphics();
  private boardG = new Graphics();
  private tvG = new Graphics();
  private top = new Graphics();
  private fxG = new Graphics();
  private placa: Container | null = null;
  private trail = new Graphics();
  private neon: Container | null = null;
  private neonGlow = new Graphics();
  // ---- screen (over the world, under the inserts)
  private scr = new Graphics();
  // ---- inserts (screen; built once)
  private cross: CrossingInsert | null = null;
  private foam: FoamInsert | null = null;
  private front: FrontInsert | null = null;
  private counter: CounterInsert | null = null;
  // ---- acting
  private moves: Move[] = [];
  // ---- drives (0..1)
  neonDark = 0;
  pelos = 0;
  ronquido = 0;
  servilleta = 0;
  pata = 0;
  insEspuma = 0;
  insBarra = 0;
  tumbado = 0;
  placaK = 0;
  haz = 0;
  bufanda = 0;
  tele2 = 0;
  espumaX = 0;
  // ---- one-shots (scene time they started; null = not yet)
  private neonT: number | null = null;
  private dianocheT: number | null = null;
  private borradorT: number | null = null;
  private guardaT: number | null = null;
  private gisT: number | null = null;
  private rayasT: number | null = null;
  private latigoT: number | null = null;
  private latigoDir = 1;
  /** the board is drawn by us from the first board effect on (the original 14 marks are then redrawn here) */
  private boardOwned = false;
  /** the counter insert's state */
  private cs: CounterState = { t: 0, pawOn: 0, patT: null, cubeT: null, whiteT: null, ketchupT: null, redT: null, handsT: null, capiT: null, capi: 'none', writeT: null, asleep: 0, pencilT: null, gentle: false };

  constructor(private readonly sc: CajaScene) {
    this.sc.screenL.addChild(this.scr);
    if (armedAt >= 0 && performance.now() - armedAt < 3000) {
      armedAt = -1;
      // the flap's light, held until the bands wipe it (the island faded to this exact color)
      this.cross = new CrossingInsert(this.gentle);
      this.sc.screenL.addChild(this.cross.root);
      this.crossWait = 0;
    }
  }
  /** seconds the held cover has waited since the scene got ready (a cine that never comes can't leave it on) */
  private crossWait = 0;
  /** the extra paintings the pass needs through the TV lens (CajaScene.enter loads them with the house cats) */
  extraTv(): string[] {
    return [PATRON];
  }
  /** A1: the patron thrown out (caja/barCliente.ts) */
  private patron: PatronGag | null = null;
  /** A1: throw the patron out of the door */
  eject() {
    const s = this.sc.streetSet;
    if (!s) return;
    this.patron?.destroy();
    this.patron = null;
    if (!this.sc.studioTv.has(PATRON)) return;
    const g = new PatronGag(this.sc.studioTv, this.sc.t, settings.reduceMotion);
    if (!g.alive) return g.destroy();
    this.patron = g;
    s.cast.addChild(g.root);
    sfx('hit', 0.8);
    window.setTimeout(() => this.sc.isAlive && sfx('boom', 1.6), 600);
  }
  get gentle() {
    return settings.reduceMotion || settings.reduceFlashes;
  }

  // ================================================================ sets
  /** the scene built a set: hang our layers on it */
  attach(set: 'bar' | 'calle') {
    this.moves = [];
    this.patron = null;
    this.placa = null;
    this.neon = null;
    if (set === 'bar') this.attachBar();
    else this.attachStreet();
    // a held cover never outlives the alley: if the cine went straight inside (skipped), wipe it now
    if (set === 'bar' && this.cross && !this.cross.wiping) this.cross.wipe();
  }
  private attachBar() {
    const b = this.sc.barSet;
    if (!b) return;
    // the window: days and nights, the blue beam (masked to the glass, under the neon mug)
    this.winG = new Graphics();
    this.winMask = new Graphics().rect(P.win.x0, P.win.y0, P.win.x1 - P.win.x0, P.win.y1 - P.win.y0).fill(0xffffff);
    this.winG.mask = this.winMask;
    let i = -1;
    b.back.children.forEach((c, j) => {
      if (c.mask) i = j;
    });
    b.back.addChildAt(this.winMask, i + 1);
    b.back.addChildAt(this.winG, i + 2);
    // the board's face and the TV screen (over the set's own)
    this.boardG = new Graphics();
    this.tvG = new Graphics();
    b.back.addChild(this.boardG, this.tvG);
    // on the counter (over the counter top): the napkin, the paws, the clue, the placard
    this.top = new Graphics();
    b.front.addChild(this.top);
    this.placa = this.buildPlaca();
    b.front.addChild(this.placa);
    this.fxG = new Graphics();
    b.fx.addChild(this.fxG);
    this.boardOwned = false;
    // the inserts (screen): built once, kept across sets
    const raw = this.sc.actors.canelo?.raw;
    if (!this.foam) {
      this.foam = new FoamInsert(this.gentle);
      this.foam.root.visible = false;
      this.sc.screenL.addChild(this.foam.root);
    }
    if (!this.front) {
      this.front = new FrontInsert(raw ? this.sc.studioTv.still(raw, 0.5, 0.5) : null, this.gentle);
      this.sc.screenL.addChild(this.front.root);
    }
    if (!this.counter) {
      this.counter = new CounterInsert();
      this.sc.screenL.addChild(this.counter.root);
    }
    // the crossing's cover stays on top of everything
    if (this.cross) this.sc.screenL.addChild(this.cross.root);
  }
  private attachStreet() {
    const s = this.sc.streetSet;
    this.patron = null;
    if (!s) return;
    this.trail = new Graphics();
    s.front.addChild(this.trail);
    // the neon OFF: a dark copy of the sign over the real one (the real one shows through when it buzzes on)
    const n = new Container();
    const plate = new Graphics();
    plate.roundRect(170, 196, 700, 150, 6).fill(0x2a1838).stroke({ width: LW, color: TV.line });
    const txt = tvText('LA ÚLTIMA RONDA', 84, 0x4a2a44, { stroke: 0x2a1838, strokeW: 10, spacing: 4 });
    txt.anchor.set(0, 0.5);
    txt.position.set(205, 272);
    n.addChild(plate, txt);
    n.alpha = 0;
    this.neonGlow = new Graphics();
    s.back.addChild(this.neonGlow, n);
    this.neon = n;
    this.neonDark = 0;
    this.neonT = null;
    this.pelos = 0;
  }
  private buildPlaca() {
    const c = new Container();
    const g = new Graphics();
    // a little museum label on a stand: «PISAPAPELES»
    g.rect(-6, -10, 12, 60).fill(TV.chrome).stroke({ width: 4, color: TV.line });
    g.roundRect(-150, -96, 300, 92, 10).fill(TV.cream).stroke({ width: LW, color: TV.line });
    g.roundRect(-140, -86, 280, 72, 6).stroke({ width: 3, color: TV.amberD });
    const t = tvText('PISAPAPELES', 46, TV.line, { font: 'Anton', stroke: TV.cream, strokeW: 2, spacing: 3 });
    t.position.set(0, -50);
    c.addChild(g, t);
    c.position.set(P.placa.x, P.placa.y);
    c.visible = false;
    return c;
  }

  // ================================================================ per frame
  update(dt: number) {
    const sc = this.sc;
    const t = sc.t;
    // ---- the cross (screen)
    if (this.cross) {
      // a cover nobody wipes (the cine never came) goes by itself after a while
      if (!this.cross.wiping && sc.ready && (this.crossWait += dt) > 4) this.cross.wipe();
      if (this.cross.done) {
        this.cross.destroy();
        this.cross = null;
      }
    }
    this.scr.clear();
    if (this.latigoT !== null) {
      const k = (t - this.latigoT) / 0.32;
      if (k < 1) {
        const v = game.view;
        speedLines(this.scr, v.x, v.y, v.w, v.h, this.latigoDir > 0 ? Math.PI : 0, 1 - k, 3);
      } else this.latigoT = null;
    }
    if (sc.set === 'bar' && sc.barSet) this.updateBar(t, dt);
    if (sc.set === 'calle' && sc.streetSet) this.updateStreet(t);
    this.updateInserts(t);
  }

  // ---------------------------------------------------------------- the alley: the neon, the hairs
  private updateStreet(t: number) {
    // the neon: dark until it buzzes on (a TV flicker: on, off, on-on, off, ON)
    let dark = this.neonDark;
    const gl = this.neonGlow;
    gl.clear();
    if (this.neonT !== null) {
      const k = t - this.neonT;
      const pat = [0.0, 0.07, 0.16, 0.22, 0.4, 0.46, 0.62];
      let on = 0;
      for (let i = 0; i < pat.length; i++) if (k >= pat[i]) on = i % 2 ? 0 : 1;
      if (k > 0.62) on = 1;
      if (this.gentle) on = clamp(k / 0.5, 0, 1);
      dark = 1 - on;
      // the glow burst when it catches
      const burst = this.gentle ? 0 : bump(k, 0.6, 1.4, 0.15);
      if (on > 0.5) {
        gl.roundRect(150, 176, 740, 190, 30).fill({ color: TV.neonPink, alpha: 0.12 + 0.25 * burst });
        gl.ellipse(520, 272, 520 + 120 * burst, 140 + 50 * burst).fill({ color: TV.neonPink, alpha: 0.08 + 0.12 * burst });
      }
      if (k > 1.4) {
        this.neonT = null;
        this.neonDark = 0;
        dark = 0;
      }
    }
    if (this.neon) this.neon.alpha = clamp(dark, 0, 1);
    // A1: the patron's gag (it opens and closes the door)
    if (this.patron) {
      const door = this.patron.update(t);
      const st = this.sc.streetSet;
      if (door === null) {
        this.patron.destroy();
        this.patron = null;
        if (st) st.door = 0;
      } else if (st) st.door = door;
    }
    // the hairs: a row of orange hairs on the wet street, from the far end to the door; a glint runs along them
    const g = this.trail;
    g.clear();
    if (this.pelos > 0.01) {
      const N = P.pelos.n;
      for (let i = 0; i < N; i++) {
        const q = i / (N - 1);
        // q = 0 at the door … 1 at the far end; revealed from the far end
        if (1 - q > this.pelos + 0.02) continue;
        const x = lerp(P.pelos.x0, P.pelos.x1, q) + Math.sin(i * 2.3) * 40;
        const y = CALLE.ground + 40 + Math.sin(i * 1.7) * 26 + (i % 3) * 10;
        const a = Math.sin(i * 4.1) * 0.9;
        const s = 2 + (i % 2) * 0.5;
        const c = Math.cos(a);
        const sn = Math.sin(a);
        const P0 = (lx: number, ly: number): [number, number] => [x + lx * c - ly * sn, y + lx * sn + ly * c];
        const [ax, ay] = P0(-18 * s, 0);
        const [b1x, b1y] = P0(-8 * s, -12 * s);
        const [b2x, b2y] = P0(6 * s, 12 * s);
        const [ex, ey] = P0(18 * s, -4 * s);
        g.moveTo(ax, ay).bezierCurveTo(b1x, b1y, b2x, b2y, ex, ey).stroke({ width: 10, color: TV.line, cap: 'round' });
        g.moveTo(ax, ay).bezierCurveTo(b1x, b1y, b2x, b2y, ex, ey).stroke({ width: 5, color: 0xff8a2a, cap: 'round' });
        // its reflection on the wet street
        g.moveTo(ax, ay + 16).lineTo(ex, ey + 16).stroke({ width: 3, color: 0xff8a2a, alpha: 0.25, cap: 'round' });
        // the glint that runs toward the door (every 1.6 s)
        const gq = 1 - ((t / 1.6) % 1);
        const near = 1 - Math.abs(gq - q) * N * 0.5;
        if (near > 0) star(g, x + 4, y - 14, 26 * near, 0xfff2c0, near);
      }
    }
  }

  // ---------------------------------------------------------------- the bar
  private updateBar(t: number, dt: number) {
    const sc = this.sc;
    const c = sc.actors.canelo;
    const e = sc.actors.espuma;
    // ---- acting: sum the moves of each body (on top of the scene's own breathing, written before us)
    this.moves = this.moves.filter((m) => t - m.t0 < m.dur + 0.05);
    const pc = this.poseOf('canelo', t);
    const pe = this.poseOf('espuma', t);
    if (c && sc.leave <= 0) {
      // lying on the napkin (he sleeps on «the page»; the PISAPAPELES)
      const L = this.tumbado;
      const br = Math.sin(t * 2.2);
      // his chin comes down to rest on the counter's edge (he stays above it: the counter would hide him)
      pc.dy += L * 105 + L * br * 4;
      pc.sy *= 1 - L * 0.14 + L * br * 0.012;
      pc.sx *= 1 + L * 0.1;
      pc.rot += L * -0.06;
      pc.dx += L * -40;
      pc.headDy += L * 14;
      c.rot += pc.rot;
      c.dx = pc.dx;
      c.dy += pc.dy;
      c.sx *= pc.sx;
      c.sy *= pc.sy;
      const pz = c.puppet?.pose;
      if (pz) {
        pz.lean = pc.lean;
        pz.crouch = pc.crouch;
        pz.headDy = pc.headDy;
        pz.headA = pc.headA;
        pz.look = pc.look;
      }
      if (c.puppet) c.puppet.sleeping = L > 0.6;
    }
    if (e) {
      e.rot += pe.rot;
      e.dy += pe.dy;
      e.sx = pe.sx;
      e.sy = pe.sy;
      // she glides along the counter to Canelo (and back): a hop on the way
      const k = this.espumaX;
      e.x = lerp(BAR.espuma.x, P.espumaTo, smooth(k)) + pe.x;
      if (k > 0.02 && k < 0.98) e.dy -= Math.abs(Math.sin(k * Math.PI * 3)) * 26;
      const pz = e.puppet?.pose;
      if (pz) {
        pz.headA = pe.headA;
        pz.headDy = pe.headDy;
        pz.look = pe.look;
      }
    }
    // ---- the window, the board, the TV
    this.drawWindow(t);
    this.drawBoard(t);
    this.drawTv(t);
    // ---- the counter: the napkin, the clue, the paws
    const g = this.top;
    g.clear();
    const f = this.fxG;
    f.clear();
    if (this.servilleta > 0.01) {
      const k = this.servilleta;
      const dy = (1 - out3(k)) * -60;
      napkin(g, P.napkin.map((v, i) => (i % 2 ? v + dy : v)), { alpha: clamp(k * 2, 0, 1) });
    }
    this.drawClue(g, t);
    if (c) this.drawPaws(g, f, t);
    if (e) this.drawEspuma(g, f, t);
    // ---- the placard (it pops up on its stand)
    if (this.placa) {
      const k = this.placaK;
      this.placa.visible = k > 0.01;
      const s = k < 1 ? out3(k) * (1 + 0.25 * Math.sin(k * Math.PI)) : 1;
      this.placa.scale.set(s, s * (1 + 0.03 * Math.sin(t * 6) * k));
      this.placa.rotation = 0.04 * Math.sin(t * 2.4) * k;
    }
    // ---- the scarf over his eyes
    if (c && this.bufanda > 0.01) this.drawScarf(f, t);
    // ---- the eraser flying to his scarf (B8b)
    if (this.guardaT !== null && c) {
      const k = (t - this.guardaT) / 1.0;
      if (k < 1) {
        const hd = c.head();
        const from = { x: P.board.x0 + 230, y: P.board.y0 + 60 };
        const to = { x: hd.x - 20, y: hd.y + 120 };
        const q = out3(k);
        const x = lerp(from.x, to.x, q);
        const y = lerp(from.y, to.y, q) - Math.sin(q * Math.PI) * 220;
        fogEraser(f, x, y, 60 * (1 - in2((k - 0.75) / 0.25)), 1);
      } else this.guardaT = null;
    }
  }

  /** the honest clue (13 §3.2): the second mug's foam bubbles to the rhythm of a snore. Left of hideX, always */
  private drawClue(g: Graphics, t: number) {
    const k = this.ronquido * this.sc.mug2;
    if (k <= 0.01) return;
    const m = BAR.tarro2;
    const cx = m.x + m.w / 2;
    const top = m.y - 10 + (1 - this.sc.mug2Foam) * 40;
    // one snore = 2.8 s: breathe in (the foam swells), breathe out (bubbles rise and pop)
    const ph = (t % 2.8) / 2.8;
    const swell = ph < 0.55 ? smooth(ph / 0.55) : 1 - smooth((ph - 0.55) / 0.2);
    g.ellipse(cx, top + 6, (m.w * 0.42 + 8 * swell) * k, (10 + 9 * swell) * k).fill(TV.foam).stroke({ width: LW * 0.6, color: TV.line });
    if (ph > 0.55) {
      const q = (ph - 0.55) / 0.45;
      for (let i = 0; i < 3; i++) {
        const qq = clamp(q * 1.6 - i * 0.22, 0, 1);
        if (qq <= 0 || qq >= 1) continue;
        const bx = cx - 22 + i * 22 + Math.sin(qq * 9 + i) * 4;
        const by = top - 6 - qq * 46;
        const r = (5 + i * 2) * k;
        if (qq < 0.85) g.circle(bx, by, r).fill({ color: TV.foam, alpha: 0.95 }).stroke({ width: 3, color: TV.line });
        else for (let j = 0; j < 5; j++) g.moveTo(bx + Math.cos(j * 1.26) * r, by + Math.sin(j * 1.26) * r).lineTo(bx + Math.cos(j * 1.26) * r * 1.8, by + Math.sin(j * 1.26) * r * 1.8).stroke({ width: 2.5, color: TV.cream });
      }
    }
  }

  /** Canelo's drawn paws, by move (world, over the counter) */
  private drawPaws(g: Graphics, f: Graphics, t: number) {
    const c = this.sc.actors.canelo!;
    const hd = c.head();
    // his elbows rest on the counter (his painted paws are below its edge): the forearms come up from there
    const lift = c.dy;
    const sh1 = { x: hd.x - 70, y: BAR.counterBack + 22 + Math.max(0, lift) * 0.2 };
    const sh2 = { x: hd.x + 70, y: BAR.counterBack + 26 + Math.max(0, lift) * 0.2 };
    const S = (c.size / 520) * 1.15;
    for (const m of this.moves) {
      if (m.who !== 'canelo') continue;
      const u = t - m.t0;
      const k = env(u, m.dur, 0.18, 0.22);
      if (k <= 0.01) continue;
      const tm = BAR.tarro;
      switch (m.kind) {
        case 'abrazo': {
          // both paws around his mug, squeezing (a nuzzle)
          const sq = Math.sin(u * 7) * 6;
          const p1 = { x: lerp(sh1.x, tm.x + 6, k), y: lerp(sh1.y, tm.y + 62 + sq, k) };
          const p2 = { x: lerp(sh2.x, tm.x + 30, k), y: lerp(sh2.y, tm.y + 122 - sq, k) };
          arm(g, sh1.x, sh1.y, p1.x, p1.y, 44 * S);
          paw(g, p1.x, p1.y, 30 * S, 0.1);
          arm(g, sh2.x, sh2.y, p2.x, p2.y, 44 * S);
          paw(g, p2.x, p2.y, 30 * S, 0.3);
          break;
        }
        case 'gesto': {
          // the paw up, waving at the listener (to his right)
          const w = Math.sin(u * 9) * 0.35;
          const p = { x: sh2.x + 40 * k + Math.sin(u * 9) * 18, y: sh2.y - 190 * k };
          arm(g, sh2.x, sh2.y, p.x, p.y, 42 * S, { bow: -0.2 });
          paw(g, p.x, p.y, 30 * S, -0.9 + w);
          break;
        }
        case 'espuma': {
          // a claw into the foam of his mug
          const p = { x: lerp(sh2.x, tm.x + 40, k), y: lerp(sh2.y, tm.y - 20, k) + Math.sin(u * 6) * 6 };
          arm(g, sh2.x, sh2.y, p.x, p.y, 42 * S, { bow: -0.25 });
          paw(g, p.x, p.y, 30 * S, 0.5, { claws: 1 });
          break;
        }
        case 'atrapa': {
          // both paws clap around the mug that slides in (without looking)
          const clap = out3(u / 0.18);
          const mx = BAR.tarro.x + 4;
          const p1 = { x: lerp(mx - 120, mx - 4, clap), y: tm.y + 80 };
          const p2 = { x: lerp(mx + 210, mx + 112, clap), y: tm.y + 96 };
          arm(g, sh1.x, sh1.y, p1.x, p1.y, 44 * S);
          paw(g, p1.x, p1.y, 30 * S, 0);
          arm(g, sh2.x, sh2.y, p2.x, p2.y, 44 * S);
          paw(g, p2.x, p2.y, 30 * S, Math.PI);
          if (u < 0.3) star(f, mx + 54, tm.y + 30, 40 * (1 - u / 0.3), TV.white);
          break;
        }
        case 'aplana': {
          // he smooths the napkin flat with his paw (pat, pat)
          const n = P.napkin;
          const cx = (n[0] + n[2]) / 2;
          const pat = Math.abs(Math.sin(u * 8)) * 16 * (u < 1.1 ? 1 : 0);
          const p = { x: cx + Math.sin(u * 4) * 30, y: n[1] - 8 - pat };
          arm(g, sh1.x, sh1.y, p.x, p.y, 46 * S);
          paw(g, p.x, p.y, 32 * S, Math.PI / 2 + 0.2);
          break;
        }
        case 'garras': {
          // he counts lives with his claws: both paws up, the claws pop out one by one (1…8)
          const n = clamp(u / 0.18, 0, 8);
          // the paws come up in front of his chest, close to his face (he looks at them)
          const p1 = { x: sh1.x - 46, y: sh1.y - 86 * k };
          const p2 = { x: sh2.x + 40, y: sh2.y - 92 * k };
          arm(g, sh1.x - 30, sh1.y + 10, p1.x, p1.y, 50 * S, { bow: 0.25, elbow: true });
          paw(g, p1.x, p1.y, 40 * S, -Math.PI / 2 - 0.25, { claws: Math.min(4, n), spread: 0.3 });
          arm(g, sh2.x + 30, sh2.y + 10, p2.x, p2.y, 50 * S, { bow: -0.25, elbow: true });
          paw(g, p2.x, p2.y, 40 * S, -Math.PI / 2 + 0.25, { claws: clamp(n - 4, 0, 4), spread: 0.3 });
          break;
        }
        case 'guarda': {
          // the paw catches the eraser and tucks it into his scarf
          const q = clamp(u / 0.9, 0, 1);
          const p = { x: lerp(sh1.x - 140, hd.x - 30, out3(q)), y: lerp(sh1.y - 250, hd.y + 120, out3(q)) };
          arm(g, sh1.x, sh1.y, p.x, p.y, 44 * S);
          paw(g, p.x, p.y, 32 * S, -0.6);
          if (q > 0.85 && q < 1) star(f, hd.x - 20, hd.y + 110, 30, TV.white);
          break;
        }
        case 'sorbo': {
          // a sip: both paws on the mug, it tilts to his mouth
          const p = { x: tm.x + 10, y: tm.y + 60 };
          arm(g, sh1.x, sh1.y, p.x, p.y, 44 * S);
          paw(g, p.x, p.y, 30 * S, 0.1);
          break;
        }
      }
    }
    // his paw resting on the napkin («esa hoja»), when no move draws one
    if (this.pata > 0.01 && this.tumbado < 0.5 && !this.moves.some((m) => m.who === 'canelo' && ['aplana', 'garras', 'guarda', 'abrazo', 'gesto', 'espuma'].includes(m.kind))) {
      const n = P.napkin;
      const p = { x: (n[0] + n[2]) / 2 + 10, y: n[1] - 6 };
      const k = smooth(this.pata);
      arm(g, sh1.x, sh1.y, lerp(sh1.x, p.x, k), lerp(sh1.y + 40, p.y, k), 46 * S);
      paw(g, lerp(sh1.x, p.x, k), lerp(sh1.y + 40, p.y, k), 32 * S, Math.PI / 2 + 0.2);
    }
    // lying on it: both forearms flat on the napkin; asleep: Zzz
    if (this.tumbado > 0.3) {
      const n = P.napkin;
      const k = smooth((this.tumbado - 0.3) / 0.7);
      for (const [i, px] of [n[0] + 20, n[2] - 10].entries()) {
        const e = i ? sh2 : sh1;
        const py = n[1] + 6 + i * 8;
        arm(g, e.x, e.y - 10, lerp(e.x, px, k), lerp(e.y - 10, py, k), 46 * S);
        paw(g, lerp(e.x, px, k), lerp(e.y - 10, py, k), 30 * S, Math.PI - 0.2);
      }
    }
    if (this.tumbado > 0.6 && this.placaK < 0.5) zzz(f, hd.x + 70, hd.y - 60, 46, t, clamp((this.tumbado - 0.6) / 0.4, 0, 1));
  }

  /** Espuma's things: her pencil when she comes over, her eye-roll mark */
  private drawEspuma(g: Graphics, f: Graphics, t: number) {
    const e = this.sc.actors.espuma!;
    const hd = e.head();
    for (const m of this.moves) {
      if (m.who !== 'espuma') continue;
      const u = t - m.t0;
      if (m.kind === 'ojos') rollMark(f, hd.x + 120, hd.y - 110, 44, clamp(u / 0.6, 0, 1), env(u, m.dur, 0.1, 0.3));
      if (m.kind === 'lapiz') {
        // she looks at her pencil: the lead is gone
        const k = env(u, m.dur, 0.15, 0.25);
        const p = { x: hd.x + 120, y: hd.y + 70 };
        arm(g, hd.x + 40, hd.y + 200, p.x, p.y, 40, { color: CALICO.white, stripe: CALICO.black });
        paw(g, p.x, p.y, 26, -0.8, { color: CALICO.white, light: 0xffffff });
        pencil(g, p.x - 10, p.y + 10, 130 * k, -1.2, { broken: true });
      }
    }
    // while she is over at Canelo's napkin: her pencil reaches for it
    if (this.espumaX > 0.9 && this.tumbado > 0.5) {
      const n = P.napkin;
      const tip = { x: n[2] - 20, y: n[3] - 4 };
      const p = { x: hd.x + 130, y: hd.y + 200 };
      arm(g, hd.x + 40, hd.y + 210, p.x, p.y, 40, { color: CALICO.white, stripe: CALICO.black });
      paw(g, p.x, p.y, 26, 0.6, { color: CALICO.white, light: 0xffffff });
      const a = Math.atan2(tip.y - p.y, tip.x - p.x);
      pencil(g, p.x, p.y, Math.hypot(tip.x - p.x, tip.y - p.y), a, { bend: 0.15 * Math.sin(t * 20) });
    }
  }

  /** the scarf pulled up over his eyes (B11): a knitted band wrapped over the eyes, its tail hanging to his neck */
  private drawScarf(f: Graphics, t: number) {
    const c = this.sc.actors.canelo!;
    const k = smooth(this.bufanda);
    // his painting's own rig (any form of Canelo): the head ellipse, the neck, the eyes
    const r = catRig(c.raw);
    const [hx, , hrx] = r?.head ?? [300, 190, 158, 125];
    const neckY = r?.neck?.[1] ?? 312;
    const eyes = r?.eyes ?? [[239, 158, 288, 205], [335, 183, 385, 230]];
    const eyeTop = Math.min(...eyes.map((e) => e[1]));
    const eyeBot = Math.max(...eyes.map((e) => e[3]));
    // the band rises from the neck to the eyes as he pulls it
    const cy = lerp(neckY + 30, (eyeTop + eyeBot) / 2, k);
    const half = lerp(26, (eyeBot - eyeTop) / 2 + 8, k);
    const xl = hx - hrx * 1.02;
    const xr = hx + hrx * 1.02;
    const P = (x: number, y: number) => c.point(x, y);
    const pts: number[] = [];
    for (let i = 0; i <= 10; i++) {
      const q = i / 10;
      const p = P(lerp(xl, xr, q), cy - half - Math.sin(q * Math.PI) * 16);
      pts.push(p.x, p.y);
    }
    for (let i = 10; i >= 0; i--) {
      const q = i / 10;
      const p = P(lerp(xl + 8, xr - 8, q), cy + half + Math.sin(q * Math.PI) * 10);
      pts.push(p.x, p.y);
    }
    // the tail: from the band's end down his chest (where the painted scarf is)
    const a = P(xr - 70, cy + half - 6);
    const b = P(xr - 18, cy + half - 6);
    const cTail = P(xr - 40, neckY + 120);
    const dTail = P(xr - 96, neckY + 116);
    f.poly([a.x, a.y, b.x, b.y, cTail.x, cTail.y, dTail.x, dTail.y]).fill(SCARF.dark).stroke({ width: LW, color: TV.line, join: 'round' });
    for (let i = 0; i < 4; i++) {
      const q = (i + 0.5) / 4;
      const sx = lerp(dTail.x, cTail.x, q);
      const sy = lerp(dTail.y, cTail.y, q);
      f.moveTo(sx, sy).lineTo(sx + Math.sin(t * 3 + i) * 4, sy + 34).stroke({ width: 6, color: SCARF.stripe, cap: 'round' });
    }
    f.poly(pts).fill(SCARF.base).stroke({ width: LW, color: TV.line, join: 'round' });
    // a cream stripe across, the creases of a pulled scarf, a knot at his side
    const s0 = P(xl + 14, cy);
    const s1 = P(xr - 14, cy);
    f.moveTo(s0.x, s0.y).lineTo(s1.x, s1.y).stroke({ width: 9, color: SCARF.stripe, cap: 'round' });
    for (let i = 0; i < 5; i++) {
      const q = 0.12 + i * 0.18;
      const c0 = P(lerp(xl, xr, q), cy - half + 6);
      const c1 = P(lerp(xl, xr, q) + 22, cy + half - 8);
      f.moveTo(c0.x, c0.y).lineTo(c1.x, c1.y).stroke({ width: 3, color: SCARF.dark, cap: 'round' });
    }
    const kn = P(xr - 44, cy + half - 2);
    f.ellipse(kn.x, kn.y, 22 * k + 6, 16 * k + 5).fill(SCARF.base).stroke({ width: LW * 0.8, color: TV.line });
  }

  // ---------------------------------------------------------------- the window: days and nights · the blue beam
  private drawWindow(t: number) {
    const g = this.winG;
    g.clear();
    const { x0, y0, x1, y1 } = P.win;
    if (this.dianocheT !== null) {
      const k = t - this.dianocheT;
      const D = this.dnDur;
      if (k < D) {
        // day → night → day → night … one flip every half cycle; never more than ~2 changes per second
        const cyc = this.dnCycle;
        const ph = (k / cyc) % 1;
        const day = ph < 0.5;
        const sub = (ph % 0.5) / 0.5;
        g.rect(x0, y0, x1 - x0, y1 - y0).fill(day ? 0x8fd3ff : 0x0b1230);
        if (day) {
          // the sun crosses the window
          const sx = lerp(x0 + 40, x1 - 40, sub);
          const sy = y1 - 60 - Math.sin(sub * Math.PI) * 220;
          g.circle(sx, sy, 46).fill(0xffe46b).stroke({ width: LW, color: TV.line });
          g.rect(x0, y1 - 90, x1 - x0, 90).fill(0x3a6fb0);
        } else {
          const mx = lerp(x0 + 40, x1 - 40, sub);
          const my = y1 - 70 - Math.sin(sub * Math.PI) * 200;
          g.circle(mx, my, 34).fill(TV.cream).stroke({ width: LW, color: TV.line });
          g.circle(mx + 14, my - 8, 28).fill(0x0b1230);
          for (let i = 0; i < 12; i++) g.circle(x0 + ((i * 97) % (x1 - x0)), y0 + 20 + ((i * 53) % 200), 3).fill(TV.cream);
        }
        g.rect(x0, y0 + 166, x1 - x0, 10).fill(TV.line).rect(x0 + 306, y0, 10, y1 - y0).fill(TV.line);
      } else this.dianocheT = null;
    }
    if (this.haz > 0.01) {
      // her lantern's signal: a blue beam going UP through the rain, outside, from down in the city
      const k = this.haz;
      const bx = P.beam.x;
      const sway = Math.sin(t * 0.7) * 0.05;
      const top = y0 - 10;
      const len = (y1 - top) * smooth(k);
      const tx = bx + 120 + sway * 400;
      const ty = y1 - len;
      g.rect(x0, y0, x1 - x0, y1 - y0).fill({ color: 0x3a8cff, alpha: 0.16 * k });
      g.poly([bx - 30, y1, bx + 30, y1, tx + 110, ty, tx - 70, ty]).fill({ color: 0x58b8ff, alpha: 0.38 });
      g.poly([bx - 10, y1, bx + 10, y1, tx + 30, ty, tx - 14, ty]).fill({ color: 0xeafcff, alpha: 0.85 });
      // the rain lights up where it crosses the beam
      for (let i = 0; i < 16; i++) {
        const q = ((t * 1.3 + i * 0.137) % 1);
        const yy = lerp(y1, ty, (i % 8) / 8);
        const xx = lerp(bx, tx, (i % 8) / 8) + ((i * 37) % 40) - 20;
        const ry = yy + q * 60 - 30;
        g.moveTo(xx, ry).lineTo(xx - 6, ry + 22).stroke({ width: 4, color: 0xeafcff, alpha: 0.9 * k });
      }
    }
  }
  private dnDur = 2.4;
  private dnCycle = 0.8;

  // ---------------------------------------------------------------- the board (CUENTAS)
  /** the tab as the set draws it: 14 marks (her «Van catorce»), at the set's own places */
  private tab(g: Graphics, n: number, alpha = 1, jit = 0, t = 0) {
    for (let i = 0; i < n; i++) {
      const j = jit ? Math.sin(t * 13 + i * 2.1) * jit : 0;
      const gx = 128 + Math.floor((i % 14) / 5) * 72 + ((i % 14) % 5) * 12;
      const row = Math.floor(i / 14);
      const oy = row * 0;
      if ((i % 14) % 5 === 4) g.moveTo(gx - 52 + j, 150 + oy).lineTo(gx + 4 + j, 100 + oy).stroke({ width: 4, color: TV.cream, alpha });
      else g.moveTo(gx + j, 100 + oy).lineTo(gx + j, 156 + oy).stroke({ width: 4, color: TV.cream, alpha });
    }
  }
  private drawBoard(t: number) {
    const g = this.boardG;
    g.clear();
    const B = P.board;
    const busy = this.dianocheT !== null || this.borradorT !== null || this.gisT !== null || this.rayasT !== null;
    if (!busy && !this.boardOwned) return;
    this.boardOwned = true;
    // our face over the set's: the board color, then what is written now
    g.rect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0).fill(0x203a2c);
    let tabN = 14;
    let tabA = 1;
    // nights: little chalk marks squeeze in at the right, one per night
    let nights = this.nights;
    if (this.dianocheT !== null) nights = Math.min(6, Math.floor((t - this.dianocheT) / this.dnCycle + 0.5));
    // the fog eraser wipes the whole board (B8a): everything left of it is clean
    let wipeX = -1;
    if (this.borradorT !== null) {
      const k = (t - this.borradorT) / 1.15;
      wipeX = lerp(B.x0 - 60, B.x1 + 80, smooth(k));
      if (k >= 1.6) {
        this.wiped = true;
        this.borradorT = null;
      }
    }
    if (this.wiped) {
      tabN = 0;
      nights = 0;
    }
    // the chalk writes by itself (B8c): first the tab again (faster), then faster and faster, out of the board
    let chalk = -1;
    if (this.gisT !== null) {
      chalk = (t - this.gisT) * 1.12;
      tabN = Math.min(14, Math.floor(chalk / 0.05));
      if (chalk > 2.6) {
        this.gisT = null;
        this.wiped = false;
        tabN = 14;
        chalk = -1;
      }
    }
    this.tab(g, tabN, tabA);
    for (let i = 0; i < nights; i++) g.moveTo(B.x1 - 62 + i * 9, 104).lineTo(B.x1 - 62 + i * 9, 150).stroke({ width: 3, color: 0xfff6c0 });
    if (wipeX > B.x0 - 60) {
      // what the eraser already wiped: a mist trail, then clean board
      g.rect(B.x0, B.y0, clamp(wipeX - B.x0, 0, B.x1 - B.x0), B.y1 - B.y0).fill(0x203a2c);
      for (let i = 0; i < 6; i++) g.circle(wipeX - 40 - i * 30, B.y0 + 50 + ((i * 37) % 60), 26 - i * 3).fill({ color: 0xc7cfe0, alpha: 0.35 - i * 0.05 });
      if (wipeX < B.x1 + 60) fogEraser(g, wipeX, B.y0 + 54 + Math.sin(t * 20) * 6, 54);
    }
    if (chalk > 0.6 && chalk <= 2.6) {
      // the writing that writes itself: lines of scribble, faster and faster; at the peak they spill over the wall
      const speed = in2((chalk - 0.6) / 1.6);
      const spill = bump(chalk, 1.3, 2.45, 0.25);
      const lines = Math.floor(3 + speed * 26);
      for (let i = 0; i < lines; i++) {
        const y = B.y0 + 20 + ((i * 23) % 120);
        const x = B.x0 + 14 + ((i * 61) % 180);
        const w = 40 + ((i * 29) % 90);
        const sx = 1 + spill * (2 + (i % 5));
        const ox = spill * Math.sin(i * 1.7) * 380;
        const oy = spill * Math.cos(i * 2.3) * 260;
        g.moveTo(x + ox, y + oy);
        for (let s = 1; s <= 6; s++) g.lineTo(x + ox + (w * sx * s) / 6, y + oy + Math.sin(s * 2.1 + i + chalk * 10) * 6 * sx);
        g.stroke({ width: 3 + spill * 3, color: spill > 0.3 ? mix(TV.cream, [TV.pink, TV.neonBlue, TV.amberL, TV.greenL][i % 4], spill) : TV.cream, cap: 'round' });
      }
      // the chalk stick itself, racing
      const cx = B.x0 + 30 + ((chalk * (6 + speed * 40)) % 1) * 230 + spill * Math.sin(chalk * 23) * 300;
      const cy = B.y0 + 40 + Math.sin(chalk * (9 + speed * 30)) * 40 + spill * Math.cos(chalk * 17) * 200;
      g.roundRect(cx - 7, cy - 22, 14, 44, 5).fill(TV.white).stroke({ width: 3, color: TV.line });
    } else if (chalk >= 0) {
      // the chalk stands up on its own (it writes the tab back)
      const cx = 128 + Math.floor(Math.min(13, tabN) / 5) * 72 + (Math.min(13, tabN) % 5) * 12;
      g.roundRect(cx - 7, 120 - 22, 14, 44, 5).fill(TV.white).stroke({ width: 3, color: TV.line });
    }
    // lives (B9′): the marks multiply over the board, then everything is the tab again
    if (this.rayasT !== null) {
      const k = t - this.rayasT;
      const grow = k < 0.95 ? in2(k / 0.95) : k < 1.55 ? 1 : 1 - smooth((k - 1.55) / 0.35);
      const n = Math.floor(grow * 60);
      for (let i = 0; i < n; i++) {
        const x = B.x0 + 14 + ((i * 47) % (B.x1 - B.x0 - 30));
        const y = B.y0 + 10 + ((i * 31) % (B.y1 - B.y0 - 50));
        tally(g, x, y, 1 + (i % 5), 30, i % 7 === 0 ? TV.amberL : TV.cream, 0.9, 3);
      }
      if (k > 2.0) this.rayasT = null;
    }
  }
  private nights = 0;
  private wiped = false;

  // ---------------------------------------------------------------- the TV: «pescado y pescado»
  private drawTv(t: number) {
    const g = this.tvG;
    g.clear();
    const k = this.tele2;
    if (k <= 0.01) return;
    const { x0, y0, x1, y1 } = P.tv;
    g.roundRect(x0, y0, x1 - x0, y1 - y0, 12).fill({ color: 0x3fa0c8, alpha: k });
    const cy = (y0 + y1) / 2 + 6;
    // two IDENTICAL fish, facing each other, bobbing in sync (no way to choose)
    for (const s of [-1, 1]) {
      const fx = (x0 + x1) / 2 + s * 52;
      const fy = cy + Math.sin(t * 3) * 6;
      g.ellipse(fx, fy, 30, 16).fill({ color: TV.amber, alpha: k }).stroke({ width: 3, color: TV.line, alpha: k });
      g.poly([fx + s * 28, fy, fx + s * 48, fy - 14, fx + s * 48, fy + 14]).fill({ color: TV.amber, alpha: k }).stroke({ width: 3, color: TV.line, alpha: k });
      g.circle(fx - s * 14, fy - 4, 3).fill({ color: TV.line, alpha: k });
    }
    for (let y = y0 + 4; y < y1 - 2; y += 8) g.rect(x0, y, x1 - x0, 2).fill({ color: TV.line, alpha: 0.18 * k });
  }

  // ---------------------------------------------------------------- inserts
  private updateInserts(t: number) {
    const cs = this.cs;
    cs.t = t;
    cs.gentle = this.gentle;
    if (this.counter) {
      this.counter.root.visible = this.insBarra > 0.01;
      this.counter.root.alpha = this.gentle ? this.insBarra : 1;
      if (this.counter.root.visible) this.counter.update(t, cs);
    }
    if (this.foam) {
      this.foam.root.visible = this.insEspuma > 0.01;
      this.foam.root.alpha = this.gentle ? this.insEspuma : 1;
      if (this.foam.root.visible) this.foam.update(t);
    }
    this.front?.update(t);
  }

  // ================================================================ the cine's commands
  /** a body move (`fx: { id: 'act', who, kind, dur? }`) */
  act(who: Who, kind: string, dur?: number) {
    const t = this.sc.t;
    const d = dur ?? MOVE_DUR[kind] ?? 1.5;
    this.moves = this.moves.filter((m) => !(m.who === who && m.kind === kind));
    this.moves.push({ who, kind, t0: t, dur: d });
    const p = this.sc.actors[who]?.puppet;
    // the face goes with the body
    const face: Record<string, [Parameters<NonNullable<typeof p>['emote']>[0], number]> = {
      abrazo: ['happy', 1],
      ofendido: ['surprise', 1],
      desinfla: ['hurt', 0.6],
      orgulloso: ['happy', 1],
      risa: ['happy', 1.4],
      cabecea: ['surprise', 0.5],
      serio: ['sleepy', 0.4],
      ojos: ['sleepy', 0.75],
      lapiz: ['surprise', 0.9],
      tic: ['surprise', 0.6],
      encoge: ['sleepy', 0.4],
    };
    const fc = face[kind];
    if (fc && p) p.emote(fc[0], fc[1]);
  }
  private poseOf(who: Who, t: number): Pose {
    const o: Pose = { ...ZERO };
    for (const m of this.moves) {
      if (m.who !== who) continue;
      const u = t - m.t0;
      const D = m.dur;
      const k = env(u, D);
      if (k <= 0) continue;
      switch (m.kind) {
        case 'abrazo':
          // lean into the mug (to his right), squeeze, nuzzle
          o.rot += 0.09 * k + 0.03 * Math.sin(u * 7) * k;
          o.dx += 26 * k;
          o.sy *= 1 - 0.04 * k;
          o.sx *= 1 + 0.03 * k;
          o.headA += 0.1 * k;
          break;
        case 'gesto':
          o.rot += 0.05 * k + 0.02 * Math.sin(u * 9) * k;
          o.headA += 0.05 * Math.sin(u * 5) * k;
          o.headDy += -4 * k;
          break;
        case 'inclina':
          // leans toward the listener: «compa…»
          o.rot += 0.08 * k;
          o.dx += 30 * k;
          o.headA += 0.06 * k;
          o.lean += -0.3 * k;
          break;
        case 'ofendido': {
          // anticipation (squash) → he rears up, tall, leaning AWAY → trembles → settles
          const a = clamp(u / 0.12, 0, 1);
          const r = clamp((u - 0.12) / 0.16, 0, 1);
          const rel = 1 - smooth((u - (D - 0.4)) / 0.4);
          const up = out3(r) * rel;
          o.sy *= (1 - 0.1 * a * (1 - r)) * (1 + 0.17 * up);
          o.sx *= (1 + 0.08 * a * (1 - r)) * (1 - 0.1 * up);
          o.rot += -0.13 * up + (u > 0.28 ? 0.014 * Math.sin(u * 60) * up : 0);
          o.dy += -38 * up;
          o.headA += -0.1 * up;
          break;
        }
        case 'desinfla':
          // deflates: nobody clapped
          o.sy *= 1 - 0.1 * k;
          o.sx *= 1 + 0.06 * k;
          o.dy += 34 * k;
          o.headDy += 10 * k;
          o.rot += 0.02 * k;
          break;
        case 'espuma':
          o.rot += 0.07 * k;
          o.dx += 20 * k;
          o.headDy += 8 * k;
          o.headA += 0.12 * k;
          break;
        case 'atrapa': {
          // the catch: a squash on contact
          const s = Math.sin(clamp(u / 0.3, 0, 1) * Math.PI);
          o.sy *= 1 - 0.08 * s;
          o.sx *= 1 + 0.08 * s;
          o.dy += 14 * s;
          break;
        }
        case 'aplana':
          o.rot += 0.05 * k;
          o.headDy += 6 * k;
          o.headA += 0.06 * k;
          break;
        case 'cabecea':
          // can't decide: the head swings from one fish to the other
          o.look += Math.sin(u * Math.PI * 2 * 1.4) * k;
          o.headA += 0.1 * Math.sin(u * Math.PI * 2 * 1.4) * k;
          o.rot += 0.02 * Math.sin(u * Math.PI * 2 * 1.4) * k;
          break;
        case 'orgulloso':
          // chest out, chin up
          o.sy *= 1 + 0.07 * k;
          o.sx *= 1 - 0.03 * k;
          o.rot += -0.05 * k;
          o.dy += -14 * k;
          o.headA += -0.09 * k;
          break;
        case 'serio':
          o.headDy += 7 * k;
          o.crouch += 0.25 * k;
          o.rot += 0.02 * k;
          break;
        case 'risa': {
          // he laughs at his own joke (alone): bounces
          const b = Math.abs(Math.sin(u * 13));
          o.sy *= 1 + 0.06 * b * k;
          o.dy += -12 * b * k;
          o.rot += 0.04 * Math.sin(u * 6.5) * k;
          o.headA += -0.06 * k;
          break;
        }
        case 'encoge': {
          const s = Math.sin(clamp(u / D, 0, 1) * Math.PI);
          o.dy += -22 * s;
          o.sy *= 1 + 0.05 * s;
          o.headDy += 8 * s;
          break;
        }
        case 'mira':
          // he looks back, to the window (away from the listener)
          o.rot += -0.07 * k;
          o.look += -0.8 * k;
          o.headA += -0.08 * k;
          break;
        case 'garras':
          o.headDy += 6 * k;
          o.headA += 0.04 * Math.sin(u * 4) * k;
          break;
        case 'guarda':
          o.rot += -0.04 * k;
          o.headA += -0.05 * k;
          break;
        case 'tic':
          // R3: an eye trembles — a tiny rapid head shake (a fade-in tremble with reduced motion)
          o.dx += (settings.reduceMotion ? 0 : Math.sin(u * 90) * 3) * k;
          o.headA += 0.02 * Math.sin(u * 70) * k;
          break;
        case 'sorbo':
          o.rot += 0.06 * k;
          o.headDy += 10 * k;
          break;
        // ---- Espuma
        case 'pule':
          o.rot += 0.06 * Math.sin(u * 26) * k;
          o.dy += -6 * Math.abs(Math.sin(u * 26)) * k;
          break;
        case 'ojos':
          o.headA += -0.12 * bump(u, 0, D, 0.35);
          o.headDy += -6 * k;
          break;
        case 'lapiz':
          o.headA += 0.16 * k;
          o.look += 0.6 * k;
          break;
        case 'vuelve':
          break;
      }
    }
    return o;
  }

  fx(cmd: FxCmd, ctx: CineCtx): (() => void) | void {
    const t = this.sc.t;
    const gentle = ctx.reduceMotion || ctx.reduceFlashes || this.gentle;
    switch (cmd.id) {
      case 'act':
        this.act((cmd.who as Who) ?? 'canelo', String(cmd.kind ?? 'gesto'), cmd.dur as number | undefined);
        return;
      // ---- the cross
      case 'cruce':
        if (!this.cross) {
          this.cross = new CrossingInsert(gentle);
          this.sc.screenL.addChild(this.cross.root);
          this.crossWait = 0;
        }
        this.cross.wipe();
        if (!gentle) sfx('whoosh', 0.8);
        return;
      case 'neon':
        this.neonT = t;
        if (!gentle) for (const d of [0, 160, 400, 620]) window.setTimeout(() => this.sc.isAlive && sfx('zap', 1.6 + d / 900), d);
        return;
      // ---- scene A
      case 'portada':
        if (this.front) this.front.t0 = t;
        if (!gentle) sfx('paper', 1.2);
        return;
      case 'gateraDibuja':
        if (this.foam) this.foam.drawT = t;
        sfx('tick', 1.6);
        return;
      case 'gateraAbre':
        if (this.foam) this.foam.openT = t;
        sfx('reveal', 1.3);
        window.setTimeout(() => this.sc.isAlive && sfx('pop', 0.8), 920);
        return;
      case 'latigo':
        if (!gentle) {
          this.latigoT = t;
          this.latigoDir = Number(cmd.dir ?? 1);
          sfx('whoosh', 1.3);
        }
        return;
      // ---- scene B: the counter from above
      case 'palmea':
        this.cs.patT = t;
        return;
      case 'azucar':
        this.cs.cubeT = t;
        return;
      case 'blanco':
        this.cs.whiteT = t;
        sfx('reveal', 1.6);
        return;
      case 'catsup':
        this.cs.ketchupT = t;
        return;
      case 'rojo':
        this.cs.redT = t;
        sfx('splash', 1.2);
        return;
      case 'manos':
        this.cs.handsT = t;
        sfx('zap', 2.2);
        return;
      case 'capi': {
        const v = String(cmd.v ?? 'none');
        this.cs.capi = v === 'perfecto' || v === 'romper' || v === 'nada' ? v : 'none';
        this.cs.capiT = t;
        this.cs.writeT = null;
        return;
      }
      case 'capiEscribe':
        this.cs.writeT = t;
        if (this.cs.capi !== 'none') sfx('paper', 1.4);
        return;
      case 'lapiz':
        this.cs.pencilT = t;
        window.setTimeout(() => this.sc.isAlive && sfx('pop', 1.8), 1740);
        return;
      // ---- scene B: the room
      case 'dianoche':
        this.dianocheT = t;
        this.dnCycle = gentle ? 1.1 : 0.68;
        this.dnDur = this.dnCycle * 3 + 0.01;
        this.nights = 0;
        return () => {
          this.nights = 3;
        };
      case 'borrador':
        this.borradorT = t;
        sfx('whoosh', 0.6);
        return;
      case 'guarda':
        this.guardaT = t;
        this.act('canelo', 'guarda');
        return;
      case 'gis':
        this.gisT = t;
        this.wiped = true;
        sfx('tick', 2.2);
        return;
      case 'rayas':
        this.rayasT = t;
        return;
      case 'limpia':
        // back to the plain bar (the end of scene B, or a skip): no insert, no prop left
        this.reset();
        return;
    }
  }
  /** everything of the pass back to the plain bar (a replay starts clean; SALTAR leaves no insert on screen) */
  reset() {
    this.moves = [];
    this.servilleta = this.pata = this.insEspuma = this.insBarra = this.tumbado = this.placaK = this.haz = this.bufanda = this.tele2 = this.espumaX = 0;
    this.cs = { t: 0, pawOn: 0, patT: null, cubeT: null, whiteT: null, ketchupT: null, redT: null, handsT: null, capiT: null, capi: 'none', writeT: null, asleep: 0, pencilT: null, gentle: this.gentle };
    this.dianocheT = this.borradorT = this.guardaT = this.gisT = this.rayasT = null;
    this.nights = 0;
    this.wiped = false;
    if (this.foam) this.foam.drawT = this.foam.openT = null;
    if (this.front) this.front.t0 = null;
  }

  driveGet(id: string): number | undefined {
    switch (id) {
      case 'neonApagado':
        return this.neonDark;
      case 'pelos':
        return this.pelos;
      case 'ronquido':
        return this.ronquido;
      case 'servilleta':
        return this.servilleta;
      case 'pata':
        return this.pata;
      case 'ins:espuma':
        return this.insEspuma;
      case 'ins:barra':
        return this.insBarra;
      case 'barraPata':
        return this.cs.pawOn;
      case 'barraDuerme':
        return this.cs.asleep;
      case 'tumbado':
        return this.tumbado;
      case 'placa':
        return this.placaK;
      case 'haz':
        return this.haz;
      case 'bufanda':
        return this.bufanda;
      case 'tele2':
        return this.tele2;
      case 'espumaX':
        return this.espumaX;
    }
    return undefined;
  }
  /** true when the id is ours (the stage then stops looking) */
  drive(id: string, k: number): boolean {
    if (this.driveGet(id) === undefined) return false;
    switch (id) {
      case 'neonApagado':
        this.neonDark = k;
        break;
      case 'pelos':
        this.pelos = k;
        break;
      case 'ronquido':
        this.ronquido = k;
        break;
      case 'servilleta':
        this.servilleta = k;
        break;
      case 'pata':
        this.pata = k;
        break;
      case 'ins:espuma':
        this.insEspuma = k;
        break;
      case 'ins:barra':
        this.insBarra = k;
        break;
      case 'barraPata':
        this.cs.pawOn = k;
        break;
      case 'barraDuerme':
        this.cs.asleep = k;
        break;
      case 'tumbado':
        this.tumbado = k;
        break;
      case 'placa':
        this.placaK = k;
        break;
      case 'haz':
        this.haz = k;
        break;
      case 'bufanda':
        this.bufanda = k;
        break;
      case 'tele2':
        this.tele2 = k;
        break;
      case 'espumaX':
        this.espumaX = k;
        break;
    }
    return true;
  }

  /** the pass's camera targets (all left of the listener line) */
  resolve(t: Target): { x: number; y: number } | null {
    if (typeof t !== 'string') return null;
    switch (t) {
      case 'servilleta':
        return { x: (P.napkin[0] + P.napkin[2]) / 2, y: P.napkin[1] - 40 };
      case 'pizarron':
        return { x: (P.board.x0 + P.board.x1) / 2, y: (P.board.y0 + P.board.y1) / 2 + 20 };
      case 'ventana':
        return { x: (P.win.x0 + P.win.x1) / 2, y: (P.win.y0 + P.win.y1) / 2 };
      case 'tele':
        return { x: (P.tv.x0 + P.tv.x1) / 2, y: (P.tv.y0 + P.tv.y1) / 2 };
      case 'pelos':
        return { x: (P.pelos.x0 + P.pelos.x1) / 2, y: CALLE.ground - 120 };
    }
    return null;
  }

  dispose() {
    for (const i of [this.cross, this.foam, this.front, this.counter]) i?.destroy();
    this.cross = this.foam = this.front = this.counter = null;
    if (!this.scr.destroyed) this.scr.destroy();
  }
}
