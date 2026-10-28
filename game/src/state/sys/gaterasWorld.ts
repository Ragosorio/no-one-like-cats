/**
 * PARTE III · the world as the story says it is, and the questions every surface asks (docs/part-iii/11 §2 A).
 * Pure functions of the save (missions, beats, flags): no Pixi, no clock, no stored «alive/dead» flag. A reload, a
 * migration or a trip never changes the answer. Registered at import (app/story.ts imports it at boot).
 *
 *   world states (band 130–159, docs/part-ii/20 §1.1):
 *     p3_marca_fria   H66–H68 active, before the awakening: the warm dent on the page went cold (no steam)
 *     p3_rasgadura    from the awakening (b67_despierta) until H73 is done: a small tear in your island's sky
 *   registro000Estado()   'observando' → 'despertando' (H65) → 'despierto' (the awakening scene, after H67)
 *   luzternaFallecida()   derived: SADIE started (b94_sadie) or H94 done — the v2 finale (historia-v2/guiones/final:
 *                         she dies at the end of H94's dawn, F34 → SADIE). False for the whole slice and Acto I
 *   caneloSinLlama()      the night without Canelo: H93 done (F32: his flame went out) until the dawn (b94_amanecer)
 *   dueloActivo()         the mourning: from SADIE's first chord to «Continuará» (b96_continuara): 0 prizes, 0 tips,
 *                         0 NOVEDADES, 0 jingles (final/00-indice §2.6)
 *   voiceFor(surface)     who speaks on each surface (08 §6.2) — the base: nothing consults it yet
 *   bitacora*()           what the Bitácora shows: the cards of the Parte III missions already met
 */
import { G } from '../game';
import { MISSIONS, MISSION_BY_ID, type MissionCard, type MissionDef } from '../../data/content';
import { registerWorldState, type WorldLook, type WorldSave } from './worldState';
import { isAfterPart2Mission } from './rupturasLedger';

const active = (s: WorldSave, id: string) => !!s.missions?.active?.includes(id);
const done = (s: WorldSave, id: string) => !!s.missions?.done?.includes(id);
const seen = (s: WorldSave, k: string) => !!s.beatsSeen?.includes(k);

// ------------------------------------------------------------------ the awakening (end of H67)
/** the beat of the scene in which REGISTRO 000 wakes up (cine p3_despierta persists it) */
export const DESPIERTA_BEAT = 'b67_despierta';
/**
 * REGISTRO 000 is awake: the scene played (its beat is persisted at the Catdex moment, or when it's overtaken), or the
 * story is already past it (H68+ done). H67 done alone is not enough: until the scene plays at home, the world
 * doesn't show it yet («si la historia lo dice, pasa en el mundo» — and not before).
 */
export function despertoRegistro(s: WorldSave | null | undefined = G.s): boolean {
  if (!s?.missions) return false;
  if (seen(s, DESPIERTA_BEAT)) return true;
  return (s.missions.done ?? []).some((id) => isAfterPart2Mission(id) && Number(id.slice(1)) >= 68);
}

/** the Catdex card / the 3D islands' ESTADO of REGISTRO 000 (01 c-11: they all say the same thing) */
export type Registro000Estado = 'observando' | 'despertando' | 'despierto';
export function registro000Estado(s: WorldSave | null | undefined = G.s): Registro000Estado {
  if (!s?.missions) return 'observando';
  if (despertoRegistro(s)) return 'despierto';
  return done(s, 'H65') ? 'despertando' : 'observando';
}
/** a description written with «Estado: observando» (3D islands) says the current state instead */
export function withRegistroEstado(text: string, s: WorldSave | null | undefined = G.s): string {
  const e = registro000Estado(s);
  return e === 'observando' ? text : text.replace(/Estado: observando/g, `Estado: ${e}`);
}

// ------------------------------------------------------------------ the page by the faro (o4Pagina.ts reads it)
/**
 * The dent on the page is still warm (steam): after the Parte II, until the moment H66's card tells you it went cold
 * (p3_fria + the card: «la marca ya no está tibia»). Once Parte III moves on, it's cold for good.
 */
export function paginaTibia(s: WorldSave | null | undefined = G.s): boolean {
  if (!s?.missions || !done(s, 'H65')) return false;
  const p3 = [...(s.missions.done ?? []), ...(s.missions.active ?? [])].filter(isAfterPart2Mission);
  if (!p3.length) return true;
  return p3.length === 1 && active(s, 'H66') && !seen(s, 'p3_tarjeta_H66');
}
/** H66 is waiting for you to tap the page */
export const paginaLlama = (s: WorldSave | null | undefined = G.s) => !!s?.missions && active(s, 'H66');

