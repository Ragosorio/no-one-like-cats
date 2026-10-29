/**
 * Parte III · LA PRESENTACIÓN antes de cada batalla de la Carta (docs/part-iii/14-plan-cinematografico.md §0.1 y §2,
 * mecanicas-v2/02-loop.md §8, 03-plan-implementacion.md §2.3 y §6). «Entiendo qué estoy haciendo y a qué me estoy
 * metiendo antes de una batalla.»
 *
 * startGateraBattle (app/cajasFlow.ts) builds the BattleSpec and launches the honest estimate FIRST, then calls
 * stageIntro(). In order:
 *   1. a FILM registered for the stage (CINE's engine, game/src/film — looked up by `stages[].film`, then by the battle
 *      id `p3d_<dim>_<n>`) → playFilm. The first time it can't be skipped (CINE's skip rule with `seen: false`).
 *   2. else a BRIEFING TEMPLATE registered by CINE (registerBriefingTemplate: a film built from BriefingData) → playFilm.
 *   3. else the ANIMATED CARD (ui/briefingCard.ts, 6–8 s): what's happening, the rival, their rule (with a live demo
 *      computed by the sim: battle/demo.ts), what we risk and the honest estimate (the same run as the Carta's card).
 *   4. seen before (a retry, a replay) → nothing here: the battle's own 3 s intro card is the rule reminder.
 * After a full presentation (1–3) the battle's own intro card is dropped (no double card: the owner's «too much at once»).
 *
 * «Seen» lives in ext.gateras.seen — `intro:<battle id>` (the presentation of that stage) and `film:<film id>` (a film
 * watched to the end or skipped: what «Volver a ver» lists). Part III only: no Part II reset ever touches it.
 * A film or card never changes the battle: the spec that plays is the one built before it (and the one estimated).
 */
import type { BattleSpec } from '../scenes/BattleScene';
import type { Estimate } from '../state/sys/estimate';
import type { RuleDemo } from '../battle/demo';
import { DimId, GateraStageDef, gateraBattleId, gateras, markSeenG, seenG, dimDef } from '../state/sys/gateras';
const gaterasSeen = () => gateras()?.seen;
import { gateraBattleDef, gateraLootPreview, type GateraNode } from '../state/sys/gaterasBattles';

/** what a presentation needs to know about a stage (also the data CINE's briefing template receives) */
export interface BriefingData {
  battleId: string;
  dim: DimId;
  /** the stage number (a node that isn't a stage: its battle's surrogate number) */
  n: number;
  /** the node id (`3`, `d1`, `r2`) */
  node: string;
  /** the node's short label as the Carta shows it (`B-3`, `S-5`, `A-2`, `L-7`, `P-9`, `DESVÍO 1`…); optional for old callers */
  label?: string;
  kind: GateraStageDef['kind'];
  /** «LA BORRACHA · B-3» / «ÉLITE · LA BORRACHA» / «JEFE · LA BORRACHA» */
  tag: string;
  dimName: string;
  title: string;
  /** QUÉ PASA */
  pasa: string;
  /**
   * CONTRA QUIÉN. `crewSlugs` (optional, old callers don't send it): the paintings of the rest of the battle's REAL roster
   * (the captain excluded, at most 3) — the template shows them behind the captain
   */
  rival: { name: string; line: string | null; slug: string | null; crew: string[]; crewSlugs?: string[] };
  /** SU REGLA: lines in the player's words + the demo the sim computed (null without a rule) */
  rule: { lines: string[]; demo: RuleDemo | null };
  /** QUÉ ARRIESGAMOS */
  stakes: string;
  /** what a first win pays (huellas) — 0 on a replay */
  huellas: number;
  /** the honest estimate: the latest numbers (p null while it runs) */
  estimate: () => Estimate | null;
}

export type IntroMode = 'film' | 'template' | 'card' | 'none';
export interface IntroPlan {
  mode: IntroMode;
  /** the film to play (mode 'film') */
  filmId: string | null;
  /** the presentation was already seen (a retry / a replay) */
  seen: boolean;
}

