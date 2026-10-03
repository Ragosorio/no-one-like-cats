import { Scene } from '../core/scenes';
import { paperBg, poster } from '../ui/widgets';
import { W, H } from '../core/App';

/** Placeholder — the anime ship-art agent replaces this lab scene. */
export class ShipArtLab extends Scene {
  override enter() {
    this.addChild(paperBg(W, H));
    const t = poster('SHIP ART LAB', 120);
    t.position.set(60, 60);
    this.addChild(t);
  }
}
