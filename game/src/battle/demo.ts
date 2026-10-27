/**
 * Parte III · DEMOSTRACIÓN DE UNA REGLA (docs/part-iii/mecanicas-v2/02-loop.md §3, 03-plan-implementacion.md §2.3).
 *
 * The presentation before a battle teaches its rule by SHOWING it: the same shot twice — once done well, once done
 * badly — computed with the real simulator (Battle.integrate on a small fixed battle, no screen). What the film or the
 * fallback card draws is exactly what the battle does with that rule.
 *
 *   ruleDemo('mareo', cfg)     the same aim released at the CENTRE of the sway and at its EDGE (the drift is the same)
 *   ruleDemo('donas', cfg)     a shot at the hull next to the donut vs a shot that lands on the donut (it eats it)
 *   ruleDemo('botellas', cfg)  where the alley's bottles fall on your ship (the first volley)
 *
 * Pure and deterministic: fixed spec, fixed seed, no Math.random, no DOM, no save. Points are in battle-world
 * coordinates (1920 × 1080 field); `field` gives the ships' extents and the waterline so a view can frame them.
 */
import type { BattleSpec } from '../scenes/BattleScene';
import { makeBattle } from './autoplay';
import { BLUEPRINTS } from './blueprints';
import { battleCatFrom } from './catShots';
import { CELL, type ModuleKind } from './ship';
import { BOTELLA, DONA_HIT, MareoCfg, mareoDonas, mareoDraw, mzHash, swayAt } from './mareo';
import type { Battle, PathPoint } from './sim';
import { ROLE_BY_ID, catDef } from '../data/content';

export type DemoRuleId = 'mareo' | 'donas' | 'botellas';
/** where a demo shot ended: a module (by kind), plain hull, a donut, or the sea */
export type DemoLanding = 'modulo' | 'casco' | 'dona' | 'mar';

export interface DemoShot {
  /** «SUELTAS EN EL CENTRO», «SUELTAS EN EL BORDE»… (Spanish, for the view) */
  label: string;
  /** the way the rule wants you to play it */
  good: boolean;
  /** the angle it left at (radians) and its power */
  angle: number;
  power: number;
  points: PathPoint[];
  landing: DemoLanding;
  /** the module it hit (kind), when it hit one */
  module?: ModuleKind;
  /** where it ended (world) */
  x: number;
  y: number;
}
export interface RuleDemo {
  rule: DemoRuleId;
  title: string;
  /** one honest line computed from the shots (what the player should take away) */
  caption: string;
  shots: DemoShot[];
  field: { waterY: number; player: { x0: number; x1: number }; enemy: { x0: number; x1: number }; donas: { x: number; y: number }[]; target?: { x: number; y: number; kind: ModuleKind } };
}

/** the demo's fixed battle: two Gorrión-size ships, two plain cats each (the numbers don't matter, the paths do) */
const DEMO_SEED = 4242;
const POWERS = [900, 980, 1060, 1140, 1220];
function demoCat(uid: string, species: string) {
  return battleCatFrom({ uid, species, name: species, level: 10, stars: 1, dmgMul: 1, hpMul: 1 }, ROLE_BY_ID.get(catDef(species).role)?.hp ?? 100);
}
function demoSpec(mareo: MareoCfg): BattleSpec {
  return {
    player: { blueprint: BLUEPRINTS.sparrow, hpMul: 3, cats: [demoCat('p0', 'c_canelo'), demoCat('p1', 'c_gelatino')], cannonAtk: 30 },
    enemy: { blueprint: BLUEPRINTS.sparrow, hpMul: 3, cats: [demoCat('e0', 'c_brote'), demoCat('e1', 'c_musgo')], cannonAtk: 30 },
    playerName: 'Tú',
    enemyName: 'Demostración',
    difficulty: 'normal',
    rules: { mareo: JSON.parse(JSON.stringify(mareo)) },
    onEnd: () => undefined,
  };
}

function extents(b: Battle, side: number) {
  const s = b.sides[side];
  const x0 = s.setup.origin.x;
  return { x0, x1: x0 + s.ship.cols * CELL };
}

/** a path's first impact (or its last point) */
const endOf = (p: { points: PathPoint[]; impacts: number[] }) => p.points[p.impacts.length ? p.impacts[0] : p.points.length - 1];

