/**
 * María Gatoñeta: the palace universe (the court of Versailles, history). A hall of mirrors in pastel and gold — arched
 * mirrors between pink pilasters, a painted ceiling, crystal chandeliers that swing in, a parquet floor — and behind her
 * a tower of cakes grows tier by tier up to the ceiling while macarons rain like confetti and two fans open in the
 * corners. Then her powdered wig grows, and grows, with a little ship sailing on top of it (¡OH, LÀ, LÀ!).
 * Payoff: the cherry on top is knocked off by a giant croqueta, macarons and kibble burst out; ¡QUE COMAN CROQUETAS!
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, burst, every, fall, later, score } from './kit';
import { cardLoop, hideDisc } from './kitA';
import { puff, rng, stash, vgrad } from './kitB';
import { arcPts, beat, ell, floatWord, glowDisc, headline, pay, smooth } from './kitC';

const CREAM = 0xfff4e6;
const MINT = 0xbfe3d0;
const PINK = 0xf7c6d9;
const ROSE = 0xf08cb4;
const GOLD = 0xe6c34a;
const GOLD_D = 0xa8822a;
const GLASS = 0xd7e6ee;
const INK = 0x4a2c1a;
const TIERS = [0xf7a8c4, 0xa8e0c4, 0xfff0d8, 0xd6c2f0, 0xf7a8c4, 0xa8e0c4, 0xfff0d8];
const MACARONS = [0xf7a8c4, 0xa8e0c4, 0xd6c2f0, 0xfbe38a, 0xc8e89a, 0xfff0d8];

/** an arched mirror in a gold frame (origin at its bottom center) */
function mirror(g: Graphics, x: number, y: number, w: number, h: number, u: number) {
  const r = w / 2;
  const shape = [x - r, y, ...arcPts(x, y - h + r, r, r, Math.PI, Math.PI * 2, 16), x + r, y];
  g.poly(shape).fill(GLASS);
  g.poly([x - r * 0.7, y, x - r * 0.2, y, x + r * 0.5, y - h * 0.8, x + r * 0.05, y - h * 0.8]).fill({ color: 0xffffff, alpha: 0.35 });
  g.poly([x + r * 0.15, y, x + r * 0.35, y, x + r * 0.9, y - h * 0.55, x + r * 0.7, y - h * 0.55]).fill({ color: 0xffffff, alpha: 0.25 });
  for (let i = 1; i < 4; i++) g.moveTo(x - r, y - (h - r) * (i / 4)).lineTo(x + r, y - (h - r) * (i / 4)).stroke({ width: 1.5 * u, color: 0xb8c8d2, alpha: 0.8 });
  g.moveTo(x, y).lineTo(x, y - h + r * 0.1).stroke({ width: 1.5 * u, color: 0xb8c8d2, alpha: 0.8 });
  g.poly(shape).stroke({ width: 12 * u, color: GOLD, join: 'round' }).poly(shape).stroke({ width: 3 * u, color: GOLD_D, join: 'round' });
  // a shell on the keystone
  g.poly(arcPts(x, y - h - 4 * u, 22 * u, 16 * u, Math.PI, Math.PI * 2, 8)).fill(GOLD).stroke({ width: 2 * u, color: GOLD_D });
}

