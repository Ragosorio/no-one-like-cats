/**
 * Builds test-saves/rupturas-o3.json FROM CODE (docs/part-ii/25-oleada-3.md §Pasada de cine): post-finale.json loaded
 * through the real game systems (migrations, normalize, patches), then the Parte II up to the Oleada 2 ending marked as
 * played: missions H31–H49 done, the chart's islands of Oleadas 1–2, Cristal and Gravedad, Canelo Almirante, the
 * Kit de Vuelo, the Fonoteca of Oleadas 1–2 and every O1/O2 beat seen. On load the game activates H50 by itself
 * (trigger mission:H49), so the first thing that happens is «La Era Astral».
 *
 *   cd game && npx vite-node scripts/make-o3-fixture.ts
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
for (let n = 31; n <= 49; n++) ids.push(`H${n}`);
m.active = m.active.filter((id) => !ids.includes(id));
m.pinned = m.pinned.filter((id) => !ids.includes(id));
for (const id of ids) if (!m.done.includes(id)) m.done.push(id);
for (const id of ids) if (!m.seenLines.includes(id)) m.seenLines.push(id);
for (const f of ['region:paginas', 'region:nacar', 'region:invertidas', 'region:corona', 'oleada1_fin', 'oleada2_fin', 'forma:canelo_almirante', 'nacar_haz_ok', 'element:crystal', 'element:gravity']) G.flag(f);
for (const e of ['crystal', 'gravity']) if (!G.s.elements.includes(e)) G.s.elements.push(e);
G.s.crystals.crystal = Math.max(G.s.crystals.crystal ?? 0, 40);
G.s.crystals.gravity = Math.max(G.s.crystals.gravity ?? 0, 30);
// the sky battles of Oleada 2 needed a ship that flies (rupturasO2.ts KIT DE VUELO): Escafandra's Kit Astral goes on it
(G.s.ext ??= {}).flightKit = { level: 2, ships: [G.s.ship.active], at: Date.now() };
// a calm load: Canelo Almirante already revealed and seen, the Fonoteca of Oleadas 1–2 (doc 18 §8) already in hand
G.s.ext.forms = { revealed: ['canelo_almirante'], seen: ['canelo_almirante'] };
const at = Date.now();
const o12 = ['yonose_todo.menu_loop', 'amb', 'amb.night_astral', 'when_i_lose.ambient', 'when_i_lose', 'liky_fight', 'amb.nacar', 'circus_malus', 'yonose_todo.ambient', 'circus_malus.explore', 'hemkade.ambient', 'when_i_lose.aftermath'];
G.s.ext.music = {
  unlocked: Object.fromEntries(o12.map((r) => [r, { at, source: 'fixture' }])),
  favorites: [],
  islandTrack: null,
  toasted: ['yonose_todo', 'amb', 'when_i_lose', 'liky_fight', 'circus_malus', 'hemkade'],
  prefs: { shuffle: false, repeat: 'all' },
  last: null,
};
// the Parte II beats of Oleadas 1–2, seen (a story that was played, not skipped)
const { RUPTURAS_ON_DONE, RUPTURAS_ON_NEW, REFLEJO_CINEMATIC } = await import('../src/ui/story/rupturasScript');
const { O2_ON_DONE, O2_ON_NEW } = await import('../src/ui/story/rupturasScriptO2');
const seen = new Set(G.s.beatsSeen);
for (const t of [RUPTURAS_ON_NEW, RUPTURAS_ON_DONE, O2_ON_NEW, O2_ON_DONE])
  for (const refs of Object.values(t))
    for (const r of refs) {
      seen.add(r.beat);
      if (r.part) seen.add(`${r.beat}#${r.part}`);
    }
seen.add(REFLEJO_CINEMATIC.beat);
seen.add('b32_registro#dex');
G.s.beatsSeen = [...seen];
// the cats the story handed over outside a battle in Oleada 2 already joined (Hélice)
const { claimO2Cat, O2_STORY_CATS } = await import('../src/state/sys/rupturasO2');
for (const c of O2_STORY_CATS) claimO2Cat(c.species);
// a few features already explained: the first load shows the story, not a queue of old tutorials
checkMissions();

const state = JSON.parse(JSON.stringify(G.s));
const env = { version: SAVE_VERSION, savedAt: Date.now(), build: 'fixture-oleada3', state };
writeFileSync(new URL('rupturas-o3.json', dir), JSON.stringify(env, null, 1) + '\n');
console.log('fixture: rupturas-o3 (H49 hecha · activas', state.missions.active.join(','), '· gatos', state.cats.length, ')');
