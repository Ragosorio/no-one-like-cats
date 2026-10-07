/**
 * Parte 2 — how the six multiverse shots LOOK in BattleScene (rules live in battle/multiverso.ts):
 * icicle (Hielo), light ray (Luz), nothing at all until it lands (Sombra), sound rings (Sonido),
 * a little clock (Tiempo) and a static hole (Vacío). Pure drawing helpers, no state.
 */
import { Graphics } from 'pixi.js';
import type { ShotDef } from '../types';
import { C } from '../../ui/theme';

type Fx = { main: number; accent: number; dark: number };

/** Sombra: the projectile can't be seen until it hits */
export function p2Hidden(shot: ShotDef) {
  return shot.element === 'shadow';
}

/** draw the projectile core for the new elements; false = use the classic look */
export function p2Projectile(shot: ShotDef, core: Graphics, fx: Fx): boolean {
  switch (shot.element) {
    case 'ice':
      core.poly([-20, -6, 10, -8, 24, 0, 10, 8, -20, 6, -12, 0]).fill(0xeaf6ff).stroke({ width: 4, color: C.ink, join: 'miter' });
      core.moveTo(-14, 0).lineTo(16, 0).stroke({ width: 2, color: 0x4fa3d9 });
      return true;
    case 'light':
      core.roundRect(-26, -5, 52, 10, 5).fill(0xffffff).stroke({ width: 4, color: C.ink });
      core.roundRect(-18, -2, 36, 4, 2).fill(0xffd77a);
      return true;
    case 'sound':
      for (let i = 0; i < 3; i++) core.arc(-6 + i * 7, 0, 8 + i * 6, -0.9, 0.9).stroke({ width: 5 - i, color: i ? fx.accent : C.ink, cap: 'round' });
      core.circle(-8, 0, 6).fill(fx.main).stroke({ width: 3, color: C.ink });
      return true;
    case 'time':
      core.circle(0, 0, 13).fill(0xd9c29a).stroke({ width: 4, color: C.ink });
      core.moveTo(0, 0).lineTo(0, -8).moveTo(0, 0).lineTo(6, 2).stroke({ width: 2.5, color: C.ink, cap: 'round' });
      core.circle(0, -15, 3).fill(0xe0b77a).stroke({ width: 2, color: C.ink });
      return true;
    case 'void':
      core.circle(0, 0, 14).fill(0x0d110f).stroke({ width: 4, color: 0xff2e88 });
      core.circle(0, 0, 7).stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
      return true;
    case 'shadow':
      core.circle(0, 0, 12).fill(0x0d110f).stroke({ width: 3, color: 0xc8102e });
      return true;
  }
  return false;
}

/**
 * trail of the new trajectories (light ray = solid beam, sound = expanding rings, void = static).
 * Returns true when it drew something (the classic beam/gust trail is skipped).
 */
export function p2Trail(trail: Graphics, shot: ShotDef, hist: { x: number; y: number }[][], done: boolean[], frame: number): boolean {
  const el = shot.element;
  if (el !== 'light' && el !== 'sound' && el !== 'void') return false;
  hist.forEach((hs, pi) => {
    if (done[pi] || hs.length < 2) return;
    if (el === 'light') {
      for (const [w, col, a] of [
        [16, 0xffd77a, 0.35],
        [8, 0xffffff, 0.9],
      ] as const) {
        trail.moveTo(hs[0].x, hs[0].y);
        for (const h of hs) trail.lineTo(h.x, h.y);
        trail.stroke({ width: w, color: col, alpha: a, cap: 'round' });
      }
    } else if (el === 'sound') {
      for (let k = 0; k < hs.length; k += 3) {
        const r = 6 + (hs.length - k) * 1.6 + (frame % 4);
        trail.circle(hs[k].x, hs[k].y, r).stroke({ width: 3, color: k % 2 ? 0xffd400 : 0xff2e88, alpha: 0.75 });
      }
    } else {
      for (let k = 0; k < hs.length; k += 2) {
        const j = ((k * 7 + frame) % 5) - 2;
        trail.rect(hs[k].x - 6 + j * 2, hs[k].y - 3 + j, 12, 3).fill({ color: k % 3 ? 0xffffff : 0xff2e88, alpha: 0.7 });
      }
    }
  });
  return true;
}

/** onomatopoeia + color of the new elements' impacts */
export const P2_ONO: Record<string, [string, number]> = {
  light: ['¡SHIIIN!', 0xffd77a],
  shadow: ['¡SHK!', 0xc8102e],
  sound: ['¡BWOOOM!', 0xff2e88],
  time: ['¡TIC-TAC!', 0xe0b77a],
};
