/**
 * BATALLAS MUSICALES (src/battle/music, src/data/music/battles.json, battle/sincro.ts) — docs/part-ii/24.
 * Plan resolution · every plan names real sections/markers · state rules · the cursor's skip rule · enemy-impact
 * slots (capped delay, stretch, batching, the first big move) · SINCRO window math (latency + rhythm offset) ·
 * the sim with and without SINCRO inputs (deterministic) · the estimate never sees SINCRO (parity).
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanBeatMap, type BeatMap } from '../src/audio/beatgrid';
import { BattleFacts, MusicTarget, cleanDoc, musicDoc, pickRule, reactionMatches, resolvePlan, ruleMatches } from '../src/battle/music/plan';
import { Cursor, battleEvents, chooseSlot, choreoHits, hitsBetween, landingSpots, secPerBar, secPerBeat, sincroJudge, timeOfName } from '../src/battle/music/timeline';
import type { TimedHit } from '../src/battle/music/timeline';
import { makeBattle, autoBattle, aiSeed, volleyAim, volleySigma, enemyProfile } from '../src/battle/autoplay';
import { DIFFICULTY, aimCannon, decide } from '../src/battle/ai';
import { BLUEPRINTS } from '../src/battle/blueprints';
import { battleCatFrom } from '../src/battle/catShots';
import { SC_JUMPS, scComboFor, scStats } from '../src/battle/sincro';
import type { Battle, BattleEvent } from '../src/battle/sim';
import type { BattleSpec } from '../src/scenes/BattleScene';
import { ROLE_BY_ID, catDef } from '../src/data/content';

const MAPS_DIR = join(__dirname, '../src/data/music/beatmaps');
const map = (id: string): BeatMap => cleanBeatMap(JSON.parse(readFileSync(join(MAPS_DIR, `${id}.json`), 'utf8')), id)!;
const LIKY = map('liky_fight');
/** the battle remix the LIKY plans play (docs/part-ii/23 «Remixes de batalla») */
const LIKY_B = map('liky_fight.battle');

describe('battles.json: plans', () => {
  const doc = musicDoc();
  it('has the wired battles, the dev fight and the H38 goal', () => {
    for (const id of ['ruptura_paginas', 'ruptura_bibliotecario', 'ruptura_nacar', 'ruptura_madrenacar', 'ruptura_corrector', 'ruptura_sincronia', 'ruptura_estrella', 'ruptura_disruptores', 'ruptura_leviatan', 'cielo_invertidas', 'cielo_embajada', 'cielo_almirante', 'cielo_masamadre', 'umbral_suenos', 'umbral_correctores', 'umbral_final', 'dev_liky_fight'])
      expect(doc.plans[id]?.track, id).toBeTruthy();
    expect(doc.goals.find((g) => g.mission === 'H38')?.finale?.section).toBe('climax');
    // extends: the LIKY plan inherits the fiesta reactions; the dev fight inherits LIKY and turns SINCRO on
    expect(doc.plans.liky_fight.reactions.length).toBeGreaterThan(4);
    expect(doc.plans.dev_liky_fight.track).toBe('liky_fight.battle');
    expect(doc.plans.dev_liky_fight.sincro.enabled).toBe(true);
    expect(doc.plans.liky_fight.sincro.enabled).toBe(false);
    // H51 teaches SINCRO (and still completes on a plain win: the mission reads the win, not the SINCRO)
    expect(doc.plans.ruptura_sincronia.sincro).toMatchObject({ enabled: true, teach: true });
    expect(doc.plans.dev_liky_fight.sincro.teach).toBe(false);
    expect(doc.plans.ruptura_bibliotecario.ruido?.lowpassHz.length).toBe(4);
  });

  it('every section / marker a plan names exists in its song (start, rules, endings, finales); missing songs have a fallback', () => {
    const maps = new Map<string, BeatMap | null>();
    const has = (t: string) => existsSync(join(MAPS_DIR, `${t}.json`));
    const m = (t: string) => (maps.has(t) ? maps.get(t)! : maps.set(t, has(t) ? map(t) : null).get(t)!);
    const checkTarget = (t: MusicTarget, track: string, who: string): void => {
      const mm = m(t.track ?? track);
      if (!mm) {
        expect(t.fallback, `${who}: ${t.track} needs a fallback`).toBeTruthy();
        return checkTarget(t.fallback!, track, who);
      }
      expect(timeOfName(mm, t.section), `${who} ${t.section}`).not.toBeNull();
    };
    for (const p of Object.values(doc.plans)) {
      if (!p.track) continue;
      const song = m(p.track) ? p.track : p.fallback!;
      expect(m(song), `${p.id}: ${p.track} needs a fallback`).toBeTruthy();
      const own = m(song)!;
      if (p.startSection) expect(timeOfName(own, p.startSection), `${p.id} start`).not.toBeNull();
      for (const s of p.states) checkTarget(s.to, song, `${p.id} ${s.id}`);
      for (const e of [p.victory, p.defeat]) if (e.section) checkTarget({ track: e.track, section: e.section }, song, `${p.id} end`);
      if (p.endTo) checkTarget(p.endTo, song, `${p.id} endTo`);
      for (const s of p.states) if (s.when.before) expect(timeOfName(own, s.when.before)).not.toBeNull();
    }
    for (const g of doc.goals) if (g.finale) checkTarget(g.finale, 'liky_fight.battle', g.id);
  });

  it('a song that starts on its loop end is not asked to loop (it would wrap straight back)', () => {
    for (const p of Object.values(doc.plans)) {
      if (!p.track || !p.startSection || !p.loop) continue;
      const song = existsSync(join(MAPS_DIR, `${p.track}.json`)) ? p.track : p.fallback!;
      const mm = map(song);
      const at = timeOfName(mm, p.startSection)!;
      if (mm.loop) expect(at < mm.loop.end - 1, `${p.id} starts at ${at}`).toBe(true);
    }
  });

  it('SINCRO windows are never narrower than 150 ms a side; junk values fall back', () => {
    const d = cleanDoc({ battles: { x: { track: 'liky_fight', sincro: { enabled: true, windowMs: 40 }, sync: { maxDelayBars: 9, stretch: [0.1, 9] }, reactions: [{ on: 'bar', do: ['nope'] }] } } });
    expect(d.plans.x.sincro.windowMs).toBe(150);
    expect(d.plans.x.sync.maxDelayBars).toBe(2);
    expect(d.plans.x.sync.stretch).toEqual([0.5, 2]);
    expect(d.plans.x.reactions).toEqual([]);
  });
});

