/**
 * Persa Falsa: the high-society universe (the comedy where two agents go undercover as rich blonde socialites). A
 * members-only beach club on a summer afternoon — striped cabanas, a hedge, the sea with yachts, bunting and a banner
 * «LAS PERSAS · CLUB DE PLAYA» — and a pink carpet runway between velvet ropes, packed with paparazzi cats. Soft
 * flashes pop (¡CLIC!), her sunglasses glint, the blonde wig bounces (¡BOING!)… and a clump of her white «persian»
 * disguise and a fake ear drop off the black silhouette (¡UPS!). A paparazzo squints: «¿ESA ES… PERSA?» — «¡OBVIO!».
 * Payoff: a storm of flashes, pearls and pink hearts; ¡TOTALMENTE PERSA! …ignoren la oreja.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, arrive, burst, cheer, every, fall, flashOf, later, score, word } from './kit';
import { hideDisc } from './kitA';
import { fadeKill, stash, vgrad } from './kitB';
import { beat, pay, say } from './kitC';
import { aside, ngon, onCat, rnd, streak, twinkle } from './kitD';
import { catenary, heartPts, held, strip } from './kitH';
import { liveLoop } from '../../../panels/collection/cardArt';

const PINK = 0xf7a1c4;
const PINK_D = 0xe0779f;
const ROSE = 0xd6336c;
const GOLD = 0xe6c34a;
const SEA = 0x4fc1cf;
const SEA_D = 0x2a96b2;
const CREAM = 0xfff8ee;
const HEDGE = 0x3f7f4a;
const PAP = 0x3a3f4a;
const PAP_D = 0x262a33;

/** the club (one Graphics), sized w×h with the horizon at hz; k = scale */
function club(g: Graphics, w: number, h: number, hz: number, k: number, cx: number) {
  vgrad(g, 0, 0, w, hz, [0xa9def2, 0xcdeef7, 0xfde8d6], 12);
  // a lazy summer sun and two clouds
  g.poly(ngon(cx + 560 * k, hz - 250 * k, 70 * k, 70 * k, 20)).fill({ color: 0xfff2c4, alpha: 0.9 });
  for (const [dx, dy, cs] of [
    [-620, -300, 1],
    [220, -340, 0.8],
  ] as const) {
    for (const [px, py, pr] of [
      [-60, 0, 46],
      [0, -20, 60],
      [60, 0, 44],
    ])
      g.poly(ngon(cx + (dx + px * cs) * k, hz + (dy + py * cs) * k, pr * k * cs, pr * k * cs * 0.75, 12)).fill({ color: 0xffffff, alpha: 0.85 });
  }
  // the sea, bands to the horizon, two yachts
  g.rect(0, hz - 70 * k, w, 70 * k).fill(SEA);
  for (let i = 0; i < 5; i++) g.rect(0, hz - 70 * k + i * 14 * k, w, 3 * k).fill({ color: 0xffffff, alpha: 0.25 });
  for (const [x, s] of [
    [cx - 360 * k, 1],
    [cx + 380 * k, 0.7],
  ] as const) {
    g.poly([x - 50 * k * s, hz - 46 * k, x + 50 * k * s, hz - 46 * k, x + 36 * k * s, hz - 34 * k, x - 40 * k * s, hz - 34 * k]).fill(CREAM);
    g.poly([x, hz - 48 * k, x, hz - 130 * k * s, x + 40 * k * s, hz - 52 * k]).fill(0xffffff);
    g.poly([x - 4 * k, hz - 48 * k, x - 4 * k, hz - 110 * k * s, x - 34 * k * s, hz - 52 * k]).fill({ color: 0xffffff, alpha: 0.8 });
  }
  // the lawn and the hedge
  g.rect(0, hz, w, h - hz).fill(0x9ccf7a);
  for (let x = -20 * k; x < w + 40 * k; x += 70 * k) g.poly(ngon(x, hz + 6 * k, 52 * k, 34 * k, 10)).fill(HEDGE);
  g.rect(0, hz + 6 * k, w, 26 * k).fill(HEDGE);
  // the boardwalk under the carpet
  g.poly([cx - 140 * k, hz + 34 * k, cx + 140 * k, hz + 34 * k, cx + 760 * k, h, cx - 760 * k, h]).fill(0xe8d6b8);
  for (let i = 1; i < 9; i++) {
    const u = Math.pow(i / 9, 1.6);
    const y = hz + 34 * k + (h - hz - 34 * k) * u;
    const hw = 140 * k + (620 * k) * u;
    g.rect(cx - hw, y, hw * 2, 2 * k).fill({ color: 0xb89a74, alpha: 0.6 });
  }
  // the pink carpet: a long trapezoid to the horizon with gold edges
  g.poly([cx - 60 * k, hz + 34 * k, cx + 60 * k, hz + 34 * k, cx + 470 * k, h, cx - 470 * k, h]).fill(PINK);
  g.poly([cx - 60 * k, hz + 34 * k, cx - 50 * k, hz + 34 * k, cx - 430 * k, h, cx - 470 * k, h]).fill(GOLD);
  g.poly([cx + 50 * k, hz + 34 * k, cx + 60 * k, hz + 34 * k, cx + 470 * k, h, cx + 430 * k, h]).fill(GOLD);
  g.poly([cx - 30 * k, hz + 34 * k, cx + 30 * k, hz + 34 * k, cx + 200 * k, h, cx - 200 * k, h]).fill({ color: 0xffffff, alpha: 0.12 });
  // the cabanas on each side: white tents, pink-and-white striped valances, dark doorways, lanterns
  for (const sd of [-1, 1]) {
    for (let j = 0; j < 2; j++) {
      const tx = cx + sd * (820 + j * 330) * k;
      const tw = 300 * k;
      const ty = hz - 210 * k + j * 30 * k;
      const tb = hz + 150 * k + j * 60 * k;
      g.poly([tx - tw / 2, ty + 60 * k, tx, ty - 40 * k, tx + tw / 2, ty + 60 * k]).fill(CREAM);
      g.rect(tx - tw / 2, ty + 60 * k, tw, tb - ty - 60 * k).fill(CREAM);
      g.poly([tx - tw * 0.3, tb, tx - tw * 0.3, ty + 120 * k, tx, ty + 96 * k, tx + tw * 0.3, ty + 120 * k, tx + tw * 0.3, tb]).fill(0x6a4a5a);
      for (let i = 0; i < 8; i++) {
        const x0 = tx - tw / 2 + (i * tw) / 8;
        g.poly([x0, ty + 60 * k, x0 + tw / 8, ty + 60 * k, x0 + tw / 8, ty + 92 * k, x0 + tw / 16, ty + 104 * k, x0, ty + 92 * k]).fill(i % 2 ? PINK : 0xffffff);
      }
      g.poly(ngon(tx, ty - 50 * k, 10 * k, 10 * k, 8)).fill(GOLD);
    }
  }
  // the banner across the top, with bunting
  const bunt = catenary(cx - 700 * k, 40 * k, cx + 700 * k, 40 * k, 70 * k, 20);
  g.poly(strip(bunt, 1.5 * k)).fill(0x8a6a5a);
  for (let i = 1; i < 20; i++) {
    const x = bunt[i * 2];
    const y = bunt[i * 2 + 1];
    g.poly([x - 14 * k, y, x + 14 * k, y, x, y + 30 * k]).fill(i % 2 ? PINK : 0xffffff);
  }
}

