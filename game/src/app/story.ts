/**
 * Story / onboarding orchestration (owned by the story module).
 *
 *  maybeIntro(info)  — called by the title: new game → Prologue (b00) → island → b01;
 *                      existing save → island (+ "Mientras no estabas…" if away > 60 s).
 *  initStory()       — idempotent; listens to G ('mission' | 'klUp' | 'res' | 'element') and plays
 *                      M1 beats b01–b11 once each (G.s.beatsSeen), mission tips (Luzterna), T2 mission
 *                      panels, kingdom banners/posters and the H02 naming prompt. Never interrupts
 *                      battles: everything waits until the island/map is on screen and calm.
 */
import type { BootInfo } from '../state';
import gsap from 'gsap';
import { G } from '../state/game';
import { scenes } from '../core/scenes';
import { W, H, game } from '../core/App';
import { CONTENT, BEAT_BY_ID, MISSION_BY_ID, MissionDef } from '../data/content';
import { lastRewards } from '../state/sys/missions';
import { collectAll } from '../state/sys/island';
import { beatSeen, markBeat, lineSeen, markLine, firstCat, nameFirstCat, offlineSummary } from '../state/ext/story';
import { Line, say, tip, clearTips, cancelDialogs, dialogActive, storyLayer } from '../ui/dialog';
import { Modal } from '../ui/modal';
import { missionPanel, kingdomBanner, milestonePoster, DoneItem } from '../ui/story/rewards';
import { promptCatName } from '../ui/story/nameCat';
import { offlineReport } from '../ui/story/offline';
import { askPlayerProfile } from '../ui/story/profile';
import { zoneCard } from '../ui/story/zoneCard';
import { BOSS_INTRO, BOSS_OUTRO, ELITE_WARN, ZONE_INTRO } from '../ui/story/script';
import { gtxt } from '../ui/gender';
import { isCleared, zoneUnlocked } from '../state/sys/campaign';
import { darkSky } from '../ui/story/effects';
import { preloadStoryArt } from '../ui/story/portrait';
import { applyAudioSettings, openSettings } from '../panels/Settings';
import { destroyDeep, killTweensDeep } from '../ui/story/tweens';
import { goIsland, goTitle } from './flow';

// ------------------------------------------------------------------ beat plan (M1: b01–b11 · M2: zones 2–3)
interface BeatRef {
  beat: string;
  /** subset of the beat's lines (indexes); default all */
  lines?: number[];
  part?: string;
  effect?: 'darkSky';
  /** seconds to wait (calm) before playing */
  delay?: number;
  /** lines written in ui/story/script.ts instead of content.story */
  custom?: Line[];
  /** non-dialog beat: the player profile prompt (name + gender) */
  special?: 'profile';
  /** zone arrival card before the lines (and the map pans to that zone) */
  card?: number;
  /** only plays on this screen */
  onlyOn?: 'map' | 'island';
}
/** beats that open when a mission APPEARS */
const ON_NEW: Record<string, BeatRef[]> = {
  // Luzterna wakes you up → asks your name and gender → points at Canelo
  H01: [{ beat: 'b01_despertar', part: 'a', lines: [0, 1] }, { beat: 'profile', special: 'profile', onlyOn: 'island' }, { beat: 'b01_despertar', part: 'b', lines: [2] }],
  H03: [{ beat: 'b04_pescado' }],
  H05: [{ beat: 'b06_patito', part: 'a', lines: [0, 1, 2, 3] }],
  H06: [{ beat: 'b07_resonancia', part: 'a', lines: [0] }],
  H08: [{ beat: 'b10_bigotes', part: 'a', lines: [0, 1] }],
  H09: [{ beat: 'b11_noctis', delay: 30 }],
  // boss presentations (the boss node just became the frontier)
  H10: [{ beat: 'b12_gargola', part: 'a', custom: BOSS_INTRO[2], onlyOn: 'map' }],
  H13: [{ beat: 'b15_kraken', part: 'a', custom: BOSS_INTRO[3], onlyOn: 'map' }],
};
/** beats that play when a mission is COMPLETED */
const ON_DONE: Record<string, BeatRef[]> = {
  H04: [{ beat: 'b05_nam' }],
  H05: [{ beat: 'b06_patito', part: 'b', lines: [4, 5] }],
  H06: [{ beat: 'b07_resonancia', part: 'b', lines: [1, 2] }],
  H07: [{ beat: 'b09_nube', effect: 'darkSky' }],
  K07: [{ beat: 'b08_pimenton' }],
  H08: [{ beat: 'b10_bigotes', part: 'b', lines: [2, 3, 4] }],
  // boss farewells (the T4 element discovery already played in Results)
  H10: [{ beat: 'b12_gargola', part: 'b', custom: BOSS_OUTRO[2] }],
  H13: [{ beat: 'b15_kraken', part: 'b', custom: BOSS_OUTRO[3] }],
};

