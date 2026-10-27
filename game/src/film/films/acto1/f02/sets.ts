/**
 * F02 «El precio de bajar» — the sets (shot list in ./index.ts).
 *
 * TV cutaways: the Donería at night, La Borracha's TV cartoon (tv.ts line and palette), the counter lamp on the left.
 * Theatre: the lit circle on the menu wall (style 'sombras' bakes 'sb:spot'), shadows drawn in code (shadow.ts) and
 * Lotte Reiniger cut-outs of real paintings (the style's bake: warm dark brown with a rim of lamp light).
 *
 * CAST (the approved paintings, film/standins.ts): Borrón = borron_inkblot_cat (his shadow paws keep the white hand
 * stamp, an echo of the hand-print on his belly) · Homiau = kit Homiau (his painting) · the kitten of static = kit
 * CERITO (cerito_static_cat). The cut-out cat that jumps out of the two hands (gato) is Borrón himself: «nos escribimos
 * gatos» — the narrator's own round body and donut, readable even as a silhouette (a generic ninja cat read as someone
 * else, and kage_ninja_cat plays other roles in Act II).
 */
import { Container, Graphics, Sprite, TilingSprite, type Texture } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { CERITO, HOMIAU, Homiau, TV, TvScreen, balloon, bob, box, disc, donut, flame, kitTex, lanternAt, luzOf, outBack, popIn, rnd, seg, sm, tailTip, word } from '../kit';
import { HIC_T } from './index';
import { STANDINS } from '../../../standins';
import { SH, catHalfOutline, flat, handOutline, mix, quill, resample, shadowPoly, shadowRect, startAt, xform, type Pt } from './shadow';

export const BORRON = STANDINS.borron;
const N_MORPH = 72;

// ------------------------------------------------------------------ the Donería, inside (TV cartoon)
/** the menu wall (the theatre's screen), the counter with its lamp on the left, the table in front */
function interior(ctx: SceneCtx, o: { table?: boolean } = {}): Container {
  const c = new Container();
  const g = new Graphics();
  // back wall: pink with a darker band, a little diamond paper
  g.rect(-300, -300, 2520, 1100).fill(0xf0a3c0);
  for (let x = -280; x < 2300; x += 120) for (let y = -260; y < 760; y += 120) g.poly([x, y - 10, x + 9, y, x, y + 10, x - 9, y]).fill({ color: 0xffd0e2, alpha: 0.8 });
  g.rect(-300, 640, 2520, 30).fill(TV.pinkD).stroke({ width: 6, color: TV.line });
  g.rect(-300, 670, 2520, 200).fill(0xc96f94);
  // the MENU board (the screen of the theatre)
  box(g, 700, 140, 600, 380, 0xfff7ea, { shadow: TV.pinkD, r: 10 });
  c.addChild(g);
  const menu = [
    ['MENÚ', 50, TV.pinkD],
    ['GLASEADA ........ 2', 30, TV.line],
    ['CHOCOLATE ....... 2', 30, TV.line],
    ['CHISPAS ......... 3', 30, TV.line],
    ['CAFÉ ............ 1', 30, TV.line],
  ] as const;
  menu.forEach(([t, s, col], i) => {
    const w = word(ctx.k, t, { fontFamily: i === 0 ? 'Bangers' : 'Space Grotesk', fontWeight: i === 0 ? 'normal' : '700', fontSize: s, fill: col, letterSpacing: i === 0 ? 6 : 1 });
    w.position.set(1000, 200 + i * 66);
    c.addChild(w);
  });
  const g2 = new Graphics();
  // the floor and the counter on the left (wood) with the lamp's base
  g2.rect(-300, 860, 2520, 400).fill(0x8a5a3c);
  for (let x = -300; x < 2300; x += 160) g2.rect(x, 860, 6, 400).fill({ color: TV.woodD, alpha: 0.6 });
  box(g2, -200, 700, 860, 90, TV.woodL, { shadow: TV.woodD, r: 6 });
  g2.rect(-200, 790, 860, 300).fill(TV.wood).stroke({ width: 6, color: TV.line });
  for (let i = 0; i < 4; i++) donut(g2, 60 + i * 90, 690, 30, i + 2);
  if (o.table !== false) {
    // the table in front (right), with the plate and the box of donuts
    g2.ellipse(1180, 900, 420, 70).fill(0xfff3d6).stroke({ width: 6, color: TV.line });
    g2.rect(1160, 900, 40, 220).fill(TV.woodD).stroke({ width: 5, color: TV.line });
    g2.ellipse(1050, 878, 120, 26).fill(0xffffff).stroke({ width: 5, color: TV.line });
    for (let i = 0; i < 3; i++) donut(g2, 1000 + i * 52, 862, 26, i + 7);
  }
  c.addChild(g2);
  return c;
}
/** the counter lamp: base + arm + shade; `aim` 0 = down at the counter, 1 = at the wall (projector) */
class Lamp extends Container {
  private arm = new Graphics();
  readonly shade = new Container();
  readonly bulb: Sprite;
  constructor(ctx: SceneCtx) {
    super();
    const base = new Graphics().ellipse(0, 0, 60, 16).fill(0x3a3f66).stroke({ width: 5, color: TV.line });
    base.rect(-10, -150, 20, 150).fill(0x3a3f66).stroke({ width: 5, color: TV.line });
    const sh = new Graphics().poly([-30, -16, 30, -16, 70, 60, -70, 60]).fill(0x2e9a5a).stroke({ width: 6, color: TV.line, join: 'round' });
    sh.ellipse(0, 60, 70, 14).fill(0xfff1b8).stroke({ width: 5, color: TV.line });
    this.shade.addChild(sh);
    this.shade.position.set(0, -160);
    this.bulb = new Sprite(kitTex(ctx, 'glow'));
    this.bulb.anchor.set(0.5);
    this.bulb.tint = 0xffd890;
    this.bulb.blendMode = 'add';
    this.addChild(base, this.arm, this.shade, this.bulb);
  }
  set(aim: number) {
    // the shade turns from pointing down (rot 0) to pointing right-up at the wall (rot −2.1)
    this.shade.rotation = -aim * 2.1;
    const r = this.shade.rotation;
    this.bulb.position.set(-Math.sin(r) * 60 + this.shade.x, Math.cos(r) * 60 + this.shade.y);
    this.bulb.scale.set(0.9);
    this.bulb.alpha = 0.7;
  }
}
/** the warm circle the lamp throws on the menu wall (TV cartoon: flat glow + a soft rim) */
function wallCircle(ctx: SceneCtx): Container {
  const c = new Container();
  const glow = new Sprite(kitTex(ctx, 'glow'));
  glow.anchor.set(0.5);
  glow.tint = 0xffcf7a;
  glow.blendMode = 'add';
  glow.scale.set(2.6);
  const disk = new Graphics().circle(0, 0, 160).fill({ color: 0xfff0c8, alpha: 0.75 });
  c.addChild(glow, disk);
  return c;
}
/** Borrón's ink paw (stand-in detail): black, a white hand stamp on it */
function inkPaw(g: Graphics, x: number, y: number, rot: number, s = 1, stamp = true) {
  const c = Math.cos(rot);
  const n = Math.sin(rot);
  const P = (u: number, v: number): number[] => [x + (u * c - v * n) * s, y + (u * n + v * c) * s];
  g.poly([...P(-200, -40), ...P(40, -48), ...P(70, -30), ...P(78, 0), ...P(70, 30), ...P(40, 46), ...P(-200, 40)]).fill(0x16121e).stroke({ width: 6, color: TV.line, join: 'round' });
  for (const dv of [-26, 0, 26]) g.circle(...(P(74, dv) as [number, number]), 9 * s).fill(0x2a2436);
  if (stamp) {
    // the white hand: a palm and five short fingers
    const [hx, hy] = P(-30, 0);
    g.ellipse(hx, hy, 22 * s, 18 * s).fill(0xffffff);
    for (let i = 0; i < 5; i++) {
      const a = -1.2 + i * 0.6 + rot;
      g.circle(hx + Math.cos(a) * 28 * s, hy + Math.sin(a) * 26 * s, 6 * s).fill(0xffffff);
    }
  }
}

