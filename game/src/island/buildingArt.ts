/**
 * Island building art (code-drawn, poster flat colors + ink). Every function returns containers whose
 * origin is the CENTER of the building's anchor tile (isoToScreen(gx, gy) of its top-left tile).
 */
import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { TW, TH } from './iso';
import { C, F } from '../ui/theme';
import { txt } from '../ui/widgets';
import { elementFx } from '../art/catArt';
import { glowTexture } from '../art/textures';
import { elementIcon } from '../ui/elementIcon';
import { DROP, shade, mixColor } from './terrain';
import { TIER_FENCE, Tick, anclaDimensional, nucleoCelestial, santuarioArcano, tronoMultiversal, wallEdge, yardForTier } from './habitatTiers';
import { settings } from '../core/settings';
import { pal, rng, hashStr } from './habitats/kit';
import { Ambient } from './habitats/ambient';
import { drawBiome } from './habitats/biomes';

const INK = { width: 3, color: C.ink, join: 'round' as const, cap: 'round' as const };
const THIN = { width: 2, color: C.ink, join: 'round' as const, cap: 'round' as const };
const hw = TW / 2;
const hh = TH / 2;

/** tile coords (relative to anchor tile center) → local px */
export const P = (gx: number, gy: number) => ({ x: (gx - gy) * hw, y: (gx + gy) * hh });

export function centerOf(fw: number, fh: number) {
  return P(fw / 2 - 0.5, fh / 2 - 0.5);
}

/** iso box occupying [ox, ox+fw]×[oy, oy+fh] (tile units, corners at -0.5) */
export function isoBoxAt(g: Graphics, ox: number, oy: number, fw: number, fh: number, height: number, color: number, inset = 0.12, lift = 0) {
  const i = inset;
  const top = P(ox + i - 0.5, oy + i - 0.5);
  const right = P(ox + fw - 0.5 - i, oy + i - 0.5);
  const bottom = P(ox + fw - 0.5 - i, oy + fh - 0.5 - i);
  const left = P(ox + i - 0.5, oy + fh - 0.5 - i);
  for (const p of [top, right, bottom, left]) p.y -= lift;
  const up = (p: { x: number; y: number }) => ({ x: p.x, y: p.y - height });
  const tT = up(top);
  const tR = up(right);
  const tB = up(bottom);
  const tL = up(left);
  g.poly([tL.x, tL.y, tB.x, tB.y, bottom.x, bottom.y, left.x, left.y]).fill(shade(color, 0.8)).stroke(INK);
  g.poly([tB.x, tB.y, tR.x, tR.y, right.x, right.y, bottom.x, bottom.y]).fill(shade(color, 0.62)).stroke(INK);
  g.poly([tT.x, tT.y, tR.x, tR.y, tB.x, tB.y, tL.x, tL.y]).fill(color).stroke(INK);
  return { tT, tR, tB, tL, top, right, bottom, left };
}
export function isoBox(g: Graphics, fw: number, fh: number, height: number, color: number, inset = 0.12) {
  return isoBoxAt(g, 0, 0, fw, fh, height, color, inset);
}

/** Diamond footprint fill (ground decal) */
export function footprint(g: Graphics, fw: number, fh: number, color: number, alpha = 1, inset = 0.05, stroke = true) {
  const a = P(inset - 0.5, inset - 0.5);
  const b = P(fw - 0.5 - inset, inset - 0.5);
  const c = P(fw - 0.5 - inset, fh - 0.5 - inset);
  const d = P(inset - 0.5, fh - 0.5 - inset);
  g.poly([a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y]).fill({ color, alpha });
  if (stroke) g.poly([a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y]).stroke({ width: 3, color: C.ink, alpha: 0.7, join: 'round' });
  return { a, b, c, d };
}

function dashedPoly(g: Graphics, pts: { x: number; y: number }[], dash = 14, gap = 10, style = { width: 3, color: C.ink, alpha: 0.6 }) {
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const ux = (b.x - a.x) / len;
    const uy = (b.y - a.y) / len;
    for (let d = 0; d < len; d += dash + gap) {
      const e = Math.min(len, d + dash);
      g.moveTo(a.x + ux * d, a.y + uy * d).lineTo(a.x + ux * e, a.y + uy * e);
    }
  }
  g.stroke({ ...style, cap: 'round' });
}

// =====================================================================================  HABITAT
export interface HabitatParts {
  ground: Container;
  back: Container;
  front: Container;
  /** local point above the house roof (for bubbles) */
  roof: { x: number; y: number };
  /** tier fx animation (lanterns, motes, beams…) — call every frame with the time in seconds */
  tick?: Tick;
  /** the yard's gold was just collected: a short element burst (particles, glows, a ring) */
  react?: () => void;
  /** tile (gx = gy) where the house stands — cats keep off it */
  houseTile: number;
}

/** where the house stands in an N×N yard (back corner; bigger yards push it in so the biome fits behind) */
export function houseTileFor(N: number, tier: number) {
  return N <= 3 ? (tier >= 7 ? 0.3 : 0.15) : N === 4 ? 0.55 : 0.85;
}

function fenceEdge(g: Graphics, a: { gx: number; gy: number }, b: { gx: number; gy: number }, color: number, gapAt = -1) {
  const n = Math.round(Math.hypot(b.gx - a.gx, b.gy - a.gy) * 3);
  const pts: { x: number; y: number }[] = [];
  for (let k = 0; k <= n; k++) {
    const f = k / n;
    pts.push(P(a.gx + (b.gx - a.gx) * f, a.gy + (b.gy - a.gy) * f));
  }
  const skip = (k: number) => gapAt >= 0 && Math.abs(k - gapAt) <= 1;
  // rails
  for (const h of [9, 18]) {
    for (let k = 0; k < n; k++) {
      if (skip(k) || skip(k + 1)) continue;
      g.moveTo(pts[k].x, pts[k].y - h).lineTo(pts[k + 1].x, pts[k + 1].y - h);
    }
    g.stroke({ width: 5, color: C.ink, cap: 'round' });
    for (let k = 0; k < n; k++) {
      if (skip(k) || skip(k + 1)) continue;
      g.moveTo(pts[k].x, pts[k].y - h).lineTo(pts[k + 1].x, pts[k + 1].y - h);
    }
    g.stroke({ width: 2.2, color, cap: 'round' });
  }
  for (let k = 0; k <= n; k++) {
    if (skip(k) && k !== gapAt - 2 && k !== gapAt + 2) continue;
    const p = pts[k];
    g.poly([p.x - 3.5, p.y, p.x - 3.5, p.y - 22, p.x, p.y - 26, p.x + 3.5, p.y - 22, p.x + 3.5, p.y]).fill(color).stroke(THIN);
  }
}

export function habitatParts(element: string, tier: number, fw = 3, fh = 3, building = false): HabitatParts {
  const fx = elementFx(element);
  const T = Math.max(1, Math.min(10, Math.round(tier) || 1));
  const N = Math.max(1, Math.min(fw, fh));
  const pl = pal(element);
  const ground = new Container();
  const back = new Container();
  const front = new Container();
  const ht = houseTileFor(N, T);
  // ---- ground: the element's floor (soil + biome materials) + inner path
  const gg = new Graphics();
  footprint(gg, fw, fh, building ? mixColor(fx.main, 0xede4d6, 0.62) : pl.soil, 0.95, 0.04);
  const inner = building ? mixColor(fx.main, 0xffffff, 0.75) : pl.soil2;
  const a = P(0.25, 0.25);
  const b = P(fw - 1.25, 0.25);
  const c = P(fw - 1.25, fh - 1.25);
  const d = P(0.25, fh - 1.25);
  gg.poly([a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y]).fill({ color: inner, alpha: building ? 0.55 : 0.4 });
  ground.addChild(gg);
  // ---- the element biome (materials, structures, ambient life) — grows with the tier stage
  const stage = (T <= 3 ? 0 : T <= 6 ? 1 : T <= 9 ? 2 : 3) as 0 | 1 | 2 | 3;
  const houseScale = (building ? 1 : 1 + (T - 1) * 0.03) * (N === 4 ? 1.12 : N >= 5 ? 1.22 : 1);
  const hp = P(ht, ht);
  const house = habitatHouse(element, T);
  const roofY = hp.y + house.top * houseScale;
  const amb = new Ambient(rng(hashStr(`${element}:${T}:${N}`)));
  const bio = building
    ? null
    : {
        el: element,
        tier: T,
        stage,
        N,
        pal: pl,
        r: rng(hashStr(`${element}/${T}/${N}`)),
        gnd: new Graphics(),
        bk: new Graphics(),
        crown: new Graphics(),
        fr: new Graphics(),
        gFx: new Container(),
        bFx: new Container(),
        cFx: new Container(),
        fFx: new Container(),
        amb,
        ticks: [] as Tick[],
        house: hp,
        roofY,
      };
  if (bio) {
    drawBiome(bio);
    ground.addChild(bio.gnd, bio.gFx);
  }
  // stepping stones to the gate
  const stones = new Graphics();
  for (let k = 0; k < 3; k++) {
    const p = P(0.6 + k * 0.45, fh - 0.9 + k * 0.18);
    stones.ellipse(p.x, p.y, 10, 5).fill(building ? 0xf7f0e2 : pl.rockLit).stroke({ width: 2, color: C.ink, alpha: 0.6 });
  }
  ground.addChild(stones);
  // a yarn ball to chase
  if (!building) {
    const yb = new Graphics();
    const yp = P(fw - 1.6, fh - 1.3);
    const col = [0xff7ab8, 0xe8879a, 0xa7e8d7, 0xffc94a][(element.length + T) % 4];
    yb.moveTo(yp.x + 8, yp.y + 2).quadraticCurveTo(yp.x + 30, yp.y + 14, yp.x + 46, yp.y + 2).stroke({ width: 2, color: col });
    yb.circle(yp.x, yp.y - 6, 9).fill(col).stroke({ width: 2.5, color: C.ink });
    yb.moveTo(yp.x - 6, yp.y - 10).quadraticCurveTo(yp.x, yp.y - 2, yp.x + 6, yp.y - 11).stroke({ width: 1.5, color: C.ink, alpha: 0.6 });
    yb.moveTo(yp.x - 7, yp.y - 4).quadraticCurveTo(yp.x + 1, yp.y + 2, yp.x + 7, yp.y - 5).stroke({ width: 1.5, color: C.ink, alpha: 0.6 });
    ground.addChild(yb);
    // food bowl
    const bw = new Graphics();
    const bp = P(0.9, fh - 1.1);
    bw.ellipse(bp.x, bp.y, 14, 6).fill(C.red).stroke({ width: 2.5, color: C.ink });
    bw.ellipse(bp.x, bp.y - 2, 10, 3.5).fill(0x7fd8ff);
    ground.addChild(bw);
    // the collect ring (hidden until gold is collected)
    const ring = new Graphics();
    const ctr = centerOf(fw, fh);
    ring.ellipse(0, 0, N * 64, N * 32).stroke({ width: 6, color: fx.accent, alpha: 0.9 }).ellipse(0, 0, N * 52, N * 26).stroke({ width: 3, color: 0xffffff, alpha: 0.8 });
    ring.position.set(ctr.x, ctr.y);
    ground.addChild(ring);
    amb.setRing(ring);
  }
  if (building) {
    const dg = new Graphics();
    dashedPoly(dg, [P(-0.45, -0.45), P(fw - 0.55, -0.45), P(fw - 0.55, fh - 0.55), P(-0.45, fh - 0.55)]);
    ground.addChild(dg);
  }
  // ---- behind the fence: the biome backdrop and the tall pieces rising behind the house
  if (bio) back.addChild(bio.bk, bio.bFx, bio.crown, bio.cFx);
  // ---- fences (T5+: a low stone wall with caps)
  const fcol = TIER_FENCE[Math.min(TIER_FENCE.length - 1, T)];
  const wall = T >= 5 && !building;
  const cap = T >= 10 ? 0xffd36a : C.gold;
  const edge = (g: Graphics, a: { gx: number; gy: number }, b: { gx: number; gy: number }, gap = -1) => (wall ? wallEdge(g, a, b, fcol, cap, gap) : fenceEdge(g, a, b, fcol, gap));
  const fb = new Graphics();
  edge(fb, { gx: -0.45, gy: -0.45 }, { gx: fw - 0.55, gy: -0.45 });
  edge(fb, { gx: -0.45, gy: -0.45 }, { gx: -0.45, gy: fh - 0.55 });
  back.addChild(fb);
  const ff = new Graphics();
  edge(ff, { gx: fw - 0.55, gy: -0.45 }, { gx: fw - 0.55, gy: fh - 0.55 });
  edge(ff, { gx: -0.45, gy: fh - 0.55 }, { gx: fw - 0.55, gy: fh - 0.55 }, 4);
  front.addChild(ff);
  // element sign on the front fence
  const sp = P(fw - 0.55, fh * 0.55);
  const sign = new Container();
  const sg = new Graphics().rect(-17, -40, 34, 30).fill(C.ink).rect(-19, -43, 34, 30).fill(C.paper).stroke(THIN);
  sg.rect(-2, -14, 4, 14).fill(0x8a5a2e).stroke(THIN);
  const em = elementIcon(element, 24);
  em.position.set(-2, -28);
  sign.addChild(sg, em);
  // tier badge under the sign (so the level reads from across the island)
  if (!building) {
    const tb = new Graphics();
    const tw = T >= 10 ? 34 : 28;
    tb.roundRect(-tw / 2 + 2, -8, tw, 20, 6).fill(C.ink);
    tb.roundRect(-tw / 2, -10, tw, 20, 6).fill(T >= 8 ? 0xffd36a : T >= 5 ? C.yellow : C.paper).stroke(THIN);
    const tt = txt(String(T), { fontFamily: F.heavy, fontSize: 14, fill: C.ink });
    tt.anchor.set(0.5);
    tt.position.set(0, 0);
    const badge = new Container();
    badge.addChild(tb, tt);
    badge.position.set(-2, -6);
    sign.addChild(badge);
  }
  sign.position.set(sp.x + 4, sp.y);
  front.addChild(sign);
  if (bio) front.addChild(bio.fr, bio.fFx);
  // ---- house at the back corner (grows with every tier and with the yard)
  house.c.position.set(hp.x, hp.y);
  house.c.scale.set(houseScale);
  back.addChild(house.c);
  // element prop on the right corner
  const prop = elementProp(element);
  const pp = P(fw - 1.1, 0.1);
  prop.c.position.set(pp.x, pp.y);
  back.addChild(prop.c);
  // ---- tier ornaments (cumulative): pots, bunting, feature, banners, arch, runes, beam, rocks, halo
  const yard = building ? null : yardForTier(element, T, fw, fh, ground, back, front, { x: hp.x, y: hp.y, roofY });
  if (bio) front.addChild(amb.layer);
  const parts: Tick[] = [];
  if (yard) parts.push(yard);
  if (!building && prop.tick) parts.push(prop.tick);
  if (bio) parts.push(...bio.ticks);
  let frozen = false;
  const tick: Tick | undefined =
    building && !parts.length
      ? undefined
      : (t) => {
          if (settings.reduceMotion) {
            // still life: draw every animated piece once, then only the (static) glows + collect ring
            if (!frozen) {
              frozen = true;
              for (const f of parts) f(0);
            }
          } else {
            frozen = false;
            for (const f of parts) f(t);
          }
          if (bio) amb.tick(t);
        };
  return { ground, back, front, roof: { x: hp.x, y: roofY }, tick, react: bio ? () => amb.react() : undefined, houseTile: ht };
}

