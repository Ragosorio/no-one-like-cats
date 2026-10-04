/**
 * The secret landmark of a cleared expansion (GDD 2.16): discreet glints as a hint, a reaction to every
 * tap, and the discovery (T3) through the scene's reveal callback. Kinds come from state/sys/secrets.
 */
import { Container, Graphics, Texture } from 'pixi.js';
import gsap from 'gsap';
import { G } from '../../state/game';
import { secretInfo, clickSecret, clickProgress, fireCatFor, bestFireCat, trySecret, SecretReward } from '../../state/sys/secrets';
import { isoToScreen } from '../iso';
import { shrineArt, fossilWallArt, forgeArt, bottleArt, iceBlockArt, laterSecretArt, glintArt, SecretArt } from '../landmarks';
import { TagBubble } from '../worldUi';
import type { Spot } from '../layout';
import type { IslandCtx } from './ctx';
import { C, F } from '../../ui/theme';
import { sfx } from '../../core/audio';
import { floatText, onomatopoeia, sparkles } from '../../fx/juice';
import { IslandCat, catTexture } from '../../art/catArt';
import { slugOf, applyCatTint } from '../../art/tint';

export interface SecretCallbacks {
  /** T3 discovery (the scene shows the card + rewards) */
  reveal: (n: number, reward: SecretReward, at: { x: number; y: number }) => void;
  /** battle secrets: confirm + start the duel */
  battle: (n: number, battleId: string) => void;
  /** shake the world a bit */
  shake: (k: number) => void;
}

export class SecretView {
  root = new Container();
  private art: SecretArt | null = null;
  private sig = '';
  active = false;
  private glintT = 2 + Math.random() * 3;
  private hint: TagBubble | null = null;
  private busy = false;
  private smokeT = 0;
  readonly base: { x: number; y: number };
  constructor(
    public n: number,
    public spot: Spot,
    private ctx: IslandCtx,
    private cb: SecretCallbacks,
  ) {
    const p = isoToScreen(spot.gx, spot.gy);
    this.base = p;
    this.root.position.set(p.x, p.y);
    this.root.zIndex = spot.gx + spot.gy + (spot.w + spot.h) / 2 - 1;
    this.root.eventMode = 'static';
    this.root.cursor = 'pointer';
    this.root.on('pointertap', () => {
      if (ctx.tapOk()) this.tap();
    });
    ctx.objects.addChild(this.root);
  }

  /** world point above the landmark (for bubbles / camera) */
  get top() {
    const t = this.art?.top ?? { x: 0, y: -120 };
    return { x: this.root.x + t.x, y: this.root.y + t.y };
  }

  sync(open: boolean) {
    this.active = open;
    this.root.visible = open;
    if (!open) return;
    const info = secretInfo(this.n);
    const st = info.done ? 'done' : info.sealed ? 'sealed' : 'open';
    const prog = info.kind === 'clicks' ? Math.floor(clickProgress(this.n) * 8) : 0;
    const sig = `${st}|${prog}`;
    if (sig === this.sig) return;
    this.sig = sig;
    this.art?.c.destroy({ children: true });
    this.art = this.build(st, info.done);
    this.root.addChild(this.art.c);
    this.updateHint(info.done, info.sealed);
  }

  private build(st: 'sealed' | 'open' | 'done', done: boolean): SecretArt {
    switch (this.n) {
      case 1:
        return shrineArt(st === 'sealed' ? 'sealed' : done ? 'done' : 'open');
      case 2:
        return fossilWallArt(clickProgress(2), done);
      case 3:
        return forgeArt(done);
      case 4:
        return bottleArt(done);
      case 5:
        return iceBlockArt(!done);
      default:
        return laterSecretArt(this.n, done);
    }
  }

  private updateHint(done: boolean, sealed: boolean) {
    this.hint?.destroy({ children: true });
    this.hint = null;
    if (done) return;
    // battle secret that's open (Reino reached) gets an explicit, tiny invitation; others stay discreet
    if (this.n === 1 && !sealed) {
      this.hint = new TagBubble('¿?', { color: C.mint, size: 22 });
      this.ctx.bubbles.addChild(this.hint);
      const t = this.top;
      this.hint.position.set(t.x, t.y);
    }
  }

