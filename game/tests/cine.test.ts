/**
 * CINE runner (src/cine/runner.ts): order, logical time (FPS-independent), SALTAR folds the rest into the end
 * state, interruptions clean up and hand the world back, pause/blocked freeze the clock, replay persists nothing.
 * A fake stage records everything; the clock is driven by hand.
 */
import { describe, expect, it } from 'vitest';

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

const { CineRunner } = await import('../src/cine/runner');
const W = await import('../src/state/sys/worldState');
type Types = typeof import('../src/cine/types');
type CineScript = import('../src/cine/types').CineScript;
type CineStage = import('../src/cine/types').CineStage;
type WorldLook = import('../src/state/sys/worldState').WorldLook;
void (0 as unknown as Types);

class FakeStage implements CineStage {
  readonly id = 'test';
  calls: string[] = [];
  look: WorldLook = W.lookOf('normal');
  cam = { x: 0, y: 0, zoom: 1 };
  released: number | null = null;
  isAlive = true;
  isBlocked = false;
  hudOn = true;
  stopped = 0;
  tap: (() => void) | null = null;
  blocked() {
    return this.isBlocked;
  }
  alive() {
    return this.isAlive;
  }
  resolve(t: string | { x: number; y: number }) {
    return typeof t === 'string' ? ({ faro: { x: 100, y: 50 }, home: { x: -40, y: 0 } } as Record<string, { x: number; y: number }>)[t] ?? null : t;
  }
  cameraGet() {
    return { ...this.cam };
  }
  cameraSet(x: number, y: number, zoom: number) {
    this.cam = { x, y, zoom };
  }
  worldGet() {
    return { ...this.look };
  }
  worldSet(l: WorldLook) {
    this.look = l;
  }
  worldRelease(b: number) {
    this.released = b;
  }
  actor(cmd: { who: string; do: string }) {
    this.calls.push(`actor:${cmd.who}:${cmd.do}`);
  }
  fx(cmd: { id: string }) {
    this.calls.push(`fx:${cmd.id}`);
    return () => this.stopped++;
  }
  interact() {
    this.calls.push('interact');
    let res!: () => void;
    const done = new Promise<void>((r) => (res = r));
    this.tap = () => res();
    return { done, cancel: () => this.calls.push('interact:cancel') };
  }
  hud(v: boolean) {
    this.hudOn = v;
  }
}

const flush = () => new Promise<void>((r) => setImmediate(r));
async function advance(r: InstanceType<typeof CineRunner>, seconds: number, dt: number) {
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) {
    r.tick(dt);
    await flush();
  }
}
function host() {
  const said: string[] = [];
  const persisted: string[] = [];
  let open: (() => void) | null = null;
  return {
    said,
    persisted,
    close: () => open?.(),
    get dialog() {
      return !!open;
    },
    h: {
      say: (lines: [string, string][], o: { block: boolean }) => {
        said.push(lines.map((l) => l[1]).join('|'));
        if (!o.block) return Promise.resolve();
        return new Promise<void>((res) => (open = () => ((open = null), res())));
      },
      cancelSay: () => open?.(),
      persist: (b: string) => persisted.push(b),
      lines: (beat: string, idx?: number[]) => (idx ?? [0]).map((i) => ['LUZTERNA', `${beat}[${i}]`] as [string, string]),
    },
  };
}

const NIGHT = 'noche_astral';
const script = (steps: CineScript['steps'], extra: Partial<CineScript> = {}): CineScript => ({ id: 't', stage: 'test', steps, ...extra });

