import { Application, Container } from 'pixi.js';

/** Logical design resolution. Everything is laid out in this space and scaled to fit the window. */
export const W = 1920;
export const H = 1080;

export interface ViewRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class GameApp {
  readonly pixi = new Application();
  /** Root container in logical (1920x1080) coordinates. */
  readonly root = new Container();
  scale = 1;
  /**
   * The whole visible screen in logical coordinates. The 1920×1080 design box sits centered inside;
   * on wider/taller screens the view is bigger than the box (x/y negative) — scenes paint their
   * background (or simply show more world) out to here instead of black bars.
   */
  view: ViewRect = { x: 0, y: 0, w: W, h: H };
  private viewListeners = new Set<(v: ViewRect) => void>();
  onView(fn: (v: ViewRect) => void) {
    this.viewListeners.add(fn);
    return () => this.viewListeners.delete(fn);
  }

  async init(parent: HTMLElement) {
    await this.pixi.init({
      resizeTo: window,
      background: '#0D110F',
      // < 1 so Pixi asks for an alpha-capable WebGL context: Parte II's 3D regions render on a canvas
      // UNDER this one and need it to go transparent (RegionScene sets alpha 0). 0.999 looks identical.
      backgroundAlpha: 0.999,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      preference: 'webgl',
    });
    parent.appendChild(this.pixi.canvas);
    this.pixi.stage.addChild(this.root);
    this.fit();
    // fit after Pixi has resized its screen (window 'resize' fires before resizeTo updates)
    this.pixi.renderer.on('resize', () => this.fit());
    window.addEventListener('resize', () => requestAnimationFrame(() => this.fit()));
  }

  fit() {
    const sw = this.pixi.screen.width;
    const sh = this.pixi.screen.height;
    this.scale = Math.min(sw / W, sh / H);
    this.root.scale.set(this.scale);
    const ox = (sw - W * this.scale) / 2;
    const oy = (sh - H * this.scale) / 2;
    this.root.position.set(ox, oy);
    this.view = { x: -ox / this.scale, y: -oy / this.scale, w: sw / this.scale, h: sh / this.scale };
    for (const f of this.viewListeners) f(this.view);
  }
}

export const game = new GameApp();
