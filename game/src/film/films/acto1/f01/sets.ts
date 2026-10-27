/**
 * F01 «Oficial Dona» — the sets (see ./index.ts for the shot list). All drawn in La Borracha's TV cartoon (tv.ts).
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import type { RuleDemo } from '../../../../battle/demo';
import { Beam, Bitacora, TV, TvScreen, balloon, bob, box, clamp01, disc, donut, env, kitTex, lanternAt, luzOf, outBack, popIn, rnd, seg, sm, word, flame, tailTip, contact } from '../kit';

const DONA = 'dona_police_cat';
const YEL = 0xffd23a;
const RED = 0xff3b3b;
const BLU = 0x3b8bff;
const SHADOW = 0x6a1a10;

/** 70s titles: chunky yellow with a hard drop shadow (two sprites) */
function title70(ctx: SceneCtx, text: string, size: number, color = YEL): Container {
  const c = new Container();
  const st = { fontFamily: 'Anton', fontSize: size, letterSpacing: size * 0.06 };
  const sh = word(ctx.k, text, { ...st, fill: SHADOW });
  sh.position.set(size * 0.07, size * 0.07);
  const fg = word(ctx.k, text, { ...st, fill: color, stroke: { color: 0x2a0d06, width: size * 0.05, join: 'round' } });
  c.addChild(sh, fg);
  return c;
}
/** a stamp-in with a 70s zoom: big → set, a little wobble */
function slam(c: Container, lt: number, a: number, b: number, rm: boolean, base = 1) {
  const on = lt >= a && lt < b;
  c.visible = on;
  if (!on) return;
  const p = seg(lt, a, a + 0.22);
  const q = seg(lt, b - 0.2, b);
  c.alpha = rm ? Math.min(sm(p * 2), 1 - q) : 1 - q;
  c.scale.set(base * (rm ? 1 : 1 + (1 - outBack(p, 2.4)) * 1.4));
}

// ------------------------------------------------------------------ the Donería street (drawn once)
function doneria(ctx: SceneCtx, o: { lit?: boolean } = {}): { root: Container; neon: Sprite[]; signTx: Container } {
  const root = new Container();
  const g = new Graphics();
  // night sky bands
  g.rect(-400, -300, 2720, 420).fill(0x141a44).rect(-400, 120, 2720, 200).fill(0x1b2456);
  for (let i = 0; i < 40; i++) g.circle(-300 + rnd(i) * 2500, -200 + rnd(i + 7) * 380, 2 + rnd(i + 3) * 3).fill({ color: TV.cream, alpha: 0.8 });
  // far buildings
  for (let i = 0; i < 14; i++) {
    const w = 120 + rnd(i + 30) * 130;
    const h = 220 + rnd(i + 40) * 260;
    const x = -380 + i * 190;
    g.rect(x, 760 - h, w, h).fill(i % 2 ? 0x222b63 : 0x1c2458).stroke({ width: 5, color: TV.line });
    for (let j = 0; j < 6; j++) if (rnd(i * 9 + j) > 0.55) g.rect(x + 18 + (j % 3) * 34, 760 - h + 30 + Math.floor(j / 3) * 56, 18, 26).fill(TV.amberL);
  }
  // THE DONERÍA (left): pink facade, striped awning, warm window with trays of donuts, the door
  box(g, 260, 330, 760, 440, 0xf3a6c4, { shadow: TV.pinkD, r: 10 });
  g.rect(260, 330, 760, 60).fill(TV.pinkD).stroke({ width: 6, color: TV.line });
  for (let i = 0; i < 10; i++) g.poly([260 + i * 76, 470, 336 + i * 76, 470, 326 + i * 76, 540, 270 + i * 76, 540]).fill(i % 2 ? TV.cream : TV.pink).stroke({ width: 5, color: TV.line, join: 'round' });
  box(g, 300, 560, 470, 190, TV.amberL, { r: 6 });
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) donut(g, 345 + i * 75, 615 + r * 72, 26, i + r * 6);
  box(g, 820, 560, 160, 210, TV.greenD, { r: 6 });
  disc(g, 950, 670, 10, TV.amberL);
  // the giant donut on the roof (the neon glow is live)
  g.ellipse(640, 220, 170, 110).fill(0xf0b45e).stroke({ width: 7, color: TV.line });
  g.ellipse(640, 212, 150, 92).fill(TV.pink);
  g.ellipse(640, 216, 58, 34).fill(0x141a44).stroke({ width: 6, color: TV.line });
  for (let i = 0; i < 16; i++) {
    const a = i * 0.39;
    const rr = 92 + (i % 3) * 14;
    g.roundRect(640 + Math.cos(a) * rr - 10, 212 + Math.sin(a) * rr * 0.6 - 3, 20, 7, 3).fill([TV.cream, TV.neonBlue, TV.green, TV.amber][i % 4]);
  }
  g.rect(626, 320, 28, 20).fill(TV.line);
  // the sidewalk, the curb, the wet street
  g.rect(-400, 760, 2720, 70).fill(0x4a4f78).stroke({ width: 6, color: TV.line });
  g.rect(-400, 830, 2720, 420).fill(0x252b52);
  for (let i = 0; i < 9; i++) g.roundRect(-200 + i * 300, 960 + (i % 2) * 40, 160, 12, 6).fill({ color: TV.cream, alpha: 0.35 });
  // puddles that mirror the neon (pink smears)
  for (const [x, y, w] of [
    [560, 900, 260],
    [1180, 990, 300],
    [300, 1030, 200],
  ] as const) {
    g.ellipse(x, y, w, 26).fill({ color: 0x3a4478, alpha: 0.9 });
    g.rect(x - 30, y - 14, 60, 28).fill({ color: TV.neonPink, alpha: 0.35 });
  }
  // the lamp post (right)
  g.rect(1580, 300, 22, 470).fill(0x3a3f66).stroke({ width: 5, color: TV.line });
  g.roundRect(1530, 280, 120, 40, 14).fill(0x3a3f66).stroke({ width: 5, color: TV.line });
  root.addChild(g);
  const neon: Sprite[] = [];
  for (const [x, y, s, col] of [
    [640, 216, 2.4, TV.neonPink],
    [1590, 330, 1.4, TV.amberL],
  ] as const) {
    const n = new Sprite(kitTex(ctx, 'glow'));
    n.anchor.set(0.5);
    n.position.set(x, y);
    n.scale.set(s);
    n.tint = col;
    n.blendMode = 'add';
    n.alpha = o.lit === false ? 0 : 0.55;
    neon.push(n);
    root.addChild(n);
  }
  const signTx = new Container();
  root.addChild(signTx);
  return { root, neon, signTx };
}

