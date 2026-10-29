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
import { BEGINNER, ESCAPE, GachaMode, HOT, LUMEN_SHARE, MODES, banner, expectedPulls, modeOdds, modesFor, pityCaps, pityLeft, rampTable, ratesTable, tierLabelOf } from '../../state/sys/gacha';
import { CP, Seg, clickable, symbolSprite } from './kit';
import { TIER_COL } from './prizes';
import { drawPostOdds, openMultiversoOdds, openPostOdds, postNote } from './postOdds';
import { addVitrinaTab } from './vitrina';
import { anyVitrinaLive } from '../../state/sys/postVitrina';
import { POST_VITRINA } from '../../data/postp3/reglas';
import type { Granted } from '../../state/sys/casino';
import { postOdds, shareText } from '../../state/sys/postp3';
import type { PostGame } from '../../data/postp3/reglas';

const T = (s: string, size = 20, fill: number = C.ink, extra: Record<string, unknown> = {}) => txt(s, { fontFamily: F.ui, fontWeight: '700', fontSize: size, fill, ...extra });
const P = (s: string, size = 30, fill: number = C.ink) => txt(s, { fontFamily: F.poster, fontSize: size, fill });
const pct = (p: number) => (p >= 0.1 ? `${(p * 100).toFixed(1)}%` : p >= 0.01 ? `${(p * 100).toFixed(2)}%` : `${(p * 100).toFixed(3)}%`);
const clear = (c: Container) => c.removeChildren().forEach((x) => x.destroy({ children: true }));

/** `onVitrina`: after the Parte III, the roulette's VITRINA tab presents a throw with it (panels/casino/vitrina.ts) */
export function openOdds(kind: 'slot' | 'roulette' | 'gacha' | 'rules', cur: Cur = 'gold', _stake = 0, bannerId?: string, sub: SlotTier | GachaMode = 0 as SlotTier, onVitrina?: (g: Granted) => void) {
  const title = kind === 'slot' ? 'Tabla de pagos' : kind === 'roulette' ? 'Ruleta: probabilidades' : kind === 'gacha' ? 'Probabilidades del portal' : 'Reglas de la casa';
  const m = new Modal(title, 1500, 900, { subtitle: 'TODO A LA VISTA · SIN LETRA CHIQUITA' });
  const b = new Container();
  m.body.addChild(b);
  if (kind === 'slot') slotOdds(b, cur, typeof sub === 'number' ? sub : 0);
  else if (kind === 'roulette') {
    rouletteOdds(b);
    if (onVitrina) addVitrinaTab(m, b, 'roulette', onVitrina);
  }
  else if (kind === 'gacha') gachaOdds(b, bannerId, typeof sub === 'string' ? sub : 'normal');
  else rules(b);
  m.open();
  return m;
}