// ------------------------------------------------------------------ 1 · lampara (tv): the lamp becomes a projector
export const lampara: SetModule = {
  build(ctx): FilmSet {
    const room = interior(ctx);
    ctx.plane(room, { z: 1000, bake: 'static', res: 1.8 });
    const live = new Container();
    const circle = wallCircle(ctx);
    circle.position.set(1000, 330);
    const lamp = new Lamp(ctx);
    lamp.position.set(470, 705);
    const cone = new Graphics();
    const paw = new Graphics();
    live.addChild(circle, cone, lamp, paw);
    ctx.plane(live, { z: 1000 });
    const tv = new TvScreen(ctx);
    ctx.plane(tv, { z: 0, screen: true });
    return {
      update(lt, f) {
        // the ink paw reaches in, turns the shade (click), the wall lights up: preparation → development
        const reach = sm(seg(lt, 0.15, 0.7)) * (1 - sm(seg(lt, 1.6, 2.2)));
        const aim = ctx.rm ? sm(seg(lt, 0.7, 1.4)) : outBack(seg(lt, 0.7, 1.25), 1.6);
        lamp.set(aim);
        const p = paw.clear();
        inkPaw(p, 220 + reach * 200, 520 + aim * 20, -0.25, 1.1);
        const k = sm(seg(lt, 1.0, 1.6));
        circle.scale.set(0.2 + 0.8 * k);
        circle.alpha = k;
        const c = cone.clear();
        if (k > 0) {
          const bx = lamp.x + lamp.bulb.x;
          const by = lamp.y + lamp.bulb.y;
          c.poly([bx, by - 20, bx, by + 20, 1000, 330 + 160 * k, 1000, 330 - 160 * k]).fill({ color: 0xffe2a0, alpha: 0.18 * k });
        }
        tv.update(f);
      },
    };
  },
};

// ------------------------------------------------------------------ the theatre's screen (shared by the sombras scenes)
interface Screen {
  shadows: Container;
  fx: Container;
}
function theatre(ctx: SceneCtx): Screen {
  const back = new Container();
  back.addChild(new Graphics().rect(-400, -300, 2720, 1700).fill(SH.wall));
  const spot = new Sprite(ctx.tex('sb:spot') as Texture);
  spot.anchor.set(0.5);
  spot.position.set(960, 500);
  spot.setSize(1050, 1050);
  back.addChild(spot);
  // the menu's ghost under the light (the wall is still the menu)
  const ghost = new Graphics();
  for (let i = 0; i < 5; i++) ghost.rect(700, 220 + i * 120, 520 - (i === 0 ? 300 : 0), 14).fill({ color: 0x8a5a2a, alpha: 0.08 });
  back.addChild(ghost);
  ctx.plane(back, { z: 1000, bake: 'static', res: 1.4 });
  const shadows = new Container();
  const mask = new Graphics().circle(960, 500, 440).fill(0xffffff);
  shadows.mask = mask;
  const host = new Container();
  host.addChild(shadows, mask);
  ctx.plane(host, { z: 1000 });
  const fx = new Container();
  ctx.plane(fx, { z: 1000 });
  return { shadows, fx };
}
/** a lit eye on a shadow (warm, additive) */
function eye(ctx: SceneCtx): Sprite {
  const e = new Sprite(kitTex(ctx, 'glow'));
  e.anchor.set(0.5);
  e.tint = 0xffe9a8;
  e.blendMode = 'add';
  return e;
}

