/**
 * Yugi Miauto: the duel universe (a card-duel anime). A night arena of holograms: a grid floor running to the horizon, a
 * glowing summoning circle under him, a golden inverted pyramid turning in the air. ¡ROBO!: he draws with a golden
 * trail; six giant cards fall face down around him and turn over one by one (MAGO MICHI, DRAGÓN MICHI, KURIMIAU, OLLA DE
 * ATÚN, SIESTA ETERNA, GATO GUERRERO); then five gold cards — a head, two arms, two legs — light up at the edges and fly
 * together: a chained giant cat rises behind him, dim, in gold.
 * Payoff: the giant blazes, its chains snap (¡CRAC!), gold rays and the cards spin away; ¡SE ARMÓ! / …y ni barajé.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, burst, every, flashOf, later } from './kit';
import { hideDisc } from './kitA';
import { fadeKill, stash, vgrad } from './kitB';
import { beat, pay } from './kitC';
import { ngon, onCat, rnd, starfield, streak, twinkle } from './kitD';
import { type Head, prepHead, prepWord, rays, rrect, show, showHead } from './kitE';
import { liveLoop } from '../../../panels/collection/cardArt';

const PURPLE = 0x7b2cbf;
const GOLD = 0xe6c34a;
const HOLO = 0x3ff0ff;
const CW = 190;
const CH = 270;

/** the holographic floor: a grid running to the horizon (lines fan from the vanishing point; rows scroll with `t`) */
function grid(g: Graphics, w: number, h: number, hz: number, t: number, k: number) {
  g.clear();
  g.rect(0, hz, w, h - hz).fill(0x0d0820);
  const cx = w / 2;
  const n = Math.round((w / h) * 14);
  for (let i = -n; i <= n; i++) g.poly(streak(cx + i * 20 * k, hz, cx + i * (w / n) * 1.6, h + 20, 0.4, 2 * k));
  for (let j = 0; j < 12; j++) {
    const u = (j + (t % 1)) / 12;
    const y = hz + (h - hz) * u * u;
    g.rect(0, y, w, Math.max(1, 3 * k * u));
  }
  g.fill({ color: HOLO, alpha: 0.35 });
  g.rect(0, hz - 2 * k, w, 4 * k).fill({ color: HOLO, alpha: 0.8 });
}

/** the summoning circle under him (ellipse rings + rune ticks turning with `a`) */
function circle(g: Graphics, x: number, y: number, rx: number, ry: number, a: number, alpha = 1) {
  g.clear();
  g.poly(ngon(x, y, rx, ry, 48)).stroke({ width: 6, color: HOLO, alpha: 0.8 * alpha });
  g.poly(ngon(x, y, rx * 0.82, ry * 0.82, 48)).stroke({ width: 3, color: 0xff4fd8, alpha: 0.7 * alpha });
  for (let i = 0; i < 16; i++) {
    const b = a + (i / 16) * Math.PI * 2;
    const px = x + Math.cos(b) * rx * 0.91;
    const py = y + Math.sin(b) * ry * 0.91;
    g.poly(i % 2 ? twinkle(px, py, 12, 0.3) : ngon(px, py, 7, 7 * (ry / rx) * 2, 4)).fill({ color: i % 2 ? HOLO : GOLD, alpha });
  }
}

