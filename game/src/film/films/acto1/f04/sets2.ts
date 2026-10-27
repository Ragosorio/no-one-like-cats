/**
 * F04 — sets of the park, the bar and the epilogue (shot list in ./index.ts). The epilogue's last scene is in colour
 * (style 'tv'): the iris closes on the lantern and La Borracha's night floods back in from the edges.
 */
import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { Beam, TV, TvScreen, bob, kitTex, lanternAt, luzOf, outBack, rnd, seg, sm, word } from '../kit';
import { Intertitles, Lantern, MLW, MU, SilentScreen, paw, scarfOnFloor, silentLook, sun, tapped, type TitleSpec } from './mudo';
import { noScarf } from './sets1';

function overlays(ctx: SceneCtx, titles: TitleSpec[]) {
  const t = new Intertitles(ctx, titles);
  ctx.plane(t, { z: 0, screen: true });
  const scr = new SilentScreen(ctx);
  ctx.plane(scr, { z: 0, screen: true });
  return { t, scr };
}
const glowOf = (ctx: SceneCtx, tint = 0xffffff) => {
  const s = new Sprite(kitTex(ctx, 'glow'));
  s.anchor.set(0.5);
  s.blendMode = 'add';
  s.tint = tint;
  return s;
};

// ================================================================== THE PARK
function park(ctx: SceneCtx): Container {
  const c = new Container();
  const g = new Graphics();
  g.rect(-200, -200, 2320, 820).fill(MU.sky);
  g.rect(-200, 600, 2320, 700).fill(0xbdb6aa);
  for (let i = 0; i < 70; i++) {
    const x = -150 + rnd(i) * 2200;
    const y = 640 + rnd(i + 9) * 420;
    g.moveTo(x, y).lineTo(x - 8, y - 22).moveTo(x, y).lineTo(x + 6, y - 20).stroke({ width: 3, color: MU.m });
  }
  // the path
  g.poly([700, 1280, 1100, 1280, 1000, 620, 900, 620]).fill(0xd6cfc3);
  // the tree: trunk + a canopy of round clusters with hard shadow underneath
  g.rect(1360, 260, 90, 420).fill(MU.d).stroke({ width: MLW, color: MU.ink });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    g.circle(1405 + Math.cos(a) * 170, 210 + Math.sin(a) * 90, 110).fill(i % 2 ? 0x8a8279 : 0x9c948a).stroke({ width: MLW, color: MU.ink });
  }
  g.circle(1405, 200, 150).fill(0x9c948a);
  g.ellipse(1405, 690, 330, 40).fill({ color: MU.d, alpha: 0.45 });
  c.addChild(g);
  c.addChild(sun(ctx, 420, 160, 70));
  return c;
}
function bench(): Graphics {
  const g = new Graphics();
  for (let i = 0; i < 3; i++) g.roundRect(560, 700 + i * 34, 760, 24, 8).fill(0xa59e96).stroke({ width: 5, color: MU.ink });
  for (let i = 0; i < 2; i++) g.roundRect(560, 790 + i * 30, 760, 22, 8).fill(0xa59e96).stroke({ width: 5, color: MU.ink });
  for (const x of [600, 1250]) g.rect(x, 830, 26, 130).fill(MU.d).stroke({ width: 5, color: MU.ink });
  return g;
}

// Q1 · banca — Canelo sprawled on the bench, belly to the sun; she sits in the air beside him
export const q_banca: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna'],
  build(ctx): FilmSet {
    ctx.plane(park(ctx), { z: 1000, bake: 'static' });
    const live = new Container();
    const can = ctx.actor(ctx.canelo, 330);
    noScarf(can, ctx.canelo)(true);
    const luz = luzOf(ctx, 320);
    const lg = glowOf(ctx);
    live.addChild(bench());
    if (can) live.addChild(can);
    if (luz.actor) live.addChild(luz.actor);
    live.addChild(lg);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, []);
    return {
      update(lt, fi) {
        can?.pose(lt, 1080, 770, { rot: -1.5, sy: 1 + Math.sin(lt * 1.6) * 0.02 });
        luz.actor?.pose(lt, 1300, 620 + bob(lt, ctx.rm, 8), { flip: true });
        if (luz.actor) {
          const [x, y] = lanternAt(luz);
          lg.position.set(x, y);
          lg.scale.set(0.9);
          lg.alpha = 0.55;
        }
        t.update(lt);
        scr.update(fi);
      },
      look: silentLook(ctx),
    };
  },
};

