/**
 * Zoomic: the supersonic universe (the blue speed-hedgehog games). A green zone in 16-bit color: a banded sky, a far sea
 * that glitters, checkered brown cliffs under a scalloped grass edge, pixel palm trees and a giant loop of track behind
 * him; gold rings turn in rows; PUNTOS · TIEMPO · ANILLOS in the corner. ¡ZOOM!: the silhouette is gone — a blue blur
 * crosses three times (once all the way around the loop), picking the rings up, and skids to a stop right where he was.
 * Payoff: rings burst out of him and bounce away; ¡YA LLEGUÉ! / …tu internet sigue cargando. (a spinner turns beside it)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, every, later } from './kit';
import { hideDisc, pixelText } from './kitA';
import { fadeKill, stash } from './kitB';
import { beat, borrowPose, pay } from './kitC';
import { bandPts, ngon, rnd, streak, twinkle } from './kitD';
import { type Head, prepHead, prepWord, show, showHead } from './kitE';
import { liveLoop } from '../../../panels/collection/cardArt';

const BLUE = 0x1e5bd6;
const GOLD = 0xffd23f;
const SOIL = [0xb8642a, 0x8a4418];
const GRASS = 0x3cc83c;

/** the banded sky, clouds, the far sea with glints, far green hills (`k` scale, sea line at `sy`) */
function backdrop(g: Graphics, w: number, h: number, k: number, sy: number, t: number, gy = h) {
  const bands = [0x1a4ad0, 0x2a62e0, 0x3a7ae8, 0x5a96f0, 0x7ab2f6, 0x9acaf8];
  bands.forEach((col, i) => g.rect(0, (sy * i) / bands.length, w, sy / bands.length + 1).fill(col));
  const u = 34 * k;
  for (const [cx, cy, n] of [
    [w * 0.14, sy * 0.25, 5],
    [w * 0.46, sy * 0.12, 4],
    [w * 0.8, sy * 0.3, 6],
  ] as const) {
    g.rect(cx - (n * u) / 2, cy, n * u, u).fill(0xffffff).rect(cx - (n * u) / 2 + u, cy - u * 0.7, (n - 2) * u, u * 0.7).fill(0xffffff).rect(cx - (n * u) / 2, cy + u, n * u, u * 0.3).fill(0xc8e0ff);
  }
  g.rect(0, sy, w, h * 0.16).fill(0x2a70d8);
  const r = rnd(5);
  for (let i = 0; i < 40; i++) {
    const x = r() * w;
    const y = sy + 6 * k + r() * h * 0.14;
    const on = Math.sin(t * 3 + i) > 0.2;
    g.rect(x, y, (30 + r() * 50) * k, 3 * k).fill({ color: 0xffffff, alpha: on ? 0.8 : 0.3 });
  }
  // the green field between the sea and the cliff edge (bands, lighter toward us)
  const fy = sy + h * 0.16;
  const fb = [0x1e8a3e, 0x26984a, 0x2ea854, 0x38b85e];
  fb.forEach((col, i) => g.rect(0, fy + ((gy - fy) * i) / fb.length, w, (gy - fy) / fb.length + 1).fill(col));
  // far hills (stepped, two greens)
  const hb = 40 * k;
  for (let x = 0; x < w; x += hb) {
    const hh = 2 + Math.round(Math.abs(Math.sin(x / (hb * 7))) * 4);
    g.rect(x, sy + h * 0.16 - hh * hb * 0.6, hb, hh * hb * 0.6 + 4).fill(x % (hb * 2) ? 0x2a9a4a : 0x34a854);
  }
}

/** the checkered cliff ground from `gy` down, with its scalloped grass edge */
function soil(g: Graphics, w: number, h: number, gy: number, k: number) {
  const cell = 48 * k;
  for (let y = gy, row = 0; y < h; y += cell, row++) for (let x = 0, col = 0; x < w; x += cell, col++) g.rect(x, y, cell + 0.5, cell + 0.5).fill(SOIL[(row + col) % 2]);
  g.rect(0, gy - 14 * k, w, 26 * k).fill(GRASS);
  for (let x = 0; x < w; x += 32 * k) g.poly([x, gy + 12 * k, x + 16 * k, gy + 26 * k, x + 32 * k, gy + 12 * k]).fill(0x2aa82a);
  g.rect(0, gy - 18 * k, w, 6 * k).fill(0x7ae87a);
}

