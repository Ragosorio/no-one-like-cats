/**
 * F31 · PP «Se acerca una luz» (H93, T1–T9): the first time Part III stops being a drawing — storm realism, handheld,
 * the bars coming in to scope. Itō comes out of the cat flap soaked, without threads, to warn: «Vienen esta noche. Por los
 * ojos del gato.» The siege shown (two ships, one cannon each; until both sink, the ink ship stays back). He bows only to
 * Canelo, as to someone going to his last fight. She fixes his scarf with the beam. LO QUE ARRIESGAMOS, the ink running
 * in the rain. Music: «fut.jefe.grave» under the storm.
 *
 * F36 · PH «MIRA» (H94, O1–O6): black, only pairs of eyes; one optional MIRA (he looks on his own anyway); through his
 * eyes, CAT VISION — two colours, the dark seen clear: Cerito, without static, looks at Canelo and chooses fur; every
 * cat's eyes light round the lighthouse; the ink ships stop; La Mano lowers her nib. The Capi's hand: CAMBIÓ.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../stage';
import { beamFan, bitacoraCard, COL, furOver, homeSet, inkShip, lantern, manoFigure, scarfOnGround, STAND_INS } from './props';

const sm = (x: number) => {
  const k = Math.max(0, Math.min(1, x));
  return k * k * (3 - 2 * k);
};

const mod: SetModule = {
  cats: ({ canelo, scene }) =>
    scene === 'vision'
      ? [canelo, STAND_INS.cerito, STAND_INS.ceritoGato, STAND_INS.hipolito, STAND_INS.grafitera, STAND_INS.maneki, { slug: STAND_INS.mano, bake: 'plano' }]
      : scene === 'ojos' || scene === 'cambio' || scene === 'bitacora'
        ? []
        : [canelo, 'luzterna', STAND_INS.cerito, STAND_INS.hipolito, STAND_INS.ito],
  build(ctx: SceneCtx): FilmSet {
    const id = ctx.scene.id;
    if (id === 'ojos') return ojos(ctx);
    if (id === 'vision') return vision(ctx);
    if (id === 'cambio' || id === 'bitacora') return card(ctx, id);
    if (id === 'cielo') return cielo(ctx);
    return isla(ctx, id);
  },
};
export default mod;

/** T1–T4, T7–T8: the island in the storm, the cat flap, the group under the eave */
function isla(ctx: SceneCtx, id: string): FilmSet {
  const isl = homeSet(ctx, 'storm', { x: 1150, palmBend: 70 });
  const beam = new Container();
  const fan = beamFan(COL.lanternBlue, 1600, 0.07);
  fan.position.set(...isl.lamp);
  beam.addChild(fan);
  ctx.plane(beam, { z: 1000 });
  const st = new Container();
  const gy = (x: number) => isl.ground(x) + 4;
  const door: [number, number] = [isl.step[0] - 34, isl.step[1]];
  const ito = ctx.actor(STAND_INS.ito, 230);
  const can = ctx.actor(ctx.canelo, 210);
  const luz = ctx.actor('luzterna', 250);
  const cer = ctx.actor(STAND_INS.cerito, 120);
  const hip = ctx.actor(STAND_INS.hipolito, 190);
  const flame = new Graphics();
  const lamp = lantern(false, 1);
  const beamHand = new Graphics();
  for (const a of [hip, cer, can, luz, ito]) if (a) st.addChild(a);
  st.addChild(flame, lamp, beamHand);
  ctx.plane(st, { z: 1000 });
  const CAN: [number, number] = [door[0] - 360, gy(door[0] - 360)];
  return {
    update(lt, f) {
      fan.rotation = -Math.PI / 2 + Math.sin(lt * (f.rm ? 0.15 : 0.4)) * 1.35;
      fan.scale.set(0.35 + 0.65 * Math.abs(Math.cos(lt * 0.2)), 1);
      const group = id !== 'isla';
      for (const a of [can, luz, cer, hip]) if (a) a.visible = group;
      if (can) can.pose(lt, CAN[0], CAN[1], { flip: true });
      if (luz) luz.pose(lt, CAN[0] - 220, CAN[1] - 90, { flip: true });
      if (cer) cer.pose(lt, CAN[0] + 140, gy(CAN[0] + 140), { flip: true });
      if (hip) hip.pose(lt, CAN[0] - 420, gy(CAN[0] - 420), { flip: true });
      lamp.position.set(CAN[0] - 150, CAN[1] - 210);
      lamp.visible = group;
      // Itō comes out of the flap (T2), stands before them (T3); (T7) bows to Canelo only, and goes
      if (ito) {
        let x = door[0];
        let rot = 0;
        let a = 1;
        if (id === 'gatera') x = door[0] - sm((lt - 1) / 4) * 200;
        if (id === 'reverencia') {
          x = door[0] - 200 + sm((lt - 5) / 2.5) * 200;
          rot = -0.5 * sm((lt - 0.5) / 1.2) * (1 - sm((lt - 3.5) / 1));
          a = 1 - sm((lt - 7) / 1);
        }
        ito.visible = id !== 'isla';
        ito.pose(lt, x, gy(x), { flip: false, rot, alpha: a });
      }
      // his small flame, sputtering in the rain (T4)
      flame.clear();
      if (group) {
        const sp = f.rm ? 1 : 0.7 + 0.3 * Math.abs(Math.sin(lt * 17));
        flame.ellipse(CAN[0] - 80, CAN[1] - 66, 6 * sp, 13 * sp).fill({ color: COL.orange, alpha: 0.95 });
      }
      // T8: she fixes his scarf with the beam
      beamHand.clear();
      if (id === 'reverencia' && lt > 9) {
        const a = Math.sin(Math.min(1, (lt - 9) / 3) * Math.PI);
        beamHand.poly([CAN[0] - 150, CAN[1] - 200, CAN[0] - 150, CAN[1] - 180, CAN[0] + 10, CAN[1] - 120, CAN[0] - 20, CAN[1] - 160]).fill({ color: COL.lanternBlue, alpha: 0.25 * a });
      }
    },
  };
}

