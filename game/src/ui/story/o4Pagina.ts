/**
 * Parte II · Oleada 4 · H64–H65: THE BLANK PAGE BY YOUR FARO — a prop in your island's world, derived from the save
 * (so it is there after a reload, a trip to the CARTA, or the narrative reset; «si la historia lo dice, pasa en el
 * mundo»):
 *
 *   waiting  H64 active, after the page came down (b64_mentira#a): it floats by the faro and breathes; tap it (or the
 *            faro) and the scene plays
 *   canelo   Canelo fell asleep on it (b64_mentira#b) until the Parte II credits end (H65): he sleeps there, Zzz, and
 *            his walking self steps aside so there is only one Canelo
 *   rest     after the Parte II: the page stays by the faro, still blank, with a warm dent where a cat slept
 *
 * It lives in the island's GRADED world layer (found by its Pixi label, `graded`), so the night grades it like
 * everything else; its spot comes from the island's cine stage (`resolve('faro')`). Nothing here edits the island:
 * when the scene goes, the prop goes with it, and oleada4Flow mounts it again on the next island.
 *
 * PARTE III (docs/part-iii/04 §1, §6 · state/sys/gaterasWorld.ts), same prop, more story:
 *   - `rest` while the dent is still WARM (after the Parte II, before H66) breathes a thin steam; when H66 appears the
 *     steam goes out (coolDown: the card's moment) and the mark stays cold.
 *   - H66 waiting: tapping the page is the prologue's door (setPaginaP3Tap, ui/story/gaterasCines.ts → an orange hair
 *     flies into a tiny CAT FLAP at the faro's base → the bar). The flap (gatera) stays from then on; after the
 *     awakening it is TORN, with static at its edges and footprints that lose their edges (D4).
 *   - after the awakening, a donut stuck on Canelo's little palm (the raft's): D7, until H73.
 */
