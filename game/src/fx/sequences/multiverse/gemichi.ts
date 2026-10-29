/**
 * Gemichi: the twin universe (a summer-camp twins comedy). The screen splits on a torn diagonal: a sunny lake camp with
 * pines, a canoe and the CAMPAMENTO sign on one side; an elegant townhouse in the rain on the other. Her twin steps in on
 * the camp side, mirrored, and they fence — two lunges, two clashes — then the two halves of a torn photo fly in and join
 * over their heads. Payoff: the twin fills with color too, identical, and swaps over to the other side; ¿Y CUÁL SOY?
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { SilhouetteFilter } from '../../filters';
import { variantSprite } from '../../../panels/collection/art';
import { type Signature, type SigCtx, arrive, burst, cheer, every, later, score, word } from './kit';
import { hideDisc } from './kitA';
import { fadeKill, stash, vgrad } from './kitB';
import { drive, ngon, rnd, streak, twinkle } from './kitD';
import { liveLoop } from '../../../panels/collection/cardArt';

const RED = 0xc8102e;
const PINE = 0x1f5a3a;
const LAKE = 0x2f8fc8;
const BRICK = 0x8a3a2e;
const SPECIES = 'xp_gemichi';

/** the diagonal: x of the split at height y, for a w×h scene centered on cx (top-right → bottom-left) */
const splitX = (cx: number, m: number, y: number, h: number) => cx + m * 0.2 - m * 0.4 * (y / h);

/** a pine: stacked dark triangles on a trunk (origin at its base) */
function pine(g: Graphics, x: number, y: number, s: number, col = PINE) {
  g.rect(x - s * 0.06, y - s * 0.2, s * 0.12, s * 0.2).fill(0x5a3a22);
  for (let i = 0; i < 3; i++) g.poly([x - s * (0.42 - i * 0.1), y - s * (0.16 + i * 0.26), x, y - s * (0.62 + i * 0.26), x + s * (0.42 - i * 0.1), y - s * (0.16 + i * 0.26)]).fill(col);
}

/** the camp side (drawn full; the city covers its half): sky, sun, hills, lake, dock, canoe, cabin, pines, the sign */
function camp(g: Graphics, w: number, h: number, k: number, cx: number) {
  vgrad(g, 0, 0, w, h * 0.62, [0x5ab4f0, 0x9fd8ff, 0xd9f0ff], 12);
  g.poly(ngon(cx - 640 * k, 150 * k, 70 * k, 70 * k, 18)).fill(0xffe27a).poly(ngon(cx - 640 * k, 150 * k, 100 * k, 100 * k, 18)).fill({ color: 0xffe27a, alpha: 0.25 });
  const hz = h * 0.6;
  g.poly([0, hz, w * 0.15, hz - 120 * k, w * 0.4, hz - 60 * k, w * 0.6, hz - 140 * k, w, hz - 40 * k, w, hz, 0, hz]).fill(0x5a9a6a);
  for (let i = 0; i < Math.ceil(w / (70 * k)); i++) pine(g, i * 70 * k + ((i * 37) % 30) * k, hz + 6 * k, (120 + ((i * 53) % 50)) * k, 0x2a6a46);
  g.rect(0, hz, w, h - hz).fill(LAKE);
  for (let i = 0; i < 18; i++) g.poly(streak(((i * 211) % w) + 20 * k, hz + 40 * k + ((i * 67) % 260) * k, ((i * 211) % w) + 90 * k, hz + 40 * k + ((i * 67) % 260) * k, 2 * k, 2 * k)).fill({ color: 0xd9f4ff, alpha: 0.7 });
  // the dock and the red canoe
  g.poly([cx - 900 * k, h * 0.78, cx - 520 * k, h * 0.78, cx - 500 * k, h * 0.8, cx - 900 * k, h * 0.8]).fill(0x9a6a3a);
  for (let i = 0; i < 4; i++) g.rect(cx - 880 * k + i * 120 * k, h * 0.8, 12 * k, 60 * k).fill(0x6a4424);
  g.poly([cx - 700 * k, h * 0.88, cx - 420 * k, h * 0.88, cx - 380 * k, h * 0.86, cx - 460 * k, h * 0.92, cx - 660 * k, h * 0.92, cx - 740 * k, h * 0.86]).fill(RED);
  // the log cabin
  const bx = cx - 760 * k;
  const by = hz;
  g.rect(bx - 140 * k, by - 150 * k, 280 * k, 150 * k).fill(0x8a5a30);
  for (let i = 0; i < 6; i++) g.rect(bx - 140 * k, by - 150 * k + i * 25 * k, 280 * k, 4 * k).fill(0x6a4424);
  g.poly([bx - 170 * k, by - 150 * k, bx, by - 250 * k, bx + 170 * k, by - 150 * k]).fill(0x6a2e22);
  g.rect(bx - 30 * k, by - 90 * k, 60 * k, 90 * k).fill(0x4a2a16).rect(bx + 60 * k, by - 120 * k, 50 * k, 40 * k).fill(0xffe9a8);
  // the camp sign on two posts
  g.rect(cx - 470 * k, h * 0.6 - 170 * k, 12 * k, 170 * k).fill(0x6a4424).rect(cx - 250 * k, h * 0.6 - 170 * k, 12 * k, 170 * k).fill(0x6a4424);
  g.roundRect(cx - 500 * k, h * 0.6 - 200 * k, 290 * k, 70 * k, 10 * k).fill(0xb8844a).stroke({ width: 4 * k, color: 0x5a3a1e });
}

