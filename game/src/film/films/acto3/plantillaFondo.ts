/**
 * ACTO III · the backdrop of FILM-ACTO1's briefing TEMPLATE for the Library (p3d_libros): a storybook plate of a
 * reading room — shelves to the vault, a stained-glass light from very high, the stage's name on a gilt label over an
 * arched door (where Cerito's prints lead and the rival steps out). Drawn once (the template bakes it static).
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { SceneCtx } from '../../stage';
import type { BriefingBackdropArgs } from '../plantilla';
import { glowSprite, LB, rnd, word } from './kit';

export function backdrop(ctx: SceneCtx, a: BriefingBackdropArgs): { root: Container; glows: Sprite[]; door: [number, number] } {
  const root = new Container();
  const g = new Graphics();
  const s = a.seed;
  // the vault and the wall of shelves (watercolour flats, sepia line)
  g.rect(-400, -400, 2720, 1700).fill(0xcbb48a);
  g.rect(-400, -400, 2720, 300).fill(0x9a7a52);
  for (let i = 0; i < 11; i++) {
    const x = -380 + i * 250;
    g.rect(x, -100, 220, 870).fill(0xa8855a).stroke({ width: 3, color: LB.sepia });
    for (let r = 0; r < 6; r++) {
      const y = -70 + r * 140;
      for (let j = 0; j < 9; j++) {
        const h = 90 + rnd(i * 31 + r * 7 + j + s) * 30;
        g.rect(x + 10 + j * 23, y + 120 - h, 19, h).fill([0x8a3a2a, 0x3a5a6a, 0x6a6a3a, 0x9a7a3a, 0x5a3a5a][(i + r * 2 + j + s) % 5]);
      }
      g.rect(x, y + 120, 220, 8).fill(0x6a4a2a);
    }
  }
  // the reading-room floor: pages laid like tiles
  g.rect(-400, 770, 2720, 600).fill(0xe2d4b4);
  for (let i = 0; i < 14; i++) g.moveTo(-300 + i * 200, 770).lineTo(-900 + i * 300, 1300).stroke({ width: 2, color: LB.sepiaL, alpha: 0.5 });
  for (let j = 0; j < 5; j++) g.rect(-400, 800 + j * j * 26, 2720, 2).fill({ color: LB.sepiaL, alpha: 0.4 });
  // the arched door in the middle (dark), its frame and a lectern of light
  g.moveTo(830, 770).lineTo(830, 520).arc(960, 520, 130, Math.PI, 0).lineTo(1090, 770).closePath().fill(0x2a1a10).stroke({ width: 8, color: 0x7a5232 });
  g.moveTo(860, 770).lineTo(860, 530).arc(960, 530, 100, Math.PI, 0).lineTo(1060, 770).closePath().fill(0x120a06);
  // the gilt label (where the stage's name is written)
  g.roundRect(560, 210, 800, 150, 16).fill(0x5a2418).stroke({ width: 6, color: 0xc8a050 });
  g.roundRect(576, 226, 768, 118, 10).stroke({ width: 2, color: 0xc8a050 });
  root.addChild(g);
  const size = a.title.length > 18 ? 52 : a.title.length > 12 ? 64 : 78;
  const t = word(ctx.k, a.title.toUpperCase(), { fontFamily: 'Playfair Display', fontWeight: '700', fontSize: size, fill: 0xf0d080, letterSpacing: size * 0.08 });
  t.position.set(960, 285);
  if (t.width > 740) t.scale.set(740 / t.width);
  root.addChild(t);
  const glows: Sprite[] = [];
  for (const [x, y, sc, col] of [
    [960, 285, 4.6, 0xf0c060],
    [960, 640, 2.2, 0xffd9a0],
    [960, -120, 5.5, 0xe8f0ff],
  ] as const) {
    const gl = glowSprite(ctx, col, sc);
    gl.alpha = 0.5;
    glows.push(gl);
    root.addChild(gl);
  }
  return { root, glows, door: [960, 770] };
}
export default backdrop;
