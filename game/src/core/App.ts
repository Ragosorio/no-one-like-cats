import { Application, Container } from 'pixi.js';

/** Logical design resolution. Everything is laid out in this space and scaled to fit the window. */
export const W = 1920;
export const H = 1080;

export class GameApp {
  readonly pixi = new Application();
  /** Root container in logical (1920x1080) coordinates. */
  readonly root = new Container();
  scale = 1;

  async init(parent: HTMLElement) {
    await this.pixi.init({
      resizeTo: window,
      background: '#0D110F',
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      preference: 'webgl',
    });
    parent.appendChild(this.pixi.canvas);
    this.pixi.stage.addChild(this.root);
    this.fit();
    window.addEventListener('resize', () => this.fit());
  }

  fit() {
    const sw = this.pixi.screen.width;
    const sh = this.pixi.screen.height;
    this.scale = Math.min(sw / W, sh / H);
    this.root.scale.set(this.scale);
    this.root.position.set((sw - W * this.scale) / 2, (sh - H * this.scale) / 2);
  }
}

export const game = new GameApp();
