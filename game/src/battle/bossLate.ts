/**
 * Bosses 4–6 (GDD 2.10) — pure sim rules, called from Battle (sim.ts). Same determinism rules as the
 * sim: only `b.rng`, integer damage, everything resolved here and replayed by the view from events.
 *
 *  El Arcanista (Biblioteca Errante)
 *    F1 Tres capas: an arcane WARD of 3 layers eats every impact. Physical (Tierra / cañones) ×1.5 to the
 *       layer; ⚡ rayo = SOBRECARGA: pops a layer and stuns the cat holding it; 20% of runes bounce back (Espejo).
 *    F2 Teletransporte: two rune PORTALS in the sky. A shot that enters one leaves the other facing back —
 *       and now belongs to the other side ("ahora es mío"). They move every turn; the next spot is shown.
 *    F3 Grimorio abierto: 2 INK CATS (paper: Fuego ×2) float over his ship and shoot cursing runes. The
 *       Grimorio (core) takes ×1.2, ×1.5 the turn after he summons. He re-summons every 3 turns.
 *  Estrella Errante (El Cometa)
 *    Always: 2 GRAVITY WELLS (modules) bend every projectile that passes near them — break them.
 *    F2 Ingravidez: field gravity ×0.55 for everyone; her destroyed cells float and fall on YOU next turn.
 *       Every 3 turns she charges LLUVIA DE ESTRELLAS (targets marked on your ship): her core-star glows
 *       (×2) — hit near the core that turn and the rain is cancelled.
 *    F3 Caída: gravity inverted in a column over her ship ("abajo es arriba"): shoot flat or from below.
 *  EL PRIMER MAR (Leviatán Almirante) — the sea is the boss: it can't sink; 3 cores, one per phase.
 *    F1 Escamas arcanas: 2-layer ward, then the Coral Heart (core 1).
 *    F2 Casco de agua viva: submerged (only rayo and torpedoes reach). Every other turn it surfaces to
 *       breathe and the Espiráculo (core 2) is exposed; freeze the sea around it (agua / hielo / ráfaga,
 *       VENTISCA) and it's stuck on the surface 2 turns, frozen (Tierra / cañón = ESTALLIDO ×2).
 *    F3 El mar se traga todo: inverted gravity over it; Distraxia marks one of your modules and erases it
 *       next turn unless you hit her eye in the fog. Your whole crew starts F3 with the ultimate full.
 *       Core 3 falls → STARFALL (the view stages the finale).
 */
import type { Battle, BattleEvent, BossConfig, Part, Portals } from './sim';
import { isRayo, isGust, DMG_K, ENRAGE_MUL } from './sim';
import { CELL, Cell } from './ship';
import type { ShotDef } from './types';

const LATE = new Set(['arcanist', 'star', 'leviathan']);
const isLate = (b: Battle) => !!b.boss && LATE.has(b.boss.id);

/** star rain meteor / falling debris of the Estrella */
const STAR_METEOR: ShotDef = { id: 'star_rain', name: 'LLUVIA DE ESTRELLAS', element: 'cosmic', trajectory: 'ballistic', power: 0.55, radius: 58, gravityScale: 1.4, windScale: 0, catMul: 0.45 };
const STAR_DEBRIS: ShotDef = { id: 'star_debris', name: 'ESCOMBROS', element: 'earth', trajectory: 'heavy', power: 0.3, radius: 44, gravityScale: 1.2, windScale: 0, pierce: 0, catMul: 0.4 };

