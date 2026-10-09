/**
 * El Podio fairness (2026-10-08, "los gatos que consigo después nunca pueden alcanzar a los primeros"):
 * every cat gets its own first win over every rival the account already beat (full XP + orbs), while the
 * account-unique rewards (champion prize cats, champion gems, frontier gem rolls, ladder progress) stay once.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { G, newGame } from '../src/state';
import type { OwnedCat } from '../src/state/game';
import { adopt } from '../src/state/sys/cats';
import {
  applyDuel,
  catBeat,
  catState,
  catchupMult,
  championPrize,
  duelOutlook,
  levelCap,
  nextBout,
  pendingFor,
  ps,
  reachable,
  settleBank,
  winKind,
  winXp,
  xpNeed,
} from '../src/state/sys/podio';
import PB from '../src/data/podio.json';

const BOUTS = PB.ladder.bouts_per_league;

/** a freshly adopted cat, strong enough on the island that the level cap doesn't get in the way */
function lateCat(species = 'c_chispa', level = 60, stars = 6): OwnedCat {
  const r = adopt(species, { free: true });
  const c = r.cat ?? G.s.cats.find((x) => x.species === species)!;
  c.level = level;
  c.stars = stars;
  return c;
}

/** account at the start of `league` with every earlier league crowned */
function climbTo(league: number) {
  const p = ps();
  p.league = league;
  p.bout = 0;
  p.champions = Array.from({ length: league - 1 }, (_, i) => i + 1);
}

describe('El Podio: catch-up for cats obtained later', () => {
  beforeEach(() => {
    newGame();
    G.flag('podio_unlocked');
  });

  it('a late cat can fight every rival and champion of past leagues', () => {
    climbTo(4);
    expect(reachable(1, BOUTS - 1)).toBe(true); // league 1 champion
    expect(reachable(3, BOUTS - 1)).toBe(true);
    expect(reachable(4, 0)).toBe(true); // frontier
    expect(reachable(4, 1)).toBe(false); // not reached yet
    const c = lateCat();
    expect(pendingFor(c.uid)).toHaveLength(3 * BOUTS + 1);
    expect(nextBout(1, BOUTS - 1)).toEqual({ lg: 2, bout: 0 }); // after a past champion: next league
    expect(nextBout(3, BOUTS - 1)).toEqual({ lg: 4, bout: 0 });
  });

  it('first win of THIS cat over a past champion pays full XP + orbs once; repeats pay less', () => {
    climbTo(4);
    const veteran = lateCat('c_chispa');
    // the veteran climbed everything already (and is the best Podio cat)
    const vs = catState(veteran.uid);
    vs.lvl = 10;
    for (let lg = 1; lg <= 3; lg++) for (let b = 0; b < BOUTS; b++) vs.beaten![String(lg)] = (vs.beaten![String(lg)] ?? 0) | (1 << b);
    const late = lateCat('c_burbujas');
    expect(winKind(late.uid, 2, BOUTS - 1)).toBe('first');
    expect(winKind(veteran.uid, 2, BOUTS - 1)).toBe('repeat');

    const gems0 = G.s.gems;
    const lvl0 = catState(late.uid).lvl;
    const first = applyDuel(late, 2, BOUTS - 1, true, false);
    expect(first.kind).toBe('first');
    expect(first.xp.gained).toBe(Math.round(winXp(2) * first.catchup));
    expect(first.orbs?.n).toBe(PB.rewards.orbs_win); // orbs_champion stays the account's first crown
    expect(first.prize).toBeNull();
    expect(first.firstChampion).toBe(false);
    expect(first.gems).toBe(0);
    expect(catBeat(late.uid, 2, BOUTS - 1)).toBe(true);
    expect(catState(late.uid).lvl).toBeGreaterThan(lvl0);

    const again = applyDuel(late, 2, BOUTS - 1, true, false);
    expect(again.kind).toBe('repeat');
    expect(again.xp.gained).toBe(Math.round(winXp(2) * PB.xp.replay_mult * again.catchup));
    expect(again.xp.gained).toBeLessThan(first.xp.gained);
    expect(again.gems).toBe(0);
    // ladder untouched by rematches
    expect(ps().league).toBe(4);
    expect(ps().bout).toBe(0);
    expect(G.s.gems).toBe(gems0);
  });

  it('every rival pays its first-time XP once per cat (two late cats both get it)', () => {
    climbTo(3);
    const a = lateCat('c_chispa');
    const b = lateCat('c_burbujas');
    const xa = applyDuel(a, 1, 2, true, false);
    const xb = applyDuel(b, 1, 2, true, false);
    expect(xa.kind).toBe('first');
    expect(xb.kind).toBe('first');
    expect(applyDuel(a, 1, 2, true, false).kind).toBe('repeat');
    expect(applyDuel(b, 1, 2, true, false).kind).toBe('repeat');
  });

  it('catch-up multiplier: up to x2 for a cat far below your best one, x1 for the best', () => {
    climbTo(3);
    const best = lateCat('c_chispa');
    catState(best.uid).lvl = 15;
    const late = lateCat('c_burbujas');
    expect(catchupMult(best.uid)).toBe(1);
    expect(catchupMult(late.uid)).toBe(PB.xp.catchup_max);
    catState(late.uid).lvl = 12;
    expect(catchupMult(late.uid)).toBeCloseTo(1 + 3 * PB.xp.catchup_per_level, 6);
  });

  it('champion prize cats and champion gems cannot be farmed', () => {
    const lg = 8; // first prize league (Heroico)
    const prize = championPrize(lg)!;
    expect(prize).toBeTruthy();
    climbTo(lg);
    ps().bout = BOUTS - 1;
    const a = lateCat('c_chispa');
    const gems0 = G.s.gems;
    const win = applyDuel(a, lg, BOUTS - 1, true, false);
    expect(win.kind).toBe('frontier');
    expect(win.firstChampion).toBe(true);
    expect(win.prize?.species).toBe(prize);
    expect(G.s.gems - gems0).toBeGreaterThanOrEqual(PB.rewards.champion_gems);
    expect(ps().league).toBe(lg + 1);
    const prizeCopies = () => G.s.cats.filter((c) => c.species === prize).length;
    expect(prizeCopies()).toBe(1);

    const gems1 = G.s.gems;
    const b = lateCat('c_burbujas');
    for (const c of [a, b, a, b, a]) {
      const r = applyDuel(c, lg, BOUTS - 1, true, true);
      expect(r.prize).toBeNull();
      expect(r.firstChampion).toBe(false);
      expect(r.gems).toBe(0);
    }
    for (let i = 0; i < 30; i++) applyDuel(b, 2, i % BOUTS, true, true);
    expect(G.s.gems).toBe(gems1);
    expect(prizeCopies()).toBe(1);
    expect(ps().league).toBe(lg + 1);
    expect(ps().champions.filter((x) => x === lg)).toHaveLength(1);
  });

  it('old leagues pay a shrinking slice of income and repeat orbs only near the frontier', () => {
    climbTo(9);
    const c = lateCat();
    G.goldPerSec = 1e6;
    G.foodPerSec = 1e5;
    const front = duelOutlook(c, 9, 0);
    const near = duelOutlook(c, 8, 0);
    const far = duelOutlook(c, 1, 0);
    expect(front.kind).toBe('frontier');
    expect(near.gold).toBeLessThan(front.gold);
    expect(far.gold).toBeLessThan(near.gold);
    expect(far.food).toBeLessThan(near.food);
    // first win of this cat: orbs everywhere; repeats: only within the window
    expect(far.orbs).toBe(PB.rewards.orbs_win);
    applyDuel(c, 1, 0, true, false);
    applyDuel(c, 8, 0, true, false);
    expect(duelOutlook(c, 1, 0).orbs).toBe(0);
    expect(duelOutlook(c, 8, 0).orbs).toBe(PB.rewards.orbs_replay);
  });

  it('a capped cat keeps its first-win XP in the bank (and it flows in when the cap rises)', () => {
    climbTo(6);
    const c = lateCat('c_burbujas', 1, 1); // cap = Podio 1
    expect(levelCap(c)).toBe(1);
    const r = applyDuel(c, 5, 0, true, false); // 80 XP, the bar holds 59
    expect(r.xp.toBank).toBeGreaterThan(0);
    expect(r.kind).toBe('first');
    const st = catState(c.uid);
    expect(st.lvl).toBe(1);
    expect(st.bank).toBeGreaterThan(0);
    expect(st.xp + st.bank!).toBe(r.xp.gained);
    // repeats while capped don't pile into the bank
    const bank = st.bank;
    applyDuel(c, 5, 0, true, false);
    expect(st.bank).toBe(bank);
    // the island raises the cap → the bank pays out
    c.level = 9; // cap 4
    expect(settleBank(c)).toBe(true);
    expect(st.lvl).toBeGreaterThan(1);
  });
});

