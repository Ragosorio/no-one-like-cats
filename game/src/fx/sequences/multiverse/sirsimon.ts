/**
 * Sir Simón de Gatterville: the haunted-mansion universe (Wilde, public domain). A moonlit hall behind a tall gothic
 * window, chains swinging from the dark, candles flickering on the walls, ancestors in their frames — and he floats,
 * half transparent. On the rug, a stain that the family scrubs away and that comes back in another color every time
 * («¡ES MERMELADA!»). The candles go out. Payoff: ¡BUUU! (…qué cansancio).
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, CHEER, backlight, burst, cover, every, later, score, word } from './kit';
import { borrowCat, fadeKill, glowWord, liveLoop, puff, rng, stash } from './kitB';

const GHOST = 0xa8c4e0;
const MOON = 0xe8f0ff;
const FLAME = 0xffb44a;
/** the stain's colors: blood, then green, then «mermelada» */
const STAINS = [0xb3122e, 0x3fdc5a, 0x8a2a8a];
const STAIN: [number, number] = [430, 935];

/** a tall pointed window (width 460, bottom at 0, apex near -610) with lead lattice and the moon */
function gothicWindow(): Container {
  const k = new Container();
  const R = 345;
  const span = 230;
  const spring = -330;
  // each side is an arc centered on the other side's springing line (a lancet arch)
  const cx = R - span;
  const aApex = Math.acos(-cx / R);
  const left: number[] = [];
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI + (aApex - Math.PI) * (i / 12);
    left.push(cx + R * Math.cos(a), spring - R * Math.sin(a));
  }
  const apexY = left[left.length - 1];
  const right: number[] = [];
  for (let i = left.length - 4; i >= 0; i -= 2) right.push(-left[i], left[i + 1]);
  const shape = [-span, 0, ...left, ...right, span, 0];
  const glass = new Graphics().poly(shape).fill(0x34466e);
  glass.poly(shape).fill({ color: 0x5a76a8, alpha: 0.6 });
  const moon = new Graphics().circle(70, -400, 120).fill({ color: MOON, alpha: 0.12 }).circle(70, -400, 74).fill(MOON).circle(46, -416, 14).fill(0xc8d4ea).circle(96, -380, 10).fill(0xc8d4ea);
  const lead = new Graphics();
  for (let i = -12; i <= 12; i++) {
    lead.moveTo(i * 60 - 400, 0).lineTo(i * 60 + 400, -800).stroke({ width: 4, color: 0x0e0e18 });
    lead.moveTo(i * 60 + 400, 0).lineTo(i * 60 - 400, -800).stroke({ width: 4, color: 0x0e0e18 });
  }
  lead.rect(-9, apexY, 18, -apexY).fill(0x15141f).rect(-span, spring - 8, span * 2, 16).fill(0x15141f);
  const mask = new Graphics().poly(shape).fill(0xffffff);
  const inner = new Container();
  inner.addChild(glass, moon, lead, mask);
  inner.mask = mask;
  const frame = new Graphics().poly(shape).stroke({ width: 30, color: 0x2c2a3a, join: 'round' }).poly(shape).stroke({ width: 6, color: 0x4a4860, join: 'round' });
  frame.rect(-span - 40, 0, span * 2 + 80, 30).fill(0x2c2a3a);
  k.addChild(inner, frame);
  return k;
}

/** a hanging chain (origin at its anchor; links alternate face-on and edge-on), with a cuff at the end */
function chain(len: number, s = 1): Container {
  const k = new Container();
  const g = new Graphics();
  const n = Math.floor(len / (24 * s));
  for (let i = 0; i < n; i++) {
    const y = i * 24 * s;
    if (i % 2 === 0) g.ellipse(0, y, 9 * s, 15 * s).stroke({ width: 6 * s, color: 0x7d7d8e });
    else g.roundRect(-3.5 * s, y - 14 * s, 7 * s, 28 * s, 3 * s).fill(0x5d5d6e);
  }
  g.circle(0, n * 24 * s + 14 * s, 20 * s).stroke({ width: 8 * s, color: 0x7d7d8e }).rect(-12 * s, n * 24 * s + 26 * s, 24 * s, 10 * s).fill(0x5d5d6e);
  k.addChild(g);
  return k;
}

