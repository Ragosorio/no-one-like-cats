/**
 * Parte II · Oleada 2: REGISTRO 000's card gains a line once Corona Celeste was seen (guion 13 · «Visto: Corona
 * Celeste», aunque nunca lo viste ahí). Derived from mission progress (H45 done, or its part c seen), so it is there
 * after a reload and comes back after the Parte II narrative reset when the story reaches it again.
 *
 * It's written like Oleada 1's marks on that card and on the CARTA: a hand that isn't anyone's (blue-black ink,
 * cine/scenes/margen.ts HAND). The first time you open the card after it appears, the ink is FRESH: it writes
 * itself and glistens while it dries (beat key `b45_corona#dex`, Parte II: the narrative reset replays it).
 * panels/collection/registro000.ts calls addRegistroO2Line (one line there).
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { G } from '../../state/game';
import { beatSeen, markBeat } from '../../state/ext/story';
import { settings } from '../../core/settings';
import { sfx } from '../../core/audio';
import { F } from '../theme';
import { txt } from '../widgets';
import { REGISTRO_O2_LINE } from './rupturasScriptO2';

/** the hand nobody in your island has (same ink as the margin notes of Oleada 1) */
const HAND = 0x24224f;
export const REGISTRO_O2_FRESH = 'b45_corona#dex';

/** pure: the O2 line of the card for this save (null = not yet) */
export function registroO2LineFor(s: { missions?: { done: string[] }; beatsSeen?: string[] } | null | undefined): string | null {
  if (!s?.missions) return null;
  return s.missions.done.includes('H45') || (s.beatsSeen ?? []).includes('b45_corona#c') ? REGISTRO_O2_LINE : null;
}

/** draw the line at (x, y) in `parent`; returns its height (0 = nothing to draw) */
export function addRegistroO2Line(parent: Container, x: number, y: number, maxW: number): number {
  const line = registroO2LineFor(G.s);
  if (!line) return 0;
  const t = txt(line, { fontFamily: F.brush, fontSize: 34, fill: HAND, padding: 12 }) as Text;
  t.position.set(x, y);
  t.rotation = -0.025;
  if (t.width > maxW) t.scale.set(maxW / t.width);
  parent.addChild(t);
  if (beatSeen(REGISTRO_O2_FRESH)) return t.height;
  // fresh ink: it writes itself left to right, then a wet sheen dries off it
  markBeat(REGISTRO_O2_FRESH);
  G.save();
  const mask = new Graphics().rect(0, 0, 1, t.height + 20).fill(0xffffff);
  mask.position.set(x - 6, y - 10);
  parent.addChild(mask);
  t.mask = mask;
  const sheen = txt(line, { fontFamily: F.brush, fontSize: 34, fill: 0x7a86ff, padding: 12 }) as Text;
  sheen.position.copyFrom(t.position);
  sheen.rotation = t.rotation;
  sheen.scale.copyFrom(t.scale);
  sheen.alpha = 0.55;
  sheen.mask = mask;
  parent.addChild(sheen);
  const w = t.width + 24;
  const dur = settings.reduceMotion ? 0.3 : 1.6;
  const o = { k: 0 };
  gsap.to(o, {
    k: 1,
    duration: dur,
    delay: 0.45,
    ease: 'none',
    onStart: () => sfx('paper', 0.6),
    onUpdate: () => {
      if (mask.destroyed) return;
      mask.clear().rect(0, 0, Math.max(1, w * o.k), t.height + 20).fill(0xffffff);
    },
    onComplete: () => {
      if (sheen.destroyed) return;
      gsap.to(sheen, { alpha: 0, duration: 2.6, ease: 'sine.in', onComplete: () => !sheen.destroyed && sheen.destroy() });
    },
  });
  return t.height;
}
