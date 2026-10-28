/**
 * Sonrisa: the Wonderland universe (Carroll/Tenniel, public domain). It goes dark and a grin appears first, floating on
 * its own; then two eyes; then the cat fades in around it, stripe by stripe. Behind, a checkerboard spiral turns like
 * the bottom of a rabbit hole, and playing cards and teacups float past. «aquí todos estamos locos…» Payoff: ¡AQUÍ NO
 * HAY NADIE! — and the words vanish letter by letter, leaving only a grin.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, CHEER, backlight, burst, cover, every, later, score } from './kit';
import { borrowCat, letters, liveLoop, stash } from './kitB';

const VIOLET = 0xa45ee5;
const NIGHT = 0x140b24;
const PALE = 0xb9a2e0;
const PINK = 0xe0559b;
/** where her grin is in her painting, and the band her body covers (stripes reveal it) */
const GRIN: [number, number] = [0, -114];
const BODY: [number, number] = [-240, 250];

/** the checkerboard spiral (a twisted polar checkerboard), drawn once and turned */
function spiral(R: number, rings: number, sectors: number, twist: number): Graphics {
  const g = new Graphics();
  const q = Math.pow(R / 30, 1 / rings);
  for (let i = 0; i < rings; i++) {
    const r0 = 30 * Math.pow(q, i);
    const r1 = 30 * Math.pow(q, i + 1);
    const a = Math.min(0.62, 0.06 + (i / rings) * 0.7);
    for (let j = 0; j < sectors; j++) {
      if ((i + j) % 2) continue;
      const a0 = ((j + i * twist) / sectors) * Math.PI * 2;
      const a1 = ((j + 1 + i * twist) / sectors) * Math.PI * 2;
      const b0 = ((j + (i + 1) * twist) / sectors) * Math.PI * 2;
      const b1 = ((j + 1 + (i + 1) * twist) / sectors) * Math.PI * 2;
      const pts: number[] = [];
      for (let s = 0; s <= 3; s++) {
        const t = a0 + ((a1 - a0) * s) / 3;
        pts.push(Math.cos(t) * r0, Math.sin(t) * r0);
      }
      for (let s = 3; s >= 0; s--) {
        const t = b0 + ((b1 - b0) * s) / 3;
        pts.push(Math.cos(t) * r1, Math.sin(t) * r1);
      }
      g.poly(pts).fill({ color: PALE, alpha: a });
    }
  }
  return g;
}

/** the grin, alone: a crescent of teeth (w = its width) */
function grin(w: number): Graphics {
  const g = new Graphics();
  const h = w * 0.45;
  g.moveTo(-w / 2, 0).quadraticCurveTo(0, h * 0.28, w / 2, 0).quadraticCurveTo(0, h * 1.25, -w / 2, 0).fill(0xfff6e4).stroke({ width: w * 0.035, color: PINK, join: 'round' });
  g.moveTo(-w * 0.44, h * 0.18).quadraticCurveTo(0, h * 0.72, w * 0.44, h * 0.18).stroke({ width: w * 0.015, color: 0x5a3a6a });
  for (let i = -4; i <= 4; i++) {
    const x = (i / 4.6) * (w / 2);
    const top = 0.14 * h * (1 - (x / (w / 2)) ** 2) + h * 0.02;
    const bot = h * 0.62 * (1 - (x / (w / 2)) ** 2);
    g.moveTo(x, top).lineTo(x, bot).stroke({ width: w * 0.012, color: 0x5a3a6a });
  }
  g.moveTo(-w / 2, 0).quadraticCurveTo(0, h * 1.25, w / 2, 0).stroke({ width: w * 0.03, color: C.ink, join: 'round' });
  return g;
}

/** two slit eyes (they blink) */
function eyes(w: number): Container {
  const k = new Container();
  for (const sx of [-1, 1]) {
    const e = new Graphics()
      .ellipse(0, 0, w * 0.17, w * 0.1)
      .fill({ color: 0xd8e040, alpha: 0.25 })
      .ellipse(0, 0, w * 0.13, w * 0.07)
      .fill(0xd8e040)
      .stroke({ width: w * 0.015, color: C.ink })
      .ellipse(0, 0, w * 0.02, w * 0.065)
      .fill(C.ink);
    e.position.set(sx * w * 0.28, -w * 0.32);
    e.rotation = sx * 0.18;
    k.addChild(e);
  }
  return k;
}

