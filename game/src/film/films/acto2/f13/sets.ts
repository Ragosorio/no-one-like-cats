/**
 * F13 «El Gran Torneo» — the sets (shot list in ./index.ts). A TV anime's «next episode» preview: the cel bake, flat
 * skies in bands, focus lines, giant slanted letters that slam in on every cut, an eyecatch.
 */
import { Container, Graphics } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import {
  Bitacora,
  FLAME,
  INK,
  LANTERN,
  SLUG,
  bandSky,
  bob,
  burst,
  env,
  fitArcTo,
  along,
  flame,
  glow,
  headband,
  jolt,
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
  tailTip,
  word,
  wordM,
} from '../kit';

const AN = { sky: [0x3a7ae0, 0x5a9af0, 0x8ac0ff, 0xc8e4ff], sun: 0xffe27a, red: 0xe5322d, yellow: 0xffd23a, ink: 0x14121e, white: 0xfffaf0, stone: 0xb8a890, gold: 0xf2c230 } as const;
/** the preview's slam text: huge, slanted, thick outline (built once) */
function slam(k: SceneCtx['k'], text: string, size: number, fill: number = AN.yellow, rot = -0.06): Container {
  const c = new Container();
  const back = wordM(k, text, { fontFamily: 'Bangers', fontSize: size, fill: AN.ink, letterSpacing: size * 0.04, align: 'center', stroke: { color: AN.ink, width: size * 0.22, join: 'round' } });
  back.position.set(size * 0.06, size * 0.08);
  const t = wordM(k, text, { fontFamily: 'Bangers', fontSize: size, fill, letterSpacing: size * 0.04, align: 'center', stroke: { color: AN.ink, width: size * 0.12, join: 'round' } });
  c.addChild(back, t);
  c.rotation = rot;
  return c;
}
/** a slam in: from huge to its size in 0.15 s with a shake; «Reducir movimiento»: a fade */
function slamIn(c: Container, lt: number, t0: number, t1: number, rm: boolean, base = 1) {
  const on = lt >= t0 && lt < t1;
  c.visible = on;
  if (!on) return;
  const p = seg(lt, t0, t0 + 0.16);
  if (rm) {
    c.alpha = sm(seg(lt, t0, t0 + 0.25));
    c.scale.set(base);
    return;
  }
  c.alpha = 1;
  c.scale.set(base * (1 + (1 - p) * 1.6));
}

// ------------------------------------------------------------------ 1 · the eyecatch
export const eyecatch: SetModule = {
  cats: ({ canelo }) => [canelo, SLUG.siames],
  build(ctx: SceneCtx): FilmSet {
    const k = ctx.k;
    const bg = new Graphics();
    bg.rect(-800, -600, 3520, 2280).fill(AN.yellow);
    bg.poly([-800, 1680, 2720, -600, 2720, 1680]).fill(AN.red);
    ctx.plane(bg, { z: 1400, bake: 'static', res: 0.5 });
    const rays = new Graphics();
    speedLines(rays, 0, 0, 260, 1800, { n: 44, color: 0xffffff, seed: 8, width: 0.025 });
    rays.alpha = 0.35;
    rays.position.set(960, 540);
    const pair = new Container();
    const can = ctx.actor(ctx.canelo, 520);
    const sia = ctx.actor(SLUG.siames, 560);
    const belt = new Graphics();
    // his painting's golden aura sits on the yellow half: a dark red burst behind him keeps its flames readable
    const back = new Graphics();
    burst(back, 215, 270 - 560 * 0.42, 330, { fill: 0x9a1420, n: 16, seed: 21, inner: 0.72 });
    back.alpha = 0.85;
    pair.addChild(back);
    if (can) pair.addChild(can);
    if (sia) pair.addChild(sia);
    pair.addChild(belt);
    pair.position.set(960, 560);
    const live = new Container();
    live.addChild(rays, pair);
    ctx.plane(live, { z: 1000 });
    const t1 = slam(k, '¡EN EL PRÓXIMO EPISODIO…!', 120);
    t1.position.set(960, 930);
    const top = new Container();
    top.addChild(t1);
    ctx.plane(top, { z: 0, screen: true });
    return {
      update(lt, f) {
        const rm = f.rm;
        rays.rotation = rm ? 0 : Math.floor(lt * 12) * 0.02;
        // back to back, the pair spins in (a full turn) and lands on the beat
        const p = seg(lt, 0, 0.9);
        pair.rotation = rm ? 0 : (1 - outBack(p, 1.2)) * Math.PI * 2;
        pair.scale.set(rm ? 1 : 0.3 + 0.7 * outBack(p, 1.6));
        can?.pose(lt, -200, 260, { flip: false });
        sia?.pose(lt, 215, 270, { flip: true });
        // (his painting wears its own red sash)
        belt.clear();
        slamIn(t1, lt, 1.35, 99, rm);
      },
    };
  },
};

