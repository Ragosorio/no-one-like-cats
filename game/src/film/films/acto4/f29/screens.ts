/**
 * F29 — what the LED screens show: the game's START SCREEN, the HUD that eats the show, the pirate signal.
 * All 8-bit type is the code-drawn pixel font (styles/pop.ts pixelText): no font file, no logo.
 */
import { Container, Graphics } from 'pixi.js';
import { POP, pixelText, pixelWidth } from '../../../styles/pop';
import { rnd } from '../kit';

/** a pixel star field + a frame (the background of every game screen) */
export function gameBg(w: number, h: number, seed = 1, col: number = 0x07041a): Graphics {
  const g = new Graphics().rect(0, 0, w, h).fill(col);
  for (let i = 0; i < 70; i++) g.rect(Math.floor(rnd(i + seed) * (w / 8)) * 8, Math.floor(rnd(i * 3 + seed) * (h / 8)) * 8, 8, 8).fill({ color: i % 5 ? 0x6a6aa8 : 0xffffff, alpha: 0.8 });
  g.rect(16, 16, w - 32, 8).fill(POP.pink).rect(16, h - 24, w - 32, 8).fill(POP.pink).rect(16, 16, 8, h - 32).fill(POP.pink).rect(w - 24, 16, 8, h - 32).fill(POP.pink);
  return g;
}

/** the START SCREEN of the main LED (1600 × 900): FIRMA · EL SHOW MÁS GRANDE DEL ARCHIVO · PRESS START (blinks) */
export function startScreen(w = 1600, h = 900): { root: Container; press: Graphics; title: Graphics } {
  const root = new Container();
  root.addChild(gameBg(w, h, 7));
  const title = new Graphics();
  pixelText(title, 'FIRMA', w / 2, 190, 30, POP.gold, { align: 'center', shadow: POP.hot });
  // a pixel signature flourish under the title (a stepped curve)
  for (let i = 0; i < 40; i++) title.rect(w / 2 - 480 + i * 24, 430 + Math.round(Math.sin(i * 0.4) * 3) * 8, 24, 8).fill(POP.gold);
  pixelText(title, 'EL SHOW MÁS GRANDE DEL ARCHIVO', w / 2, 500, 8, 0xffffff, { align: 'center' });
  root.addChild(title);
  const press = new Graphics();
  pixelText(press, 'PRESS START', w / 2, 650, 14, POP.cyan, { align: 'center', shadow: POP.violet });
  root.addChild(press);
  const foot = new Graphics();
  pixelText(foot, '★ LA GIRA ★  1 JUGADOR', w / 2, 820, 5, 0x9a9ad8, { align: 'center' });
  root.addChild(foot);
  return { root, press, title };
}

/** a HUD panel: a dark plate with pixel lines (each line can be toggled) */
export function hudPlate(lines: { text: string; px: number; color: number }[], w: number, o: { pad?: number; plate?: number; border?: number } = {}): { root: Container; rows: Graphics[] } {
  const root = new Container();
  const pad = o.pad ?? 24;
  let y = pad;
  const rows: Graphics[] = [];
  for (const l of lines) {
    const g = new Graphics();
    pixelText(g, l.text, w / 2, y, l.px, l.color, { align: 'center', shadow: 0x000000 });
    rows.push(g);
    y += l.px * 7 + l.px * 4;
  }
  const h = y + pad - 12;
  const plate = new Graphics().rect(0, 0, w, h).fill({ color: o.plate ?? 0x05030c, alpha: 0.82 }).rect(0, 0, w, h).stroke({ width: 8, color: o.border ?? POP.cyan });
  root.addChild(plate, ...rows);
  return { root, rows };
}

/** a pixel crosshair box (the HUD's cursor over the prize) */
export function cursorBox(g: Graphics, x: number, y: number, w: number, h: number, color: number = POP.red, px = 8) {
  const L = Math.min(w, h) * 0.3;
  for (const [cx, cy, sx, sy] of [
    [x, y, 1, 1],
    [x + w, y, -1, 1],
    [x, y + h, 1, -1],
    [x + w, y + h, -1, -1],
  ] as const) {
    g.rect(cx - (sx < 0 ? px : 0), cy - (sy < 0 ? px : 0), sx * L, px).fill(color);
    g.rect(cx - (sx < 0 ? px : 0), cy - (sy < 0 ? px : 0), px, sy * L).fill(color);
  }
}

/** a pixel loading bar «CARGANDO SHOW…» at p (0..1) */
export function loadingBar(g: Graphics, x: number, y: number, w: number, p: number, px = 8) {
  pixelText(g, 'CARGANDO SHOW...', x + w / 2, y, px, 0xffffff, { align: 'center' });
  const by = y + px * 10;
  g.rect(x, by, w, px * 6).stroke({ width: px, color: 0xffffff });
  const n = Math.floor((w - px * 4) / (px * 3));
  for (let i = 0; i < Math.floor(n * p); i++) g.rect(x + px * 2 + i * px * 3, by + px * 1.5, px * 2, px * 3).fill(POP.mint);
  pixelText(g, `${Math.round(p * 100)}%`, x + w + px * 3, by + px * 0.5, px, POP.mint);
}

/** the pirate banner «ESTA LLAVE ES NUESTRA» across a screen (w wide) */
export function pirateBanner(w: number, px = 10): Graphics {
  const g = new Graphics();
  const t = 'ESTA LLAVE ES NUESTRA';
  const tw = pixelWidth(t, px);
  const s = Math.min(1, (w - 60) / tw);
  g.rect(0, 0, w, px * 11).fill(0x000000);
  pixelText(g, t, w / 2, px * 2, px * s, 0x5cff8a, { align: 'center', shadow: POP.hot });
  return g;
}

/** the corrupted motto, written on the strip: NO G@ME NO LIF€ */
export function motto(w: number, h: number): Graphics {
  const g = new Graphics().rect(0, 0, w, h).fill(0x05030c);
  const px = Math.floor(h / 11);
  let x = 40;
  while (x < w) {
    pixelText(g, 'NO G@ME NO LIF€ ·', x, (h - px * 7) / 2, px, POP.hot);
    x += pixelWidth('NO G@ME NO LIF€ · ', px);
  }
  return g;
}