/** beats that fire when a condition becomes true (checked while calm on island/map) */
const WHEN: { key: string; cond: () => boolean; ref: BeatRef }[] = [
  { key: 'z2_intro', cond: () => zoneUnlocked(2) && !zoneUnlocked(3), ref: { beat: 'z2_intro', custom: ZONE_INTRO[2], card: 2, onlyOn: 'map', delay: 2.6 } },
  { key: 'z2_elite', cond: () => isCleared('2-4') && !isCleared('2-5'), ref: { beat: 'z2_elite', custom: ELITE_WARN[2], delay: 1.2 } },
  { key: 'z3_intro', cond: () => zoneUnlocked(3) && !zoneUnlocked(4), ref: { beat: 'z3_intro', custom: ZONE_INTRO[3], card: 3, onlyOn: 'map', delay: 2.6 } },
  { key: 'z3_elite', cond: () => isCleared('3-4') && !isCleared('3-5'), ref: { beat: 'z3_elite', custom: ELITE_WARN[3], delay: 1.2 } },
];
/** the 'new' tip of these missions is already said by a beat / special UI (or would spoil it) */
const COVERED = new Set(['H01', 'H02', 'H03', 'H04', 'H05', 'H06', 'H07', 'H08', 'H09', 'K07', 'H10', 'H13']);

interface QueuedBeat {
  key: string;
  ref: BeatRef;
  notBefore: number;
}

// ------------------------------------------------------------------ state
let inited = false;
let busy = false;
let panelShowing = false;
const beats: QueuedBeat[] = [];
const done: DoneItem[] = [];
let lastDoneAt = 0;
const kls: number[] = [];
const panelTimes: number[] = [];
let renamePrompted = false;
let introRunning = false;
let pumpTimer = 0;

let IslandCls: (abstract new (...a: never[]) => unknown) | null = null;
let MapCls: (abstract new (...a: never[]) => unknown) | null = null;

// ------------------------------------------------------------------ helpers
function where(): 'island' | 'map' | 'battle' | 'other' {
  const c = scenes.current;
  if (!c) return 'other';
  const n = c.constructor.name;
  if ((IslandCls && c instanceof IslandCls) || n === 'IslandScene') return 'island';
  if ((MapCls && c instanceof MapCls) || n === 'MapScene') return 'map';
  if (/Battle/.test(n)) return 'battle';
  return 'other';
}
function transitioning() {
  return !!(scenes as unknown as { busy?: boolean }).busy;
}
/** a non-modal full-screen thing is up (cat reveal, battle results, cinematic…) */
function overlayBlocked() {
  const sl = storyLayer();
  for (const ch of scenes.overlayLayer.children) {
    if (ch === sl || !ch.visible || ch.destroyed) continue;
    if (ch instanceof Modal) continue;
    return true;
  }
  for (const ch of scenes.fxLayer.children) {
    if (!ch.visible || ch.destroyed) continue;
    const b = ch.getBounds();
    if (b.width >= W * 0.9 && b.height >= H * 0.8) return true;
  }
  return false;
}
/** a poster panel (Modal) is open on top of the scene */
function modalOpen() {
  return scenes.overlayLayer.children.some((ch) => ch instanceof Modal && ch.visible && !ch.destroyed && !ch.closed);
}
function canTip() {
  const w = where();
  return (w === 'island' || w === 'map') && !transitioning() && !dialogActive() && !introRunning;
}
function canPanel() {
  return canTip() && !overlayBlocked();
}
function canBeat() {
  // completed-mission panels go first, then the beat
  return canPanel() && !busy && !panelShowing && done.length === 0;
}

