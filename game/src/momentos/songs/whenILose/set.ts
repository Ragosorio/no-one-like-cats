/**
 * WHEN I LOSE — the drowned reading hall, drawn ONCE in illuminated color (the ink filter redraws it in sumi-e when the
 * silence rules). Everything here is static geometry built at load; stage.ts moves it (parallax, the bob, the flood).
 *
 *  - the far wall: a gothic vault with a ROSE WINDOW (stained glass) and the gallery of bookcases
 *  - bookcases (three depths), half under the water, some tilted (drowned), books with gilded spines
 *  - our sloop (Canelo's), facing right · «La Sala de Lectura Hundida» (the Bibliotecario's galleon), facing left
 */
import { Container, Graphics } from 'pixi.js';
import { rng } from '../../anime/draw';

export const WATER = 700;
export const A_X = 520;
export const B_X = 1420;

/** the manuscript's colors: lapis, vermilion, malachite, ochre, umber, gold leaf (hue ~43°: the filter gilds it) */
export const C = {
  lapis: 0x1f3f8f,
  lapisDeep: 0x14275a,
  vermilion: 0xc8321e,
  malachite: 0x1f7a5c,
  ochre: 0xc98e3a,
  umber: 0x4a2f1f,
  umberDeep: 0x2b1b12,
  wood: 0x7b4b2a,
  woodDark: 0x4e2e19,
  parchment: 0xf1e2c0,
  parchShade: 0xd8c39a,
  gold: 0xd9a63a,
  goldLight: 0xf2cf6a,
  teal: 0x1d5560,
  tealDeep: 0x123940,
  plum: 0x5a2346,
  ink: 0x15131c,
  candle: 0xffd27a,
};
const BOOK_COLS = [C.vermilion, C.lapis, C.malachite, C.ochre, C.plum, 0x8a2a1e, 0x2a5a8a, C.umber, 0x3d6b3a, 0x9a6a2a];

/** a row of books on a shelf from x0 to x1, bottom at y, max height h (gilded bands on some spines) */
function books(g: Graphics, x0: number, x1: number, y: number, h: number, R: () => number, scale = 1) {
  let x = x0;
  const far = scale < 0.7;
  while (x < x1 - 4 * scale) {
    const w = (far ? 26 + R() * 40 : 8 + R() * 16) * scale;
    const bh = h * (0.62 + R() * 0.38);
    const lean = R() < 0.08 ? (R() - 0.5) * 0.5 : 0;
    const col = BOOK_COLS[Math.floor(R() * BOOK_COLS.length)];
    if (lean) {
      const dx = Math.sin(lean) * bh;
      g.poly([x, y, x + w, y, x + w + dx, y - bh, x + dx, y - bh]).fill(col);
    } else {
      g.rect(x, y - bh, Math.min(w, x1 - x), bh).fill(col);
      if (R() < (far ? 0.15 : 0.45)) g.rect(x, y - bh * 0.82, Math.min(w, x1 - x), 2.5 * scale).fill(C.gold).rect(x, y - bh * 0.22, Math.min(w, x1 - x), 2.5 * scale).fill(C.gold);
    }
    x += w + (R() < 0.1 ? 6 * scale : 1);
  }
}

/** a bookcase facade: frame, shelves and books (local origin bottom-left) */
export function bookcase(g: Graphics, x: number, y: number, w: number, h: number, seed: number, scale = 1, opts: { tilt?: number; top?: boolean } = {}) {
  const R = rng(seed);
  const fw = 14 * scale;
  g.rect(x, y - h, w, h).fill(C.umberDeep);
  const shelfH = 110 * scale;
  const n = Math.floor((h - fw) / shelfH);
  for (let i = 0; i < n; i++) {
    const sy = y - fw - i * shelfH;
    books(g, x + fw, x + w - fw, sy, shelfH - 18 * scale, R, scale);
    g.rect(x, sy, w, 8 * scale).fill(C.wood);
  }
  g.rect(x, y - h, fw, h).fill(C.wood).rect(x + w - fw, y - h, fw, h).fill(C.wood);
  if (opts.top !== false) {
    g.rect(x - 8 * scale, y - h - 18 * scale, w + 16 * scale, 22 * scale).fill(C.woodDark);
    // a carved crest with a gilded medallion
    g.poly([x + w * 0.3, y - h - 18 * scale, x + w * 0.5, y - h - 70 * scale, x + w * 0.7, y - h - 18 * scale]).fill(C.woodDark);
    g.circle(x + w * 0.5, y - h - 40 * scale, 12 * scale).fill(C.gold);
  }
}

