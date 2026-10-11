/**
 * Song covers, drawn in code (no raster ever): a Swiss-poster composition from tracks.json › cover
 * { palette: ['#hex'…], motif }. Known motifs get their own glyph; any other motif string still gets a
 * stable, distinct composition (hash-seeded), so a new song never shows a blank sleeve.
 */
import { Container, Graphics } from 'pixi.js';
import { C } from '../ui/theme';
import type { Track } from './catalog';

const INK = C.ink;

export function hexColor(s: string | undefined, d: number): number {
  if (!s) return d;
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(s.trim());
  if (!m) return d;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return parseInt(h, 16);
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: number) {
  let s = seed || 1;
  return () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) ^ Math.imul(s ^ (s >>> 13), 3266489917)) >>> 0) / 4294967296;
}

/** the palette of a track as numbers (4 colours: background, main, accent, detail) */
export function paletteOf(t: Pick<Track, 'id' | 'cover'> | null): [number, number, number, number] {
  const p = t?.cover.palette ?? [];
  const fall: [number, number, number, number] = [C.paper, C.pinkHot, C.yellow, INK];
  if (!t) return fall;
  // no palette: a stable one from the id
  if (!p.length) {
    const sets: [number, number, number, number][] = [
      [C.yellow, C.pinkHot, C.megaBlue, INK],
      [C.mint, C.violet, C.yellow, INK],
      [C.paper, C.red, C.inkBlue, INK],
      [C.lilac, C.plum, C.yellow, INK],
      [C.pink, C.oceanNoir, C.cyan, INK],
    ];
    return sets[hash(t.id) % sets.length];
  }
  return [hexColor(p[0], fall[0]), hexColor(p[1], fall[1]), hexColor(p[2] ?? p[1], fall[2]), hexColor(p[3], INK)];
}

/** a cover `s`×`s` px (top-left at 0,0) */
export function drawCover(t: Pick<Track, 'id' | 'cover'> | null, s: number, o: { locked?: boolean } = {}): Container {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  const [bg, main, acc, det] = o.locked ? [0x2a2428, 0x3a3236, 0x4a4146, 0x5a5056] : paletteOf(t);
  const R = rng(hash(t?.id ?? 'x'));
  const k = s / 100;
  g.rect(0, 0, s, s).fill(bg);
  if (o.locked) {
    // a sealed sleeve: ink, a ring of dashes, a question
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      g.moveTo(50 * k + Math.cos(a) * 30 * k, 50 * k + Math.sin(a) * 30 * k)
        .lineTo(50 * k + Math.cos(a) * 36 * k, 50 * k + Math.sin(a) * 36 * k)
        .stroke({ width: 2.5 * k, color: main });
    }
    g.circle(50 * k, 50 * k, 18 * k).stroke({ width: 3 * k, color: acc });
    g.rect(0, 0, s, s).stroke({ width: Math.max(2, 3 * k), color: INK, alignment: 1 });
    return c;
  }
  // halftone field (bottom-right) — the print look of the whole game
  const step = 7 * k;
  for (let y = s * 0.45; y < s; y += step)
    for (let x = s * 0.35; x < s; x += step) {
      const d = ((x - s * 0.35) / (s * 0.65) + (y - s * 0.45) / (s * 0.55)) / 2;
      const r = Math.max(0, d * 2.6 * k);
      if (r > 0.35) g.circle(x, y, r).fill({ color: det, alpha: 0.55 });
    }
  // big shape
  const cx = (30 + R() * 40) * k;
  const cy = (30 + R() * 30) * k;
  g.circle(cx, cy, (26 + R() * 10) * k).fill(main);
  // bars
  const bars = 2 + Math.floor(R() * 3);
  for (let i = 0; i < bars; i++) g.rect(0, (62 + i * 9) * k, (40 + R() * 55) * k, 4 * k).fill(i % 2 ? acc : det);
  motif(g, t?.cover.motif ?? '', k, main, acc, det, R);
  g.rect(0, 0, s, s).stroke({ width: Math.max(2, 3 * k), color: INK, alignment: 1 });
  return c;
}

function star(g: Graphics, x: number, y: number, r: number, color: number) {
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.poly(pts).fill(color);
}

