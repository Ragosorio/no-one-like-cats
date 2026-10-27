/**
 * F04 — sets of the prologue, the Donería and the Hipo-Mart (shot list in ./index.ts). Silent film, B&W by the post;
 * everything drawn flat-grey with the rubber-hose ink line; the cats are their paintings through the 'mudo' bake.
 * Homiau = kit Homiau (his painting, homiau_donut_cat, acting through the kit's interface).
 */
import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js';
import type { Actor } from '../../../../momentos/anime/actor';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { siluetaKeep } from '../../../../momentos/songs/drunck/silueta';
import { Beam, HOMIAU, Homiau, TV, bob, donut, kitTex, lanternAt, luzOf, outBack, rnd, seg, sm } from '../kit';
import { Intertitles, Lantern, MLW, MU, SilentScreen, lanternHole, paw, silentLook, sun, tapped, type TitleSpec } from './mudo';

// ------------------------------------------------------------------ shared
/** an intertitle-only shot (a black card) */
const card = (spec: TitleSpec): SetModule => ({
  build(ctx): FilmSet {
    const t = new Intertitles(ctx, [spec]);
    ctx.plane(t, { z: 0, screen: true });
    const scr = new SilentScreen(ctx);
    ctx.plane(scr, { z: 0, screen: true });
    return { update: (lt, f) => (t.update(lt), scr.update(f)), look: silentLook(ctx) };
  },
});
/** mount the screen plane trio: intertitles over the picture, then the TV and the round vignette */
function overlays(ctx: SceneCtx, titles: TitleSpec[]) {
  const t = new Intertitles(ctx, titles);
  ctx.plane(t, { z: 0, screen: true });
  const scr = new SilentScreen(ctx);
  ctx.plane(scr, { z: 0, screen: true });
  return { t, scr };
}
/**
 * Canelo lost his scarf (until the bar): his painting wears it, so a patch of chest fur covers it (siluetaKeep regions:
 * the hanging end and the band). A child of the actor (moves with him). Returns a switch.
 */
export function noScarf(a: Actor | null, slug: string): (on: boolean) => void {
  const p = a?.puppet;
  const regions = siluetaKeep(slug);
  if (!a || !p || !regions) return () => undefined;
  const g = new Container();
  const s = p.scale.x;
  const ax = p.anchor.x * p.W;
  const ay = p.anchor.y * p.H;
  for (const r of regions) {
    const [cx, cy, rx, ry, rot = 0] = r;
    const e = new Graphics();
    const RX = rx * 1.15 * s;
    const RY = ry * 1.3 * s;
    // fluffy chest fur over the scarf: a soft base and many short strokes, some spilling past the edge
    e.ellipse(0, 0, RX, RY).fill({ color: 0xd2c9bd, alpha: 0.82 });
    for (let i = 0; i < 46; i++) {
      const a = rnd(i * 3 + cx) * Math.PI * 2;
      const d = Math.sqrt(rnd(i * 5 + cy)) * 1.08;
      const u = Math.cos(a) * RX * d;
      const v = Math.sin(a) * RY * d;
      const len = (10 + rnd(i + 11) * 18) * s * 2;
      const tilt = (rnd(i + 17) - 0.5) * 0.8;
      e.moveTo(u, v).lineTo(u + Math.sin(tilt) * len, v + Math.cos(tilt) * len).stroke({ width: (2 + rnd(i) * 3) * s * 2, color: i % 3 === 0 ? 0x9a9086 : 0xf2ece4, alpha: 0.85, cap: 'round' });
    }
    e.position.set((cx - ax) * s, (cy - ay) * s);
    e.rotation = rot;
    g.addChild(e);
  }
  a.addChild(g);
  return (on: boolean) => (g.visible = on);
}
/** big cartoon eyes popping out at the rig's eye spots (the rubber-hose take) */
function bigEyes(g: Graphics, a: Actor | null, k: number, o: { angry?: boolean } = {}) {
  const p = a?.puppet;
  const rig = p?.brain.model?.rig;
  if (!a || !p || !rig?.eyes?.length || k <= 0) return;
  for (const e of rig.eyes) {
    const lx = ((e[0] + e[2]) / 2 - p.anchor.x * p.W) * p.scale.x * a.scale.x;
    const ly = ((e[1] + e[3]) / 2 - p.anchor.y * p.H) * p.scale.y * a.scale.y;
    const c = Math.cos(a.rotation);
    const s = Math.sin(a.rotation);
    const x = a.x + lx * c - ly * s;
    const y = a.y + lx * s + ly * c;
    const r = Math.abs((e[2] - e[0]) * p.scale.x * a.scale.y) * (o.angry ? 0.7 : 1.1 * k);
    if (o.angry) {
      // a heavy brow, slanting in
      const dir = lx < 0 ? 1 : -1;
      g.moveTo(x - r * 1.2 * dir, y - r * 1.5).lineTo(x + r * 0.9 * dir, y - r * 0.8).stroke({ width: r * 0.45, color: MU.ink, cap: 'round' });
      continue;
    }
    g.ellipse(x, y - r * 0.2, r, r * 1.25).fill(0xffffff).stroke({ width: MLW, color: MU.ink });
    g.circle(x + r * 0.1, y - r * 0.1, r * 0.38).fill(MU.ink);
  }
}