/** what a world point is on the enemy ship: a donut, a module (by kind), plain hull, or the sea */
function classify(b: Battle, end: PathPoint, donas: { x: number; y: number }[]): { landing: DemoLanding; module?: ModuleKind } {
  if (donas.some((d) => Math.hypot(d.x - end.x, d.y - end.y) <= DONA_HIT)) return { landing: 'dona' };
  // the impact point sits on the struck cell's edge: look a few px along the flight's way in
  for (const dy of [0, 4, 10]) {
    const hit = b.cellAt(end.x, end.y + dy);
    if (hit && hit.side === 1) {
      const m = hit.cell.module !== undefined ? b.sides[1].ship.modules[hit.cell.module] : undefined;
      return m ? { landing: 'modulo', module: m.kind } : { landing: 'casco' };
    }
  }
  return { landing: 'mar' };
}

function fly(b: Battle, label: string, good: boolean, angle: number, power: number, donas: { x: number; y: number }[]): DemoShot {
  const shot = b.sides[0].cats[0].def.shot;
  const p = b.integrate(shot, b.muzzle(0, 'p0'), angle, power, 0, 0);
  const end = endOf(p);
  const c = classify(b, end, donas);
  return { label, good, angle, power, points: p.points.map((q) => ({ ...q })), landing: c.landing, module: c.module, x: Math.round(end.x), y: Math.round(end.y) };
}

/**
 * The (angle, power) whose clean flight (+ the shot's drift) lands closest to world point `t` — and, when `want` is
 * given, whose landing is of that kind. A fixed deterministic grid (no rng).
 */
function aimAt(b: Battle, t: { x: number; y: number }, drift: number, donas: { x: number; y: number }[], want?: (s: DemoShot) => boolean): { angle: number; power: number } {
  let best = { angle: -0.8, power: POWERS[0] };
  let bestD = Infinity;
  for (const power of POWERS)
    for (let a = -1.4; a <= -0.1; a += 0.004) {
      const s = fly(b, '', true, a + drift, power, donas);
      if (want && !want(s)) continue;
      const d = Math.hypot(s.x - t.x, s.y - t.y);
      if (d < bestD) {
        bestD = d;
        best = { angle: a, power };
      }
    }
  return best;
}

const DEFAULT_MAREO: MareoCfg = { sway: 4, period: 2.6, drift: 1 };
const KIND_ES: Record<ModuleKind, string> = { core: 'el núcleo', cannon: 'el cañón', catroom: 'la cabina', mast: 'el mástil', shield: 'el escudo', engine: 'el motor', powder: 'la santabárbara', arcane: 'el módulo arcano' };
const said = (s: DemoShot) => (s.landing === 'modulo' ? KIND_ES[s.module!] : s.landing === 'casco' ? 'el casco' : s.landing === 'dona' ? 'la dona' : 'el agua');
/** «a» + article («a el» → «al») */
const aDe = (t: string) => (t.startsWith('el ') ? `al ${t.slice(3)}` : `a ${t}`);

