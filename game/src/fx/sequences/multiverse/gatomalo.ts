/** Gato Malo: the reggaeton universe. A tropical sunset with a striped sun and palms, a neon ring, a dembow beat that makes everything pulse, a neon sign of his bunny-ear hat and shades; ¡ESTO NO ES BAILE, ES LUCHA! */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, CHEER, burst, cover, every, later, plate, slam, word } from './kit';

const PINK = 0xff3fa4;
const MINT = 0x39ffb0;
const HORIZON = 760;

/** the sunset: bands, a retro striped sun, a dark sea with reflections, palm silhouettes */
function sunset(): Container {
  const k = new Container();
  const sky = new Graphics();
  const bands = [0x2b0f3a, 0x4a1450, 0x7a1f5c, 0xb02a66, 0xd9366e, 0xf5566a, 0xff7a3d, 0xffa040, 0xffc24a];
  bands.forEach((b, i) => sky.rect(0, (i * HORIZON) / bands.length, W, HORIZON / bands.length + 2).fill(b));
  k.addChild(sky);
  const sun = new Graphics().circle(0, 0, 400).fill(0xffd04a);
  for (let i = 0; i < 7; i++) sun.rect(-420, 40 + i * 48, 840, 8 + i * 4).fill(0xff7a3d);
  sun.position.set(W / 2, HORIZON);
  const sunMask = new Graphics().rect(0, 0, W, HORIZON).fill(0xffffff);
  sun.mask = sunMask;
  k.addChild(sun, sunMask);
  const sea = new Graphics().rect(0, HORIZON, W, H - HORIZON).fill(0x10324a);
  for (let i = 0; i < 9; i++) sea.rect(W / 2 - 300 + i * 20, HORIZON + 14 + i * 34, 600 - i * 40, 6).fill({ color: 0xffb04a, alpha: 0.6 - i * 0.05 });
  k.addChild(sea);
  const palms = new Graphics();
  for (const [x, dir] of [
    [150, 1],
    [W - 150, -1],
  ] as const) {
    palms.moveTo(x, H).quadraticCurveTo(x + dir * 40, 600, x + dir * 120, 330).stroke({ width: 34, color: 0x12061a, cap: 'round' });
    const tx = x + dir * 120;
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.48;
      const L = 230;
      const ex = tx + Math.cos(a) * L;
      const ey = 330 + Math.sin(a) * L * 0.6 + 70;
      palms.poly([tx, 330, (tx + ex) / 2 + Math.sin(a) * 34, (330 + ey) / 2 - 40, ex, ey, (tx + ex) / 2 - Math.sin(a) * 14, (330 + ey) / 2 - 6]).fill(0x12061a);
    }
  }
  k.addChild(palms);
  return k;
}

/** neon stroke: a wide faint glow under a bright line */
function neon(g: Graphics, color: number, width = 6) {
  g.stroke({ width: width * 4, color, alpha: 0.22, cap: 'round', join: 'round' });
  return g;
}

/** the neon sign: a bucket hat with bunny ears over big shades */
function sign(): Graphics {
  const g = new Graphics();
  const draw = () => {
    g.ellipse(-70, -150, 26, 80).ellipse(70, -150, 26, 80);
    g.moveTo(-120, -40).lineTo(-90, -110).lineTo(90, -110).lineTo(120, -40);
    g.ellipse(0, -36, 170, 26);
    g.roundRect(-150, 10, 130, 70, 28).roundRect(20, 10, 130, 70, 28).moveTo(-20, 32).lineTo(20, 32);
  };
  draw();
  neon(g, PINK);
  draw();
  g.stroke({ width: 6, color: 0xffd0ea, cap: 'round', join: 'round' });
  return g;
}