// ------------------------------------------------------------------ the plaza with the fountain
function plaza(ctx: SceneCtx): Container {
  const c = new Container();
  const g = new Graphics();
  g.rect(-200, -200, 2320, 760).fill(MU.sky);
  // buildings of the square (flat greys, hard shadows on the right)
  for (let i = 0; i < 9; i++) {
    const x = 120 + i * 200;
    const h = 260 + rnd(i + 2) * 180;
    g.rect(x, 560 - h, 190, h).fill(i % 2 ? MU.l : 0xa59e96).stroke({ width: MLW, color: MU.ink });
    g.rect(x + 150, 560 - h, 40, h).fill({ color: MU.d, alpha: 0.35 });
    for (let j = 0; j < 6; j++) g.rect(x + 22 + (j % 3) * 50, 560 - h + 30 + Math.floor(j / 3) * 80, 30, 46).fill(MU.d);
  }
  // cobblestones
  g.rect(-200, 560, 2320, 720).fill(0xc7c0b6);
  for (let r = 0; r < 12; r++) for (let i = 0; i < 26; i++) g.ellipse(-180 + i * 90 + (r % 2) * 45, 590 + r * 44, 36, 14).stroke({ width: 2, color: MU.m, alpha: 0.6 });
  c.addChild(g);
  c.addChild(sun(ctx, 1500, 150, 80));
  return c;
}
/** the fountain's back half + water (behind a floating cat) and its front rim (over him) */
function fountain(): { back: Graphics; water: Graphics; front: Graphics } {
  const back = new Graphics();
  back.ellipse(960, 760, 440, 120).fill(MU.l).stroke({ width: MLW, color: MU.ink });
  back.rect(930, 470, 60, 260).fill(MU.l).stroke({ width: MLW, color: MU.ink });
  back.ellipse(960, 470, 120, 30).fill(MU.l).stroke({ width: MLW, color: MU.ink });
  const water = new Graphics();
  const front = new Graphics();
  front.poly([520, 760, 1400, 760, 1400, 830, 1380, 860, 540, 860, 520, 830]).fill(MU.l).stroke({ width: MLW, color: MU.ink, join: 'round' });
  front.moveTo(520, 760).bezierCurveTo(600, 880, 1320, 880, 1400, 760).stroke({ width: MLW, color: MU.ink });
  front.rect(520, 790, 880, 70).fill({ color: MU.m, alpha: 0.3 });
  return { back, water, front };
}
function drawWater(g: Graphics, lt: number, rm: boolean) {
  g.clear();
  g.ellipse(960, 762, 410, 100).fill(MU.w).stroke({ width: 3, color: MU.m });
  for (let i = 0; i < 5; i++) {
    const r = 60 + (((lt * 40 + i * 70) % 340) * (rm ? 0.3 : 1));
    g.ellipse(960, 760, r, r * 0.22).stroke({ width: 2, color: MU.m, alpha: 0.6 });
  }
  // the fountain's arcs of water (dashes running down)
  for (const s of [-1, 1]) {
    for (let j = 0; j < 7; j++) {
      const u = ((j / 7 + lt * (rm ? 0.2 : 0.8)) % 1);
      const x = 960 + s * (30 + u * 190);
      const y = 470 - Math.sin(u * Math.PI) * 60 + u * u * 230;
      g.circle(x, y, 7).fill(0xffffff).stroke({ width: 2, color: MU.m });
    }
  }
}

// 1 · rotulo — «A LA MAÑANA SIGUIENTE…»
export const p_rotulo = card({ t: 0, dur: 9, text: 'A LA MAÑANA SIGUIENTE…' });

// 2 · fuente — Canelo floats belly up like a rubber duck; the sun on his face; he covers it with his paw
export const p_fuente: SetModule = {
  cats: ({ canelo }) => [canelo],
  build(ctx): FilmSet {
    const bgc = plaza(ctx);
    ctx.plane(bgc, { z: 1000, bake: 'static' });
    const live = new Container();
    const f = fountain();
    const can = ctx.actor(ctx.canelo, 320);
    const scarfOff = noScarf(can, ctx.canelo);
    scarfOff(true);
    const beam = new Graphics();
    const pawG = new Graphics();
    live.addChild(f.back, f.water);
    if (can) live.addChild(can);
    live.addChild(f.front, beam, pawG);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, []);
    return {
      update(lt, fi) {
        const rm = ctx.rm;
        drawWater(f.water, lt, rm);
        const by = Math.sin(lt * 2) * (rm ? 2 : 6);
        can?.pose(lt, 1160, 700 + by, { rot: -1.45 });
        // the sun hits his face (a hard wedge of light), at 3.0 he puts a paw over his eyes
        const B = beam.clear();
        const P = pawG.clear();
        if (can) {
          const [hx, hy] = can.head();
          const c = Math.cos(can.rotation);
          const s = Math.sin(can.rotation);
          const fx = can.x + hx * c - hy * s;
          const fy = can.y + hx * s + hy * c;
          B.poly([1460, 170, 1540, 150, fx + 40, fy, fx - 40, fy]).fill({ color: 0xffffff, alpha: 0.22 });
          const cover = sm(seg(lt, 2.6, 3.2));
          if (cover > 0) paw(P, fx + 90 - cover * 70, fy - 70 + cover * 40, 2.6, 0.9);
        }
        t.update(lt);
        scr.update(fi);
      },
      look: silentLook(ctx),
    };
  },
};

// 3 · medio — he wakes, touches his neck, huge eyes: «¡MI BUFANDA!»
export const p_medio: SetModule = {
  cats: ({ canelo }) => [canelo],
  build(ctx): FilmSet {
    const bgc = plaza(ctx);
    ctx.plane(bgc, { z: 1300, bake: 'static' });
    const live = new Container();
    const can = ctx.actor(ctx.canelo, 720);
    noScarf(can, ctx.canelo)(true);
    const water = new Graphics().rect(0, 900, 1920, 300).fill(MU.w).stroke({ width: MLW, color: MU.ink });
    for (let i = 0; i < 8; i++) water.moveTo(300 + i * 170, 940 + (i % 2) * 20).lineTo(380 + i * 170, 940 + (i % 2) * 20).stroke({ width: 3, color: MU.m });
    const g = new Graphics();
    if (can) live.addChild(can);
    live.addChild(water, g);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, [{ t: 1.2, dur: 1.5, text: '¡MI BUFANDA!' }]);
    return {
      update(lt, fi) {
        const wake = ctx.rm ? sm(seg(lt, 0, 0.5)) : outBack(seg(lt, 0, 0.35), 2);
        can?.pose(lt, 960, 1220 - wake * 60, { sy: 1 + (wake < 1 ? (1 - wake) * 0.1 : 0) });
        const G = g.clear();
        if (can) {
          // a paw goes to the bare neck
          const [hx, hy] = can.head();
          const touch = sm(seg(lt, 0.3, 0.7));
          paw(G, can.x + hx + 40, can.y + hy + 230 - (1 - touch) * 200, -2.2, 1.1);
          bigEyes(G, can, sm(seg(lt, 0.55, 0.8)));
        }
        t.update(lt);
        scr.update(fi);
      },
      look: silentLook(ctx),
    };
  },
};

