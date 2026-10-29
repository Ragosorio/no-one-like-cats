/**
 * Michimpostor: the spaceship universe (a crewmates-in-space social-deduction game). The ship seen from above — a big
 * octagonal hall of floor panels, corridors out to the stars, a vent in the floor, the meeting table with the giant red
 * button — under red alarm lights. «¡REUNIÓN DE EMERGENCIA!»: the button goes ¡PIC! and the crew (beans in spacesuits…
 * with cat ears) run in from every corridor and ring him, «?» over every visor; the vent lid pops; the VOTACIÓN
 * tablet slides in and every vote lands on his row; the «?» turn to «!»: ¡SOSPECHOSO!
 * Payoff: the ship drops away — open space, stars streaming — and the green one tumbles past;
 * ¡ERA EL MICHIMPOSTOR! / …pero sacaron al verde.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, every, later } from './kit';
import { hideDisc } from './kitA';
import { fadeKill, stash } from './kitB';
import { beat, pay } from './kitC';
import { ngon, rnd, starfield, streak } from './kitD';
import { type Head, prep, prepHead, prepWord, rrect, show, showHead } from './kitE';
import { liveLoop } from '../../../panels/collection/cardArt';

const RED = 0xc51111;
const VISOR = 0x9fd8ff;
const SPACE = 0x05070f;
const FLOOR = 0x8a94a6;
const WALL = 0x232b45;
/** the crew: cyan, lime, yellow, pink, orange, purple, white, GREEN (the one they throw out), brown */
const CREW = [0x38fedc, 0x50ef39, 0xf5f557, 0xed54ba, 0xf07d0d, 0x6b2fbb, 0xd6e0f0, 0x117f2d, 0x71491e];
const GREEN = 7;
const shade = (c: number, k: number) => (Math.round(((c >> 16) & 255) * k) << 16) | (Math.round(((c >> 8) & 255) * k) << 8) | Math.round((c & 255) * k);

/** a crewmate: a bean in a spacesuit with a visor, a backpack and two cat ears (origin at its feet, facing +x), `s` = height */
function bean(color: number, s: number) {
  const g = new Graphics();
  const ink = { width: Math.max(1.5, s * 0.06), color: C.ink, join: 'round' as const };
  const dark = shade(color, 0.62);
  g.poly(rrect(-0.6 * s, -0.84 * s, 0.3 * s, 0.5 * s, 0.1 * s)).fill(dark).stroke(ink);
  g.poly([-0.34 * s, -0.86 * s, -0.27 * s, -1.12 * s, -0.08 * s, -0.94 * s]).fill(color).stroke(ink);
  g.poly([0.1 * s, -0.94 * s, 0.27 * s, -1.12 * s, 0.34 * s, -0.86 * s]).fill(color).stroke(ink);
  g.poly(rrect(-0.38 * s, -1 * s, 0.76 * s, 0.9 * s, 0.36 * s)).fill(color).stroke(ink);
  g.poly(rrect(-0.36 * s, -0.16 * s, 0.3 * s, 0.18 * s, 0.07 * s)).fill(color).stroke(ink);
  g.poly(rrect(0.06 * s, -0.16 * s, 0.3 * s, 0.18 * s, 0.07 * s)).fill(color).stroke(ink);
  g.poly([-0.36 * s, -0.4 * s, -0.1 * s, -0.2 * s, 0.36 * s, -0.24 * s, 0.36 * s, -0.12 * s, -0.36 * s, -0.12 * s]).fill({ color: dark, alpha: 0.55 });
  g.poly(rrect(-0.04 * s, -0.8 * s, 0.5 * s, 0.28 * s, 0.13 * s)).fill(VISOR).stroke(ink);
  g.poly(rrect(0.1 * s, -0.76 * s, 0.24 * s, 0.07 * s, 0.03 * s)).fill({ color: 0xffffff, alpha: 0.85 });
  return g;
}

