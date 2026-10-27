/**
 * Parte III · ACTOS II–IV (H75–H92) — the story flows of the Comic, the Shōnen, the Library and the Tour.
 * Texts: NARRATIVA (docs/part-iii/historia-v2/guiones/acto-2…4), literal, in data/gateras/historia.json (b75_…–b92_…).
 * Films: FILM-ACTO2/3/4 (game/src/film/films/acto2-4); a film that isn't registered plays its lines.
 *
 * DATA, not code: each flow is a list of steps; every step is persisted as a beat (its `key`), so a reload resumes at
 * the next one and nothing replays. The director (app/story.ts, `special: 'flow'`) plays them when it's calm
 * (ui/story/gaterasScript.ts says where and when: the Carta, or home for H78 and H92).
 *
 *   lines    the beat's lines (or some of them) as dialog
 *   film     a story film (by id, or by prefix: `f12` finds `f12_…`), else its lines
 *   battle   an activity battle (state/sys/actBattles.ts): loseable, retried at no cost («¡OTRA VEZ!» / «AHORA NO»)
 *   choice   a choice the story keeps (`flag:<value>`), then the lines of what was chosen
 *   llama    Canelo's flame goes down to `pct` for good (H85: 60 %; state/sys/finalState.ts)
 *   dark     H85: she turns her lantern off — the black, the cats' eyes; «Sigue los ojos» (or FILM-ACTO3's scene)
 *   faro     H92: the playable return home — the film starts when the player taps the faro («sentarse con ella»)
 *   gate     H92: the finale wakes up (missionGoals FINAL_GATE)
 */
import { G } from '../state/game';
import { beatSeen, markBeat } from '../state/ext/story';
import { FLOW_KIT, type FlowResult } from './acto1Flow';
import { playStoryFilm, resolveStoryFilm } from './stageIntro';

const { lines, talk } = FLOW_KIT;

export type ActStep =
  | { t: 'lines'; key: string; beat: string; idx?: number[]; /** only when this film is missing (the film already contains these lines) */ unlessFilm?: string }
  | {
      t: 'film';
      key: string;
      film: string;
      beat: string;
      idx?: number[];
      alt?: { flag: string; film: string };
      /** the film asks a choice itself (an optional input): watched to the end, its answer is kept as `flag:<value>` and the
       *  flow's own prompt (`covers`, the choice step's key) is marked seen — the prompt stays only as the fallback */
      input?: { id: string; flag: string; values: Record<string, string>; covers: string };
    }
  | { t: 'battle'; key: string; battle: string }
  | { t: 'choice'; key: string; flag: string; title1: string; title2: string; sub: string; tag: string; options: { label: string; value: string; then?: { beat: string; idx?: number[] } }[]; bool?: boolean }
  | { t: 'llama'; key: string; pct: number }
  | { t: 'dark'; key: string; film: string; beat: string }
  | { t: 'faro'; key: string }
  | { t: 'gate'; key: string };
export interface ActFlow {
  steps: ActStep[];
  /** the mission feature its end counts (use_feature goals) */
  feature?: string;
}

const L = (key: string, beat: string, idx?: number[]): ActStep => ({ t: 'lines', key, beat, idx });
/** lines that are a fallback for a film that already contains them (FILM-ACTO3: h85_oscuridad holds C1–C3, f21 holds G1–G4) */
const LF = (key: string, beat: string, film: string): ActStep => ({ t: 'lines', key, beat, unlessFilm: film });
const F = (key: string, film: string, beat: string, idx?: number[]): ActStep => ({ t: 'film', key, film, beat, idx });
const B = (key: string, battle: string): ActStep => ({ t: 'battle', key, battle });