// ------------------------------------------------------------------ 2 · manos (sombras): hands that wrote · the folio cero
export const manos: SetModule = {
  cats: [CERITO],
  build(ctx): FilmSet {
    const sc = theatre(ctx);
    const g = new Graphics();
    const pages = new Graphics();
    sc.shadows.addChild(pages, g);
    // the kitten of static: a cut-out (the style's bake) with static at its edges
    const kit = new Container();
    const kStill = ctx.still(CERITO);
    const kSil = ctx.silhouette(CERITO);
    const noise = new TilingSprite({ texture: kitTex(ctx, 'static'), width: 600, height: 600 });
    if (kStill && kSil) {
      const s = 190 / kStill.texture.height;
      kStill.scale.set(s);
      kSil.scale.set(s);
      noise.position.set(-300, -560);
      noise.alpha = 0.35;
      noise.mask = kSil;
      kit.addChild(kStill, noise, kSil);
    }
    const kEyes = [eye(ctx), eye(ctx)];
    kit.addChild(...kEyes);
    sc.shadows.addChild(kit);
    const tears = new Graphics();
    sc.shadows.addChild(tears);
    const tv = new TvScreen(ctx);
    ctx.plane(tv, { z: 0, screen: true });
    // the boxes the kitten leaps through (left → right, inside the circle)
    const BOX: [number, number][] = [
      [640, 720],
      [800, 610],
      [960, 730],
      [1120, 600],
      [1270, 720],
    ];
    const HOP = 6.6;
    const per = 1.05;
    return {
      update(lt) {
        const rm = ctx.rm;
        const G = g.clear();
        const P = pages.clear();
        // --- F02-1 (lt 0–6.4): hands write in margins; the lines fill by themselves
        const out1 = sm(seg(lt, 5.8, 6.6));
        if (lt < 6.8) {
          const dy = out1 * 520;
          // two pages (cut-outs of paper: they let some light through, a gold rim)
          for (const [px, py, rot, n0] of [
            [760, 300, -0.08, 0],
            [1060, 360, 0.07, 8],
          ] as const) {
            const c = Math.cos(rot);
            const s2 = Math.sin(rot);
            const Q = (u: number, v: number): [number, number] => [px + u * c - v * s2, py + dy + u * s2 + v * c];
            const corners = [Q(0, 0), Q(240, 0), Q(240, 320), Q(0, 320)];
            shadowPoly(P, flat(corners), { body: SH.paper, rim: SH.rimHot, rimW: 5, alpha: 0.55 });
            for (let i = 0; i < 8; i++) {
              const k = sm(seg(lt, 0.6 + (n0 + i) * 0.34, 0.9 + (n0 + i) * 0.34));
              if (k <= 0) continue;
              const [x0, y0] = Q(26, 50 + i * 34);
              const [x1, y1] = Q(26 + 188 * k * (i === 7 ? 0.6 : 1), 50 + i * 34);
              P.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: 7, color: SH.body, cap: 'round' });
            }
          }
          // the writing hand (left page) follows the line being written
          const line = Math.min(7, Math.floor(seg(lt, 0.6, 3.3) * 8));
          const lk = seg(lt, 0.6 + line * 0.34, 0.9 + line * 0.34);
          const hx = 760 + 26 + 188 * lk + (rm ? 0 : Math.sin(lt * 28) * 4);
          const hy = 300 + dy + 50 + line * 34 - 8;
          shadowPoly(G, flat(xform(handOutline(0.3, 0.8), hx - 150, hy + 40, 0.75, -0.55)), {});
          quill(G, hx, hy, -0.9, 1);
          // a second hand writes on the right page, lagging
          const line2 = Math.min(7, Math.floor(seg(lt, 3.3, 6.0) * 8));
          const lk2 = seg(lt, 0.6 + (8 + line2) * 0.34, 0.9 + (8 + line2) * 0.34);
          const h2x = 1060 + 26 + 188 * lk2;
          const h2y = 360 + dy + 50 + line2 * 34 - 8 + 14;
          shadowPoly(G, flat(xform(handOutline(0.3, 0.8), h2x - 150, h2y + 40, 0.72, -0.4)), {});
          quill(G, h2x, h2y, -0.8, 0.95);
          // quills in the margins, writing by themselves
          for (let i = 0; i < 2; i++) {
            const t = lt * (1.3 + i * 0.4) + i * 2;
            quill(G, 620 + i * 700 + Math.sin(t) * 30, 180 + dy + i * 40 + Math.cos(t * 1.3) * 16, -0.9 + Math.sin(t * 2) * 0.15, 0.7, 0.85);
          }
        }
        // --- F02-2 (lt 6.4–12.4): the kitten of static leaps box to box; every box it touches tears
        const T = tears.clear();
        const inK = sm(seg(lt, 6.2, 6.8));
        kit.visible = lt >= 6.2;
        if (lt >= 6.2) {
          for (let i = 0; i < BOX.length; i++) {
            const [bx, by] = BOX[i];
            const tTear = HOP + i * per;
            const tk = seg(lt, tTear, tTear + 0.9);
            const appear = sm(seg(lt, 6.2 + i * 0.08, 6.6 + i * 0.08));
            if (appear <= 0) continue;
            const w = 120;
            const h = 96;
            if (tk <= 0) {
              // a whole box (open top: two flaps)
              shadowRect(T, bx - w / 2, by - h + (1 - appear) * 40, w, h, { alpha: appear });
              shadowPoly(T, [bx - w / 2, by - h, bx - w / 2 - 34, by - h - 30, bx - w / 2 + 10, by - h - 30, bx - w / 2 + 30, by - h], { alpha: appear });
              shadowPoly(T, [bx + w / 2, by - h, bx + w / 2 + 34, by - h - 30, bx + w / 2 - 10, by - h - 30, bx + w / 2 - 30, by - h], { alpha: appear });
            } else {
              // torn: two jagged halves fall apart (preparation: the crack; development: the halves; exit: gone)
              const sp = (rm ? 0.5 : 1) * outBack(tk, 1.2);
              const fall = tk * tk * 160;
              const a = 1 - sm(seg(lt, tTear + 0.6, tTear + 1.1));
              const zig = (side: number): number[] => {
                const pts: number[] = [];
                for (let j = 0; j <= 6; j++) pts.push(bx + (j % 2 ? 8 : -8) * side, by - h + (j / 6) * h);
                return pts;
              };
              const L = [bx - w / 2, by - h, ...zig(1).slice(0), bx - w / 2, by];
              const R = [bx + w / 2, by - h, ...zig(-1), bx + w / 2, by];
              const rot = (pts: number[], cx: number, cy: number, r: number, ox: number, oy: number) =>
                pts.map((v, j) => {
                  const x = j % 2 ? pts[j - 1] : v;
                  const y = j % 2 ? v : pts[j + 1];
                  const c = Math.cos(r);
                  const s3 = Math.sin(r);
                  return j % 2 ? cy + oy + (x - cx) * s3 + (y - cy) * c : cx + ox + (x - cx) * c - (y - cy) * s3;
                });
              shadowPoly(T, rot(L, bx, by, -0.5 * sp, -50 * sp, fall), { alpha: a });
              shadowPoly(T, rot(R, bx, by, 0.5 * sp, 50 * sp, fall), { alpha: a });
              // the rip: a flash of rim light along the tear
              if (tk < 0.3) T.moveTo(bx, by - h).lineTo(bx, by).stroke({ width: 6, color: SH.rimHot, alpha: 1 - tk / 0.3 });
            }
          }
          // the kitten's arc from box to box
          const hop = Math.max(0, Math.min(BOX.length - 1 + 0.999, (lt - HOP + per) / per));
          const i0 = Math.min(BOX.length - 1, Math.floor(hop));
          const fr = hop - Math.floor(hop);
          const from: [number, number] = i0 === 0 && lt < HOP ? [BOX[0][0] - 260, BOX[0][1] - 40] : BOX[Math.max(0, i0 - 1)];
          const to = BOX[i0];
          const e = rm ? fr : fr;
          const x = from[0] + (to[0] - from[0]) * e;
          const y = from[1] + (to[1] - from[1]) * e - Math.sin(e * Math.PI) * 170 - 92;
          const exit = seg(lt, HOP + BOX.length * per - 0.2, HOP + BOX.length * per + 0.6);
          kit.position.set(x + exit * 360, y - exit * 260);
          kit.rotation = (rm ? 0 : Math.sin(e * Math.PI) * -0.25) - exit * 0.4;
          const sq = rm ? 1 : 1 + Math.cos(e * Math.PI * 2) * 0.06;
          kit.scale.set(sq * inK, (2 - sq) * inK);
          kit.alpha = inK * (1 - exit);
          const st = Math.floor(lt * 12);
          noise.tilePosition.set(rnd(st) * 200, rnd(st + 1) * 200);
          // its eyes (lit), from the silhouette's rig estimate
          kEyes[0].position.set(-26, -128);
          kEyes[1].position.set(10, -118);
          for (const ey of kEyes) {
            ey.scale.set(0.16);
            ey.alpha = 0.95;
          }
          // the static trembles at the edge of the shadow
          if (!rm) kit.x += (rnd(st + 7) - 0.5) * 4;
        }
      },
      anchor: (n) => (n === 'subtitle' ? null : null),
    };
  },
};