/** the hall's geometry (screen scale k, centered on cx, cy) */
const HALL_R = 470;

/** the floor plan: space, the octagonal hall of panels, four corridors, walls, the meeting table, a vent */
function ship(g: Graphics, w: number, h: number, cx: number, cy: number, k: number, seed: number) {
  g.rect(0, 0, w, h).fill(SPACE);
  starfield(g, 0, 0, w, h, Math.round((w * h) / 9000), seed, 0xffffff, 2.6 * Math.max(0.5, k));
  const R = HALL_R * k;
  const oct = ngon(cx, cy, R, R * 0.92, 8, Math.PI / 8);
  // corridors: floor bands out to the edges (left/right/up/down), walls along them
  const cw = 70 * k;
  const cor: [number, number, number, number][] = [
    [0, cy - cw, cx, cw * 2],
    [cx, cy - cw, w - cx, cw * 2],
    [cx - cw, 0, cw * 2, cy],
    [cx - cw, cy, cw * 2, h - cy],
  ];
  for (const [x, y, ww, hh] of cor) g.rect(x, y, ww, hh).fill(0x6f798c);
  for (const [x, y, ww, hh] of cor) {
    if (ww > hh) g.rect(x, y - 14 * k, ww, 14 * k).rect(x, y + hh, ww, 14 * k).fill(WALL);
    else g.rect(x - 14 * k, y, 14 * k, hh).rect(x + ww, y, 14 * k, hh).fill(WALL);
  }
  g.poly(oct).fill(FLOOR).stroke({ width: 26 * k, color: WALL, join: 'miter' });
  // the doorways: the corridor floor cuts through the wall
  g.rect(cx - R - 20 * k, cy - cw, 40 * k, cw * 2).rect(cx + R - 20 * k, cy - cw, 40 * k, cw * 2).rect(cx - cw, cy - R * 0.92 - 20 * k, cw * 2, 40 * k).rect(cx - cw, cy + R * 0.92 - 20 * k, cw * 2, 40 * k).fill(0x6f798c);
  // the floor panels (inside the hall)
  const t = 62 * k;
  for (let y = cy - R; y < cy + R; y += t)
    for (let x = cx - R; x < cx + R; x += t) {
      const mx = x + t / 2 - cx;
      const my = (y + t / 2 - cy) / 0.92;
      if (Math.abs(mx) + Math.abs(my) > R * 1.25 || Math.abs(mx) > R * 0.86 || Math.abs(my) > R * 0.86) continue;
      g.rect(x + 2 * k, y + 2 * k, t - 4 * k, t - 4 * k);
    }
  g.fill({ color: 0x9aa4b6, alpha: 0.9 });
  // the meeting table and its giant red button (lower left of the hall)
  const tx = cx - 350 * k;
  const ty = cy + 220 * k;
  g.poly(ngon(tx, ty + 10 * k, 112 * k, 104 * k, 24)).fill({ color: 0x000000, alpha: 0.3 });
  g.poly(ngon(tx, ty, 108 * k, 100 * k, 24)).fill(0x5a6a8a).stroke({ width: 6 * k, color: WALL });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.poly(ngon(tx + Math.cos(a) * 150 * k, ty + Math.sin(a) * 138 * k, 22 * k, 20 * k, 10)).fill(0x3c4866).stroke({ width: 4 * k, color: WALL });
  }
  // a vent in the floor (lower right)
  const vx = cx + 300 * k;
  const vy = cy + 300 * k;
  g.poly(rrect(vx - 60 * k, vy - 34 * k, 120 * k, 68 * k, 8 * k)).fill(0x2a3248).stroke({ width: 5 * k, color: 0x1a2034 });
  for (let i = 0; i < 5; i++) g.rect(vx - 48 * k, vy - 24 * k + i * 11 * k, 96 * k, 5 * k);
  g.fill(0x56607a);
  return { tx, ty, vx, vy };
}

