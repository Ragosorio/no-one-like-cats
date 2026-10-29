/**
 * DESPUÉS DE LA PARTE III · a post MULTIDIMENSIONAL in battle and in the reveal, before and after its power / universe
 * land (state/sys/postp3.ts; the PENDING lists of tests/multidimPowers.test.ts and tests/p3MultiverseReveal.test.ts).
 * The cat is a STUB (tests/helpers/postStubs.ts), and so is its power (Homiau's, borrowed for the test only).
 *
 *   · PENDING (no power, no universe): it fights with its generic ultimate on both sides; no stamp, no rule; the reveal
 *     and the card fall back to the plain ones (signatureOf → null)
 *   · with its power: it wakes in YOUR crew exactly like a Parte III one (stamp, feats, cap), and on the enemy side the
 *     whole battle replays identically with the powers on or off
 */
import { afterEach, describe, expect, it } from 'vitest';

const { ROLE_BY_ID, catDef } = await import('../src/data/content');
const MD = await import('../src/battle/multidim');
const { multidimPower } = await import('../src/data/multidimPowers');
const { ULTS } = await import('../src/battle/ults');
const { makeBattle, autoBattle } = await import('../src/battle/autoplay');
const { battleCatFrom } = await import('../src/battle/catShots');
const { BLUEPRINTS } = await import('../src/battle/blueprints');
const { aimFrom, DIFFICULTY } = await import('../src/battle/ai');
const { signatureOf } = await import('../src/fx/sequences/multiverse');
const { isPostCat } = await import('../src/state/sys/multidim');
const { stubPostCat, injectPostCats } = await import('./helpers/postStubs');
type Spec = import('../src/scenes/BattleScene').BattleSpec;
type Ev = import('../src/battle/sim').BattleEvent;

const ID = 'zz_post_md';
const undo: (() => void)[] = [];
afterEach(() => {
  for (const u of undo.splice(0).reverse()) u();
  delete MD.MD_ULTS[ID];
  MD.MD_TUNE.on = true;
});
const inject = () => undo.push(injectPostCats([stubPostCat(ID, 'x_homiau', 'casino:gacha:holo')]));

function cat(uid: string, species: string) {
  return battleCatFrom({ uid, species, name: species, level: 30, stars: 1, dmgMul: 1, hpMul: 1 }, ROLE_BY_ID.get(catDef(species).role)?.hp ?? 100);
}
function spec(enemySide = false): Spec {
  const md = cat(enemySide ? 'e0' : 'p0', ID);
  const mine = enemySide ? [cat('p0', 'c_canelo'), cat('p1', 'c_gelatino'), cat('p2', 'r_magmito')] : [md, cat('p1', 'c_canelo'), cat('p2', 'c_gelatino')];
  const theirs = enemySide ? [md, cat('e1', 'c_brote'), cat('e2', 'c_musgo')] : [cat('e0', 'c_brote'), cat('e1', 'c_musgo'), cat('e2', 'r_magmito')];
  return {
    player: { blueprint: BLUEPRINTS.sparrow, hpMul: 3, cats: mine, cannonAtk: 30 },
    enemy: { blueprint: BLUEPRINTS.sparrow, hpMul: 3, cats: theirs, cannonAtk: 30 },
    playerName: 'Tú',
    enemyName: 'Prueba',
    difficulty: 'normal',
    onEnd: () => undefined,
  } as Spec;
}
/** fire the stub's ultimate from `side` at the other ship's middle; the events */
function fireUlt(side: 0 | 1, seed = 77) {
  const b = makeBattle(spec(side === 1), seed);
  b.startTurn(0);
  if (side === 1) {
    b.endTurn();
    b.startTurn(1);
  }
  const me = b.sides[side].cats[0];
  me.ultCharge = 1;
  const a = aimFrom(b, side, b.muzzle(side, me.def.uid), me.def.ultimate!, 1, 0, b.shipCenter(1 - side));
  const r = b.fire(side, me.def.uid, a.angle, a.power, true);
  return { b, me, ev: r.events as Ev[], paths: r.paths };
}
const stamped = (ev: Ev[]) => ev.some((e) => e.k === 'ultfx' && e.fx === 'md' && e.uid === ID);
const finite = (ev: Ev[]) => ev.every((e) => Object.values(e).every((v) => typeof v !== 'number' || Number.isFinite(v)));
/** a whole auto battle, logged turn by turn */
function replay(enemySide: boolean) {
  const log: string[] = [];
  const s = spec(enemySide);
  (enemySide ? s.enemy : s.player).cats[0].ultStart = 1;
  const res = autoBattle(s, DIFFICULTY.normal, 4242, 12, (bb, side, shot) => log.push(`${bb.turn}|${side}|${shot}|${bb.sides[0].ship.cells().reduce((a, c) => a + c.hp, 0)}`));
  return { log, res };
}

