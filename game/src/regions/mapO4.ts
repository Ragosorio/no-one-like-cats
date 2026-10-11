/**
 * Oleada 4 on the sea chart (CARTA): «LAS FRONTERAS», a last sheet glued to the right of everything, whose right
 * edge is TORN — that's where the paper ends (guion 13 H62: «el borde de la CARTA, donde el papel se acaba»).
 * Nothing at all until one of its islands' flags is set (`region:suenos` H58, `region:olvidada` H60,
 * `region:umbral` H62: state/sys/rupturasO4.ts syncO4Flags), so Part I and the earlier waves never see it.
 *
 *  - Archipiélago de los Sueños: a WATERCOLOR stain (lilac, peach, mint) with a few islets, «Zzz», and the moon
 *    in its party hat.
 *  - La Isla que Nadie Recuerda: YOUR island's coast (island/layout.ts islandPlan, the same regions the 3D island
 *    is built from), drawn with a trembling graphite line, unfilled — inked and colored once you've raised it
 *    (H60 done). After H61 a line of ink runs from it to the edge (the strikethroughs pointing there).
 *  - El Umbral: at the very edge: a door ajar, a row of tiny white ships, gulls in a line, threads from the top,
 *    a magenta scribble — as the story has them (stains after H62, all gone after H63).
 *
 * MapScene calls buildMapO4(this) right after its own sheets; the islands use MapScene's own isle chrome (ribbon,
 * the red «!» when the story waits there, the «¡NUEVA ISLA!» stamp, the tap that sails there).
 */
