/**
 * Ssssmichi: the universe of cubes (a block-world game; its green hissing creature). A flat blue sky with a square sun
 * and square clouds, blocky hills, oaks made of blocks; the grass-and-dirt ground builds itself column by column (¡TOC!
 * ¡TOC!), the hotbar and the hearts show up at the bottom. Then a hiss grows, s… s… S… S… S, and the silhouette swells
 * and blinks white, faster and faster — and holds.
 * Payoff: ¡PUM! — blocks fly, square smoke, and a stepped cubic crater is left under him with little dropped blocks
 * bobbing in it (no white flash with Reducir destellos); ¡PUM! / …era un abrazo.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, every, flashOf, later } from './kit';
import { hideDisc, pixelText } from './kitA';
import { fadeKill, stash } from './kitB';
import { beat, pay } from './kitC';
import { rnd } from './kitD';
import { type Head, copyOf, prepHead, prepWord, show, showHead } from './kitE';
import { liveLoop } from '../../../panels/collection/cardArt';
import type { SilhouetteFilter } from '../../filters';

const GREEN = 0x4caf50;
const GRASS = [0x5daa3a, 0x4a9a2e, 0x6cbc44];
const DIRT = [0x8a5a3a, 0x7a4c30, 0x9a6a46];
const STONE = [0x8a8a8a, 0x777777, 0x9a9a9a];
const SPECIES = 'xp_ssssmichi';

/** one block at (x, y) (top-left), size b: base color + pixel speckles (seeded by its position); `kind` grass/dirt/stone */
function block(g: Graphics, x: number, y: number, b: number, kind: 'grass' | 'dirt' | 'stone' | 'leaf' | 'wood', dark = 1) {
  const r = rnd(Math.floor(x * 31 + y * 17) + 7);
  const p = b / 8;
  const pal = kind === 'stone' ? STONE : kind === 'leaf' ? [0x3a8a2a, 0x2e7a22, 0x4a9a34] : kind === 'wood' ? [0x6a4a2a, 0x5a3a20, 0x7a5a34] : DIRT;
  const sh = (c: number) => (dark === 1 ? c : (Math.round(((c >> 16) & 255) * dark) << 16) | (Math.round(((c >> 8) & 255) * dark) << 8) | Math.round((c & 255) * dark));
  g.rect(x, y, b, b).fill(sh(pal[0]));
  for (let i = 0; i < 6; i++) g.rect(x + Math.floor(r() * 8) * p, y + Math.floor(r() * 8) * p, p, p).fill(sh(pal[1 + (i % 2)]));
  if (kind === 'wood') for (let i = 1; i < 4; i++) g.rect(x + i * 2 * p, y, p * 0.6, b).fill(sh(0x4a3018));
  if (kind === 'grass') {
    g.rect(x, y, b, p * 2).fill(sh(GRASS[0]));
    for (let i = 0; i < 8; i++) if (r() < 0.55) g.rect(x + i * p, y + p * 2, p, p).fill(sh(GRASS[1 + (i % 2)]));
    for (let i = 0; i < 3; i++) g.rect(x + Math.floor(r() * 8) * p, y, p, p).fill(sh(GRASS[2]));
  }
}

/** the ground: columns of blocks; `tops[i]` = the row of column i's grass (0 = the base line `y0`), `hole` = crater depth per column */
function ground(g: Graphics, w: number, h: number, b: number, y0: number, tops: number[], hole: number[] | null, upTo = 1e9) {
  g.clear();
  const n = tops.length;
  const x0 = w / 2 - (n * b) / 2;
  for (let i = 0; i < n; i++) {
    if (Math.abs(i - (n - 1) / 2) > upTo) continue;
    const x = x0 + i * b;
    const top = y0 - tops[i] * b;
    const dug = hole ? hole[i] : 0;
    for (let row = 0; top + row * b < h; row++) {
      const y = top + row * b;
      if (row < dug) {
        // the crater's back wall (darker blocks), open above
        block(g, x, y, b, row === 0 ? 'dirt' : 'dirt', 0.45);
        continue;
      }
      const kind = row === dug ? (dug ? 'dirt' : 'grass') : row < dug + 3 ? 'dirt' : 'stone';
      block(g, x, y, b, kind);
    }
  }
}

