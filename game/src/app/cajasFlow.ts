/**
 * Parte III · the flow of the CARTA DE LAS CAJAS (scenes never import each other: this glues them).
 *
 *   goCajas()               the Carta (scenes/GaterasMapScene.ts)
 *   startGateraBattle()     (repair gate →) the spec + its estimate → PRESENTACIÓN (app/stageIntro.ts: a film, or the
 *                           animated card) → BattleScene → applyGateraResult → back to the Carta, which inks the route
 *   cajasGoal()             the IR of a pinned mission: H68 (open the gatera) and H69 (win B-5) go to the Carta
 *   initCajas()             once at boot: the cat flap at your faro's base (A's prop in ui/story/o4Pagina.ts) leads to
 *                           the Carta once the Borracha is open (setGateraTap)
 *
 * The music of the box: `drunck.barra` on the Carta and `drunck.battle` in its battles (data/music/battles.json). Until
 * D delivers them in tracks.json, nothing fails: the Carta keeps the music that was playing (silence never breaks).
 */
import type { Graphics } from 'pixi.js';
import { scenes } from '../core/scenes';
import { music } from '../core/music';
import { G } from '../state/game';
import type { BattleResult } from '../scenes/BattleScene';
import { GATERA_BATTLE_RE, notePeakIncome, type DimId } from '../state/sys/gateras';
import { setGateraTap } from '../ui/story/o4Pagina';

/** what the Carta animates when it opens after a battle (like campaignMemo for the Diario del Mar) */
export const cajasMemo: { dim: DimId | null; cleared: number | null; opened: number | null; loot: import('../state/sys/gaterasBattles').GateraLoot | null; n: number | null; node?: string | null } = {
  dim: null,
  cleared: null,
  opened: null,
  loot: null,
  n: null,
  node: null,
};

export async function goCajas(transition: 'blocks' | 'none' = 'blocks') {
  // Maneki's price follows the highest income seen (opening the Carta is when it's noted: mecanicas-v2/03 §1.4)
  notePeakIncome(true);
  const { GaterasMapScene } = await import('../scenes/GaterasMapScene');
  music.play('island');
  await scenes.go(new GaterasMapScene(), transition);
}

let running = false;
/** a stage of a box: the same crew as the campaign (change it from the card), the same repair gate */
/** a stage (`3`) or any node of the Carta (`d1` a detour, `r2` a locale of La Ronda) */
export async function startGateraBattle(dim: DimId, n: number | string) {
  if (running) return;
  const { isRepairing } = await import('../state/sys/campaign');
  if (isRepairing()) {
    const { openRepairGate } = await import('../battle/ui/repairGate');
    if (!(await openRepairGate())) return;
  }
  const [{ BattleScene }, { buildGateraBattle, applyGateraResult }, { autoCrew, crew }, { simulateEstimate }, { stageIntro }] = await Promise.all([
    import('../scenes/BattleScene'),
    import('../state/sys/gaterasBattles'),
    import('../state/sys/ship'),
    import('../state/sys/estimate'),
    import('./stageIntro'),
  ]);
  if (!crew().length) autoCrew();
  running = true;
  let ended = false;
  // the battle is built BEFORE its presentation: the spec that plays is the one estimated (03 §2.3)
  const spec = buildGateraBattle(dim, n, (r: BattleResult) => {
    if (ended) return;
    ended = true;
    const loot = applyGateraResult(dim, n, r);
    const stage = typeof n === 'number' || /^\d+$/.test(n) ? Number(n) : null;
    Object.assign(cajasMemo, { dim, n: stage, node: String(n), loot, cleared: loot.first && stage !== null ? stage : null, opened: loot.opened });
    void goCajas().finally(() => (running = false));
  });
  // the honest estimate runs while the presentation plays (the same run as the Carta's card: same key, shared)
  let est: import('../state/sys/estimate').Estimate | null = null;
  void simulateEstimate(spec.meta?.special ?? `${dim}_${n}`, () => buildGateraBattle(dim, n, () => undefined), (e) => (est = e)).catch(() => undefined);
  // PRESENTACIÓN: a film if CINE registered one for this stage, else the animated card; seen before → straight in
  if ((await stageIntro(dim, n, spec, () => est)) === 'back') {
    running = false;
    return;
  }
  music.play('battle');
  await scenes.go(new BattleScene(spec), 'blocks');
  void battleSong(spec.meta?.special ?? '');
}

