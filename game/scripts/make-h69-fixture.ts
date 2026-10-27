/**
 * Builds test-saves/h69-acto1.json FROM CODE: the moment the Acto I begins — h65-normal played through the prologue
 * (H66–H68) with the game's own systems, the Borracha bought from Maneki, B-1…B-4 won, H69 active. Every prologue
 * scene and card is marked seen (a player who got here watched them), so loading it lands on the Carta with B-5 next.
 *
 *  1. h65-normal.json loaded through the real systems (migrations, normalize, patches).
 *  2. H66 → H67 → H68 completed by their own features (the bar, the street, the gatera bought with buyGatera).
 *  3. B-1…B-4 won through applyGateraResult (huellas, flags, gold — the real rewards), the route's beats seen.
 *
 *   cd game && npx vite-node scripts/make-h69-fixture.ts
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
const GT = await import('../src/state/sys/gateras');
const GB = await import('../src/state/sys/gaterasBattles');
const { cardKey } = await import('../src/ui/story/gaterasScript');
type BattleResult = import('../src/scenes/BattleScene').BattleResult;

const dir = new URL('../test-saves/', import.meta.url);
const die = (why: string): never => {
  throw new Error(`[h69-acto1] ${why}`);
};
const B = 'p3d_borracha' as const;
const seen = (k: string) => {
  if (!G.s.beatsSeen.includes(k)) G.s.beatsSeen.push(k);
};

mem.set(SAVE_KEY, readFileSync(new URL('h65-normal.json', dir), 'utf8'));
G.load();
if (!G.loaded) die('h65-normal no carga');
checkMissions();
const m = G.s.missions;
if (!m.active.includes('H66')) die('H66 no se activó');

// ------------------------------------------------------------------ 2. the prologue, by its own features
G.count('feature_p3_bar');
checkMissions();
if (!m.done.includes('H66')) die('H66 no se cumplió');
G.count('feature_p3_salida');
checkMissions();
if (!m.done.includes('H67')) die('H67 no se cumplió');
GT.markSeenG('carta_intro');
G.s.gold = Math.max(G.s.gold, GT.gateraPrice(B).gold * 2);
const buy = GT.buyGatera(B);
if (!buy.ok) die(`no se pudo comprar la gatera: ${buy.why}`);
GT.markSeenG('maneki_note');
GT.markSeenG('gatera_borracha');
checkMissions();
if (!m.done.includes('H68') || !m.active.includes('H69')) die('H68 → H69 no avanzó');
for (const k of ['b66_bar', 'b67_salida', 'b67_despierta', 'b68_carta', 'b68_carta#a', 'b69_manana#a']) seen(k);
for (const id of ['H66', 'H67', 'H68']) {
  seen(cardKey(id, 'new'));
  seen(cardKey(id, 'done'));
}
seen(cardKey('H69', 'new'));

// ------------------------------------------------------------------ 3. B-1…B-4, won with the real rewards
const won: BattleResult = { won: true, reason: 'sunk', turns: 5, modulesDestroyed: 3, damageDealt: 100, catsLost: 0, perfect: false };
for (let n = 1; n <= 4; n++) GB.applyGateraResult(B, n, won);
seen('b69_manana#b');
seen('b69_manana#c');
checkMissions();
if (GT.clearedIn(B) !== 4 || GT.frontierOf(B) !== 5) die('la ruta no quedó en B-5');
// the briefing of B-1…B-4 was seen (each battle had its presentation)
for (let n = 1; n <= 4; n++) GT.markSeenG(`intro:${GT.gateraBattleId(B, n)}`);
for (const id of m.active) if (!m.seenLines.includes(id)) m.seenLines.push(id);
G.s.savedAt = Date.now();

const state = JSON.parse(JSON.stringify(G.s));
const env = { version: SAVE_VERSION, savedAt: Date.now(), build: 'fixture-h69-acto1', state };
writeFileSync(new URL('h69-acto1.json', dir), JSON.stringify(env, null, 1) + '\n');
console.log(`fixture: h69-acto1 · huellas ${GT.huellas()} · ruta ${GT.clearedIn(B)}/9 · H69 activa: ${m.active.includes('H69')} · hechas H66–H68: ${['H66', 'H67', 'H68'].every((x) => m.done.includes(x))}`);
