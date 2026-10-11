/**
 * Parte II · Oleada 2 «El Cielo Despierta» — the wave's CINE scenes (src/cine contract, docs/part-ii/20 §3 ·
 * docs/part-ii/22-oleada-2.md «Pasada de cine»). Same method as Oleada 1 (docs/part-ii/26): more world, fewer words.
 * Registered at import (app/oleada2Flow.ts imports this file at boot); the story director plays them through
 * `special: 'cine'` (ui/story/rupturasScriptO2.ts); Ajustes › VOLVER A VER replays the ones with `replay`.
 *
 * ISLAND (your island; the sky things live in ui/story/o2Sky.ts and are lent to the island stage as drives):
 *   h42_trombas    H42 a  three waterspouts stand up out of the Primer Mar and climb into the clouds; gulls ride them
 *   h43_aerobarco  H43 b  your ship inflates a striped balloon, unfolds two propellers and hops — same name
 *   h44_cascada    H44 a  up there, an island hangs upside down with a ship moored under it, also upside down
 *   h44_gravedad   H44 b  pebbles float up around your cats (GRAVEDAD); Plomito falls asleep and the deck creaks
 *   h45_corona     H45 a  a white symmetric city appears over the clouds, and everything purrs at once
 *   h46_ronron     H46 b  the embassy drifts away; Canelo bares his teeth (and wins the song); Ronrón stops purring
 *   h47_galeon     H47 a  a white galleon with a whale figurehead glides in among the hanging islands
 *   h47_ordenes    H47 b+c  the Leviathan drawn in chalk across the sky, obedient; the Correctores' chord; the scale
 *   h47_escama     H47 c  (part c alone) a cold black scale falls next to a Fragmento del Vacío: they match
 *   h48_senal      H48 a  night at your faro: three short, one long, a thread of light straight up; the choice
 *   h48_encendida  H48 b  she wipes the glass: the light comes out straighter than ever (the bass comes in)
 *   h49_horno      H49 a  Corona Celeste leans; crumbs and balls roll to the biggest oven, which breathes
 *   h49_costura    H49 b+c  the sky without weight for a second; a SEAM; behind it a hand of light writing; CONTINUARÁ
 *   h49_continuara H49 c  (part c alone)
 * REGION (3D; the islands lend `RegionBuild.cine`: regions/invertidas.ts, regions/corona.ts):
 *   h42_arriba     H42 b  from under the cloud sea, up a waterspout, out among the hanging islands; your ship wobbles
 *   h43_helice     H43 a  the mechanic comes down the spout on an umbrella-propeller and tapes a blueprint to the mast
 *   h45_ciudad     H45 b  perfect streets; identical cats purring in a ring; Hélice comes out with her bag packed
 *   h45_registro   H45 c  a system line types itself: REGISTRO 000 · LÍNEA NUEVA (the Catdex card shows it in fresh ink)
 *   h46_embajada   H46 a  the one tower that doesn't purr; the faceless bow; a brochure «CANELO 2.0 — SIN IMPACIENCIA»
 *
 * MUSIC (doc 18 §5.2 O2, through audio/api.ts only). The six ORIGINAL songs are reserved for the «Momentos musicales»
 * (owner, 2026-10-10): these scenes cue ONLY variations (`*.ambient`, `*.explore`, `*.aftermath*`), `amb.*`, stingers
 * and director states. Missing stingers (`tromba`, `kit_vuelo`, `swap`, `correctores`, `titiriteros`) fall back to the
 * motifs registered below (cine/sound.ts stingerOr). Fonoteca (§8): O2_SONGS, idempotent, after the scene.
 * Nothing here ever saves in a replay: every call with an effect checks `c.replay`.
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { registerCine } from '../../cine/registry';
import type { CineCtx, CineScript, CineStage, FxCmd, Step } from '../../cine/types';
import { audioApi } from '../../audio/api';
import { cueBest, motif, MOTIFS, stingerOr, unlockSoon } from '../../cine/sound';
import type { Voice } from '../../core/audio';
import { game } from '../../core/App';
import { scenes } from '../../core/scenes';
import { G } from '../../state/game';
import { C, F } from '../theme';
import { poster, txt } from '../widgets';
import { O2_SKY_IDS, o2Sky, syncO2Sky, type O2SkyId } from './o2Sky';

const B42 = 'b42_trombas';
const B43 = 'b43_kit';
const B44 = 'b44_invertidas';
const B45 = 'b45_corona';
const B46 = 'b46_embajada';
const B47 = 'b47_almirante';
const B48 = 'b48_linterna';
const B49 = 'b49_masamadre';
/** out to sea, up-left: the same bearing the O1 faro pointed (cine/scenes/faro.ts FARO_BEARING) */
const OUTWARD = 3.45;

// ------------------------------------------------------------------ O2 motifs (doc 18 §9 stingers, until recorded)
const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const tine = (m: number, at: number, dur = 1.2, vol = 0.1): Voice[] => [
  { wave: 'sine', freq: hz(m), dur, vol, delay: at, attack: 0.004 },
  { wave: 'sine', freq: hz(m) * 4.01, dur: dur * 0.35, vol: vol * 0.2, delay: at, attack: 0.002 },
  { wave: 'triangle', freq: hz(m) * 2, dur: dur * 0.6, vol: vol * 0.16, delay: at, attack: 0.003 },
];
const O2_MOTIFS: Record<string, () => Voice[]> = {
  /** H42: a rising swirl that lands on Fa (Hemkade's key): the sea stands up */
  tromba: () => [
    { wave: 'noise', freq: 1.2, to: 3.2, dur: 2.4, vol: 0.05, hp: 900, attack: 0.9 },
    ...[53, 57, 60, 64, 65].flatMap((m, i) => tine(m + 12, 0.25 + i * 0.22, 1.4, 0.08)),
    { wave: 'sine', freq: hz(41), dur: 2.6, vol: 0.06, delay: 1.1, attack: 0.4 },
  ],
  /** H43: a wrench tap, a ratchet, a bright Fa major arpeggio: it flies */
  kit_vuelo: () => [
    { wave: 'square', freq: 1800, to: 1200, dur: 0.05, vol: 0.03 },
    ...[0, 0.07, 0.14, 0.21].map((t): Voice => ({ wave: 'noise', freq: 4, dur: 0.04, vol: 0.04, delay: 0.25 + t, hp: 2500 })),
    ...[65, 69, 72, 77].flatMap((m, i) => tine(m, 0.6 + i * 0.1, 1.1, 0.08)),
  ],
  /** Corona Celeste: an enormous purr, everyone at the same time (a low, perfectly regular flutter) */
  ronroneo: () => [0, 1, 2].map((i): Voice => ({ wave: 'sawtooth', freq: 27 + i * 0.01, dur: 3.2, vol: 0.05, delay: i * 0.002, attack: 0.6, lp: 180, vib: 9 })),
  /** H46 «duelo de temas»: one bar cut — a tape stop and a slap (the music box gives the floor to Canelo) */
  swap: () => [
    { wave: 'sawtooth', freq: 220, to: 40, dur: 0.45, vol: 0.05, lp: 1200 },
    { wave: 'noise', freq: 2, dur: 0.12, vol: 0.07, delay: 0.47, hp: 400 },
    { wave: 'sine', freq: 110, to: 55, dur: 0.25, vol: 0.09, delay: 0.47 },
  ],
  /** the Correctores: CIRCUS MALUS's «perfect» chords, dry (doc 18 §9 motif.correctores) */
  correctores: () => (MOTIFS.correccion ? MOTIFS.correccion() : []),
  /** the Titiriteros: Si♭ lydian, harp + glass + a pencil scratching (doc 18 §9 motif.titiriteros, «mano de luz») */
  titiriteros: () => [
    ...[70, 74, 76, 77, 82].flatMap((m, i) => tine(m, i * 0.28, 2.2, 0.06)),
    ...[0, 1, 2, 3].map((i): Voice => ({ wave: 'sine', freq: hz(94 + (i % 2) * 2), dur: 1.8, vol: 0.018, delay: 1.4 + i * 0.3, attack: 0.3, vib: 2 })),
    ...[1.6, 1.85, 2.02, 2.3, 2.5, 2.74].map((t): Voice => ({ wave: 'noise', freq: 3, to: 2.4, dur: 0.12, vol: 0.045, delay: t, hp: 2600, attack: 0.01 })),
  ],
};
for (const [k, v] of Object.entries(O2_MOTIFS)) if (!(k in MOTIFS)) MOTIFS[k] = v;

