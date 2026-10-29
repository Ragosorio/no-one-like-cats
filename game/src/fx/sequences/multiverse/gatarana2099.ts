/**
 * Gato Araña 2099: the neon future. The screen glitches in (torn red/cyan slices) onto a cyberpunk megacity at night —
 * towers edged in red and blue neon, holographic ads, a synthwave grid racing toward you, flying cars streaking by with
 * light trails. A hologram scan runs down his silhouette («COINCIDENCIA: 2099»), his angular red spider sigil buzzes on
 * in neon behind him, a car shoots past right in front of the camera. Payoff: three neon claw slashes rip the screen,
 * a chromatic glitch; ¡GARRA NEÓN!
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, CHEER, backlight, cheer, cover, every, flashOf, later, score, word } from './kit';
import { cardLoop, hideDisc, scanlines } from './kitA';

const CYAN = 0x3ad1ff;
const RED = 0xff2d4a;
const MAGENTA = 0xff2fa8;
const NAVY = 0x060a22;
const HZ = 0.64;

/** the megacity: navy sky with a red haze at the horizon, far towers with window grids and neon edges, antennas */
function city(w = W, h = H, s = 1): { k: Container; boards: Container[] } {
  const k = new Container();
  const sky = new Graphics();
  const bands = [0x050820, 0x08102e, 0x0c163c, 0x141a48, 0x261a50, 0x3e1646];
  bands.forEach((b, i) => sky.rect(0, (i * h * HZ) / bands.length, w, (h * HZ) / bands.length + 2).fill(b));
  sky.rect(0, h * HZ, w, h).fill(NAVY);
  k.addChild(sky);
  const hz = h * HZ;
  const far = new Graphics();
  let x = -20 * s;
  let i = 0;
  while (x < w) {
    const tw = (60 + ((i * 47) % 70)) * s;
    const th = (220 + ((i * 131) % 380)) * s;
    far.rect(x, hz - th, tw, th).fill(i % 2 ? 0x0d1433 : 0x111a40);
    for (let wy = hz - th + 12 * s; wy < hz - 6 * s; wy += 16 * s)
      for (let wx = x + 6 * s; wx < x + tw - 6 * s; wx += 12 * s) if ((Math.floor(wx / s) * 7 + Math.floor(wy / s) * 3 + i) % 9 < 3) far.rect(wx, wy, 5 * s, 6 * s).fill({ color: i % 3 ? CYAN : 0xbfe8ff, alpha: 0.55 });
    // neon edges and a beacon
    far.rect(x, hz - th, 3 * s, th).fill({ color: i % 2 ? RED : CYAN, alpha: 0.8 });
    if (i % 3 === 0) far.rect(x + tw / 2 - 2 * s, hz - th - 50 * s, 4 * s, 50 * s).fill(0x2a3150).circle(x + tw / 2, hz - th - 52 * s, 5 * s).fill(RED);
    x += tw + 8 * s;
    i++;
  }
  k.addChild(far);
  // the horizon glow
  const glow = new Graphics();
  for (let j = 0; j < 6; j++) glow.rect(0, hz - 30 * s + j * 10 * s, w, 12 * s).fill({ color: MAGENTA, alpha: 0.12 - j * 0.015 });
  k.addChild(glow);
  // two near towers framing the screen, each with a holo-ad
  const near = new Graphics();
  near.poly([0, 0, 250 * s, 0, 290 * s, hz + 40 * s, 0, hz + 40 * s]).fill(0x070b1e);
  near.poly([w, 0, w - 230 * s, 0, w - 270 * s, hz + 40 * s, w, hz + 40 * s]).fill(0x070b1e);
  near.rect(246 * s, 0, 5 * s, hz).fill({ color: RED, alpha: 0.9 });
  near.rect(w - 234 * s, 0, 5 * s, hz).fill({ color: CYAN, alpha: 0.9 });
  k.addChild(near);
  const boards = [
    holo('CROQUETAS 2099', 210 * s, 150 * s, CYAN, s),
    holo('MIAU-COLA', 190 * s, 140 * s, MAGENTA, s),
  ];
  boards[0].position.set(20 * s, 210 * s);
  boards[1].position.set(w - 210 * s, 360 * s);
  k.addChild(...boards);
  return { k, boards };
}