/** an oak of blocks (trunk base at (x, y), block b) */
function oak(g: Graphics, x: number, y: number, b: number) {
  for (let i = 1; i <= 4; i++) block(g, x, y - i * b, b, 'wood');
  for (let r = 0; r < 3; r++) for (let c = -2 + (r === 0 ? 1 : 0); c <= 2 - (r === 0 ? 1 : 0); c++) block(g, x + c * b, y - (5 + 2 - r) * b, b, 'leaf');
}

/** the sky: flat blue, the square sun, square clouds, blocky hills */
function sky(g: Graphics, w: number, h: number, k: number, y0: number) {
  g.rect(0, 0, w, h).fill(0x8ac0ff);
  g.rect(0, 0, w, h * 0.3).fill(0x78b0f6);
  const sx = w / 2 + 560 * k;
  g.rect(sx - 70 * k, 70 * k, 140 * k, 140 * k).fill(0xfff6a0).rect(sx - 50 * k, 90 * k, 100 * k, 100 * k).fill(0xffffff);
  for (const [cx, cy, cw] of [
    [w * 0.18, 120, 5],
    [w * 0.5, 70, 4],
    [w * 0.78, 250, 6],
  ] as const) {
    const u = 40 * k;
    g.rect(cx - (cw * u) / 2, cy * k, cw * u, u).fill(0xffffff).rect(cx - (cw * u) / 2 + u, cy * k - u * 0.6, (cw - 2) * u, u * 0.6).fill(0xffffff);
  }
  const b = 60 * k;
  const r = rnd(9);
  for (let x = 0; x < w; x += b) {
    const hh = Math.floor(2 + Math.abs(Math.sin(x / (b * 6))) * 4 + r() * 1.5);
    g.rect(x, y0 - hh * b, b, hh * b + 120 * k).fill(0x3e7a3a);
    g.rect(x, y0 - hh * b, b, b * 0.25).fill(0x5a9a46);
  }
}

/** the hotbar (9 slots, items) and ten hearts, centered at (x, y) */
function hud(s: number) {
  const k = new Container();
  const g = new Graphics();
  const u = 72 * s;
  const x0 = -4.5 * u;
  g.rect(x0 - 6 * s, -6 * s, 9 * u + 12 * s, u + 12 * s).fill({ color: 0x222222, alpha: 0.8 });
  for (let i = 0; i < 9; i++) g.rect(x0 + i * u + 3 * s, 3 * s, u - 6 * s, u - 6 * s).fill(0x8a8a8a).rect(x0 + i * u + 7 * s, 7 * s, u - 14 * s, u - 14 * s).fill(0x5a5a5a);
  g.rect(x0 + 1 * u - 2 * s, -2 * s, u + 4 * s, u + 4 * s).stroke({ width: 5 * s, color: 0xffffff });
  const p = 6 * s;
  const at = (i: number) => x0 + i * u + 12 * s;
  // items: a grass block, a fish, a pickaxe, an apple, a milk bucket
  block(g, at(0) + 6 * s, 18 * s, 36 * s, 'grass');
  g.rect(at(1) + p, 30 * s, p * 5, p * 2).fill(0x7aa6c8).rect(at(1) + p * 6, 26 * s, p * 2, p * 3).fill(0x5a86a8).rect(at(1) + p * 2, 30 * s, p, p).fill(C.ink);
  for (let i = 0; i < 6; i++) g.rect(at(2) + p * (1 + i), 18 * s + p * (5 - i), p, p).fill(0x7a5a34);
  g.rect(at(2) + p * 3, 14 * s, p * 5, p).fill(0x9adcdc).rect(at(2) + p * 7, 14 * s, p, p * 3).fill(0x9adcdc);
  g.rect(at(3) + p * 2, 22 * s, p * 4, p * 4).fill(0xd82a2a).rect(at(3) + p * 3, 16 * s, p, p).fill(0x5a3a1a);
  g.rect(at(4) + p * 2, 20 * s, p * 4, p * 5).fill(0xc0c6cc).rect(at(4) + p * 2, 20 * s, p * 4, p * 1.5).fill(0xffffff);
  // hearts
  for (let i = 0; i < 10; i++) {
    const hx = x0 + i * 30 * s;
    const hy = -36 * s;
    g.rect(hx, hy, p, p).rect(hx + 2 * p, hy, p, p).rect(hx - p * 0.5, hy + p, p * 4, p).rect(hx, hy + 2 * p, p * 3, p).rect(hx + p, hy + 3 * p, p, p);
  }
  g.fill(0xe0242a);
  k.addChild(g);
  return k;
}