export const ACT_FLOWS: Record<string, ActFlow> = {
  // ------------------------------------------------------------------ ACTO II «Se rompen las cajas»
  h75_llegada: { steps: [L('b75_llegada', 'b75_llegada')] },
  h75_cierre: { steps: [L('b75_cierre', 'b75_cierre')] },
  h76_cierre: { steps: [L('b76_arana', 'b76_arana'), L('b76_portada', 'b76_portada')] },
  h77_cierre: { steps: [L('b77_tinta', 'b77_tinta'), L('b77_murciegato', 'b77_murciegato')] },
  h78_cerito: {
    steps: [
      // the documentary's one click (S8) is F12's own (`inputs.cobija`: left = the lighthouse by default, right = the palm)
      { t: 'film', key: 'b78_doc', film: 'f12', beat: 'b78_doc', input: { id: 'cobija', flag: 'cobija', values: { left: 'faro', right: 'palmera' }, covers: 'b78_cobija' } },
      // where Cerito's blanket stays — it comes back in the vigil (H95); asked here only when the film didn't play (or was left)
      { t: 'choice', key: 'b78_cobija', flag: 'cobija', title1: '¿DÓNDE LA', title2: 'COBIJA?', sub: 'Cerito duerme en la luz. ¿Dónde le dejas la cobija?', tag: 'CERITO', options: [{ label: 'Junto al faro', value: 'faro' }, { label: 'Junto a la palmera', value: 'palmera' }] },
    ],
    feature: 'p3_cerito',
  },
  h79_maneki: { steps: [L('b79_maneki', 'b79_maneki'), L('b79_llegada', 'b79_llegada')] },
  h79_llave: { steps: [L('b79_llave', 'b79_llave')] },
  h80_entrenamiento: {
    steps: [L('b80_apertura', 'b80_apertura'), F('b80_tira1', 'f14_1', 'b80_tiras', [0, 1]), B('b80_arco1', 't1'), F('b80_tira2', 'f14_2', 'b80_tiras', [2, 3]), B('b80_arco2', 't2'), F('b80_tira3', 'f14_3', 'b80_tiras', [4, 5, 6, 7]), B('b80_arco3', 't3'), L('b80_tecnica', 'b80_tecnica')],
    feature: 'p3_entrenamiento',
  },
  h81_daria: { steps: [F('b81_daria', 'f16', 'b81_daria'), L('b81_ficha', 'b81_ficha')] },
  h82_vocacion: { steps: [F('b82_vocacion', 'f17', 'b82_vocacion'), L('b82_huella', 'b82_huella')], feature: 'p3_vocacion' },
  // ------------------------------------------------------------------ ACTO III «Lo que está escrito»
  h83_llegada: { steps: [L('b83_llegada', 'b83_llegada')] },
  h83_costuras: { steps: [L('b83_costuras', 'b83_costuras')] },
  h84_finales: {
    steps: [
      L('b84_tarjeta', 'b84_tarjeta'),
      B('b84_cuento1', 'c1'),
      { t: 'choice', key: 'b84_final1', flag: 'final_cerditos', title1: '¿QUÉ', title2: 'FINAL?', sub: 'Los tres cerditos: ¿casa de ladrillo o casa de croquetas?', tag: 'FINALES PERDIDOS', options: [{ label: 'Casa de ladrillo', value: 'ladrillo' }, { label: 'Casa de croquetas', value: 'croquetas' }] },
      B('b84_cuento2', 'c2'),
      { t: 'choice', key: 'b84_final2', flag: 'final_liebre', title1: '¿QUÉ', title2: 'FINAL?', sub: 'La liebre y la tortuga: ¿gana la tortuga o empatan y se duermen?', tag: 'FINALES PERDIDOS', options: [{ label: 'Gana la tortuga', value: 'tortuga' }, { label: 'Empatan y se duermen', value: 'empate' }] },
      B('b84_cuento3', 'c3'),
      { t: 'choice', key: 'b84_final3', flag: 'final_patito', title1: '¿QUÉ', title2: 'FINAL?', sub: 'El patito feo: ¿cisne o pato orgulloso?', tag: 'FINALES PERDIDOS', options: [{ label: 'Cisne', value: 'cisne' }, { label: 'Pato orgulloso', value: 'pato' }] },
      F('b84_derrame', 'f19', 'b84_derrame'),
      L('b84_testamento', 'b84_testamento'),
      L('b84_brecha', 'b84_brecha'),
    ],
    feature: 'p3_finales',
  },
  h85_ficha: { steps: [L('b85_ficha', 'b85_ficha')] },
  // after the collapse: his flame stays at 60 % for good; she turns her lantern off to hide them (the eyes guide her)
  h85_oscuridad: { steps: [{ t: 'llama', key: 'b85_llama', pct: 60 }, { t: 'dark', key: 'b85_oscuridad', film: 'h85_oscuridad', beat: 'b85_oscuridad' }, LF('b85_grua', 'b85_grua', 'h85_oscuridad')] },
  h86_plan: { steps: [L('b86_recado', 'b86_recado'), F('b86_plan', 'f21', 'b86_plan'), LF('b86_regreso', 'b86_regreso', 'f21')], feature: 'p3_luz_trajo' },
  h87_nowey: {
    steps: [
      F('b87_nowey', 'f23', 'b87_nowey'),
      L('b87_azotea', 'b87_azotea', [0, 1, 2, 3, 4]),
      // the map of the gateras for Brecha: it changes F25 and the finale's siege (Brecha or Bisagra helps)
      { t: 'choice', key: 'b87_mapa', flag: 'p3_mapa_brecha', bool: true, title1: '¿LE DAS', title2: 'EL MAPA?', sub: 'Brecha quiere el mapa de las gateras para encontrar a Esquirla antes.', tag: 'LA AZOTEA', options: [{ label: 'Dale el mapa', value: 'si', then: { beat: 'b87_azotea', idx: [7, 8] } }, { label: 'No se lo des', value: 'no', then: { beat: 'b87_azotea', idx: [9, 10] } }] },
    ],
  },
  h88_distor: { steps: [{ t: 'film', key: 'b88_distor', film: 'f25', beat: 'b88_distor', alt: { flag: '!p3_mapa_brecha', film: 'f25_bisagra' } }, L('b88_queda', 'b88_queda')] },
  // ------------------------------------------------------------------ ACTO IV «La gira»
  h89_llegada: { steps: [L('b89_llegada', 'b89_llegada')] },
  h89_telonero: { steps: [L('b89_telonero', 'b89_telonero')] },
  h90_gira: {
    steps: [
      L('b90_fecha1', 'b90_fechas', [0]),
      B('b90_show1', 'g1'),
      L('b90_fecha2', 'b90_fechas', [1]),
      B('b90_show2', 'g2'),
      L('b90_fecha3', 'b90_fechas', [2]),
      B('b90_show3', 'g3'),
      F('b90_karaoke', 'f27', 'b90_karaoke'),
      // the photo (no clock): it's pinned in the Bitácora and comes back in SADIE and the vigil
      { t: 'choice', key: 'b90_foto', flag: 'foto', title1: 'LA', title2: 'FOTO', sub: 'La tira del fotomatón: toca una. Se queda en la Bitácora.', tag: 'KARAOKE', options: [{ label: 'Ella cantando', value: '1' }, { label: 'Canelo abucheando', value: '2' }, { label: 'El dúo', value: '3' }, { label: 'Ella y él comiendo', value: '4' }] },
    ],
    feature: 'p3_gira',
  },
  h91_show: { steps: [F('b91_show', 'f29', 'b91_show'), L('b91_despues', 'b91_despues')] },
  h92_noche: { steps: [{ t: 'faro', key: 'b92_regreso' }, F('b92_xti', 'f30', 'b92_xti'), { t: 'gate', key: 'b92_final' }], feature: 'p3_noche_estrellada' },
};
export const ACTS_FLOWS = Object.keys(ACT_FLOWS);

