/**
 * Parte III · the battles of the Carta de las Cajas (B-1…B-5 in this slice), built with the campaign's siege factory
 * (`buildSiege`, like the Encargos and the Parte II) — never through `content.enemies`, which would break the Parte I.
 *
 *   · DIFFICULTY POLICY of the Carta (mecanicas-v2/02 §6.3, calibrated with tests/p3Balance.sim.test.ts —
 *     CARTA_POLICY): enemy Poder = max(floor, your Poder) × powerMul × band × storyScale × ship weight, where
 *       band   p3n ×1.55 (normal) · p3e ×1.35 (élite) · p3j ×1.5 (boss); élite and boss also wear the band «jefe»
 *       floor  0.8 × the Poder of your active ship sailed by its BEST cats (what autoCrew would pick), under the same
 *              multipliers: sandbagging the Bastión with one cat doesn't shrink the box, and a small ship is never
 *              measured against a big one
 *       ship   the per-ship weight (Bastión 1 … Gorrión 0.5 / boss 0.4): replaces the old fixed 3 000 floor that walled
 *              small ships
 *     + «la caja te mide» (buildSiege mirror) + the élite's box power (a hull-scaled cataclysm, data `cata`)
 *   · the rule: StageRules.mareo (battle/mareo.ts) — data only: the estimate worker sims exactly this spec
 *   · the look: the Borracha's palette (beer amber, donut pink, bottle green, night blue) and its ship style
 *   · first win of a stage: its huellas (state/sys/gateras.ts) + `won_p3d_borracha_<n>` (H69 reads the 5th)
 *
 * The id of a battle is `p3d_<dim>_<n>` (meta.special): the music plan (data/music/battles.json) is found by it.
 */
import { G } from '../game';
import { buildSiege, countCrewWins, cataIntroLine, isRepairing } from './campaign';
import { crew, crewSize, shipName, shipPower } from './ship';
import { catPow } from './cats';
import { absStage, battleGold, battleScrap } from '../econ';
import { storyScale } from './storyScale';
import { mareoLines } from '../../battle/mareo';
import { catDef } from '../../data/content';
import type { BattleResult, BattleSpec } from '../../scenes/BattleScene';
import { DIMS, DimId, GateraNodeDef, GateraStageDef, StageKind, addPhoto, gateraBattleId, huellas, huellasForNode, isOpen, isRondaLocale, nodeOf, nodeState, nodesOf, recordNodeWin, recordRondaWin, recordWin, rondaConditions, rondaOf, rondaProgress, stageOf, stageState, dimDef, clearedIn, huellasFor, notePeakIncome } from './gateras';
import { BAR_CONDITIONS, rondaLines } from '../../battle/ronda';
import { barRuleLines } from '../../battle/barRules';
import { actRuleLines } from '../../battle/actRules';
import { gateras, shapeOf } from './gateras';
import { p3OnGateraWin, type P3WinLoot } from './p3cats';

/** H87 «No, wey»: the map of the gateras given to Brecha (app/actsFlow.ts) — her help in H88 and the finale's siege */
export const MAPA_BRECHA = 'p3_mapa_brecha';
/** the OLD fixed Poder floor (05 §3): only with CARTA_POLICY.off (the slice before the policy, for comparisons) */
export const GATERA_EP_FLOOR = 3000;

/**
 * The Carta's difficulty policy (02 §6.3). Exported mutable for the balance harness; `off` = the slice as it was
 * (fixed 3 000 floor, no band, no mirror, no box power) — the «before» of the calibration table.
 */
