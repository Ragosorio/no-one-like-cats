/**
 * F11 «Cruceta» — the sets (shot list in ./index.ts). A Silver Age comic DRAWN BY THE RIVAL: flat printer's inks, big
 * Ben-Day dots, melodramatic lettering with triple exclamation marks, energy crackle at the edges — and in his own
 * cover, WE are the villains.
 */
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import {
  Beam,
  Bitacora,
  CMY,
  FLAME,
  INK,
  LANTERN,
  Panel,
  SLUG,
  balloon,
  bob,
  burst,
  caption,
  comicStyle,
  dotsFill,
  env,
  fitArcTo,
  flame,
  glow,
  inkMask,
  jolt,
  lanternAt,
  luzOf,
  outBack,
  paperCape,
  pop,
  realArcs,
  reveal,
  rnd,
  seg,
  sm,
  speedLines,
  stillRig,
  streaks,
  tailTip,
  word,
} from '../kit';

const SA = { red: 0xd8262a, blue: 0x2346a8, yellow: 0xf6c824, green: 0x2a9a4a, ink: 0x16100c, paper: 0xf4e6c4, sky: 0x4a86d8 } as const;

/** the energy crackle of the 60s (clusters of black dots and little bolts) along a line */
function crackle(g: Graphics, x0: number, y0: number, x1: number, y1: number, seed: number, n = 14) {
  for (let i = 0; i < n; i++) {
    const t = rnd(seed + i);
    const x = x0 + (x1 - x0) * t + (rnd(seed + i * 3) - 0.5) * 50;
    const y = y0 + (y1 - y0) * t + (rnd(seed + i * 5) - 0.5) * 50;
    const r = 5 + rnd(seed + i * 7) * 12;
    g.circle(x, y, r).fill(SA.ink);
    if (i % 3 === 0) g.poly([x + r, y, x + r * 3, y - r * 0.6, x + r * 2.2, y + r * 0.2, x + r * 3.6, y + r]).fill(SA.ink);
  }
}
/** a still of `slug` (in `bake` when given) sized `h`, anchored at the feet */
function still(ctx: SceneCtx, slug: string, h: number, bake?: string): Sprite | null {
  const s = bake ? ctx.stillAs(bake, slug, 0.5, 0.97) : ctx.still(slug, 0.5, 0.97);
  if (s) s.setSize((s.width / s.height) * h, h);
  return s;
}
/** a villain moustache (twisted ends) */
function moustache(g: Graphics, x: number, y: number, w: number, color: number = SA.ink) {
  g.moveTo(x, y)
    .bezierCurveTo(x - w * 0.3, y - w * 0.2, x - w * 0.55, y + w * 0.12, x - w * 0.7, y - w * 0.12)
    .bezierCurveTo(x - w * 0.8, y - w * 0.3, x - w * 0.58, y - w * 0.36, x - w * 0.6, y - w * 0.2)
    .bezierCurveTo(x - w * 0.42, y + w * 0.02, x - w * 0.2, y + w * 0.06, x, y + w * 0.08)
    .bezierCurveTo(x + w * 0.2, y + w * 0.06, x + w * 0.42, y + w * 0.02, x + w * 0.6, y - w * 0.2)
    .bezierCurveTo(x + w * 0.58, y - w * 0.36, x + w * 0.8, y - w * 0.3, x + w * 0.7, y - w * 0.12)
    .bezierCurveTo(x + w * 0.55, y + w * 0.12, x + w * 0.3, y - w * 0.2, x, y)
    .fill(color);
}
/** a witch's crooked nose and pointy hat (Cruceta's idea of Luzterna) */
function witch(g: Graphics, nx: number, ny: number, r: number) {
  // a long crooked green nose with a wart (her own painting already wears the pointy hat)
  g.poly([nx + r * 0.12, ny - r * 0.1, nx - r * 0.12, ny - r * 0.1, nx - r * 0.62, ny + r * 0.38, nx - r * 0.5, ny + r * 0.46, nx - r * 0.2, ny + r * 0.22]).fill(0x8ac04a).stroke({ width: 4, color: SA.ink, join: 'round' });
  g.circle(nx - r * 0.38, ny + r * 0.24, r * 0.06).fill(0x5a8a2a).stroke({ width: 2, color: SA.ink });
}
/** Gato Araña as Cruceta drew him (a cartoon, code-drawn): red mask with web lines, white teardrop eyes, blue sweater */
function gatoArana(g: Graphics, x: number, y: number, s: number) {
  g.roundRect(x - 60 * s, y - 120 * s, 120 * s, 130 * s, 40 * s).fill(SA.blue).stroke({ width: 5, color: SA.ink });
  g.circle(x, y - 175 * s, 62 * s).fill(SA.red).stroke({ width: 5, color: SA.ink });
  g.poly([x - 50 * s, y - 210 * s, x - 42 * s, y - 262 * s, x - 14 * s, y - 228 * s]).fill(SA.red).stroke({ width: 4, color: SA.ink });
  g.poly([x + 50 * s, y - 210 * s, x + 42 * s, y - 262 * s, x + 14 * s, y - 228 * s]).fill(SA.red).stroke({ width: 4, color: SA.ink });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.moveTo(x, y - 175 * s).lineTo(x + Math.cos(a) * 62 * s, y - 175 * s + Math.sin(a) * 62 * s);
  }
  g.stroke({ width: 2.5, color: SA.ink });
  for (const r of [22, 42]) g.circle(x, y - 175 * s, r * s).stroke({ width: 2.5, color: SA.ink });
  for (const d of [-1, 1]) g.poly([x + d * 12 * s, y - 182 * s, x + d * 44 * s, y - 200 * s, x + d * 36 * s, y - 160 * s]).fill(0xffffff).stroke({ width: 4, color: SA.ink });
  // the eight-legged print on the sweater
  g.circle(x, y - 60 * s, 10 * s).fill(SA.ink);
  for (let i = 0; i < 4; i++) for (const d of [-1, 1]) g.moveTo(x, y - 60 * s).lineTo(x + d * (16 + i * 4) * s, y - (78 - i * 12) * s).stroke({ width: 2.5, color: SA.ink });
}

