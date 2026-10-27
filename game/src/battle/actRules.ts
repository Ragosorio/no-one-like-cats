/**
 * Parte III · Actos II–IV — the rules of the boxes and of their story battles (mecanicas-v2/02-loop.md §3;
 * historia-v2/guiones/acto-2…4). Pure sim rules, state in a WeakMap (like mareo.ts / barRules.ts): the screen and the
 * estimate play the same battle. Each one is the SIMPLE version of what the script asks; numbers live in the data.
 *
 *   dimension rules
 *     ONOMATOPEYA (Superhéroes)  `onomatopeya`: a hit that takes ≥ `frac` of a ship's hull leaves a block of solid
 *                                letters between the ships for `ttl` turns: the NEXT shot of either side hits the
 *                                letters, not the ship (and breaks them). Hitting hard covers your own next shot.
 *     PODER (Anime)              `poder`: a cat under `below` of its health charges aura ONCE: its next shot × `mul`.
 *     CAPÍTULOS (Libros)         `capitulos`: every `every` turns the battle turns the page: LLUVIA (every cell wet:
 *                                Tormenta conducts) · CALMA (no wind) · RAÍZ (both ships regrow their two worst cells)
 *     RITMO (POP)                `ritmo`: a cat shot with a living crewmate of the SAME element lands on the beat with
 *                                probability `onBeat` (seeded: the estimate assumes half, as the design asks) → × `mul`;
 *                                `accel`: every N turns the beat speeds up (El mánager) and fewer shots land on it
 *   story rules (NARRATIVA's proposals, simple)
 *     DUELO LIMPIO (Itō, H81)    `duelo`: one shot per turn per side — no extra shots, no cannon volleys
 *     PAUSAS (H77 / H88 / H93)   `pausas`: on that side's turn N its cats don't act — Cruceta goes to save a kitten
 *                                («rescate»), Brecha / Bisagra / the Disruptores help for a turn
 *     ENREDO (El Estambre, H76)  `enredo`: its shots that hurt you tangle one of your cannons for `dur` turns
 *     CORRECCIÓN (H87)           `correccion`: every `every` turns the Correctores whiten one of your cannons: it
 *                                doesn't break, it loses its use for `dur` turns (until her light touches it)
 *     ESQUIRLAS (Esquirla, H88)  `esquirlas`: its hits leave glitch splinters in you; each one makes its next shot hit
 *                                × (1 + `per`) (up to `max`); a LIGHT shot of yours pulls them out
 *     POSE DE PORTADA (Firma)    `pose`: every time Firma's ship takes damage she poses: the next shot at her × `mul`
 *
 * Sim hooks (sim.ts, one line each): fire → actAtkMul + actAfterFire · startTurn → actStartTurn · cannons / extraShots →
 * dueloLimpio. Chips + intro lines: actChips / actRuleLines.
 */
import type { Battle, BattleEvent } from './sim';
import type { CatState, ShotDef } from './types';

export interface OnoCfg {
  /** share of the target's hull one shot must take to leave letters (0.06 = 6 %) */
  frac: number;
  /** turns the block stands */
  ttl: number;
}
export interface PoderCfg {
  mul: number;
  below: number;
}
export type Capitulo = 'lluvia' | 'calma' | 'raiz';
export interface CapitulosCfg {
  every: number;
  order: Capitulo[];
}
export interface RitmoCfg {
  mul: number;
  onBeat: number;
  accel?: { every: number; onBeat: number };
}
export interface PausaCfg {
  side: 0 | 1;
  turn: number;
  kind: 'rescate' | 'brecha' | 'bisagra' | 'disruptores';
}
export interface VictimCfg {
  /** the side that suffers it (the player: 0) */
  side: 0 | 1;
  every?: number;
  dur?: number;
  per?: number;
  max?: number;
}
export interface PoseCfg {
  side: 0 | 1;
  mul: number;
}

