/**
 * YONOSE TODO — the set, drawn ONCE in clean flat color (world px; the wide shot is the 1920×1080 box). It is never
 * seen like this: the Animatic filter (paper.ts) redraws it per pixel as pencil, watercolor or paint. So the drawing
 * here is about SHAPES and VALUES (what reads as an edge, what reads as a shadow to hatch), not about line work.
 *
 *   the night sea (wave bands that swell with the bass) · the island (grass, path, rocks, cliff) · the FARO (stripes,
 *   gallery, lantern room, dome) and its beam · the blank PAGE on the grass (it is paper: no line ever crosses it) ·
 *   the moon · the player's giant pencil · the far hand of light · the six dream panels (dream.ts)
 */
import { Container, Graphics } from 'pixi.js';
import { rng, vnoise } from '../../anime/draw';
import { P } from './times';

export const SEA_DEEP = 0x35507a;
export const SEA_LIGHT = 0x7fa6c9;
export const GRASS = 0x4f7d4f;
export const GRASS_DARK = 0x355c3d;
export const LANTERN = 0xffc94a;

/** the island's outline (world px), left → right along the top */
const TOP = [-700, 760, -260, 722, 160, 694, 470, 674, 700, 662, 900, 672, 1120, 700, 1360, 714, 1560, 738, 1720, 792, 1830, 870, 1930, 990];
const ISLAND = [-700, 1700, ...TOP, 2100, 1700];

/** where the island's cats sit (world px, bottom-centre) and how tall they are */
export const SEATS: [number, number, number][] = [
  [392, 712, 128],
  [536, 700, 120],
  [868, 694, 112],
  [1196, 742, 122],
  [1420, 752, 132],
  [1588, 788, 126],
  [250, 734, 130],
  [1700, 846, 118],
];

export class IslandSet {
  readonly root = new Container();
  readonly moon = new Graphics();
  readonly sea = new Graphics();
  readonly island = new Graphics();
  readonly beam = new Graphics();
  readonly faro = new Graphics();
  readonly page = new Graphics();
  /** cats live here (between the page and the pencil) */
  readonly actors = new Container();
  readonly dream = new Container();
  readonly pencil = new Graphics();
  readonly hand = new Graphics();
  private seaStep = -1;
  private beamStep = -1;

  constructor() {
    this.actors.sortableChildren = true;
    this.root.addChild(this.moon, this.sea, this.beam, this.island, this.faro, this.page, this.actors, this.dream, this.hand, this.pencil);
    this.drawMoon();
    this.drawIsland();
    this.drawFaro();
    this.drawPencil();
    this.drawHand();
  }

  private drawMoon() {
    const [x, y] = P.moon;
    this.moon.circle(x, y, 62).fill(0xf6ecc8);
    this.moon.circle(x - 18, y - 12, 11).fill(0xe2d4a8).circle(x + 20, y + 16, 8).fill(0xe2d4a8).circle(x + 6, y - 26, 5).fill(0xe2d4a8);
  }

  private drawIsland() {
    const g = this.island;
    g.poly(ISLAND).fill(GRASS);
    // a darker band down the slope (a value to hatch in pencil, a wash shadow in watercolor)
    const band: number[] = [];
    for (let i = 0; i < TOP.length; i += 2) band.push(TOP[i], TOP[i + 1] + 90 + Math.max(0, (TOP[i] - 1400) * 0.25));
    g.poly([-700, 1700, ...band, 2100, 1700]).fill(GRASS_DARK);
    // the cliff on the right (rock) and its foot in the sea
    g.poly([1560, 738, 1720, 792, 1830, 870, 1930, 990, 2000, 1100, 1880, 1080, 1760, 940, 1660, 840]).fill(0x7a6650);
    g.poly([1700, 860, 1790, 930, 1860, 1040, 1770, 1020]).fill(0x5d4c3d);
    // the sandy path up to the faro
    g.poly([470, 1700, 560, 1100, 640, 860, 680, 690, 720, 690, 740, 860, 760, 1100, 720, 1700]).fill(0xd9c49a);
    // rocks and grass tufts (seeded)
    const R = rng(64);
    for (let i = 0; i < 26; i++) {
      const x = -300 + R() * 2000;
      const y = this.topAt(x) + 30 + R() * 340;
      if (Math.abs(x - P.page[0]) < 230 && y < 820) continue;
      if (R() < 0.3) g.ellipse(x, y, 16 + R() * 22, 9 + R() * 10).fill(0x8c8273);
      else g.poly([x - 14, y, x - 4, y - 26 - R() * 16, x + 2, y - 4, x + 8, y - 22 - R() * 12, x + 14, y]).fill(0x6c9a5e);
    }
  }

