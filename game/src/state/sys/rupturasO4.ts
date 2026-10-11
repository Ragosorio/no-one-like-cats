/**
 * Parte II · Oleada 4 «EL UMBRAL» (docs/part-ii/27-oleada-4.md · guion 13). Same pattern as rupturas.ts / rupturasO2.ts:
 * map flags, story battles, systems, the narrative world states and the cats the story hands over.
 * Imported by state/index.ts after rupturas.ts.
 *
 *   H58 El Archipiélago de los Sueños   win_battle umbral_suenos      (flag region:suenos; dream rules from who sleeps on your island)
 *   H59 Ecos de Vida                    use_feature eco               (wake a cat's first Eco: state/sys/ecos.ts)
 *   H60 La Isla que Nadie Recuerda      use_feature olvidada          (flag region:olvidada; repair every ruin: state/sys/olvidada.ts) → Polvillo
 *   H61 Lo que Distraxia sabía          use_feature distraxia         (the blank page among the repaired ruins)
 *   H62 Los Correctores tienen un plan  win_battle umbral_correctores (flag region:umbral)
 *   H63 El Umbral                       win_battle umbral_final       (4 phases)
 *   H64 Mentira                         use_feature mentira           (the island at night: a choice, and Canelo decides)
 *   H65 Continuará                      use_feature continuara        (Parte II credits) → flag oleada4_fin
 *
 * Missions + beats: data/rupturas/historia-o4.json. When each beat plays: ui/story/rupturasScriptO4.ts. On screen
 * (choice, Polvillo, credits, cines): app/oleada4Flow.ts.
 */
import { G } from '../game';
import { registerPatch } from '../patches';
import { adopt } from './cats';
import { claimReward, rewardClaimed } from './rupturasLedger';
import { registerFeatureRegion } from './rupturas';
import { registerWorldState, active, done as wsDone } from './worldState';
import type { WorldLook, WorldSave } from './worldState';
import { REGION_INFO, RegionId } from '../../regions';
import './rupturasO4Battles';
import './olvidada';
import './ecos';
import { ECO_FEATURE } from './ecos';

export { O4_BATTLES, O4_BATTLE_MISSION } from './rupturasO4Battles';

const done = (id: string) => !!G.s?.missions?.done.includes(id);
const seen = (id: string) => !!G.s?.missions && (G.s.missions.active.includes(id) || G.s.missions.done.includes(id));

/** Oleada 3 finished (H57): the threshold opens */
export const oleada4Open = () => done('H57');
/** the whole Parte II is over (H65 «Continuará») */
export const parteIIFin = () => done('H65');

// ------------------------------------------------------------------ the islands on the CARTA
/** the mission whose appearance puts each island on the chart (REGION_INFO.mapFlag); flags stay forever */
export const O4_REGION_MISSION: Partial<Record<RegionId, string>> = { suenos: 'H58', olvidada: 'H60', umbral: 'H62' };
export function syncO4Flags() {
  if (!G.s?.missions) return;
  for (const [r, m] of Object.entries(O4_REGION_MISSION)) {
    const f = REGION_INFO[r as RegionId]?.mapFlag;
    if (f && m && seen(m) && !G.has(f)) G.flag(f);
  }
}
G.on('mission', (p) => {
  if (p.kind !== 'progress') syncO4Flags();
});
G.afterLoad.push(syncO4Flags);

/** region activities (use_feature) → the island they happen on (the HUD's IR and the chart's call travel there) */
export const O4_FEATURES = { eco: ECO_FEATURE, olvidada: 'olvidada', distraxia: 'distraxia', mentira: 'mentira', continuara: 'continuara' } as const;
registerFeatureRegion(O4_FEATURES.olvidada, 'olvidada');
registerFeatureRegion(O4_FEATURES.distraxia, 'olvidada');

/** the counters H61 / H64 / H65 read (use_feature → `feature_<feature>`) */
export function readDistraxia() {
  if (G.s.missions.active.includes('H61')) G.count(`feature_${O4_FEATURES.distraxia}`);
}
export function finishMentira() {
  if (G.s.missions.active.includes('H64')) G.count(`feature_${O4_FEATURES.mentira}`);
}
export function finishCredits() {
  if (G.s.missions.active.includes('H65')) G.count(`feature_${O4_FEATURES.continuara}`);
}

