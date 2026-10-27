/**
 * F14 «Entrenamiento» — the sets of the three YONKOMA (shot lists in ./index.ts). A vertical strip of four panels in
 * the middle of the 16:9, manga screentone in black and white with ONE colour: the blue of her lantern (the `manga`
 * bake keeps it in the cats; the post keeps that hue). The panels open one by one, top to bottom; the punch line is
 * always the fourth; at the end the camera pulls back and you see the whole strip.
 */
import { Container, Graphics, TilingSprite, type Texture } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import {
  INK,
  LANTERN,
  Panel,
  SLUG,
  balloon,
  bob,
  fitArcTo,
  glow,
  headband,
  lanternAt,
  luzOf,
  outBack,
  realArcs,
  reveal,
  rnd,
  sash,
  seg,
  sm,
  speedLines,
  streaks,
  word,
} from '../kit';

const MG = { ink: 0x111111, paper: 0xf7f6f2, grey: 0xb8b8b8, dark: 0x4a4a4a, blue: LANTERN } as const;
/** the strip (world px at z 1000): four panels, a title box on top */
export const STRIP = { x: 650, w: 620, top: 130, ph: 420, gap: 30 } as const;
export const panelY = (i: number) => STRIP.top + i * (STRIP.ph + STRIP.gap);
/** when each panel opens (scene-local s) — one per phrase of the piano */
export const OPEN = [0.4, 4.4, 9.4, 14.2] as const;

type Actor = NonNullable<ReturnType<SceneCtx['actor']>>;
/** a point on an actor's head (local offsets in head-radius units), honouring its flip */
function onHead(a: Actor | null, dx: number, dy: number): [number, number] {
  if (!a) return [0, 0];
  const [hx, hy] = a.head();
  const sx = Math.sign(a.scale.x) || 1;
  const r = a.size * 0.16;
  return [a.x + (hx + dx * r) * sx, a.y + hy * Math.abs(a.scale.y) + dy * r];
}
function tone(ctx: SceneCtx, w: number, h: number, x = 0, y = 0, alpha = 1, scale = 0.32): TilingSprite | Graphics {
  const t = ctx.tex('mg:tone') as Texture | undefined;
  if (!t) return new Graphics().rect(x, y, w, h).fill({ color: MG.grey, alpha: 0.5 * alpha });
  const s = new TilingSprite({ texture: t, width: w, height: h });
  s.position.set(x, y);
  s.tileScale.set(scale);
  s.tint = MG.ink;
  s.alpha = alpha;
  return s;
}
/** manga sweat drop / shame lines / sparkle */
function sweat(g: Graphics, x: number, y: number, s = 1) {
  g.moveTo(x, y - 18 * s).quadraticCurveTo(x + 13 * s, y + 4 * s, x, y + 12 * s).quadraticCurveTo(x - 13 * s, y + 4 * s, x, y - 18 * s).fill(0xffffff).stroke({ width: 3, color: MG.ink });
}
function shame(g: Graphics, x: number, y: number, s = 1) {
  for (let i = 0; i < 4; i++) g.moveTo(x - 30 * s + i * 16 * s, y + 10 * s).lineTo(x - 20 * s + i * 16 * s, y - 10 * s).stroke({ width: 4, color: MG.ink });
}
function sparkle(g: Graphics, x: number, y: number, r: number) {
  g.poly([x, y - r, x + r * 0.25, y - r * 0.25, x + r, y, x + r * 0.25, y + r * 0.25, x, y + r, x - r * 0.25, y + r * 0.25, x - r, y, x - r * 0.25, y - r * 0.25]).fill(0xffffff).stroke({ width: 3, color: MG.ink });
}
/** a folded-newspaper pirate hat */
function pirateHat(g: Graphics, x: number, y: number, w: number) {
  g.poly([x - w * 0.6, y, x + w * 0.6, y, x + w * 0.1, y - w * 0.62, x - w * 0.1, y - w * 0.62]).fill(0xffffff).stroke({ width: 4, color: MG.ink, join: 'round' });
  g.rect(x - w * 0.62, y - w * 0.08, w * 1.24, w * 0.12).fill(0xe8e8e8).stroke({ width: 3, color: MG.ink });
  for (let i = 0; i < 4; i++) g.rect(x - w * 0.3, y - w * 0.45 + i * w * 0.08, w * (0.3 + rnd(i) * 0.3), 3).fill(MG.dark);
  // a little skull
  g.circle(x, y - w * 0.3, w * 0.07).fill(MG.ink);
}
/** a ninja mask band across the eyes (tails behind) */
function ninjaMask(g: Graphics, x: number, y: number, w: number) {
  g.roundRect(x - w * 0.62, y - w * 0.12, w * 1.24, w * 0.24, 8).fill(MG.ink);
  g.ellipse(x - w * 0.24, y, w * 0.12, w * 0.06).fill(0xffffff).ellipse(x + w * 0.24, y, w * 0.12, w * 0.06).fill(0xffffff);
  g.poly([x + w * 0.6, y - w * 0.05, x + w * 1.0, y - w * 0.22, x + w * 0.95, y + w * 0.02]).fill(MG.ink);
  g.poly([x + w * 0.6, y + w * 0.05, x + w * 0.98, y + w * 0.16, x + w * 0.9, y + w * 0.26]).fill(MG.ink);
}

