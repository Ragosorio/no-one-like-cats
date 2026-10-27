/**
 * PELÍCULAS — shared GLSL (Pixi v8 / WebGL2): the filter vertex stage, noise, and a helper to make filters.
 *
 * Every film filter is created ONCE (build) and compiled during the loading screen (bake.ts warm), never on the clock.
 */
import { Filter, GlProgram, type TextureSource } from 'pixi.js';

export const VERTEX = `in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;
vec4 filterVertexPosition(void) {
  vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
  return vec4(position, 0.0, 1.0);
}
vec2 filterTextureCoord(void) { return aPosition * (uOutputFrame.zw * uInputSize.zw); }
void main(void) { gl_Position = filterVertexPosition(); vTextureCoord = filterTextureCoord(); }`;

/** hash / value noise / fbm / periodic noise (tileable) */
export const NOISE = `
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vnoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) { float a = 0.5; float s = 0.0; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
float pnoise(vec2 p, float per) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  vec2 i0 = mod(i, per); vec2 i1 = mod(i + 1.0, per);
  return mix(mix(hash12(i0), hash12(vec2(i1.x, i0.y)), u.x), mix(hash12(vec2(i0.x, i1.y)), hash12(i1), u.x), u.y);
}
float pfbm(vec2 p, float per) { float a = 0.5; float s = 0.0; for (int i = 0; i < 5; i++) { s += a * pnoise(p, per); p *= 2.0; per *= 2.0; a *= 0.5; } return s; }
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
`;

export type UniformSpec = Record<string, { value: number | Float32Array; type: string }>;

/**
 * a filter from a fragment source; `u` = its uniform group (filter.resources.filmU.uniforms — use `uni(f)`).
 * TRAP (measured): never pass `resolution: undefined` to a Filter — it overrides Pixi's 'inherit' default, the filter
 * system computes NaN bounds and SKIPS the filter silently (the container draws unfiltered).
 */
export function glFilter(name: string, frag: string, u: UniformSpec, extra: Record<string, TextureSource> = {}, o: { resolution?: number; padding?: number } = {}): Filter {
  return new Filter({
    glProgram: GlProgram.from({ vertex: VERTEX, fragment: frag, name }),
    resources: { filmU: u, ...extra },
    ...(o.resolution !== undefined ? { resolution: o.resolution } : {}),
    padding: o.padding ?? 0,
  });
}
/** a filter's uniform values (typed loosely) */
export const uni = (f: Filter) => (f.resources as { filmU: { uniforms: Record<string, number | Float32Array> } }).filmU.uniforms;
export const rgb = (hex: number) => new Float32Array([((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255]);
export function setRgb(a: Float32Array, hex: number) {
  a[0] = ((hex >> 16) & 255) / 255;
  a[1] = ((hex >> 8) & 255) / 255;
  a[2] = (hex & 255) / 255;
}
