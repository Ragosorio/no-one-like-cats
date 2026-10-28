/**
 * Parte III · the MULTIDIMENSIONAL card skins (2026-10-28, the owner on the Catdex: «que se note como tarjetas únicas,
 * que se sienta como especiales»). Every Multidimensional card carries its own universe behind the painting
 * (fx/sequences/multiverse/: Signature.card), a metallic frame in the universe's color (printTextures 'multidimensional'),
 * an iridescent foil (CatCard) and the box gem. A Multidimensional without card() — or without a universe yet — gets the
 * generic universe: a tunnel of open boxes in its own colors (each species its own twist of it).
 *
 * The grid never draws a universe twice: universeTexture() bakes it once per species and size (a RenderTexture that is
 * never invalidated: the art is static by contract). Only the detail page asks for a live one.
 */
import { Container, Graphics, Rectangle, Texture } from 'pixi.js';
import { game } from '../../core/App';
import { C, F } from '../../ui/theme';
import { txt, poster } from '../../ui/widgets';
import { CAT_BY_ID } from '../../data/content';
import { signatureOf } from '../../fx/sequences/multiverse';
import { elColor } from '../../state/ext/collection';
import { MULTIDIM } from '../../state/sys/multidim';
import type { MultidimPower } from '../../data/multidimPowers';
import { destroyTree } from './ui';
import { bands, glow, liveLoop, lum, mix, seeded, seedOf, sparkle } from './cardArt';

/** the five boxes' palettes (beer, comic, shōnen, ink, neon): the family stripe every Multidimensional card wears */
export const DIMS5 = [0xe8a33d, 0x2a5db0, 0xff7a1a, 0x8a5a3a, 0xff2e88];
const INK = 0x0d0a12;

export interface CardSkin {
  /** the universe's color: the metallic frame, the name, the gem */
  frame: number;
  /** the universe's plate («UNIVERSO AMARILLO») */
  tag: string;
  /** a dark universe */
  dark: boolean;
  /** true = the universe draws its own card (Signature.card); false = the generic tunnel of boxes */
  own: boolean;
  /** the universe art, w×h, origin top-left (live = it animates itself and stops when destroyed) */
  art(w: number, h: number, live: boolean): Container;
}

export const isMultidimSpecies = (species: string) => CAT_BY_ID.get(species)?.rarity === MULTIDIM;

/** the skin of a Multidimensional species (null for any other rarity) */
export function cardSkin(species: string): CardSkin | null {
  if (!isMultidimSpecies(species)) return null;
  const def = CAT_BY_ID.get(species)!;
  const sig = signatureOf(species);
  const frame = sig?.frame ?? elColor(def.elements[0]);
  return {
    frame,
    tag: sig?.tag ?? 'OTRO UNIVERSO',
    dark: sig?.dark ?? true,
    own: !!sig?.card,
    art(w, h, live) {
      if (sig?.card) {
        try {
          return sig.card(w, h, live);
        } catch (e) {
          console.warn('[cartas] card() of', species, 'failed; the generic universe stands in', e);
        }
      }
      return boxTunnel(species, frame, w, h, live);
    },
  };
}

const texCache = new Map<string, Texture>();
/** the universe baked once per species × size (the grid: 25 cards, one sprite each, never redrawn) */
export function universeTexture(species: string, w: number, h: number): Texture {
  const W = Math.max(1, Math.round(w));
  const H = Math.max(1, Math.round(h));
  const key = `${species}|${W}|${H}`;
  const hit = texCache.get(key);
  if (hit && !hit.destroyed) return hit;
  const skin = cardSkin(species);
  if (!skin) return Texture.EMPTY;
  const art = skin.art(W, H, false);
  const tex = game.pixi.renderer.generateTexture({ target: art, frame: new Rectangle(0, 0, W, H), resolution: W < 240 ? 2 : 1.5, antialias: true });
  destroyTree(art);
  texCache.set(key, tex);
  return tex;
}

/**
 * The generic universe: a tunnel of open boxes falling away to a light, in the five boxes' colors and the cat's own
 * (its element's), with a seeded twist (where the light is, how the boxes turn) so no two look alike. Live: the boxes
 * keep coming at you.
 */
