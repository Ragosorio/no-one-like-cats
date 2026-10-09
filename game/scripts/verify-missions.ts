/**
 * Mission verifier (no browser): walks the missions up to the M2 cut (H13 / C22 / K23 / E17 — or
 * `--all`) and checks, for each one:
 *   1. its goal.type has an evaluator (src/state/sys/missionGoals.ts ↔ evalGoal in missions.ts)
 *   2. every counter it reads is emitted somewhere with G.count(...) (static scan of src/)
 *   3. every flag it reads (goal or trigger) is set somewhere with G.flag(...) or by a known dynamic source
 *
 * Run:  node scripts/verify-missions.ts [--all]      (Node ≥ 22.18 strips types)  ·  or  npx tsx scripts/verify-missions.ts
 * Exit code 1 when a goal type has no evaluator.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GOAL_HANDLERS, MISSION_GATES, TRIGGER_KINDS, goalCounters, goalFlags } from '../src/state/sys/missionGoals.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
/**
 * The MERGED content the game runs on (content.json + Parte II modules: H31+ live in data/rupturas/*.json).
 * Under tsx / vite-node, src/data/content.ts imports as-is. Plain `node` can't load its JSON imports, so it
 * merges the same modules, in the same order, with the same function (data/mergeContent.ts).
 */
async function loadContent(): Promise<any> {
  try {
    return (await import('../src/data/content.ts')).CONTENT;
  } catch {
    const { mergeContent } = await import('../src/data/mergeContent.ts');
    const dataDir = join(SRC, 'data');
    const ts = readFileSync(join(dataDir, 'content.ts'), 'utf8');
    const json = [...ts.matchAll(/^import\s+\w+\s+from\s+'\.\/([^']+\.json)';/gm)].map((m) => m[1]);
    const [base, ...mods] = json.map((f) => JSON.parse(readFileSync(join(dataDir, f), 'utf8')));
    return mergeContent(base, ...mods);
  }
}
const content = await loadContent();
const balance = JSON.parse(readFileSync(join(SRC, 'data/balance.json'), 'utf8'));
const ALL = process.argv.includes('--all');
const CUT: Record<string, number> = { historia: 13, capitan: 22, criador: 23, explorador: 17 };

