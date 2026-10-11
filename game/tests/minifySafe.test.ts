/**
 * A production build (vite build → minified) renames classes: `scene.constructor.name === 'IslandScene'` is true in
 * dev and FALSE on the live site. Scene checks use `instanceof` (lazy class refs, ui/story/o3Sky.ts sceneKind) or duck
 * typing (`regionId`). This fails if any game code compares `constructor.name` directly (dev-only tools excepted).
 * (QA-RECORRIDO 2026-10-10: the page by the faro, ui/story/o4Pagina.ts, never mounted in a build because of one.)
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../src', import.meta.url));
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const f = join(dir, n);
    return statSync(f).isDirectory() ? files(f) : /\.ts$/.test(n) ? [f] : [];
  });
}

describe('minification-safe scene checks', () => {
  it('no `constructor.name` in game code, not even stored in a variable (src/dev is dev-only)', () => {
    const bad: string[] = [];
    for (const f of files(SRC)) {
      const rel = relative(SRC, f);
      if (rel.startsWith('dev/')) continue;
      readFileSync(f, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (/\.constructor\.name\b/.test(line) && !/never\s*`?constructor\.name/.test(line)) bad.push(`${rel}:${i + 1}: ${line.trim()}`);
        });
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
});
