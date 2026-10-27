/**
 * F22 · PP «La corrección» (H87) — a TECHNICAL DRAWING, white on white: the Correctors present themselves as a design
 * without a single stain — the dock in plan with dimensions, the fleet of twelve identical ships in plan and elevation
 * with their symmetry axis (and the real range of a shot, from the battle simulator, drawn as a dimension), the dossier
 * with its grey stamp («una farera muerta que habla y su tripulación · ERRORES: 6»), the rule CORRECCIÓN (a module goes
 * white and loses its icon; a cone of blue light touches it and its colour comes back — the first colour of the plan).
 * Then the real bow: she takes the helm with her beam; Canelo (his flame at 60 %) sits down and lets her drive. Her
 * hand stains the white: LO QUE ARRIESGAMOS, and below, big: «Esta batalla la mando YO.»
 * Guion: historia-v2/guiones/acto-3/h87-no-wey.md (F22-1…F22-7).
 */
import { Container, Graphics, TilingSprite, type TextStyleOptions } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { Sketch, type Stroke, circlePts, rectPts } from '../../../styles/davinci';
import { Beam, Bitacora, demoShot, env, fitField, flame, FLAME, glowSprite, kitTex, lanternAt, LB, luzOf, bob, partial, Printed, seg, sm, springIn, tailTip, word, rnd, prewarm } from '../kit';
import { RIESGO } from '../textos';

const TC = { line: 0x8a929e, dim: 0xa6aeba, text: 0x5e6672, white: 0xf6f7f8, faint: 0xc4cad2 } as const;
const tech = (size: number, o: Partial<TextStyleOptions> = {}): TextStyleOptions => ({ fontFamily: 'Space Grotesk', fontWeight: '600', fontSize: size, fill: TC.text, letterSpacing: size * 0.18, ...o });

function grid(ctx: SceneCtx): Container {
  const c = new Container();
  const t = ctx.tex('tc:grid');
  if (t) {
    const ts = new TilingSprite({ texture: t, width: 2800, height: 1800 });
    ts.position.set(-440, -360);
    c.addChild(ts);
  } else c.addChild(new Graphics().rect(-440, -360, 2800, 1800).fill(TC.white));
  return c;
}
/** a dimension line with arrows, extension ticks and its number */
function dimStrokes(x0: number, y0: number, x1: number, y1: number, off = 0): Stroke[] {
  const a = Math.atan2(y1 - y0, x1 - x0);
  const nx = -Math.sin(a) * off;
  const ny = Math.cos(a) * off;
  const A: [number, number] = [x0 + nx, y0 + ny];
  const B: [number, number] = [x1 + nx, y1 + ny];
  const h = 14;
  const arrow = (P: [number, number], dir: number): [number, number][] => [
    [P[0] + Math.cos(a + dir * 2.7) * h, P[1] + Math.sin(a + dir * 2.7) * h],
    P,
    [P[0] + Math.cos(a - dir * 2.7) * h, P[1] + Math.sin(a - dir * 2.7) * h],
  ];
  return [
    { pts: [[x0, y0], [A[0] + nx * 0.2, A[1] + ny * 0.2]], width: 1.4, color: TC.dim },
    { pts: [[x1, y1], [B[0] + nx * 0.2, B[1] + ny * 0.2]], width: 1.4, color: TC.dim },
    { pts: [A, B], width: 1.6, color: TC.dim },
    { pts: arrow(A, -1), width: 1.6, color: TC.dim },
    { pts: arrow(B, 1), width: 1.6, color: TC.dim },
  ];
}
/** a ship in plan view (top) */
function shipPlan(cx: number, cy: number, s: number): Stroke[] {
  const L = 150 * s;
  const W = 46 * s;
  const hull: [number, number][] = [
    [cx - L, cy],
    [cx - L * 0.7, cy - W],
    [cx + L * 0.6, cy - W],
    [cx + L, cy],
    [cx + L * 0.6, cy + W],
    [cx - L * 0.7, cy + W],
    [cx - L, cy],
  ];
  return [{ pts: hull, width: 2, color: TC.line }, { pts: circlePts(cx - L * 0.1, cy, W * 0.45, 24), width: 1.6, color: TC.line }, { pts: [[cx - L * 0.95, cy], [cx + L * 0.95, cy]], width: 1, color: TC.faint }];
}
/** a ship in elevation (side) */
function shipSide(x: number, y: number, s: number): Stroke[] {
  const L = 300 * s;
  return [
    { pts: [[x, y], [x + L, y], [x + L - 40 * s, y + 70 * s], [x + 40 * s, y + 70 * s], [x, y]], width: 2.2, color: TC.line },
    { pts: [[x + L * 0.45, y], [x + L * 0.45, y - 230 * s]], width: 2, color: TC.line },
    { pts: [[x + L * 0.45, y - 220 * s], [x + L * 0.82, y - 60 * s], [x + L * 0.45, y - 40 * s]], width: 1.8, color: TC.line },
    ...[0.2, 0.32, 0.68, 0.8].map((u): Stroke => ({ pts: circlePts(x + L * u, y + 30 * s, 9 * s, 16), width: 1.4, color: TC.line })),
  ];
}