export function lateBossInit(b: Battle, cfg: BossConfig) {
  const s = b.sides[cfg.side];
  const B = b.boss!;
  const ox = s.setup.origin.x;
  const oy = s.setup.origin.y;
  const w = s.ship.cols * CELL;
  const total = s.ship.initialMax?.[0] ?? 0;
  if (cfg.id === 'arcanist' || cfg.id === 'leviathan') {
    const layers = cfg.id === 'arcanist' ? 3 : 2;
    const layerHp = Math.round(total * (cfg.id === 'arcanist' ? 0.09 : 0.08));
    s.ward = { layers, max: layers, hp: layerHp, layerHp };
  }
  if (cfg.id === 'arcanist') {
    // two ink cats wait inside the Grimorio (F3)
    const hp = Math.round(170 * s.setup.hpMul);
    const spots = [
      { x: ox + w * 0.24, y: oy - 60 },
      { x: ox + w * 0.7, y: oy - 110 },
    ];
    spots.forEach((p, i) => s.parts.push({ id: 10 + i, kind: 'ink', side: cfg.side, x: p.x, y0: p.y, y1: p.y, r: 36, hp, maxHp: hp, alive: true, active: false, material: 'canvas', grab: null }));
    B.inkIn = 3;
  }
  if (cfg.id === 'leviathan') {
    // its three hearts are softer than a ship core (you need all three, one per phase)
    for (const m of s.ship.modules) {
      if (!m.tag?.startsWith('core')) continue;
      for (const c of s.ship.moduleCells(m.id)) c.hp = c.maxHp = Math.round(c.maxHp * 0.6);
    }
    // Distraxia: a violet fog with an eye above the whale (F3)
    s.parts.push({ id: 20, kind: 'fog', side: cfg.side, x: ox + w * 0.42, y0: oy - 150, y1: oy - 150, r: 58, hp: 1e9, maxHp: 1e9, alive: true, active: false, material: 'void', grab: null });
    B.breathIn = 3;
  }
  if (cfg.id === 'star') B.starIn = 3;
}

// ------------------------------------------------------------------ turn start
export function lateBossStart(b: Battle, side: 0 | 1, ev: BattleEvent[]) {
  const B = b.boss!;
  const bs = b.cfg.boss!.side;
  const S = b.sides[bs];
  if (side !== bs) return;
  B.turns++;
  if (B.id === 'arcanist') {
    if (B.phase >= 2) movePortals(b, ev);
    if (B.phase >= 3) {
      if (B.grimoire > 0) {
        B.grimoire--;
        if (!B.grimoire) {
          const c = coreCenter(b, bs);
          ev.push({ k: 'boss', what: 'grimoire', side: bs, n: 0, x: c.x, y: c.y, path: -1, at: 0 });
        }
      }
      B.inkIn--;
      const inks = S.parts.filter((p) => p.kind === 'ink');
      if (B.inkIn <= 0 && inks.some((p) => !p.alive)) summonInk(b, ev);
    }
  }
  if (B.id === 'star') {
    if (B.charging) {
      B.charging = false;
      B.starIn = 3;
      if (B.chargeDmg > 0) {
        const c = coreCenter(b, bs);
        ev.push({ k: 'boss', what: 'starStop', side: bs, x: c.x, y: c.y, path: -1, at: 0 });
      } else starRain(b);
      B.starTargets = [];
    } else if (B.phase >= 2) {
      B.starIn--;
      if (B.starIn <= 0) {
        B.charging = true;
        B.chargeDmg = 0;
        const p = b.sides[1 - bs];
        const x0 = p.setup.origin.x + CELL;
        const x1 = p.setup.origin.x + (p.ship.cols - 1) * CELL;
        B.starTargets = Array.from({ length: 5 }, (_, i) => Math.round(x0 + ((i + 0.2 + b.rng.next() * 0.6) / 5) * (x1 - x0)));
        const c = coreCenter(b, bs);
        ev.push({ k: 'boss', what: 'starTell', side: bs, x: c.x, y: c.y, n: B.starTargets.length, path: -1, at: 0 });
      }
    }
    if (B.phase >= 2 && B.debris > 0) debrisFall(b);
  }
  if (B.id === 'leviathan') {
    const c = b.shipCenter(bs);
    if (B.phase === 2) {
      if (B.frozen > 0) {
        B.frozen--;
        if (!B.frozen) {
          B.submerged = true;
          B.breathIn = 1;
          ev.push({ k: 'boss', what: 'thaw', side: bs, x: c.x, y: c.y, path: -1, at: 0 });
          ev.push({ k: 'boss', what: 'submerge', side: bs, x: c.x, y: c.y, path: -1, at: 0 });
        }
      } else if (B.breathing) {
        B.breathing = false;
        B.submerged = true;
        B.breathIn = 1;
        ev.push({ k: 'boss', what: 'submerge', side: bs, x: c.x, y: c.y, path: -1, at: 0 });
      } else {
        B.breathIn--;
        if (B.breathIn <= 0) {
          B.breathing = true;
          B.submerged = false;
          const core = S.ship.modules.find((m) => m.tag === 'core2');
          const p = core ? b.roomCenter(bs, core.id) : c;
          ev.push({ k: 'boss', what: 'breath', side: bs, x: p.x, y: p.y, path: -1, at: 0 });
        }
      }
    }
    if (B.phase === 3) devourStep(b, ev);
  }
}

