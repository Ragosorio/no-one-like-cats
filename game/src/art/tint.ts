import type { CatView } from './livingCat';
import { ColorMatrixFilter, Filter, Sprite } from 'pixi.js';
import { CAT_BY_ID, TintSpec } from '../data/content';

/**
 * Tinted variants (22 of the 54 catdex entries reuse an illustration):
 * hue rotate + saturation + brightness via ColorMatrix, overlay color via sprite tint mix.
 */
export function tintFilter(t: TintSpec | null | undefined): Filter | null {
  if (!t) return null;
  const cm = new ColorMatrixFilter();
  if (t.hue) cm.hue(t.hue, true);
  if (t.sat !== undefined && t.sat !== 1) cm.saturate(t.sat - 1, true);
  if (t.bright !== undefined && t.bright !== 1) cm.brightness(t.bright, true);
  return cm;
}

/** overlay color mixed into the sprite tint (multiply-ish) */
export function overlayTint(t: TintSpec | null | undefined): number {
  if (!t?.overlay) return 0xffffff;
  const a = Math.max(0, Math.min(1, t.overlayAlpha ?? 0.2));
  const c = parseInt(t.overlay.replace('#', ''), 16);
  const mix = (sh: number) => Math.round(255 * (1 - a) + ((c >> sh) & 255) * a);
  return (mix(16) << 16) | (mix(8) << 8) | mix(0);
}

/** apply a species' art tint to a sprite (keeps existing filters) */
export function applyCatTint(sprite: CatView, species: string) {
  const def = CAT_BY_ID.get(species);
  const t = def?.art.tint;
  if (!t) return;
  const f = tintFilter(t);
  if (f) sprite.filters = [f, ...(sprite.filters ?? [])];
  sprite.tint = overlayTint(t);
  if (t.scale) sprite.scale.set(sprite.scale.x * t.scale, sprite.scale.y * t.scale);
}

/** art slug for a species */
export function slugOf(species: string) {
  return CAT_BY_ID.get(species)?.art.slug ?? 'canelo_cozy_cat';
}
