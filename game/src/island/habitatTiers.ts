/**
 * Habitat tiers you can SEE (free-placement update): every tier adds something to the yard on top of
 * its own house, so an upgrade reads from across the island:
 *   T2 flower pots + grass   T3 element bunting + lanterns     T4 paved path + element feature
 *   T5 stone wall + banners  T6 gate arch with emblem          T7 rune ring + orbiting motes
 *   T8 aura + light beam + spires   T9 floating rocks          T10 golden halo + everything gold
 * Houses 7–10 have their own silhouettes here too. Everything is code-drawn (flat colour + ink).
 * The animated bits return a `tick(t)` the habitat view calls each frame (stepped "on twos").
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import { C } from '../ui/theme';
import { elementFx } from '../art/catArt';
import { glowTexture } from '../art/textures';
import { P, isoBoxAt } from './buildingArt';
import { shade, mixColor } from './terrain';

const INK = { width: 3, color: C.ink, join: 'round' as const, cap: 'round' as const };
const THIN = { width: 2, color: C.ink, join: 'round' as const, cap: 'round' as const };

export type Tick = (t: number) => void;

function glow(c: Container, x: number, y: number, tint: number, alpha = 0.4, scale = 0.6) {
  const gl = new Sprite(glowTexture());
  gl.anchor.set(0.5);
  gl.tint = tint;
  gl.alpha = alpha;
  gl.scale.set(scale);
  gl.position.set(x, y);
  gl.blendMode = 'add';
  c.addChild(gl);
  return gl;
}
const stepped = (t: number) => Math.floor(t * 12) / 12;

/** colour of the fence / wall per tier (T1 cream → T10 gold) */
export const TIER_FENCE = [0xf2e6cf, 0xf2e6cf, 0xd9b07a, 0xd9b07a, 0xff9fb4, 0xd8cbb8, 0xe6d6b8, 0xb7a4c7, 0x8a5cff, 0x6d5a80, 0xffd36a];

/** low stone wall along an edge (T5+): blocks + gold caps */
export function wallEdge(g: Graphics, a: { gx: number; gy: number }, b: { gx: number; gy: number }, color: number, cap: number, gapAt = -1) {
  const n = Math.round(Math.hypot(b.gx - a.gx, b.gy - a.gy) * 3);
  const H = 16;
  for (let k = 0; k < n; k++) {
    if (gapAt >= 0 && k >= gapAt - 1 && k <= gapAt) continue;
    const p0 = P(a.gx + ((b.gx - a.gx) * k) / n, a.gy + ((b.gy - a.gy) * k) / n);
    const p1 = P(a.gx + ((b.gx - a.gx) * (k + 1)) / n, a.gy + ((b.gy - a.gy) * (k + 1)) / n);
    g.poly([p0.x, p0.y, p1.x, p1.y, p1.x, p1.y - H, p0.x, p0.y - H]).fill(k % 2 ? color : shade(color, 0.9)).stroke(THIN);
    g.moveTo(p0.x, p0.y - H).lineTo(p1.x, p1.y - H).stroke({ width: 5, color: C.ink, cap: 'round' });
    g.moveTo(p0.x, p0.y - H).lineTo(p1.x, p1.y - H).stroke({ width: 2.5, color: cap, cap: 'round' });
  }
  // pillars at the ends (and around the gate)
  const pill = (f: number) => {
    const p = P(a.gx + (b.gx - a.gx) * f, a.gy + (b.gy - a.gy) * f);
    g.rect(p.x - 6, p.y - H - 12, 12, H + 12).fill(shade(color, 0.8)).stroke(THIN);
    g.poly([p.x - 8, p.y - H - 12, p.x, p.y - H - 20, p.x + 8, p.y - H - 12]).fill(cap).stroke(THIN);
  };
  pill(0);
  pill(1);
  if (gapAt >= 0) {
    pill((gapAt - 1) / n);
    pill((gapAt + 1) / n);
  }
}

