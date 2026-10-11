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
 */
import { Container, Graphics, Text, Ticker } from 'pixi.js';
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
    this.addChild(this.glow, this.sheet);
    this.sheet.eventMode = 'static';
    this.sheet.cursor = 'pointer';
    this.sheet.on('pointertap', () => this.tapped());
    Ticker.shared.add(this.tick);
  }

  private tapped() {
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

  private onTick(dt: number) {
    if (this.destroyed) return;
    this.t += dt;
    if (this.mode === 'waiting' && !settings.reduceMotion && !this.tweens.some((t) => t.isActive())) {
      // it breathes
      this.sheet.y = -this.hover + Math.sin(this.t * 1.3) * 6;
      this.sheet.scale.set(1 + Math.sin(this.t * 0.9) * 0.025, 1 - Math.sin(this.t * 0.9) * 0.03);
      this.glow.alpha = 0.75 + Math.sin(this.t * 1.3) * 0.25;
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
