/** "PROBABILIDADES" — every number on the table, before you bet (GDD 2.13 ethics). */
import { Container, Graphics } from 'pixi.js';
import { Modal } from '../../ui/modal';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { fmt } from '../../core/format';
import {
  CHIP_LINE_PRIZE,
  CHIPS,
  Cur,
  LINES,
  PAY2_NEKO,
  PAY3,
  SLOT,
  STRIPS,
  STRIP_LEN,
  SYMS,
  SYM_COUNT,
  SYM_NAME,
  isCasinoHidden,
  setCasinoHidden,
} from '../../state/sys/casino';
import { banner, ratesTable, TIER_NAME, pityLeft } from '../../state/sys/gacha';
import { CP, clickable, symbolSprite } from './kit';
import { TIER_COL } from './prizes';

const T = (s: string, size = 20, fill: number = C.ink, extra: Record<string, unknown> = {}) => txt(s, { fontFamily: F.ui, fontWeight: '700', fontSize: size, fill, ...extra });
const P = (s: string, size = 30, fill: number = C.ink) => txt(s, { fontFamily: F.poster, fontSize: size, fill });
const pct = (p: number) => (p >= 0.1 ? `${(p * 100).toFixed(1)}%` : p >= 0.01 ? `${(p * 100).toFixed(2)}%` : `${(p * 100).toFixed(3)}%`);

export function openOdds(kind: 'slot' | 'roulette' | 'gacha' | 'rules', cur: Cur = 'gold', stake = 0, bannerId?: string) {
  const title = kind === 'slot' ? 'Tabla de pagos' : kind === 'roulette' ? 'Ruleta: probabilidades' : kind === 'gacha' ? 'Probabilidades del portal' : 'Reglas de la casa';
  const m = new Modal(title, 1500, 900, { subtitle: 'TODO A LA VISTA · SIN LETRA CHIQUITA' });
  const b = m.body;
  if (kind === 'slot') slotOdds(b, cur, stake);
  else if (kind === 'roulette') rouletteOdds(b);
  else if (kind === 'gacha') gachaOdds(b, bannerId);
  else rules(b);
  hideToggle(b, m.innerH - 40);
  m.open();
  return m;
}

function slotOdds(b: Container, cur: Cur, stake: number) {
  const lineBet = stake / LINES.length;
  const head = ['', 'SÍMBOLO', 'EN CADA RODILLO', '3 EN UNA LÍNEA', cur === 'gold' ? 'PAGA (POR LÍNEA)' : 'PREMIO CON FICHAS'];
  const xs = [0, 70, 330, 560, 790];
  head.forEach((h, i) => {
    const t = T(h, 16, C.pinkHot, { letterSpacing: 2 });
    t.position.set(xs[i], 0);
    b.addChild(t);
  });
  const rows = [...SYMS.map((s) => ({ s, p: Math.pow(SYM_COUNT[s] / STRIP_LEN, 3), name: SYM_NAME[s], key: s as string })), { s: 'neko' as const, p: Math.pow(2 / 24, 2) * (22 / 24), name: '2 GATO NEGRO (rodillos 1–2)', key: 'neko2' }];
  rows.forEach((r, i) => {
    const y = 30 + i * 52;
    const bg = new Graphics().rect(-8, y - 4, 1110, 48).fill(i % 2 ? C.paper : 0xe6dccb);
    b.addChild(bg);
    const sp = symbolSprite(r.s, 44);
    sp.position.set(28, y + 20);
    b.addChild(sp);

    const name = P(r.name, 24);
    name.position.set(xs[1], y + 4);
    const count = T(r.key === 'neko2' ? '—' : `${SYM_COUNT[r.s]} de ${STRIP_LEN}`, 20);
    count.position.set(xs[2], y + 10);
    const prob = T(`1 en ${Math.round(1 / r.p).toLocaleString('en-US')} (${pct(r.p)})`, 20);
    prob.position.set(xs[3], y + 10);
    const mult = r.key === 'neko2' ? PAY2_NEKO : PAY3[r.s];
    const payTxt = cur === 'gold' ? `x${mult}${lineBet ? `  =  ${fmt(Math.round(mult * lineBet))} oro` : ''}` : CHIP_LINE_PRIZE[r.key as keyof typeof CHIP_LINE_PRIZE].text;
    const pay = T(payTxt, 20, cur === 'gold' ? C.ink : C.inkBlue);
    pay.position.set(xs[4], y + 10);
    b.addChild(name, count, prob, pay);
  });
  const notes = [
    `5 líneas (horizontal ×3 + 2 diagonales). La apuesta se reparte entre las 5. El COMODÍN cuenta como cualquier símbolo menos el GATO NEGRO.`,
    `Retorno medio con oro: ${(SLOT.rtp * 100).toFixed(1)}% (por cada 100 apostados vuelven ${(SLOT.rtp * 100).toFixed(1)} en promedio). La casa gana un poquito: así debe ser.`,
    `Hay premio en ${(SLOT.hit * 100).toFixed(0)}% de las tiradas; en ${(SLOT.win * 100).toFixed(0)}% ganas más de lo que apostaste. Lo demás se muestra como "RECUPERAS".`,
    `Cada rodillo para en una de sus ${STRIP_LEN} posiciones con la misma probabilidad. Lo que ves arriba y abajo de la línea es la tira real: cero casi-aciertos fabricados.`,
    `Apuesta máx. con oro = el menor de: 3 min de producción, 25% de tu cartera, 10 min de producción ÷ premio máx. (x${SLOT.maxM.toFixed(1)}). Así ningún premio pasa de 10 min de producción.`,
  ];
  let y = 30 + rows.length * 52 + 10;
  for (const n of notes) {
    const t = T('·  ' + n, 16, C.ink, { wordWrap: true, wordWrapWidth: 1100, lineHeight: 22 });
    t.position.set(0, y);
    b.addChild(t);
    y += t.height + 3;
  }
  // honest strips
  const sx = 1150;
  const lab = T('TIRAS REALES', 16, C.pinkHot, { letterSpacing: 2 });
  lab.position.set(sx, 0);
  b.addChild(lab);
  STRIPS.forEach((strip, ri) => {
    strip.forEach((s, i) => {
      const sp = symbolSprite(s, 26);
      sp.position.set(sx + 20 + ri * 92 + (i % 2) * 40, 40 + Math.floor(i / 2) * 29);
      b.addChild(sp);
    });
    const n = P(`R${ri + 1}`, 22, C.ink);
    n.position.set(sx + 22 + ri * 92, 40 + 12 * 29);
    b.addChild(n);
  });
}