const stepped = (t: number) => Math.floor(t * 12) / 12;

/** element-flavored yard prop (+ an optional little animation for the Parte 2 elements) */
function elementProp(el: string): { c: Container; tick?: Tick } {
  const c = new Container();
  const g = new Graphics();
  const fx = elementFx(el);
  c.addChild(g);
  let tick: Tick | undefined;
  g.ellipse(0, 2, 16, 6).fill({ color: C.ink, alpha: 0.15 });
  switch (el) {
    case 'fire': {
      g.poly([-12, 0, -9, -14, 9, -14, 12, 0]).fill(0x6b6b6b).stroke(THIN);
      g.moveTo(-8, -14).bezierCurveTo(-10, -30, 0, -28, 0, -40).bezierCurveTo(4, -28, 12, -30, 8, -14).closePath().fill(C.orange).stroke(THIN);
      g.moveTo(-3, -14).bezierCurveTo(-4, -22, 0, -22, 0, -28).bezierCurveTo(2, -22, 5, -22, 3, -14).closePath().fill(C.yellow);
      const gl = new Sprite(glowTexture());
      gl.anchor.set(0.5);
      gl.tint = C.orange;
      gl.alpha = 0.5;
      gl.scale.set(0.6);
      gl.y = -22;
      c.addChildAt(gl, 0);
      break;
    }
    case 'water':
      g.ellipse(0, 0, 22, 10).fill(0x7fd8ff).stroke(INK);
      g.ellipse(-4, -1, 8, 3).fill({ color: 0xffffff, alpha: 0.6 });
      g.ellipse(14, -4, 5, 3).fill(0x5fbf4a).stroke({ width: 1.5, color: C.ink });
      break;
    case 'nature':
      for (const [x, col] of [
        [-10, 0xff7ab8],
        [0, C.yellow],
        [10, 0xffffff],
      ] as const) {
        g.moveTo(x, 0).lineTo(x, -16).stroke({ width: 2.5, color: 0x3f7a3a });
        for (let k = 0; k < 5; k++) {
          const ang = (k / 5) * Math.PI * 2;
          g.circle(x + Math.cos(ang) * 5, -18 + Math.sin(ang) * 4, 3.4).fill(col).stroke({ width: 1, color: C.ink });
        }
        g.circle(x, -18, 2.5).fill(C.orange);
      }
      break;
    case 'earth': {
      // rock cairn + a fossil bone sticking out (Gea approves)
      g.poly([-16, 0, -14, -10, -4, -14, 6, -12, 14, -4, 12, 2]).fill(0x9a8f80).stroke(THIN);
      g.poly([-10, -12, -8, -22, 0, -26, 8, -20, 6, -12]).fill(0xb7a99a).stroke(THIN);
      g.poly([-4, -24, -2, -32, 4, -32, 4, -24]).fill(0x8d8676).stroke(THIN);
      g.moveTo(8, -6).lineTo(22, -14).stroke({ width: 5, color: C.ink, cap: 'round' });
      g.moveTo(8, -6).lineTo(22, -14).stroke({ width: 2.5, color: 0xf2e6cf, cap: 'round' });
      g.circle(23, -16, 3).fill(0xf2e6cf).stroke({ width: 1.5, color: C.ink });
      g.circle(21, -12, 3).fill(0xf2e6cf).stroke({ width: 1.5, color: C.ink });
      const cr = new Graphics();
      cr.poly([-18, -2, -22, -12, -16, -20, -13, -8]).fill(fx.accent).stroke(THIN);
      c.addChild(cr);
      break;
    }
    case 'storm': {
      // tesla coil with a tiny grumpy cloud
      g.rect(-5, -30, 10, 30).fill(0x6b6b6b).stroke(THIN);
      for (let y = -26; y < 0; y += 6) g.moveTo(-7, y).lineTo(7, y + 2).stroke({ width: 2, color: 0xb87333 });
      g.circle(0, -36, 8).fill(0xd9d9d9).stroke(THIN);
      const cloud = new Graphics();
      for (const [x, y, r] of [
        [-12, -58, 9],
        [0, -62, 11],
        [12, -58, 9],
      ])
        cloud.circle(x, y, r).fill(0x5a6476).stroke(THIN);
      cloud.rect(-12, -58, 24, 8).fill(0x5a6476);
      cloud.poly([2, -50, -4, -42, 1, -42, -3, -34, 6, -44, 1, -44, 5, -50]).fill(C.yellow).stroke({ width: 1.5, color: C.ink });
      const gl = new Sprite(glowTexture());
      gl.anchor.set(0.5);
      gl.tint = fx.accent;
      gl.alpha = 0.45;
      gl.scale.set(0.5);
      gl.y = -38;
      c.addChildAt(gl, 0);
      c.addChild(cloud);
      break;
    }
    case 'magic': {
      g.rect(-8, -14, 16, 14).fill(0x5c3d5b).stroke(THIN);
      const book = new Graphics();
      book.poly([-16, -34, 0, -30, 16, -34, 16, -24, 0, -20, -16, -24]).fill(C.paper).stroke(THIN);
      book.moveTo(0, -30).lineTo(0, -20).stroke({ width: 2, color: C.ink });
      book.star(0, -46, 4, 6, 2.5).fill(fx.accent).stroke({ width: 1.5, color: C.ink });
      c.addChild(book);
      break;
    }
    case 'cosmic': {
      g.circle(0, -20, 12).fill(0x372347).stroke(THIN);
      g.ellipse(0, -20, 22, 6).stroke({ width: 3, color: fx.accent });
      g.circle(-4, -24, 3).fill({ color: 0xffffff, alpha: 0.6 });
      g.star(14, -38, 4, 5, 2).fill(C.yellow).stroke({ width: 1.5, color: C.ink });
      break;
    }
    case 'ice': {
      // a tiny igloo + a cluster of ice crystals that glint
      g.moveTo(-22, 0).bezierCurveTo(-22, -30, 10, -30, 10, 0).closePath().fill(0xeaf6ff).stroke(INK);
      for (const y of [-8, -16]) g.moveTo(-20 + (y === -16 ? 3 : 0), y).quadraticCurveTo(-6, y - 4, 8 - (y === -16 ? 3 : 0), y);
      g.moveTo(-14, -8).lineTo(-12, -16).moveTo(0, -8).lineTo(-2, -16).moveTo(-7, -16).lineTo(-7, -22);
      g.stroke({ width: 1.5, color: 0x4fa3d9 });
      g.moveTo(-12, 0).bezierCurveTo(-12, -12, 0, -12, 0, 0).closePath().fill(0x1f2b4a).stroke(THIN);
      for (const [x, h, w] of [
        [14, 30, 6],
        [22, 20, 5],
        [7, 16, 4],
      ] as const) {
        g.poly([x - w, 0, x - w, -h * 0.7, x, -h, x + w, -h * 0.7, x + w, 0]).fill(0x9fe8ff).stroke(THIN);
        g.moveTo(x, -h + 2).lineTo(x, -2).stroke({ width: 1.5, color: 0xffffff, alpha: 0.8 });
      }
      const gl = new Sprite(glowTexture());
      gl.anchor.set(0.5);
      gl.tint = fx.accent;
      gl.alpha = 0.35;
      gl.scale.set(0.5);
      gl.position.set(14, -16);
      c.addChildAt(gl, 0);
      const glint = new Graphics().star(0, 0, 4, 6, 1.5).fill(0xffffff).stroke({ width: 1, color: C.ink });
      glint.position.set(15, -29);
      c.addChild(glint);
      tick = (t) => {
        const k = (stepped(t) * 0.7) % 1;
        glint.visible = k < 0.25;
        glint.scale.set(0.5 + Math.sin(k * Math.PI * 4) * 0.5);
        gl.alpha = 0.3 + Math.sin(stepped(t) * 2) * 0.08;
      };
      break;
    }
    case 'sound': {
      // a stack of riso-pink speakers; the woofer thumps and a note floats up
      const box = (x: number, y: number, w: number, h: number) => {
        g.rect(x + 3, y + 3, w, h).fill(C.ink);
        g.rect(x, y, w, h).fill(0x231626).stroke(THIN);
      };
      box(-20, -24, 26, 24);
      box(-16, -44, 18, 20);
      box(8, -16, 16, 16);
      g.circle(-7, -36, 4.5).fill(0x2ec4e6).stroke({ width: 1.5, color: C.ink });
      g.circle(16, -8, 4).fill(0xffd400).stroke({ width: 1.5, color: C.ink });
      g.rect(-20, -27, 26, 3).fill(0xff2e88);
      const woofer = new Graphics();
      woofer.circle(0, 0, 9).fill(0xff2e88).stroke(THIN);
      woofer.circle(0, 0, 3.5).fill(C.ink);
      woofer.position.set(-7, -12);
      const note = new Graphics();
      note.ellipse(0, 0, 4.5, 3.4).fill(0xffd400).stroke({ width: 1.5, color: C.ink });
      note.rect(3, -14, 2.5, 14).fill(C.ink);
      note.poly([3, -14, 10, -9, 4, -9]).fill(C.ink);
      c.addChild(woofer, note);
      tick = (t) => {
        const s = stepped(t);
        woofer.scale.set(Math.floor(s * 4) % 2 ? 1.12 : 1);
        const k = (s * 0.5) % 1;
        note.position.set(10 + Math.sin(k * 8) * 4, -46 - k * 26);
        note.alpha = 1 - k;
      };
      break;
    }
    case 'shadow': {
      // a paper lantern (andon) with a cat silhouette prowling across its paper
      g.rect(-2, -6, 4, 6).fill(0x2a2433);
      g.poly([-14, 0, 14, 0, 10, -6, -10, -6]).fill(0x2a2433).stroke(THIN);
      const gl = new Sprite(glowTexture());
      gl.anchor.set(0.5);
      gl.tint = 0xffd9a0;
      gl.alpha = 0.45;
      gl.scale.set(0.7);
      gl.y = -24;
      c.addChildAt(gl, 0);
      g.rect(-13, -44, 26, 38).fill(0xfff3d6).stroke(INK);
      g.moveTo(0, -44).lineTo(0, -6).moveTo(-13, -25).lineTo(13, -25).stroke({ width: 1.5, color: 0x2a2433, alpha: 0.5 });
      g.rect(-16, -48, 32, 5).fill(0x2a2433).stroke(THIN);
      g.circle(9, -40, 3).fill(0xc8102e);
      g.moveTo(14, -46).lineTo(18, -40).stroke({ width: 2, color: 0xc8102e });
      const cat = new Graphics();
      cat.ellipse(0, 0, 6, 3.5).fill(0x0d110f);
      cat.circle(5, -3.5, 3).fill(0x0d110f);
      cat.poly([3, -5.5, 3.5, -9, 5.5, -6]).fill(0x0d110f);
      cat.poly([6, -6, 8, -9, 8, -5]).fill(0x0d110f);
      cat.moveTo(-5, 0).quadraticCurveTo(-10, -2, -9, -8).stroke({ width: 1.8, color: 0x0d110f, cap: 'round' });
      cat.position.set(0, -12);
      c.addChild(cat);
      tick = (t) => {
        const s = stepped(t) * 0.6;
        const x = Math.sin(s) * 3.5;
        cat.x = x;
        cat.scale.x = Math.cos(s) >= 0 ? 1 : -1;
        cat.y = -12 + (Math.floor(stepped(t) * 6) % 2 ? -0.6 : 0);
        gl.alpha = 0.42 + Math.sin(stepped(t) * 5) * 0.05;
      };
      break;
    }
    case 'time': {
      // an hourglass on a stone pedestal: the sand runs, then it flips
      g.poly([-12, 0, 12, 0, 9, -6, -9, -6]).fill(0xb7a99a).stroke(THIN);
      g.rect(-6, -22, 12, 16).fill(0xd9c29a).stroke(THIN);
      g.poly([-10, -22, 10, -22, 8, -27, -8, -27]).fill(0xb7a99a).stroke(THIN);
      const hg = new Container();
      hg.position.set(0, -44);
      const frame = new Graphics();
      frame.moveTo(-7, -15).bezierCurveTo(-7, -6, -2, -3, -1.5, 0).bezierCurveTo(-2, 3, -7, 6, -7, 15).lineTo(7, 15).bezierCurveTo(7, 6, 2, 3, 1.5, 0).bezierCurveTo(2, -3, 7, -6, 7, -15).closePath().fill({ color: 0xf7ebd0, alpha: 0.9 }).stroke(THIN);
      const sand = new Graphics();
      const cap = new Graphics();
      cap.rect(-10, -18, 20, 4).fill(0x6b4f2a).stroke({ width: 1.5, color: C.ink });
      cap.rect(-10, 14, 20, 4).fill(0x6b4f2a).stroke({ width: 1.5, color: C.ink });
      cap.rect(-9, -15, 2, 29).fill(0x6b4f2a);
      cap.rect(7, -15, 2, 29).fill(0x6b4f2a);
      hg.addChild(frame, sand, cap);
      c.addChild(hg);
      const drawSand = (k: number) => {
        sand.clear();
        const top = 1 - k;
        if (top > 0.02) sand.poly([-5 * top, -2 - 9 * top, 5 * top, -2 - 9 * top, 0, -1.5]).fill(0xe0b77a);
        if (k > 0.02) sand.poly([-6, 14, 6, 14, 0, 14 - 10 * k]).fill(0xe0b77a);
        if (k < 0.98) sand.rect(-0.6, -1, 1.2, 15 - 10 * k).fill(0xe0b77a);
      };
      drawSand(0);
      let last = -1;
      tick = (t) => {
        const s = stepped(t) % 7;
        const k = Math.min(1, s / 6);
        const q = Math.round(k * 12);
        if (q !== last) {
          last = q;
          drawSand(q / 12);
        }
        hg.rotation = s > 6 ? ((s - 6) / 1) * Math.PI : 0;
      };
      break;
    }
    case 'light': {
      // a lighthouse lens on a post: stained-glass panes in gold leading, the beam sweeps
      g.rect(-3, -26, 6, 26).fill(0xb89558).stroke(THIN);
      g.poly([-10, 0, 10, 0, 6, -6, -6, -6]).fill(0xb89558).stroke(THIN);
      const beam = new Graphics();
      beam.poly([0, 0, 60, -12, 60, 12]).fill({ color: 0xfff8e1, alpha: 0.55 });
      beam.position.set(0, -38);
      beam.blendMode = 'add';
      c.addChild(beam);
      const lens = new Graphics();
      lens.roundRect(-12, -52, 24, 28, 6).fill(0xffd77a).stroke(INK);
      const panes = [0xe8879a, 0x7fd8ff, 0xffffff, 0xffd77a, 0xb59cff, 0xe8879a];
      for (let k = 0; k < 6; k++) lens.rect(-9 + (k % 3) * 6, -48 + Math.floor(k / 3) * 12, 6, 12).fill(panes[k]).stroke({ width: 1.5, color: 0xb89558 });
      lens.poly([-12, -52, 0, -60, 12, -52]).fill(0xb89558).stroke(THIN);
      lens.circle(0, -62, 2.5).fill(0xffd77a).stroke({ width: 1, color: C.ink });
      c.addChild(lens);
      const gl = new Sprite(glowTexture());
      gl.anchor.set(0.5);
      gl.tint = 0xffd77a;
      gl.alpha = 0.55;
      gl.scale.set(0.6);
      gl.y = -38;
      c.addChildAt(gl, 0);
      tick = (t) => {
        const a = Math.sin(stepped(t) * 1.2);
        beam.scale.x = a;
        beam.alpha = 0.3 + Math.abs(a) * 0.6;
        gl.alpha = 0.45 + Math.abs(a) * 0.2;
      };
      break;
    }
    case 'void': {
      // a little black hole hovering over the grass: pink event horizon, TV snow inside
      g.ellipse(0, 0, 14, 5).fill({ color: C.ink, alpha: 0.25 });
      const hole = new Container();
      hole.position.set(0, -26);
      const ring = new Graphics();
      ring.ellipse(0, 0, 20, 7).stroke({ width: 6, color: C.ink }).ellipse(0, 0, 20, 7).stroke({ width: 3, color: 0xff2e88 });
      const core = new Graphics().circle(0, 0, 12).fill(0x0d110f).stroke({ width: 2.5, color: 0xffffff });
      const snow = new Graphics();
      const front = new Graphics().arc(0, 0, 20, 0.15, Math.PI - 0.15).stroke({ width: 3, color: 0xff2e88 });
      front.scale.y = 0.35;
      hole.addChild(ring, core, snow, front);
      c.addChild(hole);
      let last = -1;
      tick = (t) => {
        const s = stepped(t);
        hole.y = -26 + Math.sin(s * 1.6) * 3;
        hole.rotation = Math.sin(s * 0.8) * 0.12;
        const f = Math.floor(s * 12);
        if (f === last) return;
        last = f;
        snow.clear();
        for (let k = 0; k < 9; k++) {
          const a = Math.random() * Math.PI * 2;
          const d = Math.random() * 9;
          snow.rect(Math.cos(a) * d - 1.5, Math.sin(a) * d, 3, 1.2).fill({ color: 0xffffff, alpha: 0.5 + Math.random() * 0.5 });
        }
      };
      break;
    }
    case 'crystal': {
      // a little prism on a nacre shell: a white beam goes in, a fan of colours comes out (and sweeps)
      g.moveTo(-14, 0).quadraticCurveTo(0, -12, 14, 0).closePath().fill(0xf7f2ff).stroke(THIN);
      for (const dx of [-7, 0, 7]) g.moveTo(0, -1).lineTo(dx, -7).stroke({ width: 1.2, color: 0xb79cff });
      const fan = new Graphics();
      [0xff8fb1, 0xffd77a, 0x6fe0c8, 0x8fd3ff, 0xb79cff].forEach((col, k) => fan.moveTo(0, 0).lineTo(46, -16 + k * 8).stroke({ width: 3, color: col, alpha: 0.7 }));
      fan.position.set(4, -24);
      fan.blendMode = 'add';
      c.addChild(fan);
      const prism = new Graphics().poly([-11, -10, 0, -36, 11, -10]).fill({ color: 0xffffff, alpha: 0.95 }).stroke(INK);
      prism.moveTo(-5, -14).lineTo(-1, -28).stroke({ width: 2, color: 0x8fd3ff, cap: 'round' });
      c.addChild(prism);
      const gl = new Sprite(glowTexture());
      gl.anchor.set(0.5);
      gl.tint = 0x8fd3ff;
      gl.alpha = 0.45;
      gl.scale.set(0.5);
      gl.y = -22;
      c.addChildAt(gl, 0);
      tick = (t) => {
        const a = Math.sin(stepped(t) * 1.1);
        fan.rotation = a * 0.25;
        fan.alpha = 0.55 + Math.abs(a) * 0.35;
      };
      break;
    }
    default: {
      g.poly([-8, 0, -11, -18, -4, -30, 0, -14]).fill(fx.main).stroke(THIN);
      g.poly([0, 0, 3, -34, 9, -40, 12, -18, 8, 0]).fill(fx.accent).stroke(THIN);
      const gl = new Sprite(glowTexture());
      gl.anchor.set(0.5);
      gl.tint = fx.main;
      gl.alpha = 0.4;
      gl.scale.set(0.5);
      gl.y = -18;
      c.addChildAt(gl, 0);
    }
  }
  return { c, tick };
}