/** the film engine as the hook sees it (CINE's game/src/film by default; tests swap it) */
export interface FilmPort {
  has(id: string): boolean;
  /** every registered id (lets a story ask for «f31» before CINE names it «f31_…») */
  ids?(): string[];
  play(idOrDef: string | object, o: { seen: boolean } & FilmHandOff): Promise<{ end: 'done' | 'exited' | 'aborted'; /** the film's optional inputs (FilmResult.inputs) */ inputs?: Record<string, string> } | null>;
  /** (agent FINAL, optional) warm a film ahead: it starts on the cut, without the loading screen (P3-CINE: or a def) */
  preload?(idOrDef: string | object, o: { seen: boolean; after?: number }): Promise<boolean>;
  /** (optional) let a held last frame go (fade s); resolves when gone */
  releaseHold?(fade?: number): Promise<void>;
  /** (optional) a film's last frame is still up */
  holding?(): boolean;
  /** (optional) drop warm films (one, or all) */
  drop?(id?: string): void;
}
/**
 * (agent FINAL) how a story film hands over to what follows: `hold` keeps its last frame up (the next film mounts over
 * it, or releaseFilmHold lets it go — a scene can change under it); `next` runs on its last frame, before the film gives
 * the music back (the caller sets the music that comes next: a state, a quiet hold)
 */
export interface FilmHandOff {
  hold?: boolean;
  next?: () => void;
  /** not warm yet: wait on plain black, not the titled loading screen */
  bare?: boolean;
  /** the flow takes the film's song over when it ends (FilmDef.keep) */
  keep?: boolean;
  /** (P3-CINE) a hard cut into the film: no transformation of the world first (film/morph.ts) */
  cut?: boolean;
}
let port: FilmPort | null = null;
let portTried = false;
/** tests / dev: replace the film engine (null = back to CINE's) */
export function setFilmPort(p: FilmPort | null) {
  port = p;
  portTried = !!p;
}
async function filmPort(): Promise<FilmPort | null> {
  if (port || portTried) return port;
  portTried = true;
  try {
    const f = await import('../film');
    port = {
      has: (id) => !!f.getFilm(id),
      ids: () => f.filmIds(),
      play: (idOrDef, o) => f.playFilm(idOrDef as Parameters<typeof f.playFilm>[0], { seen: o.seen, hold: o.hold, next: o.next, bare: o.bare, keep: o.keep, cut: o.cut }),
      preload: (idOrDef, o) => f.preloadFilm(idOrDef as Parameters<typeof f.preloadFilm>[0], o),
      releaseHold: (fade) => f.releaseFilmHold(fade),
      holding: () => f.filmHolding(),
      drop: (id) => f.dropPreloads(id),
    };
  } catch (e) {
    console.warn('[presentación] el motor de películas no cargó: queda la tarjeta animada', e);
    port = null;
  }
  return port;
}

/** CINE's parametrized briefing film (a FilmDef built from the stage's data), when it registers one */
export type BriefingTemplate = (d: BriefingData) => object | null;
let template: BriefingTemplate | null = null;
export function registerBriefingTemplate(t: BriefingTemplate | null) {
  template = t;
}

export const introSeenKey = (dim: DimId, n: GateraNode) => `intro:${gateraBattleId(dim, n)}`;
/** `film:<id>` (ids are case-insensitive: the stages say `F01`, CINE registers `f01`) */
export const filmSeenKey = (id: string) => `film:${id.toLowerCase()}`;
/** «Volver a ver»: a film watched (or skipped) at least once */
export const filmSeen = (id: string) => seenG(filmSeenKey(id));

/** the film ids a stage answers to, in order: its data's `film`, then its battle id */
export function filmIdsFor(dim: DimId, n: GateraNode): string[] {
  const def = gateraBattleDef(dim, n);
  return [...new Set([def?.film, gateraBattleId(dim, n)].filter((x): x is string => !!x))];
}

