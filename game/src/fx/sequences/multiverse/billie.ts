/** Billie Bigotish: the whisper universe. Everything goes dark, a neon-green spotlight, tiny whispers, green drips run down from the top, a heartbeat; the bass drops: «duh.» */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { poster, txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, CHEER, backlight, cover, every, flashOf, later, score } from './kit';
import { glow, liveLoop } from '../../../panels/collection/cardArt';

const GREEN = 0x8bff2c;

/** the dark: black, a green band at the top (her roots), a green spotlight cone */
function dark(c: SigCtx): { k: Container; drips: Graphics } {
  const k = new Container();
  k.addChild(cover(0x050605));
  const roots = new Graphics();
  const pts: number[] = [0, 0, W, 0, W, 24];
  for (let x = W; x >= 0; x -= 40) pts.push(x, 22 + Math.sin(x * 0.03) * 6);
  roots.poly(pts).fill(GREEN);
  k.addChild(roots);
  const cone = new Graphics().poly([W / 2 - 60, 0, W / 2 + 60, 0, W / 2 + 380, H, W / 2 - 380, H]).fill({ color: GREEN, alpha: 0.1 });
  cone.blendMode = 'add';
  k.addChild(cone);
  const pool = new Graphics().ellipse(W / 2, c.catY + 250, 330, 60).fill({ color: GREEN, alpha: 0.14 });
  k.addChild(pool);
  const drips = new Graphics();
  k.addChild(drips);
  return { k, drips };
}

/** a whisper: tiny light-green words that fade in and out */
function whisper(c: SigCtx, text: string, x: number, y: number, size = 30, life = 1.2) {
  const t = txt(text, { fontFamily: F.ui, fontSize: size, fill: 0xc8ffa0, fontStyle: 'italic', letterSpacing: 3 });
  t.anchor.set(0.5);
  t.position.set(x, y);
  t.alpha = 0;
  c.fg.addChild(t);
  gsap.to(t, { alpha: 0.9, duration: 0.35 });
  gsap.to(t, { alpha: 0, delay: life, duration: 0.5, onComplete: () => t.destroy() });
}

