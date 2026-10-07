/**
 * "PROBABILIDADES" — every number on the table, before you bet. Showing the real odds IS the feature:
 * the house wins on average, and every candy rule (ramps, escapes, hot windows, LA CASA TE DEBE) is printed here.
 */
import { Container, Graphics } from 'pixi.js';
import { Modal } from '../../ui/modal';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import {
  CANDY,
  CHIP_LINE_PRIZE,
  CHIPS,
  Cur,
  PAYTABLES,
  ROULETTE_CHIP_STAKES,
  SLOT_MATH,
  SLOT_TIER_BLURB,
  SLOT_TIER_NAME,
  STRIPS,
  STRIP_LEN,
  SYMS,
  SYM_COUNT,
  SYM_NAME,
  SlotTier,
  UNOWNED_WEIGHT,
  owed,
} from '../../state/sys/casino';
import { BEGINNER, ESCAPE, GachaMode, HOT, LUMEN_SHARE, MODES, banner, expectedPulls, modeOdds, modesFor, pityCaps, pityLeft, rampTable, ratesTable, TIER_NAME } from '../../state/sys/gacha';
import { CP, Seg, symbolSprite } from './kit';
import { TIER_COL } from './prizes';

const T = (s: string, size = 20, fill: number = C.ink, extra: Record<string, unknown> = {}) => txt(s, { fontFamily: F.ui, fontWeight: '700', fontSize: size, fill, ...extra });
const P = (s: string, size = 30, fill: number = C.ink) => txt(s, { fontFamily: F.poster, fontSize: size, fill });
const pct = (p: number) => (p >= 0.1 ? `${(p * 100).toFixed(1)}%` : p >= 0.01 ? `${(p * 100).toFixed(2)}%` : `${(p * 100).toFixed(3)}%`);
const clear = (c: Container) => c.removeChildren().forEach((x) => x.destroy({ children: true }));

export function openOdds(kind: 'slot' | 'roulette' | 'gacha' | 'rules', cur: Cur = 'gold', _stake = 0, bannerId?: string, sub: SlotTier | GachaMode = 0 as SlotTier) {
  const title = kind === 'slot' ? 'Tabla de pagos' : kind === 'roulette' ? 'Ruleta: probabilidades' : kind === 'gacha' ? 'Probabilidades del portal' : 'Reglas de la casa';
  const m = new Modal(title, 1500, 900, { subtitle: 'TODO A LA VISTA · SIN LETRA CHIQUITA' });
  const b = m.body;
  if (kind === 'slot') slotOdds(b, cur, typeof sub === 'number' ? sub : 0);
  else if (kind === 'roulette') rouletteOdds(b);
  else if (kind === 'gacha') gachaOdds(b, bannerId, typeof sub === 'string' ? sub : 'normal');
  else rules(b);
  m.open();
  return m;
}

