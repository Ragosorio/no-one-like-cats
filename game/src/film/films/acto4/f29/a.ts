/**
 * F29 — the stadium shots (the 2× world of kit/stadium): inicio, entrada, falla, luces, pirata, ruptura.
 * Layout (1920 coords inside the world): the stage deck at y 720, Firma at x 900, the glass cube hanging at x 1240.
 */
import { Container, Graphics, Rectangle } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { Confetti, POP, PhoneFrame, Spots, filterHost, glitchFilter, glitchSet, pixelFilter, pixelSet, pixelText } from '../../../styles/pop';
import { NG } from '../music';
import { GlassCube, SLUG, glowAt, outBack, rnd, seg, sm, stadium, word } from '../kit';
import { CAST_SLUGS, beatEnv, coverPose, esquirlaOf, firmaOf, maloOf, tailorOf } from './cast';
import { cursorBox, gameBg, hudPlate, motto, pirateBanner, startScreen } from './screens';

export const CUBE: [number, number] = [1240, 640];
const tex = (ctx: SceneCtx) => (n: string) => ctx.tex(n);
/** a hanging cube on the stage (layout coords inside the 2× world) */
function hangCube(ctx: SceneCtx, parent: Container, size = 140) {
  const c = new GlassCube(ctx, size);
  const cable = new Graphics().rect(-2, -700, 4, 700 - size).fill(0x8a8aa0);
  const host = new Container();
  host.addChild(cable, c);
  host.position.set(CUBE[0], CUBE[1]);
  parent.addChild(host);
  return { cube: c, host };
}
/** fill a side screen with a flat neon field + big type */
function sideField(ctx: SceneCtx, p: { content: Container }, col: number, text: string) {
  const g = new Graphics();
  for (let i = 0; i < 22; i++) g.rect(0, i * 40, 600, 41).fill(i % 2 ? col : POP.violet);
  p.content.addChild(g);
  const t = word(ctx.k, text, { fontFamily: 'Anton', fontSize: 170, fill: 0xffffff, stroke: { color: POP.ink, width: 10 }, letterSpacing: 6 });
  t.rotation = -Math.PI / 2;
  t.position.set(300, 440);
  p.content.addChild(t);
}
/** a live «camera feed» of an actor on a screen (the show's own video) */
function feed(ctx: SceneCtx, p: { content: Container; w: number; h: number }, actor: Container | null, bg: number[]) {
  const g = new Graphics();
  for (let i = 0; i < 18; i++) g.rect(0, (p.h * i) / 18, p.w, p.h / 18 + 1).fill(bg[i % bg.length]);
  p.content.addChild(g);
  if (actor) p.content.addChild(actor);
}

// ------------------------------------------------------------------ c1–5 · inicio: the start screen, the spot finds the cube
export const inicio: SetModule = {
  cats: [SLUG.cerito],
  build(ctx: SceneCtx): FilmSet {
    const st = stadium(ctx, { seed: 29 });
    const ss = startScreen();
    st.wall.main.content.addChild(ss.root);
    for (const [p, txt] of [
      [st.wall.left, 'P1'],
      [st.wall.right, '★'],
    ] as const) {
      p.content.addChild(gameBg(600, 880, txt.length * 13));
      const g = new Graphics();
      pixelText(g, txt === 'P1' ? 'P1' : 'LA GIRA', 300, 380, txt === 'P1' ? 30 : 12, txt === 'P1' ? POP.cyan : POP.gold, { align: 'center' });
      p.content.addChild(g);
    }
    st.wall.strip.content.addChild(motto(2200, 128));
    const { cube } = hangCube(ctx, st.stage);
    // the one spot that comes on at c3 and slides down from the screens to the cube
    const spot = new Spots(tex(ctx), [{ x: CUBE[0], y: 20, len: 760, half: 120, color: 0xfff4e0, a: Math.PI / 2, alpha: 0.75 }]);
    st.stage.addChild(spot);
    // PRESS START (the tap): a bright sweep across the screens
    const sweep = new Graphics().rect(-200, 0, 200, 900).fill({ color: 0xffffff, alpha: 0.7 });
    st.wall.main.content.addChild(sweep);
    return {
      update(lt, f) {
        const rm = f.rm;
        const m = f.m;
        st.update(lt, { rm, phones: 0.22, beams: 0, lamps: 0.15 });
        ss.press.visible = Math.floor(m * 2.25) % 2 === 0;
        const c3 = NG(3);
        const on = sm(seg(lt, c3, c3 + 0.25));
        // the spot comes on aimed at the screens, then lowers onto the cube (c3 → c4.5)
        const lower = sm(seg(lt, c3 + 0.3, NG(4.5)));
        spot.update(lt, on, rm, () => Math.PI / 2 - (1 - lower) * 0.9);
        cube.update(lt, { stare: 0.4 + 0.5 * lower, shine: 0.2 + 0.4 * on });
        const j = ctx.k.judged('start');
        const hit = j && j.r !== 'miss' ? j.at : null;
        const sw = hit !== null ? seg(m, hit, hit + 0.6) : seg(m, NG(4), NG(4) + 0.9) * 0;
        sweep.visible = sw > 0 && sw < 1;
        sweep.position.set(-200 + sw * 2000, 0);
        if (hit !== null && m > hit) ss.title.alpha = 1;
      },
    };
  },
};

