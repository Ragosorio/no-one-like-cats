/**
 * PELÍCULAS — the FILM STAGE: a Momento StageApi that plays a FilmDef (MomentoRun drives it unchanged: clock, score,
 * clips, pause, prompts, quality).
 *
 * build (the loading screen; nothing of this happens on the clock):
 *   core jobs (stock tile, post, transition program, fonts) → each style's jobs → weather textures → the cats of each
 *   style (one Studio per style, its own bake) → each scene's SET (planes; 'static' / 'dof' planes are rasterized,
 *   'dof' ones also get a blurred copy for rack focus) → WARM: every scene drawn off-screen at its start, middle and
 *   end with its filters, the transition program run once per kind, a mask once — so no shader compiles, no texture
 *   uploads and no tessellation land on a frame. Then the bake manifest is checked (bakeManifest(def) ⊆ done).
 *
 * update (every frame, a pure function of film time m):
 *   activeAt(timeline, m) → the scene(s) on screen and the transition progress → each live scene: its 2.5D camera
 *   (frameCam / project per plane, rack focus = cross-fade to the blurred copy), its set, its weather → the transition
 *   filter on the right slot (reveal on the incoming one, conceal on the outgoing one) → the post look (blended
 *   between the two scenes) → the letterbox (aspect blended) → where subtitles sit.
 *
 * Every filter sits on a FULL-SCREEN host with a padded filterArea: after the camera transform and the viewport clip,
 * its pooled texture is always the viewport size (no per-frame render-texture allocation).
 */
import { Container, Graphics, Rectangle, Sprite, type Filter, type Texture } from 'pixi.js';
import type { Kit, StageApi, VerbFn } from '../momentos/anime/kit';
import { clip } from '../momentos/anime/kit';
import type { Palette } from '../momentos/anime/palette';
import { Actor, Studio } from '../momentos/anime/actor';
import { PostFilter } from '../momentos/anime/shaders';
import { catRig } from '../art/puppetCore';
import { G } from '../state/game';
import { catSlug } from '../state/sys/forms';
import type { FilmDef, FilmSceneDef, WeatherKind } from './types';
import { activeAt, bakeManifest, sceneTimeline, type FilmTimeline } from './timeline';
import { STYLES, WEATHER } from './catalog';
import { Baker } from './bake';
import { applyPost, bakeTile, look as mkLook, makePost, mixLook, type PostLook } from './post';
import { applyTransition, CONCEAL_KINDS, makeTransition, playedKind } from './transitions';
import { Letterbox, PRESENT_VERBS, SUB_IN_BAR, subZone, TYPE_FONTS } from './present';
import { bakeWeather, flashGrant, makeWeather, strikeEnv, type WeatherFx, type WeatherTex } from './weather';
import { boilStep, flatten, frameCam, project, sceneCam, toScreen, type FrameCam, type PlaneXform } from './camera';
import { STYLE_MODULES, type StyleModule } from './styles';
import { CAT_BAKES } from './styles/catbake';
import { sfx, type SfxName } from '../core/audio';
/** the SFX the 'sound' verb accepts (checked at runtime; unknown names stay silent) */
const SFX_NAMES: Record<string, true> = { nib: true, paper: true, meow: true, purr: true, glitch: true, whoosh: true, splash: true, boom: true, tick: true, pencil: true };

