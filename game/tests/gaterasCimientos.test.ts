/**
 * Parte III · CIMIENTOS (docs/part-iii/11 §2 A): the Part II rules stop at H65 / b65, the new speakers, and — once the
 * prologue data lands — H66–H69, their cards, the Bitácora, the world states and the save safety.
 */
import { describe, expect, it } from 'vitest';
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
const { patchNotes } = await import('../src/state/patches');
const L = await import('../src/state/sys/rupturasLedger');
const X = await import('../src/state/sys/rupturasReset');
const { speaker, isDirection } = await import('../src/ui/story/text');
const { BEAT_BY_ID, MISSIONS, MISSION_BY_ID } = await import('../src/data/content');
const { checkMissions } = await import('../src/state/sys/missions');
const { goalCounters, goalFlags } = await import('../src/state/sys/missionGoals');
const S = await import('../src/ui/story/gaterasScript');
const { ACTO1_FLOWS } = await import('../src/app/acto1Flow');
const { FINAL_FLOWS } = await import('../src/app/finalFlow');
const { ACTS_FLOWS } = await import('../src/app/actsFlow');
const GW = await import('../src/state/sys/gaterasWorld');
const W = await import('../src/state/sys/worldState');
const PAGE = await import('../src/ui/story/o4Pagina');
const REG = await import('../src/cine/registry');
const { CineRunner } = await import('../src/cine/runner');
await import('../src/ui/story/gaterasCines');
type CineScript = import('../src/cine/types').CineScript;
type CineStage = import('../src/cine/types').CineStage;
type WorldLook = import('../src/state/sys/worldState').WorldLook;

const envOf = (f: string) => JSON.parse(readFileSync(new URL(`../test-saves/${f}.json`, import.meta.url), 'utf8'));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
function loadEnv(env: unknown) {
  mem.clear();
  mem.set(SAVE_KEY, JSON.stringify(env));
  patchNotes.length = 0;
  G.load();
  expect(G.loaded).toBe(true);
}