describe('plan resolution', () => {
  const base = { kind: 'story', activeMissions: [] as string[], crewSpecies: ['c_canelo', 'c_voltio'] };
  it('a battle id with its own plan wins; unknown ids are fine', () => {
    expect(resolvePlan({ ...base, battleId: 'ruptura_corrector' }).plan?.track).toBe('circus_malus.battle');
    expect(resolvePlan({ ...base, battleId: 'una_batalla_que_no_existe' })).toMatchObject({ plan: null, source: 'none' });
    expect(resolvePlan({ ...base, kind: 'default', battleId: null }).plan).toBeNull();
  });
  it('H38 rides on any battle while it is active and Canelo sails', () => {
    const r = resolvePlan({ ...base, battleId: 'z3_s4', activeMissions: ['H38'] });
    expect(r.source).toBe('goal');
    expect(r.plan?.track).toBe('liky_fight.battle');
    expect(r.goals[0].finale?.unlock?.song).toBe('liky_fight.battle');
    // without Canelo, or without the mission: nothing
    expect(resolvePlan({ ...base, battleId: 'z3_s4', activeMissions: ['H38'], crewSpecies: ['c_voltio'] }).plan).toBeNull();
    expect(resolvePlan({ ...base, battleId: 'z3_s4' }).plan).toBeNull();
    // a battle with its own plan keeps it, the goal only adds its finale
    const own = resolvePlan({ ...base, battleId: 'ruptura_bibliotecario', activeMissions: ['H38'] });
    expect(own.plan?.track).toBe('when_i_lose.battle');
    expect(own.goals.length).toBe(1);
  });
});

