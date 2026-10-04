/**
 * Faction / hull-Mk decor that is not part of the baked hull texture: figureheads (rubber-duck head
 * with a paper pirate hat, stone gargoyle, venetian mask, bone skull) and animated extras
 * (palm tree, Tesla coils, kraken tentacles, floating books, blinking eyes, fog, glitch bars,
 * star wake, duck tail). Each feature is anchored to a cell: when that cell breaks, the decor
 * flies away with its piece.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import { CELL, Cell, ShipModel } from '../ship';
import { glowTexture, sparkTexture } from '../../art/textures';
import { ShipLayout } from './layout';
import { ShipStyle } from './styles';
import { Pt, hash, mix } from './util';

export interface FeatureCtx {
  st: ShipStyle;
  L: ShipLayout;
  model: ShipModel;
  flip: boolean;
  bow: Pt;
  stern: Pt;
  waterY: number;
  /** container positioned at a ship-space point (mirrored when flipped) */
  root(sx: number, sy: number): Container;
  /** ship-space → local */
  toLocal(sx: number, sy: number): Pt;
}

export interface Feature {
  kind: string;
  root: Container;
  anchor: Cell | null;
  layer: 'back' | 'front';
  step?(frame: number, t: number): void;
}

const top = (L: ShipLayout, x: number) => L.topY[Math.max(0, Math.min(L.wPx, Math.round(x)))];

/** the alive model cell under a ship-space point (searching down/around a little) */
function cellNear(c: FeatureCtx, sx: number, sy: number): Cell | null {
  const gx = Math.floor(sx / CELL);
  const gy = Math.floor(sy / CELL);
  for (const [dx, dy] of [[0, 0], [0, 1], [-1, 0], [1, 0], [-1, 1], [1, 1], [0, 2], [-1, 2], [1, 2]]) {
    const cell = c.model.get(Math.max(0, Math.min(c.model.cols - 1, gx + dx)), gy + dy);
    if (cell) return cell;
  }
  return null;
}

/** deck spots: hull tops with air above, away from modules, spread along the ship */
function deckSpots(c: FeatureCtx, n: number, from = 0.15, to = 0.85, narrow = false): { sx: number; sy: number; cell: Cell | null }[] {
  const L = c.L;
  const out: { sx: number; sy: number; cell: Cell | null }[] = [];
  const len = L.maxX - L.minX;
  const cands: number[] = [];
  for (let x = L.minX + len * from; x <= L.minX + len * to; x += 8) {
    const t = top(L, x);
    if (Number.isNaN(t)) continue;
    const gx = Math.floor(x / CELL);
    const gy = Math.floor((t + 2) / CELL);
    // air above and no module in the cells above/around
    let ok = true;
    for (let dy = 1; dy <= 2 && ok; dy++) for (const dx of narrow ? [0] : [-1, 0, 1]) if (c.model.get(gx + dx, gy - dy)) ok = false;
    if (ok) cands.push(x);
  }
  if (!cands.length) return out;
  for (let i = 0; i < n; i++) {
    const x = cands[Math.floor(((i + 0.5) / n) * cands.length)];
    if (out.some((o) => Math.abs(o.sx - x) < 50)) continue;
    const t = top(L, x);
    out.push({ sx: x, sy: t, cell: cellNear(c, x, t + 6) });
  }
  return out;
}

export function buildFeatures(c: FeatureCtx): Feature[] {
  const out: Feature[] = [];
  const f = c.st.feat;
  if (f.figure !== 'none') {
    const fig = figure(c);
    if (fig) out.push(fig);
  }
  for (const e of f.extras) {
    switch (e) {
      case 'tail':
        out.push(duckTail(c));
        break;
      case 'palm':
        out.push(...deckSpots(c, 1, 0.3, 0.8, true).map((s) => palm(c, s.sx, s.sy, s.cell)));
        break;
      case 'tesla':
        out.push(...deckSpots(c, 2, 0.2, 0.8).map((s, i) => tesla(c, s.sx, s.sy, s.cell, i)));
        break;
      case 'tentacles':
        out.push(...tentacles(c));
        break;
      case 'books':
        out.push(...books(c));
        break;
      case 'eyes':
        out.push(...eyes(c));
        break;
      case 'fog':
        out.push(fog(c));
        break;
      case 'glitch':
        out.push(glitch(c));
        break;
      case 'stars':
        out.push(starWake(c));
        break;
    }
  }
  return out.filter(Boolean);
}

