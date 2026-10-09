/**
 * Art site tooling (docs/part-ii/09-hosting-arte.md). Runs with plain node ≥ 22.18 (type stripping):
 *
 *   node scripts/art-publish.ts build --src public --out _site [--tiers all|full|lite] [--shard 0 --count 1]
 *     Copies the cat/story SVGs that art site <shard> of <count> serves into <out>, plus
 *     art-manifest.json (sha1 of every file) and a tiny index.html. Used by the art repo's workflow
 *     (ops/nolc-arte/publish.yml), which checks out THIS repo — the art is never duplicated in git.
 *
 *   node scripts/art-publish.ts check --src public [--site https://ragosorio.github.io/no-one-like-cats/]
 *     Before a game deploy with VITE_ART_BASE / VITE_ART_BASE_FULL set (read from the environment):
 *     fetches each art site's art-manifest.json and compares it with the local files.
 *     - lite/story file missing or different → exit 1 (the island/battle would show stand-ins)
 *     - full file different → exit 1 (a redrawn cat would mix new rig and old painting)
 *     - full file missing → warning only (the cat stays on its lite painting until the art site catches up)
 *
 * Nothing here talks to GitHub's API or pushes anything; `check` only does HTTP GETs.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { artConfig, artTier, basesFor, filesForArtSite, shardKey, shardOf, type ArtSiteTiers } from '../src/art/artPaths.ts';

const argv = process.argv.slice(2);
const cmd = argv[0];
const opt = (name: string, def = '') => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : def;
};

function walk(root: string, d = root): string[] {
  return readdirSync(d).flatMap((n) => {
    const f = join(d, n);
    return statSync(f).isDirectory() ? walk(root, f) : [relative(root, f).split(sep).join('/')];
  });
}
const sha1 = (f: string) => createHash('sha1').update(readFileSync(f)).digest('hex');

interface Manifest {
  version: 1;
  tiers: ArtSiteTiers;
  shard: number;
  count: number;
  builtAt: string;
  source?: string;
  files: Record<string, { sha1: string; bytes: number }>;
}

function build() {
  const src = opt('src', 'public');
  const out = opt('out', '_site');
  const tiers = opt('tiers', 'all') as ArtSiteTiers;
  const shard = Number(opt('shard', '0'));
  const count = Number(opt('count', '1'));
  if (!['all', 'full', 'lite'].includes(tiers) || !(count >= 1) || !(shard >= 0 && shard < count)) {
    console.error('bad --tiers/--shard/--count');
    process.exit(2);
  }
  const files = filesForArtSite(walk(src), tiers, shard, count).sort();
  const m: Manifest = { version: 1, tiers, shard, count, builtAt: new Date().toISOString(), source: process.env.NOLC_ART_SOURCE || undefined, files: {} };
  let bytes = 0;
  for (const f of files) {
    const from = join(src, f);
    // the art site shares the game's origin (ragosorio.github.io): an SVG opened directly runs its
    // scripts there, next to the saves. MAI vectors never have any — refuse to publish one that does.
    if (/<script\b|\son[a-z]+\s*=|javascript:/i.test(readFileSync(from, 'utf8'))) {
      console.error(`[art] ${f} contains script/event handlers: refusing to publish`);
      process.exit(1);
    }
    const to = join(out, f);
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
    const b = statSync(from).size;
    bytes += b;
    m.files[f] = { sha1: sha1(from), bytes: b };
  }
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'art-manifest.json'), JSON.stringify(m));
  writeFileSync(
    join(out, 'index.html'),
    '<!doctype html><meta charset="utf-8"><title>NO ONE LIKE CATS · arte</title><p>Arte vectorial de NO ONE LIKE CATS. El juego está en <a href="../no-one-like-cats/">/no-one-like-cats/</a>.</p>\n',
  );
  const mb = bytes / 1e6;
  console.log(`[art] shard ${shard}/${count} tiers=${tiers}: ${files.length} files, ${mb.toFixed(1)} MB → ${out}`);
  // GitHub Pages: published site ≤ 1 GB. Fail early with margin instead of a half-broken deploy.
  const limit = Number(process.env.NOLC_ART_LIMIT_MB || 950);
  if (mb > limit) {
    console.error(`[art] ${mb.toFixed(0)} MB > ${limit} MB: add a shard (docs/part-ii/09-hosting-arte.md › Capacidad)`);
    process.exit(1);
  }
}

async function getJson(url: string): Promise<Manifest | null> {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
      if (r.ok) return (await r.json()) as Manifest;
      console.error(`[art] ${url}: HTTP ${r.status}`);
    } catch (e) {
      console.error(`[art] ${url}: ${(e as Error).message}`);
    }
    await new Promise((res) => setTimeout(res, 5000));
  }
  return null;
}

async function check() {
  const src = opt('src', 'public');
  const site = opt('site', process.env.NOLC_SITE_URL || 'https://ragosorio.github.io/no-one-like-cats/');
  const cfg = artConfig(process.env.VITE_ART_BASE, process.env.VITE_ART_BASE_FULL);
  const local = walk(src).filter((f) => basesFor(f, cfg).length > 0);
  if (!local.length) {
    console.log('[art] no art base configured: nothing to check');
    return;
  }
  const byBase = new Map<string, string[]>();
  for (const f of local) {
    const bases = basesFor(f, cfg);
    const abs = new URL(bases[shardOf(shardKey(f), bases.length)], site).href;
    byBase.set(abs, [...(byBase.get(abs) ?? []), f]);
  }
  let errors = 0;
  let warnings = 0;
  for (const [base, files] of byBase) {
    const m = await getJson(new URL('art-manifest.json', base).href);
    if (!m) {
      console.error(`::error::[art] no art-manifest.json at ${base} — publish the art site first`);
      errors++;
      continue;
    }
    for (const f of files) {
      const remote = m.files[f];
      const full = artTier(f) === 'full';
      if (!remote) {
        if (full) {
          console.log(`::warning::[art] ${base}${f} not published yet (the cat stays lite until it is)`);
          warnings++;
        } else {
          console.error(`::error::[art] ${base}${f} missing`);
          errors++;
        }
      } else if (remote.sha1 !== sha1(join(src, f))) {
        console.error(`::error::[art] ${base}${f} differs from this commit — republish the art site`);
        errors++;
      }
    }
    console.log(`[art] ${base}: ${files.length} files checked (manifest built ${m.builtAt}${m.source ? ` from ${m.source}` : ''})`);
  }
  if (errors) {
    console.error(`[art] ${errors} problem(s): run the art site's publish workflow, then re-run this deploy`);
    process.exit(1);
  }
  console.log(`[art] OK${warnings ? ` (${warnings} full-detail file(s) pending)` : ''}`);
}

if (cmd === 'build') build();
else if (cmd === 'check') await check();
else {
  console.error('usage: node scripts/art-publish.ts build|check [options]  (see header)');
  process.exit(2);
}
