/**
 * ACTORS — the owner-approved MAI cats, rendered through the Momentos treatment.
 *
 * The Studio loads each painting at full detail (lite on the low tier), BAKES the cel treatment once (shaders.ts
 * bakeCel: cel-over-paint shadows, colored lineart, outline, rim, screentone) and hands out CatPuppets that wear the
 * baked texture: the same rig, the same acting, zero per-frame cost. A white silhouette is baked too (smears, ghosts,
 * impact silhouettes: tint it).
 *
 * Actor = a Container around one puppet that animates ON TWOS: its transform only changes on 12 fps steps of momento
 * time (set via `pose(m, …)`), while FX around it run smooth — the Arc System Works / Spider-Verse rhythm.
 */
import { Assets, Container, Sprite, Texture, type Renderer } from 'pixi.js';
import { CatPuppet } from '../../art/livingCat';
import { artSlug, loadCatTexture, onCatArt, onCatArtFailed, requestCatSvg, standInTint } from '../../art/catArt';
import { LUZTERNA_URL } from '../../ui/story/portrait';
import { bakeCel, type CelOpts } from './shaders';

interface Baked {
  tex: Texture;
  sil: Texture;
  slug: string;
  tint?: number;
}

async function paintingOf(raw: string, detail: boolean): Promise<{ tex: Texture; slug: string; tint?: number }> {
  if (raw === 'luzterna') {
    const t = (await Assets.load({ alias: LUZTERNA_URL, src: LUZTERNA_URL, data: { resolution: 1.5 } }).catch(() => null)) as Texture | null;
    if (t) return { tex: t, slug: 'luzterna' };
    raw = 'lantern_spirit_cat';
  }
  const slug = artSlug(raw);
  const tint = standInTint(raw);
  const lite = await loadCatTexture(slug);
  if (!detail) return { tex: lite, slug, tint };
  requestCatSvg(slug);
  const full = await new Promise<Texture>((res) => {
    let done = false;
    // onCatArt may call back synchronously (already loaded): `off` is not assigned yet then
    let off: (() => void) | null = null;
    let offFail: (() => void) | null = null;
    off = onCatArt(slug, (t) => {
      if (done) return;
      done = true;
      queueMicrotask(() => (off?.(), offFail?.()));
      res(t);
    });
    if (done) off();
    // the full vector can't load (not on the art host yet, offline): keep the lite one now, not after the 7 s wait
    if (!done)
      offFail = onCatArtFailed(slug, () => {
        if (done) return;
        done = true;
        queueMicrotask(() => (off?.(), offFail?.()));
        res(lite);
      });
    setTimeout(() => {
      if (done) return;
      done = true;
      off?.();
      offFail?.();
      res(lite);
    }, 7000);
  });
  return { tex: full, slug, tint };
}

export class Studio {
  private baked = new Map<string, Baked>();
  private pending = new Map<string, Promise<Baked | null>>();
  constructor(
    private renderer: Renderer,
    private detail: boolean,
    private cel: CelOpts = {},
    /**
     * (optional) a Momento's OWN treatment instead of the cel bake (WHEN I LOSE: the illuminated-miniature bake). It
     * must return NEW textures (never the painting itself: the Studio destroys what it gets on dispose).
     */
    private bake?: (renderer: Renderer, src: Texture, slug?: string) => { tex: Texture; sil: Texture },
  ) {}

