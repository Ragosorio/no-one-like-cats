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
import { filmSeen, filmSeenKey, playStoryFilm, preloadStoryFilm, releaseStoryHold, resolveStoryFilm, storyHolding, dropStoryPreloads, type FilmHandOff } from './stageIntro';
import { audioApi } from '../audio/api';
import { markSeenG } from '../state/sys/gateras';
import { asMemory } from '../ui/story/ghost';
import { cardKey } from '../ui/story/gaterasScript';
import { LLAMA_DESPUES, setFaroNaranja, setLinterna, setLlama } from '../state/sys/finalState';
import type { FinalBattleId } from '../state/sys/finalBattles';
import { DEUDA_FALSA } from '../film/films/final/deuda';

const { lines, talk, step } = FLOW_KIT;

/** knobs (tests set them) */
export const FINAL_TIMING = {
  laterMs: 60_000,
  /** (agent FINAL) the silence between two finale flows lets go by itself after this long (the next flow re-takes it) */
  lingerMs: 45_000,
  /** (agent FINAL) after «Continuará»: how long the island stays silent before its music comes back */
  afterMs: 9_000,
};
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

// ------------------------------------------------------------------ (agent FINAL) one take, the right music
/**
 * The owner, after playing the finale live: «por las canciones… se pierden la gracia de las escenas… muchas pantallas
 * de carga… se pierde esa sensación de "puta murió"». Measured (docs/part-iii/agentes/FINAL.md): the island's song
 * (YONOSE TODO · ambient) played under every film written for silence (the night, the stroke, MIRA, La Mano, the
 * errand, «Continuará»), the Part I chiptune played the siege and on under «La caída», and 12 loading screens + 4 comic
 * wipes cut the films apart. Now:
 *  - QUIET: from «La caída» to «Continuará» the game's own music is held silent (audioApi.quiet); only the films'
 *    songs sound. Between two finale flows the silence lingers (the next card, the next flow) and lets go by itself.
 *  - the siege plays «Ojo del huracán» (fut.jefe, the piece F31 presents grave), the same take across both fights;
 *    F32 carries it, thinner and quieter, and cuts it dead when the flame goes out (FilmDef.carry).
 *  - the next film is warmed while the current one plays (preloadStoryFilm) and a film's last frame is held until the
 *    next one is up (`hold`): no loading screen, no island flashing between them, no comic wipe.
 */
const QUIET = 'final';
let linger: ReturnType<typeof setTimeout> | null = null;
function stopLinger() {
  if (linger) clearTimeout(linger);
  linger = null;
}
/** the game's own music goes quiet (the films' songs still play) */
function quietOn(fade = 1.2) {
  stopLinger();
  audioApi.quiet(true, { key: QUIET, fade });
}
/** a flow begins: whatever cue the screen left (the Carta's song) goes, and the game's own music goes quiet */
function hushAll(fade = 1.5) {
  audioApi.release(fade);
  quietOn(fade);
}
function quietOff(fade = 3) {
  stopLinger();
  audioApi.quiet(false, { key: QUIET, fade });
}
/** between two finale flows the silence stays (the next card, the next flow re-takes it); it lets go by itself */
function lingerQuiet(ms = FINAL_TIMING.lingerMs, fade = 3) {
  stopLinger();
  linger = setTimeout(() => quietOff(fade), ms);
  (linger as { unref?: () => void }).unref?.();
}
/** warm a story film ahead: it then starts on the cut (no loading screen); `after` lets the film on screen settle */
function warmFilm(id: string, after = 0, seen?: boolean) {
  void preloadStoryFilm(id, { after, seen });
}
/** a story film as a substep, handing over to what follows */
function filmStep(key: string, id: string, beat: string, idx?: readonly number[], h: FilmHandOff = {}) {
  return step(key, async () => {
    const r = await playStoryFilm(id, () => talk(lines(beat, idx)), undefined, h);
    return r === 'interrupted' ? 'interrupted' : undefined;
  });
}
const inBrowser = () => typeof document !== 'undefined';
async function goHome() {
  const { goIsland } = await import('./flow');
  await goIsland();
}
/**
 * Home after a film: its held last frame is the cover — the island is built under it and the frame fades (no comic
 * wipe, no island song: the quiet holds it). Already home: the frame just fades. Without a held frame: the old way.
 */
