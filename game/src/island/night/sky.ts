/**
 * The astral night sky behind the floating islands (screen space, over the day void of island/sea.ts and
 * under the world). Gradient + dark cloud sea + halftone + two parallax star fields + twinkles + aurora bands
 * + the seam. Everything is baked once (./textures.ts); per frame only alphas and tile offsets change.
 */
import { Container, Sprite, TilingSprite } from 'pixi.js';
import { game } from '../../core/App';
import { followView } from '../../ui/screen';
import { halftoneTexture, sparkTexture } from '../../art/textures';
import { cloudFieldTex } from '../dimensions/bake';
import type { WorldLook } from '../../state/sys/worldState';
import { auroraTex, nightGradTex, seamTex, starTileTex, streakTex } from './textures';

interface Twinkle {
  s: Sprite;
  u: number;
  v: number;
  ph: number;
  sp: number;
  k: number;
}
interface Shoot {
  s: Sprite;
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
  phase: 0 | 1 | 2 | 3;
  reverse: boolean;
  done: () => void;
}

export class NightSky extends Container {
  private grad = new Sprite(nightGradTex());
  private clouds = new TilingSprite({ texture: cloudFieldTex(1), width: 16, height: 16 });
  private dots = new TilingSprite({ texture: halftoneTexture(0x7d6cff, 20, 2.2), width: 16, height: 16 });
  private far = new TilingSprite({ texture: starTileTex(11, 1), width: 16, height: 16 });
  private near = new TilingSprite({ texture: starTileTex(23, 0.55), width: 16, height: 16 });
  private bands: TilingSprite[] = [new TilingSprite({ texture: auroraTex(0), width: 16, height: 300 }), new TilingSprite({ texture: auroraTex(1), width: 16, height: 240 })];
  private seam = new Sprite(seamTex());
  private skyLayer = new Container();
  private starLayer = new Container();
  private twinkles: Twinkle[] = [];
  private shoots: Shoot[] = [];
  private cam = { x: 0, y: 0, z: 1 };
  /** where shooting stars are drawn (IslandNight puts them in front of the islands so they read) */
  shootLayer: Container | null = null;
  private t = 0;
  private drift = 0;
  constructor() {
    super();
    this.eventMode = 'none';
    this.label = 'nightSky';
    this.clouds.tint = 0x2c2a74;
    this.clouds.alpha = 0.55;
    this.dots.alpha = 0.12;
    this.skyLayer.addChild(this.grad, this.clouds, this.dots);
    for (const b of this.bands) b.blendMode = 'add';
    this.far.blendMode = 'add';
    this.near.blendMode = 'add';
    this.starLayer.addChild(this.far, this.near, ...this.bands);
    const tw = sparkTexture();
    for (let i = 0; i < 26; i++) {
      const s = new Sprite(tw);
      s.anchor.set(0.5);
      s.blendMode = 'add';
      s.tint = [0xffffff, 0xe6dcff, 0xfff1c8, 0xbfe8ff][i % 4];
      this.starLayer.addChild(s);
      this.twinkles.push({ s, u: Math.random(), v: Math.random() * 0.8, ph: Math.random() * 6.28, sp: 1.2 + Math.random() * 2.4, k: 0.12 + Math.random() * 0.22 });
    }
    this.seam.anchor.set(0.5);
    this.addChild(this.skyLayer, this.starLayer, this.seam);
    followView(this, () => this.layout());
  }

  private layout() {
    const v = game.view;
    this.grad.position.set(v.x, v.y);
    this.grad.width = v.w;
    this.grad.height = v.h;
    for (const t of [this.clouds, this.dots, this.far, this.near]) {
      t.position.set(v.x, v.y);
      t.width = v.w;
      t.height = v.h;
    }
    this.bands[0].position.set(v.x, v.y + v.h * 0.04);
    this.bands[1].position.set(v.x, v.y + v.h * 0.26);
    for (const b of this.bands) b.width = v.w;
    this.seam.position.set(v.x + v.w * 0.52, v.y + v.h * 0.13);
    this.seam.width = v.w * 1.15;
    this.seam.height = v.h * 0.26;
    this.seam.rotation = -0.05;
  }

  /** camera offset (world container x/y) + zoom, for parallax */
  follow(x: number, y: number, z: number) {
    this.cam = { x, y, z };
  }

  /** a single shooting star across the sky; `reverse`: it slows, hangs… and falls UP. Resolves when gone */
  shoot(o: { reverse?: boolean; fromX?: number; fromY?: number } = {}): Promise<void> {
    const v = game.view;
    const s = new Sprite(streakTex());
    s.anchor.set(0.5, 0.06);
    s.blendMode = 'add';
    s.tint = 0xfff6e0;
    (this.shootLayer ?? this.starLayer).addChild(s);
    return new Promise((done) => {
      this.shoots.push({
        s,
        x: v.x + v.w * (o.fromX ?? 0.12),
        y: v.y + v.h * (o.fromY ?? 0.1),
        vx: 1050,
        vy: 330,
        t: 0,
        phase: 0,
        reverse: !!o.reverse,
        done,
      });
    });
  }
  /** drop any shooting star right now (SALTAR / interruption) */
  clearShoots() {
    for (const sh of this.shoots.splice(0)) {
      sh.s.destroy();
      sh.done();
    }
  }