// ================================================================ figureheads

function figure(c: FeatureCtx): Feature | null {
  const { st, L } = c;
  const [bx] = c.bow;
  const ink = st.ink;
  switch (st.feat.figure) {
    case 'duck': {
      const hx = bx - 36;
      const t = top(L, hx);
      if (Number.isNaN(t)) return null;
      const root = c.root(hx, t - 26);
      root.scale.set(root.scale.x * 1.3, 1.3);
      const neck = new Graphics();
      neck.ellipse(-4, 18, 24, 14).fill(st.hull.base).stroke({ width: 3.5, color: ink });
      const head = new Graphics();
      head.circle(0, 0, 27).fill(st.hull.base).stroke({ width: 3.5, color: ink });
      // cel shade + rim light
      head.arc(0, 0, 24, 1.2, 3.4).stroke({ width: 7, color: st.hull.shadow, cap: 'round' });
      head.ellipse(-8, -14, 9, 5).fill({ color: 0xffffff, alpha: 0.9 });
      head.circle(4, -20, 2).fill(0xffffff);
      head.ellipse(13, 9, 6, 3.5).fill({ color: 0xff8aa8, alpha: 0.8 });
      // beak
      const beak = new Graphics();
      beak.moveTo(18, -4).bezierCurveTo(32, -10, 46, -4, 47, 3).bezierCurveTo(40, 6, 28, 6, 18, 4).closePath().fill(0xff8a1a).stroke({ width: 3, color: ink, join: 'round' });
      beak.moveTo(19, 4).bezierCurveTo(30, 8, 40, 9, 42, 11).bezierCurveTo(34, 15, 24, 13, 18, 9).closePath().fill(0xe0601a).stroke({ width: 2.6, color: ink, join: 'round' });
      beak.moveTo(22, -2).lineTo(40, -3).stroke({ width: 1.6, color: 0xffc070, cap: 'round' });
      const eye = new Graphics();
      const drawEye = (open: boolean) => {
        eye.clear();
        if (open) {
          eye.ellipse(8, -6, 7, 9).fill(0xffffff).stroke({ width: 2.6, color: ink });
          eye.ellipse(10, -5, 4.2, 6).fill(ink);
          eye.circle(11.5, -8, 1.8).fill(0xffffff);
        } else {
          eye.moveTo(1.5, -5).quadraticCurveTo(8, 1, 14.5, -5).stroke({ width: 3, color: ink, cap: 'round' });
        }
      };
      drawEye(true);
      // paper pirate hat (folded newspaper bicorne with a skull)
      const hat = new Graphics();
      hat.moveTo(-34, -14).lineTo(-6, -58).lineTo(32, -16).quadraticCurveTo(0, -24, -34, -14).closePath().fill(0xf2efe6).stroke({ width: 3, color: ink, join: 'round' });
      hat.moveTo(-6, -58).lineTo(2, -18).stroke({ width: 1.6, color: 0xb8b2a0 });
      for (let i = 0; i < 4; i++) hat.moveTo(-20 + i * 4, -26 - i * 7).lineTo(-8 + i * 3, -27 - i * 7).stroke({ width: 1.4, color: 0x8a8578 });
      for (let i = 0; i < 3; i++) hat.moveTo(8 + i * 2, -26 - i * 6).lineTo(18 - i * 2, -24 - i * 6).stroke({ width: 1.4, color: 0x8a8578 });
      hat.circle(-1, -36, 5.5).fill(ink);
      hat.circle(-3, -37, 1.4).fill(0xf2efe6).circle(1, -37, 1.4).fill(0xf2efe6);
      hat.moveTo(-8, -28).lineTo(6, -24).moveTo(6, -28).lineTo(-8, -24).stroke({ width: 2, color: ink, cap: 'round' });
      hat.moveTo(-34, -14).quadraticCurveTo(0, -22, 32, -16).quadraticCurveTo(0, -12, -34, -14).closePath().fill(0xd8d2c0).stroke({ width: 2, color: ink });
      root.addChild(neck, head, beak, eye, hat);
      const cell = cellNear(c, hx, t + 6);
      let blinkAt = 20;
      return {
        kind: 'duck',
        root,
        anchor: cell,
        layer: 'front',
        step(frame) {
          const open = !(frame >= blinkAt && frame < blinkAt + 2);
          drawEye(open);
          if (frame >= blinkAt + 2) blinkAt = frame + 24 + Math.floor(hash(frame, 7) * 30);
          head.rotation = beak.rotation = eye.rotation = Math.sin(frame * 0.35) * 0.04;
          hat.rotation = Math.sin(frame * 0.35 + 0.6) * 0.07;
        },
      };
    }
    case 'gargoyle': {
      const t = top(L, bx - 4);
      if (Number.isNaN(t)) return null;
      const root = c.root(bx - 6, t + 8);
      const g = new Graphics();
      const sc = st.trim;
      // bat wing behind
      g.moveTo(-6, -6).lineTo(-26, -34).lineTo(-20, -18).lineTo(-34, -22).lineTo(-22, -6).lineTo(-30, -2).lineTo(-8, 4).closePath().fill(sc.shadow).stroke({ width: 2.6, color: st.ink, join: 'round' });
      // head
      g.moveTo(-10, 10)
        .lineTo(-8, -14)
        .lineTo(4, -20)
        .lineTo(22, -14)
        .lineTo(34, -6)
        .lineTo(36, 2)
        .lineTo(24, 6)
        .lineTo(30, 12)
        .lineTo(16, 16)
        .lineTo(0, 18)
        .closePath()
        .fill(sc.base)
        .stroke({ width: 3, color: st.ink, join: 'round' });
      g.moveTo(4, 8).lineTo(16, 14).lineTo(0, 18).lineTo(-10, 10).closePath().fill(sc.shadow);
      // mouth + fangs
      g.moveTo(16, 4).lineTo(34, 2).stroke({ width: 2.4, color: st.ink });
      g.moveTo(22, 3).lineTo(24, 8).lineTo(26, 3).closePath().fill(0xffffff).stroke({ width: 1.2, color: st.ink });
      g.moveTo(29, 2.5).lineTo(30.5, 6).lineTo(32, 2).closePath().fill(0xffffff).stroke({ width: 1.2, color: st.ink });
      // horns + ear
      g.moveTo(2, -18).quadraticCurveTo(-4, -34, -14, -38).quadraticCurveTo(-6, -28, -4, -16).closePath().fill(sc.light).stroke({ width: 2.4, color: st.ink, join: 'round' });
      g.moveTo(12, -17).lineTo(10, -30).lineTo(18, -16).closePath().fill(sc.base).stroke({ width: 2.2, color: st.ink, join: 'round' });
      // brow + glowing eye
      g.moveTo(10, -10).lineTo(24, -8).stroke({ width: 3, color: st.ink, cap: 'round' });
      const eye = new Graphics();
      eye.ellipse(18, -4, 3.6, 2.4).fill(0xffb84a);
      const glow = new Sprite(glowTexture());
      glow.anchor.set(0.5);
      glow.tint = 0xffb84a;
      glow.blendMode = 'add';
      glow.scale.set(0.25);
      glow.position.set(18, -4);
      // moss
      g.ellipse(-2, -14, 7, 3).fill(st.accent.base);
      g.ellipse(4, 16, 6, 2.6).fill(st.accent.base);
      // cracks
      g.moveTo(-2, 0).lineTo(4, 4).lineTo(2, 10).stroke({ width: 1.4, color: st.ink, alpha: 0.7 });
      root.addChild(g, glow, eye);
      return {
        kind: 'gargoyle',
        root,
        anchor: cellNear(c, bx - 20, t + 10),
        layer: 'front',
        step(frame) {
          glow.alpha = 0.6 + 0.4 * Math.sin(frame * 0.5);
        },
      };
    }
    case 'mask': {
      const t = top(L, bx - 8);
      if (Number.isNaN(t)) return null;
      const root = c.root(bx - 10, t + 26);
      root.scale.set(root.scale.x * 1.45, 1.45);
      const g = new Graphics();
      // feather plume
      for (let i = 0; i < 3; i++) {
        g.ellipse(-10 + i * 6, -26 - i * 3, 5, 18).fill(i === 1 ? st.accent.base : st.accent.shadow).stroke({ width: 2, color: st.ink });
      }
      g.moveTo(-22, -6)
        .quadraticCurveTo(-11, -15, 0, -6)
        .quadraticCurveTo(11, -15, 22, -6)
        .quadraticCurveTo(20, 8, 9, 8)
        .quadraticCurveTo(2, 8, 0, 3)
        .quadraticCurveTo(-2, 8, -9, 8)
        .quadraticCurveTo(-20, 8, -22, -6)
        .closePath()
        .fill(st.trim.base)
        .stroke({ width: 3, color: st.ink, join: 'round' });
      g.moveTo(-18, -3).quadraticCurveTo(-11, -10, -4, -3).stroke({ width: 2, color: st.accent.base });
      g.moveTo(4, -3).quadraticCurveTo(11, -10, 18, -3).stroke({ width: 2, color: st.accent.base });
      g.ellipse(-10, 0, 5, 3).fill(st.ink).ellipse(10, 0, 5, 3).fill(st.ink);
      g.ellipse(-14, -7, 3, 1.4).fill({ color: 0xffffff, alpha: 0.8 });
      // jewel
      g.circle(0, -9, 3).fill(st.accent.base).stroke({ width: 1.5, color: st.ink });
      root.addChild(g);
      return { kind: 'mask', root, anchor: cellNear(c, bx - 20, t + 20), layer: 'front' };
    }
    case 'skull': {
      const t = top(L, bx - 8);
      if (Number.isNaN(t)) return null;
      const root = c.root(bx - 12, t + 14);
      root.scale.set(root.scale.x * 1.2, 1.2);
      const b = st.accent;
      const g = new Graphics();
      // horns / ears of a cat skull
      g.moveTo(-14, -10).lineTo(-12, -30).lineTo(-2, -16).closePath().fill(b.base).stroke({ width: 2.6, color: st.ink, join: 'round' });
      g.moveTo(8, -16).lineTo(18, -30).lineTo(20, -10).closePath().fill(b.base).stroke({ width: 2.6, color: st.ink, join: 'round' });
      g.circle(3, -2, 20).fill(b.base).stroke({ width: 3, color: st.ink });
      g.moveTo(-8, 12).lineTo(14, 12).lineTo(12, 24).lineTo(-6, 24).closePath().fill(b.base).stroke({ width: 2.6, color: st.ink, join: 'round' });
      g.arc(3, -2, 16, 0.4, 2).stroke({ width: 5, color: b.shadow, cap: 'round' });
      for (let i = 0; i < 4; i++) g.moveTo(-4 + i * 5, 12).lineTo(-4 + i * 5, 22).stroke({ width: 1.5, color: st.ink });
      const sockets = new Graphics();
      sockets.ellipse(-5, -4, 6, 7).fill(st.ink).ellipse(12, -4, 6, 7).fill(st.ink);
      sockets.moveTo(3, 5).lineTo(6, 9).lineTo(0, 9).closePath().fill(st.ink);
      const glowL = new Sprite(glowTexture());
      glowL.anchor.set(0.5);
      glowL.tint = st.core.glow;
      glowL.blendMode = 'add';
      glowL.scale.set(0.2);
      glowL.position.set(-5, -4);
      const glowR = new Sprite(glowTexture());
      glowR.anchor.set(0.5);
      glowR.tint = st.core.glow;
      glowR.blendMode = 'add';
      glowR.scale.set(0.2);
      glowR.position.set(12, -4);
      const pupils = new Graphics();
      pupils.circle(-5, -4, 2.2).fill(st.core.light).circle(12, -4, 2.2).fill(st.core.light);
      root.addChild(g, sockets, glowL, glowR, pupils);
      return {
        kind: 'skull',
        root,
        anchor: cellNear(c, bx - 20, t + 12),
        layer: 'front',
        step(frame) {
          const a = 0.55 + 0.45 * Math.sin(frame * 0.6);
          glowL.alpha = glowR.alpha = a;
        },
      };
    }
  }
  return null;
}

