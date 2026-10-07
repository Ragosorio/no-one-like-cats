/**
 * Story portraits. Luzterna = translucent ghost witch floating "on twos" with a pulsing lantern.
 * Other speakers reuse the painted cats with a treatment (enemy / rival / duck…).
 */
import { Assets, ColorMatrixFilter, Container, Graphics, Sprite, Texture, Ticker } from 'pixi.js';
import { GlowFilter, OutlineFilter } from 'pixi-filters';
import gsap from 'gsap';
import { glowTexture, sparkTexture } from '../../art/textures';
import { catTexture, livingCat, preloadCats } from '../../art/catArt';
import { CatPuppet } from '../../art/livingCat';
import { C } from '../theme';
import { Speaker } from './text';
import { settings } from '../../core/settings';
import { killTweensDeep } from './tweens';

/** MAI pure-vector trace of the Luzterna painting (light tier, ~1 MB; no raster served) */
export const LUZTERNA_URL = 'story/lite/luzterna.svg';

let loading: Promise<unknown> | null = null;
export function preloadStoryArt(extraSlugs: string[] = []) {
  if (!loading) loading = Assets.load({ alias: LUZTERNA_URL, src: LUZTERNA_URL, data: { resolution: 1 } }).catch(() => undefined);
  return Promise.all([loading, extraSlugs.length ? preloadCats(extraSlugs).catch(() => undefined) : undefined]);
}

export function luzternaTexture(): Texture {
  return (Assets.get(LUZTERNA_URL) as Texture | undefined) ?? catTexture('lantern_spirit_cat');
}

/** Ghost witch with lantern. `size` = target height in px. Anchored bottom-center. */
export class LuzternaPortrait extends Container {
  sprite: CatPuppet;
  lantern: Sprite;
  halo: Sprite;
  private wisps = new Container();
  private t = Math.random() * 6;
  private acc = 0;
  private spawn = 0;
  private baseScale: number;
  constructor(public size = 420, public ghostAlpha = 0.86) {
    super();
    const tex = luzternaTexture();
    this.halo = new Sprite(glowTexture());
    this.halo.anchor.set(0.5);
    this.halo.tint = C.violet;
    this.halo.alpha = 0.45;
    this.halo.scale.set((size / 128) * 1.25);
    this.halo.y = -size * 0.5;
    // living MAI puppet: she blinks, twitches the ears, swings the tail and the lantern bobs
    this.sprite = new CatPuppet(tex, 'luzterna', { anchorX: 0.5, anchorY: 1, fps: 12, acts: 'calm' });
    this.baseScale = size / Math.max(1, tex.height);
    this.sprite.scale.set(this.baseScale);
    this.sprite.alpha = ghostAlpha;
    this.sprite.filters = [
      new GlowFilter({ distance: 18, outerStrength: 2.4, innerStrength: 0.4, color: 0xb98cff, quality: 0.2 }),
      new OutlineFilter({ thickness: Math.max(2, size / 140), color: C.ink, quality: 0.2 }),
    ];
    // lantern glow (painting: lantern at ~18% x, ~52% y)
    this.lantern = new Sprite(glowTexture());
    this.lantern.anchor.set(0.5);
    this.lantern.tint = 0xffc94a;
    this.lantern.blendMode = 'add';
    this.lantern.scale.set(size / 210);
    this.lantern.position.set((0.18 - 0.5) * tex.width * this.baseScale, -size * (1 - 0.52));
    this.addChild(this.halo, this.wisps, this.sprite, this.lantern);
    Ticker.shared.add(this.tick, this);
  }
  private tick(tk: Ticker) {
    const dt = tk.deltaMS / 1000;
    // particles + lantern at 60fps
    this.lantern.alpha = 0.55 + Math.sin(this.t * 5.3) * 0.18 + Math.sin(this.t * 13.1) * 0.06;
    this.spawn += dt;
    if (this.spawn > 0.16 && !settings.reduceMotion) {
      this.spawn = 0;
      this.mote();
    }
    // character on twos (12 fps)
    this.acc += dt;
    if (this.acc < 1 / 12) return;
    this.t += this.acc;
    this.acc = 0;
    const amp = settings.reduceMotion ? 0.3 : 1;
    const f = Math.sin(this.t * 1.9);
    this.sprite.y = f * 10 * amp;
    this.sprite.rotation = Math.sin(this.t * 1.3) * 0.025 * amp;
    this.sprite.scale.set(this.baseScale * (1 + f * 0.008), this.baseScale * (1 - f * 0.01));
    this.lantern.y = -this.size * 0.48 + f * 10 * amp;
    this.halo.alpha = 0.38 + Math.sin(this.t * 2.2) * 0.08;
  }
  private mote() {
    const p = new Sprite(Math.random() < 0.5 ? sparkTexture() : glowTexture(32));
    p.anchor.set(0.5);
    p.tint = Math.random() < 0.5 ? 0xffd77a : 0xc9a6ff;
    p.blendMode = 'add';
    const s = this.size;
    p.position.set((Math.random() - 0.5) * s * 0.7, -Math.random() * s * 0.35);
    p.scale.set((0.12 + Math.random() * 0.2) * (s / 420));
    this.wisps.addChild(p);
    gsap.to(p, {
      y: p.y - s * (0.3 + Math.random() * 0.4),
      x: p.x + (Math.random() - 0.5) * 60,
      alpha: 0,
      duration: 1.4 + Math.random(),
      ease: 'sine.out',
      onComplete: () => p.destroy(),
    });
  }
  /** little bounce when she starts talking */
  talk() {
    this.sprite.emote('happy', 0.5);
    gsap.fromTo(this.sprite.scale, { x: this.baseScale * 1.04, y: this.baseScale * 0.96 }, { x: this.baseScale, y: this.baseScale, duration: 0.4, ease: 'elastic.out(1.2,0.4)' });
  }
  override destroy() {
    Ticker.shared.remove(this.tick, this);
    killTweensDeep(this);
    super.destroy({ children: true });
  }
}

