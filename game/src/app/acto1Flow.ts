/**
 * Parte III · ACTO I «La noche que no se reinicia» (H70–H74) — the story scenes on the Carta de las Cajas.
 * Texts: NARRATIVA (docs/part-iii/historia-v2/guiones/acto-1/), literal, in data/gateras/historia.json (b70_…–b74_…),
 * with TEMPERATURA's passes (4: Doña Espuma answers «pago yo»; 5, R7: «¿Cuál luz?», Borrón's fear, no «Es horrible»).
 *
 * The director (app/story.ts, `special: 'flow'`) plays a flow when it's calm on the Carta (ui/story/gaterasScript.ts says
 * when). Each flow persists its SUBSTEPS as beats (00-indice §3.5): a reload never replays what was seen, it resumes at
 * the next step. Films go through app/stageIntro.ts › playStoryFilm: FILM-ACTO1's film when it's registered
 * (f02, f04_* in six parts, f06, f08; a song film can't be skipped the first time), else its lines as dialog.
 *
 *   h70_doneria   A + B (the dona choice, kept in `dona:<id>`) → F02 «El precio de bajar» → C → feature_p3_borron (H70 done)
 *   h71_cierre    H71 won: La Última Ronda after the fight
 *   h72_resaca    F04 «La mañana en blanco y negro», six films: f04_prologo, the three places in the order YOU choose
 *                 (f04_doneria / f04_hipomart / f04_parque), f04_bar last, f04_epilogo → feature_p3_resaca (H72 done)
 *   h73_entrada   the mob in front of the bar (then the Batalla de Gatos is on the Carta: F05 + the battle)
 *   h73_emen      H73 won: F06 «Cuadra 8» (EM%EN, whole) → a still shot without music → the calm close
 *   h74_lista     the list, at the bathroom door (then El Cadenero on the Carta: F07 + the battle)
 *   h74_aviso     H74 won: the warning in silence → F08 «Caída por el multiverso» (OH SHIT)
 */
import { G } from '../state/game';
import { beatSeen, markBeat } from '../state/ext/story';
import { say, storyLayer, type Line } from '../ui/dialog';
import { playStoryFilm } from './stageIntro';

/** timings (tests set them to 0) */
export const ACTO1_TIMING = { quietMs: 5500 };

export type FlowResult = 'done' | 'interrupted';

/** the line indexes each step reads (historia.json) */
export const ACTO1_LINES = {
  b70_doneria: { intro: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], glaseada: [10, 11], chocolate: [12, 13], chispas: [14, 15, 16], quien: [17, 18] },
  /** b72_resaca (the fallback of each F04 part): the prologue, the three places (any order), the bar (last), the epilogue */
  b72_resaca: { prologo: [0, 1, 2, 3], doneria: [4, 5, 6, 7], hipomart: [8, 9], parque: [10, 11, 12, 13], bar: [14, 15, 16], epilogo: [17, 18, 19] },
  b73_despues: { quieto: [0], resto: [1, 2, 3, 4, 5, 6, 7, 8] },
} as const;

export type DonaId = 'glaseada' | 'chocolate' | 'chispas';
/** the dona chosen in H70 (comes back in H96, F37: the one with sprinkles, Homiau keeps one for Canelo) */
export function donaChoice(): DonaId | null {
  for (const id of ['glaseada', 'chocolate', 'chispas'] as const) if (G.has(`dona:${id}`)) return id;
  return null;
}

/** a beat's lines as the story says them (Canelo's name, «Capi»): app/story.ts, loaded lazily */
async function lines(beat: string, idx?: readonly number[]): Promise<Line[]> {
  const { storyLines } = await import('./story');
  return storyLines(beat, idx ? [...idx] : undefined);
}
async function talk(l: Line[] | Promise<Line[]>) {
  const ls = await l;
  if (ls.length) await say(ls, { cinematic: ls.length >= 3, dim: ls.length >= 3 ? 0.35 : 0.22 });
}

