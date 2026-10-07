import { defineConfig, type Plugin } from 'vite';
import { execSync } from 'node:child_process';

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

export default defineConfig(({ command }) => {
  const id = buildId(command);
  return {
    base: './',
    server: { port: 5173, host: '127.0.0.1' },
    build: { target: 'es2022', chunkSizeWarningLimit: 4000 },
    define: { __BUILD_ID__: JSON.stringify(id) },
    plugins: [versionFile(id)],
  };
});
