/**
 * F08 · c37–c57 — LA TELE: the bathroom door (O1–O5, the legible beats) and the fall into the static (O6–O9) while the
 * 4:3 glass cracks (a hairline at c45, a second at c49, a web at c53).
 */
import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { CERITO, StaticKitten, TV, TvScreen, balloon, box, disc, kitTex, mug, outBack, popIn, rnd, seg, sm, word } from '../kit';
import { Drive, T, Trio, drawCracks, impact, rigPoint } from './lib';

const ESPUMA = 'espuma_bartender_cat';
const L = TV.line;

/** static flickering at the edges of the TV (the tear is near) */
function edgeStatic(ctx: SceneCtx): { root: Container; update(lt: number, k: number): void } {
  const root = new Container();
  const strips: TilingSprite[] = [];
  for (const [x, y, w, h] of [
    [240, 0, 1440, 70],
    [240, 1010, 1440, 70],
    [240, 0, 70, 1080],
    [1610, 0, 70, 1080],
  ] as const) {
    const t = new TilingSprite({ texture: kitTex(ctx, 'static'), width: w, height: h });
    t.position.set(x, y);
    strips.push(t);
    root.addChild(t);
  }
  return {
    root,
    update(lt, k) {
      const st = Math.floor(lt * 12);
      strips.forEach((s, i) => {
        s.tilePosition.set(rnd(st + i) * 400, rnd(st + i * 3) * 400);
        s.alpha = k * (ctx.rf ? 0.12 : 0.22) * (0.7 + 0.3 * rnd(st * 2 + i));
      });
    },
  };
}

/** the swirl of a hundred colours inside the tear (drawn once, turned per frame) */
function colourWheel(r: number): Graphics {
  const g = new Graphics();
  const cols = [0xff4fa0, 0x58d0ff, 0xf4a62a, 0x7fd39a, 0x9a6aff, 0xfff6e0, 0xff7a3a, 0x3a8bff];
  for (let i = 0; i < 48; i++) {
    const a0 = (i / 48) * Math.PI * 2;
    const a1 = ((i + 1) / 48) * Math.PI * 2;
    const tw = 0.9;
    g.poly([0, 0, Math.cos(a0) * r, Math.sin(a0) * r, Math.cos(a1 + tw) * r * 0.6, Math.sin(a1 + tw) * r * 0.6]).fill(cols[i % cols.length]);
  }
  for (let k = 0; k < 6; k++) g.circle(0, 0, r * (0.15 + k * 0.14)).stroke({ width: 10, color: 0xffffff, alpha: 0.18 });
  return g;
}

