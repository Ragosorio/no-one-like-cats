/**
 * Rick Michez: the portals universe (a mad-scientist cartoon). A garage full of junk — cinder-block walls, a pegboard of
 * tools, a workbench crowded with flasks of green goo, shelves of boxes, a flickering fluorescent tube, the roll-up door,
 * a flying car bolted together from scrap. A green swirl rips open behind him, then two more; through them peek other
 * versions of his own silhouette — one in a top hat, one with a huge moustache, one that is simply a cube — each with
 * something to say about the others. Green sparks, a synth whine, ¡ZAP!, and they get sucked back.
 * Payoff: every portal bursts open, the versions pop out at once and a hail of little cube-cats rains through;
 * ¡OTRO UNIVERSO, MISMO GATO! (…y todos se creen el original.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { sfx } from '../../../core/audio';
import { SilhouetteFilter } from '../../filters';
import { variantSprite } from '../../../panels/collection/art';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, burst, every, flashOf, later, score } from './kit';
import { hideDisc } from './kitA';
import { stash } from './kitB';
import { beat, pay } from './kitC';
import { balloon } from './kitD';
import { asideText, bar, glow, oval, payline, pop, pre, rand, rrect, star, sweep, title } from './kitF';
import { liveLoop } from '../../../panels/collection/cardArt';

const SP = 'xp_rick';
const LIME = 0x97ce4c;
const GOO = 0x5fd02a;
const DEEP = 0x1e6a14;
const BLOCK = 0x5a5f66;
const BLOCK2 = 0x4c5157;
const CONC = 0x6a6660;

/** a swirling portal at (x, y): dark-green body, three lime spiral arms turning with t, splats around the rim */
function portal(g: Graphics, x: number, y: number, rx: number, ry: number, t: number, open: number) {
  if (open <= 0.01) return;
  const k = open;
  const RX = rx * k;
  const RY = ry * k;
  // splats on the rim
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + Math.sin(t * 3 + i) * 0.1;
    const d = 1.02 + 0.06 * Math.sin(t * 5 + i * 1.7);
    g.poly(oval(x + Math.cos(a) * RX * d, y + Math.sin(a) * RY * d, RX * 0.13, RY * 0.1, 8, a));
  }
  g.fill(LIME);
  g.poly(oval(x, y, RX * 1.03, RY * 1.03, 30)).fill(LIME);
  g.poly(oval(x, y, RX, RY, 30)).fill(DEEP);
  for (let j = 0; j < 3; j++) {
    const outer: number[] = [];
    const inner: number[] = [];
    for (let i = 0; i <= 18; i++) {
      const r = 0.08 + (i / 18) * 0.9;
      const a = -t * 2.4 + (j * Math.PI * 2) / 3 + r * 4.4;
      const w = 0.09 * (1 - r * 0.4);
      outer.push(x + Math.cos(a) * RX * r, y + Math.sin(a) * RY * r);
      inner.push(x + Math.cos(a + w * 4) * RX * (r - w * 0.6), y + Math.sin(a + w * 4) * RY * (r - w * 0.6));
    }
    // a chain of quads (one fill): a long spiral band as ONE polygon trips the triangulator
    for (let i = 0; i < 18; i++) g.poly([outer[i * 2], outer[i * 2 + 1], outer[i * 2 + 2], outer[i * 2 + 3], inner[i * 2 + 2], inner[i * 2 + 3], inner[i * 2], inner[i * 2 + 1]]);
    g.fill(j === 0 ? 0xc8f07a : GOO);
  }
  g.poly(oval(x, y, RX * 0.16, RY * 0.16, 14)).fill(0xeaffc8);
}

