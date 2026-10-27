/**
 * F30 · «La noche estrellada» — the sets: every Van Gogh scene is a camera on the same painted island (./world), driven
 * by the SONG time; `regreso` is the island at dusk in the game's own painting (R4: the strokes come down over it).
 */
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { homeSet } from '../../final/props';
import { F30_CATS, vgWorld } from './world';

const mk = (cypress: boolean): SetModule => ({
  cats: ({ canelo }) => F30_CATS(canelo),
  build(ctx: SceneCtx): FilmSet {
    const w = vgWorld(ctx, { cypress });
    return {
      update: (_lt, f) => w.update(f.m, f),
      anchor: (name, f) => w.anchor(name, f),
    };
  },
});
/**
 * THE NIGHT: one scene, one painted world, ten living cats — the shots are camera cuts on the song's bars (one world
 * for the whole film: every puppet ticks every frame, so the film keeps one set of them, not one per shot).
 */
export const noche = mk(true);

/** R4 · your island at dusk, in the game's painting (CINE's island), the camera lifting toward the sky */
export const regreso: SetModule = {
  build(ctx: SceneCtx): FilmSet {
    homeSet(ctx, 'dusk', { x: 1150 });
    return { update: () => undefined };
  },
};
