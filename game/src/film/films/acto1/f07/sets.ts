/**
 * F07 «El Cadenero» — the sets (shot list in ./index.ts). Two inks (red + black) on yellow; the MAI paintings through
 * the poster bake; the mask, the brows and the hands are drawn on top of STILL sprites so they line up.
 */
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { Beam, Bitacora, TV, TvScreen, balloon, bob, box, kitTex, lanternAt, luzOf, outBack, popIn, rnd, seg, sm, word } from '../kit';
import { tape } from '../f03/print';

const RED = 0xd42a20;
const INK = 0x161010;
const YEL = 0xf5cd3c;
/**
 * El Cadenero: his painting (cadenero_bouncer_cat: huge brown doorman, black vest, arms crossed, the velvet-rope post).
 * On the POSTER he wears a luchador mask, code-drawn (the script: «en F07, con máscara» — posters exaggerate); in the
 * real bar he is just himself.
 */
export const CADENERO_STANDIN = 'cadenero_bouncer_cat';
/** your crew in the rule's comic panel (generic cats; the strongest gets the star) */
const CREW = ['chispa_sparkler_cat', 'tamborin_drum_cat', 'manzanita_apple_cat'];

const P = { x0: 290, x1: 1630, y0: 30, y1: 1830 };

/** wood type: a big word in one ink with a hard offset shadow in the other */
function woodType(ctx: SceneCtx, text: string, size: number, ink: number, shadow: number, o: { font?: string; spacing?: number } = {}): Container {
  const c = new Container();
  const st = { fontFamily: o.font ?? 'Anton', fontSize: size, letterSpacing: o.spacing ?? size * 0.05 };
  const sh = word(ctx.k, text, { ...st, fill: shadow });
  sh.position.set(size * 0.06, size * 0.06);
  const fg = word(ctx.k, text, { ...st, fill: ink });
  c.addChild(sh, fg);
  return c;
}
/** halftone dots in a rect (one ink), denser toward one corner */
function halftone(g: Graphics, x: number, y: number, w: number, h: number, color: number, step = 16, from: 'tl' | 'br' | 'all' = 'all') {
  for (let yy = y + step / 2; yy < y + h; yy += step)
    for (let xx = x + step / 2 + ((Math.floor((yy - y) / step) % 2) * step) / 2; xx < x + w; xx += step) {
      const u = from === 'all' ? 0.55 : from === 'tl' ? 1 - ((xx - x) / w + (yy - y) / h) / 2 : ((xx - x) / w + (yy - y) / h) / 2;
      const r = (step / 2) * Math.max(0.12, Math.min(0.95, u));
      g.circle(xx, yy, r).fill(color);
    }
}
/** a box (fighter's panel): yellow, thick black frame, optional red halftone backdrop */
function panel(g: Graphics, x: number, y: number, w: number, h: number, dots = true) {
  g.rect(x + 10, y + 12, w, h).fill(INK);
  g.rect(x, y, w, h).fill(YEL);
  if (dots) halftone(g, x, y, w, h, RED, 18, 'br');
  g.rect(x, y, w, h).stroke({ width: 10, color: INK });
}

