/**
 * F29 — the tear and what is behind it: rasgadura (c63–66), the ping-pong island / stadium (c66–77), the end (c77→).
 * YOUR ISLAND AT NIGHT is CINE's island (films/final/props: sky, sea, island) seen through a jagged tear of static:
 * the lighthouse, the palm, THE WARM HOLLOW WHERE CANELO SLEEPS and CERITO'S BLANKET next to it (C12). An eye of ink
 * opens in its sky and looks (La Mano). Nothing about Luzterna but her light and her face when she sees the eye.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { POP } from '../../../styles/pop';
import { NG, NG_BAR } from '../music';
import { Beam, Dressed, FLAME, SLUG, StaticKitten, bob, bokeh, caneloFlame, glitchArm, glowAt, lanternAt, luzOf, rnd, seg, sm, stadium } from '../kit';
import { esquirlaOf, firmaOf } from './cast';
import { CUBE } from './a';
import { motto } from './screens';
import { beamFan, island, sea, sky } from '../../final/props';

/** the island at night (1920 layout): sky, sea, the island with its lighthouse beam, the hollow and the blanket */
export function islandView(ctx: SceneCtx): { root: Container; beam: Graphics; hollow: [number, number]; blanket: [number, number]; lamp: [number, number]; sky: Container } {
  const root = new Container();
  const b = ctx.baker;
  const skyC = new Container();
  skyC.addChild(Object.assign(new Sprite(sky(b, 'night', 2600, 900, 9)), { x: -340, y: -200 }));
  // a few stars
  const stars = new Graphics();
  for (let i = 0; i < 60; i++) stars.circle(-300 + rnd(i) * 2500, -150 + rnd(i + 9) * 650, 1.5 + rnd(i + 3) * 2).fill({ color: 0xfff6e0, alpha: 0.5 + rnd(i + 5) * 0.5 });
  skyC.addChild(stars);
  root.addChild(skyC);
  root.addChild(Object.assign(new Sprite(sea(b, 'night', 3000, 700, 9)), { x: -540, y: 600 }));
  const isl = island('night', { x: 1150 });
  root.addChild(isl.node);
  const beam = beamFan(0xffe8b0, 1500, 0.08);
  beam.position.set(isl.lamp[0], isl.lamp[1]);
  root.addChild(beam);
  const lampG = glowAt(ctx, isl.lamp[0], isl.lamp[1], 0.9, 0xffe8b0, 0.7);
  if (lampG) root.addChild(lampG);
  // the warm hollow where Canelo sleeps (under the palm: a pressed, warm patch in the grass) and Cerito's blanket
  const px = isl.palm[0] - 60;
  const gy = isl.ground(px) + 30;
  const hollow: [number, number] = [px + 70, gy];
  const blanket: [number, number] = [px + 230, gy + 6];
  const g = new Graphics();
  g.ellipse(hollow[0], hollow[1], 95, 26).fill(0x3a3020).ellipse(hollow[0], hollow[1] - 2, 80, 18).fill(0x5a4628);
  // the blanket: a small quilt folded once, a pattern of little suns
  g.roundRect(blanket[0] - 70, blanket[1] - 24, 140, 40, 10).fill(0x6a7ab8).stroke({ width: 4, color: 0x1a1a30 });
  for (let i = 0; i < 4; i++) g.circle(blanket[0] - 48 + i * 32, blanket[1] - 4, 6).fill(0xe8c86a);
  g.moveTo(blanket[0] - 70, blanket[1] - 6).lineTo(blanket[0] + 70, blanket[1] - 6).stroke({ width: 2, color: 0x3a4a80 });
  root.addChild(g);
  const warm = glowAt(ctx, hollow[0], hollow[1] - 10, 1.0, 0xffb060, 0.35);
  if (warm) root.addChild(warm);
  return { root, beam, hollow, blanket, lamp: isl.lamp, sky: skyC };
}