/** THE COVER, drawn by Cruceta (static: built once). `bake` = the treatment of the stills when the scene isn't edadplata */
export interface CoverPts {
  face: [number, number];
  faceR: number;
  witch: [number, number];
}
export function cover(ctx: SceneCtx, bake?: string): { c: Container; pts: CoverPts } {
  const k = ctx.k;
  const c = new Container();
  const W = 1500;
  const H = 1080;
  const paper = ctx.tex('ep:paper') as Texture | undefined;
  if (paper) {
    const p = new Sprite(paper);
    p.setSize(W, H);
    c.addChild(p);
  } else c.addChild(new Graphics().rect(0, 0, W, H).fill(SA.paper));
  const g = new Graphics();
  // the sky behind the hero: flat blue with big dots, rays
  g.rect(30, 230, W - 60, H - 260).fill(SA.sky);
  c.addChild(g);
  c.addChild(dotsFill(ctx.tex('ep:dots'), W - 60, H - 260, { tint: 0x2a5ab8, scale: 0.7, alpha: 0.6, x: 30, y: 230 }));
  const rays = new Graphics();
  speedLines(rays, 520, 640, 60, 1400, { n: 28, color: 0x6aa6f0, seed: 5, width: 0.05 });
  const rm2 = new Graphics().rect(30, 230, W - 60, H - 260).fill(0xffffff);
  rays.mask = rm2;
  c.addChild(rays, rm2);
  // the masthead: ¡CRUCETA! in 3D block letters, the price box, the code seal
  const mh = new Graphics().rect(30, 30, W - 60, 190).fill(SA.yellow).stroke({ width: 8, color: SA.ink });
  c.addChild(mh);
  for (let i = 10; i > 0; i -= 2) {
    const t = word(k, '¡CRUCETA!', { fontFamily: 'Anton', fontSize: 168, fill: SA.ink, letterSpacing: 6 });
    t.position.set(W / 2 + 40 + i * 0.8, 122 + i);
    c.addChild(t);
  }
  const title = word(k, '¡CRUCETA!', { fontFamily: 'Anton', fontSize: 168, fill: SA.red, letterSpacing: 6, stroke: { color: SA.ink, width: 8 } });
  title.position.set(W / 2 + 40, 122);
  c.addChild(title);
  const price = new Graphics().rect(56, 52, 150, 150).fill(0xffffff).stroke({ width: 6, color: SA.ink });
  c.addChild(price);
  const pt = word(k, '12¢', { fontFamily: 'Anton', fontSize: 64, fill: SA.ink });
  pt.position.set(131, 110);
  const pn = word(k, 'Nº 1', { fontFamily: 'Bangers', fontSize: 34, fill: SA.red });
  pn.position.set(131, 170);
  c.addChild(pt, pn);
  const seal = new Graphics().rect(W - 200, 56, 140, 140).fill(0xffffff).stroke({ width: 5, color: SA.ink });
  c.addChild(seal);
  const st = word(k, 'APROBADO\nPOR\nCRUCETA', { fontFamily: 'Bebas Neue', fontSize: 30, fill: SA.ink, align: 'center', lineHeight: 30 });
  st.position.set(W - 130, 126);
  c.addChild(st);
  // the hero: paper-script cape, fist forward, the ink mask, crackle
  const hero = new Container();
  const cape = new Graphics();
  paperCape(cape, 640, 650, 250, 330, 0.6, { ink: SA.ink, dir: 1 });
  hero.addChild(cape);
  const cru = still(ctx, SLUG.cruceta, 560, bake);
  const cr = stillRig(SLUG.cruceta, 560);
  let face: [number, number] = [520, 520];
  let faceR = 70;
  if (cru) {
    cru.position.set(520, 1000);
    hero.addChild(cru);
    if (cr) {
      face = [520 + cr.head[0], 1000 + cr.head[1]];
      faceR = cr.headR;
      const mk = new Graphics();
      inkMask(mk, face[0], face[1] - faceR * 0.05, faceR * 1.9, SA.ink);
      hero.addChild(mk);
    }
  }
  // the fist forward (a big foreshortened paw)
  const fist = new Graphics();
  streaks(fist, 760, 560, 300, 200, { n: 12, color: SA.ink, seed: 3, len: 160 });
  hero.addChild(fist);
  const cg = new Graphics();
  crackle(cg, 260, 300, 820, 340, 11);
  crackle(cg, 900, 700, 980, 980, 21, 8);
  hero.addChild(cg);
  c.addChild(hero);
  // the blurb, melodramatic, triple-exclaimed
  const bl = word(k, '¡¡¡CRUCETA CONTRA LA BANDA DEL GATO QUE ROMPE CIUDADES!!!', { fontFamily: 'Bangers', fontSize: 66, fill: SA.yellow, align: 'center', wordWrap: true, wordWrapWidth: 640, lineHeight: 70, stroke: { color: SA.ink, width: 10, join: 'round' } });
  bl.position.set(1110, 360);
  bl.rotation = 0.05;
  c.addChild(bl);
  // the villains, as he drew them (bottom right): Canelo with a villain moustache, the witch, the crossed-out traitor
  const vil = new Container();
  const vb = new Graphics().rect(840, 560, 630, 480).fill(0x2a1a3a).stroke({ width: 8, color: SA.ink });
  vil.addChild(vb);
  vil.addChild(dotsFill(ctx.tex('ep:dots'), 630, 480, { tint: 0x6a3a8a, scale: 0.7, alpha: 0.7, x: 840, y: 560 }));
  const can = still(ctx, ctx.canelo, 330, bake);
  const canR = stillRig(ctx.canelo, 330);
  if (can) {
    can.position.set(1050, 1030);
    vil.addChild(can);
  }
  const vm = new Graphics();
  if (canR) {
    const ey = canR.eyes ?? canR.head;
    moustache(vm, 1050 + ey[0], 1030 + ey[1] + canR.headR * 0.5, canR.headR * 2.1);
  }
  vil.addChild(vm);
  const luzS = still(ctx, SLUG.luz, 360, bake);
  const lzR = stillRig(SLUG.luz, 360);
  let witchAt: [number, number] = [1330, 700];
  if (luzS) {
    luzS.position.set(1320, 1030);
    vil.addChild(luzS);
  }
  const wg = new Graphics();
  if (lzR) {
    witchAt = [1320 + lzR.head[0], 1030 + lzR.head[1]];
    const ey = lzR.eyes ?? [lzR.head[0], lzR.head[1]];
    witch(wg, 1320 + ey[0], 1030 + ey[1] + lzR.headR * 0.3, lzR.headR);
  }
  vil.addChild(wg);
  // the traitor: Gato Araña (his painting; the cartoon only if it isn't loaded), crossed out in red
  const gaS = still(ctx, SLUG.aranya, 250, bake);
  const ga = new Graphics();
  if (gaS) {
    gaS.position.set(905, 1035);
    vil.addChild(gaS);
  } else gatoArana(ga, 900, 1020, 0.85);
  ga.moveTo(840, 780).lineTo(960, 1030).moveTo(960, 780).lineTo(840, 1030).stroke({ width: 12, color: SA.red });
  vil.addChild(ga);
  const lb = word(k, '¡LA BRUJA DE LA LINTERNA!', { fontFamily: 'Bangers', fontSize: 38, fill: SA.yellow, stroke: { color: SA.ink, width: 7 } });
  lb.position.set(1300, 600);
  const tr = word(k, '¡TRAIDOR!', { fontFamily: 'Bangers', fontSize: 44, fill: SA.red, stroke: { color: 0xffffff, width: 7 } });
  tr.position.set(905, 760);
  tr.rotation = -0.2;
  vil.addChild(lb, tr);
  c.addChild(vil);
  c.addChild(new Graphics().rect(0, 0, W, H).stroke({ width: 10, color: SA.ink }));
  return { c, pts: { face, faceR, witch: witchAt } };
}