// ------------------------------------------------------------------ the set API (what a scene module writes)
export interface PlaneOpts {
  /** depth: 1000 = the subject plane (1:1 with the camera at rest), > 1000 farther, < 1000 nearer */
  z: number;
  parallax?: number;
  /** depth of field (world px per full blur) */
  dof?: number;
  /** 'static' = rasterized once (a frozen picture: cheap) · 'dof' = also a blurred copy (rack focus) · 'none' = live */
  bake?: 'none' | 'static' | 'dof';
  /** bake resolution multiplier (a plane the camera pushes into needs more) */
  res?: number;
  /** blur strength of the 'dof' copy (px) */
  blur?: number;
  /** pinned to the screen (no camera), drawn in front in z order */
  screen?: boolean;
}
export interface Plane extends PlaneOpts {
  holder: Container;
  node: Container | null;
  sharp?: Sprite;
  soft?: Sprite;
  /** this frame's placement (after update) */
  x: PlaneXform;
}
export interface FrameInfo {
  /** scene-local time and film time */
  lt: number;
  m: number;
  cam: FrameCam;
  rm: boolean;
  rf: boolean;
  /** a stepping key on 8 fps (the boil of painted frames) — constant with «Reducir movimiento» */
  boil: number;
  /** on 12 fps (hand-drawn lines) */
  step12: number;
  /** a plane point → screen (design box) this frame */
  toScreen(p: Plane, pt: [number, number]): [number, number];
  /** the lightning envelope this frame (0..1) */
  lit: number;
}
export interface SceneCtx {
  k: Kit;
  film: FilmDef;
  scene: FilmSceneDef;
  index: number;
  dur: number;
  baker: Baker;
  style: StyleModule;
  params: Record<string, number | string>;
  /** shared textures (style kits, weather) */
  tex(name: string): Texture | undefined;
  studio: Studio;
  actor(slug: string, size: number): Actor | null;
  still(slug: string, ax?: number, ay?: number): Sprite | null;
  silhouette(slug: string, ax?: number, ay?: number): Sprite | null;
  /** the same in another treatment (it must be listed in `cats` as `{ slug, bake }`) */
  actorAs(bake: string, slug: string, size: number): Actor | null;
  stillAs(bake: string, slug: string, ax?: number, ay?: number): Sprite | null;
  plane(node: Container, o: PlaneOpts): Plane;
  weather(kind: WeatherKind): WeatherFx | undefined;
  rm: boolean;
  rf: boolean;
  quality: 'high' | 'low';
  density: number;
  /** Canelo as the player has him (his form), else the cozy painting */
  canelo: string;
}
export interface FilmSet {
  update(lt: number, f: FrameInfo): void;
  /** post look overrides this frame (e.g. a colour that enters the mono world) */
  look?(lt: number, f: FrameInfo): Partial<PostLook> | null;
  /** named screen points ('subtitle', a face) */
  anchor?(name: string, f: FrameInfo): [number, number] | null;
  /** light at a screen point (rain caught in a lamp) */
  light?(x: number, y: number, lt: number): number;
  /** where the lens dirt glints (screen 0..1) */
  dirtAt?(lt: number, f: FrameInfo): [number, number];
  /** heat haze band [y0, y1 (0..1), px] */
  heat?(lt: number): [number, number, number] | null;
  /** extra filters the set owns (compiled during the warm) */
  filters?: Filter[];
  /**
   * FREE TOUCHES (interactive scenes like the night without Canelo): tappable spots this frame, screen coords. A tap
   * calls `tap(name, lt)`; the set plays a cosmetic gesture from that instant. Not prompts: never graded, never needed
   * (if nobody taps, the set plays the gesture on its own), ignored by scrub.
   */
  hotspots?(f: FrameInfo): { name: string; x: number; y: number; r: number }[];
  tap?(name: string, lt: number): void;
  destroy?(): void;
}
/** a cat in a treatment other than the scene style's (`CAT_BAKES` name: 'gris', 'plano', 'vidrio', 'klimt'…) */
export interface CatReq {
  slug: string;
  bake: string;
}
export interface SetModule {
  /** the cats this set needs (loaded before build: a slug in the style's treatment, or `{ slug, bake }`) */
  cats?: (string | CatReq)[] | ((ctx: { canelo: string; scene: string }) => (string | CatReq)[]);
  build(ctx: SceneCtx): FilmSet | Promise<FilmSet>;
}

// ------------------------------------------------------------------ the film's neutral palette (prompts, toolkit verbs)
export const FILM_PAL: Palette = {
  name: 'film',
  ink: 0x0b0716,
  shadow: 0x1c1830,
  base: 0x3a3550,
  light: 0xf2ede2,
  accent: 0xffc27a,
  accent2: 0x58d0ff,
  sky: [0x05060a, 0x0a0c14, 0x10131e],
  sea: [0x10131e, 0x0a0c14, 0x05060a],
  grade: { shade: 0x000000, glow: 0xffffff, sat: 1, tone: 0, vignette: 0 },
};

interface SceneRT {
  def: FilmSceneDef;
  index: number;
  style: StyleModule;
  params: Record<string, number | string>;
  slot: Container;
  root: Container;
  planes: Plane[];
  set: FilmSet | null;
  weather: WeatherFx[];
  look: PostLook;
  aspect: number;
  /** the last camera / frame info (anchors, subtitles) */
  info: FrameInfo | null;
}

