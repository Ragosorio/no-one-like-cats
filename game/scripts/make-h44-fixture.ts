/**
 * Builds test-saves/rupturas-h44.json FROM CODE (docs/part-ii/29-momentos-musicales.md): post-finale.json loaded through
 * the real game systems, then Parte II played up to H43 (Kit de Vuelo installed): H44 «Islas Invertidas» is ACTIVE —
 * the two-phase battle with the LIKY FIGHT Momento between its phases. No Momento seen yet (first-time rules).
 *
 *   cd game && npx vite-node scripts/make-h44-fixture.ts      then  ?save=rupturas-h44
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
for (let n = 31; n <= 43; n++) ids.push(`H${n}`);
m.active = m.active.filter((id) => !ids.includes(id));
m.pinned = m.pinned.filter((id) => !ids.includes(id));
for (const id of ids) if (!m.done.includes(id)) m.done.push(id);
for (const id of ids) if (!m.seenLines.includes(id)) m.seenLines.push(id);
for (const f of ['region:paginas', 'region:nacar', 'region:invertidas', 'oleada1_fin', 'forma:canelo_almirante', 'nacar_haz_ok', 'element:crystal', 'kit_vuelo:ofrecido']) G.flag(f);
for (const e of ['crystal']) if (!G.s.elements.includes(e)) G.s.elements.push(e);
G.s.crystals.crystal = Math.max(G.s.crystals.crystal ?? 0, 40);
// the sky battles of Oleada 2 needed a ship that flies (rupturasO2.ts KIT DE VUELO): Escafandra's Kit Astral goes on it
(G.s.ext ??= {}).flightKit = { level: 1, ships: [G.s.ship.active], at: Date.now() };
// a calm load: Canelo Almirante already revealed and seen, the Fonoteca of Oleadas 1–2 (doc 18 §8) already in hand
G.s.ext.forms = { revealed: ['canelo_almirante'], seen: ['canelo_almirante'] };
const at = Date.now();
const o12 = ['yonose_todo.menu_loop', 'amb', 'amb.night_astral', 'when_i_lose.ambient', 'when_i_lose', 'liky_fight', 'amb.nacar', 'circus_malus'];
G.s.ext.music = {
  unlocked: Object.fromEntries(o12.map((r) => [r, { at, source: 'fixture' }])),
  favorites: [],
  islandTrack: null,
  toasted: ['yonose_todo', 'amb', 'when_i_lose', 'liky_fight', 'circus_malus'],
  prefs: { shuffle: false, repeat: 'all' },
  last: null,
};
// the Parte II beats of Oleadas 1–2, seen (a story that was played, not skipped)
const { RUPTURAS_ON_DONE, RUPTURAS_ON_NEW, REFLEJO_CINEMATIC } = await import('../src/ui/story/rupturasScript');
const { O2_ON_DONE, O2_ON_NEW } = await import('../src/ui/story/rupturasScriptO2');
const seen = new Set(G.s.beatsSeen);
for (const t of [RUPTURAS_ON_NEW, RUPTURAS_ON_DONE, O2_ON_NEW, O2_ON_DONE])
  for (const [mid, refs] of Object.entries(t)) {
    if (t === O2_ON_NEW && !['H42', 'H43', 'H44'].includes(mid)) continue;
    if (t === O2_ON_DONE && !['H42', 'H43'].includes(mid)) continue;
    for (const r of refs) {
      seen.add(r.beat);
      if (r.part) seen.add(`${r.beat}#${r.part}`);
    }
  }
seen.add(REFLEJO_CINEMATIC.beat);
seen.add('b32_registro#dex');
G.s.beatsSeen = [...seen];
// a few features already explained: the first load shows the story, not a queue of old tutorials
checkMissions();

const state = JSON.parse(JSON.stringify(G.s));
const env = { version: SAVE_VERSION, savedAt: Date.now(), build: 'fixture-h44', state };
writeFileSync(new URL('rupturas-h44.json', dir), JSON.stringify(env, null, 1) + '\n');
console.log('fixture: rupturas-h44 (activas', state.missions.active.join(','), '· gatos', state.cats.length, ')');
