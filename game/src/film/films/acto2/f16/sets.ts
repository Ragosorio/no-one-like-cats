/**
 * F16 «Una sola línea» (Daria, c25 → fin) — the sets. The world is ONE white thread on indigo (hilo.ts); the fighters in
 * cel (the `hilo` style's cat bake). Every blow cuts the drawing, the frame frays from its edges, and at the corte seco
 * of c81 the whole stage lets go — Itō's own thread turns GREY first [TEMP-S4].
 *
 * Time: t = (bar − 25) × 1.791 s (c25 = 0). Each scene gets `f.m` (film time) for the cuts and the fraying, which run
 * across the whole film.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { FilmSet, FrameInfo, SceneCtx, SetModule } from '../../../stage';
import { Beam, FLAME, SLUG, balloon, bob, flame, glitchShard, glow, jolt, lanternAt, luzOf, outBack, rnd, seg, sm, tailTip, threadBundle, type LuzRig } from '../kit';
import { ARENA, Collapse, Cuts, Fringe, IND, ThreadFigure, arenaDrawing, fishFire, strings, threadSlash, type Cut } from './hilo';

export const BAR = 240 / 134;
export const c = (bar: number) => (bar - 25) * BAR;

/** the cuts across the film: one per blow (positions on the stands and rings; at the end, at the frame's edges) */
export const CUTS: Cut[] = (() => {
  const out: Cut[] = [];
  const on = (t: number, i: number, edge = false) => {
    if (edge) {
      const side = i % 4;
      const u = 0.1 + rnd(i * 3) * 0.8;
      const [x, y] = side === 0 ? [u * 1920, 120 + rnd(i) * 140] : side === 1 ? [u * 1920, 960 - rnd(i) * 120] : side === 2 ? [80 + rnd(i) * 200, u * 1080] : [1840 - rnd(i) * 200, u * 1080];
      out.push({ t, x, y, ang: rnd(i + 5) * Math.PI });
      return;
    }
    const r = i % 4;
    const a = Math.PI * (1.08 + rnd(i * 7) * 0.84);
    out.push({ t, x: ARENA.cx + Math.cos(a) * ARENA.rx * (1.05 + r * 0.08), y: ARENA.cy - 230 - r * 70 + Math.sin(a) * (120 + r * 30), ang: a + Math.PI / 2 });
  };
  let i = 0;
  for (let b = 29; b < 33; b++) on(c(b) + 0.9, i++);
  for (let b = 33; b < 41; b++) for (let k = 0; k < 2; k++) on(c(b) + k * BAR * 0.5 + 0.2, i++);
  for (let b = 43; b < 49; b++) on(c(b) + 1.1, i++);
  for (let b = 53; b < 65; b += 2) on(c(b) + 0.9, i++);
  for (let b = 65; b < 81; b++) for (let k = 0; k < 4; k++) on(c(b) + k * BAR * 0.25 + 0.1, i++, true);
  return out;
})();
/** how frayed the frame is at film time m */
export const frayAt = (m: number) => (m < c(29) ? 0 : m < c(65) ? 0.3 * seg(m, c(29), c(65)) : 0.3 + 0.7 * seg(m, c(65), c(81)));

