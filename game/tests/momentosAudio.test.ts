/**
 * The audio engine extensions Momentos need (src/audio/player.ts, docs/part-ii/19 + 29 §6):
 *  - prepare: fetch + decode ONCE, every later buffer deck of that file starts without fetching or decoding
 *  - a restart jump inside the playing song reuses its decoded buffer and lands on the next bar (no 1–2 s re-decode)
 *  - pause / resume of the playing deck
 *  - decoded bytes are ref-counted and go back to 0 when nothing holds them
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

class Param {
  value = 0;
  setValueAtTime() {}
  linearRampToValueAtTime() {}
  cancelScheduledValues() {}
  cancelAndHoldAtTime() {}
  setValueCurveAtTime() {}
  setTargetAtTime() {}
}
const fakeBuffer = (sec: number) => ({ duration: sec, length: Math.round(sec * 48000), numberOfChannels: 2, sampleRate: 48000, getChannelData: () => new Float32Array(4), copyToChannel() {} });
const starts: { when: number; offset: number }[] = [];
let decodes = 0;
let fetches = 0;
const ctx = {
  currentTime: 10,
  sampleRate: 48000,
  state: 'running',
  outputLatency: 0,
  baseLatency: 0,
  createGain: () => ({ gain: new Param(), connect() {}, disconnect() {} }),
  createBufferSource: () => ({
    buffer: null,
    loop: false,
    loopStart: 0,
    loopEnd: 0,
    onended: null,
    connect() {},
    disconnect() {},
    start(when: number, offset: number) {
      starts.push({ when, offset });
    },
    stop() {},
  }),
  decodeAudioData: async () => {
    decodes++;
    return fakeBuffer(237.1);
  },
  createBuffer: (_ch: number, len: number) => fakeBuffer(len / 48000),
};

let player: typeof import('../src/audio/player');
let catalog: typeof import('../src/audio/catalog');
beforeAll(async () => {
  (globalThis as { fetch?: unknown }).fetch = vi.fn(async () => {
    fetches++;
    return { ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(8) };
  });
  const { audio } = await import('../src/core/audio');
  const a = audio as unknown as { ctx: unknown; musicBus: unknown };
  a.ctx = ctx;
  a.musicBus = ctx.createGain();
  player = await import('../src/audio/player');
  catalog = await import('../src/audio/catalog');
});
afterAll(async () => {
  const { audio } = await import('../src/core/audio');
  (audio as unknown as { ctx: unknown }).ctx = null;
});

describe('prepared songs and buffer reuse', () => {
  it('prepare decodes once; a sync cue then starts with no fetch and no decode; bytes go back to 0', async () => {
    const r = catalog.resolveTrack('liky_fight')!;
    expect(r).toBeTruthy();
    const f0 = fetches;
    const d0 = decodes;
    expect(await player.prepareDecoded(ctx as never, r.url)).toBe(true);
    expect(await player.prepareDecoded(ctx as never, r.url)).toBe(true); // a second holder: same buffer
    expect(fetches - f0).toBe(1);
    expect(decodes - d0).toBe(1);
    const p = new player.MusicPlayer();
    const deck = await p.play(r, { sync: true, quantize: 'now', fade: 0.01 });
    expect(deck?.kind).toBe('buffer');
    expect(fetches - f0).toBe(1);
    expect(decodes - d0).toBe(1);
    expect(player.mem.reused).toBeGreaterThan(0);
    expect(player.mem.liveBytes).toBeGreaterThan(0);
    // the deck keeps its buffer alive while it plays even after the prepared holds go
    player.releaseDecoded(r.url);
    player.releaseDecoded(r.url);
    expect(player.preparedStatus()).toEqual([]);
    expect(player.mem.liveBytes).toBeGreaterThan(0);
    deck!.dispose();
    expect(player.mem.liveBytes).toBe(0);
  });

  it('a restart jump reuses the playing buffer and lands exactly on the next bar', async () => {
    const r = catalog.resolveTrack('liky_fight')!;
    const p = new player.MusicPlayer();
    ctx.currentTime = 100;
    const a = await p.play(r, { sync: true, quantize: 'now', fade: 0.01, at: 0 });
    const f0 = fetches;
    const d0 = decodes;
    starts.length = 0;
    // 3.0 s later (heard position ≈ 3.0): jump to the drop at the next bar of the playing deck
    ctx.currentTime = a!.startCtx + 3.0;
    const b = await p.play(r, { sync: true, quantize: 'bar', section: 'drop', restart: true, fade: 0.01 });
    expect(fetches - f0).toBe(0);
    expect(decodes - d0).toBe(0);
    expect(b!.buffer).toBe(a!.buffer);
    const bar = 240 / 131;
    const nextBar = Math.ceil((3.0 + 0.1) / bar) * bar; // the player's lead is 0.1 s for buffers
    expect(b!.startCtx - a!.startCtx).toBeCloseTo(nextBar, 2);
    expect(starts.at(-1)!.offset).toBeCloseTo(71.45, 2);
    p.stop(0.01);
    a!.dispose();
    b!.dispose();
    expect(player.mem.liveBytes).toBe(0);
  });

  it('pause / resume keeps the position', async () => {
    const r = catalog.resolveTrack('liky_fight')!;
    const p = new player.MusicPlayer();
    ctx.currentTime = 200;
    const d = await p.play(r, { sync: true, quantize: 'now', fade: 0.01, at: 10 });
    ctx.currentTime = d!.startCtx + 5;
    p.setPaused(true);
    expect(d!.state).toBe('paused');
    ctx.currentTime += 30;
    expect(d!.uAt(ctx.currentTime)).toBeCloseTo(15, 3);
    p.setPaused(false);
    expect(d!.state).toBe('playing');
    expect(starts.at(-1)!.offset).toBeCloseTo(15, 2);
    d!.dispose();
  });
});
