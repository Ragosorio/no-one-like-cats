/**
 * F09 «Ciudad Mayúscula» — the sets (shot list in ./index.ts). The modern «spider-verse» comic: the MAI paintings
 * through the `aracnido` bake (flat inks off their line, two-ink halftone), everything that moves on TWOS (a pose()
 * only changes 12 times a second), coloured caption boxes, SOLID onomatopoeia.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { FilmSet, FrameInfo, SceneCtx, SetModule } from '../../../stage';
import {
  Beam,
  Bitacora,
  CMY,
  FLAME,
  INK,
  LANTERN,
  Onoma,
  PAPER,
  Panel,
  SLUG,
  balloon,
  bandSky,
  bob,
  burst,
  caption,
  comicStyle,
  dotsFill,
  env,
  fitArcTo,
  along,
  flame,
  glow,
  jolt,
  lanternAt,
  luzOf,
  outBack,
  realArcs,
  reveal,
  rnd,
  seg,
  sm,
  speedLines,
  tailTip,
  word,
  yarnBall,
} from '../kit';
import { STANDINS } from '../../../standins';

const DUSK = [0x2a1450, 0x4a1f6e, 0x8a2a7e, 0xc8386e, 0xf0604a, 0xff9a3a];

/** the Gato-señal: a lit ellipse in the clouds with a sitting cat cut out of it (ears: 0 = crooked … 1 = straight) */
export function catSignal(g: Graphics, cx: number, cy: number, r: number, ears = 1, o: { light?: number; ink?: number; alpha?: number } = {}) {
  const a = o.alpha ?? 1;
  g.ellipse(cx, cy, r * 1.25, r).fill({ color: o.light ?? 0xfff2b0, alpha: 0.95 * a }).stroke({ width: Math.max(3, r * 0.04), color: o.ink ?? INK, alpha: a });
  const ink = o.ink ?? INK;
  // the sitting cat: body, head, two ears (the right one crooked until she fixes it), tail curl
  g.ellipse(cx, cy + r * 0.28, r * 0.42, r * 0.5).fill({ color: ink, alpha: a });
  g.circle(cx, cy - r * 0.32, r * 0.3).fill({ color: ink, alpha: a });
  g.poly([cx - r * 0.28, cy - r * 0.42, cx - r * 0.2, cy - r * 0.78, cx - r * 0.05, cy - r * 0.55]).fill({ color: ink, alpha: a });
  const bent = (1 - ears) * 0.9;
  const tx = cx + r * 0.2 + Math.sin(bent) * r * 0.22;
  const ty = cy - r * 0.78 + (1 - Math.cos(bent)) * r * 0.25;
  g.poly([cx + r * 0.28, cy - r * 0.42, tx, ty, cx + r * 0.05, cy - r * 0.55]).fill({ color: ink, alpha: a });
  g.moveTo(cx + r * 0.36, cy + r * 0.6)
    .quadraticCurveTo(cx + r * 0.9, cy + r * 0.55, cx + r * 0.75, cy + r * 0.05)
    .stroke({ width: r * 0.11, color: ink, alpha: a, cap: 'round' });
}
/** comic clouds (puffs) across a band */
function clouds(g: Graphics, x: number, y: number, w: number, seed: number, fill = 0xffc2a0, ink = INK) {
  for (let i = 0; i < 7; i++) {
    const cx = x + (i / 6) * w + (rnd(seed + i) - 0.5) * 60;
    const r = 40 + rnd(seed + i * 3) * 50;
    g.circle(cx, y + rnd(seed + i * 5) * 30, r).fill(fill).stroke({ width: 5, color: ink });
  }
  g.rect(x - 40, y + 10, w + 80, 40).fill(fill);
}

