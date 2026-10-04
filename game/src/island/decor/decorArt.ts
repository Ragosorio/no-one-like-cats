/**
 * Shop decorations, drawn in code (poster flat color + ink + halftone). Multiverse: each piece keeps
 * the style of its dimension (Cozy, Noir, Neón, Manga, Orquídea, Anime, Póster retro…).
 * Origin = ground point at the footprint center. `tick(t)` animates (characters "on twos").
 */
import { BlurFilter, Container, Graphics, Sprite, Text } from 'pixi.js';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { glowTexture } from '../../art/textures';

export interface DecorArt {
  c: Container;
  tick?: (t: number) => void;
  /** px above origin where a name tag / bubble should sit */
  top: number;
}

const INK = { width: 3, color: C.ink, join: 'round' as const, cap: 'round' as const };
const THIN = { width: 2, color: C.ink, join: 'round' as const, cap: 'round' as const };
const twos = (t: number) => Math.floor(t * 12) / 12;

function shadow(g: Graphics, rx: number, ry = rx * 0.42, y = 2) {
  g.ellipse(0, y, rx, ry).fill({ color: C.ink, alpha: 0.2 });
}
/** iso box on a diamond footprint of half-width a (screen px), height h, lifted by `lift` */
function isoBox(g: Graphics, a: number, h: number, top: number, left: number, right: number, lift = 0, x = 0) {
  const b = a / 2;
  const y0 = -lift;
  g.poly([x - a, y0, x, y0 + b, x, y0 + b - h, x - a, y0 - h]).fill(left).stroke(INK);
  g.poly([x, y0 + b, x + a, y0, x + a, y0 - h, x, y0 + b - h]).fill(right).stroke(INK);
  g.poly([x - a, y0 - h, x, y0 + b - h, x + a, y0 - h, x, y0 - b - h]).fill(top).stroke(INK);
}
function glow(c: Container, color: number, x: number, y: number, sx: number, sy = sx, alpha = 0.55, add = true) {
  const s = new Sprite(glowTexture());
  s.anchor.set(0.5);
  s.tint = color;
  s.alpha = alpha;
  s.scale.set(sx, sy);
  s.position.set(x, y);
  if (add) s.blendMode = 'add';
  c.addChild(s);
  return s;
}
function halftone(g: Graphics, x0: number, y0: number, w: number, h: number, color: number, step = 6, r = 1.4, alpha = 0.35) {
  for (let y = y0; y < y0 + h; y += step)
    for (let x = x0 + ((y - y0) / step) % 2 * (step / 2); x < x0 + w; x += step) g.circle(x, y, r);
  g.fill({ color, alpha });
}
/** classic sitting cat silhouette, feet at (x, y), height ≈ 70·s */
function sittingCat(g: Graphics, x: number, y: number, s: number, fill: number, shade: number, o: { tail?: boolean; stroke?: typeof INK } = {}) {
  const st = o.stroke ?? INK;
  if (o.tail !== false)
    g.moveTo(x + 16 * s, y - 4 * s).quadraticCurveTo(x + 38 * s, y - 6 * s, x + 32 * s, y - 30 * s).stroke({ width: 9 * s + 3, color: C.ink, cap: 'round' })
      .moveTo(x + 16 * s, y - 4 * s).quadraticCurveTo(x + 38 * s, y - 6 * s, x + 32 * s, y - 30 * s).stroke({ width: 9 * s, color: fill, cap: 'round' });
  g.ellipse(x, y - 22 * s, 20 * s, 24 * s).fill(fill).stroke(st);
  g.ellipse(x - 6 * s, y - 16 * s, 8 * s, 14 * s).fill(shade);
  g.poly([x - 15 * s, y - 52 * s, x - 13 * s, y - 72 * s, x - 3 * s, y - 60 * s]).fill(fill).stroke(st);
  g.poly([x + 15 * s, y - 52 * s, x + 13 * s, y - 72 * s, x + 3 * s, y - 60 * s]).fill(fill).stroke(st);
  g.circle(x, y - 52 * s, 15 * s).fill(fill).stroke(st);
  g.ellipse(x - 7 * s, y - 2 * s, 7 * s, 4 * s).fill(fill).stroke(st);
  g.ellipse(x + 7 * s, y - 2 * s, 7 * s, 4 * s).fill(fill).stroke(st);
}
function label(text: string, size: number, fill: number, font: string = F.poster, extra: Record<string, unknown> = {}): Text {
  const t = txt(text, { fontFamily: font, fontSize: size, fill, ...extra });
  t.anchor.set(0.5);
  return t;
}
/** stone/marble pedestal (iso box), returns its top y */
function pedestal(g: Graphics, a: number, h: number, top: number, left: number, right: number) {
  isoBox(g, a, h, top, left, right);
  return -h;
}