/** the far wall: vault, columns, rose window, galleries of books (very large; parallax 0.85) */
export function drawFarWall(g: Graphics) {
  // the nave's back wall, warm umber, with a lighter vault
  g.rect(-2400, -1600, 6720, 4200).fill(C.umberDeep);
  g.rect(-2400, -1600, 6720, 900).fill(0x2a1e18);
  // gothic arches along the wall
  for (let i = -6; i <= 12; i++) {
    const x = 960 + i * 320;
    g.rect(x - 22, -900, 44, 1700).fill(0x3c2a1f);
    g.moveTo(x - 160, -700).quadraticCurveTo(x, -980, x + 160, -700).stroke({ width: 26, color: 0x3c2a1f });
  }
  // two tiers of galleries full of books
  for (const [y, h, s] of [[WATER - 40, 560, 0.62]] as const) {
    let x = -2300;
    let seed = Math.round(y);
    while (x < 4200) {
      const w = 240 + ((seed * 37) % 120);
      bookcase(g, x, y, w, h, seed++, s, { top: true });
      x += w + 160;
    }
    // the gallery's balustrade
    g.rect(-2400, y - h - 46, 6720, 16).fill(C.woodDark);
    for (let bx = -2400; bx < 4300; bx += 38) g.rect(bx, y - h - 36, 8, 32).fill(C.woodDark);
  }
  // the ROSE WINDOW high up the nave: stained glass in twelve petals
  const rx = 960;
  const ry = -560;
  g.circle(rx, ry, 330).fill(0x2a1a12);
  const petal = [C.lapis, C.vermilion, C.lapis, C.malachite, C.lapis, C.goldLight];
  for (let i = 0; i < 12; i++) {
    const a0 = (i / 12) * Math.PI * 2;
    const a1 = ((i + 1) / 12) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    g.poly([rx, ry, rx + Math.cos(a0) * 300, ry + Math.sin(a0) * 300, rx + Math.cos(am) * 320, ry + Math.sin(am) * 320, rx + Math.cos(a1) * 300, ry + Math.sin(a1) * 300]).fill(petal[i % petal.length]);
    g.circle(rx + Math.cos(am) * 210, ry + Math.sin(am) * 210, 46).fill(petal[(i + 3) % petal.length]);
    g.moveTo(rx, ry).lineTo(rx + Math.cos(a0) * 318, ry + Math.sin(a0) * 318).stroke({ width: 9, color: 0x2a1a12 });
  }
  g.circle(rx, ry, 110).fill(C.gold);
  g.circle(rx, ry, 80).fill(C.vermilion);
  g.circle(rx, ry, 40).fill(C.goldLight);
  g.circle(rx, ry, 318).stroke({ width: 16, color: 0x2a1a12 });
  g.circle(rx, ry, 150).stroke({ width: 9, color: 0x2a1a12 });
}

/** hanging lamps on long chains from the vault (drawn at origin; the stage sways them) */
export function lamp(g: Graphics, chain: number) {
  g.moveTo(0, -chain).lineTo(0, 0).stroke({ width: 4, color: C.woodDark });
  g.poly([-26, 0, 26, 0, 18, 50, -18, 50]).fill(C.gold);
  g.rect(-14, 6, 28, 38).fill(0xfff3d6);
  g.poly([-30, 0, 0, -26, 30, 0]).fill(C.woodDark);
  g.rect(-20, 50, 40, 8).fill(C.woodDark);
}

/** a drifting book (open, pages fanned) — origin at its centre */
export function driftBook(g: Graphics, color: number, s = 1) {
  g.poly([-60 * s, 0, 0, 10 * s, 60 * s, 0, 60 * s, -8 * s, 0, 2 * s, -60 * s, -8 * s]).fill(color);
  g.poly([-56 * s, -8 * s, 0, 2 * s, 56 * s, -8 * s, 52 * s, -40 * s, 0, -30 * s, -52 * s, -40 * s]).fill(C.parchment);
  for (let i = 0; i < 4; i++) {
    g.moveTo(-46 * s, (-30 + i * 6) * s).lineTo(-8 * s, (-22 + i * 6) * s).stroke({ width: 2 * s, color: C.parchShade });
    g.moveTo(8 * s, (-22 + i * 6) * s).lineTo(46 * s, (-30 + i * 6) * s).stroke({ width: 2 * s, color: C.parchShade });
  }
}

