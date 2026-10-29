/**
 * Michiércoles: the gothic universe (the goth girl of the spooky family). A gothic school at midnight in the rain:
 * pointed stained-glass windows glowing violet, teal and crimson, a rose window behind her, spires, a gargoyle; we're on
 * the roof, by a stone balustrade where the crows sit. Thunder; the crows take off (¡CRAA!); at the edge of the roof a
 * black cello plays by itself, its bow sawing alone — VRRRMMM. Then a black curtain swoops shut and tears open (¡FUAP!)
 * on the gloom: a cold spotlight on her and, behind, a row of shadow dancers copying her abrupt, angular dance beat for
 * beat without understanding it. «…no estoy sonriendo.» (No helping hand anywhere — per the owner.)
 * Payoff: lightning, every window blazes, the crows burst out; «…qué asco, alegría.» (no está sonriendo)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, arrive, bolt, burst, every, flashOf, later, score, word } from './kit';
import { hideDisc } from './kitA';
import { fadeKill, stash, vgrad } from './kitB';
import { beat, borrowPose, floatWord, headline, pay, say } from './kitC';
import { ngon, rnd, streak } from './kitD';
import { cone, curtain, rain, strip } from './kitH';
import { liveLoop } from '../../../panels/collection/cardArt';
import { settings } from '../../../core/settings';

const NIGHT = 0x0a0812;
const STONE = 0x2a2634;
const STONE_L = 0x3a3446;
const LEAD = 0x0e0c14;
const GLASS = [0x7a3ac8, 0x2a9a9a, 0xb8203a, 0xd9a63a, 0x4a5ad9];
const VIOLET = 0x5b3a7a;
const BONE = 0xe8e2f0;

/** a pointed (lancet) arch as points: center x, bottom y, half-width, height */
function lancet(x: number, y: number, hw: number, h: number): number[] {
  const p: number[] = [x - hw, y, x - hw, y - h * 0.62];
  for (let i = 1; i <= 5; i++) {
    const u = i / 6;
    p.push(x - hw + hw * (1 - Math.cos((u * Math.PI) / 2)) * 1, y - h * 0.62 - (h * 0.38) * Math.sin((u * Math.PI) / 2));
  }
  p.push(x, y - h);
  for (let i = 5; i >= 1; i--) {
    const u = i / 6;
    p.push(x + hw - hw * (1 - Math.cos((u * Math.PI) / 2)), y - h * 0.62 - (h * 0.38) * Math.sin((u * Math.PI) / 2));
  }
  p.push(x + hw, y - h * 0.62, x + hw, y);
  return p;
}

/** a stained-glass lancet: lead frame, colored panes (glow `g` 0..1) */
function window_(gr: Graphics, x: number, y: number, hw: number, h: number, glow: number, seed: number) {
  gr.poly(lancet(x, y, hw + 8, h + 10)).fill(STONE_L);
  gr.poly(lancet(x, y, hw, h)).fill(LEAD);
  const r = rnd(seed);
  const cols = 3;
  const rows = 6;
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const x0 = x - hw + 4 + (i * (hw * 2 - 8)) / cols;
      const x1 = x - hw + 4 + ((i + 1) * (hw * 2 - 8)) / cols - 4;
      const y1 = y - 4 - (j * (h * 0.62 - 8)) / rows;
      const y0 = y - 4 - ((j + 1) * (h * 0.62 - 8)) / rows + 4;
      gr.rect(x0, y0, x1 - x0, y1 - y0).fill({ color: GLASS[Math.floor(r() * GLASS.length)], alpha: 0.35 + 0.6 * glow });
    }
  // the tracery at the top: a quatrefoil
  const ty = y - h * 0.78;
  for (let q = 0; q < 4; q++) {
    const a = (q / 4) * Math.PI * 2;
    gr.poly(ngon(x + Math.cos(a) * hw * 0.28, ty + Math.sin(a) * hw * 0.28, hw * 0.24, hw * 0.24, 8)).fill({ color: GLASS[q % GLASS.length], alpha: 0.35 + 0.6 * glow });
  }
}