describe('a post Multidimensional in PENDING (no power, no universe yet)', () => {
  it('is a real post cat with no power, no signature ultimate and no universe', () => {
    inject();
    expect(isPostCat(catDef(ID))).toBe(true);
    expect(multidimPower(ID)).toBeNull();
    expect(MD.MD_ULTS[ID]).toBeUndefined();
    expect(ULTS[ID]).toBeUndefined();
    // the reveal (catReveal) and the card (multidimCard) take the plain path with no universe
    expect(signatureOf(ID)).toBeNull();
  });
  it('fights with its generic ultimate on both sides: no stamp, finite, the same with the powers off', () => {
    inject();
    for (const side of [0, 1] as const) {
      const on = fireUlt(side);
      expect(MD.mdOn(on.b, on.me)).toBe(false);
      expect(stamped(on.ev), `side ${side}`).toBe(false);
      expect(finite(on.ev)).toBe(true);
      expect(MD.mdFeats(on.b)).toEqual({});
      MD.MD_TUNE.on = false;
      const off = fireUlt(side);
      MD.MD_TUNE.on = true;
      expect(JSON.stringify(off.ev)).toBe(JSON.stringify(on.ev));
    }
    expect(replay(false)).toEqual((() => {
      MD.MD_TUNE.on = false;
      try {
        return replay(false);
      } finally {
        MD.MD_TUNE.on = true;
      }
    })());
  });
});

describe('a post Multidimensional with its power: the same rules as the Parte III ones', () => {
  it('wakes in YOUR crew: the stamp, its feat, within the cap', () => {
    inject();
    MD.MD_ULTS[ID] = MD.MD_ULTS.x_homiau;
    const b0 = makeBattle(spec(false), 77);
    const max = b0.sides[1].ship.initialMax?.[0] ?? 0;
    const { b, me, ev, paths } = fireUlt(0);
    expect(MD.mdOn(b, me)).toBe(true);
    expect(stamped(ev)).toBe(true);
    expect(MD.mdFeats(b)[`md_${ID}`]).toBe(1);
    expect(finite(ev)).toBe(true);
    for (const p of paths) for (const q of p.points) expect(Number.isFinite(q.x) && Number.isFinite(q.y)).toBe(true);
    const struct = ev.reduce((a, e) => a + (e.k === 'cell' && e.side === 1 ? e.dmg : 0), 0);
    expect(struct).toBeLessThanOrEqual(Math.round(max * MD.MD_TUNE.frac) + 1);
  });
  it('on the enemy side it plays exactly as before: no stamp, and the whole battle is identical with the powers off', () => {
    inject();
    MD.MD_ULTS[ID] = MD.MD_ULTS.x_homiau;
    const f = fireUlt(1);
    expect(MD.mdOn(f.b, f.me)).toBe(false);
    expect(stamped(f.ev)).toBe(false);
    const on = replay(true);
    MD.MD_TUNE.on = false;
    let off: ReturnType<typeof replay>;
    try {
      off = replay(true);
    } finally {
      MD.MD_TUNE.on = true;
    }
    expect(on.log).toEqual(off.log);
    expect(on.res).toEqual(off.res);
  });
});