/** the back wall: ceiling painting, arched mirrors between pink pilasters, parquet (scaled by u, spanning w) */
function hall(w: number, h: number, u: number, floorY: number) {
  const g = new Graphics();
  g.rect(0, 0, w, h).fill(CREAM);
  // the painted ceiling: a pastel sky with clouds under a gold molding
  vgrad(g, 0, 0, w, 96 * u, [0xbfd8f0, 0xe8f0f8], 6);
  const r = rng(8);
  for (let x = 30 * u; x < w; x += 170 * u) for (let j = 0; j < 3; j++) g.poly(ell(x + j * 36 * u, 50 * u + r() * 20 * u, (40 + r() * 20) * u, (16 + r() * 8) * u, 14)).fill({ color: 0xffffff, alpha: 0.9 });
  g.rect(0, 96 * u, w, 18 * u).fill(GOLD).rect(0, 110 * u, w, 4 * u).fill(GOLD_D).rect(0, 96 * u, w, 3 * u).fill(0xfff2b8);
  // mirrors and pilasters
  const step = 380 * u;
  const n = Math.ceil(w / step) + 1;
  const x0 = w / 2 - Math.floor(n / 2) * step;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * step;
    g.rect(x - 150 * u, 124 * u, 300 * u, floorY - 130 * u).fill(MINT);
    mirror(g, x, floorY - 24 * u, 230 * u, floorY - 200 * u, u);
    const px = x + step / 2;
    g.rect(px - 32 * u, 114 * u, 64 * u, floorY - 114 * u).fill(PINK).rect(px - 24 * u, 140 * u, 48 * u, floorY - 170 * u).stroke({ width: 3 * u, color: GOLD });
    g.rect(px - 40 * u, 114 * u, 80 * u, 26 * u).fill(GOLD).stroke({ width: 2 * u, color: GOLD_D });
    g.poly(ell(px - 22 * u, 128 * u, 9 * u, 9 * u, 10)).fill(0xfff2b8).poly(ell(px + 22 * u, 128 * u, 9 * u, 9 * u, 10)).fill(0xfff2b8);
  }
  // the dado and the parquet (a lattice in perspective)
  g.rect(0, floorY - 24 * u, w, 24 * u).fill(PINK).rect(0, floorY - 26 * u, w, 4 * u).fill(GOLD);
  g.rect(0, floorY, w, h - floorY).fill(0xd9b27a);
  const vx = w / 2;
  const vy = floorY - 260 * u;
  for (let i = -14; i <= 14; i++) {
    const bx = w / 2 + i * 150 * u;
    const t = (floorY - vy) / (h - vy);
    g.moveTo(vx + (bx - vx) * t, floorY).lineTo(bx, h).stroke({ width: 2 * u, color: 0xb8894e });
  }
  for (let j = 0; j < 6; j++) {
    const y = floorY + (h - floorY) * ((j + 1) / 6) ** 1.6;
    g.rect(0, y, w, 2 * u).fill(0xb8894e);
  }
  // a pink runner up the middle
  g.poly([w / 2 - 90 * u, floorY, w / 2 + 90 * u, floorY, w / 2 + 260 * u, h, w / 2 - 260 * u, h]).fill(ROSE).poly([w / 2 - 80 * u, floorY, w / 2 + 80 * u, floorY, w / 2 + 236 * u, h, w / 2 - 236 * u, h]).stroke({ width: 3 * u, color: GOLD });
  return g;
}

/** a crystal chandelier (origin at its hook); returns the flames to flicker */
function chandelier(s = 1) {
  const k = new Container();
  const g = new Graphics();
  g.moveTo(0, 0).lineTo(0, 80 * s).stroke({ width: 4 * s, color: GOLD_D });
  g.poly(ell(0, 110 * s, 30 * s, 34 * s, 14)).fill(GOLD).stroke({ width: 3 * s, color: GOLD_D });
  g.poly(ell(0, 150 * s, 46 * s, 14 * s, 16)).fill(GOLD).stroke({ width: 3 * s, color: GOLD_D });
  const flames = new Graphics();
  for (let i = 0; i < 6; i++) {
    const x = (-125 + i * 50) * s;
    const y = (i === 0 || i === 5 ? 120 : i === 1 || i === 4 ? 136 : 146) * s;
    g.poly(smooth([0, 150 * s, x * 0.5, 190 * s, x, y + 20 * s], 4, false), false).stroke({ width: 5 * s, color: GOLD, cap: 'round' });
    g.rect(x - 9 * s, y + 10 * s, 18 * s, 10 * s).fill(GOLD_D);
    g.rect(x - 5 * s, y - 20 * s, 10 * s, 30 * s).fill(0xfffaf0);
    flames.poly(ell(x, y - 30 * s, 6 * s, 11 * s, 10)).fill(0xffd27a);
    // crystal drops in a festoon
    for (let j = 1; j < 4; j++) {
      const dx = x - (j * 16 - 8) * s * Math.sign(x || 1);
      g.poly([dx, y + 26 * s + j * 6 * s, dx + 5 * s, y + 36 * s + j * 6 * s, dx, y + 48 * s + j * 6 * s, dx - 5 * s, y + 36 * s + j * 6 * s]).fill({ color: 0xeaf6ff, alpha: 0.95 });
    }
  }
  for (let j = 0; j < 5; j++) g.poly([(-16 + j * 8) * s, 170 * s, (-12 + j * 8) * s, 186 * s, (-16 + j * 8) * s, 206 * s, (-20 + j * 8) * s, 186 * s]).fill(0xeaf6ff);
  const glow = glowDisc(150 * s, 0xfff2c4, 0.3, 6, 24);
  glow.position.set(0, 130 * s);
  glow.blendMode = 'add';
  k.addChild(glow, g, flames);
  return { k, flames };
}