// ------------------------------------------------------------------ scan src for emitters
function walk(dir: string, out: string[] = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.ts$/.test(f)) out.push(p);
  }
  return out;
}
interface Emit {
  re: RegExp;
  src: string;
  where: string;
}
const counters: Emit[] = [];
const flags: Emit[] = [];
const toRe = (lit: string) => new RegExp('^' + lit.replace(/[.*+?^()|[\]\\]/g, '\\$&').replace(/\$\{[^}]+\}/g, '.+') + '$');
for (const file of walk(SRC)) {
  const code = readFileSync(file, 'utf8');
  const where = relative(ROOT, file);
  for (const m of code.matchAll(/(?:G|this)\.count\(\s*(['"`])((?:(?!\1).)*)\1/g)) counters.push({ re: toRe(m[2]), src: m[2], where });
  for (const m of code.matchAll(/(?:G|this)\.flag\(\s*(['"`])((?:(?!\1).)*)\1/g)) flags.push({ re: toRe(m[2]), src: m[2], where });
  for (const m of code.matchAll(/flags\[\s*(['"`])((?:(?!\1).)*)\1\s*\]\s*=/g)) flags.push({ re: toRe(m[2]), src: m[2], where });
}
// dynamic flag sources: mission unlocks + boss unlocks are flagged verbatim (missions.ts complete / campaign bossRewards)
for (const m of content.missions) for (const u of m.unlocks ?? []) if (!/^[HCKE]\d\d$/.test(u)) flags.push({ re: toRe(u), src: u, where: `missions ${m.id}.unlocks` });
for (const b of balance.bosses ?? []) for (const u of b.unlocks ?? []) flags.push({ re: toRe(u), src: u, where: `balance boss ${b.name}` });

const emitted = (list: Emit[], key: string) => list.filter((e) => e.re.test(key));

// ------------------------------------------------------------------ check
type Row = { id: string; status: 'OK' | 'FALTA' | 'SIN EVALUADOR' | 'DORMIDA'; goal: string; notes: string[] };
const rows: Row[] = [];
let unsupported = 0;
for (const m of content.missions) {
  const n = Number(m.id.slice(1));
  if (!ALL && n > CUT[m.chain]) continue;
  const g = m.goal;
  const row: Row = { id: m.id, status: 'OK', goal: g.type, notes: [] };
  const h = GOAL_HANDLERS[g.type];
  if (!h) {
    row.status = 'SIN EVALUADOR';
    row.notes.push(`goal.type "${g.type}" no tiene evaluador en missions.ts`);
    unsupported++;
  } else {
    for (const k of goalCounters(g)) {
      const e = emitted(counters, k);
      if (!e.length) {
        if (h.how === 'counter') row.status = 'FALTA';
        row.notes.push(`contador "${k}" nadie lo emite${h.owner ? ` → ${h.owner}` : ''}${h.how !== 'counter' ? ' (hay vía de estado)' : ''}`);
      } else row.notes.push(`contador "${k}" ← ${[...new Set(e.map((x) => x.where))].join(', ')}`);
    }
    for (const f of goalFlags(g)) {
      const e = emitted(flags, f);
      if (!e.length) {
        if (h.how === 'flag') row.status = 'FALTA';
        row.notes.push(`flag "${f}" nadie lo pone${h.owner ? ` → ${h.owner}` : ''}${h.how !== 'flag' ? ' (hay vía de estado)' : ''}`);
      }
    }
  }
  // trigger
  for (const part of String(m.trigger).split('&').map((s: string) => s.trim())) {
    const [k, v] = part.split(':');
    const tk = TRIGGER_KINDS[k];
    if (!tk) {
      if (!emitted(flags, part).length) row.notes.push(`disparador "${part}" se lee como flag y nadie lo pone`);
      continue;
    }
    if (tk.how === 'flag' && tk.key) {
      const key = tk.key(v ?? '');
      if (!emitted(flags, key).length) row.notes.push(`disparador "${part}": flag "${key}" nadie lo pone (M3?)`);
    }
    if (tk.how === 'counter' && tk.key) {
      const key = tk.key(v ?? '');
      if (!emitted(counters, key).length) row.notes.push(`disparador "${part}": contador "${key}" nadie lo emite`);
    }
  }
  if (MISSION_GATES[m.id]) {
    const gt = MISSION_GATES[m.id];
    if (!gt.flags.some((f) => emitted(flags, f).length)) {
      if (row.status !== 'SIN EVALUADOR') row.status = 'DORMIDA';
      row.notes.push(`dormida hasta flag ${gt.flags.join('|')}: ${gt.why}`);
    }
  }
  rows.push(row);
}

const pad = (s: string, n: number) => (s + ' '.repeat(n)).slice(0, n);
console.log(`\nMISIONES ${ALL ? '(todas)' : 'hasta H13 · C22 · K23 · E17'} — ${rows.length} revisadas\n`);
for (const r of rows) {
  const mark = r.status === 'OK' ? '✔' : r.status === 'DORMIDA' ? '…' : '✖';
  console.log(`${mark} ${pad(r.id, 4)} ${pad(r.status, 14)} ${pad(r.goal, 22)} ${r.notes.filter((x) => !x.includes('←')).join(' · ')}`);
}
const bad = rows.filter((r) => r.status === 'FALTA' || r.status === 'SIN EVALUADOR');
console.log(`\nResumen: ${rows.length - bad.length} OK/dormidas · ${bad.length} con faltantes · ${unsupported} sin evaluador`);
if (bad.length) {
  console.log('\nFaltantes (contador/flag que alguien debe emitir):');
  for (const r of bad) console.log(`  ${r.id} (${r.goal}): ${r.notes.filter((x) => !x.includes('←')).join(' · ')}`);
}
process.exit(unsupported ? 1 : 0);
