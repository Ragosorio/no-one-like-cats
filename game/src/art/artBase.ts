/**
 * The one door every cat/story art URL goes through: `artUrl('cats-svg/lite/x.svg')`.
 *
 * Build-time config (vite env, both optional, default = today's behavior):
 * - VITE_ART_BASE       all art tiers (lite + full + story) served from this base (or "a,b" shards)
 * - VITE_ART_BASE_FULL  only the full-detail tier (falls back to VITE_ART_BASE)
 *
 * Unset/empty → paths are returned untouched (relative to the game page, exactly as before).
 * Hosting plan and why the GAME page must never leave https://ragosorio.github.io (saves live in that
 * origin): docs/part-ii/09-hosting-arte.md. Pure logic + shard rule: ./artPaths.ts.
 */
import { artConfig, resolveArtUrl, type ArtConfig } from './artPaths';

// literal `import.meta.env.X` so Vite inlines the values at build time
export const ART_CONFIG: ArtConfig = artConfig(import.meta.env.VITE_ART_BASE as string | undefined, import.meta.env.VITE_ART_BASE_FULL as string | undefined);

/** true when some art tier is served from a configured base */
export const ART_REMOTE = ART_CONFIG.all.length > 0 || ART_CONFIG.full.length > 0;

/** the URL to load for an art path (unchanged when no base is configured or it is not cat/story art) */
export function artUrl(path: string): string {
  return resolveArtUrl(path, ART_CONFIG);
}

/**
 * crossOrigin for an <img> that will be drawn into a canvas and read back (getImageData / toBlob):
 * 'anonymous' when the URL is on another origin (needs `Access-Control-Allow-Origin` on the art host,
 * GitHub Pages sends `*`), undefined for same-origin/relative URLs (no change from today).
 */
export function artCrossOrigin(url: string, here: { href: string; origin: string } | undefined = globalThis.location): 'anonymous' | undefined {
  if (!/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(url)) return undefined; // relative or root-relative: same origin
  try {
    if (!here) return 'anonymous';
    return new URL(url, here.href).origin === here.origin ? undefined : 'anonymous';
  } catch {
    return 'anonymous';
  }
}

/**
 * Extra query for the service worker URL (core/pwa.ts → public/sw.js): the absolute art bases, so the
 * worker can cache them and drop the copies it kept from the old location. '' when nothing is remote
 * (the worker URL stays exactly `sw.js?v=<build>`).
 */
export function artSwQuery(cfg: ArtConfig = ART_CONFIG, pageHref: string | undefined = globalThis.location?.href): string {
  const bases = [...new Set([...cfg.all, ...cfg.full])];
  if (!bases.length) return '';
  const abs = bases.map((b) => {
    try {
      return pageHref ? new URL(b, pageHref).href : b;
    } catch {
      return b;
    }
  });
  const tiers = cfg.all.length ? 'all' : 'full';
  return `&art=${encodeURIComponent(abs.join(','))}&tiers=${tiers}`;
}
