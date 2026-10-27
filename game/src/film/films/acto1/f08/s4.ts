/**
 * F08 · c89–c105 — the beat comes back, the strongest: WESTERN (O20: an eye on every chop), KAIJU (O21: she pulls him
 * out from under the foot by the scarf), 8 BITS (O22: Comecroquetas; «CONTINUE?» lives in the game's HUD) — the third
 * crack (O23, c100) — and EGIPTO (O24–O26: the gods bow to him; the floor opens).
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { CERITO, TV, balloon, kitTex, outBack, popIn, rnd, seg, sm, word } from '../kit';
import { Cerito, MULTI, Rift, T, Trio, impact, rigPoint, wrapScroll } from './lib';

const COWBOY = 'supernova_gunslinger_cat';

/** a still cropped to its eyes (an extreme close-up): eye centre at (cx, cy), eye distance = `span` px */
function eyesECU(ctx: SceneCtx, slug: string, cx: number, cy: number, span: number): Container {
  const c = new Container();
  const st = ctx.still(slug);
  const p = ctx.studio.puppet(slug);
  const rig = p?.brain.model?.rig;
  if (st && p && rig) {
    const tw = st.texture.width;
    const th = st.texture.height;
    const kx = tw / p.W;
    const ky = th / p.H;
    const e = rig.eyes?.length >= 2 ? rig.eyes : [[rig.head[0] - 40, rig.head[1] - 20, rig.head[0] - 10, rig.head[1] + 10], [rig.head[0] + 10, rig.head[1] - 20, rig.head[0] + 40, rig.head[1] + 10]];
    const ex = ((e[0][0] + e[0][2] + e[1][0] + e[1][2]) / 4) * kx;
    const ey = ((e[0][1] + e[0][3] + e[1][1] + e[1][3]) / 4) * ky;
    const d = Math.abs((e[1][0] + e[1][2]) / 2 - (e[0][0] + e[0][2]) / 2) * kx || 100;
    const s = span / d;
    st.anchor.set(0, 0);
    st.scale.set(s);
    st.position.set(cx - ex * s, cy - ey * s);
    c.addChild(st);
  }
  p?.destroy();
  return c;
}

/** a film strip: black bars with sprocket holes (top and bottom), the picture between them is scope (2.39) */
function filmStrip(ctx: SceneCtx): Graphics {
  const g = new Graphics();
  const v = ctx.k.view;
  const bh = (v.h - v.w / 2.39) / 2;
  g.rect(v.x - 10, v.y - 10, v.w + 20, bh + 10).fill(0x0c0906).rect(v.x - 10, v.y + v.h - bh, v.w + 20, bh + 10).fill(0x0c0906);
  for (let x = v.x + 20; x < v.x + v.w; x += 64) {
    g.roundRect(x, v.y + bh * 0.3, 34, bh * 0.4, 6).fill(0xd8c8a0);
    g.roundRect(x, v.y + v.h - bh * 0.7, 34, bh * 0.4, 6).fill(0xd8c8a0);
  }
  return g;
}

