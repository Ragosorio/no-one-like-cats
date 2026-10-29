/**
 * After the Parte III · TANDA 2 · the second batch for the AI and the HUD (agent PODERES-3): when each power is worth
 * firing (your auto-aim and the honest estimate; never asked for the enemy) and the rules each one leaves on the field,
 * as chips. Read-only: it peeks at kitD.ts's state and never creates it. hud.ts mdpWorth / mdpChips → dWorth / dChips.
 */
import type { Battle } from '../sim';
import type { CatState } from '../types';
import { left, on, peek } from './kit';
import type { MdpChip } from './hud';
import { hullFrac, lifeOf } from './kitD';
import { boxChoice } from './powersE';

/** is THIS the moment for that tanda-2 power? undefined = not a tanda-2 cat */
export function dWorth(b: Battle, c: CatState): boolean | undefined {
  const d = peek(b)?.d ?? null;
  const side = c.side;
  const enemy = 1 - side;
  const es = b.sides[enemy];
  const foes = es.cats.filter((k) => !k.ko);
  const mates = b.sides[side].cats.filter((k) => !k.ko);
  const late = b.turn >= 4;
  switch (c.def.catId) {
    case 'xp_sombreronron':
      return !d?.braid;
    case 'xp_gatejo':
    case 'xp_maullorona':
    case 'xp_miausagi':
    case 'xp_tanjimiau':
    case 'xp_tetrimiau':
    case 'xp_michincipe':
      return foes.length > 0 || late;
    case 'xp_quetzalgatl':
      return !d?.wind;
    case 'xp_bastet':
      return !d?.guard;
    case 'xp_cleogatra':
      return !d?.wager;
    case 'xp_bonapata':
      return !d?.conquest;
    case 'xp_leonardo':
      return ![...(d?.codex.keys() ?? [])].some((k) => k.side === side);
    case 'xp_perla':
      return !d?.light && (mates.some((k) => k.hp / k.maxHp <= 0.8) || hullFrac(b, side) <= 0.85 || late);
    case 'xp_miauton':
      return !d?.gravity;
    case 'xp_miauzart':
      return !d?.encore;
    case 'xp_laracroqueta':
      return foes.reduce((a, k) => a + k.ultCharge, 0) >= 0.5 || late;
    case 'xp_pobregatito':
      return !d?.traps;
    case 'xp_felinamente':
      return !d?.objection;
    case 'xp_gorrimiau':
      return !d?.compass;
    case 'xp_docmiauwn':
      return (d?.misses.length ?? 0) >= 3 || late;
    case 'xp_pinkmiau':
      return !d?.lab;
    case 'xp_miauty':
      return hullFrac(b, enemy) - hullFrac(b, side) >= 0.1 || late;
    case 'xp_garjona':
      return b.turn >= 3;
    case 'xp_shakimiau':
      return es.ship.cells().filter((k) => k.hp < k.maxHp * 0.4).length >= 4 || late;
    case 'xp_miaucol':
      return es.cats.some((k) => k.ko) || late;
    default:
      return undefined;
  }
}

const BOX = ['', 'LA CAJA TRAE: CURITAS', 'LA CAJA TRAE: SIN ESCUDOS', 'LA CAJA TRAE: EL BORREGO'];

/** the tanda-2 rules on the field, added to hud.ts's chips (their side `e`, yours `p`) */
export function dChips(b: Battle, e: MdpChip[], p: MdpChip[]) {
  const W = 0xffffff;
  // the box Michíncipe would draw right now (his power still unused)
  if (b.sides[0].cats.some((c) => !c.ko && c.def.catId === 'xp_michincipe' && c.ultUsed === 0)) p.push({ text: BOX[boxChoice(b, 0)], color: 0xf2c94c });
  const d = peek(b)?.d;
  if (!d) return;
  if (d.braid?.side === 0) p.push({ text: `LISTONES ${d.braid.pins.length}/3 (${left(d.braid.t)})`, color: 0xc8102e, ink: W, hot: true });
  for (const [c, x] of d.braided) if (c.side === 1 && !c.ko && on(x.t)) e.push({ text: `TRENZADO: ${c.def.name.toUpperCase()}`, color: 0xe6c34a });
  if (d.wind?.side === 0) p.push({ text: `VIENTO A FAVOR (${left(d.wind.t)})`, color: 0x2bb3a3, hot: true });
  if (d.guard?.side === 0) p.push({ text: `PISO 30 % · ${Math.min(10, d.guard.rays)} RAYOS`, color: 0xe6c34a, hot: true });
  if (d.wager?.side === 0) {
    const theirs = Math.max(0, Math.round(d.wager.theirs0 - lifeOf(b, 1)));
    const mine = Math.max(0, Math.round(d.wager.mine0 - lifeOf(b, 0)));
    p.push({ text: `APUESTA: TÚ ${theirs} · ELLOS ${mine}`, color: theirs > mine ? 0x2e9e6b : 0xb03a2e, ink: W, hot: true });
  }
  if (d.bonus[0] > 0) p.push({ text: `CONQUISTA +${Math.round(d.bonus[0] * 100)} %`, color: 0x1f3a93, ink: W, hot: !!d.conquest });
  else if (d.conquest?.side === 0) p.push({ text: `CONQUISTA (${left(d.conquest.t)})`, color: 0x1f3a93, ink: W });
  const inv = [...d.codex].filter(([c, t]) => c.side === 0 && !c.ko && on(t)).length;
  if (inv) p.push({ text: `INVENTOS x${inv}`, color: 0xb5543a, ink: W });
  if (d.light?.side === 0) p.push({ text: `LUZ DE VENTANA (${d.light.turns})`, color: 0xf2d27a });
  if (d.gravity?.side === 0) {
    if (on(d.gravity.mine)) p.push({ text: 'GRAVEDAD x0.5', color: 0xc0392b, ink: W });
    if (on(d.gravity.theirs)) e.push({ text: `GRAVEDAD x${d.gravity.heavy} (${left(d.gravity.theirs)})`, color: 0xc0392b, ink: W, hot: true });
  }
  if (d.encore?.side === 0) p.push({ text: 'ENCORE LISTO', color: 0xe8c7a0, hot: true });
  if (d.traps?.side === 0) p.push({ text: `TRAMPAS x${d.traps.cells.length} (${left(d.traps.t)})`, color: 0xc8102e, ink: W, hot: true });
  if (d.objection?.side === 0 && !d.objection.used) p.push({ text: `OBJECIÓN LISTA (${left(d.objection.t)})`, color: 0xf7a1c4, hot: true });
  if (d.compass?.side === 0) p.push({ text: `BRÚJULA AL ATÚN (${left(d.compass.t)})`, color: 0xc49a3c, hot: true });
  if (d.lab?.side === 0) {
    if (on(d.lab.t)) p.push({ text: `VAPOR EN CADA GOLPE (${left(d.lab.t)})`, color: 0xf7a1c4, hot: true });
    if (on(d.lab.combo)) p.push({ text: 'QUÍMICA x2 (CON EL PROFE)', color: 0x4fc3f7, hot: true });
  }
  for (const [c, t] of d.marked) if (c.side === 1 && !c.ko && on(t)) e.push({ text: `MARCADO: ${c.def.name.toUpperCase()}`, color: 0xd4a017, hot: true });
}