/** pure given the save and the film registry: what plays before this stage */
export function planIntro(dim: DimId, n: GateraNode, has: (id: string) => boolean, hasTemplate = !!template): IntroPlan {
  const seen = seenG(introSeenKey(dim, n));
  if (seen) return { mode: 'none', filmId: null, seen };
  const film = filmIdsFor(dim, n).find((id) => has(id)) ?? null;
  if (film) return { mode: 'film', filmId: film, seen };
  return { mode: hasTemplate ? 'template' : 'card', filmId: null, seen };
}

const DEFAULT_STAKES: Record<GateraStageDef['kind'], string> = {
  normal: 'Si perdemos, solo perdemos tiempo: el 30 % del oro y ninguna huella. La caja sigue aquí.',
  elite: 'Es un muro de la caja. Si perdemos, ajustamos la tripulación y volvemos.',
  boss: 'El rastro de Cerito. Si perdemos, la puerta sigue cerrada.',
};

/** the other rival cats of the battle that will play (its real roster), by painting: the captain out, no repeats, ≤ 3 */
export function crewSlugsOf(spec: BattleSpec, captain: string | null): string[] {
  const out: string[] = [];
  for (const c of spec.enemy?.cats ?? []) {
    if (!c.slug || c.slug === captain || out.includes(c.slug)) continue;
    out.push(c.slug);
    if (out.length >= 3) break;
  }
  return out;
}

/** the presentation's data for a stage (pure given the save; `demo` and `estimate` are passed in) */
export function briefingData(dim: DimId, n: GateraNode, spec: BattleSpec, o: { demo?: RuleDemo | null; estimate?: () => Estimate | null; huellas?: number } = {}): BriefingData {
  const def = gateraBattleDef(dim, n)!;
  const d = dimDef(dim);
  const first = gateraLootPreview(dim, n).frontier;
  const lines = spec.intro?.lines?.length ? [...spec.intro.lines] : def.teach ? [def.teach] : [];
  return {
    battleId: gateraBattleId(dim, n),
    dim,
    n: def.n,
    node: def.node,
    label: def.label,
    kind: def.kind,
    tag: spec.intro?.tag ?? d.name,
    dimName: d.name,
    title: def.name,
    pasa: def.pasa ?? `Seguimos el rastro de Cerito por ${d.name}: ${def.name}.`,
    rival: { name: def.captainName ?? spec.enemyName, line: def.line ?? null, slug: spec.intro?.slug ?? null, crew: spec.enemy.cats.map((c) => c.name), crewSlugs: crewSlugsOf(spec, spec.intro?.slug ?? null) },
    rule: { lines, demo: o.demo ?? null },
    stakes: def.stakes ?? DEFAULT_STAKES[def.kind],
    huellas: first ? (o.huellas ?? 0) : 0,
    estimate: o.estimate ?? (() => null),
  };
}

export type IntroResult = 'go' | 'back';

/** a stage's presentation data with its rule's live demo (the sim computes it) */
async function stageData(dim: DimId, n: GateraNode, spec: BattleSpec, estimate: () => Estimate | null): Promise<BriefingData> {
  const def = gateraBattleDef(dim, n);
  const { ruleDemo, demoFor } = await import('../battle/demo');
  const rule = demoFor(def?.mareo);
  let demo: RuleDemo | null = null;
  try {
    demo = rule ? ruleDemo(rule, def!.mareo) : null;
  } catch (e) {
    console.warn('[presentación] sin demostración de la regla', e);
  }
  return briefingData(dim, n, spec, { demo, estimate, huellas: gateraLootPreview(dim, n).huellas });
}

/**
 * Before a Carta battle (the hook). `spec` is the battle that will play (already built), `estimate` the live numbers
 * of the run the caller launched. Returns 'back' only when the player chose to go back to the Carta from the card.
 */
