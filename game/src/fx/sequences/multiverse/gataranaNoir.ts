/**
 * Gato Araña Noir: the noir universe. The film goes black-and-white (grain, scratches, flicker) and an iris opens on a
 * private eye's office at night: a big window behind him, a foggy art-deco city, rain outside and running down the glass,
 * venetian-blind light slanting across the walls. A typewriter narrates — «Era una noche oscura…» — lightning, thunder,
 * «…a las tres de la tarde.», a soaked 1930s front page blows past. Payoff: thunder, car headlights sweep the blinds'
 * stripes across the room and a silent-film title card: NOCHE DE LLUVIA.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, bolt, every, flashOf, later, score } from './kit';
import { cardLoop, hideDisc, typewriter, vignette } from './kitA';

const INK = 0x0c0c0e;
const PAPER = 0xe8e4d6;
const TYPE = { fontFamily: ['Courier New', 'Courier', 'monospace'], fontSize: 38, fill: 0x111111, fontWeight: '700' as const };
/** the window (behind him) */
const WX0 = 500;
const WX1 = 1420;
const WY0 = 110;
const WY1 = 840;

/** the office: dark walls with blind-light stripes, a foggy city in the window, the window's frame and mullions */
function office(w = W, h = H, s = 1, wx0 = WX0, wx1 = WX1, wy0 = WY0, wy1 = WY1): { k: Container; city: Container } {
  const k = new Container();
  k.addChild(new Graphics().rect(0, 0, w, h).fill(0x17181c));
  // the blinds' light on the walls (slanted stripes)
  const st = new Graphics();
  for (let i = -6; i < 30; i++) {
    const x = i * 90 * s;
    st.poly([x, 0, x + 40 * s, 0, x + 40 * s + h * 0.55, h, x + h * 0.55, h]).fill({ color: 0xd8d8d8, alpha: 0.06 });
  }
  k.addChild(st);
  // the city through the window
  const city = new Container();
  const sky = new Graphics();
  const bands = [0x5b5f68, 0x6d717b, 0x80848e, 0x969aa3, 0xaeb2ba];
  bands.forEach((b, i) => sky.rect(wx0, wy0 + (i * (wy1 - wy0)) / bands.length, wx1 - wx0, (wy1 - wy0) / bands.length + 1).fill(b));
  city.addChild(sky);
  const towers = new Graphics();
  const base = wy1;
  const T: [number, number, number, number][] = [
    [0.02, 0.1, 0.42, 0],
    [0.11, 0.08, 0.6, 1],
    [0.2, 0.12, 0.34, 0],
    [0.33, 0.07, 0.78, 2],
    [0.41, 0.11, 0.48, 0],
    [0.54, 0.09, 0.66, 1],
    [0.64, 0.13, 0.4, 0],
    [0.78, 0.08, 0.72, 2],
    [0.87, 0.12, 0.5, 0],
  ];
  const ww = wx1 - wx0;
  const wh = wy1 - wy0;
  for (const [fx, fw, fh, kind] of T) {
    const x = wx0 + fx * ww;
    const tw = fw * ww;
    const th = fh * wh;
    const col = kind === 2 ? 0x34363d : kind === 1 ? 0x41444c : 0x4c4f58;
    // art-deco steps and a spire
    towers.rect(x, base - th, tw, th).fill(col);
    towers.rect(x + tw * 0.15, base - th - th * 0.08, tw * 0.7, th * 0.08).fill(col);
    towers.rect(x + tw * 0.3, base - th - th * 0.15, tw * 0.4, th * 0.07).fill(col);
    if (kind === 2) towers.poly([x + tw * 0.42, base - th - th * 0.15, x + tw * 0.5, base - th - th * 0.38, x + tw * 0.58, base - th - th * 0.15]).fill(col);
    for (let wy = base - th + 14 * s; wy < base - 10; wy += 22 * s)
      for (let wxx = x + 8 * s; wxx < x + tw - 10 * s; wxx += 16 * s) if ((Math.floor(wxx) * 3 + Math.floor(wy) * 7) % 11 < 3) towers.rect(wxx, wy, 6 * s, 9 * s).fill({ color: 0xe8e8e0, alpha: 0.6 });
  }
  // the water tower on the next roof
  towers.rect(wx0 + ww * 0.7, base - wh * 0.12, ww * 0.08, wh * 0.1).fill(0x2a2c31);
  towers.poly([wx0 + ww * 0.69, base - wh * 0.12, wx0 + ww * 0.74, base - wh * 0.18, wx0 + ww * 0.79, base - wh * 0.12]).fill(0x2a2c31);
  city.addChild(towers);
  k.addChild(city);
  // the window frame: sill, mullions, the half-up blinds at the top
  const fr = new Graphics();
  fr.rect(wx0 - 26 * s, wy0 - 26 * s, ww + 52 * s, 26 * s).fill(0x0a0a0c);
  fr.rect(wx0 - 26 * s, wy1, ww + 52 * s, 40 * s).fill(0x0a0a0c);
  fr.rect(wx0 - 26 * s, wy0 - 26 * s, 26 * s, wh + 66 * s).fill(0x0a0a0c);
  fr.rect(wx1, wy0 - 26 * s, 26 * s, wh + 66 * s).fill(0x0a0a0c);
  fr.rect(wx0 + ww / 2 - 9 * s, wy0, 18 * s, wh).fill(0x0a0a0c);
  fr.rect(wx0, wy0 + wh * 0.42, ww, 14 * s).fill(0x0a0a0c);
  for (let i = 0; i < 7; i++) fr.rect(wx0, wy0 + i * 13 * s, ww, 8 * s).fill(0x2b2c31);
  k.addChild(fr);
  // the floor
  const fl = new Graphics().rect(0, h * 0.86, w, h * 0.14).fill(0x101013);
  for (let i = 0; i < 8; i++) fl.moveTo(0, h * 0.86 + i * 22 * s).lineTo(w, h * 0.86 + i * 22 * s).stroke({ width: 2 * s, color: 0x22232a });
  k.addChild(fl);
  return { k, city };
}

