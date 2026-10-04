/** Campaign battle flow: pre-battle → battle → results (owned by the campaign UI module). Placeholder. */
import { scenes } from '../core/scenes';
import { BattleScene } from '../scenes/BattleScene';
import { buildBattle, applyResult } from '../state/sys/campaign';
import { goMap } from './flow';
import { music } from '../core/music';

export async function startCampaignBattle(zone: number, stage: number) {
  music.play('battle');
  const spec = buildBattle(zone, stage, (r) => {
    applyResult(zone, stage, r);
    goMap();
  });
  await scenes.go(new BattleScene(spec), 'blocks');
}
