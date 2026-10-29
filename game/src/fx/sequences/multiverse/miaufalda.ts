/**
 * Miaufalda: the comic-strip universe (an Argentine newspaper strip about a girl who worries about the world and hates
 * soup). The screen is a newspaper page — masthead, a headline that asks «¿POR QUÉ EXISTE LA SOPA?», grey columns —
 * and across it the ink draws a four-panel strip, one panel at a time: a bowl of soup far away on the table («¿Sopa?»),
 * closer («¿OTRA VEZ SOPA?»), so close it fills the panel and its steam looks back with angry eyes («¡GLUP!»), and in
 * the last panel the world itself, spinning with a bandage on it («Pobre mundo.»). A peace sign gets doodled in the
 * margin in red pen; the wet ink dries with a shine. Her silhouette is pure ink between the panels.
 * Payoff: the three bowls get kicked out of the strip, splashing, peace signs and little worlds fly, the globe spins
 * happy; ¡SOPA NO! (…y una curita para el mundo.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { liveLoop } from '../../../panels/collection/cardArt';
import { type Signature, type SigCtx, burst, every, later, score } from './kit';
import { hideDisc } from './kitA';
import { fadeKill, rng, stash } from './kitB';
import { beat, pay, smooth } from './kitC';
import { balloon, drive, ngon, say, streak } from './kitD';
import { type Prepped, lazy, prepTitle, prepWord, ringPts } from './kitG';

const PAPER = 0xf4f0e3;
const PAPER_D = 0xe6e0cc;
const INK = 0x151515;
const GREY = 0xa29d90;
const RED = 0xd62839;
const OCEAN = 0x4aa3df;
const LAND = 0x5cb85c;
const LAND2 = 0xe8c440;
const TAPE = 0xf2a65a;

/** the newspaper page behind everything: paper, masthead, headline, grey columns (w×h; u = scale) */
function page(w: number, h: number, u: number, o: { top: number; band: [number, number]; seed: number; masthead: boolean }) {
  const k = new Container();
  const g = new Graphics().rect(0, 0, w, h).fill(PAPER);
  // a faint fold and the paper's tooth
  g.rect(w / 2 - 2 * u, 0, 4 * u, h).fill({ color: PAPER_D, alpha: 0.6 });
  const r = rng(o.seed);
  for (let i = 0; i < Math.round((w * h) / (140 * 140 * u * u)); i++) g.rect(r() * w, r() * h, 2 * u, 2 * u).fill({ color: GREY, alpha: 0.25 });
  // columns of text (grey lines) above and below the strip
  const lines = new Graphics();
  const col = 300 * u;
  const gap = 26 * u;
  const block = (y0: number, y1: number) => {
    for (let x = 40 * u; x + col <= w - 30 * u; x += col + gap)
      for (let y = y0; y < y1; y += 22 * u) {
        const len = r() < 0.12 ? col * (0.3 + r() * 0.5) : col;
        lines.rect(x, y, len, 9 * u);
      }
  };
  block(o.band[1] + 36 * u, h + 20 * u);
  if (o.top > 0) block(o.top, o.band[0] - 28 * u);
  lines.fill({ color: GREY, alpha: 0.55 });
  k.addChild(g, lines);
  if (o.masthead) {
    const m = new Graphics();
    m.rect(40 * u, 22 * u, w - 80 * u, 4 * u).fill(INK).rect(40 * u, 150 * u, w - 80 * u, 3 * u).fill(INK).rect(40 * u, 158 * u, w - 80 * u, 1.5 * u).fill(INK);
    const t = txt('La Gaceta Gatuna', { fontFamily: F.news, fontSize: 92 * u, fill: INK });
    t.anchor.set(0.5, 0);
    t.position.set(w / 2, 34 * u);
    const d1 = txt('AÑO VI · Nº 1964 · MARTES', { fontFamily: F.serif, fontWeight: '700', fontSize: 20 * u, fill: INK, letterSpacing: 2 });
    d1.position.set(48 * u, 120 * u);
    const d2 = txt('PRECIO: UNA CROQUETA', { fontFamily: F.serif, fontWeight: '700', fontSize: 20 * u, fill: INK, letterSpacing: 2 });
    d2.anchor.set(1, 0);
    d2.position.set(w - 48 * u, 120 * u);
    const hl = txt('¿POR QUÉ EXISTE LA SOPA?', { fontFamily: F.serif, fontWeight: '900', fontSize: 52 * u, fill: INK, letterSpacing: 1 });
    hl.anchor.set(0.5, 0);
    hl.position.set(w / 2, 168 * u);
    k.addChild(m, t, d1, d2, hl);
  }
  return k;
}

