/** Island scene (owned by the island UI module). Placeholder. */
import { Scene } from '../core/scenes';
import { paperBg, poster } from '../ui/widgets';
import { W, H } from '../core/App';
export class IslandScene extends Scene {
  override enter() {
    this.addChild(paperBg(W, H));
    const t = poster('ISLA (en construcción)', 90);
    t.position.set(60, 60);
    this.addChild(t);
  }
}
