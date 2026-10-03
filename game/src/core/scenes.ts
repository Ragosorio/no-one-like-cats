import { Container, Graphics, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { W, H, game } from './App';
import { C } from '../ui/theme';
import { sfx } from './audio';

export abstract class Scene extends Container {
  /** called after being added to stage */
  enter(): void {}
  /** called before removal */
  exit(): void {}
  update(_dt: number): void {}
}

export type Transition = 'blocks' | 'iris' | 'none';

class SceneManager {
  readonly sceneLayer = new Container();
  readonly overlayLayer = new Container();
  readonly fxLayer = new Container();
  current: Scene | null = null;
  private busy = false;

  init() {
    game.root.addChild(this.sceneLayer, this.overlayLayer, this.fxLayer);
    const mask = new Graphics().rect(0, 0, W, H).fill(0xffffff);
    game.root.addChild(mask);
    game.root.mask = mask;
    Ticker.shared.add((t) => this.current?.update(Math.min(0.05, t.deltaMS / 1000)));
  }

  async go(next: Scene, transition: Transition = 'blocks') {
    if (this.busy) return;
    this.busy = true;
    if (transition === 'none' || !this.current) {
      this.swap(next);
      this.busy = false;
      return;
    }
    if (transition === 'blocks') await this.blocksIn();
    else await this.irisIn();
    this.swap(next);
    if (transition === 'blocks') await this.blocksOut();
    else await this.irisOut();
    this.busy = false;
  }

  private swap(next: Scene) {
    if (this.current) {
      this.current.exit();
      this.sceneLayer.removeChild(this.current);
      this.current.destroy({ children: true });
    }
    this.current = next;
    this.sceneLayer.addChild(next);
    next.enter();
  }

  private blocks: Graphics[] = [];
  private blocksIn() {
    sfx('paper');
    const colors = [C.pink, C.ink, C.paper];
    this.blocks = colors.map((c) => {
      const g = new Graphics().rect(0, 0, W * 1.3, H).fill(c);
      g.skew.x = -0.18;
      g.x = W * 1.2;
      this.fxLayer.addChild(g);
      return g;
    });
    return new Promise<void>((res) => {
      const tl = gsap.timeline({ onComplete: res });
      this.blocks.forEach((b, i) => tl.to(b, { x: -W * 0.15, duration: 0.32, ease: 'power3.in' }, i * 0.07));
    });
  }
  private blocksOut() {
    return new Promise<void>((res) => {
      const tl = gsap.timeline({
        onComplete: () => {
          this.blocks.forEach((b) => b.destroy());
          this.blocks = [];
          res();
        },
      });
      [...this.blocks].reverse().forEach((b, i) => tl.to(b, { x: -W * 1.6, duration: 0.34, ease: 'power3.out' }, i * 0.07));
    });
  }

  private iris?: Graphics;
  private irisIn() {
    const g = new Graphics().circle(0, 0, 10).fill(C.ink);
    g.position.set(W / 2, H / 2);
    g.scale.set(0);
    this.fxLayer.addChild(g);
    this.iris = g;
    return new Promise<void>((res) => gsap.to(g.scale, { x: 120, y: 120, duration: 0.45, ease: 'power3.in', onComplete: res }));
  }
  private irisOut() {
    const g = this.iris!;
    return new Promise<void>((res) =>
      gsap.to(g, {
        alpha: 0,
        duration: 0.35,
        onComplete: () => {
          g.destroy();
          res();
        },
      }),
    );
  }
}

export const scenes = new SceneManager();