describe('state rules', () => {
  const liky = musicDoc().plans.liky_fight;
  const facts = (o: Partial<BattleFacts>): BattleFacts => ({
    trigger: { kind: 'enemyTurn', n: 1 },
    turn: 1,
    enemyHull: 1,
    playerHull: 1,
    bossPhase: 0,
    pos: 20,
    looped: false,
    section: 'verse',
    timeOf: (n) => timeOfName(LIKY_B, n),
    ...o,
  });
  it('the first enemy turn jumps to the anacrusis only while the song is still before its first drop', () => {
    expect(pickRule(liky.states, facts({}), new Set())?.rule.to.section).toBe('pre_drop');
    expect(pickRule(liky.states, facts({ pos: 25, section: 'drop' }), new Set())).toBeNull();
    expect(pickRule(liky.states, facts({ looped: true }), new Set())).toBeNull();
    expect(pickRule(liky.states, facts({ trigger: { kind: 'playerTurn', n: 1 } }), new Set())).toBeNull();
  });
  it('hull thresholds, unlessSection, once', () => {
    const f = facts({ trigger: { kind: 'playerTurn', n: 3 }, enemyHull: 0.3, section: 'break', pos: 38 });
    const r = pickRule(liky.states, f, new Set());
    expect(r?.rule.to.section).toBe('build_2');
    expect(pickRule(liky.states, { ...f, section: 'climax' }, new Set())).toBeNull();
    expect(pickRule(liky.states, f, new Set([r!.index]))).toBeNull();
  });
  it('signals only fire signal rules', () => {
    const lev = musicDoc().plans.ruptura_leviatan;
    expect(ruleMatches(lev.states[0], facts({ trigger: { kind: 'signal', name: 'fase:cielo' } }))).toBe(true);
    expect(ruleMatches(lev.states[0], facts({ trigger: { kind: 'enemyTurn', n: 2 } }))).toBe(false);
  });
  it('reaction filters: kind, strength, energy, phase', () => {
    const r = { on: 'hit:drop', do: ['special' as const], minEnergy: 0.7, phases: ['aim' as const] };
    expect(reactionMatches(r, { type: 'hit', name: 'drop', strength: 1, energy: 0.8, section: 'drop' }, 'aim')).toBe(true);
    expect(reactionMatches(r, { type: 'hit', name: 'kick', strength: 1, energy: 0.8, section: 'drop' }, 'aim')).toBe(false);
    expect(reactionMatches(r, { type: 'hit', name: 'drop', strength: 1, energy: 0.5, section: 'break' }, 'aim')).toBe(false);
    expect(reactionMatches(r, { type: 'hit', name: 'drop', strength: 1, energy: 0.8, section: 'drop' }, 'enemy')).toBe(false);
  });
});

describe('timeline', () => {
  it("LIKY FIGHT keeps MUSIC's 382 choreography hits; other songs get hits from their grid", () => {
    expect(choreoHits(LIKY).length).toBe(382);
    const wil = map('when_i_lose');
    const hs = choreoHits(wil);
    const drops = hs.filter((h) => h.kind === 'drop').map((h) => h.time);
    // energy jumps: verse after the intro, the choruses after quieter sections, the climax after the valley
    for (const t of [17.143, 68.571, 96.0, 130.286, 178.286]) expect(drops.some((d) => Math.abs(d - t) < 0.01), `drop ${t}`).toBe(true);
    expect(hs.filter((h) => h.strength === 1).length).toBeGreaterThanOrEqual(9);
    // a plan can still add hits (extraHits) to a map without them
    const te = choreoHits(map('te_odio'), [{ time: 53.0, kind: 'stop', strength: 0.9 }, { time: 57.0, kind: 'stop', strength: 0.9 }]);
    expect(te.filter((h) => h.kind === 'stop').length).toBeGreaterThanOrEqual(2);
    // the te ODIO battle remix carries its own signal stops (H55's graffiti land on them): stop → reentry pairs
    const tb = choreoHits(map('te_odio.battle'), musicDoc().plans.ruptura_disruptores.extraHits);
    expect(tb.filter((h) => h.kind === 'stop').length).toBe(4);
    expect(tb.filter((h) => h.kind === 'reentry').length).toBe(4);
  });

  it('the cursor delivers each occurrence once (loops included) and skips late beats by one rule', () => {
    const ev = battleEvents(LIKY);
    const loop = LIKY.loop!;
    const c = new Cursor(ev, loop, 150, 0.12, 0);
    const seen = new Set<string>();
    let dup = 0;
    for (let u = 150; u < 200; u += 1 / 60) {
      for (const d of c.advance(u)) {
        const k = `${d.e.type}:${d.e.name ?? ''}:${d.u.toFixed(4)}`;
        if (seen.has(k)) dup++;
        seen.add(k);
      }
    }
    expect(dup).toBe(0);
    // it went through the loop end (161.2) and came back at the chorus
    expect([...seen].some((k) => k.startsWith('section:chorus:'))).toBe(true);
    // a 2 s frame gap: the beats in it are skipped, the section crossed still arrives
    const c2 = new Cursor(ev, null, 40, 0.12, 0);
    c2.advance(40);
    const got = c2.advance(46.5);
    expect(got.filter((d) => d.e.type === 'beat' && d.late > 0.12).length).toBe(0);
    expect(c2.stats.skipped).toBeGreaterThan(5);
    expect(got.some((d) => d.e.type === 'section' && d.e.name === 'chorus')).toBe(true);
    // reset: nothing in between is delivered
    c2.reset(100);
    expect(c2.advance(100.01).every((d) => d.u > 99.99)).toBe(true);
  });
});

