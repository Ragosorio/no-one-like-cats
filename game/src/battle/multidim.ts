/**
 * Parte III · the MULTIDIMENSIONAL powers (agent PODERES, 2026-10-28). The owner: «que sus poderes también sean únicos,
 * y muy poderosos (porque por algo son multidimensionales)». Design: docs/part-iii/mecanicas-v2/07-poderes-multidimensionales.md.
 *
 * Each of the 25 Multidimensional cats brings ONE power: its ultimate becomes a signature of its own (MD_ULTS, keyed by
 * species), stronger than any legendary / mythic one (structure cap 45 %, bosses 18 %), and most of them leave a rule
 * on the field for a few turns (the luck, the night, the flow, the eras, the sleep, the swirl, the bill…).
 *
 * PLAYER SIDE ONLY. The same cats sail as enemies (élites, captains, rosters: EMIAU, Bigotón, Ovillo, Estambre, Sir
 * Simón); there they keep their old generic ultimate, so no story battle changes. A power only wakes in YOUR crew
 * (side 0 — makeBattle always puts the player there): mdOn(). Every rule below is created by a power, so with no
 * Multidimensional of yours in the fight every hook is a no-op (tests/multidimPowers.test.ts checks it, battle by battle).
 *
 * Pure and deterministic (no Math.random, no rng draws of its own): the battle screen and the honest estimate agree.
 * Per-battle state lives in a WeakMap (the mareo.ts / multiverso.ts pattern); sim.ts calls the small hooks:
 *   fire()          mdAtkMul · mdShot · MD_ULTS + budget · mdPaths (Homiau's luck) · mdEcho (Gato Malo's flow) · mdAfterFire
 *   resolvePaths()  mdEaten (Sonrisa's grin swallows a shot)
 *   resolveImpact() mdCellMul (Noir's colorless ship, Gatoconda's cabin)
 *   integrate()     the 'swirl' well (Van Gato) spins instead of pulling
 *   hitCat()        mdDodge · mdAff · mdCatMul · mdAfterHit (sleep, panic) · mdChain (Sir Simón's chains)
 *   startTurn()     mdStartTurn (clocks, eras, the transformation, the bill)
 *   canUlt()        mdSilenced (EMIAU) · extraShots() mdExtraShots (2099)
 */
import type { Battle, BattleEvent, PathPoint, ShotPath, Well } from './sim';
import { CAT_K, DMG_K } from './sim';
import { CELL } from './ship';
import type { Cell } from './ship';
import type { CatState, ShotDef, StatusApply } from './types';
import { clamp, collapse, cut, holdsShip, landing, normal, shipSpan, shipTop } from './ults';
import type { UltCtx, UltFn } from './ults';
import { lateCellMul } from './bossLate';
import { p2Night, p2SetNight } from './multiverso';
// after the Parte III: the 60 post Multidimensionals' powers and their rules (battle/multidimPost, agent PODERES-2)
import { mdpAfterFire, mdpAfterHit, mdpCatMul, mdpCellMul, mdpChips, mdpDodge, mdpFeats, mdpShot, mdpStartTurn, mdpWorth, postUlts } from './multidimPost/hooks';
export { mdAbsorb, mdAfterShot, mdAltPaths, mdBench, mdFire, mdHitAdjust, mdImpact, mdMeterMul } from './multidimPost/hooks';

/** switches and caps (tests flip `on` to prove the enemy side is untouched) */
export const MD_TUNE = {
  on: true,
  /** structure a power may erase in one go (legendary 35 %, Singularidad / Astraprima 40 %) */
  frac: 0.45,
  /** …against a boss (every other ultimate: 15 %) */
  bossFrac: 0.18,
};

// ------------------------------------------------------------------ state
/** an effect's clock: `now` = on during this turn; `next` = how many more turns, counted at its clock side's turn starts */
interface Timer {
  now: boolean;
  next: number;
}
const T0 = (): Timer => ({ now: false, next: 0 });
function tick(t: Timer) {
  t.now = t.next > 0;
  if (t.now) t.next--;
}
const on = (t: Timer | undefined) => !!t && (t.now || t.next > 0);

/** Tailor Swift's tour: the eras, one per turn */
export const ERAS = [
  { id: 'fearless', name: 'ERA FEARLESS', note: 'TODOS TUS TIROS PEGAN x1.3', color: 0xf2c14e },
  { id: 'red', name: 'ERA RED', note: 'TUS TIROS DEJAN ARDIENDO', color: 0xe0303a },
  { id: '1989', name: 'ERA 1989', note: 'TU TRIPULACIÓN +25 % DE BARRA', color: 0x8fd3f4 },
  { id: 'reputation', name: 'ERA REPUTATION', note: 'TUS TIROS DEJAN MALDITO', color: 0x2a2a2a },
  { id: 'midnights', name: 'ERA MIDNIGHTS', note: 'SU TRIPULACIÓN QUEDA ECLIPSADA', color: 0x3b4a8f },
] as const;

interface MdState {
  /** Homiau's SUERTE DE SOFÁ: misses counted per side (-1 = off); the 1st, 3rd, 5th… bounce back and hit */
  luck: [number, number];
  /** Gato Malo's FLOW (owner clock): every cat shot brings its echo */
  flow: [Timer, Timer];
  /** Tailor Swift's ERAS: the owner, the next era to play, the era of this turn (-1 none) */
  eras: { side: number; next: number; now: number } | null;
  /** Billie's LULLABY: sleeping cats (the stun they were given); a hit wakes them */
  asleep: Map<CatState, number>;
  /** Comecroquetas' POWER PELLET: that side's cats are frightened (owner clock): take ×2, deal ×0.5 */
  scared: [Timer, Timer];
  /** Gato Araña Noir's RAINY NIGHT: that side has no colors (owner clock): everything hits it super effective */
  noir: [Timer, Timer];
  /** El Gritito's PANIC (owner clock): the first hit each of their cats takes stuns it */
  panic: { side: number; t: Timer; hit: Set<CatState> } | null;
  /** Sir Simón's CHAINS on that side (owner clock): what one cat takes, the others take half */
  chains: [Timer, Timer];
  chaining: boolean;
  /** J. J. Gatemson's THREAT (owner clock): that cat takes ×1.5 */
  threat: Map<CatState, Timer>;
  /** EMIAU's MIC DROP on that side (its own clock): no ultimates */
  silence: [Timer, Timer];
  /** Super Siamés already transformed (×1.5 for the rest of the battle) */
  super: Set<CatState>;
  /** Gato Araña 2099: extra cat shots next turn / this turn */
  extraNext: [number, number];
  extraNow: [number, number];
  /** Maneki's BILL: the payer side, turns left of theirs, open (counting), what they owe, and who collects */
  bill: { payer: number; left: number; open: boolean; owed: number; by: CatState } | null;
  /** Garbancito: nobody can hit him (enemy clock) */
  ghost: Map<CatState, Timer>;
  /** La Gatoconda: her cabin and she take half (enemy clock) */
  gaze: Map<CatState, Timer>;
  /** Doctor Ovillo's arms: modules held (view / chips only; their effect is applied at the grab) */
  grabs: { side: number; module: number; turns: number }[];
  /** Sonrisa's grin: projectiles it can still swallow */
  bites: Map<Well, number>;
  /** Príncipe Bigotón knocked out his rival: the ultimate comes back (applied after fire's bookkeeping) */
  refund: Set<CatState>;
  /** player feats of this battle (counters, like multiverso.ts) */
  feats: Record<string, number>;
}
const STATE = new WeakMap<Battle, MdState>();
function S(b: Battle): MdState {
  let s = STATE.get(b);
  if (!s) {
    s = {
      luck: [-1, -1],
      flow: [T0(), T0()],
      eras: null,
      asleep: new Map(),
      scared: [T0(), T0()],
      noir: [T0(), T0()],
      panic: null,
      chains: [T0(), T0()],
      chaining: false,
      threat: new Map(),
      silence: [T0(), T0()],
      super: new Set(),
      extraNext: [0, 0],
      extraNow: [0, 0],
      bill: null,
      ghost: new Map(),
      gaze: new Map(),
      grabs: [],
      bites: new Map(),
      refund: new Set(),
      feats: {},
    };
    STATE.set(b, s);
  }
  return s;
}
function feat(b: Battle, side: number, k: string, n = 1) {
  if (side !== 0 || n <= 0) return;
  const f = S(b).feats;
  f[k] = (f[k] ?? 0) + n;
}
/** what the powers did this battle (player side): md_<species> casts and a few counters */
export function mdFeats(b: Battle): Record<string, number> {
  return { ...S(b).feats, ...mdpFeats(b) };
}

// ------------------------------------------------------------------ gate
/** this cat's ultimate is its Multidimensional power: a Multidimensional species, in the PLAYER's crew */
export function mdOn(b: Battle, c: CatState | null | undefined): boolean {
  return !!c && MD_TUNE.on && c.side === 0 && !c.def.ultKey && Object.prototype.hasOwnProperty.call(MD_ULTS, c.def.catId);
}

// ------------------------------------------------------------------ helpers
const INFO = 0xf59ac0;
function info(ev: BattleEvent[], text: string, x: number, y: number, color = INFO, path = -1, at = 0) {
  ev.push({ k: 'info', text, x, y, color, path, at });
}
/**
 * the three that also sail as enemies keep their old ultimate damage in especies.json (70 / 75: the enemy's generic
 * ultimate must not move); their POWER is scaled up to the Multidimensional 100 here, like the other 22
 */