// ------------------------------------------------------------------ 2 · the arena, the bracket, the chained gatera
const NAMES = ['CAPI', 'EL RIVAL', 'MOCHI-SAN', 'KAGE', 'BURBUJAS', 'GUIJARRO', 'ITŌ', '???'];
export const torneo: SetModule = {
  build(ctx: SceneCtx): FilmSet {
    const k = ctx.k;
    // the sea from the air and the stone arena with banners (flat cel)
    const sea = new Graphics();
    bandSky(sea, -800, -600, 3520, 300, AN.sky as unknown as number[]);
    sea.rect(-800, 300, 3520, 1600).fill(0x2a6ac8);
    for (let i = 0; i < 40; i++) sea.rect(-700 + rnd(i) * 3300, 340 + rnd(i + 3) * 1000, 60 + rnd(i) * 80, 6).fill({ color: 0xffffff, alpha: 0.6 });
    // pirate islets and the ninja cliffs at the sides
    sea.ellipse(-200, 520, 260, 60).fill(0xe8d090).stroke({ width: 6, color: AN.ink });
    sea.poly([2000, 700, 2200, 300, 2400, 700]).fill(0x5a8a5a).stroke({ width: 6, color: AN.ink });
    ctx.plane(sea, { z: 2400, bake: 'static', res: 0.6 });
    const arena = new Graphics();
    arena.ellipse(960, 640, 640, 300).fill(AN.stone).stroke({ width: 10, color: AN.ink });
    arena.ellipse(960, 620, 520, 220).fill(0xd8c8a8).stroke({ width: 8, color: AN.ink });
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const x = 960 + Math.cos(a) * 600;
      const y = 640 + Math.sin(a) * 280;
      arena.rect(x - 4, y - 110, 8, 110).fill(AN.ink);
      arena.poly([x + 4, y - 110, x + 64, y - 96, x + 4, y - 80]).fill(i % 3 === 0 ? AN.red : i % 3 === 1 ? AN.yellow : 0x2a9a5a).stroke({ width: 3, color: AN.ink });
    }
    // the crowd: rows of heads on the stands
    for (let r = 0; r < 3; r++)
      for (let i = 0; i < 46; i++) {
        const a = (i / 46) * Math.PI * 2;
        arena.circle(960 + Math.cos(a) * (560 + r * 26), 640 + Math.sin(a) * (250 + r * 12), 9).fill([0x3a2a4a, 0x6a3a2a, 0x2a3a6a][(i + r) % 3]);
      }
    ctx.plane(arena, { z: 1000, bake: 'static' });
    // the bracket (screen-ish plane, near): lines that light up, our name on the first line
    const br = new Container();
    const panel = new Graphics().roundRect(260, 150, 1400, 780, 30).fill({ color: AN.ink, alpha: 0.82 }).stroke({ width: 8, color: AN.gold });
    br.addChild(panel);
    const lines = new Graphics();
    br.addChild(lines);
    const names = NAMES.map((n, i) => {
      const t = wordM(k, n, { fontFamily: 'Bangers', fontSize: 46, fill: i === 0 ? AN.yellow : AN.white, letterSpacing: 3 }, 0);
      t.position.set(320, 230 + i * 88 - 23);
      br.addChild(t);
      return t;
    });
    const trophy = new Graphics();
    trophy.poly([1460, 470, 1580, 470, 1560, 560, 1480, 560]).fill(AN.gold).stroke({ width: 6, color: AN.ink });
    trophy.rect(1500, 560, 40, 60).fill(AN.gold).stroke({ width: 6, color: AN.ink });
    trophy.rect(1470, 620, 100, 24).fill(AN.gold).stroke({ width: 6, color: AN.ink });
    br.addChild(trophy);
    const brP = new Container();
    brP.addChild(br);
    ctx.plane(brP, { z: 700 });
    const ttl = slam(k, '¡EL GRAN TORNEO DEL MAR SHŌNEN!', 104);
    ttl.position.set(960, 120);
    // the gatera: a stone arch with a golden chain across, Cerito's prints (cel contour) going in under it
    const gate = new Container();
    const gg = new Graphics();
    gg.rect(-1000, -700, 3920, 2480).fill(0x5a4a3a);
    gg.roundRect(660, 220, 600, 760, 300).fill(0x2a2018).stroke({ width: 14, color: AN.ink });
    gg.roundRect(720, 300, 480, 700, 240).fill(0x0e0a08);
    // the chain
    for (let i = 0; i < 13; i++) gg.ellipse(690 + i * 46, 560 + Math.sin(i * 0.5) * 20 + (i % 2) * 4, 30, 18).stroke({ width: 12, color: AN.gold }).ellipse(690 + i * 46, 560 + Math.sin(i * 0.5) * 20, 30, 18).stroke({ width: 3, color: AN.ink });
    gg.roundRect(915, 590, 90, 80, 14).fill(AN.gold).stroke({ width: 6, color: AN.ink });
    gate.addChild(gg);
    const prints = new Graphics();
    gate.addChild(prints);
    gate.visible = false;
    const gP = new Container();
    gP.addChild(gate);
    ctx.plane(gP, { z: 990 });
    const t2 = slam(k, '¡SOLO EL CAMPEÓN CRUZA!', 120, AN.white, -0.04);
    t2.position.set(960, 930);
    const top = new Container();
    top.addChild(ttl, t2);
    ctx.plane(top, { z: 0, screen: true });
    return {
      update(lt, f) {
        const rm = f.rm;
        // 0–1.3 the arena from the air · 1.3–4.4 the bracket fills · 4.5 cut: the gatera
        slamIn(ttl, lt, 0.25, 4.45, rm, 0.92);
        br.visible = lt >= 1.3 && lt < 4.45;
        br.alpha = rm ? sm(seg(lt, 1.3, 1.6)) : 1;
        br.position.y = rm ? 0 : (1 - outBack(seg(lt, 1.3, 1.6), 1.4)) * 600;
        names.forEach((t, i) => {
          t.alpha = sm(seg(lt, 1.5 + i * 0.12, 1.65 + i * 0.12));
        });
        const g = lines.clear();
        const fill = seg(lt, 2.4, 3.9);
        for (let i = 0; i < 8; i += 2) {
          const y0 = 230 + i * 88;
          const y1 = y0 + 88;
          const lit = i === 0 ? fill : 0;
          for (const [a, b, c2, d] of [
            [580, y0, 760, y0],
            [580, y1, 760, y1],
            [760, y0, 760, y1],
            [760, (y0 + y1) / 2, 960, (y0 + y1) / 2],
          ])
            g.moveTo(a, b).lineTo(c2, d).stroke({ width: 6, color: AN.white, alpha: 0.5 });
          if (lit > 0) {
            g.moveTo(580, y0).lineTo(580 + 180 * Math.min(1, lit * 3), y0).stroke({ width: 10, color: AN.yellow });
            if (lit > 0.33) g.moveTo(760, y0).lineTo(760, y0 + 44 * Math.min(1, (lit - 0.33) * 3)).stroke({ width: 10, color: AN.yellow });
            if (lit > 0.66) g.moveTo(760, y0 + 44).lineTo(760 + 200 * Math.min(1, (lit - 0.66) * 3), y0 + 44).stroke({ width: 10, color: AN.yellow });
          }
        }
        for (const y of [318, 670]) g.moveTo(960, y).lineTo(1160, y).stroke({ width: 6, color: AN.white, alpha: 0.5 });
        g.moveTo(1160, 318).lineTo(1160, 670).moveTo(1160, 494).lineTo(1450, 494).stroke({ width: 6, color: AN.white, alpha: 0.5 });
        gate.visible = lt >= 4.45;
        // Cerito's prints walk in under the chain (the reason we're here)
        const pg = prints.clear();
        for (let i = 0; i < 7; i++) {
          const t0 = 4.7 + i * 0.16;
          if (lt < t0) continue;
          const x = 520 + i * 70 + (i % 2) * 12;
          const y = 1040 - i * 46;
          const s = 1 - i * 0.07;
          pg.ellipse(x, y, 20 * s, 15 * s).fill(0xdfe6ff).stroke({ width: 5, color: AN.ink });
          for (let tt = 0; tt < 4; tt++) pg.circle(x - 18 * s + tt * 12 * s, y - 22 * s - (tt === 1 || tt === 2 ? 5 : 0), 6.5 * s).fill(0xdfe6ff).stroke({ width: 4, color: AN.ink });
        }
        slamIn(t2, lt, 4.9, 99, rm);
      },
    };
  },
};

