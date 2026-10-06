/** A cat living on the island: wanders inside its area "on twos", hops, sleeps (Zzz), sulks when homeless. */
import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { game } from '../core/App';
import gsap from 'gsap';
import { IslandCat } from '../art/catArt';
import { applyCatTint, slugOf } from '../art/tint';
import { catDef } from '../data/content';
import { C, F } from '../ui/theme';
import { txt } from '../ui/widgets';
import { isoToScreen } from './iso';
import { emptyBoxArt } from './buildingArt';
import { chatter } from './chatter/director';
import { G } from '../state/game';
import { glowTexture, sparkTexture } from '../art/textures';
import { mutationOverlay, syncMutationOverlay } from '../panels/collection/art';
import { mutationLook } from '../state/ext/collection';
import { bake, rgba, particleTex } from './dimensions/bake';

/** island-scale mutation particles (the collection decal is too fine at 100px) */
const MUT_PART: Record<string, { tex: Parameters<typeof particleTex>[0]; tints: number[]; vy: number; add: boolean; size: number }> = {
  brasas: { tex: 'ember', tints: [0xff6a1a, 0xffc94a], vy: -38, add: true, size: 0.28 },
  rayos: { tex: 'shard', tints: [0xffd400, 0xffffff], vy: -20, add: true, size: 0.4 },
  escarcha: { tex: 'flake', tints: [0xffffff, 0x9fe8ff], vy: -14, add: false, size: 0.32 },
  musgo: { tex: 'leaf', tints: [0x5fbf4a, 0x8fd46a], vy: 16, add: false, size: 0.36 },
  grietas: { tex: 'drop', tints: [0xa8743f, 0x7a5430], vy: 24, add: false, size: 0.26 },
  runas: { tex: 'shard', tints: [0xff7ab8, 0xffd0ea], vy: -22, add: true, size: 0.34 },
  estrellas: { tex: 'shard', tints: [0x8a5cff, 0xffffff, 0x00e5ff], vy: -16, add: true, size: 0.34 },
  oro: { tex: 'ember', tints: [0xffd77a, 0xfff3b0], vy: -24, add: true, size: 0.26 },
  doble_cola: { tex: 'ember', tints: [0xff2e88], vy: -18, add: true, size: 0.24 },
  eco: { tex: 'ember', tints: [0x00e5ff], vy: -18, add: true, size: 0.24 },
};

/** diagonal rainbow sheen for holo (foil) cats */
function holoTex(): Texture {
  return bake(
    'holo-sheen',
    128,
    256,
    (g, w, h) => {
      const cols = [0xff7ab8, 0xffc94a, 0x7cffc4, 0x7fd8ff, 0xb59cff, 0xff7ab8];
      const grd = g.createLinearGradient(0, 0, w, 0);
      cols.forEach((c, i) => grd.addColorStop(i / (cols.length - 1), rgba(c, 1)));
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
      const fade = g.createLinearGradient(0, 0, w, 0);
      fade.addColorStop(0, 'rgba(0,0,0,1)');
      fade.addColorStop(0.35, 'rgba(0,0,0,0)');
      fade.addColorStop(0.65, 'rgba(0,0,0,0)');
      fade.addColorStop(1, 'rgba(0,0,0,1)');
      g.globalCompositeOperation = 'destination-out';
      g.fillStyle = fade;
      g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(255,255,255,0.9)';
      g.fillRect(w * 0.47, 0, w * 0.06, h);
    },
    false,
  );
}

export interface Area {
  x0: number;
  y0: number;
  w: number;
  h: number;
  /** keep out of this rect (the little house) */
  avoid?: { x0: number; y0: number; x1: number; y1: number };
}
export type Mood = 'roam' | 'sleep' | 'sad' | 'boxsleep';

/** tiny crying cat face drawn in ink (no emojis) */
function sadFace(x: number, y: number) {
  const g = new Graphics();
  g.position.set(x, y);
  g.poly([-13, -6, -11, -17, -4, -10]).fill(0xffc94a).stroke({ width: 2, color: C.ink, join: 'round' });
  g.poly([13, -6, 11, -17, 4, -10]).fill(0xffc94a).stroke({ width: 2, color: C.ink, join: 'round' });
  g.circle(0, 0, 12).fill(0xffc94a).stroke({ width: 2.5, color: C.ink });
  g.moveTo(-7, -2).lineTo(-3, -1).moveTo(7, -2).lineTo(3, -1).stroke({ width: 2, color: C.ink, cap: 'round' });
  g.moveTo(-5, 6).quadraticCurveTo(0, 2, 5, 6).stroke({ width: 2, color: C.ink, cap: 'round' });
  g.moveTo(-6, 1).quadraticCurveTo(-9, 6, -6, 9).quadraticCurveTo(-3, 6, -6, 1).fill(0x7fd8ff).stroke({ width: 1.5, color: C.ink });
  return g;
}