  update(dt: number) {
    if (!this.active || !this.art) return;
    this.hint?.tick(dt);
    const info = secretInfo(this.n);
    // forge smoke once lit
    if (this.n === 3 && info.done) {
      this.smokeT -= dt;
      if (this.smokeT <= 0) {
        this.smokeT = 0.5 + Math.random() * 0.4;
        this.puff();
      }
    }
    if (info.done) return;
    // discreet glints (the hint): a white sparkle pops somewhere on the landmark every few seconds
    this.glintT -= dt;
    if (this.glintT <= 0) {
      this.glintT = (info.sealed ? 6 : 3) + Math.random() * 3;
      const g = glintArt();
      const t = this.art.top;
      g.position.set(this.root.x + t.x * 0.4 + (Math.random() - 0.5) * 70, this.root.y + t.y * 0.45 + 40 + (Math.random() - 0.5) * 40);
      g.scale.set(0);
      this.ctx.wfx.addChild(g);
      this.ctx.bag
        .tl({ onComplete: () => g.destroy({ children: true }) })
        .to(g.scale, { x: 1, y: 1, duration: 0.18, ease: 'back.out(3)' })
        .to(g, { rotation: 0.8, duration: 0.5 }, 0)
        .to(g.scale, { x: 0, y: 0, duration: 0.25 }, 0.35);
    }
  }

  private puff() {
    const t = this.art!.top;
    const g = new Graphics().circle(0, 0, 10).fill({ color: 0x8a8090, alpha: 0.7 }).stroke({ width: 2, color: C.ink, alpha: 0.4 });
    g.position.set(this.root.x + t.x, this.root.y + t.y + 26);
    this.ctx.wfx.addChild(g);
    this.ctx.bag.to(g, { y: g.y - 70, x: g.x + 20 + Math.random() * 20, alpha: 0, duration: 1.6, ease: 'sine.out', onComplete: () => g.destroy() });
    this.ctx.bag.to(g.scale, { x: 2.2, y: 2.2, duration: 1.6 });
  }

  private wobble() {
    const h = this.art?.hit;
    if (!h) return;
    this.ctx.bag.fromTo(h, { x: -6 }, { x: 0, duration: 0.35, ease: 'elastic.out(1.2,0.3)' });
  }

  tap() {
    if (this.busy || !this.active) return;
    const info = secretInfo(this.n);
    const t = this.top;
    if (info.done) {
      sfx('pop', 1.2);
      floatText(this.ctx.wfx, t.x, t.y, DONE_LINE[this.n] ?? 'Ya no queda nada que encontrar aquí… ¿o sí?', { size: 26, color: C.paper, font: F.ui, rise: 50, dur: 1.8 });
      return;
    }
    if (info.sealed) {
      sfx('error');
      this.wobble();
      floatText(this.ctx.wfx, t.x, t.y, `SELLADO · ${info.sealedReason?.toUpperCase() ?? ''}`, { size: 30, color: C.mint, rise: 50, dur: 1.6 });
      return;
    }
    switch (info.kind) {
      case 'clicks':
        return this.knock();
      case 'needs_fire_cat':
        return this.fire();
      case 'open':
        return this.open();
      case 'battle':
        sfx('sting');
        this.wobble();
        this.cb.battle(this.n, info.battle!);
        return;
    }
  }

  /** fossil: 10 knocks, cracks + flying pebbles, then it pops out */
  private knock() {
    const r = clickSecret(this.n);
    const t = this.top;
    const at = { x: this.root.x - 50, y: this.root.y + 20 };
    sfx('hit', 0.8 + r.progress * 0.6);
    this.cb.shake(0.08 + r.progress * 0.1);
    this.wobble();
    onomatopoeia(this.ctx.wfx, at.x, at.y - 40, r.done ? '¡CRACK!' : ['¡TOC!', '¡PUM!', '¡TAC!'][Math.floor(Math.random() * 3)], { size: r.done ? 90 : 52, color: C.paper });
    for (let i = 0; i < 5; i++) {
      const g = new Graphics().poly([-5, 0, 0, -6, 6, -2, 4, 5, -3, 4]).fill(0xa59d8c).stroke({ width: 2, color: C.ink });
      g.position.set(at.x, at.y - 30);
      this.ctx.wfx.addChild(g);
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const d = 40 + Math.random() * 60;
      const o = { k: 0 };
      this.ctx.bag.to(o, {
        k: 1,
        duration: 0.5,
        onUpdate: () => {
          g.x = at.x + Math.cos(a) * d * o.k;
          g.y = at.y - 30 + Math.sin(a) * d * o.k + 140 * o.k * o.k;
          g.alpha = 1 - o.k * 0.7;
        },
        onComplete: () => g.destroy(),
      });
    }
    if (!r.done) {
      const need = secretInfo(this.n).clicksNeeded ?? 10;
      floatText(this.ctx.wfx, t.x, t.y + 30, `${Math.round(r.progress * need)}/${need}`, { size: 34, color: C.yellow, rise: 40, dur: 0.8 });
      this.sync(true);
      return;
    }
    this.sync(true);
    if (r.reward) this.cb.reveal(this.n, r.reward, at);
  }