const mod: SetModule = {
  cats: ({ canelo, scene }) => (scene === 'proa' || scene === 'canelo' ? [{ slug: canelo, bake: 'libros' }, { slug: 'luzterna', bake: 'libros' }] : []),
  async build(ctx: SceneCtx): Promise<FilmSet> {
    switch (ctx.scene.id) {
      case 'plano':
        return plano(ctx);
      case 'flota':
        return flota(ctx);
      case 'expediente':
        return expediente(ctx);
      case 'regla':
        return regla(ctx);
      case 'proa':
      case 'canelo':
        return proa(ctx, ctx.scene.id === 'canelo');
      default:
        return riesgo(ctx);
    }
  },
};
export default mod;

/** F22-1: the dock in plan, drawn with a ruler; the title block */
function plano(ctx: SceneCtx): FilmSet {
  ctx.plane(grid(ctx), { z: 1000, bake: 'static' });
  const strokes: Stroke[] = [];
  // the piers (long rectangles), bollards, the water line
  for (let i = 0; i < 4; i++) strokes.push({ pts: rectPts(300 + i * 360, 380, 120, 520), width: 2.4, color: TC.line });
  strokes.push({ pts: [[160, 300], [1760, 300]], width: 2.6, color: TC.line });
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) strokes.push({ pts: circlePts(330 + i * 360 + (j % 2) * 60, 430 + j * 120, 9, 14), width: 1.6, color: TC.line });
  strokes.push(...dimStrokes(300, 900, 420, 900, 40), ...dimStrokes(300, 380, 300, 900, -50), ...dimStrokes(420, 900, 660, 900, 40));
  // a symmetry axis (dash-dot)
  for (let x = 160; x < 1760; x += 60) strokes.push({ pts: [[x, 640], [x + 30, 640]], width: 1, color: TC.faint }, { pts: [[x + 42, 640], [x + 46, 640]], width: 1, color: TC.faint });
  const sk = new Sketch(strokes, TC.line);
  const nums = new Container();
  for (const [x, y, t] of [
    [360, 960, '1 200'],
    [210, 640, '5 200'],
    [540, 960, '2 400'],
  ] as const) {
    const s = word(ctx.k, t, tech(20, { letterSpacing: 2 }));
    s.position.set(x, y);
    nums.addChild(s);
  }
  // the ruler sliding along as the lines are drawn
  const ruler = new Graphics();
  ruler.rect(-600, -18, 1200, 36).fill({ color: 0xffffff, alpha: 0.85 }).stroke({ width: 2, color: TC.dim });
  for (let i = 0; i <= 60; i++) ruler.rect(-600 + i * 20, -18, 1.5, i % 5 ? 10 : 18).fill(TC.dim);
  // the title block
  const block = new Container();
  const bg = new Graphics().rect(0, 0, 760, 150).fill(TC.white).stroke({ width: 2.5, color: TC.line }).moveTo(0, 96).lineTo(760, 96).stroke({ width: 1.5, color: TC.line }).moveTo(560, 96).lineTo(560, 150).stroke({ width: 1.5, color: TC.line });
  const bt = word(ctx.k, 'EL MUELLE DE LIBROS', tech(40), 0);
  bt.anchor.set(0, 0.5);
  bt.position.set(26, 50);
  const b2 = word(ctx.k, 'PLANO 1:100', tech(22), 0);
  b2.anchor.set(0, 0.5);
  b2.position.set(26, 123);
  const b3 = word(ctx.k, 'HOJA 1/1', tech(18), 0);
  b3.anchor.set(0, 0.5);
  b3.position.set(580, 123);
  block.addChild(bg, bt, b2, b3);
  block.position.set(1060, 860);
  const live = new Container();
  live.addChild(sk, nums, ruler, block);
  ctx.plane(live, { z: 1000 });
  prewarm(ctx, live);
  return {
    update(lt, f) {
      const p = seg(lt, 0.2, 4.0);
      sk.draw(p, f.step12);
      nums.alpha = sm(seg(lt, 3.0, 3.8));
      ruler.visible = p > 0 && p < 1;
      ruler.position.set(960, 300 + p * 620);
      block.alpha = sm(seg(lt, 0.8, 1.6));
    },
  };
}

