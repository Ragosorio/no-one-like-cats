/**
 * Element badges as SVG (public/icons/el-*.svg) — never emojis.
 *   elementIcon('fire', 32)            → Sprite (anchor 0.5)
 *   iconText('Une {fire} y {water}', style, { wrap: 400 }) → Container with inline badges
 * iconText also converts legacy element emojis (🔥💧🌿🌱🪨⚡✨🌌🕳) found in content strings.
 */
import { Assets, Container, Sprite, Text, TextStyle, TextStyleOptions, Texture } from 'pixi.js';
import { C, F } from './theme';

export const ELEMENT_IDS = ['fire', 'water', 'nature', 'earth', 'storm', 'magic', 'cosmic', 'ice', 'sound', 'shadow', 'time', 'light', 'void', 'crystal', 'unknown'] as const;
export type ElementIconId = (typeof ELEMENT_IDS)[number];

/** sim/legacy ids → badge */
const ALIAS: Record<string, ElementIconId> = {
  electric: 'storm',
  wind: 'storm',
  spirit: 'magic',
  plant: 'nature',
  rock: 'earth',
  neutral: 'unknown',
  '???': 'unknown',
};
const EMOJI: Record<string, ElementIconId> = {
  '🔥': 'fire',
  '💧': 'water',
  '🌿': 'nature',
  '🌱': 'nature',
  '🪨': 'earth',
  '⚡': 'storm',
  '✨': 'magic',
  '🌌': 'cosmic',
  '🕳️': 'void',
  '🕳': 'void',
  '💎': 'crystal',
  '❔': 'unknown',
};

export function iconId(el: string): ElementIconId {
  if ((ELEMENT_IDS as readonly string[]).includes(el)) return el as ElementIconId;
  return ALIAS[el] ?? EMOJI[el] ?? 'unknown';
}

const tex = new Map<ElementIconId, Texture>();
let loading: Promise<void> | null = null;

/** load all badges once (call at boot; safe to call again) */
export function preloadElementIcons(): Promise<void> {
  loading ??= Promise.all(
    ELEMENT_IDS.map(async (id) => {
      const t = await Assets.load<Texture>({ alias: `el-icon-${id}`, src: `icons/el-${id}.svg`, data: { resolution: 3 } });
      tex.set(id, t);
    }),
  ).then(() => undefined);
  return loading;
}

export function elementTexture(el: string): Texture | null {
  return tex.get(iconId(el)) ?? null;
}

/** badge sprite of `size` px (diameter); fills in when the texture finishes loading */
export function elementIcon(el: string, size = 32): Sprite {
  const id = iconId(el);
  const s = new Sprite(tex.get(id) ?? Texture.EMPTY);
  s.anchor.set(0.5);
  const fit = () => {
    if (s.destroyed) return;
    s.scale.set(size / Math.max(1, s.texture.width));
  };
  if (tex.has(id)) fit();
  else
    void preloadElementIcons().then(() => {
      if (s.destroyed) return;
      s.texture = tex.get(id) ?? Texture.EMPTY;
      fit();
    });
  return s;
}

const TOKEN = /\{(fire|water|nature|earth|storm|magic|cosmic|ice|sound|shadow|time|light|void|crystal|unknown|electric)\}|(🔥|💧|🌿|🌱|🪨|⚡|✨|🌌|🕳️|🕳|💎|❔)/gu;

export interface IconTextOpts {
  /** wrap width in px (greedy, by words) */
  wrap?: number;
  /** icon diameter relative to font size */
  iconScale?: number;
  /** extra line spacing in px */
  leading?: number;
}

/** Text with inline element badges. Tokens: {fire} {water} … or legacy emojis. */
export function iconText(src: string, style: TextStyleOptions = {}, o: IconTextOpts = {}): Container {
  const st = new TextStyle({ fontFamily: F.ui, fontSize: 24, fill: C.ink, ...style, wordWrap: false });
  const fs = Number(st.fontSize) || 24;
  const isz = fs * (o.iconScale ?? 1.15);
  const lineH = Math.max(fs * 1.25, isz) + (o.leading ?? 2);
  const root = new Container();
  let x = 0;
  let y = 0;
  const wrap = o.wrap ?? Infinity;
  const newline = () => {
    x = 0;
    y += lineH;
  };
  const place = (node: Container, w: number) => {
    if (x > 0 && x + w > wrap) newline();
    node.x += x;
    node.y += y;
    root.addChild(node);
    x += w;
  };
  for (const [li, line] of src.split('\n').entries()) {
    if (li > 0) newline();
    // split into words + tokens, keeping spaces attached to words
    const parts: { t: 'w' | 'i'; v: string }[] = [];
    let last = 0;
    for (const m of line.matchAll(TOKEN)) {
      if (m.index! > last) parts.push({ t: 'w', v: line.slice(last, m.index) });
      parts.push({ t: 'i', v: m[1] ?? m[2] });
      last = m.index! + m[0].length;
    }
    if (last < line.length) parts.push({ t: 'w', v: line.slice(last) });
    for (const p of parts) {
      if (p.t === 'i') {
        const s = elementIcon(p.v, isz);
        s.position.set(isz / 2 + 1, lineH / 2);
        place(s, isz + 3);
        continue;
      }
      for (const word of p.v.split(/(?<=\s)/)) {
        if (!word) continue;
        const t = new Text({ text: word, style: st, resolution: 2 });
        t.y = (lineH - t.height) / 2;
        if (x === 0 && word.trim() === '') {
          t.destroy();
          continue;
        }
        place(t, t.width);
      }
    }
  }
  return root;
}

/** plain-text label for an element (no emoji) */
export function stripElementEmojis(s: string): string {
  return s.replace(TOKEN, '').replace(/\s{2,}/g, ' ').trim();
}