describe('enemy impact slots', () => {
  const sync = musicDoc().plans.liky_fight.sync;
  const ev = battleEvents(LIKY);
  const spb = secPerBeat(LIKY);
  const bar = secPerBar(LIKY);
  const hitsFrom = (now: number) => landingSpots(ev, LIKY, LIKY.loop!, now, now + 6);
  it('the added delay never exceeds the cap; the impact lands exactly on a suitable hit', () => {
    for (let now = 44; now < 160; now += 0.37) {
      for (const flight of [0.4, 0.9, 1.6]) {
        const s = chooseSlot({ now, flight, hits: hitsFrom(now), spb, bar, cfg: sync });
        if (!s) continue;
        expect(s.delay).toBeLessThanOrEqual(sync.maxDelayBars * bar + 1e-6);
        expect(s.hit.strength).toBeGreaterThanOrEqual(sync.minStrength);
        expect(s.rate).toBeGreaterThanOrEqual(1 / sync.stretch[1] - 1e-6);
        expect(s.rate).toBeLessThanOrEqual(1 / sync.stretch[0] + 1e-6);
        // release + flight / rate = the hit
        expect(s.release + flight / s.rate).toBeCloseTo(s.hit.u, 5);
      }
    }
  });
  it("the first big move goes for the drop (the jump's anacrusis → drop_2 at 71.45)", () => {
    const now = 69.7; // the anacrusis bar just started
    const s = chooseSlot({ now, flight: 0.9, hits: hitsFrom(now), spb, bar, cfg: sync, first: true });
    expect(s?.hit.kind).toBe('drop');
    expect(s!.hit.t).toBeCloseTo(71.45, 2);
  });
  it('a volley keeps a beat apart, or batches up to batchMax impacts on a strong accent', () => {
    let prev: { u: number; n: number } | null = null;
    // the screen plans each cannon right after the previous one was released
    let now = 72;
    const slots = [];
    for (let i = 0; i < 6; i++) {
      const s = chooseSlot({ now, flight: 0.6, hits: hitsFrom(now), spb, bar, cfg: sync, prev });
      if (!s) break;
      now = s.release + 1 / 60;
      prev = { u: s.hit.u, n: s.batched ? (prev?.n ?? 0) + 1 : 1 };
      slots.push(s);
    }
    expect(slots.length).toBeGreaterThan(2);
    for (let i = 1; i < slots.length; i++) {
      const gap = slots[i].hit.u - slots[i - 1].hit.u;
      if (slots[i].batched) {
        expect(Math.abs(gap)).toBeLessThan(0.03);
        expect(slots[i].hit.strength).toBeGreaterThanOrEqual(sync.strongStrength);
      } else expect(gap).toBeGreaterThanOrEqual(sync.minGapBeats * spb - 0.03);
    }
  });
  it('no suitable hit → null (the shot is shown unsynced, right away)', () => {
    expect(chooseSlot({ now: 10, flight: 1, hits: [], spb, bar, cfg: sync })).toBeNull();
  });
});