/** element-specific yard feature (T4+) */
function elementFeature(el: string, g: Graphics, c: Container, x: number, y: number): Tick | null {
  const fx = elementFx(el);
  switch (el) {
    case 'water': {
      g.ellipse(x, y, 34, 15).fill(0x3f9ccc).stroke(INK);
      g.ellipse(x - 4, y - 2, 26, 10).fill(0x7fd8e4);
      g.ellipse(x - 12, y - 4, 8, 3).fill({ color: 0xffffff, alpha: 0.7 });
      for (const [dx, dy] of [
        [14, -3],
        [-16, 4],
      ])
        g.ellipse(x + dx, y + dy, 6, 3).fill(0x5fbf4a).stroke({ width: 1.5, color: C.ink });
      const ripple = new Graphics().ellipse(0, 0, 12, 5).stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
      ripple.position.set(x + 4, y);
      c.addChild(ripple);
      return (t) => {
        const k = (stepped(t) * 0.6) % 1;
        ripple.scale.set(0.5 + k * 1.6);
        ripple.alpha = 1 - k;
      };
    }
    case 'fire': {
      g.ellipse(x, y, 22, 9).fill(0x6b6b6b).stroke(INK);
      g.poly([x - 18, y - 2, x - 14, y - 16, x + 14, y - 16, x + 18, y - 2]).fill(0x4a4a4a).stroke(INK);
      const fl = new Graphics();
      fl.moveTo(-12, 0).bezierCurveTo(-14, -26, 0, -22, 0, -40).bezierCurveTo(4, -22, 16, -26, 12, 0).closePath().fill(C.orange).stroke(THIN);
      fl.moveTo(-5, 0).bezierCurveTo(-6, -12, 0, -12, 0, -22).bezierCurveTo(2, -12, 7, -12, 5, 0).closePath().fill(C.yellow);
      fl.position.set(x, y - 14);
      const gl = glow(c, x, y - 30, C.orange, 0.5, 0.7);
      c.addChild(fl);
      return (t) => {
        const s = stepped(t);
        fl.scale.set(1 + Math.sin(s * 9) * 0.08, 1 + Math.sin(s * 7 + 1) * 0.14);
        gl.alpha = 0.4 + Math.sin(s * 6) * 0.12;
      };
    }
    case 'nature': {
      g.ellipse(x, y, 32, 13).fill(0x8a5a2e).stroke(INK);
      g.ellipse(x, y - 3, 28, 10).fill(0x5a3a1e);
      const cols = [0xff7ab8, C.yellow, 0xffffff, 0xe8879a, 0xff9fb4];
      for (let k = 0; k < 7; k++) {
        const fxp = x - 22 + k * 7.5;
        const fyp = y - 6 + (k % 2) * 4;
        g.moveTo(fxp, fyp).lineTo(fxp, fyp - 10).stroke({ width: 2, color: 0x3f7a3a });
        g.circle(fxp, fyp - 13, 4.2).fill(cols[k % cols.length]).stroke({ width: 1, color: C.ink });
      }
      return null;
    }
    case 'earth': {
      for (const [dx, h, col] of [
        [-14, 34, fx.accent],
        [2, 46, shade(fx.accent, 1.1)],
        [16, 28, fx.main],
      ] as const)
        g.poly([x + dx - 7, y, x + dx - 5, y - h * 0.7, x + dx, y - h, x + dx + 5, y - h * 0.7, x + dx + 7, y]).fill(col).stroke(THIN);
      glow(c, x, y - 24, fx.accent, 0.35, 0.6);
      return null;
    }
    case 'storm': {
      g.rect(x - 3, y - 50, 6, 50).fill(0x6b6b6b).stroke(THIN);
      g.circle(x, y - 54, 7).fill(0xd9d9d9).stroke(THIN);
      const bolt = new Graphics().poly([2, -18, -7, -4, 0, -5, -4, 6, 8, -9, 1, -8, 5, -18]).fill(C.yellow).stroke({ width: 1.5, color: C.ink });
      bolt.position.set(x + 10, y - 56);
      const gl = glow(c, x, y - 54, fx.accent, 0.5, 0.5);
      c.addChild(bolt);
      return (t) => {
        const on = Math.floor(stepped(t) * 4) % 5 === 0;
        bolt.visible = on;
        gl.alpha = on ? 0.8 : 0.3;
      };
    }
    case 'magic': {
      g.ellipse(x, y, 30, 12).stroke({ width: 3, color: fx.main });
      g.ellipse(x, y, 20, 8).stroke({ width: 2, color: fx.accent });
      const book = new Graphics();
      book.poly([-16, -4, 0, 0, 16, -4, 16, 6, 0, 10, -16, 6]).fill(C.paper).stroke(THIN);
      book.moveTo(0, 0).lineTo(0, 10).stroke({ width: 2, color: C.ink });
      book.position.set(x, y - 34);
      c.addChild(book);
      glow(c, x, y - 30, fx.main, 0.35, 0.6);
      return (t) => {
        book.y = y - 34 + Math.sin(stepped(t) * 2.4) * 5;
      };
    }
    case 'cosmic': {
      g.ellipse(x, y, 30, 12).fill(0x231626).stroke(INK);
      for (let k = 0; k < 6; k++) g.star(x - 18 + k * 7, y - 2 + (k % 2) * 4, 4, 3, 1.4).fill(0xffffff);
      const planet = new Graphics();
      planet.circle(0, 0, 10).fill(fx.main).stroke(THIN);
      planet.ellipse(0, 0, 18, 5).stroke({ width: 2.5, color: fx.accent });
      planet.position.set(x, y - 36);
      c.addChild(planet);
      return (t) => {
        planet.y = y - 36 + Math.sin(stepped(t) * 2) * 4;
        planet.rotation = Math.sin(stepped(t)) * 0.2;
      };
    }
    default: {
      g.poly([x - 8, y, x - 11, y - 18, x - 4, y - 30, x, y - 14]).fill(fx.main).stroke(THIN);
      g.poly([x, y, x + 3, y - 34, x + 9, y - 40, x + 12, y - 18, x + 8, y]).fill(fx.accent).stroke(THIN);
      return null;
    }
  }
}

