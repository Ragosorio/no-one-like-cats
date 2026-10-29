/**
 * Grrrú: the villain universe (a bald supervillain with a striped scarf who wants the moon). An underground lair in
 * slate blues — a wall of monitors (the moon in a crosshair, a blueprint of a shrinking ray, a world map), a rocket on its
 * launch pad, a big paper map with the moon circled in red, pipes, hazard stripes and a catwalk where a line of little
 * yellow helpers trots past. The screens flicker on, the crosshair locks on the moon («OBJETIVO: LA LUNA»), a giant light
 * bulb drops over his silhouette and lights up — ¡IDEA! — and the ray in his paws starts to frost and hum.
 * Payoff: the icy beam hits the moon on the big screen, the moon shrinks to a marble, pops out of the screen and bounces
 * at his feet; the helpers cheer; ¡ROBÉ LA LUNA! (…bueno, una chiquita.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, burst, every, flashOf, later, score } from './kit';
import { hideDisc } from './kitA';
import { stash } from './kitB';
import { beat, pay } from './kitC';
import { onCat } from './kitD';
import { asideText, bar, capsule, glow, oval, payline, pop, pre, rand, rrect, star, sweep, title } from './kitF';
import { liveLoop } from '../../../panels/collection/cardArt';

const WALL = 0x2b3442;
const WALL2 = 0x232a36;
const STEEL = 0x5a6474;
const ICE = 0x8fe0ff;
const SCREEN = 0x0e2a3a;
const MOONC = 0xe8e4d0;
const HAZ = 0xffc83a;

/** the moon on a screen (cx, cy, r) with craters */
function moon(g: Graphics, x: number, y: number, r: number) {
  g.poly(oval(x, y, r, r, 24)).fill(MOONC);
  g.poly(oval(x - r * 0.3, y - r * 0.2, r * 0.22, r * 0.2, 10)).poly(oval(x + r * 0.35, y + r * 0.25, r * 0.28, r * 0.24, 10)).poly(oval(x + r * 0.1, y - r * 0.5, r * 0.12, r * 0.1, 8)).fill(0xc8c2a8);
}

