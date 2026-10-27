/**
 * F24 · PP «Señal pirata» (H88) — THE HACKED BRIEFING: it starts as a normal Library briefing (capital, watercolour, the
 * forbidden section) and at 6 s a pirate TV signal takes the page — colour bars, scanlines, Esquirla's face (broken
 * visor, glitch arm) and her text slipping out of its lines: «ESTA SEÑAL ES DE LOS DISRUPTORES. NINGUNA CAJA ES HOGAR.
 * LA LLAVE ES NUESTRA.»; Cerito far away in a cube of glitch she holds; her rule ESQUIRLAS (the simulator's real shot,
 * mirrored onto YOUR ship, leaves cyan and magenta shards stuck in the hull; next turn they go off). Then HER pencil
 * scratches over the glitch until the page comes back, and she writes LO QUE ARRIESGAMOS, still angry.
 * Reduce flashes: no blinking — the glitch slides as a slow sweep. Guion: h88-la-ruptura.md (F24-1…F24-6).
 */
import { Container, Graphics, Sprite, TilingSprite, type Texture } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { Bitacora, BookFrame, demoShot, env, esquirlaFigure, fitField, glowSprite, kitTex, LB, paperSprite, partial, Printed, rnd, seg, sm, springIn, StaticKitten, STAND, word, inkLine, prewarm } from '../kit';
import { RIESGO } from '../textos';

const CY = 0x58f0ff;
const MG = 0xff3ad0;

/** the pirate signal overlays: scanlines, snow, rolling tear bars (a slow sweep with «Reducir destellos») */
class Signal extends Container {
  private scan: TilingSprite;
  private snow: TilingSprite;
  private bars: Graphics;
  constructor(ctx: SceneCtx) {
    super();
    this.scan = new TilingSprite({ texture: (ctx.tex('pi:scan') ?? kitTex(ctx, 'static')) as Texture, width: 1920, height: 1080 });
    this.snow = new TilingSprite({ texture: (ctx.tex('pi:snow') ?? kitTex(ctx, 'static')) as Texture, width: 1920, height: 1080 });
    this.snow.blendMode = 'add';
    this.bars = new Graphics();
    this.addChild(this.snow, this.bars, this.scan);
  }
  update(lt: number, rf: boolean, noise = 0.12) {
    const st = Math.floor(lt * 12);
    this.snow.tilePosition.set(rf ? lt * 40 : rnd(st) * 512, rf ? lt * 25 : rnd(st + 1) * 512);
    this.snow.alpha = rf ? noise * 0.5 : noise * (0.7 + 0.3 * rnd(st * 3));
    const g = this.bars.clear();
    // tear bars roll down the screen
    for (let i = 0; i < 3; i++) {
      const y = ((lt * (rf ? 60 : 180) + i * 380) % 1300) - 110;
      g.rect(0, y, 1920, 26 + i * 14).fill({ color: 0xffffff, alpha: 0.06 + i * 0.02 });
    }
  }
}

/** a glitched line of text: Rubik Glitch, cyan with a magenta ghost; slices slip on twos (still with rf) */
class GlitchText extends Container {
  private parts: Sprite[] = [];
  private ghost: Sprite;
  constructor(ctx: SceneCtx, text: string, size = 64) {
    super();
    const st = { fontFamily: 'Rubik Glitch', fontSize: size, fill: 0xf4fbff, align: 'center' as const, wordWrap: true, wordWrapWidth: 1500, lineHeight: size * 1.1 };
    this.ghost = word(ctx.k, text, { ...st, fill: MG });
    this.ghost.alpha = 0.7;
    const main = word(ctx.k, text, st);
    this.addChild(this.ghost, main);
    this.parts.push(main);
  }
  update(lt: number, a: number, rf: boolean) {
    this.visible = a > 0.01;
    if (!this.visible) return;
    this.alpha = a;
    const st = Math.floor(lt * 12);
    this.ghost.position.set(rf ? 6 : 6 + (rnd(st) - 0.5) * 18, rf ? 0 : (rnd(st + 4) - 0.5) * 8);
    this.parts[0].x = rf ? 0 : rnd(st * 7) > 0.8 ? (rnd(st * 3) - 0.5) * 30 : 0;
  }
}