interface ActState {
  /** the letter block between the ships: turns left (0 = none) */
  block: number;
  /** poder: cats that already spent their aura */
  aura: Set<string>;
  chapter: number;
  /** esquirlas stuck in each side */
  shards: [number, number];
  /** pose: the next shot at that side is softened */
  pose: [boolean, boolean];
  beats: number;
  covered: number;
}
const STATE = new WeakMap<Battle, ActState>();
function S(b: Battle): ActState {
  let s = STATE.get(b);
  if (!s) {
    s = { block: 0, aura: new Set(), chapter: -1, shards: [0, 0], pose: [false, false], beats: 0, covered: 0 };
    STATE.set(b, s);
  }
  return s;
}
/** a deterministic hash in [0, 1) */
function h01(...n: number[]) {
  let h = 0x9e3779b1;
  for (const v of n) {
    h ^= v | 0;
    h = Math.imul(h, 0x01000193) >>> 0;
    h ^= h >>> 13;
  }
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return (h >>> 0) / 0x100000000;
}
const info = (b: Battle, side: number, text: string, color: number, ev?: BattleEvent[], dy = 230) => {
  const c = b.shipCenter(side);
  ev?.push({ k: 'info', text, x: c.x, y: c.y - dy, color, path: -1, at: 0 });
};
const CAP_NAME: Record<Capitulo, string> = { lluvia: 'LLUVIA', calma: 'CALMA', raiz: 'RAÍZ' };
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/** DUELO LIMPIO: a side fires one shot per turn (no volleys, no extra shots) */
export const dueloLimpio = (b: Battle) => !!b.cfg.rules?.duelo;

/** fire(): the multiplier these rules give this shot (1 without them) */
export function actAtkMul(b: Battle, side: number, shot: ShotDef, cat: CatState | undefined, ev?: BattleEvent[]): number {
  const r = b.cfg.rules;
  if (!r) return 1;
  const st = S(b);
  let mul = 1;
  // ONOMATOPEYA: the letters take this shot (either side's) and break
  if (r.onomatopeya && st.block > 0) {
    st.block = 0;
    st.covered++;
    info(b, 1 - side, '¡KRAK! LAS LETRAS TAPAN EL TIRO', 0xffd400, ev);
    return 0;
  }
  // PODER: a hurt cat's aura, once
  if (r.poder && cat && !st.aura.has(cat.def.uid) && cat.hp > 0 && cat.hp < cat.maxHp * r.poder.below) {
    st.aura.add(cat.def.uid);
    mul *= r.poder.mul;
    info(b, side, `¡AURA! (${cat.def.name.toUpperCase()})`, 0xff2e88, ev);
  }
  // RITMO: a pair of the same element on the beat
  if (r.ritmo && cat) {
    // the shot's element against a crewmate who has it too (a pair of the same element)
    const mate = b.sides[side].cats.some((c) => c !== cat && !c.ko && c.def.elements.includes(shot.element));
    if (mate) {
      const fast = r.ritmo.accel && b.turn > 0 && b.turn % r.ritmo.accel.every === 0;
      const p = fast ? r.ritmo.accel!.onBeat : r.ritmo.onBeat;
      const idx = b.sides[side].cats.indexOf(cat);
      if (h01(b.cfg.seed, b.turn, side, idx) < p) {
        st.beats++;
        mul *= r.ritmo.mul;
        info(b, side, '¡SINCRO! (EN EL BEAT)', 0x00e5ff, ev);
      }
    }
  }
  // ESQUIRLAS: the splinters stuck in the target make this shot hit harder
  const es = r.esquirlas;
  if (es && side !== es.side && st.shards[es.side] > 0) mul *= 1 + (es.per ?? 0.15) * st.shards[es.side];
  // POSE DE PORTADA: Firma posed after the last hit
  const po = r.pose;
  if (po && side !== po.side && st.pose[po.side]) {
    st.pose[po.side] = false;
    mul *= po.mul;
    info(b, po.side, '¡POSE DE PORTADA! (ESCUDO)', 0xff7ab8, ev);
  }
  return mul;
}

