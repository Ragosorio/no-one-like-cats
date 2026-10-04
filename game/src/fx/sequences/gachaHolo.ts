/**
 * HOLO foil look (gacha-exclusive "gatos súper rotos").
 *   holoSheen(w, h)          → self-animating rainbow foil overlay (add blend) for a w×h area (anchor top-left)
 *   applyHolo(sprite)        → adds an animated hue-shifting ColorMatrix + sheen masked to the sprite
 * Safe: stops its ticker when destroyed. Other systems (Catdex card, island cat) may reuse it for OwnedCat.holo.
 */
import { ColorMatrixFilter, Container, Graphics, Sprite, Ticker } from 'pixi.js';
import { settings } from '../../core/settings';

const RAINBOW = [0xff2e88, 0xffc94a, 0x2fd27a, 0x00e5ff, 0x8a5cff, 0xff2e88];

export class HoloSheen extends Container {
  private g = new Graphics();
  private t = Math.random() * 5;
  constructor(
    public w: number,
    public h: number,
    public strength = 0.55,
  ) {
    super();
    this.addChild(this.g);
    this.g.blendMode = 'add';
    this.redraw();
    Ticker.shared.add(this.tick, this);
  }
  private redraw() {
    const g = this.g;
    g.clear();
    const band = Math.max(this.w, this.h) * 0.16;
    const span = this.w + this.h;
    const off = ((this.t * 120) % (band * RAINBOW.length)) - band * RAINBOW.length;
    let i = 0;
    for (let x = off; x < span; x += band) {
      const col = RAINBOW[i % RAINBOW.length];
      g.poly([x, 0, x + band, 0, x + band - this.h, this.h, x - this.h, this.h]).fill({ color: col, alpha: 0.22 * this.strength });
      i++;
    }
    // moving white glint
    const gx = ((this.t * 260) % (span * 1.6)) - span * 0.3;
    g.poly([gx, 0, gx + 40, 0, gx + 40 - this.h, this.h, gx - this.h, this.h]).fill({ color: 0xffffff, alpha: 0.35 * this.strength });
  }
  private tick(tk: Ticker) {
    this.t += (tk.deltaMS / 1000) * (settings.reduceMotion ? 0.3 : 1);
    this.redraw();
  }
  override destroy(o?: Parameters<Container['destroy']>[0]) {
    Ticker.shared.remove(this.tick, this);
    super.destroy(o);
  }
}

export function holoSheen(w: number, h: number, strength = 0.55): HoloSheen {
  return new HoloSheen(w, h, strength);
}

/** Wrap a (centered-anchor) sprite with the holo look. Returns the overlay so the caller can remove it. */
export function applyHolo(sprite: Sprite, parent: Container = sprite.parent ?? sprite): Container {
  const cm = new ColorMatrixFilter();
  let t = 0;
  const tick = (tk: Ticker) => {
    if (sprite.destroyed) {
      Ticker.shared.remove(tick);
      return;
    }
    t += tk.deltaMS / 1000;
    cm.reset();
    cm.hue(Math.sin(t * 1.3) * 26, false);
    cm.saturate(0.25, true);
  };
  Ticker.shared.add(tick);
  sprite.filters = [...(sprite.filters ?? []), cm];
  const b = sprite.getLocalBounds();
  const w = b.width * Math.abs(sprite.scale.x);
  const h = b.height * Math.abs(sprite.scale.y);
  const sheen = new HoloSheen(w, h, 0.7);
  sheen.position.set(sprite.x - w * sprite.anchor.x, sprite.y - h * sprite.anchor.y);
  // mask the sheen with a copy of the sprite silhouette
  const m = new Sprite(sprite.texture);
  m.anchor.copyFrom(sprite.anchor);
  m.scale.copyFrom(sprite.scale);
  m.position.copyFrom(sprite.position);
  sheen.mask = m;
  parent.addChild(m, sheen);
  return sheen;
}