async function homeFromFilm(fade = 1.2) {
  if (!inBrowser() || !(await storyHolding())) {
    if (inBrowser()) {
      const [{ scenes }, { IslandScene }] = await Promise.all([import('../core/scenes'), import('../scenes/IslandScene')]);
      if (scenes.current instanceof IslandScene) return;
    }
    await goHome();
    return;
  }
  const [{ scenes }, { IslandScene }] = await Promise.all([import('../core/scenes'), import('../scenes/IslandScene')]);
  if (!(scenes.current instanceof IslandScene)) {
    const next = new IslandScene();
    await scenes.go(next, 'none');
    if (next.coverUntil) await Promise.race([next.coverUntil.catch(() => undefined), new Promise((r) => setTimeout(r, 1500))]);
  }
  await releaseStoryHold(fade);
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
  const [{ BattleScene }, FB, ship, { scenes }] = await Promise.all([import('../scenes/BattleScene'), import('../state/sys/finalBattles'), import('../state/sys/ship'), import('../core/scenes')]);
  if (!ship.crew().length) ship.autoCrew();
  return new Promise<'won' | 'lost'>((resolve) => {
    const spec = FB.buildFinalBattle(id, (r) => resolve(r.won ? 'won' : 'lost'));
    // «A oscuras» has no music (a heartbeat at most); the siege plays «Ojo del huracán» (director.json battle:p3_final),
    // ONE take across both fights (the same state: no restart), never the Part I chiptune
    if (id === 'oscuras') quietOn(0.6);
    else {
      quietOff(0.9);
      audioApi.setState('battle', { context: 'p3_final', fade: 0.9 });
    }
    const sc = new BattleScene(spec);
    void (async () => {
      if (await storyHolding()) {
        // F31's last frame covers the cut: the battle is built under it, then the frame fades
        await scenes.go(sc, 'none');
        if (sc.coverUntil) await Promise.race([sc.coverUntil.catch(() => undefined), new Promise((r) => setTimeout(r, 1500))]);
        await releaseStoryHold(0.7);
      } else await scenes.go(sc, scenes.current instanceof BattleScene ? 'black' : 'blocks');
      // «La caída» warms while the last fight plays (the win cuts straight to it)
      if (id === 'asedio2' && !beatSeen('b93_caida')) warmFilm('f32_caida', 4000);
    })();
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
/** the siege's music, decoded ahead: it starts on F31's last frame and F32 crosses to the grave mix on time */
let siegePrepared = false;
function prepareSiege(on: boolean) {
  if (on === siegePrepared) return;
  siegePrepared = on;
  for (const t of ['fut.jefe', 'fut.jefe.grave']) {
    if (on) void audioApi.prepare(t);
    else audioApi.unprepare(t);
  }
}
async function h93(): Promise<FlowResult> {
  if (performance.now() - laterAt < FINAL_TIMING.laterMs) return 'interrupted';
  prepareSiege(true);
  try {
    return await h93Siege();
  } finally {
    // (a deck playing it keeps its own copy of the decoded song)
    prepareSiege(false);
  }
}
async function h93Siege(): Promise<FlowResult> {
  // F31's song hands over to the siege's (the same piece, whole) and its last frame covers the cut to the battle
  if (!(await filmStep('b93_pp', 'f31', 'b93_pp', undefined, { hold: true, next: () => audioApi.setState('battle', { context: 'p3_final', fade: 0.9 }) }))) return 'interrupted';
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
        void dropStoryPreloads('f32_caida');
        return 'interrupted';
      }
    }
  }
  if (!beatSeen('b93_asedio')) {
    markBeat('b93_asedio');
    G.save();
  }
  // F32 instead of the victory screen: it CARRIES the siege's music — thinner, quieter — and cuts it dead when his
  // flame goes out (K6, FilmDef.carry); from there on the quiet holds (the night of H94 has no music either)
  const ok = await step('b93_caida', async () => {
    if (!beatSeen('b94_noche')) warmFilm('f33_noche', 6000);
    // (P3-CINE) the win cuts straight to it (cut: no transformation of the battle first; it was warmed during the fight)
    const r = await playStoryFilm('f32_caida', () => talk(lines('b93_caida')), undefined, { hold: true, cut: true, next: () => quietOn(0.05) });
    if (r === 'interrupted') return 'interrupted';
    quietOn(1.5);
    // the film ends on the Bitácora's card (K11): the director doesn't show it a second time
    if (r === 'film') markBeat(cardKey('H93', 'done'));
  });
  if (!ok) return 'interrupted';
  await homeFromFilm(1.2);
  if (!G.s.counters.feature_p3_asedio) G.count('feature_p3_asedio');
  G.save();
  lingerQuiet();
  return 'done';
}

