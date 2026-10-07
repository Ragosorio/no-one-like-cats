/**
 * Honest win estimate: instead of a power formula (which ignored your actual ship: layout, materials,
 * bulkheads…), the same headless sim the balance scripts use plays the stage N times with a decent
 * and a good aim (AI profiles normal / hard) and counts wins. ~20–30 ms per battle, run one per idle
 * slot so the panel never stutters. Also explains WHY: how your crew's elements fare against the
 * enemy hull materials, and how you tend to lose (crew K.O., sunk, core).
 */
import { CONTENT, catDef } from '../../data/content';
import { G } from '../game';
import { crew, layoutOf, mk } from './ship';
import { cat as getCat } from './cats';
import type { BattleSpec } from '../../scenes/BattleScene';
import { p2EnemyNotes } from '../../battle/multiverso';

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
  // Parte 2: what the multiverse cats on the other side will do (the sims above already play it)
  reasons.push(...p2EnemyNotes(spec.enemy.cats.flatMap((c) => c.elements)));
  return { reasons, tips };
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
export function simulateEstimate(key: string, build: () => BattleSpec, onUpdate?: (e: Estimate) => void, total = 12): Promise<Estimate> {
  const sig = signature(key);
  const hit = cache.get(sig);
  if (hit && performance.now() - hit.at < 120000) {
    onUpdate?.(hit.est);
    return Promise.resolve(hit.est);
  }
  const first = build();
  const why = matchup(first);
  const est: Estimate = { p: null, done: 0, total, reasons: why.reasons, tips: why.tips };
  onUpdate?.(est);
  return import('../../battle/autoplay').then(
    ({ autoBattle }) =>
      new Promise((resolve) => {
        void import('../../battle/ai').then(({ DIFFICULTY }) => {
          let wins = 0;
          const losses: Record<string, number> = {};
          const step = () => {
            const i = est.done;
            const spec = i === 0 ? first : build();
            const res = autoBattle(spec, i % 2 ? DIFFICULTY.hard : DIFFICULTY.normal, 1000 + i * 77, 30);
            if (res.won) wins++;
            else if (res.reason) losses[res.reason] = (losses[res.reason] ?? 0) + 1;
            est.done++;
            est.p = wins / est.done;
            onUpdate?.({ ...est });
            if (est.done < total) schedule(step);
            else {
              const worst = Object.entries(losses).sort((a, b) => b[1] - a[1])[0];
              if (worst && est.p < 0.7 && LOSS_TIP[worst[0]]) est.tips.unshift(LOSS_TIP[worst[0]]);
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