const MD_DMG_FIX: Record<string, number> = { e_ovillo: 100 / 70, e_sirsimon: 100 / 70, e_estambre: 100 / 75 };
/** the power's unit of strength: the ultimate's multiplier (attack × PW ≈ the same for every Multidimensional) */
const PW = (o: UltCtx) => o.shot.power * (MD_DMG_FIX[o.cat.def.catId] ?? 1);
const alive = (b: Battle, side: number) => b.sides[side].cats.filter((c) => !c.ko && !b.isFlying(c));
const isBossCaptain = (b: Battle, c: CatState) => b.cfg.boss?.side === c.side && b.cfg.boss.captain === c.def.uid;
/** a stun of `n` (2 = loses its next turn); a boss captain shakes it off after one turn */
function stun(b: Battle, c: CatState, n: number) {
  c.stunned = Math.max(c.stunned, isBossCaptain(b, c) ? Math.min(n, 2) : n);
}
const hurtable = (b: Battle, side: number, c: Cell) => lateCellMul(b, side, c) > 0;
/** the power's set piece (the view stamps the name in the universe's color and plays the cat's own effect) */
function stamp(b: Battle, o: UltCtx, x: number, y: number, n = 0) {
  o.events.push({ k: 'ultfx', fx: 'md', side: 1 - o.side, x, y, n, uid: o.cat.def.catId, path: 0, at: 0 });
  feat(b, o.side, `md_${o.cat.def.catId}`);
}
/** module value for the powers that pick (cabins only count with a cat inside) */
function modValue(b: Battle, side: number, id: number, table: Record<string, number>) {
  const m = b.sides[side].ship.modules[id];
  if (m.kind === 'catroom') return b.sides[side].cats.some((c) => c.room === id && !c.ko) ? table.catroom ?? 1 : 1;
  return table[m.kind] ?? 1;
}
function bestModules(b: Battle, side: number, n: number, table: Record<string, number>) {
  const s = b.sides[side];
  return s.ship.modules
    .filter((m) => m.alive && s.ship.moduleCells(m.id).length)
    .sort((a, z) => modValue(b, side, z.id, table) - modValue(b, side, a.id, table) || a.id - z.id)
    .slice(0, n);
}
/** world y of the top of the column under world x on `side`'s ship (the waterline when the column is empty) */
function surfaceY(b: Battle, side: number, x: number) {
  const s = b.sides[side];
  const gx = b.toGrid(side, x, s.setup.origin.y).x;
  for (let y = 0; y < s.ship.rows; y++) if (s.ship.get(gx, y)) return s.setup.origin.y + y * CELL;
  return b.waterY;
}
/** a straight run of points ~`step` px apart from a to z (a excluded) */
function line(a: PathPoint, z: PathPoint, step = 11): PathPoint[] {
  const n = Math.max(1, Math.round(Math.hypot(z.x - a.x, z.y - a.y) / step));
  return Array.from({ length: n }, (_, i) => ({ x: a.x + ((z.x - a.x) * (i + 1)) / n, y: a.y + ((z.y - a.y) * (i + 1)) / n }));
}
/** a parabolic hop from a to z with apex `h` px above the higher end (a excluded) */
function hop(a: PathPoint, z: PathPoint, h: number, step = 11): PathPoint[] {
  const len = Math.hypot(z.x - a.x, z.y - a.y) + h;
  const n = Math.max(4, Math.round(len / step));
  return Array.from({ length: n }, (_, i) => {
    const t = (i + 1) / n;
    return { x: a.x + (z.x - a.x) * t, y: a.y + (z.y - a.y) * t - 4 * h * t * (1 - t) };
  });
}
/**
 * a hand-drawn path over `side`'s enemy ship: an impact where it enters each enemy cell (once per cell), or only at the
 * listed points (`at`, indices into pts). Owner = the shooter.
 */
function drawn(b: Battle, side: number, pts: PathPoint[], el: ShotDef['element'], kind: ShotDef['trajectory'], at?: number[]): ShotPath {
  const impacts: number[] = [];
  if (at) impacts.push(...at.filter((i) => i > 0 && i < pts.length));
  else {
    const seen = new Set<Cell>();
    pts.forEach((p, i) => {
      const hit = b.cellAt(p.x, p.y);
      if (!hit || hit.side === side || seen.has(hit.cell)) return;
      seen.add(hit.cell);
      impacts.push(i);
    });
  }
  return { points: pts, element: el, kind, impacts, owners: impacts.map(() => side) };
}
/** prepend a lead-in (from the cat to where the real flight starts) to an integrated path */
function lead(p: ShotPath, pre: PathPoint[]): ShotPath {
  const k = pre.length;
  return { ...p, points: [...pre, ...p.points], impacts: p.impacts.map((i) => i + k), jumps: p.jumps?.map((i) => i + k), seal: p.seal !== undefined ? p.seal + k : undefined };
}
/** glue a return leg onto a path (Murciégato's rangs) */
function glue(a: ShotPath, z: ShotPath): ShotPath {
  const k = a.points.length - 1;
  return { ...a, points: [...a.points, ...z.points.slice(1)], impacts: [...a.impacts, ...z.impacts.map((i) => i + k)], owners: [...(a.owners ?? []), ...(z.owners ?? [])] };
}
const lastAt = (p: ShotPath) => (p.impacts.length ? p.impacts[p.impacts.length - 1] : p.points.length - 1);