/** the giant red button on its base (origin at its center), `press` 0..1 */
function button(g: Graphics, s: number, press: number, lit = 0) {
  g.clear();
  g.poly(ngon(0, 8 * s, 62 * s, 50 * s, 20)).fill(0x8a8f9a).stroke({ width: 4 * s, color: C.ink });
  const up = (1 - press) * 18 * s;
  g.poly(ngon(0, 4 * s - up * 0.4, 46 * s, 36 * s, 20)).fill(0x7a0a0a);
  g.poly(ngon(0, -up, 44 * s, 34 * s, 20)).fill(lit ? 0xff4a3a : RED).stroke({ width: 4 * s, color: C.ink });
  g.poly(ngon(-14 * s, -up - 10 * s, 14 * s, 7 * s, 10, -0.3)).fill({ color: 0xffffff, alpha: 0.6 });
}

/** a round «?» or «!» badge over a visor */
function mark(q: string) {
  const k = new Container();
  const g = new Graphics().poly(ngon(0, 0, 30, 30, 16)).fill(q === '!' ? RED : 0xffffff).stroke({ width: 4, color: C.ink });
  const t = txt(q, { fontFamily: F.heavy, fontSize: 38, fill: q === '!' ? 0xffffff : C.ink });
  t.anchor.set(0.5);
  t.y = 1;
  k.addChild(g, t);
  return k;
}

/** the VOTACIÓN tablet: 4 rows (him first) + SALTAR VOTO; returns the panel and each row's vote slot origin */
function ballot() {
  const k = new Container();
  const PW = 500;
  const PH = 452;
  const g = new Graphics();
  g.poly(rrect(8, 10, PW, PH, 22)).fill({ color: 0x000000, alpha: 0.5 });
  g.poly(rrect(0, 0, PW, PH, 22)).fill(0xc9d3e2).stroke({ width: 6, color: C.ink });
  g.poly(rrect(16, 64, PW - 32, PH - 80, 12)).fill(0x95a3ba);
  const title = txt('VOTACIÓN', { fontFamily: F.heavy, fontSize: 34, fill: C.ink, letterSpacing: 4 });
  title.anchor.set(0.5, 0);
  title.position.set(PW / 2, 14);
  k.addChild(g, title);
  const rows: [number, number][] = [];
  const who: [number, string][] = [
    [RED, 'MICHIMPOSTOR'],
    [CREW[GREEN], 'VERDE'],
    [CREW[3], 'ROSA'],
    [CREW[0], 'CIAN'],
  ];
  who.forEach(([col, name], i) => {
    const y = 80 + i * 80;
    const rg = new Graphics().poly(rrect(28, y, PW - 56, 66, 10)).fill(i === 0 ? 0xf2e6c8 : 0xe2e8f0).stroke({ width: 4, color: C.ink });
    const b = bean(col, 46);
    b.position.set(62, y + 58);
    const n = txt(name, { fontFamily: F.heavy, fontSize: 20, fill: C.ink });
    n.position.set(98, y + 8);
    k.addChild(rg, b, n);
    rows.push([104, y + 48]);
  });
  const skip = txt('SALTAR VOTO', { fontFamily: F.heavy, fontSize: 20, fill: C.ink });
  skip.position.set(36, PH - 46);
  k.addChild(skip);
  return { k, rows, PW };
}

/** a little vote: a crewmate's head (its color) */
function vote(color: number) {
  const g = new Graphics();
  g.poly(ngon(0, 0, 13, 13, 12)).fill(color).stroke({ width: 3, color: C.ink });
  g.poly(rrect(-1, -6, 12, 7, 3)).fill(VISOR);
  return g;
}

interface Crew {
  k: Container;
  x: number;
  y: number;
}
interface St {
  shipK: Container;
  space: Graphics;
  crew: Crew[];
  head: Head;
  alarm: Graphics;
}
const S = stash<St>();