function summonInk(b: Battle, ev: BattleEvent[]) {
  const B = b.boss!;
  const bs = b.cfg.boss!.side;
  for (const p of b.sides[bs].parts) {
    if (p.kind !== 'ink') continue;
    p.alive = true;
    p.active = true;
    p.hp = p.maxHp;
  }
  B.inkIn = 3;
  B.grimoire = 1;
  const c = coreCenter(b, bs);
  ev.push({ k: 'boss', what: 'inkSummon', side: bs, x: c.x, y: c.y - 120, path: -1, at: 0 });
  ev.push({ k: 'boss', what: 'grimoire', side: bs, n: 1, x: c.x, y: c.y, path: -1, at: 0 });
}

function pickPortals(b: Battle): Portals {
  const p = b.sides[0];
  const e = b.sides[1];
  const pR = p.setup.origin.x + p.ship.cols * CELL;
  const eL = e.setup.origin.x;
  const mid = (pR + eL) / 2;
  const span = Math.max(120, Math.min(330, (eL - pR) / 2 + 160));
  return {
    a: { x: Math.round(mid + 70 + b.rng.range(0, span)), y: Math.round(300 + b.rng.range(0, 220)) },
    b: { x: Math.round(mid - 70 - b.rng.range(0, span)), y: Math.round(300 + b.rng.range(0, 220)) },
    r: 54,
  };
}

function movePortals(b: Battle, ev: BattleEvent[]) {
  b.portals = b.portalNext ?? pickPortals(b);
  b.portalNext = pickPortals(b);
  ev.push({ k: 'boss', what: 'portalMove', side: b.cfg.boss!.side, x: b.portals.a.x, y: b.portals.a.y, path: -1, at: 0 });
}

function coreCenter(b: Battle, side: number) {
  const s = b.sides[side];
  const core = s.ship.modules.find((m) => m.kind === 'core' && m.alive) ?? s.ship.modules.find((m) => m.kind === 'core');
  return core ? b.roomCenter(side, core.id) : b.shipCenter(side);
}

/** top surface y of a ship at world x (first cell from the top), or the waterline */
function topAt(b: Battle, side: number, x: number) {
  const s = b.sides[side];
  for (let gy = 0; gy < s.ship.rows; gy++) {
    const g = b.toGrid(side, x, s.setup.origin.y + gy * CELL + CELL / 2);
    if (s.ship.get(g.x, gy)) return s.setup.origin.y + gy * CELL;
  }
  return b.waterY;
}

function bossAtk(b: Battle, mul: number) {
  const bs = b.cfg.boss!.side;
  return b.sides[bs].setup.cannonAtk * mul * (b.boss!.enraged ? ENRAGE_MUL : 1);
}