/** T5–T6: threads creaking in the clouds; the ink ship and the two siege ships; one cannon each */
function cielo(ctx: SceneCtx): FilmSet {
  homeSet(ctx, 'storm', { x: 2600 });
  const n = new Container();
  const threads = new Graphics();
  const ships = new Container();
  const ink = inkShip(0.6);
  ink.position.set(960, 640);
  const cruceta = inkShip(0.45);
  cruceta.tint = 0x5a3a2a;
  const firma = inkShip(0.45);
  firma.tint = 0x6a5a2a;
  const shots = new Graphics();
  ships.addChild(ink, cruceta, firma, shots);
  n.addChild(threads, ships);
  ctx.plane(n, { z: 1200 });
  return {
    update(lt, f) {
      threads.clear();
      for (let i = 0; i < 7; i++) {
        const x = 200 + i * 260 + Math.sin(lt * 0.5 + i) * 20;
        threads.moveTo(x, -300).quadraticCurveTo(x + 40, 100, x + (f.rm ? 0 : Math.sin(lt * 1.3 + i) * 30), 420).stroke({ width: 2, color: 0xc8d0e0, alpha: 0.35 });
      }
      // T6: the siege — the two ships form a ring in front of the ink ship
      const ring = sm((lt - 7) / 3);
      cruceta.position.set(600 + ring * 120, 650);
      firma.position.set(1320 - ring * 120, 650);
      ink.alpha = 0.9;
      shots.clear();
      for (const [i, t0] of [9.5, 11].entries()) {
        const p = (lt - t0) / 0.6;
        if (p < 0 || p > 1) continue;
        const x0 = i ? 1250 : 700;
        shots.circle(x0 + (i ? -1 : 1) * p * 300, 600 - Math.sin(p * Math.PI) * 120, 8).fill(0xfff0c0);
      }
    },
  };
}

/** F36 O1–O2: black, only the eyes; cannon flashes light a frame and die */
function ojos(ctx: SceneCtx): FilmSet {
  const n = new Container();
  n.addChild(new Graphics().rect(-600, -400, 3120, 1880).fill(0x020203));
  const eyes = new Graphics();
  const can = new Graphics();
  n.addChild(eyes, can);
  ctx.plane(n, { z: 1000 });
  return {
    update(lt) {
      eyes.clear();
      for (let i = 0; i < 12; i++) {
        const a = Math.min(1, sm((lt - i * 0.25) / 0.4));
        const x = 200 + ((i * 271) % 1520);
        const y = 380 + ((i * 131) % 420);
        eyes.ellipse(x - 14, y, 9, 5).fill({ color: 0xf4dc72, alpha: a }).ellipse(x + 14, y, 9, 5).fill({ color: 0xf4dc72, alpha: a });
      }
      // Canelo's eyes, centre: they open wide at «MIRA»
      can.clear();
      const open = 5 + 9 * sm((lt - 4) / 0.6);
      can.ellipse(930, 560, 16, open).fill(0xffb040).ellipse(990, 560, 16, open).fill(0xffb040);
    },
    anchor: (name) => (name === 'ojo' ? [960, 560] : null),
  };
}