/** a paparazzo cat from the waist up, facing `side` (-1 left, +1 right), camera to the eye; returns the flash point */
function pap(g: Graphics, x: number, y: number, s: number, side: number): [number, number] {
  const d = side;
  g.poly([x - 70 * s, y, x - 56 * s, y - 120 * s, x + 56 * s, y - 120 * s, x + 70 * s, y]).fill(PAP);
  g.poly(ngon(x, y - 160 * s, 50 * s, 46 * s, 12)).fill(PAP);
  g.poly([x - 44 * s, y - 180 * s, x - 34 * s, y - 230 * s, x - 10 * s, y - 196 * s]).fill(PAP);
  g.poly([x + 44 * s, y - 180 * s, x + 34 * s, y - 230 * s, x + 10 * s, y - 196 * s]).fill(PAP);
  // the press hat (a fedora with a card in the band) on every other one
  if ((Math.round(x) >> 3) % 2) {
    g.poly(ngon(x, y - 196 * s, 74 * s, 14 * s, 12)).fill(PAP_D);
    g.poly([x - 40 * s, y - 198 * s, x - 34 * s, y - 248 * s, x + 34 * s, y - 248 * s, x + 40 * s, y - 198 * s]).fill(PAP_D);
    g.rect(x - 40 * s, y - 214 * s, 80 * s, 10 * s).fill(0x6a6f7a);
    g.rect(x + 8 * s, y - 230 * s, 22 * s, 18 * s).fill(0xf2f2f2);
  }
  // the camera: body, lens toward the runway, the flash on top
  const cx = x + d * 40 * s;
  g.rect(cx - 36 * s, y - 182 * s, 72 * s, 48 * s).fill(PAP_D);
  g.poly(ngon(cx + d * 40 * s, y - 158 * s, 20 * s, 20 * s, 10)).fill(0x14161c);
  g.poly(ngon(cx + d * 40 * s, y - 158 * s, 9 * s, 9 * s, 8)).fill(0x6a7a9a);
  g.rect(cx - 16 * s, y - 210 * s, 32 * s, 26 * s).fill(0xd9dde2);
  // the arm holding it
  g.poly([x - d * 50 * s, y - 96 * s, cx - d * 10 * s, y - 140 * s, cx, y - 126 * s, x - d * 40 * s, y - 80 * s]).fill(PAP_D);
  return [cx, y - 198 * s];
}