/** a panel's ink border drawn up to `f` (0..1) of its perimeter (thick, slightly brushy) */
function border(g: Graphics, x: number, y: number, w: number, h: number, f: number, lw: number) {
  g.clear();
  const per = 2 * (w + h);
  let left = f * per;
  const seg = (x0: number, y0: number, x1: number, y1: number) => {
    const L = Math.hypot(x1 - x0, y1 - y0);
    if (left <= 0) return;
    const k = Math.min(1, left / L);
    left -= L;
    g.poly(streak(x0, y0, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, lw * 0.55, lw * 0.45)).fill(INK);
  };
  seg(x, y, x + w, y);
  seg(x + w, y, x + w, y + h);
  seg(x + w, y + h, x, y + h);
  seg(x, y + h, x, y);
}

/** a bowl of soup in ink (origin at the bowl's rim center; r = half-width): white bowl, hatched broth, a spoon */
function bowl(r: number) {
  const k = new Container();
  const g = new Graphics();
  const lw = Math.max(2, r * 0.07);
  // the table's shadow, the foot, the bowl, the rim
  g.poly(ngon(0, r * 0.98, r * 0.9, r * 0.12, 18)).fill({ color: INK, alpha: 0.18 });
  g.poly([-r * 0.34, r * 0.8, r * 0.34, r * 0.8, r * 0.42, r * 0.96, -r * 0.42, r * 0.96]).fill(PAPER).stroke({ width: lw, color: INK, join: 'round' });
  const body: number[] = [-r, 0];
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI - (i / 14) * Math.PI;
    body.push(Math.cos(a) * r, Math.sin(a) * r * 0.86);
  }
  g.poly(body).fill(0xffffff).stroke({ width: lw, color: INK, join: 'round' });
  // a stripe of decoration on the bowl
  g.poly(smooth([-r * 0.92, r * 0.28, 0, r * 0.4, r * 0.92, r * 0.28], 4, false).concat(smooth([r * 0.86, r * 0.4, 0, r * 0.52, -r * 0.86, r * 0.4], 4, false))).fill(RED);
  g.poly(ngon(0, 0, r, r * 0.26, 24)).fill(0xffffff).stroke({ width: lw, color: INK });
  g.poly(ngon(0, r * 0.02, r * 0.86, r * 0.2, 22)).fill(0xd8d2c0);
  // hatched broth
  const hatch = new Graphics();
  for (let j = -3; j <= 3; j++) {
    const yy = r * 0.02 + j * r * 0.05;
    const hw = r * 0.86 * Math.sqrt(Math.max(0, 1 - Math.pow((yy - r * 0.02) / (r * 0.2), 2)));
    if (hw > 4) hatch.rect(-hw * 0.9, yy - lw * 0.18, hw * 1.8, lw * 0.36);
  }
  hatch.fill({ color: INK, alpha: 0.7 });
  // noodles/veggies bits
  for (const [x, y] of [
    [-0.4, 0.02],
    [0.22, -0.04],
    [0.5, 0.06],
  ])
    g.poly(ngon(x * r, y * r, r * 0.07, r * 0.04, 6)).fill({ color: INK, alpha: 0.8 });
  // the spoon
  g.poly(streak(r * 0.3, 0, r * 1.15, -r * 0.62, lw * 0.9, lw * 0.6)).fill(0xffffff).stroke({ width: lw * 0.7, color: INK, join: 'round' });
  k.addChild(g, hatch);
  return k;
}