/** LLUVIA DE ESTRELLAS: meteors on the marked x (they fall straight; what's in the way takes it) */
function starRain(b: Battle) {
  const bs = b.cfg.boss!.side;
  const B = b.boss!;
  const events: BattleEvent[] = [];
  const paths = B.starTargets.map((x, i) => b.integrate(STAR_METEOR, { x: x + (i % 2 ? 30 : -30), y: -160 - i * 70 }, Math.PI / 2 + (i % 2 ? -0.03 : 0.03), 420, 0, bs));
  b.resolvePaths(bs, STAR_METEOR, bossAtk(b, 1), paths, events);
  b.checkVictory();
  b.queued.push({ side: bs, label: '¡LLUVIA DE ESTRELLAS!', paths, events, shot: STAR_METEOR });
}

/** F2: her floating debris comes down on you */
function debrisFall(b: Battle) {
  const bs = b.cfg.boss!.side;
  const B = b.boss!;
  const n = Math.min(4, B.debris);
  B.debris = 0;
  const p = b.sides[1 - bs];
  const x0 = p.setup.origin.x + CELL;
  const x1 = p.setup.origin.x + (p.ship.cols - 1) * CELL;
  const events: BattleEvent[] = [];
  const paths = Array.from({ length: n }, (_, i) => {
    const x = x0 + b.rng.next() * (x1 - x0);
    return b.integrate(STAR_DEBRIS, { x, y: -120 - i * 60 }, Math.PI / 2, 260, 0, bs);
  });
  b.resolvePaths(bs, STAR_DEBRIS, bossAtk(b, 1), paths, events);
  b.checkVictory();
  b.queued.push({ side: bs, label: '¡SUS ESCOMBROS TE CAEN ENCIMA!', paths, events, shot: STAR_DEBRIS });
}

/** Distraxia: erase the marked module (unless her eye was hit), then mark the next one */
function devourStep(b: Battle, ev: BattleEvent[]) {
  const B = b.boss!;
  const bs = b.cfg.boss!.side;
  const ps = b.sides[1 - bs];
  const fog = b.sides[bs].parts.find((p) => p.kind === 'fog');
  if (B.devour !== null) {
    const m = ps.ship.modules[B.devour];
    const at = b.roomCenter(1 - bs, m.id);
    if (B.fogHit) ev.push({ k: 'boss', what: 'devourStop', side: 1 - bs, module: m.id, x: at.x, y: at.y, path: -1, at: 0 });
    else if (m.alive) {
      ev.push({ k: 'boss', what: 'devour', side: 1 - bs, module: m.id, x: at.x, y: at.y, path: -1, at: 0 });
      for (const c of ps.ship.moduleCells(m.id)) {
        ps.ship.destroyCell(c.x, c.y);
        ev.push({ k: 'cell', side: 1 - bs, cell: c, dmg: c.hp, destroyed: true, path: -1, at: 0 });
      }
      b.reportModule(1 - bs, m.id, ev, -1, 0);
      for (const ch of ps.ship.collapse()) {
        ev.push({ k: 'chunk', side: 1 - bs, cells: ch, path: -1, at: 0 });
        for (const c of ch) if (c.module !== undefined) b.reportModule(1 - bs, c.module, ev, -1, 0);
      }
      ev.push(...b.updateExposure(1 - bs));
    }
  }
  B.devour = null;
  B.fogHit = false;
  const pool = ps.ship.modules.filter((m) => m.alive && m.kind !== 'core' && ps.ship.moduleCells(m.id).length);
  if (!pool.length || !fog) return;
  const pick = b.rng.weighted(pool, (m) => (m.kind === 'cannon' ? 4 : m.kind === 'catroom' ? 3 : m.kind === 'shield' ? 3 : m.kind === 'mast' ? 2 : 1));
  B.devour = pick.id;
  const at = b.roomCenter(1 - bs, pick.id);
  ev.push({ k: 'boss', what: 'devourTell', side: 1 - bs, module: pick.id, part: fog.id, x: at.x, y: at.y, path: -1, at: 0 });
}