function caneloSlug(): string {
  try {
    const c = G.s?.cats?.find((x) => x.species === 'c_canelo');
    if (c) {
      const s = catSlug(c);
      if (catRig(s)) return s;
    }
  } catch {
    /* no save */
  }
  return 'canelo_cozy_cat';
}
const styleIdOf = (s: FilmSceneDef['style']) => (typeof s === 'string' ? s : s.id);
const paramsOf = (s: FilmSceneDef['style']) => (typeof s === 'string' ? {} : (s.params ?? {}));
const BIG = new Rectangle(-4000, -4000, 1920 + 8000, 1080 + 8000);
const sm = (x: number) => x * x * (3 - 2 * x);

export interface FilmStageOpts {
  /** loading screen progress */
  onProgress?: (p: number, label: string) => void;
  /** a live run (not a scrub): only then do 'sound' cues play */
  live?: boolean;
  /** device px per design px */
  pxScale: number;
}

export class FilmStage implements StageApi {
  verbs: Record<string, VerbFn>;
  palettes = { film: FILM_PAL };
  props: Record<string, number | string> = { pal: 'film' };
  /** the toolkit's grade / screentone stays off (the film post grades); impacts / flashes still show */
  ownGrade = true;
  post: { filters: Filter[]; live: () => boolean };
  readonly tl: FilmTimeline;
  readonly baker: Baker;
  readonly tex = new Map<string, Texture>();
  readonly wtex: Partial<WeatherTex> = {};
  private studios = new Map<string, Studio>();
  private scenes: SceneRT[] = [];
  private postF: Filter | null = null;
  private trans: Filter | null = null;
  private letterbox = new Letterbox();
  private backdrop = new Graphics();
  private slots = new Container();
  private transOn: Container | null = null;
  /** lightning: the envelope of the strike being shown (set by the 'lightning' verb) */
  lit = 0;
  private litGrant = 1;
  /** DEV / tests: what was baked, how long it took, the manifest check */
  missing: string[] = [];
  readonly canelo = caneloSlug();
  private hasAspectKey = false;

  constructor(
    readonly k: Kit,
    readonly film: FilmDef,
    readonly o: FilmStageOpts,
  ) {
    this.tl = sceneTimeline(film);
    this.baker = new Baker(k.renderer, Math.max(0.75, Math.min(2, o.pxScale)));
    this.verbs = { ...PRESENT_VERBS, scene: () => null, lightning: this.lightningVerb, sound: this.soundVerb };
    this.post = { filters: [], live: () => !!this.postF };
  }

