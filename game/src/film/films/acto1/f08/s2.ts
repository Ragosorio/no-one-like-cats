/**
 * F08 · c57–c73 — the glass breaks (O10) and the first three universes: NOIR DE CÓMIC (O11), VERSO ARÁCNIDO (O12),
 * ANIME (O13) — then the first white crack (O14, c72).
 */
import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { building } from '../../../styles/noir';
import { CERITO, TV, balloon, kitTex, outBack, popIn, rnd, seg, sm, word } from '../kit';
import { Cerito, Drive, MULTI, Rift, Shards, T, Trio, fallStreaks, hanging, impact, rigPoint, speedLines, wrapScroll } from './lib';

const L = TV.line;

/** a comic page border (white margins + the black panel line) over the picture */
function pageFrame(ctx: SceneCtx, o: { m?: number; tilt?: number; color?: number; line?: number } = {}): Graphics {
  const g = new Graphics();
  const v = ctx.k.view;
  const m = o.m ?? 34;
  const col = o.color ?? 0xf6f1e4;
  const x0 = v.x + m;
  const y0 = v.y + m;
  const x1 = v.x + v.w - m;
  const y1 = v.y + v.h - m;
  const t = o.tilt ?? 0;
  const inner = [x0, y0 + t, x1, y0 - t, x1, y1 + t, x0, y1 - t];
  g.rect(v.x - 20, v.y - 20, v.w + 40, v.h + 40).fill(col).poly(inner).cut();
  g.poly(inner).stroke({ width: o.line ?? 9, color: 0x101010, join: 'miter' });
  return g;
}
export { pageFrame };

