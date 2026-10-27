/**
 * ACTO IV — the rule board: a battle seen on an LED screen, built from the REAL simulator (battle/demo.ts ruleDemo).
 * The ships, the waterline and every flight path come from the demo's battle (`field`, `shots[].points`), so what the
 * film draws is how a shot really flies. The rule's own part (the beat of RITMO, the cover pose of Firma) is drawn on
 * top: the sim does not implement those two rules yet (MECÁNICAS calibrates them), so the film shows WHAT the rule does,
 * on honest trajectories, without inventing numbers.
 */
import { Container, Graphics } from 'pixi.js';
import type { PathPoint } from '../../../../battle/sim';
import type { RuleDemo } from '../../../../battle/demo';
import { POP } from '../../../styles/pop';

let cached: RuleDemo | null = null;
/**
 * A rule demo from the REAL simulator, cheap enough for a loading screen: the same fixed battle as battle/demo.ts (two
 * Gorrión-size ships, seed 4242) and ONE clean shot aimed at the enemy's cannon (a coarse aim search: ~160 flights
 * instead of ruleDemo's 1 600). Cached for the session (pure: the same answer every time).
 */
export async function demoOf(): Promise<RuleDemo | null> {
  if (cached) return cached;
  try {
    const [{ makeBattle }, { BLUEPRINTS }, { battleCatFrom }, content, { CELL }] = await Promise.all([
      import('../../../../battle/autoplay'),
      import('../../../../battle/blueprints'),
      import('../../../../battle/catShots'),
      import('../../../../data/content'),
      import('../../../../battle/ship'),
    ]);
    const cat = (uid: string, species: string) => battleCatFrom({ uid, species, name: species, level: 10, stars: 1, dmgMul: 1, hpMul: 1 }, content.ROLE_BY_ID.get(content.catDef(species).role)?.hp ?? 100);
    const spec = {
      player: { blueprint: BLUEPRINTS.sparrow, hpMul: 3, cats: [cat('p0', 'c_canelo'), cat('p1', 'c_gelatino')], cannonAtk: 30 },
      enemy: { blueprint: BLUEPRINTS.sparrow, hpMul: 3, cats: [cat('e0', 'c_brote'), cat('e1', 'c_musgo')], cannonAtk: 30 },
      playerName: 'Tú',
      enemyName: 'Demostración',
      difficulty: 'normal',
      onEnd: () => undefined,
    } as unknown as Parameters<typeof makeBattle>[0];
    const b = makeBattle(spec, 4242);
    const ext = (side: number) => {
      const st = b.sides[side];
      const x0 = st.setup.origin.x;
      return { x0, x1: x0 + st.ship.cols * CELL };
    };
    const mods = b.sides[1].ship.modules;
    const pick = Math.max(0, mods.findIndex((m) => m.kind === 'cannon'));
    const tgt = b.roomCenter(1, pick);
    const shotDef = b.sides[0].cats[0].def.shot;
    const from = b.muzzle(0, 'p0');
    // coarse, then fine around the best (≈ 80 flights: little garbage left for the clock to collect later)
    let best: { angle: number; power: number; x: number; y: number } | null = null;
    let bd = Infinity;
    const tryShot = (a: number, power: number) => {
      const p = b.integrate(shotDef, from, a, power, 0, 0);
      const end = p.points[p.impacts.length ? p.impacts[0] : p.points.length - 1];
      const d = Math.hypot(end.x - tgt.x, end.y - tgt.y);
      if (d < bd) {
        bd = d;
        best = { angle: a, power, x: end.x, y: end.y };
      }
    };
    for (const power of [1000, 1120, 1220]) for (let a = -1.3; a <= -0.2; a += 0.09) tryShot(a, power);
    const c0 = best as { angle: number; power: number } | null;
    if (c0) for (const power of [c0.power - 50, c0.power, c0.power + 50]) for (let a = c0.angle - 0.09; a <= c0.angle + 0.09; a += 0.015) tryShot(a, power);
    const bb = best as { angle: number; power: number; x: number; y: number } | null;
    if (!bb) return null;
    const path = b.integrate(shotDef, from, bb.angle, bb.power, 0, 0);
    const best2 = { points: path.points.map((q) => ({ ...q })), x: bb.x, y: bb.y, angle: bb.angle, power: bb.power };
    cached = {
      rule: 'mareo',
      title: 'TIRO LIMPIO',
      caption: '',
      shots: [{ label: 'TIRO', good: true, angle: best2.angle, power: best2.power, points: best2.points, landing: 'modulo', x: Math.round(best2.x), y: Math.round(best2.y) }],
      field: { waterY: b.cfg.waterY, player: ext(0), enemy: ext(1), donas: [], target: { x: tgt.x, y: tgt.y, kind: mods[pick]?.kind ?? 'cannon' } },
    };
    return cached;
  } catch (e) {
    console.warn('[acto4] sin demostración del simulador', e);
    return null;
  }
}

/** the flight up to its first impact (the demo's landing point) */
export function flightOf(s: { points: PathPoint[]; x: number; y: number }): PathPoint[] {
  let end = s.points.length - 1;
  let bd = Infinity;
  s.points.forEach((q, i) => {
    const d = Math.hypot(q.x - s.x, q.y - s.y);
    if (d < bd - 0.5) {
      bd = d;
      end = i;
    }
  });
  return s.points.slice(0, end + 1);
}

