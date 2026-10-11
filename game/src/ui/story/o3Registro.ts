/**
 * Parte II · Oleada 3: REGISTRO 000's card gains a line once the seal broke (H53 «Canelo Astral»: Canelo is the only one
 * who can see it, and he says nothing — guion 13). Same hand and same «fresh ink» as Oleada 1's marks and Oleada 2's
 * line (ui/story/o2Registro.ts): derived from mission progress (H53 done, or its part c seen), so it is there after a
 * reload and comes back after the Parte II narrative reset when the story reaches it again. The first time you open the
 * card after it appears, the ink writes itself and dries (beat key `b53_canelo#dex`, Parte II: the reset replays it).
 * panels/collection/registro000.ts calls addRegistroO3Line (one line there, under Oleada 2's).
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { G } from '../../state/game';
import { beatSeen, markBeat } from '../../state/ext/story';
import { settings } from '../../core/settings';
import { sfx } from '../../core/audio';
import { F } from '../theme';
import { txt } from '../widgets';
import { REGISTRO_O3_LINE } from './rupturasScriptO3';

const HAND = 0x24224f;
export const REGISTRO_O3_FRESH = 'b53_canelo#dex';

/** pure: the O3 line of the card for this save (null = not yet) */
export function registroO3LineFor(s: { missions?: { done: string[] }; beatsSeen?: string[] } | null | undefined): string | null {
  if (!s?.missions) return null;
  return s.missions.done.includes('H53') || (s.beatsSeen ?? []).includes('b53_canelo#c') ? REGISTRO_O3_LINE : null;
}

/** draw the line at (x, y) in `parent`; returns its height (0 = nothing to draw) */
export function addRegistroO3Line(parent: Container, x: number, y: number, maxW: number): number {
  const line = registroO3LineFor(G.s);
  if (!line) return 0;
  const t = txt(line, { fontFamily: F.brush, fontSize: 30, fill: HAND, padding: 12 }) as Text;
  t.position.set(x, y);
  t.rotation = 0.018;
  if (t.width > maxW) t.scale.set(maxW / t.width);
  parent.addChild(t);
  if (beatSeen(REGISTRO_O3_FRESH)) return t.height;
  markBeat(REGISTRO_O3_FRESH);
  G.save();
  const mask = new Graphics().rect(0, 0, 1, t.height + 20).fill(0xffffff);
  mask.position.set(x - 6, y - 10);
  parent.addChild(mask);
  t.mask = mask;
  const sheen = txt(line, { fontFamily: F.brush, fontSize: 30, fill: 0x7a86ff, padding: 12 }) as Text;
  sheen.position.copyFrom(t.position);
  sheen.rotation = t.rotation;
  sheen.scale.copyFrom(t.scale);
  sheen.alpha = 0.55;
  sheen.mask = mask;
  parent.addChild(sheen);
  const w = t.width + 24;
  const o = { k: 0 };
  gsap.to(o, {
    k: 1,
    duration: settings.reduceMotion ? 0.3 : 1.6,
    delay: 0.9,
    ease: 'none',
    onStart: () => sfx('paper', 0.6),
    onUpdate: () => {
      if (!mask.destroyed) mask.clear().rect(0, 0, Math.max(1, w * o.k), t.height + 20).fill(0xffffff);
    },
    onComplete: () => {
      if (!sheen.destroyed) gsap.to(sheen, { alpha: 0, duration: 2.6, ease: 'sine.in', onComplete: () => !sheen.destroyed && sheen.destroy() });
    },
  });
  return t.height;
}
