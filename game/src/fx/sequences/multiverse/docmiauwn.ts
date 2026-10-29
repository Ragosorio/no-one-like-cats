/**
 * Doc Miauwn, el que Arregla el Pasado: the clock-tower universe (a time-travel comedy: no car name, no logo, no lines).
 * A town square on a stormy night: rain, storm clouds, the old courthouse with its clock tower, shop fronts and a street
 * lamp across the street, and a cable stretched from the tower's spire down to the lamp. The clock's hands race forward;
 * the lightning hits the spire (¡KRA-KA-BUM!), runs down the cable in a spark (¡ZZZT!) and the lamp blazes; then a silver
 * wedge of a car with gull-wing doors tears across the street in blue arcs (¡FIUUUM!) and leaves two parallel lines of
 * fire burning on the asphalt — DESTINO: AYER.
 * Payoff: the car comes back in a triple flash, the clock spins backwards, the fire lines flare, arcs crackle around his
 * glowing Y-shaped gadget; ¡JUSTO A TIEMPO! / …¿o fue antes? ¿o será después? (The design's «¡GRAN SCRATCH!» was a pun on a
 * film catchphrase; this line is ours.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { liveLoop } from '../../../panels/collection/cardArt';
import { type Signature, type SigCtx, backlight, cheer, every, flashOf, later, plate } from './kit';
import { hideDisc } from './kitA';
import { stash, vgrad } from './kitB';
import { aside, ngon, onCat, rnd, streak, twinkle } from './kitD';
import { sparks } from './kitG';
import { catenary, rain, strip } from './kitH';
import { at, boltPts, comic, pre, wrap } from './kitI';
import { glint, lamp, stormClouds } from './kitL';

const BLUE = 0x3a7bd5;
const ARC = 0x9fe6ff;
const FIRE = [0xffe14d, 0xff8a1a, 0xff3a1a];
const SKY = [0x070a1c, 0x101a3c, 0x1c2a56, 0x2c3a6a];
const STONE = 0x6a6478;
const STONE_D = 0x4a4458;
const HZ = 740;
const TOWER_X = 1460;
const CLOCK: [number, number] = [TOWER_X, 236];
const SPIRE: [number, number] = [TOWER_X, 70];
const LAMP_X = 400;
/** the two fire lines on the street */
const TRAIL = [800, 852];

