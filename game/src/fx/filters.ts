import { Filter, GlProgram } from 'pixi.js';

/** Standard pixi v8 filter vertex shader. */
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

function rgb(hex: number): [number, number, number] {
  return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
}

/**
 * MANGA TINTA: threshold to ink/paper with diagonal hatching in mid-tones.
 * Used for impact frames, Spirit cats, manga panels.
 */
const INK_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform float uThreshold;
uniform float uHatch;
uniform vec3 uInk;
uniform vec3 uPaper;
uniform float uInvert;
void main() {
  vec4 c = texture(uTexture, vTextureCoord);
  if (c.a < 0.01) { finalColor = vec4(0.0); return; }
  vec3 col = c.rgb / c.a;
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  vec2 px = vTextureCoord * uInputSize.xy;
  float hatchLine = step(0.5, fract((px.x + px.y) / 6.0));
  float ink = 1.0 - smoothstep(uThreshold - 0.04, uThreshold + 0.04, l);
  float mid = smoothstep(uThreshold, uThreshold + 0.18, l) * (1.0 - smoothstep(uThreshold + 0.18, uThreshold + 0.3, l));
  ink = max(ink, mid * hatchLine * uHatch);
  ink = mix(ink, 1.0 - ink, uInvert);
  vec3 outc = mix(uPaper, uInk, ink);
  finalColor = vec4(outc * c.a, c.a);
}`;

export class InkFilter extends Filter {
  constructor(o: { threshold?: number; hatch?: number; ink?: number; paper?: number; invert?: boolean } = {}) {
    super({
      glProgram: GlProgram.from({ vertex: VERTEX, fragment: INK_FRAG, name: 'nolc-ink' }),
      resources: {
        inkUniforms: {
          uThreshold: { value: o.threshold ?? 0.42, type: 'f32' },
          uHatch: { value: o.hatch ?? 1, type: 'f32' },
          uInk: { value: new Float32Array(rgb(o.ink ?? 0x171317)), type: 'vec3<f32>' },
          uPaper: { value: new Float32Array(rgb(o.paper ?? 0xf4eee3)), type: 'vec3<f32>' },
          uInvert: { value: o.invert ? 1 : 0, type: 'f32' },
        },
      },
    });
  }
  set invert(v: boolean) {
    this.resources.inkUniforms.uniforms.uInvert = v ? 1 : 0;
  }
  set threshold(v: number) {
    this.resources.inkUniforms.uniforms.uThreshold = v;
  }
}

/**
 * CÓMIC: posterize + halftone dots in the shadows, slight saturation punch.
 * Gives the painted cats a printed-comic look so they sit in the poster world.
 */
const COMIC_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform float uLevels;
uniform float uDot;
uniform float uSat;
uniform float uStrength;
uniform vec3 uShadow;
void main() {
  vec4 c = texture(uTexture, vTextureCoord);
  if (c.a < 0.01) { finalColor = vec4(0.0); return; }
  vec3 col = c.rgb / c.a;
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 sat = mix(vec3(l), col, uSat);
  vec3 post = floor(sat * uLevels + 0.5) / uLevels;
  vec2 px = vTextureCoord * uInputSize.xy;
  // rotated grid (45deg)
  vec2 r = vec2(px.x + px.y, px.x - px.y) * 0.7071 / uDot;
  vec2 cell = fract(r) - 0.5;
  float radius = clamp((0.62 - l) * 1.1, 0.0, 0.75);
  float dotMask = 1.0 - smoothstep(radius - 0.06, radius + 0.06, length(cell));
  vec3 outc = mix(post, uShadow, dotMask * 0.55);
  outc = mix(col, outc, uStrength);
  finalColor = vec4(outc * c.a, c.a);
}`;

export class ComicFilter extends Filter {
  constructor(o: { levels?: number; dot?: number; sat?: number; strength?: number; shadow?: number } = {}) {
    super({
      glProgram: GlProgram.from({ vertex: VERTEX, fragment: COMIC_FRAG, name: 'nolc-comic' }),
      resources: {
        comicUniforms: {
          uLevels: { value: o.levels ?? 5, type: 'f32' },
          uDot: { value: o.dot ?? 5, type: 'f32' },
          uSat: { value: o.sat ?? 1.25, type: 'f32' },
          uStrength: { value: o.strength ?? 1, type: 'f32' },
          uShadow: { value: new Float32Array(rgb(o.shadow ?? 0x1f2b4a)), type: 'vec3<f32>' },
        },
      },
    });
  }
  set strength(v: number) {
    this.resources.comicUniforms.uniforms.uStrength = v;
  }
}

/**
 * SILUETA: flat color fill preserving alpha (for reveal silhouettes / shadows / color flashes).
 */
const SIL_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec3 uColor;
uniform float uMix;
void main() {
  vec4 c = texture(uTexture, vTextureCoord);
  vec3 col = c.a > 0.0 ? c.rgb / c.a : vec3(0.0);
  vec3 outc = mix(col, uColor, uMix);
  finalColor = vec4(outc * c.a, c.a);
}`;

export class SilhouetteFilter extends Filter {
  constructor(color = 0x171317, mix = 1) {
    super({
      glProgram: GlProgram.from({ vertex: VERTEX, fragment: SIL_FRAG, name: 'nolc-sil' }),
      resources: {
        silUniforms: {
          uColor: { value: new Float32Array(rgb(color)), type: 'vec3<f32>' },
          uMix: { value: mix, type: 'f32' },
        },
      },
    });
  }
  get mix() {
    return this.resources.silUniforms.uniforms.uMix as number;
  }
  set mix(v: number) {
    this.resources.silUniforms.uniforms.uMix = v;
  }
  set color(hex: number) {
    this.resources.silUniforms.uniforms.uColor = new Float32Array(rgb(hex));
  }
}
