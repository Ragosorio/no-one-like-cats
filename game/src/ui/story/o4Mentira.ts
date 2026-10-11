/**
 * Parte II · Oleada 4 · H64 «Mentira» — the comic INSET the cine h64_mentira opens over your island at night: a big
 * panel in the middle of the screen where the blank page comes down like a leaf, and YOUR Canelo (his active form,
 * his name) walks onto it, turns three times and falls asleep on top of it. Then the word lands on the music's hit.
 *
 *   const p = new MentiraPanel(layer, { reduceMotion })
 *   await p.page()      the page comes down and lands
 *   await p.climb()     Canelo walks in, hops on, three turns, sleeps (Zzz)
 *   p.slam('MENTIRA.')  the word, on the climax
 *   await p.close()
 * Every step can be folded (`instant`) for SALTAR. Pixi only (reads G for Canelo).
 */
import { Container, Graphics, Text, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { C, F } from '../theme';
import { poster, txt } from '../widgets';
import { G } from '../../state/game';
import { livingCat, preloadCats } from '../../art/catArt';
import { ART } from '../../art/livingCat';
import type { CatPuppet } from '../../art/livingCat';
import { catSlug } from '../../state/sys/forms';
import { slugOf } from '../../art/tint';
import { onomatopoeia, sparkles } from '../../fx/juice';

const PW = 1100;
const PH = 560;
/** where the panel sits (above the dialog box) */
const PX = W / 2;
const PY = 380;
const GROUND = PH / 2 - 90;

export class MentiraPanel extends Container {
  private frame = new Container();
  private sheet = new Container();
  private cat: CatPuppet | null = null;
  private catBox = new Container();
  private zzz: Text[] = [];
  private tweens: gsap.core.Tween[] = [];
  private stars = new Graphics();
  private tick = (tk: Ticker) => this.onTick(Math.min(0.1, tk.deltaMS / 1000));
  private t = 0;
  private asleep = false;
  private rm: boolean;

  constructor(layer: Container, o: { reduceMotion?: boolean } = {}) {
    super();
    this.rm = !!o.reduceMotion;
    layer.addChild(this);
    this.position.set(PX, PY);
    // the panel: night inside a comic frame
    const bg = new Graphics().rect(-PW / 2, -PH / 2, PW, PH).fill({ color: 0x121030 });
    const glow = new Graphics();
    for (let i = 5; i >= 1; i--) glow.circle(PW / 2 - 170, -PH / 2 + 120, 50 + i * 34).fill({ color: 0xffe9a8, alpha: 0.05 });
    const ground = new Graphics().rect(-PW / 2, GROUND, PW, PH / 2 - GROUND).fill({ color: 0x1d1a3f });
    ground.moveTo(-PW / 2, GROUND).lineTo(PW / 2, GROUND).stroke({ width: 3, color: 0x3a3570 });
    // YOUR faro, in silhouette, keeping watch on the right
    const faro = new Graphics()
      .poly([PW / 2 - 200, GROUND, PW / 2 - 140, GROUND, PW / 2 - 155, -PH / 2 + 150, PW / 2 - 185, -PH / 2 + 150])
      .fill({ color: 0x0b0a1d })
      .rect(PW / 2 - 192, -PH / 2 + 110, 44, 40)
      .fill({ color: 0xffe08a });
    const border = new Graphics().rect(-PW / 2, -PH / 2, PW, PH).stroke({ width: 10, color: C.ink });
    const mask = new Graphics().rect(-PW / 2, -PH / 2, PW, PH).fill({ color: 0xffffff });
    this.frame.addChild(bg, this.stars, glow, faro, ground, this.sheet, this.catBox);
    this.frame.mask = mask;
    this.addChild(this.frame, mask, border);
    this.drawSheet();
    this.sheet.visible = false;
    Ticker.shared.add(this.tick);
    this.alpha = 0;
    this.track(gsap.to(this, { alpha: 1, duration: 0.6 }));
    if (!this.rm) this.track(gsap.from(this.scale, { x: 0.92, y: 0.92, duration: 0.6, ease: 'back.out(2)' }));
  }

  private track(t: gsap.core.Tween) {
    this.tweens.push(t);
    return t;
  }
  private drawSheet() {
    const g = new Graphics();
    for (let i = 4; i >= 1; i--) g.roundRect(-150 - i * 9, -100 - i * 9, 300 + i * 18, 200 + i * 18, 14).fill({ color: 0xfff6e0, alpha: 0.06 });
    g.roundRect(-150, -100, 300, 200, 6).fill({ color: 0xfbf8f1 }).stroke({ width: 3, color: 0xd9d2c4 });
    this.sheet.addChild(g);
  }

  private onTick(dt: number) {
    this.t += dt;
    const s = this.stars;
    if (s.destroyed) return;
    s.clear();
    for (let i = 0; i < (this.rm ? 18 : 46); i++) {
      const x = -PW / 2 + ((i * 7919) % 1000) / 1000 * PW;
      const y0 = -PH / 2 + ((i * 104729) % 1000) / 1000 * (GROUND + PH / 2);
      // the old habit of these skies: the stars drift UP
      const y = -PH / 2 + ((((y0 + PH / 2) - this.t * (this.rm ? 3 : 9 + (i % 5) * 3)) % (GROUND + PH / 2)) + (GROUND + PH / 2)) % (GROUND + PH / 2);
      s.circle(x, y, 1 + (i % 3) * 0.8).fill({ color: 0xfff6e0, alpha: 0.3 + 0.4 * Math.abs(Math.sin(this.t * 0.8 + i)) });
    }
    // the sleeper's Zzz float up and fade, one after another
    if (this.asleep && !this.rm) {
      for (const z of this.zzz) {
        z.y -= dt * 18;
        z.alpha -= dt * 0.35;
        if (z.alpha <= 0) {
          z.alpha = 1;
          z.y = this.catBox.y - 150;
        }
      }
    }
  }

  /** the blank page comes down like a leaf and lands */
  page(instant = false): Promise<void> {
    this.sheet.visible = true;
    const endY = GROUND - 8;
    this.sheet.scale.set(1, 0.32);
    if (instant || this.rm) {
      this.sheet.position.set(-60, endY);
      this.sheet.rotation = 0;
      return Promise.resolve();
    }
    this.sheet.position.set(-260, -PH / 2 - 120);
    this.sheet.rotation = -0.5;
    return new Promise((res) => {
      const tl = gsap.timeline({ onComplete: () => res() });
      tl.to(this.sheet, { x: 40, y: -PH / 2 + 160, rotation: 0.35, duration: 1.6, ease: 'sine.inOut' })
        .to(this.sheet, { x: -120, y: GROUND - 140, rotation: -0.25, duration: 1.5, ease: 'sine.inOut' })
        .to(this.sheet, { x: -60, y: endY, rotation: 0, duration: 1.2, ease: 'sine.out' });
      this.tweens.push(tl as unknown as gsap.core.Tween);
    });
  }

  /** Canelo walks in from the left, hops onto the page, turns three times and falls asleep on it */
  async climb(instant = false): Promise<void> {
    const canelo = G.s.cats.find((c) => c.species === 'c_canelo');
    const slug = canelo ? catSlug(canelo) : slugOf('c_canelo');
    await preloadCats([slug]).catch(() => undefined);
    if (this.destroyed) return;
    const p = livingCat(slug, { anchorX: 0.5, anchorY: 0.94, fps: 12, acts: 'calm' });
    const k = 230 / ART;
    p.scale.set(k, k);
    this.cat = p;
    this.catBox.addChild(p);
    const sleepX = -60;
    const sleepY = GROUND - 12;
    if (instant || this.rm) {
      this.catBox.position.set(sleepX, sleepY);
      this.fallAsleep(true);
      return;
    }
    this.catBox.position.set(-PW / 2 - 120, GROUND + 6);
    p.walk = 1;
    await this.to(this.catBox, { x: sleepX - 230, duration: 2.4, ease: 'none' });
    p.walk = 0;
    p.emote('surprise', 0.6);
    await this.wait(0.5);
    // the hop onto the page
    await this.to(this.catBox, { x: sleepX, y: sleepY - 70, duration: 0.32, ease: 'power2.out' });
    await this.to(this.catBox, { y: sleepY, duration: 0.22, ease: 'power2.in' });
    // three turns, like every cat before lying down on something important
    for (let i = 0; i < 3; i++) {
      await this.to(this.catBox.scale, { x: -1, duration: 0.2, ease: 'sine.inOut' });
      await this.to(this.catBox.scale, { x: 1, duration: 0.2, ease: 'sine.inOut' });
    }
    this.fallAsleep(false);
  }

  private fallAsleep(instant: boolean) {
    const p = this.cat;
    if (!p) return;
    p.walk = 0;
    p.sleeping = true;
    p.crouch = 0.5;
    p.emote('sleepy', 1);
    this.asleep = true;
    for (let i = 0; i < 3; i++) {
      const z = txt('z', { fontFamily: F.comic, fontSize: 44 - i * 8, fill: 0xe9e4ff }) as Text;
      z.position.set(this.catBox.x + 70 + i * 26, this.catBox.y - 150 - i * 40);
      z.alpha = 1 - i * 0.3;
      this.frame.addChild(z);
      this.zzz.push(z);
    }
    if (!instant && !this.rm) sparkles(this.frame, this.catBox.x, this.catBox.y - 80, 0xfff1c8, 8, 90);
  }

  /** the word, on the hit */
  slam(word: string, o: { flash?: boolean } = {}) {
    if (this.destroyed) return;
    if (this.rm) {
      const t = poster(word, 120, 0xfff6e0);
      t.anchor.set(0.5);
      t.position.set(0, -PH / 2 + 110);
      this.frame.addChild(t);
      this.track(gsap.from(t, { alpha: 0, duration: 0.6 }));
      return;
    }
    onomatopoeia(this.frame, 40, -PH / 2 + 120, word, { size: 150, color: C.yellow, font: F.poster, dur: 4 });
    if (o.flash !== false) {
      const f = new Graphics().rect(-PW / 2, -PH / 2, PW, PH).fill({ color: 0xffffff, alpha: 0.35 });
      this.frame.addChild(f);
      this.track(gsap.to(f, { alpha: 0, duration: 0.5, onComplete: () => f.destroy() }));
    }
    this.track(gsap.fromTo(this.scale, { x: 1.02, y: 1.02 }, { x: 1, y: 1, duration: 0.35, ease: 'power2.out' }));
  }

  close(): Promise<void> {
    return new Promise((res) => {
      if (this.destroyed) return res();
      gsap.to(this, {
        alpha: 0,
        duration: 0.6,
        onComplete: () => {
          this.destroy({ children: true });
          res();
        },
      });
    });
  }

  private to(target: object, vars: gsap.TweenVars): Promise<void> {
    return new Promise((res) => {
      if (this.destroyed) return res();
      this.track(gsap.to(target, { ...vars, onComplete: () => res() }));
    });
  }
  private wait(s: number) {
    return new Promise<void>((r) => window.setTimeout(r, s * 1000));
  }

  override destroy(o?: Parameters<Container['destroy']>[0]) {
    Ticker.shared.remove(this.tick);
    for (const t of this.tweens) t.kill();
    this.tweens = [];
    super.destroy(o ?? { children: true });
  }
}
