#!/usr/bin/env node
/**
 * DESPUÉS DE LA PARTE III · bring the roster's cats into the game AS THEIR ART LANDS (SISTEMA, 2026-10-28).
 *
 *   node scripts/postp3-sync.mjs           copy into src/data/postp3/especies.json every cat of DISEÑO's roster
 *                                          (docs/post-p3/04-roster.json) whose painting is in the game: BOTH
 *                                          public/cats-svg/<slug>.svg and public/cats-svg/lite/<slug>.svg
 *   node scripts/postp3-sync.mjs --dry     only say what it would do
 *   node scripts/postp3-sync.mjs --dry --pretend=slug,slug   …as if those paintings had landed (to try it out)
 *
 * Re-run it after every art wave (ARTE-POST). The rules:
 *   · never a cat without art (full + lite);
 *   · ids are forever: a cat already in the game stays, in its place (Catdex numbers never move), even if the roster
 *     dropped it or its art went missing (that's a loud warning, never a removal: a save may hold it); new cats are
 *     appended at the end, in roster order; a cat already in the game gets the roster's current data;
 *   · the game only keeps what it reads of `post` (source, weight, vitrina, star, sets): the power and universe texts
 *     stay in the roster for the agents who write them;
 *   · a new MULTIDIMENSIONAL also goes into the PENDING lists of tests/p3MultiverseReveal.test.ts (its universe) and
 *     tests/multidimPowers.test.ts (its power), unless that universe / power is already registered.
 * The game checks every post cat when it loads (src/data/postp3/validate.ts): run `npx vitest run` after a sync.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GAME = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROSTER = join(GAME, '..', 'docs', 'post-p3', '04-roster.json');
const OUT = join(GAME, 'src', 'data', 'postp3', 'especies.json');
const REVEAL_TEST = join(GAME, 'tests', 'p3MultiverseReveal.test.ts');
const POWER_TEST = join(GAME, 'tests', 'multidimPowers.test.ts');
const SIGNATURES = join(GAME, 'src', 'fx', 'sequences', 'multiverse', 'index.ts');
const POWERS = join(GAME, 'src', 'data', 'multidimPowers.ts');
const POWERS_POST = join(GAME, 'src', 'data', 'multidimPowersPost.ts');
const DRY = process.argv.includes('--dry');
const PRETEND = new Set((process.argv.find((a) => a.startsWith('--pretend=')) ?? '').slice(10).split(',').filter(Boolean));
if (PRETEND.size && !DRY) throw new Error('--pretend solo con --dry');

const roster = JSON.parse(readFileSync(ROSTER, 'utf8'));
const current = JSON.parse(readFileSync(OUT, 'utf8'));
const hasArt = (slug) => PRETEND.has(slug) || existsSync(join(GAME, 'public', 'cats-svg', `${slug}.svg`)) && existsSync(join(GAME, 'public', 'cats-svg', 'lite', `${slug}.svg`));

/** what the game keeps of a roster cat */
function forGame(cat) {
  const c = structuredClone(cat);
  const p = cat.post ?? {};
  c.post = { source: p.source, weight: p.weight };
  if (p.vitrina) c.post.vitrina = p.vitrina;
  if (p.star) c.post.star = true;
  if (Array.isArray(p.sets) && p.sets.length) c.post.sets = [...p.sets];
  return c;
}

const byId = new Map(roster.cats.map((c) => [c.id, c]));
const warnings = [];
const out = [];
const kept = new Set();
// 1) what's already in the game, in its place
for (const c of current.cats) {
  kept.add(c.id);
  const r = byId.get(c.id);
  if (!r) {
    warnings.push(`${c.id}: ya está en el juego pero no en el roster (se queda tal cual: los ids son para siempre)`);
    out.push(c);
    continue;
  }
  if (!hasArt(r.art.slug)) warnings.push(`${c.id}: ya está en el juego y su arte (${r.art.slug}) NO está completo — revisa public/cats-svg`);
  out.push(forGame(r));
}
// 2) the new ones whose art landed, in roster order
const added = [];
const waiting = [];
for (const r of roster.cats) {
  if (kept.has(r.id)) continue;
  if (hasArt(r.art.slug)) {
    out.push(forGame(r));
    added.push(r);
  } else waiting.push(r.id);
}

// 3) the PENDING lists (a new Multidimensional waits there for its universe and its power)
const keysOf = (file, re) => new Set([...readFileSync(file, 'utf8').matchAll(re)].map((m) => m[1]));
const universes = keysOf(SIGNATURES, /^\s{2}(\w+): \w+,$/gm);
// the Parte III powers and the post ones (PODERES-2) both count as registered
const powers = new Set([...keysOf(POWERS, /^\s{2}(\w+): \{$/gm), ...keysOf(POWERS_POST, /^\s{2}(\w+): \{$/gm)]);
const newMd = added.filter((c) => c.rarity === 'multidimensional').map((c) => c.id);
function addPending(file, ids) {
  if (!ids.length) return [];
  const src = readFileSync(file, 'utf8');
  const m = /const PENDING: string\[\] = \[([^\]]*)\];/.exec(src);
  if (!m) throw new Error(`no encuentro «const PENDING: string[] = [...]» en ${file}`);
  const have = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
  const more = ids.filter((id) => !have.includes(id));
  if (!more.length) return [];
  const all = [...have, ...more];
  const list = all.length ? `[\n  ${all.map((id) => `'${id}'`).join(',\n  ')},\n]` : '[]';
  if (!DRY) writeFileSync(file, src.replace(m[0], `const PENDING: string[] = ${list};`));
  return more;
}
const pendU = addPending(REVEAL_TEST, newMd.filter((id) => !universes.has(id)));
const pendP = addPending(POWER_TEST, newMd.filter((id) => !powers.has(id)));

if (!DRY && added.length) writeFileSync(OUT, `${JSON.stringify({ ...current, cats: out }, null, 2)}\n`);

console.log(`roster: ${roster.cats.length} gatos · en el juego antes: ${current.cats.length} · nuevos con arte: ${added.length} · esperan su arte: ${waiting.length}${DRY ? ' (--dry: no se escribió nada)' : ''}`);
for (const c of added) console.log(`  + ${c.id} (${c.rarity}, ${c.post?.source}${c.post?.vitrina ? `, vitrina ${c.post.vitrina}` : ''})`);
if (pendU.length) console.log(`  PENDING de universos (+${pendU.length}): ${pendU.join(', ')}`);
if (pendP.length) console.log(`  PENDING de poderes (+${pendP.length}): ${pendP.join(', ')}`);
for (const w of warnings) console.warn(`  ¡OJO! ${w}`);
if (added.length && !DRY) console.log('Ahora: npx vitest run (el juego revisa cada gato al cargar: src/data/postp3/validate.ts).');
