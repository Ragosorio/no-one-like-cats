/**
 * ACTO II — the BACKDROPS of FILM-ACTO1's briefing template for the act's two boxes (every Carta stage without its own
 * film: plantilla/, registerBriefingSkin in ./index.ts). Contract (plantilla/sets.ts): `backdrop(ctx, { title, seed })`
 * → `{ root, glows, door }` — the place drawn once (baked static), the lights that breathe, the point where the
 * footprints lead and the rival comes out.
 *
 *   comicStreet  CIUDAD MAYÚSCULA — a comic street at dusk: halftone sky, towers, the place's name on a marquee
 *   animeGate    MAR SHŌNEN — a stone dojo gate on the shōnen sea: banded sky, banners, the name on a vertical banner
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { SceneCtx } from '../../stage';
import { castTex, CMY, INK, dotsFill, rnd, wordM } from './kit';

interface Args {
  title: string;
  seed: number;
}
function glowAt(ctx: SceneCtx, x: number, y: number, w: number, h: number, tint: number): Sprite {
  const s = new Sprite(castTex(ctx, 'glow'));
  s.anchor.set(0.5);
  s.position.set(x, y);
  s.scale.set(w / 256, h / 256);
  s.tint = tint;
  return s;
}

export function comicStreet(ctx: SceneCtx, a: Args): { root: Container; glows: Sprite[]; door: [number, number] } {
  const root = new Container();
  const g = new Graphics();
  const s = a.seed;
  const sky = [0x2a1450, 0x4a1f6e, 0x8a2a7e, 0xc8386e, 0xf0604a];
  sky.forEach((c, i) => g.rect(-400, -400 + i * 150, 2720, 151).fill(c));
  root.addChild(g);
  root.addChild(dotsFill(ctx.tex('ar:dots'), 2720, 900, { tint: CMY.magenta, scale: 0.55, alpha: 0.25, x: -400, y: -400 }));
  const b = new Graphics();
  for (let i = 0; i < 16; i++) {
    const w = 130 + rnd(i + s) * 120;
    const h = 260 + rnd(i + 30 + s) * 340;
    const x = -380 + i * 180;
    b.rect(x, 760 - h, w, h + 40).fill(i % 2 ? 0x3a1a5e : 0x2c1450).stroke({ width: 6, color: INK });
    for (let j = 0; j < 8; j++) if (rnd(i * 13 + j + s) > 0.5) b.rect(x + 16 + (j % 3) * 36, 790 - h + Math.floor(j / 3) * 60, 18, 28).fill(0xffd23a);
  }
  // the storefront: a marquee with the place's name, the door
  const walls = [0x2a54c8, 0xe5322d, 0x2fae5a, 0xff8a1e, 0x6a3aa8];
  b.rect(400, 300, 1120, 480).fill(walls[s % walls.length]).stroke({ width: 8, color: INK });
  b.rect(470, 190, 980, 150).fill(INK).stroke({ width: 8, color: 0xffd23a });
  for (let i = 0; i < 22; i++) b.circle(490 + i * 44, 200, 8).fill(0xfff6c0).circle(490 + i * 44, 330, 8).fill(0xfff6c0);
  b.rect(840, 460, 240, 320).fill(0x0d0a14).stroke({ width: 8, color: INK });
  b.rect(460, 470, 300, 220).fill(0xffe9a0).stroke({ width: 6, color: INK }).rect(1160, 470, 300, 220).fill(0xffe9a0).stroke({ width: 6, color: INK });
  b.rect(-400, 780, 2720, 400).fill(0x1a1030);
  for (let i = 0; i < 12; i++) b.rect(-300 + i * 220, 900, 120, 10).fill({ color: 0xffd23a, alpha: 0.6 });
  root.addChild(b);
  const name = wordM(ctx.k, a.title.toUpperCase(), { fontFamily: 'Bangers', fontSize: a.title.length > 18 ? 66 : 90, fill: 0xffd23a, letterSpacing: 4, stroke: { color: CMY.red, width: 8, join: 'round' } });
  name.position.set(960, 268);
  root.addChild(name);
  const glows = [glowAt(ctx, 960, 265, 1100, 260, 0xffd23a), glowAt(ctx, 610, 580, 420, 300, 0xffe9a0), glowAt(ctx, 1310, 580, 420, 300, 0xffe9a0)];
  return { root, glows, door: [960, 770] };
}

export function animeGate(ctx: SceneCtx, a: Args): { root: Container; glows: Sprite[]; door: [number, number] } {
  const root = new Container();
  const g = new Graphics();
  const s = a.seed;
  [0x3a7ae0, 0x5a9af0, 0x8ac0ff, 0xc8e4ff].forEach((c, i) => g.rect(-400, -400 + i * 220, 2720, 221).fill(c));
  // clouds in flat cel, the sea, a far islet
  for (let i = 0; i < 6; i++) g.ellipse(-200 + i * 480 + rnd(i + s) * 100, 120 + rnd(i + 2) * 120, 200, 60).fill(0xffffff).stroke({ width: 5, color: 0x14121e });
  g.rect(-400, 600, 2720, 600).fill(0x2a6ac8);
  for (let i = 0; i < 20; i++) g.rect(-300 + rnd(i + s) * 2500, 640 + rnd(i + 3) * 300, 90, 6).fill({ color: 0xffffff, alpha: 0.6 });
  g.ellipse(1700, 640, 300, 60).fill(0x5a8a5a).stroke({ width: 6, color: 0x14121e });
  // the stone dojo gate: two pillars, two beams (a gate of the arena), banners on both sides
  g.rect(-400, 760, 2720, 420).fill(0xb8a890).stroke({ width: 8, color: 0x14121e });
  g.rect(640, 260, 90, 520).fill(0x8a2a22).stroke({ width: 8, color: 0x14121e }).rect(1190, 260, 90, 520).fill(0x8a2a22).stroke({ width: 8, color: 0x14121e });
  g.poly([520, 230, 1400, 230, 1440, 190, 480, 190]).fill(0x5a1a14).stroke({ width: 8, color: 0x14121e });
  g.rect(580, 300, 760, 46).fill(0x8a2a22).stroke({ width: 7, color: 0x14121e });
  g.rect(730, 360, 460, 420).fill(0x14121e);
  for (const [x, c] of [
    [400, 0xe5322d],
    [1520, 0xffd23a],
  ] as const) {
    g.rect(x - 4, 300, 8, 480).fill(0x14121e);
    g.rect(x + 4, 320, 110, 300).fill(c).stroke({ width: 5, color: 0x14121e });
  }
  root.addChild(g);
  // the place's name on the vertical banner over the gate
  const plate = new Graphics().rect(860, 380, 200, 330).fill(0xfffaf0).stroke({ width: 6, color: 0x14121e });
  root.addChild(plate);
  const words = a.title.toUpperCase().split(' ').slice(0, 4);
  words.forEach((w, i) => {
    const t = wordM(ctx.k, w, { fontFamily: 'Dela Gothic One', fontSize: Math.min(54, 170 / (Math.max(3, w.length) * 0.66)), fill: 0x14121e });
    t.position.set(960, 430 + i * 72);
    root.addChild(t);
  });
  const glows = [glowAt(ctx, 960, 540, 520, 520, 0xffe9a0), glowAt(ctx, 455, 470, 260, 380, 0xff9a7a)];
  return { root, glows, door: [960, 790] };
}
export const backdrop = comicStreet;