export function boxTunnel(species: string, frame: number, w: number, h: number, live: boolean): Container {
  const k = new Container();
  const r = seeded(seedOf(species));
  const deep = mix(frame, INK, 0.8);
  const bg = bands(new Graphics(), 0, 0, w, h, [deep, mix(frame, INK, 0.55), deep], 18);
  const cx = w * (0.4 + r() * 0.2);
  const cy = h * (0.38 + r() * 0.16);
  const rot0 = r() * Math.PI;
  const twist = (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.7);
  const start = Math.floor(r() * DIMS5.length);
  const pal = [frame, ...DIMS5.slice(start), ...DIMS5.slice(0, start)];
  const diag = Math.hypot(w, h);
  const u = Math.min(w, h) / 100;
  const halo = glow(new Graphics(), cx, cy, Math.min(w, h) * 0.5, mix(frame, 0xffffff, 0.45), 0.7);
  const rings = new Graphics();
  const stars = Array.from({ length: 12 }, () => ({ x: r() * w, y: r() * h, s: (0.8 + r() * 1.8) * u, p: r() * 6 }));
  const sp = new Graphics();
  k.addChild(bg, halo, rings, sp);
  const N = 10;
  const draw = (t: number) => {
    if (rings.destroyed) return;
    rings.clear();
    const list = Array.from({ length: N }, (_, i) => ({ i, s: ((i + t * 0.22) % N) / N })).sort((a, b) => a.s - b.s);
    for (const { i, s } of list) {
      const R = 2 * u + s * s * diag * 0.62;
      const a = rot0 + s * twist;
      const fade = Math.min(1, s * 5);
      const pts: number[] = [];
      for (let j = 0; j < 4; j++) {
        const aa = a + (j * Math.PI) / 2;
        pts.push(cx + Math.cos(aa) * R, cy + Math.sin(aa) * R);
      }
      // the box's mouth: an ink edge and its color, and the two flaps folded out on the far side
      rings.poly(pts).stroke({ width: Math.max(1.2, R * 0.09), color: INK, alpha: 0.55 * fade, join: 'miter' });
      rings.poly(pts).stroke({ width: Math.max(0.8, R * 0.045), color: pal[i % pal.length], alpha: fade, join: 'miter' });
      if (s > 0.25) {
        const f0 = [pts[0], pts[1]];
        const f1 = [pts[2], pts[3]];
        const fl = R * 0.32;
        rings
          .poly([f0[0], f0[1], pts[6], pts[7], f0[0] + Math.cos(a - 0.6) * fl, f0[1] + Math.sin(a - 0.6) * fl])
          .fill({ color: pal[(i + 1) % pal.length], alpha: 0.18 * fade });
        rings
          .poly([f1[0], f1[1], pts[4], pts[5], f1[0] + Math.cos(a + Math.PI - 0.6) * fl, f1[1] + Math.sin(a + Math.PI - 0.6) * fl])
          .fill({ color: pal[(i + 2) % pal.length], alpha: 0.18 * fade });
      }
    }
    sp.clear();
    for (const st of stars) sparkle(sp, st.x, st.y, st.s * (0.75 + 0.35 * Math.sin(t * 2.4 + st.p)), 0xffffff, 0.55 + 0.4 * Math.sin(t * 1.7 + st.p));
  };
  if (live) liveLoop(k, draw, 30);
  else draw(r() * 9);
  return k;
}

/**
 * The box gem: a cut diamond in the universe's color with the five boxes' stripe and an open box inside — the set symbol
 * of the Multidimensionals. `size` = its width; anchored at its center.
 */
export function multidimGem(size: number, frame: number): Container {
  const k = new Container();
  const s = size / 2;
  const ink = Math.max(1.5, size * 0.07);
  const g = new Graphics();
  g.poly([0, -s - ink, s + ink, 0, 0, s + ink, -s - ink, 0]).fill(INK);
  g.poly([0, -s, s, 0, 0, s, -s, 0]).fill(frame);
  g.poly([0, -s, 0, s, -s, 0]).fill({ color: 0xffffff, alpha: 0.32 });
  g.poly([0, -s, s, 0, 0, 0]).fill({ color: 0xffffff, alpha: 0.18 });
  g.poly([0, s, s, 0, 0, 0]).fill({ color: INK, alpha: 0.22 });
  // the five boxes' stripe along the lower edges
  DIMS5.forEach((c, i) => {
    const a = i / 5;
    const b = (i + 1) / 5;
    const x0 = -s + a * 2 * s;
    const x1 = -s + b * 2 * s;
    const y = (x: number) => s - Math.abs(x);
    g.moveTo(x0, y(x0) - ink * 0.9).lineTo(x1, y(x1) - ink * 0.9).stroke({ width: ink * 0.9, color: c });
  });
  g.poly([0, -s, s, 0, 0, s, -s, 0]).stroke({ width: ink, color: INK, join: 'miter' });
  // the open box
  const bw = s * 0.62;
  const bh = s * 0.42;
  const by = s * 0.06;
  const dark = lum(frame) > 150 ? INK : 0xfff8ec;
  g.rect(-bw / 2, by - bh / 2, bw, bh).fill({ color: dark, alpha: 0.9 });
  g.poly([-bw / 2, by - bh / 2, -bw / 2 - bw * 0.32, by - bh / 2 - bh * 0.55, -bw * 0.05, by - bh / 2]).fill({ color: dark, alpha: 0.9 });
  g.poly([bw / 2, by - bh / 2, bw / 2 + bw * 0.32, by - bh / 2 - bh * 0.55, bw * 0.05, by - bh / 2]).fill({ color: dark, alpha: 0.9 });
  sparkle(g, 0, by - bh * 1.05, s * 0.28, dark === INK ? 0xffffff : frame, 1);
  k.addChild(g);
  return k;
}

