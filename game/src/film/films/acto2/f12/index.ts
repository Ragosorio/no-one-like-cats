/**
 * F12 · PH «Cerito» (H78 ♥, the act's breather; guion: historia-v2/guiones/acto-2/h78-cerito.md).
 *
 * STYLE: a NATURE DOCUMENTARY IN NIGHT VISION — phosphor green, grain, a telephoto with little focus, a running
 * timecode, the scientific name in a subtitle, and Luzterna's WHISPERED narration in italic subtitles (no voice). Why:
 * it's tender and funny, and it plants the end — in night vision the cats' eyes shine on their own. Canelo doesn't
 * talk at home: he meows. 80 s · 1 optional click (where the blanket goes: the lighthouse or Canelo's palm — MECÁNICAS
 * saves `b78_cobija` from FilmResult.inputs.cobija: 'left' = faro, 'right' = palmera) · xti.pad («Pad de la noche»,
 * very low; it loops in bars under the 80 s, filmEdit).
 *
 *   D1   0–5    the island in green, the lighthouse beam a white band · «Aquí, en su hábitat natural…»
 *   D2   5–12   the autofocus hunts and finds a speck of static at the edge of the light · Registrum zero zero zero
 *   D3   12–18  a step into the beam — he gets scared (the static bristles), jumps back · «Se asusta. Retrocede. Típico.»
 *   D4   18–24  Canelo by the palm: HIS EYES SHINE ON THEIR OWN · «Ellos no necesitan cámara, Capi. Ven en lo oscuro.»
 *   D5   24–32  his eyes close… Cerito's outline loses its ink; they snap open — Cerito redraws           v2-c
 *   D6   32–40  a paw into the light: the static calms; pearl grey, the white ring on his forehead · «…Shhh.»
 *   D7   40–46  he curls up and sleeps · «Te voy a decir Cerito.» — the scientific name is crossed out → «Cerito»
 *   D8   46–54  her beam lifts a tiny blanket: ¿EL FARO o LA PALMERA? (click) — it floats there, Cerito follows
 *   D9   54–62  a blanket for the gordo too; he meows and covers up to the nose, eyes open
 *   D10  62–74  close on her, almost white: «¿Sabes por qué nunca apago la linterna?» «Me da miedo la oscuridad.»
 *               «Una farera miedosa. Qué chiste.» (paid in H85, not saved for the end [TEMP-P2])
 *   D11  74–79  the island: Cerito asleep where the blanket went, Canelo's eyes shining · «Cerito: población, 1.»
 *   D12  79–80  the night vision switches off like an old TV
 */
import type { FilmDef, FilmSceneDef } from '../../../types';
import { choice, at, v } from '../../../../momentos/score';
import { MUSIC } from '../music';

const S = () => import('./sets');
const T = { isla: 0, orilla: 5, ojos: 18, borra: 24, toca: 32, cobija: 46, cobija2: 54, confesion: 62, final: 74, end: 80 } as const;
const sc = (id: keyof typeof T, next: keyof typeof T, extra: Partial<FilmSceneDef>): FilmSceneDef => ({
  id,
  dur: T[next] - T[id],
  style: 'nocturna',
  set: () => S().then((m) => (m as unknown as Record<string, unknown>)[id]),
  in: { kind: 'cut', dur: 0 },
  ...extra,
});
const N = 'davinci' as const;

