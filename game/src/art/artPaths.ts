/**
 * Where the cat art is served from — pure logic (no Vite, no DOM). Shared by:
 * - src/art/artBase.ts (the game: `artUrl(path)`)
 * - vite.config.ts (build: drops the art that is served elsewhere from dist/)
 * - scripts/art-publish.ts (run by node: builds an art site / checks it before a game deploy)
 *
 * Default (no base configured): every path stays exactly as today (`cats-svg/lite/x.svg`,
 * relative to the game page). See docs/part-ii/09-hosting-arte.md.
 *
 * Tiers:
 * - lite  = cats-svg/lite/<slug>.svg (critical path: island, battle, grids)
 * - full  = cats-svg/<slug>.svg      (detail upgrade; if it fails the cat simply stays lite)
 * - story = story/**.svg             (Luzterna)
 *
 * A base may be a list ("a,b"): the file goes to shard `fnv1a(slug) % n`, so the lite and full
 * files of one cat always live on the same shard. Art site k of n publishes exactly those files.
 *
 * Keep this file to erasable TypeScript only (node runs it with type stripping).
 */
export type ArtTier = 'full' | 'lite' | 'story';

export interface ArtConfig {
  /** bases for every tier (VITE_ART_BASE). Empty = served next to the game. */
  all: string[];
  /** bases for the full tier (VITE_ART_BASE_FULL, falls back to `all`) */
  full: string[];
}

/** "a, b c" → ["a/", "b/", "c/"] (trailing slash normalized; empty → []) */
export function parseArtBases(spec: string | undefined | null): string[] {
  return String(spec ?? '')
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (s.endsWith('/') ? s : `${s}/`));
}

export function artConfig(base?: string | null, full?: string | null): ArtConfig {
  const all = parseArtBases(base);
  const f = parseArtBases(full);
  return { all, full: f.length ? f : all };
}

/** strip a leading "./" or "/" (art paths are always relative to the art root) */
function clean(path: string): string {
  return path.replace(/^(?:\.\/|\/)+/, '');
}

/** which art tier a path belongs to (null = not cat/story art: icons, json, code… never moved) */
export function artTier(path: string): ArtTier | null {
  const p = clean(path);
  if (/^cats-svg\/lite\/[^/]+\.svg$/i.test(p)) return 'lite';
  if (/^cats-svg\/[^/]+\.svg$/i.test(p)) return 'full';
  if (/^story\/.+\.svg$/i.test(p)) return 'story';
  return null;
}

/** shard key = file name without extension (= the cat's slug; lite and full share it) */
export function shardKey(path: string): string {
  const name = clean(path).split('/').pop() ?? '';
  return name.replace(/\.[^.]+$/, '');
}

/** FNV-1a 32-bit → shard index in [0, n) (stable across browsers and node) */
export function shardOf(key: string, n: number): number {
  if (n <= 1) return 0;
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h % n;
}

/** the bases a path is served from under `cfg` ([] = next to the game) */
export function basesFor(path: string, cfg: ArtConfig): string[] {
  const t = artTier(path);
  if (!t) return [];
  return t === 'full' ? cfg.full : cfg.all;
}

/** base + path with exactly one slash between them ('' base → path untouched) */
export function joinArtUrl(base: string, path: string): string {
  if (!base) return path;
  return `${base.replace(/\/+$/, '')}/${clean(path)}`;
}

/** the URL the game loads for an art path */
export function resolveArtUrl(path: string, cfg: ArtConfig): string {
  const bases = basesFor(path, cfg);
  if (!bases.length) return path;
  return joinArtUrl(bases[shardOf(shardKey(path), bases.length)], path);
}

/** of these dist-relative files, the ones served from an art site instead (= drop them from the game's dist) */
export function remoteArtFiles(files: string[], cfg: ArtConfig): string[] {
  return files.filter((f) => basesFor(f, cfg).length > 0);
}

/** what an art site carries: every tier, only the full tier, or only lite + story */
export type ArtSiteTiers = 'all' | 'full' | 'lite';

/** which files art site `shard` of `count` publishes, for the given tiers */
export function filesForArtSite(files: string[], tiers: ArtSiteTiers, shard: number, count: number): string[] {
  return files.filter((f) => {
    const t = artTier(f);
    if (!t) return false;
    if (tiers === 'full' && t !== 'full') return false;
    if (tiers === 'lite' && t === 'full') return false;
    return shardOf(shardKey(f), count) === shard;
  });
}
