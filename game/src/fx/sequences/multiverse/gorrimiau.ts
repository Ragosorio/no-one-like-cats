/**
 * Capitán Gorrimiau, el de la Brújula que Apunta al Atún: the cursed-sea universe (a generic buccaneer tale: no ship
 * names, no film skull, no lines). A stormy night on a black-green sea: storm clouds, a sickly moon, tall waves with foam,
 * banks of fog — and out of the fog comes a ship with black, torn sails and green lanterns (its flag: a fish skeleton).
 * He swings from a rope of its rigging, the lightning cracks (¡KRA-KOOOM!), and in the foreground his brass compass
 * snaps open (¡CLIC!): the needle spins mad… and nails — ¡CLAC! — not north but a tuna can bobbing on the horizon in the
 * moonlight: RUMBO: ATÚN.
 * Payoff: the fog parts, the can blazes like treasure, gold coins burst out of it and rain on the deck, the lanterns go
 * gold; ¡ATÚN A LA VISTA! / …el norte está sobrevalorado.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { liveLoop } from '../../../panels/collection/cardArt';
import { type Signature, type SigCtx, backlight, burst, cheer, every, fall, flashOf, later, plate } from './kit';
import { hideDisc } from './kitA';
import { stash, vgrad } from './kitB';
import { borrowPose, fogBank, wavePts } from './kitC';
import { aside, ngon, onCat, rnd, streak, twinkle } from './kitD';
import { strip } from './kitH';
import { at, boltPts, comic, pre, wrap } from './kitI';
import { coin, stormClouds } from './kitL';

const GOLD = 0xe6c34a;
const RED = 0xc8102e;
const SKY = [0x04070a, 0x0b1714, 0x1a2e28, 0x2f4a40];
const SEA = [0x0b2422, 0x07181a, 0x041012];
const FOAM = 0xbfd8cc;
const FOG = 0x8aa898;
const SAIL = 0x15131a;
const HULL = 0x2a1a12;
const LANTERN = 0x7dffb0;
const MOON = 0xd8f0d0;
const HZ = 640;
/** the tuna can bobbing on the horizon (under the moon) and the compass in the foreground */
const CAN: [number, number] = [560, 612];
const MOON_AT: [number, number] = [560, 190];
const COMPASS: [number, number] = [330, 830];