// ------------------------------------------------------------------ 1 · the letters are the buildings
/** a word as BUILDINGS: block letters with a window grid (baked static: the masks resolve once) */
function letterBuilding(ctx: SceneCtx, text: string, size: number, face: number, side: number): Container {
  const c = new Container();
  const on = new Onoma(ctx.k, text, { size, fill: face, side, depth: Math.round(size * 0.22), dir: [0.35, 0.9], font: 'Anton' });
  c.addChild(on);
  // windows: a grid of lit squares clipped to the letters' face
  const win = new Graphics();
  const [w, h] = on.box;
  for (let y = -h * 0.42; y < h * 0.45; y += size * 0.11)
    for (let x = -w * 0.5; x < w * 0.5; x += size * 0.09) if (rnd(Math.floor(x * 7 + y * 13)) > 0.45) win.rect(x, y, size * 0.045, size * 0.06).fill(rnd(Math.floor(x + y)) > 0.3 ? 0xffe27a : 0xfff6e0);
  const m = new Sprite(on.face.texture);
  m.anchor.set(0.5);
  win.mask = m;
  c.addChild(win, m);
  return c;
}
export const ciudad: SetModule = {
  build(ctx: SceneCtx): FilmSet {
    const k = ctx.k;
    // sky (far, baked): dusk bands, halftone, the sun, the cat-signal in the clouds
    const sky = new Container();
    const sg = new Graphics();
    bandSky(sg, -1200, -900, 4320, 900, DUSK);
    sky.addChild(sg);
    const dots = dotsFill(ctx.tex('ar:dots'), 4320, 1800, { tint: CMY.magenta, scale: 0.55, alpha: 0.28, x: -1200, y: -900 });
    sky.addChild(dots);
    const sun = new Graphics().circle(960, 620, 260).fill(0xffd23a).stroke({ width: 10, color: INK });
    for (let i = 0; i < 5; i++) sun.rect(700, 560 + i * 34, 520, 12).fill(DUSK[5 - (i % 3)]);
    sky.addChild(sun);
    const cg = new Graphics();
    clouds(cg, -500, 130, 1300, 3);
    clouds(cg, 1300, 70, 1400, 9, 0xffb0a8);
    catSignal(cg, 1210, 60, 120, 0.25);
    sky.addChild(cg);
    ctx.plane(sky, { z: 6000, bake: 'static', res: 0.7 });
    // far skyline (plain towers)
    const far = new Graphics();
    for (let i = 0; i < 26; i++) {
      const w = 90 + rnd(i) * 140;
      const h = 180 + rnd(i + 40) * 380;
      const x = -900 + i * 150;
      far.rect(x, 900 - h, w, h + 400).fill(i % 2 ? 0x3a1a5e : 0x2c1450).stroke({ width: 6, color: INK });
      for (let j = 0; j < 10; j++) if (rnd(i * 11 + j) > 0.5) far.rect(x + 14 + (j % 3) * 28, 920 - h + Math.floor(j / 3) * 46, 14, 22).fill(0xff9a3a);
    }
    ctx.plane(far, { z: 3200, bake: 'static', res: 0.7 });
    // CIUDAD (mid) and MAYÚSCULA (near): the camera flies between the letters
    const ciu = letterBuilding(ctx, 'CIUDAD', 400, 0xffd23a, 0xb3261e);
    ciu.position.set(960, 470);
    const cP = new Container();
    cP.addChild(ciu);
    ctx.plane(cP, { z: 2000, bake: 'static', res: 1.1 });
    const mayL = letterBuilding(ctx, 'MAYÚS', 400, 0x22b8e8, 0x1a3a8a);
    mayL.position.set(500, 900);
    const mayR = letterBuilding(ctx, 'CULA', 400, 0xec2d7a, 0x7a1240);
    mayR.position.set(1450, 910);
    const mP = new Container();
    mP.addChild(mayL, mayR);
    ctx.plane(mP, { z: 1100, bake: 'static', res: 1.4 });
    // street-level: a fire escape and sirens' light streaks (near, live: on twos)
    const near = new Container();
    const streak = new Graphics();
    near.addChild(streak);
    ctx.plane(near, { z: 700 });
    return {
      update(lt, f) {
        const g = streak.clear();
        const st = f.rm ? 0 : Math.floor(lt * 12);
        // two siren sweeps far below (red / blue), on twos
        for (const [i, col] of [
          [0, CMY.red],
          [1, CMY.blue],
        ] as const) {
          const ph = (st / 12 + i * 0.5) % 1;
          g.poly([200 + ph * 1500, 1300, 260 + ph * 1500, 1300, 900 + ph * 300, 980]).fill({ color: col, alpha: 0.18 });
        }
      },
    };
  },
};