// Q2 · dos — he looks at the sky: «Luz… ¿tú te acuerdas de cuando estabas viva?»
export const q_dos: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna'],
  build(ctx): FilmSet {
    ctx.plane(park(ctx), { z: 1300, bake: 'dof', blur: 6, dof: 1100 });
    const live = new Container();
    const can = ctx.actor(ctx.canelo, 520);
    noScarf(can, ctx.canelo)(true);
    const luz = luzOf(ctx, 500);
    const lg = glowOf(ctx);
    const b = bench();
    b.scale.set(1.5);
    b.position.set(-520, -240);
    live.addChild(b);
    if (can) live.addChild(can);
    if (luz.actor) live.addChild(luz.actor);
    live.addChild(lg);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, [{ t: 1.6, dur: 2.8, text: 'Luz… ¿tú te acuerdas de cuando estabas viva?', who: 'Canelo' }]);
    return {
      update(lt, fi) {
        can?.pose(lt, 980, 860, { rot: -1.45 });
        luz.actor?.pose(lt, 1340, 720 + bob(lt, ctx.rm, 8), { flip: true });
        if (luz.actor) {
          const [x, y] = lanternAt(luz);
          lg.position.set(x, y);
          lg.scale.set(1.1);
          lg.alpha = 0.55;
        }
        t.update(lt);
        scr.update(fi);
      },
      look: silentLook(ctx),
    };
  },
};

// Q3 · perfil — she thinks: «Del faro de mi papá. Del pan dulce. De que nadie me hacía caso.» · «…O sea, igual que ahora.»
export const q_perfil: SetModule = {
  cats: ['luzterna'],
  build(ctx): FilmSet {
    ctx.plane(park(ctx), { z: 1600, bake: 'dof', blur: 12, dof: 700 });
    const live = new Container();
    const luz = luzOf(ctx, 900);
    const lg = glowOf(ctx);
    const dots = new Graphics();
    if (luz.actor) live.addChild(luz.actor);
    live.addChild(lg, dots);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, [
      { t: 1.4, dur: 3.8, text: 'Del faro de mi papá. Del pan dulce. De que nadie me hacía caso.', who: 'Luzterna' },
      { t: 6.0, dur: 1.6, text: '…O sea, igual que ahora.', who: 'Luzterna' },
    ]);
    return {
      update(lt, fi) {
        const shrug = lt > 5.2 && lt < 6.0 ? Math.sin(seg(lt, 5.2, 6.0) * Math.PI) * 30 : 0;
        luz.actor?.pose(lt, 1000, 1320 + bob(lt, ctx.rm, 6) - shrug, { flip: false });
        if (luz.actor) {
          const [x, y] = lanternAt(luz);
          lg.position.set(x, y);
          lg.scale.set(1.6);
          lg.alpha = 0.5;
        }
        // thinking: three dots rise
        const D = dots.clear();
        if (lt < 1.4)
          for (let i = 0; i < 3; i++) {
            const k = sm(seg(lt, 0.2 + i * 0.3, 0.5 + i * 0.3));
            D.circle(700 - i * 60, 300 - i * 50, 16 * k).fill(0xffffff).stroke({ width: 4, color: MU.ink, alpha: k });
          }
        t.update(lt);
        scr.update(fi);
      },
      look: silentLook(ctx),
    };
  },
};