// 4 · dos — she doubles over laughing, spins in the air: «No me estoy riendo. Estoy… brillando.»
export const p_dos: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna'],
  build(ctx): FilmSet {
    const bgc = plaza(ctx);
    ctx.plane(bgc, { z: 1200, bake: 'static' });
    const live = new Container();
    const f = fountain();
    const can = ctx.actor(ctx.canelo, 470);
    noScarf(can, ctx.canelo)(true);
    const luz = luzOf(ctx, 480);
    const glow = new Sprite(kitTex(ctx, 'glow'));
    glow.anchor.set(0.5);
    glow.blendMode = 'add';
    const lines = new Graphics();
    live.addChild(f.back, f.water);
    if (can) live.addChild(can);
    live.addChild(f.front);
    if (luz.actor) live.addChild(luz.actor);
    live.addChild(glow, lines);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, [{ t: 2.6, dur: 2.2, text: 'No me estoy riendo. Estoy… brillando.', who: 'Luzterna' }]);
    return {
      update(lt, fi) {
        const rm = ctx.rm;
        drawWater(f.water, lt, rm);
        can?.pose(lt, 760, 860, {});
        // doubled over (on twos), then a whole spin in the air
        const st = Math.floor(lt * 12);
        const shake = rm ? 0 : Math.sin(st * 1.9) * 0.08;
        const spin = lt > 1.2 && lt < 2.2 && !rm ? seg(lt, 1.2, 2.2) * Math.PI * 2 : 0;
        luz.actor?.pose(lt, 1320, 680 + bob(lt, rm, 14) + Math.abs(Math.sin(st)) * (rm ? 0 : 10), { rot: 0.35 + shake + spin, flip: true });
        if (luz.actor) {
          const [x, y] = lanternAt(luz);
          glow.position.set(x, y);
          const bright = lt > 4.8 ? 1 + sm(seg(lt, 4.8, 5.3)) * 1.2 : 1;
          glow.scale.set(1.2 * bright);
          glow.alpha = 0.6;
        }
        // laugh lines around her (silent film: the lines say it)
        const L = lines.clear();
        if (lt < 2.6 && luz.actor) {
          for (let i = 0; i < 3; i++) {
            const a = -0.9 + i * 0.5 + (st % 2) * 0.1;
            const r0 = 260;
            L.moveTo(1320 + Math.cos(a) * r0, 520 + Math.sin(a) * r0).lineTo(1320 + Math.cos(a) * (r0 + 60), 520 + Math.sin(a) * (r0 + 60)).stroke({ width: 7, color: MU.ink, cap: 'round' });
          }
        }
        t.update(lt);
        scr.update(fi);
      },
      look: silentLook(ctx),
    };
  },
};

// 5 · cara — his offended face; the iris will close on it
export const p_cara: SetModule = {
  cats: ({ canelo }) => [canelo],
  build(ctx): FilmSet {
    const bgc = plaza(ctx);
    ctx.plane(bgc, { z: 1500, bake: 'dof', blur: 8, dof: 800 });
    const live = new Container();
    const can = ctx.actor(ctx.canelo, 1150);
    noScarf(can, ctx.canelo)(true);
    const g = new Graphics();
    if (can) live.addChild(can);
    live.addChild(g);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, []);
    let face: [number, number] = [900, 470];
    return {
      update(lt, fi) {
        can?.pose(lt, 960, 1500, { sy: 1 - sm(seg(lt, 0.2, 0.5)) * 0.04 });
        const G = g.clear();
        bigEyes(G, can, 1, { angry: true });
        if (can) {
          const [hx, hy] = can.head();
          face = [can.x + hx, can.y + hy];
          // «hmph»: two puffs from the nose
          const k = seg(lt, 0.6, 1.2);
          if (k > 0 && k < 1) for (const s of [-1, 1]) G.circle(face[0] + s * (50 + k * 60), face[1] + 90 - k * 20, 16 * (1 - k)).stroke({ width: 5, color: MU.ink, alpha: 1 - k });
        }
        t.update(lt);
        scr.update(fi);
      },
      anchor: (n) => (n === 'face' ? face : null),
      look: silentLook(ctx),
    };
  },
};

// 6 · rotulo2 — «¿DÓNDE QUEDÓ LA BUFANDA?»
export const p_rotulo2 = card({ t: 0, dur: 9, text: '¿DÓNDE QUEDÓ LA BUFANDA?' });

// ================================================================== LA DONERÍA (by day)
function doneria(ctx: SceneCtx): Container {
  const c = new Container();
  const g = new Graphics();
  g.rect(-200, -200, 2320, 1480).fill(MU.w);
  for (let x = -200; x < 2200; x += 80) g.rect(x, -200, 36, 900).fill({ color: MU.l, alpha: 0.5 });
  // the window with the burnt sun
  g.rect(260, 140, 480, 380).fill(0xf6f2ea).stroke({ width: MLW, color: MU.ink });
  g.rect(494, 140, 12, 380).fill(MU.ink).rect(260, 324, 480, 12).fill(MU.ink);
  // the menu board and the sign
  g.rect(1000, 120, 460, 240).fill(MU.d).stroke({ width: MLW, color: MU.ink });
  for (let i = 0; i < 4; i++) g.rect(1040, 170 + i * 46, 300 - (i % 2) * 80, 10).fill(MU.l);
  // the display case with donuts
  g.rect(-100, 640, 2120, 80).fill(MU.l).stroke({ width: MLW, color: MU.ink });
  c.addChild(g);
  const s = sun(ctx, 560, 260, 54);
  c.addChild(s);
  return c;
}
function counterFront(): Graphics {
  const g = new Graphics();
  g.rect(-100, 760, 2120, 420).fill(MU.m).stroke({ width: MLW, color: MU.ink });
  g.rect(-100, 720, 2120, 50).fill(MU.l).stroke({ width: MLW, color: MU.ink });
  for (let i = 0; i < 9; i++) donut(g, 330 + i * 150, 700, 34, i);
  for (let x = -60; x < 2000; x += 220) g.rect(x, 800, 180, 340).stroke({ width: 3, color: MU.d });
  return g;
}