  /** load + bake (idempotent) */
  load(raw: string): Promise<Baked | null> {
    const have = this.baked.get(raw);
    if (have) return Promise.resolve(have);
    let p = this.pending.get(raw);
    if (!p) {
      p = paintingOf(raw, this.detail)
        .then(({ tex, slug, tint }) => {
          if (tex === Texture.WHITE || tex === Texture.EMPTY) return null;
          const b = this.bake ? this.bake(this.renderer, tex, slug) : bakeCel(this.renderer, tex, this.cel);
          const out: Baked = { tex: b.tex, sil: b.sil, slug, tint };
          this.baked.set(raw, out);
          return out;
        })
        .catch((e) => {
          console.warn('[momento] actor', raw, e);
          return null;
        });
      this.pending.set(raw, p);
    }
    return p;
  }
  loadAll(list: string[]) {
    return Promise.all([...new Set(list)].map((s) => this.load(s)));
  }
  has(raw: string) {
    return this.baked.has(raw);
  }
  /** a living puppet wearing the baked painting (anchor bottom-centre by default) */
  puppet(raw: string, o: { anchorX?: number; anchorY?: number; fps?: number } = {}): CatPuppet | null {
    const b = this.baked.get(raw);
    if (!b) return null;
    const p = new CatPuppet(b.tex, b.slug, { anchorX: o.anchorX ?? 0.5, anchorY: o.anchorY ?? 0.97, fps: o.fps ?? 12, acts: 'none' });
    if (b.tint !== undefined) p.tint = b.tint;
    return p;
  }
  /** the white silhouette (tint it) as a sprite with the same anchor */
  silhouette(raw: string, anchorX = 0.5, anchorY = 0.97): Sprite | null {
    const b = this.baked.get(raw);
    if (!b) return null;
    const s = new Sprite(b.sil);
    s.anchor.set(anchorX, anchorY);
    return s;
  }
  /** a static sprite of the baked painting (cheap: crowds, far shots) */
  still(raw: string, anchorX = 0.5, anchorY = 0.97): Sprite | null {
    const b = this.baked.get(raw);
    if (!b) return null;
    const s = new Sprite(b.tex);
    s.anchor.set(anchorX, anchorY);
    if (b.tint !== undefined) s.tint = b.tint;
    return s;
  }
  /** painting size (logical px) */
  size(raw: string): [number, number] {
    const b = this.baked.get(raw);
    return b ? [b.tex.width, b.tex.height] : [700, 700];
  }
  dispose() {
    for (const b of this.baked.values()) {
      b.tex.destroy(true);
      b.sil.destroy(true);
    }
    this.baked.clear();
    this.pending.clear();
  }
}

/**
 * One cat on the set. `size` = on-screen height of the painting (world px). Transform updates are STEPPED (on twos)
 * unless `smooth` — call pose() every frame with the momento time.
 */
export class Actor extends Container {
  readonly puppet: CatPuppet | null;
  private lastStep = -1;
  smooth = false;
  fps = 12;
  constructor(
    studio: Studio,
    readonly who: string,
    public size: number,
  ) {
    super();
    this.puppet = studio.puppet(who);
    if (this.puppet) {
      const [, h] = studio.size(who);
      this.puppet.scale.set(size / h);
      this.addChild(this.puppet);
    }
  }
  /** set the pose for momento time m: only applied on a new step (on twos) */
  /**
   * `step` (optional) = the stepping key: pass one that changes ON the beat (k.beatStep(m)) so a pose driven by the
   * music snaps exactly on the kick instead of on the next 12 fps tick (up to 83 ms late).
   */
  pose(m: number, x: number, y: number, o: { rot?: number; sx?: number; sy?: number; flip?: boolean; alpha?: number; step?: number } = {}) {
    const st = this.smooth ? m : (o.step ?? Math.floor(m * this.fps));
    if (!this.smooth && st === this.lastStep) return false;
    this.lastStep = st;
    this.position.set(x, y);
    this.rotation = o.rot ?? 0;
    this.scale.set((o.flip ? -1 : 1) * (o.sx ?? 1), o.sy ?? 1);
    if (o.alpha !== undefined) this.alpha = o.alpha;
    return true;
  }
  emote(kind: Parameters<CatPuppet['emote']>[0], s = 1) {
    this.puppet?.emote(kind, s);
  }
  /** head centre in this actor's local space (for face framing) */
  head(): [number, number] {
    const h = this.puppet?.brain.headLocal();
    const sc = this.puppet ? this.puppet.scale.x : 1;
    return h ? [h[0] * sc, h[1] * sc] : [0, -this.size * 0.7];
  }
}