/** the lair (w×h, u vs 1920×1080): walls, pipes, catwalk, rocket, map, the monitor wall (the big screen's moon is separate) */
function lair(w: number, h: number, u: number, cx: number) {
  const g = new Graphics().rect(0, 0, w, h).fill(WALL);
  for (let x = (cx % (240 * u)) - 240 * u; x < w; x += 240 * u) g.rect(x, 0, 10 * u, h * 0.78);
  for (let y = 120 * u; y < h * 0.78; y += 200 * u) g.rect(0, y, w, 8 * u);
  g.fill(WALL2);
  // pipes along the top
  g.rect(0, 30 * u, w, 26 * u).fill(STEEL).rect(0, 70 * u, w, 16 * u).fill(0x4a5464);
  for (let x = (cx % (300 * u)) - 300 * u; x < w; x += 300 * u) g.rect(x, 24 * u, 18 * u, 38 * u).fill(0x3a4250);
  // the catwalk (the helpers trot along it)
  const cwY = 470 * u;
  g.rect(0, cwY, w, 14 * u).fill(STEEL);
  for (let x = (cx % (60 * u)); x < w; x += 60 * u) g.rect(x, cwY - 60 * u, 5 * u, 60 * u);
  g.fill(0x4a5464);
  g.rect(0, cwY - 64 * u, w, 6 * u).fill(0x4a5464);
  // the floor with hazard stripes
  const floorY = h * 0.78;
  g.rect(0, floorY, w, h - floorY).fill(0x1c222c);
  const hz = new Graphics();
  hz.rect(0, floorY, w, 24 * u).fill(0x1a1a1a);
  for (let x = -40 * u; x < w + 40 * u; x += 60 * u) hz.poly([x, floorY + 24 * u, x + 30 * u, floorY + 24 * u, x + 54 * u, floorY, x + 24 * u, floorY]);
  hz.fill(HAZ);
  // the rocket on its pad (right)
  const rx = cx + 700 * u;
  const rk = new Graphics();
  rk.poly([rx - 120 * u, floorY, rx + 120 * u, floorY, rx + 90 * u, floorY - 40 * u, rx - 90 * u, floorY - 40 * u]).fill(STEEL);
  rk.poly([rx - 60 * u, floorY - 40 * u, rx + 60 * u, floorY - 40 * u, rx + 60 * u, floorY - 480 * u, rx, floorY - 640 * u, rx - 60 * u, floorY - 480 * u]).fill(0x9aa4b4).stroke({ width: 5 * u, color: 0x2a3240, join: 'round' });
  rk.poly([rx - 60 * u, floorY - 40 * u, rx - 120 * u, floorY - 40 * u, rx - 60 * u, floorY - 200 * u]).fill(0x5a6474).poly([rx + 60 * u, floorY - 40 * u, rx + 120 * u, floorY - 40 * u, rx + 60 * u, floorY - 200 * u]).fill(0x5a6474);
  rk.poly(oval(rx, floorY - 400 * u, 26 * u, 26 * u, 14)).fill(ICE).stroke({ width: 5 * u, color: 0x2a3240 });
  rk.rect(rx - 60 * u, floorY - 300 * u, 120 * u, 16 * u).fill(0x3a4250);
  // the gantry
  rk.rect(rx + 150 * u, floorY - 600 * u, 16 * u, 600 * u).fill(0x4a5464);
  for (let y = floorY - 560 * u; y < floorY; y += 80 * u) rk.poly(bar(rx + 150 * u, y, rx + 100 * u, y + 40 * u, 3 * u)).fill(0x4a5464);
  // the paper map with the moon circled (left)
  const mx = cx - 770 * u;
  const map = new Graphics();
  map.rect(mx - 200 * u, 150 * u, 400 * u, 280 * u).fill(0xe8dcb8).stroke({ width: 5 * u, color: 0x6a5a3a });
  map.poly([mx - 160 * u, 260 * u, mx - 100 * u, 210 * u, mx - 40 * u, 240 * u, mx - 70 * u, 320 * u, mx - 150 * u, 330 * u]).fill(0xb8c89a);
  map.poly([mx + 10 * u, 300 * u, mx + 80 * u, 260 * u, mx + 120 * u, 330 * u, mx + 60 * u, 390 * u]).fill(0xb8c89a);
  moon(map, mx + 120 * u, 200 * u, 30 * u);
  map.poly(oval(mx + 120 * u, 200 * u, 50 * u, 44 * u, 18), true).stroke({ width: 5 * u, color: 0xd62839 });
  map.poly([mx - 110 * u, 300 * u, mx - 10 * u, 280 * u, mx + 70 * u, 230 * u], false).stroke({ width: 3 * u, color: 0xd62839 });
  map.poly(star(mx - 110 * u, 300 * u, 10 * u, 4 * u, 5)).fill(0xd62839);
  // the monitor wall (center-left, high): three screens; their contents drawn on top
  const mon = new Graphics();
  const scr: [number, number, number, number][] = [
    [cx - 560 * u, 110 * u, 290 * u, 190 * u],
    [cx - 230 * u, 70 * u, 460 * u, 270 * u],
    [cx + 270 * u, 110 * u, 290 * u, 190 * u],
  ];
  for (const [x, y, sw, sh] of scr) mon.rect(x - 12 * u, y - 12 * u, sw + 24 * u, sh + 24 * u).fill(0x15191f).rect(x, y, sw, sh).fill(SCREEN);
  // left screen: a blueprint of the ray; right: a world map
  const [ax, ay, aw, ah] = scr[0];
  for (let i = 1; i < 6; i++) mon.rect(ax, ay + (ah * i) / 6, aw, 1.5 * u).rect(ax + (aw * i) / 6, ay, 1.5 * u, ah);
  mon.fill({ color: 0x3a8ab8, alpha: 0.6 });
  mon.poly([ax + 40 * u, ay + 100 * u, ax + 150 * u, ay + 70 * u, ax + 210 * u, ay + 80 * u, ax + 210 * u, ay + 100 * u, ax + 150 * u, ay + 110 * u], true).stroke({ width: 3 * u, color: ICE });
  const [bx, by, bw, bh] = scr[2];
  mon.poly([bx + 30 * u, by + 70 * u, bx + 80 * u, by + 40 * u, bx + 110 * u, by + 80 * u, bx + 70 * u, by + 120 * u]).poly([bx + 140 * u, by + 50 * u, bx + 220 * u, by + 60 * u, bx + 210 * u, by + 130 * u, bx + 150 * u, by + 110 * u]).fill({ color: 0x3ab87a, alpha: 0.7 });
  for (let i = 0; i < 4; i++) mon.poly(oval(bx + 40 * u + i * 55 * u, by + bh - 24 * u, 4 * u, 4 * u, 6)).fill(0xff4a4a);
  return { g, hz, rk, map, mon, scr, floorY, cwY };
}