// ------------------------------------------------------------------ c7–8 · entrada: Firma rises from the trapdoor
export const entrada: SetModule = {
  cats: [SLUG.firma, SLUG.cerito],
  build(ctx: SceneCtx): FilmSet {
    const st = stadium(ctx, { seed: 30 });
    const big = firmaOf(ctx, 860);
    feed(ctx, st.wall.main, big.actor, [0xffd8a8, 0xffc890, 0xffe0b8]);
    sideField(ctx, st.wall.left, POP.hot, 'FIRMA');
    sideField(ctx, st.wall.right, POP.cyan, 'FIRMA');
    st.wall.strip.content.addChild(motto(2200, 128));
    hangCube(ctx, st.stage);
    // Firma on the stage, rising out of the trapdoor (masked above the deck)
    const fc = new Container();
    const fm = firmaOf(ctx, 200);
    if (fm.actor) fc.addChild(fm.actor);
    const mask = new Graphics().rect(0, 0, 1920, 752).fill(0xffffff);
    fc.mask = mask;
    st.stage.addChild(fc, mask);
    const smoke = new Container();
    for (let i = 0; i < 6; i++) {
      const s = glowAt(ctx, 860 + i * 30, 745, 0.8, 0xe8d8ff, 0.4);
      if (s) smoke.addChild(s);
    }
    st.stage.addChild(smoke);
    return {
      update(lt, f) {
        const rm = f.rm;
        const m = f.m;
        const e = beatEnv(m, 9);
        st.update(lt, { rm, phones: 0.5, beams: 0.7 + 0.3 * e, lamps: 0.7 + 0.3 * e });
        const rise = sm(seg(lt, 0, 0.7));
        const p = coverPose(m, rm);
        fm.actor?.pose(lt, 900, 750 + (1 - rise) * 210, { ...p, step: ctx.k.beatStep(m) });
        fm.follow();
        big.actor?.pose(lt, 800, 960, { ...p, step: ctx.k.beatStep(m) });
        big.follow();
        smoke.alpha = 1 - sm(seg(lt, 0.4, 1.6));
      },
    };
  },
};