/** a squashed concha (sweet bread): a dome with its shell pattern; `left` 0..1 how much is left */
function concha(G: Graphics, x: number, y: number, left = 1) {
  if (left <= 0.05) return;
  G.ellipse(x, y, 96 * left, 62).fill(0xd8cfc4).stroke({ width: MLW, color: MU.ink });
  for (let i = -2; i <= 2; i++) if (Math.abs(i * 30) < 90 * left) G.moveTo(x + i * 30 * left, y - 50).quadraticCurveTo(x + i * 34 * left, y - 10, x + i * 30 * left, y + 30).stroke({ width: 4, color: MU.m });
  G.moveTo(x - 80 * left, y - 6).lineTo(x + 80 * left, y - 6).stroke({ width: 4, color: MU.m });
  if (left < 1) for (let b = 0; b < 2; b++) G.circle(x + 90 * left - b * 20, y - 30 + b * 40, 22).fill(0xa59e96);
}
// Q5 · pan — PAN (tap): the squashed sweet bread from behind his ear, she holds it and smells it · no tap: the crumbs
export const q_pan: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna'],
  build(ctx): FilmSet {
    ctx.plane(park(ctx), { z: 1600, bake: 'dof', blur: 12, dof: 700 });
    const live = new Container();
    const can = ctx.actor(ctx.canelo, 760);
    noScarf(can, ctx.canelo)(true);
    const luz = luzOf(ctx, 820);
    const lg = glowOf(ctx);
    const g = new Graphics();
    if (can) live.addChild(can);
    if (luz.actor) live.addChild(luz.actor);
    live.addChild(lg, g);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, [{ t: 4.2, dur: 1.6, text: 'Huele a cuando estaba viva.', who: 'Luzterna' }]);
    let bread: [number, number] = [1000, 520];
    return {
      update(lt, fi) {
        const rm = ctx.rm;
        const magic = tapped(ctx, 'pan');
        can?.pose(lt, 520, 1220);
        luz.actor?.pose(lt, 1440, 1260 + bob(lt, rm, 6), { flip: true });
        if (luz.actor) {
          const [x, y] = lanternAt(luz);
          lg.position.set(x, y);
          lg.scale.set(1.4);
          lg.alpha = 0.5;
        }
        const G = g.clear();
        const [hx, hy] = can ? [can.x + can.head()[0], can.y + can.head()[1]] : [520, 600];
        // the trick (from behind his ear) or the bite
        const pull = seg(lt, 1.4, 2.0);
        const give = sm(seg(lt, 2.2, 3.2));
        const hold = sm(seg(lt, 3.0, 3.6));
        let bx: number;
        let by: number;
        if (magic) {
          // behind the ear → in his paw → offered → in her paws, near her face
          const ex = hx + 120;
          const ey = hy - 160;
          bx = ex + (760 - ex) * sm(pull) + (1180 - 760) * give;
          by = ey + (620 - ey) * sm(pull) + (560 - 620) * give;
          if (lt > 1.3 && lt < 2.0) for (let i = 0; i < 6; i++) G.star(ex + Math.cos(i + lt * 4) * 90, ey + Math.sin(i + lt * 4) * 60, 4, 16, 7).fill(0xffffff).stroke({ width: 3, color: MU.ink });
          if (lt >= 1.3) concha(G, bx, by);
        } else {
          // he eats it (bites, crumbs) and offers her the crumbs in his paw
          bx = 800 + (1180 - 800) * give;
          by = 640 + (560 - 640) * give;
          const left = 1 - sm(seg(lt, 1.3, 2.1));
          concha(G, hx + 110, hy + 140, left);
          for (let i = 0; i < 9; i++) G.circle(bx - 40 + rnd(i) * 80, by - 10 + rnd(i + 4) * 30, 7).fill(0xd8cfc4).stroke({ width: 2, color: MU.ink });
        }
        // the paws: his (offering) and hers (holding, pale)
        if (give < 1) paw(G, bx - 70, by + 50, 0.1, 1.1, 0xc9b9a8);
        if (hold > 0) {
          paw(G, bx - 130, by + 70, -0.2, 0.9, 0xe8e4f0);
          paw(G, bx + 150, by + 70, Math.PI + 0.2, 0.9, 0xe8e4f0);
          // she smells it: wavy lines rising to her face
          for (let i = 0; i < 3; i++) {
            const ph = lt * 3 + i;
            G.moveTo(bx - 40 + i * 40, by - 70)
              .bezierCurveTo(bx - 70 + i * 40 + Math.sin(ph) * 20, by - 130, bx - 10 + i * 40, by - 170, bx - 40 + i * 40 + Math.sin(ph) * 16, by - 230)
              .stroke({ width: 5, color: MU.ink, alpha: 0.8 * hold, cap: 'round' });
          }
        }
        bread = [bx, by];
        t.update(lt);
        scr.update(fi);
      },
      anchor: (n) => (n === 'bread' ? bread : null),
      look: silentLook(ctx),
    };
  },
};

// ================================================================== LA ÚLTIMA RONDA, closed, by day
function barDay(ctx: SceneCtx, o: { chairs?: boolean } = {}): Container {
  const c = new Container();
  const g = new Graphics();
  g.rect(-200, -200, 2320, 1480).fill(0xcfc8be);
  for (let x = -200; x < 2200; x += 100) g.rect(x, -200, 40, 860).fill({ color: MU.l, alpha: 0.6 });
  // back shelves and bottles
  for (let r = 0; r < 3; r++) {
    g.rect(500, 140 + r * 130, 920, 16).fill(MU.d).stroke({ width: 4, color: MU.ink });
    for (let i = 0; i < 12; i++) {
      const x = 530 + i * 74;
      const h = 60 + rnd(i + r * 12) * 40;
      g.roundRect(x, 140 + r * 130 - h, 34, h, 10).fill(rnd(i * 3 + r) > 0.5 ? MU.m : MU.d).stroke({ width: 3, color: MU.ink });
    }
  }
  // the door (left) full of morning light, the window
  g.rect(250, 200, 200, 470).fill(0xffffff).stroke({ width: MLW, color: MU.ink });
  g.rect(1470, 160, 200, 240).fill(0xf6f2ea).stroke({ width: MLW, color: MU.ink });
  // the counter
  g.rect(200, 660, 1520, 60).fill(MU.l).stroke({ width: MLW, color: MU.ink });
  g.rect(200, 720, 1520, 340).fill(MU.m).stroke({ width: MLW, color: MU.ink });
  for (let x = 240; x < 1700; x += 200) g.rect(x, 750, 160, 280).stroke({ width: 3, color: MU.d });
  // the floor
  g.rect(-200, 1060, 2320, 300).fill(0xa59e96);
  if (o.chairs !== false) {
    // tables with the chairs upside down on them (foreground)
    for (const x of [420, 1500]) {
      g.ellipse(x, 960, 150, 30).fill(MU.l).stroke({ width: MLW, color: MU.ink });
      g.rect(x - 12, 960, 24, 160).fill(MU.d).stroke({ width: 4, color: MU.ink });
      for (const s of [-1, 1]) {
        g.rect(x + s * 50 - 40, 860, 80, 90).fill(0x8a8279).stroke({ width: 4, color: MU.ink });
        g.moveTo(x + s * 50 - 34, 860).lineTo(x + s * 50 - 40, 760).moveTo(x + s * 50 + 34, 860).lineTo(x + s * 50 + 40, 760).stroke({ width: 7, color: MU.ink });
      }
    }
  }
  c.addChild(g);
  return c;
}
/** the striped rag (it really does look like his scarf) */
function rag(g: Graphics, x: number, y: number, rot: number) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const P = (u: number, v: number) => [x + u * c - v * s, y + u * s + v * c];
  for (let i = 0; i < 5; i++) g.poly([...P(-120 + i * 48, -26), ...P(-72 + i * 48, -26), ...P(-72 + i * 48, 26), ...P(-120 + i * 48, 26)]).fill(i % 2 ? MU.m : MU.l);
  g.poly([...P(-120, -26), ...P(120, -26), ...P(120, 26), ...P(-120, 26)]).stroke({ width: MLW, color: MU.ink });
}