/** the school and the roof (one Graphics, w×h, scale k, centered on cx); `glow` lights the glass */
function school(g: Graphics, w: number, h: number, k: number, cx: number, glow: number) {
  g.clear();
  vgrad(g, 0, 0, w, h * 0.7, [0x05040a, NIGHT, 0x1e1630], 10);
  // heavy clouds
  const r = rnd(2);
  for (let i = 0; i < 9; i++) g.poly(ngon(r() * w, 60 * k + r() * 160 * k, (160 + r() * 200) * k, (30 + r() * 30) * k, 12)).fill({ color: 0x1a1626, alpha: 0.8 });
  // the facade: two wings and the central tower with spires
  const base = h * 0.78;
  g.rect(0, base - 420 * k, w, 420 * k).fill(STONE);
  for (let x = 0; x < w; x += 46 * k) g.rect(x, base - 444 * k, 26 * k, 26 * k).fill(STONE);
  g.rect(cx - 260 * k, base - 640 * k, 520 * k, 640 * k).fill(STONE);
  g.poly([cx - 300 * k, base - 640 * k, cx, base - 900 * k, cx + 300 * k, base - 640 * k]).fill(0x221e2c);
  for (const sx of [cx - 280 * k, cx + 280 * k, cx - 900 * k, cx + 900 * k, cx - 600 * k, cx + 600 * k]) {
    const top = Math.abs(sx - cx) < 400 * k ? base - 640 * k : base - 420 * k;
    g.rect(sx - 22 * k, top - 120 * k, 44 * k, 120 * k).fill(STONE_L);
    g.poly([sx - 30 * k, top - 120 * k, sx, top - 250 * k, sx + 30 * k, top - 120 * k]).fill(0x221e2c);
  }
  // the rose window behind her head
  const ry = base - 470 * k;
  g.poly(ngon(cx, ry, 150 * k, 150 * k, 24)).fill(STONE_L);
  g.poly(ngon(cx, ry, 136 * k, 136 * k, 24)).fill(LEAD);
  for (let i = 0; i < 12; i++) {
    const a0 = (i / 12) * Math.PI * 2;
    const a1 = ((i + 0.85) / 12) * Math.PI * 2;
    g.poly([cx + Math.cos(a0) * 30 * k, ry + Math.sin(a0) * 30 * k, cx + Math.cos(a0) * 128 * k, ry + Math.sin(a0) * 128 * k, cx + Math.cos(a1) * 128 * k, ry + Math.sin(a1) * 128 * k, cx + Math.cos(a1) * 30 * k, ry + Math.sin(a1) * 30 * k]).fill({ color: GLASS[i % GLASS.length], alpha: 0.35 + 0.6 * glow });
  }
  g.poly(ngon(cx, ry, 24 * k, 24 * k, 12)).fill({ color: 0xd9a63a, alpha: 0.5 + 0.5 * glow });
  // lancet windows along the wings
  let seed = 3;
  for (let x = cx - 1000 * k; x < cx + 1060 * k; x += 170 * k) {
    if (Math.abs(x - cx) < 330 * k) continue;
    window_(g, x, base - 110 * k, 44 * k, 230 * k, glow, seed++);
  }
  // a gargoyle on the left spire's ledge
  const gx = cx - 600 * k;
  const gy = base - 430 * k;
  g.poly([gx - 10 * k, gy, gx + 60 * k, gy - 10 * k, gx + 80 * k, gy - 40 * k, gx + 60 * k, gy - 60 * k, gx + 40 * k, gy - 44 * k, gx + 20 * k, gy - 70 * k, gx, gy - 40 * k]).fill(0x1a1622);
  // the roof we stand on: wet flagstones and a stone balustrade
  g.rect(0, base, w, h - base).fill(0x1c1824);
  for (let i = 0; i < 6; i++) g.rect(0, base + 20 * k + i * 44 * k, w, 2 * k).fill(0x2a2634);
  for (let i = 0; i < 7; i++) g.poly(ngon(r() * w, base + 60 * k + r() * 160 * k, (60 + r() * 60) * k, (10 + r() * 6) * k, 12)).fill({ color: 0x5a4a7a, alpha: 0.25 });
  const rail = base - 30 * k;
  g.rect(0, rail - 16 * k, w, 22 * k).fill(STONE_L);
  for (let x = 20 * k; x < w; x += 54 * k) {
    g.poly([x - 10 * k, base + 10 * k, x - 14 * k, rail + 30 * k, x - 8 * k, rail + 6 * k, x + 8 * k, rail + 6 * k, x + 14 * k, rail + 30 * k, x + 10 * k, base + 10 * k]).fill(STONE);
  }
  g.rect(0, base + 6 * k, w, 14 * k).fill(STONE_L);
}

