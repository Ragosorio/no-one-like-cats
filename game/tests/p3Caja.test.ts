/**
 * Parte III · the bar and the alley (C · BAR-MOMENTO, docs/part-iii/04 §2–§5): the three caja cines play through to the
 * end on a fake stage, read the right lines of agent A's beats, keep THE LISTENER RULE (the camera never passes right of
 * Canelo before the reveal — proved on the geometry for every screen shape, and in the script's order), the walk home
 * can never be lost, and «Volver a ver» lists them once seen (a replay persists nothing).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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
const { replayList, getCine } = await import('../src/cine/registry');
const W = await import('../src/state/sys/worldState');
const { P3_BAR_A, P3_BAR_B, BAR_LINES } = await import('../src/cine/scenes/p3Bar');
const { P3_SALIDA, SALIDA_LINES } = await import('../src/cine/scenes/p3Salida');
const { BAR, CALLE, frameCamera, rightEdge } = await import('../src/momentos/songs/drunck/layout');
type CineStage = import('../src/cine/types').CineStage;
type Line = [string, string];

const HIST = JSON.parse(readFileSync(join(__dirname, '../src/data/gateras/historia.json'), 'utf8')) as { story: { beats: { id: string; lines: Line[] }[] } };
const beat = (id: string) => HIST.story.beats.find((b) => b.id === id)!.lines;

/** what CajaScene exposes to the scripts (cajaOf(ctx)) — recorded, nothing drawn */
class FakeScene {
  log: string[] = [];
  set: 'bar' | 'calle' = 'bar';
  revealed = false;
  cam = { x: 820, y: 470, zoom: 1.25 };
  walkX = 0;
  luzX = 0;
  luzOn = 0;
  leash = 0;
  lying = 0;
  backs = 0;
  cross = 0;
  luzLook = 0;
  luzFace = -1;
  canHidden = false;
  mugFill = 0;
  mugFoam = 0;
  mug2 = 0;
  useSet(s: 'bar' | 'calle') {
    this.set = s;
    this.log.push(`set:${s}`);
  }
  reveal() {
    this.revealed = true;
    this.log.push('reveal');
  }
  showGulp(on: boolean) {
    this.log.push(`gulp:${on}`);
  }
  showFloor(on: boolean) {
    this.log.push(`floor:${on}`);
  }
  showCard(on: boolean) {
    this.log.push(`card:${on}`);
  }
}
class FakeCaja implements CineStage {
  readonly id = 'caja';
  readonly scene = new FakeScene();
  targets: { t: string; revealed: boolean }[] = [];
  fxs: { id: string; revealed: boolean }[] = [];
  drives: { id: string; revealed: boolean }[] = [];
  interacts: string[] = [];
  blocked() {
    return false;
  }
  alive() {
    return true;
  }
  resolve(t: string | { x: number; y: number }) {
    if (typeof t !== 'string') return t;
    this.targets.push({ t, revealed: this.scene.revealed });
    return { x: t === 'hipolito' ? BAR.hipolito.x : 1000, y: 450 };
  }
  cameraGet() {
    return { ...this.scene.cam };
  }
  cameraSet(x: number, y: number, zoom: number) {
    this.scene.cam = { x, y, zoom };
  }
  worldGet() {
    return { ...W.NORMAL_LOOK };
  }
  worldSet() {}
  worldRelease() {}
  actor() {}
  fx(cmd: { id: string }) {
    this.fxs.push({ id: cmd.id, revealed: this.scene.revealed });
  }
  driveGet() {
    return 0;
  }
  drive(id: string) {
    this.drives.push({ id, revealed: this.scene.revealed });
  }
  interact(cmd: { target: unknown }) {
    this.interacts.push(String(cmd.target));
    // the walk always ends (here: right away)
    return { done: Promise.resolve(), cancel: () => undefined };
  }
  hud() {}
}

const flush = () => new Promise<void>((r) => setImmediate(r));
async function playThrough(script: import('../src/cine/types').CineScript, o: { replay?: boolean } = {}) {
  const st = new FakeCaja();
  const said: Line[][] = [];
  const persisted: string[] = [];
  const r = new CineRunner(script, st, {
    say: (lines) => {
      said.push(lines);
      return Promise.resolve();
    },
    lines: (b, idx) => (idx ?? []).map((i) => beat(b)[i]),
    persist: (k) => persisted.push(k),
  }, { replay: o.replay });
  const p = r.play();
  for (let i = 0; i < 6000 && !r.result; i++) {
    r.tick(1 / 30);
    await flush();
  }
  return { res: await p, st, said: said.flat(), persisted, log: r.log };
}