// ------------------------------------------------------------------ phases
export function lateEnterPhase(b: Battle, n: number, ev: BattleEvent[]) {
  const B = b.boss!;
  const bs = b.cfg.boss!.side;
  const S = b.sides[bs];
  const c = b.shipCenter(bs);
  if (B.id === 'arcanist') {
    if (n === 2) {
      b.portals = pickPortals(b);
      b.portalNext = pickPortals(b);
      ev.push({ k: 'boss', what: 'portalMove', side: bs, x: b.portals.a.x, y: b.portals.a.y, path: -1, at: 0 });
    }
    if (n === 3) summonInk(b, ev);
  }
  if (B.id === 'star') {
    if (n === 2) {
      b.field.gMul = 0.55;
      B.starIn = 1;
    }
    if (n === 3) {
      b.field.gMul = 0.8;
      b.field.anti = antiColumn(b, bs);
    }
    ev.push({ k: 'boss', what: 'gravity', side: bs, n, x: c.x, y: c.y, path: -1, at: 0 });
  }
  if (B.id === 'leviathan') {
    const core = S.ship.modules.find((m) => m.tag === `core${n}`);
    const cc = core ? b.roomCenter(bs, core.id) : c;
    if (S.ward && S.ward.layers > 0) {
      S.ward.layers = 0;
      ev.push({ k: 'boss', what: 'wardPop', side: bs, n: 0, x: c.x, y: c.y, path: -1, at: 0 });
    }
    if (n === 2) {
      B.submerged = true;
      B.breathIn = 1;
      ev.push({ k: 'boss', what: 'submerge', side: bs, x: c.x, y: c.y, path: -1, at: 0 });
    }
    if (n === 3) {
      if (B.submerged) ev.push({ k: 'boss', what: 'surface', side: bs, x: c.x, y: c.y, path: -1, at: 0 });
      B.submerged = false;
      B.breathing = false;
      B.frozen = 0;
      b.field.gMul = 0.85;
      // the sea pulls things up over the whale (gentler than the Estrella's: you still have to land shots)
      b.field.anti = antiColumn(b, bs, -0.15);
      ev.push({ k: 'boss', what: 'gravity', side: bs, n: 3, x: c.x, y: c.y, path: -1, at: 0 });
      const fog = S.parts.find((p) => p.kind === 'fog');
      if (fog) fog.active = true;
      // the whale opens its maw: the bone in front of the deep heart falls away (shoot it from the front)
      const c3 = S.ship.modules.find((m) => m.tag === 'core3');
      if (c3) {
        for (let gy = c3.y - 2; gy < c3.y + c3.h; gy++)
          for (let gx = c3.x + c3.w; gx < S.ship.cols; gx++) {
            const cell = S.ship.get(gx, gy);
            if (!cell || cell.module !== undefined) continue;
            S.ship.destroyCell(gx, gy);
            ev.push({ k: 'cell', side: bs, cell, dmg: cell.hp, destroyed: true, path: -1, at: 0 });
          }
        const mc = b.roomCenter(bs, c3.id);
        ev.push({ k: 'info', text: '¡ABRE LA BOCA! EL CORAZÓN HONDO QUEDA A LA VISTA', x: mc.x, y: mc.y - 90, color: 0xffd400, path: -1, at: 0 });
      }
      // TODOS tus gatos empiezan la fase con la ultimate al 100%
      for (const k of b.sides[1 - bs].cats) if (!k.ko) k.ultCharge = 1;
      ev.push({ k: 'info', text: '¡TODAS TUS ULTIMATES AL 100%!', x: 480, y: 260, color: 0xffd400, path: -1, at: 0 });
      devourStep(b, ev);
    }
    ev.push({ k: 'boss', what: 'coreSwitch', side: bs, n, x: cc.x, y: cc.y, path: -1, at: 0 });
  }
}