// ------------------------------------------------------------------ c14.021–15 · falla: LAYER 1, the HUD fails an instant
export const falla: SetModule = {
  cats: [SLUG.firma, SLUG.cerito],
  build(ctx: SceneCtx): FilmSet {
    const st = stadium(ctx, { seed: 31 });
    const big = firmaOf(ctx, 860);
    feed(ctx, st.wall.main, big.actor, [0xffd8a8, 0xffc890, 0xffe0b8]);
    sideField(ctx, st.wall.left, POP.hot, 'POP');
    sideField(ctx, st.wall.right, POP.cyan, 'POP');
    st.wall.strip.content.addChild(motto(2200, 128));
    hangCube(ctx, st.stage);
    const fm = firmaOf(ctx, 200);
    if (fm.actor) st.stage.addChild(fm.actor);
    // the HUD (over each screen)
    const hud = hudPlate(
      [
        { text: 'JUGADOR 1: FIRMA', px: 14, color: POP.gold },
        { text: 'PREMIO: CERITO', px: 14, color: POP.cyan },
      ],
      1400,
    );
    hud.root.position.set(100, 280);
    st.wall.main.content.addChild(hud.root);
    const sideHud: Container[] = [];
    for (const [p, t] of [
      [st.wall.left, 'P1'],
      [st.wall.right, '?'],
    ] as const) {
      const h = hudPlate([{ text: t, px: 22, color: 0xffffff }], 520, { border: POP.red });
      h.root.position.set(40, 320);
      p.content.addChild(h.root);
      sideHud.push(h.root);
    }
    const cur = new Graphics();
    st.stage.addChild(cur);
    const gl = glitchFilter();
    st.wall.filterArea = BIGR;
    st.wall.filters = [gl];
    const sweep = new Graphics().rect(0, 0, 400, 900).fill({ color: POP.cyan, alpha: 0.35 });
    st.wall.main.content.addChild(sweep);
    return {
      filters: [gl],
      update(lt, f) {
        const rm = f.rm;
        const m = f.m;
        st.update(lt, { rm, phones: 0.5, beams: 0.8, lamps: 0.8 });
        const p = coverPose(m, rm);
        fm.actor?.pose(lt, 900, 750, { ...p, step: ctx.k.beatStep(m) });
        fm.follow();
        big.actor?.pose(lt, 800, 960, { ...p, step: ctx.k.beatStep(m) });
        big.follow();
        // the flicker: HUD on for an instant at the start, a second blink, then the show comes back
        const blink = lt < 0.42 || (lt > 0.95 && lt < 1.12);
        const rf = ctx.rf;
        hud.root.visible = blink;
        for (const s of sideHud) s.visible = blink;
        const c = cur.clear();
        if (blink) cursorBox(c, CUBE[0] - 90, CUBE[1] - 170, 180, 180, POP.red, 5);
        const step = Math.floor(lt * 12);
        glitchSet(gl, rf ? 0 : blink ? 0.85 : Math.max(0, 0.3 - lt * 0.3), step, 18);
        // «Reducir destellos»: a slow colour sweep instead of the blocks
        sweep.visible = rf && lt < 1.6;
        sweep.position.set(-400 + seg(lt, 0, 1.6) * 2000, 0);
      },
    };
  },
};
const BIGR = new Rectangle(-4000, -4000, 1920 + 8000, 1080 + 8000);