// ------------------------------------------------------------------ H64: what you were going to write (a choice, remembered)
export type MentiraChoice = 'perfecto' | 'romper' | 'nada';
export const MENTIRA_FLAG: Record<MentiraChoice, string> = { perfecto: 'mentira:perfecto', romper: 'mentira:romper', nada: 'mentira:nada' };
/** what you were about to write on the blank page (null = not asked yet). Cosmetic: Saga III may read it. */
export function mentiraChoice(): MentiraChoice | null {
  for (const k of Object.keys(MENTIRA_FLAG) as MentiraChoice[]) if (G.has(MENTIRA_FLAG[k])) return k;
  return null;
}
/** answer (neither option costs or gives anything): the newest answer is the one remembered */
export function chooseMentira(c: MentiraChoice) {
  for (const k of Object.values(MENTIRA_FLAG)) delete G.s.flags[k];
  G.flag(MENTIRA_FLAG[c]);
}

// ------------------------------------------------------------------ cats the story hands over outside a battle
/** H60: Polvillo stays with you once the island stands again. Paid once per save, forever (ledger `cat:mission_H60`). */
export const O4_STORY_CATS: { species: string; after: string }[] = [{ species: 'c_polvillo', after: 'H60' }];
const o4CatKey = (c: { after: string }) => `cat:mission_${c.after}`;
export function o4PendingCats(): string[] {
  return O4_STORY_CATS.filter((c) => done(c.after) && !rewardClaimed(o4CatKey(c))).map((c) => c.species);
}
/** adopt it (once: a replay or a narrative reset never pays twice) */
export function claimO4Cat(species: string) {
  const c = O4_STORY_CATS.find((k) => k.species === species);
  if (!c || rewardClaimed(o4CatKey(c))) return null;
  claimReward(o4CatKey(c));
  const r = adopt(species);
  G.save();
  return r;
}

// ------------------------------------------------------------------ REGISTRO 000 wakes up (H65)
/** the Catdex card's ESTADO: observando → despertando once the credits of Parte II rolled */
export const registro000Despertando = () => done('H65');

// ------------------------------------------------------------------ the world, as the story says it is (20 §1 · band 100–129)
/**
 *   o4_suenos     H58 active: the island dozes — watercolor dusk, slow lights, a few stars drifting up
 *   o4_eco        H59 active: a soft morning; the cats woke up with things they didn't have
 *   o4_olvido     H60 active: the colors fade like an old photo of an island nobody remembers
 *   o4_tachon     H61 active: almost white — a page that someone keeps striking out
 *   o4_umbral     H62–H63 active: night at the edge of the Archive, the seam wide open, aurora
 *   o4_mentira    H64 active: the clearest night of all, every light on, every cat looking up
 *   o4_alba       H65 active: dawn after the ending
 *   o4_epilogo    H65 done: day again; the seam is almost healed, a rare star still goes up
 */
export const O4_STATES = {
  suenos: 'o4_suenos',
  eco: 'o4_eco',
  olvido: 'o4_olvido',
  tachon: 'o4_tachon',
  umbral: 'o4_umbral',
  mentira: 'o4_mentira',
  alba: 'o4_alba',
  epilogo: 'o4_epilogo',
} as const;