/**
 * The box's battle song (D's `drunck.battle`). A music plan in data/music/battles.json wins when there is one (the
 * battle engine cues it, with its reactions); without one, a plain loop of the song — and without the song, nothing:
 * the battle keeps the music that was playing.
 */
async function battleSong(battleId: string) {
  try {
    const [{ resolvePlan }, { hasTrack }, { audioApi }] = await Promise.all([import('../battle/music/plan'), import('../audio/catalog'), import('../audio/api')]);
    if (resolvePlan({ battleId, kind: 'story', activeMissions: [], crewSpecies: [] }).source === 'battle') return;
    if (hasTrack('drunck.battle')) audioApi.cue('drunck.battle', { loop: true, fadeIn: 0.8, quantize: 'now' });
  } catch (e) {
    console.warn('[cajas] sin música de batalla de la Borracha', e);
  }
}

/** H67 pending after a reload: the alley again (lazy, like every caja scene) */
async function resumeH67() {
  const { resumeGateras } = await import('./gaterasFlow');
  await resumeGateras();
}

/** the IR of a pinned mission: true when the Carta handles it (H68: the gatera · H69: B-5); H67 resumes the alley */
export function cajasGoal(goal: { type?: string; feature?: unknown; battle?: unknown }): boolean {
  const f = String(goal.feature ?? '');
  const b = String(goal.battle ?? '');
  if (goal.type === 'use_feature' && f === 'p3_salida') {
    void resumeH67();
    return true;
  }
  // the Carta handles the gateras, its battles and the Acto I scenes that play on it (H70 the Donería, H72 the morning)
  if ((goal.type === 'use_feature' && (f.startsWith('p3_gatera') || f === 'p3_borron' || f === 'p3_resaca')) || (goal.type === 'win_battle' && GATERA_BATTLE_RE.test(b))) {
    void goCajas();
    return true;
  }
  return false;
}

/** a cat pawprint (one pad + four toes), centered at x, y */
export function paw(g: Graphics, x: number, y: number, s: number, color: number, alpha = 1) {
  g.ellipse(x, y + 4 * s, 9 * s, 7.5 * s).fill({ color, alpha });
  for (const [dx, dy] of [
    [-9, -6],
    [-3.5, -11],
    [3.5, -11],
    [9, -6],
  ])
    g.ellipse(x + dx * s, y + dy * s, 3.4 * s, 4.2 * s).fill({ color, alpha });
}

let inited = false;
/**
 * Once at boot: the cat flap at your faro's base (A's prop, ui/story/o4Pagina.ts) leads to the Carta once the Borracha
 * is open (before that, A's own line answers the tap).
 */
export function initCajas() {
  if (inited) return;
  inited = true;
  setGateraTap(() => {
    // H66 waits: the flap is the same door as the page and the faro (ui/story/gaterasCines.ts enterH66)
    if (G.s?.missions?.active?.includes('H66')) {
      void import('../ui/story/gaterasCines').then((m) => m.enterH66());
      return true;
    }
    // a reload between the bar and the alley (H67 active, its walk not played yet): the gatera takes you back to the
    // alley — the story never deadlocks (app/gaterasFlow.ts resumeGateras)
    if (G.s?.missions?.active?.includes('H67')) {
      void resumeH67();
      return true;
    }
    const ext = G.s?.ext?.gateras as { open?: Record<string, unknown> } | undefined;
    if (!ext?.open || !Object.keys(ext.open).length) return false;
    void goCajas();
    return true;
  });
}