// ------------------------------------------------------------------ the 25 powers
export const MD_ULTS: Record<string, UltFn> = {
  // ---------------------------------------------------------------- Homiau Gatson · DONUT OF DESTINY!
  // A giant donut falls from the sky where you aimed and bounces four times across their ship; from then on, SUERTE DE
  // SOFÁ: one of every two missed shots of your crew bounces off the water and hits anyway.
  x_homiau(b, o) {
    const enemy = 1 - o.side;
    const span = shipSpan(b, enemy);
    const tgt = landing(b, o);
    const dir = o.side === 0 ? 1 : -1;
    const x0 = clamp(tgt.x, span.x0, span.x1);
    const far = dir > 0 ? span.x1 : span.x0;
    const room = Math.abs(far - x0);
    const xs = [0, 1, 2, 3].map((k) => clamp(room >= CELL * 6 ? x0 + (dir * k * room) / 3 : x0 - dir * k * CELL * 3, span.x0, span.x1));
    const lands = xs.map((x) => ({ x, y: surfaceY(b, enemy, x) + CELL * 0.5 }));
    const pts: PathPoint[] = [{ x: lands[0].x - dir * 90, y: -260 }];
    pts.push(...line(pts[0], lands[0], 14));
    const at = [pts.length - 1];
    for (let i = 1; i < lands.length; i++) {
      pts.push(...hop(lands[i - 1], lands[i], 170 - i * 30));
      at.push(pts.length - 1);
    }
    stamp(b, o, lands[0].x, lands[0].y);
    const donut: ShotDef = { ...o.shot, id: 'md_donut', element: 'earth', trajectory: 'ballistic', projectiles: 1, radius: CELL * 2.1, pierce: 0, power: PW(o) * 0.7, statuses: [] };
    const p = drawn(b, o.side, pts, 'earth', 'ballistic', at);
    for (const i of at) o.events.push({ k: 'ultfx', fx: 'mdHop', side: enemy, x: pts[i].x, y: pts[i].y, path: 0, at: i });
    b.resolvePaths(o.side, donut, o.atk, [p], o.events);
    const st = S(b);
    if (st.luck[o.side] < 0) st.luck[o.side] = 0;
    return [p];
  },

  // ---------------------------------------------------------------- Gato Araña · TELARAÑAZO!
  // Four web balls over their cabins and cannons, then the net covers the whole ship: everything Rooted, their cannons
  // stuck and every cat of theirs ENREDADO (loses its next turn).
  x_gatarana(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const dir = o.side === 0 ? 1 : -1;
    const aims: PathPoint[] = alive(b, enemy).map((c) => b.roomCenter(enemy, c.room));
    for (const m of es.ship.modules) if (m.kind === 'cannon' && m.alive && es.ship.moduleCells(m.id).length) aims.push(b.roomCenter(enemy, m.id));
    const span = shipSpan(b, enemy);
    for (let i = 0; aims.length < 4; i++) aims.push({ x: span.x0 + ((i + 0.5) / 4) * (span.x1 - span.x0), y: b.waterY });
    aims.splice(4);
    const ctr = b.shipCenter(enemy);
    stamp(b, o, ctr.x, ctr.y);
    const web: ShotDef = { ...o.shot, id: 'md_web', element: 'nature', trajectory: 'ballistic', projectiles: 1, radius: CELL * 1.6, pierce: 0, power: PW(o) * 0.4, statuses: [{ id: 'rooted', turns: 2 }] };
    const paths = aims.map((t, i) => b.integrate(web, { x: t.x - dir * 50, y: -220 - i * 50 }, Math.PI / 2 - dir * 0.05, 520, 0, o.side));
    b.resolvePaths(o.side, web, o.atk, paths, o.events);
    const at = lastAt(paths[0]);
    const cells = es.ship.cells();
    for (const c of cells) if (!c.status.burning) c.status.rooted = Math.max(c.status.rooted ?? 0, 1);
    o.events.push({ k: 'status', side: enemy, cells, status: 'rooted' });
    for (const m of es.ship.modules) if (m.kind === 'cannon') m.disabled = Math.max(m.disabled, 2);
    o.events.push({ k: 'ultfx', fx: 'mdNet', side: enemy, x: ctr.x, y: ctr.y, path: 0, at });
    for (const c of alive(b, enemy)) {
      stun(b, c, 2);
      const p = b.roomCenter(enemy, c.room);
      info(o.events, '¡ENREDADO!', p.x, p.y - 90, 0xffffff, 0, at);
    }
    return paths;
  },

  // ---------------------------------------------------------------- Murciégato · NIGHT SHIFT!
  // Lights out: three fishbone-rangs at their best targets that hit going AND coming back, and the night stays: their
  // crew is ECLIPSED 2 turns (no preview, no crits, they aim far worse) and your crew's shots fly unseen and stab.
  x_murciegato(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const aims: PathPoint[] = alive(b, enemy).map((c) => b.roomCenter(enemy, c.room));
    const core = es.ship.modules.find((m) => m.kind === 'core' && m.alive);
    if (core) aims.push(b.roomCenter(enemy, core.id));
    const ctr = b.shipCenter(enemy);
    while (aims.length < 3) aims.push({ x: ctr.x + (aims.length - 1) * CELL * 2, y: ctr.y });
    aims.splice(3);
    stamp(b, o, ctr.x, ctr.y);
    const rang: ShotDef = { ...o.shot, id: 'md_rang', element: 'shadow', trajectory: 'beam', projectiles: 1, radius: CELL * 1.1, pierce: 2, power: PW(o) * 0.3, gravityScale: 0.02, windScale: 0, statuses: [] };
    const paths = aims.map((t, i) => {
      const from = { x: o.origin.x, y: o.origin.y - i * 14 };
      const out = b.integrate(rang, from, Math.atan2(t.y - from.y, t.x - from.x), 1250, 0, o.side);
      const end = out.points[out.points.length - 1];
      const back = b.integrate({ ...rang, pierce: 1 }, end, Math.atan2(from.y - end.y, from.x - end.x), 1250, 0, o.side);
      const p = glue(out, back);
      // …and home: the rang comes back to his paw
      p.points.push(...line(p.points[p.points.length - 1], from, 14));
      return p;
    });
    b.resolvePaths(o.side, rang, o.atk, paths, o.events);
    p2SetNight(b, o.side, 3);
    es.buffs.blind = Math.max(es.buffs.blind, 2);
    o.events.push({ k: 'ultfx', fx: 'mdNight', side: enemy, x: ctr.x, y: shipTop(b, enemy), n: 2, path: 0, at: lastAt(paths[0]) });
    return paths;
  },

  // ---------------------------------------------------------------- Super Siamés · NINE LIVES WAVE!
  // A giant wave dead straight through the WHOLE ship along the deck of their core (every cell in its way, Ardiendo).
  // TRANSFORMATION (passive, once): when he or your ship drops under half, he turns SUPER at the start of your turn —
  // heals 35 %, full meter (the wave comes back if spent) and hits ×1.5 for the rest of the battle (wider wave too).
  x_supersiames(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const sup = S(b).super.has(o.cat);
    const span = shipSpan(b, enemy);
    const core = es.ship.modules.find((m) => m.kind === 'core' && m.alive);
    const y = core ? b.roomCenter(enemy, core.id).y : b.shipCenter(enemy).y;
    const sx = o.side === 0 ? span.x0 - CELL * 3 : span.x1 + CELL * 3;
    stamp(b, o, (span.x0 + span.x1) / 2, y, sup ? 1 : 0);
    const wave: ShotDef = { ...o.shot, id: 'md_kame', trajectory: 'ray', projectiles: 1, pierce: 60, radius: CELL * (sup ? 2.2 : 1.5), power: PW(o) * 0.42, pierceMul: 0.7, gravityScale: 0, windScale: 0, statuses: [{ id: 'burning', turns: 2 }] };
    const rows = sup ? [-1, 0, 1] : [-0.5, 0.5];
    const paths = rows.map((k) => {
      const start = { x: sx, y: y + k * CELL };
      const p = b.integrate(wave, start, o.side === 0 ? 0 : Math.PI, 1300, 0, o.side);
      return lead(p, [o.origin, ...line(o.origin, start, 16)]);
    });
    b.resolvePaths(o.side, wave, o.atk, paths, o.events);
    return paths;
  },

  // ---------------------------------------------------------------- Harry Gatter · WHISKER WAND!
  // Three spells written in the air: ¡EXPELLIARMIAU! (their cannons disarmed 2 turns), ¡DESMAYUS! (their strongest cat
  // faints: loses its next turn) and ¡BOMBARDA! (a homing spell into their core: big blast, Maldito).
  x_harrygatter(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const ctr = b.shipCenter(enemy);
    stamp(b, o, ctr.x, ctr.y);
    for (const m of es.ship.modules) {
      if (m.kind !== 'cannon' || !m.alive) continue;
      m.disabled = Math.max(m.disabled, 3);
      const p = b.roomCenter(enemy, m.id);
      info(o.events, '¡EXPELLIARMIAU!', p.x, p.y - 70, 0xd4a92a, 0, 0);
    }
    const rival = alive(b, enemy).sort((a, z) => z.def.atk - a.def.atk || z.hp - a.hp)[0];
    const paths: ShotPath[] = [];
    const desm: ShotDef = { ...o.shot, id: 'md_desmayus', trajectory: 'beam', projectiles: 1, radius: CELL * 0.9, pierce: 0, power: PW(o) * 0.25, gravityScale: 0.02, windScale: 0, statuses: [] };
    if (rival) {
      const t = b.roomCenter(enemy, rival.room);
      paths.push(b.integrate(desm, o.origin, Math.atan2(t.y - o.origin.y, t.x - o.origin.x), 1300, 0, o.side));
      b.resolvePaths(o.side, desm, o.atk, paths, o.events);
    }
    const bomb: ShotDef = { ...o.shot, id: 'md_bombarda', trajectory: 'homing', projectiles: 1, radius: CELL * 2.2, pierce: 0, power: PW(o) * 1.2, statuses: [{ id: 'cursed', turns: 2 }] };
    const bp = b.integrate(bomb, { x: o.origin.x, y: o.origin.y - 20 }, o.angle, o.power, o.wind, o.side);
    b.resolvePaths(o.side, bomb, o.atk, [bp], o.events, paths.length);
    if (rival && !rival.ko) {
      const at = lastAt(paths[0]);
      b.hitCat(rival, Math.round(o.atk * PW(o) * 0.35 * CAT_K), o.events, 0, at, 'magic', true);
      if (!rival.ko) stun(b, rival, 2);
      o.events.push({ k: 'ultfx', fx: 'mdSpell', side: enemy, x: b.roomCenter(enemy, rival.room).x, y: b.roomCenter(enemy, rival.room).y, n: 1, path: 0, at });
    }
    const bAt = lastAt(bp);
    o.events.push({ k: 'ultfx', fx: 'mdSpell', side: enemy, x: bp.points[bAt].x, y: bp.points[bAt].y, n: 2, path: paths.length, at: bAt });
    paths.push(bp);
    return paths;
  },

  // ---------------------------------------------------------------- Gato Malo · TOPE SUICIDA!
  // He dives off the top rope onto the cabin of the cat nearest to where you aimed (a huge slam: the cats there are
  // stunned), and then EL FLOW: your next 3 turns, every cat shot of your crew comes with its echo (a second shot, ×0.5).
  x_gatomalo(b, o) {
    const enemy = 1 - o.side;
    const dir = o.side === 0 ? 1 : -1;
    const tgt = landing(b, o);
    const victim = alive(b, enemy).sort((a, z) => Math.hypot(b.roomCenter(enemy, a.room).x - tgt.x, b.roomCenter(enemy, a.room).y - tgt.y) - Math.hypot(b.roomCenter(enemy, z.room).x - tgt.x, b.roomCenter(enemy, z.room).y - tgt.y))[0];
    const t = victim ? b.roomCenter(enemy, victim.room) : { x: clamp(tgt.x, shipSpan(b, enemy).x0, shipSpan(b, enemy).x1), y: b.shipCenter(enemy).y };
    stamp(b, o, t.x, t.y);
    const top = { x: t.x - dir * 140, y: -200 };
    const slam: ShotDef = { ...o.shot, id: 'md_tope', element: 'sound', trajectory: 'ballistic', projectiles: 1, radius: CELL * 2.6, pierce: 1, power: PW(o) * 1.0, statuses: [] };
    const fall = b.integrate(slam, top, Math.atan2(t.y - top.y, t.x - top.x), 900, 0, o.side);
    const p = lead(fall, [o.origin, ...hop(o.origin, top, 160, 16)]);
    b.resolvePaths(o.side, slam, o.atk, [p], o.events);
    S(b).flow[o.side].next = 3;
    o.events.push({ k: 'ultfx', fx: 'mdFlow', side: o.side, x: o.origin.x, y: o.origin.y, n: 3, path: 0, at: lastAt(p) });
    return [p];
  },

  // ---------------------------------------------------------------- Tailor Swift · NEW ERA!
  // Three waves in a fan (they stun), and the tour begins: your next 5 turns are five eras, one each — FEARLESS (all your
  // shots ×1.3), RED (they set fire), 1989 (+25 % meter to the crew), REPUTATION (they curse), MIDNIGHTS (they're eclipsed).
  x_tailorswift(b, o) {
    const enemy = 1 - o.side;
    const ctr = b.shipCenter(enemy);
    stamp(b, o, ctr.x, ctr.y);
    const wave: ShotDef = { ...o.shot, trajectory: 'wave', projectiles: 1, power: PW(o) * 0.45 };
    const paths = [-1, 0, 1].map((k) => b.integrate(wave, o.origin, o.angle + k * 0.06, o.power, o.wind, o.side));
    b.resolvePaths(o.side, wave, o.atk, paths, o.events);
    S(b).eras = { side: o.side, next: 0, now: -1 };
    return paths;
  },

  // ---------------------------------------------------------------- Billie Bigotish · LULLABY!
  // A whisper crosses their ship and every cat of theirs falls ASLEEP for 2 turns — deaf and sound cats too (a whisper
  // isn't noise). A sleeping cat wakes up when it's hit: choose what you hit.
  x_billiebigotish(b, o) {
    const enemy = 1 - o.side;
    const ctr = b.shipCenter(enemy);
    stamp(b, o, ctr.x, ctr.y);
    const whisper: ShotDef = { ...o.shot, trajectory: 'wave', projectiles: 1, power: PW(o) * 0.35 };
    const paths = normal(b, o, whisper);
    const at = lastAt(paths[0]);
    const st = S(b);
    for (const c of alive(b, enemy)) {
      const n = isBossCaptain(b, c) ? 2 : 3;
      c.stunned = Math.max(c.stunned, n);
      st.asleep.set(c, c.stunned);
      const p = b.roomCenter(enemy, c.room);
      o.events.push({ k: 'ultfx', fx: 'mdSleep', side: enemy, x: p.x, y: p.y, uid: c.def.uid, path: 0, at });
    }
    return paths;
  },

  // ---------------------------------------------------------------- Vincent van Gato · STARRY SWIRL!
  // He paints the starry night over their ship: eleven stars fall in a spiral (light that pierces), and the SWIRL stays
  // over them 2 turns: every shot of theirs that crosses it gets spun around.
  x_vangato(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const dir = o.side === 0 ? 1 : -1;
    const ctr = b.shipCenter(enemy);
    const w = es.ship.cols * CELL;
    const h = es.ship.rows * CELL;
    stamp(b, o, ctr.x, shipTop(b, enemy) - CELL * 2);
    const star: ShotDef = { ...o.shot, id: 'md_star', element: 'light', trajectory: 'ray', projectiles: 1, pierce: 2, radius: CELL * 1.0, power: PW(o) * 0.24, gravityScale: 0, windScale: 0, statuses: [] };
    const paths: ShotPath[] = [];
    for (let i = 0; i < 11; i++) {
      const u = Math.sqrt((i + 0.5) / 11);
      const a = i * 2.39996;
      const t = { x: ctr.x + Math.cos(a) * u * w * 0.45, y: ctr.y + Math.sin(a) * u * h * 0.4 };
      const from = { x: t.x - dir * 180, y: -160 - (i % 3) * 40 };
      paths.push(b.integrate(star, from, Math.atan2(t.y - from.y, t.x - from.x), 1200, 0, o.side));
    }
    b.resolvePaths(o.side, star, o.atk, paths, o.events);
    b.wells.push({ x: ctr.x, y: shipTop(b, enemy) - CELL * 2.5, r: 460, k: 2600, turns: 2, owner: o.side, affects: enemy, kind: 'swirl' });
    return paths;
  },

  // ---------------------------------------------------------------- Comecroquetas · POWER PELLET!
  // WAKA: he eats his way through their ship like a maze (along a deck, down, back, down, along: every cell he crosses),
  // and their cats turn into blue ghosts: until your turn after next, your hits on them do ×2 and theirs do ×0.5.
  e_comecroquetas(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const span = shipSpan(b, enemy);
    const oy = es.setup.origin.y;
    const rowCount = (y: number) => es.ship.cells().filter((c) => c.y === y).length;
    let r1 = 0;
    while (r1 < es.ship.rows - 1 && rowCount(r1) < es.ship.cols * 0.5) r1++;
    const r2 = Math.min(es.ship.rows - 1, r1 + 2);
    const r3 = Math.min(es.ship.rows - 1, r2 + 2);
    const yOf = (r: number) => oy + r * CELL + CELL / 2;
    const near = o.side === 0 ? span.x0 - CELL : span.x1 + CELL;
    const far = o.side === 0 ? span.x1 + CELL * 0.4 : span.x0 - CELL * 0.4;
    const near2 = o.side === 0 ? span.x0 - CELL * 0.4 : span.x1 + CELL * 0.4;
    const corners: PathPoint[] = [
      { x: near, y: yOf(r1) },
      { x: far, y: yOf(r1) },
      { x: far, y: yOf(r2) },
      { x: near2, y: yOf(r2) },
      { x: near2, y: yOf(r3) },
      { x: far + (o.side === 0 ? CELL * 2 : -CELL * 2), y: yOf(r3) },
    ];
    const pts: PathPoint[] = [o.origin, ...hop(o.origin, corners[0], 120, 14)];
    for (let i = 1; i < corners.length; i++) pts.push(...line(corners[i - 1], corners[i], 9));
    stamp(b, o, (span.x0 + span.x1) / 2, yOf(r2));
    const waka: ShotDef = { ...o.shot, id: 'md_waka', element: 'neutral', trajectory: 'phase', projectiles: 1, radius: CELL * 1.4, pierce: 0, power: PW(o) * 0.5, pierceMul: 0.45, statuses: [] };
    const p = drawn(b, o.side, pts, 'neutral', 'phase');
    b.resolvePaths(o.side, waka, o.atk, [p], o.events);
    const st = S(b);
    st.scared[enemy] = { now: true, next: 1 };
    const at = lastAt(p);
    for (const c of alive(b, enemy)) {
      const q = b.roomCenter(enemy, c.room);
      o.events.push({ k: 'ultfx', fx: 'mdGhost', side: enemy, x: q.x, y: q.y, uid: c.def.uid, path: 0, at });
    }
    return [p];
  },

  // ---------------------------------------------------------------- Príncipe Bigotón · PRIDE FLASH!
  // Palms together: a huge double beam straight at the cabin of their strongest cat — his «rival» — through everything
  // in between (Ardiendo); the rival takes the flash in full (×2, shields broken). If it falls: «¡te dejé ganar!» — the
  // flash comes back (another use, half a meter).
  l_bigoton(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const rival = alive(b, enemy).sort((a, z) => z.def.atk - a.def.atk || z.hp - a.hp)[0];
    const core = es.ship.modules.find((m) => m.kind === 'core' && m.alive);
    const t = rival ? b.roomCenter(enemy, rival.room) : core ? b.roomCenter(enemy, core.id) : b.shipCenter(enemy);
    stamp(b, o, t.x, t.y);
    const beam: ShotDef = { ...o.shot, id: 'md_flash', element: 'fire', trajectory: 'ray', projectiles: 1, pierce: 14, radius: CELL * 1.8, power: PW(o) * 0.45, pierceMul: 0.8, gravityScale: 0, windScale: 0, statuses: [{ id: 'burning', turns: 2 }] };
    const ang = Math.atan2(t.y - o.origin.y, t.x - o.origin.x);
    const nx = -Math.sin(ang) * CELL * 0.45;
    const ny = Math.cos(ang) * CELL * 0.45;
    const paths = [-1, 1].map((k) => b.integrate(beam, { x: o.origin.x + nx * k, y: o.origin.y + ny * k }, ang, 1400, 0, o.side));
    b.resolvePaths(o.side, beam, o.atk, paths, o.events);
    if (rival && !rival.ko) {
      const at = lastAt(paths[0]);
      rival.shields = 0;
      b.hitCat(rival, Math.round(o.atk * PW(o) * 0.9 * CAT_K), o.events, 0, at, 'fire', true);
      o.events.push({ k: 'ultfx', fx: 'mdRival', side: enemy, x: t.x, y: t.y, n: rival.ko ? 1 : 0, uid: rival.def.uid, path: 0, at });
      if (rival.ko) S(b).refund.add(o.cat);
    }
    return paths;
  },

  // ---------------------------------------------------------------- Doctor Ovillo · TANGLE TIME!
  // Four mechanical arms grab their four most valuable modules and squeeze: a cannon can't fire for 2 turns, a cabin's
  // cat is held 2 turns (loses them), the core / shield / summoning room is left Maldito (×1.5).
  e_ovillo(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const ctr = b.shipCenter(enemy);
    stamp(b, o, ctr.x, ctr.y);
    const mods = bestModules(b, enemy, 4, { cannon: 10, catroom: 9, shield: 7, arcane: 7, core: 6, powder: 5, mast: 2, engine: 2 });
    const yarn: ShotDef = { ...o.shot, id: 'md_brazo', element: 'earth', trajectory: 'ballistic', projectiles: 1, radius: CELL * 1.2, pierce: 0, power: PW(o) * 0.45, statuses: [] };
    const paths = mods.map((m, i) => {
      const t = b.roomCenter(enemy, m.id);
      const from = { x: o.origin.x, y: o.origin.y - 10 - i * 12 };
      const pts = [from, ...hop(from, t, 240 + i * 50, 14)];
      return drawn(b, o.side, pts, 'earth', 'ballistic', [pts.length - 1]);
    });
    b.resolvePaths(o.side, yarn, o.atk, paths, o.events);
    const st = S(b);
    mods.forEach((m, i) => {
      const at = lastAt(paths[i]);
      const p = b.roomCenter(enemy, m.id);
      if (!m.alive) return;
      st.grabs.push({ side: enemy, module: m.id, turns: 2 });
      o.events.push({ k: 'ultfx', fx: 'mdGrab', side: enemy, x: p.x, y: p.y, n: i, path: i, at });
      if (m.kind === 'cannon') m.disabled = Math.max(m.disabled, 3);
      else if (m.kind === 'catroom') {
        const cat = es.cats.find((c) => c.room === m.id && !c.ko && !b.isFlying(c));
        if (cat) stun(b, cat, 3);
      } else {
        const cells = es.ship.moduleCells(m.id);
        for (const c of cells) c.status.cursed = Math.max(c.status.cursed ?? 0, 2);
        if (cells.length) o.events.push({ k: 'status', side: enemy, cells, status: 'cursed' });
      }
    });
    return paths;
  },

  // ---------------------------------------------------------------- El Estambre · YARNSTORM!
  // The yarn becomes a giant fist that drills through 8 cells (each one left frayed: Maldito ×1.5), and he rolls himself
  // back up: heals half his life and wraps 2 layers of yarn around him (2 shields).
  e_estambre(b, o) {
    const tgt = landing(b, o);
    stamp(b, o, tgt.x, tgt.y);
    const fist: ShotDef = { ...o.shot, id: 'md_puno', element: 'earth', trajectory: 'heavy', projectiles: 1, pierce: 8, radius: CELL * 1.8, power: PW(o) * 0.9, pierceMul: 0.9, statuses: [{ id: 'cursed', turns: 2 }] };
    const paths = normal(b, o, fist);
    const me = o.cat;
    const heal = Math.min(me.maxHp - me.hp, Math.round(me.maxHp * 0.5));
    me.hp += heal;
    me.shields += 2;
    const p = b.roomCenter(o.side, me.room);
    o.events.push({ k: 'ultfx', fx: 'mdReform', side: o.side, x: p.x, y: p.y, n: heal, uid: me.def.uid, path: 0, at: lastAt(paths[0]) });
    return paths;
  },

  // ---------------------------------------------------------------- Gato Araña Noir · RAINY NIGHT!
  // The world goes black and white: rain soaks their whole ship, three grey webs land unseen (Sombra stabs), and their
  // ship and cats lose their colors this turn and your next: everything hits them super effective (×1.5).
  r_gatarana_noir(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const ctr = b.shipCenter(enemy);
    stamp(b, o, ctr.x, ctr.y);
    b.wetCells(enemy, es.ship.cells(), o.events);
    const paths = normal(b, o, { ...o.shot, power: PW(o) * 0.6 });
    S(b).noir[enemy] = { now: true, next: 1 };
    o.events.push({ k: 'ultfx', fx: 'mdNoir', side: enemy, x: ctr.x, y: ctr.y, path: 0, at: lastAt(paths[0]) });
    return paths;
  },

  // ---------------------------------------------------------------- Gata Araña · BALLET DROP!
  // She drops on a thread over their ship and swings from end to end like a pendulum, drumming through everything it
  // touches; every cabin she crosses is ATURDIDO — deaf and sound cats too (drums aren't heard: they're felt).
  r_gatarana_blanca(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const span = shipSpan(b, enemy);
    const ctr = b.shipCenter(enemy);
    const dir = o.side === 0 ? 1 : -1;
    // the swing: from high over their near end, down through the cabins of their cats (in order along the ship, at
    // most 4), and up again past the far end — a pendulum on a thread, sampled as a smooth curve
    const top = shipTop(b, enemy);
    const cabins = alive(b, enemy)
      .map((c) => b.roomCenter(enemy, c.room))
      .sort((a, z) => dir * (a.x - z.x))
      .slice(0, 4);
    const knots: PathPoint[] = [{ x: dir > 0 ? span.x0 - CELL * 2 : span.x1 + CELL * 2, y: top - CELL * 3 }, ...(cabins.length ? cabins : [ctr]), { x: dir > 0 ? span.x1 + CELL * 2 : span.x0 - CELL * 2, y: top - CELL * 3 }];
    const arc: PathPoint[] = [knots[0]];
    for (let i = 0; i < knots.length - 1; i++) {
      const p0 = knots[Math.max(0, i - 1)];
      const p1 = knots[i];
      const p2 = knots[i + 1];
      const p3 = knots[Math.min(knots.length - 1, i + 2)];
      const n = Math.max(6, Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 9));
      for (let k = 1; k <= n; k++) {
        const t = k / n;
        const t2 = t * t;
        const t3 = t2 * t;
        const f = (a: number, b1: number, c: number, d: number) => 0.5 * (2 * b1 + (-a + c) * t + (2 * a - 5 * b1 + 4 * c - d) * t2 + (-a + 3 * b1 - 3 * c + d) * t3);
        arc.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) });
      }
    }
    const pts: PathPoint[] = [o.origin, ...hop(o.origin, arc[0], 160, 14), ...arc.slice(1)];
    stamp(b, o, ctr.x, ctr.y);
    const swing: ShotDef = { ...o.shot, id: 'md_pendulo', element: 'sound', trajectory: 'wave', projectiles: 1, radius: CELL * 1.2, pierce: 0, power: PW(o) * 0.7, pierceMul: 0.55, statuses: [] };
    const p = drawn(b, o.side, pts, 'sound', 'wave');
    // the cabins she swings through (checked BEFORE the blows, while the cells are all there)
    const crossed = new Set<CatState>();
    for (const c of alive(b, enemy)) {
      const m = es.ship.modules[c.room];
      if (p.impacts.some((i) => {
        const g = b.toGrid(enemy, pts[i].x, pts[i].y);
        return g.x >= m.x && g.x < m.x + m.w && g.y >= m.y && g.y < m.y + m.h;
      }))
        crossed.add(c);
    }
    b.resolvePaths(o.side, swing, o.atk, [p], o.events);
    const at = lastAt(p);
    for (const c of crossed) {
      if (c.ko) continue;
      stun(b, c, 2);
      const q = b.roomCenter(enemy, c.room);
      info(o.events, '¡PLIÉ! ATURDIDO', q.x, q.y - 90, 0xf6f6f6, 0, at);
    }
    return [p];
  },

  // ---------------------------------------------------------------- Gato Araña 2099 · NEON CLAW!
  // Three neon claw slashes cross their ship diagonally from top to bottom (everything in their way, Cargado), and
  // from 2099: on your next turn, two more cats of yours get to shoot.
  r_gatarana_2099(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const ctr = b.shipCenter(enemy);
    const dir = o.side === 0 ? 1 : -1;
    stamp(b, o, ctr.x, ctr.y);
    const claw: ShotDef = { ...o.shot, id: 'md_garra', element: 'electric', trajectory: 'ray', projectiles: 1, pierce: 16, radius: CELL * 1.1, power: PW(o) * 0.4, pierceMul: 0.7, gravityScale: 0, windScale: 0, statuses: [{ id: 'charged', turns: 2 }] };
    const top = shipTop(b, enemy);
    const bottom = top + es.ship.rows * CELL;
    const paths = [-1, 0, 1].map((k) => {
      const x = ctr.x + k * CELL * 3.2 - dir * CELL * 2.5;
      const from = { x, y: top - CELL * 3 };
      const to = { x: x + dir * CELL * 5, y: bottom };
      return b.integrate(claw, from, Math.atan2(to.y - from.y, to.x - from.x), 1400, 0, o.side);
    });
    b.resolvePaths(o.side, claw, o.atk, paths, o.events);
    S(b).extraNext[o.side] = 2;
    o.events.push({ k: 'ultfx', fx: 'mdFuture', side: o.side, x: o.origin.x, y: o.origin.y, n: 2, path: 0, at: lastAt(paths[0]) });
    return paths;
  },

  // ---------------------------------------------------------------- J. J. Gatemson · FRONT PAGE!
  // Three rolled newspapers, and the front page: «¡[EL GATO] ES UNA AMENAZA!» — their cat with the most meter loses all of
  // it and is a THREAT this turn and your next (takes ×1.5); with what the paper sells, your crew gets +30 % meter.
  r_gatemson(b, o) {
    const enemy = 1 - o.side;
    const ctr = b.shipCenter(enemy);
    stamp(b, o, ctr.x, ctr.y);
    // the front page goes to their cat with the most meter (the one about to do something): three rolled papers fly
    // straight at its cabin (Cargado)
    const target = alive(b, enemy).sort((a, z) => z.ultCharge - a.ultCharge || z.def.atk - a.def.atk)[0];
    const t = target ? b.roomCenter(enemy, target.room) : ctr;
    const paper: ShotDef = { ...o.shot, id: 'md_periodico', trajectory: 'beam', projectiles: 1, pierce: 1, radius: CELL * 1.2, power: PW(o) * 0.45, gravityScale: 0.05, windScale: 0 };
    const paths = [-1, 0, 1].map((k) => {
      const from = { x: o.origin.x, y: o.origin.y - 20 + k * 16 };
      return b.integrate(paper, from, Math.atan2(t.y + k * CELL * 0.4 - from.y, t.x - from.x), 1200, 0, o.side);
    });
    b.resolvePaths(o.side, paper, o.atk, paths, o.events);
    const at = lastAt(paths[1]);
    if (target && !target.ko) {
      target.ultCharge = 0;
      S(b).threat.set(target, { now: true, next: 1 });
      o.events.push({ k: 'ultfx', fx: 'mdHeadline', side: enemy, x: t.x, y: t.y, uid: target.def.uid, path: 1, at });
    }
    for (const a of b.sides[o.side].cats) if (!a.ko && a !== o.cat) a.ultCharge = Math.min(1, a.ultCharge + 0.3);
    return paths;
  },

  // ---------------------------------------------------------------- Gatzilla · KAIJU NAP!
  // He lies down on top of their ship: the whole deck is crushed (the top of every column, and what's under it takes
  // half), the cats up there get squashed, and his weight sinks them (2 breaches: they flood). Then he naps: a turn more
  // than his reload before he shoots again.
  l_gatzilla(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const span = shipSpan(b, enemy);
    const top = shipTop(b, enemy);
    const dir = o.side === 0 ? 1 : -1;
    const head = { x: dir > 0 ? span.x0 : span.x1, y: top - CELL * 5 };
    const tail = { x: dir > 0 ? span.x1 : span.x0, y: top - CELL * 0.5 };
    const pts: PathPoint[] = [o.origin, ...hop(o.origin, head, 260, 16), ...line(head, tail, 12)];
    const p: ShotPath = { points: pts, element: 'earth', kind: 'heavy', impacts: [], owners: [] };
    const at = pts.length - 1;
    stamp(b, o, (span.x0 + span.x1) / 2, top);
    const P = o.atk * PW(o);
    const byCol = new Map<number, Cell[]>();
    for (const c of es.ship.cells()) {
      const list = byCol.get(c.x) ?? [];
      list.push(c);
      byCol.set(c.x, list);
    }
    const squashed = new Set<CatState>();
    for (const list of [...byCol.entries()].sort((a, z) => a[0] - z[0]).map((e) => e[1])) {
      list.sort((a, z) => a.y - z.y);
      list.slice(0, 2).forEach((c, k) => {
        if (!hurtable(b, enemy, c)) return;
        cut(b, enemy, c, P * (k ? 0.35 : 0.7) * DMG_K, o.events, 0, at);
        if (c.module !== undefined) {
          const cat = es.cats.find((q) => q.room === c.module && !q.ko && !b.isFlying(q));
          if (cat) squashed.add(cat);
        }
      });
    }
    collapse(b, enemy, o.events, 0, at);
    for (const c of squashed) b.hitCat(c, Math.round(P * 0.4 * CAT_K), o.events, 0, at, 'earth', true);
    es.breaches += 2;
    es.flood = Math.min(0.95, es.flood + 0.15);
    o.events.push({ k: 'flood', side: enemy, flood: es.flood, breaches: es.breaches });
    o.events.push({ k: 'ultfx', fx: 'mdCrush', side: enemy, x: (span.x0 + span.x1) / 2, y: top, path: 0, at });
    // the nap: he snores one turn more than his reload (his limitation, like Raijin's overheat)
    o.cat.stunned = Math.max(o.cat.stunned, (o.cat.def.reload ?? 0) + 2);
    const me = b.roomCenter(o.side, o.cat.room);
    info(o.events, 'ZZZ… GATZILLA SE ECHA UNA SIESTA', me.x, me.y - 120, 0x9fd6a0, 0, at);
    return [p];
  },

  // ---------------------------------------------------------------- EMIAU · MIC DROP!
  // Eight bars at full speed — eight short waves, one at each of their best modules, through every wall (they stun) —
  // and he drops the mic: SIN RÉPLICA, their cats can't use their ultimates for their next 2 turns.
  l_emiau(b, o) {
    const enemy = 1 - o.side;
    const ctr = b.shipCenter(enemy);
    stamp(b, o, ctr.x, ctr.y);
    const mods = bestModules(b, enemy, 8, { catroom: 10, cannon: 8, core: 7, shield: 6, arcane: 6, powder: 5, mast: 3, engine: 3 });
    const aims: PathPoint[] = mods.map((m) => b.roomCenter(enemy, m.id));
    for (let i = 0; aims.length < 8; i++) aims.push(aims[i % Math.max(1, mods.length)] ?? ctr);
    const bar: ShotDef = { ...o.shot, id: 'md_barra', element: 'sound', trajectory: 'wave', projectiles: 1, pierce: 6, radius: CELL * 0.9, power: PW(o) * 0.2, gravityScale: 0, windScale: 0 };
    const paths = aims.map((t, i) => {
      const from = { x: o.origin.x, y: o.origin.y - 30 + (i % 4) * 14 };
      return b.integrate(bar, from, Math.atan2(t.y - from.y, t.x - from.x), 1300, 0, o.side);
    });
    b.resolvePaths(o.side, bar, o.atk, paths, o.events);
    S(b).silence[enemy].next = 2;
    o.events.push({ k: 'ultfx', fx: 'mdMicDrop', side: enemy, x: ctr.x, y: shipTop(b, enemy), n: 2, path: 0, at: lastAt(paths[0]) });
    return paths;
  },

  // ---------------------------------------------------------------- El Gritito · PANIC WAVE!
  // A scream so long it bends the sky: one huge wave crosses their ship at the deck where most of their cats are (it
  // stuns), and the PANIC spreads: this turn and your next, the first hit each of their cats takes stuns it too (¡AAAH!)
  // — deaf and sound cats included.
  c_gritito(b, o) {
    const enemy = 1 - o.side;
    const span = shipSpan(b, enemy);
    const ys = alive(b, enemy).map((c) => b.roomCenter(enemy, c.room).y);
    const cnt = (v: number) => ys.filter((k) => Math.abs(k - v) < CELL).length;
    const y = ys.length ? [...ys].sort((a, z) => cnt(z) - cnt(a) || a - z)[0] : b.shipCenter(enemy).y;
    const sx = o.side === 0 ? span.x0 - CELL * 3 : span.x1 + CELL * 3;
    stamp(b, o, (span.x0 + span.x1) / 2, y);
    const scream: ShotDef = { ...o.shot, id: 'md_grito', element: 'sound', trajectory: 'wave', projectiles: 1, pierce: 60, radius: CELL * 1.6, power: PW(o) * 0.8, gravityScale: 0, windScale: 0 };
    const start = { x: sx, y };
    const p = lead(b.integrate(scream, start, o.side === 0 ? 0 : Math.PI, 1100, 0, o.side), [o.origin, ...line(o.origin, start, 14)]);
    b.resolvePaths(o.side, scream, o.atk, [p], o.events);
    S(b).panic = { side: enemy, t: { now: true, next: 1 }, hit: new Set() };
    return [p];
  },

  // ---------------------------------------------------------------- La Gatoconda · SFUMATO!
  // Three slow gazes that bounce, and her eyes follow you: their next 2 turns, every shot of theirs is drawn toward HER
  // cabin, and she and her cabin take half (the sfumato blurs everything).
  e_gatoconda(b, o) {
    const enemy = 1 - o.side;
    const room = b.roomCenter(o.side, o.cat.room);
    const ctr = b.shipCenter(enemy);
    stamp(b, o, ctr.x, ctr.y);
    const paths = normal(b, o, { ...o.shot, power: PW(o) * 0.65 });
    b.wells.push({ x: room.x, y: room.y - CELL * 0.5, r: 640, k: 2600, turns: 2, owner: o.side, affects: enemy, kind: 'gaze' });
    S(b).gaze.set(o.cat, { now: false, next: 2 });
    o.events.push({ k: 'ultfx', fx: 'mdGaze', side: o.side, x: room.x, y: room.y, uid: o.cat.def.uid, path: 0, at: lastAt(paths[0]) });
    return paths;
  },

  // ---------------------------------------------------------------- Sonrisa · VANISHING GRIN!
  // She vanishes but for her grin: three bites ERASE their three best modules — never the core — (BORRADO, never
  // repaired; the cells holding the ship stay at 1), and the grin stays floating in front of your ship 2 turns: it
  // swallows up to 3 of their shots.
  e_sonrisa(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const ctr = b.shipCenter(enemy);
    stamp(b, o, ctr.x, ctr.y);
    // never the core: a bite there plus the volley that follows would end any fight on the spot
    const mods = bestModules(b, enemy, 3, { core: -1, catroom: 8, cannon: 7, shield: 6, arcane: 6, powder: 6, mast: 3, engine: 3 }).filter((m) => m.kind !== 'core');
    const erased: Cell[] = [];
    mods.forEach((m, i) => {
      const mc = b.roomCenter(enemy, m.id);
      o.events.push({ k: 'ultfx', fx: 'mdBite', side: enemy, x: mc.x, y: mc.y, n: i, path: 0, at: 0 });
      const cells = es.ship
        .moduleCells(m.id)
        .map((c) => ({ c, d: Math.hypot(b.cellCenter(enemy, c.x, c.y).x - mc.x, b.cellCenter(enemy, c.x, c.y).y - mc.y) }))
        .sort((a, z) => a.d - z.d || a.c.y - z.c.y || a.c.x - z.c.x)
        .slice(0, 4)
        .map((k) => k.c);
      for (const c of cells) {
        if (c.hp <= 0 || !hurtable(b, enemy, c)) continue;
        c.status = { voided: 99 };
        erased.push(c);
        const raw = holdsShip(es.ship, c) ? c.hp - 1 : c.hp;
        if (raw > 0) cut(b, enemy, c, raw, o.events, 0, 0);
      }
    });
    const left = erased.filter((c) => c.hp > 0);
    if (left.length) o.events.push({ k: 'status', side: enemy, cells: left, status: 'voided' });
    collapse(b, enemy, o.events, 0, 0);
    const own = b.sides[o.side];
    const front = own.setup.flip ? own.setup.origin.x - CELL * 2.5 : own.setup.origin.x + own.ship.cols * CELL + CELL * 2.5;
    const w: Well = { x: front, y: shipTop(b, o.side) - CELL * 2, r: 380, k: 1500, turns: 2, owner: o.side, affects: enemy, kind: 'grin', eat: CELL * 2.2 };
    b.wells.push(w);
    S(b).bites.set(w, 3);
    return [];
  },

  // ---------------------------------------------------------------- Sir Simón de Gatterville · CHAIN RATTLE!
  // Three invisible chain strikes (Sombra stabs), then his chains bind their crew this turn and your next — whatever one
  // of their cats takes, every other one takes half — and the STAIN THAT NEVER COMES OFF: their core stays Maldito
  // (×1.5) for the rest of the battle.
  e_sirsimon(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const ctr = b.shipCenter(enemy);
    stamp(b, o, ctr.x, ctr.y);
    const paths = normal(b, o, { ...o.shot, power: PW(o) * 0.45 });
    const at = lastAt(paths[0]);
    S(b).chains[enemy] = { now: true, next: 1 };
    const core = es.ship.modules.find((m) => m.kind === 'core' && m.alive);
    if (core) {
      const cells = es.ship.moduleCells(core.id);
      for (const c of cells) c.status.cursed = 99;
      if (cells.length) o.events.push({ k: 'status', side: enemy, cells, status: 'cursed' });
      const p = b.roomCenter(enemy, core.id);
      o.events.push({ k: 'ultfx', fx: 'mdStain', side: enemy, x: p.x, y: p.y, path: 0, at });
    }
    o.events.push({ k: 'ultfx', fx: 'mdChains', side: enemy, x: ctr.x, y: ctr.y, path: 0, at });
    return paths;
  },

  // ---------------------------------------------------------------- Garbancito · TINY BUT BRAVE!
  // Nobody sees him go (no trajectory at all): he slips into their ship and sprays their CORE from inside — every core
  // cell loses 60 % of what it has left and stays BORRADO (never repaired) — and their next 2 turns nothing can hit him.
  r_garbancito(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const core = es.ship.modules.find((m) => m.kind === 'core' && m.alive) ?? bestModules(b, enemy, 1, { catroom: 8, cannon: 7, shield: 6 })[0];
    const p = core ? b.roomCenter(enemy, core.id) : b.shipCenter(enemy);
    stamp(b, o, p.x, p.y);
    const sprayed: Cell[] = [];
    if (core) {
      for (const c of es.ship.moduleCells(core.id)) {
        if (!hurtable(b, enemy, c)) continue;
        c.status = { ...c.status, voided: 99 };
        sprayed.push(c);
        cut(b, enemy, c, Math.min(c.hp - 1, Math.max(1, Math.round(c.hp * 0.6))), o.events, 0, 0);
      }
      if (sprayed.length) o.events.push({ k: 'status', side: enemy, cells: sprayed.filter((c) => c.hp > 0), status: 'voided' });
      o.events.push({ k: 'ultfx', fx: 'mdSpray', side: enemy, x: p.x, y: p.y, path: 0, at: 0 });
    }
    collapse(b, enemy, o.events, 0, 0);
    S(b).ghost.set(o.cat, { now: false, next: 2 });
    return [];
  },

  // ---------------------------------------------------------------- Maneki · LUCKY SWEEP!
  // Three koban coins that bounce, her raised paw calls luck (+20 % meter to your crew), and NOTHING IS FREE: their next
  // 2 turns, everything they break on your side goes into her book — then they pay 80 % of it back on their best modules
  // (at most a quarter of their ship), if she's still standing.
  e_maneki(b, o) {
    const enemy = 1 - o.side;
    const ctr = b.shipCenter(enemy);
    stamp(b, o, ctr.x, ctr.y);
    const paths = normal(b, o, { ...o.shot, power: PW(o) * 0.65 });
    for (const a of b.sides[o.side].cats) if (!a.ko && a !== o.cat) a.ultCharge = Math.min(1, a.ultCharge + 0.2);
    S(b).bill = { payer: enemy, left: 2, open: false, owed: 0, by: o.cat };
    const me = b.roomCenter(o.side, o.cat.room);
    o.events.push({ k: 'ultfx', fx: 'mdBook', side: o.side, x: me.x, y: me.y, path: 0, at: lastAt(paths[0]) });
    return paths;
  },
  // ---------------------------------------------------------------- after the Parte III: the 60 post powers
  ...postUlts(),
};

