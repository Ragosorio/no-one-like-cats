/**
 * F08 · c73–c89 — ¡OH SHIT! 1: the world changes (quieter, stranger). EL GRITO (O15–O16: the frame itself screams;
 * Cerito clear for a second, looking at Canelo), TELENOVELA (O17: the triple zoom), PLASTILINA (O18: he steals the
 * bread) — then the second crack (O19, c87).
 */
import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { gradient, mixHex, paintField, swirl, wind } from '../../../styles/vangogh';
import { CERITO, TV, TvScreen, balloon, kitTex, outBack, popIn, rnd, seg, sm, word } from '../kit';
import { Cerito, Drive, MULTI, Rift, T, Trio, rigPoint } from './lib';

const L = TV.line;

/** paws on the cheeks (the scream), around a head point */
function screamPaws(g: Graphics, hd: [number, number] | null, r: number, col: number, k: number) {
  if (!hd || k <= 0.01) return;
  for (const s of [-1, 1]) {
    const x = hd[0] + s * r * (1.25 - 0.25 * k);
    const y = hd[1] + r * 0.1;
    g.ellipse(x, y, r * 0.32, r * 0.5).fill({ color: col, alpha: k }).stroke({ width: 5, color: 0x2a1408, alpha: k });
  }
}

// ================================================================== c73–c77: EL GRITO
export const grito: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', 'hipolito_tavern_cat', CERITO, MULTI.gritito],
  build(ctx): FilmSet {
    const b = ctx.baker;
    // the canvas: painted once (orange-red sky that undulates, the blue fjord, the bridge going off diagonally)
    const W = 1520;
    const H = 960;
    const HOR = 470;
    const sky = gradient([0xf2c44a, 0xe8902a, 0xd8562a, 0xc8402e, 0xe8902a]);
    const fjord = gradient([0x1b2a7a, 0x2f55b8, 0x0f1d4a]);
    const flow = swirl(wind(0.5, 0.006, 2), [
      { x: 520, y: 640, r: 260, s: 1 },
      { x: 1100, y: 700, r: 220, s: -1 },
    ]);
    const canvasTex = paintField(b, {
      w: W,
      h: H,
      flow: (x, y) => (y < HOR ? Math.sin(x * 0.006 + y * 0.02) * 0.45 : flow(x, y)),
      color: (x, y, r) => (y < HOR ? sky((y / HOR) * 0.85 + (r - 0.5) * 0.12) : y > H - 260 + (x - W) * -0.18 ? mixHex(0x6a3a1e, 0x9a5a2e, r) : fjord(((y - HOR) / (H - HOR)) * 0.8 + (r - 0.5) * 0.2)),
      under: (y) => (y < HOR ? 0xe8902a : 0x1b2a7a),
      density: 9,
      len: [30, 70],
      width: [9, 16],
      segs: 3,
      seed: 73,
    });
    // the canvas cut into horizontal strips (they undulate: the frame itself is the scream)
    const strips: Sprite[] = [];
    const N = 32;
    const canvas = new Container();
    for (let i = 0; i < N; i++) {
      const sp = new Sprite(new Texture({ source: canvasTex.source, frame: new Rectangle(0, (H / N) * i, W, H / N + 1) }));
      sp.position.set(200, 60 + (H / N) * i);
      strips.push(sp);
      canvas.addChild(sp);
    }
    // the bridge's railing (drawn on top, diagonal, Munch's)
    const rail = new Graphics();
    rail.poly([200, 1020, 1720, 560, 1720, 600, 200, 1100]).fill(0x7a4422).stroke({ width: 6, color: 0x2a1408 });
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const x = 200 + t * 1520;
      const y = 1020 - t * 460;
      rail.rect(x - 8, y - 140 * (1 - t * 0.6), 16, 140 * (1 - t * 0.6)).fill(0x5a3018);
    }
    rail.moveTo(200, 860).lineTo(1720, 470).stroke({ width: 14, color: 0x5a3018 });
    canvas.addChild(rail);
    ctx.plane(canvas, { z: 1000 });
    const cast = new Container();
    const trio = new Trio(ctx, 470);
    const paws = new Graphics();
    const cer = new Cerito(ctx, 200);
    // the local: El Gritito (his painting) screams at the far end of the bridge — it's his picture they fell into
    const gri = ctx.actor(MULTI.gritito, 300);
    if (gri) cast.addChild(gri);
    cast.addChild(cer, trio.root, paws);
    ctx.plane(cast, { z: 990 });
    // the gold frame on a museum wall
    const frame = new Graphics();
    const v = ctx.k.view;
    frame.rect(v.x - 20, v.y - 20, v.w + 40, v.h + 40).fill(0x3a0f14).rect(200, 60, W, H).cut();
    for (let i = 0; i < 6; i++) frame.rect(200 - 64 + i * 10, 60 - 64 + i * 10, W + 128 - i * 20, H + 128 - i * 20).stroke({ width: 10, color: [0x8a6a1a, 0xe8c45a, 0xb8902a, 0xf4dc8a, 0x9a7a2a, 0x5a4010][i] });
    for (let i = 0; i < 24; i++) {
      const x = 200 - 40 + (i % 12) * ((W + 80) / 11);
      const y = i < 12 ? 60 - 40 : 60 + H + 40;
      frame.circle(x, y, 9).fill(0xf4dc8a);
    }
    ctx.plane(frame, { z: 0, screen: true });
    const rift = new Rift(72, ctx.k.view);
    ctx.plane(rift, { z: 0, screen: true });
    const C74 = T(74) - T(73);
    const C76 = T(76) - T(73);
    return {
      update(lt, f) {
        const rm = ctx.rm;
        const j = ctx.k.judged('grita');
        const loud = !!j && j.r !== 'miss';
        const still = lt >= C74 && lt < C76;
        // the undulation: only the sky (default) · the whole frame (clic «¡GRITA!») · never with the still beat
        const amp = still ? 0.15 : 1;
        strips.forEach((sp, i) => {
          const y = i / N;
          const inSky = y * H < HOR;
          const a = (rm ? 6 : loud ? 46 : inSky ? 30 : 3) * amp * (loud || inSky ? 1 : 0.3);
          sp.x = 200 + Math.sin(lt * 2.4 + i * 0.45) * a;
        });
        // the trio on the bridge: paws on the face, screaming without a sound
        const scream = still ? 0.6 : sm(seg(lt, 0.15, 0.5));
        trio.update(rm ? 0 : lt * 0.3, f, { x: 820, y: 1040, s: 1, hold: 1, tumble: 0, rotC: 0, luz: [330, -190], hipo: [-380, 20] });
        const pg = paws.clear();
        screamPaws(pg, rigPoint(trio.canelo, 'head'), 120, 0xf4a65a, scream);
        screamPaws(pg, rigPoint(trio.luz.actor, 'head'), 110, 0xc9b8f4, scream);
        screamPaws(pg, rigPoint(trio.hipo, 'head'), 105, 0x9a9aa8, scream);
        rift.reveal(seg(lt, 0, 0.5), rm);
        gri?.pose(rm ? 0 : lt * 0.3, 1560, 650, { flip: true });
        // O16: Cerito, clear, still on the railing, looks at Canelo (only Canelo sees him)
        cer.visible = lt >= C74 - 0.1 && lt < C76 + 0.4;
        cer.position.set(1320, 655);
        cer.alpha = sm(seg(lt, C74 - 0.1, C74 + 0.2)) * (1 - sm(seg(lt, C76, C76 + 0.4)));
        cer.update(lt, { clear: 1, stare: 1 });
        // the push in on him while it holds (a calm move; «Reducir movimiento»: none)
        const push = still && !rm ? sm(seg(lt, C74, C76)) * 0.06 : 0;
        for (const c of [canvas, cast]) {
          c.pivot.set(1320, 640);
          c.position.set(1320, 640);
          c.scale.set(1 + push);
        }
        void kitTex;
      },
    };
  },
};