/** the ring of places around him (and the corridor each one comes in from) */
function places(cx: number, cy: number): [number, number, number, number][] {
  const out: [number, number, number, number][] = [];
  const angs = [-2.6, -1.95, -1.2, -0.45, 0.25, 0.85, 1.55, 3.0];
  angs.forEach((a, i) => {
    const x = cx + Math.cos(a) * 400 + (i % 2 ? 0 : 20);
    const y = cy + 40 + Math.sin(a) * 330;
    // from: the nearest corridor's far end
    const from: [number, number] = Math.abs(Math.cos(a)) > 0.6 ? [Math.cos(a) < 0 ? -80 : W + 80, cy + 40] : [cx + (Math.cos(a) < 0 ? -40 : 40), Math.sin(a) < 0 ? -80 : H + 80];
    out.push([x, y, ...from]);
  });
  return out;
}

export const michimpostor: Signature = {
  dark: true,
  frame: RED,
  tag: 'UNIVERSO DE LA NAVE',
  open(c: SigCtx) {
    const cx = W / 2;
    const cy = c.catY + 20;
    const shipK = new Container();
    const g = new Graphics();
    const sp = ship(g, W, H, cx, cy, 1, 41);
    const btn = new Graphics();
    btn.position.set(sp.tx, sp.ty - 6);
    button(btn, 1, 0);
    const lid = new Graphics().poly(rrect(-62, -36, 124, 72, 8)).fill(0x4a5470).stroke({ width: 5, color: 0x1a2034 });
    lid.position.set(sp.vx, sp.vy);
    // red alarm: a wash over the ship + two beacons in the corners
    const alarm = new Graphics().rect(0, 0, W, H).fill(0xff1a1a);
    alarm.alpha = 0;
    const beacons = new Graphics();
    beacons.blendMode = 'add';
    shipK.addChild(g, btn, lid, beacons, alarm);
    // the space behind the ship (seen at the payoff, when the ship drops away)
    const space = new Graphics();
    c.back.addChild(space, shipK);
    hideDisc(c, 0.15);
    const crewL = new Container();
    c.behind.addChild(crewL);
    const crew: Crew[] = [];
    const P = places(cx, cy);
    P.forEach(([x, y, fx, fy], i) => {
      const k = new Container();
      const b = bean(CREW[i], 112);
      k.addChild(b);
      k.position.set(c.short || c.reduce ? x : fx, c.short || c.reduce ? y : fy);
      // they all face him
      k.scale.x = x < cx ? 1 : -1;
      crewL.addChild(k);
      crew.push({ k, x, y });
    });
    // sort by depth (lower = in front)
    crewL.children.sort((a, b) => a.y - b.y);
    const head = prepHead(c, '¡ERA EL MICHIMPOSTOR!', { fontFamily: F.heavy, fontSize: 84, fill: 0xffffff, stroke: { color: C.ink, width: 12, join: 'round' }, dropShadow: { color: RED, distance: 7, angle: Math.PI / 4, blur: 0, alpha: 1 } }, {
      aside: '…pero sacaron al verde.',
      asideStyle: { fill: 0x7dffa0 },
      maxW: 800,
      at: [480, 700],
    });
    S.set(c, { shipK, space, crew, head, alarm });
    // the alarm lives: the red wash pulses (steady with Reducir destellos), the beacons turn
    const frame = (t: number) => {
      if (alarm.destroyed) return;
      alarm.alpha = c.flashes && !c.reduce ? 0.06 + 0.16 * (0.5 + 0.5 * Math.sin(t * 9)) : 0.12;
      beacons.clear();
      for (const [bx, by] of [
        [cx - HALL_R * 0.75, cy - HALL_R * 0.66],
        [cx + HALL_R * 0.75, cy - HALL_R * 0.66],
      ]) {
        const a = t * 4 + bx;
        beacons.poly([bx, by, bx + Math.cos(a - 0.3) * 900, by + Math.sin(a - 0.3) * 900, bx + Math.cos(a + 0.3) * 900, by + Math.sin(a + 0.3) * 900]).fill({ color: 0xff3a2a, alpha: 0.14 });
        beacons.poly(ngon(bx, by, 22, 22, 12)).fill(0xff5a4a);
      }
    };
    frame(0.4);
    if (!c.reduce) every(c, 30, frame);
    if (c.short) return;

    // prepared words
    // the long words are ONE Text each (stroke + drop shadow): three CMYK copies of a 1300 px word cost the break frame
    const meet = prep(c.fg, '¡REUNIÓN DE EMERGENCIA!', { fontFamily: F.heavy, fontSize: 80, fill: 0xffffff, stroke: { color: C.ink, width: 10, join: 'round' }, dropShadow: { color: RED, distance: 7, angle: Math.PI / 4, blur: 0, alpha: 1 } }, cx, 120, -0.03);
    const pic = prepWord(c.fg, sp.tx - 10, sp.ty - 150, '¡PIC!', 0xffe14d, 80, -0.1);
    const clonc = prep(c.fg, '¡CLONC!', { fontFamily: F.comic, fontSize: 56, fill: 0xffffff, stroke: { color: C.ink, width: 8, join: 'round' } }, sp.vx + 40, sp.vy - 90, 0.12);
    const sus = prep(c.fg, '¡SOSPECHOSO!', { fontFamily: F.comic, fontSize: 104, fill: RED, letterSpacing: 2, stroke: { color: C.ink, width: 12, join: 'round' }, dropShadow: { color: 0xffffff, distance: 6, angle: Math.PI / 4, blur: 0, alpha: 1 } }, 450, 300, -0.1);
    // the ballot is built at a quiet beat (off the break frame), shown at 1.25 s
    const bal = { k: new Container(), rows: [] as [number, number][], PW: 500 };
    beat(c, 0.6, () => {
      const b = ballot();
      bal.k = b.k;
      bal.rows = b.rows;
      b.k.position.set(W - b.PW - 60, 250);
      b.k.alpha = 0.001;
      c.fg.addChild(b.k);
    });

    sfx('alarm', 1);
    beat(c, 0.55, () => sfx('alarm', 1));
    beat(c, 0.12, () => show(c, meet, 0.95, { from: 1.8 }));
    // the button: ¡PIC!
    beat(c, 0.42, () => {
      sfx('click', 0.8);
      sfx('hit', 1.4);
      c.shaker.add(0.15);
      if (c.reduce) button(btn, 1, 1, 1);
      else {
        const p = { v: 0 };
        gsap.to(p, { v: 1, duration: 0.08, yoyo: true, repeat: 1, onUpdate: () => !btn.destroyed && button(btn, 1, p.v, 1) });
      }
      show(c, pic, 0.5, { from: 2 });
    });
    // the crew run in from the corridors and ring him (footsteps)
    if (!c.reduce)
      crew.forEach((m, i) => {
        const d = 0.18 + i * 0.07;
        gsap.to(m.k, { x: m.x, y: m.y, duration: 0.62, delay: d, ease: 'power2.out' });
        const b = m.k.children[0];
        gsap.fromTo(b, { y: 0 }, { y: -10, duration: 0.09, yoyo: true, repeat: 6, delay: d, ease: 'sine.inOut' });
      });
    for (let i = 0; i < 8; i++) beat(c, 0.25 + i * 0.08, () => sfx('tick', 2 + (i % 3) * 0.2));
    // «?» over every visor
    const marks: Container[] = [];
    crew.forEach((m, i) =>
      beat(c, 0.95 + i * 0.05, () => {
        const q = mark('?');
        q.position.set(m.x, m.y - 148);
        c.fg.addChild(q);
        marks.push(q);
        if (i % 2 === 0) sfx('pop', 1.4 + i * 0.05);
        if (!c.reduce) gsap.fromTo(q.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.16, ease: 'back.out(3)' });
      }),
    );
    // the vent lid pops
    beat(c, 1.15, () => {
      sfx('shield', 0.7);
      show(c, clonc, 0.6, { from: 1.6 });
      if (lid.destroyed) return;
      if (c.reduce) lid.rotation = 0.5;
      else gsap.to(lid, { y: lid.y - 30, rotation: 0.5, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out' });
    });
    // the ballot: every vote lands on his row
    beat(c, 1.25, () => {
      if (bal.k.destroyed || !bal.k.parent) return;
      sfx('whoosh', 1.1);
      bal.k.alpha = 1;
      if (!c.reduce) gsap.from(bal.k, { x: W + 40, duration: 0.25, ease: 'power3.out' });
      fadeKill(bal.k, 0.95, 0.25);
    });
    const r = rnd(5);
    for (let i = 0; i < 7; i++)
      beat(c, 1.4 + i * 0.065, () => {
        if (bal.k.destroyed || !bal.rows.length) return;
        const row = i === 5 ? 1 : 0;
        const [vx, vy] = bal.rows[row];
        const n = bal.k.children.filter((ch) => ch.label === `v${row}`).length;
        const v = vote(CREW[i === 5 ? 0 : Math.floor(r() * 7)]);
        v.label = `v${row}`;
        v.position.set(vx + n * 30, vy);
        bal.k.addChild(v);
        sfx('click', 1.6 + i * 0.06);
        if (!c.reduce) gsap.fromTo(v.scale, { x: 2, y: 2 }, { x: 1, y: 1, duration: 0.12, ease: 'back.out(3)' });
      });
    // the «?» turn to «!»: ¡SOSPECHOSO!
    beat(c, 1.85, () => {
      sfx('sting', 1.2);
      c.shaker.add(0.2);
      for (const q of marks) {
        if (q.destroyed) continue;
        const x = q.x;
        const y = q.y;
        destroyTree(q);
        const e = mark('!');
        e.position.set(x, y);
        c.fg.addChild(e);
        if (!c.reduce) gsap.fromTo(e.scale, { x: 1.6, y: 1.6 }, { x: 1, y: 1, duration: 0.14, ease: 'back.out(3)' });
        fadeKill(e, 0.7, 0.25);
      }
      show(c, sus, 0.85, { from: 2.2 });
    });
    later(c, 2.6, () => marks.forEach((q) => !q.destroyed && fadeKill(q, 0, 0.2)));
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('fanfare', 1);
    sfx('whoosh', 0.6);
    c.shaker.add(0.3);
    if (st) {
      const { shipK, space, crew } = st;
      // the ship drops away: open space, the stars streaming past
      const r = rnd(9);
      const stars: [number, number, number][] = [];
      for (let i = 0; i < 160; i++) stars.push([r() * W, r() * H, 0.3 + r() * r() * 2.2]);
      const draw = (t: number) => {
        if (space.destroyed) return;
        space.clear().rect(0, 0, W, H).fill(SPACE);
        for (const [x, y, z] of stars) {
          const xx = (((x - t * 260 * z) % W) + W) % W;
          const L = c.reduce ? 0 : z * 26;
          space.poly(streak(xx, y, xx + L + 2, y, z * 1.2, z * 1.2));
        }
        space.fill({ color: 0xffffff, alpha: 0.85 });
      };
      draw(0);
      if (!c.reduce) every(c, 30, draw);
      // a ringed planet far off (lower right), drifting
      if (!space.destroyed && space.parent) {
        const pl = new Graphics();
        pl.poly(ngon(0, 0, 250, 250, 40)).fill(0x3a2a6a);
        for (let i = 0; i < 5; i++) pl.poly([-250, -150 + i * 70, 250, -190 + i * 70, 250, -160 + i * 70, -250, -120 + i * 70]).fill({ color: 0x6a4aa8, alpha: 0.5 });
        pl.poly(ngon(-60, -80, 120, 90, 20)).fill({ color: 0xffffff, alpha: 0.06 });
        pl.poly(ngon(0, 0, 420, 90, 40, 0)).stroke({ width: 18, color: 0xb8a0ff, alpha: 0.7 });
        pl.rotation = -0.25;
        pl.position.set(W - 180, H - 120);
        space.parent.addChildAt(pl, space.parent.getChildIndex(space) + 1);
        if (!c.reduce) gsap.to(pl, { x: pl.x - 60, duration: 6, ease: 'none' });
      }
      if (!shipK.destroyed) {
        if (c.reduce) shipK.visible = false;
        else gsap.to(shipK, { y: -H * 1.1, duration: 0.45, ease: 'power2.in', onComplete: () => destroyTree(shipK) });
      }
      for (const m of crew) {
        if (m.k.destroyed) continue;
        gsap.killTweensOf(m.k);
        if (c.reduce) m.k.visible = false;
        else gsap.to(m.k, { y: m.k.y - H * 1.1, duration: 0.45, ease: 'power2.in', onComplete: () => destroyTree(m.k) });
      }
      // the green one tumbles past
      const gb = bean(CREW[GREEN], 120);
      const tk = new Container();
      tk.addChild(gb);
      gb.y = 60;
      c.fg.addChild(tk);
      if (c.reduce) {
        tk.position.set(W - 380, 380);
        tk.rotation = 0.8;
        fadeKill(tk, 2.4, 0.3);
      } else {
        tk.position.set(-140, 330);
        gsap.to(tk, { x: W + 160, y: 420, duration: 3.2, delay: 0.35, ease: 'none', onComplete: () => destroyTree(tk) });
        gsap.to(tk, { rotation: Math.PI * 3, duration: 3.2, delay: 0.35, ease: 'none' });
      }
    }
    showHead(c, st?.head, { dur: 2.6, asideDelay: 0.9 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const s = m / 1080;
    const g = new Graphics();
    const cx = w / 2;
    const cy = h * 0.52;
    const kk = (m / 1080) * 1.15;
    const sp = ship(g, w, h, cx, cy, kk, 41);
    const btn = new Graphics();
    btn.position.set(sp.tx, sp.ty - 6 * kk);
    button(btn, kk, 0);
    const alarm = new Graphics().rect(0, 0, w, h).fill(0xff1a1a);
    alarm.alpha = 0.1;
    const crewL = new Container();
    // a few crewmates around the heart (the wide page gets the whole crew along its sides)
    const many = w > h * 2;
    const spots: [number, number, number][] = many
      ? [
          [cx - m * 0.62, cy + m * 0.1, 0],
          [cx - m * 0.48, cy - m * 0.26, 3],
          [cx + m * 0.5, cy - m * 0.24, 4],
          [cx + m * 0.64, cy + m * 0.14, 2],
          [cx - m * 1.1, cy + m * 0.04, 5],
          [cx + m * 1.12, cy + m * 0.02, 6],
        ]
      : [
          [cx - m * 0.4, cy + m * 0.16, 0],
          [cx + m * 0.4, cy + m * 0.12, 4],
        ];
    const bs: Container[] = [];
    for (const [x, y, i] of spots) {
      const b = bean(CREW[i], 110 * s * 1.3);
      b.position.set(x, y);
      b.scale.x = x < cx ? 1 : -1;
      crewL.addChild(b);
      bs.push(b);
    }
    k.addChild(g, btn, crewL, alarm);
    if (live) {
      const y0 = bs.map((b) => b.y);
      liveLoop(k, (t) => {
        alarm.alpha = 0.06 + 0.1 * (0.5 + 0.5 * Math.sin(t * 3));
        bs.forEach((b, i) => (b.y = y0[i] - Math.abs(Math.sin(t * 5 + i)) * 6 * s * 1.3));
        button(btn, kk, 0, Math.sin(t * 3) > 0.6 ? 1 : 0);
      });
    }
    return k;
  },
};