interface Built {
  /** draw this frame */
  update(lt: number, rm: boolean, step: number): void;
}
/** the common frame: paper, the margins' screentone, the side titles, the title box, four panels */
function frame(ctx: SceneCtx, title: string, side: string): { panels: Panel[]; root: Container; back: Container } {
  const k = ctx.k;
  const back = new Container();
  const pp = ctx.tex('mg:paper') as Texture | undefined;
  const bg = new Graphics().rect(-1400, -800, 4720, 3600).fill(MG.paper);
  back.addChild(bg);
  if (pp) {
    const t = new TilingSprite({ texture: pp, width: 4720, height: 3600 });
    t.position.set(-1400, -800);
    back.addChild(t);
  }
  back.addChild(tone(ctx, 600, 3600, -1400 + 900, -800, 0.35, 0.5), tone(ctx, 600, 3600, 1500, -800, 0.35, 0.5));
  const st = word(k, '¡ENTRENAMIENTO!', { fontFamily: 'Dela Gothic One', fontSize: 96, fill: MG.ink });
  st.rotation = -Math.PI / 2;
  st.position.set(470, 700);
  const sd = word(k, side, { fontFamily: 'Dela Gothic One', fontSize: 56, fill: MG.ink });
  sd.rotation = Math.PI / 2;
  sd.position.set(1450, 700);
  back.addChild(st, sd);
  const tb = new Graphics().rect(STRIP.x, STRIP.top - 100, STRIP.w, 80).fill(MG.ink);
  back.addChild(tb);
  const tt = word(k, title, { fontFamily: 'Dela Gothic One', fontSize: 40, fill: 0xffffff, letterSpacing: 2 });
  tt.position.set(STRIP.x + STRIP.w / 2, STRIP.top - 60);
  back.addChild(tt);
  const root = new Container();
  const panels = [0, 1, 2, 3].map((i) => new Panel({ x: STRIP.x, y: panelY(i), w: STRIP.w, h: STRIP.ph, border: 6, gutter: 0, ink: MG.ink, bg: 0xffffff }));
  for (const p of panels) root.addChild(p);
  return { panels, root, back };
}