/**
 * Yard ornaments for a tier (cumulative). `ground` = flat decals, `back` = behind the house line,
 * `front` = in front of the cats. Returns an animation tick (or null).
 */
export function yardForTier(el: string, tier: number, fw: number, fh: number, ground: Container, back: Container, front: Container): Tick | null {
  if (tier < 2) return null;
  const fx = elementFx(el);
  const ticks: Tick[] = [];
  const gg = new Graphics();
  const bg = new Graphics();
  const fg = new Graphics();
  ground.addChild(gg);
  back.addChild(bg);
  front.addChild(fg);
  const backFx = new Container();
  const frontFx = new Container();
  back.addChild(backFx);
  front.addChild(frontFx);

  // ---------------------------------------------------------------- T2: grass tufts + flower pots at the gate
  for (const [gx, gy] of [
    [0.1, 0.9],
    [fw - 1.2, fh - 1.6],
    [1.6, 0.0],
  ]) {
    const p = P(gx, gy);
    for (let k = -1; k <= 1; k++) gg.moveTo(p.x + k * 5, p.y).lineTo(p.x + k * 7, p.y - 9 - Math.abs(k) * -2).stroke({ width: 2.5, color: 0x5f9e4a, cap: 'round' });
  }
  const gate = (f: number) => P(-0.45 + (fw - 0.1) * f, fh - 0.55);
  for (const f of [2 / 9, 6 / 9]) {
    const p = gate(f);
    fg.poly([p.x - 9, p.y + 4, p.x - 7, p.y - 10, p.x + 7, p.y - 10, p.x + 9, p.y + 4]).fill(0xc4683e).stroke(THIN);
    fg.circle(p.x - 4, p.y - 15, 5).fill(fx.main).stroke({ width: 1.5, color: C.ink });
    fg.circle(p.x + 4, p.y - 16, 5).fill(C.paper).stroke({ width: 1.5, color: C.ink });
    fg.circle(p.x, p.y - 21, 5).fill(fx.accent).stroke({ width: 1.5, color: C.ink });
  }
  if (tier < 3) return null;

  // ---------------------------------------------------------------- T3: bunting on the back fence + 2 lanterns
  const flags = [fx.main, fx.accent, C.paper];
  const bunting = (a: { gx: number; gy: number }, b: { gx: number; gy: number }) => {
    const A = P(a.gx, a.gy);
    const B = P(b.gx, b.gy);
    const sag = 14;
    const pt = (f: number) => ({ x: A.x + (B.x - A.x) * f, y: A.y + (B.y - A.y) * f - 40 + Math.sin(f * Math.PI) * sag });
    bg.moveTo(pt(0).x, pt(0).y);
    for (let k = 1; k <= 12; k++) bg.lineTo(pt(k / 12).x, pt(k / 12).y);
    bg.stroke({ width: 2, color: C.ink });
    for (let k = 1; k < 9; k++) {
      const p0 = pt(k / 9 - 0.04);
      const p1 = pt(k / 9 + 0.04);
      bg.poly([p0.x, p0.y, p1.x, p1.y, (p0.x + p1.x) / 2, (p0.y + p1.y) / 2 + 12]).fill(flags[k % 3]).stroke({ width: 1.5, color: C.ink });
    }
  };
  bunting({ gx: -0.45, gy: -0.45 }, { gx: fw - 0.55, gy: -0.45 });
  bunting({ gx: -0.45, gy: -0.45 }, { gx: -0.45, gy: fh - 0.55 });
  const lanterns: Sprite[] = [];
  for (const [gx, gy] of [
    [fw - 0.55, -0.45],
    [-0.45, fh - 0.55],
  ]) {
    const p = P(gx, gy);
    bg.rect(p.x - 2.5, p.y - 58, 5, 58).fill(0x6a4325).stroke({ width: 1.5, color: C.ink });
    bg.roundRect(p.x - 8, p.y - 76, 16, 18, 4).fill(tier >= 6 ? fx.accent : 0xff9a3a).stroke(THIN);
    bg.poly([p.x - 10, p.y - 76, p.x, p.y - 84, p.x + 10, p.y - 76]).fill(C.ink);
    lanterns.push(glow(backFx, p.x, p.y - 67, tier >= 6 ? fx.accent : 0xffb04a, 0.45, 0.32));
  }
  ticks.push((t) => lanterns.forEach((l, i) => (l.alpha = 0.38 + Math.sin(stepped(t) * 3 + i * 2) * 0.1)));
  if (tier < 4) return run(ticks);

  // ---------------------------------------------------------------- T4: paved path + element feature
  for (let k = 0; k < 4; k++) {
    const p = P(0.35 + k * 0.3, fh - 1.3 + k * 0.25);
    const q = [P(-0.13, -0.13), P(0.13, -0.13), P(0.13, 0.13), P(-0.13, 0.13)].map((d) => ({ x: p.x + d.x, y: p.y + d.y }));
    gg.poly(q.flatMap((v) => [v.x, v.y])).fill(k % 2 ? 0xe6dccb : 0xd6cab4).stroke({ width: 2, color: C.ink, alpha: 0.6 });
  }
  const fp = P(-0.1, 1.15);
  const featTick = elementFeature(el, bg, backFx, fp.x, fp.y);
  if (featTick) ticks.push(featTick);
  if (tier < 5) return run(ticks);

  // ---------------------------------------------------------------- T5: banners on the front corners
  for (const [gx, gy, side] of [
    [fw - 0.55, fh - 0.55, 1],
    [-0.45, fh - 0.55, -1],
  ] as const) {
    const p = P(gx, gy);
    fg.rect(p.x - 2.5, p.y - 74, 5, 74).fill(C.gold).stroke({ width: 1.5, color: C.ink });
    fg.circle(p.x, p.y - 76, 5).fill(C.yellow).stroke({ width: 1.5, color: C.ink });
    const bx = p.x + side * 3;
    fg.poly([bx, p.y - 70, bx + side * 22, p.y - 66, bx + side * 22, p.y - 34, bx + side * 11, p.y - 40, bx, p.y - 36]).fill(fx.main).stroke(THIN);
    fg.circle(bx + side * 11, p.y - 54, 4.5).fill(fx.accent).stroke({ width: 1.2, color: C.ink });
  }
  if (tier < 6) return run(ticks);

  // ---------------------------------------------------------------- T6: gate arch with the element emblem
  {
    const a = gate(2 / 9);
    const b = gate(6 / 9);
    const H = 78;
    const col = tier >= 10 ? 0xffd36a : shade(fx.main, 0.85);
    fg.rect(a.x - 5, a.y - H, 10, H).fill(col).stroke(THIN);
    fg.rect(b.x - 5, b.y - H, 10, H).fill(col).stroke(THIN);
    fg.moveTo(a.x - 12, a.y - H - 2).quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 - H - 22, b.x + 12, b.y - H - 2).stroke({ width: 10, color: C.ink, cap: 'round' });
    fg.moveTo(a.x - 12, a.y - H - 2).quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 - H - 22, b.x + 12, b.y - H - 2).stroke({ width: 6, color: col, cap: 'round' });
    fg.moveTo(a.x, a.y - H + 14).lineTo(b.x, b.y - H + 14).stroke({ width: 4, color: C.ink });
    const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - H - 12 };
    fg.circle(m.x, m.y, 11).fill(fx.accent).stroke(THIN);
    fg.star(m.x, m.y, 5, 6, 2.6).fill(fx.main);
    const eg = glow(frontFx, m.x, m.y, fx.accent, 0.4, 0.4);
    ticks.push((t) => (eg.alpha = 0.32 + Math.sin(stepped(t) * 2.5) * 0.12));
  }
  if (tier < 7) return run(ticks);

  // ---------------------------------------------------------------- T7: rune ring + orbiting motes
  {
    const ctr = P(fw / 2 - 0.5, fh / 2 - 0.5);
    const ring = new Graphics();
    ring.ellipse(0, 0, 118, 56).stroke({ width: 3, color: fx.accent, alpha: 0.8 });
    ring.ellipse(0, 0, 100, 47).stroke({ width: 2, color: fx.main, alpha: 0.7 });
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      ring.star(Math.cos(a) * 109, Math.sin(a) * 51.5, 4, 5, 2).fill(fx.accent);
    }
    ring.position.set(ctr.x, ctr.y);
    ground.addChild(ring);
    const motes: Graphics[] = [];
    for (let k = 0; k < 3; k++) {
      const m = new Graphics().circle(0, 0, 6).fill(k === 1 ? fx.accent : fx.main).stroke({ width: 1.5, color: C.ink });
      m.circle(-2, -2, 2).fill({ color: 0xffffff, alpha: 0.7 });
      frontFx.addChild(m);
      motes.push(m);
    }
    const house = P(0.15, 0.15);
    ticks.push((t) => {
      const s = stepped(t);
      ring.alpha = 0.6 + Math.sin(s * 2) * 0.25;
      motes.forEach((m, i) => {
        const a = s * 1.4 + (i * Math.PI * 2) / 3;
        m.position.set(house.x + Math.cos(a) * 70, house.y - 80 + Math.sin(a) * 22 + Math.sin(s * 3 + i) * 4);
        m.alpha = Math.sin(a) > -0.2 ? 1 : 0.55;
      });
    });
  }
  if (tier < 8) return run(ticks);

  // ---------------------------------------------------------------- T8: aura + light beam + crystal spires
  {
    const ctr = P(0.15, 0.15);
    const aura = new Graphics().ellipse(0, 0, 92, 42).fill({ color: fx.accent, alpha: 0.28 });
    aura.position.set(ctr.x, ctr.y + 6);
    ground.addChildAt(aura, 0);
    const beam = new Sprite(glowTexture());
    beam.anchor.set(0.5, 1);
    beam.tint = fx.accent;
    beam.blendMode = 'add';
    beam.scale.set(0.5, 2.6);
    beam.position.set(ctr.x, ctr.y - 60);
    beam.alpha = 0.35;
    backFx.addChildAt(beam, 0);
    for (const [gx, gy] of [
      [fw - 0.75, -0.25],
      [-0.25, fh - 0.75],
    ]) {
      const p = P(gx, gy);
      bg.poly([p.x - 7, p.y, p.x - 4, p.y - 38, p.x, p.y - 50, p.x + 4, p.y - 38, p.x + 7, p.y]).fill(fx.accent).stroke(THIN);
      bg.poly([p.x - 4, p.y - 38, p.x, p.y - 50, p.x, p.y]).fill({ color: 0xffffff, alpha: 0.35 });
    }
    ticks.push((t) => {
      const s = stepped(t);
      aura.alpha = 0.8 + Math.sin(s * 1.6) * 0.2;
      beam.alpha = 0.28 + Math.sin(s * 1.3) * 0.1;
    });
  }
  if (tier < 9) return run(ticks);

  // ---------------------------------------------------------------- T9: floating rocks with crystals
  {
    const rocks: { c: Graphics; y: number }[] = [];
    for (const [gx, gy, s] of [
      [fw - 0.4, 0.6, 1],
      [0.6, fh - 0.4, 0.8],
      [-0.6, -0.6, 0.9],
    ]) {
      const p = P(gx, gy);
      const r = new Graphics();
      r.poly([-18 * s, 0, -12 * s, 10 * s, 0, 16 * s, 12 * s, 10 * s, 18 * s, 0, 8 * s, -6 * s, -8 * s, -6 * s]).fill(0x6d5a80).stroke(THIN);
      r.poly([-6 * s, -6 * s, -3 * s, -24 * s, 2 * s, -30 * s, 6 * s, -20 * s, 8 * s, -6 * s]).fill(fx.accent).stroke(THIN);
      r.position.set(p.x, p.y - 96);
      frontFx.addChild(r);
      rocks.push({ c: r, y: p.y - 96 });
    }
    ticks.push((t) => rocks.forEach((r, i) => (r.c.y = r.y + Math.sin(stepped(t) * 1.6 + i * 2) * 7)));
  }
  if (tier < 10) return run(ticks);

  // ---------------------------------------------------------------- T10: golden halo with stars
  {
    const h = P(0.15, 0.15);
    const halo = new Graphics();
    halo.ellipse(0, 0, 54, 14).stroke({ width: 8, color: C.ink });
    halo.ellipse(0, 0, 54, 14).stroke({ width: 4, color: 0xffd36a });
    halo.position.set(h.x, h.y - 250);
    frontFx.addChild(halo);
    glow(frontFx, h.x, h.y - 250, 0xffd36a, 0.5, 0.9);
    const stars: Graphics[] = [];
    for (let k = 0; k < 5; k++) {
      const s = new Graphics().star(0, 0, 4, 8, 3.2).fill(0xffe9a8).stroke({ width: 1.5, color: C.ink });
      frontFx.addChild(s);
      stars.push(s);
    }
    ticks.push((t) => {
      const s = stepped(t);
      stars.forEach((st, i) => {
        const a = s * 1.1 + (i * Math.PI * 2) / 5;
        st.position.set(h.x + Math.cos(a) * 54, h.y - 250 + Math.sin(a) * 14);
        st.rotation = s * 2 + i;
      });
    });
  }
  return run(ticks);
}