// ================================================================== c89–c93: WESTERN
export const western: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', 'hipolito_tavern_cat', CERITO, COWBOY],
  build(ctx): FilmSet {
    const k = ctx.k;
    // three extreme close-ups of eyes (one per bar), then the wide street of the town
    const ecus = [eyesECU(ctx, ctx.canelo, 960, 540, 760), eyesECU(ctx, 'luzterna', 960, 540, 700), eyesECU(ctx, COWBOY, 960, 540, 720)];
    const twig = new Graphics();
    twig.moveTo(1180, 900).quadraticCurveTo(1420, 820, 1700, 860).stroke({ width: 16, color: 0x6a8a3a, cap: 'round' });
    for (let i = 0; i < 5; i++) twig.ellipse(1300 + i * 80, 830 + (i % 2) * 30, 30, 12).fill(0x7a9a4a);
    ecus[2].addChild(twig);
    const ecuC = new Container();
    for (const e of ecus) ecuC.addChild(e);
    // the wide: the desert street, a wooden wall with the poster, the tombstone, a tumbleweed
    const wide = new Container();
    const wg = new Graphics();
    wg.rect(-400, -400, 2720, 900).fill(0xe8c890).rect(-400, 500, 2720, 1100).fill(0xc8985a);
    wg.circle(1500, 260, 110).fill(0xfff0c8);
    for (let i = 0; i < 9; i++) wg.rect(-200 + i * 120, 180, 110, 560).fill(i % 2 ? 0x8a5a2a : 0x7a4a22).stroke({ width: 5, color: 0x3a2010 });
    wg.rect(-200, 160, 1080, 40).fill(0x5a3418);
    const poster = new Graphics().rect(300, 260, 330, 400).fill(0xf0e0b8).stroke({ width: 6, color: 0x3a2010 });
    const pt1 = word(k, 'SE BUSCA', { fontFamily: 'Playfair Display', fontWeight: '700', fontSize: 62, fill: 0x3a2010 });
    pt1.position.set(465, 320);
    const pt2 = word(k, 'CERITO', { fontFamily: 'Playfair Display', fontWeight: '700', fontSize: 70, fill: 0x6a2a10 });
    pt2.position.set(465, 600);
    const tomb = new Graphics();
    tomb.roundRect(1180, 560, 380, 420, 160).fill(0x9a9080).stroke({ width: 7, color: 0x3a2010 });
    const tt1 = word(k, 'AQUÍ YACE', { fontFamily: 'Playfair Display', fontWeight: '700', fontSize: 50, fill: 0x2a1a10 });
    tt1.position.set(1370, 700);
    const tt2 = word(k, 'UN OH SH—', { fontFamily: 'Playfair Display', fontWeight: '700', fontSize: 58, fill: 0x2a1a10 });
    tt2.position.set(1370, 790);
    const weed = new Graphics();
    for (let i = 0; i < 18; i++) weed.circle(0, 0, 40 + (i % 6) * 12).stroke({ width: 4, color: 0x7a5a2a, alpha: 0.8 });
    for (let i = 0; i < 14; i++) {
      const a = i * 0.45;
      weed.moveTo(Math.cos(a) * 20, Math.sin(a) * 20).lineTo(Math.cos(a + 1.4) * 100, Math.sin(a + 1.4) * 100).stroke({ width: 4, color: 0x6a4a1a });
    }
    const cer = new Cerito(ctx, 170);
    const trio = new Trio(ctx, 300);
    wide.addChild(wg, poster, pt1, pt2, cer, tomb, tt1, tt2, weed, trio.root);
    const root = new Container();
    root.addChild(ecuC, wide);
    ctx.plane(root, { z: 1000 });
    const strip = filmStrip(ctx);
    const rift = new Rift(87, ctx.k.view);
    const ui = new Container();
    ui.addChild(strip, rift);
    ctx.plane(ui, { z: 0, screen: true });
    const B = T(90) - T(89);
    return {
      update(lt, f) {
        const rm = ctx.rm;
        const shot = Math.min(3, Math.floor(lt / B));
        ecus.forEach((e, i) => (e.visible = shot === i));
        wide.visible = shot === 3;
        // each ECU slowly pushes in (a Leone squint)
        for (const e of ecus) {
          const s = 1 + (rm ? 0 : 0.04 * ((lt % B) / B));
          e.scale.set(s);
          e.pivot.set(960, 540);
          e.position.set(960, 540);
        }
        if (wide.visible) {
          const l = lt - 3 * B;
          weed.position.set(-200 + l * 900, 960 - Math.abs(Math.sin(l * 6)) * 60);
          weed.rotation = rm ? 0 : l * 6;
          trio.update(l, f, { x: 860, y: 420 + sm(seg(l, 0, 1.6)) * 360, s: 1, hold: 1, tumble: 0.4, luz: [250, -190], hipo: [-300, -40] });
          cer.position.set(1250, 640);
          cer.update(lt, { stare: 0.5 });
        }
        // out of the blank page of the last crack
        rift.reveal(seg(lt, 0, 0.5), rm);
        void f;
      },
    };
  },
};