// ------------------------------------------------------------------ world states (band 130–159)
export const P3_STATES = { marcaFria: 'p3_marca_fria', rasgadura: 'p3_rasgadura' } as const;
export const P3_LOOKS: Record<keyof typeof P3_STATES, Partial<WorldLook>> = {
  // the day after the Parte II, a little colder: nothing broke, someone is missing
  marcaFria: { exposure: 0.97, tint: 0xeef1f6, saturation: 0.9, lift: 0x04060a, seam: 0.12, starFall: 0.03, stars: 0.05, vignette: 0.12, dayLife: 0.8, cats: 0.15, music: 'emotional' },
  // a small tear in the sky (glued like a page, with static at its edges): it follows the real clock
  rasgadura: { seam: 0.42, starFall: 0.05, stars: 0.08, vignette: 0.1 },
};
registerWorldState({
  id: P3_STATES.rasgadura,
  priority: 131,
  wave: 'P3',
  blend: 6,
  clock: true,
  note: 'Desde el despertar de REGISTRO 000 (b67_despierta) hasta H73: una rasgadura chiquita en el cielo de tu isla.',
  when: (s) => despertoRegistro(s) && !done(s, 'H73'),
  look: P3_LOOKS.rasgadura,
});
registerWorldState({
  id: P3_STATES.marcaFria,
  priority: 130,
  wave: 'P3',
  blend: 5,
  note: 'H66–H67 activas (o H68 antes de que se vea el despertar): la marca de la página ya no echa vapor; Canelo no está.',
  when: (s) => (active(s, 'H66') || active(s, 'H67') || active(s, 'H68')) && !despertoRegistro(s),
  look: P3_LOOKS.marcaFria,
});

// ------------------------------------------------------------------ Luzterna (docs/part-iii/08 §6)
/**
 * The mission in which she dies (v2 finale, historia-v2/guiones/final/h94-sin-llama.md: the blow at dawn, then SADIE).
 * The predicate is DERIVED from it (and from SADIE's beat, persisted at its first chord: SADIE never plays twice and a
 * reload after it never shows her alive again), never a loose flag.
 */
export const LUZTERNA_FINAL = 'H94';
/** the beat persisted at SADIE's first chord (app/finalFlow.ts): from here on she is gone */
export const SADIE_BEAT = 'b94_sadie';
/** she is gone in THIS save's timeline (per save, not global: a new game has her alive until H94's dawn) */
export function luzternaFallecida(s: WorldSave | null | undefined = G.s): boolean {
  return !!s?.missions && (done(s, LUZTERNA_FINAL) || seen(s, SADIE_BEAT));
}
/** H93 «La noche más oscura» took his flame (F32); the dawn of H94 (Cerito, b94_amanecer) gives it back, at 30 % */
export const CANELO_NOCHE_BEAT = 'b94_amanecer';
export function caneloSinLlama(s: WorldSave | null | undefined = G.s): boolean {
  return !!s?.missions && done(s, 'H93') && !done(s, LUZTERNA_FINAL) && !seen(s, CANELO_NOCHE_BEAT);
}
/** the mourning (final/00-indice §2.6): from SADIE's first chord to «Continuará» — no prizes, tips, NOVEDADES, jingles */
export const CONTINUARA_BEAT = 'b96_continuara';
export function dueloActivo(s: WorldSave | null | undefined = G.s): boolean {
  return !!s?.missions && luzternaFallecida(s) && !seen(s, CONTINUARA_BEAT) && !done(s, 'H96');
}

// the island after her (02-mapa §7): «el faro se apaga» (H94 → H96) and, once Canelo lights it, its light is orange
export const P3_FINAL_STATES = { sinLuz: 'p3_sin_luz', faroNaranja: 'p3_faro_naranja' } as const;
registerWorldState({
  id: P3_FINAL_STATES.sinLuz,
  priority: 133,
  wave: 'P3',
  blend: 6,
  note: 'Desde la muerte de Luzterna (SADIE) hasta que Canelo prende el faro (H96): el faro apagado, la isla a oscuras y en silencio (el dueño, 2026-10-28: silencio total en la isla durante el duelo; solo el mar).',
  when: (s) => luzternaFallecida(s) && !done(s, 'H96'),
  look: { exposure: 0.82, saturation: 0.72, tint: 0xdfe4ee, lift: 0x05070c, faro: 0, lights: 0.3, stars: 0.12, dayLife: 0.35, vignette: 0.2, cats: 0.4, music: 'silence' },
});
registerWorldState({
  id: P3_FINAL_STATES.faroNaranja,
  priority: 132,
  wave: 'P3',
  blend: 8,
  note: 'Desde H96 «El recado»: el faro tiene luz otra vez, naranja (la llama de Canelo). No la suya.',
  when: (s) => done(s, 'H96'),
  look: { tint: 0xfff0dc, faro: 0.7, lights: 0.8, saturation: 0.95 },
});