function run(ticks: Tick[]): Tick | null {
  if (!ticks.length) return null;
  return (t) => {
    for (const f of ticks) f(t);
  };
}

// ======================================================================= houses 7–10
function topper(g: Graphics, x: number, y: number, el: string, s = 1) {
  const fx = elementFx(el);
  g.circle(x, y - 9 * s, 8 * s).fill(fx.accent).stroke(THIN);
  g.star(x, y - 9 * s, 5, 6 * s, 2.6 * s).fill(fx.main);
}

/** T7 · Santuario Arcano: rune obelisk temple with floating book-shelves and arched door */
export function santuarioArcano(g: Graphics, c: Container, el: string) {
  const fx = elementFx(el);
  isoBoxAt(g, -0.65, -0.65, 1.4, 1.4, 12, 0x6d5a80, 0.02);
  const body = isoBoxAt(g, -0.48, -0.48, 1.05, 1.05, 64, 0x5c3d5b, 0.04, 12);
  // rune bands
  for (const h of [34, 58]) {
    g.moveTo(body.left.x, body.left.y - h).lineTo(body.bottom.x, body.bottom.y - h).lineTo(body.right.x, body.right.y - h).stroke({ width: 4, color: C.gold });
  }
  for (let k = 0; k < 4; k++) {
    const f = 0.2 + k * 0.2;
    const p = { x: body.bottom.x + (body.right.x - body.bottom.x) * f, y: body.bottom.y + (body.right.y - body.bottom.y) * f - 46 };
    g.star(p.x, p.y, 4, 5, 2).fill(fx.accent);
  }
  const dl = { x: (body.left.x + body.bottom.x) / 2, y: (body.left.y + body.bottom.y) / 2 };
  g.moveTo(dl.x - 12, dl.y).bezierCurveTo(dl.x - 12, dl.y - 40, dl.x + 12, dl.y - 46, dl.x + 12, dl.y - 6).closePath().fill(C.ink).stroke(THIN);
  glow(c, dl.x, dl.y - 20, fx.accent, 0.35, 0.4);
  // pyramid roof + obelisk
  const apex = { x: body.tT.x, y: body.tT.y + (body.tB.y - body.tT.y) / 2 - 50 };
  g.poly([body.tL.x, body.tL.y, body.tB.x, body.tB.y, apex.x, apex.y]).fill(0x8a5cff).stroke(INK);
  g.poly([body.tB.x, body.tB.y, body.tR.x, body.tR.y, apex.x, apex.y]).fill(shade(0x8a5cff, 0.7)).stroke(INK);
  g.poly([apex.x - 6, apex.y + 8, apex.x - 4, apex.y - 40, apex.x, apex.y - 50, apex.x + 4, apex.y - 40, apex.x + 6, apex.y + 8]).fill(C.gold).stroke(THIN);
  topper(g, apex.x, apex.y - 50, el, 0.9);
  glow(c, apex.x, apex.y - 58, fx.main, 0.45, 0.6);
  return apex.y - 76;
}