const BASE = 104;

export class CatActor extends Container {
  cat: IslandCat;
  gx = 0;
  gy = 0;
  private tx = 0;
  private ty = 0;
  private wait = Math.random() * 1.5;
  private acc = 0;
  private zzzT = 0;
  private hopT = 3 + Math.random() * 6;
  speed = 0.9;
  mood: Mood = 'roam';
  area: Area;
  private face = 1;
  private levelScale = 1;
  private bubble: Container | null = null;
  private hint: Container | null = null;
  private travelling = false;
  private tweens: gsap.core.Tween[] = [];
  /** mutation decal / holo sheen (synced with the painting every frame) */
  private lookSig = '';
  private lookT = 0;
  private mutWrap: Container | null = null;
  private mutHalo: Sprite | null = null;
  private mutScale = 1;
  private mutFx: { ring: Graphics; parts: { s: Sprite; t: number; vx: number; vy: number }[]; acc: number; kind: string | null } | null = null;
  private holo: { root: Container; sheen: Sprite; mask: Sprite; t: number; sparks: { s: Sprite; t: number }[] } | null = null;
  /** layer for Zzz/bubbles (world fx) */
  constructor(
    public catUid: string,
    public species: string,
    area: Area,
    public fx: Container,
  ) {
    super();
    this.area = area;
    this.cat = new IslandCat(slugOf(species), BASE);
    applyCatTint(this.cat.sprite, species);
    const ts = catDef(species).art.tint?.scale;
    if (ts) this.cat.baseScale *= ts;
    this.addChild(this.cat);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Rectangle(-BASE * 0.42, -BASE * 0.95, BASE * 0.84, BASE);
    const p = this.randomPoint();
    this.gx = this.tx = p.x;
    this.gy = this.ty = p.y;
    this.place();
    // island chatter: register as a possible speaker; tapping makes this cat talk next
    chatter.register(this);
    this.on('pointertap', () => chatter.poke(this));
  }

  /** head height (local px) for speech bubbles (homeless cats: above the island's "¡SIN CASA!" tag) */
  get headH() {
    if (this.mood === 'sad') return 240 / Math.max(0.3, this.levelScale);
    return BASE * (this.mood === 'sleep' || this.mood === 'boxsleep' ? 0.82 : 0.95) * this.mutScale;
  }

  // ------------------------------------------------------------------ mutation + holo look
  private syncLook() {
    const oc = G.s.cats.find((c) => c.uid === this.catUid);
    const mut = oc?.mutation ?? null;
    const holo = !!oc?.holo;
    const sig = `${mut ?? ''}|${holo ? 1 : 0}`;
    if (sig === this.lookSig) return;
    this.lookSig = sig;
    this.mutWrap?.destroy({ children: true });
    this.mutHalo?.destroy();
    this.mutFx?.ring.destroy();
    this.mutFx?.parts.forEach((p) => p.s.destroy());
    this.mutFx = null;
    this.holo?.root.destroy({ children: true });
    this.mutWrap = this.mutHalo = null;
    this.holo = null;
    const sp = this.cat.sprite;
    sp.filters = [];
    applyCatTint(sp, this.species);
    const look = mutationLook(mut);
    this.mutScale = look?.scale ?? 1;
    if (look) {
      const halo = new Sprite(glowTexture());
      halo.anchor.set(0.5);
      halo.tint = look.color;
      halo.alpha = 0.4;
      halo.blendMode = 'add';
      halo.scale.set(BASE / 52, BASE / 60);
      halo.y = -BASE * 0.42;
      this.cat.addChildAt(halo, 1);
      this.mutHalo = halo;
      const ring = new Graphics();
      ring.ellipse(0, 0, BASE * 0.42, BASE * 0.13).fill({ color: look.color, alpha: 0.22 }).stroke({ width: 3, color: look.color, alpha: 0.85 });
      ring.ellipse(0, 0, BASE * 0.3, BASE * 0.09).stroke({ width: 1.5, color: look.color, alpha: 0.6 });
      this.cat.addChildAt(ring, 1);
      this.mutFx = { ring, parts: [], acc: 0, kind: look.decal };
      const wrap = mutationOverlay(sp, this.species, mut);
      if (wrap) {
        this.cat.addChild(wrap);
        this.mutWrap = wrap;
      }
    }
    if (holo) {
      const root = new Container();
      const mask = new Sprite(sp.texture);
      mask.anchor.set(sp.anchor.x, sp.anchor.y);
      const sheen = new Sprite(holoTex());
      sheen.anchor.set(0.5);
      sheen.blendMode = 'add';
      sheen.alpha = 0.7;
      sheen.rotation = 0.45;
      sheen.height = BASE * 1.7;
      sheen.width = BASE * 0.55;
      root.addChild(sheen, mask);
      sheen.mask = mask;
      this.cat.addChild(root);
      this.holo = { root, sheen, mask, t: Math.random() * 3, sparks: [] };
    }
    this.applyScale();
  }

