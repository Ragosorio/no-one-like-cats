/**
 * F20 · PP «El índice» (H85) — GERMAN EXPRESSIONISM: shadows painted on the walls, a corridor in impossible perspective
 * that narrows to a tiny door, shelves that lean, letters painted by hand, green and sepia. The book's pages lean toward
 * the gutter. The rule (LA BIBLIOTECA SE DERRUMBA · AGUANTEN 4 TURNOS) shown with the simulator's falling objects on a
 * ship (battle/demo.ts «botellas»: the same physics as the debris) and a painted tally. Then the real dark corridor:
 * Canelo's flame flickers like a candle in a draught and she puts her beam over it. The Bitácora.
 * Guion: historia-v2/guiones/acto-3/h85-la-ficha-original.md (F20-1…F20-6).
 */
import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { Beam, Bitacora, BookFrame, demoFalls, env, fitField, flame, FLAME, jagged, lanternAt, LB, luzOf, bob, partial, Printed, rnd, seg, sm, springIn, tailTip, word, wob, glowSprite, inkLine, prewarm } from '../kit';
import { RIESGO } from '../textos';

const EX = { ink: 0x0c0e08, wall: 0x6a6a48, wallL: 0xb8b48a, light: 0xe8e2b8, floor: 0x4a4430, green: 0x5a6a3a } as const;

/** painted streaks over a polygon (the walls of Caligari) */
function paintedPoly(ctx: SceneCtx, pts: number[], color: number, alpha = 0.35): Container {
  const c = new Container();
  const g = new Graphics().poly(pts).fill(color);
  c.addChild(g);
  const t = ctx.tex('ex:streaks');
  if (t) {
    const xs = pts.filter((_, i) => i % 2 === 0);
    const ys = pts.filter((_, i) => i % 2 === 1);
    const x0 = Math.min(...xs);
    const y0 = Math.min(...ys);
    const ts = new TilingSprite({ texture: t, width: Math.max(...xs) - x0, height: Math.max(...ys) - y0 });
    ts.position.set(x0, y0);
    ts.alpha = alpha;
    ts.blendMode = 'multiply';
    const m = new Graphics().poly(pts).fill(0xffffff);
    ts.mask = m;
    c.addChild(ts, m);
  }
  return c;
}

/** the corridor: walls converge to a tiny door off-centre; painted shadows and painted light on the floor */
function corridor(ctx: SceneCtx, o: { door?: [number, number]; shelves?: boolean } = {}): Container {
  const c = new Container();
  const [dx, dy] = o.door ?? [1090, 470];
  c.addChild(paintedPoly(ctx, [-300, -300, 2220, -300, 2220, 1380, -300, 1380], EX.ink, 0.2));
  // ceiling, left wall, right wall, floor (the vanishing point is the door)
  c.addChild(paintedPoly(ctx, [-300, -300, 2220, -300, dx + 60, dy - 120, dx - 40, dy - 110], 0x2a2a1c, 0.4));
  c.addChild(paintedPoly(ctx, [-300, -300, dx - 40, dy - 110, dx - 46, dy + 70, -300, 1380], EX.wall, 0.45));
  c.addChild(paintedPoly(ctx, [2220, -300, dx + 60, dy - 120, dx + 54, dy + 80, 2220, 1380], 0x5a5a3a, 0.45));
  c.addChild(paintedPoly(ctx, [-300, 1380, dx - 46, dy + 70, dx + 54, dy + 80, 2220, 1380], EX.floor, 0.5));
  const g = new Graphics();
  // painted light: a jagged pale wedge on the floor and a crooked window of light on the left wall
  g.poly([300, 1380, dx - 30, dy + 74, dx + 20, dy + 78, 1100, 1380]).fill({ color: EX.light, alpha: 0.32 });
  g.poly([120, 160, 420, 260, 400, 560, 90, 520]).fill({ color: EX.light, alpha: 0.5 });
  // painted shadows: long black zig-zags on the walls (they don't belong to anything)
  g.poly([-300, 700, 300, 520, 380, 600, 150, 760, 420, 820, -300, 1100]).fill({ color: EX.ink, alpha: 0.75 });
  g.poly([2220, 300, 1500, 420, 1460, 380, 1300, 470, 1420, 520, 2220, 700]).fill({ color: EX.ink, alpha: 0.7 });
  // the tiny door, lit
  g.poly([dx - 30, dy + 72, dx - 34, dy - 40, dx + 40, dy - 50, dx + 44, dy + 76]).fill(EX.light);
  g.poly([dx - 30, dy + 72, dx - 34, dy - 40, dx + 40, dy - 50, dx + 44, dy + 76]).stroke({ width: 4, color: EX.ink });
  // leaning shelves along the walls (they converge too)
  if (o.shelves !== false) {
    for (let i = 0; i < 6; i++) {
      const k = i / 6;
      const lx = -200 + k * (dx - 140);
      const ly0 = -100 + k * (dy - 110 + 100);
      const ly1 = 1300 - k * (1300 - dy - 70);
      const w = 180 * (1 - k * 0.85);
      g.poly([lx, ly0, lx + w, ly0 + w * 0.3, lx + w * 0.9, ly1 - w * 0.2, lx - 20, ly1]).fill({ color: 0x3a3424, alpha: 0.9 }).stroke({ width: 3, color: EX.ink });
      for (let r = 1; r < 6; r++) {
        const y = ly0 + (ly1 - ly0) * (r / 6);
        g.moveTo(lx - 10, y).lineTo(lx + w * 0.95, y + w * 0.25).stroke({ width: 3, color: EX.ink });
      }
      const rx = 2120 - k * (2120 - dx - 160);
      g.poly([rx, ly0 - 40, rx - w, ly0 + w * 0.2, rx - w * 0.9, ly1 - w * 0.3, rx + 30, ly1]).fill({ color: 0x3a3424, alpha: 0.9 }).stroke({ width: 3, color: EX.ink });
      for (let r = 1; r < 6; r++) {
        const y = ly0 - 40 + (ly1 - ly0 + 40) * (r / 6);
        g.moveTo(rx + 20, y).lineTo(rx - w * 0.95, y + w * 0.18).stroke({ width: 3, color: EX.ink });
      }
    }
  }
  c.addChild(g);
  return c;
}