// ------------------------------------------------------------------ 3 · the rival who doesn't know you
export const rival: SetModule = {
  cats: [SLUG.rival],
  build(ctx: SceneCtx): FilmSet {
    const k = ctx.k;
    const bg = new Graphics().rect(-800, -600, 3520, 2280).fill(0xff8a3a);
    ctx.plane(bg, { z: 1400, bake: 'static', res: 0.4 });
    const fl = new Graphics();
    speedLines(fl, 0, 0, 330, 1700, { n: 70, color: 0xffd8a0, seed: 3, width: 0.022 });
    fl.position.set(960, 470);
    const riv = ctx.actor(SLUG.rival, 760);
    const band = new Graphics();
    const tears = new Graphics();
    const point = new Graphics();
    const live = new Container();
    live.addChild(fl);
    if (riv) live.addChild(riv);
    live.addChild(band, tears, point);
    ctx.plane(live, { z: 1000 });
    const q = slam(k, '«¡POR FIN NOS VOLVEMOS A VER,\nMI RIVAL DE LA INFANCIA!»', 78, AN.white, -0.03);
    q.position.set(960, 860);
    const n = slam(k, '(NUNCA LO HABÍAMOS VISTO)', 54, AN.yellow, 0.02);
    n.position.set(1380, 1000);
    const top = new Container();
    top.addChild(q, n);
    ctx.plane(top, { z: 0, screen: true });
    return {
      update(lt, f) {
        const rm = f.rm;
        fl.rotation = rm ? 0 : Math.floor(lt * 12) * 0.015;
        const [jx, jy] = jolt(lt, 0, 12, rm, 0.3);
        riv?.pose(lt, 960 + jx, 980 + jy, { flip: true, sy: 1 + (rm ? 0 : Math.sin(lt * 18) * 0.008) });
        const hd = riv?.head() ?? [0, -500];
        const hx = 960 - hd[0];
        const hy = 980 + hd[1];
        // (Príncipe Bigotón: no headband over his spiky hair — the tears are the gag)
        band.clear();
        // tears of emotion, streaming on twos
        const tg = tears.clear();
        const st = rm ? 0 : Math.floor(lt * 12);
        for (const d of [-1, 1])
          for (let i = 0; i < 3; i++) {
            const y = hy + 10 + ((st * 14 + i * 40) % 120);
            tg.ellipse(hx + d * 70 + d * i * 6, y, 11, 18).fill(0x9fe0ff).stroke({ width: 4, color: AN.ink });
          }
        // his paw pointing at the camera (a foreshortened circle with a finger)
        point.clear();
        slamIn(q, lt, 0.5, 99, rm, 1);
        slamIn(n, lt, 2.4, 99, rm, 1);
      },
    };
  },
};

