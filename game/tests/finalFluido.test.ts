/**
 * (agent FINAL) EL FINAL de corrido y con la música correcta (docs/part-iii/agentes/FINAL.md; ⚠️ spoilers).
 * The owner: «por las canciones… se pierden la gracia de las escenas… muchas pantallas de carga… se pierde esa sensación
 * de "puta murió"». Measured: the island's song under every silent film, the Part I chiptune under the siege and «La
 * caída», a loading screen per film. Here: the quiet hold, the siege's own music, the one-take theme, the warm-ups and the
 * held frames, as data and as what the flows ask the film engine for.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

const mem = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = ({
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, String(v)),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear(),
  key: (i: number) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size;
  },
});
const ui: string[] = [];
vi.mock('../src/ui/dialog', () => ({ say: async () => undefined, storyLayer: () => ({}), dialogActive: () => false }));
vi.mock('../src/ui/story/profile', () => ({ choicePrompt: async () => 'go' }));
vi.mock('../src/ui/story/finalUi', () => ({
  onePress: async () => void ui.push('press'),
  desayuno: async () => (ui.push('desayuno'), 2),
  oscurasMira: async () => (ui.push('mira'), 'tap'),
  diselo: async () => void ui.push('diselo'),
  loQueQuedo: async () => void ui.push('quedo'),
  LISTA_ESCONDIDA: [],
  SOBRECITO: '',
}));
vi.mock('../src/app/flow', () => ({ goIsland: async () => void ui.push('home') }));
vi.mock('../src/app/story', () => ({ storyLines: () => [] }));

const { G } = await import('../src/state');
const { SAVE_KEY } = await import('../src/core/save');
const { checkMissions } = await import('../src/state/sys/missions');
const SI = await import('../src/app/stageIntro');
const F = await import('../src/app/finalFlow');
const { audioApi } = await import('../src/audio/api');
const { cleanTable, resolveTarget, quietOver } = await import('../src/audio/directorTable');
const { F32_CAIDA, F34_AMANECER, F34_GOLPE, F33_NOCHE } = await import('../src/film/films/final');
const { validateFilm } = await import('../src/film/timeline');

const TABLE = cleanTable((await import('../src/data/music/director.json')).default);
const tracks = JSON.parse(readFileSync(new URL('../src/data/music/tracks.json', import.meta.url), 'utf8')) as { variations?: { id: string; file: string; loop?: { start: number; end: number } }[] }[];
const variation = (id: string) => tracks.flatMap((t) => t.variations ?? []).find((v) => v.id === id);

describe('the music of the finale, as data', () => {
  it('the siege plays «Ojo del huracán» (the piece F31 presents grave), looping — never the Part I chiptune', () => {
    const t = resolveTarget(TABLE, { state: 'battle', context: 'p3_final', partII: true, has: () => true });
    expect(t).toMatchObject({ kind: 'track', ref: 'fut.jefe', loop: true });
    const full = variation('fut.jefe')!;
    const grave = variation('fut.jefe.grave')!;
    expect(full.loop).toEqual(grave.loop); // the same bars: F32 can cross to the grave mix at the same position
    expect(existsSync(new URL(`../public/${full.file}`, import.meta.url))).toBe(true);
  });

  it('a QUIET hold silences the game\'s own music (state, island, procedural) but never a film\'s song or the Fonoteca', () => {
    const island = resolveTarget(TABLE, { state: 'island', partII: true, has: () => true });
    expect(quietOver(island, true)).toMatchObject({ kind: 'silence' });
    expect(quietOver(island, false)).toBe(island);
    const proc = resolveTarget(TABLE, { state: 'battle', partII: false, has: () => true });
    expect(quietOver(proc, true)).toMatchObject({ kind: 'silence' });
    const cue = resolveTarget(TABLE, { state: 'island', partII: true, has: () => true, cue: { ref: 'sadie', opts: { narrative: true } } });
    expect(quietOver(cue, true)).toBe(cue);
    const listen = resolveTarget(TABLE, { state: 'island', partII: true, has: () => true, listen: { ref: 'sadie' } });
    expect(quietOver(listen, true)).toBe(listen);
  });

  it('«La caída» carries the siege\'s take, thinner and quieter, and cuts it dead when the flame goes out (K6 = 17 s)', () => {
    expect(F32_CAIDA.track ?? null).toBe(null);
    expect(F32_CAIDA.carry?.to).toBe('fut.jefe.grave');
    expect(F32_CAIDA.carry?.cut).toBe(17);
    const d = F32_CAIDA.carry!.duck!;
    for (let i = 1; i < d.length; i++) {
      expect(d[i][0]).toBeGreaterThan(d[i - 1][0]);
      expect(d[i][1]).toBeGreaterThanOrEqual(d[i - 1][1]); // only ever quieter
    }
    expect(d[d.length - 1][0]).toBeLessThan(17);
    expect(validateFilm(F32_CAIDA)).toEqual([]);
  });

  it('Canelo\'s theme is ONE take: the dawn keeps it, the breakfast rides it, the blow joins it and cuts it dry', () => {
    expect(F34_AMANECER.keep).toBe(true);
    expect(F34_GOLPE.track).toBe(F34_AMANECER.track);
    expect(F34_GOLPE.join).toBeTruthy();
    expect(F34_GOLPE.cutDry).toBe(true);
    // the night has no music of its own (and the quiet hold keeps the island's out)
    expect(F33_NOCHE.track ?? null).toBe(null);
  });
});

describe('the flows: quiet, warm the next film, hold the last frame', () => {
  const quiet: [boolean, string][] = [];
  const played: { id: string; hold?: boolean; bare?: boolean; seen: boolean }[] = [];
  const warmed: [string, boolean][] = [];
  const releases: number[] = [];
  let holding = false;
  const HAS = ['f31_luz', 'f32_caida', 'f33_noche', 'f34_amanecer', 'f34_golpe', 'f34_trazo', 'f35_sadie', 'f36_mira', 'f37_mano', 'f38_vigilia', 'f39_recado', 'f39_creditos', 'f39_continuara'];
  beforeEach(() => {
    quiet.length = 0;
    played.length = 0;
    warmed.length = 0;
    releases.length = 0;
    ui.length = 0;
    holding = false;
    audioApi.quiet = (on, o) => void quiet.push([on, o?.key ?? 'api']);
    F.FINAL_TIMING.laterMs = 0;
    F.setFinalBattlePort(async () => 'won');
    SI.setFilmPort({
      has: (id) => HAS.includes(id),
      ids: () => HAS,
      play: async (id, o) => {
        played.push({ id: String(id), hold: o.hold, bare: o.bare, seen: o.seen });
        o.next?.();
        holding = !!o.hold;
        return { end: 'done' };
      },
      preload: async (id, o) => (warmed.push([id, o.seen]), true),
      releaseHold: async (fade) => {
        releases.push(fade ?? 0);
        holding = false;
      },
      holding: () => holding,
    });
    mem.clear();
    mem.set(SAVE_KEY, readFileSync(new URL('../test-saves/h93-final.json', import.meta.url), 'utf8'));
    G.load();
    checkMissions();
  });

  it('H93: F31 holds into the siege; «La caída» warms during the last fight, holds, and from it on the game is quiet', async () => {
    expect(await F.playStoryFlow('h93_asedio')).toBe('done');
    expect(played.map((p) => p.id)).toEqual(['f31_luz', 'f32_caida']);
    expect(played.every((p) => p.hold)).toBe(true);
    expect(warmed.map((w) => w[0])).toContain('f33_noche');
    expect(quiet.some(([on, k]) => on && k === 'final')).toBe(true);
  });

  it('H94: the death runs on the cut — blow, stroke and SADIE warmed ahead and held; MIRA waits on black; quiet all along', async () => {
    expect(await F.playStoryFlow('h93_asedio')).toBe('done');
    checkMissions();
    played.length = 0;
    warmed.length = 0;
    quiet.length = 0;
    expect(await F.playStoryFlow('h94_sin_llama')).toBe('done');
    expect(played.map((p) => p.id)).toEqual(['f33_noche', 'f34_amanecer', 'f34_golpe', 'f34_trazo', 'f35_sadie', 'f36_mira']);
    const by = (id: string) => played.find((p) => p.id === id)!;
    for (const id of ['f33_noche', 'f34_golpe', 'f34_trazo', 'f35_sadie', 'f36_mira']) expect(by(id).hold, id).toBe(true);
    expect(by('f36_mira').bare).toBe(true);
    // SADIE warms with the skip rule it plays with (its first view can't be skipped)
    expect(warmed).toContainEqual(['f35_sadie', false]);
    expect(by('f35_sadie').seen).toBe(false);
    for (const id of ['f34_amanecer', 'f34_golpe', 'f34_trazo', 'f36_mira', 'f37_mano']) expect(warmed.map((w) => w[0]), id).toContain(id);
    expect(quiet[0]).toEqual([true, 'final']);
    expect(quiet.some(([on]) => !on)).toBe(false);
    // SADIE's black is let go before «A oscuras» takes the screen
    expect(ui.indexOf('mira')).toBeGreaterThan(-1);
    expect(releases.length).toBeGreaterThan(0);
  });

  it('H95–H96: each film holds into the next; after «Continuará» the quiet lets go (the island\'s music comes back)', async () => {
    for (const f of ['h93_asedio', 'h94_sin_llama', 'h95_vigilia']) {
      expect(await F.playStoryFlow(f)).toBe('done');
      checkMissions();
    }
    played.length = 0;
    quiet.length = 0;
    F.FINAL_TIMING.afterMs = 20;
    try {
      expect(await F.playStoryFlow('h96_recado')).toBe('done');
      expect(played.map((p) => p.id)).toEqual(['f39_recado', 'f39_creditos', 'f39_continuara']);
      expect(played.every((p) => p.hold)).toBe(true);
      expect(quiet.some(([on]) => !on)).toBe(false);
      await new Promise((r) => setTimeout(r, 80));
      expect(quiet[quiet.length - 1]).toEqual([false, 'final']);
    } finally {
      F.FINAL_TIMING.afterMs = 9000;
    }
  });

  it('a save past the death (SADIE\'s beat persisted) never replays the blow, the stroke or SADIE', async () => {
    expect(await F.playStoryFlow('h93_asedio')).toBe('done');
    checkMissions();
    const { markBeat } = await import('../src/state/ext/story');
    for (const k of ['b94_noche', 'b94_amanecer', 'b94_desayuno', 'b94_golpe', 'b94_trazo', 'b94_sadie']) markBeat(k);
    G.save();
    G.load();
    played.length = 0;
    warmed.length = 0;
    expect(await F.playStoryFlow('h94_sin_llama')).toBe('done');
    expect(played.map((p) => p.id)).toEqual(['f36_mira']);
    expect(warmed.map((w) => w[0])).not.toContain('f35_sadie');
    expect(warmed.map((w) => w[0])).not.toContain('f34_golpe');
  });
});