// B1 · cerrado — the bar closed, chairs on the tables; Espuma polishes the bar with a rag… striped
export const b_cerrado: SetModule = {
  cats: ['espuma_bartender_cat'],
  build(ctx): FilmSet {
    ctx.plane(barDay(ctx, { chairs: false }), { z: 1000, bake: 'static' });
    const live = new Container();
    const esp = ctx.actor('espuma_bartender_cat', 480);
    const g = new Graphics();
    const front = barDay(ctx);
    front.mask = new Graphics().rect(-200, 740, 2320, 600).fill(0xffffff);
    if (esp) live.addChild(esp);
    live.addChild(g);
    ctx.plane(live, { z: 1000 });
    const fr = new Container();
    fr.addChild(front, front.mask as Graphics);
    ctx.plane(fr, { z: 1000, bake: 'static' });
    const { t, scr } = overlays(ctx, []);
    return {
      update(lt, fi) {
        esp?.pose(lt, 1120, 820);
        rag(g.clear(), 1000 + Math.sin(lt * 4) * 90, 650, 0.05);
        t.update(lt);
        scr.update(fi);
      },
      look: silentLook(ctx),
    };
  },
};

// B2 · puerta — Canelo at the door, his jaw drops: «¡ESE ES MI…!»
export const b_puerta: SetModule = {
  cats: ({ canelo }) => [canelo],
  build(ctx): FilmSet {
    ctx.plane(barDay(ctx), { z: 1400, bake: 'dof', blur: 8, dof: 900 });
    const live = new Container();
    const door = new Graphics().rect(560, 0, 800, 1080).fill(0xffffff).stroke({ width: MLW * 2, color: MU.ink });
    const can = ctx.actor(ctx.canelo, 760);
    noScarf(can, ctx.canelo)(true);
    const g = new Graphics();
    live.addChild(door);
    if (can) live.addChild(can);
    live.addChild(g);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, [{ t: 1.6, dur: 1.4, text: '¡ESE ES MI…!', who: 'Canelo' }]);
    return {
      update(lt, fi) {
        const drop = ctx.rm ? sm(seg(lt, 0.4, 0.8)) : outBack(seg(lt, 0.4, 0.7), 2.4);
        can?.pose(lt, 960, 1180, { sy: 1 + drop * 0.07, sx: 1 - drop * 0.03 });
        const G = g.clear();
        if (can && drop > 0) {
          const [hx, hy] = can.head();
          // the jaw on the floor (rubber hose) and an «!»
          G.ellipse(can.x + hx, can.y + hy + 95 + drop * 40, 50, 30 + drop * 40).fill(MU.ink);
          G.rect(can.x + hx + 230, can.y + hy - 260, 30, 120).fill(MU.ink).circle(can.x + hx + 245, can.y + hy - 100, 18).fill(MU.ink);
        }
        t.update(lt);
        scr.update(fi);
      },
      look: silentLook(ctx),
    };
  },
};