/** the photo's word, in her hand (h90-la-gira.md) */
export const FOTO_PALABRA: Record<string, string> = { '1': 'Artista.', '2': 'Envidioso.', '3': 'Los dos horribles.', '4': 'Mi gordo.' };

// ------------------------------------------------------------------ the pieces that need a port (tests replace them)
export type ActBattlePort = (id: string) => Promise<'won' | 'lost'>;
let battlePort: ActBattlePort | null = null;
export function setActBattlePort(p: ActBattlePort | null) {
  battlePort = p;
}
async function battle(id: string): Promise<'won' | 'lost'> {
  if (battlePort) return battlePort(id);
  const [{ BattleScene }, AB, ship, { scenes }, { music }] = await Promise.all([import('../scenes/BattleScene'), import('../state/sys/actBattles'), import('../state/sys/ship'), import('../core/scenes'), import('../core/music')]);
  if (!ship.crew().length) ship.autoCrew();
  const r = await new Promise<'won' | 'lost'>((resolve) => {
    const spec = AB.buildActBattle(id, (res) => resolve(res.won ? 'won' : 'lost'));
    music.play('battle');
    void scenes.go(new BattleScene(spec), 'blocks');
  });
  return r;
}
/** where an activity sends you back to after its battles (the Carta for the boxes) */
async function home(where: 'cajas' | 'island') {
  if (battlePort) return;
  if (where === 'island') return void (await (await import('./flow')).goIsland());
  await (await import('./cajasFlow')).goCajas();
}
/**
 * The screen still shows a battle: an activity's last fight was won and its end card closed (H80, H84, H90). Nothing
 * else takes the player off it — the flow does (QA-P3: H80 left the player on the third arc's end screen for good).
 */
