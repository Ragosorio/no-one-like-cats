/**
 * Gatistiano Ronaldo, el del Salto: the universe of the jump (the disciplined No. 7 in red and green). A night stadium
 * packed with cats in red and green; ¡ARRIBA! — and he jumps. The camera goes up with him and doesn't stop: the stands
 * drop away, the floodlights, the roof, a bank of clouds, a flock of birds, a plane, the stars, a satellite; the height
 * meter on the side can't keep up (2… 25… 250… 2500… 25000 METROS). Up there the cross finally arrives and he heads it
 * back to Earth in a line of fire; ¡CABEZAZO! — RÉCORD DE ALTURA.
 * Payoff: he lands back in his stadium with a crash (dust ring, the whole bowl shakes), red and green fireworks, a giant
 * 7 in lights in the stands; ¡UNO MÁS! / …abdominales a las cinco, goles a las siete.
 * (National-team colors only: no crests, no sponsors, no catchphrase, no real person's face.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, backlight, burst, cheer, every, flashOf, later, plate, score } from './kit';
import { hideDisc, pixelText, segText } from './kitA';
import { puff, stash, vgrad } from './kitB';
import { fogBank } from './kitC';
import { aside, ngon, onCat, rnd, starfield, streak, twinkle } from './kitD';
import { at, ball, bits, comic, flat, floodlight, pitchFront, pre, standsFront, wrap } from './kitI';
import { liveLoop } from '../../../panels/collection/cardArt';
import { destroyTree } from '../../../panels/collection/ui';

const RED = 0xc8102e;
const GREEN = 0x0a7a3a;
const GOLD = 0xe6c34a;
const FIRE = 0xff7a1a;
const FANS = [RED, GREEN, RED, 0xffffff, GREEN, 0xf3e2c4, 0x2a2a30, 0xd9772a];
const TOP = 160;
const HZ = 570;
/** how far the camera climbs (the sky above the stadium is SKY_H tall) */
const SKY_H = H * 3;

/** a plane in silhouette with blinking lights (origin at its center), s = scale */
function plane(s: number) {
  const g = new Graphics();
  g.poly([-120 * s, 0, -100 * s, -12 * s, 110 * s, -12 * s, 130 * s, -4 * s, 120 * s, 6 * s, -110 * s, 8 * s]).fill(0x2a3048);
  g.poly([-10 * s, -6 * s, 40 * s, -6 * s, -30 * s, 60 * s, -50 * s, 60 * s]).fill(0x232840);
  g.poly([-96 * s, -10 * s, -76 * s, -10 * s, -110 * s, -50 * s, -122 * s, -50 * s]).fill(0x232840);
  for (let i = 0; i < 9; i++) g.rect(-70 * s + i * 18 * s, -6 * s, 8 * s, 5 * s).fill({ color: 0xffe9a8, alpha: 0.8 });
  g.poly(ngon(-118 * s, -48 * s, 4 * s, 4 * s, 6)).fill(RED).poly(ngon(126 * s, -2 * s, 4 * s, 4 * s, 6)).fill(0x3aff7a);
  return g;
}

/** a satellite: a body and two solar panels */
function satellite(s: number) {
  const g = new Graphics();
  g.rect(-20 * s, -16 * s, 40 * s, 32 * s).fill(0xc8c8d4).stroke({ width: 2 * s, color: 0x6a6a74 });
  for (const d of [-1, 1]) {
    g.rect(d > 0 ? 26 * s : -96 * s, -14 * s, 70 * s, 28 * s).fill(0x2a4a9a);
    for (let i = 1; i < 4; i++) g.rect((d > 0 ? 26 * s : -96 * s) + i * 17.5 * s, -14 * s, 1.4 * s, 28 * s).fill(0x8ab0ff);
    g.rect(d > 0 ? 20 * s : -26 * s, -2 * s, 6 * s, 4 * s).fill(0x9a9aa6);
  }
  g.poly(streak(0, -16 * s, 6 * s, -40 * s, 1.5 * s, 1 * s)).fill(0x9a9aa6).poly(ngon(6 * s, -42 * s, 6 * s, 6 * s, 8)).fill(0xdddddd);
  return g;
}

