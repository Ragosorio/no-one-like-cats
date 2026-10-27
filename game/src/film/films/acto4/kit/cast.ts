/**
 * ACTO IV — the cast of La Gira. The pop stars have their approved paintings now (FILM-CAST, 2026-10-27): their traits
 * are painted (the bunny-ear bucket hat, the sequins and crystal mic, the headset and clipboard, the buzz cut and the
 * chain), so nothing is drawn over them. The characters still without art keep a STAND-IN + code-drawn traits on the
 * painting's own rig (eyes, head, ears). Parodies with their own feline names; no real faces, no logos, no lyrics, no
 * invented quotes of real artists.
 *
 *   Firma          STAND-IN aurea_halo_cat (cream + gold) + the giant calligraphic signature stroke that wraps her
 *   El mánager     his painting (manager_backstage_cat: purple suit, headset, clipboard, phone, the pass)
 *   Gato Malo      his painting (gatomalo_bunny_cat: bucket hat with bunny ears, dark glasses, coloured nails)
 *   Tailor Swift   her painting (tailor_eras_cat: sequin dress, crystal mic, friendship bracelets)
 *   EMIAU          his painting (emiau_rapper_cat), the same as Act I
 *   Esquirla       STAND-IN neon_glitch_cat + a hood and the arm of glitch (a pixel trail)
 *   Noctis, Maneki, Cronos, Grafitera, Hipólito, Homiau, Borrón: their own paintings (film/standins.ts)
 *
 * Everything is drawn ONCE in build, in the actor's local space (so it flips and steps with the actor); `follow()` keeps
 * it on the head while the puppet breathes.
 */
import { Container, Graphics } from 'pixi.js';
import type { Actor } from '../../../../momentos/anime/actor';
import type { SceneCtx } from '../../../stage';
import { POP } from '../../../styles/pop';
import { STANDINS } from '../../../standins';

export const SLUG = {
  firma: STANDINS.firma,
  manager: 'manager_backstage_cat',
  malo: 'gatomalo_bunny_cat',
  tailor: 'tailor_eras_cat',
  emiau: STANDINS.emiau,
  esquirla: STANDINS.esquirla,
  hipo: 'hipolito_tavern_cat',
  cronos: 'cronos_astrolabe_cat',
  maneki: STANDINS.maneki,
  grafitera: 'grafitera_spray_cat',
  noctis: 'masquerade_phantom_cat',
  homiau: STANDINS.homiau,
  borron: STANDINS.borron,
  cerito: STANDINS.cerito,
} as const;

/** the rig landmarks of an actor, in its LOCAL space (painting px × puppet scale, minus the anchor) */
export interface Geo {
  head: { x: number; y: number; rx: number; ry: number };
  eyes: { x: number; y: number; w: number; h: number }[];
  ears: { bx: number; by: number; tx: number; ty: number; w: number }[];
  neck: { x: number; y: number };
  tail: { x: number; y: number };
  /** the painting's height in local px */
  size: number;
}
export function geoOf(a: Actor | null): Geo | null {
  const p = a?.puppet;
  const rig = p?.brain.model?.rig as
    | { head?: number[]; eyes?: number[][]; ears?: number[][]; neck?: number[]; tail?: { pts: number[][] } }
    | undefined;
  if (!p || !rig?.head) return null;
  const sx = p.scale.x;
  const sy = p.scale.y;
  const ax = p.anchor.x * p.W;
  const ay = p.anchor.y * p.H;
  const X = (x: number) => (x - ax) * sx;
  const Y = (y: number) => (y - ay) * sy;
  const [hx, hy, hrx, hry] = rig.head;
  const tp = rig.tail?.pts?.[rig.tail.pts.length - 1] ?? [p.W * 0.8, p.H * 0.6];
  return {
    head: { x: X(hx), y: Y(hy), rx: hrx * Math.abs(sx), ry: hry * Math.abs(sy) },
    eyes: (rig.eyes ?? []).map((e) => ({ x: X((e[0] + e[2]) / 2), y: Y((e[1] + e[3]) / 2), w: Math.abs(e[2] - e[0]) * Math.abs(sx), h: Math.abs(e[3] - e[1]) * Math.abs(sy) })),
    ears: (rig.ears ?? []).map((e) => ({ bx: X(e[0]), by: Y(e[1]), tx: X(e[2]), ty: Y(e[3]), w: e[4] * Math.abs(sx) })),
    neck: { x: X(rig.neck?.[0] ?? hx), y: Y(rig.neck?.[1] ?? hy + hry) },
    tail: { x: X(tp[0]), y: Y(tp[1]) },
    size: p.H * Math.abs(sy),
  };
}