/** a holographic ad: translucent panel, scanlines, a cat-head icon and a line of text */
function holo(text: string, bw: number, bh: number, col: number, s = 1): Container {
  const k = new Container();
  const g = new Graphics().rect(0, 0, bw, bh).fill({ color: col, alpha: 0.16 }).stroke({ width: 3 * s, color: col, alpha: 0.9 });
  for (let y = 4 * s; y < bh; y += 6 * s) g.rect(0, y, bw, 2 * s).fill({ color: col, alpha: 0.12 });
  const cx = bw / 2;
  const cy = bh * 0.42;
  const r = bh * 0.22;
  g.poly([cx - r, cy - r * 0.2, cx - r * 0.8, cy - r * 1.3, cx - r * 0.25, cy - r * 0.8, cx + r * 0.25, cy - r * 0.8, cx + r * 0.8, cy - r * 1.3, cx + r, cy - r * 0.2, cx + r * 0.7, cy + r * 0.8, cx - r * 0.7, cy + r * 0.8]).stroke({ width: 3 * s, color: col });
  g.circle(cx - r * 0.38, cy, r * 0.13).fill(col).circle(cx + r * 0.38, cy, r * 0.13).fill(col);
  k.addChild(g);
  const t = txt(text, { fontFamily: F.bebas, fontSize: Math.max(10, 30 * s), fill: col, letterSpacing: 2 * s });
  t.anchor.set(0.5, 0);
  t.position.set(bw / 2, bh * 0.72);
  if (t.width > bw * 0.92) t.scale.set((bw * 0.92) / t.width);
  k.addChild(t);
  return k;
}

/** the synthwave grid racing toward the viewer (`t` scrolls it) */
function grid(g: Graphics, w: number, h: number, t: number, s = 1) {
  g.clear();
  const hz = h * HZ;
  g.rect(0, hz, w, h - hz).fill(NAVY);
  for (let i = 0; i < 14; i++) {
    const p = ((i + ((t * 1.6) % 1)) / 14) ** 2.2;
    const y = hz + (h - hz) * p;
    g.moveTo(0, y).lineTo(w, y).stroke({ width: Math.max(1, 3 * p * s + 1), color: i % 2 ? MAGENTA : CYAN, alpha: 0.25 + p * 0.5 });
  }
  for (let i = -12; i <= 12; i++) {
    const xb = w / 2 + i * 170 * s;
    g.moveTo(w / 2 + i * 14 * s, hz).lineTo(xb + (xb - w / 2) * 1.4, h).stroke({ width: 2 * s, color: MAGENTA, alpha: 0.45 });
  }
}

/** the angular spider sigil, in neon tubes (outer glow, tube, hot core) */
function sigil(g: Graphics, sc: number, col: number, on = 1) {
  g.clear();
  if (on <= 0.01) return;
  const P = (pts: number[]) => pts.map((v) => v * sc);
  const body = P([0, -150, 62, -78, 46, 46, 0, 170, -46, 46, -62, -78, 0, -150]);
  const head = P([0, -110, 30, -70, 0, -36, -30, -70, 0, -110]);
  const legs = [
    [50, -60, 190, -190, 250, -110],
    [56, -20, 250, -60, 300, 40],
    [48, 30, 230, 110, 220, 230],
    [30, 80, 140, 220, 90, 320],
  ].map((l) => P(l));
  const all = [body, head, ...legs, ...legs.map((l) => l.map((v, j) => (j % 2 === 0 ? -v : v)))];
  for (const [wd, c2, a] of [
    [34, col, 0.14 * on],
    [16, col, 0.5 * on],
    [6, 0xffe0e6, 0.95 * on],
  ] as const) {
    for (const pts of all) {
      g.moveTo(pts[0], pts[1]);
      for (let j = 2; j < pts.length; j += 2) g.lineTo(pts[j], pts[j + 1]);
      g.stroke({ width: wd * Math.max(0.5, sc), color: c2, alpha: a, join: 'miter', cap: 'round' });
    }
  }
}