/** the loop of track (center x, y; radius R): checkered sectors, a green inner rim */
function loop(g: Graphics, x: number, y: number, R: number, k: number) {
  const th = 60 * k;
  const n = 28;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    g.poly(bandPts(x, y, R, R + th, a0, a1, 2)).fill(SOIL[i % 2]);
  }
  g.poly(ngon(x, y, R, R, 56)).stroke({ width: 12 * k, color: GRASS });
  g.poly(ngon(x, y, R + th, R + th, 56)).stroke({ width: 6 * k, color: 0x5a2a10 });
}

/** a pixel palm: a segmented curving trunk and six fronds (base at (x, y)) */
function palm(g: Graphics, x: number, y: number, s: number, flip = 1) {
  let px = x;
  let py = y;
  for (let i = 0; i < 9; i++) {
    const w = (26 - i) * s;
    g.rect(px - w / 2, py - 30 * s, w, 30 * s).fill(i % 2 ? 0xc8783a : 0x9a5424);
    px += flip * 5 * s * (i / 9);
    py -= 30 * s;
  }
  for (let f = 0; f < 6; f++) {
    const a = -Math.PI / 2 + (f - 2.5) * 0.55;
    const L = (130 + (f % 2) * 30) * s;
    const ex = px + Math.cos(a) * L;
    const ey = py + Math.sin(a) * L * 0.6 + L * 0.35;
    g.poly([px, py, px + Math.cos(a) * L * 0.5, py + Math.sin(a) * L * 0.5 - 14 * s, ex, ey, px + Math.cos(a) * L * 0.5, py + Math.sin(a) * L * 0.5 + 10 * s]).fill(f % 2 ? 0x2aa82a : 0x1e8a22);
  }
  g.poly(ngon(px, py + 8 * s, 14 * s, 14 * s, 8)).fill(0x6a3a1a);
}

/** a gold ring turning (t = its phase), radius r */
function ring(g: Graphics, x: number, y: number, r: number, t: number, a = 1) {
  const rx = r * Math.max(0.12, Math.abs(Math.cos(t)));
  g.poly(ngon(x, y, rx, r, 16)).stroke({ width: r * 0.34, color: 0xc89a1a, alpha: a });
  g.poly(ngon(x, y, rx, r, 16)).stroke({ width: r * 0.2, color: GOLD, alpha: a });
  g.poly(ngon(x - rx * 0.3, y - r * 0.5, r * 0.12, r * 0.12, 6)).fill({ color: 0xfff6b0, alpha: a });
}