/**
 * the sky over the stadium, SKY_H tall, drawn upward from y = 0 (the stadium's top edge) to y = -SKY_H: night blue
 * → black space; clouds, birds, the plane, stars, the satellite, the moon
 */
function heights(w: number, k: number) {
  const g = vgrad(new Graphics(), 0, -SKY_H, w, SKY_H + 4, [0x000000, 0x02020a, 0x060a24, 0x0c1638, 0x16245a, 0x1c2c62], 30);
  starfield(g, 0, -SKY_H, w, SKY_H * 0.55, Math.round(w / 8), 77, 0xffffff, 2.6 * k);
  const r = rnd(5);
  fogBank(g, -100, w + 200, -H * 0.75, 110, 0x5a6a90, 0.85, r, 11);
  fogBank(g, -100, w + 200, -H * 0.66, 90, 0x8a9ac0, 0.9, r, 11);
  fogBank(g, -100, w + 200, -H * 1.55, 70, 0x4a5a80, 0.7, r, 9);
  // a flock of birds
  for (let i = 0; i < 12; i++) {
    const x = w * 0.62 + (i % 4) * 46 + Math.floor(i / 4) * 30;
    const y = -H * 1.05 + Math.floor(i / 4) * 30 + (i % 4) * 12;
    g.poly([x - 14, y - 6, x, y, x + 14, y - 6, x, y + 4]).fill(0x0a0e1e);
  }
  // the moon, way up
  g.poly(ngon(w * 0.8, -SKY_H + H * 0.3, 120, 120, 30)).fill(0xf4efe0);
  g.poly(ngon(w * 0.8 - 30, -SKY_H + H * 0.3 - 20, 26, 22, 12)).fill(0xdcd6c6).poly(ngon(w * 0.8 + 40, -SKY_H + H * 0.3 + 30, 18, 16, 10)).fill(0xdcd6c6);
  return g;
}

/** the planet's limb along the bottom (seen from the top of the jump): ocean, land, clouds, a cyan atmosphere glow */
function planet(w: number, h: number) {
  const g = new Graphics();
  const cx = w / 2;
  const R = 2200;
  const cy = h - 330 + R;
  for (let i = 6; i >= 1; i--) g.poly(ngon(cx, cy, R + i * 16, R + i * 16, 90)).fill({ color: 0x5ad8ff, alpha: 0.06 });
  g.poly(ngon(cx, cy, R, R, 90)).fill(0x1a4a9a);
  const r = rnd(41);
  const limb = (x: number) => cy - Math.sqrt(Math.max(0, R * R - (x - cx) * (x - cx)));
  for (let i = 0; i < 7; i++) {
    const x = cx + (r() - 0.5) * w * 0.9;
    const y = Math.max(limb(x) + 70, h - 280 + r() * 260);
    g.poly(ngon(x, y, 90 + r() * 160, 26 + r() * 40, 12, (r() - 0.5) * 0.3)).fill(r() < 0.5 ? 0x3a8a4a : 0x8a7a4a);
  }
  for (let i = 0; i < 9; i++) {
    const x = cx + (r() - 0.5) * w * 0.9;
    const y = Math.max(limb(x) + 40, h - 290 + r() * 260);
    g.poly(ngon(x, y, 70 + r() * 140, 10 + r() * 16, 10)).fill({ color: 0xffffff, alpha: 0.7 });
  }
  g.poly(ngon(cx, cy, R, R, 90)).stroke({ width: 5, color: 0x9ae8ff, alpha: 0.9 });
  return g;
}

