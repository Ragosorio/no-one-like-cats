/**
 * DEMO · I «La noche estrellada» (Van Gogh). Everything here is brush strokes laid along flow fields and baked once:
 *
 *   sky (z 1800)      a smooth underpainting + a coat + detail strokes along wind and three vortices; 3 variants that
 *                     BOIL on 8 fps (one with «Reducir movimiento»); the vortices and eleven star halos are sprites
 *                     that TURN; the moon: a crescent in a ringed halo — the camera flies into it (the match cut)
 *   far land (1500)   blue hills on the left with a sleeping village (yellow window dabs) above the horizon
 *   sea (1200)        the whole width: horizontal strokes, the moon's broken reflection shimmering
 *   island (1000)     the island rising from the sea (strokes along its contour), the lighthouse (vertical strokes,
 *                     red bands), its lamp and sweeping beam, and Canelo — his painting baked in impasto, alive
 *   cypress (650)     the flame-shaped cypress in front, on the left, rising into the sky
 *   + wind (1500)     little yellow strokes drifting: the sky paints itself
 *
 * The opening frame looks UP (the island is below the frame): the crane down discovers the island, the lighthouse, him.
 */
import { Container, Sprite, type Texture } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../stage';
import { contour, gradient, halo, paintField, ramp, swirl, VG, wind } from '../styles/vangogh';

const SKY_X = -300;
const SKY_Y = -380;
const MOON: [number, number] = [1293, 201];
const VORTICES = [
  { x: 960, y: 250, r: 250, s: 1 },
  { x: 520, y: 150, r: 175, s: -0.85 },
  { x: 1660, y: 40, r: 160, s: 0.75 },
];
const STARS: [number, number, number][] = [
  [180, 90, 46],
  [380, 340, 36],
  [700, 30, 52],
  [790, 440, 32],
  [1150, 430, 40],
  [1530, 300, 50],
  [1780, 190, 38],
  [1960, 400, 34],
  [40, 320, 36],
  [1040, -150, 42],
  [1830, -120, 44],
];
const HORIZON = 606;
const islandY = (x: number) => 1010 - 300 * Math.exp(-(((x - 760) / 620) ** 2)) - 18 * Math.sin(x / 90);
const farY = (x: number) => 560 - 34 * Math.sin(x / 210 + 1) - 22 * Math.sin(x / 83);
const LIGHTHOUSE_X = 900;
const CAT_X = 600;