export const CARTA_POLICY = {
  off: false,
  /**
   * enemy Poder × on top of the stage's powerMul, by stage kind (p3n · p3e · p3j). Calibrated (MECÁNICAS-IMPL, 64 fights
   * per cell, Bastión): the design's 1.55 / 1.6 / 1.6 left the floor crew at 47 % on the élite; with the mirror at
   * k 1.5 the élite needs less Poder (its box power and the «jefe» band already bite): h65 78 % · raros40 55 %.
   */
  band: { normal: 1.55, elite: 1.35, boss: 1.5 } as Record<StageKind, number>,
  /** «la caja te mide»: their attack × (your crew's quality / theirs)^k, hp × √, capped — closes the strong/weak fan */
  mirror: { k: 1.5, cap: 2.2 },
  /** the floor: × the Poder of your active ship with its best cats */
  floor: 0.8,
  /**
   * per ship class and stage kind, only on the Carta (a small ship meets a smaller box); unknown ships: 1. The boss
   * weighs less on small ships: its bottles don't scale with your hull (the élite's cataclysm does, cataSize).
   */
  shipWeight: {
    bastion: { normal: 1, elite: 1, boss: 1 },
    bajel: { normal: 0.75, elite: 0.75, boss: 0.65 },
    merodeador: { normal: 0.6, elite: 0.6, boss: 0.45 },
    gorrion: { normal: 0.5, elite: 0.5, boss: 0.4 },
    balsa: { normal: 0.4, elite: 0.4, boss: 0.3 },
  } as Record<string, Record<StageKind, number>>,
};
/** the Carta's weight of a ship for a stage kind (02 §6.3 C) */
export const cartaShipWeight = (shipId = G.s.ship.active, kind: StageKind = 'normal') => CARTA_POLICY.shipWeight[shipId]?.[kind] ?? 1;

/** the Poder of a ship sailed by its BEST cats (the whole collection, what autoCrew would pick): the policy's floor */
export function potentialPower(shipId = G.s.ship.active): number {
  const best = [...G.s.cats]
    .sort((a, b) => catPow(b) - catPow(a))
    .slice(0, crewSize(shipId))
    .map((c) => c.uid);
  return shipPower(shipId, best);
}
/** the zone whose campaign knobs the siege borrows (Mk 3 enemy weapons, no cataclysm, no ship perk): a drunk alley */
const SIEGE_ZONE = 3;

/** the Borracha's night (a 90s cartoon on an old TV: never yellow skin) */
export const BORRACHA_PALETTE = { skyTop: 0x0f1830, skyBottom: 0x2a3d6e, sea: 0x1b2a4a, seaDark: 0x101a30 };

/** a node of the Carta: a stage number (`3`) or a node id (`d1` a detour, `r2` a locale of La Ronda) */
export type GateraNode = number | string;
/** a battle of the Carta, whatever its node: a stage's fields + the node, its label and its abs stage (gold) */
export interface GateraBattleDef extends GateraStageDef {
  node: string;
  label: string;
  /** the Diario del Mar's stage number its gold is paid at (a stage: n; a detour / locale: the stage it hangs from) */
  goldStage: number;
}
const KIND_OF: Record<string, StageKind> = { stage: 'normal', elite: 'elite', boss: 'boss', desvio: 'normal', actividad: 'normal', encuentro: 'normal', escena: 'normal' };
/**
 * The battle a node plays (pure given the save and the data): a stage of the route; a LOCALE of La Ronda (its base
 * stage, lighter, with this round's bar condition); or a node with its own crew (a detour, an encounter).
 */
