import { defineConfig, loadEnv, type Plugin } from 'vite';
import { execSync } from 'node:child_process';
import { readdirSync, rmSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { artConfig, remoteArtFiles, type ArtConfig } from './src/art/artPaths';

/**
 * Every production build gets an id (short git sha + UTC time). It ends up in three places:
 * - `__BUILD_ID__` inside the bundle (the running game knows which build it is)
 * - `version.json` next to index.html (core/updates.ts polls it: "there's a newer version")
 * - the service worker URL `sw.js?v=<id>` (a new id = a new worker = fresh caches)
 */
function buildId(command: string) {
  if (command !== 'build') return 'dev';
  let sha = 'local';
  try {
    sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    /* not a git checkout */
  }
  const t = new Date().toISOString().replace(/[-:]/g, '').slice(0, 13);
  return `${sha}-${t}`;
}

function versionFile(id: string): Plugin {
  return {
    name: 'nolc-version',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: id, at: new Date().toISOString() }) });
    },
  };
}

/**
 * Art served from an art site (VITE_ART_BASE / VITE_ART_BASE_FULL, docs/part-ii/09-hosting-arte.md):
 * those SVGs are removed from dist/ after the build so the game's Pages site stays small. Nothing
 * happens when no base is set (today's deploy: every SVG ships next to the game).
 */
function dropRemoteArt(cfg: ArtConfig): Plugin {
  let outDir = 'dist';
  return {
    name: 'nolc-drop-remote-art',
    apply: 'build',
    configResolved(c) {
      outDir = resolve(c.root, c.build.outDir);
    },
    closeBundle() {
      if (!cfg.all.length && !cfg.full.length) return;
      const walk = (d: string): string[] =>
        readdirSync(d).flatMap((n) => {
          const f = join(d, n);
          return statSync(f).isDirectory() ? walk(f) : [relative(outDir, f).split(sep).join('/')];
        });
      const gone = remoteArtFiles(walk(outDir), cfg);
      for (const f of gone) rmSync(join(outDir, f));
      console.log(`[nolc] art base set: ${gone.length} SVGs left out of dist/ (served by the art site)`);
    },
  };
}

export default defineConfig(({ command, mode }) => {
  const id = buildId(command);
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_ART_'), ...process.env };
  const art = artConfig(env.VITE_ART_BASE, env.VITE_ART_BASE_FULL);
  return {
    base: './',
    server: { port: 5173, host: '127.0.0.1' },
    build: {
      target: 'es2022',
      chunkSizeWarningLimit: 4000,
      // rupturas.html = Parte II "La Era de las Rupturas" vertical slice (isolated: never touches saves)
      rollupOptions: { input: { main: 'index.html', rupturas: 'rupturas.html' } },
    },
    define: { __BUILD_ID__: JSON.stringify(id) },
    plugins: [versionFile(id), dropRemoteArt(art)],
  };
});
