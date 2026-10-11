/**
 * H38 «Un sombrero nuevo» (cine h38_almirante, island): Canelo becomes CANELO ALMIRANTE — a transformation, not a
 * popup. Coordinated with app/formsFlow.ts (its reveal card is this scene's last beat; the flow waits for it).
 *
 * Feel: pride, slapstick. Home, the light gathers on Canelo (a spotlight look); LIKY FIGHT comes in from its last
 * build; his golden page falls from the sky like a leaf and its last line writes itself («…y el último cañonazo fue
 * suyo.»); the page wraps him in paper strips; on the song's CLIMAX downbeat he bursts out WITH THE HAT (¡A BABOR!).
 * The cats around him jump. Two lines of Luzterna; the form card; the last line. The first time ever he keeps the
 * hat on (you can switch back in his sheet); LIKY FIGHT goes into the Fonoteca. Lines: b38_a_babor [2..4].
 */
import { registerCine } from '../registry';
import type { CineScript } from '../types';
import { audioApi } from '../../audio/api';
import { cueBest, stingerOr, unlockMoment } from '../sound';

const B = 'b38_a_babor';
const FORM = 'canelo_almirante';
/* LIKY FIGHT's battle remix: cued 12.8 s before its climax (43.969 s), as the original's break4 was */
let cuedAt = -1;
let worn = false;

export const ALMIRANTE: CineScript = {
  id: 'h38_almirante',
  stage: 'island',
  releaseBlend: 1.5,
  replay: { title: 'Un sombrero nuevo', seen: `${B}#b`, order: 38 },
  steps: [
    { ui: { bars: true, hud: false, skip: true } },
    {
      call: async (c) => {
        worn = false;
        const { preloadCats } = await import('../../art/catArt');
        void preloadCats(['canelo_admiral_cat', 'canelo_cozy_cat']);
        // the song of Canelo (doc 18: LIKY FIGHT = Canelo), its battle remix: the original belongs to a Momento; its climax is the hat
        const ref = cueBest(['liky_fight.battle'], { at: 43.969 - 12.8, quantize: 'now', fadeIn: 0.6 });
        cuedAt = ref ? c.now : -1;
        if (ref) c.own(() => audioApi.release(3));
        else audioApi.setState('silence', { fade: 1.5 });
      },
    },
    { camera: { to: 'canelo', zoom: 1.1, dur: 2.2, ease: 'inOut' } },
    // the BEFORE: the painting he had (even if he already wears the hat: this is the story of it)
    { fx: { id: 'stand', who: 'canelo', slug: 'canelo_cozy_cat' } },
    { world: { to: { exposure: 0.8, tint: 0xffe4c4, saturation: 1.04, vignette: 0.6, lights: 0.35, dayLife: 0.3 }, dur: 2.2 }, async: true },
    { fx: { id: 'page', do: 'fall', at: 'canelo', text: '«…y el último cañonazo fue suyo.»' } },
    { actor: { who: 'near:canelo', do: 'look', arg: 'canelo', dur: 9, stagger: 0.15 }, after: 0.4 },
    { wait: 4.4 },
    { fx: { id: 'page', do: 'wrap' } },
    { fx: { id: 'shake', k: 0.12 }, reduced: 'skip', after: 1.2 },
    // on the climax downbeat (12.8 s after the cue: this step starts ~8.2 s in), or a beat later without music
    { audio: { sync: 'section:climax', maxWait: 5.2 }, when: () => cuedAt >= 0 },
    { wait: 1.2, when: () => cuedAt < 0 },
    {
      parallel: [
        { fx: { id: 'page', do: 'burst' } },
        { fx: { id: 'swap', slug: 'canelo_admiral_cat' } },
        { call: (c) => void (!c.skipping && cuedAt < 0 && stingerOr('reveal')) },
        { fx: { id: 'shake', k: 0.3 }, reduced: 'skip' },
        { world: { to: { exposure: 1.02, tint: 0xfff3dc, vignette: 0.25, lights: 0.1, dayLife: 1 }, dur: 0.5, ease: 'out' } },
        { actor: { who: 'near:canelo', do: 'hop', stagger: 0.08 }, at: 0.3 },
        { actor: { who: 'near:canelo', do: 'mark', arg: '!', stagger: 0.08 }, at: 0.2 },
      ],
    },
    { wait: 1.4 },
    { say: { beat: B, lines: [2, 3] } },
    { persist: { beat: `${B}#b` } },
    {
      // the story says he has a hat now: the first time ever, he keeps it on (free to switch back in his sheet)
      call: async (c) => {
        if (c.replay) return;
        const [{ FORMS }, forms] = await Promise.all([import('../../data/rupturas/formas'), import('../../state/sys/forms')]);
        const f = FORMS.find((x) => x.id === FORM);
        const owner = f ? forms.formOwner(f) : undefined;
        if (f && owner && forms.formUnlocked(f) && forms.formIsNew(f) && !owner.form) worn = forms.setForm(owner, FORM) === 'ok';
        forms.markFormRevealed(FORM);
        unlockMoment(['liky_fight.battle']);
      },
    },
    // the form card (app/formsFlow.ts) closes the transformation
    {
      call: async (c) => {
        if (c.skipping) return;
        const [{ FORMS }, flow] = await Promise.all([import('../../data/rupturas/formas'), import('../../app/formsFlow')]);
        const f = FORMS.find((x) => x.id === FORM);
        if (f) await flow.revealForm(f, { replay: c.replay, worn, scene: true });
      },
    },
    { say: { beat: B, lines: [4] } },
    { wait: 0.6 },
  ],
};

registerCine(ALMIRANTE);