/** the universe's plate («UNIVERSO AMARILLO»): the gem + the tag on a stamped band (centered on its origin) */
export function tagPlate(tag: string, frame: number, size = 18): Container {
  const k = new Container();
  const light = lum(frame) > 150;
  const t = poster(tag, size, light ? INK : C.paper, { letterSpacing: 1 });
  t.anchor.set(0.5);
  const gem = multidimGem(size * 1.55, frame);
  const pad = size * 0.7;
  const wTot = gem.width + pad * 0.6 + t.width;
  const bw = wTot + pad * 2;
  const bh = t.height + size * 0.35;
  const off = Math.max(2, size * 0.18);
  const b = new Graphics()
    .rect(-bw / 2 + off, -bh / 2 + off, bw, bh)
    .fill(INK)
    .rect(-bw / 2, -bh / 2, bw, bh)
    .fill(frame)
    .stroke({ width: Math.max(2, size * 0.13), color: INK });
  // the five boxes' stripe under the tag
  const sw = bw / DIMS5.length;
  DIMS5.forEach((c, i) => b.rect(-bw / 2 + i * sw, bh / 2 - size * 0.16, sw, size * 0.12).fill(c));
  gem.position.set(-wTot / 2 + gem.width / 2, 0);
  t.position.set(-wTot / 2 + gem.width + pad * 0.6 + t.width / 2, 0);
  k.addChild(b, gem, t);
  return k;
}

/**
 * The «PODER MULTIDIMENSIONAL» panel of the detail page: a dark plate edged in the universe's metal, the power's name
 * and what it does (a Multidimensional's power IS its ultimate: `uses` = its uses per battle), and the rule every power
 * shares (`note`). `locked` (a rumor): the title and «???» only. Origin top-left; the text shrinks a little rather than
 * grow past maxH.
 */
export function powerPanel(o: { power: MultidimPower; frame: number; w: number; maxH: number; locked?: boolean; uses?: number; note?: string }): Container {
  const { power, frame, w } = o;
  const k = new Container();
  const pad = 18;
  const gem = multidimGem(26, frame);
  gem.position.set(pad + 12, pad + 8);
  const head = txt('PODER MULTIDIMENSIONAL', { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: mix(frame, 0xffffff, 0.35), letterSpacing: 4 });
  head.position.set(pad + 34, pad - 1);
  k.addChild(gem, head);
  if (!o.locked) {
    const u = txt(o.uses ? `SU ULTIMATE · ${o.uses}× POR BATALLA` : 'SU ULTIMATE', { fontFamily: F.ui, fontWeight: '700', fontSize: 13, fill: 0xb9b0c6, letterSpacing: 2 });
    u.anchor.set(1, 0);
    u.position.set(w - pad, pad + 1);
    k.addChild(u);
  }
  const nameCol = lum(frame) > 90 ? frame : mix(frame, 0xffffff, 0.55);
  const nm = poster(o.locked ? '???' : power.name.toUpperCase(), 38, nameCol, { stroke: { color: INK, width: 6 }, letterSpacing: 0 });
  nm.position.set(pad, pad + 22);
  if (nm.width > w - pad * 2) nm.scale.set((w - pad * 2) / nm.width);
  const body = txt(o.locked ? 'Regístralo para conocer su poder.' : power.text, { fontFamily: F.ui, fontSize: 19, fill: 0xf3ecdf, wordWrap: true, wordWrapWidth: w - pad * 2, lineHeight: 25 });
  body.position.set(pad, nm.y + nm.height + 4);
  const note = o.note && !o.locked ? txt(o.note, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 16, fill: 0xb9b0c6, wordWrap: true, wordWrapWidth: w - pad * 2, padding: 4 }) : null;
  const tail = note ? note.height + 8 : 0;
  // never spill past maxH: the text shrinks a little first
  const room = o.maxH - body.y - pad - tail;
  if (body.height > room) body.scale.set(Math.max(0.72, room / body.height));
  if (note) {
    note.position.set(pad, body.y + body.height + 8);
    k.addChild(note);
  }
  const h = Math.min(o.maxH, body.y + body.height + tail + pad);
  const bg = new Graphics();
  bg.rect(7, 7, w, h).fill(INK);
  bg.rect(0, 0, w, h).fill({ color: 0x15101c, alpha: 0.97 });
  glow(bg, w - 60, 36, 110, frame, 0.2);
  // the metal edge (light top-left, dark bottom-right) and the five boxes' stripe on top
  bg.rect(0, 0, w, h).stroke({ width: 5, color: frame, alignment: 1 });
  bg.moveTo(0, h).lineTo(w, h).lineTo(w, 0).stroke({ width: 3, color: mix(frame, INK, 0.45) });
  const sw = w / DIMS5.length;
  DIMS5.forEach((c, i) => bg.rect(i * sw, 0, sw, 5).fill(c));
  k.addChildAt(bg, 0);
  k.addChild(nm, body);
  return k;
}