// ================================================================ extras

function duckTail(c: FeatureCtx): Feature {
  const { st, L } = c;
  const sx = L.minX + 10;
  const t = top(L, sx + 6);
  const root = c.root(sx, (Number.isNaN(t) ? L.hPx * 0.5 : t) + 14);
  const g = new Graphics();
  g.moveTo(10, 10).quadraticCurveTo(-8, 4, -22, -22).quadraticCurveTo(-2, -12, 14, -8).closePath().fill(st.hull.base).stroke({ width: 3.2, color: st.ink, join: 'round' });
  g.moveTo(-18, -18).quadraticCurveTo(-4, -8, 10, -6).stroke({ width: 2, color: st.hull.light });
  root.addChild(g);
  return { kind: 'tail', root, anchor: cellNear(c, sx + 20, (Number.isNaN(t) ? L.hPx * 0.5 : t) + 10), layer: 'back' };
}

function palm(c: FeatureCtx, sx: number, sy: number, cell: Cell | null): Feature {
  const { st } = c;
  const root = c.root(sx, sy + 2);
  const trunk = new Graphics();
  for (let i = 0; i < 6; i++) {
    const y = -i * 8;
    const x = Math.sin(i * 0.4) * 4 + i * 1.2;
    trunk.moveTo(x - 4.5, y).lineTo(x + 4.5, y).lineTo(x + 4, y - 8.5).lineTo(x - 3.5, y - 8.5).closePath().fill(i % 2 ? 0xa8743f : 0x8f6236).stroke({ width: 1.8, color: st.ink, join: 'round' });
  }
  const crown = new Container();
  crown.position.set(8, -50);
  const leaves = new Graphics();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.62;
    const lx = Math.cos(a) * 26;
    const ly = Math.sin(a) * 18 + 8;
    leaves.moveTo(0, 0).quadraticCurveTo(lx * 0.5 - 4, ly - 12, lx, ly).quadraticCurveTo(lx * 0.5 + 4, ly * 0.5 + 4, 0, 0).closePath().fill(i % 2 ? 0x4fae4a : 0x3f8f3a).stroke({ width: 2, color: st.ink, join: 'round' });
  }
  leaves.circle(-3, 4, 3.6).fill(0x6b4423).stroke({ width: 1.4, color: st.ink });
  leaves.circle(3, 5, 3.6).fill(0x6b4423).stroke({ width: 1.4, color: st.ink });
  crown.addChild(leaves);
  root.addChild(trunk, crown);
  return {
    kind: 'palm',
    root,
    anchor: cell,
    layer: 'front',
    step(frame) {
      crown.rotation = Math.sin(frame * 0.4) * 0.08;
    },
  };
}

