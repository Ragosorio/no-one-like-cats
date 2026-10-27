/**
 * F23 · PC No wey «El expediente» (H87, closes the Correctors' battle) — the song COMPLETE (3:47; `no_wey`, an owner
 * original: only here and in the Fonoteca) and, with a SEGUE at c65 (`no_wey.puente`: the same audio until c69, then
 * DISTOR's isle creeps in at 111 BPM, 3:2, F♯m both), the ~8.6 s bridge into H88: 229.2 s in all. One long take of the
 * dock cut on the bars (camera holds), ink noir with one warm colour. 3 optional clicks: ¡REBOTA! (a clap of c9–17:
 * the bounce is bigger), FÓRMENSE (c25: the cats line up now; without it, at c27), SUBRAYA (c70: a brighter underline).
 * The crew's trial and Canelo's sentence (S3, R5) — never her apotheosis.
 */
import type { FilmDef } from '../../../types';
import type { CamKey } from '../../../types';
import { tap, v } from '../../../../momentos/score';
import { nw as c, NW_BEAT } from '../kit/t';

const sets = () => import('./sets');
type Frame = Omit<CamKey, 't' | 'ease'>;
/** a cut on a bar: the camera jumps to this framing, then optional moves */
const shotAt = (t: number, fr: Frame, ...moves: CamKey[]): CamKey[] => [{ t, x: 960, y: 540, z: 0, fov: 1, roll: 0, hand: 0, ...fr, ease: 'hold' }, ...moves];
const LEN = c(65) + 21.622;