export function gateraBattleDef(dim: DimId, node: GateraNode): GateraBattleDef | undefined {
  const id = String(node);
  if (/^\d+$/.test(id)) {
    const def = stageOf(dim, Number(id));
    return def ? { ...def, node: id, label: stageLabel(dim, def.n), goldStage: def.n } : undefined;
  }
  const r = rondaOf(dim);
  if (r && isRondaLocale(dim, id)) {
    const k = r.locales.findIndex((l) => l.id === id);
    const loc = r.locales[k];
    const base = stageOf(dim, loc.base);
    if (!base) return undefined;
    // a short bar battle: the base stage's crew and Mareo, lighter, no band / box power / phases / film / stamp
    const { band: _b, cata: _c, fases: _f, film: _fi, stamp: _s, teaches: _t, note: _n, stakes: _st, ...rest } = base;
    void _b, _c, _f, _fi, _s, _t, _n, _st;
    // a bar, not the alley: no bottles in La Ronda (and «sin derramar» stays a skill, not a coin toss)
    const mareo = rest.mareo ? (({ botellas: _bt, ...mz }) => (void _bt, mz))(rest.mareo) : undefined;
    return {
      ...rest,
      mareo,
      name: loc.name,
      kind: 'normal',
      powerMul: (base.powerMul ?? 1) * (r.powerMul ?? 0.9) * (loc.powerMul ?? 1),
      hpMulX: (base.hpMulX ?? 2) * (r.hpMul ?? 0.6) * (loc.hpMul ?? 1),
      conditions: [rondaConditions(dim)[id]],
      teach: `${r.name}: local ${k + 1} de ${r.locales.length}`,
      node: id,
      label: `${r.name.toUpperCase()} ${k + 1}/${r.locales.length}`,
      goldStage: base.n,
    };
  }
  const nd = nodeOf(dim, id);
  if (!nd?.crew?.length) return undefined;
  const from = (nd.requires ?? []).map((q) => Number(q)).find((x) => Number.isFinite(x) && x > 0) ?? 1;
  const detours = nodesOf(dim).filter((x) => x.kind === nd.kind);
  const idx = Math.max(0, detours.findIndex((x) => x.id === id));
  // a bracket / shelf / tour names its own nodes (`label: 'A-5'`, `n` = its place in the box for the gold); else as before
  const own = nd as GateraNodeDef & { n?: number; label?: string };
  return { ...nd, n: own.n ?? 20 + idx, kind: KIND_OF[nd.kind] ?? 'normal', node: id, label: own.label ?? (nd.kind === 'desvio' ? `DESVÍO ${idx + 1}` : nd.kind === 'encuentro' ? 'HISTORIA' : id.toUpperCase()), goldStage: own.n ?? from };
}

/** enemy Poder of a node for this crew (pure given the save and the crew) */
export function gateraPower(dim: DimId, node: GateraNode, crewUids = crew()): number {
  const def = gateraBattleDef(dim, node);
  const sc = def?.band ? storyScale({ band: def.band }, crewUids) : null;
  const ship = G.s.ship.active;
  const own = shipPower(ship, crewUids) * (def?.powerMul ?? 1);
  if (CARTA_POLICY.off) return Math.max(GATERA_EP_FLOOR, own) * (sc?.mul ?? 1);
  const band = CARTA_POLICY.band[def?.kind ?? 'normal'] ?? 1;
  // the floor goes UNDER the stage's multipliers: a sandbagged crew meets ≥ 80 % of the box your best cats would meet
  // (measured: with the floor outside them, one common cat on the Bastión won B-5 84 % and B-9 94 % — the trap the
  // floor exists to close)
  const floor = CARTA_POLICY.floor * potentialPower(ship) * (def?.powerMul ?? 1);
  return Math.max(floor, own) * band * (sc?.mul ?? 1) * cartaShipWeight(ship, def?.kind ?? 'normal');
}