// ------------------------------------------------------------------ AI
/** is THIS the moment for that power? (the player's auto-aim and the honest estimate; never asked for the enemy) */
export function mdWorth(b: Battle, c: CatState): boolean {
  const st = S(b);
  const enemy = 1 - c.side;
  const es = b.sides[enemy];
  const foes = alive(b, enemy);
  const awake = foes.filter((k) => k.stunned <= 0);
  switch (c.def.catId) {
    case 'x_gatarana':
    case 'x_billiebigotish':
      // a whole crew to tie up / put to sleep (or the fight drags on)
      return awake.length >= Math.min(2, foes.length) || b.turn >= 5;
    case 'x_murciegato':
      return !p2Night(b, c.side);
    case 'x_gatomalo':
      return !on(st.flow[c.side]);
    case 'x_tailorswift':
      return !st.eras;
    case 'x_vangato':
      return !b.wells.some((w) => w.kind === 'swirl' && w.owner === c.side);
    case 'e_sonrisa':
      return !b.wells.some((w) => w.kind === 'grin' && w.owner === c.side);
    case 'e_gatoconda':
      return !on(st.gaze.get(c));
    case 'l_gatzilla':
      return es.ship.integrity() > 0.45;
    case 'l_emiau':
      // SIN RÉPLICA is best when their meters are filling (the eight bars are worth it anyway after a while)
      return es.cats.some((k) => !k.ko && k.ultCharge >= 0.5) || b.turn >= 3;
    case 'l_bigoton':
    case 'r_gatemson':
    case 'e_comecroquetas':
    case 'e_sirsimon':
    case 'c_gritito':
    case 'r_gatarana_blanca':
      return foes.length > 0;
    case 'e_maneki':
      return !st.bill;
    case 'r_garbancito':
      return es.ship.modules.some((m) => m.kind === 'core' && m.alive);
    default:
      return mdpWorth(b, c);
  }
}

