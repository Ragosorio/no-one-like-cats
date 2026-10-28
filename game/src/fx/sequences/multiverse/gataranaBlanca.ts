/**
 * Gata Araña (blanca): the punk universe. A pastel stage — teal wall under pink halftone, a lighting truss, amp stacks,
 * her drum kit with a hooded cat on the bass drum. Two giant drumsticks count it in (¡UN! ¡DOS! ¡TRES! ¡CUATRO!), she's
 * yanked into the rafters and comes down UPSIDE DOWN on a thread, turning slowly like a music-box ballerina while the band
 * crashes in and the lights pump; then she flips and lands on the beat. Payoff: the final crash — pastel paint splashes,
 * the sticks fly, confetti, the amps blast; ¡PLIÉ!
 */
import { Container, Graphics, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { halftoneTexture } from '../../../art/textures';
import { type Signature, type SigCtx, CHEER, SIG_LEN, burst, cheer, drizzle, every, fall, later, score, word } from './kit';
import { cardLoop, hideDisc, ring } from './kitA';

const PINK = 0xff8fb8;
const PINK_D = 0xff4f97;
const TEAL = 0x6fdccf;
const TEAL_D = 0x2fb7a9;
const WHITE = 0xffffff;
const WOOD = 0xf1d39b;
const CONF = [PINK, TEAL, WHITE, 0xfff07a, PINK_D];
const BEAT = 0.3;

/** the hooded cat on the bass drum head: white hood, pink ears, big lenses, web lines */
function hoodLogo(g: Graphics, x: number, y: number, r: number) {
  g.poly([x - r * 0.78, y - r * 0.35, x - r * 0.62, y - r * 1.05, x - r * 0.2, y - r * 0.72]).fill(PINK).stroke({ width: r * 0.05, color: C.ink, join: 'round' });
  g.poly([x + r * 0.78, y - r * 0.35, x + r * 0.62, y - r * 1.05, x + r * 0.2, y - r * 0.72]).fill(PINK).stroke({ width: r * 0.05, color: C.ink, join: 'round' });
  g.circle(x, y, r * 0.8).fill(WHITE).stroke({ width: r * 0.06, color: C.ink });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.moveTo(x, y - r * 0.1).lineTo(x + Math.cos(a) * r * 0.78, y - r * 0.1 + Math.sin(a) * r * 0.74);
  }
  g.stroke({ width: r * 0.02, color: C.ink, alpha: 0.5 });
  for (const sx of [-1, 1]) g.ellipse(x + sx * r * 0.32, y + r * 0.02, r * 0.22, r * 0.3).fill(C.ink).ellipse(x + sx * r * 0.3, y, r * 0.15, r * 0.22).fill(TEAL);
}

/** the drum kit: bass drum (logo), two toms, a snare, a ride and a crash on stands */
function kit(cym: Graphics[]): Container {
  const k = new Container();
  const g = new Graphics();
  // stands
  g.moveTo(-250, -170).lineTo(-230, 160).moveTo(250, -210).lineTo(230, 160).stroke({ width: 8, color: 0x9aa0a8 });
  // toms + snare
  g.roundRect(-150, -150, 120, 80, 18).fill(PINK).stroke({ width: 6, color: C.ink });
  g.roundRect(30, -150, 120, 80, 18).fill(TEAL).stroke({ width: 6, color: C.ink });
  g.roundRect(-300, 20, 130, 60, 14).fill(WHITE).stroke({ width: 6, color: C.ink });
  // bass drum
  g.circle(0, 40, 170).fill(C.ink).circle(0, 40, 156).fill(0xfdf2f6).stroke({ width: 8, color: PINK_D });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    g.circle(Math.cos(a) * 163, 40 + Math.sin(a) * 163, 7).fill(0xd8dce2).stroke({ width: 2, color: C.ink });
  }
  hoodLogo(g, 0, 50, 110);
  k.addChild(g);
  for (const [x, y, r] of [
    [-250, -180, 92],
    [250, -220, 104],
  ]) {
    const cg = new Graphics().ellipse(0, 0, r, r * 0.22).fill(0xf7d65a).stroke({ width: 5, color: C.ink });
    cg.ellipse(0, 0, r * 0.18, r * 0.05).fill(0xd9a92a);
    cg.position.set(x, y);
    k.addChild(cg);
    cym.push(cg);
  }
  return k;
}

