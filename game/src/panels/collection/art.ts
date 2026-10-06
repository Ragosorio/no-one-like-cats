/**
 * Collection art helpers: preload all cat paintings, build the tinted "variant" sprite
 * (ColorMatrix + overlay + code-drawn decal masked to the painting), and bake small
 * portrait textures (color / ink silhouette) so grids don't run filters every frame.
 */
import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { game } from '../../core/App';
import { catTexture, livingCat, loadCatTexture, preloadCats } from '../../art/catArt';
import type { CatView } from '../../art/livingCat';
import { overlayTint, tintFilter, slugOf } from '../../art/tint';
import { CATS, CAT_BY_ID, TintSpec } from '../../data/content';
import { SilhouetteFilter } from '../../fx/filters';
import { glowTexture } from '../../art/textures';
import { ensureFonts } from './fonts';
import { mutationLook } from '../../state/ext/collection';

let artPromise: Promise<void> | null = null;
/** load every painting once (32 webp) */
export function ensureCatArt(): Promise<void> {
  if (!artPromise) {
    const slugs = [...new Set(CATS.map((c) => c.art.slug))];
    const art = preloadCats(slugs).catch(async () => {
      // one bad file shouldn't block the rest
      await Promise.all(slugs.map((s) => loadCatTexture(s).catch(() => undefined)));
    });
    artPromise = Promise.all([art, ensureFonts()]).then(() => undefined);
  }
  return artPromise;
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draw a decal (brasas, estrellas, burbujas…) in the painting's 700px local space. */
export function drawDecal(g: Graphics, decal: string, seed: string) {
  const r = rng(hash(seed + decal));
  const pt = (yMin = -260, yMax = 300) => [(r() - 0.5) * 460, yMin + r() * (yMax - yMin)] as const;
  switch (decal) {
    case 'brasas':
      for (let i = 0; i < 26; i++) {
        const [x, y] = pt(-120, 320);
        const s = 5 + r() * 9;
        g.circle(x, y, s).fill({ color: r() < 0.5 ? 0xff6a1a : 0xffc94a, alpha: 0.85 });
        g.circle(x, y, s * 0.45).fill({ color: 0xfff3b0, alpha: 0.9 });
      }
      break;
    case 'grietas_lava':
      for (let i = 0; i < 9; i++) {
        let [x, y] = pt(-200, 300);
        g.moveTo(x, y);
        for (let k = 0; k < 5; k++) {
          x += (r() - 0.5) * 70;
          y += 14 + r() * 28;
          g.lineTo(x, y);
        }
      }
      g.stroke({ width: 10, color: 0xff6a1a, alpha: 0.9, join: 'round', cap: 'round' });
      break;
    case 'musgo':
      for (let i = 0; i < 16; i++) {
        const [x, y] = pt(-240, 120);
        const s = 18 + r() * 26;
        g.circle(x, y, s).fill({ color: r() < 0.5 ? 0x5fbf4a : 0x3f8f3a, alpha: 0.6 });
      }
      break;
    case 'estrellas':
      for (let i = 0; i < 18; i++) {
        const [x, y] = pt(-280, 300);
        const s = 8 + r() * 14;
        g.star(x, y, 4, s, s * 0.32, r()).fill({ color: r() < 0.5 ? 0xffffff : 0x9ff7ff, alpha: 0.9 });
      }
      break;
    case 'runas':
      for (let i = 0; i < 9; i++) {
        const [x, y] = pt(-200, 280);
        const s = 18 + r() * 10;
        g.moveTo(x - s, y + s).lineTo(x, y - s).lineTo(x + s, y + s).moveTo(x - s * 0.6, y).lineTo(x + s * 0.6, y);
      }
      g.stroke({ width: 6, color: 0xff7ab8, alpha: 0.85, cap: 'round' });
      break;
    case 'lodo':
      for (let i = 0; i < 14; i++) {
        const [x, y] = pt(150, 330);
        const s = 14 + r() * 22;
        g.ellipse(x, y, s, s * 0.7).fill({ color: 0x6b4a2a, alpha: 0.7 });
        g.rect(x - 4, y, 8, 20 + r() * 40).fill({ color: 0x6b4a2a, alpha: 0.6 });
      }
      break;
    case 'raices':
      for (let i = 0; i < 8; i++) {
        let [x, y] = pt(80, 320);
        g.moveTo(x, y);
        for (let k = 0; k < 4; k++) {
          x += (r() - 0.5) * 80;
          y -= 20 + r() * 40;
          g.lineTo(x, y);
        }
      }
      g.stroke({ width: 8, color: 0x7a5230, alpha: 0.75, join: 'round', cap: 'round' });
      break;
    case 'vapor':
      for (let i = 0; i < 12; i++) {
        const [x, y] = pt(-280, 200);
        g.circle(x, y, 26 + r() * 30).fill({ color: 0xffffff, alpha: 0.28 });
      }
      break;
    case 'plasma':
      for (let i = 0; i < 7; i++) {
        const [x, y] = pt(-200, 260);
        const s = 30 + r() * 40;
        g.arc(x, y, s, r() * 6, r() * 6 + 2.4).stroke({ width: 7, color: r() < 0.5 ? 0xff2e88 : 0x00e5ff, alpha: 0.85, cap: 'round' });
      }
      break;
    case 'rayos':
      for (let i = 0; i < 7; i++) {
        let [x, y] = pt(-220, 220);
        g.moveTo(x, y);
        for (let k = 0; k < 4; k++) {
          x += k % 2 ? -22 : 26;
          y += 24 + r() * 12;
          g.lineTo(x, y);
        }
      }
      g.stroke({ width: 8, color: 0xffe14a, alpha: 0.95, join: 'miter', cap: 'round' });
      break;
    case 'lunas':
      for (let i = 0; i < 9; i++) {
        const [x, y] = pt(-260, 260);
        const s = 12 + r() * 12;
        g.circle(x, y, s).fill({ color: 0xdbe8ff, alpha: 0.9 });
        g.circle(x + s * 0.45, y - s * 0.2, s * 0.9).fill({ color: 0x1f2b4a, alpha: 0.55 });
      }
      break;
    case 'burbujas':
      for (let i = 0; i < 16; i++) {
        const [x, y] = pt(-260, 300);
        const s = 10 + r() * 22;
        g.circle(x, y, s).stroke({ width: 4, color: 0xffffff, alpha: 0.85 });
        g.circle(x - s * 0.35, y - s * 0.35, s * 0.2).fill({ color: 0xffffff, alpha: 0.9 });
      }
      break;
    // ---- mutation decals
    case 'escarcha': {
      const flakes: [number, number, number, number][] = [];
      for (let i = 0; i < 14; i++) {
        const [x, y] = pt(-280, 300);
        flakes.push([x, y, 16 + r() * 22, r() * 0.3]);
      }
      const draw = () => {
        for (const [x, y, s, rot] of flakes)
          for (let k = 0; k < 3; k++) {
            const a = (k / 3) * Math.PI + rot;
            g.moveTo(x - Math.cos(a) * s, y - Math.sin(a) * s).lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s);
          }
      };
      draw();
      g.stroke({ width: 11, color: 0x1f2b4a, alpha: 0.55, cap: 'round' });
      draw();
      g.stroke({ width: 6, color: 0xf2fdff, alpha: 1, cap: 'round' });
      for (let i = 0; i < 20; i++) {
        const [x, y] = pt(-280, 300);
        g.circle(x, y, 3 + r() * 5).fill({ color: 0xffffff, alpha: 0.8 });
      }
      break;
    }
    case 'grietas':
      for (let i = 0; i < 7; i++) {
        let [x, y] = pt(-240, 280);
        g.moveTo(x, y);
        for (let k = 0; k < 4; k++) {
          x += (r() - 0.5) * 60;
          y += 16 + r() * 26;
          g.lineTo(x, y);
          if (r() < 0.4) g.moveTo(x, y).lineTo(x + (r() - 0.5) * 40, y + 20).moveTo(x, y);
        }
      }
      g.stroke({ width: 7, color: 0x3a2a1c, alpha: 0.8, join: 'round', cap: 'round' });
      break;
    case 'doble_cola':
      for (const sx of [1, -1]) {
        g.moveTo(170 * sx, 260)
          .bezierCurveTo(300 * sx, 200, 330 * sx, 40, 250 * sx, -40)
          .stroke({ width: 26, color: 0xff2e88, alpha: 0.55, cap: 'round' });
      }
      break;
    case 'eco':
      for (let i = 0; i < 3; i++) g.circle(0, 40, 200 + i * 60).stroke({ width: 6, color: 0x00e5ff, alpha: 0.5 - i * 0.12 });
      break;
    case 'oro':
      for (let i = 0; i < 22; i++) {
        const [x, y] = pt(-280, 300);
        const s = 6 + r() * 12;
        g.star(x, y, 4, s, s * 0.3, r()).fill({ color: r() < 0.5 ? 0xfff4c8 : 0xffd77a, alpha: 0.95 });
      }
      break;
    default:
      break;
  }
}