/** a substep: skipped when its beat is seen; persisted (and saved) when it ends */
async function step(key: string, fn: () => Promise<void | 'interrupted'>): Promise<boolean> {
  if (beatSeen(key)) return true;
  const r = await fn();
  if (r === 'interrupted') return false;
  markBeat(key);
  G.save();
  return true;
}
/** a story film (its fallback: these lines) as a substep */
async function film(key: string, id: string, beat: string, idx?: readonly number[]) {
  return step(key, async () => {
    const r = await playStoryFilm(id, () => talk(lines(beat, idx)));
    return r === 'interrupted' ? 'interrupted' : undefined;
  });
}

// ------------------------------------------------------------------ H70 · Borrón
async function h70(): Promise<FlowResult> {
  const L = ACTO1_LINES.b70_doneria;
  if (!(await step('b70_doneria', () => talk(lines('b70_doneria', L.intro))))) return 'interrupted';
  const ok = await step('b70_donas', async () => {
    let pick = donaChoice();
    if (!pick) {
      const { choicePrompt } = await import('../ui/story/profile');
      const { C } = await import('../ui/theme');
      pick = await choicePrompt<DonaId>(storyLayer(), {
        title1: '¿CUÁL',
        title2: 'DONA?',
        sub: 'Homiau desliza una caja con tres donas. Luzterna señala la de chocolate; Canelo, la glaseada.',
        tag: 'LA DONERÍA',
        options: [
          { label: 'Glaseada', value: 'glaseada', color: C.paper },
          { label: 'Chocolate', value: 'chocolate', color: C.yellow },
          { label: 'La de chispas', value: 'chispas', color: C.pink },
        ],
      });
      G.flag(`dona:${pick}`);
      G.save();
    }
    await talk(lines('b70_doneria', L[pick]));
    await talk(lines('b70_doneria', L.quien));
  });
  if (!ok) return 'interrupted';
  if (!(await film('b70_sombras', 'f02', 'b70_sombras'))) return 'interrupted';
  if (!(await step('b70_ficha', () => talk(lines('b70_ficha'))))) return 'interrupted';
  if (!G.s.counters.feature_p3_borron) G.count('feature_p3_borron');
  G.save();
  return 'done';
}

// ------------------------------------------------------------------ H71 · the close at La Última Ronda
async function h71(): Promise<FlowResult> {
  return (await step('b71_cierre', () => talk(lines('b71_cierre')))) ? 'done' : 'interrupted';
}

// ------------------------------------------------------------------ H72 · La resaca (F04)
async function h72(): Promise<FlowResult> {
  const L = ACTO1_LINES.b72_resaca;
  const ok = await step('b72_resaca', async () => {
    // F04 is six short films (FILM-ACTO1: f04_prologo … f04_epilogo), each one a substep (its lines when it's missing):
    // the prologue, the three places in the order YOU choose (the B&W map), the bar last, the epilogue
    if (!(await film('b72_prologo', 'f04_prologo', 'b72_resaca', L.prologo))) return 'interrupted';
    const PLACES: { id: 'doneria' | 'hipomart' | 'parque'; label: string }[] = [
      { id: 'doneria', label: 'La Donería' },
      { id: 'hipomart', label: 'El Hipo-Mart' },
      { id: 'parque', label: 'El parque de la resaca' },
    ];
    for (;;) {
      const left = PLACES.filter((p) => !beatSeen(`b72_${p.id}`));
      if (!left.length) break;
      let pick = left[0].id;
      if (left.length > 1) {
        const { choicePrompt } = await import('../ui/story/profile');
        const { C } = await import('../ui/theme');
        pick = await choicePrompt(storyLayer(), { title1: '¿DÓNDE', title2: 'BUSCAMOS?', sub: 'La Borracha de día: sin color y sin voz. La bufanda tiene que estar en algún lado.', tag: 'LA MAÑANA EN BLANCO Y NEGRO', options: left.map((p) => ({ label: p.label, value: p.id, color: C.paper })) });
      }
      if (!(await film(`b72_${pick}`, `f04_${pick}`, 'b72_resaca', L[pick]))) return 'interrupted';
    }
    if (!(await film('b72_bar', 'f04_bar', 'b72_resaca', L.bar))) return 'interrupted';
    if (!(await film('b72_epilogo', 'f04_epilogo', 'b72_resaca', L.epilogo))) return 'interrupted';
  });
  if (!ok) return 'interrupted';
  if (!G.s.counters.feature_p3_resaca) G.count('feature_p3_resaca');
  G.save();
  return 'done';
}

