/**
 * Storyboard (e) 2200–4200 ms: DIARIO DEL MAR front page — "¡EXTRA! ¡EXTRA! CANELO PARTE BARCO EN TRES",
 * halftone photo of the impact + the MVP, "BOTÍN DEL DÍA" box whose rows tick up in an accelerating cascade.
 */
import { CanvasTextMetrics, ColorMatrixFilter, Container, Graphics, Sprite, Text, TextStyle, Texture, TilingSprite } from 'pixi.js';
import { RGBSplitFilter } from 'pixi-filters';
import gsap from 'gsap';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { icon, IconKind } from '../../ui/icons';
import { paperTexture, halftoneTexture } from '../../art/textures';
import { catTexture } from '../../art/catArt';
import { applyCatTint, slugOf } from '../../art/tint';
import { ComicFilter } from '../filters';
import { sfx } from '../../core/audio';
import { fmt } from '../../core/format';
import { settings } from '../../core/settings';
import { sparkles } from '../juice';
import { P, columnText, doubleRule, stamp, tickUp } from '../../panels/campaign/common';

export interface NewsLootRow {
  kind: IconKind;
  label: string;
  value: number;
  suffix?: string;
  tint?: number;
}

export interface VictoryNewsOpts {
  headline: string;
  kicker?: string;
  sub: string;
  caption: string;
  edition: string;
  place: string;
  photo: Texture | null;
  mvpSpecies: string | null;
  rows: NewsLootRow[];
  golden: boolean;
  perfect: boolean;
  momentum: [number, number];
  /** boss front pages: "EN LA PRÓXIMA EDICIÓN" cliffhanger box */
  teaser?: { head: string; text: string };
}

export class VictoryNews extends Container {
  readonly pageW = 1160;
  readonly pageH = 990;
  private page = new Container();
  private kicker = new Container();
  private headline!: Text;
  private sub!: Text;
  private photoBox = new Container();
  private mvp: Sprite | null = null;
  private lootBox = new Container();
  private rows: { c: Container; value: Text; row: NewsLootRow; tw?: gsap.core.Tween }[] = [];
  private bolsa!: Text;
  private goldStamp: Container | null = null;
  private teaserBox: Container | null = null;
  /** global-ish anchor where Ronroneo stamps start */
  stampOrigin = { x: 0, y: 0 };

  constructor(private o: VictoryNewsOpts) {
    super();
    this.build();
  }

  private build() {
    const pw = this.pageW;
    const ph = this.pageH;
    const o = this.o;
    const pg = this.page;
    // paper + shadow + optional gold foil border
    const shadow = new Graphics().rect(16, 18, pw, ph).fill({ color: 0x000000, alpha: 0.45 });
    const paper = new TilingSprite({ texture: paperTexture(P.aged, 512, 1.6), width: pw, height: ph });
    const edge = new Graphics().rect(0, 0, pw, ph).stroke({ width: 2, color: P.agedEdge });
    pg.addChild(shadow, paper, edge);
    if (o.golden) {
      const foil = new Graphics().rect(10, 10, pw - 20, ph - 20).stroke({ width: 8, color: C.gold }).rect(22, 22, pw - 44, ph - 44).stroke({ width: 2, color: C.gold });
      pg.addChild(foil);
    }
    const m = 44;
    const iw = pw - m * 2;
    // top line
    const tl = txt(o.edition, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink, letterSpacing: 2 });
    tl.position.set(m, 24);
    const tc = txt('EDICIÓN EXTRAORDINARIA', { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.red, letterSpacing: 3 });
    tc.anchor.set(0.5, 0);
    tc.position.set(pw / 2, 24);
    const tr = txt('2 DOBLONES', { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink, letterSpacing: 2 });
    tr.anchor.set(1, 0);
    tr.position.set(pw - m, 24);
    const r0 = doubleRule(iw, C.ink, 2);
    r0.position.set(m, 48);
    const mast = txt('Diario del Mar', { fontFamily: F.news, fontSize: 124, fill: C.ink });
    mast.anchor.set(0.5, 0);
    mast.position.set(pw / 2, 50);
    const r1 = doubleRule(iw, C.ink, 4);
    r1.position.set(m, 190);
    const dl = txt(o.place, { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: C.ink, letterSpacing: 2 });
    dl.anchor.set(0.5, 0);
    dl.position.set(pw / 2, 202);
    const r2 = new Graphics().rect(m, 224, iw, 2).fill(C.ink);
    pg.addChild(tl, tc, tr, r0, mast, r1, dl, r2);

