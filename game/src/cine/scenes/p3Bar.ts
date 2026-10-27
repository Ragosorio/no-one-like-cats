/**
 * H66 «La última ronda» — the bar (docs/part-iii/04 §2 and §4; polish pass 13 §3.2 and §3.4), on the `caja` stage
 * (scenes/CajaScene.ts, set 'bar'; the pass's acting, props and inserts: scenes/caja/barDirector.ts).
 *
 *   p3_bar_a  THE CROSS and scene A. The flap's light (handed over by the island's p3_pelo) repaints itself into flat
 *             TV bands; the neon «LA ÚLTIMA RONDA» buzzes on; a row of orange hairs on the wet street leads to the door
 *             (we follow Canelo); a patron flies out. Inside, Canelo talks to «someone» on his right — the OYENTE (no
 *             plate, no portrait). He hugs his mug, gesticulates, rears up offended («¿No sabes quién soy?»: for half a
 *             second the bar is a front page with his face; APLAUSOS lights up, nobody claps), draws a little door in his
 *             foam (it opens on another box: the world's rule, «Las cajas tienen gateras»), catches the mug Espuma
 *             slides, and the long gulp opens the Momento «Drunck» (app/gaterasFlow.ts playBarPrologue).
 *   p3_bar_b  scene B, after the song: THE COUNTER BECOMES THE DIAGRAM of what he tells — the napkin is «esa hoja»
 *             (days and nights in the window, a mark per night), the sugar cube / the ketchup / the lamp's hands of
 *             light are the three sides (each invades the counter in its style and goes back), a fry is the Capi
 *             (mentira:*: four versions), Espuma's pencil can't write under a sleeping cat, the fog eraser, the chalk
 *             that writes by itself, «PISAPAPELES», the lives counted on his claws, the blue beam in the window, the
 *             scarf over his eyes. Then THE REVEAL (R1–R10, approved: only its execution is polished).
 *
 * TWO RHYTHMS (13 §2.1): each idea is PRESENTED (a line), SHOWN (an action), and lands (a reaction: his face, Espuma's,
 * half a bar or more) before the next one; inside it, the animation is fast. Long lines are split in two with the
 * action between them (the halves live at the end of b66_bar, so no index moved: ui/story/gaterasScript.ts).
 *
 * THE LISTENER RULE: until `reveal` (R1) the camera never goes right of Canelo (CajaScene clamps it, and nothing right of
 * BAR.hideX exists on screen; the pass's props are all left of it). Music: the derived variations, very low — the street
 * thump from outside (drunck.barra) and the hangover under scene B (drunck.resaca); the reveal is rain and silence.
 */
import { registerCine } from '../registry';
import type { CineCtx, CineScript, Ease, Step } from '../types';
import type { CajaStage } from '../../scenes/CajaScene';
import { G } from '../../state/game';
import { BAR_LINES as A } from '../../ui/story/gaterasScript';

/**
 * b66_bar line indexes, by line of the script — derived from the map (ui/story/gaterasScript.ts BAR_LINES: the single
 * source). The split halves and the new line sit at the end of the beat: every older index is unchanged.
 */