/** a little cube in 3D (top + two sides): grass or dirt; origin at its center */
function cube(s: number, grass: boolean) {
  const g = new Graphics();
  const top = grass ? GRASS[0] : DIRT[2];
  g.poly([0, -s, s, -s * 0.5, 0, 0, -s, -s * 0.5]).fill(top);
  g.poly([-s, -s * 0.5, 0, 0, 0, s, -s, s * 0.5]).fill(DIRT[0]);
  g.poly([s, -s * 0.5, 0, 0, 0, s, s, s * 0.5]).fill(DIRT[1]);
  return g;
}

interface St {
  groundG: Graphics;
  tops: number[];
  blink: Container | null;
  sil: SilhouetteFilter | null;
  hudK: Container;
  head: Head;
  fuse: { v: number };
}
const S = stash<St>();
const B = 80;
const Y0 = 800;
const TOPS = [2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 1, 1, 1];
const HOLE = [0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0];

export const ssssmichi: Signature = {
  dark: false,
  frame: GREEN,
  tag: 'UNIVERSO DE CUBOS',
  open(c: SigCtx) {
    const k = new Container();
    const sk = new Graphics();
    sky(sk, W, H, 1, Y0 - 40);
    const trees = new Graphics();
    oak(trees, 300, Y0 - 2 * B, B);
    oak(trees, W - 340, Y0 - 2 * B, B);
    const groundG = new Graphics();
    const built = { v: c.short || c.reduce ? 99 : -1 };
    const drawG = () => !groundG.destroyed && ground(groundG, W, H, B, Y0, TOPS, null, built.v);
    drawG();
    k.addChild(sk, trees, groundG);
    c.back.addChild(k);
    hideDisc(c, 0.15);
    if (!c.short && !c.reduce) {
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.25 });
    }
    const hudK = hud(1);
    hudK.position.set(W / 2, H - 96);
    hudK.alpha = c.short ? 0 : 0.001;
    c.fg.addChild(hudK);
    // the white blink over his silhouette (a copy of the painting, all white), swelling
    let blink: Container | null = null;
    let sil: SilhouetteFilter | null = null;
    if (!c.short) {
      const cp = copyOf(SPECIES, 520, 1, 0xffffff);
      blink = cp.root;
      sil = cp.sil;
      blink.position.set(W / 2, c.catY);
      blink.alpha = 0;
      c.fg.addChild(blink);
    }
    const fuse = { v: 0 };
    const head = prepHead(c, '¡PUM!', { fontFamily: F.heavy, fontSize: 190, fill: 0xffffff, stroke: { color: 0x1b1b1b, width: 18, join: 'miter' }, dropShadow: { color: GREEN, distance: 10, angle: Math.PI / 4, blur: 0, alpha: 1 } }, {
      aside: '…era un abrazo.',
      asideStyle: { fill: 0xb8ff8a, stroke: { color: 0x1b1b1b, width: 8, join: 'round' } },
      at: [430, 690],
    });
    S.set(c, { groundG, tops: TOPS, blink, sil, hudK, head, fuse });
    // the fuse: the copy blinks white faster as it swells (gentle, slower and dimmer with Reducir destellos)
    const frame = (t: number) => {
      if (!blink || blink.destroyed) return;
      const f = fuse.v;
      if (f <= 0) return void (blink.alpha = 0);
      const rate = 3 + f * 14;
      const on = 0.5 + 0.5 * Math.sin(t * rate * Math.PI);
      blink.alpha = c.flashes ? on * 0.85 : 0.15 + on * 0.2;
      const sw = 1 + f * 0.12 + (c.reduce ? 0 : Math.sin(t * 40) * 0.008 * f);
      blink.scale.set(sw);
    };
    if (!c.reduce) every(c, 30, frame);
    if (c.short) return;

    // the ground builds itself, column by column from the middle out; then the hotbar
    if (!c.reduce)
      for (let i = 0; i <= 12; i++)
        beat(c, 0.05 + i * 0.05, () => {
          built.v = i;
          drawG();
          if (i % 2 === 0) sfx('tick', 0.9 + i * 0.03);
        });
    const toc = prepWord(c.fg, 470, 400, '¡TOC! ¡TOC!', 0xffffff, 76, -0.08);
    beat(c, 0.2, () => show(c, toc, 0.6, { from: 1.6 }));
    beat(c, 0.6, () => {
      if (hudK.destroyed) return;
      sfx('click', 1.2);
      hudK.alpha = 1;
      if (!c.reduce) gsap.from(hudK, { y: H + 80, duration: 0.25, ease: 'power3.out' });
      gsap.to(hudK, { alpha: 0, delay: 1.7, duration: 0.3 });
    });
    // the hiss: pixel S's growing beside him; the fuse lights
    const hiss = new Graphics();
    c.fg.addChild(hiss);
    const S5 = [8, 11, 14, 18, 23, 28];
    S5.forEach((px, i) =>
      beat(c, 0.85 + i * 0.2, () => {
        if (hiss.destroyed) return;
        sfx('glitch', 0.5 + i * 0.05);
        const x = W / 2 + 240 + i * 20 + S5.slice(0, i).reduce((a, b) => a + b * 5.3, 0);
        pixelText(hiss, 'S', x, c.catY - 120 - px * 3.5, px, i < 4 ? 0x1b1b1b : 0x2e7a22);
        c.shaker.add(0.03 + i * 0.02);
      }),
    );
    beat(c, 0.9, () => {
      sfx('charge', 0.5);
      if (c.reduce) {
        fuse.v = 1;
        if (blink) {
          blink.alpha = c.flashes ? 0.6 : 0.3;
          blink.scale.set(1.1);
        }
      } else gsap.to(fuse, { v: 1, duration: 1.2, ease: 'power1.in' });
    });
    beat(c, 2.1, () => {
      if (!hiss.destroyed) fadeKill(hiss, 0, 0.3);
      // it holds… a slow pulse through the rarity
      if (!c.reduce) gsap.to(fuse, { v: 0.35, duration: 0.4 });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('bigboom', 0.9);
    sfx('boom', 0.6);
    c.shaker.add(0.7);
    flashOf(c, 0xffffff, 0.8, 0.4);
    if (st) {
      st.fuse.v = 0;
      gsap.killTweensOf(st.fuse);
      if (st.blink && !st.blink.destroyed) destroyTree(st.blink);
      if (!st.hudK.destroyed) destroyTree(st.hudK);
      // the cubic crater under him
      if (!st.groundG.destroyed) ground(st.groundG, W, H, B, Y0, st.tops, HOLE);
      // blocks fly, square smoke rolls
      if (!c.reduce) {
        for (let i = 0; i < 18; i++) {
          const q = cube(16 + Math.random() * 14, i % 3 === 0);
          q.position.set(W / 2 + (Math.random() - 0.5) * 300, Y0 + 40);
          c.fg.addChild(q);
          const tx = q.x + (Math.random() - 0.5) * 1500;
          gsap.to(q, { x: tx, duration: 1.1, ease: 'power1.out' });
          gsap.to(q, { y: q.y - 300 - Math.random() * 400, duration: 0.5, ease: 'power2.out', yoyo: true, repeat: 1 });
          gsap.to(q, { rotation: (Math.random() - 0.5) * 10, alpha: 0, delay: 0.6, duration: 0.5, onComplete: () => destroyTree(q) });
        }
        for (let i = 0; i < 14; i++) {
          const sq = 40 + Math.random() * 50;
          const p = new Graphics().rect(-sq / 2, -sq / 2, sq, sq).fill({ color: i % 2 ? 0xd8d8d8 : 0xb8b8b8, alpha: 0.9 });
          p.position.set(W / 2 + (Math.random() - 0.5) * 500, c.catY + 120 + (Math.random() - 0.5) * 300);
          c.fg.addChild(p);
          gsap.to(p, { y: p.y - 120 - Math.random() * 120, alpha: 0, duration: 1 + Math.random() * 0.5, ease: 'power1.out', onComplete: () => destroyTree(p) });
          gsap.fromTo(p.scale, { x: 0.3, y: 0.3 }, { x: 1.3, y: 1.3, duration: 0.8 });
        }
      }
      // dropped blocks bob in the crater (on its shallow steps, clear of the name)
      later(c, 0.5, () => {
        const at: [number, number][] = [
          [7, 1],
          [8, 1],
          [16, 1],
          [17, 1],
        ];
        const qs = at.map(([col, d], i) => {
          const q = cube(14, i % 2 === 0);
          q.position.set(col * B, Y0 + d * B - 24);
          c.back.addChild(q);
          return q;
        });
        if (!c.reduce)
          every(c, 30, (t) =>
            qs.forEach((q, i) => {
              if (q.destroyed) return;
              q.y = Y0 + B - 30 - Math.sin(t * 3 + i) * 8;
              q.scale.x = Math.cos(t * 2 + i);
            }),
          );
      });
    }
    showHead(c, st?.head, { dur: 2.5 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const s = m / 1080;
    const b = Math.max(10, Math.round(B * s * 1.1));
    const y0 = h * 0.74;
    const sk = new Graphics();
    sky(sk, w, h, s * 1.1, y0 - b * 0.5);
    const n = Math.ceil(w / b) + 2;
    const tops: number[] = [];
    const hole: number[] = [];
    for (let i = 0; i < n; i++) {
      const d = Math.abs(i - (n - 1) / 2);
      tops.push(d > 6 ? (d > 9 ? 2 : 1) : 0);
      hole.push(d < 2 ? 2 : d < 3.5 ? 1 : 0);
    }
    const trees = new Graphics();
    if (w > h * 2) {
      oak(trees, w / 2 - m * 0.95, y0 - b, b);
      oak(trees, w / 2 + m * 0.9, y0 - b, b);
    } else oak(trees, w * 0.12, y0, b);
    const gg = new Graphics();
    ground(gg, w, h, b, y0, tops, hole);
    const drops = new Container();
    const ds: Graphics[] = [];
    for (let i = 0; i < 3; i++) {
      const q = cube(b * 0.2, i !== 1);
      q.position.set(w / 2 + (i - 1) * b * 1.2, y0 + b * 1.6);
      drops.addChild(q);
      ds.push(q);
    }
    k.addChild(sk, trees, gg, drops);
    if (live)
      liveLoop(k, (t) => {
        ds.forEach((q, i) => {
          q.y = y0 + b * 1.6 - Math.sin(t * 2 + i) * b * 0.12;
          q.scale.x = Math.cos(t * 1.5 + i);
        });
      });
    return k;
  },
};
