import { Container, Graphics, Ticker, FillGradient } from 'pixi.js';
import { W, H } from '../core/App';
import { C } from '../ui/theme';

/** Noir ocean: gradient sky, layered ink waves animated on twos. */
/** how far past the design box the sea is drawn (ultrawide / tall screens) */
const BLEED = 900;

export class Sea extends Container {
  sky = new Graphics();
  back = new Graphics();
  front = new Graphics();
  t = 0;
  acc = 0;
  constructor(public waterY: number, public palette: { skyTop: number; skyBottom: number; sea: number; seaDark: number } = {
    skyTop: C.chaos,
    skyBottom: C.theatre,
    sea: C.river,
    seaDark: C.oceanNoir,
  }) {
    super();
    const grad = new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: palette.skyTop },
        { offset: 1, color: palette.skyBottom },
      ],
      textureSpace: 'local',
    });
    // bleed: wide / tall screens see past the 1920×1080 box (game.view), so the sky and the sea
    // extend well beyond it (the gradient keeps its look inside the box; outside it's the end colors)
    this.sky.rect(-BLEED, -BLEED, W + BLEED * 2, BLEED).fill(palette.skyTop);
    this.sky.rect(0, 0, W, waterY + 40).fill(grad);
    this.sky.rect(-BLEED, 0, BLEED, waterY + 40).fill(grad);
    this.sky.rect(W, 0, BLEED, waterY + 40).fill(grad);
    this.addChild(this.sky, this.back);
    Ticker.shared.add(this.tick, this);
    this.draw();
  }
  /** front waves are added separately so they can overlap ship hulls */
  frontLayer() {
    return this.front;
  }
  private tick(t: Ticker) {
    this.acc += t.deltaMS / 1000;
    if (this.acc < 1 / 12) return; // animate on twos
    this.t += this.acc;
    this.acc = 0;
    this.draw();
  }
  private wave(g: Graphics, y: number, amp: number, len: number, speed: number, color: number, alpha = 1) {
    g.moveTo(-BLEED, H + BLEED);
    for (let x = -BLEED; x <= W + BLEED; x += 24) {
      g.lineTo(x, y + Math.sin(x / len + this.t * speed) * amp + Math.sin(x / (len * 0.43) - this.t * speed * 1.3) * amp * 0.35);
    }
    g.lineTo(W + BLEED, H + BLEED).closePath().fill({ color, alpha });
  }
  private draw() {
    const y = this.waterY;
    this.back.clear();
    this.wave(this.back, y - 14, 8, 90, 0.8, this.palette.seaDark);
    this.wave(this.back, y, 10, 70, 1.1, this.palette.sea);
    this.front.clear();
    this.wave(this.front, y + 28, 9, 60, 1.4, this.palette.seaDark, 0.95);
    // ink crest lines
    for (let i = 0; i < 3; i++) {
      const yy = y + 50 + i * 40;
      for (let x = (i * 70 + this.t * 30) % 140; x < W; x += 140) {
        this.front.moveTo(x, yy).quadraticCurveTo(x + 20, yy - 8, x + 40, yy).stroke({ width: 3, color: C.ink, alpha: 0.45 });
      }
    }
  }
  override destroy() {
    Ticker.shared.remove(this.tick, this);
    super.destroy({ children: true });
  }
}