/** the inverted column over a ship (k = gravity inside: negative pulls up) */
function antiColumn(b: Battle, side: number, k = -0.45) {
  const s = b.sides[side];
  const x0 = s.setup.origin.x - 110;
  const x1 = s.setup.origin.x + s.ship.cols * CELL + 30;
  return { x0, x1, y0: s.setup.origin.y - 240, k };
}

// ------------------------------------------------------------------ impacts
/** the ward eats an impact. Returns true when it absorbed it (the shot does nothing else). */
export function wardIntercept(b: Battle, attSide: number, targetSide: number, shot: ShotDef, base: number, x: number, y: number, ev: BattleEvent[], path: number, at: number): boolean {
  const s = b.sides[targetSide];
  const w = s.ward!;
  const pop = (why: string) => {
    w.layers--;
    w.hp = w.layerHp;
    ev.push({ k: 'boss', what: 'wardPop', side: targetSide, n: w.layers, x, y, path, at });
    if (why) ev.push({ k: 'reaction', name: why, x, y, mult: 1, path, at });
    // the crew member that held that layer gets the backlash (Sobrecarga: aturdido)
    if (why === 'SOBRECARGA') {
      const holder = s.cats.filter((c) => !c.ko)[w.max - w.layers - 1] ?? s.cats.find((c) => !c.ko);
      if (holder) {
        holder.stunned = Math.max(holder.stunned, 2);
        ev.push({ k: 'cat', side: targetSide, uid: holder.def.uid, dmg: 0, ko: false, shield: false, element: 'electric', fx: { ...holder.fx }, stunned: true, path, at });
      }
    }
  };
  if (shot.element === 'void') {
    pop('DEVORAR');
    return true;
  }
  if (isRayo(shot)) {
    pop('SOBRECARGA');
    return true;
  }
  // Espejo: 1 of 5 runes bounces back at the cat that cast it
  if (shot.element === 'magic' && shot.trajectory === 'homing' && b.rng.chance(0.2)) {
    ev.push({ k: 'boss', what: 'reflect', side: targetSide, x, y, path, at });
    const c = b.curShooter;
    if (c && !c.ko) b.hitCat(c, Math.round(base * 0.35), ev, path, at, 'magic', true);
    return true;
  }
  const physical = shot.element === 'earth' || shot.element === 'neutral';
  const dmg = Math.max(1, Math.round(base * DMG_K * 2.2 * (physical ? 1.5 : 1)));
  w.hp -= dmg;
  if (w.hp <= 0) pop('');
  else ev.push({ k: 'boss', what: 'wardHit', side: targetSide, n: w.layers, amount: dmg, x, y, path, at });
  if (w.hp > 0 && w.layers > 0) ev.push({ k: 'info', text: physical ? 'FÍSICO ×1.5 A LA CAPA' : 'LA CAPA LO ABSORBE', x, y: y - 50, color: physical ? 0xffd400 : 0xd8a8ee, path, at });
  ev.push({ k: 'impact', x, y, side: targetSide, radius: 30, element: shot.element, crit: false, path, at, total: 0 });
  return true;
}

/** structure multiplier of a cell on the boss side (0 = immune) */
export function lateCellMul(b: Battle, side: number, cell: Cell): number {
  const B = b.boss;
  if (!B || !isLate(b) || b.cfg.boss!.side !== side || cell.module === undefined) return 1;
  const m = b.sides[side].ship.modules[cell.module];
  if (!m) return 1;
  if (B.id === 'arcanist' && m.kind === 'core' && B.phase >= 3) return B.grimoire > 0 ? 1.5 : 1.2;
  if (B.id === 'star' && m.kind === 'core' && B.charging) return 2;
  if (B.id === 'leviathan' && m.tag?.startsWith('core')) {
    if (m.tag !== `core${B.phase}`) return 0;
    // the Espiráculo is a weak point: immune under water, ×1.5 when it comes up
    if (B.phase === 2) return B.breathing || B.frozen > 0 ? 1.5 : 0;
  }
  return 1;
}