// ------------------------------------------------------------------ hooks (sim.ts)
/** fire(): attack multipliers — Super Siamés ×1.5, the FEARLESS era ×1.3 (every shot), frightened ghosts ×0.5 */
export function mdAtkMul(b: Battle, side: number, cat: CatState | undefined): number {
  const st = STATE.get(b);
  if (!st) return 1;
  let m = 1;
  if (cat && st.super.has(cat)) m *= 1.5;
  if (st.eras && st.eras.side === side && ERAS[st.eras.now]?.id === 'fearless') m *= 1.3;
  if (cat && st.scared[side].now) m *= 0.5;
  return m;
}
/** fire(): the shot itself — the RED era sets fire, REPUTATION curses (every shot of that side) */
export function mdShot(b: Battle, side: number, shot: ShotDef): ShotDef {
  shot = mdpShot(b, side, shot);
  const st = STATE.get(b);
  const era = st?.eras && st.eras.side === side ? ERAS[st.eras.now]?.id : undefined;
  if (era !== 'red' && era !== 'reputation') return shot;
  const add: StatusApply = era === 'red' ? { id: 'burning', turns: 2 } : { id: 'cursed', turns: 2 };
  return { ...shot, statuses: [...(shot.statuses ?? []).filter((s) => s.id !== add.id), add] };
}
/**
 * fire(), a cat's normal shot, before it resolves — SUERTE DE SOFÁ (Homiau): the 1st, 3rd, 5th… miss of that crew
 * bounces off the water and flies straight into the nearest cell of their ship.
 */
