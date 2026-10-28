/**
 * La Gatoconda: the museum universe (Leonardo, public domain). The lights come up on the most crowded room of the Museo:
 * an oxblood wall, a gilded frame around her with a hazy sfumato landscape behind, the velvet rope, a sign that says
 * PROHIBIDO EL FLASH and a crowd that flashes anyway. The portraits on the side walls follow the flashes with their
 * eyes. Payoff: the eyes all turn to you, the haze clears, a brushstroke of a smile — ¿…SONRIÓ?
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, CHEER, cover, every, later, score, word } from './kit';
import { crowd, fadeKill, fitW, liveLoop, rng, stash, vgrad } from './kitB';

const GOLD = 0xd9b45a;
const GOLD_L = 0xf5dc8a;
const GOLD_D = 0x7a5a20;
const WALL = 0x4a1418;
/** the painted canvas inside the frame (centered on the disc) */
const CW = 620;
const CH = 680;
const BAND = 48;

/** the oxblood wall with a damask pattern and a dark dado */
function wall(w: number, h: number, u = 1): Graphics {
  const g = new Graphics().rect(0, 0, w, h).fill(WALL);
  for (let y = 40 * u; y < h * 0.87; y += 140 * u)
    for (let x = ((y / (140 * u)) % 2) * 60 * u; x < w; x += 120 * u) {
      g.poly([x, y - 26 * u, x + 14 * u, y, x, y + 26 * u, x - 14 * u, y]).fill(0x3c0f13);
      g.circle(x, y - 34 * u, 6 * u).fill(0x3c0f13).circle(x - 20 * u, y, 5 * u).fill(0x3c0f13).circle(x + 20 * u, y, 5 * u).fill(0x3c0f13);
    }
  g.rect(0, h * 0.87, w, h * 0.13).fill(0x2a1810).rect(0, h * 0.87, w, 6 * u).fill(0x8a6a3a);
  return g;
}

/** the sfumato landscape inside the frame (x, y = its top-left); the haze is drawn apart so it can drift */
function landscape(x: number, y: number, w: number, h: number): Graphics {
  const g = vgrad(new Graphics(), x, y, w, h * 0.5, [0xc9cfae, 0xaab7a0, 0x8fa69a], 10);
  g.rect(x, y + h * 0.5, w, h * 0.5).fill(0x6d6c44);
  // distant blue mountains (the left horizon lower than the right, like hers)
  const mt = (base: number, rise: number, col: number, seed: number) => {
    const r = rng(seed);
    const pts: number[] = [x, y + h * base];
    for (let i = 0; i <= 10; i++) pts.push(x + (i / 10) * w, y + h * (base - rise * (i / 10) - r() * 0.06));
    pts.push(x + w, y + h * 0.62, x, y + h * 0.62);
    g.poly(pts).fill(col);
  };
  mt(0.4, 0.08, 0x8ea39c, 3);
  mt(0.47, 0.06, 0x7d9188, 5);
  g.ellipse(x + w * 0.3, y + h * 0.5, w * 0.22, h * 0.03).fill(0xb9c6b4);
  // the winding road and the little bridge
  g.moveTo(x + w * 0.05, y + h * 0.66).bezierCurveTo(x + w * 0.25, y + h * 0.6, x + w * 0.05, y + h * 0.54, x + w * 0.22, y + h * 0.5).stroke({ width: 6, color: 0xb59a5a, cap: 'round' });
  for (let i = 0; i < 4; i++) g.arc(x + w * 0.74 + i * 22, y + h * 0.56, 10, Math.PI, 0).stroke({ width: 5, color: 0x8a7a5a });
  g.rect(x + w * 0.72, y + h * 0.545, 96, 6).fill(0x8a7a5a);
  // mid hills, then the dark parapet she sits against
  g.poly([x, y + h * 0.6, x + w * 0.3, y + h * 0.55, x + w * 0.6, y + h * 0.6, x + w, y + h * 0.56, x + w, y + h, x, y + h]).fill(0x5d5a34);
  g.rect(x, y + h * 0.74, w, h * 0.26).fill(0x2a2418);
  // old varnish and craquelure
  g.rect(x, y, w, h).fill({ color: 0x9a6a1a, alpha: 0.12 });
  const r = rng(11);
  for (let i = 0; i < 26; i++) {
    let cx = x + r() * w;
    let cy = y + r() * h;
    g.moveTo(cx, cy);
    for (let j = 0; j < 4; j++) {
      cx += (r() - 0.5) * w * 0.065;
      cy += (r() - 0.5) * w * 0.065;
      g.lineTo(Math.max(x, Math.min(x + w, cx)), Math.max(y, Math.min(y + h, cy)));
    }
    g.stroke({ width: 1, color: 0x1a120a, alpha: 0.14 });
  }
  return g;
}

