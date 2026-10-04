/** Bottom action bar: only shows what's unlocked; new buttons pop in with a "¡NUEVO!" tag. */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../theme';
import { txt } from '../widgets';
import { sfx } from '../../core/audio';
import { card, pressable } from './parts';
import { glyph, GlyphKind } from './glyphs';
import { setUiSeen, uiSeen } from '../../state/ext/island';

export interface ActionDef {
  id: string;
  label: string;
  glyph: GlyphKind;
  onTap: () => void;
  big?: boolean;
  color?: number;
  visible: () => boolean;
  badge?: () => string | null;
}

class ActionButton extends Container {
  face = new Container();
  badge = new Container();
  private badgeText = '';
  newTag: Container | null = null;
  constructor(public def: ActionDef) {
    super();
    const w = def.big ? 210 : 128;
    const h = 100;
    const col = def.color ?? C.paper;
    const bg = card(w, h, col, 6, 4);
    const gl = glyph(def.glyph, def.big ? 54 : 46, C.ink, def.big ? C.yellow : C.pink);
    gl.position.set(w / 2, def.big ? 38 : 40);
    const t = txt(def.label, { fontFamily: def.big ? F.poster : F.bebas, fontSize: def.big ? 34 : 23, fill: def.big ? C.paper : C.ink, letterSpacing: def.big ? 0 : 1 });
    t.anchor.set(0.5);
    t.position.set(w / 2, def.big ? 78 : 82);
    if (def.big) t.style.stroke = { color: C.ink, width: 6, join: 'round' };
    this.face.addChild(bg, gl, t, this.badge);
    this.face.pivot.set(w / 2, h / 2);
    this.face.position.set(w / 2, h / 2);
    this.addChild(this.face);
    pressable(this, () => {
      if (this.newTag) {
        gsap.killTweensOf(this.newTag);
        this.newTag.destroy({ children: true });
        this.newTag = null;
        setUiSeen(`btn_${def.id}`);
      }
      def.onTap();
    }, { face: this.face });
  }
  get w() {
    return this.def.big ? 210 : 128;
  }
  refreshBadge() {
    const b = this.def.badge?.() ?? null;
    const key = b ?? '';
    if (key === this.badgeText) return;
    this.badgeText = key;
    this.badge.removeChildren().forEach((c) => c.destroy({ children: true }));
    if (!b) return;
    const t = txt(b, { fontFamily: F.comic, fontSize: 20, fill: C.paper });
    t.anchor.set(0.5);
    const bw = Math.max(34, t.width + 16);
    const g = new Graphics().roundRect(-bw / 2, -15, bw, 30, 15).fill(C.red).stroke({ width: 3, color: C.ink });
    this.badge.addChild(g, t);
    this.badge.position.set(this.w - 10, 4);
    gsap.fromTo(this.badge.scale, { x: 0.3, y: 0.3 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
  }
  override destroy(o?: Parameters<Container['destroy']>[0]) {
    if (this.newTag) gsap.killTweensOf(this.newTag);
    gsap.killTweensOf(this.face);
    gsap.killTweensOf(this.face.scale);
    gsap.killTweensOf(this);
    super.destroy(o);
  }
  markNew() {
    const tag = new Container();
    const g = new Graphics().rect(-38, -13, 76, 26).fill(C.yellow).stroke({ width: 3, color: C.ink });
    const t = txt('¡NUEVO!', { fontFamily: F.comic, fontSize: 18, fill: C.ink });
    t.anchor.set(0.5);
    tag.addChild(g, t);
    tag.position.set(this.w / 2, -12);
    tag.rotation = -0.08;
    this.addChild(tag);
    gsap.to(tag, { y: -18, duration: 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    this.newTag = tag;
  }
}

export class ActionBar extends Container {
  private buttons = new Map<string, ActionButton>();
  private sig = '';
  private acc = 0;
  constructor(public defs: ActionDef[]) {
    super();
  }
  update(dt: number) {
    this.acc += dt;
    if (this.acc < 0.2 && this.sig) return;
    this.acc = 0;
    const vis = this.defs.filter((d) => d.visible());
    const sig = vis.map((d) => d.id).join(',');
    if (sig !== this.sig) {
      const first = this.sig === '';
      this.sig = sig;
      for (const [id, b] of this.buttons)
        if (!vis.some((d) => d.id === id)) {
          this.buttons.delete(id);
          b.destroy({ children: true });
        }
      for (const d of vis)
        if (!this.buttons.has(d.id)) {
          const b = new ActionButton(d);
          this.buttons.set(d.id, b);
          this.addChild(b);
          if (!first && !uiSeen(`btn_${d.id}`)) {
            b.markNew();
            sfx('pop', 1.3);
            gsap.fromTo(b.face.scale, { x: 0, y: 0 }, { x: 1, y: 1, duration: 0.5, ease: 'back.out(2.5)' });
          } else setUiSeen(`btn_${d.id}`);
        }
      // layout centered around x=0
      const gap = 16;
      const total = vis.reduce((a, d) => a + (d.big ? 210 : 128), 0) + gap * (vis.length - 1);
      let x = -total / 2;
      for (const d of vis) {
        const b = this.buttons.get(d.id)!;
        if (first) b.x = x;
        else gsap.to(b, { x, duration: 0.3, ease: 'power2.out' });
        x += b.w + gap;
      }
    }
    for (const b of this.buttons.values()) b.refreshBadge();
  }
  buttonGlobal(id: string) {
    const b = this.buttons.get(id);
    return b ? b.getGlobalPosition() : null;
  }
}
