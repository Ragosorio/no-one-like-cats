import { cachedRaster, storeRaster } from './rasterCache';
import { artUrl } from './artBase';
import { Assets, Container, Graphics, Sprite, Texture, Ticker } from 'pixi.js';
import { ART, CatPuppet, PuppetOptions, catRig } from './livingCat';
import { GlowFilter, OutlineFilter } from 'pixi-filters';
import gsap from 'gsap';
import { ComicFilter, InkFilter } from '../fx/filters';
import { glowTexture, sparkTexture, dotTexture } from './textures';
import { C } from '../ui/theme';
import { resolveFormSlug } from '../data/rupturas/formas';

/** Visual identity per element: aura colors + accent. Keys are element ids. */
export const ELEMENT_FX: Record<string, { main: number; accent: number; dark: number; particle: 'ember' | 'bubble' | 'leaf' | 'spark' | 'shard' | 'star' | 'rock' | 'wisp' | 'rune' | 'glitch' }> = {
  fire: { main: 0xff6a1a, accent: 0xffc94a, dark: 0x4e0000, particle: 'ember' },
  water: { main: 0x3569a3, accent: 0x7fd8ff, dark: 0x172b35, particle: 'bubble' },
  nature: { main: 0x5fbf4a, accent: 0xd4f27a, dark: 0x1f4a2a, particle: 'leaf' },
  earth: { main: 0xa8743f, accent: 0xe0b77a, dark: 0x3d2a1a, particle: 'rock' },
  electric: { main: 0xffe14a, accent: 0xffffff, dark: 0x3a3200, particle: 'spark' },
  storm: { main: 0xffe14a, accent: 0x00e5ff, dark: 0x1f2b4a, particle: 'spark' },
  ice: { main: 0x9fe8ff, accent: 0x7cffc4, dark: 0x1f2b4a, particle: 'shard' },
  wind: { main: 0xc6f0e4, accent: 0xffffff, dark: 0x3a6f6a, particle: 'wisp' },
  magic: { main: 0x8a5cff, accent: 0xff7ab8, dark: 0x231626, particle: 'rune' },
  spirit: { main: 0xb7a4c7, accent: 0xffffff, dark: 0x171317, particle: 'wisp' },
  cosmic: { main: 0x8a5cff, accent: 0x00e5ff, dark: 0x0d110f, particle: 'star' },
  void: { main: 0xff2e88, accent: 0xffffff, dark: 0x0d110f, particle: 'glitch' },
  light: { main: 0xffd77a, accent: 0xffffff, dark: 0xb89558, particle: 'star' },
  tech: { main: 0x00e5ff, accent: 0xff2e88, dark: 0x0d110f, particle: 'glitch' },
  sound: { main: 0xff2e88, accent: 0xffd400, dark: 0x231626, particle: 'spark' },
  time: { main: 0xe0b77a, accent: 0xd9c29a, dark: 0x6b4f2a, particle: 'rune' },
  shadow: { main: 0x5a4a78, accent: 0xc8102e, dark: 0x0d110f, particle: 'wisp' },
  // Parte II · Oleada 1: NÁCAR PRISMÁTICO (pearl white, sky prism, lilac, sea-glass)
  crystal: { main: 0x8fd3ff, accent: 0xf7f2ff, dark: 0x5b4a8a, particle: 'shard' },
};

export function elementFx(el: string) {
  return ELEMENT_FX[el] ?? ELEMENT_FX.fire;
}

/**
 * Cat art = MAI pure vectors only (no raster files are served). Two tiers, same logical 700×700
 * size so rigs/UVs/scales are identical:
 * - lite: traced from a 240 px downscale (~130–220 KB gzip) → rasterized at 700 px. Everything
 *   waits on this one (island, battle, shop, catdex grids).
 * - full: the approved high-color-preserved trace (game-compact, pixel-identical) → rasterized at
 *   1050 px. Loaded in the background only when a puppet is drawn bigger than ~640 px on screen.
 */
export function catLiteUrl(slug: string) {
  return artUrl(`cats-svg/lite/${slug}.svg`);
}
export function catSvgUrl(slug: string) {
  return artUrl(`cats-svg/${slug}.svg`);
}
/** the lite trace has ~12k paths: rasterizing it at full logical size costs little and stays crisp to ~700 px */
const LITE_RES = 1;
const FULL_RES = 1.5;