export function decorArt(id: string): DecorArt {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  switch (id) {
    // ================================================================ COZY
    case 'caja_legendaria': {
      shadow(g, 40);
      isoBox(g, 36, 34, 0x8a5a2e, 0xc68a4e, 0xb07440);
      // open flaps
      g.poly([-36, -34, -48, -48, -14, -60, 0, -52]).fill(0xd9a066).stroke(THIN);
      g.poly([36, -34, 48, -48, 14, -60, 0, -52]).fill(0xe0ad73).stroke(THIN);
      g.moveTo(-24, -10).lineTo(-12, -4).stroke({ width: 5, color: 0xe8c48c });
      const stamp = label('FRÁGIL', 11, C.red, F.poster, { letterSpacing: 1 });
      stamp.position.set(18, -14);
      stamp.skew.set(0, -0.46);
      c.addChild(stamp);
      const head = new Container();
      const hg = new Graphics();
      hg.circle(0, 0, 15).fill(0x2a2226).stroke(INK);
      hg.poly([-13, -6, -12, -22, -3, -12]).fill(0x2a2226).stroke(THIN);
      hg.poly([13, -6, 12, -22, 3, -12]).fill(0x2a2226).stroke(THIN);
      const eyes = new Graphics();
      head.addChild(hg, eyes);
      head.position.set(0, -46);
      c.addChildAt(head, 0);
      c.setChildIndex(head, 1);
      // front flap drawn over the head
      const front = new Graphics().poly([-36, -34, 0, -17, 36, -34, 0, -26]).fill(0x8a5a2e).stroke(THIN);
      c.addChild(front);
      return {
        c,
        top: 70,
        tick: (t) => {
          const k = twos(t);
          head.y = -46 - Math.max(0, Math.sin(k * 1.3)) * 10;
          const blink = (k * 0.7) % 3.2 < 0.12;
          eyes.clear();
          if (blink) eyes.moveTo(-8, 0).lineTo(-2, 0).moveTo(2, 0).lineTo(8, 0).stroke({ width: 2, color: C.yellow });
          else eyes.circle(-5, -1, 3.2).circle(5, -1, 3.2).fill(C.yellow).circle(-5, -1, 1.3).circle(5, -1, 1.3).fill(C.ink);
        },
      };
    }
    case 'ovillo_gigante': {
      shadow(g, 38);
      g.moveTo(24, -6).bezierCurveTo(50, 0, 40, 18, 62, 14).stroke({ width: 5, color: C.ink, cap: 'round' }).moveTo(24, -6).bezierCurveTo(50, 0, 40, 18, 62, 14).stroke({ width: 3, color: 0xff7ab8, cap: 'round' });
      const ball = new Container();
      const bg = new Graphics();
      bg.circle(0, 0, 32).fill(0xff7ab8).stroke(INK);
      for (let i = 0; i < 6; i++) {
        const a = -0.9 + i * 0.36;
        bg.arc(-20 + i * 2, 0, 26 + i * 3, a - 0.9, a + 0.9).stroke({ width: 2.5, color: 0xd94f8e, cap: 'round' });
      }
      for (let i = 0; i < 4; i++) bg.arc(18, -10, 10 + i * 6, 2.2, 3.9).stroke({ width: 2, color: 0xffb3d6, cap: 'round' });
      bg.circle(-10, -14, 6).fill({ color: 0xffffff, alpha: 0.35 });
      ball.addChild(bg);
      ball.position.set(0, -30);
      // needles
      g.moveTo(-6, -40).lineTo(-34, -82).stroke({ width: 4, color: C.ink, cap: 'round' }).moveTo(-6, -40).lineTo(-34, -82).stroke({ width: 2, color: 0xffc94a, cap: 'round' });
      g.moveTo(4, -42).lineTo(22, -86).stroke({ width: 4, color: C.ink, cap: 'round' }).moveTo(4, -42).lineTo(22, -86).stroke({ width: 2, color: 0x7fd8ff, cap: 'round' });
      g.circle(-34, -82, 4).fill(0xffc94a).stroke(THIN).circle(22, -86, 4).fill(0x7fd8ff).stroke(THIN);
      c.addChild(ball);
      return { c, top: 90, tick: (t) => (ball.rotation = Math.sin(twos(t) * 1.6) * 0.06) };
    }
    case 'fogata': {
      shadow(g, 36, 15);
      const gl = glow(c, C.orange, 0, -20, 1.1, 0.8, 0.5);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.ellipse(Math.cos(a) * 28, Math.sin(a) * 12 - 2, 9, 6).fill(i % 2 ? 0x9a9384 : 0x8a8476).stroke(THIN);
      }
      g.poly([-24, -2, 20, -12, 24, -6, -20, 4]).fill(0x8a5a2e).stroke(THIN);
      g.poly([-20, -12, 24, -2, 20, 4, -24, -6]).fill(0x6a4325).stroke(THIN);
      const fl = new Graphics();
      const embers = new Graphics();
      c.addChild(fl, embers);
      let last = -1;
      return {
        c,
        top: 80,
        tick: (t) => {
          const k = Math.floor(t * 12);
          gl.alpha = 0.42 + Math.sin(t * 9) * 0.08 + Math.sin(t * 23) * 0.05;
          if (k === last) return;
          last = k;
          const j = (n: number) => Math.sin(k * 1.7 + n * 2.3) * 4;
          fl.clear();
          fl.moveTo(-18, -6).quadraticCurveTo(-22 + j(1), -30, -6 + j(2), -58 + j(3)).quadraticCurveTo(-2, -36, 4 + j(4), -66 + j(5)).quadraticCurveTo(10, -38, 16 + j(6), -48).quadraticCurveTo(22, -20, 18, -6).closePath().fill(C.orange).stroke(INK);
          fl.moveTo(-10, -6).quadraticCurveTo(-12, -24, -2 + j(7), -42).quadraticCurveTo(4, -26, 8 + j(8), -38).quadraticCurveTo(14, -18, 10, -6).closePath().fill(C.yellow);
          fl.ellipse(0, -12, 5, 7).fill(0xfff3b0);
          embers.clear();
          for (let i = 0; i < 4; i++) {
            const p = ((t * 0.7 + i * 0.27) % 1);
            embers.circle(Math.sin(i * 4 + p * 6) * 14, -40 - p * 60, 2.4 * (1 - p)).fill(i % 2 ? C.yellow : C.orange);
          }
        },
      };
    }
    case 'rascador_gigante': {
      shadow(g, 40);
      isoBox(g, 36, 14, 0xc6f0e4, 0xa7e8d7, 0x8fd6c3);
      // post with rope
      g.rect(-9, -110, 18, 98).fill(0xe8c48c).stroke(INK);
      for (let y = -106; y < -16; y += 7) g.moveTo(-9, y + 5).lineTo(9, y).stroke({ width: 1.6, color: 0xb98348 });
      isoBox(g, 26, 8, 0xff7ab8, 0xe8879a, 0xd06a80, 60);
      // second post upper
      g.rect(10, -150, 12, 50).fill(0xe8c48c).stroke(INK);
      for (let y = -146; y < -104; y += 7) g.moveTo(10, y + 4).lineTo(22, y).stroke({ width: 1.6, color: 0xb98348 });
      isoBox(g, 24, 10, 0xc6f0e4, 0xa7e8d7, 0x8fd6c3, 112, 14);
      // little bed on top
      g.ellipse(14, -128, 16, 6).fill(0x5c3d5b).stroke(THIN);
      const toy = new Container();
      const tg = new Graphics();
      tg.moveTo(0, 0).lineTo(0, 26).stroke({ width: 1.6, color: C.ink });
      tg.circle(0, 30, 6).fill(C.yellow).stroke(THIN);
      toy.addChild(tg);
      toy.position.set(-20, -68);
      c.addChild(toy);
      return { c, top: 160, tick: (t) => (toy.rotation = Math.sin(t * 2.4) * 0.35) };
    }
    // ================================================================ PIRATA
    case 'barril_sardinas': {
      shadow(g, 30);
      g.moveTo(-24, -6).quadraticCurveTo(-30, -30, -24, -56).lineTo(24, -56).quadraticCurveTo(30, -30, 24, -6).quadraticCurveTo(0, 4, -24, -6).closePath().fill(0xb98348).stroke(INK);
      for (const x of [-12, 0, 12]) g.moveTo(x, -54).quadraticCurveTo(x * 1.25, -30, x, -2).stroke({ width: 1.6, color: 0x8a5a2e });
      for (const y of [-14, -46]) g.moveTo(-26, y).quadraticCurveTo(0, y + 9, 26, y).stroke({ width: 5, color: 0x5a5a64 }).moveTo(-26, y).quadraticCurveTo(0, y + 9, 26, y).stroke({ width: 1.2, color: C.ink });
      g.ellipse(0, -56, 24, 9).fill(0x5a3a1e).stroke(INK);
      const lbl = new Graphics().rect(-16, -36, 32, 14).fill(C.paper).stroke(THIN);
      c.addChild(lbl);
      const lt = label('SARDINAS', 7.5, C.ink, F.poster);
      lt.position.set(0, -29);
      c.addChild(lt);
      const fishes = new Graphics();
      c.addChild(fishes);
      const tail = (fg: Graphics, x: number, y: number, a: number) => {
        const ca = Math.cos(a), sa = Math.sin(a);
        const P = (px: number, py: number) => [x + px * ca - py * sa, y + px * sa + py * ca];
        fg.poly([...P(-3, 0), ...P(3, 0), ...P(4, -12), ...P(9, -20), ...P(0, -15), ...P(-9, -20), ...P(-4, -12)]).fill(0xc9d6e2).stroke(THIN);
      };
      return {
        c,
        top: 80,
        tick: (t) => {
          const k = twos(t);
          fishes.clear();
          tail(fishes, -10, -58, -0.35);
          tail(fishes, 9, -59, 0.3 + Math.sin(k * 5) * (Math.sin(k * 0.8) > 0.6 ? 0.25 : 0));
          tail(fishes, 0, -62, 0.05);
        },
      };
    }
    case 'ancla_oxidada': {
      shadow(g, 34);
      const rust = 0x8a5a3c;
      // arms (half buried)
      g.moveTo(-34, -4).quadraticCurveTo(0, 22, 34, -4).stroke({ width: 13, color: C.ink, cap: 'round' }).moveTo(-34, -4).quadraticCurveTo(0, 22, 34, -4).stroke({ width: 8, color: rust, cap: 'round' });
      g.poly([-40, -14, -30, -2, -42, 0]).fill(rust).stroke(THIN);
      g.poly([40, -14, 30, -2, 42, 0]).fill(rust).stroke(THIN);
      g.rect(-6, -92, 12, 96).fill(rust).stroke(INK);
      g.rect(-24, -80, 48, 9).fill(0x6e4530).stroke(INK);
      g.circle(0, -102, 11).stroke({ width: 9, color: C.ink }).circle(0, -102, 11).stroke({ width: 5, color: rust });
      for (const [x, y, r] of [[-2, -60, 3], [3, -30, 2.5], [-18, -76, 2], [16, -76, 2.2]]) g.circle(x, y, r).fill(0x5a3a28);
      // rope
      g.moveTo(6, -98).bezierCurveTo(26, -80, -14, -60, 8, -40).bezierCurveTo(22, -28, 2, -14, 14, 2).stroke({ width: 6, color: C.ink, cap: 'round' })
        .moveTo(6, -98).bezierCurveTo(26, -80, -14, -60, 8, -40).bezierCurveTo(22, -28, 2, -14, 14, 2).stroke({ width: 3.5, color: 0xe8d3a6, cap: 'round' });
      halftone(g, -6, -88, 12, 80, C.ink, 5, 1, 0.25);
      return { c, top: 120 };
    }
    case 'bandera_pirata': {
      shadow(g, 20);
      g.ellipse(0, 0, 12, 6).fill(0x6a4325).stroke(THIN);
      g.rect(-3, -128, 6, 128).fill(0x6a4325).stroke(INK);
      g.circle(0, -132, 5).fill(C.yellow).stroke(THIN);
      const flag = new Graphics();
      const skull = new Container();
      const sg = new Graphics();
      // cat skull + fish bones
      sg.poly([-11, -8, -9, -20, -3, -12]).fill(C.paper).stroke(THIN);
      sg.poly([11, -8, 9, -20, 3, -12]).fill(C.paper).stroke(THIN);
      sg.circle(0, -4, 11).fill(C.paper).stroke(THIN);
      sg.ellipse(-4, -5, 3, 3.6).fill(C.ink).ellipse(4, -5, 3, 3.6).fill(C.ink);
      sg.poly([-1.5, 1, 1.5, 1, 0, 3]).fill(C.ink);
      for (const s of [-1, 1]) {
        sg.moveTo(-16 * s, 8).lineTo(16 * s, 20).stroke({ width: 3, color: C.paper, cap: 'round' });
        for (let k = 0; k < 4; k++) {
          const px = -16 * s + (32 * s * (k + 1)) / 5;
          const py = 8 + (12 * (k + 1)) / 5;
          sg.moveTo(px, py - 4).lineTo(px, py + 4).stroke({ width: 2, color: C.paper });
        }
      }
      skull.addChild(sg);
      c.addChild(flag, skull);
      let last = -1;
      return {
        c,
        top: 140,
        tick: (t) => {
          const k = Math.floor(t * 12);
          if (k === last) return;
          last = k;
          const ph = k / 12;
          const W = 66;
          const pts: number[] = [];
          const wave = (x: number) => Math.sin(ph * 6 - x * 0.09) * (x / W) * 7;
          for (let x = 0; x <= W; x += 6) pts.push(3 + x, -124 + wave(x));
          for (let x = W; x >= 0; x -= 6) pts.push(3 + x, -80 + wave(x) + (x / W) * 3);
          flag.clear().poly(pts).fill(0x171317).stroke({ width: 2.5, color: C.ink });
          flag.poly(pts.slice(0, 4).concat([pts[2], pts[3] + 4, pts[0], pts[1] + 4])).fill({ color: C.red, alpha: 0.9 });
          skull.position.set(36, -102 + wave(33));
          skull.rotation = Math.sin(ph * 6 - 3) * 0.06;
        },
      };
    }
    case 'cofre_tesoro': {
      shadow(g, 40);
      glow(c, C.yellow, 0, -40, 0.9, 0.7, 0.45);
      // open lid behind
      g.poly([-32, -42, -28, -70, 28, -78, 32, -50]).fill(0x8a5a2e).stroke(INK);
      g.poly([-26, -66, 26, -74, 26, -68, -26, -60]).fill(0x5a3a1e);
      // coins heap
      for (const [x, y, r] of [[-18, -44, 9], [-4, -50, 10], [12, -46, 9], [22, -40, 8], [-24, -36, 7], [4, -40, 9]]) g.circle(x, y, r).fill(C.yellow).stroke(THIN).circle(x - 2, y - 2, r * 0.35).fill({ color: 0xffffff, alpha: 0.5 });
      g.poly([-6, -60, 0, -70, 6, -60, 0, -52]).fill(C.pinkHot).stroke(THIN);
      g.poly([14, -56, 19, -64, 24, -56, 19, -50]).fill(C.cyan).stroke(THIN);
      // box
      g.poly([-34, -40, 34, -40, 30, 0, -30, 0]).fill(0xb98348).stroke(INK);
      g.rect(-34, -40, 68, 8).fill(0x5a5a64).stroke(THIN);
      g.rect(-5, -30, 10, 12).fill(C.yellow).stroke(THIN);
      for (const x of [-20, 20]) g.moveTo(x, -32).lineTo(x * 0.92, 0).stroke({ width: 4, color: 0x5a5a64 });
      // spilled coins
      for (const [x, y] of [[38, 2], [46, -4], [-40, 4]]) g.ellipse(x, y, 7, 3.5).fill(C.yellow).stroke(THIN);
      const glints = new Graphics();
      c.addChild(glints);
      return {
        c,
        top: 90,
        tick: (t) => {
          glints.clear();
          const spots = [[-10, -62], [16, -58], [24, -44], [-22, -48]];
          spots.forEach(([x, y], i) => {
            const p = ((t * 0.9 + i * 0.37) % 1.6) / 1.6;
            if (p < 0.25) {
              const s = Math.sin((p / 0.25) * Math.PI) * 7;
              glints.star(x, y, 4, s, s * 0.25).fill(0xffffff);
            }
          });
        },
      };
    }
    // ================================================================ NEÓN / NOIR
    case 'farol_noir': {
      const fog = new Graphics();
      halftone(fog, -40, -8, 80, 16, 0x3569a3, 5, 1.6, 0.35);
      c.addChildAt(fog, 0);
      shadow(g, 18);
      const lamp = glow(c, C.yellow, 0, -112, 1.15, 1.15, 0.6);
      g.ellipse(0, -2, 12, 5).fill(0x172b35).stroke(THIN);
      g.rect(-4, -98, 8, 96).fill(0x1c3a51).stroke(INK);
      g.moveTo(0, -60).bezierCurveTo(14, -64, 14, -80, 4, -86).stroke({ width: 3, color: 0x172b35 });
      g.poly([-14, -100, 14, -100, 10, -96, -10, -96]).fill(0x172b35).stroke(THIN);
      g.poly([-12, -96, 12, -96, 9, -126, -9, -126]).fill(0xffe08a).stroke(INK);
      g.moveTo(0, -96).lineTo(0, -126).stroke({ width: 2, color: 0x172b35 });
      g.poly([-16, -126, 16, -126, 0, -142]).fill(0x172b35).stroke(INK);
      g.circle(0, -145, 4).fill(0x172b35).stroke(THIN);
      return {
        c,
        top: 150,
        tick: (t) => {
          const f = Math.sin(t * 1.3) > 0.97 ? 0.25 : 0.6 + Math.sin(t * 7) * 0.04;
          lamp.alpha = f;
        },
      };
    }
    case 'letrero_neon': {
      shadow(g, 30);
      const gw = glow(c, C.pinkHot, 0, -74, 1.4, 0.9, 0.5);
      g.rect(-34, -50, 5, 50).fill(0x3a3a44).stroke(THIN).rect(29, -50, 5, 50).fill(0x3a3a44).stroke(THIN);
      g.rect(-52, -106, 104, 58).fill(0x0d110f).stroke(INK);
      g.rect(-48, -102, 96, 50).stroke({ width: 1.5, color: 0x3a3a44 });
      const miau = label('MIAU', 26, 0xff7ab8, F.poster, { stroke: { color: C.pinkHot, width: 2 }, letterSpacing: 2 });
      miau.position.set(-4, -86);
      const h24 = label('24H', 16, C.cyan, F.bebas, { letterSpacing: 3 });
      h24.position.set(0, -62);
      const fx = new BlurFilter({ strength: 3 });
      const halo = label('MIAU', 26, C.pinkHot, F.poster, { letterSpacing: 2 });
      halo.position.copyFrom(miau.position);
      halo.filters = [fx];
      halo.blendMode = 'add';
      const ears = new Graphics();
      ears.poly([30, -96, 33, -104, 37, -97]).stroke({ width: 2, color: C.cyan }).poly([38, -97, 42, -104, 45, -96]).stroke({ width: 2, color: C.cyan }).circle(37.5, -91, 6).stroke({ width: 2, color: C.cyan });
      c.addChild(halo, miau, h24, ears);
      return {
        c,
        top: 120,
        tick: (t) => {
          const k = Math.floor(t * 12);
          const off = (k % 37 === 0 || k % 37 === 2) ? 0.15 : 1;
          h24.alpha = off;
          ears.alpha = k % 53 < 2 ? 0.2 : 1;
          const p = 0.85 + Math.sin(t * 3) * 0.1;
          miau.alpha = p;
          halo.alpha = p * 0.9;
          gw.alpha = 0.4 * p;
        },
      };
    }
    case 'holo_pez': {
      shadow(g, 26);
      isoBox(g, 22, 22, 0x2a3540, 0x1c2630, 0x141c24);
      g.poly([-22, -16, 0, -5, 0, -9, -22, -20]).fill(C.cyan);
      g.ellipse(0, -24, 8, 4).fill(C.cyan).stroke(THIN);
      const beam = new Graphics().poly([-6, -24, 6, -24, 26, -100, -26, -100]).fill({ color: C.cyan, alpha: 0.12 });
      beam.blendMode = 'add';
      const fish = new Container();
      const fg = new Graphics();
      fg.moveTo(-26, 0).quadraticCurveTo(-4, -20, 18, -2).quadraticCurveTo(-4, 16, -26, 0).closePath().fill({ color: C.cyan, alpha: 0.28 }).stroke({ width: 2.5, color: C.cyan });
      fg.poly([18, -2, 32, -14, 30, 0, 32, 12]).fill({ color: C.cyan, alpha: 0.28 }).stroke({ width: 2.5, color: C.cyan });
      fg.circle(-16, -3, 2.5).fill(0xffffff);
      fg.moveTo(-6, -10).quadraticCurveTo(-2, 0, -6, 8).stroke({ width: 1.5, color: C.cyan });
      for (let y = -12; y < 14; y += 4) fg.moveTo(-28, y).lineTo(34, y).stroke({ width: 1, color: C.cyan, alpha: 0.25 });
      fish.addChild(fg);
      fish.blendMode = 'add';
      glow(c, C.cyan, 0, -70, 0.9, 0.9, 0.35);
      c.addChild(beam, fish);
      return {
        c,
        top: 110,
        tick: (t) => {
          fish.position.set(Math.sin(t * 13) > 0.96 ? 4 : 0, -70 + Math.sin(t * 1.8) * 6);
          fish.scale.x = Math.cos(t * 0.6) >= 0 ? 1 : -1;
          fish.alpha = 0.75 + Math.sin(t * 20) * 0.1;
        },
      };
    }
    case 'arcade': {
      shadow(g, 34);
      const side = 0x6a44cc;
      g.poly([-30, 0, 0, 15, 0, -96, -30, -110]).fill(side).stroke(INK);
      g.poly([0, 15, 30, 0, 30, -110, 0, -96]).fill(0x8a5cff).stroke(INK);
      g.poly([-30, -110, 0, -96, 30, -110, 0, -124]).fill(0x5a38aa).stroke(INK);
      // screen (on the front-right face)
      g.poly([4, -38, 26, -49, 26, -86, 4, -76]).fill(0x0d110f).stroke(THIN);
      // control deck
      g.poly([0, -24, 30, -40, 34, -34, 4, -18]).fill(0x3a2a6a).stroke(THIN);
      g.circle(12, -27, 3).fill(C.pinkHot).stroke({ width: 1, color: C.ink }).circle(20, -31, 3).fill(C.yellow).stroke({ width: 1, color: C.ink });
      g.moveTo(26, -36).lineTo(26, -44).stroke({ width: 2, color: C.ink }).circle(26, -45, 3).fill(C.red);
      // marquee
      g.poly([2, -92, 28, -105, 28, -114, 2, -101]).fill(C.pinkHot).stroke(THIN);
      g.poly([-28, -106, -2, -94, -2, -40, -28, -52]).fill({ color: 0xffffff, alpha: 0.08 });
      const mq = label('CATSTLE', 8, C.paper, F.poster, { letterSpacing: 1 });
      mq.position.set(15, -103);
      mq.skew.set(0, -0.46);
      const scr = new Graphics();
      scr.blendMode = 'add';
      c.addChild(mq, scr);
      glow(c, C.cyan, 15, -62, 0.45, 0.45, 0.35);
      let last = -1;
      return {
        c,
        top: 130,
        tick: (t) => {
          const k = Math.floor(t * 6);
          if (k === last) return;
          last = k;
          scr.clear();
          const jump = k % 4 < 2 ? 0 : -5;
          const px = (x: number, y: number) => {
            // pixel in screen-local skewed space (screen spans x 4..26, slope -0.5)
            const sx = 6 + x * 2.2;
            const sy = -48 - (sx - 4) * 0.5 + y * 2.2;
            scr.rect(sx, sy, 2.2, 2.2);
          };
          const cat = ['X..X', 'XXXX', 'X.XX', 'XXXX', '.XX.'];
          cat.forEach((row, y) => [...row].forEach((ch, x) => ch === 'X' && px(x + 1, y - 10 + jump / 2.2)));
          scr.fill(C.cyan);
          for (let i = 0; i < 9; i++) px(i, -4);
          scr.fill(C.pinkHot);
          if (k % 4 === 3) {
            px(7, -9);
            scr.fill(C.yellow);
          }
        },
      };
    }
    // ================================================================ MUSEO
    case 'schrodinger': {
      shadow(g, 38);
      isoBox(g, 34, 40, 0xffffff, 0xffffff, 0xf2efe8);
      const ht = new Graphics();
      halftone(ht, -34, -40, 34, 56, C.ink, 5, 1.3, 0.55);
      const hm = new Graphics().poly([-34, 0, 0, 17, 0, -23, -34, -40]).fill(0xffffff);
      ht.mask = hm;
      c.addChild(hm, ht);
      const q = label('?', 34, C.pinkHot, F.heavy, { stroke: { color: C.ink, width: 4 } });
      q.position.set(17, -14);
      q.skew.set(0, -0.46);
      c.addChild(q);
      // half-open lid
      const lid = new Graphics().poly([-34, -40, 0, -57, 10, -78, -26, -62]).fill(0xffffff).stroke(INK);
      c.addChild(lid);
      const tail = new Graphics();
      tail.moveTo(8, -56).bezierCurveTo(30, -70, 12, -92, 30, -100).stroke({ width: 9, color: C.ink, cap: 'round' }).moveTo(8, -56).bezierCurveTo(30, -70, 12, -92, 30, -100).stroke({ width: 5, color: 0xffffff, cap: 'round' });
      c.addChildAt(tail, 1);
      const qq = label('?!', 18, C.ink, F.comic);
      qq.position.set(-26, -86);
      c.addChild(qq);
      return {
        c,
        top: 110,
        tick: (t) => {
          const s = (Math.sin(t * 0.9) + 1) / 2;
          tail.alpha = s > 0.5 ? 1 : 0.08;
          qq.alpha = s > 0.5 ? 0 : 1;
          qq.y = -86 + Math.sin(twos(t) * 4) * 2;
        },
      };
    }
    case 'bastet': {
      shadow(g, 30);
      glow(c, C.violet, 0, -70, 0.9, 1.1, 0.25);
      const top = pedestal(g, 28, 26, 0x8f6b93, 0x5c3d5b, 0x4a2f49);
      g.poly([-28, -26, 0, -12, 0, -16, -28, -30]).fill(C.gold);
      g.poly([0, -12, 28, -26, 28, -30, 0, -16]).fill(C.gold);
      for (let i = 0; i < 3; i++) g.rect(-20 + i * 6, -10 + i * 3, 3, 6).fill({ color: C.gold, alpha: 0.8 });
      // tall egyptian cat
      const k = 1;
      const y0 = top - 4;
      g.ellipse(0, y0 - 26, 14, 28).fill(0x231626).stroke(INK);
      g.rect(-10, y0 - 40, 20, 34).fill(0x231626);
      g.poly([-9, y0 - 62, -8, y0 - 82, -1, y0 - 68]).fill(0x231626).stroke(THIN);
      g.poly([9, y0 - 62, 8, y0 - 82, 1, y0 - 68]).fill(0x231626).stroke(THIN);
      g.ellipse(0, y0 - 62, 10 * k, 12).fill(0x231626).stroke(INK);
      g.moveTo(-10, y0 - 46).quadraticCurveTo(0, y0 - 40, 10, y0 - 46).stroke({ width: 4, color: C.gold });
      g.circle(0, y0 - 42, 3).fill(C.gold).stroke({ width: 1, color: C.ink });
      g.circle(8, y0 - 56, 2.4).stroke({ width: 1.5, color: C.gold });
      g.moveTo(10, y0 - 2).quadraticCurveTo(22, y0 - 4, 18, y0 - 18).stroke({ width: 5, color: 0x231626, cap: 'round' });
      const eyes = new Graphics().poly([-6, y0 - 64, -2, y0 - 65, -2, y0 - 62]).poly([6, y0 - 64, 2, y0 - 65, 2, y0 - 62]).fill(C.gold);
      c.addChild(eyes);
      const gl = new Graphics();
      c.addChild(gl);
      return {
        c,
        top: 130,
        tick: (t) => {
          gl.clear();
          const p = (t * 0.4) % 1;
          if (p < 0.12) {
            const s = Math.sin((p / 0.12) * Math.PI) * 8;
            gl.star(6, y0 - 64, 4, s, s * 0.2).fill(0xffffff);
          }
        },
      };
    }
    case 'gato_botas': {
      shadow(g, 30);
      const top = pedestal(g, 26, 22, 0xb7ad9c, 0x9a9384, 0x8a8476);
      g.rect(-12, -12, 14, 7).fill(C.gold).stroke({ width: 1.5, color: C.ink });
      const br = 0xb07a3a;
      const brD = 0x8a5a2e;
      const y0 = top - 2;
      // boots
      g.roundRect(-14, y0 - 16, 11, 16, 3).fill(0x5a3a1e).stroke(THIN).roundRect(3, y0 - 16, 11, 16, 3).fill(0x5a3a1e).stroke(THIN);
      // body
      g.ellipse(0, y0 - 34, 15, 20).fill(br).stroke(INK);
      g.ellipse(-5, y0 - 30, 6, 12).fill(brD);
      // cape
      g.poly([-14, y0 - 46, -24, y0 - 14, -10, y0 - 20]).fill(C.red).stroke(THIN);
      // sword arm up
      g.moveTo(12, y0 - 40).lineTo(24, y0 - 58).stroke({ width: 7, color: C.ink, cap: 'round' }).moveTo(12, y0 - 40).lineTo(24, y0 - 58).stroke({ width: 4, color: br, cap: 'round' });
      g.moveTo(24, y0 - 58).lineTo(38, y0 - 100).stroke({ width: 4, color: C.ink, cap: 'round' }).moveTo(24, y0 - 58).lineTo(38, y0 - 100).stroke({ width: 2, color: 0xe9e1d0, cap: 'round' });
      g.moveTo(19, y0 - 60).lineTo(29, y0 - 55).stroke({ width: 3, color: C.gold });
      // head
      g.poly([-12, y0 - 58, -11, y0 - 74, -3, y0 - 64]).fill(br).stroke(THIN);
      g.poly([12, y0 - 58, 11, y0 - 74, 3, y0 - 64]).fill(br).stroke(THIN);
      g.circle(0, y0 - 58, 12).fill(br).stroke(INK);
      // hat + plume
      g.ellipse(0, y0 - 69, 20, 5).fill(0x3a2a1a).stroke(THIN);
      g.poly([-9, y0 - 70, -6, y0 - 82, 8, y0 - 82, 10, y0 - 70]).fill(0x3a2a1a).stroke(THIN);
      const plume = new Graphics();
      plume.moveTo(6, y0 - 80).bezierCurveTo(22, y0 - 96, 30, y0 - 84, 34, y0 - 92).bezierCurveTo(26, y0 - 76, 16, y0 - 80, 6, y0 - 76).closePath().fill(C.red).stroke(THIN);
      c.addChild(plume);
      g.circle(-4, y0 - 59, 1.8).fill(C.ink).circle(4, y0 - 59, 1.8).fill(C.ink);
      // patina
      for (const [x, y] of [[-6, y0 - 40], [6, y0 - 26], [-2, y0 - 62]]) g.circle(x, y, 2.2).fill({ color: 0x6fb3a0, alpha: 0.8 });
      return { c, top: 140, tick: (t) => (plume.rotation = Math.sin(twos(t) * 2) * 0.03) };
    }
    case 'pensador_michi': {
      shadow(g, 32);
      const top = pedestal(g, 30, 30, 0xf4efe6, 0xe0d9cc, 0xcfc7b8);
      const pl = label('EL PENSADOR', 7, C.ink, F.bebas, { letterSpacing: 1 });
      pl.position.set(-14, -14);
      pl.skew.set(0, 0.46);
      c.addChild(pl);
      const m = 0xeee8dc;
      const md = 0xd6cfc0;
      const y0 = top - 2;
      g.rect(-22, y0 - 16, 30, 16).fill(md).stroke(THIN);
      g.ellipse(-4, y0 - 34, 16, 20).fill(m).stroke(INK);
      g.moveTo(10, y0 - 18).quadraticCurveTo(28, y0 - 20, 20, y0 - 2).stroke({ width: 7, color: C.ink, cap: 'round' }).moveTo(10, y0 - 18).quadraticCurveTo(28, y0 - 20, 20, y0 - 2).stroke({ width: 4, color: m, cap: 'round' });
      g.ellipse(8, y0 - 16, 9, 6).fill(m).stroke(THIN);
      // arm to chin
      g.moveTo(6, y0 - 18).lineTo(10, y0 - 44).stroke({ width: 9, color: C.ink, cap: 'round' }).moveTo(6, y0 - 18).lineTo(10, y0 - 44).stroke({ width: 6, color: m, cap: 'round' });
      g.poly([-14, y0 - 56, -14, y0 - 74, -5, y0 - 62]).fill(m).stroke(THIN);
      g.poly([10, y0 - 58, 12, y0 - 75, 2, y0 - 64]).fill(m).stroke(THIN);
      g.circle(-1, y0 - 56, 13).fill(m).stroke(INK);
      g.circle(9, y0 - 46, 5).fill(m).stroke(THIN);
      g.moveTo(-8, y0 - 57).lineTo(-3, y0 - 57).moveTo(2, y0 - 58).lineTo(7, y0 - 58).stroke({ width: 2, color: C.ink });
      for (const [a, b, cc, d] of [[-14, y0 - 40, -2, y0 - 22], [-20, y0 - 10, -6, y0 - 4], [-8, y0 - 66, 2, y0 - 60]]) g.moveTo(a, b).lineTo(cc, d).stroke({ width: 1, color: 0xa8a090, alpha: 0.7 });
      const thought = new Container();
      const tg = new Graphics().circle(22, y0 - 74, 3).circle(28, y0 - 84, 4.5).fill(C.paper).stroke(THIN);
      tg.ellipse(36, y0 - 100, 16, 11).fill(C.paper).stroke(THIN);
      const fish = new Graphics().ellipse(34, y0 - 100, 7, 4).fill(0x7fd8ff).stroke({ width: 1.5, color: C.ink }).poly([40, y0 - 100, 46, y0 - 105, 46, y0 - 95]).fill(0x7fd8ff).stroke({ width: 1.5, color: C.ink });
      thought.addChild(tg, fish);
      c.addChild(thought);
      return { c, top: 140, tick: (t) => (thought.alpha = Math.sin(t * 0.7) > -0.2 ? 1 : 0) };
    }
    // ================================================================ ÚNICOS
    case 'buzon_gato': {
      g.scale.set(1.2);
      shadow(g, 18);
      g.rect(-3, -54, 6, 54).fill(0x8a5a2e).stroke(INK);
      g.poly([-16, -54, -15, -70, -8, -62]).fill(0xe8879a).stroke(THIN);
      g.poly([16, -54, 15, -70, 8, -62]).fill(0xe8879a).stroke(THIN);
      g.roundRect(-20, -78, 40, 30, 12).fill(0xe8879a).stroke(INK);
      g.circle(-7, -64, 2.5).fill(C.ink).circle(7, -64, 2.5).fill(C.ink);
      g.poly([-2, -59, 2, -59, 0, -57]).fill(C.ink);
      g.moveTo(-14, -58).lineTo(-6, -59).moveTo(14, -58).lineTo(6, -59).stroke({ width: 1.5, color: C.ink });
      // envelope
      g.rect(-10, -82, 18, 10).fill(C.paper).stroke(THIN);
      g.moveTo(-10, -82).lineTo(-1, -76).lineTo(8, -82).stroke({ width: 1.5, color: C.ink });
      const flag = new Container();
      const fg = new Graphics().rect(0, -3, 3, 22).fill(C.ink).rect(0, -3, 14, 9).fill(C.red).stroke(THIN);
      flag.addChild(fg);
      flag.position.set(24, -70);
      flag.pivot.set(1, 18);
      flag.scale.set(1.2);
      c.addChild(flag);
      return { c, top: 110, tick: (t) => (flag.rotation = (twos(t) % 5) < 0.4 ? -0.9 : 0) };
    }
    case 'cartel_se_busca': {
      shadow(g, 30);
      g.rect(-34, -70, 6, 70).fill(0x6a4325).stroke(THIN).rect(28, -70, 6, 70).fill(0x6a4325).stroke(THIN);
      g.rect(-44, -110, 88, 56).fill(0x8a5a2e).stroke(INK);
      for (const y of [-96, -82, -68]) g.moveTo(-44, y).lineTo(44, y).stroke({ width: 1.5, color: 0x5a3a1e });
      const poster = new Container();
      const pg = new Graphics().poly([-26, -2, 26, -4, 28, 62, -27, 64]).fill(0xe9dcc1).stroke(THIN);
      pg.circle(0, 2, 3).fill(0xb3202a);
      // shark-cat sketch
      pg.moveTo(-12, 40).quadraticCurveTo(0, 22, 14, 38).stroke({ width: 2, color: C.ink });
      pg.poly([-8, 30, -4, 20, 0, 30]).stroke({ width: 1.6, color: C.ink });
      pg.moveTo(-10, 42).lineTo(12, 42).stroke({ width: 1.6, color: C.ink });
      for (let i = 0; i < 5; i++) pg.poly([-8 + i * 4, 42, -6 + i * 4, 46, -4 + i * 4, 42]).stroke({ width: 1, color: C.ink });
      pg.moveTo(-6, 33).lineTo(-2, 35).moveTo(6, 33).lineTo(2, 35).stroke({ width: 2, color: C.ink });
      poster.addChild(pg);
      const t1 = label('SE BUSCA', 12, C.ink, F.poster, { letterSpacing: 1 });
      t1.position.set(0, 12);
      const t2 = label('1 LATA', 8, 0xb3202a, F.poster);
      t2.position.set(0, 55);
      poster.addChild(t1, t2);
      poster.position.set(0, -116);
      poster.scale.set(0.85);
      c.addChild(poster);
      return { c, top: 120, tick: (t) => (poster.rotation = Math.sin(twos(t) * 1.5) * 0.025) };
    }
    case 'torii_gatuno': {
      shadow(g, 46, 14);
      const red = C.red;
      g.rect(-36, -96, 10, 96).fill(red).stroke(INK).rect(26, -96, 10, 96).fill(red).stroke(INK);
      g.rect(-38, -8, 14, 8).fill(C.ink).rect(24, -8, 14, 8).fill(C.ink);
      g.rect(-44, -78, 88, 8).fill(red).stroke(INK);
      g.moveTo(-58, -100).quadraticCurveTo(0, -88, 58, -100).lineTo(56, -90).quadraticCurveTo(0, -80, -56, -90).closePath().fill(red).stroke(INK);
      g.moveTo(-62, -108).quadraticCurveTo(0, -96, 62, -108).lineTo(60, -100).quadraticCurveTo(0, -88, -60, -100).closePath().fill(C.ink);
      // ears on the beam
      g.poly([-56, -104, -50, -122, -42, -102]).fill(C.ink).poly([56, -104, 50, -122, 42, -102]).fill(C.ink);
      g.poly([-52, -106, -50, -116, -46, -104]).fill(C.pinkHot).poly([52, -106, 50, -116, 46, -104]).fill(C.pinkHot);
      g.rect(-8, -94, 16, 18).fill(C.ink).stroke(THIN);
      g.circle(0, -85, 4).fill(C.yellow);
      // lantern
      const lan = new Container();
      const lg = new Graphics();
      lg.moveTo(0, 0).lineTo(0, 10).stroke({ width: 1.5, color: C.ink });
      lg.ellipse(0, 22, 9, 13).fill(0xff6a6a).stroke(THIN);
      lg.rect(-6, 9, 12, 3).fill(C.ink).rect(-6, 33, 12, 3).fill(C.ink);
      lan.addChild(lg);
      lan.position.set(0, -70);
      glow(c, C.orange, 0, -48, 0.5, 0.5, 0.45);
      c.addChild(lan);
      const petals = new Graphics();
      c.addChild(petals);
      return {
        c,
        top: 130,
        tick: (t) => {
          lan.rotation = Math.sin(t * 1.6) * 0.08;
          petals.clear();
          for (let i = 0; i < 4; i++) {
            const p = (t * 0.25 + i * 0.25) % 1;
            const x = -50 + i * 30 + Math.sin(p * 9 + i) * 10;
            const y = -120 + p * 120;
            petals.ellipse(x, y, 3.5, 2).fill({ color: 0xffb3d6, alpha: 1 - p * 0.6 });
          }
        },
      };
    }
    case 'estatua_canelo': {
      shadow(g, 34);
      glow(c, C.yellow, 0, -80, 1.1, 1.3, 0.35);
      const top = pedestal(g, 30, 30, 0x8f6b93, 0x5c3d5b, 0x4a2f49);
      g.poly([-30, -30, 0, -15, 0, -19, -30, -34]).fill(C.gold);
      g.poly([0, -15, 30, -30, 30, -34, 0, -19]).fill(C.gold);
      const pl = label('EL PRIMERO', 7.5, C.yellow, F.bebas, { letterSpacing: 1 });
      pl.position.set(-15, -12);
      pl.skew.set(0, 0.46);
      c.addChild(pl);
      sittingCat(g, 0, top - 2, 1.05, 0xffc94a, 0xd9a32a);
      // scarf
      g.moveTo(-14, top - 50).quadraticCurveTo(0, top - 42, 14, top - 50).stroke({ width: 7, color: C.ink, cap: 'round' }).moveTo(-14, top - 50).quadraticCurveTo(0, top - 42, 14, top - 50).stroke({ width: 4, color: 0xd9a32a, cap: 'round' });
      g.poly([6, top - 46, 16, top - 30, 8, top - 30]).fill(0xd9a32a).stroke(THIN);
      g.moveTo(-6, top - 57).lineTo(-2, top - 56).moveTo(2, top - 56).lineTo(6, top - 57).stroke({ width: 2, color: C.ink });
      const sp = new Graphics();
      c.addChild(sp);
      return {
        c,
        top: 150,
        tick: (t) => {
          sp.clear();
          for (let i = 0; i < 3; i++) {
            const p = (t * 0.6 + i * 0.33) % 1;
            if (p > 0.5) continue;
            const s = Math.sin((p / 0.5) * Math.PI) * 7;
            const a = i * 2.1 + Math.floor(t * 0.6 + i * 0.33) * 1.3;
            sp.star(Math.cos(a) * 26, top - 50 + Math.sin(a) * 30, 4, s, s * 0.25).fill(0xffffff);
          }
        },
      };
    }
    case 'fuente_atun': {
      // 2×2 footprint: half-width 128
      g.ellipse(0, 4, 104, 40).fill({ color: C.ink, alpha: 0.18 });
      g.ellipse(0, -6, 96, 40).fill(0xb7ad9c).stroke(INK);
      g.rect(-96, -22, 192, 16).fill(0xb7ad9c);
      g.moveTo(-96, -22).lineTo(-96, -6).moveTo(96, -22).lineTo(96, -6).stroke(INK);
      g.ellipse(0, -22, 96, 40).fill(0xd9cdb8).stroke(INK);
      g.ellipse(0, -24, 82, 32).fill(0x7fd8ff).stroke(THIN);
      const ripples = new Graphics();
      c.addChild(ripples);
      // pedestal + tuna
      const p2 = new Graphics();
      p2.ellipse(0, -30, 16, 7).fill(0xb7ad9c).stroke(THIN);
      p2.rect(-10, -66, 20, 36).fill(0xb7ad9c).stroke(THIN);
      p2.ellipse(0, -66, 18, 7).fill(0xd9cdb8).stroke(THIN);
      // tuna standing on its tail, mouth up-right
      p2.poly([0, -70, -12, -78, -6, -86, 0, -80, 6, -86, 12, -78]).fill(0x8a5a2e).stroke(THIN);
      p2.moveTo(0, -80).bezierCurveTo(-22, -100, -18, -140, 6, -150).bezierCurveTo(22, -142, 22, -100, 0, -80).closePath().fill(0xb07a3a).stroke(INK);
      p2.moveTo(-6, -96).quadraticCurveTo(0, -120, 4, -138).stroke({ width: 2, color: 0x8a5a2e });
      p2.poly([-14, -110, -26, -106, -16, -100]).fill(0x8a5a2e).stroke(THIN);
      p2.circle(8, -138, 3).fill(C.paper).stroke({ width: 1.5, color: C.ink }).circle(8.5, -138, 1.3).fill(C.ink);
      p2.ellipse(12, -148, 4, 3).fill(C.ink);
      for (const [x, y] of [[-4, -112], [6, -100], [-8, -128]]) p2.circle(x, y, 2.2).fill({ color: 0x6fb3a0, alpha: 0.8 });
      c.addChild(p2);
      const water = new Graphics();
      c.addChild(water);
      return {
        c,
        top: 170,
        tick: (t) => {
          ripples.clear();
          for (let i = 0; i < 3; i++) {
            const p = (t * 0.5 + i / 3) % 1;
            ripples.ellipse(40, -18, 6 + p * 34, 3 + p * 13).stroke({ width: 2, color: 0xffffff, alpha: 0.7 * (1 - p) });
          }
          water.clear();
          // spout arc from mouth (12,-148) to the pool (44,-20)
          for (let i = 0; i < 9; i++) {
            const p = (t * 1.6 + i / 9) % 1;
            const x = 12 + p * 34;
            const y = -148 - 40 * p + 168 * p * p;
            water.circle(x, y, 3.8 - p * 1.4).fill(0xc6f0ff).stroke({ width: 1.2, color: C.ink, alpha: 0.6 });
          }
        },
      };
    }
  }
  // fallback: little crate
  isoBox(g, 30, 30, 0xd9a066, 0xc68a4e, 0xb07440);
  return { c, top: 60 };
}