export const BAR_LINES = {
  a2: A.a[0],
  a3: A.a[1],
  a4: A.a[2],
  a5: A.a[3],
  a5b: A.a[4],
  gatera: A.a[5],
  gatera2: A.a[6],
  a7: A.a[7],
  b1: A.b[0],
  b2: A.b[1],
  b3: A.b[2],
  b5: A.b[3],
  b5perfecto: A.mentira.perfecto,
  b5romper: A.mentira.romper,
  b5nada: A.mentira.nada,
  b5none: A.mentira.none,
  b3b: A.b2[0],
  b5b: A.b2[1],
  b5c: A.b2[2],
  b6: A.b2[3],
  b7: A.b2[4],
  b7b: A.b2[5],
  b8: A.b2[6],
  b8b: A.b2[7],
  b8c: A.b2[8],
  b8d: A.b2[9],
  b9b: A.b2[10],
  b9c: A.b2[11],
  b10: A.b2[12],
  b10b: A.b2[13],
  b11: A.b2[14],
  b11b: A.b2[15],
  b12: A.b2[16],
  b13: A.gracias[0],
  r2: A.remate[0],
  r4: A.remate[1],
  r5: A.remate[2],
  r7: A.remate[3],
  r8: A.remate[4],
  r9: A.remate[5],
  r10: A.remate[6],
} as const;
type Key = keyof typeof BAR_LINES;
const B = 'b66_bar';
const say = (k: Key, o: { id?: string; onLine?: Step | Step[] } = {}): Step => ({ say: { beat: B, lines: [BAR_LINES[k]], ...(o.onLine ? { onLine: { 0: o.onLine } } : {}) }, ...(o.id ? { id: o.id } : {}) });
/** the CajaScene behind the stage (scripts only run on the caja stage) */
export const cajaOf = (c: CineCtx) => (c.stage as CajaStage).scene;
const cut = (to: string | { x: number; y: number }, zoom: number, offset?: [number, number]): Step => ({ camera: { to, zoom, offset, dur: 0 } });
const move = (to: string | { x: number; y: number }, zoom: number, dur: number, ease: Ease = 'inOut', offset?: [number, number]): Step => ({ camera: { to, zoom, offset, dur, ease } });
/** a body move of the pass (scenes/caja/barDirector.ts `act`) */
const act = (kind: string, who: 'canelo' | 'espuma' = 'canelo', dur?: number): Step => ({ fx: { id: 'act', who, kind, ...(dur ? { dur } : {}) } });
const fx = (id: string, o: Record<string, unknown> = {}): Step => ({ fx: { id, ...o } });
const set = (id: string, to: number, dur = 0.01, ease: Ease = 'inOut'): Step => ({ drive: { id, to, dur, ease } });
/** a shake: never with «Reducir movimiento» */
const shake = (k: number): Step => ({ fx: { id: 'shake', k }, reduced: 'skip' });

/** H64's choice (mentira:*), read without importing the state module (cosmetic only) */
export function mentiraPick(flags: Record<string, unknown> | undefined): 'perfecto' | 'romper' | 'nada' | null {
  for (const k of ['perfecto', 'romper', 'nada'] as const) if (flags?.[`mentira:${k}`]) return k;
  return null;
}
const pickIs = (want: 'perfecto' | 'romper' | 'nada' | null) => () => mentiraPick(G.s?.flags as Record<string, unknown> | undefined) === want;

/** a derived variation of Drunck, very low, for as long as the cine wants it (never the original: that's the Momento's) */
function bed(ref: 'drunck.barra' | 'drunck.resaca', duckDb: number): Step {
  return {
    call: async (c) => {
      bedOff = null;
      if (c.skipping) return;
      const { cueBest } = await import('../sound');
      const { audioApi } = await import('../../audio/api');
      if (!cueBest([ref], { fadeIn: 2, loop: true })) return;
      audioApi.duck(true, duckDb, 'p3bar');
      let on = true;
      const off = (fade: number) => {
        if (!on) return;
        on = false;
        audioApi.release(fade);
        audioApi.duck(false, duckDb, 'p3bar');
      };
      bedOff = off;
      c.own(() => off(1.2));
    },
  };
}
let bedOff: ((fade: number) => void) | null = null;
/** the bed goes now (the TV cut inside; the reveal) */
const bedStop = (fade: number): Step => ({
  call: () => {
    bedOff?.(fade);
    bedOff = null;
  },
});

