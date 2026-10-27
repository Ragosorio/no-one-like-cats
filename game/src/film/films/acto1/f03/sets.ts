/**
 * F03 «NINGUNA CAJA ES HOGAR» — the sets (shot list in ./index.ts). Stencil: red + black over kraft, on twos.
 */
import { Container, Graphics, Sprite, TilingSprite, type Texture } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { Beam, Bitacora, CERITO, TV, balloon, bob, box, kitTex, lanternAt, luzOf, outBack, popIn, rnd, seg, sm, word } from '../kit';
import { BezelFrame, overspray, posterShadow, slap, spray, stencilText, tape } from './print';

const RED = 0xb8221c;
const INK = 0x1a1414;
const KRAFT = 0xc9a77a;
const KRAFT_D = 0xa8875c;
/** the cats of the stencil posters (Brecha is approved; the rest are generic Disruptors — STAND-INS) */
const DISRUPTORES = ['brecha_crowbar_cat', 'grafitera_spray_cat'];
/** the four that jump out of the crack (two paintings, alternated and flipped) */
const SALTAN = [DISRUPTORES[0], DISRUPTORES[1], DISRUPTORES[1], DISRUPTORES[0]];

const onTwos = (lt: number, rm: boolean, fps = 6) => (rm ? lt : Math.floor(lt * fps) / fps);

/** the kraft wall behind the posters (with old torn bits) */
function kraftWall(ctx: SceneCtx, seed: number): Container {
  const c = new Container();
  const tex = ctx.tex('es:kraft') as Texture | undefined;
  if (tex) {
    const t = new TilingSprite({ texture: tex, width: 1600, height: 1240 });
    t.position.set(160, -80);
    t.tint = 0x8a7458;
    c.addChild(t);
  } else c.addChild(new Graphics().rect(160, -80, 1600, 1240).fill(0x7a6448));
  const g = new Graphics();
  // old posters, half torn, in the gaps
  for (let i = 0; i < 9; i++) {
    const x = 160 + rnd(i + seed) * 1400;
    const y = -60 + rnd(i * 3 + seed) * 1100;
    const w = 200 + rnd(i * 5 + seed) * 300;
    const h = 160 + rnd(i * 7 + seed) * 260;
    g.rect(x, y, w, h).fill(i % 3 === 0 ? 0x9a2a20 : i % 3 === 1 ? 0xb8a07a : 0x2a2220);
    for (let j = 0; j < 5; j++) g.poly([x + rnd(j + i) * w, y + h, x + rnd(j + i + 1) * w + 30, y + h + 30 + rnd(j) * 40, x + rnd(j + i + 2) * w + 60, y + h]).fill(0x7a6448);
  }
  c.addChild(g);
  return c;
}
/** a poster sheet on kraft (w × h, centred at x, y in its own container), with tape at the corners */
function posterSheet(ctx: SceneCtx, w: number, h: number, seed: number, paper = KRAFT): { root: Container; body: Container } {
  const root = new Container();
  const g = new Graphics();
  posterShadow(g, -w / 2, -h / 2, w, h);
  root.addChild(g);
  const tex = ctx.tex('es:kraft') as Texture | undefined;
  if (tex) {
    const t = new TilingSprite({ texture: tex, width: w, height: h });
    t.position.set(-w / 2, -h / 2);
    t.tilePosition.set(rnd(seed) * 400, rnd(seed + 1) * 400);
    if (paper !== KRAFT) t.tint = paper;
    root.addChild(t);
  } else root.addChild(new Graphics().rect(-w / 2, -h / 2, w, h).fill(paper));
  const body = new Container();
  root.addChild(body);
  const tp = new Graphics();
  tape(tp, -w / 2 + 40, -h / 2 + 18, 170, -0.6);
  tape(tp, w / 2 - 40, -h / 2 + 18, 170, 0.6);
  tape(tp, -w / 2 + 40, h / 2 - 18, 160, 0.55);
  tape(tp, w / 2 - 44, h / 2 - 16, 150, -0.5);
  root.addChild(tp);
  return { root, body };
}
/** red propaganda sunburst rays (drawn once) */
function sunburst(g: Graphics, x: number, y: number, r: number, n: number, color: number) {
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = a0 + (Math.PI / n) * 0.9;
    g.poly([x, y, x + Math.cos(a0) * r, y + Math.sin(a0) * r, x + Math.cos(a1) * r, y + Math.sin(a1) * r]).fill(color);
  }
}
/** a stencil silhouette of a real painting: black body + a red layer a little off (two plates) */
function twoPlate(ctx: SceneCtx, slug: string, size: number, off: [number, number] = [12, 8]): Container | null {
  const red = ctx.silhouette(slug);
  const ink = ctx.silhouette(slug);
  if (!red || !ink) return null;
  const s = size / ink.texture.height;
  red.scale.set(s);
  ink.scale.set(s);
  red.tint = RED;
  ink.tint = INK;
  red.position.set(off[0], off[1]);
  const c = new Container();
  c.addChild(red, ink);
  return c;
}

