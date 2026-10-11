/**
 * LIKY FIGHT — FULL-FRAME SHOTS (the camera language that is NOT the battle's side view).
 *
 *  topDown     the broadside seen from above: the galleon's deck, three barrels firing at the bottom of the frame
 *  pov         over Canelo's shoulder: the cannonball flies AT the camera, growing, through a speed-line tunnel
 *  swing       Canelo's bat swing as a key-pose sequence: anticipation → smear (silhouette ghosts, extended arm,
 *              fire crescent) → contact → follow-through. Reads the prompt live: a late press holds the wind-up, a miss
 *              whiffs. The impact frame itself is the score's branch (`impact`), so the flash guard still decides.
 *  party       a close-up of Cascada partying on deck (dance / wink / taunt), bokeh lights, speakers, papel picado
 *  lowAngle    under the rising galleon: its hull huge overhead, the water column rushing up past the camera
 *  charge      Canelo close-up while the player mashes / holds: the aura grows with the input
 *  leapShot    Canelo crosses the frame on a fire trail with silhouette smears (power = the hold's result)
 *  clash       one punch of the fight cloud at screen scale: whoever won the beat lands a big paw on the other's face
 *  hero        the finale: both crews in a low-angle composition, rays, speakers blasting, confetti
 *
 * Every shot is a clip that covers the frame (k.fullFrame) and draws in the panels layer; cut-ins stay above it.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { Args, Cue } from '../../types';
import { clip, W, H, type Clip, type Kit, type VerbFn } from '../../anime/kit';
import { Actor } from '../../anime/actor';
import { bands, burstPts, focusLines, rng, speedLines, starPts } from '../../anime/draw';
import { lerpColor } from '../../anime/palette';
import { ease } from '../../score';
import { PartyShip, INK } from './ships';
import type { LikyStage } from './stage';

const S = (k: Kit) => k.stage as unknown as LikyStage;
const num = (a: Args, key: string, d: number) => (typeof a[key] === 'number' ? (a[key] as number) : d);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const stepT = (m: number, fps = 12) => Math.floor(m * fps) / fps;

/** Canelo's fur, for the drawn arm / paw (the painting has no arm to bend: the extended arm is drawn in its colors) */
const FUR = { base: 0xc07a43, dark: 0x6e3f22, light: 0xf2d0a2, pad: 0xf29aa6 };
const FUR_B = { base: 0x9fb2c8, dark: 0x4f5f78, light: 0xf2f6ff, pad: 0xf6b2c0 };

// ------------------------------------------------------------------ drawing helpers
/** an arm reaching from `a` to `b` (tapered fur, ink line, stripes) ending in a mitten paw */
export function drawArm(g: Graphics, ax: number, ay: number, bx: number, by: number, w: number, fur = FUR) {
  const dx = bx - ax;
  const dy = by - ay;
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L;
  const uy = dy / L;
  const nx = -uy;
  const ny = ux;
  // a furry silhouette: both edges zig-zag (tufts), wide at the shoulder, narrowing to the wrist
  const edge = (side: 1 | -1, sc: number) => {
    const pts: number[] = [];
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const ww = w * (1.15 - 0.45 * t) * sc;
      const tuft = i % 2 ? 0.82 : 1.08;
      pts.push(ax + dx * t + nx * ww * tuft * side, ay + dy * t + ny * ww * tuft * side);
    }
    return pts;
  };
  const shape = (sc: number) => {
    const l = edge(1, sc);
    const r = edge(-1, sc);
    const out = [...l];
    for (let i = r.length - 2; i >= 0; i -= 2) out.push(r[i], r[i + 1]);
    return out;
  };
  g.poly(shape(1.18)).fill(INK);
  g.poly(shape(1)).fill(fur.base);
  // the shaded underside + a light top edge (cel)
  const under: number[] = [];
  for (let i = 0; i <= 9; i++) {
    const t = i / 9;
    const ww = w * (1.15 - 0.45 * t);
    under.push(ax + dx * t - nx * ww * 0.15, ay + dy * t - ny * ww * 0.15);
  }
  for (let i = 9; i >= 0; i--) {
    const t = i / 9;
    const ww = w * (1.15 - 0.45 * t) * (i % 2 ? 0.82 : 1.0);
    under.push(ax + dx * t - nx * ww, ay + dy * t - ny * ww);
  }
  g.poly(under).fill(fur.dark);
  for (let i = 1; i < 9; i += 2) {
    const t = i / 9;
    const ww = w * (1.15 - 0.45 * t);
    g.moveTo(ax + dx * t + nx * ww * 0.9, ay + dy * t + ny * ww * 0.9).lineTo(ax + dx * (t + 0.06) + nx * ww * 0.55, ay + dy * (t + 0.06) + ny * ww * 0.55).stroke({ width: Math.max(4, w * 0.16), color: fur.light });
  }
  // a big mitten paw with toe beans
  const r = w * 1.25;
  const px = bx + ux * r * 0.3;
  const py = by + uy * r * 0.3;
  g.circle(px, py, r + w * 0.24).fill(INK);
  g.circle(px, py, r).fill(fur.light);
  g.circle(px - ux * r * 0.2 - nx * r * 0.3, py - uy * r * 0.2 - ny * r * 0.3, r * 0.55).fill({ color: fur.base, alpha: 0.35 });
  for (let i = -1; i <= 1; i++) g.circle(px + ux * r * 0.45 + nx * i * r * 0.42, py + uy * r * 0.45 + ny * i * r * 0.42, r * 0.17).fill(fur.pad);
  g.circle(px - ux * r * 0.05, py - uy * r * 0.05, r * 0.32).fill(fur.pad);
}
/** a fire crescent (smear) around (cx, cy) from angle a0 to a1 */
export function crescent(g: Graphics, cx: number, cy: number, r: number, a0: number, a1: number, w: number, color: number) {
  const pts: number[] = [];
  const n = 18;
  for (let j = 0; j <= n; j++) {
    const t = a0 + ((a1 - a0) * j) / n;
    const ww = w * Math.sin((j / n) * Math.PI);
    pts.push(cx + Math.cos(t) * (r + ww), cy + Math.sin(t) * (r + ww));
  }
  for (let j = n; j >= 0; j--) {
    const t = a0 + ((a1 - a0) * j) / n;
    pts.push(cx + Math.cos(t) * r, cy + Math.sin(t) * r);
  }
  g.poly(pts).fill(color);
}
/** a cannonball (screen space) */
function ballG(g: Graphics, x: number, y: number, r: number, k: Kit) {
  g.circle(x, y, r * 1.18 + 3).fill(k.pal.ink);
  g.circle(x, y, r).fill(0x2a2440);
  g.circle(x - r * 0.32, y - r * 0.36, r * 0.28).fill({ color: 0xffffff, alpha: 0.75 });
  g.moveTo(x + r * 0.5, y - r * 0.8).lineTo(x + r * 0.75, y - r * 1.25).stroke({ width: Math.max(2, r * 0.12), color: k.pal.ink });
  g.poly(starPts(x + r * 0.8, y - r * 1.35, r * 0.35, r * 0.12, 5, x)).fill(0xffe14a);
}
/** a speaker stack (screen space) with pumping woofers */
function speakerStack(g: Graphics, x: number, y: number, w: number, h: number, pump: number, k: Kit) {
  g.roundRect(x - w / 2 - 8, y - h - 8, w + 16, h + 16, 14).fill(k.pal.ink);
  g.roundRect(x - w / 2, y - h, w, h, 10).fill(0x231a33);
  const n = Math.max(1, Math.round(h / (w * 0.95)));
  for (let i = 0; i < n; i++) {
    const cy = y - h + (h / n) * (i + 0.5);
    const r = w * 0.36 * (1 + pump * 0.18);
    g.circle(x, cy, r + 6).fill(k.pal.ink).circle(x, cy, r).fill(0x4a3d63).circle(x, cy, r * 0.42).fill(k.pal.ink).circle(x - r * 0.18, cy - r * 0.18, r * 0.16).fill({ color: 0xffffff, alpha: 0.4 });
  }
  for (let j = 0; j < 4; j++) g.circle(x - w * 0.3 + j * w * 0.2, y - h + 14, 5).fill([0x2fd4e0, 0xff3d7f, 0xffe14a, 0x8ee05a][j]);
}
/** a string of papel picado across the frame (screen space), swinging with `sway` */
function papelRow(g: Graphics, y: number, sag: number, n: number, x0: number, x1: number, sway: number, seed: number, size = 1) {
  const cols = [0xff3d7f, 0xffe14a, 0x2fd4e0, 0x8ee05a, 0xff8a1f, 0xb06bff];
  const pt = (t: number) => [x0 + (x1 - x0) * t, y + Math.sin(t * Math.PI) * sag];
  g.moveTo(x0, y);
  for (let i = 1; i <= 20; i++) {
    const [x, yy] = pt(i / 20);
    g.lineTo(x, yy);
  }
  g.stroke({ width: 4 * size, color: INK });
  for (let i = 0; i < n; i++) {
    const [x, yy] = pt((i + 0.5) / n);
    const w = 46 * size;
    const h = 56 * size;
    const sw = sway * (i % 2 ? 1 : -1) * 10 * size;
    g.poly([x - w / 2, yy, x + w / 2, yy, x + w / 2 + sw, yy + h, x + sw * 0.5, yy + h - 12 * size, x - w / 2 + sw, yy + h]).fill(cols[(i + seed) % cols.length]).stroke({ width: 3 * size, color: INK });
    g.poly(starPts(x + sw * 0.5, yy + h * 0.45, 11 * size, 4 * size, 4, 0)).fill(INK);
  }
}
/** soft party bokeh (screen space), drifting on twos */
function bokeh(g: Graphics, k: Kit, m: number, seed: number, n = 22) {
  const R = rng(seed);
  const st = stepT(m);
  const v = k.view;
  const cols = [k.pal.accent, k.pal.accent2, 0xffe14a, k.pal.light];
  for (let i = 0; i < n; i++) {
    const x = v.x + ((R() * v.w + st * (10 + R() * 30)) % v.w);
    const y = v.y + R() * v.h;
    const r = 30 + R() * 110;
    const c = cols[i % cols.length];
    g.circle(x, y, r).fill({ color: c, alpha: 0.13 + R() * 0.15 });
    g.circle(x, y, r * 0.55).fill({ color: c, alpha: 0.12 });
  }
}

