/**
 * Parte III · the bar's polish pass (BAR · docs/part-iii/13 §3.2, §3.4): the cross, scene A, scene B and the reveal.
 *
 *  - the TEXT is kept: every split line, rejoined, is the script's line; the new line about the cat flaps is Canelo's;
 *    no older index of b66_bar moved (the halves were appended), and every line is said exactly once.
 *  - TWO RHYTHMS: each idea of 13 §3.4 has its ACTION between the right lines (present → show → consequence), and in
 *    scene B no two lines of Canelo follow each other without something happening in between.
 *  - the four H64 versions of the Capi (mentira:*) each get their fry and their line.
 *  - THE LISTENER RULE: everything the pass draws in the bar is left of BAR.hideX; nothing of Hipólito before R1.
 *  - «Reducir movimiento»: every shake / whip / punch has a reduced variant (skip).
 *  - the reveal keeps its length and its tower starts where the set draws it.
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
const W = await import('../src/state/sys/worldState');
const { G } = await import('../src/state/game');
const { P3_BAR_A, P3_BAR_B, BAR_LINES } = await import('../src/cine/scenes/p3Bar');
const S = await import('../src/ui/story/gaterasScript');
const { BAR, CALLE, BAR_PULIDO: P } = await import('../src/momentos/songs/drunck/layout');
const R = await import('../src/scenes/caja/barRemate');
type CineStage = import('../src/cine/types').CineStage;
type Step = import('../src/cine/types').Step;
type Line = [string, string];

const HIST = JSON.parse(readFileSync(join(__dirname, '../src/data/gateras/historia.json'), 'utf8')) as { story: { beats: { id: string; lines: Line[] }[] } };
const bar = HIST.story.beats.find((b) => b.id === 'b66_bar')!.lines;

/** the script's lines before the pass (docs/part-iii/04 §2, §4): the ones that were split, whole */
const WHOLE: [keyof typeof BAR_LINES, keyof typeof BAR_LINES, string][] = [
  ['a5', 'a5b', '¿Cómo que «y luego»? ¿No sabes quién soy? …No, no sabes. Mejor. Aquí nadie sabe nada. Por eso me gusta.'],
  ['b3', 'b3b', '¿Luego? Llevo no sé cuántas noches encima de esa hoja. Todos esperando que yo decida. ¡Yo! Que no sé decidir entre pescado y pescado.'],
  ['b7', 'b7b', 'Luego me dormí encima. Porque nadie puede escribir debajo de un gato dormido. Esa ley la inventé yo. Bueno, ya existía. Pero la usé yo.'],
  ['b9b', 'b9c', 'Dicen que tenemos nueve vidas. Yo ya gasté como ocho. …Bueno, no sé contar. Igual ya voy en la once.'],
  ['b10', 'b10b', 'Y la Luz… su linterna manda señal para afuera. Ella la dejó prendida, porque así es ella: cuida dejando que la vean.'],
  ['b11', 'b11b', '…Yo nomás quería una noche sin que nadie me viera. Una noche. ¿Qué puede pasar en una noche?'],
];