/** a wall sconce with three candles; returns the flames and glows so they can flicker / go out */
function sconce(s = 1): { k: Container; flames: Graphics[]; glows: Graphics[] } {
  const k = new Container();
  const g = new Graphics().moveTo(0, 40 * s).quadraticCurveTo(-10 * s, 0, -60 * s, -10 * s).moveTo(0, 40 * s).quadraticCurveTo(10 * s, 0, 60 * s, -10 * s).stroke({ width: 6 * s, color: 0x8a6a3a });
  g.roundRect(-10 * s, 30 * s, 20 * s, 30 * s, 4 * s).fill(0x6a4a2a);
  const flames: Graphics[] = [];
  const glows: Graphics[] = [];
  for (const x of [-60, 0, 60]) {
    const y = x === 0 ? -20 : -10;
    g.rect((x - 8) * s, (y - 50) * s, 16 * s, 50 * s).fill(0xeee6d0).stroke({ width: 2 * s, color: C.ink });
    const glow = new Graphics();
    for (let i = 6; i >= 1; i--) glow.circle(0, 0, (80 * s * i) / 6).fill({ color: FLAME, alpha: 0.05 });
    glow.blendMode = 'add';
    glow.position.set(x * s, (y - 66) * s);
    const f = new Graphics().ellipse(0, -10 * s, 8 * s, 16 * s).fill(FLAME).ellipse(0, -6 * s, 4 * s, 8 * s).fill(0xfff2c4);
    f.position.set(x * s, (y - 50) * s);
    flames.push(f);
    glows.push(glow);
  }
  k.addChild(...glows, g, ...flames);
  return { k, flames, glows };
}

/** an ancestor in a dark frame */
function ancestor(seed: number): Graphics {
  const r = rng(seed);
  const g = new Graphics().rect(-80, -100, 160, 200).fill(0x3a2a1a).stroke({ width: 4, color: C.ink }).rect(-64, -84, 128, 168).fill(0x161220);
  g.ellipse(0, 70, 56, 40).fill(0x0c0a12);
  const face = r() < 0.5 ? 0x8a8a9a : 0x9a8a7a;
  g.poly([-30, -36, -24, -62, -8, -42]).fill(face).poly([30, -36, 24, -62, 8, -42]).fill(face).ellipse(0, -20, 32, 30).fill(face);
  g.circle(-11, -24, 4).fill(0x0c0a12).circle(11, -24, 4).fill(0x0c0a12);
  return g;
}

/** the stain on the rug: a splat seen in perspective, with drips */
function stain(color: number, g = new Graphics()): Graphics {
  const r = rng(4);
  const pts: number[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const d = 60 * (0.7 + r() * 0.5);
    pts.push(Math.cos(a) * d * 1.4, Math.sin(a) * d * 0.45);
  }
  g.poly(pts).fill(color);
  for (let i = 0; i < 6; i++) g.ellipse((r() - 0.5) * 200, (r() - 0.5) * 50, 6 + r() * 8, 3 + r() * 3).fill(color);
  g.ellipse(-20, -6, 30, 8).fill({ color: 0xffffff, alpha: 0.18 });
  return g;
}

/** a yellow sponge */
function sponge(): Graphics {
  const g = new Graphics().roundRect(-46, -26, 92, 52, 12).fill(0xf6d34a).stroke({ width: 4, color: C.ink });
  for (let i = 0; i < 7; i++) g.circle(-30 + (i % 4) * 20 + (i > 3 ? 10 : 0), -8 + (i > 3 ? 16 : 0), 4).fill(0xd9a82a);
  g.roundRect(-46, 14, 92, 12, 6).fill(0x3aa85a);
  return g;
}

interface St {
  flare: { v: number };
  flames: Graphics[];
  glows: Graphics[];
  chains: { k: Container; amp: number; ph: number }[];
  kick: (a: number) => void;
}
const S = stash<St>();
const borrowed = new WeakMap<Container, ReturnType<typeof borrowCat>>();

