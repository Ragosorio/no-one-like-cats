/**
 * LA PLANTILLA DE PRESENTACIÓN — the five beats as sets (see ./index.ts). Data comes from the stage's BriefingData
 * (app/stageIntro.ts), the look from the dimension's skin. Everything is built before the clock; only small redraws
 * per frame (the trajectories, a beam, the estimate's digits switch visibility).
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../stage';
import type { BriefingData } from '../../../app/stageIntro';
import type { RuleDemo, DemoShot } from '../../../battle/demo';
import type { BriefingBackdropArgs, BriefingSkin } from './index';
import { Beam, Bitacora, TV, TvScreen, balloon, bob, box, donut, kitTex, lanternAt, luzOf, outBack, popIn, rnd, seg, sm, warmAll, word, wrapLines } from '../acto1/kit';

type BeatName = 'donde' | 'pasa' | 'rival' | 'regla' | 'riesgo';

// ------------------------------------------------------------------ La Borracha's facade (the default backdrop)
const NEONS = [0xff4fa0, 0x58d0ff, 0x7fe08a, 0xffb347];
export function borrachaFacade(ctx: SceneCtx, a: BriefingBackdropArgs): { root: Container; glows: Sprite[]; door: [number, number] } {
  const root = new Container();
  const g = new Graphics();
  const s = a.seed;
  const neon = NEONS[s % NEONS.length];
  // sky, far buildings with lit windows
  g.rect(-400, -400, 2720, 520).fill(0x141a44).rect(-400, 120, 2720, 220).fill(0x1b2456);
  for (let i = 0; i < 40; i++) g.circle(-300 + rnd(i + s) * 2500, -300 + rnd(i + 7 + s) * 420, 2 + rnd(i + 3) * 3).fill({ color: TV.cream, alpha: 0.75 });
  for (let i = 0; i < 14; i++) {
    const w = 120 + rnd(i + 30 + s) * 130;
    const h = 220 + rnd(i + 40 + s) * 300;
    const x = -380 + i * 190;
    g.rect(x, 760 - h, w, h).fill(i % 2 ? 0x222b63 : 0x1c2458).stroke({ width: 5, color: TV.line });
    for (let j = 0; j < 6; j++) if (rnd(i * 9 + j + s) > 0.55) g.rect(x + 18 + (j % 3) * 34, 760 - h + 30 + Math.floor(j / 3) * 56, 18, 26).fill(TV.amberL);
  }
  // the storefront: wall colour from the seed, a big sign board, two windows, the lit door in the middle
  const walls = [0xb4483a, 0x2e9a5a, 0x9a5530, 0x6a4a9a, 0x3a7a9a];
  const wall = walls[s % walls.length];
  box(g, 380, 300, 1160, 470, wall, { shadow: TV.line, r: 8 });
  for (let y = 330; y < 760; y += 44) for (let x = 396 + ((y / 44) % 2) * 40; x < 1520; x += 80) g.roundRect(x, y, 72, 36, 4).fill({ color: 0x000000, alpha: 0.08 });
  box(g, 470, 190, 980, 150, 0x1d1430, { r: 14 });
  box(g, 430, 470, 330, 230, TV.amberL, { r: 6 });
  box(g, 1160, 470, 330, 230, TV.amberL, { r: 6 });
  for (const wx of [430, 1160]) for (let i = 0; i < 4; i++) g.rect(wx + 20 + i * 80, 600, 50, 80).fill({ color: TV.line, alpha: 0.25 });
  box(g, 850, 450, 220, 320, 0xffe7a8, { r: 8 });
  g.rect(870, 470, 180, 300).fill({ color: 0xfff3c8, alpha: 0.9 });
  // sidewalk, curb, wet street, puddles that mirror the sign
  g.rect(-400, 770, 2720, 64).fill(0x4a4f78).stroke({ width: 6, color: TV.line });
  g.rect(-400, 834, 2720, 460).fill(0x252b52);
  for (let i = 0; i < 9; i++) g.roundRect(-200 + i * 300, 980 + (i % 2) * 40, 160, 12, 6).fill({ color: TV.cream, alpha: 0.3 });
  for (const [x, y, w] of [
    [700, 910, 280],
    [1250, 1000, 320],
    [420, 1040, 210],
  ] as const) {
    g.ellipse(x, y, w, 26).fill({ color: 0x3a4478, alpha: 0.9 });
    g.rect(x - 40, y - 14, 80, 28).fill({ color: neon, alpha: 0.3 });
  }
  // a lamp post
  g.rect(1640, 300, 22, 470).fill(0x3a3f66).stroke({ width: 5, color: TV.line });
  g.roundRect(1590, 280, 120, 40, 14).fill(0x3a3f66).stroke({ width: 5, color: TV.line });
  root.addChild(g);
  // the sign: the place's own name in neon
  const size = a.title.length > 16 ? 64 : a.title.length > 11 ? 82 : 100;
  const t = word(ctx.k, a.title.toUpperCase(), { fontFamily: 'Bangers', fontSize: size, fill: 0xffffff, stroke: { color: neon, width: size * 0.12, join: 'round' }, letterSpacing: size * 0.06 });
  t.position.set(960, 265);
  if (t.width > 920) t.scale.set(920 / t.width);
  root.addChild(t);
  const glows: Sprite[] = [];
  for (const [x, y, sx, sy, col] of [
    [960, 265, 5.2, 1.4, neon],
    [960, 640, 1.6, 2.4, TV.amberL],
    [1650, 320, 1.4, 1.4, TV.amberL],
  ] as const) {
    const gl = new Sprite(kitTex(ctx, 'glow'));
    gl.anchor.set(0.5);
    gl.position.set(x, y);
    gl.scale.set(sx, sy);
    gl.tint = col;
    gl.blendMode = 'add';
    gl.alpha = 0.5;
    glows.push(gl);
    root.addChild(gl);
  }
  return { root, glows, door: [960, 770] };
}
type Backdrop = (ctx: SceneCtx, a: BriefingBackdropArgs) => { root: Container; glows: Sprite[]; door: [number, number] };
async function backdropOf(skin: BriefingSkin): Promise<Backdrop> {
  if (!skin.backdrop) return borrachaFacade;
  try {
    const m = (await skin.backdrop()) as { default?: Backdrop; backdrop?: Backdrop };
    return m.backdrop ?? m.default ?? borrachaFacade;
  } catch {
    return borrachaFacade;
  }
}

// ------------------------------------------------------------------ shared bits
function plate(ctx: SceneCtx, skin: BriefingSkin, tag: string, text: string, w = 1240): { c: Container; h: number } {
  const c = new Container();
  const st = { fontFamily: 'Space Grotesk', fontWeight: '700' as const, fontSize: 44, fill: skin.pal.text, wordWrap: true, wordWrapWidth: w - 80, lineHeight: 52 };
  const lines = wrapLines(text, st).slice(0, 3);
  const h = 70 + lines.length * 52 + 26;
  const g = new Graphics();
  g.roundRect(-w / 2 + 8, 8, w, h, 14).fill({ color: 0x000000, alpha: 0.35 });
  g.roundRect(-w / 2, 0, w, h, 14).fill({ color: skin.pal.ink, alpha: 0.92 }).stroke({ width: 5, color: skin.pal.accent });
  const tg = word(ctx.k, tag, { fontFamily: 'Anton', fontSize: 34, fill: skin.pal.ink, letterSpacing: 4 }, 0);
  tg.anchor.set(0, 0.5);
  const tw = tg.width + 40;
  g.roundRect(-w / 2 + 24, -24, tw, 52, 10).fill(skin.pal.accent).stroke({ width: 4, color: skin.pal.ink });
  tg.position.set(-w / 2 + 44, 2);
  c.addChild(g, tg);
  lines.forEach((ln, i) => {
    const sp = word(ctx.k, ln, { ...st, wordWrap: false }, 0);
    sp.anchor.set(0, 0);
    sp.position.set(-w / 2 + 40, 46 + i * 52);
    c.addChild(sp);
  });
  return { c, h };
}
/** slide a plate in from below (rm: fade) */
function slideIn(c: Container, lt: number, a: number, b: number, x: number, y: number, rm: boolean) {
  const p = sm(seg(lt, a, a + 0.4));
  const q = sm(seg(lt, b - 0.3, b));
  c.visible = lt >= a && lt < b;
  c.alpha = rm ? Math.min(p, 1 - q) : 1 - q;
  c.position.set(x, rm ? y : y + (1 - p) * 300);
}
function screenOf(ctx: SceneCtx, skin: BriefingSkin): TvScreen | null {
  if (!skin.tv) return null;
  const tv = new TvScreen(ctx);
  ctx.plane(tv, { z: 0, screen: true });
  return tv;
}