/** Painted cat portrait with a story treatment. Anchored bottom-center. */
export class CatPortrait extends Container {
  sprite: CatPuppet;
  private t = Math.random() * 6;
  private acc = 0;
  private baseScale: number;
  constructor(sp: Speaker, public size = 380) {
    super();
    const tex = catTexture(sp.slug ?? 'canelo_cozy_cat');
    this.sprite = livingCat(sp.slug ?? 'canelo_cozy_cat', { anchorX: 0.5, anchorY: 1, fps: 12 });
    this.baseScale = size / Math.max(1, tex.height);
    this.sprite.scale.set(this.baseScale * (sp.treat === 'enemy' || sp.treat === 'boss' ? -1 : 1), this.baseScale);
    const filters = [];
    if (sp.treat === 'enemy' || sp.treat === 'boss') {
      const cm = new ColorMatrixFilter();
      cm.saturate(-0.4, true);
      cm.contrast(0.15, true);
      filters.push(cm, new OutlineFilter({ thickness: 4, color: C.red, quality: 0.2 }));
    } else if (sp.treat === 'rival') {
      filters.push(new OutlineFilter({ thickness: 3, color: C.ink, quality: 0.2 }), new GlowFilter({ distance: 14, outerStrength: 2, color: C.mint, quality: 0.2 }));
    } else {
      filters.push(new OutlineFilter({ thickness: 3, color: C.ink, quality: 0.2 }));
    }
    this.sprite.filters = filters;
    this.addChild(this.sprite);
    if (sp.treat === 'duck') this.addChild(this.paperHat(tex));
    if (sp.id === 'bigotes') this.addChild(this.eyePatch(tex));
    Ticker.shared.add(this.tick, this);
  }
  private paperHat(tex: Texture) {
    // folded newspaper pirate hat on the head (~31% x, 10% y of the painting)
    const g = new Graphics();
    const w = this.size * 0.36;
    g.poly([-w / 2, 0, 0, -w * 0.48, w / 2, 0]).fill(0xf4eee3).stroke({ width: 4, color: C.ink, join: 'round' });
    g.rect(-w / 2 - 6, -4, w + 12, w * 0.14).fill(0xe9dfc8).stroke({ width: 4, color: C.ink });
    for (let i = 0; i < 4; i++) g.moveTo(-w * 0.22 + i * 4, -w * 0.12 - i * 9).lineTo(w * 0.18 - i * 4, -w * 0.12 - i * 9);
    g.stroke({ width: 2, color: C.ink, alpha: 0.5 });
    g.circle(0, -w * 0.22, w * 0.07).fill(C.ink);
    g.position.set((0.335 - 0.5) * tex.width * this.baseScale, -this.size * (1 - 0.2));
    g.rotation = -0.12;
    return g;
  }
  private eyePatch(tex: Texture) {
    const g = new Graphics();
    const r = this.size * 0.045;
    g.moveTo(-r * 4, -r * 2.2).lineTo(r * 4, r * 1.6).stroke({ width: 4, color: C.ink });
    g.ellipse(0, 0, r * 1.3, r).fill(C.ink);
    // mirrored (enemy faces left): face sits around 60% x / 30% y of the painting
    g.position.set(-(0.58 - 0.5) * tex.width * this.baseScale, -this.size * (1 - 0.3));
    return g;
  }
  private tick(tk: Ticker) {
    this.acc += tk.deltaMS / 1000;
    if (this.acc < 1 / 12) return;
    this.t += this.acc;
    this.acc = 0;
    const b = Math.sin(this.t * 2.4);
    const sx = Math.sign(this.sprite.scale.x) || 1;
    this.sprite.scale.set(sx * this.baseScale * (1 + b * 0.012), this.baseScale * (1 - b * 0.016));
  }
  talk() {
    this.sprite.emote('happy', 0.45);
    gsap.fromTo(this.sprite, { y: -14 }, { y: 0, duration: 0.35, ease: 'bounce.out' });
  }
  override destroy() {
    Ticker.shared.remove(this.tick, this);
    killTweensDeep(this);
    super.destroy({ children: true });
  }
}

export type Portrait = LuzternaPortrait | CatPortrait;

export function makePortrait(sp: Speaker, size: number): Portrait | null {
  if (sp.kind === 'luzterna') return new LuzternaPortrait(size);
  if (sp.kind === 'cat') return new CatPortrait(sp, size * 0.92);
  return null;
}
