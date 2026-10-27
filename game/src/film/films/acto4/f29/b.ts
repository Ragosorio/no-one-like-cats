/**
 * F29 — the screen shots: a side screen filling the frame (malo, tailor), a fan's phone (emiau), and the two screens
 * that answer each other bar by bar when the game becomes a trap (trampa, LAYER 2).
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { LedPanel, POP, PhoneFrame, filterHost, glitchFilter, glitchSet } from '../../../styles/pop';
import { NG, NG_BAR } from '../music';
import { GlassCube, SLUG, bokeh, catHead, glowAt, outBack, rnd, seg, sm, word } from '../kit';
import { beatEnv, coverPose, emiauOf, firmaOf, maloOf, tailorOf } from './cast';
import { cursorBox, hudPlate, loadingBar } from './screens';
import { pixelText } from '../../../styles/pop';

const tx = (ctx: SceneCtx) => (n: string) => ctx.tex(n);
/** the dark stadium around a screen shot (static) */
function around(ctx: SceneCtx, seed: number) {
  const b = bokeh(ctx, { seed, n: 60, base: 0x0a0618 });
  ctx.plane(b, { z: 1500, bake: 'static' });
}
/** a striped field in a panel */
function stripes(p: LedPanel, a: number, b: number, n = 24) {
  const g = new Graphics();
  for (let i = 0; i < n; i++) g.rect(0, (p.h * i) / n, p.w, p.h / n + 1).fill(i % 2 ? a : b);
  p.content.addChild(g);
  return g;
}

// ------------------------------------------------------------------ c8–9 · malo: Gato Malo on a giant inflatable bunny
export const malo: SetModule = {
  cats: [SLUG.malo],
  build(ctx: SceneCtx): FilmSet {
    around(ctx, 8);
    const p = new LedPanel(tx(ctx), 700, 1000, { dots: 0.4, bw: 22 });
    p.position.set(610, 40);
    stripes(p, POP.mint, 0xfff3a8);
    const name = word(ctx.k, 'GATO MALO', { fontFamily: 'Bangers', fontSize: 120, fill: POP.hot, stroke: { color: POP.ink, width: 10 }, letterSpacing: 6 });
    name.position.set(350, 110);
    p.content.addChild(name);
    // the inflatable bunny: a pastel pink balloon, long ears, a knot, a shine
    const bunC = new Container();
    const bun = new Graphics();
    bunC.addChild(bun);
    const bx = 350;
    const by = 760;
    bun.ellipse(bx, by, 290, 170).fill(0xffb4d4).stroke({ width: 8, color: POP.ink });
    bun.ellipse(bx + 200, by - 160, 120, 110).fill(0xffb4d4).stroke({ width: 8, color: POP.ink });
    for (const [ex, rot] of [
      [bx + 170, -0.25],
      [bx + 250, 0.2],
    ] as const) {
      const e = new Graphics().ellipse(0, -110, 38, 120).fill(0xffb4d4).stroke({ width: 8, color: POP.ink }).ellipse(0, -110, 18, 90).fill(0xff8ab8);
      e.position.set(ex, by - 240);
      e.rotation = rot;
      bunC.addChild(e);
    }
    bun.circle(bx + 230, by - 170, 12).fill(POP.ink).circle(bx + 160, by - 175, 12).fill(POP.ink);
    bun.ellipse(bx - 120, by - 70, 70, 30).fill({ color: 0xffffff, alpha: 0.6 });
    bun.circle(bx - 300, by + 40, 18).fill(0xff8ab8).stroke({ width: 6, color: POP.ink });
    p.content.addChild(bunC);
    const ml = maloOf(ctx, 560);
    if (ml.actor) p.content.addChild(ml.actor);
    const pl = new Container();
    pl.addChild(p);
    ctx.plane(pl, { z: 1000 });
    return {
      update(lt, f) {
        const rm = f.rm;
        const m = f.m;
        const e = beatEnv(m, 8);
        bunC.scale.set(1, 1 - e * 0.03);
        bunC.position.set(0, e * 12);
        // sitting sideways on it, waving (a little turn on each beat)
        ml.actor?.pose(lt, 330, 640 + e * 12, { rot: Math.sin(m * Math.PI / 0.667) * 0.06 * (rm ? 0.3 : 1), flip: true, step: ctx.k.beatStep(m) });
        ml.follow();
        name.scale.set(1 + e * 0.05);
      },
    };
  },
};