/** fire(), after the impacts: what this shot leaves behind (letters, tangles, splinters, a pose) */
export function actAfterFire(b: Battle, side: number, shot: ShotDef, cat: CatState | undefined, events: BattleEvent[]) {
  const r = b.cfg.rules;
  if (!r) return;
  const st = S(b);
  const target = 1 - side;
  const dmg = events.reduce((a, e) => a + (e.k === 'cell' && e.side === target ? e.dmg : 0), 0);
  if (r.onomatopeya && dmg > 0 && st.block === 0) {
    const hull = b.sides[target].ship.cells().reduce((a, c) => a + c.maxHp, 0);
    if (hull > 0 && dmg >= hull * r.onomatopeya.frac) {
      st.block = r.onomatopeya.ttl;
      info(b, target, '¡KRAK! (LAS LETRAS SE QUEDAN)', 0xffd400, events, 300);
    }
  }
  const en = r.enredo;
  if (en && side !== en.side && cat && dmg > 0) {
    const mod = b.sides[en.side].ship.modules.find((m) => m.kind === 'cannon' && m.alive && m.disabled <= 0);
    if (mod) {
      mod.disabled = Math.max(mod.disabled, en.dur ?? 1);
      info(b, en.side, '¡ENREDADO! (UN CAÑÓN NO DISPARA)', 0xd9a441, events, 260);
    }
  }
  const es = r.esquirlas;
  if (es) {
    if (side !== es.side && dmg > 0) st.shards[es.side] = Math.min(es.max ?? 3, st.shards[es.side] + 1);
    else if (side === es.side && cat && shot.element === 'light' && st.shards[es.side] > 0) {
      st.shards[es.side] = 0;
      info(b, es.side, 'LA LUZ SACA LAS ESQUIRLAS', 0xfff3b0, events, 260);
    }
  }
  if (r.pose && side !== r.pose.side && dmg > 0) st.pose[r.pose.side] = true;
}

/** startTurn (after the stun / cooldown ticks): the page turns, a side pauses, the Correctores whiten */
export function actStartTurn(b: Battle, side: 0 | 1, ev: BattleEvent[]) {
  const r = b.cfg.rules;
  if (!r || b.winner !== null) return;
  const st = S(b);
  // the letters age on the player's turn (one round)
  if (side === 0 && st.block > 0) st.block--;
  const cp = r.capitulos;
  if (cp && side === 0 && cp.order.length) {
    const n = Math.floor((Math.max(1, b.turn) - 1) / Math.max(1, cp.every));
    const ch = cp.order[n % cp.order.length];
    if (n !== st.chapter) {
      st.chapter = n;
      const c = { x: (b.shipCenter(0).x + b.shipCenter(1).x) / 2, y: b.shipCenter(0).y };
      ev.push({ k: 'info', text: `CAPÍTULO ${ROMAN[n % ROMAN.length]}: ${CAP_NAME[ch]}`, x: c.x, y: c.y - 320, color: 0xf6efdc, path: -1, at: 0 });
    }
    if (ch === 'lluvia') for (let i = 0; i < 2; i++) b.wetCells(i, b.sides[i].ship.cells(), ev);
    if (ch === 'calma') b.wind = 0;
    if (ch === 'raiz')
      for (let i = 0; i < 2; i++) {
        const dmg = b.sides[i].ship.cells().filter((c) => c.hp < c.maxHp && !c.status.voided).sort((a, z) => a.hp / a.maxHp - z.hp / z.maxHp);
        for (const c of dmg.slice(0, 2)) {
          const amount = Math.round(Math.min(c.maxHp - c.hp, c.maxHp * 0.35));
          c.hp += amount;
          ev.push({ k: 'heal', side: i, cell: c, amount });
        }
      }
  }
  for (const p of r.pausas ?? []) {
    if (p.side !== side || b.turn !== p.turn) continue;
    for (const c of b.sides[side].cats) if (!c.ko) c.stunned = Math.max(c.stunned, 1);
    const text = p.kind === 'rescate' ? '¡SE VA A SALVAR A UN GATITO! (UN TURNO SIN PELEAR)' : p.kind === 'bisagra' ? 'BISAGRA HACE DE PUERTA: BLOQUEA UN TURNO' : p.kind === 'brecha' ? 'BRECHA AYUDA: UN TURNO SIN TIROS ENEMIGOS' : 'LOS DISRUPTORES ABREN UNA RASGADURA: DESVÍA SUS TIROS';
    info(b, side, text, p.kind === 'rescate' ? 0x6fa8ff : 0x00e5ff, ev, 260);
  }
  const co = r.correccion;
  if (co && side !== co.side && b.turn > 0 && b.turn % (co.every ?? 2) === 0) {
    const mod = b.sides[co.side].ship.modules.find((m) => m.kind === 'cannon' && m.alive && m.disabled <= 0);
    if (mod) {
      mod.disabled = Math.max(mod.disabled, co.dur ?? 2);
      info(b, co.side, '¡CORREGIDO! (UN CAÑÓN EN BLANCO)', 0xf6f6f6, ev, 260);
    }
  }
}