/**
 * the steam over a bowl at time t: `n` wavy curls (stroked smooth curves), `menace` 0..1 bends their tips into claws;
 * (x, y) = the rim, r = the bowl's half-width
 */
function drawSteam(g: Graphics, r: number, t: number, n: number, menace: number) {
  g.clear();
  const lw = Math.max(2, r * 0.055);
  for (let i = 0; i < n; i++) {
    const x0 = (i - (n - 1) / 2) * r * 0.42;
    const pts: number[] = [];
    const len = r * (1.1 + menace * 0.9);
    for (let j = 0; j <= 7; j++) {
      const k = j / 7;
      const sway = Math.sin(t * 3 + i * 1.7 + k * 5) * r * 0.12 * (0.4 + k);
      const claw = menace * Math.sin(k * Math.PI) * r * 0.25 * (i % 2 ? 1 : -1);
      pts.push(x0 + sway + claw, -r * 0.18 - k * len);
    }
    g.poly(smooth(pts, 4, false), false).stroke({ width: lw * (1.2 + 0.5 * menace), color: INK, cap: 'round', join: 'round', alpha: 0.85 });
    if (menace > 0.5) {
      const ex = pts[pts.length - 2];
      const ey = pts[pts.length - 1];
      g.poly(streak(ex, ey, ex + (i % 2 ? 1 : -1) * r * 0.16, ey + r * 0.12, lw * 0.5, 0.5)).fill(INK);
    }
  }
}

/** the angry steam's eyes (white ellipses, pupils, brows) */
function steamEyes(r: number) {
  const g = new Graphics();
  for (const s of [-1, 1]) {
    g.poly(ngon(s * r * 0.3, 0, r * 0.2, r * 0.13, 16)).fill(0xffffff).stroke({ width: r * 0.035, color: INK });
    g.poly(ngon(s * r * 0.25, r * 0.03, r * 0.07, r * 0.07, 10)).fill(INK);
    g.poly(streak(s * r * 0.52, -r * 0.2, s * r * 0.1, -r * 0.08, r * 0.04, r * 0.03)).fill(INK);
  }
  return g;
}

/** the world at time t: ocean, continents sliding round (squashed toward the limb), a bandage on the front */
function drawGlobe(g: Graphics, R: number, t: number, colorful = true) {
  g.clear();
  const lw = Math.max(2, R * 0.05);
  g.poly(ngon(0, 0, R, R, 30)).fill(colorful ? OCEAN : 0xffffff).stroke({ width: lw, color: INK });
  const lands: [number, number, number, number][] = [
    [0.2, -0.38, 0.46, 0.3],
    [1.3, 0.12, 0.38, 0.5],
    [2.4, -0.22, 0.56, 0.3],
    [3.5, 0.36, 0.36, 0.26],
    [4.6, -0.08, 0.48, 0.38],
    [5.5, 0.48, 0.3, 0.18],
  ];
  lands.forEach(([lon, lat, sx, sy], i) => {
    const a = lon + t;
    const cz = Math.cos(a);
    if (cz < 0.08) return;
    const x = Math.sin(a) * R * Math.sqrt(1 - lat * lat);
    const y = lat * R;
    g.poly(ngon(x, y, sx * R * cz, sy * R, 10, i)).fill(colorful ? (i % 3 === 1 ? LAND2 : LAND) : 0xbdb8aa).stroke({ width: lw * 0.4, color: INK });
  });
  // a parallel and the limb's shading
  g.poly(ngon(0, 0, R * 0.98, R * 0.98, 30)).stroke({ width: lw * 0.5, color: INK, alpha: 0.25 });
  g.poly(streak(-R * 0.95, R * 0.3, R * 0.95, R * 0.3, lw * 0.25, lw * 0.25)).fill({ color: INK, alpha: 0.3 });
}

