/**
 * Boot hook for Momentos (imported once by main.ts; no Pixi). Registers the songs and repairs the optional save slice
 * `ext.momentos` on every load (never removes a completion; an empty / broken slice is dropped).
 */
import { G } from '../state/game';
import { normalizeMomentos } from './save';
import './songs';

G.afterLoad.push(() => {
  const ext = G.s?.ext;
  if (!ext || ext.momentos === undefined) return;
  const n = normalizeMomentos(ext.momentos);
  if (n) ext.momentos = n;
  else delete ext.momentos;
});
