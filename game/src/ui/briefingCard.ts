/**
 * Parte III · LA TARJETA ANIMADA DE PRESENTACIÓN (the fallback when no film is registered for a stage; app/stageIntro.ts).
 * 6–8 s, in the box's colors (the Borracha: night blue, beer amber, donut pink, bottle green), four beats in order:
 *   1 QUÉ PASA        the situation
 *   2 CONTRA QUIÉN    the rival's name, line and painting
 *   3 SU REGLA        the rule in the player's words + the demonstration the sim computed (battle/demo.ts): the same
 *                     shot done well and badly, drawn exactly as the battle plays it
 *   4 QUÉ ARRIESGAMOS what we risk and what a first win pays
 * …and at the bottom the HONEST ESTIMATE («CON ESTA TRIPULACIÓN: 72 %», the same run as the Carta's card).
 * Tap anywhere (after 2.5 s) or ¡ZARPAR! to sail; VOLVER goes back to the Carta. It sails by itself at the end.
 * «Reducir movimiento»: fades instead of slides, the demo drawn whole; no flashes at all.
 */
import { Container, Graphics, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { scenes } from '../core/scenes';
import { W, H } from '../core/App';
import { settings } from '../core/settings';
import { sfx } from '../core/audio';
import { livingCat, preloadCats } from '../art/catArt';
import { ART } from '../art/livingCat';
import { C, F } from './theme';
import { Button, poster, txt } from './widgets';
import { screenRect } from './screen';
import { hush } from './hush';
import type { BriefingData } from '../app/stageIntro';
import type { RuleDemo } from '../battle/demo';

/** the box's colors (the Borracha's; another box passes its own later — mecanicas-v2/03 §2.4) */
const BX = { night: 0x0f1830, deep: 0x1b2a4a, beer: 0xe8a33d, donut: 0xf59ac0, bottle: 0x2e7d4f, paper: 0xf2ede2 };
/** total length and when tapping starts to skip (first time) */
export const CARD_MS = 7200;
export const CARD_MIN_MS = 2500;

function beatRow(n: number, head: string, body: string, color: number, wrap = 900): Container {
  const c = new Container();
  const num = poster(String(n), 64, color, { stroke: { color: C.ink, width: 6 } });
  const h = poster(head, 30, BX.paper, { letterSpacing: 3 });
  h.position.set(70, 4);
  const b = txt(body, { fontFamily: F.ui, fontWeight: '700', fontSize: 25, fill: BX.paper, wordWrap: true, wordWrapWidth: wrap, lineHeight: 31 });
  b.position.set(70, 44);
  const bar = new Graphics().rect(0, 76, 52, 6).fill(color);
  c.addChild(num, h, b, bar);
  return c;
}

/** the demo panel: the two ships, the target, the donuts and the shots, drawn into a w × h box */
function demoPanel(d: RuleDemo, w: number, h: number): { root: Container; play: (instant: boolean) => void } {
  const root = new Container();
  const bg = new Graphics().roundRect(0, 0, w, h, 18).fill({ color: 0x000000, alpha: 0.35 }).roundRect(0, 0, w, h, 18).stroke({ width: 3, color: BX.beer, alpha: 0.8 });
  root.addChild(bg);
  const f = d.field;
  const x0 = f.player.x0 - 40;
  const x1 = f.enemy.x1 + 40;
  const yTop = Math.min(...d.shots.flatMap((s) => s.points.map((p) => p.y)), f.waterY - 420) - 30;
  const yBot = f.waterY + 30;
  const k = Math.min((w - 20) / (x1 - x0), (h - 60) / (yBot - yTop));
  const ox = 10 + (w - 20 - (x1 - x0) * k) / 2;
  const oy = 10;
  const P = (x: number, y: number) => ({ x: ox + (x - x0) * k, y: oy + (y - yTop) * k });
  const g = new Graphics();
  // the sea and the two hulls (simple silhouettes: the extents are the sim's)
  const sea = P(x0, f.waterY);
  g.rect(sea.x, sea.y, (x1 - x0) * k, yBot * k - f.waterY * k).fill({ color: BX.deep });
  for (const [e, col] of [
    [f.player, 0x6e5a44],
    [f.enemy, 0x5a3f3a],
  ] as const) {
    const a = P(e.x0, f.waterY - 150);
    const b = P(e.x1, f.waterY + 10);
    g.roundRect(a.x, a.y, b.x - a.x, b.y - a.y, 8 * k).fill(col).stroke({ width: 2, color: C.ink });
  }
  if (f.target) {
    const t = P(f.target.x, f.target.y);
    g.circle(t.x, t.y, 12).stroke({ width: 3, color: BX.beer });
    g.moveTo(t.x - 18, t.y).lineTo(t.x + 18, t.y).moveTo(t.x, t.y - 18).lineTo(t.x, t.y + 18).stroke({ width: 2, color: BX.beer });
  }
  for (const dn of f.donas) {
    const p = P(dn.x, dn.y);
    g.circle(p.x, p.y, 9).fill(BX.donut).circle(p.x, p.y, 3).fill(BX.deep);
  }
  root.addChild(g);
  const trails = d.shots.map((s) => {
    const tg = new Graphics();
    root.addChild(tg);
    return { s, tg, col: s.good ? 0x7be08f : 0xff6b6b };
  });
  const cap = txt(d.caption, { fontFamily: F.ui, fontWeight: '700', fontSize: 19, fill: BX.paper, wordWrap: true, wordWrapWidth: w - 24 });
  cap.position.set(12, h - 46);
  root.addChild(cap);
  const draw = (tr: (typeof trails)[number], upto: number) => {
    const pts = tr.s.points;
    const n = Math.max(2, Math.floor(pts.length * upto));
    tr.tg.clear();
    const a = P(pts[0].x, pts[0].y);
    tr.tg.moveTo(a.x, a.y);
    for (let i = 1; i < n; i++) {
      const p = P(pts[i].x, pts[i].y);
      tr.tg.lineTo(p.x, p.y);
    }
    tr.tg.stroke({ width: 4, color: tr.col });
    if (upto >= 1) {
      const e = P(tr.s.x, tr.s.y);
      tr.tg.circle(e.x, e.y, 8).fill(tr.col);
      const mark = txt(`${tr.s.good ? '✔' : '✘'} ${tr.s.label}`, { fontFamily: F.poster, fontSize: 18, fill: tr.col });
      mark.position.set(Math.min(w - mark.width - 8, Math.max(8, e.x - mark.width / 2)), Math.max(6, e.y - 34));
      tr.tg.addChild(mark);
    }
  };
  const play = (instant: boolean) => {
    if (instant) {
      for (const tr of trails) draw(tr, 1);
      return;
    }
    trails.forEach((tr, i) => {
      const o = { u: 0 };
      gsap.to(o, { u: 1, duration: 0.9, delay: i * 1.0, ease: 'none', onUpdate: () => !tr.tg.destroyed && draw(tr, o.u), onComplete: () => !tr.tg.destroyed && draw(tr, 1) });
    });
  };
  return { root, play };
}

/** play the card; resolves 'go' (sail) or 'back' (back to the Carta) */
export async function playBriefingCard(d: BriefingData, o: { durMs?: number; minMs?: number } = {}): Promise<'go' | 'back'> {
  const dur = o.durMs ?? CARD_MS;
  const minMs = o.minMs ?? CARD_MIN_MS;
  const still = settings.reduceMotion;
  if (d.rival.slug) await Promise.race([preloadCats([d.rival.slug]), new Promise((r) => setTimeout(r, 900))]);
  hush('briefing', true);
  const layer = new Container();
  layer.eventMode = 'static';
  layer.hitArea = { contains: () => true };
  scenes.overlayLayer.addChild(layer);
  const back = screenRect(BX.night);
  // scanlines of the old TV (static, cheap) + a beer-amber band
  const scan = new Graphics();
  for (let y = 0; y < H; y += 6) scan.rect(-200, y, W + 400, 2).fill({ color: 0x000000, alpha: 0.18 });
  const band = new Graphics().poly([0, 60, W, 20, W, 190, 0, 230]).fill(d.kind === 'normal' ? BX.beer : BX.donut).stroke({ width: 8, color: C.ink });
  layer.addChild(back, scan, band);
  const tag = poster(d.tag, 34, C.ink, { letterSpacing: 4 });
  tag.position.set(80, 70);
  const title = poster(d.title.toUpperCase(), d.title.length > 20 ? 78 : 96, C.ink, { stroke: { color: BX.paper, width: 8 } });
  title.position.set(76, 104);
  if (title.width > 1180) title.scale.set(1180 / title.width);
  layer.addChild(tag, title);
  // the rival's painting, big, on the right
  let cat: Container | null = null;
  if (d.rival.slug) {
    // flipped: the rival faces us from the right (520 px tall, the way BattleCat sizes a painting)
    cat = livingCat(d.rival.slug, { anchorX: 0.5, anchorY: 0.94, fps: 12 });
    cat.scale.set(-520 / ART, 520 / ART);
    cat.position.set(W - 330, 760);
    layer.addChild(cat);
  }
  const nameTag = poster(d.rival.name.toUpperCase(), 34, BX.beer, { stroke: { color: C.ink, width: 6 } });
  nameTag.anchor.set(0.5, 0);
  nameTag.position.set(W - 330, 770);
  if (nameTag.width > 560) nameTag.scale.set(560 / nameTag.width);
  layer.addChild(nameTag);
  // the four beats
  const rows = [
    beatRow(1, 'QUÉ PASA', d.pasa, BX.beer),
    beatRow(2, 'CONTRA QUIÉN', d.rival.line ? `${d.rival.name}: «${d.rival.line}»` : d.rival.name, BX.donut),
    beatRow(3, 'SU REGLA', d.rule.lines.slice(0, 2).join(' · ') || 'Sin reglas raras: puro cañón.', 0x8fd3ff, d.rule.demo ? 560 : 900),
    beatRow(4, 'QUÉ ARRIESGAMOS', d.huellas ? `${d.stakes} Si ganamos: +${d.huellas} huellas de 000.` : d.stakes, BX.bottle),
  ];
  const y0 = 270;
  const gaps = [0, 120, 240, 420];
  rows.forEach((r, i) => {
    r.position.set(80, y0 + gaps[i]);
    r.alpha = 0;
    layer.addChild(r);
  });
  let demo: ReturnType<typeof demoPanel> | null = null;
  if (d.rule.demo) {
    demo = demoPanel(d.rule.demo, 520, 250);
    demo.root.position.set(720, y0 + 232);
    demo.root.alpha = 0;
    layer.addChild(demo.root);
  }
  // the honest estimate + the buttons
  const est = poster('CON ESTA TRIPULACIÓN: calculando…', 40, BX.paper, { stroke: { color: C.ink, width: 6 } });
  est.position.set(80, H - 150);
  layer.addChild(est);
  const showEst = () => {
    const e = d.estimate();
    if (!e || e.p === null) return;
    est.text = `CON ESTA TRIPULACIÓN: ${Math.round(e.p * 100)} %${e.done < e.total ? ` (${e.done}/${e.total})` : ''}`;
  };
  let result: 'go' | 'back' | null = null;
  const t0 = performance.now();
  const go = new Button('¡ZARPAR!', () => (result ??= 'go'), { w: 300, h: 84, size: 44, color: BX.beer });
  go.position.set(W - 380, H - 170);
  const ret = new Button('VOLVER', () => (result ??= 'back'), { w: 200, h: 64, size: 28, color: BX.paper });
  ret.position.set(W - 620, H - 160);
  layer.addChild(go, ret);
  const bar = new Graphics();
  layer.addChild(bar);
  layer.on('pointertap', () => {
    if (performance.now() - t0 >= minMs) result ??= 'go';
  });
  // the beats come in one by one
  sfx('sting');
  const step = Math.min(1.25, (dur / 1000 - 2.4) / 4);
  rows.forEach((r, i) => {
    if (still) gsap.to(r, { alpha: 1, duration: 0.3, delay: i * step });
    else {
      r.x -= 60;
      gsap.to(r, { alpha: 1, x: r.x + 60, duration: 0.35, delay: i * step, ease: 'power3.out', onStart: () => sfx('pop', 0.9 + i * 0.08) });
    }
  });
  if (demo) {
    const dm = demo;
    gsap.to(dm.root, { alpha: 1, duration: 0.3, delay: 2 * step, onStart: () => dm.play(still) });
  }
  if (cat && !still) gsap.from(cat, { x: W + 300, duration: 0.45, delay: step, ease: 'power3.out' });
  const tick = () => {
    showEst();
    const u = Math.min(1, (performance.now() - t0) / dur);
    bar.clear().rect(0, H - 10, W * u, 10).fill(BX.beer);
    if (u >= 1) result ??= 'go';
  };
  Ticker.shared.add(tick);
  try {
    while (result === null && !layer.destroyed) await new Promise((r) => setTimeout(r, 60));
  } finally {
    Ticker.shared.remove(tick);
    hush('briefing', false);
  }
  if (!layer.destroyed) await new Promise<void>((r) => gsap.to(layer, { alpha: 0, duration: still ? 0.15 : 0.3, onComplete: () => r() }));
  gsap.killTweensOf(layer);
  rows.forEach((r) => gsap.killTweensOf(r));
  if (!layer.destroyed) layer.destroy({ children: true });
  return result ?? 'go';
}

