/**
 * F29 — the close shots (1920 layout, fov ≈ 1): cajas, premio, luz, cerito, vigas, tapa, pose, valle, atrapa, asalvo,
 * libre. Backgrounds are the stadium out of focus (bokeh); the light tells the story (her blue beam, the show's colours).
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { LedPanel, POP, Spots, filterHost, pixelFilter, pixelSet } from '../../../styles/pop';
import { NG, NG_BAR } from '../music';
import { Beam, Dressed, FLAME, GlassCube, SLUG, StaticKitten, Truss, bob, bokeh, caneloFlame, flightCases, glowAt, lanternAt, luzOf, outBack, rnd, seg, sm, springIn, staffCap } from '../kit';
import { beatEnv, coverPose, esquirlaOf, firmaOf } from './cast';

const tx = (ctx: SceneCtx) => (n: string) => ctx.tex(n);
/** the stadium behind a close shot (out of focus) + a stage floor */
function behind(ctx: SceneCtx, seed: number, o: { base?: number; floor?: number; colors?: number[] } = {}) {
  const b = bokeh(ctx, { seed, n: 70, base: o.base ?? 0x0c0620, colors: o.colors });
  ctx.plane(b, { z: 1600, bake: 'static' });
  if (o.floor !== undefined) {
    const f = new Graphics().rect(-300, o.floor, 2520, 600).fill(0x1e1236).rect(-300, o.floor, 2520, 8).fill(POP.pink);
    ctx.plane(f, { z: 1000 });
  }
}
/** a buffet table (fish, croquettes, cake) at (x, y) */
function buffet(x: number, y: number, s = 1): Graphics {
  const g = new Graphics();
  g.rect(x - 260 * s, y, 520 * s, 26 * s).fill(0xf6e6ee).stroke({ width: 5, color: POP.ink });
  g.rect(x - 250 * s, y + 26 * s, 500 * s, 200 * s).fill(0xff9ec8).stroke({ width: 5, color: POP.ink });
  for (let i = 0; i < 6; i++) g.poly([x - 250 * s + i * 84 * s, y + 26 * s, x - 208 * s + i * 84 * s, y + 70 * s, x - 166 * s + i * 84 * s, y + 26 * s]).fill(0xffd2e6);
  g.ellipse(x - 150 * s, y - 14 * s, 80 * s, 22 * s).fill(0xe8e8f0).stroke({ width: 4, color: POP.ink });
  g.ellipse(x - 150 * s, y - 26 * s, 60 * s, 18 * s).fill(0xff9a5a).stroke({ width: 3, color: POP.ink });
  for (let i = 0; i < 7; i++) g.circle(x + 20 * s + (i % 4) * 26 * s, y - 14 * s - Math.floor(i / 4) * 20 * s, 12 * s).fill(0xc87a3a).stroke({ width: 2, color: POP.ink });
  g.rect(x + 150 * s, y - 80 * s, 90 * s, 80 * s).fill(0xfff0f6).stroke({ width: 4, color: POP.ink });
  g.rect(x + 150 * s, y - 92 * s, 90 * s, 16 * s).fill(POP.hot);
  return g;
}