/** the red-and-green stadium for a w×h scene (k scales the people); the mosaic Graphics lights the 7 */
function stadium(w: number, h: number, top: number, hz: number, k: number, seed: number) {
  const box = new Container();
  const sky = vgrad(new Graphics(), 0, 0, w, top + 10, [0x1c2c62, 0x24346a], 4);
  const lights = new Graphics();
  const s = 34 * k;
  for (const x of [w * 0.08, w * 0.92]) {
    for (let i = 6; i >= 1; i--) lights.poly(ngon(x, top - 3.6 * s, s * 0.9 * i, s * 0.6 * i, 18)).fill({ color: 0xfff2d8, alpha: 0.045 });
    floodlight(lights, x, top - 24 * k, s);
  }
  const st = standsFront(w, top, hz, { k, seed, cols: FANS, seat: [0x3a1a24, 0x2a1a20], wall: [RED, GREEN], flag: [GREEN, RED, RED] });
  const pitch = pitchFront(new Graphics(), w, h, hz, [0x2f8f3e, 0x287d36], k);
  const mosaic = new Graphics();
  box.addChild(sky, lights, st.tier, ...st.rows, mosaic, pitch);
  return { box, rows: st.rows, mosaic };
}

interface St {
  world: Container;
  rows: Graphics[];
  row0: number[];
  cheer: { v: number };
  mosaic: Graphics;
  shot: Container[];
  earth: Container;
}
const S = stash<St>();

