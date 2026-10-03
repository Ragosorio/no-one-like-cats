import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { TW, TH } from './iso';
import { C, F } from '../ui/theme';
import { txt } from '../ui/widgets';
import { elementFx } from '../art/catArt';
import { glowTexture } from '../art/textures';

const INK = { width: 3, color: C.ink, join: 'round' as const };

function shade(c: number, k: number) {
  const r = Math.min(255, Math.max(0, Math.round(((c >> 16) & 255) * k)));
  const g = Math.min(255, Math.max(0, Math.round(((c >> 8) & 255) * k)));
  const b = Math.min(255, Math.max(0, Math.round((c & 255) * k)));
  return (r << 16) | (g << 8) | b;
}

/**
 * Iso box whose footprint is fw×fh tiles. Origin (0,0) = the top corner of the footprint's
 * top tile (i.e. isoToScreen(gx,gy) of the building's anchor tile).
 * inset shrinks the box inside the footprint.
 */
export function isoBox(g: Graphics, fw: number, fh: number, height: number, color: number, inset = 0.12) {
  const hw = TW / 2;
  const hh = TH / 2;
  const i = inset;
  // footprint corners in screen space (relative to tile (0,0) center)
  const P = (gx: number, gy: number) => ({ x: (gx - gy) * hw, y: (gx + gy) * hh });
  const top = P(i - 0.5, i - 0.5);
  const right = P(fw - 0.5 - i, i - 0.5);
  const bottom = P(fw - 0.5 - i, fh - 0.5 - i);
  const left = P(i - 0.5, fh - 0.5 - i);
  const up = (p: { x: number; y: number }) => ({ x: p.x, y: p.y - height });
  const tT = up(top);
  const tR = up(right);
  const tB = up(bottom);
  const tL = up(left);
  g.poly([tL.x, tL.y, tB.x, tB.y, bottom.x, bottom.y, left.x, left.y]).fill(shade(color, 0.78)).stroke(INK);
  g.poly([tB.x, tB.y, tR.x, tR.y, right.x, right.y, bottom.x, bottom.y]).fill(shade(color, 0.6)).stroke(INK);
  g.poly([tT.x, tT.y, tR.x, tR.y, tB.x, tB.y, tL.x, tL.y]).fill(color).stroke(INK);
  return { tT, tR, tB, tL, top, right, bottom, left };
}

/** Diamond footprint fill (ground decal) */
export function footprint(g: Graphics, fw: number, fh: number, color: number, alpha = 1, inset = 0.05) {
  const hw = TW / 2;
  const hh = TH / 2;
  const P = (gx: number, gy: number) => ({ x: (gx - gy) * hw, y: (gx + gy) * hh });
  const a = P(inset - 0.5, inset - 0.5);
  const b = P(fw - 0.5 - inset, inset - 0.5);
  const c = P(fw - 0.5 - inset, fh - 0.5 - inset);
  const d = P(inset - 0.5, fh - 0.5 - inset);
  g.poly([a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y]).fill({ color, alpha }).stroke({ width: 3, color: C.ink, alpha: 0.8 });
  return { a, b, c, d };
}

export function centerOf(fw: number, fh: number) {
  const hw = TW / 2;
  const hh = TH / 2;
  const gx = fw / 2 - 0.5;
  const gy = fh / 2 - 0.5;
  return { x: (gx - gy) * hw, y: (gx + gy) * hh };
}

