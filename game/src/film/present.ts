/**
 * PELÍCULAS — the presentation layer: letterbox / aspect, chapter and title cards with per-dimension typography,
 * subtitles over a calm zone. Cards and subtitles are VERBS (the timeline compiles a scene's `cards` / `subs` into
 * 'card' / 'sub' cues): their text textures are made in the verb body, i.e. while the film is prepared — never on the
 * clock.
 *
 *  - Cards live in layers.type (under the letterbox, over the picture: they get the film's grain like the picture).
 *  - Subtitles live in layers.ui (no post: always crisp). They sit INSIDE the bottom letterbox bar when it is tall
 *    enough (the calmest zone there is), else low on a soft plate. Never over a face (the set can publish a
 *    'subtitle' anchor to move them).
 */
import { Container, Graphics, Sprite, type TextStyleOptions } from 'pixi.js';
import type { Kit, VerbFn } from '../momentos/anime/kit';
import { clip } from '../momentos/anime/kit';
import type { TypeStyle } from './types';

interface TypeDef {
  title: (size: number) => TextStyleOptions;
  sub: (size: number) => TextStyleOptions;
  num: (size: number) => TextStyleOptions;
  /** how a card comes in */
  enter: 'paint' | 'ink' | 'bass' | 'silent' | 'stamp' | 'fade';
  /** card accent (underline, bars, frame) */
  accent: number;
  accent2: number;
  /** subtitles in this style */
  line: (size: number) => TextStyleOptions;
  /** mirror the sub line (Leonardo's notes are written right to left) */
  mirrorSub?: boolean;
}

const SUB_BASE = (size: number): TextStyleOptions => ({
  fontFamily: 'Space Grotesk',
  fontWeight: '600',
  fontSize: size,
  fill: 0xf6f1e7,
  stroke: { color: 0x0b0716, width: Math.max(4, size * 0.16), join: 'round' },
  align: 'center',
  wordWrap: true,
  wordWrapWidth: 1300,
  lineHeight: size * 1.25,
});