function tesla(c: FeatureCtx, sx: number, sy: number, cell: Cell | null, i: number): Feature {
  const { st } = c;
  const root = c.root(sx, sy + 2);
  const g = new Graphics();
  g.roundRect(-9, -6, 18, 7, 2).fill(st.metal.base).stroke({ width: 2, color: st.ink });
  g.roundRect(-6, -32, 12, 27, 3).fill(0xb8682e).stroke({ width: 2.2, color: st.ink });
  for (let y = -29; y < -7; y += 4) g.moveTo(-6, y).lineTo(6, y + 1.5).stroke({ width: 1.4, color: 0xffb070 });
  g.rect(-1, -40, 2, 9).fill(st.metal.light).stroke({ width: 1, color: st.ink });
  g.circle(0, -44, 6).fill(st.metal.light).stroke({ width: 2.2, color: st.ink });
  g.circle(-2, -46, 1.8).fill(0xffffff);
  const glow = new Sprite(glowTexture());
  glow.anchor.set(0.5);
  glow.tint = 0x00e5ff;
  glow.blendMode = 'add';
  glow.scale.set(0.35);
  glow.position.set(0, -44);
  const arcs = new Graphics();
  root.addChild(g, glow, arcs);
  return {
    kind: 'tesla',
    root,
    anchor: cell,
    layer: 'front',
    step(frame) {
      arcs.clear();
      glow.alpha = 0.5 + 0.5 * hash(frame, i, 3);
      if (hash(frame, i, 1) < 0.55) {
        for (let k = 0; k < 2; k++) {
          const a = -Math.PI / 2 + (hash(frame, i, 10 + k) - 0.5) * 2.6;
          let x = 0;
          let y = -44;
          const pts: Pt[] = [[x, y]];
          for (let s = 0; s < 4; s++) {
            x += Math.cos(a) * 7 + (hash(frame, s, k + i * 9) - 0.5) * 8;
            y += Math.sin(a) * 7 + (hash(frame, s + 5, k) - 0.5) * 8;
            pts.push([x, y]);
          }
          for (const [w, col] of [[4, st.ink], [2, k ? 0xffd400 : 0x9ff6ff]] as const) {
            arcs.moveTo(pts[0][0], pts[0][1]);
            for (const p of pts.slice(1)) arcs.lineTo(p[0], p[1]);
            arcs.stroke({ width: w, color: col, cap: 'round', join: 'miter' });
          }
        }
      }
    },
  };
}