/** motif text → a drawable kind: the FIRST image the text mentions wins (word-start matching) */
const MOTIFS: [string, string[]][] = [
  ['waves', ['wave', 'sea', 'mar', 'ola', 'tide', 'marea', 'oleaje']],
  ['circus', ['circus', 'circo', 'tent', 'carpa', 'carrusel']],
  ['stars', ['star', 'estrella', 'astral', 'cosmos', 'cielo', 'sky', 'constelac']],
  ['broken', ['broken', 'roto', 'rota', 'partido', 'partida', 'grieta', 'odio', 'hate', 'heartbreak']],
  ['rain', ['lluvia', 'rain', 'llovizna', 'ventana']],
  ['heart', ['heart', 'corazon', 'corazón', 'love', 'amor']],
  ['fight', ['fist', 'fight', 'pelea', 'punch', 'golpe', 'merengue', 'party', 'fiesta', 'guante', 'boxeo', 'tambora', 'güira']],
  ['ancestral', ['ancestral', 'ancient', 'antigu', 'voces', 'voz', 'totem', 'tótem', 'mascara', 'máscara', 'piedra', 'pinturas']],
  ['epic', ['epic', 'épic', 'bolt', 'rayo', 'lightning', 'storm', 'tormenta', 'boss']],
  ['spiral', ['spiral', 'espiral', 'dream', 'sueño', 'hypno']],
  ['eye', ['eye', 'ojo', 'ojos']],
  ['crown', ['crown', 'corona', 'king', 'rey']],
];
export function motifKind(text: string): string | null {
  const words = text.toLowerCase().split(/[^a-z0-9áéíóúñü]+/i).filter(Boolean);
  let best: { kind: string; at: number } | null = null;
  const kinds = new Set<string>();
  for (const [kind, kws] of MOTIFS) {
    const at = words.findIndex((w) => kws.some((kw) => w === kw || w === `${kw}s` || w === `${kw}es` || (kw.length >= 5 && w.startsWith(kw))));
    if (at < 0) continue;
    kinds.add(kind);
    if (!best || at < best.at) best = { kind, at };
  }
  // a heart that is split is the broken one
  if (best?.kind === 'heart' && kinds.has('broken')) return 'broken';
  return best?.kind ?? null;
}

