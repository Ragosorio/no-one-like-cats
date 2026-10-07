/**
 * Honest win estimate: instead of a power formula (which ignored your actual ship: layout, materials,
 * bulkheads…), the same headless sim the balance scripts use plays the stage N times with a decent
 * and a good aim (AI profiles normal / hard) and counts wins. Run one per idle slot so the panel never
 * stutters. Also explains WHY: how your crew's elements fare against the enemy hull materials, and how
 * you tend to lose (crew K.O., sunk, core).
 *
 * The screen IS this sim: BattleScene only presents what `Battle` resolves, and every AI decision draws
 * from the same deterministic seeds (autoplay.ts `aiSeed`), so a battle seed + the same shots replays
 * the same battle on screen and headless (verified call by call: docs/guias/arquitectura.md). The only
 * thing the estimate has to assume is YOU: half the sims aim like a decent player, half like a good one.
 */
import { CONTENT, catDef } from '../../data/content';
import { G } from '../game';
import { crew, layoutOf, mk } from './ship';
import { cat as getCat } from './cats';
import type { BattleSpec } from '../../scenes/BattleScene';

export interface Estimate {
  /** 0–1 win rate from the sims (null while the first sims run) */
  p: number | null;
  /** sims done / planned */
  done: number;
  total: number;
  /** the why (short lines, Spanish) */
  reasons: string[];
  /** what to try */
  tips: string[];
  /** the full why: matchups + every hidden number of the stage (the "¿POR QUÉ?" sheet) */
  details: string[];
}

const MAT_NAME: Record<string, string> = Object.fromEntries((CONTENT.materials as { id: string; name: string }[]).map((m) => [m.id, m.name.split(' ')[0]]));
const MAT_MULT: Record<string, Record<string, number>> = Object.fromEntries((CONTENT.materials as { id: string; mult: Record<string, number> }[]).map((m) => [m.id, m.mult]));
const EL_NAME: Record<string, string> = Object.fromEntries((CONTENT.elements as { id: string; name: string }[]).map((e) => [e.id, e.name]));
const CHAR_MAT: Record<string, string> = { W: 'wood', I: 'iron', C: 'crystal', B: 'bone', V: 'void', S: 'stone', L: 'canvas' };

const cache = new Map<string, { at: number; est: Estimate }>();

function signature(key: string) {
  const c = crew()
    .map((u) => {
      const k = getCat(u);
      return k ? `${k.species}:${k.level}:${k.stars}` : u;
    })
    .join(',');
  const lay = layoutOf()
    .map((m) => `${m.kind}${m.x}.${m.y}`)
    .join('');
  return `${key}|${G.s.ship.active}|${['hull', 'weapon', 'engine', 'shield', 'core'].map((f) => mk(f as 'hull')).join('')}|${c}|${lay}`;
}

/** element vs enemy hull (static: from the blueprint the sim will use) */
function matchup(spec: BattleSpec): { reasons: string[]; tips: string[] } {
  const reasons: string[] = [];
  const tips: string[] = [];
  const count: Record<string, number> = {};
  for (const row of spec.enemy.blueprint.hull) for (const ch of row) if (CHAR_MAT[ch]) count[CHAR_MAT[ch]] = (count[CHAR_MAT[ch]] ?? 0) + 1;
  const total = Object.values(count).reduce((a, b) => a + b, 0) || 1;
  const main = Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!main) return { reasons, tips };
  const mult = MAT_MULT[main] ?? {};
  const els = crew()
    .map((u) => getCat(u))
    .filter((c): c is NonNullable<typeof c> => !!c)
    .map((c) => catDef(c.species).elements[0]);
  const share = Math.round(((count[main] ?? 0) / total) * 100);
  const weak = [...new Set(els.filter((e) => (mult[e] ?? 1) < 1))];
  const strong = [...new Set(els.filter((e) => (mult[e] ?? 1) > 1))];
  if (weak.length) reasons.push(`Su casco es ${share}% ${MAT_NAME[main]}: tus gatos de ${weak.map((e) => EL_NAME[e] ?? e).join(' y ')} le pegan ×${Math.min(...weak.map((e) => mult[e] ?? 1))}.`);
  if (strong.length) reasons.push(`Tus gatos de ${strong.map((e) => EL_NAME[e] ?? e).join(' y ')} le pegan ×${Math.max(...strong.map((e) => mult[e] ?? 1))} a la ${MAT_NAME[main]}.`);
  const best = Object.entries(mult)
    .filter(([, v]) => v > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([e]) => e)
    .filter((e) => G.s.elements.includes(e) && !els.includes(e));
  if (weak.length && best.length) tips.push(`Prueba con ${best.slice(0, 2).map((e) => EL_NAME[e] ?? e).join(' o ')}: ×${mult[best[0]]} contra ${MAT_NAME[main]}.`);
  const t = spec.meta?.tune;
  if (t && t.stage > 1.05) reasons.push(`Etapa reforzada: su barco y sus gatos x${t.stage.toFixed(1)} (toca ¿POR QUÉ?).`);
  return { reasons, tips };
}