describe('cine runner', () => {
  it('runs steps in order on logical time: sequence, after, at, async, parallel', async () => {
    const st = new FakeStage();
    const r = new CineRunner(
      script([
        { fx: { id: 'a' } },
        { wait: 1 },
        { fx: { id: 'b' }, after: 0.5 },
        { fx: { id: 'late' }, at: 3 },
        { parallel: [{ wait: 2, id: 'p-long' }, { fx: { id: 'c' }, at: 0.25 }] },
        { fx: { id: 'd' } },
        { camera: { to: 'faro', zoom: 0.5, dur: 1 }, async: true },
        { fx: { id: 'e' } },
      ]),
      st,
      {},
    );
    const done = r.play();
    await advance(r, 6, 1 / 60);
    expect(await done).toBe('done');
    expect(st.calls).toEqual(['fx:a', 'fx:b', 'fx:c', 'fx:late', 'fx:d', 'fx:e']);
    const at = (id: string) => r.log.find((l) => l.id === id)!.t;
    expect(at('wait')).toBeCloseTo(0);
    expect(r.log.filter((l) => l.id === 'fx').map((l) => +l.t.toFixed(3))).toEqual([0, 1.5, 1.75, 3, 3.5, 3.5]);
    expect(st.cam).toEqual({ x: 100, y: 50, zoom: 0.5 });
    expect(st.stopped).toBe(6); // every flourish stopped at the end
  });

  it('is FPS-independent: 24, 60 and 144 fps reach every step at the same time and the same world', async () => {
    const steps: CineScript['steps'] = [
      { world: { to: { sky: 0.5, exposure: 0.8 }, dur: 1.3 } },
      { wait: 0.7 },
      { fx: { id: 'x' } },
      { world: { to: NIGHT, dur: 2.1, ease: 'out' }, async: true },
      { wait: 0.9, after: 0.35 },
      { fx: { id: 'y' } },
    ];
    const runs: { t: number[]; look: WorldLook }[] = [];
    for (const fps of [24, 60, 144]) {
      const st = new FakeStage();
      const r = new CineRunner(script(steps), st, {});
      const done = r.play();
      await advance(r, 6, 1 / fps);
      await done;
      runs.push({ t: r.log.map((l) => l.t), look: st.look });
    }
    for (const run of runs.slice(1)) {
      expect(run.t.length).toBe(runs[0].t.length);
      run.t.forEach((t, i) => expect(t).toBeCloseTo(runs[0].t[i], 6));
      expect(run.look).toEqual(runs[0].look);
    }
    expect(runs[0].look).toEqual(W.lookOf(NIGHT));
  });

  it('SALTAR folds the rest into the end state: world, camera, persist and UI apply; dialog, fx, interaction don’t', async () => {
    const st = new FakeStage();
    const H = host();
    const uiCalls: string[] = [];
    let finish = 0;
    const r = new CineRunner(
      script(
        [
          { ui: { bars: true, hud: false, skip: true } },
          { say: { beat: 'b', lines: [0] } },
          { world: { to: { sky: 0.5 }, dur: 5 }, async: true },
          { wait: 4 },
          { fx: { id: 'burst' } },
          { camera: { to: 'home', zoom: 0.7, dur: 2 } },
          { world: { to: NIGHT, dur: 3 } },
          { persist: { beat: 'b#a' } },
          { say: { beat: 'b', lines: [1] } },
          { ui: { bars: false, hud: true, skip: false } },
          { interact: { target: 'faro' } },
        ],
        { finish: () => finish++ },
      ),
      st,
      { ...H.h, ui: { set: (o) => uiCalls.push(JSON.stringify(o)), clear: () => uiCalls.push('clear') } },
    );
    const done = r.play();
    await advance(r, 1, 1 / 60);
    expect(H.dialog).toBe(true);
    expect(st.hudOn).toBe(false);
    r.skip();
    await advance(r, 0.1, 1 / 60);
    expect(await done).toBe('skipped');
    expect(st.look).toEqual(W.lookOf(NIGHT));
    expect(st.cam).toEqual({ x: -40, y: 0, zoom: 0.7 });
    expect(H.persisted).toEqual(['b#a']);
    expect(H.said).toEqual(['b[0]']);
    expect(st.calls).not.toContain('fx:burst');
    expect(st.calls).not.toContain('interact');
    expect(st.hudOn).toBe(true);
    expect(uiCalls[uiCalls.length - 1]).toBe('clear');
    expect(st.released).not.toBeNull();
    expect(finish).toBe(1);
  });

  it('an interruption (scene gone) stops everything, persists nothing more and hands the world back', async () => {
    const st = new FakeStage();
    const H = host();
    const r = new CineRunner(
      script([
        { world: { to: { sky: 0.6 }, dur: 3 }, async: true },
        { fx: { id: 'reflect' } },
        { wait: 2 },
        { persist: { beat: 'b#a' } },
        { fx: { id: 'after' } },
      ]),
      st,
      H.h,
    );
    const done = r.play();
    await advance(r, 1, 1 / 60);
    const half = st.look.sky;
    expect(half).toBeGreaterThan(0);
    expect(half).toBeLessThan(0.6);
    st.isAlive = false;
    await advance(r, 3, 1 / 60);
    expect(await done).toBe('interrupted');
    expect(H.persisted).toEqual([]);
    expect(st.calls).toEqual(['fx:reflect']);
    expect(st.stopped).toBe(1);
    expect(st.look.sky).toBe(half); // nothing else touched it (the scene is gone: nothing to hand back)
    expect(st.released).toBeNull();
  });

  it('abort() mid-dialog closes the dialog; pause and a blocked stage freeze the clock', async () => {
    const st = new FakeStage();
    const H = host();
    const r = new CineRunner(script([{ world: { to: { sky: 0.3 }, dur: 0.5 } }, { wait: 0.5 }, { fx: { id: 'one' } }, { say: { beat: 'b' } }, { fx: { id: 'two' } }]), st, H.h);
    const done = r.play();
    r.pause();
    await advance(r, 2, 1 / 60);
    expect(st.calls).toEqual([]);
    r.resume();
    st.isBlocked = true;
    await advance(r, 2, 1 / 60);
    expect(st.calls).toEqual([]);
    st.isBlocked = false;
    await advance(r, 1.2, 1 / 60);
    expect(st.calls).toEqual(['fx:one']);
    expect(H.dialog).toBe(true);
    r.abort();
    await advance(r, 0.2, 1 / 60);
    expect(await done).toBe('interrupted');
    expect(H.dialog).toBe(false);
    expect(st.calls).toEqual(['fx:one']);
    // the stage is still there: the world goes back to what the save says
    expect(st.released).not.toBeNull();
  });

  it('interact waits for the player (or its timeout); replay never persists; a broken step settles instead of looping', async () => {
    const st = new FakeStage();
    const H = host();
    const r = new CineRunner(script([{ interact: { target: 'faro', timeout: 5 } }, { persist: { beat: 'x' } }, { fx: { id: 'after' } }]), st, H.h, { replay: true });
    const done = r.play();
    await advance(r, 1, 1 / 60);
    expect(st.calls).toEqual(['interact']);
    st.tap!();
    await advance(r, 0.1, 1 / 60);
    expect(await done).toBe('done');
    expect(H.persisted).toEqual([]);
    expect(st.calls).toEqual(['interact', 'interact:cancel', 'fx:after', 'interact:cancel']);

    const st2 = new FakeStage();
    const r2 = new CineRunner(script([{ interact: { target: 'faro', timeout: 2 } }, { fx: { id: 'after' } }]), st2, {});
    const d2 = r2.play();
    await advance(r2, 2.2, 1 / 30);
    expect(await d2).toBe('done');
    expect(st2.calls).toContain('fx:after');

    const st3 = new FakeStage();
    let fin = 0;
    const warn = console.warn;
    console.warn = () => undefined;
    const r3 = new CineRunner(script([{ call: () => { throw new Error('bug'); } }, { fx: { id: 'never' } }], { finish: () => fin++ }), st3, {});
    const d3 = r3.play();
    await advance(r3, 0.1, 1 / 60);
    console.warn = warn;
    expect(await d3).toBe('skipped');
    expect(fin).toBe(1);
    expect(st3.calls).toEqual([]);
  });

  it('the H31 opening is well-formed: ends at noche_astral, persists its beat once, and the faro is the last step', async () => {
    const { OPENING } = await import('../src/cine/scenes/opening');
    const flat = (s: CineScript['steps']): CineScript['steps'] => s.flatMap((x) => ('parallel' in x ? flat(x.parallel) : 'seq' in x ? flat(x.seq) : [x]));
    const steps = flat(OPENING.steps);
    const persists = steps.filter((s) => 'persist' in s);
    expect(persists).toHaveLength(1);
    expect((persists[0] as { persist: { beat: string } }).persist.beat).toBe('b31_estrellas#a');
    expect(steps.some((s) => 'world' in s && s.world.to === 'noche_astral')).toBe(true);
    const last = OPENING.steps[OPENING.steps.length - 1];
    expect('interact' in last && last.interact.target).toBe('faro');
    expect(steps.some((s) => 'audio' in s && s.audio.invite)).toBe(true);
  });
});