/** the city side: a rainy sky, a brick townhouse with white sash windows and a black door, a lamp, a wet street */
function city(g: Graphics, w: number, h: number, k: number, cx: number, m: number) {
  const pts: number[] = [];
  for (let i = 0; i <= 12; i++) {
    const y = (h * i) / 12;
    pts.push(splitX(cx, m, y, h), y);
  }
  pts.push(w, h, w, 0);
  g.poly(pts).fill(0x5c6878);
  const hz = h * 0.68;
  // the townhouse
  const tx = cx + 560 * k;
  const ty = hz;
  g.rect(tx - 300 * k, ty - 560 * k, 600 * k, 560 * k).fill(BRICK);
  for (let i = 0; i < 18; i++) g.rect(tx - 300 * k, ty - 560 * k + i * 31 * k, 600 * k, 2 * k).fill({ color: 0x6a2a22, alpha: 0.6 });
  g.rect(tx - 320 * k, ty - 580 * k, 640 * k, 24 * k).fill(0xf2eee6);
  for (const [dx, dy] of [
    [-190, -470],
    [0, -470],
    [190, -470],
    [-190, -300],
    [190, -300],
  ] as const) {
    g.rect(tx + (dx - 50) * k, ty + dy * k, 100 * k, 130 * k).fill(0xf2eee6).rect(tx + (dx - 40) * k, ty + (dy + 10) * k, 80 * k, 110 * k).fill(0xffd98a);
    g.rect(tx + (dx - 40) * k, ty + (dy + 62) * k, 80 * k, 6 * k).fill(0xf2eee6).rect(tx + (dx - 3) * k, ty + (dy + 10) * k, 6 * k, 110 * k).fill(0xf2eee6);
  }
  g.rect(tx - 60 * k, ty - 210 * k, 120 * k, 210 * k).fill(0xf2eee6).rect(tx - 46 * k, ty - 196 * k, 92 * k, 196 * k).fill(0x16161c);
  g.poly(ngon(tx + 26 * k, ty - 100 * k, 6 * k, 6 * k, 8)).fill(0xd9b25e);
  g.poly(ngon(tx, ty - 210 * k, 60 * k, 40 * k, 14)).fill(0xf2eee6);
  g.rect(tx - 80 * k, ty - 20 * k, 160 * k, 20 * k).fill(0xb8b4ac);
  // a wide page: more of the street (townhouses in a row)
  for (let x = tx + 700 * k; x < w + 300 * k; x += 640 * k) {
    g.rect(x - 280 * k, ty - 520 * k, 560 * k, 520 * k).fill(x % (1280 * k) < 640 * k ? 0x7a3428 : 0x9a4a36);
    g.rect(x - 300 * k, ty - 540 * k, 600 * k, 22 * k).fill(0xf2eee6);
    for (const dx of [-170, 0, 170]) for (const dy of [-440, -270]) g.rect(x + (dx - 45) * k, ty + dy * k, 90 * k, 120 * k).fill(0xf2eee6).rect(x + (dx - 36) * k, ty + (dy + 9) * k, 72 * k, 102 * k).fill(dx === 0 && dy === -270 ? 0x3a3a44 : 0xffd98a);
    g.rect(x - 50 * k, ty - 190 * k, 100 * k, 190 * k).fill(0xf2eee6).rect(x - 38 * k, ty - 178 * k, 76 * k, 178 * k).fill(0x16161c);
  }
  // the lamp post
  const lx = tx - 420 * k;
  g.rect(lx - 6 * k, ty - 380 * k, 12 * k, 380 * k).fill(0x16161c);
  g.poly([lx - 30 * k, ty - 380 * k, lx + 30 * k, ty - 380 * k, lx + 20 * k, ty - 440 * k, lx - 20 * k, ty - 440 * k]).fill(0xffe9a8).poly(ngon(lx, ty - 410 * k, 90 * k, 90 * k, 14)).fill({ color: 0xffe9a8, alpha: 0.15 });
  // the wet street with reflections
  const st: number[] = [];
  for (let i = 0; i <= 6; i++) {
    const y = hz + ((h - hz) * i) / 6;
    st.push(splitX(cx, m, y, h), y);
  }
  st.push(w, h, w, hz);
  g.poly(st).fill(0x3c4450);
  for (let i = 0; i < 10; i++) g.poly(streak(tx - 260 * k + i * 60 * k, hz + 30 * k, tx - 280 * k + i * 64 * k, h, 3 * k, 8 * k)).fill({ color: 0xffd98a, alpha: 0.12 });
}

