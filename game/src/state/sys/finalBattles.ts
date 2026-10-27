/**
 * PARTE III · EL FINAL — the two story battles of H93–H94 (⚠️ SPOILERS; historia-v2/guiones/final/):
 *
 *   · H93 «El asedio» (fase 1): the sea around YOUR island in a storm (a battle stage, never the editable island,
 *     08 §5.5). Cruceta's and Firma's ships close a ring; until both sink, the ink ship doesn't come near → two fights in
 *     a row («EL ASEDIO 1/2 · 2/2»). Loseable and retried at no cost; the WIN shows no victory screen (spec.final.quietWin):
 *     F32 «La caída» takes over.
 *   · H94 «A oscuras» (no PP): short and with NO DEFEAT possible (rules.undying) — only your cats' eyes in the black;
 *     on turn 3 a single input over Canelo, «MIRA» (spec.final.mira), ends it; the ink ships leave after it anyway
 *     (rules.retreat). Objective on screen: «Que no se lleven a Cerito» (never «protégela»).
 *
 * Same difficulty policy as the Carta (gaterasBattles CARTA_POLICY: your Poder × band × storyScale × ship weight), the
 * same siege factory (campaign.buildSiege). STAND-INS until the owner approves the new art: Cruceta = Supernova (the
 * hero's pose), Firma = Diva (the cover pose), the ink crew of La Mano = Tachón · Tintero · Titiritera.
 * Her commander help (H87): her light draws the trajectories (previewBonus). The help of the siege's 2nd fight depends on
 * the H87 map choice (the Disruptores on turn 3, or Bisagra blocking a turn).
 */
import { G } from '../game';
import { buildSiege } from './campaign';
import { crew, shipPower } from './ship';
import { storyScale } from './storyScale';
import { catDef } from '../../data/content';
import { CARTA_POLICY, MAPA_BRECHA, cartaShipWeight, potentialPower } from './gaterasBattles';
import type { BattleResult, BattleSpec } from '../../scenes/BattleScene';
import type { StageKind } from './gateras';

export type FinalBattleId = 'asedio1' | 'asedio2' | 'oscuras';
interface FinalBattleDef {
  id: FinalBattleId;
  name: string;
  tag: string;
  captain: string;
  captainName: string;
  line?: string;
  crew: string[];
  kind: StageKind;
  powerMul: number;
  hpMulX: number;
  archetype: string;
  lines: string[];
}
/** the storm around your island (realismo con tormenta: no cartoon colors) */
const STORM = { skyTop: 0x05070b, skyBottom: 0x1e2630, sea: 0x1a222c, seaDark: 0x06090d };
/** «A oscuras»: almost black, never pure black (the eyes have to read) */
const DARK = { skyTop: 0x020203, skyBottom: 0x05060a, sea: 0x06080e, seaDark: 0x020304 };

export const FINAL_BATTLES: Record<FinalBattleId, FinalBattleDef> = {
  asedio1: {
    id: 'asedio1',
    name: 'El asedio',
    tag: 'EL ASEDIO · 1 DE 2',
    captain: 'e_supernova',
    captainName: 'Cruceta',
    crew: ['e_supernova', 'r_ecomudo', 'c_voltio', 'r_plasmin'],
    kind: 'elite',
    powerMul: 1.5,
    hpMulX: 3.2,
    archetype: 'chalupa',
    lines: ['EL ASEDIO: HUNDIR A LOS DOS', 'Hasta que no se hundan los dos, el barco de tinta no se acerca.'],
  },
  asedio2: {
    id: 'asedio2',
    name: 'El asedio',
    tag: 'EL ASEDIO · 2 DE 2',
    captain: 'e_diva',
    captainName: 'Firma',
    crew: ['e_diva', 'c_chispa', 'r_magmito', 'c_tamborin'],
    kind: 'elite',
    powerMul: 1.6,
    hpMulX: 3.4,
    archetype: 'chalupa',
    lines: ['EL ASEDIO: HUNDIR A LOS DOS', 'Queda uno. Después, el barco de tinta.'],
  },
  oscuras: {
    id: 'oscuras',
    name: 'A oscuras',
    tag: 'A OSCURAS',
    captain: 'r_tachon',
    captainName: 'Los barcos de tinta',
    crew: ['r_tachon', 'r_tintero', 'e_titiritera'],
    kind: 'normal',
    powerMul: 1,
    hpMulX: 2.4,
    archetype: 'chalupa',
    lines: ['Que no se lleven a Cerito'],
  },
};
/** «MIRA» on this turn (the script: turn 3); the ink ships leave after it in any case */
export const OSCURAS_TURNS = 3;

