/**
 * F08 · c105–c123 — ¡OH SHIT! 2: the BURST (O27: one bar per universe, each with its censorship and Cerito in its
 * trace), «te tengo» (O28), the last crack to a blank page (O29, c115), and the landing in CIUDAD MAYÚSCULA
 * (O30–O33: the panel builds itself, ¡CAE!, he collapses two seconds, the lantern points up: the cat-signal).
 */
import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { building } from '../../../styles/noir';
import { Beam, CERITO, HOMIAU, Homiau, TV, TvScreen, balloon, kitTex, lanternAt, outBack, popIn, rnd, seg, sm, word } from '../kit';
import { Cerito, Drive, MULTI, Rift, T, Trio, hanging, impact, rigPoint, speedLines, wrapScroll } from './lib';
import { pageFrame } from './s2';

const BAR = T(38);

// ================================================================== the burst: one bar per universe
type Draw = (ctx: SceneCtx, root: Container) => ((lt: number) => void) | void;
/**
 * A micro-universe of one bar: its picture (`draw`), the trio flashing by, Cerito in its trace, a censored «OH SH—»
 * (`censor`: a beep bar, a strike-through, a scribble, grawlix…), and a frame.
 */
function micro(draw: Draw, censor: (ctx: SceneCtx) => Container, o: { trio?: [number, number]; cer?: [number, number]; frame?: 'page' | 'tv' | 'none'; cats?: string[] } = {}): SetModule {
  return {
    cats: ({ canelo }) => [canelo, 'luzterna', 'hipolito_tavern_cat', CERITO, ...(o.cats ?? [])],
    build(ctx): FilmSet {
      const root = new Container();
      const live = draw(ctx, root);
      const trio = new Trio(ctx, 230);
      const cer = new Cerito(ctx, 120);
      root.addChild(cer, trio.root);
      ctx.plane(root, { z: 1000 });
      const cen = censor(ctx);
      const ui = new Container();
      ui.addChild(cen);
      if (o.frame === 'page') ui.addChild(pageFrame(ctx, { m: 26, tilt: 14 }));
      ctx.plane(ui, { z: 0, screen: true });
      const tv = o.frame === 'tv' ? new TvScreen(ctx) : null;
      if (tv) ctx.plane(tv, { z: 0, screen: true });
      const [tx, ty] = o.trio ?? [1100, 560];
      const [cx, cy] = o.cer ?? [420, 860];
      return {
        update(lt, f) {
          live?.(lt);
          // they flash through diagonally in one bar
          const p = seg(lt, 0, BAR);
          trio.update(lt, f, { x: tx - 260 + p * 340, y: ty - 320 + p * 520, s: 0.85, hold: 1, tumble: 0.9, luz: [210, -190], hipo: [-250, -40] });
          cer.position.set(cx, cy);
          cer.update(lt, { stare: 0.6 });
          cen.scale.set(ctx.rm ? 1 : 0.85 + 0.15 * outBack(seg(lt, 0.05, 0.25)));
          tv?.update(f);
        },
      };
    },
  };
}
const label = (ctx: SceneCtx, text: string, size: number, fill: number, font = 'Bangers', stroke = 0x101010) => impact(ctx, text, size, fill, stroke, font);
/** the censorships */
const beepBar = (ctx: SceneCtx) => {
  const c = new Container();
  const g = new Graphics().roundRect(-330, -60, 660, 120, 12).fill(0x101010).stroke({ width: 6, color: 0xffffff });
  const t = label(ctx, 'BIIIIIP', 84, 0xffffff, 'Anton');
  c.addChild(g, t);
  c.position.set(960, 190);
  return c;
};
const strike = (ctx: SceneCtx) => {
  const c = new Container();
  const t = label(ctx, '¡OH SH—!', 120, 0xffffff, 'Bangers', 0xd94a8a);
  const g = new Graphics().moveTo(-340, 10).lineTo(340, -6).stroke({ width: 22, color: 0xd8262e, cap: 'round' });
  c.addChild(t, g);
  c.position.set(960, 190);
  return c;
};
const scribble = (ctx: SceneCtx) => {
  const c = new Container();
  const t = label(ctx, '¡OH SH—!', 120, 0x58d0ff, 'Bangers', 0x1d2a6e);
  const g = new Graphics();
  let x = -320;
  g.moveTo(x, 0);
  for (let i = 0; i < 26; i++) {
    x += 26;
    g.lineTo(x, (i % 2 ? -1 : 1) * (30 + rnd(i) * 30));
  }
  g.stroke({ width: 12, color: 0xff3d8b, join: 'round' });
  c.addChild(t, g);
  c.position.set(960, 190);
  return c;
};
const pixelCuss = (ctx: SceneCtx) => {
  const c = new Container();
  const t = label(ctx, '@#$%!', 110, 0xffe23a, 'Space Grotesk', 0x2a3aff);
  c.addChild(t);
  c.position.set(960, 190);
  return c;
};
const clayCuss = (ctx: SceneCtx) => {
  const c = new Container();
  const t = label(ctx, '¡OH SH—!', 110, 0xf2a0b0, 'Bangers', 0x7a3a2a);
  const thumbG = new Graphics();
  thumbG.ellipse(80, 0, 150, 110).fill(0xd88a6a).stroke({ width: 7, color: 0x7a3a2a });
  for (let i = 1; i < 6; i++) thumbG.ellipse(80, 0, i * 26, i * 19).stroke({ width: 3, color: 0x9a5a3a, alpha: 0.6 });
  c.addChild(t, thumbG);
  c.position.set(960, 190);
  return c;
};
const grawlix = (ctx: SceneCtx) => {
  const c = new Container();
  const b = balloon(ctx.k, '¡#@%&!', { size: 90, tail: [40, 110] });
  c.addChild(b);
  c.position.set(900, 210);
  return c;
};
const donaCuss = (ctx: SceneCtx) => {
  const c = new Container();
  const b = balloon(ctx.k, '¡OH, DONA!', { size: 84, tail: [-120, 110] });
  c.addChild(b);
  c.position.set(1000, 200);
  return c;
};
const sealCuss = (ctx: SceneCtx) => {
  const c = new Container();
  const t = label(ctx, '¡OH SH—!', 110, 0xf3ead8, 'Dela Gothic One', 0x1f2a44);
  const g = new Graphics().roundRect(60, -80, 170, 170, 18).fill(0xc8402e).stroke({ width: 6, color: 0x7a1a10 });
  const s = label(ctx, '猫', 110, 0xf3ead8, 'Dela Gothic One', 0x7a1a10);
  s.position.set(145, 5);
  c.addChild(t, g, s);
  c.position.set(900, 190);
  return c;
};