// ------------------------------------------------------------------ 2 · the signal, the prints, the flame
/** page layout (world px of the plane at z 1000) */
export const P2 = {
  v1: { x: 70, y: 40, w: 1780, h: 520 },
  v2: { x: 70, y: 600, w: 850, h: 440 },
  v3: { x: 960, y: 600, w: 890, h: 440 },
} as const;
function pageBack(ctx: SceneCtx, w = 1920, h = 1080): Container {
  const c = new Container();
  // the desk under the page (seen when the camera pulls back) and the page itself
  c.addChild(new Graphics().rect(-900, -700, w + 1800, h + 1400).fill(0x1a0b2e));
  c.addChild(dotsFill(ctx.tex('ar:dots'), w + 1800, h + 1400, { tint: 0x3a1a6e, scale: 0.6, alpha: 0.6, x: -900, y: -700 }));
  c.addChild(new Graphics().rect(16, 22, w, h).fill({ color: 0x000000, alpha: 0.45 }).rect(0, 0, w, h).fill(0xffffff));
  return c;
}
/** a hero of another version, as a silhouette (code-drawn: a cape, a helmet, a scarf, a mask — each its own outline) */
function heroSil(g: Graphics, kind: number, s: number, color: number) {
  const P = (x: number, y: number): [number, number] => [x * s, y * s];
  const pts = (arr: number[][]) => arr.flatMap(([x, y]) => P(x, y));
  // body sitting, head, ears (all heroes are cats)
  g.poly(pts([[-48, 0], [-40, -90], [-20, -130], [24, -130], [44, -88], [50, 0]])).fill(color);
  g.circle(...P(0, -160), 46 * s).fill(color);
  g.poly(pts([[-40, -180], [-34, -236], [-8, -196]])).fill(color);
  g.poly(pts([[40, -180], [34, -236], [8, -196]])).fill(color);
  g.moveTo(...P(46, -10)).quadraticCurveTo(...P(110, -30), ...P(96, -110)).stroke({ width: 16 * s, color, cap: 'round' });
  if (kind === 0) g.poly(pts([[-30, -128], [30, -128], [86, 10], [-90, 10]])).fill(color); // a long cape
  if (kind === 1) {
    // a spiky helmet / crest
    g.poly(pts([[-44, -190], [-20, -262], [0, -200], [20, -270], [44, -190]])).fill(color);
  }
  if (kind === 2) g.poly(pts([[-36, -128], [60, -150], [130, -120], [60, -118]])).fill(color); // a scarf in the wind
  if (kind === 3) {
    // a top hat and a cane
    g.rect(...P(-34, -250), 68 * s, 50 * s).fill(color).rect(...P(-52, -204), 104 * s, 10 * s).fill(color);
    g.rect(...P(-80, -110), 9 * s, 110 * s).fill(color);
  }
}
/** two of the rooftop heroes are this city's own (their paintings, as silhouettes): Murciégato's cape, Gato Araña's crouch */
const ROOF_HEROES: Record<number, [string, number]> = { 1: [STANDINS.aranya, 210], 2: [STANDINS.murciegato, 300] };
export const senal: SetModule = {
  cats: ({ canelo }) => [canelo, STANDINS.murciegato, STANDINS.aranya],
  build(ctx: SceneCtx): FilmSet {
    const k = ctx.k;
    const back = pageBack(ctx);
    ctx.plane(back, { z: 1000, bake: 'static' });
    const page = new Container();
    // V1: the heroes on the rooftops look up at a signal nobody lit
    const v1 = new Panel(P2.v1);
    const s1 = new Graphics();
    bandSky(s1, -900, -260, 1800, 260, DUSK);
    v1.content.addChild(s1);
    v1.content.addChild(dotsFill(ctx.tex('ar:dots'), 1800, 520, { tint: CMY.magenta, scale: 0.5, alpha: 0.25, x: -900, y: -260 }));
    const sigG = new Graphics();
    clouds(sigG, -820, -170, 900, 4);
    catSignal(sigG, 520, -140, 90, 0.25);
    v1.content.addChild(sigG);
    const roofs = new Graphics();
    const RX = [-760, -380, 40, 420];
    RX.forEach((x, i) => {
      const top = 80 + (i % 2) * 50 + rnd(i) * 30;
      roofs.rect(x - 120, top, 300, 400).fill(i % 2 ? 0x2a1450 : 0x351a62).stroke({ width: 7, color: INK });
      roofs.rect(x - 140, top - 16, 340, 22).fill(0x1a0b2e).stroke({ width: 5, color: INK });
      roofs.rect(x + 120, top - 70, 26, 60).fill(0x1a0b2e).stroke({ width: 4, color: INK });
    });
    v1.content.addChild(roofs);
    // the heroes: silhouettes of other versions, each with ITS OWN line weight (a rim of its own colour and width)
    const RIMS = [CMY.cyan, CMY.yellow, CMY.green, CMY.magenta];
    const RW = [5, 12, 2.5, 8];
    const heroes: Container[] = [];
    for (let i = 0; i < 4; i++) {
      const h = new Container();
      const own = ROOF_HEROES[i];
      const sRim = own ? ctx.silhouette(own[0]) : null;
      const sBody = own ? ctx.silhouette(own[0]) : null;
      if (own && sRim && sBody) {
        // the painting's own outline: a rim of its colour and weight, the body in night ink
        const k = own[1] / sBody.texture.height;
        sBody.scale.set(k);
        sRim.scale.set(k * (1 + RW[i] / 90), k * (1 + RW[i] / 120));
        sRim.tint = RIMS[i];
        sBody.tint = 0x140a24;
        h.addChild(sRim, sBody);
      } else {
        const rim = new Graphics();
        const body = new Graphics();
        heroSil(rim, i, (i % 2 ? 0.95 : 1.1) * (1 + RW[i] / 60), RIMS[i]);
        heroSil(body, i, i % 2 ? 0.95 : 1.1, 0x140a24);
        h.addChild(rim, body);
      }
      h.position.set(RX[i], 80 + (i % 2) * 50 + rnd(i) * 30 - 16);
      h.scale.x = i < 2 ? -1 : 1;
      heroes.push(h);
      v1.content.addChild(h);
    }
    const c1 = caption(k, 'LOS HÉROES VEN UNA SEÑAL QUE NADIE PRENDIÓ.', { fill: CMY.cyan, w: 560, size: 46, rot: -0.02 });
    c1.position.set(-560, -170);
    v1.over.addChild(c1);
    // V2: Cerito's prints — with halftone at the edges now — go down to the dock
    const v2 = new Panel(P2.v2);
    const b2 = new Graphics();
    b2.rect(-425, -220, 850, 440).fill(0x2c1450);
    b2.rect(-425, -220, 520, 150).fill(0x4a1f6e).stroke({ width: 6, color: INK });
    // the fire escape zigzag
    b2.moveTo(40, -70).lineTo(180, -10).lineTo(40, 50).lineTo(180, 110).lineTo(60, 170).stroke({ width: 10, color: INK });
    // the dock and the water
    b2.rect(-425, 150, 850, 70).fill(0x1a3a8a);
    for (let i = 0; i < 9; i++) b2.rect(-400 + i * 95, 160 + (i % 2) * 18, 60, 6).fill({ color: 0x8ad8ff, alpha: 0.7 });
    b2.rect(100, 120, 325, 34).fill(0x8a5a3a).stroke({ width: 5, color: INK });
    for (let i = 0; i < 4; i++) b2.rect(130 + i * 80, 150, 16, 70).fill(0x5a3a22).stroke({ width: 4, color: INK });
    v2.content.addChild(b2);
    const PRINTS: [number, number][] = [
      [-380, -150],
      [-300, -128],
      [-220, -150],
      [-140, -128],
      [-60, -150],
      [40, -95],
      [130, -40],
      [70, 20],
      [150, 80],
      [210, 125],
      [290, 128],
      [370, 125],
    ];
    const prints: Graphics[] = PRINTS.map(([x, y], i) => {
      const g = new Graphics();
      const s = 1 - i * 0.02;
      g.ellipse(0, 6, 15 * s, 12 * s).fill(0xb9c8ff);
      for (let t = 0; t < 4; t++) g.circle(-15 + t * 10, -10 - (t === 1 || t === 2 ? 5 : 0), 5.5 * s).fill(0xb9c8ff);
      // halftone at the edges: a ring of dots
      for (let d = 0; d < 10; d++) {
        const a = (d / 10) * Math.PI * 2;
        g.circle(Math.cos(a) * 24, Math.sin(a) * 20, 2.6).fill(CMY.magenta);
      }
      g.position.set(x, y);
      g.rotation = i < 5 ? 0 : 0.7;
      v2.content.addChild(g);
      return g;
    });
    const c2 = caption(k, 'Y ALGO DEJÓ HUELLAS QUE NO SON DE NADIE.', { fill: CMY.green, w: 420, size: 40, rot: 0.02 });
    c2.position.set(-210, 150);
    v2.over.addChild(c2);
    // V3: Canelo passes a tear in an alley wall — his tail flame goes down; he scratches and goes on
    const v3 = new Panel(P2.v3);
    const b3 = new Graphics();
    b3.rect(-445, -220, 890, 440).fill(0x5a2a3a);
    for (let y = -220; y < 160; y += 40) for (let x = -445 + ((y / 40) % 2) * 40; x < 445; x += 80) b3.rect(x + 3, y + 3, 74, 34).fill(0x6e3446).stroke({ width: 3, color: 0x2a0f1a });
    b3.rect(-445, 160, 890, 60).fill(0x2a1a2e);
    v3.content.addChild(b3);
    // the tear: a jagged hole with static inside and glitchy colour edges
    const tear = new Container();
    const hole: number[] = [];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const r = (i % 2 ? 70 : 110) + rnd(i + 3) * 30;
      hole.push(Math.cos(a) * r * 0.6, Math.sin(a) * r);
    }
    const hg = new Graphics().poly(hole).fill(0x0a0a12).stroke({ width: 8, color: CMY.cyan });
    const hg2 = new Graphics().poly(hole.map((v, i) => v * 1.06 + (i % 2 ? 0 : 4))).stroke({ width: 4, color: CMY.magenta });
    const noise = new Graphics();
    tear.addChild(hg2, hg, noise);
    tear.position.set(60, -20);
    v3.content.addChild(tear);
    const can = ctx.actor(ctx.canelo, 250);
    const flameG = new Graphics();
    const fx = new Container();
    if (can) fx.addChild(can);
    fx.addChild(flameG);
    v3.content.addChild(fx);
    const bz = word(k, 'bzzt', comicStyle(46, CMY.cyan, { stroke: { color: INK, width: 6 } }));
    bz.position.set(150, -120);
    v3.over.addChild(bz);
    const scr = word(k, 'scritch scritch', comicStyle(34, PAPER, { stroke: { color: INK, width: 6 } }));
    scr.position.set(300, 40);
    v3.over.addChild(scr);
    page.addChild(v1, v2, v3);
    ctx.plane(page, { z: 999 });
    return {
      update(lt, f) {
        const rm = f.rm;
        v1.show(lt, 0.15, rm);
        v2.show(lt, 4.9, rm);
        v3.show(lt, 7.9, rm);
        reveal(c1, lt, 1.0, Infinity, rm);
        reveal(c2, lt, 5.6, Infinity, rm);
        // the heroes turn their heads up, one after another (on twos: tilt)
        heroes.forEach((h, i) => {
          const t = seg(lt, 0.8 + i * 0.35, 1.2 + i * 0.35);
          h.rotation = (i < 2 ? 1 : -1) * -0.06 * sm(t) * (f.step12 % 2 ? 1 : 0.85);
        });
        // the prints appear one after another toward the dock
        prints.forEach((p, i) => {
          const t0 = 5.2 + i * 0.2;
          p.alpha = lt < t0 ? 0 : sm((lt - t0) / 0.15);
          p.scale.set(rm ? 1 : 0.6 + 0.4 * outBack(seg(lt, t0, t0 + 0.2), 2));
        });
        // V3: Canelo walks left → right on twos; the flame drops while he's next to the tear
        const wt = seg(lt, 8.1, 10.0);
        const x = -360 + wt * 520 + seg(lt, 10.4, 10.8) * 250;
        const step = f.rm ? 0 : Math.floor(lt * 12) % 2;
        const scratch = env(lt, 9.6, 10.3, 0.05, 0.1);
        can?.pose(lt, x, 175 - step * 6, { flip: false, rot: scratch * 0.08 * (step ? 1 : -1) });
        const near = 1 - Math.min(1, Math.abs(x - 60) / 230);
        const fk = FLAME.chica - (FLAME.chica - FLAME.baja) * sm(near * 1.6) - (lt > 9.4 ? 0.04 : 0);
        const g = flameG.clear();
        const tip = tailTip(can);
        if (tip) flame(g, tip[0], tip[1], fk, lt, { rm });
        const ng = noise.clear();
        const st = f.rm ? 0 : f.step12;
        for (let i = 0; i < 14; i++) ng.rect((rnd(st * 31 + i) - 0.5) * 100, (rnd(st * 17 + i) - 0.5) * 190, 10 + rnd(i + st) * 30, 4).fill({ color: rnd(i + st * 3) > 0.5 ? 0xffffff : CMY.cyan, alpha: 0.7 });
        reveal(bz, lt, 9.0, 9.9, rm);
        reveal(scr, lt, 9.7, 10.6, rm);
      },
    };
  },
};

