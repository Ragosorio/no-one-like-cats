/**
 * Parte II · Oleada 3 «La Era Astral» on screen (state lives in state/sys/rupturasO3.ts):
 *
 *  - H50: after the arrival beat, Escafandra's gift (toast) and the TALLER COMETA opens once (panels/CometaShop.ts).
 *  - H53 · H54 · H56: the three interactions — break the SEAL with Canelo (taps), sweep the ARCHIVO's card (taps),
 *    sign the LOGBOOK (your name, in the handwriting the margin note turns out to share). Each opens by itself right
 *    after its mission's first beat part (when calm) and from the pinned mission's IR; closing it just postpones it.
 *  - H54: Maneki joins (if she isn't yours yet): claimed once (ledger), then the cat reveal.
 *  - Void battles: astralPreflight() — a nave astral and a trip's fuel. Never a wall: the Taller sells fuel and, when
 *    you can't pay, Escafandra fía the trip.
 *
 * The watcher waits for calm like formsFlow / oleada2Flow: island, map or a 3D region; no panel, dialog, story panel
 * or full-screen sequence.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { scenes } from '../core/scenes';
import { H, W } from '../core/App';
import { G } from '../state/game';
import { Modal, toast } from '../ui/modal';
import { Button, poster, txt } from '../ui/widgets';
import { C, F } from '../ui/theme';
import { sfx } from '../core/audio';
import { settings } from '../core/settings';
import { sparkles } from '../fx/juice';
import { dialogActive, storyLayer } from '../ui/dialog';
import { beatSeen } from '../state/ext/story';
import { catDef } from '../data/content';
import { setActiveShip, shipName } from '../state/sys/ship';
import {
  FUEL_PACK,
  O3_FEATURES,
  astralShips,
  buyFuel,
  claimO3Cat,
  completeFeature,
  featurePending,
  fuel,
  fuelPackCost,
  grantCometaGift,
  hasAstralKit,
  isAstralBattle,
  o3PendingCats,
  spendFuel,
  tripCost,
} from '../state/sys/rupturasO3';
import { FICHA, GIFT_TOAST, SELLO, VOID_GATE } from '../ui/story/rupturasScriptO3';
import { audioApi } from '../audio/api';
import { goIsland } from './flow';
import { cineStage, runningCine } from '../cine/registry';
import { onBeatLine } from '../cine/lineHooks';
import { syncO3Songs } from '../ui/story/o3Cines';
import { mountO3Sky, sceneKind } from '../ui/story/o3Sky';
import { pasaporte, pizarra } from '../ui/story/o3Screen';

const CALM_MS = 2200;
/** the first beat part after which each interaction opens by itself */
const FEATURE_BEAT: Record<string, string> = { sello_canelo: 'b53_canelo#a', ficha_maneki: 'b54_maneki#a', firma_bitacora: 'b56_nota#a' };
/** a closed interaction waits this long before offering itself again (the IR opens it any time) */
const RETRY_MS = 90_000;
const TALLER_SEEN = 'o3_taller_visto';

let inited = false;
let busy = false;
let calmSince = 0;
const declined = new Map<string, number>();

export function initOleada3() {
  if (inited) return;
  inited = true;
  window.setInterval(() => {
    // what the story put in your sky / on your island stays there (ui/story/o3Sky.ts): mounted on every island scene
    try {
      mountO3Sky();
    } catch (e) {
      console.warn('[oleada3] sky', e);
    }
    if (busy) return;
    void pump().catch((e) => console.warn('[oleada3]', e));
  }, 500);
  installLineHooks();
}

// ------------------------------------------------------------------ H51 · the chalkboard and the stamp (line hooks)
/**
 * b51 a: while Luzterna shouts «¡SINCRO!», her chalkboard shows it — two meters that fill at the SAME time, the ring that
 * shines (line 1), and the hit jumping module to module (line 2). b51 b: «¡Aprobado!» — the stamp comes down. They work
 * wherever the dialog plays (island, CARTA, Puerto Cometa): screen-level, gone with the part's last line.
 */
function installLineHooks() {
  let board: ReturnType<typeof pizarra> | null = null;
  let boardT = 0;
  const drop = () => {
    window.clearTimeout(boardT);
    board?.stop();
    board = null;
  };
  onBeatLine('b51_sincronia#a', (i) => {
    if (i === 1 && !board) {
      board = pizarra();
      boardT = window.setTimeout(drop, 40_000);
    }
    if (i === 2) board?.plasma();
    if (i === 3) drop();
  });
  let stamp: (() => void) | null = null;
  onBeatLine('b51_sincronia#b', (i) => {
    if (i === 0) {
      stamp?.();
      const s = pasaporte();
      stamp = s;
      window.setTimeout(() => {
        s();
        if (stamp === s) stamp = null;
      }, 6500);
    }
  });
}

