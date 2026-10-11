/**
 * Parte II · Oleada 2 «El Cielo Despierta» on screen (state lives in state/sys/rupturasO2.ts):
 *
 *  - H48: right after Luzterna's question (beat b48_linterna part a) the 2-option choice opens (ui/story/profile
 *    choicePrompt). It is cosmetic and remembered (rupturasO2.linternaChoice). A reload before answering asks again
 *    when calm; the pinned mission's IR asks right away (IslandScene).
 *  - H45: Hélice joins when you're back home (claimed once: rupturasO2.claimO2Cat, then the cat reveal).
 *  - After the wave's ending, Luzterna remembers what you answered (one tip).
 *  - Sky battles: skyPreflight() — a ship that doesn't fly can't go up (offers the one that does, or the Astillero).
 *
 * The watcher waits for calm like formsFlow: island or map, no panel, no dialog, no story panel or cinematic.
 *
 * Cine pass (2026-10-10, docs/part-ii/22 «Pasada de cine»):
 *  - the wave's CINE scenes (ui/story/o2Cines.ts) are registered here at boot; the story director plays them.
 *  - the sky the story leaves on your island (ui/story/o2Sky.ts) is kept in step with the save twice a second, and
 *    the wave's Fonoteca records catch up (o2Cines.syncO2Songs).
 *  - H48: the question comes at the END of its scene (cine h48_senal); afterwards the faro invites (TOCA EL FARO, world
 *    state o2_senal) until you answer — tapping the faro or the pinned IR asks.
 *  - the CARTA's IR for H43/H48 (MapScene routes `kit_vuelo` / `linterna` here): chartFeature().
 *  - «se une un gato» never survives into a battle: it waits for its art BEFORE claiming, re-checks calm, holds the
 *    screen (hush) while it shows, closes itself if the scene changes, and a story battle waits for it (skyPreflight).
 */
import { Container } from 'pixi.js';
import { scenes } from '../core/scenes';
import { H, W } from '../core/App';
import { G } from '../state/game';
import { Modal, toast } from '../ui/modal';
import { Button, txt } from '../ui/widgets';
import { C, F } from '../ui/theme';
import { dialogActive, say, storyLayer, tip } from '../ui/dialog';
import { hush, hushed } from '../ui/hush';
import { runningCine } from '../cine/registry';
import { audioApi } from '../audio/api';
import { onFaroTap } from '../state/sys/rupturas';
import { beatSeen } from '../state/ext/story';
import { catDef } from '../data/content';
import { setActiveShip, shipName } from '../state/sys/ship';
import { LINTERNA_ASKED, chooseLinterna, claimO2Cat, hasFlightKit, isSkyBattle, kitShips, linternaChoice, linternaPending, o2PendingCats } from '../state/sys/rupturasO2';
import { linternaBassIn, syncO2Songs } from '../ui/story/o2Cines';
import { syncO2Sky } from '../ui/story/o2Sky';
import { LINTERNA_LATER, LINTERNA_OPTIONS, LINTERNA_REPLY, SKY_GATE } from '../ui/story/rupturasScriptO2';

const CALM_MS = 2200;
let inited = false;
let busy = false;
let calmSince = 0;
let IslandCls: (new (...a: never[]) => unknown) | null = null;
let MapCls: (new (...a: never[]) => unknown) | null = null;

export function initOleada2() {
  if (inited) return;
  inited = true;
  void import('../scenes/IslandScene').then((m) => (IslandCls = m.IslandScene as never)).catch(() => undefined);
  void import('../scenes/MapScene').then((m) => (MapCls = m.MapScene as never)).catch(() => undefined);
  window.setInterval(() => {
    skySync();
    if (busy) return;
    void pump().catch((e) => console.warn('[oleada2]', e));
  }, 500);
  // H48: once she has asked, the faro is where you answer (world state o2_senal invites: TOCA EL FARO)
  onFaroTap(() => {
    if (linternaPending() && beatSeen(LINTERNA_ASKED) && where() === 'island' && !runningCine()) void offerLinterna();
  });
}

/** the sky the story leaves on your island + the wave's Fonoteca records (cheap; never breaks the island) */
function skySync() {
  if (!G.s?.cats?.length) return;
  try {
    if (where() === 'island') syncO2Sky();
    syncO2Songs();
  } catch (e) {
    console.warn('[oleada2] sky', e);
  }
}

