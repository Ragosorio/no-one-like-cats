/**
 * SINCRO's only UI: a ring at the shooter's muzzle while you aim. It breathes toward each window and glows while
 * the window is open; release the shot inside the glow. One short hint the first time, then nothing — the music is
 * never explained. Works with the sound off (the internal clock drives the same schedule) and with Reducir
 * movimiento (no shrinking ring: the glow just fades in before the window).
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import type { BattleScene } from '../../scenes/BattleScene';
import { settings } from '../../core/settings';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { G } from '../../state/game';

/** how early the approach ring appears before a window (s) */
const LEAD = 0.6;
const HINT_FLAG = 'hint_sincro';
let hintThisSession = false;

export interface RingState {
  visible: boolean;
  x: number;
  y: number;
  /** seconds to the next window's center (null = none soon) */
  toNext: number | null;
  /** inside a window now */
  open: boolean;
  /** window half-width (s) */
  w: number;
}

export class SincroRing {
  private g = new Graphics();
  private layer = new Container();
  private hint: Container | null = null;
  shownOnce = false;
  /** a teaching battle: the hint shows every time, a little longer */
  teach = false;

  constructor(private s: BattleScene) {
    this.layer.eventMode = 'none';
    this.layer.addChild(this.g);
    s.wfx.addChild(this.layer);
  }

  draw(st: RingState) {
    const g = this.g;
    g.clear();
    if (!st.visible) {
      this.layer.visible = false;
      return;
    }
    this.layer.visible = true;
    if (!this.shownOnce) {
      this.shownOnce = true;
      this.showHint(st.x, st.y);
    }
    const k = 1 / Math.max(0.5, Math.min(1.2, this.s.cam.z));
    const R = 54 * k;
    const rm = settings.reduceMotion;
    g.circle(st.x, st.y, R).stroke({ width: 3 * k, color: C.ink, alpha: 0.35 });
    if (st.open) {
      g.circle(st.x, st.y, R + 6 * k).fill({ color: 0xffe14a, alpha: 0.16 });
      g.circle(st.x, st.y, R).stroke({ width: 8 * k, color: C.ink, alpha: 0.9 });
      g.circle(st.x, st.y, R).stroke({ width: 5 * k, color: 0xffe14a, alpha: 1 });
      return;
    }
    if (st.toNext === null || st.toNext > LEAD) {
      g.circle(st.x, st.y, R).stroke({ width: 2 * k, color: 0xffe14a, alpha: 0.35 });
      return;
    }
    const p = Math.max(0, Math.min(1, (st.toNext - st.w) / (LEAD - st.w)));
    if (rm) {
      g.circle(st.x, st.y, R).stroke({ width: 3 * k, color: 0xffe14a, alpha: 0.35 + 0.5 * (1 - p) });
      return;
    }
    g.circle(st.x, st.y, R).stroke({ width: 2 * k, color: 0xffe14a, alpha: 0.45 });
    g.circle(st.x, st.y, R + 120 * k * p).stroke({ width: (2 + 2 * (1 - p)) * k, color: 0xffe14a, alpha: 0.25 + 0.55 * (1 - p) });
  }

  /** the one contextual hint (once per save; once per session without a save) */
  private showHint(x: number, y: number) {
    const seen = !this.teach && (hintThisSession || (G.loaded && G.has(HINT_FLAG)));
    if (seen) return;
    hintThisSession = true;
    try {
      if (G.loaded) G.flag(HINT_FLAG);
    } catch {
      /* no save loaded (dev routes) */
    }
    const t = txt('¡SUELTA EN EL BRILLO!', { fontFamily: F.poster, fontSize: 26, fill: 0xffe14a, stroke: { color: C.ink, width: 6, join: 'round' } });
    t.anchor.set(0.5, 1);
    t.position.set(x, y - 74);
    this.layer.addChild(t);
    this.hint = t;
    gsap.from(t, { alpha: 0, y: t.y + 12, duration: 0.25 });
    gsap.to(t, { alpha: 0, delay: this.teach ? 4.5 : 2.8, duration: 0.4, onComplete: () => !t.destroyed && t.destroy() });
  }

  dispose() {
    if (this.hint && !this.hint.destroyed) gsap.killTweensOf(this.hint);
    if (!this.layer.destroyed) this.layer.destroy({ children: true });
  }
}
