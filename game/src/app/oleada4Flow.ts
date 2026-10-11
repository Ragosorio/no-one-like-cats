/**
 * Parte II · Oleada 4 «El Umbral» on screen (state lives in state/sys/rupturasO4.ts · ecos.ts · olvidada.ts):
 *
 *  - the wave's CINE scenes (ui/story/o4Cines.ts) are registered here at boot; the story director plays them.
 *  - H59: the pinned mission's IR opens the sheet of a cat that can wake its Eco, on its ECOS section.
 *  - H60: Polvillo joins when you're back home (claimed once: rupturasO4.claimO4Cat, then the cat reveal); the last
 *    ruin standing hits YONOSE TODO's climax (doc 18 §5.2 H60) when you're there.
 *  - H61: the blank page «speaks» in strikethroughs (ui/story/o4Tachones.ts) right after you touch it in the region;
 *    the story director waits (hush) so its part c follows. A reload before it played → it plays the next calm moment.
 *  - H64: the blank page by YOUR faro (ui/story/o4Pagina.ts, kept in step with the save twice a second). Tapping the
 *    faro or the page plays THE FINALE (app/o4Finale.ts playFinale — MOMENTO: yonose_todo (H64→H65)): «Mentira»
 *    carried on into the Parte II credits. Also the pinned mission's IR. Nothing deadlocks: the world keeps inviting
 *    («TOCA EL FARO») after a reload, a trip, or a scene that got interrupted.
 *  - H65: a reload between «Mentira» and the end of the credits → the credits resume on the next calm moment at home
 *    (and the IR rolls them again while the mission waits).
 *  - Fonoteca unlocks of the wave (doc 18 §8), derived from mission progress (a reload or a reset catches up), only
 *    for recordings the catalog has.
 *
 * The watcher waits for calm like oleada2Flow: island, map or a 3D region, no panel, no dialog, no story overlay.
 */
import { Container } from 'pixi.js';
import { scenes } from '../core/scenes';
import { H, W } from '../core/App';
import { G } from '../state/game';
import { Modal } from '../ui/modal';
import { dialogActive, say, storyLayer } from '../ui/dialog';
import { beatSeen, markBeat } from '../state/ext/story';
import { catDef, BEAT_BY_ID } from '../data/content';
import { hush } from '../ui/hush';
import { audioApi } from '../audio/api';
import { settings } from '../core/settings';
import { onFaroTap } from '../state/sys/rupturas';
import { claimO4Cat, o4PendingCats } from '../state/sys/rupturasO4';
import { ecoCandidate } from '../state/sys/ecos';
import { DISTRAXIA_TACHONES } from '../ui/story/rupturasScriptO4';
import { pageHeldByCine } from '../ui/story/o4Cines';
import { syncFaroPage } from '../ui/story/o4Pagina';
import { cueBest, motif, unlockSoon } from '../cine/sound';
import { finaleRunning, playFinale } from './o4Finale';
import type { Line } from '../ui/dialog';

const CALM_MS = 2200;
let inited = false;
let busy = false;
let calmSince = 0;

let IslandCls: (abstract new (...a: never[]) => unknown) | null = null;
let MapCls: (abstract new (...a: never[]) => unknown) | null = null;

export function initOleada4() {
  if (inited) return;
  inited = true;
  void import('../scenes/IslandScene').then((m) => (IslandCls = m.IslandScene as never)).catch(() => undefined);
  void import('../scenes/MapScene').then((m) => (MapCls = m.MapScene as never)).catch(() => undefined);
  window.setInterval(() => {
    pageSync();
    musicUnlocks();
    if (busy) return;
    void pump().catch((e) => console.warn('[oleada4]', e));
  }, 500);
  G.on('mission', (p) => {
    if (p.kind === 'done' && p.id === 'H62') {
      // the Correctores' «perfect» chord breaks and resolves into the arc's cell (doc 18 §5.2 H62)
      // (a recording now; if it fails or comes late, its recipe is the scene motif 'correccion' — director.json)
      audioApi.stinger('correccion_rota');
    }
    // the last ruin stands: the color comes back (the region's «Reconstrucción» layers are O4-REGIONS'; the
    // original's climax is reserved for the Momentos: a stinger here)
    if (p.kind === 'done' && p.id === 'H60' && where() === 'region') {
      audioApi.stinger('reveal');
      motif('arco');
    }
    // you just touched the page (inside the region): the page answers before anything else may speak
    if (p.kind === 'done' && p.id === 'H61' && !beatSeen(TACHON_KEY)) {
      hush('o4_tachones', true);
      tachonHeld = true;
      window.setTimeout(() => void playDistraxia().catch((e) => console.warn('[oleada4]', e)), 450);
    }
  });
  // H64: the page waits by your faro — MOMENTO: yonose_todo (H64→H65) starts here (app/o4Finale.ts playFinale)
  onFaroTap(() => {
    if (G.s.missions.active.includes('H64') && where() === 'island') void playMentira();
  });
}