// ------------------------------------------------------------------ c19–23 · luces: ¡LUCES! — phones, confetti, the crane
export const luces: SetModule = {
  cats: [SLUG.firma, SLUG.malo, SLUG.tailor, SLUG.cerito],
  build(ctx: SceneCtx): FilmSet {
    const st = stadium(ctx, { seed: 32 });
    const big = firmaOf(ctx, 860);
    feed(ctx, st.wall.main, big.actor, [0xffd8a8, 0xffc890, 0xffe0b8]);
    const ml = maloOf(ctx, 640);
    feed(ctx, st.wall.left, ml.actor, [POP.mint, 0xc8ffe8]);
    const tl = tailorOf(ctx, 640);
    feed(ctx, st.wall.right, tl.actor, [POP.lilac, 0xe8d8ff]);
    st.wall.strip.content.addChild(motto(2200, 128));
    hangCube(ctx, st.stage);
    const fm = firmaOf(ctx, 200);
    if (fm.actor) st.stage.addChild(fm.actor);
    // confetti over the whole frame (pinned), falling on the beat
    const conf = new Confetti({ n: Math.round(150 * Math.max(0.5, ctx.density)), x0: -40, x1: 1960, y0: -60, y1: 1140, seed: 19, speed: 240 });
    const cp = new Container();
    cp.addChild(conf);
    ctx.plane(cp, { z: 0, screen: true });
    // two fans' phones at the edges of the frame (9:16), recording her
    const phones: PhoneFrame[] = [];
    for (const [x, y, r] of [
      [70, 560, -0.08],
      [1600, 600, 0.07],
    ] as const) {
      const ph = new PhoneFrame(tex(ctx), 240, 427, 0);
      const bg = new Graphics();
      for (let i = 0; i < 12; i++) bg.rect(0, i * 36, 240, 37).fill(i % 2 ? 0x2a1450 : 0x24104a);
      ph.content.addChild(bg);
      const s = ctx.still(SLUG.firma);
      if (s) {
        s.scale.set(330 / (s.texture.height || 700));
        s.position.set(120, 420);
        ph.content.addChild(s);
      }
      ph.position.set(x, y);
      ph.rotation = r;
      phones.push(ph);
    }
    const pp = new Container();
    pp.addChild(...phones);
    ctx.plane(pp, { z: 0, screen: true });
    return {
      update(lt, f) {
        const rm = f.rm;
        const m = f.m;
        const e = beatEnv(m, 9);
        const j = ctx.k.judged('luces');
        const extra = j && j.r !== 'miss' ? sm(seg(m, j.at, j.at + 0.4)) : 0;
        // the sea of phones comes on at c19 (with the tap: brighter, all of them)
        const on = sm(seg(lt, 0, 0.5)) * (0.8 + 0.2 * extra);
        st.update(lt, { rm, phones: on, beams: 0.85 + 0.15 * e, lamps: 0.7 + 0.3 * e });
        st.phones.alpha = 0.85 + 0.15 * extra;
        const p = coverPose(m, rm);
        const step = ctx.k.beatStep(m);
        fm.actor?.pose(lt, 900, 750, { ...p, step });
        fm.follow();
        big.actor?.pose(lt, 800, 960, { ...p, step });
        big.follow();
        ml.actor?.pose(lt, 300, 900, { rot: Math.sin(m * 2) * 0.05, step });
        ml.follow();
        tl.actor?.pose(lt, 300, 900, { flip: Math.floor(m / 0.667) % 2 === 0, step });
        tl.follow();
        // confetti: falls on the downbeats (amount pulses up with each bar)
        conf.update(lt, 0.7 + 0.3 * e, rm);
        phones.forEach((ph, i) => {
          ph.update(lt + 4 + i * 7);
          ph.position.y = (i ? 600 : 560) + (rm ? 0 : Math.sin(lt * 3 + i) * 10);
        });
      },
    };
  },
};

// ------------------------------------------------------------------ c38–39 · pirata: LAYER 3, the pirate signal → 8-bit
export const pirata: SetModule = {
  cats: [SLUG.firma, SLUG.esquirla, SLUG.cerito],
  build(ctx: SceneCtx): FilmSet {
    const gl = glitchFilter();
    const px = pixelFilter();
    const host = filterHost([gl, px]);
    const st = stadium(ctx, { seed: 33, into: host });
    ctx.plane(host, { z: 1000 });
    // the main screen: Esquirla's face, huge, over a dead signal; the banner on every screen
    const eq = esquirlaOf(ctx, 1500);
    const g = new Graphics();
    for (let i = 0; i < 30; i++) g.rect(0, i * 30, 1600, 31).fill(i % 2 ? 0x101018 : 0x16161e);
    st.wall.main.content.addChild(g);
    if (eq.actor) st.wall.main.content.addChild(eq.actor);
    const b1 = pirateBanner(1600, 12);
    b1.position.set(0, 760);
    st.wall.main.content.addChild(b1);
    for (const p of [st.wall.left, st.wall.right]) {
      p.content.addChild(new Graphics().rect(0, 0, 600, 880).fill(0x101018));
      const b = pirateBanner(600, 8);
      b.position.set(0, 400);
      p.content.addChild(b);
    }
    st.wall.strip.content.addChild(motto(2200, 128));
    hangCube(ctx, st.stage);
    const fm = firmaOf(ctx, 200);
    if (fm.actor) st.stage.addChild(fm.actor);
    return {
      filters: [gl, px],
      update(lt, f) {
        const rm = f.rm;
        const m = f.m;
        st.update(lt, { rm, phones: 0.6, beams: 0.6, lamps: 0.5 });
        fm.actor?.pose(lt, 900, 750, { rot: -0.05 });
        fm.follow();
        eq.actor?.pose(lt, 820, 1560, { sx: 1 + Math.sin(lt * 9) * 0.01 });
        eq.follow();
        const step = Math.floor(lt * 12);
        glitchSet(gl, ctx.rf ? 0.08 : 0.28 + 0.22 * rnd(step), step, 16);
        // the 8-bit dissolve from the floor up over the bar (a pixel fade with «Reducir destellos»)
        pixelSet(px, sm(seg(lt, 0.3, NG(2) - 0.2)), 14, 4);
      },
    };
  },
};