/** an amp stack: two cabinets with speaker cones (returned, to pump) */
function amp(cones: Graphics[]): Container {
  const k = new Container();
  for (let j = 0; j < 2; j++) {
    const cab = new Graphics().roundRect(-150, -j * 190 - 180, 300, 180, 10).fill(0x1b1b22).stroke({ width: 6, color: C.ink });
    cab.rect(-120, -j * 190 - 175, 240, 14).fill(PINK);
    k.addChild(cab);
    for (const sx of [-1, 1]) {
      const cn = new Graphics().circle(0, 0, 58).fill(0x3a3a46).stroke({ width: 5, color: 0x55556a }).circle(0, 0, 22).fill(0x15151b);
      cn.position.set(sx * 70, -j * 190 - 82);
      k.addChild(cn);
      cones.push(cn);
    }
  }
  return k;
}

/** the stage: teal wall with pink halftone, torn zine posters, the truss and its lamps, the black floor */
function stage(w = W, h = H, s = 1): { k: Container; beams: Graphics } {
  const k = new Container();
  k.addChild(new Graphics().rect(0, 0, w, h).fill(TEAL));
  const dots = new TilingSprite({ texture: halftoneTexture(PINK, Math.max(8, Math.round(26 * s)), Math.max(2, 7 * s)), width: w, height: h * 0.8 });
  dots.alpha = 0.55;
  k.addChild(dots);
  // torn paper posters (rough edges), a ballet slipper doodle, stars
  const z = new Graphics();
  const torn = (x: number, y: number, pw: number, ph: number, rot: number, fill: number) => {
    const pts: number[] = [];
    const n = 9;
    for (let i = 0; i <= n; i++) pts.push(-pw / 2 + (i / n) * pw, -ph / 2 + (i % 2 ? 6 : -4) * s);
    for (let i = 0; i <= n; i++) pts.push(pw / 2 + (i % 2 ? 5 : -5) * s, -ph / 2 + (i / n) * ph);
    for (let i = n; i >= 0; i--) pts.push(-pw / 2 + (i / n) * pw, ph / 2 + (i % 2 ? -5 : 5) * s);
    for (let i = n; i >= 0; i--) pts.push(-pw / 2 + (i % 2 ? 4 : -6) * s, -ph / 2 + (i / n) * ph);
    const c = Math.cos(rot);
    const si = Math.sin(rot);
    const out: number[] = [];
    for (let i = 0; i < pts.length; i += 2) out.push(x + pts[i] * c - pts[i + 1] * si, y + pts[i] * si + pts[i + 1] * c);
    z.poly(out).fill(fill).stroke({ width: 3 * s, color: C.ink });
  };
  torn(w * 0.12, h * 0.3, 230 * s, 300 * s, -0.12, WHITE);
  torn(w * 0.88, h * 0.36, 210 * s, 280 * s, 0.1, 0xffe3ee);
  torn(w * 0.31, h * 0.16, 160 * s, 120 * s, 0.08, 0xfff7c2);
  // the slipper doodle on the first poster
  const sx = w * 0.12;
  const sy = h * 0.3;
  z.ellipse(sx, sy + 40 * s, 70 * s, 26 * s).fill(PINK).stroke({ width: 4 * s, color: C.ink });
  z.moveTo(sx - 40 * s, sy + 30 * s).bezierCurveTo(sx - 60 * s, sy - 60 * s, sx + 10 * s, sy - 90 * s, sx + 30 * s, sy - 120 * s).stroke({ width: 4 * s, color: PINK_D });
  z.moveTo(sx + 30 * s, sy + 26 * s).bezierCurveTo(sx + 60 * s, sy - 40 * s, sx + 40 * s, sy - 90 * s, sx + 60 * s, sy - 120 * s).stroke({ width: 4 * s, color: PINK_D });
  for (const [x, y, r] of [
    [0.88, 0.3, 46],
    [0.31, 0.15, 30],
    [0.6, 0.12, 22],
  ])
    z.star(w * x, h * y, 5, r * s, r * 0.45 * s).fill(PINK_D).stroke({ width: 3 * s, color: C.ink });
  k.addChild(z);
  // the floor
  const fl = new Graphics().rect(0, h * 0.8, w, h * 0.2).fill(0x16161c);
  fl.rect(0, h * 0.8, w, 10 * s).fill(WHITE);
  fl.moveTo(w * 0.42, h * 0.86).lineTo(w * 0.58, h * 0.94).moveTo(w * 0.58, h * 0.86).lineTo(w * 0.42, h * 0.94).stroke({ width: 10 * s, color: PINK });
  k.addChild(fl);
  // the light beams (redrawn: they sweep) and the truss on top
  const beams = new Graphics();
  k.addChild(beams);
  const tr = new Graphics().rect(0, 40 * s, w, 22 * s).fill(0x2a2a33).stroke({ width: 3 * s, color: C.ink });
  for (let x = 0; x < w; x += 40 * s) tr.moveTo(x, 40 * s).lineTo(x + 20 * s, 62 * s).lineTo(x + 40 * s, 40 * s).stroke({ width: 3 * s, color: 0x55556a });
  for (let i = 0; i < 7; i++) tr.roundRect(w * (0.08 + i * 0.14) - 22 * s, 58 * s, 44 * s, 40 * s, 8 * s).fill(0x1b1b22).stroke({ width: 3 * s, color: C.ink });
  k.addChild(tr);
  return { k, beams };
}