/** F22-2: twelve identical ships in plan and in elevation, numbered; the real range of a shot as a dimension */
async function flota(ctx: SceneCtx): Promise<FilmSet> {
  const demo = await demoShot();
  ctx.plane(grid(ctx), { z: 1000, bake: 'static' });
  const strokes: Stroke[] = [];
  const labels = new Container();
  for (let i = 0; i < 12; i++) {
    const cx = 260 + (i % 6) * 280 + 1500 * 0;
    const cy = i < 6 ? 260 : 470;
    strokes.push(...shipPlan(cx, cy, 0.62));
    const l = word(ctx.k, `C-${String(i + 1).padStart(2, '0')}`, tech(18, { letterSpacing: 3 }));
    l.position.set(cx, cy + 50);
    labels.addChild(l);
  }
  // the symmetry axis between the rows
  for (let x = 120; x < 1820; x += 60) strokes.push({ pts: [[x, 365], [x + 30, 365]], width: 1.2, color: TC.dim }, { pts: [[x + 42, 365], [x + 46, 365]], width: 1.2, color: TC.dim });
  // elevation: one ship, and the range of its cannon — the simulator's own arc, dashed
  strokes.push(...shipSide(220, 860, 0.9));
  const R: [number, number, number, number] = [180, 560, 1560, 440];
  const arc = demo ? fitField(demo.pts, R) : [];
  if (arc.length > 2) {
    for (let i = 0; i < arc.length - 3; i += 6) strokes.push({ pts: arc.slice(i, i + 3), width: 1.8, color: TC.line });
    const e = arc[arc.length - 1];
    strokes.push(...dimStrokes(arc[0][0], 990, e[0], 990, 0));
    const l = word(ctx.k, 'ALCANCE', tech(20, { letterSpacing: 6 }));
    l.position.set((arc[0][0] + e[0]) / 2, 1018);
    labels.addChild(l);
  }
  const sk = new Sketch(strokes, TC.line);
  const live = new Container();
  live.addChild(sk, labels);
  ctx.plane(live, { z: 1000 });
  const t1 = word(ctx.k, 'FLOTA DE CORRECCIÓN · 12 UNIDADES', tech(44));
  t1.position.set(960, 110);
  ctx.plane(t1, { z: 0, screen: true });
  prewarm(ctx, live, t1);
  return {
    update(lt, f) {
      sk.draw(seg(lt, 0.0, 4.6), f.step12);
      labels.alpha = sm(seg(lt, 1.0, 2.0));
      t1.alpha = sm(seg(lt, 0.6, 1.4));
    },
  };
}

/** F22-3: the dossier — typed, then a grey stamp falls: CORREGIR */
function expediente(ctx: SceneCtx): FilmSet {
  const rm = ctx.rm;
  ctx.plane(grid(ctx), { z: 1100, bake: 'static' });
  const folder = new Container();
  const g = new Graphics();
  g.rect(380, 150, 1160, 790).fill(0xeef0f2).stroke({ width: 3, color: TC.line });
  g.rect(380, 120, 340, 40).fill(0xeef0f2).stroke({ width: 3, color: TC.line });
  g.rect(430, 210, 1060, 2).fill(TC.dim);
  folder.addChild(g);
  const head = word(ctx.k, 'EXPEDIENTE', tech(54), 0);
  head.anchor.set(0, 0.5);
  head.position.set(440, 260);
  folder.addChild(head);
  ctx.plane(folder, { z: 1000, bake: 'static' });
  const lines = [
    new Printed(ctx.k, 'typed', 'SUJETOS: una farera muerta que habla y su tripulación', { size: 36, w: 1000, fill: 0x3a3e46 }),
    new Printed(ctx.k, 'typed', 'ERRORES: 6', { size: 40, w: 1000, fill: 0x3a3e46 }),
    new Printed(ctx.k, 'typed', 'ACCIÓN: CORREGIR', { size: 40, w: 1000, fill: 0x3a3e46 }),
  ];
  lines.forEach((l, i) => l.position.set(440, 360 + i * 140 + (i ? 60 : 0)));
  const stamp = new Container();
  const sg = new Graphics().roundRect(-230, -70, 460, 140, 14).stroke({ width: 8, color: TC.line }).roundRect(-214, -54, 428, 108, 8).stroke({ width: 3, color: TC.line });
  const stx = word(ctx.k, 'CORREGIR', tech(64, { fill: TC.line, letterSpacing: 14 }));
  stamp.addChild(sg, stx);
  stamp.position.set(1240, 760);
  stamp.rotation = -0.12;
  const live = new Container();
  live.addChild(...lines, stamp);
  ctx.plane(live, { z: 1000 });
  prewarm(ctx, live);
  return {
    update(lt) {
      lines[0].update(seg(lt, 0.3, 2.4));
      lines[1].update(seg(lt, 2.5, 3.0));
      lines[2].update(seg(lt, 3.2, 3.9));
      const s = seg(lt, 4.0, 4.35);
      stamp.visible = s > 0;
      stamp.alpha = rm ? sm(s) : 1;
      stamp.scale.set(rm ? 1 : 1.8 - 0.8 * sm(s) + (s >= 1 ? 0.04 * Math.exp(-(lt - 4.35) * 9) : 0));
    },
  };
}