/** which scene is on screen — `instanceof` / duck typing (ui/story/o3Sky.ts sceneKind), never `constructor.name`:
 *  a production build renames classes */
function where(): 'island' | 'map' | 'region' | 'other' {
  return sceneKind(scenes.current);
}
function calm(): boolean {
  if (where() === 'other') return false;
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

/**
 * Fonoteca (doc 18 §8): the wave's records — only VARIATIONS (the originals belong to the Momentos musicales, owner
 * 2026-10-10) and only versions the catalog knows — handed out by the scenes at their point of no return
 * (ui/story/o3Cines.ts o3Unlock) and caught up here for saves that are past them (idempotent; survives the reset).
 */
let songsT = 0;
function musicUnlocks() {
  const now = Date.now();
  if (now - songsT < 6000) return;
  songsT = now;
  syncO3Songs();
}

/** what the watcher would do now (null = nothing) */
function nextJob(): (() => Promise<void>) | null {
  if (!G.s?.cats?.length || !G.s.missions) return null;
  musicUnlocks();
  // H50: the gift + the Taller, once, after the arrival beat
  if (G.s.missions.done.includes('H50') && beatSeen('b50_cometa#b') && !G.has(TALLER_SEEN)) return tallerIntro;
  const cats = o3PendingCats();
  if (cats.length && where() !== 'region') return () => joinCat(cats[0]);
  const now = Date.now();
  for (const f of Object.keys(O3_FEATURES)) {
    if (!featurePending(f) || !beatSeen(FEATURE_BEAT[f])) continue;
    if (now - (declined.get(f) ?? 0) < RETRY_MS) continue;
    // the scenes open by themselves only where they happen (the seal: your island; the logbook: your island or Puerto
    // Cometa) — never yanking you home from the CARTA; the pinned mission's IR takes you there any time
    const here = where();
    if (f === 'sello_canelo' && here !== 'island') continue;
    if (f === 'firma_bitacora' && here !== 'island' && !inCometa()) continue;
    return async () => void (await openFeature(f));
  }
  return null;
}

async function pump() {
  const job = nextJob();
  if (!job || !calm()) {
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
    await job();
  } finally {
    busy = false;
    calmSince = 0;
  }
}

async function tallerIntro() {
  G.flag(TALLER_SEEN);
  const gift = grantCometaGift();
  G.save();
  const t = GIFT_TOAST(gift.fuel || 0, gift.ship ? shipName(gift.ship) : astralShips()[0] ? shipName(astralShips()[0]) : null);
  if (t.sub) toast(t.title, { icon: 'star', color: 0xff7ab8, sub: t.sub, dur: 5 });
  const { openCometaShop } = await import('../panels/CometaShop');
  await openCometaShop();
}

/** a cat the story hands over outside a battle (H54: Maneki) */
async function joinCat(species: string) {
  const r = claimO3Cat(species);
  if (!r || ('already' in r && r.already)) return;
  const cd = catDef(species);
  const { playCatReveal } = await import('../fx/sequences/catReveal');
  await playCatReveal(scenes.fxLayer, {
    slug: cd.art.slug,
    name: r.cat?.name ?? cd.name,
    elements: cd.elements,
    rarity: cd.rarity,
    species,
    caption: 'Dejó la escoba en tu muelle. Dice que alguien tiene que barrer.',
    subtitle: `${cd.epithet} · ${cd.battleForm.cry}`,
    duplicateOrbs: r.isNew ? undefined : r.orbs,
    kicker: 'SE UNE A TU TRIPULACIÓN',
  });
  G.save();
}

// ------------------------------------------------------------------ the IR (IslandScene) and dev tools
/** the pinned mission's IR for an O3 activity: the interaction, or the Taller */
export async function goFeature(f: string) {
  if (f === 'taller_cometa') {
    const { openCometaShop } = await import('../panels/CometaShop');
    await openCometaShop();
    return;
  }
  if (featurePending(f)) await openFeature(f);
}

let showing = false;
/** open an O3 interaction (one at a time). Completing it completes its mission. */
export async function openFeature(f: string): Promise<boolean> {
  if (showing || !featurePending(f)) return false;
  showing = true;
  try {
    const ok = f === 'sello_canelo' ? await sealScene() : f === 'ficha_maneki' ? await tapScene('ficha') : f === 'firma_bitacora' ? await firmaScene() : false;
    // the scenes complete their mission themselves (after persisting the beat parts they say): done = no longer pending
    if (ok && !featurePending(f)) {
      G.save();
      return true;
    }
    if (!ok) {
      declined.set(f, Date.now());
      return false;
    }
    if (!completeFeature(f)) return false;
    G.save();
    return true;
  } finally {
    showing = false;
  }
}

// ------------------------------------------------------------------ H53 the seal · H56 the logbook: SCENES (ui/story/o3Cines.ts)
const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
async function waitStage(id: string, ms: number) {
  const t0 = performance.now();
  while (performance.now() - t0 < ms) {
    const st = cineStage(id);
    if (st?.alive() && !st.blocked() && !runningCine()) return true;
    await sleep(150);
  }
  return false;
}
/** H53: the seal breaks on YOUR island (by the faro, where Canelo sits staring). From the CARTA or a region: home first */
async function sealScene(): Promise<boolean> {
  if (where() !== 'island') {
    await goIsland();
    await sleep(800);
  }
  if (!(await waitStage('island', 12000))) return false;
  mountO3Sky(true);
  const { playCine } = await import('../cine');
  const res = await playCine('h53_romper');
  return res !== 'interrupted' || !featurePending('sello_canelo');
}
/** H56: the logbook (screen-level paper): on the island, or right there in Puerto Cometa. From the CARTA: home first */
const inCometa = () => (scenes.current as unknown as { regionId?: string } | null)?.regionId === 'cometa';
async function firmaScene(): Promise<boolean> {
  const inRegion = inCometa();
  if (!inRegion && where() !== 'island') {
    await goIsland();
    await sleep(800);
  }
  const stage = inRegion ? 'region' : 'island';
  if (!(await waitStage(stage, 12000))) return false;
  const { playCine } = await import('../cine');
  const res = await playCine(inRegion ? 'h56_firma_cometa' : 'h56_firma');
  return res !== 'interrupted' || !featurePending('firma_bitacora');
}

// ------------------------------------------------------------------ H54 the card (taps) · the old seal panel (dev)
/** a modal with one big object that changes with each tap; resolves true when finished, false when closed */
function tapScene(kind: 'sello' | 'ficha'): Promise<boolean> {
  const cfg = kind === 'sello' ? SELLO : FICHA;
  const need = kind === 'sello' ? SELLO.taps : FICHA.rows.length;
  return new Promise((resolve) => {
    const m = new Modal(cfg.title, 1100, 760, { band: kind === 'sello' ? 0x0b0f2c : 0x2b3a55, bandText: kind === 'sello' ? 0xc9a8ff : 0xf2e6c9, subtitle: cfg.sub });
    let done = false;
    let n = 0;
    const area = new Container();
    const g = new Graphics();
    const words = new Container();
    area.addChild(g, words);
    area.position.set(0, 0);
    m.body.addChild(area);
    const aw = 1044;
    const ah = 560;
    const hint = txt(kind === 'sello' ? 'TÓCALO' : 'BARRE (TOCA EL POLVO)', { fontFamily: F.poster, fontSize: 30, fill: C.ink });
    hint.anchor.set(0.5, 0);
    hint.position.set(aw / 2, ah + 8);
    m.body.addChild(hint);
    const draw = () => {
      g.clear();
      for (const ch of words.removeChildren()) ch.destroy();
      if (kind === 'sello') {
        g.rect(0, 0, aw, ah).fill(0x070a1f);
        for (let i = 0; i < 60; i++) g.circle((i * 173) % aw, (i * 97) % ah, i % 7 ? 1.4 : 2.4).fill({ color: 0xe9f0ff, alpha: 0.7 });
        const cx = aw / 2;
        const cy = ah / 2;
        const r = 170;
        g.circle(cx, cy, r + 30).fill({ color: 0x8a5cff, alpha: 0.12 + n * 0.06 });
        g.circle(cx, cy, r).fill({ color: 0x1d1440 }).stroke({ width: 10, color: 0xc77dff });
        // a ring of runes (little diamonds and bars) and a four-point star that breathes with Canelo
        for (let k = 0; k < 16; k++) {
          const a = (k / 16) * Math.PI * 2;
          const x = cx + Math.cos(a) * (r - 24);
          const y = cy + Math.sin(a) * (r - 24);
          if (k % 2) g.poly([x, y - 9, x + 6, y, x, y + 9, x - 6, y]).fill(0xf2e6ff);
          else g.rect(x - 2, y - 7, 4, 14).fill({ color: 0xc77dff, alpha: 0.9 });
        }
        const sr = 46 + n * 8;
        g.poly([cx, cy - sr, cx + sr * 0.22, cy - sr * 0.22, cx + sr, cy, cx + sr * 0.22, cy + sr * 0.22, cx, cy + sr, cx - sr * 0.22, cy + sr * 0.22, cx - sr, cy, cx - sr * 0.22, cy - sr * 0.22]).fill({ color: 0xf2e6ff, alpha: 0.85 });
        // the cracks grow with each tap
        const cracks = [
          [cx - 10, cy - r, cx + 20, cy - 60, cx - 15, cy + 10],
          [cx + r, cy + 10, cx + 70, cy + 25, cx + 10, cy + 5],
          [cx - r * 0.7, cy + r * 0.7, cx - 40, cy + 60, cx + 5, cy + 10, cx + 40, cy + r * 0.9],
        ];
        for (let k = 0; k < n && k < cracks.length; k++) g.poly(cracks[k], false).stroke({ width: 7, color: 0xffffff });
        // Canelo's silhouette at the bottom, from behind, looking
        g.ellipse(cx, ah - 40, 70, 26).fill({ color: 0xd98a48 });
        g.circle(cx, ah - 92, 38).fill({ color: 0xd98a48 });
        g.poly([cx - 34, ah - 116, cx - 22, ah - 150, cx - 8, ah - 122]).fill(0xd98a48);
        g.poly([cx + 34, ah - 116, cx + 22, ah - 150, cx + 8, ah - 122]).fill(0xd98a48);
        g.rect(cx - 40, ah - 70, 80, 14).fill(0xc8102e);
      } else {
        g.rect(0, 0, aw, ah).fill(0xe8e4d8);
        const cw = 720;
        const cx = (aw - cw) / 2;
        g.rect(cx + 8, 38, cw, 470).fill(C.ink);
        g.rect(cx, 30, cw, 470).fill(0xfbfaf4).stroke({ width: 4, color: C.ink });
        g.rect(cx, 30, cw, 64).fill(0x2b3a55);
        const head = poster('ARCHIVO · FICHA CLÍNICA', 34, 0xf2e6c9);
        head.position.set(cx + 20, 40);
        words.addChild(head);
        FICHA.rows.forEach(([k, v], i) => {
          const y = 120 + i * 74;
          const kt = txt(k, { fontFamily: F.poster, fontSize: 24, fill: 0x2b3a55 });
          kt.position.set(cx + 24, y);
          const vt = txt(v, { fontFamily: F.serif, fontSize: 30, fill: C.ink, fontStyle: 'italic' });
          vt.position.set(cx + 230, y - 4);
          words.addChild(kt, vt);
          // the dust still on this row
          if (i >= n) {
            for (let d = 0; d < 9; d++) g.circle(cx + 210 + d * 52 + ((i * 13 + d * 7) % 17), y + 18 + ((d * 11) % 9) - 4, 28 + ((d * 5 + i) % 9)).fill({ color: 0xc9b9e8, alpha: 0.96 });
            for (let d = 0; d < 6; d++) g.circle(cx + 240 + d * 74, y + 6 + (d % 3) * 8, 3).fill({ color: 0xffffff, alpha: 0.9 });
          }
        });
      }
    };
    draw();
    area.eventMode = 'static';
    area.cursor = 'pointer';
    area.hitArea = { contains: (x: number, y: number) => x >= 0 && y >= 0 && x <= aw && y <= ah };
    area.on('pointertap', (e) => {
      if (done) return;
      n++;
      const p = area.toLocal(e.global);
      sfx(kind === 'sello' ? (n >= need ? 'bigboom' : 'crit') : 'paper', kind === 'sello' ? 0.8 + n * 0.15 : 1);
      if (kind === 'sello') {
        const t = poster(SELLO.cracks[Math.min(n, SELLO.cracks.length) - 1], 60 + n * 18, 0xffffff, { stroke: { color: C.ink, width: 8 } });
        t.anchor.set(0.5);
        t.position.set(p.x, p.y - 40);
        area.addChild(t);
        gsap.to(t, { y: t.y - 60, alpha: 0, duration: 0.9, onComplete: () => t.destroy() });
        if (!settings.reduceMotion) gsap.fromTo(area, { x: -10 * n }, { x: 0, duration: 0.3, ease: 'elastic.out(1.2,0.3)' });
      } else sparkles(area, p.x, p.y, 0xc9b9e8, 10, 90);
      draw();
      if (n >= need) {
        done = true;
        if (kind === 'sello') {
          sfx('reveal');
          sparkles(area, aw / 2, ah / 2, 0xf2e6ff, 40, 360);
          const fl = new Graphics().rect(0, 0, aw, ah).fill(0xffffff);
          fl.alpha = 0;
          area.addChild(fl);
          gsap.to(fl, { alpha: settings.reduceFlashes ? 0.4 : 1, duration: 0.25, yoyo: true, repeat: 1 });
        } else sfx('reveal');
        window.setTimeout(() => {
          m.onClose = () => resolve(true);
          m.close();
        }, kind === 'sello' ? 1200 : 1600);
      }
    });
    m.onClose = () => resolve(false);
    m.open();
  });
}

// ------------------------------------------------------------------ the void preflight
/**
 * A void battle needs a nave astral and a trip's Combustible Astral. true = go (the fuel was paid, or fiado);
 * false = not now (it opened the Taller, or you closed the card). Never a wall.
 */
export function astralPreflight(battleId: string): Promise<boolean> {
  if (!isAstralBattle(battleId)) return Promise.resolve(true);
  return new Promise((resolve) => {
    void (async () => {
      // 1) the ship
      if (!hasAstralKit()) {
        const naves = astralShips();
        if (!naves.length) {
          toast(VOID_GATE.title, { icon: 'clock', sub: VOID_GATE.noKit, dur: 5 });
          const { openCometaShop } = await import('../panels/CometaShop');
          void openCometaShop();
          resolve(false);
          return;
        }
        const go = await ask(VOID_GATE.title, VOID_GATE.other(shipName(G.s.ship.active), shipName(naves[0])), [
          { label: `ZARPAR CON EL ${shipName(naves[0]).toUpperCase()}`, value: 'go', color: C.yellow },
          { label: 'IR AL TALLER', value: 'taller', color: C.paper },
        ]);
        if (go === 'taller') {
          const { openCometaShop } = await import('../panels/CometaShop');
          void openCometaShop();
        }
        if (go !== 'go') return resolve(false);
        setActiveShip(naves[0]);
        G.save();
      }
      // 2) the fuel
      const cost = tripCost();
      if (fuel() < cost) {
        const canBuy = G.s.gold >= fuelPackCost();
        const opts = canBuy
          ? [
              { label: `COMPRAR ${FUEL_PACK.n} Y ZARPAR`, value: 'buy', color: C.yellow },
              { label: 'MEJOR NO', value: 'no', color: C.paper },
            ]
          : [
              { label: 'QUE ESCAFANDRA ME FÍE', value: 'fia', color: C.yellow },
              { label: 'MEJOR NO', value: 'no', color: C.paper },
            ];
        const sub = `${VOID_GATE.fuel(fuel(), cost)} ${canBuy ? `Escafandra vende ${FUEL_PACK.n} por ${Math.round(fuelPackCost()).toLocaleString('es')} de oro.` : ''}`;
        const r = await ask('FALTA COMBUSTIBLE', sub, opts);
        if (r === 'buy') {
          while (fuel() < cost && buyFuel()) {
            /* packs until the trip is covered */
          }
          if (fuel() < cost) return resolve(false);
        } else if (r === 'fia') {
          toast('VIAJE FIADO', { icon: 'paw', sub: VOID_GATE.fia, dur: 5 });
          G.count('viajes_fiados');
          G.save();
          return resolve(true);
        } else return resolve(false);
      }
      spendFuel(cost);
      G.save();
      toast(`-${cost} COMBUSTIBLE ASTRAL`, { icon: 'flame', sub: `Te quedan ${fuel()}. Buen viaje.`, dur: 3 });
      resolve(true);
    })().catch((e) => {
      console.warn('[oleada3] preflight', e);
      resolve(true);
    });
  });
}

/** a small two-button card (null = closed) */
function ask(title: string, body: string, opts: { label: string; value: string; color: number }[]): Promise<string | null> {
  return new Promise((resolve) => {
    const m = new Modal(title, 1040, 420, { band: 0x0b0f2c, bandText: 0x9fe8ff });
    let done = false;
    const finish = (v: string | null) => {
      if (done) return;
      done = true;
      m.onClose = undefined;
      m.close();
      resolve(v);
    };
    m.onClose = () => {
      if (!done) {
        done = true;
        resolve(null);
      }
    };
    const t = txt(body, { fontFamily: F.ui, fontWeight: '700', fontSize: 28, fill: C.ink, wordWrap: true, wordWrapWidth: 960, lineHeight: 38 });
    m.body.addChild(t);
    let x = 0;
    for (const o of opts) {
      const b = new Button(o.label, () => finish(o.value), { w: o === opts[0] ? 560 : 360, h: 88, size: 28, color: o.color });
      b.position.set(x, 160);
      x += (o === opts[0] ? 560 : 360) + 24;
      m.body.addChild(b);
    }
    m.open();
  });
}

// ------------------------------------------------------------------ the two Momentos musicales of this wave (owner, 2026-10-10)
/**
 * The originals are reserved for the Momentos (an unskippable, interactive anime-style cinematic synced to the song;
 * presses change the animation, never the outcome). This wave has two, both INSIDE a battle, at a phase change. They
 * are not built here: the Momento engine plugs into the existing interlude hook of the FASES mechanism —
 *   registerFaseInterlude(M.battle, M.fase, (change) => playMomento(M.song, change))      (battle/fases.ts)
 * battle/fx/fasesFx.ts › FasesFx.stage() awaits the interlude after the flash + layer swap + emitFase and before the
 * banner, and BattleScene.checkBossPhase() awaits that staging before the next turn: the battle pauses for as long as
 * the Momento plays and resumes on the new layer. Presentation only — the sim already applied the phase, so the outcome
 * (and the estimate worker) never change. `onFase` listeners are synchronous: they hear the change, they can't hold it.
 */
// MOMENTO: te_odio (H55, before the glitch phase) — Los Disruptores: phase 1 (vacío) → Momento → GLITCH
export const H55_MOMENTO = { battle: 'ruptura_disruptores', fase: 'glitch', song: 'te_odio' } as const;
// MOMENTO: hemkade (H57, layer change) — El Leviatán Invertido: sea layer played → Momento (rising through the sky into
// the astral rift) → rift layer played. Today the fight still has a playable sky layer between them (O3_SPECS
// ruptura_leviatan: mar → cielo 34 % → grieta 67 %); the hook sits on the first layer change. Dropping the sky layer so
// the Momento IS the sky is a balance change in state/sys/rupturasO3.ts (tests/rupturasO3.test.ts + doc 25 §6).
export const H57_MOMENTO = { battle: 'ruptura_leviatan', fase: 'cielo', song: 'hemkade' } as const;

(globalThis as unknown as { __oleada3: unknown }).__oleada3 = { openFeature, goFeature, astralPreflight, H55_MOMENTO, H57_MOMENTO };

/**
 * DEV (headless shots): put the save at the START of a mission of this wave — the missions before it done, their
 * beats seen — so its scene can be played for real. Never in a build.
 */
if (import.meta.env.DEV)
  (globalThis as unknown as { __o3: unknown }).__o3 = {
    async jump(to: string, seenParts: string[] = []) {
      const { checkMissions } = await import('../state/sys/missions');
      const S = await import('../ui/story/rupturasScriptO3');
      const ids = ['H50', 'H51', 'H52', 'H53', 'H54', 'H55', 'H56', 'H57'];
      const n = ids.indexOf(to);
      const m = G.s.missions;
      for (const id of ids.slice(0, n)) {
        m.active = m.active.filter((x) => x !== id);
        if (!m.done.includes(id)) m.done.push(id);
        for (const r of [...(S.O3_ON_NEW[id] ?? []), ...(S.O3_ON_DONE[id] ?? [])]) {
          if (!G.s.beatsSeen.includes(r.beat)) G.s.beatsSeen.push(r.beat);
          if (r.part && !G.s.beatsSeen.includes(`${r.beat}#${r.part}`)) G.s.beatsSeen.push(`${r.beat}#${r.part}`);
        }
      }
      if (n >= 1) G.flag(TALLER_SEEN);
      for (const k of seenParts) if (!G.s.beatsSeen.includes(k)) G.s.beatsSeen.push(k);
      // the mission itself activates through its trigger (so the story hears it appear and plays its scene)
      checkMissions();
      if (!m.active.includes(to) && !m.done.includes(to)) m.active.push(to);
      G.save();
      return { active: m.active.filter((x) => /^H5/.test(x)), done: m.done.filter((x) => /^H5/.test(x)) };
    },
  };