const WEAPON_ES: Record<string, string> = { cannon: 'cañón', canon: 'cañón', roca: 'MORTERO de roca (Tierra, cae pesado y perfora 1)', mortero: 'mortero de magma (Fuego, perfora 1)', tesla: 'bobina Tesla (rayo)', riel: 'riel arcano (perfora 3, Maldice)', escarcha: 'lanzaescarcha', arpon: 'arpón', orbe_estelar: 'orbe estelar (Cósmico)', starbreaker: 'Starbreaker' };

/**
 * Everything the battle does that the power numbers don't say (player feedback: "enemy stone cats pierced
 * my ship but mine couldn't — did I need to level up?"): the stage's hidden multipliers, what the enemy
 * SHIP fires (not cats), the level of their cats (a cat is a card: same cat, same rules on both sides).
 */
export function hiddenRules(spec: BattleSpec): string[] {
  const out: string[] = [];
  const t = spec.meta?.tune;
  if (t) {
    const bits: string[] = [];
    if (Math.abs(t.hull - 1) > 0.04) bits.push(`casco x${t.hull.toFixed(2)}`);
    if (Math.abs(t.crewHp - 1) > 0.04) bits.push(`vida de sus gatos x${t.crewHp.toFixed(2)}`);
    if (Math.abs(t.dmg - 1) > 0.04) bits.push(`su daño x${t.dmg.toFixed(2)}`);
    if (bits.length) out.push(`Ajuste de esta pelea (aparte del Poder): ${bits.join(' · ')}.`);
  }
  const ra = spec.meta?.ratio;
  if (ra && Math.abs(Math.log(ra.S)) > 0.1) {
    const x = (n: number) => `x${n.toFixed(2)}`;
    out.push(`Poder: tienes el ${Math.round(ra.S * 100)}% del suyo. Eso pesa en la pelea: tu daño ${x(ra.pf)} y tu aguante ${x(ra.ph)}; su daño ${x(ra.ef)} y su aguante ${x(ra.eh)}.`);
  }
  // the enemy ship's own weapons
  const cannons = spec.enemy.blueprint.modules.filter((m) => m.kind === 'cannon').length;
  if (cannons) {
    const shots = spec.enemy.cannonShots ?? [];
    const names = Array.from({ length: cannons }, (_, i) => WEAPON_ES[shots[i]?.id ?? 'cannon'] ?? shots[i]?.name ?? 'cañón');
    const grouped = [...new Set(names)].map((n) => `${names.filter((x) => x === n).length}x ${n}`);
    out.push(`Su BARCO dispara solo al final de su turno: ${grouped.join(' + ')} (Mk ${spec.meta?.enemyWeaponMk ?? 3}: misma regla de puntería que tus cañones, Mk ${spec.meta?.weaponMk ?? 1}). Eso NO son sus gatos.`);
  }
  const lv = spec.enemy.cats[0]?.level;
  if (lv) out.push(`Sus gatos van a Nv ${lv}. Un gato es una carta: el mismo gato hace lo mismo de los dos lados (ej. Tierra Nv 20+ perfora una capa más; Nv 10+ explota más grande). Los tuyos además suman estrellas, rangos K.O. y accesorios; los de ellos van a 1 estrella.`);
  const sd = spec.suddenDeath ?? 10;
  if (spec.mode !== 'duel') out.push(sd > 0 ? `Muerte súbita desde el turno ${sd}: el mar inunda a los dos.` : 'Sin muerte súbita.');
  if (spec.intro?.lines?.length) for (const l of spec.intro.lines) if (l) out.push(l);
  return out;
}

/** sims per estimate: 24 keeps the sampling error around ±10 points (12 was ±14) */
export const EST_SIMS = 24;