/** the rules of a stage, from its data (Mareo, the élite's box power, a boss's phases): what the sim and the estimate play */
export function gateraRules(dim: DimId, node: GateraNode): BattleSpec['rules'] {
  const def = gateraBattleDef(dim, node);
  if (!def) return undefined;
  const rules: NonNullable<BattleSpec['rules']> = {};
  if (def.mareo) rules.mareo = JSON.parse(JSON.stringify(def.mareo));
  // the box's power on its élite: a cataclysm that falls harder the bigger your hull (battle/cataclysm.ts cataSize)
  if (def.cata && !CARTA_POLICY.off) rules.cataclysm = { ...def.cata, side: 1, by: dimDef(dim).name };
  if (def.fases) rules.fases = JSON.parse(JSON.stringify(def.fases));
  // the Acto I story rules: RIMA (EMIAU), LISTA VIP (El Cadenero) — battle/barRules.ts
  if (def.rima) rules.rima = { ...def.rima };
  if (def.vip) rules.vip = { ...def.vip };
  // Actos II–IV: the box's rule, then the stage's own (battle/actRules.ts), plain data
  const dr = dimDef(dim).rules;
  if (dr) Object.assign(rules, JSON.parse(JSON.stringify(dr)));
  if (def.rules) Object.assign(rules, JSON.parse(JSON.stringify(def.rules)));
  // H87's choice comes back: Brecha helps a turn if she got the map, Bisagra if not (actRules pausas)
  if (def.ayuda) rules.pausas = [...(rules.pausas ?? []), { side: def.ayuda.side, turn: def.ayuda.turn, kind: G.has(MAPA_BRECHA) ? 'brecha' : 'bisagra' }];
  // the bar's conditions (La Ronda, the detours): «sin derramar», «la última y nos vamos» (battle/ronda.ts)
  for (const c of def.conditions ?? []) {
    const cr = BAR_CONDITIONS[c]?.rules;
    if (cr?.intact) rules.intact = { ...cr.intact };
    if (cr?.turnLimit) rules.turnLimit = { ...cr.turnLimit, turns: def.turns ?? cr.turnLimit.turns };
  }
  return Object.keys(rules).length ? rules : undefined;
}

/** the BattleSpec of a node. Same spec the estimate sims (`simulateEstimate(key, () => buildGateraBattle(…))`). */
export function buildGateraBattle(dim: DimId, node: GateraNode, onEnd: (r: BattleResult) => void): BattleSpec {
  const def = gateraBattleDef(dim, node);
  if (!def?.crew?.length) throw new Error(`[gateras] ${dim} ${node} no se juega en esta porción`);
  const n = def.n;
  const id = gateraBattleId(dim, def.node);
  const crewUids = crew();
  const sc = def.band ? storyScale({ band: def.band }, crewUids) : null;
  const elite = def.kind === 'elite';
  const boss = def.kind === 'boss';
  const rules = gateraRules(dim, def.node);
  const lines = [...(def.teach ? [def.teach] : []), ...barRuleLines(rules), ...actRuleLines(rules), ...rondaLines(rules), ...(def.mareo ? mareoLines(def.mareo) : []), ...(rules?.cataclysm ? [cataIntroLine(rules.cataclysm)] : [])];
  const spec = buildSiege(
    {
      zone: SIEGE_ZONE,
      stage: n,
      key: id,
      name: def.name,
      // 'errand': no zone cataclysm, no campaign élite tune (the élite's bite is its band + hpMulX)
      type: 'errand',
      archetype: def.archetype ?? 'chalupa',
      personality: def.personality ?? 'afinador',
      difficulty: def.ai ?? 'corsario',
      enemyCats: [...def.crew],
      ep: gateraPower(dim, def.node, crewUids),
      crewUids,
      captain: def.captainName,
      captainLine: def.line,
      rules,
      special: id,
      mirror: CARTA_POLICY.off ? undefined : { ...CARTA_POLICY.mirror },
      hpMulX: def.hpMulX,
      enemyLevel: sc?.enemyLevel,
      enemyStars: sc?.enemyStars,
      catrooms: def.crew.length,
      intro: {
        kind: elite || boss ? 'elite' : 'errand',
        tag: boss ? `JEFE · ${dimDef(dim).name}` : elite ? `ÉLITE · ${dimDef(dim).name}` : `${dimDef(dim).name} · ${def.label}`,
        title: def.name.toUpperCase(),
        subtitle: def.captainName ?? dimDef(dim).sub,
        lines,
        color: elite || boss ? 0xf59ac0 : 0xe8a33d,
        slug: def.captainArt ?? (def.captain ? catDef(def.captain).art.slug ?? undefined : undefined),
      },
    },
    onEnd,
  );
  // the élite's own painting (Oficial Dona): only the look of the captain; its species (rules, shot, ult) stays the data's
  if (def.captainArt && spec.enemy.cats[0]) spec.enemy.cats[0] = { ...spec.enemy.cats[0], slug: def.captainArt, name: (def.captainName ?? spec.enemy.cats[0].name).split('«')[0].trim() };
  // the box's look in battle: its data (`dims[].battle`), the Borracha's night by default
  const look = dimDef(dim).battle;
  spec.palette = look?.palette ? { ...BORRACHA_PALETTE, ...look.palette } : BORRACHA_PALETTE;
  spec.enemyStyle = (look?.style ?? 'borracha') as typeof spec.enemyStyle;
  spec.meta = { ...spec.meta!, boss: false };
  // H85: she turns her lantern off to hide Canelo and Cerito (the fight in the dark: only the cats' eyes) · H87: her
  // light draws the trajectories (a longer aim preview: her commander help)
  if (def.dark) spec.final = { ...(spec.final ?? {}), dark: true };
  if (def.luz) spec.meta = { ...spec.meta, previewBonus: Math.max(spec.meta.previewBonus ?? 0, 0.6) };
  return spec;
}