// B3 · espuma — she doesn't look up: «Era un trapo.»
export const b_espuma: SetModule = {
  cats: ['espuma_bartender_cat'],
  build(ctx): FilmSet {
    ctx.plane(barDay(ctx, { chairs: false }), { z: 1400, bake: 'dof', blur: 8, dof: 900 });
    const live = new Container();
    const esp = ctx.actor('espuma_bartender_cat', 760);
    const counter = new Graphics().rect(0, 860, 1920, 60).fill(MU.l).stroke({ width: MLW, color: MU.ink }).rect(0, 920, 1920, 300).fill(MU.m);
    const g = new Graphics();
    if (esp) live.addChild(esp);
    live.addChild(counter, g);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, [{ t: 0.8, dur: 1.4, text: 'Era un trapo.', who: 'Doña Espuma' }]);
    return {
      update(lt, fi) {
        esp?.pose(lt, 960, 1080);
        rag(g.clear(), 960 + Math.sin(lt * 5) * 120, 850, 0.04);
        t.update(lt);
        scr.update(fi);
      },
      look: silentLook(ctx),
    };
  },
};

// B4 · bufanda — fixed, low: under Hipólito's stool, on the floor, THE SCARF. Nobody moves. Only the dust in the light.
export const b_bufanda: SetModule = {
  build(ctx): FilmSet {
    const c = new Container();
    const g = new Graphics();
    g.rect(-200, -200, 2320, 1480).fill(0x8a8279);
    // the floor boards in perspective (we're at floor level)
    g.rect(-200, 560, 2320, 760).fill(0xa59e96);
    for (let i = -10; i <= 10; i++) g.moveTo(960 + i * 40, 560).lineTo(960 + i * 300, 1280).stroke({ width: 3, color: MU.d, alpha: 0.6 });
    // the stool: four legs and a ring, the seat at the top edge
    g.rect(640, -40, 640, 70).fill(MU.d).stroke({ width: MLW, color: MU.ink });
    for (const [x0, x1] of [
      [700, 620],
      [1220, 1300],
      [820, 790],
      [1100, 1130],
    ] as const)
      g.poly([x0 - 14, 30, x0 + 14, 30, x1 + 16, x0 < 900 || x0 > 1200 ? 700 : 600, x1 - 16, x0 < 900 || x0 > 1200 ? 700 : 600]).fill(MU.d).stroke({ width: 5, color: MU.ink });
    g.ellipse(960, 380, 300, 40).stroke({ width: 12, color: MU.ink });
    // the shadow under the stool
    g.ellipse(960, 690, 420, 60).fill({ color: MU.ink, alpha: 0.35 });
    // THE SCARF, alone, in the middle (framed like SADIE's)
    scarfOnFloor(g, 960, 760, 1.1);
    c.addChild(g);
    ctx.plane(c, { z: 1000, bake: 'static' });
    // a slanted beam of morning light with dust floating slowly in it
    const beam = new Graphics().poly([1300, -100, 1560, -100, 1180, 1100, 860, 1100]).fill({ color: 0xffffff, alpha: 0.12 });
    const dust = new Graphics();
    const live = new Container();
    live.addChild(beam, dust);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, []);
    return {
      update(lt, fi) {
        const D = dust.clear();
        for (let i = 0; i < 24; i++) {
          const u = (rnd(i) + lt * 0.02 * (0.5 + rnd(i + 3))) % 1;
          const x = 1420 - u * 520 + Math.sin(lt * 0.5 + i) * 14;
          const y = -60 + u * 1150;
          D.circle(x, y, 2 + rnd(i + 7) * 3).fill({ color: 0xffffff, alpha: 0.6 });
        }
        t.update(lt);
        scr.update(fi);
      },
      look: silentLook(ctx),
    };
  },
};

// B5 · recoge — he picks it up and shakes it; Hipólito, asleep, snores: «¿Y luego?»
export const b_recoge: SetModule = {
  cats: ({ canelo }) => [canelo, 'hipolito_tavern_cat'],
  build(ctx): FilmSet {
    ctx.plane(barDay(ctx, { chairs: false }), { z: 1300, bake: 'dof', blur: 6, dof: 1000 });
    const live = new Container();
    const can = ctx.actor(ctx.canelo, 640);
    noScarf(can, ctx.canelo)(true);
    const hip = ctx.actor('hipolito_tavern_cat', 600);
    const stool = new Graphics().rect(1180, 940, 300, 50).fill(MU.d).stroke({ width: MLW, color: MU.ink });
    for (const x of [1200, 1440]) stool.rect(x, 990, 26, 200).fill(MU.d).stroke({ width: 4, color: MU.ink });
    const g = new Graphics();
    live.addChild(stool);
    if (hip) live.addChild(hip);
    if (can) live.addChild(can);
    live.addChild(g);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, [{ t: 1.8, dur: 1.1, text: '¿Y luego?', who: 'Hipólito, dormido' }]);
    return {
      update(lt, fi) {
        hip?.pose(lt, 1330, 960, { flip: true });
        if (hip?.puppet) hip.puppet.sleeping = true;
        can?.pose(lt, 760, 1150);
        const G = g.clear();
        // the scarf held up in his paws, shaken (a wave along it)
        const sh = ctx.rm ? 0 : Math.sin(lt * 14) * 18 * (1 - seg(lt, 0.4, 1.6));
        const x0 = 540;
        const y0 = 560;
        for (let i = 0; i < 10; i++) {
          const x = x0 + i * 44;
          const y = y0 + Math.sin(i * 0.8 + lt * 9) * sh + i * 6;
          G.rect(x, y - 24, 46, 48).fill(i % 3 === 0 ? MU.m : MU.l).stroke({ width: 4, color: MU.ink });
        }
        paw(G, x0 - 20, y0 + 10, -0.3, 0.9, 0xc9b9a8);
        paw(G, x0 + 460, y0 + 70, Math.PI + 0.3, 0.9, 0xc9b9a8);
        // the snore
        const zk = (lt * 0.8) % 1;
        G.circle(1450 + zk * 60, 520 - zk * 120, 18 + zk * 30).stroke({ width: 5, color: MU.ink, alpha: 1 - zk });
        t.update(lt);
        scr.update(fi);
      },
      look: silentLook(ctx),
    };
  },
};