const mod: SetModule = {
  cats: ({ canelo, scene }) => (scene === 'canelo' ? [{ slug: canelo, bake: 'libros' }, { slug: 'luzterna', bake: 'libros' }] : []),
  async build(ctx: SceneCtx): Promise<FilmSet> {
    switch (ctx.scene.id) {
      case 'pasillo':
        return pasillo(ctx);
      case 'fichero':
        return fichero(ctx);
      case 'ficha':
        return ficha(ctx);
      case 'derrumbe':
        return derrumbe(ctx);
      default:
        return canelo(ctx);
    }
  },
};
export default mod;

function frame(ctx: SceneCtx, tilt: number): { book: BookFrame; set: (lt: number) => void } {
  const book = new BookFrame(ctx, { head: 'Ex Libris', title: 'El índice', folio: 212 });
  ctx.plane(book, { z: 0, screen: true });
  return {
    book,
    set: (lt) => book.set({ tilt: ctx.rm ? 0 : tilt * (0.7 + 0.3 * Math.sin(lt * 0.9)), gutter: 0.6, lift: ctx.rm ? 0 : 6 * Math.sin(lt * 0.7) }),
  };
}

/** F20-1: the corridor stretches to a tiny door; EL ÍNDICE painted, jagged */
function pasillo(ctx: SceneCtx): FilmSet {
  ctx.plane(corridor(ctx), { z: 1000, bake: 'static' });
  const t = jagged(ctx.k, 'EL ÍNDICE', { size: 150, seed: 5 });
  t.position.set(820, 300);
  ctx.plane(t, { z: 900 });
  const fr = frame(ctx, 0.035);
  prewarm(ctx, t);
  return {
    update(lt) {
      t.alpha = sm(seg(lt, 0.6, 1.2));
      t.scale.set(ctx.rm ? 1 : 0.9 + 0.1 * springIn(seg(lt, 0.6, 1.5)));
      fr.set(lt);
    },
  };
}