// ------------------------------------------------------------------ the bar's facade (TV colours or stencil plates)
interface Pal {
  sky: number;
  wall: number;
  wallD: number;
  line: number;
  door: number;
  win: number;
  sign: number;
  signTx: number;
  ground: number;
}
const TV_PAL: Pal = { sky: 0x141a44, wall: TV.brick, wallD: TV.brickD, line: TV.line, door: TV.green, win: TV.amberL, sign: 0x2a1030, signTx: TV.neonPink, ground: 0x2a3060 };
const ST_PAL: Pal = { sky: KRAFT, wall: RED, wallD: INK, line: INK, door: INK, win: KRAFT, sign: INK, signTx: KRAFT, ground: KRAFT_D };
function facade(ctx: SceneCtx, p: Pal, stencil: boolean): Container {
  const c = new Container();
  const g = new Graphics();
  const lw = stencil ? 0 : 6;
  g.rect(170, -70, 1580, 1220).fill(p.sky);
  // brick wall
  g.rect(260, 120, 1400, 740).fill(p.wall);
  for (let y = 140; y < 840; y += 56)
    for (let x = 260 + ((y / 56) % 2) * 60; x < 1640; x += 120) {
      if (stencil) {
        if (rnd(x * 3 + y) > 0.55) g.rect(x + 6, y + 6, 100, 10).fill(INK);
      } else g.roundRect(x, y, 112, 48, 4).stroke({ width: 3, color: p.wallD });
    }
  if (!stencil) g.rect(260, 120, 1400, 740).stroke({ width: lw, color: p.line });
  // the neon sign box
  g.roundRect(520, 160, 880, 150, 18).fill(p.sign);
  if (!stencil) g.roundRect(520, 160, 880, 150, 18).stroke({ width: lw, color: p.line });
  // windows, door
  for (const x of [360, 1160]) {
    g.rect(x, 430, 400, 270).fill(p.win);
    g.rect(x + 196, 430, 8, 270).fill(p.line);
    g.rect(x, 560, 400, 8).fill(p.line);
    if (!stencil) g.rect(x, 430, 400, 270).stroke({ width: lw, color: p.line });
    // silhouettes of drinkers behind the glass
    for (let i = 0; i < 2; i++) g.circle(x + 100 + i * 200, 650, 48).fill(stencil ? RED : 0x6a3a2a);
  }
  g.rect(860, 500, 200, 360).fill(p.door);
  if (!stencil) g.rect(860, 500, 200, 360).stroke({ width: lw, color: p.line });
  g.circle(1030, 690, 12).fill(stencil ? KRAFT : TV.amberL);
  // the sidewalk
  g.rect(170, 860, 1580, 290).fill(p.ground);
  g.rect(170, 860, 1580, 18).fill(stencil ? INK : 0x4a4f78);
  c.addChild(g);
  const sign = word(ctx.k, 'LA ÚLTIMA RONDA', { fontFamily: stencil ? 'Bebas Neue' : 'Bangers', fontSize: 104, fill: p.signTx, letterSpacing: 8, ...(stencil ? {} : { stroke: { color: 0x5a0a30, width: 6 } }) });
  sign.position.set(960, 236);
  c.addChild(sign);
  if (!stencil) {
    const glow = new Sprite(kitTex(ctx, 'glow'));
    glow.anchor.set(0.5);
    glow.position.set(960, 236);
    glow.scale.set(5, 1.6);
    glow.tint = TV.neonPink;
    glow.blendMode = 'add';
    glow.alpha = 0.45;
    c.addChild(glow);
  }
  return c;
}