const mod: SetModule = {
  cats: ({ canelo }) => [canelo],
  build(ctx: SceneCtx): FilmSet {
    const b = ctx.baker;
    const hi = ctx.quality === 'high';
    // ---- the sky
    const skyFlow = swirl(wind(0.26, 0.0035, 1.3), VORTICES.map((v) => ({ x: v.x - SKY_X, y: v.y - SKY_Y, r: v.r, s: v.s })));
    const skyGrad = gradient([0x0c1840, VG.prussian, VG.ultramarine, 0x22388e, VG.cobalt, 0x3f6cc8]);
    const skyColor = (x: number, y: number, r: number) => {
      const wy = y + SKY_Y;
      const wx = x + SKY_X;
      let near = 0;
      for (const v of VORTICES) near = Math.max(near, Math.exp(-(((Math.hypot(wx - v.x, wy - v.y) - v.r * 0.55) / (v.r * 0.38)) ** 2)));
      for (const [sx, sy, sr] of STARS) near = Math.max(near, 0.65 * Math.exp(-((Math.hypot(wx - sx, wy - sy) / (sr * 2.4)) ** 2)));
      const t = Math.min(1, Math.max(0, (wy + 380) / 1000) * 0.7 + near * 0.6);
      return ramp([VG.prussian, VG.ultramarine, 0x22388e, VG.cobalt, 0x3f6cc8, VG.cerulean, VG.pale], t, r, 0.24);
    };
    const nVar = ctx.rm ? 1 : 3;
    const skyTex: Texture[] = [];
    for (let i = 0; i < nVar; i++)
      skyTex.push(
        paintField(b, {
          w: 2600,
          h: 1280,
          flow: skyFlow,
          color: skyColor,
          under: (y) => skyGrad(y / 1280),
          coat: { density: 5, width: [18, 26], len: [40, 70] },
          density: hi ? 22 : 14,
          len: [22, 46],
          width: [9, 15],
          segs: 3,
          seed: 11 + i * 101,
        }),
      );
    const sky = new Sprite(skyTex[0]);
    sky.position.set(SKY_X, SKY_Y);
    const skyNode = new Container();
    skyNode.addChild(sky);
    ctx.plane(skyNode, { z: 1800 });

    // ---- vortices, stars, the moon: sprites that turn
    const lights = new Container();
    const turning: { sp: Sprite; w: number; ph: number; pulse: number }[] = [];
    for (const v of VORTICES) {
      const t = halo(b, { r: v.r, rings: [0xdfe9f2, 0xb4ccec, VG.pale, VG.cerulean, 0x3f6cc8, VG.cobalt], seed: Math.round(v.x), width: 10 });
      const sp = new Sprite(t);
      sp.anchor.set(0.5);
      sp.position.set(v.x, v.y);
      sp.alpha = 0.8;
      lights.addChild(sp);
      turning.push({ sp, w: 0.05 * v.s, ph: v.x, pulse: 0 });
    }
    for (const [x, y, r] of STARS) {
      const t = halo(b, { r, rings: [0xfffbe6, VG.lemon, VG.chrome, VG.lemon, 0x9fb8e0, VG.cerulean], core: 0xfffbe6, seed: Math.round(x + y), width: 6, res: 1.4 });
      const sp = new Sprite(t);
      sp.anchor.set(0.5);
      sp.position.set(x, y);
      lights.addChild(sp);
      turning.push({ sp, w: 0.12 + ((x * 7) % 10) / 60, ph: x * 0.01, pulse: 0.06 });
    }
    const moonHalo = new Sprite(halo(b, { r: 130, rings: [VG.lemon, VG.chrome, VG.lemon, 0xe8d890, 0x9fb8e0, VG.cerulean], seed: 77, width: 8, res: 2.4 }));
    moonHalo.anchor.set(0.5);
    moonHalo.position.set(...MOON);
    lights.addChild(moonHalo);
    turning.push({ sp: moonHalo, w: -0.06, ph: 0, pulse: 0.025 });
    const cres = new Sprite(
      paintField(b, {
        w: 150,
        h: 150,
        density: 70,
        len: [16, 30],
        width: [6, 10],
        segs: 3,
        res: 2.4,
        flow: (x, y) => Math.atan2(y - 75, x - 75) + Math.PI / 2,
        inside: (x, y) => Math.hypot(x - 75, y - 75) < 58 && Math.hypot(x - 100, y - 58) > 50,
        color: (x, y, r) => (r < 0.3 ? VG.orange : r < 0.8 ? VG.chrome : VG.lemon),
        seed: 5,
      }),
    );
    cres.anchor.set(0.5);
    cres.position.set(...MOON);
    lights.addChild(cres);
    const lightsPlane = ctx.plane(lights, { z: 1799 });

    // ---- far land: blue hills on the left with the village, above the horizon
    const farTex = paintField(b, {
      w: 1500,
      h: 200,
      flow: contour((x) => farY(x - 300)),
      inside: (x, y) => y + 440 > farY(x - 300) && x < 1380 - (y * 0.6),
      color: (x, y, r) => ramp([0x2c4a6e, 0x243a6a, 0x1f3060, 0x1a2350], (y + 440 - farY(x - 300)) / 120, r, 0.3),
      coat: { density: 6, width: [16, 22], len: [30, 50] },
      density: 14,
      len: [22, 40],
      width: [8, 13],
      seed: 23,
    });
    const far = new Container();
    far.addChild(Object.assign(new Sprite(farTex), { x: -300, y: 440 }));
    const village = paintField(b, {
      w: 620,
      h: 110,
      flow: () => -Math.PI / 2,
      inside: (x, y) => {
        const i = Math.floor(x / 50);
        const top = 40 + ((i * 37) % 40);
        return y > top && x % 50 < 40;
      },
      color: (x, y, r) => (r < 0.16 && (Math.floor(y / 16) + Math.floor(x / 13)) % 3 === 0 ? VG.lemon : r < 0.6 ? 0x1c2a58 : 0x2a3c70),
      density: 80,
      len: [10, 18],
      width: [5, 8],
      seed: 31,
    });
    far.addChild(Object.assign(new Sprite(village), { x: 120, y: HORIZON - 104 }));
    ctx.plane(far, { z: 1500, bake: 'static' });

    // ---- the sea, the whole width, with the moon's reflection
    const seaTex = paintField(b, {
      w: 2800,
      h: 600,
      flow: wind(0.07, 0.01, 2),
      color: (x, y, r) => (r < 0.06 ? VG.pale : ramp([0x2d68b8, 0x2558a8, 0x1f4a98, 0x1b3f88, 0x163a7a], y / 600, r, 0.25)),
      under: (y) => gradient([0x2558a8, 0x1b3f88, 0x12306e])(y / 600),
      coat: { density: 5, width: [16, 22], len: [44, 70] },
      density: 13,
      len: [30, 56],
      width: [8, 12],
      seed: 41,
    });
    const refl = new Sprite(
      paintField(b, {
        w: 240,
        h: 480,
        flow: () => 0,
        inside: (x, y) => Math.abs(x - 120) < 26 + y * 0.17 && (Math.floor(y / 24) % 2 === 0 || x % 3 < 2),
        color: (x, y, r) => (r < 0.5 ? VG.chrome : VG.lemon),
        density: 44,
        len: [18, 34],
        width: [6, 9],
        seed: 43,
      }),
    );
    refl.anchor.set(0.5, 0);
    refl.position.set(1250, HORIZON + 8);
    refl.blendMode = 'add';
    const seaNode = new Container();
    seaNode.addChild(Object.assign(new Sprite(seaTex), { x: -400, y: HORIZON }), refl);
    ctx.plane(seaNode, { z: 1200 });

    // ---- the island: rising from the sea, the lighthouse, the beam, Canelo
    const hill = new Sprite(
      paintField(b, {
        w: 2200,
        h: 560,
        flow: contour((x) => islandY(x - 400)),
        inside: (x, y) => y + 660 > islandY(x - 400),
        color: (x, y, r) => (r < 0.07 ? VG.ochre : ramp([0x7a8a3a, 0x5c7438, 0x3c6238, 0x2a4a34, 0x1a3030], (y + 660 - islandY(x - 400)) / 240, r, 0.3)),
        coat: { density: 6, width: [16, 24], len: [36, 60] },
        density: 16,
        len: [24, 44],
        width: [9, 14],
        seed: 53,
      }),
    );
    hill.position.set(-400, 660);
    const baseY = islandY(LIGHTHOUSE_X) + 8;
    const tower = new Sprite(
      paintField(b, {
        w: 150,
        h: 380,
        flow: () => -Math.PI / 2 + 0.05,
        inside: (x, y) => {
          const hw = 30 + (y / 380) * 28;
          return Math.abs(x - 75) < hw && y > 56;
        },
        color: (x, y, r) => ((y > 160 && y < 200) || (y > 275 && y < 315) ? (r < 0.6 ? 0xc0442e : 0x9a3424) : x < 64 ? 0xd8ccb0 : r < 0.7 ? 0xeee6c8 : 0xf6f0dc),
        coat: { density: 30, width: [12, 16], len: [20, 30] },
        density: 70,
        len: [14, 26],
        width: [6, 9],
        seed: 61,
      }),
    );
    tower.anchor.set(0.5, 1);
    tower.position.set(LIGHTHOUSE_X, baseY);
    const lampY = baseY - 340;
    const lampG = new Sprite(halo(b, { r: 50, rings: [0xfffbe6, VG.lemon, VG.chrome, VG.orange], core: 0xfffbe6, seed: 63, width: 5, res: 1.5 }));
    lampG.anchor.set(0.5);
    lampG.position.set(LIGHTHOUSE_X, lampY);
    lampG.blendMode = 'add';
    const beam = new Sprite(
      paintField(b, {
        w: 820,
        h: 240,
        flow: (x, y) => Math.atan2(y - 120, x) * 0.6,
        inside: (x, y) => Math.abs(y - 120) < 8 + x * 0.13,
        color: (x, y, r) => (r < 0.5 ? VG.lemon : r < 0.85 ? VG.chrome : 0xfff3b0),
        density: 18,
        len: [30, 60],
        width: [6, 11],
        seed: 67,
      }),
    );
    beam.anchor.set(0, 0.5);
    beam.position.set(LIGHTHOUSE_X, lampY);
    beam.blendMode = 'add';
    const island = new Container();
    island.addChild(hill, tower, beam, lampG);
    const canelo = ctx.actor(ctx.canelo, 300);
    if (canelo) island.addChild(canelo);
    ctx.plane(island, { z: 1000 });

    // ---- the cypress in front, on the left
    const cyp = new Sprite(
      paintField(b, {
        w: 340,
        h: 1250,
        flow: (x, y) => -Math.PI / 2 + Math.sin(y / 90 + x / 60) * 0.35,
        inside: (x, y) => {
          const t = y / 1250;
          const hw = 155 * Math.sin(Math.min(1, t * 1.12) * Math.PI * 0.5) ** 0.8 * (0.85 + 0.15 * Math.sin(y / 40));
          return Math.abs(x - 170) < hw;
        },
        color: (x, y, r) => ramp([0x2a4a3a, 0x1c3a2c, 0x14301e, 0x0d1830, 0x0b1a14], (Math.abs(x - 170) / 155) * 0.6 + r * 0.4, r, 0.2),
        coat: { density: 8, width: [16, 24], len: [40, 70] },
        density: 24,
        len: [30, 60],
        width: [9, 15],
        segs: 3,
        seed: 71,
      }),
    );
    cyp.position.set(150, 40);
    const cypNode = new Container();
    cypNode.addChild(cyp);
    ctx.plane(cypNode, { z: 650, bake: 'static' });

    const catY = islandY(CAT_X) + 10;
    return {
      anchor(name, f) {
        // the match cut lands where the moon is on screen (centred at the end of the flight; elsewhere when calm)
        return name === 'moon' ? f.toScreen(lightsPlane, MOON) : null;
      },
      update(lt, f) {
        const rm = f.rm;
        sky.texture = skyTex[f.boil % skyTex.length];
        for (const t of turning) {
          t.sp.rotation = t.ph + lt * t.w * (rm ? 0.25 : 1);
          if (t.pulse) t.sp.scale.set(1 + Math.sin(lt * 1.7 + t.ph * 3) * t.pulse * (rm ? 0.3 : 1));
        }
        // the beam sweeps (turning toward us and away: it shortens), the lamp breathes
        const ph = lt * 0.55;
        beam.rotation = -0.3 + Math.sin(ph) * 0.4;
        beam.scale.set(0.35 + 0.65 * Math.abs(Math.cos(ph * 0.5)), 1);
        beam.alpha = 0.2 + 0.16 * Math.abs(Math.cos(ph * 0.5));
        lampG.scale.set(1 + Math.sin(lt * 3.1) * 0.06);
        refl.alpha = 0.75 + 0.25 * Math.sin(lt * 2.3);
        refl.scale.set(1 + Math.sin(lt * 1.3) * 0.04, 1);
        if (canelo) {
          canelo.pose(lt, CAT_X, catY, { flip: true });
          // he looks at the sea, then up to the moon when the camera finds him
          if (canelo.puppet) canelo.puppet.look = lt < 9 ? 0.15 : 0.7;
        }
      },
    };
  },
};
export default mod;