export const gatistiano: Signature = {
  dark: true,
  frame: RED,
  tag: 'UNIVERSO DEL SALTO',
  open(c: SigCtx) {
    const world = new Container();
    const sd = stadium(W, H, TOP, HZ, 1, 7);
    const sky = heights(W, 1);
    sky.y = TOP;
    const pl = plane(2);
    pl.position.set(W * 0.25, TOP - H * 1.35);
    const sat = satellite(1.3);
    sat.position.set(W * 0.22, TOP - H * 2.5);
    world.addChild(sky, pl, sat, sd.box);
    c.back.addChild(world);
    hideDisc(c, 0.2);
    const row0 = sd.rows.map((g) => g.y);
    const cheerV = { v: 0.25 };
    const shot: Container[] = [];
    // the planet below once he's up there (it rises in at the top of the jump and goes at the landing)
    const earth = new Container();
    earth.addChild(planet(W, H));
    earth.visible = false;
    // a warm backlight: the silhouette has to read against the night and the space
    const glow = backlight(0xffd9a0, 380, 0.45);
    glow.position.set(W / 2, c.catY - 20);
    c.behind.addChild(glow);
    S.set(c, { world, rows: sd.rows, row0, cheer: cheerV, mosaic: sd.mosaic, shot, earth });
    const wind = new Graphics();
    c.back.addChild(earth, wind);
    const climb = { v: 0 };
    const r = rnd(3);
    const WL = Array.from({ length: 22 }, () => [r() * W, r() * H, 80 + r() * 260]);
    if (!c.reduce)
      every(c, 30, (t) => {
        sd.rows.forEach((g, i) => {
          if (!g.destroyed) g.y = row0[i] - Math.max(0, Math.sin(t * (8 + i * 0.7) + i * 1.7)) * 9 * cheerV.v;
        });
        if (!pl.destroyed) pl.x = W * 0.25 + t * 140;
        if (!sat.destroyed) sat.rotation = Math.sin(t * 0.8) * 0.2;
        if (wind.destroyed) return;
        wind.clear();
        if (climb.v > 0.05) for (const [x, y0, L] of WL) {
          const y = ((y0 + t * 2600) % (H + 400)) - 200;
          wind.poly(streak(x, y, x, y + L, 0.6, 2.4)).fill({ color: 0xffffff, alpha: 0.35 * climb.v });
        }
      });
    if (c.short) return;

    // the height meter (left): 7-segment digits redrawn into one Graphics
    const meter = new Container();
    const mbg = new Graphics()
      .rect(6, 6, 300, 150)
      .fill(C.ink)
      .rect(0, 0, 300, 150)
      .fill(0x0d1030)
      .stroke({ width: 4, color: 0xffffff })
      .rect(0, 0, 300, 36)
      .fill(GREEN);
    const lab = flat('ALTURA', { fontFamily: F.heavy, fontSize: 24, fill: 0xffffff });
    lab.position.set(150, 18);
    const unit = flat('METROS', { fontFamily: F.heavy, fontSize: 20, fill: 0xffffff });
    unit.position.set(240, 132);
    const dg = new Graphics();
    meter.addChild(mbg, lab, unit, dg);
    meter.position.set(70, 610);
    c.fg.addChild(meter);
    shot.push(meter);
    const hgt = { v: 0 };
    const drawM = () => {
      if (dg.destroyed) return;
      dg.clear();
      const v = Math.round(hgt.v);
      const s = String(v);
      segText(dg, s.padStart(5, ' '), 20, 50, 62, 0xffe14d, 0.1);
    };
    drawM();

    // ¡ARRIBA! — the jump: the world drops away under him (the camera climbs)
    const up = pre(c, comic('¡ARRIBA!', 0xffe14d, 140), 520, 380, -0.1);
    const head = pre(c, comic('¡CABEZAZO!', FIRE, 118), 500, 250, -0.12);
    const rec = pre(c, plate('RÉCORD DE ALTURA', GREEN, C.ink, 46), 1360, 820, 0.05);
    at(c, 0.16, () => {
      up(0.6);
      sfx('whoosh', 0.6);
      sfx('charge', 1.3);
      c.shaker.add(0.2);
      puff(c, c.behind, W / 2, c.catY + 250, 0xd8d0c0, 7, 70, 40);
      if (c.reduce) {
        hgt.v = 25000;
        drawM();
        return;
      }
      climb.v = 1;
      gsap.to(world, { y: SKY_H - 120, duration: 1.15, ease: 'power2.out' });
      later(c, 0.7, () => {
        if (earth.destroyed) return;
        earth.visible = true;
        gsap.fromTo(earth, { y: 520 }, { y: 0, duration: 0.6, ease: 'power2.out' });
      });
      gsap.to(climb, { v: 0, duration: 0.5, delay: 0.8 });
      // the meter can't keep up: it jumps by powers of ten
      [2, 25, 250, 2500, 25000].forEach((v, i) =>
        later(c, i * 0.2, () => {
          hgt.v = v;
          drawM();
          sfx('tick', 1.6 + i * 0.15);
          if (!meter.destroyed) gsap.fromTo(meter.scale, { x: 1.12, y: 1.12 }, { x: 1, y: 1, duration: 0.15 });
        }),
      );
    });

    // the cross arrives at the top and he heads it back to Earth in a line of fire
    const [hx, hy] = onCat(c, 0.45, 0.1);
    const bl = new Container();
    bl.addChild(ball(30));
    const trail = new Graphics();
    c.fg.addChild(trail, bl);
    shot.push(trail, bl);
    bl.visible = false;
    at(c, 0.95, () => {
      bl.visible = true;
      if (c.reduce) {
        bl.position.set(hx - 260, hy + 300);
        return;
      }
      const p = { u: 0 };
      gsap.to(p, {
        u: 1,
        duration: 0.38,
        ease: 'power1.in',
        onUpdate: () => {
          if (bl.destroyed) return;
          bl.position.set(W + 60 + (hx + 40 - W - 60) * p.u, 160 + (hy - 160) * p.u - Math.sin(p.u * Math.PI) * 120);
          bl.rotation = p.u * 8;
        },
      });
    });
    at(c, 1.34, () => {
      head(0.75);
      sfx('boom', 1.0);
      sfx('crit', 1.1);
      c.shaker.add(0.35);
      flashOf(c, 0xfff2c8, 0.35, 0.25);
      const sb = new Graphics();
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        sb.poly(streak(hx + Math.cos(a) * 30, hy + Math.sin(a) * 30, hx + Math.cos(a) * 150, hy + Math.sin(a) * 150, 7, 1));
      }
      sb.fill({ color: 0xffe14d, alpha: 0.9 });
      c.fg.addChild(sb);
      gsap.to(sb, { alpha: 0, duration: 0.35, onComplete: () => destroyTree(sb) });
      if (c.reduce || bl.destroyed) return;
      const p = { u: 0 };
      const x0 = hx + 40;
      const y0 = hy;
      gsap.to(p, {
        u: 1,
        duration: 0.4,
        ease: 'power2.in',
        onUpdate: () => {
          if (bl.destroyed || trail.destroyed) return;
          const x = x0 + (W * 0.3 - x0) * p.u;
          const y = y0 + (H + 200 - y0) * p.u;
          bl.position.set(x, y);
          bl.rotation += 0.5;
          trail.clear();
          trail.poly(streak(x0, y0, x, y, 3, 26)).fill({ color: FIRE, alpha: 0.75 });
          trail.poly(streak(x0, y0, x, y, 1, 10)).fill({ color: 0xffe14d, alpha: 0.95 });
        },
        onComplete: () => {
          if (!trail.destroyed) gsap.to(trail, { alpha: 0, duration: 0.4 });
        },
      });
    });
    at(c, 1.62, () => {
      rec(0.6);
      sfx('sting', 1.3);
    });
    score(c, [
      [0.0, 'drumroll', 1.2],
      [0.7, 'whoosh', 0.4],
    ]);
  },
  payoff(c: SigCtx) {
    wrap(c);
    const st = S.get(c);
    sfx('fanfare', 1.0);
    if (st) {
      for (const n of st.shot) if (!n.destroyed) gsap.to(n, { alpha: 0, duration: 0.2, onComplete: () => destroyTree(n) });
      // he lands back in his stadium
      const land = () => {
        sfx('bigboom', 0.8);
        c.shaker.add(0.5);
        flashOf(c, 0xffffff, 0.45, 0.3);
        puff(c, c.behind, W / 2, c.catY + 250, 0xd8d0c0, 9, 90, 40);
        const ring = new Graphics().poly(ngon(0, 0, 260, 60, 28)).stroke({ width: 10, color: 0xffffff, alpha: 0.8 });
        ring.position.set(W / 2, c.catY + 255);
        c.behind.addChild(ring);
        if (!c.reduce) gsap.fromTo(ring.scale, { x: 0.3, y: 0.3 }, { x: 2.2, y: 2.2, duration: 0.6, ease: 'power2.out' });
        gsap.to(ring, { alpha: 0, duration: 0.6, onComplete: () => destroyTree(ring) });
        st.cheer.v = 1;
        gsap.to(st.cheer, { v: 0.35, delay: 2.4, duration: 1.2 });
        // the giant 7 in lights, left and right stands
        const m = st.mosaic;
        if (!m.destroyed) {
          pixelText(m, '7', 150, 290, 30, GOLD);
          pixelText(m, '7', 1690, 330, 30, GOLD);
          if (!c.reduce) gsap.fromTo(m, { alpha: 0 }, { alpha: 1, duration: 0.3, delay: 0.2 });
        }
      };
      if (!st.earth.destroyed) {
        if (c.reduce) st.earth.visible = false;
        else gsap.to(st.earth, { y: 600, duration: 0.25, ease: 'power2.in', onComplete: () => void (st.earth.visible = false) });
      }
      if (c.reduce || st.world.y === 0) {
        st.world.y = 0;
        land();
      } else {
        sfx('whoosh', 0.5);
        gsap.to(st.world, { y: 0, duration: 0.32, ease: 'power3.in', onComplete: land });
      }
    }
    // red and green fireworks over the stands
    for (const [x, y, d] of [
      [330, 130, 0.45],
      [1600, 110, 0.65],
      [760, 80, 0.85],
      [1250, 120, 1.05],
    ] as const)
      later(c, d, () => {
        sfx('pop', 0.8 + Math.random() * 0.4);
        burst(c, c.back, (i) => new Graphics().poly(twinkle(0, 0, 9)).fill(i % 3 === 0 ? GOLD : i % 3 === 1 ? RED : GREEN), 18, x, y, 230, 1.0);
      });
    later(c, 0.35, () => burst(c, c.fg, bits([RED, GREEN, GOLD]), 32, W / 2, c.catY - 80, 900, 1.4));
    cheer(c, '¡UNO MÁS!', 0xffe14d, 160, 2.3);
    aside(c, '…abdominales a las cinco, goles a las siete.', 0xffffff, { delay: 0.6, dur: 2.5, size: 40 });
  },
  card(w: number, h: number, live: boolean) {
    // the apex: high above his stadium, a sea of clouds below, the stars above, the ball coming down in fire
    const k = new Container();
    const m = Math.min(w, h);
    const u = Math.max(0.3, h / 1080);
    const sky = vgrad(new Graphics(), 0, 0, w, h, [0x02020a, 0x060a24, 0x10204e, 0x2a3c78, 0x5a6aa0], 18);
    starfield(sky, 0, 0, w, h * 0.5, Math.round(w / 14), 23, 0xffffff, 2.4 * u + 0.3);
    sky.poly(ngon(w / 2 + Math.min(w * 0.38, m * 0.7), h * 0.18, m * 0.08, m * 0.08, 24)).fill(0xf4efe0);
    // the stadium far below, glowing through a hole in the clouds
    const below = new Graphics();
    const sx = w / 2 - Math.min(w * 0.3, m * 0.55);
    const sy = h * 0.86;
    for (let i = 5; i >= 1; i--) below.poly(ngon(sx, sy, m * 0.05 * i, m * 0.02 * i, 20)).fill({ color: 0xfff2d8, alpha: 0.06 });
    below.poly(ngon(sx, sy, m * 0.14, m * 0.05, 24)).fill(0x3a1a24).poly(ngon(sx, sy, m * 0.1, m * 0.034, 20)).fill(0x2f8f3e);
    const clouds = new Graphics();
    const drawClouds = (t: number) => {
      clouds.clear();
      const rr = rnd(9);
      fogBank(clouds, -w * 0.1 - ((t * 20 * u) % (w * 0.1)), w * 1.2, h * 0.78, h * 0.1, 0x8a9ac0, 0.85, rr, Math.max(6, Math.round(w / 220)));
      fogBank(clouds, -w * 0.1 - ((t * 34 * u) % (w * 0.1)), w * 1.2, h * 0.95, h * 0.09, 0xaab8d8, 0.9, rr, Math.max(6, Math.round(w / 200)));
    };
    drawClouds(0);
    const fire = new Graphics();
    const bx = w / 2 + Math.min(w * 0.28, m * 0.5);
    const by = h * 0.42;
    const bl = new Container();
    bl.addChild(ball(m * 0.045));
    bl.position.set(bx, by);
    const drawFire = (t: number) => {
      fire.clear();
      const f = 1 + 0.12 * Math.sin(t * 17);
      fire.poly(streak(bx + m * 0.25, by - m * 0.32, bx, by, 2 * u, m * 0.05 * f)).fill({ color: FIRE, alpha: 0.75 });
      fire.poly(streak(bx + m * 0.25, by - m * 0.32, bx, by, 1 * u, m * 0.022 * f)).fill({ color: 0xffe14d, alpha: 0.95 });
    };
    drawFire(0);
    // the height meter, frozen on 25000
    const box = new Graphics();
    const bs = m / 1080;
    const mx = w / 2 - Math.min(w * 0.42, m * 0.78);
    box.rect(mx, h * 0.08, 300 * bs, 120 * bs).fill(0x0d1030).stroke({ width: Math.max(1, 3 * bs), color: 0xffffff });
    box.rect(mx, h * 0.08, 300 * bs, 28 * bs).fill(GREEN);
    segText(box, '25000', mx + 18 * bs, h * 0.08 + 40 * bs, 60 * bs, 0xffe14d, 0.1);
    k.addChild(sky, below, clouds, fire, bl, box);
    if (live)
      liveLoop(k, (t) => {
        drawClouds(t);
        drawFire(t);
        bl.rotation = t * 3;
      });
    return k;
  },
};
