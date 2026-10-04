/**
 * Island → Duelo de Gatos → island. Used by battle secrets (Santuario Sellado → Guardián Musgoso).
 * Same glue pattern as app/battleFlow (lazy imports, scenes never import each other): build the duel
 * with campaign.buildDuel, apply campaign.applySpecialResult, resolve the secret, return to the island
 * where IslandScene plays the reveal (takeDuelOutcome).
 */
import { G } from '../state/game';
import { resolveBattleSecret, SecretReward } from '../state/sys/secrets';
import { goIsland } from '../app/flow';

export interface DuelOutcome {
  battleId: string;
  won: boolean;
  reward: SecretReward | null;
  n: number | null;
}
let pending: DuelOutcome | null = null;

/** IslandScene calls this on enter to celebrate (or console) the duel that just ended */
export function takeDuelOutcome(): DuelOutcome | null {
  const p = pending;
  pending = null;
  return p;
}

export async function specialExists(battleId: string) {
  const camp = await import('../state/sys/campaign');
  return !!camp.SPECIALS[battleId];
}

export async function startIslandDuel(battleId: string, secretN: number | null): Promise<boolean> {
  const camp = await import('../state/sys/campaign');
  if (!camp.SPECIALS[battleId]) return false;
  const [{ scenes }, { BattleScene }, { music }] = await Promise.all([import('../core/scenes'), import('../scenes/BattleScene'), import('../core/music')]);
  let ended = false;
  const spec = camp.buildDuel(battleId, (r) => {
    if (ended) return;
    ended = true;
    camp.applySpecialResult(battleId, r);
    const reward = r.won ? resolveBattleSecret(battleId) : null;
    pending = { battleId, won: r.won, reward, n: secretN };
    G.save();
    void goIsland();
  });
  music.play('battle');
  await scenes.go(new BattleScene(spec), 'blocks');
  return true;
}