/** T8 · Núcleo Celestial: stepped dais, crystal pillars and a ringed core orb */
export function nucleoCelestial(g: Graphics, c: Container, el: string) {
  const fx = elementFx(el);
  isoBoxAt(g, -0.7, -0.7, 1.5, 1.5, 10, 0x372347, 0.02);
  isoBoxAt(g, -0.58, -0.58, 1.25, 1.25, 10, 0x4a3362, 0.03, 10);
  const top = isoBoxAt(g, -0.5, -0.5, 1.1, 1.1, 10, 0x231626, 0.04, 20);
  for (const p of [top.tL, top.tR, top.tB]) {
    g.poly([p.x - 7, p.y, p.x - 5, p.y - 46, p.x, p.y - 58, p.x + 5, p.y - 46, p.x + 7, p.y]).fill(fx.accent).stroke(THIN);
    g.poly([p.x - 5, p.y - 46, p.x, p.y - 58, p.x, p.y]).fill({ color: 0xffffff, alpha: 0.35 });
  }
  const oy = top.tT.y + (top.tB.y - top.tT.y) / 2 - 70;
  glow(c, 0, oy, fx.accent, 0.6, 1.1);
  g.circle(0, oy, 30).fill(fx.main).stroke(INK);
  g.circle(-9, oy - 9, 9).fill({ color: 0xffffff, alpha: 0.55 });
  g.ellipse(0, oy, 52, 13).stroke({ width: 7, color: C.ink });
  g.ellipse(0, oy, 52, 13).stroke({ width: 3.5, color: C.pinkHot });
  g.ellipse(0, oy, 40, 26).stroke({ width: 2.5, color: fx.accent, alpha: 0.9 });
  return oy - 50;
}