// D1 · mostrador — Homiau, hungover, a wet rag on his head, a donut in his paw
export const d_mostrador: SetModule = {
  cats: [HOMIAU],
  build(ctx): FilmSet {
    ctx.plane(doneria(ctx), { z: 1000, bake: 'static' });
    const live = new Container();
    const hom = new Homiau(ctx, { size: 690 });
    hom.scale.set(1.15);
    const rag = new Graphics();
    const front = counterFront();
    const fx = new Graphics();
    live.addChild(hom, rag, front, fx);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, []);
    return {
      update(lt, fi) {
        const sway = Math.sin(lt * 1.3) * 0.06;
        hom.position.set(1060, 930);
        hom.rotation = 0.12 + sway;
        hom.act(lt, { look: 0.6 + sway, raise: 0.1 });
        const R = rag.clear();
        const [hx, hc, hr] = hom.headAt();
        const hy = hc - hr * 0.95;
        R.poly([hx - 120, hy, hx + 110, hy - 20, hx + 130, hy + 40, hx + 60, hy + 70, hx - 40, hy + 64, hx - 130, hy + 40]).fill(MU.l).stroke({ width: MLW, color: MU.ink, join: 'round' });
        for (let i = 0; i < 3; i++) {
          const dy = ((lt * 90 + i * 40) % 110);
          R.ellipse(hx - 80 + i * 70, hy + 70 + dy, 6, 9).fill(0xffffff).stroke({ width: 2, color: MU.ink, alpha: 1 - dy / 110 });
        }
        // dizzy spirals over him
        const F = fx.clear();
        for (let i = 0; i < 2; i++) {
          const a = lt * 3 + i * Math.PI;
          F.circle(hx + Math.cos(a) * 140, hy - 70 + Math.sin(a) * 30, 14).stroke({ width: 4, color: MU.ink });
        }
        t.update(lt);
        scr.update(fi);
      },
      look: silentLook(ctx),
    };
  },
};

// D2 · homiau — his eyes light up, he stands: «¡ME ACUERDO DE ANOCHE!»
export const d_homiau: SetModule = {
  cats: [HOMIAU],
  build(ctx): FilmSet {
    ctx.plane(doneria(ctx), { z: 1300, bake: 'dof', blur: 6, dof: 1000 });
    const live = new Container();
    const hom = new Homiau(ctx);
    const rag = new Graphics();
    const rays = new Graphics();
    live.addChild(rays, hom, rag);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, [{ t: 2.2, dur: 1.8, text: '¡ME ACUERDO DE ANOCHE!', who: 'Homiau' }]);
    return {
      update(lt, fi) {
        const rm = ctx.rm;
        const up = rm ? sm(seg(lt, 1.0, 1.5)) : outBack(seg(lt, 1.0, 1.35), 2.2);
        hom.position.set(960, 1180 - up * 170);
        hom.scale.set(1.6);
        hom.rotation = 0.12 * (1 - up);
        hom.act(lt, { look: 0.6 * (1 - up), raise: lt > 4 ? sm(seg(lt, 4, 4.4)) : 0.1, squash: lt > 1 && lt < 1.3 ? -0.6 : 0 });
        // the rag flies off as he jumps
        const R = rag.clear();
        const fly = seg(lt, 1.0, 1.9);
        const [hx0, hc0, hr0] = hom.headAt();
        if (fly < 1) {
          const x = hx0 + fly * 380;
          const y = hc0 - hr0 * 0.95 - fly * 300 + fly * fly * 600;
          R.poly([x - 120, y, x + 110, y - 20, x + 130, y + 40, x - 130, y + 40]).fill(MU.l).stroke({ width: MLW, color: MU.ink, join: 'round' });
          R.rotation = 0;
        }
        // rays around his head: he remembers
        const G = rays.clear();
        const k = sm(seg(lt, 1.0, 1.4));
        if (k > 0) {
          const cx = hx0;
          const cy = hc0;
          for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2 + (rm ? 0 : lt * 0.4);
            G.poly([cx + Math.cos(a - 0.06) * 260, cy + Math.sin(a - 0.06) * 260, cx + Math.cos(a) * (430 + 40 * k), cy + Math.sin(a) * (430 + 40 * k), cx + Math.cos(a + 0.06) * 260, cy + Math.sin(a + 0.06) * 260]).fill({ color: 0xffffff, alpha: 0.9 * k });
          }
        }
        t.update(lt);
        scr.update(fi);
      },
      look: silentLook(ctx),
    };
  },
};

// D3 · abrazo — he hugs Canelo: «¡NUNCA ME ACUERDO DE ANOCHE! ¡ERA LO MEJOR DE MI VIDA!»
export const d_abrazo: SetModule = {
  cats: ({ canelo }) => [canelo, HOMIAU],
  build(ctx): FilmSet {
    ctx.plane(doneria(ctx), { z: 1300, bake: 'dof', blur: 6, dof: 1000 });
    const live = new Container();
    const can = ctx.actor(ctx.canelo, 560);
    noScarf(can, ctx.canelo)(true);
    const hom = new Homiau(ctx);
    const hearts = new Graphics();
    if (can) live.addChild(can);
    live.addChild(hom, hearts);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, [{ t: 1.6, dur: 3.2, text: '¡NUNCA ME ACUERDO DE ANOCHE! ¡ERA LO MEJOR DE MI VIDA!', who: 'Homiau' }]);
    return {
      update(lt, fi) {
        const rm = ctx.rm;
        const hug = rm ? sm(seg(lt, 0.2, 0.6)) : outBack(seg(lt, 0.2, 0.5), 1.8);
        const squeeze = lt > 0.5 ? Math.abs(Math.sin(lt * 5)) * (rm ? 0 : 0.05) : 0;
        can?.pose(lt, 830, 1110, { sx: 1 - hug * 0.1 - squeeze, sy: 1 + hug * 0.05 + squeeze });
        hom.position.set(1260 - hug * 200, 1120);
        hom.scale.set(1.3);
        hom.rotation = -0.18 * hug;
        hom.act(lt, { raise: 0.95 * hug, look: -0.6 * hug, squash: squeeze * 4 });
        const H = hearts.clear();
        for (let i = 0; i < 3; i++) {
          const k = ((lt * 0.6 + i / 3) % 1);
          const x = 1000 + i * 70 + Math.sin(lt * 3 + i) * 20;
          const y = 520 - k * 260;
          const s = 18 * (1 - k * 0.4);
          H.moveTo(x, y + s).bezierCurveTo(x - s * 2, y - s * 0.4, x - s, y - s * 1.6, x, y - s * 0.6).bezierCurveTo(x + s, y - s * 1.6, x + s * 2, y - s * 0.4, x, y + s).fill({ color: 0xffffff, alpha: 1 - k }).stroke({ width: 4, color: MU.ink, alpha: 1 - k });
        }
        t.update(lt);
        scr.update(fi);
      },
      look: silentLook(ctx),
    };
  },
};