/** F22-4: the rule CORRECCIÓN on a ship's modules: every 2 turns one goes white (its icon gone); her light gives the
 * colour back — the first colour in the plan */
function regla(ctx: SceneCtx): FilmSet {
  const rm = ctx.rm;
  ctx.plane(grid(ctx), { z: 1100, bake: 'static' });
  // the ship's section: a hull outline and 6 module cells (cannon, shield, sail, cabin, engine, powder)
  const g = new Graphics();
  g.poly([360, 420, 1560, 420, 1460, 820, 460, 820]).stroke({ width: 3, color: TC.line });
  const cells: { x: number; y: number; col: number; icon: (q: Graphics, x: number, y: number) => void }[] = [];
  const COLS = [0xc8483a, 0x3a6ac8, 0xd8b048, 0x6a9a4a, 0x9a5ac8, 0xd87a3a];
  const icons: ((q: Graphics, x: number, y: number) => void)[] = [
    (q, x, y) => q.rect(x - 40, y - 12, 70, 24).fill(0x2a2a2a).circle(x - 40, y, 22).fill(0x2a2a2a),
    (q, x, y) => q.poly([x, y - 40, x + 34, y - 26, x + 28, y + 20, x, y + 40, x - 28, y + 20, x - 34, y - 26]).fill(0x2a2a2a),
    (q, x, y) => q.poly([x - 6, y - 44, x + 40, y + 30, x - 6, y + 30]).fill(0x2a2a2a).rect(x - 10, y - 44, 6, 84).fill(0x2a2a2a),
    (q, x, y) => q.rect(x - 34, y - 26, 68, 52).fill(0x2a2a2a).rect(x - 20, y - 12, 16, 16).fill(0xffffff),
    (q, x, y) => q.circle(x, y, 32).fill(0x2a2a2a).circle(x, y, 14).fill(0xffffff),
    (q, x, y) => q.roundRect(x - 26, y - 34, 52, 68, 12).fill(0x2a2a2a),
  ];
  for (let i = 0; i < 6; i++) cells.push({ x: 560 + (i % 3) * 400, y: 520 + Math.floor(i / 3) * 200, col: COLS[i], icon: icons[i] });
  const base = new Container();
  base.addChild(g);
  for (const c of cells) {
    const q = new Graphics();
    q.rect(c.x - 150, c.y - 80, 300, 160).stroke({ width: 2.5, color: TC.line });
    base.addChild(q);
  }
  ctx.plane(base, { z: 1000, bake: 'static' });
  // live: the coloured modules (the plan's only colour, at first: grey), the target going white, the cone
  const fill = new Graphics();
  const target = 0;
  const glowT = glowSprite(ctx, LB.lantern, 2.2);
  const cone = new Beam(ctx, LB.lantern);
  const counter = new Container();
  const ct = word(ctx.k, 'TURNO 1', tech(30, { fill: TC.text }));
  const ct2 = word(ctx.k, 'TURNO 2', tech(30, { fill: 0xc8483a }));
  counter.addChild(ct, ct2);
  counter.position.set(960, 360);
  const live = new Container();
  live.addChild(fill, glowT, cone, counter);
  ctx.plane(live, { z: 1000 });
  const sign1 = word(ctx.k, 'REGLA: CORRECCIÓN', tech(52));
  sign1.position.set(960, 110);
  const sign2 = word(ctx.k, 'CADA 2 TURNOS, UN MÓDULO EN BLANCO', tech(34));
  sign2.position.set(960, 180);
  const ui = new Container();
  ui.addChild(sign1, sign2);
  ctx.plane(ui, { z: 0, screen: true });
  prewarm(ctx, live, ui);
  return {
    update(lt) {
      // turn 1 (0.4 → 2.4): all modules drawn grey-toned; turn 2 (2.4): the target flashes white, its icon fades out
      const white = sm(seg(lt, 2.6, 3.2));
      // the light (4.4 → 5.6) sweeps in from the left and touches it; its colour comes back — and only then colour
      const cone1 = env(lt, 4.2, 7.6, 0.5, 0.6);
      const back = sm(seg(lt, 5.0, 6.0));
      const f = fill.clear();
      cells.forEach((c, i) => {
        const isT = i === target;
        const w = isT ? white * (1 - back) : 0;
        // before her light, the plan is grey: the modules are pale greys; the touched one comes back in its colour
        const col = isT && back > 0 ? mix(0xd8dce2, c.col, back) : 0xd8dce2 - (i % 2) * 0x0a0a0a;
        f.rect(c.x - 146, c.y - 76, 292, 152).fill(w > 0 ? mix(col, 0xffffff, w) : col);
        // the icon (its ability) is gone while the module is white
        if (!isT || w < 0.5) c.icon(f, c.x, c.y);
        if (isT && w > 0.5) f.rect(c.x - 150, c.y - 80, 300, 160).stroke({ width: 4, color: 0xffffff });
      });
      glowT.position.set(cells[target].x, cells[target].y);
      glowT.alpha = back * 0.4 + cone1 * 0.25;
      cone.set([120, 260], [cells[target].x, cells[target].y], 150, cone1 * 0.9);
      ct.alpha = env(lt, 0.4, 2.4, 0.3, 0.2);
      ct2.alpha = env(lt, 2.4, 4.4, 0.1, 0.3);
      ct2.scale.set(rm ? 1 : 1 + 0.15 * Math.exp(-(lt - 2.4) * 6) * (lt > 2.4 ? 1 : 0));
      sign1.alpha = sm(seg(lt, 0.2, 0.7));
      sign2.alpha = sm(seg(lt, 0.6, 1.1));
    },
  };
}
function mix(a: number, b: number, k: number) {
  const r = ((a >> 16) & 255) * (1 - k) + ((b >> 16) & 255) * k;
  const g = ((a >> 8) & 255) * (1 - k) + ((b >> 8) & 255) * k;
  const bb = (a & 255) * (1 - k) + (b & 255) * k;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bb);
}

