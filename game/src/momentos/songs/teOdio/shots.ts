/**
 * te ODIO — FULL-FRAME SHOTS and wheatpasted cut-ins (the camera language that is not the battle's side view).
 *
 *  coldOpen    the battle's frozen frame is a pane of glass: Grafitera tags it on the hats, a stencil on the kick, the
 *              tag drips through the song's one silent gap
 *  rip         …and the frame is torn off the wall like a poster (the first tap): it reveals the street world
 *  poster      a wheatpaste poster slapped over the scene (a character card: painting, stencil name, tape)
 *  comicPage   the box's clean comic page (3 panels, Ben-Day, Bangers captions); a tag can tear across it
 *  plate       the stops: a cardboard stencil plate slams over the frozen frame
 *  stencilShot …and is lifted: what got sprayed through it (box · hand · cat in a box · the open door)
 *  face        a close-up (comic or street painting) in a colored light (reactions)
 *  crack       the wall with a crack — through it, the broken transmission (a tape with its own signal filter)
 *  duel        paw vs crowbar, split down a torn diagonal (the climax beats)
 *  hero        the closing composition: both crews, both arts, the open-door box
 *
 * Every shot covers the frame (k.fullFrame) and draws in the panels layer; posters and words stay above it.
 */
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import type { Args } from '../../types';
import { clip, W, H, type Clip, type Kit, type VerbFn } from '../../anime/kit';
import type { CatPuppet } from '../../../art/livingCat';
import { ease } from '../../score';
import { rng } from '../../anime/draw';
import { durOf, posOf } from '../../anime/fx';
import { COMIC_INK, FLUO, INK, PRINT, WALL, benDay, benDayLayer, drips, openBox, splat, sprayLine, sprayPoly, starburst, tornEdge, tornRect, type WordKind } from './spray';
import { drawHand, pawMark } from './art';
import { SignalFilter } from './post';
import { S, num } from './verbs';
import type { Who } from './stage';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const st12 = (t: number) => Math.floor(t * 12) / 12;
type Art = 'comic' | 'street';

/** a living close-up: the cat's puppet in the wanted art, head centred on (0,0), head height ≈ headH */
export function faceOf(k: Kit, who: string, art: Art, headH: number, flip = false): { c: Container; p: CatPuppet | null } {
  const st = S(k);
  const slug = st.slugs[who as Who] ?? who;
  const c = new Container();
  const p = st.studio.puppet(slug, { anchorX: 0.5, anchorY: 0.97 });
  if (!p) return { c, p: null };
  const t = st.paint(slug, art);
  if (t) p.texture = t;
  const head = p.brain.model?.rig.head ?? [350, 200, 150, 125];
  const hh = (head[3] ?? 125) * 2.3;
  const s = headH / hh;
  p.scale.set(flip ? -s : s, s);
  const hl = p.brain.headLocal() ?? [0, -400];
  p.position.set(-hl[0] * s * (flip ? -1 : 1), -hl[1] * s);
  c.addChild(p);
  return { c, p };
}
/** a static painting sprite (anchor bottom-centre) in the wanted art, `h` px tall */
function paintingOf(k: Kit, who: string, art: Art, h: number): Sprite | null {
  const st = S(k);
  const slug = st.slugs[who as Who] ?? who;
  const t = st.paint(slug, art);
  if (!t) return null;
  const sp = new Sprite(t);
  sp.anchor.set(0.5, 0.97);
  sp.scale.set(h / t.height);
  return sp;
}
function cover(k: Kit, root: Container) {
  root.zIndex = 1;
  k.layers.panels.addChild(root);
}
function snapshotSprite(k: Kit): Sprite | null {
  if (!k.snapshot) return null;
  const sp = new Sprite(k.snapshot);
  const v = k.view;
  sp.position.set(v.x, v.y);
  sp.width = v.w;
  sp.height = v.h;
  return sp;
}

