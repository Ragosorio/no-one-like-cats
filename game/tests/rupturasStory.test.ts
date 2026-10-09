/**
 * Parte II · Oleada 1 «La Marea Imposible» (docs/part-ii/12-puente-oleada-1.md): H31–H41 live in
 * data/rupturas/historia.json (merged onto content.json), their battles + the 3D islands' map flags in
 * state/sys/rupturas.ts and their hooks in ui/story/rupturasScript.ts. Old saves that finished «Fin» get H31
 * (+ a patch note); saves that didn't finish Part I get nothing — no missions, no islands on the chart.
 * The Canelo arc (H36–H38): his page (an Eco), 3 wins with him in ANY mode, then the final blow (sim.finalBlow).
 * The Lote D species are real data now (no stand-ins): every enemy crew and reward cat must exist.
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

const { G, newGame } = await import('../src/state');
const { SAVE_KEY } = await import('../src/core/save');
const { patchNotes } = await import('../src/state/patches');
const { checkMissions, evalGoal } = await import('../src/state/sys/missions');
const { BEAT_BY_ID, CATS, CAT_BY_ID, MISSIONS, MISSION_BY_ID } = await import('../src/data/content');
const { goalSupported, goalCounters, finalBlowKey } = await import('../src/state/sys/missionGoals');
const { STORY_BATTLES, applyStoryResult, buildStoryBattle } = await import('../src/state/sys/storyBattles');
const { countCrewWins, applySpecialResult, SPECIALS } = await import('../src/state/sys/campaign');
const { applyDuel } = await import('../src/state/sys/podio');
const { setCrew, crew } = await import('../src/state/sys/ship');
const R = await import('../src/state/sys/rupturas');
const S = await import('../src/ui/story/rupturasScript');
const { REGION_IDS, REGION_INFO } = await import('../src/regions');
const { speaker, isDirection } = await import('../src/ui/story/text');
const { dexCount, dexTotal } = await import('../src/state/ext/collection');
const { speciesCount } = await import('../src/state/sys/cats');
const { autoBattle, makeBattle } = await import('../src/battle/autoplay');
const { hurtsSide } = await import('../src/battle/sim');
const { DIFFICULTY } = await import('../src/battle/ai');
import type { BattleResult } from '../src/scenes/BattleScene';

const PATCH = '2026-10-oleada1-marea-imposible';
const IDS = ['H31', 'H32', 'H33', 'H34', 'H35', 'H36', 'H37', 'H38', 'H39', 'H40', 'H41'];
const WIN: BattleResult = { won: true, reason: 'sunk', turns: 5, modulesDestroyed: 4, damageDealt: 1000, catsLost: 0, perfect: false };
const BATTLE_OF: Record<string, string> = {
  ruptura_paginas: 'H34',
  ruptura_bibliotecario: 'H35',
  ruptura_nacar: 'H39',
  ruptura_madrenacar: 'H40',
  ruptura_corrector: 'H41',
};

/** put a fixture in the save slot and load it the way the game does (migrations, normalize, patches) */
function loadFixture(f: 'post-finale' | 'late-game' | 'post-story') {
  const env = JSON.parse(readFileSync(new URL(`../test-saves/${f}.json`, import.meta.url), 'utf8'));
  mem.clear();
  mem.set(SAVE_KEY, JSON.stringify(env));
  patchNotes.length = 0;
  G.load();
  expect(G.loaded).toBe(true);
  checkMissions();
}
const done = (id: string) => G.s.missions.done.includes(id);
const active = (id: string) => G.s.missions.active.includes(id);
const onChart = () => R.mapRegions().map((r) => r.id);
const calling = () => R.mapRegions().filter((r) => r.call).map((r) => r.id);
/** play the wave up to (not including) mission `upTo`, the way a player would */
function playUntil(upTo: string) {
  const steps: Record<string, () => void> = {
    H31: () => R.tapFaro(),
    H32: () => R.openRegistro000(),
    H33: () => G.count('feature_region_paginas'),
    H34: () => applyStoryResult('ruptura_paginas', WIN),
    H35: () => applyStoryResult('ruptura_bibliotecario', WIN),
    H36: () => G.count('feature_pagina_canelo'),
    H37: () => {
      const c = canelo();
      for (let i = 0; i < 3; i++) countCrewWins([c.uid]);
    },
    H38: () => countCrewWins([canelo().uid], canelo().uid),
    H39: () => applyStoryResult('ruptura_nacar', WIN),
    H40: () => applyStoryResult('ruptura_madrenacar', WIN),
  };
  for (const id of IDS) {
    if (id === upTo) return;
    if (done(id)) continue;
    expect(active(id), `${id} active before playing it`).toBe(true);
    steps[id]();
    checkMissions();
    expect(done(id), `${id} done`).toBe(true);
  }
}
const canelo = () => G.s.cats.find((c) => c.species === 'c_canelo')!;