function tentacles(c: FeatureCtx): Feature[] {
  const { st, L, waterY } = c;
  const out: Feature[] = [];
  const len = L.maxX - L.minX;
  for (const [fx, side] of [[0.12, -1], [0.78, 1]] as const) {
    const sx = L.minX + len * fx;
    const root = c.root(sx, waterY + 4);
    const g = new Graphics();
    root.addChild(g);
    const seed = fx * 100;
    const h = Math.min(150, waterY - (top(L, sx) || 0) + 40);
    const draw = (t: number) => {
      g.clear();
      const pts: Pt[] = [];
      const n = 10;
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const sway = Math.sin(t * 1.6 + u * 3 + seed) * 10 * u;
        const curl = u > 0.6 ? Math.sin((u - 0.6) * 9) * 26 * side : 0;
        pts.push([side * u * 22 + sway + curl, -u * h + (u > 0.8 ? (u - 0.8) * 60 : 0)]);
      }
      // body: thick to thin
      for (const pass of [0, 1]) {
        for (let i = 0; i < n; i++) {
          const w = (1 - i / n) * 20 + 4;
          g.moveTo(pts[i][0], pts[i][1]).lineTo(pts[i + 1][0], pts[i + 1][1]).stroke({ width: pass ? w : w + 4, color: pass ? st.accent.base : st.ink, cap: 'round' });
        }
      }
      // underside shade + suckers
      for (let i = 1; i < n - 1; i++) {
        const w = (1 - i / n) * 20 + 4;
        const x = pts[i][0] - side * w * 0.28;
        g.circle(x, pts[i][1], Math.max(1.6, w * 0.2)).fill(st.accent.light).stroke({ width: 1, color: st.ink });
        g.moveTo(pts[i][0] + side * w * 0.25, pts[i][1] - 2).lineTo(pts[i + 1][0] + side * w * 0.2, pts[i + 1][1]).stroke({ width: 1.6, color: st.accent.shadow, cap: 'round' });
      }
    };
    draw(0);
    out.push({
      kind: 'tentacle',
      root,
      anchor: cellNear(c, sx, waterY - 20),
      layer: 'front',
      step(frame) {
        draw(frame / 12);
      },
    });
  }
  return out;
}

