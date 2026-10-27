/**
 * PARTE III · EL FINAL «Se apaga» (H93–H97) — the story flows at home and at the bar. ⚠️ SPOILERS: her death.
 * Texts: NARRATIVA (docs/part-iii/historia-v2/guiones/final/), literal, in data/gateras/historia.json (b93_…–b97_…).
 * Films: CINE (game/src/film/films/final): F32 f32_caida · F33 f33_noche · F34 f34_amanecer + f34_golpe · F35 f35_sadie ·
 * F37 f37_mano · F38 f38_vigilia · F39 f39_recado · F40 f40_ronda; F31 and F36 by prefix (`f31`, `f36`) until they land.
 * A film that isn't registered plays its lines (and the small playable pieces of ui/story/finalUi.ts).
 *
 * The director (app/story.ts, `special: 'flow'`) plays each flow when it's calm at home (H97: on the Carta). Every
 * substep is persisted as a beat (final/00-indice §4): a reload resumes at the next one, never replays.
 *
 *   h93_asedio     F31 → «El asedio» 1/2 (Cruceta) and 2/2 (Firma), loseable and retried at no cost → the win shows NO
 *                  victory screen: F32 «La caída» → feature_p3_asedio (H93 done; CAMBIÓ «SIN LLAMA.», trembling)
 *   h94_sin_llama  F33 (no clock; the faro) → F34 (1/3): Cerito and her beam together (pasada 7: a pane of the lantern
 *                  goes black, «Me debes un vidrio, gordo.»), the flame at 30 % for good (ext.fin.llama) → the optional
 *                  breakfast (R8) → F34 (2/2): the blow → SADIE (its beat persisted at the first chord: never twice; from
 *                  here she is gone and the mourning starts) → «A oscuras» (3 turns, no defeat, «MIRA»; or only «MIRA»
 *                  when F36 exists) → F36 → feature_p3_sin_llama
 *   h95_vigilia    F37 «La Mano» (the lantern left on the step) → F38 «La vigilia» → feature_p3_vigilia
 *   h96_recado     F39: DÍSELO (the Part I errand, delivered), the orange faro, credits, «Continuará» (the mourning
 *                  ends) → feature_p3_recado. «Lo que quedó» waits in the Bitácora (panels/Bitacora.ts)
 *   h97_bar        the next time the Carta opens: F40 «La última ronda» → feature_p3_ultima_ronda
 *
 * Honesty (00-indice §2.5): no goal or line says «protégela», «sálvala», «aguanta» or «antes de que sea tarde».
 */
import { G } from '../state/game';
import { beatSeen, markBeat } from '../state/ext/story';
import { FLOW_KIT, type FlowResult } from './acto1Flow';
import { filmSeen, filmSeenKey, playStoryFilm, resolveStoryFilm } from './stageIntro';
import { markSeenG } from '../state/sys/gateras';
import { asMemory } from '../ui/story/ghost';
import { cardKey } from '../ui/story/gaterasScript';
import { LLAMA_DESPUES, setFaroNaranja, setLinterna, setLlama } from '../state/sys/finalState';
import type { FinalBattleId } from '../state/sys/finalBattles';
import { DEUDA_FALSA } from '../film/films/final/deuda';

const { lines, talk, step, film } = FLOW_KIT;

/** knobs (tests set them) */
export const FINAL_TIMING = { laterMs: 60_000 };
/** 'auto': «A oscuras» is only the «MIRA» input when F36 is registered, else the 3-turn battle */
export const FINAL_OPTS = { oscuras: 'auto' as 'auto' | 'batalla' | 'mira' };

/**
 * the line indexes each step reads (historia.json). b94_amanecer follows the pasada 7 switch (film/films/final/deuda.ts):
 * with the false debt the return is two sparks, her beam, the black pane and «Me debes un vidrio, gordo.»; without it,
 * the measured control (one spark that catches) — the relief and the blow are the same lines
 */
export const FINAL_LINES = {
  b94_noche: { escena: [0, 1, 2, 3, 4, 5], faro: [6] },
  b94_amanecer: DEUDA_FALSA ? { regreso: [0, 1, 2, 3, 4, 5, 6, 7, 8], golpe: [9, 10, 11, 12, 13], trazo: [11, 12, 13] } : { regreso: [14, 2, 5, 6, 7, 8], golpe: [9, 10, 11, 12, 13], trazo: [11, 12, 13] },
  b96_recado: { nota: 0, aviso: 1, gris: 2, diselo: [3, 4] },
} as const;