describe('Parte II · Oleada 1 — data', () => {
  it('H31–H41 exist as one historia chain that starts after H30 «Fin»', () => {
    let prev = 'H30';
    for (const id of IDS) {
      const m = MISSION_BY_ID.get(id)!;
      expect(m, id).toBeTruthy();
      expect(m.chain).toBe('historia');
      expect(m.trigger).toBe(`mission:${prev}`);
      expect(m.goal.text.length).toBeGreaterThan(10);
      prev = id;
    }
    // nothing of Parte II beyond H41 yet (Oleada 2 starts at H42: docs/part-ii/13)
    expect(MISSION_BY_ID.get('H42')).toBeUndefined();
    expect(MISSION_BY_ID.get('H31')!.goal).toMatchObject({ type: 'use_feature', feature: 'faro' });
    expect(MISSION_BY_ID.get('H32')!.goal).toMatchObject({ type: 'use_feature', feature: 'registro000' });
    expect(MISSION_BY_ID.get('H33')!.goal).toMatchObject({ type: 'use_feature', feature: 'region_paginas' });
    expect(MISSION_BY_ID.get('H36')!.goal).toMatchObject({ type: 'use_feature', feature: 'pagina_canelo' });
    expect(MISSION_BY_ID.get('H37')!.goal).toMatchObject({ type: 'wins_with_species', species: 'c_canelo', n: 3 });
    expect(MISSION_BY_ID.get('H38')!.goal).toMatchObject({ type: 'final_blow', species: 'c_canelo', n: 1 });
    expect(goalCounters(MISSION_BY_ID.get('H38')!.goal)).toEqual(['canelo_final_blow']);
    expect(MISSION_BY_ID.get('H38')!.unlocks).toContain('forma:canelo_almirante');
    expect(MISSION_BY_ID.get('H37')!.unlocks).not.toContain('forma:canelo_almirante');
    expect(MISSION_BY_ID.get('H41')!.unlocks).toContain('oleada1_fin');
    // each battle mission is the one its story battle says
    for (const [b, m] of Object.entries(BATTLE_OF)) {
      expect(MISSION_BY_ID.get(m)!.goal, m).toMatchObject({ type: 'win_battle', battle: b });
      expect(STORY_BATTLES[b].mission, b).toBe(m);
    }
  });

  it('every goal type of the merged content has an evaluator', () => {
    const bad = MISSIONS.filter((m) => !goalSupported(m.goal.type)).map((m) => `${m.id}:${m.goal.type}`);
    expect(bad).toEqual([]);
  });

  it('the five battles are registered, post-story, and every crew / reward species exists', () => {
    expect(R.RUPTURA_BATTLES).toEqual(['ruptura_paginas', 'ruptura_bibliotecario', 'ruptura_nacar', 'ruptura_madrenacar', 'ruptura_corrector']);
    for (const id of R.RUPTURA_BATTLES) {
      const b = STORY_BATTLES[id];
      expect(b, id).toBeTruthy();
      const m = MISSION_BY_ID.get(b.mission)!;
      expect(m.goal).toMatchObject({ type: 'win_battle', battle: id });
      expect(b.zone).toBe(6);
      expect([8, 9]).toContain(b.stage);
      expect(b.powerMul).toBeGreaterThan(1);
      expect(b.powerMul).toBeLessThan(1.5);
      expect(b.rules?.cataclysm).toBeTruthy();
      expect(b.enemyCats.length).toBeGreaterThanOrEqual(3);
      for (const sp of b.enemyCats) expect(CAT_BY_ID.has(sp), `${id}: ${sp}`).toBe(true);
      if (b.reward.cat) expect(CAT_BY_ID.has(b.reward.cat), `${id} reward: ${b.reward.cat}`).toBe(true);
    }
    expect(STORY_BATTLES.ruptura_nacar.reward).toEqual({ element: 'crystal', cat: 'c_brillito', crystals: 20 });
    expect(STORY_BATTLES.ruptura_paginas.reward.cat).toBe('c_marcapaginas');
    expect(STORY_BATTLES.ruptura_bibliotecario.reward.cat).toBe('l_bibliotecario');
    expect(STORY_BATTLES.ruptura_madrenacar.reward.cat).toBe('l_madrenacar');
    expect(STORY_BATTLES.ruptura_corrector.reward.cat).toBe('c_espumita');
    // the region battles are the ones the 3D islands host (src/regions/index.ts)
    expect(REGION_INFO.paginas.battles).toEqual(['ruptura_paginas', 'ruptura_bibliotecario']);
    expect(REGION_INFO.nacar.battles).toEqual(['ruptura_nacar', 'ruptura_madrenacar']);
  });

  it('every hooked beat exists, its parts cover it once, ≤4 visible lines, known speakers', () => {
    const fallback = speaker('__NADIE_REGISTRADO__');
    const registered = (sp: string) => {
      const s = speaker(sp);
      return s.kind !== fallback.kind || s.slug !== fallback.slug || s.band !== fallback.band || sp === 'TUS GATOS';
    };
    const used = new Map<string, number[]>();
    for (const id of IDS) {
      expect(S.RUPTURAS_ON_NEW[id]?.length, `${id} ON_NEW`).toBeGreaterThan(0);
      expect(S.RUPTURAS_ON_DONE[id]?.length, `${id} ON_DONE`).toBeGreaterThan(0);
      expect(S.RUPTURAS_COVERED).toContain(id);
    }
    expect(S.RUPTURAS_COVERED).toEqual(IDS);
    // nothing hooked to a mission that doesn't exist (renumbering leftovers)
    for (const id of [...Object.keys(S.RUPTURAS_ON_NEW), ...Object.keys(S.RUPTURAS_ON_DONE)]) expect(IDS, id).toContain(id);
    for (const ref of [...Object.values(S.RUPTURAS_ON_NEW), ...Object.values(S.RUPTURAS_ON_DONE)].flat()) {
      if (ref.special === 'region') continue;
      const b = BEAT_BY_ID.get(ref.beat);
      expect(b, ref.beat).toBeTruthy();
      const idx = ref.lines ?? b!.lines.map((_, i) => i);
      const shown = idx.filter((i) => !isDirection(b!.lines[i][0], b!.lines[i][1]));
      expect(shown.length, `${ref.beat}#${ref.part}`).toBeLessThanOrEqual(4);
      for (const i of idx) {
        expect(b!.lines[i], `${ref.beat}[${i}]`).toBeTruthy();
        expect(registered(b!.lines[i][0]), `speaker ${b!.lines[i][0]}`).toBe(true);
      }
      used.set(ref.beat, [...(used.get(ref.beat) ?? []), ...idx]);
    }
    for (const [beat, idx] of used) expect([...idx].sort((a, b) => a - b), beat).toEqual(BEAT_BY_ID.get(beat)!.lines.map((_, i) => i));
    // the beat ids follow the missions: b<NN>_… for H<NN>
    for (const id of IDS) for (const ref of [...S.RUPTURAS_ON_NEW[id], ...S.RUPTURAS_ON_DONE[id]]) expect(ref.beat.slice(1, 3), `${id} → ${ref.beat}`).toBe(id.slice(1));
    // the canon lines of the Canelo arc
    const txt = (beat: string) => BEAT_BY_ID.get(beat)!.lines.map((l) => l[1]).join('\n');
    expect(txt('b36_pagina_canelo')).toContain('«CANELO, ALMIRANTE DE LA FLOTA GATUNA. Hundió 40 barcos. Nunca se bajó del timón.»');
    expect(txt('b36_pagina_canelo')).toContain('Capi… esto nunca pasó.');
    expect(txt('b38_a_babor')).toContain('Sigue siendo el mismo gato impaciente. Ahora con sombrero.');
  });

  it('beats play in story order: each part waits longer than the parts queued before it', () => {
    // a mission's ON_DONE and the next mission's ON_NEW are queued in the same checkMissions pass, and the
    // story director plays the first READY beat: delays must grow along that queue or the order flips
    for (let i = 0; i < IDS.length - 1; i++) {
      const queue = [...S.RUPTURAS_ON_DONE[IDS[i]], ...S.RUPTURAS_ON_NEW[IDS[i + 1]]];
      for (let k = 1; k < queue.length; k++) {
        const a = queue[k - 1];
        const b = queue[k];
        expect(b.delay ?? 0, `${IDS[i]}→${IDS[i + 1]}: ${a.beat}#${a.part} before ${b.beat}#${b.part}`).toBeGreaterThan(a.delay ?? 0);
      }
    }
  });

  it('H31 ends with the 3D cinematic «el reflejo», once, right after its beat', () => {
    const refs = S.RUPTURAS_ON_DONE.H31;
    expect(refs[0].beat).toBe('b31_estrellas');
    const cine = refs[refs.length - 1];
    expect(cine).toMatchObject({ special: 'region', region: 'reflejo', onlyOn: 'island' });
    expect((REGION_IDS as readonly string[]).includes(cine.region!)).toBe(true);
    // its beat id guards it (beatsSeen): unique in every table, never a dialog beat
    const all = [...Object.values(S.RUPTURAS_ON_NEW), ...Object.values(S.RUPTURAS_ON_DONE)].flat();
    expect(all.filter((r) => r.beat === cine.beat)).toHaveLength(1);
    expect(BEAT_BY_ID.get(cine.beat)).toBeUndefined();
    // the arrival beats may play inside the 3D island
    expect(S.RUPTURAS_ON_DONE.H33[0].inRegion).toBe(true);
    expect(S.RUPTURAS_ON_NEW.H34[0].inRegion).toBe(true);
    expect(S.RUPTURAS_ON_DONE.H36[0].inRegion).toBe(true);
  });
});

