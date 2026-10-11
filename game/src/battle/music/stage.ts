/**
 * The presentation verbs battle-music plans use (camera, sky light, sea spray, crew groove, UI pulse, freeze-frame,
 * special set piece, ink tide, enemy telegraph, on-beat flourish). Pure decoration on top of BattleScene: none of it
 * touches the sim, and every verb respects Reducir movimiento / Reducir destellos (gentle, no flashes).
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import gsap from 'gsap';
import type { BattleScene } from '../../scenes/BattleScene';
import { glowTexture } from '../../art/textures';
import { settings } from '../../core/settings';
import { sparkles, time } from '../../fx/juice';
import { C } from '../../ui/theme';
import { W, H } from '../../core/App';

const WATER_Y = 820;
const rm = () => settings.reduceMotion;
const rf = () => settings.reduceFlashes;

export class MusicStage {
  /** horizon light behind the ships */
  private glow = new Container();
  private glowA: Sprite;
  private glowB: Sprite;
  private glowTop: Graphics;
  /** ink over the sea (H34's tide) */
  private tideG = new Graphics();
  /** freeze-frame veil (screen space) */
  private veil = new Graphics();
  private lastSea = 0;
  private lastCam = 0;
  /** counts for the debug trail / headless checks */
  counts: Record<string, number> = {};
  /** verbs applied (headless: perf time + verb) */
  trail: { at: number; verb: string; k: number }[] = [];

  constructor(private s: BattleScene) {
    const tex = glowTexture();
    this.glowA = new Sprite(tex);
    this.glowB = new Sprite(tex);
    for (const g of [this.glowA, this.glowB]) {
      g.anchor.set(0.5);
      g.blendMode = 'add';
      g.scale.set(9, 4.2);
    }
    this.glowA.position.set(W * 0.28, WATER_Y - 120);
    this.glowB.position.set(W * 0.72, WATER_Y - 120);
    this.glowTop = new Graphics().rect(-200, -200, W + 400, WATER_Y + 200).fill({ color: 0xffffff, alpha: 1 });
    this.glowTop.blendMode = 'add';
    this.glowTop.alpha = 0;
    this.glow.addChild(this.glowTop, this.glowA, this.glowB);
    this.glow.alpha = 0;
    this.glow.eventMode = 'none';
    this.tideG.rect(-300, WATER_Y - 30, W + 600, H - WATER_Y + 400).fill(0xffffff);
    this.tideG.alpha = 0;
    this.tideG.eventMode = 'none';
    this.veil.rect(-400, -400, W + 800, H + 800).fill(C.ink);
    this.veil.alpha = 0;
    this.veil.eventMode = 'none';
    const ships = s.ships[0]?.parent;
    const at = ships ? s.world.getChildIndex(ships) : 0;
    s.world.addChildAt(this.glow, at);
    s.world.addChildAt(this.tideG, at + 1);
    s.overlay.addChildAt(this.veil, 0);
  }

  private mark(verb: string, k: number) {
    this.counts[verb] = (this.counts[verb] ?? 0) + 1;
    this.trail.push({ at: Math.round(performance.now()), verb, k: Math.round(k * 100) / 100 });
    if (this.trail.length > 400) this.trail.shift();
  }

  /** camera punch scaled by the hit's strength */
  camera(k: number) {
    const now = performance.now();
    if (now - this.lastCam < 120) return;
    this.lastCam = now;
    this.mark('camera', k);
    const m = rm() ? 0.25 : 1;
    this.s.shaker.add((0.06 + 0.22 * k) * m);
    this.s.cam.z += (0.01 + 0.035 * k) * m;
  }

  /** the sky lights up behind the ships */
  sky(k: number, color = 0xffe7a8) {
    this.mark('sky', k);
    const a = Math.min(1, 0.25 + 0.75 * k) * (rf() ? 0.35 : 1);
    this.glowA.tint = color;
    this.glowB.tint = color;
    this.glowTop.tint = color;
    this.glowTop.alpha = 0.06 + 0.06 * k;
    gsap.killTweensOf(this.glow);
    this.glow.alpha = Math.max(this.glow.alpha, a * 0.55);
    gsap.to(this.glow, { alpha: 0, duration: 0.5 + 0.3 * k, ease: 'power2.out' });
  }

  /** sea spray between / beside the ships */
  sea(k: number, x?: number) {
    const now = performance.now();
    if (now - this.lastSea < 250) return;
    this.lastSea = now;
    this.mark('sea', k);
    const xs = x !== undefined ? [x] : [W * (0.42 + Math.random() * 0.16), Math.random() < 0.5 ? W * 0.1 : W * 0.9];
    for (const px of xs)
      this.s.fxp.burst(px, WATER_Y, {
        count: Math.round((rm() ? 6 : 10) + 18 * k),
        tint: [C.paper, C.megaBlue, 0x7fd8ff],
        angle: [-Math.PI * 0.92, -Math.PI * 0.08],
        speed: [140, 380 + 320 * k],
        gravity: 900,
        life: [0.4, 0.9],
        scale: [0.4, 0.9],
      });
  }

  /** the crews groove on the downbeat (never the cat being aimed) */
  crew(k: number) {
    if (rm()) return;
    this.mark('crew', k);
    const aiming = this.s.dragging ? this.s.selected : '';
    for (const side of [0, 1] as const)
      for (const c of this.s.sim.sides[side].cats) {
        if (c.ko || c.def.uid === aiming) continue;
        const bc = this.s.catViews.get(c.def.uid);
        if (!bc || bc.destroyed) continue;
        bc.sprite.crouch = 0.18 + 0.3 * k;
        window.setTimeout(() => {
          if (!bc.destroyed && !(this.s.dragging && this.s.selected === c.def.uid)) bc.sprite.crouch = 0;
        }, 110);
      }
  }

  /** a soft pulse of the selected crew card (the ships «prepare») */
  ui(k: number) {
    const card = this.s.cards.find((c) => c.selected);
    if (!card || card.destroyed) return;
    this.mark('ui', k);
    if (rm()) {
      gsap.fromTo(card, { alpha: 0.82 }, { alpha: 1, duration: 0.3 });
      return;
    }
    const y = card.y;
    gsap.fromTo(card, { y: y - 3 - 4 * k }, { y, duration: 0.22, ease: 'power2.out', overwrite: 'auto' });
  }

  /** a stop: the frame holds for `sec` (gentle veil only with Reducir movimiento; never while a shot flies) */
  freeze(sec: number) {
    this.mark('freeze', sec);
    const ms = Math.max(80, Math.min(400, sec * 1000));
    gsap.killTweensOf(this.veil);
    this.veil.alpha = rf() || rm() ? 0.08 : 0.16;
    window.setTimeout(() => {
      if (!this.veil.destroyed) gsap.to(this.veil, { alpha: 0, duration: 0.12 });
    }, ms);
    if (!rm() && !this.s.follow && this.s.phase !== 'flight') time.slowmo(0.03, ms);
  }

  /** an intense section arrives: the whole stage answers once */
  special(k: number, color = 0xffd23f) {
    this.mark('special', k);
    this.sky(Math.min(1, k + 0.2), color);
    for (let i = 0; i < 4; i++) {
      const x = W * (0.12 + i * 0.25);
      window.setTimeout(() => !this.s.destroyed && this.s.fxp.burst(x, WATER_Y, { count: rm() ? 8 : 22, tint: [C.paper, C.megaBlue, 0x7fd8ff], angle: [-Math.PI * 0.9, -Math.PI * 0.1], speed: [250, 760], gravity: 900, life: [0.5, 1.1] }), i * 60);
    }
    this.crew(1);
    this.camera(0.55 * k);
  }

  /** ink rises over the sea for a few bars (H34) */
  tide(k: number, color = 0x14213d, holdSec = 7) {
    this.mark('tide', k);
    this.tideG.tint = color;
    gsap.killTweensOf(this.tideG);
    gsap.timeline()
      .to(this.tideG, { alpha: 0.42 * k, duration: rm() ? 2 : 1.2, ease: 'power2.out' })
      .to(this.tideG, { alpha: 0, duration: 2.5, delay: holdSec, ease: 'power1.in' });
  }

  /** the enemy shooter gathers itself on the beat while its release waits for the music */
  telegraph(uid: string | null, x: number, y: number, k: number) {
    this.mark('telegraph', k);
    sparkles(this.s.wfx, x, y, 0xff5c8a, rm() ? 4 : 8, 70 + 40 * k);
    if (rm() || !uid) return;
    const bc = this.s.catViews.get(uid);
    if (!bc || bc.destroyed) return;
    bc.sprite.crouch = 0.35 + 0.35 * k;
    window.setTimeout(() => !bc.destroyed && (bc.sprite.crouch = 0.15), 120);
  }

  /** a player's impact that happened to land on a strong hit */
  flourish(x: number, y: number, k: number) {
    this.mark('flourish', k);
    sparkles(this.s.wfx, x, y - 20, C.yellow, rm() ? 6 : 14, 150 + 60 * k);
    this.camera(0.35 + 0.4 * k);
  }

  dispose() {
    gsap.killTweensOf([this.glow, this.tideG, this.veil]);
    for (const g of [this.glow, this.tideG, this.veil]) if (!g.destroyed) g.destroy({ children: true });
  }
}