/** the substeps, in story order (tests and the fixture read them) */
export const FINAL_BEATS = {
  H93: ['b93_pp', 'b93_asedio1', 'b93_asedio2', 'b93_asedio', 'b93_caida'],
  H94: ['b94_noche', 'b94_amanecer', 'b94_desayuno', 'b94_golpe', 'b94_trazo', 'b94_sadie', 'b94_oscuras', 'b94_ojos'],
  H95: ['b95_mano', 'b95_vigilia'],
  H96: ['b96_recado', 'b96_luz', 'b96_creditos', 'b96_continuara'],
  H97: ['b97_bar'],
} as const;

/** the music goes (the night, the mourning: «Música: ninguna»); the next scene brings its own */
async function silence(fade = 1.2) {
  try {
    (await import('../audio/api')).audioApi.release(fade);
  } catch {
    /* silence never breaks */
  }
}
async function goHome() {
  const { goIsland } = await import('./flow');
  await goIsland();
}

/** a finale battle, start to end ('won' after a quiet win: the scene stays for the film over it; 'lost': normal end) */
export type BattlePort = (id: FinalBattleId) => Promise<'won' | 'lost'>;
let battlePort: BattlePort | null = null;
/** tests: replace the battle (null = the real BattleScene) */
export function setFinalBattlePort(p: BattlePort | null) {
  battlePort = p;
}
async function battle(id: FinalBattleId): Promise<'won' | 'lost'> {
  if (battlePort) return battlePort(id);
  const [{ BattleScene }, FB, ship, { scenes }, { music }] = await Promise.all([import('../scenes/BattleScene'), import('../state/sys/finalBattles'), import('../state/sys/ship'), import('../core/scenes'), import('../core/music')]);
  if (!ship.crew().length) ship.autoCrew();
  return new Promise<'won' | 'lost'>((resolve) => {
    const spec = FB.buildFinalBattle(id, (r) => resolve(r.won ? 'won' : 'lost'));
    // the siege has its storm; «A oscuras» has none (a heartbeat at most: no music)
    if (id === 'oscuras') void silence(0.6);
    else music.play('battle');
    void scenes.go(new BattleScene(spec), 'blocks');
  });
}

/** after a lost siege fight: again now, or later (nothing says «hurry»; losing costs nothing) */
let laterAt = -Infinity;
async function retry(): Promise<'go' | 'later'> {
  const { choicePrompt } = await import('../ui/story/profile');
  const { storyLayer } = await import('../ui/dialog');
  const { C } = await import('../ui/theme');
  return choicePrompt<'go' | 'later'>(storyLayer(), {
    title1: 'EL',
    title2: 'ASEDIO',
    sub: 'Los barcos siguen ahí. Perder no cuesta nada: se vuelve a intentar.',
    tag: 'TU ISLA',
    options: [
      { label: '¡OTRA VEZ!', value: 'go', color: C.yellow },
      { label: 'AHORA NO', value: 'later', color: C.paper },
    ],
  });
}

// ------------------------------------------------------------------ H93 · La noche más oscura
async function h93(): Promise<FlowResult> {
  if (performance.now() - laterAt < FINAL_TIMING.laterMs) return 'interrupted';
  if (!(await film('b93_pp', 'f31', 'b93_pp'))) return 'interrupted';
  for (const id of ['asedio1', 'asedio2'] as const) {
    const key = `b93_${id}`;
    if (beatSeen(key)) continue;
    for (;;) {
      if ((await battle(id)) === 'won') {
        markBeat(key);
        G.save();
        break;
      }
      await goHome();
      if ((await retry()) === 'later') {
        laterAt = performance.now();
        return 'interrupted';
      }
    }
  }
  if (!beatSeen('b93_asedio')) {
    markBeat('b93_asedio');
    G.save();
  }
  // F32 instead of the victory screen: the music thins out and cuts when his flame goes out
  const ok = await step('b93_caida', async () => {
    await silence(2);
    const r = await playStoryFilm('f32_caida', () => talk(lines('b93_caida')));
    if (r === 'interrupted') return 'interrupted';
    // the film ends on the Bitácora's card (K11): the director doesn't show it a second time
    if (r === 'film') markBeat(cardKey('H93', 'done'));
  });
  if (!ok) return 'interrupted';
  await goHome();
  if (!G.s.counters.feature_p3_asedio) G.count('feature_p3_asedio');
  G.save();
  return 'done';
}

