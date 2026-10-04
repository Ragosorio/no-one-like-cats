/**
 * Player name + gendered Spanish. Tokens in any string:
 *   {name}            → player name (fallback "grumete")
 *   {g:capitán|capitana|capi}  → masculine | feminine | neutral (3rd optional; defaults to masculine/feminine joined "capitán(a)")
 */
import { G } from '../state/game';

export function playerName(): string {
  return G.s.player?.name?.trim() || 'grumete';
}
export function playerGender(): 'm' | 'f' | 'x' {
  return G.s.player?.gender ?? 'x';
}
export function gword(m: string, f: string, x?: string): string {
  const g = playerGender();
  if (g === 'm') return m;
  if (g === 'f') return f;
  return x ?? `${m}/${f}`;
}
/** replace {name} and {g:m|f|x} tokens */
export function gtxt(s: string): string {
  return s.replace(/\{name\}/g, playerName()).replace(/\{g:([^|}]*)\|([^|}]*)(?:\|([^}]*))?\}/g, (_, m, f, x) => gword(m, f, x));
}