type Actor = NonNullable<ReturnType<SceneCtx['actor']>>;
interface World {
  can: Actor | null;
  ito: Actor | null;
  esq: Actor | null;
  luz: LuzRig | null;
  fx: Graphics;
  flameG: Graphics;
  itoThreads: Graphics;
  cuts: Cuts;
  fringe: Fringe;
  figure: ThreadFigure | null;
  arenaTex: import('pixi.js').Texture | null;
  layer: Container;
}
/** the common world of every scene: the baked thread stage, the cuts overlay, the fighters, the frame's fringe */
function world(ctx: SceneCtx, o: { esq?: boolean; luz?: boolean; figure?: boolean; ship?: boolean; collapse?: boolean } = {}): World {
  const stage = arenaDrawing(ctx, { ship: o.ship });
  let arenaTex: import('pixi.js').Texture | null = null;
  if (o.collapse) {
    const r = ctx.baker.raster(stage, { res: 0.6 });
    arenaTex = r.tex;
    stage.destroy({ children: true });
  } else ctx.plane(stage, { z: 1200, bake: 'static', res: 0.75 });
  const over = new Container();
  const cuts = new Cuts(CUTS);
  over.addChild(cuts);
  let figure: ThreadFigure | null = null;
  if (o.figure) {
    // Cruceta in the stands, drawn in thread (his cape of paper in thread too)
    figure = new ThreadFigure(ctx, SLUG.cruceta, 170, (g) => {
      g.moveTo(20, -120).lineTo(90, -20).lineTo(60, 0).stroke({ width: 2.5, color: IND.line });
      g.moveTo(40, -110).lineTo(110, -40).stroke({ width: 2, color: IND.line, alpha: 0.7 });
    });
    figure.position.set(760, 520);
    over.addChild(figure);
  }
  // other spectators in thread, quiet
  ctx.plane(over, { z: 1200 });
  const layer = new Container();
  const itoThreads = new Graphics();
  const ito = ctx.actor(SLUG.ito, 380);
  const can = ctx.actor(ctx.canelo, 300);
  const esq = o.esq ? ctx.actor(SLUG.esquirla, 290) : null;
  const luz = o.luz ? luzOf(ctx, 200) : null;
  if (luz?.actor) layer.addChild(luz.actor);
  layer.addChild(itoThreads);
  for (const a of [ito, can, esq]) if (a) layer.addChild(a);
  const flameG = new Graphics();
  const fx = new Graphics();
  layer.addChild(flameG, fx);
  ctx.plane(layer, { z: 1000 });
  const fringe = new Fringe();
  ctx.plane(fringe, { z: 0, screen: true });
  return { can, ito, esq, luz, fx, flameG, itoThreads, cuts, fringe, figure, arenaTex, layer };
}
/** per frame: the cuts, the fringe, Itō's threads on his back, Canelo's flame */
function common(ctx: SceneCtx, w: World, lt: number, f: FrameInfo, o: { flame?: number; grey?: number } = {}) {
  w.cuts.draw(f.m, f.rm);
  w.fringe.draw(ctx.k.view, frayAt(f.m), f.m, f.rm);
  const t = w.itoThreads.clear();
  if (w.ito) {
    // a sheaf of threads on his back like a sword in its sheath: from the hip, up past the shoulder
    const sx = Math.sign(w.ito.scale.x) || 1;
    const S = w.ito.size;
    threadBundle(t, w.ito.x + sx * S * 0.16, w.ito.y - S * 0.18, S * 0.72, sx > 0 ? -1.15 : -1.99, (o.grey ?? 0) > 0.5 ? IND.grey : IND.line, 9);
  }
  const g = w.flameG.clear();
  const tip = tailTip(w.can);
  if (tip) flame(g, tip[0], tip[1], o.flame ?? FLAME.chica, lt, { rm: f.rm, scale: (w.can?.size ?? 300) / 300 });
}
const say = (ctx: SceneCtx, text: string, tail: [number, number], size = 52) => balloon(ctx.k, text, { size, wrap: 460, tail, fill: 0xfaf8ff, ink: IND.bg });
function reveal(c: Container, lt: number, a: number, b: number, rm: boolean) {
  const on = lt >= a && lt < b;
  c.visible = on;
  if (!on) return;
  const p = seg(lt, a, a + 0.18);
  c.alpha = Math.min(1, (b - lt) / 0.15);
  c.scale.set(rm ? 1 : 0.5 + 0.5 * outBack(p, 2));
}

// ------------------------------------------------------------------ c25 · the stop: Esquirla from behind — Itō cuts without looking
export const stop: SetModule = {
  cats: ({ canelo }) => [SLUG.ito, canelo, SLUG.esquirla, { slug: SLUG.cruceta, bake: 'hilo' }],
  build(ctx: SceneCtx): FilmSet {
    const w = world(ctx, { esq: true, figure: true });
    const str = new Graphics();
    ctx.plane(str, { z: 900 });
    return {
      update(lt, f) {
        const rm = f.rm;
        const cut = c(25.5);
        const [jx, jy] = jolt(lt, cut, 6, rm, 0.3);
        w.ito?.pose(lt, ARENA.ito, ARENA.feet, { flip: true, rot: lt > cut && lt < cut + 0.3 ? -0.06 : 0 });
        w.can?.pose(lt, ARENA.canelo, ARENA.feet, { flip: false });
        // Esquirla leaps from the stands behind Canelo, the shard first
        const p = seg(lt, 0.05, cut);
        const ex = 1720 - p * 230 + (lt > cut ? (lt - cut) * 380 : 0);
        const ey = 360 + p * 330 - Math.sin(p * Math.PI) * 80 + (lt > cut ? (lt - cut) * 200 : 0);
        w.esq?.pose(lt, ex + jx, ey + jy, { flip: false, rot: lt > cut ? 0.5 : -0.2 });
        const g = w.fx.clear();
        const hd = w.esq?.head() ?? [0, -200];
        if (lt < cut) glitchShard(g, ex - 60, ey + hd[1] * 0.5, 170, Math.PI * 0.9, IND.cyan);
        else {
          const sp = (lt - cut) * 420;
          glitchShard(g, ex - 80 - sp, ey - 140 - sp * 0.4, 90, Math.PI * 0.8 + (lt - cut) * 6, IND.cyan);
          glitchShard(g, ex - 40 + sp * 0.3, ey - 40 + sp * 0.6, 80, Math.PI * 1.1 - (lt - cut) * 5, IND.cyan);
        }
        // Itō's thread runs BACKWARDS past Canelo (he doesn't look)
        threadSlash(g, [ARENA.ito + 40, 620], [1560, 600], seg(lt, cut - 0.03, cut + 0.06), IND.line, 4);
        const s = str.clear();
        strings(s, lt, lt < cut ? 1 : Math.max(0, 1 - (lt - cut) * 3), rm);
        common(ctx, w, lt, f);
        w.figure?.setWipe(0, lt);
      },
      look: (lt) => ({ expo: lt < c(25.5) ? 0.88 : 1.0 }),
    };
  },
};