// ------------------------------------------------------------------ the table, the cutaways (tv)
/** a TV shot at the table with the theatre circle glowing on the wall behind */
function tableShot(ctx: SceneCtx): { live: Container; wall: Container } {
  const room = interior(ctx);
  ctx.plane(room, { z: 1500, bake: 'dof', blur: 10, dof: 1200, res: 1.2 });
  const wall = wallCircle(ctx);
  wall.position.set(1000, 330);
  const wc = new Container();
  wc.addChild(wall);
  ctx.plane(wc, { z: 1500 });
  const live = new Container();
  ctx.plane(live, { z: 1000 });
  return { live, wall };
}

// 3 · mesa1: at «folio cero» Canelo's flame drops for a moment; Luzterna drifts a little closer, without looking
export const mesa1: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna'],
  build(ctx): FilmSet {
    const { live } = tableShot(ctx);
    const can = ctx.actor(ctx.canelo, 640);
    const luz = luzOf(ctx, 520);
    const fl = new Graphics();
    const lg = new Sprite(kitTex(ctx, 'glow'));
    lg.anchor.set(0.5);
    lg.tint = TV.lantern;
    lg.blendMode = 'add';
    const tableFront = new Graphics().ellipse(960, 1040, 900, 90).fill(0xfff3d6).stroke({ width: 6, color: TV.line });
    if (luz.actor) live.addChild(luz.actor);
    live.addChild(lg);
    if (can) live.addChild(can);
    live.addChild(fl, tableFront);
    const tv = new TvScreen(ctx);
    ctx.plane(tv, { z: 0, screen: true });
    return {
      update(lt, f) {
        can?.pose(lt, 820, 1080);
        // she drifts in a little from the right, eyes ahead (she doesn't look at him)
        const near = sm(seg(lt, 0.9, 2.2));
        luz.actor?.pose(lt, 1460 - near * 110, 820 + bob(lt, ctx.rm, 8), { flip: true });
        if (luz.actor) {
          const [x, y] = lanternAt(luz);
          lg.position.set(x, y);
          lg.scale.set(1.1);
          lg.alpha = 0.55;
        }
        // the flame: normal → drops to almost nothing at «folio cero» → comes back
        const drop = sm(seg(lt, 0.15, 0.45)) * (1 - sm(seg(lt, 1.6, 2.4)));
        const k = 1 - drop * 0.75;
        const tip = tailTip(can);
        fl.clear();
        if (tip) flame(fl, tip[0], tip[1] + 10, k, lt, { rm: ctx.rm, scale: 2.1 });
        tv.update(f);
      },
    };
  },
};