/** the 70s patrol car with a tower of donuts on the roof; `turret` = the two lights (live) */
class Patrol extends Container {
  readonly red: Sprite;
  readonly blue: Sprite;
  private lamps = new Graphics();
  constructor(ctx: SceneCtx) {
    super();
    const g = new Graphics();
    // body
    g.roundRect(-250, -150, 500, 130, 40).fill(0xf6f2e8).stroke({ width: 7, color: TV.line });
    g.roundRect(-150, -250, 300, 120, 40).fill(0xf6f2e8).stroke({ width: 7, color: TV.line });
    g.roundRect(-130, -232, 120, 90, 18).fill(0x8fd0ff).stroke({ width: 5, color: TV.line });
    g.roundRect(10, -232, 120, 90, 18).fill(0x8fd0ff).stroke({ width: 5, color: TV.line });
    g.rect(-120, -150, 240, 128).fill(0x1d1d33).stroke({ width: 6, color: TV.line });
    const star = word(ctx.k, 'POLICÍA', { fontFamily: 'Anton', fontSize: 34, fill: 0xf6f2e8, letterSpacing: 4 });
    star.position.set(0, -88);
    // wheels
    for (const x of [-160, 160]) {
      g.circle(x, -16, 50).fill(0x1d1d33).stroke({ width: 6, color: TV.line });
      g.circle(x, -16, 20).fill(0xc9d3e6);
    }
    // the turret bar and the tower of donuts (four, a little crooked)
    g.roundRect(-90, -282, 180, 34, 10).fill(0x2a2a40).stroke({ width: 5, color: TV.line });
    for (let i = 0; i < 4; i++) donut(g, -4 + (i % 2 ? 6 : -4), -310 - i * 34, 44, i + 3);
    this.addChild(g, star, this.lamps);
    this.red = new Sprite(kitTex(ctx, 'glow'));
    this.blue = new Sprite(kitTex(ctx, 'glow'));
    for (const [s, x, col] of [
      [this.red, -50, RED],
      [this.blue, 50, BLU],
    ] as const) {
      s.anchor.set(0.5);
      s.position.set(x, -265);
      s.tint = col;
      s.blendMode = 'add';
      s.scale.set(1.6);
      this.addChild(s);
    }
  }
  /** phase: 0 = red on, 1 = blue on (smooth-ish); k = 0 lights out */
  turret(phase: number, k: number) {
    const r = k * (0.5 + 0.5 * Math.cos(phase * Math.PI));
    const b = k * (0.5 - 0.5 * Math.cos(phase * Math.PI));
    this.red.alpha = r;
    this.blue.alpha = b;
    const l = this.lamps.clear();
    l.roundRect(-82, -278, 66, 26, 8).fill(r > 0.3 ? 0xff7a7a : 0x6a2020);
    l.roundRect(16, -278, 66, 26, 8).fill(b > 0.3 ? 0x8ab8ff : 0x203a6a);
  }
}
/** the turret's alternation (2 Hz; «Reducir destellos»: slower and softer) */
const turretPhase = (lt: number, rf: boolean) => {
  const f = rf ? 0.8 : 2;
  const x = (lt * f) % 2;
  return x < 1 ? sm(x * 1.6) : 1 - sm((x - 1) * 1.6);
};