// ================================================================== c57–c63: NOIR DE CÓMIC (the glass falls first)
export const noir: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', 'hipolito_tavern_cat', CERITO, MULTI.murciegato],
  build(ctx): FilmSet {
    const k = ctx.k;
    // the night sky + the far skyline (dof)
    const sky = new Graphics().rect(-400, -400, 2720, 1900).fill(0x07090d);
    sky.circle(600, 380, 240).fill(0xd8dce4);
    sky.circle(600, 380, 300).fill({ color: 0xd8dce4, alpha: 0.12 });
    for (let i = 0; i < 12; i++) building(sky, -300 + i * 220, 380 + (i % 3) * 60, 200, 900, { seed: 40 + i, color: 0x10141c, lit: 0.12, cols: 4, rows: 12 });
    ctx.plane(sky, { z: 3000, bake: 'dof', blur: 10, dof: 2400 });
    // the gothic facade the trio falls past (scrolls up): drawn twice in a tall strip
    const strip = new Container();
    const fac = new Graphics();
    const H = 1500;
    for (let rep = 0; rep < 2; rep++) {
      const y0 = rep * H;
      fac.rect(1280, y0, 700, H).fill(0x1d232d);
      for (let r = 0; r < 6; r++) {
        const y = y0 + 80 + r * 240;
        fac.roundRect(1340, y, 120, 170, 60).fill(0x0c0f15).stroke({ width: 6, color: 0x323b48 });
        fac.roundRect(1520, y, 120, 170, 60).fill(r % 2 ? 0xffd28a : 0x0c0f15).stroke({ width: 6, color: 0x323b48 });
        fac.rect(1300, y + 196, 680, 18).fill(0x323b48);
      }
    }
    strip.addChild(fac);
    ctx.plane(strip, { z: 1300 });
    // the cornice with the gargoyle and MURCIÉGATO (a silhouette on the edge, his back to us; he turns)
    const ledge = new Container();
    const lg = new Graphics();
    lg.poly([-200, 840, 900, 840, 940, 880, 940, 1300, -200, 1300]).fill(0x161b24).stroke({ width: 6, color: 0x2c333e });
    // gargoyle (left): hunched beast in stone
    lg.poly([90, 840, 120, 720, 180, 680, 260, 700, 300, 760, 340, 740, 330, 800, 280, 840]).fill(0x262c38).stroke({ width: 5, color: 0x3c4554 });
    lg.circle(250, 720, 8).fill(0x5a6474);
    ledge.addChild(lg);
    // Murciégato (his painting): a black silhouette against the moon first (his back to us), then he turns into the
    // light — the noir bake gives him his rim; cowl ears, scalloped cape, the fish-bone emblem
    const bat = new Container();
    const BAT_H = 500;
    const batBack = ctx.silhouette(MULTI.murciegato) ?? new Sprite();
    batBack.scale.set(-BAT_H / Math.max(1, batBack.texture.height), BAT_H / Math.max(1, batBack.texture.height));
    batBack.tint = 0x05060a;
    const batSide = ctx.actor(MULTI.murciegato, BAT_H) ?? new Container();
    bat.addChild(batBack, batSide);
    // on the gargoyle's back, left of the falling trio (they pass him: nobody covers him)
    bat.position.set(215, 735);
    ledge.addChild(bat);
    ctx.plane(ledge, { z: 1050 });
    // the trio (from now on she holds him by the scarf), Cerito in black ink with the rain
    const fallC = new Container();
    const trio = new Trio(ctx, 330);
    const cer = new Cerito(ctx, 190, { tint: 0x30343c });
    fallC.addChild(cer, trio.root);
    const rain = ctx.weather('rain');
    if (rain?.ground) fallC.addChild(rain.ground);
    ctx.plane(fallC, { z: 1000 });
    // «OH, #@!%»
    const bal = balloon(k, 'OH, #@!%', { size: 76, tail: [120, 140], font: 'Bangers' });
    // the TV's glass breaking toward us, the black sides of the old box falling away
    const shards = new Shards(ctx);
    const sides = new Graphics();
    const frame = pageFrame(ctx, { m: 22, line: 7 });
    const ui = new Container();
    ui.addChild(bal, frame, sides, shards);
    ctx.plane(ui, { z: 0, screen: true });
    return {
      update(lt, f) {
        const rm = ctx.rm;
        const v = ctx.k.view;
        // the shards fly at the camera (0–1.1 s); the black sides of the 4:3 fall
        shards.update(seg(lt, 0.05, 0.85), rm);
        shards.visible = lt < 0.95;
        const sd = sides.clear();
        if (lt < 1.0) {
          const fall = rm ? 0 : Math.pow(seg(lt, 0.05, 1.0), 2) * 1300;
          const a = rm ? 1 - sm(seg(lt, 0, 0.8)) : 1;
          sd.rect(v.x - 10, v.y - 10 + fall, 250 - v.x + 10, v.h + 20).fill({ color: 0x000000, alpha: a });
          sd.rect(1680, v.y - 10 + fall * 1.1, v.x + v.w - 1680 + 10, v.h + 20).fill({ color: 0x000000, alpha: a });
        }
        frame.alpha = sm(seg(lt, 0.6, 1.0));
        // falling: the facade scrolls up
        const sp = rm ? 260 : 620;
        strip.y = wrapScroll(lt * sp, H);
        const hold = sm(seg(lt, 0.25, 0.9));
        trio.update(lt, f, { x: 760, y: 480, s: 1, hold, tumble: 0.7, luz: [250, -250], hipo: [-330, -40] });
        // Murciégato turns slowly (back → three quarters, the eyes)
        const turn = sm(seg(lt, 3.2, 5.6));
        batBack.alpha = 1 - turn;
        batSide.alpha = turn;
        // the ledge rises past them (they fall by it)
        ledge.y = rm ? -60 * seg(lt, 0, 9.9) : -240 * seg(lt, 1.0, 9.9);
        // Cerito passes in black ink with the rain
        const cp = seg(lt, 5.4, 8.6);
        cer.visible = cp > 0 && cp < 1;
        cer.position.set(1240 - cp * 300, 900 - cp * 700);
        cer.update(lt, { stare: 0.6 });
        if (trio.canelo) {
          const hd = rigPoint(trio.canelo, 'head');
          if (hd) bal.position.set(Math.max(380, hd[0] - 200), Math.max(170, hd[1] - 250));
        }
        popIn(bal, lt, 2.2, 5.0, rm);
        void f;
      },
      look(lt) {
        // her lantern stays blue in the mono world while she holds him
        return lt > 0.5 ? { accHue: 0.58, accW: 0.07 } : null;
      },
    };
  },
};