// ================================================================== A · the cross, and before the song
export const P3_BAR_A: CineScript = {
  id: 'p3_bar_a',
  stage: 'caja',
  replay: { title: 'La última ronda', seen: `${B}#a`, order: 66 },
  steps: [
    { ui: { bars: true, hud: false, skip: true } },
    {
      call: (c) => {
        const s = cajaOf(c);
        // outside, nobody but the patron who gets thrown out (Canelo is inside, and nobody's lantern yet)
        s.canHidden = true;
        s.luzOn = 0;
        s.useSet('calle');
      },
    },
    // the neon is still dark; his hairs are already on the street
    set('neonApagado', 1),
    set('pelos', 1),
    { audio: { state: 'silence', fade: 0.8 } },
    { audio: { ambience: 'rain', level: 0.55, fade: 1.2 } },
    // the party, heard from the street (drunck.barra: only the kick's rumble), very low
    bed('drunck.barra', 10),
    // THE CROSS — development: the flap's warm light repaints itself into flat TV bands (another box, another style)
    cut({ x: 900, y: 600 }, 1.05),
    { ...fx('cruce'), id: 'A0' },
    { wait: 0.8 },
    // exit: the neon «LA ÚLTIMA RONDA» buzzes on (the camera leans in to it)
    { ...move({ x: 640, y: 430 }, 1.3, 1.1), async: true },
    { ...fx('neon'), after: 0.1, id: 'A0n' },
    { wait: 0.9 },
    // a row of orange hairs on the wet street, glinting toward the door: we are following Canelo
    cut({ x: 2700, y: 800 }, 1.3),
    { ...move({ x: 780, y: 720 }, 1.35, 1.75), id: 'A0p' },
    // A1 — the door bursts open: a cat flies out, gets up and goes back in
    { ...fx('eject'), id: 'A1' },
    { ...shake(0.3), after: 0.05 },
    { wait: 2.25 },
    // inside (TV cut): the party's thump is cut with it — in here, the sitcom's silence
    bedStop(0.25),
    { call: (c) => cajaOf(c).useSet('bar') },
    // A2 — wide, then a push in: Canelo hugs his huge mug; Espuma at the far end, polishing
    cut({ x: 520, y: 430 }, 0.95),
    { ...move({ x: 1060, y: 480 }, 1.55, 1.5), async: true, id: 'A2w' },
    { ...act('abrazo', 'canelo', 3.2), after: 0.4 },
    { wait: 0.45 },
    { ...say('a2'), id: 'A2' },
    // A3 — a little wider, a two-shot with someone we can't see: a SECOND mug on the right edge (glass and foam only;
    // its foam bubbles to the rhythm of a snore — the honest clue)
    set('mug2', 1),
    set('ronquido', 1),
    { ...move({ x: 1180, y: 470 }, 1.3, 1.1), async: true },
    { actor: { who: 'canelo', do: 'look', arg: 'right' }, after: 0.3 },
    act('inclina', 'canelo', 3.4),
    { ...say('a3', { onLine: act('gesto', 'canelo', 2.2) }), id: 'A3' },
    // A4 — the balloon without a name comes in from the right edge
    { ...say('a4'), id: 'A4' },
    // the consequence: he freezes. Hold the two-shot (the other mug's foam breathes)
    { wait: 0.45 },
    // A5 — crash zoom: offended with his WHOLE body
    cut('canelo', 1.6, [-110, 60]),
    move('canelo', 2.15, 0.16, 'out', [-130, 70]),
    act('ofendido', 'canelo', 2.6),
    { ...say('a5'), id: 'A5' },
    // «¿No sabes quién soy?» — for half a second the bar is a front page of the Diario del Mar with his face
    { ...fx('portada'), id: 'A5p' },
    { wait: 0.6 },
    // APLAUSOS lights up (the sitcom asks for it)… nobody claps. Only the rain
    cut({ x: -740, y: 120 }, 2.1),
    { ...set('applause', 1, 0.1), id: 'A5a' },
    { wait: 0.7 },
    // the consequence, in a two-shot: Espuma polishes faster and rolls her eyes; he deflates
    cut({ x: 720, y: 450 }, 1.15),
    act('pule', 'espuma', 2.2),
    { ...act('ojos', 'espuma'), after: 0.3, id: 'A5r' },
    act('desinfla', 'canelo', 2.6),
    { wait: 0.85 },
    { ...set('applause', 0, 0.2), async: true },
    // «…No, no sabes. Mejor. Aquí nadie sabe nada. Por eso me gusta.» (he settles back, cozy)
    cut({ x: 1020, y: 470 }, 1.6),
    act('inclina', 'canelo', 3),
    { ...say('a5b'), id: 'A5b' },
    // THE GATERA (the world's rule, for H68): a claw into his mug's foam — he draws a little door
    act('espuma', 'canelo', 1.6),
    move('tarro', 2.5, 0.45, 'inOut', [-20, -70]),
    { ...set('ins:espuma', 1), id: 'A5g' },
    fx('gateraDibuja'),
    { wait: 1.15 },
    { ...say('gatera'), id: 'A5h' },
    // it opens on ANOTHER box (half a second), and shuts
    { ...fx('gateraAbre'), id: 'A5o' },
    { wait: 1.3 },
    { ...say('gatera2'), id: 'A5n' },
    set('ins:espuma', 0),
    // the consequence: Espuma stopped polishing — she stares at his foam; he takes a sip like nothing happened
    cut({ x: 760, y: 470 }, 1.15),
    act('sorbo', 'canelo', 1.3),
    { actor: { who: 'espuma', do: 'emote', arg: 'surprise' } },
    act('lapiz', 'espuma', 1.2),
    { wait: 0.75 },
    // A6 — the counter: Espuma slides another mug (a whip pan follows it); he catches it without looking
    cut({ x: 420, y: 600 }, 1.6),
    { ...fx('slide'), id: 'A6' },
    { ...fx('latigo', { dir: 1 }), after: 0.1 },
    move({ x: 1060, y: 600 }, 1.6, 0.85),
    { wait: 0.1 },
    fx('catch'),
    act('atrapa'),
    shake(0.15),
    { wait: 0.45 },
    // A7 — medium: proud, the mug up
    cut({ x: 1000, y: 470 }, 1.35),
    act('orgulloso', 'canelo', 2.4),
    { ...say('a7'), id: 'A7' },
    // A8 — from the bottom of the mug, through the glass and the beer: the longest gulp. → c1: «Drunck» starts
    // (the gulp stays on screen: the Momento's cold open starts from it; gaterasFlow takes it down)
    { call: (c) => void (!c.skipping && cajaOf(c).showGulp(true)), id: 'A8' },
    { drive: { id: 'mug', to: 0.06, dur: 2.2, ease: 'in' } },
    { persist: { beat: `${B}#a` } },
  ],
};