function books(c: FeatureCtx): Feature[] {
  const { st, L } = c;
  const out: Feature[] = [];
  const len = L.maxX - L.minX;
  const spots = [0.18, 0.42, 0.63, 0.88];
  spots.forEach((fx, i) => {
    const sx = L.minX + len * fx;
    const t = top(L, sx);
    if (Number.isNaN(t)) return;
    const baseY = t - 70 - (i % 2) * 34;
    const root = c.root(sx, baseY);
    const glow = new Sprite(glowTexture());
    glow.anchor.set(0.5);
    glow.tint = st.accent.base;
    glow.blendMode = 'add';
    glow.scale.set(0.45);
    glow.position.set(0, 10);
    const g = new Graphics();
    const cover = [0x8f6b93, 0x3f7a7a, 0xa8433f, 0xb89558][i % 4];
    const draw = (flap: number) => {
      g.clear();
      g.moveTo(0, 2).lineTo(-16, -2 - flap).lineTo(-15, 8 - flap * 0.5).lineTo(0, 11).closePath().fill(cover).stroke({ width: 2, color: st.ink, join: 'round' });
      g.moveTo(0, 2).lineTo(16, -2 - flap).lineTo(15, 8 - flap * 0.5).lineTo(0, 11).closePath().fill(mix(cover, 0x000000, 0.25)).stroke({ width: 2, color: st.ink, join: 'round' });
      g.moveTo(0, 0).lineTo(-13, -4 - flap * 1.4).lineTo(-12, 6 - flap).lineTo(0, 9).closePath().fill(0xf6efdc).stroke({ width: 1.4, color: st.ink });
      g.moveTo(0, 0).lineTo(13, -4 - flap * 1.4).lineTo(12, 6 - flap).lineTo(0, 9).closePath().fill(0xe8dcc0).stroke({ width: 1.4, color: st.ink });
      for (let k = 0; k < 3; k++) g.moveTo(-10, -1 + k * 2.6 - flap).lineTo(-3, 1 + k * 2.6).moveTo(3, 1 + k * 2.6).lineTo(10, -1 + k * 2.6 - flap).stroke({ width: 0.9, color: 0x8f7a55 });
    };
    draw(0);
    root.addChild(glow, g);
    root.rotation = (i % 2 ? 1 : -1) * 0.15;
    out.push({
      kind: 'book',
      root,
      anchor: cellNear(c, sx, t + 6),
      layer: 'front',
      step(frame, t2) {
        draw(Math.abs(Math.sin(frame * 0.5 + i)) * 6);
        root.y = c.toLocal(sx, baseY + Math.sin(t2 * 1.8 + i) * 6)[1];
      },
    });
  });
  return out;
}

