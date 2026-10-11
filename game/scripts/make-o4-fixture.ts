/**
 * Builds test-saves/rupturas-o4.json FROM CODE (docs/part-ii/27-oleada-4.md): post-finale.json loaded through the real
 * game systems (migrations, normalize, patches — the narrative reset runs as a no-op and stays marked), then the
 * Parte II up to H57 marked as played: missions H31–H57 done, the chart's islands, the wave endings, Cristal and
 * Gravedad, Canelo's forms. On load the game activates H58 by itself (trigger mission:H57).
 *
 *   cd game && npx vite-node scripts/make-o4-fixture.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';

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
const { SAVE_VERSION } = await import('../src/state/migrate');
const { checkMissions } = await import('../src/state/sys/missions');

const dir = new URL('../test-saves/', import.meta.url);
const read = (f: string) => JSON.parse(readFileSync(new URL(`${f}.json`, dir), 'utf8'));

mem.set(SAVE_KEY, JSON.stringify(read('post-finale')));
G.load();
if (!G.loaded) throw new Error('post-finale no cargó');
checkMissions();

const m = G.s.missions;
const ids: string[] = [];
for (let n = 31; n <= 57; n++) ids.push(`H${n}`);
m.active = m.active.filter((id) => !ids.includes(id));
m.pinned = m.pinned.filter((id) => !ids.includes(id));
for (const id of ids) if (!m.done.includes(id)) m.done.push(id);
for (const id of ids) if (!m.seenLines.includes(id)) m.seenLines.push(id);
for (const f of ['region:paginas', 'region:nacar', 'region:invertidas', 'region:corona', 'region:cometa', 'oleada1_fin', 'oleada2_fin', 'oleada3_fin', 'forma:canelo_almirante', 'forma:canelo_astral', 'nacar_haz_ok', 'element:crystal', 'element:gravity']) G.flag(f);
for (const e of ['crystal', 'gravity']) if (!G.s.elements.includes(e)) G.s.elements.push(e);
G.s.crystals.crystal = Math.max(G.s.crystals.crystal ?? 0, 40);
G.s.crystals.gravity = Math.max(G.s.crystals.gravity ?? 0, 30);
// the sky battles of Oleada 2 need a ship that flies (rupturasO2.ts KIT DE VUELO)
(G.s.ext ??= {}).flightKit = { level: 2, ships: [G.s.ship.active], at: Date.now() };
// a calm load (2026-10-10): Canelo's forms already revealed and seen, and the Fonoteca of Oleadas 1–3 (doc 18 §8)
// already in hand — so the first thing that happens is Oleada 4, not a queue of old reveals and record toasts
G.s.ext.forms = { revealed: ['canelo_almirante', 'canelo_astral'], seen: ['canelo_almirante', 'canelo_astral'] };
const at = Date.now();
const o13 = ['yonose_todo.menu_loop', 'amb', 'amb.night_astral', 'when_i_lose.ambient', 'when_i_lose', 'liky_fight', 'amb.nacar', 'circus_malus', 'yonose_todo.ambient', 'circus_malus.explore', 'hemkade.ambient', 'hemkade', 'te_odio', 'te_odio.explore', 'te_odio.ambient', 'liky_fight.explore', 'when_i_lose.aftermath'];
G.s.ext.music = {
  unlocked: Object.fromEntries(o13.map((r) => [r, { at, source: 'fixture' }])),
  favorites: [],
  islandTrack: null,
  toasted: ['yonose_todo', 'amb', 'when_i_lose', 'liky_fight', 'circus_malus', 'hemkade', 'te_odio'],
  prefs: { shuffle: false, repeat: 'all' },
  last: null,
};
// the Parte II beats up to the Oleada 3 ending, seen (a story that was played, not skipped)
const { RUPTURAS_ON_DONE, RUPTURAS_ON_NEW, REFLEJO_CINEMATIC } = await import('../src/ui/story/rupturasScript');
const { O2_ON_DONE, O2_ON_NEW } = await import('../src/ui/story/rupturasScriptO2');
const { O3_ON_DONE, O3_ON_NEW } = await import('../src/ui/story/rupturasScriptO3');
const seen = new Set(G.s.beatsSeen);
for (const t of [RUPTURAS_ON_NEW, RUPTURAS_ON_DONE, O2_ON_NEW, O2_ON_DONE, O3_ON_NEW, O3_ON_DONE])
  for (const refs of Object.values(t)) for (const r of refs) {
    seen.add(r.beat);
    if (r.part) seen.add(`${r.beat}#${r.part}`);
  }
seen.add(REFLEJO_CINEMATIC.beat);
G.s.beatsSeen = [...seen];
// the cats the story handed over outside a battle in Oleadas 2–3 already joined (Hélice, Maneki)
const { claimO2Cat, O2_STORY_CATS } = await import('../src/state/sys/rupturasO2');
const { claimO3Cat, O3_STORY_CATS } = await import('../src/state/sys/rupturasO3');
for (const c of O2_STORY_CATS) claimO2Cat(c.species);
for (const c of O3_STORY_CATS) claimO3Cat(c.species);
// the one-time screens of Oleada 3 already showed (app/oleada3Flow.ts: the Taller Cometa's welcome)
G.flag('o3_taller_visto');

const state = JSON.parse(JSON.stringify(G.s));
const env = { version: SAVE_VERSION, savedAt: Date.now(), build: 'fixture-oleada4', state };
writeFileSync(new URL('rupturas-o4.json', dir), JSON.stringify(env, null, 1) + '\n');
console.log('fixture: rupturas-o4 (H57 hecha · cats', state.cats.length, '· habitats', state.habitats.length, ')');
