/**
 * La Michi de la Perla, la que Voltea a Verte: the window universe (a Delft master's quiet room, 1665). It starts in the
 * painting's own deep dark: only the shutters of a leaded window glow at the cracks. ¡CLIC! They swing open and a
 * morning light sweeps the screen from the left, uncovering the room as it goes — a plaster wall warming up, a checkered
 * marble floor, a row of blue Delft tiles, an old sea chart on the wall, a table under a heavy rug with a white jug — and
 * dust falls through the beam in slow motion (her passive). Her pearl catches it (¡TIN!) and she turns, very slowly,
 * over her shoulder (the camera creeps in): «…¿mm?».
 * Payoff: the light swells and gilds the dust, the pearl flashes; ¿ME HABLABAS? / …iba a decir algo. Ya se le olvidó.
 * (A public-domain painting evoked through light, room and props; she is a cat. Calm: no shake, soft flashes only.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, backlight, burst, flashOf, later } from './kit';
import { hideDisc } from './kitA';
import { mix, rng, stash } from './kitB';
import { balloon, ngon, onCat } from './kitD';
import { at, comic, pre, wrap } from './kitI';
import { F, glint, headline, hgrad, loop, word1 } from './kitK';
import { liveLoop } from '../../../panels/collection/cardArt';

const ULTRA = 0x1b3f8b;
const OCHRE = 0xe6c34a;
const PEARL = 0xf4f1ea;
const DARK = 0x070a09;
const WOOD = 0x3a2816;
const LIGHT = 0xfff2d2;
/** the pearl on the painting (measured on the integrated SVG) */
const PEARL_AT: [number, number] = [0.524, 0.456];

/** the room's layout: designed on a 1920×1080 frame centered at `cx`, scaled by `u` (the card reuses it at any size) */
interface Lay {
  w: number;
  h: number;
  cx: number;
  u: number;
}
const X = (l: Lay, x: number) => l.cx + (x - 960) * l.u;
const Y = (l: Lay, y: number) => y * l.u;