// ------------------------------------------------------------------ 4 · THE RULE: Poder (under 50 %: one charged blow)
export const regla: SetModule = {
  cats: [SLUG.rival],
  build(ctx: SceneCtx): FilmSet {
    const k = ctx.k;
    const bg = new Graphics();
    bandSky(bg, -800, -600, 3520, 1500, [0x1a2a6a, 0x2a3a8a, 0x3a5aaa, 0x6a8ad0]);
    bg.rect(-800, 900, 3520, 900).fill(0x2a4a8a);
    ctx.plane(bg, { z: 1600, bake: 'static', res: 0.4 });
    const riv = ctx.actor(SLUG.rival, 560);
    const aura = new Graphics();
    const band = new Graphics();
    const shot = new Graphics();
    const lines = new Graphics();
    speedLines(lines, 0, 0, 240, 1500, { n: 60, color: 0xffffff, seed: 12, width: 0.02 });
    lines.position.set(560, 640);
    const live = new Container();
    live.addChild(lines, aura);
    if (riv) live.addChild(riv);
    live.addChild(band, shot);
    ctx.plane(live, { z: 1000 });
    // the HP bar (screen): drops under 50 % → red, blinking
    const hud = new Container();
    const hpBack = new Graphics().roundRect(120, 90, 720, 56, 14).fill({ color: AN.ink, alpha: 0.8 }).stroke({ width: 5, color: AN.white });
    const hp = new Graphics();
    const mark = new Graphics().rect(480 - 3, 82, 6, 72).fill(AN.white);
    const lab = word(k, 'EL RIVAL', { fontFamily: 'Bangers', fontSize: 40, fill: AN.white, letterSpacing: 3 });
    lab.anchor.set(0, 0.5);
    lab.position.set(130, 60);
    const half = word(k, '50 %', { fontFamily: 'Bangers', fontSize: 30, fill: AN.white });
    half.position.set(480, 176);
    hud.addChild(hpBack, hp, mark, lab, half);
    const scream = slam(k, '¡¡AAAAAH!!', 96, AN.white, -0.08);
    scream.position.set(1240, 300);
    const poder = slam(k, '¡PODER!', 170, AN.yellow, -0.05);
    poder.position.set(1240, 560);
    const cap = slam(k, 'BAJO EL 50 %: UN GOLPE CON AURA. UNA VEZ.', 56, AN.white, 0);
    cap.position.set(960, 990);
    hud.addChild(scream, poder, cap);
    ctx.plane(hud, { z: 0, screen: true });
    // the shot: the simulator's real flight, scaled up, from his paw to the right edge
    const pts = fitArcTo(realArcs()[0], [700, 520], [1900, 820], 220);
    return {
      update(lt, f) {
        const rm = f.rm;
        // 0–0.9 he's hit: HP drops past the mark · 0.9 the scream · 1.3 the aura · 2.9 the giant shot
        const drop = sm(seg(lt, 0.2, 0.9));
        const v = 0.68 - drop * 0.3;
        const g = hp.clear();
        const blink = v < 0.5 && !f.rf ? (Math.floor(lt * 6) % 2 ? 1 : 0.6) : 1;
        g.roundRect(128, 98, 704 * v, 40, 10).fill({ color: v < 0.5 ? AN.red : 0x3ad06a, alpha: blink });
        const [jx, jy] = jolt(lt, 0.25, 14, rm, 0.4);
        const charge = sm(seg(lt, 1.3, 2.0));
        riv?.pose(lt, 560 + jx, 960 + jy, { flip: false, sy: 1 + charge * 0.05, sx: 1 - charge * 0.03 });
        const hd = riv?.head() ?? [0, -380];
        band.clear();
        void hd;
        // the aura: layered flame tongues on twos (gold → white core)
        const a = aura.clear();
        if (charge > 0) {
          const st = rm ? 0 : Math.floor(lt * 12);
          for (const [col, sc, al] of [
            [0xffb020, 1.25, 0.55],
            [0xffe27a, 1.0, 0.8],
            [0xffffff, 0.7, 0.9],
          ] as const) {
            const pts2: number[] = [];
            for (let i = 0; i <= 18; i++) {
              const ang = Math.PI + (i / 18) * Math.PI;
              const r = (300 + (i % 2 ? 0 : 120 + rnd(st + i) * 120)) * sc * charge;
              pts2.push(560 + Math.cos(ang) * r * 0.75, 820 + Math.sin(ang) * r * 1.2);
            }
            a.poly(pts2).fill({ color: col, alpha: al });
          }
        }
        lines.visible = charge > 0;
        lines.rotation = rm ? 0 : Math.floor(lt * 12) * 0.02;
        // the giant shot along the real flight
        const s = shot.clear();
        const fp = seg(lt, 2.9, 3.7);
        if (fp > 0 && fp < 1) {
          const p = along(pts, fp);
          const r = 120 + fp * 60;
          s.circle(p.x, p.y, r * 1.3).fill({ color: 0xffb020, alpha: 0.5 }).circle(p.x, p.y, r).fill(0xffe27a).stroke({ width: 8, color: AN.ink }).circle(p.x, p.y, r * 0.55).fill(0xffffff);
          streaks(s, p.x - 600, p.y - r, 500, r * 2, { n: 10, color: 0xffe27a, seed: 4, len: 300 });
        }
        if (lt >= 3.7 && lt < 4.3) burst(s, 1820, 800, 220 * (rm ? 1 : outBack(seg(lt, 3.7, 3.9), 2)), { fill: 0xffffff, n: 14, seed: 6 });
        slamIn(scream, lt, 0.95, 2.9, rm);
        slamIn(poder, lt, 2.9, 99, rm);
        reveal(cap, lt, 3.7, 99, rm);
      },
    };
  },
};

