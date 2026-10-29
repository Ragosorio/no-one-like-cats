/**
 * Gatogro: the swamp universe (the green ogre films). A green-gold swamp at dusk — gnarled trees with hanging moss, fog
 * banks drifting, murky water with lily pads, cattails, fireflies, a cottage built into a huge tree stump (round door,
 * chimney smoke), a wooden outhouse with a crescent moon. Hand-painted signs hammer into the mud one by one — ¡FUERA!,
 * ¡PRIVADO!, ¡CUIDADO CON EL GATOGRO! — mud bubbles pop (¡BLUB!), and a giant onion grows around his silhouette and
 * peels away layer by layer.
 * Payoff: the roar — a shockwave through the reeds, the fog blown back, birds flushed from the trees, mud splashes;
 * ¡ESTE PANTANO ES MÍO! (…y no se aceptan visitas.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { type Signature, type SigCtx, every, flashOf, later, score } from './kit';
import { hideDisc } from './kitA';
import { stash, vgrad } from './kitB';
import { beat, pay } from './kitC';
import { asideText, bar, glow, oval, payline, pop, pre, puffs, rand, rrect, sweep, title } from './kitF';
import { liveLoop } from '../../../panels/collection/cardArt';

const SKY = [0x6a8a3a, 0x9aae4a, 0xd8c86a, 0xc8b860];
const FAR = 0x4a6a32;
const NEAR = 0x2a3e1e;
const MUD = 0x4a3a22;
const WATER = 0x3e5a2a;
const WOOD = 0x8a5a2a;
const ONION = 0xd8a868;
const ONION2 = 0xe8c08a;

/** a gnarled swamp tree with hanging moss (origin at its foot) */
function tree(g: Graphics, x: number, y: number, s: number, col: number, seed: number) {
  const r = rand(seed);
  g.poly([x - 40 * s, y, x - 26 * s, y - 200 * s, x - 50 * s, y - 330 * s, x - 10 * s, y - 380 * s, x + 30 * s, y - 330 * s, x + 20 * s, y - 200 * s, x + 50 * s, y]).fill(col);
  for (const [dx, dy, ex, ey] of [
    [-30, -300, -170, -390],
    [20, -320, 180, -420],
    [-10, -360, -60, -470],
    [10, -360, 90, -480],
  ])
    g.poly(bar(x + dx * s, y + dy * s, x + ex * s, y + ey * s, 14 * s, 5 * s)).fill(col);
  // the canopy blobs and hanging moss
  puffs(g, x, y - 420 * s, 380 * s, 120 * s, 5, col, 1, seed);
  for (let i = 0; i < 6; i++) {
    const mx = x + (r() - 0.5) * 320 * s;
    const my = y - 400 * s + r() * 40 * s;
    const len = (60 + r() * 90) * s;
    g.poly([mx - 8 * s, my, mx + 8 * s, my, mx + 3 * s, my + len, mx - 2 * s, my + len * 0.8]).fill({ color: 0x8aa04a, alpha: 0.8 });
  }
}