// =====================================================================================================
describe('A1 · Parte II ends at H65 / b65', () => {
  it('isPart2Mission is H31…H65 only; H66+ is «after Parte II»', () => {
    for (const id of ['H31', 'H41', 'H58', 'H65']) expect(L.isPart2Mission(id), id).toBe(true);
    for (const id of ['H01', 'H30', 'H66', 'H67', 'H68', 'H69', 'H93', 'H95', 'H100', 'C01', 'K07', '', null, undefined, 66]) expect(L.isPart2Mission(id), String(id)).toBe(false);
    for (const id of ['H66', 'H69', 'H95', 'H100']) expect(L.isAfterPart2Mission(id), id).toBe(true);
    for (const id of ['H65', 'H31', 'H01', 'C66', 'E70']) expect(L.isAfterPart2Mission(id), id).toBe(false);
    expect(L.PART2_LAST).toBe(65);
  });

  it('isPart2Beat is b31…b65 (+ the Part II tables and the CARTA ink); b66+ never', () => {
    for (const b of ['b31_estrellas', 'b31_estrellas#a', 'b49_x', 'b58_suenos#b', 'b65_continuara', 'b65_inventado', 'carta_paginas']) expect(X.isPart2Beat(b), b).toBe(true);
    for (const b of ['b30_creditos', 'b66_bar', 'b66_bar#a', 'b67_salida', 'b67_despierta', 'b68_carta', 'b69_manana', 'b77_inventado', 'b100_x', 'b199_x', 'p3_tarjeta_H66', 'carta_p3d_borracha'])
      expect(X.isPart2Beat(b), b).toBe(false);
  });

  it('the ledger never keys a Parte III battle, cat or mission', () => {
    loadEnv(envOf('rupturas-o4'));
    expect(L.battleKey('p3d_borracha_1', 'H69')).toBeNull();
    expect(L.catKey('p3d_borracha_5', 'H69')).toBeNull();
    expect(L.battleKey('umbral_final', 'H63')).toBe('battle:umbral_final');
    const before = JSON.stringify(G.s.ext?.rupturas ?? null);
    L.claimMissionReward('H66');
    L.claimMissionReward('H69');
    expect(JSON.stringify(G.s.ext?.rupturas ?? null)).toBe(before);
    // even a stray key never makes a Parte III mission «already paid»
    L.claimReward('mission:H66');
    expect(L.missionRewardClaimed('H66')).toBe(false);
  });

  it('a save in Parte III (H66+ done or active) is never sent back to H31; its H66+ ids never enter the plan', () => {
    const env = envOf('rupturas-o4');
    const st = env.state;
    st.missions.done.push('H66', 'H67');
    st.missions.active = [...st.missions.active.filter((m: string) => m !== 'H68'), 'H68'];
    st.beatsSeen.push('b66_bar', 'b66_bar#a', 'b67_salida', 'b67_despierta');
    st.flags['gatera:p3d_borracha'] = true;
    st.flags['won_p3d_borracha_1'] = true;
    st.flags['event_done_p3d_borracha_2'] = true;
    // the plan (read-only) never lists them, whatever the save says
    loadEnv(clone(env));
    const plan = X.planReset();
    expect(plan.done.filter(L.isAfterPart2Mission)).toEqual([]);
    expect(plan.active.filter(L.isAfterPart2Mission)).toEqual([]);
    expect(plan.beats.filter((b) => /^b6[6-9]_/.test(b))).toEqual([]);
    expect(plan.flags.filter((f) => f.includes('p3d_'))).toEqual([]);
    expect(plan.claims.filter((k) => /H6[6-9]|p3d_/.test(k))).toEqual([]);
    // and the reset refuses the whole save (the narrative is past Parte II)
    delete (G.s.ext?.rupturas as Record<string, unknown> | undefined)?.reset;
    const before = JSON.stringify(G.s);
    expect(X.applyRupturasReset({ backup: false })).toBe('parte3');
    expect(JSON.stringify(G.s)).toBe(before);
    // only active is enough (H65 done → H66 appeared)
    G.s.missions.done = G.s.missions.done.filter((m) => !L.isAfterPart2Mission(m));
    G.s.missions.active = ['H66'];
    expect(X.applyRupturasReset({ backup: false })).toBe('parte3');
    // and never after the end of Parte III either (docs/part-iii/08 §6.1: no reset once H93 is done)
    G.s.missions.active = [];
    G.s.missions.done.push('H93');
    expect(X.applyRupturasReset({ backup: false })).toBe('parte3');
  });
});

describe('A3 · Parte III speakers', () => {
  const fallback = speaker('__NADIE_REGISTRADO__');
  const registered = (sp: string) => {
    const s = speaker(sp);
    return s.kind !== fallback.kind || s.slug !== fallback.slug || s.band !== fallback.band;
  };
  it('CANELO, HIPÓLITO, DOÑA ESPUMA, OYENTE and BITÁCORA are registered (none falls back to Canelo-as-unknown)', () => {
    for (const sp of ['CANELO', 'HIPÓLITO', 'DOÑA ESPUMA', 'OYENTE', 'BITÁCORA', 'LUZTERNA', 'MANEKI']) expect(registered(sp), sp).toBe(true);
    expect(speaker('CANELO')).toMatchObject({ kind: 'cat', slug: 'canelo_cozy_cat', name: 'CANELO' });
    expect(speaker('Canelo').id).toBe('canelo');
    expect(speaker('HIPÓLITO').kind).toBe('cat');
    expect(speaker('DOÑA ESPUMA').kind).toBe('cat');
  });
  it('OYENTE has no name tag and no portrait; BITÁCORA is a system voice without a face', () => {
    const o = speaker('OYENTE');
    expect(o.kind).toBe('oyente');
    expect(o.name).toBe('');
    expect(o.slug).toBeUndefined();
    const b = speaker('BITÁCORA');
    expect(b.kind).toBe('system');
    expect(b.slug).toBeUndefined();
    expect(b.name).toBe('BITÁCORA');
  });
});

