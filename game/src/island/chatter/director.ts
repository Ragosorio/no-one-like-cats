/**
 * Island chatter director: every 6–12 s one visible cat blurts a pop reference / hot take in a comic
 * bubble, beat, then walks it back in a yellow caption box. Sometimes a neighbour shouts a reaction.
 * Self-driven (Ticker) while cats are registered; pauses under modals; never covers the HUD.
 * Tapping a cat makes it the next speaker (and sooner).
 */
import { Container, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { game } from '../../core/App';
import { audio } from '../../core/audio';
import { scenes } from '../../core/scenes';
import { G } from '../../state/game';
import { catDef } from '../../data/content';
import { gtxt } from '../../ui/gender';
import { islandPlan } from '../layout';
import { key } from '../archipelago';
import { dimOf, DimId } from '../dimensions/defs';
import { ChatBubble } from './bubble';
import { chatterFor, REACTIONS } from './lines';
import { POP_REACTIONS } from './popRefs';
import type { ChatterLine } from '../../data/chatter';

/** what the director needs from a CatActor */
export interface Talker extends Container {
  catUid: string;
  species: string;
  mood: string;
  gx: number;
  gy: number;
  fx: Container;
  /** head height in local px (positive) */
  headH: number;
  talk(): void;
  /** optional: turn the head toward a global point for a few seconds */
  gazeAt?(global: { x: number; y: number } | null, secs?: number): void;
}

/** logical-screen rects the bubbles must avoid (HUD) */
const SAFE = { x0: 20, y0: 150, x1: 1900, y1: 918 };
const AVOID = [
  { x0: 0, y0: 0, x1: 410, y1: 580 }, // kingdom badge + pinned missions
  { x0: 1450, y0: 0, x1: 1920, y1: 170 }, // currencies + ronroneo
];

interface Live {
  cat: Talker;
  b: ChatBubble;
}

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}
function clean(s: string) {
  // never show emojis in a bubble
  return s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').trim();
}

class ChatterDirector {
  private cats = new Set<Talker>();
  private running = false;
  private next = 3.5 + Math.random() * 2;
  private line: ChatterLine | null = null;
  private speaker: Live | null = null;
  private reactor: Live | null = null;
  private phase: 'idle' | 'a' | 'holdA' | 'gap' | 'b' | 'holdB' = 'idle';
  private t = 0;
  private hold = 0;
  private poked: Talker | null = null;
  private babble = 0;
  /** dev/testing: force interval */
  interval: [number, number] = [6, 12];

  register(c: Talker) {
    this.cats.add(c);
    if (!this.running) {
      this.running = true;
      Ticker.shared.add(this.tick, this);
    }
  }
  unregister(c: Talker) {
    if (this.speaker?.cat === c || this.reactor?.cat === c) this.end(true);
    this.cats.delete(c);
    if (this.poked === c) this.poked = null;
    if (!this.cats.size && this.running) {
      this.running = false;
      Ticker.shared.remove(this.tick, this);
      this.end(true);
    }
  }
  /** the player tapped this cat: it talks next, soon */
  poke(c: Talker) {
    if (this.speaker?.cat === c && this.speaker.b && !this.speaker.b.done) {
      this.speaker.b.skip();
      return;
    }
    this.poked = c;
    if (this.phase === 'idle') this.next = Math.min(this.next, 0.8);
  }
  /** testing helper: speak now */
  now() {
    if (this.phase !== 'idle') this.end(true);
    this.next = 0;
  }

  private tick(tk: Ticker) {
    const dt = Math.min(0.1, tk.deltaMS / 1000);
    const paused = scenes.overlayLayer.children.length > 0;
    for (const l of [this.speaker, this.reactor]) if (l && !l.b.destroyed) l.b.visible = !paused;
    if (paused) return;
    if (this.phase === 'idle') {
      this.next -= dt;
      if (this.next <= 0) this.start();
      return;
    }
    this.t += dt;
    this.follow(this.speaker);
    this.follow(this.reactor);
    const sp = this.speaker;
    if (!sp || sp.cat.destroyed) {
      this.end(true);
      return;
    }
    if (this.phase === 'a' || this.phase === 'b') {
      const n = sp.b.tick(dt);
      this.babble += n;
      if (this.babble >= 3) {
        this.babble = 0;
        this.blip(sp.cat);
      }
      if (sp.b.done) {
        this.phase = this.phase === 'a' ? 'holdA' : 'holdB';
        this.t = 0;
      }
    } else if (this.phase === 'holdA') {
      if (this.t >= this.hold) {
        if (this.line?.b) {
          this.phase = 'gap';
          this.t = 0;
          this.maybeReact();
        } else this.end();
      }
    } else if (this.phase === 'gap') {
      if (this.t >= (this.reactor ? 1.15 : 0.55)) this.showB();
    } else if (this.phase === 'holdB') {
      if (this.t >= this.hold) this.end();
    }
    if (this.reactor && this.t > 1.6 && this.phase !== 'gap') this.drop(this.reactor, () => (this.reactor = null));
  }