/** Luzterna calls you "grumete" until Boss 1, "Capi" afterwards; Canelo keeps the name you gave him. */
function personalize(sp: string, text: string) {
  let t = gtxt(text);
  const c = firstCat();
  if (c && c.species === 'c_canelo' && c.name && c.name !== 'Canelo') t = t.replace(/\bCanelo\b/g, c.name);
  if (sp.toUpperCase() === 'LUZTERNA' && G.s.campaign.bossesDefeated >= 1) t = t.replace(/\bgrumete\b/g, 'Capi');
  return t;
}
function resonanceNames(text: string) {
  const job = G.s.resonance.jobs[G.s.resonance.jobs.length - 1];
  if (!job) return text;
  const nm = (uid: string) => {
    const c = G.s.cats.find((x) => x.uid === uid);
    return c?.name ?? '???';
  };
  return text.replace(/Canelo y Brote/g, `${nm(job.a)} y ${nm(job.b)}`);
}

function beatLines(ref: BeatRef): Line[] {
  if (ref.custom) return ref.custom.map(([sp, t]) => [sp, personalize(sp, t)] as Line);
  const b = BEAT_BY_ID.get(ref.beat);
  if (!b) return [];
  const idx = ref.lines ?? b.lines.map((_, i) => i);
  return idx
    .map((i) => b.lines[i])
    .filter(Boolean)
    .map(([sp, t]) => {
      let text = personalize(sp, t);
      if (ref.beat === 'b07_resonancia' || ref.beat === 'b08_pimenton') text = resonanceNames(text);
      return [sp, text] as Line;
    });
}

function keyOf(ref: BeatRef) {
  return ref.part ? `${ref.beat}#${ref.part}` : ref.beat;
}

function queueBeat(ref: BeatRef) {
  const key = keyOf(ref);
  if (beatSeen(key) || beatSeen(ref.beat) || beats.some((q) => q.key === key)) return;
  beats.push({ key, ref, notBefore: performance.now() + (ref.delay ?? 0) * 1000 });
}

// ------------------------------------------------------------------ events
function onMission(id: string, kind: 'new' | 'progress' | 'done') {
  const m = MISSION_BY_ID.get(id);
  if (!m) return;
  if (kind === 'new') {
    for (const r of ON_NEW[id] ?? []) queueBeat(r);
    if (COVERED.has(id)) markLine(id);
  } else if (kind === 'done') {
    done.push({ m, r: lastRewards.get(id) });
    lastDoneAt = performance.now();
    for (const r of ON_DONE[id] ?? []) queueBeat(r);
    // H09 done before its delayed beat → play it now
    const q = beats.find((x) => x.ref.beat === 'b11_noctis');
    if (id === 'H09' && q) q.notBefore = 0;
  }
}

function maybeTip(m: MissionDef) {
  if (!m.line || lineSeen(m.id) || COVERED.has(m.id)) return false;
  if (!G.s.missions.pinned.includes(m.id) && m.chain !== 'historia') {
    markLine(m.id);
    return false;
  }
  markLine(m.id);
  tip(personalize('LUZTERNA', m.line), { title: m.title });
  return true;
}