/** the garage (w×h, u vs 1920×1080) */
function garage(w: number, h: number, u: number, cx: number) {
  const g = new Graphics().rect(0, 0, w, h).fill(BLOCK);
  // cinder blocks
  const bk = new Graphics();
  for (let y = 0, row = 0; y < h * 0.74; y += 56 * u, row++) {
    bk.rect(0, y, w, 4 * u);
    for (let x = (row % 2 ? 60 * u : 0) + (cx % (120 * u)); x < w; x += 120 * u) bk.rect(x, y, 4 * u, 56 * u);
  }
  bk.fill(BLOCK2);
  const floorY = h * 0.74;
  g.rect(0, floorY, w, h - floorY).fill(CONC);
  const r = rand(5);
  for (let i = 0; i < Math.max(3, Math.round(w / (400 * u))); i++) g.poly(oval(r() * w, floorY + (0.3 + r() * 0.6) * (h - floorY), (60 + r() * 80) * u, (14 + r() * 10) * u, 12)).fill({ color: 0x3a3632, alpha: 0.5 });
  g.rect(0, floorY - 6 * u, w, 8 * u).fill(0x3a3e44);
  const props = new Graphics();
  // the pegboard of tools (left, high)
  const px = cx - 640 * u;
  props.rect(px - 200 * u, 120 * u, 400 * u, 260 * u).fill(0xb8915a).stroke({ width: 6 * u, color: 0x6a4a2a });
  for (let yy = 140 * u; yy < 370 * u; yy += 26 * u) for (let xx = px - 184 * u; xx < px + 190 * u; xx += 26 * u) props.rect(xx, yy, 4 * u, 4 * u);
  props.fill(0x7a5a32);
  props.poly(bar(px - 140 * u, 150 * u, px - 140 * u, 320 * u, 8 * u)).poly(oval(px - 140 * u, 150 * u, 22 * u, 16 * u, 8)).fill(0x9aa0a8);
  props.poly(bar(px - 60 * u, 160 * u, px - 60 * u, 300 * u, 6 * u)).fill(0x6a4a2a).poly(rrect(px - 90 * u, 150 * u, 60 * u, 24 * u, 4 * u, 1)).fill(0x9aa0a8);
  props.poly([px + 10 * u, 170 * u, px + 150 * u, 170 * u, px + 150 * u, 200 * u, px + 40 * u, 330 * u, px + 10 * u, 330 * u]).fill(0x9aa0a8);
  props.poly(oval(px + 120 * u, 290 * u, 34 * u, 34 * u, 14)).stroke({ width: 8 * u, color: 0xd04a2a });
  // the workbench with flasks (left, low)
  const bx = cx - 600 * u;
  const by = floorY - 190 * u;
  props.rect(bx - 300 * u, by, 600 * u, 26 * u).fill(0x7a5a32).rect(bx - 290 * u, by + 26 * u, 24 * u, 164 * u).rect(bx + 266 * u, by + 26 * u, 24 * u, 164 * u).fill(0x5a3e22);
  props.rect(bx - 260 * u, by + 110 * u, 520 * u, 14 * u).fill(0x5a3e22);
  const goo = new Graphics();
  for (let i = 0; i < 5; i++) {
    const fx = bx - 230 * u + i * 110 * u;
    const fh = (60 + (i % 3) * 26) * u;
    props.poly([fx - 10 * u, by - fh, fx + 10 * u, by - fh, fx + 10 * u, by - fh * 0.55, fx + 30 * u, by, fx - 30 * u, by, fx - 10 * u, by - fh * 0.55]).fill({ color: 0xd8f0f0, alpha: 0.55 }).stroke({ width: 3 * u, color: 0x2a3a3a });
    goo.poly([fx - 22 * u, by - fh * 0.3, fx + 22 * u, by - fh * 0.3, fx + 28 * u, by - 3 * u, fx - 28 * u, by - 3 * u]);
  }
  goo.fill(GOO);
  props.poly(rrect(bx + 120 * u, by - 110 * u, 130 * u, 110 * u, 10 * u, 2)).fill(0x3a3e44).poly(rrect(bx + 134 * u, by - 96 * u, 102 * u, 64 * u, 6 * u, 2)).fill(0x1a2a1a);
  // shelves with boxes (right, high) and the roll-up door (right)
  const sx = cx + 640 * u;
  for (let i = 0; i < 2; i++) {
    props.rect(sx - 220 * u, 200 * u + i * 150 * u, 440 * u, 12 * u).fill(0x3a3e44);
    for (let j = 0; j < 4; j++) props.rect(sx - 200 * u + j * 104 * u, 200 * u + i * 150 * u - (70 + ((i + j) % 2) * 26) * u, 86 * u, (70 + ((i + j) % 2) * 26) * u).fill(j % 2 ? 0xb8915a : 0xa07a48).stroke({ width: 3 * u, color: 0x5a3e22 });
  }
  // the flying car bolted from scrap (right, low)
  const car = new Graphics();
  const vx = cx + 640 * u;
  const vy = floorY - 40 * u;
  car.poly([vx - 260 * u, vy - 40 * u, vx - 200 * u, vy - 120 * u, vx + 160 * u, vy - 120 * u, vx + 260 * u, vy - 50 * u, vx + 250 * u, vy, vx - 250 * u, vy]).fill(0x9aa0a8).stroke({ width: 5 * u, color: 0x2a2e34, join: 'round' });
  car.poly([vx - 160 * u, vy - 120 * u, vx - 110 * u, vy - 200 * u, vx + 80 * u, vy - 200 * u, vx + 130 * u, vy - 120 * u]).fill({ color: 0xc8f0ff, alpha: 0.5 }).stroke({ width: 5 * u, color: 0x2a2e34 });
  car.rect(vx - 240 * u, vy - 70 * u, 120 * u, 18 * u).fill(0xd04a2a).rect(vx + 110 * u, vy - 70 * u, 120 * u, 18 * u).fill(0xd04a2a);
  car.poly(oval(vx + 262 * u, vy - 30 * u, 26 * u, 20 * u, 10)).fill(0x5a5f66).poly(oval(vx + 270 * u, vy - 30 * u, 14 * u, 10 * u, 10)).fill(LIME);
  for (const x of [-170, 150]) car.poly(rrect(vx + (x - 50) * u, vy - 6 * u, 100 * u, 40 * u, 16 * u, 2)).fill(0x2a2e34);
  // the fluorescent tube
  const tube = new Graphics().rect(cx - 220 * u, 40 * u, 440 * u, 16 * u).fill(0x3a3e44).poly(bar(cx - 200 * u, 0, cx - 200 * u, 40 * u, 2 * u)).poly(bar(cx + 200 * u, 0, cx + 200 * u, 40 * u, 2 * u)).fill(0x2a2e34);
  const lit = new Container();
  const halo = glow(520 * u, 0xe8fff0, 0.3, 6, 22, 200 * u);
  halo.blendMode = 'add';
  halo.y = 60 * u;
  halo.x = cx;
  lit.addChild(halo, new Graphics().poly(rrect(cx - 206 * u, 54 * u, 412 * u, 12 * u, 6 * u, 2)).fill(0xf4fff8));
  return { g, bk, props, goo, car, tube, lit, floorY };
}