const mod: SetModule = {
  cats: ({ scene }) => {
    if (scene === 'senal') return [STAND.esquirla, STAND.cerito];
    return [];
  },
  async build(ctx: SceneCtx): Promise<FilmSet> {
    switch (ctx.scene.id) {
      case 'pagina':
        return pagina(ctx);
      case 'senal':
        return senal(ctx);
      case 'esquirlas':
        return esquirlas(ctx);
      case 'tachon':
        return tachon(ctx);
      default:
        return riesgo(ctx);
    }
  },
};
export default mod;

/** the forbidden section, as a normal Library briefing would begin (F24-1) — then an old TV rises onto the page */
function seccion(ctx: SceneCtx): Container {
  const c = new Container();
  const g = new Graphics();
  g.rect(-300, -300, 2520, 1700).fill(0xb8a078);
  for (let i = 0; i < 9; i++) {
    const x = -260 + i * 280;
    g.rect(x, -100, 240, 900).fill(0x7a5a3a).stroke({ width: 3, color: LB.sepia });
    for (let r = 0; r < 6; r++) for (let j = 0; j < 9; j++) g.rect(x + 12 + j * 25, -80 + r * 140, 18, 110).fill([0x5a2a2a, 0x2a3a4a, 0x4a4a2a][(i + r + j) % 3]);
    // the chains across the forbidden shelves
    for (let r = 0; r < 4; r++) {
      const y = 0 + r * 200;
      for (let k = 0; k < 10; k++) g.ellipse(x + 12 + k * 24, y + Math.sin(k * 0.6) * 10, 12, 7).stroke({ width: 4, color: 0x5a5a62 });
    }
  }
  g.rect(-300, 820, 2520, 600).fill(0x9a8058);
  c.addChild(g);
  return c;
}
function tvSet(): { root: Container; screen: [number, number, number, number] } {
  const root = new Container();
  const g = new Graphics();
  g.roundRect(-380, -300, 760, 560, 40).fill(0x4a3a2a).stroke({ width: 8, color: 0x1a120c });
  g.roundRect(-330, -250, 560, 440, 30).fill(0x101418);
  g.circle(300, -150, 26).fill(0x2a2018).circle(300, -60, 26).fill(0x2a2018);
  for (let i = 0; i < 6; i++) g.rect(270, 30 + i * 22, 60, 8).fill(0x2a2018);
  g.moveTo(-100, -300).lineTo(-230, -470).stroke({ width: 6, color: 0x2a2a2a }).moveTo(60, -300).lineTo(200, -480).stroke({ width: 6, color: 0x2a2a2a });
  g.rect(-300, 260, 60, 40).fill(0x2a2018).rect(240, 260, 60, 40).fill(0x2a2018);
  root.addChild(g);
  return { root, screen: [-330, -250, 560, 440] };
}
function pagina(ctx: SceneCtx): FilmSet {
  const rm = ctx.rm;
  ctx.plane(seccion(ctx), { z: 1100, bake: 'static' });
  const tv = tvSet();
  const scr = new Container();
  const bars = new Sprite(ctx.tex('pi:bars') as Texture);
  bars.position.set(tv.screen[0], tv.screen[1]);
  bars.setSize(tv.screen[2], tv.screen[3]);
  const snow = new TilingSprite({ texture: (ctx.tex('pi:snow') ?? kitTex(ctx, 'static')) as Texture, width: tv.screen[2], height: tv.screen[3] });
  snow.position.set(tv.screen[0], tv.screen[1]);
  scr.addChild(bars, snow);
  tv.root.addChild(scr);
  tv.root.position.set(960, 700);
  const glow = glowSprite(ctx, 0xc8e8ff, 3);
  glow.position.set(910, 680);
  const live = new Container();
  live.addChild(glow, tv.root);
  ctx.plane(live, { z: 1000 });
  // the normal capital that never gets to finish
  const cap = new Container();
  const ini = word(ctx.k, 'E', { fontFamily: 'UnifrakturMaguntia', fontSize: 140, fill: 0x8a2a1a, stroke: { color: 0xf0d080, width: 4 } });
  ini.position.set(-560, 0);
  const rest = word(ctx.k, 'X LIBRIS · LA SECCIÓN PROHIBIDA', { fontFamily: 'Playfair Display', fontWeight: '700', fontSize: 58, fill: 0xf6efe0, letterSpacing: 6, stroke: { color: 0x2a1a0e, width: 5 } }, 0);
  rest.anchor.set(0, 0.5);
  rest.position.set(-500, 8);
  cap.addChild(ini, rest);
  cap.position.set(960, 200);
  const book = new BookFrame(ctx, { head: 'Ex Libris', title: 'La sección prohibida', folio: 301 });
  const ui = new Container();
  ui.addChild(cap, book);
  ctx.plane(ui, { z: 0, screen: true });
  prewarm(ctx, live, ui);
  return {
    update(lt) {
      cap.alpha = env(lt, 0.3, 5.4, 0.5, 0.2);
      // the TV rises onto the page (3.2 → 4.2) and its snow starts (it is not part of this book)
      const up = springIn(seg(lt, 3.2, 4.2));
      tv.root.visible = lt > 3.1;
      tv.root.scale.set(rm ? 1 : Math.max(0.01, up), rm ? 1 : Math.max(0.01, up));
      tv.root.alpha = rm ? sm(seg(lt, 3.2, 4.0)) : 1;
      const st = Math.floor(lt * 12);
      snow.tilePosition.set(ctx.rf ? lt * 30 : rnd(st) * 300, ctx.rf ? 0 : rnd(st + 2) * 300);
      snow.alpha = 0.8 - sm(seg(lt, 4.4, 5.4)) * 0.6;
      glow.alpha = sm(seg(lt, 4.0, 5.0)) * 0.5;
      book.set({ open: 1 });
    },
  };
}