/** the little house per tier. Returns container + local y of its top. */
export function habitatHouse(element: string, tier: number): { c: Container; top: number } {
  const fx = elementFx(element);
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  const glow = new Sprite(glowTexture());
  glow.anchor.set(0.5);
  glow.tint = fx.accent;
  glow.alpha = 0.22;
  glow.scale.set(1.5);
  c.addChildAt(glow, 0);
  let top = -60;
  const flag = (x: number, y: number) => {
    g.moveTo(x, y).lineTo(x, y - 30).stroke({ width: 3, color: C.ink });
    g.poly([x, y - 30, x + 22, y - 25, x, y - 18]).fill(fx.main).stroke(THIN);
  };
  switch (tier) {
    case 1: {
      // Caja de Cartón: open box with flaps
      const box = isoBoxAt(g, -0.5, -0.5, 1.1, 1.1, 38, 0xc99a62, 0.1);
      g.poly([box.tL.x, box.tL.y, box.tT.x, box.tT.y, box.tT.x - 18, box.tT.y - 22, box.tL.x - 18, box.tL.y - 22]).fill(0xd9ad75).stroke(INK);
      g.poly([box.tT.x, box.tT.y, box.tR.x, box.tR.y, box.tR.x + 16, box.tR.y - 24, box.tT.x + 16, box.tT.y - 24]).fill(0xd9ad75).stroke(INK);
      g.poly([box.tL.x, box.tL.y, box.tB.x, box.tB.y, box.tB.x - 10, box.tB.y + 16, box.tL.x - 14, box.tL.y + 12]).fill(0xb8864e).stroke(INK);
      // tape + paw
      const mx = (box.left.x + box.bottom.x) / 2;
      const my = (box.left.y + box.bottom.y) / 2 - 18;
      g.circle(mx, my + 3, 5).fill(0x8a5a2e);
      for (const [dx, dy] of [
        [-6, -4],
        [-2, -8],
        [3, -8],
        [7, -4],
      ])
        g.circle(mx + dx, my + dy, 2).fill(0x8a5a2e);
      g.moveTo(box.tB.x, box.tB.y).lineTo(box.bottom.x, box.bottom.y).stroke({ width: 4, color: fx.main });
      flag(box.tR.x - 4, box.tR.y - 18);
      top = box.tT.y - 40;
      break;
    }
    case 2: {
      // Cesta de Mimbre
      const y0 = 4;
      g.ellipse(0, y0, 54, 26).fill(0xb8864e).stroke(INK);
      g.rect(-54, y0 - 34, 108, 34).fill(0xc99a62);
      g.ellipse(0, y0 - 34, 54, 24).fill(0xd9ad75).stroke(INK);
      g.moveTo(-54, y0 - 34).lineTo(-54, y0).moveTo(54, y0 - 34).lineTo(54, y0).stroke(INK);
      for (let k = -4; k <= 4; k++) g.moveTo(k * 12, y0 - 10 - Math.abs(k) * 0.5).lineTo(k * 12, y0 + 22 - Math.abs(k) * 1.8).stroke({ width: 2, color: 0x8a5a2e });
      for (let r = 0; r < 3; r++) g.moveTo(-52, y0 - 26 + r * 10).quadraticCurveTo(0, y0 - 6 + r * 10, 52, y0 - 26 + r * 10).stroke({ width: 2, color: 0x8a5a2e });
      g.ellipse(0, y0 - 36, 42, 17).fill(fx.main).stroke(THIN);
      g.ellipse(-8, y0 - 40, 14, 5).fill({ color: 0xffffff, alpha: 0.35 });
      g.moveTo(-40, y0 - 40).bezierCurveTo(-40, y0 - 100, 40, y0 - 100, 40, y0 - 40).stroke({ width: 8, color: C.ink });
      g.moveTo(-40, y0 - 40).bezierCurveTo(-40, y0 - 100, 40, y0 - 100, 40, y0 - 40).stroke({ width: 4, color: 0xc99a62 });
      top = y0 - 96;
      break;
    }
    case 3: {
      // Torre Rascadora
      g.ellipse(0, 6, 46, 20).fill(shade(fx.main, 0.8)).stroke(INK);
      for (const x of [-22, 18]) {
        g.rect(x - 7, -110, 14, 114).fill(0xe0c497).stroke(INK);
        for (let y = -104; y < 0; y += 9) g.moveTo(x - 7, y).lineTo(x + 7, y + 5).stroke({ width: 1.5, color: 0x8a5a2e });
      }
      g.ellipse(18, -54, 34, 13).fill(fx.main).stroke(INK);
      g.ellipse(-22, -82, 32, 12).fill(fx.main).stroke(INK);
      g.ellipse(-2, -116, 40, 15).fill(shade(fx.main, 1.15)).stroke(INK);
      // little box on top
      g.poly([-22, -122, -2, -132, 18, -122, 18, -140, -2, -150, -22, -140]).fill(fx.dark === 0x000000 ? 0x333333 : shade(fx.main, 0.7)).stroke(INK);
      g.ellipse(-4, -132, 7, 9).fill(C.ink);
      g.circle(30, -40, 6).fill(C.red).stroke(THIN);
      g.moveTo(30, -46).lineTo(30, -54).stroke(THIN);
      top = -156;
      break;
    }
    case 4: {
      top = casitaCoral(g, c, element);
      break;
    }
    case 5: {
      top = palacioCojines(g, c, element);
      break;
    }
    case 6: {
      top = temploRonroneo(g, c, element);
      break;
    }
    case 7: {
      top = santuarioArcano(g, c, element);
      flag(-40, -30);
      break;
    }
    case 8: {
      top = nucleoCelestial(g, c, element);
      break;
    }
    case 9: {
      top = anclaDimensional(g, c, element);
      break;
    }
    case 10: {
      top = tronoMultiversal(g, c, element);
      break;
    }
    default: {
      // tiers 5–8: palace / temple / arcane / celestial — stacked and taller, element trims
      const lvl = tier - 4;
      const base = tier >= 8 ? 0x231626 : tier >= 7 ? 0x5c3d5b : tier >= 6 ? 0xede4d6 : 0xffd2dc;
      const box = isoBoxAt(g, -0.6, -0.6, 1.3, 1.3, 46 + lvl * 8, base, 0.06);
      const roofH = 30 + lvl * 8;
      const roof = tier === 6 ? 0xc8102e : tier === 5 ? fx.main : tier === 7 ? C.violet : 0x0d110f;
      const apexY = box.tT.y + (box.tB.y - box.tT.y) / 2 - roofH;
      if (tier === 6) {
        // pagoda: two eaves
        for (const k of [0, 1]) {
          const lift = k * 26;
          const e = 18 - k * 8;
          g.poly([box.tL.x - e, box.tL.y - lift + 6, box.tB.x, box.tB.y + e * 0.5 - lift + 6, box.tR.x + e, box.tR.y - lift + 6, box.tT.x, box.tT.y - e * 0.5 - lift + 6, box.tL.x - e, box.tL.y - lift + 6])
            .fill(roof)
            .stroke(INK);
        }
        g.poly([box.tL.x + 14, box.tL.y - 40, box.tB.x, box.tB.y - 40, box.tR.x - 14, box.tR.y - 40, box.tT.x, apexY - 30]).fill(shade(roof, 0.8)).stroke(INK);
        top = apexY - 40;
      } else if (tier === 8) {
        g.poly([box.tL.x, box.tL.y, box.tB.x, box.tB.y, box.tR.x, box.tR.y, box.tT.x, box.tT.y]).fill(0x372347).stroke(INK);
        const orb = new Graphics();
        orb.circle(0, apexY - 20, 26).fill(C.cyan).stroke(INK);
        orb.circle(-8, apexY - 28, 8).fill({ color: 0xffffff, alpha: 0.6 });
        orb.ellipse(0, apexY - 20, 46, 12).stroke({ width: 3, color: C.pinkHot });
        c.addChild(orb);
        top = apexY - 56;
      } else {
        g.poly([box.tL.x, box.tL.y, box.tB.x, box.tB.y, box.tB.x, box.tB.y, box.tT.x, apexY]).fill(shade(roof, 1.1)).stroke(INK);
        g.poly([box.tB.x, box.tB.y, box.tR.x, box.tR.y, box.tT.x, apexY]).fill(shade(roof, 0.8)).stroke(INK);
        g.circle(box.tT.x, apexY - 8, 7).fill(C.yellow).stroke(THIN);
        top = apexY - 20;
      }
      const dx = (box.left.x + box.bottom.x) / 2;
      const dy = (box.left.y + box.bottom.y) / 2;
      g.moveTo(dx - 10, dy).bezierCurveTo(dx - 10, dy - 30, dx + 10, dy - 30, dx + 10, dy + 4).closePath().fill(C.ink);
      g.moveTo(box.left.x, box.left.y - 10).lineTo(box.bottom.x, box.bottom.y - 10).stroke({ width: 4, color: tier >= 5 ? C.gold : fx.main });
      if (tier === 7) {
        for (let k = 0; k < 3; k++) g.star(-40 + k * 40, apexY + 10 - (k % 2) * 16, 4, 7, 3).fill(C.mint).stroke(THIN);
      }
      flag(box.tR.x - 4, box.tR.y);
    }
  }
  return { c, top };
}