/** «B-3»: the stage's short label (the dimension's letter, from its data `code`; the Borracha's is B); a node: its label */
export function stageLabel(dim: DimId, node: GateraNode) {
  if (!/^\d+$/.test(String(node))) return gateraBattleDef(dim, node)?.label ?? String(node).toUpperCase();
  return `${dimDef(dim).code ?? dimDef(dim).name.replace(/^(LA|EL|LOS|LAS)\s+/, '').charAt(0)}-${node}`;
}

/** has this node been won (a stage: the route; a node: its own wins; a locale: this round)? */
function nodeWonNow(dim: DimId, node: GateraNode): boolean {
  const id = String(node);
  if (/^\d+$/.test(id)) return stageState(dim, Number(id)) === 'cleared';
  if (isRondaLocale(dim, id)) return rondaProgress(dim).done.includes(id);
  return nodeState(dim, id) === 'cleared';
}

/** what a node pays now (the card shows it): the Diario del Mar's gold (×0.7 once won) + the first-win huellas */
export function gateraLootPreview(dim: DimId, node: GateraNode): { gold: number; scrap: number; huellas: number; frontier: boolean } {
  const def = gateraBattleDef(dim, node);
  const id = String(node);
  const frontier = !nodeWonNow(dim, node);
  const abs = absStage(6, 9) + (def?.goldStage ?? (Number(id) || 1));
  const firstHuellas = /^\d+$/.test(id) ? huellasFor(dim, Number(id)) : isRondaLocale(dim, id) ? 0 : huellasForNode(dim, id);
  return {
    gold: Math.round(battleGold(abs, G.goldPerSec, frontier, false, G.s.momentum)),
    scrap: battleScrap(abs, false, G.s.momentum),
    huellas: frontier ? firstHuellas : 0,
    frontier,
  };
}

export interface GateraLoot {
  won: boolean;
  first: boolean;
  gold: number;
  scrap: number;
  huellas: number;
  /** the stage that just opened (null: none) */
  opened: number | null;
  /** a first win of an élite / boss took a trip photo (02 §5.2) */
  photo?: boolean;
  /** a node that just opened (a detour's next one) */
  openedNode?: string | null;
  /** La Ronda after a locale: how many of the round are done, and whether the round closed / revealed the detour */
  ronda?: { done: number; of: number; roundDone: boolean; revealed: boolean };
  /** Parte III · the cats this win earned and the orbs it paid (state/sys/p3cats.ts: the node's cat, activity, repeat) */
  p3?: P3WinLoot;
}

/**
 * The victory screen of a FIRST win (02 §5.3; ui/victoryStamp.ts draws it): the node's stamp, its huellas and what's
 * new («B-6 ABIERTA», «¡FOTO DEL VIAJE!», «RONDA 2/4», «¡DESVÍO REVELADO!», the next gatera within reach). Pure given
 * the save after applyGateraResult.
 */