/** T9 · Ancla Dimensional: a floating chunk of island anchored by a giant chain + portal ring */
export function anclaDimensional(g: Graphics, c: Container, el: string) {
  const fx = elementFx(el);
  // anchor post + chain
  isoBoxAt(g, -0.4, -0.4, 0.8, 0.8, 22, 0x6d5a80, 0.04);
  for (let k = 0; k < 6; k++) {
    const y = -30 - k * 14;
    g.ellipse(k % 2 ? 2 : -2, y, 6, 9).stroke({ width: 6, color: C.ink });
    g.ellipse(k % 2 ? 2 : -2, y, 6, 9).stroke({ width: 3, color: 0xb7b7c7 });
  }
  // floating island chunk
  const fy = -130;
  g.poly([-62, fy, 0, fy - 28, 62, fy, 0, fy + 28]).fill(mixColor(fx.main, 0x7a9a5a, 0.4)).stroke(INK);
  g.poly([-62, fy, 0, fy + 28, 62, fy, 40, fy + 40, 0, fy + 70, -36, fy + 42]).fill(0x6d5a80).stroke(INK);
  g.poly([0, fy + 28, 0, fy + 70, -36, fy + 42, -62, fy]).fill(shade(0x6d5a80, 0.75)).stroke(INK);
  // little temple on the chunk
  const b = isoBoxAt(g, -0.25, -0.25, 0.5, 0.5, 34, 0xede4d6, 0.02, -fy);
  g.poly([b.tL.x - 6, b.tL.y, b.tB.x, b.tB.y + 4, b.tR.x + 6, b.tR.y, b.tT.x, b.tT.y - 26]).fill(fx.main).stroke(INK);
  topper(g, b.tT.x, b.tT.y - 26, el, 0.8);
  // portal ring behind
  const ring = new Graphics();
  ring.ellipse(0, fy - 20, 84, 84).stroke({ width: 8, color: C.ink });
  ring.ellipse(0, fy - 20, 84, 84).stroke({ width: 4, color: fx.accent });
  ring.alpha = 0.7;
  c.addChildAt(ring, 0);
  glow(c, 0, fy - 20, fx.accent, 0.3, 1.4);
  return fy - 110;
}