/**
 * Paintings that are decided (slug fixed in content.json) but not produced yet: until the art pipeline
 * drops `cats-svg/<slug>.svg` + `lite/<slug>.svg` AND its rig in catRigs.json, the cat wears a tinted
 * stand-in painting (an existing one, multiplied by the element's color) so nothing breaks or shows a
 * white square. The moment the rig exists, the real painting is used — no code change needed.
 * Parte 2: the 24 cats of Hielo, Sonido, Sombra, Tiempo, Luz and Vacío.
 */
const STAND_IN: Record<string, [base: string, tint: number]> = {
  copito_snowball_cat: ['nube_dream_cat', 0xcdeeff],
  escarcha_frost_cat: ['selene_moonlit_cat', 0xbfe3ff],
  tempano_iceplate_cat: ['fossilstone_guardian_cat', 0xbde6ff],
  boreas_aurora_cat: ['regal_cosmic_cat', 0xc8f5ea],
  tamborin_drum_cat: ['mochi_bell_cat', 0xffc2df],
  djbigotes_dj_cat: ['bytewhisker_cat', 0xffd0e6],
  diva_pop_cat: ['sonata_prima_cat', 0xffc8dc],
  headliner_rock_cat: ['mecha_neon_cat', 0xffd6a0],
  sombrita_shadow_cat: ['nori_lunar_cat', 0x9a8fb0],
  kage_ninja_cat: ['masquerade_phantom_cat', 0xa898b8],
  titiritera_puppet_cat: ['storybook_ink_cat', 0xb0a0c0],
  medianoche_king_cat: ['deepsea_sprite_cat', 0x8f7fa8],
  tic_pocketwatch_cat: ['steampunk_clockwork_cat', 0xe8d2a8],
  arenita_sand_cat: ['kintsugi_tea_spirit_cat', 0xf0d9a8],
  pendulo_clock_cat: ['arce_autumn_cat', 0xe6cfa0],
  cronos_astrolabe_cat: ['lumen_lens_cat', 0xead6ac],
  destello_firefly_cat: ['margarita_daisy_cat', 0xfff0b8],
  vitral_stainedglass_cat: ['prism_crystal_cat', 0xffe8c0],
  faro_lighthouse_cat: ['lantern_spirit_cat', 0xfff0c0],
  aurea_halo_cat: ['sol_sunbeam_cat', 0xfff4c8],
  hueco_hole_cat: ['alien_galaxy_cat', 0xc8a8d8],
  ecomudo_static_cat: ['neon_glitch_cat', 0xd0d0d8],
  devoradora_portal_cat: ['candy_alchemist_cat', 0xd8a0c8],
  nadie_static_cat: ['iridescent_origami_cat', 0xa0a0b0],
};
/** generic stand-in when a slug's file fails to load at runtime (404, offline cache miss…) */
const FALLBACK_SLUG = 'nube_dream_cat';
/** slugs whose own file failed to load this session */
const missingArt = new Set<string>();

/** the painting actually drawn for `slug` (itself once its art + rig exist; else its stand-in) */
export function artSlug(slug: string): string {
  if (catRig(slug)) return slug;
  // a FORM whose painting isn't in this build yet draws the original's, untinted (data/rupturas/formas.ts)
  const base = resolveFormSlug(slug, (x) => !!catRig(x));
  if (base !== slug) return artSlug(base);
  const s = STAND_IN[slug];
  if (s) return s[0];
  return missingArt.has(slug) ? FALLBACK_SLUG : slug;
}
/** multiply tint of a stand-in painting (undefined = real painting) */
export function standInTint(slug: string): number | undefined {
  if (catRig(slug)) return undefined;
  return STAND_IN[slug]?.[1] ?? (missingArt.has(slug) ? 0xb8b0a8 : undefined);
}
/** true while the cat is drawn with a stand-in painting */
export function isStandIn(slug: string) {
  return artSlug(slug) !== slug;
}

/** a cached raster from a previous session (fast, decoded off-thread) or the SVG itself (then cached) */
async function loadRasterOrSvg(url: string, res: number): Promise<Texture> {
  const hit = await cachedRaster(url, res);
  if (hit) return hit;
  const t = await Assets.load<Texture>({ alias: url, src: url, data: { resolution: res } });
  storeRaster(url, res, t);
  return t;
}

