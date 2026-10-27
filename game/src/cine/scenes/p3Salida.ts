/**
 * H67 «¿Dónde andabas, gordo?» — the way out (docs/part-iii/04 §5, polished per 13 §3.5), on the `caja` stage
 * (scenes/CajaScene.ts, set 'calle'; the alley's acting and light: scenes/caja/calle.ts).
 *
 *   L1–L5  the door kicked open, Canelo rolls out and lands on his back; a blue light down the alley (her lantern
 *          swings as she floats); Luzterna BIG, from his eye level, leaning in: «Canelo.»; L4 his point of view: the shot
 *          turns 180° (she is upside down), then rights itself; she lifts his scarf like a leash, three hairs: «TRES».
 *   WALK   four legs, interactive, never lost (tap = she tugs the scarf; CajaScene walkStep). Each leg is different:
 *          1 the alley bends · 2 «DERECHO. DERECHO.» she grows huge, «El piso se mueve»: the floor waves ·
 *          3 «El piso no se mueve»: she stamps it flat; then close and quiet, the rain calms, her light dips a little on
 *          «ya me pasó todo» (no underline) · 4 she stops, the leash yanks him back; shot / reverse shot.
 *   V1–V5  at the cat flap painted on the wall, lit from inside: the REAL puppets as backlit silhouettes (silueta.ts:
 *          rim, scarf and lantern in color, tail flame), the color floods back when they turn to each other; V3 an
 *          insert of the scarf; V4 an insert of her sleeve keeping the orange thread; V5 he squashes through the flap
 *          and dissolves into its light, she looks back at the bar (face first): «Una noche. Ojalá.»
 *
 * After it, app/gaterasFlow.ts playSalida() goes home for the waking (p3_despierta, island — agent A).
 * Lines: data/gateras/historia.json beat b67_salida (indexes below, in script order). Every line is kept.
 */
import { registerCine } from '../registry';
import type { CineScript, Step } from '../types';
import { CALLE } from '../../momentos/songs/drunck/layout';
import { GATERA_X } from '../../momentos/songs/drunck/street';
import { cajaOf } from './p3Bar';
import { SALIDA_LINES as A } from '../../ui/story/gaterasScript';

/** b67_salida line indexes — agent A's map (ui/story/gaterasScript.ts SALIDA_LINES: the single source) */
export const SALIDA_LINES = {
  l1: A.salida[0],
  l3: A.salida[1],
  l4: A.salida[2],
  l5: A.salida[3],
  tramo1: A.tramos[0],
  tramo2: A.tramos[1],
  tramo3: A.tramos[2],
  tramo4: A.tramos[3],
  v1: A.vinculo[0],
  v2: A.vinculo[1],
  v3: A.vinculo.slice(2, 6),
  v5: A.adios[0],
} as const;
const B = 'b67_salida';
type OnLine = Record<number, Step | Step[]>;
const say = (idx: number | readonly number[], onLine?: OnLine): Step => ({ say: { beat: B, lines: typeof idx === 'number' ? [idx] : [...idx], onLine } });
type Tgt = string | { x: number; y: number };
/** a cut (no travel) */
const cut = (to: Tgt, zoom: number, offset?: [number, number]): Step => ({ camera: { to, zoom, offset, dur: 0 } });
/** a camera move (push-in, pan); «Reducir movimiento» turns it into a cut (runner) */
const move = (to: Tgt, zoom: number, offset: [number, number], dur: number, ease: 'inOut' | 'out' | 'in' = 'inOut'): Step => ({ camera: { to, zoom, offset, dur, ease } });
const dv = (id: string, to: number, dur: number, ease: 'inOut' | 'out' | 'in' | 'linear' | 'outBack' = 'inOut'): Step => ({ drive: { id, to, dur, ease } });
const fx = (id: string, o: Record<string, unknown> = {}): Step => ({ fx: { id, ...o } });
const emote = (who: string, arg: string): Step => ({ actor: { who, do: 'emote', arg } });
const look = (who: string, arg: 'left' | 'right' | 'front'): Step => ({ actor: { who, do: 'look', arg } });
/** framings (zoom, offset) measured for the 1920×1080 box with the dialog below: faces in the upper half */
const CLOSE_LUZ = (z = 1.9): Step => cut('luzterna', z, [0, 180 / z]);
const CLOSE_CAN = (z = 1.9): Step => cut('canelo', z, [20, 160 / z]);
const TWO = (z = 1.4, dx = 0): Step => cut('pareja', z, [dx, 140 / z]);
/** the four legs end at the lamp posts (CajaScene WALK_LEGS); a skipped leg lands there too */
const legEnd = (n: number) => CALLE.posts[n - 1];
const leg = (n: number): Step[] => [
  { interact: { target: `walk:${n}`, prompt: '¡TOCA!', timeout: 40 }, id: `walk${n}` },
  { drive: { id: 'walkX', to: legEnd(n), dur: 0 } },
  // she floats round to face him (if she was pushing him from behind, she comes back in front)
  { call: (c) => void (cajaOf(c).luzFace = -1) },
  { drive: { id: 'luzX', to: legEnd(n) + 330, dur: 0.5, ease: 'inOut' } },
];