// ------------------------------------------------------------------ 1 · fachada: the bar becomes a poster
export const fachada: SetModule = {
  build(ctx): FilmSet {
    const rm = ctx.rm;
    const color = facade(ctx, TV_PAL, false);
    ctx.plane(color, { z: 1000, bake: 'static' });
    const sten = facade(ctx, ST_PAL, true);
    const stenC = new Container();
    stenC.addChild(sten);
    const m = new Graphics();
    stenC.addChild(m);
    stenC.mask = m;
    ctx.plane(stenC, { z: 1000 });
    // the stencil sheet: kraft with the shapes cut out (it drops on the facade, then lifts)
    const sheet = new Container();
    const sg = new Graphics();
    sg.rect(200, 80, 1520, 830).fill({ color: 0xb08a5c, alpha: 0.96 });
    for (const x of [360, 1160]) sg.rect(x + 8, 438, 384, 254).cut();
    sg.rect(868, 508, 184, 344).cut();
    sg.roundRect(528, 168, 864, 134, 14).cut();
    sg.rect(200, 80, 1520, 830).stroke({ width: 4, color: 0x7a5a36 });
    sheet.addChild(sg);
    ctx.plane(sheet, { z: 1000 });
    // the can
    const can = new Graphics();
    ctx.plane(can, { z: 1000 });
    const mist = new Graphics();
    ctx.plane(mist, { z: 1000 });
    const rain = ctx.weather('rain');
    if (rain) ctx.plane(rain.node, { z: 0, screen: true });
    // the title, sprayed on top
    const ttl = stencilText(ctx, 'LA ÚLTIMA RONDA · OTRA VEZ', 92, INK, KRAFT, { halo: true });
    const ttlBack = new Graphics().rect(-640, -64, 1280, 128).fill(KRAFT);
    const ttlC = new Container();
    ttlC.addChild(ttlBack, ttl);
    ttlC.position.set(960, 980);
    ttlC.rotation = -0.02;
    const tm = new Graphics();
    ttlC.addChild(tm);
    ttl.mask = tm;
    const ui = new Container();
    ui.addChild(ttlC);
    const frame = new BezelFrame(ctx);
    ctx.plane(frame, { z: 0, screen: true });
    ctx.plane(ui, { z: 0, screen: true });
    const DROP = 0.85;
    const SPRAY0 = 1.2;
    const SPRAY1 = 2.3;
    const LIFT = 2.4;
    return {
      update(lt, f) {
        const tt = onTwos(lt, rm, 12);
        // the sheet drops (squash on landing), stays while the can sweeps, then lifts away
        const drop = rm ? sm(seg(lt, DROP, DROP + 0.4)) : outBack(seg(lt, DROP, DROP + 0.32), 1.1);
        const lift = sm(seg(lt, LIFT, LIFT + 0.45));
        sheet.position.set(lift * 120, (1 - drop) * -1100 - lift * 1200);
        sheet.rotation = (1 - drop) * -0.04 + lift * 0.06;
        sheet.alpha = rm ? Math.min(drop, 1 - lift) : 1;
        // the sweep: rows left → right
        const p = seg(tt, SPRAY0, SPRAY1);
        spray(m, 240, 40, 1440, 1040, p, 11, 90);
        const c = can.clear();
        const mi = mist.clear();
        if (lt > SPRAY0 - 0.15 && lt < SPRAY1 + 0.1) {
          const row = Math.floor(p * 4);
          const u = (p * 4) % 1;
          const x = 260 + (row % 2 ? 1 - u : u) * 1400;
          const y = 200 + row * 190;
          c.roundRect(x + 30, y - 150, 70, 170, 18).fill(RED).stroke({ width: 5, color: INK });
          c.rect(x + 46, y - 172, 38, 26).fill(INK);
          c.rect(x + 40, y - 186, 18, 14).fill(0x9aa0a8);
          for (let i = 0; i < 26; i++) mi.circle(x + 20 - rnd(i + row * 31 + Math.floor(lt * 12)) * 120, y - 170 + rnd(i * 3 + Math.floor(lt * 12)) * 60, 3 + rnd(i) * 6).fill({ color: RED, alpha: 0.5 });
        }
        // the title sprays on after the lift
        spray(tm, -640, -64, 1280, 128, seg(tt, 2.75, 3.55), 3, 46);
        ttlC.visible = lt > 2.7;
        frame.update(f);
      },
    };
  },
};

// ------------------------------------------------------------------ 2 · grieta: they come out of the bathroom crack
export const grieta: SetModule = {
  cats: DISRUPTORES,
  build(ctx): FilmSet {
    const rm = ctx.rm;
    ctx.plane(kraftWall(ctx, 3), { z: 1000 });
    const P = posterSheet(ctx, 1500, 900, 4);
    const b = P.body;
    const g = new Graphics();
    // the BAÑO door, red, and the crack (black, jagged) on the wall beside it
    g.rect(-170, -330, 340, 640).fill(RED);
    g.rect(-120, -280, 240, 120).fill(KRAFT);
    g.rect(-170, 300, 1400, 20).fill(INK);
    const crack = [-10, -360, 40, -250, -20, -160, 60, -40, 0, 70, 70, 200, 20, 320];
    g.poly([...crack, ...crack.slice().reverse().flatMap((_, i, a) => (i % 2 === 0 ? [a[i + 1] + 70, a[i]] : []))]).fill(INK);
    overspray(g, -170, -330, 340, 640, RED, 21, 90);
    b.addChild(g);
    const banio = word(ctx.k, 'BAÑO', { fontFamily: 'Bebas Neue', fontSize: 84, fill: RED, letterSpacing: 10 });
    banio.position.set(0, -220);
    b.addChild(banio);
    // the Disruptors (silhouettes of real art, two plates) jump out of the crack, two poses per step
    const cats: { c: Container; t0: number; to: [number, number]; flip: boolean }[] = [];
    SALTAN.forEach((slug, i) => {
      const c = twoPlate(ctx, slug, i > 1 ? 270 : 300);
      if (!c) return;
      b.addChild(c);
      cats.push({ c, t0: 0.6 + i * 0.85, to: [[-520, 300], [420, 300], [-360, 300], [560, 300]][i] as [number, number], flip: i % 2 === 0 });
    });
    const shout = stencilText(ctx, '¡NINGUNA CAJA ES HOGAR!', 70, INK, KRAFT, { halo: false });
    shout.position.set(0, -390);
    const sm2 = new Graphics();
    shout.addChild(sm2);
    (shout.children[1] as Container).mask = sm2;
    b.addChild(shout);
    P.root.position.set(960, 540);
    ctx.plane(P.root, { z: 1000 });
    const frame = new BezelFrame(ctx);
    ctx.plane(frame, { z: 0, screen: true });
    return {
      update(lt, f) {
        slap(P.root, lt, 0.02, rm, -0.025);
        const tt = onTwos(lt, rm);
        for (const k of cats) {
          const p = seg(tt, k.t0, k.t0 + 1.2);
          k.c.visible = tt >= k.t0;
          // out of the crack (small, at the crack) → hops to its spot: on twos, alternating poses
          const step = Math.floor(tt * 6);
          const hop = rm ? 0 : Math.abs(Math.sin(p * Math.PI * 3)) * 90;
          const x = 30 + (k.to[0] - 30) * sm(p);
          const y = 40 + (k.to[1] - 40) * sm(p) - hop;
          const s = 0.35 + 0.65 * sm(p * 1.4);
          const pose = step % 2 ? 0.06 : -0.06;
          k.c.position.set(x, y);
          k.c.rotation = rm ? 0 : pose;
          k.c.scale.set((k.flip ? -1 : 1) * s, s);
          k.c.pivot.set(0, 0);
        }
        spray(sm2, -560, -50, 1120, 100, seg(tt, 4.2, 5.2), 9, 40);
        frame.update(f);
      },
    };
  },
};

