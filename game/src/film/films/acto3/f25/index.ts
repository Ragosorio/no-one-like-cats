/**
 * F25 · PC DISTOR «Datamosh» (H88, closes Esquirla's battle) — fragment c25 → end (2:02.4 of `distor`, an owner
 * original: only here and in the Fonoteca). DATAMOSH over the Library's watercolour, the glitch following the
 * distortion's exposure; the screen splits in two halves out of sync on c65,875. 2 optional clicks: ¡SUÉLTALO! (c43:
 * Cerito twists harder; he gets free anyway at the shift) · ¡BASTA! (c45: the letters — or the door — hold bigger).
 * Two variants by the H87 choice (the map for Brecha): `f25` (Brecha sprays BASTA) and `f25_bisagra` (Bisagra stands
 * as a door). MECÁNICAS picks the id; the film never reads the save.
 */
import type { CamKey, FilmDef } from '../../../types';
import { tap, v } from '../../../../momentos/score';
import { f25 as T } from '../kit/t';

const sets = () => import('./sets');
type Frame = Omit<CamKey, 't' | 'ease'>;
const shotAt = (t: number, fr: Frame, ...moves: CamKey[]): CamKey[] => [{ t, x: 960, y: 540, z: 0, fov: 1, roll: 0, hand: 0, ...fr, ease: 'hold' }, ...moves];
const LEN = T(82) + 0.02;

const CAM: CamKey[] = [
  // D1: wide, the forbidden section; D2 (c25,5): medium on Cerito tangled in the arm
  ...shotAt(0.001, { x: 1100, y: 520, z: -40 }),
  ...shotAt(T(25.5), { x: 1250, y: 460, z: 300, hand: 3 }, { t: T(29) - 0.02, z: 360, ease: 'linear' }),
  // D3: the travelling across the tales (the school melts into London)
  ...shotAt(T(29), { x: 800, y: 540, z: 60 }, { t: T(33) - 0.02, x: 1120, ease: 'inOut' }),
  // D4: Harry, half-melted
  ...shotAt(T(33), { x: 1100, y: 640, z: 320 }),
  // D5: Garbancito on his shelf before her; D6: close on Esquirla
  ...shotAt(T(35), { x: 1200, y: 400, z: 420 }),
  ...shotAt(T(37.5), { x: 1420, y: 300, z: 520 }),
  // D7: the lantern comes, the cone cuts the glitch
  ...shotAt(T(39), { x: 1200, y: 540, z: 40 }),
  // D8–D10: Brecha and Esquirla on the shelf; Cerito twisting
  ...shotAt(T(41), { x: 1300, y: 380, z: 300, hand: 2 }),
  ...shotAt(T(43), { x: 1320, y: 400, z: 420, hand: 3 }),
  // D11–D12: BASTA (or Bisagra) holds; the image holds
  ...shotAt(T(45), { x: 1060, y: 600, z: 40 }),
  // D13: Luzterna, Brecha, Garbancito — her light reaches Cerito
  ...shotAt(T(49), { x: 1150, y: 540, z: 80 }),
  // D14: the glitch wins (handheld); D15: the tear
  ...shotAt(T(53), { x: 1000, y: 520, z: -60, hand: 8 }),
  ...shotAt(T(57), { x: 1560, y: 460, z: 240, hand: 4 }),
  // D16: the flame drops
  ...shotAt(T(61), { x: 900, y: 740, z: 420, hand: 1 }),
  // D17: the frozen frame of the whole Library; D18→ the split (the camera holds so the halves stay halves)
  ...shotAt(T(65), { x: 960, y: 540, z: 0 }),
  // D21: pages like snow; D22 two sides of the tear; D23 her and Cerito; D24 the seam
  ...shotAt(T(69), { x: 960, y: 540, z: 0 }, { t: T(73.875) - 0.02, z: 30, ease: 'linear' }),
  ...shotAt(T(73.875), { x: 1250, y: 620, z: 160 }),
  ...shotAt(T(77.875), { x: 900, y: 620, z: 220 }),
  ...shotAt(T(80), { x: 1600, y: 560, z: 200 }, { t: LEN, z: 240, ease: 'linear' }),
];

const base = (id: string, title: string): FilmDef => ({
  id,
  title,
  kind: 'song',
  track: 'distor',
  from: '#24',
  loader: { style: 'tv', caption: 'PELÍCULA' },
  scenes: [
    {
      id: 'datamosh',
      dur: LEN,
      style: 'datamosh',
      set: sets,
      in: { kind: 'glitch', dur: 0.8, seed: 9 },
      cam: CAM,
      camRm: CAM.map((k) => ({ ...k, hand: 0 })),
    },
  ],
  score: [
    tap(T(43), { id: 'sueltalo', label: '¡SUÉLTALO!', anchor: 'cerito', lead: 1 }, { great: [v('burst', { at: [1220, 380] })], hit: [v('burst', { at: [1220, 380] })], miss: [] }),
    tap(T(45.5), { id: 'basta', label: '¡BASTA!', anchor: 'muro', lead: 1 }, { great: [v('sparkle', { at: [1100, 600] })], hit: [v('sparkle', { at: [1100, 600] })], miss: [] }),
  ],
  close: { kind: 'fade', dur: 0.4, color: 0x000000 },
});

/** with the map (Brecha sprays BASTA) — the default */
export const F25: FilmDef = base('f25', 'Datamosh');
/** without the map (Bisagra stands as a door) */
export const F25_BISAGRA: FilmDef = base('f25_bisagra', 'Datamosh');