/** a full-frame shot clip: a container over the set (k.fullFrame), built on mount, updated with its state */
function shot<T>(k: Kit, t0: number, dur: number, build: (root: Container) => T, update: (st: T, lt: number, root: Container) => void, z = 0): Clip {
  let outer: Container | null = null;
  let root: Container | null = null;
  let st: T | null = null;
  return clip(t0, dur, {
    z,
    mount: () => {
      // outer = the music's frame (a punch on every kick, a slow sway on the bass); root = the shot's own picture
      outer = new Container();
      outer.zIndex = z;
      outer.pivot.set(W / 2, H / 2);
      outer.position.set(W / 2, H / 2);
      root = new Container();
      outer.addChild(root);
      st = build(root);
      k.layers.panels.addChild(outer);
    },
    update: (lt) => {
      if (!root || !st || !outer) return;
      update(st, lt, root);
      const m = t0 + lt;
      const kick = k.env('kick', m, 0.09) * (k.reduceMotion ? 0.3 : 1);
      const bass = k.env('bass', m, 0.35, 0.15) * (k.reduceMotion ? 0.3 : 1);
      outer.scale.set(1 + 0.022 * kick);
      outer.rotation = 0.006 * bass * (Math.floor(m / k.beat) % 2 ? 1 : -1);
      outer.visible = root.visible;
      if (root.visible) k.fullFrame = true;
    },
    unmount: () => {
      outer?.destroy({ children: true });
      outer = root = null;
      st = null;
    },
  });
}
const slug = (k: Kit, who: 'canelo' | 'cascada' | 'luzterna' | 'plomito' | 'globito') => S(k).slugs[who];
function ghosts(k: Kit, who: string, n: number): Sprite[] {
  const out: Sprite[] = [];
  for (let i = 0; i < n; i++) {
    const s = k.studio.silhouette(who);
    if (s) out.push(s);
  }
  return out;
}