/** F24-2 + F24-3: the signal: Esquirla's face and her message; Cerito in the glitch cube */
function senal(ctx: SceneCtx): FilmSet {
  const rm = ctx.rm;
  const rf = ctx.rf;
  const bg = new Container();
  const bars = new Sprite(ctx.tex('pi:bars') as Texture);
  bars.position.set(-60, -40);
  bars.setSize(2040, 1160);
  bg.addChild(bars, new Graphics().rect(-60, -40, 2040, 1160).fill({ color: 0x05030a, alpha: 0.55 }));
  ctx.plane(bg, { z: 1200, bake: 'static' });
  const st = new Container();
  const esq = esquirlaFigure(ctx, 980);
  esq.root.position.set(760, 1250);
  st.addChild(esq.root);
  // Cerito, far, in a cube of glitch she holds with her arm
  const cube = new Container();
  const cer = new StaticKitten(ctx, 170, STAND.cerito);
  const cg = new Graphics();
  cube.addChild(cer, cg);
  cube.position.set(1430, 560);
  st.addChild(cube);
  ctx.plane(st, { z: 1000 });
  const sig = new Signal(ctx);
  const t1 = new GlitchText(ctx, 'ESTA SEÑAL ES DE LOS DISRUPTORES.', 58);
  const t2 = new GlitchText(ctx, 'NINGUNA CAJA ES HOGAR.', 76);
  const t3 = new GlitchText(ctx, 'LA LLAVE ES NUESTRA.', 76);
  const t4 = new GlitchText(ctx, 'CON LA LLAVE, TODAS LAS CAJAS SE ABREN A LA VEZ', 54);
  t1.position.set(960, 150);
  t2.position.set(960, 150);
  t3.position.set(960, 150);
  t4.position.set(960, 940);
  const ui = new Container();
  ui.addChild(sig, t1, t2, t3, t4);
  ctx.plane(ui, { z: 0, screen: true });
  prewarm(ctx, st, ui);
  return {
    update(lt) {
      sig.update(lt, rf, 0.16);
      // she leans into the camera, talking (on twos), then turns to show what she holds
      const talk = !rm && lt < 6 ? Math.floor(lt * 6) % 2 : 0;
      esq.actor?.pose(lt, 0, 0, { sy: 1 + talk * 0.012, rot: rm ? 0 : Math.sin(lt * 1.3) * 0.02 });
      const show = sm(seg(lt, 6.0, 7.2));
      esq.root.position.set(760 - show * 320, 1250 + show * 60);
      esq.root.scale.set(1 - show * 0.25);
      const hold: [number, number] = [(1430 - esq.root.x) / esq.root.scale.x, (560 - esq.root.y) / esq.root.scale.y];
      esq.reach(rf ? 0 : lt, hold, show);
      cube.visible = show > 0.02;
      cube.alpha = show;
      cer.update(lt, { stare: 0.9 });
      const g = cg.clear();
      const s = 130;
      const j = rf ? 0 : (rnd(Math.floor(lt * 12)) - 0.5) * 8;
      g.rect(-s + j, -s * 2.1, s * 2, s * 2.1).stroke({ width: 6, color: CY }).rect(-s + 30 - j, -s * 2.1 - 30, s * 2, s * 2.1).stroke({ width: 4, color: MG });
      for (const [a, b] of [
        [-s, -s * 2.1],
        [s, -s * 2.1],
        [-s, 0],
        [s, 0],
      ] as const)
        g.moveTo(a + j, b).lineTo(a + 30 - j, b - 30).stroke({ width: 3, color: 0xffffff, alpha: 0.7 });
      t1.update(lt, env(lt, 0.4, 2.2, 0.15, 0.15), rf);
      t2.update(lt, env(lt, 2.3, 4.1, 0.15, 0.15), rf);
      t3.update(lt, env(lt, 4.2, 6.0, 0.15, 0.15), rf);
      t4.update(lt, env(lt, 7.0, 11.0, 0.2, 0.3), rf);
    },
  };
}