function where(): 'island' | 'map' | 'other' {
  const c = scenes.current;
  if (!c) return 'other';
  // instanceof only: the production build minifies class names (a name check would silently never match there)
  if (IslandCls && c instanceof IslandCls) return 'island';
  if (MapCls && c instanceof MapCls) return 'map';
  return 'other';
}
function calm(): boolean {
  const w = where();
  if (w !== 'island' && w !== 'map') return false;
  if ((scenes as unknown as { busy?: boolean }).busy || dialogActive()) return false;
  // a scene holds the screen (a cine, a reveal, a trip): wait for it
  if (hushed() || runningCine()) return false;
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
  const cats = o2PendingCats();
  const ask = linternaPending() && beatSeen('b48_linterna#a') && where() === 'island';
  const later = !!linternaChoice() && beatSeen('b49_masamadre') && !G.has('o2_linterna_later');
  if ((!cats.length && !ask && !later) || !calm()) {
    calmSince = 0;
    return;
  }
  const now = performance.now();
  if (!calmSince) {
    calmSince = now;
    return;
  }
  if (now - calmSince < CALM_MS) return;
  busy = true;
  try {
    if (cats.length) await joinCat(cats[0]);
    else if (ask) await offerLinterna();
    else if (later) {
      G.flag('o2_linterna_later');
      tip(LINTERNA_LATER[linternaChoice()!], { speaker: 'LUZTERNA', dur: 8 });
      G.save();
    }
  } finally {
    busy = false;
    calmSince = 0;
  }
}

/**
 * «Se une un gato» (H45: Hélice), robust against anything starting underneath it (a pinned battle's IR during the
 * art's download, a harness, a future flow):
 *   1. everything that can take time (the sequence's code, the cat's art) loads BEFORE the cat is claimed;
 *   2. then calm is checked again on the SAME scene — anything else started meanwhile → nothing claimed, retry later;
 *   3. while it shows, it holds the screen (hush 'o2join': toasts, tips, micro-events and the story wait) and story
 *      battles wait for it (skyPreflight → joinSettled);
 *   4. if the scene changes anyway, the card closes at once (the cat is already yours; a toast says so).
 */
let joining: Promise<void> | null = null;
/** resolves when no «se une un gato» is on screen (story battles wait for it) */
export function joinSettled(): Promise<void> {
  return joining ?? Promise.resolve();
}
export function joinShowing() {
  return !!joining;
}
async function joinCat(species: string) {
  const sc0 = scenes.current;
  const cd = catDef(species);
  const [{ playCatReveal }, art] = await Promise.all([import('../fx/sequences/catReveal'), import('../art/catArt')]);
  await Promise.race([art.preloadCats([cd.art.slug]).catch(() => undefined), new Promise((r) => setTimeout(r, 6000))]);
  if (scenes.current !== sc0 || !calm()) return;
  const r = claimO2Cat(species);
  if (!r) return;
  let done!: () => void;
  joining = new Promise<void>((res) => (done = res));
  hush('o2join', true);
  const holder = new Container();
  holder.label = 'o2Join';
  scenes.fxLayer.addChild(holder);
  let watch: ReturnType<typeof setInterval> | 0 = 0;
  const left = new Promise<'left'>((res) => {
    watch = setInterval(() => {
      if (scenes.current !== sc0 || (scenes as unknown as { busy?: boolean }).busy) res('left');
    }, 100);
  });
  let revealDone = false;
  const rev = playCatReveal(holder, {
    slug: cd.art.slug,
    name: r.cat?.name ?? cd.name,
    elements: cd.elements,
    rarity: cd.rarity,
    species,
    caption: cd.lore,
    subtitle: `${cd.epithet} · ${cd.battleForm.cry}`,
    duplicateOrbs: r.isNew ? undefined : r.orbs,
    kicker: 'SE UNE A TU TRIPULACIÓN',
  }).finally(() => (revealDone = true));
  try {
    const how = await Promise.race([rev, left]);
    if (how === 'left') {
      // the scene changed under it: hide it at once and let the card wind itself down (its own timeline, shake and
      // cleanup run to the end, invisibly: tapping it fast-forwards, then closes)
      holder.visible = false;
      holder.eventMode = 'none';
      const root = holder.children[0];
      for (let i = 0; i < 40 && !revealDone && root && !root.destroyed; i++) {
        root.emit('pointertap', { stopPropagation() {} } as never);
        await new Promise((res) => setTimeout(res, 250));
      }
    }
    if (how === 'left') toast(`¡${r.cat?.name ?? cd.name} se unió a tu tripulación!`, { icon: 'paw', sub: 'Te espera en tu isla.' });
  } finally {
    clearInterval(watch);
    if (!holder.destroyed) {
      const { killTree } = await import('../panels/campaign/common');
      killTree(holder);
      holder.destroy({ children: true });
    }
    hush('o2join', false);
    joining = null;
    done();
    G.save();
  }
}

let asking = false;
/**
 * H48: Luzterna's question. It comes at the end of her scene (cine h48_senal: `scene: true`); afterwards the faro or
 * the pinned mission's IR asks. Before the scene has played, nothing is asked (the scene is on its way).
 * Resolves once answered (or if there's nothing to ask).
 */
