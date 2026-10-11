/**
 * File stingers never leave a moment silent: a failed or slow load plays the procedural recipe instead
 * (its own id, the one named in the table, or its family: discovery_mi → discovery).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const voice = vi.fn();
const play = vi.fn();
const decode = vi.fn();
const fakeCtx = {
  createGain: () => ({ gain: { value: 1 }, connect: () => ({}), disconnect: () => {} }),
  createBufferSource: () => ({ buffer: null, connect: () => ({ connect: () => ({}) }), start: vi.fn(), onended: null }),
  decodeAudioData: decode,
};
vi.mock('../src/core/audio', () => ({
  audio: { ctx: fakeCtx, muted: false, musicBus: {}, voice, play, duck: () => {} },
}));
vi.mock('../src/audio/catalog', () => ({ musicUrl: (f: string) => `/${f}` }));

const { playStinger } = await import('../src/audio/stingers');
const FILES = {
  discovery_mi: { file: 'music/stinger.discovery_mi.m4a', gain: 0.9 },
  star_fall: { file: 'music/amb.motivo.m4a' },
};

describe('stingers: file with procedural fallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    voice.mockClear();
    play.mockClear();
    decode.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('a 404 plays the family recipe (discovery_mi → discovery)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })));
    playStinger('discovery_mi', { files: FILES });
    await vi.runAllTimersAsync();
    expect(voice).toHaveBeenCalled();
  });

  it('a load slower than the moment plays the recipe on time, and not the file too', async () => {
    let resolve!: (b: ArrayBuffer) => void;
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, arrayBuffer: () => new Promise<ArrayBuffer>((r) => (resolve = r)) })));
    decode.mockResolvedValue({ duration: 2 });
    playStinger('star_fall', { files: FILES });
    await vi.advanceTimersByTimeAsync(800);
    expect(voice).toHaveBeenCalled();
    const n = voice.mock.calls.length;
    resolve(new ArrayBuffer(8));
    await vi.runAllTimersAsync();
    expect(voice.mock.calls.length).toBe(n);
  });

  it('a file that loads in time plays the file, not the recipe', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })));
    decode.mockResolvedValue({ duration: 1 });
    playStinger('discovery_mi', { files: { discovery_mi: { file: 'music/other.m4a' } } });
    await vi.runAllTimersAsync();
    expect(decode).toHaveBeenCalled();
    expect(voice).not.toHaveBeenCalled();
  });
});