import { Container, Graphics, Polygon, Text, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { scenes } from '../../core/scenes';
import { C, F } from '../theme';
import { txt } from '../widgets';
import { floatText, sparkles } from '../../fx/juice';
import { G } from '../../state/game';
import { IslandCat, preloadCats } from '../../art/catArt';
import { applyCatTint, slugOf } from '../../art/tint';
import { catSlug } from '../../state/sys/forms';
import { cineStage } from '../../cine/registry';
import type { WorldSave } from '../../state/sys/worldState';
import { settings } from '../../core/settings';
import { sceneKind } from './o3Sky';
import { registerIslandTarget } from '../../island/night/stage';
import { despertoRegistro, paginaLlama, paginaTibia } from '../../state/sys/gaterasWorld';

export type PageMode = 'hidden' | 'waiting' | 'canelo' | 'rest';
export const PAGE_ARRIVED = 'b64_mentira#a';
export const PAGE_ASLEEP = 'b64_mentira#b';

/** pure: what the page by the faro looks like for this save */
export function pageModeFor(s: WorldSave | null | undefined): PageMode {
  if (!s?.missions) return 'hidden';
  const active = (id: string) => s.missions.active.includes(id);
  const done = (id: string) => s.missions.done.includes(id);
  const seen = (k: string) => (s.beatsSeen ?? []).includes(k);
  if (done('H65')) return 'rest';
  if (active('H65') || (active('H64') && seen(PAGE_ASLEEP))) return 'canelo';
  if (active('H64') && seen(PAGE_ARRIVED)) return 'waiting';
  return 'hidden';
}

const W_PAGE = 190;
const H_PAGE = 120;

/** the island scene's graded world layer (null = not on the island / not built yet) */
function gradedLayer(): Container | null {
  const sc = scenes.current as Container | null;
  // instanceof via sceneKind, never `constructor.name`: a production build renames classes (the page never mounted)
  if (!sc || sc.destroyed || sceneKind(sc) !== 'island') return null;
  const g = sc.getChildByLabel('graded', true);
  return g && !g.destroyed ? g : null;
}
/** where the page lies: a little in front of the faro's base (the stage resolves the lamp) */
function pageSpot(): { x: number; y: number } | null {
  const st = cineStage('island');
  if (!st?.alive()) return null;
  const f = st.resolve('faro');
  return f ? { x: f.x + 100, y: f.y + 215 } : null;
}

type Actorish = Container & { species?: string; catUid?: string };
function caneloActors(root: Container): Actorish[] {
  const out: Actorish[] = [];
  const walk = (c: Container, depth: number) => {
    for (const ch of c.children as Actorish[]) {
      if (ch.species === 'c_canelo' && typeof ch.catUid === 'string') out.push(ch);
      else if (depth < 3 && ch.children?.length) walk(ch, depth + 1);
    }
  };
  walk(root, 0);
  return out;
}

export class FaroPage extends Container {
  mode: PageMode = 'hidden';
  private sheet = new Container();
  private glow = new Graphics();
  private dent = new Graphics();
  private cat: IslandCat | null = null;
  private zzz: Text[] = [];
  private hidden: Actorish[] = [];
  private t = Math.random() * 10;
  private hover = 0;
  private tweens: gsap.core.Tween[] = [];
  private tick = (tk: Ticker) => this.onTick(Math.min(0.1, tk.deltaMS / 1000));
  /** tap on the page (H64: the scene) */
  onTap: (() => void) | null = null;
  // ---- Parte III
  /** the warm mark's steam (three wisps; `warm` = they breathe) */
  private steam: Graphics[] = [];
  private warm = false;
  private cooling = false;
  /** the cat flap at the faro's base (H66+) and its torn edge (after the awakening) */
  gatera: Container | null = null;
  private gateraFlap: Graphics | null = null;
  private gateraTear: Graphics | null = null;
  private torn = false;
  /** H66 waits: the page CALLS — a ring, Canelo's hair standing up from the cold mark, its name (setCalling) */
  private call: Container | null = null;
  private callRing: Graphics | null = null;
  private callHair: Graphics | null = null;
  private callTag: Container | null = null;
  /** the hair already flew to the flap (the prologue started): the page stops calling */
  leaving = false;

  constructor() {
    super();
    this.label = 'o4FaroPage';
    // light on the ground under it
    for (let i = 4; i >= 1; i--) this.glow.ellipse(0, 0, W_PAGE * 0.55 + i * 22, H_PAGE * 0.4 + i * 9).fill({ color: 0xfff6dc, alpha: 0.12 });
    this.dent.ellipse(-8, -6, 46, 16).fill({ color: 0xcfc6b4, alpha: 0.75 }).ellipse(30, -12, 18, 9).fill({ color: 0xcfc6b4, alpha: 0.6 });
    this.dent.visible = false;
    const g = new Graphics();
    // a sheet lying on the ground (seen from the island's iso camera)
    const pts = [-W_PAGE / 2, 0, 0, -H_PAGE / 2, W_PAGE / 2, 0, 0, H_PAGE / 2];
    g.poly(pts.map((v, i) => v + (i % 2 ? 6 : 6))).fill({ color: C.ink, alpha: 0.25 });
    g.poly(pts).fill(0xfbf8f1).stroke({ width: 3, color: 0xd6cfbf });
    // a folded corner
    g.poly([W_PAGE / 2 - 30, -15, W_PAGE / 2, 0, W_PAGE / 2 - 22, 4]).fill(0xe9e2d2).stroke({ width: 2, color: 0xd6cfbf });
    this.sheet.addChild(g, this.dent);
    // the glow is light, not a target: it sat over the cat flap and swallowed its taps (QA-PORCION: 23/210 → 167/210)
    this.glow.eventMode = 'none';
    this.addChild(this.glow, this.sheet);
    this.sheet.eventMode = 'static';
    this.sheet.cursor = 'pointer';
    this.sheet.on('pointertap', () => this.tapped());
    // Parte III: the warm mark's steam (over the dent; only drawn while the mark is warm)
    for (let i = 0; i < 3; i++) {
      const w = new Graphics();
      w.moveTo(0, 0).bezierCurveTo(-8, -14, 8, -26, 0, -40).bezierCurveTo(-7, -52, 6, -62, 0, -74).stroke({ width: 5, color: 0xffffff, alpha: 0.7, cap: 'round' });
      w.position.set(-22 + i * 18, -14);
      w.visible = false;
      this.sheet.addChild(w);
      this.steam.push(w);
    }
    Ticker.shared.add(this.tick);
  }

  private tapped() {
    // Parte III: H66 waits here (the prologue's door)
    if (p3Tap?.(this)) return;
    if (this.onTap) return this.onTap();
    const p = { x: this.x, y: this.y - 120 };
    const text = this.mode === 'rest' ? 'Sigue en blanco. Nadie escribe debajo de un gato dormido.' : 'Shh. Está dormido.';
    if (this.parent) floatText(this.parent, p.x, p.y, text, { size: 24, color: C.paper, font: F.ui, rise: 50, dur: 2.2 });
  }

  /** the page comes down from the sky like a leaf and lands here (the H64 arrival). Instant with reduced motion. */
  fall(instant = false): Promise<void> {
    this.setMode('waiting');
    if (instant || settings.reduceMotion) return Promise.resolve();
    this.sheet.position.set(-260, -900);
    this.sheet.rotation = -0.6;
    this.glow.alpha = 0;
    return new Promise<void>((res) => {
      const tl = gsap.timeline({ onComplete: () => res() });
      tl.to(this.sheet, { x: 120, y: -560, rotation: 0.4, duration: 2.2, ease: 'sine.inOut' })
        .to(this.sheet, { x: -90, y: -240, rotation: -0.3, duration: 2, ease: 'sine.inOut' })
        .to(this.sheet, { x: 0, y: -this.hover, rotation: 0, duration: 1.6, ease: 'sine.out' })
        .to(this.glow, { alpha: 1, duration: 1.2 }, '-=1');
      this.tweens.push(tl as unknown as gsap.core.Tween);
    }).then(() => {
      if (this.parent && !this.destroyed) sparkles(this.parent, this.x, this.y - 40, 0xfff6dc, 12, 120);
    });
  }

  setMode(m: PageMode) {
    if (m === this.mode || this.destroyed) return;
    this.mode = m;
    this.hover = m === 'waiting' ? 30 : 0;
    this.sheet.position.set(0, -this.hover);
    this.sheet.rotation = 0;
    this.dent.visible = m === 'rest';
    this.glow.alpha = m === 'rest' ? 0.45 : 1;
    this.setWarm(m === 'rest' && paginaTibia(G.s));
    if (m === 'canelo') void this.sleepCanelo();
    else this.wakeCanelo();
  }

  private async sleepCanelo() {
    const c = G.s.cats.find((x) => x.species === 'c_canelo');
    const slug = c ? catSlug(c) : slugOf('c_canelo');
    await preloadCats([slug]).catch(() => undefined);
    if (this.destroyed || this.mode !== 'canelo' || this.cat) return;
    const cat = new IslandCat(slug, 110);
    applyCatTint(cat.sprite, 'c_canelo');
    cat.sleeping = true;
    cat.sprite.sleeping = true;
    cat.sprite.crouch = 0.5;
    cat.sprite.emote('sleepy', 1);
    cat.position.set(-4, 10);
    cat.shadow.visible = false;
    this.sheet.addChild(cat);
    this.cat = cat;
    for (let i = 0; i < 3; i++) {
      const z = txt('z', { fontFamily: F.comic, fontSize: 34 - i * 6, fill: 0xf3eeff, stroke: { color: C.ink, width: 5, join: 'round' } }) as Text;
      z.position.set(40 + i * 18, -110 - i * 30);
      z.alpha = 1 - i * 0.3;
      this.sheet.addChild(z);
      this.zzz.push(z);
    }
    // only one Canelo: the one walking around steps aside while this one sleeps
    const root = this.parent;
    if (root) {
      this.hidden = caneloActors(root);
      for (const a of this.hidden) a.alpha = 0;
    }
  }
  private wakeCanelo() {
    for (const a of this.hidden) if (!a.destroyed) a.alpha = 1;
    this.hidden = [];
    this.cat?.destroy();
    this.cat = null;
    for (const z of this.zzz) z.destroy();
    this.zzz = [];
  }

  // ------------------------------------------------------------------ Parte III
  /** the dent's steam: on while the mark is warm (never during a coolDown) */
  setWarm(on: boolean) {
    if (this.cooling || this.destroyed || on === this.warm) return;
    this.warm = on;
    for (const w of this.steam) {
      w.visible = on;
      w.alpha = on ? 0.6 : 0;
    }
  }
  /** the steam goes out (H66: «la marca ya no está tibia»). Resolves when it's cold. */
  coolDown(): Promise<void> {
    if (this.destroyed) return Promise.resolve();
    this.cooling = true;
    for (const w of this.steam) {
      w.visible = true;
      if (w.alpha <= 0.05) w.alpha = 0.6;
    }
    const dur = settings.reduceMotion ? 0.6 : 2.6;
    return new Promise<void>((res) => {
      const tl = gsap.timeline({
        onComplete: () => {
          this.cooling = false;
          this.warm = false;
          for (const w of this.steam) if (!w.destroyed) w.visible = false;
          res();
        },
      });
      // the wisps thin out one by one, the last one gives a little puff and is gone
      this.steam.forEach((w, i) => tl.to(w, { alpha: 0, duration: dur * 0.45, ease: 'power1.in' }, i * dur * 0.2));
      tl.to(this.glow, { alpha: 0.3, duration: dur * 0.6 }, 0);
      this.tweens.push(tl as unknown as gsap.core.Tween);
    });
  }

  /**
   * H66 waits (the owner tapped the faro: the target must be named and marked): a pulsing ring around the page, one
   * of Canelo's orange hairs standing up from the cold mark, and «LA PÁGINA» over it. The page's hit area grows to
   * cover the ring and the name. Off: everything goes and the hit area is the sheet again.
   */
  setCalling(on: boolean) {
    if (this.destroyed || on === !!this.call) return;
    if (!on) {
      this.call?.destroy({ children: true });
      this.call = this.callRing = this.callHair = this.callTag = null;
      this.sheet.hitArea = null;
      return;
    }
    const c = new Container();
    c.eventMode = 'none';
    const ring = new Graphics().ellipse(0, 0, W_PAGE * 0.62, H_PAGE * 0.66).stroke({ width: 5, color: 0xe8742a, alpha: 0.95 });
    const hair = new Graphics();
    hair.moveTo(0, 0).bezierCurveTo(-12, -22, 14, -42, -2, -70).stroke({ width: 7, color: C.ink, cap: 'round' });
    hair.moveTo(0, 0).bezierCurveTo(-12, -22, 14, -42, -2, -70).stroke({ width: 4, color: 0xe8742a, cap: 'round' });
    hair.position.set(-8, -8);
    const tag = new Container();
    const name = txt('LA PÁGINA', { fontFamily: F.ui, fontSize: 28, fill: C.paper, stroke: { color: C.ink, width: 7, join: 'round' } }) as Text;
    name.anchor.set(0.5, 1);
    name.position.set(0, -112);
    const arrow = new Graphics().poly([-13, -106, 13, -106, 0, -88]).fill(C.paper).stroke({ width: 3, color: C.ink });
    tag.addChild(arrow, name);
    c.addChild(ring, hair, tag);
    this.sheet.addChild(c);
    this.call = c;
    this.callRing = ring;
    this.callHair = hair;
    this.callTag = tag;
    const wx = W_PAGE * 0.66;
    const hy = H_PAGE * 0.7;
    this.sheet.hitArea = new Polygon([-wx, 0, -70, -hy * 0.8, -70, -150, 70, -150, 70, -hy * 0.8, wx, 0, 0, hy]);
  }

  /** the cat flap at the faro's base (page-local: up-left, against the tower) */
  static readonly GATERA_AT = { x: -88, y: -47 };
  /** mount the flap (H66+); `torn` after the awakening: static edges + footprints that lose their edges */
  setGatera(on: boolean, torn = false) {
    if (!on) {
      this.gatera?.destroy({ children: true });
      this.gatera = null;
      this.gateraFlap = this.gateraTear = null;
      this.torn = false;
      return;
    }
    if (!this.gatera) {
      const g = new Container();
      g.label = 'p3Gatera';
      const frame = new Graphics();
      // a tiny arched cat door in the tower's stone (seen from the iso camera)
      frame.roundRect(-19, -33, 38, 36, 15).fill(0x7a6658).stroke({ width: 3, color: C.ink });
      frame.roundRect(-13, -27, 26, 29, 10).fill(0x120e10);
      const flap = new Graphics().roundRect(-12, 0, 24, 27, 9).fill(0xc99a62).stroke({ width: 2.5, color: C.ink });
      // a little paw print on the flap
      flap.circle(0, 16, 3.6).fill(0x8a5a2e).circle(-4.5, 10, 1.8).fill(0x8a5a2e).circle(0, 8.4, 1.8).fill(0x8a5a2e).circle(4.5, 10, 1.8).fill(0x8a5a2e);
      flap.position.set(0, -27);
      g.addChild(frame, flap);
      g.position.set(FaroPage.GATERA_AT.x, FaroPage.GATERA_AT.y);
      g.eventMode = 'static';
      g.cursor = 'pointer';
      g.on('pointertap', (e) => {
        e.stopPropagation();
        if (gateraTap?.()) return;
        if (this.parent) floatText(this.parent, this.x + FaroPage.GATERA_AT.x, this.y + FaroPage.GATERA_AT.y - 70, this.torn ? 'Está rasgada. Algo pasó por aquí.' : 'Una gatera. En MI faro.', { size: 22, color: C.paper, font: F.ui, rise: 40, dur: 2 });
      });
      this.addChildAt(g, 0);
      this.gatera = g;
      this.gateraFlap = flap;
    }
    if (torn !== this.torn) {
      this.torn = torn;
      this.gateraTear?.destroy();
      this.gateraTear = null;
      if (torn && this.gatera) {
        const t = new Graphics();
        // the door is TORN: a jagged rip of static across it, bars of signal around its edge (cyan / paper / pink)
        t.poly([-17, -30, -4, -12, -12, -8, 4, 8, -2, 10, 14, 4]).stroke({ width: 4, color: C.ink, join: 'miter' });
        t.poly([-17, -30, -4, -12, -12, -8, 4, 8, -2, 10, 14, 4]).stroke({ width: 2, color: C.cyan, join: 'miter' });
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * Math.PI * 2;
          const r = 24 + (i % 3) * 6;
          const col = i % 3 === 0 ? C.cyan : i % 3 === 1 ? C.paper : C.pinkHot;
          t.rect(Math.cos(a) * r - 5, -15 + Math.sin(a) * r * 0.85 - 1.5, 8 + (i % 2) * 6, 3).fill({ color: col, alpha: 0.85 });
        }
        // little prints going IN, whose edges are erased (a soft halo, a pale core, no outline)
        for (let i = 0; i < 4; i++) {
          const px = 46 - i * 14;
          const py = 34 - i * 9;
          t.circle(px, py, 6.5).fill({ color: 0xbfd8ff, alpha: 0.22 }).circle(px, py, 3.6).fill({ color: 0xffffff, alpha: 0.6 });
          t.circle(px - 3.5, py - 5, 1.8).fill({ color: 0xffffff, alpha: 0.5 }).circle(px + 3.5, py - 5, 1.8).fill({ color: 0xffffff, alpha: 0.5 });
        }
        this.gatera.addChild(t);
        this.gateraTear = t;
      }
    }
  }
  /**
   * H66's door: a single orange hair lifts from the cold dent, rides the wind and slips into the cat flap, which
   * swings shut (04 §1). Resolves when it's in. Fast and calm with reduced motion.
   */
  hairToGatera(): Promise<void> {
    this.leaving = true;
    this.setCalling(false);
    this.setGatera(true, this.torn);
    if (this.destroyed || !this.gatera) return Promise.resolve();
    const hair = new Graphics();
    hair.moveTo(-9, 0).bezierCurveTo(-5, -6, 2, 6, 9, -2).stroke({ width: 3, color: 0xe8742a, cap: 'round' });
    hair.position.set(-8, -10);
    this.addChild(hair);
    const g = FaroPage.GATERA_AT;
    const fast = settings.reduceMotion;
    return new Promise<void>((res) => {
      const tl = gsap.timeline({
        onComplete: () => {
          if (!hair.destroyed) hair.destroy();
          res();
        },
      });
      if (fast) {
        tl.to(hair, { x: g.x, y: g.y - 14, alpha: 0, duration: 0.5 });
      } else {
        tl.to(hair, { y: -70, x: 10, rotation: 0.8, duration: 1.1, ease: 'sine.out' })
          .to(hair, { y: -110, x: -30, rotation: -0.6, duration: 0.9, ease: 'sine.inOut' })
          .to(hair, { y: g.y - 30, x: g.x + 30, rotation: 0.4, duration: 0.9, ease: 'sine.inOut' })
          .to(hair, { y: g.y - 14, x: g.x, rotation: 0, duration: 0.45, ease: 'power2.in' })
          .to(hair.scale, { x: 0.4, y: 0.4, duration: 0.45, ease: 'power2.in' }, '<')
          .to(hair, { alpha: 0, duration: 0.12 });
        if (this.gateraFlap) tl.to(this.gateraFlap, { rotation: -0.9, duration: 0.14, ease: 'power2.out' }, '-=0.1').to(this.gateraFlap, { rotation: 0, duration: 0.7, ease: 'elastic.out(1, 0.35)' });
      }
      this.tweens.push(tl as unknown as gsap.core.Tween);
    });
  }

  private onTick(dt: number) {
    if (this.destroyed) return;
    this.t += dt;
    if ((this.warm || this.cooling) && !settings.reduceMotion) {
      this.steam.forEach((w, i) => {
        w.y = -14 - ((this.t * 9 + i * 11) % 18);
        w.scale.set(1 + Math.sin(this.t * 1.7 + i) * 0.12, 1);
        w.x = -22 + i * 18 + Math.sin(this.t * 1.3 + i * 2) * 3;
      });
    }
    if (this.mode === 'waiting' && !settings.reduceMotion && !this.tweens.some((t) => t.isActive())) {
      // it breathes
      this.sheet.y = -this.hover + Math.sin(this.t * 1.3) * 6;
      this.sheet.scale.set(1 + Math.sin(this.t * 0.9) * 0.025, 1 - Math.sin(this.t * 0.9) * 0.03);
      this.glow.alpha = 0.75 + Math.sin(this.t * 1.3) * 0.25;
    }
    if (this.call && !settings.reduceMotion) {
      // the ring breathes out, the hair sways like it's still warm from him, the name bobs
      const k = (this.t * 0.8) % 1;
      this.callRing!.scale.set(0.92 + k * 0.22);
      this.callRing!.alpha = 1 - k * 0.85;
      this.callHair!.rotation = Math.sin(this.t * 2.4) * 0.22;
      this.callTag!.y = Math.sin(this.t * 2) * 6;
    }
    if (this.zzz.length && !settings.reduceMotion) {
      for (const z of this.zzz) {
        z.y -= dt * 14;
        z.alpha -= dt * 0.3;
        if (z.alpha <= 0) {
          z.alpha = 1;
          z.y = -110;
        }
      }
    }
  }

  override destroy(o?: Parameters<Container['destroy']>[0]) {
    Ticker.shared.remove(this.tick);
    for (const t of this.tweens) t.kill();
    this.tweens = [];
    this.wakeCanelo();
    super.destroy(o ?? { children: true });
  }
}