// ------------------------------------------------------------------ tiers 4–6 (M2): each tier its own silhouette, each element its own trims
/** element trims used by tiers 4–6 */
function trims(el: string) {
  const fx = elementFx(el);
  const map: Record<string, { roof: number; glass: number; stone: number; banner: number }> = {
    fire: { roof: 0xc8102e, glass: C.yellow, stone: 0xd9b07a, banner: C.orange },
    water: { roof: 0x3569a3, glass: 0x7fd8ff, stone: 0xcfe3ea, banner: 0x7fd8ff },
    nature: { roof: 0x3f8a3f, glass: 0xd4f27a, stone: 0xd9cdb8, banner: 0x5fbf4a },
    earth: { roof: 0x8a5a2e, glass: 0xe0b77a, stone: 0xb7a99a, banner: 0xa8743f },
    storm: { roof: 0x1f2b4a, glass: C.cyan, stone: 0xc9ccd6, banner: C.yellow },
    magic: { roof: 0x5c3d5b, glass: 0xff7ab8, stone: 0xb7a4c7, banner: 0x8a5cff },
    cosmic: { roof: 0x231626, glass: C.cyan, stone: 0x6d5a80, banner: 0x8a5cff },
    ice: { roof: 0x4fa3d9, glass: 0x7cffc4, stone: 0xdcefff, banner: 0x9fe8ff },
    sound: { roof: 0xff2e88, glass: 0xffd400, stone: 0xd9cde6, banner: 0x2ec4e6 },
    shadow: { roof: 0x2a2433, glass: 0xfff3d6, stone: 0xeae1d3, banner: 0xc8102e },
    time: { roof: 0x6b4f2a, glass: 0xe0b77a, stone: 0xd9c29a, banner: 0x1c3a51 },
    light: { roof: 0xffd77a, glass: 0x7fd8ff, stone: 0xfff8e1, banner: 0xe8879a },
    void: { roof: 0x0d110f, glass: 0xffffff, stone: 0xd9d9d6, banner: 0xff2e88 },
    crystal: { roof: 0xb79cff, glass: 0x8fd3ff, stone: 0xf7f2ff, banner: 0x6fe0c8 },
  };
  return { fx, ...(map[el] ?? map.fire) };
}