// ------------------------------------------------------------------ H94 · Sin llama
async function h94(): Promise<FlowResult> {
  // «Música: ninguna»: the night, the stroke, «A oscuras», MIRA — only the films' songs sound (the theme, SADIE)
  hushAll(2);
  const L = FINAL_LINES.b94_noche;
  // F33: the night without him (no music, no clock); its fallback: the lines, then the faro to tap. The dawn warms
  // meanwhile and the night's last frame (black) holds until it is up
  const noche = await step('b94_noche', async () => {
    if (!beatSeen('b94_amanecer')) warmFilm('f34_amanecer', 8000);
    const r = await playStoryFilm('f33_noche', async () => {
      await talk(lines('b94_noche', L.escena));
      await talk(lines('b94_noche', L.faro));
      const { onePress } = await import('../ui/story/finalUi');
      await onePress('Toca el faro', { dim: 0.2 });
    }, undefined, { hold: true });
    return r === 'interrupted' ? 'interrupted' : undefined;
  });
  if (!noche) return 'interrupted';
  // F34 (1/2): Cerito gives his flame back — small, 30 % for good (Q8)
  const A = FINAL_LINES.b94_amanecer;
  // (its song, Canelo's theme, goes on after it: FilmDef.keep — the breakfast and the blow ride it; the blow and the
  // stroke warm meanwhile)
  const amanecer = await step('b94_amanecer', async () => {
    if (!beatSeen('b94_golpe')) warmFilm('f34_golpe', 8000);
    if (!beatSeen('b94_trazo') && !beatSeen('b94_sadie')) warmFilm('f34_trazo', 16000);
    const r = await playStoryFilm('f34_amanecer', () => talk(lines('b94_amanecer', A.regreso)), undefined, { keep: true });
    if (r === 'interrupted') return 'interrupted';
    setLlama(LLAMA_DESPUES);
  });
  if (!amanecer) return 'interrupted';
  // R8: the optional breakfast — the blow comes in the middle of it
  const desayuno = await step('b94_desayuno', async () => {
    // SADIE warms during the breakfast (its song decoded too): the blow, the stroke and SADIE then run on the cut.
    // Its skip rule is the one it will play with (seen = watched before, from «Volver a ver»)
    if (!beatSeen('b94_sadie')) warmFilm('f35_sadie', 500, filmSeen('f35_sadie'));
    const { desayuno: play } = await import('../ui/story/finalUi');
    const { crew } = await import('../state/sys/ship');
    const { catSlug } = await import('../state/sys/forms');
    const own = [...crew()].map((u) => G.s.cats.find((c) => c.uid === u)).filter((c): c is NonNullable<typeof c> => !!c);
    const table = own.length ? own : G.s.cats.slice(0, 4);
    // Canelo's theme goes on under the breakfast, «en bucle suave»
    audioApi.duck(true, 5, 'final-desayuno');
    try {
      await play(table.map((c) => ({ species: c.species, slug: catSlug(c), name: c.name })));
    } finally {
      audioApi.duck(false, 0, 'final-desayuno');
    }
  });
  if (!desayuno) return 'interrupted';
  // F34 (2/2): the blow — it rides the theme that is still playing (FilmDef.join: no restart), quieter, and cuts it
  // dry at its end; its last frame holds until the stroke is up (no loading screen: the death runs on the cut)
  // (P3-CINE) a hard cut into the blow: no transformation of the world first (film/morph.ts) — it comes in the middle
  if (!(await filmStep('b94_golpe', 'f34_golpe', 'b94_amanecer', A.golpe, { hold: true, cut: true }))) return 'interrupted';
  // F34 (3/3): the stroke — «…Entonces la luz primero.», «te mato—», «…Ah.» (CINE split it off F34 2/3, whose music
  // stops dry at A8). QA-P3: it was never played. Only before SADIE (an old save past SADIE never sees it after); its
  // fallback lines only when F34 (2/3) was a film (else golpe's fallback already said them)
  if (!beatSeen('b94_sadie') && !beatSeen('b94_trazo')) {
    const golpeFilm = !!(await resolveStoryFilm('f34_golpe'));
    if (!(await filmStep('b94_trazo', 'f34_trazo', 'b94_amanecer', golpeFilm ? A.trazo : [], { hold: true }))) return 'interrupted';
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
    await asMemory(() => playStoryFilm('f35_sadie', () => talk(lines('b94_sadie')), undefined, { seen: !first, hold: true }));
  }
  // «A oscuras»: 3 turns, no defeat, «MIRA» over Canelo — or only «MIRA» when F36 exists
  const oscuras = await step('b94_oscuras', async () => {
    const f36 = await resolveStoryFilm('f36');
    const mode = FINAL_OPTS.oscuras === 'auto' ? (f36 ? 'mira' : 'batalla') : FINAL_OPTS.oscuras;
    // MIRA warms in the dark (SADIE's dry cut is black, «A oscuras» is black: the wait has no loading screen)
    if (f36 && !beatSeen('b94_ojos')) warmFilm('f36');
    if (mode === 'mira') {
      // (the dark goes up in the same frame SADIE's black is let go: the island never shows in between)
      const { oscurasMira } = await import('../ui/story/finalUi');
      await releaseStoryHold(0);
      await oscurasMira(G.s.cats.length);
      return;
    }
    // it can't be lost (rules.undying); a loss here would be a bug: the phase is retried, never the night
    if ((await battle('oscuras')) !== 'won') return 'interrupted';
  });
  if (!oscuras) return 'interrupted';
  if (!beatSeen('b95_mano')) warmFilm('f37_mano', 6000);
  if (!(await filmStep('b94_ojos', 'f36', 'b94_ojos', undefined, { hold: true, bare: true }))) return 'interrupted';
  await homeFromFilm(1.2);
  if (!G.s.counters.feature_p3_sin_llama) G.count('feature_p3_sin_llama');
  G.save();
  lingerQuiet();
  return 'done';
}

