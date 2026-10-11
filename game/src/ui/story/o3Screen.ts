/**
 * Parte II · Oleada 3 — the screen-level pieces of its scenes (paper and ink over whatever stage is on: the island, the
 * CARTA or Puerto Cometa). Each one returns its stopper; nothing outlives the scene or the dialog that shows it.
 *
 *   pizarra(k)     H51 a: Luzterna's chalkboard — two meters filling at the SAME time, the ring that shines, and (k=1)
 *                  the hit jumping module to module, kanji included. A line hook on b51_sincronia#a (no scene needed)
 *   pasaporte()    H51 b: Escafandra's stamp comes down on your passport — ¡CHUNK! (line hook on b51_sincronia#b)
 *   flashback()    H52 a: one second of the Parte I memory — the Estrella Errante pushed by a cable of light
 *   bitacoraRem()  H52 b: the tug's logbook: dated rows, an order written in the MARGIN in a beautiful hand, and at the
 *                  foot a doodle of a hand holding a pencil (`write()`, `doodle()`, `close()`)
 *   bitacora()     H56: Puerto Cometa's logbook — FIRMAR, your name in your hand, then the page slides to its margin
 *                  where an old note waits in the SAME hand (`sign()`, `slide()`, `note()`)
 */
import { Container, Graphics, Text, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { game } from '../../core/App';
import { scenes } from '../../core/scenes';
import { settings } from '../../core/settings';
import { C, F } from '../theme';
import { Button, poster, txt } from '../widgets';
import { onomatopoeia } from '../../fx/juice';
import { storyLayer } from '../dialog';
import { G } from '../../state/game';
import { shipName } from '../../state/sys/ship';
import { motif } from '../../cine/sound';
import { BITACORA } from './rupturasScriptO3';

type Stopper = () => void;
const rm = () => settings.reduceMotion;

/** a layer in the overlay: under the dialog boxes (story layer) so the lines read over it */
function layer(under = true) {
  const c = new Container();
  c.label = 'cineFx';
  const ov = scenes.overlayLayer;
  const sl = storyLayer();
  const i = ov.children.indexOf(sl);
  if (under && i >= 0) ov.addChildAt(c, i);
  else ov.addChild(c);
  return c;
}
function gone(c: Container, dur = 0.35) {
  if (c.destroyed) return;
  c.eventMode = 'none';
  gsap.killTweensOf(c);
  gsap.to(c, { alpha: 0, duration: dur, onComplete: () => !c.destroyed && c.destroy({ children: true }) });
}

// ------------------------------------------------------------------ H51 · la pizarra
export function pizarra(): { stop: Stopper; plasma: () => void } {
  const v = game.view;
  const root = layer();
  root.eventMode = 'none';
  const W = 620;
  const Hh = 380;
  const board = new Container();
  const g = new Graphics()
    .rect(10, 10, W, Hh)
    .fill({ color: C.ink, alpha: 0.5 })
    .rect(0, 0, W, Hh)
    .fill(0x8a5a2b)
    .stroke({ width: 5, color: C.ink })
    .rect(16, 16, W - 32, Hh - 32)
    .fill(0x23402f);
  for (let i = 0; i < 18; i++) g.rect(30 + ((i * 97) % (W - 80)), 30 + ((i * 53) % (Hh - 80)), 40 + ((i * 13) % 60), 3).fill({ color: 0xffffff, alpha: 0.04 });
  board.addChild(g);
  const chalk = (s: string, size: number, color = 0xf4f1e6) => txt(s, { fontFamily: F.brush, fontSize: size, fill: color, padding: 8 }) as Text;
  // two meters, side by side, filling together
  const mk = (x: number, label: string, color: number) => {
    const c = new Container();
    const fr = new Graphics().roundRect(0, 0, 70, 190, 10).stroke({ width: 4, color: 0xf4f1e6 });
    const fill = new Graphics().roundRect(6, 6, 58, 178, 7).fill({ color, alpha: 0.85 });
    const m = new Graphics().rect(0, 0, 70, 190).fill(0xffffff);
    fill.mask = m;
    c.addChild(fill, m, fr);
    const l = chalk(label, 26, color);
    l.anchor.set(0.5, 0);
    l.position.set(35, 198);
    c.addChild(l);
    c.position.set(x, 50);
    return { c, m };
  };
  const a = mk(60, 'FUEGO', 0xff8a3c);
  const b = mk(170, 'TORMENTA', 0x6fd8ff);
  const ring = new Graphics().circle(0, 0, 44).stroke({ width: 6, color: 0xfff4c8 });
  ring.position.set(355, 140);
  const ringT = chalk('¡SUELTA!', 26, 0xfff4c8);
  ringT.anchor.set(0.5);
  ringT.position.set(355, 210);
  const k1 = chalk('同期', 64, 0xfff4c8);
  k1.anchor.set(0.5);
  k1.position.set(520, 90);
  board.addChild(a.c, b.c, ring, ringT, k1);
  // the hit jumping module to module (shown with «¡SOBRECARGA!»)
  const plasma = new Container();
  const mods = new Graphics();
  for (let i = 0; i < 3; i++) mods.rect(300 + i * 100, 270, 70, 54).stroke({ width: 4, color: 0xf4f1e6 });
  const arrow = new Graphics();
  plasma.addChild(mods, arrow);
  const k2 = chalk('プラズマ', 34, 0xff9ad6);
  k2.position.set(300, 226);
  const sob = chalk('¡SOBRECARGA!', 30, 0xff9ad6);
  sob.position.set(60, 300);
  plasma.addChild(k2, sob);
  plasma.alpha = 0;
  board.addChild(plasma);
  board.scale.set(Math.min(1, (v.w / 1920) * 0.95));
  board.position.set(v.x + v.w - board.width - 60, v.y + 110);
  board.rotation = 0.02;
  root.addChild(board);
  root.alpha = 0;
  gsap.to(root, { alpha: 1, duration: 0.35 });
  if (!rm()) gsap.from(board, { y: board.y - 60, rotation: -0.08, duration: 0.5, ease: 'back.out(1.6)' });
  let t = 0;
  let showPlasma = false;
  const tick = (tk: Ticker) => {
    if (root.destroyed) return void Ticker.shared.remove(tick);
    t += tk.deltaMS / 1000;
    // both fill at once, the ring shines when they're full: «sueltas cuando brilla el anillo»
    const cyc = (t % 2.4) / 2.4;
    const f = Math.min(1, cyc / 0.7);
    for (const m of [a.m, b.m]) {
      m.clear().rect(0, 190 * (1 - f), 70, 190 * f).fill(0xffffff);
    }
    const lit = cyc > 0.7 && cyc < 0.9;
    ring.alpha = lit ? 1 : 0.35;
    ring.scale.set(lit && !rm() ? 1.15 : 1);
    ringT.alpha = lit ? 1 : 0.25;
    if (showPlasma) {
      plasma.alpha = Math.min(1, plasma.alpha + tk.deltaMS / 400);
      const hop = Math.floor((t * 2.5) % 3);
      arrow.clear();
      for (let i = 0; i <= hop; i++) {
        const x0 = 335 + (i - 1) * 100;
        if (i > 0) arrow.moveTo(x0, 262).quadraticCurveTo(x0 + 50, 226, x0 + 100, 262).stroke({ width: 4, color: 0xff9ad6 });
      }
      arrow.rect(300 + hop * 100 + 6, 276, 58, 42).fill({ color: 0xff9ad6, alpha: 0.6 });
    }
  };
  Ticker.shared.add(tick);
  return {
    stop: () => {
      Ticker.shared.remove(tick);
      gone(root);
    },
    plasma: () => {
      showPlasma = true;
    },
  };
}

// ------------------------------------------------------------------ H51 · el pasaporte
export function pasaporte(): Stopper {
  const v = game.view;
  const root = layer();
  root.eventMode = 'none';
  const book = new Container();
  const g = new Graphics()
    .rect(8, 8, 420, 280)
    .fill({ color: C.ink, alpha: 0.5 })
    .rect(0, 0, 420, 280)
    .fill(0x2b3a55)
    .stroke({ width: 5, color: C.ink })
    .rect(14, 14, 392, 252)
    .fill(0xf3ead6);
  for (let i = 0; i < 6; i++) g.moveTo(40, 70 + i * 30).lineTo(380, 70 + i * 30).stroke({ width: 2, color: 0x9fb4c8, alpha: 0.6 });
  const head = poster('PASAPORTE ASTRAL', 30, 0x2b3a55);
  head.position.set(30, 22);
  const who = txt(`${G.s.player?.name ?? 'Capi'} · ${shipName(G.s.ship.active)}`, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 22, fill: C.ink }) as Text;
  who.position.set(40, 80);
  book.addChild(g, head, who);
  const stamp = new Container();
  const sg = new Graphics().roundRect(-130, -46, 260, 92, 12).stroke({ width: 8, color: 0xc8102e }).roundRect(-118, -34, 236, 68, 8).stroke({ width: 3, color: 0xc8102e });
  const st = poster('APROBADO', 50, 0xc8102e, { letterSpacing: 4 });
  st.anchor.set(0.5);
  const st2 = txt('MUELLE DE PRUEBAS · PUERTO COMETA', { fontFamily: F.ui, fontWeight: '700', fontSize: 11, fill: 0xc8102e }) as Text;
  st2.anchor.set(0.5);
  st2.position.set(0, 30);
  stamp.addChild(sg, st, st2);
  stamp.position.set(260, 190);
  stamp.rotation = -0.18;
  stamp.alpha = 0;
  book.addChild(stamp);
  book.pivot.set(210, 140);
  book.position.set(v.x + v.w * 0.5, v.y + v.h * 0.36);
  book.scale.set(Math.min(1.1, v.w / 1920 + 0.1));
  root.addChild(book);
  root.alpha = 0;
  gsap.to(root, { alpha: 1, duration: 0.25 });
  // the stamp comes down: ¡CHUNK! — the whole pier shakes (the card does)
  gsap.delayedCall(rm() ? 0.2 : 0.55, () => {
    if (root.destroyed) return;
    stamp.alpha = 0.92;
    if (!rm()) gsap.from(stamp.scale, { x: 1.9, y: 1.9, duration: 0.14, ease: 'power3.in' });
    motif('chunk');
    onomatopoeia(root, book.x + 140, book.y - 110, '¡CHUNK!', { size: 74, color: C.yellow });
    if (!rm()) gsap.fromTo(book, { x: book.x - 14 }, { x: book.x, duration: 0.35, ease: 'elastic.out(1.2,0.3)' });
  });
  return () => gone(root);
}

