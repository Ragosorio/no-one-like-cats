/**
 * Island-only flourishes for the Oleada 1 scenes (src/cine/scenes/*), called by IslandStage.fx:
 *
 *   stand  { who, slug }        a stand-in painting takes a cat's place (the real actor waits hidden): the
 *                               transformation shows the BEFORE even when the cat already wears its form
 *   swap   { slug }             the stand-in becomes another painting, in a burst of ink and gold
 *   page   { do: 'fall'|'wrap', at, text } Canelo's golden page: it flutters down, writes its last line, then
 *                               wraps him in paper strips
 *   silhouette { at, hold }     a cat made of static, sitting on a rock off your island (blink and it's gone)
 *   hideCats {}                 the island without anyone (the actors fade; they come back with the stopper)
 *   pose   {}                   «corrected»: every cat stops and looks the same way at the same time
 *
 * Every flourish returns its stopper (the cine calls it when it ends, however it ends): nothing outlives a scene.
 */
import { Container, Graphics, Text, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { IslandCat, preloadCats } from '../../art/catArt';
import { applyCatTint } from '../../art/tint';
import { onomatopoeia, sparkles } from '../../fx/juice';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import type { CineCtx, FxCmd } from '../../cine/types';
import type { CatActor } from '../catActor';
import type { IslandNight } from './index';

export interface CineFxHost {
  night: IslandNight;
  actors: () => CatActor[];
  wfx: Container;
  pick: (who: string) => CatActor[];
  resolve: (t: string) => { x: number; y: number } | null;
}

type Stopper = () => void;

interface Stand {
  actor: CatActor;
  holder: Container;
  cat: IslandCat;
  slug: string;
  /** where the cat was: it stays there while hidden (no jump when it comes back) */
  gx: number;
  gy: number;
}

export class IslandCineFx {
  private stand: Stand | null = null;
  /** flourishes a later step can switch off (`{ fx: { id, off: true } }`) */
  private live = new Map<string, Stopper>();
  private page: { root: Container; paper: Container; t: number; mode: 'fall' | 'hover' | 'wrap'; from: { x: number; y: number }; to: { x: number; y: number }; strips: Graphics[] } | null = null;
  constructor(private h: CineFxHost) {
    Ticker.shared.add(this.tick, this);
  }
  dispose() {
    Ticker.shared.remove(this.tick, this);
    for (const f of [...this.live.values()]) f();
    this.live.clear();
    this.clearStand();
    this.clearPage();
  }

  fx(cmd: FxCmd, ctx: CineCtx): Stopper | undefined {
    if (cmd.off && ['silhouette', 'hideCats', 'pose'].includes(cmd.id)) {
      this.live.get(cmd.id)?.();
      this.live.delete(cmd.id);
      return () => undefined;
    }
    const stop = this.make(cmd, ctx);
    if (stop && ['silhouette', 'hideCats', 'pose'].includes(cmd.id)) {
      this.live.get(cmd.id)?.();
      let done = false;
      const once = () => {
        if (done) return;
        done = true;
        stop();
        if (this.live.get(cmd.id) === once) this.live.delete(cmd.id);
      };
      this.live.set(cmd.id, once);
      return once;
    }
    return stop;
  }
  private make(cmd: FxCmd, ctx: CineCtx): Stopper | undefined {
    switch (cmd.id) {
      case 'stand':
        return this.doStand(String(cmd.who ?? 'canelo'), String(cmd.slug ?? ''));
      case 'swap':
        return this.doSwap(String(cmd.slug ?? ''), ctx);
      case 'page':
        return this.doPage(cmd, ctx);
      case 'silhouette':
        return this.doSilhouette(String(cmd.at ?? 'rocks'), ctx);
      case 'hideCats':
        return this.doHide(Number(cmd.dur ?? 0.6));
      case 'pose':
        return this.doPose(String(cmd.at ?? 'faro'));
    }
    return undefined;
  }

  // ------------------------------------------------------------------ stand-in (transformations)
  private doStand(who: string, slug: string): Stopper {
    const a = this.h.pick(who)[0];
    if (!a || a.destroyed || !a.parent) return () => undefined;
    this.clearStand();
    const holder = new Container();
    holder.position.copyFrom(a.position);
    holder.scale.set(Math.abs(a.scale.x), a.scale.y);
    holder.zIndex = a.zIndex;
    const s = slug || a.slug;
    const cat = new IslandCat(s, 104);
    applyCatTint(cat.sprite, a.species);
    holder.addChild(cat);
    a.parent.addChild(holder);
    a.alpha = 0;
    this.stand = { actor: a, holder, cat, slug: s, gx: a.gx, gy: a.gy };
    return () => this.clearStand();
  }
  private doSwap(slug: string, ctx: CineCtx): Stopper | undefined {
    const st = this.stand;
    if (!st || st.holder.destroyed) return;
    void preloadCats([slug]).then(() => {
      if (!this.stand || this.stand !== st || st.holder.destroyed) return;
      const next = new IslandCat(slug, 104);
      applyCatTint(next.sprite, st.actor.species);
      st.cat.destroy();
      st.holder.addChild(next);
      st.cat = next;
      st.slug = slug;
      next.hop();
      next.sprite.emote('happy', 1);
      if (!ctx.reduceMotion) gsap.from(next.scale, { x: 1.35, y: 0.7, duration: 0.5, ease: 'elastic.out(1.1,0.45)' });
    });
    const p = st.holder.position;
    sparkles(this.h.wfx, p.x, p.y - 90, 0xffd27a, ctx.reduceMotion ? 10 : 28, 170);
    onomatopoeia(this.h.wfx, p.x, p.y - 210, '¡A BABOR!', { size: 76, color: C.yellow });
    return undefined;
  }
  private clearStand() {
    const st = this.stand;
    this.stand = null;
    if (!st) return;
    if (!st.holder.destroyed) st.holder.destroy({ children: true });
    if (!st.actor.destroyed) gsap.to(st.actor, { alpha: 1, duration: 0.25 });
  }

  // ------------------------------------------------------------------ Canelo's golden page
  private doPage(cmd: FxCmd, ctx: CineCtx): Stopper | undefined {
    const mode = String(cmd.do ?? 'fall');
    const at = this.stand?.holder.position ?? this.h.resolve(String(cmd.at ?? 'canelo'));
    if (!at) return;
    if (mode === 'fall') {
      this.clearPage();
      const root = new Container();
      const paper = new Container();
      const w = 120;
      const hh = 156;
      const g = new Graphics()
        .rect(-w / 2 + 6, -hh / 2 + 6, w, hh)
        .fill({ color: C.ink, alpha: 0.5 })
        .rect(-w / 2, -hh / 2, w, hh)
        .fill(0xffe9b0)
        .stroke({ width: 4, color: 0xb8862b, alignment: 1 });
      for (let i = 0; i < 7; i++) g.rect(-w / 2 + 14, -hh / 2 + 22 + i * 15, w - 28 - (i === 6 ? 40 : 0), 3).fill({ color: 0x6b4a14, alpha: 0.55 });
      const glow = new Graphics().circle(0, 0, 110).fill({ color: 0xffd27a, alpha: 0.18 });
      paper.addChild(glow, g);
      root.addChild(paper);
      // the line that was missing writes itself under the page (a hand, in ink)
      const line = String(cmd.text ?? '');
      if (line) {
        const t = txt(line, { fontFamily: F.brush, fontSize: 30, fill: C.paper, stroke: { color: C.ink, width: 7, join: 'round' }, padding: 12 }) as Text;
        t.anchor.set(0.5, 0);
        t.position.set(0, hh / 2 + 22);
        const mask = new Graphics().rect(-t.width / 2 - 10, hh / 2 + 10, 1, t.height + 30).fill(0xffffff);
        t.mask = mask;
        root.addChild(t, mask);
        gsap.to(mask, { width: t.width + 30, duration: ctx.reduceMotion ? 0.01 : 1.6, delay: ctx.reduceMotion ? 0.4 : 2.6, ease: 'power1.inOut' });
      }
      const to = { x: at.x, y: at.y - 250 };
      const from = { x: at.x + 160, y: at.y - 900 };
      root.position.set(from.x, from.y);
      this.h.wfx.addChild(root);
      this.page = { root, paper, t: 0, mode: ctx.reduceMotion ? 'hover' : 'fall', from, to, strips: [] };
      if (ctx.reduceMotion) root.position.set(to.x, to.y);
      return () => this.clearPage();
    }
    if (mode === 'wrap' && this.page) {
      const pg = this.page;
      pg.mode = 'wrap';
      pg.t = 0;
      // paper strips orbit the cat, tighter and faster until the burst
      for (let i = 0; i < (ctx.reduceMotion ? 5 : 12); i++) {
        const s = new Graphics().rect(-22, -6, 44, 12).fill(i % 3 ? 0xffe9b0 : 0xfff6d8).stroke({ width: 2, color: 0xb8862b });
        pg.root.parent?.addChild(s);
        pg.strips.push(s);
      }
      return undefined;
    }
    if (mode === 'burst' && this.page) {
      const pg = this.page;
      for (const s of pg.strips) gsap.to(s, { alpha: 0, duration: 0.35, onComplete: () => s.destroy() });
      pg.strips = [];
      gsap.to(pg.root, { alpha: 0, duration: 0.4 });
      return undefined;
    }
    return undefined;
  }
  private clearPage() {
    const pg = this.page;
    this.page = null;
    if (!pg) return;
    for (const s of pg.strips) if (!s.destroyed) s.destroy();
    gsap.killTweensOf(pg.root);
    if (!pg.root.destroyed) pg.root.destroy({ children: true });
  }

  private tick(tk: Ticker) {
    const dt = Math.min(0.1, tk.deltaMS / 1000);
    const st = this.stand;
    if (st && !st.actor.destroyed) st.actor.teleport(st.gx, st.gy);
    const pg = this.page;
    if (!pg || pg.root.destroyed) return;
    pg.t += dt;
    if (pg.mode === 'fall') {
      // a leaf, not a stone: sways while it sinks, lands soft
      const k = Math.min(1, pg.t / 3.2);
      const e = 1 - (1 - k) * (1 - k);
      pg.root.position.set(pg.from.x + (pg.to.x - pg.from.x) * e + Math.sin(pg.t * 2.6) * 70 * (1 - k), pg.from.y + (pg.to.y - pg.from.y) * e);
      pg.paper.rotation = Math.sin(pg.t * 2.6 + 0.6) * 0.5 * (1 - k);
      if (k >= 1) pg.mode = 'hover';
    } else if (pg.mode === 'hover') {
      pg.root.y = pg.to.y + Math.sin(pg.t * 1.6) * 8;
      pg.paper.rotation = Math.sin(pg.t * 1.1) * 0.05;
    } else if (pg.mode === 'wrap') {
      const c = this.stand?.holder.position ?? pg.to;
      const spin = 2.2 + pg.t * 2.4;
      const r = Math.max(46, 120 - pg.t * 26);
      pg.strips.forEach((s, i) => {
        if (s.destroyed) return;
        const a = pg.t * spin + (i / pg.strips.length) * Math.PI * 2;
        s.position.set(c.x + Math.cos(a) * r, c.y - 70 + Math.sin(a) * r * 0.42 - (i % 4) * 18);
        s.rotation = a + Math.PI / 2;
        s.zIndex = Math.sin(a) > 0 ? 1 : -1;
      });
      pg.root.position.set(c.x, c.y - 250 - pg.t * 6);
      pg.paper.scale.set(Math.max(0.2, 1 - pg.t * 0.18));
    }
  }

  // ------------------------------------------------------------------ the cat on the rocks (H40)
  private doSilhouette(at: string, ctx: CineCtx): Stopper {
    const p = this.h.resolve(at);
    if (!p) return () => undefined;
    const root = new Container();
    root.position.set(p.x, p.y);
    const rock = new Graphics().ellipse(0, 6, 130, 40).fill(0x2c2738).ellipse(-10, -8, 100, 34).fill(0x3a3448).stroke({ width: 5, color: C.ink, alignment: 1 });
    const cat = new Graphics();
    const r = 72;
    cat.ellipse(0, -r * 0.7, r * 0.78, r * 0.62).fill(0x0b0a0c);
    cat.circle(0, -r * 1.55, r * 0.46).fill(0x0b0a0c);
    cat.poly([-r * 0.42, -r * 1.8, -r * 0.24, -r * 2.25, -r * 0.08, -r * 1.86]).fill(0x0b0a0c);
    cat.poly([r * 0.42, -r * 1.8, r * 0.24, -r * 2.25, r * 0.08, -r * 1.86]).fill(0x0b0a0c);
    cat.moveTo(r * 0.6, -r * 0.3).quadraticCurveTo(r * 1.3, -r * 0.2, r * 1.1, -r * 1.0).stroke({ width: 9, color: 0x0b0a0c, cap: 'round' });
    // two dots that look back at you
    const eyes = new Graphics().circle(-r * 0.17, -r * 1.58, 4).circle(r * 0.17, -r * 1.58, 4).fill(0xe8e8e8);
    const noise = new Graphics();
    root.addChild(rock, cat, eyes, noise);
    this.h.wfx.addChild(root);
    root.alpha = 0;
    gsap.to(root, { alpha: 1, duration: ctx.reduceMotion ? 0.4 : 1.2 });
    let acc = 0;
    const tick = (tk: Ticker) => {
      if (root.destroyed) return;
      acc += tk.deltaMS;
      if (acc < 1000 / 10) return;
      acc = 0;
      noise.clear();
      for (let i = 0; i < 12; i++) {
        const y = -r * 2.3 + Math.random() * r * 2.3;
        noise.rect(-r + Math.random() * r * 0.6, y, r * (0.6 + Math.random() * 1.2), 1 + Math.random() * 3).fill({ color: Math.random() < 0.2 ? C.cyan : C.paper, alpha: 0.1 + Math.random() * 0.25 });
      }
      cat.x = Math.random() < 0.12 && !ctx.reduceFlashes ? (Math.random() - 0.5) * 8 : 0;
    };
    Ticker.shared.add(tick);
    return () => {
      Ticker.shared.remove(tick);
      if (root.destroyed) return;
      // gone in a blink: no fade-out, the static just isn't there anymore
      root.destroy({ children: true });
    };
  }

  // ------------------------------------------------------------------ nobody home (H40) · corrected (H41)
  private doHide(dur: number): Stopper {
    const list = this.h.actors().filter((a) => !a.destroyed);
    for (const a of list) gsap.to(a, { alpha: 0, duration: dur });
    if (this.stand) gsap.to(this.stand.holder, { alpha: 0, duration: dur });
    return () => {
      for (const a of list) if (!a.destroyed) gsap.to(a, { alpha: this.stand?.actor === a ? 0 : 1, duration: 0.3 });
      if (this.stand && !this.stand.holder.destroyed) gsap.to(this.stand.holder, { alpha: 1, duration: 0.3 });
    };
  }
  private doPose(at: string): Stopper {
    const p = this.h.resolve(at);
    const g = p ? this.h.night.toGlobal(p) : null;
    this.h.night.catOverride = (actors) => {
      for (const a of actors) {
        a.uniform = true; // lockstep: no personality while «corrected» holds (catActor.motion)
        a.night = 'gaze';
        a.skyAt = g;
        a.gazeAt(g, 0.5);
      }
    };
    return () => {
      this.h.night.catOverride = null;
      for (const a of this.h.actors()) if (!a.destroyed) a.uniform = false;
    };
  }
}