// ------------------------------------------------------------------ a stage that records ONE ordered timeline
type Ev = { k: 'say' | 'fx' | 'drive' | 'cam' | 'call'; id: string; v?: unknown; revealed: boolean };
class FakeScene {
  set: 'bar' | 'calle' = 'bar';
  revealed = false;
  cam = { x: 820, y: 470, zoom: 1.25 };
  canHidden = false;
  luzOn = 0;
  mugFill = 0;
  mugFoam = 0;
  mug2 = 0;
  constructor(private ev: Ev[]) {}
  useSet(s: 'bar' | 'calle') {
    this.set = s;
    this.ev.push({ k: 'call', id: `set:${s}`, revealed: this.revealed });
  }
  reveal() {
    this.revealed = true;
    this.ev.push({ k: 'call', id: 'reveal', revealed: true });
  }
  showGulp() {}
  showFloor() {}
  showCard() {}
}
class FakeCaja implements CineStage {
  readonly id = 'caja';
  readonly ev: Ev[] = [];
  readonly scene = new FakeScene(this.ev);
  blocked() {
    return false;
  }
  alive() {
    return true;
  }
  resolve(t: string | { x: number; y: number }) {
    if (typeof t === 'string') this.ev.push({ k: 'cam', id: t, revealed: this.scene.revealed });
    return typeof t === 'string' ? { x: 1000, y: 450 } : t;
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
  fx(cmd: { id: string; [k: string]: unknown }) {
    this.ev.push({ k: 'fx', id: cmd.id === 'act' ? `act:${String(cmd.kind)}` : cmd.id, v: cmd.v, revealed: this.scene.revealed });
  }
  driveGet() {
    return 0;
  }
  drive(id: string, k: number) {
    const last = this.ev[this.ev.length - 1];
    if (last?.k === 'drive' && last.id === id) last.v = k;
    else this.ev.push({ k: 'drive', id, v: k, revealed: this.scene.revealed });
  }
  interact() {
    return { done: Promise.resolve(), cancel: () => undefined };
  }
  hud() {}
}
const flush = () => new Promise<void>((r) => setImmediate(r));
async function play(script: import('../src/cine/types').CineScript) {
  const st = new FakeCaja();
  const r = new CineRunner(
    script,
    st,
    {
      say: (lines, o) => {
        for (const [i, l] of lines.entries()) {
          st.ev.push({ k: 'say', id: l[1], v: l[0], revealed: st.scene.revealed });
          o.onLine?.(i);
        }
        return Promise.resolve();
      },
      lines: (b, idx) => (idx ?? []).map((i) => bar[i]),
      persist: () => undefined,
    },
    { replay: true },
  );
  const p = r.play();
  for (let i = 0; i < 9000 && !r.result; i++) {
    r.tick(1 / 30);
    await flush();
  }
  expect(await p).toBe('done');
  return st.ev;
}
const text = (k: keyof typeof BAR_LINES) => bar[BAR_LINES[k]][1];
/** index of the first event matching, at or after `from` */
function at(ev: Ev[], pred: (e: Ev) => boolean, from = 0) {
  for (let i = from; i < ev.length; i++) if (pred(ev[i])) return i;
  return -1;
}
const saidAt = (ev: Ev[], k: keyof typeof BAR_LINES) => at(ev, (e) => e.k === 'say' && e.id === text(k));
const fxAt = (ev: Ev[], id: string, from = 0) => at(ev, (e) => e.k === 'fx' && e.id === id, from);
const driveAt = (ev: Ev[], id: string, from = 0) => at(ev, (e) => e.k === 'drive' && e.id === id, from);

describe('the text is kept, the indexes did not move', () => {
  it('every split line rejoins into the script’s line; the new line about the cat flaps is Canelo’s', () => {
    for (const [a, b, whole] of WHOLE) expect(`${text(a)} ${text(b)}`, a).toBe(whole);
    // the Correctores / Disruptores / Titiriteros line: three parts
    expect(`${text('b5')} ${text('b5b')} ${text('b5c')}`).toBe('Los blancos quieren un mundo sin errores. Los grafiteros, romper todas las cajas. Las manos de luz escriben y no dan la cara. Y el Capi…');
    expect(`${text('b8')} ${text('b8b')} ${text('b8c')} ${text('b8d')}`).toBe('¿Sabes qué es lo peor? Que ya entendí todo. La niebla borraba para que nadie escribiera encima. La salvamos y le quitamos la goma. Ahora todo se escribe solo. Y yo soy el pisapapeles.');
    expect(`${text('gatera')} ${text('gatera2')}`).toBe('Las cajas tienen gateras, compa. Puertitas. Nadie las ve porque nadie se quiere ir.');
    expect(bar[BAR_LINES.gatera][0]).toBe('CANELO');
  });
  it('the older indexes are where they were (the halves were appended at 28+); every line is named once', () => {
    expect(bar.length).toBe(41);
    expect([BAR_LINES.a2, BAR_LINES.a3, BAR_LINES.a4, BAR_LINES.a5, BAR_LINES.a7]).toEqual([0, 1, 2, 3, 4]);
    expect([BAR_LINES.b1, BAR_LINES.b2, BAR_LINES.b3, BAR_LINES.b5]).toEqual([5, 6, 7, 8]);
    expect([BAR_LINES.b6, BAR_LINES.b7, BAR_LINES.b8, BAR_LINES.b9b, BAR_LINES.b10, BAR_LINES.b11, BAR_LINES.b12, BAR_LINES.b13]).toEqual([13, 14, 15, 16, 17, 18, 19, 20]);
    expect([BAR_LINES.r2, BAR_LINES.r10]).toEqual([21, 27]);
    const all = Object.values(BAR_LINES);
    expect(new Set(all).size).toBe(all.length);
    expect([...all].sort((a, b) => a - b)).toEqual(bar.map((_, i) => i));
    // the B5′ variant is still the fifth line of scene B, whatever the choice
    expect(bar[S.barSceneB('romper')[4]][1]).toContain('rompan todo');
  });
});

describe('p3_bar_a · the cross and scene A', async () => {
  const ev = await play(P3_BAR_A);
  it('the cross: the flap light wipes away in bands, THEN the neon buzzes on, the hairs lead to the door, the patron', () => {
    const calle = at(ev, (e) => e.id === 'set:calle');
    const hairs = driveAt(ev, 'pelos');
    const dark = driveAt(ev, 'neonApagado');
    const cruce = fxAt(ev, 'cruce');
    const neon = fxAt(ev, 'neon');
    const eject = fxAt(ev, 'eject');
    const inside = at(ev, (e) => e.id === 'set:bar');
    expect(calle).toBeGreaterThanOrEqual(0);
    expect([calle < dark, dark < cruce, hairs < cruce, cruce < neon, neon < eject, eject < inside]).toEqual([true, true, true, true, true, true]);
  });
  it('A: the hug, the honest clue, the whole-body offense, the front page on «¿No sabes quién soy?», APLAUSOS and nobody', () => {
    expect(fxAt(ev, 'act:abrazo')).toBeLessThan(saidAt(ev, 'a2'));
    // the clue (the second mug's foam snores) is on from A3, before the OYENTE first speaks
    expect(driveAt(ev, 'ronquido')).toBeLessThan(saidAt(ev, 'a4'));
    expect(fxAt(ev, 'act:ofendido')).toBeLessThan(saidAt(ev, 'a5'));
    const portada = fxAt(ev, 'portada');
    expect(portada).toBeGreaterThan(saidAt(ev, 'a5'));
    expect(portada).toBeLessThan(saidAt(ev, 'a5b'));
    const ap = driveAt(ev, 'applause', portada);
    expect(ap).toBeGreaterThan(portada);
    expect(fxAt(ev, 'act:ojos', portada)).toBeLessThan(saidAt(ev, 'a5b'));
    expect(fxAt(ev, 'act:desinfla', portada)).toBeLessThan(saidAt(ev, 'a5b'));
  });
  it('the cat-flap rule is SHOWN: he draws the little door, it opens on another box between the two halves, it shuts', () => {
    const draw = fxAt(ev, 'gateraDibuja');
    const g1 = saidAt(ev, 'gatera');
    const open = fxAt(ev, 'gateraAbre');
    const g2 = saidAt(ev, 'gatera2');
    expect(fxAt(ev, 'act:espuma')).toBeLessThan(draw);
    expect([draw < g1, g1 < open, open < g2]).toEqual([true, true, true]);
    // the insert is shown for it and taken down after it
    expect(driveAt(ev, 'ins:espuma')).toBeLessThan(draw);
    const off = at(ev, (e) => e.k === 'drive' && e.id === 'ins:espuma' && e.v === 0);
    expect(off).toBeGreaterThan(g2);
    // the slide and the catch, and the gulp still opens the Momento
    expect(fxAt(ev, 'catch')).toBeGreaterThan(fxAt(ev, 'slide'));
    expect(saidAt(ev, 'a7')).toBeGreaterThan(fxAt(ev, 'catch'));
  });
});

describe('p3_bar_b · the counter becomes the diagram', async () => {
  const ev = await play(P3_BAR_B);
  it('each idea has its action between the right lines (present → show → consequence → next)', () => {
    const between = (what: number, a: keyof typeof BAR_LINES, b: keyof typeof BAR_LINES, name: string) => {
      expect(what, `${name} exists`).toBeGreaterThanOrEqual(0);
      expect(what, `${name} after «${text(a).slice(0, 30)}»`).toBeGreaterThan(saidAt(ev, a));
      expect(what, `${name} before «${text(b).slice(0, 30)}»`).toBeLessThan(saidAt(ev, b));
    };
    between(driveAt(ev, 'servilleta'), 'b3', 'b3b', 'the napkin');
    between(fxAt(ev, 'dianoche'), 'b3', 'b3b', 'days and nights');
    between(driveAt(ev, 'tele2'), 'b3', 'b3b', 'pescado y pescado');
    between(fxAt(ev, 'blanco'), 'b5', 'b5b', 'the white');
    between(fxAt(ev, 'rojo'), 'b5b', 'b5c', 'the graffiti');
    // the hands of light come down WITH their line, before the Capi's fry
    expect(fxAt(ev, 'manos')).toBeGreaterThan(saidAt(ev, 'b5c'));
    expect(fxAt(ev, 'manos')).toBeLessThan(fxAt(ev, 'capi'));
    between(fxAt(ev, 'lapiz'), 'b7', 'b7b', 'the pencil');
    between(fxAt(ev, 'borrador'), 'b8', 'b8b', 'the fog eraser');
    between(fxAt(ev, 'guarda'), 'b8b', 'b8c', 'the eraser in his scarf');
    between(fxAt(ev, 'gis'), 'b8c', 'b8d', 'the chalk');
    between(driveAt(ev, 'placa'), 'b8d', 'b9b', 'PISAPAPELES');
    between(fxAt(ev, 'act:garras'), 'b9b', 'b9c', 'the claws');
    between(fxAt(ev, 'rayas'), 'b9c', 'b10', 'the marks multiply');
    between(driveAt(ev, 'haz'), 'b10', 'b10b', 'the blue beam');
    between(driveAt(ev, 'bufanda'), 'b11', 'b11b', 'the scarf');
    // the three sides go on the counter seen from above, with the napkin
    expect(driveAt(ev, 'ins:barra')).toBeLessThan(fxAt(ev, 'azucar'));
    expect(fxAt(ev, 'azucar')).toBeLessThan(fxAt(ev, 'catsup'));
    expect(fxAt(ev, 'catsup')).toBeLessThan(fxAt(ev, 'manos'));
  });
  it('two rhythms: in scene B no two lines of Canelo follow each other without something happening in between', () => {
    const r1 = at(ev, (e) => e.id === 'reveal');
    let prev = -1;
    for (let i = 0; i < r1; i++) {
      const e = ev[i];
      if (e.k !== 'say') continue;
      if (prev >= 0 && e.v === 'CANELO' && ev[prev].v === 'CANELO') {
        const acts = ev.slice(prev + 1, i).filter((x) => x.k === 'fx' || x.k === 'drive' || x.k === 'cam');
        expect(acts.length, `between «${ev[prev].id.slice(0, 30)}» and «${e.id.slice(0, 30)}»`).toBeGreaterThan(0);
      }
      prev = i;
    }
  });
  it('the listener rule in the script: nothing of Hipólito before R1, and the reveal is silent of the bed', () => {
    for (const e of ev.filter((x) => x.id === 'hipolito' || x.id === 'fall' || x.id === 'pop' || x.id === 'snore')) expect(e.revealed, e.id).toBe(true);
    const firstHip = at(ev, (e) => e.k === 'say' && e.v === 'HIPÓLITO');
    expect(firstHip).toBeGreaterThan(at(ev, (e) => e.id === 'reveal'));
  });
});

describe('the four versions of the Capi (mentira:*)', () => {
  for (const [flag, want, words] of [
    ['mentira:perfecto', 'perfecto', 'un mundo perfecto'],
    ['mentira:romper', 'romper', 'rompan todo'],
    ['mentira:nada', 'nada', 'en blanco'],
    [null, 'none', 'nomás me miraba'],
  ] as const) {
    it(`${flag ?? 'no choice'}: one fry (${want}) and its line, the fry writes on the line`, async () => {
      const flags = G.s.flags as Record<string, unknown>;
      for (const k of ['perfecto', 'romper', 'nada']) delete flags[`mentira:${k}`];
      if (flag) flags[flag] = true;
      const ev = await play(P3_BAR_B);
      const capis = ev.filter((e) => e.k === 'fx' && e.id === 'capi');
      expect(capis.map((e) => e.v)).toEqual([want]);
      const said = ev.filter((e) => e.k === 'say' && e.id.startsWith('…el Capi'));
      expect(said.length).toBe(1);
      expect(said[0].id).toContain(words);
      const w = fxAt(ev, 'capiEscribe');
      expect(w).toBeGreaterThan(ev.indexOf(capis[0]));
      if (flag) delete flags[flag];
    });
  }
});

describe('THE LISTENER RULE for what the pass draws, and «Reducir movimiento»', () => {
  it('every prop and effect of the pass in the bar is left of BAR.hideX', () => {
    const xs = [P.win.x1, P.board.x1, P.tv.x1, ...P.napkin.filter((_, i) => i % 2 === 0), P.placa.x + 150, P.espumaTo + 200];
    for (const x of xs) expect(x).toBeLessThan(BAR.hideX);
    // the honest clue: the second mug's foam (its bubbles) and the catch around his mug
    expect(BAR.tarro2.x + BAR.tarro2.w * 0.5 + BAR.tarro2.w * 0.42 + 10).toBeLessThan(BAR.hideX);
    expect(BAR.tarro.x + 4 + 210 + 40).toBeLessThan(BAR.hideX);
    // the hairs lead from the door down the alley
    expect(P.pelos.x0).toBeGreaterThan(CALLE.door.x);
  });
  it('every shake, whip and punch of the bar has a reduced variant (skip)', () => {
    const walk = (steps: Step[], out: Step[]) => {
      for (const s of steps) {
        out.push(s);
        if ('seq' in s) walk(s.seq, out);
        if ('parallel' in s) walk(s.parallel, out);
      }
      return out;
    };
    for (const sc of [P3_BAR_A, P3_BAR_B]) {
      for (const s of walk(sc.steps, [])) {
        if ('fx' in s && ['shake', 'punch'].includes(s.fx.id)) expect(s.reduced, `${sc.id} ${s.fx.id}`).toBe('skip');
      }
    }
  });
  it('the cross: the island and the bar draw the SAME living light (one source), never a flat card', () => {
    const cines = readFileSync(join(__dirname, '../src/ui/story/gaterasCines.ts'), 'utf8');
    const ins = readFileSync(join(__dirname, '../src/scenes/caja/barInsertos.ts'), 'utf8');
    for (const src of [cines, ins]) {
      expect(src).toMatch(/import \{ FLAP_LIGHT, drawFlapLight \} from '[./]*(scenes\/caja\/)?barLuz'/);
      expect(src).toContain('drawFlapLight(');
    }
  });
});

describe('A1 · the patron thrown out is a REAL cat (13 §2.2: never a generic figure)', async () => {
  const C = await import('../src/scenes/caja/barCliente');
  const { CAST } = await import('../src/momentos/songs/drunck/tv');
  it('a common painting of this box, not a story character (never the listener)', () => {
    const rigs = JSON.parse(readFileSync(join(__dirname, '../src/data/catRigs.json'), 'utf8')) as Record<string, unknown>;
    expect(rigs[C.PATRON], 'it has a rig: a puppet').toBeTruthy();
    expect([CAST.hipolito, CAST.espuma, 'dona_police_cat', 'canelo_cozy_cat', 'luzterna']).not.toContain(C.PATRON);
    // the CajaScene no longer draws a generic cat shape for him
    const scene = readFileSync(join(__dirname, '../src/scenes/CajaScene.ts'), 'utf8');
    expect(scene).not.toMatch(/function catBack|function ghostBack/);
  });
  it('the gag: flies out spinning → lands with a squash → a dizzy beat → walks back in through the door', () => {
    const fly = C.patronPose(0.3);
    const land = C.patronPose(0.72);
    const dizzy = C.patronPose(1.2);
    const back = C.patronPose(2.5);
    expect(fly.y).toBeLessThan(CALLE.ground - 100);
    expect(fly.rot).not.toBe(0);
    expect(land.sy).toBeLessThan(0.75);
    expect(land.sx).toBeGreaterThan(1.2);
    expect(dizzy.dizzy).toBe(1);
    expect(back.face).toBe(-1);
    expect(back.x).toBeLessThan(dizzy.x);
    expect(C.patronPose(0.1).door).toBe(1);
    // «Reducir movimiento»: no spin
    expect(C.patronPose(0.3, true).rot).toBe(0);
    // the cine cuts inside as he goes back in (the gag fits A1's hold)
    expect(C.PATRON_DUR).toBeLessThanOrEqual(2.7);
  });
});

describe('the reveal keeps its staging and its length', () => {
  it('standing, the tower is where the set always drew it; the fall ends behind the counter in time for R7', () => {
    const st = R.towerAt(-1);
    expect(st.tilt).toBe(0);
    st.donuts.forEach((d, i) => {
      expect(d!.x).toBeCloseTo(BAR.tower.x + (i % 2 ? 8 : -8), 5);
      expect(d!.y).toBeCloseTo(BAR.counterBack - 60 - i * 34, 5);
    });
    // anticipation first: he does not leave the counter in the first beat
    expect(R.hipFall(0.2).dy).toBeLessThan(20);
    // by the time the cine cuts to the floor (≈1.9 s after «fall») he has dropped behind the counter
    expect(R.hipFall(R.FALL.antic + R.FALL.slide).dy).toBeGreaterThan(560);
    expect(R.FALL.antic + R.FALL.slide).toBeLessThanOrEqual(2.4);
    // the donuts leave the stand top first (the drag) and are gone by the floor shot
    const leaveTop = R.towerAt(R.FALL.antic + 0.62).donuts;
    expect(leaveTop[6]!.y).not.toBeCloseTo(BAR.counterBack - 60 - 6 * 34, 0);
    expect(R.towerAt(4).donuts.every((d) => d === null)).toBe(true);
    expect(R.leaveWobble(0, 1.3)).toEqual({ dx: 0, rot: 0, dy: -0 });
  });
});