/** rig points of a still `slug` of height `size` (anchor 0.5, 0.97) */
function rigOf(ctx: SceneCtx, slug: string, size: number) {
  const p = ctx.studio.puppet(slug);
  const rig = p?.brain.model?.rig;
  if (!p || !rig) {
    p?.destroy();
    return null;
  }
  const s = size / p.H;
  const L = (x: number, y: number): [number, number] => [(x - p.anchor.x * p.W) * s, (y - p.anchor.y * p.H) * s];
  const head = rig.head;
  const out = {
    head: [...L(head[0], head[1]), head[2] * s, head[3] * s] as [number, number, number, number],
    eyes: (rig.eyes ?? []).map((e) => [...L((e[0] + e[2]) / 2, (e[1] + e[3]) / 2), ((e[2] - e[0]) / 2) * s] as [number, number, number]),
  };
  p.destroy();
  return out;
}
/** El Cadenero as a still with a luchador mask over the head (red with black flames, white eye holes) */
function cadenero(ctx: SceneCtx, size: number, o: { mask?: boolean; shades?: boolean } = {}): Container {
  const c = new Container();
  const st = ctx.still(CADENERO_STANDIN);
  if (!st) return c;
  st.scale.set(size / st.texture.height);
  c.addChild(st);
  const rg = rigOf(ctx, CADENERO_STANDIN, size);
  if (!rg) return c;
  const [hx, hy, rx, ry] = rg.head;
  const g = new Graphics();
  if (o.mask) {
    g.ellipse(hx, hy - ry * 0.05, rx * 1.02, ry * 1.08).fill(RED).stroke({ width: 8, color: INK });
    // black flames over the brow, a white rim around the eye holes and the mouth
    for (let i = -2; i <= 2; i++) g.poly([hx + i * rx * 0.36 - rx * 0.14, hy - ry * 0.3, hx + i * rx * 0.36, hy - ry * 0.95, hx + i * rx * 0.36 + rx * 0.14, hy - ry * 0.3]).fill(INK);
    for (const s of [-1, 1]) {
      g.poly([hx + s * rx * 0.12, hy - ry * 0.05, hx + s * rx * 0.72, hy - ry * 0.28, hx + s * rx * 0.6, hy + ry * 0.2, hx + s * rx * 0.16, hy + ry * 0.14]).fill(0xfafafa).stroke({ width: 5, color: INK });
      g.circle(hx + s * rx * 0.4, hy + ry * 0.0, ry * 0.1).fill(INK);
    }
    g.ellipse(hx, hy + ry * 0.55, rx * 0.32, ry * 0.18).fill(0xfafafa).stroke({ width: 5, color: INK });
    g.moveTo(hx - rx * 0.18, hy + ry * 0.55).lineTo(hx + rx * 0.18, hy + ry * 0.55).stroke({ width: 4, color: INK });
  }
  if (o.shades) {
    // night shades and an earpiece (the real doorman)
    g.roundRect(hx - rx * 0.78, hy - ry * 0.22, rx * 0.7, ry * 0.36, 12).fill(0x14141e).stroke({ width: 5, color: TV.line });
    g.roundRect(hx + rx * 0.08, hy - ry * 0.22, rx * 0.7, ry * 0.36, 12).fill(0x14141e).stroke({ width: 5, color: TV.line });
    g.rect(hx - rx * 0.1, hy - ry * 0.1, rx * 0.2, 8).fill(TV.line);
    g.moveTo(hx + rx * 0.95, hy).quadraticCurveTo(hx + rx * 1.15, hy + ry * 0.5, hx + rx * 0.9, hy + ry * 0.9).stroke({ width: 4, color: 0x3a3a4a });
  }
  c.addChild(g);
  return c;
}