// ------------------------------------------------------------------ top-down broadside
const topDown: VerbFn = (k, a, cue) => {
  const d = typeof a.beats === 'number' ? (a.beats as number) * k.beat : num(a, 'dur', 1.4);
  return shot(
    k,
    cue.m,
    d,
    (root) => {
      const sea = new Graphics();
      const ship = new Graphics();
      const fx = new Graphics();
      root.addChild(sea, ship, fx);
      return { sea, ship, fx, last: -1 };
    },
    (s, lt, root) => {
      const st = Math.floor(lt * 12);
      const pal = k.pal;
      const v = k.view;
      // the camera: a slow turn and a push (smooth), a kick on each shot
      const kick = [0, 0.05, 0.1].reduce((acc, t) => acc + (lt >= t ? Math.exp(-(lt - t) / 0.08) * 0.03 : 0), 0);
      root.pivot.set(W / 2, H / 2);
      root.position.set(W / 2 + (lt < 0.3 ? Math.sin(lt * 90) * 8 * (1 - lt / 0.3) : 0), H / 2);
      root.rotation = -0.12 + lt * 0.06;
      root.scale.set(1.32 + lt * 0.08 + kick);
      if (st === s.last) return;
      s.last = st;
      const g = s.sea;
      g.clear();
      g.rect(v.x - 300, v.y - 300, v.w + 600, v.h + 600).fill(pal.sea[1]);
      const R = rng(5 + (st % 2));
      for (let i = 0; i < 60; i++) {
        const x = v.x - 200 + R() * (v.w + 400);
        const y = v.y - 200 + R() * (v.h + 400) + ((st * 6) % 40);
        g.moveTo(x, y).quadraticCurveTo(x + 40, y - 14, x + 80, y).stroke({ width: 5, color: lerpColor(pal.light, pal.sea[0], 0.4) });
      }
      // the galleon from above (bow left), on twos
      const sh = s.ship;
      sh.clear();
      const cx = W / 2 + 40;
      const cy = H / 2 - 90;
      const hull = [cx - 520, cy, cx - 380, cy - 150, cx + 380, cy - 165, cx + 470, cy - 110, cx + 470, cy + 110, cx + 380, cy + 165, cx - 380, cy + 150];
      sh.poly(hull.map((p, i) => (i % 2 ? p + 14 : p + 10))).fill({ color: INK, alpha: 0.45 });
      sh.poly(hull).fill(INK);
      const inner = [cx - 490, cy, cx - 368, cy - 136, cx + 372, cy - 150, cx + 455, cy - 102, cx + 455, cy + 102, cx + 372, cy + 150, cx - 368, cy + 136];
      sh.poly(inner).fill(0xff3d7f);
      const deck = [cx - 450, cy, cx - 350, cy - 116, cx + 360, cy - 128, cx + 430, cy - 88, cx + 430, cy + 88, cx + 360, cy + 128, cx - 350, cy + 116];
      sh.poly(deck).fill(0xb98a5a);
      for (let i = -5; i <= 5; i++) sh.moveTo(cx - 360, cy + i * 22).lineTo(cx + 420, cy + i * 22).stroke({ width: 2, color: 0x7a5534 });
      // sail seen from above + mast + disco ball
      sh.roundRect(cx - 40, cy - 190, 80, 380, 30).fill(INK).roundRect(cx - 32, cy - 182, 64, 364, 26).fill(0xfff1e0);
      for (let i = 0; i < 4; i++) sh.rect(cx - 32, cy - 160 + i * 92, 64, 40).fill(0xff3d7f);
      sh.circle(cx, cy, 34).fill(INK).circle(cx, cy, 27).fill(0xdfe9ff);
      sh.poly(starPts(cx - 8, cy - 10, 10, 3, 4, 0)).fill(0xffffff);
      // DJ booth + speakers + the coconut
      sh.roundRect(cx + 210, cy - 70, 120, 140, 10).fill(INK).roundRect(cx + 216, cy - 64, 108, 128, 8).fill(0x2b1d4a);
      sh.circle(cx + 250, cy - 30, 22).fill(0x55406f).circle(cx + 250, cy + 30, 22).fill(0x55406f);
      for (const [x, y] of [
        [cx + 400, cy - 80],
        [cx + 400, cy + 80],
        [cx - 330, cy - 70],
        [cx - 330, cy + 70],
      ])
        sh.roundRect(x - 34, y - 34, 68, 68, 8).fill(INK).circle(x, y, 22 * (1 + 0.15 * Math.max(0, 1 - lt * 4))).fill(0x463a5c);
      sh.circle(cx - 420, cy, 34).fill(INK).circle(cx - 420, cy, 28).fill(0x7a4a2a).circle(cx - 420, cy, 12).fill(0xfff1e0);
      // papel picado from the mast to bow and stern
      for (const [ex, ey] of [
        [cx - 470, cy - 20],
        [cx + 460, cy + 20],
      ]) {
        sh.moveTo(cx, cy).lineTo(ex, ey).stroke({ width: 3, color: INK });
        for (let j = 1; j < 8; j++) sh.rect(cx + (ex - cx) * (j / 8) - 9, cy + (ey - cy) * (j / 8) - 6, 18, 12).fill([0xff3d7f, 0xffe14a, 0x2fd4e0, 0x8ee05a][j % 4]);
      }
      // the three barrels pointing down (at us), firing in a ripple
      const f = s.fx;
      f.clear();
      for (let i = 0; i < 3; i++) {
        const bx = cx - 220 + i * 220;
        const by = cy + 150;
        const t = lt - i * 0.05;
        const recoil = t > 0 ? Math.max(0, 1 - t / 0.2) * 26 : 0;
        sh.roundRect(bx - 18, by - 20 - recoil, 36, 90, 10).fill(INK).roundRect(bx - 12, by - 14 - recoil, 24, 80, 8).fill(0x2a2a3e);
        if (t < 0) continue;
        // muzzle flash (2 frames) → smoke ring → a ball rushing down the frame
        if (t < 0.1) {
          f.poly(starPts(bx, by + 100, 120 * (1 + t * 4), 40, 8, i)).fill(INK);
          f.poly(starPts(bx, by + 100, 100 * (1 + t * 4), 34, 8, i)).fill(0xffe14a);
          f.poly(starPts(bx, by + 100, 46, 16, 6, i + 1)).fill(0xffffff);
        }
        // a cel smoke ring blooming off the muzzle (puffs that swell, then pinch out)
        const rr = 30 + 260 * ease('out', clamp01(t / 0.9));
        const puff = (60 + 40 * clamp01(t / 0.4)) * (t > 0.8 ? Math.max(0, 1 - (t - 0.8) / 0.5) : 1);
        for (let p = 0; p < 7; p++) {
          const ang = (p / 7) * Math.PI * 2 + i;
          const px = bx + Math.cos(ang) * rr;
          const py = by + 120 + Math.sin(ang) * rr * 0.55;
          if (puff < 2) continue;
          f.circle(px, py, puff + 7).fill(k.pal.ink);
        }
        for (let p = 0; p < 7; p++) {
          const ang = (p / 7) * Math.PI * 2 + i;
          const px = bx + Math.cos(ang) * rr;
          const py = by + 120 + Math.sin(ang) * rr * 0.55;
          if (puff < 2) continue;
          f.circle(px, py, puff).fill(lerpColor(0xf4eee6, k.pal.light, 0.3));
          f.circle(px + puff * 0.2, py + puff * 0.25, puff * 0.6).fill(lerpColor(0xf4eee6, k.pal.shadow, 0.35));
        }
        const by2 = by + 120 + t * 1600;
        if (by2 < v.y + v.h + 200) ballG(f, bx + (i - 1) * t * 200, by2, 22 + t * 60, k);
      }
    },
  );
};

// ------------------------------------------------------------------ over the shoulder: the ball comes at the camera
const pov: VerbFn = (k, a, cue) => {
  const id = String(a.prompt ?? '');
  const flight = num(a, 'flight', 2) * k.beat;
  const t0 = cue.m - flight;
  const d = flight - num(a, 'cutBefore', 0.18);
  return shot(
    k,
    t0,
    d,
    (root) => {
      const bg = new Graphics();
      const far = new PartyShip();
      far.setLit(9, 0);
      far.scale.set(0.42);
      far.position.set(1180, 650);
      const tunnel = new Graphics();
      const fx = new Graphics();
      const rim = k.studio.silhouette(slug(k, 'canelo'), 0.5, 1);
      const sil = k.studio.silhouette(slug(k, 'canelo'), 0.5, 1);
      root.addChild(bg, far, tunnel, fx);
      if (rim && sil) {
        const sc = 820 / sil.texture.height;
        rim.scale.set(sc * 1.03);
        sil.scale.set(sc);
        rim.tint = k.pal.accent;
        sil.tint = k.pal.ink;
        root.addChild(rim, sil);
      }
      return { bg, far, tunnel, fx, rim, sil, last: -1 };
    },
    (s, lt) => {
      const pal = k.pal;
      const v = k.view;
      const st = Math.floor((t0 + lt) * 12);
      const x = clamp01(lt / flight);
      // the ball: from their cannon to just over Canelo's shoulder, growing like it's coming through the screen
      const p0: [number, number] = [1100, 610];
      const p1: [number, number] = [860, 470];
      const e = x * x;
      const bx = p0[0] + (p1[0] - p0[0]) * e;
      const by = p0[1] + (p1[1] - p0[1]) * e - Math.sin(x * Math.PI) * 60;
      const r = 6 + 150 * x ** 3;
      if (id) k.setAnchor(id, [bx, by + r + 50]);
      if (st !== s.last) {
        s.last = st;
        const g = s.bg;
        g.clear();
        bands(g, v.x - 40, v.y - 40, v.w + 80, 680 - v.y + 40, pal.sky, [1.2, 1, 1, 0.9, 0.8]);
        bands(g, v.x - 40, 680, v.w + 80, v.y + v.h - 680 + 40, pal.sea, [0.15, 0.35, 2]);
        const R = rng(st % 2 ? 3 : 4);
        for (let i = 0; i < 40; i++) {
          const yy = 690 + R() * 380;
          g.rect(v.x + R() * v.w, yy, 30 + (yy - 680) * 0.3, 4).fill({ color: pal.light, alpha: 0.4 });
        }
        s.tunnel.clear();
        focusLines(s.tunnel, p0[0], p0[1], v.w + 200, v.h + 200, 120 + 420 * (1 - x), Math.round(70 * k.density), pal.light, st, 1 + x);
        s.tunnel.alpha = 0.25 + 0.55 * x;
      }
      const f = s.fx;
      f.clear();
      // smear ghosts behind the ball, back toward the cannon
      for (let j = 3; j >= 1; j--) {
        const xx = Math.max(0, x - j * 0.05);
        const ee = xx * xx;
        const gx = p0[0] + (p1[0] - p0[0]) * ee;
        const gy = p0[1] + (p1[1] - p0[1]) * ee - Math.sin(xx * Math.PI) * 60;
        f.circle(gx, gy, (6 + 150 * xx ** 3) * 0.95).fill({ color: pal.light, alpha: 0.18 * (4 - j) });
      }
      if (lt < 0.1) f.poly(starPts(p0[0] - 20, p0[1] - 10, 70, 22, 7, 0)).fill(0xffe14a);
      ballG(f, bx, by, r, k);
      // Canelo from behind, low left, bracing as it comes (on twos)
      if (s.sil && s.rim) {
        const tt = stepT(t0 + lt) - t0;
        const lean = -0.06 - 0.1 * clamp01((tt - (flight - 0.4)) / 0.3);
        for (const sp of [s.rim, s.sil]) {
          sp.position.set(260 + (sp === s.rim ? 6 : 0), v.y + v.h + 200);
          sp.rotation = lean;
        }
      }
    },
  );
};