// ------------------------------------------------------------------ 3 · llave: the kitten with a keyhole
export const llave: SetModule = {
  cats: [CERITO],
  build(ctx): FilmSet {
    const rm = ctx.rm;
    ctx.plane(kraftWall(ctx, 8), { z: 1000 });
    const P = posterSheet(ctx, 1240, 980, 9);
    const b = P.body;
    const rays = new Graphics();
    sunburst(rays, 0, -40, 900, 22, RED);
    const rm2 = new Graphics().rect(-620, -490, 1240, 980).fill(0xffffff);
    rays.mask = rm2;
    b.addChild(rays, rm2);
    // the kitten: its real outline, filled with static in red and black, a keyhole cut in its chest, eyes cut out
    const kit = new Container();
    const base = ctx.silhouette(CERITO);
    const mask = ctx.silhouette(CERITO);
    const noise = new TilingSprite({ texture: kitTex(ctx, 'static'), width: 900, height: 900 });
    const S = 560;
    let eyes: [number, number][] = [
      [-S * 0.16, -S * 0.66],
      [S * 0.08, -S * 0.62],
    ];
    if (base && mask) {
      const s = S / base.texture.height;
      base.scale.set(s);
      mask.scale.set(s);
      base.tint = INK;
      noise.position.set(-450, -880);
      noise.tint = RED;
      noise.mask = mask;
      kit.addChild(base, noise, mask);
      const p = ctx.studio.puppet(CERITO);
      const rig = p?.brain.model?.rig;
      if (p && rig?.eyes?.length) {
        const ps = S / p.H;
        eyes = rig.eyes.map((e) => [((e[0] + e[2]) / 2 - p.anchor.x * p.W) * ps, ((e[1] + e[3]) / 2 - p.anchor.y * p.H) * ps] as [number, number]);
      }
      p?.destroy();
    }
    const holes = new Graphics();
    for (const [ex, ey] of eyes) holes.ellipse(ex, ey, 22, 26).fill(KRAFT);
    // keyhole in the chest
    holes.circle(-10, -S * 0.32, 36).fill(KRAFT);
    holes.poly([-34, -S * 0.32 + 10, 14, -S * 0.32 + 10, 30, -S * 0.32 + 120, -50, -S * 0.32 + 120]).fill(KRAFT);
    kit.addChild(holes);
    kit.position.set(0, 330);
    b.addChild(kit);
    const word1 = stencilText(ctx, 'LA LLAVE', 210, INK, KRAFT);
    const wbg = new Graphics().rect(-430, -110, 860, 220).fill(KRAFT);
    const wc = new Container();
    wc.addChild(wbg, word1);
    wc.position.set(0, -330);
    wc.rotation = -0.04;
    const wm = new Graphics();
    wc.addChild(wm);
    wc.mask = wm;
    b.addChild(wc);
    P.root.position.set(960, 540);
    ctx.plane(P.root, { z: 1000 });
    const frame = new BezelFrame(ctx);
    ctx.plane(frame, { z: 0, screen: true });
    return {
      update(lt, f) {
        slap(P.root, lt, 0.02, rm, 0.02);
        const st = Math.floor(lt * (rm ? 4 : 12));
        noise.tilePosition.set(rnd(st) * 300, rnd(st + 3) * 300);
        rays.rotation = rm ? 0 : Math.floor(lt * 6) * 0.006;
        spray(wm, -470, -140, 940, 280, seg(onTwos(lt, rm, 12), 1.5, 2.6), 5, 60);
        wc.visible = lt > 1.45;
        frame.update(f);
      },
    };
  },
};