/** one cake tier (origin at its bottom center): body, frosting drips, pearls and rosettes */
function tier(w: number, h: number, color: number, seed: number) {
  const g = new Graphics();
  g.roundRect(-w / 2, -h, w, h, 10).fill(color).stroke({ width: 4, color: INK, alpha: 0.6 });
  g.rect(-w / 2, -h * 0.42, w, h * 0.12).fill({ color: 0xffffff, alpha: 0.45 });
  const r = rng(seed);
  const drip: number[] = [-w / 2 - 4, -h - 6];
  const n = Math.max(6, Math.round(w / 34));
  for (let i = 0; i <= n; i++) {
    const x = -w / 2 + (i / n) * w;
    drip.push(x, -h + 10 + (i % 2 ? 6 + r() * 26 : 4));
  }
  drip.push(w / 2 + 4, -h - 6);
  g.poly(smooth(drip, 3)).fill(0xfffdf8).stroke({ width: 3, color: INK, alpha: 0.35 });
  for (let i = 0; i < n * 2; i++) g.poly(ell(-w / 2 + 10 + (i * (w - 20)) / (n * 2 - 1), -6, 5, 5, 8)).fill(0xfffdf8);
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 20 + (i * (w - 40)) / Math.max(1, n - 1);
    g.poly(ell(x, -h - 6, 9, 7, 10)).fill(i % 2 ? 0xf47aa6 : 0xfffdf8).stroke({ width: 2, color: INK, alpha: 0.4 });
  }
  return g;
}

/** a macaron (two shells and the filling) */
function macaron(color: number, s = 1) {
  return new Graphics()
    .poly(ell(0, -8 * s, 26 * s, 12 * s, 14))
    .fill(color)
    .rect(-24 * s, -4 * s, 48 * s, 8 * s)
    .fill(0xfffdf8)
    .poly(ell(0, 8 * s, 26 * s, 12 * s, 14))
    .fill(color)
    .poly(ell(0, -8 * s, 26 * s, 12 * s, 14))
    .stroke({ width: 2 * s, color: INK, alpha: 0.5 })
    .poly(ell(0, 8 * s, 26 * s, 12 * s, 14))
    .stroke({ width: 2 * s, color: INK, alpha: 0.5 });
}

/** a croqueta (a kibble: a rounded brown triangle with a shine) */
function croqueta(s = 1) {
  const p = smooth([0, -30 * s, 30 * s, 22 * s, -30 * s, 22 * s], 6);
  return new Graphics().poly(p).fill(0xa8642e).stroke({ width: 4 * s, color: 0x4a2a12, join: 'round' }).poly(ell(-6 * s, -4 * s, 8 * s, 5 * s, 10)).fill({ color: 0xffd9a0, alpha: 0.7 });
}

/** a folding fan (origin at its pivot), open = 1 */
function fan(r: number) {
  const k = new Container();
  const g = new Graphics();
  const N = 12;
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI + (i / N) * Math.PI;
    const a1 = Math.PI + ((i + 1) / N) * Math.PI;
    g.poly([0, 0, ...arcPts(0, 0, r, r, a0, a1, 3)]).fill(i % 2 ? PINK : 0xfff0f6).stroke({ width: 2, color: GOLD_D, alpha: 0.7 });
  }
  g.poly(arcPts(0, 0, r, r, Math.PI, Math.PI * 2, 24), false).stroke({ width: 8, color: 0xfffdf8 });
  g.poly(arcPts(0, 0, r * 0.45, r * 0.45, Math.PI, Math.PI * 2, 14), false).stroke({ width: 4, color: GOLD });
  g.poly(ell(0, 0, 14, 14, 10)).fill(GOLD).stroke({ width: 3, color: GOLD_D });
  k.addChild(g);
  return k;
}