/** the black cello (origin at its endpin on the floor; s = scale), standing on its own */
function cello(s: number) {
  const k = new Container();
  const g = new Graphics();
  const body = [0, -40, 70, -60, 92, -130, 70, -200, 52, -230, 70, -280, 64, -340, 30, -370, -30, -370, -64, -340, -70, -280, -52, -230, -70, -200, -92, -130, -70, -60].map((v) => v * s);
  g.poly(streak(0, 0, 0, -40 * s, 3 * s, 3 * s)).fill(0x8a8a9a);
  g.poly(body).fill(0x1a1020).stroke({ width: 4 * s, color: 0x000000, join: 'round' });
  g.poly(body.map((v, i) => (i % 2 ? v * 0.95 - 8 * s : v * 0.86))).fill({ color: VIOLET, alpha: 0.25 });
  // the neck, the scroll, the fingerboard, the f-holes, the bridge
  g.poly(streak(0, -360 * s, 0, -560 * s, 12 * s, 9 * s)).fill(0x0a0610);
  g.poly(ngon(0, -580 * s, 16 * s, 22 * s, 10)).fill(0x1a1020).stroke({ width: 3 * s, color: 0x000000 });
  for (const sd of [-1, 1]) g.poly(strip([sd * 34 * s, -150 * s, sd * 42 * s, -190 * s, sd * 30 * s, -240 * s], 3 * s)).fill(0x000000);
  g.rect(-22 * s, -150 * s, 44 * s, 8 * s).fill(0xb8a48a);
  const strings = new Graphics();
  k.addChild(g, strings);
  return { k, strings };
}
function drawStrings(g: Graphics, s: number, t: number, buzz: number) {
  g.clear();
  for (let i = 0; i < 4; i++) {
    const x = (-12 + i * 8) * s;
    const pts: number[] = [];
    for (let j = 0; j <= 8; j++) {
      const u = j / 8;
      pts.push(x + Math.sin(u * Math.PI) * Math.sin(t * 60 + i) * 4 * s * buzz, -150 * s - u * 400 * s);
    }
    g.poly(strip(pts, 0.9 * s)).fill(0xd9d2c0);
  }
}

/** a crow (origin at its feet), wings `flap` (0 folded … 1 up) */
function crowPts(s: number, flap: number): number[][] {
  const body = [-30, -20, -10, -36, 16, -40, 30, -52, 44, -50, 52, -44, 40, -40, 30, -30, 10, -14, -20, -8, -48, -4].map((v) => v * s);
  const up = -40 - flap * 50;
  const wing = [-6 * s, -30 * s, -40 * s, up * s, -10 * s, (up + 16) * s, 14 * s, -32 * s];
  return [body, wing];
}
function crow(s: number, flap = 0) {
  const g = new Graphics();
  const [b, wg] = crowPts(s, flap);
  g.poly(b).fill(0x07060a);
  g.poly(wg).fill(0x07060a);
  g.poly(ngon(38 * s, -48 * s, 2 * s, 2 * s, 6)).fill(0xd9d2c0);
  return g;
}