/** a rooftop in rain (noir) for Gato Araña Noir (crouched on the edge) / Murciégato (standing): their paintings */
const noirRoof = (ctx: SceneCtx, root: Container, who: 'spider' | 'bat') => {
  const g = new Graphics();
  g.rect(-400, -400, 2720, 1900).fill(0x07090d);
  g.circle(1400, 280, 160).fill(0xd8dce4);
  for (let i = 0; i < 9; i++) building(g, -300 + i * 280, 520 + (i % 3) * 50, 250, 900, { seed: 70 + i, color: 0x141922, lit: 0.18, cols: 4, rows: 10 });
  g.rect(-400, 860, 2720, 400).fill(0x1d232d);
  root.addChild(g);
  const fig = new Container();
  const a = who === 'spider' ? ctx.actor(MULTI.aranyaNoir, 420) : ctx.actor(MULTI.murciegato, 560);
  if (a) {
    if (who === 'spider') a.scale.x = -1;
    fig.addChild(a);
  }
  fig.position.set(1400, 865);
  root.addChild(fig);
  const rain = new Graphics();
  for (let i = 0; i < 120; i++) rain.moveTo(rnd(i) * 1920, rnd(i + 3) * 1200).lineTo(rnd(i) * 1920 - 18, rnd(i + 3) * 1200 + 60).stroke({ width: 2, color: 0x9aa4b8, alpha: 0.6 });
  root.addChild(rain);
  return (lt: number) => {
    rain.y = wrapScroll(lt * -1400, 600) + 300;
  };
};