interface Car {
  y: number;
  x: number;
  v: number;
  sz: number;
}
/** a flying car: sleek body, cyan glass, a headlight beam ahead and a red tail-light trail behind */
function car(g: Graphics, c: Car) {
  const d = Math.sign(c.v);
  const s = c.sz;
  const L = Math.min(900, Math.abs(c.v) * 0.18) * s;
  g.moveTo(c.x - d * 40 * s, c.y).lineTo(c.x - d * (40 * s + L), c.y + 2 * s).stroke({ width: 6 * s, color: RED, alpha: 0.75, cap: 'round' });
  g.moveTo(c.x - d * 40 * s, c.y - 6 * s).lineTo(c.x - d * (40 * s + L * 0.6), c.y - 4 * s).stroke({ width: 3 * s, color: 0xffb0bc, alpha: 0.6, cap: 'round' });
  g.poly([c.x + d * 40 * s, c.y - 4 * s, c.x + d * 260 * s, c.y - 30 * s, c.x + d * 260 * s, c.y + 26 * s]).fill({ color: 0xbfe8ff, alpha: 0.1 });
  g.poly([c.x - d * 44 * s, c.y + 8 * s, c.x - d * 36 * s, c.y - 10 * s, c.x - d * 6 * s, c.y - 22 * s, c.x + d * 26 * s, c.y - 20 * s, c.x + d * 46 * s, c.y - 2 * s, c.x + d * 40 * s, c.y + 10 * s]).fill(0x1c2340).stroke({ width: 3 * s, color: CYAN, alpha: 0.9 });
  g.poly([c.x - d * 4 * s, c.y - 19 * s, c.x + d * 22 * s, c.y - 18 * s, c.x + d * 34 * s, c.y - 6 * s, c.x - d * 4 * s, c.y - 6 * s]).fill({ color: CYAN, alpha: 0.7 });
  g.circle(c.x + d * 42 * s, c.y + 2 * s, 5 * s).fill(0xffffff);
}

interface Neon {
  sigil: Graphics;
}
const state = new WeakMap<SigCtx, Neon>();