  /** every frame: keep overlays glued to the breathing/hopping painting, animate the foil */
  private tickLook(dt: number) {
    this.lookT -= dt;
    if (this.lookT <= 0) {
      this.lookT = 0.8;
      this.syncLook();
    }
    const sp = this.cat.sprite;
    if (this.mutWrap) syncMutationOverlay(this.mutWrap, sp);
    if (this.mutHalo) {
      this.mutHalo.y = sp.y - BASE * 0.42;
      this.mutHalo.alpha = 0.32 + Math.sin(performance.now() * 0.003) * 0.1;
    }
    const m = this.mutFx;
    if (m) {
      const k = 1 + Math.sin(performance.now() * 0.004) * 0.06;
      m.ring.scale.set(k);
      const spec = m.kind ? MUT_PART[m.kind] : undefined;
      if (spec) {
        m.acc += dt * 2.2;
        while (m.acc >= 1) {
          m.acc -= 1;
          const s = new Sprite(particleTex(spec.tex));
          s.anchor.set(0.5);
          s.tint = spec.tints[Math.floor(Math.random() * spec.tints.length)];
          if (spec.add) s.blendMode = 'add';
          s.scale.set(spec.size * (0.7 + Math.random() * 0.6));
          s.position.set((Math.random() - 0.5) * BASE * 0.6, -BASE * (spec.vy > 0 ? 0.8 : 0.15) - Math.random() * BASE * 0.3);
          this.cat.addChild(s);
          m.parts.push({ s, t: 0, vx: (Math.random() - 0.5) * 12, vy: spec.vy * (0.7 + Math.random() * 0.6) });
        }
      }
      for (let i = m.parts.length - 1; i >= 0; i--) {
        const p = m.parts[i];
        p.t += dt / 1.4;
        if (p.t >= 1) {
          p.s.destroy();
          m.parts.splice(i, 1);
          continue;
        }
        p.s.x += p.vx * dt;
        p.s.y += p.vy * dt;
        p.s.rotation += dt * 2;
        p.s.alpha = Math.min(1, p.t * 5, (1 - p.t) * 3);
      }
    }
    const h = this.holo;
    if (h) {
      h.mask.position.set(sp.x, sp.y);
      h.mask.scale.set(sp.scale.x, sp.scale.y);
      h.t += dt;
      const cyc = h.t % 2.6;
      h.sheen.visible = cyc < 1.1;
      const k = cyc / 1.1;
      h.sheen.position.set(-BASE * 0.7 + k * BASE * 1.4, sp.y - BASE * 0.45);
      // a couple of foil sparkles
      if (Math.random() < dt * 2.6) {
        const s = new Sprite(sparkTexture());
        s.anchor.set(0.5);
        s.tint = [0xff7ab8, 0x7fd8ff, 0xffc94a, 0x7cffc4][Math.floor(Math.random() * 4)];
        s.blendMode = 'add';
        s.position.set((Math.random() - 0.5) * BASE * 0.6, sp.y - BASE * (0.15 + Math.random() * 0.7));
        s.scale.set(0);
        h.root.addChild(s);
        h.sparks.push({ s, t: 0 });
      }
      for (let i = h.sparks.length - 1; i >= 0; i--) {
        const p = h.sparks[i];
        p.t += dt / 0.55;
        if (p.t >= 1) {
          p.s.destroy();
          h.sparks.splice(i, 1);
          continue;
        }
        p.s.scale.set(Math.sin(p.t * Math.PI) * 0.32);
        p.s.rotation = p.t * 2;
      }
    }
  }

