/**
 * Parte III · LA PRESENTACIÓN antes de cada batalla (app/stageIntro.ts) y LA DEMOSTRACIÓN DE LA REGLA (battle/demo.ts)
 * — docs/part-iii/mecanicas-v2/03-plan-implementacion.md §2.3 and §6.
 *
 *   · a stage without a film never breaks: the plan falls to CINE's template or the animated card
 *   · the first time a film can't be skipped (seen: false); a retry / replay plays nothing here (the battle's own 3 s
 *     intro card is the reminder); «seen» is Part III state (ext.gateras.seen), never a Part II beat
 *   · the film lookup: the stage's `film`, then its battle id
 *   · the spec that plays is the one built before the presentation (the one estimated): a film changes nothing in it
 *   · ruleDemo is deterministic and honest (computed with the sim: the centre shot hits what it aimed at)
 */
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

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
const GT = await import('../src/state/sys/gateras');
const GB = await import('../src/state/sys/gaterasBattles');
const SI = await import('../src/app/stageIntro');
const { ruleDemo, demoFor } = await import('../src/battle/demo');
const X = await import('../src/state/sys/rupturasReset');

function load(f = 'h65-normal') {
  mem.clear();
  mem.set(SAVE_KEY, readFileSync(new URL(`../test-saves/${f}.json`, import.meta.url), 'utf8'));
  G.load();
  expect(G.loaded).toBe(true);
}
const B = 'p3d_borracha' as const;
const plain = (s: object) => JSON.parse(JSON.stringify({ ...s, seed: 0, onEnd: undefined }));

/** a fake film engine: which ids exist, and a log of what played */
function fakePort(ids: string[], end: 'done' | 'exited' | 'aborted' = 'done') {
  const played: { id: unknown; seen: boolean }[] = [];
  SI.setFilmPort({
    has: (id) => ids.includes(id),
    play: async (id, o) => {
      played.push({ id, seen: o.seen });
      return { end };
    },
  });
  return played;
}
afterEach(() => {
  SI.setFilmPort(null);
  SI.registerBriefingTemplate(null);
});

describe('the plan: film → template → card; seen → nothing', () => {
  it('the film ids of a stage: its `film`, then its battle id', () => {
    expect(SI.filmIdsFor(B, 5)).toEqual(['F01', 'p3d_borracha_5']);
    expect(SI.filmIdsFor(B, 9)).toEqual(['F07', 'p3d_borracha_9']);
    expect(SI.filmIdsFor(B, 3)).toEqual(['p3d_borracha_3']);
  });

  it('without a film the plan is the card (or CINE’s template); with one, the film; seen → none', () => {
    load();
    GT.openGatera(B);
    expect(SI.planIntro(B, 3, () => false, false)).toEqual({ mode: 'card', filmId: null, seen: false });
    expect(SI.planIntro(B, 3, () => false, true)).toEqual({ mode: 'template', filmId: null, seen: false });
    expect(SI.planIntro(B, 5, (id) => id === 'p3d_borracha_5')).toEqual({ mode: 'film', filmId: 'p3d_borracha_5', seen: false });
    expect(SI.planIntro(B, 5, (id) => id === 'F01' || id === 'p3d_borracha_5')).toMatchObject({ mode: 'film', filmId: 'F01' });
    GT.markSeenG(SI.introSeenKey(B, 5));
    expect(SI.planIntro(B, 5, () => true)).toEqual({ mode: 'none', filmId: null, seen: true });
  });

  it('a registered film plays once, unskippable the first time; then the stage goes straight in', async () => {
    load();
    GT.openGatera(B);
    const played = fakePort(['F01']);
    const spec = GB.buildGateraBattle(B, 5, () => undefined);
    const before = plain(spec);
    expect(await SI.stageIntro(B, 5, spec, () => null)).toBe('go');
    expect(played).toEqual([{ id: 'F01', seen: false }]);
    expect(GT.seenG('intro:p3d_borracha_5')).toBe(true);
    expect(SI.filmSeen('F01')).toBe(true);
    // the film changed nothing in the battle but its own intro card (no double card after a presentation)
    expect(spec.intro).toBeUndefined();
    expect({ ...plain(spec), intro: undefined }).toEqual({ ...before, intro: undefined });
    // a retry: nothing plays here (the battle's own 3 s card is the reminder)
    const again = GB.buildGateraBattle(B, 5, () => undefined);
    expect(await SI.stageIntro(B, 5, again, () => null)).toBe('go');
    expect(played.length).toBe(1);
    expect(again.intro).toBeTruthy();
    // «seen» is Part III state: never a Part II beat, never in beatsSeen
    expect(G.s.beatsSeen.some((b) => b.includes('borracha'))).toBe(false);
    expect(X.isPart2Beat('intro:p3d_borracha_5')).toBe(false);
    expect(G.s.ext!.gateras.seen).toEqual(expect.arrayContaining(['intro:p3d_borracha_5', 'film:f01']));
  });

  it('CINE’s briefing template gets the stage’s data (rival, rule, demo, stakes, estimate)', async () => {
    load();
    GT.openGatera(B);
    const played = fakePort([]);
    let got: import('../src/app/stageIntro').BriefingData | null = null;
    SI.registerBriefingTemplate((d) => {
      got = d;
      return { id: `brief_${d.battleId}` };
    });
    const spec = GB.buildGateraBattle(B, 2, () => undefined);
    const est = { p: 0.72, done: 40, total: 40, reasons: [], tips: [], details: [] };
    expect(await SI.stageIntro(B, 2, spec, () => est)).toBe('go');
    expect(played).toEqual([{ id: { id: 'brief_p3d_borracha_2' }, seen: false }]);
    const d = got as unknown as import('../src/app/stageIntro').BriefingData;
    expect(d.title).toBe('La Donería');
    expect(d.rival.name).toContain('Brote');
    expect(d.rival.line).toBeTruthy();
    expect(d.rule.lines.join(' ')).toMatch(/MAREO/);
    expect(d.rule.demo?.rule).toBe('donas');
    expect(d.huellas).toBe(3);
    expect(d.stakes.length).toBeGreaterThan(10);
    expect(d.estimate()?.p).toBe(0.72);
    expect(GT.seenG('intro:p3d_borracha_2')).toBe(true);
  });

  it('a film that aborts (or an engine that fails) never blocks the battle', async () => {
    load();
    GT.openGatera(B);
    SI.setFilmPort({
      has: () => true,
      play: async () => {
        throw new Error('sin GPU');
      },
    });
    // the card needs Pixi: in this headless test its import fails → the hook still answers 'go'
    const warn = console.warn;
    console.warn = () => undefined;
    try {
      expect(await SI.stageIntro(B, 1, GB.buildGateraBattle(B, 1, () => undefined), () => null)).toBe('go');
    } finally {
      console.warn = warn;
    }
  });

  it('the briefing data of every playable stage is complete (B-1…B-9)', () => {
    load();
    for (const st of GT.stagesOf(B).filter((s) => s.playable)) {
      const spec = GB.buildGateraBattle(B, st.n, () => undefined);
      const d = SI.briefingData(B, st.n, spec, { huellas: GT.huellasFor(B, st.n) });
      expect(d.title, `B-${st.n}`).toBe(st.name);
      expect(d.pasa.length).toBeGreaterThan(10);
      expect(d.rival.name.length).toBeGreaterThan(2);
      expect(d.rival.slug, `B-${st.n}`).toBeTruthy();
      expect(d.rule.lines.length).toBeGreaterThan(0);
      expect(d.stakes.length).toBeGreaterThan(10);
      expect(d.tag).toMatch(st.kind === 'boss' ? /^JEFE/ : st.kind === 'elite' ? /^ÉLITE/ : /B-\d/);
    }
  });
});

