/** A cat living on the island: wanders inside its area "on twos", hops, sleeps (Zzz), sulks when homeless. */
import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { game } from '../core/App';
import gsap from 'gsap';
import { IslandCat } from '../art/catArt';
import { applyCatTint, slugOf } from '../art/tint';
import { catDef } from '../data/content';
import { C, F } from '../ui/theme';
import { txt } from '../ui/widgets';
import { isoToScreen, TH, TW } from './iso';
import { emptyBoxArt } from './buildingArt';
import { chatter } from './chatter/director';
import { G } from '../state/game';
import { catSlug } from '../state/sys/forms';
import { glowTexture, sparkTexture } from '../art/textures';
import { mutationOverlay, syncMutationOverlay } from '../panels/collection/art';
import { mutationLook } from '../state/ext/collection';
import { bake, rgba, particleTex } from './dimensions/bake';
import { settings } from '../core/settings';
import { onomatopoeia } from '../fx/juice';
import { motionAmount, motionProfile, type EventKind, type MotionProfile, type Reaction } from '../art/temperament';
import { IntentDriver, arriveIntent, departIntent, departLead, hopIntent, quirkIntent, reactionIntent, type Intent } from '../art/intent';

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
/**
 * Parte II narrative nights (island/night/cats.ts, by personality): watch the sky, cower, keep sleeping,
 * try to catch the stars, or challenge them. null = the cat's normal island life.
 */