/** the haze: big pale ellipses drifting (sfumato) */
function haze(g: Graphics, x: number, y: number, w: number, h: number, t: number) {
  g.clear();
  for (let i = 0; i < 7; i++) {
    const hx = x + w * (0.5 + 0.45 * Math.sin(t * 0.25 + i * 1.7));
    const hy = y + h * (0.3 + 0.08 * i + 0.03 * Math.sin(t * 0.4 + i));
    g.ellipse(hx, hy, w * 0.4, h * 0.07).fill({ color: 0xe8ecd8, alpha: 0.09 });
  }
}

/** an ornate gilded frame around a w×h opening centered on (0,0) */
function gilt(w: number, h: number, band: number): Graphics {
  const g = new Graphics();
  const ow = w + band * 2;
  const oh = h + band * 2;
  g.rect(-ow / 2 - 6, -oh / 2 - 6, ow + 12, oh + 12).fill(C.ink).rect(-w / 2, -h / 2, w, h).cut();
  g.rect(-ow / 2, -oh / 2, ow, oh).fill(GOLD).rect(-w / 2, -h / 2, w, h).cut();
  g.rect(-ow / 2 + band * 0.2, -oh / 2 + band * 0.2, ow - band * 0.4, oh - band * 0.4).stroke({ width: band * 0.12, color: GOLD_L });
  g.rect(-ow / 2 + band * 0.55, -oh / 2 + band * 0.55, ow - band * 1.1, oh - band * 1.1).stroke({ width: band * 0.1, color: GOLD_D });
  // beads along the band
  const step = band * 0.6;
  for (let x = -ow / 2 + band; x < ow / 2 - band; x += step) g.circle(x, -oh / 2 + band * 0.38, band * 0.09).fill(GOLD_L).circle(x, oh / 2 - band * 0.38, band * 0.09).fill(GOLD_L);
  for (let y = -oh / 2 + band; y < oh / 2 - band; y += step) g.circle(-ow / 2 + band * 0.38, y, band * 0.09).fill(GOLD_L).circle(ow / 2 - band * 0.38, y, band * 0.09).fill(GOLD_L);
  // corner rosettes and a crest on top
  for (const [cx, cy] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    const x = (cx * (ow - band)) / 2;
    const y = (cy * (oh - band)) / 2;
    for (let i = 0; i < 6; i++) g.circle(x + Math.cos((i / 6) * Math.PI * 2) * band * 0.32, y + Math.sin((i / 6) * Math.PI * 2) * band * 0.32, band * 0.2).fill(GOLD_L);
    g.circle(x, y, band * 0.24).fill(GOLD_D).stroke({ width: 2, color: C.ink });
  }
  g.moveTo(-band * 2, -oh / 2).quadraticCurveTo(0, -oh / 2 - band * 1.4, band * 2, -oh / 2).fill(GOLD).stroke({ width: 3, color: C.ink });
  g.rect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6).stroke({ width: 5, color: 0x2a1a08 });
  return g;
}