/** the blue blur: a spinning spiky ball with afterimages and a tapered streak behind it (dx = its heading) */
function blur(g: Graphics, x: number, y: number, dx: number, dy: number, t: number) {
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  g.poly(streak(x - ux * 520, y - uy * 520, x, y, 6, 64)).fill({ color: 0x5ab0ff, alpha: 0.35 });
  for (let i = 3; i >= 1; i--) g.poly(ngon(x - ux * i * 70, y - uy * i * 70, 62, 62, 16)).fill({ color: BLUE, alpha: 0.18 * (4 - i) });
  const spikes: number[] = [];
  for (let i = 0; i < 16; i++) {
    const a = t * 30 + (i / 16) * Math.PI * 2;
    const r = i % 2 ? 50 : 72;
    spikes.push(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  g.poly(spikes).fill(BLUE).stroke({ width: 4, color: 0x0a2a6a });
  for (let i = 0; i < 3; i++) {
    const a = t * 30 + i * 2.1;
    g.poly(streak(x + Math.cos(a) * 20, y + Math.sin(a) * 20, x + Math.cos(a + 0.6) * 54, y + Math.sin(a + 0.6) * 54, 3, 2)).fill(0xbfe4ff);
  }
}

/** the corner HUD: PUNTOS / TIEMPO / ANILLOS (yellow labels, white numbers, a blue drop shadow) */
function hudDraw(g: Graphics, x: number, y: number, rings: number, tSec: number, px = 5) {
  g.clear();
  const rows: [string, string][] = [
    ['PUNTOS', String(rings * 100)],
    ['TIEMPO', `0:${String(Math.floor(tSec)).padStart(2, '0')}`],
    ['ANILLOS', String(rings)],
  ];
  rows.forEach(([lab, val], i) => {
    const yy = y + i * px * 10;
    pixelText(g, lab, x + px * 0.6, yy + px * 0.6, px, 0x0a2a6a);
    pixelText(g, val, x + px * 46 + px * 0.6, yy + px * 0.6, px, 0x0a2a6a);
    pixelText(g, lab, x, yy, px, GOLD);
    pixelText(g, val, x + px * 46, yy, px, 0xffffff);
  });
}

interface Rg {
  x: number;
  y: number;
  got: boolean;
}
interface St {
  pose: ReturnType<typeof borrowPose>;
  rings: Rg[];
  head: Head;
  spinner: Graphics;
  bl: Graphics;
}
const S = stash<St>();
const GY = 800;
const LX = W / 2;
const LY = GY - 360;
const LR = 300;

export const zoomic: Signature = {
  dark: false,
  frame: BLUE,
  tag: 'UNIVERSO SUPERSÓNICO',
  open(c: SigCtx) {
    const k = new Container();
    const bd = new Graphics();
    backdrop(bd, W, H, 1, 420, 0, GY);
    const lp = new Graphics();
    loop(lp, LX, LY, LR, 1);
    const pl = new Graphics();
    palm(pl, 170, GY - 10, 1.1, 1);
    palm(pl, W - 190, GY - 10, 1, -1);
    const so = new Graphics();
    soil(so, W, H, GY, 1);
    const rg = new Graphics();
    k.addChild(bd, lp, pl, so, rg);
    c.back.addChild(k);
    hideDisc(c, 0.15);
    if (!c.short && !c.reduce) {
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.25 });
    }
    // the rings: two rows on the ground, an arc up the loop
    const rings: Rg[] = [];
    for (let i = 0; i < 5; i++) rings.push({ x: 260 + i * 95, y: GY - 120, got: false });
    for (let i = 0; i < 5; i++) rings.push({ x: W - 640 + i * 95, y: GY - 120, got: false });
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (1.15 + i * 0.175);
      rings.push({ x: LX + Math.cos(a) * (LR - 70), y: LY + Math.sin(a) * (LR - 70), got: false });
    }
    const hud = new Graphics();
    hud.position.set(70, 120);
    c.fg.addChild(hud);
    const bl = new Graphics();
    c.fg.addChild(bl);
    const spinner = new Graphics();
    spinner.visible = false;
    c.fg.addChild(spinner);
    const pose = borrowPose(c);
    const head = prepHead(c, '¡YA LLEGUÉ!', { fontFamily: F.heavy, fontSize: 116, fill: GOLD, stroke: { color: 0x0a2a6a, width: 14, join: 'round' }, dropShadow: { color: BLUE, distance: 8, angle: Math.PI / 4, blur: 0, alpha: 1 } }, {
      aside: '…tu internet sigue cargando.',
      asideStyle: { fill: 0xffffff, stroke: { color: 0x0a2a6a, width: 8, join: 'round' } },
      at: [430, 690],
    });
    S.set(c, { pose, rings, head, spinner, bl });
    let got = 0;
    const t0 = performance.now();
    const frame = (t: number) => {
      if (rg.destroyed) return;
      rg.clear();
      for (const r of rings) if (!r.got) ring(rg, r.x, r.y, 26, t * 4 + r.x * 0.01);
      if (!c.short && !hud.destroyed) hudDraw(hud, 0, 0, got, (performance.now() - t0) / 1000);
    };
    frame(0.2);
    if (!c.reduce) every(c, 30, frame);
    if (c.short) {
      hud.visible = false;
      return;
    }
    fadeKill(hud, 2.8, 0.3);

    // the blur's passes: a path per pass (u 0..1 → x, y)
    const groundY = GY - 110;
    const pass1 = (u: number): [number, number] => [-200 + (W + 400) * u, groundY];
    const pass2 = (u: number): [number, number] => {
      if (u < 0.25) return [W + 200 - (W + 200 - LX) * (u / 0.25), LY + LR - 10];
      if (u < 0.8) {
        const a = Math.PI / 2 + ((u - 0.25) / 0.55) * Math.PI * 2;
        return [LX + Math.cos(a) * (LR - 10), LY + Math.sin(a) * (LR - 10)];
      }
      return [LX - (LX + 200) * ((u - 0.8) / 0.2), LY + LR - 10];
    };
    const pass3 = (u: number): [number, number] => [-200 + (W / 2 + 200) * (1 - Math.pow(1 - u, 2.4)), groundY];
    const collect = (x: number, y: number) => {
      for (const r of rings) {
        if (r.got || Math.hypot(r.x - x, r.y - y) > 110) continue;
        r.got = true;
        got++;
        sfx('coin', 1.2 + (got % 5) * 0.08);
        const sp = new Graphics().poly(twinkle(0, 0, 30)).fill(0xffffff);
        sp.position.set(r.x, r.y);
        c.fg.addChild(sp);
        fadeKill(sp, 0.1, 0.15);
      }
    };
    const run = (path: (u: number) => [number, number], dur: number, d: number, ease = 'none', onDone?: () => void) =>
      beat(c, d, () => {
        sfx('whoosh', 1.5);
        if (c.reduce) {
          for (let i = 0; i <= 20; i++) collect(...path(i / 20));
          frame(0.2);
          onDone?.();
          return;
        }
        const p = { u: 0 };
        let prev = path(0);
        gsap.to(p, {
          u: 1,
          duration: dur,
          ease,
          onUpdate: () => {
            if (bl.destroyed) return;
            const [x, y] = path(p.u);
            bl.clear();
            blur(bl, x, y, x - prev[0], y - prev[1], p.u * dur);
            collect(x, y);
            prev = [x, y];
          },
          onComplete: () => {
            if (!bl.destroyed) bl.clear();
            onDone?.();
          },
        });
      });
    const zoom = prepWord(c.fg, 470, 300, '¡ZOOM!', 0x5ab0ff, 120, -0.1);
    const zoom2 = prepWord(c.fg, W - 470, 330, '¡ZOOM!', GOLD, 100, 0.08);
    // he's gone
    beat(c, 0.12, () => {
      sfx('shoot', 1.8);
      if (!c.cat.destroyed && !pose.given) c.cat.alpha = 0;
      show(c, zoom, 0.6, { from: 1.8 });
    });
    run(pass1, 0.3, 0.18);
    run(pass2, 0.62, 0.58);
    beat(c, 0.75, () => show(c, zoom2, 0.6, { from: 1.8 }));
    // the last pass skids to a stop where he was: he's back, dust flying
    run(pass3, 0.42, 1.3, 'none', () => {
      if (!pose.given && !c.cat.destroyed) c.cat.alpha = 1;
      sfx('hit', 1.1);
      sfx('tick', 0.8);
      c.shaker.add(0.15);
      for (let i = 0; i < 8; i++) {
        const p = new Graphics().rect(-14, -14, 28, 28).fill({ color: 0xd8b888, alpha: 0.9 });
        p.position.set(W / 2 - 60 - Math.random() * 120, GY - 30);
        c.fg.addChild(p);
        if (c.reduce) fadeKill(p, 0.3, 0.2);
        else gsap.to(p, { x: p.x - 160 - Math.random() * 200, y: p.y - 40 - Math.random() * 80, alpha: 0, rotation: 2, duration: 0.5, onComplete: () => destroyTree(p) });
      }
    });
    // safety: whatever happens, he's whole when the takeover ends
    later(c, 2.25, () => pose.give());
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    st?.pose.give();
    // a skip can land mid-pass: the blur goes, he's here
    if (st && !st.bl.destroyed) destroyTree(st.bl);
    sfx('fanfare', 1.15);
    c.shaker.add(0.3);
    // rings burst out of him and bounce away
    const n = c.reduce ? 6 : 18;
    for (let i = 0; i < n; i++) {
      const g = new Graphics();
      ring(g, 0, 0, 24, i);
      g.position.set(W / 2, c.catY + 40);
      c.fg.addChild(g);
      const a = -Math.PI / 2 + (i / n - 0.5) * Math.PI * 1.4;
      const v = 500 + Math.random() * 300;
      if (c.reduce) {
        g.position.set(W / 2 + Math.cos(a) * 300, c.catY + Math.sin(a) * 200);
        fadeKill(g, 1, 0.3);
        continue;
      }
      gsap.to(g, { x: W / 2 + Math.cos(a) * v * 1.4, duration: 1.4, ease: 'none' });
      gsap.to(g, { y: c.catY + 40 + Math.sin(a) * v * 0.5, duration: 0.45, ease: 'power2.out' });
      gsap.to(g, { y: GY - 30, delay: 0.45, duration: 0.5, ease: 'bounce.out' });
      gsap.to(g.scale, { x: 0.2, duration: 0.15, yoyo: true, repeat: 7, ease: 'sine.inOut' });
      gsap.to(g, { alpha: 0, delay: 1.1, duration: 0.3, onComplete: () => destroyTree(g) });
    }
    for (let i = 0; i < 5; i++) later(c, i * 0.06, () => sfx('coin', 1 + i * 0.1));
    showHead(c, st?.head, { dur: 2.6 });
    // the spinner turning beside the aside
    if (st && !st.spinner.destroyed) {
      const sp = st.spinner;
      later(c, 0.6, () => {
        if (sp.destroyed) return;
        sp.visible = true;
        sp.position.set(830, 790);
        const draw = (t: number) => {
          if (sp.destroyed) return;
          sp.clear();
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const lit = (i + Math.floor(t * 12)) % 8;
            sp.poly(ngon(Math.cos(a) * 26, Math.sin(a) * 26, 7, 7, 8)).fill({ color: 0xffffff, alpha: 0.2 + (lit / 8) * 0.8 });
          }
        };
        draw(0);
        if (!c.reduce) every(c, 30, draw);
        gsap.to(sp, { alpha: 0, delay: 2.1, duration: 0.4 });
      });
    }
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const s = m / 1080;
    const gy = h * 0.74;
    const bd = new Graphics();
    backdrop(bd, w, h, s * 1.2, h * 0.36, 0, gy);
    const lp = new Graphics();
    const lr = m * 0.3;
    loop(lp, w / 2, gy - lr - 60 * s, lr, s);
    const pl = new Graphics();
    if (w > h * 2) {
      palm(pl, w / 2 - m * 1.1, gy, s * 1.1, 1);
      palm(pl, w / 2 + m * 1.05, gy, s, -1);
    } else palm(pl, w * 0.12, gy, s * 1.1, 1);
    const so = new Graphics();
    soil(so, w, h, gy, s * 1.2);
    const rg = new Graphics();
    const rs: [number, number][] = [];
    const nr = w > h * 2 ? 12 : 4;
    for (let i = 0; i < nr; i++) {
      const u = (i + 0.5) / nr;
      rs.push([u * w, gy - m * 0.12 - Math.sin(u * Math.PI * (w > h * 2 ? 4 : 1)) * m * 0.06]);
    }
    const drawR = (t: number) => {
      rg.clear();
      for (const [x, y] of rs) ring(rg, x, y, Math.max(4, 26 * s * 1.3), t * 4 + x * 0.02);
    };
    drawR(0.3);
    k.addChild(bd, lp, pl, so, rg);
    if (live) {
      const bl = new Graphics();
      bl.scale.set(s * 1.3);
      k.addChild(bl);
      liveLoop(k, (t) => {
        drawR(0.3 + t);
        bl.clear();
        const ph = (t % 3.2) / 0.8;
        if (ph < 1) {
          const x = (-0.1 + ph * 1.2) * w;
          blur(bl, x / (s * 1.3), (gy - m * 0.08) / (s * 1.3), 1, 0, t);
        }
      });
    }
    return k;
  },
};