export type NightReaction = 'gaze' | 'cower' | 'sleep' | 'chase' | 'challenge';

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
  /** painting slug it was built with (IslandScene rebuilds the actor when the cat switches form) */
  readonly slug: string;
  /** narrative world state reaction (island/night/cats.ts); null = normal life. Changing it plays an entry beat. */
  get night(): NightReaction | null {
    return this._night;
  }
  set night(v: NightReaction | null) {
    if (v === this._night) return;
    const was = this._night;
    this._night = v;
    this.nightChanged(was, v);
  }
  private _night: NightReaction | null = null;
  // ---- purposeful motion (art/temperament.ts + art/intent.ts): anticipation, weight, personality
  /** how this cat moves (trait → temperament, rarity → weight, primordial → solemn, Canelo → his own) */
  readonly prof: MotionProfile;
  /** plays this cat's intents (its own visual dice, never the battle's) */
  readonly intent: IntentDriver;
  private quirkT = 0;
  /** anticipation before walking off: the walk waits for it */
  private holdMove = 0;
  /** Canelo's zoomies (and anyone's dash): faster, leaning, skids on arrival */
  private dash = 0;
  /** a reaction just played: don't stack another one right away */
  private reactCd = 0;
  private reactAt: { x: number; y: number } | null = null;
  private pendingGaze: { at: { x: number; y: number }; t: number; dur: number } | null = null;
  private loud = false;
  private _uniform = false;
  /** a cine wants every cat in lockstep (the «corrected» pose): no personality while it holds */
  get uniform() {
    return this._uniform;
  }
  set uniform(v: boolean) {
    if (v === this._uniform) return;
    this._uniform = v;
    if (v) this.intent.reset();
  }
  /** global point the sky-watchers turn their heads to */
  skyAt: { x: number; y: number } | null = null;
  private nightT = 1 + Math.random() * 4;
  /** layer for Zzz/bubbles (world fx) */
  constructor(
    public catUid: string,
    public species: string,
    area: Area,
    public fx: Container,
  ) {
    super();
    this.area = area;
    // the painting of THIS cat (its active form, if any): state/sys/forms.ts catSlug
    const own = G.s.cats.find((c) => c.uid === catUid);
    this.slug = own ? catSlug(own) : slugOf(species);
    this.cat = new IslandCat(this.slug, BASE);
    applyCatTint(this.cat.sprite, species);
    const ts = catDef(species).art.tint?.scale;
    if (ts) this.cat.baseScale *= ts;
    this.addChild(this.cat);
    this.prof = motionProfile(species);
    this.intent = new IntentDriver({ puppet: this.cat.sprite, body: this.cat, lifted: this.cat.sprite, size: BASE }, this.prof, catUid);
    this.intent.onCue = (c) => this.onCue(c);
    const tp = this.prof.temperament;
    this.quirkT = this.intent.rng.range(tp.quirkEvery[0], tp.quirkEvery[1]) * 0.6;
    if (tp.hopEvery) this.hopT = this.intent.rng.range(tp.hopEvery[0], tp.hopEvery[1]) * 0.6;
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
    const sq = this.prof.weight.squash;
    const talk: Intent = { name: 'talk', dur: 0.5, tracks: { sx: [[0, 0.08 * sq], [0.12, -0.03 * sq, 'io'], [0.26, 0.015 * sq, 'io'], [0.45, 0, 'io']], sy: [[0, -0.08 * sq], [0.12, 0.03 * sq, 'io'], [0.26, -0.015 * sq, 'io'], [0.45, 0, 'io']] } };
    if (this.intent.play(talk, this.motion(), { layer: true })) return;
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
    p.lean = this.dash > 0 && this.moving ? 0.55 : 0;
    if (this.pendingGaze) {
      this.pendingGaze.t -= dt;
      if (this.pendingGaze.t <= 0) {
        this.gazeAt(this.pendingGaze.at, this.pendingGaze.dur);
        this.pendingGaze = null;
      }
    }
    p.acts = asleep ? 'none' : this.mood === 'sad' ? 'calm' : 'all';
    this.gazeT -= dt;
    if (this.gazeT > 0 && this.gaze) p.lookAt(this.gaze);
    else if (!asleep) {
      const ptr = game.pixi.renderer.events?.pointer?.global;
      p.lookAt(ptr && ptr.x > 0 ? ptr : null);
    } else p.lookAt(null);
    if (this.night && !asleep) this.nightPose(p);
  }

  /** the sky is doing something (Parte II world state): posture by personality */
  private nightPose(p: IslandCat['sprite']) {
    const sky = this.gazeT > 0 && this.gaze ? this.gaze : this.skyAt;
    switch (this.night) {
      case 'gaze':
        p.crouch = -0.3;
        p.walk = 0;
        p.acts = 'calm';
        if (sky) p.lookAt(sky);
        break;
      case 'challenge':
        p.crouch = 0.22;
        p.walk = 0;
        p.acts = 'none';
        if (sky) p.lookAt(sky);
        break;
      case 'cower':
        p.crouch = 0.62;
        p.walk = 0;
        p.acts = 'none';
        p.lookAt(null);
        break;
      case 'sleep':
        p.sleeping = true;
        this.cat.sleeping = true;
        p.walk = 0;
        p.acts = 'none';
        p.lookAt(null);
        break;
      case 'chase':
        if (sky && !this.moving) p.lookAt(sky);
        break;
    }
  }

  /** returns true when the reaction holds the cat in place this step */
  private nightStep(step: number) {
    const r = this.night;
    if (!r || this.mood === 'sleep' || this.mood === 'boxsleep' || this.travelling) return false;
    this.nightT -= step;
    const p = this.cat.sprite;
    if (this.nightT <= 0 && this.nightVariety(r)) {
      // played a personality beat instead (art/intent.ts)
    } else if (this.nightT <= 0) {
      if (r === 'sleep') {
        this.nightT = 1.1;
        this.spawnZ();
      } else if (r === 'cower') {
        this.nightT = 2.5 + Math.random() * 2.5;
        p.emote('hurt', 0.35);
      } else if (r === 'challenge') {
        this.nightT = 3 + Math.random() * 3;
        p.emote('attack', 0.7);
      } else if (r === 'chase') {
        this.nightT = 3.5 + Math.random() * 4;
        p.emote('attack', 0.55);
        this.cat.hop();
      } else {
        this.nightT = 4 + Math.random() * 5;
        if (Math.random() < 0.35) p.emote('surprise', 0.4);
      }
    }
    if (r === 'chase') return false;
    this.moving = false;
    return true;
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
    if ((was === 'sleep' || was === 'boxsleep') && m === 'roam' && !this.intent.play(hopIntent(this.prof), this.motion())) this.cat.hop();
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

  /** a tap, a new home, a cine hop: the cat's own joyful answer (plain hop with «reducir movimiento») */
  happy() {
    if (!this.playReaction(this.prof.temperament.react.tap, null, 0)) this.cat.hop();
  }

  /** stand right here now (a FORM switch rebuilds the actor where the old one was) */
  teleport(gx: number, gy: number) {
    this.gx = gx;
    this.gy = gy;
    this.place();
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
    const amt = this.motion();
    const asleep = this.mood === 'sleep' || this.mood === 'boxsleep';
    this.intent.posture = !asleep && this.mood === 'roam' && !this._night ? 1 : 0;
    this.intent.update(step, amt);
    this.reactCd -= step;
    if (asleep) {
      if (this.travelling) this.moveToward(step * 1.5);
      this.zzzT -= step;
      if (this.zzzT <= 0) {
        this.zzzT = 0.9;
        this.spawnZ();
      }
      return;
    }
    if (this.nightStep(step)) return;
    if (this.holdMove > 0) {
      // gathering itself before walking off (the depart's anticipation)
      this.moving = false;
      this.holdMove -= step;
      return;
    }
    if (this.wait > 0) {
      this.moving = false;
      this.wait -= step;
      this.hopT -= step;
      if (amt > 0) {
        this.idle(step);
        if (this.wait <= 0 && !this.travelling) {
          // anticipation: turn toward where it's going, lean back, gather, push off
          this.faceTo(this.tx - this.gx, this.ty - this.gy);
          if (this.intent.play(departIntent(this.prof), amt)) this.holdMove = departLead(this.prof);
        }
      } else if (this.hopT <= 0 && this.mood === 'roam') {
        this.hopT = 4 + Math.random() * 8;
        this.cat.hop();
      }
      return;
    }
    this.moving = true;
    if (this.moveToward(step)) {
      this.moving = false;
      this.travelling = false;
      // follow-through: momentum carries it past its feet, it sways back and settles (a dash skids)
      if (amt > 0 && this.mood === 'roam') this.intent.play(arriveIntent(this.prof, this.dash > 0 ? 1.9 : 1), amt);
      this.dash = 0;
      this.wait = 1.2 + Math.random() * 3.5;
      const p = this.randomPoint();
      this.tx = p.x;
      this.ty = p.y;
    }
  }

  // ------------------------------------------------------------------ purposeful motion (docs/part-ii/31)
  /** 0 with «reducir movimiento» or while a cine holds every cat in lockstep */
  motion() {
    return this._uniform ? 0 : motionAmount(settings.reduceMotion);
  }

  /** idle life by temperament: its own hops (or none, for the primordials) and its quirks */
  private idle(step: number) {
    if (this.mood !== 'roam' || this.intent.busy) return;
    const tp = this.prof.temperament;
    const rng = this.intent.rng;
    this.quirkT -= step;
    if (tp.hopEvery && this.hopT <= 0) {
      this.hopT = rng.range(tp.hopEvery[0], tp.hopEvery[1]);
      const canelo = this.prof.signature === 'canelo';
      this.intent.play(canelo && rng.chance(0.4) ? reactionIntent('zoom', this.prof, rng) : hopIntent(this.prof, { double: rng.chance(tp.doubleHop), height: 0.75 + rng.next() * 0.45 }), this.motion());
      return;
    }
    if (this.quirkT > 0) return;
    this.quirkT = rng.range(tp.quirkEvery[0], tp.quirkEvery[1]);
    const q = rng.pick(tp.quirks);
    if (q === 'zoom') {
      // zoomies: a far spot of its area, a sprint, a skid
      const far = this.farPoint();
      this.tx = far.x;
      this.ty = far.y;
      this.faceTo(this.tx - this.gx, this.ty - this.gy);
    }
    this.loud = false;
    this.intent.play(quirkIntent(q, this.prof, rng), this.motion());
  }

  /** an intent's cue for the owner */
  private onCue(c: string) {
    if (this.destroyed) return;
    if (c === 'dash') {
      this.dash = 1;
      this.wait = 0;
      this.holdMove = 0;
    } else if (c === 'move') {
      // advance: a few steps toward what caught its eye (inside its own area)
      const at = this.reactAt;
      if (!at || !this.parent || this._night || this.mood !== 'roam' || this.travelling) return;
      const lp = this.parent.toLocal(at);
      const gx = (lp.y / (TH / 2) + lp.x / (TW / 2)) / 2;
      const gy = (lp.y / (TH / 2) - lp.x / (TW / 2)) / 2;
      const d = Math.hypot(gx - this.gx, gy - this.gy) || 1;
      const go = Math.min(d, 1.4);
      const a = this.area;
      this.tx = Math.max(a.x0, Math.min(a.x0 + a.w, this.gx + ((gx - this.gx) / d) * go));
      this.ty = Math.max(a.y0, Math.min(a.y0 + a.h, this.gy + ((gy - this.gy) / d) * go));
      this.wait = 0;
      this.holdMove = 0;
    } else if (c === 'swatText' && this.loud && this.fx) {
      onomatopoeia(this.fx, this.x, this.y - 150 * this.scale.y, '¡MÍA!', { size: 64, color: C.yellow });
    }
  }

  /**
   * Something happened (a sky event, a boom, a cheer): the cat answers in character, after its own reaction time
   * (+ `delay`, e.g. how far the news has to travel). It LOOKS first (if `at` is given), then the body reacts.
   * Returns false when it can't (asleep, in lockstep, cooling down from the last one).
   */
  react(kind: EventKind, at: { x: number; y: number } | null = null, o: { delay?: number; force?: boolean; loud?: boolean; gaze?: number } = {}): boolean {
    if (this.destroyed || this._uniform) return false;
    if (this.mood === 'sleep' || this.mood === 'boxsleep' || this._night === 'sleep') return false;
    if (!o.force && this.reactCd > 0) return false;
    const tp = this.prof.temperament;
    const lat = (o.delay ?? 0) + this.intent.rng.range(tp.latency[0], tp.latency[1]) * tp.tempo;
    this.loud = !!o.loud;
    return this.playReaction(tp.react[kind], at, lat, kind, o.gaze);
  }

  /** Canelo's own: he leaps at it, misses, lands, grooms like nothing happened (false = motion off) */
  swat(at: { x: number; y: number } | null = null, loud = true): boolean {
    if (this.destroyed || this._uniform) return false;
    this.loud = loud;
    return this.playReaction('swat', at, 0);
  }

  /** play a reaction now or after `lat` s (looks at `at` first); false = motion is off (caller does the plain thing) */
  playReaction(r: Reaction, at: { x: number; y: number } | null, lat: number, kind?: EventKind, gaze?: number): boolean {
    const amt = this.motion();
    if (amt <= 0) {
      if (kind) this.cat.sprite.emote(kind === 'joy' || kind === 'tap' ? 'happy' : 'surprise', kind === 'wonder' ? 0.4 : 0.7);
      return false;
    }
    this.reactCd = lat + 1.2;
    this.reactAt = at;
    if (at && r !== 'hide' && r !== 'glare' && r !== 'ignore') this.pendingGaze = { at, t: lat * 0.6, dur: gaze ?? 2.2 + this.intent.rng.next() * 1.4 };
    const dir = at ? this.dirTo(at) : 1;
    return this.intent.play(reactionIntent(r, this.prof, this.intent.rng, dir), amt, { delay: lat });
  }

  /** the narrative state changed under this cat: an entry beat in character (and a shake-off when it ends) */
  private nightChanged(was: NightReaction | null, v: NightReaction | null) {
    if (this._uniform || this.destroyed || this.motion() <= 0) return;
    if (this.mood === 'sleep' || this.mood === 'boxsleep') return;
    const tp = this.prof.temperament;
    const lat = this.intent.rng.range(tp.latency[0], tp.latency[1]) * tp.tempo + this.intent.rng.next() * 0.35;
    if (!v) {
      if (was) this.playReaction('ignore', null, lat);
      return;
    }
    if (was) return; // one reaction to another: the pose changes, no new entry beat
    const canelo = this.prof.signature === 'canelo';
    const r: Reaction =
      v === 'gaze' ? (this.prof.solemn ? 'loom' : 'gawk')
      : v === 'chase' ? (canelo ? 'swat' : 'pounce')
      : v === 'challenge' ? (tp.react.joy === 'puff' ? 'puff' : 'brace')
      : v === 'cower' ? 'hide'
      : 'late';
    this.playReaction(r, this.skyAt, lat);
  }

  /** a personality beat during a narrative night instead of the plain periodic emote; false = do the plain one */
  private nightVariety(r: NightReaction): boolean {
    if (this.motion() <= 0) return false;
    if (this.intent.busy) {
      this.nightT = 0.6; // something's still playing: try again in a moment (never a plain hop over it)
      return true;
    }
    const rng = this.intent.rng;
    const sky = this.skyAt;
    const canelo = this.prof.signature === 'canelo';
    const tp = this.prof.temperament;
    let beat: Reaction | null = null;
    if (r === 'cower') beat = rng.chance(0.6) ? 'hide' : null;
    else if (r === 'challenge') beat = rng.pick<Reaction>(['brace', 'puff', 'brace']);
    else if (r === 'chase') beat = canelo ? rng.pick<Reaction>(['swat', 'swat', 'zoom']) : rng.pick<Reaction>(['pounce', 'bounce']);
    else if (r === 'gaze') beat = rng.chance(0.55) ? (this.prof.solemn ? 'loom' : rng.pick<Reaction>(['gawk', 'gawk', tp.react.wonder === 'advance' ? 'advance' : 'gawk', 'nod'])) : null;
    if (!beat) return false;
    this.nightT = (r === 'chase' ? 3.5 : 4) + rng.next() * 5 * tp.tempo;
    this.loud = canelo && beat === 'swat' && rng.chance(0.35);
    return this.playReaction(beat, sky, 0);
  }

  /** which side a global point is on, in the cat's own facing (+1 = in front) */
  private dirTo(at: { x: number; y: number }) {
    const l = this.toLocal(at);
    return l.x >= 0 ? 1 : -1;
  }
  private faceTo(dx: number, dy: number) {
    if (Math.abs(dx) + Math.abs(dy) < 1e-4) return;
    const f = dx - dy >= 0 ? 1 : -1;
    if (f !== this.face) {
      this.face = f;
      this.applyScale();
    }
  }
  /** the far side of its own area (zoomies) */
  private farPoint() {
    let best = this.randomPoint();
    let bd = Math.hypot(best.x - this.gx, best.y - this.gy);
    for (let i = 0; i < 3; i++) {
      const p = this.randomPoint();
      const d = Math.hypot(p.x - this.gx, p.y - this.gy);
      if (d > bd) {
        best = p;
        bd = d;
      }
    }
    return best;
  }

  /** returns true on arrival */
  private moveToward(step: number) {
    const dx = this.tx - this.gx;
    const dy = this.ty - this.gy;
    const d = Math.hypot(dx, dy);
    const pace = this.motion() > 0 ? this.prof.temperament.pace * (this.dash > 0 ? 2.6 : 1) : 1;
    const sp = this.travelling ? Math.max(1.6, d / 3) : this.speed * pace;
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
    this.intent.clear();
    this.intent.onCue = null;
    gsap.killTweensOf(this.cat.sprite);
    gsap.killTweensOf(this.cat.scale);
    this.tweens.forEach((t) => t.kill());
    super.destroy({ children: true });
  }
}
