/**
 * Builds the Parte III chain fixtures FROM CODE, each one where an act begins (⚠️ SPOILERS):
 *
 *   test-saves/h75-acto2.json   h69-acto1 → the Acto I played → H75 active (the Comic not bought yet)
 *   test-saves/h83-acto3.json   → the Acto II played (the Comic and the Shōnen) → H83 active
 *   test-saves/h89-acto4.json   → the Acto III played (the Library) → H89 active
 *   test-saves/h93-final.json   → the Acto IV played (the Tour) → H92 done, `p3_final` set → H93 active
 *
 * «Played» = the game's own systems: boxes bought from Maneki (buyGatera: huellas + gold), battles won through
 * applyGateraResult (huellas, flags, gold: the real rewards), features counted, each scene / card / flow of the act
 * marked seen (a player who got there watched them), the story's choices made (the blanket, the endings, the map, the
 * photo). The box cats come the same way (state/sys/p3cats.ts: the élites' captains, the story's, the activities'),
 * their reveals marked watched. Loading a fixture lands right where its act starts. Run after changing the data of an act:
 *
 *   cd game && npx vite-node scripts/make-act-fixtures.ts [acto2|acto3|acto4|final]   (default: every one it can)
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
const { MISSION_BY_ID } = await import('../src/data/content');
const GT = await import('../src/state/sys/gateras');
const GB = await import('../src/state/sys/gaterasBattles');
const { cardKey, flowKey, P3_ON_NEW, P3_ON_DONE } = await import('../src/ui/story/gaterasScript');
const { ACT_FLOWS } = await import('../src/app/actsFlow');
const P3C = await import('../src/state/sys/p3cats');
type BattleResult = import('../src/scenes/BattleScene').BattleResult;
type DimId = import('../src/state/sys/gateras').DimId;

const dir = new URL('../test-saves/', import.meta.url);
const die = (why: string): never => {
  throw new Error(`[fixtures] ${why}`);
};
const m = () => G.s.missions;
const seen = (k: string) => {
  if (!G.s.beatsSeen.includes(k)) G.s.beatsSeen.push(k);
};
const won: BattleResult = { won: true, reason: 'sunk', turns: 6, modulesDestroyed: 3, damageDealt: 100, catsLost: 0, perfect: false };
/** a mission's scenes, cards and flows, as a player who watched them (and the steps of its flows) */
function watched(id: string) {
  for (const r of [...(P3_ON_NEW[id] ?? []), ...(P3_ON_DONE[id] ?? [])]) {
    seen(r.part ? `${r.beat}#${r.part}` : r.beat);
    if (r.special === 'flow' && r.flow && ACT_FLOWS[r.flow]) for (const st of ACT_FLOWS[r.flow].steps) seen(st.key);
  }
  seen(cardKey(id, 'new'));
  seen(cardKey(id, 'done'));
}
const exists = (id: string) => MISSION_BY_ID.has(id);
function done(id: string) {
  checkMissions();
  if (!m().done.includes(id)) die(`${id} no se cumplió`);
  watched(id);
}
function buy(dim: DimId) {
  if (GT.isOpen(dim)) return;
  const p = GT.gateraPrice(dim);
  G.s.gold = Math.max(G.s.gold, p.gold * 2);
  const r = GT.buyGatera(dim);
  if (!r.ok) die(`no se pudo comprar ${dim}: ${r.why} (huellas ${GT.huellas()} de ${p.huellas})`);
}
const win = (dim: DimId, ...nodes: (string | number)[]) => {
  for (const n of nodes) GB.applyGateraResult(dim, n, won);
};
function write(name: string, build: string) {
  for (const id of m().active) if (!m().seenLines.includes(id)) m().seenLines.push(id);
  // the box cats earned on the way (state/sys/p3cats.ts adopted them as the game does): their reveal was watched
  for (const c of P3C.P3_CATS) if (P3C.p3Earned(c.id)) seen(P3C.p3Key(c.id));
  G.s.savedAt = Date.now();
  const state = JSON.parse(JSON.stringify(G.s));
  writeFileSync(new URL(`${name}.json`, dir), JSON.stringify({ version: SAVE_VERSION, savedAt: Date.now(), build, state }, null, 1) + '\n');
  console.log(`fixture: ${name} · huellas ${GT.huellas()} · activas ${m().active.filter((x) => /^H\d+$/.test(x)).join(', ')}`);
}

const want = process.argv[2] ?? 'all';
mem.set(SAVE_KEY, readFileSync(new URL('h69-acto1.json', dir), 'utf8'));
G.load();
if (!G.loaded) die('h69-acto1 no carga');
checkMissions();