// ------------------------------------------------------------------ c26–29 · «Al gato no. Así no.» · «Perdón. Sigamos.»
export const honor: SetModule = {
  cats: ({ canelo }) => [SLUG.ito, canelo, SLUG.esquirla, { slug: SLUG.cruceta, bake: 'hilo' }],
  build(ctx: SceneCtx): FilmSet {
    const w = world(ctx, { esq: true, figure: true });
    const top = new Container();
    const b1 = say(ctx, 'Al gato no. Así no.', [-90, 80]);
    b1.position.set(ARENA.ito + 190, 380);
    const ss = say(ctx, '¡Ssss!', [80, 70], 44);
    ss.position.set(1500, 560);
    const b2 = say(ctx, 'Perdón. Sigamos.', [-80, 80]);
    b2.position.set(ARENA.ito + 200, 360);
    top.addChild(b1, ss, b2);
    ctx.plane(top, { z: 1000 });
    return {
      update(lt, f) {
        const rm = f.rm;
        // Itō never takes his eyes off Esquirla; Canelo turns, late
        const bow = sm(seg(lt, c(28) - c(26) + 0.4, c(28) - c(26) + 1.0)) * (1 - sm(seg(lt, c(29) - c(26) - 0.5, c(29) - c(26))));
        w.ito?.pose(lt, ARENA.ito, ARENA.feet, { flip: true, rot: bow * 0.35 });
        w.can?.pose(lt, ARENA.canelo, ARENA.feet, { flip: lt > 0.6 });
        // Esquirla on the floor with the broken shard; hisses; limps off into the stands' gatera
        const go = seg(lt, 1.8, 3.6);
        const ex = 1620 + go * 30;
        const ey = 840 - go * 380;
        w.esq?.pose(lt, ex, ey, { flip: false, rot: 0.2 - go * 0.2, alpha: 1 - sm(seg(lt, 3.2, 3.7)), step: Math.floor(lt * 8) });
        const g = w.fx.clear();
        glitchShard(g, 1460, 850, 70, 0.3, IND.cyan);
        glitchShard(g, 1530, 860, 60, 2.6, IND.cyan);
        reveal(b1, lt, 0.2, 2.9, rm);
        reveal(ss, lt, 1.2, 2.3, rm);
        reveal(b2, lt, c(28) - c(26) + 0.3, c(29) - c(26) - 0.1, rm);
        common(ctx, w, lt, f);
        w.figure?.setWipe(0, lt);
      },
    };
  },
};