/** a shadow dancer in pose p (0–3): a cat in a black dress with two braids, its forelegs at angular angles */
function dancer(g: Graphics, x: number, y: number, s: number, p: number) {
  const col = 0x050408;
  g.poly([x - 50 * s, y, x - 30 * s, y - 150 * s, x + 30 * s, y - 150 * s, x + 50 * s, y]).fill(col);
  g.rect(x - 26 * s, y, 14 * s, 30 * s).fill(col).rect(x + 12 * s, y, 14 * s, 30 * s).fill(col);
  g.poly(ngon(x, y - 186 * s, 38 * s, 36 * s, 10)).fill(col);
  g.poly([x - 34 * s, y - 200 * s, x - 26 * s, y - 244 * s, x - 6 * s, y - 214 * s]).fill(col).poly([x + 34 * s, y - 200 * s, x + 26 * s, y - 244 * s, x + 6 * s, y - 214 * s]).fill(col);
  g.poly(strip([x - 30 * s, y - 176 * s, x - 40 * s, y - 130 * s, x - 34 * s, y - 90 * s], 7 * s)).fill(col);
  g.poly(strip([x + 30 * s, y - 176 * s, x + 40 * s, y - 130 * s, x + 34 * s, y - 90 * s], 7 * s)).fill(col);
  // the white collar
  g.poly([x - 26 * s, y - 150 * s, x, y - 132 * s, x + 26 * s, y - 150 * s, x, y - 144 * s]).fill(BONE);
  // each pose: where the two forepaws are (relative to the hips)
  const POSES: [number, number][][] = [
    [
      [-70, -110],
      [-40, -200],
    ],
    [
      [60, -190],
      [80, -120],
    ],
    [
      [-90, -150],
      [90, -150],
    ],
    [
      [-40, -90],
      [70, -220],
    ],
  ];
  const arms = POSES[p % 4];
  const shoulders: [number, number][] = [
    [-26, -140],
    [26, -140],
  ];
  arms.forEach((a, i) => {
    const [sx, sy] = shoulders[i];
    const mx = (sx + a[0]) / 2 + (i ? 14 : -14);
    const my = (sy + a[1]) / 2 - 20;
    g.poly(strip([x + sx * s, y + sy * s, x + mx * s, y + my * s, x + a[0] * s, y + a[1] * s], 8 * s)).fill(col);
  });
  // one leg kicked out on pose 3
  if (p % 4 === 3) g.poly(strip([x + 20 * s, y - 10 * s, x + 60 * s, y + 10 * s, x + 90 * s, y - 10 * s], 8 * s)).fill(col);
}

/** a music note (a filled head, stem, flag) */
function note(s = 1) {
  return new Graphics().poly(ngon(0, 0, 14 * s, 10 * s, 10, -0.4)).fill(0x9a92b0).poly(streak(12 * s, -4 * s, 12 * s, -60 * s, 2.5 * s, 2.5 * s)).fill(0x9a92b0).poly([12 * s, -60 * s, 34 * s, -40 * s, 30 * s, -32 * s, 12 * s, -48 * s]).fill(0x9a92b0);
}

interface St {
  pose: ReturnType<typeof borrowPose> | null;
  glow: { v: number };
  fx: Container;
}
const S = stash<St>();
const BPM = 112;
const BEAT = 60 / BPM;