/** F20-2: a cabinet of a thousand drawers; one opens by itself; inside, a card with a torn edge */
function fichero(ctx: SceneCtx): FilmSet {
  const bg = corridor(ctx, { door: [1500, 430], shelves: false });
  ctx.plane(bg, { z: 1400, bake: 'static' });
  const cab = new Container();
  const g = new Graphics();
  // a leaning cabinet: a trapezoid of drawers (the perspective lies)
  g.poly([360, 140, 1500, 60, 1560, 1020, 300, 1000]).fill(0x4a4228).stroke({ width: 8, color: EX.ink });
  const rows = 9;
  const cols = 12;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const u0 = c / cols;
      const u1 = (c + 1) / cols;
      const v0 = r / rows;
      const v1 = (r + 1) / rows;
      const P = (u: number, v: number): [number, number] => [360 + (1500 - 360) * u + (300 - 360 + (1560 - 1500 - 300 + 360) * u) * v, 140 + (60 - 140) * u + (1000 - 140 + (1020 - 60 - 1000 + 140) * u) * v];
      const a = P(u0 + 0.01, v0 + 0.012);
      const b = P(u1 - 0.01, v0 + 0.012);
      const cc = P(u1 - 0.01, v1 - 0.012);
      const d = P(u0 + 0.01, v1 - 0.012);
      g.poly([...a, ...b, ...cc, ...d]).fill(r % 2 ? 0x5a5236 : 0x625a3c).stroke({ width: 2, color: EX.ink });
      const m = P((u0 + u1) / 2, (v0 + v1) / 2);
      g.rect(m[0] - 8, m[1] - 3, 16, 6).fill(EX.wallL);
    }
  cab.addChild(g);
  ctx.plane(cab, { z: 1000, bake: 'static' });
  // the drawer that opens (row 5, col 7) and its card
  const drawer = new Container();
  const dg = new Graphics();
  dg.poly([-60, -26, 60, -30, 70, 30, -66, 34]).fill(0x7a6e48).stroke({ width: 4, color: EX.ink });
  dg.poly([-60, -26, 60, -30, 54, -60, -54, -56]).fill(0x2a2618);
  const card = new Graphics();
  card.poly([-44, -40, 40, -44, 42, 6, 20, 0, 10, 8, -6, 2, -20, 10, -44, 4]).fill(EX.light).stroke({ width: 3, color: EX.ink });
  card.position.set(0, -30);
  drawer.addChild(card, dg);
  drawer.position.set(1020, 640);
  const glow = glowSprite(ctx, 0xe8e2b8, 1.4);
  glow.position.set(1020, 600);
  const live = new Container();
  live.addChild(glow, drawer);
  ctx.plane(live, { z: 990 });
  const cap = jagged(ctx.k, 'AQUÍ ESTÁ LA PRIMERA FICHA DE CERITO', { size: 62, seed: 9 });
  cap.position.set(960, 905);
  ctx.plane(cap, { z: 0, screen: true });
  const fr = frame(ctx, 0.03);
  prewarm(ctx, live, cap);
  return {
    update(lt) {
      const op = springIn(seg(lt, 0.8, 2.0), 1.6, 5);
      drawer.scale.set(1 + op * 0.55);
      drawer.y = 640 + op * 60;
      card.y = -30 - sm(seg(lt, 1.4, 2.4)) * 50;
      glow.alpha = sm(seg(lt, 1.2, 2.2)) * 0.6;
      cap.alpha = sm(seg(lt, 1.6, 2.2));
      fr.set(lt);
    },
  };
}

/** F20-3: the card, out of focus — nothing can be read yet */
function ficha(ctx: SceneCtx): FilmSet {
  const bg = new Graphics().rect(-200, -200, 2320, 1480).fill(0x2a2618);
  ctx.plane(bg, { z: 1600, bake: 'static' });
  const card = new Container();
  const g = new Graphics();
  g.poly([520, 260, 1420, 220, 1440, 820, 1180, 790, 1080, 830, 940, 800, 760, 850, 540, 810]).fill(EX.light).stroke({ width: 6, color: EX.ink });
  for (let i = 0; i < 6; i++) g.rect(600, 380 + i * 64, 700 - (i % 3) * 120, 10).fill({ color: 0x3a3424, alpha: 0.7 });
  g.rect(600, 300, 360, 34).fill({ color: 0x3a3424, alpha: 0.85 });
  card.addChild(g);
  // the card is a 'dof' plane: the lens is focused far behind it (blurred)
  ctx.plane(card, { z: 1000, bake: 'dof', blur: 18, dof: 300 });
  const cap = jagged(ctx.k, 'PUEDE DECIR QUIÉN LO ESCRIBIÓ', { size: 66, seed: 13 });
  cap.position.set(960, 900);
  ctx.plane(cap, { z: 0, screen: true });
  const fr = frame(ctx, 0.04);
  return {
    update(lt) {
      cap.alpha = sm(seg(lt, 0.5, 1.1));
      fr.set(lt);
    },
  };
}