// ------------------------------------------------------------------ 1 · calle (0–3)
export const calle: SetModule = {
  build(ctx): FilmSet {
    const st = doneria(ctx);
    const street = new Container();
    street.addChild(st.root);
    const live = new Container();
    const car = new Patrol(ctx);
    car.position.set(1240, 930);
    live.addChild(car);
    const rain = ctx.weather('rain');
    if (rain?.ground) live.addChild(rain.ground);
    ctx.plane(street, { z: 1000, bake: 'static', res: 2 });
    ctx.plane(live, { z: 1000 });
    // the turret tints the whole frame (a soft overlay)
    const tint = new Graphics().rect(-200, -200, 2320, 1480).fill(0xffffff);
    tint.blendMode = 'add';
    ctx.plane(tint, { z: 0, screen: true });
    const ttl = title70(ctx, 'LA DONERÍA · MEDIANOCHE', 96);
    ttl.position.set(960, 170);
    const ui = new Container();
    ui.addChild(ttl);
    ctx.plane(ui, { z: 0, screen: true });
    const tv = new TvScreen(ctx);
    ctx.plane(tv, { z: 0, screen: true });
    return {
      update(lt, f) {
        const ph = turretPhase(lt, ctx.rf);
        car.turret(ph, 1);
        tint.tint = ph < 0.5 ? RED : BLU;
        tint.alpha = (ctx.rf ? 0.025 : 0.05) * Math.abs(ph - 0.5) * 2;
        slam(ttl, lt, 0.35, 2.5, ctx.rm);
        tv.update(f);
      },
    };
  },
};

// ------------------------------------------------------------------ 2 · partida (3–7): split screen in three
export const partida: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna'],
  build(ctx): FilmSet {
    const root = new Container();
    // three panels across the 4:3 picture (x 240..1680), each its own little world, each with a turret colour
    const PW = 480;
    const panels: { c: Container; m: Graphics; x: number; tint: Graphics; t0: number }[] = [];
    for (let i = 0; i < 3; i++) {
      const c = new Container();
      const m = new Graphics().rect(240 + i * PW + 6, 0, PW - 12, 1080).fill(0xffffff);
      c.mask = m;
      const tint = new Graphics().rect(240 + i * PW, 0, PW, 1080).fill(0xffffff);
      tint.blendMode = 'add';
      root.addChild(c, m);
      panels.push({ c, m, x: 240 + i * PW, tint, t0: i * 0.33 });
    }
    // panel 1: the puddle and the footprints with blurry edges (they walk across it)
    const p1 = new Graphics();
    p1.rect(240, 0, PW, 1080).fill(0x252b52);
    p1.ellipse(480, 640, 230, 120).fill(0x3a4478).stroke({ width: 6, color: TV.line });
    p1.ellipse(470, 610, 90, 30).fill({ color: TV.neonPink, alpha: 0.3 });
    const prints = new Container();
    const printsList: Graphics[] = [];
    for (let i = 0; i < 7; i++) {
      const pg = new Graphics();
      const x = 300 + i * 62;
      const y = 700 - (i % 2) * 70 - i * 18;
      // a pad + toes, with a halo (the blurry edge: Cerito's prints are «drawn wrong»)
      for (let r = 3; r >= 0; r--) {
        const a = r === 0 ? 1 : 0.18;
        pg.ellipse(x, y, 26 + r * 7, 20 + r * 6).fill({ color: 0xe6f0ff, alpha: a });
        for (const [dx, dy] of [
          [-18, -22],
          [-6, -30],
          [8, -30],
          [20, -22],
        ])
          pg.circle(x + dx * 1.3, y + dy * 1.3, 8 + r * 3).fill({ color: 0xe6f0ff, alpha: a });
      }
      prints.addChild(pg);
      printsList.push(pg);
    }
    panels[0].c.addChild(p1, prints, panels[0].tint);
    // panel 2: the patrol car (the footprints cross in front of it)
    const p2 = new Graphics().rect(720, 0, PW, 1080).fill(0x1b2456).rect(720, 820, PW, 260).fill(0x252b52);
    const car = new Patrol(ctx);
    car.position.set(960, 860);
    car.scale.set(0.8);
    const prints2 = new Graphics();
    for (let i = 0; i < 5; i++) {
      const x = 760 + i * 90;
      const y = 950 - (i % 2) * 30;
      prints2.ellipse(x, y, 22, 14).fill({ color: 0xc9d6ff, alpha: 0.75 });
      for (const dx of [-14, -4, 6, 16]) prints2.circle(x + dx, y - 20, 6).fill({ color: 0xc9d6ff, alpha: 0.75 });
    }
    const p2mask = new Graphics();
    prints2.mask = p2mask;
    panels[1].c.addChild(p2, car, prints2, p2mask, panels[1].tint);
    // panel 3: the corner — Canelo and Luzterna peeking (her lantern glows)
    const p3 = new Graphics().rect(1200, 0, PW, 1080).fill(0x1c2458);
    box(p3, 1180, 120, 300, 960, 0x3a3f66, { r: 0 });
    for (let j = 0; j < 8; j++) p3.rect(1196, 160 + j * 110, 260, 8).fill({ color: TV.line, alpha: 0.5 });
    const can = ctx.actor(ctx.canelo, 420);
    const luz = luzOf(ctx, 400);
    const glow = new Sprite(kitTex(ctx, 'glow'));
    glow.anchor.set(0.5);
    glow.tint = TV.lantern;
    glow.blendMode = 'add';
    const corner = new Container();
    if (luz.actor) corner.addChild(luz.actor);
    if (can) corner.addChild(can);
    corner.addChild(glow);
    panels[2].c.addChild(p3, corner, panels[2].tint);
    ctx.plane(root, { z: 1000 });
    const tv = new TvScreen(ctx);
    ctx.plane(tv, { z: 0, screen: true });
    // panel frames: thick black gutters
    const gut = new Graphics();
    for (let i = 0; i <= 3; i++) gut.rect(240 + i * PW - 7, 0, 14, 1080).fill(0x000000);
    ctx.plane(gut, { z: 0, screen: true });
    return {
      update(lt, f) {
        const ph = turretPhase(lt, ctx.rf);
        panels.forEach((p, i) => {
          // each panel slams in on a bass hit (wipes down), then its own turret colour
          const k = ctx.rm ? sm(seg(lt, p.t0, p.t0 + 0.3)) : outBack(seg(lt, p.t0, p.t0 + 0.28), 1.2);
          p.m.clear().rect(p.x + 6, 0, PW - 12, 1080 * Math.min(1, k)).fill(0xffffff);
          const on = i % 2 === 0 ? ph < 0.5 : ph >= 0.5;
          p.tint.tint = i === 1 ? (ph < 0.5 ? RED : BLU) : on ? RED : BLU;
          p.tint.alpha = (ctx.rf ? 0.04 : 0.09) * Math.abs(ph - 0.5) * 2;
        });
        // the prints walk across the puddle one by one
        printsList.forEach((pg, i) => (pg.alpha = sm(seg(lt, 0.3 + i * 0.32, 0.5 + i * 0.32)) * (1 - seg(lt, 3.3 + i * 0.05, 3.8))));
        p2mask.clear().rect(720, 800, (PW * Math.min(1, Math.max(0, lt - 1.4))) / 1.6, 260).fill(0xffffff);
        car.turret(ph, 1);
        const b = bob(lt, ctx.rm, 10);
        luz.actor?.pose(lt, 1400, 760 + b, { flip: true });
        can?.pose(lt, 1530, 1000, { flip: true });
        if (luz.actor) {
          const [lx, ly] = lanternAt(luz);
          glow.position.set(lx, ly);
          glow.scale.set(1.2 + Math.sin(lt * 3) * 0.05);
          glow.alpha = 0.6;
        }
        tv.update(f);
      },
    };
  },
};