// ================================================================== c37–c45: the door
export const puerta: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', 'hipolito_tavern_cat'],
  build(ctx): FilmSet {
    const k = ctx.k;
    const world = new Container();
    // ---- O1: the handle turns by itself under his paw
    const o1 = new Container();
    const d1 = new Graphics();
    d1.rect(0, -200, 1920, 1480).fill(TV.pinkD);
    box(d1, 300, -40, 1320, 1200, TV.pink, { shadow: TV.pinkD, r: 0 });
    box(d1, 520, 80, 520, 260, TV.cream, { r: 8 });
    const wc = word(k, 'BAÑO', { fontFamily: 'Bangers', fontSize: 150, fill: TV.pinkD, stroke: { color: L, width: 8 } });
    wc.position.set(780, 210);
    // the static under the door (light from below)
    const crackLight = new Graphics().rect(300, 1000, 1320, 80).fill({ color: 0xcfe0ff, alpha: 0.6 });
    const handle = new Container();
    const hg = new Graphics();
    hg.circle(0, 0, 70).fill(0xe8c45a).stroke({ width: 7, color: L });
    hg.roundRect(-20, -26, 300, 52, 26).fill(0xe8c45a).stroke({ width: 7, color: L });
    hg.circle(0, 0, 26).fill(0xb8902a);
    handle.addChild(hg);
    handle.position.set(1180, 620);
    const paw = new Graphics();
    paw.roundRect(-120, -60, 330, 120, 60).fill(0xf4a65a).stroke({ width: 7, color: L });
    for (let i = 0; i < 3; i++) paw.moveTo(150 - i * 4, -40 + i * 40).lineTo(205, -40 + i * 40).stroke({ width: 5, color: L });
    paw.position.set(1320, 610);
    o1.addChild(d1, wc, crackLight, handle, paw);
    // ---- O2: the three, from inside the bathroom (the door opens toward us), lit from below by the static
    const o2 = new Container();
    const d2 = new Graphics();
    d2.rect(0, -200, 1920, 1480).fill(0x10142c);
    // the doorway (open), the bar's warm light behind them
    d2.rect(560, 60, 800, 1020).fill(0x3a2a40);
    d2.rect(560, 60, 800, 1020).stroke({ width: 10, color: L });
    // bathroom tiles in the foreground edges
    for (let y = 0; y < 1080; y += 90)
      for (let x = 0; x < 1920; x += 90) {
        if (x > 540 && x < 1380) continue;
        d2.rect(x + 3, y + 3, 84, 84).fill(0x1c2446).stroke({ width: 3, color: 0x0c1022 });
      }
    const trio2 = new Container();
    const drive = new Drive();
    const can2 = drive.add(ctx.actor(ctx.canelo, 420));
    const luz2 = drive.add(ctx.actor('luzterna', 380));
    const hip2 = drive.add(ctx.actor('hipolito_tavern_cat', 380));
    for (const a of [hip2, luz2, can2]) if (a) trio2.addChild(a);
    const under = new Graphics().rect(560, 760, 800, 320).fill({ color: 0x9fc4ff, alpha: 0.0 });
    const lightUp = new Sprite(kitTex(ctx, 'glow'));
    lightUp.anchor.set(0.5);
    lightUp.position.set(960, 1150);
    lightUp.scale.set(5, 2.6);
    lightUp.tint = 0xbfd8ff;
    lightUp.blendMode = 'add';
    const door = new Graphics();
    o2.addChild(d2, trio2, under, lightUp, door);
    const b1 = balloon(k, '¿Listos?', { size: 64, tail: [-40, 130] });
    b1.position.set(1040, 260);
    const b2 = balloon(k, 'No.', { size: 64, tail: [70, 120] });
    b2.position.set(700, 230);
    o2.addChild(b1, b2);
    // ---- O3: the tear in the bathroom wall (static edges, a hundred colours turning inside)
    const o3 = new Container();
    const d3 = new Graphics();
    d3.rect(0, -200, 1920, 1480).fill(0x2a3466);
    for (let y = -40; y < 1100; y += 110) for (let x = 0; x < 1920; x += 110) d3.rect(x + 4, y + 4, 102, 102).fill(0x38447e).stroke({ width: 4, color: 0x1c2456 });
    const holePts: number[] = [];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const r = 300 + (rnd(i * 3) - 0.5) * 120;
      holePts.push(960 + Math.cos(a) * r * 1.05, 540 + Math.sin(a) * r * 0.92);
    }
    const holeMask = new Graphics().poly(holePts).fill(0xffffff);
    const wheel = colourWheel(520);
    wheel.position.set(960, 540);
    wheel.mask = holeMask;
    const rim = new TilingSprite({ texture: kitTex(ctx, 'static'), width: 900, height: 820 });
    rim.position.set(510, 130);
    const rimMask = new Graphics().poly(holePts).stroke({ width: 46, color: 0xffffff });
    rim.mask = rimMask;
    const rimLine = new Graphics().poly(holePts).stroke({ width: 8, color: 0xffffff, alpha: 0.9 });
    o3.addChild(d3, wheel, holeMask, rim, rimMask, rimLine);
    // ---- O4: a footprint of Cerito glows at the edge of the tear and is erased
    const o4 = new Container();
    const d4 = new Graphics();
    d4.rect(0, -200, 1920, 1480).fill(0x2a3466);
    for (let y = 300; y < 1200; y += 140) for (let x = -40; x < 1960; x += 180) d4.poly([x, y, x + 170, y, x + 190, y + 130, x + 20, y + 130]).fill(0x38447e).stroke({ width: 4, color: 0x1c2456 });
    // the rim of the tear on the floor (top of frame)
    const tearEdge = new TilingSprite({ texture: kitTex(ctx, 'static'), width: 1920, height: 180 });
    tearEdge.position.set(0, 60);
    const tearMask = new Graphics();
    tearMask.moveTo(0, 60);
    for (let i = 0; i <= 20; i++) tearMask.lineTo(i * 96, 150 + Math.sin(i * 1.7) * 40);
    tearMask.lineTo(1920, 60).lineTo(1920, -100).lineTo(0, -100).fill(0xffffff);
    tearEdge.mask = tearMask;
    const print = new Graphics();
    const PX = 980;
    const PY = 620;
    for (let r = 4; r >= 0; r--) {
      const a = r === 0 ? 1 : 0.14;
      print.ellipse(PX, PY, 70 + r * 16, 56 + r * 14).fill({ color: 0xdff0ff, alpha: a });
      for (const [dx, dy] of [
        [-62, -78],
        [-22, -104],
        [24, -104],
        [64, -78],
      ])
        print.circle(PX + dx, PY + dy, 24 + r * 8).fill({ color: 0xdff0ff, alpha: a });
    }
    const pglow = new Sprite(kitTex(ctx, 'glow'));
    pglow.anchor.set(0.5);
    pglow.position.set(PX, PY - 30);
    pglow.scale.set(2.4);
    pglow.tint = 0x9fe8ff;
    pglow.blendMode = 'add';
    o4.addChild(d4, tearEdge, tearMask, pglow, print);
    // ---- O5: Canelo, a slow dolly in; he cracks his neck, crouches, takes a run-up
    const o5 = new Container();
    const d5 = new Graphics();
    d5.rect(0, -200, 1920, 1480).fill(0x1c2456);
    for (let y = -40; y < 1100; y += 110) for (let x = 0; x < 1920; x += 110) d5.rect(x + 4, y + 4, 102, 102).fill(0x26306a).stroke({ width: 4, color: 0x141c46 });
    const tearGlow = new Sprite(kitTex(ctx, 'glow'));
    tearGlow.anchor.set(0.5);
    tearGlow.position.set(1500, 500);
    tearGlow.scale.set(6);
    tearGlow.tint = 0xb9a6ff;
    tearGlow.blendMode = 'add';
    const wheel5 = colourWheel(360);
    wheel5.position.set(1560, 470);
    wheel5.alpha = 0.55;
    const can5c = new Container();
    const can5 = drive.add(ctx.actor(ctx.canelo, 700));
    if (can5) can5c.addChild(can5);
    o5.addChild(d5, tearGlow, wheel5, can5c);
    const b5 = balloon(k, 'Una noche nomás, dijo.', { size: 58, tail: [120, 140] });
    b5.position.set(620, 230);
    o5.addChild(b5);
    world.addChild(o1, o2, o3, o4, o5);
    ctx.plane(world, { z: 1000 });
    const es = edgeStatic(ctx);
    ctx.plane(es.root, { z: 0, screen: true });
    const tv = new TvScreen(ctx);
    ctx.plane(tv, { z: 0, screen: true });
    const C2 = T(38);
    const C3 = T(40);
    const C4 = T(41.125);
    const C5 = T(42);
    return {
      update(lt, f) {
        const rm = ctx.rm;
        drive.tick(lt);
        o1.visible = lt < C2;
        o2.visible = lt >= C2 && lt < C3;
        o3.visible = lt >= C3 && lt < C4;
        o4.visible = lt >= C4 && lt < C5;
        o5.visible = lt >= C5;
        if (o1.visible) {
          // the handle turns on its own, the paw jumps off it
          const p = rm ? sm(seg(lt, 0.05, 0.6)) : outBack(seg(lt, 0.05, 0.35), 2.2);
          handle.rotation = -0.75 * p;
          paw.position.set(1320 + p * 60, 610 - p * 70);
          paw.rotation = p * 0.25;
          crackLight.alpha = 0.4 + 0.3 * rnd(Math.floor(lt * 12));
        }
        if (o2.visible) {
          const l2 = lt - C2;
          hip2?.pose(l2, 700, 1110, { rot: 0.08 });
          luz2?.pose(l2, 1010, 900 + Math.sin(l2 * 1.7) * (rm ? 4 : 10), {});
          can2?.pose(l2, 1210, 1120, { flip: true });
          lightUp.alpha = 0.35 + 0.25 * rnd(Math.floor(lt * 12));
          // the door swings open toward us (its edge sweeps off the right)
          const op = sm(seg(l2, 0, 0.9));
          door.clear().rect(560 + op * 760, 60, 800 * (1 - op), 1020).fill(TV.pink).stroke({ width: 8, color: L });
          popIn(b1, l2, 0.45, 1.9, rm);
          popIn(b2, l2, 2.0, 3.3, rm);
        }
        if (o3.visible) {
          wheel.rotation = rm ? lt * 0.4 : lt * 1.6;
          rim.tilePosition.set(rnd(Math.floor(lt * 12)) * 300, rnd(Math.floor(lt * 12) + 9) * 300);
          rimLine.alpha = 0.6 + 0.4 * rnd(Math.floor(lt * 24));
        }
        if (o4.visible) {
          const l4 = lt - C4;
          const on = sm(seg(l4, 0, 0.18));
          const off = seg(l4, 0.55, 1.35);
          print.alpha = on * (1 - off);
          // erased left → right: shrink in x from the left
          print.scale.set(1, 1);
          pglow.alpha = on * (1 - off) * 0.8;
          tearEdge.tilePosition.set(rnd(Math.floor(lt * 12)) * 300, 0);
        }
        if (o5.visible) {
          const l5 = lt - C5;
          // dolly in (scale about his face)
          const dz = 1 + (rm ? 0.04 : 0.12) * sm(seg(l5, 0, 4.9));
          o5.scale.set(dz);
          o5.pivot.set(820, 640);
          o5.position.set(820, 640);
          // the neck crack (left, right), then a crouch for the run-up
          const crack = l5 > 0.9 && l5 < 1.6 ? Math.sin((l5 - 0.9) * Math.PI * 3) * 0.12 : 0;
          const crouch = sm(seg(l5, 3.6, 4.6));
          can5?.pose(l5, 820, 1120, { rot: rm ? 0 : crack, sx: 1 + crouch * 0.08, sy: 1 - crouch * 0.12 });
          wheel5.rotation = lt * (rm ? 0.3 : 1.2);
          tearGlow.alpha = 0.35 + 0.15 * Math.sin(lt * 5);
          popIn(b5, l5, 0.8, 3.6, rm);
        }
        es.update(lt, o1.visible ? 1 : 0.5);
        tv.update(f);
      },
    };
  },
};