async function onBattleScene(): Promise<boolean> {
  if (battlePort) return false;
  const [{ scenes }, { BattleScene }] = await Promise.all([import('../core/scenes'), import('../scenes/BattleScene')]);
  return scenes.current instanceof BattleScene;
}
const homeOf = (): 'cajas' | 'island' => (G.s.missions.active.some((m) => m === 'H92') ? 'island' : 'cajas');

export type FaroPort = () => Promise<void>;
let faroPort: FaroPort | null = null;
export function setFaroPort(p: FaroPort | null) {
  faroPort = p;
}

export const ACTS_TIMING = { laterMs: 60_000 };
let laterAt = -Infinity;
async function retry(): Promise<'go' | 'later'> {
  const { choicePrompt } = await import('../ui/story/profile');
  const { storyLayer } = await import('../ui/dialog');
  const { C } = await import('../ui/theme');
  return choicePrompt<'go' | 'later'>(storyLayer(), { title1: '¿OTRA', title2: 'VEZ?', sub: 'Perder no cuesta nada: se vuelve a intentar.', tag: 'ACTIVIDAD', options: [{ label: '¡OTRA VEZ!', value: 'go', color: C.yellow }, { label: 'AHORA NO', value: 'later', color: C.paper }] });
}

async function runStep(st: ActStep): Promise<'ok' | 'interrupted'> {
  switch (st.t) {
    case 'lines':
      if (st.unlessFilm && (await resolveStoryFilm(st.unlessFilm))) return 'ok';
      await talk(lines(st.beat, st.idx));
      return 'ok';
    case 'film': {
      let id = st.film;
      if (st.alt) {
        const neg = st.alt.flag.startsWith('!');
        const on = G.has(neg ? st.alt.flag.slice(1) : st.alt.flag);
        if (neg ? !on : on) id = st.alt.film;
      }
      const inp = st.input;
      const r = await playStoryFilm(
        id,
        () => talk(lines(st.beat, st.idx)),
        inp
          ? (inputs, end) => {
              const v = inp.values[inputs[inp.id] ?? ''];
              // watched to the end: the film showed where it went (untouched: its fallback). Left early: the prompt asks
              if (end !== 'done' || !v || beatSeen(inp.covers)) return;
              G.flag(`${inp.flag}:${v}`);
              markBeat(inp.covers);
            }
          : undefined,
      );
      return r === 'interrupted' ? 'interrupted' : 'ok';
    }
    case 'battle': {
      for (;;) {
        if ((await battle(st.battle)) === 'won') return 'ok';
        await home(G.s.missions.active.some((m) => m === 'H92') ? 'island' : 'cajas');
        if ((await retry()) === 'later') {
          laterAt = performance.now();
          return 'interrupted';
        }
      }
    }
    case 'choice': {
      const { choicePrompt } = await import('../ui/story/profile');
      const { storyLayer } = await import('../ui/dialog');
      const { C } = await import('../ui/theme');
      const v = await choicePrompt<string>(storyLayer(), { title1: st.title1, title2: st.title2, sub: st.sub, tag: st.tag, options: st.options.map((o, i) => ({ label: o.label, value: o.value, color: i === 0 ? C.yellow : C.paper })) });
      if (st.bool) G.flag(st.flag, v === st.options[0].value);
      else G.flag(`${st.flag}:${v}`);
      G.save();
      const then = st.options.find((o) => o.value === v)?.then;
      if (then) await talk(lines(then.beat, then.idx));
      if (st.flag === 'foto' && FOTO_PALABRA[v]) await talk([['CAPTION', FOTO_PALABRA[v]]]);
      return 'ok';
    }
    case 'llama': {
      const { setLlama } = await import('../state/sys/finalState');
      setLlama(st.pct);
      return 'ok';
    }
    case 'dark': {
      const r = await playStoryFilm(st.film, async () => {
        await talk(lines(st.beat));
        const { oscurasMira } = await import('../ui/story/finalUi');
        await oscurasMira(G.s.cats.length, { goal: 'Ella apagó la linterna', label: 'Sigue los ojos', auto: 8 });
      });
      return r === 'interrupted' ? 'interrupted' : 'ok';
    }
    case 'faro': {
      // the return home (H92): no music, 20 s with nothing to do; the film starts when the player taps the faro
      if (faroPort) await faroPort();
      else {
        try {
          (await import('../audio/api')).audioApi.release(1.5);
        } catch {
          /* silence never breaks */
        }
        await (await import('../ui/story/faroTap')).waitFaroTap();
      }
      return 'ok';
    }
    case 'gate': {
      const { FINAL_GATE } = await import('../state/sys/missionGoals');
      G.flag(FINAL_GATE);
      return 'ok';
    }
  }
}