// ------------------------------------------------------------------ c5–7 · cajas: among the cases, she sees the cube
export const cajas: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', SLUG.hipo],
  build(ctx: SceneCtx): FilmSet {
    behind(ctx, 5, { base: 0x15131c, colors: [POP.pink, POP.cyan, 0xfff0d8] });
    // the cube's light from off-screen right (a hot white glow) and the buffet at the left
    const lights = new Container();
    const cg = glowAt(ctx, 2050, 420, 6, 0xf4f8ff, 0.55);
    if (cg) lights.addChild(cg);
    ctx.plane(lights, { z: 1500 });
    const buf = buffet(70, 760, 0.9);
    ctx.plane(buf, { z: 1100 });
    const cast = new Container();
    const can = new Dressed(ctx.actor(ctx.canelo, 380), () => undefined);
    const hip = new Dressed(ctx.actor(SLUG.hipo, 420), () => undefined);
    staffCap(ctx, can);
    staffCap(ctx, hip);
    const luz = luzOf(ctx, 430);
    if (hip.actor) cast.addChild(hip.actor);
    if (can.actor) cast.addChild(can.actor);
    const fl = new Graphics();
    cast.addChild(fl);
    if (luz.actor) cast.addChild(luz.actor);
    const lg = glowAt(ctx, 0, 0, 0.8, 0x9fd8ff, 0.5);
    if (lg) cast.addChild(lg);
    ctx.plane(cast, { z: 1000 });
    const cases = flightCases({ x: -60, y: 1180, scale: 1.0, n: 3 });
    const c2 = flightCases({ x: 1350, y: 1200, scale: 0.9, n: 3 });
    const cc = new Container();
    cc.addChild(cases, c2);
    ctx.plane(cc, { z: 820 });
    return {
      update(lt, f) {
        const rm = f.rm;
        hip.actor?.pose(lt, 1000, 1080, {});
        hip.follow();
        // Canelo looks at the buffet (left)
        can.actor?.pose(lt, 620, 1070, { flip: true });
        can.follow();
        if (can.actor?.puppet) can.actor.puppet.look = 0.6;
        fl.clear();
        caneloFlame(fl, can.actor, FLAME.act4, lt, rm);
        // Luzterna sees the cube: she turns to the right, her lantern tilts toward it by itself
        const see = sm(seg(lt, 0.8, 1.8));
        const ly = 520 + bob(lt, rm);
        luz.actor?.pose(lt, 1440, ly + 380, { flip: false, rot: see * 0.12 });
        const [lx, lly] = lanternAt(luz);
        if (lg) {
          lg.position.set(lx, lly);
          lg.alpha = 0.4 + 0.4 * see * (0.7 + 0.3 * Math.sin(lt * 6));
          lg.scale.set(0.7 + 0.5 * see);
        }
      },
    };
  },
};

// ------------------------------------------------------------------ c13–14 · premio: arms open toward the cube
export const premio: SetModule = {
  cats: [SLUG.firma, SLUG.cerito],
  build(ctx: SceneCtx): FilmSet {
    behind(ctx, 13, { floor: 940 });
    const spot = new Spots(tx(ctx), [
      { x: 700, y: -80, len: 1150, half: 260, color: 0xfff0d8, a: Math.PI / 2 + 0.05, amp: 0, alpha: 0.4 },
      { x: 1460, y: -80, len: 1100, half: 220, color: 0xe8f4ff, a: Math.PI / 2, amp: 0, alpha: 0.5 },
    ]);
    ctx.plane(spot, { z: 1100 });
    const st = new Container();
    const fm = firmaOf(ctx, 640);
    if (fm.actor) st.addChild(fm.actor);
    const cube = new GlassCube(ctx, 380);
    cube.position.set(1460, 920);
    st.addChild(cube);
    ctx.plane(st, { z: 1000 });
    return {
      update(lt, f) {
        const rm = f.rm;
        spot.update(lt, 1, rm);
        const open = outBack(seg(lt, 0.2, 0.9), 2);
        fm.actor?.pose(lt, 720, 960, { rot: -0.12 * open, sx: 1 + 0.06 * open, flip: false, step: ctx.k.beatStep(f.m) });
        fm.follow();
        cube.update(lt, { stare: 0.7, shine: 0.5 });
      },
    };
  },
};

