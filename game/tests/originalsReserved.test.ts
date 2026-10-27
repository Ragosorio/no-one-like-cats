/**
 * REGLA DEL DUEÑO (docs/part-ii/28 «Momentos musicales»): the 6 ORIGINAL songs only play in the Momentos musicales
 * (src/momentos) and in the Fonoteca. Battles and the adaptive director use variations / battle remixes only
 * ('<song>.<version>', e.g. 'liky_fight.battle'). This fails if battles.json or director.json names an original —
 * as a bare id ('hemkade') or an explicit original ref ('hemkade.original') — anywhere a TRACK goes: plan tracks,
 * fallbacks, state / end / finale targets, Fonoteca unlocks, director candidates, stinger files.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import battles from '../src/data/music/battles.json';
import director from '../src/data/music/director.json';
import tracks from '../src/data/music/tracks.json';

// Parte III: 'drunck' (Momento H66) sigue la misma regla y trae su remix de batalla con el mismo vocabulario.
// Parte III, ronda 4 (películas): las 8 originales nuevas solo suenan en películas de canción (kind 'song',
// validateFilm) y en la Fonoteca. No tienen remix de batalla: las presentaciones usan variaciones derivadas.
const BATTLE_ORIGINALS = ['liky_fight', 'hemkade', 'when_i_lose', 'circus_malus', 'te_odio', 'yonose_todo', 'drunck'];
const FILM_ORIGINALS = ['sadie', 'daria', 'no_wey', 'xti', 'oh_shit', 'emen', 'distor', 'no_game'];
const ORIGINALS = [...BATTLE_ORIGINALS, ...FILM_ORIGINALS];
const isOriginal = (ref: string) => ORIGINALS.includes(ref) || ORIGINALS.some((o) => ref === `${o}.original`);
/** keys whose string value is a track ref */
const TRACK_KEYS = new Set(['track', 'fallback', 'song', 'tracks', 'file']);

/** every [path, ref] where a track ref sits in a JSON tree */
function trackRefs(node: unknown, path = '', out: [string, string][] = []): [string, string][] {
  if (Array.isArray(node)) node.forEach((v, i) => trackRefs(v, `${path}[${i}]`, out));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      const p = path ? `${path}.${k}` : k;
      if (TRACK_KEYS.has(k)) {
        if (typeof v === 'string') out.push([p, v]);
        else if (Array.isArray(v)) v.forEach((x, i) => typeof x === 'string' && out.push([`${p}[${i}]`, x]));
        else if (v && typeof v === 'object') trackRefs(v, p, out); // fallback: { track, section }
      } else trackRefs(v, p, out);
    }
  }
  return out;
}

