/**
 * Microevents (GDD 2.12): 30 s – 3 min, RED sacred clocks (cannot be extended), triggered by
 * active play time (every 6–10 min), never during battles/modals. Ignoring them has no penalty.
 */
import { G } from '../game';
import { BAL, absStage, battleScrap } from '../econ';
import { frontier } from './campaign';

export type MicroId = 'pez_dorado' | 'gato_callejero' | 'cangrejo_chatarrero' | 'lluvia_pescaditos' | 'burbuja_resonancia';

export interface MicroDef {
  id: MicroId;
  name: string;
  durationMs: number;
  minKl: number;
  cond?: () => boolean;
  desc: string;
}

export const MICROS: MicroDef[] = [
  { id: 'pez_dorado', name: '¡PEZ DORADO!', durationMs: 45000, minKl: 3, desc: 'Un pez dorado cruza la costa. ¡Atrápalo!' },
  { id: 'cangrejo_chatarrero', name: 'CANGREJO CHATARRERO', durationMs: 90000, minKl: 5, desc: 'Un cangrejo carga tornillos. Dale 5 golpes antes de que llegue al agua.' },
  { id: 'gato_callejero', name: 'GATO CALLEJERO', durationMs: 120000, minKl: 4, desc: 'Un gato desconocido se esconde en tu isla. Encuéntralo.' },
  { id: 'lluvia_pescaditos', name: 'LLUVIA DE PESCADITOS', durationMs: 40000, minKl: 8, desc: '¡Llueven peces! Atrapa todos los que puedas.' },
  {
    id: 'burbuja_resonancia',
    name: 'BURBUJA DE RESONANCIA',
    durationMs: 60000,
    minKl: 1,
    cond: () => G.s.resonance.jobs.some((j) => !j.ready),
    desc: 'Una burbuja sale del Santuario. ¡Revientala!',
  },
];

export interface ActiveMicro {
  def: MicroDef;
  leftMs: number;
  progress: number;
}

let active: ActiveMicro | null = null;
let cooldownMs = 4 * 60 * 1000; // first one after ~4 min of island play
let lastId: MicroId | null = null;
let allowed = false;

/** the island scene enables spawning while it's on screen */
export function setMicroAllowed(v: boolean) {
  allowed = v;
}
export function currentMicro() {
  return active;
}

type Listener = (m: ActiveMicro | null, ended?: 'won' | 'expired') => void;
const listeners = new Set<Listener>();
export function onMicro(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit(ended?: 'won' | 'expired') {
  for (const l of listeners) l(active, ended);
}

function pick(): MicroDef | null {
  const kl = G.s.kl;
  const pool = MICROS.filter((m) => kl >= m.minKl && m.id !== lastId && (!m.cond || m.cond()));
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function spawnMicro(id?: MicroId) {
  if (active) return;
  const def = id ? MICROS.find((m) => m.id === id)! : pick();
  if (!def) return;
  active = { def, leftMs: def.durationMs, progress: 0 };
  lastId = def.id;
  G.count('micro_seen');
  emit();
}

export interface MicroReward {
  food?: number;
  gold?: number;
  scrap?: number;
  orbs?: { species: string; n: number };
  purr?: number;
}

/** player completed the microevent */
export function winMicro(extra = 1): MicroReward {
  if (!active) return {};
  const id = active.def.id;
  const r: MicroReward = {};
  switch (id) {
    case 'pez_dorado':
      r.food = Math.max(60, Math.round(G.foodPerSec * 300));
      G.add('food', r.food, 'micro');
      G.purr('mission', 'harvest');
      break;
    case 'cangrejo_chatarrero': {
      const f = frontier();
      r.scrap = battleScrap(absStage(f.zone, f.stage), false, 1);
      G.add('scrap', r.scrap, 'micro');
      break;
    }
    case 'gato_callejero': {
      const pool = G.s.cats;
      const sp = pool[Math.floor(Math.random() * pool.length)]?.species ?? 'c_canelo';
      r.orbs = { species: sp, n: 15 };
      G.addOrbs(sp, 15);
      G.count('strays');
      break;
    }
    case 'lluvia_pescaditos':
      r.food = Math.max(20, Math.round(G.foodPerSec * 4 * Math.min(40, extra)));
      G.add('food', r.food, 'micro');
      break;
    case 'burbuja_resonancia':
      G.purr('mission', 'discovery');
      r.purr = 1.5;
      break;
  }
  G.count('micro');
  G.bump('mission');
  active = null;
  cooldownMs = (6 + Math.random() * 4) * 60 * 1000;
  emit('won');
  return r;
}

G.tickers.push((dt) => {
  if (active) {
    active.leftMs -= dt; // RED clock: sacred, only counts while playing
    if (active.leftMs <= 0) {
      active = null;
      cooldownMs = (6 + Math.random() * 4) * 60 * 1000;
      emit('expired');
    }
    return;
  }
  if (!allowed) return;
  cooldownMs -= dt;
  if (cooldownMs <= 0) {
    cooldownMs = 60 * 1000;
    spawnMicro();
  }
});

export { BAL };