/** the bandage on the world (one rounded strip with dots and a pad, slanted, a little off-center as in the painting) */
function bandage(R: number) {
  const g = new Graphics();
  const rot = -0.55;
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const ox = R * 0.05;
  const oy = -R * 0.05;
  const P = (x: number, y: number) => [ox + x * c - y * s, oy + x * s + y * c];
  const L = R * 0.46;
  const h = R * 0.15;
  g.poly([P(-L, -h), P(L, -h), P(L + h * 0.5, 0), P(L, h), P(-L, h), P(-L - h * 0.5, 0)].flat()).fill(TAPE).stroke({ width: Math.max(1.5, R * 0.035), color: INK, join: 'round' });
  g.poly([P(-L * 0.3, -h * 0.85), P(L * 0.3, -h * 0.85), P(L * 0.3, h * 0.85), P(-L * 0.3, h * 0.85)].flat()).fill(0xf7d3a6);
  for (const dx of [-0.72, -0.52, 0.52, 0.72]) for (const dy of [-0.4, 0.4]) g.poly(ngon(...(P(dx * L, dy * h) as [number, number]), R * 0.022, R * 0.022, 5)).fill({ color: INK, alpha: 0.5 });
  return g;
}

/** a peace sign doodled in red pen */
function peace(r: number, color = RED) {
  const g = new Graphics();
  const lw = Math.max(2, r * 0.14);
  g.poly(ringPts(0, 0, r - lw / 2, r + lw / 2, 26)).fill(color);
  g.poly(streak(0, -r, 0, r, lw / 2, lw / 2)).fill(color);
  g.poly(streak(0, 0, -r * 0.7, r * 0.7, lw / 2, lw / 2)).fill(color);
  g.poly(streak(0, 0, r * 0.7, r * 0.7, lw / 2, lw / 2)).fill(color);
  return g;
}

/** a small heart (red) */
function heart(s: number) {
  return new Graphics().poly(smooth([0, s * 0.9, -s, 0, -s * 0.55, -s * 0.7, 0, -s * 0.3, s * 0.55, -s * 0.7, s, 0], 4)).fill(RED).stroke({ width: Math.max(2, s * 0.12), color: INK });
}

interface Panel {
  x: number;
  y: number;
  w: number;
  h: number;
  frame: Graphics;
  inner: Container;
}

interface St {
  bowls: Container[];
  spin: { v: number };
  title: () => Prepped;
}
const S = stash<St>();
const BAND: [number, number] = [252, 832];
const M = 40;
const GUT = 24;