/** velvet ropes on gold posts along the carpet edges (both sides) */
function ropes(g: Graphics, hz: number, h: number, k: number, cx: number) {
  for (const sd of [-1, 1]) {
    const posts: [number, number, number][] = [];
    for (const u of [0.12, 0.32, 0.58, 0.92]) {
      const y = hz + 34 * k + (h - hz - 34 * k) * u;
      const x = cx + sd * (70 * k + 450 * k * u + 30 * k);
      const ph = (30 + 110 * u) * k;
      posts.push([x, y, ph]);
    }
    for (let i = 0; i < posts.length - 1; i++) {
      const [x0, y0, h0] = posts[i];
      const [x1, y1, h1] = posts[i + 1];
      g.poly(strip(catenary(x0, y0 - h0, x1, y1 - h1, (h0 + h1) * 0.25, 10), Math.max(2, h1 * 0.06))).fill(ROSE);
    }
    for (const [x, y, ph] of posts) {
      g.poly(streak(x, y, x, y - ph, ph * 0.05, ph * 0.04)).fill(GOLD);
      g.poly(ngon(x, y - ph, ph * 0.09, ph * 0.09, 8)).fill(0xf6dc7a);
      g.poly(ngon(x, y, ph * 0.16, ph * 0.05, 10)).fill(0xb8943a);
    }
  }
}

/** the paparazzi on both sides (one Graphics); returns their flash points */
function paparazzi(g: Graphics, hz: number, h: number, k: number, cx: number, w: number) {
  const pts: [number, number][] = [];
  const r = rnd(41);
  for (const sd of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const u = 0.2 + i * 0.26;
      const y = hz + 90 * k + (h - hz) * u * 0.9;
      const x = cx + sd * (230 * k + 520 * k * u + r() * 40 * k);
      if (x < -60 || x > w + 60) continue;
      pts.push(pap(g, x, y, (0.55 + u * 0.75) * k, -sd));
    }
  }
  return pts;
}

/** a flash going off: a white star and a soft glow (smaller, dimmer without flashes) */
function flashPop(layer: Container, x: number, y: number, s: number, strong: boolean) {
  const g = new Graphics();
  g.poly(ngon(0, 0, 90 * s, 90 * s, 14)).fill({ color: 0xffffff, alpha: strong ? 0.35 : 0.15 });
  g.poly(twinkle(0, 0, 70 * s, 0.18)).fill({ color: 0xffffff, alpha: strong ? 1 : 0.6 });
  g.poly(ngon(0, 0, 18 * s, 18 * s, 10)).fill(0xffffff);
  g.position.set(x, y);
  layer.addChild(g);
  gsap.fromTo(g.scale, { x: 0.3, y: 0.3 }, { x: 1, y: 1, duration: 0.08 });
  fadeKill(g, 0.08, 0.22);
}