  /** forge / ice: your best fire cat walks in and breathes fire */
  private fire() {
    const info = secretInfo(this.n);
    const cat = fireCatFor(this.n);
    const t = this.top;
    if (!cat) {
      sfx('error');
      this.wobble();
      const best = bestFireCat();
      const msg = best ? `${best.name} es Nv ${best.level}: necesita Nv ${info.minLevel}+` : 'Necesitas un gato de Fuego';
      floatText(this.ctx.wfx, t.x, t.y, msg, { size: 28, color: C.orange, font: F.ui, rise: 50, dur: 2 });
      return;
    }
    this.busy = true;
    const slug = slugOf(cat.species);
    const ok = catTexture(slug) !== Texture.WHITE;
    const actor = new IslandCat(ok ? slug : 'canelo_cozy_cat', 96);
    if (ok) applyCatTint(actor.sprite, cat.species);
    const target = this.n === 3 ? { x: this.root.x - 60, y: this.root.y + 70 } : { x: this.root.x - 80, y: this.root.y + 60 };
    actor.position.set(target.x - 160, target.y + 60);
    actor.zIndex = this.root.zIndex + 2;
    this.ctx.objects.addChild(actor);
    const name = floatText(this.ctx.wfx, target.x, target.y - 140, `${cat.name}, ¡TE TOCA!`, { size: 30, color: C.yellow, rise: 30, dur: 1.2 });
    void name;
    sfx('meow', 1.1);
    this.ctx.bag
      .tl({
        onComplete: () => {
          actor.destroy();
          this.busy = false;
        },
      })
      .to(actor, { x: target.x, y: target.y, duration: 0.7, ease: 'power2.out' })
      .call(() => {
        sfx('charge', 1.4);
        onomatopoeia(this.ctx.wfx, target.x + 40, target.y - 120, '¡HAIRBALL IGNITION!', { size: 54, color: C.orange, dur: 1.2 });
      })
      .to({}, { duration: 0.35 })
      .call(() => this.breathe(target))
      .to({}, { duration: 0.9 })
      .call(() => {
        const reward = trySecret(this.n);
        this.sync(true);
        sfx(this.n === 5 ? 'splash' : 'bigboom');
        this.cb.shake(0.35);
        sparkles(this.ctx.wfx, t.x, t.y + 60, this.n === 5 ? 0x7fd8ff : C.orange, 20, 180);
        if (reward) this.cb.reveal(this.n, reward, { x: t.x, y: t.y + 60 });
      })
      .to(actor, { x: target.x - 200, alpha: 0, duration: 0.6, delay: 0.4, ease: 'power2.in' });
    void G;
  }

  private breathe(from: { x: number; y: number }) {
    const to = { x: this.root.x + (this.art?.top.x ?? 0), y: this.root.y + 10 };
    for (let i = 0; i < 18; i++) {
      const g = new Graphics().circle(0, 0, 8 + Math.random() * 8).fill(i % 3 === 0 ? C.yellow : C.orange).stroke({ width: 2, color: C.ink });
      g.position.set(from.x + 30, from.y - 50);
      g.scale.set(0.4);
      this.ctx.wfx.addChild(g);
      this.ctx.bag
        .tl({ delay: i * 0.035, onComplete: () => g.destroy() })
        .to(g, { x: to.x + (Math.random() - 0.5) * 50, y: to.y - 30 + (Math.random() - 0.5) * 40, duration: 0.35, ease: 'power1.in' })
        .to(g.scale, { x: 1.4, y: 1.4, duration: 0.35 }, 0)
        .to(g, { alpha: 0, duration: 0.25 });
    }
    sfx('whoosh', 0.7);
    sfx('boom', 1.4);
  }

  /** bottle: the cork pops and the letter flies out */
  private open() {
    const t = this.top;
    sfx('pop', 0.8);
    this.busy = true;
    const cork = new Graphics().rect(-5, -4, 10, 8).fill(0xb98348).stroke({ width: 2, color: C.ink });
    cork.position.set(t.x, t.y + 30);
    this.ctx.wfx.addChild(cork);
    onomatopoeia(this.ctx.wfx, t.x, t.y, '¡PLOP!', { size: 60, color: C.paper });
    this.ctx.bag.to(cork, { y: cork.y - 120, x: cork.x + 40, rotation: 6, duration: 0.5, ease: 'power2.out', onComplete: () => cork.destroy() });
    this.ctx.bag.add(
      gsap.delayedCall(0.45, () => {
        this.busy = false;
        const reward = trySecret(this.n);
        this.sync(true);
        if (reward) this.cb.reveal(this.n, reward, { x: t.x, y: t.y + 40 });
      }),
    );
  }

  destroy() {
    this.hint?.destroy({ children: true });
    this.root.destroy({ children: true });
  }
}

const DONE_LINE: Record<number, string> = {
  1: 'El Guardián Musgoso te saluda con una hoja. Respeto.',
  2: 'Un hueco con forma de gato. Muy artístico.',
  3: 'La forja ronronea. Calientita.',
  4: 'Una botella vacía. Huele a misterio y a sardina.',
  5: 'Charquito. El pirata ya se fue a secar.',
};