/** the battle diagram of a rule demo (battle/demo.ts): two ships, the water, the shots drawn as they fly */
class DemoDiagram extends Container {
  private g = new Graphics();
  private shotG = new Graphics();
  private labels: Sprite[] = [];
  private P: (x: number, y: number) => [number, number];
  constructor(
    private ctx: SceneCtx,
    readonly demo: RuleDemo,
    private box0: { x: number; y: number; w: number; h: number },
    private skin: BriefingSkin,
  ) {
    super();
    const f = demo.field;
    const xs = [f.player.x0, f.player.x1, f.enemy.x0, f.enemy.x1, ...demo.shots.flatMap((s) => [s.x])];
    const wx0 = Math.min(...xs) - 80;
    const wx1 = Math.max(...xs) + 80;
    const ys = demo.shots.flatMap((s) => s.points.map((p) => p.y));
    const wy0 = Math.min(f.waterY - 520, ...ys) - 40;
    const wy1 = f.waterY + 70;
    const sc = Math.min(box0.w / (wx1 - wx0), box0.h / (wy1 - wy0));
    const ox = box0.x + (box0.w - (wx1 - wx0) * sc) / 2;
    const oy = box0.y + (box0.h - (wy1 - wy0) * sc) / 2;
    this.P = (x, y) => [ox + (x - wx0) * sc, oy + (y - wy0) * sc];
    const g = this.g;
    g.roundRect(box0.x - 18, box0.y - 18, box0.w + 36, box0.h + 36, 18).fill({ color: 0x0f1430, alpha: 0.94 }).stroke({ width: 6, color: skin.pal.accent });
    const [, wyp] = this.P(0, f.waterY);
    g.rect(box0.x, wyp, box0.w, box0.y + box0.h - wyp).fill(0x2a6ab0);
    for (let i = 0; i < 16; i++) g.moveTo(box0.x + i * 92, wyp + 10).quadraticCurveTo(box0.x + i * 92 + 23, wyp + 2, box0.x + i * 92 + 46, wyp + 10).stroke({ width: 4, color: 0x8fd0ff });
    for (const [side, col] of [
      [f.player, 0xc77a45],
      [f.enemy, 0xf3f2ea],
    ] as const) {
      const [a] = this.P(side.x0, 0);
      const [b] = this.P(side.x1, 0);
      g.poly([a, wyp - 64, b, wyp - 64, b - 26, wyp + 14, a + 26, wyp + 14]).fill(col).stroke({ width: 5, color: TV.line, join: 'round' });
      g.rect(a + 18, wyp - 110, b - a - 36, 46).fill(col).stroke({ width: 4, color: TV.line });
    }
    if (f.target) {
      const [tx, ty] = this.P(f.target.x, f.target.y);
      g.circle(tx, ty, 18).stroke({ width: 5, color: 0xff5a4a }).circle(tx, ty, 6).fill(0xff5a4a);
    }
    for (const d of f.donas) {
      const [dx, dy] = this.P(d.x, d.y);
      donut(g, dx, dy, 20, Math.round(d.x));
    }
    const tag = (txt: string, x: number, col: number) => {
      const t = word(ctx.k, txt, { fontFamily: 'Bangers', fontSize: 34, fill: col, stroke: { color: TV.line, width: 5 } });
      t.position.set(x, box0.y + 26);
      this.addChild(t);
    };
    this.addChild(g, this.shotG);
    tag('TÚ', this.P((f.player.x0 + f.player.x1) / 2, 0)[0], skin.pal.paper);
    tag('ELLOS', this.P((f.enemy.x0 + f.enemy.x1) / 2, 0)[0], skin.pal.accent);
    for (const s of demo.shots) {
      const l = word(ctx.k, `${s.good ? '✔' : '✘'} ${s.label}`, { fontFamily: 'Bangers', fontSize: 46, fill: s.good ? 0x9ff59a : 0xff8a8a, stroke: { color: TV.line, width: 6 }, letterSpacing: 2 });
      l.position.set(box0.x + box0.w / 2, box0.y + box0.h - 38);
      l.visible = false;
      this.labels.push(l);
      this.addChild(l);
    }
  }
  /** the flight up to the demo's landing point */
  private pts(s: DemoShot) {
    let end = s.points.length - 1;
    let bd = Infinity;
    s.points.forEach((q, i) => {
      const d = Math.hypot(q.x - s.x, q.y - s.y);
      if (d < bd - 0.5) {
        bd = d;
        end = i;
      }
    });
    return s.points.slice(0, end + 1);
  }
  /** draw shot i at progress p (0..1); a burst on landing */
  update(lt: number, plan: { i: number; a: number; b: number }[]) {
    const g = this.shotG.clear();
    this.labels.forEach((l) => (l.visible = false));
    for (const { i, a, b } of plan) {
      if (lt < a) continue;
      const s = this.demo.shots[i];
      if (!s) continue;
      const pts = this.pts(s);
      const p = seg(lt, a, b);
      const n = Math.max(2, Math.floor(pts.length * p));
      const col = s.good ? 0x9ff59a : 0xff8a8a;
      for (let j = 1; j < n; j++) {
        if (j % 3 === 0) continue;
        const [x0, y0] = this.P(pts[j - 1].x, pts[j - 1].y);
        const [x1, y1] = this.P(pts[j].x, pts[j].y);
        g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: 5, color: col, cap: 'round' });
      }
      const [hx, hy] = this.P(pts[n - 1].x, pts[n - 1].y);
      g.circle(hx, hy, 10).fill(TV.line);
      if (p >= 1) {
        const k = 1 - seg(lt, b, b + 0.4);
        if (k > 0) for (let r = 0; r < 8; r++) g.moveTo(hx + Math.cos(r * 0.785) * 12, hy + Math.sin(r * 0.785) * 12).lineTo(hx + Math.cos(r * 0.785) * (12 + 36 * k), hy + Math.sin(r * 0.785) * (12 + 36 * k)).stroke({ width: 5, color: TV.amberL, alpha: k });
        this.labels.forEach((l) => (l.visible = false));
        this.labels[i].visible = true;
      }
    }
  }
}

