/**
 * PELÍCULAS — the BAKER: everything heavy happens here, during the loading screen, never on the clock.
 *
 *  - jobs: named async steps (`style:what`) run in order; between jobs the baker yields one animation frame so the
 *    loading screen keeps moving, and reports progress. `done` lists what ran: the stage checks it against the film's
 *    bakeManifest before the clock starts.
 *  - helpers: run a fragment shader once into a new RenderTexture (`shade`), rasterize a container (`raster`, through
 *    a throwaway wrapper: Pixi turns the container you render() into a render group for good), a blurred copy
 *    (`blurred`), and `warm` (draw something once into a tiny target so its shapes are tessellated, its textures
 *    uploaded and its shaders compiled before the clock).
 *  - every texture it makes is OWNED by it (dispose() frees them all).
 *
 * Rule (measured by a previous agent): a filter on a container whose bounds change every frame allocates a render
 * texture every frame — a 0.7 s stall. Here every texture is made once with a fixed size; filters that run per frame
 * live on full-screen hosts with a padded filterArea (stage.ts) so their pooled texture never changes size.
 */
import { BlurFilter, Container, Rectangle, RenderTexture, Sprite, Texture, type Filter, type Renderer } from 'pixi.js';
import { glFilter, NOISE, type UniformSpec } from './gl';
import type { TextureSource } from 'pixi.js';

export interface BakeJob {
  name: string;
  /** a short label for the loading screen («pinceladas del cielo») */
  label: string;
  run: () => Promise<void> | void;
}