// =====================================================================================================
const P3 = ['H66', 'H67', 'H68', 'H69'];
const save = (active: string[], done: string[] = [], beats: string[] = [], flags: Record<string, boolean> = {}) => ({ missions: { active, done }, beatsSeen: beats, flags });
const P2_DONE = Array.from({ length: 35 }, (_, i) => `H${31 + i}`);

describe('A2 · H66–H69: data (contract ids, cards, beats)', () => {
  it('the four missions follow the contract: one historia chain after H65, goals and triggers as agreed', () => {
    const want: Record<string, { trigger: string; type: string; key: string }> = {
      H66: { trigger: 'mission:H65', type: 'use_feature', key: 'feature_p3_bar' },
      H67: { trigger: 'mission:H66', type: 'use_feature', key: 'feature_p3_salida' },
      H68: { trigger: 'mission:H67', type: 'use_feature', key: 'feature_p3_gatera_borracha' },
      H69: { trigger: 'mission:H68', type: 'win_battle', key: 'won_p3d_borracha_5' },
    };
    for (const id of P3) {
      const m = MISSION_BY_ID.get(id)!;
      expect(m, id).toBeTruthy();
      expect(m.chain).toBe('historia');
      expect(m.trigger).toBe(want[id].trigger);
      expect(m.goal.type).toBe(want[id].type);
      expect([...goalCounters(m.goal), ...goalFlags(m.goal)], id).toContain(want[id].key);
      expect(L.isPart2Mission(id)).toBe(false);
    }
    expect(MISSIONS.filter((m) => m.trigger === 'mission:H65').map((m) => m.id)).toEqual(['H66']);
  });

  it('every card has its 5 one-line fields, and no `why` sells the prize as the reason', () => {
    const PRIZE = /\b(premios?|gemas?|oro|orbes?|recompensas?|doblones|botín|gratis|pagan?)\b/i;
    for (const id of P3) {
      const m = MISSION_BY_ID.get(id)!;
      const c = m.card!;
      expect(c, id).toBeTruthy();
      for (const k of ['pasa', 'importa', 'queremos', 'ahi', 'cambio'] as const) {
        expect(typeof c[k], `${id}.${k}`).toBe('string');
        expect(c[k].trim().length, `${id}.${k}`).toBeGreaterThan(3);
        expect(c[k], `${id}.${k} is one line`).not.toMatch(/\n/);
        expect(c[k].length, `${id}.${k} ≤ 70`).toBeLessThanOrEqual(70);
      }
      expect(m.why, id).toBeTruthy();
      expect(m.why!, `${id}.why`).not.toMatch(PRIZE);
      for (const k of ['pasa', 'importa', 'queremos', 'ahi'] as const) expect(c[k], `${id}.${k}`).not.toMatch(PRIZE);
    }
    // the script's cards (04 §1, §5, §7)
    expect(MISSION_BY_ID.get('H66')!.card).toMatchObject({ pasa: 'Canelo no está en la página', importa: 'Es la primera vez que se va', cambio: 'Se fue a olvidar. Y habla' });
    expect(MISSION_BY_ID.get('H67')!.card!.cambio).toBe('REGISTRO 000 despertó y siguió a Canelo');
  });

  it('beats: the five ids exist with $scene, every speaker is registered, Canelo only speaks away from home', () => {
    const fallback = speaker('__NADIE__');
    for (const id of ['b66_bar', 'b67_salida', 'b67_despierta', 'b68_carta', 'b69_manana']) {
      const b = BEAT_BY_ID.get(id)!;
      expect(b, id).toBeTruthy();
      expect((b as unknown as { $scene?: string }).$scene, id).toBeTruthy();
      for (const [sp] of b.lines) {
        const s = speaker(sp);
        expect(s.kind !== fallback.kind || s.slug !== fallback.slug || s.band !== fallback.band, `${id}: ${sp}`).toBe(true);
      }
      expect(X.isPart2Beat(id)).toBe(false);
    }
    // at home he doesn't talk (04 §6 D6): no CANELO line in the awakening
    expect(BEAT_BY_ID.get('b67_despierta')!.lines.some(([sp]) => sp === 'CANELO')).toBe(false);
    // the listener only ever says «¿Y luego?»
    for (const [sp, t] of BEAT_BY_ID.get('b66_bar')!.lines) if (sp === 'OYENTE') expect(t).toBe('¿Y luego?');
  });

  it('the line maps the scenes read cover each beat exactly once (B5′: one variant per H64 choice)', () => {
    const cover = (beat: string, idx: number[]) => expect([...idx].sort((a, b) => a - b), beat).toEqual(BEAT_BY_ID.get(beat)!.lines.map((_, i) => i));
    const B = S.BAR_LINES;
    cover('b66_bar', [...B.a, ...B.b, ...Object.values(B.mentira), ...B.b2, ...B.gracias, ...B.remate]);
    cover('b67_salida', [...S.SALIDA_LINES.salida, ...S.SALIDA_LINES.tramos.flat(), ...S.SALIDA_LINES.vinculo, ...S.SALIDA_LINES.adios]);
    cover('b67_despierta', Object.values(S.DESPIERTA_LINES).flat());
    cover('b68_carta', Object.values(S.CARTA_LINES).flat());
    cover('b69_manana', Object.values(S.MANANA_LINES).flat());
    // scene B picks the line of the choice the player made in H64
    const bar = BEAT_BY_ID.get('b66_bar')!.lines;
    expect(bar[S.barSceneB('perfecto')[4]][1]).toContain('un mundo perfecto');
    expect(bar[S.barSceneB('romper')[4]][1]).toContain('rompan todo');
    expect(bar[S.barSceneB('nada')[4]][1]).toContain('en blanco');
    expect(bar[S.barSceneB(null)[4]][1]).toContain('nomás me miraba');
    expect(bar[B.remate[0]][0]).toBe('HIPÓLITO');
    expect(bar[B.remate[B.remate.length - 1]][1]).toBe('Redondéale a diez.');
    // the walk: 4 stretches (04 §5.2), the third one is Luzterna's honest seed
    expect(S.SALIDA_LINES.tramos.length).toBe(4);
  });

  it('the hooks: cards for every mission, dialog parts ≤4 lines, `after` chains and delays keep the order', () => {
    // H66–H69 (the slice) + the Acto I H70–H74 (NARRATIVA, integrated by MECÁNICAS-IMPL: tests/acto1.test.ts)
    // + the finale H93–H97 (dormant until the Actos II–IV; its flows: app/finalFlow.ts, tests/final.test.ts)
    const ALL = [...P3, 'H70', 'H71', 'H72', 'H73', 'H74', ...S.P3_MISSIONS.filter((id) => Number(id.slice(1)) >= 75)];
    expect(S.P3_COVERED).toEqual(ALL);
    for (const id of ALL) {
      expect(S.P3_ON_NEW[id]?.some((r) => r.special === 'card' && r.phase === 'new' && r.mission === id), `${id} new card`).toBe(true);
      expect(S.P3_ON_DONE[id]?.some((r) => r.special === 'card' && r.phase === 'done' && r.mission === id), `${id} done card`).toBe(true);
    }
    const keys = new Set<string>();
    for (const refs of [...Object.values(S.P3_ON_NEW), ...Object.values(S.P3_ON_DONE), ...S.P3_WHEN.map((w) => [w.ref])])
      for (const r of refs) {
        const key = r.part ? `${r.beat}#${r.part}` : r.beat;
        keys.add(key);
        if (r.special === 'card') {
          expect(r.beat).toBe(S.cardKey(r.mission!, r.phase!));
          expect(X.isPart2Beat(r.beat)).toBe(false);
          continue;
        }
        if (r.special === 'cine') {
          expect(REG.getCine(r.cine!), r.cine).toBeTruthy();
          continue;
        }
        // an Acto I flow (app/acto1Flow.ts) plays its own beats (they are checked in tests/acto1.test.ts)
        if (r.special === 'flow') {
          expect([...ACTO1_FLOWS, ...ACTS_FLOWS, ...FINAL_FLOWS], r.flow).toContain(r.flow);
          expect(X.isPart2Beat(r.beat)).toBe(false);
          continue;
        }
        const b = BEAT_BY_ID.get(r.beat)!;
        const shown = (r.lines ?? b.lines.map((_, i) => i)).filter((i) => !isDirection(b.lines[i][0], b.lines[i][1]));
        expect(shown.length, key).toBeLessThanOrEqual(4);
      }
    // every `after` points at a key that some hook (or the awakening's cine) produces
    for (const refs of [...Object.values(S.P3_ON_NEW), ...Object.values(S.P3_ON_DONE)]) for (const r of refs) if (r.after) expect(keys.has(r.after) || r.after === 'b67_despierta', r.after).toBe(true);
    // a mission's ON_NEW waits longer than the ON_DONE parts of the mission before it
    let prevMax = 0;
    for (const id of ALL) {
      for (const r of S.P3_ON_NEW[id] ?? []) expect(r.delay ?? 0, id).toBeGreaterThan(prevMax);
      prevMax = Math.max(0, ...(S.P3_ON_DONE[id] ?? []).map((r) => r.delay ?? 0));
    }
    // the route's lines answer the battles of the contract
    expect(S.P3_WHEN.map((w) => w.flag)).toEqual(['won_p3d_borracha_2', 'won_p3d_borracha_4']);
  });
});

