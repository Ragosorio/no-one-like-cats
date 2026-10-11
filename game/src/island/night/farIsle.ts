/**
 * Consequences that stay on the 2D island (Parte II · Oleada 1), derived from the story like the world state:
 *
 * - FarIsle: once the sun came up on the island of books (b33_paginas#a, or you already landed: H33 done), it is
 *   THERE, on the horizon, where the faro's beam pointed that night: a hazy paper silhouette of an open book on
 *   its stacks, with its little lighthouse. The dawn scene brings it out (drive 'farIsle').
 * - CaneloPage: while Canelo «took the page to the ship» and wants the helm (H37 → H38), the golden page goes
 *   with him everywhere, under his paws.
 * Pure Pixi drawing (no textures, nothing to load).
 */
import { Container, Graphics } from 'pixi.js';
import { G } from '../../state/game';

const seen = (k: string) => !!G.s?.beatsSeen?.includes(k);
const done = (m: string) => !!G.s?.missions?.done.includes(m);
const active = (m: string) => !!G.s?.missions?.active.includes(m);

/** the island of books is visible from home */
export const farIsleShown = () => seen('b33_paginas#a') || seen('b33_paginas') || done('H33');
/** Canelo carries his page (H37 «quiere el timón» and H38 «¡A BABOR!») */
export const caneloCarriesPage = () => active('H37') || active('H38');

export function farIsleArt(): Container {
  const c = new Container();
  c.label = 'farIsle';
  const g = new Graphics();
  const hz = 0x7d86ad;
  const lit = 0xb9c0dc;
  // the sea line it sits on (a soft band)
  g.ellipse(0, 40, 520, 46).fill({ color: 0x9aa7c8, alpha: 0.35 });
  // stacks of books (cliffs), alternating shades
  const stacks: [number, number, number][] = [
    [-430, 4, 3],
    [-350, 2, 5],
    [-270, 6, 2],
    [250, 4, 4],
    [330, 2, 6],
    [410, 6, 3],
  ];
  for (const [x, y0, n] of stacks)
    for (let i = 0; i < n; i++) {
      const w = 74 - (i % 3) * 8;
      g.rect(x - w / 2 + ((i * 7) % 11) - 5, y0 - (i + 1) * 22, w, 20).fill(i % 2 ? hz : 0x6c7499).stroke({ width: 2, color: 0x4b5170, alpha: 0.6 });
    }
  // the open book: two tilted pages and the spine
  g.poly([-250, 10, -12, -40, -6, 18, -240, 40]).fill(lit).stroke({ width: 3, color: 0x4b5170, alpha: 0.7 });
  g.poly([250, 10, 12, -40, 6, 18, 240, 40]).fill(0xc7cde4).stroke({ width: 3, color: 0x4b5170, alpha: 0.7 });
  for (let i = 0; i < 6; i++) {
    g.moveTo(-220 + i * 6, 14 - i * 8)
      .lineTo(-40, -26 - i * 1)
      .stroke({ width: 2, color: 0x6c7499, alpha: 0.45 });
    g.moveTo(220 - i * 6, 14 - i * 8)
      .lineTo(40, -26 - i * 1)
      .stroke({ width: 2, color: 0x6c7499, alpha: 0.45 });
  }
  // the little lighthouse on the spine
  g.rect(-10, -150, 20, 112).fill(0xd9dced).stroke({ width: 2, color: 0x4b5170, alpha: 0.7 });
  g.poly([-16, -150, 16, -150, 0, -176]).fill(0xa25a6a);
  g.circle(0, -160, 7).fill(0xffe9b0);
  c.addChild(g);
  return c;
}

/** the golden page under Canelo's paws */
export function caneloPageArt(): Graphics {
  const g = new Graphics();
  g.poly([-46, -8, 30, -22, 52, 8, -26, 24]).fill({ color: 0x171317, alpha: 0.35 });
  g.poly([-50, -14, 26, -28, 48, 2, -28, 18]).fill(0xffe2a0).stroke({ width: 3, color: 0xb8862b, join: 'round' });
  for (let i = 0; i < 4; i++) g.moveTo(-34 + i * 6, -10 + i * 6).lineTo(20 + i * 6, -22 + i * 6).stroke({ width: 2, color: 0x8a6420, alpha: 0.6 });
  return g;
}