function eyes(c: FeatureCtx): Feature[] {
  const { st, L, waterY } = c;
  const out: Feature[] = [];
  const len = L.maxX - L.minX;
  [0.22, 0.5, 0.76].forEach((fx, i) => {
    const sx = L.minX + len * fx;
    const t = top(L, sx);
    if (Number.isNaN(t)) return;
    const sy = t + (waterY - t) * 0.5;
    const gx = Math.floor(sx / CELL);
    const gy = Math.floor(sy / CELL);
    const cell = c.model.get(gx, gy);
    if (!cell || cell.module !== undefined) return;
    const root = c.root(sx, sy);
    const g = new Graphics();
    const glow = new Sprite(glowTexture());
    glow.anchor.set(0.5);
    glow.tint = st.core.glow;
    glow.blendMode = 'add';
    glow.scale.set(0.3);
    root.addChild(glow, g);
    const draw = (open: number, look: number) => {
      g.clear();
      const h = 8 * open;
      g.moveTo(-13, 0).quadraticCurveTo(0, -h - 3, 13, 0).quadraticCurveTo(0, h + 3, -13, 0).closePath().fill(0xe8e2ee).stroke({ width: 2.6, color: st.ink });
      if (open > 0.3) {
        g.circle(look, 0, 5.5 * open).fill(st.core.base);
        g.ellipse(look, 0, 1.6, 4.6 * open).fill(st.ink);
        g.circle(look - 2, -2, 1.3).fill(0xffffff);
      }
      g.moveTo(-15, -2).quadraticCurveTo(0, -h - 7, 15, -2).stroke({ width: 2.4, color: st.ink, cap: 'round' });
    };
    let next = 10 + i * 13;
    draw(1, 0);
    out.push({
      kind: 'eye',
      root,
      anchor: cell,
      layer: 'front',
      step(frame) {
        let open = 1;
        if (frame >= next && frame < next + 3) open = [0.4, 0, 0.5][frame - next];
        if (frame >= next + 3) next = frame + 20 + Math.floor(hash(frame, i) * 40);
        draw(open, Math.sin(frame * 0.15 + i) * 3.5);
        glow.alpha = 0.4 + 0.3 * open;
      },
    });
  });
  return out;
}