describe('A5 · the world, REGISTRO 000, Luzterna', () => {
  it('world states p3_* (band 130–159): the cold mark while Canelo is away, the tear from the awakening until H73', () => {
    const ws = (s: ReturnType<typeof save>) => W.currentWorldState(s).id;
    expect(ws(save([], [...P2_DONE]))).toBe('o4_epilogo');
    expect(ws(save(['H66'], [...P2_DONE]))).toBe('p3_marca_fria');
    expect(ws(save(['H67'], [...P2_DONE, 'H66']))).toBe('p3_marca_fria');
    // H67 done, the awakening not seen yet (it plays when you're home): still cold, no tear before the scene shows it
    expect(ws(save(['H68'], [...P2_DONE, 'H66', 'H67']))).toBe('p3_marca_fria');
    expect(ws(save(['H68'], [...P2_DONE, 'H66', 'H67'], ['b67_despierta']))).toBe('p3_rasgadura');
    expect(ws(save(['H69'], [...P2_DONE, 'H66', 'H67', 'H68']))).toBe('p3_rasgadura');
    expect(ws(save(['H74'], [...P2_DONE, 'H66', 'H67', 'H68', 'H73'], ['b67_despierta']))).not.toBe('p3_rasgadura');
    for (const st of W.worldStates().filter((d) => d.wave === 'P3')) {
      expect(st.priority, st.id).toBeGreaterThanOrEqual(130);
      expect(st.priority, st.id).toBeLessThanOrEqual(159);
      expect(st.id.startsWith('p3_')).toBe(true);
    }
    expect(W.worldStateById('p3_rasgadura')!.clock).toBe(true);
  });

  it('REGISTRO 000 says the same everywhere: observando → despertando (H65) → despierto (the awakening)', () => {
    expect(GW.registro000Estado(save(['H60'], P2_DONE.slice(0, 29)))).toBe('observando');
    expect(GW.registro000Estado(save(['H66'], P2_DONE))).toBe('despertando');
    expect(GW.registro000Estado(save(['H68'], [...P2_DONE, 'H66', 'H67']))).toBe('despertando');
    expect(GW.registro000Estado(save(['H68'], [...P2_DONE, 'H66', 'H67'], ['b67_despierta']))).toBe('despierto');
    expect(GW.registro000Estado(save([], [...P2_DONE, 'H66', 'H67', 'H68']))).toBe('despierto');
    const t = 'Especie: desconocida · Estado: observando.\n\nCuando te acercas, ya no está.';
    expect(GW.withRegistroEstado(t, save(['H60'], []))).toBe(t);
    expect(GW.withRegistroEstado(t, save([], [...P2_DONE, 'H66', 'H67', 'H68']))).toContain('Estado: despierto.');
  });

  it('the page: warm until H66 tells you it went cold; H66 waits for a tap there', () => {
    expect(GW.paginaTibia(save(['H64'], P2_DONE.slice(0, 33)))).toBe(false);
    expect(GW.paginaTibia(save([], P2_DONE))).toBe(true);
    expect(GW.paginaTibia(save(['H66'], P2_DONE))).toBe(true);
    expect(GW.paginaTibia(save(['H66'], P2_DONE, ['p3_tarjeta_H66']))).toBe(false);
    expect(GW.paginaTibia(save(['H67'], [...P2_DONE, 'H66']))).toBe(false);
    expect(GW.paginaLlama(save(['H66'], P2_DONE))).toBe(true);
    expect(GW.paginaLlama(save(['H67'], [...P2_DONE, 'H66']))).toBe(false);
    // the Parte II page stays as it was (rest) through the slice
    expect(PAGE.pageModeFor(save(['H66'], P2_DONE))).toBe('rest');
    expect(PAGE.pageModeFor(save(['H69'], [...P2_DONE, 'H66', 'H67', 'H68']))).toBe('rest');
  });

  it('luzternaFallecida is derived (SADIE started or H94 done: the v2 finale) and false in the whole slice; voiceFor: Luzterna until then', () => {
    // the night of H94 (H93 done, before the dawn): she is there, next to him
    for (const s of [save(['H66'], P2_DONE), save(['H69'], [...P2_DONE, 'H66', 'H67', 'H68']), save([], []), save(['H94'], [...P2_DONE, 'H93'], ['b94_noche', 'b94_amanecer'])]) {
      expect(GW.luzternaFallecida(s)).toBe(false);
      for (const surf of ['tip', 'mision_firma', 'faro', 'glosario', 'novedades'] as const) expect(GW.voiceFor(surf, s)).toMatchObject({ speaker: 'LUZTERNA', portrait: true });
    }
    // SADIE's first chord (its beat is persisted before it plays): gone, even with H94 still active
    expect(GW.luzternaFallecida(save(['H94'], [...P2_DONE, 'H93'], ['b94_sadie']))).toBe(true);
    const after = save(['H95'], [...P2_DONE, 'H93', 'H94']);
    expect(GW.luzternaFallecida(after)).toBe(true);
    expect(GW.voiceFor('tip', after)).toMatchObject({ speaker: 'BITÁCORA', portrait: false });
    expect(GW.voiceFor('mision_firma', after, { mission: 'H40' }).signature).toBe('— de la Bitácora de L.');
    expect(GW.voiceFor('mision_firma', after, { mission: 'H95' }).signature).toBe('— tu letra');
    expect(GW.voiceFor('faro', after).speaker).toBeNull();
  });

  it('the Bitácora: the cards met so far in order, «La última vez…» with the last CAMBIÓ lines after 8 h', () => {
    const s = save(['H69'], [...P2_DONE, 'H66', 'H67', 'H68']);
    expect(GW.bitacoraEntries(s).map((e) => [e.mission.id, e.done])).toEqual([
      ['H66', true],
      ['H67', true],
      ['H68', true],
      ['H69', false],
    ]);
    expect(GW.ultimaVez(s)).toEqual(['Se fue a olvidar. Y habla', 'REGISTRO 000 despertó y siguió a Canelo', 'La Carta de las Cajas existe; la Borracha está abierta']);
    expect(GW.ultimaVez(s, 2).length).toBe(2);
    expect(GW.ultimaVezDue(GW.ULTIMA_VEZ_MS, s)).toBe(true);
    expect(GW.ultimaVezDue(GW.ULTIMA_VEZ_MS - 1, s)).toBe(false);
    // nothing written yet (H66 just appeared, or a Part II save): never opens by itself
    expect(GW.ultimaVezDue(GW.ULTIMA_VEZ_MS * 3, save(['H66'], P2_DONE))).toBe(false);
    expect(GW.bitacoraEntries(save(['H60'], []))).toEqual([]);
  });
});

