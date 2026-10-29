/**
 * (P3-CINE, 2026-10-29; ⚠️ Parte III spoilers) The owner: «la parte tres no me gusta la pantalla de carga, me gustaba más
 * la parte dos que el entorno se convertía en lo que se iba a hacer, además no hay como "canciones" a las que volver a
 * reproducir».
 *  · the TRANSFORMATION (film/morph.ts) replaces the loading screen: every presentation style has its look, the film's
 *    style is found, the titled loader is only the fallback of a slow device;
 *  · the stage's film warms while its card is read, the flows warm their next film, the finale keeps its hard cuts;
 *  · «Volver a ver» lists Part III's songs (♪) after its films, in story order, each one the song film that plays it;
 *    the Fonoteca gets them (silently during the mourning).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const mem = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, String(v)),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear(),
  key: (i: number) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size;
  },
};

const read = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8');
const { P3_SONGS, P3_SONG_FILMS, reachedP3Songs, replayEntries, songOfFilm } = await import('../src/app/p3Songs');
const { ACTO1_FILMS } = await import('../src/film/films/acto1');
const { ACTO2_FILMS } = await import('../src/film/films/acto2');
const { ACTO3_FILMS } = await import('../src/film/films/acto3');
const { ACTO4_FILMS } = await import('../src/film/films/acto4');
const { FINAL_FILMS } = await import('../src/film/films/final');
const FILMS = new Map([...ACTO1_FILMS, ...ACTO2_FILMS, ...ACTO3_FILMS, ...ACTO4_FILMS, ...FINAL_FILMS].map((f) => [f.id, f]));
const tracks = JSON.parse(read('data/music/tracks.json')) as { id: string; title: string }[];

describe('Part III songs: the song films', () => {
  it('each song is a catalog original, played by its own song film(s), in story order', () => {
    let last = 0;
    for (const s of P3_SONGS) {
      expect(tracks.find((t) => t.id === s.song)?.title, s.song).toBe(s.title);
      for (const id of s.films) {
        const f = FILMS.get(id);
        expect(f, id).toBeTruthy();
        expect(f!.kind, id).toBe('song');
        expect(f!.track, id).toBe(s.song);
      }
      const n = Number(s.mission.slice(1));
      expect(n).toBeGreaterThan(last);
      last = n;
    }
    // every Part III song film is listed (DRUNCK's moment is a Momento)
    const songFilms = [...FILMS.values()].filter((f) => f.kind === 'song' && f.track && !f.track.includes('.')).map((f) => f.id);
    for (const id of songFilms) expect(P3_SONG_FILMS.has(id), id).toBe(true);
    expect(songOfFilm('F25_BISAGRA')?.song).toBe('distor');
    expect(songOfFilm('f09')).toBe(null);
  });

  it('only the songs reached (their film seen), story order, the first seen variant replays', () => {
    expect(reachedP3Songs([])).toEqual([]);
    const r = reachedP3Songs(['intro:p3d_borracha_1', 'film:f35_sadie', 'film:f25_bisagra', 'film:f06', 'film:f09']);
    expect(r.map((x) => [x.song.song, x.film])).toEqual([
      ['emen', 'f06'],
      ['distor', 'f25_bisagra'],
      ['sadie', 'f35_sadie'],
    ]);
  });
});

describe('«Volver a ver»: each part\'s songs after its scenes', () => {
  const momentos = [
    { id: 'when_i_lose', title: 'WHEN I LOSE', order: 35 },
    { id: 'liky_fight', title: 'LIKY FIGHT', order: 44 },
    { id: 'drunck', title: 'DRUNCK', order: 66 },
  ];
  const films = [
    { id: 'film:f01', title: 'Oficial Dona' },
    { id: 'film:f06', title: 'Cuadra 8' },
    { id: 'film:f07', title: 'El Cadenero' },
    { id: 'film:f08', title: 'Caída por el multiverso' },
  ];
  const list = replayEntries({ scenes: [{ id: 'b31_estrellas', title: 'Las estrellas caen' }], momentos, films, songs: reachedP3Songs(['film:f01', 'film:f06', 'film:f07', 'film:f08']) });

  it('prologue, Part II scenes, Part II ♪, Part III ▶ films, Part III ♪ (DRUNCK first)', () => {
    expect(list.map((e) => e.title)).toEqual(['Prólogo', 'Las estrellas caen', '♪ WHEN I LOSE', '♪ LIKY FIGHT', '▶ Oficial Dona', '▶ El Cadenero', '♪ DRUNCK', '♪ EM%EN', '♪ OH SHIT']);
  });
  it('a ♪ song replays its film (the same way a ▶ film does), never listed twice', () => {
    expect(list.find((e) => e.title === '♪ EM%EN')?.id).toBe('film:f06');
    expect(list.find((e) => e.title === '♪ DRUNCK')?.id).toBe('momento:drunck');
    expect(list.filter((e) => e.id === 'film:f06').length).toBe(1);
    expect(new Set(list.map((e) => e.id)).size).toBe(list.length);
  });
  it('the panel builds its rows from it; a film row and a song row both go through replayFilm', () => {
    const src = read('panels/Replays.ts');
    expect(src).toContain('replayEntries({');
    expect(src).toContain('songs: reachedP3Songs()');
    expect(src).toContain("else if (e.id.startsWith('film:')) await replayFilm(e.id.slice(5));");
  });
});

describe('the Fonoteca gets Part III songs', () => {
  it('a song film watched unlocks its song (silently in the mourning); a save that heard them before catches up', () => {
    const si = read('app/stageIntro.ts');
    expect(si).toMatch(/markSeenG\(filmSeenKey\(id\)\);\s*\n\s*\/\/ \(P3-CINE\)[^\n]*\n\s*const fid = id;\s*\n\s*void import\('\.\/p3Songs'\)\.then\(\(m\) => m\.unlockSongOfFilm\(fid\)\)/);
    const ps = read('app/p3Songs.ts');
    expect(ps).toContain('F.unlockSong(s.song, s.source, { silent: await mourning() })');
    expect(ps).toContain('G.afterLoad.push(');
    expect(read('app/story.ts')).toContain("import './p3Songs';");
  });
  it('a silent unlock: no record card, no stinger, marked as celebrated', async () => {
    const { G } = await import('../src/state');
    const F = await import('../src/audio/fonoteca');
    const heard: string[] = [];
    const off = F.onSongUnlock((e) => heard.push(e.ref));
    G.newGame?.();
    expect(F.unlockSong('sadie', 'Tu isla', { silent: true })).toBe(true);
    expect(F.isUnlocked('sadie')).toBe(true);
    expect(heard).toEqual([]);
    expect(F.musicExt().toasted).toContain('sadie');
    expect(F.unlockSong('emen', 'La Borracha')).toBe(true);
    expect(heard).toEqual(['emen']);
    off();
  });
});

describe('the transformation instead of the loading screen', () => {
  it('films start on the transformation, the titled loader is its slow-device fallback', () => {
    const fi = read('film/index.ts');
    expect(fi).toMatch(/const morph = !prev && !o\.bare && !o\.cut && !o\.scrub && !o\.standalone && !!scenes\.current \? new WorldMorph\(/);
    expect(fi).toContain('const needLoader = !morph && !w?.built && !prev;');
    expect(fi).toContain('await morph.close();');
    const mo = read('film/morph.ts');
    expect(mo).toMatch(/fallbackMs: 12000/);
    expect(mo).toMatch(/performance\.now\(\) - this\.born > MORPH\.fallbackMs/);
  });
  it('every presentation style has its look; a film\'s style comes from its loader, else its first scene', async () => {
    const { MORPH_LOOKS, morphStyleOf } = await import('../src/film/morph');
    for (const s of ['vangogh', 'davinci', 'noir', 'tv', 'silent', 'ukiyoe', 'bass', 'default'] as const) expect(MORPH_LOOKS[s].style).toBe(s);
    expect(morphStyleOf({ loader: { style: 'noir' }, scenes: [] })).toBe('noir');
    expect(morphStyleOf({ scenes: [{ id: 'a', dur: 1, style: 'vangogh', set: async () => null }] })).toBe('vangogh');
    expect(morphStyleOf({ scenes: [{ id: 'a', dur: 1, style: { id: 'linterna' }, set: async () => null }] })).toBe('silent');
    expect(morphStyleOf({ scenes: [{ id: 'a', dur: 1, style: 'nada', set: async () => null }] })).toBe('default');
    for (const f of FILMS.values()) expect(MORPH_LOOKS[morphStyleOf(f)], f.id).toBeTruthy();
  });
  it('the finale keeps its hard cuts (the blow, «La caída»); the stage film holds into its battle', () => {
    const fin = read('app/finalFlow.ts');
    expect(fin).toContain("filmStep('b94_golpe', 'f34_golpe', 'b94_amanecer', A.golpe, { hold: true, cut: true })");
    expect(fin).toMatch(/playStoryFilm\('f32_caida', [^\n]*\{ hold: true, cut: true,/);
    expect(read('app/stageIntro.ts')).toContain('fp.play(film, { seen: plan.seen, hold: true })');
    expect(read('app/cajasFlow.ts')).toContain('if (await storyHolding()) {');
  });
  it('the Carta warms the stage\'s film while its card is read; the flows warm their next film', () => {
    const gm = read('scenes/GaterasMapScene.ts');
    expect(gm).toContain('m.warmStageFilm(n.dim,');
    expect(gm).toContain('m.dropStageFilm()');
    expect(gm).toContain('filmFocus(): [number, number] | null');
    expect(read('app/actsFlow.ts')).toContain("if (st.t !== 'battle') warmAhead(f.steps, i);");
    expect(read('app/acto1Flow.ts')).toContain("warm('f08', 'b74_ohshit');");
  });
  it('a won story fight warms the song film its close opens with (EM%EN, Daria, No wey, DISTOR…)', async () => {
    const { P3_ON_DONE } = await import('../src/ui/story/gaterasScript');
    const acts = read('app/actsFlow.ts');
    expect(acts).toContain("const ACTO1_OPENS: Record<string, { key: string; film: string }> = { h73_emen: { key: 'b73_emen', film: 'f06' } };");
    expect(read('app/cajasFlow.ts')).toMatch(/if \(r\.won\) window\.setTimeout\(\(\) => void import\('\.\/actsFlow'\)\.then\(\(m\) => m\.warmAfterWin\(\)\)/);
    // the closes that open with a song film are flows the director queues when the mission is done
    const flows = Object.values(P3_ON_DONE).flat().filter((r) => r.special === 'flow').map((r) => r.flow);
    for (const f of ['h73_emen', 'h81_daria', 'h87_nowey', 'h88_distor']) expect(flows).toContain(f);
  });
});
