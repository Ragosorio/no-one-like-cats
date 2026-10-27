/**
 * LINTERNA MÁGICA — the kit: circular slides of hand-painted glass, aniline colours that glow, a brass rim, dust in the
 * beam, a flame that breathes. Each slide is composed once (Graphics + cats baked 'vidrio') and rasterized into a
 * texture, with a blurred twin (a memory that came in «out of focus»). The projection is an iris over the frame.
 *
 * References: 19th-century magic lantern slides (hand-painted glass, rackwork and slip slides), Étienne-Gaspard
 * Robertson's Fantasmagorie (1798), the aniline-dye slides of Carpenter & Westley (c. 1850).
 */
import { Container, Graphics, Rectangle, Sprite, type RenderTexture, type Texture } from 'pixi.js';
import type { Baker } from '../bake';
import { BAKE_UV } from '../bake';
import type { StylePrep } from './index';

export const LI = {
  amber: 0xf0a63a,
  amberL: 0xffd890,
  blue: 0x3a6fd0,
  blueD: 0x1a2f6a,
  rose: 0xd8607a,
  green: 0x4f9a5a,
  sepia: 0x7a5230,
  ink: 0x1e120a,
  cream: 0xf6e6c4,
};

export function prepLinterna(p: StylePrep) {
  p.baker.add('linterna:plates', 'placas de vidrio', () => {
    p.tex.set('li:brass', brassRing(p.baker, 1024));
    p.tex.set('li:beam', beamGlow(p.baker));
  });
}

/** the brass rim of a slide (an annulus with engraved ticks and an inner shadow), 1024² */
export function brassRing(b: Baker, size: number): RenderTexture {
  return b.shade(
    'li-brass',
    size,
    size,
    `${BAKE_UV}
void main() {
  vec2 uv = bakeUV() - 0.5;
  float r = length(uv) * 2.0;
  float ring = smoothstep(0.88, 0.9, r) * (1.0 - smoothstep(0.995, 1.0, r));
  float a = atan(uv.y, uv.x);
  float ticks = step(0.5, fract(a / 6.2831 * 72.0)) * step(0.93, r) * step(r, 0.96) * 0.3;
  vec3 brass = mix(vec3(0.45, 0.32, 0.12), vec3(0.95, 0.78, 0.42), 0.5 + 0.5 * sin(a * 2.0 + 0.7));
  brass *= 0.8 + 0.25 * vnoise(vec2(a * 30.0, r * 40.0)) - ticks;
  // the inner shadow on the glass edge
  float inner = smoothstep(0.7, 0.9, r) * (1.0 - ring) * 0.55 * (1.0 - step(0.9, r));
  vec4 c = vec4(brass * ring, ring) + vec4(0.0, 0.0, 0.0, inner * (1.0 - ring));
  finalColor = c;
}`,
    {},
    {},
    { res: 1 },
  );
}
/** the soft cone of the lantern's beam (for the haze around the projection) */
export function beamGlow(b: Baker): RenderTexture {
  return b.shade(
    'li-beam',
    512,
    512,
    `${BAKE_UV}
void main() {
  vec2 uv = bakeUV();
  float d = length(uv - 0.5) * 2.0;
  float a = exp(-d * d * 2.2) * (1.0 - smoothstep(0.9, 1.0, d));
  a *= 0.85 + 0.15 * vnoise(uv * 12.0);
  finalColor = vec4(vec3(1.0, 0.86, 0.6) * a, a);
}`,
    {},
    {},
    { res: 1 },
  );
}
/** painted glass: two aniline washes with brush streaks, round (the slide's ground) */
export function glass(b: Baker, size: number, top: number, bottom: number, seed = 1): RenderTexture {
  const c = (h: number) => new Float32Array([((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255]);
  return b.shade(
    `li-glass-${seed}`,
    size,
    size,
    `${BAKE_UV}
void main() {
  vec2 uv = bakeUV();
  float d = length(uv - 0.5) * 2.0;
  float inside = 1.0 - smoothstep(0.97, 1.0, d);
  float t = uv.y + (vnoise(uv * vec2(3.0, 9.0) + uSeed) - 0.5) * 0.25;
  vec3 col = mix(uTop, uBottom, smoothstep(0.1, 0.95, t));
  col *= 0.85 + 0.25 * vnoise(vec2(uv.x * 40.0 + uSeed, uv.y * 6.0));
  col += 0.12 * (1.0 - d);
  finalColor = vec4(col * inside, inside);
}`,
    { uTop: { value: c(top), type: 'vec3<f32>' }, uBottom: { value: c(bottom), type: 'vec3<f32>' }, uSeed: { value: seed * 3.1, type: 'f32' } },
    {},
    { res: 1 },
  );
}

export interface PlateTex {
  tex: Texture;
  soft: Texture;
}
/**
 * Compose a slide once: `draw(c, R)` puts Graphics / sprites into a container centred on (0, 0) with radius R; the
 * result is cut round, rasterized, and gets a blurred twin.
 */
export function bakePlate(b: Baker, R: number, ground: Texture, draw: (c: Container, R: number) => void): PlateTex {
  const c = new Container();
  const bg = new Sprite(ground);
  bg.anchor.set(0.5);
  bg.setSize(R * 2, R * 2);
  c.addChild(bg);
  const inner = new Container();
  draw(inner, R);
  c.addChild(inner);
  const mask = new Graphics().circle(0, 0, R * 0.97).fill(0xffffff);
  c.addChild(mask);
  inner.mask = mask;
  const holder = new Container();
  holder.addChild(c);
  c.position.set(R, R);
  const r = b.raster(holder, { frame: new Rectangle(0, 0, R * 2, R * 2) });
  return { tex: r.tex, soft: b.blurred(r.tex, 10) };
}