// ------------------------------------------------------------------ Parte III hooks (ui/story/gaterasCines.ts, B)
let p3Tap: ((p: FaroPage) => boolean) | null = null;
/** Parte III claims a tap on the page first (H66: the prologue's door). Return true when it took the tap. */
export function setPaginaP3Tap(fn: ((p: FaroPage) => boolean) | null) {
  p3Tap = fn;
}
let gateraTap: (() => boolean) | null = null;
/** the cat flap at the faro's base was tapped (B: once the Borracha is open, it leads to the Carta). True = handled. */
export function setGateraTap(fn: (() => boolean) | null) {
  gateraTap = fn;
}

let page: FaroPage | null = null;
/** the page on the island now (mounted by syncFaroPage; null elsewhere) */
export function faroPage(): FaroPage | null {
  return page && !page.destroyed && page.parent && !page.parent.destroyed ? page : null;
}

/**
 * Keep the prop in step with the save (oleada4Flow calls it twice a second). `force` mounts it even while the save
 * still says hidden (the arrival cine drops it from the sky before it persists the beat).
 */
export function syncFaroPage(o: { force?: PageMode; onTap?: () => void } = {}): FaroPage | null {
  const p = syncFaroPageInner(o);
  // Parte III: the warm mark's steam, the flap at the faro's base and the donut on Canelo's palm follow the save too
  if (p) {
    p.setWarm(p.mode === 'rest' && paginaTibia(G.s));
    p.setGatera(gateraVisible(), despertoRegistro(G.s));
    p.setCalling(p.mode === 'rest' && !p.leaving && paginaLlama(G.s));
  }
  syncDona();
  return p;
}
/** the flap exists from H66 on (Canelo left through it) */
function gateraVisible(): boolean {
  const s = G.s;
  if (!s?.missions) return false;
  return [...s.missions.active, ...s.missions.done].some((id) => /^H\d+$/.test(id) && Number(id.slice(1)) >= 66);
}
function syncFaroPageInner(o: { force?: PageMode; onTap?: () => void }): FaroPage | null {
  const mode = o.force ?? pageModeFor(G.s);
  const layer = gradedLayer();
  const cur = faroPage();
  if (mode === 'hidden' || !layer) {
    if (cur && (mode === 'hidden' || cur.parent !== layer)) cur.destroy();
    if (!cur || mode === 'hidden') page = null;
    return null;
  }
  if (cur && cur.parent === layer) {
    if (!o.force) cur.setMode(mode);
    if (o.onTap) cur.onTap = o.onTap;
    return cur;
  }
  const spot = pageSpot();
  if (!spot) return null;
  cur?.destroy();
  const p = new FaroPage();
  p.position.set(spot.x, spot.y);
  layer.addChild(p);
  if (!o.force) p.setMode(mode);
  if (o.onTap) p.onTap = o.onTap;
  page = p;
  return p;
}

