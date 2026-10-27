/**
 * Parte III · the scenes of the vertical slice that happen ON YOUR ISLAND (docs/part-iii/04 §1 and §6; the bar and the
 * street are C's, on the stage `caja`). Registered at import (app/story.ts imports this file at boot):
 *
 *   p3_pelo        H66's door: the camera on the cold page, an orange hair rides the wind into a tiny cat flap at the
 *                  faro's base, a glass clinks, cut to black → C's playBarPrologue() (enterH66 below). Not replayable
 *                  (it's a doorway, not a scene).
 *   p3_despierta   end of H67, at night: they come out through the flap; the page's mark is cold; the rock where
 *                  REGISTRO 000 sat is empty; its Catdex card writes ~~despertando~~ DESPIERTO by itself; the flap is
 *                  TORN; Canelo's tail flame trembles (nobody says anything); he only meows; a donut falls onto his
 *                  palm. Persists b67_despierta at the Catdex moment (world state p3_rasgadura from there on).
 *
 * Lines: data/gateras/historia.json (b67_despierta, indexes in ui/story/gaterasScript.ts › DESPIERTA_LINES).
 */
import { Container, Graphics, Text, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { scenes } from '../../core/scenes';
import { W } from '../../core/App';
import { sfx } from '../../core/audio';
import { G } from '../../state/game';
import { registerCine } from '../../cine/registry';
import type { CineCtx, CineScript, FxCmd } from '../../cine/types';
import type { WorldLook } from '../../state/sys/worldState';
import { registerIslandFx } from '../../island/night/stage';
import { paginaLlama } from '../../state/sys/gaterasWorld';
import { onFaroTap } from '../../state/sys/rupturas';
import { C, F } from '../theme';
import { poster, txt } from '../widgets';
import { storyLayer, tip } from '../dialog';
import { screenRect } from '../screen';
import { destroyDeep } from './tweens';
import { donaArt, faroPage, palmTop, setPaginaP3Tap, syncDona, syncFaroPage } from './o4Pagina';
import { sceneKind } from './o3Sky';
import { DESPIERTA_LINES } from './gaterasScript';
import { settings } from '../../core/settings';
import { FLAP_LIGHT, drawFlapLight } from '../../scenes/caja/barLuz';
import { prewarmBar } from '../../scenes/caja/barPrecarga';

const B67 = 'b67_despierta';
/** the margin hand (island/night/mapNight.ts): the ink that writes «DESPIERTO» */
const HAND = 0x24224f;

/** the island's graded world layer (props and world-space flourishes live there) */
function graded(): Container | null {
  const sc = scenes.current as Container | null;
  if (!sc || sc.destroyed || sceneKind(sc) !== 'island') return null;
  const g = sc.getChildByLabel('graded', true);
  return g && !g.destroyed ? g : null;
}
function clink() {
  sfx('tick', 2.5);
  window.setTimeout(() => sfx('tick', 2.9), 90);
}

// ------------------------------------------------------------------ the cut to black between the island and the bar
let black: Container | null = null;
/**
 * a black screen that outlives the cine (its own fade is removed when it ends): the bar's scene takes over under it.
 * `color`: p3_pelo holds the FLAP'S LIGHT instead — alive (scenes/caja/barLuz.ts: rings, rays, his hair drifting), the
 * same light the bar's scene starts under (the cross, 13 §3.2)
 */
function holdBlack(on: boolean, fade = 0.35, color: number = C.ink) {
  if (on) {
    if (black && !black.destroyed) return;
    const root = new Container();
    root.addChild(screenRect({ color, alpha: 1 }));
    if (color === FLAP_LIGHT) {
      const g = new Graphics();
      root.addChild(g);
      const t0 = performance.now();
      const gentle = settings.reduceMotion;
      const tick = () => {
        if (g.destroyed) return Ticker.shared.remove(tick);
        g.clear();
        const t = (performance.now() - t0) / 1000;
        // it comes alive out of the flat light of the fade
        g.alpha = Math.min(1, t / 0.3);
        drawFlapLight(g, t, gentle);
      };
      tick();
      Ticker.shared.add(tick);
    }
    root.label = 'p3Black';
    root.eventMode = 'static';
    black = root;
    scenes.overlayLayer.addChild(root);
    return;
  }
  const b = black;
  black = null;
  if (!b || b.destroyed) return;
  gsap.to(b, { alpha: 0, duration: fade, onComplete: () => destroyDeep(b) });
}

// ------------------------------------------------------------------ p3_pelo (H66's door) — and THE CROSS begins
export const PELO: CineScript = {
  id: 'p3_pelo',
  stage: 'island',
  releaseBlend: 0.5,
  steps: [
    { ui: { bars: true, hud: false, skip: true } },
    // the bar's paintings, if H66's wait didn't get them yet (idle-time queue: barPrecarga.ts)
    { call: () => prewarmBar() },
    { camera: { to: 'pagina', zoom: 1.3, dur: 1.3, ease: 'inOut' } },
    { call: (c) => void (!c.skipping && faroPage()?.hairToGatera()) },
    // the camera follows the hair to the flap
    { camera: { to: 'gatera', zoom: 1.5, dur: 3.2, ease: 'inOut' }, reduced: { camera: { to: 'gatera', zoom: 1.5, dur: 0.6 } } },
    { wait: 0.25 },
    { call: (c) => void (!c.skipping && clink()) },
    // PREPARATION (13 §3.2): the flap glows — a warm light leaks around it and pushes it open a crack; the camera
    // comes closer to see it
    { fx: { id: 'p3_gateraLuz' }, id: 'luz' },
    { camera: { to: 'gatera', zoom: 2.8, dur: 0.75, ease: 'inOut' } },
    // the camera goes IN through the little door, into its light (the bar's scene takes it from there)
    {
      parallel: [
        { camera: { to: 'gatera', zoom: 7, dur: 0.85, ease: 'in' }, reduced: 'skip' },
        { seq: [{ wait: 0.5 }, { fx: { id: 'fade', to: 1, dur: 0.33, color: FLAP_LIGHT } }] },
      ],
    },
    // the light we are in stays alive (barLuz.ts) until the bar takes it over
    { call: () => holdBlack(true, 0.35, FLAP_LIGHT) },
  ],
};
registerCine(PELO);
/**
 * While H66 waits on your island (the page calls), the bar's paintings are rasterized in idle time — so going through
 * the cat flap never freezes on them (barPrecarga.ts). A cheap check every few seconds, until it has asked once.
 */
if (typeof window !== 'undefined') {
  const prewarmWatch = window.setInterval(() => {
    try {
      if (!paginaLlama(G.s) || sceneKind() !== 'island') return;
      prewarmBar();
      window.clearInterval(prewarmWatch);
    } catch {
      /* no save yet */
    }
  }, 3000);
}

/** the flap lights up from inside (another box is on the other side): a halo, rays leaking at its edges, it creaks open */
registerIslandFx('p3_gateraLuz', (_cmd, ctx) => {
  const p = faroPage();
  const gat = p?.gatera;
  if (!p || !gat) return;
  const flap = gat.children[1];
  const glow = new Graphics();
  glow.label = 'p3GateraLuz';
  gat.addChildAt(glow, 0);
  const inside = new Graphics().roundRect(-13, -27, 26, 29, 10).fill(FLAP_LIGHT);
  gat.addChildAt(inside, 2);
  const o = { k: 0 };
  const draw = () => {
    if (glow.destroyed) return;
    const k = o.k;
    glow.clear();
    glow.circle(0, -14, 40 + 90 * k).fill({ color: FLAP_LIGHT, alpha: 0.18 * k });
    glow.circle(0, -14, 28 + 44 * k).fill({ color: FLAP_LIGHT, alpha: 0.32 * k });
    for (let i = 0; i < 11; i++) {
      const a = -Math.PI - 0.15 + (i / 10) * (Math.PI + 0.3);
      glow.moveTo(Math.cos(a) * 24, -14 + Math.sin(a) * 26).lineTo(Math.cos(a) * (40 + 80 * k), -14 + Math.sin(a) * (42 + 80 * k)).stroke({ width: 4.5, color: FLAP_LIGHT, alpha: 0.95 * k, cap: 'round' });
    }
    inside.alpha = k;
  };
  draw();
  sfx('reveal', 1.4);
  const tl = gsap.timeline({ onUpdate: draw });
  tl.to(o, { k: 1, duration: ctx.reduceMotion ? 0.3 : 0.6, ease: 'power2.out' });
  if (flap && !ctx.reduceMotion) tl.to(flap, { rotation: -0.55, duration: 0.25, ease: 'back.out(2)' }, 0.25);
  return () => {
    tl.kill();
    if (flap && !flap.destroyed) flap.rotation = 0;
    if (!glow.destroyed) glow.destroy();
    if (!inside.destroyed) inside.destroy();
  };
});

// ------------------------------------------------------------------ p3_fria (H66 appears: the warm mark goes cold)
/** the camera finds the page, its steam thins out and is gone (then the Bitácora opens to H66's card) */
export const FRIA: CineScript = {
  id: 'p3_fria',
  stage: 'island',
  releaseBlend: 1,
  steps: [
    { ui: { hud: false, skip: true } },
    { camera: { to: 'pagina', zoom: 1.3, dur: 1.6, ease: 'inOut' } },
    { call: (c) => void (c.skipping ? faroPage()?.setWarm(false) : faroPage()?.coolDown()) },
    { wait: 2.8, reduced: { wait: 0.8 } },
    { ui: { hud: true, skip: false } },
  ],
  finish: () => faroPage()?.setWarm(false),
};
registerCine(FRIA);

// the prologue's flow is C's (app/gaterasFlow.ts): optional here, so this builds before it exists
const FLOW = import.meta.glob<{ playBarPrologue?: () => Promise<unknown> }>('../../app/gaterasFlow.ts');
let entering = false;
/** H66 waits by the faro: the hair, the flap, the black, then the bar (scene A → MOMENTO drunck → B → punchline) */
export async function enterH66(): Promise<void> {
  if (entering || !paginaLlama(G.s)) return;
  const { playCine, runningCine } = await import('../../cine');
  if (runningCine()) return;
  entering = true;
  const from = scenes.current;
  try {
    const res = await playCine('p3_pelo');
    if (res === 'interrupted') return holdBlack(false, 0.2);
    holdBlack(true);
    const load = FLOW['../../app/gaterasFlow.ts'];
    const flow = load ? await load().catch(() => null) : null;
    if (!flow?.playBarPrologue) {
      holdBlack(false);
      tip('(La Última Ronda todavía está en obras: vuelve a tocar la página en la próxima versión.)', { speaker: 'BITÁCORA' });
      return;
    }
    const run = flow.playBarPrologue();
    // the black lifts once the bar's scene is on screen (or after a while, whatever happens)
    const t0 = performance.now();
    await new Promise<void>((r) => {
      const iv = window.setInterval(() => {
        if (scenes.current !== from || performance.now() - t0 > 5000) {
          window.clearInterval(iv);
          r();
        }
      }, 80);
    });
    holdBlack(false);
    await run;
  } catch (e) {
    console.warn('[gateras] la entrada a H66 falló (la misión sigue esperando en la página)', e);
    holdBlack(false, 0.2);
  } finally {
    entering = false;
  }
}
/** tapping the page while H66 waits opens the door (o4Pagina.ts asks here first) */
setPaginaP3Tap(() => {
  if (!paginaLlama(G.s) || sceneKind() !== 'island') return false;
  void enterH66();
  return true;
});
/**
 * The faro itself is the same door while H66 waits (the owner's first playthrough: «presioné el faro y no ocurrió
 * nada»). The page, the faro and the cat flap all lead to one path, so their hit areas never compete.
 */
onFaroTap(() => {
  if (paginaLlama(G.s) && sceneKind() === 'island') void enterH66();
});

// ------------------------------------------------------------------ p3_despierta (end of H67)
/** your island at night, very still: the faro on, the sea a little bright */
const NIGHT: Partial<WorldLook> = { exposure: 0.64, tint: 0xa8b4ff, saturation: 0.86, lift: 0x0a0c26, sky: 0.95, skyTint: 0xc8d4ff, stars: 0.85, starFall: 0.06, aurora: 0.05, seam: 0.2, lights: 0.85, faro: 1, seaGlow: 0.55, vignette: 0.42, dayLife: 0, cats: 0.2 };

export const DESPIERTA: CineScript = {
  id: 'p3_despierta',
  stage: 'island',
  releaseBlend: 3,
  replay: { title: 'El despertar', seen: B67, order: 67 },
  steps: [
    { ui: { bars: true, hud: false, skip: true } },
    { audio: { state: 'silence', fade: 2 } },
    { world: { to: NIGHT, dur: 2.4, ease: 'inOut' }, async: true },
    { audio: { ambience: 'night_astral', fade: 3 } },
    // they come home through the flap
    { camera: { to: 'gatera', zoom: 1.35, dur: 2.2, ease: 'inOut' } },
    { fx: { id: 'p3_flap' } },
    { actor: { who: 'canelo', do: 'hop' }, after: 0.3 },
    { wait: 0.9 },
    // D1: the page — the mark is cold, no steam
    { camera: { to: 'pagina', zoom: 1.45, dur: 1.8, ease: 'inOut' } },
    { wait: 1.3 },
    // D2: Canelo stops dead. The rock where REGISTRO 000 sat is EMPTY
    { actor: { who: 'canelo', do: 'look', arg: 'rocks', dur: 6 } },
    { camera: { to: 'rocks', zoom: 1.1, dur: 2.4, ease: 'inOut' } },
    { wait: 1.6 },
    // D3: the Catdex opens by itself: ESTADO ~~despertando~~ DESPIERTO, in the margins' hand
    { fx: { id: 'p3_registro' } },
    { wait: 4.6, reduced: { wait: 2.6 } },
    { persist: { beat: B67 } },
    // D4: the flap is TORN, static at its edges; little prints that lose their edges go in
    { call: (c) => void (!c.replay && faroPage()?.setGatera(true, true)) },
    { camera: { to: 'gatera', zoom: 1.7, dur: 2, ease: 'inOut' } },
    { fx: { id: 'glitch', dur: 0.45, k: 0.35 }, reduced: 'skip' },
    { wait: 1.5 },
    // D4′: his tail flame trembles and goes low for a moment, like a candle in a draft. Nobody says anything
    { camera: { to: 'canelo', zoom: 1.55, dur: 1.4, ease: 'inOut' } },
    { fx: { id: 'p3_llama' } },
    { wait: 1.6 },
    // D5–D6: at home he doesn't talk. He meows, that's all
    { say: { beat: B67, lines: DESPIERTA_LINES.ves } },
    { call: (c) => void (!c.skipping && sfx('meow', 0.9)) },
    { actor: { who: 'canelo', do: 'emote', arg: 'sleepy' } },
    { wait: 0.8 },
    { say: { beat: B67, lines: DESPIERTA_LINES.noSePuede } },
    // D7: a donut falls out of the sky and gets stuck on Canelo's palm
    { camera: { to: 'palmera', zoom: 1.45, dur: 1.6, ease: 'inOut' } },
    { fx: { id: 'p3_dona' } },
    { wait: 1.7, reduced: { wait: 0.6 } },
    { say: { beat: B67, lines: DESPIERTA_LINES.dona } },
    { ui: { bars: false, hud: true, skip: false } },
    { wait: 0.6 },
  ],
  finish: (c) => {
    if (c.replay) return;
    syncFaroPage();
    syncDona();
  },
};
registerCine(DESPIERTA);

// ------------------------------------------------------------------ the flourishes (island fx)
/** the flap swings: someone just came through */
registerIslandFx('p3_flap', () => {
  const p = faroPage();
  if (!p) return;
  p.setGatera(true, false);
  const flap = p.gatera?.children[1];
  sfx('pop', 0.7);
  if (!flap) return;
  const tl = gsap.timeline();
  tl.to(flap, { rotation: 0.9, duration: 0.15 }).to(flap, { rotation: 0, duration: 0.8, ease: 'elastic.out(1, 0.3)' });
  return () => {
    tl.kill();
    if (!flap.destroyed) flap.rotation = 0;
  };
});

/** D3: REGISTRO 000's card, in static: «despertando» gets struck out, «DESPIERTO» writes itself in the margins' hand */
registerIslandFx('p3_registro', (_cmd: FxCmd, ctx: CineCtx) => {
  const root = new Container();
  root.label = 'p3Registro';
  storyLayer().addChild(root);
  const PW = 640;
  const PH = 300;
  const card = new Container();
  const g = new Graphics();
  g.rect(10, 12, PW, PH).fill(C.pinkHot);
  g.rect(0, 0, PW, PH).fill(0x0b0a0c).stroke({ width: 4, color: C.paper, alignment: 1 });
  for (let i = 0; i < 30; i++) g.rect(Math.random() * PW * 0.5, Math.random() * PH, PW * (0.2 + Math.random() * 0.6), 1 + Math.random() * 3).fill({ color: Math.random() < 0.2 ? C.cyan : C.paper, alpha: 0.05 + Math.random() * 0.15 });
  card.addChild(g);
  const title = txt('REGISTRO 000 · FOLIO 000', { fontFamily: F.ui, fontWeight: '700', fontSize: 26, fill: C.paper, letterSpacing: 4 });
  title.position.set(32, 26);
  const k = txt('ESTADO', { fontFamily: F.ui, fontWeight: '700', fontSize: 20, fill: C.paper, letterSpacing: 6 });
  k.alpha = 0.7;
  k.position.set(32, 96);
  const was = poster('DESPERTANDO', 64, C.pinkHot);
  was.position.set(32, 124);
  const strike = new Graphics();
  const now = txt('DESPIERTO', { fontFamily: F.brush, fontSize: 70, fill: 0xf1ecff, stroke: { color: HAND, width: 7, join: 'round' }, padding: 20 }) as Text;
  now.position.set(PW - now.width - 20, 168);
  now.rotation = -0.05;
  now.alpha = 0;
  card.addChild(title, k, was, strike, now);
  root.addChild(card);
  card.position.set((W - PW) / 2, 150);
  sfx('glitch', 0.7);
  const fast = ctx.reduceMotion;
  const tl = gsap.timeline();
  tl.from(card, { alpha: 0, y: card.y - 30, duration: fast ? 0.1 : 0.35, ease: 'back.out(1.6)' });
  // the strike, drawn left → right
  const o = { k: 0 };
  tl.to(o, {
    k: 1,
    duration: fast ? 0.1 : 0.6,
    delay: fast ? 0.2 : 0.9,
    ease: 'power1.inOut',
    onStart: () => sfx('tick', 0.7),
    onUpdate: () => {
      if (strike.destroyed) return;
      const y = was.y + was.height * 0.55;
      strike.clear().moveTo(was.x - 6, y + 3).lineTo(was.x - 6 + (was.width + 12) * o.k, y - 3).stroke({ width: 7, color: HAND, cap: 'round' });
    },
  });
  tl.to(was, { alpha: 0.45, duration: 0.3 });
  // the word writes itself (a growing mask)
  const mask = new Graphics();
  card.addChild(mask);
  const m = { w: 1 };
  tl.add(() => {
    now.alpha = 1;
    now.mask = mask;
    sfx('reveal', 0.9);
  });
  tl.to(m, {
    w: now.width + 60,
    duration: fast ? 0.1 : 1.1,
    ease: 'power1.inOut',
    onUpdate: () => {
      if (mask.destroyed) return;
      mask.clear().rect(now.x - 20, now.y - 40, m.w, now.height + 80).fill(0xffffff);
    },
    onComplete: () => {
      if (!now.destroyed) now.mask = null;
      if (!mask.destroyed) mask.destroy();
    },
  });
  tl.to(card, { alpha: 0, duration: 0.35, delay: fast ? 0.9 : 1.2 });
  return () => {
    tl.kill();
    destroyDeep(root);
  };
});

/** D4′: the little flame on Canelo's tail trembles and goes low, then comes back */
registerIslandFx('p3_llama', (_cmd, ctx) => {
  const w = graded();
  if (!w) return;
  const flame = new Graphics();
  flame.label = 'p3Llama';
  const draw = (k: number) => {
    flame.clear();
    flame.ellipse(0, -10 * k, 7 * k, 14 * k).fill({ color: 0xff6a1a, alpha: 0.9 });
    flame.ellipse(0, -7 * k, 4 * k, 8 * k).fill({ color: 0xffd400, alpha: 0.95 });
  };
  draw(1);
  w.addChild(flame);
  let alive = true;
  void import('../../cine/registry').then(({ cineStage }) => {
    const p = cineStage('island')?.resolve('canelo');
    if (!alive || flame.destroyed) return;
    if (!p) return flame.destroy();
    // his tail sits behind him, a little low (actor resolve gives his head height)
    flame.position.set(p.x - 52, p.y + 30);
  });
  const o = { k: 1 };
  const tl = gsap.timeline({ onUpdate: () => !flame.destroyed && draw(o.k) });
  if (ctx.reduceMotion) tl.to(o, { k: 0.5, duration: 0.6 }).to(o, { k: 1, duration: 0.6 });
  else
    tl.to(o, { k: 0.85, duration: 0.08, repeat: 5, yoyo: true })
      .to(o, { k: 0.35, duration: 0.35, ease: 'power2.in' })
      .to(o, { k: 0.4, duration: 0.4 })
      .to(o, { k: 1, duration: 0.5, ease: 'back.out(2)' });
  tl.to(flame, { alpha: 0, duration: 0.3, delay: 0.2 });
  return () => {
    alive = false;
    tl.kill();
    if (!flame.destroyed) flame.destroy();
  };
});

/** D7: a donut falls out of the sky and gets stuck on the palm's crown (then the prop stays: syncDona) */
registerIslandFx('p3_dona', (_cmd, ctx) => {
  const w = graded();
  const top = palmTop();
  if (!w || !top) {
    if (!ctx.replay) syncDona(true);
    return;
  }
  const d = donaArt();
  d.position.set(top.x + 40, top.y - 700);
  d.rotation = -1.2;
  w.addChild(d);
  const tl = gsap.timeline({
    onComplete: () => {
      sfx('pop', 0.6);
      if (!d.destroyed) d.destroy();
      // the real prop (it rides the raft from now on); a replay leaves the island as the save says
      if (!ctx.replay) syncDona(true);
    },
  });
  tl.to(d, { x: top.x, y: top.y, rotation: 0.35, duration: ctx.reduceMotion ? 0.2 : 1.1, ease: 'power2.in' }).to(d.scale, { x: 1.25, y: 0.75, duration: 0.08, yoyo: true, repeat: 1 });
  return () => {
    tl.kill();
    if (!d.destroyed) d.destroy();
  };
});