/** a jagged tear outline (n points around (cx, cy), radius r, a seeded wobble) */
function tearPts(cx: number, cy: number, rx: number, ry: number, seed: number, n = 28): number[] {
  const pts: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const j = 0.72 + rnd(i * 7 + seed) * 0.5 + (i % 2 ? 0.12 : -0.08);
    pts.push(cx + Math.cos(a) * rx * j, cy + Math.sin(a) * ry * j);
  }
  return pts;
}
/** the tear's static border: pixel blocks along its outline (shuffled on 12 fps steps) */
function tearBorder(g: Graphics, pts: number[], step: number, s = 16) {
  for (let i = 0; i < pts.length; i += 2) {
    const x0 = pts[i];
    const y0 = pts[i + 1];
    const x1 = pts[(i + 2) % pts.length];
    const y1 = pts[(i + 3) % pts.length];
    for (let k = 0; k < 4; k++) {
      const t = k / 4;
      const x = x0 + (x1 - x0) * t + (rnd(i * 13 + k + step * 7) - 0.5) * s * 1.6;
      const y = y0 + (y1 - y0) * t + (rnd(i * 17 + k + step * 5) - 0.5) * s * 1.6;
      const col = (i + k + step) % 3 === 0 ? 0x5cff8a : (i + k + step) % 3 === 1 ? POP.hot : 0xffffff;
      g.rect(x - s / 2, y - s / 2, s, s).fill(col);
    }
  }
}

// ------------------------------------------------------------------ c63–66 · rasgadura: the tear opens; the island
export const rasgadura: SetModule = {
  cats: [SLUG.firma, SLUG.esquirla],
  build(ctx: SceneCtx): FilmSet {
    const st = stadium(ctx, { seed: 63 });
    st.wall.main.content.addChild(new Graphics().rect(0, 0, 1600, 900).fill(0x101018));
    for (const p of [st.wall.left, st.wall.right]) p.content.addChild(new Graphics().rect(0, 0, 600, 880).fill(0x101018));
    st.wall.strip.content.addChild(motto(2200, 128));
    const fm = firmaOf(ctx, 190);
    if (fm.actor) st.stage.addChild(fm.actor);
    const eq = esquirlaOf(ctx, 210);
    if (eq.actor) st.stage.addChild(eq.actor);
    const swipe = new Graphics();
    st.stage.addChild(swipe);
    // the tear (screen-scale world coords: centre (1180, 460) of the camera's world)
    const TC: [number, number] = [1180, 460];
    const view = islandView(ctx);
    const vc = new Container();
    vc.addChild(view.root);
    // scale the island so its hollow sits in the tear's centre
    const S = 0.62;
    vc.scale.set(S);
    vc.position.set(TC[0] - view.hollow[0] * S + 120, TC[1] - view.hollow[1] * S + 160);
    const mask = new Graphics();
    vc.mask = mask;
    const border = new Graphics();
    const tc = new Container();
    tc.addChild(vc, mask, border);
    ctx.plane(tc, { z: 1000 });
    const O0 = 0.3;
    const O1 = NG(65) - NG(63);
    return {
      update(lt, f) {
        const rm = f.rm;
        st.update(lt, { rm, phones: 0.4, beams: 0.5, lamps: 0.6 });
        fm.actor?.pose(lt, 760, 750, {});
        fm.follow();
        // Esquirla swipes the air (a glitch claw) at the back of the stage, then the tear grows
        eq.actor?.pose(lt, 1360, 750, { flip: true, rot: lt < O0 + 0.4 ? -0.15 : 0 });
        eq.follow();
        const sw = swipe.clear();
        if (lt < O0 + 0.6) glitchArm(sw, 1300, 600, 1650, 300, seg(lt, 0, O0 + 0.4), Math.floor(lt * 12), 14);
        const grow = sm(seg(lt, O0, O1));
        const rx = 40 + grow * 760;
        const ry = 30 + grow * 520;
        const pts = tearPts(TC[0], TC[1], rx, ry, 63);
        mask.clear().poly(pts).fill(0xffffff);
        const step = Math.floor(lt * 12);
        tearBorder(border.clear(), pts, rm ? 0 : step, 18);
        view.beam.rotation = -0.6 + Math.sin(lt * 0.5) * 0.5;
      },
    };
  },
};