// ------------------------------------------------------------------ Parte III: the donut on Canelo's palm (D7)
/** the raft (Balsa Bigotuda) carries Canelo's little palm in a pot: its crown, raft-local */
const PALM_TOP = { x: -26, y: -50 };
let dona: Container | null = null;
/** the raft container of the island on screen (duck-typed: IslandScene keeps it as `boat`) */
function raft(): Container | null {
  const sc = scenes.current as (Container & { boat?: Container }) | null;
  if (!sc || sc.destroyed || sceneKind(sc) !== 'island') return null;
  const b = sc.boat;
  return b && !b.destroyed ? b : null;
}
/** a little donut, the size of the palm's crown */
export function donaArt(r = 14): Graphics {
  const g = new Graphics();
  g.circle(0, 0, r).fill(0xd9a05b).stroke({ width: 3, color: C.ink });
  g.circle(0, -1, r * 0.78).fill(0xff8fb1);
  for (const [dx, dy, c] of [
    [-5, -5, 0x7fd8ff],
    [4, -6, 0xffd400],
    [6, 2, 0xa7e8d7],
    [-6, 3, 0xffffff],
  ] as const)
    g.rect(dx - 1.5, dy - 0.8, 3, 1.6).fill(c);
  g.circle(0, 0, r * 0.32).fill(0x2c2420).stroke({ width: 2, color: C.ink });
  return g;
}
/** after the awakening and until H73, a donut stays stuck on the palm (03 P2 «cambio visible») */
export function donaVisible(): boolean {
  return despertoRegistro(G.s) && !G.s.missions.done.includes('H73');
}
export function syncDona(force?: boolean) {
  const want = force ?? donaVisible();
  const b = want ? raft() : null;
  if (!b) {
    if (dona && !dona.destroyed && (!want || dona.parent !== b)) dona.destroy();
    if (!want || !b) dona = null;
    return null;
  }
  if (dona && !dona.destroyed && dona.parent === b) return dona;
  const d = new Container();
  d.label = 'p3Dona';
  d.addChild(donaArt());
  d.position.set(PALM_TOP.x, PALM_TOP.y);
  d.rotation = 0.35;
  b.addChild(d);
  dona = d;
  return d;
}
/** where the donut lands, in island-world coordinates (cine target 'palmera') */
export function palmTop(): { x: number; y: number } | null {
  const b = raft();
  if (!b?.parent) return null;
  const sx = Math.sign(b.scale.x) || 1;
  return { x: b.x + PALM_TOP.x * sx, y: b.y + PALM_TOP.y };
}

// cine targets on the island (island/night/stage.ts): the page, the cat flap and Canelo's palm
registerIslandTarget('pagina', () => {
  const p = faroPage();
  return p ? { x: p.x, y: p.y - 20 } : (() => {
    const s = pageSpot();
    return s ? { x: s.x, y: s.y - 20 } : null;
  })();
});
registerIslandTarget('gatera', () => {
  const p = faroPage();
  const s = p ? { x: p.x, y: p.y } : pageSpot();
  return s ? { x: s.x + FaroPage.GATERA_AT.x, y: s.y + FaroPage.GATERA_AT.y - 20 } : null;
});
registerIslandTarget('palmera', () => palmTop());