export const TYPE: Record<TypeStyle, TypeDef> = {
  vangogh: {
    title: (s) => ({ fontFamily: 'Permanent Marker', fontSize: s, fill: 0xf4c430, stroke: { color: 0x13235c, width: s * 0.09, join: 'round' }, letterSpacing: s * 0.04, align: 'center' }),
    sub: (s) => ({ fontFamily: 'Permanent Marker', fontSize: s, fill: 0xe9eefc, stroke: { color: 0x13235c, width: s * 0.1, join: 'round' }, align: 'center' }),
    num: (s) => ({ fontFamily: 'Permanent Marker', fontSize: s, fill: 0x8fb8ff, stroke: { color: 0x13235c, width: s * 0.1, join: 'round' } }),
    enter: 'paint',
    accent: 0xf4c430,
    accent2: 0x3a6ad8,
    line: (s) => ({ ...SUB_BASE(s), fontFamily: 'Permanent Marker', fontWeight: '400', fill: 0xfff3c4, stroke: { color: 0x0e1a46, width: s * 0.16, join: 'round' } }),
  },
  davinci: {
    title: (s) => ({ fontFamily: 'Playfair Display', fontStyle: 'italic', fontWeight: '700', fontSize: s, fill: 0x4a2c17, letterSpacing: s * 0.02, align: 'center' }),
    sub: (s) => ({ fontFamily: 'Playfair Display', fontStyle: 'italic', fontSize: s, fill: 0x8a3a1e, align: 'center' }),
    num: (s) => ({ fontFamily: 'Playfair Display', fontWeight: '700', fontSize: s, fill: 0x8a3a1e }),
    enter: 'ink',
    accent: 0x8a3a1e,
    accent2: 0x4a2c17,
    line: (s) => ({ ...SUB_BASE(s), fontFamily: 'Playfair Display', fontStyle: 'italic', fontWeight: '700', fill: 0xfaf0dc, stroke: { color: 0x2a170a, width: s * 0.16, join: 'round' } }),
    mirrorSub: true,
  },
  noir: {
    title: (s) => ({ fontFamily: 'Bebas Neue', fontSize: s, fill: 0xf3efe6, letterSpacing: s * 0.22, align: 'center' }),
    sub: (s) => ({ fontFamily: 'Space Grotesk', fontWeight: '500', fontSize: s, fill: 0xd8d2c4, letterSpacing: s * 0.3, align: 'center' }),
    num: (s) => ({ fontFamily: 'Bebas Neue', fontSize: s, fill: 0xff3d8b, letterSpacing: s * 0.2 }),
    enter: 'bass',
    accent: 0xff3d8b,
    accent2: 0xf3efe6,
    line: (s) => SUB_BASE(s),
  },
  tv: {
    title: (s) => ({ fontFamily: 'Bangers', fontSize: s, fill: 0xfff6e0, stroke: { color: 0x1d1430, width: s * 0.1, join: 'round' }, letterSpacing: s * 0.05, align: 'center' }),
    sub: (s) => ({ fontFamily: 'Bangers', fontSize: s, fill: 0xff7fb0, stroke: { color: 0x1d1430, width: s * 0.1, join: 'round' } }),
    num: (s) => ({ fontFamily: 'Bangers', fontSize: s, fill: 0xf4a62a, stroke: { color: 0x1d1430, width: s * 0.1, join: 'round' } }),
    enter: 'stamp',
    accent: 0xf4a62a,
    accent2: 0xff7fb0,
    line: (s) => SUB_BASE(s),
  },
  silent: {
    title: (s) => ({ fontFamily: 'Playfair Display', fontWeight: '700', fontSize: s, fill: 0xf1ead8, letterSpacing: s * 0.06, align: 'center' }),
    sub: (s) => ({ fontFamily: 'Playfair Display', fontStyle: 'italic', fontSize: s, fill: 0xd9cfb8, align: 'center' }),
    num: (s) => ({ fontFamily: 'Playfair Display', fontWeight: '700', fontSize: s, fill: 0xd9cfb8 }),
    enter: 'silent',
    accent: 0xd9cfb8,
    accent2: 0x7a6f5a,
    line: (s) => SUB_BASE(s),
  },
  ukiyoe: {
    title: (s) => ({ fontFamily: 'Dela Gothic One', fontSize: s, fill: 0xf3ead8, letterSpacing: s * 0.08, align: 'center' }),
    sub: (s) => ({ fontFamily: 'Dela Gothic One', fontSize: s, fill: 0x1f2a44 }),
    num: (s) => ({ fontFamily: 'Dela Gothic One', fontSize: s, fill: 0xc8402e }),
    enter: 'stamp',
    accent: 0xc8402e,
    accent2: 0x1f2a44,
    line: (s) => SUB_BASE(s),
  },
  bass: {
    title: (s) => ({ fontFamily: 'Bebas Neue', fontSize: s, fill: 0x141414, letterSpacing: s * 0.12, align: 'center' }),
    sub: (s) => ({ fontFamily: 'Bebas Neue', fontSize: s, fill: 0x141414, letterSpacing: s * 0.3 }),
    num: (s) => ({ fontFamily: 'Bebas Neue', fontSize: s, fill: 0xf3efe6 }),
    enter: 'bass',
    accent: 0xe8a33a,
    accent2: 0xc8402e,
    line: (s) => SUB_BASE(s),
  },
  default: {
    title: (s) => ({ fontFamily: 'Anton', fontSize: s, fill: 0xf6f1e7, letterSpacing: s * 0.04, align: 'center' }),
    sub: (s) => ({ fontFamily: 'Space Grotesk', fontWeight: '500', fontSize: s, fill: 0xd8d2c4, letterSpacing: s * 0.2 }),
    num: (s) => ({ fontFamily: 'Anton', fontSize: s, fill: 0xff2e88 }),
    enter: 'fade',
    accent: 0xff2e88,
    accent2: 0xf6f1e7,
    line: (s) => SUB_BASE(s),
  },
};
/** every font the presentation can use (loaded during the loading screen) */
export const TYPE_FONTS = [
  '80px "Permanent Marker"',
  'italic 700 80px "Playfair Display"',
  'italic 400 40px "Playfair Display"',
  '700 80px "Playfair Display"',
  '80px "Bebas Neue"',
  '500 40px "Space Grotesk"',
  '600 40px "Space Grotesk"',
  '80px "Bangers"',
  '80px "Dela Gothic One"',
  '80px "Anton"',
];

const sm = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const st = (k: Kit, a: Record<string, unknown>): TypeStyle => {
  const s = String(a.style ?? 'default') as TypeStyle;
  return TYPE[s] ? s : 'default';
};

// ------------------------------------------------------------------ letterbox
export class Letterbox {
  readonly g = new Graphics();
  /** bottom bar height this frame (design px): subtitles sit inside it when ≥ SUB_IN_BAR */
  bottom = 0;
  private key = '';
  draw(view: { x: number; y: number; w: number; h: number }, aspect: number, color = 0x000000) {
    const g = this.g;
    const key = `${view.x},${view.y},${view.w},${view.h},${aspect.toFixed(4)},${color}`;
    if (key === this.key) return;
    this.key = key;
    g.clear();
    const va = view.w / view.h;
    this.bottom = 0;
    if (aspect > va + 0.005) {
      const bh = (view.h - view.w / aspect) / 2;
      g.rect(view.x - 2, view.y - 2, view.w + 4, bh + 2).fill(color).rect(view.x - 2, view.y + view.h - bh, view.w + 4, bh + 2).fill(color);
      this.bottom = bh;
    } else if (aspect < va - 0.005) {
      const bw = (view.w - view.h * aspect) / 2;
      g.rect(view.x - 2, view.y - 2, bw + 2, view.h + 4).fill(color).rect(view.x + view.w - bw, view.y - 2, bw + 2, view.h + 4).fill(color);
    }
  }
}
export const SUB_IN_BAR = 70;