// ------------------------------------------------------------------ cold open + rip
const TAG_PATH: [number, number] = [1180, 430];
/** the glass: the frozen battle frame (or, standalone, the comic world under it) gets tagged */
const coldOpen: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 4.1);
  const st = S(k);
  const tagO = { kind: 'tag' as WordKind, size: 150, color: FLUO.pink, halo: FLUO.pink, ink: INK, seed: 21 };
  st.book.get('DISRUPTORES', tagO);
  const hats = k.onsetList('perc').filter((o) => o.t < 3.78 && o.strength > 0.08);
  let root: Container | null = null;
  let tagSp: Sprite | null = null;
  let mask: Graphics | null = null;
  let fx: Graphics | null = null;
  let graf: Sprite | null = null;
  return clip(cue.m, d, {
    mount: () => {
      root = new Container();
      const snap = snapshotSprite(k);
      if (snap) root.addChild(snap);
      fx = new Graphics();
      tagSp = st.book.sprite('DISRUPTORES', tagO, 0.5, 0.5);
      tagSp.position.set(...TAG_PATH);
      tagSp.rotation = -0.1;
      mask = new Graphics();
      tagSp.mask = mask;
      graf = paintingOf(k, 'grafitera', 'street', 980);
      root.addChild(fx, tagSp, mask);
      if (graf) root.addChild(graf);
      cover(k, root);
    },
    update: (lt) => {
      if (!root || !tagSp || !mask || !fx) return;
      k.fullFrame = !!k.snapshot;
      const m = cue.m + lt;
      // the tag grows with the hats (one stroke step per hat)
      let n = 0;
      for (const o of hats) if (o.t <= m) n++;
      const frac = clamp01(n / Math.max(1, hats.length));
      const tw = tagSp.texture.width;
      mask.clear();
      mask.rect(TAG_PATH[0] - tw / 2 - 20, TAG_PATH[1] - 200, (tw + 40) * frac, 400).fill(0xffffff);
      // a mist puff on each hat at the spray tip
      fx.clear();
      const lastHat = k.last('perc', m, 0.08);
      const tipX = TAG_PATH[0] - tw / 2 + tw * frac;
      if (lastHat && m - lastHat.o.t < 0.15 && m < 3.78) {
        const R = rng(lastHat.i + 3);
        const al = 1 - (m - lastHat.o.t) / 0.15;
        fx.circle(tipX, TAG_PATH[1], 70).fill({ color: FLUO.pink, alpha: 0.12 * al });
        for (let j = 0; j < 14; j++) fx.circle(tipX + (R() - 0.5) * 120, TAG_PATH[1] + (R() - 0.5) * 120, 1.5 + R() * 3).fill({ color: FLUO.pink, alpha: al });
      }
      // the stencil on the first big kick (2.0): the open-door box, sprayed in the corner
      if (m >= 2.0) {
        const age = m - 2.0;
        const c = age < 1 / 12 ? 1.2 : 1;
        openBox(fx, 330, 300, 150 * c, FLUO.green, { line: 16 });
        drips(fx, 330, 380, 150, 4, clamp01(age / 1.5), FLUO.green, 31);
      }
      // the silent gap (3.785): drips run down the tag
      if (m > 3.2) drips(fx, TAG_PATH[0], TAG_PATH[1] + 50, tw * 0.8, 9, clamp01((m - 3.2) / 0.8), FLUO.pink, 41, INK);
      // Grafitera leans in from the right edge, spraying (bobs on the kicks)
      if (graf) {
        const inT = ease('expoOut', clamp01((m - 0.9) / 0.35));
        const kick = k.env('kick', m, 0.1, 0.05);
        graf.position.set(k.view.x + k.view.w + 300 - 520 * inT, k.view.y + k.view.h + 140 - kick * 14);
        graf.rotation = -0.22 + kick * 0.03;
        graf.visible = m > 0.9;
      }
    },
    unmount: () => {
      root?.destroy({ children: true });
      root = tagSp = mask = fx = graf = null;
    },
  });
};
/** the frame rips off like a poster: two torn halves fly apart (miss: it tears halfway, hangs, then falls) */
const rip: VerbFn = (k, a, cue) => {
  const r = String(a.r ?? 'great');
  const d = r === 'miss' ? 1.1 : 0.75;
  const st = S(k);
  const tagO = { kind: 'tag' as WordKind, size: 150, color: FLUO.pink, halo: FLUO.pink, ink: INK, seed: 21 };
  let root: Container | null = null;
  const pieces: { c: Container; dir: number; pivot: [number, number] }[] = [];
  return clip(cue.m, d, {
    z: 2,
    mount: () => {
      root = new Container();
      const v = k.view;
      // the tear: a jagged line from top (60 %) to bottom (40 %)
      const tear = tornEdge(v.x + v.w * 0.62, v.y - 40, v.x + v.w * 0.38, v.y + v.h + 40, 77, 26, 34);
      const left = [v.x - 60, v.y - 60, ...tear, v.x - 60, v.y + v.h + 60];
      const right = [...tear, v.x + v.w + 60, v.y + v.h + 60, v.x + v.w + 60, v.y - 60];
      for (const [poly, dir] of [
        [left, -1],
        [right, 1],
      ] as const) {
        const c = new Container();
        const content = new Container();
        const snap = snapshotSprite(k);
        if (snap) content.addChild(snap);
        else content.addChild(new Graphics().rect(v.x - 80, v.y - 80, v.w + 160, v.h + 160).fill(PRINT.blue));
        const t = st.book.sprite('DISRUPTORES', tagO);
        t.position.set(...TAG_PATH);
        t.rotation = -0.1;
        const fx = new Graphics();
        openBox(fx, 330, 300, 150, FLUO.green, { line: 16 });
        content.addChild(t, fx);
        const mask = new Graphics().poly(poly as number[]).fill(0xffffff);
        content.mask = mask;
        // white paper fibres along the torn edge
        const edge = new Graphics();
        edge.poly(tear).stroke({ width: 16, color: 0xf3eee2, join: 'round' });
        edge.poly(tear).stroke({ width: 5, color: 0xd9d2c0, join: 'round' });
        const edgeMask = new Graphics().poly(poly as number[]).fill(0xffffff);
        edge.mask = edgeMask;
        c.addChild(content, mask, edge, edgeMask);
        root.addChild(c);
        pieces.push({ c, dir, pivot: dir < 0 ? [v.x, v.y] : [v.x + v.w, v.y + v.h] });
      }
      cover(k, root);
      root.zIndex = 2;
    },
    update: (lt) => {
      for (const p of pieces) {
        let x: number;
        if (r === 'miss') {
          // the right half only peels a little, hangs, then drops
          x = p.dir > 0 ? (lt < 0.55 ? 0.12 * ease('out', lt / 0.2) : 0.12 + ease('in', (lt - 0.55) / 0.5)) : lt < 0.55 ? 0 : ease('in', (lt - 0.55) / 0.5);
        } else x = ease('expoOut', clamp01(lt / (r === 'great' ? 0.45 : 0.6)));
        const st2 = Math.floor(x * 10) / 10;
        p.c.pivot.set(p.pivot[0], p.pivot[1]);
        p.c.position.set(p.pivot[0] + p.dir * st2 * 1300, p.pivot[1] + (p.dir < 0 ? -1 : 1) * st2 * 500);
        p.c.rotation = p.dir * st2 * 0.5;
      }
    },
    unmount: () => {
      root?.destroy({ children: true });
      root = null;
      pieces.length = 0;
    },
  });
};

// ------------------------------------------------------------------ posters (cut-ins)
/**
 * A wheatpaste poster slapped over the scene: torn paper, the painting (street or comic), a stencil name, tape.
 * Args: who, title, sub, x, y, rot, h (poster height), art ('street' | 'comic'), color, dur|beats, off ('tear' | 'cut')
 */
const poster: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 2);
  const st = S(k);
  const art = (a.art as Art) ?? 'street';
  const ph = num(a, 'h', 760);
  const pw = ph * 0.74;
  const color = typeof a.color === 'number' ? (a.color as number) : FLUO.pink;
  const title = typeof a.title === 'string' ? (a.title as string) : '';
  const titleO = art === 'comic' ? { kind: 'comic' as WordKind, size: Math.round(ph * 0.12), color: PRINT.yellow, ink: COMIC_INK, seed: 5 } : { kind: 'stencil' as WordKind, size: Math.round(ph * 0.15), color: INK, halo: color, seed: 6 };
  if (title) st.book.get(title, titleO);
  const subO = { kind: (art === 'comic' ? 'comic' : 'marker') as WordKind, size: Math.round(ph * 0.07), color: art === 'comic' ? 0xffffff : color, ink: art === 'comic' ? COMIC_INK : INK, seed: 8 };
  if (typeof a.sub === 'string') st.book.get(a.sub, subO);
  let root: Container | null = null;
  let tornOff: Graphics | null = null;
  // built now (before the clock), parented on mount
  const build = () => {
      root = new Container();
      root.zIndex = 10;
      const paper = new Graphics();
      const pts = tornRect(pw, ph, cue.id % 50, 14);
      paper.poly(pts.map((v, i) => v + (i % 2 ? 10 : 12))).fill({ color: 0x000000, alpha: 0.35 });
      paper.poly(pts).fill(art === 'comic' ? PRINT.paper : 0xebe4d3);
      // the print: a color field (street: sprayed / comic: Ben-Day)
      const field = new Graphics();
      if (art === 'comic') {
        field.rect(-pw / 2 + 24, -ph / 2 + 24, pw - 48, ph * 0.72).fill(color);
        benDay(field, -pw / 2 + 30, -ph / 2 + 30, pw - 60, ph * 0.7, 18, 1, 6, 0xffffff, 0.35);
        field.rect(-pw / 2 + 24, -ph / 2 + 24, pw - 48, ph * 0.72).stroke({ width: 8, color: COMIC_INK });
      } else {
        sprayPoly(field, [-pw / 2 + 30, -ph / 2 + 40, pw / 2 - 40, -ph / 2 + 28, pw / 2 - 28, ph * 0.22, -pw / 2 + 36, ph * 0.26], color, cue.id % 30 + 3, 18, 0.95);
        const R = rng(cue.id % 40);
        for (let i = 0; i < 160; i++) field.circle(-pw / 2 + R() * pw, -ph / 2 + R() * ph, 0.8 + R() * 1.8).fill({ color: INK, alpha: 0.25 });
      }
      root.addChild(paper, field);
      if (typeof a.who === 'string') {
        const sp = paintingOf(k, a.who, art, ph * 0.86);
        if (sp) {
          sp.position.set(0, ph * 0.22);
          const m2 = new Graphics().poly(pts).fill(0xffffff);
          sp.mask = m2;
          root.addChild(sp, m2);
        }
      }
      if (title) {
        const t = st.book.sprite(title, titleO);
        t.position.set(0, ph * 0.36);
        const sc = Math.min(1, (pw * 0.92) / t.width);
        t.scale.set(sc);
        root.addChild(t);
      }
      if (typeof a.sub === 'string') {
        const t = st.book.sprite(a.sub, subO);
        t.position.set(pw * 0.08, -ph * 0.4);
        t.rotation = -0.1;
        root.addChild(t);
      }
      // tape strips (street) / staples (comic)
      const tape = new Graphics();
      if (art === 'street') for (const [x, y, r] of [[-pw / 2 + 20, -ph / 2 + 10, -0.6], [pw / 2 - 20, -ph / 2 + 14, 0.6]] as const) tape.rect(-50, -14, 100, 28).fill({ color: 0xf6f0d0, alpha: 0.75 }).position.set(x, y), (tape.rotation = 0), void r;
      root.addChild(tape);
      tornOff = new Graphics();
      root.addChild(tornOff);
      return root;
  };
  const built = st.prebuild(build());
  root = null;
  return clip(cue.m, d, {
    z: 7,
    mount: () => {
      root = built;
      k.layers.panels.addChild(root);
    },
    update: (lt) => {
      if (!root) return;
      const [x, y] = posOf(k, a, a.side === 'left' ? W * 0.27 : W * 0.73, H * 0.5);
      // slapped on (on twos): big → squashed → settled
      const s = lt < 1 / 12 ? 1.22 : lt < 2 / 12 ? 0.95 : 1;
      root.position.set(x, y);
      root.scale.set(s * num(a, 'scale', 1));
      root.rotation = num(a, 'rot', a.side === 'left' ? -0.06 : 0.05);
      const out = 0.16;
      if (lt > d - out) {
        const x2 = (lt - (d - out)) / out;
        if (a.off === 'cut') root.alpha = 1 - x2;
        else {
          root.rotation += x2 * 0.5 * (a.side === 'left' ? -1 : 1);
          root.position.set(x + (a.side === 'left' ? -1 : 1) * x2 * 700, y - x2 * 300);
        }
      } else root.alpha = 1;
    },
    unmount: () => {
      root?.removeFromParent();
      root = null;
    },
  });
};