  // ---------------------------------------------------------------- build
  async build(k: Kit) {
    const b = this.baker;
    const film = this.film;
    this.hasAspectKey = !!k.score.keys.get('aspect')?.length;
    // the backdrop (never shows through a scene; transitions from / to black fade to it)
    k.layers.bg.addChild(this.backdrop);
    k.layers.world.addChildAt(this.slots, 0);
    k.layers.type.addChild(this.letterbox.g);
    // the Momento's scene container: a fixed filter area (its post never changes size)
    const sceneC = k.layers.bg.parent;
    if (sceneC) sceneC.filterArea = new Rectangle(k.view.x - 200, k.view.y - 200, k.view.w + 400, k.view.h + 400);

    b.add('core:tile', 'el grano de la película', () => {
      const tile = bakeTile(b);
      this.tex.set('core:tile', tile);
      this.postF = makePost(tile);
      this.post.filters = [this.postF];
    });
    b.add('core:post', 'el lente', () => {
      if (this.postF) b.warm(this.dummy(), [this.postF]);
    });
    b.add('core:transition', 'las transiciones', () => {
      this.trans = makeTransition();
    });
    b.add('core:type', 'la tipografía', async () => {
      await Promise.all(TYPE_FONTS.map((f) => document.fonts.load(f).catch(() => undefined)));
    });
    // the styles
    const used = [...new Set(film.scenes.map((s) => styleIdOf(s.style)))].filter((id) => STYLE_MODULES[id]);
    for (const id of used) {
      const mod = STYLE_MODULES[id];
      const params = Object.assign({}, ...film.scenes.filter((s) => styleIdOf(s.style) === id).map((s) => paramsOf(s.style)));
      mod.prepare?.({ baker: b, tex: this.tex, params });
    }
    // weather textures
    const wNeed = new Set<string>();
    for (const s of film.scenes) for (const w of s.weather ?? []) for (const j of WEATHER[w.kind]?.bakes ?? []) wNeed.add(j);
    for (const j of wNeed) b.add(j, 'el clima', () => bakeWeather(b, new Set([j]), this.wtex));
    // the cats, per style (their own bake)
    const hi = k.quality === 'high';
    const setMods = new Map<string, SetModule>();
    b.add('core:sets', 'los escenarios', async () => {
      await Promise.all(
        film.scenes.map(async (s) => {
          const mod = (await s.set()) as SetModule | { default: SetModule };
          setMods.set(s.id, 'build' in mod ? mod : mod.default);
        }),
      );
    });
    const catsOf = (sceneId: string): (string | CatReq)[] => {
      const c = setMods.get(sceneId)?.cats;
      return typeof c === 'function' ? c({ canelo: this.canelo, scene: sceneId }) : (c ?? []);
    };
    for (const id of used) {
      const job = STYLES[id]?.bakes.find((x) => x.endsWith('cats')) ?? `${id}:cats`;
      b.add(job, 'los gatos, pintados', async () => {
        const st = new Studio(k.renderer, hi, {}, STYLE_MODULES[id].catBake);
        this.studios.set(id, st);
        const cats = new Set<string>();
        for (const s of film.scenes) if (styleIdOf(s.style) === id) for (const x of catsOf(s.id)) if (typeof x === 'string') cats.add(x);
        await st.loadAll([...cats]);
      });
    }
    // the cats in other treatments (one Studio per treatment)
    b.add('cats:extra', 'los gatos, en otras lentes', async () => {
      const want = new Map<string, Set<string>>();
      for (const s of film.scenes)
        for (const x of catsOf(s.id)) {
          if (typeof x === 'string') continue;
          if (!CAT_BAKES[x.bake]) {
            console.warn('[film] tratamiento desconocido', x.bake);
            continue;
          }
          (want.get(x.bake) ?? want.set(x.bake, new Set()).get(x.bake)!).add(x.slug);
        }
      await Promise.all(
        [...want].map(([bake, slugs]) => {
          const st = new Studio(k.renderer, hi, {}, CAT_BAKES[bake]);
          this.studios.set(`bake:${bake}`, st);
          return st.loadAll([...slugs]);
        }),
      );
    });
    // the scenes
    film.scenes.forEach((s, i) => {
      b.add(`scene:${s.id}`, `escena ${i + 1}`, () => this.buildScene(s, i, setMods.get(s.id)));
    });
    b.add('core:warm', 'calentando la proyección', () => this.warmAll());
    await b.run(this.o.onProgress);
    const done = b.done;
    this.missing = bakeManifest(film).filter((j) => !done.has(j));
    if (this.missing.length) console.warn('[film] faltan horneados', this.missing);
  }
  private dummy() {
    const c = new Container();
    const sp = new Sprite(this.tex.get('core:tile'));
    sp.setSize(96, 54);
    c.addChild(sp);
    return c;
  }