/** a white fluffy clump of the disguise (a jagged furry blob) */
function clump(s: number) {
  const g = new Graphics();
  const p: number[] = [];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const rr = (i % 2 ? 0.72 : 1) * 46 * s;
    p.push(Math.cos(a) * rr * 1.2, Math.sin(a) * rr);
  }
  g.poly(p).fill(CREAM).stroke({ width: 3 * s, color: 0xcfc4b4, join: 'round' });
  // the stitched seam
  for (let i = 0; i < 5; i++) g.rect(-36 * s + i * 16 * s, -4 * s, 9 * s, 3 * s).fill(0xb8a48a);
  return g;
}

/** the fake persian ear (white, pink inside) */
function fakeEar(s: number) {
  return new Graphics().poly([-30 * s, 20 * s, 0, -40 * s, 30 * s, 20 * s]).fill(CREAM).stroke({ width: 3 * s, color: 0xcfc4b4, join: 'round' }).poly([-16 * s, 14 * s, 0, -20 * s, 16 * s, 14 * s]).fill(PINK);
}

/** a pearl (a white disc with a shine) or a pink heart */
function bling(i: number) {
  const g = new Graphics();
  if (i % 3 === 0) g.poly(heartPts(0, 0, 18, 8)).fill(i % 2 ? PINK : ROSE).stroke({ width: 2, color: C.ink });
  else {
    g.poly(ngon(0, 0, 12, 12, 10)).fill(0xfbf6ee).stroke({ width: 2, color: 0xb8aa9a });
    g.poly(ngon(-4, -4, 4, 3, 6)).fill(0xffffff);
  }
  return g;
}

interface St {
  flashes: [number, number][];
  fx: Container;
}
const S = stash<St>();
const HZ = 430;