// ------------------------------------------------------------------ c15–17 · luz: she notices (the flicker runs across her face)
export const luz: SetModule = {
  cats: ['luzterna'],
  build(ctx: SceneCtx): FilmSet {
    behind(ctx, 15, { base: 0x110a22 });
    const c = new Container();
    const lz = luzOf(ctx, 1050);
    if (lz.actor) c.addChild(lz.actor);
    ctx.plane(c, { z: 1000 });
    // the screen's colours running across her (additive bands) and her lantern's glow when she grips it
    const bands = new Container();
    const cols = [POP.pink, POP.cyan, 0x5cff8a, POP.yellow];
    const bs: Sprite[] = cols.map((col) => {
      const s = new Sprite(ctx.tex('pop:glow')!);
      s.anchor.set(0.5);
      s.blendMode = 'add';
      s.tint = col;
      bands.addChild(s);
      return s;
    });
    ctx.plane(bands, { z: 990 });
    const lg = glowAt(ctx, 0, 0, 1.2, 0x9fd8ff, 0.5);
    const lgc = new Container();
    if (lg) lgc.addChild(lg);
    ctx.plane(lgc, { z: 980 });
    return {
      update(lt, f) {
        const rm = f.rm;
        lz.actor?.pose(lt, 1000, 1220 + bob(lt, rm, 8), { flip: true });
        if (lt > 0.3 && lt < 0.4) lz.actor?.emote('surprise');
        // the flicker: bands slide across on 12 fps steps, fading as the HUD goes back to the show
        const st = Math.floor(lt * 12);
        const k = 1 - sm(seg(lt, 2.0, 4.6));
        bs.forEach((s, i) => {
          const x = ((st * 97 + i * 430) % 2400) - 240;
          s.position.set(x, 300 + i * 160);
          s.scale.set(4.5, 1.2);
          s.alpha = (ctx.rf ? 0.12 : 0.35) * k * (rnd(st + i) > 0.3 ? 1 : 0.3);
        });
        // she grips the lantern (c16): its glow swells
        const grip = sm(seg(lt, NG_BAR * 0.9, NG_BAR * 1.2));
        const [lx, ly] = lanternAt(lz);
        if (lg) {
          lg.position.set(lx, ly);
          lg.scale.set(1.0 + grip * 0.8);
          lg.alpha = 0.35 + grip * 0.4;
        }
      },
    };
  },
};

// ------------------------------------------------------------------ c17–19 · cerito: paws on the glass; behind, Canelo eats
export const cerito: SetModule = {
  cats: ({ canelo }) => [SLUG.cerito, canelo],
  build(ctx: SceneCtx): FilmSet {
    behind(ctx, 17, { base: 0x0c0620 });
    // behind (out of focus): the buffet and Canelo eating, oblivious
    const back = new Container();
    back.addChild(buffet(1500, 760, 0.8));
    const cs = ctx.still(ctx.canelo);
    if (cs) {
      cs.scale.set(-300 / (cs.texture.height || 700), 300 / (cs.texture.height || 700));
      cs.position.set(1420, 760);
      back.addChild(cs);
    }
    ctx.plane(back, { z: 1500, bake: 'dof', blur: 12, dof: 400 });
    const c = new Container();
    const cube = new GlassCube(ctx, 760);
    cube.position.set(820, 1080);
    c.addChild(cube);
    ctx.plane(c, { z: 1000 });
    // her light, from the left, reaching the glass a little
    const lg = glowAt(ctx, -120, 560, 4, 0x9fd8ff, 0.35);
    const lc = new Container();
    if (lg) lc.addChild(lg);
    ctx.plane(lc, { z: 900 });
    return {
      update(lt, f) {
        const rm = f.rm;
        // he goes to the glass and puts his paws on it, looking toward her light
        const go = sm(seg(lt, 0.2, 1.4));
        cube.cerito.position.set(-40 - go * 170, -10);
        cube.cerito.rotation = -0.18 * go;
        cube.cerito.scale.set(-1, 1);
        cube.update(lt, { stare: 0.6 + 0.4 * go, shine: 0.35 });
        if (lg) lg.alpha = 0.25 + 0.15 * Math.sin(lt * 2.4);
        void rm;
      },
    };
  },
};