// ------------------------------------------------------------------ 4 · canelo (colour): «¿La llave de qué?»
export const canelo: SetModule = {
  cats: ({ canelo }) => [canelo],
  build(ctx): FilmSet {
    const rm = ctx.rm;
    const back = new Graphics();
    back.rect(170, -70, 1580, 1220).fill(TV.night);
    for (let x = 240; x < 1700; x += 90) back.rect(x, -70, 34, 870).fill(TV.nightD);
    back.rect(170, 700, 1580, 450).fill(TV.woodD);
    // overturned stools in the back (the bar after the poster storm)
    for (const x of [420, 1480]) {
      back.circle(x, 640, 70).fill(TV.wood).stroke({ width: 6, color: TV.line });
      back.rect(x - 8, 640, 16, 140).fill(TV.woodD).stroke({ width: 4, color: TV.line });
    }
    ctx.plane(back, { z: 1500, bake: 'static' });
    const mid = new Container();
    const can = ctx.actor(ctx.canelo, 640);
    if (can) mid.addChild(can);
    const table = new Graphics();
    box(table, 360, 760, 1200, 70, TV.woodL, { shadow: TV.woodD, r: 10 });
    table.rect(400, 830, 1120, 400).fill(TV.wood).stroke({ width: 6, color: TV.line });
    mid.addChild(table);
    const sweat = new Graphics();
    mid.addChild(sweat);
    ctx.plane(mid, { z: 1000 });
    const bal = balloon(ctx.k, '¿La llave de qué?', { size: 62, who: 'CANELO', tail: [-80, 150] });
    bal.position.set(1240, 300);
    const ui = new Container();
    ui.addChild(bal);
    const frame = new BezelFrame(ctx);
    ctx.plane(frame, { z: 0, screen: true });
    ctx.plane(ui, { z: 0, screen: true });
    return {
      update(lt, f) {
        // he rises from behind the table, looks, gulps (a squash)
        const up = rm ? sm(seg(lt, 0, 0.4)) : outBack(seg(lt, 0, 0.3), 1.6);
        const gulp = seg(lt, 0.9, 1.25);
        const g = Math.sin(gulp * Math.PI);
        can?.pose(lt, 900, 1180 - up * 300, { sx: 1 + g * 0.05, sy: 1 - g * 0.07, flip: true });
        const s = sweat.clear();
        if (can && lt > 0.5) {
          const [hx, hy] = can.head();
          const x = can.x - hx - 120;
          const y = can.y + hy - 30 + ((lt * 140) % 50);
          s.moveTo(x, y - 30).quadraticCurveTo(x + 20, y, x, y + 12).quadraticCurveTo(x - 20, y, x, y - 30).fill(0x9fd8ff).stroke({ width: 5, color: TV.line });
        }
        popIn(bal, lt, 0.35, 1.95, rm);
        frame.update(f);
      },
    };
  },
};

// ------------------------------------------------------------------ 5 · brecha: the rival's poster breathes
export const brecha: SetModule = {
  cats: ['brecha_crowbar_cat'],
  build(ctx): FilmSet {
    const rm = ctx.rm;
    ctx.plane(kraftWall(ctx, 12), { z: 1200 });
    const P = posterSheet(ctx, 1300, 1000, 13);
    const b = P.body;
    const rays = new Graphics();
    sunburst(rays, 0, -60, 1000, 18, RED);
    const rmk = new Graphics().rect(-650, -500, 1300, 1000).fill(0xffffff);
    rays.mask = rmk;
    rays.alpha = 0.9;
    b.addChild(rays, rmk);
    const art = new Container();
    const red = ctx.silhouette('brecha_crowbar_cat');
    const st = ctx.still('brecha_crowbar_cat');
    if (red && st) {
      const s = 800 / st.texture.height;
      red.scale.set(s);
      st.scale.set(s);
      red.tint = RED;
      red.position.set(18, 10);
      art.addChild(red, st);
    }
    art.position.set(-40, 380);
    b.addChild(art);
    const name = stencilText(ctx, 'BRECHA', 230, INK, KRAFT);
    const nbg = new Graphics().rect(-420, -100, 840, 200).fill(KRAFT);
    const nc = new Container();
    nc.addChild(nbg, name);
    nc.position.set(260, -360);
    nc.rotation = 0.05;
    b.addChild(nc);
    const tag = stencilText(ctx, 'CAPITANA DE LOS DISRUPTORES', 46, KRAFT, RED, { bridges: false, halo: false });
    const tg = new Graphics().rect(-380, -34, 760, 68).fill(INK);
    const tc = new Container();
    tc.addChild(tg, tag);
    tc.position.set(260, -230);
    tc.rotation = 0.05;
    b.addChild(tc);
    P.root.position.set(960, 540);
    ctx.plane(P.root, { z: 1000 });
    const frame = new BezelFrame(ctx);
    ctx.plane(frame, { z: 0, screen: true });
    const SPB = 60 / 165;
    return {
      update(lt, f) {
        slap(P.root, lt, 0.02, rm, -0.02);
        // the poster «breathes» with the music: a pulse every two beats
        const ph = (lt / (SPB * 2)) % 1;
        const pulse = rm ? 0 : Math.exp(-ph * 6);
        if (lt > 0.25) P.root.scale.set(1 + pulse * 0.018);
        art.scale.set(1 + pulse * 0.025);
        const p = seg(lt, 0.7, 0.92);
        nc.visible = lt >= 0.7;
        nc.scale.set(rm ? 1 : 1 + (1 - outBack(p, 2)) * 0.8);
        tc.visible = lt >= 1.3;
        tc.alpha = sm(seg(lt, 1.3, 1.6));
        frame.update(f);
      },
    };
  },
};