/** after an impact on the boss side: freeze meter, star-charge interruption, floating debris, Distraxia's eye */
export function lateAfterImpact(b: Battle, attSide: number, targetSide: number, shot: ShotDef, total: number, x: number, y: number, ev: BattleEvent[], path: number, at: number, reactions: Set<string>) {
  const B = b.boss;
  if (!B || !isLate(b) || b.cfg.boss!.side !== targetSide) return;
  if (B.id === 'star') {
    if (B.charging) {
      const c = coreCenter(b, targetSide);
      if (Math.hypot(c.x - x, c.y - y) < CELL * 3 + shot.radius * 0.5) {
        if (!B.chargeDmg) ev.push({ k: 'info', text: '¡CARGA INTERRUMPIDA!', x: c.x, y: c.y - 90, color: 0xffd400, path, at });
        B.chargeDmg += Math.max(1, total);
      }
    }
    if (B.phase >= 2) {
      let n = 0;
      for (const e of ev) if (e.k === 'cell' && e.side === targetSide && e.destroyed && e.path === path && e.at === at) n++;
      B.debris = Math.min(8, B.debris + n);
    }
  }
  if (B.id === 'leviathan') {
    if (B.phase === 2) addFreeze(b, freezeValue(shot, reactions), x, y, ev, path, at);
    const fog = b.sides[targetSide].parts.find((p) => p.kind === 'fog' && p.active);
    if (fog && B.devour !== null && !B.fogHit && Math.hypot(fog.x - x, fog.y0 - y) < fog.r + shot.radius) {
      B.fogHit = true;
      ev.push({ k: 'info', text: '¡DISTRAXIA PARPADEA!', x: fog.x, y: fog.y0 - 70, color: 0xd8a8ee, path, at });
    }
  }
  void attSide;
}

function freezeValue(shot: ShotDef, reactions: Set<string>) {
  let v = 0;
  if (shot.element === 'water') v += 1;
  if (shot.element === 'ice') v += 2;
  if (isGust(shot)) v += 1;
  if (reactions.has('VENTISCA') || reactions.has('MAR HELADO')) v += 2;
  return v;
}

function addFreeze(b: Battle, v: number, x: number, y: number, ev: BattleEvent[], path: number, at: number) {
  const B = b.boss!;
  if (v <= 0 || B.frozen > 0) return;
  const bs = b.cfg.boss!.side;
  B.freeze = Math.min(3, B.freeze + v);
  ev.push({ k: 'boss', what: 'freeze', side: bs, n: B.freeze, x, y, path, at });
  if (B.freeze < 3) return;
  // the sea around it freezes: it's stuck on the surface, frozen, the Espiráculo exposed
  B.freeze = 0;
  B.frozen = 2;
  B.submerged = false;
  B.breathing = false;
  const S = b.sides[bs];
  const cells = S.ship.cells();
  for (const c of cells) c.status.frozen = Math.max(c.status.frozen ?? 0, 2);
  const core = S.ship.modules.find((m) => m.tag === 'core2');
  const p = core ? b.roomCenter(bs, core.id) : b.shipCenter(bs);
  ev.push({ k: 'status', side: bs, cells, status: 'frozen' });
  ev.push({ k: 'boss', what: 'seaFrozen', side: bs, x: p.x, y: p.y, path, at });
}