/**
 * The field of a demo framed into a rect (x, y, w, h) of a container: water, two ships (hull + deck house) and the
 * mapping P(world) → board. `ships(g)` draws them; the caller adds cats and shots.
 */
export class RuleBoard extends Container {
  readonly g = new Graphics();
  readonly P: (x: number, y: number) => [number, number];
  readonly sc: number;
  readonly waterY: number;
  readonly player: [number, number];
  readonly enemy: [number, number];
  constructor(
    readonly demo: RuleDemo | null,
    readonly rect: [number, number, number, number],
    o: { water?: number; hullA?: number; hullB?: number; ink?: number } = {},
  ) {
    super();
    const [X, Y, W, H] = rect;
    const fld = demo?.field;
    const wx0 = fld ? Math.min(fld.player.x0, fld.enemy.x0) - 90 : 0;
    const wx1 = fld ? Math.max(fld.player.x1, fld.enemy.x1) + 90 : 1920;
    const wy0 = fld ? fld.waterY - 640 : 0;
    const wy1 = fld ? fld.waterY + 70 : 1080;
    const sc = (this.sc = Math.min(W / (wx1 - wx0), H / (wy1 - wy0)));
    const ox = X + (W - (wx1 - wx0) * sc) / 2;
    const oy = Y + (H - (wy1 - wy0) * sc) / 2;
    this.P = (x, y) => [ox + (x - wx0) * sc, oy + (y - wy0) * sc];
    const ink = o.ink ?? POP.ink;
    const g = this.g;
    const [, wyp] = this.P(0, fld?.waterY ?? 900);
    this.waterY = wyp;
    g.rect(X, wyp, W, Y + H - wyp).fill(o.water ?? 0x2a5ad8);
    for (let i = 0; i < 16; i++) g.moveTo(X + i * (W / 16), wyp + 12).quadraticCurveTo(X + i * (W / 16) + W / 64, wyp + 3, X + i * (W / 16) + W / 32, wyp + 12).stroke({ width: 4, color: POP.sky });
    const side = (x0: number, x1: number, col: number) => {
      const [a] = this.P(x0, 0);
      const [b] = this.P(x1, 0);
      g.poly([a, wyp - 70 * sc * 2.2, b, wyp - 70 * sc * 2.2, b - 34, wyp + 18, a + 34, wyp + 18]).fill(col).stroke({ width: 5, color: ink, join: 'round' });
      g.rect(a + 24, wyp - 130 * sc * 2.2, b - a - 48, 60 * sc * 2.2).fill(col).stroke({ width: 4, color: ink });
      return [a, b] as [number, number];
    };
    this.player = fld ? side(fld.player.x0, fld.player.x1, o.hullA ?? 0xffc2a8) : [X + W * 0.1, X + W * 0.35];
    this.enemy = fld ? side(fld.enemy.x0, fld.enemy.x1, o.hullB ?? 0xc8a8ff) : [X + W * 0.65, X + W * 0.9];
    this.addChild(g);
  }
  /** draw a flight (board coords) up to progress p: a dashed trail and the ball; returns the head */
  path(g: Graphics, pts: PathPoint[], p: number, color: number, o: { width?: number; ball?: number; dx?: number; dy?: number } = {}): [number, number] {
    const n = Math.max(2, Math.floor(pts.length * Math.max(0, Math.min(1, p))));
    const dx = o.dx ?? 0;
    const dy = o.dy ?? 0;
    for (let i = 1; i < n; i++) {
      if (i % 3 === 0) continue;
      const [x0, y0] = this.P(pts[i - 1].x, pts[i - 1].y);
      const [x1, y1] = this.P(pts[i].x, pts[i].y);
      const k = 1 - i / pts.length;
      g.moveTo(x0 + dx * k, y0 + dy * k).lineTo(x1 + dx * k, y1 + dy * k).stroke({ width: o.width ?? 6, color, cap: 'round' });
    }
    const [hx, hy] = this.P(pts[n - 1].x, pts[n - 1].y);
    const k = 1 - (n - 1) / pts.length;
    const head: [number, number] = [hx + dx * k, hy + dy * k];
    g.circle(head[0], head[1], o.ball ?? 12).fill(color).stroke({ width: 4, color: POP.ink });
    return head;
  }
}

/** an impact burst (rays + ring) at (x, y) with progress k 0..1 */
export function burst(g: Graphics, x: number, y: number, k: number, color: number, r = 60) {
  if (k <= 0 || k >= 1) return;
  const a = 1 - k;
  for (let i = 0; i < 10; i++) {
    const ang = i * 0.628 + 0.2;
    g.moveTo(x + Math.cos(ang) * r * 0.3, y + Math.sin(ang) * r * 0.3).lineTo(x + Math.cos(ang) * r * (0.4 + k), y + Math.sin(ang) * r * (0.4 + k)).stroke({ width: 7 * a + 1, color, alpha: a });
  }
  g.circle(x, y, r * (0.3 + k * 0.9)).stroke({ width: 6 * a + 1, color: 0xffffff, alpha: a });
}
