/**
 * PROBAR (GDD 2.8): practice battle against a training dummy ("El Costal") with your active ship,
 * its layout, weapons, crew and gear. No loot, no Ronroneo. On end → back to the island and the
 * Astillero reopens with a short test report.
 */
import { Container } from 'pixi.js';
import gsap from 'gsap';
import { scenes } from '../../core/scenes';
import { music } from '../../core/music';
import type { BattleResult, BattleSpec } from '../../scenes/BattleScene';
import type { ShipBlueprint } from '../../battle/ship';
import { battleCatFrom } from '../../battle/catShots';
import { styleFor } from '../../battle/anime';
import { G } from '../../state/game';
import { catDef, ROLE_BY_ID } from '../../data/content';
import { autoCrew, cannonShotsFor, crew, mk, playerBlueprint, shipName, shipPower } from '../../state/sys/ship';
import { cat as getCat, catHpBase, catPow } from '../../state/sys/cats';
import { gearBattleExtras, gearBattleMods } from '../../state/sys/gear';

export interface TrialReport {
  won: boolean;
  turns: number;
  damage: number;
  modules: number;
  ship: string;
}

/** the practice target: a fat barge with a painted bullseye, one cabin and a core, no cannons */
const DUMMY: ShipBlueprint = {
  cols: 14,
  rows: 9,
  hull: [
    '..............',
    '..............',
    '..............',
    '..............',
    '..WWWWWWWWWW..',
    'WWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWW',
    '.WWWWWWWWWWWW.',
    '...WWWWWWWW...',
  ],
  modules: [
    { kind: 'mast', x: 7, y: 0, w: 1, h: 4 },
    { kind: 'catroom', x: 3, y: 2, w: 2, h: 2, slot: 0 },
    { kind: 'powder', x: 10, y: 3, w: 1, h: 1 },
    { kind: 'core', x: 6, y: 5, w: 2, h: 2 },
  ],
};

let janitor = false;
/** same safety net as battleFlow: kill tweens whose targets were destroyed before their first render */
function installTweenJanitor() {
  if (janitor) return;
  janitor = true;
  window.setInterval(() => {
    for (const tw of gsap.globalTimeline.getChildren(true, true, false)) {
      const targets = (tw as gsap.core.Tween).targets?.() as unknown[] | undefined;
      if (targets?.some((x) => x instanceof Container && x.destroyed)) tw.kill();
    }
  }, 250);
}

export function buildTrial(onEnd: (r: BattleResult) => void): BattleSpec {
  const shipId = G.s.ship.active;
  if (!crew(shipId).length) autoCrew(shipId);
  const uids = crew(shipId);
  const gm = gearBattleMods(shipId);
  const gx = gearBattleExtras(shipId);
  const SP = shipPower(shipId);
  const avg = uids.reduce((a, u) => a + catPow(getCat(u)!), 0) / Math.max(1, uids.length);
  const cats = uids.map((u) => {
    const c = getCat(u)!;
    const share = Math.max(0.7, Math.min(1.4, catPow(c) / avg));
    return battleCatFrom({ uid: c.uid, species: c.species, name: c.name, level: c.level, stars: c.stars, dmgMul: share * gm.catDmgMul, hpMul: share }, catHpBase(c));
  });
  const dummySp = 'c_guijarro';
  const dd = catDef(dummySp);
  const dummy = battleCatFrom({ uid: 'e0', species: dummySp, name: 'Don Costal', level: 1, stars: 1, dmgMul: 0.06, hpMul: 4 }, ROLE_BY_ID.get(dd.role)?.hp ?? 100);
  const { bp, hpMul } = playerBlueprint(shipId);
  return {
    playerName: G.s.flags.shipName ? String(G.s.flags.shipName) : shipName(shipId),
    enemyName: 'Blanco de Prácticas',
    captain: 'Don Costal',
    captainLine: 'Soy un costal de paja, capi. Pégame con todo. No siento nada… creo.',
    difficulty: 'easy',
    palette: { skyTop: 0x0d110f, skyBottom: 0x204a7a, sea: 0x1c3a51, seaDark: 0x172b35 },
    seed: Date.now() % 1e9,
    player: { blueprint: bp, hpMul: hpMul * gm.hpMul, cats, cannonAtk: Math.round(40 * 1.6 * (1 + 0.1 * (mk('weapon') - 1)) * gm.cannonAtkMul), cannonShots: cannonShotsFor(shipId), ultStart: gm.ultStart },
    enemy: { blueprint: DUMMY, hpMul: 1.25, cats: [dummy], cannonAtk: 0 },
    displayMul: Math.max(1, SP / 2) / 10,
    meta: { zone: 1, stage: 0, key: 'trial', boss: false, ep: SP, sp: SP, weaponMk: mk('weapon'), special: 'trial', gearNotes: gm.notes, conductionBonus: gx.conductionJumps, previewBonus: gx.previewBonus },
    playerStyle: styleFor('player', { hullMk: mk('hull') }),
    enemyStyle: 'raft',
    onEnd,
  } as BattleSpec;
}

/** launch the practice battle; when it ends, go home and reopen the Astillero with a report */
export async function startTrial() {
  installTweenJanitor();
  const shipId = G.s.ship.active;
  // C12 "Astillero creativo": edit a layout and test it
  const yard = ((G.s.ext ??= {}).yard ??= {}) as { editedSinceTrial?: boolean };
  if (yard.editedSinceTrial) {
    G.count('edit_layout');
    yard.editedSinceTrial = false;
  }
  G.count('trial_battles');
  G.save();
  music.play('battle');
  const { BattleScene } = await import('../../scenes/BattleScene');
  let ended = false;
  const spec = buildTrial((r) => {
    if (ended) return;
    ended = true;
    const report: TrialReport = { won: r.won, turns: r.turns, damage: r.damageDealt, modules: r.modulesDestroyed, ship: shipId };
    void (async () => {
      const { goIsland } = await import('../../app/flow');
      await goIsland();
      const { openShipyard } = await import('../Shipyard');
      openShipyard({ report });
    })();
  });
  await scenes.go(new BattleScene(spec), 'blocks');
}