  /** the island's top at x (linear between the outline points) */
  topAt(x: number) {
    for (let i = 0; i < TOP.length - 2; i += 2) {
      const x0 = TOP[i];
      const x1 = TOP[i + 2];
      if (x >= x0 && x <= x1) return TOP[i + 1] + ((TOP[i + 3] - TOP[i + 1]) * (x - x0)) / (x1 - x0);
    }
    return TOP[TOP.length - 1];
  }

  private drawFaro() {
    const g = this.faro;
    const [x, y] = P.faro;
    const top = 312;
    // tower (white) with three red bands
    g.poly([x - 78, y, x + 78, y, x + 50, top, x - 50, top]).fill(0xf3efe4);
    const at = (yy: number) => 78 - ((78 - 50) * (y - yy)) / (y - top);
    for (const [a, b] of [
      [y - 70, y - 120],
      [y - 190, y - 240],
      [y - 300, y - 340],
    ]) {
      g.poly([x - at(a), a, x + at(a), a, x + at(b), b, x - at(b), b]).fill(0xc9473d);
    }
    // shade side (a value: hatching in pencil, a cool wash)
    g.poly([x + 18, y, x + 78, y, x + 50, top, x + 12, top]).fill({ color: 0x8c8aa0, alpha: 0.28 });
    // door and windows
    g.roundRect(x - 18, y - 62, 36, 62, 14).fill(0x3a3036);
    g.roundRect(x - 9, y - 260, 18, 28, 8).fill(0x3a3036);
    g.roundRect(x - 8, y - 160, 16, 24, 8).fill(0x3a3036);
    // gallery + rail
    g.rect(x - 72, top - 12, 144, 14).fill(0x34343c);
    for (let i = -64; i <= 64; i += 16) g.rect(x + i - 2, top - 34, 4, 22).fill(0x34343c);
    g.rect(x - 70, top - 36, 140, 5).fill(0x34343c);
    // lantern room (warm glass) and dome
    g.rect(x - 40, top - 82, 80, 70).fill(LANTERN);
    g.rect(x - 3, top - 82, 6, 70).fill(0x34343c).rect(x - 40, top - 82, 5, 70).fill(0x34343c).rect(x + 35, top - 82, 5, 70).fill(0x34343c);
    g.poly([x - 48, top - 82, x + 48, top - 82, x + 30, top - 112, x, top - 124, x - 30, top - 112]).fill(0xb23c35);
    g.rect(x - 3, top - 150, 6, 30).fill(0x34343c);
    g.circle(x, top - 152, 6).fill(0x34343c);
  }

  /** the page: paper (no line crosses it), a soft shadow, a glow that breathes on the keys */
  drawPage(glow: number, lift: number) {
    const g = this.page;
    g.clear();
    const [x, y] = P.page;
    const yy = y - lift;
    g.ellipse(x + 12, y + 18, 190, 26).fill({ color: 0x1d2a26, alpha: 0.32 });
    if (glow > 0.01) g.ellipse(x, yy, 230 + 30 * glow, 64 + 10 * glow).fill({ color: 0xfff6d8, alpha: 0.18 * glow });
    g.poly([x - 150, yy - 34, x + 146, yy - 36, x + 178, yy + 28, x - 172, yy + 30]).fill(0xfffcf2);
    // the curled corner
    g.poly([x + 146, yy - 36, x + 160, yy - 10, x + 136, yy - 18]).fill(0xe9e2d0);
  }

  /** the night sea: bands that swell with the bass (redrawn on twos) */
  drawSea(step: number, swell: number, t: number) {
    if (step === this.seaStep) return;
    this.seaStep = step;
    const g = this.sea;
    g.clear();
    const h0 = P.horizon;
    g.rect(-1400, h0, 4800, 1400).fill(SEA_DEEP);
    for (let r = 0; r < 9; r++) {
      const y = h0 + 14 + r * r * 7 + r * 10;
      const amp = (3 + r * 1.6) * (1 + swell * 1.6);
      const pts: number[] = [];
      for (let x = -1400; x <= 3400; x += 60) pts.push(x, y + Math.sin(x * 0.008 + r * 1.7 + t * (0.6 + r * 0.1)) * amp + vnoise(x * 0.01 + r * 3, r) * 3);
      const thick = 2.5 + r * 1.1;
      const back: number[] = [];
      for (let i = pts.length - 2; i >= 0; i -= 2) back.push(pts[i], pts[i + 1] + thick);
      g.poly([...pts, ...back]).fill({ color: SEA_LIGHT, alpha: 0.55 + r * 0.04 });
    }
  }