/** the director's entry for H75–H92 (unknown ids are done: never a deadlock) */
export async function playStoryFlow(id: string): Promise<FlowResult> {
  const f = ACT_FLOWS[id];
  if (!f) {
    console.warn('[actos] flujo desconocido', id);
    return 'done';
  }
  if (performance.now() - laterAt < ACTS_TIMING.laterMs && f.steps.some((s) => s.t === 'battle' && !beatSeen(s.key))) return 'interrupted';
  let prev: ActStep['t'] | null = null;
  for (const st of f.steps) {
    if (beatSeen(st.key)) continue;
    // story lines after a won activity fight are said back on the Carta, not over the battle's end screen; so is a choice
    // that follows a film (H90's photo after the karaoke) — a choice right after its fight (H84's endings) stays there
    if ((st.t === 'lines' || (st.t === 'choice' && prev === 'film')) && (await onBattleScene())) await home(homeOf());
    prev = st.t;
    if ((await runStep(st)) === 'interrupted') return 'interrupted';
    markBeat(st.key);
    G.save();
  }
  if (f.feature && !G.s.counters[`feature_${f.feature}`]) G.count(`feature_${f.feature}`);
  G.save();
  // the flow ended on a battle's screen (the last step was a fight, a choice or a film after it): back to the Carta
  if (await onBattleScene()) await home(homeOf());
  return 'done';
}
/** a film this flow would play is registered (tests, the sheet) */
export const actFilmReady = (id: string) => resolveStoryFilm(id);