// ------------------------------------------------------------------ H94 · Sin llama
async function h94(): Promise<FlowResult> {
  const L = FINAL_LINES.b94_noche;
  // F33: the night without him (no music, no clock); its fallback: the lines, then the faro to tap
  const noche = await step('b94_noche', async () => {
    await silence(2);
    const r = await playStoryFilm('f33_noche', async () => {
      await talk(lines('b94_noche', L.escena));
      await talk(lines('b94_noche', L.faro));
      const { onePress } = await import('../ui/story/finalUi');
      await onePress('Toca el faro', { dim: 0.2 });
    });
    return r === 'interrupted' ? 'interrupted' : undefined;
  });
  if (!noche) return 'interrupted';
  // F34 (1/2): Cerito gives his flame back — small, 30 % for good (Q8)
  const A = FINAL_LINES.b94_amanecer;
  const amanecer = await step('b94_amanecer', async () => {
    const r = await playStoryFilm('f34_amanecer', () => talk(lines('b94_amanecer', A.regreso)));
    if (r === 'interrupted') return 'interrupted';
    setLlama(LLAMA_DESPUES);
  });
  if (!amanecer) return 'interrupted';
  // R8: the optional breakfast — the blow comes in the middle of it
  const desayuno = await step('b94_desayuno', async () => {
    const { desayuno: play } = await import('../ui/story/finalUi');
    const { crew } = await import('../state/sys/ship');
    const { catSlug } = await import('../state/sys/forms');
    const own = [...crew()].map((u) => G.s.cats.find((c) => c.uid === u)).filter((c): c is NonNullable<typeof c> => !!c);
    const table = own.length ? own : G.s.cats.slice(0, 4);
    await play(table.map((c) => ({ species: c.species, slug: catSlug(c), name: c.name })));
  });
  if (!desayuno) return 'interrupted';
  // F34 (2/2): the blow (no cut: SADIE's first chord)
  if (!(await film('b94_golpe', 'f34_golpe', 'b94_amanecer', A.golpe))) return 'interrupted';
  // F34 (3/3): the stroke — «…Entonces la luz primero.», «te mato—», «…Ah.» (CINE split it off F34 2/3, whose music
  // stops dry at A8). QA-P3: it was never played. Only before SADIE (an old save past SADIE never sees it after); its
  // fallback lines only when F34 (2/3) was a film (else golpe's fallback already said them)
  if (!beatSeen('b94_sadie') && !beatSeen('b94_trazo')) {
    const golpeFilm = !!(await resolveStoryFilm('f34_golpe'));
    if (!(await film('b94_trazo', 'f34_trazo', 'b94_amanecer', golpeFilm ? A.trazo : []))) return 'interrupted';
  }
  // SADIE: persisted BEFORE it plays — it never plays twice, and from here on she is gone (the mourning starts)
  if (!beatSeen('b94_sadie')) {
    // (QA-P3) listed in «Volver a ver» in the same save: a tab closed during its loading screen or mid-song never
    // replays it, but the song is not lost — the first view still can't be skipped (seen: false)
    const first = !filmSeen('f35_sadie');
    const reg = await resolveStoryFilm('f35_sadie');
    markBeat('b94_sadie');
    if (reg) markSeenG(filmSeenKey(reg));
    G.save();
    await asMemory(() => playStoryFilm('f35_sadie', () => talk(lines('b94_sadie')), undefined, { seen: !first }));
  }
  // «A oscuras»: 3 turns, no defeat, «MIRA» over Canelo — or only «MIRA» when F36 exists
  const oscuras = await step('b94_oscuras', async () => {
    const f36 = await resolveStoryFilm('f36');
    const mode = FINAL_OPTS.oscuras === 'auto' ? (f36 ? 'mira' : 'batalla') : FINAL_OPTS.oscuras;
    if (mode === 'mira') {
      const { oscurasMira } = await import('../ui/story/finalUi');
      await oscurasMira(G.s.cats.length);
      return;
    }
    // it can't be lost (rules.undying); a loss here would be a bug: the phase is retried, never the night
    if ((await battle('oscuras')) !== 'won') return 'interrupted';
  });
  if (!oscuras) return 'interrupted';
  if (!(await film('b94_ojos', 'f36', 'b94_ojos'))) return 'interrupted';
  await goHome();
  if (!G.s.counters.feature_p3_sin_llama) G.count('feature_p3_sin_llama');
  G.save();
  return 'done';
}