  /** tiny "speaking" bounce (squash & stretch on the painting) */
  talk() {
    if (this.destroyed) return;
    this.cat.sprite.emote('happy', 0.55);
    this.tweens.push(gsap.fromTo(this.cat.scale, { x: 1.08, y: 0.92 }, { x: 1, y: 1, duration: 0.45, ease: 'elastic.out(1.2,0.4)' }));
  }

  /** someone is talking over there: look at them for a while (beats following the cursor) */
  gazeAt(global: { x: number; y: number } | null, secs = 3) {
    this.gaze = global ? { x: global.x, y: global.y } : null;
    this.gazeT = global ? secs : 0;
  }
  private gaze: { x: number; y: number } | null = null;
  private gazeT = 0;
  private moving = false;

  /** posture every frame: walk cycle while moving, real sleep, slumped when homeless, eyes on the cursor */
  private act(dt: number) {
    const p = this.cat.sprite;
    if (p.destroyed) return;
    const asleep = this.mood === 'sleep' || this.mood === 'boxsleep';
    p.sleeping = asleep;
    this.cat.sleeping = asleep;
    p.walk = this.moving && !asleep ? Math.min(1, 0.55 + this.speed * 0.5) : 0;
    p.crouch = this.mood === 'sad' ? 0.3 : 0;
    p.acts = asleep ? 'none' : this.mood === 'sad' ? 'calm' : 'all';
    this.gazeT -= dt;
    if (this.gazeT > 0 && this.gaze) p.lookAt(this.gaze);
    else if (!asleep) {
      const ptr = game.pixi.renderer.events?.pointer?.global;
      p.lookAt(ptr && ptr.x > 0 ? ptr : null);
    } else p.lookAt(null);
  }

  setLevel(level: number, scale: number) {
    this.levelScale = scale;
    this.applyScale();
  }
  private applyScale() {
    const sleepy = this.mood === 'sleep' || this.mood === 'boxsleep';
    const k = this.levelScale * this.mutScale;
    this.scale.set(k * this.face, k * (sleepy ? 0.9 : 1));
  }

  private randomPoint() {
    const a = this.area;
    for (let i = 0; i < 12; i++) {
      const x = a.x0 + Math.random() * a.w;
      const y = a.y0 + Math.random() * a.h;
      const v = a.avoid;
      if (v && x > v.x0 && x < v.x1 && y > v.y0 && y < v.y1) continue;
      return { x, y };
    }
    return { x: a.x0 + a.w * 0.6, y: a.y0 + a.h * 0.6 };
  }

  setArea(area: Area, travel = true) {
    this.area = area;
    const p = this.randomPoint();
    this.tx = p.x;
    this.ty = p.y;
    if (!travel) {
      this.gx = p.x;
      this.gy = p.y;
      this.place();
    } else {
      this.travelling = true;
      this.wait = 0;
    }
  }