/** little element "topper" on finials (flame, drop, leaf, rock, bolt, star, planet) */
function topper(g: Graphics, x: number, y: number, el: string, s = 1) {
  const fx = elementFx(el);
  switch (el) {
    case 'fire':
      g.moveTo(x, y - 18 * s).bezierCurveTo(x + 10 * s, y - 8 * s, x + 8 * s, y, x, y).bezierCurveTo(x - 8 * s, y, x - 10 * s, y - 8 * s, x, y - 18 * s).fill(C.orange).stroke(THIN);
      g.ellipse(x, y - 5 * s, 3.5 * s, 5 * s).fill(C.yellow);
      break;
    case 'water':
      g.moveTo(x, y - 18 * s).quadraticCurveTo(x + 9 * s, y - 4 * s, x, y).quadraticCurveTo(x - 9 * s, y - 4 * s, x, y - 18 * s).fill(0x7fd8ff).stroke(THIN);
      g.circle(x - 2 * s, y - 6 * s, 2 * s).fill({ color: 0xffffff, alpha: 0.7 });
      break;
    case 'nature':
      g.moveTo(x, y).quadraticCurveTo(x - 12 * s, y - 10 * s, x, y - 20 * s).quadraticCurveTo(x + 12 * s, y - 10 * s, x, y).fill(0x5fbf4a).stroke(THIN);
      g.moveTo(x, y).lineTo(x, y - 16 * s).stroke({ width: 1.5, color: C.ink });
      break;
    case 'earth':
      g.poly([x - 8 * s, y, x - 6 * s, y - 12 * s, x + 2 * s, y - 18 * s, x + 8 * s, y - 8 * s, x + 6 * s, y]).fill(fx.accent).stroke(THIN);
      break;
    case 'storm':
      g.poly([x + 2 * s, y - 20 * s, x - 7 * s, y - 6 * s, x, y - 7 * s, x - 4 * s, y + 2 * s, x + 8 * s, y - 11 * s, x + 1 * s, y - 10 * s]).fill(C.yellow).stroke(THIN);
      break;
    case 'cosmic':
      g.circle(x, y - 9 * s, 7 * s).fill(0x8a5cff).stroke(THIN);
      g.ellipse(x, y - 9 * s, 13 * s, 3.5 * s).stroke({ width: 2, color: C.cyan });
      break;
    case 'ice':
      g.star(x, y - 10 * s, 6, 10 * s, 3.5 * s).fill(0xeaf6ff).stroke(THIN);
      g.circle(x, y - 10 * s, 2.5 * s).fill(0x7cffc4);
      break;
    case 'sound':
      g.ellipse(x - 2 * s, y - 4 * s, 5 * s, 3.8 * s).fill(0xff2e88).stroke(THIN);
      g.rect(x + 2 * s, y - 20 * s, 2.5 * s, 16 * s).fill(C.ink);
      g.poly([x + 2 * s, y - 20 * s, x + 10 * s, y - 14 * s, x + 3 * s, y - 13 * s]).fill(C.ink);
      break;
    case 'shadow':
      g.moveTo(x - 10 * s, y - 9 * s).quadraticCurveTo(x, y - 20 * s, x + 10 * s, y - 9 * s).quadraticCurveTo(x, y + 2 * s, x - 10 * s, y - 9 * s).fill(0x0d110f).stroke(THIN);
      g.circle(x, y - 9 * s, 3.5 * s).fill(0xc8102e);
      g.rect(x - 0.8 * s, y - 12 * s, 1.6 * s, 6 * s).fill(0x0d110f);
      break;
    case 'time':
      g.poly([x - 6 * s, y - 20 * s, x + 6 * s, y - 20 * s, x, y - 10 * s, x + 6 * s, y, x - 6 * s, y, x, y - 10 * s]).fill(0xf7ebd0).stroke(THIN);
      g.poly([x - 4 * s, y - 1 * s, x + 4 * s, y - 1 * s, x, y - 6 * s]).fill(0xe0b77a);
      g.rect(x - 8 * s, y - 22 * s, 16 * s, 3 * s).fill(0x6b4f2a).stroke({ width: 1.5, color: C.ink });
      break;
    case 'light':
      g.star(x, y - 10 * s, 8, 11 * s, 4.5 * s).fill(0xfff8e1).stroke(THIN);
      g.circle(x, y - 10 * s, 3.5 * s).fill(0xe8879a).stroke({ width: 1.5, color: 0xb89558 });
      break;
    case 'void':
      g.circle(x, y - 9 * s, 7 * s).fill(0x0d110f).stroke({ width: 2, color: 0xffffff });
      g.ellipse(x, y - 9 * s, 12 * s, 3.5 * s).stroke({ width: 2, color: 0xff2e88 });
      break;
    case 'crystal':
      g.poly([x, y - 20 * s, x + 7 * s, y - 12 * s, x, y, x - 7 * s, y - 12 * s]).fill(0xf7f2ff).stroke(THIN);
      g.poly([x, y - 20 * s, x + 7 * s, y - 12 * s, x, y - 12 * s]).fill(0x8fd3ff);
      g.poly([x - 7 * s, y - 12 * s, x, y, x, y - 12 * s]).fill(0xb79cff);
      break;
    default:
      g.star(x, y - 9 * s, 5, 9 * s, 4 * s).fill(fx.accent).stroke(THIN);
  }
}

function glowAt(c: Container, x: number, y: number, tint: number, alpha = 0.4, scale = 0.6) {
  const gl = new Sprite(glowTexture());
  gl.anchor.set(0.5);
  gl.tint = tint;
  gl.alpha = alpha;
  gl.scale.set(scale);
  gl.position.set(x, y);
  c.addChildAt(gl, 0);
  return gl;
}

/** Tier 4 · Casita de Coral: bulbous coral dome + side bulb + turret, sea-weed, element turret/topper */
function casitaCoral(g: Graphics, c: Container, el: string) {
  const t = trims(el);
  const CORAL: Record<string, number> = { earth: 0xf2b48a, storm: 0xc9b6e8, ice: 0xcfe9ff, sound: 0xffb3d4, shadow: 0xd9cfc0, time: 0xe8d2a8, light: 0xfff0c2, void: 0xe2e2e0, crystal: 0xece4ff };
  const coral = CORAL[el] ?? 0xff9fb4;
  const coralD = shade(coral, 0.82);
  g.ellipse(0, 8, 62, 22).fill(0xf2dca8).stroke(INK);
  // seaweed
  for (const [x, h, col] of [
    [-54, 30, 0x3f8a3f],
    [-44, 22, 0x5fbf4a],
    [50, 26, 0x3f8a3f],
  ] as const)
    g.moveTo(x, 6).bezierCurveTo(x - 8, -h * 0.4, x + 8, -h * 0.7, x, -h).stroke({ width: 4, color: col, cap: 'round' });
  // side bulb
  g.moveTo(14, 6).bezierCurveTo(14, -40, 66, -40, 62, 6).closePath().fill(coralD).stroke(INK);
  // main dome
  g.moveTo(-50, 6).bezierCurveTo(-58, -92, 46, -92, 40, 6).closePath().fill(coral).stroke(INK);
  for (const [x, y, r] of [
    [-28, -36, 7],
    [-6, -62, 5],
    [16, -40, 6],
    [-36, -12, 5],
    [46, -14, 4],
    [30, -20, 3],
  ])
    g.circle(x, y, r).fill(shade(coral, 1.12)).stroke({ width: 1.5, color: C.ink });
  // door with element frame + porthole
  g.moveTo(-18, 6).bezierCurveTo(-18, -32, 8, -32, 8, 6).closePath().fill(t.roof).stroke(INK);
  g.moveTo(-12, 6).bezierCurveTo(-12, -24, 2, -24, 2, 6).closePath().fill(C.ink);
  g.circle(24, -58, 10).fill(t.glass).stroke(INK);
  g.circle(21, -61, 3).fill({ color: 0xffffff, alpha: 0.7 });
  // turret
  g.rect(-44, -96, 18, 44).fill(coralD).stroke(INK);
  g.poly([-50, -96, -35, -122, -20, -96]).fill(t.roof).stroke(INK);
  topper(g, -35, -122, el, 0.9);
  // shells
  g.moveTo(-58, 2).quadraticCurveTo(-52, -10, -46, 2).closePath().fill(0xfff1e0).stroke(THIN);
  glowAt(c, 24, -58, t.glass, 0.35, 0.4);
  return -140;
}

/** Tier 5 · Palacio de Cojines: tower of fat cushions with tassels, onion dome, element banners */
function palacioCojines(g: Graphics, c: Container, el: string) {
  const t = trims(el);
  const fx = t.fx;
  const box = isoBoxAt(g, -0.62, -0.62, 1.34, 1.34, 14, t.stone, 0.04);
  void box;
  const cushion = (y: number, rx: number, col: number) => {
    const ry = rx * 0.42;
    g.ellipse(0, y + 12, rx, ry).fill(shade(col, 0.7)).stroke(INK);
    g.rect(-rx, y, rx * 2, 12).fill(shade(col, 0.7));
    g.moveTo(-rx, y).lineTo(-rx, y + 12).moveTo(rx, y).lineTo(rx, y + 12).stroke(INK);
    g.ellipse(0, y, rx, ry).fill(col).stroke(INK);
    // button + stitch
    g.circle(0, y, 4).fill(shade(col, 0.6)).stroke({ width: 1.5, color: C.ink });
    g.moveTo(-rx * 0.55, y - ry * 0.3).quadraticCurveTo(0, y + ry * 0.35, rx * 0.55, y - ry * 0.3).stroke({ width: 1.5, color: shade(col, 0.6) });
    // tassels at the 2 visible corners
    for (const sx of [-1, 1]) {
      const tx = sx * rx * 0.96;
      g.moveTo(tx, y + 6).lineTo(tx, y + 20).stroke({ width: 2, color: C.ink });
      g.poly([tx - 4, y + 18, tx + 4, y + 18, tx + 2, y + 28, tx - 2, y + 28]).fill(C.gold).stroke({ width: 1.5, color: C.ink });
    }
  };
  const cols = [fx.main, 0xff9fb4, t.banner === fx.main ? 0xffd77a : t.banner];
  cushion(-34, 60, cols[0]);
  cushion(-66, 48, cols[1]);
  cushion(-94, 36, cols[2]);
  // arched door in the bottom cushion
  g.moveTo(-14, -16).bezierCurveTo(-14, -42, 14, -42, 14, -16).closePath().fill(C.ink).stroke(INK);
  g.rect(-16, -18, 32, 4).fill(C.gold).stroke({ width: 1.5, color: C.ink });
  // onion dome
  const dy = -112;
  g.moveTo(-20, dy).bezierCurveTo(-30, dy - 26, -6, dy - 36, 0, dy - 52).bezierCurveTo(6, dy - 36, 30, dy - 26, 20, dy).closePath().fill(t.roof).stroke(INK);
  g.moveTo(-8, dy - 8).quadraticCurveTo(-12, dy - 26, -2, dy - 40).stroke({ width: 2, color: 0xffffff, alpha: 0.4 });
  g.rect(-22, dy - 2, 44, 6).fill(C.gold).stroke(THIN);
  g.moveTo(0, dy - 52).lineTo(0, dy - 64).stroke({ width: 3, color: C.ink });
  topper(g, 0, dy - 62, el, 0.8);
  // hanging banners
  for (const sx of [-1, 1]) {
    const bx = sx * 44;
    g.moveTo(bx, -60).lineTo(bx, -30).lineTo(bx + sx * 8, -24).lineTo(bx + sx * 16, -30).lineTo(bx + sx * 16, -62).closePath().fill(t.banner).stroke(THIN);
    g.circle(bx + sx * 8, -46, 3.5).fill(C.paper).stroke({ width: 1, color: C.ink });
  }
  glowAt(c, 0, -80, fx.accent, 0.25, 1.4);
  return dy - 80;
}