    // kicker banner
    const kt = txt(o.kicker ?? '¡EXTRA! ¡EXTRA!', { fontFamily: F.poster, fontSize: 46, fill: P.aged, letterSpacing: 2 });
    kt.position.set(18, 2);
    const kb = new Graphics().rect(0, 0, kt.width + 36, kt.height + 4).fill(C.red);
    this.kicker.addChild(kb, kt);
    this.kicker.position.set(m, 240);
    this.kicker.pivot.set(0, 0);
    pg.addChild(this.kicker);
    if (o.perfect) {
      const pf = stamp('SIN UN RASGUÑO', C.red, 26, 0.06);
      pf.position.set(pw - m - 150, 270);
      pg.addChild(pf);
    }

    // headline: one line if it fits big, otherwise a balanced 2-3 line split
    const fit = fitHeadline(o.headline, iw, 250);
    const h = txt(fit.text, { fontFamily: F.poster, fontSize: fit.size, fill: C.ink, lineHeight: fit.size * 0.98, letterSpacing: -1 });
    this.headline = h;
    h.position.set(m, 304);
    pg.addChild(h);
    this.sub = txt(o.sub, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 27, fill: C.ink, wordWrap: true, wordWrapWidth: iw, lineHeight: 34 });
    this.sub.position.set(m, h.y + h.height + 8);
    pg.addChild(this.sub);
    const top = Math.max(600, this.sub.y + this.sub.height + 18);
    this.stampOrigin = { x: m + iw / 2, y: 330 };

    // photo (boss pages reserve a full-width cliffhanger strip at the bottom)
    const teaserH = o.teaser ? 104 : 0;
    const phW = 620;
    const phH = ph - top - 90 - teaserH;
    const pb = this.photoBox;
    pb.position.set(m, top);
    const frame = new Graphics().rect(-6, -6, phW + 12, phH + 12).fill(C.ink);
    pb.addChild(frame);
    const inner = new Container();
    const mask = new Graphics().rect(0, 0, phW, phH).fill(0xffffff);
    inner.mask = mask;
    pb.addChild(inner, mask);
    const gray = new ColorMatrixFilter();
    gray.desaturate();
    const contrast = new ColorMatrixFilter();
    contrast.contrast(0.35, false);
    const comic = new ComicFilter({ dot: 4, levels: 4, sat: 0.2, shadow: P.blue, strength: 1 });
    if (o.photo) {
      const sp = new Sprite(o.photo);
      const s = Math.max(phW / sp.width, phH / sp.height) * 1.15;
      sp.scale.set(s);
      sp.position.set((phW - sp.width) / 2, (phH - sp.height) / 2 + 20);
      inner.addChild(sp);
    } else {
      const g = new Graphics().rect(0, 0, phW, phH * 0.62).fill(0xb9c4cc).rect(0, phH * 0.62, phW, phH).fill(0x5d6f80);
      g.star(phW * 0.35, phH * 0.55, 12, 120, 60).fill(0xffffff).stroke({ width: 4, color: C.ink });
      inner.addChild(g);
    }
    if (o.mvpSpecies) {
      const cat = new Sprite(catTexture(slugOf(o.mvpSpecies)));
      cat.anchor.set(0.5, 1);
      const s = (phH * 1.05) / Math.max(1, cat.texture.height);
      cat.scale.set(s);
      cat.position.set(phW - cat.width * 0.42, phH + 26);
      applyCatTint(cat, o.mvpSpecies);
      inner.addChild(cat);
      this.mvp = cat;
    }
    inner.filters = settings.reduceFlashes ? [gray, contrast] : [gray, contrast, comic];
    const cap = txt(o.caption, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 16, fill: C.ink, wordWrap: true, wordWrapWidth: phW });
    cap.position.set(0, phH + 12);
    pb.addChild(cap);
    const ct = columnText(phW, Math.max(0, Math.floor((ph - top - phH - 50 - teaserH) / 13) - 1), C.ink, 13, 7);
    ct.position.set(0, phH + 40);
    pb.addChild(ct);
    pg.addChild(pb);

    // loot box (right column)
    const lx = m + phW + 30;
    const lw = pw - m - lx;
    const lb = this.lootBox;
    lb.position.set(lx, top);
    const lbBg = new Graphics().rect(0, 0, lw, 46).fill(C.ink);
    const lbT = txt('BOTÍN DEL DÍA', { fontFamily: F.poster, fontSize: 34, fill: P.aged, letterSpacing: 1 });
    lbT.position.set(14, 2);
    lb.addChild(lbBg, lbT);
    let y = 58;
    const avail = ph - 40 - top - y - 34 - teaserH;
    const rowH = Math.max(o.teaser ? 25 : 34, Math.min(48, Math.floor(avail / Math.max(1, o.rows.length))));
    const k = rowH / 48;
    for (const row of o.rows) {
      const c = new Container();
      const ic = icon(row.kind, 34 * k, row.tint);
      ic.position.set(22, 20 * k);
      const l = txt(row.label, { fontFamily: F.ui, fontWeight: '700', fontSize: Math.round(19 * Math.max(0.85, k)), fill: C.ink });
      l.position.set(50, 8 * k);
      const v = txt('0', { fontFamily: F.heavy, fontSize: Math.round(26 * Math.max(0.8, k)), fill: o.golden && row.kind === 'gold' ? 0x9a6a10 : C.ink });
      v.anchor.set(1, 0);
      v.position.set(lw - 6, 4 * k);
      const rule = new Graphics().rect(0, rowH - 6, lw, 1).fill({ color: C.ink, alpha: 0.4 });
      c.addChild(ic, l, v, rule);
      c.position.set(0, y);
      c.alpha = 0;
      lb.addChild(c);
      this.rows.push({ c, value: v, row });
      y += rowH;
    }
    const [m0, m1] = o.momentum;
    this.bolsa = txt(`BOLSA · MOMENTUM ${m1 >= m0 ? '▲' : '▼'} ×${m0.toFixed(2)} → ×${m1.toFixed(2)}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: m1 >= m0 ? 0x2e8a52 : C.red, wordWrap: true, wordWrapWidth: lw });
    this.bolsa.position.set(0, y + 8);
    this.bolsa.alpha = 0;
    // boss pages: the cliffhanger strip needs that room (Momentum is in the right column anyway)
    if (o.teaser) this.bolsa.visible = false;
    lb.addChild(this.bolsa);
    const rest = ph - top - y - 70 - teaserH;
    if (o.teaser) {
      // cliffhanger strip: "EN LA PRÓXIMA EDICIÓN" across the bottom of the front page
      const tb = new Container();
      const th = teaserH - 12;
      const frame = new Graphics().rect(0, 0, iw, th).fill({ color: C.red, alpha: 0.07 }).stroke({ width: 3, color: C.red }).rect(5, 5, iw - 10, th - 10).stroke({ width: 1, color: C.red });
      const kb = new Graphics().rect(0, 0, 150, th).fill(C.red);
      const kt = txt('EN LA\nPRÓXIMA\nEDICIÓN', { fontFamily: F.bebas, fontSize: 25, fill: P.aged, letterSpacing: 2, lineHeight: 26, align: 'center' });
      kt.anchor.set(0.5);
      kt.position.set(75, th / 2);
      const hd = txt(o.teaser.head, { fontFamily: F.poster, fontSize: 30, fill: C.ink });
      if (hd.width > iw - 330) hd.scale.set((iw - 330) / hd.width);
      hd.position.set(168, 8);
      const bd = txt(o.teaser.text, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 16, fill: C.ink, wordWrap: true, wordWrapWidth: iw - 340, lineHeight: 19 });
      bd.position.set(170, 12 + hd.height);
      const cont = stamp('CONTINUARÁ', C.red, 24, -0.08);
      cont.position.set(iw - 92, th / 2);
      tb.addChild(frame, kb, kt, hd, bd, cont);
      tb.position.set(m, ph - 34 - th);
      tb.alpha = 0;
      pg.addChild(tb);
      this.teaserBox = tb;
    }
    if (rest > 40) {
      const ct2 = columnText(lw, Math.floor(rest / 13), C.ink, 13, 3);
      ct2.position.set(0, y + 44);
      lb.addChild(ct2);
    }
    if (o.golden) {
      const gs = stamp('¡BOTÍN DORADO! ×3', 0xb8862a, 34, -0.12);
      gs.position.set(phW - 170, 46);
      gs.alpha = 0;
      pb.addChild(gs);
      this.goldStamp = gs;
    }
    pg.addChild(lb);
    this.page.pivot.set(pw / 2, ph / 2);
    this.page.position.set(pw / 2, ph / 2);
    this.addChild(pg);

    // initial hidden states
    this.kicker.alpha = 0;
    this.headline.alpha = 0;
    this.sub.alpha = 0;
    this.photoBox.alpha = 0;
  }

  /** Builds the animation. `onLand` fires when the spinning page slaps down. */
  timeline(onLand?: () => void): gsap.core.Timeline {
    const tl = gsap.timeline();
    const pg = this.page;
    const reduce = settings.reduceMotion;
    pg.scale.set(0.06);
    pg.rotation = reduce ? -0.02 : -Math.PI * 5;
    tl.call(() => sfx('whoosh'), [], 0);
    tl.to(pg, { rotation: -0.018, duration: 0.75, ease: 'power3.out' }, 0);
    tl.to(pg.scale, { x: 1, y: 1, duration: 0.75, ease: 'power3.out' }, 0);
    tl.call(
      () => {
        sfx('boom', 0.8);
        sfx('paper');
        onLand?.();
      },
      [],
      0.72,
    );
    // kicker slam
    tl.call(() => sfx('hit', 1.1), [], 0.85);
    tl.to(this.kicker, { alpha: 1, duration: 0.01 }, 0.85);
    tl.from(this.kicker.scale, { x: 1.7, y: 1.7, duration: 0.18, ease: 'power3.in' }, 0.85);
    // headline with misregistration that settles
    tl.call(
      () => {
        sfx('bigboom', 1.2);
        if (!reduce) {
          const rgb = new RGBSplitFilter({ red: { x: -9, y: 2 }, green: { x: 0, y: -5 }, blue: { x: 8, y: 3 } });
          this.headline.filters = [rgb];
          gsap.to(rgb.red, { x: 0, y: 0, duration: 0.6 });
          gsap.to(rgb.green, { y: 0, duration: 0.6 });
          gsap.to(rgb.blue, { x: 0, y: 0, duration: 0.6, onComplete: () => (this.headline.filters = []) });
        }
      },
      [],
      1.02,
    );
    tl.to(this.headline, { alpha: 1, duration: 0.01 }, 1.02);
    tl.from(this.headline.scale, { x: 1.25, y: 1.25, duration: 0.2, ease: 'power3.in' }, 1.02);
    tl.to(this.sub, { alpha: 1, duration: 0.3 }, 1.25);
    // photo develops
    tl.to(this.photoBox, { alpha: 1, duration: 0.45 }, 1.35);
    tl.call(() => sfx('pop'), [], 1.4);
    if (this.mvp) tl.from(this.mvp, { y: this.mvp.y + 80, duration: 0.4, ease: 'back.out(2)' }, 1.45);
    // loot cascade (each step ~12% shorter: it gathers speed)
    let t = 1.75;
    let step = 0.42;
    this.rows.forEach((r, i) => {
      tl.call(
        () => {
          r.c.alpha = 1;
          gsap.from(r.c, { x: 40, duration: 0.18, ease: 'power2.out' });
          sfx(r.row.kind === 'gem' ? 'gem' : 'coin', 1 + i * 0.07);
          r.tw = tickUp(r.value, r.row.value, { suffix: r.row.suffix ?? '', dur: Math.max(0.3, step * 1.1), onTick: (p) => sfx('tick', 1 + p * 0.5) });
          gsap.fromTo(r.value.scale, { x: 1.4, y: 1.4 }, { x: 1, y: 1, duration: 0.3, delay: step, ease: 'back.out(3)' });
        },
        [],
        t,
      );
      t += step;
      step *= 0.88;
    });
    tl.to(this.bolsa, { alpha: 1, duration: 0.25 }, t);
    if (this.goldStamp) {
      const gs = this.goldStamp;
      tl.call(
        () => {
          gs.alpha = 1;
          gsap.from(gs.scale, { x: 2.6, y: 2.6, duration: 0.2, ease: 'power3.in' });
          sfx('fanfare');
          sparkles(this.photoBox, gs.x, gs.y, C.yellow, 22, 220);
        },
        [],
        t + 0.1,
      );
      t += 0.4;
    }
    if (this.teaserBox) {
      const tb = this.teaserBox;
      tl.call(
        () => {
          tb.alpha = 1;
          gsap.from(tb, { x: 30, duration: 0.25, ease: 'back.out(2)' });
          sfx('paper');
          sfx('sting', 1.3);
        },
        [],
        t + 0.25,
      );
      t += 0.5;
    }
    tl.addLabel('done', t + 0.2);
    return tl;
  }

  /** finish all tick-ups instantly (tap = completar) */
  complete() {
    if (this.teaserBox) this.teaserBox.alpha = 1;
    for (const r of this.rows) {
      r.c.alpha = 1;
      gsap.killTweensOf(r.c);
      r.c.x = 0;
      r.tw?.kill();
      r.value.text = `${fmt(r.row.value)}${r.row.suffix ?? ''}`;
    }
  }

  /** global position of the headline (for Ronroneo stamps) */
  headlineGlobal() {
    return this.headline.getGlobalPosition();
  }
}

function fitHeadline(text: string, iw: number, maxH: number): { text: string; size: number } {
  const base = 100;
  const st = new TextStyle({ fontFamily: F.poster, fontSize: base, letterSpacing: -1 });
  const wOf = (t: string) => CanvasTextMetrics.measureText(t, st).width;
  const full = wOf(text);
  const one = Math.min(124, Math.floor((base * iw) / full));
  if (one >= 96) return { text, size: one };
  const words = text.split(' ');
  let best2 = { t: text, w: Infinity };
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const w = Math.max(wOf(a), wOf(b));
    if (w < best2.w) best2 = { t: `${a}\n${b}`, w };
  }
  const s2 = Math.min(124, Math.floor((base * iw) / best2.w), Math.floor(maxH / 2 / 0.98));
  if (s2 >= 72 || words.length < 3) return { text: best2.t, size: Math.max(56, s2) };
  let best3 = { t: text, w: Infinity };
  for (let i = 1; i < words.length - 1; i++)
    for (let j = i + 1; j < words.length; j++) {
      const parts = [words.slice(0, i), words.slice(i, j), words.slice(j)].map((p) => p.join(' '));
      const w = Math.max(...parts.map(wOf));
      if (w < best3.w) best3 = { t: parts.join('\n'), w };
    }
  return { text: best3.t, size: Math.max(48, Math.min(Math.floor((base * iw) / best3.w), Math.floor(maxH / 3 / 0.98))) };
}

export { halftoneTexture };