// ------------------------------------------------------------------ 1 · the cover
export const portada: SetModule = {
  cats: ({ canelo }) => [SLUG.cruceta, canelo, SLUG.luz, SLUG.aranya],
  build(ctx: SceneCtx): FilmSet {
    const k = ctx.k;
    const desk = new Graphics().rect(-1500, -1200, 4920, 3480).fill(0x2a1c0c);
    ctx.plane(desk, { z: 1600, bake: 'static', res: 0.5 });
    const { c } = cover(ctx);
    c.position.set(210, 0);
    const cv = new Container();
    cv.addChild(c);
    ctx.plane(cv, { z: 1000, bake: 'static', res: 1.2 });
    // live: Cruceta's balloon, the stamp hits, the crackle boils on threes
    const live = new Container();
    const bal = balloon(k, '¡Esta ciudad no le teme a ninguna bruja!', { size: 44, wrap: 420, tail: [-140, 90], shout: true });
    bal.position.set(210 + 600, 300);
    const boil = new Graphics();
    live.addChild(boil, bal);
    ctx.plane(live, { z: 999 });
    return {
      update(lt, f) {
        reveal(bal, lt, 11.3, Infinity, f.rm);
        const g = boil.clear();
        if (!f.rm) crackle(g, 210 + 250, 300, 210 + 840, 330, 40 + (Math.floor(lt * 8) % 3) * 7, 5);
      },
    };
  },
};