export const O4_LOOKS: Record<keyof typeof O4_STATES, Partial<WorldLook>> = {
  suenos: { exposure: 0.9, tint: 0xe6dcff, saturation: 0.82, lift: 0x120c26, sky: 0.45, skyTint: 0xe0c8ff, stars: 0.45, starFall: 0.35, aurora: 0.35, seam: 0.2, lights: 0.55, seaGlow: 0.45, vignette: 0.3, dayLife: 0.35, cats: 0.4, ambience: 'night_astral', music: 'explore_mystery' },
  eco: { exposure: 1.04, tint: 0xfff1de, saturation: 1, lift: 0x0a0604, sky: 0.12, skyTint: 0xffd8b0, stars: 0.05, seam: 0.2, starFall: 0.05, lights: 0.15, seaGlow: 0.25, vignette: 0.12, dayLife: 1, cats: 0.2, ambience: 'sea', music: 'island' },
  olvido: { exposure: 0.95, tint: 0xf2e8d2, saturation: 0.42, lift: 0x0c0a08, seam: 0.35, starFall: 0.06, vignette: 0.35, dayLife: 0.4, cats: 0.25, music: 'emotional' },
  tachon: { exposure: 1.04, tint: 0xf6f3ec, saturation: 0.22, lift: 0x101010, seam: 0.85, vignette: 0.25, dayLife: 0.15, cats: 0.6, music: 'silence' },
  umbral: { exposure: 0.62, tint: 0xa8b4ff, saturation: 0.78, lift: 0x0c0a26, sky: 0.95, skyTint: 0xc0b0ff, stars: 0.85, starFall: 0.9, aurora: 0.9, seam: 1, lights: 0.85, faro: 1, seaGlow: 0.7, vignette: 0.5, dayLife: 0, cats: 0.7, ambience: 'night_astral', music: 'explore_mystery' },
  mentira: { exposure: 0.66, tint: 0xb0bcff, saturation: 0.9, lift: 0x0a0a24, sky: 1, stars: 1, starFall: 0.5, aurora: 0.6, seam: 0.5, lights: 1, faro: 1, seaGlow: 0.9, vignette: 0.45, dayLife: 0, cats: 1, ambience: 'night_astral', music: 'emotional' },
  alba: { exposure: 0.92, tint: 0xffe2d0, saturation: 0.95, lift: 0x140a10, sky: 0.3, skyTint: 0xffc8d8, stars: 0.25, starFall: 0.2, seam: 0.25, lights: 0.3, faro: 0.4, seaGlow: 0.4, vignette: 0.2, dayLife: 0.6, cats: 0.3, music: 'emotional' },
  epilogo: { seam: 0.15, starFall: 0.06, stars: 0.08 },
};

const ws = (id: keyof typeof O4_STATES, priority: number, when: (s: WorldSave) => boolean, note: string, blend = 5, prompt?: { target: string; text: string; when?: (s: WorldSave) => boolean }) =>
  registerWorldState({ id: O4_STATES[id], priority, wave: 'O4', blend, note, when, look: O4_LOOKS[id], ...(prompt ? { prompt } : {}) });

// H64: the page came down by the faro (b64_mentira#a) → the world invites you up there until the scene plays
ws('mentira', 128, (s) => active(s, 'H64'), 'H64 activa: la noche más clara; todas las luces, todos los gatos mirando. La página espera junto al faro.', 6, {
  target: 'faro',
  text: 'TOCA EL FARO',
  when: (s) => (s.beatsSeen ?? []).includes('b64_mentira#a') && !(s.beatsSeen ?? []).includes('b64_mentira#b'),
});
ws('alba', 127, (s) => active(s, 'H65'), 'H65 activa: amanece después del final.', 8);
ws('umbral', 126, (s) => active(s, 'H62') || active(s, 'H63'), 'H62–H63: de noche en el borde del Archivo, la costura abierta.', 6);
ws('tachon', 125, (s) => active(s, 'H61'), 'H61: casi blanco; una página que alguien tacha.', 4);
ws('olvido', 124, (s) => active(s, 'H60'), 'H60: los colores se van como en una foto vieja.', 6);
ws('eco', 122, (s) => active(s, 'H59'), 'H59: una mañana suave; los gatos amanecen con cosas que no tenían.', 5);
ws('suenos', 123, (s) => active(s, 'H58'), 'H58: la isla dormita; atardecer de acuarela.', 6);
ws('epilogo', 100, (s) => wsDone(s, 'H65'), 'Después de la Parte II: de día; la costura casi sanó.', 8);

// ------------------------------------------------------------------ old saves
registerPatch({
  id: '2026-10-oleada4-umbral',
  why: 'Parte II · Oleada 4 (H58–H65) arranca después de H57: quien ya cerró la Oleada 3 debe enterarse.',
  run() {
    if (!oleada4Open()) return;
    return 'Empezó EL UMBRAL (Parte II · Oleada 4). Esta noche tus gatos sueñan raro: toca la misión «El Archipiélago de los Sueños».';
  },
});