describe('SINCRO window math', () => {
  const cfg = { enabled: true, minStrength: 0.8, kinds: ['drop', 'reentry'], windowMs: 170 };
  const h = (u: number, strength = 0.9, kind = 'kick'): TimedHit => ({ u, t: u, strength, kind, energy: 0.8, section: 'drop' });
  it('±window around a strong hit, weak hits never open one, drops always do', () => {
    const hits = [h(10), h(11, 0.5), h(12, 0.4, 'drop')];
    expect(sincroJudge({ heardU: 10.16, inputLag: 0, offsetMs: 0, hits, cfg })?.delta).toBeCloseTo(0.16, 3);
    expect(sincroJudge({ heardU: 9.84, inputLag: 0, offsetMs: 0, hits, cfg })?.delta).toBeCloseTo(-0.16, 3);
    expect(sincroJudge({ heardU: 10.18, inputLag: 0, offsetMs: 0, hits, cfg })).toBeNull();
    expect(sincroJudge({ heardU: 11, inputLag: 0, offsetMs: 0, hits, cfg })).toBeNull();
    expect(sincroJudge({ heardU: 12.1, inputLag: 0, offsetMs: 0, hits, cfg })?.hit.kind).toBe('drop');
  });
  it('latency: the input lag and the rhythm offset move the judged time back', () => {
    const hits = [h(10)];
    // heard 10.25 is late… unless the tap happened 100 ms ago
    expect(sincroJudge({ heardU: 10.25, inputLag: 0, offsetMs: 0, hits, cfg })).toBeNull();
    expect(sincroJudge({ heardU: 10.25, inputLag: 0.1, offsetMs: 0, hits, cfg })?.delta).toBeCloseTo(0.15, 3);
    // Bluetooth: the player hears everything 120 ms late → +120 ms offset accepts their «late» tap
    expect(sincroJudge({ heardU: 10.29, inputLag: 0, offsetMs: 120, hits, cfg })?.delta).toBeCloseTo(0.17, 3);
    expect(sincroJudge({ heardU: 9.72, inputLag: 0, offsetMs: -120, hits, cfg })?.delta).toBeCloseTo(-0.16, 3);
    expect(sincroJudge({ heardU: 9.7, inputLag: 0, offsetMs: -120, hits, cfg })).toBeNull();
  });
});

// ------------------------------------------------------------------ the sim
function crewCat(uid: string, species: string, level = 12) {
  return battleCatFrom({ uid, species, name: species, level, stars: 1, dmgMul: 1, hpMul: 1 }, ROLE_BY_ID.get(catDef(species).role)!.hp);
}
function spec(player: string[], enemy: string[], hpMul = 4): BattleSpec {
  return {
    player: { blueprint: BLUEPRINTS.sparrow, hpMul, cats: player.map((s, i) => crewCat(`p${i}`, s)), cannonAtk: 30 },
    enemy: { blueprint: BLUEPRINTS.sparrow, hpMul, cats: enemy.map((s, i) => crewCat(`e${i}`, s)), cannonAtk: 30 },
    playerName: 'Tú',
    enemyName: 'Ellos',
    difficulty: 'normal',
    onEnd: () => undefined,
  };
}

/** the exact turn flow of autoplay.ts (and the screen), with the player's SINCRO input as a function */
function play(sp: BattleSpec, seed: number, sincro: (b: Battle, k: number) => boolean | undefined, rounds = 12) {
  const b = makeBattle(sp, seed);
  const mem = [new Map<string, number>(), new Map<string, number>()];
  const prof = [DIFFICULTY.hard, enemyProfile(sp)];
  const log: string[] = [];
  const dmgBy = new Map<string, number>();
  let shot = 0;
  for (let g = 0; g < rounds && b.winner === null; g++) {
    for (const side of [0, 1] as const) {
      b.startTurn(side);
      b.queued.length = 0;
      if (b.winner !== null) break;
      let target: { x: number; y: number } | null = null;
      for (let k = 0; k < 1 + b.extraShots(side) && b.winner === null; k++) {
        const d = decide(b, side, prof[side], mem[side], aiSeed.cat(b, side, k), { dmgBy });
        if (!d) break;
        const s = side === 0 ? sincro(b, shot++) : undefined;
        const r = b.fire(side, d.shooter, d.angle, d.power, d.ult, undefined, s === undefined ? undefined : { sincro: s });
        log.push(`${side}:${d.shooter}:${r.events.reduce((a, e: BattleEvent) => a + (e.k === 'cell' ? e.dmg : 0), 0)}`);
        target = volleyAim(target, r.events, side);
        if (side === 1) for (const e of r.events) if (e.k === 'cat' && e.side === 0 && e.dmg > 0) dmgBy.set(d.shooter, (dmgBy.get(d.shooter) ?? 0) + e.dmg);
      }
      for (const m of b.cannons(side)) {
        if (b.winner !== null) break;
        if (!m.alive) continue;
        const a = aimCannon(b, side, m.id, aiSeed.cannon(b, m.id), volleySigma(sp, side), target ?? undefined);
        b.fire(side, 'cannon', a.angle, a.power, false, m.id);
      }
      b.endTurn();
      if (b.winner !== null) break;
    }
  }
  return { b, log, won: b.winner === 0, turns: b.turn, hull: [b.hullPct(0), b.hullPct(1)] };
}