// ------------------------------------------------------------------ c9–11 · tailor: Tailor Swift spins, throws a bracelet
export const tailor: SetModule = {
  cats: [SLUG.tailor],
  build(ctx: SceneCtx): FilmSet {
    around(ctx, 9);
    const p = new LedPanel(tx(ctx), 700, 1000, { dots: 0.4, bw: 22 });
    p.position.set(610, 40);
    stripes(p, POP.lilac, 0xf0e4ff);
    const name = word(ctx.k, 'TAILOR SWIFT', { fontFamily: 'Dela Gothic One', fontSize: 70, fill: 0xffffff, stroke: { color: POP.violet, width: 9 }, letterSpacing: 2 });
    name.position.set(350, 100);
    p.content.addChild(name);
    const tl = tailorOf(ctx, 640);
    if (tl.actor) p.content.addChild(tl.actor);
    const sparks: Sprite[] = [];
    for (let i = 0; i < 14; i++) {
      const s = new Sprite(ctx.tex('pop:spark')!);
      s.anchor.set(0.5);
      s.blendMode = 'add';
      s.tint = [0xffffff, POP.pink, POP.cyan][i % 3];
      p.content.addChild(s);
      sparks.push(s);
    }
    const pl = new Container();
    pl.addChild(p);
    ctx.plane(pl, { z: 1000 });
    // the bracelet she throws flies OUT of the screen toward the crowd (screen plane, in front)
    const brac = new Graphics();
    const cols = [POP.pink, POP.yellow, POP.cyan, POP.mint, POP.lilac, 0xffffff];
    for (let i = 0; i < 12; i++) brac.circle(Math.cos((i / 12) * 6.28) * 40, Math.sin((i / 12) * 6.28) * 40, 11).fill(cols[i % cols.length]).stroke({ width: 3, color: POP.ink });
    const bp = new Container();
    bp.addChild(brac);
    ctx.plane(bp, { z: 0, screen: true });
    const THROW = NG(10) - NG(9) + 0.3;
    return {
      update(lt, f) {
        const rm = f.rm;
        const m = f.m;
        const step = ctx.k.beatStep(m, 12);
        // she spins: the flip changes on twos while she turns (calmer with «Reducir movimiento»)
        const spin = lt < THROW ? Math.floor(lt * (rm ? 2 : 6)) % 2 === 0 : false;
        tl.actor?.pose(lt, 350, 980, { flip: spin, rot: lt >= THROW && lt < THROW + 0.5 ? -0.12 * outBack(seg(lt, THROW, THROW + 0.3)) : 0, step });
        tl.follow();
        sparks.forEach((s, i) => {
          const a = i * 0.9 + lt * 2;
          const r = 200 + (i % 4) * 60;
          s.position.set(350 + Math.cos(a) * r * 0.9, 560 + Math.sin(a) * r * 0.7);
          const tw = Math.abs(Math.sin(lt * 5 + i * 1.7));
          s.scale.set(0.25 + tw * 0.35);
          s.alpha = ctx.rf ? 0.4 : 0.6 + 0.4 * tw;
        });
        const q = seg(lt, THROW, THROW + 1.1);
        brac.visible = q > 0 && q < 1;
        bp.position.set(1060 + q * 700, 520 - Math.sin(q * Math.PI) * 360 + q * 500);
        brac.rotation = q * 8;
        brac.scale.set(1 + q * 2.2);
      },
    };
  },
};