/** the torn diagonal: a white zigzag band along the split */
function tear(g: Graphics, h: number, cx: number, m: number, k: number) {
  const L: number[] = [];
  const R: number[] = [];
  const r = rnd(5);
  for (let i = 0; i <= 30; i++) {
    const y = (h * i) / 30;
    const x = splitX(cx, m, y, h);
    L.push(x - (6 + r() * 10) * k, y);
    R.unshift(x + (6 + r() * 10) * k, y);
  }
  g.poly([...L, ...R]).fill(0xfbf8f0);
}

/** rain over the city half (streaks only right of the split) */
function rain(g: Graphics, w: number, h: number, t: number, cx: number, m: number, n: number, k: number) {
  g.clear();
  const r = rnd(9);
  for (let i = 0; i < n; i++) {
    const x0 = r() * w;
    const v = 0.8 + r() * 0.5;
    const y = ((r() * h + t * h * v * 1.4) % (h + 60)) - 60;
    const x = x0 - (y / h) * 30 * k;
    if (x < splitX(cx, m, y, h) + 14 * k) continue;
    g.poly(streak(x, y, x - 8 * k, y + 46 * k, 0.5, 1.6 * k)).fill({ color: 0xcfe0f0, alpha: 0.55 });
  }
}

/** a half of the torn photo (side −1 left, 1 right): a white border, a sepia scene, one parent cat, the torn edge */
function photoHalf(side: number, s: number) {
  const k = new Container();
  const g = new Graphics();
  const pts: number[] = side < 0 ? [-150 * s, -100 * s, 0, -100 * s] : [0, -100 * s, 150 * s, -100 * s, 150 * s, 100 * s, 0, 100 * s];
  if (side < 0) {
    for (let i = 0; i <= 8; i++) pts.push((i % 2 ? 10 : -6) * s, -100 * s + (200 * s * i) / 8);
    pts.push(-150 * s, 100 * s);
  } else {
    const p2: number[] = [0, -100 * s, 150 * s, -100 * s, 150 * s, 100 * s];
    for (let i = 8; i >= 0; i--) p2.push((i % 2 ? 10 : -6) * s, -100 * s + (200 * s * i) / 8);
    pts.length = 0;
    pts.push(...p2);
  }
  g.poly(pts).fill(0xfbf8f0);
  g.rect(side < 0 ? -136 * s : 8 * s, -86 * s, 128 * s, 172 * s).fill(0xc8a878);
  // a parent cat's silhouette: head with ears, shoulders
  const px = side * 64 * s;
  g.poly([px - 22 * s, -20 * s, px - 18 * s, -50 * s, px - 6 * s, -34 * s, px + 6 * s, -34 * s, px + 18 * s, -50 * s, px + 22 * s, -20 * s, px, -4 * s]).fill(0x4a3424);
  g.poly([px - 40 * s, 86 * s, px - 30 * s, 6 * s, px + 30 * s, 6 * s, px + 40 * s, 86 * s]).fill(0x4a3424);
  k.addChild(g);
  return k;
}