// ------------------------------------------------------------------ c66–77 · pingpong: the island / the stadium, bar by bar
const ISLAND_BARS = new Set([66, 68, 70, 72, 75]);
export const pingpong: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', SLUG.firma, SLUG.esquirla, SLUG.cerito],
  build(ctx: SceneCtx): FilmSet {
    const k = ctx.k;
    // ---- THE ISLAND (seen through the tear: a static border all around the frame)
    const isC = new Container();
    const view = islandView(ctx);
    isC.addChild(view.root);
    // the ink: swirls in the sky, then THE EYE
    const ink = new Graphics();
    isC.addChild(ink);
    const eye = new Container();
    const eyeW = new Graphics();
    const lid = new Graphics();
    const pupil = new Graphics();
    eye.addChild(eyeW, pupil, lid);
    eye.position.set(1000, 170);
    isC.addChild(eye);
    const frame = new Graphics();
    isC.addChild(frame);
    // ---- THE STADIUM (close shots, out-of-focus lights behind)
    const stC = new Container();
    stC.addChild(bokeh(ctx, { seed: 66, n: 60, base: 0x0a0618 }));
    // c67 Canelo asleep standing against the ship (its hull at the right)
    const g67 = new Container();
    const hull = new Graphics().roundRect(1180, 380, 900, 640, 30).fill(0xffc2a8).stroke({ width: 8, color: POP.ink });
    for (let i = 0; i < 5; i++) hull.rect(1180, 470 + i * 110, 900, 10).fill(0xd88a6a);
    const can = ctx.actor(ctx.canelo, 520);
    const fl = new Graphics();
    g67.addChild(hull);
    if (can) g67.addChild(can);
    g67.addChild(fl);
    stC.addChild(g67);
    // c69 / c71 Luzterna with Cerito in her beam, looking at the tear
    const g69 = new Container();
    const lz = luzOf(ctx, 640);
    const cer = new StaticKitten(ctx, 220);
    const beam = new Beam(ctx);
    if (lz.actor) g69.addChild(lz.actor);
    g69.addChild(beam, cer);
    const tearGlow = glowAt(ctx, 1700, 420, 5, 0x9fe8ff, 0.3);
    if (tearGlow) g69.addChild(tearGlow);
    stC.addChild(g69);
    // c73–74 Esquirla jumps into the tear and is lost in the static of its edge
    const g73 = new Container();
    const tearG = new Graphics();
    const eq = esquirlaOf(ctx, 520);
    g73.addChild(tearG);
    if (eq.actor) g73.addChild(eq.actor);
    const tb = new Graphics();
    g73.addChild(tb);
    stC.addChild(g73);
    // c76 the crowd silent; Firma standing, without a pose
    const g76 = new Container();
    const fm = new Dressed(ctx.actor(SLUG.firma, 560), () => undefined);
    const heads = new Graphics();
    for (let i = 0; i < 16; i++) {
      const x = -60 + i * 130;
      heads.circle(x, 1030, 70).poly([x - 66, 1016, x - 52, 920, x - 14, 970]).poly([x + 66, 1016, x + 52, 920, x + 14, 970]);
    }
    heads.fill(0x07040e);
    if (fm.actor) g76.addChild(fm.actor);
    g76.addChild(heads);
    stC.addChild(g76);
    const all = new Container();
    all.addChild(isC, stC);
    ctx.plane(all, { z: 1000 });
    const T = (bar: number) => NG(bar) - NG(66);
    return {
      update(lt, f) {
        const rm = f.rm;
        const bar = 66 + Math.floor(lt / NG_BAR + 1e-6);
        const inB = lt - T(bar);
        const island = ISLAND_BARS.has(bar);
        isC.visible = island;
        stC.visible = !island;
        const step = Math.floor(lt * 12);
        if (island) {
          view.beam.rotation = -0.7 + Math.sin(lt * 0.45) * 0.55;
          // the frame's static border (we are looking through the tear)
          const fr = frame.clear();
          const pts: number[] = [];
          for (let i = 0; i < 40; i++) {
            const a = (i / 40) * Math.PI * 2;
            pts.push(960 + Math.cos(a) * 1010 * (0.97 + rnd(i * 3 + (rm ? 0 : step)) * 0.05), 540 + Math.sin(a) * 600 * (0.97 + rnd(i * 5 + (rm ? 0 : step)) * 0.05));
          }
          tearBorder(fr, pts, rm ? 0 : step, 22);
          // the ink: c68 swirls · c70 the eye opens and looks (lighthouse → blanket → hollow) · c72 it moves to the hollow
          // · c75 it closes
          const ik = ink.clear();
          const swirl = bar >= 68 ? (bar === 68 ? sm(inB / NG_BAR) : 1) : 0;
          if (swirl > 0)
            for (let i = 0; i < 9; i++) {
              const a = i * 0.7 + lt * 0.5 * (rm ? 0.3 : 1);
              const r = 140 + i * 30;
              ik.circle(1000 + Math.cos(a) * r * 0.9, 170 + Math.sin(a) * r * 0.35, (34 - i * 2) * swirl).fill({ color: 0x07060a, alpha: 0.75 * swirl });
            }
          const open = bar < 70 ? 0 : bar === 70 ? sm(seg(inB, 0.2, 1.2)) : bar === 75 ? 1 - sm(seg(inB, 0.6, 1.6)) : 1;
          eye.visible = open > 0.01;
          const ew = eyeW.clear();
          ew.moveTo(-260, 0).quadraticCurveTo(0, -150 * open, 260, 0).quadraticCurveTo(0, 150 * open, -260, 0).fill(0x0a0a12).stroke({ width: 10, color: 0x07060a });
          ew.moveTo(-240, 0).quadraticCurveTo(0, -120 * open, 240, 0).stroke({ width: 4, color: 0x3a4a7a, alpha: 0.6 });
          // where it looks: the lighthouse (c70) → the blanket → the hollow (c72)
          const look = bar === 70 ? (inB < 1.3 ? 0 : sm(seg(inB, 1.3, 2.4))) : bar === 72 ? 1 + sm(seg(inB, 0.3, 2.2)) : bar > 72 ? 2 : 0;
          const targets: [number, number][] = [view.lamp, view.blanket, view.hollow];
          const ti = Math.min(1, Math.floor(look));
          const tk = look - ti;
          const tx = targets[ti][0] + (targets[Math.min(2, ti + 1)][0] - targets[ti][0]) * tk;
          const ty = targets[ti][1] + (targets[Math.min(2, ti + 1)][1] - targets[ti][1]) * tk;
          const dx = Math.max(-150, Math.min(150, (tx - 1000) * 0.15));
          const dy = Math.max(-40, Math.min(70, (ty - 170) * 0.08)) * open;
          const pu = pupil.clear();
          pu.ellipse(dx, dy, 70 * Math.min(1, open * 1.4), 70 * open).fill(0x1a2a5a).ellipse(dx, dy, 22, 62 * open).fill(0x000000);
          pu.circle(dx - 22, dy - 22 * open, 9 * open).fill({ color: 0xbfd8ff, alpha: 0.8 });
          lid.clear();
        } else {
          // c67: Canelo asleep standing against the ship, his flame small
          g67.visible = bar === 67;
          if (g67.visible) {
            can?.pose(lt, 1060, 1080, { rot: 0.16 });
            if (can?.puppet) can.puppet.sleeping = true;
            fl.clear();
            caneloFlame(fl, can, FLAME.chica, lt, rm);
          }
          // c69 / c71: Luzterna with Cerito in her beam; c71 she sees the eye — her smile goes
          g69.visible = bar === 69 || bar === 71;
          if (g69.visible) {
            lz.actor?.pose(lt, 620, 1140 + bob(lt, rm), { flip: false });
            const [lx, ly] = lanternAt(lz);
            cer.position.set(1080, 820 + Math.sin(lt * 2) * 8);
            cer.update(lt, { stare: 0.8, clear: 0.1 });
            beam.set([lx, ly], [1100, 760], 170, 0.6);
            if (lz.actor?.puppet) lz.actor.puppet.look = bar === 71 ? 0.9 : 0.5;
            if (bar === 71 && inB > 0.4 && inB < 0.5) lz.actor?.emote('surprise');
            if (tearGlow) tearGlow.alpha = 0.25 + 0.1 * Math.sin(lt * 3);
          }
          // c73–74: Esquirla jumps into the tear, the static border swallows her
          g73.visible = bar === 73 || bar === 74;
          if (g73.visible) {
            const t0 = T(73);
            const q = seg(lt, t0 + 0.4, t0 + 2.4);
            const pts = tearPts(1300, 480, 380, 300, 73);
            tearG.clear().poly(pts).fill(0x0c1630).poly(pts).stroke({ width: 6, color: 0x5cff8a });
            tearBorder(tb.clear(), pts, rm ? 0 : step, 16);
            eq.actor?.pose(lt, 520 + q * 780, 1060 - Math.sin(q * Math.PI) * 420, { rot: q * 0.8, sx: 1 - q * 0.6, sy: 1 - q * 0.6 });
            eq.follow();
            if (eq.actor) eq.actor.visible = q < 0.92;
          }
          // c76: the crowd silent, Firma standing, no pose
          g76.visible = bar >= 76;
          if (g76.visible) {
            fm.actor?.pose(lt, 960, 990, {});
            fm.follow();
          }
        }
        void k;
      },
    };
  },
};