// ------------------------------------------------------------------ 3 · canelo (7–10): «Me buscan a mí.»
export const canelo: SetModule = {
  cats: ({ canelo }) => [canelo],
  build(ctx): FilmSet {
    const bg = new Graphics();
    bg.rect(0, -200, 1920, 1480).fill(0x2f3a7a);
    // the wall with the WANTED poster behind him
    for (let y = 0; y < 1080; y += 70) for (let x = (y / 70) % 2 ? 0 : 60; x < 1920; x += 120) bg.roundRect(x, y, 112, 62, 6).fill(0x3a4690).stroke({ width: 3, color: 0x232c62 });
    box(bg, 1050, 120, 420, 560, 0xf4ead0, { shadow: 0x232c62, r: 6 });
    const wanted = new Container();
    const w1 = word(ctx.k, 'SE BUSCA', { fontFamily: 'Anton', fontSize: 74, fill: 0x8a2a1a, letterSpacing: 6 });
    w1.position.set(1260, 190);
    const face = new Graphics();
    face.circle(1260, 360, 110).fill(0xf4a65a).stroke({ width: 6, color: TV.line });
    face.poly([1170, 300, 1180, 220, 1230, 270]).fill(0xf4a65a).stroke({ width: 6, color: TV.line, join: 'round' });
    face.poly([1350, 300, 1340, 220, 1290, 270]).fill(0xf4a65a).stroke({ width: 6, color: TV.line, join: 'round' });
    face.circle(1222, 350, 12).fill(TV.line).circle(1298, 350, 12).fill(TV.line);
    face.moveTo(1225, 410).quadraticCurveTo(1260, 430, 1295, 410).stroke({ width: 6, color: TV.line });
    face.roundRect(1160, 448, 200, 44, 20).fill(0xd9483a).stroke({ width: 6, color: TV.line });
    const w2 = word(ctx.k, 'CANELO', { fontFamily: 'Anton', fontSize: 64, fill: TV.line, letterSpacing: 4 });
    w2.position.set(1260, 540);
    const w3 = word(ctx.k, 'DEBE 14 RONDAS', { fontFamily: 'Bangers', fontSize: 46, fill: 0x8a2a1a, letterSpacing: 2 });
    w3.position.set(1260, 615);
    wanted.addChild(face, w1, w2, w3);
    const back = new Container();
    back.addChild(bg, wanted);
    ctx.plane(back, { z: 1400, bake: 'static' });
    const fg = new Container();
    const can = ctx.actor(ctx.canelo, 760);
    if (can) fg.addChild(can);
    const scarf = new Graphics();
    fg.addChild(scarf);
    const fl = new Graphics();
    fg.addChild(fl);
    ctx.plane(fg, { z: 1000 });
    const bal = balloon(ctx.k, 'Me buscan a mí.', { size: 64, tail: [-60, 200] });
    bal.position.set(600, 420);
    const ui = new Container();
    ui.addChild(bal);
    ctx.plane(ui, { z: 0, screen: true });
    const tv = new TvScreen(ctx);
    ctx.plane(tv, { z: 0, screen: true });
    return {
      update(lt, f) {
        // «me buscan a mí»: he sinks behind the bottom of the frame until only his ears and eyes peek out
        const hide = ctx.rm ? sm(seg(lt, 0.5, 1.4)) : outBack(seg(lt, 0.45, 0.95), 1.4);
        can?.pose(lt, 700, 1110 + hide * 300, { sx: 1 + hide * 0.05, sy: 1 - hide * 0.06 });
        const s = scarf.clear();
        if (can && hide > 0.5) {
          // a sweat drop
          const [hx, hy] = can.head();
          const x = can.x + hx + 150;
          const y = can.y + hy - 40 + ((lt * 120) % 60);
          s.moveTo(x, y - 34).quadraticCurveTo(x + 22, y, x, y + 12).quadraticCurveTo(x - 22, y, x, y - 34).fill(0x9fd8ff).stroke({ width: 5, color: TV.line });
        }
        fl.clear();
        popIn(bal, lt, 0.7, 2.85, ctx.rm);
        tv.update(f);
      },
    };
  },
};