// ------------------------------------------------------------------ H95 · Lo que no se ve
async function h95(): Promise<FlowResult> {
  const mano = await step('b95_mano', async () => {
    await silence(1.5);
    const r = await playStoryFilm('f37_mano', () => talk(lines('b95_mano')));
    if (r === 'interrupted') return 'interrupted';
    // La Mano leaves the broken lantern on the faro's step (P8)
    setLinterna('escalon');
  });
  if (!mano) return 'interrupted';
  const vigilia = await step('b95_vigilia', async () => {
    const r = await playStoryFilm('f38_vigilia', async () => {
      await talk(lines('b95_vigilia'));
      const { onePress } = await import('../ui/story/finalUi');
      await onePress('Seguir', { dim: 0.15 });
    });
    return r === 'interrupted' ? 'interrupted' : undefined;
  });
  if (!vigilia) return 'interrupted';
  if (!G.s.counters.feature_p3_vigilia) G.count('feature_p3_vigilia');
  G.save();
  return 'done';
}

// ------------------------------------------------------------------ H96 · El recado
const LAST_STEPS = ['b96_recado', 'b96_luz', 'b96_creditos', 'b96_continuara'] as const;
async function h96(): Promise<FlowResult> {
  // F39 holds it all (DÍSELO is its gate, then the orange faro, the credits and «Continuará»)
  if (!LAST_STEPS.every((k) => beatSeen(k)) && (await resolveStoryFilm('f39_recado')) && !LAST_STEPS.some((k) => beatSeen(k))) {
    const r = await playStoryFilm('f39_recado', async () => undefined);
    if (r === 'interrupted') return 'interrupted';
    if (r === 'film') {
      setLinterna('estante');
      setFaroNaranja();
      // the credits and «Continuará» are F39's other two films (CINE split it in three): their own steps below
      for (const k of ['b96_recado', 'b96_luz']) markBeat(k);
      G.save();
    }
  }
  // without the film: the Part I note and DÍSELO, the faro, the credits, «Continuará»
  const R = FINAL_LINES.b96_recado;
  const recado = await step('b96_recado', async () => {
    // storyLines already says the player's name ({name}, ui/gender.ts)
    const ls = await lines('b96_recado');
    const at = (i: number) => ls[i]?.[1] ?? '';
    const { diselo } = await import('../ui/story/finalUi');
    await diselo(at(R.nota), at(R.aviso), at(R.gris));
    await talk(lines('b96_recado', R.diselo));
  });
  if (!recado) return 'interrupted';
  const luz = await step('b96_luz', async () => {
    setLinterna('estante');
    await talk(lines('b96_luz'));
    setFaroNaranja();
  });
  if (!luz) return 'interrupted';
  // the credits (F39 2/3, over her Carta with «Antes de la luz») and «Continuará.» (F39 3/3, in silence) — QA-P3:
  // they were marked seen after F39 1/3 and never played; their lines stay the fallback
  if (!(await film('b96_creditos', 'f39_creditos', 'b96_creditos'))) return 'interrupted';
  // «Continuará.»: the mourning ends here (gaterasWorld.dueloActivo)
  if (!(await film('b96_continuara', 'f39_continuara', 'b96_continuara'))) return 'interrupted';
  if (!G.s.counters.feature_p3_recado) G.count('feature_p3_recado');
  G.save();
  return 'done';
}

// ------------------------------------------------------------------ H97 · La última ronda (on the Carta)
async function h97(): Promise<FlowResult> {
  const bar = await step('b97_bar', async () => {
    await silence(1.5);
    const r = await playStoryFilm('f40_ronda', () => talk(lines('b97_bar')));
    return r === 'interrupted' ? 'interrupted' : undefined;
  });
  if (!bar) return 'interrupted';
  if (!G.s.counters.feature_p3_ultima_ronda) G.count('feature_p3_ultima_ronda');
  G.save();
  return 'done';
}

const FLOWS: Record<string, () => Promise<FlowResult>> = {
  h93_asedio: h93,
  h94_sin_llama: h94,
  h95_vigilia: h95,
  h96_recado: h96,
  h97_bar: h97,
};
export const FINAL_FLOWS = Object.keys(FLOWS);
/** the director's entry for the finale's flows (unknown ids are done: never a deadlock) */
export async function playStoryFlow(id: string): Promise<FlowResult> {
  const f = FLOWS[id];
  if (!f) {
    console.warn('[final] flujo desconocido', id);
    return 'done';
  }
  return f();
}
