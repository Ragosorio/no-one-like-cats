/**
 * «DRUNCK» — the Momento of the Parte III prologue (H66, docs/part-iii/04 §3): the score resolves on agent D's REAL beat
 * map with zero warnings and takes the whole song to its dry cut; its anchors sit on measured onsets / markers (the
 * loose kicks of the intro, the rolls, the breaths, the kick cut, the cut); the 14 inputs of the script are there and
 * change nothing but the cosmetic grade (same save with a perfect, an all-missed and an untouched run); the flash
 * limiter holds; only known verbs; it is registered (Volver a ver, Fonoteca, ext.momentos), and the bar cines it lives
 * between keep THE LISTENER RULE.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanBeatMap, type BeatMap } from '../src/audio/beatgrid';
import { propAt, resolveScore } from '../src/momentos/score';
import { selectOnsets } from '../src/momentos/time';
import { MomentoCore } from '../src/momentos/core';
import { FlashGuard } from '../src/momentos/flash';
import { COSMETIC_KEYS, commitMomento, momentoSeen } from '../src/momentos/save';
import type { OnsetMap } from '../src/momentos/types';

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

await import('../src/momentos/songs');
const { getMomento, momentoIds, seenMomentos } = await import('../src/momentos/registry');
const SC = await import('../src/momentos/songs/drunck/score');
const { DRUNCK } = SC;

const MAPS = join(__dirname, '../src/data/music/beatmaps');
const MAP: BeatMap = cleanBeatMap(JSON.parse(readFileSync(join(MAPS, 'drunck.json'), 'utf8')), 'drunck')!;
const ONSETS = JSON.parse(readFileSync(join(MAPS, 'drunck.onsets.json'), 'utf8')) as OnsetMap;
const near = (list: { t: number }[], t: number) => Math.min(...list.map((o) => Math.abs(o.t - t)));
const marker = (n: string) => MAP.markers.find((m) => m.name === n)!.time;

describe('the DRUNCK score', () => {
  const s = resolveScore(DRUNCK, MAP, ONSETS);
  it('resolves on the real beat map with zero warnings', () => {
    expect(s.warnings).toEqual([]);
    expect(s.cues.length).toBeGreaterThan(60);
  });
  it('takes the whole song (no edit) and cuts one beat after the dry cut of c49 (the ¡PUM!)', () => {
    expect(s.segments).toHaveLength(1);
    expect(s.segments[0].from).toBe(0);
    expect(marker('cut')).toBeCloseTo(SC.PUM, 3);
    expect(s.mCut).toBeCloseTo(SC.CUT, 3);
    expect(SC.CUT - SC.PUM).toBeLessThan(60 / 165 + 0.01);
    // every section of the song has its staging
    for (const sec of MAP.sections.filter((x) => x.name !== 'outro')) expect(s.cues.filter((c) => c.t >= sec.start && c.t < sec.end).length, sec.name).toBeGreaterThan(2);
  });
  it('the 14 inputs of the script: 4 ¡HIC! + ¡SALUD! + 5 ¡EXTRA! + ¿CUÁNTOS? + ¡OTRA! + the mash + ¡PUM!', () => {
    const ids = s.prompts.map((p) => p.id);
    expect(ids.filter((x) => x.startsWith('hic') && x !== 'hichichic')).toHaveLength(4);
    expect(ids).toContain('salud');
    expect(ids.filter((x) => x.startsWith('extra'))).toHaveLength(5);
    expect(ids).toContain('otra');
    expect(s.prompts.find((p) => p.id === 'hichichic')?.type).toBe('mash');
    expect(ids).toContain('pum');
    // the choice is the stage's own three-way UI (ungraded), opened and decided by the score
    expect(s.cues.filter((c) => c.act.verb === 'cuantos')).toHaveLength(1);
    expect(s.prompts.length + 1).toBe(14);
    // labels of 1–3 words; never two prompts on screen at once
    for (const p of s.prompts) if (p.spec.label) expect(p.spec.label.split(/\s+/).length).toBeLessThanOrEqual(3);
    const byShow = [...s.prompts].sort((a, b) => a.mShow - b.mShow);
    for (let i = 1; i < byShow.length; i++) {
      const prev = byShow[i - 1];
      const end = prev.type === 'tap' ? prev.m + 0.15 : prev.mEnd + 0.15;
      expect(byShow[i].mShow, `${prev.id} → ${byShow[i].id}`).toBeGreaterThanOrEqual(end - 1e-6);
    }
  });
  it('every input sits on a measured kick (or, the ¡PUM!, on the dry cut itself)', () => {
    const kick = selectOnsets(MAP, ONSETS, { track: 'kick', min: 0.4 });
    for (const t of [...SC.HICS, SC.SALUD, ...SC.EXTRAS, SC.OTRA, SC.MASH[1]]) expect(near(kick, t), String(t)).toBeLessThan(0.005);
    const all = (['kick', 'snare', 'perc', 'bass'] as const).flatMap((track) => selectOnsets(MAP, ONSETS, { track }));
    expect(near(all, SC.MASH[0])).toBeLessThan(0.005);
    expect(SC.PUM).toBeCloseTo(marker('cut'), 3);
    // the intro's hiccups are the loose kicks the script names (c1, c3, c5, c7) and the drop is ¡SALUD!
    expect(SC.HICS).toEqual([marker('kick_1'), marker('kick_3'), marker('kick_4'), marker('kick_6')]);
    expect(SC.SALUD).toBeCloseTo(marker('first_drop'), 3);
    // the lighthouse freeze is exactly the kick cut, the OTRA is the kick coming back
    expect(SC.KICK_CUT[0]).toBeCloseTo(marker('kick_cut'), 3);
    expect(SC.OTRA).toBeCloseTo(marker('kick_back'), 3);
    expect(s.cues.some((c) => c.act.verb === 'freeze' && Math.abs(c.t - marker('kick_cut')) < 0.002)).toBe(true);
  });
  it('the OYENTE speaks only in the breaths (c16 and c32), and Canelo’s balloons are short', () => {
    const oy = s.cues.filter((c) => c.act.verb === 'oyente');
    expect(oy).toHaveLength(2);
    expect(oy[0].t).toBeGreaterThanOrEqual(marker('breath_1'));
    expect(oy[0].t).toBeLessThan(marker('breath_1_end'));
    expect(oy[1].t).toBeGreaterThanOrEqual(marker('breath_2'));
    expect(oy[1].t).toBeLessThan(marker('breath_2_end'));
    // 1 to 4 words (docs/part-iii/13 §3.3)
    for (const g of s.cues.filter((c) => c.act.verb === 'globo')) expect(String(g.act.args.text).split(/\s+/).length, String(g.act.args.text)).toBeLessThanOrEqual(4);
  });
  it('uses only verbs that exist', async () => {
    const { TOOLKIT_VERBS } = await import('../src/momentos/anime/fx');
    const { DRUNCK_VERBS } = await import('../src/momentos/songs/drunck/verbs');
    const known = new Set([...Object.keys(TOOLKIT_VERBS), ...Object.keys(DRUNCK_VERBS), 'freeze']);
    const acts = [...s.cues.map((c) => c.act), ...s.prompts.flatMap((p) => Object.values(p.branches).flatMap((b) => b ?? []))];
    for (const a of acts) expect(known.has(a.verb), a.verb).toBe(true);
    // the TV cartoon has its own type: never NEÓN CEL's katakana onomatopoeia
    expect(acts.some((a) => a.verb === 'sfx' || typeof a.args.kata === 'string')).toBe(false);
  }, 60_000);
});

describe('round 3 (docs/part-iii/13 §3.3): the bar is the stage of memory, two rhythms', () => {
  const s = resolveScore(DRUNCK, MAP, ONSETS);
  const BAR_S = 60 / 165 * 4;
  const keyList = (name: string) => s.keys.get(name) ?? [];
  const strAt = (name: string, m: number, d = '') => String(propAt(keyList(name), m, d));
  it('every idea that must be understood holds ≥ 2 bars — or the whole measured stop it lives in (c16 breath, the kick cut)', () => {
    const stops = [
      [marker('breath_1'), marker('breath_1_end')],
      [marker('kick_cut'), marker('kick_back')],
    ];
    expect(SC.IDEAS.map((i) => i.id)).toEqual(['dormia', 'mentira', 'ficha', 'luz', 'gatito', 'bandos', 'pagina']);
    for (const idea of SC.IDEAS) {
      const long = idea.to - idea.from >= 2 * BAR_S - 0.01;
      const stop = stops.some(([a, b]) => idea.from <= a + 1e-3 && idea.to >= b - 1e-3);
      expect(long || stop, idea.id).toBe(true);
    }
    // they never touch: between two ideas to understand there is always something else (a flurry, a reaction)
    const sorted = [...SC.IDEAS].sort((a, b) => a.from - b.from);
    for (let i = 1; i < sorted.length; i++) expect(sorted[i].from - sorted[i - 1].to, `${sorted[i - 1].id} → ${sorted[i].id}`).toBeGreaterThan(0.3);
  });
  it('every memory comes OUT of an object of the bar (a doorway that opens from the bar scene)', () => {
    const doors = keyList('in').filter((x) => String(x.value) !== '');
    expect(doors.length).toBeGreaterThanOrEqual(7);
    const objs = new Set<string>();
    for (const d of doors) {
      // when the doorway opens, the bar is the scene and the object is named
      expect(strAt('scn', d.m + 0.002), `door at ${d.m}`).toBe('bar');
      const obj = strAt('obj', d.m + 0.002);
      expect(['tarro', 'diario', 'board', 'neon', 'ring', 'napkin']).toContain(obj);
      objs.add(obj);
      // and it ends with the memory as the scene
      const end = keyList('scn').find((x) => x.m > d.m && String(x.value) === String(d.value));
      expect(end, `the memory ${d.value} takes over`).toBeTruthy();
      expect(end!.m - d.m).toBeLessThan(0.6);
    }
    // the contract's objects: mug → sea, newspaper → front pages, board → card and logbook, neon → galleon, napkin → page
    for (const o of ['tarro', 'diario', 'board', 'neon', 'napkin']) expect(objs.has(o), o).toBe(true);
    // TV → lighthouse (the kick cut) and bathroom door → graffiti happen IN the bar (the bosses' styles invade it)
    expect(strAt('scn', marker('kick_cut') + 0.01)).toBe('bar');
    expect(strAt('tv', marker('kick_cut') + 0.01)).toBe('faro');
    expect(keyList('graf').some((x) => Number(x.value) === 1 && strAt('scn', x.m + 0.01) === 'bar')).toBe(true);
    expect(keyList('ink').some((x) => Number(x.value) === 1 && strAt('scn', x.m + 0.01) === 'bar')).toBe(true);
  });
  it('the story keeps coming back to Canelo at the bar (one bar shot in every section)', () => {
    for (const sec of MAP.sections.filter((x) => x.name !== 'outro')) {
      const inBar = keyList('scn').some((x) => String(x.value) === 'bar' && x.m >= sec.start - 0.01 && x.m < sec.end);
      expect(inBar, sec.name).toBe(true);
    }
  });
  it('THE LISTENER RULE holds on the bar\'s own camera, at every instant and on any screen', async () => {
    const { BAR: L, frameCamera, rightEdge } = await import('../src/momentos/songs/drunck/layout');
    const views = [
      { x: 0, y: 0, w: 1920, h: 1080 },
      { x: -280, y: 0, w: 2480, h: 1080 },
      { x: -540, y: 0, w: 3000, h: 1080 },
      { x: 0, y: -120, w: 1920, h: 1320 },
    ];
    const d = { 'b.x': 815, 'b.y': 470, 'b.z': 1.25, 'b.r': 0 };
    for (let m = 0; m < s.mCut; m += 1 / 30) {
      if (strAt('scn', m) !== 'bar') continue;
      const x = Number(propAt(keyList('b.x'), m, d['b.x']));
      const y = Number(propAt(keyList('b.y'), m, d['b.y']));
      const z = Number(propAt(keyList('b.z'), m, d['b.z']));
      // the roll counts: a tilted frame's corner reaches further right (QA-PULIDO, c40)
      const r = Number(propAt(keyList('b.r'), m, d['b.r']));
      for (const v of views) expect(rightEdge(frameCamera(x, y, z, v, 'bar', false, r), v, r), `m ${m.toFixed(2)}`).toBeLessThanOrEqual(L.hideX + 1e-6);
    }
  });
  it('the world camera stays put (the bar frames itself; nothing pans the listener into view)', () => {
    for (const k of ['cam.x', 'cam.y', 'cam.zoom']) for (const x of keyList(k)) expect(Number(x.value), k).toBe(k === 'cam.x' ? 960 : k === 'cam.y' ? 540 : 1);
  });
});

describe('registered: Volver a ver, Fonoteca, ext.momentos', () => {
  it('is the Momento of H66, with its original and a spoiler-free source', () => {
    expect(momentoIds()).toContain('drunck');
    const d = getMomento('drunck')!;
    expect(d.track).toBe('drunck');
    expect(d.mission).toBe('H66');
    expect(d.source).toBe('La Última Ronda');
    expect(d.unlocks).toEqual(['drunck']);
    const tracks = JSON.parse(readFileSync(join(__dirname, '../src/data/music/tracks.json'), 'utf8')) as { id: string }[];
    expect(tracks.some((t) => t.id === 'drunck')).toBe(true);
  });
  it('shows in «Volver a ver» once completed (the save only gains ext.momentos.drunck)', () => {
    const save = { ext: {} as Record<string, unknown> };
    expect(seenMomentos(save).some((x) => x.id === 'drunck')).toBe(false);
    const r = runAll('great').result('done', 'audio');
    expect(commitMomento(save, r, 1000)).toBe(true);
    expect(momentoSeen(save, 'drunck')).toBe(true);
    expect(seenMomentos(save).find((x) => x.id === 'drunck')?.title).toBe('DRUNCK');
    expect(Object.keys(save.ext)).toEqual(['momentos']);
  });
});

function runAll(auto: 'great' | 'hit' | 'miss' | 'none') {
  const s = resolveScore(DRUNCK, MAP, ONSETS);
  const c = new MomentoCore(s, auto);
  for (let m = 0; m <= s.mCut + 0.05; m += 1 / 60) c.advance(m);
  c.advance(s.mCut + 1);
  return c;
}
describe('same outcome, whatever the player does', () => {
  it('perfect, all-miss and no-input runs finish every prompt; the saves differ only in the cosmetic grade', () => {
    const runs = (['great', 'miss', 'none'] as const).map(runAll);
    for (const r of runs) expect(r.finished).toBe(true);
    const res = runs.map((r) => r.result('done', 'internal'));
    expect(res[0].grade).toBe('S');
    expect(res[1].grade).toBe('C');
    const base = () => ({ ext: { music: { unlocked: {} } } as Record<string, unknown>, gold: 100, missions: { done: ['H65'], active: ['H66'] }, flags: { 'mentira:nada': true } });
    const strip = (sv: ReturnType<typeof base>) => {
      const c = structuredClone(sv);
      const seen = (c.ext.momentos as { seen: Record<string, Record<string, unknown>> }).seen.drunck;
      for (const k of COSMETIC_KEYS) delete seen[k];
      return c;
    };
    const saves = res.map((r) => {
      const sv = base();
      commitMomento(sv, r, 777);
      return strip(sv);
    });
    expect(saves[0]).toEqual(saves[1]);
    expect(saves[1]).toEqual(saves[2]);
    // nothing outside ext.momentos.drunck: flags, missions and gold untouched
    expect(saves[0].flags).toEqual({ 'mentira:nada': true });
    expect(saves[0].missions).toEqual({ done: ['H65'], active: ['H66'] });
  });
  it('played perfectly it never asks for more than 3 full flashes in a second', () => {
    const s = resolveScore(DRUNCK, MAP, ONSETS);
    const r = runAll('great');
    const flashy = [...s.cues, ...r.branchCues].filter((c) => c.act.verb === 'impact' || (c.act.verb === 'flash' && Number(c.act.args.amount ?? 0.7) > 0.25)).map((c) => c.m).sort((a, b) => a - b);
    expect(flashy.length).toBeGreaterThan(0);
    const g = new FlashGuard(false);
    for (const m of flashy) g.request(m, 'impact');
    const full = g.log.filter((x) => x.grant === 'full').map((x) => x.m);
    for (const t of full) expect(full.filter((u) => u <= t && t - u < 1).length).toBeLessThanOrEqual(3);
    // and as authored: never more than 3 in any second (the guard never has to step in)
    for (let i = 3; i < flashy.length; i++) expect(flashy[i] - flashy[i - 3], `flash ${i}`).toBeGreaterThanOrEqual(1);
  });
});
