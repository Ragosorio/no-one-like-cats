/**
 * Regression (2026-10-08, "perdí mi partida"): the island must survive old windows, accidental
 * "nueva partida" and moving between devices. Covers the .nocat format and the anti-overwrite guard.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { describe as describeSave, fromAny, summarize, toNocat } from '../src/core/vault';

// a tiny in-memory localStorage for node
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

const { G, newGame } = await import('../src/state');
const { SAVE_KEY, readSave } = await import('../src/core/save');

describe('.nocat files', () => {
  const env = JSON.stringify({ version: 3, savedAt: 1791506365356, state: { kl: 29, playMs: 18_022_592, gold: 5.6e8, cats: new Array(32).fill({}), player: { name: 'Capi' }, counters: { species: 32 } } });
  it('round-trips through .nocat, the base64 code and a bare envelope', () => {
    const nocat = toNocat(env);
    expect(JSON.parse(nocat).format).toBe('nocat');
    expect(JSON.parse(fromAny(nocat)!)).toEqual(JSON.parse(env));
    expect(JSON.parse(fromAny(btoa(unescape(encodeURIComponent(env))))!)).toEqual(JSON.parse(env));
    expect(JSON.parse(fromAny(env)!)).toEqual(JSON.parse(env));
    expect(fromAny('hola')).toBeNull();
    expect(fromAny('{"version":3}')).toBeNull();
  });
  it('summaries say which island is which', () => {
    const s = summarize(env)!;
    expect(s).toMatchObject({ kl: 29, cats: 32, playMin: 300, name: 'Capi' });
    expect(describeSave(s)).toBe('Reino 29 · 32 gatos · 5 h 0 min jugadas');
  });
});

describe('anti-overwrite guard', () => {
  beforeEach(() => {
    mem.clear();
    newGame();
    G.otherWindow = false;
    G.staleWindow = false;
    G.saveLocked = false;
  });
  it('a normal save writes', () => {
    G.s.playMs = 60_000;
    G.save();
    expect(readSave<{ playMs: number }>()?.state.playMs).toBe(60_000);
  });
  it('an old window (less play time than the disk) never overwrites the newer island', () => {
    G.s.playMs = 10 * 3600_000;
    G.save();
    const newer = mem.get(SAVE_KEY);
    // this window "wakes up" holding an island from hours ago
    G.s.playMs = 3600_000;
    let stale = 0;
    G.on('stale', () => stale++);
    G.save();
    expect(mem.get(SAVE_KEY)).toBe(newer);
    expect(G.staleWindow).toBe(true);
    expect(stale).toBe(1);
    G.save();
    expect(mem.get(SAVE_KEY)).toBe(newer);
  });
  it('a second window of the game does not write', () => {
    G.s.playMs = 5000;
    G.save();
    const first = mem.get(SAVE_KEY);
    G.otherWindow = true;
    G.s.playMs = 999_999_999;
    G.save();
    expect(mem.get(SAVE_KEY)).toBe(first);
  });
});
