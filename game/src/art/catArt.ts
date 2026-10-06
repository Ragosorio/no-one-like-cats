import { Assets, Container, Graphics, Sprite, Texture, Ticker } from 'pixi.js';
import { ART, CatPuppet, PuppetOptions } from './livingCat';
import { GlowFilter, OutlineFilter } from 'pixi-filters';
import gsap from 'gsap';
import { ComicFilter, InkFilter } from '../fx/filters';
import { glowTexture, sparkTexture, dotTexture } from './textures';
import { C } from '../ui/theme';

/** Visual identity per element: aura colors + accent. Keys are element ids. */
export const ELEMENT_FX: Record<string, { main: number; accent: number; dark: number; particle: 'ember' | 'bubble' | 'leaf' | 'spark' | 'shard' | 'star' | 'rock' | 'wisp' | 'rune' | 'glitch' }> = {
  fire: { main: 0xff6a1a, accent: 0xffc94a, dark: 0x4e0000, particle: 'ember' },
  water: { main: 0x3569a3, accent: 0x7fd8ff, dark: 0x172b35, particle: 'bubble' },
  nature: { main: 0x5fbf4a, accent: 0xd4f27a, dark: 0x1f4a2a, particle: 'leaf' },
  earth: { main: 0xa8743f, accent: 0xe0b77a, dark: 0x3d2a1a, particle: 'rock' },
  electric: { main: 0xffe14a, accent: 0xffffff, dark: 0x3a3200, particle: 'spark' },
  storm: { main: 0xffe14a, accent: 0x00e5ff, dark: 0x1f2b4a, particle: 'spark' },
  ice: { main: 0xa7e8d7, accent: 0xffffff, dark: 0x204a7a, particle: 'shard' },
  wind: { main: 0xc6f0e4, accent: 0xffffff, dark: 0x3a6f6a, particle: 'wisp' },
  magic: { main: 0x8a5cff, accent: 0xff7ab8, dark: 0x231626, particle: 'rune' },
  spirit: { main: 0xb7a4c7, accent: 0xffffff, dark: 0x171317, particle: 'wisp' },
  cosmic: { main: 0x8a5cff, accent: 0x00e5ff, dark: 0x0d110f, particle: 'star' },
  void: { main: 0x231626, accent: 0xff2e88, dark: 0x000000, particle: 'glitch' },
  light: { main: 0xfff3b0, accent: 0xffffff, dark: 0xb89558, particle: 'star' },
  tech: { main: 0x00e5ff, accent: 0xff2e88, dark: 0x0d110f, particle: 'glitch' },
  sound: { main: 0xff7ab8, accent: 0xffffff, dark: 0x5c3d5b, particle: 'spark' },
  time: { main: 0xb89558, accent: 0xfff3b0, dark: 0x3d2a1a, particle: 'rune' },
  shadow: { main: 0x5c3d5b, accent: 0xff2e88, dark: 0x0d110f, particle: 'wisp' },
};

export function elementFx(el: string) {
  return ELEMENT_FX[el] ?? ELEMENT_FX.fire;
}

/**
 * Cat art = MAI pure vectors only (no raster files are served). Two tiers, same logical 700×700
 * size so rigs/UVs/scales are identical:
 * - lite: traced from a 256 px downscale (~130–220 KB gzip) → rasterized at 350 px. Everything
 *   waits on this one (island, battle, shop, catdex grids).
 * - full: the approved high-color-preserved trace (game-compact, pixel-identical) → rasterized at
 *   1050 px. Loaded in the background only when a puppet is drawn big (or a scene asks for it).
 */
export function catLiteUrl(slug: string) {
  return `cats-svg/lite/${slug}.svg`;
}
export function catSvgUrl(slug: string) {
  return `cats-svg/${slug}.svg`;
}
const LITE_RES = 0.5;
const FULL_RES = 1.5;

const liteTex = new Map<string, Texture>();
const litePending = new Map<string, Promise<Texture>>();
function loadLite(slug: string): Promise<Texture> {
  const hit = liteTex.get(slug);
  if (hit) return Promise.resolve(hit);
  let p = litePending.get(slug);
  if (!p) {
    const url = catLiteUrl(slug);
    p = Assets.load<Texture>({ alias: url, src: url, data: { resolution: LITE_RES } }).then((t) => {
      liteTex.set(slug, t);
      litePending.delete(slug);
      return t;
    });
    p.catch(() => litePending.delete(slug));
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
      Assets.load<Texture>({ alias: url, src: url, data: { resolution: FULL_RES } })
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
export function requestCatSvg(slug: string) {
  if (svgTex.has(slug) || svgState.has(slug)) return;
  svgState.set(slug, 'queued');
  svgQueue.push(slug);
  pumpSvg();
}

/** `cb` gets the full-detail texture when it exists (now if loaded). Does NOT request it. Returns an unsubscribe. */
export function onCatArt(slug: string, cb: (t: Texture) => void): () => void {
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
  await Promise.all([...new Set(slugs)].map(loadLite));
}

/** best available painting: full vector if rasterized, else the lite vector, else WHITE (= not loaded) */
export function catTexture(slug: string): Texture {
  return svgTex.get(slug) ?? liteTex.get(slug) ?? Texture.WHITE;
}

/**
 * A living painting: CatPuppet mesh (MAI rig). Starts with whatever vector tier is loaded (hidden
 * until one is), upgrades itself to the full-detail vector when it is drawn big.
 * Drop-in for `new Sprite(catTexture(slug))` (same default anchor 0,0, `anchor.set`, tint, filters, texture).
 */
export function livingCat(slug: string, o: PuppetOptions & { detail?: boolean } = {}): CatPuppet {
  const tex = catTexture(slug);
  const p = new CatPuppet(tex === Texture.WHITE ? Texture.EMPTY : tex, slug, { anchorX: 0, anchorY: 0, ...o });
  if (tex === Texture.WHITE) {
    p.renderable = false;
    void loadLite(slug).then((t) => {
      if (p.destroyed || p.renderable) return;
      p.texture = t;
      p.renderable = true;
    });
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