export const r1: SetModule = micro((ctx, root) => noirRoof(ctx, root, 'spider'), beepBar, { cats: [MULTI.aranyaNoir] });
export const r2: SetModule = micro(
  (ctx, root) => {
    const g = new Graphics();
    g.rect(-400, -400, 2720, 1900).fill(0xf8d0e8);
    for (let i = 0; i < 30; i++) g.circle(rnd(i) * 1920, rnd(i + 2) * 1080, 30 + rnd(i + 5) * 60).fill({ color: 0xb8e8ff, alpha: 0.6 });
    const dots = new TilingSprite({ texture: ctx.tex('cm:dots') ?? kitTex(ctx, 'glow'), width: 2400, height: 1500 });
    dots.position.set(-240, -200);
    dots.tint = 0xd94a8a;
    dots.alpha = 0.25;
    // Gata Araña (her painting: the white hood, pink and teal) swings on her line
    const sp = hanging(ctx, MULTI.aranyaBlanca, 360).root;
    sp.position.set(1450, 380);
    sp.rotation = -0.15;
    const line = new Graphics().moveTo(1450, -200).lineTo(1450, 380).stroke({ width: 4, color: 0xffffff });
    root.addChild(g, dots, line, sp);
    return (lt: number) => {
      sp.rotation = -0.15 + Math.sin(lt * 3) * (ctx.rm ? 0.05 : 0.2);
    };
  },
  strike,
  { frame: 'page', cats: [MULTI.aranyaBlanca] },
);
export const r3: SetModule = micro(
  (ctx, root) => {
    const g = new Graphics();
    g.rect(-400, -400, 2720, 1900).fill(0x0a0a2a);
    for (let i = 0; i < 12; i++) {
      const x = -200 + i * 190;
      const h = 400 + rnd(i) * 500;
      g.rect(x, 1080 - h, 160, h).fill(0x141448).stroke({ width: 4, color: [0xff3d8b, 0x58d0ff][i % 2] });
      for (let r = 0; r < 8; r++) g.rect(x + 20, 1080 - h + 30 + r * 50, 120, 6).fill({ color: [0xff3d8b, 0x58d0ff][(i + r) % 2], alpha: 0.7 });
    }
    // Gato Araña 2099 (his painting: dark blue and red, the lens eyes) crouched on a neon tower
    const a = ctx.actor(MULTI.aranya2099, 380);
    if (a) {
      a.position.set(1450, 700);
      a.scale.x = -1;
      root.addChild(g, a);
    } else root.addChild(g);
  },
  scribble,
  { frame: 'page', cats: [MULTI.aranya2099] },
);
export const r4: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', 'hipolito_tavern_cat', CERITO],
  build(ctx): FilmSet {
    // a PIXEL Canelo on a platform waves at our Canelo flying by (both in pixels)
    const root = new Container();
    const g = new Graphics();
    g.rect(-400, -400, 2720, 1900).fill(0x5a8aff);
    for (let i = 0; i < 8; i++) g.rect(100 + i * 240, 160 + (i % 3) * 40, 120, 40).fill(0xffffff);
    for (let x = 0; x < 1920; x += 48) g.rect(x, 900, 46, 46).fill(0xc8642a).stroke({ width: 3, color: 0x5a2a10 });
    g.rect(1200, 640, 480, 46).fill(0xc8642a);
    root.addChild(g);
    const drive = new Drive();
    const twin = drive.add(ctx.actor(ctx.canelo, 260));
    if (twin) root.addChild(twin);
    const trio = new Trio(ctx, 230);
    const cer = new Cerito(ctx, 110);
    root.addChild(cer, trio.root);
    ctx.plane(root, { z: 1000 });
    const cen = pixelCuss(ctx);
    ctx.plane(cen, { z: 0, screen: true });
    return {
      update(lt, f) {
        drive.tick(lt);
        const t8 = Math.floor(lt * 8) / 8;
        twin?.pose(t8, 1440, 640, { flip: true, sy: 1 + (Math.floor(lt * 6) % 2) * 0.06 });
        const p = seg(lt, 0, BAR);
        trio.update(t8, f, { x: 640 + p * 300, y: 260 + p * 420, s: 0.85, hold: 1, tumble: 0.5, luz: [210, -190], hipo: [-250, -40] });
        cer.position.set(300, 880);
        cer.update(lt);
      },
    };
  },
};
export const r5: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', 'hipolito_tavern_cat', CERITO],
  build(ctx): FilmSet {
    // a CLAY Canelo eating at a clay table, sees our Canelo pass
    const root = new Container();
    const g = new Graphics();
    g.rect(-400, -400, 2720, 1900).fill(0xb8d89a);
    g.roundRect(1100, 780, 700, 60, 30).fill(0xf2a0b0).stroke({ width: 7, color: 0x7a3a2a });
    root.addChild(g);
    const drive = new Drive();
    const twin = drive.add(ctx.actor(ctx.canelo, 300));
    if (twin) root.addChild(twin);
    const trio = new Trio(ctx, 230);
    const cer = new Cerito(ctx, 110);
    root.addChild(cer, trio.root);
    ctx.plane(root, { z: 1000 });
    const cen = clayCuss(ctx);
    ctx.plane(cen, { z: 0, screen: true });
    return {
      update(lt, f) {
        drive.tick(lt);
        const t2 = Math.floor(lt * 12) / 12;
        twin?.pose(t2, 1450, 800, { flip: true, rot: Math.sin(t2 * 2) * 0.05 });
        const p = seg(lt, 0, BAR);
        trio.update(t2, f, { x: 560 + p * 300, y: 240 + p * 440, s: 0.85, hold: 1, tumble: 0.5, luz: [210, -190], hipo: [-250, -40] });
        cer.position.set(300, 900);
        cer.update(lt);
      },
    };
  },
};
export const r6: SetModule = micro((ctx, root) => noirRoof(ctx, root, 'bat'), grawlix, { cats: [MULTI.murciegato] });
export const r7: SetModule = micro(
  (ctx, root) => {
    // a Homiau from another TV (his painting, in this TV's colours): his donut, his living room
    const g = new Graphics();
    g.rect(-400, -400, 2720, 1900).fill(0xc8e0a0);
    g.roundRect(1080, 600, 640, 300, 60).fill(0xd86a8a).stroke({ width: 7, color: TV.line });
    root.addChild(g);
    const h = new Homiau(ctx);
    h.position.set(1400, 900);
    h.scale.set(1.1);
    root.addChild(h);
    return (lt: number) => h.act(lt, { chew: 1, raise: 0.4 + 0.2 * Math.sin(lt * 3) });
  },
  donaCuss,
  { frame: 'tv', cats: [HOMIAU] },
);
export const r8: SetModule = micro(
  (ctx, root) => {
    // a woodblock wave with a little boat (another box, another trace)
    const g = new Graphics();
    g.rect(-400, -400, 2720, 1900).fill(0xefe4cc);
    g.circle(1500, 300, 90).fill(0xc8402e);
    for (let i = 0; i < 6; i++) {
      const y = 700 + i * 60;
      g.moveTo(-200, y);
      for (let x = -200; x <= 2120; x += 80) g.quadraticCurveTo(x + 40, y - 40 - (i === 0 ? 220 * Math.exp(-((x - 1300) ** 2) / 90000) : 0), x + 80, y);
      g.lineTo(2120, 1500).lineTo(-200, 1500).fill(i % 2 ? 0x1f2a44 : 0x3a5a8a);
    }
    for (let i = 0; i < 18; i++) g.circle(1150 + rnd(i) * 300, 430 + rnd(i + 3) * 120, 12 + rnd(i + 5) * 14).fill(0xf3ead8);
    root.addChild(g);
  },
  sealCuss,
);