/** T10 · Trono Multiversal: a tall spire-throne with a crown and banners of every colour */
export function tronoMultiversal(g: Graphics, c: Container, el: string) {
  const fx = elementFx(el);
  isoBoxAt(g, -0.7, -0.7, 1.5, 1.5, 12, 0xd9b07a, 0.02);
  isoBoxAt(g, -0.6, -0.6, 1.3, 1.3, 12, 0xffd36a, 0.02, 12);
  const body = isoBoxAt(g, -0.5, -0.5, 1.1, 1.1, 60, 0xfff3d6, 0.03, 24);
  // throne back (tall spires)
  for (const [x, h, w] of [
    [-34, 120, 12],
    [0, 170, 16],
    [34, 120, 12],
  ]) {
    const by = body.tT.y + 30;
    g.poly([x - w, by, x - w, by - h + 30, x, by - h, x + w, by - h + 30, x + w, by]).fill(0xffd36a).stroke(INK);
    g.poly([x - w * 0.4, by - h + 34, x, by - h + 10, x + w * 0.4, by - h + 34, x, by - h + 54]).fill(fx.accent).stroke(THIN);
  }
  // seat cushion
  g.ellipse(0, body.tB.y - 18, 40, 14).fill(fx.main).stroke(INK);
  g.ellipse(-8, body.tB.y - 22, 14, 4).fill({ color: 0xffffff, alpha: 0.4 });
  // banners of every element
  const cols = [0xff6a1a, 0x3569a3, 0x5fbf4a, 0xa8743f, 0xffe14a, 0x8a5cff];
  cols.forEach((col, i) => {
    const t = i / (cols.length - 1);
    const p = { x: body.left.x + (body.right.x - body.left.x) * t, y: body.left.y + (body.right.y - body.left.y) * t + Math.abs(t - 0.5) * -40 + 20 - 40 };
    g.poly([p.x - 6, p.y - 30, p.x + 6, p.y - 30, p.x + 6, p.y - 6, p.x, p.y - 12, p.x - 6, p.y - 6]).fill(col).stroke({ width: 1.5, color: C.ink });
  });
  // crown
  const cy = body.tT.y - 140;
  g.poly([-24, cy, -24, cy - 22, -12, cy - 10, 0, cy - 30, 12, cy - 10, 24, cy - 22, 24, cy]).fill(0xffd36a).stroke(INK);
  for (const x of [-12, 0, 12]) g.circle(x, cy - 4, 3.5).fill(x === 0 ? fx.main : C.pinkHot).stroke({ width: 1, color: C.ink });
  glow(c, 0, cy - 10, 0xffd36a, 0.5, 1.0);
  return cy - 40;
}