// ------------------------------------------------------------------ slot
function slotOdds(root: Container, cur: Cur, tier0: SlotTier) {
  const b = new Container();
  root.addChild(b);
  // after the Parte III: the MULTIVERSO tab (the post cats of the GATO NEGRO lines: state/sys/postp3.ts)
  const post = !!postOdds({ game: 'slot' });
  const tabs = new Seg<number>(
    [...SLOT_TIER_NAME.map((n, i) => ({ v: i, label: `RIESGO ${n}` })), ...(post ? [{ v: 3, label: 'MULTIVERSO' }] : [])],
    tier0,
    (v) => (v === 3 ? drawPost() : draw(v as SlotTier)),
    { w: 190, h: 40, size: 20, color: CP.pink, gap: 8 },
  );
  const drawPost = () => {
    clear(b);
    drawPostOdds(b, { game: 'slot' }, 1420, 740);
  };
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
  if ((tier0 as number) === 3 && post) drawPost();
  else draw(Math.min(2, tier0) as SlotTier);
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
      `AHORITA: ${bn.multiverse ? 'MULTIDIMENSIONAL' : 'legendario o mejor'} ${pct(lp)} en tu próximo tiro · garantía en ${pl.legendary} ${pl.legendary === 1 ? 'tiro' : 'tiros'}` +
        (pl.hot ? ` · RACHA CALIENTE: ${pl.hot} tiros` : '') +
        (caps.beginner ? ' · SUERTE DE PRINCIPIANTE activa' : '') +
        (bn.mythicPity ? ` · ${bn.multiverse ? 'MD QUE TE FALTA' : 'MÍTICO'} garantizado en ${pl.mythic}` : ''),
      17,
      C.pinkHot,
      { wordWrap: true, wordWrapWidth: 1420 },
    );
    st.position.set(0, y0);
    b.addChild(st);
    y0 += 34;
    // after the Parte III: this banner's Multiverse (state/sys/postp3.ts) — one line here, the whole table one tap away
    const pn = bn.hasCats && !bn.multiverse ? postNote({ game: 'gacha', sub: bn.id }) : null;
    if (bn.multiverse) {
      const pl = T(`CADA MULTIDIMENSIONAL, CON SU PESO Y SU PROBABILIDAD EXACTA EN TU PRÓXIMO TIRO  ›  VER LOS GATOS`, 16, C.inkBlue);
      pl.position.set(0, y0 - 8);
      b.addChild(pl);
      clickable(pl, () => openMultiversoOdds(modeOdds(bn, 'normal')));
      y0 += 22;
    }
    if (pn) {
      const pl = T(`${pn}  ›  VER LOS GATOS DEL MULTIVERSO`, 16, C.inkBlue);
      pl.position.set(0, y0 - 8);
      b.addChild(pl);
      clickable(pl, () => openPostOdds({ game: 'gacha', sub: bn.id }));
      y0 += 22;
    }
    const table = ratesTable(bn, mode);
    let x = 0;
    const colW = Math.floor(1440 / Math.max(4, table.length));
    for (const tier of table) {
      const band = new Graphics().rect(x, y0, colW - 12, 44).fill(bn.tierCol?.[tier.tier] ?? TIER_COL[tier.tier]).stroke({ width: 3, color: C.ink });
      const tn = P(`${tierLabelOf(bn, tier.tier)} ${pct(tier.p)}`, 22);
      tn.position.set(x + 10, y0 + 8);
      if (tn.width > colW - 32) tn.scale.set((colW - 32) / tn.width);
      b.addChild(band, tn);
      tier.items.forEach((it, i) => {
        const y = y0 + 52 + i * 44;
        b.addChild(new Graphics().rect(x, y, colW - 12, 40).fill(i % 2 ? C.paper : 0xe6dccb));
        const nm = T(it.label, 14, C.ink, { wordWrap: true, wordWrapWidth: colW - 90, lineHeight: 16 });
        // a 3-line label ("Gato épico o legendario (destacado 50%)") spilled into the next row: 2 lines max
        if (nm.height > 36) {
          nm.style.fontSize = 12;
          nm.style.lineHeight = 13;
          if (nm.height > 36) nm.scale.set(36 / nm.height);
        }
        nm.position.set(x + 8, y + (nm.height > 20 ? 2 : 11));
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
    const rt = T(
      bn.multiverse
        ? `RAMPA DE MULTIDIMENSIONAL: tiro a tiro desde el último · en promedio sale cada ${expectedPulls(bn).toFixed(1)} tiros`
        : `RAMPA DE LEGENDARIO+ (normal): tiro a tiro desde tu último legendario · en promedio sale cada ${expectedPulls(bn).toFixed(1)} tiros`,
      15,
      C.ink,
    );
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
    const candy = bn.multiverse
      ? [
          'MULTIVERSO DESBORDADO: cada LEGENDARIO o MÍTICO de este portal es un MULTIDIMENSIONAL del Multiverso. La línea MULTIDIMENSIONAL sale por peso (los que NO tienes pesan x3); la línea MD QUE TE FALTA te da uno que todavía no tienes (si ya los tienes todos, cualquiera).',
          `SUERTE DE PRINCIPIANTE: hasta tu primer legendario del portal, la rampa empieza en el tiro ${BEGINNER.softPity + 1} y es seguro en el ${BEGINNER.hardPity}.`,
          `Gato garantizado cada ${bn.catPity} tiros. Épico o mejor cada ${bn.epicPity}. MULTIDIMENSIONAL a más tardar en ${bn.hardPity}; MD QUE TE FALTA a más tardar en ${bn.mythicPity}. Sus garantías son suyas: no comparte contadores con los otros portales.`,
          'Aquí no hay HOLO, ni modos de riesgo, ni legendarios que se escapan: todo lo de arriba es Multidimensional.',
        ]
      : bn.hasCats
      ? [
          `SUERTE DE PRINCIPIANTE: hasta tu primer legendario del portal, la rampa empieza en el tiro ${BEGINNER.softPity + 1} y es seguro en el ${BEGINNER.hardPity}.`,
          `¡SE ESCAPÓ!: ${Math.round(ESCAPE.p * 100)}% por tiro normal sin legendario (descansa ${ESCAPE.cooldown} tiros). Deja RASTRO: +${ESCAPE.trail} al contador y RACHA CALIENTE de ${ESCAPE.hot} tiros con legendario x${HOT.legend} y épico x${HOT.epic}.`,
          `Gato garantizado cada ${bn.catPity} tiros normales. Épico o mejor cada ${bn.epicPity}. Los gatos que NO tienes pesan x${UNOWNED_WEIGHT}.`,
          bn.id === 'michi'
            ? `Lumen, la Fotógrafa: ${Math.round(LUMEN_SHARE * 100)}% de los gatos legendarios hasta que la tengas.`
            : 'El destacado sale la mitad de las veces, pero solo en las líneas de su rareza (un destacado legendario no sale en la línea de raro o épico).',
          'Alto Riesgo y Todo o Nada cuentan como 3 y 10 tiros para la garantía de legendario y la de mítico; para la de épico cuentan como 1.',
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
      bn.multiverse
        ? 'Repetido = Orbes de Alma de esa especie (nunca pierdes). Se paga con Boletos u Ojos de Gato, que se ganan jugando. No existe dinero real en este juego.'
        : 'Repetido = Orbes de Alma de esa especie (nunca pierdes). HOLO = foil: +15% oro, +12% poder, +10% vida. Se paga con Boletos u Ojos de Gato, que se ganan jugando. No existe dinero real en este juego.',
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
    'PILOTO AUTOMÁTICO: tira por ti a x1, x2 o x10 hasta que lo pares. Ganar no lo detiene; si quieres, ponle un tope (saldo bajo, número de tiradas, premio gordo, legendario o gato nuevo). Cada tirada se paga.',
    'MODO ETERNO (40 s): los primeros 20 s la máquina acelera y la puedes ENFRIAR (sales sin premio y sin riesgo). Los últimos 20 s no hay frenos: todas las tiradas ganan gratis y van a un botín que se duplica cada 4 s; además de la moneda de la mesa, caen boletos, gemas, pescaditos y oro (más en los jackpots), y también se duplican. Al explotar, 50/50 honesto (azar criptográfico): si ganas, TODO lo tuyo ×2 + el botín entero + un gato legendario (40%), legendario HOLO (35%) o mítico (25%); si pierdes, tu oro, gemas, pescaditos, boletos y fichas quedan en 0 y el botín se va. Tus gatos, barcos, hábitats y progreso nunca se tocan.',
    'Mesas: Plinko, Duelo de Dados, Mayor o Menor, Bingo Exprés, Rasca y Gana y Cajas Misteriosas. Cada una trae su TABLA DE PAGOS con la probabilidad exacta de cada resultado y su retorno (94–97%).',
    'Cada tirada de la Tragamichis y la Ruleta es independiente. En el Portal, en cambio, las garantías sí se acumulan: mientras más tiras sin legendario, más cerca está.',
  ];
  // after the Parte III: which tables give the Multiverse's cats, and how (state/sys/postp3.ts)
  const live = (['gacha', 'slot', 'caja', 'eterno'] as PostGame[]).map((g) => postOdds({ game: g, sub: g === 'gacha' ? 'michi' : undefined }) ?? (g === 'gacha' ? postOdds({ game: g, sub: 'holo' }) : null)).filter((o) => !!o);
  if (anyVitrinaLive())
    lines.push(
      `DESPUÉS DE LA PARTE III · VITRINAS: Plinko, Dados, Mayor o Menor, Bingo, Rasca, Cajas y la Ruleta tienen su vitrina de 8 gatos. Cada apuesta de ${POST_VITRINA.minChips} fichas o más (o de ¼ del tope en oro) tiene ${(POST_VITRINA.chance * 100).toFixed(1)}% de abrirla, aparte de la apuesta. Un gato a más tardar cada ${POST_VITRINA.pity.cat} tiros, un Multidimensional cada ${POST_VITRINA.pity.md}, y a los ${POST_VITRINA.pity.spark} eliges. LA CASA TE DEBE también paga un Sello (${POST_VITRINA.sellos.perThrow} = un tiro). Todo en la pestaña VITRINA de cada mesa.`,
    );
  if (live.length)
    lines.push(
      `DESPUÉS DE LA PARTE III: el Multiverso se cuela en ${live.map((o) => `${o!.place} (${shareText(o!.share)} de sus legendarios o míticos)`).join(', ')}. Las probabilidades de esas mesas no cambian: solo cuál gato sale. Cada una trae su tabla MULTIVERSO con la probabilidad de cada gato y su garantía.`,
    );
  let y = 0;
  for (const n of lines) {
    const t = T('·  ' + n, 22, C.ink, { wordWrap: true, wordWrapWidth: 1400, lineHeight: 29 });
    t.position.set(0, y);
    b.addChild(t);
    y += t.height + 14;
  }
  // after the Parte III the list runs past the panel (its body is ~760 tall under the band): shrink it to fit
  const maxH = 760;
  if (y - 14 > maxH) b.scale.set(maxH / (y - 14));
}
