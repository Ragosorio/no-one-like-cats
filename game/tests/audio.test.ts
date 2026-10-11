/**
 * Parte II audio engine (src/audio, docs/part-ii/19-audio-arquitectura.md): the pure parts in node.
 *  - director table resolution (Part I untouched, Part II candidates, cue/listen/island priority)
 *  - quantization math (next bar/beat from a beat map, across a loop)
 *  - the beat scheduler never double-fires and handles big frame gaps consistently
 *  - settings migration (old musicVolume/sfxVolume → per-bus sliders, same loudness)
 *  - Fonoteca unlocks: idempotent, persisted through save/normalize, restored from the mirror
 *  - the sound invitation shows once
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// node: a tiny localStorage + window (the game modules expect a browser)
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
(globalThis as { window?: unknown }).window ??= globalThis;

const { buildEvents, cleanBeatMap, nextGridTime, occurrences, wrapPos, gridFromTempo } = await import('../src/audio/beatgrid');
const { BeatScheduler } = await import('../src/audio/clock');
const { cleanTable, resolveTarget, sameTarget, pickTrack } = await import('../src/audio/directorTable');
const TABLE = cleanTable((await import('../src/data/music/director.json')).default);
const { migrateSettings, VOL_DEFAULTS } = await import('../src/core/settings');
const { makeInviter } = await import('../src/audio/invite');
const { normalizeMusicExt, mergeUnlocks } = await import('../src/audio/musicSave');
const { G, newGame } = await import('../src/state');
const { normalize } = await import('../src/state/migrate');
const { defaultState } = await import('../src/state/game');
const fon = await import('../src/audio/fonoteca');

// a 120 bpm map: beats every 0.5 s from 0.1, bars every 2 s, two sections, one marker
const MAP = cleanBeatMap({
  id: 't',
  duration: 32,
  bpm: 120,
  offset: 0.1,
  beats: Array.from({ length: 64 }, (_, i) => 0.1 + i * 0.5),
  downbeats: Array.from({ length: 16 }, (_, i) => 0.1 + i * 2),
  sections: [
    { name: 'intro', start: 0, end: 8.1, energy: 0.3 },
    { name: 'drop', start: 8.1, end: 32, energy: 0.9 },
  ],
  markers: [{ name: 'hit', time: 12.1 }],
})!;
const EV = buildEvents(MAP);

describe('beat grid', () => {
  it('cleans loose maps (unsorted, junk, missing arrays)', () => {
    const m = cleanBeatMap({ beats: [3, 1, 'x', 2, -1], sections: [{ name: 'b', start: 4 }, { name: 'a', start: 0 }, { start: 2 }] })!;
    expect(m.beats).toEqual([1, 2, 3]);
    expect(m.downbeats).toEqual([]);
    expect(m.sections.map((s) => s.name)).toEqual(['a', 'b']);
    expect(cleanBeatMap(null)).toBeNull();
  });
  it('bars know their beat and beats know their bar', () => {
    const bar3 = EV.find((e) => e.type === 'bar' && e.bar === 3)!;
    expect(bar3.t).toBeCloseTo(6.1);
    expect(bar3.beat).toBe(12);
    const beat13 = EV.find((e) => e.type === 'beat' && e.beat === 13)!;
    expect(beat13.bar).toBe(3);
  });
  it('wraps unwrapped time through a loop', () => {
    const L = { start: 8.1, end: 16.1 };
    expect(wrapPos(5, L)).toBe(5);
    expect(wrapPos(16.1, L)).toBeCloseTo(8.1);
    expect(wrapPos(16.1 + 8 * 3 + 1, L)).toBeCloseTo(9.1);
    expect(wrapPos(40, null)).toBe(40);
  });
  it('enumerates each loop occurrence exactly once', () => {
    const L = { start: 8.1, end: 16.1 };
    const occ = occurrences(EV, 0, 40, L).filter((o) => o.e.type === 'bar');
    const us = occ.map((o) => +o.u.toFixed(3));
    expect(new Set(us).size).toBe(us.length);
    // first pass bars 0.1..14.1 (8), then every 8 s pass has 4 bars (8.1,10.1,12.1,14.1 → +8)
    expect(us.slice(0, 8)).toEqual([0.1, 2.1, 4.1, 6.1, 8.1, 10.1, 12.1, 14.1]);
    expect(us.slice(8, 12)).toEqual([16.1, 18.1, 20.1, 22.1]);
    // the loop end itself (16.1 in file time) is never an event of the first pass
    expect(occurrences(EV, 16, 16.2, L).every((o) => o.e.t !== 16.1)).toBe(true);
  });
  it('quantization: next bar / beat from a position, with lead', () => {
    expect(nextGridTime(EV, 3.0, 'bar', null, 0.05)).toBeCloseTo(4.1);
    expect(nextGridTime(EV, 4.08, 'bar', null, 0.05)).toBeCloseTo(6.1); // too close to 4.1 → next bar
    expect(nextGridTime(EV, 3.0, 'beat', null, 0.05)).toBeCloseTo(3.1);
    // across the loop: at 15.5 (file) the next bar is the loop's first bar, 8.1 → unwrapped 16.1
    expect(nextGridTime(EV, 15.5, 'bar', { start: 8.1, end: 16.1 }, 0.05)).toBeCloseTo(16.1);
    // past the last bar of a non-looping track: none
    expect(nextGridTime(EV, 31.5, 'bar', null, 0.05)).toBeNull();
  });
  it("keeps MUSIC's choreography hits and voice ranges, as events", async () => {
    const real = cleanBeatMap((await import('../src/data/music/beatmaps/liky_fight.json')).default, 'liky_fight')!;
    expect(real.hits!.length).toBeGreaterThan(300);
    expect(real.hits![0]).toMatchObject({ time: expect.any(Number), strength: expect.any(Number), kind: expect.any(String) });
    expect(real.voice!.length).toBeGreaterThan(0);
    expect(real.loop).toMatchObject({ start: expect.any(Number), end: expect.any(Number) });
    const m = cleanBeatMap({ beats: [0, 1], hits: [{ time: 0.5, strength: 0.7, kind: 'snare' }, { time: 'x' }], voice: [{ start: 1, end: 2 }, { start: 3, end: 2 }] })!;
    const s = new BeatScheduler();
    const got: string[] = [];
    s.on('hit:snare', (i) => got.push(`snare ${i.strength}`));
    s.on('voice:start', () => got.push('voice on'));
    s.on('voice:end', () => got.push('voice off'));
    s.setTimeline(buildEvents(m), null, 0, (u) => u);
    for (let t = 0; t < 3; t += 0.05) s.tick(t);
    expect(got).toEqual(['snare 0.7', 'voice on', 'voice off']);
  });
  it('a tempo-only grid (no beat map yet)', () => {
    const g = gridFromTempo(90, 0.4, 10)!;
    expect(g.beats[1] - g.beats[0]).toBeCloseTo(60 / 90);
    expect(g.downbeats.length).toBe(Math.ceil(g.beats.length / 4));
  });
});

describe('beat scheduler (audio clock)', () => {
  const run = (o: ConstructorParameters<typeof BeatScheduler>[0] = {}, loop: { start: number; end: number } | null = null) => {
    const s = new BeatScheduler({ lookahead: 0.016, maxLate: 0.25, ...o });
    const got: { ev: string; t: number; late: number; name?: string }[] = [];
    for (const ev of ['beat', 'bar', 'section', 'marker']) s.on(ev, (i) => got.push({ ev, t: +i.time.toFixed(3), late: i.late ?? 0, name: i.name }));
    s.setTimeline(EV, loop, 0, (u) => 100 + u);
    return { s, got };
  };
  it('steady 60 fps: every beat once, on time, in order', () => {
    const { s, got } = run();
    for (let t = 0; t <= 10; t += 1 / 60) s.tick(t);
    const beats = got.filter((g) => g.ev === 'beat');
    expect(beats.length).toBe(20); // 0.1 … 9.6
    expect(new Set(beats.map((b) => b.t)).size).toBe(20);
    expect(beats.every((b) => b.late < 0.02)).toBe(true);
    expect(got.filter((g) => g.ev === 'section').map((g) => g.name)).toEqual(['intro', 'drop']);
    expect(beats[0].t).toBeCloseTo(100.1); // time = ctx time of the event
  });
  it('never double-fires: jitter, time going backwards, two tick sources', () => {
    const { s, got } = run();
    let t = 0;
    for (let i = 0; i < 2000; i++) {
      t += 0.004 + Math.random() * 0.02;
      s.tick(t);
      s.tick(t - Math.random() * 0.05); // a second source / an older clock reading
      s.tick(t); // the same instant again
    }
    const keys = got.map((g) => `${g.ev}@${g.t}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it('a big frame gap: old beats are skipped, the latest section and every marker still arrive', () => {
    const { s, got } = run();
    s.tick(1);
    s.tick(13); // 12 s of nothing (throttled tab)
    const late = got.filter((g) => g.t > 101.2);
    // beats/bars older than maxLate: skipped; the drop section (8.1) and the hit marker (12.1) delivered once, flagged late
    expect(late.filter((g) => g.ev === 'beat').every((g) => g.late <= 0.25)).toBe(true);
    expect(late.filter((g) => g.ev === 'section').map((g) => g.name)).toEqual(['drop']);
    expect(late.filter((g) => g.ev === 'marker').map((g) => g.name)).toEqual(['hit']);
    expect(late.find((g) => g.ev === 'marker')!.late).toBeCloseTo(0.9, 1);
    expect(s.stats.skipped).toBeGreaterThan(10);
    // and nothing fires twice afterwards
    s.tick(13);
    s.tick(12);
    const n = got.length;
    s.tick(13.001);
    expect(got.length).toBe(n);
  });
  it('loops: each pass fires its bars once, hours later still bounded', () => {
    const { s, got } = run({}, { start: 8.1, end: 16.1 });
    for (let t = 0; t <= 40; t += 1 / 30) s.tick(t);
    const bars = got.filter((g) => g.ev === 'bar').map((g) => g.t);
    expect(new Set(bars).size).toBe(bars.length);
    expect(bars.length).toBe(20); // 8 in the first pass + 4 per 8 s pass × 3
    s.tick(3600 * 5); // 5 h later: scans at most maxScan, no freeze
    expect(s.stats.ticks).toBeGreaterThan(1000);
  });
  it('a cue that starts mid-song announces its section, not the earlier markers', () => {
    const s = new BeatScheduler();
    const got: string[] = [];
    s.on('section', (i) => got.push(`s:${i.name}`));
    s.on('marker', (i) => got.push(`m:${i.name}`));
    s.setTimeline(EV, null, 13, (u) => u);
    s.tick(13.05);
    expect(got).toEqual(['s:drop']);
  });
});

describe('director table', () => {
  const has = (refs: string[]) => (r: string) => refs.includes(r);
  it('Part I: procedural moods, exactly as before (no file ever)', () => {
    for (const st of ['island', 'battle', 'boss', 'explore_mystery', 'silence'] as const) {
      const t = resolveTarget(TABLE, { state: st, partII: false, has: () => true, islandTrack: 'liky_fight', cue: null });
      expect(t.kind === 'track').toBe(false);
    }
    expect(resolveTarget(TABLE, { state: 'battle', partII: false, has: () => true })).toMatchObject({ kind: 'procedural', mood: 'battle', fade: 0 });
    expect(resolveTarget(TABLE, { state: 'explore_mystery', partII: false, has: () => true })).toMatchObject({ kind: 'procedural', mood: 'tension' });
  });
  it('Part II: first available candidate, else the procedural fallback', () => {
    expect(resolveTarget(TABLE, { state: 'island', partII: true, has: has([]) })).toMatchObject({ kind: 'procedural', mood: 'island' });
    expect(resolveTarget(TABLE, { state: 'island', partII: true, has: has(['when_i_lose.ambient']) })).toMatchObject({ kind: 'track', ref: 'when_i_lose.ambient', source: 'state' });
    expect(resolveTarget(TABLE, { state: 'battle_special', partII: true, has: has(['liky_fight.battle']) })).toMatchObject({ kind: 'track', ref: 'liky_fight.battle', sync: true, quantize: 'now', loop: false });
    expect(resolveTarget(TABLE, { state: 'silence', partII: true, has: () => true })).toMatchObject({ kind: 'silence' });
  });
  it('priority: listen > cue > island music > table', () => {
    const base = { state: 'island' as const, partII: true, has: () => true, islandTrack: 'hemkade.ambient' };
    expect(resolveTarget(TABLE, base)).toMatchObject({ ref: 'hemkade.ambient', source: 'island' });
    expect(resolveTarget(TABLE, { ...base, cue: { ref: 'te_odio', opts: { narrative: true } } })).toMatchObject({ ref: 'te_odio', source: 'cue' });
    expect(resolveTarget(TABLE, { ...base, cue: { ref: 'te_odio', opts: {} }, listen: { ref: 'yonose_todo' } })).toMatchObject({ ref: 'yonose_todo', source: 'listen' });
    // island music only on the island
    expect(resolveTarget(TABLE, { ...base, state: 'explore' })).not.toMatchObject({ ref: 'hemkade.ambient' });
    // a cue on a track the catalog doesn't have yet is ignored (never silence by mistake)
    expect(resolveTarget(TABLE, { ...base, has: (r) => r !== 'nope', cue: { ref: 'nope', opts: {} } })).toMatchObject({ source: 'island' });
  });
  it('contexts override a state; rotate picks round-robin', () => {
    const t = cleanTable({ partII: { explore: { tracks: ['a', 'b', 'c'], pick: 'rotate' } }, contexts: { 'explore:corona': { tracks: ['z'] } } });
    expect(resolveTarget(t, { state: 'explore', context: 'corona', partII: true, has: () => true })).toMatchObject({ ref: 'z' });
    expect([0, 1, 2, 3].map((r) => pickTrack(t.partII.explore!, () => true, r))).toEqual(['a', 'b', 'c', 'a']);
  });
  it('same music is not restarted', () => {
    const a = resolveTarget(TABLE, { state: 'battle', partII: true, has: () => false });
    const b = resolveTarget(TABLE, { state: 'battle', partII: true, has: () => false });
    expect(sameTarget(a, b)).toBe(true);
  });
});

describe('settings migration', () => {
  it('old raw gains keep the same loudness on the new sliders', () => {
    const s = migrateSettings({ musicVolume: 0.35, sfxVolume: 0.49, muted: true, reduceMotion: true });
    const vol = s.vol as Record<string, number>;
    expect(vol.music).toBeCloseTo(0.59, 2);
    expect(vol.sfx).toBeCloseTo(0.7, 2);
    expect(vol.master).toBe(VOL_DEFAULTS.master);
    expect(vol.ambient).toBe(VOL_DEFAULTS.ambient);
    expect(s.muted).toBe(true);
    expect(s.reduceMotion).toBe(true);
    expect(s.soundInvite).toBeNull();
    // the legacy mirrors stay = gain (an old cached build reads them)
    expect(s.musicVolume as number).toBeCloseTo(0.59 ** 2, 2);
  });
  it('new shape: repaired, never reset', () => {
    const s = migrateSettings({ vol: { master: 2, music: 'x', sfx: 0.3 }, soundInvite: 'on' });
    expect(s.vol).toMatchObject({ master: 1, music: VOL_DEFAULTS.music, sfx: 0.3, voice: VOL_DEFAULTS.voice });
    expect(s.soundInvite).toBe('on');
    expect(migrateSettings(migrateSettings({ musicVolume: 0.1 }))).toEqual(migrateSettings({ musicVolume: 0.1 }));
  });
});

describe('sound invitation', () => {
  it('shows once, remembers the answer, never when the sound is already on', async () => {
    let stored: 'on' | 'off' | null = null;
    let audible = false;
    const show = vi.fn(async () => {
      stored = 'off';
      return 'off' as const;
    });
    const ensure = makeInviter({ audible: () => audible, answered: () => stored, show });
    const [a, b] = await Promise.all([ensure(), ensure()]); // two callers at once: one card
    expect([a, b]).toEqual(['off', 'off']);
    expect(await ensure()).toBe('off');
    expect(show).toHaveBeenCalledTimes(1);
    stored = null;
    audible = true;
    expect(await ensure()).toBe('on');
    expect(show).toHaveBeenCalledTimes(1);
  });
});

describe('Fonoteca (save)', () => {
  beforeEach(() => {
    mem.clear();
    newGame();
    G.otherWindow = false;
    G.staleWindow = false;
  });
  const toPartII = () => {
    if (!G.s.missions.done.includes('H30')) G.s.missions.done.push('H30');
  };
  it('unlocks are idempotent and celebrated once per song', () => {
    toPartII();
    const seen: { ref: string; first: boolean }[] = [];
    const off = fon.onSongUnlock((e) => seen.push({ ref: e.ref, first: e.firstOfSong }));
    expect(fon.unlockSong('liky_fight', 'Isla Nácar')).toBe(true);
    expect(fon.unlockSong('liky_fight', 'otra vez')).toBe(false);
    expect(fon.unlockSong('liky_fight.ambient', 'Corona')).toBe(true);
    off();
    expect(seen).toEqual([
      { ref: 'liky_fight', first: true },
      { ref: 'liky_fight.ambient', first: false },
    ]);
    expect(fon.musicExt().unlocked.liky_fight.source).toBe('Isla Nácar');
    expect(fon.unlockedRefs('liky_fight')).toEqual(['liky_fight', 'liky_fight.ambient']);
    expect(fon.fonotecaAvailable()).toBe(true);
  });
  it('the HUD entry stays hidden in Part I', () => {
    fon.unlockSong('te_odio', 'x');
    G.s.missions.done = G.s.missions.done.filter((m) => m !== 'H30');
    expect(fon.fonotecaAvailable()).toBe(false);
  });
  it('survives save → load → normalize, and broken shapes are repaired, not dropped', () => {
    toPartII();
    fon.unlockSong('hemkade', 'Jefe');
    fon.toggleFavorite('hemkade');
    fon.setIslandTrack('hemkade');
    G.save();
    G.load();
    expect(fon.isUnlocked('hemkade')).toBe(true);
    expect(fon.isFavorite('hemkade')).toBe(true);
    expect(fon.islandTrack()).toBe('hemkade');
    // hand-edited / older shapes
    const raw = { ...defaultState(), ext: { music: { unlocked: ['a', 'a', 7, 'b.ambient'], favorites: 'x', islandTrack: 3, prefs: { repeat: 'nope' } } } };
    const s = normalize(raw as never, defaultState());
    const m = (s.ext as { music: ReturnType<typeof normalizeMusicExt> }).music;
    expect(Object.keys(m.unlocked)).toEqual(['a', 'b.ambient']);
    expect(m.favorites).toEqual([]);
    expect(m.islandTrack).toBeNull();
    expect(m.prefs.repeat).toBe('all');
    expect(normalizeMusicExt(normalizeMusicExt(m))).toEqual(m);
    // a save without ext.music is not touched
    const plain = normalize({ ...defaultState() } as never, defaultState());
    expect(plain.ext).toBeUndefined();
  });
  it('a wiped ext.music (narrative reset, old backup) comes back from the mirror', () => {
    toPartII();
    fon.unlockSong('circus_malus', 'Circo');
    delete (G.s.ext as Record<string, unknown>).music;
    expect(fon.isUnlocked('circus_malus')).toBe(false);
    expect(fon.restoreFromMirror()).toBe(1);
    expect(fon.isUnlocked('circus_malus')).toBe(true);
    expect(fon.musicExt().unlocked.circus_malus.source).toBe('Circo');
    // union never subtracts and keeps the earliest date
    const into = { a: { at: 50, source: '' } };
    mergeUnlocks(into, { a: { at: 10, source: 'X' }, b: { at: 5, source: 'Y' } });
    expect(into).toEqual({ a: { at: 10, source: 'X' }, b: { at: 5, source: 'Y' } });
  });
});

describe('director (stateful, mock AudioContext)', () => {
  // the minimum of Web Audio the director touches: a clock and gain params
  const param = () => ({ value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime() {} });
  const mkCtx = () => ({ currentTime: 10, state: 'running', createGain: () => ({ gain: param(), connect() {}, disconnect() {} }) });
  it('cues override, non-narrative cues end with the state, release gives the music back; never two songs', async () => {
    const { audio } = await import('../src/core/audio');
    const { music } = await import('../src/core/music');
    const { Director } = await import('../src/audio/director');
    const { setCatalog } = await import('../src/audio/catalog');
    newGame();
    if (!G.s.missions.done.includes('H30')) G.s.missions.done.push('H30');
    const a = audio as unknown as { ctx: unknown; procBus: unknown };
    a.ctx = mkCtx();
    a.procBus = { gain: param() };
    const raw = vi.spyOn(music, 'playRaw').mockImplementation(() => undefined);
    vi.spyOn(music, 'stopRaw').mockImplementation(() => undefined);
    setCatalog([
      { id: 'liky_fight', title: 'LIKY FIGHT', file: 'liky_fight.mp3', durationSec: 237, bpm: 130.8, key: '', variations: [], loop: null, cover: { palette: [], motif: 'fight' }, moods: [] },
      { id: 'yonose_todo', title: 'YONOSE TODO', file: 'yonose_todo.mp3', durationSec: 209, bpm: 90, key: '', variations: [{ id: 'ambient', file: 'yonose_todo_ambient.mp3', kind: 'ambient' }], loop: null, cover: { palette: [], motif: 'heart' }, moods: [] },
    ]);
    const playing: string[] = [];
    let cur: string | null = null;
    const fake = {
      cur: null as null | { ref: { ref: string } },
      play: vi.fn(async (r: { ref: string }) => {
        cur = r.ref;
        playing.push(r.ref);
        fake.cur = { ref: r };
        return {};
      }),
      stop: vi.fn(() => {
        cur = null;
        fake.cur = null;
      }),
    };
    const d = new Director(fake as never);
    d.setState('island');
    expect(cur).toBe('yonose_todo.ambient'); // table: island → yonose_todo.ambient
    d.setState('island'); // same state again: no restart
    expect(fake.play).toHaveBeenCalledTimes(1);
    d.cue('liky_fight', { quantize: 'now' }); // a special battle (scene-scoped)
    expect(cur).toBe('liky_fight');
    d.setState('island'); // same state: the cue stays
    expect(cur).toBe('liky_fight');
    d.setState('battle'); // the scene changed: the non-narrative cue ends → procedural battle
    expect(cur).toBeNull();
    expect(raw).toHaveBeenLastCalledWith('battle');
    d.cue('liky_fight', { narrative: true });
    d.setState('island');
    expect(cur).toBe('liky_fight'); // narrative cues survive state changes
    d.release();
    expect(cur).toBe('yonose_todo.ambient');
    // the player only ever holds ONE current song (the fake replaces it; real decks crossfade)
    expect(new Set(playing).size).toBeLessThanOrEqual(2);
    // Part I: setState never touches the procedural music (the scenes own it); a cue gives the mood back
    G.s.missions.done = G.s.missions.done.filter((m) => m !== 'H30');
    raw.mockClear();
    d.setState('battle');
    d.setState('boss');
    expect(raw).not.toHaveBeenCalled();
    (music as unknown as { mood: string }).mood = 'boss';
    d.cue('liky_fight', { narrative: true });
    expect(cur).toBe('liky_fight');
    d.release();
    expect(cur).toBeNull();
    expect(raw).toHaveBeenLastCalledWith('boss');
    (music as unknown as { mood: string }).mood = 'silence';
    a.ctx = null;
    setCatalog([]);
    vi.restoreAllMocks();
  });
});
