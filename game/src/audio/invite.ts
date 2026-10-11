/**
 * The Parte II sound invitation (decision logic; the card itself is inviteUi.ts, lazy-loaded).
 *
 *   await ensureAudioInvited()   // 'on' | 'off'
 *   audioInvite()                // same, fire-and-forget friendly
 *
 * Shown ONCE ever (settings.soundInvite remembers the answer), at the moment the OPENING agent picks
 * (right before Part II's first big audiovisual event). Never shown when the sound is already on
 * (context running, not muted, master and music up). Accepting unmutes and unlocks the AudioContext
 * inside the click handler itself.
 */
import { audio, applyMix } from '../core/audio';
import { VOL_DEFAULTS, saveSettings, settings } from '../core/settings';

export type InviteAnswer = 'on' | 'off';

export interface InviteDeps {
  /** the player hears the game right now */
  audible(): boolean;
  /** the stored answer, null if never asked */
  answered(): InviteAnswer | null;
  /** show the card; resolves with the choice */
  show(): Promise<InviteAnswer>;
}

/** sound is effectively on (nothing to invite to) */
export function soundIsOn() {
  return audio.running && !settings.muted && (settings.vol.master ?? 1) > 0.04 && (settings.vol.music ?? 1) > 0.04;
}

/** the once-only gate (pure; tests/audio.test.ts drives it with fakes) */
export function makeInviter(d: InviteDeps) {
  let pending: Promise<InviteAnswer> | null = null;
  return function ensure(): Promise<InviteAnswer> {
    if (d.audible()) return Promise.resolve('on');
    const a = d.answered();
    if (a) return Promise.resolve(a);
    if (!pending) pending = d.show().finally(() => (pending = null));
    return pending;
  };
}

/** «Encender el sonido» — MUST run inside the click handler (it resumes the AudioContext) */
export function acceptSound() {
  settings.muted = false;
  if ((settings.vol.master ?? 0) < 0.15) settings.vol.master = VOL_DEFAULTS.master;
  if ((settings.vol.music ?? 0) < 0.15) settings.vol.music = VOL_DEFAULTS.music;
  settings.soundInvite = 'on';
  audio.unlock();
  applyMix();
  saveSettings();
}
/** «Seguir en silencio» */
export function declineSound() {
  settings.soundInvite = 'off';
  saveSettings();
}

export const ensureAudioInvited = makeInviter({
  audible: soundIsOn,
  answered: () => settings.soundInvite,
  show: async () => {
    try {
      const ui = await import('./inviteUi');
      return await ui.showInvite();
    } catch (e) {
      console.error('[audio] invitación', e);
      return 'off';
    }
  },
});

/** call right before Part II's first big audiovisual moment (no-op after the first answer) */
export function audioInvite(): Promise<InviteAnswer> {
  return ensureAudioInvited();
}