  update(dt: number, look: WorldLook, reduceMotion: boolean) {
    this.t += dt;
    this.drift += dt * (reduceMotion ? 3 : 8);
    const skyA = look.sky;
    this.skyLayer.alpha = skyA;
    this.skyLayer.visible = skyA > 0.003;
    this.skyLayer.tint = look.skyTint;
    const starA = Math.min(1, look.stars);
    this.starLayer.visible = starA > 0.003 || look.aurora > 0.003 || this.shoots.length > 0;
    this.seam.visible = look.seam > 0.003;
    this.visible = this.skyLayer.visible || this.starLayer.visible || this.seam.visible;
    if (this.shoots.length) this.updateShoots(dt);
    if (!this.visible) return;
    const { x, y, z } = this.cam;
    const lay = (s: TilingSprite, p: number, sc: number, dx: number) => {
      s.tilePosition.set(x * p + dx, y * p);
      s.tileScale.set(sc * (0.55 + z * 0.45 * p));
    };
    if (this.skyLayer.visible) {
      lay(this.clouds, 0.32, 0.8, this.drift * 0.6);
      lay(this.dots, 0.2, 1, 0);
    }
    if (this.starLayer.visible) {
      this.far.alpha = starA * 0.95;
      this.near.alpha = starA;
      lay(this.far, 0.06, 1, 0);
      lay(this.near, 0.12, 1.3, 0);
      const v = game.view;
      for (const tw of this.twinkles) {
        const px = v.x + (((tw.u * v.w + x * 0.12) % v.w) + v.w) % v.w;
        const py = v.y + (((tw.v * v.h + y * 0.12) % v.h) + v.h) % v.h;
        tw.s.position.set(px, py);
        const pulse = reduceMotion ? 0.75 : 0.5 + 0.5 * Math.sin(this.t * tw.sp + tw.ph);
        tw.s.alpha = starA * (0.35 + 0.65 * pulse);
        tw.s.scale.set(tw.k * (0.7 + 0.5 * pulse));
        tw.s.rotation = reduceMotion ? 0 : this.t * 0.4 + tw.ph;
      }
      this.bands.forEach((b, i) => {
        b.visible = look.aurora > 0.003;
        if (!b.visible) return;
        const breathe = reduceMotion ? 1 : 0.8 + 0.2 * Math.sin(this.t * (0.35 + i * 0.2) + i * 2);
        b.alpha = look.aurora * (i ? 0.5 : 0.75) * breathe;
        b.tilePosition.set(x * (0.08 + i * 0.04) + this.drift * (i ? -2.2 : 1.6), 0);
      });
    }
    if (this.seam.visible) this.seam.alpha = look.seam * (reduceMotion ? 0.9 : 0.82 + 0.18 * Math.sin(this.t * 0.9));
  }

  private updateShoots(dt: number) {
    for (let i = this.shoots.length - 1; i >= 0; i--) {
      const sh = this.shoots[i];
      sh.t += dt;
      if (sh.phase === 0) {
        // streaking across like any shooting star
        if (sh.reverse && sh.t > 0.75) {
          sh.phase = 1;
          sh.t = 0;
        }
      } else if (sh.phase === 1) {
        // …it brakes
        const k = Math.exp(-dt * 5.5);
        sh.vx *= k;
        sh.vy *= k;
        if (sh.t > 0.75) {
          sh.phase = 2;
          sh.t = 0;
          sh.vx = sh.vy = 0;
        }
      } else if (sh.phase === 2) {
        // hangs there, blinking, as if thinking about it
        if (sh.t > 0.7) {
          sh.phase = 3;
          sh.t = 0;
        }
      } else {
        // and falls UP
        sh.vy -= 3600 * dt;
        sh.vx *= Math.exp(-dt * 3);
      }
      sh.x += sh.vx * dt;
      sh.y += sh.vy * dt;
      const sp = Math.hypot(sh.vx, sh.vy);
      const dir = sp > 5 ? Math.atan2(sh.vy, sh.vx) + Math.PI / 2 : 0;
      sh.s.position.set(sh.x, sh.y);
      sh.s.rotation = dir;
      const len = sh.phase === 2 ? 0.12 : Math.max(0.12, Math.min(1.25, sp / 900));
      const blink = sh.phase === 2 ? 0.8 + 0.4 * Math.sin(sh.t * 30) : 1;
      sh.s.scale.set(1.7 * blink, len * 1.35);
      const v = game.view;
      const out = sh.y < v.y - 400 || sh.x > v.x + v.w + 300 || (!sh.reverse && sh.t > 2.2);
      if (out) {
        sh.s.destroy();
        this.shoots.splice(i, 1);
        sh.done();
      }
    }
  }

  override destroy(o?: Parameters<Container['destroy']>[0]) {
    this.clearShoots();
    super.destroy(o ?? { children: true });
  }
}
