/** Little floating menu anchored over a building (e.g. Puerto → Astillero / ¡ZARPAR!). */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { scenes } from '../../core/scenes';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { sfx } from '../../core/audio';
import { screenRect } from '../../ui/screen';

export interface PopItem {
  label: string;
  color?: number;
  textColor?: number;
  onTap: () => void;
}

let current: Container | null = null;

export function closePopMenu() {
  if (!current) return;
  const c = current;
  current = null;
  gsap.to(c, { alpha: 0, duration: 0.12, onComplete: () => c.destroy({ children: true }) });
}

export function openPopMenu(globalPos: { x: number; y: number }, title: string, items: PopItem[]) {
  closePopMenu();
  const layer = scenes.overlayLayer;
  const root = new Container();
  const catcher = screenRect({ color: 0, alpha: 0.001 });
  catcher.eventMode = 'static';
  catcher.on('pointerdown', () => closePopMenu());
  root.addChild(catcher);
  const box = new Container();
  const bw = 250;
  const bh = 58 + items.length * 70;
  const g = new Graphics();
  g.rect(8, 8, bw, bh).fill(C.ink);
  g.rect(0, 0, bw, bh).fill(C.paper).stroke({ width: 4, color: C.ink, alignment: 1 });
  g.rect(0, 0, bw, 46).fill(C.ink);
  g.poly([bw / 2 - 16, bh, bw / 2 + 16, bh, bw / 2, bh + 22]).fill(C.paper).stroke({ width: 4, color: C.ink });
  g.rect(bw / 2 - 14, bh - 4, 28, 6).fill(C.paper);
  const t = txt(title, { fontFamily: F.poster, fontSize: 30, fill: C.paper });
  t.position.set(14, 4);
  box.addChild(g, t);
  items.forEach((it, i) => {
    const b = new Container();
    const face = new Container();
    const bg = new Graphics().rect(5, 5, bw - 28, 56).fill(C.ink).rect(0, 0, bw - 28, 56).fill(it.color ?? C.paper).stroke({ width: 3, color: C.ink });
    const lt = txt(it.label, { fontFamily: F.poster, fontSize: 30, fill: it.textColor ?? C.ink });
    lt.anchor.set(0.5);
    lt.position.set((bw - 28) / 2, 28);
    face.addChild(bg, lt);
    b.addChild(face);
    b.position.set(14, 58 + i * 70);
    b.eventMode = 'static';
    b.cursor = 'pointer';
    b.on('pointerover', () => gsap.to(face, { x: -3, y: -3, duration: 0.1 }));
    b.on('pointerout', () => gsap.to(face, { x: 0, y: 0, duration: 0.12 }));
    b.on('pointertap', () => {
      sfx('click');
      closePopMenu();
      it.onTap();
    });
    box.addChild(b);
  });
  const lp = layer.toLocal(globalPos);
  box.position.set(Math.max(20, Math.min(W - bw - 20, lp.x - bw / 2)), Math.max(20, Math.min(H - bh - 40, lp.y - bh - 24)));
  root.addChild(box);
  layer.addChild(root);
  current = root;
  sfx('paper');
  gsap.from(box, { y: box.y + 20, alpha: 0, duration: 0.2, ease: 'back.out(2)' });
}