// D4 · pregunta — «¿Y mi bufanda?» (mime) · Homiau points down the street with the donut: «Pregúntale a la tienda…»
export const d_pregunta: SetModule = {
  cats: ({ canelo }) => [canelo, HOMIAU],
  build(ctx): FilmSet {
    ctx.plane(doneria(ctx), { z: 1300, bake: 'dof', blur: 6, dof: 1000 });
    const live = new Container();
    const can = ctx.actor(ctx.canelo, 540);
    noScarf(can, ctx.canelo)(true);
    const hom = new Homiau(ctx);
    const g = new Graphics();
    if (can) live.addChild(can);
    live.addChild(hom, g);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, [
      { t: 1.4, dur: 1.2, text: '¿Y mi bufanda?', who: 'Canelo' },
      { t: 3.3, dur: 3.4, text: 'Pregúntale a la tienda. Ahí compraste hielo. Mucho hielo.', who: 'Homiau' },
    ]);
    return {
      update(lt, fi) {
        can?.pose(lt, 720, 1100);
        hom.position.set(1270, 1110);
        hom.scale.set(1.2);
        const point = sm(seg(lt, 2.6, 3.0));
        hom.act(lt, { raise: 0.75 * point + 0.1, look: 0.3 * point, chew: lt < 2.6 ? 0.6 : 0 });
        const G = g.clear();
        // the mime: two paws circle round his bare neck («my scarf»)
        if (can && lt < 1.4) {
          const [hx, hy] = can.head();
          const a = lt * 7;
          const nx = can.x + hx;
          const ny = can.y + hy + 130;
          paw(G, nx + Math.cos(a) * 120, ny + Math.sin(a) * 34, a + 1.6, 0.85);
          paw(G, nx + Math.cos(a + Math.PI) * 120, ny + Math.sin(a + Math.PI) * 34, a + Math.PI + 1.6, 0.85);
        }
        // the arrow of his gesture (the street is that way)
        if (point > 0.5 && lt < 3.3) {
          const k = seg(lt, 2.8, 3.2);
          G.moveTo(1500, 380).lineTo(1500 + 140 * k, 330).stroke({ width: 8, color: MU.ink, cap: 'round' });
          if (k > 0.8) G.poly([1650, 320, 1620, 300, 1626, 342]).fill(MU.ink);
        }
        t.update(lt);
        scr.update(fi);
      },
      look: silentLook(ctx),
    };
  },
};

// D5 · dona — detail of the donut. ¡DONA! (tap): he gives it to Canelo and regrets it mid-air · no tap: he eats it
/** a B&W donut with real contrast (dough mid-grey, a dark glaze, white sprinkles); `bites` notches out of its rim */
function bwDonut(g: Graphics, x: number, y: number, r: number, bites = 0) {
  const ring = (rr: number, ry: number, notch: boolean): number[] => {
    const out: number[] = [];
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      let k = 1;
      if (notch)
        for (let b = 0; b < bites; b++) {
          const ca = -0.9 + b * 0.55;
          const d = Math.abs(Math.atan2(Math.sin(a - ca), Math.cos(a - ca)));
          k = Math.min(k, 1 - Math.max(0, 1 - d / 0.28) * 0.32);
        }
      out.push(x + Math.cos(a) * rr * k, y + Math.sin(a) * ry * k);
    }
    return out;
  };
  g.poly(ring(r, r * 0.62, true)).fill(0xb09a80).stroke({ width: MLW, color: MU.ink });
  g.poly(ring(r * 0.86, r * 0.5, true)).fill(0x5a524e);
  for (let i = 0; i < 14; i++) {
    const a = i * 0.45;
    const rr = r * (0.52 + 0.22 * ((i * 37) % 10) / 10);
    g.roundRect(x + Math.cos(a) * rr - 9, y - r * 0.05 + Math.sin(a) * rr * 0.55 - 3, 18, 6, 3).fill(0xffffff);
  }
  g.ellipse(x, y, r * 0.3, r * 0.17).fill(0x2a2426).stroke({ width: 4, color: MU.ink });
}
export const d_dona: SetModule = {
  build(ctx): FilmSet {
    ctx.plane(doneria(ctx), { z: 1600, bake: 'dof', blur: 14, dof: 700 });
    const live = new Container();
    const g = new Graphics();
    live.addChild(g);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, []);
    let dn: [number, number] = [960, 560];
    return {
      update(lt, fi) {
        const rm = ctx.rm;
        const G = g.clear();
        const gave = tapped(ctx, 'dona');
        const k = seg(lt, 1.25, 2.3);
        let x = 1060;
        let y = 600;
        let bites = 0;
        if (gave) {
          // the donut goes left into Canelo's paw; Homiau's paw reaches after it (regret); a tear
          const e = rm ? sm(k) : outBack(k, 1.2);
          x = 1060 - e * 400;
          y = 600 - Math.sin(k * Math.PI) * 90;
          const reach = sm(seg(lt, 1.7, 2.4));
          paw(G, 1500 - reach * 260, 680, Math.PI, 1.5, 0xd8cfa0);
          paw(G, 380 + e * 80, 720, 0, 1.4, 0xc9b9a8);
          if (lt > 2.2) G.ellipse(1520, 360 + ((lt - 2.2) * 200) % 160, 14, 22).fill(0xffffff).stroke({ width: 3, color: MU.ink });
        } else {
          // he lifts it to his mouth (off the top) and chomps: bites, crumbs
          const up = sm(seg(lt, 1.25, 1.8)) * (1 - sm(seg(lt, 2.4, 2.9)));
          y = 640 - up * 300;
          bites = lt > 1.9 ? Math.min(3, Math.floor((lt - 1.9) * 5) + 1) : 0;
          paw(G, 1360, y + 90, Math.PI + 0.2, 1.5, 0xd8cfa0);
          for (let i = 0; i < 10 && lt > 1.9; i++) {
            const fk = ((lt - 1.9) * 1.4 + rnd(i) * 0.5) % 1;
            G.circle(x - 80 + rnd(i + 3) * 160, y + 80 + fk * 500, 8).fill(0xb09a80).stroke({ width: 2, color: MU.ink });
          }
        }
        bwDonut(G, x, y, 190, bites);
        dn = [x, y];
        t.update(lt);
        scr.update(fi);
      },
      anchor: (n) => (n === 'donut' ? dn : null),
      look: silentLook(ctx),
    };
  },
};

