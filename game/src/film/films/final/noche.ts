/**
 * F33 · PH «La noche sin Canelo» (H94, N1–N11). The game's own painting at night, no filters, no music: sea, the blue
 * beam, drops. Canelo on his side, grey, no flame; his scarf where it fell. She tries three times to light his tail with
 * her lantern: her light cannot — alone (pasada 7: at dawn it will help Cerito, not replace him). The cats come one by one with a gesture. Cut to the ink ship: La Mano looks; through
 * her eyes the cone covers Cerito and Canelo like a bell — and the camera goes down the cone to HER BACK, IN SHADOW
 * (the rule, shown without a word). She starts the old errand and does not finish it. The Bitácora in her hand. From
 * 90 s the lighthouse glows: the player touches it when they want (a gate).
 *
 * Shots by scene id: casa1 (N1–N4) · barco (N5) · cono (N6, on Canelo) · barco2 (N8) · casa2 (N9–N11).
 */
import { Container, Graphics } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../stage';
import { beamFan, bitacoraCard, COL, homeSet, inkShip, lantern, manoFigure, RuleCone, scarfOnGround, STAND_INS } from './props';

const sm = (x: number) => {
  const k = Math.max(0, Math.min(1, x));
  return k * k * (3 - 2 * k);
};
/** the guests come in early (`in`), and make their gesture when touched or on their own (`t`) */
const GUESTS = [
  { slug: STAND_INS.hipolito, in: 1.5, t: 27, x: 1380, prop: 'tarro' },
  { slug: STAND_INS.homiau, in: 4, t: 30, x: 560, prop: 'dona' },
  { slug: STAND_INS.grafitera, in: 7, t: 33, x: 1500, prop: 'llama' },
  { slug: STAND_INS.maneki, in: 10, t: 36, x: 420, prop: 'escoba' },
] as const;

const mod: SetModule = {
  cats: ({ canelo }) => [
    'luzterna',
    STAND_INS.cerito,
    ...GUESTS.map((g) => g.slug),
    { slug: canelo, bake: 'gris' },
    { slug: STAND_INS.mano, bake: 'plano' },
    { slug: 'luzterna', bake: 'plano' },
  ],
  build(ctx: SceneCtx): FilmSet {
    if (ctx.scene.id.startsWith('barco')) return barco(ctx, ctx.scene.id === 'barco2');
    return casa(ctx, ctx.scene.id);
  },
};
export default mod;