/** what the estimate assumes about the player (first lines of the ¿POR QUÉ? sheet) */
function assumptions(n: number): string[] {
  return [
    `Cómo se calcula: ${n} peleas COMPLETAS con el mismo motor que la pantalla (tu barco, tu tripulación, sus reglas). La pelea en pantalla es exactamente esta simulación: nada se decide distinto al verla.`,
    `Qué supone de ti: la mitad de las peleas apunta como un capitán normal (±3°, lee el viento a medias, a veces elige mal el blanco) y la mitad como uno bueno (±1.5°, casi siempre el mejor blanco). Ambos corrigen con el tiro anterior y usan la ULTIMATE cuando está lista. Si apuntas peor, te irá peor; si afinas con la sombra del tiro, mejor.`,
  ];
}

const LOSS_TIP: Record<string, string> = {
  crew: 'Te noquean a la tripulación: sube nivel o estrellas, o lleva un tanque al frente.',
  sunk: 'Te hunden el barco: mejora el Casco o el Escudo en el Astillero.',
  core: 'Te revientan el núcleo: rodéalo de módulos o súbele el Mk.',
};

/**
 * Run (or reuse) the estimate. `build` returns a fresh spec (the sim mutates nothing outside it).
 * `onUpdate` fires after every sim so the UI can count up. Resolves with the final estimate.
 */
export function simulateEstimate(key: string, build: () => BattleSpec, onUpdate?: (e: Estimate) => void, total = EST_SIMS): Promise<Estimate> {
  const sig = signature(key);
  const hit = cache.get(sig);
  if (hit && performance.now() - hit.at < 120000) {
    onUpdate?.(hit.est);
    return Promise.resolve(hit.est);
  }
  const first = build();
  const why = matchup(first);
  const est: Estimate = { p: null, done: 0, total, reasons: why.reasons, tips: why.tips, details: [...assumptions(total), ...why.reasons, ...hiddenRules(first), ...why.tips] };
  onUpdate?.(est);
  return import('../../battle/autoplay').then(
    ({ autoBattleSteps }) =>
      new Promise((resolve) => {
        void import('../../battle/ai').then(({ DIFFICULTY }) => {
          let wins = 0;
          const losses: Record<string, number> = {};
          let run: ReturnType<typeof autoBattleSteps> | null = null;
          const step = () => {
            const i = est.done;
            if (!run) run = autoBattleSteps(i === 0 ? first : build(), i % 2 ? DIFFICULTY.hard : DIFFICULTY.normal, 1000 + i * 77, 30);
            // a few side-turns per idle slot (~10 ms), never a whole boss fight in one frame
            const t0 = performance.now();
            let r = run.next();
            while (!r.done && performance.now() - t0 < 10) r = run.next();
            if (!r.done) {
              schedule(step);
              return;
            }
            run = null;
            const res = r.value;
            if (res.won) wins++;
            else if (res.reason) losses[res.reason] = (losses[res.reason] ?? 0) + 1;
            est.done++;
            est.p = wins / est.done;
            onUpdate?.({ ...est });
            if (est.done < total) schedule(step);
            else {
              const worst = Object.entries(losses).sort((a, b) => b[1] - a[1])[0];
              // the honest margin of a sample this size (1 standard error, in points)
              const se = Math.round(100 * Math.sqrt(Math.max(0.04, est.p * (1 - est.p)) / total));
              est.details.splice(2, 0, `Margen: ±${se} puntos (son ${total} peleas, no infinitas). Ganaste ${wins} de ${total}.`);
              if (worst && est.p < 0.7 && LOSS_TIP[worst[0]]) {
                est.tips.unshift(LOSS_TIP[worst[0]]);
                est.details.push(LOSS_TIP[worst[0]]);
              }
              cache.set(sig, { at: performance.now(), est: { ...est } });
              onUpdate?.({ ...est });
              resolve(est);
            }
          };
          schedule(step);
        });
      }),
  );
}

function schedule(f: () => void) {
  const ric = (globalThis as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback;
  if (ric) ric(f, { timeout: 120 });
  else setTimeout(f, 16);
}

/** the label the stamp shows */
export function estimateLabel(e: Estimate) {
  if (e.p === null) return 'SIMULANDO…';
  const pct = Math.round(Math.max(0.03, Math.min(0.97, e.p)) * 100);
  return e.done < e.total ? `${pct}% (${e.done}/${e.total})` : `${pct}%`;
}