/** the battle id the music plans and the estimate key read (`meta.special`) */
export const finalBattleKey = (id: FinalBattleId) => `p3_final_${id}`;

/** enemy Poder for this crew: the Carta's policy (pure given the save and the crew) */
export function finalPower(id: FinalBattleId, crewUids = crew()): number {
  const def = FINAL_BATTLES[id];
  const sc = storyScale({ band: 'jefe' }, crewUids);
  const ship = G.s.ship.active;
  const own = shipPower(ship, crewUids) * def.powerMul;
  const floor = CARTA_POLICY.floor * potentialPower(ship) * def.powerMul;
  return Math.max(floor, own) * (CARTA_POLICY.band[def.kind] ?? 1) * (sc?.mul ?? 1) * cartaShipWeight(ship, def.kind);
}

/** the BattleSpec of a finale battle (the same spec an estimate would sim) */
export function buildFinalBattle(id: FinalBattleId, onEnd: (r: BattleResult) => void): BattleSpec {
  const def = FINAL_BATTLES[id];
  const crewUids = crew();
  const sc = storyScale({ band: 'jefe' }, crewUids);
  const oscuras = id === 'oscuras';
  const rules: NonNullable<BattleSpec['rules']> = oscuras ? { undying: [0], retreat: { side: 1, turn: OSCURAS_TURNS + 1 } } : {};
  // the help of the siege (h93 «Ayuda»): the Disruptores arrive on turn 3 if Brecha got the map in H87 (a tear that
  // deflects their shots); if not, Bisagra is a door and blocks a turn (battle/actRules.ts pausas)
  if (id === 'asedio2') rules.pausas = [{ side: 1, turn: 3, kind: G.has(MAPA_BRECHA) ? 'disruptores' : 'bisagra' }];
  const spec = buildSiege(
    {
      zone: 3,
      stage: oscuras ? 30 : 29,
      key: finalBattleKey(id),
      name: def.name,
      type: 'errand',
      archetype: def.archetype,
      personality: 'afinador',
      difficulty: 'corsario',
      enemyCats: [...def.crew],
      ep: finalPower(id, crewUids),
      crewUids,
      captain: def.captainName,
      captainLine: def.line,
      rules: Object.keys(rules).length ? rules : undefined,
      special: finalBattleKey(id),
      mirror: CARTA_POLICY.off ? undefined : { ...CARTA_POLICY.mirror },
      hpMulX: def.hpMulX,
      enemyLevel: sc?.enemyLevel,
      enemyStars: sc?.enemyStars,
      catrooms: def.crew.length,
      intro: {
        kind: oscuras ? 'errand' : 'elite',
        tag: def.tag,
        title: def.name.toUpperCase(),
        subtitle: def.captainName,
        lines: def.lines,
        color: oscuras ? 0x2a2f3a : 0x8a95a3,
        slug: catDef(def.captain).art.slug ?? undefined,
      },
    },
    onEnd,
  );
  spec.palette = oscuras ? DARK : STORM;
  spec.meta = { ...spec.meta!, boss: false };
  // her commander help, as in H87: her light draws the trajectories (a longer aim preview)
  if (!oscuras) spec.meta = { ...spec.meta, previewBonus: 0.6 };
  // the win is quiet: F32 (the siege) / F36 (MIRA) come instead of the victory screen
  spec.final = { quietWin: true, ...(oscuras ? { dark: true, mira: { turn: OSCURAS_TURNS, auto: 4, canelo: caneloUid() } } : {}) };
  return spec;
}

/** Canelo (the first cat of the save: the c_canelo the player named) */
export function caneloUid(): string | null {
  return G.s.cats.find((c) => c.species === 'c_canelo')?.uid ?? null;
}
