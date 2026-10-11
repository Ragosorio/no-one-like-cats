// Writes docs/part-ii/escuchar.html: every recording in game/public/music, grouped by song, to listen
// without playing the game (open the file in a browser). Run again when new music lands:
//   node game/scripts/escuchar.mjs
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const game = join(dirname(fileURLToPath(import.meta.url)), '..');
const musicDir = join(game, 'public/music');
const outFile = join(game, '../docs/part-ii/escuchar.html');
const tracks = JSON.parse(readFileSync(join(game, 'src/data/music/tracks.json'), 'utf8'));

const KIND = { original: 'Original (solo en Momentos y Fonoteca)', battle: 'Versión de batalla', explore: 'Para explorar', ambient: 'Tranquila', aftermath: 'Después', stinger: 'Remate' };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const files = new Set(readdirSync(musicDir).filter((f) => f.endsWith('.m4a')));
const seen = new Set();
const href = (f) => relative(dirname(outFile), join(musicDir, f)).split('\\').join('/');
const mb = (f) => (statSync(join(musicDir, f)).size / 1048576).toFixed(1);
const mtime = (f) => statSync(join(musicDir, f)).mtime;
const newest = Date.now() - 36 * 3600 * 1000;
const latest = Date.now() - 6 * 3600 * 1000; // re-done in the last 6 hours: «RECIÉN» (to re-listen after a round of changes)

function row(file, title, note) {
  const f = file.replace(/^music\//, '');
  if (!files.has(f)) return '';
  seen.add(f);
  const m = mtime(f).getTime();
  const fresh = m > latest ? '<span class="new now">RECIÉN</span>' : m > newest ? '<span class="new">NUEVA</span>' : '';
  return `<li><div class="t">${esc(title)} ${fresh}<small>${esc(f)} · ${mb(f)} MB</small></div>${note ? `<p>${esc(note)}</p>` : ''}<audio controls preload="none" src="${href(f)}"></audio></li>`;
}

let body = '';
for (const t of tracks) {
  const items = (t.variations ?? []).map((v) => row(v.file ?? t.file, `${KIND[v.kind] ?? v.kind ?? ''}${v.title && v.title !== 'Original' ? ` · ${v.title}` : ''}`, v.note)).join('');
  if (items) body += `<section><h2>${esc(t.title ?? t.id)}</h2><ul>${items}</ul></section>`;
}
const rest = [...files].filter((f) => !seen.has(f)).sort();
if (rest.length) body += `<section><h2>Remates y capas sueltas</h2><ul>${rest.map((f) => row(f, f.replace(/\.m4a$/, ''))).join('')}</ul></section>`;

writeFileSync(
  outFile,
  `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Escuchar la música</title>
<style>
:root{--bg:#f6f1e7;--ink:#2b2420;--soft:#7a6e64;--card:#fffaf2;--accent:#c4502f}
@media (prefers-color-scheme:dark){:root{--bg:#1d1916;--ink:#efe6da;--soft:#a3968a;--card:#28221e;--accent:#f08a5d}}
body{margin:0;padding:24px 16px;background:var(--bg);color:var(--ink);font:15px/1.45 system-ui,sans-serif}
main{max-width:760px;margin:0 auto}h1{margin:0 0 4px}header p{color:var(--soft);margin:0 0 20px}
h2{margin:28px 0 8px;font-size:18px}ul{list-style:none;margin:0;padding:0}
li{background:var(--card);border-radius:10px;padding:10px 12px;margin:8px 0}
.t{font-weight:600}.t small{display:block;font-weight:400;color:var(--soft);font-size:12px}
li p{margin:4px 0 6px;color:var(--soft);font-size:13px}audio{width:100%;margin-top:6px}
.new{background:var(--accent);color:#fff;border-radius:4px;padding:0 5px;font-size:11px;margin-left:4px}.new.now{background:#2f7d4f}
</style><main><header><h1>La música de la Parte II</h1>
<p>Generado ${new Date().toLocaleString('es-GT')}. «RECIÉN» = hecha o rehecha en las últimas 6 horas; «NUEVA» = en las últimas 36. Se vuelve a generar con <code>node game/scripts/escuchar.mjs</code>.</p></header>
${body}</main></html>\n`,
);
console.log(`escuchar.html: ${files.size} grabaciones → ${outFile}`);