// ------------------------------------------------------------------ cards
/**
 * 'card' { text, sub?, num?, style, pos?, dur }: a chapter / title card. Enters in its style (paint strokes, ink that
 * writes itself, Saul-Bass bars, a silent-film intertitle, a stamp), holds, leaves.
 */
export const card: VerbFn = (k, a, cue) => {
  const s = st(k, a);
  const T = TYPE[s];
  const dur = Number(a.dur ?? 3);
  const text = String(a.text ?? '');
  const big = Number(a.size ?? (text.length > 18 ? 96 : 124));
  const root = new Container();
  const pos = a.pos;
  const [cx, cy] = Array.isArray(pos) ? (pos as [number, number]) : pos === 'low' ? [960, 800] : pos === 'high' ? [960, 260] : [960, 520];
  root.position.set(cx, cy);
  // the plate behind (style-dependent), the words, the underline / bars
  const plate = new Graphics();
  root.addChild(plate);
  const title = k.text.sprite(text, T.title(big));
  root.addChild(title);
  let subSp: Sprite | null = null;
  if (a.sub) {
    subSp = k.text.sprite(String(a.sub), T.sub(Math.round(big * 0.34)));
    subSp.position.set(0, big * (T.enter === 'bass' ? 0.95 : 0.86));
    if (T.mirrorSub) subSp.scale.x = -1;
    root.addChild(subSp);
  }
  let numSp: Sprite | null = null;
  if (a.num) {
    numSp = k.text.sprite(String(a.num), T.num(Math.round(big * 0.5)));
    numSp.position.set(0, -big * 0.82);
    root.addChild(numSp);
  }
  const deco = new Graphics();
  root.addChild(deco);
  const mask = new Graphics();
  root.addChild(mask);
  const tw = title.width;
  const th = title.height;
  const rm = k.reduceMotion;
  const enterD = Math.min(1.2, dur * 0.35);
  const exitD = Math.min(0.7, dur * 0.2);
  return clip(cue.m, dur, {
    z: 5,
    mount: (kk) => kk.layers.type.addChildAt(root, 0),
    unmount: () => {
      root.parent?.removeChild(root);
    },
    update: (lt) => {
      const pin = clamp01(lt / enterD);
      const pout = clamp01((lt - (dur - exitD)) / exitD);
      root.alpha = 1 - sm(pout);
      deco.clear();
      plate.clear();
      const w = tw + 80;
      if (T.enter === 'paint') {
        // painted on: the words appear under a brush that sweeps left → right; the letters boil on 8 fps
        const p = rm ? sm(pin) : pin;
        title.mask = mask;
        mask.clear().rect(-w / 2, -th, w * sm(p), th * 2 + big).fill(0xffffff);
        const step = Math.floor(lt * 8);
        const j = rm ? 0 : 1.6;
        title.position.set(Math.sin(step * 2.3) * j, Math.cos(step * 1.7) * j);
        title.rotation = rm ? 0 : Math.sin(step * 3.1) * 0.006;
        // the brush underline
        const ul = w * 0.82 * sm(clamp01((lt - enterD * 0.4) / enterD));
        for (let i = 0; i < 3; i++) deco.moveTo(-w * 0.41, th * 0.48 + i * 5).lineTo(-w * 0.41 + ul, th * 0.48 + i * 5 + Math.sin(i + step) * 1.5).stroke({ width: 7 - i * 2, color: i === 1 ? T.accent2 : T.accent, cap: 'round', alpha: 0.9 });
        if (subSp) subSp.alpha = sm(clamp01((lt - enterD * 0.7) / 0.6));
        if (numSp) numSp.alpha = sm(clamp01(lt / 0.5));
      } else if (T.enter === 'ink') {
        // ink writes itself left → right; Leonardo's note (mirrored) writes itself right → left
        title.mask = mask;
        mask.clear().rect(-w / 2, -th, w * sm(pin), th * 2).fill(0xffffff);
        if (subSp) subSp.alpha = sm(clamp01((lt - enterD) / 0.8));
        if (numSp) numSp.alpha = sm(clamp01(lt / 0.6));
        const ul = w * 0.7 * sm(clamp01((lt - enterD * 0.6) / enterD));
        deco.moveTo(-w * 0.35, th * 0.46).quadraticCurveTo(0, th * 0.46 + 10, -w * 0.35 + ul, th * 0.46 - 2).stroke({ width: 2.5, color: T.accent, cap: 'round' });
      } else if (T.enter === 'bass') {
        // Saul Bass: two flat bars cross the frame, the words are cut in where they meet
        const p = sm(pin);
        const bw = Math.max(tw + 160, 900);
        const x1 = rm ? 0 : (1 - p) * -2000;
        const x2 = rm ? 0 : (1 - p) * 2000;
        // a flat band the words sit on, a thin rule under it, a short tick (Saul Bass: shapes first, words after)
        plate.rect(x1 - bw / 2, -th * 0.56, bw, th * 1.02).fill({ color: T.accent, alpha: (rm ? p : 1) * 0.92 });
        plate.rect(x2 - bw * 0.35, th * 0.6, bw * 0.7, 6).fill({ color: T.accent2, alpha: rm ? p : 1 });
        plate.rect(x1 + bw / 2 - 26, -th * 0.56 - 18, 26, 12).fill({ color: T.accent2, alpha: rm ? p : 1 });
        title.mask = null;
        title.alpha = sm(clamp01((lt - enterD * 0.55) / 0.35));
        title.position.set(0, 0);
        if (subSp) subSp.alpha = sm(clamp01((lt - enterD) / 0.5));
        if (numSp) numSp.alpha = sm(clamp01((lt - enterD * 0.3) / 0.4));
      } else if (T.enter === 'silent') {
        plate.rect(-1100, -600, 2200, 1200).fill({ color: 0x0c0b09, alpha: 0.96 });
        const fw = Math.max(tw + 160, 900);
        plate.rect(-fw / 2, -th * 1.2, fw, th * 2.6).stroke({ width: 3, color: T.accent });
        plate.rect(-fw / 2 + 14, -th * 1.2 + 14, fw - 28, th * 2.6 - 28).stroke({ width: 1.5, color: T.accent2 });
        title.mask = null;
        title.alpha = sm(clamp01(lt / 0.5));
        if (subSp) subSp.alpha = sm(clamp01((lt - 0.4) / 0.5));
      } else if (T.enter === 'stamp') {
        const p = clamp01(lt / 0.25);
        title.mask = null;
        const sc = rm ? 1 : 1 + (1 - sm(p)) * 0.6;
        title.scale.set(sc);
        title.alpha = sm(p);
        if (subSp) subSp.alpha = sm(clamp01((lt - 0.3) / 0.4));
      } else {
        title.mask = null;
        title.alpha = sm(pin);
        title.position.set(0, rm ? 0 : (1 - sm(pin)) * 24);
        if (subSp) subSp.alpha = sm(clamp01((lt - enterD * 0.5) / 0.6));
        if (numSp) numSp.alpha = sm(pin);
      }
    },
  });
};