// B6 · cuello — the scarf back on his neck; the iris closes on it
export const b_cuello: SetModule = {
  cats: ({ canelo }) => [canelo],
  build(ctx): FilmSet {
    ctx.plane(barDay(ctx, { chairs: false }), { z: 1500, bake: 'dof', blur: 10, dof: 800 });
    const live = new Container();
    const can = ctx.actor(ctx.canelo, 980);
    const off = noScarf(can, ctx.canelo);
    off(false);
    const g = new Graphics();
    if (can) live.addChild(can);
    live.addChild(g);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, []);
    let sc: [number, number] = [960, 600];
    return {
      update(lt, fi) {
        can?.pose(lt, 960, 1380, { sy: 1 + Math.sin(seg(lt, 0, 0.4) * Math.PI) * 0.04 });
        const G = g.clear();
        if (can) {
          const [hx, hy] = can.head();
          sc = [can.x + hx, can.y + hy + 220];
          // proud: a few sparkles round the scarf
          for (let i = 0; i < 5; i++) {
            const a = i * 1.25 + lt * 1.5;
            G.star(sc[0] + Math.cos(a) * 260, sc[1] + Math.sin(a) * 90, 4, 16, 7).fill(0xffffff).stroke({ width: 3, color: MU.ink });
          }
        }
        t.update(lt);
        scr.update(fi);
      },
      anchor: (n) => (n === 'scarf' ? sc : null),
      look: silentLook(ctx),
    };
  },
};

// ================================================================== THE ROOFTOP (epilogue)
function rooftop(ctx: SceneCtx, night = false): Container {
  const c = new Container();
  const g = new Graphics();
  const ink = night ? TV.line : MU.ink;
  g.rect(-200, -200, 2320, 900).fill(night ? TV.nightD : MU.sky);
  if (night) for (let i = 0; i < 40; i++) g.circle(-100 + rnd(i) * 2100, -150 + rnd(i + 3) * 700, 2 + rnd(i + 5) * 3).fill({ color: TV.cream, alpha: 0.85 });
  // the city beyond the parapet
  for (let i = 0; i < 10; i++) {
    const x = -100 + i * 220;
    const h = 120 + rnd(i + 21) * 200;
    g.rect(x, 640 - h, 200, h).fill(night ? (i % 2 ? TV.night : TV.nightL) : i % 2 ? MU.l : 0xa59e96).stroke({ width: 5, color: ink });
    for (let j = 0; j < 4; j++) if (rnd(i * 5 + j) > 0.45) g.rect(x + 24 + (j % 2) * 90, 640 - h + 26 + Math.floor(j / 2) * 60, 36, 30).fill(night ? TV.amberL : MU.d);
  }
  // the roof: the floor, a water tank, a chimney, the skylight
  g.rect(-200, 640, 2320, 640).fill(night ? 0x3a3f66 : 0xb4ada3);
  g.rect(200, 300, 220, 300).fill(night ? 0x4a4f78 : MU.l).stroke({ width: MLW, color: ink });
  g.ellipse(310, 300, 110, 30).fill(night ? 0x5a6090 : MU.w).stroke({ width: MLW, color: ink });
  for (const x of [220, 400]) g.rect(x, 600, 16, 80).fill(ink);
  g.rect(1480, 420, 110, 240).fill(night ? TV.brick : MU.m).stroke({ width: MLW, color: ink });
  // the parapet / railing in front of the city
  g.rect(-200, 620, 2320, 30).fill(night ? 0x5a6090 : MU.m).stroke({ width: 5, color: ink });
  for (let x = -200; x < 2200; x += 90) g.rect(x, 560, 12, 70).fill(ink);
  g.rect(-200, 552, 2320, 14).fill(ink);
  c.addChild(g);
  if (!night) c.addChild(sun(ctx, 1640, 130, 60));
  return c;
}
/** the skylight: glass panes in the roof; under them, the bathroom door with a crack of static (live) */
class Skylight extends Container {
  private st: TilingSprite;
  constructor(ctx: SceneCtx, night = false) {
    super();
    const ink = night ? TV.line : MU.ink;
    const g = new Graphics();
    g.poly([700, 860, 1220, 860, 1300, 1000, 620, 1000]).fill(night ? 0x22305e : 0x8a8279).stroke({ width: MLW, color: ink });
    // the door below, seen through the glass
    g.rect(880, 880, 160, 110).fill(night ? TV.pink : MU.l).stroke({ width: 4, color: ink });
    this.addChild(g);
    this.st = new TilingSprite({ texture: kitTex(ctx, 'static'), width: 20, height: 110 });
    this.st.position.set(950, 880);
    this.addChild(this.st);
    const glass = new Graphics();
    glass.moveTo(960, 860).lineTo(960, 1000).stroke({ width: 5, color: ink });
    glass.poly([700, 860, 1220, 860, 1300, 1000, 620, 1000]).fill({ color: 0xffffff, alpha: night ? 0.08 : 0.18 });
    this.addChild(glass);
  }
  update(lt: number) {
    const s = Math.floor(lt * 12);
    this.st.tilePosition.set(rnd(s) * 100, rnd(s + 1) * 100);
    this.st.alpha = 0.5 + rnd(s + 3) * 0.5;
  }
}