describe('ruleDemo: the rule shown with the real sim', () => {
  it('is deterministic (the same answer every call)', () => {
    for (const r of ['mareo', 'donas', 'botellas'] as const) expect(ruleDemo(r)).toEqual(ruleDemo(r));
  });

  it('MAREO: the centre shot hits the module it aimed at; the edge shot lands elsewhere (the same drift)', () => {
    for (const sway of [3, 4, 4.5, 6]) {
      const d = ruleDemo('mareo', { sway, period: 2.6, drift: 1 });
      const [centre, edge] = d.shots;
      expect(centre.good && !edge.good).toBe(true);
      expect(centre.landing).toBe('modulo');
      expect(centre.module).toBe(d.field.target!.kind);
      expect(Math.hypot(edge.x - centre.x, edge.y - centre.y)).toBeGreaterThan(10);
      // the edge left exactly ±sway from the centre (only the rule's part changed)
      expect(Math.abs(Math.abs(edge.angle - centre.angle) - (sway * Math.PI) / 180)).toBeLessThan(1e-9);
      expect(d.caption.length).toBeGreaterThan(20);
    }
  });

  it('DONAS: the bad shot lands on the donut; the good one on the ship', () => {
    const d = ruleDemo('donas', { sway: 4, period: 2.8, drift: 1, donas: { side: 1, n: 1, heal: 0.08, catHeal: 0.2 } });
    expect(d.field.donas.length).toBe(1);
    expect(d.shots[1].landing).toBe('dona');
    expect(['modulo', 'casco']).toContain(d.shots[0].landing);
  });

  it('BOTELLAS: the volley the battle drops (same seeded x), on your ship', () => {
    const d = ruleDemo('botellas', { sway: 4, period: 2.6, drift: 1, botellas: { side: 0, first: 2, every: 3, n: 3, power: 0.5 } });
    expect(d.shots.length).toBe(3);
    for (const s of d.shots) expect(s.x).toBeGreaterThanOrEqual(d.field.player.x0);
  });

  it('demoFor picks what a stage teaches first', () => {
    expect(demoFor(undefined)).toBeNull();
    expect(demoFor({ sway: 3, period: 3, drift: 1 })).toBe('mareo');
    expect(demoFor({ sway: 3, period: 3, drift: 1, botellas: { side: 0, first: 2, every: 3, n: 3, power: 0.5 } })).toBe('botellas');
    expect(demoFor({ sway: 3, period: 3, drift: 1, donas: { side: 1, n: 1, heal: 0.1, catHeal: 0.2 } })).toBe('donas');
  });
});
