/**
 * F32 · PH «La caída» (H93, closes the siege; guiones/final/h93 K1–K11). Storm realism that CONTINUES F31 on purpose:
 * same night, same handheld camera. The ink ship out of the fog; La Mano looks only at Canelo; «Al gordo no»: the cyan
 * bubble covers him and Cerito; seen from above, the black stroke goes round the bubble like a letter round the page and
 * reaches the tip of his tail, outside the light; the flame goes out; he falls on his side; his scarf slides off and
 * stays on the ground. Silence after the flame (no music anywhere here). The Bitácora: «SIN LLAMA.», trembling.
 *
 * One module, one shot per scene (ctx.scene.id): playa · cenital · cola · caida · bufanda · fin · bitacora.
 */
import { Container, Graphics } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../stage';
import { bitacoraCard, bubble, COL, homeSet, inkShip, inkStroke, lantern, manoFigure, partial, scarfOnGround, STAND_INS } from './props';

const sm = (x: number) => {
  const k = Math.max(0, Math.min(1, x));
  return k * k * (3 - 2 * k);
};

const mod: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', STAND_INS.cerito, STAND_INS.mano, { slug: canelo, bake: 'gris' }, { slug: STAND_INS.mano, bake: 'realismo' }],
  build(ctx: SceneCtx): FilmSet {
    const id = ctx.scene.id;
    if (id === 'cenital') return cenital(ctx);
    if (id === 'cola') return cola(ctx);
    if (id === 'bitacora') return bitacora(ctx);
    if (id === 'bufanda') return bufanda(ctx);
    return playa(ctx, id);
  },
};
export default mod;