/** a playing card (suit 0 ♥, 1 ♠, 2 ♦, 3 ♣) */
function card(suit: number, s = 1): Graphics {
  const g = new Graphics().roundRect(-32 * s, -45 * s, 64 * s, 90 * s, 7 * s).fill(0xfbf8f0).stroke({ width: 3 * s, color: C.ink });
  const red = suit % 2 === 0;
  const col = red ? 0xc8102e : C.ink;
  const pip = (x: number, y: number, k: number) => {
    if (suit === 0) g.circle(x - 6 * k, y - 4 * k, 7 * k).fill(col).circle(x + 6 * k, y - 4 * k, 7 * k).fill(col).poly([x - 13 * k, y - 1 * k, x + 13 * k, y - 1 * k, x, y + 14 * k]).fill(col);
    else if (suit === 1) g.circle(x - 6 * k, y + 3 * k, 7 * k).fill(col).circle(x + 6 * k, y + 3 * k, 7 * k).fill(col).poly([x - 13 * k, y + 1 * k, x + 13 * k, y + 1 * k, x, y - 14 * k]).fill(col).poly([x, y + 4 * k, x + 5 * k, y + 14 * k, x - 5 * k, y + 14 * k]).fill(col);
    else if (suit === 2) g.poly([x, y - 14 * k, x + 10 * k, y, x, y + 14 * k, x - 10 * k, y]).fill(col);
    else g.circle(x, y - 6 * k, 6 * k).fill(col).circle(x - 7 * k, y + 3 * k, 6 * k).fill(col).circle(x + 7 * k, y + 3 * k, 6 * k).fill(col).poly([x, y, x + 5 * k, y + 14 * k, x - 5 * k, y + 14 * k]).fill(col);
  };
  pip(0, 0, 1.3 * s);
  pip(-20 * s, -32 * s, 0.45 * s);
  pip(20 * s, 32 * s, 0.45 * s);
  return g;
}

/** a teacup on its saucer */
function teacup(i: number, s = 1): Graphics {
  const col = [0xf4a6c8, 0x8fd8d0, 0xf6e08a][i % 3];
  const g = new Graphics();
  g.ellipse(0, 26 * s, 50 * s, 11 * s).fill(0xfbf8f0).stroke({ width: 3 * s, color: C.ink });
  g.arc(36 * s, 2 * s, 14 * s, -1.6, 1.6).stroke({ width: 6 * s, color: C.ink }).arc(36 * s, 2 * s, 14 * s, -1.6, 1.6).stroke({ width: 3 * s, color: col });
  g.poly([-38 * s, -18 * s, 38 * s, -18 * s, 26 * s, 20 * s, -26 * s, 20 * s]).fill(col).stroke({ width: 3 * s, color: C.ink, join: 'round' });
  g.ellipse(0, -18 * s, 38 * s, 8 * s).fill(0x8a4a2a).stroke({ width: 3 * s, color: 0xd9b45a });
  for (let k = 0; k < 3; k++) g.circle(-16 * s + k * 16 * s, 2 * s + (k % 2) * 6 * s, 4 * s).fill(0xfbf8f0);
  return g;
}