// ------------------------------------------------------------------ H73 · La Batalla de Gatos
async function h73Entrada(): Promise<FlowResult> {
  return (await step('b73_entrada', () => talk(lines('b73_entrada')))) ? 'done' : 'interrupted';
}
async function h73Emen(): Promise<FlowResult> {
  if (!(await film('b73_emen', 'f06', 'b73_emen'))) return 'interrupted';
  const ok = await step('b73_despues', async () => {
    // the valley: a still shot, no music, 5–8 s, before any line (TEMPERATURA: the calm between EM%EN and H74)
    await quiet(async () => {
      await talk(lines('b73_despues', ACTO1_LINES.b73_despues.quieto));
      if (ACTO1_TIMING.quietMs > 0) await new Promise((r) => setTimeout(r, ACTO1_TIMING.quietMs));
    });
    await talk(lines('b73_despues', ACTO1_LINES.b73_despues.resto));
  });
  return ok ? 'done' : 'interrupted';
}

// ------------------------------------------------------------------ H74 · El Cadenero
async function h74Lista(): Promise<FlowResult> {
  return (await step('b74_lista', () => talk(lines('b74_lista')))) ? 'done' : 'interrupted';
}
async function h74Aviso(): Promise<FlowResult> {
  // the warning in SILENCE (only the neon hums): OH SHIT starts from it
  const ok = await step('b74_aviso', () => quiet(() => talk(lines('b74_aviso')), false));
  if (!ok) return 'interrupted';
  return (await film('b74_ohshit', 'f08', 'b74_ohshit')) ? 'done' : 'interrupted';
}

/** the music goes away while `fn` plays (and comes back after it, unless `back` is false: a film takes over) */
async function quiet<T>(fn: () => Promise<T>, back = true): Promise<T> {
  let api: typeof import('../audio/api') | null = null;
  try {
    api = await import('../audio/api');
    api.audioApi.release(0.8);
  } catch {
    api = null;
  }
  try {
    return await fn();
  } finally {
    if (back && api) {
      try {
        const { hasTrack } = await import('../audio/catalog');
        if (hasTrack('drunck.barra')) api.audioApi.cue('drunck.barra', { loop: true, fadeIn: 2, quantize: 'bar' });
      } catch {
        /* silence never breaks */
      }
    }
  }
}

/** the flow kit, shared with the finale (app/finalFlow.ts): substeps persisted as beats, films with their lines */
export const FLOW_KIT = { lines, talk, step, film, quiet };

const FLOWS: Record<string, () => Promise<FlowResult>> = {
  h70_doneria: h70,
  h71_cierre: h71,
  h72_resaca: h72,
  h73_entrada: h73Entrada,
  h73_emen: h73Emen,
  h74_lista: h74Lista,
  h74_aviso: h74Aviso,
};
export const ACTO1_FLOWS = Object.keys(FLOWS);
/** the director's entry (app/story.ts `special: 'flow'`): unknown ids are done (never a deadlock) */
export async function playStoryFlow(id: string): Promise<FlowResult> {
  const f = FLOWS[id];
  if (!f) {
    console.warn('[acto I] flujo desconocido', id);
    return 'done';
  }
  return f();
}