// ------------------------------------------------------------------ c23–27 · vigas: climbing the rig; her beam, one more spot
export const vigas: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', SLUG.hipo, SLUG.cerito],
  build(ctx: SceneCtx): FilmSet {
    behind(ctx, 23, { base: 0x0a0618 });
    // the stage far below, the crowd's lights (out of focus)
    const below = new Container();
    const bg = new Graphics().rect(-300, 900, 2700, 400).fill(0x1e1236).rect(-300, 900, 2700, 8).fill(POP.pink);
    below.addChild(bg);
    for (let i = 0; i < 40; i++) {
      const s = glowAt(ctx, -200 + rnd(i) * 2500, 960 + rnd(i + 3) * 120, 0.15 + rnd(i + 5) * 0.12, 0xfff6e0, 0.6);
      if (s) below.addChild(s);
    }
    ctx.plane(below, { z: 1500, bake: 'dof', blur: 10, dof: 400 });
    // the truss we walk on (wide), the lamps' beams going down, the cube hanging at the far right
    const rig = new Container();
    const t1 = new Truss(ctx, -400, 2600, 540, { lamps: 14 });
    rig.addChild(t1);
    const spots = new Spots(tx(ctx), t1.lamps.map(([x, y], i) => ({ x, y, len: 700, half: 120, color: [POP.pink, POP.cyan, POP.yellow, POP.lilac][i % 4], a: Math.PI / 2 + ((i % 3) - 1) * 0.15, amp: 0.2, w: 0.8 + i * 0.05, ph: i, alpha: 0.35 })));
    rig.addChild(spots);
    const cube = new GlassCube(ctx, 300);
    const cable = new Graphics().rect(-2, -900, 4, 600).fill(0x8a8aa0);
    const ch = new Container();
    ch.addChild(cable, cube);
    ch.position.set(2250, 900);
    rig.addChild(ch);
    ctx.plane(rig, { z: 1000 });
    const cast = new Container();
    const can = ctx.actor(ctx.canelo, 280);
    const hip = ctx.actor(SLUG.hipo, 300);
    const lz = luzOf(ctx, 320);
    const fl = new Graphics();
    if (hip) cast.addChild(hip);
    if (can) cast.addChild(can);
    cast.addChild(fl);
    if (lz.actor) cast.addChild(lz.actor);
    const beam = new Beam(ctx);
    cast.addChild(beam);
    ctx.plane(cast, { z: 1000 });
    return {
      update(lt, f) {
        const rm = f.rm;
        const m = f.m;
        spots.update(lt, 0.9, rm);
        cube.update(lt, { stare: 0.7 });
        // beam by beam: a hop every two beats (on the beat), from left to right
        const hop = (x0: number, i0: number) => {
          const h = Math.floor(lt / 1.333) + i0;
          const p = (lt % 1.333) / 1.333;
          const jx = x0 + h * 92 + sm(Math.min(1, p * 2.5)) * 92;
          const jy = p < 0.4 ? -Math.sin((p / 0.4) * Math.PI) * 36 : 0;
          return [jx, jy] as [number, number];
        };
        const [cx, cy] = hop(260, 0);
        const [hx, hy] = hop(60, 0);
        hip?.pose(lt, hx, 545 + hy * (rm ? 0.3 : 1), {});
        can?.pose(lt, cx, 545 + cy * (rm ? 0.3 : 1), {});
        if (can?.puppet) can.puppet.walk = 1;
        if (hip?.puppet) hip.puppet.walk = 1;
        fl.clear();
        caneloFlame(fl, can, FLAME.act4, lt, rm);
        // she floats above them and points her beam DOWN like one more spotlight of the show
        const lx0 = cx + 220;
        lz.actor?.pose(lt, lx0, 380 + bob(lt, rm), { flip: false });
        const [lx, ly] = lanternAt(lz);
        beam.set([lx, ly], [lx + Math.sin(lt * 0.9) * 80, 1000], 130, 0.55 * (0.85 + 0.15 * beatEnv(m)));
      },
    };
  },
};