/** the demonstration of a rule (pure; the same answer every call) */
export function ruleDemo(rule: DemoRuleId, cfg: MareoCfg = DEFAULT_MAREO): RuleDemo {
  const mz: MareoCfg = rule === 'donas' && !cfg.donas ? { ...cfg, donas: { side: 1, n: 1, heal: 0.08, catHeal: 0.2 } } : rule === 'botellas' && !cfg.botellas ? { ...cfg, botellas: { side: 0, first: 1, every: 3, n: 3, power: 0.5 } } : cfg;
  const b = makeBattle(demoSpec(mz), DEMO_SEED);
  const e = extents(b, 1);
  const p = extents(b, 0);
  const donas = mareoDonas(b)
    .filter((d) => d.state === 'on')
    .map((d) => ({ x: d.x, y: d.y }));
  const field: RuleDemo['field'] = { waterY: b.cfg.waterY, player: p, enemy: e, donas };
  // the first cat shot's seeded drift (the same for every demo shot: only the rule's part changes)
  const drift = mareoDraw(b, 0, 0).drift;
  if (rule === 'mareo') {
    // the target: a module worth hitting (a cannon, else a cabin, else any)
    const mods = b.sides[1].ship.modules;
    const pick = mods.findIndex((m) => m.kind === 'cannon') >= 0 ? mods.findIndex((m) => m.kind === 'cannon') : Math.max(0, mods.findIndex((m) => m.kind === 'catroom'));
    const tgt = b.roomCenter(1, pick);
    field.target = { x: tgt.x, y: tgt.y, kind: mods[pick].kind };
    const a = aimAt(b, tgt, drift, donas, (s) => s.landing === 'modulo' && s.module === mods[pick].kind);
    const centre = fly(b, 'SUELTAS EN EL CENTRO', true, a.angle + drift, a.power, donas);
    // the edge of the sway that lands farther from the centre shot (both are honest: the caption says what it hit)
    const hi = fly(b, 'SUELTAS EN EL BORDE', false, a.angle + swayAt(mz, 0.25) + drift, a.power, donas);
    const lo = fly(b, 'SUELTAS EN EL BORDE', false, a.angle + swayAt(mz, 0.75) + drift, a.power, donas);
    const edge = Math.hypot(hi.x - centre.x, hi.y - centre.y) >= Math.hypot(lo.x - centre.x, lo.y - centre.y) ? hi : lo;
    const off = Math.round(Math.hypot(edge.x - centre.x, edge.y - centre.y));
    const caption = said(edge) === said(centre) ? `En el borde del vaivén (±${mz.sway}°) el mismo tiro cae ${off} px más allá.` : `En el centro le das ${aDe(said(centre))}. En el borde del vaivén (±${mz.sway}°), el mismo tiro cae en ${said(edge)}.`;
    return { rule, title: 'MAREO: SUELTA EN EL CENTRO', caption, shots: [centre, edge], field };
  }
  if (rule === 'donas') {
    const d = donas[0];
    // the good shot: the hull a ship-third away from the donut; the bad one: straight at the donut
    const away = d && d.x - e.x0 > (e.x1 - e.x0) / 2 ? e.x0 + (e.x1 - e.x0) * 0.25 : e.x0 + (e.x1 - e.x0) * 0.75;
    const ga = aimAt(b, { x: away, y: (d?.y ?? b.cfg.waterY - 200) + 30 }, drift, donas, (s) => s.landing === 'modulo' || s.landing === 'casco');
    const good = fly(b, 'LE DAS AL BARCO', true, ga.angle + drift, ga.power, donas);
    const ba = d ? aimAt(b, d, drift, donas, (s) => s.landing === 'dona') : ga;
    const bad = fly(b, 'LE DAS A LA DONA', false, ba.angle + drift, ba.power, donas);
    const caption = bad.landing === 'dona' ? 'Si tu tiro cae en la dona, se la come y SE CURA. Apunta al barco, no a la dona.' : 'La dona está en su cubierta: si le das, se la come y se cura.';
    return { rule, title: 'DONAS: NO LES DES', caption, shots: [good, bad], field };
  }
  // bottles: where the first volley falls on YOUR ship (the same seeded x as the battle: mareo.ts mareoStartTurn)
  const bt = mz.botellas!;
  const shots: DemoShot[] = [];
  const victim = b.sides[bt.side];
  const w = victim.ship.cols * CELL;
  for (let i = 0; i < bt.n; i++) {
    const u = (i + 0.2 + mzHash(b.cfg.seed, 0, i, 3) * 0.6) / bt.n;
    const x = victim.setup.origin.x + w * (0.08 + 0.84 * u);
    const tilt = (mzHash(b.cfg.seed, 0, i, 4) - 0.5) * 0.3;
    const path = b.integrate(BOTELLA, { x, y: -140 - i * 70 }, Math.PI / 2 + tilt, 160, 0, 1 - bt.side);
    const end = endOf(path);
    shots.push({ label: `BOTELLA ${i + 1}`, good: false, angle: Math.PI / 2 + tilt, power: 160, points: path.points.map((q) => ({ ...q })), landing: path.impacts.length && end.y < b.cfg.waterY + 4 ? 'casco' : 'mar', x: Math.round(end.x), y: Math.round(end.y) });
  }
  const onShip = shots.filter((s) => s.landing !== 'mar').length;
  return { rule, title: 'BOTELLAS: EL RELOJ DEL CALLEJÓN', caption: `Cada ${bt.every} turnos le llueven ${bt.n} botellas a tu barco (${onShip} de ${bt.n} pegan). Gana rápido o aguanta el golpe.`, shots, field };
}

/** the demo a stage's rules call for (the first thing it teaches): donuts > bottles > the plain sway */
export function demoFor(mareo: MareoCfg | undefined): DemoRuleId | null {
  if (!mareo) return null;
  if (mareo.donas) return 'donas';
  if (mareo.botellas) return 'botellas';
  return 'mareo';
}
