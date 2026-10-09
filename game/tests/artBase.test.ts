/**
 * Art base (docs/part-ii/09-hosting-arte.md): every cat/story art URL goes through artUrl().
 * Default (no VITE_ART_BASE*) must be byte-identical to the old relative paths; with a base, the
 * join is clean (one slash), shards are stable and lite/full of one cat share a shard.
 */
import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { ART_CONFIG, ART_REMOTE, artCrossOrigin, artSwQuery, artUrl } from '../src/art/artBase';
import { artConfig, artTier, filesForArtSite, joinArtUrl, parseArtBases, remoteArtFiles, resolveArtUrl, shardKey, shardOf } from '../src/art/artPaths';
import { rasterKeyPath } from '../src/art/rasterCache';

const SLUGS = readdirSync(new URL('../public/cats-svg/lite/', import.meta.url))
  .filter((f) => f.endsWith('.svg'))
  .map((f) => f.slice(0, -4));

describe('default (no art base): paths unchanged', () => {
  it('nothing is configured in the test env', () => {
    expect(ART_CONFIG).toEqual({ all: [], full: [] });
    expect(ART_REMOTE).toBe(false);
    expect(artSwQuery()).toBe('');
  });
  it('artUrl returns the old relative paths', () => {
    expect(artUrl('cats-svg/lite/nube_dream_cat.svg')).toBe('cats-svg/lite/nube_dream_cat.svg');
    expect(artUrl('cats-svg/nube_dream_cat.svg')).toBe('cats-svg/nube_dream_cat.svg');
    expect(artUrl('story/lite/luzterna.svg')).toBe('story/lite/luzterna.svg');
    expect(artUrl('icons/el-fire.svg')).toBe('icons/el-fire.svg');
  });
  it('every consumer still builds the same URLs', async () => {
    const { CAST, LUZTERNA, REGISTRO } = await import('../src/rupturas/cast');
    for (const c of CAST) expect(c.url).toBe(`cats-svg/lite/${c.slug}.svg`);
    expect(LUZTERNA.url).toBe('story/lite/luzterna.svg');
    expect(REGISTRO.url).toBe('cats-svg/lite/nadie_static_cat.svg');
    const { catLiteUrl, catSvgUrl } = await import('../src/art/catArt');
    for (const s of SLUGS) {
      expect(catLiteUrl(s)).toBe(`cats-svg/lite/${s}.svg`);
      expect(catSvgUrl(s)).toBe(`cats-svg/${s}.svg`);
    }
  });
  it('relative URLs need no crossOrigin and keep their raster-cache key', () => {
    const here = { href: 'https://ragosorio.github.io/no-one-like-cats/', origin: 'https://ragosorio.github.io' };
    expect(artCrossOrigin('cats-svg/lite/x.svg', here)).toBeUndefined();
    expect(artCrossOrigin('/nolc-arte/cats-svg/x.svg', here)).toBeUndefined();
    expect(rasterKeyPath('cats-svg/lite/x.svg')).toBe('cats-svg/lite/x.svg');
  });
});