/** wall, Delft skirting, checkered floor, sea chart, the table with its rug and jug (static) */
function room(g: Graphics, l: Lay) {
  const fl = Y(l, 790);
  hgrad(g, 0, 0, l.w, fl, [0xdccfaa, 0xcbbb93, 0xa8986f, 0x7a6c4f, 0x51473a], 20);
  // the ceiling's shadow and a soft corner shade
  g.rect(0, 0, l.w, Y(l, 70)).fill({ color: 0x1a140c, alpha: 0.35 });
  g.rect(0, Y(l, 70), l.w, Y(l, 50)).fill({ color: 0x1a140c, alpha: 0.15 });
  // the window's light on the plaster, spreading right from the window
  g.poly([X(l, 520), Y(l, 110), X(l, 760), Y(l, 170), X(l, 980), Y(l, 760), X(l, 520), Y(l, 760)]).fill({ color: 0xfff4d8, alpha: 0.16 });
  g.poly([X(l, 520), Y(l, 160), X(l, 680), Y(l, 210), X(l, 820), Y(l, 760), X(l, 520), Y(l, 760)]).fill({ color: 0xfff4d8, alpha: 0.12 });
  // skirting with a row of blue Delft tiles
  g.rect(0, Y(l, 752), l.w, Y(l, 40)).fill(0x2a2218);
  const tw = 30 * l.u;
  for (let x = (l.cx - 960 * l.u) % tw - tw; x < l.w; x += tw) {
    const tx = x + 3 * l.u;
    const ty = Y(l, 756);
    const s = tw - 6 * l.u;
    g.rect(tx, ty, s, s).fill(0xe8ecef);
    g.poly([tx + s / 2, ty + s * 0.18, tx + s * 0.82, ty + s / 2, tx + s / 2, ty + s * 0.82, tx + s * 0.18, ty + s / 2]).fill({ color: 0x2f5aa8, alpha: 0.85 });
  }
  // the checkered marble floor in perspective
  const vx = X(l, 1000);
  const vy = Y(l, 430);
  const rows = 7;
  const tile = 86 * l.u;
  const k = (y: number) => (y - vy) / (fl - vy);
  for (let j = 0; j < rows; j++) {
    const y0 = fl + (l.h - fl) * Math.pow(j / rows, 1.6);
    const y1 = fl + (l.h - fl) * Math.pow((j + 1) / rows, 1.6);
    const k0 = k(y0);
    const k1 = k(y1);
    const span = Math.ceil((l.w / 2 + Math.abs(vx - l.w / 2)) / tile / k1) + 1;
    for (let i = -span; i < span; i++) {
      const a = (i * tile) / 1;
      const b = ((i + 1) * tile) / 1;
      const xa0 = vx + a * k0;
      const xb0 = vx + b * k0;
      const xa1 = vx + a * k1;
      const xb1 = vx + b * k1;
      if (Math.max(xb0, xb1) < -40 || Math.min(xa0, xa1) > l.w + 40) continue;
      const base = (i + j) % 2 ? 0xd6cdb6 : 0x2c2723;
      const shade = Math.max(0.05, Math.min(0.62, ((xa1 - l.cx) / (960 * l.u)) * 0.42 + 0.22 - j * 0.03));
      g.poly([xa0, y0, xb0, y0, xb1, y1, xa1, y1]).fill(mix(base, 0x0c0906, shade));
    }
  }
  // the sea chart on the wall (rods, parchment, seas, lands, a compass star)
  const mx0 = X(l, 1290);
  const mx1 = X(l, 1640);
  const my0 = Y(l, 150);
  const my1 = Y(l, 470);
  g.rect(mx0 + 10 * l.u, my0 + 12 * l.u, mx1 - mx0, my1 - my0).fill({ color: 0x1a140c, alpha: 0.35 });
  g.rect(mx0, my0, mx1 - mx0, my1 - my0).fill(0xd4bc84);
  g.rect(mx0 + 14 * l.u, my0 + 14 * l.u, mx1 - mx0 - 28 * l.u, my1 - my0 - 28 * l.u).fill(0x9fb39a);
  const r = rng(17);
  for (let i = 0; i < 6; i++) {
    const lx = mx0 + (0.15 + r() * 0.7) * (mx1 - mx0);
    const ly = my0 + (0.2 + r() * 0.6) * (my1 - my0);
    g.poly(ngon(lx, ly, (24 + r() * 46) * l.u, (16 + r() * 30) * l.u, 9, r() * 3)).fill(0xc9a866);
  }
  const sx = mx0 + 0.72 * (mx1 - mx0);
  const sy = my0 + 0.32 * (my1 - my0);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const L = (i % 2 ? 22 : 40) * l.u;
    g.poly([sx, sy, sx + Math.cos(a + 0.18) * 8 * l.u, sy + Math.sin(a + 0.18) * 8 * l.u, sx + Math.cos(a) * L, sy + Math.sin(a) * L]).fill({ color: 0x5a3c1c, alpha: 0.8 });
  }
  g.rect(mx0 - 16 * l.u, my0 - 10 * l.u, mx1 - mx0 + 32 * l.u, 14 * l.u).fill(0x2a1d10);
  g.rect(mx0 - 16 * l.u, my1 - 4 * l.u, mx1 - mx0 + 32 * l.u, 14 * l.u).fill(0x2a1d10);
  // the table under a heavy rug (right), a white jug and a bowl
  const tx0 = X(l, 1300);
  const tx1 = X(l, 1860);
  const ty = Y(l, 720);
  // a heavy knotted rug draped over it: deep red field, a dark border with ochre diamonds, a medallion row
  g.poly([tx0, ty, tx1, ty, tx1 + 30 * l.u, Y(l, 940), tx0 - 30 * l.u, Y(l, 940)]).fill(0x6e2016);
  g.poly([tx0 - 22 * l.u, Y(l, 880), tx1 + 22 * l.u, Y(l, 880), tx1 + 30 * l.u, Y(l, 940), tx0 - 30 * l.u, Y(l, 940)]).fill(0x1b2a4a);
  g.poly([tx0 - 4 * l.u, ty + 26 * l.u, tx1 + 4 * l.u, ty + 26 * l.u, tx1 + 6 * l.u, ty + 50 * l.u, tx0 - 6 * l.u, ty + 50 * l.u]).fill(0x1b2a4a);
  const dw = 34 * l.u;
  for (let x = tx0 + dw / 2; x < tx1; x += dw) {
    g.poly([x, Y(l, 892), x + 9 * l.u, Y(l, 910), x, Y(l, 928), x - 9 * l.u, Y(l, 910)]).fill(OCHRE);
    g.poly([x, ty + 30 * l.u, x + 7 * l.u, ty + 38 * l.u, x, ty + 46 * l.u, x - 7 * l.u, ty + 38 * l.u]).fill(0xc9a866);
  }
  for (let i = 0; i < 4; i++) {
    const mx = tx0 + (tx1 - tx0) * (0.14 + i * 0.24);
    const my = Y(l, 800);
    g.poly([mx, my - 40 * l.u, mx + 44 * l.u, my, mx, my + 40 * l.u, mx - 44 * l.u, my]).fill(0x2a3a6a);
    g.poly([mx, my - 24 * l.u, mx + 26 * l.u, my, mx, my + 24 * l.u, mx - 26 * l.u, my]).fill(OCHRE);
    g.poly([mx, my - 10 * l.u, mx + 11 * l.u, my, mx, my + 10 * l.u, mx - 11 * l.u, my]).fill(0x6e2016);
  }
  for (let x = tx0 - 30 * l.u; x < tx1 + 30 * l.u; x += 14 * l.u) g.rect(x, Y(l, 940), 4 * l.u, 22 * l.u).fill(0xc9a866);
  g.poly([tx0, ty, tx1, ty, tx1, ty + 14 * l.u, tx0, ty + 14 * l.u]).fill(0x5a1a10);
  const jx = X(l, 1460);
  g.poly(ngon(jx, ty - 70 * l.u, 46 * l.u, 64 * l.u, 16)).fill(0xeef0ee);
  g.rect(jx - 22 * l.u, ty - 160 * l.u, 44 * l.u, 40 * l.u).fill(0xeef0ee);
  g.poly([jx - 26 * l.u, ty - 160 * l.u, jx - 44 * l.u, ty - 176 * l.u, jx - 20 * l.u, ty - 168 * l.u]).fill(0xeef0ee);
  g.poly(ngon(jx - 10 * l.u, ty - 80 * l.u, 18 * l.u, 30 * l.u, 10)).fill({ color: 0xffffff, alpha: 0.7 });
  g.poly(ngon(jx + 20 * l.u, ty - 60 * l.u, 20 * l.u, 34 * l.u, 10)).fill({ color: 0x7a8a96, alpha: 0.35 });
  const bx = X(l, 1640);
  g.poly([bx - 70 * l.u, ty - 34 * l.u, bx + 70 * l.u, ty - 34 * l.u, bx + 46 * l.u, ty - 2 * l.u, bx - 46 * l.u, ty - 2 * l.u]).fill(0xe8ecef);
  g.rect(bx - 60 * l.u, ty - 30 * l.u, 120 * l.u, 6 * l.u).fill(0x2f5aa8);
  g.poly(ngon(bx - 20 * l.u, ty - 46 * l.u, 22 * l.u, 14 * l.u, 9)).fill(0xc58a3a).poly(ngon(bx + 22 * l.u, ty - 44 * l.u, 20 * l.u, 13 * l.u, 9)).fill(0xb87a30);
}