// ------------------------------------------------------------------ the box's clean comic page
/**
 * A page of 3 panels (boxes!) with our crew: Ben-Day fields, the comic paintings, Bangers captions. `tear` (s): a tag
 * rips across the page at that moment (the Disruptores break into the comic).
 */
const comicPage: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 3);
  const st = S(k);
  const cells = (Array.isArray(a.cells) ? a.cells : []) as Args[];
  const capO = (t: string) => ({ kind: 'comic' as WordKind, size: 54, color: COMIC_INK, ink: 0xffffff, seed: t.length });
  for (const c of cells) if (typeof c.cap === 'string') st.book.get(c.cap, capO(c.cap));
  const tearAt = num(a, 'tear', -1);
  const tagO = { kind: 'tag' as WordKind, size: 180, color: FLUO.pink, halo: FLUO.pink, seed: 13 };
  if (tearAt >= 0) st.book.get(String(a.tag ?? 'SIN CAJAS'), tagO);
  let root: Container | null = null;
  let over: Graphics | null = null;
  let tagSp: Sprite | null = null;
  let tagMask: Graphics | null = null;
  const panels: { c: Container; t0: number; dir: number }[] = [];
  return clip(cue.m, d, {
    mount: () => {
      root = new Container();
      const v = k.view;
      root.addChild(new Graphics().rect(v.x - 40, v.y - 40, v.w + 80, v.h + 80).fill(PRINT.paper));
      const L = v.x + 70;
      const T = v.y + 60;
      const R2 = v.x + v.w - 70;
      const B = v.y + v.h - 60;
      const g = 22;
      const w = R2 - L;
      const polys = [
        [L, T, L + w * 0.42, T, L + w * 0.36, B, L, B],
        [L + w * 0.42 + g, T, L + w * 0.72, T, L + w * 0.66, B, L + w * 0.36 + g, B],
        [L + w * 0.72 + g, T, R2, T, R2, B, L + w * 0.66 + g, B],
      ];
      const fills = [PRINT.cyan, PRINT.magenta, PRINT.yellow];
      cells.forEach((cell, i) => {
        const poly = polys[i % 3];
        const xs = poly.filter((_, j) => j % 2 === 0);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
        const cy = (T + B) / 2;
        const c = new Container();
        const f = new Graphics().poly(poly).fill(typeof cell.color === 'number' ? (cell.color as number) : fills[i % 3]);
        benDay(f, Math.min(...xs), T, Math.max(...xs) - Math.min(...xs), B - T, 20, 1, 7, 0xffffff, 0.3);
        const content = new Container();
        content.addChild(f);
        if (typeof cell.who === 'string') {
          const fc = faceOf(k, cell.who, (cell.art as Art) ?? 'comic', (B - T) * 0.42, !!cell.flip);
          fc.c.position.set(cx, cy + (B - T) * 0.08);
          if (fc.p && typeof cell.emote === 'string') fc.p.emote(cell.emote as 'happy', 1);
          content.addChild(fc.c);
        }
        const mask = new Graphics().poly(poly).fill(0xffffff);
        content.mask = mask;
        const border = new Graphics().poly(poly).stroke({ width: 9, color: COMIC_INK, join: 'miter' });
        c.addChild(content, mask, border);
        if (typeof cell.cap === 'string') {
          const t = st.book.sprite(cell.cap, capO(cell.cap));
          const box = new Graphics().rect(-t.width / 2 - 6, -t.height / 2 + 6, t.width + 12, t.height - 12).fill(0xfff3a8).stroke({ width: 5, color: COMIC_INK });
          const cc = new Container();
          cc.addChild(box, t);
          cc.position.set(cx, T + 70);
          c.addChild(cc);
        }
        root!.addChild(c);
        panels.push({ c, t0: i * num(a, 'stagger', 0.5) * k.beat, dir: i % 2 ? 1 : -1 });
      });
      over = new Graphics();
      root.addChild(over);
      if (tearAt >= 0) {
        tagSp = st.book.sprite(String(a.tag ?? 'SIN CAJAS'), tagO);
        tagSp.position.set(W / 2, H * 0.55);
        tagSp.rotation = -0.14;
        tagMask = new Graphics();
        tagSp.mask = tagMask;
        root.addChild(tagSp, tagMask);
      }
      cover(k, root);
    },
    update: (lt) => {
      if (!root || !over) return;
      k.fullFrame = true;
      for (const p of panels) {
        const x = lt - p.t0;
        p.c.visible = x >= 0;
        const sIn = x < 0.1 ? ease('expoOut', Math.floor((x / 0.1) * 3) / 3) : 1;
        p.c.x = p.dir * (1 - sIn) * 400;
      }
      over.clear();
      if (tearAt >= 0 && lt >= tearAt && tagSp && tagMask) {
        const x = clamp01((lt - tearAt) / 0.35);
        // the tag sprays across, the panels' borders tear behind it
        tagMask.clear();
        tagMask.rect(W / 2 - tagSp.width / 2 - 40, 0, (tagSp.width + 80) * x, H).fill(0xffffff);
        const v = k.view;
        const R = rng(cue.id);
        const pts: number[] = [];
        for (let j = 0; j <= 16 * x; j++) pts.push(v.x + (j / 16) * v.w, v.y + v.h * 0.62 - (j / 16) * v.h * 0.25 + (R() - 0.5) * 40);
        if (pts.length >= 4) {
          over.poly([...pts, pts[pts.length - 2], pts[pts.length - 1] + 26, pts[0], pts[1] + 26], false).fill(0x1c1a21);
          sprayLine(over, pts, 10, FLUO.green, cue.id + 3);
        }
      }
    },
    unmount: () => {
      root?.destroy({ children: true });
      root = over = tagSp = tagMask = null;
      panels.length = 0;
    },
  });
};