const nextFrame = () => new Promise<void>((r) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(() => r()) : setTimeout(r, 0)));
/** an idle moment of the main thread (at most 250 ms away) */
const idle = () =>
  new Promise<void>((r) => {
    const ric = (globalThis as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback;
    if (ric) ric(() => r(), { timeout: 250 });
    else setTimeout(r, 16);
  });

export class Baker {
  private jobs: BakeJob[] = [];
  readonly done = new Set<string>();
  readonly times: Record<string, number> = {};
  private owned: Texture[] = [];
  private warmRT: RenderTexture | null = null;
  /** total ms spent baking */
  ms = 0;
  constructor(
    readonly renderer: Renderer,
    /** the bake resolution cap (device px per design px; 1 on a 1080p screen) */
    readonly res: number,
  ) {}

  add(name: string, label: string, run: BakeJob['run']) {
    this.jobs.push({ name, label, run });
  }
  /** mark a manifest job as satisfied by work done elsewhere (e.g. a style that bakes several things in one job) */
  mark(name: string) {
    this.done.add(name);
  }
  get pending() {
    return this.jobs.length;
  }

  /**
   * run every queued job (more can be queued while running: they run too). `polite` (a film warmed ahead while another
   * one plays, agent FINAL): two frames and an idle moment between jobs, so the film on screen keeps its frames — asked
   * before every job when it is a function (nothing playing any more → full speed)
   */
  async run(progress?: (p: number, label: string) => void, polite: boolean | (() => boolean) = false) {
    let i = 0;
    while (this.jobs.length) {
      const j = this.jobs.shift()!;
      const total = i + 1 + this.jobs.length;
      progress?.(i / total, j.label);
      const t0 = performance.now();
      try {
        await j.run();
      } catch (e) {
        console.warn('[film] bake', j.name, e);
      }
      const dt = performance.now() - t0;
      this.ms += dt;
      this.times[j.name] = Math.round((this.times[j.name] ?? 0) + dt);
      this.done.add(j.name);
      i++;
      progress?.(i / (i + this.jobs.length), j.label);
      await nextFrame();
      if (typeof polite === 'function' ? polite() : polite) {
        await nextFrame();
        await idle();
      }
    }
  }

  // ---------------------------------------------------------------- texture helpers
  own<T extends Texture>(t: T): T {
    this.owned.push(t);
    return t;
  }
  rt(w: number, h: number, res = this.res): RenderTexture {
    return this.own(RenderTexture.create({ width: Math.max(2, Math.ceil(w)), height: Math.max(2, Math.ceil(h)), resolution: res, antialias: false }));
  }

  /**
   * Run a fragment shader once over a w×h canvas → a new texture. The shader gets `vTextureCoord` (0..1 over the
   * canvas, via uInputClamp), the NOISE functions, `uSize` (px) and the uniforms / textures you pass. With `src`, it
   * filters that texture instead (uTexture = src).
   */
  shade(name: string, w: number, h: number, body: string, u: UniformSpec = {}, extra: Record<string, TextureSource> = {}, o: { res?: number; src?: Texture } = {}): RenderTexture {
    const res = o.res ?? this.res;
    const frag = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputClamp;
uniform vec2 uSize;
${Object.entries(u)
  .map(([k, x]) => `uniform ${glslType(x.type)} ${k};`)
  .join('\n')}
${Object.keys(extra)
  .map((k) => `uniform sampler2D ${k};`)
  .join('\n')}
${NOISE}
${body}`;
    const f = glFilter(`film-bake-${name}`, frag, { uSize: { value: new Float32Array([w, h]), type: 'vec2<f32>' }, ...u }, extra, { resolution: res });
    const sp = new Sprite(o.src ?? Texture.WHITE);
    if (!o.src) sp.setSize(w, h);
    else sp.scale.set(w / o.src.width, h / o.src.height);
    sp.filters = [f];
    const target = this.rt(w, h, res);
    const wrap = new Container();
    wrap.addChild(sp);
    this.renderer.render({ container: wrap, target, clear: true });
    sp.filters = [];
    wrap.destroy({ children: true });
    f.destroy();
    return target;
  }

  /** draw a container into a new texture (its local bounds, or `frame`), through a throwaway wrapper */
  raster(c: Container, o: { res?: number; frame?: Rectangle; keep?: boolean } = {}): { tex: RenderTexture; x: number; y: number } {
    const b = o.frame ?? c.getLocalBounds().rectangle.clone();
    const res = o.res ?? this.res;
    const tex = this.rt(b.width, b.height, res);
    const parent = c.parent;
    const at = parent ? parent.getChildIndex(c) : -1;
    const px = c.position.x;
    const py = c.position.y;
    const wrap = new Container();
    try {
      wrap.addChild(c);
      c.position.set(-b.x, -b.y);
      this.renderer.render({ container: wrap, target: tex, clear: true });
    } finally {
      c.position.set(px, py);
      if (parent) parent.addChildAt(c, at);
      else wrap.removeChild(c);
      wrap.destroy();
      if (!o.keep && !parent) c.destroy({ children: true });
    }
    return { tex, x: b.x, y: b.y };
  }

  /** a blurred copy of a texture (one-time BlurFilter pass), at a lower resolution */
  blurred(src: Texture, strength: number, res = Math.max(0.35, this.res * 0.5)): RenderTexture {
    const pad = Math.ceil(strength * 2);
    const w = src.width + pad * 2;
    const h = src.height + pad * 2;
    const sp = new Sprite(src);
    sp.position.set(pad, pad);
    const f = new BlurFilter({ strength, quality: 4, resolution: res });
    const inner = new Container();
    inner.addChild(sp);
    inner.filters = [f];
    inner.filterArea = new Rectangle(0, 0, w, h);
    const target = this.rt(w, h, res);
    const wrap = new Container();
    wrap.addChild(inner);
    this.renderer.render({ container: wrap, target, clear: true });
    inner.filters = [];
    wrap.destroy({ children: true });
    f.destroy();
    return target;
  }

  /** draw once off-screen (tessellate shapes, upload textures, compile filters) */
  warm(c: Container, filters?: Filter[]) {
    this.warmRT ??= this.rt(96, 54, 1);
    const parent = c.parent;
    const at = parent ? parent.getChildIndex(c) : -1;
    const wrap = new Container();
    try {
      wrap.addChild(c);
      if (filters?.length) {
        wrap.filters = filters;
        wrap.filterArea = new Rectangle(0, 0, 96, 54);
      }
      this.renderer.render({ container: wrap, target: this.warmRT, clear: true });
    } catch (e) {
      console.warn('[film] warm', e);
    } finally {
      wrap.filters = [];
      if (parent) parent.addChildAt(c, at);
      else wrap.removeChild(c);
      wrap.destroy();
    }
  }

  dispose() {
    for (const t of this.owned) t.destroy(true);
    this.owned = [];
    this.warmRT = null;
    this.jobs = [];
  }
}

function glslType(t: string) {
  if (t.startsWith('vec2')) return 'vec2';
  if (t.startsWith('vec3')) return 'vec3';
  if (t.startsWith('vec4')) return 'vec4';
  if (t.startsWith('i32')) return 'int';
  return 'float';
}
/** the uv over a bake canvas (0..1), for shade() bodies */
export const BAKE_UV = `vec2 bakeUV() { return vTextureCoord / max(uInputClamp.zw, vec2(1e-4)); }`;