// ------------------------------------------------------------------ c11–13 · emiau: a fan's phone, EMIAU on the runway
export const emiau: SetModule = {
  cats: [SLUG.emiau],
  build(ctx: SceneCtx): FilmSet {
    around(ctx, 11);
    const ph = new PhoneFrame(tx(ctx), 520, 924, 0);
    const c = ph.content;
    const g = new Graphics();
    for (let i = 0; i < 20; i++) g.rect(0, i * 48, 520, 49).fill(i < 10 ? 0x1a0c34 : 0x2a1450);
    // the runway in perspective, its cyan edges
    g.poly([180, 520, 340, 520, 520, 924, 0, 924]).fill(0x24183e);
    g.moveTo(180, 520).lineTo(0, 924).stroke({ width: 8, color: POP.cyan });
    g.moveTo(340, 520).lineTo(520, 924).stroke({ width: 8, color: POP.cyan });
    c.addChild(g);
    for (let i = 0; i < 8; i++) {
      const s = glowAt(ctx, 40 + i * 64, 470 - (i % 2) * 30, 0.35, [POP.pink, POP.cyan, POP.yellow][i % 3], 0.6);
      if (s) c.addChild(s);
    }
    const em = emiauOf(ctx, 500);
    if (em.actor) c.addChild(em.actor);
    const heads = new Graphics();
    for (let i = 0; i < 9; i++) catHead(heads, -10 + i * 66, 900 - (i % 2) * 24, 46);
    heads.fill(0x07040e);
    for (let i = 0; i < 4; i++) heads.roundRect(40 + i * 130, 760 - (i % 2) * 30, 22, 140, 10).fill(0x07040e);
    c.addChild(heads);
    ph.position.set(700, 70);
    const pl = new Container();
    pl.addChild(ph);
    ctx.plane(pl, { z: 1000 });
    // two more fans recording, out of focus at the sides
    const side = new Container();
    for (const [x, y, r] of [
      [180, 380, -0.12],
      [1500, 420, 0.1],
    ] as const) {
      const q = new PhoneFrame(tx(ctx), 260, 462, 0);
      q.content.addChild(new Graphics().rect(0, 0, 260, 462).fill(0x2a1450));
      const s = ctx.still(SLUG.emiau);
      if (s) {
        s.scale.set(300 / (s.texture.height || 700));
        s.position.set(130, 440);
        q.content.addChild(s);
      }
      q.position.set(x, y);
      q.rotation = r;
      q.alpha = 0.75;
      side.addChild(q);
    }
    ctx.plane(side, { z: 1250, bake: 'dof', blur: 8, dof: 300 });
    return {
      update(lt, f) {
        const rm = f.rm;
        const m = f.m;
        const e = beatEnv(m, 8);
        const step = ctx.k.beatStep(m);
        // the rap hand gestures: a punch of the head and a lean on every beat
        const b = Math.floor(m / 0.667) % 4;
        em.actor?.pose(lt, 260 + Math.sin(lt * 0.8) * 30, 880, { rot: [-0.07, 0.05, -0.03, 0.08][b] * (rm ? 0.3 : 1), sx: 1 + e * 0.04, sy: 1 - e * 0.03, step });
        em.follow();
        ph.update(lt + 9);
        // the fan screams: the phone shakes on the beats (handheld is the camera's; this is the hand holding it)
        ph.rotation = rm ? 0 : Math.sin(lt * 13) * 0.012 + e * 0.01;
      },
    };
  },
};