// ------------------------------------------------------------------ the stops: plate → sprayed stencil
type Img = 'box' | 'hand' | 'catbox' | 'open';
/** draw a stencil image (one flat color) centred at (x, y), size ≈ s */
function stencilImg(k: Kit, g: Graphics, img: Img, x: number, y: number, s: number, color: number, root: Container | null) {
  if (img === 'box') {
    g.rect(x - s * 0.42, y - s * 0.32, s * 0.84, s * 0.64).fill(color);
    g.rect(x - s * 0.36, y - s * 0.26, s * 0.72, s * 0.52).fill(WALL);
    g.rect(x - s * 0.32, y - s * 0.22, s * 0.64, s * 0.44).fill(color);
    // padlock
    g.rect(x - s * 0.1, y - s * 0.02, s * 0.2, s * 0.16).fill(INK);
    g.moveTo(x - s * 0.06, y - s * 0.02).arc(x, y - s * 0.02, s * 0.06, Math.PI, 0).stroke({ width: s * 0.03, color: INK });
    // cross straps
    g.moveTo(x - s * 0.32, y - s * 0.22).lineTo(x + s * 0.32, y + s * 0.22).stroke({ width: s * 0.03, color: WALL });
    g.moveTo(x + s * 0.32, y - s * 0.22).lineTo(x - s * 0.32, y + s * 0.22).stroke({ width: s * 0.03, color: WALL });
  } else if (img === 'hand') {
    const h = drawHand(new Graphics(), s / 700, 'stencil', color);
    h.position.set(x - s * 0.15, y + s * 0.25);
    root?.addChild(h);
  } else if (img === 'catbox') {
    // a box seen from the front, a cat inside looking up (the cat is the painting's silhouette)
    g.rect(x - s * 0.4, y - s * 0.38, s * 0.8, s * 0.76).stroke({ width: s * 0.05, color });
    for (let i = 1; i < 4; i++) g.moveTo(x - s * 0.4 + (s * 0.8 * i) / 4, y - s * 0.38).lineTo(x - s * 0.4 + (s * 0.8 * i) / 4, y + s * 0.38).stroke({ width: s * 0.025, color });
    const st = S(k);
    const sil = st.studio.silhouette(st.slugs.brecha);
    if (sil && root) {
      sil.tint = INK;
      sil.scale.set((s * 0.55) / sil.texture.height);
      sil.position.set(x, y + s * 0.36);
      root.addChild(sil);
    }
  } else openBox(g, x, y, s * 0.55, color, { line: s * 0.06 });
}
/** the cardboard stencil plate slamming over the frozen frame */
const plate: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 0.75);
  const img = (a.img as Img) ?? 'box';
  let root: Container | null = null;
  const build = () => {
      root = new Container();
      root.zIndex = 9;
      const g = new Graphics();
      const pw = 1100;
      const ph = 780;
      g.rect(-pw / 2 + 14, -ph / 2 + 18, pw, ph).fill({ color: 0x000000, alpha: 0.4 });
      g.rect(-pw / 2, -ph / 2, pw, ph).fill(0xc49a63).stroke({ width: 6, color: 0x7a5a32 });
      // corrugation lines
      for (let y = -ph / 2 + 20; y < ph / 2; y += 26) g.moveTo(-pw / 2 + 10, y).lineTo(pw / 2 - 10, y).stroke({ width: 2, color: 0xa87f4c, alpha: 0.6 });
      // the cut-out (the wall shows through: here, dark)
      const cut = new Graphics();
      const holder = new Container();
      stencilImg(k, cut, img, 0, -20, 520, 0x2a2420, holder);
      g.rect(-pw / 2 + 30, -ph / 2 + 20, 160, 40).fill({ color: 0xf6f0d0, alpha: 0.8 });
      root.addChild(g, cut, holder);
      // old overspray on the cardboard
      const os = new Graphics();
      sprayLine(os, [-pw / 2 + 40, ph / 2 - 60, pw / 2 - 60, ph / 2 - 80], 30, FLUO.pink, 3, { alpha: 0.5 });
      root.addChild(os);
      return root;
  };
  const built = S(k).prebuild(build());
  root = null;
  return clip(cue.m, d, {
    z: 3,
    mount: () => {
      root = built;
      k.layers.panels.addChild(root);
    },
    update: (lt) => {
      if (!root) return;
      const s = lt < 1 / 12 ? 1.3 : lt < 2 / 12 ? 0.97 : 1;
      root.position.set(W / 2, H / 2 + (lt < 1 / 12 ? -40 : 0));
      root.scale.set(s);
      root.rotation = -0.03;
    },
    unmount: () => {
      root?.removeFromParent();
      root = null;
    },
  });
};
/** what got sprayed through the plate (full frame): great = crisp + a tag, hit = crisp, miss = the plate slipped */
const stencilShot: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 1.5);
  const st = S(k);
  const img = (a.img as Img) ?? 'box';
  const r = String(a.r ?? 'great');
  const color = typeof a.color === 'number' ? (a.color as number) : FLUO.pink;
  const word = String(a.word ?? '');
  const wO = { kind: 'stencil' as WordKind, size: 150, color: INK, halo: color, seed: 17 };
  if (word) st.book.get(word, wO);
  const extra = typeof a.extra === 'string' ? (a.extra as string) : '';
  const xO = { kind: 'tag' as WordKind, size: 120, color: FLUO.yellow, halo: FLUO.yellow, seed: 19 };
  if (extra) st.book.get(extra, xO);
  let root: Container | null = null;
  let dr: Graphics | null = null;
  return clip(cue.m, d, {
    mount: () => {
      root = new Container();
      const v = k.view;
      const wall = new Graphics().rect(v.x - 40, v.y - 40, v.w + 80, v.h + 80).fill(0xd9d3c4);
      const R = rng(cue.id % 30);
      for (let i = 0; i < 500; i++) wall.circle(v.x + R() * v.w, v.y + R() * v.h, 0.8 + R() * 2).fill({ color: R() < 0.5 ? 0xbcb5a4 : 0xeee8da, alpha: 0.8 });
      root.addChild(wall);
      const pass = (dx: number, dy: number, alpha: number) => {
        const c = new Container();
        const halo = new Graphics();
        halo.circle(0, 0, 420).fill({ color, alpha: 0.1 });
        const g = new Graphics();
        stencilImg(k, g, img, 0, -60, 560, color, c);
        c.addChildAt(halo, 0);
        c.addChildAt(g, 1);
        c.position.set(W / 2 + dx, H / 2 + dy);
        c.alpha = alpha;
        root!.addChild(c);
      };
      if (r === 'miss') {
        pass(-34, 18, 0.55);
        pass(22, -8, 0.8);
      } else pass(0, 0, 1);
      if (word) {
        const t = st.book.sprite(word, wO);
        t.position.set(W / 2, H * 0.84);
        t.scale.set(Math.min(1, (k.view.w * 0.8) / t.width));
        if (r === 'miss') t.alpha = 0.6;
        root.addChild(t);
      }
      if (extra && r === 'great') {
        const t = st.book.sprite(extra, xO);
        t.position.set(W * 0.77, H * 0.22);
        t.rotation = -0.18;
        root.addChild(t);
      }
      dr = new Graphics();
      root.addChild(dr);
      cover(k, root);
    },
    update: (lt) => {
      if (!root || !dr) return;
      k.fullFrame = true;
      dr.clear();
      drips(dr, W / 2, H / 2 + 200, 500, r === 'miss' ? 12 : 6, clamp01(lt / 1.2), color, cue.id % 40 + 2);
      // the camera breathes on the stencil (on twos)
      const s = 1 + st12(lt) * 0.02;
      root.scale.set(s);
      root.position.set((W / 2) * (1 - s), (H / 2) * (1 - s));
    },
    unmount: () => {
      root?.destroy({ children: true });
      root = dr = null;
    },
  });
};

