/**
 * EL ARCHIVO RASGADO — the ending of the main story (after the six Grietas del Multiverso).
 *
 *   H29 «Lo que el Archivo olvidó»  trigger: the six grietas won (H23–H28) · goal: win `final_archivo`
 *   H30 «Fin»                        trigger: H29 · goal: watch the final credits (b30_creditos)
 *
 * The open threads it closes: who asked Distraxia to erase the Archivo ("Él me lo pidió": nobody did —
 * she took NADIE's lament as an order), what the Fragmentos del Vacío are for (pieces of the boxes she
 * erased: each one you hold weakens her), and why Luzterna is dead (app/story.ts + ui/story/finaleScript.ts).
 *
 * The battle reuses the siege builder like every story battle: Distraxia's fog galleon crewed by the
 * echoes of the primordials she copied, the black tide falling every 3 turns, a fight that scales with
 * your fleet (the story never walls you) and gets SMALLER with every fragment you bring.
 */
import { G } from '../game';
import { STORY_BATTLES, StoryBattleDef, voidFragments } from './storyBattles';
import { CATA_INFO, poderDe } from '../../battle/cataclysm';

export const FINAL_BATTLE = 'final_archivo';
/**
 * Strength vs your fleet (the grietas fight at ×1.1–1.35). Tuned with headless sims (post-story crew,
 * AI aim normal/hard, 16 seeds): ×1.45 ≈ 55–65% wins · ×1.2 (7 fragments) ≈ 75–80% · ×1.09 (all 10) ≈ 95%+.
 * Losing costs nothing but the try: it scales with your fleet, so a better ship always gets there.
 */
const BASE_POWER = 1.45;
const PER_FRAGMENT = 0.025;
/** first-win extras on top of the story loot (gems come from reward.gems) */
export const FINAL_EXTRAS = { prisma: 20, purr: 120 };

export function finalPowerMul() {
  return BASE_POWER * (1 - PER_FRAGMENT * Math.min(10, voidFragments()));
}

const def: StoryBattleDef = {
  id: FINAL_BATTLE,
  mission: 'H29',
  zone: 6,
  stage: 9,
  title: 'EL ARCHIVO RASGADO',
  enemy: 'La Niebla del Olvido',
  captain: 'Distraxia',
  line: 'Yo no destruyo, grumete. Yo BORRO.',
  archetype: 'galeon_niebla',
  // the echoes of the primordials she copied out of the boxes she erased
  enemyCats: ['l_medianoche', 'l_cronos', 'l_boreas', 'l_aurea'],
  get powerMul() {
    return finalPowerMul();
  },
  hpMulX: 3,
  rules: { cataclysm: { id: 'tide', side: 1, by: 'DISTRAXIA', first: 1, every: 3, power: 4 } },
  get intro() {
    const f = Math.min(10, voidFragments());
    return [
      'La niebla trae los ECOS de los primordiales que copió: Sombra, Tiempo, Hielo y Luz.',
      f ? `Tus ${f} Fragmentos del Vacío la encogen: −${Math.round(f * PER_FRAGMENT * 1000) / 10}% de su poder.` : `Sin Fragmentos del Vacío pelea con todo su poder (cada uno que juntes le quita ${Math.round(PER_FRAGMENT * 1000) / 10}%).`,
      `${poderDe('DISTRAXIA')}: ${CATA_INFO.tide.name} cada 3 turnos · TÍRALE A SU SELLO`,
    ];
  },
  color: 0x8a5cff,
  reward: { gems: 10 },
};
STORY_BATTLES[FINAL_BATTLE] = def;

// the first win also pays Prisma and Ronroneo (applyStoryResult only knows gems / fragments / cats)
G.on('unlock', ({ what }) => {
  if (what !== `won_${FINAL_BATTLE}`) return;
  G.add('prisma', FINAL_EXTRAS.prisma, 'story');
  G.s.purr += FINAL_EXTRAS.purr;
  G.emit('res', { key: 'purr', delta: FINAL_EXTRAS.purr, source: 'story' });
});