// ------------------------------------------------------------------ the exchanges (shared): Canelo's fish of fire, Itō's thread splits it
interface Ex {
  t: number;
  /** Itō answers late (lost gaze, after c41) */
  late?: number;
}
function exchanges(w: World, lt: number, list: Ex[], rm: boolean) {
  const g = w.fx;
  for (const e of list) {
    const p = seg(lt, e.t, e.t + 0.55);
    if (p <= 0 || lt > e.t + 1.4) continue;
    const from: [number, number] = [ARENA.canelo - 80, 700];
    const to: [number, number] = [ARENA.ito + 60, 690];
    const splitAt = 0.68 + (e.late ?? 0);
    const q = Math.min(p, splitAt);
    const x = from[0] + (to[0] - from[0]) * q;
    const y = from[1] + (to[1] - from[1]) * q - Math.sin(q * Math.PI) * 90;
    if (p < splitAt) fishFire(g, x, y, 1.5, -1, lt, rm);
    else {
      const sep = (lt - (e.t + splitAt * 0.55)) * 140;
      const fade = 1 - seg(lt, e.t + 0.6, e.t + 1.3);
      if (fade > 0) {
        fishFire(g, x - sep * 0.4, y, 1.5, -1, lt, rm, 1, sep);
        g.alpha = 1;
      }
      threadSlash(g, [x - 20, y - 160], [x + 30, y + 160], seg(lt, e.t + splitAt * 0.55 - 0.05, e.t + splitAt * 0.55 + 0.05), IND.line, 3);
    }
  }
}
const exPose = (w: World, lt: number, list: Ex[]) => {
  let lunge = 0;
  let recoil = 0;
  for (const e of list) {
    lunge = Math.max(lunge, Math.max(0, 1 - Math.abs(lt - (e.t + 0.4 + (e.late ?? 0) * 0.55)) / 0.2));
    recoil = Math.max(recoil, Math.max(0, 1 - Math.abs(lt - e.t) / 0.18));
  }
  return { lunge, recoil };
};

// ------------------------------------------------------------------ c29–33 · the exchanges, one per bar
export const intercambio: SetModule = {
  cats: ({ canelo }) => [SLUG.ito, canelo, { slug: SLUG.cruceta, bake: 'hilo' }],
  build(ctx: SceneCtx): FilmSet {
    const w = world(ctx, { figure: true });
    const EX: Ex[] = [0, 1, 2, 3].map((i) => ({ t: i * BAR + 0.45 }));
    return {
      update(lt, f) {
        const { lunge, recoil } = exPose(w, lt, EX);
        w.ito?.pose(lt, ARENA.ito + lunge * 30, ARENA.feet, { flip: true, rot: -lunge * 0.08 });
        w.can?.pose(lt, ARENA.canelo + recoil * 20, ARENA.feet, { flip: false, sx: 1 + recoil * 0.05 });
        w.fx.clear();
        exchanges(w, lt, EX, f.rm);
        common(ctx, w, lt, f);
        w.figure?.setWipe(0, lt);
      },
    };
  },
};