export interface Variant {
  root: Container;
  sprite: CatView;
}

/**
 * The painting as this species looks (tint + overlay + decal). `size` = on-screen width of
 * the 700px painting. Anchored at its center.
 */
export function variantSprite(species: string, size: number, o: { decals?: boolean; slug?: string; tint?: TintSpec | null; mutation?: string | null; live?: boolean } = {}): Variant {
  const def = CAT_BY_ID.get(species);
  const slug = o.slug ?? slugOf(species);
  const t: TintSpec | null | undefined = o.tint !== undefined ? o.tint : def?.art.tint;
  const mut = mutationLook(o.mutation);
  const root = new Container();
  const inner = new Container();
  const tex = catTexture(slug);
  const k = (size / Math.max(1, tex.width || 700)) * (t?.scale ?? 1) * (mut?.scale ?? 1);
  inner.scale.set(k);
  // "corona" decal = solar corona glow behind the painting
  if (t?.decal === 'corona') {
    const halo = new Sprite(glowTexture());
    halo.anchor.set(0.5);
    halo.tint = 0xffd974;
    halo.scale.set(6.2);
    halo.alpha = 0.9;
    halo.y = -60;
    inner.addChild(halo);
    const ring = new Graphics().circle(0, -60, 300).stroke({ width: 10, color: 0xffd974, alpha: 0.8 });
    inner.addChild(ring);
  }
  // mutation: an outer glow ring + (for Doble Cola / Eco) art behind the painting
  if (mut && o.decals !== false) {
    const halo = new Sprite(glowTexture());
    halo.anchor.set(0.5);
    halo.tint = mut.color;
    halo.scale.set(5.2);
    halo.alpha = 0.45;
    inner.addChild(halo);
    if (mut.decal === 'doble_cola' || mut.decal === 'eco') {
      const back = new Graphics();
      drawDecal(back, mut.decal, species || slug);
      inner.addChild(back);
    }
  }
  // live = MAI puppet (blinks, ears, tail); baked portraits stay a still sprite of the loaded art
  const sprite: CatView = o.live === false ? new Sprite(tex) : livingCat(slug);
  sprite.anchor.set(0.5);
  const f = tintFilter(t);
  const mf = mut?.tint ? tintFilter(mut.tint as TintSpec) : null;
  const fl = [f, mf].filter((x): x is NonNullable<typeof x> => !!x);
  if (fl.length) sprite.filters = fl;
  sprite.tint = mut?.tint?.overlay ? overlayTint(mut.tint as TintSpec) : overlayTint(t);
  inner.addChild(sprite);
  const decals = [o.decals !== false && t?.decal && t.decal !== 'corona' ? t.decal : null, o.decals !== false && mut?.decal && mut.decal !== 'doble_cola' && mut.decal !== 'eco' ? mut.decal : null].filter(
    (d): d is string => !!d,
  );
  for (const d of decals) {
    const dec = new Graphics();
    drawDecal(dec, d, species || slug);
    const mask = new Sprite(tex);
    mask.anchor.set(0.5);
    inner.addChild(dec, mask);
    dec.mask = mask;
  }
  root.addChild(inner);
  return { root, sprite };
}