// ------------------------------------------------------------------ 3 · La Pandilla del Ovillo and the rule
export const P3 = {
  v1: { x: 70, y: 50, w: 860, h: 980 },
  v2: { x: 970, y: 50, w: 880, h: 980 },
} as const;
export const pandilla: SetModule = {
  cats: [...SLUG.pandilla],
  build(ctx: SceneCtx): FilmSet {
    const k = ctx.k;
    ctx.plane(pageBack(ctx), { z: 1000, bake: 'static' });
    const page = new Container();
    // V1: the gang on the cover, knuckles cracking
    const v1 = new Panel({ ...P3.v1, bg: 0x2a1450 });
    const bg1 = new Graphics();
    speedLines(bg1, 0, 60, 120, 900, { n: 70, color: 0x4a1f6e, seed: 4 });
    v1.content.addChild(bg1);
    v1.content.addChild(dotsFill(ctx.tex('ar:dots'), 860, 980, { tint: CMY.orange, scale: 0.5, alpha: 0.22, x: -430, y: -490 }));
    const gang: { a: ReturnType<SceneCtx['actor']>; x: number; s: number }[] = [];
    const belts = new Graphics();
    ([
      [SLUG.pandilla[1], -235, 470, true],
      [SLUG.pandilla[2], 235, 470, false],
      [SLUG.pandilla[0], 0, 560, false],
    ] as const).forEach(([slug, x, s, flip]) => {
      const a = ctx.actor(slug, s);
      if (a) {
        a.scale.x = flip ? -1 : 1;
        v1.content.addChild(a);
      }
      gang.push({ a, x, s });
    });
    // yarn balls hanging off the two thugs' belts (their trademark), drawn over the paintings; Doctor Ovillo (the centre)
    // carries his own: his arms
    gang.forEach(({ x, s }, i) => {
      if (i === 2) return;
      const by = 470 - s * 0.3;
      // one on each thug's OUTER hip (the inner side overlaps the doctor)
      if (i === 0) yarnBall(belts, x - s * 0.18, by, s * 0.07, 0xd9483a);
      else yarnBall(belts, x + s * 0.16, by + 10, s * 0.06, 0xec2d7a);
    });
    v1.content.addChild(belts);
    const name = new Container();
    const nb = new Graphics();
    burst(nb, 0, 0, 300, { fill: CMY.yellow, n: 18, seed: 7, inner: 0.78 });
    const n1 = word(k, 'LA PANDILLA', comicStyle(96, CMY.red, { stroke: { color: INK, width: 10 } }));
    n1.position.set(0, -50);
    const n2 = word(k, 'DEL OVILLO', comicStyle(112, CMY.red, { stroke: { color: INK, width: 10 } }));
    n2.position.set(0, 60);
    name.addChild(nb, n1, n2);
    name.position.set(0, -320);
    name.rotation = -0.06;
    name.scale.set(0.82);
    v1.over.addChild(name);
    const crac = word(k, '¡CRAC! ¡CRAC!', comicStyle(54, PAPER, { stroke: { color: INK, width: 7 } }));
    crac.position.set(230, 40);
    crac.rotation = 0.12;
    v1.over.addChild(crac);
    // V2: THE RULE — a punch leaves a solid «¡KRAK!»; a real shot (the simulator's flight) bounces off the K
    const v2 = new Panel({ ...P3.v2, bg: 0x4a1f6e });
    const deck = new Graphics();
    bandSky(deck, -440, -490, 880, 160, [0x2a1450, 0x4a1f6e, 0x8a2a7e]);
    deck.rect(-440, 160, 880, 330).fill(0x8a5a3a).stroke({ width: 7, color: INK });
    for (let i = 0; i < 8; i++) deck.rect(-440, 190 + i * 40, 880, 4).fill({ color: 0x5a3a22, alpha: 0.8 });
    deck.rect(-440, 150, 880, 24).fill(0x5a3a22).stroke({ width: 5, color: INK });
    v2.content.addChild(deck);
    v2.content.addChild(dotsFill(ctx.tex('ar:dots'), 880, 650, { tint: CMY.magenta, scale: 0.5, alpha: 0.18, x: -440, y: -490 }));
    const thug = ctx.actor(SLUG.pandilla[1], 300);
    if (thug) v2.content.addChild(thug);
    const hit = new Graphics();
    burst(hit, 0, 0, 120, { fill: PAPER, n: 12, seed: 3 });
    hit.position.set(260, -60);
    v2.content.addChild(hit);
    const krak = new Onoma(k, '¡KRAK!', { size: 190, fill: CMY.yellow, side: 0xb3261e, rot: -0.05 });
    v2.content.addChild(krak);
    // the shot: the simulator's real flight, mapped from the left edge to the deck; cut where it meets the K
    const arc = realArcs()[0];
    const pts = fitArcTo(arc, [-470, 150], [-70, 40], -360);
    const hitAt = 1;
    const trail = new Graphics();
    const ball = new Graphics().circle(0, 0, 16).fill(0x1a1420).stroke({ width: 4, color: PAPER });
    const ping = new Graphics();
    burst(ping, 0, 0, 60, { fill: CMY.cyan, n: 10, seed: 9 });
    const pingT = word(k, '¡PING!', comicStyle(64, PAPER, { stroke: { color: INK, width: 8 } }));
    v2.content.addChild(trail, ball, ping, pingT);
    const c3 = caption(k, 'AQUÍ EL RUIDO SE QUEDA. ÚSALO.', { fill: CMY.yellow, w: 600, size: 46, rot: -0.02 });
    c3.position.set(0, 380);
    v2.over.addChild(c3);
    page.addChild(v1, v2);
    ctx.plane(page, { z: 999 });
    // scene-local beats (scene starts on the page-3 crash)
    const T = { v2: 4.9, punch: 6.3, shot: 9.4, ping: 10.1, cap: 10.9 };
    return {
      update(lt, f) {
        const rm = f.rm;
        v1.show(lt, 0.1, rm);
        v2.show(lt, T.v2, rm);
        // the gang pumps on twos; the knuckles crack at 2.0
        gang.forEach(({ a, x }, i) => {
          const p = pop(lt, 0.2 + i * 0.18);
          const sq = env(lt, 2.0 + i * 0.12, 2.5 + i * 0.12, 0.05, 0.2);
          a?.pose(lt, x, 470 - (1 - p) * 60, { flip: i === 0, sx: 1 + sq * 0.06, sy: (rm ? 1 : p) * (1 - sq * 0.05) });
        });
        belts.alpha = pop(lt, 0.5);
        reveal(name, lt, 0.7, Infinity, rm, 0.82);
        reveal(crac, lt, 2.0, 3.6, rm);
        // V2: the thug, the punch, the letters erupt and LAND solid on the deck
        const [jx, jy] = jolt(lt, T.punch, 14, rm);
        thug?.pose(lt, 300 + jx, 330 + jy, { flip: true, rot: lt > T.punch && lt < T.punch + 0.4 ? -0.12 : 0 });
        if (lt >= T.punch && lt < T.punch + 0.4) thug?.emote('hurt', 1);
        hit.visible = lt >= T.punch && lt < T.punch + 0.35;
        hit.scale.set(rm ? 1 : 0.6 + seg(lt, T.punch, T.punch + 0.2) * 0.7);
        const kp = seg(lt, T.punch + 0.05, T.punch + 0.6);
        krak.visible = lt >= T.punch + 0.05;
        if (krak.visible) {
          // up out of the hit, then down onto the deck with a squash
          const yUp = -260 - 120 * Math.sin(Math.min(1, kp * 1.6) * Math.PI);
          const land = kp >= 1 ? 1 : 0;
          const sq = land ? Math.max(0, 1 - (lt - T.punch - 0.6) / 0.25) : 0;
          krak.position.set(rm ? 20 : 260 - kp * 240, rm ? 60 : kp < 1 ? yUp + kp * 330 : 70);
          krak.scale.set(rm ? 1 : (0.4 + 0.6 * outBack(Math.min(1, kp * 1.4), 1.6)) * (1 + sq * 0.12), rm ? 1 : (0.4 + 0.6 * outBack(Math.min(1, kp * 1.4), 1.6)) * (1 - sq * 0.12));
          krak.smoke(lt, seg(lt, T.punch + 0.6, T.punch + 1.2));
          krak.crack(seg(lt, T.ping, T.ping + 0.2) * 0.6);
        }
        // the real flight: drawn while it flies, stops at the K, then bounces back up
        const tg = trail.clear();
        const fly = seg(lt, T.shot, T.ping);
        const flyT = fly * hitAt;
        ball.visible = lt >= T.shot && lt < T.ping + 0.9;
        if (lt >= T.shot) {
          const n = Math.max(2, Math.floor(pts.length * flyT));
          for (let i = 1; i < n; i += 2) tg.moveTo(pts[i - 1][0], pts[i - 1][1]).lineTo(pts[i][0], pts[i][1]);
          tg.stroke({ width: 5, color: PAPER, alpha: 0.85 });
          if (lt < T.ping) {
            const p = along(pts, flyT);
            ball.position.set(p.x, p.y);
          } else {
            const p = along(pts, hitAt);
            const b = seg(lt, T.ping, T.ping + 0.8);
            ball.position.set(p.x - b * 280, p.y - Math.sin(b * Math.PI) * 220 - b * 60);
            ball.rotation = b * 8;
          }
        }
        const pp = along(pts, hitAt);
        ping.position.set(pp.x, pp.y);
        ping.visible = lt >= T.ping && lt < T.ping + 0.3;
        pingT.position.set(pp.x - 40, pp.y - 120);
        reveal(pingT, lt, T.ping, T.ping + 1.4, rm);
        reveal(c3, lt, T.cap, Infinity, rm);
      },
    };
  },
};
const pop = (lt: number, t0: number) => (lt < t0 ? 0 : outBack(seg(lt, t0, t0 + 0.3), 2));