// ------------------------------------------------------------------ c77 → end · cierre: the tear shuts, the screens go out
export const cierre: SetModule = {
  cats: [SLUG.firma],
  build(ctx: SceneCtx): FilmSet {
    const st = stadium(ctx, { seed: 77 });
    st.wall.main.content.addChild(new Graphics().rect(0, 0, 1600, 900).fill(0x24104a));
    for (const p of [st.wall.left, st.wall.right]) p.content.addChild(new Graphics().rect(0, 0, 600, 880).fill(0x24104a));
    st.wall.strip.content.addChild(motto(2200, 128));
    const fm = firmaOf(ctx, 190);
    if (fm.actor) st.stage.addChild(fm.actor);
    const TC: [number, number] = [1180, 460];
    const view = islandView(ctx);
    const vc = new Container();
    vc.addChild(view.root);
    vc.scale.set(0.62);
    vc.position.set(TC[0] - view.hollow[0] * 0.62 + 120, TC[1] - view.hollow[1] * 0.62 + 160);
    const mask = new Graphics();
    vc.mask = mask;
    const border = new Graphics();
    const tc = new Container();
    tc.addChild(vc, mask, border);
    ctx.plane(tc, { z: 1000 });
    // the screens go out one by one, on the echo (a beat apart)
    const OFF = [0.45, 1.12, 1.78, 2.45];
    return {
      update(lt, f) {
        const rm = f.rm;
        const out = sm(seg(lt, 2.4, 3.1));
        st.update(lt, { rm, phones: 0.35 * (1 - out), beams: 0.5 * (1 - sm(seg(lt, 0.4, 2.0))), lamps: 0.5 * (1 - out) });
        fm.actor?.pose(lt, 760, 750, {});
        fm.follow();
        // the tear shuts in a snap (0–0.18 s)
        const k = 1 - sm(seg(lt, 0, 0.18));
        vc.visible = k > 0.01;
        border.visible = k > 0.01;
        if (k > 0.01) {
          const pts = tearPts(TC[0], TC[1], 800 * k, 550 * k, 63);
          mask.clear().poly(pts).fill(0xffffff);
          tearBorder(border.clear(), pts, Math.floor(lt * 12), 18);
        }
        const panels = [st.wall.main, st.wall.left, st.wall.right, st.wall.strip];
        panels.forEach((p, i) => p.power(1 - seg(lt, OFF[i], OFF[i] + 0.3), rm || ctx.rf));
        if (st.front) st.front.alpha = 1 - out * 0.7;
      },
    };
  },
};
void CUBE;
void Sprite;