/** the leaded window (left) — frame, glass with lead cames; `lit` 0..1 the morning behind it */
function windowGlass(g: Graphics, l: Lay, lit: number) {
  g.clear();
  const x0 = X(l, 150);
  const x1 = X(l, 520);
  const y0 = Y(l, 90);
  const y1 = Y(l, 640);
  g.rect(x0, y0, x1 - x0, y1 - y0).fill(WOOD);
  const gx0 = X(l, 172);
  const gx1 = X(l, 498);
  const gy0 = Y(l, 112);
  const gy1 = Y(l, 618);
  g.rect(gx0, gy0, gx1 - gx0, gy1 - gy0).fill(mix(0x15130e, 0xeef4f2, lit));
  if (lit > 0.05) {
    // old glass: a few panes tinted
    const r = rng(5);
    const pw = 36 * l.u;
    const ph = 42 * l.u;
    for (let y = gy0; y < gy1 - 1; y += ph)
      for (let x = gx0; x < gx1 - 1; x += pw) {
        const v = r();
        if (v < 0.3) g.rect(x, y, Math.min(pw, gx1 - x), Math.min(ph, gy1 - y)).fill({ color: v < 0.15 ? 0xd8e6c8 : 0xf6efd2, alpha: 0.6 * lit });
      }
  }
  // lead cames
  const lead = mix(0x0b0a08, 0x3a3a36, lit);
  for (let x = gx0 + 36 * l.u; x < gx1; x += 36 * l.u) g.rect(x - 1.2 * l.u, gy0, 2.4 * l.u, gy1 - gy0).fill(lead);
  for (let y = gy0 + 42 * l.u; y < gy1; y += 42 * l.u) g.rect(gx0, y - 1.2 * l.u, gx1 - gx0, 2.4 * l.u).fill(lead);
  // transom and mullion
  g.rect(gx0, Y(l, 296), gx1 - gx0, 14 * l.u).fill(WOOD).rect(X(l, 328), gy0, 14 * l.u, gy1 - gy0).fill(WOOD);
  g.rect(x0 - 10 * l.u, y1, x1 - x0 + 20 * l.u, 16 * l.u).fill(0x2a1d10);
}