// ================================================================== c93–c97: KAIJU (Pantalla)
export const kaiju: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', 'hipolito_tavern_cat', CERITO, MULTI.gatzilla],
  build(ctx): FilmSet {
    const k = ctx.k;
    // a miniature city from below (cardboard models), smoke, and GATZILLA himself (his painting) towering in the haze
    // over the rooftops: the spines, the cat's head, the claws — then his foot comes down on them
    const backC = new Container();
    const sky = new Graphics().rect(-400, -400, 2720, 1900).fill(0x6a6a6a);
    backC.addChild(sky);
    const gz = ctx.still(MULTI.gatzilla);
    if (gz) {
      gz.scale.set(-1500 / gz.texture.height, 1500 / gz.texture.height);
      gz.position.set(1360, 1520);
      gz.tint = 0x8a8a8a;
      gz.alpha = 0.85;
      backC.addChild(gz);
    }
    const back = new Graphics();
    backC.addChild(back);
    for (let i = 0; i < 10; i++) {
      const x = -260 + i * 240;
      const h = 380 + rnd(i) * 420;
      back.poly([x, 1100, x + 200, 1100, x + 170, 1100 - h, x + 30, 1100 - h]).fill(i % 2 ? 0x8a8a8a : 0x9a9a9a).stroke({ width: 5, color: 0x2a2a2a });
      for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) back.rect(x + 50 + c * 40, 1100 - h + 40 + r * 60, 22, 30).fill(rnd(i * 20 + r * 3 + c) > 0.5 ? 0xe8e8d0 : 0x4a4a4a);
    }
    ctx.plane(backC, { z: 1600, bake: 'static' });
    const shadow = new Graphics();
    const foot = new Container();
    const fg = new Graphics();
    // the giant scaly foot (Gatzilla): toes with claws, scales
    fg.roundRect(-420, -1400, 840, 1300, 200).fill(0x4a5a4a).stroke({ width: 10, color: 0x1a221a });
    for (let i = 0; i < 4; i++) {
      const x = -330 + i * 220;
      fg.roundRect(x - 90, -180, 180, 200, 80).fill(0x55665a).stroke({ width: 9, color: 0x1a221a });
      fg.poly([x - 30, 10, x, 90, x + 30, 10]).fill(0xe8e0c8).stroke({ width: 6, color: 0x1a221a });
    }
    for (let i = 0; i < 40; i++) fg.ellipse(-360 + rnd(i) * 720, -1300 + rnd(i + 5) * 1100, 30, 18).stroke({ width: 4, color: 0x2a3a2a });
    foot.addChild(fg);
    const dust = new Graphics();
    const cast = new Container();
    const trio = new Trio(ctx, 300);
    const cer = new Cerito(ctx, 150);
    cast.addChild(shadow, cer, trio.root, foot, dust);
    ctx.plane(cast, { z: 1000 });
    const sub = word(k, '¡¡OH NO!!', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 72, fill: 0xffe23a, stroke: { color: 0x101010, width: 9, join: 'round' }, letterSpacing: 2 });
    sub.position.set(960, 930);
    const ui = new Container();
    ui.addChild(sub);
    ctx.plane(ui, { z: 0, screen: true });
    const STOMP = 3.7;
    const PULL = 3.25;
    return {
      update(lt, f) {
        const rm = ctx.rm;
        // the foot comes down over them; she yanks him out by the scarf just in time
        const down = sm(seg(lt, 1.2, STOMP - 0.1));
        const slam = seg(lt, STOMP - 0.1, STOMP);
        const fy = -900 + down * 1500 + slam * 350;
        foot.position.set(760, Math.min(fy, 950));
        const sh = shadow.clear();
        sh.ellipse(760, 1040, 260 + down * 260, 40 + down * 30).fill({ color: 0x000000, alpha: 0.25 + down * 0.4 });
        const yank = rm ? sm(seg(lt, PULL, PULL + 0.6)) : outBack(seg(lt, PULL, PULL + 0.35), 1.6);
        const cx = 760 + yank * 640;
        const cy = 620 + Math.min(1, lt / 1.2) * 120;
        trio.update(lt, f, { x: cx, y: cy, s: 0.95, hold: 1, tumble: 0.4 + yank * 0.4, luz: [230 + (1 - yank) * 120, -220], hipo: [-340 + yank * -60, 30] });
        // the stomp: dust, the camera trembles (none with «Reducir movimiento»)
        const d = dust.clear();
        if (lt >= STOMP) {
          const q = seg(lt, STOMP, STOMP + 1.4);
          for (let i = 0; i < 14; i++) {
            const a = Math.PI + (i / 13) * Math.PI;
            d.circle(760 + Math.cos(a) * (200 + q * 420), 1060 + Math.sin(a) * (40 + q * 140), 50 + q * 60).fill({ color: 0xd8d8d0, alpha: (1 - q) * 0.7 });
          }
        }
        const shake = !rm && lt >= STOMP && lt < STOMP + 0.6 ? (1 - seg(lt, STOMP, STOMP + 0.6)) * 18 : 0;
        cast.position.set(Math.sin(lt * 70) * shake, Math.cos(lt * 60) * shake);
        cer.position.set(1560, 980);
        cer.update(lt, { stare: 0.5 });
        sub.visible = lt >= STOMP - 0.15 && lt < STOMP + 2.4;
        void f;
      },
    };
  },
};