/** the cursed ship, side view, bow to the left (origin at the waterline, middle): torn black sails, green lanterns */
function ship(s = 1, lit = LANTERN) {
  const k = new Container();
  const g = new Graphics();
  const P = (pts: number[]) => pts.map((v) => v * s);
  // rigging behind the sails
  for (const [x0, y0, x1, y1] of [
    [-150, -540, -330, -90],
    [-150, -540, 0, -90],
    [0, -620, -150, -90],
    [0, -620, 170, -100],
    [170, -480, 320, -170],
    [170, -480, 0, -100],
  ])
    g.poly(P(streak(x0, y0, x1, y1, 1.3, 1.3))).fill(0x3a3030);
  // masts and yards
  for (const [x, top] of [
    [-150, -540],
    [0, -620],
    [170, -480],
  ]) {
    g.poly(P([x - 7, -60, x + 7, -60, x + 5, top, x - 5, top])).fill(0x3a2418);
    g.rect((x - 10) * s, (top - 4) * s, 20 * s, 12 * s).fill(0x3a2418);
  }
  // torn sails: each a quad with a ragged lower edge and holes (cut)
  const sail = (x: number, y0: number, y1: number, hw: number, seed: number) => {
    const r = rnd(seed);
    g.rect((x - hw - 8) * s, (y0 - 6) * s, (hw * 2 + 16) * s, 8 * s).fill(0x3a2418);
    const pts = [x - hw, y0, x + hw, y0];
    const n = 7;
    for (let i = 0; i <= n; i++) {
      const xx = x + hw * 1.08 - (i / n) * hw * 2.16;
      pts.push(xx, y1 - (i % 2 ? r() * 40 : r() * 12));
    }
    g.poly(P(pts)).fill(SAIL);
    for (let i = 0; i < 2; i++) {
      const hx = x + (r() - 0.5) * hw;
      const hy = y0 + (y1 - y0) * (0.3 + r() * 0.4);
      g.poly(P([hx - 18, hy - 10, hx + 6, hy - 22, hx + 20, hy + 4, hx + 2, hy + 24, hx - 14, hy + 12])).cut();
    }
    g.poly(P(streak(x - hw, y0 + 6, x + hw * 0.4, y1 - 20, 1.2, 1.2))).fill({ color: 0x3a3440, alpha: 0.8 });
  };
  sail(-150, -500, -330, 120, 1);
  sail(-150, -310, -150, 150, 2);
  sail(0, -580, -390, 130, 3);
  sail(0, -370, -170, 170, 4);
  sail(170, -450, -300, 100, 5);
  sail(170, -285, -150, 120, 6);
  // the flag: a fish skeleton on black
  const fx = 0;
  const fy = -660;
  g.rect(fx * s, fy * s, 90 * s, 54 * s).fill(0x0c0b10);
  g.poly(P([fx + 6, fy + 54, fx + 30, fy + 70, fx + 46, fy + 54])).fill(0x0c0b10);
  g.poly(P(streak(fx + 22, fy + 27, fx + 62, fy + 27, 2.5, 2.5))).fill(0xf2efe6);
  for (let i = 0; i < 4; i++) g.poly(P(streak(fx + 30 + i * 8, fy + 15, fx + 30 + i * 8, fy + 39, 1.6, 1.6))).fill(0xf2efe6);
  g.poly(P(ngon(fx + 70, fy + 27, 10, 9, 8))).fill(0xf2efe6);
  g.poly(P([fx + 22, fy + 27, fx + 10, fy + 16, fx + 10, fy + 38])).fill(0xf2efe6);
  g.poly(P(ngon(fx + 73, fy + 25, 2.5, 2.5, 6))).fill(0x0c0b10);
  // the hull: a high stern castle on the right, the bow and bowsprit on the left
  g.poly(P([-360, -120, -300, -96, -240, -70, -230, 10, -170, 40, 230, 40, 300, 0, 330, -170, 200, -175, 190, -110, -150, -100, -250, -118]))
    .fill(HULL)
    .stroke({ width: 3 * s, color: 0x120a06 });
  g.poly(P(streak(-250, -116, -470, -200, 5, 3))).fill(0x3a2418);
  g.poly(P(streak(-240, -66, 300, -50, 4, 4))).fill(GOLD);
  g.poly(P(streak(-228, -16, 290, -6, 3, 3))).fill({ color: GOLD, alpha: 0.7 });
  for (let i = 0; i < 8; i++) g.rect((-180 + i * 52) * s, -42 * s, 22 * s, 18 * s).fill(0x0c0806);
  g.rect(210 * s, -160 * s, 100 * s, 50 * s).fill(0x1a100a);
  for (let i = 0; i < 3; i++) g.rect((220 + i * 30) * s, -150 * s, 20 * s, 28 * s).fill({ color: lit, alpha: 0.75 });
  k.addChild(g);
  // the lanterns (their glow can blaze at the payoff)
  const glow = new Graphics();
  for (const [x, y] of [
    [310, -190],
    [-250, -130],
    [190, -195],
  ]) {
    for (let i = 4; i >= 1; i--) glow.poly(ngon(x * s, y * s, 16 * i * s, 16 * i * s, 12)).fill({ color: lit, alpha: 0.07 });
    glow.poly(ngon(x * s, y * s, 9 * s, 12 * s, 8)).fill(lit);
  }
  k.addChild(glow);
  return { k, glow };
}

/** a tuna can (origin at its center): silver rim, blue label with a fish (no brand) */
function tunaCan(s = 1) {
  const g = new Graphics();
  g.poly(ngon(0, 18 * s, 46 * s, 14 * s, 16)).fill(0x8a929c);
  g.rect(-46 * s, -12 * s, 92 * s, 30 * s).fill(0x2a6ac8);
  g.rect(-46 * s, -12 * s, 92 * s, 5 * s).fill(0xd8dee6).rect(-46 * s, 13 * s, 92 * s, 5 * s).fill(0xd8dee6);
  g.poly(ngon(-4 * s, 3 * s, 16 * s, 7 * s, 10)).fill(0xf2efe6);
  g.poly([12 * s, 3 * s, 22 * s, -4 * s, 22 * s, 10 * s]).fill(0xf2efe6);
  g.poly(ngon(0, -12 * s, 46 * s, 14 * s, 16)).fill(0xd8dee6).stroke({ width: 2.5 * s, color: 0x5a626c });
  g.poly(ngon(0, -12 * s, 38 * s, 10 * s, 16)).stroke({ width: 2 * s, color: 0x9aa2ac });
  g.poly(ngon(18 * s, -14 * s, 9 * s, 4 * s, 8)).fill(0x9aa2ac);
  return g;
}

