/**
 * F06 EM%EN «Cuadra 8» — the scenes (shot list: ./index.ts). One generic stage (the parking lot, the cast, the crowd,
 * the tape) directed per scene by a `direct(lt, m, S)` function: shots are cuts inside a scene (positions + the engine
 * camera with 'hold' keys), the bursts are insert plates over the frame.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { FilmSet, FrameInfo, SceneCtx, SetModule } from '../../../stage';
import type { PostLook } from '../../../post';
import { Beam, TV, balloon, box, donut, kitTex, lanternAt, mug, outBack, popIn, rnd, seg, sm, springIn, word } from '../kit';
import { BAR, BOCINA, BORRON, CROWD, Cast, Crowd, DONA, ESPUMA, EMIAU, GRAFITERA, HIPO, HOMIAU, SCRATCH, Lyrics, Sodium, T, VhsHud, Wash, lotBack, sceneStart, type LineSpec } from './lot';

export interface Stage {
  ctx: SceneCtx;
  t0: number;
  cast: Cast;
  crowd: Crowd;
  fore: Crowd | null;
  sodium: Sodium;
  hud: VhsHud;
  lyr: Lyrics;
  wash: Wash;
  /** world fx (over the actors) and screen fx (over the picture, under the type) */
  fx: Graphics;
  sfx: Graphics;
  beam: Beam;
  door: Sprite;
  spot: Sprite;
  inserts: Insert[];
  extra: Record<string, Container>;
}
export interface Insert {
  a: number;
  b: number;
  root: Container;
}
interface SceneOpts {
  cats?: string[];
  cast: ConstructorParameters<typeof Cast>[1];
  lines?: LineSpec[];
  fore?: boolean;
  crowd?: ConstructorParameters<typeof Crowd>[1];
  /** insert plates (bursts): film times + a builder */
  inserts?: { a: number; b: number; make: (ctx: SceneCtx) => Container }[];
  /** extra named things built once (a chair, the mic, a bar counter) */
  extra?: (ctx: SceneCtx, S: Omit<Stage, 'extra'>) => Record<string, Container>;
  direct: (lt: number, m: number, S: Stage, f: FrameInfo) => void;
  look?: (lt: number, m: number) => Partial<PostLook> | null;
  door?: boolean;
}
const CAT_LIST = (o: SceneOpts, canelo: string) => {
  const s = new Set<string>(o.cats ?? []);
  const w = o.cast;
  if (w.canelo) s.add(canelo);
  if (w.emiau) s.add(EMIAU);
  if (w.luz) s.add('luzterna');
  if (w.hipo) s.add(HIPO);
  if (w.dona) s.add(DONA);
  if (w.espuma) s.add(ESPUMA);
  if (w.homiau) s.add(HOMIAU);
  for (const c of CROWD) s.add(c);
  s.add(BOCINA);
  s.add(SCRATCH);
  s.add(GRAFITERA);
  s.add(BORRON);
  return [...s];
};