/** Tier 6 · Templo del Ronroneo: stepped plinth, three upturned eaves, golden bell + paw emblem, element lanterns */
function temploRonroneo(g: Graphics, c: Container, el: string) {
  const t = trims(el);
  const fx = t.fx;
  isoBoxAt(g, -0.7, -0.7, 1.5, 1.5, 10, 0xb7a99a, 0.02);
  isoBoxAt(g, -0.6, -0.6, 1.3, 1.3, 10, t.stone, 0.04, 10);
  const body = isoBoxAt(g, -0.42, -0.42, 0.96, 0.96, 46, 0xede4d6, 0.04, 20);
  // red pillars on the two visible faces
  for (const f of [0.15, 0.85]) {
    const a = { x: body.left.x + (body.bottom.x - body.left.x) * f, y: body.left.y + (body.bottom.y - body.left.y) * f };
    const b = { x: body.bottom.x + (body.right.x - body.bottom.x) * f, y: body.bottom.y + (body.right.y - body.bottom.y) * f };
    for (const p of [a, b]) g.rect(p.x - 3.5, p.y - 46, 7, 46).fill(C.red).stroke(THIN);
  }
  // door (left face) + paw emblem (right face)
  const dl = { x: (body.left.x + body.bottom.x) / 2, y: (body.left.y + body.bottom.y) / 2 };
  g.poly([dl.x - 10, dl.y, dl.x - 10, dl.y - 26, dl.x + 10, dl.y - 32, dl.x + 10, dl.y - 6]).fill(C.ink);
  const dr = { x: (body.bottom.x + body.right.x) / 2, y: (body.bottom.y + body.right.y) / 2 - 24 };
  g.circle(dr.x, dr.y, 11).fill(C.gold).stroke(THIN);
  g.ellipse(dr.x, dr.y + 3, 4.5, 3.5).fill(C.ink);
  for (const [dx, dy] of [
    [-5, -3],
    [-2, -6],
    [2, -6],
    [5, -3],
  ])
    g.circle(dr.x + dx, dr.y + dy, 1.8).fill(C.ink);
  glowAt(c, dr.x, dr.y, C.yellow, 0.4, 0.45);
  // three eaves with upturned tips
  const roof = t.roof === 0x231626 ? 0x5c3d5b : el === 'fire' || el === 'nature' ? 0xc8102e : t.roof;
  const eave = (y: number, half: number, depth: number) => {
    const L = { x: -half, y }, R = { x: half, y }, T = { x: 0, y: y - depth }, B = { x: 0, y: y + depth };
    g.poly([L.x, L.y, T.x, T.y, R.x, R.y, B.x, B.y]).fill(shade(roof, 0.75)).stroke(INK);
    g.poly([L.x - 8, L.y - 8, L.x, L.y, B.x, B.y + 4, R.x, R.y, R.x + 8, R.y - 8, R.x - 4, R.y + 6, B.x, B.y + 12, L.x + 4, L.y + 6]).fill(roof).stroke(INK);
    g.moveTo(L.x + 4, L.y + 6).lineTo(B.x, B.y + 12).lineTo(R.x - 4, R.y + 6).stroke({ width: 2.5, color: C.gold });
  };
  eave(-62, 66, 26);
  g.rect(-24, -96, 48, 26).fill(0xede4d6).stroke(INK);
  for (const x of [-18, 12]) g.rect(x, -96, 6, 26).fill(C.red).stroke({ width: 1.5, color: C.ink });
  eave(-98, 48, 19);
  g.rect(-14, -124, 28, 20).fill(0xede4d6).stroke(INK);
  eave(-126, 32, 13);
  // bell under the first eave
  g.moveTo(-40, -50).lineTo(-40, -42).stroke({ width: 2, color: C.ink });
  g.moveTo(-47, -30).bezierCurveTo(-47, -46, -33, -46, -33, -30).closePath().fill(C.gold).stroke(THIN);
  g.circle(-40, -29, 2.5).fill(C.ink);
  // finial
  g.rect(-2, -160, 4, 26).fill(C.gold).stroke({ width: 1.5, color: C.ink });
  for (const y of [-146, -138]) g.circle(0, y, 5).fill(C.gold).stroke({ width: 1.5, color: C.ink });
  topper(g, 0, -160, el, 0.9);
  // element lanterns on poles
  for (const sx of [-1, 1]) {
    const lx = sx * 60;
    const ly = 18;
    g.rect(lx - 2, ly - 46, 4, 46).fill(0x6a4325).stroke({ width: 1.5, color: C.ink });
    g.roundRect(lx - 8, ly - 62, 16, 18, 4).fill(fx.accent).stroke(THIN);
    g.poly([lx - 10, ly - 62, lx, ly - 70, lx + 10, ly - 62]).fill(roof).stroke({ width: 1.5, color: C.ink });
    glowAt(c, lx, ly - 54, fx.accent, 0.5, 0.35);
  }
  glowAt(c, 0, -90, fx.main, 0.18, 1.6);
  return -186;
}

/** scaffolding drawn over a plot while it's being built/upgraded */
export function scaffoldArt(fw = 1.3, fh = 1.3): Container {
  const c = new Container();
  const g = new Graphics();
  const pts = [P(-0.55, -0.55), P(fw - 0.55, -0.55), P(fw - 0.55, fh - 0.55), P(-0.55, fh - 0.55)];
  const H = 96;
  for (const p of pts) g.rect(p.x - 3, p.y - H, 6, H).fill(0xc99358).stroke(THIN);
  for (const h of [H * 0.45, H * 0.9]) {
    for (let i = 0; i < 4; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % 4];
      g.moveTo(a.x, a.y - h).lineTo(b.x, b.y - h);
    }
    g.stroke({ width: 6, color: C.ink, cap: 'round' });
    for (let i = 0; i < 4; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % 4];
      g.moveTo(a.x, a.y - h).lineTo(b.x, b.y - h);
    }
    g.stroke({ width: 3, color: 0xe0b77a, cap: 'round' });
  }
  // diagonal brace + hazard plank
  g.moveTo(pts[3].x, pts[3].y).lineTo(pts[2].x, pts[2].y - H * 0.45).stroke({ width: 3, color: 0xc99358 });
  const m = { x: (pts[3].x + pts[2].x) / 2, y: (pts[3].y + pts[2].y) / 2 - 12 };
  g.poly([m.x - 34, m.y - 6, m.x + 34, m.y + 10, m.x + 34, m.y + 22, m.x - 34, m.y + 6]).fill(C.yellow).stroke(THIN);
  for (let k = -2; k <= 2; k++) g.poly([m.x + k * 14 - 4, m.y + k * 3.5 - 2, m.x + k * 14 + 4, m.y + k * 3.5, m.x + k * 14 - 2, m.y + k * 3.5 + 13, m.x + k * 14 - 10, m.y + k * 3.5 + 11]).fill(C.ink);
  c.addChild(g);
  return c;
}

/** empty plot: dashed outline + signpost with a "+" */
export function emptyPlotArt(fw = 3, fh = 3): { ground: Container; sign: Container } {
  const ground = new Container();
  const g = new Graphics();
  footprint(g, fw, fh, 0xfff3d6, 0.35, 0.06, false);
  dashedPoly(g, [P(-0.42, -0.42), P(fw - 0.58, -0.42), P(fw - 0.58, fh - 0.58), P(-0.42, fh - 0.58)], 16, 10, { width: 4, color: C.ink, alpha: 0.55 });
  ground.addChild(g);
  const sign = new Container();
  const s = new Graphics();
  s.rect(-3, -46, 6, 46).fill(0x8a5a2e).stroke(THIN);
  s.rect(-22 + 4, -78 + 4, 44, 36).fill(C.ink);
  s.rect(-22, -78, 44, 36).fill(C.pink).stroke(INK);
  s.rect(-3, -72, 6, 24).fill(C.ink);
  s.rect(-12, -63, 24, 6).fill(C.ink);
  sign.addChild(s);
  return { ground, sign };
}

/** empty cardboard box (homeless cats sit next to it, sad) */
export function emptyBoxArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.ellipse(0, 4, 30, 10).fill({ color: C.ink, alpha: 0.18 });
  const box = isoBoxAt(g, -0.32, -0.32, 0.55, 0.55, 26, 0xc99a62, 0.02);
  g.poly([box.tL.x, box.tL.y, box.tT.x, box.tT.y, box.tT.x - 10, box.tT.y - 14, box.tL.x - 10, box.tL.y - 14]).fill(0xd9ad75).stroke(THIN);
  g.poly([box.tT.x, box.tT.y, box.tR.x, box.tR.y, box.tR.x + 10, box.tR.y - 14, box.tT.x + 10, box.tT.y - 14]).fill(0xd9ad75).stroke(THIN);
  c.addChild(g);
  return c;
}