/** another version of him: his own painting as a coloured silhouette, plus a prop (the cube is drawn) */
function version(kind: 'hat' | 'stache' | 'cube', size: number) {
  const k = new Container();
  if (kind === 'cube') {
    const g = new Graphics();
    const s = size / 260;
    g.poly([-90 * s, -60 * s, 90 * s, -60 * s, 90 * s, 120 * s, -90 * s, 120 * s]).fill(0x6ec6f0).stroke({ width: 6 * s, color: 0x0a2a3a, join: 'round' });
    g.poly([-90 * s, -60 * s, -60 * s, -90 * s, 120 * s, -90 * s, 90 * s, -60 * s]).fill(0xa8e0f8).stroke({ width: 6 * s, color: 0x0a2a3a, join: 'round' });
    g.poly([90 * s, -60 * s, 120 * s, -90 * s, 120 * s, 90 * s, 90 * s, 120 * s]).fill(0x3a9ac8).stroke({ width: 6 * s, color: 0x0a2a3a, join: 'round' });
    g.poly([-80 * s, -60 * s, -70 * s, -110 * s, -40 * s, -60 * s]).fill(0x6ec6f0).stroke({ width: 5 * s, color: 0x0a2a3a, join: 'round' });
    g.poly([40 * s, -60 * s, 70 * s, -110 * s, 80 * s, -60 * s]).fill(0x6ec6f0).stroke({ width: 5 * s, color: 0x0a2a3a, join: 'round' });
    g.poly(oval(-34 * s, 10 * s, 14 * s, 18 * s, 10)).poly(oval(34 * s, 10 * s, 14 * s, 18 * s, 10)).fill(0x0a2a3a);
    g.poly([-10 * s, 40 * s, 10 * s, 40 * s, 0, 50 * s]).fill(0xf28c8c);
    k.addChild(g);
    return { k, sil: null as SilhouetteFilter | null };
  }
  let sil: SilhouetteFilter | null = null;
  try {
    const v = variantSprite(SP, size, { live: false }).root;
    sil = new SilhouetteFilter(kind === 'hat' ? LIME : 0xb070e0, 1);
    v.filters = [sil];
    if (kind === 'stache') v.scale.x *= -1;
    k.addChild(v);
  } catch {
    /* no painting: the prop alone still reads */
  }
  const g = new Graphics();
  const s = size / 520;
  if (kind === 'hat') {
    // a top hat on his head (head top ≈ (0.6, 0.07) of the painting)
    const hx = (0.6 - 0.5) * size;
    const hy = (0.1 - 0.5) * size;
    g.poly(rrect(hx - 70 * s, hy - 16 * s, 140 * s, 22 * s, 8 * s, 2)).fill(0x111111);
    g.poly([hx - 46 * s, hy - 10 * s, hx + 46 * s, hy - 10 * s, hx + 40 * s, hy - 120 * s, hx - 40 * s, hy - 120 * s]).fill(0x111111);
    g.rect(hx - 44 * s, hy - 36 * s, 88 * s, 14 * s).fill(0xd04a2a);
  } else {
    // a huge handlebar moustache (mirrored version: the nose at ≈ (0.43, 0.37))
    const mx = (0.43 - 0.5) * size;
    const my = (0.39 - 0.5) * size;
    g.poly([mx, my - 6 * s, mx + 40 * s, my - 14 * s, mx + 92 * s, my - 4 * s, mx + 120 * s, my - 34 * s, mx + 106 * s, my + 8 * s, mx + 50 * s, my + 18 * s, mx, my + 8 * s, mx - 50 * s, my + 18 * s, mx - 106 * s, my + 8 * s, mx - 120 * s, my - 34 * s, mx - 92 * s, my - 4 * s, mx - 40 * s, my - 14 * s]).fill(0x111111);
  }
  k.addChild(g);
  return { k, sil };
}