// ------------------------------------------------------------------ c35–38 · tapa: the lid opens to the crowd
export const tapa: SetModule = {
  cats: [SLUG.firma, SLUG.cerito],
  build(ctx: SceneCtx): FilmSet {
    behind(ctx, 35, { floor: 960, base: 0x07040e, colors: [0x6a6aa8, 0xfff0d8] });
    const spot = new Spots(tx(ctx), [{ x: 1040, y: -120, len: 1250, half: 420, color: 0xfff6e8, a: Math.PI / 2, amp: 0, alpha: 0.55 }]);
    ctx.plane(spot, { z: 1100 });
    const st = new Container();
    const fm = firmaOf(ctx, 620);
    if (fm.actor) st.addChild(fm.actor);
    const cube = new GlassCube(ctx, 360);
    cube.position.set(1300, 970);
    st.addChild(cube);
    ctx.plane(st, { z: 1000 });
    return {
      update(lt, f) {
        const rm = f.rm;
        spot.update(lt, 1, rm);
        const lid = sm(seg(lt, 1.0, 2.6));
        cube.update(lt, { lid, stare: 0.9, shine: 0.5 });
        // her big number: she lifts the lid and turns to the crowd (arms out), on the beat
        const pz = coverPose(f.m, rm);
        fm.actor?.pose(lt, 820, 980, { rot: lt < 2.6 ? -0.1 * lid : pz.rot, sx: pz.sx, sy: pz.sy, flip: lt >= 2.6 && pz.flip, step: ctx.k.beatStep(f.m) });
        fm.follow();
      },
    };
  },
};

// ------------------------------------------------------------------ c49–53 · pose: half pixelated, the pose doesn't come out
export const pose: SetModule = {
  cats: [SLUG.firma, SLUG.esquirla],
  build(ctx: SceneCtx): FilmSet {
    behind(ctx, 49, { floor: 960, base: 0x0a0618 });
    // the screen behind her: Esquirla laughs
    const scr = new LedPanel(tx(ctx), 900, 506, { dots: 0.45, bw: 16 });
    scr.position.set(980, 90);
    scr.content.addChild(new Graphics().rect(0, 0, 900, 506).fill(0x101018));
    const eq = esquirlaOf(ctx, 820);
    if (eq.actor) scr.content.addChild(eq.actor);
    const sp = new Container();
    sp.addChild(scr);
    ctx.plane(sp, { z: 1300 });
    // Firma, half pixels (a pixel filter on her own host: the lower half)
    const px = pixelFilter();
    const host = filterHost([px]);
    const fm = firmaOf(ctx, 660);
    if (fm.actor) host.addChild(fm.actor);
    const shield = new Graphics();
    host.addChild(shield);
    ctx.plane(host, { z: 1000 });
    const bits = new Graphics();
    ctx.plane(bits, { z: 1000 });
    return {
      filters: [px],
      update(lt, f) {
        const rm = f.rm;
        const m = f.m;
        pixelSet(px, 0.5, 18, 4);
        // she poses (c49.5) — the shield half-forms, then crumbles into pixels; she looks up at the screen (c51)
        const P1 = NG_BAR * 0.5;
        const tried = seg(lt, P1, P1 + 0.3);
        const look = sm(seg(lt, NG_BAR * 2, NG_BAR * 2 + 0.6));
        fm.actor?.pose(lt, 620, 980, { rot: lt > P1 && lt < P1 + 1.4 ? -0.08 * outBack(tried) : 0.03 * look, sx: 1, flip: look > 0.5 });
        fm.follow();
        if (fm.actor?.puppet) fm.actor.puppet.look = look * 0.9;
        const s = shield.clear();
        const b = bits.clear();
        const form = sm(seg(lt, P1 + 0.1, P1 + 0.5));
        const crumble = seg(lt, P1 + 0.7, P1 + 2.4);
        if (lt > P1 && crumble < 1) {
          const a = form * (1 - crumble);
          s.ellipse(620, 700, 330 * form, 360 * form).stroke({ width: 10, color: 0xffffff, alpha: a }).fill({ color: 0xbfefff, alpha: 0.12 * a });
          // the crumbs: square pixels falling from the shield's edge
          for (let i = 0; i < 40; i++) {
            const ang = (i / 40) * Math.PI * 2;
            const x = 620 + Math.cos(ang) * 330;
            const y = 700 + Math.sin(ang) * 360 + crumble * crumble * 600 * (0.5 + rnd(i));
            if (crumble > rnd(i + 3) * 0.4) b.rect(x - 9, y - 9, 18, 18).fill({ color: i % 3 ? 0xffffff : POP.cyan, alpha: 1 - crumble });
          }
        }
        // Esquirla laughs on the screen (a shake, on twos)
        const st = Math.floor(lt * 12);
        eq.actor?.pose(lt, 450 + (st % 2) * 6, 900, { rot: Math.sin(lt * 14) * 0.03 * (rm ? 0 : 1) });
        eq.follow();
        void m;
      },
    };
  },
};