/** her wig, grown: a column of powdered curls with ribbons, a little ship on top (origin at its base) */
function wigColumn(hgt: number) {
  const k = new Container();
  const g = new Graphics();
  const r = rng(13);
  for (let y = 0; y > -hgt; y -= 46) {
    const w = 120 - Math.min(40, -y / 20);
    for (const dx of [-w * 0.55, 0, w * 0.55]) g.poly(ell(dx + (r() - 0.5) * 12, y - 20, w * 0.42, 30, 14)).fill(0xfbf6ee).stroke({ width: 3, color: 0xc9bca8 });
    if (Math.round(-y / 46) % 4 === 2) g.poly([-w, y - 10, w, y - 24, w, y - 8, -w, y + 6]).fill(r() < 0.5 ? 0x9cc4ec : 0xf7a8c4);
  }
  const ship = new Graphics();
  ship.poly([-70, 0, 70, 0, 54, 24, -50, 24]).fill(0x8a5a2e).stroke({ width: 3, color: INK });
  ship.rect(-3, -110, 6, 110).fill(INK).rect(-40, -100, 6, 100).fill(INK);
  ship.poly([3, -100, 58, -60, 3, -24]).fill(0xfffdf8).stroke({ width: 2, color: INK });
  ship.poly([-34, -90, 6, -60, -34, -24]).fill(0xfffdf8).stroke({ width: 2, color: INK });
  ship.poly([3, -110, 30, -102, 3, -94]).fill(0x9cc4ec);
  ship.position.set(0, -hgt - 6);
  k.addChild(g, ship);
  return { k, ship };
}

interface St {
  cake: Container;
  top: Graphics | null;
  topY: number;
  fans: Container[];
  chand: ReturnType<typeof chandelier>[];
}
const S = stash<St>();
const FLOOR = 800;
const TIER_H = 88;