describe('with an art base', () => {
  it('parses lists and normalizes the trailing slash', () => {
    expect(parseArtBases('')).toEqual([]);
    expect(parseArtBases(undefined)).toEqual([]);
    expect(parseArtBases(' https://a.io/x , https://b.io/y/ ')).toEqual(['https://a.io/x/', 'https://b.io/y/']);
  });
  it('joins with exactly one slash', () => {
    for (const base of ['https://ragosorio.github.io/nolc-arte', 'https://ragosorio.github.io/nolc-arte/', 'https://ragosorio.github.io/nolc-arte//'])
      for (const path of ['cats-svg/x.svg', '/cats-svg/x.svg', './cats-svg/x.svg'])
        expect(joinArtUrl(base, path)).toBe('https://ragosorio.github.io/nolc-arte/cats-svg/x.svg');
    expect(joinArtUrl('/nolc-arte/', 'cats-svg/lite/x.svg')).toBe('/nolc-arte/cats-svg/lite/x.svg');
    expect(joinArtUrl('', 'cats-svg/x.svg')).toBe('cats-svg/x.svg');
    const all = artConfig('https://ragosorio.github.io/nolc-arte/');
    for (const s of SLUGS)
      for (const u of [resolveArtUrl(`cats-svg/lite/${s}.svg`, all), resolveArtUrl(`cats-svg/${s}.svg`, all)])
        expect(u.replace('https://', '')).not.toContain('//');
  });
  it('VITE_ART_BASE moves every tier; VITE_ART_BASE_FULL only the full one', () => {
    const all = artConfig('https://h.io/arte/');
    expect(resolveArtUrl('cats-svg/lite/a.svg', all)).toBe('https://h.io/arte/cats-svg/lite/a.svg');
    expect(resolveArtUrl('cats-svg/a.svg', all)).toBe('https://h.io/arte/cats-svg/a.svg');
    expect(resolveArtUrl('story/lite/luzterna.svg', all)).toBe('https://h.io/arte/story/lite/luzterna.svg');
    expect(resolveArtUrl('icons/el-fire.svg', all)).toBe('icons/el-fire.svg');
    const full = artConfig('', 'https://h.io/arte/');
    expect(resolveArtUrl('cats-svg/lite/a.svg', full)).toBe('cats-svg/lite/a.svg');
    expect(resolveArtUrl('story/lite/luzterna.svg', full)).toBe('story/lite/luzterna.svg');
    expect(resolveArtUrl('cats-svg/a.svg', full)).toBe('https://h.io/arte/cats-svg/a.svg');
  });
  it('tiers', () => {
    expect(artTier('cats-svg/lite/a.svg')).toBe('lite');
    expect(artTier('cats-svg/a.svg')).toBe('full');
    expect(artTier('story/lite/luzterna.svg')).toBe('story');
    expect(artTier('cats-svg/game-export.json')).toBeNull();
    expect(artTier('icons/el-fire.svg')).toBeNull();
    expect(artTier('assets/index-abc.js')).toBeNull();
  });
  it('shards: stable, lite+full together, and art sites publish exactly what the game asks them for', () => {
    expect(shardOf('anything', 1)).toBe(0);
    expect(shardKey('cats-svg/lite/nube_dream_cat.svg')).toBe(shardKey('cats-svg/nube_dream_cat.svg'));
    const cfg = artConfig('https://a.io/1/,https://a.io/2/');
    const files = SLUGS.flatMap((s) => [`cats-svg/lite/${s}.svg`, `cats-svg/${s}.svg`]).concat('story/lite/luzterna.svg');
    const n = cfg.all.length;
    const sites = [0, 1].map((k) => new Set(filesForArtSite(files, 'all', k, n)));
    for (const f of files) {
      const url = resolveArtUrl(f, cfg);
      const k = url.startsWith('https://a.io/1/') ? 0 : 1;
      expect(sites[k].has(f)).toBe(true);
      expect(sites[1 - k].has(f)).toBe(false);
    }
    // both shards get a fair share
    expect(Math.min(sites[0].size, sites[1].size)).toBeGreaterThan(files.length * 0.3);
    // a full-only site never carries lite/story
    expect(filesForArtSite(files, 'full', 0, 1).every((f) => artTier(f) === 'full')).toBe(true);
    expect(filesForArtSite(files, 'lite', 0, 1).every((f) => artTier(f) !== 'full')).toBe(true);
  });
  it('remoteArtFiles = what the build drops from dist', () => {
    const dist = ['index.html', 'sw.js', 'icons/el-fire.svg', 'cats-svg/game-export.json', 'cats-svg/a.svg', 'cats-svg/lite/a.svg', 'story/lite/luzterna.svg'];
    expect(remoteArtFiles(dist, artConfig())).toEqual([]);
    expect(remoteArtFiles(dist, artConfig('', 'https://h.io/a/'))).toEqual(['cats-svg/a.svg']);
    expect(remoteArtFiles(dist, artConfig('https://h.io/a/'))).toEqual(['cats-svg/a.svg', 'cats-svg/lite/a.svg', 'story/lite/luzterna.svg']);
  });
  it('crossOrigin only for another origin; raster keys stay path-like', () => {
    const here = { href: 'https://ragosorio.github.io/no-one-like-cats/', origin: 'https://ragosorio.github.io' };
    expect(artCrossOrigin('https://ragosorio.github.io/nolc-arte/cats-svg/a.svg', here)).toBeUndefined();
    expect(artCrossOrigin('https://arte.example.com/cats-svg/a.svg', here)).toBe('anonymous');
    expect(artCrossOrigin('//arte.example.com/cats-svg/a.svg', here)).toBe('anonymous');
    expect(rasterKeyPath('https://ragosorio.github.io/nolc-arte/cats-svg/a.svg')).toBe('ragosorio.github.io/nolc-arte/cats-svg/a.svg');
  });
  it('service worker query lists absolute bases', () => {
    const page = 'https://ragosorio.github.io/no-one-like-cats/';
    expect(artSwQuery(artConfig('', '/nolc-arte/'), page)).toBe(`&art=${encodeURIComponent('https://ragosorio.github.io/nolc-arte/')}&tiers=full`);
    expect(artSwQuery(artConfig('https://a.io/1/,https://a.io/2/'), page)).toBe(`&art=${encodeURIComponent('https://a.io/1/,https://a.io/2/')}&tiers=all`);
  });
});