// ================================================================== c77–c81: TELENOVELA (the triple zoom)
export const novela: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', 'hipolito_tavern_cat', CERITO],
  build(ctx): FilmSet {
    const k = ctx.k;
    // the velvet curtain and a studio light
    const back = new Graphics();
    back.rect(-400, -400, 2720, 1900).fill(0x5a0a18);
    for (let i = 0; i < 26; i++) {
      const x = -300 + i * 100;
      back.rect(x, -400, 50, 1900).fill(0x7a1424);
      back.rect(x + 50, -400, 14, 1900).fill(0x9a2434);
    }
    back.rect(-400, -400, 2720, 220).fill(0xb8902a);
    for (let i = 0; i < 30; i++) back.moveTo(-400 + i * 100, -180).quadraticCurveTo(-350 + i * 100, -120, -300 + i * 100, -180).stroke({ width: 10, color: 0xe8c45a });
    ctx.plane(back, { z: 1400, bake: 'static' });
    const spot = new Sprite(kitTex(ctx, 'glow'));
    spot.anchor.set(0.5);
    spot.position.set(960, 520);
    spot.scale.set(5.5, 4.4);
    spot.tint = 0xffe6c8;
    spot.blendMode = 'add';
    spot.alpha = 0.4;
    const cast = new Container();
    const trio = new Trio(ctx, 420);
    const diva = new Graphics();
    const cer = new Cerito(ctx, 150, { tint: 0xffe0f0 });
    cast.addChild(spot, cer, trio.root, diva);
    ctx.plane(cast, { z: 1000 });
    const que = word(k, '¡¿QUÉÉÉ?!', { fontFamily: 'Playfair Display', fontStyle: 'italic', fontWeight: '700', fontSize: 150, fill: 0xf4dc8a, stroke: { color: 0x3a0a10, width: 12, join: 'round' }, dropShadow: { color: 0x000000, alpha: 0.6, distance: 10, blur: 4, angle: 1 } });
    que.position.set(960, 860);
    const ui = new Container();
    ui.addChild(que);
    ctx.plane(ui, { z: 0, screen: true });
    const tv = new TvScreen(ctx, { glare: 0.08 });
    ctx.plane(tv, { z: 0, screen: true });
    return {
      update(lt, f) {
        const rm = ctx.rm;
        // they drift down into the spotlight; he ends centred for the zooms
        const land = sm(seg(lt, 0, 0.6));
        trio.update(lt, f, { x: 975, y: 712 + (1 - land) * -500, s: 1, hold: 1, tumble: 0.2 * (1 - land), rotC: land > 0.99 ? -0.13 * sm(seg(lt, 2.1, 2.5)) : undefined, luz: [330, -170], hipo: [-350, 40] });
        // after the third zoom: the diva — his head thrown back, a soap-opera glint in his eye
        const d = diva.clear();
        const hd = rigPoint(trio.canelo, 'head');
        const divaK = sm(seg(lt, 2.1, 2.5));
        if (hd && divaK > 0) {
          const tw = rm ? 1 : 0.6 + 0.4 * Math.sin(lt * 9);
          d.star(hd[0] - 40, hd[1] - 20, 4, 30 * divaK * tw, 5).fill({ color: 0xffffff, alpha: divaK });
          d.star(hd[0] + 50, hd[1] - 5, 4, 18 * divaK * tw, 4).fill({ color: 0xffffff, alpha: divaK * 0.8 });
        }
        cer.position.set(1580, 320);
        cer.update(lt, { stare: 0.6 });
        popIn(que, lt, 2.1, 6.3, rm);
        spot.alpha = 0.35 + (rm ? 0 : 0.05 * Math.sin(lt * 3));
        tv.update(f);
      },
    };
  },
};