// ------------------------------------------------------------------ 4 · oficial (10–19): freeze + the rule, shown
export const oficial: SetModule = {
  cats: [DONA],
  async build(ctx): Promise<FilmSet> {
    const { ruleDemo } = await import('../../../../battle/demo');
    // B-5's own rules (regiones.json): three donuts on his deck
    let demo: RuleDemo | null = null;
    try {
      demo = ruleDemo('donas', { sway: 4.5, period: 2.4, drift: 1.2, donas: { side: 1, n: 3, heal: 0.06, catHeal: 0.2 } });
    } catch (e) {
      console.warn('[f01] sin demostración', e);
    }
    const st = doneria(ctx);
    const back = new Container();
    back.addChild(st.root);
    const car = new Patrol(ctx);
    car.position.set(1300, 930);
    back.addChild(car);
    ctx.plane(back, { z: 1300, bake: 'dof', blur: 8, dof: 900 });
    const turretG = new Container();
    const car2 = new Patrol(ctx);
    car2.position.set(1300, 930);
    car2.alpha = 0;
    turretG.addChild(car2);
    ctx.plane(turretG, { z: 1300 });
    const actorC = new Container();
    const dona = ctx.actor(DONA, 700);
    const still = ctx.still(DONA);
    if (dona) actorC.addChild(dona);
    if (still) {
      still.scale.set(700 / still.texture.height);
      still.visible = false;
      actorC.addChild(still);
    }
    // his donut (the one he bites)
    const myDonut = new Graphics();
    donut(myDonut, 0, 0, 46, 9);
    const bite = new Graphics().circle(30, -12, 26).fill(0x141a44);
    const donutC = new Container();
    donutC.addChild(myDonut, bite);
    actorC.addChild(donutC);
    const fx = new Graphics();
    actorC.addChild(fx);
    ctx.plane(actorC, { z: 1000 });
    // the FREEZE: name over the frozen frame
    const n1 = title70(ctx, 'OFICIAL DONA', 132);
    n1.position.set(960, 760);
    const n2 = title70(ctx, 'LA LEY DE LA CAJA', 62, 0xfff6e0);
    n2.position.set(960, 880);
    // the rule: his life bar + the battle diagram from the real simulator (battle/demo.ts)
    const bar = new Graphics();
    const barLbl = word(ctx.k, 'OFICIAL DONA', { fontFamily: 'Bangers', fontSize: 34, fill: 0xfff6e0, stroke: { color: TV.line, width: 6 }, letterSpacing: 2 }, 0);
    barLbl.anchor.set(0, 0.5);
    barLbl.position.set(300, 92);
    const diag = new Container();
    const dg = new Graphics();
    const shotG = new Graphics();
    diag.addChild(dg, shotG);
    // the panel: lower third of the 4:3 frame
    const PX = 300;
    const PY = 700;
    const PW = 1320;
    const PH = 330;
    const box0 = new Graphics().roundRect(PX - 16, PY - 16, PW + 32, PH + 32, 18).fill({ color: 0x0f1430, alpha: 0.92 }).stroke({ width: 6, color: YEL });
    diag.addChildAt(box0, 0);
    // world → panel mapping (frame both ships)
    const fld = demo?.field;
    const wx0 = fld ? Math.min(fld.player.x0, fld.enemy.x0) - 80 : 0;
    const wx1 = fld ? Math.max(fld.player.x1, fld.enemy.x1) + 80 : 1920;
    const wy0 = fld ? fld.waterY - 620 : 0;
    const wy1 = fld ? fld.waterY + 60 : 1080;
    const sx = PW / (wx1 - wx0);
    const sy = PH / (wy1 - wy0);
    const sc = Math.min(sx, sy);
    const ox = PX + (PW - (wx1 - wx0) * sc) / 2;
    const P = (x: number, y: number): [number, number] => [ox + (x - wx0) * sc, PY + (y - wy0) * sc];
    if (fld) {
      const [, wyp] = P(0, fld.waterY);
      dg.rect(PX, wyp, PW, PY + PH - wyp).fill(0x2a6ab0);
      for (let i = 0; i < 14; i++) dg.moveTo(PX + i * 96, wyp + 10).quadraticCurveTo(PX + i * 96 + 24, wyp + 2, PX + i * 96 + 48, wyp + 10).stroke({ width: 4, color: 0x8fd0ff });
      for (const [side, col] of [
        [fld.player, 0xc77a45],
        [fld.enemy, 0xf3f2ea],
      ] as const) {
        const [a] = P(side.x0, 0);
        const [b] = P(side.x1, 0);
        dg.poly([a, wyp - 70, b, wyp - 70, b - 30, wyp + 16, a + 30, wyp + 16]).fill(col).stroke({ width: 5, color: TV.line, join: 'round' });
        dg.rect(a + 20, wyp - 120, b - a - 40, 50).fill(col).stroke({ width: 4, color: TV.line });
      }
      // his donuts on deck
      for (const d of fld.donas) {
        const [dx, dy] = P(d.x, d.y);
        donut(dg, dx, dy, 22, Math.round(d.x));
      }
      const tag1 = word(ctx.k, 'TÚ', { fontFamily: 'Bangers', fontSize: 34, fill: 0xfff6e0, stroke: { color: TV.line, width: 5 } });
      tag1.position.set(P((fld.player.x0 + fld.player.x1) / 2, 0)[0], PY + 30);
      const tag2 = word(ctx.k, 'ÉL', { fontFamily: 'Bangers', fontSize: 34, fill: YEL, stroke: { color: TV.line, width: 5 } });
      tag2.position.set(P((fld.enemy.x0 + fld.enemy.x1) / 2, 0)[0], PY + 30);
      diag.addChild(tag1, tag2);
    }
    const good = demo?.shots.find((s) => s.good) ?? null;
    const bad = demo?.shots.find((s) => !s.good) ?? null;
    const lab1 = word(ctx.k, 'LE DAS AL BARCO ✔', { fontFamily: 'Bangers', fontSize: 40, fill: 0x9ff59a, stroke: { color: TV.line, width: 6 }, letterSpacing: 2 });
    const lab2 = word(ctx.k, 'LE DAS A LA DONA: ¡SE CURA! ✘', { fontFamily: 'Bangers', fontSize: 40, fill: 0xff8a8a, stroke: { color: TV.line, width: 6 }, letterSpacing: 2 });
    lab1.position.set(960, PY + PH - 34);
    lab2.position.set(960, PY + PH - 34);
    diag.addChild(lab1, lab2);
    const bal = balloon(ctx.k, 'La primera regla: no toquen mis donas.', { size: 46, tail: [180, 110], wrap: 560 });
    bal.position.set(620, 330);
    const nam = balloon(ctx.k, '¡ÑAM!', { size: 58, shout: true, fill: 0xffe27a, tail: [90, 60] });
    actorC.addChild(nam);
    const ui = new Container();
    ui.addChild(n1, n2, diag, bar, barLbl, bal);
    ctx.plane(ui, { z: 0, screen: true });
    const sparkle = new Graphics();
    ui.addChild(sparkle);
    const tv = new TvScreen(ctx);
    ctx.plane(tv, { z: 0, screen: true });
    const FREEZE = 1.5;
    const RULE = 5;
    const drawShot = (s: NonNullable<typeof good>, p: number, col: number) => {
      // the flight up to its first impact (the demo's landing point)
      let end = s.points.length - 1;
      let bd = Infinity;
      s.points.forEach((q, i) => {
        const d = Math.hypot(q.x - s.x, q.y - s.y);
        if (d < bd - 0.5) {
          bd = d;
          end = i;
        }
      });
      const pts = s.points.slice(0, end + 1);
      const n = Math.max(2, Math.floor(pts.length * p));
      for (let i = 1; i < n; i++) {
        if (i % 3 === 0) continue;
        const [x0, y0] = P(pts[i - 1].x, pts[i - 1].y);
        const [x1, y1] = P(pts[i].x, pts[i].y);
        shotG.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: 5, color: col, cap: 'round' });
      }
      const [hx, hy] = P(pts[n - 1].x, pts[n - 1].y);
      shotG.circle(hx, hy, 11).fill(TV.line);
      return [hx, hy] as [number, number];
    };
    return {
      update(lt, f) {
        const rm = ctx.rm;
        // out of the car, the turn — then the FREEZE (a still of the same pose) with the name
        const frozen = lt >= FREEZE && lt < RULE - 0.1;
        const walk = sm(seg(lt, 0, FREEZE));
        const ax = 1180 - walk * 380;
        const ay = 1090;
        const flip = lt < FREEZE - 0.35;
        const ruleOn = lt >= RULE;
        const dy = ruleOn ? -210 : 0;
        const sz = ruleOn ? 0.66 : 1;
        if (dona) {
          dona.visible = !frozen;
          dona.pose(lt, ruleOn ? 760 : ax, ay + dy * 1.6, { flip, sx: sz, sy: sz });
        }
        if (still) {
          still.visible = frozen;
          still.position.set(ax, ay);
          still.scale.set((flip ? -1 : 1) * (700 / still.texture.height), 700 / still.texture.height);
        }
        slam(n1, lt, FREEZE + 0.15, RULE - 0.1, rm);
        slam(n2, lt, FREEZE + 0.45, RULE - 0.1, rm);
        // his bar (from the rule on): full → a hit drops it → the donut refills it with sparkles
        const b = bar.clear();
        const sp = sparkle.clear();
        fx.clear();
        diag.visible = ruleOn;
        barLbl.visible = ruleOn;
        let hp = 1;
        const tHit = RULE + 1.0;
        const tBad = RULE + 2.6;
        if (ruleOn) {
          shotG.clear();
          const p1 = seg(lt, RULE + 0.2, tHit);
          const p2 = seg(lt, RULE + 1.8, tBad);
          let hitAt: [number, number] | null = null;
          if (good && lt < RULE + 1.8) hitAt = drawShot(good, p1, 0x9ff59a);
          if (bad && lt >= RULE + 1.8) hitAt = drawShot(bad, p2, 0xff8a8a);
          lab1.visible = lt >= tHit && lt < RULE + 1.8;
          lab2.visible = lt >= tBad;
          hp = lt < tHit ? 1 : lt < tBad + 0.3 ? 0.58 : 0.58 + 0.42 * sm(seg(lt, tBad + 0.3, tBad + 1.2));
          if (hitAt && ((lt >= tHit && lt < tHit + 0.35) || (lt >= tBad && lt < tBad + 0.35))) {
            const k = 1 - seg(lt, lt < tBad ? tHit : tBad, (lt < tBad ? tHit : tBad) + 0.35);
            for (let i = 0; i < 8; i++) {
              const a = i * 0.785;
              shotG.moveTo(hitAt[0] + Math.cos(a) * 14, hitAt[1] + Math.sin(a) * 14).lineTo(hitAt[0] + Math.cos(a) * (14 + 40 * k), hitAt[1] + Math.sin(a) * (14 + 40 * k)).stroke({ width: 5, color: YEL, alpha: k });
            }
          }
          b.roundRect(296, 116, 640, 40, 12).fill(0x1d1430).stroke({ width: 5, color: TV.line });
          b.roundRect(302, 122, 628 * hp, 28, 9).fill(hp < 0.7 ? 0xff5a4a : 0x6ae06a);
          if (lt >= tBad + 0.3 && lt < tBad + 1.6) {
            const k = seg(lt, tBad + 0.3, tBad + 1.6);
            for (let i = 0; i < 18; i++) {
              const x = 302 + rnd(i) * 628 * hp;
              const y = 136 - (k * 60 + rnd(i + 5) * 40);
              sp.star(x, y, 4, 9 * (1 - k), 4).fill({ color: [0xff7fb0, 0x58d0ff, 0xffd27a, 0x9ff59a][i % 4], alpha: 1 - k });
            }
          }
          // he flinches at the hit, bites at the donut
          if (dona && lt >= tHit && lt < tHit + 0.3) dona.position.x += Math.sin(lt * 80) * (rm ? 0 : 8);
        }
        // he bites the donut he always carries (it's in his painting): ¡ÑAM! and crumbs
        donutC.visible = false;
        nam.visible = false;
        if (dona && ruleOn && lt >= tBad + 0.1 && lt < tBad + 1.4) {
          const [hx, hy] = dona.head();
          const k = seg(lt, tBad + 0.1, tBad + 1.4);
          nam.visible = true;
          nam.position.set(dona.x + hx * dona.scale.x - 150, dona.y + hy * dona.scale.y - 40 - k * 30);
          nam.scale.set(rm ? 1 : 0.8 + outBack(seg(lt, tBad + 0.1, tBad + 0.3)) * 0.3);
          nam.alpha = 1 - sm(seg(lt, tBad + 1.1, tBad + 1.4));
          for (let i = 0; i < 6; i++) fx.circle(dona.x + hx * dona.scale.x - 60 + rnd(i) * 60, dona.y + hy * dona.scale.y + 40 + k * (80 + rnd(i + 4) * 80), 6).fill(0xf0b45e).stroke({ width: 3, color: TV.line });
        }
        popIn(bal, lt, RULE + 2.9, 9, rm, 0.92);
        car2.alpha = 0;
        tv.update(f);
      },
      look(lt) {
        // the freeze frame: a warm, contrasty still
        if (lt >= FREEZE && lt < RULE - 0.1) {
          const k = sm(seg(lt, FREEZE, FREEZE + 0.12));
          return { sepia: 0.45 * k, contrast: 1.03 + 0.15 * k, sat: 1.12 - 0.3 * k };
        }
        return null;
      },
    };
  },
};

