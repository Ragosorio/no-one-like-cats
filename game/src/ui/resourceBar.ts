import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from './theme';
import { Counter, txt } from './widgets';
import { icon, IconKind } from './icons';
import { sfx } from '../core/audio';
import { settings } from '../core/settings';
import { fmt } from '../core/format';

export interface ResourceSlot {
  key: string;
  icon: IconKind;
  color?: number;
  /** optional per-second rate shown under the value */
  rate?: boolean;
}

/** Row of resource pills with rolling counters; coins can fly into them. */
export class ResourceBar extends Container {
  pills = new Map<string, { c: Container; counter: Counter; rate?: ReturnType<typeof makeRate>; ic: Container }>();
  private pitch = 0;
  private pitchReset = 0;
  constructor(slots: ResourceSlot[], pillW = 220) {
    super();
    slots.forEach((s, i) => {
      const c = new Container();
      const bg = new Graphics().rect(5, 5, pillW, 58).fill(C.ink).rect(0, 0, pillW, 58).fill(s.color ?? C.paper).stroke({ width: 4, color: C.ink });
      const ic = icon(s.icon, 40);
      ic.position.set(32, 29);
      const counter = new Counter({ fontFamily: F.heavy, fontSize: 28, fill: C.ink });
      counter.position.set(60, s.rate ? 4 : 11);
      c.addChild(bg, ic, counter);
      let rate: ReturnType<typeof makeRate> | undefined;
      if (s.rate) {
        rate = makeRate();
        rate.position.set(62, 36);
        c.addChild(rate);
      }
      c.position.set(i * (pillW + 16), 0);
      this.addChild(c);
      this.pills.set(s.key, { c, counter, rate, ic });
    });
  }
  set(key: string, v: number, animate = true) {
    this.pills.get(key)?.counter.set(v, animate);
  }
  setRate(key: string, perSec: number) {
    const p = this.pills.get(key);
    if (p?.rate) p.rate.text = `+${fmt(perSec)}/s`;
  }
  /** global position of the pill icon (for fly-to effects) */
  target(key: string) {
    const p = this.pills.get(key);
    return p ? p.ic.getGlobalPosition() : null;
  }

  /**
   * Coins fly from a point (in `layer` coords) to the pill; `onArrive` fires per coin.
   * Count is log-scaled by amount.
   */
  fly(layer: Container, key: string, from: { x: number; y: number }, amount: number, kind?: IconKind, onDone?: () => void) {
    const p = this.pills.get(key);
    if (!p) return onDone?.();
    const tg = layer.toLocal(p.ic.getGlobalPosition());
    const n = settings.reduceMotion ? 1 : Math.max(2, Math.min(9, Math.round(Math.log10(amount + 1) * 2.2)));
    let arrived = 0;
    const now = performance.now();
    if (now - this.pitchReset > 1200) this.pitch = 0;
    for (let i = 0; i < n; i++) {
      const coin = icon(kind ?? (key as IconKind), 30);
      coin.position.set(from.x, from.y);
      layer.addChild(coin);
      const a = Math.random() * Math.PI * 2;
      const burst = 40 + Math.random() * 50;
      gsap
        .timeline({
          delay: i * 0.045,
          onComplete: () => {
            coin.destroy({ children: true });
            arrived++;
            this.pitchReset = performance.now();
            sfx('coin', 1 + Math.min(this.pitch, 12) * 0.06);
            this.pitch++;
            gsap.fromTo(p.ic.scale, { x: 1.3, y: 1.3 }, { x: 1, y: 1, duration: 0.25, ease: 'back.out(3)' });
            if (arrived === n) onDone?.();
          },
        })
        .to(coin, { x: from.x + Math.cos(a) * burst, y: from.y + Math.sin(a) * burst, duration: 0.18, ease: 'power2.out' })
        .to(coin, { x: tg.x, y: tg.y, duration: 0.5 + Math.random() * 0.12, ease: 'power2.in' });
    }
  }
}

function makeRate() {
  return txt("", { fontFamily: F.ui, fontWeight: "700", fontSize: 15, fill: C.ink });
}