  // ------------------------------------------------------------------ flow
  private start() {
    const cand = this.visibleCats();
    let cat: Talker | null = null;
    if (this.poked && cand.includes(this.poked)) cat = this.poked;
    this.poked = null;
    if (!cat && cand.length) cat = cand[Math.floor(Math.random() * cand.length)];
    if (!cat) {
      this.next = 2 + Math.random() * 2;
      return;
    }
    const def = catDef(cat.species);
    const line = chatterFor(def.elements, this.dimAt(cat), def.art.slug);
    this.line = line;
    const text = (cat.mood === 'sleep' ? 'Zzz… ' : '') + this.render(line.a, cat);
    const b = this.spawn(cat, text, 'say');
    if (!b) {
      this.next = 1.5;
      return;
    }
    this.speaker = { cat, b };
    this.phase = 'a';
    this.t = 0;
    this.hold = Math.min(4.2, 1.5 + text.length * 0.03);
    cat.talk();
    // the neighbours turn their heads to listen (it's a conversation, not a sticker)
    const head = cat.toGlobal({ x: 0, y: -cat.headH * 0.8 });
    for (const o of cand) if (o !== cat && Math.hypot(o.x - cat.x, o.y - cat.y) < 900) o.gazeAt?.(head, this.hold + 2.5);
    this.sfxPop(cat, 1);
  }

  private showB() {
    const sp = this.speaker!;
    const text = this.render(this.line!.b!, sp.cat);
    const old = sp.b;
    const nb = this.spawn(sp.cat, text, 'retract');
    this.drop({ cat: sp.cat, b: old });
    if (!nb) {
      this.end();
      return;
    }
    sp.b = nb;
    this.phase = 'b';
    this.t = 0;
    this.hold = Math.min(3.6, 1.3 + text.length * 0.028);
    this.sfxRetract();
  }

  private maybeReact() {
    const pop = this.line?.tag === 'pop';
    if ((this.line?.tag !== 'polemica' && !pop) || Math.random() > (pop ? 0.35 : 0.5)) return;
    const sp = this.speaker!;
    const others = this.visibleCats().filter((c) => c !== sp.cat && Math.hypot(c.x - sp.cat.x, c.y - sp.cat.y) < 900);
    if (!others.length) return;
    const cat = others[Math.floor(Math.random() * others.length)];
    const pool = pop ? POP_REACTIONS : REACTIONS;
    const b = this.spawn(cat, pool[Math.floor(Math.random() * pool.length)], 'shout');
    if (!b) return;
    this.reactor = { cat, b };
    cat.talk();
    if (audio.ctx) audio.voice({ wave: 'square', freq: 760, to: 520, dur: 0.08, vol: 0.035, lp: 2600 });
  }

  private end(instant = false) {
    for (const l of [this.speaker, this.reactor]) if (l) this.drop(l, undefined, instant);
    this.speaker = this.reactor = null;
    this.line = null;
    this.phase = 'idle';
    this.t = 0;
    const [a, b] = this.interval;
    this.next = this.poked ? 0.8 : a + Math.random() * (b - a);
  }

  // ------------------------------------------------------------------ bubbles
  private render(s: string, cat: Talker) {
    const oc = G.s.cats.find((c) => c.uid === cat.catUid);
    const name = oc?.name || catDef(cat.species).name;
    return clean(gtxt(s).replace(/\{cat\}/g, name));
  }

  private layer(cat: Talker) {
    return (cat.fx.parent as Container | null) ?? cat.fx;
  }

  private spawn(cat: Talker, text: string, kind: 'say' | 'retract' | 'shout'): ChatBubble | null {
    const b = new ChatBubble(text, kind);
    const lay = this.layer(cat);
    lay.addChild(b);
    if (!this.place({ cat, b })) {
      b.destroy({ children: true });
      return null;
    }
    const s = b.scale.x;
    b.scale.set(s * 0.2);
    gsap.to(b.scale, { x: s, y: s, duration: 0.42, ease: 'back.out(2.4)' });
    return b;
  }