// 5 · mesa2: Homiau «Ooooh»; Canelo tries a shadow cat with his paws — on the wall, a potato
export const mesa2: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', BORRON, HOMIAU],
  build(ctx): FilmSet {
    const { live } = tableShot(ctx);
    const can = ctx.actor(ctx.canelo, 520);
    const bor = ctx.actor(BORRON, 470);
    const hom = new Homiau(ctx);
    hom.scale.set(0.95);
    const potato = new Graphics();
    const paws = new Graphics();
    const front = new Graphics().ellipse(960, 1050, 900, 90).fill(0xfff3d6).stroke({ width: 6, color: TV.line });
    live.addChildAt(potato, 0);
    if (bor) live.addChild(bor);
    live.addChild(hom, paws);
    if (can) live.addChild(can);
    live.addChild(front);
    const ooh = balloon(ctx.k, 'Ooooh.', { size: 60, tail: [-80, 110] });
    ooh.position.set(1420, 260);
    const what = balloon(ctx.k, '¿…?', { size: 54, tail: [60, 100] });
    what.position.set(340, 560);
    live.addChild(ooh, what);
    const tv = new TvScreen(ctx);
    ctx.plane(tv, { z: 0, screen: true });
    return {
      update(lt, f) {
        bor?.pose(lt, 980, 960);
        hom.position.set(1330, 1000);
        hom.act(lt, { chew: 1, raise: 0.2 + Math.max(0, Math.sin(lt * 2)) * 0.2 });
        // Canelo raises his paws to the light (a little pose), proud — the potato appears on the wall
        const up = sm(seg(lt, 1.0, 1.5));
        can?.pose(lt, 560, 1060, { rot: -0.05 * up, sy: 1 + up * 0.04 });
        const p = paws.clear();
        if (up > 0) {
          // his two arms go up toward the lamp's light, paws pressed together (the shadow puppet he can't do)
          for (const s of [-1, 1]) {
            const [hx, hy] = can ? [can.x + can.head()[0], can.y + can.head()[1]] : [450, 560];
            const px = hx + s * 46;
            const py = hy - 140 - up * 150;
            p.moveTo(hx + s * 110, hy + 140).lineTo(px, py + 40).stroke({ width: 52, color: TV.line, cap: 'round' });
            p.moveTo(hx + s * 110, hy + 140).lineTo(px, py + 40).stroke({ width: 40, color: 0xf4a65a, cap: 'round' });
            p.roundRect(px - 36, py, 72, 90, 34).fill(0xf4a65a).stroke({ width: 6, color: TV.line });
          }
        }
        const pt = potato.clear();
        const k = sm(seg(lt, 1.4, 1.9));
        if (k > 0) {
          // the shadow on the wall's light circle: a lumpy potato with two tiny nubs (no cat at all)
          const x = 1000;
          const y = 330;
          pt.ellipse(x, y + 10, 110 * k, 78 * k).fill({ color: 0x5a2e1a, alpha: 0.85 });
          pt.ellipse(x - 60 * k, y - 20, 50 * k, 40 * k).fill({ color: 0x5a2e1a, alpha: 0.85 });
          pt.circle(x + 30 * k, y - 66 * k, 14 * k).fill({ color: 0x5a2e1a, alpha: 0.85 });
          pt.circle(x - 10 * k, y - 70 * k, 10 * k).fill({ color: 0x5a2e1a, alpha: 0.85 });
        }
        popIn(ooh, lt, 0.2, 1.7, ctx.rm);
        popIn(what, lt, 2.4, 3.9, ctx.rm);
        tv.update(f);
      },
    };
  },
};

// 7 · borron: he pats his paw for the pencil like for a phone, then wipes a tear with his donut
export const borron: SetModule = {
  cats: [BORRON],
  build(ctx): FilmSet {
    const { live } = tableShot(ctx);
    const bor = ctx.actor(BORRON, 640);
    const g = new Graphics();
    const front = new Graphics().ellipse(960, 1060, 900, 90).fill(0xfff3d6).stroke({ width: 6, color: TV.line });
    if (bor) live.addChild(bor);
    live.addChild(front, g);
    const q = balloon(ctx.k, '¿?', { size: 52, tail: [-40, 90] });
    q.position.set(1240, 300);
    live.addChild(q);
    const tv = new TvScreen(ctx);
    ctx.plane(tv, { z: 0, screen: true });
    return {
      update(lt, f) {
        // he wipes the tear with his own donut (the painted one, at his cheek): he leans into it
        const wipe = sm(seg(lt, 1.4, 1.9)) * (1 - sm(seg(lt, 2.4, 2.9)));
        bor?.pose(lt, 960, 1100, { rot: -0.08 * wipe });
        const G = g.clear();
        // two ink paws in front: one pats the other (pocket search), on twos
        const pat = lt < 1.4 ? Math.abs(Math.sin(Math.floor(lt * 12) * 0.9)) : 0;
        inkPaw(G, 760, 980, -0.1, 0.9, true);
        inkPaw(G, 1200, 960 - pat * 30, Math.PI + 0.25, 0.9, false);
        popIn(q, lt, 0.3, 1.4, ctx.rm);
        // the tear (until the donut gets there)
        if (lt > 1.3 && lt < 1.9) {
          const head = bor?.head() ?? [0, -400];
          const ex = 960 + head[0] + 40;
          const ey = 1100 + head[1] + 10;
          G.ellipse(ex, ey + 20 + (lt - 1.3) * 60, 10, 15).fill(0x9fd8ff).stroke({ width: 3, color: TV.line });
        }
        tv.update(f);
      },
    };
  },
};