// ------------------------------------------------------------------ 5 · half a second: Canelo panting, small flame
export const jadeo: SetModule = {
  cats: ({ canelo }) => [canelo],
  build(ctx: SceneCtx): FilmSet {
    const bg = new Graphics().rect(-800, -600, 3520, 2280).fill(0x2a2a4a);
    ctx.plane(bg, { z: 1400, bake: 'static', res: 0.3 });
    const can = ctx.actor(ctx.canelo, 760);
    const fg = new Graphics();
    const sweat = new Graphics();
    const live = new Container();
    if (can) live.addChild(can);
    live.addChild(fg, sweat);
    ctx.plane(live, { z: 1000 });
    return {
      update(lt, f) {
        const pant = f.rm ? 0 : Math.abs(Math.sin(lt * 14));
        can?.pose(lt, 900, 1060, { flip: true, sy: 1 - pant * 0.03, sx: 1 + pant * 0.02 });
        const g = fg.clear();
        const tip = tailTip(can);
        if (tip) flame(g, tip[0], tip[1], FLAME.minima, lt, { rm: f.rm, scale: 760 / 280 });
        const s = sweat.clear();
        const hd = can?.head() ?? [0, -500];
        s.ellipse(900 - hd[0] + 110, 1060 + hd[1] - 40, 12, 20).fill(0x9fe0ff).stroke({ width: 4, color: INK });
      },
    };
  },
};