describe('Parte II · Oleada 1 — saves', () => {
  it('an old save that finished «Fin» gets H31 and the patch note, and no island on the chart yet', () => {
    loadFixture('post-finale');
    expect(G.s.patches).toContain(PATCH);
    expect(patchNotes.some((n) => n.includes('MAREA IMPOSIBLE'))).toBe(true);
    expect(active('H31')).toBe(true);
    expect(G.s.missions.pinned).toContain('H31');
    for (const id of IDS.slice(1)) expect(active(id) || done(id), id).toBe(false);
    expect(R.registro000Visible()).toBe(false);
    expect(onChart()).toEqual([]);
  });

  it('a save that did not finish Part I sees nothing of Parte II (no missions, no islands)', () => {
    for (const f of ['late-game', 'post-story'] as const) {
      loadFixture(f);
      expect(G.s.patches).toContain(PATCH);
      expect(patchNotes.some((n) => n.includes('MAREA IMPOSIBLE'))).toBe(false);
      for (const id of IDS) expect(active(id) || done(id), `${f} ${id}`).toBe(false);
      expect(R.partIIOpen()).toBe(false);
      expect(R.registro000Visible()).toBe(false);
      expect(R.folioRevealed()).toBe(false);
      expect(onChart(), f).toEqual([]);
      for (const id of REGION_IDS) {
        const fl = REGION_INFO[id].mapFlag;
        if (fl) expect(G.has(fl), `${f} ${fl}`).toBe(false);
      }
    }
    newGame();
    for (const id of IDS) expect(active(id) || done(id)).toBe(false);
    expect(onChart()).toEqual([]);
  });

  it('the whole wave plays: faro → REGISTRO 000 → Páginas (3D) → its battles → Canelo → Nácar → Corrector', () => {
    loadFixture('post-finale');
    const dex0 = { n: dexCount(), total: dexTotal(), species: speciesCount(), keys: Object.keys(G.s.catdex).length };
    R.tapFaro();
    checkMissions();
    expect(done('H31')).toBe(true);
    expect(active('H32')).toBe(true);
    expect(R.registro000Visible()).toBe(true);
    // REGISTRO 000 is not a species: no counts move when it shows up or opens
    R.openRegistro000();
    checkMissions();
    expect(done('H32')).toBe(true);
    expect(R.folioRevealed()).toBe(true);
    expect({ n: dexCount(), total: dexTotal(), species: speciesCount(), keys: Object.keys(G.s.catdex).length }).toEqual(dex0);
    expect(CATS.some((c) => /registro/i.test(c.id))).toBe(false);
    expect(Object.keys(G.s.catdex).some((k) => /registro/i.test(k))).toBe(false);

    // H33: the island shows up on the chart the moment the mission APPEARS; landing completes it
    expect(active('H33')).toBe(true);
    expect(G.has('region:paginas')).toBe(true);
    expect(onChart()).toEqual(['paginas']);
    expect(calling()).toEqual(['paginas']);
    expect(R.regionForGoal(MISSION_BY_ID.get('H33')!.goal)).toBe('paginas');
    G.count('feature_region_paginas');
    checkMissions();
    expect(done('H33')).toBe(true);

    // H34/H35: the two battles of the island (its marker in 3D, the pinned mission launches them as before)
    for (const [id, m] of [
      ['ruptura_paginas', 'H34'],
      ['ruptura_bibliotecario', 'H35'],
    ]) {
      expect(active(m)).toBe(true);
      expect(calling()).toEqual(['paginas']);
      expect(R.regionForGoal(MISSION_BY_ID.get(m)!.goal)).toBeNull();
      applyStoryResult(id, WIN);
      checkMissions();
      expect(done(m)).toBe(true);
    }

    // H36: Canelo's page (an activity of the island)
    expect(active('H36')).toBe(true);
    expect(calling()).toEqual(['paginas']);
    expect(R.regionForGoal(MISSION_BY_ID.get('H36')!.goal)).toBe('paginas');
    G.count('feature_pagina_canelo');
    checkMissions();
    expect(done('H36')).toBe(true);
    expect(calling()).toEqual([]);

    // H37: wins with Canelo aboard, in EVERY mode, counted after the mission appeared
    expect(active('H37')).toBe(true);
    const can = canelo();
    const other = G.s.cats.find((c) => c.species !== 'c_canelo')!;
    countCrewWins([other.uid]);
    checkMissions();
    expect(evalGoal(MISSION_BY_ID.get('H37')!)).toEqual({ cur: 0, need: 3 });
    // a story battle (crew = the active ship's crew)
    setCrew(G.s.ship.active, [can.uid, other.uid]);
    expect(crew()).toContain(can.uid);
    applyStoryResult('ruptura_paginas', WIN); // a replay: no first-win loot, still a win
    // an island duel (raft crew = the first cats of the crew)
    expect(SPECIALS.duel_guardian_bosque).toBeTruthy();
    applySpecialResult('duel_guardian_bosque', WIN);
    checkMissions();
    expect(evalGoal(MISSION_BY_ID.get('H37')!)).toEqual({ cur: 2, need: 3 });
    expect(G.has('forma:canelo_almirante')).toBe(false);
    // the Podio: a duel he wins alone
    applyDuel(can, 1, 0, true, false);
    checkMissions();
    expect(done('H37')).toBe(true);
    expect(G.has('forma:canelo_almirante')).toBe(false);

    // H38: the final blow — only when HIS shot was the last one that hurt the foe
    expect(active('H38')).toBe(true);
    applyStoryResult('ruptura_paginas', { ...WIN, finalBlow: other.uid });
    applyStoryResult('ruptura_paginas', { ...WIN, won: false, finalBlow: can.uid });
    countCrewWins([other.uid], can.uid); // he wasn't aboard: doesn't count
    checkMissions();
    expect(evalGoal(MISSION_BY_ID.get('H38')!)).toEqual({ cur: 0, need: 1 });
    expect(done('H38')).toBe(false);
    applyStoryResult('ruptura_paginas', { ...WIN, finalBlow: can.uid });
    checkMissions();
    expect(done('H38')).toBe(true);
    expect(G.s.counters[finalBlowKey('c_canelo')]).toBe(1);
    expect(G.has('forma:canelo_almirante')).toBe(true);

    // H39: Isla Nácar appears on the chart; its ship hides until the beam puzzle is solved
    expect(active('H39')).toBe(true);
    expect(G.has('region:nacar')).toBe(true);
    expect(onChart()).toEqual(['paginas', 'nacar']);
    expect(calling()).toEqual(['nacar']);
    expect(R.nacarHazOk()).toBe(false);
    expect(R.regionBattleReady('ruptura_nacar')).toBe(false);
    expect(R.regionForGoal(MISSION_BY_ID.get('H39')!.goal)).toBe('nacar');
    G.count('feature_haz_nacar');
    expect(R.nacarHazOk()).toBe(true);
    expect(R.regionForGoal(MISSION_BY_ID.get('H39')!.goal)).toBeNull();
    const loot = applyStoryResult('ruptura_nacar', WIN);
    expect(loot.newElement).toBe('crystal');
    expect(loot.newCat).toBe('c_brillito');
    expect(G.s.elements).toContain('crystal');
    expect(G.s.crystals.crystal).toBe(20);
    checkMissions();
    expect(done('H39')).toBe(true);
    expect(G.has('nacar_haz_ok')).toBe(true);
    applyStoryResult('ruptura_madrenacar', WIN);
    checkMissions();
    expect(done('H40')).toBe(true);
    expect(active('H41')).toBe(true);
    expect(calling()).toEqual([]);
    applyStoryResult('ruptura_corrector', WIN);
    checkMissions();
    expect(done('H41')).toBe(true);
    expect(G.has('oleada1_fin')).toBe(true);
    // the islands stay on the chart for good
    expect(onChart()).toEqual(['paginas', 'nacar']);
  });

  it('the map flags survive a reload and are repaired from the missions if missing', () => {
    loadFixture('post-finale');
    playUntil('H36');
    expect(G.has('region:paginas')).toBe(true);
    delete G.s.flags['region:paginas'];
    G.save();
    G.load();
    expect(G.has('region:paginas')).toBe(true);
    expect(G.has('region:nacar')).toBe(false);
  });

  it('H37 only counts wins after it appeared; H38 needs a NEW final blow too', () => {
    loadFixture('post-finale');
    playUntil('H36');
    // wins with Canelo and his final blows BEFORE H37/H38 exist don't count
    countCrewWins([canelo().uid], canelo().uid);
    countCrewWins([canelo().uid], canelo().uid);
    playUntil('H37');
    expect(evalGoal(MISSION_BY_ID.get('H37')!)).toEqual({ cur: 0, need: 3 });
    playUntil('H38');
    expect(evalGoal(MISSION_BY_ID.get('H38')!)).toEqual({ cur: 0, need: 1 });
    expect(G.s.counters.canelo_final_blow).toBe(2);
  });

  it('each battle builds and plays headless with a post-finale crew', () => {
    loadFixture('post-finale');
    for (const id of R.RUPTURA_BATTLES) {
      const r = autoBattle(buildStoryBattle(id, () => undefined), DIFFICULTY.hard, 4242, 30);
      expect(r.turns, id).toBeGreaterThan(0);
    }
  }, 60_000);
});