/** the beach under the storm: K1–K4 (playa), K7 (caida), K9 (fin) */
function playa(ctx: SceneCtx, id: string): FilmSet {
  const isl = homeSet(ctx, 'storm', { x: 1300, palmBend: 60 });
  const sea = new Container();
  const ship = inkShip(0.9);
  ship.position.set(260, 640);
  const sunk = new Graphics();
  sea.addChild(sunk, ship);
  ctx.plane(sea, { z: 1600 });
  const st = new Container();
  const gy = (x: number) => isl.ground(x) + 4;
  const CAN: [number, number] = [980, gy(980)];
  const CER: [number, number] = [1120, gy(1120)];
  const LUZ: [number, number] = [1300, gy(1300) - 80];
  const MANO: [number, number] = [520, gy(520)];
  const cerito = ctx.actor(STAND_INS.cerito, 130);
  const canelo = ctx.actor(ctx.canelo, 210);
  const caneloG = ctx.actorAs('gris', ctx.canelo, 210);
  const luz = ctx.actor('luzterna', 270);
  const mano = manoFigure(ctx, 'realismo', 300);
  const lamp = lantern(false, 1.1);
  const bub = bubble(190);
  const stroke = new Graphics();
  const scarf = scarfOnGround(160);
  scarf.visible = false;
  for (const x of [cerito, canelo, caneloG, luz]) if (x) st.addChild(x);
  st.addChild(mano.root, lamp, bub, stroke, scarf);
  ctx.plane(st, { z: 1000 });
  return {
    update(lt, f) {
      const rm = f.rm;
      // K1: the two enemy ships sink, the ink ship slides out of the fog
      sunk.clear();
      if (id === 'playa') {
        const s = sm(lt / 4);
        sunk.poly([1500, 600 + s * 80, 1760, 590 + s * 60, 1730, 640 + s * 120, 1520, 650 + s * 120]).fill({ color: 0x1a1410, alpha: 1 - s * 0.7 });
        sunk.poly([1800, 610 + s * 100, 2020, 600 + s * 90, 2000, 650 + s * 140, 1810, 660 + s * 140]).fill({ color: 0x241a10, alpha: 1 - s * 0.7 });
      }
      ship.position.set(id === 'playa' ? 120 + sm(lt / 6) * 180 : 300, 640);
      ship.alpha = id === 'playa' ? sm(lt / 3) : 1;
      // La Mano comes down to the beach (K2) and goes back to her ship without a word (K9)
      const mx = id === 'playa' ? MANO[0] - 260 + sm((lt - 4) / 3) * 260 : id === 'fin' ? MANO[0] - sm(lt / 3) * 300 : MANO[0];
      mano.root.position.set(mx, MANO[1]);
      mano.root.scale.set(id === 'fin' ? -1 : 1, 1);
      mano.root.alpha = id === 'playa' ? sm((lt - 4) / 1.5) : 1;
      // the nib starts its line toward Canelo (K3)
      stroke.clear();
      if (id === 'playa' && lt > 8) {
        const p = sm((lt - 8) / 3);
        const nib: [number, number] = [mx + 70, MANO[1] - 270];
        inkStroke(stroke, partial([nib, [nib[0] + 160, nib[1] + 40], [CAN[0] - 260, CAN[1] - 140]], p * 0.7), 14, COL.ink, 0.95, 3);
      }
      // Luzterna raises the lantern (K4) — the bubble of «te ODIO» covers Canelo and Cerito
      const raise = id === 'playa' ? sm((lt - 11) / 0.8) : 1;
      if (luz) luz.pose(lt, LUZ[0], LUZ[1] + (id === 'fin' ? 50 : 0), { flip: false });
      if (luz?.puppet) luz.puppet.crouch = id === 'fin' ? 1 : 0;
      lamp.position.set(LUZ[0] - 90, LUZ[1] - 140 - raise * 50);
      lamp.visible = id !== 'fin';
      bub.position.set((CAN[0] + CER[0]) / 2, CAN[1] - 90);
      bub.visible = id === 'playa' && lt > 11;
      bub.scale.set(0.6 + 0.4 * raise);
      bub.alpha = raise;
      if (cerito) cerito.pose(lt, CER[0], CER[1], { flip: true });
      // K7: he falls on his side, slowly; the scarf slides off and stays on the ground
      const fall = id === 'caida' ? sm(lt / 3.4) : id === 'fin' ? 1 : 0;
      if (canelo) {
        canelo.visible = fall < 0.5;
        canelo.pose(lt, CAN[0], CAN[1], { flip: true, rot: fall * 1.2 });
      }
      if (caneloG) {
        caneloG.visible = fall >= 0.5;
        caneloG.pose(lt, CAN[0] + 20, CAN[1] + 10, { flip: true, rot: 1.45 });
        if (caneloG.puppet) caneloG.puppet.sleeping = true;
      }
      scarf.visible = fall > 0.35;
      const sl = sm((fall - 0.35) / 0.65);
      scarf.position.set(CAN[0] - 30 - sl * 60, CAN[1] - 70 + sl * 66);
      scarf.rotation = (1 - sl) * 0.9;
      void rm;
    },
    light: (x, y) => (Math.hypot(x - 1210, y - 300) < 160 ? 0.4 : 0),
  };
}

/** K5 — from above: the stroke circles the bubble like a letter round the page and finds the tail outside the light */
function cenital(ctx: SceneCtx): FilmSet {
  const n = new Container();
  n.addChild(new Graphics().rect(-600, -400, 3120, 1880).fill(0x2a2a24));
  for (let i = 0; i < 40; i++) n.addChild(new Graphics().circle((i * 211) % 1920, (i * 137) % 1080, 30 + (i % 4) * 18).fill({ color: 0x3a3a30, alpha: 0.6 }));
  const b = bubble(330);
  b.position.set(960, 540);
  const tail = new Graphics();
  tail.moveTo(1240, 610).quadraticCurveTo(1340, 560, 1400, 640).stroke({ width: 26, color: COL.canelo, cap: 'round' });
  const flame = new Graphics().ellipse(1406, 646, 12, 20).fill(COL.orange);
  const line = new Graphics();
  n.addChild(b, tail, flame, line);
  ctx.plane(n, { z: 1000 });
  const pts: [number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const a = Math.PI * 1.1 - (i / 40) * Math.PI * 1.75;
    const r = 380 + i * 1.2;
    pts.push([960 + Math.cos(a) * r, 540 + Math.sin(a) * r]);
  }
  pts.push([1395, 650]);
  return {
    update(lt) {
      line.clear();
      inkStroke(line, partial(pts, sm(lt / 2.6)), 18, COL.ink, 1, 7);
    },
  };
}