function drawBeams(g: Graphics, w: number, h: number, t: number, on: number, s = 1) {
  g.clear();
  if (on <= 0.01) return;
  for (let i = 0; i < 7; i++) {
    const x = w * (0.08 + i * 0.14);
    const a = Math.sin(t * 1.6 + i * 1.3) * 0.35;
    const L = h * 0.95;
    const wd = 150 * s;
    const col = [PINK, WHITE, TEAL][i % 3];
    g.poly([x - 14 * s, 96 * s, x + 14 * s, 96 * s, x + Math.sin(a) * L + wd, 96 * s + Math.cos(a) * L, x + Math.sin(a) * L - wd, 96 * s + Math.cos(a) * L]).fill({ color: col, alpha: 0.2 * on });
  }
}

/** a drumstick (~420 long), pivot at its butt end */
function stick(): Graphics {
  return new Graphics()
    .poly([0, -13, 380, -7, 400, -10, 420, 0, 400, 10, 380, 7, 0, 13])
    .fill(WOOD)
    .stroke({ width: 6, color: C.ink, join: 'round' })
    .moveTo(30, -4)
    .lineTo(360, -2)
    .stroke({ width: 3, color: 0xfff0d0 });
}

/** a pastel paint splash */
function splash(r: number, color: number): Graphics {
  const g = new Graphics();
  g.circle(0, 0, r).fill(color);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + Math.random() * 0.4;
    const d = r * (0.9 + Math.random() * 0.5);
    g.circle(Math.cos(a) * d, Math.sin(a) * d, r * (0.18 + Math.random() * 0.2)).fill(color);
    g.circle(Math.cos(a) * d * 1.45, Math.sin(a) * d * 1.45, r * 0.08).fill(color);
  }
  return g;
}

function confetti(i: number): Graphics {
  const col = CONF[i % CONF.length];
  const g = new Graphics();
  if (i % 3 === 0) g.star(0, 0, 5, 14, 6).fill(col).stroke({ width: 2, color: C.ink });
  else if (i % 3 === 1) g.rect(-10, -5, 20, 10).fill(col).stroke({ width: 2, color: C.ink });
  else g.poly([0, -12, 11, 8, -11, 8]).fill(col).stroke({ width: 2, color: C.ink });
  return g;
}

interface Punk {
  cones: Graphics[];
  cym: Graphics[];
  drum: Container;
  lights: { on: number };
}
const state = new WeakMap<SigCtx, Punk>();