// ------------------------------------------------------------------ the scenes on your island (fake stage)
class Stage implements CineStage {
  constructor(readonly id: string) {}
  look: WorldLook = W.lookOf('normal');
  blocked() {
    return false;
  }
  alive() {
    return true;
  }
  resolve(t: unknown) {
    return typeof t === 'string' ? { x: 0, y: 0 } : (t as { x: number; y: number });
  }
  cameraGet() {
    return { x: 0, y: 0, zoom: 1 };
  }
  cameraSet() {}
  worldGet() {
    return { ...this.look };
  }
  worldSet(l: WorldLook) {
    this.look = l;
  }
  worldRelease() {}
  actor() {}
  fx() {
    return () => undefined;
  }
  interact() {
    return { done: new Promise<void>(() => undefined), cancel: () => undefined };
  }
  hud() {}
}
const flush = () => new Promise<void>((r) => setImmediate(r));
async function fold(s: CineScript, replay: boolean) {
  const persisted: string[] = [];
  const said: number[] = [];
  const r = new CineRunner(s, new Stage(s.stage), { persist: (b) => persisted.push(b), lines: (_b, idx) => (idx ?? []).map((i) => (said.push(i), ['LUZTERNA', '…'] as [string, string])), say: () => Promise.resolve() }, { replay });
  const p = r.play();
  r.skip();
  for (let i = 0; i < 60; i++) {
    r.tick(1 / 30);
    await flush();
  }
  return { res: await p, persisted, said };
}