// ================================================================== c81–c89: PLASTILINA (+ the crack at c87)
const FAMILY = ['almohadon_pillow_cat', 'mochi_bell_cat', 'ronron_purr_cat'];
/** a thumbprint (concentric clay ridges) */
function thumb(g: Graphics, x: number, y: number, r: number, col: number) {
  for (let i = 1; i < 6; i++) g.ellipse(x, y, (r * i) / 6, (r * i) / 7.5).stroke({ width: 2, color: col, alpha: 0.35 });
}
export const plastilina: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', 'hipolito_tavern_cat', CERITO, ...FAMILY],
  build(ctx): FilmSet {
    const k = ctx.k;
    // the clay kitchen: lumpy wall, a cupboard, a table with a checked cloth, the breakfast
    const back = new Graphics();
    back.rect(-400, -400, 2720, 1900).fill(0xf2d49a);
    for (let i = 0; i < 40; i++) thumb(back, -200 + rnd(i) * 2300, -200 + rnd(i + 5) * 1100, 40 + rnd(i + 9) * 50, 0x9a6a3a);
    back.roundRect(1380, 120, 380, 420, 40).fill(0x7aa0d8).stroke({ width: 8, color: 0x3a4a7a });
    back.roundRect(1400, 140, 160, 380, 30).fill(0x8ab0e8).stroke({ width: 6, color: 0x3a4a7a });
    back.roundRect(1580, 140, 160, 380, 30).fill(0x8ab0e8).stroke({ width: 6, color: 0x3a4a7a });
    back.rect(-400, 920, 2720, 600).fill(0xc8885a);
    for (let i = 0; i < 20; i++) thumb(back, rnd(i + 30) * 1920, 960 + rnd(i + 40) * 300, 50, 0x6a3a1a);
    ctx.plane(back, { z: 1500, bake: 'static' });
    const table = new Graphics();
    table.roundRect(200, 780, 1100, 70, 34).fill(0xf6f2ea).stroke({ width: 8, color: 0x7a3a2a });
    for (let i = 0; i < 11; i++) for (let j = 0; j < 1; j++) table.rect(220 + i * 100, 790, 50, 50).fill({ color: 0xd8483a, alpha: 0.85 });
    table.roundRect(260, 850, 60, 230, 28).fill(0xa06a3a).stroke({ width: 6, color: 0x5a3018 });
    table.roundRect(1180, 850, 60, 230, 28).fill(0xa06a3a).stroke({ width: 6, color: 0x5a3018 });
    // plates and cups (clay blobs)
    for (const x of [420, 750, 1080]) {
      table.ellipse(x, 778, 90, 24).fill(0xffffff).stroke({ width: 5, color: 0x9a9aa8 });
      table.roundRect(x + 60, 720, 50, 60, 20).fill(0x58a0d8).stroke({ width: 5, color: 0x2a4a7a });
    }
    const bread = new Graphics();
    bread.ellipse(0, 0, 90, 46).fill(0xd8a050).stroke({ width: 6, color: 0x7a4a1a });
    for (let i = 0; i < 3; i++) bread.moveTo(-50 + i * 40, -30).quadraticCurveTo(-36 + i * 40, -6, -46 + i * 40, 22).stroke({ width: 5, color: 0x9a6a2a });
    const cast = new Container();
    const drive = new Drive();
    const fam = FAMILY.map((s) => drive.add(ctx.actor(s, 330)));
    for (const a of fam) if (a) cast.addChild(a);
    cast.addChild(table);
    const cer = new Cerito(ctx, 150);
    const cupDoor = new Graphics();
    cast.addChild(cer, cupDoor, bread);
    const trio = new Trio(ctx, 320);
    cast.addChild(trio.root);
    ctx.plane(cast, { z: 1000 });
    const ay = balloon(k, '¡Ay, caray!', { size: 60, tail: [-80, 120], font: 'Bangers', fill: 0xfff4dc });
    ay.position.set(560, 300);
    const rift = new Rift(87, ctx.k.view);
    const ui = new Container();
    ui.addChild(ay, rift);
    ctx.plane(ui, { z: 0, screen: true });
    const CRACK = T(87) - T(81);
    const STEAL = 3.3;
    return {
      update(lt, f) {
        const rm = ctx.rm;
        // stop motion: everything on twos
        drive.tick(lt);
        const t2 = rm ? lt : Math.floor(lt * 12) / 12;
        fam.forEach((a, i) => a?.pose(t2, 420 + i * 330, 790, { flip: i === 2, sy: 1 + (rm ? 0 : Math.sin(t2 * 6 + i) * 0.015) }));
        // the trio passes through the kitchen, top-left → bottom-right; he grabs the bread on the way
        const p = seg(lt, 0.3, 9.6);
        const x = 260 + p * 1300;
        const y = 120 + p * 760;
        trio.update(t2, f, { x, y, s: 0.9, hold: 1, tumble: 0.5, luz: [250, -200], hipo: [-290, -120] });
        // the bread: on the table → in his paws
        const got = lt >= STEAL;
        const hd = rigPoint(trio.canelo, 'head');
        if (got && hd) {
          bread.position.set(hd[0] + 40, hd[1] + 150);
          bread.rotation = Math.sin(t2 * 4) * 0.2;
        } else {
          bread.position.set(750, 742);
          bread.rotation = 0;
        }
        // the family looks up, the middle one cries «¡Ay, caray!»
        popIn(ay, lt, STEAL + 0.3, STEAL + 3.2, rm);
        // Cerito of clay peeks out of the cupboard
        const peek = sm(seg(lt, 4.8, 5.6)) * (1 - sm(seg(lt, 8.4, 9.0)));
        cupDoor.clear().roundRect(1400 - peek * 120, 140, 160, 380, 30).fill(0x8ab0e8).stroke({ width: 6, color: 0x3a4a7a });
        cer.position.set(1480, 510);
        cer.alpha = peek;
        cer.update(lt, { stare: 0.6 });
        // c87: the crack, the white page opens
        rift.crack(sm(seg(lt, CRACK, CRACK + 0.3)), sm(seg(lt, CRACK + 1.0, CRACK + 3.0)), rm);
      },
    };
  },
};
void outBack;
