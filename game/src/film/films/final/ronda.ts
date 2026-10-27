/**
 * F40 · PH «La última ronda» (H97, U1–U12): the Borracha's TV cartoon with its laugh track taken away — the same colours
 * as H66, washed; daylight; no rubber bounce, no squash & stretch. 4:3 again. The sign off; La Mano alone in a corner
 * with the glass that erases the night, untouched; Homiau with his donut, uneaten; Hipólito awake. Canelo, with both
 * scarves, sits where he sat in the prologue. Espuma slides him the same drink; he pushes it away; it falls by itself.
 * «Ella siempre venía a buscarme.» / «¿Y luego?» / «Luego me acuerdo de ella. Todos los días.» A coin, not charged.
 * La Mano looks at her glass and does not drink. White.
 */
import { Container, Graphics, Text } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../stage';
import { knitScarf, STAND_INS } from './props';
import { TV } from '../../../momentos/songs/drunck/tv';

const sm = (x: number) => {
  const k = Math.max(0, Math.min(1, x));
  return k * k * (3 - 2 * k);
};
const LW = 6;

const mod: SetModule = {
  cats: ({ canelo }) => [canelo, STAND_INS.homiau, STAND_INS.mano, { slug: STAND_INS.hipolito, bake: 'plano' }, { slug: STAND_INS.espuma, bake: 'plano' }],
  build(ctx: SceneCtx): FilmSet {
    return ctx.scene.id === 'letrero' ? letrero(ctx) : bar(ctx, ctx.scene.id);
  },
};
export default mod;

function letrero(ctx: SceneCtx): FilmSet {
  const n = new Container();
  const g = new Graphics();
  g.rect(-600, -400, 3120, 1880).fill(0xbfd4e2);
  g.rect(260, 160, 1400, 900).fill(TV.brick).rect(260, 160, 1400, 900).stroke({ width: LW, color: TV.line });
  for (let y = 190; y < 1050; y += 46) for (let x = 260 + ((y / 46) % 2) * 40; x < 1660; x += 80) g.rect(x, y, 70, 36).stroke({ width: 2, color: TV.brickD, alpha: 0.6 });
  g.roundRect(520, 260, 880, 150, 20).fill(TV.nightD).roundRect(520, 260, 880, 150, 20).stroke({ width: LW, color: TV.line });
  g.rect(780, 640, 360, 420).fill(TV.woodD).rect(780, 640, 360, 420).stroke({ width: LW, color: TV.line });
  g.rect(-600, 1060, 3120, 400).fill(0x8a8a8a);
  n.addChild(g);
  // the neon, off: grey tubes, the A no longer blinks
  const t = new Text({ text: 'LA ÚLTIMA RONDA', style: { fontFamily: 'Bangers', fontSize: 92, fill: 0x9a9aa4, letterSpacing: 6, stroke: { color: 0x5a5a64, width: 4 } } });
  t.anchor.set(0.5);
  t.position.set(960, 336);
  n.addChild(t);
  ctx.plane(n, { z: 1000, bake: 'static' });
  return { update: () => undefined };
}