/** a small side portrait in an oval gilt frame whose eyes move (kind 0: a gentleman cat in a ruff; 1: a cat with a pearl earring) */
function portrait(kind: number): { k: Container; pupils: Graphics[] } {
  const k = new Container();
  const g = new Graphics().ellipse(0, 0, 118, 148).fill(C.ink).ellipse(0, 0, 112, 142).fill(GOLD).ellipse(0, 0, 92, 122).fill(0x231a12).stroke({ width: 4, color: GOLD_D });
  for (let i = 0; i < 18; i++) g.circle(Math.cos((i / 18) * Math.PI * 2) * 102, Math.sin((i / 18) * Math.PI * 2) * 132, 5).fill(GOLD_L);
  const face = kind === 0 ? 0xd8c8a8 : 0xe0b890;
  // shoulders
  g.ellipse(0, 112, 80, 50).fill(kind === 0 ? 0x1a1410 : 0x5a4a2a);
  if (kind === 0) {
    // a pleated ruff collar under the chin
    g.ellipse(0, 40, 72, 20).fill(0xefe8d8).stroke({ width: 2, color: 0x8a8070 });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      g.moveTo(Math.cos(a) * 26, 40 + Math.sin(a) * 7).lineTo(Math.cos(a) * 70, 40 + Math.sin(a) * 19).stroke({ width: 1.5, color: 0xb8b0a0 });
    }
  }
  // head and ears
  g.poly([-44, -40, -36, -86, -12, -56]).fill(face).poly([44, -40, 36, -86, 12, -56]).fill(face);
  g.ellipse(0, -20, 48, 46).fill(face);
  if (kind === 1) {
    g.ellipse(0, -62, 52, 26).fill(0x2a4a8a).poly([30, -60, 70, -40, 60, 10, 40, -20]).fill(0xd9b45a);
    g.circle(40, 18, 7).fill(0xf2f2ea).circle(38, 16, 2.5).fill(0xffffff);
  }
  g.poly([-8, -6, 8, -6, 0, 4]).fill(0xb06a5a);
  g.moveTo(-14, 12).quadraticCurveTo(0, 18, 14, 12).stroke({ width: 2, color: 0x5a3a2a });
  const pupils: Graphics[] = [];
  for (const ex of [-20, 20]) {
    g.ellipse(ex, -24, 12, 8).fill(0xf6efd8).stroke({ width: 2, color: 0x3a2a1a });
    const p = new Graphics().circle(0, 0, 5).fill(0x1a120a);
    p.position.set(ex, -24);
    pupils.push(p);
  }
  k.addChild(g, ...pupils);
  return { k, pupils };
}

/** a camera flash: a four-point star and a glow */
function flashStar(): Graphics {
  const g = new Graphics().circle(0, 0, 60).fill({ color: 0xffffff, alpha: 0.3 });
  g.poly([0, -70, 10, -10, 70, 0, 10, 10, 0, 70, -10, 10, -70, 0, -10, -10]).fill(0xffffff);
  g.blendMode = 'add';
  return g;
}

interface St {
  phones: [number, number][];
  look: { x: number; y: number; snap: boolean };
  eyes: { k: Container; pupils: Graphics[] }[];
  hz: Graphics;
  glint: () => void;
  light: Graphics;
}
const S = stash<St>();

