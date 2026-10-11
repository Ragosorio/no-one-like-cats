/**
 * YONOSE TODO — the dream panels: six storyboard thumbnails of the road so far, one per song (and per Momento), in
 * clean flat color (the Animatic filter or the Wash filter gives them their art). `lit` = in its own colors; not lit =
 * the same drawing in a cold, washed-out blue-grey (a panel nobody colored in).
 *
 * Also the credits' «MÚSICA ORIGINAL» page uses them, small, next to each title.
 */
import { Container, Graphics } from 'pixi.js';
import { lerpColor } from '../../anime/palette';
import { rng } from '../../anime/draw';

export interface Vignette {
  song: string;
  /** its signature colors (splashes, the credits' card) */
  accent: number;
  draw(g: Graphics, w: number, h: number, c: (hex: number) => number): void;
}

/** in story order (the dream): H35 · H44 · H55 · H57 · H62 · H64 */
export const VIGNETTES: Vignette[] = [
  {
    song: 'when_i_lose',
    accent: 0xd8a54a,
    draw(g, w, h, c) {
      // the drifting library: shelves leaning, pages flying, a candle
      g.rect(0, 0, w, h).fill(c(0x3d3352));
      for (let i = 0; i < 4; i++) {
        const x = 30 + i * (w - 60) * 0.3;
        g.poly([x, h, x + 40, h * 0.25, x + 92, h * 0.28, x + 56, h]).fill(c(0x7a5233));
        for (let j = 0; j < 4; j++) g.rect(x + 22 + j * 4, h * (0.4 + j * 0.13), 40, 10).fill(c([0xc84f3d, 0x3f7a8c, 0xd9b45a, 0x6b4f8f][(i + j) % 4]));
      }
      const R = rng(35);
      for (let i = 0; i < 6; i++) {
        const x = R() * w;
        const y = R() * h * 0.6;
        g.poly([x, y, x + 34, y - 6, x + 30, y + 22, x - 4, y + 26]).fill(c(0xf6edd6));
      }
      g.rect(w * 0.78, h * 0.62, 16, 40).fill(c(0xf3e6c4));
      g.ellipse(w * 0.78 + 8, h * 0.58, 9, 16).fill(c(0xffc94a));
    },
  },
  {
    song: 'liky_fight',
    accent: 0xff5fa2,
    draw(g, w, h, c) {
      // the party galleon on the night sea, lanterns and a disco ball
      g.rect(0, 0, w, h).fill(c(0x2c2160));
      g.rect(0, h * 0.68, w, h * 0.32).fill(c(0x2a6f8c));
      g.poly([w * 0.12, h * 0.62, w * 0.88, h * 0.62, w * 0.76, h * 0.84, w * 0.24, h * 0.84]).fill(c(0x8a3d6a));
      g.rect(w * 0.48, h * 0.12, 8, h * 0.5).fill(c(0x4a2b2b));
      g.poly([w * 0.5, h * 0.16, w * 0.78, h * 0.4, w * 0.5, h * 0.52]).fill(c(0xff7fb8));
      g.circle(w * 0.36, h * 0.3, 18).fill(c(0xd9e4f0));
      for (let i = 0; i < 7; i++) g.circle(w * (0.16 + i * 0.11), h * 0.56 + Math.sin(i) * 6, 7).fill(c([0xffd23f, 0x3fe0d0, 0xff5fa2][i % 3]));
    },
  },
  {
    song: 'te_odio',
    accent: 0xe8366e,
    draw(g, w, h, c) {
      // a cracked wall with a spray-painted heart, the crack is a window to the other art
      g.rect(0, 0, w, h).fill(c(0xb9b2a6));
      for (let y = 0; y < h; y += 26) for (let x = (y / 26) % 2 ? -20 : 0; x < w; x += 56) g.rect(x + 2, y + 2, 52, 22).fill(c(0xc9c2b4));
      g.poly([w * 0.5, h * 0.78, w * 0.26, h * 0.5, w * 0.3, h * 0.28, w * 0.5, h * 0.38, w * 0.7, h * 0.28, w * 0.74, h * 0.5]).fill(c(0xe8366e));
      g.poly([w * 0.58, 0, w * 0.52, h * 0.3, w * 0.62, h * 0.45, w * 0.5, h * 0.7, w * 0.56, h, w * 0.6, h, w * 0.54, h * 0.7, w * 0.66, h * 0.45, w * 0.56, h * 0.3, w * 0.62, 0]).fill(c(0x1d1a24));
      const R = rng(55);
      for (let i = 0; i < 14; i++) g.circle(R() * w, R() * h, 2 + R() * 4).fill(c(0xffd23f));
    },
  },
  {
    song: 'hemkade',
    accent: 0x2fa6a0,
    draw(g, w, h, c) {
      // the leviathan rising, its chains breaking
      g.rect(0, 0, w, h).fill(c(0x1f3550));
      g.rect(0, h * 0.7, w, h * 0.3).fill(c(0x17506a));
      g.poly([w * 0.08, h * 0.74, w * 0.3, h * 0.22, w * 0.52, h * 0.1, w * 0.7, h * 0.24, w * 0.62, h * 0.4, w * 0.44, h * 0.42, w * 0.36, h * 0.74]).fill(c(0x2fa6a0));
      g.circle(w * 0.6, h * 0.2, 7).fill(c(0xffe08a));
      for (let i = 0; i < 6; i++) g.rect(w * (0.7 + i * 0.045), h * (0.36 + i * 0.07), 14, 9).fill(c(0xc9a24a));
      g.poly([0, h * 0.7, w, h * 0.7, w, h * 0.74, 0, h * 0.76]).fill(c(0xcfe6f0));
    },
  },
  {
    song: 'circus_malus',
    accent: 0xd8403a,
    draw(g, w, h, c) {
      // the perfect circus: a striped tent in exact symmetry (one flag crooked)
      g.rect(0, 0, w, h).fill(c(0xf1e2c4));
      const cx = w / 2;
      for (let i = 0; i < 8; i++) {
        const x0 = w * 0.14 + (i * w * 0.72) / 8;
        const x1 = x0 + (w * 0.72) / 8;
        g.poly([cx, h * 0.18, x0, h * 0.62, x1, h * 0.62]).fill(c(i % 2 ? 0xf6f0e2 : 0xd8403a));
        g.rect(x0, h * 0.62, x1 - x0, h * 0.28).fill(c(i % 2 ? 0xd8403a : 0xf6f0e2));
      }
      g.rect(cx - 3, h * 0.04, 6, h * 0.16).fill(c(0x2b2b33));
      g.poly([cx + 3, h * 0.05, cx + 40, h * 0.1, cx + 3, h * 0.15]).fill(c(0x2b2b33));
      g.poly([w * 0.08, h * 0.2, w * 0.08 + 30, h * 0.26, w * 0.08, h * 0.32]).fill(c(0x3a62b0));
      g.poly([w * 0.92, h * 0.2, w * 0.92 - 30, h * 0.31, w * 0.92, h * 0.33]).fill(c(0x3a62b0));
    },
  },
  {
    song: 'yonose_todo',
    accent: 0xf2994a,
    draw(g, w, h, c) {
      // the faro, the page on the grass, a cat asleep on it
      g.rect(0, 0, w, h).fill(c(0x2b335c));
      g.rect(0, h * 0.62, w, h * 0.38).fill(c(0x4f7d4f));
      g.poly([w * 0.24, h * 0.66, w * 0.34, h * 0.66, w * 0.32, h * 0.2, w * 0.26, h * 0.2]).fill(c(0xf3efe4));
      g.rect(w * 0.255, h * 0.12, w * 0.07, h * 0.08).fill(c(0xffc94a));
      g.poly([w * 0.48, h * 0.74, w * 0.84, h * 0.73, w * 0.9, h * 0.86, w * 0.44, h * 0.87]).fill(c(0xfffcf2));
      g.ellipse(w * 0.66, h * 0.76, w * 0.12, h * 0.06).fill(c(0xe08a3a));
      g.circle(w * 0.76, h * 0.73, h * 0.05).fill(c(0xe08a3a));
    },
  },
];

export const vignetteOf = (song: string) => VIGNETTES.find((v) => v.song === song) ?? VIGNETTES[5];

/** a panel: a paper card with the vignette inside, in color and in grey (cross-fade `lit`); origin = its centre */
export function buildPanel(v: Vignette, w: number, h: number): { root: Container; lit: Container; grey: Container } {
  const root = new Container();
  const card = new Graphics().rect(-w / 2 - 12, -h / 2 - 12, w + 24, h + 24).fill(0xfbf6ea);
  const make = (c: (hex: number) => number) => {
    const box = new Container();
    const g = new Graphics();
    v.draw(g, w, h, c);
    // nothing spills out of the frame
    const m = new Graphics().rect(0, 0, w, h).fill(0xffffff);
    box.addChild(g, m);
    g.mask = m;
    box.position.set(-w / 2, -h / 2);
    return box;
  };
  const grey = make((hex) => lerpColor(lerpColor(hex, 0x8a94a8, 0.8), 0xdfe3ea, 0.15));
  const lit = make((hex) => hex);
  root.addChild(card, grey, lit);
  return { root, lit, grey };
}