export const persafalsa: Signature = {
  dark: false,
  frame: PINK,
  tag: 'UNIVERSO DE LA ALTA SOCIEDAD',
  open(c: SigCtx) {
    const k = new Container();
    const g = new Graphics();
    club(g, W, H, HZ, 1, W / 2);
    const rg = new Graphics();
    ropes(rg, HZ, H, 1, W / 2);
    const pg = new Graphics();
    const flashes = paparazzi(pg, HZ, H, 1, W / 2, W);
    const banner = new Container();
    const bt = txt('LAS PERSAS · CLUB DE PLAYA', { fontFamily: F.serif, fontStyle: 'italic', fontWeight: '700', fontSize: 40, fill: ROSE, letterSpacing: 3 });
    bt.anchor.set(0.5);
    const bb = new Graphics().roundRect(-bt.width / 2 - 34, -34, bt.width + 68, 68, 10).fill(CREAM).stroke({ width: 4, color: GOLD });
    banner.addChild(bb, bt);
    banner.position.set(W / 2, 128);
    const fx = new Container();
    k.addChild(g, rg, pg, banner, fx);
    c.back.addChild(k);
    arrive(c, k, 0.25);
    hideDisc(c, 0.2);
    // the sea sparkles while the card is up
    const sp = new Graphics();
    k.addChildAt(sp, 1);
    every(c, c.reduce ? 1 : 12, (t) => {
      if (sp.destroyed) return;
      sp.clear();
      const r = rnd(c.reduce ? 1 : Math.floor(t * 6));
      for (let i = 0; i < 14; i++) sp.poly(twinkle(r() * W, HZ - 64 + r() * 60, 6 + r() * 6)).fill({ color: 0xffffff, alpha: 0.8 });
    });
    S.set(c, { flashes, fx });
    if (c.short) return;

    // the paparazzi go off: soft pops all along the ropes
    const pops = c.reduce ? 4 : 14;
    for (let i = 0; i < pops; i++) {
      beat(c, 0.12 + i * (1.2 / pops) + Math.random() * 0.05, () => {
        const [x, y] = flashes[Math.floor(Math.random() * flashes.length)];
        flashPop(fx, x, y, 0.7 + Math.random() * 0.5, c.flashes);
        sfx('click', 2.2 + Math.random() * 0.6);
      });
    }
    score(c, [
      [0.05, 'whoosh', 1.2],
      [0.3, 'zap', 1.8],
    ]);
    const clic = txt('¡CLIC!', { fontFamily: F.comic, fontSize: 64, fill: 0xffffff, stroke: { color: C.ink, width: 10, join: 'round' } });
    clic.anchor.set(0.5);
    held(c, c.fg, clic, 360, 520, 0.25, { hold: 0.55, rot: -0.12 });
    const clic2 = txt('¡CLIC!', { fontFamily: F.comic, fontSize: 54, fill: 0xffffff, stroke: { color: C.ink, width: 9, join: 'round' } });
    clic2.anchor.set(0.5);
    held(c, c.fg, clic2, W - 380, 600, 0.5, { hold: 0.5, rot: 0.1 });
    // her sunglasses glint
    beat(c, 0.6, () => {
      sfx('gem', 2.1);
      const [x, y] = onCat(c, 0.61, 0.13);
      const gl = new Graphics().poly(twinkle(0, 0, 50)).fill(0xffffff);
      gl.position.set(x, y);
      c.fg.addChild(gl);
      if (!c.reduce) gsap.fromTo(gl.scale, { x: 0.1, y: 0.1 }, { x: 1, y: 1, duration: 0.12, yoyo: true, repeat: 1 });
      fadeKill(gl, 0.25, 0.1);
    });
    // the wig bounces: motion arcs around the hair
    beat(c, 0.85, () => {
      sfx('pop', 0.8);
      const g2 = new Graphics();
      for (const [fx2, fy2, a] of [
        [0.36, 0.2, -2.4],
        [0.82, 0.24, -0.7],
      ] as const) {
        const [x, y] = onCat(c, fx2, fy2);
        for (let i = 0; i < 3; i++) g2.poly(streak(x + Math.cos(a) * (20 + i * 26), y + Math.sin(a) * (20 + i * 26), x + Math.cos(a) * (60 + i * 26), y + Math.sin(a) * (60 + i * 26), 4, 1.5)).fill(C.ink);
      }
      c.fg.addChild(g2);
      fadeKill(g2, 0.35, 0.15);
      word(c, ...onCat(c, 0.86, 0.06), '¡BOING!', 0xfff0a8, 70, 0.6);
    });
    // a clump of the white disguise and the fake ear drop off: ¡UPS!
    beat(c, 1.2, () => {
      sfx('pop', 1.3);
      sfx('whoosh', 0.7);
      const cl = clump(1.1);
      const ear = fakeEar(1);
      const [x0, y0] = onCat(c, 0.5, 0.62);
      const [x1, y1] = onCat(c, 0.44, 0.1);
      cl.position.set(x0, y0);
      ear.position.set(x1, y1);
      ear.rotation = -0.3;
      c.fg.addChild(cl, ear);
      if (c.reduce) {
        cl.y = y0 + 220;
        ear.y = y1 + 380;
      } else {
        gsap.to(cl, { y: H - 150, x: x0 - 90, rotation: -2.2, duration: 0.6, ease: 'power2.in' });
        gsap.to(ear, { y: H - 130, x: x1 - 200, rotation: 3.4, duration: 0.7, ease: 'power2.in' });
      }
      fadeKill(cl, 0.85, 0.3);
      fadeKill(ear, 0.95, 0.3);
      word(c, ...onCat(c, 0.12, 0.42), '¡UPS!', PINK, 96, 0.7);
    });
    // a paparazzo squints; she answers
    beat(c, 1.55, () => {
      sfx('tick', 1.4);
      say(c, c.fg, 360, 300, '¿ESA ES… PERSA?', 0.7, { size: 40, tail: 'right' });
    });
    beat(c, 1.9, () => {
      sfx('meow', 1.3);
      say(c, c.fg, W / 2 + 330, 250, '¡OBVIO!', 0.5, { size: 50, tail: 'left', fill: PINK });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('fanfare', 1.15);
    sfx('zap', 1.6);
    c.shaker.add(0.3);
    flashOf(c, 0xffffff, 0.5, 0.3);
    // a storm of flashes along the ropes
    if (st) {
      const n = c.reduce ? 4 : 16;
      for (let i = 0; i < n; i++)
        later(c, i * 0.06, () => {
          if (st.fx.destroyed) return;
          const [x, y] = st.flashes[i % st.flashes.length];
          flashPop(st.fx, x, y, 1 + Math.random() * 0.4, c.flashes);
          if (i % 3 === 0) sfx('click', 2.4);
        });
    }
    burst(c, c.fg, (i) => bling(i), 26, W / 2, c.catY - 80, 860, 1.4);
    fall(c, c.fg, (i) => bling(i + 1), { n: 16, over: 1.4, dur: 1.6, spin: 3 });
    cheer(c, '¡TOTALMENTE PERSA!', ROSE, 130, 2.0);
    aside(c, '…ignoren la oreja.', CREAM, { delay: 0.6, dur: 2.2 });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const m = Math.min(w, h);
    const s = m / 1080;
    const hz = h * 0.42;
    const g = new Graphics();
    club(g, w, h, hz, s * 1.05, w / 2);
    const rg = new Graphics();
    ropes(rg, hz, h, s * 1.05, w / 2);
    const pg = new Graphics();
    const flashes = paparazzi(pg, hz, h, s * 1.05, w / 2, w);
    // a wide page: more cabanas and palms down the beach
    const deco = new Graphics();
    for (let x = w / 2 + m * 1.55; x < w + m * 0.2; x += m * 0.62) {
      deco.poly(streak(x, hz + m * 0.16, x - m * 0.04, hz - m * 0.3, m * 0.018, m * 0.012)).fill(0x8a6a4a);
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i - 2.5) * 0.5;
        deco.poly(streak(x - m * 0.04, hz - m * 0.3, x - m * 0.04 + Math.cos(a) * m * 0.16, hz - m * 0.3 + Math.sin(a) * m * 0.08 + m * 0.06, m * 0.025, m * 0.004)).fill(HEDGE);
      }
    }
    for (let x = w / 2 - m * 1.55; x > -m * 0.2; x -= m * 0.62) {
      deco.poly(streak(x, hz + m * 0.16, x + m * 0.04, hz - m * 0.3, m * 0.018, m * 0.012)).fill(0x8a6a4a);
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i - 2.5) * 0.5;
        deco.poly(streak(x + m * 0.04, hz - m * 0.3, x + m * 0.04 + Math.cos(a) * m * 0.16, hz - m * 0.3 + Math.sin(a) * m * 0.08 + m * 0.06, m * 0.025, m * 0.004)).fill(HEDGE);
      }
    }
    const fx = new Graphics();
    k.addChild(g, deco, rg, pg, fx);
    const pops = (t: number) => {
      fx.clear();
      const r = rnd(Math.floor(t * 5) + 3);
      for (let i = 0; i < 3; i++) {
        const [x, y] = flashes[Math.floor(r() * flashes.length)];
        const q = 1 - ((t * 5) % 1);
        fx.poly(ngon(x, y, 70 * s * q, 70 * s * q, 12)).fill({ color: 0xffffff, alpha: 0.35 * q });
        fx.poly(twinkle(x, y, 60 * s * (0.4 + q * 0.6), 0.18)).fill({ color: 0xffffff, alpha: q });
      }
      const r2 = rnd(Math.floor(t * 4) + 99);
      for (let i = 0; i < 10; i++) fx.poly(twinkle(r2() * w, hz - 60 * s + r2() * 56 * s, (5 + r2() * 6) * s)).fill({ color: 0xffffff, alpha: 0.8 });
    };
    pops(0.1);
    if (live) liveLoop(k, (t) => pops(t));
    return k;
  },
};