/** an actor wearing code-drawn traits that stay on its head */
export class Dressed {
  readonly acc = new Container();
  /** the head layer (follows the breathing; add props here) and its drawing; the body drawing (doesn't follow) */
  readonly headC = new Container();
  readonly onHead = new Graphics();
  readonly onBody = new Graphics();
  readonly geo: Geo | null;
  private h0: [number, number] = [0, 0];
  constructor(
    readonly actor: Actor | null,
    draw: (head: Graphics, body: Graphics, g: Geo) => void,
  ) {
    this.geo = geoOf(actor);
    if (actor && this.geo) {
      draw(this.onHead, this.onBody, this.geo);
      this.headC.addChild(this.onHead);
      this.acc.addChild(this.onBody, this.headC);
      actor.addChild(this.acc);
      this.h0 = actor.head();
    }
  }
  /** keep the head traits on the head (call every frame after pose) */
  follow() {
    if (!this.actor) return;
    const [hx, hy] = this.actor.head();
    this.headC.position.set(hx - this.h0[0], hy - this.h0[1]);
  }
}

// ------------------------------------------------------------------ the traits
const INK = 0x1a0b2e;
/** big dark glasses over the rig's eyes (Gato Malo, El mánager) */
export function glasses(g: Graphics, geo: Geo, o: { big?: number; color?: number; frame?: number; shine?: boolean } = {}) {
  const k = o.big ?? 1.35;
  const es = geo.eyes.length >= 2 ? geo.eyes.slice(0, 2) : [{ x: geo.head.x - geo.head.rx * 0.35, y: geo.head.y, w: geo.head.rx * 0.4, h: geo.head.ry * 0.3 }, { x: geo.head.x + geo.head.rx * 0.35, y: geo.head.y, w: geo.head.rx * 0.4, h: geo.head.ry * 0.3 }];
  const lw = Math.max(3, geo.size * 0.008);
  for (const e of es) g.roundRect(e.x - (e.w * k) / 2 - 4, e.y - (e.h * k) / 2 - 2, e.w * k + 8, e.h * k + 4, Math.min(e.w, e.h) * 0.45).fill(o.color ?? 0x14101c).stroke({ width: lw, color: o.frame ?? INK });
  const [a, b] = es;
  g.moveTo(a.x + (a.w * k) / 2, a.y - a.h * 0.2).quadraticCurveTo((a.x + b.x) / 2, a.y - a.h * 0.6, b.x - (b.w * k) / 2, b.y - b.h * 0.2).stroke({ width: lw * 1.2, color: o.frame ?? INK });
  if (o.shine !== false) for (const e of es) g.moveTo(e.x - e.w * 0.35, e.y - e.h * 0.1).lineTo(e.x - e.w * 0.05, e.y - e.h * 0.4).stroke({ width: lw * 0.9, color: 0xffffff, alpha: 0.7 });
}
/** Gato Malo: a fisherman's bucket hat (pastel) with two long bunny ears coming out of it */
export function bunnyBucketHat(g: Graphics, geo: Geo, color: number = POP.mint) {
  const h = geo.head;
  const top = h.y - h.ry * 0.95;
  const lw = Math.max(3, geo.size * 0.009);
  // the ears first (behind the hat): long, a pink inside, one bent
  const ear = (x: number, lean: number, bend: number) => {
    const L = h.ry * 2.4;
    const w = h.rx * 0.32;
    const tipX = x + lean * L * 0.4 + bend;
    const tipY = top - L;
    g.moveTo(x - w / 2, top + 6).bezierCurveTo(x - w, top - L * 0.5, tipX - w * 0.8, tipY + w, tipX, tipY).bezierCurveTo(tipX + w * 0.8, tipY + w, x + w, top - L * 0.5, x + w / 2, top + 6).fill(0xfaf6f2).stroke({ width: lw, color: INK, join: 'round' });
    g.moveTo(x - w * 0.18, top).bezierCurveTo(x - w * 0.45, top - L * 0.5, tipX - w * 0.3, tipY + w * 1.4, tipX, tipY + w * 0.9).bezierCurveTo(tipX + w * 0.3, tipY + w * 1.4, x + w * 0.45, top - L * 0.5, x + w * 0.18, top).fill(0xff9ec8);
  };
  ear(h.x - h.rx * 0.38, -0.5, -h.rx * 0.25);
  ear(h.x + h.rx * 0.38, 0.6, h.rx * 0.4);
  // the bucket: crown + soft brim
  const cw = h.rx * 1.25;
  g.moveTo(h.x - cw * 0.8, top + h.ry * 0.25).quadraticCurveTo(h.x - cw * 0.75, top - h.ry * 0.55, h.x, top - h.ry * 0.62).quadraticCurveTo(h.x + cw * 0.75, top - h.ry * 0.55, h.x + cw * 0.8, top + h.ry * 0.25).closePath().fill(color).stroke({ width: lw, color: INK, join: 'round' });
  g.ellipse(h.x, top + h.ry * 0.32, cw * 1.12, h.ry * 0.24).fill(color).stroke({ width: lw, color: INK });
  g.ellipse(h.x, top + h.ry * 0.22, cw * 0.82, h.ry * 0.1).fill({ color: 0x000000, alpha: 0.12 });
  // stitched rings on the brim
  g.ellipse(h.x, top + h.ry * 0.34, cw * 0.98, h.ry * 0.17).stroke({ width: lw * 0.5, color: INK, alpha: 0.35 });
}
/** coloured nails: little pastel ovals on the front paws (approximate paw line under the chest) */
export function nails(g: Graphics, geo: Geo, colors: number[] = [POP.pink, POP.cyan, POP.yellow, POP.lilac, POP.mint]) {
  const y = -geo.size * 0.035;
  const xs = [geo.neck.x - geo.size * 0.13, geo.neck.x + geo.size * 0.05];
  let i = 0;
  for (const x of xs) for (let j = 0; j < 3; j++) g.ellipse(x + (j - 1) * geo.size * 0.022, y, geo.size * 0.011, geo.size * 0.008).fill(colors[i++ % colors.length]).stroke({ width: 2, color: INK });
}
/** El mánager: a headset (band + earcup + mic boom toward the mouth) */
export function headset(g: Graphics, geo: Geo) {
  const h = geo.head;
  const lw = Math.max(4, geo.size * 0.01);
  g.moveTo(h.x - h.rx * 0.9, h.y - h.ry * 0.1).bezierCurveTo(h.x - h.rx * 0.95, h.y - h.ry * 1.25, h.x + h.rx * 0.95, h.y - h.ry * 1.25, h.x + h.rx * 0.9, h.y - h.ry * 0.1).stroke({ width: lw * 1.6, color: 0x1c1a26 });
  g.roundRect(h.x - h.rx * 1.02, h.y - h.ry * 0.3, h.rx * 0.3, h.ry * 0.55, 10).fill(0x2a2838).stroke({ width: lw * 0.6, color: INK });
  g.moveTo(h.x - h.rx * 0.88, h.y + h.ry * 0.15).quadraticCurveTo(h.x - h.rx * 0.7, h.y + h.ry * 0.75, h.x - h.rx * 0.1, h.y + h.ry * 0.62).stroke({ width: lw * 0.7, color: 0x1c1a26 });
  g.circle(h.x - h.rx * 0.08, h.y + h.ry * 0.62, lw * 1.2).fill(0x3a3850);
  g.circle(h.x - h.rx * 0.95, h.y - h.ry * 0.05, lw * 0.6).fill(POP.red);
}
/** a clipboard held against the chest: board, clip, a schedule of blank lines (no text) */
export function clipboard(g: Graphics, geo: Geo) {
  const w = geo.size * 0.22;
  const hh = geo.size * 0.28;
  const x = geo.neck.x + geo.size * 0.02;
  const y = geo.neck.y + geo.size * 0.12;
  const lw = Math.max(3, geo.size * 0.008);
  g.roundRect(x - w / 2, y, w, hh, 8).fill(0xb07a44).stroke({ width: lw, color: INK });
  g.rect(x - w * 0.42, y + hh * 0.1, w * 0.84, hh * 0.84).fill(0xfaf6ee);
  for (let i = 0; i < 6; i++) {
    g.rect(x - w * 0.36, y + hh * (0.2 + i * 0.12), w * (0.42 + ((i * 37) % 30) / 100), lw * 0.7).fill({ color: 0x5a5a6a, alpha: 0.6 });
    g.rect(x + w * 0.18, y + hh * (0.18 + i * 0.12), lw * 1.6, lw * 1.6).stroke({ width: 2, color: 0x5a5a6a });
  }
  g.roundRect(x - w * 0.2, y - hh * 0.05, w * 0.4, hh * 0.1, 6).fill(0xc8ccd8).stroke({ width: lw * 0.7, color: INK });
}
/** a laminated backstage pass on a lanyard (a blank photo square + coloured bands; no text) */
export function lanyard(g: Graphics, geo: Geo, color: number = POP.pink) {
  const x = geo.neck.x;
  const y = geo.neck.y + geo.size * 0.06;
  const w = geo.size * 0.1;
  const lw = Math.max(2, geo.size * 0.006);
  g.moveTo(x - w * 0.9, y - geo.size * 0.12).lineTo(x, y).lineTo(x + w * 0.9, y - geo.size * 0.12).stroke({ width: lw * 2, color });
  g.roundRect(x - w / 2, y, w, w * 1.35, 6).fill(0xffffff).stroke({ width: lw, color: INK });
  g.rect(x - w * 0.4, y + w * 0.12, w * 0.8, w * 0.22).fill(color);
  g.rect(x - w * 0.25, y + w * 0.45, w * 0.5, w * 0.5).fill(0xcfd4e0);
}
/** Tailor Swift: four big sequin shapes on the dress + a flat red lip */
export function sequins(g: Graphics, geo: Geo) {
  const cx = geo.neck.x;
  const cy = geo.neck.y + geo.size * 0.2;
  const s = geo.size * 0.07;
  const lw = Math.max(3, geo.size * 0.007);
  const cols = [0xf0e6ff, POP.pink, POP.lilac, 0xc9f6ff];
  const shapes: [number, number, number][] = [
    [-1.4, -0.4, 0],
    [0.5, -0.9, 1],
    [1.5, 0.4, 2],
    [-0.3, 0.9, 3],
  ];
  shapes.forEach(([dx, dy, k], i) => {
    const x = cx + dx * s;
    const y = cy + dy * s;
    if (k === 0) g.poly([x, y - s * 0.8, x + s * 0.6, y, x, y + s * 0.8, x - s * 0.6, y]).fill(cols[i]).stroke({ width: lw, color: INK, join: 'round' });
    else if (k === 1) g.star(x, y, 5, s * 0.7, s * 0.32).fill(cols[i]).stroke({ width: lw, color: INK, join: 'round' });
    else if (k === 2) g.circle(x, y, s * 0.55).fill(cols[i]).stroke({ width: lw, color: INK });
    else g.poly([x - s * 0.7, y + s * 0.4, x, y - s * 0.7, x + s * 0.7, y + s * 0.4]).fill(cols[i]).stroke({ width: lw, color: INK, join: 'round' });
    g.moveTo(x - s * 0.25, y - s * 0.2).lineTo(x - s * 0.05, y - s * 0.4).stroke({ width: lw * 0.8, color: 0xffffff, alpha: 0.9 });
  });
}
/** a flat red lip under the nose (Tailor Swift) — on the head */
export function redLip(g: Graphics, geo: Geo) {
  const h = geo.head;
  const es = geo.eyes;
  const x = es.length >= 2 ? (es[0].x + es[1].x) / 2 : h.x;
  const y = (es.length ? es[0].y : h.y) + h.ry * 0.62;
  const w = h.rx * 0.28;
  g.moveTo(x - w, y).quadraticCurveTo(x - w * 0.4, y - w * 0.45, x, y - w * 0.12).quadraticCurveTo(x + w * 0.4, y - w * 0.45, x + w, y).quadraticCurveTo(x, y + w * 0.55, x - w, y).fill(0xe0283c).stroke({ width: 2, color: INK });
}
/** a crystal microphone (faceted, clear) in local coords at (x, y), size s */
export function crystalMic(g: Graphics, x: number, y: number, s: number, rot = -0.4) {
  const c = Math.cos(rot);
  const sn = Math.sin(rot);
  const P = (dx: number, dy: number): [number, number] => [x + dx * c - dy * sn, y + dx * sn + dy * c];
  const lw = Math.max(2, s * 0.06);
  const handle = [P(-s * 0.12, 0), P(s * 0.12, 0), P(s * 0.08, s * 1.4), P(-s * 0.08, s * 1.4)].flat();
  g.poly(handle).fill({ color: 0xe8f6ff, alpha: 0.85 }).stroke({ width: lw, color: INK, join: 'round' });
  const head = [P(0, -s * 0.62), P(s * 0.42, -s * 0.3), P(s * 0.34, s * 0.08), P(-s * 0.34, s * 0.08), P(-s * 0.42, -s * 0.3)].flat();
  g.poly(head).fill({ color: 0xd8f2ff, alpha: 0.9 }).stroke({ width: lw, color: INK, join: 'round' });
  const f1 = [P(0, -s * 0.62), P(-s * 0.1, -s * 0.2), P(0, s * 0.08)].flat();
  g.poly(f1).stroke({ width: lw * 0.6, color: 0x7fb8e0 });
  const [hx, hy] = P(-s * 0.18, -s * 0.36);
  g.circle(hx, hy, s * 0.07).fill(0xffffff);
}
/** friendship bracelets: rings of coloured beads around the front paws */
export function bracelets(g: Graphics, geo: Geo) {
  const y = -geo.size * 0.09;
  const cols = [POP.pink, POP.yellow, POP.cyan, POP.mint, POP.lilac, 0xffffff];
  for (const x0 of [geo.neck.x - geo.size * 0.13, geo.neck.x + geo.size * 0.05])
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) g.circle(x0 + (i - 2.5) * geo.size * 0.012, y - r * geo.size * 0.018, geo.size * 0.007).fill(cols[(i + r * 2) % cols.length]).stroke({ width: 1.5, color: INK });
}
/**
 * Firma's signature: one GIANT calligraphic stroke that wraps her like a dress (thick-thin ribbon, gold with an ink
 * edge; no readable letters). Drawn as a loop around the body + a flourish over the head.
 */