export function mdPaths(b: Battle, side: number, shot: ShotDef, paths: ShotPath[], ev: BattleEvent[]) {
  const st = STATE.get(b);
  if (!st || st.luck[side] < 0) return;
  const enemy = 1 - side;
  paths.forEach((p, pi) => {
    if (p.impacts.length || p.eaten) return;
    const end = p.points[p.points.length - 1];
    if (end.y < b.waterY - 4) return;
    const n = st.luck[side]++;
    if (n % 2 !== 0) return;
    const from = { x: end.x, y: b.waterY - 6 };
    const near = b.sides[enemy].ship
      .cells()
      .map((c) => ({ c, q: b.cellCenter(enemy, c.x, c.y) }))
      .sort((a, z) => Math.hypot(a.q.x - from.x, a.q.y - from.y) - Math.hypot(z.q.x - from.x, z.q.y - from.y) || a.c.y - z.c.y)[0];
    if (!near || Math.hypot(near.q.x - from.x, near.q.y - from.y) > 1200) return;
    const rb = b.integrate({ ...shot, trajectory: 'beam', projectiles: 1, pierce: 0, gravityScale: 0.02, windScale: 0 }, from, Math.atan2(near.q.y - from.y, near.q.x - from.x), 1000, 0, side);
    if (!rb.impacts.length) return;
    const k = p.points.length;
    p.points.push(...rb.points);
    p.impacts = rb.impacts.map((i) => i + k);
    p.owners = rb.owners;
    ev.push({ k: 'ultfx', fx: 'mdLuck', side: enemy, x: from.x, y: from.y, path: pi, at: k });
    feat(b, side, 'md_luck');
  });
}
/** fire(), after a cat's normal shot resolved — EL FLOW (Gato Malo): its echo, a second shot at half power */
export function mdEcho(b: Battle, side: number, shot: ShotDef, atk: number, origin: PathPoint, angle: number, power: number, wind: number, offset: number, ev: BattleEvent[]): ShotPath[] {
  const st = STATE.get(b);
  if (!st || !st.flow[side].now) return [];
  const echo: ShotDef = { ...shot, id: `${shot.id}_eco`, power: shot.power * 0.5 };
  const ps = b.buildPaths(echo, { x: origin.x, y: origin.y - 12 }, angle + (side === 0 ? -0.035 : 0.035), power, wind, side);
  b.resolvePaths(side, echo, atk, ps, ev, offset);
  ev.push({ k: 'info', text: '¡ECO!', x: origin.x, y: origin.y - 110, color: 0xff4fa3, path: offset, at: 0 });
  feat(b, side, 'md_echo');
  return ps;
}
/** fire(), after the bookkeeping — Bigotón's refund, Maneki's book */
export function mdAfterFire(b: Battle, side: number, cat: CatState | undefined, ult: boolean, ev: BattleEvent[]) {
  mdpAfterFire(b, side, cat, ult, ev);
  const st = STATE.get(b);
  if (!st) return;
  if (cat && ult && st.refund.has(cat)) {
    st.refund.delete(cat);
    cat.ultUsed = Math.max(0, cat.ultUsed - 1);
    cat.ultCharge = Math.max(cat.ultCharge, 0.5);
    const p = b.roomCenter(side, cat.room);
    info(ev, '«¡TE DEJÉ GANAR!» LA ULTI VUELVE', p.x, p.y - 130, 0x4f7bff);
  }
  const bill = st.bill;
  if (bill && bill.open && bill.payer === side) {
    for (const e of ev) {
      if (e.k === 'cell' && e.side !== side) bill.owed += e.dmg;
      else if (e.k === 'cat' && e.side !== side && !e.dot) bill.owed += e.dmg;
    }
  }
}
/** resolvePaths(): a projectile was swallowed — Sonrisa's grin counts its bites */
export function mdEaten(b: Battle, side: number, x: number, y: number) {
  const st = STATE.get(b);
  if (!st || !st.bites.size) return;
  for (const [w, n] of st.bites) {
    if (w.owner === side || Math.hypot(w.x - x, w.y - y) > (w.eat ?? 0) + 12) continue;
    if (n <= 1) {
      st.bites.delete(w);
      b.wells = b.wells.filter((k) => k !== w);
    } else st.bites.set(w, n - 1);
    return;
  }
}
/** resolveImpact(): a cell's multiplier — RAINY NIGHT (everything super effective), Gatoconda's cabin (half) */
export function mdCellMul(b: Battle, side: number, c: Cell, mult: number): number {
  mult = mdpCellMul(b, side, c, mult);
  const st = STATE.get(b);
  if (!st) return mult;
  if (st.noir[side].now) mult = Math.max(mult, 1.5);
  if (c.module !== undefined)
    for (const [cat, t] of st.gaze) if (t.now && cat.side === side && cat.room === c.module) mult *= 0.5;
  return mult;
}
/** hitCat(): Garbancito can't be hit (nobody sees him) */
export function mdDodge(b: Battle, c: CatState, ev: BattleEvent[], path: number, at: number): boolean {
  if (mdpDodge(b, c, ev, path, at)) return true;
  const st = STATE.get(b);
  const t = st?.ghost.get(c);
  if (!t?.now) return false;
  const p = b.roomCenter(c.side, c.room);
  info(ev, '¡NADIE LO VE!', p.x, p.y - 80, 0xc9b27c, path, at);
  return true;
}
/** hitCat(): affinity — a colorless crew takes everything super effective */
export function mdAff(b: Battle, c: CatState, aff: number): number {
  const st = STATE.get(b);
  return st?.noir[c.side].now ? Math.max(aff, 1.5) : aff;
}
/** hitCat(): frightened ghosts ×2, a THREAT ×1.5, La Gatoconda in her sfumato ×0.5 */
export function mdCatMul(b: Battle, c: CatState): number {
  const st = STATE.get(b);
  if (!st) return mdpCatMul(b, c);
  let m = mdpCatMul(b, c);
  if (st.scared[c.side].now) m *= 2;
  if (st.threat.get(c)?.now) m *= 1.5;
  if (st.gaze.get(c)?.now) m *= 0.5;
  return m;
}
/** hitCat(), after the damage: a sleeping cat wakes up; PANIC stuns on the first hit. Returns true if it stunned. */
export function mdAfterHit(b: Battle, c: CatState, real: number, stunned: boolean, ev: BattleEvent[], path: number, at: number): boolean {
  mdpAfterHit(b, c, real, ev, path, at);
  const st = STATE.get(b);
  if (!st || c.ko || real <= 0) return false;
  const sleep = st.asleep.get(c);
  if (sleep !== undefined) {
    st.asleep.delete(c);
    if (!stunned && c.stunned <= sleep) c.stunned = 0;
    const p = b.roomCenter(c.side, c.room);
    info(ev, '¡SE DESPERTÓ!', p.x, p.y - 80, 0x9be38a, path, at);
  }
  const pn = st.panic;
  if (pn && pn.side === c.side && pn.t.now && !pn.hit.has(c)) {
    pn.hit.add(c);
    stun(b, c, 2);
    const p = b.roomCenter(c.side, c.room);
    info(ev, '¡AAAAH! PÁNICO', p.x, p.y - 110, 0xff8a2a, path, at);
    feat(b, 1 - c.side, 'md_panic');
    return true;
  }
  return false;
}
/** hitCat(), after the event — Sir Simón's chains: every other cat of that crew takes half (never chained twice) */
export function mdChain(b: Battle, c: CatState, real: number, ev: BattleEvent[], path: number, at: number) {
  const st = STATE.get(b);
  if (!st || st.chaining || real <= 1 || !st.chains[c.side].now) return;
  st.chaining = true;
  try {
    for (const o of b.sides[c.side].cats) {
      if (o === c || o.ko || b.isFlying(o)) continue;
      b.hitCat(o, Math.round(real * 0.5), ev, path, at, 'shadow', true);
    }
  } finally {
    st.chaining = false;
  }
}
/** canUlt(): MIC DROP — that crew can't answer */
export function mdSilenced(b: Battle, side: number): boolean {
  return !!STATE.get(b)?.silence[side].now;
}
/** extraShots(): 2099 — more cats shoot this turn */
export function mdExtraShots(b: Battle, side: number): number {
  return STATE.get(b)?.extraNow[side] ?? 0;
}