/** a soaked 1930s front page */
function frontPage(): Container {
  const k = new Container();
  const g = new Graphics().rect(-180, -230, 360, 460).fill(0xd6d2c4).stroke({ width: 4, color: INK });
  g.rect(-160, -150, 320, 4).fill(INK);
  g.rect(-160, 40, 150, 120).fill(0x55575e);
  g.circle(-85, 100, 26).fill(INK);
  for (let i = 0; i < 8; i++) g.moveTo(-85, 100).lineTo(-85 + Math.cos(i * 0.8) * 52, 100 + Math.sin(i * 0.8) * 44).stroke({ width: 4, color: INK });
  for (let y = 46; y < 200; y += 14) g.rect(10, y, 150, 5).fill(0x8a8a8a);
  for (let y = 172; y < 210; y += 14) g.rect(-160, y, 150, 5).fill(0x8a8a8a);
  k.addChild(g);
  const m = txt('La Voz Gris', { fontFamily: F.news, fontSize: 52, fill: INK });
  m.anchor.set(0.5);
  m.position.set(0, -192);
  const hl = txt('¡ARAÑA EN\nLA CIUDAD!', { fontFamily: F.serif, fontSize: 52, fontWeight: '900', fill: INK, align: 'center', lineHeight: 52 });
  hl.anchor.set(0.5, 0);
  hl.position.set(0, -138);
  k.addChild(m, hl);
  return k;
}

/** a caption box typed by the narrator */
function caption(c: SigCtx, text: string, x: number, y: number, wpx: number, life: number) {
  const b = new Graphics().rect(0, 0, wpx, 74).fill(PAPER).stroke({ width: 4, color: INK });
  b.position.set(x, y);
  c.fg.addChild(b);
  const t = typewriter(c, c.fg, text, x + 20, y + 15, TYPE, 30);
  // the narration steps aside before the rarity stamps over
  later(c, life, () => gsap.to([b, t], { alpha: 0, duration: 0.3, onComplete: () => (b.destroy(), t.destroy()) }));
  return { b, t };
}

interface Noir {
  rain: { k: number };
}
const state = new WeakMap<SigCtx, Noir>();