export const miaufalda: Signature = {
  dark: false,
  frame: RED,
  tag: 'UNIVERSO DE LA TIRA',
  open(c: SigCtx) {
    const k = new Container();
    const pg = page(W, H, 1, { top: 0, band: BAND, seed: 1964, masthead: true });
    k.addChild(pg);
    const pw = (W - 2 * M - 3 * GUT) / 4;
    const ph = BAND[1] - BAND[0];
    const panels: Panel[] = [];
    for (let i = 0; i < 4; i++) {
      const x = M + i * (pw + GUT);
      const frame = new Graphics();
      const inner = new Container();
      // the panel's own paper (whiter than the page) under its border
      inner.addChild(new Graphics().rect(x, BAND[0], pw, ph).fill(0xfbf8ee));
      k.addChild(inner, frame);
      panels.push({ x, y: BAND[0], w: pw, h: ph, frame, inner });
    }
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const quick = c.short || c.reduce;
    if (!quick) {
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.25 });
    }
    // the table line in the first three panels; bowls far → near; the world in the fourth
    const sizes = [46, 92, 150];
    const bowls: Container[] = [];
    const steams: { g: Graphics; r: number; menace: number }[] = [];
    const spots: [number, number][] = [
      [panels[0].x + pw * 0.48, BAND[1] - 170],
      [panels[1].x + pw * 0.36, BAND[1] - 190],
      [panels[2].x + pw * 0.66, BAND[1] - 230],
    ];
    const contents: Container[] = [];
    for (let i = 0; i < 3; i++) {
      const p = panels[i];
      const ct = new Container();
      const tl = new Graphics().rect(p.x, BAND[1] - 120 + i * 10, p.w, 5).fill(INK);
      for (let j = 0; j < 9; j++) tl.rect(p.x + j * (p.w / 9) + 8, BAND[1] - 104 + i * 10, p.w / 18, 2.5);
      tl.fill({ color: INK, alpha: 0.4 });
      const b = bowl(sizes[i]);
      b.position.set(...spots[i]);
      const st = new Graphics();
      st.position.set(...spots[i]);
      ct.addChild(tl, st, b);
      if (i === 2) {
        const eyes = steamEyes(sizes[i]);
        eyes.position.set(spots[i][0], spots[i][1] - sizes[i] * 1.5);
        ct.addChild(eyes);
      }
      // scale pops around the panel's center
      ct.pivot.set(p.x + p.w / 2, p.y + p.h / 2);
      ct.position.set(p.x + p.w / 2, p.y + p.h / 2);
      p.inner.addChild(ct);
      bowls.push(b);
      steams.push({ g: st, r: sizes[i], menace: i === 2 ? 1 : 0 });
      contents.push(ct);
    }
    const p4 = panels[3];
    const globeK = new Container();
    const globe = new Graphics();
    const R = 128;
    drawGlobe(globe, R, 0);
    const band = bandage(R);
    globeK.addChild(globe, band);
    globeK.position.set(p4.x + p4.w * 0.56, BAND[0] + ph * 0.56);
    // little motion marks around the spinning world
    const marks = new Graphics();
    for (const s of [-1, 1]) marks.poly(smooth([s * (R + 22), -40, s * (R + 34), 0, s * (R + 22), 40], 4, false), false).stroke({ width: 4, color: INK });
    globeK.addChild(marks);
    p4.inner.addChild(globeK);
    contents.push(globeK);
    // the margin doodle
    const pz = peace(42);
    pz.position.set(W - 120, H - 92);
    pz.rotation = -0.12;
    k.addChild(pz);
    const spin = { v: 0.6 };
    const title = lazy(c, 0.95, () => prepTitle(c, '¡SOPA NO!', { fontFamily: F.comic, fontSize: 176, fill: RED, letterSpacing: 3, stroke: { color: INK, width: 16, join: 'round' }, dropShadow: { color: INK, distance: 9, angle: Math.PI / 3, blur: 0, alpha: 1 } }, { aside: '…y una curita para el mundo.', asideStyle: { fill: INK, stroke: { color: PAPER, width: 9, join: 'round' } }, maxW: 700 }));
    S.set(c, { bowls, spin, title });
    const frame = (t: number) => {
      steams.forEach((s) => !s.g.destroyed && drawSteam(s.g, s.r, t, s.r > 120 ? 4 : 3, s.menace));
      if (!globe.destroyed) drawGlobe(globe, R, t * spin.v * 2);
    };
    frame(0);
    if (!c.reduce) every(c, 30, frame);
    if (quick) {
      panels.forEach((p) => border(p.frame, p.x, p.y, p.w, p.h, 1, 7));
      if (c.short) return;
    } else {
      // the ink draws the panels one by one; each panel's drawing pops in after its border
      contents.forEach((ct) => (ct.alpha = 0));
      panels.forEach((p) => (p.inner.alpha = 0));
      pz.alpha = 0;
      panels.forEach((p, i) =>
        later(c, 0.08 + i * 0.4, () => {
          if (!p.inner.destroyed) gsap.to(p.inner, { alpha: 1, duration: 0.15 });
          drive(p.frame, 0, 1, 0.2, (f) => border(p.frame, p.x, p.y, p.w, p.h, f, 7), { ease: 'none' });
          sfx('pencil', 0.9 + i * 0.12);
          later(c, 0.16, () => {
            if (contents[i].destroyed) return;
            contents[i].alpha = 1;
            gsap.from(contents[i].scale, { x: 0.94, y: 0.94, duration: 0.15, ease: 'back.out(2)' });
          });
        }),
      );
    }
    score(c, [
      [0.0, 'paper', 1.0],
      [1.0, 'sting', 1.6],
      [1.75, 'paper', 0.8],
    ]);
    // the balloons, panel by panel
    const bl = (i: number, text: string, x: number, y: number, tx: number, ty: number, size = 38, hold = 1.9) =>
      beat(c, 0.3 + i * 0.4, () => say(c, panels[i].inner, balloon(text, { size, font: F.brush, tx, ty }), x, y, hold - i * 0.4, 0));
    bl(0, '¿Sopa?', panels[0].x + pw * 0.5, BAND[0] + 110, 0, 110);
    bl(1, '¿OTRA VEZ\nSOPA?', panels[1].x + pw * 0.42, BAND[0] + 120, 30, 130, 34);
    bl(3, 'Pobre mundo.', p4.x + pw * 0.5, BAND[0] + 80, -120, 60, 34, 2.6);
    const glup = lazy(c, 0.7, () => prepWord(c, panels[2].inner, panels[2].x + pw * 0.62, BAND[0] + 92, '¡GLUP!', 0xffffff, 64, 0.08));
    beat(c, 1.18, () => {
      glup().show(0.8);
      sfx('nyam', 0.6);
    });
    // the angry steam claws up a little
    beat(c, 1.0, () => {
      const s3 = steams[2];
      if (!c.reduce) drive(s3.g, 0.2, 1, 0.5, (v) => (s3.menace = v));
    });
    // the margin doodle: a peace sign in red pen
    beat(c, 1.5, () => {
      if (pz.destroyed) return;
      pz.alpha = 1;
      sfx('nib', 1.3);
      if (!c.reduce) gsap.from(pz.scale, { x: 0.2, y: 0.2, duration: 0.2, ease: 'back.out(2)' });
    });
    // the ink dries: a shine runs across the strip
    beat(c, 1.75, () => {
      if (c.reduce || !c.flashes) return;
      const sh = new Graphics().poly([0, BAND[0], 90, BAND[0], -60, BAND[1], -150, BAND[1]]).fill({ color: 0xffffff, alpha: 0.45 });
      sh.position.x = -100;
      k.addChild(sh);
      gsap.to(sh, { x: W + 200, duration: 0.45, ease: 'power1.inOut', onComplete: () => destroyTree(sh) });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('splash', 0.9);
    sfx('boom', 1.1);
    later(c, 0.1, () => sfx('paper', 1.2));
    later(c, 0.25, () => sfx('fanfare', 1.2));
    c.shaker.add(0.35);
    if (st) {
      st.title().show(2.7);
      st.spin.v = 2.4;
      gsap.to(st.spin, { v: 0.5, delay: 0.6, duration: 1.4 });
      // the bowls get kicked out of the strip
      st.bowls.forEach((b, i) => {
        if (b.destroyed) return;
        const dir = i === 2 ? 1 : -1;
        if (c.reduce) {
          b.visible = false;
          return;
        }
        gsap.to(b, { x: b.x + dir * (900 + i * 200), y: b.y - 700 - i * 120, rotation: dir * (6 + i * 2), duration: 0.8, ease: 'power2.in', delay: i * 0.05 });
        gsap.to(b.scale, { x: 1.3, y: 1.3, duration: 0.8, delay: i * 0.05 });
      });
    }
    // splashes of broth, peace signs, hearts and little worlds
    burst(c, c.fg, (i) => new Graphics().poly(ngon(0, 0, 10 + (i % 3) * 5, 7 + (i % 2) * 4, 8)).fill(0xd8d2c0).stroke({ width: 2.5, color: INK }), 16, W / 2 + 300, c.catY + 60, 700, 1.0);
    burst(
      c,
      c.fg,
      (i) => {
        if (i % 3 === 0) return peace(26);
        if (i % 3 === 1) return heart(22);
        const g = new Graphics();
        drawGlobe(g, 24, i, true);
        return g;
      },
      18,
      W / 2,
      c.catY - 60,
      860,
      1.5,
    );
    // the margin gets a new doodle: a heart next to the peace sign
    const hz = heart(30);
    hz.position.set(W - 210, H - 96);
    c.back.addChild(hz);
    if (!c.reduce) gsap.from(hz.scale, { x: 0, y: 0, duration: 0.3, ease: 'back.out(3)', delay: 0.4 });
    fadeKill(hz, 4, 0.4);
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = m / 1080;
    const wide = w > h * 1.6;
    const top = wide ? h * 0.06 : 0;
    const band: [number, number] = [h * (wide ? 0.16 : 0.12), h * (wide ? 0.78 : 0.82)];
    const pg = page(w, h, Math.max(u, 0.12), { top, band, seed: 64, masthead: false });
    k.addChild(pg);
    // as many panels as fit at a strip's proportions (at least 3)
    const ph = band[1] - band[0];
    const n = Math.max(3, Math.min(9, Math.round(w / (ph * 0.8))));
    const mg = m * 0.04;
    const gut = m * 0.025;
    const pw = (w - 2 * mg - (n - 1) * gut) / n;
    const fr = new Graphics();
    const steams: { g: Graphics; r: number }[] = [];
    const globes: { g: Graphics; R: number }[] = [];
    for (let i = 0; i < n; i++) {
      const x = mg + i * (pw + gut);
      fr.rect(x, band[0], pw, ph).fill(0xfbf8ee);
      // counted from the last panel (always the world): the narrow cards still show it beside her
      const kind = 3 - ((n - 1 - i) % 4);
      const cx = x + pw * 0.5;
      if (kind < 3) {
        const r = Math.min(pw * 0.42, ph * (0.12 + kind * 0.08));
        const b = bowl(r);
        b.position.set(cx, band[1] - ph * 0.26);
        const sg = new Graphics();
        sg.position.set(cx, band[1] - ph * 0.26);
        drawSteam(sg, r, i, 3, kind === 2 ? 1 : 0);
        k.addChild(sg, b);
        steams.push({ g: sg, r });
      } else {
        const R = Math.min(pw * 0.36, ph * 0.26);
        const gk = new Container();
        const g = new Graphics();
        drawGlobe(g, R, i);
        gk.addChild(g, bandage(R));
        gk.position.set(cx, band[0] + ph * 0.5);
        k.addChild(gk);
        globes.push({ g, R });
      }
    }
    const brd = new Graphics();
    for (let i = 0; i < n; i++) {
      const x = mg + i * (pw + gut);
      brd.rect(x, band[0], pw, ph).stroke({ width: Math.max(1.5, m * 0.012), color: INK });
    }
    k.addChildAt(fr, 1);
    k.addChild(brd);
    const pz = peace(m * 0.05);
    pz.position.set(w - m * 0.08, h - m * 0.08);
    pz.rotation = -0.12;
    k.addChild(pz);
    if (live)
      liveLoop(k, (t) => {
        steams.forEach((s, i) => drawSteam(s.g, s.r, t + i, 3, i % 3 === 2 ? 0.6 + 0.4 * Math.sin(t * 2) : 0));
        globes.forEach((gl) => drawGlobe(gl.g, gl.R, t * 1.2));
      });
    return k;
  },
};