// ------------------------------------------------------------------ slot
function slotOdds(root: Container, cur: Cur, tier0: SlotTier) {
  const b = new Container();
  root.addChild(b);
  const tabs = new Seg<number>(
    SLOT_TIER_NAME.map((n, i) => ({ v: i, label: `RIESGO ${n}` })),
    tier0,
    (v) => draw(v as SlotTier),
    { w: 190, h: 40, size: 20, color: CP.pink, gap: 8 },
  );
  tabs.position.set(0, 4);
  root.addChild(tabs);
  b.position.set(0, 60);
  const draw = (tier: SlotTier) => {
    clear(b);
    const pt = PAYTABLES[tier];
    const mth = SLOT_MATH[tier];
    const head = ['', 'SÍMBOLO', 'EN CADA RODILLO', '3 EN UNA LÍNEA', cur === 'gold' ? 'PAGA (x APUESTA POR LÍNEA)' : 'PREMIO CON FICHAS'];
    const xs = [0, 70, 330, 560, 790];
    head.forEach((h, i) => {
      const t = T(h, 15, C.pinkHot, { letterSpacing: 2 });
      t.position.set(xs[i], 0);
      b.addChild(t);
    });
    const rows = [...SYMS.map((s) => ({ s, p: Math.pow(SYM_COUNT[s] / STRIP_LEN, 3), name: SYM_NAME[s], key: s as string })), { s: 'neko' as const, p: Math.pow(2 / 24, 2) * (22 / 24), name: '2 GATO NEGRO (rodillos 1–2)', key: 'neko2' }];
    rows.forEach((r, i) => {
      const y = 26 + i * 46;
      b.addChild(new Graphics().rect(-8, y - 4, 1110, 42).fill(i % 2 ? C.paper : 0xe6dccb));
      const sp = symbolSprite(r.s, 38);
      sp.position.set(28, y + 17);
      b.addChild(sp);
      const name = P(r.name, 22);
      name.position.set(xs[1], y + 2);
      const count = T(r.key === 'neko2' ? '—' : `${SYM_COUNT[r.s]} de ${STRIP_LEN}`, 18);
      count.position.set(xs[2], y + 8);
      const prob = T(`1 en ${Math.round(1 / r.p).toLocaleString('en-US')} (${pct(r.p)})`, 18);
      prob.position.set(xs[3], y + 8);
      const mult = r.key === 'neko2' ? pt.neko2 : pt.pay3[r.s];
      const payTxt = cur === 'gold' ? (mult ? `x${mult}` : 'NO PAGA') : CHIP_LINE_PRIZE[tier][r.key as keyof (typeof CHIP_LINE_PRIZE)[0]].text;
      const pay = T(payTxt, 18, mult ? (cur === 'gold' ? C.ink : C.inkBlue) : C.pinkHot);
      pay.position.set(xs[4], y + 8);
      b.addChild(name, count, prob, pay);
    });
    // the three tiers side by side
    let y = 26 + rows.length * 46 + 8;
    SLOT_MATH.forEach((m, i) => {
      const on = i === tier;
      const t = T(
        `${on ? '>' : ' '} RIESGO ${SLOT_TIER_NAME[i]}: premio en ${(m.hit * 100).toFixed(0)}% de las tiradas · ganas más de lo apostado en ${(m.win * 100).toFixed(0)}% · retorno con oro ${(m.rtp * 100).toFixed(1)}% · premio máx. x${m.maxM.toFixed(1)} — ${SLOT_TIER_BLURB[i]}`,
        16,
        on ? C.pinkHot : C.ink,
      );
      t.position.set(0, y);
      b.addChild(t);
      y += 24;
    });
    const notes = [
      `5 líneas (horizontal ×3 + 2 diagonales). La apuesta se reparte entre las 5. El COMODÍN cuenta como cualquier símbolo menos el GATO NEGRO.`,
      `Más riesgo = la misma tira, pero menos símbolos pagan y los que pagan, pagan más. Con fichas: BAJA cuesta 10, MEDIA 30, ALTA 100.`,
      `La casa siempre gana (retorno < 100%). LA CASA TE DEBE: cada apuesta perdida llena un medidor; a las ${CANDY.every} te regalamos ${CANDY.tickets} boleto y ${CANDY.chips} fichas (llevas ${owed()}/${CANDY.every}).`,
      `Cada rodillo para en una de sus ${STRIP_LEN} posiciones con la misma probabilidad. Lo que ves arriba y abajo de la línea es la tira real.`,
    ];
    y += 6;
    for (const n of notes) {
      const t = T('·  ' + n, 15, C.ink, { wordWrap: true, wordWrapWidth: 1110, lineHeight: 20 });
      t.position.set(0, y);
      b.addChild(t);
      y += t.height + 2;
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
  };
  draw(tier0);
}

// ------------------------------------------------------------------ roulette
function rouletteOdds(b: Container) {
  const rows: [string, string, string, string][] = [
    ['ROJO o NEGRO', '12 de 25', 'x2', '96%'],
    ['TERCIO (1–8 · 9–16 · 17–24)', '8 de 25', 'x3', '96%'],
    ['UN NÚMERO (0 a 24)', '1 de 25', 'x24 (+ BONO PLENO con fichas)', '96%'],
  ];
  const xs = [0, 520, 740, 1200];
  ['APUESTA', 'PROBABILIDAD', 'PAGA', 'RETORNO'].forEach((h, i) => {
    const t = T(h, 16, C.pinkHot, { letterSpacing: 2 });
    t.position.set(xs[i], 0);
    b.addChild(t);
  });
  rows.forEach((r, i) => {
    const y = 40 + i * 70;
    b.addChild(new Graphics().rect(-8, y - 8, 1420, 62).fill(i % 2 ? C.paper : 0xe6dccb));
    r.forEach((c, j) => {
      const t = j === 0 ? P(c, 30) : T(c, 24);
      t.position.set(xs[j], y + (j === 0 ? 2 : 10));
      b.addChild(t);
    });
  });
  const notes = [
    '25 casillas: 12 rojas, 12 negras y el 0 verde (GATO NEGRO). La bolita cae en cualquiera con la misma probabilidad (1 en 25).',
    'El riesgo lo eliges tú: color = casi la mitad de las veces x2; número = 1 de 25 pero x24. Más riesgo, premio más gordo.',
    `BONO PLENO: si le atinas a un NÚMERO apostando fichas, además te llevas 1 boleto por cada 25 fichas apostadas (redondeado hacia arriba). Fichas: ${ROULETTE_CHIP_STAKES.join(' / ')}.`,
    `LA CASA TE DEBE: cada apuesta perdida llena el medidor; a las ${CANDY.every} te regalamos ${CANDY.tickets} boleto y ${CANDY.chips} fichas. Llevas ${owed()}/${CANDY.every}.`,
    'Con oro, la apuesta máxima depende de tu producción: nunca un premio mayor a 10 min de producción. Con Ojos de Gato (mesa VIP): máximo 3 por apuesta y una apuesta cada 2 niveles de Reino.',
    'Tu apuesta se queda como la dejaste: cambiar de rojo a negro, de color a número o de moneda NO la regresa al mínimo.',
  ];
  let y = 270;
  for (const n of notes) {
    const t = T('·  ' + n, 19, C.ink, { wordWrap: true, wordWrapWidth: 1400, lineHeight: 25 });
    t.position.set(0, y);
    b.addChild(t);
    y += t.height + 10;
  }
}

// ------------------------------------------------------------------ gacha
function gachaOdds(root: Container, id: string | undefined, mode0: GachaMode) {
  const bn = banner(id);
  const head = P(`${bn.name}`, 32, C.ink);
  root.addChild(head);
  const tag = T(bn.tagline, 17, C.inkBlue, { wordWrap: true, wordWrapWidth: 900 });
  tag.position.set(head.width + 20, 8);
  root.addChild(tag);
  const b = new Container();
  b.position.set(0, 50);
  root.addChild(b);
  const modes = modesFor(bn);
  const draw = (mode: GachaMode) => {
    clear(b);
    let y0 = 0;
    if (modes.length > 1) {
      const seg = new Seg<GachaMode>(
        modes.map((m) => ({ v: m, label: `${MODES[m].name} · ${MODES[m].cost}` })),
        mode,
        (v) => draw(v),
        { w: 250, h: 40, size: 20, color: mode === 'todo' ? CP.red : mode === 'riesgo' ? CP.pink : CP.yellow, gap: 8 },
      );
      b.addChild(seg);
      const bl = T(MODES[mode].blurb, 16, C.ink);
      bl.position.set(modes.length * 258 + 6, 10);
      b.addChild(bl);
      y0 = 54;
    }
    // what the NEXT pull looks like right now (ramps, hot window, guarantees)
    const now = modeOdds(bn, mode);
    const pl = pityLeft(bn);
    const caps = pityCaps(bn);
    const lp = now.legendary + now.holo + now.mythic;
    const st = T(
      `AHORITA: legendario o mejor ${pct(lp)} en tu próximo tiro · garantía en ${pl.legendary} ${pl.legendary === 1 ? 'tiro' : 'tiros'}` +
        (pl.hot ? ` · RACHA CALIENTE: ${pl.hot} tiros` : '') +
        (caps.beginner ? ' · SUERTE DE PRINCIPIANTE activa' : '') +
        (bn.mythicPity ? ` · MÍTICO garantizado en ${pl.mythic}` : ''),
      17,
      C.pinkHot,
      { wordWrap: true, wordWrapWidth: 1420 },
    );
    st.position.set(0, y0);
    b.addChild(st);
    y0 += 34;
    const table = ratesTable(bn, mode);
    let x = 0;
    const colW = Math.floor(1440 / Math.max(4, table.length));
    for (const tier of table) {
      const band = new Graphics().rect(x, y0, colW - 12, 44).fill(TIER_COL[tier.tier]).stroke({ width: 3, color: C.ink });
      const tn = P(`${TIER_NAME[tier.tier]} ${pct(tier.p)}`, 22);
      tn.position.set(x + 10, y0 + 8);
      b.addChild(band, tn);
      tier.items.forEach((it, i) => {
        const y = y0 + 52 + i * 44;
        b.addChild(new Graphics().rect(x, y, colW - 12, 40).fill(i % 2 ? C.paper : 0xe6dccb));
        const nm = T(it.label, 14, C.ink, { wordWrap: true, wordWrapWidth: colW - 90, lineHeight: 16 });
        nm.position.set(x + 8, y + (nm.height > 20 ? 4 : 11));
        const pp = T(pct(it.p), 14, C.pinkHot);
        pp.anchor.set(1, 0);
        pp.position.set(x + colW - 20, y + 11);
        b.addChild(nm, pp);
      });
      x += colW;
    }
    // the ramp (soft pity → hard pity), drawn as bars: honest "it gets likelier the longer you go"
    const ry = y0 + 52 + 6 * 44 + 14;
    const ramp = rampTable(bn);
    const cw = Math.min(22, Math.floor(820 / ramp.length));
    const rh = 110;
    const rt = T(`RAMPA DE LEGENDARIO+ (normal): tiro a tiro desde tu último legendario · en promedio sale cada ${expectedPulls(bn).toFixed(1)} tiros`, 15, C.ink);
    rt.position.set(0, ry);
    b.addChild(rt);
    const g = new Graphics();
    ramp.forEach((r, i) => {
      const h = Math.max(2, r.p * rh);
      const col = r.p >= 1 ? CP.red : r.pull > caps.soft ? CP.yellow : 0x9a8f7c;
      g.rect(i * cw, ry + 26 + rh - h, cw - 3, h).fill(col);
    });
    g.rect(0, ry + 26 + rh, ramp.length * cw, 2).fill(C.ink);
    b.addChild(g);
    const r1 = T(`1`, 13, C.ink);
    r1.position.set(0, ry + rh + 30);
    const r2 = T(`${caps.soft + 1}: empieza a subir +${Math.round(bn.softStep * 100)}% por tiro`, 13, C.ink);
    r2.position.set(caps.soft * cw, ry + rh + 30);
    const r3 = T(`${caps.hard}: 100%`, 13, C.pinkHot);
    r3.anchor.set(1, 0);
    r3.position.set(ramp.length * cw, ry + rh + 46);
    b.addChild(r1, r2, r3);
    // candy rules (right of the ramp)
    const candy = bn.hasCats
      ? [
          `SUERTE DE PRINCIPIANTE: hasta tu primer legendario del portal, la rampa empieza en el tiro ${BEGINNER.softPity + 1} y es seguro en el ${BEGINNER.hardPity}.`,
          `¡SE ESCAPÓ!: ${Math.round(ESCAPE.p * 100)}% por tiro normal sin legendario (descansa ${ESCAPE.cooldown} tiros). Deja RASTRO: +${ESCAPE.trail} al contador y RACHA CALIENTE de ${ESCAPE.hot} tiros con legendario x${HOT.legend} y épico x${HOT.epic}.`,
          `Gato garantizado cada ${bn.catPity} tiros normales. Épico o mejor cada ${bn.epicPity}. Los gatos que NO tienes pesan x${UNOWNED_WEIGHT}.`,
          bn.id === 'michi' ? `Lumen, la Fotógrafa: ${Math.round(LUMEN_SHARE * 100)}% de los gatos legendarios hasta que la tengas.` : 'El destacado sale la mitad de las veces en su rareza.',
          'Alto Riesgo y Todo o Nada cuentan como 3 y 10 tiros para todas las garantías.',
        ]
      : [`Épico o mejor cada ${bn.epicPity} tiros. Legendario seguro a más tardar en ${bn.hardPity}.`];
    let cy = ry;
    for (const n of candy) {
      const t = T('·  ' + n, 14, C.ink, { wordWrap: true, wordWrapWidth: 560, lineHeight: 18 });
      t.position.set(860, cy);
      b.addChild(t);
      cy += t.height + 4;
    }
    const foot = T(
      'Repetido = Orbes de Alma de esa especie (nunca pierdes). HOLO = foil: +15% oro, +12% poder, +10% vida. Se paga con Boletos u Ojos de Gato, que se ganan jugando. No existe dinero real en este juego.',
      14,
      C.inkBlue,
      { wordWrap: true, wordWrapWidth: 1420, lineHeight: 18 },
    );
    foot.position.set(0, Math.max(cy, ry + rh + 70) + 6);
    b.addChild(foot);
  };
  draw(modes.includes(mode0) ? mode0 : 'normal');
}

// ------------------------------------------------------------------ house rules
function rules(b: Container) {
  const lines = [
    'Aquí solo se juega con lo que ganas jugando: oro, Ojos de Gato, Fichas y Boletos. Nada se compra con dinero real. Nunca.',
    `Fichas y boletos se ganan peleando: +${CHIPS.perVictory} fichas por victoria (y 1 boleto cada ${CHIPS.victoriesPerTicket}), +${CHIPS.perKl} fichas y ${CHIPS.ticketsPerKl} boleto por nivel de Reino, +${CHIPS.perBoss} fichas y ${CHIPS.ticketsPerBoss} boletos por jefe.`,
    'La casa siempre gana en promedio (retorno 95–97%). A cambio, la casa reparte dulces: LA CASA TE DEBE, rachas calientes, legendarios que se escapan y garantías. Todo está escrito en cada mesa.',
    'Más apuesta = más riesgo: menos premios, pero más gordos. Tú eliges. Tu apuesta se queda como la dejaste.',
    'PILOTO AUTOMÁTICO: tira por ti a x1, x2, x4 o TURBO, y se para solo cuando tú digas (premio gordo, legendario, gato nuevo, saldo bajo o número de tiradas).',
    'Cada tirada de la Tragamichis y la Ruleta es independiente. En el Portal, en cambio, las garantías sí se acumulan: mientras más tiras sin legendario, más cerca está.',
  ];
  let y = 0;
  for (const n of lines) {
    const t = T('·  ' + n, 22, C.ink, { wordWrap: true, wordWrapWidth: 1400, lineHeight: 29 });
    t.position.set(0, y);
    b.addChild(t);
    y += t.height + 14;
  }
}
