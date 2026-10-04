import { ColorMatrixFilter, Container, Graphics, Sprite, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { BattleCat } from '../art/catArt';
import { CatFx } from './types';
import { C, F } from '../ui/theme';
import { txt, poster } from '../ui/widgets';
import { InkFilter, SilhouetteFilter } from '../fx/filters';
import { dotTexture, sparkTexture } from '../art/textures';
import { sfx } from '../core/audio';
import { onomatopoeia } from '../fx/juice';

/**
 * Visible status effects on a battle cat: burning, shocked, wet, frozen.
 * Lives as a child of the BattleCat so it follows bob/recoil.
 */
export class CatStatusView extends Container {
  fx: CatFx = { burning: 0, shocked: 0, wet: 0, frozen: 0 };
  private flames = new Container();
  private ice = new Graphics();
  private stun = new Container();
  private stunOn = false;
  private stunA = 0;
  private acc = 0;
  private flick = 0;
  private baseTint: number;
  constructor(public cat: BattleCat) {
    super();
    this.baseTint = Number(cat.sprite.tint);
    this.addChild(this.flames, this.ice, this.stun);
    this.ice.visible = false;
    for (let i = 0; i < 3; i++) this.stun.addChild(new Graphics().star(0, 0, 5, 11, 5).fill(C.yellow).stroke({ width: 3, color: C.ink }));
    this.stun.visible = false;
    cat.addChild(this);
    Ticker.shared.add(this.tick, this);
  }

  set(fx: CatFx) {
    const was = this.fx;
    this.fx = { ...fx };
    if (fx.frozen > 0 && !(was.frozen > 0)) this.freeze();
    if (!(fx.frozen > 0) && was.frozen > 0) this.thaw();
    if (fx.burning > 0 && !(was.burning > 0)) sfx('whoosh', 1.4);
    this.applyTint();
  }

  private applyTint() {
    const s = this.cat.sprite;
    if (this.fx.frozen > 0) s.tint = 0xbfefff;
    else if (this.fx.wet > 0) s.tint = 0xc4dcff;
    else s.tint = this.baseTint;
  }

  /** dizzy stars while the cat is stunned (Aturdido / agarrado por un tentáculo) */
  setStun(on: boolean) {
    if (on === this.stunOn) return;
    this.stunOn = on;
    this.stun.visible = on;
    if (on) gsap.fromTo(this.stun.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
  }

  /** x-ray electrocution: flicker between ink-inverted and normal, with arcs */
  electrocute() {
    const s = this.cat.sprite;
    const prev = [...(s.filters ?? [])];
    const ink = new InkFilter({ threshold: 0.5, invert: true, ink: 0x171317, paper: 0xfff36b });
    const arcs = new Graphics();
    this.addChild(arcs);
    sfx('zap');
    sfx('zap', 1.3);
    let n = 0;
    const size = this.cat.size;
    const iv = window.setInterval(() => {
      if (this.destroyed || s.destroyed) {
        window.clearInterval(iv);
        return;
      }
      n++;
      s.filters = n % 2 ? [ink] : prev;
      arcs.clear();
      for (let k = 0; k < 3; k++) {
        let x = (Math.random() - 0.5) * size * 0.8;
        let y = -Math.random() * size * 0.9;
        arcs.moveTo(x, y);
        for (let j = 0; j < 5; j++) {
          x += (Math.random() - 0.5) * 40;
          y += (Math.random() - 0.5) * 40;
          arcs.lineTo(x, y);
        }
      }
      arcs.stroke({ width: 4, color: 0xffe14a }).stroke({ width: 1.5, color: 0xffffff });
      this.cat.x += n % 2 ? 3 : -3;
      if (n >= 9) {
        window.clearInterval(iv);
        s.filters = prev;
        arcs.destroy();
      }
    }, 55);
  }

  private freeze() {
    const size = this.cat.size;
    const g = this.ice;
    g.clear();
    const w = size * 0.95;
    const h = size * 0.95;
    g.roundRect(-w / 2, -h, w, h, 14).fill({ color: 0xc6f0e4, alpha: 0.5 }).stroke({ width: 5, color: 0xffffff, alpha: 0.9 });
    g.roundRect(-w / 2, -h, w, h, 14).stroke({ width: 3, color: C.ink });
    g.moveTo(-w * 0.35, -h * 0.85).lineTo(-w * 0.1, -h * 0.85).stroke({ width: 6, color: 0xffffff, alpha: 0.8 });
    g.moveTo(-w * 0.38, -h * 0.75).lineTo(-w * 0.3, -h * 0.75).stroke({ width: 6, color: 0xffffff, alpha: 0.8 });
    g.visible = true;
    gsap.fromTo(g.scale, { x: 1.3, y: 0.2 }, { x: 1, y: 1, duration: 0.25, ease: 'back.out(3)' });
    sfx('freeze');
  }
  private thaw() {
    gsap.to(this.ice, { alpha: 0, duration: 0.3, onComplete: () => ((this.ice.visible = false), (this.ice.alpha = 1)) });
  }

  private tick(t: Ticker) {
    const dt = t.deltaMS / 1000;
    this.acc += dt;
    const size = this.cat.size;
    if (this.stunOn) {
      this.stunA += dt * 5;
      this.stun.children.forEach((s, i) => {
        const a = this.stunA + (i * Math.PI * 2) / 3;
        s.position.set(Math.cos(a) * size * 0.3, -size * 0.98 + Math.sin(a) * size * 0.08);
      });
    }
    if (this.fx.burning > 0 && this.acc > 0.05) {
      this.acc = 0;
      const p = new Sprite(dotTexture());
      p.anchor.set(0.5);
      p.tint = [C.orange, C.yellow, C.red][Math.floor(Math.random() * 3)];
      p.blendMode = 'add';
      p.scale.set(0.5 + Math.random() * 0.6);
      p.position.set((Math.random() - 0.5) * size * 0.7, -Math.random() * size * 0.5);
      this.flames.addChild(p);
      gsap.to(p, { y: p.y - size * 0.6, alpha: 0, duration: 0.6 + Math.random() * 0.3, ease: 'power1.in', onComplete: () => p.destroy() });
      gsap.to(p.scale, { x: 0.1, y: 0.1, duration: 0.8 });
      this.flick++;
      this.cat.sprite.tint = this.flick % 4 < 2 ? 0xffb27a : this.baseTint;
    } else if (this.fx.shocked > 0 && this.acc > 0.25) {
      this.acc = 0;
      const sp = new Sprite(sparkTexture());
      sp.anchor.set(0.5);
      sp.tint = 0xffe14a;
      sp.scale.set(0.5);
      sp.position.set((Math.random() - 0.5) * size * 0.7, -Math.random() * size * 0.8);
      this.flames.addChild(sp);
      gsap.to(sp, { alpha: 0, rotation: 2, duration: 0.25, onComplete: () => sp.destroy() });
    } else if (this.fx.wet > 0 && this.acc > 0.35) {
      this.acc = 0;
      const d = new Sprite(dotTexture());
      d.anchor.set(0.5);
      d.tint = 0x7fd8ff;
      d.scale.set(0.3, 0.45);
      d.position.set((Math.random() - 0.5) * size * 0.6, -size * 0.3);
      this.flames.addChild(d);
      gsap.to(d, { y: d.y + size * 0.4, alpha: 0, duration: 0.6, ease: 'power2.in', onComplete: () => d.destroy() });
    } else if (this.acc > 0.4) this.acc = 0;
    if (!(this.fx.burning > 0) && this.flick) {
      this.flick = 0;
      this.applyTint();
    }
  }

  override destroy() {
    Ticker.shared.remove(this.tick, this);
    super.destroy({ children: true });
  }
}

/**
 * K.O. sequence: impact frame → "K.O." stamp + dizzy stars → soul leaves → tumble into the sea
 * → life ring bobbing with "FUERA DE COMBATE".
 */
export function playKO(cat: BattleCat, overlay: Container, world: Container, waterY: number, side: number, onSplash: (x: number) => void) {
  const gp = overlay.toLocal(cat.getGlobalPosition());
  const size = cat.size;
  cat.impactFrame(160, true);
  sfx('crit');
  sfx('meow', 0.55);
  // stamp
  const stamp = new Container();
  const ring = new Graphics().circle(0, 0, 78).stroke({ width: 10, color: C.red });
  const ko = poster('K.O.', 80, C.red, { stroke: { color: C.paper, width: 8 } });
  ko.anchor.set(0.5);
  stamp.addChild(ring, ko);
  stamp.position.set(gp.x, gp.y - size * 0.55);
  stamp.rotation = -0.25;
  overlay.addChild(stamp);
  gsap.fromTo(stamp.scale, { x: 2.6, y: 2.6 }, { x: 1, y: 1, duration: 0.16, ease: 'back.out(3)' });
  gsap.to(stamp, { alpha: 0, delay: 1.3, duration: 0.3, onComplete: () => stamp.destroy({ children: true }) });
  // dizzy stars orbit
  const stars = new Container();
  for (let i = 0; i < 3; i++) {
    const s = new Graphics().star(0, 0, 5, 14, 6).fill(C.yellow).stroke({ width: 3, color: C.ink });
    stars.addChild(s);
  }
  stars.position.set(0, -size * 0.95);
  cat.addChild(stars);
  const orbit = { a: 0 };
  gsap.to(orbit, {
    a: Math.PI * 6,
    duration: 1.4,
    ease: 'none',
    onUpdate: () => {
      stars.children.forEach((s, i) => {
        const a = orbit.a + (i * Math.PI * 2) / 3;
        s.position.set(Math.cos(a) * size * 0.35, Math.sin(a) * size * 0.1);
        s.zIndex = Math.sin(a);
      });
    },
  });
  // desaturate + tilt
  const cm = new ColorMatrixFilter();
  cm.desaturate();
  cat.sprite.filters = [...(cat.sprite.filters ?? []), cm];
  gsap.to(cat, { rotation: side === 0 ? -0.35 : 0.35, duration: 0.3, ease: 'power2.out' });
  // soul
  const soul = new Sprite(cat.sprite.texture);
  soul.anchor.set(0.5, 0.94);
  soul.scale.set(Math.abs(cat.sprite.scale.x) * 0.7, cat.sprite.scale.y * 0.7);
  if (cat.flip) soul.scale.x *= -1;
  soul.filters = [new SilhouetteFilter(0xffffff, 1)];
  soul.alpha = 0;
  soul.position.set(gp.x, gp.y - size * 0.2);
  overlay.addChild(soul);
  gsap.to(soul, { alpha: 0.65, duration: 0.2, delay: 0.5 });
  gsap.to(soul, { y: soul.y - 260, duration: 1.8, delay: 0.5, ease: 'sine.out' });
  gsap.to(soul, { x: soul.x + 30, duration: 0.45, delay: 0.5, yoyo: true, repeat: 3, ease: 'sine.inOut' });
  gsap.to(soul, { alpha: 0, duration: 0.5, delay: 1.8, onComplete: () => soul.destroy() });
  window.setTimeout(() => {
    const t = txt('*sale el alma*', { fontFamily: F.comic, fontSize: 24, fill: C.paper, stroke: { color: C.ink, width: 5 } });
    t.anchor.set(0.5);
    t.position.set(gp.x, gp.y - size * 1.4);
    overlay.addChild(t);
    gsap.to(t, { alpha: 0, y: t.y - 40, delay: 1, duration: 0.4, onComplete: () => t.destroy() });
  }, 600);
  // tumble into the sea
  const wp = world.toLocal(cat.getGlobalPosition());
  window.setTimeout(() => {
    if (cat.destroyed) return;
    stars.destroy({ children: true });
    world.addChild(cat);
    cat.position.copyFrom(wp);
    const dir = side === 0 ? -1 : 1;
    sfx('whoosh');
    gsap.to(cat, { x: wp.x + dir * 90, duration: 0.9, ease: 'power1.out' });
    gsap.timeline()
      .to(cat, { y: wp.y - 70, duration: 0.25, ease: 'power2.out' })
      .to(cat, {
        y: waterY + 30,
        duration: 0.6,
        ease: 'power2.in',
        onComplete: () => {
          onSplash(cat.x);
          sfx('splash');
          onomatopoeia(overlay, overlay.toLocal(cat.getGlobalPosition()).x, waterY - 60, '¡GLUGLU!', { color: C.cyan, size: 70 });
          lifeRing(cat, world, waterY);
        },
      });
    gsap.to(cat, { rotation: dir * 3.5, duration: 0.85 });
  }, 1250);
}

function lifeRing(cat: BattleCat, world: Container, waterY: number) {
  cat.visible = false;
  const c = new Container();
  const portrait = new Sprite(cat.sprite.texture);
  portrait.anchor.set(0.5, 0.75);
  portrait.scale.set(0.12);
  const cm = new ColorMatrixFilter();
  cm.desaturate();
  portrait.filters = [cm];
  const ring = new Graphics();
  ring.ellipse(0, 0, 46, 16).stroke({ width: 16, color: 0xffffff });
  for (let i = 0; i < 4; i++) ring.arc(0, 0, 46, (i * Math.PI) / 2, (i * Math.PI) / 2 + 0.5).stroke({ width: 16, color: C.red });
  ring.ellipse(0, 0, 46, 16).stroke({ width: 3, color: C.ink });
  const sign = txt('FUERA DE\nCOMBATE', { fontFamily: F.poster, fontSize: 18, fill: C.ink, align: 'center', lineHeight: 18 });
  sign.anchor.set(0.5);
  const plate = new Graphics().rect(-52, -22, 104, 44).fill(C.paper).stroke({ width: 3, color: C.ink });
  const signC = new Container();
  signC.addChild(plate, sign);
  signC.position.set(0, -84);
  signC.rotation = 0.08;
  c.addChild(portrait, ring, signC);
  c.position.set(cat.x, waterY + 18);
  world.addChild(c);
  gsap.from(c, { y: waterY + 80, alpha: 0, duration: 0.5, ease: 'back.out(2)' });
  gsap.to(c, { y: waterY + 10, duration: 1.1, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  gsap.to(c, { rotation: 0.08, duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
}

/** Overboard but alive: falls in, splash, climbs back with attitude. */
export function playOverboard(cat: BattleCat, overlay: Container, waterY: number, onSplash: (x: number) => void) {
  const y0 = cat.y;
  const gp = overlay.toLocal(cat.getGlobalPosition());
  const dropTo = y0 + (waterY - gp.y) + 30;
  sfx('whoosh');
  gsap.timeline()
    .to(cat, { y: y0 - 40, duration: 0.18 })
    .to(cat, {
      y: dropTo,
      duration: 0.45,
      ease: 'power2.in',
      onComplete: () => {
        onSplash(overlay.toLocal(cat.getGlobalPosition()).x);
        sfx('splash');
        const p = overlay.toLocal(cat.getGlobalPosition());
        onomatopoeia(overlay, p.x, waterY - 60, '¡AL AGUA!', { color: C.cyan, size: 66 });
      },
    })
    .to(cat, { y: y0, duration: 0.5, delay: 0.7, ease: 'back.out(2)', onStart: () => sfx('meow', 1.3) });
}