// ================================================================== c97–c101: 8 BITS (+ the crack at c100)
/** draw a pixel sprite from rows of chars (each char = a palette index), block size `b` */
function pix(g: Graphics, x: number, y: number, b: number, rows: string[], pal: Record<string, number>) {
  rows.forEach((r, j) => {
    for (let i = 0; i < r.length; i++) {
      const c = pal[r[i]];
      if (c !== undefined) g.rect(x + i * b, y + j * b, b, b).fill(c);
    }
  });
}
const COME_OPEN = ['..y....y..', '.yyy..yyy.', '.yyyyyyyy.', 'yyykyyky..', 'yyyyyy....', 'yyyy......', 'yyyyyy....', 'yyyyyyyy..', '.yyyyyyyy.', '..yyyyyy..'];
const COME_SHUT = ['..y....y..', '.yyy..yyy.', '.yyyyyyyy.', 'yyykyykyyy', 'yyyyyyyyyy', 'yyyyyyyyyy', 'yyyyyyyyyy', 'yyyyyyyyyy', '.yyyyyyyy.', '..yyyyyy..'];
export const pixel: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', 'hipolito_tavern_cat', CERITO, MULTI.comecroquetas],
  build(ctx): FilmSet {
    const k = ctx.k;
    const S = { x: 330, y: 110, w: 1260, h: 860 };
    // the maze (blue pixel walls on navy), drawn once
    const maze = new Graphics();
    maze.rect(S.x, S.y, S.w, S.h).fill(0x05051a);
    const B = 30;
    const walls = [
      [0, 0, 42, 1],
      [0, 27, 42, 1],
      [0, 0, 1, 28],
      [41, 0, 1, 28],
      [4, 5, 12, 1],
      [20, 5, 1, 7],
      [25, 5, 12, 1],
      [4, 11, 1, 6],
      [8, 15, 26, 1],
      [37, 11, 1, 6],
      [4, 21, 14, 1],
      [24, 21, 14, 1],
      [20, 18, 1, 6],
    ];
    for (const [x, y, w, h] of walls) maze.rect(S.x + x * B, S.y + y * B, w * B, h * B).fill(0x2a3aff).rect(S.x + x * B + 6, S.y + y * B + 6, w * B - 12, h * B - 12).fill(0x05051a);
    ctx.plane(maze, { z: 1000, bake: 'static' });
    // the croquettes along the middle corridor (eaten as he passes)
    const croq = new Graphics();
    const game = new Container();
    const come = new Graphics();
    // Comecroquetas (his painting: the round yellow arcade cat, the wedge mouth, his row of croquettes) — the
    // code sprite stays only as the fallback if the painting isn't loaded
    const comeP = ctx.still(MULTI.comecroquetas);
    const COME_H = 230;
    if (comeP) comeP.scale.set(-COME_H / comeP.texture.height, COME_H / comeP.texture.height);
    const trio = new Trio(ctx, 190);
    const cer = new Cerito(ctx, 110);
    game.addChild(croq, cer, trio.root, come);
    if (comeP) game.addChild(comeP);
    ctx.plane(game, { z: 999 });
    // the cabinet bezel + the HUD (the «CONTINUE?» lives HERE, never over Canelo)
    const bezel = new Graphics();
    const v = ctx.k.view;
    bezel.rect(v.x - 20, v.y - 20, v.w + 40, v.h + 40).fill(0x1a0a2a).rect(S.x, S.y, S.w, S.h).cut();
    bezel.rect(S.x - 16, S.y - 16, S.w + 32, S.h + 32).stroke({ width: 12, color: 0x5a2a8a });
    for (let i = 0; i < 12; i++) bezel.rect(v.x + 30 + i * 30, v.y + 40 + i * 70, 8, 40).fill({ color: 0xff4fa0, alpha: 0.4 });
    const hud1 = word(k, '1UP 004500', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 40, fill: 0xffffff, letterSpacing: 6 }, 0);
    hud1.anchor.set(0, 0.5);
    hud1.position.set(S.x + 20, S.y + 46);
    const hud2 = word(k, 'HI 990000', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 40, fill: 0xff4fa0, letterSpacing: 6 }, 0);
    hud2.anchor.set(1, 0.5);
    hud2.position.set(S.x + S.w - 20, S.y + 46);
    const cont = word(k, 'CONTINUE?', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 64, fill: 0xffe23a, letterSpacing: 12 });
    cont.position.set(960, S.y + S.h - 60);
    const coin = word(k, 'INSERT COIN', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 30, fill: 0x9a9aff, letterSpacing: 8 });
    coin.position.set(960, S.y + S.h + 60);
    const rift = new Rift(100, ctx.k.view);
    const ui = new Container();
    ui.addChild(bezel, hud1, hud2, cont, coin, rift);
    ctx.plane(ui, { z: 0, screen: true });
    const CRACK = T(100) - T(97);
    const snap = (x: number) => Math.round(x / 12) * 12;
    const Y = S.y + 13 * B;
    return {
      update(lt, f) {
        const rm = ctx.rm;
        // the trio runs left → right along the corridor; Comecroquetas eats the row behind them and chases
        const run = seg(lt, 0, 4.8);
        const cx = snap(S.x + 200 + run * 850);
        const ex = snap(S.x + 40 + run * 760);
        const t8 = Math.floor(lt * 8) / 8;
        trio.update(t8, f, { x: cx, y: Y + 70, s: 1, hold: 1, tumble: 0, rotC: 0, flipC: true, luz: [-170, -60], hipo: [-330, 0] });
        const c = croq.clear();
        for (let i = 0; i < 30; i++) {
          const x = S.x + 60 + i * 38;
          if (x > ex + 40) c.rect(x, Y + 4, 12, 12).fill(0xd8a050);
        }
        const g = come.clear();
        const chomp = Math.floor(lt * 8) % 2 === 0;
        if (comeP) {
          // the chomp, on the arcade's eighths: a squash on every other step
          comeP.position.set(ex - 30, Y + 66);
          comeP.scale.y = (COME_H / comeP.texture.height) * (chomp ? 1 : 0.9);
        } else pix(g, ex - 60, Y - 60, 12, chomp ? COME_OPEN : COME_SHUT, { y: 0xffe23a, k: 0x101010 });
        cer.position.set(snap(S.x + 1100), snap(S.y + 600));
        cer.update(lt, { stare: 0.4 });
        // «CONTINUE?» blinks in the HUD (from the middle of the chase)
        cont.visible = lt > 2.2 && (rm || Math.floor(lt * 3) % 2 === 0);
        coin.visible = Math.floor(lt * 2) % 2 === 0 || rm;
        rift.crack(sm(seg(lt, CRACK, CRACK + 0.25)), sm(seg(lt, CRACK + 0.5, CRACK + 1.5)), rm);
      },
    };
  },
};