// ================================================================== B · after the song: the diagram, and the reveal
export const P3_BAR_B: CineScript = {
  id: 'p3_bar_b',
  stage: 'caja',
  replay: { title: '¿Y luego?', seen: `${B}#b`, order: 66.5 },
  steps: [
    { ui: { bars: true, hud: false, skip: true } },
    {
      call: (c) => {
        const s = cajaOf(c);
        if (s.set !== 'bar') s.useSet('bar');
        s.showGulp(false);
        // ¡PUM!: the mug he slammed is empty; the second one waits, its foam still up
        s.mugFill = 0;
        s.mugFoam = 0;
        s.mug2 = 1;
      },
    },
    fx('limpia'),
    set('ronquido', 1),
    { audio: { state: 'silence', fade: 0.3 } },
    { audio: { ambience: 'rain', level: 0.7, fade: 0.6 } },
    // the hangover, under a pillow (drunck.resaca), very low
    bed('drunck.resaca', 12),
    // B1 — medium: Canelo, messed up, breathes (the camera creeps in)
    cut({ x: 900, y: 470 }, 1.35),
    { ...move({ x: 980, y: 480 }, 1.55, 4.5), async: true },
    { actor: { who: 'canelo', do: 'emote', arg: 'hurt' } },
    act('desinfla', 'canelo', 3.2),
    { wait: 0.4 },
    { ...say('b1'), id: 'B1' },
    { ...say('b2'), id: 'B2' },
    act('serio', 'canelo', 2),
    // B3 — close-up: «esa hoja»…
    cut('canelo', 1.9, [-140, 60]),
    { ...say('b3'), id: 'B3' },
    // …SHOWN: he pulls a napkin and smooths it flat on the counter. A paw on it: the page
    cut({ x: 990, y: 600 }, 1.7),
    { ...set('servilleta', 1, 0.35, 'out'), id: 'B3n' },
    act('aplana', 'canelo', 1.5),
    { wait: 0.85 },
    { ...set('pata', 1, 0.3), async: true },
    // the nights go by: the window turns day–night–day; a chalk mark on the board per night
    cut({ x: 560, y: 420 }, 0.9),
    { ...fx('dianoche'), id: 'B3d' },
    { wait: 1.95 },
    // the consequence: he looks at the board, tired
    act('serio', 'canelo', 2.2),
    { wait: 0.3 },
    // «Todos esperando que yo decida. ¡Yo! Que no sé decidir entre pescado y pescado.» — the TV, two identical fish
    cut({ x: 1180, y: 400 }, 1.4),
    { ...set('tele2', 1, 0.2), async: true },
    { ...say('b3b'), id: 'B3b' },
    act('cabecea', 'canelo', 1.3),
    { wait: 0.85 },
    { ...set('tele2', 0, 0.3), async: true },
    // B4 — detail: a fry from the little plate; half of it falls (that fry will be the Capi)
    { ...set('pata', 0, 0.2), async: true },
    cut('plato', 2.0, [40, -60]),
    { ...fx('fry'), id: 'B4' },
    { wait: 1.05 },
    // B5 — THE DIAGRAM: the counter from above; the napkin is the page and he sets the three sides around it
    set('barraPata', 1),
    { ...set('ins:barra', 1), id: 'B5i' },
    fx('palmea'),
    { wait: 0.35 },
    // the Correctores: a sugar cube, polished white — the white floods the counter and goes back into the cube
    { ...say('b5', { onLine: fx('azucar') }), id: 'B5' },
    { ...fx('blanco'), id: 'B5w' },
    { wait: 0.85 },
    // the Disruptores: the ketchup — SPLAT, graffiti and cracks all over, and back into the bottle (one drop stays)
    { ...say('b5b', { onLine: fx('catsup') }), id: 'B5k' },
    { ...fx('rojo'), id: 'B5r' },
    { wait: 0.8 },
    // the Titiriteros: the lamp's light comes down in two little hands that write; their strings cross everything
    { ...say('b5c', { onLine: fx('manos') }), id: 'B5m' },
    // his paw leaves the page to the Capi
    set('barraPata', 0, 0.3, 'inOut'),
    // B5′ — the Capi: the fallen fry, a toothpick quill, a paper hat. His version of what the player chose in H64
    { ...fx('capi', { v: 'perfecto' }), when: pickIs('perfecto'), id: 'B5c' },
    { ...fx('capi', { v: 'romper' }), when: pickIs('romper'), id: 'B5c' },
    { ...fx('capi', { v: 'nada' }), when: pickIs('nada'), id: 'B5c' },
    { ...fx('capi', { v: 'none' }), when: pickIs(null), id: 'B5c' },
    { wait: 0.5 },
    { ...say('b5perfecto', { onLine: fx('capiEscribe') }), when: pickIs('perfecto') },
    { ...say('b5romper', { onLine: fx('capiEscribe') }), when: pickIs('romper') },
    { ...say('b5nada', { onLine: fx('capiEscribe') }), when: pickIs('nada') },
    { ...say('b5none', { onLine: fx('capiEscribe') }), when: pickIs(null) },
    { wait: 0.8 },
    // the consequence: his face, the version's
    set('ins:barra', 0),
    cut('canelo', 1.9, [-140, 60]),
    { ...act('desinfla', 'canelo', 2), when: pickIs('perfecto') },
    { ...act('cabecea', 'canelo', 1.1), when: pickIs('romper') },
    { ...act('inclina', 'canelo', 2), when: pickIs('nada') },
    { ...act('encoge', 'canelo', 1), when: pickIs(null) },
    { wait: 0.55 },
    { ...say('b6'), id: 'B6' },
    // B7 — «Luego me dormí encima…»: he lies down on the napkin and snores
    cut({ x: 900, y: 520 }, 1.3),
    { ...say('b7', { onLine: set('tumbado', 1, 0.6) }), id: 'B7' },
    // the law, as a joke: Espuma comes over with the pencil from her bun to put the tab on the napkin… and can't
    { ...set('espumaX', 1, 0.75), async: true, id: 'B7e' },
    { wait: 0.5 },
    set('barraDuerme', 1),
    { ...set('ins:barra', 1), id: 'B7i' },
    fx('lapiz'),
    { wait: 2.65 },
    set('ins:barra', 0),
    // the consequence: she stares at her broken pencil; he wakes up, proud of it
    cut({ x: 830, y: 480 }, 1.3),
    act('lapiz', 'espuma', 2),
    set('tumbado', 0, 0.4, 'outBack'),
    act('orgulloso', 'canelo', 3),
    { drive: { id: 'mug', to: 0.9, dur: 1.2, ease: 'out' }, async: true },
    { ...say('b7b'), id: 'B7b' },
    act('ojos', 'espuma'),
    { ...set('espumaX', 0, 0.9), async: true },
    set('barraDuerme', 0),
    // B8 — close-up, serious
    cut('canelo', 2.0, [-150, 60]),
    { ...move('canelo', 2.35, 3.5, 'inOut', [-150, 60]), async: true },
    act('serio', 'canelo', 4),
    { ...say('b8'), id: 'B8' },
    // SHOWN: on the board, a fog eraser wipes everything clean
    cut('pizarron', 2.6),
    { ...fx('borrador'), id: 'B8a' },
    { wait: 1.2 },
    { ...say('b8b'), id: 'B8b' },
    // he takes the eraser and tucks it into his scarf (a whip from the board to him)
    { ...fx('latigo', { dir: -1 }), id: 'B8g' },
    cut({ x: 820, y: 430 }, 1.25),
    fx('guarda'),
    { wait: 0.85 },
    { ...say('b8c'), id: 'B8c' },
    // the chalk stands up and writes by itself — faster and faster, until it spills over the wall
    cut('pizarron', 2.3),
    { ...fx('gis'), id: 'B8w' },
    { ...move('pizarron', 1.25, 1.4, 'inOut', [180, 140]), after: 0.6, async: true },
    { wait: 2.3 },
    // «Y yo soy el pisapapeles.» — he flops onto the napkin; a little museum label pops up
    cut({ x: 920, y: 520 }, 1.45),
    { ...say('b8d'), id: 'B8d' },
    set('tumbado', 1, 0.3, 'in'),
    shake(0.12),
    { ...set('placa', 1, 0.45, 'outBack'), async: true, id: 'B8p' },
    { wait: 0.75 },
    // B9 — he laughs at his own joke. Nobody laughs. The rain. (The APLAUSOS box stays dark.)
    { ...act('risa', 'canelo', 1.8), id: 'B9' },
    { wait: 0.35 },
    cut({ x: 260, y: 430 }, 0.85),
    { wait: 1.05 },
    { ...set('tumbado', 0, 0.4), async: true },
    { ...set('placa', 0, 0.25), async: true },
    // B9′ — detail: the little flame at the tip of his tail, smaller than usual
    set('flame', 0.55),
    cut('cola', 2.2),
    { wait: 0.5 },
    { ...say('b9b'), id: 'B9b' },
    set('flame', 0),
    // …he counts on his claws (both paws, one claw at a time)
    cut('canelo', 1.6, [-40, 110]),
    { ...act('garras', 'canelo', 2.5), id: 'B9g' },
    { wait: 1.5 },
    { ...say('b9c'), id: 'B9c' },
    // the board: the marks multiply (and settle back into the tab)
    cut('pizarron', 2.0),
    { ...fx('rayas'), id: 'B9r' },
    { wait: 1.8 },
    // B10 — detail: his mug and, on the right, the other mug with its foam gone flat (it still breathes, softly)
    set('mug2Foam', 0.15),
    cut('tarro2', 2.0, [-120, 0]),
    { ...say('b10'), id: 'B10' },
    // SHOWN: through the window, a blue beam crosses the rain going UP — held
    cut({ x: 380, y: 380 }, 1.05),
    { ...set('haz', 1, 1.0, 'out'), async: true, id: 'B10h' },
    act('mira', 'canelo', 5),
    { wait: 1.4 },
    { ...say('b10b'), id: 'B10b' },
    { wait: 0.2 },
    // B11 — close-up, quieter: he pulls his scarf over his eyes
    { ...set('haz', 0, 0.8), async: true },
    cut('canelo', 2.15, [-140, 60]),
    { ...move('canelo', 2.6, 5, 'inOut', [-140, 50]), async: true },
    { ...say('b11'), id: 'B11' },
    { ...set('bufanda', 1, 0.6), id: 'B11s' },
    { wait: 0.1 },
    { ...say('b11b'), id: 'B11b' },
    // B12 — the silence (04 §4: two seconds)
    { wait: 1.6 },
    { ...say('b12'), id: 'B12' },
    // he peeks out from under the scarf
    set('bufanda', 0.55, 0.3),
    { wait: 0.3 },
    // B13 — moved: the scarf down; for the first time he turns his whole body to the right; the camera turns with him
    set('bufanda', 0, 0.3),
    bedStop(2.2),
    { fx: { id: 'turn' } },
    { camera: { to: { x: 1200, y: 470 }, zoom: 1.6, dur: 0.9, ease: 'inOut' } },
    { ...say('b13'), id: 'B13' },
    // ================= THE REVEAL (R1): the first reverse shot of the whole scene. Rain and silence
    { call: (c) => cajaOf(c).reveal(), id: 'R1' },
    cut('hipolito', 1.6, [-60, 40]),
    { drive: { id: 'snore', to: 1, dur: 2.4, ease: 'inOut' } },
    { wait: 0.6 },
    // R2 — without opening his eyes, from the donut
    { ...say('r2'), id: 'R2' },
    // R3 — Canelo, motionless; one eye twitches
    cut('canelo', 2.3, [-120, 60]),
    { ...act('tic'), id: 'R3' },
    { wait: 1.3 },
    // R4 — Espuma, still polishing the glass
    cut('espuma', 1.9, [80, 60]),
    act('pule', 'espuma', 3),
    { ...say('r4'), id: 'R4' },
    // R5 — Canelo; a crash zoom
    cut('canelo', 1.8, [-120, 60]),
    { camera: { to: 'canelo', zoom: 2.8, offset: [-60, 40], dur: 0.14, ease: 'out' } },
    { fx: { id: 'punch', k: 0.06 }, reduced: 'skip' },
    act('ofendido', 'canelo', 1.6),
    { ...say('r5'), id: 'R5' },
    { drive: { id: 'applause', to: 1, dur: 0.1 } },
    // R6 — wide, slow motion: Hipólito shifts (anticipation), slides off his stool and drags the donut tower down with
    // him; still asleep; *pop*
    cut({ x: 1360, y: 520 }, 0.95),
    { drive: { id: 'applause', to: 0, dur: 0.2 } },
    { fx: { id: 'fall' }, id: 'R6' },
    { fx: { id: 'pop' }, after: 1.5 },
    { wait: 1.9 },
    // R7 — on the floor, happy: a donut on each paw and one on his head like a crown
    { call: (c) => void (!c.skipping && cajaOf(c).showFloor(true)), id: 'R7' },
    { wait: 0.6 },
    { ...say('r7') },
    { call: (c) => cajaOf(c).showFloor(false) },
    // R8 — Canelo gets off his stool, staggering
    cut({ x: 860, y: 470 }, 1.3),
    { fx: { id: 'hic' } },
    { drive: { id: 'leave', to: 0.5, dur: 0.85, ease: 'in' }, id: 'R8' },
    { ...say('r8') },
    // R9
    cut('espuma', 1.8, [80, 60]),
    { ...say('r9'), id: 'R9' },
    // R10 — Canelo at the door
    { drive: { id: 'leave', to: 1, dur: 0.01 } },
    cut({ x: -700, y: 420 }, 1.4),
    { ...say('r10'), id: 'R10' },
    { drive: { id: 'applause', to: 1, dur: 0.1 } },
    { wait: 0.9 },
    // the card: GATERA DESCUBIERTA · La Última Ronda · Dimensión Borracha
    { call: (c) => void (!c.skipping && cajaOf(c).showCard(true)), id: 'card' },
    { wait: 3.6 },
    { call: (c) => cajaOf(c).showCard(false) },
    { persist: { beat: `${B}#b` } },
  ],
  finish: (c) => {
    const s = cajaOf(c);
    s.showFloor(false);
    s.showCard(false);
    s.barDir?.reset();
  },
};

registerCine(P3_BAR_A);
registerCine(P3_BAR_B);