/** the whole poster (static parts) + its live parts */
function poster(ctx: SceneCtx) {
  const root = new Container();
  const W = P.x1 - P.x0;
  const H = P.y1 - P.y0;
  const tex = ctx.tex('ca:paper') as Texture | undefined;
  const g0 = new Graphics();
  g0.rect(P.x0 + 16, P.y0 + 20, W, H).fill({ color: 0x000000, alpha: 0.45 });
  root.addChild(g0);
  if (tex) {
    const s = new Sprite(tex);
    s.position.set(P.x0, P.y0);
    s.setSize(W, H);
    root.addChild(s);
  } else root.addChild(new Graphics().rect(P.x0, P.y0, W, H).fill(YEL));
  const g = new Graphics();
  // border rules
  g.rect(P.x0 + 24, P.y0 + 24, W - 48, H - 48).stroke({ width: 8, color: INK });
  g.rect(P.x0 + 40, P.y0 + 40, W - 80, H - 80).stroke({ width: 3, color: RED });
  // the A 2 DE 3 CAÍDAS ribbon
  g.poly([480, 340, 1440, 340, 1410, 372, 1440, 404, 480, 404, 510, 372]).fill(RED).stroke({ width: 5, color: INK, join: 'round' });
  // the three fighter boxes
  panel(g, 320, 450, 420, 400); // the door
  panel(g, 1200, 450, 410, 400); // Canelo
  panel(g, 770, 430, 400, 640); // El Cadenero (tall)
  // the door, in the left box: red door, BAÑO sign, static in halftone around the slit
  g.rect(430, 500, 200, 330).fill(RED).stroke({ width: 6, color: INK });
  g.rect(460, 530, 140, 60).fill(YEL).stroke({ width: 4, color: INK });
  halftone(g, 632, 500, 90, 330, INK, 12, 'all');
  // the rule's comic row
  panel(g, 330, 1380, 610, 400, false);
  panel(g, 980, 1380, 610, 400, false);
  halftone(g, 330, 1380, 610, 400, RED, 22, 'tl');
  halftone(g, 980, 1380, 610, 400, RED, 22, 'br');
  root.addChild(g);
  const banio = word(ctx.k, 'BAÑO', { fontFamily: 'Anton', fontSize: 44, fill: INK, letterSpacing: 4 });
  banio.position.set(530, 560);
  root.addChild(banio);
  // texts
  const t1 = woodType(ctx, 'FUNCIÓN ESTELAR', 150, RED, INK);
  t1.position.set(960, 160);
  const t2 = woodType(ctx, 'LA ÚLTIMA RONDA · LA PUERTA DEL BAÑO', 54, INK, RED, { spacing: 3 });
  t2.position.set(960, 290);
  const t3 = word(ctx.k, 'A 2 DE 3 CAÍDAS', { fontFamily: 'Bebas Neue', fontSize: 50, fill: YEL, letterSpacing: 8 });
  t3.position.set(960, 373);
  const capDoor = word(ctx.k, 'DETRÁS: EL RASTRO\nDEL CHIQUITO', { fontFamily: 'Anton', fontSize: 40, fill: INK, align: 'center', lineHeight: 44, letterSpacing: 2 });
  capDoor.position.set(530, 935);
  const capCan = word(ctx.k, 'ES LA ÚNICA\nPUERTA', { fontFamily: 'Anton', fontSize: 46, fill: RED, align: 'center', lineHeight: 50, letterSpacing: 2, stroke: { color: INK, width: 3 } });
  capCan.position.set(1405, 935);
  const capCad = woodType(ctx, 'EL CADENERO', 104, RED, INK);
  capCad.position.set(970, 1150);
  const capCad2 = word(ctx.k, 'EL MURO DE LA ÚLTIMA RONDA', { fontFamily: 'Bebas Neue', fontSize: 50, fill: INK, letterSpacing: 6 });
  capCad2.position.set(970, 1245);
  const reglaT = woodType(ctx, 'REGLA: LISTA VIP', 64, INK, RED);
  reglaT.position.set(960, 1318);
  root.addChild(t1, t2, t3, capDoor, capCan, capCad, capCad2, reglaT);
  // Canelo, brave, as the poster artist drew him (brows and a shine on top)
  const can = new Container();
  const cs = ctx.still(ctx.canelo);
  if (cs) {
    cs.scale.set(360 / cs.texture.height);
    can.addChild(cs);
    const rg = rigOf(ctx, ctx.canelo, 360);
    if (rg) {
      const b = new Graphics();
      for (const [ex, ey, er] of rg.eyes) {
        const s = ex < rg.head[0] ? -1 : 1;
        b.moveTo(ex - s * er * 1.4, ey - er * 2.2).lineTo(ex + s * er * 1.1, ey - er * 1.3).stroke({ width: 10, color: INK, cap: 'round' });
      }
      b.star(rg.head[0] + rg.head[2] * 0.9, rg.head[1] - rg.head[3] * 0.8, 4, 26, 8).fill(0xffffff).stroke({ width: 3, color: INK });
      can.addChild(b);
    }
  }
  can.position.set(1405, 840);
  root.addChild(can);
  // El Cadenero with his mask
  const cad = cadenero(ctx, 600, { mask: true });
  cad.position.set(970, 1060);
  root.addChild(cad);
  // the rule's comic panels: (A) he checks the bracelet of your strongest cat (B) the hand in its face
  const crewC = new Container();
  CREW.forEach((slug, i) => {
    const s = ctx.still(slug);
    if (!s) return;
    s.scale.set(200 / s.texture.height);
    s.position.set(410 + i * 120, 1762);
    crewC.addChild(s);
  });
  const crewG = new Graphics();
  // the deck they stand on, their power, the star on the strongest (the middle one)
  crewG.rect(340, 1760, 410, 16).fill(INK);
  crewG.star(530, 1500, 5, 30, 13).fill(YEL).stroke({ width: 4, color: INK });
  // the bracelet on the strongest one: a red band
  crewG.roundRect(508, 1700, 46, 16, 6).fill(RED).stroke({ width: 3, color: INK });
  crewC.addChild(crewG);
  for (const [txt, x] of [
    ['120', 410],
    ['340', 530],
    ['90', 650],
  ] as const) {
    const t = word(ctx.k, txt, { fontFamily: 'Anton', fontSize: 30, fill: INK });
    t.position.set(x, 1545);
    crewC.addChild(t);
  }
  const cadA = cadenero(ctx, 370, { mask: true });
  cadA.position.set(850, 1776);
  const clip = new Graphics();
  clip.rect(700, 1590, 70, 90).fill(0xfafafa).stroke({ width: 4, color: INK });
  for (let i = 0; i < 4; i++) clip.rect(710, 1605 + i * 18, 50, 5).fill(INK);
  const panelA = new Container();
  panelA.addChild(crewC, cadA, clip);
  const balA = balloon(ctx.k, '¡NO ESTÁS EN LA LISTA!', { size: 32, tail: [170, 60], fill: 0xffffff });
  balA.position.set(600, 1428);
  // (B): the strongest cat, a huge hand in its face, its cannon crossed out
  const panelB = new Container();
  const SZ = 290;
  const strong = ctx.still(CREW[1]);
  const SX = 1130;
  const SY = 1770;
  if (strong) {
    strong.scale.set(SZ / strong.texture.height);
    strong.position.set(SX, SY);
    panelB.addChild(strong);
  }
  const srg = rigOf(ctx, CREW[1], SZ);
  const fx = SX + (srg ? srg.head[0] : 0);
  const fy = SY + (srg ? srg.head[1] : -SZ * 0.7);
  const handG = new Graphics();
  // a big flat hand (palm + four fingers) pressed on its face, from the right (the doorman's arm)
  handG.rect(fx + 70, fy - 40, 260, 80).fill(0x8a5a3a).stroke({ width: 6, color: INK });
  handG.roundRect(fx - 40, fy - 70, 130, 140, 34).fill(0x8a5a3a).stroke({ width: 6, color: INK });
  for (let i = 0; i < 4; i++) handG.roundRect(fx - 96, fy - 64 + i * 32, 80, 28, 13).fill(0x8a5a3a).stroke({ width: 5, color: INK });
  // impact lines around the hand
  for (let i = 0; i < 6; i++) {
    const an = Math.PI * 0.6 + i * 0.36;
    handG.moveTo(fx - 40 + Math.cos(an) * 110, fy + Math.sin(an) * 110).lineTo(fx - 40 + Math.cos(an) * 150, fy + Math.sin(an) * 150).stroke({ width: 6, color: INK });
  }
  // its cannon, crossed out
  handG.rect(1400, 1660, 130, 46).fill(INK);
  handG.circle(1420, 1715, 22).fill(INK);
  handG.moveTo(1380, 1640).lineTo(1560, 1740).moveTo(1560, 1640).lineTo(1380, 1740).stroke({ width: 12, color: RED, cap: 'round' });
  panelB.addChild(handG);
  const capB = word(ctx.k, 'ESE NO DISPARA\nESTE TURNO', { fontFamily: 'Anton', fontSize: 38, fill: INK, align: 'center', lineHeight: 42 });
  capB.position.set(1440, 1440);
  panelB.addChild(capB);
  root.addChild(panelA, panelB, balA);
  return { root, panelA, panelB, balA, t1, t2, t3, capDoor, capCan, capCad, capCad2, reglaT, can, cad };
}