export const P3_SALIDA: CineScript = {
  id: 'p3_salida',
  stage: 'caja',
  replay: { title: 'El callejón', seen: `${B}#a`, order: 67 },
  steps: [
    { ui: { bars: true, hud: false, skip: true } },
    {
      call: (c) => {
        const s = cajaOf(c);
        s.walkX = CALLE.door.x + 280;
        s.luzX = 3200;
        s.luzOn = 0;
        s.leash = 0;
        s.lying = 0;
        s.backs = 0;
        s.cross = 0;
        s.luzLook = 0;
        s.luzFace = -1;
        // the little flame at his tail tip, as usual (it matters in the silhouettes: lit)
        s.flame = 0.85;
        // he is still inside until the door flies open
        s.canHidden = true;
        s.useSet('calle');
      },
    },
    { audio: { state: 'silence', fade: 0.6 } },
    { audio: { ambience: 'rain', level: 0.6, fade: 0.8 } },
    // drunck.barra, very low (agent D's variation; nothing if it isn't in the build yet)
    {
      call: async (c) => {
        if (c.skipping) return;
        const { cueBest } = await import('../sound');
        const { audioApi } = await import('../../audio/api');
        if (cueBest(['drunck.barra'], { fadeIn: 1.5, loop: true })) c.own(() => audioApi.release(2));
      },
    },
    // ---------------------------------------------------------------- L1 — the door kicked open; Canelo rolls out
    cut('puerta', 1.25, [200, 40]),
    { wait: 0.7 },
    { drive: { id: 'door', to: 1, dur: 0.15, ease: 'out' }, id: 'L1' },
    { call: (c) => void (cajaOf(c).canHidden = false) },
    fx('roll'),
    { fx: { id: 'shake', k: 0.35 }, reduced: 'skip' },
    { drive: { id: 'lying', to: 1, dur: 0.4 }, after: 0.75 },
    // he lands on his back; stars round his head; the camera goes down to him
    { ...move('canelo', 1.6, [-40, 110], 0.8, 'out'), async: true },
    say(SALIDA_LINES.l1),
    // ---------------------------------------------------------------- L2 — low and wide: a blue light comes down the alley
    cut({ x: 1900, y: 700 }, 0.85),
    { drive: { id: 'luz', to: 1, dur: 0.8 }, async: true, id: 'L2' },
    { ...move({ x: 1300, y: 660 }, 0.95, [0, 0], 3.2), async: true },
    { drive: { id: 'luzX', from: 3200, to: CALLE.door.x + 640, dur: 3.2, ease: 'inOut' } },
    // she brakes: the lantern swings on
    fx('swing'),
    // ---------------------------------------------------------------- L3 — Luzterna, BIG, from his eye level; she leans in
    { ...cut('luzterna', 2.0, [-40, 130]), id: 'L3' },
    { ...dv('luzLean', 1, 0.35, 'outBack'), async: true },
    say(SALIDA_LINES.l3),
    { ...dv('luzLean', 0.25, 0.4), async: true },
    // ---------------------------------------------------------------- L4 — his point of view: he sees her upside down
    cut('canelo', 1.8, [-10, 40]),
    emote('canelo', 'surprise'),
    { wait: 0.55 },
    {
      parallel: [dv('pov', 1, 0.42), move('luzterna', 1.55, [0, -115], 0.42)],
      id: 'L4',
    },
    say(SALIDA_LINES.l4),
    { parallel: [dv('pov', 0, 0.32), move('pareja', 1.3, [0, 110], 0.32)] },
    // ---------------------------------------------------------------- L5 — two fingers lift his scarf like a leash
    { drive: { id: 'leash', to: 1, dur: 0.5 }, id: 'L5' },
    fx('tug'),
    dv('lying', 0, 0.5, 'outBack'),
    // «Dejaste pelo en TRES cajas»: three orange hairs held up between two fingers
    say(SALIDA_LINES.l5, { 0: [fx('hairs'), move('manga', 1.6, [-140, 40], 0.5)] }),
    // ---------------------------------------------------------------- WALK · leg 1: the alley bends (drunk perspective)
    { ...dv('luzLean', 0, 0.3), async: true },
    cut('canelo', 1.0, [160, -60]),
    { ...dv('bend', 1, 1.4), async: true },
    ...leg(1),
    say(SALIDA_LINES.tramo1, {
      0: [TWO(1.4), dv('luzLean', 1, 0.3, 'outBack'), fx('swing')],
      1: [CLOSE_CAN(1.9), emote('canelo', 'happy'), dv('luzLean', 0.3, 0.3)],
      2: [CLOSE_LUZ(1.85), dv('luzLean', 1, 0.3, 'outBack'), fx('swing'), move('luzterna', 2.25, [0, 80], 2.6)],
    }),
    // ---------------------------------------------------------------- leg 2: straighter; a high, wide angle
    { ...dv('luzLean', 0, 0.4), async: true },
    { ...dv('bend', 0, 1.6), async: true },
    cut('canelo', 1.15, [160, -110]),
    ...leg(2),
    say(SALIDA_LINES.tramo2, {
      // «Me duele la panza de tanto decidir»
      0: [CLOSE_CAN(1.9), emote('canelo', 'hurt')],
      // «Derecho. DERECHO.»: she grows HUGE, cartoon style, then back to her size for the rest of the line
      1: [
        TWO(1.15, 80),
        { ...dv('luzLean', 1, 0.2), async: true },
        dv('luzBig', 1, 0.3, 'outBack'),
        emote('canelo', 'surprise'),
        { fx: { id: 'punch', k: 0.06 }, reduced: 'skip' },
        fx('swing'),
        { wait: 1.25 },
        dv('luzBig', 0, 0.35),
        dv('luzLean', 0.2, 0.3),
      ],
      // «El piso se mueve.»: and it does
      2: [dv('luzBig', 0, 0.15), cut('canelo', 1.15, [90, 183]), dv('wave', 1, 1.2)],
    }),
    // ---------------------------------------------------------------- leg 3: the floor waves under him (she floats)
    cut('canelo', 1.1, [160, -40]),
    ...leg(3),
    say(SALIDA_LINES.tramo3, {
      // «El piso no se mueve…»: she stamps — the waves freeze and flatten
      0: [cut('canelo', 1.1, [130, 180]), fx('stamp'), { wait: 0.2 }, dv('wave', 0, 0.3, 'out')],
      // «¿Y si un día me voy…?»: close and quiet; the rain calms; he sobers up
      1: [
        { ...dv('gap', 320, 1.6), async: true },
        { ...dv('luzLow', 1, 1.4), async: true },
        { ...dv('rainK', 0.3, 2.4), async: true },
        { audio: { ambience: 'rain', level: 0.28, fade: 2.4 } },
        { ...dv('canLids', 0, 0.8), async: true },
        move('pareja', 1.7, [0, 50], 2.2),
      ],
      // «…a mí ya no me puede pasar nada, gordo: ya me pasó todo.» — her light dips, a little, and comes back
      2: [{ wait: 1.7 }, dv('luzDim', 0.8, 1.1), dv('luzDim', 1, 2.4)],
      // «…Perdón por irme, Luz.»
      3: [move('canelo', 2.0, [20, 80], 1.2), emote('canelo', 'hurt')],
    }),
    // ---------------------------------------------------------------- leg 4: quiet, close; then she stops
    { ...dv('camLead', 120, 0.6), async: true },
    TWO(1.45, 60),
    ...leg(4),
    // (Luzterna stops. A pause.) The leash yanks him back a step; her lantern swings on
    fx('stop'),
    { wait: 1.3 },
    say(SALIDA_LINES.tramo4, {
      0: CLOSE_LUZ(1.9),
      1: CLOSE_CAN(1.9),
      2: [CLOSE_LUZ(1.9), emote('luzterna', 'happy')],
      3: [CLOSE_CAN(2.0), look('canelo', 'right'), emote('canelo', 'happy')],
    }),
    // ---------------------------------------------------------------- the last stretch: the painted cat flap lights up
    { drive: { id: 'leash', to: 0, dur: 0.6 }, async: true },
    { ...dv('glow', 0.5, 2.4), async: true },
    { ...dv('luzLow', 0.4, 2.4), async: true },
    { ...move('gatera', 1.3, [25, 30], 2.4), async: true },
    { drive: { id: 'walkX', to: GATERA_X - 170, dur: 2.4, ease: 'inOut' }, async: true },
    { drive: { id: 'luzX', to: GATERA_X + 190, dur: 2.4, ease: 'inOut' } },
    // ---------------------------------------------------------------- V1 — from behind, backlit: the light shifts, color drains feet-up
    { ...dv('glow', 1, 0.5, 'in'), async: true },
    { drive: { id: 'backs', to: 1, dur: 0.6, ease: 'linear' }, id: 'V1' },
    say(SALIDA_LINES.v1),
    // ---------------------------------------------------------------- V2 — she turns to him: her color floods back, face first
    { parallel: [dv('luzOut', 1, 0.75), dv('luzLook', 0.6, 0.6), move('luzterna', 2.1, [-30, 86], 0.85)], id: 'V2' },
    say(SALIDA_LINES.v2, { 0: [{ wait: 0.8 }, dv('luzLids', 0.5, 0.25)] }),
    // ---------------------------------------------------------------- V3 — he turns to her (his color back); she looks at his scarf
    { parallel: [dv('luzLids', 0, 0.2), dv('canOut', 1, 0.7), move('pareja', 1.5, [0, 93], 0.7)], id: 'V3' },
    say(SALIDA_LINES.v3, {
      // «Y esa bufanda… ¿todavía?»: an insert of the scarf
      0: [dv('luzLook', 1, 0.3), move('bufanda', 2.3, [40, 45], 0.6)],
      1: [CLOSE_CAN(1.9), dv('luzLook', 0.6, 0.2)],
      2: [CLOSE_LUZ(1.9), dv('luzLids', 0.45, 0.2)],
      3: [CLOSE_CAN(1.9), emote('canelo', 'happy'), dv('luzLids', 0, 0.3)],
    }),
    // ---------------------------------------------------------------- V4 — her sleeve keeps the orange thread (insert, no line)
    look('canelo', 'right'),
    { ...cut('manga', 2.6, [-150, 10]), id: 'V4' },
    fx('thread'),
    { wait: 2.7 },
    // she smiles where he can't see it
    move('luzterna', 2.0, [0, 90], 0.7),
    emote('luzterna', 'happy'),
    { wait: 1.4 },
    // ---------------------------------------------------------------- V5 — backlit again: he goes through, she looks back at the bar
    cut('gatera', 1.3, [25, 30]),
    { parallel: [dv('canOut', 0, 0.5), dv('luzOut', 0, 0.5), dv('luzLook', 0, 0.4)] },
    { drive: { id: 'cross', to: 1, dur: 1.9, ease: 'linear' }, id: 'V5' },
    { ...dv('glow', 0.55, 1.4), async: true },
    { parallel: [dv('luzLook', 1, 0.6), dv('luzOut', 1, 0.9), move('luzterna', 2.2, [-200, 90], 1.1)], after: 0.3 },
    say(SALIDA_LINES.v5),
    { wait: 1.0 },
    { persist: { beat: `${B}#a` } },
  ],
};

registerCine(P3_SALIDA);
