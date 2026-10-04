import { Container, Graphics, Texture, TilingSprite } from 'pixi.js';
import { W, H } from '../core/App';
import { halftoneTexture } from '../art/textures';
import { SEA, SEA_DEEP } from './terrain';

const cache = new Map<string, Texture>();

/** scattered hand-drawn wave marks (white crests + ink-blue troughs), tileable */
function waveTexture(variant: number): Texture {
  const k = `waves-${variant}`;
  const hit = cache.get(k);
  if (hit) return hit;
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  let s = 1234 + variant * 99;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  g.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const w = 18 + rnd() * 26;
    const dx = variant ? 3 : 0;
    for (const [ox, oy] of [
      [0, 0],
      [-size, 0],
      [0, -size],
      [-size, -size],
      [size, 0],
      [0, size],
    ]) {
      const bx = x + ox + dx;
      const by = y + oy;
      g.strokeStyle = 'rgba(255,255,255,0.42)';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(bx - w, by);
      g.quadraticCurveTo(bx - w / 2, by - 7, bx, by);
      g.quadraticCurveTo(bx + w / 2, by - 7, bx + w, by);
      g.stroke();
      if (rnd() < 0.4) {
        g.strokeStyle = 'rgba(23,43,80,0.18)';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(bx - w * 0.6, by + 8);
        g.quadraticCurveTo(bx, by + 13, bx + w * 0.6, by + 8);
        g.stroke();
      }
    }
  }
  const t = Texture.from(c);
  t.source.addressMode = 'repeat';
  cache.set(k, t);
  return t;
}

/** Screen-space sea that scrolls with the camera (cheap: 3 tiling sprites). */
export class SeaView extends Container {
  private dots: TilingSprite;
  private wavesA: TilingSprite;
  private wavesB: TilingSprite;
  private t = 0;
  private drift = 0;
  constructor() {
    super();
    const base = new Graphics().rect(0, 0, W, H).fill(SEA);
    this.dots = new TilingSprite({ texture: halftoneTexture(SEA_DEEP, 16, 3.2), width: W, height: H });
    this.dots.alpha = 0.55;
    this.wavesA = new TilingSprite({ texture: waveTexture(0), width: W, height: H });
    this.wavesB = new TilingSprite({ texture: waveTexture(1), width: W, height: H });
    this.wavesB.visible = false;
    this.addChild(base, this.dots, this.wavesA, this.wavesB);
  }
  follow(x: number, y: number, zoom: number) {
    this.dots.tilePosition.set(x, y);
    this.dots.tileScale.set(zoom);
    for (const w of [this.wavesA, this.wavesB]) {
      w.tilePosition.set(x + this.drift * zoom, y);
      w.tileScale.set(zoom);
    }
  }
  tick(dt: number) {
    this.t += dt;
    this.drift += dt * 6;
    if (this.t > 0.42) {
      this.t = 0;
      this.wavesA.visible = !this.wavesA.visible;
      this.wavesB.visible = !this.wavesA.visible;
    }
  }
}
