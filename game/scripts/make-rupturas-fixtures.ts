/**
 * Builds the Part II narrative-reset fixtures (docs/part-ii/21-migracion-reinicio.md) FROM CODE, never by hand:
 * it loads test-saves/post-finale.json through the real game systems, plays Oleada 1 the way the published build
 * did (missions, battles, the cats the reveals adopt, the beats the story marks, the region flags), then removes
 * what only the new build writes (the claimed-rewards ledger, the reset patch id) so each file looks exactly like
 * a live player's save from before the renewal.
 *
 *   cd game && npx vite-node scripts/make-rupturas-fixtures.ts
 *
 * Writes test-saves/: rupturas-mid.json (H35 active) · rupturas-fin.json (H41 done + collections, ext.music) ·
 * rupturas-mid-v1.json (the mid save in the version-1 shape) · rupturas-raro.json (inconsistent records).
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
const { applyStoryResult, claimStoryCat } = await import('../src/state/sys/storyBattles');
const { countCrewWins } = await import('../src/state/sys/campaign');
const R = await import('../src/state/sys/rupturas');
const S = await import('../src/ui/story/rupturasScript');
const { BEAT_BY_ID } = await import('../src/data/content');
const { markFormRevealed, setForm } = await import('../src/state/sys/forms');
const { markBeat, markLine } = await import('../src/state/ext/story');
const { RESET_PATCH_ID } = await import('../src/state/sys/rupturasReset');
import type { BattleResult } from '../src/scenes/BattleScene';

const dir = new URL('../test-saves/', import.meta.url);
const read = (f: string) => JSON.parse(readFileSync(new URL(`${f}.json`, dir), 'utf8'));
const WIN: BattleResult = { won: true, reason: 'sunk', turns: 5, modulesDestroyed: 4, damageDealt: 1000, catsLost: 0, perfect: false };

// ---- what the published build's UI did while you played (app/story.ts marks beats; RegionScene flags visits)
type Ref = { beat: string; part?: string; lines?: number[]; special?: string; region?: string };
function playRefs(refs: Ref[] | undefined) {
  for (const r of refs ?? []) {
    markBeat(r.part ? `${r.beat}#${r.part}` : r.beat);
    const b = BEAT_BY_ID.get(r.beat);
    if (!r.part || (r.lines && b && r.lines[r.lines.length - 1] === b.lines.length - 1)) markBeat(r.beat);
    if (r.special === 'region' && r.region) enterRegion(r.region);
  }
}
function enterRegion(id: string) {
  G.count(`feature_region_${id}`);
  G.flag(`region_visited:${id}`);
}
G.on('mission', (p) => {
  if (!/^H(3[1-9]|4[01])$/.test(p.id)) return;
  if (p.kind === 'new') {
    playRefs(S.RUPTURAS_ON_NEW[p.id] as Ref[]);
    markLine(p.id); // COVERED: the beat says the tip
  } else if (p.kind === 'done') playRefs(S.RUPTURAS_ON_DONE[p.id] as Ref[]);
});

const canelo = () => G.s.cats.find((c) => c.species === 'c_canelo')!;
function battle(id: string) {
  const loot = applyStoryResult(id, WIN);
  // storyFlow.revealCat of the published build: adopt, no ledger
  if (loot.newCat) claimStoryCat(loot.newCat);
}
function readPage(n: number) {
  G.count('feature_pagina');
  G.flag(`pagina_leida:${n}`);
  G.add('gold', Math.round(Math.max(150, G.goldPerSec * 60)), 'pagina');
}
const STEPS: Record<string, () => void> = {
  H31: () => R.tapFaro(),
  H32: () => R.openRegistro000(),
  H33: () => {
    markBeat('carta_paginas'); // MapScene: the island's ink soaks in the first time the CARTA shows it
    enterRegion('paginas');
    readPage(1);
    readPage(2);
  },
  H34: () => battle('ruptura_paginas'),
  H35: () => battle('ruptura_bibliotecario'),
  H36: () => {
    enterRegion('paginas');
    G.count('feature_pagina_canelo');
    G.flag('pagina_canelo_vista');
    for (let n = 3; n <= 8; n++) readPage(n);
  },
  H37: () => {
    for (let i = 0; i < 3; i++) countCrewWins([canelo().uid]);
  },
  H38: () => countCrewWins([canelo().uid], canelo().uid),
  H39: () => {
    markBeat('carta_nacar');
    enterRegion('nacar');
    G.flag('nacar_haz_ok');
    G.count('feature_haz_nacar');
    battle('ruptura_nacar');
  },
  H40: () => battle('ruptura_madrenacar'),
  H41: () => battle('ruptura_corrector'),
};

function loadPostFinale() {
  mem.clear();
  mem.set(SAVE_KEY, JSON.stringify(read('post-finale')));
  G.load();
  if (!G.loaded) throw new Error('post-finale no cargó');
  checkMissions();
}
function playUntil(upTo: string | null) {
  for (const id of Object.keys(STEPS)) {
    if (id === upTo) return;
    if (!G.s.missions.active.includes(id)) throw new Error(`${id} no está activa`);
    STEPS[id]();
    checkMissions();
    if (!G.s.missions.done.includes(id)) throw new Error(`${id} no se completó`);
    if (id === 'H38') {
      // formsFlow's reveal, then the player puts the admiral's hat on
      markFormRevealed('canelo_almirante');
      setForm(canelo(), 'canelo_almirante');
    }
  }
}
/** the save as the published build wrote it: no ledger, the reset never ran */
function envelope() {
  const state = JSON.parse(JSON.stringify(G.s));
  if (state.ext) delete state.ext.rupturas;
  state.patches = (state.patches ?? []).filter((p: string) => p !== RESET_PATCH_ID);
  return { version: SAVE_VERSION, savedAt: Date.now(), build: 'fixture-oleada1', state };
}
const write = (name: string, env: unknown) => writeFileSync(new URL(`${name}.json`, dir), JSON.stringify(env, null, 1) + '\n');

