/** TABLA DE PAGOS for the newer tables: every outcome, its exact chance and what it pays, before you bet. */
import { Container, Graphics } from 'pixi.js';
import { Modal } from '../../../ui/modal';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';

export interface OddsSpec {
  title: string;
  subtitle?: string;
  /** column titles + x positions */
  cols: { t: string; x: number }[];
  rows: string[][];
  /** highlighted summary lines (RTP etc.) */
  summary: string[];
  notes: string[];
}

export const pct = (p: number) => (p <= 0 ? '0%' : p >= 0.1 ? `${(p * 100).toFixed(1)}%` : p >= 0.01 ? `${(p * 100).toFixed(2)}%` : p >= 0.0001 ? `${(p * 100).toFixed(3)}%` : `${(p * 100).toFixed(5)}%`);
export const oneIn = (p: number) => (p > 0 ? `1 en ${p >= 0.5 ? (1 / p).toFixed(1) : Math.round(1 / p).toLocaleString('en-US')}` : '—');

export function openMiniOdds(spec: OddsSpec) {
  const m = new Modal(spec.title, 1500, 900, { subtitle: spec.subtitle ?? 'TODO A LA VISTA · SIN LETRA CHIQUITA' });
  const b = m.body;
  const T = (s: string, size = 20, fill: number = C.ink, extra: Record<string, unknown> = {}) => txt(s, { fontFamily: F.ui, fontWeight: '700', fontSize: size, fill, ...extra });
  const head = new Container();
  spec.cols.forEach((c) => {
    const t = T(c.t, 15, C.pinkHot, { letterSpacing: 2 });
    t.position.set(c.x, 0);
    head.addChild(t);
  });
  b.addChild(head);
  const rowH = spec.rows.length > 12 ? 34 : 42;
  spec.rows.forEach((r, i) => {
    const y = 26 + i * rowH;
    b.addChild(new Graphics().rect(-8, y - 4, 1450, rowH - 4).fill(i % 2 ? C.paper : 0xe6dccb));
    r.forEach((cell, j) => {
      const t = j === 0 ? txt(cell, { fontFamily: F.poster, fontSize: rowH > 36 ? 24 : 21, fill: C.ink }) : T(cell, rowH > 36 ? 20 : 18);
      t.position.set(spec.cols[j]?.x ?? 0, y + (j === 0 ? 0 : 4));
      b.addChild(t);
    });
  });
  let y = 26 + spec.rows.length * rowH + 14;
  for (const s of spec.summary) {
    const t = txt(s, { fontFamily: F.poster, fontSize: 28, fill: C.pinkHot });
    t.position.set(0, y);
    b.addChild(t);
    y += 36;
  }
  y += 6;
  for (const n of spec.notes) {
    const t = T('·  ' + n, 17, C.inkBlue, { wordWrap: true, wordWrapWidth: 1430, lineHeight: 23 });
    t.position.set(0, y);
    b.addChild(t);
    y += t.height + 6;
  }
  m.open();
  return m;
}