  private async buildScene(def: FilmSceneDef, index: number, mod: SetModule | undefined) {
    const k = this.k;
    const id = styleIdOf(def.style);
    const style = STYLE_MODULES[id] ?? STYLE_MODULES.noir;
    const params = paramsOf(def.style);
    const slot = new Container();
    slot.filterArea = BIG;
    const root = new Container();
    root.pivot.set(960, 540);
    root.position.set(960, 540);
    slot.addChild(root);
    slot.visible = false;
    this.slots.addChild(slot);
    const studio = this.studios.get(id) ?? new Studio(k.renderer, false, {}, style.catBake);
    const planes: Plane[] = [];
    const weather: WeatherFx[] = [];
    for (const w of def.weather ?? []) {
      const fx = makeWeather(w, this.wtex, k.density);
      if (fx) weather.push(fx);
    }
    const rt: SceneRT = { def, index, style, params, slot, root, planes, set: null, weather, look: mkLook(this.film.look, style.look, params as Record<string, number>, def.look), aspect: def.aspect ?? 16 / 9, info: null };
    this.scenes[index] = rt;
    const ctx: SceneCtx = {
      k,
      film: this.film,
      scene: def,
      index,
      dur: def.dur,
      baker: this.baker,
      style,
      params,
      tex: (n) => this.tex.get(n),
      studio,
      actor: (slug, size) => (studio.has(slug) ? new Actor(studio, slug, size) : null),
      still: (slug, ax, ay) => studio.still(slug, ax, ay),
      silhouette: (slug, ax, ay) => studio.silhouette(slug, ax, ay),
      actorAs: (bake, slug, size) => {
        const st = this.studios.get(`bake:${bake}`);
        return st?.has(slug) ? new Actor(st, slug, size) : null;
      },
      stillAs: (bake, slug, ax, ay) => this.studios.get(`bake:${bake}`)?.still(slug, ax, ay) ?? null,
      plane: (node, o) => {
        const holder = new Container();
        holder.addChild(node);
        const p: Plane = { ...o, holder, node, x: { px: 960, py: 540, s: 1, blur: 0, hidden: false } };
        planes.push(p);
        return p;
      },
      weather: (kind) => weather.find((w) => w.kind === kind),
      rm: k.reduceMotion,
      rf: k.reduceFlashes,
      quality: k.quality,
      density: k.density,
      canelo: this.canelo,
    };
    if (mod) rt.set = await mod.build(ctx);
    // weather without a home goes in front (screen space); the set may have mounted some (fog between planes)
    for (const w of weather) if (!w.node.parent) ctx.plane(w.node, { z: w.spec.z ?? 0, screen: w.spec.z === undefined });
    // bake the frozen planes (+ their blurred copy for rack focus)
    for (const p of planes) {
      if (!p.bake || p.bake === 'none' || !p.node) continue;
      const node = p.node;
      p.holder.removeChild(node);
      const r = this.baker.raster(node, { res: this.baker.res * (p.res ?? 1) });
      const sharp = new Sprite(r.tex);
      sharp.position.set(r.x, r.y);
      p.holder.addChild(sharp);
      p.sharp = sharp;
      if (p.bake === 'dof') {
        const blur = p.blur ?? 14;
        const bt = this.baker.blurred(r.tex, blur);
        const soft = new Sprite(bt);
        const pad = Math.ceil(blur * 2);
        soft.position.set(r.x - pad, r.y - pad);
        soft.alpha = 0;
        p.holder.addChild(soft);
        p.soft = soft;
      }
      p.node = null;
    }
    // far → near, screen planes last
    const order = [...planes].sort((a, b) => (a.screen ? 1 : 0) - (b.screen ? 1 : 0) || b.z - a.z);
    for (const p of order) root.addChild(p.holder);
  }

  /** draw every scene off-screen at a few instants (with its filters), run each filter once */
  private warmAll() {
    const b = this.baker;
    for (const sc of this.scenes) {
      if (!sc) continue;
      // a few instants per scene, and for long scenes one every ~4 s (every slide / prop that appears late is drawn once)
      const n = Math.min(48, Math.max(3, Math.ceil(sc.def.dur / 4)));
      const samples = [0.02, 0.5, 0.98, ...Array.from({ length: n }, (_, i) => (i + 0.5) / n)];
      for (const f of samples) {
        this.updateScene(sc, sc.def.dur * f, this.tl.scenes[sc.index].start + sc.def.dur * f);
        sc.slot.visible = true;
        b.warm(sc.slot, this.trans ? [this.trans] : undefined);
        sc.slot.visible = false;
      }
      for (const f of sc.set?.filters ?? []) b.warm(this.dummy(), [f]);
    }
    // a mask once (cards write themselves under a mask)
    const c = this.dummy();
    const m = new Graphics().rect(0, 0, 40, 40).fill(0xffffff);
    c.addChild(m);
    (c.children[0] as Sprite).mask = m;
    b.warm(c);
    c.destroy({ children: true });
    if (this.postF && this.trans) b.warm(this.dummy(), [this.trans, this.postF]);
    // once at the REAL screen size, with the transition + post chain: the filter system's pooled textures of that size
    // exist before the clock (measured: the first live frame paid 70–130 ms allocating them)
    const first = this.scenes.find(Boolean);
    if (first && this.trans && this.postF) {
      const v = this.k.view;
      const rt = b.rt(v.w, v.h, this.o.pxScale);
      const wrap = new Container();
      const parent = first.slot.parent;
      const at = parent ? parent.getChildIndex(first.slot) : -1;
      try {
        first.slot.visible = true;
        first.slot.filters = [this.trans];
        wrap.addChild(first.slot);
        wrap.filters = [this.postF];
        wrap.filterArea = new Rectangle(0, 0, v.w, v.h);
        this.k.renderer.render({ container: wrap, target: rt, clear: true });
      } catch (e) {
        console.warn('[film] warm (full size)', e);
      } finally {
        wrap.filters = [];
        first.slot.filters = [];
        first.slot.visible = false;
        if (parent) parent.addChildAt(first.slot, at);
        wrap.destroy();
      }
    }
    // the toolkit's post only runs on impact / flash frames here (ownGrade): its program would compile on the first
    // lightning — measured, a 2.1 s stall. Compile it now through a twin (same cached program).
    const kp = new PostFilter();
    b.warm(this.dummy(), [kp, ...(this.postF ? [this.postF] : [])]);
    kp.destroy();
  }