function where(): 'island' | 'map' | 'region' | 'other' {
  const c = scenes.current;
  if (!c) return 'other';
  // instanceof / duck-typing only, never `constructor.name`: a production build renames classes
  if (IslandCls && c instanceof IslandCls) return 'island';
  if (MapCls && c instanceof MapCls) return 'map';
  if (typeof (c as { regionId?: unknown }).regionId === 'string') return 'region';
  return 'other';
}
function calm(allowRegion = false): boolean {
  const w = where();
  if (w !== 'island' && w !== 'map' && !(allowRegion && w === 'region')) return false;
  if ((scenes as unknown as { busy?: boolean }).busy || dialogActive()) return false;
  const sl = storyLayer();
  if (sl.children.some((ch) => ch.visible && !ch.destroyed)) return false;
  for (const ch of scenes.overlayLayer.children) {
    if (ch === sl || !ch.visible || ch.destroyed) continue;
    if (ch instanceof Modal && ch.closed) continue;
    return false;
  }
  for (const ch of scenes.fxLayer.children as Container[]) {
    if (!ch.visible || ch.destroyed) continue;
    const b = ch.getBounds();
    if (b.width >= W * 0.9 && b.height >= H * 0.8) return false;
  }
  return true;
}

async function pump() {
  if (!G.s?.cats?.length) return;
  const cats = o4PendingCats();
  const page = G.s.missions.done.includes('H61') && !beatSeen(TACHON_KEY);
  const wantRegion = page;
  // H65 waiting with no finale on screen (a reload after «Mentira»): the credits resume at home
  const credits = G.s.missions.active.includes('H65') && !finaleRunning() && where() === 'island';
  if ((!cats.length && !page && !credits) || !calm(wantRegion)) {
    calmSince = 0;
    return;
  }
  // Polvillo waits for home (the island or the map): the region's goodbye plays first
  if (!page && where() === 'region') return;
  const now = performance.now();
  if (!calmSince) {
    calmSince = now;
    return;
  }
  if (now - calmSince < CALM_MS) return;
  busy = true;
  try {
    if (page) await playDistraxia();
    else if (cats.length) await joinCat(cats[0]);
    else if (credits && !(await import('../cine')).runningCine()) await playFinale({ from: 'credits' });
  } finally {
    busy = false;
    calmSince = 0;
  }
}

// ------------------------------------------------------------------ the page by your faro (H64 → after the Parte II)
function pageSync() {
  if (!G.s?.cats?.length || pageHeldByCine()) return;
  try {
    syncFaroPage({ onTap: () => (G.s.missions.active.includes('H64') ? void playMentira() : undefined) });
  } catch (e) {
    console.warn('[oleada4] page', e);
  }
}

// ------------------------------------------------------------------ Fonoteca (doc 18 §8)
const has = (id: string) => !!G.s?.missions?.done.includes(id);
const on = (id: string) => !!G.s?.missions && (G.s.missions.done.includes(id) || G.s.missions.active.includes(id));
/** what Oleada 4 hands the Fonoteca, and when (mission state: a reload or the narrative reset catch up) */
export const O4_SONGS: { ref: string; source: string; when: () => boolean }[] = [
  { ref: 'amb.suenos', source: 'El Archipiélago de los Sueños', when: () => on('H58') },
  { ref: 'yonose_todo.aftermath', source: 'La Isla que Nadie Recuerda', when: () => has('H60') },
  { ref: 'circus_malus.stinger', source: 'Los Correctores tienen un plan', when: () => has('H62') },
  { ref: 'amb.umbral', source: 'El Umbral', when: () => on('H63') },
  { ref: 'yonose_todo', source: 'Mentira', when: () => has('H64') },
  { ref: 'amb.registro_000', source: 'Continuará', when: () => has('H65') },
];
const songTried = new Set<string>();
function musicUnlocks() {
  if (!G.s?.cats?.length || !G.s.missions) return;
  for (const u of O4_SONGS) {
    if (songTried.has(u.ref)) continue;
    try {
      if (!u.when()) continue;
      // tried once per session; unlockSoon waits for calm and ignores recordings the catalog doesn't have yet
      if (unlockSoon(u.ref, u.source)) songTried.add(u.ref);
    } catch {
      /* never breaks the game */
    }
  }
}

