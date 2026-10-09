/** Shared drawing helpers for the campaign screens (DIARIO DEL MAR · NOIR · plano técnico). */
import { Container, Graphics, Sprite, Text, TextStyleOptions, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { icon, IconKind } from '../../ui/icons';
import { paperTexture, halftoneTexture } from '../../art/textures';
import { catTexture, elementFx, preloadCats } from '../../art/catArt';
import { applyCatTint, slugOf } from '../../art/tint';
import { ELEMENT_NAME } from '../../data/elementsMeta';
import { elementIcon } from '../../ui/elementIcon';
import { CAT_BY_ID } from '../../data/content';
import { G } from '../../state/game';
import { catSlug } from '../../state/sys/forms';
import { fmt } from '../../core/format';

/** DIARIO DEL MAR palette */
export const P = {
  aged: 0xe9dcc1,
  agedDark: 0xd2bf98,
  agedEdge: 0xa88a5c,
  ink: C.ink,
  blue: C.inkBlue,
  blueSoft: 0x4a5a80,
  red: C.red,
  sea: 0xdcd3bb,
  bp: 0x1d4f91, // blueprint
  bpDark: 0x143a6e,
  bpLine: 0x9cc3f0,
} as const;

/** zone 3 uses "storm" in content: show it as electric */
export function elKey(el: string) {
  return el === 'storm' ? 'electric' : el;
}
/** iconText token for an element badge: `iconText(\`Cristales ${elTok('earth')}\`)` (never emojis) */
export function elTok(el: string) {
  return `{${el === 'electric' ? 'storm' : el}}`;
}
/** @deprecated emojis are gone from the UI — kept so old call sites compile; returns '' */
export function elIcon(_el: string) {
  return '';
}
export function elName(el: string) {
  return ELEMENT_NAME[elKey(el)] ?? el.toUpperCase();
}
/** "Tierra" (capitalized element name) */
export function elNameCap(el: string) {
  const n = elName(el);
  return n.charAt(0) + n.slice(1).toLowerCase();
}

/** round element seal (SVG badge from ui/elementIcon), centered at 0,0 */
export function elementBadge(el: string, size = 44): Container {
  const c = new Container();
  const sh = new Graphics().circle(2, 3, size / 2).fill({ color: C.ink, alpha: 0.85 });
  const s = elementIcon(elKey(el) === 'electric' ? 'storm' : el, size);
  c.addChild(sh, s);
  return c;
}

export function chanceColor(p: number) {
  return p >= 0.7 ? C.green : p >= 0.45 ? C.yellow : C.red;
}

/** icon + amount; red when the player can't afford it */
export function resChip(kind: IconKind, label: string, ok = true, size = 26, tint?: number): Container {
  const c = new Container();
  const ic = icon(kind, size, tint);
  ic.position.set(size / 2, size / 2);
  const t = txt(label, { fontFamily: F.heavy, fontSize: size * 0.78, fill: ok ? C.ink : C.red });
  t.position.set(size + 6, size / 2 - t.height / 2);
  c.addChild(ic, t);
  return c;
}

/** rubber stamp (double border, slight rotation) */
export function stamp(text: string, color: number = C.red, size = 34, rot = -0.08, font: string = F.poster): Container {
  const c = new Container();
  const t = txt(text, { fontFamily: font, fontSize: size, fill: color, letterSpacing: 2 });
  t.anchor.set(0.5);
  const w = t.width + size * 0.9;
  const h = t.height + size * 0.35;
  const g = new Graphics()
    .roundRect(-w / 2, -h / 2, w, h, 6)
    .stroke({ width: 4, color })
    .roundRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 4)
    .stroke({ width: 2, color });
  c.addChild(g, t);
  c.rotation = rot;
  c.alpha = 0.92;
  return c;
}