// 9 · mesa3: they look at each other; Borrón turns the lamp back — the projector is a lamp again
export const mesa3: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna'],
  build(ctx): FilmSet {
    const room = interior(ctx, { table: true });
    ctx.plane(room, { z: 1300, bake: 'dof', blur: 6, dof: 1400, res: 1.2 });
    const wallC = new Container();
    const wall = wallCircle(ctx);
    wall.position.set(1000, 330);
    wallC.addChild(wall);
    ctx.plane(wallC, { z: 1300 });
    const live = new Container();
    const lamp = new Lamp(ctx);
    lamp.position.set(470, 705);
    const can = ctx.actor(ctx.canelo, 470);
    const luz = luzOf(ctx, 430);
    const lg = new Sprite(kitTex(ctx, 'glow'));
    lg.anchor.set(0.5);
    lg.tint = TV.lantern;
    lg.blendMode = 'add';
    const paw = new Graphics();
    live.addChild(lamp, paw);
    if (luz.actor) live.addChild(luz.actor);
    live.addChild(lg);
    if (can) live.addChild(can);
    ctx.plane(live, { z: 1000 });
    const tv = new TvScreen(ctx);
    ctx.plane(tv, { z: 0, screen: true });
    return {
      update(lt, f) {
        // the two of them, quiet: he turns his head to her, she turns to him (a held two-shot)
        can?.pose(lt, 900, 1060, { flip: true });
        luz.actor?.pose(lt, 1300, 780 + bob(lt, ctx.rm, 7), { flip: false });
        if (luz.actor) {
          const [x, y] = lanternAt(luz);
          lg.position.set(x, y);
          lg.scale.set(1.1);
          lg.alpha = 0.5;
        }
        // the ink paw turns the lamp back down; the wall's circle closes into it
        const back = sm(seg(lt, 1.8, 2.6));
        lamp.set(1 - back);
        const reach = sm(seg(lt, 1.4, 1.9)) * (1 - sm(seg(lt, 2.7, 3.2)));
        inkPaw(paw.clear(), 220 + reach * 200, 540, -0.25, 1.1);
        wall.scale.set(1 - back * 0.9);
        wall.alpha = 1 - back;
        tv.update(f);
      },
    };
  },
};

// ------------------------------------------------------------------ 4 · gato (sombras): THE KEY IMAGE
export const gato: SetModule = {
  cats: [BORRON],
  build(ctx): FilmSet {
    const sc = theatre(ctx);
    const g = new Graphics();
    sc.shadows.addChild(g);
    // the cut-out cat that jumps out of the hands (a real painting, the style's bake: brown with a rim)
    const cat = ctx.actor(BORRON, 380);
    const catC = new Container();
    if (cat) catC.addChild(cat);
    const cEyes = [eye(ctx), eye(ctx)];
    sc.shadows.addChild(catC, ...cEyes);
    const hEyes = [eye(ctx), eye(ctx)];
    sc.fx.addChild(...hEyes);
    const tv = new TvScreen(ctx);
    ctx.plane(tv, { z: 0, screen: true });
    // the morph: each hand → one half of a cat's head (same point count, a matched start)
    const half = resample(catHalfOutline(), N_MORPH);
    const halfL = startAt(half, [0, -96]);
    const handL = startAt(resample(handOutline(0.75, 0), N_MORPH), [212, -2]);
    const HC: Pt = [960, 520];
    const HS = 1.65;
    // eye spots of the cut-out (rig) in actor-local px
    const rig = cat?.puppet?.brain.model?.rig;
    const p = cat?.puppet;
    const eyeLocal: Pt[] =
      p && rig?.eyes?.length
        ? rig.eyes.map((e) => [((e[0] + e[2]) / 2 - p.anchor.x * p.W) * p.scale.x, ((e[1] + e[3]) / 2 - p.anchor.y * p.H) * p.scale.y] as Pt)
        : [
            [-50, -280],
            [20, -270],
          ];
    return {
      update(lt) {
        const rm = ctx.rm;
        const G = g.clear();
        // PREPARATION (0–2): two hands come in from the sides, fingers wiggling, searching for each other
        const inK = sm(seg(lt, 0, 1.4));
        const wig = rm ? 0 : Math.sin(lt * 6) * 0.15;
        const lx = 520 + inK * 300;
        const rx = 1400 - inK * 300;
        // DEVELOPMENT (2–3.6): they join; the fingers become ears, the thumbs the jaw — a cat's head
        const mk = rm ? sm(seg(lt, 2.0, 3.6)) : sm(seg(lt, 2.0, 3.4));
        // EXIT (4.4–6.4): the cut-out cat jumps out; the hands open again and sink
        const jump = seg(lt, 4.5, 5.9);
        const sink = sm(seg(lt, 5.0, 6.6));
        const back = mk * (1 - sm(seg(lt, 4.6, 5.4)));
        const handLp = xform(handL, lx, 520 + Math.sin(lt * 2.3) * 8, 0.95, wig * 0.3);
        const handRp = xform(handL, rx, 520 + Math.cos(lt * 2.1) * 8, 0.95, -wig * 0.3, true);
        const headL = xform(halfL, HC[0], HC[1], HS);
        const headR = xform(halfL, HC[0], HC[1], HS, 0, true);
        const L = mix(handLp, headL, back).map(([x, y]) => [x, y + sink * 560] as Pt);
        const R = mix(handRp, headR, back).map(([x, y]) => [x, y + sink * 560] as Pt);
        const rimW = 6 + back * 6;
        if (sink < 0.99) {
          shadowPoly(G, flat(L), { rimW, rim: back > 0.6 ? SH.rimHot : SH.rim });
          shadowPoly(G, flat(R), { rimW, rim: back > 0.6 ? SH.rimHot : SH.rim });
          // the seam closes as they join
          if (back > 0.85) G.rect(HC[0] - 4, HC[1] - 150, 8, 340).fill(SH.body);
        }
        // the head's eyes open (lit) at 3.6–4.4
        const open = sm(seg(lt, 3.5, 4.1)) * (1 - sm(seg(lt, 4.6, 5.0)));
        hEyes.forEach((e, i) => {
          e.position.set(HC[0] + (i ? 1 : -1) * 70, HC[1] - 30);
          e.scale.set(0.2 * open, 0.2 * open * (0.4 + 0.6 * open));
          e.alpha = open;
        });
        // the cut-out cat leaps out of the head in an arc and lands at the circle's foot, eyes lit
        const showCat = lt >= 4.5;
        catC.visible = showCat;
        if (cat && showCat) {
          const e = rm ? sm(jump) : jump;
          const x = HC[0] + (1150 - HC[0]) * e;
          const y = HC[1] + 200 + (880 - HC[1] - 200) * e - Math.sin(e * Math.PI) * (rm ? 60 : 260);
          const land = seg(lt, 5.9, 6.3);
          const sq = rm ? 1 : land > 0 && land < 1 ? 1 + Math.sin(land * Math.PI) * 0.12 : 1;
          const grow = 0.45 + 0.55 * sm(seg(lt, 4.5, 5.2));
          cat.pose(lt, x, y, { rot: (rm ? 0 : Math.sin(e * Math.PI) * 0.3) * (1 - land), sx: grow * sq, sy: grow * (2 - sq), flip: true });
          cEyes.forEach((ey, i) => {
            const lp = eyeLocal[i] ?? [0, -260];
            const c = Math.cos(cat.rotation);
            const s = Math.sin(cat.rotation);
            const ex = lp[0] * cat.scale.x;
            const ey2 = lp[1] * cat.scale.y;
            ey.position.set(cat.x + ex * c - ey2 * s, cat.y + ex * s + ey2 * c);
            ey.scale.set(0.15);
            ey.alpha = 0.95;
            ey.visible = true;
          });
        } else cEyes.forEach((ey) => (ey.visible = false));
      },
    };
  },
};