/** F22-5 / F22-6: the real bow — she takes the helm with her beam; Canelo at 60 % sits down and lets her drive */
function proa(ctx: SceneCtx, close: boolean): FilmSet {
  const rm = ctx.rm;
  const bg = new Graphics();
  // the Libros harbour at dusk: a sea of pages, the white fleet far away
  bg.rect(-400, -400, 2720, 900).fill(0xd8c8a4);
  bg.rect(-400, 300, 2720, 260).fill(0xe8dcc0);
  for (let i = 0; i < 12; i++) {
    const x = 200 + i * 140;
    bg.poly([x, 470, x + 90, 470, x + 76, 492, x + 14, 492]).fill(0xf6f6f2).stroke({ width: 2, color: 0xb0b4ba });
    bg.rect(x + 42, 410, 4, 60).fill(0xb0b4ba);
  }
  bg.rect(-400, 500, 2720, 900).fill(0xc8b48c);
  for (let i = 0; i < 16; i++) bg.rect(-400, 520 + i * i * 4, 2720, 2).fill({ color: 0x8a7452, alpha: 0.4 });
  ctx.plane(bg, { z: 1500, bake: 'static' });
  const deck = new Container();
  const dg = new Graphics();
  // the bow: deck planks, the rail, the helm wheel
  dg.poly([-200, 1180, 2120, 1180, 2120, 860, 1400, 760, -200, 820]).fill(0x8a5a32).stroke({ width: 4, color: LB.sepia });
  for (let i = 0; i < 9; i++) dg.moveTo(-200, 860 + i * 40).lineTo(2120, 820 + i * 44).stroke({ width: 2, color: 0x5a3a1a, alpha: 0.6 });
  dg.moveTo(-200, 800).lineTo(1400, 740).lineTo(2120, 840).stroke({ width: 10, color: 0x6a4224 });
  deck.addChild(dg);
  ctx.plane(deck, { z: 1100, bake: 'static' });
  const st = new Container();
  const wheel = new Graphics();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    wheel.moveTo(0, 0).lineTo(Math.cos(a) * 110, Math.sin(a) * 110).stroke({ width: 10, color: 0x6a4224 });
    wheel.circle(Math.cos(a) * 118, Math.sin(a) * 118, 9).fill(0x6a4224);
  }
  wheel.circle(0, 0, 86).stroke({ width: 12, color: 0x8a5a32 }).circle(0, 0, 18).fill(0x6a4224);
  const post = new Graphics().rect(-14, 0, 28, 200).fill(0x6a4224);
  const wheelC = new Container();
  wheelC.addChild(post, wheel);
  wheelC.position.set(close ? 1300 : 1100, close ? 640 : 700);
  const luz = luzOf(ctx, close ? 340 : 300, 'libros');
  const can = ctx.actorAs('libros', ctx.canelo, close ? 300 : 240);
  const beam = new Beam(ctx);
  const fl = new Graphics();
  st.addChild(wheelC);
  if (can) st.addChild(can);
  if (luz.actor) st.addChild(luz.actor);
  st.addChild(beam, fl);
  ctx.plane(st, { z: 1000 });
  prewarm(ctx, st);
  return {
    update(lt) {
      const lx = (close ? 1560 : 1420) + bob(lt, rm);
      const ly = (close ? 560 : 560) + bob(lt + 1, rm, 8);
      luz.actor?.pose(lt, lx, ly, { flip: true });
      // the beam takes the wheel; the wheel turns (the ship turns toward the fleet)
      const take = env(lt, 0.4, 9, 0.4, 0.5);
      const turn = close ? 0.9 + lt * 0.05 : sm(seg(lt, 1.0, 3.6)) * 1.6;
      wheel.rotation = rm ? turn * 0.5 : turn;
      beam.set(lanternAt(luz), [wheelC.x, wheelC.y], 70, take * 0.85);
      // Canelo: in the wide shot he walks up beside her; in the close one he looks at her and sits down
      const cx = close ? 760 : 700 + sm(seg(lt, 0.0, 2.0)) * 120;
      const sit = close ? sm(seg(lt, 2.2, 3.2)) : 0;
      can?.pose(lt, cx, close ? 1020 : 960, { sy: 1 - sit * 0.08 });
      if (can?.puppet) {
        can.puppet.brain.look = close ? (lt < 2.2 ? 0.8 : 0.3) : 0.5;
        can.puppet.brain.crouch = sit * 0.6;
      }
      const tip = tailTip(can);
      fl.clear();
      if (tip) flame(fl, tip[0], tip[1], FLAME.sesenta, lt, { rm, line: 0x6a2a0a, scale: close ? 1.2 : 1 });
    },
  };
}