// ------------------------------------------------------------------ 6 · regla: SILLAS VOLADORAS
export const regla: SetModule = {
  build(ctx): FilmSet {
    const rm = ctx.rm;
    const bg = new Graphics();
    const tex = ctx.tex('es:kraft') as Texture | undefined;
    const bgC = new Container();
    if (tex) {
      const t = new TilingSprite({ texture: tex, width: 1600, height: 1240 });
      t.position.set(160, -80);
      bgC.addChild(t);
    }
    // the bar in stencil: the counter, stools, the bottles; and the «sea» line where the ships ride (the Borracha's
    // battles are fought in the bar's flooded floor)
    bg.rect(240, 140, 1440, 26).fill(INK);
    for (let i = 0; i < 14; i++) bg.rect(300 + i * 98, 190, 30, 70 + (i % 3) * 20).fill(i % 2 ? RED : INK);
    bg.rect(240, 300, 1440, 18).fill(INK);
    bg.rect(240, 820, 1440, 260).fill(RED);
    for (let i = 0; i < 16; i++) bg.moveTo(260 + i * 92, 840).quadraticCurveTo(290 + i * 92, 820, 320 + i * 92, 840).stroke({ width: 8, color: INK });
    bgC.addChild(bg);
    ctx.plane(bgC, { z: 1000 });
    const live = new Container();
    const ships = new Graphics();
    // your ship (left) and theirs (right), stencil hulls
    const ship = (x: number, flip: number) => {
      ships.poly([x - 190, 760, x + 190, 760, x + 150 * 1, 850, x - 150, 850]).fill(INK);
      ships.rect(x - 8 * flip, 520, 16, 240).fill(INK);
      ships.poly([x + 8 * flip, 540, x + 150 * flip, 640, x + 8 * flip, 700]).fill(RED);
      ships.rect(x - 130, 720, 260, 40).fill(KRAFT);
      ships.circle(x + 110 * flip, 740, 16).fill(INK);
    };
    ship(560, 1);
    ship(1380, -1);
    live.addChild(ships);
    const tu = stencilText(ctx, 'TÚ', 64, KRAFT, INK, { halo: false, bridges: false });
    tu.position.set(560, 905);
    const ella = stencilText(ctx, 'BRECHA', 56, KRAFT, INK, { halo: false, bridges: false });
    ella.position.set(1380, 905);
    live.addChild(tu, ella);
    const chair = new Graphics();
    // a bar chair, black with a red rim
    chair.rect(-60, -40, 120, 20).fill(INK).stroke({ width: 6, color: RED });
    chair.rect(-56, -140, 18, 110).fill(INK).stroke({ width: 4, color: RED });
    chair.rect(-60, -150, 110, 22).fill(INK).stroke({ width: 4, color: RED });
    chair.rect(-50, -20, 14, 90).fill(INK).stroke({ width: 4, color: RED });
    chair.rect(36, -20, 14, 90).fill(INK).stroke({ width: 4, color: RED });
    const chairC = new Container();
    chairC.addChild(chair);
    live.addChild(chairC);
    const guide = new Graphics();
    const shot = new Graphics();
    const fx = new Graphics();
    live.addChild(guide, shot, fx);
    ctx.plane(live, { z: 1000 });
    const sign = stencilText(ctx, 'SILLAS VOLADORAS', 128, INK, KRAFT);
    const sbg = new Graphics().rect(-560, -76, 1120, 152).fill(KRAFT).stroke({ width: 8, color: INK });
    const sc = new Container();
    sc.addChild(sbg, sign);
    sc.position.set(960, 420);
    sc.rotation = -0.025;
    const sgm = new Graphics();
    sign.mask = sgm;
    sc.addChild(sgm);
    const cover = stencilText(ctx, '¡COBERTURA! (UN TURNO)', 64, KRAFT, RED, { bridges: false, halo: false });
    const cbg = new Graphics().rect(-380, -44, 760, 88).fill(INK);
    const cc = new Container();
    cc.addChild(cbg, cover);
    cc.position.set(700, 620);
    cc.rotation = 0.03;
    const ui = new Container();
    ui.addChild(sc, cc);
    const frame = new BezelFrame(ctx);
    ctx.plane(frame, { z: 0, screen: true });
    ctx.plane(ui, { z: 0, screen: true });
    const PERIOD = 2.4;
    const RISE = 1.0;
    const LAND = 3.2;
    const SHOT0 = 3.5;
    const HIT = 4.25;
    return {
      update(lt, f) {
        const tt = onTwos(lt, rm, 12);
        spray(sgm, -560, -80, 1120, 160, seg(tt, 0.2, 1.0), 4, 50);
        sc.visible = lt > 0.15;
        sc.alpha = 1 - sm(seg(lt, 2.2, 2.6)) * 0.7;
        // the chair: rises from the floor on the Mareo's sway, floats side to side, lands in front of YOUR ship
        const rise = sm(seg(lt, RISE, RISE + 0.7));
        const sway = Math.sin(((lt - RISE) / PERIOD) * Math.PI * 2) * (rm ? 70 : 150);
        const land = sm(seg(lt, LAND - 0.5, LAND));
        const hx = 960 + sway * (1 - land);
        const hy = 780 - rise * 240;
        const lx = 790;
        const ly = 740;
        const x = hx + (lx - hx) * land;
        const y = hy + (ly - hy) * land;
        const squash = lt > LAND && lt < LAND + 0.3 && !rm ? Math.sin(seg(lt, LAND, LAND + 0.3) * Math.PI) * 0.18 : 0;
        const broken = lt >= HIT;
        chairC.position.set(x, y);
        chairC.rotation = (1 - land) * sway * 0.0012;
        chairC.scale.set(1.7 * (1 + squash), 1.7 * (1 - squash));
        chairC.visible = lt >= RISE - 0.05 && !(broken && lt > HIT + 0.05);
        // the sway guide (the Mareo's dotted arc) while it floats
        const gd = guide.clear();
        if (lt > RISE + 0.4 && lt < LAND) for (let i = -6; i <= 6; i++) gd.circle(960 + i * 26, 440 + Math.abs(i) * Math.abs(i) * 1.6, 6).fill({ color: INK, alpha: 0.75 });
        // the enemy's shot: an arc from their ship that breaks on the chair
        const s = shot.clear();
        const e = fx.clear();
        if (lt >= SHOT0 && lt < HIT) {
          const p = seg(lt, SHOT0, HIT);
          for (let i = 0; i <= 12; i++) {
            const q = (p * i) / 12;
            const sx = 1360 + (lx + 40 - 1360) * q;
            const sy = 560 - Math.sin(q * Math.PI) * 260 + (ly - 80 - 560) * q;
            if (i % 2 === 0) s.circle(sx, sy, 5).fill(INK);
          }
          const sx = 1360 + (lx + 40 - 1360) * p;
          const sy = 560 - Math.sin(p * Math.PI) * 260 + (ly - 80 - 560) * p;
          s.circle(sx, sy, 22).fill(INK).stroke({ width: 5, color: RED });
        }
        if (broken && lt < HIT + 0.9) {
          const k = seg(lt, HIT, HIT + 0.9);
          for (let i = 0; i < 9; i++) {
            const a = -Math.PI * 0.9 + i * 0.28;
            const d = 30 + k * 200;
            e.rect(lx + Math.cos(a) * d - 30, ly - 60 + Math.sin(a) * d + k * k * 180, 60, 14).fill({ color: i % 2 ? RED : INK, alpha: 1 - k * 0.5 });
          }
          e.star(lx + 40, ly - 80, 10, 90 * (1 - k * 0.6), 40, 0).fill({ color: KRAFT, alpha: 1 - k });
        }
        // the cover label
        const cp = seg(lt, HIT + 0.15, HIT + 0.35);
        cc.visible = lt >= HIT + 0.15;
        cc.scale.set(rm ? 1 : 1 + (1 - outBack(cp, 2)) * 0.5);
        frame.update(f);
      },
    };
  },
};

