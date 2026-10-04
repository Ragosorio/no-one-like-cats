/** Purchase celebration shared by every tab: coins fly from the wallet → ¡KA-CHING! → ticket → stamp. */
import { Container } from 'pixi.js';
import gsap from 'gsap';
import { scenes } from '../../core/scenes';
import { C } from '../../ui/theme';
import { nextReceipt } from '../../state/sys/shop';
import type { ShopCtx } from './ctx';
import { Cur, flyCoins, kaChing, receipt, slamStamp } from './ui';

let busy = false;
/** true while a purchase animation is running (tabs ignore double taps) */
export function buying() {
  return busy;
}

/**
 * Runs the purchase juice toward `target` (a node inside the shop). The state change must already
 * be done; `after` runs when the coins land (usually ctx.refresh()).
 */
export function celebrate(ctx: ShopCtx, target: Container, cur: Cur, price: number, item: string, after?: () => void, o: { word?: string; stamp?: string; color?: number } = {}) {
  busy = true;
  const b = target.getBounds();
  const to = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  const from = ctx.walletAt(cur);
  const n = Math.max(5, Math.min(12, Math.round(3 + Math.log10(price + 1) * 1.5)));
  flyCoins(cur, from, to, n, () => {
    kaChing(to, o.word ?? '¡KA-CHING!', o.color ?? (cur === 'gems' ? C.pinkHot : C.yellow));
    const layer = scenes.fxLayer;
    const lp = layer.toLocal(to);
    slamStamp(layer, lp.x, lp.y + 70, o.stamp ?? '¡TUYO!', C.red, 38);
    receipt(layer, Math.min(lp.x + 90, 1920 - 220), lp.y - 40, nextReceipt(), item, cur, price);
    gsap.delayedCall(0.35, () => {
      busy = false;
      if (!ctx.m.closed) after?.();
    });
  });
  // safety: never stay locked
  gsap.delayedCall(2.5, () => (busy = false));
}
