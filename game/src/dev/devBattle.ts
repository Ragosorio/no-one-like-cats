import { BattleSpec } from '../scenes/BattleScene';
import { BLUEPRINTS } from '../battle/blueprints';
import { BattleCatDef, ShotDef } from '../battle/types';

const S: Record<string, ShotDef> = {
  fire: { id: 'hairball', name: 'Bola de Pelo Ígnea', element: 'fire', trajectory: 'bounce', power: 1, radius: 75, statuses: [{ id: 'burning', turns: 2 }], preview: 0.5 },
  water: { id: 'torpedo', name: 'Torpedo Gelatina', element: 'water', trajectory: 'torpedo', power: 0.9, radius: 70, statuses: [{ id: 'wet', turns: 3 }], preview: 0.45 },
  electric: { id: 'beam', name: 'Rayo Bigote', element: 'electric', trajectory: 'beam', power: 0.75, radius: 55, preview: 0.6, catMul: 0.9 },
  ice: { id: 'shards', name: 'Esquirlas', element: 'ice', trajectory: 'spread', projectiles: 3, spreadDeg: 6, power: 0.55, radius: 50, statuses: [{ id: 'frozen', turns: 2 }], preview: 0.4 },
  earth: { id: 'rock', name: 'Piedrazo', element: 'earth', trajectory: 'heavy', power: 1.25, radius: 80, preview: 0.35 },
  cosmic: { id: 'orb', name: 'Orbe Gravitón', element: 'cosmic', trajectory: 'orb', power: 1.1, radius: 105, preview: 0.4 },
  nature: { id: 'seed', name: 'Semilla Brava', element: 'nature', trajectory: 'seed', power: 0.7, radius: 70, statuses: [{ id: 'rooted', turns: 3 }], preview: 0.45 },
  magic: { id: 'rune', name: 'Runa Teledirigida', element: 'magic', trajectory: 'homing', power: 0.8, radius: 60, statuses: [{ id: 'cursed', turns: 2 }], preview: 0.3 },
};
const ULT: ShotDef = { id: 'starfall', name: 'STARFALL', shout: '¡SUPERNOVA DE ESTAMBRE!', element: 'cosmic', trajectory: 'meteor', power: 3.2, radius: 150, limits: { usesPerBattle: 1 }, preview: 0.3 };
const ULT_FIRE: ShotDef = { id: 'hellball', name: 'HELLBALL', shout: '¡HELLBALL!', element: 'fire', trajectory: 'cluster', projectiles: 4, power: 1.4, radius: 90, statuses: [{ id: 'burning', turns: 3 }], preview: 0.3 };

const cat = (uid: string, slug: string, name: string, el: keyof typeof S, atk = 100, hp = 160, extra: Partial<BattleCatDef> = {}): BattleCatDef => ({
  uid, catId: slug, slug, name, elements: [S[el].element], level: 5, stars: 1, hp, atk, shot: S[el], ...extra,
});

export function devBattle(onEnd: BattleSpec['onEnd']): BattleSpec {
  return {
    playerName: 'La Sardina Furiosa',
    enemyName: 'El Patito Pirata',
    captain: 'Capitán Bigotes',
    captainLine: '¡Ríndanse, gatitos! …por favor.',
    difficulty: 'normal',
    player: {
      blueprint: BLUEPRINTS.sparrow, hpMul: 1, cannonAtk: 70,
      cats: [
        cat('p1', 'canelo_cozy_cat', 'Canelo', 'fire', 110, 170, { ultimate: ULT_FIRE }),
        cat('p2', 'jelly_aquatic_cat', 'Marina Gel', 'water'),
        cat('p3', 'mecha_neon_cat', 'Volt Mecha', 'electric', 95, 150, { ultimate: ULT }),
      ],
    },
    enemy: {
      blueprint: BLUEPRINTS.sparrow, hpMul: 0.9, cannonAtk: 60,
      cats: [
        cat('e1', 'fossilstone_guardian_cat', 'Relik', 'earth', 90),
        cat('e2', 'selene_moonlit_cat', 'Selene', 'ice', 85),
        cat('e3', 'neon_glitch_cat', 'Pixel', 'magic', 85),
      ],
    },
    onEnd,
  };
}
