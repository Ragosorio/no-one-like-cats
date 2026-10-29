/**
 * LA VITRINA — the showcase of a coin table after the Parte III (state/sys/postVitrina.ts; ⚠️ spoilers of the Parte III).
 *   presentVitrina()   «¡SE ABRIÓ LA VITRINA!» with the table's golden thing, then the prize card (and the reveal of a new
 *                      cat, by the auto-play's reveal plan). The throw was already applied and saved.
 *   drawVitrina()      the VITRINA tab of the table's odds: the Momento's chance and what counts, the throw's table (as it
 *                      stands now, after the guarantees), its 8 cats with ✓, the three counters, the Sellos and the spark.
 *   openVitrina()      that tab in its own window (the badge on the table opens it).
 *   vitrinaBadge()     the badge on the table: its star, «VITRINA · 0.6 % POR APUESTA».
 * Nothing shows before the Parte III is over or on a table whose showcase is empty (vitrinaOdds → null).
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { Modal } from '../../ui/modal';
import { C, F, RARITY, type Rarity } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { sfx } from '../../core/audio';
import { settings } from '../../core/settings';
import { catPortrait, ensureCats } from '../campaign/common';
import { INSTANT_SPEED, type Granted } from '../../state/sys/casino';
import { isVitrinaTable, vitrinaOdds, vitrinaPool, vitrinaRedeemSellos, vitrinaSparkPick, vitrinaThrowOdds } from '../../state/sys/postVitrina';
import { VITRINA_TABLES, type VitrinaTable } from '../../data/postp3/reglas';
import { CP, CButton, clickable } from './kit';
import { stamp } from './fx';
import { csfx } from './sfx';
import { presentPrizes, revealPlanFor } from './prizes';
import type { CasinoCtx } from './ctx';

const T = (s: string, size = 18, fill: number = C.ink, extra: Record<string, unknown> = {}) => txt(s, { fontFamily: F.ui, fontWeight: '700', fontSize: size, fill, ...extra });
const pct = (p: number) => (p >= 0.995 ? '100%' : p >= 0.1 ? `${(p * 100).toFixed(1)}%` : p >= 0.01 ? `${(p * 100).toFixed(2)}%` : `${(p * 100).toFixed(1)}%`);

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
/**
 * The throws of a bet / a redemption, on screen (awaitable: the auto-play waits for it, AutoHost.autoSettle). Never on top
 * of the table's own moment: it waits for the table's win word and coins to play out (`after`), then takes the play
 * area for itself — a dim over `area`, the stamp and the table's golden thing in its upper part, and the prize card
 * below them, never overlapping — and gives it back when the card flies off.
 */
export async function presentVitrina(
  ctx: CasinoCtx,
  items: Granted[],
  area: { x: number; y: number; w: number; h: number },
  speed = 1,
  o: { after?: number } = {},
): Promise<void> {
  if (!items.length) return;
  const sp = Math.max(1, speed);
  const t = items[0].vitrina;
  const golden = isVitrinaTable(t) ? VITRINA_TABLES[t].golden : '';
  const cx = area.x + area.w / 2;
  const cy = area.y + area.h / 2;
  if (speed >= INSTANT_SPEED) {
    ctx.refresh();
    return presentPrizes(ctx, items, { x: cx, y: cy }, { hold: 400, reveal: revealPlanFor(speed) });
  }
  // the table's own moment first (its word, its coins): then the showcase gets the stage
  await sleep((o.after ?? 1150) / sp);
  ctx.refresh();
  const dim = new Graphics().rect(area.x, area.y, area.w, area.h).fill({ color: C.ink, alpha: 0.62 });
  dim.alpha = 0;
  ctx.fx.addChild(dim);
  gsap.to(dim, { alpha: 1, duration: 0.2 / sp });
  csfx.winBig();
  if (!settings.reduceMotion) ctx.shake(0.2);
  ctx.marquee.burst(1600 / sp, 'rainbow');
  const top = area.y + Math.min(110, area.h * 0.16);
  const s1 = stamp(ctx.fx, cx, top, '¡SE ABRIÓ LA VITRINA!', CP.yellow, 64, -0.05);
  const s2 = stamp(ctx.fx, cx, top + 62, golden, CP.paper, 30, -0.02);
  ctx.say('winBig', speed > 1 ? 0.4 : 1);
  ctx.chat('jackpot', 2);
  await sleep(700 / sp);
  // the card under the stamp (presentPrizes draws it 250 tall, centred 40 px above `from`)
  const cardY = Math.max(top + 62 + 30 + 125 + 40, cy + 40);
  await presentPrizes(ctx, items, { x: cx, y: cardY }, { hold: 1300 / sp, reveal: revealPlanFor(speed) });
  gsap.to([dim, s1, s2], { alpha: 0, duration: 0.25 / sp, onComplete: () => [dim, s1, s2].forEach((x) => !x.destroyed && x.destroy()) });
}