/** a narrative cue of the first VARIATION that exists, released when the cine ends (however it ends) */
function cueOwned(c: CineCtx, refs: string[], o: Parameters<typeof cueBest>[1] = {}, releaseFade = 3) {
  if (c.skipping) return null;
  const r = cueBest(refs, { fadeIn: 2, ...o });
  if (r) c.own(() => audioApi.release(releaseFade));
  return r;
}
/** duck the music under a moment (keyed; always let go) */
function duckOwned(c: CineCtx, db: number, key: string) {
  if (c.skipping) return;
  audioApi.duck(true, db, key);
  c.own(() => audioApi.duck(false, db, key));
}

// ------------------------------------------------------------------ Fonoteca (doc 18 §8 · Oleada 2)
const has = (id: string) => !!G.s?.missions?.done.includes(id);
/** what Oleada 2 hands the Fonoteca, and when (mission state: a reload or the narrative reset catch up) */
export const O2_SONGS: { ref: string; source: string; when: () => boolean }[] = [
  { ref: 'hemkade.ambient', source: 'Islas Invertidas', when: () => has('H44') },
  { ref: 'circus_malus.explore', source: 'Corona Celeste', when: () => has('H45') },
  { ref: 'yonose_todo.ambient', source: 'Luzterna lo sabe', when: () => has('H48') },
  // «perder con dignidad»: the first story defeat unlocks it elsewhere; if you never lose, winning H49 does (§8)
  { ref: 'when_i_lose.aftermath', source: 'Primordial de la Gravedad', when: () => has('H49') },
];
/** the records of one moment (the scene calls it at its point of no return; idempotent, after the scene) */
export function unlockO2(refs: string[]) {
  for (const s of O2_SONGS) if (refs.includes(s.ref)) unlockSoon(s.ref, s.source);
}
/** catch-up (idempotent; app/oleada2Flow on the island): every O2 record this save earned whose recording exists */
const tried = new Set<string>();
export function syncO2Songs() {
  for (const s of O2_SONGS) {
    if (tried.has(s.ref)) continue;
    try {
      if (s.when()) {
        tried.add(s.ref);
        unlockSoon(s.ref, s.source);
      }
    } catch {
      /* never breaks the island */
    }
  }
}

// ------------------------------------------------------------------ the island lends O2's sky to a scene
type Lendable = CineStage & Record<string, unknown>;
/** while an O2 scene plays on the island, its stage also drives the O2 sky (ui/story/o2Sky.ts) */
function lend(c: CineCtx) {
  const st = c.stage as Lendable;
  if (st.id !== 'island' || st.__o2) return;
  const sky = syncO2Sky(true);
  const own = { drive: st.drive, driveGet: st.driveGet };
  const isO2 = (id: string): id is O2SkyId => (O2_SKY_IDS as readonly string[]).includes(id);
  st.__o2 = true;
  st.drive = (id: string, k: number, ctx: CineCtx) => (isO2(id) ? o2Sky()?.drive(id, k) : own.drive?.call(st, id, k, ctx));
  st.driveGet = (id: string) => (isO2(id) ? o2Sky()?.driveGet(id) : own.driveGet?.call(st, id));
  c.own(() => {
    delete st.drive;
    delete st.driveGet;
    delete st.__o2;
    (o2Sky() ?? sky)?.release();
  });
}
const UI_IN: Step = { ui: { bars: true, hud: false, skip: true } };
/** H44: Plomito is on the island (his own beat) — or he isn't, and comes aboard your boat instead */
const plomitoHome = (c: CineCtx) => c.stage.id === 'island' && !!c.stage.resolve('species:c_plomito');
function plomitoAboard(c: CineCtx) {
  if (c.skipping) return;
  const stop = o2Sky()?.plomitoAboard(c.reduceMotion);
  if (stop) c.own(stop);
}
const LEND: Step = { call: (c) => lend(c) };
const at0 = (id: O2SkyId, v: number): Step => ({ drive: { id, from: v, to: v, dur: 0 } });

// ------------------------------------------------------------------ screen flourishes of the wave (overlay layer)
function overlay() {
  const c = new Container();
  c.label = 'cineFx';
  c.eventMode = 'none';
  scenes.overlayLayer.addChild(c);
  return c;
}
const fadeOut = (root: Container) => () => {
  gsap.killTweensOf(root);
  if (root.destroyed) return;
  gsap.to(root, { alpha: 0, duration: 0.35, onComplete: () => !root.destroyed && root.destroy({ children: true }) });
};

