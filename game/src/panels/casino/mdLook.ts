/**
 * The MULTIDIMENSIONAL look inside the casino (owner 2026-10-29: «cuando sale un multiversal debe reflejar su propia
 * rareza»): its colour and glow (ui/theme RARITY.multidimensional), the five boxes' stripe and the box gem the collection's
 * Multidimensional cards wear (panels/collection/multidimCard.ts DIMS5 / multidimGem). Redrawn here, small, so the casino
 * never loads the universes' module just to paint a prize card (tests/casinoMultiverso.test.ts checks the palette stays the same).
 */
import { Container, Graphics } from 'pixi.js';
import { RARITY } from '../../ui/theme';

export const MD = RARITY.multidimensional.color;
export const MD_GLOW_COL = RARITY.multidimensional.glow;
/** the five boxes (beer, comic, shōnen, ink, neon) — the same as multidimCard.ts DIMS5 */
export const MD_DIMS = [0xe8a33d, 0x2a5db0, 0xff7a1a, 0x8a5a3a, 0xff2e88] as const;
const INK = 0x0d0a12;

/** the five boxes' stripe, w×h, top-left at (x, y) */
export function mdStripe(g: Graphics, x: number, y: number, w: number, h: number) {
  const sw = w / MD_DIMS.length;
  MD_DIMS.forEach((c, i) => g.rect(x + i * sw, y, sw + 0.5, h).fill(c));
  return g;
}

/** the box gem (a diamond in the Multidimensional colour with an open box), centred at (0, 0) */
export function mdGem(size: number): Container {
  const k = new Container();
  const s = size / 2;
  const ink = Math.max(1.5, size * 0.08);
  const g = new Graphics();
  g.poly([0, -s - ink, s + ink, 0, 0, s + ink, -s - ink, 0]).fill(INK);
  g.poly([0, -s, s, 0, 0, s, -s, 0]).fill(MD);
  g.poly([0, -s, 0, s, -s, 0]).fill({ color: 0xffffff, alpha: 0.3 });
  g.poly([0, s, s, 0, 0, 0]).fill({ color: INK, alpha: 0.2 });
  const bw = s * 0.62;
  const bh = s * 0.42;
  const by = s * 0.08;
  g.rect(-bw / 2, by - bh / 2, bw, bh).fill({ color: 0xfff8ec, alpha: 0.92 });
  g.poly([-bw / 2, by - bh / 2, -bw / 2 - bw * 0.3, by - bh / 2 - bh * 0.55, -bw * 0.05, by - bh / 2]).fill({ color: MD_GLOW_COL, alpha: 0.95 });
  g.poly([bw / 2, by - bh / 2, bw / 2 + bw * 0.3, by - bh / 2 - bh * 0.55, bw * 0.05, by - bh / 2]).fill({ color: MD_GLOW_COL, alpha: 0.95 });
  g.poly([0, -s, s, 0, 0, s, -s, 0]).stroke({ width: ink, color: INK, join: 'miter' });
  k.addChild(g);
  return k;
}