export const sirsimon: Signature = {
  dark: true,
  frame: GHOST,
  tag: 'UNIVERSO EMBRUJADO',
  open(c: SigCtx) {
    const k = new Container();
    k.addChild(cover(0x15131f));
    // stone wall, dark paneling
    const st = new Graphics();
    const r = rng(12);
    for (let y = 0; y < 660; y += 66)
      for (let x = (y / 66) % 2 ? -80 : 0; x < W; x += 160) st.rect(x + 3, y + 3, 154, 60).fill([0x1f1d2c, 0x232132, 0x1c1a28][Math.floor(r() * 3)]);
    st.rect(0, 640, W, 160).fill(0x24180f);
    for (let x = 40; x < W; x += 180) st.rect(x, 662, 150, 116).stroke({ width: 4, color: 0x150e08 });
    st.rect(0, 636, W, 8).fill(0x3a2a18);
    // the floor and the long rug, with its border
    st.rect(0, 800, W, H - 800).fill(0x1a1214);
    st.poly([330, 800, 1590, 800, W + 120, H, -120, H]).fill(0x5e1220);
    st.poly([370, 812, 1550, 812, W + 50, H, -50, H]).stroke({ width: 6, color: 0xb8903a });
    st.poly([420, 830, 1500, 830, W - 40, H, 40, H]).stroke({ width: 3, color: 0xb8903a, alpha: 0.7 });
    k.addChild(st);
    // the window behind him, the moonbeam on the floor
    const win = gothicWindow();
    win.position.set(W / 2, 780);
    const beam = new Graphics().poly([W / 2 - 230, 780, W / 2 + 230, 780, W / 2 + 420, H, W / 2 - 360, H]).fill({ color: 0xbfd4ff, alpha: 0.08 });
    beam.blendMode = 'add';
    k.addChild(win, beam);
    const a1 = ancestor(3);
    a1.position.set(300, 250);
    const a2 = ancestor(9);
    a2.position.set(1620, 250);
    k.addChild(a1, a2);
    const sc = [sconce(), sconce()];
    sc[0].k.position.set(210, 520);
    sc[1].k.position.set(1710, 520);
    k.addChild(sc[0].k, sc[1].k);
    // the stain
    const stn = stain(STAINS[0]);
    stn.position.set(STAIN[0], STAIN[1]);
    k.addChild(stn);
    // the chains
    const chains = [
      [330, 620, 0],
      [600, 420, 1.3],
      [1330, 460, 2.1],
      [1600, 580, 0.6],
    ].map(([x, len, ph]) => {
      const ch = chain(len);
      ch.position.set(x, -20);
      k.addChild(ch);
      return { k: ch, amp: 0.05, ph };
    });
    c.back.addChild(k);
    gsap.to(c.circle, { alpha: 0, duration: c.short ? 0 : 0.3 });
    // a cold glow behind him (ectoplasm)
    const glow = backlight(GHOST, 400, 0.55);
    glow.position.set(W / 2, c.catY);
    c.behind.addChild(glow);
    const flames = [...sc[0].flames, ...sc[1].flames];
    const glows = [...sc[0].glows, ...sc[1].glows];
    const kick = (a: number) => chains.forEach((ch) => (ch.amp = Math.max(ch.amp, a * (0.7 + Math.random() * 0.6))));
    const flare = { v: 1 };
    S.set(c, { flare, flames, glows, chains, kick });
    if (!c.reduce)
      every(c, 30, (t) => {
        for (const ch of chains) {
          if (ch.k.destroyed) continue;
          ch.amp += (0.05 - ch.amp) * 0.03;
          ch.k.rotation = ch.amp * Math.sin(t * 2.4 + ch.ph);
        }
        flare.v += (1 - flare.v) * 0.12;
        for (const f of flames) if (!f.destroyed && f.alpha > 0) f.scale.set(flare.v * (0.9 + Math.random() * 0.2), flare.v * (0.85 + Math.random() * 0.3));
        for (const g of glows) if (!g.destroyed && g.alpha > 0.05) g.alpha = c.flashes ? 0.75 + Math.random() * 0.25 : 0.9;
      });
    if (c.short) return;

    if (!c.reduce) {
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.5 });
      // he floats, half there
      const cat = borrowCat(c);
      borrowed.set(c.root, cat);
      const y0 = c.cat.y;
      every(c, 60, (t) => {
        if (cat.given) return;
        const fade = t < 1.9 ? 1 : Math.max(0, 1 - (t - 1.9) / 0.3);
        c.cat.y = y0 - 14 * fade * (0.5 + 0.5 * Math.sin(t * 2.4));
        c.cat.alpha = 1 - fade * (0.38 + 0.12 * Math.sin(t * 5.3));
      });
      later(c, 2.2, () => cat.give());
      // wisps trail below him
      const wisp = every(c, 9, () => {
        const w = new Graphics().ellipse(0, 0, 40 + Math.random() * 40, 16 + Math.random() * 12).fill({ color: GHOST, alpha: 0.25 });
        w.position.set(W / 2 + (Math.random() - 0.5) * 200, c.catY + 200);
        c.behind.addChild(w);
        gsap.to(w, { y: w.y + 120 + Math.random() * 60, x: w.x + (Math.random() - 0.5) * 120, alpha: 0, duration: 1.1, ease: 'sine.out', onComplete: () => destroyTree(w) });
      });
      later(c, 2.2, wisp);
    }
    score(c, [
      [0.05, 'purr', 0.45],
      [0.2, 'tick', 0.7],
      [0.26, 'shield', 1.9],
      [0.4, 'tick', 0.6],
      [1.1, 'tick', 0.7],
      [1.16, 'shield', 2.1],
    ]);
    later(c, 0.2, () => kick(0.3));
    later(c, 1.1, () => kick(0.28));
    // the stain gag: scrubbed away, it comes back in another color — twice
    const scrub = (t: number, next: number) => {
      later(c, t, () => {
        const sp = sponge();
        sp.position.set(STAIN[0] - 260, STAIN[1] - 20);
        sp.rotation = -0.1;
        c.back.addChild(sp);
        if (c.reduce) {
          sp.position.set(STAIN[0], STAIN[1] - 20);
          gsap.to(stn, { alpha: 0, duration: 0.3 });
          fadeKill(sp, 0.4, 0.2);
          return;
        }
        gsap.to(sp, { x: STAIN[0], duration: 0.14, ease: 'power2.out' });
        gsap.to(sp, { x: STAIN[0] + 40, duration: 0.07, delay: 0.14, yoyo: true, repeat: 5, ease: 'sine.inOut' });
        gsap.to(stn, { alpha: 0, duration: 0.36, delay: 0.14 });
        gsap.to(sp, { x: STAIN[0] + 320, alpha: 0, duration: 0.18, delay: 0.56, ease: 'power2.in', onComplete: () => destroyTree(sp) });
        sfx('splash', 1.5);
        later(c, 0.25, () => sfx('splash', 1.7));
      });
      later(c, t + 0.68, () => {
        if (stn.destroyed) return;
        stain(STAINS[next], stn.clear());
        gsap.to(stn, { alpha: 1, duration: 0.05 });
        if (!c.reduce) gsap.fromTo(stn.scale, { x: 0.2, y: 0.2 }, { x: 1 + next * 0.12, y: 1 + next * 0.12, duration: 0.3, ease: 'back.out(3)' });
        sfx('pop', 0.7 + next * 0.15);
      });
    };
    scrub(0.35, 1);
    scrub(1.12, 2);
    later(c, 0.62, () => word(c, STAIN[0] + 60, STAIN[1] - 150, '¡LIMPIO!', 0xe8f2ff, 54, 0.6));
    later(c, 1.84, () => word(c, STAIN[0] + 80, STAIN[1] - 160, '¡ES MERMELADA!', 0xd28ad2, 54, 0.9));
    // the candles go out; they come back pale blue
    later(c, 1.9, () => {
      sfx('whoosh', 0.4);
      kick(0.4);
      sfx('shield', 1.6);
      flames.forEach((f, i) => {
        if (f.destroyed) return;
        gsap.to(f, { alpha: 0, duration: 0.15, delay: i * 0.03 });
        puff(c, c.back, f.parent!.x + f.x, f.parent!.y + f.y - 20, 0x9a9aaa, 2, 14, 70);
      });
      glows.forEach((g) => !g.destroyed && gsap.to(g, { alpha: 0, duration: 0.2 }));
    });
    later(c, 2.55, () => {
      flames.forEach((f) => {
        if (f.destroyed) return;
        f.tint = 0x9fd0ff;
        gsap.to(f, { alpha: 0.85, duration: 0.3 });
      });
      glows.forEach((g) => {
        if (g.destroyed) return;
        g.tint = 0x9fd0ff;
        gsap.to(g, { alpha: 0.5, duration: 0.3 });
      });
    });
  },
  payoff(c: SigCtx) {
    borrowed.get(c.root)?.give();
    const st = S.get(c);
    sfx('sting', 0.9);
    sfx('freeze', 0.7);
    sfx('boom', 0.55);
    later(c, 0.1, () => sfx('whoosh', 0.45));
    c.shaker.add(0.4);
    if (st) {
      st.kick(0.4);
      // the candles flare back, warm
      st.flames.forEach((f) => {
        if (f.destroyed) return;
        f.tint = 0xffffff;
        f.alpha = 1;
      });
      if (!c.reduce) st.flare.v = 2.2;
      st.glows.forEach((g) => {
        if (g.destroyed) return;
        g.tint = 0xffffff;
        g.alpha = 1;
      });
    }
    // ectoplasm bursts out of him
    burst(c, c.fg, () => new Graphics().ellipse(0, 0, 26 + Math.random() * 20, 14 + Math.random() * 8).fill({ color: GHOST, alpha: 0.55 }), 16, W / 2, c.catY, 700, 1.3);
    // ¡BUUU! … (qué cansancio)
    const k = new Container();
    const b = glowWord('¡BUUU!', 230, 0xeef6ff, GHOST, F.comic);
    const aside = txt('(…qué cansancio)', { fontFamily: F.serif, fontStyle: 'italic', fontWeight: '700', fontSize: 50, fill: 0xd8e8f8, stroke: { color: C.ink, width: 8, join: 'round' } });
    aside.anchor.set(0.5);
    aside.position.set(40, 138);
    aside.alpha = 0;
    k.addChild(b, aside);
    k.position.set(CHEER[0], CHEER[1] - 20);
    k.rotation = -0.05;
    c.fg.addChild(k);
    gsap.fromTo(b.scale, { x: 0.4, y: 0.4 }, { x: 1, y: 1, duration: 0.45, ease: 'elastic.out(1.1,0.45)' });
    gsap.to(aside, { alpha: 1, duration: 0.4, delay: 0.75 });
    if (!c.reduce) {
      const stop = every(c, 30, (t) => {
        if (b.destroyed) return stop();
        b.y = Math.sin(t * 3) * 10;
        b.alpha = 0.82 + 0.18 * Math.sin(t * 7);
      });
    }
    fadeKill(k, 2.5, 0.6);
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = Math.min(w, h) / 300;
    const g = new Graphics().rect(0, 0, w, h).fill(0x1d1b2a);
    const r = rng(12);
    for (let y = 0; y < h * 0.7; y += 26 * u) for (let x = (y / (26 * u)) % 2 ? -30 * u : 0; x < w; x += 62 * u) g.rect(x + u, y + u, 60 * u, 24 * u).fill([0x1f1d2c, 0x252335, 0x1c1a28][Math.floor(r() * 3)]);
    g.rect(0, h * 0.78, w, h * 0.22).fill(0x1a1214).poly([w * 0.2, h * 0.78, w * 0.8, h * 0.78, w + 10, h, -10, h]).fill(0x5e1220);
    const win = gothicWindow();
    win.scale.set(u * 0.42);
    win.position.set(w / 2, h * 0.8);
    const glow = backlight(GHOST, Math.min(w, h) * 0.4, 0.5);
    glow.position.set(w / 2, h * 0.5);
    const c1 = chain(h * 0.5 / (0.6 * u), 0.6 * u);
    c1.position.set(w * 0.1, -6 * u);
    const c2 = chain(h * 0.36 / (0.6 * u), 0.6 * u);
    c2.position.set(w * 0.9, -6 * u);
    const sc = sconce(0.5 * u);
    sc.k.position.set(w * 0.88, h * 0.56);
    const stn = stain(STAINS[1]);
    stn.scale.set(0.4 * u);
    stn.position.set(w * 0.22, h * 0.9);
    k.addChild(g, win, glow, c1, c2, sc.k, stn);
    if (live) {
      let i = 1;
      let next = 2.5;
      liveLoop(k, 20, (t) => {
        c1.rotation = Math.sin(t * 2) * 0.05;
        c2.rotation = Math.sin(t * 2.3 + 1) * 0.05;
        for (const f of sc.flames) f.scale.set(0.9 + Math.random() * 0.2, 0.85 + Math.random() * 0.3);
        if (t > next) {
          next += 2.5;
          i = (i + 1) % STAINS.length;
          stain(STAINS[i], stn.clear());
        }
      });
    }
    return k;
  },
};