describe('the final blow (sim.finalBlow): same answer on screen and in the estimate', () => {
  it('a won battle names the player cat whose shot was the last to hurt the foe — deterministically', () => {
    loadFixture('post-finale');
    const spec = buildStoryBattle('ruptura_paginas', () => undefined);
    const mine = new Set(spec.player.cats.map((c) => c.uid));
    let wins = 0;
    for (const seed of [11, 22, 33, 44]) {
      const a = autoBattle(spec, DIFFICULTY.hard, seed, 30);
      const b = autoBattle(spec, DIFFICULTY.hard, seed, 30);
      expect(b.finalBlow, `seed ${seed}`).toBe(a.finalBlow);
      if (!a.won) {
        expect(a.finalBlow).toBeUndefined();
        continue;
      }
      wins++;
      expect(mine.has(a.finalBlow!), `seed ${seed}: ${a.finalBlow}`).toBe(true);
    }
    expect(wins).toBeGreaterThan(0);
    // nothing until somebody wins
    const fresh = makeBattle(spec, 5);
    expect(fresh.finalBlow).toBeNull();
    expect(fresh.lastBlow).toEqual([null, null]);
  }, 60_000);

  it('what counts as a blow: structure, modules, cats, boss parts — never misses or heals', () => {
    expect(hurtsSide({ k: 'cell', side: 1, cell: {} as never, dmg: 12, destroyed: false, path: 0, at: 0 }, 1)).toBe(true);
    expect(hurtsSide({ k: 'cell', side: 0, cell: {} as never, dmg: 12, destroyed: false, path: 0, at: 0 }, 1)).toBe(false);
    expect(hurtsSide({ k: 'cat', side: 1, uid: 'e0', dmg: 0, ko: false, shield: true, fx: {} as never, path: 0, at: 0 }, 1)).toBe(false);
    expect(hurtsSide({ k: 'module', side: 1, id: 3, kind: 'core' as never, path: 0, at: 0 }, 1)).toBe(true);
    expect(hurtsSide({ k: 'splash', x: 0, y: 0, path: 0, at: 0 }, 1)).toBe(false);
    expect(hurtsSide({ k: 'heal', side: 1, cell: {} as never, amount: 5 }, 1)).toBe(false);
  });
});