export const gatoneta: Signature = {
  dark: false,
  frame: 0xf4a9c8,
  tag: 'UNIVERSO DEL PALACIO',
  open(c: SigCtx) {
    const k = new Container();
    k.addChild(hall(W, H, 1, FLOOR));
    const chand = [chandelier(0.95), chandelier(1.1), chandelier(0.95)];
    [340, W / 2, W - 340].forEach((x, i) => {
      chand[i].k.position.set(x, i === 1 ? -110 : -40);
      k.addChild(chand[i].k);
    });
    const fans = [fan(250), fan(250)];
    fans[0].position.set(70, H + 30);
    fans[0].rotation = 0.45;
    fans[1].position.set(W - 70, H + 30);
    fans[1].rotation = -0.45;
    fans[1].scale.x = -1;
    k.addChild(...fans);
    c.back.addChild(k);
    hideDisc(c);
    // behind her: the tower of cakes on its gold stand
    const glow = glowDisc(420, 0xfff6d8, 0.5, 8, 30);
    glow.position.set(W / 2, c.catY);
    const cake = new Container();
    const stand = new Graphics().poly([-420, 0, 420, 0, 380, 24, -380, 24]).fill(GOLD).stroke({ width: 4, color: GOLD_D }).rect(-60, 24, 120, 50).fill(GOLD_D);
    stand.position.set(0, 0);
    cake.addChild(stand);
    cake.position.set(W / 2, FLOOR + 6);
    c.behind.addChild(glow, cake);
    const tiers: Graphics[] = [];
    TIERS.forEach((col, i) => {
      const t = tier(780 - i * 92, TIER_H, col, i + 1);
      t.y = -i * (TIER_H + 4);
      cake.addChild(t);
      tiers.push(t);
    });
    const topY = -TIERS.length * (TIER_H + 4);
    const cherry = new Graphics().poly(ell(0, -26, 26, 26, 16)).fill(0xd8203a).stroke({ width: 4, color: INK }).poly(ell(-8, -34, 7, 6, 8)).fill({ color: 0xffffff, alpha: 0.6 });
    cherry.moveTo(0, -50).quadraticCurveTo(10, -80, 30, -86).stroke({ width: 4, color: 0x3a6a2a });
    cherry.y = topY;
    cake.addChild(cherry);
    const st: St = { cake, top: cherry, topY, fans, chand };
    S.set(c, st);
    if (!c.reduce)
      every(c, 30, (t) => {
        chand.forEach((ch, i) => {
          if (ch.k.destroyed) return;
          ch.k.rotation = Math.sin(t * 1.4 + i) * 0.03;
          ch.flames.alpha = 0.85 + Math.random() * 0.15;
        });
      });
    if (c.short) return;

    // the takeover: chandeliers swing in, fans open, the tiers pop in one by one, macarons rain, the wig grows
    if (!c.reduce) {
      chand.forEach((ch, i) => gsap.from(ch.k, { y: ch.k.y - 320, duration: 0.5, delay: i * 0.07, ease: 'bounce.out' }));
      fans.forEach((f, i) => gsap.from(f, { rotation: (i ? -1 : 1) * 1.9, duration: 0.45, delay: 0.2, ease: 'back.out(1.6)' }));
      tiers.forEach((t) => (t.visible = false));
      cherry.visible = false;
      k.alpha = 0;
      gsap.to(k, { alpha: 1, duration: 0.3 });
    }
    score(c, [
      [0.02, 'tick', 2.4],
      [0.1, 'tick', 2.8],
      [0.18, 'tick', 2.2],
      [0.22, 'whoosh', 1.4],
      [1.4, 'charge', 1.5],
      [1.9, 'levelup', 1.6],
    ]);
    tiers.forEach((t, i) => {
      beat(c, 0.3 + i * 0.14, () => {
        if (t.destroyed) return;
        t.visible = true;
        sfx('pop', 0.9 + i * 0.12);
        if (!c.reduce) gsap.fromTo(t.scale, { x: 1.15, y: 0.2 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
      });
    });
    beat(c, 0.3 + TIERS.length * 0.14, () => {
      if (cherry.destroyed) return;
      cherry.visible = true;
      sfx('nyam', 1.4);
      if (!c.reduce) gsap.from(cherry, { y: topY - 300, duration: 0.35, ease: 'bounce.out' });
    });
    fall(c, c.fg, (i) => macaron(MACARONS[i % MACARONS.length], 0.9 + Math.random() * 0.5), { n: 24, over: 1.4, dur: 1.5, spread: W * 1.05, spin: 3 });
    // the wig grows (behind her, in front of the cake), the ship sails up out of the screen, then it settles
    beat(c, 1.35, () => {
      const wig = wigColumn(900);
      wig.k.position.set(W / 2 + 14, c.catY - 196);
      const m = new Graphics().rect(-200, -2000, 400, 2000).fill(0xffffff);
      m.position.copyFrom(wig.k.position);
      wig.k.mask = m;
      c.behind.addChild(wig.k, m);
      const off = { v: 0 };
      const place = () => {
        if (wig.k.destroyed) return;
        wig.k.y = c.catY - 196 + 900 - off.v;
      };
      if (c.reduce) {
        off.v = 260;
        place();
        later(c, 0.7, () => destroyTree(wig.k));
      } else {
        place();
        gsap.to(off, { v: 900, duration: 0.55, ease: 'power2.out', onUpdate: place });
        gsap.to(wig.ship, { rotation: 0.12, duration: 0.25, yoyo: true, repeat: 3, ease: 'sine.inOut' });
        // …too much: it drops back into her hair in a puff of powder
        gsap.to(off, { v: 0, duration: 0.28, delay: 0.75, ease: 'power2.in', onUpdate: place, onComplete: () => {
          destroyTree(wig.k);
          destroyTree(m);
          puff(c, c.fg, W / 2, c.catY - 210, 0xfffaf0, 8, 50, 70);
          sfx('pop', 0.5);
        } });
      }
      later(c, 0.55, () => floatWord(c, c.fg, W / 2 + 330, 210, '¡OH, LÀ, LÀ!', { fontFamily: F.serif, fontStyle: 'italic', fontWeight: '700', fontSize: 54, fill: ROSE, stroke: { color: 0xffffff, width: 8 } }, 50, 1.1));
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('pop', 0.6);
    sfx('fanfare', 1.25);
    later(c, 0.12, () => sfx('nyam', 0.9));
    later(c, 0.2, () => sfx('coin', 1.3));
    c.shaker.add(0.3);
    const topX = W / 2;
    let topScreenY = 200;
    if (st && !st.cake.destroyed) {
      topScreenY = st.cake.y + st.topY;
      // the cherry flies off; a giant croqueta lands in its place
      const ch = st.top;
      if (ch && !ch.destroyed) {
        ch.visible = true;
        if (c.reduce) ch.visible = false;
        else gsap.to(ch, { x: 420, y: st.topY - 380, rotation: 5, duration: 0.6, ease: 'power2.out', onComplete: () => destroyTree(ch) });
      }
      const kb = croqueta(2.4);
      kb.y = st.topY - 40;
      st.cake.addChild(kb);
      if (!c.reduce) gsap.from(kb, { y: st.topY - 700, duration: 0.45, ease: 'bounce.out' });
      st.fans.forEach((f, i) => {
        if (f.destroyed || c.reduce) return;
        gsap.to(f, { rotation: f.rotation + (i ? 0.25 : -0.25), duration: 0.12, yoyo: true, repeat: 5, ease: 'sine.inOut' });
      });
    }
    // macarons and kibble burst out of the top
    burst(c, c.fg, (i) => (i % 3 ? macaron(MACARONS[i % MACARONS.length], 1.1) : croqueta(1.1)), 22, topX, topScreenY, 760, 1.4);
    // pastel confetti
    fall(c, c.fg, (i) => new Graphics().rect(-8, -5, 16, 10).fill(MACARONS[i % MACARONS.length]), { n: 40, over: 1.2, dur: 1.8, spin: 8 });
    // upright, no soft halo: the halo (a 35 px round stroke) and the first big italic of a session each cost a 33–50 ms frame
    const plaque = glowDisc(330, 0xfff6dc, 0.55, 6, 28);
    plaque.scale.set(1.25, 0.6);
    plaque.position.set(450, 690);
    c.fg.addChild(plaque);
    gsap.to(plaque, { alpha: 0, delay: 2.7, duration: 0.5, onComplete: () => destroyTree(plaque) });
    headline(c, '¡QUE COMAN\nCROQUETAS!', { fontFamily: F.serif, fontWeight: '700', fontSize: 104, fill: 0xf47aa6, lineHeight: 104, stroke: { color: 0x6a3f10, width: 12, join: 'round' } }, {
      dur: 2.7,
      at: [450, 690],
    });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 300;
    const floorY = h * 0.82;
    k.addChild(hall(w, h, 0.4 * u, floorY));
    const glow = glowDisc(Math.min(w, h) * 0.45, 0xfff6d8, 0.5, 6, 28);
    glow.position.set(w / 2, h * 0.52);
    const cake = new Container();
    const s = 0.3 * u;
    cake.addChild(new Graphics().poly([-420 * s, 0, 420 * s, 0, 380 * s, 24 * s, -380 * s, 24 * s]).fill(GOLD).stroke({ width: 2 * u, color: GOLD_D }));
    TIERS.forEach((col, i) => {
      const t = tier(780 - i * 92, TIER_H, col, i + 1);
      t.scale.set(s);
      t.y = -i * (TIER_H + 4) * s;
      cake.addChild(t);
    });
    const cherry = new Graphics().poly(ell(0, -26 * s, 26 * s, 26 * s, 14)).fill(0xd8203a).stroke({ width: 4 * s, color: INK });
    cherry.y = -TIERS.length * (TIER_H + 4) * s;
    cake.addChild(cherry);
    cake.position.set(w / 2, floorY + 2 * u);
    const ch = [chandelier(0.3 * u), chandelier(0.3 * u)];
    ch[0].k.position.set(w / 2 - 120 * u, -12 * u);
    ch[1].k.position.set(w / 2 + 120 * u, -12 * u);
    const floorBits = new Graphics();
    const r = rng(4);
    const macs: Graphics[] = [];
    for (let i = 0; i < 6; i++) {
      const m = macaron(MACARONS[i], 0.32 * u);
      m.position.set(w / 2 + (i < 3 ? -1 : 1) * (70 + r() * 70) * u, floorY + (10 + r() * 30) * u);
      m.rotation = (r() - 0.5) * 0.8;
      macs.push(m);
    }
    k.addChild(glow, cake, floorBits, ...macs, ch[0].k, ch[1].k);
    if (live) {
      const drops: Graphics[] = [];
      for (let i = 0; i < 5; i++) {
        const m = macaron(MACARONS[i], 0.3 * u);
        k.addChild(m);
        drops.push(m);
      }
      cardLoop(k, 30, (t) => {
        ch.forEach((cc, i) => {
          cc.k.rotation = Math.sin(t * 1.3 + i) * 0.04;
          cc.flames.alpha = 0.85 + Math.random() * 0.15;
        });
        drops.forEach((m, i) => {
          const p = ((t * 0.18 + i * 0.21) % 1 + 1) % 1;
          m.position.set(w * (0.08 + ((i * 0.37) % 1) * 0.84), -20 * u + p * (h + 40 * u));
          m.rotation = t * (i % 2 ? 1 : -1) + i;
        });
      });
    }
    return k;
  },
};