const artReady = new Set<string>();
/** a showcase's paintings loaded (once per session); resolves true when it just loaded them (redraw then) */
export async function ensureVitrinaArt(t: VitrinaTable): Promise<boolean> {
  if (artReady.has(t)) return false;
  await ensureCats(vitrinaPool(t).map((c) => c.id));
  artReady.add(t);
  return true;
}

/** the badge on the table (its star, the Momento's chance); null when the showcase is empty */
export function vitrinaBadge(t: VitrinaTable, onTap: () => void): Container | null {
  const o = vitrinaOdds(t);
  if (!o) return null;
  const star = o.cats.find((c) => c.star) ?? o.cats[o.cats.length - 1];
  const c = new Container();
  const w = 280;
  const h = 56;
  c.addChild(new Graphics().rect(5, 5, w, h).fill(CP.ink).rect(0, 0, w, h).fill(0x2a1438).stroke({ width: 3, color: CP.yellow, alignment: 1 }));
  const por = catPortrait(star.id, 46, { ring: CP.yellow, grayscale: !star.owned });
  por.position.set(30, h / 2);
  const t1 = txt('VITRINA', { fontFamily: F.poster, fontSize: 22, fill: CP.yellow });
  t1.position.set(62, 3);
  const owned = o.cats.filter((k) => k.owned).length;
  const t2 = T(`${pct(o.chance)} POR APUESTA · ${owned}/${o.cats.length} ›`, 13, CP.paper);
  t2.position.set(62, 33);
  c.addChild(por, t1, t2);
  if (o.sparkReady || o.counters.sellos >= o.counters.sellosNeed) {
    const dot = new Graphics().circle(w - 12, 12, 9).fill(CP.pink).stroke({ width: 2, color: CP.ink });
    c.addChild(dot);
    gsap.to(dot.scale, { x: 1.3, y: 1.3, duration: 0.5, yoyo: true, repeat: -1 });
  }
  clickable(c, onTap);
  return c;
}

/**
 * The VITRINA tab into `root` (w × h). `onGranted` presents a throw / a spark pick (the table's own presentation);
 * `redraw` repaints after one (the counters moved).
 */
