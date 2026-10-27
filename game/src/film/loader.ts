/**
 * PELÍCULAS — the styled loading screen. While the film bakes (styles, cats, sets, warm-up) the player sees a film
 * leader: the title in the film's own typography, a countdown circle with its sweeping hand, a thin line that fills,
 * and what is being prepared («pinceladas de cerda», «pergamino»…). It animates on the app ticker (the baker yields a
 * frame between jobs). «Reducir movimiento»: the hand does not sweep, the circle just fills.
 */
import { Container, Graphics, Text, Ticker } from 'pixi.js';
import type { TypeStyle } from './types';
import { TYPE } from './present';

export class FilmLoader {
  readonly root = new Container();
  private g = new Graphics();
  private bar = new Graphics();
  private label: Text;
  private pct = 0;
  private shown = 0;
  private t = 0;
  private fading = -1;
  private done: (() => void) | null = null;
  private accent: number;

  constructor(
    host: Container,
    private view: { x: number; y: number; w: number; h: number },
    title: string,
    style: TypeStyle = 'default',
    caption = 'PELÍCULA',
    private rm = false,
  ) {
    const T = TYPE[style] ?? TYPE.default;
    this.accent = T.accent;
    const bg = new Graphics().rect(view.x - 10, view.y - 10, view.w + 20, view.h + 20).fill(0x050507);
    const kick = new Text({ text: caption, style: { fontFamily: 'Space Grotesk', fontWeight: '600', fontSize: 20, fill: 0x8f8a80, letterSpacing: 9 } });
    kick.anchor.set(0.5);
    kick.position.set(960, 318);
    const name = new Text({ text: title, style: { ...T.title(76), fill: style === 'davinci' ? 0xe8d5a9 : (T.title(76).fill as number) } });
    name.anchor.set(0.5);
    name.position.set(960, 420);
    this.label = new Text({ text: '', style: { fontFamily: 'Space Grotesk', fontWeight: '500', fontSize: 18, fill: 0x8f8a80, letterSpacing: 3 } });
    this.label.anchor.set(0.5);
    this.label.position.set(960, 812);
    this.root.addChild(bg, this.g, kick, name, this.bar, this.label);
    host.addChild(this.root);
    Ticker.shared.add(this.tick, this);
  }

  progress(p: number, label: string) {
    this.pct = Math.max(this.pct, Math.min(1, p));
    this.label.text = `${label.toUpperCase()} · ${Math.round(this.pct * 100)} %`;
  }

  private tick(tk: Ticker) {
    const dt = Math.min(0.1, tk.deltaMS / 1000);
    this.t += dt;
    this.shown += (this.pct - this.shown) * Math.min(1, dt * 6);
    const g = this.g;
    g.clear();
    // the film leader: two rings, a cross, the sweeping wedge
    const cx = 960;
    const cy = 640;
    const r = 92;
    g.circle(cx, cy, r + 14).stroke({ width: 2, color: 0x3a3832 });
    g.circle(cx, cy, r).stroke({ width: 3, color: 0x5a564c });
    g.moveTo(cx - r - 40, cy).lineTo(cx + r + 40, cy).stroke({ width: 1.5, color: 0x3a3832 });
    g.moveTo(cx, cy - r - 40).lineTo(cx, cy + r + 40).stroke({ width: 1.5, color: 0x3a3832 });
    const a0 = -Math.PI / 2;
    const sweep = this.rm ? this.shown * Math.PI * 2 : ((this.t * 1.1) % 1) * Math.PI * 2;
    g.moveTo(cx, cy).arc(cx, cy, r - 6, a0, a0 + Math.max(0.01, sweep)).lineTo(cx, cy).fill({ color: this.accent, alpha: 0.16 });
    // the line that fills
    const bw = 520;
    this.bar.clear().rect(cx - bw / 2, 772, bw, 2).fill(0x2a2824).rect(cx - bw / 2, 772, bw * this.shown, 2).fill(this.accent);
    if (this.fading >= 0) {
      this.fading += dt;
      this.root.alpha = Math.max(0, 1 - this.fading / 0.45);
      if (this.fading >= 0.45) this.finishNow();
    }
  }

  /** fade out (resolves when gone) */
  hide(): Promise<void> {
    this.pct = 1;
    return new Promise((res) => {
      this.done = res;
      this.fading = 0;
    });
  }
  private finishNow() {
    Ticker.shared.remove(this.tick, this);
    this.root.destroy({ children: true });
    const d = this.done;
    this.done = null;
    d?.();
  }
  destroy() {
    if (this.root.destroyed) return;
    Ticker.shared.remove(this.tick, this);
    this.root.destroy({ children: true });
    this.done?.();
    this.done = null;
  }
}