// ------------------------------------------------------------------ 6 · Luzterna tries the poster pose; the eyecatch freezes her
export const pose: SetModule = {
  cats: [SLUG.luz],
  build(ctx: SceneCtx): FilmSet {
    const k = ctx.k;
    const bg = new Graphics();
    bg.rect(-800, -600, 3520, 2280).fill(0x5ab0ff);
    ctx.plane(bg, { z: 1400, bake: 'static', res: 0.3 });
    const rays = new Graphics();
    speedLines(rays, 960, 520, 300, 1600, { n: 36, color: 0xffffff, seed: 21, width: 0.03 });
    rays.alpha = 0.4;
    const rig = luzOf(ctx, 680);
    const lamp = glow(ctx, LANTERN, 180, 0.8);
    const live = new Container();
    live.addChild(rays);
    if (rig.actor) live.addChild(rig.actor);
    live.addChild(lamp);
    ctx.plane(live, { z: 1000 });
    // the freeze: the eyecatch band slams across and the frame goes still and tinted
    const frz = new Container();
    const band = new Graphics().rect(-200, 0, 2320, 160).fill(AN.red).stroke({ width: 8, color: AN.ink });
    band.rotation = -0.1;
    band.position.set(0, 820);
    const ex = slam(k, '¡!', 150, AN.yellow, 0.1);
    ex.position.set(1500, 330);
    frz.addChild(band, ex);
    ctx.plane(frz, { z: 0, screen: true });
    return {
      update(lt, f) {
        const rm = f.rm;
        const FR = 1.25;
        const tt = Math.min(lt, FR);
        // she tries the pose: lantern up, a wobble, one leg… and freezes mid-wobble
        rig.actor?.pose(tt, 960, 980 + bob(tt, rm), { rot: -0.18 * sm(seg(tt, 0.2, 0.7)) + (tt > 0.7 ? Math.sin(tt * 30) * 0.05 : 0), sx: 1 + sm(seg(tt, 0.2, 0.6)) * 0.05 });
        const la = lanternAt(rig);
        lamp.position.set(la[0], la[1]);
        rays.rotation = rm ? 0 : Math.floor(tt * 12) * 0.02;
        const frozen = lt >= FR;
        band.visible = frozen;
        band.position.x = rm || !frozen ? 0 : (1 - outBack(seg(lt, FR, FR + 0.15), 1.4)) * -1600;
        reveal(ex, lt, FR + 0.1, 99, rm);
      },
      look: (lt) => (lt >= 1.25 ? { sat: 0.55, contrast: 1.15, tint: 0xffd23a, tintAmt: 0.18 } : null),
    };
  },
};

// ------------------------------------------------------------------ 7 · the episode card: LO QUE ARRIESGAMOS · ¡NO TE LO PIERDAS!
export const riesgo: SetModule = {
  build(ctx: SceneCtx): FilmSet {
    const k = ctx.k;
    const bg = new Graphics();
    bg.rect(-800, -600, 3520, 2280).fill(AN.yellow);
    bg.poly([-800, 1680, 2720, -600, 2720, 1680]).fill(AN.red);
    ctx.plane(bg, { z: 1400, bake: 'static', res: 0.4 });
    const bit = new Bitacora(ctx, 'La gatera. Si perdemos, Cerito se queda solo del otro lado.', { enter: 'slide', w: 1440, size: 60, top: 200, tilt: -0.02, band: { text: 'PRÓXIMO EPISODIO', color: AN.red } });
    const stamp = slam(k, '¡NO TE LO PIERDAS!', 128, AN.yellow, -0.07);
    stamp.position.set(960, 900);
    const top = new Container();
    top.addChild(bit, stamp);
    ctx.plane(top, { z: 0, screen: true });
    return {
      update(lt, f) {
        bit.update(lt, f.rm);
        slamIn(stamp, lt, 3.7, 99, f.rm);
      },
    };
  },
};