// ------------------------------------------------------------------ a close-up in colored light
const face: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 1.5);
  const who = String(a.who ?? 'canelo');
  const art = (a.art as Art) ?? 'comic';
  const light = typeof a.light === 'number' ? (a.light as number) : 0x9effd9;
  let root: Container | null = null;
  let p: CatPuppet | null = null;
  let glow: Graphics | null = null;
  return clip(cue.m, d, {
    mount: () => {
      root = new Container();
      const v = k.view;
      root.addChild(new Graphics().rect(v.x - 40, v.y - 40, v.w + 80, v.h + 80).fill(typeof a.bg === 'number' ? (a.bg as number) : 0x0c0a12));
      glow = new Graphics();
      root.addChild(glow);
      const f = faceOf(k, who, art, num(a, 'head', 560), !!a.flip);
      p = f.p;
      // Luzterna's portrait is framed differently from the MAI cats: nudge her head to the centre
      const lz = who === 'luzterna';
      f.c.position.set(num(a, 'x', W / 2) + (lz ? 60 : 0), num(a, 'y', H * 0.52) + (lz ? -30 : 0));
      if (p && typeof a.emote === 'string') p.emote(a.emote as 'happy', 1);
      if (p && typeof a.look === 'number') p.look = a.look as number;
      root.addChild(f.c);
      if (art === 'comic') {
        const fr = new Graphics().rect(v.x + 24, v.y + 24, v.w - 48, v.h - 48).stroke({ width: 10, color: COMIC_INK });
        root.addChild(fr);
      }
      cover(k, root);
    },
    update: (lt) => {
      if (!root || !glow) return;
      k.fullFrame = true;
      glow.clear();
      const x = num(a, 'x', W / 2);
      const fl = 0.7 + 0.3 * Math.sin(lt * 23) * Math.sin(lt * 7);
      glow.circle(x, H * 0.5, 620).fill({ color: light, alpha: 0.08 * fl });
      glow.circle(x, H * 0.5, 380).fill({ color: light, alpha: 0.1 * fl });
      // a slow push-in (on twos)
      const s = 1 + st12(lt) * num(a, 'push', 0.03);
      root.scale.set(s);
      root.position.set((W / 2) * (1 - s), (H / 2) * (1 - s));
    },
    unmount: () => {
      root?.destroy({ children: true });
      root = glow = null;
      p = null;
    },
  });
};

// ------------------------------------------------------------------ the crack and the broken transmission
/**
 * The wall with a crack, Brecha's crowbar wedged in it. Inside: a tape (its own SignalFilter: low-res, scanlines,
 * phosphor, tracking) — a little world, a hand of light draws a box around it, «NO ABRIR», a small cat against the line.
 * The crack opens with `crack` (0..1 key) plus one step per kick of the build (from 180 s) — and bursts at `burst`.
 * Args: dur, burst (momento s, optional), story timing: hand (s after start), box, stamp, cat.
 */
