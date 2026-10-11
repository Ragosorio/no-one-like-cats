/**
 * WHEN I LOSE — the «Momento musical» of H35 (docs/part-ii/29 §14). Registered here (pure: no Pixi).
 *
 * MOMENTO: when_i_lose (H35, phase change) — El Bibliotecario Ahogado: phase 1 «La Sala de Lectura» → Momento →
 * phase 2 «La memoria del Archivo». The phase split is presentation only (state/sys/rupturas.ts: no environment, no
 * rule changes; tests/momentosWIL.test.ts proves the same fight with and without it). It plugs into the FASES interlude
 * hook (battle/fases.ts registerFaseInterlude): battle/fx/fasesFx.ts awaits it after the layer swap, BattleScene waits
 * for that staging before the next turn.
 */
import { registerMomento } from '../../registry';
import { registerFaseInterlude } from '../../../battle/fases';
import { WHEN_I_LOSE } from './score';

registerMomento(WHEN_I_LOSE);

export const H35_MOMENTO = { battle: 'ruptura_bibliotecario', fase: 'memoria', song: 'when_i_lose' } as const;
registerFaseInterlude(H35_MOMENTO.battle, H35_MOMENTO.fase, () => import('./hook').then((m) => m.playH35Interlude()));
