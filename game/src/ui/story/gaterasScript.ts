/**
 * Parte III · porción vertical «Una noche nomás» (H66–H69) — WHEN each beat plays (same contract as the Part II
 * scripts; app/story.ts merges these tables). Lines are data in src/data/gateras/historia.json (each beat carries a
 * `$scene` note). Pure: no Pixi, no G — tests and tools read it.
 *
 * Who plays what (docs/part-iii/11 §2):
 *  - the Bitácora's CARD of each mission (docs/part-iii/03 §3, panels/Bitacora.ts): PASA / IMPORTA / QUEREMOS / AHÍ
 *    when it appears, CAMBIÓ when it's done. Special 'card' refs, keyed `p3_tarjeta_<id>` / `p3_cambio_<id>`. A flow
 *    that holds the screen (the bar → the street, C) may show them itself at the right moment (showP3Card): the
 *    queued ref then finds its key seen and skips.
 *  - H66 starts by TAPPING THE PAGE by the faro (ui/story/o4Pagina.ts → the hair, the cat flap → C's
 *    playBarPrologue: scene A → MOMENTO drunck → scene B → the punchline). b66_bar is read by C's cines.
 *  - b67_salida is read by C's cine p3_salida (the walk). b67_despierta is the cine p3_despierta on your island
 *    (ui/story/gaterasCines.ts), queued when H67 is done (C may also play it at the end of playSalida).
 *  - b68_carta: part a (the faro, in the morning) is dialog here; the rest is read by B on the Carta de las Cajas.
 *  - b69_manana: part a with H69's card; parts b and c when B-2 / B-4 are won (P3_WHEN), on the Carta.
 *
 * Order rule (like Part II): a mission's ON_DONE and the next one's ON_NEW are queued together; `after` chains them
 * (a ref is not ready until that key is seen), and the delays agree with it.
 */

/** the director's ref (a subset of app/story.ts BeatRef, plus the Parte III fields) */
export interface GaterasBeatRef {
  beat: string;
  lines?: number[];
  part?: string;
  delay?: number;
  /** 'cajas' = the Carta de las Cajas (scenes/GaterasMapScene, B) */
  onlyOn?: 'map' | 'island' | 'region' | 'cajas';
  /** 'card' = the Bitácora's card of `mission` (`phase`); 'cine' = a CINE scene on this screen; 'flow' = an Acto I flow */
  special?: 'card' | 'cine' | 'flow';
  /** for 'flow': the flow id (app/acto1Flow.ts; `h75…h92` → app/actsFlow.ts; `h93…h97` → app/finalFlow.ts) */
  flow?: string;
  mission?: string;
  phase?: 'new' | 'done';
  cine?: string;
  /** a cine that must play at home: if the story is waiting on a map, it takes you home for it */
  travel?: boolean;
  /** skipped (marked seen) once this mission is done: the moment was overtaken */
  until?: string;
  /** not ready until this beat key is seen (keeps a card after the scene it closes) */
  after?: string;
}

/** the card beats' keys (G.s.beatsSeen): never b-numbered, so no Part II rule ever counts them */
export const cardKey = (mission: string, phase: 'new' | 'done') => `${phase === 'new' ? 'p3_tarjeta' : 'p3_cambio'}_${mission}`;
const card = (mission: string, phase: 'new' | 'done', o: Partial<GaterasBeatRef> = {}): GaterasBeatRef => ({ beat: cardKey(mission, phase), special: 'card', mission, phase, ...o });
const part = (beat: string, p: string, lines: number[], o: Partial<GaterasBeatRef> = {}): GaterasBeatRef => ({ beat, part: p, lines, ...o });
/** an Acto I flow (app/acto1Flow.ts) — its queue key `p3_flow_<id>` is never b-numbered (no Part II rule counts it) */
export const flowKey = (id: string) => `p3_flow_${id}`;
const flow = (id: string, o: Partial<GaterasBeatRef> = {}): GaterasBeatRef => ({ beat: flowKey(id), special: 'flow', flow: id, ...o });

/** the missions of this slice + the Acto I (H70–H74, NARRATIVA): their «new mission» tip is said by their card */
export const P3_MISSIONS = ['H66', 'H67', 'H68', 'H69', 'H70', 'H71', 'H72', 'H73', 'H74', 'H75', 'H76', 'H77', 'H78', 'H79', 'H80', 'H81', 'H82', 'H83', 'H84', 'H85', 'H86', 'H87', 'H88', 'H89', 'H90', 'H91', 'H92', 'H93', 'H94', 'H95', 'H96', 'H97'] as const;
export const P3_COVERED: string[] = [...P3_MISSIONS];

