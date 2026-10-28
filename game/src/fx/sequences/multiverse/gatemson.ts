/**
 * J. J. Gatemson: the front-page universe. The newsroom of El Clarín Viñeta — the masthead in red across the wall,
 * the city in the windows, typewriters, his big desk with the red phone ringing. Front pages SPIN in like in the old
 * movies (¡AMENAZA! · ¡FOTOS DEL GATO ARAÑA! · and the big ¡EXTRA! ¡EXTRA! that lands right behind him), flashbulbs pop,
 * and he rants: he thumps the desk (¡PUM! ¡PUM!), papers jump, balloons fly — ¡TRÁIGANME FOTOS! ¡ESTÁS DESPEDIDO!
 * Payoff: headline stamps slam the screen in red ink; ¡EXTRA! ¡EXTRA!
 */
import { Container, Graphics, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { poster, txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { halftoneTexture } from '../../../art/textures';
import { type Signature, type SigCtx, CHEER, cheer, drizzle, fall, flashOf, later, score, word } from './kit';
import { cardLoop, hideDisc } from './kitA';

const RED = 0xc8102e;
const NEWS = 0xf3eee2;
const WALL = 0xe6d7b8;
const WOOD = 0x8a5a33;

/** a front page: blackletter masthead, dateline, a huge headline, a halftone photo of a spider-cat, columns */
function page(pw: number, ph: number, headline: string, photo = true): Container {
  const k = new Container();
  const g = new Graphics().rect(-pw / 2, -ph / 2, pw, ph).fill(NEWS).stroke({ width: Math.max(3, pw / 120), color: C.ink });
  const m = pw * 0.06;
  g.rect(-pw / 2 + m, -ph / 2 + ph * 0.13, pw - m * 2, Math.max(2, pw / 200)).fill(C.ink);
  g.rect(-pw / 2 + m, -ph / 2 + ph * 0.165, pw - m * 2, Math.max(1, pw / 400)).fill(C.ink);
  k.addChild(g);
  const mast = txt('El Clarín Viñeta', { fontFamily: F.news, fontSize: pw * 0.105, fill: C.ink });
  mast.anchor.set(0.5);
  mast.position.set(0, -ph / 2 + ph * 0.07);
  if (mast.width > pw - m * 2) mast.scale.set((pw - m * 2) / mast.width);
  const date = txt('AÑO XCIX · Nº 2099 · EDICIÓN EXTRA · CIUDAD MAYÚSCULA', { fontFamily: F.ui, fontWeight: '700', fontSize: pw * 0.026, fill: C.ink });
  date.anchor.set(0.5);
  date.position.set(0, -ph / 2 + ph * 0.148);
  if (date.width > pw - m * 2) date.scale.set((pw - m * 2) / date.width);
  const hl = poster(headline, pw * 0.2, C.ink, { align: 'center', wordWrap: true, wordWrapWidth: (pw - m * 2) / 1, lineHeight: pw * 0.2 });
  hl.anchor.set(0.5, 0);
  hl.position.set(0, -ph / 2 + ph * 0.19);
  const maxH = ph * (photo ? 0.3 : 0.42);
  const sc = Math.min(1, (pw - m * 2) / hl.width, maxH / hl.height);
  hl.scale.set(sc);
  k.addChild(mast, date, hl);
  const top = -ph / 2 + ph * 0.19 + hl.height + ph * 0.03;
  if (photo) {
    const phw = pw * 0.52;
    const phh = ph * 0.3;
    const px = -pw / 2 + m;
    const pg = new Graphics().rect(px, top, phw, phh).fill(0x9a958a).stroke({ width: Math.max(2, pw / 200), color: C.ink });
    k.addChild(pg);
    const dots = new TilingSprite({ texture: halftoneTexture(C.ink, 8, 2), width: phw, height: phh });
    dots.position.set(px, top);
    dots.alpha = 0.35;
    k.addChild(dots);
    // the blurry spider-cat in the photo
    const sx = px + phw * 0.55;
    const sy = top + phh * 0.5;
    const r = phh * 0.2;
    const s2 = new Graphics();
    for (let i = 0; i < 8; i++) s2.moveTo(sx, sy).lineTo(sx + Math.cos(i * 0.785) * r * 2.4, sy + Math.sin(i * 0.785) * r * 2);
    s2.stroke({ width: Math.max(1, pw / 300), color: 0xf3eee2, alpha: 0.7 });
    s2.circle(sx, sy, r).fill(0x2a2622);
    s2.poly([sx - r, sy - r * 0.3, sx - r * 0.7, sy - r * 1.5, sx - r * 0.1, sy - r]).poly([sx + r, sy - r * 0.3, sx + r * 0.7, sy - r * 1.5, sx + r * 0.1, sy - r]).fill(0x2a2622);
    s2.circle(sx - r * 0.35, sy - r * 0.1, r * 0.22).fill(0xf3eee2).circle(sx + r * 0.35, sy - r * 0.1, r * 0.22).fill(0xf3eee2);
    k.addChild(s2);
    const cols = new Graphics();
    for (let y = top; y < top + phh; y += ph * 0.025) cols.rect(px + phw + m * 0.6, y, pw - phw - m * 2.6, Math.max(1.5, ph * 0.009)).fill(0x8f8a80);
    for (let y = top + phh + ph * 0.03; y < ph / 2 - m; y += ph * 0.025) {
      cols.rect(-pw / 2 + m, y, pw / 2 - m * 1.3, Math.max(1.5, ph * 0.009)).fill(0x8f8a80);
      cols.rect(m * 0.3, y, pw / 2 - m * 1.3, Math.max(1.5, ph * 0.009)).fill(0x8f8a80);
    }
    k.addChild(cols);
  } else {
    const cols = new Graphics();
    for (let y = top; y < ph / 2 - m; y += ph * 0.025) {
      cols.rect(-pw / 2 + m, y, pw / 2 - m * 1.3, Math.max(1.5, ph * 0.009)).fill(0x8f8a80);
      cols.rect(m * 0.3, y, pw / 2 - m * 1.3, Math.max(1.5, ph * 0.009)).fill(0x8f8a80);
    }
    k.addChild(cols);
  }
  return k;
}

/** the newsroom: halftone wall, the red masthead banner, windows on the city, back desks with typewriters, the floor */
function newsroom(w = W, h = H, s = 1): Container {
  const k = new Container();
  k.addChild(new Graphics().rect(0, 0, w, h).fill(WALL));
  const dots = new TilingSprite({ texture: halftoneTexture(C.ink, Math.max(8, Math.round(18 * s)), Math.max(1.5, 3 * s)), width: w, height: h });
  dots.alpha = 0.08;
  k.addChild(dots);
  const g = new Graphics();
  g.rect(0, h * 0.6, w, h * 0.04).fill(0x7a4a2a);
  // windows with the city
  for (const x0 of [w * 0.03, w * 0.76]) {
    const ww = w * 0.21;
    const wh = h * 0.42;
    const y0 = h * 0.14;
    g.rect(x0, y0, ww, wh).fill(0xbfd9ea).stroke({ width: 10 * s, color: 0x5a3a22 });
    let x = x0 + 6 * s;
    let i = 0;
    while (x < x0 + ww - 10 * s) {
      const bw = (24 + ((i * 37) % 30)) * s;
      const bh = wh * (0.3 + ((i * 53) % 50) / 100);
      g.rect(x, y0 + wh - bh, Math.min(bw, x0 + ww - 6 * s - x), bh).fill(i % 2 ? 0x6f8296 : 0x8597aa);
      x += bw + 4 * s;
      i++;
    }
    g.rect(x0 + ww / 2 - 4 * s, y0, 8 * s, wh).fill(0x5a3a22);
    g.rect(x0, y0 + wh / 2 - 4 * s, ww, 8 * s).fill(0x5a3a22);
  }
  // back desks with typewriters and lamps
  for (const x0 of [w * 0.04, w * 0.72]) {
    const dw = w * 0.24;
    const y0 = h * 0.7;
    g.rect(x0, y0, dw, h * 0.03).fill(0x6a4428).stroke({ width: 4 * s, color: C.ink });
    g.rect(x0 + dw * 0.08, y0 + h * 0.03, dw * 0.06, h * 0.12).fill(0x6a4428);
    g.rect(x0 + dw * 0.86, y0 + h * 0.03, dw * 0.06, h * 0.12).fill(0x6a4428);
    g.roundRect(x0 + dw * 0.3, y0 - h * 0.055, dw * 0.36, h * 0.055, 8 * s).fill(0x2f3238).stroke({ width: 4 * s, color: C.ink });
    g.rect(x0 + dw * 0.36, y0 - h * 0.1, dw * 0.24, h * 0.05).fill(0xfbf8ee).stroke({ width: 3 * s, color: C.ink });
    g.poly([x0 + dw * 0.78, y0, x0 + dw * 0.8, y0 - h * 0.12, x0 + dw * 0.9, y0 - h * 0.14, x0 + dw * 0.96, y0 - h * 0.1, x0 + dw * 0.84, y0 - h * 0.1, x0 + dw * 0.82, y0]).fill(0x2f6b3a).stroke({ width: 3 * s, color: C.ink });
  }
  // floor planks
  g.rect(0, h * 0.84, w, h * 0.16).fill(0x9c6b3e);
  for (let i = 0; i < 6; i++) g.rect(0, h * 0.84 + i * 30 * s, w, 3 * s).fill(0x7a4f2a);
  k.addChild(g);
  // the masthead banner
  const ban = new Graphics().rect(0, h * 0.015, w, h * 0.08).fill(RED).stroke({ width: 5 * s, color: C.ink });
  k.addChild(ban);
  const mt = txt('El Clarín Viñeta', { fontFamily: F.news, fontSize: 62 * s, fill: 0xffffff });
  mt.anchor.set(0.5);
  mt.position.set(w / 2, h * 0.055);
  k.addChild(mt);
  return k;
}

/** his desk (behind him): wood, the red phone, the nameplate, stacks of paper */
function desk(phone: Container): Container {
  const k = new Container();
  const g = new Graphics();
  g.rect(W / 2 - 600, 800, 1200, 40).fill(0xa06b3c).stroke({ width: 6, color: C.ink });
  g.rect(W / 2 - 580, 840, 1160, 160).fill(WOOD).stroke({ width: 6, color: C.ink });
  g.rect(W / 2 - 540, 870, 300, 100).stroke({ width: 4, color: 0x5e3a1f }).rect(W / 2 + 240, 870, 300, 100).stroke({ width: 4, color: 0x5e3a1f });
  // the nameplate
  g.roundRect(W / 2 + 290, 750, 220, 52, 6).fill(0xd9b25e).stroke({ width: 4, color: C.ink });
  // paper stacks
  for (let i = 0; i < 6; i++) g.rect(W / 2 + 380 + (i % 2) * 6, 800 - 12 - i * 12, 150, 12).fill(i % 2 ? NEWS : 0xe2dccb).stroke({ width: 2, color: C.ink });
  k.addChild(g);
  const np = txt('DIRECTOR', { fontFamily: F.poster, fontSize: 34, fill: C.ink });
  np.anchor.set(0.5);
  np.position.set(W / 2 + 400, 776);
  k.addChild(np);
  phone.position.set(W / 2 - 430, 770);
  k.addChild(phone);
  return k;
}

/** the red rotary phone */
function redPhone(): Container {
  const k = new Container();
  const g = new Graphics();
  g.poly([-70, 30, -50, -20, 50, -20, 70, 30]).fill(RED).stroke({ width: 5, color: C.ink, join: 'round' });
  g.circle(0, 2, 22).fill(0xf3eee2).stroke({ width: 4, color: C.ink });
  for (let i = 0; i < 8; i++) g.circle(Math.cos(i * 0.785) * 14, 2 + Math.sin(i * 0.785) * 14, 3).fill(C.ink);
  g.roundRect(-80, -48, 160, 26, 13).fill(RED).stroke({ width: 5, color: C.ink });
  k.addChild(g);
  return k;
}

/** a comic speech balloon */
function balloon(text: string, tailRight: boolean): Container {
  const k = new Container();
  const t = txt(text, { fontFamily: F.comic, fontSize: 52, fill: C.ink, letterSpacing: 1 });
  t.anchor.set(0.5);
  const bw = t.width + 60;
  const bh = t.height + 34;
  const g = new Graphics();
  const tx = tailRight ? bw * 0.25 : -bw * 0.25;
  g.poly([tx - 22, bh / 2 - 6, tx + 22, bh / 2 - 6, tx + (tailRight ? 60 : -60), bh / 2 + 60]).fill(0xffffff).stroke({ width: 5, color: C.ink, join: 'round' });
  g.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2).fill(0xffffff).stroke({ width: 5, color: C.ink });
  g.rect(tx - 18, bh / 2 - 12, 36, 12).fill(0xffffff);
  k.addChild(g, t);
  return k;
}

/** a flashbulb pop: a white star and a glow (Reducir destellos: a small yellow sparkle) */
function bulb(c: SigCtx, x: number, y: number) {
  const g = new Graphics();
  if (c.flashes) {
    g.circle(0, 0, 120).fill({ color: 0xffffff, alpha: 0.35 });
    g.star(0, 0, 8, 110, 22).fill(0xffffff);
    g.circle(0, 0, 30).fill(0xffffff);
  } else g.star(0, 0, 4, 34, 8).fill(0xffe27a);
  g.position.set(x, y);
  c.fg.addChild(g);
  gsap.fromTo(g.scale, { x: 0.3, y: 0.3 }, { x: 1, y: 1, duration: 0.08 });
  gsap.to(g, { alpha: 0, delay: 0.08, duration: 0.3, onComplete: () => g.destroy() });
  sfx('pop', 1.8 + Math.random() * 0.4);
}

/** a red rubber stamp */
function stamp(text: string, size = 90): Container {
  const k = new Container();
  const t = poster(text, size, RED, { letterSpacing: 4 });
  t.anchor.set(0.5);
  const bw = t.width + 50;
  const bh = t.height + 20;
  const g = new Graphics().rect(-bw / 2, -bh / 2, bw, bh).stroke({ width: 10, color: RED }).rect(-bw / 2 + 14, -bh / 2 + 14, bw - 28, bh - 28).stroke({ width: 4, color: RED });
  // worn ink: a few gaps
  for (let i = 0; i < 9; i++) g.circle(-bw / 2 + Math.random() * bw, (Math.random() < 0.5 ? -1 : 1) * bh * 0.5, 4 + Math.random() * 6).fill(0xf3eee2);
  k.addChild(g, t);
  k.alpha = 0.92;
  return k;
}

/** a loose sheet of paper */
function sheet(i: number): Graphics {
  const g = new Graphics().rect(-34, -44, 68, 88).fill(i % 3 ? NEWS : 0xffffff).stroke({ width: 3, color: C.ink });
  for (let y = -30; y < 36; y += 10) g.rect(-24, y, 48, 3).fill(0xa09a8c);
  return g;
}

interface News {
  bigPage: Container;
}
const state = new WeakMap<SigCtx, News>();

export const gatemson: Signature = {
  dark: false,
  frame: RED,
  tag: 'UNIVERSO PRIMERA PLANA',
  open(c: SigCtx) {
    const room = newsroom();
    c.back.addChild(room);
    hideDisc(c, 0.15);
    const phone = redPhone();
    const dk = desk(phone);
    c.back.addChild(dk);
    // the big front page lands right behind him (his own disc)
    const big = page(720, 900, '¡EXTRA! ¡EXTRA!', false);
    big.position.set(W / 2, c.CY + 30);
    big.rotation = -0.04;
    c.behind.addChild(big);
    state.set(c, { bigPage: big });
    if (c.short || c.reduce) {
      if (!c.reduce) drizzle(c, c.back, () => sheet(Math.floor(Math.random() * 9)), 0.5, 3.4);
      return;
    }
    // the phone rings
    gsap.to(phone, { rotation: 0.12, duration: 0.05, yoyo: true, repeat: 9, onComplete: () => void (phone.rotation = 0) });
    score(c, [
      [0.02, 'whoosh', 0.8],
      [0.05, 'alarm', 1.9],
      [0.35, 'alarm', 1.9],
    ]);
    later(c, 0.05, () => word(c, W / 2 - 430, 690, '¡RIIING!', RED, 64, 0.7));
    // the spin: three front pages, the classic movie montage
    const spin = (node: Container, x: number, y: number, rot: number, scale: number, delay: number, layer: Container) => {
      node.position.set(x, y);
      node.scale.set(0);
      layer.addChild(node);
      gsap.to(node.scale, { x: scale, y: scale, duration: 0.42, delay, ease: 'back.out(1.4)' });
      gsap.fromTo(node, { rotation: rot - Math.PI * 4 }, { rotation: rot, duration: 0.42, delay, ease: 'power2.out' });
      later(c, delay, () => {
        sfx('whoosh', 1.2);
        sfx('paper', 0.9);
      });
      later(c, delay + 0.4, () => c.shaker.add(0.15));
    };
    const left = page(470, 600, '¡AMENAZA!');
    const right = page(470, 600, '¡FOTOS DEL GATO ARAÑA!');
    spin(left, 420, 470, -0.1, 1, 0.05, c.fg);
    spin(right, W - 420, 470, 0.09, 1, 0.35, c.fg);
    big.scale.set(0);
    gsap.to(big.scale, { x: 1, y: 1, duration: 0.45, delay: 0.65, ease: 'back.out(1.3)' });
    gsap.fromTo(big, { rotation: -0.04 - Math.PI * 4 }, { rotation: -0.04, duration: 0.45, delay: 0.65, ease: 'power2.out' });
    later(c, 0.65, () => {
      sfx('whoosh', 0.9);
      sfx('paper', 0.7);
    });
    later(c, 1.08, () => {
      sfx('boom', 1.3);
      c.shaker.add(0.25);
    });
    // the side pages fly off, the flashbulbs pop
    later(c, 1.15, () => {
      gsap.to(left, { x: -400, rotation: -1, duration: 0.35, ease: 'power2.in', onComplete: () => left.destroy({ children: true }) });
      gsap.to(right, { x: W + 400, rotation: 1, duration: 0.35, ease: 'power2.in', onComplete: () => right.destroy({ children: true }) });
    });
    const pops: [number, number, number][] = [
      [0.9, 260, 260],
      [1.0, W - 280, 300],
      [1.12, 380, 760],
      [1.22, W - 360, 720],
      [1.3, W / 2 + 470, 180],
      [1.42, W / 2 - 520, 200],
    ];
    for (const [t, x, y] of pops) later(c, t, () => bulb(c, x, y));
    // the rant: he thumps the desk, papers jump, balloons
    for (let i = 0; i < 3; i++)
      later(c, 1.3 + i * 0.22, () => {
        gsap.fromTo(dk, { y: 0 }, { y: 10, duration: 0.05, yoyo: true, repeat: 1 });
        sfx('boom', 1.5 + i * 0.1);
        sfx('hit', 1.0);
        c.shaker.add(0.18);
        word(c, W / 2 + (i % 2 ? 300 : -300), 860, '¡PUM!', 0xffffff, 80, 0.5);
        for (let j = 0; j < 3; j++) {
          const p = sheet(i * 3 + j);
          p.position.set(W / 2 + 460 + (Math.random() - 0.5) * 120, 760);
          c.back.addChild(p);
          gsap.to(p, { y: 420 + Math.random() * 160, x: p.x + (Math.random() - 0.5) * 400, rotation: (Math.random() - 0.5) * 4, duration: 0.45, ease: 'power2.out' });
          gsap.to(p, { y: H + 120, duration: 1.1, delay: 0.45, ease: 'power1.in', onComplete: () => p.destroy() });
        }
      });
    const rant: [number, string, number, number, boolean][] = [
      [1.25, '¡TRÁIGANME FOTOS!', W / 2 - 470, 300, true],
      [1.65, '¡ES UNA AMENAZA!', W / 2 + 470, 250, false],
      [1.95, '¡ESTÁS DESPEDIDO!', W / 2 - 420, 520, true],
    ];
    for (const [t, text, x, y, tr] of rant)
      later(c, t, () => {
        const b = balloon(text, tr);
        b.position.set(x, y);
        b.rotation = (Math.random() - 0.5) * 0.12;
        c.fg.addChild(b);
        gsap.fromTo(b.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.16, ease: 'back.out(3)' });
        gsap.to(b, { alpha: 0, delay: 0.9, duration: 0.25, onComplete: () => b.destroy({ children: true }) });
        sfx('pop', 0.9);
      });
    fall(c, c.back, (i) => sheet(i), { n: 14, over: 1.6, dur: 2.2, spin: 3 });
    later(c, 2.2, () => drizzle(c, c.back, () => sheet(Math.floor(Math.random() * 9)), 0.55, 3.4));
  },
  payoff(c: SigCtx) {
    const st = state.get(c);
    // the headline stamps slam in red ink
    const hits: [string, number, number, number, number, Container][] = [
      ['¡EXTRA!', 330, 470, -0.14, 100, c.fg],
      ['¡EXCLUSIVA!', W / 2, c.CY - 230, 0.08, 80, c.behind],
      ['¡AMENAZA!', W - 420, 650, 0.12, 90, c.fg],
    ];
    hits.forEach(([t, x, y, rot, size, layer], i) =>
      later(c, i * 0.16, () => {
        const s = stamp(t, size);
        s.position.set(x, y);
        s.rotation = rot;
        layer.addChild(s);
        if (!c.reduce) gsap.fromTo(s.scale, { x: 2.4, y: 2.4 }, { x: 1, y: 1, duration: 0.13, ease: 'power3.in' });
        sfx('hit', 0.7 + i * 0.12);
        sfx('boom', 1.1 + i * 0.1);
        c.shaker.add(0.3);
        if (layer === c.fg) gsap.to(s, { alpha: 0, delay: 1.7 - i * 0.1, duration: 0.4, onComplete: () => s.destroy({ children: true }) });
      }),
    );
    if (st && !c.reduce) gsap.fromTo(st.bigPage.scale, { x: 1.06, y: 1.06 }, { x: 1, y: 1, duration: 0.4, ease: 'elastic.out(1.2,0.4)', delay: 0.16 });
    // a last barrage of flashbulbs
    if (!c.reduce) for (let i = 0; i < 4; i++) later(c, 0.5 + i * 0.1, () => bulb(c, 200 + Math.random() * (W - 400), 160 + Math.random() * 300));
    flashOf(c, 0xffffff, 0.4, 0.3);
    score(c, [[0.5, 'fanfare', 1.0]]);
    cheer(c, '¡EXTRA! ¡EXTRA!', RED, 120, 1.9);
    later(c, 1.0, () => word(c, CHEER[0] + 40, CHEER[1] + 110, '…y todavía no pasa nada.', C.ink, 44, 1.8, F.ui));
  },
  card(w: number, h: number, live: boolean) {
    const s = Math.max(0.3, Math.min(w, h) / 1000);
    const k = newsroom(w, h, s);
    const p = page(Math.min(w * 0.62, h * 0.6), h * 0.7, '¡EXTRA! ¡EXTRA!', false);
    p.position.set(w / 2, h * 0.55);
    p.rotation = -0.05;
    k.addChild(p);
    const st = stamp('¡EXCLUSIVA!', 70);
    st.scale.set(Math.min(w, h) / 900);
    st.position.set(w * 0.5, h * 0.82);
    st.rotation = 0.1;
    k.addChild(st);
    if (live) {
      const sheets = new Container();
      k.addChild(sheets);
      const items = Array.from({ length: 5 }, (_, i) => {
        const g = sheet(i);
        g.scale.set(Math.min(w, h) / 1100);
        sheets.addChild(g);
        return { g, x: (i * 0.23 + 0.08) * w, v: 30 + i * 9, ph: i };
      });
      cardLoop(k, 24, (t) => {
        for (const it of items) {
          it.g.position.set(it.x + Math.sin(t * 1.3 + it.ph) * 20, ((t * it.v + it.ph * 90) % (h + 80)) - 40);
          it.g.rotation = Math.sin(t * 2 + it.ph) * 0.6;
        }
      });
    }
    return k;
  },
};