// ------------------------------------------------------------------ the swing, key pose by key pose
const swing: VerbFn = (k, a, cue) => {
  const id = String(a.prompt ?? '');
  /** out: Canelo SHOOTS (a fireball leaves his paw on the beat; nothing comes in) · obj 'rock': a falling rock comes in */
  const outShot = !!a.out;
  const rock = a.obj === 'rock';
  const pre = num(a, 'pre', 0.18);
  const d = pre + num(a, 'after', 0.55);
  const t = cue.m;
  const who = slug(k, 'canelo');
  const contact: [number, number] = [1270, 420];
  return shot(
    k,
    t - pre,
    d,
    (root) => {
      const bg = new Graphics();
      const lines = new Graphics();
      const gh = ghosts(k, who, 3);
      const ghostC = new Container();
      for (const g of gh) ghostC.addChild(g);
      const actor = new Actor(k.studio, who, 1050);
      actor.position.set(560, H + 130);
      const arm = new Graphics();
      const fx = new Graphics();
      root.addChild(bg, lines, ghostC, actor, arm, fx);
      return { bg, lines, gh, actor, arm, fx, last: -1 };
    },
    (s, lt, root) => {
      const pal = k.pal;
      const v = k.view;
      const m = t - pre + lt;
      const j = id ? k.judged(id) : { r: 'great' as const, at: t };
      // a miss: after the whiff the shot steps aside and the set shows the cartoon hit on our hull
      if (j?.r === 'miss' && m > t + 0.36) {
        root.visible = false;
        return;
      }
      root.visible = true;
      k.setAnchor('canelo', [760, 280]);
      k.setAnchor('cascada', [1640, 230]);
      const hitAt = j && j.r !== 'miss' ? Math.max(t, j.at) : null;
      const missed = j?.r === 'miss';
      const since = hitAt !== null ? m - hitAt : -1;
      const st = Math.floor(m * 12);
      const great = j?.r === 'great';
      // ---- backdrop: a hot field + lines aimed at the contact point (on twos)
      if (st !== s.last) {
        s.last = st;
        s.bg.clear();
        s.bg.rect(v.x - 20, v.y - 20, v.w + 40, v.h + 40).fill(since >= 0 ? pal.accent : pal.shadow);
        s.bg.poly([v.x - 20, v.y + v.h + 20, v.x + v.w * 0.55, v.y - 20, v.x + v.w + 20, v.y - 20, v.x + v.w + 20, v.y + v.h + 20]).fill(since >= 0 ? pal.accent2 : lerpColor(pal.shadow, pal.base, 0.4));
        s.lines.clear();
        if (since >= 0) speedLines(s.lines, v.w + 400, v.h + 400, -0.55, Math.round(70 * k.density), pal.light, st, 1.6);
        else focusLines(s.lines, contact[0], contact[1], v.w, v.h, 260, Math.round(80 * k.density), pal.light, st);
        s.lines.position.set(since >= 0 ? W / 2 : 0, since >= 0 ? H / 2 : 0);
        s.lines.alpha = 0.55;
      }
      // ---- the pose (stepped on twos: the key poses SNAP)
      const ts = stepT(m, 24);
      let rot = 0;
      let sx = 1;
      let sy = 1;
      let dx = 0;
      let phase: 'wind' | 'smear' | 'contact' | 'follow' | 'whiff' = 'wind';
      if (since < 0 && !missed) {
        // anticipation: lean back, coil (a late press keeps the coil a beat longer — the tension reads)
        const wind = clamp01((ts - (t - pre)) / pre);
        rot = -0.22 * ease('out', wind);
        sx = 1 - 0.06 * wind;
        sy = 1 + 0.05 * wind;
        dx = -40 * wind;
      } else if (missed) {
        phase = 'whiff';
        const w = clamp01((ts - (t + 0.15)) / 0.2);
        rot = -0.22 + 0.62 * ease('out', w);
        sx = 1 + 0.12 * w;
        dx = 30 * w;
      } else {
        const ss = ts - hitAt!;
        if (ss < 0.06) {
          phase = 'smear';
          rot = 0.28;
          sx = 1.34;
          sy = 0.86;
          dx = 90;
        } else if (ss < 0.14) {
          phase = 'contact';
          rot = 0.3;
          sx = 1.18;
          sy = 0.92;
          dx = 80;
        } else {
          phase = 'follow';
          const f = clamp01((ss - 0.14) / 0.4);
          rot = 0.3 - 0.18 * ease('out', f);
          sx = 1.18 - 0.18 * f;
          sy = 0.92 + 0.08 * f;
          dx = 80 - 50 * f;
        }
      }
      s.actor.pose(m, 560 + dx, H + 130, { rot, sx, sy });
      if (s.actor.puppet) {
        s.actor.puppet.lean = phase === 'wind' ? -0.6 : 0.8;
        s.actor.puppet.crouch = phase === 'wind' ? 0.5 : 0;
      }
      // ---- silhouette smears trail the swing (only while it's fast)
      s.gh.forEach((g, i) => {
        const on = phase === 'smear' || (phase === 'contact' && i === 0);
        g.visible = on && (great || i === 0);
        if (!g.visible) return;
        g.tint = i % 2 ? pal.accent2 : 0xffe14a;
        g.alpha = 0.55 - i * 0.15;
        const sc = (1050 / g.texture.height) * (1 + 0.05 * i);
        g.scale.set(sc * sx, sc * sy);
        g.anchor.set(0.5, 0.97);
        g.position.set(560 + dx - (i + 1) * 70, H + 130 + (i + 1) * 14);
        g.rotation = rot - (i + 1) * 0.12;
      });
      // ---- the arm (the rig has no arm to bend: it is drawn) + the fire crescent
      const a2 = s.arm;
      a2.clear();
      // the arm only exists while it's EXTENDED (the coil reads in the body); it grows out of the shoulder
      // the shoulder sits low on his right side: the arm reaches out and up, never across his face
      const shoulder: [number, number] = [860 + dx, 820];
      if (phase !== 'wind') {
        let paw: [number, number];
        if (phase === 'smear' || phase === 'contact') paw = [contact[0] - 40, contact[1] + 50];
        else if (phase === 'whiff') paw = [1240, 330];
        else {
          const f = clamp01((m - (hitAt ?? t) - 0.14) / 0.4);
          paw = [contact[0] - 40 + 60 * f, contact[1] + 50 - 260 * f];
        }
        drawArm(a2, shoulder[0], shoulder[1], shoulder[0] + (paw[0] - shoulder[0]) * 0.78, shoulder[1] + (paw[1] - shoulder[1]) * 0.78, 78);
      }
      const f = s.fx;
      f.clear();
      if (phase === 'smear' || phase === 'contact' || phase === 'whiff') {
        const big = great ? 1 : 0.7;
        crescent(f, 870, 700, 520 * big, -2.3, -0.35, 150 * big, pal.ink);
        crescent(f, 870, 700, 540 * big, -2.2, -0.4, 110 * big, 0xff6a1a);
        crescent(f, 870, 700, 570 * big, -2.1, -0.45, 64 * big, 0xffe14a);
        crescent(f, 870, 700, 600 * big, -2.0, -0.5, 22 * big, 0xffffff);
        f.alpha = phase === 'whiff' ? 0.6 : 1;
      }
      const obj = (x: number, y: number, r: number) => {
        if (!rock) return ballG(f, x, y, r, k);
        const pts: number[] = [];
        for (let q = 0; q < 9; q++) {
          const ang = (q / 9) * Math.PI * 2 + st * 0.4;
          const rr = r * (q % 2 ? 0.8 : 1.1);
          pts.push(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
        }
        f.poly(pts.map((p2, q) => (q % 2 ? p2 + 6 : p2 + 6))).fill(pal.ink);
        f.poly(pts).fill(0xb8b0c8);
        f.poly(pts.slice(0, 8)).fill(0x8c84a0);
      };
      if (outShot) {
        // a fireball leaves the paw on the beat and flies off to the upper right (a miss: it sputters out)
        if (phase === 'smear' || phase === 'contact' || phase === 'follow') {
          const x = clamp01((m - hitAt!) / 0.4);
          const fx = contact[0] + 700 * x;
          const fy = contact[1] - 420 * x;
          for (const [L, w, c] of [
            [260, 60, pal.ink],
            [230, 46, 0xff3d7f],
            [170, 32, 0xff8a1f],
            [90, 18, 0xffe14a],
          ] as const) f.poly([fx + 40, fy - 24, fx - L * 0.86, fy + L * 0.5 + w, fx - L * 0.86 - w * 0.5, fy + L * 0.5 - w]).fill(c);
          f.circle(fx, fy, 30).fill(0xffffff);
        } else if (phase === 'whiff') {
          const x = clamp01((m - (t + 0.15)) / 0.3);
          f.circle(contact[0] + 80 * x, contact[1] + 200 * x * x, 26 * (1 - x) + 4).fill(0xff8a1f);
        } else {
          // the flame gathers in the paw during the wind-up
          const x = clamp01((m - (t - pre)) / pre);
          for (let q = 0; q < 6; q++) f.poly(starPts(820, 520, 40 + 60 * x, 14, 5, q + st)).fill(q % 2 ? 0xffe14a : 0xff8a1f);
        }
        if (id) k.setAnchor(id, [contact[0] - 120, contact[1] + 220]);
      } else if (since < 0 && !missed) {
        const x = clamp01((m - (t - pre)) / pre);
        const bx = 1700 + (contact[0] - 1700) * x;
        const by = 160 + (contact[1] - 160) * x;
        obj(bx, by, 60 + 30 * x);
        if (id) k.setAnchor(id, [bx - 40, by + 140]);
      } else if (missed) {
        const x = clamp01((m - (t + 0.15)) / 0.25);
        obj(contact[0] - x * 1400, contact[1] + x * 600, 90 + x * 80);
      } else if (phase === 'contact') {
        f.poly(burstPts(contact[0], contact[1], 230, 11, 0.45, st)).fill(pal.ink);
        f.poly(burstPts(contact[0], contact[1], 190, 11, 0.45, st)).fill(0xffffff);
        f.poly(burstPts(contact[0], contact[1], 100, 7, 0.4, st + 3)).fill(0xffe14a);
        obj(contact[0] + 30, contact[1] - 20, 80);
      } else if (phase === 'follow') {
        const x = clamp01((m - hitAt! - 0.14) / 0.35);
        const bx = contact[0] + 600 * x;
        const by = contact[1] - 380 * x;
        if (x < 1) {
          f.moveTo(contact[0], contact[1]).lineTo(bx, by).stroke({ width: 26 * (1 - x), color: 0xff8a1f });
          obj(bx, by, 70 * (1 - x) + 12);
        }
      }
    },
    1,
  );
};

// ------------------------------------------------------------------ Cascada partying on deck (close)
const party: VerbFn = (k, a, cue) => {
  const d = typeof a.beats === 'number' ? (a.beats as number) * k.beat : num(a, 'dur', 2);
  const mode = String(a.mode ?? 'dance');
  /** who leads the shot (the dance-off: Canelo copies her moves) */
  const lead = a.who === 'canelo' ? 'canelo' : 'cascada';
  return shot(
    k,
    cue.m,
    d,
    (root) => {
      const bg = new Graphics();
      const beams = new Graphics();
      const back = new Container();
      const cas = new Actor(k.studio, slug(k, lead), 980);
      const plo = new Actor(k.studio, slug(k, 'plomito'), 460);
      const glo = new Actor(k.studio, slug(k, 'globito'), 420);
      const front = new Graphics();
      const fx = new Graphics();
      back.addChild(plo, glo);
      root.addChild(bg, beams, back, cas, front, fx);
      if (cas.puppet) cas.puppet.emote('happy', 1);
      return { bg, beams, cas, plo, glo, front, fx, last: -1 };
    },
    (s, lt) => {
      const m = cue.m + lt;
      const pal = k.pal;
      const v = k.view;
      const st = Math.floor(m * 12);
      const beatPh = (((m - k.map.offset) / k.beat) % 1 + 1) % 1;
      const beatN = Math.floor((m - k.map.offset) / k.beat);
      const hop = Math.max(0, 1 - beatPh / 0.35);
      if (st !== s.last) {
        s.last = st;
        s.bg.clear();
        s.bg.rect(v.x - 20, v.y - 20, v.w + 40, v.h + 40).fill(lerpColor(pal.shadow, pal.ink, 0.35));
        bokeh(s.bg, k, m, 31);
        s.beams.clear();
        const cols = [pal.accent, pal.accent2, 0xffe14a];
        for (let i = 0; i < 5; i++) {
          const x0 = v.x + v.w * (0.1 + i * 0.2);
          const ang = -Math.PI / 2 + Math.sin(stepT(m) * 1.8 + i * 1.3) * 0.5;
          const L = 1500;
          s.beams.poly([x0, v.y + v.h + 40, x0 + Math.cos(ang - 0.08) * L, v.y + v.h + 40 + Math.sin(ang - 0.08) * L, x0 + Math.cos(ang + 0.08) * L, v.y + v.h + 40 + Math.sin(ang + 0.08) * L]).fill({ color: cols[i % 3], alpha: 0.18 });
        }
        // foreground: speakers at the edges + papel picado across the top
        s.front.clear();
        speakerStack(s.front, v.x + 120, v.y + v.h + 30, 210, 520, hop, k);
        speakerStack(s.front, v.x + v.w - 120, v.y + v.h + 30, 210, 520, hop, k);
        papelRow(s.front, v.y + 40, 90, 11, v.x - 40, v.x + v.w + 40, Math.sin(stepT(m) * 7), 2, 1.25);
      }
      // Cascada: on twos, a hop on every beat, sway alternating
      const side = beatN % 2 ? 1 : -1;
      let rot = side * 0.07;
      let dy = -hop * 40;
      let sx = 1 + hop * 0.03;
      let sy = 1 - hop * 0.03;
      if (mode === 'taunt') {
        rot = -0.12 + Math.sin(m * 14) * 0.04;
        dy = -Math.abs(Math.sin(m * 7)) * 30;
      }
      const step = k.beatStep(m);
      s.cas.pose(m, 1000, v.y + v.h + 160 + dy, { rot, sx, sy, step, flip: lead === 'canelo' });
      s.plo.pose(m, 420, v.y + v.h + 120 - hop * 26, { rot: -side * 0.08, step });
      s.glo.pose(m, 1560, v.y + v.h - 160 + Math.sin(m * 3) * 20 - hop * 14, { rot: side * 0.05, step });
      if (s.cas.puppet) s.cas.puppet.lean = mode === 'taunt' ? -0.6 : side * 0.3;
      k.setAnchor('cascada', [640, 230]);
      const f = s.fx;
      f.clear();
      if (mode === 'wink') {
        const [hx, hy] = s.cas.head();
        const sc = 1 + 0.4 * Math.sin(clamp01(lt / 0.4) * Math.PI);
        f.poly(starPts(1000 + hx - 60, v.y + v.h + 160 + hy - 40, 70 * sc, 14 * sc, 4, 0.2)).fill(0xffffff);
        f.poly(starPts(1000 + hx + 120, v.y + v.h + 160 + hy - 160, 34, 8, 4, 0.5)).fill(0xffe14a);
      }
    },
  );
};

// ------------------------------------------------------------------ low angle under the rising galleon
const lowAngle: VerbFn = (k, a, cue) => {
  const d = typeof a.beats === 'number' ? (a.beats as number) * k.beat : num(a, 'dur', 2);
  return shot(
    k,
    cue.m,
    d,
    (root) => {
      const bg = new Graphics();
      const lines = new Graphics();
      const water = new Graphics();
      const ship = new PartyShip();
      ship.setLit(9, 0);
      const shipC = new Container();
      shipC.addChild(ship);
      const sil = k.studio.silhouette(slug(k, 'canelo'), 0.5, 1);
      const sil2 = k.studio.silhouette(slug(k, 'luzterna'), 0.5, 1);
      root.addChild(bg, lines, water, shipC);
      for (const sp of [sil2, sil]) if (sp) root.addChild(sp);
      return { bg, lines, water, ship, shipC, sil, sil2, last: -1 };
    },
    (s, lt) => {
      const m = cue.m + lt;
      const pal = k.pal;
      const v = k.view;
      const st = Math.floor(m * 12);
      const x = clamp01(lt / d);
      // the hull overhead: big, tilted, rising away from us (skewed for a cheap perspective)
      s.shipC.position.set(1000, 470 - 160 * ease('inOut', x));
      s.shipC.scale.set(1.9 - 0.25 * x, 1.35 - 0.2 * x);
      s.shipC.rotation = 0.1;
      s.shipC.skew.set(-0.18, 0);
      if (st !== s.last) {
        s.last = st;
        s.bg.clear();
        bands(s.bg, v.x - 40, v.y - 40, v.w + 80, v.h + 80, [...pal.sky].reverse(), [1, 1, 1, 1.2, 1.6]);
        s.lines.clear();
        focusLines(s.lines, 1000, v.y - 300, v.w + 400, v.h + 600, 500, Math.round(60 * k.density), pal.light, st);
        s.lines.alpha = 0.3;
        // the column of water rushing UP past the camera: wide at the bottom (near), narrow at the hull
        const g = s.water;
        g.clear();
        const top = s.shipC.y + 40;
        const wl = (t: number) => 1000 - (760 - 520 * t);
        const wr = (t: number) => 1000 + (760 - 520 * t);
        const pts: number[] = [];
        for (let i = 0; i <= 10; i++) {
          const t = i / 10;
          pts.push(wl(t) + Math.sin(t * 8 + st) * 16, v.y + v.h + 60 - (v.y + v.h + 60 - top) * t);
        }
        for (let i = 10; i >= 0; i--) {
          const t = i / 10;
          pts.push(wr(t) + Math.sin(t * 8 + st + 2) * 16, v.y + v.h + 60 - (v.y + v.h + 60 - top) * t);
        }
        g.poly(pts.map((p, i) => (i % 2 ? p : p + (p < 1000 ? -10 : 10)))).fill(pal.ink);
        g.poly(pts).fill(lerpColor(0x7fe3ff, pal.accent2, 0.25));
        const R = rng(st);
        for (let i = 0; i < 26; i++) {
          const t = R();
          const y = v.y + v.h + 60 - (v.y + v.h + 60 - top) * ((t + st * 0.07) % 1);
          const tt = (v.y + v.h + 60 - y) / (v.y + v.h + 60 - top);
          const xx = wl(tt) + (wr(tt) - wl(tt)) * R();
          g.roundRect(xx - 6 * (1.4 - tt), y - 90 * (1.4 - tt), 12 * (1.4 - tt), 90 * (1.4 - tt), 6).fill({ color: 0xffffff, alpha: 0.85 });
        }
        for (let i = 0; i < 12; i++) g.circle(v.x + R() * v.w, v.y + v.h - R() * 400, 6 + R() * 16).fill({ color: 0xffffff, alpha: 0.8 });
      }
      // our crew looking up, silhouetted at the bottom edge
      if (s.sil) {
        s.sil.tint = pal.ink;
        const sc = 520 / s.sil.texture.height;
        s.sil.scale.set(sc);
        s.sil.position.set(v.x + 260, v.y + v.h + 60);
      }
      if (s.sil2) {
        s.sil2.tint = lerpColor(pal.ink, pal.accent, 0.35);
        const sc = 420 / s.sil2.texture.height;
        s.sil2.scale.set(sc);
        s.sil2.position.set(v.x + 520, v.y + v.h - 10 + Math.sin(m * 2.4) * 10);
      }
    },
  );
};

// ------------------------------------------------------------------ the charge (mash / hold), close on Canelo
const charge: VerbFn = (k, a, cue) => {
  const d = typeof a.beats === 'number' ? (a.beats as number) * k.beat : num(a, 'dur', 2);
  const id = String(a.prompt ?? '');
  return shot(
    k,
    cue.m,
    d,
    (root) => {
      const bg = new Graphics();
      const aura = new Graphics();
      const actor = new Actor(k.studio, slug(k, 'canelo'), 950);
      const fx = new Graphics();
      root.addChild(bg, aura, actor, fx);
      return { bg, aura, actor, fx, last: -1 };
    },
    (s, lt, root) => {
      const m = cue.m + lt;
      const pal = k.pal;
      const v = k.view;
      const ps = id ? k.prompt(id) : null;
      let amt = 0.3;
      if (ps?.p.type === 'mash') amt = 0.15 + 0.85 * Math.min(1, ps.taps / (ps.p.spec.need?.[1] ?? 12));
      else if (ps?.p.type === 'hold') amt = ps.from !== undefined && ps.to === undefined ? 0.2 + 0.8 * clamp01((m - ps.from) / Math.max(0.2, ps.p.mEnd - ps.from)) : 0.15;
      const st = Math.floor(m * 12);
      // the frame trembles with the power
      root.position.set(Math.sin(m * 70) * 6 * amt, Math.cos(m * 63) * 5 * amt);
      if (st !== s.last) {
        s.last = st;
        s.bg.clear();
        s.bg.rect(v.x - 30, v.y - 30, v.w + 60, v.h + 60).fill(pal.ink);
        // rays from behind him
        const cx = 960;
        const cy = 520;
        for (let i = 0; i < 18; i++) {
          const ang = (i / 18) * Math.PI * 2 + st * 0.04;
          s.bg.poly([cx, cy, cx + Math.cos(ang) * 2200, cy + Math.sin(ang) * 2200, cx + Math.cos(ang + 0.1) * 2200, cy + Math.sin(ang + 0.1) * 2200]).fill({ color: i % 2 ? 0xff6a1a : pal.accent, alpha: 0.12 + 0.25 * amt });
        }
        // the aura: stacked flame triangles, size = the input
        const g = s.aura;
        g.clear();
        const n = 16;
        for (let i = 0; i < n; i++) {
          const ang = -Math.PI / 2 + (i / n - 0.5) * 2.6;
          const L = (180 + 520 * amt) * (0.7 + 0.3 * (((i * 7 + st) % 5) / 4));
          const bx = cx + Math.cos(ang) * 220;
          const by = 620 + Math.sin(ang) * 220;
          const tx = bx + Math.cos(ang) * L;
          const ty = by + Math.sin(ang) * L;
          const w = 48 + 30 * amt;
          for (const [sc, c] of [
            [1.15, pal.ink],
            [1, 0xff3d7f],
            [0.75, 0xff8a1f],
            [0.45, 0xffe14a],
          ] as const) g.poly([bx - Math.sin(ang) * w * sc, by + Math.cos(ang) * w * sc, bx + (tx - bx) * sc, by + (ty - by) * sc, bx + Math.sin(ang) * w * sc, by - Math.cos(ang) * w * sc]).fill(c);
        }
        // embers rising
        const R = rng(st);
        const f = s.fx;
        f.clear();
        for (let i = 0; i < Math.round(30 * amt * k.density) + 4; i++) f.poly(starPts(v.x + R() * v.w, v.y + v.h - ((R() * v.h + st * 30) % v.h), 6 + R() * 10, 2, 4, R())).fill(0xffe14a);
      }
      s.actor.pose(m, 960, v.y + v.h + 170, { sx: 1 + 0.04 * amt, sy: 1 - 0.05 * amt });
      if (s.actor.puppet) {
        s.actor.puppet.crouch = 0.4 + 0.5 * amt;
        s.actor.puppet.lean = 0.2;
      }
    },
  );
};

// ------------------------------------------------------------------ the leap across the frame
const leapShot: VerbFn = (k, a, cue) => {
  const d = num(a, 'dur', 0.8);
  const who = slug(k, a.who === 'cascada' ? 'cascada' : 'canelo');
  /** -1 = right to left (Cascada coming at us) */
  const dir = a.dir === -1 ? -1 : 1;
  const prompt = typeof a.prompt === 'string' ? a.prompt : 'leap';
  return shot(
    k,
    cue.m,
    d,
    (root) => {
      const bg = new Graphics();
      const lines = new Graphics();
      const trail = new Graphics();
      const gh = ghosts(k, who, 4);
      const ghostC = new Container();
      for (const g of gh) ghostC.addChild(g);
      const actor = new Actor(k.studio, who, 760);
      root.addChild(bg, lines, trail, ghostC, actor);
      return { bg, lines, trail, gh, actor, last: -1 };
    },
    (s, lt) => {
      const m = cue.m + lt;
      const pal = k.pal;
      const v = k.view;
      const j = a.power !== undefined ? null : k.judged(prompt);
      const power = a.power !== undefined ? num(a, 'power', 1) : j?.r === 'great' ? 1.2 : j?.r === 'hit' ? 0.95 : 0.65;
      const clumsy = a.power === undefined && j?.r === 'miss';
      const st = Math.floor(m * 12);
      if (st !== s.last) {
        s.last = st;
        s.bg.clear();
        bands(s.bg, v.x - 40, v.y - 40, v.w + 80, v.h + 80, pal.sky, [1, 1, 1, 1, 1]);
        s.lines.clear();
        speedLines(s.lines, v.w + 600, v.h + 600, -0.48, Math.round(90 * k.density), pal.light, st, 1.4 * power);
        s.lines.position.set(W / 2, H / 2);
        s.lines.alpha = 0.7;
      }
      const pos = (u: number): [number, number] => [W / 2 + dir * (-1220 + 2400 * u), v.y + v.h + 200 - 1500 * u - Math.sin(u * Math.PI) * 220 * power];
      const x = ease('inOut', clamp01(lt / d));
      const xs = Math.floor(x * 24) / 24;
      const [px, py] = pos(xs);
      const rot = clumsy ? xs * 9 : -0.35 + xs * 0.3;
      s.actor.pose(m, px, py, { rot: rot * dir, sx: 1.18 * power, sy: 0.9, flip: dir < 0 });
      // the fire trail + silhouette smears behind him
      const t = s.trail;
      t.clear();
      for (let i = 1; i <= 12; i++) {
        const [tx, ty] = pos(Math.max(0, xs - i * 0.03));
        const r = (70 - i * 5) * power;
        if (r <= 3) continue;
        t.circle(tx, ty - 330, r + 8).fill(pal.ink);
        t.circle(tx, ty - 330, r).fill(i < 4 ? 0xffe14a : i < 8 ? 0xff8a1f : 0xff3d7f);
      }
      s.gh.forEach((g, i) => {
        const [gx, gy] = pos(Math.max(0, xs - (i + 1) * 0.045));
        const sc = 760 / g.texture.height;
        g.anchor.set(0.5, 0.97);
        g.scale.set(sc * 1.1, sc * 0.92);
        g.position.set(gx, gy);
        g.rotation = (rot - (i + 1) * 0.05) * dir;
        if (dir < 0) g.scale.x *= -1;
        g.tint = i % 2 ? pal.accent2 : 0xffe14a;
        g.alpha = 0.5 - i * 0.11;
      });
    },
  );
};

// ------------------------------------------------------------------ one punch of the fight, at screen scale
const clash: VerbFn = (k, a, cue) => {
  const id = String(a.prompt ?? '');
  const d = num(a, 'dur', 0.5);
  return shot(
    k,
    cue.m,
    d,
    (root) => {
      const bg = new Graphics();
      const can = new Actor(k.studio, slug(k, 'canelo'), 900);
      const cas = new Actor(k.studio, slug(k, 'cascada'), 900);
      const fx = new Graphics();
      root.addChild(bg, can, cas, fx);
      return { bg, can, cas, fx, last: -1 };
    },
    (s, lt) => {
      const m = cue.m + lt;
      const pal = k.pal;
      const v = k.view;
      const j = id ? k.judged(id) : null;
      const st = Math.floor(m * 12);
      const decided = !!j && m >= j.at;
      const win = j ? j.r !== 'miss' : true;
      const big = j?.r === 'great' || j?.r === 'miss';
      if (st !== s.last) {
        s.last = st;
        s.bg.clear();
        s.bg.rect(v.x - 20, v.y - 20, v.w + 40, v.h + 40).fill(pal.accent);
        s.bg.poly([v.x + v.w * 0.62, v.y - 20, v.x + v.w + 20, v.y - 20, v.x + v.w + 20, v.y + v.h + 20, v.x + v.w * 0.38, v.y + v.h + 20]).fill(pal.accent2);
        focusLines(s.bg, W / 2, H / 2 - 40, v.w, v.h, 300, Math.round(70 * k.density), pal.light, st);
      }
      // face-off until the beat is decided, then the punch lands on the loser
      const since = decided ? m - j!.at : -1;
      const hitL = decided && !win;
      const hitR = decided && win;
      const sq = (on: boolean) => (on && since < 0.12 ? 0.82 : 1);
      s.can.pose(m, 480 - (hitL ? 60 : 0), v.y + v.h + 180, { rot: hitL ? -0.25 : 0.08, sx: sq(hitL), sy: 2 - sq(hitL) });
      s.cas.pose(m, 1440 + (hitR ? 60 : 0), v.y + v.h + 180, { rot: hitR ? 0.25 : -0.08, sx: sq(hitR), sy: 2 - sq(hitR), flip: true });
      if (hitR) s.cas.emote('hurt', 1);
      if (hitL) s.can.emote('hurt', 1);
      const f = s.fx;
      f.clear();
      if (!decided) return;
      const reach = clamp01(since / 0.06);
      if (win) drawArm(f, 640, 760, 640 + (1300 - 640) * reach, 760 - 260 * reach, big ? 80 : 60);
      else drawArm(f, 1280, 760, 1280 - (1280 - 620) * reach, 760 - 260 * reach, big ? 80 : 60, FUR_B);
      if (since >= 0.05 && since < 0.2) {
        const cx = win ? 1330 : 590;
        f.poly(burstPts(cx, 470, big ? 220 : 150, 11, 0.45, st)).fill(pal.ink);
        f.poly(burstPts(cx, 470, big ? 180 : 120, 11, 0.45, st)).fill(0xffffff);
        f.poly(burstPts(cx, 470, big ? 90 : 60, 7, 0.4, st + 1)).fill(0xffe14a);
      }
    },
  );
};

// ------------------------------------------------------------------ the hero shot (finale)
const hero: VerbFn = (k, a, cue) => {
  const d = typeof a.beats === 'number' ? (a.beats as number) * k.beat : num(a, 'dur', 2.3);
  const crew = ((k as Kit & { crewLoaded?: string[] }).crewLoaded ?? []).slice(0, 2);
  return shot(
    k,
    cue.m,
    d,
    (root) => {
      const rays = new Graphics();
      const back = new Container();
      const mid = new Container();
      const front = new Container();
      const stage = new Graphics();
      const top = new Graphics();
      const conf = new Graphics();
      const mk = (raw: string, size: number, parent: Container) => {
        const a2 = new Actor(k.studio, raw, size);
        parent.addChild(a2);
        a2.puppet?.emote('happy', 1);
        return a2;
      };
      const actors = {
        luz: mk(slug(k, 'luzterna'), 470, back),
        glo: mk(slug(k, 'globito'), 380, back),
        plo: mk(slug(k, 'plomito'), 420, mid),
        c0: crew[0] ? mk(crew[0], 430, mid) : null,
        c1: crew[1] ? mk(crew[1], 400, mid) : null,
        can: mk(slug(k, 'canelo'), 860, front),
        cas: mk(slug(k, 'cascada'), 880, front),
      };
      actors.can.puppet?.emote('attack', 1);
      root.addChild(rays, back, stage, mid, front, top, conf);
      return { rays, stage, top, conf, actors, last: -1 };
    },
    (s, lt) => {
      const m = cue.m + lt;
      const pal = k.pal;
      const v = k.view;
      const st = Math.floor(m * 12);
      const beatPh = (((m - k.map.offset) / k.beat) % 1 + 1) % 1;
      const hop = Math.max(0, 1 - beatPh / 0.3);
      const blast = m >= 115.419 ? Math.max(0, 1 - (m - 115.419) / 0.4) : 0;
      if (st !== s.last) {
        s.last = st;
        const r = s.rays;
        r.clear();
        r.rect(v.x - 30, v.y - 30, v.w + 60, v.h + 60).fill(pal.shadow);
        const cx = 960;
        const cy = 600;
        for (let i = 0; i < 24; i++) {
          const ang = (i / 24) * Math.PI * 2 + st * 0.03;
          r.poly([cx, cy, cx + Math.cos(ang) * 2600, cy + Math.sin(ang) * 2600, cx + Math.cos(ang + 0.13) * 2600, cy + Math.sin(ang + 0.13) * 2600]).fill({ color: [pal.accent, pal.accent2, 0xffe14a][i % 3], alpha: 0.35 });
        }
        r.circle(cx, cy, 260).fill({ color: pal.light, alpha: 0.35 });
        // speakers at both sides blasting rings, the stage edge, papel picado + the disco ball on top
        const g = s.stage;
        g.clear();
        speakerStack(g, v.x + 170, v.y + v.h + 20, 280, 760, Math.max(hop, blast), k);
        speakerStack(g, v.x + v.w - 170, v.y + v.h + 20, 280, 760, Math.max(hop, blast), k);
        for (const sx of [v.x + 170, v.x + v.w - 170])
          for (let j = 0; j < 3; j++) {
            const rr = 120 + ((beatPh + j / 3) % 1) * 520 + blast * 300;
            g.circle(sx, v.y + v.h - 420, rr).stroke({ width: 10 * (1 - ((beatPh + j / 3) % 1)), color: j % 2 ? pal.accent2 : pal.accent, alpha: 0.8 });
          }
        const t2 = s.top;
        t2.clear();
        papelRow(t2, v.y + 20, 70, 13, v.x - 40, v.x + v.w + 40, Math.sin(stepT(m) * 8), 1, 1.1);
        papelRow(t2, v.y + 120, 60, 9, v.x + 200, v.x + v.w - 200, -Math.sin(stepT(m) * 8), 3, 0.9);
        t2.circle(960, v.y + 70, 70).fill(INK).circle(960, v.y + 70, 60).fill(0xdfe9ff);
        for (let i = 0; i < 6; i++) t2.poly(starPts(960 + Math.cos(i + st) * 140, v.y + 70 + Math.sin(i * 2 + st) * 60, 18, 4, 4, i)).fill(0xffffff);
        // confetti rain (closed form)
        const c = s.conf;
        c.clear();
        const R = rng(9);
        const cols = [pal.accent, pal.accent2, 0xffe14a, 0xffffff];
        for (let i = 0; i < Math.round(110 * k.density); i++) {
          const x = v.x + R() * v.w + Math.sin(m * 3 + i) * 30;
          const y = v.y + ((R() * v.h + (m - cue.m) * (260 + R() * 260)) % v.h);
          const sp = Math.abs(Math.cos(m * (4 + R() * 6) + i));
          c.rect(x, y, 16, 10 * sp + 1).fill(cols[i % 4]);
        }
      }
      // the composition: a low-angle pyramid, back to back in the middle (on twos)
      const A = s.actors;
      const base = v.y + v.h;
      const push = 1 + 0.06 * ease('out', clamp01(lt / 0.5));
      A.can.pose(m, 720, base + 190 - hop * 14, { flip: true, sx: push, sy: push, rot: -0.04 });
      A.cas.pose(m, 1220, base + 200 - hop * 18, { sx: push, sy: push, rot: 0.05 });
      A.luz.pose(m, 360, base - 300 + Math.sin(m * 2.4) * 16, { rot: -0.06 });
      A.glo.pose(m, 1600, base - 330 + Math.sin(m * 3) * 14);
      A.plo.pose(m, 1500, base + 120 - hop * 20, { flip: true });
      A.c0?.pose(m, 430, base + 150 - hop * 16);
      A.c1?.pose(m, 1760, base + 160 - hop * 16, { flip: true });
      k.setAnchor('cascada', [1220, 300]);
    },
  );
};

export const SHOT_VERBS: Record<string, VerbFn> = { topDown, pov, swing, party, lowAngle, chargeShot: charge, leapShot, clashShot: clash, hero };