/** the golden inverted pyramid turning (center x, y; half-width a; height hh; turned `th`) with a cat's eye on its front face */
function pyramid(g: Graphics, x: number, y: number, a: number, hh: number, th: number) {
  g.clear();
  const tilt = 0.3;
  const P = (px: number, py: number, pz: number): [number, number, number] => {
    const rx = px * Math.cos(th) - pz * Math.sin(th);
    const rz = px * Math.sin(th) + pz * Math.cos(th);
    return [x + rx, y + py + rz * tilt, rz];
  };
  const base = [P(-a, 0, -a), P(a, 0, -a), P(a, 0, a), P(-a, 0, a)];
  const apex = P(0, hh, 0);
  for (let i = 3; i >= 1; i--) g.poly(ngon(x, y + hh * 0.4, a * (1.2 + i * 0.3), a * (1.2 + i * 0.3), 20)).fill({ color: GOLD, alpha: 0.06 });
  const faces = [0, 1, 2, 3].map((i) => {
    const p = base[i];
    const q = base[(i + 1) % 4];
    const depth = (p[2] + q[2] + apex[2]) / 3;
    return { pts: [p[0], p[1], q[0], q[1], apex[0], apex[1]], depth, i };
  });
  faces.sort((u, v) => u.depth - v.depth);
  for (const f of faces) {
    const light = 0.55 + 0.45 * Math.max(0, f.depth / a);
    const r = Math.round(0xe6 * light);
    const gg = Math.round(0xc3 * light);
    const b = Math.round(0x4a * light);
    g.poly(f.pts).fill((r << 16) | (gg << 8) | b).stroke({ width: Math.max(1.5, a * 0.04), color: 0x5a3a0a, join: 'round' });
  }
  // the top face (seen from above) and the eye on the face most toward us
  g.poly(base.flatMap((p) => [p[0], p[1]])).fill(0xf6dc7a).stroke({ width: Math.max(1.5, a * 0.04), color: 0x5a3a0a });
  const front = faces[faces.length - 1];
  const ex = (front.pts[0] + front.pts[2] + front.pts[4]) / 3;
  const ey = (front.pts[1] + front.pts[3] + front.pts[5]) / 3 - hh * 0.08;
  const wE = a * 0.34 * Math.max(0.2, front.depth / a);
  g.poly([ex - wE, ey, ex, ey - a * 0.16, ex + wE, ey, ex, ey + a * 0.16]).fill(0x2a1a06);
  g.poly(ngon(ex, ey, wE * 0.18, a * 0.13, 8)).fill(GOLD);
}

/** a card back: purple, a gold frame and a gold cat's eye (origin at its center) */
function back(s: number) {
  const g = new Graphics();
  g.poly(rrect((-CW / 2) * s, (-CH / 2) * s, CW * s, CH * s, 10 * s)).fill(0x3a1a5a).stroke({ width: 5 * s, color: C.ink });
  g.poly(rrect((-CW / 2 + 12) * s, (-CH / 2 + 12) * s, (CW - 24) * s, (CH - 24) * s, 6 * s)).stroke({ width: 4 * s, color: GOLD });
  g.poly(ngon(0, 0, 60 * s, 84 * s, 20)).fill(0x5a2a8a).stroke({ width: 4 * s, color: GOLD });
  g.poly([-44 * s, 0, 0, -24 * s, 44 * s, 0, 0, 24 * s]).fill(GOLD);
  g.poly(ngon(0, 0, 6 * s, 20 * s, 8)).fill(0x2a0a3a);
  return g;
}