function bar(ctx: SceneCtx, id: string): FilmSet {
  const n = new Container();
  const g = new Graphics();
  g.rect(-600, -400, 3120, 1880).fill(TV.night);
  g.rect(-600, -400, 3120, 900).fill(0x6a5a7a);
  // the window and its dusty daylight
  g.rect(1300, 120, 420, 300).fill(0xdfe8f0).rect(1300, 120, 420, 300).stroke({ width: LW, color: TV.line });
  g.poly([1300, 420, 1720, 420, 1500, 900, 1000, 900]).fill({ color: 0xfff6e0, alpha: 0.18 });
  // the counter
  g.rect(-200, 620, 1500, 60).fill(TV.wood).rect(-200, 620, 1500, 60).stroke({ width: LW, color: TV.line });
  g.rect(-200, 680, 1500, 400).fill(TV.woodD).rect(-200, 680, 1500, 400).stroke({ width: LW, color: TV.line });
  // the corner table
  g.rect(1450, 760, 300, 30).fill(TV.wood).rect(1450, 760, 300, 30).stroke({ width: LW, color: TV.line }).rect(1590, 790, 20, 260).fill(TV.woodD);
  g.rect(-600, 1060, 3120, 400).fill(TV.nightD);
  n.addChild(g);
  ctx.plane(n, { z: 1100, bake: 'static' });
  const st = new Container();
  const espuma = ctx.actorAs('plano', STAND_INS.espuma, 300);
  const hipo = ctx.actorAs('plano', STAND_INS.hipolito, 260);
  const homiau = ctx.actor(STAND_INS.homiau, 240);
  const mano = ctx.actor(STAND_INS.mano, 260);
  const can = ctx.actor(ctx.canelo, 230);
  const knit = knitScarf(110);
  const glass = new Graphics();
  const maglass = new Graphics().roundRect(-18, -60, 36, 60, 6).fill({ color: TV.amberL, alpha: 0.85 }).roundRect(-18, -60, 36, 60, 6).stroke({ width: 4, color: TV.line });
  const donut = new Graphics().circle(0, 0, 20).fill(TV.pink).circle(0, 0, 8).fill(TV.line).circle(0, 0, 20).stroke({ width: 4, color: TV.line });
  const shards = new Graphics();
  const coin = new Graphics().circle(0, 0, 10).fill(TV.amber).circle(0, 0, 10).stroke({ width: 3, color: TV.line });
  for (const a of [espuma, hipo, homiau, mano, can]) if (a) st.addChild(a);
  st.addChild(knit, glass, maglass, donut, shards, coin);
  ctx.plane(st, { z: 1000 });
  return {
    update(lt) {
      if (espuma) espuma.pose(lt, 520, 620, {});
      if (hipo) {
        hipo.pose(lt, 160, 640, { flip: true });
        if (hipo.puppet) hipo.puppet.sleeping = false;
      }
      if (homiau) homiau.pose(lt, 360, 640, { flip: true });
      donut.position.set(420, 600);
      // his painting holds his own donut (uneaten, at his cheek): the stand-in's drawn donut would be a second one
      donut.visible = !homiau;
      if (mano) mano.pose(lt, 1650, 770, { flip: false });
      maglass.position.set(1530, 760);
      // Canelo comes in (bar) and sits where he sat in the prologue
      const enter = id === 'bar' ? sm((lt - 15) / 3) : 1;
      const cx = 1150 - enter * 330;
      if (can) {
        can.visible = id !== 'bar' || lt > 14.5;
        can.pose(lt, cx, 640, { flip: false });
        if (can.puppet) can.puppet.walk = enter > 0.02 && enter < 0.98 ? 1 : 0;
      }
      knit.position.set(cx - 10, 640 - 150);
      knit.scale.set(0.75);
      knit.visible = !!can?.visible;
      // the same drink slides to him (vaso), he pushes it, it falls by itself and breaks
      glass.clear();
      shards.clear();
      const slide = id === 'vaso' ? sm(lt / 2) : id === 'bar' ? 0 : 1;
      const push = id === 'vaso' ? sm((lt - 5) / 2.4) : id === 'bar' ? 0 : 1;
      const gx = 600 + slide * 160 + push * 220;
      const falling = id === 'vaso' ? sm((lt - 7.4) / 0.6) : id === 'bar' ? 0 : 1;
      if (falling < 1 && (id === 'vaso' || id === 'bar')) glass.roundRect(gx - 20, 560 + falling * 440, 40, 64, 6).fill({ color: TV.amberL, alpha: 0.85 }).roundRect(gx - 20, 560 + falling * 440, 40, 64, 6).stroke({ width: 4, color: TV.line });
      if (falling >= 1 || id === 'barra' || id === 'mano') for (let i = 0; i < 7; i++) shards.poly([gx - 60 + i * 20, 1050, gx - 50 + i * 20, 1036, gx - 42 + i * 20, 1050]).fill({ color: 0xe8f0f8, alpha: 0.9 });
      coin.visible = id === 'barra' && lt > 14;
      coin.position.set(cx + 60, 610);
      // every frame (the warm-up draws late instants first: state must never leak)
      if (can) can.alpha = id === 'barra' ? 1 - sm((lt - 16) / 2) : 1;
    },
  };
}
