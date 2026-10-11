/**
 * FASES on screen (rules in battle/fases.ts; pure view, it never writes the sim). Any battle with `rules.fases`:
 *
 *   - the LAYER backdrop of the current phase, under the waves: 'sea' (nothing: the usual noir ocean) · 'sky' (blue
 *     gradient + far clouds; the waves turn into a cloud deck) · 'astral' (deep space: stars, a nebula, a rift; the
 *     waves turn into a violet nebula floor; the gulls / clouds of the sea battle hide) · 'glitch' (astral + RGB
 *     scanlines and neon tags) — so the multi-layer boss really goes sea → sky → rift
 *   - the phase's BODIES (planetoids with their orbit ring, cloud banks, tumbling debris), read live from fasesState
 *   - the PHASE CHANGE (sim event boss 'fase'): a flash, the swap behind it, a slanted banner «CAPA n/N · NAME» with the
 *     phase's telegraph line — then emitFase() for the music layer (battle/music listens with onFase). The opening
 *     phase is emitted too (from = -1). Gentle with Reducir movimiento / Reducir destellos.
 *
 * BattleScene hooks: enter (new FasesFx), bossEvent 'fase' (stage), checkBossPhase (await the staging), destroy.
 */
import { Container, Graphics, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { C, F } from '../../ui/theme';
import { poster } from '../../ui/widgets';
import { iconText } from '../../ui/elementIcon';
import { settings } from '../../core/settings';
import { sfx } from '../../core/audio';
import type { Battle } from '../sim';
import type { Sea } from '../sea';
import { FASE_SELF_BANNER, emitFase, faseInterlude, fasesState } from '../fases';
import { PortalFx } from '../boss/lateRigs';
import type { Portals } from '../sim';

const BLEED = 900;
type Palette = { sea: number; seaDark: number };
const LAYER_SEA: Record<string, Palette | null> = {
  sea: null,
  sky: { sea: 0xf6f8ff, seaDark: 0xd6def2 },
  astral: { sea: 0x2a1f4a, seaDark: 0x15102a },
  glitch: { sea: 0x2a1238, seaDark: 0x12061c },
};
const LAYER_NAME: Record<string, string> = { sea: 'EL MAR', sky: 'EL CIELO', astral: 'EL VACÍO', glitch: 'GLITCH' };

export interface FasesHost {
  sim: Battle;
  sea: Sea;
  /** the battle world (bodies go right behind the ships) */
  world: Container;
  shipsLayer: Container;
  /** the bodies sit right above this layer (BattleScene's debris: over the generic well swirls, under the shot FX) */
  above?: Container;
  /** banners */
  overlay: Container;
  /** the sea battle's gulls and clouds (hidden in space) */
  skyLife?: Container | null;
  /** the story battle id (spec.meta.special), for the music layer */
  battleId: string | null;
}

/** a tiny deterministic hash rng for the star field (same sky every time) */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export class FasesFx {
  /** under the waves, over the sea's own sky gradient */
  private back = new Container();
  private sky = new Graphics();
  private stars = new Graphics();
  private glitch = new Graphics();
  /** behind the ships: planetoids, clouds, debris */
  private front = new Container();
  private bodies = new Graphics();
  private layer = 'sea';
  private orig: Palette;
  private t = 0;
  private acc = 0;
  private dead = false;
  private starPts: { x: number; y: number; r: number; tw: number }[] = [];
  private bodyX: number[] = [];

  constructor(private h: FasesHost) {
    this.orig = { sea: h.sea.palette.sea, seaDark: h.sea.palette.seaDark };
    this.back.addChild(this.sky, this.stars, this.glitch);
    h.sea.addChildAt(this.back, Math.min(1, h.sea.children.length));
    this.front.addChild(this.bodies);
    const anchor = h.above && h.above.parent === h.world ? h.world.getChildIndex(h.above) + 1 : h.world.getChildIndex(h.shipsLayer);
    h.world.addChildAt(this.front, anchor);
    const r = rng(7331);
    for (let i = 0; i < 170; i++) this.starPts.push({ x: -BLEED + r() * (W + BLEED * 2), y: -BLEED + r() * (h.sea.waterY + BLEED), r: 0.8 + r() * 2.2, tw: r() * 6 });
    const st = fasesState(h.sim);
    this.setLayer(st?.layer ?? 'sea');
    Ticker.shared.add(this.tick, this);
    // the opening phase, for the music layer (no banner: the intro card already says it)
    if (st) emitFase({ battle: h.battleId, index: st.idx, from: -1, id: st.phase.id, name: st.phase.name, layer: st.layer, count: st.count });
  }

  /** swap the backdrop + the waves' colors (instant; the stage() flash hides it) */
  private setLayer(layer: string) {
    this.layer = layer;
    const pal = LAYER_SEA[layer] ?? (layer === 'sea' ? null : LAYER_SEA.astral);
    this.h.sea.palette.sea = (pal ?? this.orig).sea;
    this.h.sea.palette.seaDark = (pal ?? this.orig).seaDark;
    const space = layer === 'astral' || layer === 'glitch';
    if (this.h.skyLife) this.h.skyLife.visible = !space;
    const g = this.sky;
    g.clear();
    const wy = this.h.sea.waterY + 40;
    if (layer === 'sky') {
      const bands = [0x5e95f2, 0x78a8f5, 0x96bcf8, 0xb6d1fb, 0xd9e9ff];
      bands.forEach((c, i) => g.rect(-BLEED, -BLEED + ((wy + BLEED) / bands.length) * i, W + BLEED * 2, (wy + BLEED) / bands.length + 2).fill(c));
      // far cloud banks
      for (let i = 0; i < 9; i++) g.ellipse(-120 + i * 260, wy - 120 - (i % 3) * 40, 170, 46).fill({ color: 0xffffff, alpha: 0.55 });
    } else if (space) {
      const bands = layer === 'glitch' ? [0x0b0414, 0x170828, 0x22103a, 0x2c1446] : [0x05071a, 0x0b0f2c, 0x15153e, 0x1d1440];
      bands.forEach((c, i) => g.rect(-BLEED, -BLEED + ((wy + BLEED) / bands.length) * i, W + BLEED * 2, (wy + BLEED) / bands.length + 2).fill(c));
      // a nebula smear and the astral rift (the crack in the page)
      g.ellipse(W * 0.3, wy * 0.35, 520, 140).fill({ color: 0x8a5cff, alpha: 0.12 });
      g.ellipse(W * 0.72, wy * 0.22, 420, 110).fill({ color: 0xff7ab8, alpha: 0.08 });
      const rx = W * 0.5;
      const pts = [rx - 40, -60, rx + 22, 70, rx - 12, 160, rx + 30, 260, rx, 340];
      g.poly(pts, false).stroke({ width: 16, color: 0xc77dff, alpha: 0.18 });
      g.poly(pts, false).stroke({ width: 5, color: 0xf2e6ff, alpha: 0.75 });
      // a far comet
      g.moveTo(W * 0.12, 120).lineTo(W * 0.24, 70).stroke({ width: 4, color: 0x9fe8ff, alpha: 0.45 });
      g.circle(W * 0.24, 70, 6).fill({ color: 0xe9f0ff, alpha: 0.9 });
    }
    this.back.visible = layer !== 'sea';
    this.drawStars();
  }

  private drawStars() {
    const g = this.stars;
    g.clear();
    this.glitch.clear();
    if (this.layer !== 'astral' && this.layer !== 'glitch') return;
    for (const s of this.starPts) {
      const a = 0.45 + 0.55 * Math.abs(Math.sin(this.t * 0.9 + s.tw));
      g.circle(s.x, s.y, s.r).fill({ color: 0xe9f0ff, alpha: settings.reduceMotion ? 0.8 : a });
    }
    if (this.layer === 'glitch') {
      const gg = this.glitch;
      const wy = this.h.sea.waterY;
      for (let y = -BLEED; y < wy; y += 9) gg.rect(-BLEED, y, W + BLEED * 2, 2).fill({ color: 0xff2e88, alpha: 0.05 });
      // RGB tear bands that jump every few frames
      const k = Math.floor(this.t * 3);
      const r = rng(k + 1);
      for (let i = 0; i < 3; i++) {
        const y = r() * wy;
        gg.rect(-BLEED, y, W + BLEED * 2, 4 + r() * 10).fill({ color: i % 2 ? 0x00e5ff : 0xff2e88, alpha: settings.reduceFlashes ? 0.05 : 0.14 });
      }
    }
  }

  private drawBodies() {
    const g = this.bodies;
    g.clear();
    const st = fasesState(this.h.sim);
    if (!st) return;
    st.bodies.forEach((b, i) => {
      if (!b.alive) return;
      // ease toward the live x (the planetoid is towed / drifts by turn)
      const x = (this.bodyX[i] = this.bodyX[i] === undefined ? b.x : this.bodyX[i] + (b.x - this.bodyX[i]) * 0.12);
      const y = b.y + (settings.reduceMotion ? 0 : Math.sin(this.t * 1.4 + i) * 4);
      const hurt = b.maxHp > 0 ? 1 - Math.max(0, b.hp) / b.maxHp : 0;
      if (b.look === 'cloud') {
        for (const [dx, dy, r] of [
          [-0.6, 0.15, 0.55],
          [0, -0.1, 0.75],
          [0.6, 0.12, 0.55],
          [-0.25, 0.3, 0.5],
          [0.3, 0.3, 0.5],
        ])
          g.circle(x + dx * b.r, y + dy * b.r, r * b.r).fill({ color: 0xffffff, alpha: 0.92 - hurt * 0.4 });
        g.ellipse(x, y + b.r * 0.55, b.r * 1.05, b.r * 0.22).fill({ color: 0xc9d6f2, alpha: 0.7 });
        return;
      }
      if (b.well) {
        // the orbit ring shows the well's reach (dashed, slowly turning)
        const n = 28;
        for (let k = 0; k < n; k += 2) {
          const a0 = (k / n) * Math.PI * 2 + this.t * 0.25;
          // start each dash at its own point (an arc with no current point would draw a line from the origin)
          g.moveTo(x + Math.cos(a0) * b.well, y + Math.sin(a0) * b.well);
          g.arc(x, y, b.well, a0, a0 + Math.PI / n).stroke({ width: 2, color: 0xf0b44c, alpha: 0.35 });
        }
      }
      if (b.look === 'debris') {
        const rot = this.t * 0.6 + i;
        const pts: number[] = [];
        for (let k = 0; k < 7; k++) {
          const a = rot + (k / 7) * Math.PI * 2;
          const rr = b.r * (0.75 + ((k * 37) % 5) * 0.07);
          pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
        }
        g.poly(pts).fill(0x6d6a80).stroke({ width: 4, color: C.ink });
        if (hurt > 0.3) g.moveTo(x - b.r * 0.4, y - b.r * 0.2).lineTo(x + b.r * 0.1, y + b.r * 0.3).stroke({ width: 3, color: C.ink });
        return;
      }
      // planet (default) / comet
      g.circle(x, y, b.r + 8).fill({ color: 0x8a5cff, alpha: 0.15 });
      g.circle(x, y, b.r).fill(b.look === 'comet' ? 0xcfe9ff : 0x8a7a9e).stroke({ width: 5, color: C.ink });
      g.circle(x - b.r * 0.3, y - b.r * 0.25, b.r * 0.22).fill({ color: C.ink, alpha: 0.25 });
      g.circle(x + b.r * 0.35, y + b.r * 0.2, b.r * 0.15).fill({ color: C.ink, alpha: 0.22 });
      g.circle(x + b.r * 0.05, y + b.r * 0.45, b.r * 0.1).fill({ color: C.ink, alpha: 0.2 });
      g.moveTo(x + Math.cos(-2.6) * (b.r - 6), y + Math.sin(-2.6) * (b.r - 6));
      g.arc(x, y, b.r - 6, -2.6, -1.4).stroke({ width: 4, color: 0xffffff, alpha: 0.45 });
      // a little planetary ring
      g.ellipse(x, y, b.r * 1.55, b.r * 0.32).stroke({ width: 4, color: 0xf0b44c, alpha: 0.8 });
      if (hurt > 0.3) g.moveTo(x - b.r * 0.5, y - b.r * 0.1).lineTo(x + b.r * 0.2, y + b.r * 0.4).stroke({ width: 3, color: C.ink });
    });
  }

  private tick(t: Ticker) {
    if (this.dead) return;
    this.acc += t.deltaMS / 1000;
    if (this.acc < 1 / 12) return; // on twos
    this.t += this.acc;
    this.acc = 0;
    if (this.layer === 'astral' || this.layer === 'glitch') this.drawStars();
    this.drawBodies();
  }

  /**
   * The sim entered phase `n` (event boss 'fase'): flash → swap the layer → banner + telegraph → emitFase.
   * Resolves when the staging is over (BattleScene waits for it before the next turn).
   */
  async stage(n: number, from: number): Promise<void> {
    const st = fasesState(this.h.sim);
    if (!st || this.dead) return;
    const ph = st.phase;
    const rm = settings.reduceMotion;
    const soft = settings.reduceFlashes;
    sfx('whoosh', 0.7);
    const fl = new Graphics().rect(-BLEED, -BLEED, W + BLEED * 2, H + BLEED * 2).fill(st.layer === 'astral' || st.layer === 'glitch' ? 0xe9e0ff : 0xffffff);
    fl.alpha = 0;
    this.h.overlay.addChild(fl);
    await new Promise<void>((res) => gsap.to(fl, { alpha: soft ? 0.35 : 0.95, duration: rm ? 0.15 : 0.28, onComplete: () => res() }));
    if (this.dead) return;
    this.bodyX = [];
    this.setLayer(st.layer);
    this.drawBodies();
    gsap.to(fl, { alpha: 0, duration: rm ? 0.2 : 0.5, onComplete: () => fl.destroy() });
    const change = { battle: this.h.battleId, index: n, from, id: ph.id, name: ph.name, layer: st.layer, count: st.count };
    emitFase(change);
    // a scene that plays inside this phase change (fases.ts registerFaseInterlude): the battle waits for it.
    // MOMENTO: circus_malus (H62, phase change) — umbral_correctores › el_plan (state/sys/rupturasO4Battles.ts H62_MOMENTO)
    const interlude = faseInterlude(this.h.battleId, ph.id);
    if (interlude) {
      try {
        await interlude(change);
      } catch (e) {
        console.warn('[fases] interlude', e);
      }
      if (this.dead) return;
    }
    // phases whose own rules stage a banner (FASE_SELF_BANNER) don't get a second one
    if (ph.banner === false || (ph.effects ?? []).some((k) => FASE_SELF_BANNER.has(k))) return;
    sfx('sting');
    const band = new Container();
    const g = new Graphics().rect(-300, -70, W + 600, 140).fill(C.ink).stroke({ width: 6, color: 0xc9a8ff });
    g.rotation = -0.04;
    const k = poster(`CAPA ${n + 1}/${st.count} · ${LAYER_NAME[st.layer] ?? ''}`.replace(/ · $/, ''), 32, 0xc9a8ff, { stroke: { color: C.ink, width: 6 } });
    k.anchor.set(0.5);
    k.position.set(W / 2, -90);
    const t = poster(ph.name.toUpperCase(), 84, C.paper, { stroke: { color: C.ink, width: 10 } });
    t.anchor.set(0.5);
    t.position.set(W / 2, 0);
    t.rotation = -0.04;
    if (t.width > W - 120) t.scale.set((W - 120) / t.width);
    band.addChild(g, k, t);
    if (ph.telegraph) {
      const body = iconText(ph.telegraph, { fontFamily: F.ui, fontWeight: '700', fontSize: 28, fill: C.paper }, { wrap: 1100 });
      const bw = body.width + 48;
      const card = new Container();
      card.addChild(new Graphics().roundRect(-bw / 2, 0, bw, body.height + 24, 14).fill({ color: C.ink, alpha: 0.9 }), body);
      body.position.set(-body.width / 2, 12);
      card.position.set(W / 2, 92);
      band.addChild(card);
    }
    band.position.set(0, H / 2 - 170);
    this.h.overlay.addChild(band);
    if (!rm) gsap.from(g.scale, { x: 0, duration: 0.22, ease: 'power3.out' });
    await new Promise<void>((res) => window.setTimeout(res, rm ? 1200 : 1700));
    if (band.destroyed) return;
    await new Promise<void>((res) => gsap.to(band, { alpha: 0, duration: 0.3, onComplete: () => res() }));
    band.destroy({ children: true });
  }

  destroy() {
    if (this.dead) return;
    this.dead = true;
    Ticker.shared.remove(this.tick, this);
    if (!this.back.destroyed) this.back.destroy({ children: true });
    if (!this.front.destroyed) this.front.destroy({ children: true });
  }
}

/** the rifts of a phase (env.portals): the portal rings and flashes, tagged «GRIETA» — a rift belongs to nobody */
export class RiftFx extends PortalFx {
  override set(now: Portals | null, next: Portals | null) {
    super.set(now, next);
    const tags = (this as unknown as { tags?: Container }).tags;
    if (!tags) return;
    for (const t of tags.children) {
      const tx = t as unknown as { text?: string; style?: { fill?: unknown } };
      if (typeof tx.text === 'string') {
        tx.text = 'GRIETA';
        if (tx.style) tx.style.fill = 0xff7ab8;
      }
    }
  }
}
