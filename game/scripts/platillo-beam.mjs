// Platillo's tractor beam (s_platillo · platillo_saucer_cat): a hand-made VECTOR light layer on top of the traced
// painting (MENORES 2026-10-10). The trace keeps the beam's colors but not its light: at 240 px (lite) it reads as a
// flat lime block. This adds, over the cone only, a soft halo, glowing walls, a bright core under the emitter falling off
// downward, two rings of light (above and below the cow) and the glow at the emitter — gradients + blur, screen-blended, no raster, no re-trace. Idempotent (replaces its own layer).
// Run again after any re-trace of Platillo:  node scripts/platillo-beam.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../public/cats-svg/', import.meta.url));
const FILES = [
  ['platillo_saucer_cat.svg', 700],
  ['lite/platillo_saucer_cat.svg', 240],
];
const ID = 'nolc-beam-light';

// the cone in the painting's 700×700 space (measured on the traced painting: emitter under the saucer → rounded bottom)
const CONE = 'M228 490 C262 497 330 497 360 489 L389 648 C384 670 300 678 240 670 C200 664 168 654 166 640 Z';
/** the same outline without its top (the walls and the bottom): the halo and the bright walls never cover the saucer */
const RIM = 'M360 489 L389 648 C384 670 300 678 240 670 C200 664 168 654 166 640 L228 490';
const EMIT = { cx: 294, cy: 491, rx: 70, ry: 10 };

function layer(scale) {
  const g = (s) => `<g id="${ID}" style="mix-blend-mode:screen;isolation:isolate" pointer-events="none"${scale === 1 ? '' : ` transform="scale(${scale.toFixed(6)})"`}>${s}</g>`;
  return g(
    `<defs>` +
      `<linearGradient id="${ID}-fall" gradientUnits="userSpaceOnUse" x1="0" y1="488" x2="0" y2="676">` +
      `<stop offset="0" stop-color="#f4ffd6" stop-opacity="0.12"/><stop offset="0.07" stop-color="#f4ffd6" stop-opacity="0.5"/><stop offset="0.25" stop-color="#d4ff8a" stop-opacity="0.16"/>` +
      `<stop offset="0.7" stop-color="#9dff52" stop-opacity="0.04"/><stop offset="1" stop-color="#7dff3a" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="${ID}-core" gradientUnits="userSpaceOnUse" x1="196" y1="0" x2="376" y2="0">` +
      `<stop offset="0" stop-color="#b8ff6a" stop-opacity="0"/><stop offset="0.45" stop-color="#fbffe8" stop-opacity="0.4"/>` +
      `<stop offset="0.62" stop-color="#eaffc0" stop-opacity="0.22"/><stop offset="1" stop-color="#b8ff6a" stop-opacity="0"/></linearGradient>` +
      `<radialGradient id="${ID}-emit" gradientUnits="objectBoundingBox" cx="0.5" cy="0.5" r="0.5">` +
      `<stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="0.5" stop-color="#d9ff9a" stop-opacity="0.55"/>` +
      `<stop offset="1" stop-color="#8dff40" stop-opacity="0"/></radialGradient>` +
      `<filter id="${ID}-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>` +
      `<filter id="${ID}-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.4"/></filter>` +
      `<clipPath id="${ID}-clip"><path d="${CONE}"/></clipPath>` +
      `</defs>` +
      // the halo: the light spills a little outside the cone
      `<path d="${RIM}" fill="none" stroke="#a8ff5c" stroke-opacity="0.55" stroke-width="20" stroke-linecap="round" filter="url(#${ID}-soft)"/>` +
      // inside the cone: the fall-off from the emitter, a bright core, three rings of light going down
      `<g clip-path="url(#${ID}-clip)">` +
      `<path d="${CONE}" fill="url(#${ID}-fall)"/>` +
      // the walls of the beam glow brighter than its middle (the cow inside stays crisp)
      `<path d="${RIM}" fill="none" stroke="#efffc4" stroke-opacity="0.7" stroke-width="14" filter="url(#${ID}-blur)"/>` +
      `<path d="M258 494 L332 494 L326 552 C302 560 272 560 250 552 Z" fill="url(#${ID}-core)" filter="url(#${ID}-soft)"/>` +
      [
        [512, 64, 0.45],
        [640, 106, 0.3],
      ]
        .map(([y, rx, a]) => `<ellipse cx="${(294 - (y - 490) * 0.1).toFixed(1)}" cy="${y}" rx="${rx}" ry="${(rx * 0.16).toFixed(1)}" fill="none" stroke="#f2ffcc" stroke-opacity="${a}" stroke-width="3" filter="url(#${ID}-blur)"/>`)
        .join('') +
      `</g>` +
      // the emitter under the saucer
      `<ellipse cx="${EMIT.cx}" cy="${EMIT.cy}" rx="${EMIT.rx}" ry="${EMIT.ry}" fill="url(#${ID}-emit)" filter="url(#${ID}-blur)"/>`,
  );
}

for (const [f, size] of FILES) {
  const p = ROOT + f;
  let svg = readFileSync(p, 'utf8');
  const open = `<!--${ID}-->`;
  const close = `<!--/${ID}-->`;
  const i = svg.indexOf(open);
  if (i >= 0) svg = svg.slice(0, i) + svg.slice(svg.indexOf(close) + close.length);
  if (!svg.trimEnd().endsWith('</svg>')) throw new Error(`${f}: unexpected ending`);
  svg = svg.trimEnd().replace(/<\/svg>$/, `${open}${layer(size / 700)}${close}</svg>`);
  writeFileSync(p, svg);
  console.log(f, svg.length);
}