/** a closed shutter panel: planks, and the morning leaking through its cracks (origin at its hinge; side -1 = left) */
function shutter(l: Lay, side: -1 | 1) {
  const g = new Graphics();
  const w = 163 * l.u;
  const h = Y(l, 506);
  const x0 = side < 0 ? 0 : -w;
  g.rect(x0, 0, w, h).fill(0x22160a);
  for (let i = 1; i < 4; i++) {
    const x = x0 + (w * i) / 4;
    g.rect(x - 1.5 * l.u, 0, 3 * l.u, h).fill({ color: LIGHT, alpha: 0.75 });
    g.rect(x - 6 * l.u, 0, 12 * l.u, h).fill({ color: LIGHT, alpha: 0.08 });
  }
  g.rect(x0, h * 0.2, w, 10 * l.u).fill(0x150d05).rect(x0, h * 0.75, w, 10 * l.u).fill(0x150d05);
  // the edge where the two panels meet: the brightest crack
  const ex = side < 0 ? w : -w;
  g.rect(ex - 2 * l.u, 0, 4 * l.u, h).fill({ color: 0xffffff, alpha: 0.9 });
  g.rect(ex - 10 * l.u, 0, 20 * l.u, h).fill({ color: LIGHT, alpha: 0.12 });
  return g;
}

/** the light shaft from the window down to the floor (additive) and its pool on the floor; `a` 0..1 */
function beam(g: Graphics, l: Lay, a: number) {
  g.clear();
  if (a < 0.01) return;
  const p = [X(l, 176), Y(l, 118), X(l, 496), Y(l, 108), X(l, 1560), l.h + 40, X(l, 860), l.h + 40];
  g.poly(p).fill({ color: LIGHT, alpha: 0.09 * a });
  const q = [X(l, 230), Y(l, 160), X(l, 450), Y(l, 150), X(l, 1400), l.h + 40, X(l, 980), l.h + 40];
  g.poly(q).fill({ color: LIGHT, alpha: 0.09 * a });
  g.poly([X(l, 600), Y(l, 800), X(l, 1180), Y(l, 800), X(l, 1500), l.h, X(l, 760), l.h]).fill({ color: 0xfff6dd, alpha: 0.2 * a });
}

/** dust in the beam, falling in slow motion (one Graphics, ~50 motes) */
function motes(g: Graphics, l: Lay, t: number, a: number, gold = 0) {
  g.clear();
  if (a < 0.01) return;
  const r = rng(31);
  for (let i = 0; i < 50; i++) {
    const along = (r() + t * 0.018 * (0.5 + r())) % 1;
    const across = r();
    const ax = X(l, 220) + (X(l, 1080) - X(l, 220)) * along;
    const ay = Y(l, 150) + (l.h - Y(l, 150)) * along;
    const x = ax + (across - 0.5) * 360 * l.u + Math.sin(t * 0.7 + i) * 14 * l.u;
    const y = ay + Math.cos(t * 0.5 + i * 1.7) * 10 * l.u;
    const s = (2 + r() * 3.5) * l.u * (1 + gold * 0.6);
    const tw = 0.45 + 0.55 * Math.abs(Math.sin(t * 1.3 + i * 2.1));
    const col = gold > 0 && i % 3 === 0 ? OCHRE : 0xfffbe8;
    if (i % 7 === 0) g.poly([x, y - s * 2, x + s * 0.4, y, x, y + s * 2, x - s * 0.4, y]).fill({ color: col, alpha: a * tw });
    else g.rect(x - s / 2, y - s / 2, s, s).fill({ color: col, alpha: a * tw * 0.8 });
  }
}

/** the dark that the light sweeps away: everything right of the front `f` (at y = 0; it leans down-right) */
function darkness(g: Graphics, f: number) {
  g.clear();
  const lean = 0.45;
  const fx = (y: number, d: number) => f + d + y * lean;
  if (f > W + 1400) return;
  g.poly([fx(-60, 0), -60, W + 900, -60, W + 900, H + 60, fx(H + 60, 0), H + 60]).fill({ color: DARK, alpha: 0.96 });
  for (let i = 0; i < 6; i++) {
    const a = 0.96 * (1 - (i + 1) / 7);
    g.poly([fx(-60, -60 * (i + 1)), -60, fx(-60, -60 * i), -60, fx(H + 60, -60 * i), H + 60, fx(H + 60, -60 * (i + 1)), H + 60]).fill({ color: DARK, alpha: a });
  }
}