export const gataranaBlanca: Signature = {
  dark: false,
  frame: PINK,
  tag: 'UNIVERSO PUNK',
  open(c: SigCtx) {
    const st = stage();
    c.back.addChild(st.k);
    hideDisc(c, 0.2);
    const cones: Graphics[] = [];
    const cym: Graphics[] = [];
    const left = amp(cones);
    left.position.set(230, H * 0.8);
    const drum = kit(cym);
    drum.position.set(W - 330, H * 0.8 - 190);
    drum.scale.set(0.95);
    c.back.addChild(left, drum);
    const lights = { on: c.short || c.reduce ? 1 : 0 };
    state.set(c, { cones, cym, drum, lights });
    // the beat (visual): kick pumps the cones and the bass drum, the lights sweep
    const pump = (t: number) => {
      if (drum.destroyed) return;
      const ph = ((t - 0.9) / BEAT) % 1;
      const k = t > 0.9 || c.short ? Math.max(0, 1 - ph * 3) : 0;
      for (const cn of cones) cn.scale.set(1 + k * 0.08);
      drum.scale.set(0.95 * (1 + k * 0.025));
      drawBeams(st.beams, W, H, t, lights.on);
    };
    if (c.reduce) {
      drawBeams(st.beams, W, H, 0, 1);
      return;
    }
    every(c, 40, pump);
    if (c.short) {
      drizzle(c, c.back, () => confetti(Math.floor(Math.random() * 9)), 0.35, 3.2);
      return;
    }

    // the count-in: two giant sticks click four times
    const sl = stick();
    const sr = stick();
    sl.position.set(W / 2 - 420, 420);
    sr.position.set(W / 2 + 420, 420);
    sl.rotation = -0.62;
    sr.rotation = Math.PI + 0.62;
    c.fg.addChild(sl, sr);
    sl.alpha = 0;
    sr.alpha = 0;
    gsap.to([sl, sr], { alpha: 1, duration: 0.08 });
    const COUNT = ['¡UN!', '¡DOS!', '¡TRES!', '¡CUATRO!'];
    COUNT.forEach((w, i) =>
      later(c, 0.1 + i * 0.2, () => {
        gsap.fromTo(sl, { rotation: -0.62 }, { rotation: -0.46, duration: 0.05, yoyo: true, repeat: 1 });
        gsap.fromTo(sr, { rotation: Math.PI + 0.62 }, { rotation: Math.PI + 0.46, duration: 0.05, yoyo: true, repeat: 1 });
        sfx('tick', 2.4 + i * 0.05);
        sfx('hit', 2.2);
        word(c, W / 2 + (i % 2 ? 330 : -330), 640 - (i % 2) * 40, w, i % 2 ? TEAL : PINK, 104, 0.5);
      }),
    );
    // the sticks fly off at the crash
    later(c, 0.9, () => {
      gsap.to(sl, { x: -300, y: -200, rotation: -6, duration: 0.5, ease: 'power2.in', onComplete: () => sl.destroy() });
      gsap.to(sr, { x: W + 300, y: -200, rotation: Math.PI + 6, duration: 0.5, ease: 'power2.in', onComplete: () => sr.destroy() });
    });
    // she's yanked into the rafters… and comes down upside down on a thread, turning like a music-box ballerina
    const cat = c.cat;
    const base = cat.scale.y;
    const line = new Graphics();
    c.fg.addChild(line);
    gsap.to(cat, { y: -420, duration: 0.2, ease: 'power2.in', delay: 0.03 });
    later(c, 0.3, () => sfx('whoosh', 1.7));
    const hangY = c.catY - 50;
    later(c, 0.86, () => {
      cat.rotation = Math.PI;
      cat.y = -420;
      gsap.to(cat, { y: hangY, duration: 0.32, ease: 'back.out(1.6)' });
      sfx('whoosh', 1.1);
    });
    const spin = every(c, 60, (t) => {
      if (cat.destroyed || line.destroyed) return;
      line.clear();
      if (t < 0.86) {
        if (t < 0.3) line.moveTo(cat.x, -20).lineTo(cat.x, cat.y - 200).stroke({ width: 4, color: WHITE });
        return;
      }
      if (t < 1.9) {
        const s = t - 1.1;
        if (s > 0) cat.scale.x = base * Math.cos(s * Math.PI * 1.1);
        cat.x = W / 2 + Math.sin(t * 2.4) * 10;
        line.moveTo(W / 2, -20).lineTo(cat.x, cat.y - 205).stroke({ width: 4, color: WHITE });
      }
    });
    later(c, 1.2, () => word(c, W / 2 + 430, 300, 'colgada… y a tiempo', C.ink, 54, 1.0, F.ui));
    // the band crashes in: lights, confetti
    later(c, 0.9, () => {
      gsap.to(lights, { on: 1, duration: 0.15 });
      sfx('bigboom', 1.3);
      sfx('splash', 1.6);
      c.shaker.add(0.35);
      word(c, W - 330, 330, '¡CRASH!', 0xfff07a, 110, 0.8);
      cym.forEach((g, i) => gsap.fromTo(g, { rotation: i ? 0.3 : -0.3 }, { rotation: 0, duration: 0.6, ease: 'elastic.out(1.4,0.3)' }));
    });
    fall(c, c.back, (i) => confetti(i), { n: 26, over: 1.2, dur: 1.6, spin: 6 });
    fall(c, c.fg, (i) => confetti(i + 1), { n: 8, over: 1.0, dur: 1.4, spin: 7 });
    // the punk beat
    for (let i = 0; i < 4; i++) {
      later(c, 0.9 + i * BEAT * 2, () => sfx('boom', 1.9));
      later(c, 0.9 + BEAT + i * BEAT * 2, () => sfx('hit', 1.5));
    }
    // flip and land, on the beat
    later(c, 1.9, () => {
      spin();
      line.clear();
      cat.scale.x = base;
      gsap.to(cat, { rotation: Math.PI * 2, y: c.catY, x: W / 2, duration: 0.24, ease: 'power2.in', onComplete: () => void (cat.rotation = 0) });
      later(c, 0.24, () => {
        gsap.fromTo(cat.scale, { x: base * 1.15, y: base * 0.85 }, { x: base, y: base, duration: 0.3, ease: 'elastic.out(1.2,0.4)' });
        sfx('boom', 1.4);
        sfx('splash', 1.9);
        c.shaker.add(0.25);
        word(c, W / 2, 150, '¡PLIÉ!', PINK, 120, 0.9);
      });
    });
    // never leave her upside down or off her spot
    later(c, SIG_LEN, () => {
      if (cat.destroyed) return;
      cat.rotation = 0;
      cat.position.set(W / 2, c.catY);
      line.destroy();
    });
    score(c, [[0.0, 'whoosh', 1.5]]);
  },
  payoff(c: SigCtx) {
    const st = state.get(c);
    sfx('bigboom', 1.2);
    sfx('splash', 1.4);
    sfx('fanfare', 1.25);
    c.shaker.add(0.45);
    // pastel paint splashes behind her
    const spots: [number, number, number, number][] = [
      [W / 2 - 250, c.catY - 120, 150, PINK],
      [W / 2 + 260, c.catY + 60, 170, TEAL_D],
      [W / 2 - 80, c.catY + 200, 120, WHITE],
      [W / 2 + 120, c.catY - 230, 110, PINK_D],
    ];
    spots.forEach(([x, y, r, col], i) => {
      const s = splash(r, col);
      s.position.set(x, y);
      c.behind.addChild(s);
      if (c.reduce) return;
      gsap.fromTo(s.scale, { x: 0, y: 0 }, { x: 1, y: 1, duration: 0.22, delay: i * 0.05, ease: 'back.out(2)' });
    });
    if (st) {
      st.cym.forEach((g, i) => !c.reduce && gsap.fromTo(g, { rotation: i ? 0.35 : -0.35 }, { rotation: 0, duration: 0.8, ease: 'elastic.out(1.4,0.3)' }));
      if (!c.reduce) st.cones.forEach((cn, i) => i % 2 === 0 && ring(c, c.back, cn.parent!.x + cn.x, cn.parent!.y + cn.y, WHITE, 40, 6, 8, 0.6));
    }
    // the sticks fly up, twirling
    if (!c.reduce)
      for (const dir of [-1, 1]) {
        const s = stick();
        s.pivot.set(210, 0);
        s.scale.set(0.6);
        s.position.set(W / 2 + dir * 90, c.catY);
        c.fg.addChild(s);
        gsap.to(s, { y: -260, x: W / 2 + dir * 420, rotation: dir * 9, duration: 0.9, ease: 'power2.out', onComplete: () => s.destroy() });
      }
    burst(c, c.fg, (i) => confetti(i), 30, W / 2, c.catY - 40, 800, 1.3);
    drizzle(c, c.back, () => confetti(Math.floor(Math.random() * 9)), 0.3, 3.2);
    cheer(c, '¡PLIÉ!', PINK, 170, 1.9);
    later(c, 1.0, () => word(c, CHEER[0] + 40, CHEER[1] + 110, '…y nunca pierde el ritmo.', C.ink, 44, 1.8, F.ui));
  },
  card(w: number, h: number, live: boolean) {
    const s = Math.min(w, h) / 1000;
    const st = stage(w, h, Math.max(0.3, s * 1.2));
    const k = st.k;
    const cym: Graphics[] = [];
    const d = kit(cym);
    d.scale.set(Math.min(w, h) / 900);
    d.position.set(w / 2, h * 0.62);
    k.addChild(d);
    const a = stick();
    const b = stick();
    const ss = Math.min(w, h) / 900;
    a.scale.set(ss);
    b.scale.set(ss);
    a.position.set(w * 0.18, h * 0.22);
    a.rotation = 0.5;
    b.position.set(w * 0.82, h * 0.22);
    b.rotation = Math.PI - 0.5;
    k.addChild(a, b);
    drawBeams(st.beams, w, h, 0.6, 1, Math.max(0.3, s * 1.2));
    if (live)
      cardLoop(k, 24, (t) => {
        drawBeams(st.beams, w, h, t, 1, Math.max(0.3, s * 1.2));
        const ph = (t / BEAT) % 1;
        d.scale.set((Math.min(w, h) / 900) * (1 + Math.max(0, 1 - ph * 3) * 0.03));
      });
    return k;
  },
};
