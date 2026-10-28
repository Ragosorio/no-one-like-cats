/** Gato Araña: the spider-verse. A red-and-blue comic city, a web spun behind him, he swings in on a line; ¡THWIP! */
import { Container, Graphics, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { halftoneTexture } from '../../../art/textures';
import { type Signature, type SigCtx, arrive, cheer, cover, every, later, score, word } from './kit';
import { liveLoop, seeded } from '../../../panels/collection/cardArt';

const RED = 0xd7262e;
const BLUE = 0x1f4fb4;
const NIGHT = 0x0b1440;

/** the city: a red/blue diagonal split, halftone, a skyline seen from a rooftop */
function city(): Container {
  const k = new Container();
  k.addChild(cover(BLUE));
  k.addChild(new Graphics().poly([0, 0, W, 0, W, H * 0.18, 0, H * 0.86]).fill(RED));
  const dots = new TilingSprite({ texture: halftoneTexture(C.ink, 14, 3), width: W, height: H });
  dots.alpha = 0.16;
  k.addChild(dots);
  const sky = new Graphics();
  let x = -20;
  let i = 0;
  while (x < W) {
    const w = 90 + ((i * 53) % 80);
    const h = 180 + ((i * 97) % 260);
    sky.rect(x, H - h, w, h).fill(NIGHT);
    for (let wy = H - h + 18; wy < H - 20; wy += 34) for (let wx = x + 14; wx < x + w - 18; wx += 26) if ((wx * 7 + wy * 3 + i) % 5 < 2) sky.rect(wx, wy, 12, 16).fill(0xffd76a);
    x += w + 6;
    i++;
  }
  k.addChild(sky);
  return k;
}

/** a spider web around (0,0): spokes + sagging rings, drawn up to `k` (0..1) */
function web(g: Graphics, R: number, k: number) {
  g.clear();
  const spokes = 14;
  const rings = 7;
  const ang = (i: number) => (i / spokes) * Math.PI * 2 + 0.1;
  for (const [w, col] of [
    [8, C.ink],
    [3, 0xffffff],
  ] as const) {
    // the spokes shoot out first (k 0 → 0.45), then the rings are spun one by one
    const L = R * Math.min(1, k / 0.45);
    for (let i = 0; i < spokes; i++) g.moveTo(0, 0).lineTo(Math.cos(ang(i)) * L, Math.sin(ang(i)) * L);
    g.stroke({ width: w, color: col, alpha: col === C.ink ? 0.55 : 1, cap: 'round' });
    const shown = k >= 1 ? rings : Math.floor(Math.max(0, (k - 0.45) / 0.55) * rings);
    for (let r = 1; r <= shown; r++) {
      const rr = (r / rings) * R;
      for (let i = 0; i < spokes; i++) {
        const a0 = ang(i);
        const a1 = ang(i + 1);
        const mid = (a0 + a1) / 2;
        g.moveTo(Math.cos(a0) * rr, Math.sin(a0) * rr).quadraticCurveTo(Math.cos(mid) * rr * 0.86, Math.sin(mid) * rr * 0.86, Math.cos(a1) * rr, Math.sin(a1) * rr);
      }
    }
    g.stroke({ width: w * 0.8, color: col, alpha: col === C.ink ? 0.55 : 1 });
  }
}

/** a web splat on the camera */
function splat(r: number): Graphics {
  const g = new Graphics();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.random() * 0.3;
    const L = r * (0.8 + Math.random() * 0.5);
    g.moveTo(0, 0).lineTo(Math.cos(a) * L, Math.sin(a) * L);
  }
  g.stroke({ width: 4, color: 0xffffff, cap: 'round' });
  for (const f of [0.35, 0.65]) g.circle(0, 0, r * f).stroke({ width: 3, color: 0xffffff });
  g.circle(0, 0, r * 0.18).fill(0xffffff);
  return g;
}

