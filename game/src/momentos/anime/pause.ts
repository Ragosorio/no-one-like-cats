/**
 * PAUSE — a small «II» button (top right) and the pause card. Esc toggles it, a hidden tab opens it.
 * First time: SEGUIR only (a Momento can't be skipped). Replays («Volver a ver»): SEGUIR + SALIR.
 */
import { Container, Graphics, Rectangle } from 'pixi.js';
import { W, H, type Kit } from './kit';
import { KATA_STYLE, SFX_STYLE } from './fx';

const INK = 0x120b2e;
const PAPER = 0xfff8ec;
const YELLOW = 0xffe14a;

export class PauseUI {
  readonly button = new Container();
  private card: Container | null = null;
  constructor(
    private k: Kit,
    private canExit: boolean,
    private onToggle: (on: boolean) => void,
    private onExit: () => void,
  ) {
    const b = this.button;
    const g = new Graphics().circle(0, 0, 34).fill(INK).circle(0, 0, 28).fill({ color: PAPER, alpha: 0.12 }).rect(-11, -14, 7, 28).fill(PAPER).rect(4, -14, 7, 28).fill(PAPER);
    b.addChild(g);
    b.position.set(k.view.x + k.view.w - 64, k.view.y + 60);
    b.eventMode = 'static';
    b.cursor = 'pointer';
    b.hitArea = new Rectangle(-44, -44, 88, 88);
    b.on('pointerdown', (e) => {
      e.stopPropagation();
      this.onToggle(!this.card);
    });
    b.alpha = 0.75;
    k.layers.ui.addChild(b);
  }
  get open() {
    return !!this.card;
  }
  show(on: boolean) {
    const k = this.k;
    if (on && !this.card) {
      const c = new Container();
      c.eventMode = 'static';
      c.hitArea = new Rectangle(k.view.x, k.view.y, k.view.w, k.view.h);
      c.on('pointerdown', (e) => e.stopPropagation());
      c.addChild(new Graphics().rect(k.view.x, k.view.y, k.view.w, k.view.h).fill({ color: INK, alpha: 0.72 }));
      const slab = new Graphics().poly([W / 2 - 520, H / 2 - 190, W / 2 + 560, H / 2 - 230, W / 2 + 520, H / 2 + 200, W / 2 - 560, H / 2 + 230]).fill(YELLOW);
      c.addChild(slab);
      const t = k.text.sprite('PAUSA', SFX_STYLE(150, PAPER, INK));
      t.position.set(W / 2, H / 2 - 80);
      t.rotation = -0.04;
      const kt = k.text.sprite('一時停止', KATA_STYLE(40, INK, PAPER));
      kt.position.set(W / 2 + 300, H / 2 - 160);
      c.addChild(t, kt);
      const mk = (label: string, x: number, fn: () => void) => {
        const bt = new Container();
        bt.addChild(new Graphics().roundRect(-170, -48, 340, 96, 18).fill(INK), k.text.sprite(label, SFX_STYLE(52, PAPER, INK)));
        bt.position.set(x, H / 2 + 110);
        bt.eventMode = 'static';
        bt.cursor = 'pointer';
        bt.on('pointertap', (e) => {
          e.stopPropagation();
          fn();
        });
        c.addChild(bt);
      };
      mk('SEGUIR', this.canExit ? W / 2 - 200 : W / 2, () => this.onToggle(false));
      if (this.canExit) mk('SALIR', W / 2 + 200, () => this.onExit());
      k.layers.ui.addChild(c);
      this.card = c;
    } else if (!on && this.card) {
      this.card.destroy({ children: true });
      this.card = null;
    }
  }
  dispose() {
    this.card?.destroy({ children: true });
    this.card = null;
    this.button.destroy({ children: true });
  }
}