/** the giant light bulb (origin at its cord's top); `lit` is the glow */
function bulb(s: number) {
  const k = new Container();
  const g = new Graphics();
  g.poly(bar(0, -600 * s, 0, 0, 3 * s)).fill(0x1a1a1a);
  g.poly(rrect(-34 * s, 0, 68 * s, 60 * s, 8 * s, 2)).fill(0x9aa4b4).stroke({ width: 4 * s, color: 0x2a3240 });
  for (let i = 1; i < 4; i++) g.rect(-34 * s, i * 15 * s, 68 * s, 3 * s).fill(0x5a6474);
  const glass = new Graphics().poly([...oval(0, 150 * s, 100 * s, 100 * s, 24).slice(0, 26), 40 * s, 62 * s, -40 * s, 62 * s]).fill({ color: 0xe8f4ff, alpha: 0.45 }).stroke({ width: 5 * s, color: 0x2a3240 });
  const lit = new Container();
  const halo = glow(320 * s, 0xfff2a0, 0.6, 7, 24);
  halo.blendMode = 'add';
  halo.y = 150 * s;
  const on = new Graphics().poly(oval(0, 150 * s, 96 * s, 96 * s, 24)).fill({ color: 0xfff6c0, alpha: 0.95 });
  // the filament: two wires up from the base and a little coil between them (no letter shapes)
  on.poly([-12 * s, 64 * s, -20 * s, 132 * s], false).poly([12 * s, 64 * s, 20 * s, 132 * s], false).stroke({ width: 4 * s, color: 0xb88a20 });
  on.poly([-20 * s, 132 * s, -14 * s, 124 * s, -8 * s, 134 * s, -2 * s, 124 * s, 4 * s, 134 * s, 10 * s, 124 * s, 16 * s, 134 * s, 20 * s, 132 * s], false).stroke({ width: 5 * s, color: 0xd8a020, join: 'round' });
  lit.addChild(halo, on);
  lit.alpha = 0;
  k.addChild(g, glass, lit);
  return { k, lit };
}

interface St {
  moonG: Graphics;
  big: [number, number, number, number];
  helpers: ReturnType<typeof capsule>[];
  cheer: { v: number };
  lamp: ReturnType<typeof bulb>;
  words: Container[];
  line: ReturnType<typeof payline>;
}
const S = stash<St>();