  setMood(m: Mood) {
    if (m === this.mood) return;
    const was = this.mood;
    this.mood = m;
    this.bubble?.destroy({ children: true });
    this.bubble = null;
    this.tweens.forEach((t) => t.kill());
    this.tweens = [];
    this.hint?.destroy({ children: true });
    this.hint = null;
    if (m === 'sad') {
      const b = new Container();
      const g = new Graphics();
      g.roundRect(-44 + 3, -36 + 3, 88, 52, 16).fill(C.ink).roundRect(-44, -36, 88, 52, 16).fill(C.paper).stroke({ width: 3, color: C.ink });
      g.circle(-8, 24, 6).fill(C.paper).stroke({ width: 2.5, color: C.ink });
      g.circle(-16, 36, 3.5).fill(C.paper).stroke({ width: 2, color: C.ink });
      const box = emptyBoxArt();
      box.scale.set(0.62);
      box.position.set(-16, 0);
      b.addChild(g, box, sadFace(20, -10));
      b.y = -BASE * 1.35;
      this.addChild(b);
      this.bubble = b;
      this.speed = 0.45;
    } else this.speed = 0.9;
    if (m === 'boxsleep') {
      // pulsing ring + hand hint: "¡TÓCALO!"
      const h = new Container();
      const ring = new Graphics().ellipse(0, 0, 58, 22).stroke({ width: 5, color: C.pinkHot });
      const label = txt('¡TÓCALO!', { fontFamily: F.comic, fontSize: 30, fill: C.yellow, stroke: { color: C.ink, width: 6, join: 'round' } });
      label.anchor.set(0.5);
      label.y = -BASE * 1.25;
      h.addChild(ring, label);
      this.addChildAt(h, 0);
      this.tweens.push(gsap.to(ring.scale, { x: 1.25, y: 1.25, duration: 0.6, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
      this.tweens.push(gsap.to(label, { y: label.y - 10, duration: 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
      this.hint = h;
    }
    if ((was === 'sleep' || was === 'boxsleep') && m === 'roam') this.cat.hop();
    this.applyScale();
  }

  /** wake-up animation (H01): big hop + ¡MIAU! handled by the scene */
  wake() {
    this.setMood('roam');
    gsap
      .timeline()
      .to(this.cat.sprite, { y: -BASE * 0.6, duration: 0.2, ease: 'power2.out' })
      .to(this.cat.sprite, { y: 0, duration: 0.35, ease: 'bounce.out' });
    gsap.fromTo(this.cat.scale, { x: 1.25, y: 0.75 }, { x: 1, y: 1, duration: 0.6, ease: 'elastic.out(1.2,0.4)' });
  }

  happy() {
    this.cat.hop();
  }

  private place() {
    const p = isoToScreen(this.gx, this.gy);
    this.position.set(p.x, p.y);
    this.zIndex = this.gx + this.gy + 0.01;
  }

  update(dt: number) {
    this.tickLook(dt);
    this.act(dt);
    this.acc += dt;
    if (this.acc < 1 / 12) return; // animate on twos
    const step = this.acc;
    this.acc = 0;
    if (this.mood === 'sleep' || this.mood === 'boxsleep') {
      if (this.travelling) this.moveToward(step * 1.5);
      this.zzzT -= step;
      if (this.zzzT <= 0) {
        this.zzzT = 0.9;
        this.spawnZ();
      }
      return;
    }
    if (this.wait > 0) {
      this.moving = false;
      this.wait -= step;
      this.hopT -= step;
      if (this.hopT <= 0 && this.mood === 'roam') {
        this.hopT = 4 + Math.random() * 8;
        this.cat.hop();
      }
      return;
    }
    this.moving = true;
    if (this.moveToward(step)) {
      this.moving = false;
      this.travelling = false;
      this.wait = 1.2 + Math.random() * 3.5;
      const p = this.randomPoint();
      this.tx = p.x;
      this.ty = p.y;
    }
  }

  /** returns true on arrival */
  private moveToward(step: number) {
    const dx = this.tx - this.gx;
    const dy = this.ty - this.gy;
    const d = Math.hypot(dx, dy);
    const sp = this.travelling ? Math.max(1.6, d / 3) : this.speed;
    if (d < 0.05) return true;
    const mv = Math.min(d, sp * step);
    this.gx += (dx / d) * mv;
    this.gy += (dy / d) * mv;
    const sx = dx - dy; // screen x direction
    const f = sx >= 0 ? 1 : -1;
    if (f !== this.face) {
      this.face = f;
      this.applyScale();
    }
    this.place();
    return mv >= d - 1e-4;
  }

  private spawnZ() {
    if (!this.fx || this.destroyed) return;
    const z = txt('Z', { fontFamily: F.comic, fontSize: 26, fill: C.paper, stroke: { color: C.ink, width: 5, join: 'round' } });
    z.anchor.set(0.5);
    z.position.set(this.x + 18 * this.levelScale, this.y - BASE * 0.75 * this.levelScale);
    z.scale.set(0.5);
    this.fx.addChild(z);
    gsap.to(z, { x: z.x + 26, y: z.y - 60, alpha: 0, duration: 1.8, ease: 'sine.out', onComplete: () => z.destroy() });
    gsap.to(z.scale, { x: 1.1, y: 1.1, duration: 1.2 });
  }

  override destroy() {
    chatter.unregister(this);
    gsap.killTweensOf(this.cat.sprite);
    gsap.killTweensOf(this.cat.scale);
    this.tweens.forEach((t) => t.kill());
    super.destroy({ children: true });
  }
}