// ------------------------------------------------------------------ c33–41 · the edge: threads everywhere, the crew, her light, Canelo cornered, «¡Cru—»
export const filo: SetModule = {
  cats: ({ canelo }) => [SLUG.ito, canelo, SLUG.luz, { slug: SLUG.cruceta, bake: 'hilo' }, { slug: 'zarpa_pirate_cat', bake: 'hilo' }, { slug: 'valquiria_lightning_cat', bake: 'hilo' }],
  build(ctx: SceneCtx): FilmSet {
    const w = world(ctx, { luz: true, figure: true });
    // flying threads at three depths (the camera goes in among them)
    const flyers = [600, 820, 1500].map((z, i) => {
      const g = new Graphics();
      ctx.plane(g, { z });
      return { g, z, i };
    });
    // the crew on the ship, in thread, holding on
    const crew = new Container();
    const c1 = new ThreadFigure(ctx, 'zarpa_pirate_cat', 150);
    const c2 = new ThreadFigure(ctx, 'valquiria_lightning_cat', 160);
    c1.position.set(150, 700);
    c2.position.set(290, 700);
    crew.addChild(c1, c2);
    ctx.plane(crew, { z: 1200 });
    const beam = new Beam(ctx);
    const path = new Graphics();
    const lamp = glow(ctx, IND.blue, 140, 0.9);
    const top = new Container();
    top.addChild(path, beam, lamp);
    ctx.plane(top, { z: 1000 });
    const cru = say(ctx, '¡Cru—', [-60, 80], 52);
    cru.position.set(ARENA.ito + 160, 420);
    const bl = new Container();
    bl.addChild(cru);
    ctx.plane(bl, { z: 1000 });
    const S = { b: BAR, c: BAR * 2, d: BAR * 3, e: BAR * 4, f: BAR * 7 };
    return {
      update(lt, f) {
        const rm = f.rm;
        const st = rm ? 0 : Math.floor(lt * 12);
        // the flying threads: long white lines whipping across, on twos
        for (const { g, i } of flyers) {
          g.clear();
          const n = lt < S.e ? 7 : 4;
          for (let k = 0; k < n; k++) {
            const seed = st * 13 + k * 7 + i * 101;
            const y = 100 + rnd(seed) * 900;
            const x0 = -300 + rnd(seed + 1) * 600;
            g.moveTo(x0, y).bezierCurveTo(x0 + 700, y - 200 + rnd(seed + 2) * 400, x0 + 1400, y - 200 + rnd(seed + 3) * 400, x0 + 2400, y + (rnd(seed + 4) - 0.5) * 300).stroke({ width: 1.5 + i, color: IND.line, alpha: 0.5 });
          }
        }
        // Itō advances (a), the crew holds (b), her light marks the paths (c), Itō's flurry (d), Canelo cornered (e), «¡Cru—» (f)
        const adv = sm(seg(lt, 0, S.b));
        const corner = lt >= S.e;
        w.ito?.pose(lt, ARENA.ito + adv * 160 + (lt > S.c ? 120 : 0), ARENA.feet, { flip: true, rot: lt >= S.d && lt < S.e ? (st % 2 ? -0.08 : 0.04) : 0 });
        w.can?.pose(lt, corner ? 1560 : ARENA.canelo, ARENA.feet + (corner ? 10 : 0), { flip: false, sy: corner ? 1 - Math.abs(Math.sin(lt * 9)) * 0.03 : 1 });
        c1.rotation = rm ? 0 : Math.sin(lt * 6) * 0.05;
        c2.rotation = rm ? 0 : Math.sin(lt * 6 + 1) * 0.05;
        // Luzterna on the ship's prow lights the trajectory (c)
        w.luz?.actor?.pose(lt, 330, 600 + bob(lt, rm, 6), { flip: true });
        const la = w.luz ? lanternAt(w.luz) : ([330, 520] as [number, number]);
        lamp.position.set(la[0], la[1]);
        const pg = path.clear();
        const lightOn = env(lt, S.c - 0.2, S.e + 2.0, 0.2, 0.4);
        if (lightOn > 0) {
          // the path her light shows: where Itō's thread will run (dashed glow), toward Canelo
          for (let k = 0; k < 14; k++) {
            const u = k / 13;
            const x = ARENA.ito + 200 + u * 700;
            const y = 640 - Math.sin(u * Math.PI) * 120;
            if (k % 2 === 0) pg.circle(x, y, 7).fill({ color: IND.blue, alpha: 0.8 * lightOn });
          }
        }
        beam.set(la, [ARENA.ito + 560, 560], 90, 0.45 * lightOn);
        // the flurry (d): slashes on twos
        const g = w.fx.clear();
        if (lt >= S.d && lt < S.e) for (let k = 0; k < 3; k++) threadSlash(g, [ARENA.ito + 240 + rnd(st + k) * 200, 300 + rnd(st + k + 9) * 400], [ARENA.ito + 900 + rnd(st + k + 4) * 300, 400 + rnd(st + k + 3) * 400], 1, IND.line, 2.5);
        // threads closing in on Canelo (e)
        if (corner) for (let k = 0; k < 4; k++) threadSlash(g, [1300 - k * 60, 200 + k * 120], [1900, 300 + k * 160], 1, IND.line, 1.5);
        reveal(cru, lt, S.f + 0.9, 99, rm);
        common(ctx, w, lt, f, { flame: corner ? FLAME.baja : FLAME.chica });
        w.figure?.setWipe(0, lt);
      },
      look: (lt) => ({ expo: 1.12, hal: 0.62 }),
    };
  },
};
const env = (lt: number, a: number, b: number, fi: number, fo: number) => Math.min(sm((lt - a) / fi), sm((b - lt) / fo));