export function scene(o: SceneOpts): SetModule {
  return {
    cats: ({ canelo }) => CAT_LIST(o, canelo),
    build(ctx): FilmSet {
      const t0 = sceneStart(ctx);
      const back = lotBack(ctx, { door: o.door });
      ctx.plane(back, { z: 1500, bake: 'dof', blur: 9, dof: 1300 });
      const mid = new Container();
      const door = new Sprite(kitTex(ctx, 'glow'));
      door.anchor.set(0.5);
      door.position.set(1660, 450);
      door.scale.set(1.8, 2.6);
      door.tint = 0xffc27a;
      door.blendMode = 'add';
      door.alpha = 0;
      const crowd = new Crowd(ctx, { faces: [CROWD[0], GRAFITERA, CROWD[2], CROWD[1], BORRON, CROWD[3], BOCINA, SCRATCH, CROWD[5]], ...(o.crowd ?? {}) });
      const sodium = new Sodium(ctx);
      const spot = new Sprite(kitTex(ctx, 'glow'));
      spot.anchor.set(0.5);
      spot.position.set(960, 880);
      spot.scale.set(5, 1.6);
      spot.tint = 0xfff1c8;
      spot.blendMode = 'add';
      spot.alpha = 0;
      const cast = new Cast(ctx, o.cast);
      mid.addChild(door, sodium, crowd, spot);
      if (cast.hipo) mid.addChild(cast.hipo);
      if (cast.luz?.actor) mid.addChild(cast.luz.actor);
      if (cast.homiau) mid.addChild(cast.homiau);
      if (cast.dona) mid.addChild(cast.dona);
      if (cast.espuma) mid.addChild(cast.espuma);
      if (cast.emiau) mid.addChild(cast.emiau);
      mid.addChild(cast.chain);
      if (cast.canelo) mid.addChild(cast.canelo);
      const fx = new Graphics();
      const beam = new Beam(ctx);
      mid.addChild(cast.fx, cast.lglow, beam, fx);
      ctx.plane(mid, { z: 1000 });
      const fore = o.fore ? new Crowd(ctx, { rows: [[1260, 520, 5, 100, 1820]], tint: 0x1a1424 }) : null;
      if (fore) ctx.plane(fore, { z: 620, dof: 500 });
      // the screen: wash, inserts, screen fx, the bars, the tape
      const wash = new Wash();
      ctx.plane(wash, { z: 0, screen: true });
      const ins: Insert[] = (o.inserts ?? []).map((x) => {
        const root = x.make(ctx);
        root.visible = false;
        return { a: x.a, b: x.b, root };
      });
      const insC = new Container();
      for (const i of ins) insC.addChild(i.root);
      const sfx = new Graphics();
      insC.addChild(sfx);
      ctx.plane(insC, { z: 0, screen: true });
      const lyr = new Lyrics(ctx, o.lines ?? [], t0);
      ctx.plane(lyr, { z: 0, screen: true });
      const hud = new VhsHud(ctx);
      ctx.plane(hud, { z: 0, screen: true });
      const base = { ctx, t0, cast, crowd, fore, sodium, hud, lyr, wash, fx, sfx, beam, door, spot, inserts: ins };
      const extra = o.extra?.(ctx, base) ?? {};
      const S: Stage = { ...base, extra };
      // warm EVERYTHING once (the engine's warm only draws what shows at a scene's start, middle and end): inserts,
      // actors, extras and every word tessellate / upload now, never on their first frame on the clock
      for (const c of [mid, insC, lyr]) {
        const restore = showAll(c);
        ctx.baker.warm(c);
        restore();
      }
      return {
        update(lt, f) {
          const m = t0 + lt;
          cast.drive.tick(lt);
          fx.clear();
          sfx.clear();
          cast.fx.clear();
          for (const i of ins) i.root.visible = m >= i.a && m < i.b;
          o.direct(lt, m, S, f);
          cast.drawChain();
          lyr.update(lt);
        },
        look: o.look ? (lt) => o.look!(lt, t0 + lt) : undefined,
      };
    },
  };
}

/** make a whole subtree visible (returns the undo) */
function showAll(c: Container): () => void {
  const was: [Container, boolean][] = [];
  const walk = (n: Container) => {
    for (const ch of n.children) {
      was.push([ch, ch.visible]);
      ch.visible = true;
      walk(ch);
    }
  };
  walk(c);
  return () => {
    for (const [n, v] of was) n.visible = v;
  };
}

// ------------------------------------------------------------------ shared direction helpers
/** the kick envelope (0..1): crowds nod, the frame breathes */
export const kick = (S: Stage, m: number) => S.ctx.k.env('kick', m, 0.12, 0.3);
/** pose helper: hide when not in the shot */
export function put(a: { visible: boolean; pose?: (m: number, x: number, y: number, o?: object) => unknown } | null | undefined, on: boolean, lt: number, x = 0, y = 0, o: object = {}) {
  if (!a) return;
  a.visible = on;
  if (on && a.pose) a.pose(lt, x, y, o);
}
export function homiauAt(S: Stage, on: boolean, lt: number, x: number, y: number, o: Parameters<NonNullable<Stage['cast']['homiau']>['act']>[1] = {}, s?: number) {
  const h = S.cast.homiau;
  if (!h) return;
  h.visible = on;
  if (!on) return;
  h.position.set(x, y);
  if (s) h.scale.set(s);
  h.act(lt, o);
}
/** a memory plate (VHS insert): a frame with something drawn in the Borracha's cartoon */
export function plate(ctx: SceneCtx, draw: (g: Graphics, c: Container) => void, tint = 0x1b2456): Container {
  const c = new Container();
  const g = new Graphics();
  g.rect(-200, -200, 2320, 1480).fill(tint);
  c.addChild(g);
  draw(g, c);
  return c;
}
export { BAR, T, Beam, TV, balloon, box, donut, kitTex, lanternAt, mug, outBack, popIn, rnd, seg, sm, springIn, word };