/** startTurn(): every clock of the powers, the eras, the transformation and the bill */
export function mdStartTurn(b: Battle, side: 0 | 1, ev: BattleEvent[]) {
  mdpStartTurn(b, side, ev);
  const st = STATE.get(b);
  if (!st) {
    if (side === 0) superCheck(b, ev);
    return;
  }
  const foe = 1 - side;
  const ctr = b.shipCenter(side);
  // ---- clocks counted at the OWNER's turns (this side cast them)
  tick(st.flow[side]);
  if (st.flow[side].now) info(ev, `EL FLOW: CADA TIRO TRAE SU ECO (${st.flow[side].next + 1})`, ctr.x, ctr.y - 230, 0xff4fa3);
  tick(st.noir[foe]);
  tick(st.chains[foe]);
  tick(st.scared[foe]);
  for (const [c, t] of st.threat) if (c.side === foe) tick(t);
  if (st.panic && st.panic.side === foe) tick(st.panic.t);
  st.extraNow[side] = st.extraNext[side];
  st.extraNext[side] = 0;
  if (st.extraNow[side] > 0) info(ev, `¡DESDE 2099! +${st.extraNow[side]} GATOS DISPARAN ESTE TURNO`, ctr.x, ctr.y - 260, 0x35e0ff);
  // ---- clocks counted at the SUFFERING side's turns
  tick(st.silence[side]);
  if (st.silence[side].now) info(ev, 'SIN RÉPLICA: SUS GATOS NO PUEDEN USAR SU ULTI', ctr.x, ctr.y - 200, 0xe8e8e8);
  for (const [c, t] of st.ghost) if (c.side === foe) tick(t);
  for (const [c, t] of st.gaze) if (c.side === foe) tick(t);
  for (const [c] of st.asleep) if (c.side === side && (c.ko || c.stunned <= 0)) st.asleep.delete(c);
  st.grabs = st.grabs.filter((g) => g.side !== side || --g.turns > 0);
  // ---- Tailor Swift: the next era of the tour
  const er = st.eras;
  if (er && er.side === side) {
    if (er.next >= ERAS.length) {
      st.eras = null;
      info(ev, 'FIN DE LA GIRA', ctr.x, ctr.y - 230, 0xff7ab8);
    } else {
      er.now = er.next++;
      const era = ERAS[er.now];
      ev.push({ k: 'ultfx', fx: 'mdEra', side, x: ctr.x, y: ctr.y, n: er.now, path: -1, at: 0 });
      info(ev, `${era.name}: ${era.note}`, ctr.x, ctr.y - 230, era.color === 0x2a2a2a ? 0xbdbdbd : era.color);
      if (era.id === '1989') for (const c of b.sides[side].cats) if (!c.ko) c.ultCharge = Math.min(1, c.ultCharge + 0.25);
      if (era.id === 'midnights') b.sides[foe].buffs.blind = Math.max(b.sides[foe].buffs.blind, 1);
    }
  }
  // ---- Maneki's bill: open on the payer's turns, charged at the start of the collector's turn after the last one
  const bill = st.bill;
  if (bill) {
    if (bill.payer === side && bill.left > 0) {
      bill.open = true;
      bill.left--;
    } else if (bill.payer === foe && bill.open && bill.left === 0) {
      st.bill = null;
      charge(b, bill, ev);
    }
  }
  if (side === 0) superCheck(b, ev);
}