  // ---------------------------------------------------------------- per frame
  private updateScene(sc: SceneRT, lt: number, m: number) {
    const k = this.k;
    const rm = k.reduceMotion;
    const fc = frameCam(sceneCam(sc.def, rm), lt, { reduceMotion: rm, seed: 3 + sc.index });
    sc.root.rotation = fc.roll;
    for (const p of sc.planes) {
      if (p.screen) {
        p.x = { px: 960, py: 540, s: 1, blur: 0, hidden: false };
        p.holder.pivot.set(0, 0);
        p.holder.position.set(0, 0);
        p.holder.scale.set(1);
        continue;
      }
      const d = flatten(p.z, rm);
      const x = project(fc, d, { dof: p.dof, parallax: p.parallax });
      p.x = x;
      // a plane the camera flies through fades out before it would fill the lens
      const dist = d - fc.state.z;
      const fade = dist < 360 ? sm(Math.max(0, Math.min(1, (dist - 40) / 320))) : 1;
      p.holder.visible = !x.hidden && fade > 0.003;
      if (!p.holder.visible) continue;
      p.holder.alpha = fade;
      p.holder.pivot.set(x.px, x.py);
      p.holder.position.set(960, 540);
      p.holder.scale.set(x.s);
      // rack focus: the blurred copy takes over (the sharp one fades under it, so thin things don't keep a hard edge)
      if (p.soft && p.sharp) {
        const k = sm(Math.min(1, x.blur * 1.15));
        p.soft.alpha = k;
        p.sharp.alpha = Math.max(0, 1 - k * 1.25);
      }
    }
    const info: FrameInfo = {
      lt,
      m,
      cam: fc,
      rm,
      rf: k.reduceFlashes,
      boil: boilStep(lt, rm),
      step12: Math.floor(lt * 12),
      toScreen: (p, pt) => {
        const [x, y] = toScreen(p.x, pt);
        if (!fc.roll) return [x, y];
        const c = Math.cos(fc.roll);
        const s2 = Math.sin(fc.roll);
        return [960 + (x - 960) * c - (y - 540) * s2, 540 + (x - 960) * s2 + (y - 540) * c];
      },
      lit: this.lit,
    };
    sc.info = info;
    sc.set?.update(lt, info);
    const light = sc.set?.light ? (x: number, y: number) => sc.set!.light!(x, y, lt) : undefined;
    for (const w of sc.weather) {
      const key = `${sc.def.id}.${w.kind}`;
      const amount = k.score.keys.get(key)?.length ? k.num(key, w.spec.amount ?? 1) : (w.spec.amount ?? 1);
      w.update(lt, { amount, cx: fc.cx, cy: fc.cy, rm, rf: k.reduceFlashes, light, lit: this.lit, density: k.density });
    }
  }

