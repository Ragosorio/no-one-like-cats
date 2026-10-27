/**
 * ACTO I — a placeholder set (a TV card with the film's title) for a film whose sets are still being produced.
 */
import { Container, Graphics } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { TV, TvScreen, word } from './index';

export const stub: SetModule = {
  build(ctx: SceneCtx): FilmSet {
    const c = new Container();
    c.addChild(new Graphics().rect(0, -200, 1920, 1480).fill(TV.night));
    const t = word(ctx.k, ctx.film.title.toUpperCase(), { fontFamily: 'Bangers', fontSize: 110, fill: TV.cream, stroke: { color: TV.line, width: 10 }, letterSpacing: 4 });
    t.position.set(960, 520);
    c.addChild(t);
    ctx.plane(c, { z: 1000 });
    const tv = new TvScreen(ctx);
    ctx.plane(tv, { z: 0, screen: true });
    return { update: (_lt, f) => tv.update(f) };
  },
};