describe('El Podio: old saves', () => {
  beforeEach(() => newGame());

  it('derives each cat ledger from the XP it already earned (nothing taken, no double dip)', () => {
    const [a, b, c] = G.s.cats;
    // podio state written by the previous version: no `beaten`, no `bank`
    (G.s as unknown as { podio: unknown }).podio = {
      league: 3,
      bout: 2,
      speed: 2,
      auto: true,
      pick: a.uid,
      champions: [1, 2],
      stats: { wins: 20, losses: 3, perfects: 4 },
      cats: {
        [a.uid]: { xp: 5, lvl: 6, wins: 14, losses: 1 },
        [b.uid]: { xp: 30, lvl: 1, wins: 1, losses: 2 },
      },
    };
    G.save();
    G.load();
    const p = ps();
    expect(p.league).toBe(3);
    expect(p.bout).toBe(2);
    expect(p.stats.wins).toBe(20);
    const sa = p.cats[a.uid];
    const sb = p.cats[b.uid];
    // levels/xp untouched
    expect(sa.lvl).toBe(6);
    expect(sa.xp).toBe(5);
    expect(sb.lvl).toBe(1);
    // a: lifetime XP 60+78+101+132+171+5 = 547 → League 1 (5×40) + League 2 (5×50) = 450, 97 left → one League 3 win (60)
    const lifetime = [1, 2, 3, 4, 5].reduce((s, l) => s + xpNeed(l), 0) + 5;
    expect(lifetime).toBe(547);
    for (let bo = 0; bo < BOUTS; bo++) expect(catBeat(a.uid, 1, bo)).toBe(true);
    for (let bo = 0; bo < BOUTS; bo++) expect(catBeat(a.uid, 2, bo)).toBe(true);
    expect(catBeat(a.uid, 3, 0)).toBe(true);
    expect(catBeat(a.uid, 3, 1)).toBe(false);
    // b: 30 XP doesn't pay a whole first win → everything still pending
    expect(pendingFor(b.uid)).toHaveLength(2 * BOUTS + 3);
    // c never fought: everything pending, no entry created by reading
    expect(pendingFor(c.uid)).toHaveLength(2 * BOUTS + 3);
    expect(p.cats[c.uid]).toBeUndefined();
    expect(sa.bank).toBe(0);
  });

  it('a save with no podio at all still loads', () => {
    delete (G.s as unknown as { podio?: unknown }).podio;
    G.save();
    G.load();
    const p = ps();
    expect(p.league).toBe(1);
    expect(p.cats).toEqual({});
  });
});