/** F20-4: the shelves lean and fall — four turns, the simulator's falls on a ship, a painted tally */
async function derrumbe(ctx: SceneCtx): Promise<FilmSet> {
  const rm = ctx.rm;
  const fall = await demoFalls();
  ctx.plane(corridor(ctx, { door: [960, 460] }), { z: 1300, bake: 'static' });
  // two big leaning shelves in front (they creak and one falls)
  const shelves: Container[] = [];
  for (const [x, flip] of [
    [520, 1],
    [1420, -1],
  ] as const) {
    const s = new Container();
    const g = new Graphics();
    g.poly([-90, 0, 90, 0, 80, -620, -80, -600]).fill(0x3a3424).stroke({ width: 6, color: EX.ink });
    for (let r = 1; r < 7; r++) {
      const y = -r * 88;
      g.moveTo(-86, y).lineTo(84, y - 6).stroke({ width: 5, color: EX.ink });
      for (let j = 0; j < 7; j++) g.rect(-76 + j * 22, y - 70, 16, 64).fill([0x6a5a3a, 0x4a4a2a, 0x7a6a42][(j + r) % 3]);
    }
    s.addChild(g);
    s.position.set(x, 980);
    s.scale.x = flip;
    shelves.push(s);
  }
  const st = new Container();
  st.addChild(...shelves);
  // the debris pile of the fallen shelf
  const pile = new Graphics();
  st.addChildAt(pile, 0);
  ctx.plane(st, { z: 1000 });
  // the rule, shown: a ship (the sim's player extents) and the falls, one per turn; a painted tally I · II · III · IIII
  const demo = new Container();
  const R: [number, number, number, number] = [1180, 520, 620, 350];
  const plate = new Graphics().rect(R[0] - 20, R[1] - 20, R[2] + 40, R[3] + 40).fill({ color: EX.light, alpha: 0.85 }).stroke({ width: 6, color: EX.ink });
  demo.addChild(plate);
  const P = fall?.field.player ?? { x0: 200, x1: 600 };
  const wy = fall?.field.waterY ?? 760;
  const [[sx0, sy], [sx1]] = fitField(
    [
      [P.x0, wy],
      [P.x1, wy],
    ],
    R,
  );
  const ship = new Graphics();
  ship.poly([sx0, sy - 6, sx1, sy - 6, sx1 - 18, sy + 22, sx0 + 18, sy + 22]).fill(0x3a3424).stroke({ width: 4, color: EX.ink });
  ship.rect((sx0 + sx1) / 2 - 3, sy - 110, 6, 104).fill(EX.ink);
  ship.poly([(sx0 + sx1) / 2 + 3, sy - 104, (sx0 + sx1) / 2 + 70, sy - 40, (sx0 + sx1) / 2 + 3, sy - 30]).fill(EX.wallL).stroke({ width: 3, color: EX.ink });
  ship.rect(R[0], sy + 22, R[2], 4).fill(EX.ink);
  demo.addChild(ship);
  const fallsG = new Graphics();
  demo.addChild(fallsG);
  const falls = (fall?.falls ?? []).map((p) => fitField(p, R));
  const tally = new Graphics();
  demo.addChild(tally);
  const sign = jagged(ctx.k, 'LA BIBLIOTECA SE DERRUMBA', { size: 70, seed: 21 });
  sign.position.set(820, 170);
  const sign2 = jagged(ctx.k, 'AGUANTEN 4 TURNOS', { size: 84, seed: 23, fill: 0xf0d890 });
  sign2.position.set(820, 270);
  const ui = new Container();
  ui.addChild(demo, sign, sign2);
  ctx.plane(ui, { z: 0, screen: true });
  const fr = frame(ctx, 0.05);
  prewarm(ctx, st, ui);
  const D = ctx.dur;
  return {
    update(lt) {
      // the left shelf creaks (sway) and falls at 2.2 → 3.0; the right one creaks from 4.5
      const creak = (a: number) => (rm ? 0 : Math.sin(lt * 9 + a) * 0.02);
      const f0 = seg(lt, 2.2, 3.0);
      shelves[0].rotation = f0 > 0 ? -(f0 * f0) * 1.35 : creak(0) - 0.05;
      shelves[0].alpha = 1 - sm(seg(lt, 3.0, 3.3));
      shelves[1].rotation = creak(2) + 0.06 + (lt > 4.5 ? 0.05 * sm(seg(lt, 4.5, 6)) : 0);
      const pg = pile.clear();
      if (lt > 2.9) {
        for (let i = 0; i < 26; i++) {
          const x = 260 + rnd(i) * 520;
          const y = 960 - rnd(i + 5) * 130;
          pg.poly([x - 30, y, x + 30, y - 8, x + 34, y + 16, x - 28, y + 22]).fill([0x6a5a3a, 0x4a4a2a, 0x7a6a42][i % 3]).stroke({ width: 3, color: EX.ink });
        }
      }
      // four turns over the scene: each one, a fall onto the ship and a stroke of the tally
      const turnLen = (D - 1.2) / 4;
      const fg = fallsG.clear();
      const tg = tally.clear();
      for (let i = 0; i < 4; i++) {
        const t0 = 0.8 + i * turnLen;
        const path = falls[i % Math.max(1, falls.length)];
        const k = seg(lt, t0, t0 + turnLen * 0.6);
        if (path && k > 0 && k < 1) {
          const pp = partial(path, k);
          const e = pp[pp.length - 1];
          fg.poly([e[0] - 14, e[1] - 10, e[0] + 14, e[1] - 12, e[0] + 12, e[1] + 10, e[0] - 12, e[1] + 12]).fill(0x7a6a42).stroke({ width: 3, color: EX.ink });
        }
        if (path && lt >= t0 + turnLen * 0.6) {
          const e = path[path.length - 1];
          fg.circle(e[0], e[1], 10 * (1 - sm(seg(lt, t0 + turnLen * 0.6, t0 + turnLen)))).fill({ color: EX.ink, alpha: 0.6 });
        }
        if (lt > t0) {
          const x = R[0] + 30 + i * 34;
          const y = R[1] + 26;
          inkLine(tg, partial([[x, y], [x + 8, y + 70]], seg(lt, t0, t0 + 0.25)), { width: 9, color: EX.ink, amp: 1.2, seed: i });
        }
      }
      demo.alpha = sm(seg(lt, 0.4, 0.9));
      sign.alpha = sm(seg(lt, 0.2, 0.7));
      sign2.alpha = sm(seg(lt, 0.6, 1.1));
      fr.set(lt);
    },
  };
}

