/**
 * POSADA — the kit: a linocut broadside. Cream paper with the press's speckle; shapes in black ink with white gouge
 * lines cut across them; the lights are where the knife took the wood away.
 *
 * References (public domain): José Guadalupe Posada, «La Calavera Catrina» (c. 1910–1913), the calaveras broadsides
 * printed by Antonio Vanegas Arroyo (1890–1913).
 */
import type { Graphics, RenderTexture } from 'pixi.js';
import type { Baker } from '../bake';
import { BAKE_UV } from '../bake';
import type { StylePrep } from './index';

export const PO = { ink: 0x0f0c0b, paper: 0xece2c8, paperD: 0xd8cba8, red: 0xa8322a };

export function prepPosada(p: StylePrep) {
  p.baker.add('posada:paper', 'papel de imprenta', () => {
    p.tex.set('po:paper', linoPaper(p.baker, 1024, 1024));
  });
}
/** cream paper, tileable, with ink speckle and uneven press */
export function linoPaper(b: Baker, w: number, h: number): RenderTexture {
  return b.shade(
    'po-paper',
    w,
    h,
    `${BAKE_UV}
void main() {
  vec2 uv = bakeUV();
  float n = pfbm(uv * 6.0, 6.0);
  vec3 col = mix(vec3(0.86, 0.8, 0.66), vec3(0.95, 0.91, 0.8), n);
  float speck = step(0.985, pnoise(uv * 380.0, 380.0));
  col = mix(col, vec3(0.1), speck * 0.7);
  finalColor = vec4(col, 1.0);
}`,
    {},
    {},
    { res: 1 },
  );
}
/** white gouge strokes across a rect (the knife's lines in a black shape) */
export function gouges(g: Graphics, x: number, y: number, w: number, h: number, o: { angle?: number; gap?: number; seed?: number; color?: number; len?: number; width?: number } = {}) {
  let s = ((o.seed ?? 1) * 2654435761) >>> 0 || 1;
  const r = () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
  const a = o.angle ?? -0.5;
  const gap = o.gap ?? 14;
  const len = o.len ?? 60;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  for (let yy = y; yy < y + h; yy += gap)
    for (let xx = x + (r() - 0.5) * gap; xx < x + w; xx += len * (0.8 + r() * 0.8)) {
      const l = len * (0.4 + r() * 0.6);
      g.moveTo(xx, yy + (r() - 0.5) * 3)
        .lineTo(xx + ca * l, yy + sa * l)
        .stroke({ width: (o.width ?? 3) * (0.6 + r() * 0.6), color: o.color ?? PO.paper, cap: 'round' });
    }
}