function fog(c: FeatureCtx): Feature {
  const { L, waterY } = c;
  const root = c.root(0, 0);
  const n = 9;
  const len = L.maxX - L.minX + 120;
  const puffs: { s: Sprite; x: number; y: number; v: number }[] = [];
  for (let i = 0; i < n; i++) {
    const s = new Sprite(glowTexture());
    s.anchor.set(0.5);
    s.tint = 0xe8e4f0;
    s.alpha = 0.5;
    s.scale.set(1.6 + hash(i, 2) * 1.0, 0.45 + hash(i, 3) * 0.25);
    const p = { s, x: L.minX - 60 + (i / n) * len, y: waterY - 8 - hash(i, 4) * 16, v: 6 + hash(i, 5) * 8 };
    s.position.set(p.x, p.y);
    root.addChild(s);
    puffs.push(p);
  }
  return {
    kind: 'fog',
    root,
    anchor: null,
    layer: 'front',
    step() {
      for (const p of puffs) {
        p.x -= p.v / 12;
        if (p.x < L.minX - 80) p.x += len;
        p.s.position.set(p.x, p.y);
      }
    },
  };
}

function glitch(c: FeatureCtx): Feature {
  const { L, st, waterY } = c;
  const root = c.root(0, 0);
  const g = new Graphics();
  root.addChild(g);
  let t0 = Infinity;
  for (let x = L.minX; x <= L.maxX; x++) if (!Number.isNaN(L.topY[x])) t0 = Math.min(t0, L.topY[x]);
  return {
    kind: 'glitch',
    root,
    anchor: null,
    layer: 'front',
    step(frame) {
      g.clear();
      if (hash(frame, 1) < 0.35) return;
      const n = 2 + Math.floor(hash(frame, 2) * 4);
      for (let i = 0; i < n; i++) {
        const y = t0 - 30 + hash(frame, i, 3) * (waterY - t0 + 40);
        const x = L.minX + hash(frame, i, 4) * (L.maxX - L.minX);
        const w = 14 + hash(frame, i, 5) * 90;
        const col = [0xff2e88, 0x00e5ff, 0xffffff, 0x000000][Math.floor(hash(frame, i, 6) * 4)];
        g.rect(x, y, w, 1.5 + hash(frame, i, 7) * 4).fill({ color: col, alpha: 0.85 });
      }
      void st;
    },
  };
}

function starWake(c: FeatureCtx): Feature {
  const { L, waterY, st } = c;
  const root = c.root(L.minX, waterY - 6);
  const stars: { s: Sprite; life: number; vx: number; vy: number }[] = [];
  return {
    kind: 'stars',
    root,
    anchor: null,
    layer: 'front',
    step(frame) {
      if (stars.length < 14 && hash(frame, 3) < 0.7) {
        const s = new Sprite(sparkTexture());
        s.anchor.set(0.5);
        s.tint = [0xffffff, st.neon[1] ?? 0x00e5ff, st.neon[0] ?? 0xff2e88][frame % 3];
        s.blendMode = 'add';
        s.scale.set(0.15 + hash(frame, 4) * 0.2);
        s.position.set(hash(frame, 5) * 20, (hash(frame, 6) - 0.5) * 16);
        root.addChild(s);
        stars.push({ s, life: 1, vx: -(30 + hash(frame, 7) * 40), vy: -4 - hash(frame, 8) * 8 });
      }
      for (let i = stars.length - 1; i >= 0; i--) {
        const p = stars[i];
        p.life -= 1 / 14;
        p.s.x += p.vx / 12;
        p.s.y += p.vy / 12;
        p.s.alpha = Math.max(0, p.life);
        p.s.rotation += 0.3;
        if (p.life <= 0) {
          p.s.destroy();
          stars.splice(i, 1);
        }
      }
    },
  };
}