/** the swamp (w×h, u vs 1920×1080): sky, far and near trees, the water line, mud bank, lily pads, cattails */
function swamp(w: number, h: number, u: number, cx: number) {
  const g = vgrad(new Graphics(), 0, 0, w, h * 0.7, SKY, 16);
  g.poly(oval(cx + 420 * u, 230 * u, 70 * u, 70 * u, 20)).fill({ color: 0xfff2b0, alpha: 0.85 });
  const far = new Graphics();
  for (let x = (cx % (260 * u)) - 260 * u; x < w + 260 * u; x += 260 * u) tree(far, x, h * 0.66, u * 0.7, FAR, Math.round(x));
  const near = new Graphics();
  for (let x = (cx % (900 * u)) - 450 * u; x < w + 450 * u; x += 900 * u) tree(near, x, h * 0.78, u * 1.15, NEAR, Math.round(x) + 7);
  const waterY = h * 0.74;
  const ground = new Graphics();
  ground.rect(0, waterY, w, h - waterY).fill(WATER);
  for (let x = 0; x < w; x += 140 * u) ground.rect(x + (Math.round(x / u) % 3) * 20 * u, waterY + 20 * u + (Math.round(x / u) % 4) * 30 * u, 70 * u, 3 * u);
  ground.fill({ color: 0x8aa04a, alpha: 0.5 });
  // the mud bank he stands on
  const bank: number[] = [0, h];
  for (let x = 0; x <= w + 60 * u; x += 60 * u) bank.push(x, h * 0.86 + Math.sin(x / (180 * u)) * 14 * u - Math.max(0, 1 - Math.abs(x - cx) / (700 * u)) * 60 * u);
  bank.push(w + 60 * u, h);
  ground.poly(bank).fill(MUD);
  // lily pads
  const r = rand(23);
  for (let i = 0; i < Math.max(4, Math.round(w / (240 * u))); i++) {
    const lx = r() * w;
    const ly = waterY + (0.15 + r() * 0.4) * (h * 0.12);
    const pts = oval(lx, ly, 46 * u, 14 * u, 14);
    ground.poly(pts.slice(2)).fill(0x5a9a3a);
    if (r() < 0.4) ground.poly(oval(lx + 10 * u, ly - 6 * u, 8 * u, 6 * u, 8)).fill(0xf6b8c8);
  }
  // cattails
  for (let x = (cx % (330 * u)) - 100 * u; x < w; x += 330 * u)
    for (let j = 0; j < 3; j++) {
      const bx = x + j * 22 * u;
      const top = waterY - (110 + j * 30) * u;
      ground.poly(bar(bx, waterY + 30 * u, bx + 6 * u, top, 3 * u)).fill(0x5a7a2a);
      ground.poly(rrect(bx - 4 * u, top, 14 * u, 44 * u, 7 * u, 2)).fill(0x6a3a1a);
    }
  return { g, far, near, ground, waterY };
}

/** the stump cottage (origin at its base) and its chimney's smoke point */
function stump(s: number) {
  const g = new Graphics();
  g.poly([-170 * s, 0, -150 * s, -300 * s, -120 * s, -330 * s, 120 * s, -330 * s, 150 * s, -300 * s, 170 * s, 0, 210 * s, 10 * s, -210 * s, 10 * s]).fill(0x6a4a2a).stroke({ width: 5 * s, color: 0x3a2412, join: 'round' });
  for (let i = -3; i <= 3; i++) g.poly(bar(i * 42 * s, -320 * s, i * 46 * s, -6 * s, 3 * s)).fill(0x4a321a);
  g.poly(oval(0, -330 * s, 120 * s, 22 * s, 18)).fill(0xa87a4a).stroke({ width: 4 * s, color: 0x3a2412 });
  g.poly(oval(0, -330 * s, 70 * s, 12 * s, 14)).stroke({ width: 3 * s, color: 0x7a5432 });
  // the round door, a window, the stone chimney
  g.poly([-56 * s, 0, -56 * s, -110 * s, ...[0, 1, 2, 3, 4, 5, 6, 7, 8].flatMap((i) => [Math.cos(Math.PI + (i / 8) * Math.PI) * 56 * s, -110 * s + Math.sin(Math.PI + (i / 8) * Math.PI) * 56 * s]), 56 * s, 0]).fill(WOOD).stroke({ width: 5 * s, color: 0x3a2412 });
  g.poly(oval(30 * s, -80 * s, 7 * s, 7 * s, 8)).fill(0xe6c34a);
  g.poly(oval(90 * s, -210 * s, 30 * s, 30 * s, 12)).fill(0xffd27a).stroke({ width: 5 * s, color: 0x3a2412 });
  g.rect(-120 * s, -440 * s, 50 * s, 130 * s).fill(0x7a7a6a).stroke({ width: 4 * s, color: 0x3a3a2a });
  return { g, smoke: [-95 * s, -450 * s] as [number, number] };
}