describe('originals are reserved for the Momentos musicales', () => {
  it('battles.json never names an original song (plans, fallbacks, targets, finales, unlocks)', () => {
    const refs = trackRefs(battles);
    expect(refs.length).toBeGreaterThan(20);
    const bad = refs.filter(([, r]) => isOriginal(r));
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });

  it('director.json never names an original song (state / context candidates, stingers)', () => {
    const refs = trackRefs(director);
    const bad = refs.filter(([, r]) => isOriginal(r) || ORIGINALS.some((o) => r === `music/${o}.m4a`));
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });

  it('every battle plan plays a battle remix (or another variation) that exists, with its beat map', () => {
    const refs = trackRefs(battles).filter(([p]) => /\.(track|fallback)$/.test(p));
    const known = new Set<string>();
    for (const t of tracks as { id: string; variations: { id: string; file: string }[] }[]) for (const v of t.variations) known.add(v.id);
    for (const [p, r] of refs) {
      if (r === 'boss.umbral') continue; // a composition still to come (it has its fallback)
      expect(known.has(r), `${p}: ${r} is in tracks.json`).toBe(true);
    }
    for (const o of BATTLE_ORIGINALS) {
      const id = `${o}.battle`;
      expect(known.has(id), id).toBe(true);
      expect(existsSync(join(__dirname, `../src/data/music/beatmaps/${id}.json`)), `${id} beat map`).toBe(true);
      expect(existsSync(join(__dirname, `../public/music/${id}.m4a`)), `${id} file`).toBe(true);
    }
  });

  it('the remix beat maps have the shared section vocabulary, a loop on the bar grid and choreography hits', () => {
    for (const o of BATTLE_ORIGINALS) {
      const m = JSON.parse(readFileSync(join(__dirname, `../src/data/music/beatmaps/${o}.battle.json`), 'utf8'));
      expect(m.sections.map((s: { name: string }) => s.name)).toEqual(['intro', 'verse', 'drop', 'break', 'climax', 'outro']);
      for (const k of ['first_drop', 'pre_drop', 'build_1', 'breakdown', 'build_2', 'intense', 'last_bar', 'loop_start', 'loop_end'])
        expect(m.markers.some((x: { name: string }) => x.name === k), `${o} ${k}`).toBe(true);
      const bar = 240 / m.bpm;
      const bars = (m.loop.end - m.loop.start) / bar;
      expect(Math.abs(bars - Math.round(bars)), `${o} loop = whole bars`).toBeLessThan(1e-3);
      const verse = m.sections[1].start;
      expect(verse - m.loop.start, `${o} loop starts at the verse (≤ 30 ms earlier)`).toBeLessThanOrEqual(0.031);
      expect(verse - m.loop.start, 'sections are rounded to 1 ms').toBeGreaterThanOrEqual(-0.001);
      // SINCRO / choreography: strong hits through the loop, a drop on the drop and on the climax
      const strong = m.hits.filter((h: { strength: number }) => h.strength >= 0.8).length;
      expect(strong / (m.loop.end - m.loop.start), `${o} strong hits per second`).toBeGreaterThan(0.3);
      const drops = m.hits.filter((h: { kind: string }) => h.kind === 'drop').map((h: { time: number }) => h.time);
      expect(drops.some((t: number) => Math.abs(t - m.sections[2].start) < 0.01)).toBe(true);
      expect(drops.some((t: number) => Math.abs(t - m.sections[4].start) < 0.01)).toBe(true);
    }
  });
});

/** source code outside the Momentos: no cue / cueBest / setState target names an original song */
describe('originals are not cued from code outside src/momentos', () => {
  it('cine, regions, story scripts and flows never cue an original', () => {
    const roots = ['src/cine', 'src/regions', 'src/ui/story', 'src/app', 'src/island', 'src/battle', 'src/scenes', 'src/state'];
    const files: string[] = [];
    const walk = (d: string) => {
      if (!existsSync(d)) return;
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.ts$/.test(e.name)) files.push(p);
      }
    };
    roots.forEach(walk);
    const call = new RegExp(`(?:cue|cueBest|cueFirst)\\(\\s*\\[?\\s*'(${ORIGINALS.join('|')})'`, 'g');
    const bad: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(call)) bad.push(`${f}: ${m[0]}`);
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

describe('Parte III: the film originals (ronda 4)', () => {
  const T = tracks as { id: string; file: string; beatmap?: string; sync?: { encoderDelaySamples: number }; variations: { id: string; file: string; kind: string }[] }[];
  it('each one is in tracks.json with its .m4a, beat map, onsets and the AAC priming of the other originals', () => {
    for (const o of FILM_ORIGINALS) {
      const t = T.find((x) => x.id === o);
      expect(t, o).toBeTruthy();
      expect(t!.file).toBe(`music/${o}.m4a`);
      expect(existsSync(join(__dirname, `../public/music/${o}.m4a`)), `${o}.m4a`).toBe(true);
      expect(existsSync(join(__dirname, `../src/data/music/beatmaps/${o}.json`)), `${o} beat map`).toBe(true);
      expect(existsSync(join(__dirname, `../src/data/music/beatmaps/${o}.onsets.json`)), `${o} onsets`).toBe(true);
      expect(t!.sync?.encoderDelaySamples).toBe(2112);
      expect(t!.variations[0]).toMatchObject({ id: `${o}.original`, kind: 'original', file: `music/${o}.m4a` });
    }
  });
  it('their derived variations are separate files (never the original) and exist on disk', () => {
    for (const o of FILM_ORIGINALS) {
      const t = T.find((x) => x.id === o)!;
      for (const v of t.variations.slice(1)) {
        expect(v.kind, v.id).not.toBe('original');
        expect(v.file, v.id).not.toBe(t.file);
        expect(existsSync(join(__dirname, `../public/${v.file}`)), v.file).toBe(true);
      }
    }
  });
});