// ------------------------------------------------------------------ 5 · luz (19–25): the turret blown out + the Bitácora
export const luz: SetModule = {
  cats: [DONA, 'luzterna'],
  build(ctx): FilmSet {
    const st = doneria(ctx);
    const street = new Container();
    street.addChild(st.root);
    ctx.plane(street, { z: 1000, bake: 'static', res: 1.5 });
    const live = new Container();
    const car = new Patrol(ctx);
    car.position.set(1240, 930);
    const dona = ctx.actor(DONA, 520);
    const luz = luzOf(ctx, 420);
    const puff = new Graphics();
    const dark = new Graphics().rect(-400, -300, 2720, 1700).fill(0x05060f);
    const eyes = new Graphics();
    const lglow = new Sprite(kitTex(ctx, 'glow'));
    lglow.anchor.set(0.5);
    lglow.tint = TV.lantern;
    lglow.blendMode = 'add';
    const rain = ctx.weather('rain');
    live.addChild(car);
    if (dona) live.addChild(dona);
    if (luz.actor) live.addChild(luz.actor);
    live.addChild(puff);
    if (rain?.ground) live.addChild(rain.ground);
    live.addChild(dark, eyes, lglow);
    ctx.plane(live, { z: 1000 });
    const pg = new Bitacora(ctx, 'Las huellas. Y la paciencia del gordo.');
    const ui = new Container();
    ui.addChild(pg);
    ctx.plane(ui, { z: 0, screen: true });
    const tv = new TvScreen(ctx);
    ctx.plane(tv, { z: 0, screen: true });
    const BLOW = 1.4;
    return {
      update(lt, f) {
        const rm = ctx.rm;
        // she floats up to the turret, puffs her cheeks, blows
        const up = sm(seg(lt, 0, 1.2));
        const b = bob(lt, rm, 8);
        luz.actor?.pose(lt, 1500 - up * 120, 700 - up * 60 + b, { flip: true });
        dona?.pose(lt, 860, 1050, { flip: false });
        const out = lt >= BLOW + 0.25;
        car.turret(turretPhase(lt, ctx.rf), out ? 0 : 1);
        const p = puff.clear();
        if (lt >= BLOW && lt < BLOW + 0.6) {
          const k = seg(lt, BLOW, BLOW + 0.6);
          for (let i = 0; i < 4; i++) {
            const y = 640 + i * 16 - 30;
            p.moveTo(1330 - k * 40, y).quadraticCurveTo(1300 - k * 80, y - 10, 1270 - k * 120, y + 4).stroke({ width: 6, color: 0xeaf6ff, alpha: 1 - k, cap: 'round' });
          }
        }
        // the street goes dark for a moment: only her blue lantern (and his offended eyes)
        const d = out ? sm(seg(lt, BLOW + 0.25, BLOW + 0.5)) * (1 - sm(seg(lt, 2.9, 3.4))) * 0.86 : 0;
        dark.alpha = d;
        const e = eyes.clear();
        if (d > 0.3 && dona) {
          const [hx, hy] = dona.head();
          const x = dona.x + hx * dona.scale.x;
          const y = dona.y + hy;
          // half-lidded, offended
          for (const dx of [-34, 34]) {
            e.ellipse(x + dx, y - 6, 20, 10).fill({ color: 0xffffff, alpha: d });
            e.rect(x + dx - 22, y - 20, 44, 10).fill({ color: 0x05060f, alpha: d });
          }
        }
        if (luz.actor) {
          const [lx, ly] = lanternAt(luz);
          lglow.position.set(lx, ly);
          lglow.scale.set(1.4 + d * 1.6);
          lglow.alpha = 0.5 + d * 0.5;
        }
        pg.update(lt - 3.0, rm);
        pg.visible = lt >= 3.0;
        tv.update(f);
      },
    };
  },
};
void [Beam, clamp01, env, contact, Sprite];