/** a shot that fell in the sea: water/ice next to the submerged Leviatán chills it */
export function lateSplash(b: Battle, side: number, shot: ShotDef, x: number, ev: BattleEvent[], path: number, at: number) {
  const B = b.boss;
  if (!B || B.id !== 'leviathan' || B.phase !== 2) return;
  const bs = b.cfg.boss!.side;
  if (side === bs) return;
  const s = b.sides[bs];
  const x0 = s.setup.origin.x - 170;
  const x1 = s.setup.origin.x + s.ship.cols * CELL + 60;
  if (x < x0 || x > x1) return;
  addFreeze(b, freezeValue(shot, new Set()), x, b.waterY - 20, ev, path, at);
}

/** Leviatán: the core that matters right now (switching phase when it falls) and "can't sink" */
export function lateLoss(b: Battle, side: number) {
  const B = b.boss;
  if (!B || B.id !== 'leviathan' || b.cfg.boss!.side !== side) return undefined;
  const s = b.sides[side];
  let core = s.ship.modules.find((m) => m.tag === `core${B.phase}`);
  while (core && !core.alive && B.phase < 3) {
    const evs = b.forcePhase((B.phase + 1) as 2 | 3);
    b.pending.push(...evs);
    core = s.ship.modules.find((m) => m.tag === `core${B.phase}`);
  }
  return { core: core ?? null, noSink: true };
}

/** start of `side`'s turn: ultimate after-effects tick down (Gea, Eclipse, FIN, wells) */
export function tickBuffs(b: Battle, side: number, ev: BattleEvent[]) {
  const s = b.sides[side];
  const bf = s.buffs;
  if (bf.stone > 0) bf.stone--;
  // Merlina's FIN: the word on the module comes due
  for (const f of [...bf.fin]) {
    f.turns--;
    if (f.turns > 0) continue;
    bf.fin = bf.fin.filter((k) => k !== f);
    const m = s.ship.modules[f.module];
    const caster = b.sides[1 - side].cats.find((c) => c.def.uid === f.by);
    const at = b.roomCenter(side, f.module);
    if (!m || !caster || caster.ko) {
      ev.push({ k: 'ultfx', fx: 'finFizzle', side, x: at.x, y: at.y, path: -1, at: 0 });
      continue;
    }
    ev.push({ k: 'ultfx', fx: 'finBoom', side, x: at.x, y: at.y, path: -1, at: 0 });
    for (const c of s.ship.moduleCells(m.id)) {
      const dmg = Math.round(f.dmg);
      b.hurtCell(side, c, dmg);
      const destroyed = c.hp <= 0;
      if (destroyed) {
        s.ship.destroyCell(c.x, c.y);
        b.reportModule(side, m.id, ev, -1, 0);
      }
      ev.push({ k: 'cell', side, cell: c, dmg, destroyed, path: -1, at: 0 });
    }
    for (const ch of s.ship.collapse()) {
      ev.push({ k: 'chunk', side, cells: ch, path: -1, at: 0 });
      for (const c of ch) if (c.module !== undefined) b.reportModule(side, c.module, ev, -1, 0);
    }
  }
  // temporary wells owned by this side wear off on its turns
  b.wells = b.wells.filter((w) => {
    if (w.owner !== side) return true;
    w.turns--;
    if (w.turns <= 0) ev.push({ k: 'ultfx', fx: 'wellEnd', side, x: w.x, y: w.y, n: w.kind === 'hole' ? 1 : 0, path: -1, at: 0 });
    return w.turns > 0;
  });
}

/** AI / HUD helper: a boss module that currently can't be hurt (sleeping Leviatán core) */
export function moduleImmune(b: Battle, side: number, moduleId: number) {
  const cells = b.sides[side].ship.moduleCells(moduleId);
  return cells.length > 0 && lateCellMul(b, side, cells[0]) <= 0;
}

/** parts the boss summons that fire on its turn (Arcanista's ink cats) */
export function summonShooters(b: Battle, side: number): Part[] {
  if (b.boss?.id !== 'arcanist' || b.cfg.boss?.side !== side) return [];
  return b.sides[side].parts.filter((p) => p.kind === 'ink' && p.alive && p.active);
}