// =====================================================================================  FIXED BUILDINGS
/** Santuario de Resonancia (ORQUÍDEA REAL): stone platform, torii, swirling portal, cushions */
export function sanctuaryParts(fw = 3, fh = 3): { c: Container; portal: Container; top: number } {
  const c = new Container();
  const g = new Graphics();
  isoBoxAt(g, 0, 0, fw, fh, 12, 0xb7a4c7, 0.08);
  const plat = new Graphics();
  isoBoxAt(plat, 0.6, 0.6, fw - 1.2, fh - 1.2, 10, 0x8f6b93, 0.05, 12);
  c.addChild(g, plat);
  const ctr = centerOf(fw, fh);
  const portal = new Container();
  const glow = new Sprite(glowTexture());
  glow.anchor.set(0.5);
  glow.tint = C.pinkHot;
  glow.alpha = 0.7;
  glow.scale.set(1.3, 1.7);
  const ring = new Graphics();
  for (let k = 0; k < 3; k++) ring.arc(0, 0, 34 + k * 9, k, k + Math.PI * 1.2).stroke({ width: 3, color: k === 1 ? C.mint : 0xffffff, alpha: 0.85, cap: 'round' });
  const disc = new Graphics().ellipse(0, 0, 36, 50).fill({ color: C.plumInk, alpha: 0.9 }).stroke({ width: 3, color: C.gold });
  disc.ellipse(0, 0, 22, 34).fill({ color: C.pinkHot, alpha: 0.55 });
  ring.label = 'ring';
  portal.addChild(glow, disc, ring);
  portal.position.set(ctr.x, ctr.y - 92);
  const gate = new Graphics();
  const y0 = ctr.y - 6;
  gate.rect(ctr.x - 78, y0 - 160, 14, 160).fill(C.red).stroke(INK);
  gate.rect(ctr.x + 64, y0 - 160, 14, 160).fill(C.red).stroke(INK);
  gate.poly([ctr.x - 104, y0 - 172, ctr.x + 104, y0 - 172, ctr.x + 96, y0 - 186, ctr.x - 96, y0 - 186]).fill(C.ink);
  gate.rect(ctr.x - 92, y0 - 172, 184, 12).fill(C.gold).stroke(THIN);
  gate.rect(ctr.x - 86, y0 - 144, 172, 12).fill(C.red).stroke(INK);
  gate.rect(ctr.x - 18, y0 - 172, 36, 30).fill(C.plumInk).stroke(THIN);
  // lanterns
  for (const sx of [-1, 1]) {
    const lp = P(sx > 0 ? fw - 0.7 : 0.3, sx > 0 ? 0.3 : fh - 0.7);
    gate.rect(lp.x - 6, lp.y - 40, 12, 40).fill(0xd9cdb8).stroke(THIN);
    gate.rect(lp.x - 12, lp.y - 58, 24, 18).fill(C.yellow).stroke(INK);
    gate.poly([lp.x - 16, lp.y - 58, lp.x, lp.y - 70, lp.x + 16, lp.y - 58]).fill(0xd9cdb8).stroke(THIN);
  }
  // two cushions in front
  for (const [ox, col] of [
    [-0.5, C.pink],
    [0.5, C.mint],
  ] as const) {
    const p = P(fw / 2 - 0.5 + ox + 0.4, fh / 2 - 0.5 - ox + 0.4);
    gate.ellipse(p.x, p.y - 4, 22, 10).fill(col).stroke(INK);
    gate.ellipse(p.x - 5, p.y - 7, 7, 3).fill({ color: 0xffffff, alpha: 0.5 });
  }
  c.addChild(portal, gate);
  return { c, portal, top: y0 - 200 };
}

/** Port / shipyard: wooden deck, warehouse, crane, barrels and a pier into the sea */
export function portArt(facing: 'x' | 'y', fw = 3, fh = 3): { c: Container; top: number } {
  const c = new Container();
  const g = new Graphics();
  // deck planks
  isoBoxAt(g, 0, 0, fw, fh, 8, 0xc99358, 0.04);
  for (let k = 1; k < fw * 3; k++) {
    const a = P(-0.46 + k / 3, -0.46);
    const b = P(-0.46 + k / 3, fh - 0.54);
    g.moveTo(a.x, a.y - 8).lineTo(b.x, b.y - 8).stroke({ width: 1.5, color: 0x8a5a2e, alpha: 0.6 });
  }
  // pier
  const pier = new Graphics();
  const len = 2.2;
  const w = 0.9;
  const ox = facing === 'x' ? fw - 0.5 : fw / 2 - w / 2 - 0.5 + 0.5;
  const oy = facing === 'x' ? fh / 2 - w / 2 - 0.5 + 0.5 : fh - 0.5;
  const q = (dx: number, dy: number) => (facing === 'x' ? P(ox + dx - 0.5, oy + dy - 0.5) : P(ox + dy - 0.5, oy + dx - 0.5));
  const A = q(0, 0);
  const B = q(len, 0);
  const Cc = q(len, w);
  const D = q(0, w);
  for (const p of [B, Cc, q(len * 0.5, 0), q(len * 0.5, w)]) pier.rect(p.x - 4, p.y - 6, 8, DROP + 6).fill(0x6a4325).stroke(THIN);
  pier.poly([A.x, A.y - 6, B.x, B.y - 6, Cc.x, Cc.y - 6, D.x, D.y - 6]).fill(0xb98348).stroke(INK);
  for (let k = 1; k < 7; k++) {
    const f = k / 7;
    const a = { x: A.x + (B.x - A.x) * f, y: A.y + (B.y - A.y) * f };
    const b = { x: D.x + (Cc.x - D.x) * f, y: D.y + (Cc.y - D.y) * f };
    pier.moveTo(a.x, a.y - 6).lineTo(b.x, b.y - 6).stroke({ width: 1.5, color: 0x6a4325 });
  }
  // warehouse at back
  const hut = new Graphics();
  const box = isoBoxAt(hut, 0, 0, 1.6, 1.4, 60, 0xede4d6, 0.08, 8);
  const apexY = box.tT.y + (box.tB.y - box.tT.y) / 2 - 34;
  const mid = { x: (box.tT.x + box.tR.x) / 2, y: (box.tT.y + box.tR.y) / 2 - 34 };
  const mid2 = { x: (box.tL.x + box.tB.x) / 2, y: (box.tL.y + box.tB.y) / 2 - 34 };
  hut.poly([box.tL.x, box.tL.y, box.tB.x, box.tB.y, mid2.x + (box.tB.x - box.tL.x) * 0.5, mid2.y + (box.tB.y - box.tL.y) * 0.5, mid2.x - (box.tB.x - box.tL.x) * 0.5, mid2.y - (box.tB.y - box.tL.y) * 0.5]).fill(C.red).stroke(INK);
  hut.poly([box.tB.x, box.tB.y, box.tR.x, box.tR.y, mid.x + (box.tR.x - box.tT.x) * 0.5, mid.y + (box.tR.y - box.tT.y) * 0.5, mid2.x + (box.tB.x - box.tL.x) * 0.5, mid2.y + (box.tB.y - box.tL.y) * 0.5]).fill(shade(C.red, 0.75)).stroke(INK);
  void apexY;
  const dx = (box.left.x + box.bottom.x) / 2;
  const dy = (box.left.y + box.bottom.y) / 2;
  hut.rect(dx - 14, dy - 38, 28, 34).fill(0x8a5a2e).stroke(THIN);
  hut.moveTo(dx - 14, dy - 38).lineTo(dx + 14, dy - 4).moveTo(dx + 14, dy - 38).lineTo(dx - 14, dy - 4).stroke({ width: 1.5, color: C.ink });
  // anchor emblem on the wall
  const ax = (box.bottom.x + box.right.x) / 2;
  const ay = (box.bottom.y + box.right.y) / 2 - 34;
  hut.circle(ax, ay - 10, 4).stroke({ width: 3, color: C.ink });
  hut.moveTo(ax, ay - 6).lineTo(ax, ay + 12).moveTo(ax - 9, ay + 6).quadraticCurveTo(ax, ay + 16, ax + 9, ay + 6).stroke({ width: 3, color: C.ink });
  // crane
  const cr = new Graphics();
  const cp = P(fw - 1, 0.2);
  cr.moveTo(cp.x - 14, cp.y).lineTo(cp.x, cp.y - 120).lineTo(cp.x + 14, cp.y).stroke({ width: 6, color: C.ink });
  cr.moveTo(cp.x - 14, cp.y).lineTo(cp.x, cp.y - 120).lineTo(cp.x + 14, cp.y).stroke({ width: 3, color: C.yellow });
  cr.moveTo(cp.x, cp.y - 116).lineTo(cp.x + 64, cp.y - 100).stroke({ width: 6, color: C.ink });
  cr.moveTo(cp.x, cp.y - 116).lineTo(cp.x + 64, cp.y - 100).stroke({ width: 3, color: C.yellow });
  cr.moveTo(cp.x + 60, cp.y - 100).lineTo(cp.x + 60, cp.y - 56).stroke({ width: 2, color: C.ink });
  const crate = new Graphics();
  crate.rect(cp.x + 48, cp.y - 58, 24, 20).fill(0xb98348).stroke(THIN);
  crate.moveTo(cp.x + 48, cp.y - 58).lineTo(cp.x + 72, cp.y - 38).stroke({ width: 1.5, color: C.ink });
  // barrels
  const br = new Graphics();
  for (const [bx, by] of [
    [0.3, fh - 0.8],
    [0.75, fh - 0.6],
  ]) {
    const p = P(bx, by);
    br.ellipse(p.x, p.y - 2, 12, 6).fill(0x6a4325).stroke(THIN);
    br.rect(p.x - 12, p.y - 26, 24, 24).fill(0x8a5a2e);
    br.ellipse(p.x, p.y - 26, 12, 6).fill(0xb98348).stroke(THIN);
    br.moveTo(p.x - 12, p.y - 26).lineTo(p.x - 12, p.y - 2).moveTo(p.x + 12, p.y - 26).lineTo(p.x + 12, p.y - 2).stroke(THIN);
    br.moveTo(p.x - 12, p.y - 10).quadraticCurveTo(p.x, p.y - 4, p.x + 12, p.y - 10).stroke({ width: 2, color: C.ink });
  }
  // flag pole with paw flag
  const fl = new Graphics();
  const fp = P(0.1, fh - 1.4);
  fl.moveTo(fp.x, fp.y).lineTo(fp.x, fp.y - 120).stroke({ width: 4, color: C.ink });
  fl.poly([fp.x, fp.y - 120, fp.x + 46, fp.y - 110, fp.x, fp.y - 96]).fill(C.ink);
  fl.circle(fp.x + 15, fp.y - 108, 4).fill(C.paper);
  c.addChild(pier, g, hut, br, cr, crate, fl);
  return { c, top: box.tT.y - 60 };
}

/** the Balsa Bigotuda (raft with palm + sail). Origin at its center, at SEA level. */
export function boatArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.ellipse(0, 6, 70, 22).fill({ color: 0x1c3a51, alpha: 0.25 });
  const logs = 5;
  for (let i = 0; i < logs; i++) {
    const t = (i - (logs - 1) / 2) * 13;
    const a = { x: -50 + t * 0.9, y: -8 + t * 0.55 };
    const b = { x: 34 + t * 0.9, y: 22 + t * 0.55 };
    g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 16, color: C.ink, cap: 'round' });
    g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 11, color: i % 2 ? 0xc99358 : 0xb98348, cap: 'round' });
  }
  g.moveTo(-40, 14).lineTo(10, -16).moveTo(30, 30).lineTo(70, 6).stroke({ width: 3, color: 0x6a4325 });
  // mast + sail
  g.moveTo(-2, 4).lineTo(-2, -110).stroke({ width: 5, color: C.ink });
  g.moveTo(-2, -104).quadraticCurveTo(34, -78, 40, -36).lineTo(-2, -26).closePath().fill(C.paper).stroke(INK);
  g.circle(14, -56, 6).fill(C.ink);
  for (const [dx, dy] of [
    [-6, -6],
    [-2, -10],
    [3, -10],
    [7, -6],
  ])
    g.circle(14 + dx * 0.9, -56 + dy * 0.9, 2.4).fill(C.ink);
  // little palm in a pot + box
  g.rect(-40, -10, 16, 14).fill(0xc8102e).stroke(THIN);
  g.moveTo(-32, -10).quadraticCurveTo(-30, -30, -26, -42).stroke({ width: 4, color: 0x8a5a2e });
  for (const a of [3.4, 4.2, 5.2, 6.0]) g.moveTo(-26, -42).quadraticCurveTo(-26 + Math.cos(a) * 12, -50, -26 + Math.cos(a) * 22, -42 + Math.sin(a) * 4 + 6).stroke({ width: 4, color: 0x4f9a4a, cap: 'round' });
  const box = new Graphics();
  isoBoxAt(box, 0.15, 0.05, 0.3, 0.3, 16, 0xc99a62, 0);
  c.addChild(g, box);
  return c;
}