  private drop(l: Live, done?: () => void, instant = false) {
    const b = l.b;
    if (!b || b.destroyed) {
      done?.();
      return;
    }
    gsap.killTweensOf(b.scale);
    if (instant) {
      gsap.killTweensOf(b);
      b.destroy({ children: true });
      done?.();
      return;
    }
    gsap.to(b.scale, { x: b.scale.x * 0.2, y: b.scale.y * 0.2, duration: 0.16, ease: 'back.in(2)' });
    gsap.to(b, {
      alpha: 0,
      duration: 0.16,
      onComplete: () => {
        if (!b.destroyed) b.destroy({ children: true });
        done?.();
      },
    });
  }

  /** keep a bubble on its cat's head, scaled to stay legible, dodging the HUD */
  private follow(l: Live | null) {
    if (!l || l.b.destroyed) return;
    if (l.cat.destroyed) {
      l.b.visible = false;
      return;
    }
    const ok = this.place(l, true);
    l.b.alpha = ok ? Math.min(1, l.b.alpha + 0.2) : Math.max(0, l.b.alpha - 0.2);
  }

  private place(l: Live, keepScale = false): boolean {
    const { cat, b } = l;
    const lay = b.parent as Container;
    if (!lay) return false;
    const head = cat.toGlobal({ x: 0, y: -cat.headH });
    const lp = lay.toLocal(head);
    b.position.set(lp.x, lp.y + 6);
    const z = (lay.worldTransform.a || 1) / (game.root.worldTransform.a || 1);
    const sc = Math.max(0.9, Math.min(2.4, 1.08 / z));
    if (!keepScale || Math.abs(Math.abs(b.scale.y) - sc) > 0.02) {
      if (!gsap.isTweening(b.scale)) b.scale.set(sc);
    }
    // logical-screen position of the tail tip
    const hp = game.root.toLocal(head);
    const S = sc * z;
    const tail = b.kind === 'shout' ? 26 : 34;
    const top = hp.y - (tail + b.h) * S;
    if (top < SAFE.y0 || hp.y > SAFE.y1 + 40) return false;
    let shift = 0;
    const left = hp.x - (b.w / 2) * S;
    const right = hp.x + (b.w / 2) * S;
    if (left < SAFE.x0) shift = (SAFE.x0 - left) / S;
    if (right > SAFE.x1) shift = (SAFE.x1 - right) / S;
    b.setShift(shift);
    const x0 = hp.x + (shift - b.w / 2) * S;
    const x1 = hp.x + (shift + b.w / 2) * S;
    for (const a of AVOID) if (x1 > a.x0 && x0 < a.x1 && hp.y > a.y0 && top < a.y1) return false;
    return true;
  }

  private visibleCats(): Talker[] {
    const out: Talker[] = [];
    for (const c of this.cats) {
      if (c.destroyed || !c.visible || !c.parent) continue;
      if (c.mood === 'boxsleep') continue;
      const p = game.root.toLocal(c.toGlobal({ x: 0, y: -c.headH }));
      if (p.x < 200 || p.x > 1720 || p.y < 330 || p.y > 900) continue;
      if (p.x < 430 && p.y < 600) continue;
      out.push(c);
    }
    return out;
  }

  private dimAt(cat: Talker): DimId | null {
    try {
      const plan = islandPlan();
      const t = plan.tiles.get(key(Math.round(cat.gx), Math.round(cat.gy)));
      if (!t) return null;
      const r = plan.regions.find((x) => x.id === t.region);
      return dimOf(r?.biome).id;
    } catch {
      return null;
    }
  }

  // ------------------------------------------------------------------ sound (very quiet)
  private blip(cat: Talker) {
    if (!audio.ctx || audio.muted) return;
    const base = 520 + hashStr(cat.catUid) * 420;
    audio.voice({ wave: 'triangle', freq: base * (0.85 + Math.random() * 0.4), dur: 0.045, vol: 0.022, lp: 2600 });
  }
  private sfxPop(cat: Talker, k: number) {
    if (!audio.ctx || audio.muted) return;
    const base = 520 + hashStr(cat.catUid) * 420;
    audio.voice({ wave: 'sine', freq: base * 0.8 * k, to: base * 1.5 * k, dur: 0.07, vol: 0.05 });
  }
  private sfxRetract() {
    if (!audio.ctx || audio.muted) return;
    audio.voice({ wave: 'triangle', freq: 440, to: 330, dur: 0.16, vol: 0.035 });
    audio.voice({ wave: 'triangle', freq: 330, to: 220, dur: 0.24, vol: 0.035, delay: 0.17 });
  }
}

export const chatter = new ChatterDirector();
(globalThis as unknown as { __chatter: ChatterDirector }).__chatter = chatter;