/** F36 O3–O5: cat vision — the dark seen clear; Cerito chooses fur; every cat's eyes; La Mano lowers her nib */
function vision(ctx: SceneCtx): FilmSet {
  const isl = homeSet(ctx, 'dark', { x: 1150 });
  const st = new Container();
  const gy = (x: number) => isl.ground(x) + 4;
  // Cerito: his static painting, and the fur one on THE SAME MESH (furOver: one rig, one breath, one blink)
  const cer = ctx.actor(STAND_INS.cerito, 150);
  const fur = furOver(ctx, cer);
  const cerG = fur ? null : ctx.actor(STAND_INS.ceritoGato, 150);
  const guests = [STAND_INS.hipolito, STAND_INS.grafitera, STAND_INS.maneki].map((s) => ctx.actor(s, 160));
  const ships = new Container();
  const s1 = inkShip(0.5);
  const s2 = inkShip(0.5);
  ships.addChild(s1, s2);
  const mano = manoFigure(ctx, 'plano', 260);
  const eyes = new Graphics();
  for (const a of [cer, cerG, ...guests]) if (a) st.addChild(a);
  st.addChild(eyes, mano.root);
  ctx.plane(ships, { z: 1600 });
  ctx.plane(st, { z: 1000 });
  const sheet = bitacoraCard(['ESPECIE: gato (por ahora)'], { hand: 'capi', w: 520, size: 32 });
  sheet.root.position.set(1300, 140);
  const ui = new Container();
  ui.addChild(sheet.root);
  ctx.plane(ui, { z: 0, screen: true });
  return {
    update(lt, f) {
      // Cerito, clear, without static, looks at Canelo… and chooses fur
      const choose = sm((lt - 4) / 1.6);
      if (cer) {
        cer.pose(lt, 900, gy(900), {});
        if (fur) fur.set(choose);
        else cer.alpha = 1 - choose;
      }
      if (cerG) {
        cerG.pose(lt, 900, gy(900), {});
        cerG.alpha = choose;
      }
      sheet.root.alpha = sm((lt - 5.5) / 0.8);
      sheet.texts[0].alpha = sm((lt - 6) / 1.4);
      // every cat's eyes light round the lighthouse
      eyes.clear();
      guests.forEach((a, i) => a?.pose(lt, [520, 1320, 1520][i], gy([520, 1320, 1520][i]), { flip: i === 0 }));
      for (let i = 0; i < 14; i++) {
        const a = sm((lt - 8 - i * 0.15) / 0.5);
        const x = 200 + ((i * 197) % 1560);
        const y = gy(x) - 60 - (i % 3) * 30;
        eyes.ellipse(x - 12, y, 8, 5).fill({ color: 0xffffff, alpha: a }).ellipse(x + 12, y, 8, 5).fill({ color: 0xffffff, alpha: a });
      }
      // the ink ships stop; La Mano lowers her nib
      const stop = sm((lt - 9) / 3);
      s1.position.set(300 + (1 - stop) * lt * 20, 640);
      s2.position.set(1700 - (1 - stop) * lt * 20, 640);
      mano.root.position.set(1700, 650);
      mano.hand.rotation = -0.6 + 0.9 * sm((lt - 11) / 2);
      void f;
    },
  };
}

/** F31 T9 (her hand, the ink running in the rain) · F36 O6 (the Capi's hand: CAMBIÓ) */
function card(ctx: SceneCtx, id: string): FilmSet {
  const n = new Container();
  n.addChild(new Graphics().rect(-600, -400, 3120, 1880).fill(0x050506));
  const lines = id === 'bitacora' ? ['LO QUE ARRIESGAMOS:', 'A Canelo. A Cerito.', 'La isla no: esa no se la damos a nadie.'] : ['CAMBIÓ:', 'Luzterna murió.', 'Cerito eligió ser gato.'];
  const c = bitacoraCard(lines, { hand: id === 'bitacora' ? 'luz' : 'capi', w: 980, size: 46 });
  c.root.position.set(470, 300);
  n.addChild(c.root);
  const drops = new Graphics();
  n.addChild(drops);
  ctx.plane(n, { z: 1000 });
  return {
    update(lt) {
      c.texts.forEach((t, i) => (t.alpha = sm((lt - 0.4 - i * 1.1) / 0.8)));
      drops.clear();
      // the rain on the paper: the ink runs down from the words
      if (id === 'bitacora')
        for (let i = 0; i < 8; i++) {
          const run = sm((lt - 2 - i * 0.4) / 2.5) * 70;
          const x = 520 + ((i * 113) % 860);
          drops.rect(x, 360 + (i % 3) * 66, 3, run).fill({ color: 0x2a2a4a, alpha: 0.55 });
        }
    },
  };
}
void Sprite;
void scarfOnGround;