describe('A6–A7 · the island scenes', () => {
  it('p3_pelo, p3_fria and p3_despierta are registered on the island; only the awakening is in VOLVER A VER', () => {
    for (const id of ['p3_pelo', 'p3_fria', 'p3_despierta']) expect(REG.getCine(id)?.stage, id).toBe('island');
    expect(REG.getCine('p3_despierta')!.replay).toMatchObject({ seen: 'b67_despierta', order: 67 });
    expect(REG.getCine('p3_pelo')!.replay).toBeUndefined();
    expect(REG.getCine('p3_fria')!.replay).toBeUndefined();
  });

  it('p3_despierta (even skipped) says its three lines and persists b67_despierta; a replay persists nothing', async () => {
    loadEnv(envOf('h65-normal'));
    const a = await fold(REG.getCine('p3_despierta')!, false);
    expect(a.res).toBe('skipped');
    expect(a.persisted).toEqual(['b67_despierta']);
    // every line of the beat is said by one of its steps (statically: a skip folds the dialog away)
    const said = REG.getCine('p3_despierta')!.steps.flatMap((st) => ('say' in st && st.say.beat === 'b67_despierta' ? (st.say.lines ?? []) : []));
    expect([...said].sort()).toEqual([0, 1, 2]);
    const b = await fold(REG.getCine('p3_despierta')!, true);
    expect(b.persisted).toEqual([]);
  });
});