/** beats that open when a mission APPEARS */
export const P3_ON_NEW: Record<string, GaterasBeatRef[]> = {
  // right after the Parte II (or the moment Parte III lands): the warm mark on the page goes cold, then the card.
  // At home: its AHÍ points at the faro, and the tap that starts the prologue is there
  H66: [card('H66', 'new', { onlyOn: 'island', delay: 3 })],
  // after the bar (C may show it between the punchline and the street)
  H67: [card('H67', 'new', { delay: 2.5, after: cardKey('H66', 'done') })],
  // the morning after: the card, then Luzterna at the faro with her notebook (M1); B opens the Carta from there
  H68: [card('H68', 'new', { onlyOn: 'island', delay: 3, after: cardKey('H67', 'done') }), part('b68_carta', 'a', [0], { onlyOn: 'island', delay: 3.5, after: cardKey('H68', 'new') })],
  // the gatera is open: «la Bitácora se abre sola» with H69's card (M7), then the first line of the route
  H69: [card('H69', 'new', { delay: 2.5, after: cardKey('H68', 'done') }), part('b69_manana', 'a', [0], { delay: 3, after: cardKey('H69', 'new') })],
  // ACTO I (docs/part-iii/historia-v2/02-mapa.md §3, guiones/acto-1): each card, then its scene on the Carta
  H70: [card('H70', 'new', { delay: 2.5, after: cardKey('H69', 'done') }), flow('h70_doneria', { onlyOn: 'cajas', delay: 3, after: cardKey('H70', 'new') })],
  // H71: the card; La Última Ronda appears on the Carta (F03 + Brecha when you sail: app/stageIntro.ts)
  H71: [card('H71', 'new', { delay: 2.5, after: cardKey('H70', 'done') })],
  H72: [card('H72', 'new', { delay: 2.5, after: cardKey('H71', 'done') }), flow('h72_resaca', { onlyOn: 'cajas', delay: 3, after: cardKey('H72', 'new') })],
  // H73: the mob, then the Batalla de Gatos on the Carta (F05 + EMIAU)
  H73: [card('H73', 'new', { delay: 2.5, after: cardKey('H72', 'done') }), flow('h73_entrada', { onlyOn: 'cajas', delay: 3, after: cardKey('H73', 'new') })],
  // H74: the list at the bathroom door, then El Cadenero (B-9) on the Carta (F07 + the battle)
  H74: [card('H74', 'new', { delay: 2.5, after: cardKey('H73', 'done') }), flow('h74_lista', { onlyOn: 'cajas', delay: 3, after: cardKey('H74', 'new') })],
  // ACTO II «Se rompen las cajas» (historia-v2/guiones/acto-2, app/actsFlow.ts): the Comic (H75–H77), home (H78), the Shōnen
  H75: [card('H75', 'new', { delay: 2.5, after: cardKey('H74', 'done') }), flow('h75_llegada', { onlyOn: 'cajas', delay: 3, after: cardKey('H75', 'new') })],
  H76: [card('H76', 'new', { delay: 2.5, after: cardKey('H75', 'done') })],
  H77: [card('H77', 'new', { delay: 2.5, after: cardKey('H76', 'done') })],
  // H78 ♥: at home, at night (F12, the blanket)
  H78: [card('H78', 'new', { delay: 2.5, after: cardKey('H77', 'done') }), flow('h78_cerito', { onlyOn: 'island', delay: 3, after: cardKey('H78', 'new') })],
  H79: [card('H79', 'new', { delay: 2.5, after: cardKey('H78', 'done') }), flow('h79_maneki', { onlyOn: 'cajas', delay: 3, after: cardKey('H79', 'new') })],
  H80: [card('H80', 'new', { delay: 2.5, after: cardKey('H79', 'done') }), flow('h80_entrenamiento', { onlyOn: 'cajas', delay: 3, after: cardKey('H80', 'new') })],
  H81: [card('H81', 'new', { delay: 2.5, after: cardKey('H80', 'done') })],
  H82: [card('H82', 'new', { delay: 2.5, after: cardKey('H81', 'done') }), flow('h82_vocacion', { onlyOn: 'cajas', delay: 3, after: cardKey('H82', 'new') })],
  // ACTO III «Lo que está escrito» (guiones/acto-3): the Library. H88 doesn't chain from H87: back to the Carta first (N20)
  H83: [card('H83', 'new', { delay: 2.5, after: cardKey('H82', 'done') }), flow('h83_llegada', { onlyOn: 'cajas', delay: 3, after: cardKey('H83', 'new') })],
  H84: [card('H84', 'new', { delay: 2.5, after: cardKey('H83', 'done') }), flow('h84_finales', { onlyOn: 'cajas', delay: 3, after: cardKey('H84', 'new') })],
  H85: [card('H85', 'new', { delay: 2.5, after: cardKey('H84', 'done') }), flow('h85_ficha', { onlyOn: 'cajas', delay: 3, after: cardKey('H85', 'new') })],
  H86: [card('H86', 'new', { delay: 2.5, after: cardKey('H85', 'done') }), flow('h86_plan', { onlyOn: 'cajas', delay: 3, after: cardKey('H86', 'new') })],
  H87: [card('H87', 'new', { delay: 2.5, after: cardKey('H86', 'done') })],
  H88: [card('H88', 'new', { delay: 2.5, after: cardKey('H87', 'done') })],
  // ACTO IV «La gira» (guiones/acto-4): the Tour, then home (H92: the playable return, xti when you tap the faro)
  H89: [card('H89', 'new', { delay: 2.5, after: cardKey('H88', 'done') }), flow('h89_llegada', { onlyOn: 'cajas', delay: 3, after: cardKey('H89', 'new') })],
  H90: [card('H90', 'new', { delay: 2.5, after: cardKey('H89', 'done') }), flow('h90_gira', { onlyOn: 'cajas', delay: 3, after: cardKey('H90', 'new') })],
  H91: [card('H91', 'new', { delay: 2.5, after: cardKey('H90', 'done') })],
  H92: [card('H92', 'new', { delay: 2.5, after: cardKey('H91', 'done') }), flow('h92_noche', { onlyOn: 'island', delay: 3, after: cardKey('H92', 'new') })],
  // ⚠️ EL FINAL (historia-v2/guiones/final, app/finalFlow.ts; dormant until the Actos II–IV: missionGoals FINAL_GATE).
  // At home (the siege, the night, the vigil, the errand); H97 the next time the Carta opens
  H93: [card('H93', 'new', { onlyOn: 'island', delay: 2.5, after: cardKey('H92', 'done') }), flow('h93_asedio', { onlyOn: 'island', delay: 3, after: cardKey('H93', 'new') })],
  H94: [card('H94', 'new', { onlyOn: 'island', delay: 1.5, after: cardKey('H93', 'done') }), flow('h94_sin_llama', { onlyOn: 'island', delay: 2, after: cardKey('H94', 'new') })],
  H95: [card('H95', 'new', { onlyOn: 'island', delay: 2, after: cardKey('H94', 'done') }), flow('h95_vigilia', { onlyOn: 'island', delay: 2.5, after: cardKey('H95', 'new') })],
  H96: [card('H96', 'new', { onlyOn: 'island', delay: 2, after: cardKey('H95', 'done') }), flow('h96_recado', { onlyOn: 'island', delay: 2.5, after: cardKey('H96', 'new') })],
  H97: [card('H97', 'new', { onlyOn: 'cajas', delay: 2.5, after: cardKey('H96', 'done') }), flow('h97_bar', { onlyOn: 'cajas', delay: 3, after: cardKey('H97', 'new') })],
};