// E1 · azotea — Canelo asleep with his scarf crooked; she straightens it with the beam of her lantern (no words: R7)
export const e_azotea: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna'],
  build(ctx): FilmSet {
    ctx.plane(rooftop(ctx), { z: 1000, bake: 'static' });
    const live = new Container();
    const can = ctx.actor(ctx.canelo, 420);
    const luz = luzOf(ctx, 420);
    const beam = new Beam(ctx, 0xffffff);
    const end = new Graphics();
    const lg = glowOf(ctx);
    if (can) live.addChild(can);
    live.addChild(end);
    if (luz.actor) live.addChild(luz.actor);
    live.addChild(beam, lg);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, []);
    return {
      update(lt, fi) {
        const rm = ctx.rm;
        can?.pose(lt, 1150, 830, { rot: -1.45, sy: 1 + Math.sin(lt * 1.4) * 0.02 });
        if (can?.puppet) can.puppet.sleeping = true;
        luz.actor?.pose(lt, 1380, 560 + bob(lt, rm, 10), { flip: true });
        const [lx, ly] = luz.actor ? lanternAt(luz) : [1300, 600];
        lg.position.set(lx, ly);
        lg.scale.set(1.1);
        lg.alpha = 0.6;
        // the scarf's loose end (over the painted one): crooked → straightened under the beam (1.6–3.2)
        const fix = rm ? sm(seg(lt, 1.6, 3.2)) : outBack(seg(lt, 1.6, 3.0), 1.4);
        const E = end.clear();
        if (can) {
          const [hx, hy] = can.head();
          const c = Math.cos(can.rotation);
          const s = Math.sin(can.rotation);
          const nx = can.x + (hx + 30) * c - (hy + 150) * s;
          const ny = can.y + (hx + 30) * s + (hy + 150) * c;
          const rot = 1.1 * (1 - fix) - 0.2;
          const C2 = Math.cos(rot);
          const S2 = Math.sin(rot);
          for (let i = 0; i < 4; i++) {
            const u = i * 34;
            E.rect(nx + u * C2 - 22 * S2 - 6, ny + u * S2 + 22 * C2 - 6, 40, 40).fill(i % 2 ? MU.m : MU.l).stroke({ width: 4, color: MU.ink });
          }
          beam.set([lx, ly], [nx, ny], 70, 0.55 * sm(seg(lt, 1.2, 1.6)) * (1 - sm(seg(lt, 3.4, 4.0))));
        }
        t.update(lt);
        scr.update(fi);
      },
      look: silentLook(ctx),
    };
  },
};

// E2 · ella — she sits in the air beside him and looks at the bar from afar: «(Ella no duerme. Nunca duerme.)»
export const e_ella: SetModule = {
  cats: ['luzterna'],
  build(ctx): FilmSet {
    ctx.plane(rooftop(ctx), { z: 1400, bake: 'dof', blur: 8, dof: 900 });
    const live = new Container();
    const luz = luzOf(ctx, 640);
    const lg = glowOf(ctx);
    if (luz.actor) live.addChild(luz.actor);
    live.addChild(lg);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, [{ t: 2.6, dur: 1.9, text: '(Ella no duerme. Nunca duerme.)' }]);
    return {
      update(lt, fi) {
        luz.actor?.pose(lt, 1150, 1000 + bob(lt, ctx.rm, 6), { flip: false });
        if (luz.actor) {
          const [x, y] = lanternAt(luz);
          lg.position.set(x, y);
          lg.scale.set(1.3);
          lg.alpha = 0.5;
        }
        t.update(lt);
        scr.update(fi);
      },
      look: silentLook(ctx),
    };
  },
};