// whole battles in a loop: generous timeout so a busy machine doesn't flake them
describe('SINCRO in the sim', { timeout: 30000 }, () => {
  const combo = spec(['c_canelo', 'c_voltio', 'c_nimbo'], ['c_tamborin', 'c_canelo', 'c_voltio']);
  it('a crew with Fuego + Tormenta has the combo; without it nothing', () => {
    const b = makeBattle(combo, 5);
    expect(scComboFor(b, b.sides[0].cats[0])?.id).toBe('sobrecarga');
    const b2 = makeBattle(spec(['c_canelo', 'c_tamborin'], ['c_tamborin']), 5);
    expect(scComboFor(b2, b2.sides[0].cats[0])).toBeNull();
  });
  it('same seed + same inputs → the same battle (with and without SINCRO)', () => {
    const on = (b: Battle, k: number) => k % 2 === 0;
    const a1 = play(combo, 9, on);
    const a2 = play(combo, 9, on);
    expect(a1.log).toEqual(a2.log);
    expect(a1.hull).toEqual(a2.hull);
    const n1 = play(combo, 9, () => false);
    const n2 = play(combo, 9, () => undefined);
    expect(n1.log).toEqual(n2.log);
  });
  it('a SINCRO shot chains SOBRECARGA (≤ 3 jumps) and changes the fight; inputs are recorded', () => {
    let checked = 0;
    for (let seed = 1; seed < 30 && checked < 3; seed++) {
      const b = makeBattle(combo, seed);
      b.startTurn(0);
      const d = decide(b, 0, DIFFICULTY.hard, new Map(), aiSeed.cat(b, 0, 0), {})!;
      const plain = makeBattle(combo, seed);
      plain.startTurn(0);
      const r0 = plain.fire(0, d.shooter, d.angle, d.power, d.ult);
      const r1 = b.fire(0, d.shooter, d.angle, d.power, d.ult, undefined, { sincro: true });
      expect(scStats(b)?.inputs[0]).toMatchObject({ side: 0, shooter: d.shooter, sincro: true });
      expect(scStats(plain)).toBeNull();
      if (!r0.events.some((e) => e.k === 'impact' && e.side === 1)) continue;
      checked++;
      expect(r1.events.filter((e) => e.k === 'reaction' && e.name === 'SOBRECARGA').length).toBeGreaterThanOrEqual(1);
      const cells = (ev: BattleEvent[]) => ev.filter((e) => e.k === 'cell' && e.side === 1).length;
      expect(cells(r1.events) - cells(r0.events)).toBeGreaterThan(0);
      expect(cells(r1.events) - cells(r0.events)).toBeLessThanOrEqual(SC_JUMPS);
      expect(scStats(b)?.combos).toBe(1);
    }
    expect(checked).toBe(3);
    const many = play(combo, 9, () => true);
    const none = play(combo, 9, () => false);
    expect(many.log).not.toEqual(none.log);
  });
  it('without the combo a SINCRO input changes nothing', () => {
    const sp = spec(['c_canelo', 'c_tamborin'], ['c_tamborin', 'c_voltio']);
    expect(play(sp, 4, () => true).log).toEqual(play(sp, 4, () => false).log);
  });
  it('estimate parity: the headless estimate (no inputs) is the battle with SINCRO off', () => {
    for (const seed of [1001, 1078]) {
      const est = autoBattle(combo, DIFFICULTY.hard, seed, 12);
      const off = play(combo, seed, () => false);
      expect(off.won).toBe(est.won);
      expect(off.turns).toBe(est.turns);
      expect(1 - off.hull[0]).toBeCloseTo(est.hullLost, 6);
    }
  });
});