const crack: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 16);
  const st = S(k);
  const stampO = { kind: 'stencil' as WordKind, size: 90, color: 0x1c1a21, halo: 0xff2e88, seed: 23 };
  st.book.get('NO ABRIR', stampO);
  const kicks = k.onsetList('kick').filter((o) => o.t >= 180 && o.t < 196 && o.strength > 0.5).map((o) => o.t);
  let root: Container | null = null;
  let wall: Graphics | null = null;
  let tape: Container | null = null;
  let tapeG: Graphics | null = null;
  let tapeMask: Graphics | null = null;
  let crackG: Graphics | null = null;
  let hand: Graphics | null = null;
  let stamp: Sprite | null = null;
  let kitty: Sprite | null = null;
  let sig: SignalFilter | null = null;
  let brechaSp: Sprite | null = null;
  const crewSil: Sprite[] = [];
  let last = -1;
  const t0 = cue.m;
  return clip(cue.m, d, {
    mount: () => {
      root = new Container();
      const v = k.view;
      // the wall is the BOX itself: the clean comic the hand redrew, at night — a navy page, Ben-Day dots, its panel
      // gutters — with our faded tags still on it. Brecha's crowbar is wedged in it.
      wall = new Graphics();
      wall.rect(v.x - 40, v.y - 40, v.w + 80, v.h + 80).fill(0x111a36);
      const wallDots = benDayLayer(k.renderer, v.x - 40, v.y - 40, v.w + 80, v.h + 80, 26, 1.2, 5.2, 0x2a3f7a, 0.55);
      const wallTop = new Graphics();
      const gut = (x0: number, y0: number, x1: number, y1: number) => {
        wallTop.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: 26, color: 0x2b3352, alpha: 0.9 });
        wallTop.moveTo(x0 - 13, y0).lineTo(x1 - 13, y1).stroke({ width: 5, color: 0x070b18 });
        wallTop.moveTo(x0 + 13, y0).lineTo(x1 + 13, y1).stroke({ width: 5, color: 0x070b18 });
      };
      gut(v.x + v.w * 0.22, v.y - 40, v.x + v.w * 0.2, v.y + v.h + 40);
      gut(v.x + v.w * 0.8, v.y - 40, v.x + v.w * 0.82, v.y + v.h + 40);
      wallTop.moveTo(v.x - 40, v.y + v.h * 0.34).lineTo(v.x + v.w * 0.21, v.y + v.h * 0.33).stroke({ width: 26, color: 0x2b3352, alpha: 0.9 });
      sprayLine(wallTop, [v.x + 120, v.y + 200, v.x + 260, v.y + 120, v.x + 380, v.y + 230], 14, FLUO.pink, 3, { alpha: 0.32 });
      sprayLine(wallTop, [v.x + v.w - 360, v.y + v.h - 150, v.x + v.w - 240, v.y + v.h - 250, v.x + v.w - 110, v.y + v.h - 140], 14, FLUO.green, 4, { alpha: 0.32 });
      const R = rng(9);
      for (let i = 0; i < 420; i++) wallTop.circle(v.x + R() * v.w, v.y + R() * v.h, 0.8 + R() * 2).fill({ color: 0x05070f, alpha: 0.6 });
      // Brecha herself, at the end of her crowbar (street painting, lit by the crack)
      brechaSp = paintingOf(k, 'brecha', 'street', 600);
      if (brechaSp) {
        brechaSp.scale.x *= -1;
        brechaSp.tint = 0xb8c6e0;
      }
      // the tape (inside the crack)
      tape = new Container();
      tapeG = new Graphics();
      hand = drawHand(new Graphics(), 0.62, 'light', 0x9effd9);
      stamp = st.book.sprite('NO ABRIR', stampO);
      stamp.visible = false;
      const sil = st.studio.silhouette(st.slugs.brecha);
      kitty = sil;
      if (kitty) {
        kitty.tint = 0x0b1a14;
        kitty.scale.set(170 / kitty.texture.height);
      }
      tape.addChild(tapeG, hand);
      for (const who of ['grafitera', 'hueco'] as const) {
        const sl = st.studio.silhouette(st.slugs[who]);
        if (!sl) continue;
        sl.tint = 0x0b1a14;
        sl.scale.set(120 / sl.texture.height);
        crewSil.push(sl);
        tape.addChild(sl);
      }
      if (kitty) tape.addChild(kitty);
      // the tape's on-screen display
      const osd = k.text.sprite('▶ REC   CH 07', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 34, fill: 0xd8fff0 }, 0);
      osd.position.set(W / 2 - 300, 150);
      tape.addChild(osd);
      tape.addChild(stamp);
      sig = new SignalFilter(st.signal.u.uPx as number);
      tape.filters = [sig];
      tapeMask = new Graphics();
      tape.mask = tapeMask;
      crackG = new Graphics();
      root.addChild(wall, wallDots, wallTop, tape, tapeMask);
      if (brechaSp) root.addChild(brechaSp);
      root.addChild(crackG);
      cover(k, root);
    },
    unmount: () => {
      root?.destroy({ children: true });
      sig?.destroy();
      root = wall = tape = tapeG = tapeMask = crackG = hand = stamp = kitty = brechaSp = null;
      sig = null;
    },
    update: (lt) => {
      if (!root || !tapeG || !tapeMask || !crackG || !hand || !stamp || !sig) return;
      k.fullFrame = true;
      const m = t0 + lt;
      const v = k.view;
      // how open: the key + a step per kick of the build (each strike pries it wider), the burst at the end
      let opened = k.num('crack', 0.3);
      for (const t of kicks) if (t <= m) opened += 0.018 * ease('outBack', clamp01((m - t) / 0.12));
      const burst = num(a, 'burst', 1e9);
      const ow = st.openWith && m >= st.openWith.m ? st.openWith : null;
      // ¿ABRIR? → no: they push it shut for a beat… and it bursts anyway
      if (ow && !ow.left && m < burst + 0.25) opened -= 0.08 * clamp01((m - ow.m) / 0.1);
      if (m >= burst) opened += ease('expoOut', clamp01((m - burst - (ow && !ow.left ? 0.25 : 0)) / 0.5)) * 1.4;
      const step = Math.floor(m * 12);
      // ---- the crack polygon (jagged, vertical, a bit slanted), redrawn on twos
      const cx = W / 2;
      const half = 18 + opened * 820;
      // the camera leans into the crack through the break, and pulls back as the build pries it open
      const zIn = 1 + 0.2 * ease('inOut', clamp01((m - 164) / 10)) - 0.2 * ease('inOut', clamp01((m - 184) / 10));
      root.scale.set(zIn);
      root.position.set((W / 2) * (1 - zIn), (H / 2) * (1 - zIn));
      const R = rng(41);
      const left: number[] = [];
      const right: number[] = [];
      const n = 16;
      for (let i = 0; i <= n; i++) {
        const y = v.y - 30 + ((v.h + 60) * i) / n;
        const bend = Math.sin(i * 0.9) * 40 + (R() - 0.5) * 36;
        const w = half * (0.55 + 0.45 * Math.sin((i / n) * Math.PI)) * (0.8 + R() * 0.4);
        left.push(cx + bend - w, y);
        right.push(cx + bend + w, y);
      }
      const poly = [...left];
      for (let i = right.length - 2; i >= 0; i -= 2) poly.push(right[i], right[i + 1]);
      tapeMask.clear().poly(poly).fill(0xffffff);
      crackG.clear();
      // the crack's lit lip + the crowbar
      crackG.poly(poly).stroke({ width: 22, color: 0x9effd9, alpha: 0.18 });
      crackG.poly(poly).stroke({ width: 7, color: 0xd8fff0, alpha: 0.85 });
      const kick = k.env('kick', m, 0.1, 0.3);
      const by = H * 0.5 + 40;
      const bx = cx + Math.sin(8 * 0.9) * 40 + half * 0.7;
      const lean = -0.5 + opened * 0.25;
      const c1 = Math.cos(lean);
      const s1 = Math.sin(lean);
      const bar = (u: number, w2: number) => [bx + c1 * u - s1 * w2, by + s1 * u + c1 * w2];
      if (brechaSp) {
        // she hangs her weight on the bar: a heave on every kick, gone once it bursts
        const [ex, ey] = bar(540, 0) as [number, number];
        brechaSp.visible = opened < 0.95;
        brechaSp.position.set(ex + 120, ey + 330 + 14 * kick);
        brechaSp.rotation = -0.12 - 0.05 * kick;
      }
      crackG.poly([...bar(-60, -12), ...bar(560, -14), ...bar(560, 14), ...bar(-60, 12)]).fill(0x5d6474).stroke({ width: 6, color: INK, join: 'round' });
      crackG.poly([...bar(-60, -12), ...bar(-120, -40), ...bar(-110, -10)]).fill(0x5d6474).stroke({ width: 5, color: INK });
      // ¿ABRIR? → yes: a second paw (Canelo's, comic) on the crowbar · no: lantern light pushing the lips shut
      if (ow?.left) pawMark(crackG, ...(bar(330, -26) as [number, number]), 46, 0xf2d0a2, COMIC_INK);
      else if (ow) {
        crackG.poly(poly).stroke({ width: 60, color: 0xfff3b0, alpha: 0.18 });
        crackG.poly(poly).stroke({ width: 16, color: 0xfff3b0, alpha: 0.5 });
      }
      // its lightning (Brecha's crowbar), on the kicks
      if (kick > 0.1) {
        const L = rng(step);
        for (const col of [FLUO.cyan, FLUO.pink]) {
          const pts: number[] = [];
          for (let j = 0; j <= 8; j++) pts.push(...bar(j * 70, (L() - 0.5) * 60 * kick));
          crackG.moveTo(pts[0], pts[1]);
          for (let j = 2; j < pts.length; j += 2) crackG.lineTo(pts[j], pts[j + 1]);
          crackG.stroke({ width: 4, color: col, alpha: kick });
        }
      }
      // ---- the tape (low-res memory)
      if (step !== last) {
        last = step;
        const g = tapeG;
        g.clear();
        // sky + a far horizon
        g.rect(v.x - 40, v.y - 40, v.w + 80, v.h * 0.6).fill(0x2a6f8f);
        g.rect(v.x - 40, v.y + v.h * 0.55, v.w + 80, v.h * 0.6).fill(0x1d4a5e);
        for (let i = 0; i < 12; i++) g.circle(v.x + ((i * 173) % v.w), v.y + 80 + ((i * 97) % 300), 3).fill(0xffffff);
        // a little world floating: an island with a hill, a house, a tree
        const ix = W / 2;
        const iy = H * 0.6;
        g.ellipse(ix, iy + 40, 300, 70).fill(0x6a4a2e);
        g.poly([ix - 300, iy + 40, ix - 200, iy + 160, ix, iy + 220, ix + 200, iy + 150, ix + 300, iy + 40]).fill(0x4a3220);
        g.ellipse(ix, iy, 300, 60).fill(0x5fbf6a);
        g.rect(ix + 60, iy - 110, 110, 90).fill(0xf2d7a8);
        g.poly([ix + 45, iy - 110, ix + 115, iy - 170, ix + 185, iy - 110]).fill(0xd8584a);
        g.rect(ix - 170, iy - 140, 18, 120).fill(0x6a4a2e);
        g.circle(ix - 161, iy - 160, 60).fill(0x3f9f55);
        // after the stamp the world inside the box goes grey («cured»)
        const grey = clamp01((lt - num(a, 'stamp', 13.5) - 0.6) / 1.5);
        if (grey > 0) g.rect(ix - 380, iy - 300, 760, 560).fill({ color: 0x8a9a9a, alpha: 0.5 * grey });
        // the box being drawn around it (after `box` s), pencil lines
        const boxT = num(a, 'box', 6);
        if (lt > boxT) {
          const x = clamp01((lt - boxT) / 2.2);
          const bx0 = ix - 380;
          const by0 = iy - 300;
          const bw = 760;
          const bh = 560;
          const seg = [
            [bx0, by0, bx0 + bw, by0],
            [bx0 + bw, by0, bx0 + bw, by0 + bh],
            [bx0 + bw, by0 + bh, bx0, by0 + bh],
            [bx0, by0 + bh, bx0, by0],
          ];
          const total = x * 4;
          // ¡ROMPE!: the box strains from the inside — its lines bow out on every kick and crack from the corners;
          // holding the button strains it harder (the hold's charge), and even untouched it creaks toward the drop
          const qs = k.prompt('quiebre');
          const held = qs && qs.from !== undefined && qs.to === undefined && m >= qs.from ? clamp01((m - qs.from) / Math.max(0.5, qs.p.mEnd - qs.from)) : 0;
          const strain = Math.max(held, 0.35 * clamp01((m - 198.5) / 3.5));
          const bow = strain * (10 + 34 * kick);
          for (let i = 0; i < 4; i++) {
            const f = clamp01(total - i);
            if (f <= 0) continue;
            const [a0, b0, a1, b1] = seg[i];
            const ex = a0 + (a1 - a0) * f;
            const ey = b0 + (b1 - b0) * f;
            // outward normal of this side (the box is drawn clockwise)
            const nx = [0, 1, 0, -1][i];
            const ny = [-1, 0, 1, 0][i];
            g.moveTo(a0, b0)
              .quadraticCurveTo((a0 + ex) / 2 + nx * bow, (b0 + ey) / 2 + ny * bow, ex, ey)
              .stroke({ width: 12, color: 0xffffff });
          }
          if (strain > 0.05) {
            const corners = [
              [bx0, by0, -1, -1],
              [bx0 + bw, by0, 1, -1],
              [bx0 + bw, by0 + bh, 1, 1],
              [bx0, by0 + bh, -1, 1],
            ];
            for (const [ci, [cx0, cy0, sx, sy]] of corners.entries()) {
              const Rc = rng(ci * 7 + 3);
              const len = strain * (90 + 160 * Rc());
              let px = cx0;
              let py = cy0;
              g.moveTo(px, py);
              for (let j = 1; j <= 4; j++) {
                px = cx0 + (sx * len * j) / 4 + (Rc() - 0.5) * 30;
                py = cy0 + (sy * len * j) / 4 * (0.4 + Rc() * 0.6);
                g.lineTo(px, py);
              }
              g.stroke({ width: 4, color: 0xffffff, alpha: 0.9 });
            }
          }
        }
      }
      // the hand comes down, draws, leaves
      const handT = num(a, 'hand', 4);
      const boxT = num(a, 'box', 6);
      const hx = W / 2 + 380;
      const hy = H * 0.6 - 300;
      if (lt < handT) hand.visible = false;
      else {
        hand.visible = true;
        const inn = ease('out', clamp01((lt - handT) / 1.5));
        const out = clamp01((lt - (boxT + 3.2)) / 1.2);
        // while drawing, the pencil tip runs along the box (same timing as the lines)
        const x = clamp01((lt - boxT) / 2.2) * 4;
        const corners = [
          [W / 2 - 380, hy],
          [W / 2 + 380, hy],
          [W / 2 + 380, hy + 560],
          [W / 2 - 380, hy + 560],
          [W / 2 - 380, hy],
        ];
        const i = Math.min(3, Math.floor(x));
        const f = x - i;
        const tip = lt >= boxT && lt < boxT + 2.2 ? [corners[i][0] + (corners[i + 1][0] - corners[i][0]) * f, corners[i][1] + (corners[i + 1][1] - corners[i][1]) * f] : [hx, hy];
        hand.position.set(tip[0] + (1 - inn) * 400 + out * 500, tip[1] - (1 - inn) * 600 - out * 700);
      }
      // the stamp, then the small cat against the line
      const stampT = num(a, 'stamp', 9.5);
      stamp.visible = lt >= stampT;
      stamp.position.set(W / 2, H * 0.6 - 300);
      stamp.scale.set(lt - stampT < 1 / 12 ? 1.4 : 1);
      if (kitty) {
        // a small cat lives on that island; when the box closes it runs to the line and presses against it
        const catT = num(a, 'cat', 15.5);
        const run = ease('inOut', clamp01((lt - catT) / 1.2));
        const press = lt > catT + 1.2 ? Math.abs(Math.sin(st12(lt - catT) * 3)) * 0.05 : 0;
        kitty.position.set(W / 2 - 60 + run * 380 - press * 40, H * 0.6 + 4 + run * 36);
        kitty.scale.set((150 / kitty.texture.height) * (1 - press), 150 / kitty.texture.height);
        kitty.rotation = run > 0.99 ? -0.12 : 0;
      }
      for (const [i, c] of crewSil.entries()) c.position.set(W / 2 - 170 + i * 260, H * 0.6 + 4);
      // ---- the tape's own signal: worse while the crack is narrow; clearer as it opens; a tracking roll on the voice
      const vox = k.env('vox', m, 0.14, 0.6);
      const clear = Math.max(clamp01((opened - 0.1) / 0.9), st.tuneAt(m) * 0.85);
      sig.reset();
      sig.max({ pixel: 9 * (1 - clear) + 2, scan: 0.9 - 0.5 * clear, phos: 0.85 - 0.6 * clear, low: 0.8 * (1 - clear), rgb: 3 + 5 * vox, track: 0.5 + vox, trackY: (m * 0.13) % 1, noise: 0.25 * (1 - clear) + 0.2 * vox, block: vox * 0.5 });
      sig.commit(m, step % 97, k.reduceMotion ? 0.25 : 1, k.reduceFlashes);
    },
  });
};