// ------------------------------------------------------------------ pump
async function pump() {
  if (!inited) return;
  const now = performance.now();
  // T1 kingdom banner (non-blocking) — show on island/map
  if (kls.length && canPanel() && !busy) {
    const levels = kls.splice(0, kls.length).sort((a, b) => a - b);
    const top = levels[levels.length - 1];
    const lines: string[] = [];
    const rules: string[] = [];
    for (const kl of levels) {
      const ms = CONTENT.kingdomMilestones.find((x) => x.kl === kl);
      if (!ms) continue;
      for (const u of ms.unlocks) (u.changesRules ? rules : lines).push(u.text);
    }
    const cap = CONTENT.kingdomMilestones.find((x) => x.kl === top)?.catLevelCap;
    if (cap) lines.unshift(`Tope de nivel de gato: ${cap}`);
    kingdomBanner(storyLayer(), top, lines);
    if (rules.length) {
      busy = true;
      await wait(1.6);
      try {
        await milestonePoster(storyLayer(), top, rules);
      } finally {
        busy = false;
      }
    }
    return;
  }
  // T2 mission panels (grouped)
  if (done.length && !panelShowing && canPanel() && !busy && now - lastDoneAt > 450) {
    const items = done.splice(0, done.length);
    while (panelTimes.length && now - panelTimes[0] > 90000) panelTimes.shift();
    const short = panelTimes.length >= 3 || items.length >= 3;
    panelTimes.push(now);
    panelShowing = true;
    void missionPanel(storyLayer(), items, short).finally(() => {
      panelShowing = false;
    });
    return;
  }
  // condition beats (zone arrivals, elite warnings) join the queue when they become true
  if (canBeat()) {
    // a save without a player profile (old saves, dev fixtures): Luzterna asks before anything else
    // (only on the island, never over a battle / results / casino / an open panel)
    if (!G.s.player && G.s.cats.length && where() === 'island' && !G.s.missions.active.includes('H01') && !beats.some((q) => q.ref.special === 'profile'))
      beats.unshift({ key: 'profile', ref: { beat: 'profile', special: 'profile', custom: OLD_SAVE_PROFILE_INTRO, onlyOn: 'island' }, notBefore: now + 900 });
    for (const w of WHEN) {
      if (beatSeen(w.key) || beats.some((q) => q.key === w.key)) continue;
      if (w.ref.onlyOn && w.ref.onlyOn !== where()) continue;
      if (w.cond()) queueBeat(w.ref);
    }
  }
  // blocking beats
  if (beats.length && canBeat()) {
    const here = where();
    const i = beats.findIndex((q) => now >= q.notBefore && (!q.ref.onlyOn || q.ref.onlyOn === here));
    if (i >= 0) {
      const q = beats.splice(i, 1)[0];
      await playBeat(q);
      return;
    }
  }
  // H02 naming prompt
  if (!renamePrompted && G.s.missions.active.includes('H02') && canBeat() && !beats.some((q) => q.notBefore <= now)) {
    renamePrompted = true;
    busy = true;
    try {
      const c = firstCat();
      const name = await promptCatName(storyLayer(), c?.name || 'Canelo', 'canelo_cozy_cat');
      nameFirstCat(name);
      markBeat('b02_nombre');
    } finally {
      busy = false;
    }
    return;
  }
  // mission tips (non-blocking)
  if (canTip() && !busy) {
    for (const id of G.s.missions.active) {
      const m = MISSION_BY_ID.get(id);
      if (m && maybeTip(m)) break;
    }
  }
}