export const gatarana: Signature = {
  dark: true,
  frame: 0xffffff,
  tag: 'VERSO ARÁCNIDO',
  open(c: SigCtx) {
    const k = city();
    c.back.addChild(k);
    arrive(c, k, 0.2);
    gsap.to(c.circle, { alpha: 0, duration: c.short ? 0 : 0.2 });
    const wg = new Graphics();
    wg.position.set(W / 2, c.CY);
    c.behind.addChild(wg);
    if (c.short || c.reduce) {
      web(wg, 640, 1);
      if (c.short) return;
    } else {
      const p = { k: 0 };
      gsap.to(p, { k: 1, duration: 1.4, delay: 0.25, ease: 'power1.out', onUpdate: () => !wg.destroyed && web(wg, 640, p.k) });
    }
    gsap.to(wg.scale, { x: 1.025, y: 1.025, duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.7 });

    // he's yanked up by a line… and swings back in from the left
    const line = new Graphics();
    c.fg.addChild(line);
    const ax = W / 2;
    const ay = -260;
    const L = c.catY + 260;
    if (!c.reduce) {
      const cat = c.cat;
      gsap.to(cat, { y: -420, duration: 0.24, ease: 'power2.in', delay: 0.02 });
      const t0 = 0.5;
      const stop = every(c, 60, (t) => {
        if (cat.destroyed || line.destroyed) return;
        line.clear();
        if (t < t0) {
          line.moveTo(cat.x, -20).lineTo(cat.x, cat.y - 180).stroke({ width: 4, color: 0xffffff });
          return;
        }
        const s = t - t0;
        if (s < 1.45) {
          const th = -1.05 * Math.exp(-1.7 * s) * Math.cos(4.3 * s);
          cat.position.set(ax + L * Math.sin(th), ay + L * Math.cos(th));
          cat.rotation = th * 0.5;
        } else if (cat.rotation !== 0 || cat.x !== ax) {
          cat.position.set(ax, c.catY);
          cat.rotation = 0;
        }
        if (s < 2.0) line.moveTo(ax, ay).lineTo(cat.x - Math.sin(cat.rotation) * 190, cat.y - Math.cos(cat.rotation) * 190).stroke({ width: 4, color: 0xffffff });
      });
      later(c, 2.05, () => {
        stop();
        cat.position.set(ax, c.catY);
        cat.rotation = 0;
        line.clear();
      });
    }
    word(c, W / 2 - 330, 200, '¡THWIP!', 0xffffff, 100, 0.8);
    later(c, 0.5, () => word(c, 330, 420, '¡THWIP!', 0xffffff, 110, 0.9));
    score(c, [
      [0.02, 'whoosh', 1.9],
      [0.04, 'zap', 2.2],
      [0.5, 'whoosh', 1.6],
      [0.52, 'zap', 2],
      [1.15, 'whoosh', 1.2],
      [1.8, 'tick', 2.6],
      [1.9, 'tick', 2.9],
    ]);
    // spider-sense: wavy lines buzzing around his head
    later(c, 1.75, () => {
      const sense = new Graphics();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i - 4.5) * 0.3;
        const r0 = 200;
        sense.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
        for (let s = 1; s <= 4; s++) {
          const rr = r0 + s * 18;
          const side = s % 2 ? 9 : -9;
          sense.lineTo(Math.cos(a) * rr - Math.sin(a) * side, Math.sin(a) * rr + Math.cos(a) * side);
        }
      }
      sense.stroke({ width: 7, color: C.ink, cap: 'round', join: 'round' });
      sense.position.set(W / 2, c.catY - 40);
      c.fg.addChild(sense);
      gsap.fromTo(sense, { alpha: 0 }, { alpha: 1, duration: 0.08, yoyo: true, repeat: 5, onComplete: () => sense.destroy() });
      word(c, W / 2, 150, '¡SENTIDO ARÁCNIDO!', 0xffe14d, 64, 1.1);
    });
  },
  payoff(c: SigCtx) {
    score(c, [
      [0, 'whoosh', 2],
      [0.12, 'whoosh', 2.3],
      [0.24, 'whoosh', 2.6],
      [0.3, 'hit', 1.2],
    ]);
    // three shots splat on the camera
    const spots: [number, number, number][] = [
      [250, 230, 120],
      [W - 260, H - 260, 140],
      [W - 380, 300, 90],
    ];
    spots.forEach(([x, y, r], i) =>
      later(c, i * 0.12, () => {
        const s = splat(r);
        s.position.set(x, y);
        c.fg.addChild(s);
        gsap.fromTo(s.scale, { x: 0.1, y: 0.1 }, { x: 1, y: 1, duration: 0.18, ease: 'back.out(2)' });
        gsap.to(s, { alpha: 0, delay: 1.6, duration: 0.6, onComplete: () => s.destroy() });
      }),
    );
    cheer(c, '¡THWIP! ¡THWIP!', 0xffffff, 110, 1.6);
    c.shaker.add(0.3);
  },
  card(w, h, live) {
    const k = new Container();
    const m = Math.min(w, h);
    const cx = w / 2;
    const cy = h * 0.54;
    // the red/blue split of the comic city, in halftone
    k.addChild(new Graphics().rect(0, 0, w, h).fill(BLUE).poly([0, 0, w, 0, w, h * 0.2, 0, h * 0.84]).fill(RED));
    const dots = new TilingSprite({ texture: halftoneTexture(C.ink, 14, 3), width: w, height: h });
    dots.tileScale.set(Math.max(0.35, m / 900));
    dots.alpha = 0.18;
    k.addChild(dots);
    // the skyline seen from a rooftop
    const r = seeded(5);
    const sky = new Graphics();
    let x = -w * 0.02;
    while (x < w) {
      const bw = w * (0.06 + r() * 0.06);
      const bh = h * (0.14 + r() * 0.26);
      sky.rect(x, h - bh, bw, bh).fill(NIGHT);
      const ww = Math.max(1.5, bw * 0.14);
      const wh = ww * 1.3;
      for (let wy = h - bh + wh; wy < h - wh; wy += wh * 2.1) for (let wx = x + ww; wx < x + bw - ww * 1.5; wx += ww * 2) if (r() < 0.4) sky.rect(wx, wy, ww, wh).fill(0xffd76a);
      x += bw + w * 0.006;
    }
    k.addChild(sky);
    // the web spun behind him (drawn at 360 so its threads stay bold when scaled)
    const wg = new Graphics();
    web(wg, 360, 1);
    const base = (m * 0.64) / 360;
    wg.scale.set(base);
    wg.position.set(cx, cy);
    k.addChild(wg);
    // his line, out of the top of the card
    const line = new Graphics().moveTo(cx + m * 0.34, -2).lineTo(cx + m * 0.12, cy - m * 0.36).stroke({ width: Math.max(1.5, m * 0.012), color: 0xffffff });
    k.addChild(line);
    if (live) liveLoop(k, (t) => wg.scale.set(base * (1 + 0.025 * Math.sin(t * 2))));
    return k;
  },
};