/** the bar's back wall the poster is pasted on (dark wood + wallpaper) */
function wall(): Graphics {
  const g = new Graphics();
  g.rect(-400, -400, 2720, 2600).fill(TV.nightD);
  for (let x = -400; x < 2320; x += 90) g.rect(x, -400, 34, 2600).fill(0x1a2252);
  g.rect(-400, 1500, 2720, 700).fill(TV.woodD);
  return g;
}

// ------------------------------------------------------------------ 1 · cartel: unrolls, punches into each box
export const cartel: SetModule = {
  cats: ({ canelo }) => [canelo, CADENERO_STANDIN, ...CREW],
  build(ctx): FilmSet {
    const rm = ctx.rm;
    ctx.plane(wall(), { z: 1100, bake: 'static' });
    const Pp = poster(ctx);
    // static poster (baked, crisp enough for the punch-ins) + the live parts animated over it
    const live = new Container();
    const unrollMask = new Graphics();
    const posterC = new Container();
    posterC.addChild(Pp.root);
    posterC.mask = unrollMask;
    live.addChild(posterC, unrollMask);
    const roll = new Graphics();
    live.addChild(roll);
    const buzz = new Graphics();
    live.addChild(buzz);
    const chant = new Container();
    const syll = ['¡CA-', 'DE-', 'NE-', 'RO!'].map((s, i) => {
      const c = new Container();
      const burst = new Graphics();
      burst.star(0, 0, 14, 120, 80, rnd(i) * 0.5).fill(0xfafafa).stroke({ width: 6, color: INK });
      const t = woodType(ctx, s, 96, i % 2 ? INK : RED, i % 2 ? RED : INK);
      c.addChild(burst, t);
      c.position.set([620, 1320, 640, 1300][i], [560, 600, 800, 840][i]);
      c.rotation = (i % 2 ? 1 : -1) * 0.12;
      chant.addChild(c);
      return c;
    });
    live.addChild(chant);
    const ding = new Container();
    const dg = new Graphics();
    // the ring bell
    dg.moveTo(-50, 30).quadraticCurveTo(-48, -40, 0, -46).quadraticCurveTo(48, -40, 50, 30).closePath().fill(0xd0a030).stroke({ width: 6, color: INK });
    dg.circle(0, 34, 10).fill(INK);
    const dt = word(ctx.k, '¡DING DING!', { fontFamily: 'Bangers', fontSize: 50, fill: RED, stroke: { color: INK, width: 6 } });
    dt.position.set(0, -90);
    ding.addChild(dg, dt);
    ding.position.set(1520, 470);
    ding.scale.set(0.8);
    live.addChild(ding);
    ctx.plane(live, { z: 1000 });
    // the photo flash (a white screen overlay; «Reducir destellos»: soft)
    const flash = new Graphics().rect(-400, -400, 2720, 1880).fill(0xffffff);
    flash.alpha = 0;
    ctx.plane(flash, { z: 0, screen: true });
    const tv = new TvScreen(ctx);
    ctx.plane(tv, { z: 0, screen: true });
    const UNROLL = 1.7;
    let buzzKey = -2;
    return {
      update(lt, f) {
        // the poster unrolls top → bottom; the roll's cylinder rides the edge
        const u = rm ? sm(seg(lt, 0.05, UNROLL)) : sm(seg(lt, 0.05, UNROLL));
        const y = P.y0 + (P.y1 - P.y0 + 30) * u;
        unrollMask.clear().rect(P.x0 - 40, P.y0 - 60, P.x1 - P.x0 + 80, y - P.y0 + 60).fill(0xffffff);
        const r = roll.clear();
        if (u < 1) {
          r.roundRect(P.x0 - 20, y - 24, P.x1 - P.x0 + 40, 56, 28).fill(0xd8b24a).stroke({ width: 6, color: INK });
          r.rect(P.x0 - 10, y - 4, P.x1 - P.x0 + 20, 8).fill({ color: 0xffffff, alpha: 0.4 });
        }
        // the bell rings as it unrolls
        ding.visible = lt > 0.2 && lt < 2.2;
        ding.rotation = rm ? 0 : Math.sin(lt * 30) * 0.18 * (1 - seg(lt, 0.2, 2.2));
        // the header lands as wood type (stamp)
        const hp = seg(lt, 1.0, 1.25);
        Pp.t1.scale.set(rm ? 1 : 1 + (1 - outBack(hp, 2)) * 0.5);
        // the door's slit buzzes (zig-zags of static, on twos)
        const st = Math.floor(lt * 12);
        const bk = lt > 1 && lt < 9.5 ? st : -1;
        if (bk !== buzzKey) {
          buzzKey = bk;
          buzz.clear();
        }
        const b = buzz;
        if (bk >= 0 && b.context.instructions.length === 0) {
          for (let i = 0; i < 7; i++) {
            const yy = 520 + i * 44 + rnd(i + st) * 10;
            b.moveTo(640, yy);
            for (let k = 1; k <= 4; k++) b.lineTo(640 + k * 20, yy + (k % 2 ? -12 : 12) * (0.6 + rnd(i * 7 + st + k)));
            b.stroke({ width: 5, color: INK });
          }
        }
        // ¡CA-DE-NE-RO! on the beats after the flash
        syll.forEach((t, i) => {
          const t0 = 14.0 + i * 0.42;
          const p = seg(lt, t0, t0 + 0.14);
          t.visible = lt >= t0 && lt < 17.6;
          t.scale.set(rm ? 1 : 1 + (1 - outBack(p, 2.5)) * 0.8);
        });
        // the photo flash on El Cadenero
        const fp = seg(lt, 13.35, 13.75);
        flash.alpha = lt >= 13.35 && lt < 13.75 ? (1 - fp) * (ctx.rf ? 0.22 : 0.75) : 0;
        // the rule's panels: A pastes, its balloon, then B
        const pa = seg(lt, 18.5, 18.72);
        Pp.panelA.visible = lt >= 18.5;
        Pp.panelA.alpha = rm ? sm(pa) : 1;
        Pp.panelA.position.set(0, rm ? 0 : (1 - outBack(pa, 2)) * -40);
        popIn(Pp.balA, lt, 19.3, 24, rm, 1);
        const pb = seg(lt, 20.7, 20.92);
        Pp.panelB.visible = lt >= 20.7;
        Pp.panelB.alpha = rm ? sm(pb) : 1;
        Pp.panelB.position.set(rm ? 0 : (1 - outBack(pb, 2.4)) * 90, 0);
        tv.update(f);
      },
    };
  },
};