// ---- 1) mid-Oleada 1: H31–H34 done, H35 active (Marcapáginas joined, Páginas on the chart, 2 diary pages)
loadPostFinale();
playUntil('H35');
const mid = envelope();
write('rupturas-mid', mid);

// ---- 2) Oleada 1 finished + a save full of collections (Fonoteca, casino, decor, accessories, gear…)
loadPostFinale();
playUntil(null);
const fin = envelope();
const st = fin.state;
st.ext = {
  ...st.ext,
  // the Fonoteca (AUDIO agent's namespace): whatever shape it has must survive untouched
  music: {
    unlocked: { yonose_todo: { at: 1791090000000, source: 'Los créditos' }, liky_fight: { at: 1791090500000, source: 'La Fonoteca' }, 'liky_fight.ambient': { at: 1791090600000, source: 'Isla Nácar' } },
    favorites: ['liky_fight'],
    islandTrack: 'yonose_todo',
    toasted: ['yonose_todo', 'liky_fight'],
    prefs: { shuffle: true, repeat: 'one' },
    last: 'liky_fight.ambient',
  },
  bank: { total: 123456, pending: 0, lastOfflineGold: 0, lastOfflineMs: 0, opened: true },
  collection: { setsClaimed: ['set_inicio'], celebrate: [], mutChoices: [] },
};
st.casino = read('casino-v1').state.casino;
st.gear = read('m2-postboss2').state.gear;
st.decor = { owned: { caja_legendaria: 2, fogata: 1 }, placed: [{ uid: 'd900', id: 'fogata', region: 'home', x: 30, y: 31 }] };
st.accessories = { owned: { gorro_lana: 1, mono: 2 }, equipped: { [st.cats[0].uid]: 'gorro_lana' } };
st.cats[1].holo = true;
write('rupturas-fin', fin);

// ---- 3) the mid save in the version-1 shape (before the update ledger and free habitat placement)
const v1 = JSON.parse(JSON.stringify(mid));
v1.version = 1;
v1.build = undefined;
delete v1.state.patches;
delete v1.state.updatesSeen;
v1.state.v = 1;
for (const h of v1.state.habitats) {
  if (h.plot < 0) continue;
  delete h.gx;
  delete h.gy;
}
write('rupturas-mid-v1', v1);

// ---- 4) inconsistent records: H38 done but H36 not, an active mission that is also done, unknown Part II ids,
//         no ext at all, pins / tips / baselines of ids that don't exist
const raro = JSON.parse(JSON.stringify(fin));
const m = raro.state.missions;
m.done = m.done.filter((id: string) => id !== 'H36' && id !== 'H40');
m.done.push('H77');
m.active = ['H35', 'H40', 'H99', 'C01'];
m.pinned = ['H99', 'H35'];
m.seenLines.push('H77', 'H99');
m.progress['H99:feature_x'] = 3;
delete raro.state.ext;
raro.state.beatsSeen.push('b77_inventado#a', 'b77_inventado');
raro.state.flags['won_ruptura_inventada'] = true;
raro.state.flags['region:inventada'] = true;
write('rupturas-raro', raro);

console.log('fixtures:', ['rupturas-mid', 'rupturas-fin', 'rupturas-mid-v1', 'rupturas-raro'].join(', '));