/** a fencing foil (blade along +x from the guard at the origin), length L */
function foil(L: number, s: number) {
  const g = new Graphics();
  g.poly(streak(0, 0, L, 0, 3 * s, 1.2 * s)).fill(0xdfe4ea);
  g.poly(ngon(0, 0, 16 * s, 16 * s, 12)).fill(0xb8bec6).stroke({ width: 2 * s, color: C.ink });
  g.rect(-50 * s, -5 * s, 46 * s, 10 * s).fill(0x2a2a30);
  return g;
}

interface St {
  twin: Container | null;
  sil: SilhouetteFilter | null;
}
const S = stash<St>();
const TWIN_X = W / 2 - 470;

export const gemichi: Signature = {
  dark: false,
  frame: RED,
  tag: 'UNIVERSO GEMELO',
  open(c: SigCtx) {
    const k = new Container();
    const g = new Graphics();
    camp(g, W, H, 1, W / 2);
    const cg = new Graphics();
    city(cg, W, H, 1, W / 2, 1080);
    const rg = new Graphics();
    const tg = new Graphics();
    tear(tg, H, W / 2, 1080, 1);
    const sign = txt('CAMPAMENTO', { fontFamily: F.heavy, fontSize: 30, fill: 0xfbf0d8 });
    sign.anchor.set(0.5);
    sign.position.set(W / 2 - 355, H * 0.6 - 165);
    k.addChild(g, sign, cg, rg, tg);
    c.back.addChild(k);
    arrive(c, k, 0.25);
    hideDisc(c, 0.2);
    rain(rg, W, H, 0, W / 2, 1080, 160, 1);
    if (!c.reduce) every(c, 30, (t) => !rg.destroyed && rain(rg, W, H, t, W / 2, 1080, 160, 1));
    // the twin: the same painting, mirrored, a silhouette like her (it fills with color at the payoff)
    let twin: Container | null = null;
    let sil: SilhouetteFilter | null = null;
    try {
      twin = variantSprite(SPECIES, 520, { live: false }).root;
      sil = new SilhouetteFilter(C.ink, c.short ? 0 : 1);
      twin.filters = [sil];
      twin.scale.x *= -1;
      twin.position.set(TWIN_X, c.catY);
      c.behind.addChild(twin);
    } catch {
      twin = null;
    }
    S.set(c, { twin, sil });
    if (c.short) {
      if (twin) {
        twin.scale.set(twin.scale.x * -0.72, twin.scale.y * 0.72);
        twin.position.set(W / 2 + 560, c.catY + 90);
      }
      return;
    }
    if (twin && !c.reduce) {
      twin.alpha = 0;
      gsap.to(twin, { alpha: 1, duration: 0.25, delay: 0.1 });
    }
    // the fencing: the twin lunges twice; the blades clash where they cross
    const clash = (d: number, n: number) =>
      later(c, d, () => {
        sfx('hit', 1.5 + n * 0.2);
        sfx('shield', 1.8);
        const x = W / 2 - 250;
        const y = c.catY - 175;
        const sp = new Graphics().poly(twinkle(0, 0, 70)).fill(0xffffff).poly(twinkle(0, 0, 36, 0.4)).fill(0xffe27a);
        sp.position.set(x, y);
        c.fg.addChild(sp);
        if (!c.reduce) gsap.fromTo(sp.scale, { x: 0.2, y: 0.2 }, { x: 1.2, y: 1.2, duration: 0.14 });
        fadeKill(sp, 0.12, 0.15);
        word(c, x - 60, y - 110, '¡CLANC!', 0xffffff, 70, 0.55);
      });
    if (twin && !c.reduce) {
      const tw = twin;
      for (const d of [0.4, 0.85]) {
        later(c, d, () => {
          if (tw.destroyed) return;
          gsap.to(tw, { x: TWIN_X + 70, duration: 0.12, ease: 'power3.out', yoyo: true, repeat: 1, repeatDelay: 0.1 });
        });
      }
    }
    clash(0.5, 0);
    clash(0.95, 1);
    score(c, [[0.1, 'whoosh', 0.9]]);
    // the torn photo: the two halves fly in and join over their heads
    later(c, 1.25, () => {
      const L = photoHalf(-1, 1.3);
      const R = photoHalf(1, 1.3);
      const y = 190;
      L.position.set(-200, y + 80);
      R.position.set(W + 200, y - 60);
      L.rotation = -0.6;
      R.rotation = 0.5;
      c.fg.addChild(L, R);
      sfx('paper', 1.2);
      const join = () => {
        sfx('gem', 1.6);
        sfx('pop', 1.2);
        const sp = new Graphics().poly(twinkle(0, 0, 90)).fill({ color: 0xffffff, alpha: 0.9 });
        sp.position.set(W / 2, y);
        c.fg.addChild(sp);
        fadeKill(sp, 0.1, 0.2);
      };
      if (c.reduce) {
        L.position.set(W / 2, y);
        R.position.set(W / 2, y);
        L.rotation = R.rotation = -0.04;
        join();
      } else {
        gsap.to(L, { x: W / 2, y, rotation: -0.04, duration: 0.35, ease: 'power2.out' });
        gsap.to(R, { x: W / 2, y, rotation: -0.04, duration: 0.35, ease: 'power2.out', onComplete: join });
      }
      fadeKill(L, 0.95, 0.25);
      fadeKill(R, 0.95, 0.25);
    });
    later(c, 1.65, () => word(c, W / 2 + 470, 330, '¡IGUALITAS!', RED, 92, 0.8));
  },
  payoff(c: SigCtx) {
    const st = S.get(c);
    sfx('fanfare', 1.15);
    c.shaker.add(0.3);
    const tw = st?.twin;
    if (tw && !tw.destroyed && st?.sil && !c.short) {
      const sil = st.sil;
      if (c.reduce) sil.mix = 0;
      else drive(tw, 1, 0, 0.35, (v) => (sil.mix = v));
      // she swaps over: to the other side, the same way round as her, a bit further back
      const sx = Math.abs(tw.scale.x);
      const sy = tw.scale.y;
      const go = () => {
        if (tw.destroyed) return;
        sfx('whoosh', 1.2);
        if (c.reduce) {
          tw.scale.set(sx * 0.72, sy * 0.72);
          tw.position.set(W / 2 + 560, c.catY + 90);
          return;
        }
        gsap.to(tw, { x: W / 2 + 560, y: c.catY + 90, duration: 0.35, ease: 'power2.inOut' });
        gsap.to(tw.scale, { x: sx * 0.72, y: sy * 0.72, duration: 0.35, ease: 'power2.inOut' });
      };
      later(c, 0.5, go);
    }
    cheer(c, '¿Y CUÁL SOY?', 0xffffff, 140, 2.2);
    // little camp pennants
    burst(c, c.fg, (i) => new Graphics().poly([0, -14, 34, 0, 0, 14]).fill(i % 2 ? RED : 0xffffff).stroke({ width: 2, color: C.ink }), 18, W / 2, c.catY - 120, 760, 1.3);
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const s = m / 1080;
    const g = new Graphics();
    camp(g, w, h, s, w / 2);
    const cg = new Graphics();
    city(cg, w, h, s, w / 2, m);
    const rg = new Graphics();
    const tg = new Graphics();
    tear(tg, h, w / 2, m, s);
    // two crossed foils behind the heart, and the joined photo above
    const foils = new Container();
    const fL = foil(m * 0.62, s * 1.4);
    fL.position.set(w / 2 - m * 0.28, h * 0.78);
    fL.rotation = -0.95;
    const fR = foil(m * 0.62, s * 1.4);
    fR.position.set(w / 2 + m * 0.28, h * 0.78);
    fR.rotation = Math.PI + 0.95;
    foils.addChild(fL, fR);
    const ph = new Container();
    ph.addChild(photoHalf(-1, s * 1.1), photoHalf(1, s * 1.1));
    ph.position.set(w / 2, h * 0.14);
    ph.rotation = -0.04;
    k.addChild(g, cg, rg, tg, foils, ph);
    const n = Math.round(Math.min(220, (w / m) * 70));
    rain(rg, w, h, 0.3, w / 2, m, n, s * 1.4);
    if (live) liveLoop(k, (t) => rain(rg, w, h, t, w / 2, m, n, s * 1.4));
    return k;
  },
};