/** a cat the story hands over outside a battle (H60: Polvillo) */
async function joinCat(species: string) {
  const r = claimO4Cat(species);
  if (!r) return;
  const cd = catDef(species);
  const { playCatReveal } = await import('../fx/sequences/catReveal');
  await playCatReveal(scenes.fxLayer, {
    slug: cd.art.slug,
    name: r.cat?.name ?? cd.name,
    elements: cd.elements,
    rarity: cd.rarity,
    species,
    caption: cd.lore,
    subtitle: `${cd.epithet} · ${cd.battleForm.cry}`,
    duplicateOrbs: r.isNew ? undefined : r.orbs,
    kicker: 'SE UNE A TU TRIPULACIÓN',
  });
  G.save();
}

// ------------------------------------------------------------------ H61: the page that strikes itself out
const TACHON_KEY = `${DISTRAXIA_TACHONES.beat}#${DISTRAXIA_TACHONES.part}`;
let tachonHeld = false;
let tachonPlaying = false;
/** Distraxia's lines (b61 part b) on the blank page, then Luzterna's reply. Marks the part. */
export async function playDistraxia() {
  if (tachonPlaying || beatSeen(TACHON_KEY)) return releaseTachon();
  tachonPlaying = true;
  const reduce = !!settings.reduceMotion;
  try {
    const b = BEAT_BY_ID.get(DISTRAXIA_TACHONES.beat);
    if (!b) return;
    const lines = DISTRAXIA_TACHONES.lines.map((i) => b.lines[i]?.[1]).filter((t): t is string => !!t);
    const reply = DISTRAXIA_TACHONES.reply.map((i) => b.lines[i]).filter(Boolean) as Line[];
    // the Archive's memory, very far away (doc 18 §5.2 H61): silence, the voices of ink at −15 dB, a stinger per strike
    audioApi.setState('silence', { fade: 1.5 });
    cueBest(['when_i_lose.ambient'], { fadeIn: 3, loop: true });
    audioApi.duck(true, 15, 'o4_tachones');
    const { playTachones } = await import('../ui/story/o4Tachones');
    await playTachones(storyLayer(), lines, {
      onStrike: () => {
        audioApi.stinger('tachon');
        motif('pluma');
      },
      reduceMotion: reduce,
      title: 'LA PÁGINA EN BLANCO',
    });
    markBeat(TACHON_KEY);
    G.save();
    audioApi.duck(false, 15, 'o4_tachones');
    if (reply.length) await say(reply, { dim: 0.25 });
    audioApi.release(3);
  } finally {
    tachonPlaying = false;
    releaseTachon();
  }
}
function releaseTachon() {
  if (!tachonHeld) return;
  tachonHeld = false;
  hush('o4_tachones', false);
}

// ------------------------------------------------------------------ H64 / H65 and the pinned mission's IR
async function cine(id: string) {
  const { playCine, runningCine } = await import('../cine');
  if (runningCine()) return 'interrupted' as const;
  const { storyLines } = await import('./story');
  return playCine(id, { host: { lines: (beat, idx) => storyLines(beat, idx) } });
}
/** the night of the page: tap the faro (or the page) → the finale (MOMENTO: yonose_todo (H64→H65), app/o4Finale.ts) */
export async function playMentira() {
  if (finaleRunning() || !G.s.missions.active.includes('H64') || where() !== 'island') return;
  await playFinale({ from: 'mentira' });
}

/** IslandScene's IR for this wave's use_feature goals */
export async function onPinnedFeature(feature: string) {
  if (feature === 'eco') {
    const uid = ecoCandidate();
    if (uid) (await import('../panels/CatPanel')).openCatPanel(uid, { section: 'ecos' });
    return;
  }
  // before the page came down (reload mid-scene): the finale starts from the faro all the same
  if (feature === 'mentira' && G.s.missions.active.includes('H64')) return playMentira();
  if (feature === 'continuara' && G.s.missions.active.includes('H65') && !finaleRunning()) return void playFinale({ from: 'credits' });
}

(globalThis as unknown as { __oleada4: unknown }).__oleada4 = { playDistraxia, onPinnedFeature, playMentira, playFinale, cine };