  update(k: Kit, m: number) {
    const v = k.view;
    const vk = `${v.x},${v.y},${v.w},${v.h}`;
    if (vk !== this.viewKey) {
      this.viewKey = vk;
      this.backdrop.clear().rect(v.x - 10, v.y - 10, v.w + 20, v.h + 20).fill(0x000000);
    }
    const act = activeAt(this.tl, m);
    this.lit = 0;
    for (const sc of this.scenes) {
      if (!sc) continue;
      const on = sc.index === act.a || sc.index === act.b;
      sc.slot.visible = on;
      if (!on) continue;
      sc.slot.position.set(0, 0);
      this.updateScene(sc, m - this.tl.scenes[sc.index].start, m);
    }
    // the transition
    const A = act.a >= 0 ? this.scenes[act.a] : null;
    const B = act.b >= 0 ? this.scenes[act.b] : null;
    let host: Container | null = null;
    let motion: [number, number] = [0, 0];
    if (act.t && this.trans) {
      const kind = playedKind(act.t, k.reduceMotion);
      if (kind === 'whip') {
        const dir = act.t.dir ?? -1;
        const e = act.p < 0.5 ? (act.p / 0.5) ** 3 : 1;
        const e2 = act.p >= 0.5 ? 1 - ((1 - (act.p - 0.5) / 0.5) ** 3) : 0;
        if (A) A.slot.position.set(dir * 2100 * e, 0);
        if (B) {
          B.slot.position.set(-dir * 2100 * (1 - e2), 0);
          B.slot.visible = act.p >= 0.5;
        }
        if (A) A.slot.visible = act.p < 0.5;
        const sp = act.p < 0.5 ? e : 1 - e2;
        motion = [dir * 70 * Math.sin(Math.min(1, sp) * Math.PI * 0.5), 0];
      } else if (kind !== 'cut') {
        const conceal = !B || ((CONCEAL_KINDS.has(kind) || !!act.t.out) && !!A);
        host = conceal ? (A?.slot ?? null) : (B?.slot ?? null);
        if (host) {
          // a live point (the set's anchor) wins over the authored one
          const src = A ?? B;
          const live = act.t.anchor && src?.set?.anchor && src.info ? src.set.anchor(act.t.anchor, src.info) : null;
          applyTransition(this.trans, live ? { ...act.t, at: live } : act.t, kind, act.p, conceal ? 1 : 0, v);
          // draw order: the filtered slot on top
          this.toTop(host);
        }
      }
    } else if (B) this.toTop(B.slot);
    else if (A) this.toTop(A.slot);
    if (this.transOn !== host) {
      if (this.transOn) this.transOn.filters = [];
      if (host && this.trans) host.filters = [this.trans];
      this.transOn = host;
    }
    // the look (blended through the transition), the set's live overrides, lightning exposure
    const la = A ? this.liveLook(A) : null;
    const lb = B ? this.liveLook(B) : null;
    let L = la && lb ? mixLook(la, lb, sm(act.p)) : (la ?? lb ?? mkLook());
    if (this.lit > 0) L = { ...L, expo: L.expo + this.lit * 0.55 * this.litGrant };
    const main = (act.p >= 0.5 ? B : A) ?? A ?? B;
    const info = main?.info;
    const heat = main?.set?.heat?.(info?.lt ?? 0) ?? (main?.def.weather?.some((w) => w.kind === 'heat') ? ([0.55, 0.85, 3] as [number, number, number]) : ([0, 0, 0] as [number, number, number]));
    if (this.postF) applyPost(this.postF, { look: L, m, motion: [motion[0] + (info?.cam.motion[0] ?? 0), motion[1]], heat, dirtAt: (info && main?.set?.dirtAt?.(info.lt, info)) ?? [0.5, 0.3], px: this.o.pxScale, reduceFlashes: k.reduceFlashes });
    // letterbox + where subtitles sit
    const aa = A?.aspect ?? B?.aspect ?? 16 / 9;
    const ab = B?.aspect ?? aa;
    const aspect = this.hasAspectKey ? k.num('aspect', 16 / 9) : A && B ? aa + (ab - aa) * sm(act.p) : (A ?? B)?.aspect ?? 16 / 9;
    this.letterbox.draw(v, aspect);
    const bar = this.letterbox.bottom;
    if (bar >= SUB_IN_BAR) {
      subZone.y = v.y + v.h - bar / 2;
      subZone.plate = false;
    } else {
      subZone.y = v.y + v.h - 96;
      subZone.plate = true;
    }
  }
  private viewKey = '';
  /** bring a slot to the top (only when it isn't: a re-order rebuilds the render group's instructions) */
  private toTop(c: Container) {
    const n = this.slots.children.length - 1;
    if (this.slots.getChildIndex(c) !== n) this.slots.setChildIndex(c, n);
  }
  private liveLook(sc: SceneRT): PostLook {
    const o = sc.set?.look && sc.info ? sc.set.look(sc.info.lt, sc.info) : null;
    return o ? { ...sc.look, ...o } : sc.look;
  }