// ------------------------------------------------------------------ 4 · Luzterna straightens the signal's ears
/** when the Bitácora slaps on (scene-local) */
export const BIT_AT = 5.15;
export const luz: SetModule = {
  cats: [SLUG.luz],
  build(ctx: SceneCtx): FilmSet {
    const k = ctx.k;
    ctx.plane(pageBack(ctx), { z: 1000, bake: 'static' });
    const page = new Container();
    const v = new Panel({ x: 70, y: 50, w: 1780, h: 980, bg: 0x2a1450 });
    const sky = new Graphics();
    bandSky(sky, -890, -490, 1780, 980, [0x140a30, 0x1e1048, 0x2a1450, 0x4a1f6e, 0x8a2a7e]);
    v.content.addChild(sky);
    v.content.addChild(dotsFill(ctx.tex('ar:dots'), 1780, 980, { tint: CMY.cyan, scale: 0.5, alpha: 0.12, x: -890, y: -490 }));
    const cl = new Graphics();
    clouds(cl, -700, -330, 1500, 12, 0x5a3a8e);
    v.content.addChild(cl);
    const sig = new Graphics();
    v.content.addChild(sig);
    // the rooftop
    const roof = new Graphics();
    roof.rect(-890, 300, 1780, 200).fill(0x1a0b2e).stroke({ width: 8, color: INK });
    roof.rect(-890, 280, 1780, 30).fill(0x2a1450).stroke({ width: 6, color: INK });
    roof.rect(-600, 160, 120, 130).fill(0x2a1450).stroke({ width: 6, color: INK });
    for (let i = 0; i < 6; i++) roof.rect(560 + i * 50, 200 + (i % 2) * 20, 30, 90).fill(0x221040).stroke({ width: 4, color: INK });
    v.content.addChild(roof);
    const rig = luzOf(ctx, 700);
    const beam = new Beam(ctx);
    if (rig.actor) v.content.addChild(rig.actor);
    v.content.addChild(beam);
    const lamp = glow(ctx, LANTERN, 160, 0.8);
    v.content.addChild(lamp);
    const ah = balloon(k, '…ahí.', { size: 44, tail: [-60, 90] });
    ah.position.set(-60, -160);
    v.over.addChild(ah);
    page.addChild(v);
    ctx.plane(page, { z: 999 });
    // LO QUE ARRIESGAMOS: the Bitácora slaps onto the page (a screen plane: the camera doesn't touch it)
    const bit = new Bitacora(ctx, 'Que se enfríe el rastro. Y que nos confundan con villanos.', { enter: 'slap', tilt: -0.025, w: 1400, size: 60, top: 560 });
    ctx.plane(bit, { z: 0, screen: true });
    return {
      update(lt, f) {
        const rm = f.rm;
        bit.update(lt - BIT_AT, rm);
        v.show(lt, 0, rm, 'fade');
        rig.actor?.pose(lt, -260, 330 + bob(lt, rm), { rot: -0.04 + seg(lt, 1.2, 2.2) * 0.07 - seg(lt, 3.0, 3.4) * 0.03 });
        // she tilts the lantern: the beam's end swings and the projected ears straighten
        const fix = sm(seg(lt, 1.2, 2.6));
        const la = lanternAt(rig);
        const sx = 420 - 60 * (1 - fix);
        const sy = -290 + 20 * (1 - fix);
        beam.set(la, [sx, sy], 120, 0.55);
        lamp.position.set(la[0], la[1]);
        lamp.alpha = 0.7 + (f.rf ? 0 : 0.08 * Math.sin(lt * 5));
        const g = sig.clear();
        catSignal(g, sx, sy, 130, 0.25 + fix * 0.75);
        if (lt > 2.7 && lt < 2.8) rig.actor?.emote('happy', 1);
        reveal(ah, lt, 2.7, 4.6, rm);
      },
      anchor: (name) => (name === 'subtitle' ? [960, 980] : null),
    };
  },
};