// ------------------------------------------------------------------ c41 · the gap: the name erases, the figure in the stands unravels
export const hueco: SetModule = {
  cats: ({ canelo }) => [SLUG.ito, canelo, { slug: SLUG.cruceta, bake: 'hilo' }],
  build(ctx: SceneCtx): FilmSet {
    const w = world(ctx, { figure: true });
    // «¡Cru—» erasing letter by letter (four sprites, each masked out in turn)
    const cru = new Container();
    const balloonC = say(ctx, '¡Cru—', [-60, 80], 52);
    cru.addChild(balloonC);
    const eraser = new Graphics();
    cru.addChild(eraser);
    cru.position.set(ARENA.ito + 160, 420);
    const q = say(ctx, '…¿A quién llamabas?', [80, 80]);
    q.position.set(ARENA.canelo - 160, 440);
    const a = say(ctx, 'No sé.', [-60, 80]);
    a.position.set(ARENA.ito + 150, 430);
    const top = new Container();
    top.addChild(cru, q, a);
    ctx.plane(top, { z: 1000 });
    const GAP = BAR * 0.375;
    return {
      update(lt, f) {
        const rm = f.rm;
        w.ito?.pose(lt, ARENA.ito + 280, ARENA.feet, { flip: true, rot: lt < GAP ? -0.05 : 0 });
        if (lt > 0.05 && lt < 0.1) w.ito?.emote('surprise', 1);
        w.can?.pose(lt, 1560, ARENA.feet + 10, { flip: false });
        // the name erases letter by letter (an indigo wipe from the right) during the 1.5-beat gap
        const e = seg(lt, 0.02, GAP);
        const bw = balloonC.width;
        eraser.clear().rect(bw / 2 - bw * e, -balloonC.height / 2, bw * e + 10, balloonC.height).fill(0xfaf8ff);
        cru.visible = lt < GAP + 0.25;
        cru.alpha = 1 - seg(lt, GAP, GAP + 0.25);
        // the figure in the stands unravels, for good
        w.figure?.setWipe(rm ? (lt > 0.1 ? 1 : 0) : seg(lt, 0.05, GAP + 0.1), lt);
        reveal(q, lt, GAP + 0.25, GAP + 1.9, rm);
        reveal(a, lt, GAP + 1.95, 3.6, rm);
        w.fx.clear();
        common(ctx, w, lt, f, { flame: FLAME.baja });
      },
      look: (lt) => (lt < BAR * 0.375 ? { expo: 0.85, sat: 0.8 } : null),
    };
  },
};

// ------------------------------------------------------------------ c43–49 · going on: slower, his gaze lost; the hole where the figure was
export const seguir: SetModule = {
  cats: ({ canelo }) => [SLUG.ito, canelo],
  build(ctx: SceneCtx): FilmSet {
    const w = world(ctx, {});
    // the hole in the stands where the figure was: a dark patch with frayed ends
    const hole = new Graphics();
    hole.ellipse(760, 440, 70, 100).fill({ color: IND.deep, alpha: 0.9 });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      hole.moveTo(760 + Math.cos(a) * 70, 440 + Math.sin(a) * 100).lineTo(760 + Math.cos(a) * 90, 440 + Math.sin(a) * 120 + 20).stroke({ width: 2, color: IND.line, alpha: 0.8 });
    }
    ctx.plane(hole, { z: 1200 });
    const EX: Ex[] = [0, 1, 2, 3, 4, 5].map((i) => ({ t: i * BAR + 0.5, late: 0.12 }));
    return {
      update(lt, f) {
        const { lunge, recoil } = exPose(w, lt, EX);
        // between blows his head turns to the stands (the gaze lost)
        const look = Math.sin(lt * 0.9) > 0.3 ? 1 : 0;
        w.ito?.pose(lt, ARENA.ito + 120 + lunge * 24, ARENA.feet, { flip: look ? false : true, rot: -lunge * 0.06 });
        w.can?.pose(lt, ARENA.canelo + recoil * 18, ARENA.feet, { flip: false });
        w.fx.clear();
        exchanges(w, lt, EX, f.rm);
        common(ctx, w, lt, f);
      },
    };
  },
};

// ------------------------------------------------------------------ c49–65 · the second round: the shard pushed away, the bow in thread, eyes, the push
export const vuelta: SetModule = {
  cats: ({ canelo }) => [SLUG.ito, canelo, { slug: SLUG.ito, bake: 'hilo' }],
  build(ctx: SceneCtx): FilmSet {
    const w = world(ctx, {});
    // the bow drawn by the stage's own thread (Itō in thread, revealed like a line being drawn, bowing)
    const bowFig = new ThreadFigure(ctx, SLUG.ito, 300);
    bowFig.position.set(960, 520);
    const bp = new Container();
    bp.addChild(bowFig);
    ctx.plane(bp, { z: 1150 });
    const T = { shard: 0, bow: BAR * 4, eyes: BAR * 8, push: BAR * 10, end: BAR * 16 };
    const EX: Ex[] = [
      { t: T.bow + 0.6 },
      { t: T.bow + BAR * 2 + 0.6 },
      ...[0, 1, 2, 3, 4, 5].map((i) => ({ t: T.push + i * BAR + 0.45 })),
    ];
    return {
      update(lt, f) {
        const rm = f.rm;
        const { lunge, recoil } = exPose(w, lt, EX);
        const retreat = seg(lt, T.push, T.end) * 200;
        w.ito?.pose(lt, ARENA.ito + 180 - retreat + lunge * 24 + (lt < T.bow ? 300 : 0), ARENA.feet, { flip: true, rot: -lunge * 0.06 + (lt < T.bow ? sm(seg(lt, 3.0, 3.6)) * (1 - sm(seg(lt, 4.6, 5.4))) * 0.12 : 0) });
        w.can?.pose(lt, ARENA.canelo + recoil * 18 - (lt < T.bow ? 120 : 0), ARENA.feet, { flip: false });
        const g = w.fx.clear();
        // the shard on the floor; at 3.2 his foot sends it away from Canelo
        if (lt < T.bow) {
          const kick = seg(lt, 3.2, 4.2);
          glitchShard(g, 1060 - kick * 700, 860 + Math.sin(kick * Math.PI) * -20, 80, 0.3 + kick * 4, IND.cyan);
        }
        // the bow in thread: drawn left → right, bows, then rests
        bowFig.visible = lt >= T.bow && lt < T.eyes;
        const draw = seg(lt, T.bow + 0.2, T.bow + 1.8);
        bowFig.setWipe(0, lt);
        bowFig.scale.set(1);
        bowFig.alpha = (rm ? 1 : draw) * (1 - seg(lt, T.eyes - 0.6, T.eyes));
        bowFig.rotation = sm(seg(lt, T.bow + 2.0, T.bow + 2.8)) * 0.4 * (1 - sm(seg(lt, T.bow + 4.2, T.bow + 5.0)));
        exchanges(w, lt, EX, rm);
        common(ctx, w, lt, f);
      },
      look: (lt) => ({ expo: 0.94 }),
    };
  },
};

