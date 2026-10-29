/**
 * After the Parte III · the post MULTIDIMENSIONAL powers for the AI and the HUD (agent PODERES-2): when each power is
 * worth firing (your auto-aim and the honest estimate; never asked for the enemy) and the rules each one leaves on the
 * field, as chips. Read-only: it peeks at kit.ts's state and never creates it.
 *
 * multidim.ts mdWorth / mdChips → mdpWorth / mdpChips, re-exported by hooks.ts (the single door; the rules during a
 * shot live there, the turn's clocks and the blows at a turn's start in turn.ts).
 */
import type { Battle } from '../sim';
import type { CatState } from '../types';
import { alive, dirOf, left, on, peek } from './kit';
import { dChips, dWorth } from './hudD';

// ------------------------------------------------------------------ AI
/** is THIS the moment for that post power? (your auto-aim and the honest estimate; never asked for the enemy) */
export function mdpWorth(b: Battle, c: CatState): boolean {
  const st = peek(b);
  const side = c.side;
  const enemy = 1 - side;
  const es = b.sides[enemy];
  const own = b.sides[side];
  const foes = alive(b, enemy);
  const mates = alive(b, side);
  // the fight drags on: any power is worth more than waiting
  const late = b.turn >= 4;
  const lost = (k: CatState) => 1 - k.hp / k.maxHp;
  switch (c.def.catId) {
    case 'xp_kagebunyan':
      return !st?.clones.some((k) => k.side === side);
    case 'xp_gatojo':
      return !st?.timeStop && (foes.some((k) => k.stunned <= 1) || b.cannons(enemy).length > 0 || late);
    case 'xp_pegaso':
      return own.cats.reduce((a, k) => a + (k.maxHp - Math.max(0, k.hp)), 0) / Math.max(1, own.cats.reduce((a, k) => a + k.maxHp, 0)) >= 0.25 || late;
    case 'xp_mazingato':
      return !on(st?.alloy[side]);
    case 'xp_ryumiau':
      return !st?.note && foes.length > 0;
    case 'xp_miaunya':
      return !on(st?.tele[side]) && foes.some((k) => k.stunned <= 1);
    case 'xp_yugi':
      return (st?.pieces.get(c) ?? 0) >= 3 || late;
    case 'xp_sherlock':
      return !st?.marks && (b.cannons(side).length > 0 || late);
    case 'xp_frankengato':
      return own.cats.some((k) => k.ko) || b.turn >= 4;
    case 'xp_gatula':
      return foes.length > 0 && (mates.some((k) => lost(k) >= 0.2) || b.turn >= 4);
    case 'xp_ahab':
      return !st?.harpoon;
    case 'xp_pinomichi':
      return (st?.nose.get(c) ?? 1) >= 5 || b.turn >= 6;
    case 'xp_michipulin':
    case 'xp_romiau':
      return foes.length > 0 && ![...(st?.shrink.keys() ?? []), ...(st?.love.keys() ?? [])].some((k) => k.side === enemy && !k.ko);
    case 'xp_barril':
      return !st?.barrel && (foes.some((k) => k.ultCharge >= 0.5) || b.turn >= 4);
    case 'xp_miaufalda':
      return own.ship.integrity() < 0.8 || own.ship.modules.some((m) => !m.alive && own.ship.moduleCells(m.id).length > 0) || late;
    case 'xp_condorgato':
      return !st?.punch && (b.cannons(side).length > 0 || late);
    case 'xp_esponja':
      return mates.filter((k) => k !== c).reduce((a, k) => a + (1 - k.ultCharge), 0) >= 0.8 || mates.length === 1 || late;
    case 'xp_rick':
      return !on(st?.portals[side]);
    case 'xp_miauby':
      return es.cats.some((k) => !k.ko && k.shields > 0) || b.wells.some((w) => w.owner === enemy) || !!es.ward || es.bubbleMax > 0 || es.shieldHp > 0 || es.buffs.stone > 0 || es.buffs.empower > 0 || late;
    case 'xp_blumiau':
      return !st?.clues;
    case 'xp_miaubody':
      return !st?.copy;
    case 'xp_gatogro':
      return !st?.swamp;
    case 'xp_grru':
      return foes.some((k) => k.stunned <= 1);
    case 'xp_miaunion':
      return !st?.bananas;
    case 'xp_michimerica':
      return !st?.shield && (mates.length >= 2 || late);
    case 'xp_doomiau':
      return !st?.decree;
    case 'xp_ssssmichi':
      return mates.length >= 2 || late;
    case 'xp_michimpostor':
      return foes.length > 0;
    case 'xp_zoomic':
      return (st?.rings.get(c)?.rings ?? 0) < 10;
    case 'xp_gemichi': {
      const mine = Math.min(...mates.map((k) => k.hp / k.maxHp));
      const theirs = Math.max(0, ...foes.map((k) => k.hp / k.maxHp));
      return theirs - mine >= 0.25 || late;
    }
    case 'xp_persafalsa':
      return !st?.undercover;
    case 'xp_hermiaune': {
      const snap = st?.snapshot;
      if (!snap) return false;
      return [...snap.cells].some(([k, hp]) => k.hp < hp) || [...snap.cats].some(([k, w]) => (k.ko && !w.ko) || k.hp < w.hp) || b.turn >= 6;
    }
    case 'xp_lunalovegata':
      return es.cats.some((k) => !k.ko && (k.shields > 0 || k.lives > 1)) || es.buffs.stone > 0 || es.buffs.empower > 0 || b.wells.some((w) => w.owner === enemy) || b.wind * dirOf(side) < -20 || late;
    case 'xp_miaunce':
      return !st?.catch;
    case 'xp_heisenmiau':
      return es.ship.cells().filter((k) => Object.keys(k.status).some((s) => s !== 'voided')).length >= 6 || late;
    case 'xp_michiercoles':
      return !st?.piranhas;
    case 'xp_michiwan':
      return !st?.high;
    case 'xp_gatoleone':
      return foes.length > 0 && !st?.offer.size;
    case 'xp_gatoneta':
      return !st?.cake;
    case 'xp_miauki':
      return mates.some((k) => lost(k) >= 0.3) || late;
    case 'xp_postmaulone':
      return !on(st?.chill[side]);
    case 'xp_sabrina':
      return !st?.heart;
    case 'xp_daftmiau':
      return !st?.pyramid;
    case 'xp_partymichi':
      return foes.length >= 2 || b.turn >= 4;
    case 'xp_miaupe':
      return !st?.counter;
    default:
      // tanda 2 (agent PODERES-3): hudD.ts
      return dWorth(b, c) ?? true;
  }
}

