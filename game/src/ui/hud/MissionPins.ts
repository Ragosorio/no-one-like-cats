/** Left column: up to 3 pinned missions with progress and a direct "IR" action. */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../theme';
import { txt } from '../widgets';
import { G } from '../../state/game';
import { MISSION_BY_ID, MissionDef } from '../../data/content';
import { evalGoal } from '../../state/sys/missions';
import { fmt } from '../../core/format';
import { card, pressable } from './parts';

export const CHAIN_META: Record<string, { name: string; color: number; text: number }> = {
  historia: { name: 'HISTORIA', color: C.pinkHot, text: C.paper },
  capitan: { name: 'CAPITÁN', color: C.megaBlue, text: C.paper },
  criador: { name: 'CRIADOR', color: C.green, text: C.paper },
  explorador: { name: 'EXPLORADOR', color: C.orange, text: C.ink },
};

const W = 392;
const H = 100;

class PinCard extends Container {
  bar = new Graphics();
  prog: Text;
  face = new Container();
  private lastCur = -1;
  constructor(
    public m: MissionDef,
    onGo: (m: MissionDef) => void,
  ) {
    super();
    const meta = CHAIN_META[m.chain] ?? CHAIN_META.historia;
    const bg = card(W, H, C.paper, 6);
    const strip = new Graphics().rect(0, 0, 30, H).fill(meta.color).stroke({ width: 3, color: C.ink, alignment: 1 });
    const chain = txt(meta.name, { fontFamily: F.bebas, fontSize: 18, fill: meta.text, letterSpacing: 2 });
    chain.rotation = -Math.PI / 2;
    chain.anchor.set(0.5);
    chain.position.set(15, H / 2);
    const title = txt(m.title, { fontFamily: F.poster, fontSize: 24, fill: C.ink });
    title.position.set(42, 6);
    if (title.width > W - 120) title.scale.set((W - 120) / title.width);
    const goal = txt(m.goal.text, { fontFamily: F.ui, fontSize: 15, fill: C.ink, wordWrap: true, wordWrapWidth: W - 128, lineHeight: 17 });
    goal.position.set(42, 38);
    if (goal.height > 36) goal.scale.set(36 / goal.height);
    this.bar.position.set(42, H - 16);
    this.prog = txt('', { fontFamily: F.ui, fontWeight: '700', fontSize: 13, fill: C.ink });
    this.prog.anchor.set(1, 0.5);
    this.prog.position.set(W - 82, H - 13);
    // go button: a fat arrow tab
    const go = new Container();
    const gb = new Graphics().rect(0, 0, 58, H - 22).fill(meta.color).stroke({ width: 3, color: C.ink });
    const arrow = new Graphics().poly([14, -9, 30, -9, 30, -19, 46, 0, 30, 19, 30, 9, 14, 9]).fill(meta.text).stroke({ width: 2.5, color: C.ink, join: 'round' });
    arrow.position.set(0, (H - 22) / 2 + 8);
    const gt = txt('IR', { fontFamily: F.bebas, fontSize: 20, fill: meta.text, letterSpacing: 2 });
    gt.anchor.set(0.5, 0);
    gt.position.set(29, 6);
    go.addChild(gb, gt, arrow);
    go.position.set(W - 70, 11);
    this.face.addChild(bg, strip, chain, title, goal, this.bar, this.prog, go);
    this.addChild(this.face);
    pressable(this, () => onGo(m), { face: this.face });
    this.refresh();
  }
  refresh() {
    const e = evalGoal(this.m);
    const cur = Math.min(e.cur, e.need);
    if (cur === this.lastCur) return;
    const up = this.lastCur >= 0 && cur > this.lastCur;
    this.lastCur = cur;
    const bw = W - 200;
    const p = e.need > 0 ? cur / e.need : 0;
    this.bar.clear().rect(0, 0, bw, 9).fill(C.paperDark).stroke({ width: 2, color: C.ink, alignment: 1 }).rect(0, 0, bw * p, 9).fill(CHAIN_META[this.m.chain]?.color ?? C.pink);
    this.prog.text = `${fmt(cur)} / ${fmt(e.need)}`;
    if (up) gsap.fromTo(this.prog.scale, { x: 1.4, y: 1.4 }, { x: 1, y: 1, duration: 0.35, ease: 'back.out(3)' });
  }
  /** completed: stamp + slide out */
  complete(onDone: () => void) {
    const st = new Container();
    const sb = new Graphics().rect(-80, -26, 160, 52).fill(C.yellow).stroke({ width: 4, color: C.ink });
    const t = txt('¡HECHO!', { fontFamily: F.comic, fontSize: 40, fill: C.ink });
    t.anchor.set(0.5);
    st.addChild(sb, t);
    st.position.set(W / 2, H / 2);
    st.rotation = -0.1;
    this.addChild(st);
    gsap.fromTo(st.scale, { x: 2.4, y: 2.4 }, { x: 1, y: 1, duration: 0.25, ease: 'back.out(2)' });
    gsap.to(this, { x: -W - 40, alpha: 0, delay: 1.1, duration: 0.35, ease: 'power2.in', onComplete: onDone });
  }
}

export class MissionPins extends Container {
  private cards = new Map<string, PinCard>();
  private sig = '';
  private acc = 0;
  private leaving = new Set<string>();
  constructor(public onGo: (m: MissionDef) => void) {
    super();
  }
  /** a pinned mission was completed */
  markDone(id: string) {
    const c = this.cards.get(id);
    if (!c || this.leaving.has(id)) return;
    this.leaving.add(id);
    c.complete(() => {
      this.cards.delete(id);
      this.leaving.delete(id);
      c.destroy({ children: true });
      this.sig = '';
    });
  }
  update(dt: number) {
    const pins = G.s.missions.pinned.filter((id) => MISSION_BY_ID.has(id));
    const sig = pins.join(',');
    if (sig !== this.sig) {
      this.sig = sig;
      for (const [id, c] of this.cards)
        if (!pins.includes(id) && !this.leaving.has(id)) {
          this.cards.delete(id);
          c.destroy({ children: true });
        }
      pins.forEach((id) => {
        if (!this.cards.has(id)) {
          const c = new PinCard(MISSION_BY_ID.get(id)!, this.onGo);
          this.cards.set(id, c);
          this.addChild(c);
          c.x = -W;
          gsap.to(c, { x: 0, duration: 0.4, ease: 'back.out(1.6)' });
        }
      });
    }
    let y = 0;
    for (const [id, c] of this.cards) {
      if (this.leaving.has(id)) {
        y += H + 14;
        continue;
      }
      if (Math.abs(c.y - y) > 0.5) c.y += (y - c.y) * Math.min(1, dt * 12);
      y += H + 14;
    }
    this.acc += dt;
    if (this.acc > 0.25) {
      this.acc = 0;
      for (const c of this.cards.values()) c.refresh();
    }
  }
}