export function drawVitrina(root: Container, t: VitrinaTable, w: number, onGranted: (g: Granted) => void, redraw: () => void): number {
  const o = vitrinaOdds(t);
  if (!o) {
    const n = T('Esta mesa todavía no tiene vitrina.', 20, C.inkBlue);
    root.addChild(n);
    return n.height;
  }
  // its paintings (once): drawn again when they land
  void ensureVitrinaArt(t).then((did) => did && !root.destroyed && redraw());
  let y = 0;
  const head = txt(`VITRINA · ${o.name}`, { fontFamily: F.poster, fontSize: 30, fill: C.ink });
  root.addChild(head);
  y += 42;
  const k = o.counters;
  const lines = [
    `MOMENTO VITRINA: cada apuesta de ${o.minChips} fichas o más (o en oro, de ¼ del tope de esta mesa o más) tiene ${pct(o.chance)} de abrirla. Se tira aparte, ganes o pierdas: la tabla de pagos de la mesa no cambia. No corre en el MODO ETERNO.`,
    `GARANTÍAS: un gato a más tardar en ${k.catLeft} ${k.catLeft === 1 ? 'tiro' : 'tiros'} · un Multidimensional a más tardar en ${k.mdLeft} · CHISPA: ${Math.min(k.spark, k.sparkNeed)}/${k.sparkNeed} tiros (a los ${k.sparkNeed} eliges el gato que quieras de esta vitrina).`,
    `SELLOS: ${k.sellos}. LA CASA TE DEBE te da 1 cada vez que paga; con ${k.sellosNeed} tienes un tiro en la vitrina que elijas. Solo salen gatos que NO tienes; con la vitrina completa, el consuelo paga orbes ×3.`,
  ];
  for (const l of lines) {
    const tt = T('·  ' + l, 15, C.ink, { wordWrap: true, wordWrapWidth: w, lineHeight: 20 });
    tt.position.set(0, y);
    root.addChild(tt);
    y += tt.height + 4;
  }
  y += 8;
  // the throw's table, as it stands NOW (guarantees and «never a repeat» included)
  const now = vitrinaThrowOdds(t);
  const cols: [string, number, number][] = [
    ['CONSUELO (orbes de uno que tengas · 40 fichas si no tienes ninguno)', o.roll.consolation, now.consolation],
    ['SU LEGENDARIO', o.roll.legendary, now.legendary],
    ['UNO DE SUS MÍTICOS', o.roll.mythic, now.mythic],
    ['UNO DE SUS MULTIDIMENSIONALES', o.roll.multidimensional, now.multidimensional],
  ];
  const hx = [0, 820, 1010];
  ['TIRO DE VITRINA', 'TABLA', 'TU PRÓXIMO TIRO'].forEach((s, i) => {
    const h = T(s, 14, C.pinkHot, { letterSpacing: 2 });
    h.position.set(hx[i], y);
    root.addChild(h);
  });
  y += 22;
  cols.forEach(([name, p, n], i) => {
    root.addChild(new Graphics().rect(-6, y - 2, w + 12, 28).fill(i % 2 ? C.paper : 0xe6dccb));
    const a = T(name, 15);
    a.position.set(0, y + 2);
    const b = T(pct(p), 15);
    b.position.set(hx[1], y + 2);
    const c2 = T(pct(n), 15, C.pinkHot);
    c2.position.set(hx[2], y + 2);
    root.addChild(a, b, c2);
    y += 28;
  });
  y += 12;
  // its 8 cats
  const per = 4;
  const cw = Math.floor((w - (per - 1) * 12) / per);
  o.cats.forEach((cat, i) => {
    const x = (i % per) * (cw + 12);
    const yy = y + Math.floor(i / per) * 92;
    const card = new Container();
    const rr = RARITY[cat.rarity as Rarity];
    card.addChild(new Graphics().rect(0, 0, cw, 82).fill(cat.owned ? 0xe9f6e2 : C.paper).stroke({ width: 3, color: cat.star ? CP.yellow : C.ink, alignment: 1 }));
    const por = catPortrait(cat.id, 64, { ring: rr?.color ?? C.ink });
    por.position.set(42, 41);
    const nm = txt(`${cat.owned ? '✓ ' : ''}${cat.name}${cat.star ? ' ★' : ''}`, { fontFamily: F.poster, fontSize: 19, fill: C.ink });
    nm.position.set(82, 8);
    if (nm.width > cw - 90) nm.scale.set((cw - 90) / nm.width);
    const meta = T(`${rr?.name ?? cat.rarity.toUpperCase()} · PESO ${cat.weight}`, 13, rr?.color ?? C.ink);
    meta.position.set(82, 38);
    card.addChild(por, nm, meta);
    if (o.sparkReady && !cat.owned) {
      const pick = new CButton('ELEGIR', () => {
        const g = vitrinaSparkPick(t, cat.id);
        if (!g) return sfx('error');
        redraw();
        onGranted(g);
      }, { w: 92, h: 26, size: 16, color: CP.yellow });
      pick.position.set(cw - 100, 50);
      card.addChild(pick);
    }
    card.position.set(x, yy);
    root.addChild(card);
  });
  y += Math.ceil(o.cats.length / per) * 92 + 6;
  if (o.sparkReady) {
    const sp = txt('¡CHISPA LISTA! ELIGE UN GATO QUE TE FALTE.', { fontFamily: F.poster, fontSize: 24, fill: CP.pink });
    sp.position.set(0, y);
    root.addChild(sp);
  }
  const redeem = new CButton(`CANJEAR ${k.sellosNeed} SELLOS: UN TIRO AQUÍ`, () => {
    const g = vitrinaRedeemSellos(t);
    if (!g) return sfx('error');
    redraw();
    onGranted(g);
  }, { w: 420, h: 48, size: 20, color: k.sellos >= k.sellosNeed ? CP.yellow : CP.paperDark, sub: undefined });
  redeem.disabled = k.sellos < k.sellosNeed;
  redeem.position.set(w - 430, y - 6);
  root.addChild(redeem);
  return y + 48;
}

/**
 * The VITRINA tab of a table's odds window: a button in the title band switches the body (`pay` = what the window shows
 * today) for the showcase. Nothing when the showcase is empty.
 */
export function addVitrinaTab(m: Modal, pay: Container, t: VitrinaTable, onGranted: (g: Granted) => void) {
  if (!vitrinaOdds(t)) return;
  const vc = new Container();
  vc.visible = false;
  m.body.addChild(vc);
  const drawV = () => {
    for (const ch of vc.removeChildren()) ch.destroy({ children: true });
    drawVitrina(vc, t, m.w - 60, onGranted, drawV);
  };
  const tab = new CButton('VITRINA', () => {
    const on = !vc.visible;
    if (on) drawV();
    vc.visible = on;
    pay.visible = !on;
    tab.setText(on ? 'TABLA DE PAGOS' : 'VITRINA');
  }, { w: 250, h: 52, size: 24, color: CP.yellow });
  tab.position.set(m.w - 340, 16);
  m.panel.addChild(tab);
}

/** the VITRINA in its own window */
export function openVitrina(t: VitrinaTable, onGranted: (g: Granted) => void) {
  const m = new Modal('Vitrina', 1500, 900, { subtitle: 'TODO A LA VISTA · DESPUÉS DE LA PARTE III' });
  const draw = () => {
    for (const ch of m.body.removeChildren()) ch.destroy({ children: true });
    drawVitrina(m.body, t, 1440, (g) => {
      m.close();
      onGranted(g);
    }, draw);
  };
  draw();
  m.open();
  return m;
}