export function victoryStampOpts(dim: DimId, node: GateraNode, loot: GateraLoot, fmtGold: (n: number) => string = (x) => String(x)) {
  const def = gateraBattleDef(dim, node);
  const news: string[] = [];
  if (loot.opened) news.push(`${stageLabel(dim, loot.opened)} ABIERTA`);
  if (loot.openedNode) news.push(`${stageLabel(dim, loot.openedNode)} ABIERTO`);
  if (loot.ronda) news.push(loot.ronda.roundDone ? `${rondaOf(dim)?.name.toUpperCase() ?? 'RONDA'} COMPLETA` : `${rondaOf(dim)?.name.toUpperCase() ?? 'RONDA'}: ${loot.ronda.done} DE ${loot.ronda.of}`);
  if (loot.ronda?.revealed) news.push('¡DESVÍO REVELADO!');
  if (loot.photo) news.push('¡FOTO DEL VIAJE!');
  if (def?.kind === 'boss' && /^\d+$/.test(String(node))) {
    news.push(`${dimDef(dim).name}: CAJA VENCIDA`);
    const next = DIMS.find((d) => d.order === dimDef(dim).order + 1);
    if (next && !isOpen(next.id) && huellas() >= next.price.huellas) news.push(`YA ALCANZAN LAS HUELLAS: ${next.name}`);
  }
  // Parte III: a cat that joins with this win goes FIRST (the stamp shows 3 lines), the orbs it paid go last (p3cats.ts)
  news.unshift(...(loot.p3?.cats ?? []).map((id) => `¡${catDef(id).name.toUpperCase()} SE UNE!`));
  for (const o of loot.p3?.orbs ?? []) news.push(`+${o.n} ORBES DE ${catDef(o.species).name.toUpperCase()}`);
  return {
    stamp: def?.stamp,
    label: stageLabel(dim, node),
    name: def?.name ?? '',
    color: def?.kind === 'boss' ? 0xc8102e : def?.kind === 'elite' ? 0xc0628a : 0x2e7d4f,
    huellas: loot.huellas,
    news,
    small: `+${fmtGold(loot.gold)} oro · +${loot.scrap} chatarra`,
  };
}

/** rewards + flags of a node (the screen calls it once, from the battle's onEnd) */
export function applyGateraResult(dim: DimId, node: GateraNode, r: BattleResult): GateraLoot {
  const id = String(node);
  const isStage = /^\d+$/.test(id);
  const n = isStage ? Number(id) : 0;
  const def = gateraBattleDef(dim, node);
  const abs = absStage(6, 9) + (def?.goldStage ?? (n || 1));
  const m = G.s.momentum;
  const frontier = !nodeWonNow(dim, node);
  const loot: GateraLoot = { won: r.won, first: false, gold: 0, scrap: 0, huellas: 0, opened: null };
  G.s.stats.modulesDestroyed += r.modulesDestroyed;
  loot.gold = Math.round(battleGold(abs, G.goldPerSec, frontier, r.perfect, m) * (r.won ? 1 : 0.3));
  loot.scrap = Math.max(1, Math.round(battleScrap(abs, r.perfect, m) * (r.won ? 1 : 0.3)));
  if (r.won) {
    G.s.stats.victories++;
    G.purr('victory', 'combat');
    G.bump('victory');
    G.xp('victory');
    G.count('wins');
    if (r.perfect) G.count('wins_perfect');
    countCrewWins(crew(), r.finalBlow);
    if (isStage) {
      const w = recordWin(dim, n);
      loot.first = w.first;
      loot.huellas = w.huellas;
      const next = stageOf(dim, n + 1);
      if (w.first && next && clearedIn(dim) === n) loot.opened = next.playable ? n + 1 : null;
      const kind = stageOf(dim, n)?.kind;
      if (w.first && (kind === 'elite' || kind === 'boss')) loot.photo = addPhoto(gateraBattleId(dim, n));
    } else {
      // a locale of La Ronda counts in the round (and may reveal the detour); any node keeps its own wins
      if (isRondaLocale(dim, id)) loot.ronda = recordRondaWin(dim, id);
      const w = recordNodeWin(dim, id);
      loot.first = w.first;
      loot.huellas = w.huellas;
      if (w.first) loot.openedNode = nodesOf(dim).find((x) => (x.requires ?? []).includes(id) && x.crew?.length && nodeState(dim, x.id) === 'open')?.id ?? null;
    }
    // Parte III · the cats of the boxes: the node's cat (a captain, a rescue), the activity's orbs, a repeat's seeded orbs
    const wins = isStage && shapeOf(dim) === 'line' ? (gateras()?.stages[dim]?.wins[id] ?? 1) : (gateras()?.nodes?.[dim]?.[id] ?? 1);
    const p3 = p3OnGateraWin(dim, id, { first: loot.first, wins, ronda: !!loot.ronda });
    if (p3.cats.length || p3.orbs.length) loot.p3 = p3;
  } else {
    G.s.stats.defeats++;
    G.purr('defeat', 'combat');
    G.count('defeats');
  }
  G.add('gold', loot.gold, 'gatera');
  G.add('scrap', loot.scrap, 'gatera');
  G.recalc();
  notePeakIncome();
  G.save();
  return loot;
}