export const gatoconda: Signature = {
  dark: true,
  frame: GOLD,
  tag: 'UNIVERSO MUSEO',
  open(c: SigCtx) {
    const k = new Container();
    k.addChild(cover(WALL), wall(W, H));
    // the PROHIBIDO EL FLASH sign
    const sign = new Container();
    const sg = new Graphics().rect(-130, -42, 260, 84).fill(0xf2eee4).stroke({ width: 3, color: C.ink });
    sg.roundRect(-112, -16, 40, 28, 4).fill(C.ink).circle(-92, -2, 9).fill(0xf2eee4).rect(-104, -22, 14, 6).fill(C.ink);
    sg.circle(-92, -2, 24).stroke({ width: 5, color: C.red }).moveTo(-109, 15).lineTo(-75, -19).stroke({ width: 5, color: C.red });
    const st1 = txt('PROHIBIDO\nEL FLASH', { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.ink, lineHeight: 24 });
    st1.anchor.set(0, 0.5);
    st1.x = -56;
    sign.addChild(sg, st1);
    sign.position.set(240, 210);
    k.addChild(sign);
    // the side portraits (their eyes follow things)
    const eyes = [portrait(0), portrait(1)];
    eyes[0].k.position.set(250, 540);
    eyes[1].k.position.set(1690, 560);
    k.addChild(eyes[0].k, eyes[1].k);
    // the painting: canvas, haze, glass glint, gilded frame, picture light
    const x0 = W / 2 - CW / 2;
    const y0 = c.CY - CH / 2;
    const canvas = new Container();
    const land = landscape(x0, y0, CW, CH);
    const hz = new Graphics();
    haze(hz, x0, y0, CW, CH, 0);
    const glintG = new Graphics();
    const clip = new Graphics().rect(x0, y0, CW, CH).fill(0xffffff);
    canvas.addChild(land, hz, glintG, clip);
    canvas.mask = clip;
    const frame = gilt(CW, CH, BAND);
    frame.position.set(W / 2, c.CY);
    const light = new Graphics()
      .poly([W / 2 - 150, y0 - BAND - 30, W / 2 + 150, y0 - BAND - 30, W / 2 + 420, y0 + CH * 0.8, W / 2 - 420, y0 + CH * 0.8])
      .fill({ color: 0xffe6b0, alpha: 0.14 });
    light.blendMode = 'add';
    light.alpha = 0.5;
    const bar = new Graphics().roundRect(W / 2 - 160, y0 - BAND - 52, 320, 22, 10).fill(GOLD_D).stroke({ width: 3, color: C.ink });
    k.addChild(canvas, frame, light, bar);
    // the velvet rope, then the crowd (with phones up)
    const rope = new Graphics();
    for (const x of [560, 1360]) rope.ellipse(x, 1062, 46, 12).fill(0x8a6a2a).rect(x - 7, 880, 14, 182).fill(GOLD).circle(x, 876, 16).fill(GOLD_L).stroke({ width: 3, color: C.ink });
    rope.moveTo(560, 890).quadraticCurveTo(W / 2, 1010, 1360, 890).stroke({ width: 20, color: 0x8a1020, cap: 'round' });
    rope.moveTo(560, 884).quadraticCurveTo(W / 2, 1002, 1360, 884).stroke({ width: 5, color: 0xc8405a, cap: 'round', alpha: 0.8 });
    k.addChild(rope);
    const heads = crowd(new Graphics(), 1000, 24, 0x120609, 42);
    const phones: [number, number][] = [];
    const pr = rng(5);
    for (let i = 0; i < 12; i++) {
      const px = i < 6 ? 90 + pr() * 420 : W - 90 - pr() * 420;
      const py = 900 + pr() * 70;
      phones.push([px, py]);
      heads.moveTo(px, py + 40).lineTo(px + (i < 6 ? -30 : 30), 1080).stroke({ width: 20, color: 0x120609, cap: 'round' });
      heads.roundRect(px - 22, py - 38, 44, 76, 6).fill(0x120609).roundRect(px - 17, py - 31, 34, 60, 4).fill({ color: 0xbfe0ff, alpha: 0.55 });
    }
    k.addChild(heads);
    c.back.addChild(k);
    gsap.to(c.circle, { alpha: 0, duration: c.short ? 0 : 0.25 });

    const look = { x: W / 2, y: c.CY, snap: false };
    if (!c.reduce)
      every(c, 30, (t) => {
        if (hz.destroyed) return;
        haze(hz, x0, y0, CW, CH, t);
        for (const e of eyes)
          e.pupils.forEach((p, i) => {
            const ex = e.k.x + (i ? 20 : -20);
            const ey = e.k.y - 24;
            const dx = look.snap ? 0 : look.x - ex;
            const dy = look.snap ? 0 : look.y - ey;
            const d = Math.hypot(dx, dy) || 1;
            const m = Math.min(7, d / 30);
            p.position.set(ex - e.k.x + (dx / d) * m, -24 + (dy / d) * m * 0.6);
          });
      });
    const glint = () => {
      if (c.reduce || glintG.destroyed) return;
      const p = { u: 0 };
      gsap.to(p, {
        u: 1,
        duration: 0.6,
        ease: 'power1.inOut',
        onUpdate: () => {
          if (glintG.destroyed) return;
          const gx = x0 - 200 + p.u * (CW + 400);
          glintG.clear().poly([gx, y0, gx + 90, y0, gx - 110, y0 + CH, gx - 200, y0 + CH]).fill({ color: 0xffffff, alpha: 0.16 });
        },
        onComplete: () => !glintG.destroyed && glintG.clear(),
      });
    };
    S.set(c, { phones, look, eyes, hz, glint, light });
    if (c.short) return;

    // the museum lights come on, bank by bank (clack, clack, CLACK), then the glass glints
    if (!c.reduce) {
      k.alpha = 0.12;
      [0.08, 0.24, 0.42].forEach((t, i) => later(c, t, () => gsap.to(k, { alpha: [0.4, 0.65, 1][i], duration: 0.06 })));
      later(c, 0.5, glint);
    }
    score(c, [
      [0.08, 'hit', 0.5],
      [0.24, 'hit', 0.55],
      [0.42, 'hit', 0.6],
      [0.45, 'reveal', 0.6],
      [0.6, 'purr', 1.4],
    ]);
    // the crowd flashes anyway; the portraits' eyes follow each flash
    const times = [0.55, 0.78, 0.98, 1.12, 1.3, 1.48, 1.6, 1.78, 1.95];
    times.forEach((t, i) =>
      later(c, t, () => {
        const [px, py] = phones[(i * 5) % phones.length];
        look.x = px;
        look.y = py;
        sfx('tick', 1.1 + (i % 3) * 0.2);
        sfx('paper', 2.2);
        if (c.flashes) {
          const f = flashStar();
          f.position.set(px, py - 30);
          c.fg.addChild(f);
          gsap.fromTo(f.scale, { x: 0.3, y: 0.3 }, { x: 1.4, y: 1.4, duration: 0.22, ease: 'power2.out' });
          gsap.to(f, { alpha: 0, duration: 0.25, delay: 0.05, onComplete: () => destroyTree(f) });
          if (i % 3 === 0) {
            const wf = cover(0xffffff, 0.14);
            c.fg.addChild(wf);
            gsap.to(wf, { alpha: 0, duration: 0.18, onComplete: () => destroyTree(wf) });
          }
        } else {
          const soft = new Graphics().roundRect(-17, -31, 34, 60, 4).fill({ color: 0xffffff, alpha: 0.6 });
          soft.position.set(px, py);
          c.fg.addChild(soft);
          gsap.to(soft, { alpha: 0, duration: 0.4, onComplete: () => destroyTree(soft) });
        }
        if (i === 1 || i === 5) word(c, px + (px < W / 2 ? 120 : -120), py - 140, '¡CLIC!', 0xffffff, 56, 0.6);
      }),
    );
  },
  payoff(c: SigCtx) {
    const st = S.get(c);
    sfx('reveal', 1);
    sfx('gem', 0.75);
    later(c, 0.4, () => sfx('purr', 1.5));
    if (st) {
      // the eyes all turn to you; the haze clears; the light warms
      st.look.snap = true;
      for (const e of st.eyes) for (const p of e.pupils) if (!c.reduce) gsap.fromTo(p.scale, { x: 1.5, y: 1.5 }, { x: 1, y: 1, duration: 0.5, ease: 'back.out(2)' });
      gsap.to(st.hz, { alpha: 0.35, duration: 0.8 });
      gsap.to(st.light, { alpha: 1, duration: 0.5 });
      st.glint();
      // everyone takes the photo at once
      st.phones.forEach(([px, py], i) =>
        later(c, 0.05 + (i % 6) * 0.05, () => {
          if (c.flashes) {
            const f = flashStar();
            f.position.set(px, py - 30);
            c.fg.addChild(f);
            gsap.fromTo(f.scale, { x: 0.3, y: 0.3 }, { x: 1.6, y: 1.6, duration: 0.25, ease: 'power2.out' });
            gsap.to(f, { alpha: 0, duration: 0.3, delay: 0.05, onComplete: () => destroyTree(f) });
          } else {
            const soft = new Graphics().roundRect(-17, -31, 34, 60, 4).fill({ color: 0xffffff, alpha: 0.6 });
            soft.position.set(px, py);
            c.fg.addChild(soft);
            gsap.to(soft, { alpha: 0, duration: 0.5, onComplete: () => destroyTree(soft) });
          }
          if (i % 3 === 0) sfx('tick', 1.2 + i * 0.05);
        }),
      );
    }
    // a brushstroke of a smile, and the question
    const k = new Container();
    const stroke = new Graphics();
    const q = txt('¿…SONRIÓ?', { fontFamily: F.serif, fontStyle: 'italic', fontWeight: '900', fontSize: 140, fill: 0xf6dc8e, stroke: { color: C.ink, width: 14, join: 'round' } });
    q.anchor.set(0.5);
    q.y = -50;
    fitW(q, 760);
    k.addChild(stroke, q);
    k.position.set(CHEER[0], CHEER[1]);
    k.rotation = -0.03;
    c.fg.addChild(k);
    const pts: [number, number][] = [];
    for (let i = 0; i <= 40; i++) {
      const u = i / 40;
      pts.push([-230 + u * 460, 74 + Math.sin(u * Math.PI) * 30 - u * u * u * 36]);
    }
    const p = { u: 0 };
    gsap.to(p, {
      u: 1,
      duration: c.reduce ? 0.01 : 0.6,
      delay: c.reduce ? 0 : 0.25,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (stroke.destroyed) return;
        const n = Math.max(2, Math.ceil(p.u * pts.length));
        stroke.clear().moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < n; i++) stroke.lineTo(pts[i][0], pts[i][1]);
        stroke.stroke({ width: 26, color: C.ink, cap: 'round', join: 'round' });
        stroke.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < n; i++) stroke.lineTo(pts[i][0], pts[i][1]);
        stroke.stroke({ width: 14, color: GOLD, cap: 'round', join: 'round' });
      },
    });
    if (!c.reduce) gsap.fromTo(q, { alpha: 0 }, { alpha: 1, duration: 0.5 });
    fadeKill(k, 2.4, 0.6);
    // the museum label, under the painting
    const lab = new Container();
    const lg = new Graphics().rect(0, 0, 330, 112).fill(0xf6f2e8).stroke({ width: 3, color: C.ink });
    const l1 = txt('LA GATOCONDA', { fontFamily: F.serif, fontWeight: '700', fontSize: 28, fill: C.ink });
    const l2 = txt('Leonardo da Michi · c. 1503', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 20, fill: C.ink });
    const l3 = txt('Óleo sobre tabla · NO TOCAR', { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: 0x6a5a4a, letterSpacing: 1 });
    l1.position.set(16, 10);
    l2.position.set(16, 46);
    l3.position.set(16, 80);
    lab.addChild(lg, l1, l2, l3);
    lab.position.set(W / 2 + 380, 760);
    c.back.addChild(lab);
    if (!c.reduce) gsap.from(lab, { alpha: 0, y: 790, duration: 0.4, delay: 0.5 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = Math.min(w, h) / 300;
    k.addChild(wall(w, h, u * 0.6));
    const band = 22 * u;
    const iw = w - band * 2 - 16 * u;
    const ih = h - band * 2 - 30 * u;
    const ix = (w - iw) / 2;
    const iy = band + 6 * u;
    const canvas = landscape(ix, iy, iw, ih);
    const hz = new Graphics();
    haze(hz, ix, iy, iw, ih, 0);
    const frame = gilt(iw, ih, band);
    frame.position.set(w / 2, iy + ih / 2);
    const rope = new Graphics().moveTo(0, h - 18 * u).quadraticCurveTo(w / 2, h + 10 * u, w, h - 18 * u).stroke({ width: 9 * u, color: 0x8a1020, cap: 'round' });
    k.addChild(canvas, hz, frame, rope);
    if (live) liveLoop(k, 20, (t) => haze(hz, ix, iy, iw, ih, t));
    return k;
  },
};
