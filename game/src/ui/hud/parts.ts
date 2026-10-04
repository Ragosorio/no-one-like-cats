/** Shared HUD building blocks. */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../theme';
import { txt } from '../widgets';
import { sfx } from '../../core/audio';

/** offset-shadow poster card */
export function card(w: number, h: number, color: number = C.paper, off = 6, border = 3) {
  return new Graphics().rect(off, off, w, h).fill(C.ink).rect(0, 0, w, h).fill(color).stroke({ width: border, color: C.ink, alignment: 1 });
}

/** make any container a pressable button with squash (+ hover lift when a separate face is given) */
export function pressable(c: Container, onTap: () => void, o: { sound?: boolean; face?: Container } = {}) {
  const face = o.face;
  const baseY = face ? face.y : 0;
  c.eventMode = 'static';
  c.cursor = 'pointer';
  c.on('pointerover', () => {
    if (face) gsap.to(face, { y: baseY - 3, duration: 0.12, ease: 'power2.out' });
    sfx('hover');
  });
  c.on('pointerout', () => {
    if (face) gsap.to(face, { y: baseY, duration: 0.15 });
  });
  c.on('pointerdown', (e) => {
    e.stopPropagation();
    const t = face ?? c;
    gsap.fromTo(t.scale, { x: 0.94, y: 0.94 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
  });
  c.on('pointertap', (e) => {
    e.stopPropagation();
    if (o.sound !== false) sfx('click');
    onTap();
  });
}

export function label(text: string, size = 20, fill: number = C.ink, font: string = F.bebas, extra: Record<string, unknown> = {}): Text {
  return txt(text, { fontFamily: font, fontSize: size, fill, letterSpacing: 1, ...extra });
}

/** blend helper for the momentum heat */
export function lerpColor(a: number, b: number, t: number) {
  t = Math.max(0, Math.min(1, t));
  const r = ((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t;
  const g = ((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t;
  const bl = (a & 255) * (1 - t) + (b & 255) * t;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl);
}

/** white → yellow → pink → red as momentum goes 1 → 3 */
export function heatColor(m: number) {
  const t = Math.max(0, Math.min(1, (m - 1) / 2));
  if (t < 0.25) return lerpColor(0xffffff, C.yellow, t / 0.25);
  if (t < 0.6) return lerpColor(C.yellow, C.pinkHot, (t - 0.25) / 0.35);
  return lerpColor(C.pinkHot, C.red, (t - 0.6) / 0.4);
}

/** pentatonic coin ladder (storyboard h): rises per coin, wraps with a sparkle */
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
let streak = 0;
let streakAt = 0;
export function coinPitch() {
  const now = performance.now();
  if (now - streakAt > 1200) streak = 0;
  streakAt = now;
  const semi = PENTA[streak % PENTA.length] + Math.floor(streak / PENTA.length) * 0;
  streak++;
  return Math.pow(2, semi / 12);
}