/** beats that play when a mission is COMPLETED */
export const P3_ON_DONE: Record<string, GaterasBeatRef[]> = {
  // «GATERA DESCUBIERTA · La Última Ronda» + CAMBIÓ «Se fue a olvidar. Y habla»
  H66: [card('H66', 'done', { delay: 1 })],
  // back home through the cat flap: REGISTRO 000 is awake (cine p3_despierta), then CAMBIÓ
  H67: [
    { beat: 'b67_despierta', special: 'cine', cine: 'p3_despierta', onlyOn: 'island', travel: true, delay: 1.2, until: 'H68' },
    card('H67', 'done', { onlyOn: 'island', delay: 1.5, after: 'b67_despierta' }),
  ],
  H68: [card('H68', 'done', { delay: 1 })],
  H69: [card('H69', 'done', { delay: 1.5 })],
  H70: [card('H70', 'done', { delay: 1 })],
  // Brecha beaten: the close at La Última Ronda, then CAMBIÓ
  H71: [flow('h71_cierre', { onlyOn: 'cajas', delay: 1.5 }), card('H71', 'done', { delay: 1, after: flowKey('h71_cierre') })],
  H72: [card('H72', 'done', { delay: 1 })],
  // EMIAU beaten (the song closes the battle): F06 EM%EN, the still shot and the calm close, then CAMBIÓ
  H73: [flow('h73_emen', { onlyOn: 'cajas', delay: 1.2 }), card('H73', 'done', { delay: 1, after: flowKey('h73_emen') })],
  // El Cadenero beaten: the warning in silence, F08 OH SHIT, then CAMBIÓ (and Superhéroes can be sold: dims[].story)
  H74: [flow('h74_aviso', { onlyOn: 'cajas', delay: 1.2 }), card('H74', 'done', { delay: 1, after: flowKey('h74_aviso') })],
  // ACTO II: the scene after each story battle, then CAMBIÓ (H81: F16 «Daria» closes Itō's battle)
  H75: [flow('h75_cierre', { onlyOn: 'cajas', delay: 1.2 }), card('H75', 'done', { delay: 1, after: flowKey('h75_cierre') })],
  H76: [flow('h76_cierre', { onlyOn: 'cajas', delay: 1.2 }), card('H76', 'done', { delay: 1, after: flowKey('h76_cierre') })],
  H77: [flow('h77_cierre', { onlyOn: 'cajas', delay: 1.2 }), card('H77', 'done', { delay: 1, after: flowKey('h77_cierre') })],
  H78: [card('H78', 'done', { delay: 1 })],
  H79: [flow('h79_llave', { onlyOn: 'cajas', delay: 1.2 }), card('H79', 'done', { delay: 1, after: flowKey('h79_llave') })],
  H80: [card('H80', 'done', { delay: 1 })],
  H81: [flow('h81_daria', { onlyOn: 'cajas', delay: 1.2 }), card('H81', 'done', { delay: 1, after: flowKey('h81_daria') })],
  H82: [card('H82', 'done', { delay: 1 })],
  // ACTO III: after the collapse, her lantern off (the flame at 60 %); No wey and the map; DISTOR
  H83: [flow('h83_costuras', { onlyOn: 'cajas', delay: 1.2 }), card('H83', 'done', { delay: 1, after: flowKey('h83_costuras') })],
  H84: [card('H84', 'done', { delay: 1 })],
  H85: [flow('h85_oscuridad', { onlyOn: 'cajas', delay: 1.2 }), card('H85', 'done', { delay: 1, after: flowKey('h85_oscuridad') })],
  H86: [card('H86', 'done', { delay: 1 })],
  H87: [flow('h87_nowey', { onlyOn: 'cajas', delay: 1.2 }), card('H87', 'done', { delay: 1, after: flowKey('h87_nowey') })],
  H88: [flow('h88_distor', { onlyOn: 'cajas', delay: 1.2 }), card('H88', 'done', { delay: 1, after: flowKey('h88_distor') })],
  // ACTO IV: the opening act joins; F29 closes Firma's battle; the starry night ends the act (and wakes the finale)
  H89: [flow('h89_telonero', { onlyOn: 'cajas', delay: 1.2 }), card('H89', 'done', { delay: 1, after: flowKey('h89_telonero') })],
  H90: [card('H90', 'done', { delay: 1 })],
  H91: [flow('h91_show', { onlyOn: 'cajas', delay: 1.2 }), card('H91', 'done', { delay: 1, after: flowKey('h91_show') })],
  H92: [card('H92', 'done', { onlyOn: 'island', delay: 1 })],
  // ⚠️ EL FINAL: CAMBIÓ in her hand, trembling («SIN LLAMA.»; F32 shows it itself and marks it) · the rest in the Capi's
  H93: [card('H93', 'done', { onlyOn: 'island', delay: 0.6 })],
  H94: [card('H94', 'done', { onlyOn: 'island', delay: 1 })],
  H95: [card('H95', 'done', { onlyOn: 'island', delay: 1 })],
  H96: [card('H96', 'done', { onlyOn: 'island', delay: 1.5 })],
  H97: [card('H97', 'done', { onlyOn: 'cajas', delay: 1.5 })],
};