// ================================================================== c45–c57: the jump and the fall through the static
export const tunel: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', 'hipolito_tavern_cat', CERITO, ESPUMA],
  build(ctx): FilmSet {
    const k = ctx.k;
    const world = new Container();
    // ---- O6: the bathroom floor tilts like a slide toward the tear
    const o6 = new Container();
    const room = new Container();
    const rg = new Graphics();
    rg.rect(-200, -400, 2320, 1880).fill(0x2a3466);
    for (let y = -400; y < 1300; y += 110) for (let x = -200; x < 2200; x += 110) rg.rect(x + 4, y + 4, 102, 102).fill(0x38447e).stroke({ width: 4, color: 0x1c2456 });
    rg.rect(-200, 820, 2320, 600).fill(0x4a568e).stroke({ width: 8, color: L });
    const tear6 = colourWheel(260);
    tear6.position.set(1500, 620);
    const tearRim = new Graphics();
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      tearRim.circle(1500 + Math.cos(a) * 250, 620 + Math.sin(a) * 250, 18).fill({ color: 0xffffff, alpha: 0.7 });
    }
    room.addChild(rg, tear6, tearRim);
    const drive = new Drive();
    const can6 = drive.add(ctx.actor(ctx.canelo, 380));
    const c6 = new Container();
    if (can6) c6.addChild(can6);
    o6.addChild(room, c6);
    // ---- O7–O9: the tunnel of static (rings that rush toward us), flashes of the bar, Cerito ahead
    const o7 = new Container();
    const bgT = new TilingSprite({ texture: kitTex(ctx, 'static'), width: 2400, height: 1600 });
    bgT.position.set(-240, -260);
    bgT.tint = 0x4a4f8a;
    o7.addChild(bgT);
    // the rings: frames of static drawn once (a texture fill with a hole — no masks), then only moved and scaled
    const rings: Graphics[] = [];
    const stTex = kitTex(ctx, 'static');
    for (let i = 0; i < 7; i++) {
      const rc = new Graphics();
      rc.rect(-800, -600, 1600, 1200).fill({ texture: stTex, color: [0x9a9ad8, 0xd8c8ff, 0x8fd8ff][i % 3] }).rect(-700, -520, 1400, 1040).cut();
      rc.rect(-700, -520, 1400, 1040).stroke({ width: 6, color: 0xffffff, alpha: 0.35 });
      rc.position.set(960, 540);
      rings.push(rc);
      o7.addChild(rc);
    }
    // flashes of the bar flying past: Espuma, a mug, the sign
    const flashes: { c: Container; t: number; dx: number; dy: number }[] = [];
    const esp = ctx.still(ESPUMA);
    if (esp) {
      const c = new Container();
      esp.scale.set(420 / esp.texture.height);
      c.addChild(esp);
      flashes.push({ c, t: 2.2, dx: -1, dy: -0.4 });
    }
    {
      const c = new Container();
      const g = new Graphics();
      mug(g, -60, -220, 120, 170, { fill: 0.85 });
      c.addChild(g);
      flashes.push({ c, t: 3.3, dx: 1, dy: 0.5 });
    }
    {
      const c = new Container();
      const t = word(k, 'LA ÚLTIMA RONDA', { fontFamily: 'Bangers', fontSize: 90, fill: TV.neonPink, stroke: { color: L, width: 8 }, letterSpacing: 4 });
      c.addChild(t);
      flashes.push({ c, t: 4.4, dx: 0.6, dy: -1 });
    }
    for (const fl of flashes) o7.addChild(fl.c);
    const cerito = new StaticKitten(ctx, 230);
    o7.addChild(cerito);
    const trio = new Trio(ctx, 330);
    o7.addChild(trio.root);
    // O9: the silent scream, censored the TV way (a black bar that says PIIIP)
    const scream = new Container();
    const sb = balloon(k, '  !!!  ', { size: 110, shout: true });
    const bar = new Graphics().roundRect(-300, -50, 600, 100, 10).fill(0x101010).stroke({ width: 6, color: 0xffffff });
    const beep = impact(ctx, 'PIIIIIP', 76, 0xffffff, 0x101010, 'Anton');
    scream.addChild(sb, bar, beep);
    o7.addChild(scream);
    world.addChild(o6, o7);
    ctx.plane(world, { z: 1000 });
    const glass = new Graphics();
    ctx.plane(glass, { z: 0, screen: true });
    const tv = new TvScreen(ctx);
    ctx.plane(tv, { z: 0, screen: true });
    const JUMP = 1.9;
    let lastCrack = -1;
    const c49 = T(49) - T(45);
    const c53 = T(53) - T(45);
    const c55 = T(55) - T(45);
    return {
      update(lt, f) {
        const rm = ctx.rm;
        drive.tick(lt);
        const j = ctx.k.judged('salta');
        const dive = !!j && j.r !== 'miss';
        o6.visible = lt < JUMP;
        o7.visible = lt >= JUMP - 0.15;
        if (o6.visible) {
          // the floor tilts toward the tear (a slide), he jumps — slow motion for a beat
          const tilt = sm(seg(lt, 0, 0.8)) * (rm ? 0.05 : 0.16);
          room.rotation = tilt;
          room.pivot.set(960, 540);
          room.position.set(960, 540);
          tear6.rotation = lt * (rm ? 0.3 : 1.4);
          const air = seg(lt, 0.15, 1.85);
          const slow = 0.5 - 0.5 * Math.cos(air * Math.PI);
          const x = 600 + slow * 900;
          const y = 900 - Math.sin(air * Math.PI) * 360 + air * 90;
          // the dive (clic «¡SALTA!») — an Olympic diver, stretched; else a belly flop, splayed
          const sh = 1 - air * 0.5;
          if (dive) can6?.pose(lt, x, y, { rot: rm ? -0.4 : -0.3 - air * 1.0, sx: 1.12 * sh, sy: 0.88 * sh });
          else can6?.pose(lt, x, y, { rot: rm ? 0.1 : 0.15 + air * 0.25, sx: (1.08 - air * 0.1) * sh, sy: 0.92 * sh });
        }
        if (o7.visible) {
          const l7 = lt - JUMP;
          const st = Math.floor(lt * 12);
          bgT.tilePosition.set(rnd(st) * 400, rnd(st + 1) * 400);
          const dens = sm(seg(lt, c53, c55 + 1));
          bgT.alpha = 0.55 + dens * 0.4;
          // rings rush toward the camera
          const speed = rm ? 0.18 : 0.45;
          rings.forEach((r, i) => {
            const ph = (l7 * speed + i / rings.length) % 1;
            const s = 0.12 + Math.pow(ph, 2.2) * 2.6;
            r.scale.set(s);
            r.alpha = sm(ph * 4) * (1 - sm((ph - 0.75) * 4)) * 0.85;
            r.rotation = rm ? 0 : Math.sin(l7 * 0.4 + i) * 0.08 + l7 * 0.05;
            r.tint = (st + i) % 2 ? 0xffffff : 0xc8c8e8;
          });
          // flashes of the bar flying past
          for (const fl of flashes) {
            const p = seg(lt, fl.t, fl.t + 1.1);
            fl.c.visible = p > 0 && p < 1;
            const e = p * p;
            fl.c.position.set(960 + fl.dx * 900 * e, 540 + fl.dy * 600 * e);
            fl.c.scale.set(0.2 + e * 2.2);
            fl.c.alpha = sm(p * 5) * (1 - sm((p - 0.7) / 0.3));
          }
          // the trio falls toward us; the camera turns slowly
          const roll = rm ? 0 : Math.sin(l7 * 0.35) * 0.18;
          o7.rotation = roll;
          o7.pivot.set(960, 540);
          o7.position.set(960, 540);
          const enter = sm(seg(l7, 0, 0.8));
          trio.update(l7, f, {
            x: 860,
            y: 560 + (1 - enter) * -200,
            s: 0.6 + enter * 0.4,
            tumble: 1,
            luz: [300 * enter, -250],
            hipo: [-320, -100 - (1 - enter) * 300],
          });
          // Cerito ahead of them, in pure static (O8)
          const cer = seg(lt, c49 - 0.6, c49 + 0.4);
          cerito.visible = cer > 0;
          cerito.position.set(1300 + Math.sin(l7 * 0.9) * 40, 720 + Math.sin(l7 * 1.6) * 20);
          cerito.rotation = rm ? 0 : Math.sin(l7 * 1.3) * 0.4;
          cerito.alpha = sm(cer);
          cerito.update(lt, { stare: 0.7 });
          // O9: the silent scream + the PIIIP
          const sc = lt >= c55 - 0.2 && lt < T(57) - T(45) - 0.1;
          scream.visible = sc;
          if (sc && trio.canelo) {
            const hd = rigPoint(trio.canelo, 'head');
            if (hd) scream.position.set(Math.max(760, Math.min(1260, hd[0] - 300)), Math.max(200, Math.min(820, hd[1] - 210)));
            const p = seg(lt, c55 - 0.2, c55 + 0.1);
            scream.scale.set(rm ? 1 : 0.6 + outBack(p) * 0.4);
            bar.visible = beep.visible = lt >= c55 + 0.35;
          }
        }
        // the glass: a hairline at c45, a second crack at c49, a web at c53 (all on the TV's glass)
        const n = lt < 0.25 ? 0 : lt < c49 ? 1 + sm(seg(lt, 0.25, 0.5)) * 0 : lt < c53 ? 2 + sm(seg(lt, c49, c49 + 0.3)) * 2 : 4 + sm(seg(lt, c53, c53 + 0.7)) * 34;
        const nn = n <= 0 ? 0 : lt < c49 ? sm(seg(lt, 0.25, 0.45)) : n;
        const q = Math.round(nn * 8) / 8;
        if (q !== lastCrack) {
          lastCrack = q;
          const g = glass.clear();
          if (q > 0) drawCracks(g, q, rm ? 0.6 : 1);
        }
        tv.update(f);
      },
    };
  },
};
void disc;