describe('the Podio final blow (H38): a K.O. counts, a judges\' decision does not', () => {
  it('the duel engine reports how it ended — deterministically', async () => {
    const { Duel } = await import('../src/podio/engine');
    const { playerFighter, rivalFighter, rivalAt } = await import('../src/state/sys/podio');
    const PB = (await import('../src/data/podio.json')).default;
    loadFixture('post-finale');
    const me = playerFighter(canelo());
    const foe = rivalFighter(rivalAt(1, 0));
    const run = (a: typeof me, b: typeof foe, seed: number) => {
      const d = new Duel(a, b, seed, 0.8);
      let last = '';
      for (let i = 0; i < 400 && !d.over; i++) for (const e of d.step()) last = e.t;
      return { d, last };
    };
    let kos = 0;
    for (const seed of [1, 2, 3, 5, 8, 13, 21, 34]) {
      const { d, last } = run(me, foe, seed);
      const again = run(me, foe, seed).d;
      expect(d.over, `seed ${seed}`).toBe(true);
      expect([again.finish, again.winner, again.n]).toEqual([d.finish, d.winner, d.n]);
      if (d.finish === 'ko') {
        kos++;
        expect(last).toBe('ko');
        expect(d.koBy).toBe(d.winner);
        expect(d.f[1 - d.winner!].hp).toBe(0);
      } else {
        expect(last).toBe('decision');
        expect(d.koBy).toBeNull();
      }
    }
    expect(kos).toBeGreaterThan(0);
    // two walls that can't hurt each other enough: the judges decide, nobody K.O.'d anybody
    const wall = run({ ...me, hp: 1e12 }, { ...foe, hp: 1e12 }, 7).d;
    expect(wall.finish).toBe('decision');
    expect(wall.n).toBe(PB.stats.max_turns);
    expect(wall.koBy).toBeNull();
    // a paper rival: Canelo knocks it out
    const ko = run(me, { ...foe, hp: 1 }, 7).d;
    expect(ko.finish).toBe('ko');
    expect(ko.koBy).toBe(0);
  });

  it('applyDuel counts canelo_final_blow only for a WON duel that ended in a K.O.', () => {
    loadFixture('post-finale');
    playUntil('H38');
    const can = canelo();
    const key = finalBlowKey('c_canelo');
    const before = G.s.counters[key] ?? 0;
    expect(applyDuel(can, 1, 0, true, false, false).ko).toBe(false); // judges' decision
    expect(applyDuel(can, 1, 0, false, false, true).ko).toBe(false); // a lost duel is never his K.O.
    checkMissions();
    expect(G.s.counters[key] ?? 0).toBe(before);
    expect(done('H38')).toBe(false);
    const loot = applyDuel(can, 1, 0, true, false, true);
    expect(loot.ko).toBe(true);
    expect(G.s.counters[key]).toBe(before + 1);
    checkMissions();
    expect(done('H38')).toBe(true);
    expect(G.has('forma:canelo_almirante')).toBe(true);
  });
});