/** tests / the sheet */
export const actState = (b: Battle) => {
  const s = STATE.get(b);
  return s ? { block: s.block, aura: [...s.aura], chapter: s.chapter, shards: [...s.shards], pose: [...s.pose], beats: s.beats, covered: s.covered } : null;
};

type Rules = NonNullable<Battle['cfg']['rules']>;
/** the intro / ¿POR QUÉ? lines (only what the sim plays) */
export function actRuleLines(r: Rules | undefined): string[] {
  const out: string[] = [];
  if (!r) return out;
  if (r.onomatopeya) out.push('ONOMATOPEYA: un golpe fuerte deja letras sólidas entre los barcos; el siguiente tiro, tuyo o suyo, pega en las letras');
  if (r.poder) out.push(`PODER: un gato bajo el ${Math.round(r.poder.below * 100)} % de vida carga aura una vez (su siguiente tiro x${r.poder.mul})`);
  if (r.capitulos) out.push(`CAPÍTULOS: cada ${r.capitulos.every} turnos la batalla pasa de página (${r.capitulos.order.map((c) => CAP_NAME[c].toLowerCase()).join(', ')})`);
  if (r.ritmo) out.push(`RITMO: dos gatos del mismo elemento a bordo hacen SINCRO en el beat (x${r.ritmo.mul}; la estimación cuenta la mitad de los tiros en el beat)`);
  if (r.duelo) out.push('DUELO LIMPIO: un solo tiro por turno de cada lado; sin cañonazos');
  if (r.enredo) out.push('ENREDO: sus tiros enredan uno de tus cañones (no dispara un turno)');
  if (r.correccion) out.push(`CORRECCIÓN: cada ${r.correccion.every ?? 2} turnos blanquean uno de tus cañones (${r.correccion.dur ?? 2} turnos sin disparar)`);
  if (r.esquirlas) out.push('ESQUIRLAS: sus golpes te dejan astillas que hacen más fuerte su siguiente tiro; un tiro de LUZ las saca');
  if (r.pose) out.push(`POSE DE PORTADA: cada vez que la dañas, posa: tu siguiente tiro hace x${r.pose.mul}`);
  for (const p of r.pausas ?? []) if (p.kind === 'rescate') out.push(`RESCATE: en el turno ${p.turn}, su capitán se va a salvar a un gatito (un turno sin pelear)`);
  return out;
}
/** chips on YOUR side of the rule strip */
export function actChips(b: Battle): { text: string; color: number; ink?: number; hot?: boolean }[] {
  const r = b.cfg.rules;
  const out: { text: string; color: number; ink?: number; hot?: boolean }[] = [];
  if (!r) return out;
  const st = STATE.get(b);
  if (r.onomatopeya) out.push(st?.block ? { text: 'LETRAS ENTRE LOS BARCOS', color: 0xffd400, ink: 0x171317, hot: true } : { text: 'ONOMATOPEYA', color: 0xffd400, ink: 0x171317 });
  if (r.poder) out.push({ text: 'PODER: AURA BAJO EL 50 %', color: 0xff2e88, ink: 0xffffff });
  if (r.capitulos && st && st.chapter >= 0) out.push({ text: `CAPÍTULO ${ROMAN[st.chapter % ROMAN.length]}: ${CAP_NAME[r.capitulos.order[st.chapter % r.capitulos.order.length]]}`, color: 0xf6efdc, ink: 0x171317 });
  if (r.ritmo) out.push({ text: 'RITMO: PAREJAS EN EL BEAT', color: 0x00e5ff, ink: 0x171317 });
  if (r.duelo) out.push({ text: 'DUELO LIMPIO: UN TIRO', color: 0xf6f1e7, ink: 0x171317 });
  if (r.esquirlas && st?.shards[r.esquirlas.side]) out.push({ text: `ESQUIRLAS ×${st.shards[r.esquirlas.side]}`, color: 0xc8102e, ink: 0xffffff, hot: true });
  if (r.pose && st?.pose[r.pose.side]) out.push({ text: 'POSÓ: ESCUDO', color: 0xff7ab8, ink: 0x171317 });
  return out;
}