export const F12: FilmDef = {
  id: 'f12',
  title: 'Cerito',
  kind: 'interlude',
  track: MUSIC.f12,
  loader: { style: 'default', caption: 'DOCUMENTAL' },
  scenes: [
    sc('isla', 'orilla', {
      in: { kind: 'fade', dur: 0.8, color: 0x000000 },
      weather: [{ kind: 'wind', particle: 'dust', amount: 0.25, seed: 3 }],
      cam: [
        { t: 0, x: 960, y: 560, fov: 1.0, hand: 0.8 },
        { t: 5, fov: 1.06, ease: 'linear' },
      ],
      subs: [{ t: 1.9, dur: 2.8, text: '«Aquí, en su hábitat natural…»', style: N }],
    }),
    sc('orilla', 'ojos', {
      cam: [
        { t: 0, x: 1040, y: 690, fov: 2.6, focus: 2200, hand: 0.6 },
        { t: 1.2, focus: 600, ease: 'inOut' },
        { t: 2.2, focus: 1500, ease: 'inOut' },
        { t: 3.0, focus: 1000, ease: 'inOut' },
        { t: 13, x: 1020, y: 700, fov: 2.7, ease: 'linear' },
      ],
      camRm: [{ t: 0, x: 1040, y: 690, fov: 2.6, focus: 1000 }],
      subs: [
        { t: 3.9, dur: 3.4, text: '«…el REGISTRO 000. Tímido. Nocturno. Rompe cosas.»', style: N },
        { t: 8.1, dur: 3.2, text: '«Se asusta. Retrocede. Típico.»', style: N },
      ],
    }),
    sc('ojos', 'borra', {
      cam: [
        { t: 0, x: 1420, y: 640, fov: 2.4, hand: 0.6 },
        { t: 6, x: 1420, y: 620, fov: 2.55, ease: 'linear' },
      ],
      subs: [
        { t: 0.6, dur: 2.2, text: '«Y aquí, el gordo.»', style: N },
        { t: 2.9, dur: 3.1, text: '«Ellos no necesitan cámara, Capi. Ven en lo oscuro.»', style: N },
      ],
    }),
    sc('borra', 'toca', {
      cam: [{ t: 0, x: 1010, y: 730, fov: 1.8, focus: 1000 }],
      subs: [{ t: 2.0, dur: 3.6, text: '«Si el gordo deja de verlo… se borra un poquito.»', style: N }],
    }),
    sc('toca', 'cobija', {
      cam: [
        { t: 0, x: 1040, y: 700, fov: 2.6 },
        { t: 3, x: 1010, y: 700, fov: 2.8, ease: 'inOut' },
      ],
      subs: [
        { t: 4.8, dur: 1.6, text: '«…Shhh.»', style: N },
        { t: 10.4, dur: 3.0, text: '«Te voy a decir Cerito.»', style: N },
      ],
    }),
    sc('cobija', 'cobija2', {
      cam: [{ t: 0, x: 960, y: 600, fov: 1.0 }],
      subs: [{ t: 0.4, dur: 2.4, text: '«¿Dónde la quiere el señor?»', style: N }],
    }),
    sc('cobija2', 'confesion', {
      cam: [
        { t: 0, x: 940, y: 640, fov: 1.45 },
        { t: 8, x: 1000, y: 650, fov: 1.55, ease: 'linear' },
      ],
      subs: [{ t: 1.2, dur: 3.4, text: '«Y al gordo también. Que se le enfría la panza.»', style: N }],
    }),
    sc('confesion', 'final', {
      cam: [
        { t: 0, x: 960, y: 700, fov: 1.45 },
        { t: 12, x: 960, y: 680, fov: 1.62, ease: 'linear' },
      ],
      subs: [
        { t: 0.6, dur: 3.0, text: '«¿Sabes por qué nunca apago la linterna?»', style: N },
        { t: 4.4, dur: 2.6, text: '«Me da miedo la oscuridad.»', style: N },
        { t: 8.0, dur: 3.2, text: '«Una farera miedosa. Qué chiste.»', style: N },
      ],
    }),
    sc('final', 'end', {
      cam: [
        { t: 0, x: 960, y: 640, fov: 2.2 },
        { t: 3.0, x: 960, y: 560, fov: 0.98, ease: 'inOut' },
      ],
      camRm: [{ t: 0, x: 960, y: 560, fov: 0.98 }],
    }),
  ],
  score: [
    choice(T.cobija + 2.4, { id: 'cobija', fallback: 'left', until: T.cobija + 4.6, label: '¿DÓNDE?', anchor: [960, 200] }, { left: [], right: [] }),
    at(T.isla + 0.4, v('sound', { name: 'tick', pitch: 0.7 })),
    at(T.borra + 4.4, v('sound', { name: 'glitch', pitch: 0.6 })),
    at(T.cobija2 + 4.6, v('sound', { name: 'meow', pitch: 1.1 })),
    at(T.final + 5.3, v('sound', { name: 'tick', pitch: 0.5 })),
  ],
  close: { kind: 'fade', dur: 0.4, color: 0x000000 },
};