/** Super Siamés: under half (his life or your ship's) at the start of your turn → SUPER, once */
function superCheck(b: Battle, ev: BattleEvent[]) {
  if (!MD_TUNE.on) return;
  const side = 0;
  for (const c of b.sides[side].cats) {
    if (c.def.catId !== 'x_supersiames' || c.ko || c.def.ultKey) continue;
    const st = S(b);
    if (st.super.has(c)) continue;
    if (c.hp >= c.maxHp * 0.5 && b.hullBar(side) > 0.5) continue;
    st.super.add(c);
    const heal = Math.min(c.maxHp - c.hp, Math.round(c.maxHp * 0.35));
    c.hp += heal;
    c.ultCharge = 1;
    c.ultUsed = Math.max(0, Math.min(c.ultUsed, (c.def.ultimate?.limits?.usesPerBattle ?? 1) - 1));
    c.stunned = 0;
    const p = b.roomCenter(side, c.room);
    ev.push({ k: 'ultfx', fx: 'mdSuper', side, x: p.x, y: p.y, n: heal, uid: c.def.uid, path: -1, at: 0 });
    info(ev, '¡SUPER SIAMÉS! x1.5 · BARRA LLENA', p.x, p.y - 140, 0xffd23a);
    feat(b, side, 'md_super');
  }
}

/** Maneki: the bill comes due — 80 % of what they broke, on their best modules (cap: a quarter of their ship) */
function charge(b: Battle, bill: NonNullable<MdState['bill']>, ev: BattleEvent[]) {
  const side = bill.payer;
  const s = b.sides[side];
  const ctr = b.shipCenter(side);
  if (bill.by.ko) {
    info(ev, 'LA CUENTA SE PERDIÓ (MANEKI CAYÓ)', ctr.x, ctr.y - 200, 0xc9b27c);
    return;
  }
  let amount = Math.round(bill.owed * 0.8);
  ev.push({ k: 'ultfx', fx: 'mdBill', side, x: ctr.x, y: ctr.y, n: amount, path: -1, at: 0 });
  info(ev, amount > 0 ? `LA CUENTA: PAGAN ${amount}` : 'LA CUENTA: NO DEBEN NADA', ctr.x, ctr.y - 230, 0xffd23a);
  if (amount <= 0) return;
  const prev = b.budget;
  b.budget = { side, left: Math.round((s.ship.initialMax?.[0] ?? 0) * 0.25) };
  for (const m of bestModules(b, side, 6, { core: 9, catroom: 8, cannon: 7, shield: 6, arcane: 6, powder: 6, mast: 3, engine: 3 })) {
    for (const c of s.ship.moduleCells(m.id)) {
      if (amount <= 0 || c.hp <= 0 || !hurtable(b, side, c)) continue;
      const d = cut(b, side, c, Math.min(amount, c.hp), ev, -1, 0);
      if (!d) break;
      amount -= d;
    }
    if (amount <= 0 || (b.budget && b.budget.left <= 0)) break;
  }
  collapse(b, side, ev, -1, 0);
  b.budget = prev;
  feat(b, 1 - side, 'md_bill');
}

// ------------------------------------------------------------------ HUD
export interface MdChip {
  text: string;
  color: number;
  ink?: number;
  hot?: boolean;
}
/** the powers' rules on the field, for the battle HUD: [chips on their side, chips on yours] */
export function mdChips(b: Battle): [MdChip[], MdChip[]] {
  const st = STATE.get(b);
  const e: MdChip[] = [];
  const p: MdChip[] = [];
  if (!st) return mdpChips(b);
  if (st.luck[0] >= 0) p.push({ text: 'SUERTE DE SOFÁ', color: 0xffd90f });
  if (on(st.flow[0])) p.push({ text: `EL FLOW: ECO ${st.flow[0].next + (st.flow[0].now ? 1 : 0)}`, color: 0xff4fa3, hot: true });
  if (st.eras?.side === 0 && st.eras.now >= 0) p.push({ text: ERAS[st.eras.now].name, color: ERAS[st.eras.now].color, ink: st.eras.now === 3 || st.eras.now === 4 ? 0xffffff : undefined, hot: true });
  if (st.super.size) p.push({ text: 'SUPER SIAMÉS x1.5', color: 0xffd23a, hot: true });
  if (st.extraNow[0] > 0 || st.extraNext[0] > 0) p.push({ text: `2099: +${Math.max(st.extraNow[0], st.extraNext[0])} DISPAROS`, color: 0x35e0ff, hot: true });
  if (st.bill) p.push({ text: st.bill.open ? `LA CUENTA: ${st.bill.owed}` : 'LA CUENTA ABIERTA', color: 0xffd23a });
  for (const [c, t] of st.ghost) if (on(t) && c.side === 0) p.push({ text: 'GARBANCITO: NADIE LO VE', color: 0xc9b27c });
  for (const [c, t] of st.gaze) if (on(t) && c.side === 0) p.push({ text: 'SFUMATO: TE SIGUE CON LA MIRADA', color: 0x8a9a5b });
  if (b.wells.some((w) => w.kind === 'grin' && w.owner === 0)) p.push({ text: `LA SONRISA x${[...st.bites.values()].reduce((a, n) => a + n, 0)}`, color: 0xc77dff });
  const asleep = [...st.asleep.keys()].filter((c) => c.side === 1 && !c.ko).length;
  if (asleep) e.push({ text: `DORMIDOS x${asleep}`, color: 0x9be38a, hot: true });
  if (on(st.scared[1])) e.push({ text: 'FANTASMAS AZULES: x2', color: 0x2f5fff, ink: 0xffffff, hot: true });
  if (on(st.noir[1])) e.push({ text: 'SIN COLOR: TODO SÚPER EFECTIVO', color: 0xd8d8d8, hot: true });
  if (st.panic && st.panic.side === 1 && on(st.panic.t)) e.push({ text: 'PÁNICO', color: 0xff8a2a, hot: true });
  if (on(st.chains[1])) e.push({ text: 'ENCADENADOS', color: 0x8fb3c9, hot: true });
  if (on(st.silence[1])) e.push({ text: 'SIN RÉPLICA: SIN ULTI', color: 0xe8e8e8, hot: true });
  for (const [c, t] of st.threat) if (on(t) && c.side === 1 && !c.ko) e.push({ text: `AMENAZA: ${c.def.name.toUpperCase()}`, color: 0xffe14a, hot: true });
  if (st.grabs.some((g) => g.side === 1)) e.push({ text: `ENREDADOS POR OVILLO x${st.grabs.filter((g) => g.side === 1).length}`, color: 0x7ab36a });
  if (b.wells.some((w) => w.kind === 'swirl' && w.owner === 0)) e.push({ text: 'NOCHE ESTRELLADA: SUS TIROS GIRAN', color: 0xf2c14e, hot: true });
  const [pe, pp] = mdpChips(b);
  return [[...e, ...pe], [...p, ...pp]];
}
