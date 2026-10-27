/**
 * DEMO · the end: black, the rain still heard in the picture (a few streaks catch the last light), «CONTINUARÁ».
 */
import { Container, Graphics } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../stage';

const mod: SetModule = {
  build(ctx: SceneCtx): FilmSet {
    const node = new Container();
    node.addChild(new Graphics().rect(-1200, -800, 4320, 2680).fill(0x030304));
    ctx.plane(node, { z: 1000, bake: 'none' });
    return { update: () => undefined };
  },
};
export default mod;