export async function stageIntro(dim: DimId, n: GateraNode, spec: BattleSpec, estimate: () => Estimate | null): Promise<IntroResult> {
  const fp = await filmPort();
  // a stage names its film as the story does («F09»); CINE's id may be «f09_…» (resolved by prefix, like story films)
  const idOf = (id: string) => (fp?.has(id) ? id : (fp?.ids?.().find((x) => x.startsWith(`${id.toLowerCase()}_`)) ?? null));
  const plan = planIntro(dim, n, (id) => !!idOf(id));
  if (plan.mode === 'none') return 'go';
  const key = introSeenKey(dim, n);
  const data = () => stageData(dim, n, spec, estimate);
  // 1–2: a film (hand-made, or CINE's template filled with the stage's data). (P3-CINE) Its last frame holds: the battle
  // is built under it and the frame fades into it (app/cajasFlow.ts) — no Carta flashing in between, no comic wipe
  if (fp && (plan.mode === 'film' || plan.mode === 'template')) {
    const film = plan.mode === 'film' ? (idOf(plan.filmId!) ?? plan.filmId!) : template?.(await data());
    if (film) {
      const r = await fp.play(film, { seen: plan.seen, hold: true }).catch((e) => {
        console.warn('[presentación] la película falló: queda la tarjeta animada', e);
        return null;
      });
      if (r && r.end !== 'aborted') {
        markSeenG(key);
        if (typeof film === 'string') markSeenG(filmSeenKey(film));
        spec.intro = undefined;
        return 'go';
      }
    }
  }
  // 3: the animated card
  try {
    const { playBriefingCard } = await import('../ui/briefingCard');
    const res = await playBriefingCard(await data());
    // VOLVER (back to the Carta) doesn't count as seen: next time the card plays again
    if (res === 'go') {
      markSeenG(key);
      spec.intro = undefined;
    }
    return res;
  } catch (e) {
    // a presentation must never block a battle
    console.warn('[presentación] la tarjeta no se pudo mostrar', e);
    return 'go';
  }
}

// ------------------------------------------------------------------ (P3-CINE) the stage's film warms while its card is read
let warmStage: string | null = null;
/**
 * The Carta opened a stage's card: its presentation film (a registered one, not seen yet) is built and baked while the
 * player reads the card, so ZARPAR goes straight into the transformation and the film (film/morph.ts). Another card
 * drops the previous warm-up; a template film (built from the stage's data at ZARPAR) isn't warmed: the transformation
 * covers it.
 */
export async function warmStageFilm(dim: DimId, n: GateraNode): Promise<boolean> {
  const fp = await filmPort();
  if (!fp?.preload) return false;
  const idOf = (id: string) => (fp.has(id) ? id : (fp.ids?.().find((x) => x.startsWith(`${id.toLowerCase()}_`)) ?? null));
  let plan: IntroPlan;
  try {
    plan = planIntro(dim, n, (id) => !!idOf(id));
  } catch {
    return false;
  }
  // a briefing built from the stage's data (CINE's template): the same data builds the same film at ZARPAR
  // (gaterasBattles is deterministic; the estimate is read live, from the run the card and ZARPAR share)
  let film: string | object | null = plan.mode === 'film' && plan.filmId ? idOf(plan.filmId) : null;
  if (plan.mode === 'template' && template) {
    try {
      const [{ buildGateraBattle }, { simulateEstimate }] = await Promise.all([import('../state/sys/gaterasBattles'), import('../state/sys/estimate')]);
      const spec = buildGateraBattle(dim, n, () => undefined);
      let latest: Estimate | null = null;
      void simulateEstimate(spec.meta?.special ?? `${dim}_${n}`, () => buildGateraBattle(dim, n, () => undefined), (e) => (latest = e)).catch(() => undefined);
      film = template(await stageData(dim, n, spec, () => latest));
    } catch (e) {
      console.warn('[presentación] no se pudo preparar la película de la etapa', e);
      film = null;
    }
  }
  const id = typeof film === 'string' ? film : ((film as { id?: string } | null)?.id ?? null);
  if (warmStage && warmStage !== id) fp.drop?.(warmStage);
  warmStage = id;
  if (!film) return false;
  return fp.preload(film, { seen: plan.seen }).catch(() => false);
}
/** the stage card closed without sailing: its warm film goes */
export async function dropStageFilm(): Promise<void> {
  const id = warmStage;
  warmStage = null;
  if (id) (await filmPort())?.drop?.(id);
}