// ------------------------------------------------------------------ HUD
export interface MdpChip {
  text: string;
  color: number;
  ink?: number;
  hot?: boolean;
}
/** the post powers' rules on the field, for the battle HUD: [chips on their side, chips on yours] */
export function mdpChips(b: Battle): [MdpChip[], MdpChip[]] {
  const st = peek(b);
  const e: MdpChip[] = [];
  const p: MdpChip[] = [];
  if (!st) {
    dChips(b, e, p);
    return [e, p];
  }
  const W = 0xffffff;
  if (on(st.rubber[0])) p.push({ text: `DE HULE (${left(st.rubber[0])})`, color: 0xd62839, ink: W, hot: true });
  const clones = st.clones.filter((k) => k.side === 0).length;
  if (clones) p.push({ text: `CLONES x${clones}`, color: 0xff7a1a, hot: true });
  if (st.timeStop?.side === 1) p.push({ text: `TIEMPO DETENIDO · ${st.timeStop.stored.length} TIROS EN PAUSA`, color: 0x2b1d4a, ink: W, hot: true });
  if (st.atom.some((k) => k.side === 0)) p.push({ text: `BALÓN EN CAMINO (${Math.min(...st.atom.map((k) => k.turns))})`, color: 0x3a7bd5, ink: W });
  if (on(st.alloy[0])) p.push({ text: 'ALEACIÓN: TOPE 20 %', color: 0xd62839, ink: W, hot: true });
  if (st.note?.side === 0) e.push({ text: `ANOTADO: ${st.note.target.def.name.toUpperCase()} · ${st.note.turns}`, color: 0x111111, ink: W, hot: true });
  if (on(st.tele[0])) p.push({ text: 'TELEPATÍA: ESQUIVAN', color: 0xf7a1c4, hot: true });
  for (const [c, n] of st.pieces) if (c.side === 0 && !c.ko && n > 0) p.push({ text: `PIEZAS ${n}/5`, color: 0x7b2cbf, ink: W });
  if (st.marks?.side === 1) e.push({ text: `MARCADOS x${st.marks.cells.length}`, color: 0xc9a66b, hot: true });
  if (st.harpoon?.side === 1) e.push({ text: `ARPONEADO (${3 - st.harpoon.step})`, color: 0xe8e1d3 });
  for (const [c, n] of st.nose) if (c.side === 0 && !c.ko && c.ultUsed === 0 && n > 1) p.push({ text: `NARIZ x${n}`, color: 0xc49a6c });
  for (const [c, s] of st.shrink) if (c.side === 1 && !c.ko && s.t.now) e.push({ text: `CHIQUITO: ${c.def.name.toUpperCase()}`, color: 0xd62839, ink: W, hot: true });
  if (st.barrel?.side === 0) p.push({ text: 'EN EL BARRIL: SUS ULTIS NO SIRVEN', color: 0x2e7d5b, ink: W, hot: true });
  if (st.punch?.side === 0) p.push({ text: `EL REMATE x3 (${st.punch.volleys})`, color: 0xf2a33a });
  if (on(st.portals[0])) p.push({ text: `PORTALES (${left(st.portals[0])})`, color: 0x97ce4c, hot: true });
  if (st.clues?.side === 1) e.push({ text: `PISTAS ${st.clues.found}/3`, color: 0x6ec6f0 });
  if (st.copy?.side === 0) p.push({ text: `DEL PASADO: ${st.copy.of.def.name.toUpperCase()}`, color: 0xd62839, ink: W });
  if (st.swamp?.side === 1) e.push({ text: `PANTANO (${left(st.swamp.t)})`, color: 0x7aa83a, hot: true });
  for (const [c, t] of st.frozen) if (c.side === 1 && !c.ko && on(t)) e.push({ text: `CONGELADO: ${c.def.name.toUpperCase()}`, color: 0x6ec6f0, hot: true });
  if (st.bananas?.side === 0) p.push({ text: 'ALARMA: PLÁTANOS EN CADA ULTI', color: 0xffe14d, hot: true });
  for (const [c, n] of st.regen) if (c.side === 0 && !c.ko && n > 0) p.push({ text: `FACTOR CURATIVO (${n})`, color: 0xffd23f });
  for (const [c, u] of st.upgrade) if (c.side === 0 && !c.ko && (u.bonus > 0 || on(u.t))) p.push({ text: `MEJORA +${Math.round(u.bonus * 100)} %`, color: 0xb3001b, ink: W, hot: on(u.t) });
  if (st.shield?.side === 0) p.push({ text: 'NUNCA CAEN', color: 0x2f4b8a, ink: W, hot: true });
  if (st.decree?.side === 1) e.push({ text: 'LA LEY DE DOOMIAU', color: 0x2e5e3a, ink: W, hot: true });
  for (const [c, x] of st.exile) if (c.side === 1 && on(x.t)) e.push({ text: `EXPULSADO: ${c.def.name.toUpperCase()}`, color: 0xc51111, ink: W, hot: true });
  for (const [c, r] of st.rings) if (c.side === 0 && !c.ko && (r.rings > 0 || r.loose > 0)) p.push({ text: `ANILLOS ${r.rings}${r.loose ? ` (+${r.loose} REGADOS)` : ''}`, color: 0xffd23f, hot: r.rings > 0 });
  if (st.undercover?.side === 0) p.push({ text: 'INFILTRADA', color: 0xf7a1c4, hot: true });
  if (st.catch?.side === 0) p.push({ text: 'ATRAPA EL SIGUIENTE TIRO', color: 0xf7a1c4, hot: true });
  if (st.piranhas?.side === 1) e.push({ text: `PIRAÑAS (${left(st.piranhas.t)})`, color: 0x5b3a7a, ink: W, hot: true });
  if (st.high?.side === 0) p.push({ text: 'VENTAJA DE LA ALTURA', color: 0xe8c170, hot: true });
  for (const [c] of st.offer) if (c.side === 1 && !c.ko) e.push({ text: `LA OFERTA: ${c.def.name.toUpperCase()}`, color: 0x1a1a1a, ink: W, hot: true });
  if (st.cake?.side === 1) e.push({ text: `EMPACHADOS: SIN BARRA (${left(st.cake.t)})`, color: 0xf7c6d9, hot: true });
  for (const [c, l] of st.love) if (c.side === 1 && !c.ko && on(l.t)) e.push({ text: `ENAMORADO: ${c.def.name.toUpperCase()}`, color: 0xc8102e, ink: W, hot: true });
  if (on(st.chill[0])) p.push({ text: 'CHILL: INMUNES', color: 0x7fd1c7, hot: true });
  if (st.heart?.side === 0) p.push({ text: `CORAZÓN DE AZÚCAR ${Math.round(st.heart.pool)}`, color: 0xffd6e8, hot: true });
  if (st.pyramid?.side === 0) p.push({ text: `PIRÁMIDE (${st.pyramid.turns})`, color: 0xe6c34a });
  if (st.pile?.side === 1) e.push({ text: 'AMONTONADOS', color: 0x39ff14, hot: true });
  if (st.night?.side === 1) e.push({ text: 'NOCHE SIN FIN: ESTADOS x2', color: 0xc8102e, ink: W, hot: true });
  if (st.assist[0] > 0) p.push({ text: 'ASISTENCIA x2.5', color: 0x75aadb, hot: true });
  if (st.counter?.side === 0) p.push({ text: 'CONTRAGOLPE LISTO', color: 0x1f2a5a, ink: W, hot: true });
  for (const [c, t] of st.exposed) if (c.side === 1 && !c.ko && on(t)) e.push({ text: `EXPUESTO: ${c.def.name.toUpperCase()}`, color: 0xffe14a, hot: true });
  if (st.unmask?.side === 1) e.push({ text: 'SIN BARRERAS', color: 0x8b5a2b, ink: W, hot: true });
  if (st.flips?.side === 1) e.push({ text: 'POZOS AL REVÉS', color: 0xd96c9e });
  // tanda 2 (agent PODERES-3): hudD.ts
  dChips(b, e, p);
  return [e, p];
}
