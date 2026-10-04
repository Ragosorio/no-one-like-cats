/** Sea map / stage selection (owned by the campaign UI module). Placeholder. */
import { Scene } from '../core/scenes';
import { paperBg, poster, Button } from '../ui/widgets';
import { W, H } from '../core/App';
import { goBattle, goIsland } from '../app/flow';
import { frontier } from '../state/sys/campaign';
export class MapScene extends Scene {
  override enter() {
    this.addChild(paperBg(W, H));
    const t = poster('MAPA (en construcción)', 90);
    t.position.set(60, 60);
    this.addChild(t);
    const f = frontier();
    const b = new Button(`ZARPAR ${f.zone}-${f.stage}`, () => goBattle(f.zone, f.stage), { w: 360 });
    b.position.set(60, 300);
    const back = new Button('ISLA', () => goIsland(), { w: 200 });
    back.position.set(60, 420);
    this.addChild(b, back);
  }
}