describe('the lines: agent A’s beats, in the order of the script', () => {
  it('b66_bar: Canelo, the OYENTE (no plate) only where the script says, Hipólito and Espuma only in the punchline', () => {
    const L = beat('b66_bar');
    const who = (k: keyof typeof BAR_LINES) => L[BAR_LINES[k]][0];
    for (const k of ['a4', 'b2', 'b6', 'b12'] as const) expect(who(k), k).toBe('OYENTE');
    for (const k of ['r2', 'r7'] as const) expect(who(k), k).toBe('HIPÓLITO');
    for (const k of ['r4', 'r9'] as const) expect(who(k), k).toBe('DOÑA ESPUMA');
    for (const k of ['a2', 'a3', 'a5', 'a7', 'b1', 'b3', 'b5', 'b7', 'b8', 'b9b', 'b10', 'b11', 'b13', 'r5', 'r8', 'r10'] as const) expect(who(k), k).toBe('CANELO');
    expect(L[BAR_LINES.r5][1]).toContain('PATO');
    // the OYENTE only ever says «¿Y luego?»
    for (const [sp, t] of L) if (sp === 'OYENTE') expect(t).toBe('¿Y luego?');
  });
  it('b67_salida: the door, the four stretches, the bond, her goodbye', () => {
    const L = beat('b67_salida');
    expect(L[SALIDA_LINES.l3]).toEqual(['LUZTERNA', 'Canelo.']);
    expect(L[SALIDA_LINES.v5][1]).toContain('Una noche');
    expect([...SALIDA_LINES.tramo1, ...SALIDA_LINES.tramo2, ...SALIDA_LINES.tramo3, ...SALIDA_LINES.tramo4]).toHaveLength(14);
  });
});

describe('the cines play through on the caja stage', () => {
  it('p3_bar_a: outside (the sign), inside, the OYENTE, the slide, the gulp — and persists b66_bar#a', async () => {
    const { res, st, said, persisted } = await playThrough(P3_BAR_A);
    expect(res).toBe('done');
    expect(st.scene.log.slice(0, 2)).toEqual(['set:calle', 'set:bar']);
    expect(st.scene.log).toContain('gulp:true');
    // A2, A3, A4 (the OYENTE), A5 split around the front page, the cat flaps (two halves around the door), A7
    expect(said.map((l) => l[0])).toEqual(['CANELO', 'CANELO', 'OYENTE', 'CANELO', 'CANELO', 'CANELO', 'CANELO', 'CANELO']);
    expect(said.map((l) => l[1])).toEqual((['a2', 'a3', 'a4', 'a5', 'a5b', 'gatera', 'gatera2', 'a7'] as const).map((k) => beat('b66_bar')[BAR_LINES[k]][1]));
    expect(persisted).toEqual(['b66_bar#a']);
    // Hipólito does not exist yet
    expect(st.targets.some((t) => t.t === 'hipolito')).toBe(false);
    expect(st.scene.revealed).toBe(false);
  });
  it('p3_bar_b: THE LISTENER RULE in the script — nothing of him before the reveal; then the punchline and the card', async () => {
    mem.clear();
    const { res, st, said, persisted } = await playThrough(P3_BAR_B);
    expect(res).toBe('done');
    const ri = st.scene.log.indexOf('reveal');
    expect(ri).toBeGreaterThan(0);
    // every look at him, his snore, his fall come after the reveal
    for (const t of st.targets.filter((x) => x.t === 'hipolito')) expect(t.revealed).toBe(true);
    for (const f of st.fxs.filter((x) => ['fall', 'pop'].includes(x.id))) expect(f.revealed).toBe(true);
    for (const d of st.drives.filter((x) => x.id === 'snore')) expect(d.revealed).toBe(true);
    // the first HIPÓLITO line comes after every OYENTE line
    const firstHip = said.findIndex((l) => l[0] === 'HIPÓLITO');
    const lastOy = said.map((l) => l[0]).lastIndexOf('OYENTE');
    expect(firstHip).toBeGreaterThan(lastOy);
    // exactly one B5′ line (no H64 choice saved here → «…el Capi nomás me miraba.»)
    expect(said.filter((l) => l[1].startsWith('…el Capi')).map((l) => l[1])).toEqual([beat('b66_bar')[BAR_LINES.b5none][1]]);
    expect(st.scene.log).toContain('card:true');
    expect(persisted).toEqual(['b66_bar#b']);
  });
  it('p3_salida: the four legs of the walk are interactive, between them the lines; persists b67_salida#a', async () => {
    const { res, st, said, persisted } = await playThrough(P3_SALIDA);
    expect(res).toBe('done');
    expect(st.interacts).toEqual(['walk:1', 'walk:2', 'walk:3', 'walk:4']);
    expect(said.length).toBe(beat('b67_salida').length);
    expect(persisted).toEqual(['b67_salida#a']);
  });
  it('a replay persists nothing', async () => {
    for (const s of [P3_BAR_A, P3_BAR_B, P3_SALIDA]) expect((await playThrough(s, { replay: true })).persisted).toEqual([]);
  });
});