// ------------------------------------------------------------------ 2 · the interior pages: the rooftop, the flame, the rule
export const PI = {
  v1: { x: 60, y: 40, w: 1100, h: 480 },
  v2: { x: 1190, y: 40, w: 670, h: 480 },
  v3: { x: 60, y: 560, w: 580, h: 480 },
  v4: { x: 670, y: 560, w: 580, h: 480 },
  v5: { x: 1280, y: 560, w: 580, h: 480 },
} as const;
export const interior: SetModule = {
  cats: ({ canelo }) => [SLUG.cruceta, canelo, SLUG.gatito],
  build(ctx: SceneCtx): FilmSet {
    const k = ctx.k;
    const back = new Container();
    back.addChild(new Graphics().rect(-900, -700, 3720, 2480).fill(0x2a1c0c));
    const pp = ctx.tex('ep:paper') as Texture | undefined;
    if (pp) {
      const s = new Sprite(pp);
      s.setSize(1920, 1080);
      back.addChild(s);
    } else back.addChild(new Graphics().rect(0, 0, 1920, 1080).fill(SA.paper));
    ctx.plane(back, { z: 1000, bake: 'static' });
    const page = new Container();
    const mk = (o: { x: number; y: number; w: number; h: number }, bg: number) => new Panel({ ...o, bg, gutter: 0, ink: SA.ink, border: 8 });
    // V1: the rooftop with the mark where 000 fell, and a tear
    const v1 = mk(PI.v1, SA.sky);
    const r1 = new Graphics();
    r1.rect(-550, 60, 1100, 180).fill(0x6a5a8a).stroke({ width: 6, color: SA.ink });
    for (let i = 0; i < 9; i++) r1.rect(-540 + i * 125, 70, 6, 170).fill({ color: SA.ink, alpha: 0.4 });
    // the mark: a crater of static in the shape of a kitten's landing
    r1.ellipse(-120, 90, 150, 30).fill(0x2a2a3a).stroke({ width: 5, color: SA.ink });
    for (let i = 0; i < 30; i++) r1.rect(-250 + rnd(i) * 260, 74 + rnd(i + 3) * 30, 8, 4).fill(0xffffff);
    // the tear in the air (a rip with zigzag edges)
    const rip: number[] = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const r = (i % 2 ? 60 : 100) + rnd(i) * 20;
      rip.push(300 + Math.cos(a) * r * 0.6, -60 + Math.sin(a) * r);
    }
    r1.poly(rip).fill(0x0a0a12).stroke({ width: 7, color: SA.yellow });
    v1.content.addChild(dotsFill(ctx.tex('ep:dots'), 1100, 480, { tint: 0x2a5ab8, scale: 0.7, alpha: 0.5, x: -550, y: -240 }));
    v1.content.addChild(r1);
    const c1 = caption(k, '¡EN ESTA AZOTEA CAYÓ EL GATO QUE ROMPE LA CIUDAD!', { fill: SA.yellow, w: 620, size: 40, rot: -0.01 });
    c1.position.set(-180, -165);
    v1.over.addChild(c1);
    // V2: the villain loses his fire next to the tear
    const v2 = mk(PI.v2, 0x2a1a3a);
    v2.content.addChild(dotsFill(ctx.tex('ep:dots'), 670, 480, { tint: 0x6a3a8a, scale: 0.7, alpha: 0.7, x: -335, y: -240 }));
    const rip2 = new Graphics().poly(rip.map((v, i) => (i % 2 ? v + 40 : v - 380))).fill(0x0a0a12).stroke({ width: 7, color: SA.yellow });
    v2.content.addChild(rip2);
    const can = ctx.actor(ctx.canelo, 300);
    const fg = new Graphics();
    if (can) v2.content.addChild(can);
    v2.content.addChild(fg);
    const vm = new Graphics();
    v2.content.addChild(vm);
    const c2 = caption(k, '¡EL GORDO PIERDE SU FUEGO!', { fill: SA.yellow, w: 400, size: 40, rot: 0.02 });
    c2.position.set(60, -175);
    v2.over.addChild(c2);
    // V3–V5: THE RULE «Rescate» — mid-fight he stops firing, dives to save a kitten from a ledge, and comes back
    const v3 = mk(PI.v3, SA.sky);
    const v4 = mk(PI.v4, 0xf0d070);
    const v5 = mk(PI.v5, 0x9aa0b0);
    for (const v of [v3, v5]) {
      const sea = new Graphics().rect(-290, 120, 580, 120).fill(0x2a4a9a).stroke({ width: 5, color: SA.ink });
      v.content.addChild(sea);
    }
    // V3: Cruceta fires at our ship (his shot = the simulator's real flight, mirrored: fired from the right)
    const hero3 = ctx.actor(SLUG.cruceta, 260);
    const cape3 = new Graphics();
    v3.content.addChild(cape3);
    if (hero3) v3.content.addChild(hero3);
    const shipG = new Graphics();
    const drawShip = (g: Graphics, x: number, s: number) => {
      g.poly([x - 90 * s, 120, x + 90 * s, 120, x + 70 * s, 160, x - 70 * s, 160]).fill(0x6a4a30).stroke({ width: 5, color: SA.ink });
      g.rect(x - 3, -10, 6, 130).fill(SA.ink);
      g.poly([x - 50 * s, 0, x + 40 * s, 0, x + 34 * s, 90, x - 44 * s, 90]).fill(0xf4e6c4).stroke({ width: 4, color: SA.ink });
    };
    drawShip(shipG, -170, 1);
    v3.content.addChild(shipG);
    const arc = realArcs()[0];
    const shot = fitArcTo(arc, [120, -10], [-170, 70], -200);
    const trail3 = new Graphics();
    v3.content.addChild(trail3);
    const pw = word(k, '¡ZAP! ¡ZAP!', comicStyle(46, SA.yellow, { stroke: { color: SA.ink, width: 7 } }));
    pw.position.set(60, -170);
    v3.over.addChild(pw);
    // V4: he dives, catches the kitten falling from the ledge
    const ledge = new Graphics().rect(-290, -240, 200, 480).fill(0x8a6a5a).stroke({ width: 6, color: SA.ink }).rect(-100, -60, 60, 16).fill(0x6a4a3a).stroke({ width: 4, color: SA.ink });
    v4.content.addChild(ledge);
    const lines4 = new Graphics();
    streaks(lines4, -120, -200, 420, 400, { n: 18, color: SA.ink, seed: 7, ang: 0.95, len: 200 });
    v4.content.addChild(lines4);
    const kit = ctx.actor(SLUG.gatito, 110);
    if (kit) v4.content.addChild(kit);
    const hero4 = ctx.actor(SLUG.cruceta, 230);
    const cape4 = new Graphics();
    v4.content.addChild(cape4);
    if (hero4) v4.content.addChild(hero4);
    const sw = word(k, '¡SWOOSH!', comicStyle(64, SA.red, { stroke: { color: SA.ink, width: 8 } }));
    sw.position.set(80, -170);
    sw.rotation = -0.15;
    v4.over.addChild(sw);
    // V5: the battle FROZEN for one turn while he rescues (grey, a pause sign) — then he's back
    const frozen = new Graphics();
    drawShip(frozen, -170, 1);
    drawShip(frozen, 170, 1);
    v5.content.addChild(frozen);
    const pause = new Graphics();
    pause.circle(0, -40, 74).fill(0xffffff).stroke({ width: 7, color: SA.ink });
    pause.rect(-26, -78, 18, 76).fill(SA.ink).rect(8, -78, 18, 76).fill(SA.ink);
    v5.content.addChild(pause);
    const tt = word(k, 'UN TURNO', comicStyle(46, SA.ink));
    tt.position.set(0, 64);
    v5.content.addChild(tt);
    const hero5 = ctx.actor(SLUG.cruceta, 200);
    if (hero5) v5.content.addChild(hero5);
    const c5 = caption(k, '¡NI EN LA BATALLA OLVIDA A SU CIUDAD!', { fill: SA.yellow, w: 480, size: 36, rot: -0.02 });
    c5.position.set(0, -185);
    v5.over.addChild(c5);
    page.addChild(v1, v2, v3, v4, v5);
    ctx.plane(page, { z: 999 });
    const masks = [inkMaskOn(hero3), inkMaskOn(hero4), inkMaskOn(hero5)];
    masks.forEach((m, i) => [v3, v4, v5][i].content.addChild(m.g));
    return {
      update(lt, f) {
        const rm = f.rm;
        v1.show(lt, 0.15, rm, 'drop');
        v2.show(lt, 3.7, rm);
        v3.show(lt, 6.9, rm);
        v4.show(lt, 9.4, rm);
        v5.show(lt, 11.9, rm);
        reveal(c1, lt, 0.8, Infinity, rm);
        reveal(c2, lt, 4.6, Infinity, rm);
        reveal(c5, lt, 12.5, Infinity, rm);
        // V2: Canelo (with the moustache he wears in this comic) passes the tear; the flame drops
        const x = -160 + seg(lt, 3.8, 6.4) * 220;
        can?.pose(lt, x, 220, { flip: true });
        const fgg = fg.clear();
        const near = sm(seg(lt, 4.4, 5.4));
        const tip = tailTip(can);
        if (tip) flame(fgg, tip[0], tip[1], FLAME.chica - (FLAME.chica - FLAME.minima) * near, lt, { rm, ink: SA.ink, scale: 1.15 });
        const vmm = vm.clear();
        const hd = can?.head();
        if (can && hd) moustache(vmm, can.x + hd[0] * Math.sign(can.scale.x) * 0.9, can.y + hd[1] * 0.92 + 26, 60);
        // V3: firing (the trail drawn while it flies, on twos)
        hero3?.pose(lt, 170, 230, { flip: true, rot: env(lt, 7.3, 7.8, 0.05, 0.2) * 0.06 });
        drawCape(cape3, hero3, lt, rm);
        const tg = trail3.clear();
        const fp = seg(lt, 7.3, 8.6);
        const n = Math.max(2, Math.floor(shot.length * (rm ? (fp > 0 ? 1 : 0) : fp)));
        for (let i = 1; i < n; i += 2) tg.moveTo(shot[i - 1][0], shot[i - 1][1]).lineTo(shot[i][0], shot[i][1]);
        tg.stroke({ width: 7, color: SA.yellow }).stroke({ width: 2, color: SA.ink });
        reveal(pw, lt, 7.4, Infinity, rm);
        // V4: the kitten slips at 9.8 and falls; he swoops from the top right and catches it
        const fall = seg(lt, 9.8, 10.6);
        const catchT = 10.45;
        const kx = -70;
        const ky = lt < catchT ? -60 + fall * fall * 260 : -60 + 0.7 * 260 * 0.7;
        const dive = seg(lt, 9.9, catchT);
        const hx = lt < catchT ? 300 - dive * 340 : -40 + seg(lt, catchT, 11.6) * 120;
        const hy = lt < catchT ? -200 + dive * 280 : 80 - seg(lt, catchT, 11.6) * 40;
        kit?.pose(lt, lt < catchT ? kx : hx + 30, lt < catchT ? ky : hy - 60, { rot: lt < catchT ? fall * 1.2 : 0 });
        hero4?.pose(lt, hx, hy + 120, { rot: lt < catchT ? -0.5 : -0.1, flip: true });
        drawCape(cape4, hero4, lt, rm, 1.4);
        lines4.alpha = lt > 9.9 && lt < 11.4 ? 1 : 0;
        reveal(sw, lt, 10.0, Infinity, rm);
        // V5: frozen grey battle; he lands back at 13.6
        hero5?.pose(lt, 210, 120 - (1 - sm(seg(lt, 13.2, 13.7))) * 360, { flip: true });
        pause.alpha = lt < 13.7 ? 1 : 1 - seg(lt, 13.7, 14.1);
        tt.alpha = pause.alpha;
        frozen.tint = lt < 13.7 ? 0x9a9a9a : 0xffffff;
        masks.forEach((m, i) => m.place([hero3, hero4, hero5][i]));
      },
    };
  },
};
/** a paper cape that follows a live actor (redrawn small, on threes) */
function drawCape(g: Graphics, a: ReturnType<SceneCtx['actor']>, lt: number, rm: boolean, stretch = 1) {
  g.clear();
  if (!a) return;
  const hd = a.head();
  const sx = Math.sign(a.scale.x) || 1;
  paperCape(g, a.x - sx * 10, a.y + hd[1] * 0.55, a.size * 0.5, a.size * 0.62 * stretch, rm ? 0 : Math.floor(lt * 8) * 0.7, { ink: SA.ink, dir: sx });
}
/** Cruceta's ink mask riding a live actor's face */
function inkMaskOn(a: ReturnType<SceneCtx['actor']>) {
  const g = new Graphics();
  let key = '';
  return {
    g,
    place(b: ReturnType<SceneCtx['actor']>) {
      if (!b) return;
      const hd = b.head();
      const sx = Math.sign(b.scale.x) || 1;
      const x = b.x + hd[0] * sx;
      const y = b.y + hd[1] * 0.97;
      const w = b.size * 0.3;
      const k2 = `${Math.round(x)},${Math.round(y)},${Math.round(b.rotation * 100)}`;
      if (k2 === key) return;
      key = k2;
      g.clear();
      inkMask(g, x, y, w, SA.ink);
      void a;
    },
  };
}