interface St {
  light: { v: number };
  gold: { v: number };
  land: (o?: { dur?: number; slow?: boolean }) => void;
}
const S = stash<St>();

export const perla: Signature = {
  dark: true,
  frame: OCHRE,
  tag: 'UNIVERSO DE LA VENTANA',
  open(c: SigCtx) {
    const L: Lay = { w: W, h: H, cx: W / 2, u: 1 };
    const k = new Container();
    const base = new Graphics().rect(-200, -200, W + 400, H + 400).fill(DARK);
    const rm = new Graphics();
    room(rm, L);
    const dk = new Graphics();
    const win = new Graphics();
    const cas = new Graphics()
      .poly([X(L, 498), Y(L, 300), X(L, 600), Y(L, 262), X(L, 600), Y(L, 668), X(L, 498), Y(L, 618)])
      .fill(WOOD)
      .poly([X(L, 506), Y(L, 312), X(L, 590), Y(L, 280), X(L, 590), Y(L, 650), X(L, 506), Y(L, 606)])
      .fill({ color: 0xe8efe8, alpha: 0.75 });
    for (let i = 1; i < 4; i++) cas.poly([X(L, 506 + i * 21), Y(L, 312 - i * 8), X(L, 508 + i * 21), Y(L, 311 - i * 8), X(L, 508 + i * 21), Y(L, 607 + i * 11), X(L, 506 + i * 21), Y(L, 606 + i * 11)]).fill(0x3a3a36);
    const shL = shutter(L, -1);
    shL.position.set(X(L, 172), Y(L, 112));
    const shR = shutter(L, 1);
    shR.position.set(X(L, 498), Y(L, 112));
    const bm = new Graphics();
    bm.blendMode = 'add';
    const mt = new Graphics();
    k.addChild(base, rm, dk, win, cas, shL, shR, bm, mt);
    // the camera creeps in while she turns
    k.pivot.set(W / 2, H / 2);
    k.position.set(W / 2, H / 2);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const bl = backlight(LIGHT, 380, 0.16);
    bl.position.set(W / 2, c.catY);
    c.behind.addChild(bl);

    const instant = c.short || c.reduce;
    const front = { v: instant ? W + 2000 : -700 };
    const light = { v: instant ? 1 : 0 };
    const gold = { v: 0 };
    const lit = { v: instant ? 1 : 0 };
    if (instant) {
      shL.scale.x = 0.06;
      shR.scale.x = 0.06;
      shL.alpha = shR.alpha = 0;
      bl.alpha = 1.8;
    } else cas.alpha = 0;
    let lastLit = -1;
    loop(
      c,
      mt,
      30,
      (t) => {
        darkness(dk, front.v);
        if (Math.abs(lit.v - lastLit) > 0.01) {
          windowGlass(win, L, lit.v);
          lastLit = lit.v;
        }
        beam(bm, L, light.v);
        motes(mt, L, t + 3, light.v, gold.v);
      },
      4,
    );

    // the payoff's words, built now (they rasterize under the seal's break)
    const title = word1('¿ME HABLABAS?', { fontFamily: F.serif, fontWeight: '900', fontSize: 118, fill: PEARL, stroke: { color: ULTRA, width: 14, join: 'round' }, letterSpacing: 2 });
    const land = headline(c, title, '…iba a decir algo. Ya se le olvidó.');
    S.set(c, { light, gold, land });
    if (c.short) return;

    const clic = pre(c, comic('¡CLIC!', LIGHT, 96), 470, 230, -0.1);
    const [px, py] = onCat(c, PEARL_AT[0], PEARL_AT[1]);
    const tin = pre(c, comic('¡TIN!', PEARL, 84), px + 150, py + 70, 0.12);
    const hum = balloon('…¿mm?', { size: 40, fill: PEARL, ink: 0x14100a, tx: 70, ty: 74, font: F.serif });
    const hmm = pre(c, hum, ...onCat(c, 0.12, 0.2), 0.05);
    if (!c.reduce) gsap.to(k.scale, { x: 1.06, y: 1.06, duration: 4.4, ease: 'sine.inOut' });
    sfx('paper', 0.6);
    // ¡CLIC!: the shutters swing open; the morning sweeps the room from the left
    at(c, 0.3, () => {
      clic(0.6, { from: 1.6 });
      sfx('click', 0.9);
      sfx('whoosh', 0.6);
      if (c.reduce) {
        shL.alpha = shR.alpha = 0;
        cas.alpha = 1;
        lit.v = light.v = 1;
        front.v = W + 2000;
        return;
      }
      gsap.to([shL.scale, shR.scale], { x: 0.06, duration: 0.32, ease: 'power2.in' });
      gsap.to([shL, shR], { alpha: 0, delay: 0.24, duration: 0.15 });
      gsap.to(cas, { alpha: 1, delay: 0.18, duration: 0.2 });
      gsap.to(lit, { v: 1, duration: 0.3, ease: 'power1.out' });
      gsap.to(front, { v: W + 1500, delay: 0.05, duration: 1.15, ease: 'power2.inOut' });
      gsap.to(light, { v: 1, delay: 0.1, duration: 0.9, ease: 'power1.inOut' });
      gsap.to(bl, { alpha: 1.8, delay: 0.4, duration: 0.8 });
      later(c, 0.25, () => sfx('charge', 0.5));
    });
    // her pearl catches the light
    at(c, 1.35, () => {
      const g = glint(new Graphics(), 0, 0, 70, 0xffffff);
      g.position.set(px, py);
      c.fg.addChild(g);
      sfx('gem', 2.4);
      later(c, 0.09, () => sfx('gem', 3.0));
      tin(0.7, { from: 1.5 });
      if (!c.reduce) {
        gsap.fromTo(g.scale, { x: 0.1, y: 0.1 }, { x: 1, y: 1, duration: 0.18, ease: 'back.out(2)' });
        gsap.to(g, { rotation: 0.6, duration: 0.6 });
      }
      gsap.to(g, { alpha: 0, delay: 0.45, duration: 0.3, onComplete: () => g.destroy() });
    });
    // …and she turns, very slowly, over her shoulder
    at(c, 1.7, () => {
      hmm(0.85, { from: 1.2 });
      sfx('purr', 1.4);
    });
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('reveal', 1.05);
    [1.0, 1.26, 1.5, 2.0].forEach((p, i) => later(c, i * 0.09, () => sfx('gem', p * 1.2)));
    flashOf(c, LIGHT, 0.3, 0.6);
    c.shaker.add(0.08);
    if (st) {
      if (c.reduce) {
        st.light.v = 1.25;
        st.gold.v = 1;
      } else {
        gsap.to(st.light, { v: 1.35, duration: 0.5, yoyo: true, repeat: 1, repeatDelay: 0.6 });
        gsap.to(st.gold, { v: 1, duration: 0.4 });
      }
    }
    const [px, py] = onCat(c, PEARL_AT[0], PEARL_AT[1]);
    const g = glint(new Graphics(), 0, 0, 110, 0xffffff);
    g.position.set(px, py);
    c.fg.addChild(g);
    if (!c.reduce) gsap.fromTo(g.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.22, ease: 'back.out(2)' });
    gsap.to(g, { alpha: 0, delay: 0.6, duration: 0.4, onComplete: () => g.destroy() });
    // gold dust off the pearl
    burst(
      c,
      c.fg,
      (i) => new Graphics().poly([0, -9, 2.4, 0, 0, 9, -2.4, 0]).fill(i % 3 ? OCHRE : PEARL),
      22,
      px,
      py,
      520,
      1.5,
    );
    if (st) st.land({ dur: 2.5, slow: true });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 1080;
    const L: Lay = { w, h, cx: w / 2 + Math.min(w * 0.12, h * 0.25), u };
    const base = new Graphics().rect(0, 0, w, h).fill(DARK);
    const rm = new Graphics();
    room(rm, L);
    const win = new Graphics();
    windowGlass(win, L, 1);
    const bm = new Graphics();
    bm.blendMode = 'add';
    beam(bm, L, 1);
    const mt = new Graphics();
    motes(mt, L, 3, 1);
    k.addChild(base, rm, win, bm, mt);
    if (live)
      liveLoop(k, (t) => {
        beam(bm, L, 0.85 + 0.15 * Math.sin(t * 0.8));
        motes(mt, L, t + 3, 1, 0.3 + 0.3 * Math.sin(t * 0.5));
      });
    return k;
  },
};