// ------------------------------------------------------------------ paw vs crowbar, split down a torn diagonal
const duel: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 0.55);
  const prompt = typeof a.prompt === 'string' ? (a.prompt as string) : '';
  let root: Container | null = null;
  let mid: Graphics | null = null;
  let leftC: Container | null = null;
  let rightC: Container | null = null;
  return clip(cue.m, d, {
    mount: () => {
      root = new Container();
      const v = k.view;
      const tear = tornEdge(v.x + v.w * 0.58, v.y - 40, v.x + v.w * 0.42, v.y + v.h + 40, cue.id % 30, 22, 30);
      const lp = [v.x - 60, v.y - 60, ...tear, v.x - 60, v.y + v.h + 60];
      const rp = [...tear, v.x + v.w + 60, v.y + v.h + 60, v.x + v.w + 60, v.y - 60];
      // comic side: Canelo
      leftC = new Container();
      const lbg = new Graphics().rect(v.x - 60, v.y - 60, v.w + 120, v.h + 120).fill(PRINT.cyan);
      leftC.addChild(lbg, benDayLayer(k.renderer, v.x, v.y, v.w * 0.6, v.h, 22, 1, 8, 0xffffff, 0.35));
      const fc = faceOf(k, 'canelo', 'comic', 560);
      fc.c.position.set(v.x + v.w * 0.26, H * 0.55);
      if (fc.p) fc.p.emote('attack', 1);
      leftC.addChild(fc.c);
      const lm = new Graphics().poly(lp).fill(0xffffff);
      leftC.mask = lm;
      // street side: Brecha
      rightC = new Container();
      const rbg = new Graphics().rect(v.x - 60, v.y - 60, v.w + 120, v.h + 120).fill(0x1c1a21);
      sprayLine(rbg, [v.x + v.w * 0.55, v.y + 120, v.x + v.w * 0.95, v.y + 260], 40, FLUO.pink, cue.id, { alpha: 0.6 });
      rightC.addChild(rbg);
      const fb = faceOf(k, 'brecha', 'street', 560, true);
      fb.c.position.set(v.x + v.w * 0.74, H * 0.55);
      if (fb.p) fb.p.emote('attack', 1);
      rightC.addChild(fb.c);
      const rm = new Graphics().poly(rp).fill(0xffffff);
      rightC.mask = rm;
      mid = new Graphics();
      root.addChild(leftC, lm, rightC, rm, mid);
      cover(k, root);
    },
    update: (lt) => {
      if (!root || !mid || !leftC || !rightC) return;
      k.fullFrame = true;
      const j = prompt ? k.judged(prompt) : null;
      const won = j && j.r !== 'miss' && k.m >= j.at;
      const lost = j && j.r === 'miss' && k.m >= j.at;
      // the side that wins the beat pushes into the other's half
      const push = won ? ease('expoOut', clamp01((k.m - j!.at) / 0.15)) * 80 : lost ? -ease('expoOut', clamp01((k.m - j!.at) / 0.15)) * 80 : 0;
      leftC.x = push * 0.5;
      rightC.x = push * 0.5;
      mid.clear();
      // the clash point: paw and crowbar meet; sparks on twos
      const cx = W / 2 + push;
      const cy = H * 0.5;
      const R = rng(Math.floor(lt * 12) + cue.id);
      if (won || lost) {
        starburst(mid, cx, cy, 120, 12, won ? PRINT.yellow : FLUO.pink, cue.id + Math.floor(lt * 12));
        for (let i = 0; i < 10; i++) {
          const an = R() * Math.PI * 2;
          const rr = 140 + R() * 160;
          mid.moveTo(cx + Math.cos(an) * 100, cy + Math.sin(an) * 100).lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr).stroke({ width: 6, color: won ? COMIC_INK : FLUO.cyan });
        }
      }
      pawMark(mid, cx - 80, cy + 10, 70, 0xf2d0a2, COMIC_INK);
      mid.poly([cx + 40, cy - 30, cx + 520, cy - 120, cx + 530, cy - 90, cx + 50, cy]).fill(0x5d6474).stroke({ width: 6, color: INK });
    },
    unmount: () => {
      root?.destroy({ children: true });
      root = mid = leftC = rightC = null;
    },
  });
};