// ------------------------------------------------------------------ subtitles
/** where subtitles go this frame: inside the bottom bar if it is tall enough, else low on a plate (stage sets it) */
export const subZone = { y: 990, plate: true };

/** 'sub' { text, who?, style, dur }: one subtitle line, crisp (layers.ui: no post), over the calm zone */
export const sub: VerbFn = (k, a, cue) => {
  const s = st(k, a);
  const T = TYPE[s];
  const dur = Number(a.dur ?? 2.5);
  const root = new Container();
  const plate = new Graphics();
  const who = a.who ? `${String(a.who).toUpperCase()}  ` : '';
  const line = k.text.sprite(`${who}${String(a.text ?? '')}`, T.line(40));
  root.addChild(plate, line);
  const pw = line.width + 70;
  const ph = line.height + 26;
  plate.roundRect(-pw / 2, -ph / 2, pw, ph, 18).fill({ color: 0x07050d, alpha: 0.5 });
  return clip(cue.m, dur, {
    z: 50,
    mount: (kk) => kk.layers.ui.addChild(root),
    unmount: () => {
      root.parent?.removeChild(root);
    },
    update: (lt, kk) => {
      const fin = clamp01(lt / 0.25);
      const fout = clamp01((lt - (dur - 0.3)) / 0.3);
      root.alpha = sm(fin) * (1 - sm(fout));
      const anch = kk.stage.anchor?.('subtitle', kk);
      root.position.set(anch ? anch[0] : 960, anch ? anch[1] : subZone.y);
      plate.visible = subZone.plate;
    },
  });
};

export const PRESENT_VERBS: Record<string, VerbFn> = { card, sub };