export const grru: Signature = {
  dark: true,
  frame: ICE,
  tag: 'UNIVERSO VILLANO',
  open(c: SigCtx) {
    const k = new Container();
    const lr = lair(W, H, 1, W / 2);
    const big = lr.scr[1];
    const moonG = new Graphics();
    moon(moonG, big[0] + big[2] / 2, big[1] + big[3] / 2, 95);
    const cross = new Graphics();
    const scan = new Graphics();
    for (let y = 0; y < big[3]; y += 6) scan.rect(big[0], big[1] + y, big[2], 2);
    scan.fill({ color: 0x000000, alpha: 0.25 });
    // the helpers on the catwalk
    const helpers = Array.from({ length: 6 }, (_, i) => {
      const h = capsule(0.62, { eyes: i % 3 === 1 ? 1 : 2, tall: i % 2 ? 1.15 : 0.95, look: 1 });
      h.k.position.set(-120 - i * 90, lr.cwY);
      return h;
    });
    const cheerV = { v: 0 };
    const lamp = bulb(1);
    lamp.k.position.set(W / 2 + 10, -260);
    k.addChild(lr.g, lr.map, lr.mon, moonG, cross, scan, ...helpers.map((h) => h.k), lr.rk, lr.hz, lamp.k);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const words: Container[] = [];
    const line = payline(c, () => title('¡ROBÉ LA LUNA!', { size: 140, fill: ICE, ink: 0x0a1a2a, inkW: 16, shadow: 0x3a4250 }), () => asideText('…bueno, una chiquita.', 0xffffff, 0x0a1a2a, 46));
    S.set(c, { moonG, big, helpers, cheer: cheerV, lamp, words, line });
    const lock = { v: c.short || c.reduce ? 1 : 0 };
    const drawCross = (t: number) => {
      if (cross.destroyed) return;
      cross.clear();
      if (lock.v <= 0) return;
      const cx = big[0] + big[2] / 2;
      const cy = big[1] + big[3] / 2;
      const rr = 120 + (1 - lock.v) * 160;
      cross.poly(oval(cx, cy, rr, rr, 28), true).stroke({ width: 4, color: 0xff4a4a, alpha: 0.9 });
      cross.poly(bar(cx - rr - 20, cy, cx - rr * 0.4, cy, 2)).poly(bar(cx + rr * 0.4, cy, cx + rr + 20, cy, 2)).poly(bar(cx, cy - rr - 14, cx, cy - rr * 0.4, 2)).poly(bar(cx, cy + rr * 0.4, cx, cy + rr + 14, 2)).fill(0xff4a4a);
      if (lock.v >= 1 && Math.sin(t * 10) > 0) cross.poly(oval(cx, cy, rr + 12, rr + 12, 28), true).stroke({ width: 2, color: 0xff4a4a, alpha: 0.6 });
    };
    const life = (t: number) => {
      helpers.forEach((h, i) => {
        if (h.k.destroyed) return;
        const span = W + 700;
        h.k.x = ((t * 230 + i * 90) % span) - 120;
        h.run(t + i * 0.3);
        h.k.y = lr.cwY - cheerV.v * Math.abs(Math.sin(t * 9 + i)) * 40;
      });
      drawCross(t);
    };
    life(c.short || c.reduce ? 1.6 : 0);
    if (!c.reduce) every(c, 30, life);
    if (c.short) {
      lamp.k.y = 40;
      lamp.lit.alpha = 1;
      return;
    }
    score(c, [
      [0.02, 'click', 0.6],
      [0.1, 'zap', 0.8],
      [0.6, 'alarm', 0.9],
      [0.9, 'tick', 1.4],
      [1.3, 'whoosh', 0.6],
      [1.48, 'click', 1.6],
      [1.7, 'freeze', 0.9],
      [1.9, 'charge', 1.2],
    ]);
    // the screens flicker on
    if (!c.reduce && c.flashes) {
      for (const n of [moonG, lr.mon, scan]) n.alpha = 0;
      beat(c, 0.08, () => [moonG, lr.mon, scan].forEach((n) => !n.destroyed && (n.alpha = 1)));
      beat(c, 0.14, () => [moonG, lr.mon].forEach((n) => !n.destroyed && (n.alpha = 0.3)));
      beat(c, 0.2, () => [moonG, lr.mon].forEach((n) => !n.destroyed && (n.alpha = 1)));
    }
    // the crosshair locks on the moon
    beat(c, 0.6, () => {
      if (c.reduce) lock.v = 1;
      else gsap.to(lock, { v: 1, duration: 0.35, ease: 'power3.out' });
    });
    const obj = pre(c.fg, (() => {
      const kk = new Container();
      const t = txt('OBJETIVO: LA LUNA', { fontFamily: F.heavy, fontSize: 34, fill: 0xff4a4a, letterSpacing: 4 });
      t.anchor.set(0.5);
      const b = new Graphics().poly(rrect(-t.width / 2 - 22, -t.height / 2 - 10, t.width + 44, t.height + 20, 6, 2)).fill({ color: 0x0a0a10, alpha: 0.85 }).stroke({ width: 3, color: 0xff4a4a });
      kk.addChild(b, t);
      return kk;
    })(), big[0] + big[2] / 2, big[1] + big[3] + 50, 0);
    words.push(obj);
    pop(c, obj, 0.9, 0.9, { from: 1.4 });
    // the light bulb drops over him and lights: ¡IDEA!
    beat(c, 1.3, () => {
      if (lamp.k.destroyed) return;
      if (c.reduce) lamp.k.y = 40;
      else gsap.to(lamp.k, { y: 40, duration: 0.2, ease: 'bounce.out' });
    });
    beat(c, 1.48, () => {
      if (lamp.lit.destroyed) return;
      lamp.lit.alpha = 1;
      if (!c.reduce && c.flashes) gsap.fromTo(lamp.lit, { alpha: 0.3 }, { alpha: 1, duration: 0.08, repeat: 2, yoyo: true });
    });
    const idea = pre(c.fg, title('¡IDEA!', { size: 120, fill: 0xfff2a0, ink: 0x0a1a2a, inkW: 14, shadow: null }), W / 2 + 330, 250, 0.1);
    words.push(idea);
    pop(c, idea, 1.5, 0.5);
    // the ray frosts and hums
    const [gx, gy] = onCat(c, 0.129, 0.321);
    beat(c, 1.7, () => {
      if (c.reduce) return;
      const g = new Graphics();
      c.fg.addChild(g);
      const p = { v: 0 };
      gsap.to(p, {
        v: 1,
        duration: 0.5,
        onUpdate: () => {
          if (g.destroyed) return;
          g.clear();
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + p.v * 3;
            const d = 70 * (1 - p.v) + 10;
            g.poly(star(gx + Math.cos(a) * d, gy + Math.sin(a) * d, 12, 4, 6)).fill(i % 2 ? 0xffffff : ICE);
          }
        },
        onComplete: () => destroyTree(g),
      });
    });
    const fzz = pre(c.fg, title('¡FZZZ!', { size: 70, fill: ICE, ink: 0x0a1a2a, inkW: 9, shadow: null }), gx - 40, gy + 130, -0.1);
    words.push(fzz);
    pop(c, fzz, 1.75, 0.45, { from: 1.6 });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('freeze', 1.2);
    sfx('zap', 0.7);
    later(c, 0.35, () => sfx('pop', 0.8));
    later(c, 0.45, () => sfx('fanfare', 1.1));
    c.shaker.add(0.35);
    flashOf(c, 0xd8f4ff, 0.45, 0.3);
    if (!st) return;
    sweep(st.words);
    st.line.land(2.4);
    if (!st.lamp.lit.destroyed) {
      st.lamp.lit.alpha = 1;
      gsap.killTweensOf(st.lamp.k);
      st.lamp.k.y = 40;
    }
    st.cheer.v = 1;
    const [gx, gy] = onCat(c, 0.129, 0.321);
    const [x, y, w, h] = st.big;
    const mx = x + w / 2;
    const my = y + h / 2;
    // the beam from the ray to the screen
    const beam = new Graphics();
    beam.poly(bar(gx, gy, mx, my, 10, 40)).fill({ color: ICE, alpha: 0.5 }).poly(bar(gx, gy, mx, my, 4, 14)).fill({ color: 0xffffff, alpha: 0.85 });
    beam.blendMode = 'add';
    c.fg.addChild(beam);
    gsap.to(beam, { alpha: 0, delay: 0.25, duration: 0.25, onComplete: () => destroyTree(beam) });
    // the moon shrinks to a marble, pops out of the screen and bounces at his feet
    const mg = st.moonG;
    if (mg.destroyed) return;
    const tiny = new Graphics();
    moon(tiny, 0, 0, 26);
    tiny.poly(oval(-8, -9, 7, 5, 8, -0.6)).fill({ color: 0xffffff, alpha: 0.8 });
    const land: [number, number] = [W / 2 + 330, c.catY + 230];
    if (c.reduce) {
      mg.visible = false;
      tiny.position.set(...land);
      c.fg.addChild(tiny);
      return;
    }
    mg.pivot.set(mx, my);
    mg.position.set(mx, my);
    gsap.to(mg.scale, {
      x: 0.2,
      y: 0.2,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        if (mg.destroyed) return;
        mg.visible = false;
        tiny.position.set(mx, my);
        c.fg.addChild(tiny);
        const p = { v: 0 };
        gsap.to(p, {
          v: 1,
          duration: 0.75,
          ease: 'none',
          onUpdate: () => {
            if (tiny.destroyed) return;
            const q = p.v;
            tiny.x = mx + (land[0] - mx) * q;
            const fall = my + (land[1] - my) * Math.min(1, q * 1.6);
            const hop = q > 0.62 ? Math.abs(Math.sin((q - 0.62) * Math.PI * 2.6)) * 90 * (1 - q) * 2.6 : 0;
            tiny.y = q < 0.62 ? my - Math.sin(q * Math.PI * 0.8) * 120 + (fall - my) * q : land[1] - hop;
            tiny.rotation += 0.2;
          },
        });
      },
    });
    burst(c, c.fg, (i) => new Graphics().poly(star(0, 0, 14, 5, 6)).fill(i % 2 ? 0xffffff : ICE), 20, mx, my, 500, 0.9);
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 1080;
    const lr = lair(w, h, u, w / 2);
    const big = lr.scr[1];
    const moonG = new Graphics();
    moon(moonG, big[0] + big[2] / 2, big[1] + big[3] / 2, 70 * u);
    const cross = new Graphics();
    const cxx = big[0] + big[2] / 2;
    const cyy = big[1] + big[3] / 2;
    cross.poly(oval(cxx, cyy, 90 * u, 90 * u, 24), true).stroke({ width: 4 * u, color: 0xff4a4a });
    const n = Math.max(3, Math.round(w / (220 * u)));
    const helpers = Array.from({ length: n }, (_, i) => {
      const hh = capsule(0.62 * u, { eyes: i % 3 === 1 ? 1 : 2, tall: i % 2 ? 1.15 : 0.95, look: 1, flat: !live });
      hh.k.position.set(((i + 0.5) / n) * w, lr.cwY);
      return hh;
    });
    k.addChild(lr.g, lr.map, lr.mon, moonG, cross, ...helpers.map((hh) => hh.k), lr.rk, lr.hz);
    if (live)
      liveLoop(k, (t) => {
        helpers.forEach((hh, i) => {
          hh.k.x = ((((i + 0.5) / n) * w + t * 120 * u) % (w + 120 * u)) - 60 * u;
          hh.run(t + i * 0.3);
        });
        cross.alpha = Math.sin(t * 6) > -0.2 ? 1 : 0.3;
      });
    return k;
  },
};