export async function offerLinterna(o: { scene?: boolean } = {}) {
  if (asking || !linternaPending()) return;
  if (!o.scene && !beatSeen(LINTERNA_ASKED)) return;
  asking = true;
  try {
    const { choicePrompt } = await import('../ui/story/profile');
    const c = await choicePrompt(storyLayer(), {
      title1: '¿LA',
      title2: 'APAGO?',
      sub: 'Su linterna manda una señal hacia afuera de la caja, y no sabe quién la ve. No hay respuesta mala: decide tú.',
      tag: 'LA LINTERNA DE LUZTERNA',
      options: LINTERNA_OPTIONS.map((o) => ({ label: o.label, value: o.id, color: o.id === 'apagar' ? C.paper : C.yellow })),
    });
    if (!chooseLinterna(c)) return;
    G.save();
    // «déjala encendida»: the bass comes in on the next bar; «apágala»: the keys go on alone (doc 18 §5.2 H48)
    if (c === 'encendida') linternaBassIn();
    await say(LINTERNA_REPLY[c], { dim: 0.3 });
  } finally {
    asking = false;
  }
}

// ------------------------------------------------------------------ the CARTA's IR (MapScene routes these here)
/**
 * The pinned mission's IR on the CARTA for O2 goals that don't live on a 3D island:
 *   kit_vuelo (H43)  the chart glides up to «EL CIELO» (where your ship is going to fly: the Islas Invertidas), then
 *                    the Astillero opens on VUELO, where the kit is installed
 *   linterna  (H48)  home: the question is asked at your faro
 * Uses MapScene's own public focusIsle(); nothing else on the chart is touched.
 */
export async function chartFeature(feature: string) {
  const sc = scenes.current as unknown as { focusIsle?: (id: string, animate?: boolean, s?: number) => void } | null;
  if (feature === 'kit_vuelo') {
    try {
      sc?.focusIsle?.('invertidas', true);
    } catch {
      /* the sky sheet may not be on this chart yet: the Astillero still opens */
    }
    await new Promise((r) => setTimeout(r, 1100));
    if (scenes.current !== (sc as unknown)) return;
    const { openShipyard } = await import('../panels/Shipyard');
    openShipyard({ tab: 'flight' });
    return;
  }
  if (feature === 'linterna') {
    const { goIsland } = await import('./flow');
    await goIsland();
    if (beatSeen(LINTERNA_ASKED)) window.setTimeout(() => void offerLinterna(), 1500);
  }
}

// ------------------------------------------------------------------ the sky preflight
/**
 * A sky battle needs a ship that flies. true = go ahead (the active ship has the Kit de Vuelo, or you chose to sail
 * with the one that does); false = not now (it opened the Astillero, or you closed the card).
 */
export async function skyPreflight(battleId: string): Promise<boolean> {
  // a «se une un gato» on screen: the battle waits for it to close (it never starts underneath it)
  if (joining) {
    await joining;
    await new Promise((r) => setTimeout(r, 250));
  }
  if (!isSkyBattle(battleId) || hasFlightKit()) return true;
  return skyGate();
}
function skyGate(): Promise<boolean> {
  const kitted = kitShips();
  if (!kitted.length) {
    toast(SKY_GATE.title, { icon: 'clock', sub: SKY_GATE.noKit, dur: 5 });
    void import('../panels/Shipyard').then((s) => s.openShipyard({ tab: 'flight' }));
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    const m = new Modal(SKY_GATE.title, 1000, 420, { band: 0x13224a, bandText: 0xe9f0ff });
    let done = false;
    const finish = (go: boolean) => {
      if (done) return;
      done = true;
      m.onClose = undefined;
      m.close();
      resolve(go);
    };
    m.onClose = () => {
      if (!done) {
        done = true;
        resolve(false);
      }
    };
    const target = kitted[0];
    const t = txt(SKY_GATE.other(shipName(G.s.ship.active), shipName(target)), { fontFamily: F.ui, fontWeight: '700', fontSize: 30, fill: C.ink, wordWrap: true, wordWrapWidth: 920, lineHeight: 40 });
    m.body.addChild(t);
    const go = new Button(`ZARPAR CON EL ${shipName(target).toUpperCase()}`, () => {
      setActiveShip(target);
      G.save();
      finish(true);
    }, { w: 520, h: 92, size: 30, color: C.yellow });
    go.position.set(0, 150);
    const yard = new Button('IR AL ASTILLERO', () => {
      finish(false);
      void import('../panels/Shipyard').then((s) => s.openShipyard({ tab: 'flight' }));
    }, { w: 360, h: 92, size: 30, color: C.paper });
    yard.position.set(560, 150);
    m.body.addChild(go, yard);
    m.open();
  });
}

(globalThis as unknown as { __oleada2: unknown }).__oleada2 = { offerLinterna, skyPreflight, chartFeature, joinShowing, where, sky: () => syncO2Sky(true) };