// ------------------------------------------------------------------ 6 · lapiz (sombras): the pencil falls and snaps
export const lapiz: SetModule = {
  build(ctx): FilmSet {
    const sc = theatre(ctx);
    const g = new Graphics();
    sc.shadows.addChild(g);
    const tv = new TvScreen(ctx);
    ctx.plane(tv, { z: 0, screen: true });
    const pencil = (G: Graphics, cx: number, cy: number, rot: number, from: number, to: number, o: { tipL?: boolean; jag?: number } = {}) => {
      // a pencil along its axis from `from` to `to` (local, the whole pencil is −260..260), hexagonal, with its tip
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      const P = (u: number, v: number): number[] => [cx + u * c - v * s, cy + u * s + v * c];
      const pts: number[] = [];
      const hw = 24;
      if (from <= -260 && o.tipL !== false) pts.push(...P(-330, 0));
      pts.push(...P(Math.max(-260, from), -hw));
      if (to >= 260) pts.push(...P(260, -hw), ...P(276, -hw + 6), ...P(276, hw - 6), ...P(260, hw));
      else for (let j = 0; j <= 5; j++) pts.push(...P(to + (j % 2 ? 12 : -10) * (o.jag ?? 1), -hw + (j / 5) * hw * 2));
      if (from > -260) {
        pts.push(...P(from, hw));
        for (let j = 5; j >= 0; j--) pts.push(...P(from + (j % 2 ? -12 : 10), -hw + (j / 5) * hw * 2));
      } else pts.push(...P(Math.max(-260, from), hw));
      shadowPoly(G, pts, { rimW: 6 });
    };
    return {
      update(lt) {
        const rm = ctx.rm;
        const G = g.clear();
        const drop = 0.8;
        const hit = 1.8;
        if (lt < hit) {
          // held by a hand at the top, released, falling and turning
          const k = seg(lt, drop, hit);
          const y = 240 + k * k * 440;
          const rot = -0.15 + k * k * (rm ? 0.3 : 1.2);
          pencil(G, 960, y, rot, -260, 260);
          if (lt < drop + 0.3) {
            const away = seg(lt, drop, drop + 0.3);
            shadowPoly(G, flat(xform(handOutline(0.5, 0.6), 980 - 120, 200 - away * 120, 0.9, -1.4)), {});
          }
        } else {
          // SNAP: two halves fly apart with a flash of light along the break, then lie still
          const k = seg(lt, hit, hit + 0.8);
          const e = rm ? sm(k) : outBack(k, 1.4);
          const flashK = 1 - seg(lt, hit, hit + 0.35);
          pencil(G, 900 - e * 140, 690 - Math.sin(k * Math.PI) * (rm ? 30 : 120), 1.05 - e * 1.1, -260, 0, { jag: 1 });
          pencil(G, 1020 + e * 160, 690 - Math.sin(k * Math.PI) * (rm ? 20 : 80), 1.05 + e * 0.6, 0, 260, { jag: 1 });
          if (flashK > 0) {
            for (let i = 0; i < 9; i++) {
              const a = i * 0.7;
              G.moveTo(960 + Math.cos(a) * 20, 690 + Math.sin(a) * 20)
                .lineTo(960 + Math.cos(a) * (30 + 90 * (1 - flashK)), 690 + Math.sin(a) * (30 + 90 * (1 - flashK)))
                .stroke({ width: 7, color: SH.rimHot, alpha: flashK, cap: 'round' });
            }
          }
          // splinters
          for (let i = 0; i < 6; i++) {
            const a = -1.2 - rnd(i) * 1.6;
            const d = (rm ? 60 : 160) * e * (0.5 + rnd(i + 3));
            G.rect(960 + Math.cos(a) * d, 690 + Math.sin(a) * d * 0.6 + k * k * 120, 14, 5).fill({ color: SH.body, alpha: 1 - k * 0.6 });
          }
        }
      },
    };
  },
};