// ------------------------------------------------------------------ ships
/** our sloop: Canelo's ship (faces right). Local origin = waterline centre. */
export class Sloop extends Container {
  hull = new Graphics();
  rig = new Graphics();
  deck = new Container();
  constructor() {
    super();
    const h = this.hull;
    // hull: warm wood, a gold rail, a vermilion stripe
    h.poly([-300, -150, 300, -150, 360, -190, 250, 30, -250, 30, -320, -120]).fill(C.wood);
    h.poly([-300, -150, 300, -150, 286, -118, -296, -118]).fill(C.vermilion);
    for (let i = 0; i < 4; i++) h.moveTo(-280 + i * 6, -90 + i * 30).lineTo(300 - i * 20, -90 + i * 30).stroke({ width: 3, color: C.woodDark });
    h.rect(-310, -168, 660, 18).fill(C.gold);
    for (let x = -280; x <= 300; x += 46) h.rect(x, -200, 8, 34).fill(C.woodDark);
    h.rect(-310, -206, 640, 10).fill(C.woodDark);
    // two small cannons (ports)
    for (const x of [-120, 90]) h.circle(x, -86, 18).fill(C.umberDeep).circle(x, -86, 11).fill(C.ink);
    // bowsprit + the lantern hook at the bow
    h.moveTo(330, -190).lineTo(470, -250).stroke({ width: 12, color: C.woodDark });
    const r = this.rig;
    r.rect(-56, -720, 18, 580).fill(C.woodDark);
    // the sail: parchment with a vermilion paw
    r.poly([-30, -690, 230, -640, 250, -260, -30, -250]).fill(C.parchment);
    r.poly([-30, -690, 230, -640, 238, -560, -30, -600]).fill(C.parchShade);
    r.circle(110, -430, 52).fill(C.vermilion);
    for (const [dx, dy] of [
      [-40, -70],
      [0, -86],
      [40, -70],
      [62, -36],
    ])
      r.circle(110 + dx, -430 + dy, 18).fill(C.vermilion);
    r.moveTo(-40, -720).lineTo(470, -250).stroke({ width: 3, color: C.woodDark });
    r.moveTo(-50, -720).lineTo(-310, -200).stroke({ width: 3, color: C.woodDark });
    // the pennant
    r.poly([-56, -720, -140, -700, -56, -690]).fill(C.lapis);
    this.addChild(r, h, this.deck);
  }
}

/** «La Sala de Lectura Hundida»: a galleon carrying a reading room (faces left). Local origin = waterline centre. */
export class Galleon extends Container {
  hull = new Graphics();
  room = new Graphics();
  sails = new Graphics();
  deck = new Container();
  /** the lectern's book (opens / slams: the stage draws it) */
  lectern = new Graphics();
  constructor() {
    super();
    const h = this.hull;
    h.poly([-440, -200, 420, -230, 460, -320, 380, 40, -330, 40, -480, -120]).fill(C.teal);
    h.poly([-440, -200, 420, -230, 410, -196, -436, -170]).fill(C.gold);
    for (let i = 0; i < 4; i++) h.moveTo(-420 + i * 14, -140 + i * 38).lineTo(400 - i * 20, -160 + i * 40).stroke({ width: 3, color: C.tealDeep });
    // brass cannons (ink-well mouths)
    for (const x of [-300, -150, 0, 150]) {
      h.circle(x, -100, 24).fill(C.gold).circle(x, -100, 14).fill(C.ink);
    }
    // the figurehead: an open book on the bow (left)
    h.poly([-480, -120, -560, -170, -520, -230, -470, -200]).fill(C.gold);
    h.poly([-560, -170, -620, -210, -560, -260, -520, -230]).fill(C.parchment);
    h.poly([-520, -230, -560, -260, -500, -290, -470, -250]).fill(C.parchment);
    // the reading room on deck: arched windows with candle light, bookcases, a cupola
    const r = this.room;
    r.rect(-330, -560, 640, 340).fill(0xb08a5e);
    for (let i = 0; i < 4; i++) {
      const x = -280 + i * 150;
      r.rect(x, -500, 90, 170).fill(C.candle);
      r.circle(x + 45, -500, 45).fill(C.candle);
      r.rect(x + 41, -540, 8, 210).fill(C.umberDeep);
      r.rect(x, -420, 90, 8).fill(C.umberDeep);
    }
    r.rect(-350, -580, 680, 26).fill(C.gold);
    r.poly([-120, -580, 0, -700, 120, -580]).fill(C.tealDeep);
    r.circle(0, -700, 16).fill(C.gold);
    bookcase(r, -330, -222, 150, 120, 91, 0.5, { top: false });
    bookcase(r, 170, -222, 140, 120, 92, 0.5, { top: false });
    // masts with PAGE SAILS (parchment covered in writing)
    const s = this.sails;
    for (const [mx, top] of [
      [-200, -1020],
      [230, -960],
    ] as const) {
      s.rect(mx - 9, top, 18, -top - 200).fill(C.woodDark);
      s.poly([mx - 170, top + 60, mx + 170, top + 40, mx + 180, top + 330, mx - 160, top + 350]).fill(C.parchment);
      for (let i = 0; i < 9; i++) s.moveTo(mx - 140, top + 90 + i * 28).lineTo(mx + 150 - (i % 3) * 30, top + 80 + i * 28).stroke({ width: 3, color: C.parchShade });
      s.circle(mx + 120, top + 300, 26).fill(C.vermilion);
    }
    s.poly([-200, -1020, -110, -1000, -200, -985]).fill(C.vermilion);
    this.addChild(s, h, this.room, this.lectern, this.deck);
  }
}