// ------------------------------------------------------------------ the three strips
function tira1(ctx: SceneCtx, P: Panel[]): Built {
  const k = ctx.k;
  // P1 · Luzterna in a paper pirate hat points the lantern at the target
  const l1 = luzOf(ctx, 330);
  const hat = new Graphics();
  const tgt = new Graphics();
  for (let i = 4; i > 0; i--) tgt.circle(200, -20, i * 26).fill(i % 2 ? 0xffffff : MG.ink).stroke({ width: 3, color: MG.ink });
  tgt.rect(195, 80, 10, 120).fill(MG.dark);
  P[0].content.addChild(tgt);
  if (l1.actor) P[0].content.addChild(l1.actor);
  P[0].content.addChild(hat);
  const b1 = balloon(k, 'Lección uno: apunta con el corazón.', { size: 30, wrap: 300, tail: [-60, 70] });
  b1.position.set(60, -140);
  P[0].over.addChild(b1);
  // P2 · Canelo, paw on his chest, eyes closed, solemn (a close-up)
  P[1].content.addChild(tone(ctx, 620, 420, -310, -210, 0.25, 0.4));
  const lines2 = new Graphics();
  speedLines(lines2, 0, -40, 160, 600, { n: 40, color: MG.ink, seed: 4, width: 0.012 });
  P[1].content.addChild(lines2);
  const c2 = ctx.actor(ctx.canelo, 560);
  if (c2) {
    P[1].content.addChild(c2);
    c2.emote('sleepy', 1);
  }
  const paw = new Graphics().ellipse(30, 60, 46, 34).fill(0xffffff).stroke({ width: 4, color: MG.ink });
  P[1].content.addChild(paw);
  const fx2 = new Graphics();
  P[1].over.addChild(fx2);
  // P3 · ¡BUM! the bullet leaves for anywhere (the real flight, thrown the wrong way)
  const c3 = ctx.actor(ctx.canelo, 260);
  const cannon = new Graphics().roundRect(-40, 60, 150, 50, 16).fill(MG.dark).stroke({ width: 4, color: MG.ink }).circle(-10, 120, 24).fill(0xffffff).stroke({ width: 4, color: MG.ink });
  if (c3) P[2].content.addChild(c3);
  P[2].content.addChild(cannon);
  const shot = fitArcTo(realArcs()[0], [110, 70], [-280, -150], -210);
  const trail3 = new Graphics();
  P[2].content.addChild(trail3);
  const bum = word(k, '¡BUM!', { fontFamily: 'Bangers', fontSize: 110, fill: 0xffffff, stroke: { color: MG.ink, width: 10 } });
  bum.position.set(170, -110);
  P[2].over.addChild(bum);
  // P4 · Super Siamés with the bullet in his ramen, noodles on his head; Luzterna whistling at the back
  P[3].content.addChild(tone(ctx, 620, 420, -310, -210, 0.18, 0.4));
  const l4 = luzOf(ctx, 250);
  if (l4.actor) P[3].content.addChild(l4.actor);
  const s4 = ctx.actor(SLUG.siames, 380);
  if (s4) P[3].content.addChild(s4);
  const ramen = new Graphics();
  P[3].content.addChild(ramen);
  const whistle = word(k, '♪ fiu fiu', { fontFamily: 'Bangers', fontSize: 34, fill: MG.ink });
  whistle.position.set(-190, -10);
  P[3].over.addChild(whistle);
  const b4 = balloon(k, '…Con el corazón de OTRO.', { size: 32, wrap: 260, tail: [150, 60] });
  b4.position.set(-120, -140);
  P[3].over.addChild(b4);
  const lamp1 = glow(ctx, LANTERN, 90, 0.8);
  P[0].content.addChild(lamp1);
  return {
    update(lt, rm, step) {
      l1.actor?.pose(lt, -150, 200 + bob(lt, rm, 5), { rot: -0.05 });
      const la = lanternAt(l1);
      lamp1.position.set(la[0], la[1]);
      const h = hat.clear();
      const [hx, hy] = onHead(l1.actor, 0, -1.5);
      pirateHat(h, hx, hy, 120);
      reveal(b1, lt, OPEN[0] + 0.4, Infinity, rm);
      c2?.pose(lt, -20, 380, { flip: true, sy: 1 + (rm ? 0 : Math.sin(lt * 1.5) * 0.01) });
      const f2 = fx2.clear();
      if (lt > OPEN[1] + 0.5) for (let i = 0; i < 3; i++) sparkle(f2, -200 + i * 190, -150 + (i % 2) * 40, 16 + (step % 2) * 3);
      // P3
      c3?.pose(lt, -150, 200, { flip: true, rot: lt > OPEN[2] + 0.8 && lt < OPEN[2] + 1.2 ? 0.1 : 0 });
      const tg = trail3.clear();
      const fp = seg(lt, OPEN[2] + 0.8, OPEN[2] + 1.8);
      const n = Math.floor(shot.length * (rm ? (fp > 0 ? 1 : 0) : fp));
      for (let i = 2; i < n; i += 2) tg.moveTo(shot[i - 1][0], shot[i - 1][1]).lineTo(shot[i][0], shot[i][1]);
      tg.stroke({ width: 5, color: MG.ink });
      if (n > 1) tg.circle(shot[n - 1][0], shot[n - 1][1], 12).fill(MG.ink);
      reveal(bum, lt, OPEN[2] + 0.8, Infinity, rm);
      // P4
      l4.actor?.pose(lt, -170, 200 + bob(lt, rm, 4), { flip: true, rot: 0.05 });
      s4?.pose(lt, 110, 210, { flip: true });
      const r = ramen.clear();
      // the noodles on his head and the bowl with the bullet
      const [nx, ny] = onHead(s4, 0, -0.9);
      for (let i = 0; i < 7; i++) r.moveTo(nx - 70 + i * 22, ny - 10).bezierCurveTo(nx - 60 + i * 22, ny + 40, nx - 80 + i * 22, ny + 70, nx - 64 + i * 22, ny + 110 + (i % 3) * 14).stroke({ width: 4, color: MG.ink });
      r.ellipse(nx, ny - 14, 74, 22).fill(0xffffff).stroke({ width: 4, color: MG.ink });
      r.ellipse(160, 160, 90, 26).fill(0xffffff).stroke({ width: 4, color: MG.ink });
      r.moveTo(70, 160).quadraticCurveTo(160, 240, 250, 160).fill(0xffffff).stroke({ width: 4, color: MG.ink });
      r.circle(160, 150, 14).fill(MG.ink);
      sweat(r, nx + 80, ny + 30);
      reveal(whistle, lt, OPEN[3] + 0.9, Infinity, rm);
      reveal(b4, lt, OPEN[3] + 0.5, Infinity, rm);
    },
  };
}
function tira2(ctx: SceneCtx, P: Panel[]): Built {
  const k = ctx.k;
  // P1 · the ninja lesson, lantern ON
  const l1 = luzOf(ctx, 330);
  const mask1 = new Graphics();
  if (l1.actor) P[0].content.addChild(l1.actor);
  P[0].content.addChild(mask1);
  const lamp1 = glow(ctx, LANTERN, 110, 0.9);
  P[0].content.addChild(lamp1);
  const b1 = balloon(k, 'Lección dos: el ninja es invisible.', { size: 30, wrap: 300, tail: [-60, 70] });
  b1.position.set(80, -140);
  P[0].over.addChild(b1);
  // P2 · both behind a bush — the bush glows BLUE like a neon sign
  const bush = new Graphics();
  for (let i = 0; i < 9; i++) bush.circle(-180 + i * 45, 80 - (i % 2) * 30 - Math.sin(i) * 20, 70).fill(0xffffff).stroke({ width: 4, color: MG.ink });
  bush.rect(-240, 80, 480, 130).fill(0xffffff);
  const glowB = glow(ctx, LANTERN, 700, 0.0);
  const ears = new Graphics();
  P[1].content.addChild(tone(ctx, 620, 420, -310, -210, 0.15, 0.4), glowB, ears, bush);
  const neon = word(k, '¡AQUÍ ESTAMOS!', { fontFamily: 'Bangers', fontSize: 40, fill: LANTERN, stroke: { color: MG.ink, width: 5 } });
  neon.position.set(0, -150);
  P[1].over.addChild(neon);
  // P3 · a ninja cat appears behind them, taps a shoulder
  const n3 = ctx.actor(SLUG.ninja, 360);
  const bush3 = new Graphics();
  for (let i = 0; i < 9; i++) bush3.circle(-180 + i * 45, 120 - (i % 2) * 30, 60).fill(0xffffff).stroke({ width: 4, color: MG.ink });
  P[2].content.addChild(tone(ctx, 620, 420, -310, -210, 0.35, 0.4));
  if (n3) P[2].content.addChild(n3);
  P[2].content.addChild(bush3);
  const tap = word(k, 'tap tap', { fontFamily: 'Bangers', fontSize: 40, fill: MG.ink });
  tap.position.set(40, -120);
  P[2].over.addChild(tap);
  const q3 = new Container();
  const qb = new Graphics().circle(0, 0, 40).fill(0xffffff).stroke({ width: 4, color: MG.ink });
  const qt = word(k, '!?', { fontFamily: 'Bangers', fontSize: 50, fill: MG.ink });
  q3.addChild(qb, qt);
  q3.position.set(-150, -90);
  P[2].over.addChild(q3);
  // P4 · both hanging upside down, tied; she, dignified
  const rope = new Graphics().rect(-4, -210, 8, 120).fill(MG.dark);
  const l4 = luzOf(ctx, 280);
  const c4 = ctx.actor(ctx.canelo, 260);
  P[3].content.addChild(rope);
  if (c4) P[3].content.addChild(c4);
  if (l4.actor) P[3].content.addChild(l4.actor);
  const knots = new Graphics();
  P[3].content.addChild(knots);
  const b4 = balloon(k, 'Esa lección era para ti.', { size: 34, wrap: 280, tail: [-70, 60] });
  b4.position.set(140, -110);
  P[3].over.addChild(b4);
  return {
    update(lt, rm, step) {
      l1.actor?.pose(lt, -150, 200 + bob(lt, rm, 5));
      const la = lanternAt(l1);
      lamp1.position.set(la[0], la[1]);
      const mg = mask1.clear();
      const [mx, my] = onHead(l1.actor, 0, -0.2);
      ninjaMask(mg, mx, my, 120);
      reveal(b1, lt, OPEN[0] + 0.4, Infinity, rm);
      // P2: ears poking above the bush; the glow pulses like a sign
      const e = ears.clear();
      for (const [x, s] of [
        [-90, 1],
        [80, 1.1],
      ] as const) {
        e.poly([x - 40 * s, 30, x - 30 * s, -40 * s, x - 6 * s, 20]).fill(0xffffff).stroke({ width: 4, color: MG.ink });
        e.poly([x + 40 * s, 30, x + 30 * s, -40 * s, x + 6 * s, 20]).fill(0xffffff).stroke({ width: 4, color: MG.ink });
      }
      glowB.position.set(0, 60);
      glowB.alpha = lt < OPEN[1] ? 0 : (0.75 + (rm || ctx.rf ? 0 : 0.15 * Math.sin(lt * 9))) * sm(seg(lt, OPEN[1] + 0.3, OPEN[1] + 0.8));
      bush.tint = lt > OPEN[1] + 0.3 ? 0xbfeeff : 0xffffff;
      reveal(neon, lt, OPEN[1] + 1.0, Infinity, rm);
      // P3
      n3?.pose(lt, 170, 230 - sm(seg(lt, OPEN[2] + 0.3, OPEN[2] + 0.8)) * 60, { flip: true });
      reveal(tap, lt, OPEN[2] + 1.2, Infinity, rm);
      q3.visible = lt > OPEN[2] + 1.6;
      // P4: upside down (rot π), swinging a little
      const sw = rm ? 0 : Math.sin(lt * 2.2) * 0.06;
      c4?.pose(lt, -70, -100, { rot: Math.PI + sw, flip: false });
      l4.actor?.pose(lt, 90, -100, { rot: Math.PI - sw, flip: true });
      const kn = knots.clear();
      kn.moveTo(-70, -210).lineTo(-70, -96).moveTo(90, -210).lineTo(90, -96).stroke({ width: 6, color: MG.dark });
      kn.moveTo(-60, -100).lineTo(80, -100).stroke({ width: 6, color: MG.dark });
      reveal(b4, lt, OPEN[3] + 0.6, Infinity, rm);
      void step;
    },
  };
}
function tira3(ctx: SceneCtx, P: Panel[]): Built {
  const k = ctx.k;
  // P1 · Canelo with the sensei headband (he took it from her), arms crossed
  const c1 = ctx.actor(ctx.canelo, 330);
  const hb1 = new Graphics();
  if (c1) P[0].content.addChild(c1);
  P[0].content.addChild(hb1);
  const b1 = balloon(k, 'Aquí los ataques se gritan. Si no gritas, no cuenta.', { size: 28, wrap: 300, tail: [-80, 70] });
  b1.position.set(90, -130);
  P[0].over.addChild(b1);
  // P2 · Luzterna, red with shame, in tiny letters
  P[1].content.addChild(tone(ctx, 620, 420, -310, -210, 0.25, 0.4));
  const l2 = luzOf(ctx, 400);
  if (l2.actor) P[1].content.addChild(l2.actor);
  const sh = new Graphics();
  P[1].content.addChild(sh);
  const b2 = balloon(k, '…rayo…', { size: 18, wrap: 200, tail: [-40, 50], whisper: true });
  b2.position.set(120, -120);
  P[1].over.addChild(b2);
  // P3 · Canelo, paws as a megaphone: ¡MÁS FUERTE!
  const c3 = ctx.actor(ctx.canelo, 330);
  const meg = new Graphics();
  const lines3 = new Graphics();
  speedLines(lines3, -40, -40, 140, 520, { n: 46, color: MG.ink, seed: 9, width: 0.014 });
  P[2].content.addChild(lines3);
  if (c3) P[2].content.addChild(c3);
  P[2].content.addChild(meg);
  const b3 = balloon(k, '¡MÁS FUERTE!', { size: 54, wrap: 340, tail: [-90, 60], shout: true });
  b3.position.set(120, -120);
  P[2].over.addChild(b3);
  // P4 · she SHOUTS with the lantern up; the whole sea turns to look (the boats too); she hides behind the lantern
  const sea = new Graphics();
  sea.rect(-310, 60, 620, 150).fill(0xffffff).stroke({ width: 4, color: MG.ink });
  for (let i = 0; i < 5; i++) sea.moveTo(-300 + i * 130, 120).quadraticCurveTo(-270 + i * 130, 100, -240 + i * 130, 120).stroke({ width: 3, color: MG.ink });
  P[3].content.addChild(tone(ctx, 620, 420, -310, -210, 0.2, 0.4), sea);
  const boats = new Graphics();
  P[3].content.addChild(boats);
  const l4 = luzOf(ctx, 300);
  if (l4.actor) P[3].content.addChild(l4.actor);
  const lamp4 = glow(ctx, LANTERN, 260, 0.9);
  P[3].content.addChild(lamp4);
  const shout = word(k, '¡RAYO DE… LUZ… TERNA!', { fontFamily: 'Bangers', fontSize: 64, fill: 0xffffff, stroke: { color: MG.ink, width: 9 }, letterSpacing: 2 });
  shout.position.set(0, -165);
  shout.rotation = -0.04;
  P[3].over.addChild(shout);
  const sh4 = new Graphics();
  P[3].over.addChild(sh4);
  return {
    update(lt, rm, step) {
      c1?.pose(lt, 0, 200, { flip: true });
      const g1 = hb1.clear();
      const [hx, hy] = onHead(c1, 0, -0.75);
      headband(g1, hx, hy, 150, 0.05, rm ? 0 : step * 0.5, 0xffffff);
      g1.circle(hx, hy, 9).fill(MG.ink);
      reveal(b1, lt, OPEN[0] + 0.4, Infinity, rm);
      l2.actor?.pose(lt, -60, 260 + bob(lt, rm, 4), { rot: 0.06, sx: 0.98 });
      const s2 = sh.clear();
      const [fx, fy] = onHead(l2.actor, 0, 0.3);
      shame(s2, fx, fy, 1.2);
      sweat(s2, fx + 90, fy - 60, 1.2);
      reveal(b2, lt, OPEN[1] + 0.6, Infinity, rm);
      // P3
      c3?.pose(lt, -60, 230, { flip: true, sy: lt > OPEN[2] + 0.4 ? 1.04 : 1 });
      const m3 = meg.clear();
      const [mx, my] = onHead(c3, 0.6, 0.6);
      m3.poly([mx, my - 18, mx + 70, my - 50, mx + 70, my + 50, mx, my + 18]).fill(0xffffff).stroke({ width: 4, color: MG.ink });
      lines3.rotation = rm ? 0 : (step % 2) * 0.02;
      reveal(b3, lt, OPEN[2] + 0.4, Infinity, rm);
      // P4: the boats on the horizon turn toward her (a quarter turn, staggered)
      const bt = boats.clear();
      for (let i = 0; i < 4; i++) {
        const turn = sm(seg(lt, OPEN[3] + 0.8 + i * 0.15, OPEN[3] + 1.3 + i * 0.15));
        const x = -260 + i * 150 + (i > 1 ? 40 : 0);
        const w = 70 - turn * 40;
        bt.poly([x - w, 70, x + w, 70, x + w * 0.7, 96, x - w * 0.7, 96]).fill(0xffffff).stroke({ width: 3, color: MG.ink });
        bt.rect(x - 2, 20, 4, 50).fill(MG.ink);
        bt.poly([x, 24, x + w * 0.6 + 6, 56, x, 60]).fill(0xffffff).stroke({ width: 3, color: MG.ink });
        if (turn > 0.5) {
          // eyes on every boat
          bt.circle(x - 10, 82, 4).fill(MG.ink).circle(x + 10, 82, 4).fill(MG.ink);
        }
      }
      const cover = sm(seg(lt, OPEN[3] + 2.2, OPEN[3] + 2.6));
      l4.actor?.pose(lt, -80, 240 + bob(lt, rm, 4), { rot: -0.08 + cover * 0.14 });
      const la = lanternAt(l4);
      lamp4.position.set(la[0], la[1] - cover * 40);
      reveal(shout, lt, OPEN[3] + 0.4, Infinity, rm);
      const s4 = sh4.clear();
      if (cover > 0) {
        const [qx, qy] = onHead(l4.actor, 0, 0.2);
        shame(s4, qx, qy - 20, 1.3);
      }
    },
  };
}