/** a hand-painted wooden sign on a post (origin at the post's foot) */
function sign(text: string, s: number, tilt: number) {
  const k = new Container();
  const t = txt(text, { fontFamily: F.brush, fontSize: 38 * s, fill: 0xf2e8d0, align: 'center', lineHeight: 40 * s });
  t.anchor.set(0.5);
  const bw = t.width + 50 * s;
  const bh = t.height + 30 * s;
  const g = new Graphics();
  g.poly(bar(0, 0, 0, -200 * s - bh / 2, 9 * s)).fill(0x5a3a1a);
  g.poly([-bw / 2, -200 * s - bh, bw / 2 - 6 * s, -204 * s - bh, bw / 2, -200 * s, -bw / 2 + 4 * s, -196 * s]).fill(WOOD).stroke({ width: 5 * s, color: 0x3a2412, join: 'round' });
  for (let i = 1; i < 3; i++) g.rect(-bw / 2 + 4 * s, -200 * s - (bh * i) / 3, bw - 8 * s, 3 * s).fill(0x6a4220);
  t.position.set(0, -200 * s - bh / 2);
  k.addChild(g, t);
  k.rotation = tilt;
  return k;
}

/** the onion: concentric layers as separate Graphics (outer first), centered at 0,0 */
function onion(rx: number, ry: number, n: number) {
  const layers: Graphics[] = [];
  for (let i = 0; i < n; i++) {
    const k = 1 - i * 0.12;
    const g = new Graphics();
    const pts: number[] = [];
    for (let j = 0; j < 28; j++) {
      const a = (j / 28) * Math.PI * 2;
      // an onion's bulb: round bottom, pointy top
      const top = Math.max(0, -Math.sin(a));
      pts.push(Math.cos(a) * rx * k * (1 - top * top * 0.55), Math.sin(a) * ry * k * (1 + top * 0.35));
    }
    g.poly(pts).fill(i % 2 ? ONION2 : ONION).stroke({ width: 6, color: 0x8a5a2a, join: 'round' });
    for (let j = -2; j <= 2; j++) g.poly(bar(j * rx * k * 0.3, -ry * k * 1.1, j * rx * k * 0.36, ry * k * 0.9, 2)).fill({ color: 0xa8784a, alpha: 0.6 });
    // the dry sprout on top and the little roots below (it reads as an onion, not an egg)
    const top = -ry * k * 1.35;
    g.poly([-14 * k, top + 40, 14 * k, top + 40, 26 * k, top - 50, 8 * k, top + 6, 0, top - 70, -8 * k, top + 6, -26 * k, top - 50]).fill(0x9a7a3a).stroke({ width: 4, color: 0x6a4a1a, join: 'round' });
    for (let j = -3; j <= 3; j++) g.poly(bar(j * 10 * k, ry * k * 0.98, j * 22 * k, ry * k * 0.98 + 34 + Math.abs(j) * 4, 2.5)).fill(0xc8b090);
    layers.push(g);
  }
  return layers;
}

interface St {
  fogs: Graphics[];
  signs: Container[];
  layers: Graphics[];
  words: Container[];
  line: ReturnType<typeof payline>;
  birds: () => void;
}
const S = stash<St>();
const SIGNS: [string, number, number, number][] = [
  ['¡FUERA!', 1560, 900, 0.08],
  ['¡PRIVADO!', 330, 960, -0.1],
  ['¡CUIDADO CON\nEL GATOGRO!', 1290, 980, -0.05],
];