interface St {
  open: { a: number; b: number; c: number };
  vers: ReturnType<typeof version>[];
  words: Container[];
  line: ReturnType<typeof payline>;
}
const S = stash<St>();
/** the side portals: [x, y, rx, ry] */
const SIDE: [number, number, number, number][] = [
  [330, 560, 150, 190],
  [1600, 560, 150, 190],
];

export const rick: Signature = {
  dark: true,
  frame: LIME,
  tag: 'UNIVERSO DE LOS PORTALES',
  open(c: SigCtx) {
    const k = new Container();
    const gr = garage(W, H, 1, W / 2);
    const sides = new Graphics();
    k.addChild(gr.g, gr.bk, gr.props, gr.goo, gr.car, sides, gr.tube, gr.lit);
    const tint = new Graphics().rect(0, 0, W, H).fill({ color: 0x0a2a10, alpha: 0.35 });
    k.addChild(tint);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    // the big portal behind him (between the disc's place and the cat)
    const big = new Graphics();
    const glowB = glow(440, GOO, 0.45, 7, 24, 480);
    glowB.blendMode = 'add';
    glowB.position.set(W / 2, c.catY);
    c.behind.addChild(glowB, big);
    // the versions: hat (big portal, top left), moustache (right portal), cube (left portal)
    const vers = [version('hat', 300), version('stache', 300), version('cube', 300)];
    const home: [number, number][] = [
      [W / 2 - 250, c.catY - 210],
      [SIDE[1][0] - 20, SIDE[1][1] - 10],
      [SIDE[0][0] + 10, SIDE[0][1] + 10],
    ];
    vers.forEach((v, i) => {
      v.k.position.set(home[i][0], home[i][1]);
      // ≈0, not 0: drawn (its silhouette filter warmed up) from the first frame, so its entrance costs nothing
      v.k.alpha = 0.001;
      v.k.scale.set(0.2);
      (i === 0 ? c.behind : k).addChild(v.k);
    });
    const open = { a: c.short || c.reduce ? 1 : 0, b: c.short || c.reduce ? 1 : 0, c: c.short || c.reduce ? 1 : 0 };
    const words: Container[] = [];
    const line = payline(c, () => title('¡OTRO UNIVERSO,\nMISMO GATO!', { size: 118, fill: 0xc8f07a, ink: 0x0a2a10, inkW: 14, shadow: DEEP }), () => asideText('…y todos se creen el original.', 0xffffff, 0x0a2a10, 44));
    S.set(c, { open, vers, words, line });
    const draw = (t: number) => {
      if (big.destroyed) return;
      big.clear();
      portal(big, W / 2, c.catY + 10, 330, 390, t, open.a);
      sides.clear();
      portal(sides, SIDE[0][0], SIDE[0][1], SIDE[0][2], SIDE[0][3], t * 1.2, open.c);
      portal(sides, SIDE[1][0], SIDE[1][1], SIDE[1][2], SIDE[1][3], t * 1.1, open.b);
      if (!glowB.destroyed) glowB.alpha = open.a;
      if (!gr.lit.destroyed && t < 0.5 && !c.reduce && !c.short) gr.lit.alpha = c.flashes ? (Math.sin(t * 60) > 0 ? 1 : 0.2) : 1;
    };
    draw(0.5);
    if (!c.reduce) every(c, 30, draw);
    if (c.short) {
      vers.forEach((v, i) => {
        if (i === 0) return;
        v.k.alpha = 1;
        v.k.scale.set(0.8);
      });
      return;
    }
    score(c, [
      [0.02, 'zap', 0.6],
      [0.2, 'charge', 0.7],
      [0.55, 'zap', 1.1],
      [0.75, 'glitch', 0.9],
      [1.05, 'zap', 1.3],
      [1.7, 'charge', 1.6],
      [1.95, 'whoosh', 1.4],
    ]);
    const grow = (key: 'a' | 'b' | 'c', at: number, dur = 0.3) =>
      beat(c, at, () => {
        if (c.reduce) return;
        gsap.to(open, { [key]: 1, duration: dur, ease: 'back.out(1.8)' });
      });
    grow('a', 0.15, 0.4);
    grow('b', 0.55);
    grow('c', 0.75);
    // the versions peek through and talk
    const says = ['¿OTRA VEZ TÚ?', '¡QUÉ GUAPO SOY!', '¡MIAU CÚBICO!'];
    const at = [0.45, 0.85, 1.1];
    vers.forEach((v, i) => {
      beat(c, at[i], () => {
        if (v.k.destroyed) return;
        v.k.alpha = 1;
        if (c.reduce) v.k.scale.set(0.8);
        else gsap.to(v.k.scale, { x: 0.8, y: 0.8, duration: 0.25, ease: 'back.out(2)' });
        sfx('pop', 1.2 + i * 0.2);
      });
      const b = pre(c.fg, balloon(says[i], { size: 38, tx: i === 1 ? 80 : -80, ty: 90 }), home[i][0] + (i === 1 ? -150 : 120), home[i][1] - 170, i === 1 ? 0.05 : -0.05);
      words.push(b);
      pop(c, b, at[i] + 0.12, 0.55, { from: 0.4 });
    });
    const zap = pre(c.fg, title('¡ZAP!', { size: 130, fill: 0xc8f07a, ink: 0x0a2a10, inkW: 14, shadow: null }), W / 2 + 330, c.catY - 250, 0.12);
    words.push(zap);
    pop(c, zap, 1.65, 0.4, { onShow: () => c.shaker.add(0.15) });
    // green sparks off the big portal
    beat(c, 1.65, () => {
      if (c.reduce) return;
      burst(c, c.fg, (i) => new Graphics().poly(star(0, 0, 16, 5, 4, i)).fill(i % 2 ? 0xeaffc8 : LIME), 18, W / 2, c.catY, 520, 0.7);
    });
    // they get sucked back into their portals
    beat(c, 1.95, () => {
      vers.forEach((v) => {
        if (v.k.destroyed || c.reduce) return;
        gsap.to(v.k.scale, { x: 0.05, y: 0.05, duration: 0.2, ease: 'power3.in' });
        gsap.to(v.k, { rotation: 2, duration: 0.2, onComplete: () => !v.k.destroyed && (v.k.alpha = 0) });
      });
    });
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('zap', 0.8);
    sfx('bigboom', 0.9);
    later(c, 0.2, () => sfx('fanfare', 1.15));
    c.shaker.add(0.4);
    flashOf(c, 0xeaffc8, 0.55, 0.35);
    if (!st) return;
    sweep(st.words);
    st.line.land(2.4);
    st.open.a = 1;
    st.open.b = 1;
    st.open.c = 1;
    if (!c.reduce) gsap.fromTo(st.open, { a: 1.25 }, { a: 1, duration: 0.5, ease: 'elastic.out(1,0.4)' });
    // the versions pop out at once and stay to see
    st.vers.forEach((v, i) => {
      if (v.k.destroyed) return;
      gsap.killTweensOf(v.k);
      gsap.killTweensOf(v.k.scale);
      v.k.alpha = 1;
      v.k.rotation = 0;
      if (c.reduce) v.k.scale.set(i === 0 ? 0.7 : 0.8);
      else gsap.fromTo(v.k.scale, { x: 0.1, y: 0.1 }, { x: i === 0 ? 0.7 : 0.8, y: i === 0 ? 0.7 : 0.8, duration: 0.3, delay: i * 0.06, ease: 'back.out(2)' });
    });
    // a hail of little cube-cats through the portals
    burst(c, c.fg, () => version('cube', 70 + Math.random() * 40).k, 16, W / 2, c.catY, 820, 1.5);
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 1080;
    const gr = garage(w, h, u, w / 2);
    const pg = new Graphics();
    const m = Math.min(w, h);
    portal(pg, w / 2, h * 0.52, m * 0.36, m * 0.42, 0.4, 1);
    const glowB = glow(m * 0.48, GOO, 0.45, 6, 22);
    glowB.blendMode = 'add';
    glowB.position.set(w / 2, h * 0.52);
    const sidesX = [w / 2 - Math.min(w * 0.38, 640 * u), w / 2 + Math.min(w * 0.38, 640 * u)];
    const sg = new Graphics();
    const drawSides = (t: number) => {
      sg.clear();
      for (const x of sidesX) portal(sg, x, h * 0.55, 130 * u, 170 * u, t, 1);
    };
    drawSides(0.2);
    const cube = version('cube', 150 * u);
    cube.k.position.set(sidesX[0], h * 0.55);
    k.addChild(gr.g, gr.bk, gr.props, gr.goo, gr.car, sg, cube.k, gr.tube, gr.lit, new Graphics().rect(0, 0, w, h).fill({ color: 0x0a2a10, alpha: 0.25 }), glowB, pg);
    if (live)
      liveLoop(k, (t) => {
        pg.clear();
        portal(pg, w / 2, h * 0.52, m * 0.36, m * 0.42, t, 1);
        drawSides(t * 1.2);
        cube.k.rotation = Math.sin(t * 2) * 0.2;
        cube.k.scale.set(0.9 + 0.1 * Math.sin(t * 3));
        gr.lit.alpha = Math.random() < 0.03 ? 0.4 : 1;
      });
    return k;
  },
};