export const billie: Signature = {
  dark: true,
  frame: GREEN,
  tag: 'UNIVERSO SUSURRO',
  open(c: SigCtx) {
    const d = dark(c);
    c.back.addChild(d.k);
    gsap.to(c.circle, { alpha: 0, duration: c.short ? 0 : 0.5 });
    const rim = backlight(GREEN, 340, 0.55);
    rim.position.set(W / 2, c.catY);
    c.behind.addChild(rim);
    if (!c.short && !c.reduce) {
      d.k.alpha = 0;
      gsap.to(d.k, { alpha: 1, duration: 0.7, ease: 'power1.in' });
    }
    // green drips run down from the roots (slowly, then for good)
    const drips = Array.from({ length: 24 }, (_, i) => ({ x: 40 + ((i * 83) % (W - 80)), w: 10 + (i % 4) * 5, len: c.short ? 80 + (i % 5) * 50 : 0, v: 30 + ((i * 37) % 60), max: 160 + ((i * 131) % 520) }));
    const speed = { k: c.short ? 0.3 : 0 };
    const draw = () => {
      if (d.drips.destroyed) return;
      d.drips.clear();
      for (const p of drips) {
        if (p.len < 2) continue;
        d.drips.roundRect(p.x - p.w / 2, 16, p.w, p.len, p.w / 2).fill(GREEN);
        d.drips.circle(p.x, 16 + p.len, p.w * 0.85).fill(GREEN);
      }
    };
    draw();
    if (!c.reduce)
      every(c, 30, () => {
        for (const p of drips) p.len = Math.min(p.max, p.len + (p.v * speed.k) / 30);
        draw();
      });
    if (c.short) return;
    later(c, 0.9, () => gsap.to(speed, { k: 0.5, duration: 0.6 }));
    later(c, 0.4, () => whisper(c, 'shhh…', W / 2, c.catY + 320, 30, 1.0));
    later(c, 1.25, () => whisper(c, 'lo bonito se dice bajito', W / 2, c.catY + 360, 26, 0.9));
    score(c, [
      [0.35, 'purr', 0.6],
      [1.9, 'boom', 0.42],
      [2.12, 'boom', 0.4],
    ]);
  },
  payoff(c: SigCtx) {
    sfx('bigboom', 0.55);
    sfx('boom', 0.4);
    c.shaker.add(0.5);
    flashOf(c, GREEN, 0.35, 0.5);
    const ring = new Graphics().circle(0, 0, 120).stroke({ width: 14, color: GREEN });
    ring.position.set(W / 2, c.catY);
    c.fg.addChild(ring);
    gsap.fromTo(ring.scale, { x: 0.4, y: 0.4 }, { x: 8, y: 8, duration: 0.9, ease: 'power2.out' });
    gsap.to(ring, { alpha: 0, duration: 0.9, onComplete: () => ring.destroy() });
    // «duh.» — deadpan, neon, no CMYK ghosts
    const k = new Container();
    const glow = poster('duh.', 200, GREEN, { stroke: { color: GREEN, width: 36 } });
    glow.alpha = 0.25;
    const t = poster('duh.', 200, GREEN, { stroke: { color: C.ink, width: 12 } });
    for (const x of [glow, t]) x.anchor.set(0.5);
    k.addChild(glow, t);
    k.position.set(CHEER[0], CHEER[1]);
    k.rotation = 0.06;
    c.fg.addChild(k);
    gsap.fromTo(k, { alpha: 0 }, { alpha: 1, duration: 0.12 });
    gsap.fromTo(k.scale, { x: 1.25, y: 1.25 }, { x: 1, y: 1, duration: 0.5, ease: 'power3.out' });
    gsap.to(k, { alpha: 0, delay: 2.4, duration: 0.6, onComplete: () => k.destroy({ children: true }) });
    // green dust rising
    for (let i = 0; i < (c.reduce ? 0 : 30); i++) {
      const m = new Graphics().circle(0, 0, 2 + Math.random() * 4).fill(GREEN);
      m.position.set(W / 2 + (Math.random() - 0.5) * 1100, H + 10);
      m.blendMode = 'add';
      c.fg.addChild(m);
      gsap.to(m, { y: 80 + Math.random() * 300, alpha: 0, duration: 2.4 + Math.random() * 1.5, delay: Math.random() * 0.8, ease: 'sine.out', onComplete: () => m.destroy() });
    }
  },
  card(w, h, live) {
    const k = new Container();
    const m = Math.min(w, h);
    const cx = w / 2;
    const cy = h * 0.54;
    k.addChild(new Graphics().rect(0, 0, w, h).fill(0x050605));
    // the green spotlight from above, its pool on the floor, the rim light behind her
    const cone = new Graphics().poly([cx - m * 0.07, 0, cx + m * 0.07, 0, cx + m * 0.55, h, cx - m * 0.55, h]).fill({ color: GREEN, alpha: 0.1 });
    cone.blendMode = 'add';
    k.addChild(cone);
    k.addChild(new Graphics().ellipse(cx, h * 0.93, m * 0.42, m * 0.07).fill({ color: GREEN, alpha: 0.16 }));
    k.addChild(glow(new Graphics(), cx, cy, m * 0.5, GREEN, 0.55));
    // her roots: a green band at the top, dripping
    const top = h * 0.05;
    const roots = new Graphics();
    const pts: number[] = [0, 0, w, 0];
    for (let x = w; x >= 0; x -= Math.max(4, w / 40)) pts.push(x, top + Math.sin(x * (12 / w)) * m * 0.01);
    roots.poly(pts).fill(GREEN);
    k.addChild(roots);
    const drips = new Graphics();
    k.addChild(drips);
    const dd = Array.from({ length: 14 }, (_, i) => ({ x: w * (0.04 + ((i * 0.37) % 0.92)), w: m * (0.012 + (i % 4) * 0.006), max: h * (0.12 + ((i * 131) % 50) / 100), v: 0.05 + ((i * 37) % 60) / 900, p: (i * 0.29) % 1 }));
    const draw = (t: number) => {
      if (drips.destroyed) return;
      drips.clear();
      for (const d of dd) {
        const len = d.max * ((d.p + t * d.v) % 1.15 > 1 ? 0 : ((d.p + t * d.v) % 1.15));
        if (len < 2) continue;
        drips.roundRect(d.x - d.w / 2, top - 1, d.w, len, d.w / 2).fill(GREEN);
        drips.circle(d.x, top + len, d.w * 0.85).fill(GREEN);
      }
    };
    if (live) liveLoop(k, draw);
    else draw(4.2);
    return k;
  },
};