function mod(which: 1 | 2 | 3): SetModule {
  const TITLE = { 1: 'LECCIÓN 1 · PUNTERÍA', 2: 'LECCIÓN 2 · SIGILO', 3: 'LECCIÓN 3 · EL GRITO' }[which];
  const SIDE = { 1: 'TIRA 1 · PIRATA', 2: 'TIRA 2 · NINJA', 3: 'TIRA 3 · ARTES MARCIALES' }[which];
  return {
    cats: ({ canelo }) => (which === 1 ? [SLUG.luz, canelo, SLUG.siames] : which === 2 ? [SLUG.luz, canelo, SLUG.ninja] : [SLUG.luz, canelo]),
    build(ctx: SceneCtx): FilmSet {
      const { panels, root, back } = frame(ctx, TITLE, SIDE);
      ctx.plane(back, { z: 1000, bake: 'static', res: 0.6 });
      ctx.plane(root, { z: 999 });
      const b = which === 1 ? tira1(ctx, panels) : which === 2 ? tira2(ctx, panels) : tira3(ctx, panels);
      return {
        update(lt, f) {
          panels.forEach((p, i) => p.show(lt, OPEN[i], f.rm, i === 3 ? 'drop' : 'pop'));
          b.update(lt, f.rm, f.step12);
        },
      };
    },
  };
}
export const tira1Set = mod(1);
export const tira2Set = mod(2);
export const tira3Set = mod(3);
void outBack;
void streaks;