// ------------------------------------------------------------------ 8 · donas (sombras): everything ends · they forget
export const donas: SetModule = {
  build(ctx): FilmSet {
    const sc = theatre(ctx);
    const g = new Graphics();
    sc.shadows.addChild(g);
    const nams: Sprite[] = [];
    for (let i = 0; i < 5; i++) {
      const n = word(ctx.k, 'ñam', { fontFamily: 'Bangers', fontSize: 42, fill: 0xffe9b0, letterSpacing: 2 });
      sc.fx.addChild(n);
      nams.push(n);
    }
    const hic = word(ctx.k, '¡HIC!', { fontFamily: 'Bangers', fontSize: 120, fill: 0xffe9b0, stroke: { color: SH.body, width: 10 }, letterSpacing: 4 });
    sc.fx.addChild(hic);
    const dust = new Graphics();
    sc.fx.addChild(dust);
    const tv = new TvScreen(ctx);
    ctx.plane(tv, { z: 0, screen: true });
    const H0 = HIC_T - 37;
    return {
      update(lt) {
        const rm = ctx.rm;
        const G = g.clear();
        const D = dust.clear();
        const j = ctx.k.judged('hic');
        const dev = import.meta.env.DEV && typeof location !== 'undefined' && (new URLSearchParams(location.search).get('hit') ?? '').split(',').includes('hic');
        const big = (j && (j.r === 'great' || j.r === 'hit')) || dev ? 1.8 : 1;
        // the hiccup (always; a tap makes it bigger): everything hops
        const hk = seg(lt, H0, H0 + 0.5);
        const hopY = lt >= H0 && lt < H0 + 0.5 ? -Math.sin(hk * Math.PI) * (rm ? 14 : 46) * big : 0;
        const shake = lt >= H0 && lt < H0 + 0.5 && !rm ? Math.sin(lt * 70) * 8 * big * (1 - hk) : 0;
        hic.visible = lt >= H0 && lt < H0 + 0.9;
        if (hic.visible) {
          hic.position.set(960 + shake, 230);
          hic.scale.set((rm ? 1 : 0.7 + outBack(seg(lt, H0, H0 + 0.25)) * 0.3) * (0.85 + 0.15 * big));
          hic.alpha = 1 - sm(seg(lt, H0 + 0.6, H0 + 0.9));
        }
        // F02-7 (0–3.6): the plate of shadow donuts; one by one they are bitten by the dark and gone
        const plateOut = sm(seg(lt, H0 + 0.2, H0 + 0.8));
        if (plateOut < 1) {
          const py = 700 + plateOut * 500 + hopY;
          const px = 960 + shake;
          shadowPoly(G, ellipsePts(px, py, 300, 52), { rimW: 6 });
          for (let i = 0; i < 5; i++) {
            const t0 = 0.6 + i * 0.45;
            const bite = seg(lt, t0, t0 + 0.3);
            const gone = sm(seg(lt, t0 + 0.25, t0 + 0.45));
            const dx = px - 220 + i * 110;
            const dy = py - 56 - (i % 2) * 20;
            if (gone < 1) donutShadow(G, dx, dy, 52 * (1 - gone * 0.4), bite, 1 - gone);
            const n = nams[i];
            n.visible = lt > t0 + 0.2 && lt < t0 + 0.9;
            if (n.visible) {
              n.position.set(dx, dy - 90 - seg(lt, t0 + 0.2, t0 + 0.9) * 40);
              n.alpha = 1 - seg(lt, t0 + 0.6, t0 + 0.9);
            }
          }
        } else nams.forEach((n) => (n.visible = false));
        // F02-8 (3.6–9.4): a shadow card with six lines; one erases itself, left → right, into dust of light
        const cin = sm(seg(lt, H0 + 0.5, H0 + 1.1));
        if (cin > 0) {
          const cx = 960;
          const cy = 470 - (1 - cin) * 600;
          shadowRect(G, cx - 250, cy - 170, 500, 340, { rimW: 7 });
          // the card's lines are slits of light
          const er = seg(lt, 5.4, 7.6);
          for (let i = 0; i < 6; i++) {
            const y = cy - 115 + i * 48;
            const w = i === 0 ? 220 : 380 - (i % 3) * 40;
            const x0 = cx - 210;
            if (i === 3) {
              // this one erases left → right
              const start = x0 + w * er;
              if (er < 1) G.roundRect(start, y - 7, x0 + w - start, 14, 7).fill({ color: SH.rimHot, alpha: 0.85 });
              const st = Math.floor(lt * 12);
              if (er > 0 && er < 1)
                for (let q = 0; q < 14; q++) {
                  const u = rnd(q + st * 3);
                  const dx = x0 + w * er * u;
                  const age = (er * w - (dx - x0)) / 120;
                  D.circle(dx, y - age * 60 - rnd(q + 9) * 20, 4 * (1 - Math.min(1, age))).fill({ color: SH.rimHot, alpha: Math.max(0, 0.9 - age) });
                }
            } else G.roundRect(x0, y - 7, w, 14, 7).fill({ color: SH.rimHot, alpha: 0.85 });
          }
        }
      },
    };
  },
};
function ellipsePts(x: number, y: number, rx: number, ry: number, n = 28): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push(x + Math.cos(a) * rx, y + Math.sin(a) * ry);
  }
  return out;
}
/** a shadow donut: a ring (its hole lets the light through); `bite` 0..1 takes bites out of its rim */
function donutShadow(g: Graphics, x: number, y: number, r: number, bite: number, alpha: number) {
  const n = 30;
  const outer: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    // bites: two notches on the upper right that deepen
    const b1 = Math.max(0, 1 - Math.abs(a - 5.6) / 0.35) * bite * 0.45;
    const b2 = Math.max(0, 1 - Math.abs(a - 0.6) / 0.3) * Math.max(0, bite - 0.4) * 0.6;
    const rr = r * (1 - b1 - b2);
    outer.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.62);
  }
  shadowPoly(g, outer, { rimW: 5, alpha });
  g.ellipse(x, y, r * 0.34, r * 0.2).fill({ color: 0xffd99a, alpha: alpha * 0.9 });
}
void [disc, Sprite];