// ================================================================== THE HIPO-MART (an aisle in one-point perspective)
const VP: [number, number] = [960, 430];
function aisle(ctx: SceneCtx): Container {
  const c = new Container();
  const g = new Graphics();
  g.rect(-200, -200, 2320, 1480).fill(MU.w);
  // floor tiles converging, ceiling with tubes
  g.poly([-200, 1280, 2120, 1280, VP[0] + 120, VP[1] + 90, VP[0] - 120, VP[1] + 90]).fill(0xd2cbc1);
  for (let i = -8; i <= 8; i++) g.moveTo(VP[0] + i * 15, VP[1] + 90).lineTo(VP[0] + i * 260, 1280).stroke({ width: 2, color: MU.m, alpha: 0.6 });
  for (let r = 1; r < 9; r++) {
    const y = VP[1] + 90 + Math.pow(r / 9, 2) * 800;
    g.moveTo(-200, y).lineTo(2120, y).stroke({ width: 2, color: MU.m, alpha: 0.5 });
  }
  for (let i = 0; i < 4; i++) {
    const y = 60 + i * 70;
    const w = 380 - i * 80;
    g.roundRect(VP[0] - w / 2, y, w, 16, 8).fill(0xffffff).stroke({ width: 3, color: MU.ink });
  }
  // freezers on both sides (glass doors with shelves)
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const k0 = i / 4;
      const k1 = (i + 1) / 4;
      const xa = s < 0 ? 240 + (VP[0] - 140 - 240) * k0 : 1680 - (1680 - VP[0] - 140) * k0;
      const xb = s < 0 ? 240 + (VP[0] - 140 - 240) * k1 : 1680 - (1680 - VP[0] - 140) * k1;
      const ya0 = 160 + (VP[1] - 60 - 160) * k0;
      const yb0 = 160 + (VP[1] - 60 - 160) * k1;
      const ya1 = 1000 - (1000 - VP[1] - 90) * k0;
      const yb1 = 1000 - (1000 - VP[1] - 90) * k1;
      g.poly([xa, ya0, xb, yb0, xb, yb1, xa, ya1]).fill(i % 2 ? 0xe4ded4 : 0xd6d0c6).stroke({ width: 4, color: MU.ink });
      for (let j = 1; j < 4; j++) {
        const u = j / 4;
        g.moveTo(xa, ya0 + (ya1 - ya0) * u).lineTo(xb, yb0 + (yb1 - yb0) * u).stroke({ width: 2, color: MU.m });
      }
    }
  }
  // the back wall with the sign
  g.rect(VP[0] - 140, VP[1] - 60, 280, 150).fill(MU.l).stroke({ width: 4, color: MU.ink });
  c.addChild(g);
  return c;
}

// H1 · pasillo — Canelo searches the freezers; she floats behind him
export const h_pasillo: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna'],
  build(ctx): FilmSet {
    ctx.plane(aisle(ctx), { z: 1000, bake: 'static' });
    const live = new Container();
    const can = ctx.actor(ctx.canelo, 400);
    noScarf(can, ctx.canelo)(true);
    const luz = luzOf(ctx, 300);
    const glow = new Sprite(kitTex(ctx, 'glow'));
    glow.anchor.set(0.5);
    glow.blendMode = 'add';
    const door = new Graphics();
    live.addChild(door);
    if (luz.actor) live.addChild(luz.actor);
    live.addChild(glow);
    if (can) live.addChild(can);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, []);
    return {
      update(lt, fi) {
        const st = Math.floor(lt * 6);
        // he hops from door to door (on twos), opening each and looking in
        const x = 560 + Math.min(3, st % 4) * 40 + seg(lt, 0, 4) * 120;
        can?.pose(lt, x, 1000, { flip: st % 2 === 0 });
        const D = door.clear();
        const open = Math.abs(Math.sin(lt * 3));
        D.poly([x - 200, 300, x - 200 + 140 * (1 - open * 0.7), 320, x - 200 + 140 * (1 - open * 0.7), 900, x - 200, 920]).fill({ color: 0xffffff, alpha: 0.6 }).stroke({ width: 4, color: MU.ink });
        luz.actor?.pose(lt, 1180, 700 + bob(lt, ctx.rm, 10), { flip: true });
        if (luz.actor) {
          const [lx, ly] = lanternAt(luz);
          glow.position.set(lx, ly);
          glow.scale.set(0.9);
          glow.alpha = 0.6;
        }
        t.update(lt);
        scr.update(fi);
      },
      look: silentLook(ctx),
    };
  },
};