  /** the free touches of the scene on screen now (playFilm mounts invisible buttons on them) */
  hotspotsNow(): { name: string; x: number; y: number; r: number }[] {
    const act = activeAt(this.tl, this.k.m);
    const sc = this.scenes[act.b >= 0 && act.p >= 0.5 ? act.b : act.a];
    return sc?.set?.hotspots && sc.info ? sc.set.hotspots(sc.info) : [];
  }
  tapHotspot(name: string) {
    const act = activeAt(this.tl, this.k.m);
    const sc = this.scenes[act.b >= 0 && act.p >= 0.5 ? act.b : act.a];
    if (sc?.info) sc.set?.tap?.(name, sc.info.lt);
  }

  anchor(name: string, k: Kit): [number, number] | null {
    const act = activeAt(this.tl, k.m);
    const sc = this.scenes[act.p >= 0.5 && act.b >= 0 ? act.b : act.a];
    if (!sc?.set?.anchor || !sc.info) return null;
    return sc.set.anchor(name, sc.info);
  }

  /** 'sound' { name }: a synthesized game SFX (core/audio SFX table) at the cue, live runs only (never in scrub) */
  private soundVerb: VerbFn = (k, a, cue) => {
    const name = String(a.name ?? '');
    const live = !!this.o.live;
    return clip(cue.m, 0.05, {
      mount: () => {
        if (live && name in SFX_NAMES) sfx(name as SfxName, Number(a.pitch ?? 1));
      },
    });
  };

  /** 'lightning' { scene }: the full-screen part of a strike, through the FlashGuard */
  private lightningVerb: VerbFn = (k, a, cue) => {
    let grant: 'full' | 'soft' | 'none' = 'soft';
    const self = this;
    return clip(cue.m, 0.9, {
      mount: () => {
        grant = flashGrant(k.guard, cue.m, k.reduceFlashes);
      },
      update: (lt) => {
        const e = strikeEnv([0], lt);
        const full = grant === 'full';
        self.lit = Math.max(self.lit, e);
        self.litGrant = full ? 1 : 0.25;
        const peak = full ? 0.42 : 0.12;
        if (e * peak > k.fx.flash) {
          k.fx.flash = e * peak;
          k.fx.flashColor = 0xdfe6ff;
        }
        // the thunder rolls in after the light (the camera's motion scale handles «Reducir movimiento»)
        if (lt > 0.35 && lt < 0.85) k.cam.shake(5 * (1 - (lt - 0.35) / 0.5), lt, 7);
      },
    });
  };

  /** DEV: the state of the stage */
  info() {
    return {
      length: this.tl.length,
      scenes: this.tl.scenes.map((s) => ({ id: s.id, start: s.start, end: s.end, in: s.inT.kind })),
      baked: [...this.baker.done],
      bakeMs: Math.round(this.baker.ms),
      bakeTimes: this.baker.times,
      missing: this.missing,
    };
  }

  destroy() {
    const filters: Filter[] = [];
    for (const sc of this.scenes) {
      if (!sc) continue;
      try {
        sc.set?.destroy?.();
      } catch (e) {
        console.warn('[film] set destroy', e);
      }
      for (const w of sc.weather) w.destroy();
      filters.push(...(sc.set?.filters ?? []));
      sc.slot.filters = [];
    }
    this.slots.destroy({ children: true });
    this.letterbox.g.destroy();
    this.backdrop.destroy();
    if (this.postF) filters.push(this.postF);
    if (this.trans) filters.push(this.trans);
    const studios = [...this.studios.values()];
    const baker = this.baker;
    // filters and textures may still be bound to the last frame's shaders: free them two frames later, filters first
    let n = 0;
    const later = () => {
      if (++n < 3) return void requestAnimationFrame(later);
      for (const f of filters) f.destroy();
      for (const s of studios) s.dispose();
      baker.dispose();
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(later);
    else later();
    this.studios.clear();
  }
}