import { Container, Graphics, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { txt } from '../ui/widgets';
import { C, F } from '../ui/theme';
import { paperTexture } from '../art/textures';
import { P, hash1 } from '../panels/campaign/common';
import { islandPoly, type Pt } from '../panels/campaign/chartArt';
import { islandPlan } from '../island/layout';
import { key } from '../island/archipelago';
import { EXPANSIONS } from '../data/content';
import { G } from '../state/game';
import { mapRegions, type MapRegion } from '../state/sys/rupturas';
import { olvidadaRuins } from '../state/sys/olvidada';
import type { RegionId } from './index';

/** the sheet's paper, its fresh ink (same family as the Rupturas sheet), graphite for what nobody remembers */
const PAPER = 0xf5f0e4;
const FRESH = 0x2c4fb8;
const GRAPHITE = 0x7a7264;
const W = 470;
const H = 820;
/** where each island sits on the sheet (sheet coords) */
const ISLE: Partial<Record<RegionId, Pt>> = {
  suenos: [190, 236],
  olvidada: [176, 548],
  umbral: [W - 92, 400],
};

interface MapHost {
  chart: Container;
  chartW: number;
  chartTop: number;
  marker?: Container;
  isleChrome(c: Container, r: MapRegion, ribbonY: number, pinAt: Pt, hit?: [number, number]): void;
}

let placed: { x: number; y: number; regions: MapRegion[] } | null = null;

/** chart position of an O4 island (MapScene.islePos asks first), null when it's not on this sheet */
export function mapO4Pos(id: RegionId): Pt | null {
  const p = ISLE[id];
  if (!p || !placed || !placed.regions.some((r) => r.id === id)) return null;
  return [placed.x + p[0], placed.y + p[1]];
}
/** the O4 islands on the chart right now (MapScene's «the story waits there» focus) */
export function mapO4Regions(): MapRegion[] {
  return placed?.regions ?? [];
}

const done = (id: string) => !!G.s?.missions?.done.includes(id);
const active = (id: string) => !!G.s?.missions?.active.includes(id);

/** build the sheet into MapScene's chart (no-op without O4 flags) */
export function buildMapO4(scene: unknown) {
  const host = scene as MapHost;
  const regions = mapRegions().filter((r) => !!ISLE[r.id]);
  placed = null;
  if (!regions.length || !host?.chart) return;
  // glued to the right of the right-most sheet (whatever sheets exist), its top level with the sea sheet
  const x0 = Math.max(1896, host.chartW - 24) - 18;
  const y0 = 196;
  placed = { x: x0, y: y0, regions };
  host.chartW = Math.max(host.chartW, x0 + W + 30);
  const sheet = new Container();
  sheet.position.set(x0, y0);
  sheet.rotation = -0.006;
  // torn RIGHT edge (the end of the paper), a straight left edge under the tape
  const shape: number[] = [0, 0, W - 30, 0];
  const n = 60;
  for (let i = 0; i <= n; i++) {
    const y = (i / n) * H;
    shape.push(W - 22 + (hash1(i * 5.13 + 2) - 0.5) * 26 + Math.sin(i * 0.9) * 6 + (i % 2 ? 4 : -3), y);
  }
  shape.push(0, H);
  const shadow = new Graphics().poly(shape).fill({ color: C.ink, alpha: 0.2 });
  shadow.position.set(8, 10);
  const base = new Graphics().poly(shape).fill(PAPER);
  const tex = new TilingSprite({ texture: paperTexture(PAPER, 512, 1.1), width: W + 40, height: H });
  const mask = new Graphics().poly(shape).fill(0xffffff);
  tex.mask = mask;
  // the torn fibers along the edge, and a little ink seeping into them
  const edge = new Graphics().poly(shape).stroke({ width: 1.4, color: P.agedEdge, alpha: 0.6 });
  const seep = new Graphics();
  for (let i = 0; i < 40; i++) {
    const y = (i / 40) * H;
    seep.moveTo(W - 34 + hash1(i * 3.7) * 8, y).lineTo(W - 22 + hash1(i * 9.1) * 10, y + 6).stroke({ width: 1, color: 0x2a2440, alpha: 0.35 });
  }
  sheet.addChild(shadow, base, tex, mask, edge, seep);
  // its frame stops short of the edge: nobody could finish drawing it
  const fr = new Graphics();
  fr.moveTo(W - 70, 22).lineTo(30, 22).lineTo(30, H - 22).lineTo(W - 70, H - 22).stroke({ width: 2.6, color: FRESH });
  fr.moveTo(W - 90, 30).lineTo(38, 30).lineTo(38, H - 30).lineTo(W - 90, H - 30).stroke({ width: 1, color: FRESH, alpha: 0.7 });
  sheet.addChild(fr);
  const ttl = txt('Las Fronteras', { fontFamily: F.news, fontSize: 42, fill: FRESH });
  ttl.anchor.set(0.5, 0);
  ttl.position.set(W / 2 - 20, 44);
  const sub = txt('Hoja del borde · más allá se acaba el papel', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 14, fill: FRESH });
  sub.anchor.set(0.5, 0);
  sub.position.set(W / 2 - 20, 98);
  sheet.addChild(ttl, sub);

  const has = (id: RegionId) => regions.find((r) => r.id === id);
  const s = has('suenos');
  if (s) sheet.addChild(suenosIsle(host, s));
  const o = has('olvidada');
  if (o) sheet.addChild(olvidadaIsle(host, o));
  // the strikethroughs gathered into one line, pointing at the edge (H61 answered)
  if (o && done('H61')) {
    const ink = new Graphics();
    const [ox, oy] = ISLE.olvidada!;
    const [ux, uy] = ISLE.umbral!;
    ink.moveTo(ox + 70, oy - 10);
    for (let i = 1; i <= 12; i++) {
      const t = i / 12;
      ink.lineTo(ox + 70 + (ux - 40 - ox - 70) * t, oy - 10 + (uy + 30 - oy + 10) * t + Math.sin(t * 9) * 5);
    }
    ink.stroke({ width: 3, color: 0x15122a, alpha: 0.75, cap: 'round' });
    sheet.addChild(ink);
  }
  const u = has('umbral');
  if (u) sheet.addChild(umbralIsle(host, u));
  // the strip that peeks out from the whole-chart view
  const tab = txt('LAS FRONTERAS ▶', { fontFamily: F.poster, fontSize: 16, fill: FRESH, letterSpacing: 3 });
  tab.anchor.set(0.5);
  tab.rotation = -Math.PI / 2;
  tab.position.set(16, H / 2);
  tab.label = 'sheetTab'; // MapScene.SHEET_TAB: the chart's handwritten notes keep off it
  sheet.addChild(tab);
  // tape over the seam
  for (const [ty, rot] of [
    [90, 0.2],
    [H - 70, -0.16],
  ] as const) {
    const t = new Graphics().rect(-34, -13, 68, 26).fill({ color: 0xf6e6a8, alpha: 0.6 }).stroke({ width: 1, color: P.agedEdge, alpha: 0.4 });
    t.position.set(4, ty);
    t.rotation = rot;
    sheet.addChild(t);
  }
  // under the boat marker (it sails over every sheet)
  const at = host.marker && host.marker.parent === host.chart ? host.chart.getChildIndex(host.marker) : host.chart.children.length;
  host.chart.addChildAt(sheet, at);
}