// ------------------------------------------------------------------ H52 · el recuerdo (one second)
export function flashback(): Stopper {
  const v = game.view;
  const root = layer(false);
  root.eventMode = 'none';
  const soft = settings.reduceFlashes || rm();
  const bg = new Graphics().rect(v.x, v.y, v.w, v.h).fill({ color: 0x3a2a14, alpha: soft ? 0.55 : 0.82 });
  const g = new Graphics();
  // halftone sky of Part I, a star tumbling, the beam that pushed it
  for (let i = 0; i < 160; i++) g.circle(v.x + ((i * 157) % v.w), v.y + ((i * 89) % v.h), 3).fill({ color: 0xffe2a8, alpha: 0.12 });
  const cx = v.x + v.w * 0.56;
  const cy = v.y + v.h * 0.46;
  g.moveTo(v.x + v.w * 0.08, v.y + v.h * 0.12).lineTo(cx - 30, cy - 20).stroke({ width: 26, color: 0xb79cff, alpha: 0.5 });
  g.moveTo(v.x + v.w * 0.08, v.y + v.h * 0.12).lineTo(cx - 30, cy - 20).stroke({ width: 8, color: 0xffe7a0, alpha: 0.95 });
  const starG = new Graphics();
  const R = 90;
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
    const r = i % 2 ? R * 0.45 : R;
    pts.push(Math.cos(a) * r, Math.sin(a) * r);
  }
  starG.poly(pts).fill(0xffd84a).stroke({ width: 8, color: C.ink });
  starG.position.set(cx, cy);
  const streak = new Graphics().moveTo(cx, cy).lineTo(cx + 380, cy + 260).stroke({ width: 40, color: 0xffd84a, alpha: 0.25 });
  root.addChild(bg, g, streak, starG);
  root.alpha = 0;
  gsap.to(root, { alpha: 1, duration: soft ? 0.25 : 0.08 });
  if (!rm()) gsap.to(starG, { x: cx + 160, y: cy + 110, rotation: 1.4, duration: 1.1, ease: 'power1.in' });
  gsap.delayedCall(1.05, () => gone(root, 0.3));
  return () => gone(root, 0.15);
}