export const gatomalo: Signature = {
  dark: true,
  frame: PINK,
  tag: 'UNIVERSO REGGAETÓN',
  open(c: SigCtx) {
    const k = sunset();
    c.back.addChild(k);
    gsap.to(c.circle, { alpha: 0, duration: 0 });
    // the neon ring where his disc was
    const ring = new Graphics();
    ring.circle(0, 0, 300);
    neon(ring, PINK, 8);
    ring.circle(0, 0, 300).stroke({ width: 8, color: 0xffd0ea });
    ring.position.set(W / 2, c.CY);
    c.behind.addChild(ring);
    const sg = sign();
    sg.position.set(360, 360);
    sg.rotation = -0.08;
    c.back.addChild(sg);
    // the equalizer along the bottom
    const eq = new Graphics();
    c.back.addChild(eq);
    const lv = Array.from({ length: 28 }, () => 0.2);
    let pulse = 0;
    every(c, 30, () => {
      if (eq.destroyed) return;
      eq.clear();
      const bw = W / lv.length;
      lv.forEach((v, i) => {
        lv[i] = Math.max(0.12, v * 0.86);
        const h = 30 + lv[i] * 220;
        eq.rect(i * bw + 6, H - h, bw - 12, h).fill({ color: i % 2 ? PINK : MINT, alpha: 0.75 });
      });
      pulse *= 0.82;
      ring.scale.set(1 + pulse * 0.08);
      sg.alpha = c.flashes ? 0.75 + Math.random() * 0.25 : 1;
    });
    // the beat (also visual-only, on the card, after the takeover): every kick pumps the ring and the bars
    const kick = (loud: boolean) => {
      pulse = 1;
      for (let i = 0; i < lv.length; i++) lv[i] = Math.max(lv[i], 0.4 + Math.random() * 0.6);
      if (loud) sfx('boom', 0.55);
      if (loud && c.flashes) {
        const f = cover(PINK, 0.1);
        c.back.addChild(f);
        gsap.to(f, { alpha: 0, duration: 0.25, onComplete: () => f.destroy() });
      }
    };
    if (c.short || c.reduce) {
      if (!c.reduce) every(c, 1 / 0.625, () => kick(false));
      return;
    }
    // dembow at 96 BPM in sixteenths (0.156 s): kick on the beat, the snare on the 3-3-2
    const step = 0.15625;
    for (let s = 0; s < 14; s++) {
      later(c, 0.05 + s * step, () => {
        if (s % 4 === 0) kick(true);
        if (s % 8 === 3 || s % 8 === 6) sfx('hit', 1.45);
        if (s % 2 === 0) sfx('tick', 2.2);
      });
    }
    later(c, 0.05 + 14 * step, () => every(c, 1 / (step * 4), () => kick(false)));
    ['¡YEH!', '¡YEH!', '¡YEH!'].forEach((w, i) => later(c, 0.35 + i * 0.32, () => word(c, 420 + i * 540, 190 + (i % 2) * 70, w, i % 2 ? MINT : PINK, 110, 0.7)));
    if (c.flashes) gsap.fromTo(sg, { alpha: 0 }, { alpha: 1, duration: 0.05, repeat: 5, yoyo: true, delay: 1.1 });
  },
  payoff(c: SigCtx) {
    sfx('bigboom', 0.8);
    sfx('hit', 1.2);
    c.shaker.add(0.4);
    const p = plate('¡ESTO NO ES BAILE,', PINK, C.ink, 50);
    const p2 = plate('ES LUCHA!', MINT, C.ink, 64, C.ink);
    p2.position.set(30, 74);
    p.addChild(p2);
    slam(c.fg, p, CHEER[0], CHEER[1] - 30, -0.06);
    gsap.to(p, { alpha: 0, delay: 2.2, duration: 0.4, onComplete: () => p.destroy({ children: true }) });
    burst(
      c,
      c.fg,
      (i) => {
        const h = new Graphics();
        const s = 0.9 + (i % 3) * 0.3;
        h.moveTo(0, 8 * s).bezierCurveTo(-22 * s, -8 * s, -10 * s, -26 * s, 0, -12 * s).bezierCurveTo(10 * s, -26 * s, 22 * s, -8 * s, 0, 8 * s);
        return h.fill(i % 2 ? PINK : 0xff2a4a).stroke({ width: 3, color: C.ink });
      },
      26,
      W / 2,
      c.catY,
      820,
      1.3,
    );
  },
};
