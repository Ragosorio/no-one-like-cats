/** Island/map HUD (owned by the island UI module). Placeholder container so other scenes can mount it. */
import { Container } from 'pixi.js';
export class Hud extends Container {
  constructor(_opts: { compact?: boolean } = {}) {
    super();
  }
  update(_dt: number) {}
}