/** H46: the embassy's brochure slides in front of Canelo: «CANELO 2.0 — SIN IMPACIENCIA» */
function folleto(c: CineCtx) {
  const root = overlay();
  const v = game.view;
  const card = new Container();
  const w = 520;
  const h = 360;
  card.addChild(new Graphics().rect(10, 10, w, h).fill({ color: C.ink, alpha: 0.6 }).rect(0, 0, w, h).fill(0xfbfaf6).stroke({ width: 4, color: 0xcfcab8, alignment: 1 }));
  // a trifold: two soft creases, perfectly even
  card.addChild(new Graphics().rect(w / 3, 0, 2, h).fill({ color: 0xdcd6c6 }).rect((2 * w) / 3, 0, 2, h).fill({ color: 0xdcd6c6 }));
  const head = poster('CANELO 2.0', 64, C.ink, { letterSpacing: 2 });
  head.anchor.set(0.5, 0);
  head.position.set(w / 2, 30);
  const sub = txt('— SIN IMPACIENCIA —', { fontFamily: F.ui, fontWeight: '700', fontSize: 24, fill: 0x8a8578, letterSpacing: 4 }) as Text;
  sub.anchor.set(0.5, 0);
  sub.position.set(w / 2, 108);
  card.addChild(head, sub);
  const rows: [string, boolean][] = [
    ['Espera su turno', true],
    ['No muerde barcos', true],
    ['Ronronea siempre', true],
    ['Impaciencia', false],
  ];
  rows.forEach(([label, ok], i) => {
    const y = 168 + i * 42;
    const box = new Graphics().rect(60, y, 26, 26).stroke({ width: 3, color: C.ink });
    if (ok) box.moveTo(64, y + 14).lineTo(72, y + 22).lineTo(84, y + 4).stroke({ width: 4, color: 0x3e6fd8, cap: 'round', join: 'round' });
    else box.moveTo(62, y + 2).lineTo(84, y + 24).moveTo(84, y + 2).lineTo(62, y + 24).stroke({ width: 4, color: C.red, cap: 'round' });
    const t = txt(label, { fontFamily: F.serif, fontSize: 26, fill: C.ink }) as Text;
    t.position.set(102, y - 2);
    card.addChild(box, t);
    if (!ok) card.addChild(new Graphics().rect(100, y + 13, t.width + 6, 3).fill(C.red));
  });
  card.pivot.set(w / 2, h / 2);
  card.position.set(v.x + v.w * 0.66, v.y + v.h * 0.44);
  card.rotation = 0.04;
  root.addChild(card);
  if (!c.reduceMotion) gsap.from(card, { x: v.x + v.w + 300, rotation: 0.4, duration: 0.6, ease: 'back.out(1.4)' });
  else gsap.from(root, { alpha: 0, duration: 0.3 });
  return fadeOut(root);
}