// ------------------------------------------------------------------ c57–57.6 · ruptura: LAYER 4, the frame cracks, the rig falls
export const ruptura: SetModule = {
  cats: [SLUG.firma, SLUG.esquirla, SLUG.cerito],
  build(ctx: SceneCtx): FilmSet {
    const gl = glitchFilter();
    const host = filterHost([gl]);
    const st = stadium(ctx, { seed: 34, into: host });
    ctx.plane(host, { z: 1000 });
    const eq = esquirlaOf(ctx, 1500);
    st.wall.main.content.addChild(new Graphics().rect(0, 0, 1600, 900).fill(0x101018));
    if (eq.actor) st.wall.main.content.addChild(eq.actor);
    for (const p of [st.wall.left, st.wall.right]) p.content.addChild(new Graphics().rect(0, 0, 600, 880).fill(0x101018));
    st.wall.strip.content.addChild(motto(2200, 128));
    hangCube(ctx, st.stage);
    const fm = firmaOf(ctx, 200);
    if (fm.actor) st.stage.addChild(fm.actor);
    // the cracks across the whole LED frame (2× world, in front of the wall)
    const cracks = new Graphics();
    const lines: [number, number][][] = [];
    for (let k = 0; k < 14; k++) {
      const pts: [number, number][] = [[960 + (rnd(k) - 0.5) * 200, 330 + (rnd(k + 3) - 0.5) * 120]];
      let a = (k / 14) * Math.PI * 2;
      for (let s = 0; s < 6; s++) {
        a += (rnd(k * 7 + s) - 0.5) * 0.9;
        const [x, y] = pts[pts.length - 1];
        pts.push([x + Math.cos(a) * 110, y + Math.sin(a) * 70]);
      }
      lines.push(pts);
    }
    const crackW = new Container();
    crackW.addChild(cracks);
    crackW.scale.set(2);
    crackW.position.set(-960, -540);
    host.addChild(crackW);
    const sparks = new Graphics();
    st.stage.addChild(sparks);
    return {
      filters: [gl],
      update(lt, f) {
        const rm = f.rm;
        st.update(lt, { rm, phones: 0.5, beams: 0.9, lamps: 0.9 });
        fm.actor?.pose(lt, 900, 750, { rot: 0.04 });
        fm.follow();
        eq.actor?.pose(lt, 820, 1560, {});
        eq.follow();
        const k = sm(seg(lt, 0, 0.5));
        const c = cracks.clear();
        for (const pts of lines) {
          const n = Math.max(1, Math.floor(pts.length * k));
          c.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < n; i++) c.lineTo(pts[i][0], pts[i][1]);
          c.stroke({ width: 4, color: 0xffffff, alpha: 0.95 });
        }
        st.truss.fall(sm(seg(lt, 0.4, 1.6)) * 0.55);
        const step = Math.floor(lt * 12);
        glitchSet(gl, ctx.rf ? 0.06 : 0.3 + 0.2 * rnd(step + 3), step, 18);
        const s = sparks.clear();
        if (lt > 0.4)
          for (let i = 0; i < 16; i++) {
            const t = (lt * 1.6 + rnd(i)) % 1;
            s.rect(200 + rnd(i * 3) * 1500 + (rnd(i) - 0.5) * 60 * t, 120 + t * 500, 6, 6).fill({ color: i % 2 ? POP.yellow : 0xffffff, alpha: 1 - t });
          }
      },
    };
  },
};
void CAST_SLUGS;
void outBack;