/** F24-4: ESQUIRLAS — the simulator's shot (mirrored onto YOUR ship) leaves shards that go off next turn */
async function esquirlas(ctx: SceneCtx): Promise<FilmSet> {
  const rf = ctx.rf;
  const demo = await demoShot();
  const bg = new Graphics().rect(-200, -200, 2320, 1480).fill(0x0a0814);
  for (let i = 0; i < 30; i++) bg.rect(-200, -200 + i * 50, 2320, 2).fill({ color: CY, alpha: 0.05 });
  ctx.plane(bg, { z: 1200, bake: 'static' });
  const R: [number, number, number, number] = [160, 240, 1600, 760];
  // her ship on the left (the simulator's shooter), YOURS on the right: the shot comes at you
  const arc = demo ? fitField(demo.pts, R) : [];
  const wy = demo ? fitField([[0, demo.field.waterY]], R)[0][1] : 820;
  const P = demo ? demo.field.player : { x0: 260, x1: 620 };
  const E = demo ? demo.field.enemy : { x0: 1300, x1: 1660 };
  const sx = (x: number) => fitField([[x, 0]], R)[0][0];
  const field = new Graphics();
  // YOUR ship (on the right now: the shot comes at you) and hers, as wireframe signal drawings
  const ship = (x0: number, x1: number, col: number) => {
    const a = Math.min(x0, x1);
    const b = Math.max(x0, x1);
    field.poly([a, wy - 10, b, wy - 10, b - 30, wy + 50, a + 30, wy + 50]).fill({ color: col, alpha: 0.25 }).stroke({ width: 4, color: col });
    field.rect((a + b) / 2 - 4, wy - 220, 8, 210).fill(col);
    field.poly([(a + b) / 2 + 4, wy - 210, (a + b) / 2 + 120, wy - 80, (a + b) / 2 + 4, wy - 60]).stroke({ width: 3, color: col });
  };
  ship(sx(P.x0), sx(P.x1), MG);
  ship(sx(E.x0), sx(E.x1), 0xf4fbff);
  field.rect(R[0] - 100, wy + 50, R[2] + 200, 4).fill({ color: CY, alpha: 0.6 });
  ctx.plane(field, { z: 1000, bake: 'static' });
  const live = new Graphics();
  ctx.plane(live, { z: 1000 });
  const sig = new Signal(ctx);
  const title = new GlitchText(ctx, 'ESQUIRLAS', 120);
  title.position.set(960, 130);
  const turn1 = word(ctx.k, 'TURNO 1', { fontFamily: 'Rubik Glitch', fontSize: 44, fill: CY });
  const turn2 = word(ctx.k, 'TURNO 2', { fontFamily: 'Rubik Glitch', fontSize: 44, fill: MG });
  turn1.position.set(1580, 960);
  turn2.position.set(1580, 960);
  const cap = new Printed(ctx.k, 'esquirla', 'sus tiros dejan astillas que pegan al turno siguiente', { size: 36, align: 0.5, fill: 0xd8e8f0, w: 1400 });
  cap.position.set(820, 940);
  const ui = new Container();
  ui.addChild(sig, title, turn1, turn2, cap);
  ctx.plane(ui, { z: 0, screen: true });
  const hit = arc.length ? arc[arc.length - 1] : ([1300, wy] as [number, number]);
  prewarm(ctx, live, ui);
  const shards = Array.from({ length: 7 }, (_, i) => ({ x: hit[0] - 90 + rnd(i) * 180, y: wy - 20 + rnd(i + 4) * 60, r: (rnd(i + 9) - 0.5) * 1.2, c: i % 2 ? CY : MG }));
  return {
    update(lt) {
      sig.update(lt, rf, 0.1);
      title.update(lt, sm(seg(lt, 0.1, 0.5)), rf);
      const g = live.clear();
      // turn 1: the shot flies (0.6 → 2.0); the shards stick in your hull
      const k = seg(lt, 0.6, 2.0);
      if (k > 0 && arc.length > 1) {
        const pp = partial(arc, k);
        for (let i = 0; i < pp.length; i += 2) g.rect(pp[i][0] - 4, pp[i][1] - 4, 8, 8).fill(i % 4 ? CY : MG);
      }
      const stuck = lt > 2.0;
      const boom = seg(lt, 4.6, 5.4);
      shards.forEach((s, i) => {
        if (!stuck) return;
        const grow = sm(seg(lt, 2.0 + i * 0.04, 2.3 + i * 0.04));
        const out = rf ? 0 : boom;
        const L = 46 * grow * (1 + out * 1.5);
        const a = 1 - (rf ? sm(boom) : out);
        if (a <= 0.01) return;
        g.poly([s.x, s.y, s.x + Math.cos(s.r - 1.6) * L, s.y + Math.sin(s.r - 1.6) * L, s.x + Math.cos(s.r - 1.4) * L * 0.4 + 10, s.y + Math.sin(s.r - 1.4) * L * 0.4]).fill({ color: s.c, alpha: a });
        if (boom > 0 && !rf) g.circle(s.x, s.y, 30 * out).stroke({ width: 4, color: s.c, alpha: 1 - out });
      });
      // turn 2: they go off — the hull takes the damage again (a crack line)
      if (boom > 0.3) inkLine(g, partial([[hit[0] - 120, wy + 10], [hit[0] - 40, wy + 34], [hit[0] + 30, wy + 4], [hit[0] + 110, wy + 30]], sm(seg(boom, 0.3, 1))), { width: 6, color: 0xf4fbff, amp: 3 });
      turn1.alpha = env(lt, 0.4, 4.4, 0.2, 0.2);
      turn2.alpha = env(lt, 4.4, 7.0, 0.1, 0.3);
      cap.update(seg(lt, 2.4, 3.8), env(lt, 2.3, 7.0, 0.2, 0.3));
    },
  };
}