type Kind = 'monster' | 'spell' | 'trap';
/** a card face: its frame color by kind, the name strip, level stars, a picture (an invented cat creature), a text box */
function face(name: string, kind: Kind, art: number, s: number) {
  const k = new Container();
  const g = new Graphics();
  const frame = kind === 'monster' ? 0xc89a4a : kind === 'spell' ? 0x2a9a8a : 0xb04a8a;
  g.poly(rrect((-CW / 2) * s, (-CH / 2) * s, CW * s, CH * s, 10 * s)).fill(frame).stroke({ width: 5 * s, color: C.ink });
  g.poly(rrect((-CW / 2 + 10) * s, (-CH / 2 + 10) * s, (CW - 20) * s, 30 * s, 4 * s)).fill(0xf2e8d0).stroke({ width: 2 * s, color: C.ink });
  if (kind === 'monster') for (let i = 0; i < 6; i++) g.poly(ngon((CW / 2 - 22 - i * 22) * s, (-CH / 2 + 54) * s, 8 * s, 8 * s, 10)).fill(0xd8301a).stroke({ width: 1.5 * s, color: C.ink });
  const py = -CH / 2 + 68;
  g.poly(rrect((-CW / 2 + 16) * s, py * s, (CW - 32) * s, 128 * s, 2 * s)).fill(0x1a1030).stroke({ width: 3 * s, color: C.ink });
  // the picture
  const cx = 0;
  const cy = (py + 64) * s;
  const r = rnd(art * 13 + 1);
  for (let i = 0; i < 6; i++) g.poly(streak(cx, cy, cx + (r() - 0.5) * 150 * s, cy + (r() - 0.5) * 120 * s, 1, 10 * s)).fill({ color: [0xff4fd8, HOLO, GOLD][i % 3], alpha: 0.4 });
  const body = [0xf4f2ea, 0x6a3ab8, 0xc89a6a, 0x2a9a8a, 0xb04a8a, 0xc0c6cc][art % 6];
  if (kind === 'monster') {
    g.poly([cx - 34 * s, cy + 50 * s, cx - 30 * s, cy - 6 * s, cx + 30 * s, cy - 6 * s, cx + 34 * s, cy + 50 * s]).fill(body).stroke({ width: 2 * s, color: C.ink });
    g.poly(ngon(cx, cy - 24 * s, 26 * s, 24 * s, 14)).fill(body).stroke({ width: 2 * s, color: C.ink });
    g.poly([cx - 22 * s, cy - 32 * s, cx - 18 * s, cy - 58 * s, cx - 6 * s, cy - 44 * s]).fill(body).stroke({ width: 2 * s, color: C.ink });
    g.poly([cx + 22 * s, cy - 32 * s, cx + 18 * s, cy - 58 * s, cx + 6 * s, cy - 44 * s]).fill(body).stroke({ width: 2 * s, color: C.ink });
    for (const e of [-1, 1]) g.poly(ngon(cx + e * 10 * s, cy - 26 * s, 5 * s, 4 * s, 8)).fill(art === 1 ? HOLO : 0xffe14d);
    if (art === 0) g.poly([cx - 30 * s, cy - 40 * s, cx, cy - 92 * s, cx + 30 * s, cy - 40 * s]).fill(0x4a2a8a).stroke({ width: 2 * s, color: C.ink });
    if (art === 1) for (const e of [-1, 1]) g.poly([cx + e * 30 * s, cy, cx + e * 76 * s, cy - 40 * s, cx + e * 60 * s, cy + 20 * s]).fill(0xd8e8f8).stroke({ width: 2 * s, color: C.ink });
  } else if (kind === 'spell') {
    g.poly(ngon(cx, cy + 10 * s, 44 * s, 30 * s, 14)).fill(0x5a8a3a).stroke({ width: 2 * s, color: C.ink });
    g.poly([cx - 14 * s, cy - 20 * s, cx + 18 * s, cy - 10 * s, cx - 6 * s, cy]).fill(0xc0c6cc);
  } else {
    g.poly(ngon(cx, cy + 6 * s, 40 * s, 22 * s, 14)).fill(0x8a6ab8).stroke({ width: 2 * s, color: C.ink });
    for (let i = 0; i < 3; i++) g.poly(streak(cx + 30 * s + i * 14 * s, cy - 20 * s - i * 14 * s, cx + 40 * s + i * 14 * s, cy - 30 * s - i * 14 * s, 3 * s, 3 * s)).fill(0xf2e8d0);
  }
  g.poly(rrect((-CW / 2 + 16) * s, (py + 136) * s, (CW - 32) * s, 52 * s, 3 * s)).fill(0xf2e8d0).stroke({ width: 2 * s, color: C.ink });
  for (let i = 0; i < 3; i++) g.rect((-CW / 2 + 26) * s, (py + 146 + i * 12) * s, (CW - 60 - (i === 2 ? 50 : 0)) * s, 4 * s);
  g.fill({ color: 0x8a7a6a, alpha: 0.7 });
  const t = txt(name, { fontFamily: F.heavy, fontSize: 15 * s, fill: C.ink });
  t.anchor.set(0, 0.5);
  t.position.set((-CW / 2 + 16) * s, (-CH / 2 + 25) * s);
  if (t.width > (CW - 34) * s) t.scale.set(((CW - 34) * s) / t.width);
  k.addChild(g, t);
  return k;
}