/** deterministic noise */
export function hash1(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** jagged/torn rectangle polygon */
export function tornRect(w: number, h: number, seed = 1, amp = 5, step = 14): number[] {
  const pts: number[] = [];
  let i = 0;
  const j = () => (hash1(seed * 31 + i++) - 0.5) * amp * 2;
  for (let x = 0; x <= w; x += step) pts.push(x, j());
  for (let y = step; y <= h; y += step) pts.push(w + j(), y);
  for (let x = w - step; x >= 0; x -= step) pts.push(x, h + j());
  for (let y = h - step; y > 0; y -= step) pts.push(j(), y);
  return pts;
}

/** paper clipping with torn edges, grain and a block shadow */
export function clipping(w: number, h: number, o: { color?: number; seed?: number; shadow?: boolean; amp?: number } = {}): Container {
  const c = new Container();
  const pts = tornRect(w, h, o.seed ?? 3, o.amp ?? 4);
  if (o.shadow !== false) {
    const sh = new Graphics().poly(pts.map((v, i) => v + (i % 2 ? 10 : 10))).fill({ color: C.ink, alpha: 0.85 });
    c.addChild(sh);
  }
  const base = new Graphics().poly(pts).fill(o.color ?? P.aged);
  const grain = new TilingSprite({ texture: paperTexture(o.color ?? P.aged, 512, 1.4), width: w + 20, height: h + 20 });
  grain.position.set(-10, -10);
  const mask = new Graphics().poly(pts).fill(0xffffff);
  grain.mask = mask;
  const edge = new Graphics().poly(pts).stroke({ width: 2, color: P.agedEdge, alpha: 0.9 });
  c.addChild(base, grain, mask, edge);
  return c;
}

/** fake newspaper column text (gray rules) */
export function columnText(w: number, lines: number, color: number = C.ink, lh = 13, seed = 1): Graphics {
  const g = new Graphics();
  for (let i = 0; i < lines; i++) {
    const last = i === lines - 1 || hash1(seed + i * 7) < 0.08;
    const lw = last ? w * (0.3 + hash1(seed + i) * 0.4) : w - hash1(seed + i * 3) * 8;
    // words
    let x = 0;
    let k = 0;
    while (x < lw) {
      const ww = 14 + hash1(seed * 13 + i * 17 + k++) * 46;
      g.rect(x, i * lh, Math.min(ww, lw - x), lh * 0.42);
      x += ww + 5;
    }
  }
  g.fill({ color, alpha: 0.38 });
  return g;
}

/** horizontal double rule (newspaper) */
export function doubleRule(w: number, color: number = C.ink, thick = 3) {
  return new Graphics().rect(0, 0, w, thick).fill(color).rect(0, thick + 3, w, 1).fill(color);
}

export async function ensureCats(species: string[]) {
  // owned cats of these species may show up in a FORM (state/sys/forms.ts): their painting too
  const forms = G.s.cats.filter((c) => c.form && species.includes(c.species)).map((c) => catSlug(c));
  const slugs = [...new Set([...species.map((s) => slugOf(s)), ...forms])];
  try {
    await preloadCats(slugs);
  } catch {
    /* missing art: textures fall back to white */
  }
}

/** circular cat portrait with element ring (call ensureCats first) */
export function catPortrait(species: string, size = 96, o: { ring?: number; bg?: number; grayscale?: boolean; slug?: string } = {}): Container {
  const c = new Container();
  const def = CAT_BY_ID.get(species);
  const el = def?.elements[0] ?? 'fire';
  const fx = elementFx(elKey(el));
  const r = size / 2;
  const ring = new Graphics().circle(3, 4, r).fill(C.ink).circle(0, 0, r).fill(o.bg ?? fx.main).stroke({ width: 4, color: o.ring ?? C.ink });
  const dots = new TilingSprite({ texture: halftoneTexture(fx.dark, 8, 1.6), width: size, height: size });
  dots.position.set(-r, -r);
  dots.alpha = 0.35;
  const dm = new Graphics().circle(0, 0, r - 3).fill(0xffffff);
  dots.mask = dm;
  // an owned cat's own painting (its FORM: pass catSlug(c)) or the species'
  const sp = new Sprite(catTexture(o.slug ?? slugOf(species)));
  sp.anchor.set(0.5, 0.42);
  const s = (size * 1.18) / Math.max(1, sp.texture.width);
  sp.scale.set(s);
  sp.y = r * 0.1;
  applyCatTint(sp, species);
  const m = new Graphics().circle(0, 0, r - 3).fill(0xffffff);
  sp.mask = m;
  c.addChild(ring, dots, dm, m, sp);
  return c;
}

export function label(text: string, size = 18, color: number = C.ink, extra: TextStyleOptions = {}): Text {
  return txt(text, { fontFamily: F.ui, fontWeight: '700', fontSize: size, fill: color, ...extra });
}

export function heading(text: string, size = 40, color: number = C.ink, extra: TextStyleOptions = {}): Text {
  return txt(text, { fontFamily: F.poster, fontSize: size, fill: color, ...extra });
}

export function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/** tween a number with a formatter onto a Text (tick-up, duration ∝ log Δ) */
export function tickUp(t: Text, to: number, o: { prefix?: string; suffix?: string; from?: number; dur?: number; onTick?: (p: number) => void; format?: (n: number) => string } = {}) {
  const f = o.format ?? fmt;
  const from = o.from ?? 0;
  const d = o.dur ?? Math.max(0.35, Math.min(2.2, 0.35 + 0.18 * Math.log10(Math.max(1, Math.abs(to - from)))));
  const obj = { v: from };
  let lastTick = 0;
  return gsap.to(obj, {
    v: to,
    duration: d,
    ease: 'power3.out',
    onUpdate: () => {
      if (t.destroyed) return;
      t.text = `${o.prefix ?? ''}${f(Number.isInteger(to) ? Math.round(obj.v) : obj.v)}${o.suffix ?? ''}`;
      const now = performance.now();
      if (now - lastTick > 55) {
        lastTick = now;
        o.onTick?.(obj.v / Math.max(1e-9, to));
      }
    },
  });
}

/** simple clickable area wrapper */
export function clickable(c: Container, fn: () => void) {
  c.eventMode = 'static';
  c.cursor = 'pointer';
  c.on('pointertap', fn);
  return c;
}

/** kill every GSAP tween aimed at a display tree (call before destroying UI that may still be animating) */
export function killTree(c: Container) {
  gsap.killTweensOf(c);
  gsap.killTweensOf(c.scale);
  gsap.killTweensOf(c.position);
  for (const ch of c.children) killTree(ch as Container);
}

/** remove + destroy all children safely (no orphan tweens on destroyed objects) */
export function clearChildren(c: Container) {
  for (const ch of c.removeChildren()) {
    killTree(ch as Container);
    ch.destroy({ children: true });
  }
}