  /** the faro's beam: a pale cone sweeping (redrawn on twos), brighter on the kicks */
  drawBeam(step: number, ang: number, on: number, pulse: number) {
    const key = step * 10 + Math.round(on * 9);
    if (key === this.beamStep && pulse < 0.05) return;
    this.beamStep = key;
    const g = this.beam;
    g.clear();
    if (on <= 0.01) return;
    const [x, y] = P.lamp;
    const L = 1500;
    const sp = 0.09 + pulse * 0.02;
    const a0 = ang - sp;
    const a1 = ang + sp;
    g.poly([x, y - 10, x, y + 10, x + Math.cos(a1) * L, y + Math.sin(a1) * L, x + Math.cos(a0) * L, y + Math.sin(a0) * L]).fill({ color: 0xfff2c0, alpha: (0.22 + pulse * 0.18) * on });
  }

  private drawPencil() {
    const g = this.pencil;
    // drawn pointing DOWN-LEFT from its tip at (0, 0): wood cone, graphite point, a long yellow body, ferrule, eraser
    const L = 980;
    const W2 = 26;
    g.poly([0, 0, 70, -26, 70, 26]).fill(0xe7c99e);
    g.poly([0, 0, 22, -8, 22, 8]).fill(0x2e2e34);
    g.poly([70, -W2, L, -W2, L, W2, 70, W2]).fill(0xf0bf3e);
    g.poly([70, -W2 + 16, L, -W2 + 16, L, -W2 + 22, 70, -W2 + 22]).fill(0xd79f22);
    g.poly([70, W2 - 10, L, W2 - 10, L, W2, 70, W2]).fill(0xc58f1c);
    g.rect(L, -W2 - 2, 60, W2 * 2 + 4).fill(0xb8b6b0);
    g.roundRect(L + 58, -W2, 70, W2 * 2, 18).fill(0xe98c8c);
    // the pencil leans in from the top right
    g.rotation = -2.36;
  }

  private drawHand() {
    const g = this.hand;
    // a hand of LIGHT from the top right (cool, pale, a halo): a thin pencil pinched between thumb and index, its
    // point at (0, 0). The underside is a darker blue so the fingers read as shapes in pencil and in wash.
    const c = 0xd6e4ff;
    const s = 0x8ea6d8;
    g.circle(150, -150, 150).fill({ color: 0xeef4ff, alpha: 0.18 });
    g.circle(150, -150, 95).fill({ color: 0xeef4ff, alpha: 0.22 });
    // forearm
    g.poly([175, -150, 400, -380, 440, -340, 215, -112]).fill(c);
    g.poly([215, -112, 440, -340, 446, -322, 226, -100]).fill(s);
    // the pencil
    g.poly([0, 0, 5, -3, 112, -112, 106, -118, -3, -5]).fill(0x6f7fa8);
    g.poly([0, 0, 9, -2, 2, -9]).fill(0x2e2e34);
    // palm (back of the hand)
    const pr: number[] = [];
    for (let i = 0; i < 22; i++) {
      const an = (i / 22) * Math.PI * 2;
      const px = Math.cos(an) * 58;
      const py = Math.sin(an) * 40;
      pr.push(160 + px * Math.cos(-0.78) - py * Math.sin(-0.78), -140 + px * Math.sin(-0.78) + py * Math.cos(-0.78));
    }
    g.poly(pr).fill(c);
    // index finger along the pencil, thumb under it, three curled fingers
    g.poly([60, -52, 128, -122, 142, -108, 74, -40]).fill(c);
    g.circle(62, -46, 9).fill(c);
    g.poly([84, -30, 136, -82, 146, -70, 94, -20]).fill(s);
    g.circle(88, -24, 8).fill(s);
    for (let i = 0; i < 3; i++) g.ellipse(150 + i * 16, -78 + i * 12, 20, 11).fill(i % 2 ? c : s);
    g.rotation = 0.06;
    g.scale.set(0.5);
  }
}