// ------------------------------------------------------------------ 2 · vip: her beam writes VIP on his paw
export const vip: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', CADENERO_STANDIN],
  build(ctx): FilmSet {
    const rm = ctx.rm;
    // (A) the insert: Canelo's paw held out, the beam writes V-I-P
    const ins = new Container();
    const ig = new Graphics();
    ig.rect(-200, -200, 2320, 1500).fill(TV.nightD);
    for (let x = -200; x < 2120; x += 90) ig.rect(x, -200, 34, 1500).fill(0x1a2252);
    // the paw: orange fur, pink pads
    ig.roundRect(560, 380, 760, 700, 300).fill(0xf0a050).stroke({ width: 8, color: TV.line });
    for (let i = 0; i < 4; i++) ig.ellipse(650 + i * 190, 430, 80, 90).fill(0xf0a050).stroke({ width: 8, color: TV.line });
    for (let i = 0; i < 4; i++) ig.ellipse(650 + i * 190, 450, 44, 50).fill(0xf7a8b8).stroke({ width: 5, color: TV.line });
    ig.ellipse(940, 780, 220, 170).fill(0xf7a8b8).stroke({ width: 6, color: TV.line });
    ins.addChild(ig);
    const vipG = new Graphics();
    ins.addChild(vipG);
    const beamA = new Beam(ctx);
    ins.addChild(beamA);
    const lglowA = new Sprite(kitTex(ctx, 'glow'));
    lglowA.anchor.set(0.5);
    lglowA.tint = TV.lantern;
    lglowA.blendMode = 'add';
    lglowA.position.set(1620, 90);
    lglowA.scale.set(2.4);
    ins.addChild(lglowA);
    // (B) the medium shot: Canelo shows his paw to the doorman (shades, unimpressed); Luzterna floats behind
    const med = new Container();
    const mg = new Graphics();
    mg.rect(-200, -200, 2320, 1500).fill(TV.night);
    for (let x = -200; x < 2120; x += 90) mg.rect(x, -200, 34, 1500).fill(TV.nightD);
    box(mg, 1180, 160, 330, 700, TV.pink, { shadow: TV.pinkD });
    box(mg, 1230, 210, 230, 90, TV.cream);
    mg.rect(-200, 860, 2320, 400).fill(TV.woodD);
    med.addChild(mg);
    const wc = word(ctx.k, 'BAÑO', { fontFamily: 'Bangers', fontSize: 50, fill: TV.pinkD, stroke: { color: TV.line, width: 4 } });
    wc.position.set(1345, 255);
    med.addChild(wc);
    const cad = cadenero(ctx, 760);
    cad.position.set(1360, 1110);
    cad.scale.x = -1;
    med.addChild(cad);
    const lr = luzOf(ctx, 420);
    if (lr.actor) med.addChild(lr.actor);
    const can = ctx.actor(ctx.canelo, 520);
    if (can) med.addChild(can);
    const paw = new Graphics();
    med.addChild(paw);
    const pawT = word(ctx.k, 'VIP', { fontFamily: 'Permanent Marker', fontSize: 66, fill: 0x1e78ff, stroke: { color: 0xdff6ff, width: 5 } });
    med.addChild(pawT);
    const pg = new Sprite(kitTex(ctx, 'glow'));
    pg.anchor.set(0.5);
    pg.tint = TV.lantern;
    pg.blendMode = 'add';
    med.addChild(pg);
    const root = new Container();
    root.addChild(ins, med);
    ctx.plane(root, { z: 1000 });
    const tv = new TvScreen(ctx);
    ctx.plane(tv, { z: 0, screen: true });
    // V, I, P strokes on the pad (paw coords)
    const L: [number, number, number, number][] = [
      [790, 700, 840, 850],
      [840, 850, 890, 700],
      [940, 700, 940, 850],
      [990, 850, 990, 700],
    ];
    const CUT = 1.7;
    return {
      update(lt, f) {
        const inA = lt < CUT;
        ins.visible = inA;
        med.visible = !inA;
        if (inA) {
          const wp = seg(lt, 0.25, 1.35);
          const g = vipG.clear();
          let acc = wp * 5;
          let tip: [number, number] = [790, 700];
          for (const [x0, y0, x1, y1] of L) {
            const k = Math.max(0, Math.min(1, acc));
            acc -= 1;
            if (k <= 0) break;
            const x = x0 + (x1 - x0) * k;
            const y = y0 + (y1 - y0) * k;
            g.moveTo(x0, y0).lineTo(x, y).stroke({ width: 26, color: TV.lantern, alpha: 0.4, cap: 'round' });
            g.moveTo(x0, y0).lineTo(x, y).stroke({ width: 11, color: 0xdff6ff, cap: 'round' });
            tip = [x, y];
          }
          // the P's bowl (the last «stroke»)
          const pk = Math.max(0, Math.min(1, acc));
          if (pk > 0) {
            g.arc(1000, 740, 40, -Math.PI / 2, -Math.PI / 2 + Math.PI * pk).stroke({ width: 26, color: TV.lantern, alpha: 0.4, cap: 'round' });
            g.arc(1000, 740, 40, -Math.PI / 2, -Math.PI / 2 + Math.PI * pk).stroke({ width: 11, color: 0xdff6ff, cap: 'round' });
            tip = [1000 + Math.cos(-Math.PI / 2 + Math.PI * pk) * 40, 740 + Math.sin(-Math.PI / 2 + Math.PI * pk) * 40];
          }
          const on = lt >= 0.15 && lt < 1.5;
          beamA.set([1620, 90], tip, 40, on ? (ctx.rf ? 0.55 : 0.85) : 0);
        } else {
          const lt2 = lt - CUT;
          const b = bob(lt, rm, 8);
          lr.actor?.pose(lt, 520, 820 + b, { flip: false });
          // he raises the paw, proud (a squash-up), toward the doorman
          const up = rm ? sm(seg(lt2, 0, 0.3)) : outBack(seg(lt2, 0, 0.25), 1.8);
          can?.pose(lt, 760, 1080, { flip: false, sx: 1 - up * 0.03, sy: 1 + up * 0.05 });
          const px = 990;
          const py = 560 - up * 70;
          const p = paw.clear();
          p.rect(px - 40, py + 90, 80, 300).fill(0xf0a050).stroke({ width: 6, color: TV.line });
          p.roundRect(px - 110, py - 90, 220, 220, 90).fill(0xf0a050).stroke({ width: 7, color: TV.line });
          for (let i = 0; i < 4; i++) p.ellipse(px - 84 + i * 56, py - 92, 30, 34).fill(0xf0a050).stroke({ width: 5, color: TV.line });
          p.ellipse(px, py + 20, 76, 60).fill(0xf7a8b8).stroke({ width: 5, color: TV.line });
          pawT.position.set(px, py + 18);
          pawT.scale.set(0.95);
          pg.position.set(px, py + 18);
          pg.scale.set(1.2);
          pg.alpha = 0.3;
        }
        tv.update(f);
      },
    };
  },
};

// ------------------------------------------------------------------ 3 · riesgo: the logbook covers the poster
export const riesgo: SetModule = {
  cats: ({ canelo }) => [canelo, CADENERO_STANDIN, ...CREW],
  build(ctx): FilmSet {
    const c = new Container();
    c.addChild(wall());
    const Pp = poster(ctx);
    c.addChild(Pp.root);
    const tp = new Graphics();
    tape(tp, P.x0 + 60, P.y0 + 10, 200, -0.4);
    tape(tp, P.x1 - 60, P.y0 + 10, 200, 0.4);
    c.addChild(tp);
    ctx.plane(c, { z: 1000, bake: 'static' });
    const pg = new Bitacora(ctx, 'El rastro. Y que el gordo vuelva a hacer fila para el baño.');
    const ui = new Container();
    ui.addChild(pg);
    ctx.plane(ui, { z: 0, screen: true });
    const tv = new TvScreen(ctx);
    ctx.plane(tv, { z: 0, screen: true });
    return {
      update(lt, f) {
        pg.update(lt - 0.05, ctx.rm);
        tv.update(f);
      },
    };
  },
};