function rouletteOdds(b: Container) {
  const rows: [string, string, string, string][] = [
    ['ROJO o NEGRO', '12 de 25', 'x2', '96%'],
    ['TERCIO (1–8 · 9–16 · 17–24)', '8 de 25', 'x3', '96%'],
    ['UN NÚMERO (0 a 24)', '1 de 25', 'x24', '96%'],
  ];
  const xs = [0, 520, 760, 940];
  ['APUESTA', 'PROBABILIDAD', 'PAGA', 'RETORNO'].forEach((h, i) => {
    const t = T(h, 16, C.pinkHot, { letterSpacing: 2 });
    t.position.set(xs[i], 0);
    b.addChild(t);
  });
  rows.forEach((r, i) => {
    const y = 40 + i * 70;
    b.addChild(new Graphics().rect(-8, y - 8, 1150, 62).fill(i % 2 ? C.paper : 0xe6dccb));
    r.forEach((c, j) => {
      const t = j === 0 ? P(c, 30) : T(c, 24);
      t.position.set(xs[j], y + (j === 0 ? 2 : 10));
      b.addChild(t);
    });
  });
  const notes = [
    '25 casillas: 12 rojas, 12 negras y el 0 verde (GATO NEGRO). La bolita cae en cualquiera con la misma probabilidad (1 en 25).',
    'Pagos: devuelve tu apuesta multiplicada (x2 = recuperas la apuesta + la misma cantidad). Toda apuesta tiene retorno medio de 96%.',
    'Con oro, la apuesta máxima depende de la mesa: 3 min de producción, 25% de la cartera y nunca un premio mayor a 10 min de producción.',
    'Con fichas: 10 / 25 / 50. Con Ojos de Gato (mesa VIP): máximo 3 por apuesta, premio máximo 30, y una apuesta de gemas cada 2 niveles de Reino.',
  ];
  let y = 270;
  for (const n of notes) {
    const t = T('·  ' + n, 19, C.ink, { wordWrap: true, wordWrapWidth: 1300, lineHeight: 25 });
    t.position.set(0, y);
    b.addChild(t);
    y += t.height + 10;
  }
}