/** the brass compass (origin at its center): case, face, letters; returns the needle and the lid to animate */
function compass(r: number) {
  const k = new Container();
  const g = new Graphics();
  g.poly(ngon(6, 8, r * 1.08, r * 1.08, 28)).fill({ color: 0x000000, alpha: 0.35 });
  g.poly(ngon(0, 0, r * 1.08, r * 1.08, 28)).fill(0xb8861e).stroke({ width: 4, color: C.ink });
  g.poly(ngon(0, 0, r * 0.92, r * 0.92, 28)).fill(0xf2e6c8).stroke({ width: 3, color: 0x7a5a1a });
  g.rect(-10, -r * 1.24, 20, r * 0.2).fill(0xb8861e).stroke({ width: 3, color: C.ink });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r0 = i % 4 ? r * 0.8 : r * 0.7;
    g.poly(streak(Math.cos(a) * r0, Math.sin(a) * r0, Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, i % 4 ? 1.5 : 3, i % 4 ? 1.5 : 3)).fill(0x5a4010);
  }
  g.poly([0, -r * 0.62, r * 0.1, -r * 0.1, 0, 0, -r * 0.1, -r * 0.1]).fill({ color: 0x5a4010, alpha: 0.25 });
  k.addChild(g);
  for (const [t, a] of [
    ['N', -Math.PI / 2],
    ['E', 0],
    ['S', Math.PI / 2],
    ['O', Math.PI],
  ] as [string, number][]) {
    const l = txt(t, { fontFamily: F.serif, fontSize: r * 0.2, fill: t === 'N' ? RED : 0x5a4010, fontWeight: '700' });
    l.anchor.set(0.5);
    l.position.set(Math.cos(a) * r * 0.58, Math.sin(a) * r * 0.58);
    k.addChild(l);
  }
  const needle = new Graphics();
  needle.poly([0, -r * 0.7, r * 0.09, 0, -r * 0.09, 0]).fill(RED).stroke({ width: 2, color: C.ink, join: 'round' });
  needle.poly([0, r * 0.62, r * 0.09, 0, -r * 0.09, 0]).fill(0xf8f6f0).stroke({ width: 2, color: C.ink, join: 'round' });
  needle.poly(ngon(0, 0, r * 0.07, r * 0.07, 10)).fill(0xb8861e).stroke({ width: 2, color: C.ink });
  k.addChild(needle);
  const lid = new Graphics();
  lid.poly(ngon(0, 0, r * 1.08, r * 1.08, 28)).fill(0xc89a2e).stroke({ width: 4, color: C.ink });
  lid.poly(ngon(0, 0, r * 0.8, r * 0.8, 28)).stroke({ width: 3, color: 0x8a6a1a });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    lid.poly([0, 0, Math.cos(a - 0.12) * r * 0.62, Math.sin(a - 0.12) * r * 0.62, Math.cos(a) * r * 0.74, Math.sin(a) * r * 0.74, Math.cos(a + 0.12) * r * 0.62, Math.sin(a + 0.12) * r * 0.62]).fill({ color: 0x8a6a1a, alpha: 0.6 });
  }
  k.addChild(lid);
  return { k, needle, lid };
}

/** the sea: three wave bands (far → near) redrawn with t; foam on the crests */
function sea(g: Graphics, w: number, hz: number, bottom: number, t: number, k = 1, x0 = -200) {
  g.clear();
  g.rect(x0, hz, w - 2 * x0, bottom - hz).fill(SEA[0]);
  const bands: [number, number, number, number, number][] = [
    [hz + 30, 10, 140, 1.1, SEA[0]],
    [hz + 110, 20, 260, 1.6, SEA[1]],
    [hz + 250, 34, 420, 2.2, SEA[2]],
  ];
  bands.forEach(([y, amp, len, sp, col], i) => {
    const pts = wavePts(x0, w - x0, y * 1, amp * k, len * k, t * sp + i, bottom, (len * k) / 10);
    g.poly(pts).fill(col);
    const crest: number[] = [];
    for (let x = x0; x <= w - x0; x += (len * k) / 10) crest.push(x, y + Math.sin((x / (len * k)) * Math.PI * 2 + t * sp + i) * amp * k);
    g.poly(strip(crest, (2 + i * 1.4) * k)).fill({ color: FOAM, alpha: 0.35 + i * 0.15 });
  });
}

