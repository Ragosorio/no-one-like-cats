/**
 * te ODIO — the cats in two arts (baked ONCE per cat, zero cost per frame):
 *
 *  COMIC   (the box's order) the toolkit's cel bake with comic-book settings: near-black ink, thick line, white rim,
 *          big print dots in the deepest shadow — a clean Sunday-paper cat
 *  STREET  (the Disruptores) that comic bake re-sprayed as a STENCIL: three hard tones per hue (ink · the cat's own
 *          color pushed to fluo · a pale wall tone), spray grain on the edges of each tone, a hard ink rim and a soft
 *          colored OVERSPRAY halo outside the silhouette
 *
 * Both textures have the painting's exact size, so the same CatPuppet rig wears either one (mesh.texture swap).
 */
import { Filter, GlProgram, RenderTexture, Sprite, type Texture, type Renderer } from 'pixi.js';
import type { CelOpts } from '../../anime/shaders';

/** comic-book settings for the toolkit's cel bake (Studio) */
export const COMIC_CEL: CelOpts = { ink: 0x17141d, rim: 0xffffff, line: 9, flat: 0.42, sat: 1.12, dot: 9, shadeTint: 0x8f93c8, light: [0.7, -0.7] };

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

const STENCIL_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec3 uInk;
uniform vec3 uWall;
uniform vec3 uHalo;
uniform float uHaloR;
uniform float uRim;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
vec3 un(vec4 c) { return c.a > 0.001 ? c.rgb / c.a : vec3(0.0); }
void main() {
  vec2 px = uInputSize.zw;
  vec2 uv = vTextureCoord;
  vec4 c = texture(uTexture, uv);
  vec2 P = uv * uInputSize.xy;
  // ring samples: the hard rim (just outside) and the soft overspray (far outside)
  float near = 0.0;
  float far = 0.0;
  float inner = 1.0;
  for (int k = 0; k < 16; k++) {
    float an = float(k) * 0.39269908;
    vec2 d = vec2(cos(an), sin(an));
    near = max(near, texture(uTexture, uv + d * uRim * px).a);
    far += texture(uTexture, uv + d * uHaloR * px).a + texture(uTexture, uv + d * uHaloR * 0.55 * px).a;
    inner = min(inner, texture(uTexture, uv + d * uRim * 0.6 * px).a);
  }
  far /= 32.0;
  float grain = hash(floor(P / 2.0));
  if (c.a < 0.5) {
    // outside: an ink rim, then a speckled colored overspray that fades out
    float rim = smoothstep(0.3, 0.6, near);
    float halo = clamp(far * 1.4, 0.0, 1.0) * (0.35 + 0.65 * step(0.45, grain)) * 0.55;
    vec3 col = mix(uHalo, uInk, rim);
    float a = max(rim, halo);
    finalColor = vec4(col * a, a);
    return;
  }
  vec3 col = un(c);
  float l = lum(col);
  // the cat's own hue pushed to fluo (the stencil keeps who it is)
  float mx = max(max(col.r, col.g), col.b);
  vec3 hue = col / max(mx, 0.05);
  hue = clamp(mix(vec3(lum(hue)), hue, 1.7), 0.0, 1.0);
  float j = (grain - 0.5) * 0.09;
  vec3 st;
  if (l + j < 0.27) st = uInk;
  else if (l + j < 0.6) st = mix(hue * 0.92, uInk, 0.12);
  else st = mix(hue, uWall, 0.62);
  // eyes / speculars survive as wall-white
  if (l > 0.9) st = uWall;
  // hard inner silhouette line (stencil cut)
  st = mix(st, uInk, (1.0 - smoothstep(0.35, 0.8, inner)) * 0.95);
  finalColor = vec4(st, 1.0) * c.a;
}`;

/** the STREET bake of a (comic-baked) painting; the caller owns the texture */
export function bakeStencil(renderer: Renderer, src: Texture, o: { ink?: number; wall?: number; halo?: number } = {}): RenderTexture {
  const res = src.source.resolution ?? 1;
  const scale = (src.width * res) / 1050;
  const v3 = (hex: number) => new Float32Array([((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255]);
  const f = new Filter({
    glProgram: GlProgram.from({ vertex: VERTEX, fragment: STENCIL_FRAG, name: 'teodio-stencil-bake' }),
    resources: {
      s: {
        uInk: { value: v3(o.ink ?? 0x141218), type: 'vec3<f32>' },
        uWall: { value: v3(o.wall ?? 0xf2eee4), type: 'vec3<f32>' },
        uHalo: { value: v3(o.halo ?? 0xff2e88), type: 'vec3<f32>' },
        uHaloR: { value: Math.max(6, 26 * scale), type: 'f32' },
        uRim: { value: Math.max(2, 7 * scale), type: 'f32' },
      },
    },
    resolution: res,
  });
  const sp = new Sprite(src);
  sp.filters = [f];
  const rt = RenderTexture.create({ width: src.width, height: src.height, resolution: res, antialias: false });
  renderer.render({ container: sp, target: rt, clear: true });
  sp.filters = [];
  sp.destroy();
  f.destroy();
  return rt;
}