export function signature(g: Graphics, geo: Geo, o: { gold?: number; ink?: number } = {}) {
  const cx = geo.neck.x;
  const top = geo.head.y - geo.head.ry * 1.6;
  const bot = -geo.size * 0.02;
  const R = geo.size * 0.36;
  const gold = o.gold ?? 0xf2c25a;
  const ink = o.ink ?? 0x3a2108;
  // a spiral ribbon: sample a curve and give it a pen width that swells on the downstrokes
  const pts: [number, number, number][] = [];
  const N = 120;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = -0.6 + t * Math.PI * 4.2;
    const y = top + (bot - top) * (0.15 + t * 0.85);
    const r = R * (0.55 + 0.45 * Math.sin(t * Math.PI));
    const x = cx + Math.cos(a) * r;
    const w = 6 + 20 * Math.max(0, Math.sin(a + 0.6)) * (0.4 + 0.6 * Math.sin(t * Math.PI));
    pts.push([x, y + Math.sin(a) * r * 0.18, w]);
  }
  for (const [col, extra] of [
    [ink, 5],
    [gold, 0],
  ] as const) {
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0, w0] = pts[i - 1];
      const [x1, y1, w1] = pts[i];
      g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: (w0 + w1) / 2 + extra, color: col, cap: 'round' });
    }
  }
  // the flourish over the head (a loop and a tail)
  const hx = geo.head.x;
  g.moveTo(hx - geo.head.rx * 1.4, top + 20).bezierCurveTo(hx - geo.head.rx * 0.6, top - geo.head.ry * 1.2, hx + geo.head.rx * 1.6, top - geo.head.ry * 0.4, hx + geo.head.rx * 0.3, top + 10).bezierCurveTo(hx - geo.head.rx * 0.4, top + 30, hx + geo.head.rx * 0.8, top - geo.head.ry * 0.9, hx + geo.head.rx * 2, top - geo.head.ry * 0.2).stroke({ width: 9, color: gold, cap: 'round' });
}
/** EMIAU: the platinum buzz cut (a flat cap of stubble), the grey hood behind the head, the fish-bone chain */
export function emiauTraits(head: Graphics, body: Graphics, geo: Geo) {
  const h = geo.head;
  const lw = Math.max(3, geo.size * 0.008);
  // hood (behind: drawn on the body layer, around the head)
  body.ellipse(h.x, h.y + h.ry * 0.15, h.rx * 1.3, h.ry * 1.25).fill(0x8a8a96).stroke({ width: lw, color: INK });
  body.ellipse(h.x, h.y + h.ry * 0.25, h.rx * 1.05, h.ry * 1.0).fill(0x5a5a66);
  // chain with a fish bone
  const y = geo.neck.y + geo.size * 0.04;
  body.moveTo(geo.neck.x - geo.size * 0.1, y - geo.size * 0.06).quadraticCurveTo(geo.neck.x, y + geo.size * 0.06, geo.neck.x + geo.size * 0.1, y - geo.size * 0.06).stroke({ width: lw * 1.4, color: 0xd8dce6 });
  const fx = geo.neck.x;
  const fy = y + geo.size * 0.05;
  const s = geo.size * 0.05;
  body.moveTo(fx, fy - s * 0.2).lineTo(fx, fy + s * 1.1).stroke({ width: lw * 1.2, color: 0xeef0f6 });
  for (let i = 0; i < 3; i++) body.moveTo(fx - s * 0.4, fy + s * (0.25 + i * 0.28)).lineTo(fx + s * 0.4, fy + s * (0.25 + i * 0.28)).stroke({ width: lw, color: 0xeef0f6 });
  body.poly([fx - s * 0.35, fy + s * 1.3, fx, fy + s * 1.05, fx + s * 0.35, fy + s * 1.3]).fill(0xeef0f6);
  // the buzz cut: a flat platinum cap with stubble dots
  head.moveTo(h.x - h.rx * 0.82, h.y - h.ry * 0.35).quadraticCurveTo(h.x, h.y - h.ry * 1.2, h.x + h.rx * 0.82, h.y - h.ry * 0.35).quadraticCurveTo(h.x, h.y - h.ry * 0.62, h.x - h.rx * 0.82, h.y - h.ry * 0.35).fill(0xf3eec8).stroke({ width: lw * 0.8, color: INK, alpha: 0.6 });
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI;
    head.circle(h.x - Math.cos(a) * h.rx * 0.6 * (0.6 + ((i * 7) % 5) / 12), h.y - h.ry * (0.55 + Math.sin(a) * 0.32), 1.6).fill({ color: 0xc8b878, alpha: 0.8 });
  }
}
/** Esquirla: a dark hood with neon-green trim, and a glitch arm (stepped pixel trail) toward `reach` (local) */
export function esquirlaHood(head: Graphics, geo: Geo) {
  const h = geo.head;
  const lw = Math.max(3, geo.size * 0.008);
  head.moveTo(h.x - h.rx * 1.15, h.y + h.ry * 0.7).quadraticCurveTo(h.x - h.rx * 1.25, h.y - h.ry * 1.4, h.x, h.y - h.ry * 1.45).quadraticCurveTo(h.x + h.rx * 1.25, h.y - h.ry * 1.4, h.x + h.rx * 1.15, h.y + h.ry * 0.7).lineTo(h.x + h.rx * 0.8, h.y + h.ry * 0.5).quadraticCurveTo(h.x + h.rx * 0.9, h.y - h.ry * 0.9, h.x, h.y - h.ry * 0.95).quadraticCurveTo(h.x - h.rx * 0.9, h.y - h.ry * 0.9, h.x - h.rx * 0.8, h.y + h.ry * 0.5).closePath().fill(0x2a2a34).stroke({ width: lw, color: 0x5cff8a });
}
/** the glitch arm: blocks stepping from (x0, y0) toward (x1, y1) by `p` (0..1), shuffled on 12 fps steps */
export function glitchArm(g: Graphics, x0: number, y0: number, x1: number, y1: number, p: number, step: number, s = 18) {
  const n = Math.max(1, Math.floor(14 * p));
  for (let i = 0; i < n; i++) {
    const k = i / 14;
    const jx = (((i * 73 + step * 31) % 17) - 8) * s * 0.12;
    const jy = (((i * 41 + step * 19) % 13) - 6) * s * 0.12;
    const x = x0 + (x1 - x0) * k + jx;
    const y = y0 + (y1 - y0) * k + jy;
    const col = (i + step) % 3 === 0 ? 0x5cff8a : (i + step) % 3 === 1 ? 0xff3d9a : 0x3de8ff;
    g.rect(x - s / 2, y - s / 2, s * (1 - k * 0.3), s * (1 - k * 0.3)).fill(col);
  }
}

