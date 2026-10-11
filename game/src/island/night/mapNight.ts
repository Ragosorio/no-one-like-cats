/**
 * The CARTA under the narrative world state (MapScene): if the story says it's night, the chart is read by night.
 *
 * Paper-friendly, never a dark screen: an indigo MULTIPLY wash over the aged paper (the ink stays ink), little
 * gold-foil stars printed on the chart that twinkle, a few that drift UP when the stars are falling upward, and
 * by day the stitched seam of the sky as a thread across the sheet. It follows the same derived state as the
 * island (state/sys/worldState.ts, clock-following states included) and eases between looks. Part I: invisible
 * (nothing is drawn, nothing ticks but a poll).
 *
 * The chart also KEEPS what the story wrote on it, in a hand that isn't anyone's (the margin notes after the
 * Bibliotecario, the «—N.» after the Corrector): small, faded, in the corners of the paper.
 */
import { BLEND_MODES, Container, Graphics, Text, type Bounds } from 'pixi.js';
import { F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { game } from '../../core/App';
import { settings } from '../../core/settings';
import { G } from '../../state/game';
import { clockLook, currentWorldState, lookOf, type WorldLook } from '../../state/sys/worldState';
import { islandHour } from './clock';

const STARS = 46;
const HAND = 0x24224f;
const done = (m: string) => !!G.s?.missions?.done.includes(m);
/** notes the story left on the chart: [text, x, y (view fractions), size, rotation, shown when] */
const NOTES: [string, number, number, number, number, () => boolean][] = [
  ['¿y esta isla?', 0.08, 0.83, 34, -0.12, () => done('H35')],
  ['(ver folio 000)', 0.83, 0.16, 28, 0.06, () => done('H35')],
  ['—N.', 0.92, 0.42, 58, -0.1, () => done('H41')],
];
const POLL = 0.5;

export type Rect = { x0: number; x1: number; y0: number; y1: number };
const NOTE_GAP = 18;
/**
 * How far a note centred at (x, y) with half-size (hw, hh) must slide to clear every rect (title strips, island
 * name ribbons): {0, 0} when it touches none, else the shortest slide — sideways or up/down, one axis — that
 * clears them all and stays on screen ([left, right] × [top, bottom]); failing that, the shortest clear one.
 */
export function noteShift(x: number, y: number, hw: number, hh: number, rects: Rect[], left: number, right: number, top = -Infinity, bottom = Infinity): { dx: number; dy: number } {
  const g = NOTE_GAP;
  const hits = (cx: number, cy: number, r: Rect) => cx + hw + g > r.x0 && cx - hw - g < r.x1 && cy + hh + g > r.y0 && cy - hh - g < r.y1;
  const clear = (cx: number, cy: number) => rects.every((r) => !hits(cx, cy, r));
  if (clear(x, y)) return { dx: 0, dy: 0 };
  const cands: [number, number][] = [];
  for (const r of rects) {
    cands.push([r.x0 - g - hw - 0.5 - x, 0], [r.x1 + g + hw + 0.5 - x, 0], [0, r.y0 - g - hh - 0.5 - y], [0, r.y1 + g + hh + 0.5 - y]);
  }
  const ok = cands.filter(([dx, dy]) => clear(x + dx, y + dy));
  const on = ok.filter(([dx, dy]) => x + dx - hw >= left && x + dx + hw <= right && y + dy - hh >= top && y + dy + hh <= bottom);
  const pool = on.length ? on : ok;
  if (!pool.length) return { dx: 0, dy: 0 };
  const [dx, dy] = pool.reduce((a, b) => (Math.hypot(b[0], b[1]) < Math.hypot(a[0], a[1]) ? b : a));
  return { dx, dy };
}

function look(): WorldLook {
  const st = currentWorldState(G.s);
  const l = lookOf(st);
  return st.clock ? clockLook(l, islandHour()) : l;
}

/** a tiny four-point star (gold foil with an ink edge) */
function star(r: number) {
  const g = new Graphics();
  const pts: number[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.32 : r;
    pts.push(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  g.poly(pts).fill(0xfff1bf).stroke({ width: Math.max(1, r * 0.18), color: 0x2a2244, alpha: 0.55, join: 'round' });
  return g;
}

export class MapNight extends Container {
  private wash = new Graphics();
  private field = new Container();
  private rising = new Container();
  private seam = new Graphics();
  private stars: { g: Graphics; u: number; v: number; ph: number; s: number }[] = [];
  private ups: { g: Graphics; t: number; x: number; y: number }[] = [];
  private cur = { sky: 0, stars: 0, seam: 0, fall: 0 };
  private want = { sky: 0, stars: 0, seam: 0, fall: 0 };
  private pollT = 0;
  private upAcc = 0;
  private t = 0;
  private seed = 7;
  private notes = new Container();
  private noteTexts: { t: Text; def: (typeof NOTES)[number]; dx: number; dy: number }[] = [];
  /**
   * What the notes must not write over (MapScene: the sheets' vertical title strips, «MAR DE LAS RUPTURAS»,
   * «LAS FRONTERAS», and the islands' name ribbons). The notes stay put on the screen, but slide off whatever the
   * chart pans under them.
   */
  avoid: () => Container[] = () => [];
  constructor() {
    super();
    this.label = 'mapNight';
    this.eventMode = 'none';
    this.wash.blendMode = 'multiply' as BLEND_MODES;
    this.addChild(this.wash, this.seam, this.field, this.rising, this.notes);
    for (const def of NOTES) {
      const t = txt(def[0], { fontFamily: F.brush, fontSize: def[3], fill: HAND, padding: 10 }) as Text;
      t.anchor.set(0.5);
      t.rotation = def[4];
      t.alpha = 0;
      this.notes.addChild(t);
      this.noteTexts.push({ t, def, dx: 0, dy: 0 });
    }
    for (let i = 0; i < STARS; i++) {
      const s = 3 + this.rnd() * 6;
      const g = star(s);
      this.field.addChild(g);
      this.stars.push({ g, u: this.rnd(), v: this.rnd() * 0.92, ph: this.rnd() * 6.28, s });
    }
    this.read(true);
    this.update(0);
  }
  private rnd() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
  private read(snap = false) {
    const l = look();
    this.want = { sky: l.sky, stars: l.stars, seam: l.seam, fall: l.starFall };
    if (snap) this.cur = { ...this.want };
  }

  /** the strips and names to keep clear, in this layer's coordinates */
  private stripRects(): Rect[] {
    const out: Rect[] = [];
    for (const o of this.avoid()) {
      if (o.destroyed || !o.parent || !o.visible) continue;
      const b: Bounds = o.getBounds();
      const a = this.toLocal({ x: b.minX, y: b.minY });
      const c = this.toLocal({ x: b.maxX, y: b.maxY });
      out.push({ x0: Math.min(a.x, c.x), x1: Math.max(a.x, c.x), y0: Math.min(a.y, c.y), y1: Math.max(a.y, c.y) });
    }
    return out;
  }

  update(dt: number) {
    if (this.destroyed) return;
    this.t += dt;
    this.pollT -= dt;
    if (this.pollT <= 0) {
      this.pollT = POLL;
      this.read();
    }
    const k = Math.min(1, dt * 1.2);
    for (const key of ['sky', 'stars', 'seam', 'fall'] as const) this.cur[key] += (this.want[key] - this.cur[key]) * k;
    const c = this.cur;
    const v = game.view;
    let notes = false;
    const strips = this.noteTexts.some((n) => n.t.alpha > 0) ? this.stripRects() : [];
    for (const n of this.noteTexts) {
      const show = this.pollT === POLL ? n.def[5]() : n.t.alpha > 0.001;
      if (this.pollT === POLL) n.t.alpha = show ? 0.5 : 0;
      const x = v.x + v.w * n.def[1];
      const y = v.y + v.h * n.def[2];
      const want = n.t.alpha > 0 ? noteShift(x, y, n.t.width / 2, n.t.height / 2, strips, v.x, v.x + v.w, v.y, v.y + v.h) : { dx: 0, dy: 0 };
      // glide off a strip or a name (snap when it's the first frame or motion is reduced)
      const k = dt <= 0 || settings.reduceMotion ? 1 : Math.min(1, dt * 10);
      n.dx += (want.dx - n.dx) * k;
      n.dy += (want.dy - n.dy) * k;
      n.t.position.set(x + n.dx, y + n.dy);
      notes ||= n.t.alpha > 0;
    }
    const on = c.sky > 0.01 || c.seam > 0.01 || this.ups.length > 0 || notes;
    this.visible = on;
    if (!on) return;
    const rm = settings.reduceMotion;
    // the paper read by night: indigo multiply (0.42 at full night), never black
    this.wash.clear();
    if (c.sky > 0.01) this.wash.rect(v.x, v.y, v.w, v.h).fill({ color: 0x5b62c4, alpha: 0.42 * c.sky });
    // printed stars
    const sv = Math.min(1, c.stars) * Math.min(1, c.sky * 1.4);
    this.field.visible = sv > 0.01;
    if (this.field.visible)
      for (const s of this.stars) {
        s.g.position.set(v.x + s.u * v.w, v.y + 70 + s.v * (v.h - 140));
        const tw = rm ? 1 : 0.6 + 0.4 * Math.sin(this.t * (1.3 + s.ph * 0.2) + s.ph);
        s.g.alpha = sv * tw * 0.85;
      }
    // stars falling UP on the chart (a few at a time)
    if (c.fall > 0.05 && c.sky > 0.3) {
      this.upAcc += dt * Math.min(1.2, c.fall * 0.35) * (rm ? 0.5 : 1);
      while (this.upAcc >= 1 && this.ups.length < 8) {
        this.upAcc -= 1;
        const g = star(3 + this.rnd() * 3);
        this.rising.addChild(g);
        this.ups.push({ g, t: 0, x: v.x + this.rnd() * v.w, y: v.y + v.h * (0.35 + this.rnd() * 0.55) });
      }
    }
    for (let i = this.ups.length - 1; i >= 0; i--) {
      const u = this.ups[i];
      u.t += dt;
      const life = rm ? 4.5 : 3.2;
      const p = u.t / life;
      u.g.position.set(u.x + Math.sin(u.t * 2) * 4, u.y - (rm ? 40 : 90) * p * p);
      u.g.alpha = Math.sin(Math.min(1, p) * Math.PI) * 0.9;
      if (p >= 1) {
        u.g.destroy();
        this.ups.splice(i, 1);
      }
    }
    // the sky's seam as a stitched thread across the chart (by day; it fades into the night wash)
    this.seam.clear();
    const sa = c.seam * 0.5 * (1 - 0.6 * c.sky);
    if (sa > 0.01) {
      const x0 = v.x + v.w * 0.04;
      const x1 = v.x + v.w * 0.96;
      const y0 = v.y + v.h * 0.3;
      const y1 = v.y + v.h * 0.22;
      const n = 46;
      for (let i = 0; i < n; i++) {
        const a = i / n;
        const b = (i + 0.55) / n;
        const ya = y0 + (y1 - y0) * a + Math.sin(a * 9) * 6;
        const yb = y0 + (y1 - y0) * b + Math.sin(b * 9) * 6;
        this.seam.moveTo(x0 + (x1 - x0) * a, ya).lineTo(x0 + (x1 - x0) * b, yb);
        if (i % 3 === 0) {
          const cx = x0 + (x1 - x0) * a;
          this.seam.moveTo(cx - 5, ya - 7).lineTo(cx + 5, ya + 7);
        }
      }
      this.seam.stroke({ width: 3, color: 0x2a2340, alpha: sa, cap: 'round' });
    }
  }
}