/** things float up past us (we are the ones falling) */
function rise(c: SigCtx, layer: Container, make: (i: number) => Graphics, n: number, over: number, dur: number) {
  if (c.reduce) return;
  for (let i = 0; i < n; i++)
    later(c, (i / n) * over, () => {
      const p = make(i);
      const x = Math.random() < 0.5 ? 80 + Math.random() * 560 : W - 80 - Math.random() * 560;
      p.position.set(x, H + 100);
      p.rotation = Math.random() * 6;
      layer.addChild(p);
      gsap.to(p, { y: -140, x: x + (Math.random() - 0.5) * 300, rotation: p.rotation + (Math.random() - 0.5) * 6, duration: dur * (0.8 + Math.random() * 0.4), ease: 'none', onComplete: () => destroyTree(p) });
      gsap.to(p.scale, { x: -1, duration: 0.3 + Math.random() * 0.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    });
}

interface St {
  spin: { v: number };
  grinK: Container;
}
const S = stash<St>();
const borrowed = new WeakMap<Container, ReturnType<typeof borrowCat>>();

export const sonrisa: Signature = {
  dark: true,
  frame: VIOLET,
  tag: 'UNIVERSO MARAVILLAS',
  open(c: SigCtx) {
    // the dark comes first, at once; the spiral fades in behind the grin
    c.back.addChild(cover(NIGHT));
    const k = new Container();
    const sp = spiral(1400, 16, 22, 0.55);
    sp.position.set(W / 2, c.CY);
    k.addChild(sp);
    // a dark well in the middle, so she reads against it
    const well = backlight(NIGHT, 520, 1.6);
    well.position.set(W / 2, c.CY);
    k.addChild(well);
    c.back.addChild(k);
    gsap.to(c.circle, { alpha: 0, duration: 0 });
    const rim = backlight(VIOLET, 380, 0.6);
    rim.position.set(W / 2, c.catY);
    c.behind.addChild(rim);
    const spin = { v: 0.12 };
    // the floating grin (and the eyes): alone first, then it settles onto her face
    const gk = new Container();
    const gr = grin(240);
    const ey = eyes(240);
    gk.addChild(ey, gr);
    gk.position.set(W / 2 + GRIN[0], c.catY + GRIN[1]);
    c.fg.addChild(gk);
    S.set(c, { spin, grinK: gk });
    if (!c.reduce) {
      every(c, 60, (t) => {
        if (sp.destroyed) return;
        sp.rotation += spin.v / 60;
        sp.scale.set(1 + ((t * 0.08) % 0.4));
        spin.v += (0.12 - spin.v) * 0.02;
        if (!gk.destroyed) gk.y = c.catY + GRIN[1] + Math.sin(t * 2.2) * 10;
      });
    }
    if (c.short) {
      gk.alpha = 0;
      return;
    }

    // the dark; the grin; the eyes
    if (!c.reduce) {
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.7, delay: 0.55 });
      gsap.fromTo(gr, { alpha: 0 }, { alpha: 1, duration: 0.35 });
      gsap.fromTo(gr.scale, { x: 0.4, y: 0.4 }, { x: 1, y: 1, duration: 0.5, ease: 'back.out(2)' });
    }
    ey.alpha = 0;
    later(c, 0.32, () => {
      ey.alpha = 1;
      if (!c.reduce) gsap.fromTo(ey.scale, { y: 0.1 }, { y: 1, duration: 0.12, repeat: 1, yoyo: false });
      sfx('tick', 2.4);
    });
    // the cat fades in around the grin, stripe by stripe (even stripes first: she's striped)
    if (!c.reduce) {
      const cat = borrowCat(c);
      borrowed.set(c.root, cat);
      const m = cat.mask();
      const y0 = c.catY + BODY[0];
      const y1 = c.catY + BODY[1];
      const gy = c.catY + GRIN[1];
      const sh = 30;
      const rows: number[] = [];
      for (let y = y0; y < y1; y += sh) rows.push(y);
      rows.sort((a, b) => Math.abs(a - gy) - Math.abs(b - gy));
      const order = [...rows.filter((_, i) => i % 2 === 0), ...rows.filter((_, i) => i % 2 === 1)];
      const shown: number[] = [];
      const t0 = 0.55;
      order.forEach((y, i) =>
        later(c, t0 + i * 0.045, () => {
          if (cat.given || !m || m.destroyed) return;
          shown.push(y);
          m.clear();
          for (const yy of shown) m.rect(0, yy, W, sh + 1).fill(0xffffff);
          if (i % 3 === 0) sfx('tick', 1.6 + (i / order.length) * 1.6);
        }),
      );
      later(c, t0 + order.length * 0.045 + 0.05, () => cat.give());
      // the floating grin settles onto her face and melts into it
      gsap.to(gk.scale, { x: 0.32, y: 0.32, duration: 0.7, delay: 1.25, ease: 'power2.inOut' });
      gsap.to(gk, { alpha: 0, duration: 0.4, delay: 1.7 });
    } else gsap.to(gk, { alpha: 0, duration: 0.3, delay: 1.6 });
    // cards and teacups float past
    rise(c, c.back, (i) => (i % 3 === 2 ? teacup(i, 1.1) : card(i % 4, 1.2)), 16, 1.9, 2.2);
    rise(c, c.fg, (i) => card((i + 1) % 4, 1.5), 4, 1.6, 1.8);
    score(c, [
      [0.02, 'purr', 1.1],
      [0.2, 'whoosh', 0.5],
      [1.0, 'purr', 1.3],
    ]);
    later(c, 1.0, () => {
      const t = txt('aquí todos estamos locos…', { fontFamily: F.serif, fontStyle: 'italic', fontWeight: '700', fontSize: 54, fill: 0xf2e6ff, stroke: { color: 0x1a0d2e, width: 8, join: 'round' } });
      t.anchor.set(0.5);
      t.position.set(W / 2, 900);
      c.fg.addChild(t);
      gsap.fromTo(t, { alpha: 0 }, { alpha: 0.95, duration: 0.4 });
      gsap.to(t, { alpha: 0, delay: 1.0, duration: 0.4, onComplete: () => destroyTree(t) });
    });
  },
  payoff(c: SigCtx) {
    borrowed.get(c.root)?.give();
    const st = S.get(c);
    sfx('reveal', 1.25);
    sfx('purr', 1.6);
    later(c, 0.1, () => sfx('gem', 1.1));
    if (st) st.spin.v = -2.2;
    burst(c, c.fg, (i) => (i % 4 === 3 ? teacup(i, 0.8) : card(i % 4, 0.9)), 16, W / 2, c.catY, 820, 1.3);
    // ¡AQUÍ NO HAY NADIE!, then the letters vanish one by one, and only a grin is left
    const k = new Container();
    const pool = backlight(NIGHT, 300, 1.5);
    pool.scale.set(1.5, 0.9);
    k.addChild(pool);
    const rows = [letters('¡AQUÍ NO', 132, 0xffffff, F.comic, 0x1a0d2e, 16), letters('HAY NADIE!', 132, 0xffffff, F.comic, 0x1a0d2e, 16)];
    rows[0].k.position.set(-40, -62);
    rows[1].k.position.set(30, 62);
    for (const r of rows) k.addChild(r.k);
    const all = [...rows[0].ts, ...rows[1].ts];
    const s0 = Math.min(1, 760 / Math.max(rows[0].width, rows[1].width));
    k.scale.set(s0);
    k.position.set(CHEER[0], CHEER[1] - 10);
    k.rotation = -0.05;
    c.fg.addChild(k);
    all.forEach((l, i) => {
      l.style.fill = i % 2 ? 0xffffff : 0xe2b8ff;
      if (c.reduce) return;
      gsap.fromTo(l, { alpha: 0 }, { alpha: 1, duration: 0.15, delay: i * 0.025 });
      gsap.fromTo(l.scale, { x: 1.7, y: 1.7 }, { x: 1, y: 1, duration: 0.3, delay: i * 0.025, ease: 'back.out(2)' });
    });
    const gone = c.reduce ? 2.2 : 1.6;
    all.forEach((l, i) => gsap.to(l, { alpha: 0, delay: gone + (c.reduce ? 0 : i * 0.06), duration: c.reduce ? 0.4 : 0.18 }));
    const g = grin(220);
    g.position.set(0, -20);
    g.alpha = 0;
    k.addChild(g);
    gsap.to(g, { alpha: 1, delay: gone + (c.reduce ? 0.2 : all.length * 0.06), duration: 0.3 });
    gsap.to(k, { alpha: 0, delay: gone + (c.reduce ? 1.4 : all.length * 0.06 + 1.1), duration: 0.5, onComplete: () => destroyTree(k) });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = Math.min(w, h) / 300;
    k.addChild(new Graphics().rect(0, 0, w, h).fill(NIGHT));
    const sp = spiral(Math.hypot(w, h) * 0.6, 9, 14, 0.55);
    sp.position.set(w / 2, h * 0.48);
    const well = backlight(NIGHT, Math.min(w, h) * 0.5, 1.4);
    well.position.set(w / 2, h * 0.48);
    const g = grin(90 * u);
    g.position.set(w * 0.8, h * 0.16);
    g.rotation = 0.15;
    const e = eyes(90 * u);
    e.position.copyFrom(g.position);
    e.rotation = 0.15;
    const c1 = card(0, 0.55 * u);
    c1.position.set(w * 0.13, h * 0.28);
    c1.rotation = -0.4;
    const c2 = card(1, 0.5 * u);
    c2.position.set(w * 0.9, h * 0.78);
    c2.rotation = 0.5;
    const cup = teacup(0, 0.5 * u);
    cup.position.set(w * 0.12, h * 0.82);
    cup.rotation = 0.2;
    k.addChild(sp, well, c1, c2, cup, e, g);
    if (live)
      liveLoop(k, 30, (t) => {
        sp.rotation = t * 0.15;
        g.y = h * 0.16 + Math.sin(t * 2) * 4 * u;
        e.y = g.y;
        g.alpha = 0.6 + 0.4 * Math.abs(Math.sin(t * 0.5));
        e.alpha = g.alpha;
      });
    return k;
  },
};