// ------------------------------------------------------------------ H52 · la bitácora de la Remolcadora
export function bitacoraRem() {
  const v = game.view;
  const root = layer();
  root.eventMode = 'none';
  const book = new Container();
  const PW = 460;
  const PH = 560;
  const cover = new Graphics().rect(-PW - 20 + 10, -20 + 10, PW * 2 + 40, PH + 40).fill({ color: C.ink, alpha: 0.5 }).rect(-PW - 20, -20, PW * 2 + 40, PH + 40).fill(0x4a3324).stroke({ width: 6, color: C.ink });
  // (Pixi v8: text goes in Containers, never inside a Graphics)
  const left = new Container();
  const leftG = new Graphics().rect(-PW, 0, PW, PH).fill(0xf3ead6).stroke({ width: 3, color: 0xb8a988 });
  const right = new Container();
  const rightG = new Graphics().rect(0, 0, PW, PH).fill(0xf6eedc).stroke({ width: 3, color: 0xb8a988 });
  left.addChild(leftG);
  right.addChild(rightG);
  for (let i = 0; i < 15; i++) {
    leftG.moveTo(-PW + 90, 60 + i * 32).lineTo(-20, 60 + i * 32).stroke({ width: 2, color: 0x9fb4c8, alpha: 0.6 });
    rightG.moveTo(20, 60 + i * 32).lineTo(PW - 30, 60 + i * 32).stroke({ width: 2, color: 0x9fb4c8, alpha: 0.6 });
  }
  leftG.moveTo(-PW + 80, 0).lineTo(-PW + 80, PH).stroke({ width: 3, color: 0xc8102e, alpha: 0.55 });
  const rows = ['Día 411 · remolque de cometa menor · sin novedad', 'Día 412 · mover asteroide 3 cajas a la izq.', 'Día 413 · reparar cable de luz', 'Día 414 · ', 'Día 415 · remolque (ver margen)', 'Día 416 · sin novedad', 'Día 417 · sin novedad'];
  rows.forEach((r, i) => {
    const t = txt(r, { fontFamily: F.ui, fontSize: 17, fill: 0x2b3a55 }) as Text;
    t.position.set(-PW + 92, 38 + i * 64);
    left.addChild(t);
  });
  const rrows = ['Carga: 1 planetoide (prestado)', 'Destino: «donde diga el margen»', 'Firmado: —'];
  rrows.forEach((r, i) => {
    const t = txt(r, { fontFamily: F.ui, fontSize: 17, fill: 0x2b3a55 }) as Text;
    t.position.set(28, 38 + i * 64);
    right.addChild(t);
  });
  const head = poster('BITÁCORA · LA REMOLCADORA', 26, 0xf2e6c9);
  head.anchor.set(0.5, 1);
  head.position.set(0, -26);
  book.addChild(cover, left, right, head);
  // the order in the MARGIN, in a beautiful hand (writes itself)
  const order = txt('Reubicar estrella.\nSalvar caja 7.312.', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 30, fill: 0x1f2a6b, padding: 10, lineHeight: 38 }) as Text;
  order.rotation = -Math.PI / 2;
  order.anchor.set(0.5);
  order.position.set(-PW + 40, PH * 0.48);
  const oMask = new Graphics();
  order.mask = oMask;
  book.addChild(order, oMask);
  // the doodle at the foot: a hand holding a pencil (draws itself)
  const doodle = new Graphics();
  book.addChild(doodle);
  const pivotX = PW * 0.55;
  book.position.set(v.x + v.w * 0.5, v.y + v.h * 0.12);
  book.scale.set(Math.min(1, v.w / 1920) * 0.92);
  root.addChild(book);
  root.alpha = 0;
  gsap.to(root, { alpha: 1, duration: 0.4 });
  if (!rm()) gsap.from(book, { y: book.y + 80, duration: 0.6, ease: 'power2.out' });
  const st = { o: 0, d: 0 };
  const drawOrder = () => {
    oMask.clear().rect(-PW + 14, PH * 0.48 + 200 - 400 * st.o, 56, 400 * st.o).fill(0xffffff);
  };
  drawOrder();
  // a hand (thumb, fingers) holding a pencil, as a few ink strokes
  const strokes: number[][] = [
    [pivotX - 120, PH - 70, pivotX - 90, PH - 110, pivotX - 50, PH - 118, pivotX - 10, PH - 104],
    [pivotX - 10, PH - 104, pivotX + 10, PH - 90, pivotX - 6, PH - 74, pivotX - 50, PH - 70],
    [pivotX - 50, PH - 70, pivotX - 90, PH - 60, pivotX - 120, PH - 70],
    [pivotX - 70, PH - 112, pivotX - 66, PH - 130, pivotX - 46, PH - 128, pivotX - 44, PH - 116],
    [pivotX - 30, PH - 150, pivotX + 60, PH - 40],
    [pivotX + 60, PH - 40, pivotX + 52, PH - 30, pivotX + 66, PH - 34],
  ];
  const drawDoodle = () => {
    doodle.clear();
    const total = strokes.length;
    const upTo = st.d * total;
    strokes.forEach((s, i) => {
      const k = Math.max(0, Math.min(1, upTo - i));
      if (k <= 0) return;
      const n = Math.max(2, Math.floor((s.length / 2) * k));
      doodle.poly(s.slice(0, n * 2), false).stroke({ width: 4, color: 0x1f2a6b });
    });
  };
  return {
    stop: () => gone(root),
    write: () => {
      motif('pluma');
      gsap.to(st, { o: 1, duration: rm() ? 0.2 : 2.4, ease: 'power1.inOut', onUpdate: drawOrder });
    },
    doodle: () => {
      motif('pluma');
      gsap.to(st, { d: 1, duration: rm() ? 0.2 : 1.8, ease: 'none', onUpdate: drawDoodle });
    },
    /** Luzterna closes the book, slowly */
    close: () => {
      if (book.destroyed) return;
      gsap.to(right.scale, { x: 0, duration: rm() ? 0.2 : 1.4, ease: 'power2.inOut' });
      gsap.to(root, { alpha: 0, duration: 0.6, delay: rm() ? 0.25 : 1.4, onComplete: () => !root.destroyed && root.destroy({ children: true }) });
    },
  };
}