const liteTex = new Map<string, Texture>();
const litePending = new Map<string, Promise<Texture>>();
function loadLite(raw: string): Promise<Texture> {
  const slug = artSlug(raw);
  const hit = liteTex.get(slug);
  if (hit) return Promise.resolve(hit);
  let p = litePending.get(slug);
  if (!p) {
    const url = catLiteUrl(slug);
    p = loadRasterOrSvg(url, LITE_RES).then((t) => {
      liteTex.set(slug, t);
      litePending.delete(slug);
      return t;
    });
    p.catch(() => {
      litePending.delete(slug);
      // the file isn't there (yet): from now on this slug draws the generic stand-in
      if (slug !== FALLBACK_SLUG && !catRig(slug)) missingArt.add(slug);
    });
    litePending.set(slug, p);
  }
  return p;
}

const svgTex = new Map<string, Texture>();
const svgState = new Map<string, 'queued' | 'loading' | 'failed'>();
const svgWaiters = new Map<string, Set<(t: Texture) => void>>();
const svgQueue: string[] = [];
let svgActive = 0;

function pumpSvg() {
  while (svgActive < 2 && svgQueue.length) {
    const slug = svgQueue.shift()!;
    svgActive++;
    svgState.set(slug, 'loading');
    const url = catSvgUrl(slug);
    const go = () =>
      loadRasterOrSvg(url, FULL_RES)
        .then((tex) => {
          svgTex.set(slug, tex);
          svgState.delete(slug);
          const ws = svgWaiters.get(slug);
          svgWaiters.delete(slug);
          ws?.forEach((cb) => cb(tex));
        })
        .catch(() => svgState.set(slug, 'failed'))
        .finally(() => {
          svgActive--;
          pumpSvg();
        });
    // the SVG decode is main-thread work: start it when the frame has slack
    const ric = (globalThis as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback;
    if (ric) ric(go, { timeout: 600 });
    else setTimeout(go, 16);
  }
}

/** ask for the full-detail vector (background; no-op if loaded/loading) */
export function requestCatSvg(raw: string) {
  const slug = artSlug(raw);
  if (svgTex.has(slug) || svgState.has(slug)) return;
  svgState.set(slug, 'queued');
  svgQueue.push(slug);
  pumpSvg();
}

/** `cb` gets the full-detail texture when it exists (now if loaded). Does NOT request it. Returns an unsubscribe. */
export function onCatArt(raw: string, cb: (t: Texture) => void): () => void {
  const slug = artSlug(raw);
  const ready = svgTex.get(slug);
  if (ready) {
    cb(ready);
    return () => undefined;
  }
  let set = svgWaiters.get(slug);
  if (!set) svgWaiters.set(slug, (set = new Set()));
  set.add(cb);
  return () => svgWaiters.get(slug)?.delete(cb);
}

export async function loadCatTexture(slug: string): Promise<Texture> {
  await loadLite(slug).catch(() => undefined);
  return catTexture(slug);
}

/** waits for the lite vectors (fast); full detail streams in later where it is needed */
export async function preloadCats(slugs: string[]) {
  // a painting that can't load must never block an island or a battle (its stand-in takes over)
  await Promise.all([...new Set(slugs.map(artSlug))].map((s) => loadLite(s).catch(() => undefined)));
}

/** best available painting: full vector if rasterized, else the lite vector, else WHITE (= not loaded) */
export function catTexture(raw: string): Texture {
  const slug = artSlug(raw);
  return svgTex.get(slug) ?? liteTex.get(slug) ?? Texture.WHITE;
}

/**
 * A living painting: CatPuppet mesh (MAI rig). Starts with whatever vector tier is loaded (hidden
 * until one is), upgrades itself to the full-detail vector when it is drawn big.
 * Drop-in for `new Sprite(catTexture(slug))` (same default anchor 0,0, `anchor.set`, tint, filters, texture).
 */
export function livingCat(raw: string, o: PuppetOptions & { detail?: boolean } = {}): CatPuppet {
  const slug = artSlug(raw);
  const tex = catTexture(slug);
  const p = new CatPuppet(tex === Texture.WHITE ? Texture.EMPTY : tex, slug, { anchorX: 0, anchorY: 0, ...o });
  // a stand-in painting wears its element's color so two cats never look identical
  const tint = standInTint(raw);
  if (tint !== undefined) p.tint = tint;
  if (tex === Texture.WHITE) {
    p.renderable = false;
    void loadLite(slug)
      .then((t) => {
        if (p.destroyed || p.renderable) return;
        p.texture = t;
        p.renderable = true;
      })
      // its file is missing: show the generic stand-in instead of nothing (the rig stays the original's)
      .catch(() =>
        loadLite(FALLBACK_SLUG).then((t) => {
          if (p.destroyed || p.renderable) return;
          p.texture = t;
          p.tint = 0xb8b0a8;
          p.renderable = true;
        }),
      )
      .catch(() => undefined);
  }
  const off = onCatArt(slug, (t) => {
    if (p.destroyed) return;
    p.texture = t;
    p.renderable = true;
  });
  p.once('destroyed', off);
  p.onWantDetail = () => requestCatSvg(slug);
  if (o.detail) requestCatSvg(slug);
  return p;
}

/** The cute island form: painted sprite + soft shadow + breathing on twos. */
export class IslandCat extends Container {
  sprite: CatPuppet;
  shadow: Graphics;
  private t = Math.random() * 10;
  private acc = 0;
  baseScale: number;
  constructor(slug: string, public size = 120) {
    super();
    this.shadow = new Graphics().ellipse(0, 0, size * 0.32, size * 0.08).fill({ color: C.ink, alpha: 0.22 });
    this.sprite = livingCat(slug, { anchorX: 0.5, anchorY: 0.94, fps: 12, acts: 'all' });
    this.baseScale = size / ART;
    this.sprite.scale.set(this.baseScale);
    this.addChild(this.shadow, this.sprite);
    Ticker.shared.add(this.tick, this);
  }
  private tick(t: Ticker) {
    this.acc += t.deltaMS / 1000;
    if (this.acc < 1 / 12) return; // on twos
    this.t += this.acc;
    this.acc = 0;
    // breathing slows down asleep; the contact shadow follows the body off the ground
    const b = Math.sin(this.t * (this.sleeping ? 1.1 : 2.2));
    const sx = Math.sign(this.sprite.scale.x) || 1;
    this.sprite.scale.set(sx * this.baseScale * (1 + b * 0.012), this.baseScale * (1 - b * (this.sleeping ? 0.026 : 0.018)));
    const lift = Math.min(1, Math.max(0, -this.sprite.y / (this.size * 0.3)));
    this.shadow.scale.set(1 - lift * 0.45, 1 - lift * 0.45);
    this.shadow.alpha = 1 - lift * 0.5;
  }
  sleeping = false;
  hop() {
    this.sprite.emote('happy');
    // anticipation squash → airborne stretch → landing squash (the puppet does the body, the tween the jump)
    this.sprite.crouch = 0.8;
    gsap.timeline()
      .call(() => (this.sprite.crouch = -0.35), [], 0.09)
      .to(this.sprite, { y: -this.size * 0.25, duration: 0.18, ease: 'power2.out' }, 0.09)
      .call(() => (this.sprite.crouch = 0), [], 0.2)
      .to(this.sprite, { y: 0, duration: 0.22, ease: 'bounce.out' })
      .call(() => (this.sprite.crouch = 0.55), [], '-=0.12')
      .call(() => (this.sprite.crouch = 0), [], '+=0.08');
  }
  face(dir: 1 | -1) {
    this.sprite.scale.x = Math.abs(this.sprite.scale.x) * dir;
  }
  override destroy() {
    Ticker.shared.remove(this.tick, this);
    super.destroy({ children: true });
  }
}

/**
 * Battle Form: the same painting pushed into "anime print" — comic posterize + halftone,
 * thick ink outline, element rim glow, rotating energy spikes and an element aura.
 */
export class BattleCat extends Container {
  sprite: CatPuppet;
  aura = new Container();
  spikes: Graphics;
  comic: ComicFilter;
  ink: InkFilter;
  private t = Math.random() * 10;
  private acc = 0;
  private spawnAcc = 0;
  baseScale: number;
  fx: (typeof ELEMENT_FX)[string];
  parts = new Container();
  constructor(slug: string, public element: string, public size = 200, public flip = false) {
    super();
    this.fx = elementFx(element);
    this.spikes = new Graphics();
    this.drawSpikes();
    const glowA = new Sprite(glowTexture());
    glowA.anchor.set(0.5);
    glowA.tint = this.fx.main;
    glowA.alpha = 0.55;
    glowA.scale.set((size / 128) * 1.7);
    glowA.y = -size * 0.42;
    this.aura.addChild(glowA, this.spikes);
    this.sprite = livingCat(slug, { anchorX: 0.5, anchorY: 0.94, fps: 12, acts: 'battle' });
    this.baseScale = size / ART;
    this.sprite.scale.set(this.baseScale * (flip ? -1 : 1), this.baseScale);
    this.comic = new ComicFilter({ levels: 6, dot: 4, sat: 1.3, strength: 0.85, shadow: this.fx.dark });
    this.ink = new InkFilter({ threshold: 0.4 });
    this.sprite.filters = [
      this.comic,
      new OutlineFilter({ thickness: Math.max(3, size / 45), color: C.ink, quality: 0.25 }),
      new GlowFilter({ distance: 14, outerStrength: 2.2, innerStrength: 0, color: this.fx.main, quality: 0.2 }),
    ];
    this.addChild(this.aura, this.sprite, this.parts);
    Ticker.shared.add(this.tick, this);
  }
  private drawSpikes() {
    const g = this.spikes;
    const s = this.size;
    g.clear();
    const n = 14;
    const cy = -s * 0.42;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (i % 2) * 0.1;
      const r0 = s * 0.28;
      const r1 = s * (0.55 + ((i * 37) % 10) / 40);
      const w = 0.12;
      g.moveTo(Math.cos(a - w) * r0, cy + Math.sin(a - w) * r0)
        .lineTo(Math.cos(a) * r1, cy + Math.sin(a) * r1)
        .lineTo(Math.cos(a + w) * r0, cy + Math.sin(a + w) * r0)
        .closePath();
    }
    g.fill({ color: this.fx.main, alpha: 0.85 }).stroke({ width: 3, color: C.ink });
    g.pivot.set(0, cy);
    g.y = cy;
  }
  private tick(t: Ticker) {
    const dt = t.deltaMS / 1000;
    this.spawnAcc += dt;
    if (this.spawnAcc > 0.09) {
      this.spawnAcc = 0;
      this.spawnParticle();
    }
    this.acc += dt;
    if (this.acc < 1 / 12) return; // character animates on twos
    this.t += this.acc;
    this.acc = 0;
    const b = Math.sin(this.t * 3);
    this.sprite.scale.set(this.baseScale * (this.flip ? -1 : 1) * (1 + b * 0.015), this.baseScale * (1 - b * 0.02));
    this.spikes.rotation += 0.09;
    const sp = 1 + Math.sin(this.t * 5) * 0.06;
    this.spikes.scale.set(sp);
  }
  private spawnParticle() {
    const kind = this.fx.particle;
    const tex = kind === 'star' || kind === 'spark' || kind === 'shard' ? sparkTexture() : kind === 'rune' ? sparkTexture() : dotTexture();
    const p = new Sprite(tex);
    p.anchor.set(0.5);
    p.tint = Math.random() < 0.5 ? this.fx.main : this.fx.accent;
    const s = this.size;
    p.position.set((Math.random() - 0.5) * s * 0.8, -Math.random() * s * 0.4);
    const sc = (kind === 'bubble' ? 0.35 : 0.22) + Math.random() * 0.25;
    p.scale.set(sc * (s / 200));
    p.blendMode = kind === 'glitch' ? 'normal' : 'add';
    this.parts.addChild(p);
    const rise = s * (0.4 + Math.random() * 0.5);
    const drift = (Math.random() - 0.5) * s * 0.3;
    gsap.to(p, {
      y: p.y - rise,
      x: p.x + drift,
      alpha: 0,
      rotation: Math.random() * 3,
      duration: 0.9 + Math.random() * 0.6,
      ease: 'power1.out',
      onComplete: () => p.destroy(),
    });
  }
  /** Flip to manga ink for an impact frame */
  impactFrame(ms = 120, invert = true) {
    this.ink.invert = invert;
    const prev = [...(this.sprite.filters ?? [])];
    this.sprite.filters = [this.ink, new OutlineFilter({ thickness: 4, color: invert ? 0xffffff : C.ink })];
    window.setTimeout(() => {
      if (!this.destroyed) this.sprite.filters = prev;
    }, ms);
  }
  override destroy() {
    Ticker.shared.remove(this.tick, this);
    gsap.killTweensOf(this.parts.children);
    super.destroy({ children: true });
  }
}