/** F20-5 + F20-6: the real dark corridor — his flame flickers like a candle in a draught; she warms it with her beam;
 * the Bitácora */
function canelo(ctx: SceneCtx): FilmSet {
  const rm = ctx.rm;
  const bg = new Graphics();
  bg.rect(-300, -300, 2520, 1680).fill(0x141824);
  for (let i = 0; i < 8; i++) bg.rect(-250 + i * 300, -200, 230, 1000).fill({ color: 0x232a3a, alpha: 0.9 });
  bg.rect(-300, 820, 2520, 600).fill(0x1c2230);
  ctx.plane(bg, { z: 1300, bake: 'static' });
  const st = new Container();
  const can = ctx.actorAs('libros', ctx.canelo, 250);
  const luz = luzOf(ctx, 290, 'libros');
  const beam = new Beam(ctx);
  const fl = new Graphics();
  const halo = glowSprite(ctx, 0xffa040, 1.2);
  if (can) st.addChild(can);
  if (luz.actor) st.addChild(luz.actor);
  st.addChild(halo, beam, fl);
  ctx.plane(st, { z: 1000 });
  const bit = new Bitacora(ctx, RIESGO.f20, { size: 46 });
  ctx.plane(bit, { z: 0, screen: true });
  prewarm(ctx, st, bit);
  return {
    update(lt) {
      can?.pose(lt, 820, 900, {});
      const lx = 1260 + bob(lt, rm);
      const ly = 700 + bob(lt + 1, rm, 8);
      luz.actor?.pose(lt, lx, ly, { flip: true });
      const tip = tailTip(can) ?? [740, 800];
      const warm = sm(seg(lt, 1.6, 2.6));
      // a candle in a draught: it bends and shrinks; under her beam it steadies a little
      const draft = 1 - warm * 0.65;
      fl.clear();
      flame(fl, tip[0], tip[1], FLAME.baja * (0.8 + 0.2 * warm), lt, { rm, draft, line: 0x6a2a0a });
      halo.position.set(tip[0], tip[1] - 20);
      halo.alpha = (0.3 + 0.2 * warm) * (rm ? 1 : 0.8 + 0.2 * wob(lt * 9, 2));
      beam.set(lanternAt(luz), [tip[0], tip[1] - 10], 70, warm * 0.85);
      bit.update(lt - 4.1, rm);
    },
  };
}