/** F22-7: the white plan again; the Bitácora rises and her hand stains the white */
function riesgo(ctx: SceneCtx): FilmSet {
  ctx.plane(grid(ctx), { z: 1000, bake: 'static' });
  const strokes: Stroke[] = [];
  for (let i = 0; i < 6; i++) strokes.push(...shipPlan(260 + i * 280, 240, 0.62));
  const sk = new Sketch(strokes, TC.line);
  sk.draw(1, 0);
  ctx.plane(sk, { z: 1000, bake: 'static' });
  // her stains on the white: a few blue blots that bleed out of the page
  const stains = new Graphics();
  for (let i = 0; i < 7; i++) stains.circle(300 + rnd(i) * 1300, 160 + rnd(i + 3) * 260, 20 + rnd(i + 9) * 50).fill({ color: LB.pen, alpha: 0.16 });
  ctx.plane(stains, { z: 999 });
  const bit = new Bitacora(ctx, RIESGO.f22, { size: 44, big: RIESGO.f22big });
  ctx.plane(bit, { z: 0, screen: true });
  prewarm(ctx, stains, bit);
  void kitTex;
  void partial;
  void springIn;
  return {
    update(lt) {
      stains.alpha = sm(seg(lt, 0.6, 2.4));
      stains.scale.set(1 + sm(seg(lt, 0.6, 3)) * 0.06);
      bit.update(lt - 0.2, ctx.rm);
    },
  };
}