/**
 * Mutation look over a LIVE sprite (e.g. the island cat in the CatPanel): returns a container
 * with the decal masked to the painting; call syncMutationOverlay every frame (the sprite
 * breathes) — sprites can't own children in Pixi v8, so the overlay lives next to it.
 */
export function mutationOverlay(sprite: CatView, species: string, mutation: string | null): Container | null {
  const look = mutationLook(mutation);
  if (!look) return null;
  if (look.tint) {
    const f = tintFilter(look.tint as TintSpec);
    if (f) sprite.filters = [...(sprite.filters ?? []), f];
  }
  const wrap = new Container();
  if (look.decal) {
    const dec = new Graphics();
    drawDecal(dec, look.decal, species);
    if (look.decal !== 'doble_cola' && look.decal !== 'eco') drawDecal(dec, look.decal, species + '#2');
    if (look.decal === 'doble_cola' || look.decal === 'eco') {
      wrap.addChild(dec);
      wrap.alpha = 0.9;
    } else {
      const mask = new Sprite(sprite.texture);
      mask.anchor.set(0.5);
      wrap.addChild(dec, mask);
      dec.mask = mask;
    }
  }
  return wrap;
}
export function syncMutationOverlay(wrap: Container, sprite: CatView) {
  if (wrap.destroyed || sprite.destroyed) return;
  const th = sprite.texture.height || 700;
  wrap.scale.set(sprite.scale.x, sprite.scale.y);
  wrap.position.set(sprite.x, sprite.y - (sprite.anchor.y - 0.5) * th * sprite.scale.y);
}