export const michiercoles: Signature = {
  dark: true,
  frame: VIOLET,
  tag: 'UNIVERSO GÓTICO',
  open(c: SigCtx) {
    const k = new Container();
    const g = new Graphics();
    const glow = { v: c.short ? 1 : 0.5 };
    school(g, W, H, 1, W / 2, glow.v);
    const ce = cello(1.05);
    ce.k.position.set(W - 300, H * 0.78 + 40);
    ce.k.rotation = 0.08;
    const bow = new Graphics().poly(streak(-200, 0, 200, 0, 3, 2)).fill(0x2a1a10).rect(-200, -6, 400, 3).fill(0xe8e2d0).rect(-214, -10, 26, 14).fill(0x0a0610);
    bow.position.set(W - 300, H * 0.78 + 40 - 180);
    bow.rotation = -0.25;
    const rg = new Graphics();
    const crows = new Container();
    const perch: Graphics[] = [];
    for (let i = 0; i < 4; i++) {
      const cr = crow(1.1 + (i % 2) * 0.2);
      cr.position.set(140 + i * 130, H * 0.78 - 48);
      cr.scale.x = i % 2 ? -1 : 1;
      crows.addChild(cr);
      perch.push(cr);
    }
    const gloom = new Graphics().rect(0, 0, W, H).fill({ color: 0x0c0614, alpha: 0.72 });
    gloom.visible = !!c.short;
    const spot = new Graphics();
    cone(spot, W / 2, -40, W / 2, H * 0.78, 30, 300, 0xd8e0ff, 0.26, 3);
    // a dim violet light behind each shadow dancer, so their angles read
    for (const x of [W / 2 - 620, W / 2 - 400, W / 2 + 400, W / 2 + 640]) for (let i = 6; i >= 1; i--) spot.poly(ngon(x, H * 0.78 - 170, 34 * i, 52 * i, 16)).fill({ color: 0x9a7ad8, alpha: 0.05 });
    spot.blendMode = 'add';
    spot.visible = !!c.short;
    const dancers = new Graphics();
    dancers.visible = !!c.short;
    const fx = new Container();
    k.addChild(g, ce.k, bow, crows, gloom, spot, dancers, rg, fx);
    c.back.addChild(k);
    arrive(c, k, 0.2);
    hideDisc(c, 0.15);
    const poseN = { v: 0 };
    const pose = c.short || c.reduce ? null : borrowPose(c);
    S.set(c, { pose, glow, fx });
    const DX = [W / 2 - 620, W / 2 - 400, W / 2 + 400, W / 2 + 640];
    const drawDancers = () => {
      dancers.clear();
      DX.forEach((x, i) => dancer(dancers, x, H * 0.78 + 20 - (i === 0 || i === 3 ? 0 : 30), i === 0 || i === 3 ? 1.5 : 1.25, poseN.v));
    };
    drawDancers();
    let lastGlow = glow.v;
    const frame = (t: number) => {
      if (rg.destroyed) return;
      rg.clear();
      rain(rg, 0, 0, W, H, t, 150, 8, 0xbfb8e0, 0.3, 0.18, 50);
      drawStrings(ce.strings, 1.05, t, 1);
      if (!bow.destroyed) bow.x = W - 300 + Math.sin(t * 5) * 80;
      if (Math.abs(glow.v - lastGlow) > 0.02) {
        school(g, W, H, 1, W / 2, glow.v);
        lastGlow = glow.v;
      }
    };
    frame(0);
    // Reducir movimiento: no motion, but the state changes (a cut, a light, a flip) still land: redraw still frames
    every(c, c.reduce ? 4 : 30, (t) => frame(c.reduce ? 0 : t));
    if (c.short) return;

    // thunder; the crows take off
    score(c, [
      [0.02, 'splash', 0.5],
      [0.18, 'boom', 0.45],
    ]);
    beat(c, 0.12, () => {
      flashOf(c, 0xd8d0ff, 0.45, 0.25);
      const b = new Graphics();
      bolt(b, 300 + Math.random() * 300, 0, 520, 320, 0xe8e2ff, 6, 9, 60);
      fx.addChild(b);
      fadeKill(b, 0.12, 0.15);
      if (c.reduce) glow.v = 0.9;
      else gsap.fromTo(glow, { v: 1 }, { v: 0.5, duration: 0.6 });
    });
    beat(c, 0.35, () => {
      sfx('meow', 0.5);
      word(c, 330, 520, '¡CRAA!', BONE, 84, 0.7);
      perch.forEach((cr, i) => {
        if (cr.destroyed) return;
        cr.clear();
        const [b, wg] = crowPts(1.1 + (i % 2) * 0.2, 1);
        cr.poly(b).fill(0x07060a).poly(wg).fill(0x07060a);
        if (c.reduce) cr.visible = false;
        else gsap.to(cr, { x: cr.x - 200 + i * 60, y: -100 - i * 40, duration: 0.8, delay: i * 0.05, ease: 'power1.in' });
      });
    });
    // the cello plays itself, low
    beat(c, 0.45, () => {
      sfx('charge', 0.35);
      floatWord(c, c.fg, W - 380, 360, 'VRRRMMM…', { fontFamily: F.serif, fontStyle: 'italic', fontWeight: '700', fontSize: 52, fill: 0x9a92b0, stroke: { color: C.ink, width: 7, join: 'round' } }, 40, 1.0);
      for (let i = 0; i < (c.reduce ? 1 : 3); i++)
        later(c, i * 0.15, () => {
          const n = note(1.2);
          n.position.set(W - 340 + i * 40, 520);
          fx.addChild(n);
          if (!c.reduce) gsap.to(n, { y: 300 - i * 30, x: n.x - 60 + i * 50, duration: 0.9, ease: 'sine.out' });
          fadeKill(n, 0.6, 0.3);
        });
    });
    // the black curtain swoops shut… and tears open on the gloom
    const cur = new Container();
    const cl = new Graphics();
    curtain(cl, 0, 0, W / 2 + 40, H, 0x0c0a10, 0x000000, 0x2a1e3a, 8, 0, -1);
    const cr = new Graphics();
    curtain(cr, 0, 0, W / 2 + 40, H, 0x0c0a10, 0x000000, 0x2a1e3a, 8, 0, 1);
    cl.x = -W / 2 - 60;
    cr.x = W + 20;
    cur.addChild(cl, cr);
    c.fg.addChild(cur);
    const gloomOn = () => {
      if (gloom.destroyed) return;
      gloom.visible = true;
      spot.visible = true;
      dancers.visible = true;
    };
    if (c.reduce) {
      beat(c, 0.9, gloomOn);
      later(c, 1, () => !cur.destroyed && cur.destroy({ children: true }));
    } else {
      beat(c, 0.72, () => {
        sfx('whoosh', 0.6);
        gsap.to(cl, { x: -40, duration: 0.14, ease: 'power3.in' });
        gsap.to(cr, { x: W / 2 - 40, duration: 0.14, ease: 'power3.in' });
      });
      beat(c, 0.95, () => {
        gloomOn();
        sfx('whoosh', 1.4);
        sfx('hit', 0.6);
        gsap.to(cl, { x: -W / 2 - 80, duration: 0.12, ease: 'power3.out' });
        gsap.to(cr, { x: W + 40, duration: 0.12, ease: 'power3.out', onComplete: () => !cur.destroyed && cur.destroy({ children: true }) });
        word(c, W / 2 - 520, 300, '¡FUAP!', BONE, 100, 0.6);
      });
      later(c, 1.4, () => !cur.destroyed && cur.destroy({ children: true }));
    }
    // the dance: abrupt, angular, on the beat; the shadows copy her
    const steps: [number, number, number][] = [
      [-0.14, -24, -30],
      [0.12, 0, 26],
      [-0.06, -40, 0],
      [0.16, -10, -20],
      [0, 0, 0],
    ];
    steps.forEach(([rot, dy, dx], i) =>
      beat(c, 1.05 + i * BEAT, () => {
        sfx('tick', 0.7 + (i % 2) * 0.2);
        sfx('boom', 0.35);
        poseN.v = i;
        if (!dancers.destroyed) drawDancers();
        if (pose && !pose.given && !c.cat.destroyed) {
          c.cat.rotation = rot;
          c.cat.position.set(pose.x0 + dx, pose.y0 + dy);
        }
      }),
    );
    later(c, 1.05 + 4 * BEAT + 0.05, () => pose?.give());
    later(c, 2.15, () => pose?.give());
    beat(c, 1.9, () => say(c, c.fg, W / 2 + 330, 230, '…no estoy sonriendo.', 0.55, { size: 42, tail: 'left', font: F.serif, fill: BONE }));
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    st?.pose?.give();
    sfx('boom', 0.5);
    sfx('fanfare', 0.8);
    c.shaker.add(0.3);
    flashOf(c, 0xd8d0ff, 0.6, 0.35);
    if (st) {
      if (c.reduce) st.glow.v = 1;
      else gsap.fromTo(st.glow, { v: 1.4 }, { v: 1, duration: 1.2 });
      if (!st.fx.destroyed) {
        const b = new Graphics();
        bolt(b, W - 420, 0, W - 260, 420, 0xe8e2ff, 7, 10, 70);
        st.fx.addChild(b);
        fadeKill(b, 0.15, 0.2);
      }
    }
    burst(c, c.fg, (i) => crow(0.8 + (i % 3) * 0.15, i % 2), 12, W / 2, c.catY - 120, 900, 1.5);
    headline(c, '…qué asco, alegría.', { fontFamily: F.serif, fontStyle: 'italic', fontWeight: '700', fontSize: 92, fill: BONE, stroke: { color: C.ink, width: 12, join: 'round' } }, { aside: '(no está sonriendo)', asideStyle: { fontSize: 40, fill: 0xb8a8d8 }, dur: 2.4, slow: true });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const s = m / 1080;
    const g = new Graphics();
    school(g, w, h, s * 1.05, w / 2, 0.7);
    const ce = cello(s * 1.05);
    ce.k.position.set(Math.min(w - 120 * s, w / 2 + m * 0.62), h * 0.78 + 30 * s);
    ce.k.rotation = 0.08;
    drawStrings(ce.strings, s * 1.05, 0, 0);
    const crows = new Graphics();
    for (let i = 0; i < 3; i++) {
      const [b, wg] = crowPts(s * 1.2, 0);
      const ox = Math.max(60 * s, w / 2 - m * 0.66) + i * 120 * s;
      const oy = h * 0.78 - 50 * s;
      crows.poly(b.map((v, j) => (j % 2 ? v + oy : v * (i % 2 ? -1 : 1) + ox))).fill(0x07060a);
      crows.poly(wg.map((v, j) => (j % 2 ? v + oy : v * (i % 2 ? -1 : 1) + ox))).fill(0x07060a);
    }
    const rg = new Graphics();
    rain(rg, 0, 0, w, h, 0.3, Math.round(60 * (w / m)), 8, 0xbfb8e0, 0.3, 0.18, 50 * s);
    const flash = new Graphics().rect(0, 0, w, h).fill(0xd8d0ff);
    flash.alpha = 0;
    k.addChild(g, ce.k, crows, rg, flash);
    if (live)
      liveLoop(k, (t) => {
        rg.clear();
        rain(rg, 0, 0, w, h, t, Math.round(60 * (w / m)), 8, 0xbfb8e0, 0.3, 0.18, 50 * s);
        drawStrings(ce.strings, s * 1.05, t, 0.6);
        // a soft lightning now and then
        const q = t % 5.5;
        flash.alpha = !settings.reduceFlashes && q < 0.12 ? 0.22 * (1 - q / 0.12) : 0;
      });
    return k;
  },
};