/** H47 c: a cold black scale falls and lands next to one of your Fragmentos del Vacío: they're the same */
function escama(c: CineCtx) {
  const root = overlay();
  const v = game.view;
  const cx = v.x + v.w / 2;
  const cy = v.y + v.h * 0.42;
  const dim = new Graphics().rect(v.x, v.y, v.w, v.h).fill({ color: C.ink, alpha: 0.35 });
  const shard = (dark: number, glint: number) => {
    const g = new Graphics();
    g.poly([0, -70, 44, -18, 30, 58, -20, 70, -46, 6]).fill(dark).stroke({ width: 4, color: 0x0b0a0c, join: 'round' });
    g.poly([-8, -48, 18, -16, 6, 20]).fill({ color: glint, alpha: 0.35 });
    g.moveTo(-20, 30).lineTo(16, 44).stroke({ width: 2, color: glint, alpha: 0.4 });
    return g;
  };
  const scale = shard(0x15131c, 0x8fa0c8);
  const frag = shard(0x1c1530, 0xb79cff);
  const eq = poster('=', 96, C.paper, { stroke: { color: C.ink, width: 8 } });
  eq.anchor.set(0.5);
  eq.position.set(cx, cy);
  eq.alpha = 0;
  frag.position.set(cx + 170, cy);
  const lab = (s: string, x: number) => {
    const t = txt(s, { fontFamily: F.ui, fontWeight: '700', fontSize: 20, fill: C.paper, letterSpacing: 4 }) as Text;
    t.anchor.set(0.5, 0);
    t.position.set(x, cy + 96);
    return t;
  };
  const l1 = lab('ESCAMA DEL GALEÓN', cx - 170);
  const l2 = lab('FRAGMENTO DEL VACÍO', cx + 170);
  l1.alpha = 0;
  root.addChild(dim, frag, l2, scale, l1, eq);
  root.alpha = 0;
  gsap.to(root, { alpha: 1, duration: 0.4 });
  // it falls like a leaf (or just appears: reduce motion), cold — a breath of frost around it
  scale.position.set(cx - 170, c.reduceMotion ? cy : v.y - 120);
  const tl = gsap.timeline();
  if (!c.reduceMotion) {
    tl.to(scale, { y: cy, duration: 1.6, ease: 'sine.inOut' }, 0);
    tl.to(scale, { rotation: 0.5, duration: 0.4, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0);
  }
  tl.to([l1, eq], { alpha: 1, duration: 0.4 }, c.reduceMotion ? 0.2 : 1.7);
  if (!c.reduceMotion) tl.fromTo(eq.scale, { x: 1.8, y: 1.8 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(2)' }, 1.7);
  return () => {
    tl.kill();
    fadeOut(root)();
  };
}

/** H49 c: the seam opens a slit for a moment: a hand made of light holds a pencil and writes; then it closes */
function mano(c: CineCtx) {
  const root = overlay();
  const v = game.view;
  const cx = v.x + v.w * 0.52;
  const cy = v.y + v.h * 0.3;
  const W2 = 400;
  // the sky darkens a little around the seam so its light reads
  const dim = new Graphics().rect(v.x, v.y, v.w, v.h).fill({ color: 0x0b0a1c, alpha: 0.42 });
  dim.alpha = 0;
  const glow = new Graphics();
  const slit = new Graphics();
  const mask = new Graphics();
  const stitches = new Graphics();
  // the hand: palm, fingers around a pencil — all light, no detail (you never see whose it is)
  const hand = new Container();
  const hg = new Graphics();
  hg.roundRect(-46, -20, 92, 70, 30).fill(0xfffbea);
  for (const [x, y, w, h, r] of [
    [-40, -58, 22, 50, 10],
    [-14, -66, 22, 56, 10],
    [12, -60, 22, 50, 10],
    [38, -26, 20, 40, 9],
  ] as [number, number, number, number, number][])
    hg.roundRect(x - w / 2, y, w, h, r).fill(0xfffbea);
  hg.roundRect(-46, -20, 92, 70, 30).stroke({ width: 3, color: 0xf0b44c, alpha: 0.8 });
  const pencil = new Graphics().rect(-7, -160, 14, 140).fill(0xf0b44c).stroke({ width: 3, color: 0x6b4a1e }).poly([-7, -20, 7, -20, 0, 8]).fill(0xf7e2b8).circle(0, 5, 3).fill(0x2a2440);
  pencil.rotation = 0.5;
  pencil.position.set(-6, -10);
  const halo = new Graphics().circle(0, -10, 120).fill({ color: 0xfff1c8, alpha: 0.22 }).circle(0, -10, 80).fill({ color: 0xfff6dc, alpha: 0.3 });
  hand.addChild(halo, pencil, hg);
  hand.scale.set(1.5);
  hand.position.set(cx - 120, cy + 40);
  hand.mask = mask;
  const stroke = new Graphics();
  stroke.mask = mask;
  root.addChild(dim, glow, slit, stroke, hand, mask, stitches);
  const s = { open: 0, w: 0 };
  const lens = (g: Graphics, hh: number, ww: number) =>
    g.poly([cx - ww, cy, cx - ww * 0.45, cy - hh * 0.8, cx, cy - hh, cx + ww * 0.5, cy - hh * 0.75, cx + ww, cy, cx + ww * 0.45, cy + hh * 0.8, cx, cy + hh, cx - ww * 0.5, cy + hh * 0.75]);
  const draw = () => {
    if (slit.destroyed) return;
    const hh = 92 * s.open;
    glow.clear();
    slit.clear();
    mask.clear();
    stitches.clear();
    dim.alpha = s.open;
    if (hh > 0.5) {
      lens(glow, hh * 1.9, W2 * 1.12).fill({ color: 0xfff1c8, alpha: 0.18 });
      lens(glow, hh * 1.35, W2 * 1.05).fill({ color: 0xfff1c8, alpha: 0.28 });
      // behind the seam it's not sky: deep ink, and a light that isn't ours
      lens(slit, hh, W2).fill(0x15123a).stroke({ width: 5, color: 0xfff1c8, alpha: 0.95 });
      lens(mask, hh, W2).fill(0xffffff);
      // the stitches that hold the sky together, across the opening
      for (let i = -6; i <= 6; i++) stitches.moveTo(cx + i * 58 - 6, cy - hh - 16).lineTo(cx + i * 58 + 6, cy + hh + 16).stroke({ width: 4, color: 0xf4efe6, alpha: 0.8 });
    }
    stroke.clear();
    if (s.w > 0) {
      // what the pencil writes: a line nobody can read
      stroke.moveTo(cx - 220, cy + 46);
      const n = Math.round(30 * s.w);
      for (let i = 1; i <= n; i++) stroke.lineTo(cx - 220 + i * 13, cy + 46 + Math.sin(i * 1.7) * 9 - (i % 5 === 0 ? 14 : 0));
      stroke.stroke({ width: 5, color: 0xfff1c8, alpha: 0.95, cap: 'round', join: 'round' });
    }
  };
  const tl = gsap.timeline({ onUpdate: draw });
  tl.to(s, { open: 1, duration: c.reduceMotion ? 0.3 : 1.1, ease: 'power2.out' });
  tl.to(s, { w: 1, duration: 2.4, ease: 'none' });
  if (!c.reduceMotion) tl.to(hand, { x: cx + 200, duration: 2.4, ease: 'none' }, '<');
  tl.to(s, { open: 0, duration: c.reduceMotion ? 0.3 : 0.8, ease: 'power2.in' }, '+=0.5');
  return () => {
    tl.kill();
    fadeOut(root)();
  };
}

/** H43 b: a paper tag says the ship's name is still its name */
function nameTag(c: CineCtx) {
  const root = overlay();
  const v = game.view;
  let name = 'TU BARCO';
  try {
    const shipId = G.s.ship.active;
    const custom = (G.s.ship as unknown as { names?: Record<string, string> }).names?.[shipId];
    name = (custom || shipId || name).toUpperCase();
  } catch {
    /* ignore */
  }
  void import('../../state/sys/ship').then((m) => {
    try {
      t.text = `«${m.shipName(G.s.ship.active).toUpperCase()}»`;
      bg.clear().rect(-t.width / 2 - 20, -30, t.width + 40, 60).fill(C.paper).stroke({ width: 4, color: C.ink, alignment: 1 });
    } catch {
      /* ignore */
    }
  });
  const t = poster(`«${name}»`, 40, C.ink);
  t.anchor.set(0.5);
  const bg = new Graphics().rect(-t.width / 2 - 20, -30, t.width + 40, 60).fill(C.paper).stroke({ width: 4, color: C.ink, alignment: 1 });
  const cap = txt('MISMO NOMBRE', { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.pinkHot, letterSpacing: 4 }) as Text;
  cap.anchor.set(0.5, 0);
  cap.position.set(0, 36);
  const tag = new Container();
  tag.addChild(bg, t, cap);
  tag.position.set(v.x + v.w / 2, v.y + v.h * 0.78);
  tag.rotation = -0.03;
  root.addChild(tag);
  root.alpha = 0;
  gsap.to(root, { alpha: 1, duration: 0.35 });
  if (!c.reduceMotion) gsap.from(tag.scale, { x: 0.6, y: 0.6, duration: 0.4, ease: 'back.out(2)' });
  return fadeOut(root);
}

/** mount a flourish now (not while SALTAR folds the scene), removed when the scene ends */
const show = (fn: (c: CineCtx) => () => void): Step => ({ call: (c) => void (!c.skipping && c.own(fn(c))) });

// ================================================================== ISLAND scenes
export const H42_TROMBAS: CineScript = {
  id: 'h42_trombas',
  stage: 'island',
  releaseBlend: 2,
  replay: { title: 'Trombas', seen: `${B42}#a`, order: 42 },
  steps: [
    UI_IN,
    LEND,
    at0('trombas', 0),
    { audio: { ambience: 'wind', level: 0.9, fade: 2 } },
    { world: { to: 'o2_trombas', dur: 3 }, async: true },
    // down at the sea, out where they'll stand
    { camera: { to: 'home', offset: [1250, -330], zoom: 0.6, dur: 2.6, ease: 'inOut' } },
    { call: (c) => void (!c.skipping && stingerOr('tromba')) },
    // the sea stands up: three of them, climbing; the gulls go up with them without flapping
    { drive: { id: 'trombas', to: 1, dur: 6, ease: 'inOut' }, async: true, reduced: { drive: { id: 'trombas', to: 1, dur: 2 } } },
    { actor: { who: 'awake', do: 'emote', arg: 'surprise', stagger: 0.05 }, after: 0.8 },
    { actor: { who: 'near:faro', do: 'mark', arg: '!', stagger: 0.12 }, after: 0.4 },
    // from the bottom up (doc: «cámara de abajo hacia arriba»)
    { camera: { to: 'home', offset: [1250, -1150], zoom: 0.5, dur: 5, ease: 'inOut' }, after: 0.4 },
    { say: { beat: B42, lines: [0] } },
    { camera: { to: 'home', offset: [700, -700], zoom: 0.55, dur: 2.6, ease: 'inOut' }, async: true },
    { say: { beat: B42, lines: [1, 2], onLine: { 1: { actor: { who: 'canelo', do: 'hop' }, after: 0.6 } } } },
    { persist: { beat: `${B42}#a` } },
    { wait: 0.6 },
  ],
};

export const H43_AEROBARCO: CineScript = {
  id: 'h43_aerobarco',
  stage: 'island',
  releaseBlend: 1.2,
  replay: { title: 'Mismo barco, ahora flota', seen: `${B43}#b`, order: 43.1 },
  steps: [
    UI_IN,
    LEND,
    at0('balloon', 0),
    { camera: { to: 'boat', offset: [0, -90], zoom: 1.15, dur: 2.2, ease: 'inOut' } },
    { call: (c) => void (!c.skipping && stingerOr('kit_vuelo')) },
    // the balloon fills, the propellers unfold…
    { drive: { id: 'balloon', to: 1, dur: 2.6, ease: 'outBack' }, reduced: { drive: { id: 'balloon', to: 1, dur: 0.8 } } },
    // …and it hops
    { drive: { id: 'hop', to: 1, dur: 0.32, ease: 'out' }, reduced: 'skip' },
    { drive: { id: 'hop', to: 0, dur: 0.6, ease: 'outBack' }, reduced: 'skip' },
    { actor: { who: 'near:boat', do: 'hop', stagger: 0.1 } },
    show(nameTag),
    { wait: 1.2 },
    { say: { beat: B43, lines: [4] } },
    { say: { beat: B43, lines: [5, 6] } },
    { persist: { beat: `${B43}#b` } },
    { wait: 0.4 },
  ],
};

export const H44_CASCADA: CineScript = {
  id: 'h44_cascada',
  stage: 'island',
  releaseBlend: 1.5,
  replay: { title: 'Una isla de cabeza', seen: `${B44}#a`, order: 44 },
  steps: [
    UI_IN,
    LEND,
    at0('islas', 1),
    at0('cascada', 0),
    // the sky's theme, quietly (Hemkade «Cielo abierto», a variation)
    { call: (c) => void cueOwned(c, ['hemkade.ambient'], { fadeIn: 3 }) },
    { camera: { to: 'home', offset: [180, -1260], zoom: 0.62, dur: 3.2, ease: 'inOut' } },
    // under the middle island: a ship moored to its bottom, upside down; its captain too
    { drive: { id: 'cascada', to: 1, dur: 2.2, ease: 'out' } },
    { say: { beat: B44, lines: [0] } },
    { actor: { who: 'canelo', do: 'emote', arg: 'attack' } },
    { say: { beat: B44, lines: [1, 2] } },
    { persist: { beat: `${B44}#a` } },
    { wait: 0.4 },
  ],
};

export const H44_GRAVEDAD: CineScript = {
  id: 'h44_gravedad',
  stage: 'island',
  releaseBlend: 1.5,
  replay: { title: 'Todo pesa menos', seen: `${B44}#b`, order: 44.1 },
  steps: [
    UI_IN,
    LEND,
    { call: (c) => void cueOwned(c, ['hemkade.ambient'], { fadeIn: 2 }) },
    { camera: { to: 'home', offset: [0, -20], zoom: 0.82, dur: 2, ease: 'inOut' }, async: true },
    // GRAVEDAD came home with you: little stones float up around every cat
    { call: () => o2Sky()?.floatPebbles(true) },
    { drive: { id: 'pebbles', from: 0, to: 1, dur: 3, ease: 'out' }, async: true },
    { actor: { who: 'all', do: 'emote', arg: 'surprise', stagger: 0.04 }, after: 0.8 },
    { say: { beat: B44, lines: [3] } },
    { say: { beat: B44, lines: [4, 5] } },
    // Plomito falls asleep on deck — and the deck creaks. Not on your island (out with a fleet, not yours yet)? He
    // drops onto YOUR boat's deck and falls asleep there: his beat never goes missing (PULIDO 2026-10-10)
    { camera: { to: 'species:c_plomito', zoom: 1.1, dur: 1.6, ease: 'inOut' }, when: plomitoHome },
    { actor: { who: 'species:c_plomito', do: 'emote', arg: 'sleepy' }, when: plomitoHome },
    { camera: { to: 'boat', offset: [0, -90], zoom: 1.12, dur: 1.6, ease: 'inOut' }, when: (c) => !plomitoHome(c) },
    { call: (c) => plomitoAboard(c), when: (c) => !plomitoHome(c) },
    { wait: 0.6, when: (c) => !plomitoHome(c) },
    { fx: { id: 'shake', k: 0.14 }, reduced: 'skip', after: 0.5 },
    { actor: { who: 'species:c_plomito', do: 'mark', arg: 'Zzz' }, when: plomitoHome },
    { say: { beat: B44, lines: [6] } },
    { drive: { id: 'pebbles', to: 0, dur: 2 }, async: true },
    { persist: { beat: `${B44}#b` } },
    { call: (c) => void (!c.replay && unlockO2(['hemkade.ambient'])) },
    { wait: 1 },
  ],
  finish: () => o2Sky()?.floatPebbles(false),
};

export const H45_CORONA: CineScript = {
  id: 'h45_corona',
  stage: 'island',
  releaseBlend: 1.5,
  replay: { title: 'Una ciudad sobre las nubes', seen: `${B45}#a`, order: 45 },
  steps: [
    UI_IN,
    LEND,
    at0('corona', 0),
    { camera: { to: 'home', offset: [320, -1560], zoom: 0.56, dur: 3.2, ease: 'inOut' } },
    // far away, a music box too perfect to be anyone's (CIRCUS MALUS «Cajita de música», a variation) …
    {
      call: (c) => {
        if (cueOwned(c, ['circus_malus.explore'], { fadeIn: 4 })) duckOwned(c, 8, 'o2_corona');
      },
    },
    { drive: { id: 'corona', to: 1, dur: 4, ease: 'inOut' }, reduced: { drive: { id: 'corona', to: 1, dur: 1.2 } } },
    // … and an enormous purr, everyone at the same time
    { call: (c) => void (!c.skipping && stingerOr('ronroneo')) },
    { actor: { who: 'awake', do: 'emote', arg: 'surprise', stagger: 0.03 } },
    { wait: 2.2 },
    { say: { beat: B45, lines: [0, 1] } },
    { persist: { beat: `${B45}#a` } },
    { wait: 0.4 },
  ],
};

export const H46_RONRON: CineScript = {
  id: 'h46_ronron',
  stage: 'island',
  releaseBlend: 1.5,
  replay: { title: 'Canelo no está descompuesto', seen: `${B46}#b`, order: 46.1 },
  steps: [
    UI_IN,
    LEND,
    at0('corona', 1),
    at0('embajada', 1),
    at0('embajadaAway', 0),
    // the Corrector's music box (a variation)…
    { call: (c) => void cueOwned(c, ['circus_malus.explore'], { fadeIn: 1.5 }) },
    { camera: { to: 'home', offset: [880, -1500], zoom: 0.58, dur: 2.4, ease: 'inOut' } },
    { say: { beat: B46, lines: [3] } },
    // the embassy leaves
    { drive: { id: 'embajadaAway', to: 1, dur: 4, ease: 'in' }, async: true, reduced: { drive: { id: 'embajadaAway', to: 1, dur: 1.5 } } },
    { camera: { to: 'canelo', zoom: 1.12, dur: 2, ease: 'inOut' }, after: 0.8 },
    { actor: { who: 'canelo', do: 'emote', arg: 'attack' } },
    { actor: { who: 'canelo', do: 'mark', arg: '¡GRRR!' } },
    // «duelo de temas»: the music box gives the floor to Canelo (doc 18 §5.2 H46, with variations + a swap stinger)
    {
      call: (c) => {
        if (c.skipping) return;
        stingerOr('swap');
        if (cueBest(['liky_fight.explore'], { quantize: 'bar', fadeIn: 0.2 })) c.own(() => audioApi.release(3));
      },
    },
    { wait: 1.4 },
    { actor: { who: 'canelo', do: 'act', arg: 'yawn' } },
    { wait: 1.3 },
    { actor: { who: 'canelo', do: 'act', arg: 'groom' } },
    // and the white cat who came aboard stops purring, for the first time
    { camera: { to: 'species:r_ronron', zoom: 1.12, dur: 1.8, ease: 'inOut' } },
    { call: (c) => void (!c.skipping && stingerOr('ronroneo')) },
    { wait: 1.1 },
    { actor: { who: 'species:r_ronron', do: 'mark', arg: '…' } },
    { actor: { who: 'species:r_ronron', do: 'emote', arg: 'surprise' } },
    { say: { beat: B46, lines: [4] } },
    { persist: { beat: `${B46}#b` } },
    { wait: 0.4 },
  ],
};

export const H47_GALEON: CineScript = {
  id: 'h47_galeon',
  stage: 'island',
  releaseBlend: 1.5,
  replay: { title: 'Un galeón blanco', seen: `${B47}#a`, order: 47 },
  steps: [
    UI_IN,
    LEND,
    at0('islas', 1),
    at0('galeon', 0),
    { call: (c) => void cueOwned(c, ['hemkade.ambient'], { fadeIn: 3 }) },
    { camera: { to: 'home', offset: [-420, -1180], zoom: 0.6, dur: 3, ease: 'inOut' } },
    // it glides in among the hanging islands: a whale for a figurehead, an admiral's insignia painted over in white
    { drive: { id: 'galeon', to: 1, dur: 5, ease: 'out' }, reduced: { drive: { id: 'galeon', to: 1, dur: 1.5 } } },
    { say: { beat: B47, lines: [0] } },
    { call: (c) => void (!c.skipping && stingerOr(['correctores'], 'correctores')) },
    { say: { beat: B47, lines: [1] } },
    { actor: { who: 'canelo', do: 'emote', arg: 'attack' } },
    { say: { beat: B47, lines: [2] } },
    { persist: { beat: `${B47}#a` } },
    { wait: 0.4 },
  ],
};

/** part c: the scale and the fragment */
const ESCAMA: Step[] = [
  { drive: { id: 'galeon', to: 0, dur: 3 }, async: true },
  show(escama),
  { wait: 2.6 },
  { say: { beat: B47, lines: [6, 7] } },
  { persist: { beat: `${B47}#c` } },
  { persist: { beat: B47 } },
];

export const H47_ORDENES: CineScript = {
  id: 'h47_ordenes',
  stage: 'island',
  releaseBlend: 2,
  replay: { title: 'Tiza en el cielo', seen: `${B47}#b`, order: 47.1 },
  steps: [
    UI_IN,
    LEND,
    at0('islas', 1),
    at0('galeon', 1),
    at0('leviatan', 0),
    { world: { to: { exposure: 0.88, tint: 0xd8def0, saturation: 0.7, vignette: 0.35, dayLife: 0.4 }, dur: 2.5 }, async: true },
    { call: (c) => void cueOwned(c, ['hemkade.ambient'], { fadeIn: 2 }) },
    { camera: { to: 'home', offset: [60, -1320], zoom: 0.52, dur: 3, ease: 'inOut' } },
    // while the Almirante speaks, the Leviathan draws itself in chalk across the sky — obedient
    { say: { beat: B47, lines: [3], onLine: { 0: { drive: { id: 'leviatan', to: 1, dur: 6, ease: 'inOut' }, reduced: { drive: { id: 'leviatan', to: 1, dur: 1 } } } } } },
    { drive: { id: 'leviatan', to: 1, dur: 0.5 } },
    // «Nosotros sí. Los Correctores.» — the harmony says who they were
    {
      call: (c) => {
        duckOwned(c, 10, 'o2_correctores');
        if (!c.skipping) stingerOr(['correctores'], 'correctores');
      },
    },
    { say: { beat: B47, lines: [4] } },
    { say: { beat: B47, lines: [5] } },
    { persist: { beat: `${B47}#b` } },
    { drive: { id: 'leviatan', to: 0, dur: 2.5 }, async: true },
    ...ESCAMA,
  ],
};

export const H47_ESCAMA: CineScript = {
  id: 'h47_escama',
  stage: 'island',
  releaseBlend: 1.5,
  replay: { title: 'Una escama fría', seen: `${B47}#c`, order: 47.2 },
  steps: [UI_IN, LEND, at0('galeon', 1), ...ESCAMA],
};

/** H48: the bass comes in on the next bar (doc 18 §5.2: «déjala encendida» / her line), a variation layer */
export function linternaBassIn() {
  try {
    if (audioApi.currentTrack() === 'yonose_todo.aftermath_bajo') return;
    cueBest(['yonose_todo.aftermath_bajo'], { quantize: 'bar', fadeIn: 0.4 });
  } catch {
    /* sound never breaks a scene */
  }
}
/** the night of the lantern hands its music to «Más derecha que nunca» (released there, or here if it never plays) */
let senalMusicT = 0;
function releaseSoon(ms: number) {
  window.clearTimeout(senalMusicT);
  senalMusicT = window.setTimeout(() => {
    void import('../../cine/registry').then((r) => {
      if (!r.runningCine()) audioApi.release(4);
    });
  }, ms);
}

export const H48_SENAL: CineScript = {
  id: 'h48_senal',
  stage: 'island',
  releaseBlend: 2,
  replay: { title: 'Tres cortas, una larga', seen: `${B48}#a`, order: 48 },
  steps: [
    UI_IN,
    LEND,
    at0('signal', 0),
    { world: { to: 'o2_senal', dur: 4 }, async: true },
    { camera: { to: 'faro', offset: [0, -160], zoom: 0.9, dur: 3, ease: 'inOut' } },
    {
      call: (c) => {
        if (c.skipping) return;
        // the keys alone (YONOSE TODO «Solo las teclas», a variation) — held for her answer (h48_encendida)
        if (cueBest(['yonose_todo.ambient'], { fadeIn: 3 })) c.own(() => (c.replay || G.s.missions.active.includes('H48') ? audioApi.release(3) : releaseSoon(15000)));
      },
    },
    { wait: 1 },
    // three short, one long: not a lantern's rhythm. A thread of light goes straight up
    { drive: { id: 'signal', to: 1, dur: 0.05 } },
    { wait: 3.4 },
    { fx: { id: 'aim', angle: OUTWARD } },
    { camera: { to: 'faro', offset: [0, -760], zoom: 0.6, dur: 3.5, ease: 'inOut' }, async: true },
    { say: { beat: B48, lines: [0, 1] } },
    { camera: { to: 'faro', offset: [0, -120], zoom: 1, dur: 2.5, ease: 'inOut' }, async: true },
    { say: { beat: B48, lines: [2] } },
    { persist: { beat: `${B48}#a` } },
    // a long pause before the question
    { wait: 2.6 },
    { ui: { skip: false } },
    {
      call: async (c) => {
        if (c.replay || c.skipping) return;
        const { offerLinterna } = await import('../../app/oleada2Flow');
        await offerLinterna({ scene: true });
      },
    },
  ],
};

export const H48_ENCENDIDA: CineScript = {
  id: 'h48_encendida',
  stage: 'island',
  releaseBlend: 2,
  replay: { title: 'Más derecha que nunca', seen: `${B48}#b`, order: 48.1 },
  steps: [
    UI_IN,
    LEND,
    at0('signal', 1),
    { world: { to: 'o2_senal', dur: 1.5 }, async: true },
    { camera: { to: 'faro', offset: [0, -140], zoom: 1.05, dur: 2, ease: 'inOut' } },
    {
      call: (c) => {
        if (c.skipping) return;
        window.clearTimeout(senalMusicT);
        if (audioApi.currentTrack()?.startsWith('yonose_todo.') || cueBest(['yonose_todo.ambient'], { fadeIn: 2 })) c.own(() => audioApi.release(4));
      },
    },
    // she wipes the glass with her sleeve: the light comes out straighter than ever
    { fx: { id: 'ignite' } },
    { drive: { id: 'signal', to: 0.5, dur: 1.2 } },
    { fx: { id: 'aim', angle: OUTWARD } },
    { say: { beat: B48, lines: [3], onLine: { 0: { call: (c) => void (!c.skipping && linternaBassIn()), after: 0.4 } } } },
    { say: { beat: B48, lines: [4] } },
    { persist: { beat: `${B48}#b` } },
    { call: (c) => void (!c.replay && unlockO2(['yonose_todo.ambient'])) },
    { wait: 1.5 },
  ],
};

export const H49_HORNO: CineScript = {
  id: 'h49_horno',
  stage: 'island',
  releaseBlend: 1.5,
  replay: { title: 'El horno del cielo', seen: `${B49}#a`, order: 49 },
  steps: [
    UI_IN,
    LEND,
    at0('corona', 1),
    at0('tilt', 0),
    { world: { to: 'o2_masa', dur: 3 }, async: true },
    // the memory of the primordials (WHEN I LOSE «Voces de tinta», a variation)
    { call: (c) => void cueOwned(c, ['when_i_lose.ambient'], { fadeIn: 3 }) },
    { camera: { to: 'home', offset: [320, -1560], zoom: 0.6, dur: 3, ease: 'inOut' } },
    // the whole city leans: crumbs, balls and a distracted cat roll toward the biggest oven; the oven breathes
    { drive: { id: 'tilt', to: 1, dur: 4, ease: 'inOut' }, reduced: { drive: { id: 'tilt', to: 1, dur: 1.2 } } },
    { fx: { id: 'shake', k: 0.1 }, reduced: 'skip' },
    { wait: 1.6 },
    { say: { beat: B49, lines: [0] } },
    { say: { beat: B49, lines: [1, 2] } },
    { persist: { beat: `${B49}#a` } },
    { wait: 0.4 },
  ],
};

/** part c: behind the seam, a hand of light with a pencil; CONTINUARÁ */
const MANO: Step[] = [
  { camera: { to: 'home', offset: [60, -1180], zoom: 0.55, dur: 2.4, ease: 'inOut' }, async: true },
  { world: { to: { seam: 1, starFall: 0.3, stars: 0.3, sky: 0.25, vignette: 0.35 }, dur: 2.4 } },
  { call: (c) => void (!c.skipping && stingerOr(['titiriteros'], 'titiriteros')) },
  show(mano),
  { wait: 5.4 },
  { say: { beat: B49, lines: [4, 5] } },
  { fx: { id: 'card', title: 'CONTINUARÁ', sub: 'LA ERA ASTRAL' } },
  { call: (c) => void (!c.skipping && motif('arco_pregunta')), after: 0.9 },
  { wait: 4.5 },
  { persist: { beat: `${B49}#c` } },
  { persist: { beat: B49 } },
  { call: (c) => void (!c.replay && unlockO2(['when_i_lose.aftermath'])) },
  { audio: { state: 'island', fade: 4 } },
];

export const H49_COSTURA: CineScript = {
  id: 'h49_costura',
  stage: 'island',
  releaseBlend: 2,
  replay: { title: 'Sin peso un segundo', seen: `${B49}#b`, order: 49.1 },
  steps: [
    UI_IN,
    LEND,
    { camera: { to: 'home', offset: [0, -60], zoom: 0.78, dur: 2, ease: 'inOut' } },
    { say: { beat: B49, lines: [3] } },
    // the sky goes without weight for a second: silence; stones, stars and cats lift
    { audio: { state: 'silence', fade: 0.6 } },
    { call: () => o2Sky()?.floatPebbles(true) },
    {
      parallel: [
        { drive: { id: 'pebbles', from: 0, to: 1, dur: 0.6, ease: 'out' } },
        { actor: { who: 'all', do: 'hop' } },
        { fx: { id: 'burst', n: 30, dur: 1.2, far: 20 }, reduced: { fx: { id: 'burst', n: 10, dur: 1.2, far: 6 } } },
      ],
    },
    { wait: 1.4 },
    { drive: { id: 'pebbles', to: 0, dur: 0.8, ease: 'in' }, async: true },
    // and a seam shows in the sky
    { persist: { beat: `${B49}#b` } },
    ...MANO,
  ],
  finish: () => o2Sky()?.floatPebbles(false),
};

export const H49_CONTINUARA: CineScript = {
  id: 'h49_continuara',
  stage: 'island',
  releaseBlend: 2,
  replay: { title: 'Continuará', seen: `${B49}#c`, order: 49.2 },
  steps: [UI_IN, LEND, { audio: { state: 'silence', fade: 1 } }, ...MANO],
};

// ================================================================== REGION scenes (named points/fx/drives from the island)
export const H42_ARRIBA: CineScript = {
  id: 'h42_arriba',
  stage: 'region',
  releaseBlend: 1,
  replay: { title: 'Arriba de las nubes', seen: `${B42}#b`, order: 42.1, region: 'invertidas' },
  steps: [
    UI_IN,
    { drive: { id: 'tromba', from: 0, to: 0, dur: 0 } },
    { drive: { id: 'wobble', from: 0, to: 0, dur: 0 } },
    // under the sea of clouds, looking up at the island's roots
    { camera: { to: 'below', yaw: 0.6, pitch: 0.05, dist: 60, dur: 0 } },
    { call: (c) => void cueOwned(c, ['hemkade.ambient'], { fadeIn: 2.5 }) },
    { call: (c) => void (!c.skipping && stingerOr('tromba')) },
    // the waterspout climbs, and the camera rides it up
    { drive: { id: 'tromba', to: 1, dur: 4, ease: 'inOut' }, async: true, reduced: { drive: { id: 'tromba', to: 1, dur: 1.2 } } },
    { camera: { to: 'rise', yaw: 0.9, pitch: 0.08, dist: 44, dur: 5, ease: 'inOut' } },
    { fx: { id: 'shake', k: 0.25 }, reduced: 'skip' },
    // out among the hanging islands; the river falls UP
    { camera: { to: 'vista', yaw: -0.5, pitch: 0.2, dist: 96, dur: 5, ease: 'inOut' } },
    // your ship, held up only by the waterspout, wobbling
    { camera: { to: 'ship', yaw: 0.9, pitch: 0.22, dist: 24, dur: 3, ease: 'inOut' } },
    { drive: { id: 'wobble', to: 1, dur: 1.5 }, async: true },
    { say: { beat: B42, lines: [3, 4] } },
    { persist: { beat: `${B42}#b` } },
    { wait: 0.4 },
  ],
  finish: (c) => {
    const st = c.stage as CineStage;
    st.drive?.('tromba', 1, c);
  },
};

export const H43_HELICE: CineScript = {
  id: 'h43_helice',
  stage: 'region',
  releaseBlend: 1,
  replay: { title: 'Una mecánica baja del cielo', seen: `${B43}#a`, order: 43, region: 'invertidas' },
  steps: [
    UI_IN,
    { drive: { id: 'tromba', from: 1, to: 1, dur: 0 } },
    // the city's music box far below her voice (CIRCUS MALUS «Cajita de música» at −12 dB: it anticipates the city)
    {
      call: (c) => {
        if (cueOwned(c, ['circus_malus.explore'], { fadeIn: 2 })) duckOwned(c, 12, 'o2_kit');
      },
    },
    { camera: { to: 'ship', yaw: 2.2, pitch: 0.42, dist: 30, dur: 2.2, ease: 'inOut' } },
    // down the waterspout on an umbrella-propeller, onto your deck
    { fx: { id: 'helice', do: 'descend' } },
    { camera: { to: 'deck', yaw: 2.4, pitch: 0.42, dist: 12, dur: 4, ease: 'inOut' } },
    { wait: 0.4 },
    { say: { beat: B43, lines: [0, 1] } },
    // the blueprint, taped to the mast
    { fx: { id: 'blueprint' } },
    { call: (c) => void (!c.skipping && stingerOr('kit_vuelo')) },
    { camera: { to: 'mast', yaw: 0.6, pitch: 0.18, dist: 10, dur: 2.2, ease: 'inOut' }, async: true },
    { say: { beat: B43, lines: [2, 3] } },
    { persist: { beat: `${B43}#a` } },
    { wait: 0.4 },
  ],
  finish: (c) => {
    c.stage.fx({ id: 'helice', do: 'land' }, c);
    c.stage.fx({ id: 'blueprint', instant: true }, c);
  },
};

export const H45_CIUDAD: CineScript = {
  id: 'h45_ciudad',
  stage: 'region',
  releaseBlend: 1,
  replay: { title: 'Calles perfectas', seen: `${B45}#b`, order: 45.1, region: 'corona' },
  steps: [
    UI_IN,
    { camera: { to: 'avenue', yaw: 0, pitch: 0.12, dist: 18, dur: 0 } },
    { call: (c) => void (!c.skipping && stingerOr('ronroneo')) },
    // perfect streets, all the way to the ring of identical cats purring in unison
    { camera: { to: 'fountain', yaw: 0.15, pitch: 0.3, dist: 26, dur: 6, ease: 'inOut' }, reduced: { camera: { to: 'fountain', yaw: 0.15, pitch: 0.3, dist: 26, dur: 0 } } },
    { say: { beat: B45, lines: [2] } },
    { camera: { to: 'ring', yaw: 1.2, pitch: 0.2, dist: 13, dur: 4, ease: 'inOut' }, async: true },
    { call: (c) => void (!c.skipping && stingerOr('ronroneo')) },
    { say: { beat: B45, lines: [3] } },
    // down at the pier: Hélice comes out of the basement, wrench in hand and her bag packed. She waits at her door
    // (heliceHold, while the camera is still on the ring) and the shot is low and close (PULIDO 2026-10-10: the old
    // high one at 14 m found her wherever she had wandered, a speck on white paving)
    { fx: { id: 'heliceHold' } },
    { camera: { to: 'helice', yaw: 0.9, pitch: 0.24, dist: 8, dur: 3, ease: 'inOut' } },
    { fx: { id: 'helicePack' } },
    { wait: 0.8 },
    { say: { beat: B45, lines: [4] } },
    { persist: { beat: `${B45}#b` } },
    { call: (c) => void (!c.replay && unlockO2(['circus_malus.explore'])) },
    { wait: 0.4 },
  ],
};

export const H45_REGISTRO: CineScript = {
  id: 'h45_registro',
  stage: 'region',
  releaseBlend: 1,
  replay: { title: 'Una línea nueva', seen: `${B45}#c`, order: 45.2, region: 'corona' },
  steps: [
    UI_IN,
    // pull back from h45_ciudad's close shot of Hélice (dist 8): held there, a walking cat crossed the near plane as a
    // giant blurred sprite under the dialogue (QA-RECORRIDO 2026-10-10)
    { camera: { to: 'fountain', yaw: 0.15, pitch: 0.3, dist: 26, dur: 2.4, ease: 'inOut' }, async: true, reduced: { camera: { to: 'fountain', yaw: 0.15, pitch: 0.3, dist: 26, dur: 0 } } },
    // the music steps back; REGISTRO 000's out-of-tune music box; a system line types itself in static
    { call: (c) => duckOwned(c, 14, 'o2_registro') },
    { wait: 0.9 },
    {
      parallel: [
        { call: (c) => void (!c.skipping && stingerOr('registro_000')) },
        { fx: { id: 'banner', text: 'REGISTRO 000 · LÍNEA NUEVA', sub: '«VISTO: CORONA CELESTE.»', hold: 4.2 } },
        { fx: { id: 'shake', k: 0.12 }, at: 0.3, reduced: 'skip' },
      ],
    },
    { wait: 3.6 },
    { say: { beat: B45, lines: [5] } },
    { persist: { beat: `${B45}#c` } },
    { wait: 0.3 },
  ],
};

export const H46_EMBAJADA: CineScript = {
  id: 'h46_embajada',
  stage: 'region',
  releaseBlend: 1,
  replay: { title: 'La embajada', seen: `${B46}#a`, order: 46, region: 'corona' },
  steps: [
    UI_IN,
    { camera: { to: 'embassy', yaw: -0.5, pitch: 0.24, dist: 32, dur: 3, ease: 'inOut' } },
    // the one tower that doesn't purr: the whole city falls silent and turns to it
    { fx: { id: 'hush', secs: 9 } },
    { call: (c) => duckOwned(c, 8, 'o2_embajada') },
    { camera: { to: 'door', yaw: -0.3, pitch: 0.12, dist: 12, dur: 2.4, ease: 'inOut' } },
    // a white cat with no face; a bow too perfect
    { fx: { id: 'bow' } },
    { say: { beat: B46, lines: [0] } },
    show(folleto),
    { call: (c) => void (!c.skipping && motif('correccion')) },
    { wait: 1.8 },
    { actor: { who: 'canelo', do: 'emote', arg: 'attack' } },
    { fx: { id: 'float', text: '¡GRRR!' } },
    { say: { beat: B46, lines: [1, 2] } },
    { persist: { beat: `${B46}#a` } },
    { wait: 0.3 },
  ],
};

export const O2_CINES: CineScript[] = [
  H42_TROMBAS,
  H42_ARRIBA,
  H43_HELICE,
  H43_AEROBARCO,
  H44_CASCADA,
  H44_GRAVEDAD,
  H45_CORONA,
  H45_CIUDAD,
  H45_REGISTRO,
  H46_EMBAJADA,
  H46_RONRON,
  H47_GALEON,
  H47_ORDENES,
  H47_ESCAMA,
  H48_SENAL,
  H48_ENCENDIDA,
  H49_HORNO,
  H49_COSTURA,
  H49_CONTINUARA,
];
for (const s of O2_CINES) registerCine(s);

/** fx ids the O2 island scenes expect their stage to handle (tests) */
export const O2_FX_IDS: FxCmd['id'][] = ['aim', 'ignite', 'shake', 'burst', 'card', 'banner', 'float', 'hush', 'bow', 'helice', 'blueprint', 'helicePack'];