// ------------------------------------------------------------------ c27–35 · trampa: LAYER 2 — two screens answer each other
export const trampa: SetModule = {
  cats: ({ canelo }) => [SLUG.firma, SLUG.cerito, canelo, SLUG.hipo, 'luzterna'],
  build(ctx: SceneCtx): FilmSet {
    around(ctx, 27);
    const gl = glitchFilter();
    const host = filterHost([gl]);
    const L = new LedPanel(tx(ctx), 860, 980, { dots: 0.4, bw: 20 });
    L.position.set(80, 50);
    const R = new LedPanel(tx(ctx), 860, 980, { dots: 0.4, bw: 20 });
    R.position.set(980, 50);
    host.addChild(L, R);
    ctx.plane(host, { z: 1000 });
    // LEFT · the show: Firma's feed (sings / blows a kiss / points at the cube)
    stripes(L, 0xffd8a8, 0xffc890, 20);
    const fm = firmaOf(ctx, 900);
    if (fm.actor) L.content.addChild(fm.actor);
    const heart = new Graphics().moveTo(0, 30).bezierCurveTo(-60, -20, -30, -70, 0, -40).bezierCurveTo(30, -70, 60, -20, 0, 30).fill(POP.hot).stroke({ width: 6, color: POP.ink });
    L.content.addChild(heart);
    const notes = new Graphics();
    L.content.addChild(notes);
    const arrow = new Graphics().poly([0, -26, 110, -26, 110, -60, 180, 0, 110, 60, 110, 26, 0, 26]).fill(POP.yellow).stroke({ width: 6, color: POP.ink });
    L.content.addChild(arrow);
    const lHud = hudPlate([{ text: 'PREMIO: CERITO', px: 8, color: POP.cyan }], 760, { border: POP.red });
    lHud.root.position.set(50, 360);
    L.content.addChild(lHud.root);
    // RIGHT · the HUD: the prize under a cursor / the loading bar / JUGADOR 2: ? over the crew on the beams
    R.content.addChild(new Graphics().rect(0, 0, 860, 980).fill(0x07041a));
    const prize = new Container();
    const cube = new GlassCube(ctx, 360);
    cube.position.set(430, 760);
    const cur = new Graphics();
    cursorBox(cur, 230, 330, 400, 460, POP.red, 10);
    const pt = new Graphics();
    pixelText(pt, 'PREMIO: CERITO', 430, 120, 9, POP.cyan, { align: 'center', shadow: 0x000000 });
    prize.addChild(cube, cur, pt);
    R.content.addChild(prize);
    const load = new Graphics();
    R.content.addChild(load);
    const p2 = new Container();
    const beams = new Graphics();
    beams.rect(0, 540, 860, 14).fill(0x8a8aa0).rect(0, 600, 860, 14).fill(0x8a8aa0);
    for (let x = 0; x < 860; x += 60) beams.moveTo(x, 547).lineTo(x + 30, 607).lineTo(x + 60, 547).stroke({ width: 4, color: 0x8a8aa0 });
    p2.addChild(beams);
    const crew = [ctx.canelo, SLUG.hipo, 'luzterna'].map((s, i) => {
      const st = ctx.still(s);
      if (st) {
        st.scale.set(220 / (st.texture.height || 700));
        st.position.set(200 + i * 230, 545 - (s === 'luzterna' ? 30 : 0));
        st.tint = 0xb8b8d8;
        p2.addChild(st);
      }
      return st;
    });
    void crew;
    const j2 = new Graphics();
    pixelText(j2, 'JUGADOR 2: ?', 430, 180, 10, POP.red, { align: 'center', shadow: 0x000000 });
    const crossG = new Graphics();
    cursorBox(crossG, 120, 330, 640, 260, POP.red, 10);
    p2.addChild(j2, crossG);
    R.content.addChild(p2);
    const bars = (b: number) => NG(b) - NG(27);
    return {
      filters: [gl],
      update(lt, f) {
        const rm = f.rm;
        const m = f.m;
        const bar = 27 + Math.floor(lt / NG_BAR + 1e-6);
        const inBar = (lt - bars(bar)) / NG_BAR;
        // who's lit: arpeggio bars (c28 30 32) = the show · Tap bars (c29 31 33) = the HUD · c27 both · c34 both HUD
        const leftOn = bar === 27 || bar === 28 || bar === 30 || bar === 32;
        const rightOn = bar === 27 || bar === 29 || bar === 31 || bar === 33 || bar >= 34;
        const dimL = leftOn || bar >= 34 ? 1 : 0.45;
        const dimR = rightOn ? 1 : 0.45;
        L.content.alpha += (dimL - L.content.alpha) * (rm ? 1 : 0.5);
        R.content.alpha += (dimR - R.content.alpha) * (rm ? 1 : 0.5);
        L.content.alpha = dimL;
        R.content.alpha = dimR;
        const step = ctx.k.beatStep(m);
        const pose = coverPose(m, rm);
        const point = bar === 32;
        fm.actor?.pose(lt, 430, 1060, { ...pose, rot: point ? -0.14 : pose.rot, flip: point ? false : pose.flip, step });
        fm.follow();
        heart.visible = bar === 30;
        heart.position.set(560 + inBar * 200, 380 - inBar * 220);
        heart.scale.set(rm ? 1 : 0.6 + outBack(Math.min(1, inBar * 3)) * 0.6);
        const n = notes.clear();
        if (bar === 28) for (let i = 0; i < 4; i++) {
          const t = (inBar + i * 0.25) % 1;
          const x = 560 + i * 50 + t * 80;
          const y = 520 - t * 300;
          n.circle(x, y, 14).fill({ color: POP.ink, alpha: 1 - t }).rect(x + 10, y - 60, 6, 60).fill({ color: POP.ink, alpha: 1 - t });
        }
        arrow.visible = point;
        arrow.position.set(560 + Math.sin(lt * 10) * 10 * (rm ? 0 : 1), 520);
        lHud.root.visible = bar >= 34;
        // the HUD: c29 the prize · c31 the loading bar at 70 % · c33 JUGADOR 2: ? · c34 everything at once
        prize.visible = bar === 27 || bar === 29 || bar >= 34;
        cube.update(lt, { stare: 0.8 });
        cur.alpha = Math.floor(lt * 4) % 2 ? 1 : 0.4;
        const lg = load.clear();
        if (bar === 31 || bar >= 34) loadingBar(lg, 140, bar >= 34 ? 40 : 380, 540, bar >= 34 ? 0.7 : 0.7 * sm(Math.min(1, inBar * 1.6)), 6);
        p2.visible = bar === 33 || bar >= 34;
        j2.visible = Math.floor(lt * 4) % 2 === 0;
        crossG.alpha = 0.6 + 0.4 * Math.sin(lt * 8);
        // the distortion is in: the glitch breathes with the bars, peaks on the HUD's entrances
        const st = Math.floor(lt * 12);
        const g = ctx.rf ? 0 : (bar === 27 ? 0.6 * (1 - Math.min(1, inBar * 2)) : 0) + (inBar < 0.12 ? 0.45 : 0.08) + (bar >= 34 ? 0.25 : 0);
        glitchSet(gl, g, st, 16);
        void rnd;
      },
    };
  },
};