// H2 · congelador — he dives head first into a chest freezer; she laughs so hard the lantern gets away and rolls off
export const h_congelador: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna'],
  build(ctx): FilmSet {
    ctx.plane(aisle(ctx), { z: 1100, bake: 'static' });
    const live = new Container();
    const can = ctx.actor(ctx.canelo, 420);
    noScarf(can, ctx.canelo)(true);
    const luz = luzOf(ctx, 440);
    const hole = lanternHole(luz.actor);
    const lan = new Lantern(ctx, 0.9);
    const chest = new Graphics();
    chest.rect(460, 640, 520, 300).fill(0xe4ded4).stroke({ width: MLW, color: MU.ink });
    chest.rect(460, 620, 520, 40).fill(MU.l).stroke({ width: MLW, color: MU.ink });
    chest.rect(480, 700, 480, 12).fill({ color: MU.m, alpha: 0.5 });
    const lines = new Graphics();
    if (can) live.addChild(can);
    live.addChild(chest);
    if (luz.actor) live.addChild(luz.actor);
    live.addChild(lan, lines);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, []);
    const SLIP = 1.6;
    return {
      update(lt, fi) {
        const rm = ctx.rm;
        const st = Math.floor(lt * 12);
        // Canelo upside down in the freezer: only his hind legs and tail stick out, kicking
        can?.pose(lt, 720, 520, { rot: Math.PI + (rm ? 0 : Math.sin(st * 1.3) * 0.08) });
        // she doubles over laughing
        const shake = rm ? 0 : Math.sin(st * 1.9) * 0.07;
        luz.actor?.pose(lt, 1300, 760 + bob(lt, rm, 8), { rot: 0.4 + shake, flip: true });
        const L = lines.clear();
        if (lt < 3.2) for (let i = 0; i < 3; i++) L.moveTo(1180 + i * 60, 360 - (st % 2) * 8).lineTo(1160 + i * 70, 300 - (st % 2) * 8).stroke({ width: 7, color: MU.ink, cap: 'round' });
        // the lantern: in her hand → slips (1.6) → bounces twice → rolls away down the aisle (toward the front left)
        hole(lt >= SLIP);
        const [hx, hy] = luz.actor ? lanternAt(luz) : [1200, 700];
        if (lt < SLIP) {
          lan.position.set(hx, hy + 60);
          lan.rotation = 0;
        } else {
          const u = lt - SLIP;
          const b1 = Math.min(u, 0.5) / 0.5;
          let x = hx - u * 160;
          let y = hy + 60 + (960 - hy - 60) * b1 * b1;
          if (u > 0.5 && u < 0.85) y = 960 - Math.sin(((u - 0.5) / 0.35) * Math.PI) * (rm ? 30 : 90);
          if (u > 0.85 && u < 1.1) y = 960 - Math.sin(((u - 0.85) / 0.25) * Math.PI) * (rm ? 12 : 36);
          if (u >= 1.1) {
            y = 960;
            x = hx - 1.1 * 160 - (u - 1.1) * 360;
          }
          lan.position.set(x, y);
          lan.rotation = u >= 1.1 ? -(u - 1.1) * 6 : -u * 4;
        }
        lan.glow(0.6);
        t.update(lt);
        scr.update(fi);
      },
      look: silentLook(ctx),
    };
  },
};

// H3 · persecucion — the travelling: the lantern rolls, she chases it in fast motion. Tap: Canelo's foot stops it; no tap: a mop
export const h_persecucion: SetModule = {
  cats: ['luzterna'],
  build(ctx): FilmSet {
    // a long side view of the aisle (shelves in a row)
    const bgc = new Container();
    const g = new Graphics();
    g.rect(-400, -200, 3600, 1480).fill(MU.w);
    for (let i = 0; i < 14; i++) {
      const x = -300 + i * 240;
      g.rect(x, 200, 230, 620).fill(i % 2 ? 0xe4ded4 : 0xd6d0c6).stroke({ width: 4, color: MU.ink });
      for (let j = 1; j < 5; j++) g.rect(x, 200 + j * 124, 230, 8).fill(MU.m);
      for (let j = 0; j < 5; j++) for (let q = 0; q < 4; q++) if (rnd(i * 31 + j * 7 + q) > 0.3) g.rect(x + 16 + q * 52, 230 + j * 124, 40, 80).fill(rnd(i + j + q) > 0.5 ? MU.l : 0xa59e96).stroke({ width: 3, color: MU.ink });
    }
    g.rect(-400, 820, 3600, 460).fill(0xd2cbc1).stroke({ width: MLW, color: MU.ink });
    for (let x = -400; x < 3200; x += 120) g.moveTo(x, 820).lineTo(x - 60, 1280).stroke({ width: 2, color: MU.m, alpha: 0.5 });
    bgc.addChild(g);
    ctx.plane(bgc, { z: 1000, bake: 'static' });
    const live = new Container();
    const luz = luzOf(ctx, 420);
    const hole = lanternHole(luz.actor);
    hole(true);
    const lan = new Lantern(ctx, 1.3);
    const stop = new Graphics();
    const dust = new Graphics();
    if (luz.actor) live.addChild(luz.actor);
    live.addChild(lan, stop, dust);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, []);
    const STOP = 3.9;
    return {
      update(lt, fi) {
        const rm = ctx.rm;
        const foot = tapped(ctx, 'linterna');
        const x0 = rm ? 1550 : 2150;
        const k = Math.min(1, lt / STOP);
        const lx = x0 + (700 - x0) * k;
        const after = Math.max(0, lt - STOP);
        const bounce = after > 0 && after < 0.35 ? Math.sin((after / 0.35) * Math.PI) * 30 : 0;
        lan.position.set(lx + (after > 0 ? Math.sin(Math.min(1, after / 0.35) * Math.PI) * 30 : 0), 960 - bounce);
        lan.rotation = after > 0 ? -((x0 - 700) / 90) : -((x0 - lx) / 90);
        lan.glow(0.6);
        // she chases it, arms out, fast motion (on twos, jerky), and skids to a halt
        const st = Math.floor(lt * 12);
        const chase = Math.min(1, lt / (STOP + 0.7));
        const lzx = x0 + 380 + (900 - x0 - 380) * chase;
        luz.actor?.pose(lt, lzx, 760 + (rm ? 0 : Math.abs(Math.sin(st * 1.4)) * 26), { rot: -0.32 + (rm ? 0 : Math.sin(st) * 0.06), flip: false });
        // what stops it
        const S = stop.clear();
        const D = dust.clear();
        const inK = sm(seg(lt, STOP - 0.35, STOP));
        if (foot) {
          // Canelo's foot comes down from the left and stomps on it
          const fy = 600 + inK * 300;
          S.roundRect(470, fy - 300, 110, 320, 50).fill(0xc9b9a8).stroke({ width: MLW, color: MU.ink });
          S.ellipse(560, fy + 10, 120, 50).fill(0xc9b9a8).stroke({ width: MLW, color: MU.ink });
          if (after > 0 && after < 0.6) for (let i = 0; i < 6; i++) S.star(620 + Math.cos(i) * 90 * (1 + after), 900 + Math.sin(i) * 50, 5, 14, 6).fill(0xffffff).stroke({ width: 3, color: MU.ink });
        } else {
          // a mop slides in from the left and the lantern bumps into it
          const mx = 200 + inK * 340;
          S.moveTo(mx - 260, 300).lineTo(mx, 900).stroke({ width: 16, color: MU.d, cap: 'round' });
          for (let i = 0; i < 9; i++) S.moveTo(mx - 50 + i * 12, 880).lineTo(mx - 70 + i * 16 + Math.sin(lt * 8 + i) * 6, 990).stroke({ width: 10, color: MU.l, cap: 'round' });
        }
        // dust as she skids
        if (lt > STOP + 0.3 && lt < STOP + 1.4) {
          const u = seg(lt, STOP + 0.3, STOP + 1.4);
          for (let i = 0; i < 6; i++) D.circle(lzx + 120 + i * 30, 1000 - u * 40 - i * 6, 18 * (1 - u)).fill({ color: MU.l, alpha: 1 - u }).stroke({ width: 3, color: MU.ink, alpha: 1 - u });
        }
        t.update(lt);
        scr.update(fi);
      },
      look: silentLook(ctx),
    };
  },
};