describe('A10 · fixture h65-normal + save safety', () => {
  it('h65-normal: the Parte II just finished, ~17 M/s, H66 appears by itself on load', () => {
    const env = envOf('h65-normal');
    expect(env.state.missions.done).toContain('H65');
    expect(env.state.missions.active.filter(L.isAfterPart2Mission)).toEqual([]);
    loadEnv(clone(env));
    checkMissions();
    expect(G.s.missions.active).toContain('H66');
    G.recalc();
    expect(G.goldPerSec).toBeGreaterThan(10e6);
    expect(G.goldPerSec).toBeLessThan(30e6);
    expect(W.currentWorldState(G.s).id).toBe('p3_marca_fria');
    expect(GW.paginaTibia(G.s)).toBe(true);
    expect(GW.registro000Estado(G.s)).toBe('despertando');
    expect(X.applyRupturasReset({ backup: false })).not.toBe('reiniciado');
  });

  /** what a save OWNS (never lost, never changed by loading with Parte III in the content) */
  const owned = (s: Record<string, unknown> & { missions: { done: string[] }; flags: Record<string, boolean>; beatsSeen: string[] }) => ({
    cats: s.cats,
    res: ['gold', 'food', 'gems', 'purr', 'prisma', 'scrap', 'blueprint', 'kl'].map((k) => s[k]),
    crystals: s.crystals,
    orbs: s.orbs,
    catdex: s.catdex,
    elements: s.elements,
    habitats: s.habitats,
    expansions: s.expansions,
    decor: s.decor,
    accessories: s.accessories,
    gear: s.gear,
  });
  it('a veteran Parte II save and Part I saves load with nothing lost or changed (only H66 appears where the story says)', () => {
    for (const f of ['h65-normal', 'rupturas-o4', 'post-story', 'late-game', 'post-finale']) {
      const env = envOf(f);
      // the same save loaded twice (through every migration / normalize / patch): the second load is the reference
      loadEnv(clone(env));
      const once = clone(G.s) as unknown as Parameters<typeof owned>[0];
      G.save();
      loadEnv(JSON.parse(mem.get(SAVE_KEY)!));
      const twice = clone(G.s) as unknown as Parameters<typeof owned>[0];
      expect(owned(twice), `${f}: a reload changes nothing it owns`).toEqual(owned(once));
      // against the file itself: every mission done, beat seen and flag set is still there
      const raw = env.state as { missions: { done: string[] }; beatsSeen: string[]; flags: Record<string, boolean>; cats: { uid: string; level: number; stars: number }[] };
      for (const id of raw.missions.done) expect(G.s.missions.done, `${f}: ${id}`).toContain(id);
      for (const b of raw.beatsSeen) expect(G.s.beatsSeen, `${f}: ${b}`).toContain(b);
      for (const [k, v] of Object.entries(raw.flags)) if (v) expect(G.has(k), `${f}: flag ${k}`).toBe(true);
      expect(G.s.cats.map((c) => [c.uid, c.level, c.stars]), f).toEqual(raw.cats.map((c) => [c.uid, c.level, c.stars]));
      // Parte III's code only READS the save: asking it everything changes nothing
      const before = JSON.stringify(G.s);
      GW.registro000Estado();
      GW.paginaTibia();
      GW.luzternaFallecida();
      GW.voiceFor('tip');
      GW.bitacoraEntries();
      GW.ultimaVezDue(GW.ULTIMA_VEZ_MS * 2);
      W.currentWorldState(G.s);
      PAGE.pageModeFor(G.s);
      expect(JSON.stringify(G.s), `${f}: read-only`).toBe(before);
      // only where the story says: H66 appears right after H65, never before
      checkMissions();
      const p3 = [...G.s.missions.active, ...G.s.missions.done].filter(L.isAfterPart2Mission);
      expect(p3, f).toEqual(raw.missions.done.includes('H65') ? ['H66'] : []);
      expect(G.s.beatsSeen.filter((b) => /^(b6[6-9]_|p3_)/.test(b)), f).toEqual([]);
      if (!raw.missions.done.includes('H65')) expect(W.currentWorldState(G.s).id.startsWith('p3_'), f).toBe(false);
      // the Part II narrative reset never comes back on its own
      expect(patchNotes.some((n) => n === X.RESET_NOTE), f).toBe(false);
    }
  });

  it('a Parte III mission pays like any story mission (once), never through the Part II ledger', () => {
    loadEnv(envOf('h65-normal'));
    checkMissions();
    expect(G.s.missions.active).toContain('H66');
    const ledger = JSON.stringify((G.s.ext?.rupturas as { claimed?: unknown } | undefined)?.claimed ?? {});
    const gems = G.s.gems;
    G.count('feature_p3_bar');
    checkMissions();
    expect(G.s.missions.done).toContain('H66');
    expect(G.s.missions.active).toContain('H67');
    expect(G.s.gems).toBeGreaterThanOrEqual(gems + 5);
    expect(JSON.stringify((G.s.ext?.rupturas as { claimed?: unknown } | undefined)?.claimed ?? {})).toBe(ledger);
  });
});