// ================================================================== c63–c69: VERSO ARÁCNIDO
export const arana: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', 'hipolito_tavern_cat', CERITO, MULTI.aranya],
  build(ctx): FilmSet {
    const k = ctx.k;
    // a low angle: the towers converge up into a magenta sky; halftone dots over it
    const back = new Container();
    const bg = new Graphics();
    bg.rect(-400, -400, 2720, 1900).fill(0xff6aa8);
    bg.rect(-400, 500, 2720, 1100).fill(0xffb0c8);
    const vx = 960;
    const vy = -900;
    for (let i = 0; i < 9; i++) {
      const x = -300 + i * 300;
      const w = 220;
      const col = [0x2a3a8a, 0x3a1a6a, 0x1a5a8a][i % 3];
      bg.poly([x, 1500, x + w, 1500, vx + (x + w - vx) * 0.25, vy * 0.25 + 300, vx + (x - vx) * 0.25, vy * 0.25 + 300]).fill(col).stroke({ width: 7, color: 0x101010, join: 'round' });
      for (let r = 0; r < 8; r++) {
        const t = r / 8;
        const yy = 1500 - t * 1100;
        const xa = x + (vx + (x - vx) * 0.25 - x) * t;
        const xb = x + w + (vx + (x + w - vx) * 0.25 - (x + w)) * t;
        bg.moveTo(xa, yy).lineTo(xb, yy).stroke({ width: 4, color: 0xffd23a, alpha: 0.6 });
      }
    }
    back.addChild(bg);
    const dots = new TilingSprite({ texture: ctx.tex('cm:dots') ?? kitTex(ctx, 'glow'), width: 2800, height: 1800 });
    dots.position.set(-440, -360);
    dots.tint = 0x3a1a6a;
    dots.alpha = 0.22;
    back.addChild(dots);
    ctx.plane(back, { z: 1800, bake: 'static' });
    // the web strands across + GATO ARAÑA hanging upside down on his thread
    const web = new Graphics();
    for (let i = 0; i < 6; i++) web.moveTo(-200, 100 + i * 160).quadraticCurveTo(960, 300 + i * 140, 2120, 80 + i * 170).stroke({ width: 3, color: 0xffffff, alpha: 0.7 });
    // Gato Araña (his painting: the home-made red mask with the web, the blue sweater) hangs from his thread
    const spider = hanging(ctx, MULTI.aranya, 340).root;
    const thread = new Graphics();
    const webC = new Container();
    webC.addChild(web, thread, spider);
    ctx.plane(webC, { z: 1100 });
    const fallC = new Container();
    const trio = new Trio(ctx, 320);
    const cer = new Cerito(ctx, 180);
    const streaks = new Graphics();
    fallStreaks(streaks, 1920, 2200, 46, 0xffffff, 0.55, 3);
    fallC.addChild(streaks, cer, trio.root);
    ctx.plane(fallC, { z: 1000 });
    // the yellow narration box: «¡OH, MICH—!»
    const box = new Container();
    const bt = word(k, '¡OH, MICH—!', { fontFamily: 'Bangers', fontSize: 74, fill: 0x101010, letterSpacing: 3 });
    const bb = new Graphics().rect(-bt.width / 2 - 34, -60, bt.width + 68, 120).fill(0xffe23a).stroke({ width: 7, color: 0x101010 });
    box.addChild(bb, bt);
    box.position.set(560, 170);
    box.rotation = -0.03;
    const frame = pageFrame(ctx, { m: 30, tilt: 22 });
    const ui = new Container();
    ui.addChild(box, frame);
    ctx.plane(ui, { z: 0, screen: true });
    return {
      update(lt, f) {
        const rm = ctx.rm;
        // on twos: the whole universe animates at 12 fps
        const t2 = rm ? lt : Math.floor(lt * 12) / 12;
        streaks.y = wrapScroll(t2 * (rm ? 300 : 900), 1100) - 200;
        trio.update(t2, f, { x: 820, y: 560, s: 0.95, hold: 1, tumble: 0.6, luz: [270, -230], hipo: [-310, -50] });
        // he hangs from a thread and waves as they pass
        const sx = 1430;
        const sy = 260 + Math.sin(t2 * 1.4) * 20;
        thread.clear().moveTo(sx, -300).lineTo(sx, sy - 250).stroke({ width: 4, color: 0xffffff });
        spider.position.set(sx, sy - 250);
        // he swings as he waves them by (on twos, like the whole universe)
        spider.rotation = Math.sin(t2 * 1.2) * 0.12 + Math.sin(t2 * 8) * (rm ? 0.02 : 0.05);
        // Cerito in print dots
        cer.position.set(560 + Math.sin(t2) * 30, 900 - seg(lt, 0, 9.9) * 500);
        cer.rotation = rm ? 0 : Math.sin(t2 * 1.5) * 0.3;
        cer.update(lt, { stare: 0.5 });
        popIn(box, lt, 1.4, 6.4, rm);
      },
    };
  },
};