interface St {
  glow: Graphics;
  fogs: Graphics[];
  rays: Graphics;
  can: Container;
  comp: Container;
  give: () => void;
}
const S = stash<St>();

export const gorrimiau: Signature = {
  dark: true,
  frame: GOLD,
  tag: 'UNIVERSO DEL MAR MALDITO',
  open(c: SigCtx) {
    const k = new Container();
    const sky = vgrad(new Graphics(), -200, -200, W + 400, HZ + 200, SKY, 14);
    const r = rnd(31);
    for (let i = 0; i < 40; i++) sky.rect(r() * W, r() * HZ * 0.5, 2, 2).fill({ color: 0xffffff, alpha: 0.3 + r() * 0.5 });
    for (let i = 6; i >= 1; i--) sky.poly(ngon(MOON_AT[0], MOON_AT[1], 90 + i * 30, 90 + i * 30, 24)).fill({ color: MOON, alpha: 0.04 });
    sky.poly(ngon(MOON_AT[0], MOON_AT[1], 86, 86, 28)).fill(MOON);
    sky.poly(ngon(MOON_AT[0] - 26, MOON_AT[1] - 16, 18, 14, 10)).fill(0xbcd8b8).poly(ngon(MOON_AT[0] + 30, MOON_AT[1] + 24, 13, 10, 10)).fill(0xbcd8b8);
    const clouds = new Graphics();
    stormClouds(clouds, -200, W + 400, 110, 150, 0x0a1210, 0x223a32, 7, 10);
    stormClouds(clouds, -100, W + 200, 40, 110, 0x070c0b, 0x1a2a26, 9, 8, 0.9);
    // the moon's path on the water
    const path = new Graphics();
    for (let i = 0; i < 14; i++) {
      const v = i / 14;
      path.poly(streak(MOON_AT[0] - (20 + v * 130), HZ + 8 + v * v * 300, MOON_AT[0] + (20 + v * 130), HZ + 8 + v * v * 300, 1 + v * 3, 1 + v * 3)).fill({ color: MOON, alpha: 0.35 - v * 0.2 });
    }
    const flash = new Graphics().rect(-200, -200, W + 400, HZ + 200).fill(0xd8fff0);
    flash.alpha = 0;
    const bolts = new Graphics();
    const fogFar = new Graphics();
    fogBank(fogFar, -300, W + 600, HZ - 30, 80, FOG, 0.28, rnd(5), 12);
    const sh = ship(1.05);
    sh.k.position.set(1520, HZ + 40);
    const can = new Container();
    can.addChild(tunaCan(1.35));
    can.position.set(...CAN);
    const rays = new Graphics();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      rays.poly([0, 0, Math.cos(a - 0.08) * 420, Math.sin(a - 0.08) * 420, Math.cos(a + 0.08) * 420, Math.sin(a + 0.08) * 420]).fill({ color: 0xffe9a0, alpha: 0.22 });
    }
    rays.position.set(...CAN);
    rays.alpha = 0;
    const water = new Graphics();
    const fogNear = new Graphics();
    fogBank(fogNear, -300, W + 600, HZ + 60, 90, FOG, 0.22, rnd(8), 10);
    k.addChild(sky, clouds, flash, bolts, path, fogFar, sh.k, rays, can, water, fogNear);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const bl = backlight(0xbfeedd, 380, 0.4);
    bl.position.set(W / 2, c.catY);
    c.behind.addChild(bl);
    // the compass in the foreground
    const cp = compass(120);
    cp.k.position.set(...COMPASS);
    c.fg.addChild(cp.k);
    const aim = Math.atan2(CAN[1] - COMPASS[1], CAN[0] - COMPASS[0]) + Math.PI / 2;
    // he swings from a rope of the rigging (borrowed pose; never his scale)
    const pose = borrowPose(c);
    const paw0 = onCat(c, 0.8, 0.3);
    const PIV: [number, number] = [paw0[0] + 30, -160];
    const rope = new Graphics();
    c.behind.addChild(rope);
    const swing = (th: number) => {
      if (rope.destroyed) return;
      if (pose.given) return void rope.clear();
      const cs = Math.cos(th);
      const sn = Math.sin(th);
      const rot = (x: number, y: number): [number, number] => [PIV[0] + (x - PIV[0]) * cs - (y - PIV[1]) * sn, PIV[1] + (x - PIV[0]) * sn + (y - PIV[1]) * cs];
      const [px, py] = rot(...paw0);
      rope.clear().poly(strip([PIV[0], PIV[1], px, py + 10], 4)).fill(0xa08860);
      if (c.cat.destroyed) return;
      const [cx, cy] = rot(pose.x0, pose.y0);
      c.cat.position.set(cx, cy);
      c.cat.rotation = th;
    };
    const fogs = [fogFar, fogNear];
    S.set(c, { glow: sh.glow, fogs, rays, can, comp: cp.k, give: () => pose.give() });
    let sway = 0;
    const frame = (t: number) => {
      if (water.destroyed) return;
      sea(water, W, HZ, H + 200, t);
      fogFar.x = Math.sin(t * 0.4) * 60 - t * 12;
      fogNear.x = Math.sin(t * 0.5 + 1) * 80 + t * 16;
      can.y = CAN[1] + Math.sin(t * 2.4) * 6;
      can.rotation = Math.sin(t * 1.9) * 0.12;
      rays.rotation = t * 0.2;
      sh.k.y = HZ + 40 + Math.sin(t * 1.3) * 6;
      sh.k.rotation = Math.sin(t * 1.1) * 0.02;
      if (sway > 0 && t < 2.08) swing(0.07 * Math.sin(t * 3.4) * sway * Math.min(1, (2.08 - t) * 3));
    };
    frame(0);
    if (c.short) {
      sh.k.alpha = 1;
      rope.clear();
      cp.lid.scale.y = 0.001;
      cp.needle.rotation = aim;
      cp.k.alpha = 0;
      if (!c.reduce) every(c, 30, frame);
      return;
    }
    // out of the fog: the ship sails in
    sh.k.alpha = c.reduce ? 1 : 0.15;
    if (!c.reduce) {
      gsap.to(sh.k, { alpha: 1, duration: 1.4, ease: 'power1.inOut' });
      gsap.from(sh.k.position, { x: 1760, duration: 2, ease: 'power2.out' });
      sway = 1;
      every(c, 30, frame);
    }
    swing(c.reduce ? 0 : 0.0001);
    later(c, 2.1, () => {
      rope.clear();
      pose.give();
    });
    const kra = pre(c, comic('¡KRA-KOOOM!', 0xd8fff0, 110), 1340, 170, 0.08);
    const clic = pre(c, comic('¡CLIC!', GOLD, 70), COMPASS[0] + 150, COMPASS[1] - 150, -0.1);
    const clac = pre(c, comic('¡CLAC!', 0xffffff, 84), COMPASS[0] + 170, COMPASS[1] - 120, 0.08);
    const rumbo = pre(c, plate('RUMBO: ATÚN', RED, C.ink, 46), 560, 470, -0.05);
    const strike = (seed: number, x: number) => {
      if (bolts.destroyed) return;
      bolts.clear().poly(boltPts(x, -40, x + 120, HZ - 40, 16, seed, 8)).fill(0xeafff4);
      bolts.alpha = 1;
      flash.alpha = c.flashes ? 0.5 : 0.18;
      gsap.to(flash, { alpha: 0, duration: 0.35 });
      gsap.to(bolts, { alpha: 0, duration: 0.3, delay: 0.08 });
      sfx('zap', 0.6);
      later(c, 0.08, () => sfx('bigboom', 0.55));
    };
    at(c, 0.25, () => {
      strike(3, 1240);
      kra(0.6);
      c.shaker.add(0.2);
    });
    // the compass snaps open; the needle spins mad and nails the tuna can
    at(c, 0.75, () => {
      sfx('click', 0.9);
      clic(0.4);
      if (c.reduce) cp.lid.scale.y = 0.001;
      else gsap.to(cp.lid.scale, { y: 0.001, duration: 0.14, ease: 'power2.in' });
      gsap.to(cp.lid, { alpha: 0, duration: 0.14 });
      if (c.reduce) return;
      gsap.to(cp.needle, { rotation: aim + Math.PI * 10, duration: 0.85, ease: 'power3.out', delay: 0.1 });
      for (let i = 0; i < 8; i++) later(c, 0.1 + i * 0.09, () => sfx('tick', 1.4 + i * 0.05));
    });
    at(c, 1.05, () => strike(9, 760));
    at(c, 1.7, () => {
      cp.needle.rotation = aim;
      clac(0.5);
      rumbo(0.45);
      sfx('sting', 1.1);
      if (!c.reduce) gsap.fromTo(can.scale, { x: 1.6, y: 1.6 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
      gsap.to(rays, { alpha: 0.6, duration: 0.2 });
    });
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    st?.give();
    sfx('fanfare', 0.9);
    sfx('coin', 1);
    c.shaker.add(0.25);
    flashOf(c, 0xfff2c0, 0.4, 0.4);
    if (st) {
      if (!st.comp.destroyed) gsap.to(st.comp, { alpha: 0, duration: 0.25 });
      for (const f of st.fogs) if (!f.destroyed) gsap.to(f, { alpha: 0.25, duration: 0.8 });
      if (!st.rays.destroyed) {
        st.rays.alpha = 1;
        if (!c.reduce) gsap.fromTo(st.rays.scale, { x: 0.6, y: 0.6 }, { x: 1.5, y: 1.5, duration: 0.6, ease: 'back.out(2)' });
      }
      if (!st.glow.destroyed) st.glow.tint = 0xffe08a;
      // coins burst out of the can and rain over everything
      burst(c, c.fg, (i) => coin(16 + (i % 3) * 4, 0.4 + (i % 4) * 0.2), 14, CAN[0], CAN[1] - 10, 520, 1.2);
      for (let i = 0; i < 5; i++) later(c, 0.1 + i * 0.12, () => sfx('coin', 1.1 + i * 0.08));
    }
    fall(c, c.fg, (i) => coin(18 + (i % 3) * 4, 0.3 + (i % 5) * 0.17), { n: 22, over: 1.6, dur: 1.5, spread: W, bounce: true, spin: 6 });
    later(c, 0.4, () => {
      const [tx, ty] = onCat(c, 0.53, 0.6);
      const g = new Graphics().poly(ngon(0, 0, 30, 30, 12)).fill({ color: 0xffffff, alpha: 0.25 }).poly(twinkle(0, 0, 40, 0.16)).fill(0xffffff);
      g.position.set(tx, ty);
      c.fg.addChild(g);
      gsap.to(g, { alpha: 0, delay: 0.3, duration: 0.3, onComplete: () => destroyTree(g) });
    });
    cheer(c, '¡ATÚN A LA VISTA!', GOLD, 130, 2.3);
    aside(c, '…el norte está sobrevalorado.', 0xffffff, { delay: 0.6, dur: 2.4 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = Math.max(0.2, h / 1080);
    const hz = h * 0.6;
    const cx = w / 2;
    const side = Math.min(w * 0.4, m * 0.8);
    const sky = vgrad(new Graphics(), 0, 0, w, hz, SKY, 12);
    const mx = cx - side * 0.75;
    for (let i = 5; i >= 1; i--) sky.poly(ngon(mx, h * 0.18, (80 + i * 26) * u, (80 + i * 26) * u, 22)).fill({ color: MOON, alpha: 0.05 });
    sky.poly(ngon(mx, h * 0.18, 78 * u, 78 * u, 24)).fill(MOON);
    stormClouds(sky, 0, w, h * 0.1, 120 * u, 0x0a1210, 0x223a32, 7, Math.max(4, Math.round(w / (220 * u))));
    const fog = new Graphics();
    fogBank(fog, -100 * u, w + 200 * u, hz - 20 * u, 70 * u, FOG, 0.3, rnd(5), Math.max(6, Math.round(w / (180 * u))));
    const sh = ship(u * 0.95);
    sh.k.position.set(cx + side * 0.7, hz + 30 * u);
    const can = tunaCan(u * 0.8);
    can.position.set(mx, hz - 20 * u);
    const water = new Graphics();
    const draw = (t: number) => {
      sea(water, w, hz, h, t, u, 0);
      fog.x = Math.sin(t * 0.4) * 40 * u;
      sh.k.y = hz + 30 * u + Math.sin(t * 1.3) * 5 * u;
      can.y = hz - 20 * u + Math.sin(t * 2.4) * 4 * u;
      sh.glow.alpha = 0.75 + 0.25 * Math.sin(t * 7);
    };
    k.addChild(sky, fog, sh.k, can, water);
    draw(0.3);
    if (live) liveLoop(k, (t) => draw(t + 0.3));
    return k;
  },
};