function motif(g: Graphics, m: string, k: number, main: number, acc: number, det: number, R: () => number) {
  const id = m.toLowerCase();
  const kind = motifKind(m);
  const has = (...w: string[]) => w.includes(kind ?? '');
  const stroke = (w: number, color = det) => ({ width: w * k, color, cap: 'round' as const, join: 'round' as const });
  if (has('rain')) {
    // rain and sun at the same time
    g.circle(66 * k, 26 * k, 14 * k).fill(acc).stroke(stroke(2.5));
    for (let i = 0; i < 9; i++) {
      const x = (12 + i * 9) * k;
      g.moveTo(x, (12 + (i % 3) * 6) * k).lineTo(x - 6 * k, (30 + (i % 3) * 6) * k).stroke(stroke(2.5, i % 2 ? det : main));
    }
    return;
  }
  if (has('waves')) {
    for (let j = 0; j < 3; j++) {
      g.moveTo(8 * k, (24 + j * 10) * k);
      for (let x = 8; x <= 92; x += 12) g.quadraticCurveTo((x + 6) * k, (18 + j * 10) * k, (x + 12) * k, (24 + j * 10) * k);
      g.stroke(stroke(3, j === 1 ? acc : det));
    }
    return;
  }
  if (has('circus')) {
    g.poly([20 * k, 58 * k, 50 * k, 18 * k, 80 * k, 58 * k]).fill(acc).stroke(stroke(3));
    for (let i = 0; i < 4; i++) g.poly([(26 + i * 14) * k, 58 * k, 50 * k, 18 * k, (33 + i * 14) * k, 58 * k]).fill({ color: main, alpha: i % 2 ? 0 : 0.9 });
    g.moveTo(50 * k, 18 * k).lineTo(50 * k, 9 * k).stroke(stroke(3));
    g.poly([50 * k, 9 * k, 60 * k, 12 * k, 50 * k, 15 * k]).fill(det);
    return;
  }
  if (has('stars')) {
    for (let i = 0; i < 6; i++) star(g, (12 + R() * 76) * k, (10 + R() * 50) * k, (3 + R() * 7) * k, i % 2 ? acc : det);
    g.circle(70 * k, 26 * k, 12 * k).fill(acc).circle(75 * k, 22 * k, 11 * k).fill(main);
    return;
  }
  if (has('broken')) {
    heart(g, 50 * k, 38 * k, 22 * k, acc);
    g.moveTo(50 * k, 22 * k).lineTo(44 * k, 34 * k).lineTo(54 * k, 42 * k).lineTo(47 * k, 56 * k).stroke(stroke(4));
    return;
  }
  if (has('heart')) {
    heart(g, 50 * k, 38 * k, 22 * k, acc);
    g.circle(50 * k, 38 * k, 4 * k).fill(det);
    return;
  }
  if (has('fight')) {
    // two crossed claws + impact burst
    const pts: number[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const r = (i % 2 ? 14 : 26) * k;
      pts.push(50 * k + Math.cos(a) * r, 36 * k + Math.sin(a) * r);
    }
    g.poly(pts).fill(acc).stroke(stroke(2.5));
    for (const dx of [-1, 1]) for (let i = 0; i < 3; i++) g.moveTo((50 + dx * (8 + i * 5)) * k, 22 * k).lineTo((50 + dx * (2 + i * 5)) * k, 50 * k).stroke(stroke(3));
    return;
  }
  if (has('ancestral')) {
    // a mask/totem: stacked eyes
    g.roundRect(32 * k, 12 * k, 36 * k, 50 * k, 14 * k).fill(acc).stroke(stroke(3));
    for (const y of [26, 44]) {
      g.ellipse(42 * k, y * k, 5 * k, 3 * k).fill(det).ellipse(58 * k, y * k, 5 * k, 3 * k).fill(det);
    }
    g.moveTo(40 * k, 54 * k).lineTo(60 * k, 54 * k).stroke(stroke(3));
    return;
  }
  if (has('epic')) {
    g.poly([56 * k, 8 * k, 34 * k, 40 * k, 48 * k, 40 * k, 40 * k, 66 * k, 68 * k, 30 * k, 53 * k, 30 * k]).fill(acc).stroke(stroke(3));
    return;
  }
  if (has('spiral')) {
    g.moveTo(50 * k, 36 * k);
    for (let a = 0; a < Math.PI * 7; a += 0.2) g.lineTo((50 + Math.cos(a) * a * 1.25) * k, (36 + Math.sin(a) * a * 1.25) * k);
    g.stroke(stroke(3));
    return;
  }
  if (has('eye')) {
    g.ellipse(50 * k, 36 * k, 28 * k, 15 * k).fill(acc).stroke(stroke(3));
    g.circle(50 * k, 36 * k, 9 * k).fill(det);
    return;
  }
  if (has('crown')) {
    g.poly([26 * k, 50 * k, 28 * k, 24 * k, 40 * k, 38 * k, 50 * k, 18 * k, 60 * k, 38 * k, 72 * k, 24 * k, 74 * k, 50 * k]).fill(acc).stroke(stroke(3));
    return;
  }
  // unknown motif: a stable abstract mark from the motif text
  const r2 = rng(hash(id || 'motif'));
  const n = 3 + Math.floor(r2() * 4);
  for (let i = 0; i < n; i++) {
    const x = (14 + r2() * 72) * k;
    const y = (10 + r2() * 46) * k;
    if (r2() < 0.5) g.rect(x, y, (6 + r2() * 14) * k, (6 + r2() * 14) * k).fill(i % 2 ? acc : det);
    else g.circle(x, y, (3 + r2() * 8) * k).stroke(stroke(3, i % 2 ? acc : det));
  }
  void main;
}

function heart(g: Graphics, x: number, y: number, r: number, color: number) {
  g.moveTo(x, y + r * 0.9)
    .bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.6, y - r * 1.1, x, y - r * 0.35)
    .bezierCurveTo(x + r * 0.6, y - r * 1.1, x + r * 1.4, y - r * 0.1, x, y + r * 0.9)
    .fill(color)
    .stroke({ width: 3, color: INK });
}

/** a vinyl record (center at 0,0): grooves + the label in the song's colours */
export function drawVinyl(t: Pick<Track, 'id' | 'cover'> | null, r: number): Container {
  const c = new Container();
  const [, main, acc] = paletteOf(t);
  const g = new Graphics();
  g.circle(0, 0, r).fill(INK);
  for (let rr = r * 0.92; rr > r * 0.42; rr -= Math.max(2.5, r * 0.06)) g.circle(0, 0, rr).stroke({ width: 1, color: 0x3a3236, alpha: 0.9 });
  // a sheen so the spin reads
  g.moveTo(0, 0).arc(0, 0, r * 0.9, -0.5, -0.2).lineTo(0, 0).fill({ color: 0xffffff, alpha: 0.08 });
  g.moveTo(0, 0).arc(0, 0, r * 0.9, Math.PI - 0.5, Math.PI - 0.2).lineTo(0, 0).fill({ color: 0xffffff, alpha: 0.08 });
  g.circle(0, 0, r * 0.36).fill(main);
  g.rect(-r * 0.36, -r * 0.06, r * 0.72, r * 0.12).fill(acc);
  g.circle(0, 0, Math.max(2, r * 0.05)).fill(C.paper);
  c.addChild(g);
  return c;
}