// ------------------------------------------------------------------ c53–57 · valle: she lights her whole
export const valle: SetModule = {
  cats: [SLUG.firma, 'luzterna'],
  build(ctx: SceneCtx): FilmSet {
    behind(ctx, 53, { floor: 960, base: 0x05040c, colors: [0x2a3a8a, 0x3a2a6a] });
    const px = pixelFilter();
    const host = filterHost([px]);
    const fm = firmaOf(ctx, 600);
    if (fm.actor) host.addChild(fm.actor);
    ctx.plane(host, { z: 1000 });
    const c = new Container();
    const lz = luzOf(ctx, 440);
    if (lz.actor) c.addChild(lz.actor);
    const beam = new Beam(ctx);
    c.addChild(beam);
    ctx.plane(c, { z: 1000 });
    return {
      filters: [px],
      update(lt, f) {
        const rm = f.rm;
        // Firma, without a pose, turns to Luzterna; Luzterna says nothing and lights her: the pixels go away under it
        const lit = sm(seg(lt, 2.4, 6.5));
        pixelSet(px, 0.5 * (1 - lit), 18, 4);
        fm.actor?.pose(lt, 700, 980, { flip: false });
        fm.follow();
        if (fm.actor?.puppet) fm.actor.puppet.look = 0.5;
        lz.actor?.pose(lt, 1360, 560 + bob(lt, rm) + 420, { flip: true });
        const [lx, ly] = lanternAt(lz);
        beam.set([lx, ly], [720, 720], 220, 0.15 + 0.55 * lit);
      },
    };
  },
};

// ------------------------------------------------------------------ c57.6–59 · atrapa: the beam stops the rig (never her hands)
export const atrapa: SetModule = {
  cats: [SLUG.firma, 'luzterna'],
  build(ctx: SceneCtx): FilmSet {
    behind(ctx, 57, { base: 0x0a0618 });
    const c = new Container();
    // the falling rig, big and diagonal (low angle: we look up past her)
    const rig = new Truss(ctx, 700, 2300, 0, { lamps: 6 });
    rig.scale.set(1.4);
    c.addChild(rig);
    const fm = new Dressed(ctx.actor(SLUG.firma, 300), () => undefined);
    if (fm.actor) c.addChild(fm.actor);
    const lz = luzOf(ctx, 700);
    if (lz.actor) c.addChild(lz.actor);
    const beam = new Beam(ctx);
    c.addChild(beam);
    const hold = new Graphics();
    c.addChild(hold);
    ctx.plane(c, { z: 1000 });
    const CATCH = NG(58) - NG(57.6);
    return {
      update(lt, f) {
        const rm = f.rm;
        const j = ctx.k.judged('atrapa');
        const extra = j && j.r !== 'miss' ? 1 - seg(f.m, j.at, j.at + 0.8) : 0;
        // the rig comes down until the catch, then hangs in the beam (a little bounce), then slides aside
        const fall = sm(seg(lt, 0, CATCH));
        const aside = sm(seg(lt, CATCH + 1.0, CATCH + 2.6));
        const bounce = lt > CATCH ? Math.sin((lt - CATCH) * 12) * Math.exp(-(lt - CATCH) * 5) * 18 * (rm ? 0.2 : 1) : 0;
        rig.rotation = 0.5 + fall * 0.1 - aside * 0.3;
        rig.position.set(700 + aside * 500, -300 + fall * 520 + bounce - aside * 80);
        fm.actor?.pose(lt, 1300, 1060, { flip: true });
        if (fm.actor?.puppet) fm.actor.puppet.crouch = 0.7;
        lz.actor?.pose(lt, 520, 1140 + bob(lt, rm, 6), { flip: false, rot: -0.1 });
        const [lx, ly] = lanternAt(lz);
        const on = sm(seg(lt, CATCH - 0.35, CATCH - 0.05));
        beam.set([lx, ly], [1300 + aside * 300, 380 + fall * 120 - aside * 60], 200, on * (0.75 + 0.25 * extra));
        const h = hold.clear();
        if (on > 0.5) h.circle(1300 + aside * 300, 380 + fall * 120 - aside * 60, 120 + extra * 60).stroke({ width: 8, color: 0x9fd8ff, alpha: 0.4 + 0.3 * extra });
      },
    };
  },
};