// ------------------------------------------------------------------ «Con el Bastión: 82 %» (mecanicas-v2/03 §2.1)
/** the best cats a ship would sail with (what autoCrew picks from the whole collection; nothing is written) */
function bestCrewFor(shipId: string): string[] {
  return [...G.s.cats]
    .sort((a, b) => catPow(b) - catPow(a))
    .slice(0, crewSize(shipId))
    .map((c) => c.uid);
}
/**
 * Run `fn` as if `shipId` sailed — its own crew, or its best cats when it has none — and put everything back
 * (synchronous; the save never sees it). What the estimate's «otro barco» builds its battles with.
 */
export function withShip<T>(shipId: string, fn: () => T): T {
  const sh = G.s.ship;
  const prevActive = sh.active;
  const had = Object.prototype.hasOwnProperty.call(sh.crew, shipId);
  const prevCrew = sh.crew[shipId];
  try {
    sh.active = shipId;
    if (!crew(shipId).length) sh.crew[shipId] = bestCrewFor(shipId);
    return fn();
  } finally {
    sh.active = prevActive;
    if (had) sh.crew[shipId] = prevCrew;
    else delete sh.crew[shipId];
  }
}
/** the other ships worth trying: owned, not the one sailing, not in repair */
export const otherShips = () => G.s.ship.owned.filter((id) => id !== G.s.ship.active && !isRepairing(id));
/** the advice margin: another ship must simulate this much better to be suggested */
export const SHIP_ADVICE_MARGIN = 0.15;
/** pure: the ship to suggest (the best, if it beats the current odds by the margin), else null */
export function pickShipAdvice(current: number | null, results: { ship: string; p: number | null }[], margin = SHIP_ADVICE_MARGIN): { ship: string; name: string; p: number } | null {
  if (current === null) return null;
  const best = results.filter((r): r is { ship: string; p: number } => r.p !== null).sort((a, b) => b.p - a.p)[0];
  return best && best.p - current >= margin - 1e-9 ? { ...best, name: shipName(best.ship) } : null;
}
/**
 * «Con el Bastión: 82 %»: simulate this node with each other ship you own (a short run each, after the main estimate:
 * idle time) and suggest the best one when it beats the current odds by 15+ points. The same sim as the battle.
 */
export async function shipAdvice(dim: DimId, node: GateraNode, current: number | null, sims = 20): Promise<{ ship: string; name: string; p: number } | null> {
  if (current === null || current >= 1 - SHIP_ADVICE_MARGIN) return null;
  const { simulateEstimate } = await import('./estimate');
  const key = gateraBattleId(dim, node);
  const results: { ship: string; p: number | null }[] = [];
  for (const ship of otherShips()) {
    try {
      const build = () => withShip(ship, () => buildGateraBattle(dim, node, () => undefined));
      const est = await withShip(ship, () => simulateEstimate(`${key}@${ship}`, build, undefined, sims));
      results.push({ ship, p: est.p });
    } catch {
      results.push({ ship, p: null });
    }
  }
  return pickShipAdvice(current, results);
}