/** an actor of the cast (null when its painting isn't loaded) */
export const cast = (ctx: SceneCtx, slug: string, size: number) => ctx.actor(slug, size);

/** a STAFF cap on a dressed actor's head (backwards = the bill to the back; flip `scale.x` to turn it round) */
export function staffCap(ctx: SceneCtx, d: Dressed, backwards = false): Container | null {
  const g = d.geo;
  if (!g) return null;
  const cap = new Container();
  const c = new Graphics();
  const h = g.head;
  c.moveTo(-h.rx * 0.95, 0).quadraticCurveTo(-h.rx * 0.9, -h.ry * 1.1, 0, -h.ry * 1.15).quadraticCurveTo(h.rx * 0.9, -h.ry * 1.1, h.rx * 0.95, 0).closePath().fill(0x1e2a5a).stroke({ width: 5, color: INK });
  c.ellipse(h.rx * 0.95, 4, h.rx * 0.75, h.ry * 0.16).fill(0x16204a).stroke({ width: 5, color: INK });
  c.circle(0, -h.ry * 1.12, 6).fill(0x16204a);
  const t = ctx.k.text.sprite('STAFF', { fontFamily: 'Anton', fontSize: Math.max(18, h.ry * 0.42), fill: 0xffffff, letterSpacing: 2 }, 0.5);
  t.position.set(-h.rx * 0.05, -h.ry * 0.5);
  cap.addChild(c, t);
  cap.position.set(h.x, h.y - h.ry * 0.55);
  cap.scale.x = backwards ? -1 : 1;
  d.headC.addChild(cap);
  return cap;
}