// ------------------------------------------------------------------ c65–81 · the last exchange: the circle run, the gathering of fire, her light, the crossing
export const final: SetModule = {
  cats: ({ canelo }) => [SLUG.ito, canelo, SLUG.luz],
  build(ctx: SceneCtx): FilmSet {
    const w = world(ctx, { luz: true });
    const beam = new Beam(ctx);
    const lamp = glow(ctx, IND.blue, 160, 0.9);
    const aura = new Graphics();
    const top = new Container();
    top.addChild(aura, beam, lamp);
    ctx.plane(top, { z: 1000 });
    const T = { run: 0, gather: BAR * 8, cross: BAR * 15, end: BAR * 16 };
    return {
      update(lt, f) {
        const rm = f.rm;
        const st = rm ? 0 : Math.floor(lt * 12);
        const g = w.fx.clear();
        const a = aura.clear();
        if (lt < T.gather) {
          // around the arena, opposite each other; threads cut on every hat
          const ang = lt * 0.9;
          const pos = (off: number): [number, number] => [ARENA.cx + Math.cos(ang + off) * ARENA.rx * 0.7, ARENA.feet - 20 + Math.sin(ang + off) * ARENA.ry * 0.6];
          const [ix, iy] = pos(0);
          const [cx, cy] = pos(Math.PI);
          const hop = rm ? 0 : Math.abs(Math.sin(lt * 9)) * 16;
          w.ito?.pose(lt, ix, iy - hop, { flip: Math.sin(ang) < 0 });
          w.can?.pose(lt, cx, cy - hop, { flip: Math.sin(ang + Math.PI) < 0 });
          // the run: speed streaks trailing both, on twos
          for (const [px, py, dirx] of [
            [ix, iy, -Math.sin(ang)],
            [cx, cy, -Math.sin(ang + Math.PI)],
          ] as const)
            for (let k = 0; k < 5; k++) g.moveTo(px - dirx * 60, py - 60 - k * 40).lineTo(px - dirx * (180 + rnd(st + k) * 120), py - 60 - k * 40).stroke({ width: 3, color: IND.line, alpha: 0.6 });
          if (st % 3 === 0) threadSlash(g, [ix, iy - 150], [cx, cy - 120], 1, IND.line, 2);
        } else {
          // Canelo gathers ALL his fire; at the back, Luzterna raises the lantern and her light marks the path
          const gp = seg(lt, T.gather, T.cross);
          w.ito?.pose(lt, ARENA.ito, ARENA.feet, { flip: true, rot: -0.04 });
          w.can?.pose(lt, ARENA.canelo, ARENA.feet, { flip: false, sy: 1 + gp * 0.04 });
          const r = 80 + gp * 160;
          for (const [col, sc, al] of [
            [IND.fire, 1.3, 0.35],
            [IND.fireCore, 1.0, 0.5],
          ] as const) {
            const pts: number[] = [];
            for (let i = 0; i <= 16; i++) {
              const an = Math.PI + (i / 16) * Math.PI;
              const rr = (r + (i % 2 ? 0 : 40 + rnd(st + i) * 50)) * sc;
              pts.push(ARENA.canelo + Math.cos(an) * rr * 0.8, ARENA.feet - 120 + Math.sin(an) * rr * 1.2);
            }
            a.poly(pts).fill({ color: col, alpha: al * Math.min(1, gp * 3) });
          }
          if (lt < T.cross) fishFire(g, ARENA.canelo - 160, 640, 0.6 + gp * 1.2, -1, lt, rm);
          // the crossing (c80): both dash to the centre — the fire and the thread meet
          const x = seg(lt, T.cross, T.end - 0.3);
          if (x > 0) {
            fishFire(g, ARENA.canelo - 160 - x * 620, 640 - Math.sin(x * Math.PI) * 60, 1.8, -1, lt, rm);
            threadSlash(g, [ARENA.ito + 80, 600], [ARENA.ito + 80 + x * 700, 620], 1, IND.line, 5);
          }
        }
        // her light marks the trajectory (from c73)
        w.luz?.actor?.pose(lt, 300, 640 + bob(lt, rm, 6), { flip: true, rot: lt > T.gather ? -0.1 : 0 });
        const la = w.luz ? lanternAt(w.luz) : ([300, 560] as [number, number]);
        lamp.position.set(la[0], la[1] - (lt > T.gather ? 20 : 0));
        const lightOn = sm(seg(lt, T.gather + 1.5, T.gather + 3));
        beam.set(la, [ARENA.cx + 60, 620], 120, 0.5 * lightOn);
        if (lightOn > 0) for (let k = 0; k < 16; k++) if (k % 2 === 0) g.circle(ARENA.canelo - 120 - (k / 15) * 640, 640 - Math.sin((k / 15) * Math.PI) * 60, 6).fill({ color: IND.blue, alpha: 0.8 * lightOn });
        common(ctx, w, lt, f, { flame: lt > T.gather ? FLAME.chica + seg(lt, T.gather, T.cross) * 0.5 : FLAME.chica });
      },
      look: (lt) => ({ expo: 1.18, hal: 0.7, halT: 0.62 }),
    };
  },
};