export const gataranaNoir: Signature = {
  dark: true,
  frame: 0xb8bcc6,
  tag: 'UNIVERSO NOIR',
  open(c: SigCtx) {
    const o = office();
    c.back.addChild(o.k);
    hideDisc(c, 0.1);
    // rain: outside the window (dense) and in the room's dark (faint); drops run down the glass
    const rain = new Graphics();
    c.back.addChild(rain);
    const glass = new Graphics();
    c.back.addChild(glass);
    const R = { k: c.short || c.reduce ? 0.8 : 0.4 };
    state.set(c, { rain: R });
    const drops = Array.from({ length: 160 }, (_, i) => ({ x: (i * 211) % W, y: (i * 97) % H, v: 1500 + ((i * 53) % 700), L: 40 + ((i * 29) % 50) }));
    const runs = Array.from({ length: 22 }, (_, i) => ({ x: WX0 + 20 + ((i * 173) % (WX1 - WX0 - 40)), y0: WY0 + ((i * 89) % 300), v: 60 + ((i * 41) % 120) }));
    const grain = new Graphics();
    const vg = vignette(W, H, 0x000000, 0.75, 7);
    c.fg.addChild(vg, grain);
    const drawRain = (t: number) => {
      if (rain.destroyed) return;
      rain.clear();
      const n = Math.floor(drops.length * R.k);
      // two strokes per frame: the dense rain in the window, the faint rain in the room
      for (const want of [true, false]) {
        let any = false;
        for (let i = 0; i < n; i++) {
          const d = drops[i];
          const y = ((d.y + t * d.v) % (H + 100)) - 60;
          const x = (d.x + y * 0.22) % W;
          const inside = x > WX0 && x < WX1 && y > WY0 && y < WY1;
          if (inside !== want) continue;
          rain.moveTo(x, y).lineTo(x + d.L * 0.22, y + d.L);
          any = true;
        }
        if (any) rain.stroke({ width: want ? 3 : 2, color: 0xe6e6ea, alpha: want ? 0.55 : 0.16 });
      }
      glass.clear();
      for (const r of runs) {
        const y = WY0 + ((r.y0 - WY0 + t * r.v) % (WY1 - WY0));
        glass.moveTo(r.x, y - 30).lineTo(r.x + 2, y);
      }
      glass.stroke({ width: 3, color: 0xf2f2f2, alpha: 0.4 });
      for (const r of runs) glass.circle(r.x + 2, WY0 + ((r.y0 - WY0 + t * r.v) % (WY1 - WY0)) + 3, 5);
      glass.fill({ color: 0xf8f8f8, alpha: 0.6 });
    };
    const drawGrain = () => {
      if (grain.destroyed) return;
      grain.clear();
      for (let i = 0; i < 26; i++) grain.circle(Math.random() * W, Math.random() * H, 1 + Math.random() * 3).fill({ color: Math.random() < 0.5 ? 0xffffff : 0x000000, alpha: 0.35 });
      if (Math.random() < 0.6) {
        const x = Math.random() * W;
        grain.rect(x, 0, 2, H).fill({ color: 0xffffff, alpha: 0.12 });
      }
    };
    // a soft pale light right behind him (the window's glow) so the silhouette cuts sharp
    const glow = new Graphics();
    for (let i = 6; i >= 1; i--) glow.ellipse(W / 2, c.catY + 40, 200 + i * 40, 260 + i * 40).fill({ color: 0xdfe2e8, alpha: 0.06 });
    c.behind.addChild(glow);
    if (c.reduce) {
      drawRain(0);
      drawGrain();
      return;
    }
    every(c, 40, drawRain);
    every(c, 12, () => {
      drawGrain();
      if (c.flashes && !o.k.destroyed) o.k.alpha = 0.9 + Math.random() * 0.1;
    });
    if (c.short) return;

    // the iris opens on him
    const iris = new Graphics();
    c.fg.addChild(iris);
    const I = { r: 300 };
    const drawIris = () => {
      if (iris.destroyed) return;
      iris.clear().rect(0, 0, W, H).fill(INK).circle(W / 2, c.CY, I.r).cut();
    };
    drawIris();
    gsap.to(I, { r: 1200, duration: 0.7, ease: 'power2.in', onUpdate: drawIris, onComplete: () => iris.destroy() });
    gsap.to(R, { k: 1, duration: 1.0 });
    // the narrator
    later(c, 0.3, () => caption(c, 'Era una noche oscura…', 70, 140, 560, 2.85));
    later(c, 1.08, () => {
      // lightning in the window, thunder
      const lb = new Graphics();
      bolt(lb, WX0 + 620, WY0, WX0 + 520, WY0 + 380, 0xffffff, 7, 9, 60);
      bolt(lb, WX0 + 560, WY0 + 200, WX0 + 700, WY0 + 320, 0xffffff, 4, 5, 40);
      c.back.addChildAt(lb, c.back.children.indexOf(rain));
      gsap.to(lb, { alpha: 0, duration: 0.25, delay: 0.12, onComplete: () => lb.destroy() });
      flashOf(c, 0xffffff, 0.8, 0.35);
      if (!c.flashes) {
        // Reducir destellos: the city brightens a moment instead
        gsap.fromTo(o.city, { alpha: 1.0 }, { alpha: 0.6, duration: 0.2, yoyo: true, repeat: 1 });
      }
      sfx('boom', 0.45);
      sfx('bigboom', 0.5);
      c.shaker.add(0.3);
    });
    later(c, 1.25, () => caption(c, '…a las tres de la tarde.', W - 700, 820, 620, 1.9));
    later(c, 1.95, () => sfx('sting', 0.75));
    // a soaked front page blows in and slaps flat on the lens (the headline, legible), then slides off
    later(c, 1.4, () => {
      const p = frontPage();
      p.position.set(W + 300, 160);
      p.rotation = 1.2;
      p.scale.set(0.5);
      c.fg.addChild(p);
      gsap.to(p, { x: 400, y: 450, rotation: -0.12, duration: 0.3, ease: 'power2.out' });
      gsap.to(p.scale, { x: 1.05, y: 1.05, duration: 0.3, ease: 'power2.out' });
      later(c, 0.3, () => {
        sfx('paper', 0.7);
        sfx('splash', 1.2);
        c.shaker.add(0.12);
      });
      gsap.to(p, { y: H + 380, rotation: 0.3, duration: 0.55, delay: 0.95, ease: 'power2.in', onComplete: () => p.destroy({ children: true }) });
      sfx('whoosh', 0.7);
    });
    score(c, [
      [0.0, 'splash', 0.35],
      [0.05, 'whoosh', 0.45],
    ]);
  },
  payoff(c: SigCtx) {
    // thunder; car headlights sweep the blinds' stripes across the room
    sfx('bigboom', 0.42);
    sfx('sting', 0.6);
    flashOf(c, 0xffffff, 0.55, 0.5);
    c.shaker.add(0.25);
    const bars = new Graphics();
    for (let i = 0; i < 9; i++) bars.poly([i * 120, 0, i * 120 + 60, 0, i * 120 + 60 - 300, H, i * 120 - 300, H]).fill({ color: 0xffffff, alpha: 0.13 });
    bars.position.set(-1400, 0);
    c.fg.addChild(bars);
    if (c.reduce) {
      bars.x = 300;
      later(c, 1.0, () => bars.destroy());
    } else gsap.to(bars, { x: W + 300, duration: 1.4, ease: 'power1.inOut', onComplete: () => bars.destroy() });
    const st = state.get(c);
    if (st && !c.reduce) gsap.to(st.rain, { k: 1, duration: 0.2 });
    // the title card, silent-film style
    const card = new Container();
    const t = txt('NOCHE DE LLUVIA.', { fontFamily: F.serif, fontSize: 68, fontStyle: 'italic', fontWeight: '700', fill: 0xf4f2ea, letterSpacing: 3 });
    t.anchor.set(0.5);
    const bw = t.width + 90;
    const bh = t.height + 60;
    const g = new Graphics().rect(-bw / 2, -bh / 2, bw, bh).fill({ color: INK, alpha: 0.92 });
    g.rect(-bw / 2 + 10, -bh / 2 + 10, bw - 20, bh - 20).stroke({ width: 3, color: 0xf4f2ea });
    g.rect(-bw / 2 + 18, -bh / 2 + 18, bw - 36, bh - 36).stroke({ width: 1.5, color: 0xf4f2ea });
    for (const [sx, sy] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ])
      g.poly([sx * (bw / 2 - 18), sy * (bh / 2 - 30), sx * (bw / 2 - 6), sy * (bh / 2 - 18), sx * (bw / 2 - 18), sy * (bh / 2 - 6), sx * (bw / 2 - 30), sy * (bh / 2 - 18)]).fill(0xf4f2ea);
    card.addChild(g, t);
    const fit = Math.min(1, 720 / bw);
    card.scale.set(fit);
    card.position.set(430, 700);
    card.rotation = -0.03;
    c.fg.addChild(card);
    if (!c.reduce) gsap.from(card, { alpha: 0, duration: 0.25 });
    gsap.to(card, { alpha: 0, delay: 2.1, duration: 0.4, onComplete: () => card.destroy({ children: true }) });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const s = Math.min(w, h) / 1000;
    const half = Math.min(w * 0.34, h * 0.62);
    const wx0 = w / 2 - half;
    const wx1 = w / 2 + half;
    const wy0 = h * 0.1;
    const wy1 = h * 0.78;
    k.addChild(office(w, h, Math.max(0.3, s * 1.4), wx0, wx1, wy0, wy1).k);
    const rain = new Graphics();
    k.addChild(rain);
    k.addChild(vignette(w, h, 0x000000, 0.7, 5));
    const drops = Array.from({ length: 50 }, (_, i) => ({ x: (i * 97) % w, y: (i * 61) % h, v: 300 + ((i * 37) % 200) }));
    const draw = (t: number) => {
      rain.clear();
      for (const d of drops) {
        const y = ((d.y + t * d.v) % (h + 30)) - 15;
        const x = (d.x + y * 0.2) % w;
        rain.moveTo(x, y).lineTo(x + 3 * s * 10, y + 14 * s * 10);
      }
      rain.stroke({ width: Math.max(1, 2 * s * 2), color: 0xe6e6ea, alpha: 0.45 });
    };
    draw(0);
    if (live) cardLoop(k, 24, draw);
    return k;
  },
};
