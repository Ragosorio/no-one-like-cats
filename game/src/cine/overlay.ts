/**
 * The cine's own screen furniture: thin letterbox bars on the REAL screen edges and the SALTAR button
 * (top right, same paper-and-ink look as the dialogs'). Esc skips too. Kept above the story layer so SALTAR
 * stays reachable while Luzterna talks. No Pixi state outlives `clear()`.
 */
import { Container, Graphics, Ticker } from 'pixi.js';
import { game } from '../core/App';
import { scenes } from '../core/scenes';
import { sfx } from '../core/audio';
import { C } from '../ui/theme';
import { poster } from '../ui/widgets';
import type { UiCmd } from './types';

const BAR = 52;

export class CineOverlay {
  private root = new Container();
  private bars = [new Graphics(), new Graphics()];
  private skipBtn = new Container();
  private k = 0;
  private want = 0;
  private onSkip: (() => void) | null = null;
  private closing = false;
  private parked = new Set<Container>();
  constructor() {
    this.root.label = 'cine';
    this.root.addChild(...this.bars, this.skipBtn);
    const g = new Graphics().rect(5, 5, 170, 54).fill(C.ink).rect(0, 0, 170, 54).fill(C.paper).stroke({ width: 4, color: C.ink, alignment: 1 });
    const t = poster('SALTAR »', 32, C.ink);
    t.anchor.set(0.5);
    t.position.set(85, 27);
    this.skipBtn.addChild(g, t);
    this.skipBtn.eventMode = 'static';
    this.skipBtn.cursor = 'pointer';
    this.skipBtn.visible = false;
    this.skipBtn.alpha = 0;
    this.skipBtn.on('pointertap', (e) => {
      e.stopPropagation();
      sfx('click');
      this.onSkip?.();
    });
    scenes.overlayLayer.addChild(this.root);
    Ticker.shared.add(this.tick, this);
    window.addEventListener('keydown', this.onKey);
  }
  private onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.skipBtn.visible) {
      e.preventDefault();
      this.onSkip?.();
    }
  };
  set(o: UiCmd, onSkip: () => void) {
    this.onSkip = onSkip;
    if (o.bars !== undefined) this.want = o.bars ? 1 : 0;
    if (o.skip !== undefined) this.skipBtn.visible = o.skip;
  }
  clear() {
    this.closing = true;
    this.want = 0;
    this.skipBtn.visible = false;
    this.onSkip = null;
  }
  private tick(tk: Ticker) {
    if (this.root.destroyed) return;
    const dt = Math.min(0.1, tk.deltaMS / 1000);
    this.k += (this.want - this.k) * Math.min(1, dt * 6);
    if (Math.abs(this.k - this.want) < 0.004) this.k = this.want;
    // stay above the story layer (dialogs re-append it on every say())
    const p = this.root.parent;
    if (p && p.children[p.children.length - 1] !== this.root) p.addChild(this.root);
    // corner tips wait while the letterbox is up (they'd sit on the scene; they come back when it's gone)
    for (const c of p?.children ?? [])
      for (const t of c.label === 'storyLayer' ? c.children : [])
        if (t.label === 'tip' && !t.destroyed) {
          if (this.want > 0 && t.visible) {
            t.visible = false;
            this.parked.add(t);
          } else if (this.want === 0 && this.parked.has(t)) {
            t.visible = true;
            this.parked.delete(t);
          }
        }
    const v = game.view;
    this.bars[0].clear().rect(v.x, v.y - BAR + BAR * this.k, v.w, BAR).fill(C.ink);
    this.bars[1].clear().rect(v.x, v.y + v.h - BAR * this.k, v.w, BAR).fill(C.ink);
    this.bars[0].visible = this.bars[1].visible = this.k > 0.003;
    this.skipBtn.position.set(v.x + v.w - 210, v.y + BAR * this.k + 18);
    this.skipBtn.alpha += ((this.skipBtn.visible ? 1 : 0) - this.skipBtn.alpha) * Math.min(1, dt * 5);
    if (this.closing && this.k === 0) this.destroy();
  }
  destroy() {
    for (const t of this.parked) if (!t.destroyed) t.visible = true;
    this.parked.clear();
    Ticker.shared.remove(this.tick, this);
    window.removeEventListener('keydown', this.onKey);
    if (!this.root.destroyed) this.root.destroy({ children: true });
  }
}