// ------------------------------------------------------------------ H56 · la bitácora de Puerto Cometa (your signature)
export function bitacora() {
  const v = game.view;
  const root = layer();
  const dim = new Graphics().rect(v.x, v.y, v.w, v.h).fill({ color: C.ink, alpha: 0.45 });
  root.addChild(dim);
  // the page is wider than the screen: the margin sits off to the left until the camera «slides» there
  const page = new Container();
  const PW = 2100;
  const PH = 720;
  const MARGIN = 300;
  /** where the writing sits on the (wide) page: far from its margin */
  const COL = MARGIN + 560;
  const g = new Graphics().rect(12, 12, PW, PH).fill({ color: C.ink, alpha: 0.5 }).rect(0, 0, PW, PH).fill(0xf6efdc).stroke({ width: 5, color: C.ink });
  for (let y = 90; y < PH - 20; y += 48) g.moveTo(MARGIN, y).lineTo(PW - 40, y).stroke({ width: 2, color: 0x9fb4c8, alpha: 0.6 });
  g.moveTo(MARGIN - 20, 0).lineTo(MARGIN - 20, PH).stroke({ width: 3, color: 0xc8102e, alpha: 0.6 });
  page.addChild(g);
  const head = poster(BITACORA.title, 40, 0x3a2a1a);
  head.position.set(COL, 22);
  page.addChild(head);
  const rows = [`Nave: ${shipName(G.s.ship.active)}`, 'Destino: vacío profundo', 'Carga: gatos (varios), una fantasma, mucha impaciencia'];
  rows.forEach((r, i) => {
    const t = txt(r, { fontFamily: F.serif, fontSize: 30, fill: C.ink }) as Text;
    t.position.set(COL + 10, 112 + i * 48);
    page.addChild(t);
  });
  const name = (G.s.player?.name || 'Capi').slice(0, 22);
  const lineY = 520;
  page.addChild(new Graphics().moveTo(COL + 100, lineY).lineTo(COL + 730, lineY).stroke({ width: 3, color: C.ink }));
  const x = poster('X', 40, C.ink);
  x.position.set(COL + 60, lineY - 46);
  page.addChild(x);
  const hand = { fontFamily: F.brush, fontSize: 64, fill: 0x1f2a6b, padding: 12 };
  const sig = new Text({ text: '', style: hand });
  sig.position.set(COL + 120, lineY - 78);
  page.addChild(sig);
  // the old note, in the margin: it was always there (shown with note())
  const note = new Text({ text: BITACORA.note, style: { ...hand, fontSize: 36, wordWrap: true, wordWrapWidth: MARGIN - 70, lineHeight: 44 } });
  note.rotation = -0.1;
  note.position.set(28, 220);
  note.alpha = 0;
  const nMask = new Graphics();
  note.mask = nMask;
  page.addChild(note, nMask);
  const sc = Math.min(1, (v.w / 1920) * 1.05);
  page.scale.set(sc);
  // start framed on the signature line (the margin off-screen to the left)
  const baseX = v.x + v.w * 0.5 - (COL + 420) * sc;
  page.position.set(baseX, v.y + v.h * 0.5 - PH * 0.5 * sc - 40);
  root.addChild(page);
  root.alpha = 0;
  gsap.to(root, { alpha: 1, duration: 0.4 });
  let onSign: (() => void) | null = null;
  const btn = new Button(BITACORA.sign, () => {
    btn.visible = false;
    onSign?.();
  }, { w: 300, h: 84, size: 36, color: C.yellow });
  btn.position.set(v.x + v.w * 0.5 - 150, v.y + v.h - 230);
  root.addChild(btn);
  btn.visible = false;
  return {
    root,
    stop: () => gone(root),
    /** show FIRMAR and wait for it (resolves at once when `skip()` says so) */
    ask: (): Promise<void> =>
      new Promise((res) => {
        btn.visible = true;
        if (!rm()) gsap.from(btn.scale, { x: 0.6, y: 0.6, duration: 0.3, ease: 'back.out(2)' });
        onSign = () => res();
      }),
    hideAsk: () => (btn.visible = false),
    /** your name writes itself, letter by letter (a pen scratch per stroke) */
    sign: (instant: boolean): Promise<void> =>
      new Promise((res) => {
        if (instant || rm()) {
          sig.text = name;
          return res();
        }
        let i = 0;
        const step = () => {
          if (sig.destroyed) return res();
          sig.text = name.slice(0, ++i);
          if (i % 3 === 1) motif('pluma');
          if (i < name.length) window.setTimeout(step, 110);
          else res();
        };
        step();
      }),
    /** the «camera» slides along the page to its margin */
    slide: (dur: number) => gsap.to(page, { x: v.x + v.w * 0.07, duration: rm() ? 0.01 : dur, ease: 'power2.inOut' }),
    /** the note in the margin shows itself in the same hand */
    note: (dur: number) => {
      const st = { k: 0 };
      note.alpha = 0.9;
      const draw = () => nMask.clear().rect(0, 180, MARGIN, 60 + 260 * st.k).fill(0xffffff);
      draw();
      gsap.to(st, { k: 1, duration: rm() ? 0.01 : dur, ease: 'power1.inOut', onUpdate: draw });
    },
    /** both handwritings side by side: the camera pulls back a little */
    pull: (dur: number) => gsap.to(page.scale, { x: sc * 0.82, y: sc * 0.82, duration: rm() ? 0.01 : dur, ease: 'power2.inOut' }),
  };
}