const portraitCache = new Map<string, Texture>();
export type PortraitMode = 'color' | 'sil' | 'ghost';

/**
 * Baked square portrait (px × px). 'sil' = flat ink silhouette, 'ghost' = paper-colored
 * silhouette for dark cards. Requires ensureCatArt() first (falls back to live sprite).
 */
export function portraitTex(species: string, mode: PortraitMode = 'color', px = 256): Texture {
  const key = `${species}|${mode}|${px}`;
  const hit = portraitCache.get(key);
  if (hit) return hit;
  const slug = slugOf(species);
  const base = catTexture(slug);
  if (base === Texture.WHITE) return Texture.EMPTY;
  const wrap = new Container();
  const v = variantSprite(species, px * 0.98, { live: false });
  v.root.position.set(px / 2, px / 2);
  if (mode !== 'color') v.root.filters = [new SilhouetteFilter(mode === 'sil' ? 0x171317 : 0xede4d6, 1)];
  wrap.addChild(v.root);
  const tex = game.pixi.renderer.generateTexture({ target: wrap, frame: new Rectangle(0, 0, px, px), resolution: 1, antialias: true });
  wrap.destroy({ children: true });
  portraitCache.set(key, tex);
  return tex;
}

/** quick portrait sprite (anchor center) */
export function portrait(species: string, size: number, mode: PortraitMode = 'color'): Sprite {
  const px = size > 200 ? 384 : 256;
  const s = new Sprite(portraitTex(species, mode, px));
  s.anchor.set(0.5);
  s.scale.set(size / px);
  return s;
}