// ------------------------------------------------------------------ the three islands
function suenosIsle(host: MapHost, r: MapRegion) {
  const [cx, cy] = ISLE.suenos!;
  const c = new Container();
  c.position.set(cx, cy);
  const g = new Graphics();
  // watercolor: overlapping washes that bleed, a darker rim where the pigment pooled
  const washes: [number, number, number, number, number][] = [
    [-30, -6, 92, 52, 0xc9b6ec],
    [30, 10, 80, 46, 0xf5c9c0],
    [-6, 22, 70, 40, 0xa8dcc8],
  ];
  for (const [x, y, rx, ry, col] of washes) {
    g.ellipse(x, y, rx, ry).fill({ color: col, alpha: 0.42 });
    g.ellipse(x + 3, y - 2, rx * 0.97, ry * 0.95).stroke({ width: 2, color: col, alpha: 0.6 });
  }
  // the islets (one per sleeper on your island), floating
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI * 0.95 + (i / (n - 1)) * Math.PI * 0.9;
    const x = Math.cos(a) * 72;
    const y = Math.sin(a) * 34 - 4;
    const poly = islandPoly(x, y, 16 - (i % 2) * 3, 8, 13 + i * 7, 14, 0.2);
    g.poly(poly.flatMap((p) => p)).fill({ color: 0xf7f0fa, alpha: 0.95 }).stroke({ width: 1.6, color: FRESH, alpha: 0.8 });
    g.moveTo(x - 6, y + 8).lineTo(x, y + 18).lineTo(x + 6, y + 8).stroke({ width: 1.2, color: FRESH, alpha: 0.5 });
  }
  // the main island
  g.poly(islandPoly(0, 18, 34, 18, 77, 20, 0.2).flatMap((p) => p)).fill(0xf2e6d8).stroke({ width: 2.2, color: FRESH });
  // the moon in a party hat
  g.circle(96, -58, 14).fill(0xfff1c0).circle(102, -62, 12).fill({ color: 0xc9b6ec, alpha: 1 });
  g.poly([84, -70, 92, -94, 98, -68]).fill(0xff7ab8).stroke({ width: 1.2, color: FRESH });
  g.circle(92, -95, 3).fill(0xffd27a);
  c.addChild(g);
  const z = txt('z z Z', { fontFamily: F.brush, fontSize: 18, fill: 0x8a6cd8 });
  z.position.set(-96, -56);
  z.rotation = -0.2;
  c.addChild(z);
  gsap.to(z, { y: -62, alpha: 0.55, yoyo: true, repeat: -1, duration: 1.4, ease: 'sine.inOut' });
  host.isleChrome(c, r, 86, [100, -24], [130, 90]);
  return c;
}

/** YOUR island's coast (the regions that hold a ruin), projected like the 3D island: a trembling graphite line */
function olvidadaIsle(host: MapHost, r: MapRegion) {
  const [cx, cy] = ISLE.olvidada!;
  const c = new Container();
  c.position.set(cx, cy);
  const plan = islandPlan();
  const bought = new Set((G.s?.expansions?.bought ?? []).map((n) => EXPANSIONS.find((e) => e.n === n)?.id).filter(Boolean) as string[]);
  const regs = new Set<string>(['home']);
  try {
    for (const ru of olvidadaRuins()) {
      const t = plan.tiles.get(key(Math.round(ru.gx), Math.round(ru.gy)));
      if (t && (t.region === 'home' || bought.has(t.region))) regs.add(t.region);
    }
  } catch {
    /* the chart never breaks over a ruin */
  }
  const tiles = [...plan.tiles.values()].filter((t) => regs.has(t.region));
  let minU = 1e9;
  let maxU = -1e9;
  let minV = 1e9;
  let maxV = -1e9;
  for (const t of tiles) {
    minU = Math.min(minU, t.gx - t.gy);
    maxU = Math.max(maxU, t.gx - t.gy);
    minV = Math.min(minV, t.gx + t.gy);
    maxV = Math.max(maxV, t.gx + t.gy);
  }
  const ext = Math.max(1, maxU - minU + 2, (maxV - minV + 2) * 0.55);
  const k = Math.min(9, 190 / ext);
  const cu = (minU + maxU) / 2;
  const cv = (minV + maxV) / 2;
  // iso projection (like the island page): x = (u) · k, y = (v) · k/2
  const P2 = (gx: number, gy: number): Pt => [(gx - gy - cu) * k, (gx + gy - cv) * k * 0.5];
  const restored = done('H60');
  const g = new Graphics();
  const land = new Set(tiles.map((t) => key(t.gx, t.gy)));
  // fill (only once remembered), then the coast edges with a tremble, twice (a hand that isn't sure)
  if (restored) for (const t of tiles) {
    const [x, y] = P2(t.gx, t.gy);
    const q = k * 0.62;
    g.poly([x, y - q, x + q, y, x, y + q, x - q, y]).fill(0xe9ddc2);
  }
  const ink = restored ? FRESH : GRAPHITE;
  for (let pass = 0; pass < 2; pass++) {
    for (const t of tiles) {
      const [x, y] = P2(t.gx, t.gy);
      const j = (n: number) => (hash1(t.gx * 13.1 + t.gy * 7.7 + n + pass * 31) - 0.5) * (restored ? 0.6 : 1.8);
      const edges: [number, number, number, number, number, number][] = [
        [0, -1, x, y - k * 0.5, x + k * 0.5, y],
        [1, 0, x + k * 0.5, y, x, y + k * 0.5],
        [0, 1, x, y + k * 0.5, x - k * 0.5, y],
        [-1, 0, x - k * 0.5, y, x, y - k * 0.5],
      ];
      for (const [dx, dy, ax, ay, bx, by] of edges) {
        if (land.has(key(t.gx + dx, t.gy + dy))) continue;
        g.moveTo(ax + j(1), ay + j(2)).lineTo(bx + j(3), by + j(4));
      }
    }
    g.stroke({ width: pass ? 1 : 1.8, color: ink, alpha: pass ? 0.5 : 0.9 });
  }
  // the ruins: little crosses where your habitats are (circles once raised)
  try {
    for (const ru of olvidadaRuins()) {
      if (ru.kind !== 'habitat') continue;
      const [x, y] = P2(ru.gx + 1, ru.gy + 1);
      if (restored) g.circle(x, y, 4).fill(0xffd27a).stroke({ width: 1.4, color: FRESH });
      else g.moveTo(x - 4, y - 4).lineTo(x + 4, y + 4).moveTo(x + 4, y - 4).lineTo(x - 4, y + 4).stroke({ width: 1.6, color: GRAPHITE });
    }
  } catch {
    /* ignore */
  }
  c.addChild(g);
  const note = txt(restored ? 'Ahora alguien sí llegó.' : '¿…la conoces?', { fontFamily: F.brush, fontSize: 15, fill: restored ? FRESH : GRAPHITE });
  note.anchor.set(0.5);
  note.position.set(0, -76);
  note.rotation = -0.04;
  c.addChild(note);
  host.isleChrome(c, r, 92, [96, -40], [120, 90]);
  return c;
}