function gachaOdds(b: Container, id?: string) {
  const bn = banner(id);
  const head = P(`${bn.name} · ${bn.tagline}`, 30, C.ink);
  b.addChild(head);
  const pl = pityLeft(bn);
  const pity = T(
    `GARANTÍAS: ÉPICO o mejor cada ${bn.epicPity} tiros (te faltan ${pl.epic}) · LEGENDARIO o mejor a más tardar en ${bn.hardPity} tiros (te faltan ${pl.legendary}); desde el tiro ${bn.softPity + 1} la probabilidad de LEGENDARIO sube +${Math.round(bn.softStep * 100)}% por tiro.`,
    18,
    C.inkBlue,
    { wordWrap: true, wordWrapWidth: 1420, lineHeight: 23 },
  );
  pity.position.set(0, 44);
  b.addChild(pity);
  const table = ratesTable(bn);
  let x = 0;
  const colW = Math.floor(1440 / table.length);
  for (const tier of table) {
    const y0 = 110;
    const band = new Graphics().rect(x, y0, colW - 14, 54).fill(TIER_COL[tier.tier]).stroke({ width: 3, color: C.ink });
    const tn = P(`${TIER_NAME[tier.tier]}  ${pct(tier.p)}`, 28);
    tn.position.set(x + 12, y0 + 8);
    b.addChild(band, tn);
    tier.items.forEach((it, i) => {
      const y = y0 + 66 + i * 52;
      b.addChild(new Graphics().rect(x, y, colW - 14, 46).fill(i % 2 ? C.paper : 0xe6dccb));
      const nm = T(it.label, 17, C.ink, { wordWrap: true, wordWrapWidth: colW - 110 });
      nm.position.set(x + 10, y + 12);
      const pp = T(pct(it.p), 17, C.pinkHot);
      pp.anchor.set(1, 0);
      pp.position.set(x + colW - 24, y + 12);
      b.addChild(nm, pp);
    });
    x += colW;
  }
  const notes = [
    'Los gatos salen solo de elementos que ya descubriste; nunca secretos ni premios de Expediciones Heroicas. Los gatos de jefe aparecen después de vencer a ese jefe.',
    'Repetido = Orbes de Alma de esa especie (nunca pierdes). HOLO = variante foil exclusiva: +15% oro, +12% poder, +10% vida y brillo holográfico. Si ya tienes al gato, se vuelve HOLO.',
    'Se paga con Boletos (de La Caja y la Tragamichis) u Ojos de Gato (se ganan jugando). No existe dinero real en este juego.',
  ];
  let y = 520;
  for (const n of notes) {
    const t = T('·  ' + n, 18, C.ink, { wordWrap: true, wordWrapWidth: 1420, lineHeight: 23 });
    t.position.set(0, y);
    b.addChild(t);
    y += t.height + 8;
  }
}

function rules(b: Container) {
  const lines = [
    'Aquí solo se juega con lo que ganas jugando: oro, Ojos de Gato y Fichas. Nada se compra con dinero real.',
    `Las Fichas se ganan peleando: +${CHIPS.perVictory} por victoria, +${CHIPS.perPerfect} extra si es perfecta, +${CHIPS.perKl} por nivel de Reino y +${CHIPS.perBoss} por jefe (máx. ${CHIPS.cap}).`,
    'Con oro, la casa tiene una pequeña ventaja (retorno 95–96%). Los premios especiales (boletos, accesorios, gatos) salen apostando Fichas o en el Portal.',
    'No hay tirada automática ni temporizadores para que vuelvas. Si no te late, puedes ocultar el casino (abajo) o desde Ajustes.',
    'Cada tirada es independiente: perder varias seguidas no hace más probable ganar la siguiente.',
  ];
  let y = 0;
  for (const n of lines) {
    const t = T('·  ' + n, 22, C.ink, { wordWrap: true, wordWrapWidth: 1400, lineHeight: 29 });
    t.position.set(0, y);
    b.addChild(t);
    y += t.height + 14;
  }
}

function hideToggle(b: Container, y: number) {
  const c = new Container();
  c.position.set(0, y);
  const box = new Graphics();
  const t = T('', 20, C.ink);
  t.position.set(44, 4);
  const draw = () => {
    const on = isCasinoHidden();
    box.clear().rect(0, 0, 32, 32).fill(on ? CP.pink : C.paper).stroke({ width: 3, color: C.ink });
    if (on) box.moveTo(7, 16).lineTo(14, 24).lineTo(26, 8).stroke({ width: 4, color: C.ink, cap: 'round', join: 'round' });
    t.text = on ? 'Casino OCULTO del menú de la isla (puedes volver a mostrarlo aquí o en Ajustes)' : 'Ocultar el casino del menú de la isla';
  };
  draw();
  c.addChild(box, t);
  clickable(c, () => {
    setCasinoHidden(!isCasinoHidden());
    draw();
  });
  b.addChild(c);
}