// ------------------------------------------------------------------ H95 · Lo que no se ve
async function h95(): Promise<FlowResult> {
  hushAll(1.5);
  const mano = await step('b95_mano', async () => {
    if (!beatSeen('b95_vigilia')) warmFilm('f38_vigilia', 8000);
    const r = await playStoryFilm('f37_mano', () => talk(lines('b95_mano')), undefined, { hold: true });
    if (r === 'interrupted') return 'interrupted';
    // La Mano leaves the broken lantern on the faro's step (P8)
    setLinterna('escalon');
  });
  if (!mano) return 'interrupted';
  const vigilia = await step('b95_vigilia', async () => {
    if (!beatSeen('b96_recado')) warmFilm('f39_recado', 10000);
    const r = await playStoryFilm('f38_vigilia', async () => {
      await talk(lines('b95_vigilia'));
      const { onePress } = await import('../ui/story/finalUi');
      await onePress('Seguir', { dim: 0.15 });
    }, undefined, { hold: true });
    return r === 'interrupted' ? 'interrupted' : undefined;
  });
  if (!vigilia) return 'interrupted';
  await homeFromFilm(1.2);
  if (!G.s.counters.feature_p3_vigilia) G.count('feature_p3_vigilia');
  G.save();
  lingerQuiet();
  return 'done';
}

// ------------------------------------------------------------------ H96 · El recado
const LAST_STEPS = ['b96_recado', 'b96_luz', 'b96_creditos', 'b96_continuara'] as const;
async function h96(): Promise<FlowResult> {
  hushAll(1.5);
  // the credits and «Continuará» warm while the errand plays (each last frame holds until the next is up)
  if (!beatSeen('b96_creditos')) warmFilm('f39_creditos', 10000);
  if (!beatSeen('b96_continuara')) warmFilm('f39_continuara', 20000);
  // F39 holds it all (DÍSELO is its gate, then the orange faro, the credits and «Continuará»)
  if (!LAST_STEPS.every((k) => beatSeen(k)) && (await resolveStoryFilm('f39_recado')) && !LAST_STEPS.some((k) => beatSeen(k))) {
    const r = await playStoryFilm('f39_recado', async () => undefined, undefined, { hold: true });
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
  if (!(await filmStep('b96_creditos', 'f39_creditos', 'b96_creditos', undefined, { hold: true }))) return 'interrupted';
  // «Continuará.»: the mourning ends here (gaterasWorld.dueloActivo) — silence, then the pencil; its black holds a breath
  if (!(await filmStep('b96_continuara', 'f39_continuara', 'b96_continuara', undefined, { hold: true }))) return 'interrupted';
  await homeFromFilm(1.5);
  if (!G.s.counters.feature_p3_recado) G.count('feature_p3_recado');
  G.save();
  // the island's music comes back slowly, after the CAMBIÓ card has had its silence
  lingerQuiet(FINAL_TIMING.afterMs, 6);
  return 'done';
}

// ------------------------------------------------------------------ H97 · La última ronda (on the Carta)
async function h97(): Promise<FlowResult> {
  // the cartoon without its laugh track: no music under it (the Carta's comes back after)
  const bar = await step('b97_bar', async () => {
    hushAll(1.5);
    const r = await playStoryFilm('f40_ronda', () => talk(lines('b97_bar')));
    return r === 'interrupted' ? 'interrupted' : undefined;
  });
  quietOff(3);
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
  let r: FlowResult = 'interrupted';
  try {
    r = await f();
    return r;
  } finally {
    // a flow cut short («Más tarde», an error) never leaves the island silent: its quiet lets go by itself
    if (r !== 'done') lingerQuiet();
  }
}