// ------------------------------------------------------------------ story films (a song film, a scene film)
/**
 * A film at a story moment (EM%EN in H73, OH SHIT in H74, the shadow theatre of H70, the silent morning of H72): CINE's
 * engine if it has it registered — the first time with `seen: false` (a song film can't be skipped then: CINE's rule) —
 * else `fallback()` (the film's lines as dialog). Watched or skipped → `film:<id>` is seen («Volver a ver» lists it).
 * 'interrupted': the film was cut by the scene going away (the caller plays it again later).
 */
/**
 * The registered id a story asks for: itself, or — for a film CINE hasn't named yet when the story was written (F31,
 * F36) — the one registered as `<id>_…` (lowercase). null = not registered (the story plays its lines).
 */
export async function resolveStoryFilm(id: string): Promise<string | null> {
  const fp = await filmPort();
  if (!fp) return null;
  if (fp.has(id)) return id;
  const k = `${id.toLowerCase()}_`;
  return fp.ids?.().find((x) => x.startsWith(k)) ?? null;
}
export async function playStoryFilm(
  id: string,
  fallback: () => Promise<void>,
  /** the film played: its optional inputs and how it ended (a flow keeps a choice the film already asked, H78) */
  onPlayed?: (inputs: Record<string, string>, end: 'done' | 'exited') => void,
  /** `seen`: how the film may be left, decided by the caller (a flow that lists it in «Volver a ver» before it plays) */
  o: { seen?: boolean } & FilmHandOff = {},
): Promise<'film' | 'fallback' | 'interrupted'> {
  const fp = await filmPort();
  id = (await resolveStoryFilm(id)) ?? id;
  if (fp?.has(id)) {
    const r = await fp.play(id, { seen: o.seen ?? filmSeen(id), hold: o.hold, next: o.next, bare: o.bare, keep: o.keep, cut: o.cut }).catch((e) => {
      console.warn('[película] falló: queda el respaldo', id, e);
      return null;
    });
    if (r?.end === 'aborted') return 'interrupted';
    if (r) {
      markSeenG(filmSeenKey(id));
      // (P3-CINE) a song film: its song goes into the Fonoteca (app/p3Songs.ts; silently during the mourning)
      const fid = id;
      void import('./p3Songs').then((m) => m.unlockSongOfFilm(fid)).catch(() => undefined);
      try {
        onPlayed?.(r.inputs ?? {}, r.end);
      } catch (e) {
        console.warn('[película] el flujo no pudo leer las entradas', id, e);
      }
      return 'film';
    }
  }
  // a film's held frame never stays over a fallback (its lines are dialog on the game's screen)
  await fp?.releaseHold?.(0.4);
  await fallback();
  return 'fallback';
}

// ------------------------------------------------------------------ (agent FINAL) warm films and held frames, for the flows
/** warm a story film ahead (by its story id: `f36` → `f36_mira`); false when it isn't registered or can't warm */
export async function preloadStoryFilm(id: string, o: { seen?: boolean; after?: number } = {}): Promise<boolean> {
  const fp = await filmPort();
  if (!fp?.preload) return false;
  const rid = await resolveStoryFilm(id);
  if (!rid) return false;
  return fp.preload(rid, { seen: o.seen ?? filmSeen(rid), after: o.after }).catch(() => false);
}
/** let a story film's held last frame go (fade s) */
export async function releaseStoryHold(fade = 0): Promise<void> {
  const fp = await filmPort();
  await fp?.releaseHold?.(fade);
}
/** a story film's last frame is still on screen */
export async function storyHolding(): Promise<boolean> {
  const fp = await filmPort();
  return !!fp?.holding?.();
}
/** drop warm story films (by registered id, or all) */
export async function dropStoryPreloads(id?: string): Promise<void> {
  const fp = await filmPort();
  fp?.drop?.(id);
}