export const gatarana2099: Signature = {
  dark: true,
  frame: CYAN,
  tag: 'UNIVERSO 2099',
  open(c: SigCtx) {
    const ct = city();
    c.back.addChild(ct.k);
    const gr = new Graphics();
    c.back.addChild(gr);
    const traffic = new Graphics();
    c.back.addChild(traffic);
    c.back.addChild(scanlines(W, H, 4, 0.14));
    hideDisc(c, 0.15);
    const glow = backlight(RED, 380, 0.5);
    glow.position.set(W / 2, c.catY);
    c.behind.addChild(glow);
    const sg = new Graphics();
    sg.position.set(W / 2, c.catY - 10);
    c.behind.addChild(sg);
    // drawn once; it buzzes through its alpha
    sigil(sg, 1.05, RED, 1);
    state.set(c, { sigil: sg });
    const near = new Graphics();
    c.fg.addChild(near);
    const cars: Car[] = [
      { y: 230, x: 200, v: 520, sz: 0.7 },
      { y: 285, x: 1500, v: -440, sz: 0.8 },
      { y: 330, x: 600, v: 640, sz: 0.85 },
      { y: 400, x: 900, v: 860, sz: 1.05 },
      { y: 470, x: 300, v: -1000, sz: 1.25 },
      { y: 560, x: 1200, v: 1300, sz: 1.5 },
      { y: 640, x: 1700, v: -1500, sz: 1.7 },
    ];
    const SON = { on: c.short || c.reduce ? 1 : 0 };
    const drawAll = (t: number, dt: number) => {
      if (gr.destroyed) return;
      grid(gr, W, H, t);
      traffic.clear();
      for (const k of cars) {
        k.x += k.v * dt;
        if (k.v > 0 && k.x > W + 400) k.x = -400;
        if (k.v < 0 && k.x < -400) k.x = W + 400;
        car(traffic, k);
      }
      sg.alpha = SON.on * (c.flashes ? 0.85 + Math.random() * 0.15 : 1);
      // the holo-ads flicker now and then
      if (c.flashes) for (const b of ct.boards) b.alpha = Math.random() < 0.06 ? 0.3 : 1;
    };
    if (c.reduce) {
      drawAll(0, 0);
      for (const b of ct.boards) b.alpha = 1;
      sg.alpha = 1;
      return;
    }
    let last = 0;
    every(c, 50, (t) => {
      drawAll(t, Math.min(0.05, t - last));
      last = t;
    });
    if (c.short) return;

    // the glitch-in: torn red/cyan slices over a jittering city
    const gl = new Graphics();
    c.fg.addChild(gl);
    const stopGl = every(c, 30, () => {
      if (gl.destroyed) return;
      gl.clear();
      for (let i = 0; i < 9; i++) {
        const y = Math.random() * H;
        const hh = 10 + Math.random() * 70;
        gl.rect((Math.random() - 0.5) * 300, y, W, hh).fill({ color: i % 2 ? RED : CYAN, alpha: c.flashes ? 0.35 : 0.15 });
      }
      ct.k.x = (Math.random() - 0.5) * 40;
    });
    later(c, 0.42, () => {
      stopGl();
      gl.destroy();
      ct.k.x = 0;
    });
    score(c, [
      [0.0, 'glitch', 1.0],
      [0.18, 'glitch', 1.4],
      [0.3, 'zap', 2.2],
    ]);
    // the hologram scan runs down his silhouette
    const scan = new Graphics();
    c.fg.addChild(scan);
    const hud = txt('ESCANEANDO…', { fontFamily: F.bebas, fontSize: 40, fill: CYAN, letterSpacing: 6 });
    hud.anchor.set(0.5);
    hud.position.set(W / 2, c.catY + 320);
    hud.alpha = 0;
    c.fg.addChild(hud);
    const S = { p: 0 };
    const x0 = W / 2 - 290;
    const x1 = W / 2 + 290;
    const y0 = c.catY - 280;
    const y1 = c.catY + 280;
    const drawScan = () => {
      if (scan.destroyed) return;
      scan.clear();
      const y = y0 + (y1 - y0) * S.p;
      for (let gy = y0; gy < y; gy += 28) scan.moveTo(x0, gy).lineTo(x1, gy);
      for (let gx = x0; gx <= x1; gx += 36) scan.moveTo(gx, y0).lineTo(gx, y);
      scan.stroke({ width: 1.5, color: CYAN, alpha: 0.3 });
      scan.rect(x0, y - 50, x1 - x0, 50).fill({ color: CYAN, alpha: 0.12 });
      scan.moveTo(x0 - 30, y).lineTo(x1 + 30, y).stroke({ width: 5, color: 0xd8f6ff });
      const L = 50;
      for (const [cx, cy, sx, sy] of [
        [x0, y0, 1, 1],
        [x1, y0, -1, 1],
        [x1, y1, -1, -1],
        [x0, y1, 1, -1],
      ])
        scan.moveTo(cx, cy + sy * L).lineTo(cx, cy).lineTo(cx + sx * L, cy);
      scan.stroke({ width: 6, color: CYAN });
    };
    later(c, 0.2, () => {
      hud.alpha = 1;
      gsap.to(S, { p: 1, duration: 0.7, ease: 'none', onUpdate: drawScan });
      sfx('charge', 1.8);
    });
    later(c, 0.95, () => {
      if (!hud.destroyed) {
        hud.text = 'COINCIDENCIA: ARÁCNIDO · 2099';
        hud.style.fill = RED;
      }
      sfx('tick', 2.6);
      sfx('tick', 3.1);
      gsap.to(scan, { alpha: 0, duration: 0.3, delay: 0.25, onComplete: () => scan.destroy() });
    });
    later(c, 2.05, () => gsap.to(hud, { alpha: 0, duration: 0.25, onComplete: () => hud.destroy() }));
    // the sigil buzzes on, neon by neon
    [0.55, 0.62, 0.7, 0.78, 0.86].forEach((t, i) => later(c, t, () => (SON.on = i % 2 ? 0.25 : 1)));
    later(c, 0.9, () => {
      SON.on = 1;
      sfx('zap', 0.9);
      sfx('hit', 0.6);
      c.shaker.add(0.2);
    });
    later(c, 1.3, () => word(c, W / 2, 150, '¡AÑO 2099!', CYAN, 104, 1.1, F.glitch));
    // a car shoots past right in front of the camera
    later(c, 1.55, () => {
      const k: Car = { y: c.catY + 330, x: -700, v: 4200, sz: 2.6 };
      sfx('whoosh', 0.8);
      sfx('whoosh', 1.3);
      const stop = every(c, 60, () => {
        if (near.destroyed) return;
        k.x += k.v / 60;
        near.clear();
        car(near, k);
        if (k.x > W + 900) {
          stop();
          near.clear();
        }
      });
      c.shaker.add(0.2);
    });
  },
  payoff(c: SigCtx) {
    const st = state.get(c);
    sfx('crit', 1.2);
    sfx('zap', 1.6);
    sfx('glitch', 0.8);
    c.shaker.add(0.5);
    // three neon claw slashes rip across the screen
    const sl = new Graphics();
    c.fg.addChild(sl);
    const P = [0, 0, 0].map(() => ({ p: c.reduce ? 1 : 0 }));
    const draw = () => {
      if (sl.destroyed) return;
      sl.clear();
      P.forEach((q, i) => {
        if (q.p <= 0) return;
        const ax = W * 0.8 + i * 110;
        const ay = 70 + i * 30;
        const bx = W * 0.22 + i * 110;
        const by = H - 90 + i * 10;
        const ex = ax + (bx - ax) * q.p;
        const ey = ay + (by - ay) * q.p;
        for (const [wd, col, a] of [
          [70, RED, 0.18],
          [34, RED, 0.6],
          [12, 0xfff0f2, 1],
        ] as const)
          sl.moveTo(ax, ay).lineTo(ex, ey).stroke({ width: wd, color: col, alpha: a, cap: 'round' });
      });
    };
    if (c.reduce) {
      draw();
      later(c, 1.2, () => sl.destroy());
    } else {
      P.forEach((q, i) => gsap.to(q, { p: 1, duration: 0.11, delay: i * 0.07, ease: 'power3.in', onUpdate: draw }));
      gsap.to(sl, { alpha: 0, delay: 1.0, duration: 0.45, onComplete: () => sl.destroy() });
      // the chromatic glitch
      if (c.flashes) {
        const r = cover(RED, 0.18);
        const b = cover(CYAN, 0.18);
        c.fg.addChild(r, b);
        gsap.fromTo(r, { x: -30 }, { x: 0, alpha: 0, duration: 0.35, onComplete: () => r.destroy() });
        gsap.fromTo(b, { x: 30 }, { x: 0, alpha: 0, duration: 0.35, onComplete: () => b.destroy() });
      }
      flashOf(c, 0xffd6dc, 0.45, 0.3);
    }
    if (st && !c.reduce) gsap.fromTo(st.sigil.scale, { x: 1.2, y: 1.2 }, { x: 1, y: 1, duration: 0.5, ease: 'elastic.out(1.2,0.4)' });
    score(c, [
      [0.07, 'crit', 1.4],
      [0.14, 'crit', 1.6],
      [0.5, 'fanfare', 1.3],
    ]);
    cheer(c, '¡GARRA NEÓN!', CYAN, 92, 1.9, F.glitch);
    later(c, 1.0, () => word(c, CHEER[0] + 40, CHEER[1] + 110, '…aquí también mandan los gatos.', C.paper, 40, 1.8, F.ui));
  },
  card(w: number, h: number, live: boolean) {
    const s = Math.max(0.3, Math.min(w, h) / 900);
    const ct = city(w, h, s);
    const k = ct.k;
    const gr = new Graphics();
    k.addChild(gr);
    grid(gr, w, h, 0.3, s);
    const sg = new Graphics();
    sg.position.set(w / 2, h * 0.45);
    k.addChild(sg);
    sigil(sg, (Math.min(w, h) / 1000) * 1.1, RED, 1);
    const tr = new Graphics();
    k.addChild(tr);
    const cars: Car[] = [
      { y: h * 0.22, x: w * 0.2, v: 140 * s, sz: 0.5 * s },
      { y: h * 0.34, x: w * 0.7, v: -200 * s, sz: 0.7 * s },
    ];
    for (const cc of cars) car(tr, cc);
    k.addChild(scanlines(w, h, Math.max(3, 4 * s), 0.12));
    if (live) {
      let last = 0;
      cardLoop(k, 30, (t) => {
        grid(gr, w, h, t, s);
        tr.clear();
        const dt = Math.min(0.05, t - last);
        last = t;
        for (const cc of cars) {
          cc.x += cc.v * dt;
          if (cc.v > 0 && cc.x > w + 120) cc.x = -120;
          if (cc.v < 0 && cc.x < -120) cc.x = w + 120;
          car(tr, cc);
        }
        sg.alpha = 0.85 + Math.random() * 0.15;
      });
    }
    return k;
  },
};
