/**
 * The "void between dimensions" under the floating islands: a cozy anime sky seen from above,
 * with two parallax cloud seas drifting far below (screen-space, 4 cheap tiling sprites).
 */
import { Container, Sprite, Texture, TilingSprite } from 'pixi.js';
import { W, H } from '../core/App';
import { halftoneTexture } from '../art/textures';
import { bake, cloudFieldTex, rgba } from './dimensions/bake';

function skyGradient(): Texture {
  return bake(
    'void-grad',
    8,
    512,
    (g, w, h) => {
      const grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, rgba(0x4fa8e6, 1));
      grd.addColorStop(0.55, rgba(0x82c8f0, 1));
      grd.addColorStop(1, rgba(0xbfe6f8, 1));
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    },
    false,
  );
}

export class SeaView extends Container {
  private dots: TilingSprite;
  private far: TilingSprite;
  private near: TilingSprite;
  private haze: TilingSprite;
  private drift = 0;
  private cam = { x: 0, y: 0, z: 1 };
  constructor() {
    super();
    const base = new Sprite(skyGradient());
    base.width = W;
    base.height = H;
    this.dots = new TilingSprite({ texture: halftoneTexture(0x3f96d6, 18, 3), width: W, height: H });
    this.dots.alpha = 0.32;
    this.far = new TilingSprite({ texture: cloudFieldTex(1), width: W, height: H });
    this.far.tint = 0xcfe2f6;
    this.far.alpha = 0.55;
    this.haze = new TilingSprite({ texture: halftoneTexture(0xffffff, 22, 2.4), width: W, height: H });
    this.haze.alpha = 0.18;
    this.near = new TilingSprite({ texture: cloudFieldTex(0), width: W, height: H });
    this.near.alpha = 0.92;
    this.addChild(base, this.dots, this.far, this.haze, this.near);
    this.eventMode = 'none';
  }
  /** world container offset + zoom (called by the camera) */
  follow(x: number, y: number, zoom: number) {
    this.cam = { x, y, z: zoom };
    this.place();
  }
  private place() {
    const { x, y, z } = this.cam;
    const lay = (s: TilingSprite, p: number, sc: number, dx: number) => {
      s.tilePosition.set(x * p + dx, y * p);
      s.tileScale.set(sc * (0.55 + z * 0.45 * p));
    };
    lay(this.dots, 0.2, 1, 0);
    lay(this.far, 0.32, 0.7, this.drift * 0.5);
    lay(this.haze, 0.45, 1, 0);
    lay(this.near, 0.55, 1.15, this.drift);
  }
  tick(dt: number) {
    this.drift += dt * 9;
    this.place();
  }
}
