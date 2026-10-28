import { Container, Graphics, Ticker, TilingSprite } from 'pixi.js';
import { paperTexture } from '../art/textures';
import gsap from 'gsap';
import { W, H, game } from './App';
import { C } from '../ui/theme';
import { sfx } from './audio';
import { trimPixiPools } from './pixiFixes';

export abstract class Scene extends Container {
  /**
   * What fills the screen outside the 1920×1080 design box (wide monitors, phones):
   * a color (paper-textured when it's the paper tone) — or null when the scene draws its own
   * world out there (island, map, battle sea).
   */
  bleed: number | null = C.paper;
  /**
   * (optional, PERF) settles when the scene's first picture is complete (its paintings loaded, its set built). A
   * 'blocks' / 'iris' transition keeps the screen covered until then (at most COVER_WAIT_MS), so the wipe opens on
   * the finished scene instead of stuttering through its build. Set it in enter(), before the first await.
   */
  coverUntil?: Promise<unknown>;
  /** called after being added to stage */
  enter(): void {}
  /** called before removal */
  exit(): void {}
  update(_dt: number): void {}
}

/** 'black' (agent FINAL): a plain fade through black, no sound — the Parte III finale's cuts (never the comic wipe) */
export type Transition = 'blocks' | 'iris' | 'black' | 'none';

/** the longest a transition stays closed waiting for the next scene's first picture (Scene.coverUntil) */
export const COVER_WAIT_MS = 1000;

/** wait n rendered frames (the ticker renders under the cover meanwhile); a hidden tab doesn't wait */
function coveredFrames(n: number): Promise<void> {
  if (typeof requestAnimationFrame !== 'function' || (typeof document !== 'undefined' && document.visibilityState === 'hidden')) return Promise.resolve();
  return new Promise((res) => {
    let k = 0;
    const step = () => (++k >= n ? res() : requestAnimationFrame(step));
    requestAnimationFrame(step);
  });
}

class SceneManager {
  readonly sceneLayer = new Container();
  readonly overlayLayer = new Container();
  readonly fxLayer = new Container();
  current: Scene | null = null;
  private busy = false;

  /** paints the area outside the design box with the current scene's tone (no black bars) */
  readonly backdrop = new Container();
  init() {
    game.root.addChild(this.backdrop, this.sceneLayer, this.overlayLayer, this.fxLayer);
    game.onView(() => this.paintBackdrop());
    this.paintBackdrop();
    Ticker.shared.add((t) => this.current?.update(Math.min(0.05, t.deltaMS / 1000)));
  }
  paintBackdrop() {
    this.backdrop.removeChildren().forEach((c) => c.destroy());
    const v = game.view;
    const col = this.current ? this.current.bleed : C.paper;
    if (col === null) return;
    const bg = new TilingSprite({ texture: paperTexture(col), width: v.w, height: v.h });
    bg.position.set(v.x, v.y);
    this.backdrop.addChild(bg);
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
    else if (transition === 'black') await this.blackIn();
    else await this.irisIn();
    this.swap(next);
    // PERF (Parte III): the new scene's first frames are the heavy ones (its paintings decoded, its Graphics
    // tessellated, textures uploaded, shaders linked: 100–270 ms measured on the Carta / a battle / the island). Let
    // them happen while the screen is still covered, so the wipe never stutters as it opens.
    if (next.coverUntil) await Promise.race([next.coverUntil.catch(() => undefined), new Promise((r) => setTimeout(r, COVER_WAIT_MS))]);
    await coveredFrames(2);
    if (transition === 'blocks') await this.blocksOut();
    else if (transition === 'black') await this.blackOut();
    else await this.irisOut();
    this.busy = false;
  }

  private black?: Graphics;
  private blackIn() {
    const v = game.view;
    const g = new Graphics().rect(v.x - 10, v.y - 10, v.w + 20, v.h + 20).fill(0x000000);
    g.alpha = 0;
    this.fxLayer.addChild(g);
    this.black = g;
    return new Promise<void>((res) => gsap.to(g, { alpha: 1, duration: 0.35, ease: 'power1.in', onComplete: res }));
  }
  private blackOut() {
    const g = this.black!;
    this.black = undefined;
    return new Promise<void>((res) =>
      gsap.to(g, {
        alpha: 0,
        duration: 0.6,
        ease: 'power1.out',
        onComplete: () => {
          g.destroy();
          res();
        },
      }),
    );
  }

  private swap(next: Scene) {
    if (this.current) {
      this.current.exit();
      this.sceneLayer.removeChild(this.current);
      this.current.destroy({ children: true });
      trimPixiPools(); // the old scene's Graphics just returned their (ratcheted) batchers to Pixi's pools
    }
    this.current = next;
    this.sceneLayer.addChild(next);
    next.enter();
    this.paintBackdrop();
  }

  private blocks: Graphics[] = [];
  private blocksIn() {
    sfx('paper');
    const colors = [C.pink, C.ink, C.paper];
    this.blocks = colors.map((c) => {
      const v = game.view;
      const g = new Graphics().rect(0, v.y, v.w * 1.3 + 300, v.h).fill(c);
      g.skew.x = -0.18;
      g.x = v.x + v.w + 200;
      this.fxLayer.addChild(g);
      return g;
    });
    return new Promise<void>((res) => {
      const tl = gsap.timeline({ onComplete: res });
      this.blocks.forEach((b, i) => tl.to(b, { x: game.view.x - game.view.w * 0.15 - 200, duration: 0.32, ease: 'power3.in' }, i * 0.07));
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
      [...this.blocks].reverse().forEach((b, i) => tl.to(b, { x: game.view.x - game.view.w * 1.6 - 400, duration: 0.34, ease: 'power3.out' }, i * 0.07));
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