/** K6 — the tail: the flame goes out, a thread of smoke. The music has stopped */
function cola(ctx: SceneCtx): FilmSet {
  const n = new Container();
  n.addChild(new Graphics().rect(-600, -400, 3120, 1880).fill(0x14161c));
  const tail = new Graphics();
  tail.moveTo(500, 760).bezierCurveTo(800, 700, 1050, 560, 1180, 600).stroke({ width: 120, color: 0x9a5a34, cap: 'round' });
  tail.moveTo(500, 760).bezierCurveTo(800, 700, 1050, 560, 1180, 600).stroke({ width: 70, color: 0xc8743e, cap: 'round', alpha: 0.6 });
  const flame = new Graphics();
  const smoke = new Graphics();
  n.addChild(tail, flame, smoke);
  ctx.plane(n, { z: 1000 });
  return {
    update(lt, f) {
      flame.clear();
      smoke.clear();
      const out = sm((lt - 0.5) / 0.5);
      if (out < 1) {
        const h = 120 * (1 - out) * (0.9 + 0.1 * Math.sin(lt * 30));
        flame.ellipse(1230, 560 - h * 0.4, 40 * (1 - out * 0.6), h * 0.6).fill({ color: COL.orange, alpha: 1 - out });
        flame.ellipse(1230, 570 - h * 0.3, 18, h * 0.3).fill({ color: 0xfff0b0, alpha: 1 - out });
      }
      if (out > 0.3) {
        const up = (lt - 0.8) * 90;
        smoke.moveTo(1230, 560);
        for (let i = 1; i < 12; i++) smoke.lineTo(1230 + Math.sin(i * 0.9 + lt * (f.rm ? 0.5 : 2)) * 14 * i * 0.4, 560 - i * Math.max(10, up / 12));
        smoke.stroke({ width: 5, color: 0x9a9aa4, alpha: 0.5 });
      }
    },
  };
}

/** K8 — low and still: the scarf on the ground, framed like H72 (C3). Only the rain moves */
function bufanda(ctx: SceneCtx): FilmSet {
  const n = new Container();
  n.addChild(new Graphics().rect(-600, -400, 3120, 1880).fill(0x0c0f14));
  n.addChild(new Graphics().rect(-600, 640, 3120, 900).fill(0x2a2a24));
  for (let i = 0; i < 9; i++) n.addChild(new Graphics().ellipse(200 + i * 210, 760 + (i % 3) * 60, 70, 12).fill({ color: 0x3a4a5a, alpha: 0.5 }));
  const s = scarfOnGround(150);
  s.scale.set(3.6);
  s.position.set(980, 760);
  n.addChild(s);
  ctx.plane(n, { z: 1000, bake: 'static' });
  return { update: () => undefined };
}

/** K11 — the Bitácora: CAMBIÓ is written in her hand, trembling */
function bitacora(ctx: SceneCtx): FilmSet {
  const n = new Container();
  n.addChild(new Graphics().rect(-600, -400, 3120, 1880).fill(0x050506));
  const card = bitacoraCard(['CAMBIÓ:', 'SIN LLAMA.'], { hand: 'luz', w: 620, size: 54 });
  card.root.position.set(650, 380);
  n.addChild(card.root);
  ctx.plane(n, { z: 1000 });
  return {
    update(lt, f) {
      card.texts[0].alpha = sm(lt / 0.6);
      card.texts[1].alpha = sm((lt - 0.8) / 0.8);
      const tr = f.rm ? 0.3 : 1.6;
      card.texts[1].position.x = 26 + Math.sin(lt * 37) * tr;
      card.texts[1].rotation = Math.sin(lt * 23) * 0.012 * tr;
    },
  };
}