// ================================================================== c101–c105: EGIPTO (Mitos)
/** a cat god in profile (Bastet-like): a slender seated black cat, tall neck, gold collar and earring — faces `dir` */
function catGod(dir: 1 | -1): Container {
  const c = new Container();
  const g = new Graphics();
  const K = 0x16120e;
  const d = dir;
  // haunch + front legs (straight), a long neck, the head with two tall ears, the muzzle forward
  g.ellipse(-30 * d, -90, 90, 95).fill(K);
  g.poly([20 * d, 0, 50 * d, 0, 60 * d, -170, 30 * d, -200]).fill(K);
  g.poly([-20 * d, -150, 50 * d, -190, 70 * d, -300, 40 * d, -340, 0, -300, -40 * d, -200]).fill(K);
  g.ellipse(48 * d, -360, 46, 40).fill(K);
  g.poly([62 * d, -360, 118 * d, -350, 66 * d, -330]).fill(K);
  g.poly([24 * d, -380, 30 * d, -470, 56 * d, -392]).fill(K);
  g.poly([56 * d, -390, 82 * d, -466, 82 * d, -380]).fill(K);
  g.circle(62 * d, -366, 5).fill(0xe8b030);
  g.rect(Math.min(0, 70 * d) - 6, -300, 76, 16).fill(0xe8b030);
  g.circle(40 * d, -340, 6).fill(0x2a9ad8);
  g.moveTo(-100 * d, -10).quadraticCurveTo(-170 * d, -10, -150 * d, -90).stroke({ width: 14, color: K, cap: 'round' });
  c.addChild(g);
  return c;
}
export const egipto: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', 'hipolito_tavern_cat', CERITO],
  build(ctx): FilmSet {
    const k = ctx.k;
    // sandstone, a frieze band with hieroglyph borders
    const back = new Graphics();
    back.rect(-400, -400, 2720, 1900).fill(0xd8b878);
    for (let y = -400; y < 1500; y += 120) for (let x = (y / 120) % 2 ? -400 : -340; x < 2320; x += 240) back.rect(x, y, 236, 116).stroke({ width: 3, color: 0xb8985a });
    back.rect(-400, 150, 2720, 760).fill(0xe8d4a0).stroke({ width: 8, color: 0x7a5a2a });
    for (const y of [150, 880]) {
      back.rect(-400, y - 14, 2720, 28).fill(0x2a6ab0);
      for (let x = -380; x < 2300; x += 56) back.rect(x, y - 10, 28, 20).fill(0xc8402e);
    }
    // hieroglyph columns (eyes, birds, waves)
    for (let i = 0; i < 6; i++) {
      const x = 120 + i * 300;
      if (i === 2 || i === 3) continue;
      for (let r = 0; r < 4; r++) {
        const y = 240 + r * 150;
        if ((i + r) % 3 === 0) back.ellipse(x, y, 34, 16).stroke({ width: 5, color: 0x3a2a14 }).circle(x, y, 8).fill(0x3a2a14);
        else if ((i + r) % 3 === 1) back.moveTo(x - 40, y).lineTo(x - 20, y - 14).lineTo(x, y).lineTo(x + 20, y - 14).lineTo(x + 40, y).stroke({ width: 5, color: 0x2a6ab0 });
        else back.poly([x - 30, y + 20, x - 10, y - 30, x + 30, y - 20, x + 10, y + 20]).fill(0x3a2a14);
      }
    }
    ctx.plane(back, { z: 1300, bake: 'static' });
    const floor = new Graphics();
    const gods = [catGod(1), catGod(1), catGod(-1), catGod(-1)];
    const godX = [300, 520, 1400, 1620];
    const cast = new Container();
    for (const g of gods) cast.addChild(g);
    const trio = new Trio(ctx, 340);
    const cer = new Cerito(ctx, 150);
    cast.addChild(cer, trio.root, floor);
    ctx.plane(cast, { z: 1000 });
    // the censorship: a hieroglyph of a scared cat in a cartouche
    const glyph = new Container();
    const gg = new Graphics();
    gg.roundRect(-110, -170, 220, 340, 110).fill(0xf4e8c8).stroke({ width: 8, color: 0x7a5a2a });
    gg.poly([-40, 60, -50, -10, -20, -60, 20, -60, 50, -10, 40, 60]).fill(0x16120e);
    gg.poly([-20, -60, -34, -110, -4, -70]).fill(0x16120e).poly([20, -60, 34, -110, 4, -70]).fill(0x16120e);
    for (let i = 0; i < 7; i++) gg.moveTo(-50 + i * 16, -64).lineTo(-58 + i * 19, -96).stroke({ width: 4, color: 0x16120e });
    gg.circle(-12, -30, 8).fill(0xffffff).circle(12, -30, 8).fill(0xffffff);
    gg.ellipse(0, 0, 10, 14).fill(0xffffff);
    glyph.addChild(gg);
    glyph.position.set(960, 300);
    const bal = balloon(k, '¡Por fin alguien que me entiende!', { size: 54, tail: [-60, 130], wrap: 520 });
    bal.position.set(1180, 300);
    const rift = new Rift(100, ctx.k.view);
    const ui = new Container();
    ui.addChild(glyph, bal, rift);
    ctx.plane(ui, { z: 0, screen: true });
    const C103 = T(103) - T(101);
    const C104 = T(104) - T(101);
    return {
      update(lt, f) {
        const rm = ctx.rm;
        // they land in the frieze, Canelo in profile, happy (a little bounce); the gods bow to him
        const land = sm(seg(lt, 0.2, 0.9));
        const open = seg(lt, C104, C104 + 0.25);
        const drop = Math.pow(seg(lt, C104 + 0.15, C104 + 1.5), 2) * 900;
        const bounce = rm ? 0 : Math.abs(Math.sin(lt * 5)) * 16 * sm(seg(lt, 1.0, 1.4)) * (1 - open);
        trio.update(lt, f, { x: 960, y: 820 - (1 - land) * 500 - bounce + drop, s: 1, hold: 1, tumble: open * 0.8, rotC: open > 0 ? undefined : 0, flipC: false, luz: [260, -160], hipo: [-260, 0] });
        const bow = sm(seg(lt, 0.9, 1.8));
        gods.forEach((g, i) => {
          g.position.set(godX[i], 880);
          g.rotation = (i < 2 ? 1 : -1) * bow * 0.55;
          g.alpha = 1;
        });
        // the floor of the frieze opens under them
        const fl = floor.clear();
        if (open > 0) fl.rect(960 - 320 * open, 872, 640 * open, 40).fill(0x0c0804);
        cer.position.set(1560, 640);
        cer.update(lt, { stare: 0.5 });
        popIn(glyph, lt, 0.5, C103 - 0.1, rm);
        popIn(bal, lt, C103, C104 + 0.2, rm, 0.95);
        rift.reveal(seg(lt, 0, 0.5), rm);
        void f;
      },
    };
  },
};
void [Sprite, kitTex, impact, rigPoint, wrapScroll, TV];