// ------------------------------------------------------------------ 7 · ogar: Luzterna fixes the spelling + LO QUE ARRIESGAMOS
export const ogar: SetModule = {
  cats: ['luzterna', 'grafitera_spray_cat', 'brecha_crowbar_cat'],
  build(ctx): FilmSet {
    const rm = ctx.rm;
    const wall = new Graphics();
    wall.rect(170, -70, 1580, 1220).fill(0x3a2a3a);
    for (let y = 40; y < 1000; y += 60) for (let x = 240 + ((y / 60) % 2) * 50; x < 1700; x += 100) wall.roundRect(x, y, 94, 54, 4).fill(0x4a3646).stroke({ width: 3, color: 0x2a1c2a });
    wall.rect(170, 900, 1580, 250).fill(0x22283a);
    // a stencil poster of two Disruptors next to the graffiti (they will glare)
    box(wall, 1270, 90, 360, 420, KRAFT, { r: 2 });
    ctx.plane(wall, { z: 1000, bake: 'static' });
    const posterCats = new Container();
    const pc1 = twoPlate(ctx, 'grafitera_spray_cat', 300, [8, 6]);
    const pc2 = twoPlate(ctx, 'brecha_crowbar_cat', 280, [8, 6]);
    if (pc1) {
      pc1.position.set(1370, 480);
      posterCats.addChild(pc1);
    }
    if (pc2) {
      pc2.position.set(1530, 490);
      pc2.scale.x = -1;
      posterCats.addChild(pc2);
    }
    const glare = new Graphics();
    posterCats.addChild(glare);
    const tp = new Graphics();
    tape(tp, 1300, 100, 120, -0.4);
    tape(tp, 1600, 100, 120, 0.4);
    posterCats.addChild(tp);
    // the graffiti, misspelt: «NINGUNA CAJA ES ‸OGAR»
    const gg = new Container();
    const sty = { fontFamily: 'Permanent Marker', fontSize: 104, fill: 0xe0342a, stroke: { color: 0x5a0c0a, width: 4 } };
    const w1 = word(ctx.k, 'NINGUNA CAJA', sty);
    w1.position.set(700, 300);
    const w2 = word(ctx.k, 'ES', sty);
    w2.position.set(480, 470);
    const w3 = word(ctx.k, 'OGAR', sty);
    w3.position.set(860, 470);
    w1.rotation = -0.03;
    w3.rotation = 0.02;
    const drips = new Graphics();
    for (let i = 0; i < 18; i++) {
      const x = 360 + rnd(i) * 720;
      const y = i < 9 ? 340 : 510;
      drips.roundRect(x, y, 7, 30 + rnd(i + 3) * 70, 3).fill(0xc02a22);
    }
    gg.addChild(drips, w1, w2, w3);
    const live = new Container();
    live.addChild(gg, posterCats);
    const hG = new Graphics();
    live.addChild(hG);
    const luz = luzOf(ctx, 400);
    if (luz.actor) live.addChild(luz.actor);
    const beam = new Beam(ctx);
    live.addChild(beam);
    const ding = word(ctx.k, '¡DING!', { fontFamily: 'Bangers', fontSize: 54, fill: 0xffe27a, stroke: { color: TV.line, width: 6 }, letterSpacing: 2 });
    live.addChild(ding);
    const rain = ctx.weather('rain');
    ctx.plane(live, { z: 1000 });
    if (rain) ctx.plane(rain.node, { z: 0, screen: true });
    const pg = new Bitacora(ctx, 'El rastro del chiquito. Le dicen "La Llave". Qué feo.');
    const ui = new Container();
    ui.addChild(pg);
    const frame = new BezelFrame(ctx);
    ctx.plane(frame, { z: 0, screen: true });
    ctx.plane(ui, { z: 0, screen: true });
    // where the H goes (between «ES» and «OGAR»), its three strokes
    const HX = 640;
    const HY = 470;
    const strokes: [number, number, number, number][] = [
      [HX - 34, HY - 52, HX - 34, HY + 50],
      [HX + 34, HY - 52, HX + 34, HY + 50],
      [HX - 34, HY, HX + 34, HY],
    ];
    const W0 = 1.6;
    const W1 = 2.9;
    return {
      update(lt, f) {
        // she floats in from the right, stops by the wall, frowns at it… then writes the H with her beam
        const inn = sm(seg(lt, 0, 1.2));
        const b = bob(lt, rm, 10);
        luz.actor?.pose(lt, 1480 - inn * 220, 1010 + b, { flip: true });
        const wp = seg(lt, W0, W1);
        const h = hG.clear();
        let tip: [number, number] = [HX, HY - 52];
        let acc = wp * 3;
        for (const [x0, y0, x1, y1] of strokes) {
          const k = Math.max(0, Math.min(1, acc));
          acc -= 1;
          if (k <= 0) break;
          const x = x0 + (x1 - x0) * k;
          const y = y0 + (y1 - y0) * k;
          h.moveTo(x0, y0).lineTo(x, y).stroke({ width: 26, color: TV.lantern, alpha: 0.35, cap: 'round' });
          h.moveTo(x0, y0).lineTo(x, y).stroke({ width: 12, color: 0xdff6ff, cap: 'round' });
          tip = [x, y];
        }
        // the caret under the gap (written first)
        const cp = seg(lt, W0 - 0.35, W0);
        if (cp > 0) h.moveTo(HX - 30, HY + 90).lineTo(HX, HY + 90 - 34 * cp).lineTo(HX + 30 * cp, HY + 90 - 34 * cp + 34 * cp).stroke({ width: 8, color: 0xdff6ff, alpha: 0.9, cap: 'round', join: 'round' });
        if (luz.actor) {
          const from = lanternAt(luz);
          const on = lt >= W0 - 0.4 && lt < W1 + 0.25;
          beam.set(from, on ? tip : from, 34, on ? (ctx.rf ? 0.6 : 0.9) : 0);
        }
        // the teacher's bell, then the cats on the poster glare at her (eyes + brows)
        const dp = seg(lt, W1 + 0.05, W1 + 0.25);
        ding.visible = lt > W1 && lt < W1 + 1.1;
        ding.position.set(HX + 40, HY - 150 - dp * 20);
        ding.scale.set(rm ? 1 : 0.6 + outBack(dp, 2) * 0.4);
        const gl = glare.clear();
        const g2 = sm(seg(lt, W1 + 0.4, W1 + 0.7));
        if (g2 > 0) {
          for (const [x, y] of [
            [1350, 290],
            [1540, 310],
          ]) {
            gl.ellipse(x - 18, y, 16, 10).fill({ color: KRAFT, alpha: g2 }).ellipse(x + 18, y, 16, 10).fill({ color: KRAFT, alpha: g2 });
            gl.circle(x - 26, y + 2, 5).fill({ color: INK, alpha: g2 }).circle(x + 10, y + 2, 5).fill({ color: INK, alpha: g2 });
            gl.moveTo(x - 36, y - 22).lineTo(x - 4, y - 10).stroke({ width: 7, color: RED, alpha: g2 });
            gl.moveTo(x + 36, y - 22).lineTo(x + 4, y - 10).stroke({ width: 7, color: RED, alpha: g2 });
          }
        }
        pg.visible = lt >= 4.0;
        pg.update(lt - 4.0, rm);
        frame.update(f);
      },
    };
  },
};