/** F24-5: HER pencil scratches over the glitch until the page is back (her ink eats the colour bars) */
function tachon(ctx: SceneCtx): FilmSet {
  const rm = ctx.rm;
  const pageC = new Container();
  pageC.addChild(paperSprite(ctx, 2320, 1480));
  pageC.position.set(-200, -200);
  ctx.plane(pageC, { z: 1100, bake: 'static' });
  const tvC = new Container();
  const bars = new Sprite(ctx.tex('pi:bars') as Texture);
  bars.position.set(-60, -40);
  bars.setSize(2040, 1160);
  tvC.addChild(bars);
  const esqFace = new Graphics();
  // a ghost of her visor still on the signal
  esqFace.poly([620, 440, 1260, 400, 1270, 560, 640, 600]).fill({ color: 0x1a1030, alpha: 0.85 }).stroke({ width: 8, color: CY });
  tvC.addChild(esqFace);
  const cover = new Graphics();
  const live = new Container();
  live.addChild(tvC, cover);
  ctx.plane(live, { z: 1000 });
  const pencil = new Graphics();
  const glow = glowSprite(ctx, LB.lantern, 1);
  const sig = new Signal(ctx);
  const ui = new Container();
  ui.addChild(sig, glow, pencil);
  ctx.plane(ui, { z: 0, screen: true });
  prewarm(ctx, live, ui);
  // the scribble path: back-and-forth strokes from top to bottom
  const path: [number, number][] = [];
  for (let r = 0; r < 14; r++) {
    const y = 40 + r * 78;
    path.push([r % 2 ? 1860 : 60, y + (rnd(r) - 0.5) * 30], [r % 2 ? 60 : 1860, y + 50 + (rnd(r + 3) - 0.5) * 30]);
  }
  return {
    update(lt) {
      sig.update(lt, ctx.rf, 0.12 * (1 - sm(seg(lt, 2.6, 4.2))));
      sig.alpha = 1 - sm(seg(lt, 2.6, 4.2));
      const p = seg(lt, 0.3, 3.6);
      const g = cover.clear();
      const pp = partial(path, p);
      // thick blue marker scribbles that cover the signal (she is angry: the line is fat)
      inkLine(g, pp, { width: 120, color: LB.pen, amp: 6, seed: 2 });
      inkLine(g, pp, { width: 40, color: 0x1e2c52, amp: 10, seed: 5 });
      // under all that ink the page comes back: the signal fades to the paper
      tvC.alpha = 1 - sm(seg(lt, 2.8, 4.4));
      cover.alpha = 1 - sm(seg(lt, 3.8, 5.0));
      const head = pp[pp.length - 1];
      const wig = rm ? 0 : Math.sin(lt * 60) * 6;
      const pg = pencil.clear();
      const on = p > 0 && p < 1;
      if (on) {
        const px = head[0] + 8;
        const py = head[1] - 6 + wig;
        pg.poly([px, py, px + 16, py - 34, px + 128, py - 164, px + 112, py - 176, px, py]).fill(0xe8b84a).stroke({ width: 3, color: 0x3a2a14 });
        pg.poly([px, py, px + 16, py - 34, px + 4, py - 30]).fill(0x3a2a14);
        glow.position.set(px, py);
      }
      glow.alpha = on ? 0.5 : 0;
    },
  };
}

/** F24-6: the page recovered; LO QUE ARRIESGAMOS, still with rage */
function riesgo(ctx: SceneCtx): FilmSet {
  ctx.plane(seccion(ctx), { z: 1100, bake: 'static' });
  // the last blue scratches still drying on the page
  const ink = new Graphics();
  for (let i = 0; i < 5; i++) inkLine(ink, [[200 + i * 300, 120 + rnd(i) * 100], [420 + i * 300, 220 + rnd(i + 2) * 120]], { width: 22, color: LB.pen, alpha: 0.4, amp: 6, seed: i });
  ctx.plane(ink, { z: 1000, bake: 'static' });
  const book = new BookFrame(ctx, { head: 'Ex Libris', title: 'La sección prohibida', folio: 301 });
  const bit = new Bitacora(ctx, RIESGO.f24, { size: 46, rage: true });
  const ui = new Container();
  ui.addChild(book, bit);
  ctx.plane(ui, { z: 0, screen: true });
  prewarm(ctx, ui);
  return {
    update(lt) {
      book.set({ open: 1 });
      bit.update(lt - 0.4, ctx.rm);
    },
  };
}