/** beats that fire when a battle of the route is won (checked while calm on the Carta) */
export const P3_WHEN: { key: string; mission: string; flag: string; ref: GaterasBeatRef }[] = [
  { key: 'b69_manana#b', mission: 'H69', flag: 'won_p3d_borracha_2', ref: part('b69_manana', 'b', [1, 2], { onlyOn: 'cajas', delay: 1.2 }) },
  { key: 'b69_manana#c', mission: 'H69', flag: 'won_p3d_borracha_4', ref: part('b69_manana', 'c', [3, 4], { onlyOn: 'cajas', delay: 1.2 }) },
];

// ------------------------------------------------------------------ line indexes the scenes read (historia.json)
/**
 * b66_bar: scene A, scene B (+ ONE B5′ variant by the H64 choice), the punchline. The polish pass (docs/part-iii/13
 * §3.2, §3.4) split long lines in two with an action between them: the second halves and the new line about the cat
 * flaps were APPENDED to the beat (28–40), so no older index moved. Each array is in the order the cine says them
 * (cine/scenes/p3Bar.ts names every position); `b` keeps its four openers so the B5′ variant stays fifth.
 */
export const BAR_LINES = {
  /** A2, A3, A4, A5 (to «¿No sabes quién soy?»: the front page), A5′ (its second half), the cat flaps ×2, A7 */
  a: [0, 1, 2, 3, 30, 28, 29, 4],
  /** B1, B2, B3 (to «esa hoja»: the napkin), B5 (the Correctores: the sugar cube) */
  b: [5, 6, 7, 8],
  /** B5′: what the Capi wanted to write (flag mentira:*); `none` when there's no choice saved */
  mentira: { perfecto: 9, romper: 10, nada: 11, none: 12 } as Record<'perfecto' | 'romper' | 'nada' | 'none', number>,
  /**
   * the rest of scene B, in the cine's order: B3′ (pescado y pescado), B5 (the ketchup), B5 (the hands of light), B6,
   * B7, B7′ (after the pencil), B8, B8′ (the eraser), B8″ (the chalk), B8‴ (PISAPAPELES), B9′, B9″ (the marks
   * multiply), B10, B10′ (the blue beam), B11, B11′ (under the scarf), B12
   */
  b2: [31, 32, 33, 13, 14, 34, 15, 35, 36, 37, 16, 38, 17, 39, 18, 40, 19],
  /** B13: he turns his whole body to the right for the first time */
  gracias: [20],
  remate: [21, 22, 23, 24, 25, 26, 27],
};
/**
 * every line of scene B for this choice — the openers, the B5′ variant (always fifth), then the rest. The cine's exact
 * order (the openers' halves come after the actions that split them) is cine/scenes/p3Bar.ts.
 */