/** the live estimate in prebuilt digits («CON ESTA TRIPULACIÓN: 72 %»): no texture is ever made on the clock */
class EstimateChip extends Container {
  private digits: Sprite[][] = [];
  private pct: Sprite;
  private dots: Sprite;
  constructor(ctx: SceneCtx, skin: BriefingSkin) {
    super();
    const st = { fontFamily: 'Anton', fontSize: 64, fill: skin.pal.ink };
    const lbl = word(ctx.k, 'CON ESTA TRIPULACIÓN', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 24, fill: skin.pal.ink, letterSpacing: 3 });
    const g = new Graphics().roundRect(-230, -80, 460, 160, 16).fill(skin.pal.accent).stroke({ width: 6, color: skin.pal.ink });
    lbl.position.set(0, -48);
    this.addChild(g, lbl);
    for (let place = 0; place < 3; place++) {
      const row: Sprite[] = [];
      for (let d = 0; d < 10; d++) {
        const sp = word(ctx.k, String(d), st);
        sp.position.set(-70 + place * 46, 22);
        sp.visible = false;
        row.push(sp);
        this.addChild(sp);
      }
      this.digits.push(row);
    }
    this.pct = word(ctx.k, '%', st);
    this.pct.position.set(86, 22);
    this.dots = word(ctx.k, '…', st);
    this.dots.position.set(0, 18);
    this.addChild(this.pct, this.dots);
    this.rotation = -0.05;
  }
  show(p: number | null) {
    for (const r of this.digits) for (const s of r) s.visible = false;
    this.dots.visible = p === null;
    this.pct.visible = p !== null;
    if (p === null) return;
    const n = Math.max(0, Math.min(100, Math.round(p * 100)));
    const ds = String(n).split('').map(Number);
    const start = 3 - ds.length;
    ds.forEach((d, i) => {
      const sp = this.digits[start + i][d];
      sp.visible = true;
      sp.x = -70 + (start + i) * 46 + (3 - ds.length) * -23;
    });
  }
}