/** the Acto I films and their spoiler-safe titles («Volver a ver»; historia-v2/03-peliculas.md F01–F08) */
export const FILM_TITLES: Record<string, string> = {
  f01: 'Oficial Dona',
  f02: 'El precio de bajar',
  f03: 'NINGUNA CAJA ES HOGAR',
  // F04 is six short films (FILM-ACTO1): the prologue, the three places (any order), the bar, the epilogue
  f04_prologo: 'La mañana en blanco y negro · Prólogo',
  f04_doneria: 'La mañana en blanco y negro · La Donería',
  f04_hipomart: 'La mañana en blanco y negro · El Hipo-Mart',
  f04_parque: 'La mañana en blanco y negro · El parque',
  f04_bar: 'La mañana en blanco y negro · El bar',
  f04_epilogo: 'La mañana en blanco y negro · Epílogo',
  f05: 'La Batalla de Gatos',
  f06: 'Cuadra 8',
  f07: 'El Cadenero',
  f08: 'Caída por el multiverso',
  // the Actos II–IV (FILM-ACTO2/3/4; by prefix: `f09` lists `f09_…`, `f14` the three strips, `f25` its Bisagra cut)
  f09: 'Ciudad Mayúscula',
  f10: 'Villanos sueltos',
  f11: 'Cruceta',
  f12: 'Cerito',
  f13: 'El Gran Torneo',
  f14: 'Entrenamiento',
  // (QA-P3) the three strips are three entries in «Volver a ver»: each says which one
  f14_1: 'Entrenamiento (1/3)',
  f14_2: 'Entrenamiento (2/3)',
  f14_3: 'Entrenamiento (3/3)',
  f15: 'Itō',
  f16: 'Una sola línea',
  f17: 'La Vocación',
  f18: 'La Encuadernadora',
  f19: 'Lo que se derrama, se termina',
  f20: 'El índice',
  h85_oscuridad: 'La oscuridad',
  f21: 'El plan',
  f22: 'La corrección',
  f23: 'El expediente',
  f24: 'Señal pirata',
  f25: 'Datamosh',
  f26: 'El mánager',
  f27: 'Karaoke',
  f28: 'Firma',
  f29: 'El show',
  f30: 'La noche estrellada',
  // ⚠️ the finale (CINE, films/final): listed only once seen. F31 and F36 by prefix until CINE names them
  f31: 'Se acerca una luz',
  f32_caida: 'La caída',
  f33_noche: 'La noche sin Canelo',
  f34_amanecer: 'Antes del amanecer',
  f34_golpe: 'Antes del amanecer (II)',
  f34_trazo: 'Antes del amanecer (III)',
  f35_sadie: 'Linterna mágica',
  f36: 'MIRA',
  f37_mano: 'La Mano',
  f38_vigilia: 'La vigilia',
  f39_recado: 'El recado',
  f39_creditos: 'Créditos',
  f39_continuara: 'Continuará',
  f40_ronda: 'La última ronda',
};
/** «Volver a ver»: the films this save watched (or skipped) at least once, in story order */
export function seenFilms(): { id: string; title: string }[] {
  const seen = new Set((gaterasSeen() ?? []).filter((k) => k.startsWith('film:')).map((k) => k.slice(5)));
  const out: { id: string; title: string }[] = [];
  for (const key of Object.keys(FILM_TITLES)) {
    if (seen.has(key)) out.push({ id: `film:${key}`, title: FILM_TITLES[key] });
    // a film asked by prefix (f31 → f31_…): listed under the story's title
    else for (const id of seen) if (id.startsWith(`${key}_`) && !(id in FILM_TITLES)) out.push({ id: `film:${id}`, title: FILM_TITLES[key] });
  }
  return out;
}
/** replay a seen film from «Volver a ver» (nothing is saved: it was seen already) */
export async function replayFilm(id: string): Promise<boolean> {
  const fp = await filmPort();
  if (!fp?.has(id)) return false;
  const r = await fp.play(id, { seen: true }).catch(() => null);
  return !!r && r.end !== 'aborted';
}