// ================================================================== c113–c117: «te tengo» (O28) + the last crack (O29)
export const tengo: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', 'hipolito_tavern_cat'],
  build(ctx): FilmSet {
    // calm: a deep blue fall with little panels of other universes drifting by, out of focus
    const back = new Graphics();
    back.rect(-400, -400, 2720, 1900).fill(0x101a4a);
    for (let i = 0; i < 18; i++) {
      const x = rnd(i) * 1920;
      const y = rnd(i + 4) * 2200 - 400;
      const w = 160 + rnd(i + 8) * 200;
      back.rect(x, y, w, w * 0.7).fill([0xff6aa8, 0xf4c430, 0x58d0ff, 0x7fd39a, 0xd8a050][i % 5]).stroke({ width: 8, color: 0xffffff });
    }
    const backC = new Container();
    backC.addChild(back);
    ctx.plane(backC, { z: 2600, bake: 'dof', blur: 14, dof: 1200 });
    const trio = new Trio(ctx, 620);
    const warm = new Sprite(kitTex(ctx, 'glow'));
    warm.anchor.set(0.5);
    warm.tint = 0xffd8a0;
    warm.blendMode = 'add';
    const c = new Container();
    c.addChild(warm, trio.root);
    ctx.plane(c, { z: 1000 });
    const rift = new Rift(115, ctx.k.view);
    ctx.plane(rift, { z: 0, screen: true });
    const CRACK = T(115) - T(113);
    let smiled = false;
    return {
      update(lt, f) {
        const rm = ctx.rm;
        backC.y = wrapScroll(lt * (rm ? 120 : 360), 1100);
        // a medium shot of her, the scarf held tight; she looks at him and smiles (her light warms)
        trio.update(lt, f, { x: 620, y: 1250, s: 1, hold: 1, tumble: 0.15, luz: [520, -420], hipo: [-900, 0], noHipo: true });
        const la = trio.luz.actor;
        if (la) {
          const [lx, ly] = lanternAt(trio.luz);
          warm.position.set(la.x, la.y - 300);
          warm.scale.set(3.2);
          warm.alpha = 0.18 + 0.2 * sm(seg(lt, 0.8, 1.6));
          if (!smiled && lt > 1.0) {
            smiled = true;
            la.emote('happy', 1);
          }
          if (lt < 0.5) smiled = false;
          void lx;
          void ly;
        }
        rift.crack(sm(seg(lt, CRACK, CRACK + 0.25)), sm(seg(lt, CRACK + 0.5, CRACK + 1.6)), rm);
      },
    };
  },
};

