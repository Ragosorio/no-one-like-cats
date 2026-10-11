/**
 * CIRCUS MALUS — the «Momento musical» of H62 (docs/part-ii/29 §15). Registered here (pure: no Pixi).
 *
 * MOMENTO: circus_malus (H62, phase change) — Los Correctores: «La Corrección» → Momento → «El Plan». It plugs into the
 * FASES interlude hook (battle/fases.ts registerFaseInterlude, key H62_MOMENTO in state/sys/rupturasO4Battles.ts):
 * battle/fx/fasesFx.ts awaits it after the layer swap, BattleScene waits for that staging before the next turn. The sim
 * already applied the phase: presentation only (tests/momentoCircusMalus.test.ts proves the same fight with and
 * without it). Not through BattleScene's own momentoForFase path (no `battle` in the def): it plays once.
 */
import { registerMomento } from '../../registry';
import { registerFaseInterlude } from '../../../battle/fases';
import { CIRCUS_MALUS } from './score';

registerMomento(CIRCUS_MALUS);

/** = H62_MOMENTO in state/sys/rupturasO4Battles.ts (kept equal by tests/momentoCircusMalus.test.ts; not imported here so
 * this registry stays free of the game state) */
export const CIRCUS_HOOK = { battle: 'umbral_correctores', fase: 'el_plan', song: 'circus_malus' } as const;
registerFaseInterlude(CIRCUS_HOOK.battle, CIRCUS_HOOK.fase, () => import('./hook').then((m) => m.playH62Interlude()));