// H4 · abraza — she picks it up and hugs it against her chest: «¡Uy! Casi.»
export const h_abraza: SetModule = {
  cats: ['luzterna'],
  build(ctx): FilmSet {
    ctx.plane(aisle(ctx), { z: 1400, bake: 'dof', blur: 8, dof: 900 });
    const live = new Container();
    const luz = luzOf(ctx, 700);
    const hole = lanternHole(luz.actor);
    hole(true);
    const lan = new Lantern(ctx, 1.4);
    if (luz.actor) live.addChild(luz.actor);
    live.addChild(lan);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, [{ t: 2.6, dur: 1.2, text: '¡Uy! Casi.', who: 'Luzterna' }]);
    return {
      update(lt, fi) {
        const hug = sm(seg(lt, 0.2, 0.9));
        luz.actor?.pose(lt, 960, 1150 + bob(lt, ctx.rm, 8), { sy: 1 + hug * 0.03 });
        const [cx, cy] = luz.actor ? [luz.actor.x - 40, luz.actor.y - 300] : [920, 850];
        lan.position.set(cx + (1 - hug) * 260, cy + 120 + (1 - hug) * 200);
        lan.rotation = -0.15 * hug;
        lan.glow(0.5 + hug * 0.4);
        t.update(lt);
        scr.update(fi);
      },
      look: silentLook(ctx),
    };
  },
};

// H5 · brujula — the lantern in her hands tilts by itself toward a tiny tear of static: «¿Y tú qué miras?»
export const h_brujula: SetModule = {
  build(ctx): FilmSet {
    ctx.plane(aisle(ctx), { z: 1500, bake: 'dof', blur: 10, dof: 700 });
    const tearC = new Container();
    const sl = new TilingSprite({ texture: kitTex(ctx, 'static'), width: 140, height: 260 });
    sl.position.set(1170, 290);
    const tm = new Graphics().poly([1240, 290, 1290, 370, 1232, 430, 1284, 510, 1240, 550, 1196, 470, 1250, 410, 1194, 340]).fill(0xffffff);
    const ring = new Graphics().poly([1240, 290, 1290, 370, 1232, 430, 1284, 510, 1240, 550, 1196, 470, 1250, 410, 1194, 340]).stroke({ width: 6, color: MU.ink });
    tearC.addChild(ring);
    sl.mask = tm;
    tearC.addChild(sl, tm);
    ctx.plane(tearC, { z: 1500 });
    const live = new Container();
    const lan = new Lantern(ctx, 2.6);
    const beam = new Beam(ctx, 0xffffff);
    const hands = new Graphics();
    live.addChild(beam, lan, hands);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, [{ t: 3.0, dur: 1.2, text: '¿Y tú qué miras?', who: 'Luzterna, a la linterna' }]);
    return {
      update(lt, fi) {
        const st = Math.floor(lt * 12);
        sl.tilePosition.set(rnd(st) * 100, rnd(st + 2) * 100);
        tearC.alpha = 0.6 + rnd(st + 5) * 0.4;
        const tilt = ctx.rm ? sm(seg(lt, 0.8, 2.2)) : outBack(seg(lt, 0.8, 1.8), 1.3);
        lan.position.set(880, 1000);
        lan.rotation = 0.35 * tilt;
        lan.glow(0.8);
        const lx = 880 + Math.sin(lan.rotation) * 160;
        const ly = 1000 - Math.cos(lan.rotation) * 160;
        beam.set([lx, ly], [1240, 420], 60, 0.6 * sm(seg(lt, 1.0, 1.8)));
        // her two pale paws around it
        const H = hands.clear();
        H.roundRect(560, 870, 260, 100, 50).fill(0xe8e4f0).stroke({ width: MLW, color: MU.ink });
        H.roundRect(940, 880, 260, 100, 50).fill(0xe8e4f0).stroke({ width: MLW, color: MU.ink });
        t.update(lt);
        scr.update(fi);
      },
      anchor: (n) => (n === 'tear' ? [1240, 420] : null),
      look: silentLook(ctx),
    };
  },
};
void [TV];
