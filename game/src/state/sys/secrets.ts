/**
 * Expansion secrets (GDD 2.16): each cleared expansion hides something.
 * Interactive ones are resolved here; battle ones (1: guardian duel, 6: silent orchestra) flag a pending battle.
 */
import { G } from '../game';
import { EXPANSIONS, catDef } from '../../data/content';

export type SecretKind = 'battle' | 'clicks' | 'needs_fire_cat' | 'open';

export interface SecretInfo {
  n: number;
  name: string;
  kind: SecretKind;
  clicksNeeded?: number;
  minLevel?: number;
  /** what the player must do, short */
  hint: string;
  available: boolean;
  done: boolean;
}

const KIND: Record<number, { kind: SecretKind; clicks?: number; minLevel?: number; hint: string; klGate?: number }> = {
  1: { kind: 'battle', hint: 'Abre el santuario (Reino 5) y vence al Guardián Musgoso.', klGate: 5 },
  2: { kind: 'clicks', clicks: 10, hint: 'Saca el fósil a golpes: 10 clics.' },
  3: { kind: 'needs_fire_cat', minLevel: 10, hint: 'Enciende la forja con un gato 🔥 de nivel 10+.' },
  4: { kind: 'open', hint: 'Abre la botella del faro.' },
  5: { kind: 'needs_fire_cat', minLevel: 1, hint: 'Descongela al gato con un gato 🔥.' },
  6: { kind: 'battle', hint: 'Entra al Santuario Gatuno Antiguo: La Orquesta Muda.' },
  7: { kind: 'open', hint: 'Asómate a la concha gigante.' },
  8: { kind: 'open', hint: 'Enciende el faro del atolón.' },
};

export function secretInfo(n: number): SecretInfo {
  const e = EXPANSIONS[n - 1];
  const k = KIND[n];
  const cleared = G.s.expansions.cleared.includes(n);
  return {
    n,
    name: e.secret.name,
    kind: k.kind,
    clicksNeeded: k.clicks,
    minLevel: k.minLevel,
    hint: k.hint,
    available: cleared && G.s.kl >= (k.klGate ?? 0) && !G.s.expansions.secrets.includes(n),
    done: G.s.expansions.secrets.includes(n),
  };
}

/** progress for click secrets */
export function clickSecret(n: number): { progress: number; done: boolean } {
  const info = secretInfo(n);
  if (!info.available || info.kind !== 'clicks') return { progress: 0, done: info.done };
  const key = `secret_clicks_${n}`;
  G.count(key);
  const p = G.s.counters[key] ?? 0;
  if (p >= (info.clicksNeeded ?? 10)) {
    resolveSecret(n);
    return { progress: 1, done: true };
  }
  return { progress: p / (info.clicksNeeded ?? 10), done: false };
}

/** fire-cat secrets: true if a qualifying cat exists */
export function fireCatFor(n: number) {
  const info = secretInfo(n);
  return G.s.cats.find((c) => catDef(c.species).elements.includes('fire') && c.level >= (info.minLevel ?? 1));
}

export interface SecretReward {
  gems: number;
  text: string;
  unlock?: string;
  orbs?: { species: string; n: number };
}

const REWARDS: Record<number, SecretReward> = {
  1: { gems: 2, text: 'El Guardián Musgoso se rinde. Te deja una pista: alguien fotografía colecciones…', unlock: 'rumor:s_lumen' },
  2: { gems: 2, text: '¡Sacaste el fósil! Está… ¿ronroneando?', orbs: { species: 'l_gea', n: 5 } },
  3: { gems: 2, text: '¡La Forja Dormida despierta! Nuevo tipo de arma: Mortero de Magma.', unlock: 'weapon:mortero' },
  4: { gems: 2, text: 'Una carta firmada con un antifaz: "Bonita isla. Me la quedo luego. —N."', unlock: 'rumor:s_noctis' },
  5: { gems: 2, text: '¡Descongelaste al gato! Te regala un cañón raro: Lanzaescarcha.', unlock: 'weapon:escarcha' },
  6: { gems: 4, text: 'La Orquesta Muda calla. Una partitura se vuelve gato…', unlock: 'cat:s_sonata' },
  7: { gems: 2, text: 'La concha refleja tu barco… y te regala el Escudo Espejo.', unlock: 'shield:espejo' },
  8: { gems: 4, text: 'El faro se enciende y apunta al horizonte: ahí espera el Leviatán.', unlock: 'story:faro' },
};

export function resolveSecret(n: number): SecretReward | null {
  if (G.s.expansions.secrets.includes(n)) return null;
  const r = REWARDS[n];
  G.s.expansions.secrets.push(n);
  G.add('gems', r.gems, 'secret');
  if (r.orbs) G.addOrbs(r.orbs.species, r.orbs.n);
  if (r.unlock) {
    const [k, v] = r.unlock.split(':');
    if (k === 'rumor' && !G.s.catdex[v]) G.s.catdex[v] = 'rumor';
    G.flag(r.unlock);
  }
  G.count(`secret_${n}`);
  G.xp('expansion', undefined, 0.3);
  return r;
}

/** open / fire-cat secrets in one call (UI decides how to animate) */
export function trySecret(n: number): SecretReward | null {
  const info = secretInfo(n);
  if (!info.available) return null;
  if (info.kind === 'open') return resolveSecret(n);
  if (info.kind === 'needs_fire_cat') return fireCatFor(n) ? resolveSecret(n) : null;
  return null;
}