/** the courthouse with its clock tower (static stone; the clock face's hands are drawn apart) */
function courthouse(g: Graphics, x: number, hz: number, s = 1) {
  const bx0 = x - 320 * s;
  const bx1 = x + 320 * s;
  const top = hz - 360 * s;
  g.rect(bx0, top, bx1 - bx0, 360 * s).fill(STONE);
  g.poly([bx0 - 30 * s, top, x, top - 110 * s, bx1 + 30 * s, top]).fill(STONE_D);
  g.rect(bx0 - 30 * s, top - 4 * s, bx1 - bx0 + 60 * s, 16 * s).fill(0x7a748a);
  for (let i = 0; i < 6; i++) {
    const cx = bx0 + 50 * s + i * 108 * s;
    g.rect(cx - 16 * s, top + 30 * s, 32 * s, 290 * s).fill(0x8a849a);
    g.rect(cx - 22 * s, top + 22 * s, 44 * s, 12 * s).fill(0x7a748a);
  }
  for (let i = 0; i < 5; i++) g.rect(bx0 + 82 * s + i * 108 * s, top + 70 * s, 44 * s, 110 * s).fill({ color: 0xffd27a, alpha: i % 2 ? 0.75 : 0.45 });
  g.rect(bx0 - 50 * s, hz - 40 * s, bx1 - bx0 + 100 * s, 40 * s).fill(0x5a546a);
  g.rect(bx0 - 70 * s, hz - 16 * s, bx1 - bx0 + 140 * s, 16 * s).fill(0x4a4458);
  // the tower
  const tw = 110 * s;
  g.rect(x - tw, 130 * s + (hz - 740 * s), tw * 2, top - 110 * s - (130 * s + (hz - 740 * s)) + 60 * s).fill(STONE);
  const ty = 130 * s + (hz - 740 * s);
  g.rect(x - tw - 14 * s, ty - 12 * s, tw * 2 + 28 * s, 20 * s).fill(0x7a748a);
  g.poly([x - tw - 6 * s, ty - 12 * s, x, ty - 70 * s, x + tw + 6 * s, ty - 12 * s]).fill(STONE_D);
  g.rect(x - 4 * s, ty - 130 * s, 8 * s, 70 * s).fill(0x2a2a34);
  g.poly(ngon(x, ty - 132 * s, 7 * s, 7 * s, 8)).fill(0x2a2a34);
  g.poly(ngon(x, ty + 106 * s, 92 * s, 92 * s, 28)).fill(0x3a3448);
  g.poly(ngon(x, ty + 106 * s, 82 * s, 82 * s, 28)).fill(0xf6f0dc).stroke({ width: 5 * s, color: 0x2a2434 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.poly(streak(x + Math.cos(a) * 64 * s, ty + 106 * s + Math.sin(a) * 64 * s, x + Math.cos(a) * 76 * s, ty + 106 * s + Math.sin(a) * 76 * s, i % 3 ? 2 * s : 4 * s, i % 3 ? 2 * s : 4 * s)).fill(0x2a2434);
  }
}

/** the clock's hands (redrawn): minutes m (0..60, may run past), hours from the same clock */
function hands(g: Graphics, x: number, y: number, m: number, s = 1) {
  g.clear();
  const am = (m / 60) * Math.PI * 2 - Math.PI / 2;
  const ah = (((m / 60 + 10) % 12) / 12) * Math.PI * 2 - Math.PI / 2;
  g.poly(streak(x, y, x + Math.cos(ah) * 42 * s, y + Math.sin(ah) * 42 * s, 5 * s, 2.5 * s)).fill(0x1a1622);
  g.poly(streak(x, y, x + Math.cos(am) * 66 * s, y + Math.sin(am) * 66 * s, 3.5 * s, 1.5 * s)).fill(0x1a1622);
  g.poly(ngon(x, y, 6 * s, 6 * s, 8)).fill(0x1a1622);
}

/** the shop fronts on the left (two storeys, lit windows, striped awnings: no names) */
function shops(g: Graphics, x0: number, x1: number, hz: number, s = 1) {
  const cols = [0x6a3a34, 0x4a4a6a, 0x5a4a3a, 0x3a5a5a];
  let i = 0;
  for (let x = x0; x < x1; x += 230 * s, i++) {
    const h = (300 + (i % 2) * 60) * s;
    g.rect(x, hz - h, 222 * s, h).fill(cols[i % cols.length]);
    g.rect(x - 6 * s, hz - h - 14 * s, 234 * s, 16 * s).fill(0x2a2430);
    for (let j = 0; j < 2; j++) g.rect(x + (30 + j * 100) * s, hz - h + 40 * s, 62 * s, 70 * s).fill({ color: 0xffd27a, alpha: j === i % 2 ? 0.75 : 0.25 });
    g.rect(x + 20 * s, hz - 130 * s, 182 * s, 110 * s).fill({ color: 0xffe6a8, alpha: 0.55 });
    for (let j = 0; j < 7; j++) g.poly([x + (10 + j * 29) * s, hz - 160 * s, x + (39 + j * 29) * s, hz - 160 * s, x + (42 + j * 29) * s, hz - 132 * s, x + (7 + j * 29) * s, hz - 132 * s]).fill(j % 2 ? 0xf2efe6 : [0xc8102e, 0x2a6ac8, 0x2e7d5b, 0xd8a020][i % 4]);
  }
}

/** the silver time car, side view facing right (origin at its bottom center): a low wedge, gull-wing seams, vents */
function timeCar(s = 1) {
  const g = new Graphics();
  g.poly(ngon(0, -4 * s, 220 * s, 16 * s, 16)).fill({ color: ARC, alpha: 0.25 });
  g.poly([-200 * s, -30 * s, -196 * s, -78 * s, -120 * s, -86 * s, -40 * s, -134 * s, 60 * s, -134 * s, 110 * s, -96 * s, 206 * s, -74 * s, 214 * s, -36 * s, 200 * s, -22 * s, -190 * s, -22 * s])
    .fill(0xc8ccd4)
    .stroke({ width: 4 * s, color: C.ink, join: 'round' });
  g.poly([-30 * s, -128 * s, 54 * s, -128 * s, 96 * s, -96 * s, -30 * s, -96 * s]).fill(0x2a3446);
  g.poly([-110 * s, -90 * s, -40 * s, -128 * s, -40 * s, -96 * s]).fill(0x2a3446);
  for (let i = 0; i < 5; i++) g.rect((-100 + i * 12) * s, -98 * s, 6 * s, 10 * s).fill(0x3a4254);
  g.poly(streak(-196 * s, -56 * s, 208 * s, -52 * s, 2 * s, 2 * s)).fill(0x7a808c);
  g.poly(streak(-60 * s, -134 * s, -64 * s, -24 * s, 1.5 * s, 1.5 * s)).fill(0x7a808c);
  g.poly(streak(30 * s, -134 * s, 34 * s, -24 * s, 1.5 * s, 1.5 * s)).fill(0x7a808c);
  g.rect(-190 * s, -40 * s, 380 * s, 14 * s).fill(0x1a1c24);
  g.rect(-206 * s, -70 * s, 16 * s, 34 * s).fill(0x3a4254);
  for (let i = 0; i < 3; i++) g.rect(-204 * s, (-66 + i * 10) * s, 12 * s, 5 * s).fill(ARC);
  g.rect(196 * s, -64 * s, 16 * s, 10 * s).fill(0xfff6c8);
  for (const wx of [-130, 130]) {
    g.poly(ngon(wx * s, -22 * s, 34 * s, 34 * s, 14)).fill(0x14141a);
    g.poly(ngon(wx * s, -22 * s, 18 * s, 18 * s, 10)).fill(0xa8aeb8);
    g.poly(ngon(wx * s, -22 * s, 6 * s, 6 * s, 6)).fill(0x5a606a);
  }
  return g;
}

/** two parallel fire lines from x0 to x1 (flickering flames redrawn with t, `heat` 0..1 their height) */
function fireLines(g: Graphics, x0: number, x1: number, ys: number[], t: number, heat: number, k = 1) {
  g.clear();
  if (x1 <= x0 || heat <= 0.01) return;
  const r = rnd(11);
  for (const y of ys) {
    g.poly(streak(x0, y, x1, y, 4 * k, 4 * k)).fill({ color: 0xff6a1a, alpha: 0.7 * heat });
    for (let x = x0; x < x1; x += 26 * k) {
      const f = 0.6 + 0.4 * Math.sin(t * 18 + r() * 9);
      const h = (16 + r() * 22) * k * heat * f;
      const col = FIRE[Math.floor(r() * 3)];
      g.poly([x - 9 * k, y + 3 * k, x + 9 * k, y + 3 * k, x + (r() - 0.5) * 8 * k, y - h]).fill({ color: col, alpha: 0.9 });
    }
  }
}

interface St {
  minute: { v: number; sp: number };
  heat: { v: number };
  car: Container;
  trailX: { v: number };
}
const S = stash<St>();

export const docmiauwn: Signature = {
  dark: true,
  frame: BLUE,
  tag: 'UNIVERSO DE LA TORRE DEL RELOJ',
  open(c: SigCtx) {
    const k = new Container();
    const sky = vgrad(new Graphics(), -200, -200, W + 400, HZ + 200, SKY, 14);
    stormClouds(sky, -200, W + 400, 70, 130, 0x080c1e, 0x2a3660, 4, 10);
    const flash = new Graphics().rect(-200, -200, W + 400, HZ + 200).fill(0xcfe8ff);
    flash.alpha = 0;
    const town = new Graphics();
    shops(town, -160, 700, HZ);
    courthouse(town, TOWER_X, HZ, 1);
    // trees
    const r = rnd(4);
    for (const tx of [760, 1050]) {
      town.rect(tx - 8, HZ - 150, 16, 150).fill(0x14121c);
      for (let i = 0; i < 6; i++) town.poly(ngon(tx + (r() - 0.5) * 90, HZ - 190 - r() * 80, 60 + r() * 30, 46 + r() * 20, 10)).fill(i % 2 ? 0x1a2a2a : 0x14221f);
    }
    const clock = new Graphics();
    const street = new Graphics();
    street.rect(-200, HZ, W + 400, H - HZ + 200).fill(0x1e2030);
    street.rect(-200, HZ, W + 400, 22).fill(0x5a5868).rect(-200, HZ + 22, W + 400, 6).fill(0x2a2a38);
    for (let x = -160; x < W + 200; x += 220) street.poly([x, 930, x + 120, 930, x + 132, 942, x + 12, 942]).fill({ color: 0xd8d0a0, alpha: 0.6 });
    for (let i = 0; i < 6; i++) street.poly(ngon(200 + i * 330, 900 + (i % 2) * 40, 90, 10, 14)).fill({ color: 0x8aa0d8, alpha: 0.12 });
    const lp = new Graphics();
    lamp(lp, LAMP_X, HZ + 10, 52, 0.6, 0x14141a, 0xfff2c8);
    // the cable from the spire to the lamp
    const cable = catenary(SPIRE[0], SPIRE[1] + 6, LAMP_X, HZ + 10 - 52 * 6.1, 80, 30);
    const wire = new Graphics().poly(strip(cable, 4.5)).fill({ color: 0x9aa8d8, alpha: 0.45 }).poly(strip(cable, 2.4)).fill(0x0c0c14);
    const zap = new Graphics();
    const bolts = new Graphics();
    const fire = new Graphics();
    const car = new Container();
    car.addChild(timeCar(1));
    car.position.set(-500, TRAIL[1] - 4);
    car.visible = false;
    const wet = new Graphics();
    k.addChild(sky, flash, bolts, town, clock, wire, zap, lp, street, fire, car, wet);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const bl = backlight(0xbfe0ff, 380, 0.42);
    bl.position.set(W / 2, c.catY);
    c.behind.addChild(bl);
    const minute = { v: 50, sp: 0 };
    const heat = { v: c.short ? 0.7 : 0 };
    const trailX = { v: c.short ? W + 200 : -200 };
    S.set(c, { minute, heat, car, trailX });
    let last = 0;
    const frame = (t: number) => {
      if (clock.destroyed) return;
      const dt = Math.min(0.1, t - last);
      last = t;
      minute.v += minute.sp * dt;
      hands(clock, CLOCK[0], CLOCK[1], minute.v);
      fireLines(fire, -200, trailX.v, TRAIL, t, heat.v);
      wet.clear();
      rain(wet, -200, -100, W + 400, H + 200, t, 120, 5, 0xbfd0f0, 0.28, 0.18, 50);
    };
    frame(0);
    if (!c.reduce) every(c, 30, frame);
    if (c.short) return;
    const kra = pre(c, comic('¡KRA-KA-BUM!', 0xeaf6ff, 104), 1250, 150, 0.06);
    const zzt = pre(c, comic('¡ZZZT!', ARC, 80), 760, 330, -0.1);
    const fiu = pre(c, comic('¡FIUUUM!', FIRE[0], 120), 1400, 640, 0.05);
    const dest = pre(c, plate('DESTINO: AYER', BLUE, C.ink, 46), 520, 200, -0.05);
    // the hands race forward
    at(c, 0.05, () => {
      minute.sp = 160;
      sfx('tick', 1.2);
      if (c.reduce) minute.v = 64;
      for (let i = 0; i < 6; i++) later(c, i * 0.14, () => sfx('tick', 1.3 + (i % 2) * 0.2));
    });
    // the lightning hits the spire and runs down the cable to the lamp
    at(c, 0.85, () => {
      minute.sp = 0;
      minute.v = 64;
      frame(last);
      bolts.clear().poly(boltPts(SPIRE[0] - 220, -60, SPIRE[0], SPIRE[1], 20, 7, 8)).fill(0xeaf6ff);
      bolts.poly(boltPts(SPIRE[0] - 120, -60, SPIRE[0] - 40, SPIRE[1] - 60, 8, 3, 5)).fill(0xeaf6ff);
      bolts.alpha = 1;
      gsap.to(bolts, { alpha: 0, duration: 0.3, delay: 0.1 });
      flash.alpha = c.flashes ? 0.55 : 0.2;
      gsap.to(flash, { alpha: 0, duration: 0.4 });
      kra(0.6);
      sfx('zap', 0.5);
      sfx('bigboom', 0.6);
      c.shaker.add(0.3);
      sparks(c, k, SPIRE[0], SPIRE[1], 14, 0xeaf6ff, 160, 0.5);
      // the spark running down the cable
      const n = cable.length / 2;
      const p = { u: 0 };
      const run = () => {
        if (zap.destroyed) return;
        zap.clear();
        const i = Math.min(n - 1, Math.floor(p.u * (n - 1)));
        const x = cable[i * 2];
        const y = cable[i * 2 + 1];
        zap.poly(ngon(x, y, 26, 26, 10)).fill({ color: ARC, alpha: 0.35 }).poly(twinkle(x, y, 30, 0.2)).fill(0xffffff);
        const tail = cable.slice(Math.max(0, i - 6) * 2, i * 2 + 2);
        if (tail.length >= 4) zap.poly(strip(tail, 5)).fill({ color: ARC, alpha: 0.85 });
      };
      if (c.reduce) {
        p.u = 1;
        run();
        gsap.to(zap, { alpha: 0, delay: 0.3, duration: 0.3 });
      } else
        gsap.to(p, {
          u: 1,
          duration: 0.42,
          ease: 'power1.in',
          onUpdate: run,
          onComplete: () => {
            if (zap.destroyed) return;
            zap.clear();
            lamp(zap, LAMP_X, HZ + 10, 52, 1, 0x14141a, 0xeaf6ff);
            sparks(c, k, LAMP_X, HZ + 10 - 52 * 5.2, 12, ARC, 130, 0.45);
            gsap.to(zap, { alpha: 0, delay: 0.25, duration: 0.4 });
          },
        });
      later(c, 0.2, () => {
        zzt(0.55);
        sfx('zap', 0.9);
      });
    });
    // the car tears across the street and leaves two lines of fire
    at(c, 1.4, () => {
      car.visible = true;
      fiu(0.65);
      sfx('whoosh', 0.6);
      sfx('zap', 1.3);
      c.shaker.add(0.15);
      heat.v = 1;
      if (c.reduce) {
        car.x = 1300;
        trailX.v = 1180;
        frame(last);
        gsap.to(car, { alpha: 0, delay: 0.5, duration: 0.2 });
        return;
      }
      gsap.fromTo(car, { x: -500 }, { x: W + 600, duration: 0.42, ease: 'none', onUpdate: () => (trailX.v = car.x - 210) });
      gsap.to(heat, { v: 0.55, duration: 1.2, delay: 0.4 });
    });
    at(c, 1.85, () => {
      dest(0.4);
      sfx('sting', 1.2);
    });
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('zap', 0.8);
    sfx('boom', 0.7);
    sfx('fanfare', 1.1);
    c.shaker.add(0.3);
    // the triple flash: the car comes back
    for (let i = 0; i < 3; i++) later(c, i * 0.12, () => flashOf(c, 0xd8f2ff, 0.45, 0.14));
    if (st) {
      st.minute.sp = -260;
      st.heat.v = 1;
      st.trailX.v = W + 200;
      later(c, 1.6, () => (st.minute.sp = 0));
      const car = st.car;
      if (!car.destroyed) {
        car.visible = true;
        car.alpha = 1;
        car.x = c.reduce ? 1560 : W + 500;
        car.scale.x = -1;
        if (!c.reduce) gsap.to(car, { x: 1560, duration: 0.3, ease: 'power3.out' });
      }
    }
    // arcs crackle around the glowing gadget; the remote's antenna sparks
    const [gx, gy] = onCat(c, 0.6, 0.5);
    const glow = new Graphics();
    for (let i = 6; i >= 1; i--) glow.poly(ngon(0, 0, 30 * i, 30 * i, 16)).fill({ color: ARC, alpha: 0.07 });
    glow.position.set(gx, gy);
    c.behind.addChild(glow);
    if (!c.reduce) gsap.fromTo(glow.scale, { x: 0.4, y: 0.4 }, { x: 1.3, y: 1.3, duration: 0.5, yoyo: true, repeat: 3 });
    gsap.to(glow, { alpha: 0, delay: 2, duration: 0.4, onComplete: () => destroyTree(glow) });
    const arcs = new Graphics();
    c.fg.addChild(arcs);
    for (let i = 0; i < (c.reduce ? 1 : 6); i++)
      later(c, i * 0.22, () => {
        if (arcs.destroyed) return;
        arcs.clear();
        for (let j = 0; j < 3; j++) {
          const a = Math.random() * Math.PI * 2;
          arcs.poly(boltPts(gx, gy, gx + Math.cos(a) * 190, gy + Math.sin(a) * 160, 6, Math.floor(Math.random() * 99), 5)).fill(0xeaf6ff);
        }
        sfx('zap', 1.2 + Math.random() * 0.4);
      });
    later(c, c.reduce ? 0.6 : 1.4, () => destroyTree(arcs));
    later(c, 0.3, () => glint(c, c.fg, ...onCat(c, 0.08, 0.08), 40, 0xeaf6ff));
    sparks(c, c.fg, ...onCat(c, 0.08, 0.08), 12, ARC, 150, 0.5);
    cheer(c, '¡JUSTO A TIEMPO!', ARC, 150, 2.3);
    aside(c, '…¿o fue antes? ¿o será después?', 0xffffff, { delay: 0.6, dur: 2.4 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const u = Math.max(0.2, h / 1080);
    const hz = h * 0.72;
    const cx = w / 2;
    const side = Math.min(w * 0.42, m * 0.85);
    const sky = vgrad(new Graphics(), 0, 0, w, hz, SKY, 12);
    stormClouds(sky, 0, w, h * 0.08, 120 * u, 0x080c1e, 0x2a3660, 4, Math.max(4, Math.round(w / (200 * u))));
    const town = new Graphics();
    shops(town, cx - side - 700 * u, cx - side + 220 * u, hz, u);
    const tx = cx + side * 0.72;
    courthouse(town, tx, hz, u);
    const clock = new Graphics();
    const clockY = hz - 740 * u + 236 * u;
    const lx = cx - side * 0.72;
    const lp = new Graphics();
    lamp(lp, lx, hz + 10 * u, 52 * u, 0.8, 0x14141a, 0xfff2c8);
    const cable = catenary(tx, hz - 740 * u + 76 * u, lx, hz + 10 * u - 52 * u * 6.1, 80 * u, 26);
    const wire = new Graphics().poly(strip(cable, 4 * u + 0.8)).fill({ color: 0x9aa8d8, alpha: 0.45 }).poly(strip(cable, 2 * u + 0.4)).fill(0x0c0c14);
    const street = new Graphics().rect(0, hz, w, h - hz).fill(0x1e2030).rect(0, hz, w, 18 * u).fill(0x5a5868);
    const fire = new Graphics();
    const bolt = new Graphics();
    const ys = [hz + 70 * u, hz + 120 * u];
    const draw = (t: number) => {
      hands(clock, tx, clockY, 64 + t * 4, u);
      fireLines(fire, 0, w, ys, t, 0.6, u);
      bolt.clear();
      const q = t % 3.2;
      if (q < 0.14) bolt.poly(boltPts(tx - 160 * u, 0, tx, hz - 740 * u + 70 * u, 12 * u, 7 + Math.floor(t), 7)).fill({ color: 0xeaf6ff, alpha: 1 - q / 0.14 });
    };
    k.addChild(sky, bolt, town, clock, wire, lp, street, fire);
    draw(0.5);
    if (live) liveLoop(k, (t) => draw(t + 0.5));
    return k;
  },
};
