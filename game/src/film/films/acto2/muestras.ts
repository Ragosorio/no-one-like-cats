/**
 * ACTO II — DEV samples of the briefing template dressed for the act's boxes (the stages of Superhéroes and Anime are
 * not in regiones.json yet): `?film=plantilla_s1` (CIUDAD MAYÚSCULA) and `?film=plantilla_a1` (MAR SHŌNEN). Not in
 * production. The rule lines are the script's own tutorial lines (h75 S-1, h79 A-1).
 */
import type { BriefingData } from '../../../app/stageIntro';
import { registerFilm } from '../../registry';
import { briefingFilm } from '../plantilla';

const SAMPLES: (Omit<BriefingData, 'estimate'> & { id: string })[] = [
  {
    id: 'plantilla_s1',
    battleId: 'p3d_superheroes_1',
    dim: 'p3d_superheroes',
    n: 1,
    node: '1',
    kind: 'normal',
    tag: 'CIUDAD MAYÚSCULA · S-1',
    dimName: 'CIUDAD MAYÚSCULA',
    title: 'La señal',
    pasa: 'La Gato-señal ilumina dónde cayó el chiquito. Seguimos sus huellas por las azoteas.',
    rival: { name: 'Un pandillero del Ovillo', line: '¡Aquí mandamos nosotros!', slug: 'milvidas_shadow_cat', crew: [] },
    rule: { lines: ['Aquí los golpes hacen ruido. Y el ruido se queda: escóndete detrás de las letras.'], demo: null },
    stakes: 'Si perdemos, solo perdemos tiempo. La caja sigue aquí.',
    huellas: 3,
  },
  {
    id: 'plantilla_a1',
    battleId: 'p3d_anime_1',
    dim: 'p3d_anime',
    n: 1,
    node: '1',
    kind: 'normal',
    tag: 'MAR SHŌNEN · A-1',
    dimName: 'MAR SHŌNEN',
    title: 'La convocatoria',
    pasa: 'Las huellas de Cerito entran a la arena. Para llegar a la final hay que pelear.',
    rival: { name: 'Kage, el convocado', line: '¡Sin gritar no cuenta!', slug: 'kage_ninja_cat', crew: [] },
    rule: { lines: ['Cuando estés en las últimas, grita: aquí gritar sirve.'], demo: null },
    stakes: 'Si perdemos, solo perdemos tiempo. La arena sigue abierta.',
    huellas: 3,
  },
];
export function registerActo2Samples() {
  for (const s of SAMPLES) {
    const { id, ...d } = s;
    registerFilm({ ...briefingFilm({ ...d, estimate: () => ({ p: 0.68, done: 40, total: 40, reasons: [], tips: [], details: [] }) } as BriefingData), id });
  }
}
