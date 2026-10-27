/**
 * ACTO I — the music of each film (pure). Originals (`emen`, `oh_shit`) only in song films; briefings and story films
 * use DERIVED pieces (historia-v2/03-peliculas.md §4, musica-v2/00-LEEME.md §6). A derived piece MÚSICA hasn't
 * registered yet falls back to a registered Drunck variation, so a film never names a track tracks.json doesn't know.
 */
import tracksJson from '../../../data/music/tracks.json';

type Row = { id: string; variations?: { id: string }[] };
const TRACKS = tracksJson as unknown as Row[];
export const known = (ref: string) => TRACKS.some((t) => t.id === ref || t.variations?.some((v) => v.id === ref));
/** the first registered candidate, else the fallback */
export function derived(cands: string[], fallback: string): string {
  return cands.find(known) ?? fallback;
}

/** F05 «El público espera» (EM%EN c1–9, the isle without drums) — until registered: the Borracha's battle loop */
export const PUBLICO = derived(['emen.publico', 'emen.espera', 'emen.briefing', 'emen.beat', 'emen.intro'], 'drunck.battle');
/** F07 «Antes de caer» (OH SHIT c37–45, the isle) */
export const ANTES_DE_CAER = derived(['oh_shit.antes', 'oh_shit.caer', 'oh_shit.briefing', 'oh_shit.suspenso'], 'drunck.battle');