// ------------------------------------------------------------------ the closing composition
const hero: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 2);
  const st = S(k);
  const wO = { kind: 'marker' as WordKind, size: 96, color: WALL, halo: FLUO.pink, seed: 29 };
  st.book.get('NINGUNA CAJA ES HOGAR', wO);
  let root: Container | null = null;
  let fx: Graphics | null = null;
  return clip(cue.m, d, {
    mount: () => {
      root = new Container();
      const v = k.view;
      // left: the comic (our crew), right: the wall (theirs), a rift between
      const bg = new Graphics();
      bg.rect(v.x - 60, v.y - 60, v.w + 120, v.h + 120).fill(0x1c1a21);
      const lp = [v.x - 60, v.y - 60, v.x + v.w * 0.52, v.y - 60, v.x + v.w * 0.44, v.y + v.h + 60, v.x - 60, v.y + v.h + 60];
      bg.poly(lp).fill(PRINT.blue);
      root.addChild(bg);
      // the dots only on the comic side (the slanted left part)
      const dots = benDayLayer(k.renderer, v.x, v.y + v.h * 0.4, v.w * 0.5, v.h * 0.6, 22, 0.5, 8, 0x2e4aa0, 1);
      const dm = new Graphics().poly(lp).fill(0xffffff);
      dots.mask = dm;
      root.addChild(dots, dm);
      // the emblem, huge
      const em = new Graphics();
      openBox(em, W / 2, H * 0.42, 340, FLUO.green, { line: 30 });
      root.addChild(em);
      const place = (who: string, art: Art, x: number, h: number, flip: boolean) => {
        const sp = paintingOf(k, who, art, h);
        if (!sp) return;
        sp.position.set(x, v.y + v.h + 30);
        if (flip) sp.scale.x *= -1;
        root!.addChild(sp);
      };
      place('luzterna', 'comic', v.x + v.w * 0.12, 520, false);
      place('canelo', 'comic', v.x + v.w * 0.3, 620, false);
      place('grafitera', 'street', v.x + v.w * 0.7, 560, true);
      place('brecha', 'street', v.x + v.w * 0.88, 660, true);
      const t = st.book.sprite('NINGUNA CAJA ES HOGAR', wO);
      t.position.set(W / 2, v.y + 110);
      t.scale.set(Math.min(1, (v.w * 0.9) / t.width));
      t.rotation = -0.03;
      root.addChild(t);
      fx = new Graphics();
      root.addChild(fx);
      cover(k, root);
    },
    update: (lt) => {
      if (!root || !fx) return;
      k.fullFrame = true;
      fx.clear();
      // the seam between the arts: a living rift, on twos
      const v = k.view;
      const R = rng(Math.floor(lt * 12));
      const pts: number[] = [];
      for (let i = 0; i <= 12; i++) pts.push(v.x + v.w * (0.52 - 0.08 * (i / 12)) + (R() - 0.5) * 30, v.y - 40 + ((v.h + 80) * i) / 12);
      sprayLine(fx, pts, 16, FLUO.green, Math.floor(lt * 12), { speck: 1.5 });
      fx.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) fx.lineTo(pts[i], pts[i + 1]);
      fx.stroke({ width: 5, color: 0xffffff });
      const s = 1.04 - st12(lt) * 0.02;
      root.scale.set(s);
      root.position.set((W / 2) * (1 - s), (H / 2) * (1 - s));
      // the kicks still land
      const kick = k.env('kick', k.m, 0.1, 0.3);
      if (kick > 0.05) splat(fx, W / 2, H * 0.42, 40 + 80 * kick, FLUO.pink, Math.floor(k.m * 2), { s: 0.4 });
    },
    unmount: () => {
      root?.destroy({ children: true });
      root = fx = null;
    },
  });
};

export const SHOT_VERBS: Record<string, VerbFn> = { coldOpen, rip, poster, comicPage, plate, stencilShot, face, crack, duel, hero };
export type { Clip, Texture };