/** one gold piece of the giant (a card showing a head / arm / leg) */
function piece(part: number, s: number) {
  const g = new Graphics();
  g.poly(rrect((-CW / 2) * s, (-CH / 2) * s, CW * s, CH * s, 10 * s)).fill(0xb8863a).stroke({ width: 5 * s, color: C.ink });
  g.poly(rrect((-CW / 2 + 16) * s, (-CH / 2 + 30) * s, (CW - 32) * s, 150 * s, 3 * s)).fill(0x2a1a0a);
  const y = (-CH / 2 + 105) * s;
  const col = 0xd8a85a;
  if (part === 0) {
    g.poly(ngon(0, y, 40 * s, 36 * s, 14)).fill(col);
    g.poly([-34 * s, y - 14 * s, -30 * s, y - 58 * s, -8 * s, y - 32 * s]).fill(col);
    g.poly([34 * s, y - 14 * s, 30 * s, y - 58 * s, 8 * s, y - 32 * s]).fill(col);
    for (const e of [-1, 1]) g.poly(ngon(e * 14 * s, y - 4 * s, 7 * s, 5 * s, 8)).fill(0xffe14d);
  } else if (part <= 2) {
    const e = part === 1 ? -1 : 1;
    g.poly([e * -40 * s, y - 50 * s, e * 10 * s, y - 50 * s, e * 40 * s, y + 30 * s, e * -10 * s, y + 40 * s]).fill(col);
    g.poly(ngon(e * 30 * s, y + 46 * s, 22 * s, 20 * s, 10)).fill(col);
    g.poly(rrect(e * 14 * s - 16 * s, y + 4 * s, 32 * s, 14 * s, 3 * s)).fill(0x8a8f9a);
  } else {
    g.poly([-24 * s, y - 60 * s, 24 * s, y - 60 * s, 18 * s, y + 40 * s, -18 * s, y + 40 * s]).fill(col);
    g.poly(ngon((part === 3 ? -10 : 10) * s, y + 52 * s, 32 * s, 16 * s, 10)).fill(col);
  }
  g.poly(rrect((-CW / 2 + 16) * s, (CH / 2 - 76) * s, (CW - 32) * s, 56 * s, 3 * s)).fill(0xf2e0b0);
  return g;
}

/** the chained giant: a gold cat titan from the waist up, arms wide, chains on its wrists (origin at its waist), `chains` shown */
function giant(s: number, chains: boolean) {
  const g = new Graphics();
  const ink = { width: Math.max(2, 6 * s), color: 0x3a2206, join: 'round' as const };
  const col = 0xc8963e;
  const P = (p: number[]) => p.map((v) => v * s);
  // arms spread wide
  for (const e of [-1, 1]) {
    g.poly(P([e * 150, -520, e * 420, -560, e * 640, -470, e * 650, -400, e * 420, -470, e * 160, -420])).fill(col).stroke(ink);
    g.poly(ngon(e * 690 * s, -440 * s, 62 * s, 56 * s, 14)).fill(col).stroke(ink);
    if (chains)
      for (let i = 0; i < 6; i++) {
        const cx = e * (730 + i * 62) * s;
        const cy = (-440 + i * 26) * s;
        g.poly(ngon(cx, cy, 30 * s, 18 * s, 12, i % 2 ? 1.2 : 0.3)).stroke({ width: 10 * s, color: 0x9aa0aa });
      }
  }
  // the torso, the head with a tall headdress, glowing eyes, a gem
  g.poly(P([-160, 0, -220, -420, -170, -560, 170, -560, 220, -420, 160, 0])).fill(col).stroke(ink);
  g.poly(ngon(0, -400 * s, 40 * s, 40 * s, 6)).fill(0xd8301a).stroke(ink);
  g.poly(P([-120, -560, -150, -760, -60, -700, 0, -820, 60, -700, 150, -760, 120, -560])).fill(0x8a5a1a).stroke(ink);
  g.poly(ngon(0, -640 * s, 110 * s, 96 * s, 18)).fill(col).stroke(ink);
  for (const e of [-1, 1]) g.poly([e * 30 * s, -650 * s, e * 80 * s, -664 * s, e * 74 * s, -630 * s, e * 30 * s, -634 * s]).fill(0xffe14d);
  return g;
}