// ------------------------------------------------------------------ c81 · the dry cut: Itō falls; the stage lets go; his thread, grey
export const cola: SetModule = {
  cats: ({ canelo }) => [SLUG.ito, canelo],
  build(ctx: SceneCtx): FilmSet {
    const w = world(ctx, { collapse: true, ship: true });
    const col = w.arenaTex ? new Collapse(w.arenaTex, -1400, -900) : null;
    if (col) ctx.plane(col, { z: 1200 });
    // the snow of threads (and his, grey)
    const snow = new Graphics();
    ctx.plane(snow, { z: 900 });
    const bg = new Graphics().rect(-1400, -900, 4720, 2880).fill(IND.deep);
    ctx.plane(bg, { z: 1600, bake: 'static', res: 0.2 });
    return {
      update(lt, f) {
        const rm = f.rm;
        col?.update(lt - 0.15, rm);
        const knee = sm(seg(lt, 0, 0.35));
        w.ito?.pose(lt, ARENA.ito + 200, ARENA.feet + knee * 70, { flip: true, sy: 1 - knee * 0.3, rot: knee * 0.2, step: Math.floor(lt * 24) });
        w.can?.pose(lt, ARENA.canelo, ARENA.feet, { flip: false });
        const s = snow.clear();
        for (let i = 0; i < 60; i++) {
          const ph = (lt * 0.25 + rnd(i)) % 1;
          const x = rnd(i + 3) * 1920 + Math.sin(lt + i) * 30;
          const y = -100 + ((rnd(i + 7) + lt * (0.18 + rnd(i) * 0.12)) % 1.2) * 1200;
          s.moveTo(x, y).lineTo(x + 14, y + 22).stroke({ width: 1.6, color: IND.line, alpha: 0.75 });
          void ph;
        }
        // his own thread: grey from the cut, falling last
        const fall = seg(lt, 0.6, 2.6);
        s.moveTo(ARENA.ito + 260, 520 + fall * 300).bezierCurveTo(ARENA.ito + 400, 560 + fall * 320, ARENA.ito + 500, 480 + fall * 360, ARENA.ito + 640, 540 + fall * 380).stroke({ width: 7, color: IND.grey, alpha: 1 - seg(lt, 2.6, 3.0) });
        w.fx.clear();
        common(ctx, w, lt, f, { grey: 1 });
      },
      look: () => ({ expo: 0.9, sat: 0.85 }),
    };
  },
};
void Sprite;
void FLAME;