// ------------------------------------------------------------------ the beats
export function beat(name: BeatName, d: BriefingData, skin: BriefingSkin, seed: number): SetModule {
  const args: BriefingBackdropArgs = { title: d.title, seed };
  const kindTag = d.kind === 'boss' ? 'JEFE' : d.kind === 'elite' ? 'ÉLITE' : null;
  if (name === 'donde')
    return {
      async build(ctx): Promise<FilmSet> {
        const bd = (await backdropOf(skin))(ctx, args);
        ctx.plane(bd.root, { z: 1000, bake: 'static', res: 1.3 });
        const live = new Container();
        const glows = bd.glows.map((gl) => {
          const c = new Sprite(gl.texture);
          c.anchor.set(0.5);
          c.position.copyFrom(gl.position);
          c.scale.copyFrom(gl.scale);
          c.tint = gl.tint;
          c.blendMode = 'add';
          live.addChild(c);
          return c;
        });
        const rain = ctx.weather('rain');
        if (rain?.ground) live.addChild(rain.ground);
        ctx.plane(live, { z: 1000 });
        // the channel bug and the stage stamp
        const ui = new Container();
        const bug = new Container();
        const bt = word(ctx.k, d.tag, { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 28, fill: skin.pal.text, letterSpacing: 3 }, 0);
        bt.anchor.set(0, 0.5);
        const bg = new Graphics().roundRect(-16, -26, bt.width + 32, 52, 12).fill({ color: skin.pal.ink, alpha: 0.85 }).stroke({ width: 3, color: skin.pal.accent });
        bug.addChild(bg, bt);
        ui.addChild(bug);
        const stamp = new Container();
        if (kindTag) {
          const st = word(ctx.k, kindTag, { fontFamily: 'Anton', fontSize: 92, fill: 0xff3b3b, letterSpacing: 8 });
          const sg = new Graphics().roundRect(-st.width / 2 - 26, -62, st.width + 52, 124, 10).stroke({ width: 10, color: 0xff3b3b });
          stamp.addChild(sg, st);
          stamp.rotation = -0.12;
          ui.addChild(stamp);
        }
        ctx.plane(ui, { z: 0, screen: true });
        const tv = screenOf(ctx, skin);
        warmAll(ctx, ui);
        return {
          update(lt, f) {
            // the sign lights up with a stutter, then steady (rf: no stutter)
            const on = ctx.rf ? sm(seg(lt, 0.4, 1.0)) : lt < 0.5 ? 0 : lt < 1.1 ? (Math.floor(lt * 14) % 3 === 0 ? 0.2 : 1) : 1;
            glows.forEach((gl, i) => (gl.alpha = (i === 0 ? on : 1) * (0.5 + (ctx.rf ? 0 : Math.sin(lt * 3 + i) * 0.04))));
            const r = tv?.rect() ?? { x: ctx.k.view.x, y: ctx.k.view.y, w: ctx.k.view.w, h: ctx.k.view.h };
            bug.position.set(r.x + 48, r.y + 54);
            bug.alpha = sm(seg(lt, 0.2, 0.6));
            if (kindTag) {
              stamp.position.set(r.x + r.w - 240, r.y + 170);
              const p = seg(lt, 2.6, 2.85);
              stamp.visible = lt >= 2.6;
              stamp.scale.set(ctx.rm ? 1 : 1 + (1 - outBack(p, 2)) * 1.2);
              stamp.alpha = sm(p * 2);
            }
            tv?.update(f);
          },
        };
      },
    };
  if (name === 'pasa')
    return {
      cats: ['luzterna'],
      async build(ctx): Promise<FilmSet> {
        const bd = (await backdropOf(skin))(ctx, args);
        ctx.plane(bd.root, { z: 1000, bake: 'static', res: 1.3 });
        const live = new Container();
        // Cerito's footprints: from the left edge across the street to the door (blurry edges: drawn «wrong»)
        const prints: Graphics[] = [];
        const N = 9;
        for (let i = 0; i < N; i++) {
          const k = i / (N - 1);
          const x = 620 + k * (bd.door[0] - 620);
          const y = 1040 - k * 250 + (i % 2) * 26;
          const pg = new Graphics();
          for (let r = 3; r >= 0; r--) {
            const a = r === 0 ? 1 : 0.16;
            pg.ellipse(0, 0, 22 + r * 6, 16 + r * 5).fill({ color: 0xe6f0ff, alpha: a });
            for (const [dx, dy] of [
              [-17, -22],
              [-6, -30],
              [7, -30],
              [18, -22],
            ])
              pg.circle(dx, dy, 7 + r * 3).fill({ color: 0xe6f0ff, alpha: a });
          }
          pg.position.set(x, y);
          pg.scale.set(0.95 + (1 - k) * 0.45);
          prints.push(pg);
          live.addChild(pg);
        }
        const halos = prints.map((pg) => {
          const h = new Sprite(kitTex(ctx, 'glow'));
          h.anchor.set(0.5);
          h.position.copyFrom(pg.position);
          h.tint = 0x9fe8ff;
          h.blendMode = 'add';
          h.scale.set(0.9);
          live.addChildAt(h, 0);
          return h;
        });
        const luz = luzOf(ctx, 360);
        if (luz.actor) live.addChild(luz.actor);
        const beam = new Beam(ctx);
        live.addChild(beam);
        const rain = ctx.weather('rain');
        if (rain?.ground) live.addChild(rain.ground);
        ctx.plane(live, { z: 1000 });
        const pl = plate(ctx, skin, 'QUÉ PASA', d.pasa);
        const ui = new Container();
        ui.addChild(pl.c);
        ctx.plane(ui, { z: 0, screen: true });
        const tv = screenOf(ctx, skin);
        warmAll(ctx, ui);
        return {
          update(lt, f) {
            const rm = ctx.rm;
            // she floats in from the left, finds the trail with her beam: each print glows as the light passes
            const inK = sm(seg(lt, 0.2, 1.4));
            luz.actor?.pose(lt, 240 + inK * 280, 640 + bob(lt, rm, 10), { flip: false });
            const sweep = seg(lt, 1.2, 3.8);
            const idx = sweep * (N - 1);
            prints.forEach((pg, i) => {
              const seen = sm(seg(lt, 0.4 + i * 0.18, 0.7 + i * 0.18));
              const lit = sm(1 - Math.abs(idx - i) * 0.9) * (sweep > 0 && sweep < 1 ? 1 : 0);
              const found = idx >= i ? 1 : 0;
              pg.alpha = seen * (0.35 + 0.65 * Math.max(lit, found * 0.8));
              halos[i].alpha = seen * (lit * 0.9 + found * 0.35);
            });
            if (luz.actor) {
              const from = lanternAt(luz);
              const ti = Math.min(N - 1, Math.max(0, idx));
              const i0 = Math.floor(ti);
              const i1 = Math.min(N - 1, i0 + 1);
              const fr = ti - i0;
              const to: [number, number] = [prints[i0].x + (prints[i1].x - prints[i0].x) * fr, prints[i0].y + (prints[i1].y - prints[i0].y) * fr];
              beam.set(from, to, 70, sm(seg(lt, 1.0, 1.4)) * (1 - sm(seg(lt, 4.2, 4.8))));
            }
            const r = tv?.rect() ?? ctx.k.view;
            slideIn(pl.c, lt, 0.5, BEATS_END.pasa, 960, r.y + r.h - pl.h - 50, rm);
            tv?.update(f);
          },
        };
      },
    };
  if (name === 'rival') {
    // the battle's real roster behind the captain (the paintings of the cats that will fight: ≤ 3)
    const crew = (d.rival.crewSlugs ?? []).filter((s) => s && s !== d.rival.slug).slice(0, 3);
    return {
      cats: [...(d.rival.slug ? [d.rival.slug] : []), ...crew],
      async build(ctx): Promise<FilmSet> {
        const bd = (await backdropOf(skin))(ctx, args);
        ctx.plane(bd.root, { z: 1500, bake: 'dof', blur: 10, dof: 900, res: 1 });
        const dim = new Graphics().rect(-400, -400, 2720, 1880).fill({ color: 0x0b0716, alpha: 0.35 });
        ctx.plane(dim, { z: 1400, bake: 'static' });
        const live = new Container();
        const spot = new Sprite(kitTex(ctx, 'glow'));
        spot.anchor.set(0.5);
        spot.tint = skin.pal.accent;
        spot.blendMode = 'add';
        spot.position.set(960, 860);
        spot.scale.set(4, 1.4);
        live.addChild(spot);
        // the crew: smaller, a step behind, in the doorway's shade (they come out with the captain)
        const CREW_AT: [number, number][] = [
          [800, 930],
          [1360, 930],
          [1580, 960],
        ];
        const backup = crew.map((s) => ctx.actor(s, 400)).filter((a): a is NonNullable<typeof a> => !!a);
        for (const a of backup) {
          if (a.puppet) a.puppet.tint = 0xa8a4b8;
          live.addChild(a);
        }
        const rv = d.rival.slug ? ctx.actor(d.rival.slug, 640) : null;
        if (rv) live.addChild(rv);
        const sil = new Graphics();
        if (!rv) {
          // no painting: a question mark in the doorway
          sil.ellipse(960, 760, 160, 220).fill({ color: 0x0b0716, alpha: 0.9 });
          const q = word(ctx.k, '?', { fontFamily: 'Anton', fontSize: 240, fill: skin.pal.accent });
          q.position.set(960, 700);
          live.addChild(sil, q);
        }
        ctx.plane(live, { z: 1000 });
        const ui = new Container();
        const np = new Container();
        const nm = word(ctx.k, d.rival.name.toUpperCase(), { fontFamily: 'Bangers', fontSize: d.rival.name.length > 22 ? 60 : 78, fill: skin.pal.paper, stroke: { color: skin.pal.ink, width: 9, join: 'round' }, letterSpacing: 3 });
        const lab = word(ctx.k, kindTag ? `${kindTag} · CONTRA QUIÉN` : 'CONTRA QUIÉN', { fontFamily: 'Anton', fontSize: 30, fill: skin.pal.ink, letterSpacing: 5 });
        const w = Math.max(nm.width, lab.width) + 90;
        const pg = new Graphics()
          .roundRect(-w / 2, -60, w, 130, 16)
          .fill(skin.pal.plate)
          .stroke({ width: 6, color: skin.pal.ink })
          .roundRect(-lab.width / 2 - 20, -96, lab.width + 40, 48, 10)
          .fill(skin.pal.accent)
          .stroke({ width: 4, color: skin.pal.ink });
        lab.position.set(0, -72);
        nm.position.set(0, 8);
        np.addChild(pg, lab, nm);
        ui.addChild(np);
        const bal = d.rival.line ? balloon(ctx.k, d.rival.line, { size: 46, wrap: 600, tail: [140, 150] }) : null;
        if (bal) ui.addChild(bal);
        ctx.plane(ui, { z: 0, screen: true });
        const tv = screenOf(ctx, skin);
        warmAll(ctx, ui);
        return {
          update(lt, f) {
            const rm = ctx.rm;
            // the rival steps out of the doorway: small and dark → big and lit (squash on landing)
            const p = rm ? sm(seg(lt, 0.1, 0.7)) : outBack(seg(lt, 0.1, 0.55), 1.6);
            const land = rm ? 0 : Math.max(0, 1 - seg(lt, 0.55, 0.85)) * (lt > 0.55 ? 1 : 0);
            if (rv) {
              rv.pose(lt, 1080, 1010 + (1 - p) * 40, { sx: (0.55 + 0.45 * p) * (1 + land * 0.08), sy: (0.55 + 0.45 * p) * (1 - land * 0.08), flip: true });
              rv.alpha = Math.min(1, 0.2 + p);
            }
            backup.forEach((a, i) => {
              const q = rm ? sm(seg(lt, 0.2 + i * 0.1, 0.8 + i * 0.1)) : outBack(seg(lt, 0.25 + i * 0.12, 0.7 + i * 0.12), 1.3);
              const [x, y] = CREW_AT[i];
              a.pose(lt, x, y + (1 - q) * 30, { sx: 0.6 + 0.4 * q, sy: 0.6 + 0.4 * q, flip: x > 1080 });
              a.alpha = Math.min(0.92, q);
            });
            spot.alpha = 0.25 + 0.35 * p;
            const r = tv?.rect() ?? ctx.k.view;
            const np0 = sm(seg(lt, 0.6, 1.0));
            np.position.set(r.x + r.w * 0.3, r.y + r.h - 150 + (rm ? 0 : (1 - np0) * 260));
            np.alpha = rm ? np0 : 1;
            if (bal) {
              bal.position.set(r.x + r.w * 0.36, r.y + 230);
              popIn(bal, lt, 1.6, BEATS_END.rival, rm, 0.95);
            }
            tv?.update(f);
          },
        };
      },
    };
  }
  if (name === 'regla')
    return {
      async build(ctx): Promise<FilmSet> {
        const back = new Graphics().rect(-400, -400, 2720, 1880).fill(skin.pal.ink);
        for (let i = 0; i < 26; i++) back.circle(rnd(i + seed) * 1920, rnd(i + 3 + seed) * 1080, 40 + rnd(i) * 90).fill({ color: skin.pal.plate, alpha: 0.12 });
        ctx.plane(back, { z: 1200, bake: 'static' });
        // the demo: the stage's own (computed by the sim before the film) — or, in the dev samples, computed here
        let demo = d.rule.demo;
        const devMareo = (d as unknown as { __mareo?: unknown }).__mareo;
        if (!demo && devMareo) {
          try {
            const m = await import('../../../battle/demo');
            const id = m.demoFor(devMareo as never);
            demo = id ? m.ruleDemo(id, devMareo as never) : null;
          } catch {
            demo = null;
          }
        }
        const ui = new Container();
        const r0 = { x: 300, y: 300, w: 1320, h: 470 };
        const title = word(ctx.k, demo?.title ?? 'SU REGLA', { fontFamily: 'Bangers', fontSize: 78, fill: skin.pal.accent, stroke: { color: TV.line, width: 9 }, letterSpacing: 3 });
        title.position.set(960, 150);
        ui.addChild(title);
        let diag: DemoDiagram | null = null;
        const lines: Container[] = [];
        if (demo) {
          diag = new DemoDiagram(ctx, demo, r0, skin);
          ui.addChild(diag);
        } else {
          (d.rule.lines.length ? d.rule.lines : ['Sin regla especial: gana el que mejor apunta.']).slice(0, 3).forEach((ln, i) => {
            const pl = plate(ctx, skin, `${i + 1}`, ln, 1200);
            pl.c.position.set(960, 330 + i * 200);
            lines.push(pl.c);
            ui.addChild(pl.c);
          });
        }
        const capText = demo?.caption ?? '';
        const cap = capText ? plate(ctx, skin, 'OJO', capText, 1280) : null;
        if (cap) ui.addChild(cap.c);
        ctx.plane(ui, { z: 0, screen: true });
        const tv = screenOf(ctx, skin);
        warmAll(ctx, ui);
        // two shots: the right way (✔), then the wrong one (✘)
        const order = demo ? [...demo.shots.keys()].sort((a, b) => Number(demo!.shots[b].good) - Number(demo!.shots[a].good)) : [];
        const plan = demo?.rule === 'botellas' ? demo.shots.map((_, i) => ({ i, a: 0.8 + i * 0.5, b: 1.6 + i * 0.5 })) : order.slice(0, 2).map((i, k) => ({ i, a: 0.7 + k * 2.0, b: 1.9 + k * 2.0 }));
        return {
          update(lt, f) {
            const rm = ctx.rm;
            title.scale.set(rm ? 1 : 0.6 + 0.4 * outBack(seg(lt, 0.1, 0.4), 2));
            title.alpha = sm(seg(lt, 0.1, 0.3));
            if (diag) {
              if (demo?.rule === 'botellas') {
                // all bottles fall together on your ship
                diag.update(lt, plan);
              } else {
                // only the current shot shows (the first, then the second replaces it)
                const cur = plan.filter((p) => lt >= p.a).slice(-1);
                diag.update(lt, cur);
              }
            }
            lines.forEach((c, i) => {
              const p = sm(seg(lt, 0.4 + i * 0.6, 0.8 + i * 0.6));
              c.alpha = p;
              c.x = 960 + (rm ? 0 : (1 - p) * -200);
            });
            if (cap) {
              const r = tv?.rect() ?? ctx.k.view;
              slideIn(cap.c, lt, demo?.rule === 'botellas' ? 2.6 : 4.6, BEATS_END.regla, 960, r.y + r.h - cap.h - 40, rm);
            }
            tv?.update(f);
          },
        };
      },
    };
  // riesgo
  return {
    async build(ctx): Promise<FilmSet> {
      const bd = (await backdropOf(skin))(ctx, args);
      ctx.plane(bd.root, { z: 1300, bake: 'dof', blur: 6, dof: 800 });
      const rain = ctx.weather('rain');
      if (rain?.ground) {
        const live = new Container();
        live.addChild(rain.ground);
        ctx.plane(live, { z: 1300 });
      }
      const pg = new Bitacora(ctx, d.stakes);
      const est = new EstimateChip(ctx, skin);
      const hu = d.huellas > 0 ? word(ctx.k, `+${d.huellas} HUELLAS DE 000`, { fontFamily: 'Anton', fontSize: 40, fill: skin.pal.accent, stroke: { color: skin.pal.ink, width: 7 }, letterSpacing: 3 }) : null;
      const ui = new Container();
      ui.addChild(pg, est);
      if (hu) ui.addChild(hu);
      ctx.plane(ui, { z: 0, screen: true });
      const tv = screenOf(ctx, skin);
      warmAll(ctx, ui);
      return {
        update(lt, f) {
          pg.update(lt - 0.15, ctx.rm);
          const r = tv?.rect() ?? ctx.k.view;
          const e = d.estimate();
          est.show(e?.p ?? null);
          const ep = sm(seg(lt, 2.4, 2.8));
          est.visible = lt >= 2.4;
          est.position.set(r.x + r.w - 300, r.y + 190);
          est.scale.set(ctx.rm ? 1 : 0.7 + 0.3 * outBack(ep, 2));
          est.alpha = ep;
          if (hu) {
            hu.position.set(r.x + 360, r.y + 120);
            hu.alpha = sm(seg(lt, 2.9, 3.3));
          }
          tv?.update(f);
        },
      };
    },
  };
}
/** when each beat's plates leave (scene-local s) */
const BEATS_END = { pasa: 5.3, rival: 5.4, regla: 6.2 } as const;
