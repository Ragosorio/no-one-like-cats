/**
 * Expansion secrets (GDD 2.16): each cleared expansion hides something.
 * Interactive ones are resolved here; battle ones (1: guardian duel, 6: silent orchestra) launch a
 * special battle (campaign.SPECIALS / buildDuel) and resolve when it's won.
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
  /** special battle id (campaign.SPECIALS) for 'battle' secrets */
  battle?: string;
  /** what the player must do, short */
  hint: string;
  /** cleared but gated (e.g. Reino 5 for the sealed sanctuary) */
  sealed: boolean;
  sealedReason?: string;
  available: boolean;
  done: boolean;
}

const KIND: Record<number, { kind: SecretKind; clicks?: number; minLevel?: number; hint: string; klGate?: number; battle?: string }> = {
  1: { kind: 'battle', battle: 'duel_guardian_bosque', hint: 'Abre el santuario (Reino 5) y vence al Guardián Musgoso en un Duelo de Gatos.', klGate: 5 },
  2: { kind: 'clicks', clicks: 10, hint: 'Saca el fósil a golpes: 10 clics.' },
  3: { kind: 'needs_fire_cat', minLevel: 10, hint: 'Enciende la forja con un gato de Fuego de nivel 10+.' },
  4: { kind: 'open', hint: 'Abre la botella que llegó al faro.' },
  5: { kind: 'needs_fire_cat', minLevel: 1, hint: 'Descongela al gato con un gato de Fuego.' },
  6: { kind: 'battle', battle: 'secret_orquesta', hint: 'Entra al Santuario Gatuno Antiguo: La Orquesta Muda.' },
  7: { kind: 'open', hint: 'Asómate a la concha gigante.' },
  8: { kind: 'open', hint: 'Enciende el faro del atolón.' },
};

export function secretInfo(n: number): SecretInfo {
  const e = EXPANSIONS[n - 1];
  const k = KIND[n];
  const cleared = G.s.expansions.cleared.includes(n);
  const done = G.s.expansions.secrets.includes(n);
  const gateOk = G.s.kl >= (k.klGate ?? 0);
  return {
    n,
    name: e.secret.name,
    kind: k.kind,
    clicksNeeded: k.clicks,
    minLevel: k.minLevel,
    battle: k.battle,
    hint: k.hint,
    sealed: cleared && !done && !gateOk,
    sealedReason: !gateOk ? `Sellado hasta Reino ${k.klGate}` : undefined,
    available: cleared && gateOk && !done,
    done,
  };
}

/** progress 0..1 for click secrets (without clicking) */
export function clickProgress(n: number) {
  const info = secretInfo(n);
  if (info.done) return 1;
  return Math.min(1, (G.s.counters[`secret_clicks_${n}`] ?? 0) / (info.clicksNeeded ?? 10));
}

/** progress for click secrets */
export function clickSecret(n: number): { progress: number; done: boolean; reward?: SecretReward | null } {
  const info = secretInfo(n);
  if (!info.available || info.kind !== 'clicks') return { progress: info.done ? 1 : 0, done: info.done };
  const key = `secret_clicks_${n}`;
  G.count(key);
  const p = G.s.counters[key] ?? 0;
  if (p >= (info.clicksNeeded ?? 10)) {
    const reward = resolveSecret(n);
    return { progress: 1, done: true, reward };
  }
  return { progress: p / (info.clicksNeeded ?? 10), done: false };
}

/** fire-cat secrets: the best qualifying cat (highest level), or undefined */
export function fireCatFor(n: number) {
  const info = secretInfo(n);
  return G.s.cats
    .filter((c) => catDef(c.species).elements.includes('fire') && c.level >= (info.minLevel ?? 1))
    .sort((a, b) => b.level - a.level)[0];
}
/** strongest fire cat even if under-levelled (for "needs Nv10" hints) */
export function bestFireCat() {
  return G.s.cats.filter((c) => catDef(c.species).elements.includes('fire')).sort((a, b) => b.level - a.level)[0];
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
export function secretReward(n: number) {
  return REWARDS[n];
}

export function resolveSecret(n: number): SecretReward | null {
  if (G.s.expansions.secrets.includes(n)) return null;
  const r = REWARDS[n];
  G.s.expansions.secrets.push(n);
  if (n === 6) G.count('void_fragments', 1);
  G.add('gems', r.gems, 'secret');
  if (r.orbs) G.addOrbs(r.orbs.species, r.orbs.n);
  if (r.unlock) {
    const [k, v] = r.unlock.split(':');
    if (k === 'rumor' && !G.s.catdex[v]) G.s.catdex[v] = 'rumor';
    if (k === 'rumor') G.count('secret_rumors');
    G.flag(r.unlock);
  }
  G.count(`secret_${n}`);
  G.count('secrets_found');
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

/** a won special battle resolves its secret (called by the island duel flow) */
export function resolveBattleSecret(battleId: string): SecretReward | null {
  for (const [n, k] of Object.entries(KIND)) if (k.battle === battleId && G.s.expansions.cleared.includes(Number(n))) return resolveSecret(Number(n));
  return null;
}
