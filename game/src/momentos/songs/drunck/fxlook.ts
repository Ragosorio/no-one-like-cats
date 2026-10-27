/**
 * «DRUNCK» — the Momento's own full-screen looks (filters it owns):
 *
 *  ColorWave  1930's black and white that COLOR breaks out of as a wave from a point (the burp of c38): outside the
 *             radius, contrasty film B/W; inside, the TV colors; a bright ring at the front. A transformation with
 *             preparation (the film), development (the wave grows) and exit (the whole frame in color) — docs/part-iii/13
 *             §2.2, never a dry cut from gray to color.
 *  inkMatrix  the sumi-e invasion of the bar (c19–20): a color matrix from the identity to ink washes on warm paper.
 */
import { ColorMatrixFilter, Filter, GlProgram } from 'pixi.js';

const VERTEX = `in vec2 aPosition;
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

const WAVE_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputClamp;
uniform vec2 uC;
uniform float uR;
uniform float uAmt;
uniform float uAspect;
void main() {
  vec4 c = texture(uTexture, vTextureCoord);
  vec3 col = c.a > 0.0 ? c.rgb / c.a : vec3(0.0);
  vec2 q = vTextureCoord / max(uInputClamp.zw, vec2(0.001));
  float d = length((q - uC) * vec2(uAspect, 1.0));
  float inside = 1.0 - smoothstep(uR - 0.025, uR + 0.025, d);
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 film = vec3(smoothstep(0.06, 0.94, l));
  vec3 g = mix(film, col, inside);
  float ring = (1.0 - smoothstep(0.0, 0.035, abs(d - uR))) * step(0.002, uR);
  g = mix(col, g, uAmt) + vec3(ring * 0.35 * uAmt);
  finalColor = vec4(g * c.a, c.a);
}`;

export class ColorWaveFilter extends Filter {
  constructor() {
    super({
      glProgram: GlProgram.from({ vertex: VERTEX, fragment: WAVE_FRAG, name: 'drunck-colorwave' }),
      resources: {
        wave: {
          uC: { value: new Float32Array([0.5, 0.5]), type: 'vec2<f32>' },
          uR: { value: 0, type: 'f32' },
          uAmt: { value: 1, type: 'f32' },
          uAspect: { value: 16 / 9, type: 'f32' },
        },
      },
    });
  }
  /** center in 0..1 of the visible frame, radius in frame heights, amount 0..1 */
  set(cx: number, cy: number, r: number, amt: number, aspect: number) {
    const u = this.resources.wave.uniforms as { uC: Float32Array; uR: number; uAmt: number; uAspect: number };
    u.uC[0] = cx;
    u.uC[1] = cy;
    u.uR = r;
    u.uAmt = amt;
    u.uAspect = aspect;
  }
}

/** the sumi-e matrix blended from the identity by `a` (0 = untouched, 1 = ink wash on warm paper) */
export function inkMatrix(f: ColorMatrixFilter, a: number) {
  // ink: luminance with a hard contrast, warmed toward paper in the lights and toward blue-black in the darks
  const l = [0.3, 0.59, 0.11];
  const c = 1.35;
  const off = -0.12;
  const ink = [
    l[0] * c * 1.02, l[1] * c * 1.02, l[2] * c * 1.02, 0, off + 0.02,
    l[0] * c * 0.98, l[1] * c * 0.98, l[2] * c * 0.98, 0, off + 0.0,
    l[0] * c * 0.9, l[1] * c * 0.9, l[2] * c * 0.9, 0, off - 0.01,
    0, 0, 0, 1, 0,
  ];
  const id = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
  f.matrix = id.map((v, i) => v + (ink[i] - v) * a) as typeof f.matrix;
}