async function playBeat(q: QueuedBeat) {
  if (beatSeen(q.key)) return; // seen meanwhile (another path played it)
  if (q.ref.special === 'profile') {
    if (G.s.player) return markBeat(q.key);
    // island only and with no panel open (e.g. the Shipyard, whose PROBAR starts a battle): else retry later
    if (where() !== 'island' || modalOpen()) {
      beats.push({ ...q, notBefore: performance.now() + 2000 });
      return;
    }
    busy = true;
    try {
      const res = await askPlayerProfile(storyLayer(), { intro: q.ref.custom ?? [], guard: () => where() === 'island' && !transitioning() });
      if (res) {
        markBeat(q.key);
        G.save();
      }
    } finally {
      busy = false;
    }
    return;
  }
  if (q.ref.card) {
    busy = true;
    try {
      const sc = scenes.current as unknown as { focusZone?: (z: number, animate?: boolean) => void };
      sc.focusZone?.(q.ref.card, true);
      await wait(0.5);
      await zoneCard(storyLayer(), q.ref.card);
    } finally {
      busy = false;
    }
  }
  const lines = beatLines(q.ref);
  if (!lines.length) {
    markBeat(q.key);
    return;
  }
  busy = true;
  try {
    const big = lines.length >= 3 || q.ref.effect !== undefined;
    await say(lines, {
      cinematic: big,
      dim: big ? 0.35 : 0.22,
      onLine: async (_i, sp, text) => {
        if (q.ref.effect === 'darkSky' && sp === 'SISTEMA' && text.startsWith('(')) await darkSky(storyLayer());
      },
    });
    markBeat(q.key);
    // whole beat seen once its last part played
    const b = BEAT_BY_ID.get(q.ref.beat);
    if (!q.ref.part || (q.ref.lines && b && q.ref.lines[q.ref.lines.length - 1] === b.lines.length - 1)) markBeat(q.ref.beat);
    G.save();
  } finally {
    busy = false;
  }
}

const wait = (s: number) => new Promise<void>((r) => window.setTimeout(r, s * 1000));

// ------------------------------------------------------------------ public
/** Install listeners (idempotent). Safe to call from dev routes too. */
export function initStory() {
  applyAudioSettings();
  if (inited) return;
  inited = true;
  void import('../scenes/IslandScene').then((m) => (IslandCls = m.IslandScene as never)).catch(() => undefined);
  void import('../scenes/MapScene').then((m) => (MapCls = m.MapScene as never)).catch(() => undefined);
  void preloadStoryArt(['jelly_aquatic_cat', 'arce_autumn_cat', 'masquerade_phantom_cat']);
  G.on('mission', (p) => onMission(p.id, p.kind));
  G.on('klUp', (p) => kls.push(p.kl));
  G.on('res', (p) => {
    if (p.key === 'gold' && p.source === 'habitat' && p.delta > 0 && !beatSeen('b03_oro')) {
      markBeat('b03_oro');
      const l = beatLines({ beat: 'b03_oro' })[0];
      if (l) tip(l[1]);
    }
  });
  // Earth arrives with Boss 1 (b10 part b carries "NUEVO ELEMENTO DESCUBIERTO: TIERRA"); dedupes with H08 done.
  // Storm arrives with Boss 2 → the Gárgola's farewell + Luzterna explains TORMENTA (dedupes with H10 done).
  G.on('element', (p) => {
    if (p.id === 'earth') for (const r of ON_DONE.H08 ?? []) queueBeat(r);
    if (p.id === 'storm') for (const r of ON_DONE.H10 ?? []) queueBeat(r);
  });
  catchUp();
  pumpTimer = window.setInterval(() => {
    if (pumping) return;
    pumping = true;
    pump()
      .catch((e) => console.warn('[story]', e))
      .finally(() => (pumping = false));
  }, 350);
}
let pumping = false;