export const gatogro: Signature = {
  dark: true,
  frame: 0x7aa83a,
  tag: 'UNIVERSO DEL PANTANO',
  open(c: SigCtx) {
    const k = new Container();
    const sw = swamp(W, H, 1, W / 2);
    const st0 = stump(1.05);
    st0.g.position.set(380, 820);
    // the outhouse with its crescent moon
    const oh = new Graphics();
    oh.poly([1700, 850, 1700, 600, 1760, 560, 1820, 600, 1820, 850]).fill(WOOD).stroke({ width: 5, color: 0x3a2412, join: 'round' });
    oh.poly([1690, 604, 1760, 548, 1830, 604, 1830, 620, 1690, 620]).fill(0x5a3a1a);
    oh.poly([1748, 640, 1772, 632, 1762, 650, 1772, 668, 1748, 660, 1742, 650]).fill(0x2a1a0a);
    const fogs = [0, 1, 2].map((i) => {
      const f = new Graphics();
      puffs(f, W / 2, [640, 780, 940][i], W + 800, [70, 90, 80][i], 12, 0xe8f0c8, [0.18, 0.2, 0.16][i], 30 + i);
      return f;
    });
    const smoke = new Graphics();
    const mud = new Graphics();
    const flies = new Graphics();
    flies.blendMode = 'add';
    const birds = new Graphics();
    k.addChild(sw.g, sw.far, fogs[0], sw.near, st0.g, oh, smoke, sw.ground, mud, fogs[1], flies, birds, fogs[2]);
    c.back.addChild(k);
    hideDisc(c, 0.2);
    const halo = glow(380, 0xfff2b0, 0.3, 6, 24);
    halo.position.set(W / 2, c.catY);
    c.behind.addChild(halo);
    // the onion (behind him): built now, grown on its beat
    const onionK = new Container();
    const layers = onion(330, 300, 4);
    onionK.addChild(...layers);
    onionK.position.set(W / 2, c.catY + 40);
    c.behind.addChild(onionK);
    const signs = SIGNS.map(([text, x, y, tilt]) => {
      const sg = sign(text, 1, tilt);
      sg.position.set(x, y);
      k.addChild(sg);
      return sg;
    });
    const words: Container[] = [];
    const line = payline(c, () => title('¡ESTE PANTANO\nES MÍO!', { size: 116, fill: 0xb8e05a, ink: 0x1a2a0a, inkW: 14, shadow: 0x5a3a1a }), () => asideText('…y no se aceptan visitas.', 0xf2e8d0, 0x1a2a0a, 46));
    let flushed = 0;
    const flushBirds = () => (flushed = performance.now());
    S.set(c, { fogs, signs, layers, words, line, birds: flushBirds });
    const r = rand(9);
    const fl = Array.from({ length: 14 }, () => [r() * W, 300 + r() * 500, r() * 6]);
    const pops = [
      [700, 960],
      [1250, 1010],
      [520, 1040],
      [1450, 950],
    ];
    const life = (t: number) => {
      if (smoke.destroyed) return;
      fogs.forEach((f, i) => !f.destroyed && (f.x = Math.sin(t * (0.2 + i * 0.07) + i) * 140));
      smoke.clear();
      for (let i = 0; i < 5; i++) {
        const q = (t * 0.35 + i / 5) % 1;
        smoke.poly(oval(380 + st0.smoke[0] + Math.sin(q * 5) * 20 + q * 60, 820 + st0.smoke[1] - q * 260, 18 + q * 40, 14 + q * 30, 10)).fill({ color: 0xd8d8c8, alpha: 0.5 * (1 - q) });
      }
      flies.clear();
      for (const [x, y, ph] of fl) flies.poly(oval(x + Math.sin(t + ph) * 40, y + Math.cos(t * 1.3 + ph) * 26, 5, 5, 6)).fill({ color: 0xf0ff80, alpha: 0.5 + 0.5 * Math.sin(t * 4 + ph) });
      mud.clear();
      pops.forEach(([x, y], i) => {
        const q = (t * 0.7 + i * 0.27) % 1;
        if (q < 0.7) mud.poly(oval(x, y - q * 18, 6 + q * 22, 5 + q * 16, 12)).fill({ color: 0x6a5434, alpha: 0.95 });
        else mud.poly(oval(x, y - 12, 34 * (q - 0.5), 8, 10)).stroke({ width: 3, color: 0x6a5434, alpha: (1 - q) * 3 });
      });
      birds.clear();
      if (flushed) {
        const q = (performance.now() - flushed) / 1000;
        for (let i = 0; i < 9; i++) {
          const bx = 200 + i * 190 + q * (i % 2 ? 260 : -200);
          const by = 380 - q * (300 + i * 30);
          const f = Math.sin(q * 20 + i) * 10;
          birds.poly([bx - 22, by - f, bx, by + 4, bx + 22, by - f, bx, by - 4]);
        }
        birds.fill(0x1a2010);
      }
    };
    life(0.5);
    if (!c.reduce) every(c, 30, life);
    if (c.short) {
      layers.forEach((l, i) => i < layers.length - 1 && (l.visible = false));
      onionK.scale.set(0.9);
      onionK.alpha = 0.6;
      return;
    }
    score(c, [
      [0.0, 'whoosh', 0.35],
      [0.92, 'pop', 0.5],
      [1.15, 'paper', 0.8],
      [1.4, 'paper', 0.9],
      [1.65, 'paper', 1.0],
      [1.9, 'paper', 1.1],
    ]);
    // the signs hammer into the mud
    signs.forEach((sg, i) => {
      const at = 0.2 + i * 0.22;
      if (!c.reduce) {
        sg.alpha = 0;
        const y = sg.y;
        beat(c, at, () => {
          if (sg.destroyed) return;
          sg.alpha = 1;
          gsap.fromTo(sg, { y: y - 300 }, { y, duration: 0.14, ease: 'power3.in', onComplete: () => (sfx('hit', 0.6 + i * 0.1), c.shaker.add(0.08)) });
        });
      }
      const toc = pre(c.fg, title('¡TOC!', { size: 60, fill: 0xf2e8d0, ink: 0x3a2412, inkW: 8, shadow: null }), sg.x + 110, sg.y - 280, 0.12);
      words.push(toc);
      pop(c, toc, at + 0.14, 0.3, { from: 1.6 });
    });
    const blub = pre(c.fg, title('¡BLUB!', { size: 80, fill: 0x9a8a5a, ink: 0x1a1a0a, inkW: 10, shadow: null }), 640, 860, -0.12);
    words.push(blub);
    pop(c, blub, 0.75, 0.4);
    // the onion grows around him and peels away layer by layer
    if (!c.reduce) {
      onionK.scale.set(0);
      beat(c, 0.9, () => !onionK.destroyed && gsap.to(onionK.scale, { x: 1, y: 1, duration: 0.25, ease: 'back.out(1.8)' }));
    }
    layers.slice(0, layers.length - 1).forEach((l, i) =>
      beat(c, 1.15 + i * 0.25, () => {
        if (l.destroyed) return;
        if (c.reduce) {
          l.visible = false;
          return;
        }
        const side = i % 2 ? 1 : -1;
        gsap.to(l, { x: side * 520, y: -180 - i * 60, rotation: side * 1.4, duration: 0.45, ease: 'power2.out' });
        gsap.to(l.scale, { x: 0.5, y: 0.5, duration: 0.45 });
        gsap.to(l, { alpha: 0, delay: 0.25, duration: 0.2, onComplete: () => (l.visible = false) });
      }),
    );
    const capa = pre(c.fg, title('¡CAPA\nPOR CAPA!', { size: 70, fill: ONION2, ink: 0x5a3a1a, inkW: 9, shadow: null }), W / 2 - 430, c.catY - 250, -0.12);
    words.push(capa);
    pop(c, capa, 1.25, 0.8);
  },
  payoff(c: SigCtx) {
    pay(c);
    const st = S.get(c);
    sfx('bigboom', 0.6);
    sfx('meow', 0.5);
    later(c, 0.3, () => sfx('fanfare', 1.0));
    c.shaker.add(0.55);
    flashOf(c, 0xe8f0c8, 0.35, 0.3);
    if (!st) return;
    sweep(st.words);
    st.line.land(2.5);
    st.birds();
    st.layers.forEach((l, i) => i < st.layers.length - 1 && !l.destroyed && (l.visible = false));
    const last = st.layers[st.layers.length - 1];
    if (last && !last.destroyed && !c.reduce) gsap.to(last, { alpha: 0.35, duration: 0.6 });
    // the roar: rings through the reeds, the fog blown back, the signs rattle
    const rings = new Graphics();
    c.behind.addChild(rings);
    const p = { v: c.reduce ? 0.6 : 0 };
    const draw = () => {
      if (rings.destroyed) return;
      rings.clear();
      for (let i = 0; i < 3; i++) {
        const rr = 200 + (p.v - i * 0.12) * 1300;
        if (rr > 200) rings.poly(oval(W / 2, c.catY, rr, rr * 0.7, 40)).stroke({ width: 18 - i * 4, color: 0xe8f0c8, alpha: Math.max(0, 0.7 - p.v * 0.6) });
      }
    };
    draw();
    if (!c.reduce) gsap.to(p, { v: 1, duration: 0.9, ease: 'power2.out', onUpdate: draw, onComplete: () => destroyTree(rings) });
    else gsap.to(rings, { alpha: 0, delay: 0.8, duration: 0.3, onComplete: () => destroyTree(rings) });
    if (!c.reduce) {
      st.fogs.forEach((f, i) => !f.destroyed && gsap.to(f, { alpha: 0.2, duration: 0.5, delay: i * 0.05 }));
      st.signs.forEach((sg, i) => !sg.destroyed && gsap.fromTo(sg, { rotation: sg.rotation + (i % 2 ? 0.2 : -0.2) }, { rotation: sg.rotation, duration: 0.8, ease: 'elastic.out(1.2,0.3)' }));
      // mud splashes
      for (let i = 0; i < 10; i++) {
        const g = new Graphics().poly(oval(0, 0, 14 + Math.random() * 14, 10 + Math.random() * 10, 8)).fill(0x5a4428);
        g.position.set(W / 2 + (Math.random() - 0.5) * 600, c.catY + 260);
        c.fg.addChild(g);
        gsap.to(g, { x: g.x + (Math.random() - 0.5) * 400, y: g.y - 200 - Math.random() * 200, duration: 0.4, ease: 'power2.out' });
        gsap.to(g, { y: H + 60, delay: 0.4, duration: 0.5, ease: 'power2.in', onComplete: () => destroyTree(g) });
      }
    }
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = h / 1080;
    const sw = swamp(w, h, u, w / 2);
    const st0 = stump(u);
    st0.g.position.set(w / 2 - Math.min(w * 0.36, 620 * u), h * 0.78);
    const sg = sign('¡CUIDADO CON\nEL GATOGRO!', u, -0.06);
    sg.position.set(w / 2 + 700 * u, h * 0.93);
    // only the wide detail page has room for it beside him
    sg.visible = w > h * 2;
    const fog = new Graphics();
    puffs(fog, w / 2, h * 0.8, w + 400 * u, 80 * u, Math.max(6, Math.round(w / (200 * u))), 0xe8f0c8, 0.18, 4);
    const flies = new Graphics();
    flies.blendMode = 'add';
    const r = rand(3);
    const fl = Array.from({ length: Math.max(6, Math.round(w / (160 * u))) }, () => [r() * w, (300 + r() * 500) * u, r() * 6]);
    const drawF = (t: number) => {
      flies.clear();
      for (const [x, y, ph] of fl) flies.poly(oval(x + Math.sin(t + ph) * 30 * u, y + Math.cos(t * 1.3 + ph) * 20 * u, 5 * u, 5 * u, 6)).fill({ color: 0xf0ff80, alpha: 0.5 + 0.5 * Math.sin(t * 4 + ph) });
    };
    drawF(0.5);
    k.addChild(sw.g, sw.far, sw.near, st0.g, sw.ground, sg, fog, flies);
    if (live)
      liveLoop(k, (t) => {
        drawF(t);
        fog.x = Math.sin(t * 0.25) * 60 * u;
      });
    return k;
  },
};