/** Habitat: fenced garden in the element color + a little house. Cats wander on the footprint. */
export function habitatArt(element: string, fw = 3, fh = 3, level = 1): Container {
  const fx = elementFx(element);
  const c = new Container();
  const g = new Graphics();
  footprint(g, fw, fh, shade(fx.main, 1.15), 0.55);
  // fence posts along the two front edges
  const hw = TW / 2;
  const hh = TH / 2;
  const P = (gx: number, gy: number) => ({ x: (gx - gy) * hw, y: (gx + gy) * hh });
  for (let k = 0; k <= fw * 2; k++) {
    const p = P(-0.45 + (k / 2) * 0.97, fh - 0.55);
    g.rect(p.x - 3, p.y - 18, 6, 18).fill(C.paper).stroke({ width: 2, color: C.ink });
  }
  for (let k = 0; k <= fh * 2; k++) {
    const p = P(fw - 0.55, -0.45 + (k / 2) * 0.97);
    g.rect(p.x - 3, p.y - 18, 6, 18).fill(C.paper).stroke({ width: 2, color: C.ink });
  }
  c.addChild(g);
  // house at back corner
  const house = new Graphics();
  const box = isoBox(house, 1, 1, 46 + level * 6, fx.main, 0.08);
  // roof: pyramid
  const apex = { x: box.tT.x, y: box.tT.y + (box.tB.y - box.tT.y) / 2 - 40 };
  house.poly([box.tL.x, box.tL.y, box.tB.x, box.tB.y, apex.x, apex.y]).fill(shade(fx.dark, 1.4)).stroke(INK);
  house.poly([box.tB.x, box.tB.y, box.tR.x, box.tR.y, apex.x, apex.y]).fill(fx.dark).stroke(INK);
  // door
  const dx = (box.left.x + box.bottom.x) / 2;
  const dy = (box.left.y + box.bottom.y) / 2;
  house.ellipse(dx, dy - 14, 9, 14).fill(C.ink);
  c.addChild(house);
  const glow = new Sprite(glowTexture());
  glow.anchor.set(0.5);
  glow.tint = fx.accent;
  glow.alpha = 0.25;
  glow.scale.set(1.6);
  glow.position.set(apex.x, apex.y + 10);
  c.addChildAt(glow, 0);
  return c;
}

/** Fish farm: pond with ripples and a dock plank. */
export function farmArt(fw = 2, fh = 2, tier = 1): Container {
  const c = new Container();
  const g = new Graphics();
  const pts = footprint(g, fw, fh, 0xc99358, 1, 0.04);
  // water inset
  const k = 0.82;
  const cx = (pts.a.x + pts.c.x) / 2;
  const cy = (pts.a.y + pts.c.y) / 2;
  const sc = (p: { x: number; y: number }) => [cx + (p.x - cx) * k, cy + (p.y - cy) * k];
  const water = tier >= 4 ? 0x231626 : tier >= 3 ? 0x204a7a : 0x3569a3;
  g.poly([...sc(pts.a), ...sc(pts.b), ...sc(pts.c), ...sc(pts.d)]).fill(water).stroke({ width: 3, color: C.ink });
  for (let i = 0; i < 4; i++) {
    const ox = cx + (i - 1.5) * 26;
    const oy = cy + ((i % 2) - 0.5) * 18;
    g.moveTo(ox - 10, oy).quadraticCurveTo(ox, oy - 5, ox + 10, oy).stroke({ width: 2, color: 0xffffff, alpha: 0.7 });
  }
  c.addChild(g);
  return c;
}

/** Resonance sanctuary: torii-style gate with a swirling portal. */
export function sanctuaryArt(fw = 3, fh = 3): Container {
  const c = new Container();
  const g = new Graphics();
  footprint(g, fw, fh, 0xb7a4c7, 0.7);
  const ctr = centerOf(fw, fh);
  const portal = new Sprite(glowTexture());
  portal.anchor.set(0.5);
  portal.tint = C.pinkHot;
  portal.scale.set(1.4, 1.8);
  portal.position.set(ctr.x, ctr.y - 70);
  g.rect(ctr.x - 70, ctr.y - 150, 14, 150).fill(C.red).stroke(INK);
  g.rect(ctr.x + 56, ctr.y - 150, 14, 150).fill(C.red).stroke(INK);
  g.rect(ctr.x - 92, ctr.y - 168, 184, 18).fill(C.ink);
  g.rect(ctr.x - 80, ctr.y - 140, 160, 12).fill(C.red).stroke(INK);
  c.addChild(portal, g);
  return c;
}

/** Simple label plate above buildings */
export function plate(text: string, color: number = C.paper): Container {
  const c = new Container();
  const t: Text = txt(text, { fontFamily: F.poster, fontSize: 22, fill: C.ink });
  t.anchor.set(0.5);
  const w = t.width + 20;
  const bg = new Graphics().rect(-w / 2 + 4, -14 + 4, w, 28).fill(C.ink).rect(-w / 2, -14, w, 28).fill(color).stroke({ width: 3, color: C.ink });
  c.addChild(bg, t);
  return c;
}