describe('THE LISTENER RULE (geometry): before the reveal no camera shows anything right of the line', () => {
  it('for any requested camera, on any screen shape (16:9, 21:9, 32:9, 4:3, phone), the right edge stays ≤ hideX', () => {
    const views = [
      { x: 0, y: 0, w: 1920, h: 1080 },
      { x: -300, y: 0, w: 2520, h: 1080 },
      { x: -960, y: 0, w: 3840, h: 1080 },
      { x: 0, y: -180, w: 1920, h: 1440 },
      { x: 0, y: -1000, w: 1920, h: 3080 },
    ];
    let n = 0;
    for (const v of views)
      for (let x = -800; x <= 3000; x += 97)
        for (const zoom of [0.5, 0.8, 1, 1.25, 1.6, 2.1, 2.8])
          for (const y of [200, 470, 800]) {
            const f = frameCamera(x, y, zoom, v, 'bar', false);
            expect(rightEdge(f, v), `${JSON.stringify(v)} x${x} z${zoom}`).toBeLessThanOrEqual(BAR.hideX + 1e-6);
            n++;
          }
    expect(n).toBeGreaterThan(1000);
    // Hipólito (and his donut, and the tower) are entirely right of the line
    expect(BAR.hipolito.x - BAR.hipolito.h * 0.45).toBeGreaterThan(BAR.hideX - 120);
    expect(BAR.tower.x - 120).toBeGreaterThan(BAR.hideX);
    // the second mug is inside (A3: «a la derecha del cuadro hay un segundo tarro»)
    expect(BAR.tarro2.x + BAR.tarro2.w).toBeLessThanOrEqual(BAR.hideX);
  });
  it('after the reveal the camera can go there; the alley has no such line', () => {
    const v = { x: 0, y: 0, w: 1920, h: 1080 };
    expect(rightEdge(frameCamera(BAR.hipolito.x, 470, 1.6, v, 'bar', true), v)).toBeGreaterThan(BAR.hipolito.x);
    expect(frameCamera(CALLE.gatera.x, 600, 1.2, v, 'calle', false).x).toBeGreaterThan(3000);
  });
});

describe('the walk home can never be lost', async () => {
  const { walkStep, WALK, WALK_LEGS } = await import('../src/scenes/CajaScene');
  const legTime = (taps: (t: number) => number) =>
    WALK_LEGS.map(([x0, end]) => {
      let s = { x: x0, idle: 0, leaning: 0, pushing: false, done: false };
      let t = 0;
      while (!s.done && t < 120) {
        s = walkStep(s, end, 1 / 60, taps(t));
        t += 1 / 60;
      }
      return t;
    });
  it('without a single tap every leg still ends (he leans on a post; after 3 s she pushes him)', () => {
    for (const t of legTime(() => 0)) expect(t).toBeLessThan(WALK.idleToLean + WALK.pushAfter + 3);
  });
  it('tapping walks him straight and faster', () => {
    const idle = legTime(() => 0);
    const tapping = legTime((t) => (Math.floor(t * 60) % 20 === 0 ? 1 : 0));
    tapping.forEach((t, i) => expect(t).toBeLessThan(idle[i]));
  });
});

describe('«Volver a ver»', () => {
  it('the three cines are registered on the caja stage and listed once their beats were seen, spoiler-free', () => {
    for (const id of ['p3_bar_a', 'p3_bar_b', 'p3_salida']) expect(getCine(id)?.stage).toBe('caja');
    expect(replayList([]).some((e) => e.id.startsWith('p3_'))).toBe(false);
    const list = replayList(['b66_bar#a', 'b66_bar#b', 'b67_salida#a']).filter((e) => e.id.startsWith('p3_'));
    expect(list.map((e) => e.id)).toEqual(['p3_bar_a', 'p3_bar_b', 'p3_salida']);
    for (const e of list) expect(e.title).not.toMatch(/Hip[oó]lito|dona|pato/i);
  });
});