// ------------------------------------------------------------------ the Acto I (the Borracha)
const B: DimId = 'p3d_borracha';
win(B, 5);
done('H69');
G.flag('dona:chispas');
G.count('feature_p3_borron');
done('H70');
win(B, 'ebrecha');
done('H71');
G.count('feature_p3_resaca');
done('H72');
win(B, 'eemiau');
done('H73');
win(B, 6, 7, 8, 9);
done('H74');
for (const k of ['b70_doneria', 'b70_donas', 'b70_sombras', 'b70_ficha', 'b71_cierre', 'b72_prologo', 'b72_parque', 'b72_hipomart', 'b72_doneria', 'b72_bar', 'b72_epilogo', 'b72_resaca', 'b73_entrada', 'b73_emen', 'b73_despues', 'b74_lista', 'b74_aviso', 'b74_ohshit']) seen(k);
for (const f of ['h70_doneria', 'h71_cierre', 'h72_resaca', 'h73_entrada', 'h73_emen', 'h74_lista', 'h74_aviso']) seen(flowKey(f));
for (const n of ['ebrecha', 'eemiau', '5', '6', '7', '8', '9']) GT.markSeenG(`intro:${GT.gateraBattleId(B, n)}`);
checkMissions();
if (!m().active.includes('H75')) die('H75 no se activó');
if (want === 'all' || want === 'acto2') write('h75-acto2', 'fixture-h75-acto2');

// ------------------------------------------------------------------ the Acto II (the Comic, home, the Shōnen)
if (exists('H82') && want !== 'acto2') {
  const S: DimId = 'p3d_superheroes';
  buy(S);
  win(S, 1, 2, 3, 4, 5);
  done('H75');
  win(S, 'eestambre');
  done('H76');
  win(S, 6, 7, 8, 9);
  done('H77');
  G.flag('cobija:faro');
  G.count('feature_p3_cerito');
  done('H78');
  const A: DimId = 'p3d_anime';
  buy(A);
  win(A, 'a1', 'a2', 'a3', 'a4', 'a5');
  done('H79');
  G.count('feature_p3_entrenamiento');
  done('H80');
  win(A, 'a6', 'a7', 'a8', 'a9');
  done('H81');
  G.count('feature_p3_vocacion');
  done('H82');
  checkMissions();
  if (exists('H83')) {
    if (!m().active.includes('H83')) die('H83 no se activó');
    if (want === 'all' || want === 'acto3') write('h83-acto3', 'fixture-h83-acto3');
  }
}

// ------------------------------------------------------------------ the Acto III (the Library)
if (exists('H88') && exists('H82') && !['acto2', 'acto3'].includes(want)) {
  const Lb: DimId = 'p3d_libros';
  buy(Lb);
  win(Lb, 'l1', 'l2', 'l3', 'l4', 'l5');
  done('H83');
  for (const f of ['final_cerditos:croquetas', 'final_liebre:empate', 'final_patito:pato']) G.flag(f);
  G.count('feature_p3_finales');
  done('H84');
  win(Lb, 'l6');
  done('H85');
  // after the collapse his flame stays at 60 % for good (the H85 flow's `llama` step)
  (await import('../src/state/sys/finalState')).setLlama(60);
  G.count('feature_p3_luz_trajo');
  done('H86');
  win(Lb, 'l7');
  G.flag('p3_mapa_brecha');
  done('H87');
  win(Lb, 'l8', 'l9');
  done('H88');
  checkMissions();
  if (exists('H89')) {
    if (!m().active.includes('H89')) die('H89 no se activó');
    if (want === 'all' || want === 'acto4') write('h89-acto4', 'fixture-h89-acto4');
  }
}

// ------------------------------------------------------------------ the Acto IV (the Tour), then home: the finale wakes up
if (exists('H92') && exists('H88') && exists('H82') && !['acto2', 'acto3', 'acto4'].includes(want)) {
  const Pp: DimId = 'p3d_pop';
  buy(Pp);
  win(Pp, 'p1', 'p2', 'p3', 'p4', 'p5');
  done('H89');
  G.flag('foto:3');
  G.count('feature_p3_gira');
  done('H90');
  win(Pp, 'p6', 'p7', 'p8', 'p9');
  done('H91');
  const { FINAL_GATE } = await import('../src/state/sys/missionGoals');
  G.flag(FINAL_GATE);
  G.count('feature_p3_noche_estrellada');
  done('H92');
  checkMissions();
  if (!m().active.includes('H93')) die('H93 no se activó');
  if (['H94', 'H95', 'H96', 'H97'].some((id) => m().active.includes(id) || m().done.includes(id))) die('el final se adelantó');
  write('h93-final', 'fixture-h93-final');
}