// ------------------------------------------------------------------ c59–61 · asalvo: Firma on the floor, without a pose
export const asalvo: SetModule = {
  cats: [SLUG.firma],
  build(ctx: SceneCtx): FilmSet {
    behind(ctx, 59, { floor: 940, base: 0x07040e });
    const c = new Container();
    const fm = firmaOf(ctx, 520);
    if (fm.actor) c.addChild(fm.actor);
    ctx.plane(c, { z: 1000 });
    // her blue light falls on Firma from above-left (Luzterna is off-frame)
    const lg = new Container();
    const g1 = glowAt(ctx, 760, 520, 5, 0x9fd8ff, 0.4);
    if (g1) lg.addChild(g1);
    ctx.plane(lg, { z: 990 });
    return {
      update(lt, f) {
        fm.actor?.pose(lt, 960, 1020, { flip: true });
        fm.follow();
        if (fm.actor?.puppet) {
          fm.actor.puppet.crouch = 0.65;
          fm.actor.puppet.look = 0.8;
        }
        fm.onBody.alpha = 0.55;
        void f;
      },
    };
  },
};

// ------------------------------------------------------------------ c61–63 · libre: the glass cracks, Cerito runs to her light
export const libre: SetModule = {
  cats: [SLUG.cerito],
  build(ctx: SceneCtx): FilmSet {
    behind(ctx, 61, { floor: 980 });
    const c = new Container();
    const cube = new GlassCube(ctx, 620);
    cube.position.set(1240, 1000);
    c.addChild(cube);
    const run = new StaticKitten(ctx, 300);
    c.addChild(run);
    const beam = new Beam(ctx);
    c.addChild(beam);
    const wrap = glowAt(ctx, 0, 0, 1.6, 0x9fd8ff, 0.6);
    if (wrap) c.addChild(wrap);
    ctx.plane(c, { z: 1000 });
    return {
      update(lt, f) {
        const rm = f.rm;
        const crack = sm(seg(lt, 0.2, 0.9));
        const out = lt > 1.1;
        cube.update(lt, { crack, stare: 1, empty: out, lid: out ? 0.6 : 0 });
        const r = sm(seg(lt, 1.1, 3.4));
        run.visible = out;
        run.position.set(1200 - r * 760, 990 - (rm ? 0 : Math.abs(Math.sin(lt * 10)) * 20 * (1 - r)));
        run.scale.set(-1, 1);
        run.update(lt, { stare: 1, clear: 0.15 * r });
        beam.set([-200, 300], [440 + (1 - r) * 200, 900], 260, 0.35 + 0.4 * r);
        if (wrap) {
          wrap.position.set(run.x, run.y - 140);
          wrap.alpha = out ? 0.2 + 0.5 * r : 0;
          wrap.scale.set(1.2 + r * 0.8);
        }
      },
    };
  },
};
void springIn;