const CAM: CamKey[] = [
  // N1: wide on the dock in noir, a slow dolly toward the bow
  ...shotAt(0.001, { x: 1150, y: 520, z: -140 }, { t: c(5) - 0.02, x: 860, z: 80, ease: 'sine' }),
  // N3 (c5, the bass): close on her — she lifts her head
  ...shotAt(c(5), { x: 790, y: 420, z: 520 }, { t: c(6), z: 560, ease: 'sine' }),
  // N4: the reverse — the white cannons turn to her, all at once
  ...shotAt(c(6), { x: 1500, y: 440, z: 280 }, { t: c(9) - 0.02, x: 1420, z: 320, ease: 'linear' }),
  // N5–N7: the rays bounce (wide), the charge on the right
  ...shotAt(c(9), { x: 1000, y: 540, z: 0 }, { t: c(13) - 0.02, x: 1020, z: 60, ease: 'linear' }),
  // N8: close on her smile — «Culpable.»
  ...shotAt(c(13), { x: 780, y: 440, z: 460 }),
  // N9: the burst (handheld)
  ...shotAt(c(14), { x: 1100, y: 520, z: 60, hand: 6 }, { t: c(17) - 0.02, x: 1180, z: 140, ease: 'linear' }),
  // N10: everything still; the placards
  ...shotAt(c(17), { x: 1260, y: 470, z: 160 }),
  // N11: she laughs, silently
  ...shotAt(c(18), { x: 780, y: 440, z: 460 }),
  // N12–N14: the charges 2 and 3 (medium, the card on the right)
  ...shotAt(c(19), { x: 920, y: 540, z: 100 }, { t: c(25) - 0.02, x: 960, z: 160, ease: 'linear' }),
  // N15: the line forms behind her (wide, a slow pan)
  ...shotAt(c(25), { x: 640, y: 640, z: 0 }, { t: c(27) - 0.02, x: 760, ease: 'sine' }),
  // N16: Canelo in the line, 60 % — he shakes his scarf and stands straight
  ...shotAt(c(27), { x: 600, y: 760, z: 380 }),
  // N17: her light BURNS the gutter — full bleed; the searchlight sweeps the fleet
  ...shotAt(c(29), { x: 1100, y: 520, z: -80 }, { t: c(33) - 0.02, x: 1180, z: 0, ease: 'linear' }),
  // N19: La Mano on the shore, in the fog
  ...shotAt(c(33), { x: 300, y: 480, z: 240, fov: 1.15 }),
  // N20 (the late kick): close on La Mano — she lowers her paw, writes; looks at Canelo
  ...shotAt(c(33.3495) + 0.25, { x: 190, y: 420, z: 560, fov: 1.5 }),
  // N21: wide battle
  ...shotAt(c(35), { x: 1300, y: 480, z: 60, hand: 4 }),
  // N22: charge 5 (medium)
  ...shotAt(c(37), { x: 920, y: 540, z: 100 }),
  // N22b: CHARGE 6 falls on Canelo
  ...shotAt(c(39), { x: 660, y: 680, z: 300 }),
  // N23: the cats fire guided by her light (handheld)
  ...shotAt(c(41), { x: 1000, y: 520, z: 0, hand: 6 }, { t: c(45) - 0.02, x: 1100, z: 80, ease: 'linear' }),
  // N24: the two of them at the front, side by side (still)
  ...shotAt(c(45), { x: 820, y: 640, z: 360 }),
  // N25: the reverse — the line looks at both
  ...shotAt(c(47), { x: 420, y: 760, z: 300 }),
  // N26: «Dale, Luz.»
  ...shotAt(c(49), { x: 820, y: 640, z: 360 }),
  // N27: she raises the lantern
  ...shotAt(c(51), { x: 780, y: 470, z: 420 }),
  // N28: the crane up over the dock; the final sweep
  ...shotAt(c(53), { x: 1100, y: 720, z: 0 }, { t: c(55), y: 400, z: -160, ease: 'inOut' }),
  // N29: the dossier (overlay); N30: the cats celebrate
  ...shotAt(c(59), { x: 500, y: 760, z: 240, hand: 2 }),
  // N31–N36: the dark sea; the light writes NO, WEY.
  ...shotAt(c(61), { x: 900, y: 620, z: -40 }, { t: c(69) - 0.02, x: 920, z: 60, ease: 'linear' }),
  // N38–N41: the puddle at the frame's edge (the reflection flickers), then the monitor (overlay)
  ...shotAt(c(69) + 0.6, { x: 1320, y: 760, z: 200 }, { t: LEN, z: 240, ease: 'linear' }),
];
const CAM_RM: CamKey[] = CAM.map((k) => ({ ...k, hand: 0, roll: 0 }));

export const F23: FilmDef = {
  id: 'f23',
  title: 'El expediente',
  kind: 'song',
  track: 'no_wey',
  segue: { track: 'no_wey.puente', at: '#64', from: 0 },
  loader: { style: 'noir', caption: 'PELÍCULA' },
  scenes: [
    {
      id: 'expediente',
      dur: LEN,
      style: 'tinta',
      set: sets,
      in: { kind: 'fade', dur: 1.2, color: 0x000000 },
      weather: [{ kind: 'fog', amount: 0.45, z: 2000, color: 0xd8d8d8 }],
      cam: CAM,
      camRm: CAM_RM,
    },
  ],
  score: [
    tap(c(15) + NW_BEAT, { id: 'rebota', label: '¡REBOTA!', anchor: 'lantern', lead: 1 }, { great: [v('ring', { at: [760, 300], dur: 0.8 })], hit: [v('ring', { at: [760, 300], dur: 0.8 })], miss: [] }),
    tap(c(25), { id: 'formense', label: 'FÓRMENSE', anchor: 'line', lead: 1 }, { great: [v('sparkle', { at: [380, 760] })], hit: [v('sparkle', { at: [380, 760] })], miss: [] }),
    tap(c(70), { id: 'subraya', label: 'SUBRAYA', anchor: 'sea', lead: 1 }, { great: [v('sparkle', { at: [900, 790] })], hit: [v('sparkle', { at: [900, 790] })], miss: [] }),
  ],
  close: { kind: 'cut', dur: 0 },
};
