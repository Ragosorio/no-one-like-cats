/**
 * DEV ONLY — ?scene=battle&music=liky_fight: the choreographed battle-music test fight. It plays the battles.json plan
 * `dev_<music>` (dev_liky_fight: LIKY FIGHT + SINCRO) with a crew that holds the Fuego + Tormenta combo, so the
 * owner's signature battle can be seen before its story mission exists. Nothing here ships to players.
 */
import type { BattleSpec } from '../scenes/BattleScene';
import { BLUEPRINTS } from '../battle/blueprints';
import type { BattleCatDef, ShotDef } from '../battle/types';

const SHOT: Record<string, ShotDef> = {
  fire: { id: 'hairball', name: 'Bola de Pelo Ígnea', element: 'fire', trajectory: 'bounce', power: 1, radius: 75, statuses: [{ id: 'burning', turns: 2 }], preview: 0.5 },
  electric: { id: 'beam', name: 'Rayo Bigote', element: 'electric', trajectory: 'beam', power: 0.8, radius: 55, preview: 0.6, catMul: 0.9 },
  water: { id: 'torpedo', name: 'Torpedo Gelatina', element: 'water', trajectory: 'torpedo', power: 0.9, radius: 70, statuses: [{ id: 'wet', turns: 3 }], preview: 0.45 },
  earth: { id: 'rock', name: 'Piedrazo', element: 'earth', trajectory: 'heavy', power: 1.2, radius: 80, preview: 0.35 },
  magic: { id: 'rune', name: 'Runa Teledirigida', element: 'magic', trajectory: 'homing', power: 0.8, radius: 60, preview: 0.3 },
  ice: { id: 'shards', name: 'Esquirlas', element: 'ice', trajectory: 'spread', projectiles: 3, spreadDeg: 6, power: 0.55, radius: 50, preview: 0.4 },
};
const ULT_FIRE: ShotDef = { id: 'hellball', name: 'HELLBALL', shout: '¡HELLBALL!', element: 'fire', trajectory: 'cluster', projectiles: 4, power: 1.4, radius: 90, statuses: [{ id: 'burning', turns: 3 }], preview: 0.3 };

const cat = (uid: string, slug: string, name: string, el: keyof typeof SHOT, atk: number, hp: number, extra: Partial<BattleCatDef> = {}): BattleCatDef => ({
  uid,
  catId: slug,
  slug,
  name,
  elements: [SHOT[el].element],
  level: 20,
  stars: 2,
  hp,
  atk,
  shot: SHOT[el],
  ...extra,
});

/** spec factory for ?scene=battle&music=<id> (plan `dev_<id>`, or `<id>` itself when it is a battle plan) */
export function devMusicBattle(music: string): (onEnd: BattleSpec['onEnd']) => BattleSpec {
  const plan = music.startsWith('dev_') || music.startsWith('ruptura_') || music.startsWith('cielo_') || music.startsWith('umbral_') ? music : `dev_${music}`;
  return (onEnd) => ({
    playerName: 'La Sardina Furiosa',
    enemyName: 'La Tambora Pirata',
    captain: 'Capitana Güira',
    captainLine: '¡Esto se baila, gatitos!',
    difficulty: 'normal',
    seed: 131,
    player: {
      blueprint: BLUEPRINTS.sparrow,
      // a showcase: a decent aim should reach the victory bar (the AI-vs-AI test fight loses ~turn 9 at 1.4)
      hpMul: 1.8,
      cannonAtk: 60,
      cats: [
        cat('p1', 'canelo_cozy_cat', 'Canelo', 'fire', 115, 260, { ultimate: ULT_FIRE }),
        cat('p2', 'stormcloud_elemental_cat', 'Nimbo', 'electric', 105, 230),
        cat('p3', 'jelly_aquatic_cat', 'Marina Gel', 'water', 95, 240),
      ],
    },
    enemy: {
      blueprint: BLUEPRINTS.sparrow,
      hpMul: 1.35,
      cannonAtk: 55,
      cats: [
        cat('e1', 'zarpa_pirate_cat', 'Zarpa', 'earth', 80, 300),
        cat('e2', 'tamborin_drum_cat', 'Tamborín', 'magic', 75, 280),
        cat('e3', 'escarcha_frost_cat', 'Escarcha', 'ice', 75, 280),
      ],
    },
    meta: { zone: 1, stage: 1, key: plan, boss: false, ep: 0, sp: 0, special: plan },
    // the plan's battle rule where it has one (H35's noise), so its music reaction can be seen here too
    rules: plan === 'ruptura_bibliotecario' ? { noise: { side: 1 } } : undefined,
    suddenDeath: 0,
    onEnd,
  });
}
