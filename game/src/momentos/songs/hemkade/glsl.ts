/**
 * HEMKADE — the two looks of the same 3D world, in one shader chunk (docs/part-ii/29 §16).
 *
 *  COLOSO (the drops)   3D toon: three hard light bands + a rim, colored outlines (inverted hull), aerial fog toward the
 *                       horizon color so a 400 m whale READS as 400 m. Saturated, lit, loud.
 *  GRABADO (the breaks) the SAME meshes as a copperplate engraving: paper + ink, parallel hatch lines whose width grows
 *                       with the shadow, a cross-hatch in the deepest shade, lines that follow the form (uv) or the
 *                       world (sea, sky). `uReveal` draws the plate in, line by line, on the melody.
 *
 * `uStyle` 0 → 1 crosses between them (a smash is a 1-frame switch; a wipe uses `uWipe`, a screen-space edge).
 * Every material shares ONE uniform bundle (world.ts), so a single number restyles the whole world.
 */
export const STYLE_UNIFORMS = /* glsl */ `
uniform float uTime;
uniform float uStyle;
uniform float uWipe;
uniform float uReveal;
uniform vec3 uPaper;
uniform vec3 uInk;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform vec3 uAmbTop;
uniform vec3 uAmbBot;
uniform vec3 uFogCol;
uniform float uFogNear;
uniform float uFogFar;
uniform float uFogMax;
uniform float uKick;
uniform float uFlash;
uniform vec3 uFlashCol;
uniform vec2 uRes;
`;

export const STYLE_FUNCS = /* glsl */ `
// one family of parallel lines: ink coverage 0..1 for a shade 0..1 (0 = paper, 1 = solid ink)
float hatchLines(float s, float shade) {
  float w = clamp(shade, 0.0, 1.0);
  // distance to the nearest line centre (integer s), 0..1
  float d = abs(fract(s + 0.5) - 0.5) * 2.0;
  float aa = clamp(fwidth(s) * 2.0, 0.02, 0.5);
  return (1.0 - smoothstep(w - aa, w + aa, d)) * step(0.015, w);
}
// engraving: primary lines along s1, a cross-hatch along s2 in the deep shade; reveal hides the lines not drawn yet
vec3 engrave(float light, float s1, float s2, float seed) {
  float shade = 1.0 - clamp(light, 0.0, 1.0);
  float a = hatchLines(s1, shade * 1.05 - 0.08);
  float b = hatchLines(s2, (shade - 0.55) * 1.6);
  float ink = max(a, b);
  // the plate is drawn in: each line has its own moment (seeded), the reveal sweeps through them
  float lineId = floor(s1) + seed * 17.0;
  float due = fract(sin(lineId * 12.9898 + seed * 78.233) * 43758.5453);
  ink *= step(due, uReveal * 1.05);
  return mix(uPaper, uInk, ink);
}
// three hard bands (shadow / mid / light) + rim
vec3 toonShade(vec3 base, vec3 shadowCol, vec3 lightCol, float ndl, float rim) {
  float band = ndl > 0.55 ? 1.0 : (ndl > 0.08 ? 0.62 : 0.0);
  vec3 c = band >= 1.0 ? mix(base, lightCol, 0.35) : (band > 0.5 ? base : shadowCol);
  c += uSunCol * step(0.72, rim) * 0.35;
  return c;
}
float lightOf(vec3 n, vec3 viewDir) {
  return clamp(dot(n, normalize(uSunDir)), -1.0, 1.0);
}
vec3 fogIt(vec3 c, float dist, vec3 engraved) {
  float f = smoothstep(uFogNear, uFogFar, dist) * uFogMax;
  return mix(c, uFogCol, f);
}
// the two looks, mixed by uStyle (+ an optional screen wipe edge)
vec3 styleMix(vec3 toon, vec3 plate) {
  float s = uStyle;
  if (uWipe > 0.0) {
    float x = gl_FragCoord.x / uRes.x + (gl_FragCoord.y / uRes.y) * 0.18;
    s = step(x, uWipe * 1.2);
  }
  return mix(toon, plate, s);
}
`;

/** the common vertex varyings */
export const VARY = /* glsl */ `
varying vec3 vN;
varying vec3 vW;
varying vec2 vUv;
varying float vDist;
`;