interface St {
  cards: Container[];
  giantK: Container;
  giantG: Graphics;
  freeG: Graphics;
  raysG: Graphics;
  crac: Container;
  head: Head;
}
const S = stash<St>();
const HZ = 600;
const NAMES: [string, Kind, number][] = [
  ['MAGO MICHI', 'monster', 0],
  ['DRAGÓN MICHI', 'monster', 1],
  ['KURIMIAU', 'monster', 2],
  ['OLLA DE ATÚN', 'spell', 3],
  ['SIESTA ETERNA', 'trap', 4],
  ['GATO GUERRERO', 'monster', 5],
];

export const yugi: Signature = {
  dark: true,
  frame: PURPLE,
  tag: 'UNIVERSO DUELO',
  open(c: SigCtx) {
    const k = new Container();
    const sky = vgrad(new Graphics(), 0, 0, W, HZ + 4, [0x0a0418, 0x1e0c3a, 0x3a1a5a], 12);
    starfield(sky, 0, 0, W, HZ, 140, 77, 0xffffff, 2.4);
    const fl = new Graphics();
    const giantK = new Container();
    const giantG = giant(0.78, true);
    // built now, shown at the payoff: the giant freed (no chains) and its gold rays
    const freeG = giant(0.78, false);
    freeG.visible = false;
    const raysG = new Graphics();
    rays(raysG, 0, -500 * 0.78, 40, 120, 1600, 22, GOLD, 0.35, 5);
    raysG.blendMode = 'add';
    raysG.visible = false;
    giantK.addChild(raysG, giantG, freeG);
    giantK.position.set(W / 2, c.catY + 260);
    giantK.alpha = c.short ? 0.6 : 0;
    const circ = new Graphics();
    const pyr = new Graphics();
    k.addChild(sky, giantK, fl, circ);
    c.back.addChild(k);
    hideDisc(c, 0.15);
    c.fg.addChild(pyr);
    if (!c.short && !c.reduce) {
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.3 });
    }
    // the six cards around him (face down at first): left three, right three
    const spots: [number, number, number][] = [
      [W / 2 - 700, 400, -0.12],
      [W / 2 - 790, 640, -0.06],
      [W / 2 - 470, 760, -0.02],
      [W / 2 + 700, 400, 0.12],
      [W / 2 + 790, 640, 0.06],
      [W / 2 + 470, 760, 0.02],
    ];
    const cards: Container[] = [];
    const backs: Graphics[] = [];
    const faces: Container[] = [];
    spots.forEach(([x, y, rot], i) => {
      const ck = new Container();
      const b = back(1);
      const f = face(...NAMES[i], 1);
      f.visible = c.short;
      b.visible = !c.short;
      ck.addChild(b, f);
      ck.position.set(x, c.short || c.reduce ? y : -260);
      ck.rotation = rot;
      c.back.addChild(ck);
      cards.push(ck);
      backs.push(b);
      faces.push(f);
    });
    const head = prepHead(c, '¡SE ARMÓ!', { fontFamily: F.heavy, fontSize: 120, fill: GOLD, stroke: { color: 0x2a0a3a, width: 14, join: 'round' }, dropShadow: { color: PURPLE, distance: 8, angle: Math.PI / 4, blur: 0, alpha: 1 } }, {
      aside: '…y ni barajé.',
      asideStyle: { fill: 0xffffff, stroke: { color: 0x2a0a3a, width: 8, join: 'round' } },
      at: [440, 700],
    });
    const crac = prepWord(c.fg, W / 2 + 560, 230, '¡CRAC!', 0xffffff, 80, 0.1);
    S.set(c, { cards, giantK, giantG, freeG, raysG, crac, head });
    const frame = (t: number) => {
      if (fl.destroyed) return;
      grid(fl, W, H, HZ, t * 0.8, 1);
      circle(circ, W / 2, c.catY + 255, 430, 110, t * 0.6);
      pyramid(pyr, 560, 130, 64, 140, t * 1.4);
      pyr.y = Math.sin(t * 2) * 10;
    };
    frame(0.4);
    if (!c.reduce) every(c, 30, frame);
    if (c.short) return;

    // prepared words
    const robo = prepWord(c.fg, ...onCat(c, 0.24, 0.08), '¡ROBO!', GOLD, 86, -0.12);
    const flip = prepWord(c.fg, W / 2 + 560, 150, '¡FLIP!', HOLO, 72, 0.08);
    // ¡ROBO!: he draws with a golden trail
    const [cx0, cy0] = onCat(c, 0.3, 0.3);
    beat(c, 0.05, () => {
      sfx('charge', 1.5);
      sfx('gem', 1.4);
      show(c, robo, 0.6, { from: 1.8 });
      const tr = new Graphics();
      for (let i = 0; i < 5; i++) tr.poly(twinkle(cx0 + (Math.random() - 0.5) * 120, cy0 - 40 - Math.random() * 160, 16 + Math.random() * 20)).fill(GOLD);
      tr.poly(streak(cx0, cy0, cx0 - 40, cy0 - 260, 18, 2)).fill({ color: GOLD, alpha: 0.6 });
      c.fg.addChild(tr);
      fadeKill(tr, 0.4, 0.3);
    });
    // the cards fall face down and stand around him
    cards.forEach((ck, i) =>
      beat(c, 0.15 + i * 0.07, () => {
        sfx('whoosh', 1.3 + i * 0.05);
        if (c.reduce) return;
        gsap.fromTo(ck, { y: -260, rotation: spots[i][2] + (i % 2 ? 2 : -2) }, { y: spots[i][1], rotation: spots[i][2], duration: 0.35, ease: 'back.out(1.4)' });
      }),
    );
    // they turn over one by one
    cards.forEach((ck, i) =>
      beat(c, 0.7 + i * 0.1, () => {
        sfx('paper', 1.4 + i * 0.05);
        if (i === 0) show(c, flip, 0.7, { from: 1.6 });
        const swap = () => {
          backs[i].visible = false;
          faces[i].visible = true;
        };
        if (c.reduce) return swap();
        gsap.to(ck.scale, { x: 0, duration: 0.07, ease: 'power1.in', onComplete: () => {
          swap();
          gsap.to(ck.scale, { x: 1, duration: 0.09, ease: 'back.out(2)' });
        } });
      }),
    );
    // five gold pieces light up at the edges and fly together; the giant rises, dim
    const P0: [number, number][] = [
      [W / 2, -40],
      [120, 260],
      [W - 120, 260],
      [180, H - 120],
      [W - 180, H - 120],
    ];
    const P1: [number, number][] = [
      [W / 2, 150],
      [W / 2 - 230, 190],
      [W / 2 + 230, 190],
      [W / 2 - 130, 470],
      [W / 2 + 130, 470],
    ];
    beat(c, 1.25, () => {
      sfx('reveal', 0.9);
      P0.forEach(([x, y], i) => {
        const p = piece(i, 0.8);
        p.position.set(x, y);
        c.fg.addChild(p);
        const glow = new Graphics().poly(rrect(-96, -128, 192, 256, 18)).fill({ color: GOLD, alpha: 0.35 });
        p.addChildAt(glow, 0);
        if (c.reduce) {
          p.position.set(...P1[i]);
          fadeKill(p, 0.6, 0.3);
          return;
        }
        gsap.fromTo(p.scale, { x: 0.4, y: 0.4 }, { x: 1, y: 1, duration: 0.2, ease: 'back.out(2)' });
        gsap.to(p, { x: P1[i][0], y: P1[i][1], duration: 0.4, delay: 0.25, ease: 'power3.in' });
        gsap.to(p, { alpha: 0, delay: 0.66, duration: 0.25, onComplete: () => destroyTree(p) });
      });
    });
    beat(c, 1.7, () => {
      sfx('boom', 0.5);
      sfx('sting', 0.9);
      c.shaker.add(0.25);
      if (c.reduce) giantK.alpha = 0.55;
      else gsap.to(giantK, { alpha: 0.55, duration: 0.35 });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('fanfare', 1);
    sfx('bigboom', 0.7);
    c.shaker.add(0.45);
    flashOf(c, 0xfff2c8, 0.55, 0.35);
    if (st) {
      const { giantK, giantG, freeG, raysG } = st;
      if (!giantK.destroyed) {
        gsap.killTweensOf(giantK);
        giantK.alpha = 1;
        // the chains snap: the freed giant, its rays; links fly off
        const p = giantK.position;
        giantG.visible = false;
        freeG.visible = true;
        raysG.visible = true;
        if (!c.reduce) gsap.to(raysG, { rotation: 0.4, duration: 3, ease: 'none' });
        for (const e of [-1, 1])
          burst(c, c.fg, () => new Graphics().poly(ngon(0, 0, 24, 14, 10)).stroke({ width: 8, color: 0x9aa0aa }), 6, p.x + e * 560, p.y - 340, 500, 1);
        show(c, st.crac, 0.8, { from: 2 });
        sfx('shield', 0.6);
      }
      // the cards spin away
      for (const ck of st.cards) {
        if (ck.destroyed) continue;
        if (c.reduce || c.short) {
          destroyTree(ck);
          continue;
        }
        const side = ck.x < W / 2 ? -1 : 1;
        gsap.to(ck, { x: ck.x + side * 700, y: ck.y - 200 - Math.random() * 300, rotation: side * 6, duration: 0.8, delay: Math.random() * 0.2, ease: 'power2.in', onComplete: () => destroyTree(ck) });
      }
    }
    showHead(c, st?.head, { dur: 2.5 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const s = m / 1080;
    const hz = h * 0.58;
    const sky = vgrad(new Graphics(), 0, 0, w, hz + 4, [0x0a0418, 0x1e0c3a, 0x3a1a5a], 10);
    starfield(sky, 0, 0, w, hz, Math.round((w * hz) / 9000), 77, 0xffffff, Math.max(1, 2.4 * s * 1.4));
    const fl = new Graphics();
    grid(fl, w, h, hz, 0.3, s * 1.2);
    const gk = giant(s * 0.55, true);
    gk.position.set(w / 2, h * 0.96);
    gk.alpha = 0.5;
    const circ = new Graphics();
    circle(circ, w / 2, h * 0.82, m * 0.4, m * 0.1, 0, 1);
    // a fan of face-down cards behind the heart (the wide page: faces too)
    const fan = new Container();
    const wide = w > h * 2;
    const n = wide ? 6 : 3;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1) - 0.5;
      const cs = s * (wide ? 1.1 : 0.9);
      const cd = wide ? face(...NAMES[i], cs) : back(cs);
      cd.position.set(w / 2 + u * (wide ? m * 2.3 : m * 0.9), h * (wide ? 0.42 : 0.38) + Math.abs(u) * m * 0.12);
      cd.rotation = u * (wide ? 0.2 : 0.6);
      fan.addChild(cd);
    }
    const pyr = new Graphics();
    const px = wide ? w / 2 - m * 1.45 : w * 0.16;
    const pa = m * (wide ? 0.08 : 0.07);
    pyramid(pyr, px, h * 0.16, pa, pa * 2.1, 0.6);
    k.addChild(sky, gk, fl, circ, fan, pyr);
    if (live)
      liveLoop(k, (t) => {
        grid(fl, w, h, hz, 0.3 + t * 0.6, s * 1.2);
        circle(circ, w / 2, h * 0.82, m * 0.4, m * 0.1, t * 0.5, 1);
        pyramid(pyr, px, h * 0.16 + Math.sin(t * 2) * 6 * s, pa, pa * 2.1, 0.6 + t * 1.2);
      });
    return k;
  },
};