/** every surface where Luzterna speaks today (inventory: docs/part-iii/investigacion/luzterna-funciones.md) */
export type VoiceSurface =
  | 'tip'
  | 'mision_nueva'
  | 'mision_firma'
  | 'mision_cumplida'
  | 'reino'
  | 'glosario'
  | 'novedades'
  | 'offline'
  | 'nombrar'
  | 'faro'
  | 'islas3d'
  | 'presentaciones'
  | 'ajustes';
export interface Voice {
  /** the speaker id for say()/tip() (ui/story/text.ts); null = the surface stays silent */
  speaker: 'LUZTERNA' | 'BITÁCORA' | 'PERIÓDICO' | null;
  /** her ghost portrait may show */
  portrait: boolean;
  /** how a written line is signed (MISIONES, glossary) */
  signature: string;
  /** shown as a memory (RECUERDO frame) rather than as a present voice */
  memory?: boolean;
}
const ALIVE: Voice = { speaker: 'LUZTERNA', portrait: true, signature: '— Luzterna' };
/**
 * Who speaks on `surface` for this save (08 §6.2). Before her death (H94): Luzterna, as always. After: her notebook (BITÁCORA,
 * no face) or the Diario; what she wrote before keeps her initial as a memory. The tip, NOVEDADES, the offline report
 * and every dialog line ask here (ui/story/ghost.ts: a line of hers after her death is a written memory, never her).
 */
export function voiceFor(surface: VoiceSurface, s: WorldSave | null | undefined = G.s, o: { mission?: string } = {}): Voice {
  if (!luzternaFallecida(s)) return ALIVE;
  switch (surface) {
    case 'mision_firma':
      // Part I/II (and Parte III before her death) keep her signature, as something she wrote; later missions, your hand
      return o.mission && Number(o.mission.slice(1)) > Number(LUZTERNA_FINAL.slice(1)) ? { speaker: 'BITÁCORA', portrait: false, signature: '— tu letra' } : { speaker: 'BITÁCORA', portrait: false, signature: '— de la Bitácora de L.', memory: true };
    case 'glosario':
      return { speaker: 'BITÁCORA', portrait: false, signature: '— L.', memory: true };
    case 'mision_cumplida':
    case 'offline':
      return { speaker: 'PERIÓDICO', portrait: false, signature: '— El Diario del Mar' };
    case 'nombrar':
    case 'faro':
      return { speaker: null, portrait: false, signature: '' };
    case 'islas3d':
      // one memory per island the first time you come back (RECUERDO), then silence
      return { speaker: 'BITÁCORA', portrait: false, signature: '— L.', memory: true };
    case 'presentaciones':
      return { speaker: 'BITÁCORA', portrait: false, signature: '— lo dejó explicado', memory: true };
    case 'ajustes':
      return { speaker: null, portrait: false, signature: '' };
    default:
      return { speaker: 'BITÁCORA', portrait: false, signature: '— Bitácora' };
  }
}

// ------------------------------------------------------------------ the Bitácora (03 §4, minimal)
export interface BitacoraEntry {
  mission: MissionDef;
  card: MissionCard;
  /** CAMBIÓ is written (the mission is done) */
  done: boolean;
}
/** the cards of the Parte III missions this save has met (active or done), in story order */
export function bitacoraEntries(s: WorldSave | null | undefined = G.s): BitacoraEntry[] {
  if (!s?.missions) return [];
  const out: BitacoraEntry[] = [];
  for (const m of MISSIONS) {
    if (!m.card || !isAfterPart2Mission(m.id)) continue;
    const d = done(s, m.id);
    if (d || active(s, m.id)) out.push({ mission: m, card: m.card, done: d });
  }
  return out.sort((a, b) => Number(a.mission.id.slice(1)) - Number(b.mission.id.slice(1)));
}
/** «La última vez…»: the last CAMBIÓ lines (newest last), at most `n` */
export function ultimaVez(s: WorldSave | null | undefined = G.s, n = 3): string[] {
  return bitacoraEntries(s)
    .filter((e) => e.done)
    .slice(-n)
    .map((e) => e.card.cambio);
}
/** «La última vez…» opens by itself when you come back after this long (03 §4: more than 8 real hours) */
export const ULTIMA_VEZ_MS = 8 * 3600_000;
export function ultimaVezDue(offlineMs: number, s: WorldSave | null | undefined = G.s): boolean {
  return offlineMs >= ULTIMA_VEZ_MS && ultimaVez(s).length > 0;
}
/** the card of a mission (null for missions without one: Part I/II) */
export const cardOf = (id: string): MissionCard | null => MISSION_BY_ID.get(id)?.card ?? null;