/** queue the intro beats of missions that are already active (dev routes / old saves) */
function catchUp() {
  // old saves (or a skipped prompt) without a player profile: Luzterna asks first
  // (a brand-new game asks inside b01 instead: see ON_NEW.H01)
  if (!G.s.player && G.s.cats.length && !G.s.missions.active.includes('H01') && !beats.some((q) => q.ref.special === 'profile'))
    beats.unshift({ key: 'profile', ref: { beat: 'profile', special: 'profile', custom: OLD_SAVE_PROFILE_INTRO }, notBefore: performance.now() + 1500 });
  for (const id of G.s.missions.active) for (const r of ON_NEW[id] ?? []) queueBeat(r);
}

const OLD_SAVE_PROFILE_INTRO: Line[] = [
  ['LUZTERNA', 'Oye, oye. Llevamos un buen rato juntos y nunca te pregunté cómo te llamas. Qué grosera soy.'],
  ['LUZTERNA', 'En mi defensa: estoy muerta. Se me olvidan los modales. Y las llaves. Y el cuerpo.'],
];

/** reset in-memory queues (new game / wipe) */
function resetQueues() {
  beats.length = 0;
  done.length = 0;
  kls.length = 0;
  panelTimes.length = 0;
  renamePrompted = false;
  busy = false;
  panelShowing = false;
}

export async function maybeIntro(info: BootInfo) {
  initStory();
  resetQueues();
  if (info.isNew) {
    introRunning = true;
    try {
      await playPrologue();
    } finally {
      introRunning = false;
    }
    await goIsland();
    catchUp();
    return;
  }
  await goIsland();
  catchUp();
  if (info.offlineMs > 60_000 && G.s.cats.length) {
    busy = true;
    try {
      await wait(0.9);
      const s = offlineSummary(info);
      await offlineReport(storyLayer(), s, { canCollectAll: G.s.kl >= 3, onCollectAll: () => collectAll() });
    } finally {
      busy = false;
    }
  }
}

/** Beat b00: the "future" prologue. Resolves when it ends or is skipped (scene stays until next go()). */
export async function playPrologue() {
  const { PrologueScene } = await import('../scenes/PrologueScene');
  clearTips();
  // the title's "¡MIAU!" (and friends) must not tween a destroyed scene
  killTweensDeep(scenes.current);
  await new Promise<void>((res) => {
    void scenes.go(new PrologueScene(() => res()), 'none');
  });
  markBeat('b00_prologo');
}

/** Ajustes › VER PRÓLOGO */
export async function replayPrologue() {
  introRunning = true;
  try {
    await playPrologue();
  } finally {
    introRunning = false;
  }
  await goIsland();
}

/** Ajustes › BORRAR PARTIDA (after the double confirmation) */
export async function wipeSaveAndRestart() {
  cancelDialogs();
  clearTips();
  resetQueues();
  for (const ch of [...storyLayer().children]) destroyDeep(ch);
  for (const ch of [...scenes.overlayLayer.children]) if (ch !== storyLayer()) destroyDeep(ch);
  G.reset();
  await goTitle();
}

/** for debugging from the console: __story.state() */
(globalThis as unknown as { __story: unknown }).__story = {
  state: () => ({ where: where(), busy, panelShowing, beats: beats.map((b) => b.key), done: done.map((d) => d.m.id), kls: [...kls], canBeat: canBeat(), canTip: canTip() }),
  init: initStory,
  prologue: replayPrologue,
  /** freeze/thaw rendering (for screenshots) */
  freeze: () => game.pixi.ticker.stop(),
  thaw: () => game.pixi.ticker.start(),
  settings: () => openSettings(),
  /** test helper: queue a beat by id (ignores beatsSeen) */
  beat: (id: string) => {
    const ref = [...Object.values(ON_NEW), ...Object.values(ON_DONE)].flat().find((r) => r.beat === id) ?? { beat: id };
    beats.push({ key: id + '#dbg', ref: { ...ref, lines: undefined, part: undefined, delay: 0 }, notBefore: 0 });
  },
  /** slow everything down: __story.speed(0.2) */
  speed: (k: number) => gsap.globalTimeline.timeScale(k),
};
void pumpTimer;
