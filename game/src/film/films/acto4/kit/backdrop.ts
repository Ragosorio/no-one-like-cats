/**
 * ACTO IV — the backdrop of La Gira for FILM-ACTO1's briefing template (films/plantilla, `registerBriefingSkin('p3d_pop')`):
 * the stage of the stadium seen from the crowd, the stage's own NAME on the LED marquee over it, the rig and the bowl.
 * `door` = the trapdoor in the middle of the stage (Cerito's footprints lead there; the rival comes up from it).
 */
import { Container, Graphics, type Sprite } from 'pixi.js';
import type { SceneCtx } from '../../../stage';
import type { BriefingBackdropArgs } from '../../plantilla';
import { POP } from '../../../styles/pop';
import { arenaBack, crowdFront, glowAt, stageDeck } from './stadium';
import { word } from '../../acto1/kit';

const NEONS = [POP.pink, POP.cyan, POP.yellow, POP.lilac, POP.mint];

export function backdrop(ctx: SceneCtx, a: BriefingBackdropArgs): { root: Container; glows: Sprite[]; door: [number, number] } {
  const root = new Container();
  const neon = NEONS[a.seed % NEONS.length];
  root.addChild(arenaBack({ seed: a.seed, w: 2400, h: 1400 }));
  root.addChild(stageDeck({ y: 720, edge: neon }));
  // the marquee: a wide LED screen over the stage with the stage's name (an LED grid of dots over it)
  const g = new Graphics();
  g.roundRect(420, 170, 1080, 260, 12).fill(0x0c0a12).stroke({ width: 6, color: 0x3a3450 });
  g.rect(440, 190, 1040, 220).fill(0x14082a);
  for (let i = 0; i < 11; i++) g.rect(440, 190 + i * 20, 1040, 10).fill({ color: neon, alpha: 0.06 });
  // the rig over the marquee
  g.rect(260, 110, 1400, 8).fill(0x8a8aa0).rect(260, 150, 1400, 8).fill(0x8a8aa0);
  for (let x = 260; x < 1660; x += 40) g.moveTo(x, 114).lineTo(x + 20, 154).lineTo(x + 40, 114).stroke({ width: 3, color: 0x8a8aa0 });
  root.addChild(g);
  const size = a.title.length > 18 ? 66 : a.title.length > 12 ? 84 : 104;
  const t = word(ctx.k, a.title.toUpperCase(), { fontFamily: 'Anton', fontSize: size, fill: 0xffffff, stroke: { color: neon, width: size * 0.1, join: 'round' }, letterSpacing: size * 0.08 });
  t.position.set(960, 300);
  if (t.width > 980) t.scale.set(980 / t.width);
  root.addChild(t);
  const dots = new Graphics();
  for (let y = 196; y < 410; y += 8) for (let x = 446; x < 1480; x += 8) dots.rect(x, y, 2, 2);
  dots.fill({ color: 0x000000, alpha: 0.28 });
  root.addChild(dots);
  root.addChild(crowdFront({ y: 1090, seed: a.seed, phones: true }));
  const glows: Sprite[] = [];
  for (const [x, y, s, col] of [
    [960, 300, 4.2, neon],
    [960, 760, 1.6, POP.lilac],
    [520, 170, 1.0, POP.pink],
    [1400, 170, 1.0, POP.cyan],
  ] as const) {
    const gl = glowAt(ctx, x, y, s, col, 0.5);
    if (gl) {
      glows.push(gl);
      root.addChild(gl);
    }
  }
  return { root, glows, door: [960, 770] };
}
export default backdrop;
