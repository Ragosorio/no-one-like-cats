/**
 * Story dialog system (owned by the story module).
 *
 *   await say([['LUZTERNA', '…'], ['PATITO', '¡Cuac!']], { cinematic: true })
 *   tip('Toca a Canelo.')                      // non-blocking corner bubble
 *   await newspaper('¡EXTRA! ¡EXTRA! UN GATO PARTE UN BARCO EN TRES', { photo })
 *
 * Yellow comic boxes with the speaker's portrait (Luzterna = translucent ghost floating on twos),
 * typewriter text (click = finish line, click again = next), CAPTION boxes, SISTEMA cards and the
 * PERIÓDICO front page. Text passes through the tone filter (Ajustes › Tono: Familiar).
 */
import { CanvasTextMetrics, Container, FillGradient, Graphics, Sprite, Text, TextStyle, Texture, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { W, H, game } from '../core/App';
import { scenes } from '../core/scenes';
import { sfx } from '../core/audio';
import { audioApi } from '../audio/api';
import { settings } from '../core/settings';
import { C, F } from './theme';
import { txt, poster } from './widgets';
import { halftoneTexture, paperTexture } from '../art/textures';
import { InkFilter } from '../fx/filters';
import { clean, isDirection, speaker, Speaker } from './story/text';
import { LuzternaPortrait, makePortrait, Portrait, preloadStoryArt } from './story/portrait';
import { dueloMuted, ghostLines, luzternaPortraitOk, tipSpeaker } from './story/ghost';
import { destroyDeep, settle } from './story/tweens';
import { followView, screenRect } from './screen';
import { hushed, whenCalm } from './hush';
import { markToastAvoid } from './toastAvoid';

export type Line = [speaker: string, text: string];

export interface SayOpts {
  /** backdrop dim alpha (default 0.3) */
  dim?: number;
  /** letterbox bars top/bottom */
  cinematic?: boolean;
  /** show SALTAR (default true) */
  skippable?: boolean;
  /** parent layer (default: story layer on top of the overlay) */
  layer?: Container;
  /** hook per line (stage directions included); await it to run an effect before the line shows */
  onLine?: (i: number, sp: string, text: string) => void | Promise<void>;
  /** photo for PERIÓDICO lines */
  photo?: Texture;
  /** characters per second (default 52) */
  cps?: number;
  /** box at the bottom (default) or hanging from the top (prologue) */
  position?: 'top' | 'bottom';
}

// ------------------------------------------------------------------ layer
let _layer: Container | null = null;
/** Container for all story UI, kept above modals. */
export function storyLayer(): Container {
  if (!_layer || _layer.destroyed) {
    _layer = new Container();
    _layer.label = 'storyLayer';
  }
  if (_layer.parent !== scenes.overlayLayer) scenes.overlayLayer.addChild(_layer);
  return _layer;
}
function toTop() {
  const l = storyLayer();
  const p = l.parent;
  if (p && p.children[p.children.length - 1] !== l) p.addChild(l);
  return l;
}

let _blocking = 0;
/** true while a blocking dialog / newspaper is on screen */
export function dialogActive() {
  return _blocking > 0;
}
const cancelers = new Set<() => void>();
/** Resolve every open say()/newspaper() right now (scene skip, reset…). */
export function cancelDialogs() {
  for (const c of [...cancelers]) c();
  cancelers.clear();
}

// ------------------------------------------------------------------ helpers
const wait = (s: number) => new Promise<void>((r) => gsap.delayedCall(s, r));

/** headline wrap: if it needs two lines, split where both lines are most even */
function balancedWrap(text: string, style: TextStyle, width: number): string {
  const one = CanvasTextMetrics.measureText(text, style);
  if (one.width <= width) return text;
  const words = text.split(' ');
  let best = '';
  let bestW = Infinity;
  for (let k = 1; k < words.length; k++) {
    const a = words.slice(0, k).join(' ');
    const b = words.slice(k).join(' ');
    const wa = CanvasTextMetrics.measureText(a, style).width;
    const wb = CanvasTextMetrics.measureText(b, style).width;
    const m = Math.max(wa, wb);
    if (m <= width && m < bestW) {
      bestW = m;
      best = a + '\n' + b;
    }
  }
  return best || wrap(text, style, width);
}

/** pre-wrap so the typewriter never reflows words */
function wrap(text: string, style: TextStyle, width: number): string {
  const s = style.clone();
  s.wordWrap = true;
  s.wordWrapWidth = width;
  return CanvasTextMetrics.measureText(text, s).lines.join('\n');
}

function blip(sp: Speaker, i: number) {
  if (i % 3 !== 0) return;
  sfx('hover', sp.pitch * (0.85 + Math.random() * 0.3));
}

/** Typewriter over a Text. Returns controls. */
class Typer {
  private i = 0;
  private acc = 0;
  done = false;
  private full: string;
  constructor(
    private t: Text,
    full: string,
    private cps: number,
    private sp: Speaker,
    private onDone: () => void,
  ) {
    this.full = full;
    t.text = '';
    gsap.ticker.add(this.tick);
  }
  private tick = (_time: number, dtMs: number) => {
    if (this.done) return;
    this.acc += (dtMs / 1000) * this.cps;
    let n = Math.floor(this.acc);
    if (n <= 0) return;
    this.acc -= n;
    while (n-- > 0 && this.i < this.full.length) {
      const ch = this.full[this.i++];
      if (ch === ',' || ch === '.' || ch === '…' || ch === '?' || ch === '!') this.acc -= this.cps * (ch === ',' ? 0.06 : 0.14);
      blip(this.sp, this.i);
    }
    this.t.text = this.full.slice(0, this.i);
    if (this.i >= this.full.length) this.finish();
  };
  finish() {
    if (this.done) return;
    this.done = true;
    this.t.text = this.full;
    gsap.ticker.remove(this.tick);
    this.onDone();
  }
  kill() {
    this.done = true;
    gsap.ticker.remove(this.tick);
  }
}

// ------------------------------------------------------------------ speech box
const BOX_BOTTOM = { x: 430, y: 790, w: 1390, h: 236 };
const BOX_TOP = { x: 430, y: 70, w: 1390, h: 236 };
const TEXT_STYLE = new TextStyle({ fontFamily: F.ui, fontWeight: '700', fontSize: 33, fill: C.ink, lineHeight: 45 });
const SYS_STYLE = new TextStyle({ fontFamily: F.ui, fontWeight: '700', fontSize: 34, fill: C.paper, lineHeight: 46, letterSpacing: 1 });
const CAP_STYLE = new TextStyle({ fontFamily: F.poster, fontSize: 46, fill: C.ink, lineHeight: 54, letterSpacing: 0 });
/** BITÁCORA (Parte III): Luzterna's notebook — paper box, handwriting in blue ink, no face (docs/part-iii/08 §6) */
const BIT_STYLE = new TextStyle({ fontFamily: F.brush, fontSize: 32, fill: C.inkBlue, lineHeight: 46, letterSpacing: 0.5 });

// ------------------------------------------------------------------ OYENTE (Parte III · docs/part-iii/04 §0)
/** the listener's balloon: no tag, no portrait, its tail leaves through the right edge of the screen */
export const OYENTE_BALLOON = { w: 640, h: 150 };
/** «¿Y luego?» in a different typeface each time it's said (part of the joke, 04 §0) */
export const OYENTE_FONTS: TextStyle[] = [
  new TextStyle({ fontFamily: F.comic, fontSize: 54, fill: C.ink, lineHeight: 60, letterSpacing: 2 }),
  new TextStyle({ fontFamily: F.serif, fontStyle: 'italic', fontWeight: '700', fontSize: 50, fill: C.ink, lineHeight: 58 }),
  new TextStyle({ fontFamily: F.brush, fontSize: 48, fill: C.ink, lineHeight: 58 }),
  new TextStyle({ fontFamily: F.heavy, fontSize: 42, fill: C.ink, lineHeight: 54 }),
  new TextStyle({ fontFamily: F.news, fontSize: 56, fill: C.ink, lineHeight: 62 }),
  new TextStyle({ fontFamily: F.bebas, fontSize: 62, fill: C.ink, lineHeight: 64, letterSpacing: 4 }),
  new TextStyle({ fontFamily: F.glitch, fontSize: 48, fill: C.ink, lineHeight: 58 }),
  new TextStyle({ fontFamily: F.ui, fontWeight: '700', fontSize: 46, fill: C.ink, lineHeight: 56, letterSpacing: -1 }),
];
let oyenteN = 0;
/** the next OYENTE typeface (cycles; never the same twice in a row). The Momento's own balloons may use it too. */
export function nextOyenteStyle(): TextStyle {
  return OYENTE_FONTS[oyenteN++ % OYENTE_FONTS.length];
}

class SpeechBox extends Container {
  bg = new Graphics();
  dots: TilingSprite;
  tag = new Container();
  tagBg = new Graphics();
  tagText: Text;
  body: Text;
  arrow: Text;
  tail = new Graphics();
  constructor(public B: typeof BOX_BOTTOM = BOX_BOTTOM) {
    super();
    const BOX = B;
    this.dots = new TilingSprite({ texture: halftoneTexture(C.pinkHot, 12, 3), width: 340, height: 120 });
    this.dots.alpha = 0.22;
    this.tagText = poster('', 36, C.yellow, { letterSpacing: 1 });
    this.tagText.position.set(18, 2);
    this.tag.addChild(this.tagBg, this.tagText);
    this.body = new Text({ text: '', style: TEXT_STYLE, resolution: 2 });
    this.body.position.set(BOX.x + 46, BOX.y + 34);
    this.arrow = poster('▼', 30, C.ink);
    this.arrow.anchor.set(0.5);
    this.arrow.position.set(BOX.x + BOX.w - 40, BOX.y + BOX.h - 30);
    this.arrow.visible = false;
    this.addChild(this.tail, this.bg, this.dots, this.body, this.tag, this.arrow);
    gsap.to(this.arrow, { y: '+=8', duration: 0.35, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  }
  /** the text box this speaker writes in: x, y and the wrap width (OYENTE: its balloon on the right) */
  textRect(sp: Speaker) {
    const { x, y, w, h } = this.B;
    if (sp.kind === 'oyente') {
      const { w: bw, h: bh } = OYENTE_BALLOON;
      return { x: x + w - bw + 44, y: y + (h - bh) / 2 + 30, w: bw - 88 };
    }
    return { x: x + 46, y: y + 34, w: w - 110 };
  }
  /** OYENTE (Parte III): a round white balloon on the right, no tag, no portrait; the tail exits the screen right */
  private styleOyente(sp: Speaker, bodyStyle: TextStyle) {
    const { x, y, w, h } = this.B;
    const { w: bw, h: bh } = OYENTE_BALLOON;
    const bx = x + w - bw;
    const by = y + (h - bh) / 2;
    this.bg.clear();
    this.bg.roundRect(bx + 10, by + 10, bw, bh, 70).fill(C.ink);
    this.bg.roundRect(bx, by, bw, bh, 70).fill(sp.box).stroke({ width: 5, color: C.ink, alignment: 1 });
    this.dots.visible = false;
    this.tail.clear();
    // the tail points off-frame (whoever talks is to Canelo's right, out of shot): far past the 1920 box
    this.tail.poly([bx + bw - 60, by + 34, W + 900, by + bh / 2 + 40, bx + bw - 60, by + bh - 40]).fill(sp.box).stroke({ width: 5, color: C.ink, join: 'round' });
    this.tail.rect(bx + bw - 90, by + 38, 40, bh - 82).fill(sp.box);
    this.addChildAt(this.tail, this.getChildIndex(this.bg) + 1);
    this.body.style = bodyStyle;
    const r = this.textRect(sp);
    this.body.position.set(r.x, by + (bh - (bodyStyle.lineHeight || bodyStyle.fontSize as number)) / 2);
    this.arrow.style.fill = C.ink;
    this.arrow.position.set(bx + bw - 44, by + bh - 26);
    this.tag.visible = false;
  }
  style(sp: Speaker, withPortrait: boolean, oyenteStyle?: TextStyle) {
    if (sp.kind === 'oyente') return this.styleOyente(sp, oyenteStyle ?? OYENTE_FONTS[0]);
    // (back from an OYENTE balloon: the tail goes behind the box again, the text and arrow to their place)
    if (this.getChildIndex(this.tail) !== 0) this.addChildAt(this.tail, 0);
    this.dots.visible = true;
    const bit = sp.id === 'bitacora';
    const sys = sp.kind === 'system' && !bit;
    const fill = sp.box;
    const { x, y, w, h } = this.B;
    const r = this.textRect(sp);
    this.body.position.set(r.x, r.y);
    this.arrow.position.set(x + w - 40, y + h - 30);
    this.bg.clear();
    this.bg.rect(x + 12, y + 12, w, h).fill(sys ? C.pinkHot : C.ink);
    this.bg.rect(x, y, w, h).fill(fill).stroke({ width: 5, color: C.ink, alignment: 1 });
    if (bit) {
      // a notebook page: blue rules and a red margin (the farera's handwriting goes on top)
      for (let ly = y + 34 + 46; ly < y + h - 10; ly += 46) this.bg.moveTo(x + 24, ly).lineTo(x + w - 24, ly).stroke({ width: 2, color: 0x7fa6c9, alpha: 0.55 });
      this.bg.moveTo(x + 34, y + 8).lineTo(x + 34, y + h - 8).stroke({ width: 2, color: C.red, alpha: 0.45 });
    }
    // inner rule (printed comic panel)
    else this.bg.rect(x + 12, y + 12, w - 24, h - 24).stroke({ width: 2, color: sys ? C.cyan : C.ink, alpha: sys ? 0.5 : 0.25 });
    this.dots.position.set(x + w - 352, y + h - 132);
    this.dots.texture = halftoneTexture(sys ? C.cyan : C.pinkHot, 12, 3);
    this.dots.alpha = bit ? 0 : sys ? 0.18 : 0.22;
    this.tail.clear();
    if (withPortrait) {
      this.tail.poly([x + 8, y + 70, x - 70, y + 150, x + 8, y + 140]).fill(fill).stroke({ width: 5, color: C.ink, join: 'round' });
      // hide the tail's inner stroke where it meets the box
      this.tail.rect(x - 1, y + 74, 10, 62).fill(fill);
    }
    this.body.style = bit ? BIT_STYLE : sys ? SYS_STYLE : TEXT_STYLE;
    this.arrow.style.fill = sys ? C.cyan : C.ink;
    // name tag
    this.tag.visible = !!sp.name;
    this.tagText.text = sp.name;
    this.tagText.style.fill = sp.bandText;
    const tw = this.tagText.width + 36;
    this.tagBg.clear().rect(6, 6, tw, 50).fill(C.ink).rect(0, 0, tw, 50).fill(sp.band).stroke({ width: 4, color: C.ink, alignment: 1 });
    this.tag.position.set(x + 34, y - 30);
    this.tag.rotation = -0.02;
  }
}

class CaptionBox extends Container {
  bg = new Graphics();
  body: Text;
  constructor() {
    super();
    this.body = new Text({ text: '', style: CAP_STYLE, resolution: 2 });
    this.addChild(this.bg, this.body);
    this.position.set(70, 70);
  }
  layout(full: string) {
    const m = CanvasTextMetrics.measureText(wrap(full, CAP_STYLE, 1100), CAP_STYLE);
    const w = Math.min(1100, m.width) + 60;
    const h = m.height + 40;
    this.bg.clear().rect(10, 10, w, h).fill(C.ink).rect(0, 0, w, h).fill(C.yellow).stroke({ width: 5, color: C.ink, alignment: 1 });
    this.body.position.set(30, 18);
  }
}

/** makePortrait, but a broken painting or rig (data still being made) gives no face instead of an exception */
function safePortrait(sp: Speaker, size: number): Portrait | null {
  try {
    return makePortrait(sp, size);
  } catch (e) {
    console.warn('[dialog] retrato no disponible:', sp.slug, e);
    return null;
  }
}

// ------------------------------------------------------------------ say()
/**
 * Blocking dialog. Resolves when the last line is dismissed (or SALTAR / Esc).
 * Stage directions "(…)" from SISTEMA are passed to onLine and not displayed.
 */
export async function say(lines: Line[], opts: SayOpts = {}): Promise<void> {
  if (!lines.length) return;
  // Parte III: after her death a line of hers is a written memory (the Bitácora), never her voice or face (story/ghost.ts)
  lines = ghostLines(lines);
  const needSlugs = [...new Set(lines.map(([s]) => speaker(s).slug).filter((s): s is string => !!s))];
  await preloadStoryArt(needSlugs);
  _blocking++;
  // music steps back −6 dB while someone talks (src/audio: keyed hold, released below)
  audioApi.duck(true, 6, 'dialog');
  // a corner tip already on screen would sit right under the speech box: it waits until we're done
  const parkedTip = tipShowing;
  if (parkedTip) parkedTip.visible = false;
  const layer = opts.layer ?? toTop();
  const root = new Container();
  root.label = 'dialog';
  layer.addChild(root);
  const dim = screenRect({ color: C.ink, alpha: opts.dim ?? 0.3 });
  dim.eventMode = 'static';
  root.addChild(dim);
  dim.alpha = 0;
  gsap.to(dim, { alpha: 1, duration: 0.25 });
  const top = opts.position === 'top';
  // a soft ink gradient behind the speech box keeps the text legible over any scene
  const shade = new Graphics();
  shade.alpha = 0;
  root.addChild(shade);
  gsap.to(shade, { alpha: 1, duration: 0.35 });
  // letterbox bars live on the REAL screen edges (game.view), never on the 1920×1080 box
  const BAR = 78;
  let bars: Graphics[] = [];
  let barsIn = 0;
  if (opts.cinematic) {
    bars = [new Graphics(), new Graphics()];
    root.addChild(...bars);
    gsap.to({ k: 0 }, { k: 1, duration: 0.4, ease: 'power3.out', onUpdate() { barsIn = this.targets()[0].k; place(); } });
  }
  // everything designed against the box bottom (or top) rides on the real screen edge
  const anchor = new Container();
  const capAnchor = new Container();
  const portraitLayer = new Container();
  const BX = top ? BOX_TOP : BOX_BOTTOM;
  const box = new SpeechBox(BX);
  const cap = new CaptionBox();
  // toasts never sit on the speech box or the caption card (ui/toastAvoid.ts)
  markToastAvoid(box);
  markToastAvoid(cap);
  box.visible = false;
  cap.visible = false;
  anchor.addChild(portraitLayer, box);
  capAnchor.addChild(cap);
  root.addChild(anchor, capAnchor);
  function place() {
    if (root.destroyed) return;
    const v = game.view;
    anchor.y = top ? v.y : v.y + v.h - H;
    capAnchor.y = v.y + (bars.length ? BAR * barsIn : 0);
    for (let i = 0; i < bars.length; i++) {
      bars[i].clear().rect(v.x, 0, v.w, BAR + 4).fill(C.ink);
      bars[i].y = i === 0 ? v.y - BAR - 4 + (BAR + 4) * barsIn : v.y + v.h - (BAR + 4) * barsIn;
    }
    const sh = top ? 420 : 520;
    shade.clear().rect(v.x, top ? v.y : v.y + v.h - sh, v.w, sh).fill(
      new FillGradient({
        type: 'linear',
        start: { x: 0, y: top ? 1 : 0 },
        end: { x: 0, y: top ? 0 : 1 },
        colorStops: [
          { offset: 0, color: 'rgba(23,19,23,0)' },
          { offset: 1, color: 'rgba(23,19,23,0.55)' },
        ],
        textureSpace: 'local',
      }),
    );
  }
  followView(root, place);

  let skipAll = false;
  let advance: (() => void) | null = null;
  const tapNext = () => advance?.();
  root.eventMode = 'static';
  root.hitArea = { contains: () => true };
  root.on('pointertap', tapNext);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      tapNext();
    } else if (e.key === 'Escape' && opts.skippable !== false) {
      skipAll = true;
      tapNext();
    }
  };
  window.addEventListener('keydown', onKey);
  const cancel = () => {
    skipAll = true;
    tapNext();
  };
  cancelers.add(cancel);

  if (opts.skippable !== false) {
    const skip = new Container();
    const sb = new Graphics().rect(5, 5, 170, 54).fill(C.ink).rect(0, 0, 170, 54).fill(C.paper).stroke({ width: 4, color: C.ink, alignment: 1 });
    const st = poster('SALTAR »', 32, C.ink);
    st.anchor.set(0.5);
    st.position.set(85, 27);
    skip.addChild(sb, st);
    skip.position.set(W - 220, top ? BX.y + BX.h + 30 : BX.y - 78);
    skip.eventMode = 'static';
    skip.cursor = 'pointer';
    skip.on('pointertap', (e) => {
      e.stopPropagation();
      sfx('click');
      skipAll = true;
      tapNext();
    });
    anchor.addChild(skip);
  }

  let portrait: Portrait | null = null;
  let portraitId = '';
  let boxShown = false;
  const cps = (opts.cps ?? 52) * (settings.reduceMotion ? 1.6 : 1);

  for (let i = 0; i < lines.length && !skipAll; i++) {
    const [spId, raw] = lines[i];
    if (opts.onLine) await opts.onLine(i, spId, raw);
    if (isDirection(spId, raw)) continue;
    const sp = speaker(spId);
    const text = clean(raw);

    if (sp.kind === 'newspaper') {
      box.visible = false;
      cap.visible = false;
      if (portrait) portrait.visible = false;
      await newspaper(text, { photo: opts.photo, layer: root });
      if (portrait) portrait.visible = true;
      continue;
    }

    if (sp.kind === 'caption') {
      box.visible = false;
      boxShown = false;
      cap.visible = true;
      cap.layout(text);
      gsap.fromTo(cap, { x: 30, alpha: 0 }, { x: 70, alpha: 1, duration: 0.25, ease: 'back.out(2)' });
      sfx('paper');
      await typeAndWait(cap.body, text, CAP_STYLE, 1100, cps * 0.8, sp);
      continue;
    }

    // portrait swap
    const wantPortrait = sp.kind === 'luzterna' || sp.kind === 'cat';
    if (portraitId !== sp.id) {
      if (portrait) {
        const old = portrait;
        gsap.to(old, { x: old.x - 120, alpha: 0, duration: 0.2, onComplete: () => old.destroy() });
        portrait = null;
      }
      portraitId = sp.id;
      if (wantPortrait) {
        // a broken painting / rig must never freeze a dialog: the line goes on without a face
        portrait = safePortrait(sp, top ? 400 : sp.kind === 'luzterna' ? 500 : 440);
        if (portrait) {
          portrait.position.set(250, top ? BX.y + BX.h + 90 : H + (sp.kind === 'luzterna' ? 40 : 20));
          portraitLayer.addChild(portrait);
          gsap.from(portrait, { x: portrait.x - 160, alpha: 0, duration: 0.3, ease: 'back.out(1.6)' });
        }
      }
    }
    portrait?.talk();
    box.visible = true;
    box.style(sp, !!portrait, sp.kind === 'oyente' ? nextOyenteStyle() : undefined);
    if (!boxShown) {
      boxShown = true;
      sfx('pop');
      box.pivot.set(BX.x, BX.y + (top ? 0 : BX.h));
      box.position.set(BX.x, BX.y + (top ? 0 : BX.h));
      gsap.fromTo(box.scale, { x: 0.85, y: 0.6 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(2.5)' });
    } else {
      gsap.fromTo(box.scale, { x: 1.015, y: 0.97 }, { x: 1, y: 1, duration: 0.22, ease: 'back.out(3)' });
    }
    cap.visible = false;
    box.arrow.visible = false;
    await typeAndWait(box.body, text, box.body.style as TextStyle, box.textRect(sp).w, cps, sp, () => (box.arrow.visible = true));
  }

  // out (input is released right away; the fade can't hang even if the layer dies meanwhile)
  cancelers.delete(cancel);
  window.removeEventListener('keydown', onKey);
  _blocking--;
  audioApi.duck(false, 6, 'dialog');
  if (parkedTip && !parkedTip.destroyed) parkedTip.visible = true;
  if (root.destroyed) return;
  root.eventMode = 'none';
  await settle((done) => {
    const tl = gsap.timeline({ onComplete: done });
    tl.to([box, cap, portraitLayer], { alpha: 0, duration: 0.2 }, 0);
    tl.to(dim, { alpha: 0, duration: 0.25 }, 0);
    tl.to(shade, { alpha: 0, duration: 0.25 }, 0);
    if (bars.length) tl.to({ k: barsIn }, { k: 0, duration: 0.25, onUpdate() { barsIn = this.targets()[0].k; place(); } }, 0);
  }, 700);
  destroyDeep(root);

  function typeAndWait(t: Text, text: string, style: TextStyle, width: number, rate: number, sp: Speaker, onTyped?: () => void) {
    return new Promise<void>((res) => {
      const full = wrap(text, style, width);
      let typed = false;
      const typer = new Typer(t, full, rate, sp, () => {
        typed = true;
        onTyped?.();
      });
      advance = () => {
        if (skipAll) {
          typer.kill();
          advance = null;
          res();
          return;
        }
        if (!typed) {
          typer.finish();
          return;
        }
        sfx('click', 1.3);
        advance = null;
        res();
      };
    });
  }
}

// ------------------------------------------------------------------ tip()
interface TipReq {
  text: string;
  speaker: string;
  dur?: number;
  title?: string;
  /** a scene's own corner line: shows even while the screen is hushed */
  force?: boolean;
}
const tipQueue: TipReq[] = [];
let tipShowing: Container | null = null;
/** where the tip bubble sits (bottom-left by default) */
export const TIP_POS = { x: 70, y: H - 200 };

/** Non-blocking corner bubble ("Luzterna dice…"). Queued; click to dismiss. */
export function tip(text: string, o: { speaker?: string; dur?: number; title?: string; force?: boolean } = {}) {
  // a scene is playing (src/ui/hush.ts): gameplay tips wait for it to end; the scene's own corner lines pass (force)
  if (!o.force && whenCalm(() => tip(text, o), `tip:${text}`)) return;
  // Parte III: the mourning keeps quiet; after her death the corner voice is the Bitácora's (story/ghost.ts)
  if (!o.force && dueloMuted()) return;
  const req = { text, speaker: tipSpeaker(o.speaker), dur: o.dur, title: o.title, force: o.force };
  if (tipQueue.some((q) => q.text === text)) return;
  tipQueue.push(req);
  if (!tipShowing) void nextTip();
}
export function clearTips() {
  tipQueue.length = 0;
  destroyDeep(tipShowing);
  tipShowing = null;
}

let tipWaiting = false;
async function nextTip() {
  if (!tipQueue.length || tipShowing || tipWaiting) return;
  // never on top of a blocking dialog: wait for it to close (nor over a scene that holds the screen: ui/hush.ts)
  if (_blocking > 0 || (hushed() && !tipQueue[0]?.force)) {
    tipWaiting = true;
    window.setTimeout(() => {
      tipWaiting = false;
      void nextTip();
    }, 600);
    return;
  }
  const req = tipQueue.shift();
  if (!req) return;
  const sp = speaker(req.speaker);
  tipWaiting = true;
  await preloadStoryArt(sp.slug ? [sp.slug] : []);
  tipWaiting = false;
  const layer = toTop();
  const c = new Container();
  c.label = 'tip';
  tipShowing = c;
  layer.addChild(c);
  const text = clean(req.text);
  const bit = sp.id === 'bitacora';
  const style = new TextStyle({ fontFamily: bit ? F.brush : F.ui, fontWeight: bit ? 'normal' : '700', fontSize: bit ? 26 : 25, fill: bit ? C.inkBlue : C.ink, lineHeight: bit ? 36 : 33 });
  const full = wrap(text, style, 520);
  const m = CanvasTextMetrics.measureText(full, style);
  const titleT = req.title ? txt(clean(req.title), { fontFamily: F.poster, fontSize: 30, fill: C.ink }) : null;
  const th = titleT ? 36 : 0;
  const bw = Math.max(260, m.width + 50, titleT ? titleT.width + 50 : 0);
  const bh = m.height + 64 + th;
  const bx = 196;
  const by = -bh;
  const bubble = new Container();
  markToastAvoid(bubble);
  const g = new Graphics();
  g.rect(bx + 8, by + 8, bw, bh).fill(C.ink);
  g.poly([bx + 2, by + bh - 52, bx - 34, by + bh - 6, bx + 2, by + bh - 22]).fill(sp.box).stroke({ width: 4, color: C.ink, join: 'round' });
  g.rect(bx, by, bw, bh).fill(sp.box).stroke({ width: 4, color: C.ink, alignment: 1 });
  g.rect(bx - 1, by + bh - 50, 8, 26).fill(sp.box);
  // a nameless voice (OYENTE) stays nameless; only an unregistered blank falls back to the guide's name
  const name = txt(req.title ? 'NUEVA MISIÓN' : sp.kind === 'oyente' ? '' : sp.name || (luzternaPortraitOk() ? 'LUZTERNA' : 'BITÁCORA'), { fontFamily: F.poster, fontSize: 20, fill: C.pinkHot, letterSpacing: 1 });
  name.position.set(bx + 20, by + 8);
  const body = new Text({ text: '', style, resolution: 2 });
  body.position.set(bx + 22, by + 34 + th);
  bubble.addChild(g, name, body);
  if (titleT) {
    titleT.position.set(bx + 20, by + 28);
    bubble.addChild(titleT);
    body.y += 4;
  }
  c.addChild(bubble);
  let port: Portrait | null = null;
  if (sp.kind === 'luzterna' && luzternaPortraitOk()) port = new LuzternaPortrait(230, 0.9);
  else port = safePortrait(sp, 210);
  if (port) {
    port.position.set(80, 46);
    c.addChild(port);
  }
  // bottom-left of the REAL screen (on 16:10 the box bottom floats above it)
  c.position.set(TIP_POS.x + Math.max(0, game.view.x + 0), TIP_POS.y + (game.view.y + game.view.h - H));
  // click-through: a tip must never eat the click meant for the world under it (map stages, buildings…).
  // Tapping the bubble/portrait still finishes the line or dismisses it — the click also reaches the game.
  c.eventMode = 'none';
  sfx('pop', 1.2);
  gsap.from(c, { x: c.x - 260, duration: 0.32, ease: 'back.out(1.6)' });
  gsap.from(bubble.scale, { x: 0.6, y: 0.6, duration: 0.3, ease: 'back.out(2.5)' });
  bubble.pivot.set(bx, by + bh);
  bubble.position.set(bx, by + bh);
  const typer = new Typer(body, full, 60, sp, () => undefined);
  const dur = req.dur ?? Math.max(4.2, text.length * 0.065 + 2.2);
  let closing = false;
  const close = () => {
    if (closing) return;
    closing = true;
    typer.kill();
    if (c.destroyed) {
      if (tipShowing === c) tipShowing = null;
      void nextTip();
      return;
    }
    gsap.killTweensOf(c);
    gsap.to(c, {
      x: c.x - 320,
      alpha: 0,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        destroyDeep(c);
        if (tipShowing === c) tipShowing = null;
        void nextTip();
      },
    });
  };
  const offDown = onTapInside([bubble, port], () => {
    if (!typer.done) typer.finish();
    else close();
  });
  c.on('destroyed', offDown);
  gsap.delayedCall(dur, close);
}

/**
 * Window-level tap detector for click-through overlays: calls `fn` when a pointerdown lands inside any
 * of `targets` (global bounds). Returns the remover. The event is NOT consumed.
 */
export function onTapInside(targets: (Container | null | undefined)[], fn: () => void): () => void {
  const handler = (ev: PointerEvent) => {
    const live = targets.filter((t): t is Container => !!t && !t.destroyed);
    if (!live.length) return;
    const rect = game.pixi.canvas.getBoundingClientRect();
    const gx = ev.clientX - rect.left;
    const gy = ev.clientY - rect.top;
    for (const t of live) {
      const b = t.getBounds();
      if (gx >= b.x && gx <= b.x + b.width && gy >= b.y && gy <= b.y + b.height) {
        fn();
        return;
      }
    }
  };
  window.addEventListener('pointerdown', handler, true);
  return () => window.removeEventListener('pointerdown', handler, true);
}

// ------------------------------------------------------------------ newspaper()
export interface NewsOpts {
  photo?: Texture;
  /** kicker above the headline */
  kicker?: string;
  /** small caption under the photo / footer */
  footer?: string;
  layer?: Container;
  /** auto-dismiss after seconds (still clickable) */
  auto?: number;
  /** issue line under the masthead */
  issue?: string;
  /** ink threshold for the halftone photo (lower = lighter; night scenes ≈ 0.18) */
  photoThreshold?: number;
}

/** DIARIO DEL MAR front page that spins in. Resolves on click. */
export async function newspaper(headline: string, o: NewsOpts = {}): Promise<void> {
  _blocking++;
  const layer = o.layer ?? toTop();
  const root = new Container();
  layer.addChild(root);
  const dim = screenRect({ color: C.ink, alpha: 0.75 });
  dim.eventMode = 'static';
  root.addChild(dim);
  const PW = 1260;
  const PH = 900;
  const page = new Container();
  markToastAvoid(page);
  page.pivot.set(PW / 2, PH / 2);
  page.position.set(W / 2, H / 2 + 10);
  root.addChild(page);
  const shadow = new Graphics().rect(16, 16, PW, PH).fill({ color: 0x000000, alpha: 0.5 });
  const paper = new TilingSprite({ texture: paperTexture(0xe9dfc8, 512, 1.4), width: PW, height: PH });
  const frame = new Graphics().rect(0, 0, PW, PH).stroke({ width: 3, color: C.ink, alpha: 0.6 });
  page.addChild(shadow, paper, frame);
  // masthead
  const mast = txt('El Diario del Mar', { fontFamily: F.news, fontSize: 104, fill: C.ink });
  mast.anchor.set(0.5, 0);
  mast.position.set(PW / 2, 26);
  const rule = new Graphics()
    .rect(40, 150, PW - 80, 5)
    .fill(C.ink)
    .rect(40, 160, PW - 80, 2)
    .fill(C.ink)
    .rect(40, 196, PW - 80, 2)
    .fill(C.ink);
  const issue = txt(o.issue ?? 'EDICIÓN EXTRAORDINARIA  ·  AÑO ???  ·  PRECIO: UNA SARDINA  ·  "SI NO LO VIO UN GATO, NO PASÓ"', {
    fontFamily: F.ui,
    fontWeight: '700',
    fontSize: 17,
    fill: C.ink,
    letterSpacing: 2,
  });
  issue.anchor.set(0.5, 0);
  issue.position.set(PW / 2, 168);
  page.addChild(mast, rule, issue);
  let y = 214;
  // headline (split off a leading "¡EXTRA! ¡EXTRA!" into a red kicker)
  let head = clean(headline);
  let kick = o.kicker ? clean(o.kicker) : '';
  const km = head.match(/^((?:¡EXTRA!\s*)+)/i);
  if (!kick && km) {
    kick = km[1].trim();
    head = head.slice(km[1].length).trim();
  }
  if (kick) {
    const k = poster(kick, 64, C.red, { letterSpacing: 2 });
    k.anchor.set(0.5, 0);
    k.position.set(PW / 2, y);
    page.addChild(k);
    y += 74;
  }
  const hs = new TextStyle({ fontFamily: F.poster, fontSize: 112, fill: C.ink, lineHeight: 112, align: 'center', letterSpacing: -2 });
  const hw = balancedWrap(head, hs, PW - 120);
  const ht = new Text({ text: hw, style: hs, resolution: 2 });
  if (ht.height > 360) ht.scale.set(360 / ht.height);
  ht.anchor.set(0.5, 0);
  ht.position.set(PW / 2, y);
  page.addChild(ht);
  y += ht.height + 22;
  page.addChild(new Graphics().rect(40, y, PW - 80, 3).fill(C.ink));
  y += 20;
  // photo + columns
  const bodyH = PH - y - 40;
  const photoW = 560;
  const ph = new Container();
  const phBg = new Graphics().rect(0, 0, photoW, bodyH).fill(0xd8ceb8).stroke({ width: 3, color: C.ink });
  ph.addChild(phBg);
  if (o.photo) {
    const s = new Sprite(o.photo);
    const sc = Math.max(photoW / s.texture.width, bodyH / s.texture.height);
    s.scale.set(sc);
    s.anchor.set(0.5);
    s.position.set(photoW / 2, bodyH / 2);
    s.filters = [new InkFilter({ threshold: o.photoThreshold ?? 0.2, hatch: 1, paper: 0xe9dfc8 })];
    const mask = new Graphics().rect(0, 0, photoW, bodyH).fill(0xffffff);
    s.mask = mask;
    ph.addChild(mask, s);
  } else {
    const dots = new TilingSprite({ texture: halftoneTexture(C.ink, 9, 2.4), width: photoW, height: bodyH });
    dots.alpha = 0.35;
    ph.addChild(dots);
  }
  ph.position.set(40, y);
  page.addChild(ph);
  const capt = txt(clean(o.footer ?? 'FOTO: un testigo que "pasaba por ahí". El gato no quiso declarar.'), {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 17,
    fill: C.ink,
    wordWrap: true,
    wordWrapWidth: photoW,
  });
  capt.position.set(40, y + bodyH + 6);
  page.addChild(capt);
  // fake columns of text
  const colX = 40 + photoW + 30;
  const colW = (PW - colX - 40 - 24) / 2;
  const cols = new Graphics();
  for (let ci = 0; ci < 2; ci++) {
    for (let ly = 0; ly < bodyH; ly += 15) {
      const wln = ly % 120 === 105 ? colW * (0.3 + Math.random() * 0.3) : colW * (0.82 + Math.random() * 0.18);
      cols.rect(colX + ci * (colW + 24), y + ly, wln, 6).fill({ color: C.ink, alpha: 0.32 });
    }
  }
  page.addChild(cols);
  const lede = txt('ÚLTIMA HORA', { fontFamily: F.poster, fontSize: 30, fill: C.ink });
  lede.position.set(colX, y - 2);
  const ledeBg = new Graphics().rect(colX - 6, y - 6, lede.width + 12, 40).fill(0xe9dfc8);
  page.addChild(ledeBg, lede);
  // red stamp
  const stamp = new Container();
  const sg = new Graphics().circle(0, 0, 92).stroke({ width: 8, color: C.red }).circle(0, 0, 76).stroke({ width: 3, color: C.red });
  const stx = poster('¡EXTRA!', 46, C.red);
  stx.anchor.set(0.5);
  stamp.addChild(sg, stx);
  stamp.position.set(PW - 130, PH - 140);
  stamp.rotation = -0.3;
  stamp.alpha = 0;
  page.addChild(stamp);

  // spin in (classic newspaper) — cancellable from the start, never hangs if the layer dies
  let cancelled = false;
  let finishWait: (() => void) | null = null;
  const cancelNews = () => {
    cancelled = true;
    finishWait?.();
  };
  cancelers.add(cancelNews);
  sfx('whoosh');
  const reduce = settings.reduceMotion;
  page.scale.set(0.05);
  page.rotation = reduce ? 0 : -Math.PI * 4;
  await settle((done) => {
    gsap
      .timeline({ onComplete: done })
      .to(page, { rotation: -0.035, duration: reduce ? 0.2 : 0.8, ease: 'power2.out' }, 0)
      .to(page.scale, { x: 1, y: 1, duration: reduce ? 0.2 : 0.8, ease: 'back.out(1.2)' }, 0)
      .call(() => {
        sfx('boom');
        sfx('paper');
      })
      .to(stamp, { alpha: 1, duration: 0.01 }, '+=0.15')
      .fromTo(stamp.scale, { x: 2.4, y: 2.4 }, { x: 1, y: 1, duration: 0.18, ease: 'power4.in' }, '<')
      .call(() => sfx('hit', 0.7));
  }, 2500);
  let hint: Text | null = null;
  if (!cancelled && !root.destroyed) {
    hint = poster('CLIC PARA CONTINUAR', 26, C.paper);
    hint.anchor.set(0.5);
    hint.position.set(W / 2, H - 22);
    root.addChild(hint);
    gsap.to(hint, { alpha: 0.3, duration: 0.5, yoyo: true, repeat: -1 });
    await new Promise<void>((res) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        window.removeEventListener('keydown', onKey);
        res();
      };
      finishWait = finish;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') finish();
      };
      window.addEventListener('keydown', onKey);
      dim.on('pointertap', finish);
      page.eventMode = 'static';
      page.on('pointertap', finish);
      if (o.auto) gsap.delayedCall(o.auto, finish);
    });
  }
  cancelers.delete(cancelNews);
  _blocking--;
  if (root.destroyed) return;
  sfx('paper');
  root.eventMode = 'none';
  await settle((done) => {
    gsap
      .timeline({ onComplete: done })
      .to(page, { y: page.y + 80, rotation: 0.08, alpha: 0, duration: 0.25, ease: 'power2.in' }, 0)
      .to(hint ? [dim, hint] : [dim], { alpha: 0, duration: 0.25 }, 0);
  }, 700);
  destroyDeep(root);
}

export { wait as storyWait };