// ------------------------------------------------------------------ 3 · the real cover in Luzterna's hand
export const bruja: SetModule = {
  cats: ({ canelo }) => [SLUG.cruceta, canelo, SLUG.luz, SLUG.aranya, { slug: SLUG.luz, bake: 'aracnido' }],
  build(ctx: SceneCtx): FilmSet {
    const k = ctx.k;
    const city = new Graphics().rect(-1500, -1000, 4920, 3080).fill(0x1e1048);
    for (let i = 0; i < 26; i++) {
      const x = -900 + i * 170;
      const h = 300 + rnd(i + 3) * 500;
      city.rect(x, 1100 - h, 140, h).fill(0x2c1450).stroke({ width: 6, color: INK });
      for (let j = 0; j < 8; j++) if (rnd(i * 7 + j) > 0.45) city.rect(x + 20 + (j % 3) * 36, 1120 - h + Math.floor(j / 3) * 60, 16, 26).fill(0xffc94a);
    }
    ctx.plane(city, { z: 3000, bake: 'dof', blur: 18, dof: 1500 });
    const { c, pts } = cover(ctx);
    const paper = new Container();
    paper.addChild(c);
    // her light-drawing on top: a moustache on Cruceta, «NO SOY BRUJA» next to the witch
    const light = new Graphics();
    paper.addChild(light);
    const nsb = word(k, 'NO SOY BRUJA', { fontFamily: 'Permanent Marker', fontSize: 64, fill: 0xbfeeff, stroke: { color: LANTERN, width: 8, join: 'round' } });
    nsb.position.set(pts.witch[0] - 40, pts.witch[1] - 210);
    nsb.rotation = -0.08;
    const nm = new Graphics();
    nsb.mask = nm;
    paper.addChild(nsb, nm);
    paper.pivot.set(750, 540);
    paper.position.set(1060, 560);
    paper.rotation = 0.03;
    paper.scale.set(0.92);
    const pP = new Container();
    pP.addChild(paper);
    ctx.plane(pP, { z: 1000 });
    const rig = luzOf(ctx, 900, 'aracnido');
    const beam = new Beam(ctx);
    const lamp = glow(ctx, LANTERN, 200, 0.8);
    const near = new Container();
    if (rig.actor) near.addChild(rig.actor);
    near.addChild(beam, lamp);
    ctx.plane(near, { z: 760 });
    const bit = new Bitacora(ctx, 'La azotea donde cayó el chiquito.', { enter: 'slap', w: 1300, size: 62, top: 640, tilt: 0.02 });
    ctx.plane(bit, { z: 0, screen: true });
    // the moustache she draws (a stroke path in cover px), then the words
    const mx = pts.face[0];
    const my = pts.face[1] + pts.faceR * 0.8;
    const mw = pts.faceR * 1.3;
    const MPATH: [number, number][] = Array.from({ length: 24 }, (_, i) => {
      const t = i / 23;
      const side = t < 0.5 ? -1 : 1;
      const u = t < 0.5 ? 1 - t * 2 : (t - 0.5) * 2;
      return [mx + side * u * mw * 0.75, my - Math.sin(u * Math.PI) * mw * 0.18 - (u > 0.85 ? (u - 0.85) * mw * 1.2 : 0)];
    });
    return {
      update(lt, f) {
        const rm = f.rm;
        rig.actor?.pose(lt, 140, 1180 + bob(lt, rm, 8), { rot: 0.06, flip: true });
        const la = lanternAt(rig);
        lamp.position.set(la[0], la[1]);
        const dm = seg(lt, 0.5, 1.8);
        const dw = seg(lt, 2.0, 3.4);
        const g = light.clear();
        const n = Math.floor(MPATH.length * (rm ? (dm > 0 ? 1 : 0) : dm));
        if (n > 1) {
          g.moveTo(MPATH[0][0], MPATH[0][1]);
          for (let i = 1; i < n; i++) g.lineTo(MPATH[i][0], MPATH[i][1]);
          g.stroke({ width: 18, color: LANTERN, alpha: 0.85, cap: 'round', join: 'round' });
          g.moveTo(MPATH[0][0], MPATH[0][1]);
          for (let i = 1; i < n; i++) g.lineTo(MPATH[i][0], MPATH[i][1]);
          g.stroke({ width: 6, color: 0xffffff, cap: 'round', join: 'round' });
        }
        nm.clear().rect(nsb.x - 260, nsb.y - 80, 520 * (rm ? (dw > 0 ? 1 : 0) : dw), 160).fill(0xffffff);
        nsb.visible = dw > 0;
        // the beam follows the drawing head (cover px → plane px)
        let tgt: [number, number];
        if (lt < 2.0) tgt = MPATH[Math.max(0, Math.min(MPATH.length - 1, n - 1))];
        else tgt = [nsb.x - 260 + 520 * dw, nsb.y + Math.sin(dw * 22) * 20];
        const cs = Math.cos(paper.rotation) * paper.scale.x;
        const sn = Math.sin(paper.rotation) * paper.scale.x;
        const px = paper.x + (tgt[0] - 750) * cs - (tgt[1] - 540) * sn;
        const py = paper.y + (tgt[0] - 750) * sn + (tgt[1] - 540) * cs;
        const on = lt < 3.6 ? 1 : 0.35;
        beam.set(la, [px - 40, py + 30], 50, 0.5 * on);
        bit.update(lt - 5.05, rm);
      },
    };
  },
};