/** Altar de Almas: stepped stone + bowl; floating orbs are animated by the view */
export function altarArt(): { c: Container; orbAnchor: { x: number; y: number } } {
  const c = new Container();
  const g = new Graphics();
  isoBoxAt(g, 0, 0, 2, 2, 10, 0x9a8fa8, 0.1);
  isoBoxAt(g, 0.4, 0.4, 1.2, 1.2, 22, 0xb7a4c7, 0.05, 10);
  const ctr = centerOf(2, 2);
  g.rect(ctr.x - 10, ctr.y - 70, 20, 40).fill(0xd9cdb8).stroke(INK);
  g.ellipse(ctr.x, ctr.y - 72, 28, 10).fill(C.plumInk).stroke(INK);
  g.ellipse(ctr.x, ctr.y - 74, 20, 6).fill(C.violet);
  for (const [x, y] of [
    [-30, -24],
    [26, -20],
  ])
    g.star(ctr.x + x, ctr.y + y, 4, 6, 2).fill(C.mint);
  const glow = new Sprite(glowTexture());
  glow.anchor.set(0.5);
  glow.tint = C.violet;
  glow.alpha = 0.5;
  glow.position.set(ctr.x, ctr.y - 92);
  glow.scale.set(1.1);
  c.addChild(glow, g);
  return { c, orbAnchor: { x: ctr.x, y: ctr.y - 100 } };
}

/** Mesa del Gato (PÓSTER RETRO): round table, cloth, three cups, striped parasol */
export function mesaArt(): Container {
  const c = new Container();
  const g = new Graphics();
  const ctr = centerOf(2, 2);
  g.ellipse(ctr.x, ctr.y + 4, 66, 26).fill({ color: C.ink, alpha: 0.18 });
  g.rect(ctr.x - 6, ctr.y - 36, 12, 36).fill(C.ink);
  g.ellipse(ctr.x, ctr.y - 40, 64, 24).fill(0xb3202a).stroke(INK);
  g.ellipse(ctr.x, ctr.y - 44, 58, 20).fill(C.paper).stroke(THIN);
  for (let k = -1; k <= 1; k++) {
    const x = ctr.x + k * 30;
    const y = ctr.y - 48 + Math.abs(k) * 4;
    g.poly([x - 10, y, x - 7, y - 20, x + 7, y - 20, x + 10, y]).fill(k === 0 ? 0x4f5a45 : 0xb3202a).stroke(THIN);
  }
  g.moveTo(ctr.x + 50, ctr.y - 30).lineTo(ctr.x + 50, ctr.y - 140).stroke({ width: 4, color: C.ink });
  const n = 6;
  for (let k = 0; k < n; k++) {
    const a0 = Math.PI + (k / n) * Math.PI;
    const a1 = Math.PI + ((k + 1) / n) * Math.PI;
    g.poly([ctr.x + 50, ctr.y - 150, ctr.x + 50 + Math.cos(a0) * 70, ctr.y - 120 + Math.sin(a0) * 10, ctr.x + 50 + Math.cos(a1) * 70, ctr.y - 120 + Math.sin(a1) * 10])
      .fill(k % 2 ? C.paper : 0xb3202a)
      .stroke(THIN);
  }
  c.addChild(g);
  return c;
}

/** Faro: striped tower; rotating beam animated by the view */
export function lighthouseArt(): { c: Container; lamp: { x: number; y: number } } {
  const c = new Container();
  const g = new Graphics();
  g.ellipse(0, 4, 34, 12).fill({ color: C.ink, alpha: 0.2 });
  g.ellipse(0, 0, 30, 12).fill(0x9a8f80).stroke(INK);
  const H = 150;
  const bands = 5;
  for (let k = 0; k < bands; k++) {
    const y0 = -k * (H / bands);
    const y1 = -(k + 1) * (H / bands);
    const w0 = 24 - (k / bands) * 9;
    const w1 = 24 - ((k + 1) / bands) * 9;
    g.poly([-w0, y0, w0, y0, w1, y1, -w1, y1]).fill(k % 2 ? C.paper : C.red);
  }
  g.poly([-24, 0, 24, 0, 15, -H, -15, -H]).stroke(INK);
  g.rect(-20, -H - 6, 40, 8).fill(C.ink);
  g.rect(-13, -H - 36, 26, 30).fill(C.yellow).stroke(INK);
  g.moveTo(-13, -H - 21).lineTo(13, -H - 21).stroke(THIN);
  g.poly([-18, -H - 36, 0, -H - 56, 18, -H - 36]).fill(C.ink);
  g.rect(-5, -30, 10, 18).fill(C.ink);
  c.addChild(g);
  return { c, lamp: { x: 0, y: -H - 22 } };
}

/** Fishing pen at sea level (origin = anchor tile center at LAND level; drawn DROP lower) */
export function penArt(level: number, fw = 2, fh = 2, auto = false, waterColor?: number): Container {
  const c = new Container();
  const g = new Graphics();
  c.y = DROP;
  const a = P(-0.42, -0.42);
  const b = P(fw - 0.58, -0.42);
  const d = P(-0.42, fh - 0.58);
  const e = P(fw - 0.58, fh - 0.58);
  const water = waterColor ?? (level >= 10 ? 0x1c3a51 : level >= 5 ? 0x2c5f8f : 0x3a7fb1);
  g.poly([a.x, a.y, b.x, b.y, e.x, e.y, d.x, d.y]).fill(water);
  // net pattern
  for (let k = 1; k < 6; k++) {
    const f = k / 6;
    g.moveTo(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f).lineTo(d.x + (e.x - d.x) * f, d.y + (e.y - d.y) * f);
    g.moveTo(a.x + (d.x - a.x) * f, a.y + (d.y - a.y) * f).lineTo(b.x + (e.x - b.x) * f, b.y + (e.y - b.y) * f);
  }
  g.stroke({ width: 1.2, color: 0xffffff, alpha: 0.18 });
  // wooden frame (thick planks)
  const frameCol = level >= 10 ? 0xffd77a : 0xc99358;
  const plank = (p: { x: number; y: number }, q: { x: number; y: number }) => {
    g.moveTo(p.x, p.y).lineTo(q.x, q.y).stroke({ width: 13, color: C.ink, cap: 'round' });
    g.moveTo(p.x, p.y - 1).lineTo(q.x, q.y - 1).stroke({ width: 8, color: frameCol, cap: 'round' });
  };
  plank(a, b);
  plank(a, d);
  plank(b, e);
  plank(d, e);
  for (const p of [a, b, d, e]) {
    g.rect(p.x - 5, p.y - 22, 10, 24).fill(0x6a4325).stroke(THIN);
    g.circle(p.x, p.y - 22, 5).fill(0x8a5a2e).stroke(THIN);
  }
  // buoys
  for (const [p, q] of [
    [a, b],
    [d, e],
  ]) {
    const m = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
    g.circle(m.x, m.y - 6, 7).fill(C.red).stroke(THIN);
    g.rect(m.x - 7, m.y - 8, 14, 3).fill(0xffffff);
  }
  // level badge: little hut from level 5
  if (level >= 5) {
    const hut = new Graphics();
    const hp = { x: (a.x + b.x) / 2 + 10, y: (a.y + b.y) / 2 - 4 };
    hut.rect(hp.x - 14, hp.y - 26, 28, 22).fill(0xede4d6).stroke(THIN);
    hut.poly([hp.x - 18, hp.y - 26, hp.x, hp.y - 40, hp.x + 18, hp.y - 26]).fill(C.megaBlue).stroke(THIN);
    c.addChild(hut);
  }
  // KL21 · Mar de Pescados Automático: a little silo + conveyor arm on the back corner
  if (auto) {
    const rig = new Graphics();
    const sp = { x: d.x + 14, y: d.y - 4 };
    rig.ellipse(sp.x, sp.y + 2, 16, 6).fill({ color: C.ink, alpha: 0.25 });
    rig.rect(sp.x - 13, sp.y - 46, 26, 46).fill(0xd9dde2).stroke(THIN);
    rig.ellipse(sp.x, sp.y - 46, 13, 5).fill(0xeef1f4).stroke(THIN);
    rig.poly([sp.x - 15, sp.y - 46, sp.x, sp.y - 60, sp.x + 15, sp.y - 46]).fill(C.megaBlue).stroke(THIN);
    for (const y of [-14, -28]) rig.moveTo(sp.x - 13, sp.y + y).lineTo(sp.x + 13, sp.y + y).stroke({ width: 1.5, color: C.ink, alpha: 0.5 });
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    rig.moveTo(sp.x + 10, sp.y - 30).lineTo(cx, cy - 34).stroke({ width: 5, color: C.ink, cap: 'round' });
    rig.moveTo(sp.x + 10, sp.y - 30).lineTo(cx, cy - 34).stroke({ width: 2.5, color: C.yellow, cap: 'round' });
    rig.moveTo(cx, cy - 34).lineTo(cx, cy - 6).stroke({ width: 2, color: C.ink });
    rig.poly([cx - 8, cy - 8, cx + 8, cy - 8, cx + 5, cy, cx - 5, cy]).fill(0x8a95a3).stroke({ width: 1.5, color: C.ink });
    // AUTO pennant
    rig.moveTo(sp.x, sp.y - 60).lineTo(sp.x, sp.y - 78).stroke({ width: 2, color: C.ink });
    rig.poly([sp.x, sp.y - 78, sp.x + 18, sp.y - 74, sp.x, sp.y - 70]).fill(C.green).stroke({ width: 1.5, color: C.ink });
    c.addChild(rig);
  }
  c.addChildAt(g, 0);
  return c;
}

/** Simple label plate above buildings */
export function plate(text: string, color: number = C.paper, size = 22): Container {
  const c = new Container();
  const t: Text = txt(text, { fontFamily: F.poster, fontSize: size, fill: C.ink });
  t.anchor.set(0.5);
  const w = t.width + 22;
  const h = size + 10;
  const bg = new Graphics()
    .rect(-w / 2 + 4, -h / 2 + 4, w, h)
    .fill(C.ink)
    .rect(-w / 2, -h / 2, w, h)
    .fill(color)
    .stroke({ width: 3, color: C.ink });
  c.addChild(bg, t);
  return c;
}

// ------------------------------------------------------------------ legacy helpers (IslandSandbox)
export function habitatArt(element: string, fw = 3, fh = 3, level = 1): Container {
  const p = habitatParts(element, level, fw, fh);
  const c = new Container();
  c.addChild(p.ground, p.back, p.front);
  return c;
}
export function sanctuaryArt(fw = 3, fh = 3): Container {
  return sanctuaryParts(fw, fh).c;
}
export function farmArt(fw = 2, fh = 2, tier = 1): Container {
  const c = penArt(tier * 3, fw, fh);
  c.y = 0;
  return c;
}
