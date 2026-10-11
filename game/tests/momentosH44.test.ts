/**
 * H44 «Islas Invertidas» as a TWO-PHASE battle with the LIKY FIGHT Momento between the phases (docs/part-ii/29 §9):
 * phase 1 on the sea (the sky rules sleep), phase 2 in the sky (the current sky rules), switched deterministically by the
 * sim — so the battle screen and the estimate worker (structured-cloned spec) agree, and nothing the Momento does can
 * reach the sim.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const mem = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, String(v)),
  removeItem: (k: string) => void mem.delete(k),
  key: (i: number) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size;
  },
  clear: () => mem.clear(),
};

const { G } = await import('../src/state');
const { SAVE_KEY } = await import('../src/core/save');
const { checkMissions } = await import('../src/state/sys/missions');
const { buildStoryBattle } = await import('../src/state/sys/storyBattles');
const { RESET_PATCH_ID } = await import('../src/state/sys/rupturasReset');
const { autoBattle, makeBattle } = await import('../src/battle/autoplay');
const { DIFFICULTY } = await import('../src/battle/ai');
const { skyAwake, skyFlight, skyState, skyOn } = await import('../src/battle/cielo');
const { fasesState, faseIndex } = await import('../src/battle/fases');
const { momentoForFase } = await import('../src/momentos/registry');
await import('../src/momentos/songs');
import type { Battle } from '../src/battle/sim';

const O1 = ['H31', 'H32', 'H33', 'H34', 'H35', 'H36', 'H37', 'H38', 'H39', 'H40', 'H41'];
function loadH44() {
  const env = JSON.parse(readFileSync(new URL('../test-saves/post-finale.json', import.meta.url), 'utf8'));
  env.state.missions.done.push(...O1, 'H42', 'H43');
  env.state.flags.oleada1_fin = true;
  env.state.patches = [...(env.state.patches ?? []), RESET_PATCH_ID];
  env.state.ext = { ...(env.state.ext ?? {}), flightKit: { level: 1, ships: [env.state.ship.active] } };
  mem.clear();
  mem.set(SAVE_KEY, JSON.stringify(env));
  G.load();
  checkMissions();
}

describe('H44 two-phase battle', () => {
  it('declares sea → sky with a dormant sky and the Momento on the phase change', () => {
    loadH44();
    const sp = buildStoryBattle('cielo_invertidas', () => undefined);
    expect(sp.rules?.fases?.phases.map((p) => p.id)).toEqual(['mar', 'cielo']);
    expect(sp.rules?.sky?.from).toBe('cielo');
    expect(sp.rules?.fases?.phases[1].effects).toContain('skyWake');
    expect(sp.rules?.fases?.phases[1].endsBattle).toBe(true);
    expect(momentoForFase(sp.meta?.special ?? null, 'cielo')?.id).toBe('liky_fight');
    // the worker gets the spec by structured clone (minus onEnd, src/state/sys/estimate.ts): no functions in it
    const { onEnd: _drop, ...plain } = sp;
    expect(() => structuredClone(plain)).not.toThrow();
  });

  it('phase 1 is a sea battle: gravity 1, no islets, no layered wind, no void', () => {
    loadH44();
    const b = makeBattle(buildStoryBattle('cielo_invertidas', () => undefined), 7);
    expect(faseIndex(b)).toBe(0);
    expect(b.field.gMul).toBe(1);
    expect(skyOn(b)).toBe(false);
    expect(skyAwake(b)).toBe(false);
    expect(skyFlight(b, 0, 'arc')).toBeNull();
    expect(skyState(b)?.islets ?? []).toHaveLength(0);
  });

  it('the same seed replays the same battle (screen = estimate); entering the sky phase (the Momento) ENDS it in a victory', () => {
    loadH44();
    const sp = buildStoryBattle('cielo_invertidas', () => undefined);
    const play = (spec: typeof sp) => {
      const log: string[] = [];
      let wokeAt = -1;
      let last: Battle | null = null;
      const res = autoBattle(spec, DIFFICULTY.normal, 4242, 30, (b, side, shot) => {
        last = b;
        if (wokeAt < 0 && skyAwake(b)) wokeAt = b.turn;
        log.push(`${b.turn}|${side}|${shot}|${faseIndex(b)}|${b.field.gMul}|${b.sides[0].ship.cells().reduce((a, c) => a + c.hp, 0)}|${b.sides[1].ship.cells().reduce((a, c) => a + c.hp, 0)}`);
      });
      return { res, log, wokeAt, last: last as Battle | null };
    };
    const a = play(sp);
    const { onEnd: _drop, ...plain } = sp;
    const b = play(structuredClone(plain) as typeof sp);
    expect(b.res).toEqual(a.res);
    expect(b.log).toEqual(a.log);
    // owner's rule (2026-10-10): the LIKY FIGHT Momento ENDS the battle. The fight is a sea battle until the phase
    // change, where the player wins (the sky layer shows under the Momento's cut; its rules never wake)
    const phases = a.log.map((l) => Number(l.split('|')[3]));
    expect(phases[0]).toBe(0);
    expect(a.res.won).toBe(true);
    expect(a.wokeAt).toBe(-1);
    expect(fasesState(a.last!)!.layer).toBe('sky');
    expect(skyState(a.last!)!.islets).toHaveLength(0);
  }, 240_000);

  it('wins stay in range with a post-finale crew (a few seeds)', () => {
    loadH44();
    const sp = buildStoryBattle('cielo_invertidas', () => undefined);
    let wins = 0;
    for (let s = 0; s < 8; s++) if (autoBattle(sp, DIFFICULTY.normal, 900 + s, 30).won) wins++;
    expect(wins).toBeGreaterThanOrEqual(6);
  }, 240_000);
});