function umbralIsle(host: MapHost, r: MapRegion) {
  const [cx, cy] = ISLE.umbral!;
  const c = new Container();
  c.position.set(cx, cy);
  const g = new Graphics();
  const forces = !done('H63');
  // threads from the top of the sheet (Titiriteros)
  if (forces) for (let i = 0; i < 5; i++) g.moveTo(-40 + i * 22, -220).lineTo(-36 + i * 20, -40 + (i % 2) * 20).stroke({ width: 1, color: 0xd99a2b, alpha: 0.7 });
  // the rock and the door, ajar
  g.poly(islandPoly(0, 10, 34, 16, 91, 18, 0.25).flatMap((p) => p)).fill(0xd8d2c4).stroke({ width: 2, color: FRESH });
  g.rect(-14, -46, 28, 52).fill(0xf6f2e8).stroke({ width: 2.4, color: FRESH });
  g.poly([-11, -43, 6, -38, 6, 3, -11, 3]).fill(0xe6dccb).stroke({ width: 1.6, color: FRESH });
  g.rect(-12, -2, 4, 4).fill(0xd99a2b);
  g.moveTo(-1, 3).arc(-1, 3, 4, Math.PI, 0).stroke({ width: 1.4, color: FRESH });
  // the white fleet in a row (west of the door), gulls in a line above it
  if (forces) {
    for (let i = 0; i < 5; i++) {
      const x = -150 + i * 22;
      const y = 44;
      g.poly([x - 8, y, x + 8, y, x + 5, y + 5, x - 5, y + 5]).fill(0xffffff).stroke({ width: 1.2, color: FRESH });
      g.rect(x - 0.6, y - 12, 1.2, 12).fill(FRESH);
      g.rect(x - 5, y - 11, 10, 7).fill(0xffffff).stroke({ width: 1, color: FRESH });
      if (done('H62')) g.circle(x + 2, y + 2, 2.4).fill(0x15122a);
    }
    for (let i = 0; i < 6; i++) {
      const x = -150 + i * 16;
      g.moveTo(x - 4, 14).lineTo(x, 17).lineTo(x + 4, 14).stroke({ width: 1.2, color: 0x3a3a48 });
    }
    // a magenta scribble on the rock (Disruptores), from H63
    if (active('H63')) g.moveTo(12, 12).lineTo(18, 4).lineTo(22, 14).lineTo(28, 2).lineTo(32, 12).stroke({ width: 2.4, color: 0xff3ad0 });
  }
  c.addChild(g);
  const nada = txt('aquí no hay nada · todavía', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 13, fill: FRESH });
  nada.anchor.set(0.5);
  nada.rotation = -Math.PI / 2;
  nada.position.set(62, -40);
  nada.alpha = 0.8;
  c.addChild(nada);
  host.isleChrome(c, r, 58, [-30, -60], [110, 90]);
  return c;
}