// ================================================================== c117–c123: CIUDAD MAYÚSCULA (the landing)
export const ciudad: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', 'hipolito_tavern_cat'],
  build(ctx): FilmSet {
    const k = ctx.k;
    // the sunset sky with clouds (the cat-signal lands on them)
    const sky = new Graphics();
    const cols = [0x2a1a5a, 0x5a2a8a, 0x9a3a8a, 0xe86a5a, 0xf4a64a];
    cols.forEach((c, i) => sky.rect(-600, -900 + i * 360, 3120, 380).fill(c));
    for (let i = 0; i < 9; i++) sky.ellipse(-200 + i * 320, -380 + (i % 3) * 90, 260, 70).fill({ color: 0x7a4a9a, alpha: 0.8 });
    ctx.plane(sky, { z: 4000 });
    const city = new Graphics();
    for (let i = 0; i < 16; i++) {
      const x = -500 + i * 190;
      const h = 380 + rnd(i * 3) * 520;
      city.rect(x, 900 - h, 170, h + 400).fill(i % 2 ? 0x2a1a4a : 0x3a2a5a).stroke({ width: 5, color: 0x101010 });
      for (let r = 0; r < 10; r++) if (rnd(i * 31 + r) > 0.55) city.rect(x + 30 + (r % 3) * 40, 900 - h + 40 + Math.floor(r / 3) * 70, 22, 34).fill(0xffd27a);
    }
    ctx.plane(city, { z: 2200, bake: 'static' });
    // hero silhouettes on far rooftops (they turn toward the signal)
    const heroes = new Container();
    const heroG: Graphics[] = [];
    for (const [x, y] of [
      [380, 520],
      [1380, 470],
      [1720, 600],
    ] as const) {
      const g = new Graphics();
      g.poly([-30, 0, -40, -80, -20, -120, -26, -150, -10, -128, 10, -128, 26, -150, 20, -120, 40, -80, 30, 0]).fill(0x101010);
      g.poly([-40, -100, -90, 0, 90, 0, 40, -100]).fill({ color: 0x101010, alpha: 0.9 });
      g.position.set(x, y);
      heroG.push(g);
      heroes.addChild(g);
    }
    ctx.plane(heroes, { z: 2100 });
    // the rooftop (near) and the trio
    const roof = new Graphics();
    roof.rect(-400, 900, 2720, 600).fill(0x4a3a6a).stroke({ width: 8, color: 0x101010 });
    roof.rect(-400, 880, 2720, 30).fill(0x6a5a8a).stroke({ width: 6, color: 0x101010 });
    roof.roundRect(1500, 700, 160, 200, 10).fill(0x5a4a7a).stroke({ width: 6, color: 0x101010 });
    const cast = new Container();
    const trio = new Trio(ctx, 400);
    const fx = new Graphics();
    const beam = new Beam(ctx, 0xfff4c0);
    const signal = new Container();
    const sg = new Graphics();
    sg.ellipse(0, 0, 300, 170).fill({ color: 0xfff4c0, alpha: 0.85 });
    // the cat head silhouette in the light
    sg.poly([-120, 70, -140, -30, -150, -175, -70, -85, 70, -85, 150, -175, 140, -30, 120, 70, 0, 120]).fill(0x1a1030);
    signal.addChild(sg);
    signal.position.set(1160, -110);
    cast.addChild(roof, beam, signal, trio.root, fx);
    ctx.plane(cast, { z: 1000 });
    // the panel builds itself on the blank page; the narration box
    const page = new Graphics();
    const cap = new Container();
    const ct = word(k, 'MIENTRAS TANTO, EN CIUDAD MAYÚSCULA…', { fontFamily: 'Bangers', fontSize: 52, fill: 0x101010, letterSpacing: 2 });
    const cb = new Graphics().rect(-ct.width / 2 - 26, -44, ct.width + 52, 88).fill(0xffe23a).stroke({ width: 6, color: 0x101010 });
    cap.addChild(cb, ct);
    cap.position.set(700, 110);
    const b1 = balloon(k, '¿Estás bien?', { size: 64, tail: [90, 120] });
    const b2 = balloon(k, 'Mrr… sí. Nomás me mareé.', { size: 62, tail: [-90, 120], wrap: 600 });
    const ui = new Container();
    ui.addChild(page, cap, b1, b2);
    ctx.plane(ui, { z: 0, screen: true });
    const C118 = T(118) - T(117);
    const C120 = T(120) - T(117);
    const C121 = T(121) - T(117);
    return {
      update(lt, f) {
        const rm = ctx.rm;
        const v = ctx.k.view;
        const j = ctx.k.judged('cae');
        const hero = !!j && j.r !== 'miss';
        // the panel: the white page, its borders draw themselves, the picture fills in
        const pg = page.clear();
        const draw = sm(seg(lt, 0, 0.6));
        const fill = sm(seg(lt, 0.45, 0.9));
        const m = 40;
        const inner = [v.x + m, v.y + m, v.x + v.w - m, v.y + m, v.x + v.w - m, v.y + v.h - m, v.x + m, v.y + v.h - m];
        pg.rect(v.x - 20, v.y - 20, v.w + 40, v.h + 40).fill(0xfbf8f0).poly(inner).cut();
        if (fill < 1) pg.poly(inner).fill({ color: 0xfbf8f0, alpha: 1 - fill });
        const per = (v.w + v.h - 4 * m) * 2;
        let left = per * draw;
        const segs: [number, number, number, number][] = [
          [inner[0], inner[1], inner[2], inner[3]],
          [inner[2], inner[3], inner[4], inner[5]],
          [inner[4], inner[5], inner[6], inner[7]],
          [inner[6], inner[7], inner[0], inner[1]],
        ];
        for (const [x0, y0, x1, y1] of segs) {
          const l = Math.hypot(x1 - x0, y1 - y0);
          const q = Math.max(0, Math.min(1, left / l));
          left -= l;
          if (q > 0) pg.moveTo(x0, y0).lineTo(x0 + (x1 - x0) * q, y0 + (y1 - y0) * q).stroke({ width: 10, color: 0x101010 });
        }
        // the landing: ¡CAE! → a superhero landing (one knee, a fist on the roof, cracks) · else on his belly
        const fall = seg(lt, 0, 0.55);
        const landed = lt >= 0.55;
        const stand = sm(seg(lt, C118, C118 + 0.5));
        const collapse = sm(seg(lt, C118 + 0.9, C118 + 1.2)) * (1 - sm(seg(lt, C118 + 3.1, C118 + 3.5)));
        let rotC = 0;
        let sq = 0;
        let cy = 900 - (1 - fall) * 900;
        if (landed) {
          if (hero) sq = (1 - stand) * 0.16;
          else rotC = (1 - stand) * 1.35;
          if (!hero && stand < 0.5) cy = 960;
          sq += collapse * 0.22;
          rotC += collapse * (rm ? 0.2 : 0.5);
        }
        const crouch = sm(seg(lt, C118 + 1.2, C118 + 1.7)) * (1 - sm(seg(lt, C120 + 0.6, C120 + 1.4)));
        trio.update(rm ? lt * 0.4 : lt, f, { x: 860, y: cy, s: 1, hold: landed ? 0 : 1, tumble: 0, rotC, sqC: sq, luz: [300, -260 + crouch * 150], hipo: [-330, 0] });
        const g = fx.clear();
        if (hero && landed && lt < 1.6) {
          const q = seg(lt, 0.55, 1.6);
          for (let i = 0; i < 7; i++) {
            const a = Math.PI + (i / 6) * Math.PI;
            g.moveTo(860, 905).lineTo(860 + Math.cos(a) * 260 * (0.5 + q), 905 - Math.sin(a) * -20).stroke({ width: 6, color: 0x101010, alpha: 1 - q });
          }
          for (let i = 0; i < 10; i++) g.circle(860 + (rnd(i) - 0.5) * 500 * (0.4 + q), 880 - rnd(i + 3) * 80 * q, 20 + q * 30).fill({ color: 0xe8d8f0, alpha: (1 - q) * 0.7 });
        }
        // the lantern points up by accident → the cat-signal on the clouds; the heroes turn
        const up = sm(seg(lt, C120, C120 + 0.5));
        const la = trio.luz.actor;
        if (la) {
          const [lx, ly] = lanternAt(trio.luz);
          beam.set([lx, ly], [1160, -110], 160, up * 0.9);
        }
        const sig = sm(seg(lt, C120 + 0.3, C121 + 0.6));
        signal.alpha = sig;
        signal.scale.set(0.6 + sig * 0.4);
        heroG.forEach((h, i) => (h.scale.x = 1 - 2 * sm(seg(lt, C121 + 0.4 + i * 0.3, C121 + 0.8 + i * 0.3))));
        cap.visible = lt > 0.6 && lt < C118 + 2.0;
        cap.alpha = sm(seg(lt, 0.6, 0.9)) * (1 - sm(seg(lt, C118 + 1.6, C118 + 2.0)));
        const hd = rigPoint(trio.canelo, 'head');
        if (la) b1.position.set(la.x - 40, la.y - 380);
        if (hd) b2.position.set(hd[0] + 160, hd[1] - 260);
        popIn(b1, lt, C118 + 1.6, C118 + 3.0, rm, 0.9);
        popIn(b2, lt, C118 + 3.0, C120 + 0.6, rm, 0.9);
        void speedLines;
      },
    };
  },
};