export function barSceneB(choice: string | null | undefined): number[] {
  const k = choice === 'perfecto' || choice === 'romper' || choice === 'nada' ? choice : 'none';
  return [...BAR_LINES.b, BAR_LINES.mentira[k], ...BAR_LINES.b2, ...BAR_LINES.gracias];
}
/** b67_salida: the door, the 4 stretches of the walk, the bond, her goodbye */
export const SALIDA_LINES = {
  salida: [0, 1, 2, 3],
  tramos: [
    [4, 5, 6],
    [7, 8, 9],
    [10, 11, 12, 13],
    [14, 15, 16, 17],
  ],
  vinculo: [18, 19, 20, 21, 22, 23],
  adios: [24],
};
/** b67_despierta (cine p3_despierta) */
export const DESPIERTA_LINES = { ves: [0], noSePuede: [1], dona: [2] };
/** b68_carta: M1 at the faro (here), M2–M6 on the Carta (B) */
export const CARTA_LINES = { faro: [0], dibuja: [1], maneki: [2, 3], nota: [4], gatera: [5] };
/** the key B can watch: Luzterna asked for a map at the faro (M1) → the Carta opens for the first time */
export const CARTA_INTRO_KEY = 'b68_carta#a';
/** b69_manana: before B-1 · after B-2 · before B-5 */
export const MANANA_LINES = { antes: [0], huellas: [1, 2], dona: [3, 4] };