// ================================================================== c69–c73: ANIME (+ the crack at c72)
export const anime: SetModule = {
  cats: ({ canelo }) => [canelo, CERITO],
  build(ctx): FilmSet {
    const k = ctx.k;
    const back = new Container();
    const bg = new Graphics();
    const bands = [0x2a3a9a, 0x3a5ac0, 0x5a8ae0, 0x9ac8ff, 0xd8ecff];
    bands.forEach((c, i) => bg.rect(-400, -400 + i * 380, 2720, 400).fill(c));
    back.addChild(bg);
    ctx.plane(back, { z: 2000, bake: 'static' });
    const lines = new Graphics();
    speedLines(lines, 960, 540, 90, 420, 1600, 0xffffff, 7);
    lines.alpha = 0.85;
    const linesC = new Container();
    linesC.addChild(lines);
    linesC.pivot.set(960, 540);
    linesC.position.set(960, 540);
    ctx.plane(linesC, { z: 1500 });
    const fg = new Container();
    const drive = new Drive();
    const can = drive.add(ctx.actor(ctx.canelo, 980));
    if (can) fg.addChild(can);
    const shine = new Graphics();
    const sweat = new Graphics();
    fg.addChild(shine, sweat);
    const cer = new Cerito(ctx, 200);
    fg.addChild(cer);
    ctx.plane(fg, { z: 1000 });
    const nani = impact(ctx, '¿¡NANI!?', 190, 0xffffff, 0xd8262e, 'Dela Gothic One');
    nani.position.set(1290, 300);
    nani.rotation = -0.06;
    const rift = new Rift(72, ctx.k.view);
    const ui = new Container();
    ui.addChild(nani, rift);
    ctx.plane(ui, { z: 0, screen: true });
    const CRACK = T(72) - T(69);
    return {
      update(lt, f) {
        const rm = ctx.rm;
        drive.tick(lt);
        linesC.rotation = rm ? 0 : lt * 0.08;
        lines.alpha = 0.6 + (rm ? 0 : 0.25 * Math.sin(lt * 30));
        // the close-up: a jolt of surprise (squash) on the downbeat
        const jolt = rm ? 0 : Math.exp(-lt * 5) * 0.12;
        can?.pose(lt, 820, 1300, { sx: 1 + jolt, sy: 1 - jolt });
        // anime: huge sparkles in his eyes and a giant drop of sweat
        const s = shine.clear();
        const sw = sweat.clear();
        const p = can?.puppet;
        const rig = p?.brain.model?.rig;
        if (can && p && rig?.eyes) {
          const sc = p.scale.x * can.scale.x;
          for (const e of rig.eyes) {
            const ex = can.x + ((e[0] + e[2]) / 2 - p.anchor.x * p.W) * sc;
            const ey = can.y + ((e[1] + e[3]) / 2 - p.anchor.y * p.H) * p.scale.y * can.scale.y;
            s.circle(ex - 10, ey - 12, 16).fill(0xffffff).circle(ex + 12, ey + 10, 7).fill(0xffffff);
            s.star(ex - 30, ey - 34, 4, 14, 5).fill({ color: 0xffffff, alpha: 0.9 });
          }
          const hd = rigPoint(can, 'head');
          if (hd) {
            const dy = rm ? 0 : seg(lt, 0.6, 3.6) * 140;
            const x = hd[0] + 200;
            const y = hd[1] - 120 + dy;
            sw.moveTo(x, y - 110).quadraticCurveTo(x + 70, y, x, y + 46).quadraticCurveTo(x - 70, y, x, y - 110).fill(0xbfe6ff).stroke({ width: 7, color: L });
            sw.ellipse(x - 14, y - 20, 10, 22).fill({ color: 0xffffff, alpha: 0.9 });
          }
        }
        cer.position.set(1580, 960);
        cer.update(lt, { stare: 0.8 });
        popIn(nani, lt, 0.5, CRACK, rm);
        if (nani.visible && !rm) nani.scale.set(nani.scale.x * (1 + 0.03 * Math.sin(lt * 40)));
        // c72: the crack, then the white page opens
        rift.crack(sm(seg(lt, CRACK, CRACK + 0.25)), sm(seg(lt, CRACK + 0.55, CRACK + 1.5)), rm);
        void f;
      },
    };
  },
};
void [Sprite, outBack, rnd];