function casa(ctx: SceneCtx, id: string): FilmSet {
  const isl = homeSet(ctx, 'night', { x: 1260 });
  const beam = new Container();
  const fan = beamFan(COL.lanternBlue, 1800, 0.07);
  fan.position.set(...isl.lamp);
  beam.addChild(fan);
  ctx.plane(beam, { z: 1000 });
  const st = new Container();
  const gy = (x: number) => isl.ground(x) + 4;
  const CAN: [number, number] = [780, gy(780) + 10];
  const LUZ: [number, number] = [1000, gy(1000) - 90];
  const can = ctx.actorAs('gris', ctx.canelo, 200);
  const scarf = scarfOnGround(140);
  scarf.position.set(CAN[0] - 120, CAN[1] - 6);
  const cer = ctx.actor(STAND_INS.cerito, 120);
  const luz = ctx.actor('luzterna', 260);
  const lamp = lantern(false, 1);
  const tryBeam = new Graphics();
  const cone = new RuleCone(ctx.silhouette('luzterna'));
  st.addChild(scarf);
  if (can) st.addChild(can);
  if (cer) st.addChild(cer);
  const guests = GUESTS.map((g) => {
    const a = ctx.actor(g.slug, 170);
    const p = new Graphics();
    if (g.prop === 'tarro') p.roundRect(-16, -40, 32, 40, 4).fill({ color: 0xf4a62a, alpha: 0.9 }).rect(-16, -46, 32, 10).fill(0xfff6e0);
    if (g.prop === 'dona') p.circle(0, -12, 16).fill(0xff7fb0).circle(0, -12, 6).fill(0x1d1430);
    if (g.prop === 'llama') p.ellipse(0, -16, 28, 18).fill(0x6a6a6a);
    if (g.prop === 'escoba') p.moveTo(0, 0).lineTo(30, -120).stroke({ width: 5, color: 0x8a6a3a });
    if (a) st.addChild(a);
    st.addChild(p);
    return { g, a, p };
  });
  if (luz) st.addChild(luz);
  st.addChild(tryBeam, lamp, cone.root);
  const card = bitacoraCard(['PASA: El gordo no se levanta', 'IMPORTA: Es el gordo', 'QUEREMOS: Que vuelva', 'AHÍ: Es su palmera'], { hand: 'luz', w: 560, size: 29 });
  card.root.position.set(80, 140);
  card.root.alpha = 0;
  const ui = new Container();
  ui.addChild(card.root);
  ctx.plane(st, { z: 1000 });
  ctx.plane(ui, { z: 0, screen: true });
  let lanternAt: [number, number] = [-70, -140];
  if (luz?.puppet) {
    const p = luz.puppet;
    lanternAt = [(104 - p.anchor.x * p.W) * p.scale.x, (318 - p.anchor.y * p.H) * p.scale.y];
  }
  const glow = new Graphics();
  const drops = new Graphics();
  st.addChild(glow, drops);
  /** free touches: when each thing was touched (scene time), and where the spots are (plane coords) */
  const touched: Record<string, number> = {};
  const spots: Record<string, [number, number, number]> = {};
  let lampScreen: [number, number] = [isl.lamp[0], isl.lamp[1]];
  const planeOfLamp = ctx.plane(new Container(), { z: 1000 });
  return {
    update(lt, f) {
      // the beam sweeps the sky (seen from the side: it shortens as it turns toward us)
      fan.rotation = -Math.PI / 2 + Math.sin(lt * (f.rm ? 0.15 : 0.4)) * 1.35;
      fan.scale.set(0.35 + 0.65 * Math.abs(Math.cos(lt * (f.rm ? 0.07 : 0.2))), 1);
      if (can) {
        can.pose(lt, CAN[0], CAN[1], { flip: true, rot: 1.45 });
        if (can.puppet) can.puppet.sleeping = true;
      }
      // Cerito curls up by his tail at 38 s (or when touched — he is there from the start, watching)
      const curl = id === 'casa1' ? sm((lt - Math.min(38, touched['cerito'] ?? Infinity)) / 1.5) : 1;
      if (cer) cer.pose(lt, CAN[0] + 150 - curl * 340, gy(CAN[0] + 150 - curl * 340), { flip: curl < 0.5 });
      // she floats next to him; (casa2) she leans over him, then sits in the air holding the light over Cerito
      const lean = id === 'casa2' ? sm((lt - 1) / 2) * (1 - sm((lt - 14) / 3)) : 0;
      const lx = LUZ[0] - lean * 90;
      const ly = LUZ[1] + lean * 40 + (id === 'casa2' ? sm((lt - 14) / 3) * 30 : 0);
      if (luz) luz.pose(lt, lx, ly, { flip: false, rot: -lean * 0.12 });
      const lan: [number, number] = [lx + lanternAt[0], ly + lanternAt[1]];
      lamp.position.set(lan[0], lan[1] + 26);
      // N2: three tries at his tail, each closer; nothing
      tryBeam.clear();
      if (id === 'casa1' && lt > 8 && lt < 20) {
        const tries = [8.4, 12.2, 16.0];
        for (const [i, t0] of tries.entries()) {
          const p = (lt - t0) / 3.2;
          if (p < 0 || p > 1) continue;
          const a = Math.sin(p * Math.PI) * (0.25 + i * 0.12);
          tryBeam.poly([lan[0], lan[1] - 8, lan[0], lan[1] + 8, CAN[0] + 120, CAN[1] - 10, CAN[0] + 120, CAN[1] - 60]).fill({ color: COL.lanternBlue, alpha: a });
        }
      }
      // the guests: they come in early; each gesture lands when touched, or on its own (N4)
      for (const { g, a, p } of guests) {
        const show = id === 'casa1' ? sm((lt - g.in) / 1.6) : 1;
        const x = g.x + (1 - show) * (g.x < 960 ? -500 : 500);
        if (a) {
          a.visible = show > 0.01;
          a.pose(lt, x, gy(x), { flip: g.x < 960 });
          if (a.puppet) a.puppet.walk = show > 0.01 && show < 0.99 ? 1 : 0;
        }
        const when = id === 'casa1' ? Math.min(g.t, touched[g.slug] ?? Infinity) : -1;
        const done = sm((lt - when) / 1.2);
        p.visible = done > 0.02;
        p.alpha = done;
        const near = g.x < 960 ? CAN[0] - 260 + (g.prop === 'escoba' ? -40 : 0) : CAN[0] + 210;
        p.position.set(g.prop === 'escoba' ? x + 40 : near, gy(near));
        if (g.prop === 'escoba') p.rotation = f.rm ? 0 : Math.sin(lt * 3) * 0.25 * done;
        spots[g.slug] = [x, gy(x) - 80, 90];
      }
      // touches: the scarf's fringe lifts; the palm lets drops fall; the lighthouse answers with a weak pulse
      const sTap = lt - (touched['bufanda'] ?? -99);
      scarf.rotation = sTap < 1.4 && !f.rm ? Math.sin(sTap * 9) * 0.06 * (1 - sTap / 1.4) : 0;
      drops.clear();
      const pTap = lt - (touched['palmera'] ?? -99);
      if (pTap >= 0 && pTap < 1.6) for (let i = 0; i < 7; i++) drops.circle(isl.palm[0] + (i - 3) * 40, isl.palm[1] + 40 + pTap * pTap * 380 + (i % 2) * 30, 4).fill({ color: 0xbfe0ff, alpha: 0.8 * (1 - pTap / 1.6) });
      const fTap = lt - (touched['faro'] ?? -99);
      const pulse = fTap >= 0 && fTap < 1 ? Math.sin((fTap / 1) * Math.PI) * 0.18 : 0;
      spots['bufanda'] = [scarf.x, scarf.y, 80];
      spots['palmera'] = [isl.palm[0], isl.palm[1], 110];
      spots['faro'] = [isl.lamp[0], isl.lamp[1] + 160, 120];
      if (cer) spots['cerito'] = [cer.x, cer.y - 50, 70];
      // the light over Cerito and Canelo, her back in shadow (casa2 N10; the cone shot has its own scene)
      // (R1) the cone shot looks at the two, never at her back; in the wide N10 her back is in shadow, unstressed
      const coneA = id === 'cono' ? 1 : id === 'casa2' ? sm((lt - 14) / 2) : 0;
      if (luz) cone.follow(luz.x, luz.y, luz.scale.x * (luz.puppet?.scale.x ?? 1), luz.scale.y * (luz.puppet?.scale.y ?? 1));
      cone.draw(lan, CAN[0] - 320, CAN[0] + 140, gy(CAN[0]) + 10, coneA, lan[0] + 20, COL.lanternBlue, id === 'cono' ? 0 : 0.45);
      card.root.alpha = id === 'casa2' ? sm((lt - 16) / 1.5) : 0;
      // N11: the lighthouse glows a little more — touch it when you want
      glow.clear();
      const ready = id === 'casa2' && lt > 30 ? 0.25 * sm((lt - 30) / 1.5) : 0;
      if (ready + pulse > 0.001) glow.circle(isl.lamp[0], isl.lamp[1], 70 + Math.sin(lt * 2.4) * 8).fill({ color: COL.lanternBlue, alpha: ready + pulse });
      lampScreen = f.toScreen(planeOfLamp, isl.lamp);
    },
    anchor: (name) => (name === 'faro' ? [lampScreen[0], lampScreen[1] + 110] : null),
    hotspots: (f) =>
      id === 'casa1' || id === 'casa2'
        ? Object.entries(spots).map(([name, [x, y, r]]) => {
            const [sx, sy] = f.toScreen(planeOfLamp, [x, y]);
            return { name, x: sx, y: sy, r: r * planeOfLamp.x.s };
          })
        : [],
    tap: (name, lt) => {
      touched[name] = lt;
    },
  };
}

/** N5 / N8 — the ink ship anchored; La Mano at the prow, still, looking at the island; (N8) she narrows her eyes */
function barco(ctx: SceneCtx, close: boolean): FilmSet {
  homeSet(ctx, 'night', { x: 2400 });
  const n = new Container();
  const ship = inkShip(1.3);
  ship.position.set(960, 700);
  const mano = manoFigure(ctx, 'plano', 300);
  mano.root.position.set(700, 700);
  n.addChild(ship, mano.root);
  ctx.plane(n, { z: 1000 });
  const lid = new Graphics();
  n.addChild(lid);
  return {
    update(lt) {
      mano.hand.rotation = Math.sin(lt * 0.6) * 0.03;
      lid.clear();
      // N8: the eyes narrow (a pale lid line across the stand-in's face)
      if (close && lt > 1.2) lid.rect(640, 495, 120, 10 * sm((lt - 1.2) / 0.8)).fill({ color: 0xe8e4f0, alpha: 0.9 });
    },
  };
}