// E3 · linterna — the lantern on the railing tilts by itself toward the skylight: below, the bathroom's crack of static
export const e_linterna: SetModule = {
  cats: ({ canelo }) => [canelo],
  build(ctx): FilmSet {
    ctx.plane(rooftop(ctx), { z: 1000, bake: 'static' });
    const live = new Container();
    const sky = new Skylight(ctx);
    const can = ctx.actor(ctx.canelo, 300);
    const lan = new Lantern(ctx, 0.9);
    const beam = new Beam(ctx, 0xffffff);
    live.addChild(sky);
    if (can) live.addChild(can);
    live.addChild(beam, lan);
    ctx.plane(live, { z: 1000 });
    const { t, scr } = overlays(ctx, []);
    return {
      update(lt, fi) {
        sky.update(lt);
        can?.pose(lt, 800, 830, { rot: -1.45 });
        if (can?.puppet) can.puppet.sleeping = true;
        const tilt = ctx.rm ? sm(seg(lt, 1.4, 2.8)) : outBack(seg(lt, 1.4, 2.4), 1.3);
        lan.position.set(1230, 560);
        lan.rotation = -0.55 * tilt;
        lan.glow(0.7);
        const lx = 1230 + Math.sin(lan.rotation) * 60;
        const ly = 560 - Math.cos(lan.rotation) * 60;
        beam.set([lx, ly], [960, 930], 60, 0.5 * sm(seg(lt, 1.8, 2.6)));
        t.update(lt);
        scr.update(fi);
      },
      anchor: (n) => (n === 'lantern' ? [1230, 500] : null),
      look: silentLook(ctx),
    };
  },
};

// E4 · color — La Borracha at night again, in colour (it floods in as the iris closes) · FIN DEL PRIMER ROLLO
export const e_color: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna'],
  build(ctx): FilmSet {
    ctx.plane(rooftop(ctx, true), { z: 1000, bake: 'static' });
    const live = new Container();
    const sky = new Skylight(ctx, true);
    const can = ctx.actor(ctx.canelo, 300);
    const luz = luzOf(ctx, 360);
    const lan = new Lantern(ctx, 0.9);
    const neon = glowOf(ctx, TV.neonPink);
    neon.position.set(960, 700);
    neon.scale.set(5, 1.6);
    const lg = glowOf(ctx, TV.lantern);
    live.addChild(neon, sky);
    if (can) live.addChild(can);
    if (luz.actor) live.addChild(luz.actor);
    live.addChild(lan, lg);
    ctx.plane(live, { z: 1000 });
    // FIN DEL PRIMER ROLLO: a small art-déco plate (cream and TV pink), not a full card
    const fin = new Container();
    const pg = new Graphics();
    pg.roundRect(-380, -90, 760, 180, 12).fill({ color: TV.line, alpha: 0.92 }).stroke({ width: 5, color: TV.cream });
    pg.roundRect(-364, -74, 728, 148, 8).stroke({ width: 2, color: TV.pink });
    const ft = word(ctx.k, 'FIN DEL PRIMER ROLLO', { fontFamily: 'Playfair Display', fontWeight: '700', fontSize: 58, fill: TV.cream, letterSpacing: 4 });
    fin.addChild(pg, ft);
    fin.position.set(960, 160);
    const ui = new Container();
    ui.addChild(fin);
    ctx.plane(ui, { z: 0, screen: true });
    const tv = new TvScreen(ctx);
    ctx.plane(tv, { z: 0, screen: true });
    return {
      update(lt, fi) {
        sky.update(lt);
        can?.pose(lt, 800, 830, { rot: -1.45 });
        if (can?.puppet) can.puppet.sleeping = true;
        luz.actor?.pose(lt, 760, 520 + bob(lt, ctx.rm, 10), { flip: true });
        lan.position.set(1230, 560);
        lan.rotation = -0.55;
        lan.glow(0.9);
        lg.position.set(1230 + Math.sin(-0.55) * 62, 560 - Math.cos(-0.55) * 62);
        lg.scale.set(1.6);
        lg.alpha = 0.8;
        neon.alpha = 0.35 + (Math.floor(lt * 3) % 5 === 0 ? 0 : 0.15);
        const k = sm(seg(lt, 1.8, 2.3));
        fin.visible = k > 0;
        fin.alpha = k * (1 - sm(seg(lt, 4.2, 4.6)));
        fin.scale.set(ctx.rm ? 1 : 0.9 + 0.1 * outBack(seg(lt, 1.8, 2.2)));
        tv.update(fi);
      },
    };
  },
};
