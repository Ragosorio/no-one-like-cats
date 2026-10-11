/**
 * CIRCUS MALUS — scene verbs (score.ts calls them by name). Every clip is a pure function of its local time (seekable,
 * pausable, contact-sheet exact); words are baked in the verb body (before the clock), never on the frame they appear.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { Args, Cue } from '../../types';
import { clip, W, H, type Clip, type Kit, type VerbFn } from '../../anime/kit';
import { burstPts, rng, starPts } from '../../anime/draw';
import { ease } from '../../score';
import type { CircusStage, Who } from './stage';
import { AXIS, CREAM, GOLD, INK, PAPER, POSTER, RED, RED_D, SMALL, TEAL, WHITE, both, glove, ribbon } from './art';
import { ORDER_T } from './score';

export const S = (k: Kit) => k.stage as unknown as CircusStage;
export const num = (a: Args, key: string, d: number) => (typeof a[key] === 'number' ? (a[key] as number) : d);
export const durOf = (k: Kit, a: Args, d: number) => (typeof a.beats === 'number' ? (a.beats as number) * k.beat : num(a, 'dur', d));
const st12 = (lt: number) => Math.floor(lt * 12) / 12;

/** a screen point (design box) from an anchor name or [x, y] */
export function screenAt(k: Kit, at: unknown, dx = 0, dy = 0): [number, number] {
  if (Array.isArray(at)) return [Number(at[0]) + dx, Number(at[1]) + dy];
  if (typeof at === 'string') {
    const p = k.stage.anchor?.(at, k);
    if (p) return [p[0] + dx, p[1] + dy];
  }
  return [W / 2 + dx, H / 2 + dy];
}
/** Canelo's feet (world) */
const feet = (k: Kit): [number, number] => [k.num('can.x', 760), k.num('can.y', 960)];

// ------------------------------------------------------------------ type: circus poster words
/**
 * A poster word: Anton caps, cream with a fat black outline and a stacked block shadow; optional ribbon banner behind;
 * `seal` = the Correctores' rubber stamp (red, double border, dead straight); `crooked` = tilted (the asymmetric ones);
 * `plain` = a small lowercase mutter. It pops in rubber-hose style and bounces on the kicks.
 */
const cartel: VerbFn = (k, a, cue) => {
  const text = String(a.text ?? '');
  const size = num(a, 'size', 110);
  const d = durOf(k, a, 1);
  const seal = !!a.seal;
  const plain = !!a.plain;
  const style = plain ? SMALL(Math.round(size * 0.8), CREAM, INK) : seal ? POSTER(size, RED, PAPER) : POSTER(size);
  const tex = k.text.get(text, style);
  const shadowTex = plain || seal ? null : k.text.get(text, POSTER(size, INK, INK));
  const R = rng(cue.id * 13 + 7);
  const rot = a.crooked ? (R() < 0.5 ? -1 : 1) * (0.08 + R() * 0.07) : 0;
  let c: Container | null = null;
  return clip(cue.m, d, {
    z: 3,
    mount: () => {
      c = new Container();
      if (a.banner) {
        const g = new Graphics();
        ribbon(g, 0, 8, tex.width + 120, tex.height * 0.9, RED);
        c.addChild(g);
      }
      if (seal) {
        const g = new Graphics();
        const w = tex.width + 70;
        const h = tex.height + 40;
        g.roundRect(-w / 2, -h / 2, w, h, 12).fill({ color: PAPER, alpha: 0.9 }).stroke({ width: 10, color: RED });
        g.roundRect(-w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 8).stroke({ width: 4, color: RED });
        c.addChild(g);
      }
      if (shadowTex) {
        for (let i = 6; i >= 1; i--) {
          const s = new Sprite(shadowTex);
          s.anchor.set(0.5);
          s.position.set(i * 3, i * 3);
          c.addChild(s);
        }
      }
      const s = new Sprite(tex);
      s.anchor.set(0.5);
      c.addChild(s);
      c.rotation = rot;
      k.layers.type.addChild(c);
    },
    update: (lt) => {
      if (!c) return;
      const [x, y] = screenAt(k, a.at, num(a, 'dx', 0), num(a, 'dy', 0));
      const t = st12(lt);
      // pop: overshoot and settle on twos, a squash on every kick, a quick shrink out
      const pop = t < 0.17 ? 0.4 + (t / 0.17) * 0.9 : t < 0.25 ? 1.3 - ((t - 0.17) / 0.08) * 0.35 : 1;
      const kick = k.env('kick', cue.m + lt, 0.09);
      const out = lt > d - 0.15 ? Math.max(0, (d - lt) / 0.15) : 1;
      c.position.set(x, y);
      c.scale.set(pop * out * (1 + 0.06 * kick), pop * out * (1 - 0.05 * kick));
    },
    unmount: () => {
      c?.destroy({ children: true });
      c = null;
    },
  });
};

// ------------------------------------------------------------------ the film stains (TRUE color, above the film)
function stainShape(g: Graphics, x: number, y: number, r: number, color: number, seed: number, alpha: number) {
  const R = rng(seed);
  g.poly(burstPts(x, y, r, 9, 0.28, seed)).fill({ color, alpha });
  g.circle(x + (R() - 0.5) * r * 0.4, y + (R() - 0.5) * r * 0.4, r * 0.55).fill({ color: 0xffffff, alpha: alpha * 0.18 });
  for (let i = 0; i < 7; i++) {
    const an = R() * Math.PI * 2;
    const dd = r * (1.1 + R() * 0.9);
    g.circle(x + Math.cos(an) * dd, y + Math.sin(an) * dd, r * (0.06 + R() * 0.12)).fill({ color, alpha });
  }
}
/** a splash of true color on the film itself: it stays (over every shot) until the final corrects it away */
function stainClip(k: Kit, t0: number, x: number, y: number, r: number, color: number, seed: number): Clip {
  let g: Graphics | null = null;
  let drawn = '';
  const end = Math.max(0.1, k.score.mCut - t0);
  return clip(t0, end, {
    mount: () => {
      g = new Graphics();
      drawn = '';
      S(k).over.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const fade = 1 - k.num('fade', 0);
      // redraw only when it changes (a settled stain costs nothing per frame)
      const key = `${Math.min(30, Math.floor(lt * 12))}|${fade.toFixed(2)}`;
      if (key === drawn) return;
      drawn = key;
      g.clear();
      if (fade <= 0.01) return;
      const t = st12(lt);
      const sc = t < 0.08 ? 0.5 + (t / 0.08) * 0.7 : t < 0.17 ? 1.2 - ((t - 0.08) / 0.09) * 0.2 : 1;
      // it lands bright, then soaks into the film (it stays, quieter: the color accumulates without hiding the show)
      const soak = lt < 0.8 ? 0.46 : lt < 2.4 ? 0.46 - ((lt - 0.8) / 1.6) * 0.3 : 0.16;
      stainShape(g, x, y, r * sc, color, seed, soak * fade);
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
}
const stain: VerbFn = (k, a, cue) => {
  const [hx, hy] = screenAt(k, a.at);
  const R = rng(cue.id * 31 + 3);
  const r = 62 * num(a, 'size', 1) * (0.85 + R() * 0.3);
  // beside his head, never on a face
  const ox = (R() < 0.5 ? -1 : 1) * (170 + R() * 110);
  const oy = -60 + (R() - 0.5) * 120;
  // the position is taken at the moment it lands (the anchor of that frame), so it is computed on mount
  let placed: Clip | null = null;
  const wrap = clip(cue.m, Math.max(0.1, k.score.mCut - cue.m), {
    mount: () => {
      const [x, y] = screenAt(k, a.at, ox, oy);
      placed = stainClip(k, cue.m, x, y, r, Number(a.color ?? 0xff6a3d), cue.id * 7 + 1);
      placed.mount?.(k);
    },
    update: (lt) => placed?.update(lt, k),
    unmount: () => {
      placed?.unmount?.(k);
      placed = null;
    },
  });
  void hx;
  void hy;
  return wrap;
};

// ------------------------------------------------------------------ Canelo
function pose(k: Kit, cue: Cue, who: Who, name: string, dur: number, extra: Partial<{ dx: number; dy: number; rot: number; sx: number; sy: number }> = {}): Clip {
  return clip(cue.m, dur, { update: (lt) => S(k).wantPose(who, { name, lt, ...extra }) });
}
const poseVerb: VerbFn = (k, a, cue) => pose(k, cue, (a.who as Who) ?? 'canelo', String(a.p ?? 'cool'), durOf(k, a, 1));

/** he drops in from the flies: stretched as he falls, Luzterna drifting after him */
const fall: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 1.2);
  return clip(cue.m, d, {
    update: (lt) => {
      const x = lt / d;
      const y = -(1 - ease('in', x)) * 1000;
      S(k).wantPose('canelo', { name: 'fall', lt, dy: y, sy: 1 + 0.35 * (1 - x), sx: 1 - 0.18 * (1 - x), rot: 0.2 * (1 - x) });
      S(k).wantPose('luzterna', { name: 'fall', lt, dy: -(1 - ease('out', x)) * 700 });
    },
  });
};
/** cartoon dust: puffs at his feet (world) */
const dust: VerbFn = (k, a, cue) => {
  const n = Math.max(3, Math.round(num(a, 'n', 8) * k.density));
  const R = rng(cue.id * 3 + 9);
  const ps = Array.from({ length: n }, (_, i) => ({ dir: i % 2 ? 1 : -1, v: 160 + R() * 260, r: 26 + R() * 30, up: R() * 60 }));
  let g: Graphics | null = null;
  let p0: [number, number] = [0, 0];
  return clip(cue.m, 0.7, {
    mount: () => {
      g = new Graphics();
      k.layers.wfx.addChild(g);
      p0 = feet(k);
    },
    update: (lt) => {
      if (!g) return;
      const t = st12(lt);
      g.clear();
      for (const p of ps) {
        const r = p.r * (0.6 + t * 1.4) * (1 - t / 0.7);
        if (r < 2) continue;
        const x = p0[0] + p.dir * p.v * t;
        const y = p0[1] - 10 - p.up * t;
        g.circle(x, y, r + 5).fill(INK);
        g.circle(x, y, r).fill(PAPER);
      }
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};
/** he runs to one side of the fork (the choice): legs a blur, leaning into it */
const run: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 1.2);
  const side = num(a, 'side', 1);
  const reach = AXIS + side * 520 - k.num('can.x', 760);
  return clip(cue.m, d, {
    update: (lt) => {
      const x = ease('out', lt / d);
      S(k).wantPose('canelo', { name: 'run', lt, dx: reach * x, rot: side * 0.18 * (1 - x), sx: side < 0 ? -1 : 1, dy: -Math.abs(Math.sin(lt * 18)) * 24 * (1 - x) });
    },
  });
};
/** the two signposts of the fork (← and →), mirrored; the picked one spins */
const signs: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 3);
  const pick = num(a, 'pick', 0);
  let g: Graphics | null = null;
  return clip(cue.m, d, {
    z: -1,
    mount: () => {
      g = new Graphics();
      k.layers.wfx.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      g.clear();
      const up = ease('outBack', Math.min(1, lt / 0.3));
      const out = lt > d - 0.2 ? (d - lt) / 0.2 : 1;
      both((sx, side) => {
        const x = sx(AXIS - 380);
        const y = 880;
        const spin = pick === side ? Math.cos(Math.min(1, lt / 0.6) * Math.PI * 6) : 1;
        const h = 260 * up * out;
        g!.rect(x - 9, y - h, 18, h).fill(0x7a4a2a).stroke({ width: 5, color: INK });
        const w = 150 * spin;
        const yy = y - h + 20;
        g!.poly([x, yy, x + side * w, yy, x + side * (w + 46 * Math.sign(spin || 1)), yy + 40, x + side * w, yy + 80, x, yy + 80]).fill(side < 0 ? CREAM : RED).stroke({ width: 6, color: INK });
      });
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};
/**
 * The correcting glove: down from the flies onto Canelo (wherever he ran), it grabs him and sets him EXACTLY on the
 * axis. `miss`: this time he slips aside and the glove closes on thin air.
 */
const correct: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 1.2);
  const id = String(a.prompt ?? '');
  const miss = !!a.miss;
  let g: Graphics | null = null;
  return clip(cue.m, d, {
    z: 2,
    mount: () => {
      g = new Graphics();
      k.layers.wfx.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const j = k.judged(id);
      const side = j?.r === 'right' ? 1 : -1;
      const x0 = k.num('can.x', 760);
      const from = AXIS + side * 520 - x0;
      const x = lt / d;
      // 0–0.35 down · 0.35–0.45 grab · 0.45–0.9 carry to the axis · 0.9–1 let go and up
      const down = x < 0.35 ? ease('out', x / 0.35) : x < 0.9 ? 1 : 1 - (x - 0.9) / 0.1;
      const carry = x < 0.45 ? 0 : x < 0.9 ? ease('inOut', (x - 0.45) / 0.45) : 1;
      const lift = x < 0.45 ? 0 : x < 0.9 ? Math.sin(((x - 0.45) / 0.45) * Math.PI) * 140 : 0;
      let hx: number;
      if (miss) {
        // he hops back home; the glove closes where he was
        const dodge = x < 0.3 ? 0 : ease('out', Math.min(1, (x - 0.3) / 0.25));
        S(k).wantPose('canelo', { name: 'stretch', lt: x < 0.3 ? 1 : (x - 0.3) * d, dx: from * (1 - dodge) });
        hx = x0 + from;
      } else {
        const dx = from + (AXIS - x0 - from) * carry;
        S(k).wantPose('canelo', { name: x < 0.45 ? 'surprise' : 'sym', lt, dx, dy: -lift, rot: x > 0.45 && x < 0.9 ? Math.sin(lt * 20) * 0.08 : 0 });
        hx = x0 + dx;
      }
      const top = -500;
      const gy = top + (k.num('can.y', 960) - 260 - top) * down - (miss ? 0 : lift);
      g.clear();
      g.moveTo(hx, -900).lineTo(hx, gy - 140).stroke({ width: 10, color: INK });
      glove(g, hx, gy, 1.1, x > 0.35 ? 1 : 0.2, 1);
      if (miss && x > 0.4 && x < 0.95) {
        g.circle(hx + 80, gy - 200, 30).fill(PAPER).stroke({ width: 6, color: INK });
        g.moveTo(hx + 72, gy - 210).quadraticCurveTo(hx + 80, gy - 228, hx + 90, gy - 210).stroke({ width: 6, color: INK });
      }
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};

// ------------------------------------------------------------------ the stamps
/** a «CORREGIDO» seal pressed on Canelo (he is shown corrected — symmetric — under it while it lasts) */
const sello: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 1);
  const tex = k.text.get('CORREGIDO', POSTER(54, RED, PAPER));
  let c: Container | null = null;
  return clip(cue.m, d, {
    z: 4,
    mount: () => {
      c = new Container();
      const w = tex.width + 50;
      const h = tex.height + 30;
      const g = new Graphics().roundRect(-w / 2, -h / 2, w, h, 10).stroke({ width: 8, color: RED }).roundRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 6).stroke({ width: 3, color: RED });
      const s = new Sprite(tex);
      s.anchor.set(0.5);
      c.addChild(g, s);
      k.layers.type.addChild(c);
    },
    update: (lt) => {
      if (!c) return;
      S(k).canSymReq = true;
      const [x, y] = screenAt(k, a.at, 0, 40);
      const t = st12(lt);
      c.position.set(x, y);
      c.scale.set(t < 0.08 ? 1.6 - t * 7 : 1);
      c.alpha = lt > d - 0.2 ? (d - lt) / 0.2 : 1;
    },
    unmount: () => {
      c?.destroy({ children: true });
      c = null;
    },
  });
};
/** a big stamp from the flies onto Canelo: lands at the hit; the prompt's result decides who it squashes */
function dropStamp(k: Kit, cue: Cue, id: string, d: number, scale: number, mega: boolean): Clip {
  let g: Graphics | null = null;
  const hitAt = k.score.prompts.find((p) => p.id === id)?.m ?? cue.m + 0.3;
  return clip(cue.m, d, {
    z: 2,
    mount: () => {
      g = new Graphics();
      k.layers.wfx.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const m = cue.m + lt;
      const j = k.judged(id);
      const r = j && j.at <= m + 1e-6 ? j.r : null;
      const [fx, fy] = feet(k);
      const before = m < hitAt;
      // fall (accelerating), land at the hit, then: great = it bounces off and flies away crooked;
      // hit = it lands beside him; miss = it stays on him a beat
      const u = before ? Math.min(1, (m - cue.m) / Math.max(0.05, hitAt - cue.m)) : 1;
      let x = fx;
      let y = -700 + (fy - 10 + 700) * ease('in', u);
      let rot = 0;
      if (!before && r === 'great') {
        const t = m - hitAt;
        x = fx + t * (mega ? -900 : 900);
        y = fy - 10 - 900 * t + 1400 * t * t;
        rot = t * 9;
        if (mega) {
          // it flies up and slaps the clock (crooked forever after… until the order)
          const cx = AXIS;
          const cy = 470;
          const tt = Math.min(1, t / 0.5);
          x = fx + (cx - fx) * ease('out', tt);
          y = fy - 10 + (cy - fy + 10) * ease('out', tt);
          rot = 0.3 * tt;
        }
      } else if (!before && r === 'hit') {
        x = fx + 260;
        rot = 0.12;
      }
      g.clear();
      if (!before && r === 'miss' && m - hitAt > 0.9) return;
      if (!before && r === 'great' && !mega && m - hitAt > 0.8) return;
      drawRotStamp(g, x, y, scale, rot);
      if (!before && m - hitAt < 0.3 && r !== 'great') {
        const a2 = 1 - (m - hitAt) / 0.3;
        g.poly(starPts(x, fy - 8, 260 * scale + 80, 120 * scale + 40, 10, 0.2)).stroke({ width: 8, color: INK, alpha: a2 });
      }
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
}
function drawRotStamp(g: Graphics, x: number, y: number, s: number, rot: number) {
  // the stamp + the mitt that holds it, drawn with rotated points around the rubber face (one Graphics, no transform)
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const P = (px: number, py: number): [number, number] => [x + px * cos - py * sin, y + px * sin + py * cos];
  const quad = (x0: number, y0: number, x1: number, y1: number) => [...P(x0, y0), ...P(x1, y0), ...P(x1, y1), ...P(x0, y1)];
  g.poly(quad(-120 * s, -70 * s, 120 * s, 0)).fill(0x7a4a2a).stroke({ width: 6, color: INK });
  g.poly(quad(-128 * s, -14 * s, 128 * s, 0)).fill(RED_D).stroke({ width: 4, color: INK });
  g.poly(quad(-26 * s, -170 * s, 26 * s, -60 * s)).fill(0x3e2516).stroke({ width: 6, color: INK });
  const [kx, ky] = P(0, -190 * s);
  g.circle(kx, ky, 52 * s).fill(0x7a4a2a).stroke({ width: 6, color: INK });
  // the glove around the knob (a white mitt + cuff)
  const [gx, gy] = P(0, -250 * s);
  g.circle(gx, gy, 70 * s).fill(WHITE).stroke({ width: 6, color: INK });
  g.poly(quad(-50 * s, -330 * s, 50 * s, -290 * s)).fill(WHITE).stroke({ width: 6, color: INK });
  const [ax, ay] = P(0, -330 * s);
  g.moveTo(ax, ay).lineTo(ax - sin * 900, ay - cos * 900).stroke({ width: 10, color: INK });
}
const bigStamp: VerbFn = (k, a, cue) => dropStamp(k, cue, String(a.prompt ?? ''), durOf(k, a, 1.8), 1.1, false);
const megaStamp: VerbFn = (k, a, cue) => dropStamp(k, cue, String(a.prompt ?? ''), durOf(k, a, 2.6), 1.6, true);

/** a stamp batted away (chorus2): the wing stamp nearest him flies off spinning */
const batAway: VerbFn = (k, a, cue) => {
  const great = a.r === 'great';
  const n = num(a, 'n', 0);
  const side = n % 2 ? 1 : -1;
  let g: Graphics | null = null;
  return clip(cue.m, 0.9, {
    z: 2,
    mount: () => {
      g = new Graphics();
      k.layers.wfx.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const t = st12(lt);
      g.clear();
      const x0 = AXIS + side * 420;
      const x = x0 + side * (great ? 1400 : 300) * t;
      const y = 700 - (great ? 900 : 300) * t + 900 * t * t;
      drawRotStamp(g, x, y, 0.55, side * t * (great ? 14 : 5));
      if (t < 0.15) g.poly(starPts(x0, 700, 150, 70, 8, 0.3)).fill(PAPER).stroke({ width: 7, color: INK });
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};
/** a crooked seal stuck on the backdrop (it stays until the order): proof that the correction failed */
const crookedSeal: VerbFn = (k, a, cue) => {
  const n = num(a, 'n', 0);
  const tex = k.text.get('CORREGIDO', POSTER(32, RED, PAPER));
  // high on the backdrop, around the clock (never over the cast)
  const spots: [number, number][] = [
    [600, 330],
    [1330, 300],
    [720, 250],
    [1200, 240],
  ];
  const [x, y] = spots[n % spots.length];
  const rot = (n % 2 ? 1 : -1) * (0.18 + (n % 3) * 0.08);
  let c: Container | null = null;
  return clip(cue.m + 0.25, Math.max(0.1, ORDER_T - cue.m - 0.25), {
    mount: () => {
      c = new Container();
      const w = tex.width + 40;
      const h = tex.height + 24;
      c.addChild(new Graphics().roundRect(-w / 2, -h / 2, w, h, 8).fill({ color: PAPER, alpha: 0.85 }).stroke({ width: 7, color: RED }));
      const s = new Sprite(tex);
      s.anchor.set(0.5);
      c.addChild(s);
      c.position.set(x, y);
      c.rotation = rot;
      k.layers.wfx.addChild(c);
    },
    update: (lt) => {
      if (!c) return;
      c.scale.set(lt < 0.08 ? 1.8 - lt * 10 : 1);
    },
    unmount: () => {
      c?.destroy({ children: true });
      c = null;
    },
  });
};

// ------------------------------------------------------------------ the chorus line
/** the line shows the step: a mirrored step-touch, out and in on the beats, a jump on 4 */
const lineStep: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 4 * k.beat);
  return clip(cue.m, d, {
    update: (lt) => {
      const b = Math.floor(lt / k.beat);
      const ph = (lt % k.beat) / k.beat;
      const out = b % 2 === 0 ? 1 : -1;
      const jump = b % 4 === 3 ? Math.sin(ph * Math.PI) * 60 : 0;
      S(k).lineReq = { dx: out * 40 * ease('out', Math.min(1, ph * 3)), dy: -jump, rot: out * 0.1 };
    },
  });
};
/** everyone on stage stares at Canelo in unison: a «!» over every head */
const stare: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 1);
  let g: Graphics | null = null;
  return clip(cue.m, d, {
    mount: () => {
      g = new Graphics();
      k.layers.wfx.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      g.clear();
      const pop = lt < 0.1 ? lt / 0.1 : 1;
      const heads: [number, number][] = [[AXIS, 300]];
      for (const l of S(k).line) heads.push([l.c.x, l.c.y - 250]);
      for (const [x, y] of heads) {
        g.roundRect(x - 10 * pop, y - 70 * pop, 20 * pop, 50 * pop, 8).fill(RED).stroke({ width: 4, color: INK });
        g.circle(x, y, 10 * pop).fill(RED).stroke({ width: 4, color: INK });
      }
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};
/** a dancer knocked out of step: a spring «boing» over it */
const knock: VerbFn = (k, a, cue) => {
  const n = num(a, 'n', 0);
  const great = a.r === 'great';
  let g: Graphics | null = null;
  return clip(cue.m, 0.7, {
    z: 1,
    mount: () => {
      g = new Graphics();
      k.layers.wfx.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const l = S(k).line[n];
      g.clear();
      if (!l) return;
      const x = l.c.x;
      const y = l.c.y - 220;
      const t = st12(lt);
      // a coil spring that stretches up and wobbles
      const h = (great ? 140 : 80) * Math.sin(Math.min(1, t / 0.4) * Math.PI * 0.5) * (1 + 0.2 * Math.sin(t * 40));
      g.moveTo(x, y);
      for (let i = 1; i <= 10; i++) g.lineTo(x + (i % 2 ? 22 : -22), y - (h * i) / 10);
      g.stroke({ width: 6, color: INK });
      g.poly(starPts(x, y - h - 20, 40, 18, 5, t * 3)).fill(GOLD).stroke({ width: 5, color: INK });
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};
/** Tachón conducts: an arc of motion lines over his marker on every piano stab */
const baton: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 2);
  let g: Graphics | null = null;
  return clip(cue.m, d, {
    mount: () => {
      g = new Graphics();
      k.layers.wfx.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      g.clear();
      const m = cue.m + lt;
      const e = k.env('melody', m, 0.12, 0.3);
      if (e < 0.05) return;
      both((sx) => {
        for (let i = 0; i < 3; i++) g!.arc(sx(AXIS - 40), 420, 120 + i * 22, Math.PI * 1.1, Math.PI * 1.45).stroke({ width: 5, color: INK, alpha: e });
      });
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};

// ------------------------------------------------------------------ the mash, the hold
/** the calliope: Canelo stands on the left organ and bangs it; true-color steam on every tap */
const organ: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 4);
  const id = String(a.prompt ?? '');
  let g: Graphics | null = null;
  return clip(cue.m, d, {
    mount: () => {
      g = new Graphics();
      S(k).over.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const ps = k.prompt(id);
      const taps = ps?.taps ?? 0;
      const m = cue.m + lt;
      const bounce = Math.abs(Math.sin(m * 14)) * (ps && !ps.done ? 1 : 0.2);
      const x = 470 - k.num('can.x', 760);
      S(k).wantPose('canelo', { name: 'attack', lt, dx: x, dy: -150 - bounce * 30, rot: Math.sin(m * 14) * 0.08 });
      g.clear();
      if (k.fullFrame) return;
      // the last few taps puff true-color steam out of the pipes (screen space over the film)
      const shown = Math.min(taps, 24);
      for (let i = Math.max(0, shown - 6); i < shown; i++) {
        const R = rng(i * 17 + 5);
        const age = (i - (shown - 6)) / 6;
        const [sx, sy] = k.cam.toScreen(400 + R() * 140, 300 - age * 120);
        const col = [0x9dff6a, 0xff6a3d, 0x4ad0ff, 0xffd23a][i % 4];
        g.circle(sx, sy, (24 + 30 * age) * k.cam.zoom).fill({ color: col, alpha: 0.35 * (1 - age * 0.5) });
      }
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};
/** the build's hold: everything is pulled toward the axis (symmetric vortex lines); holding = Canelo grips and
 * Luzterna's lantern charges up */
const windUp: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 6);
  const id = String(a.prompt ?? '');
  let g: Graphics | null = null;
  const R = rng(cue.id * 5 + 2);
  const lines = Array.from({ length: 22 }, () => ({ y: R() * H, len: 120 + R() * 260, sp: 0.6 + R() * 0.8, ph: R() }));
  return clip(cue.m, d, {
    mount: () => {
      g = new Graphics();
      k.layers.screen.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const ps = k.prompt(id);
      const holding = !!ps && ps.from !== undefined && ps.to === undefined;
      const held = holding ? Math.min(1, (cue.m + lt - (ps!.p.m + (ps!.delta ?? 0))) / (ps!.p.mEnd - ps!.p.m)) : 0;
      if (holding) S(k).wantPose('canelo', { name: 'hold', lt });
      S(k).charge = held;
      g.clear();
      if (k.fullFrame) return;
      const v = k.view;
      for (const l of lines) {
        const u = (l.ph + lt * l.sp) % 1;
        both((sx) => {
          const x0 = v.x + (AXIS - v.x) * u;
          const xa = sx(x0);
          const xb = sx(Math.min(AXIS - 4, x0 + l.len * (1 - u)));
          g!.moveTo(xa, l.y).lineTo(xb, l.y).stroke({ width: 3, color: INK, alpha: 0.35 * (1 - u) });
        });
      }
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};
/** the release into the big show: a burst of true-color splashes on the film from Canelo */
const release: VerbFn = (k, a, cue) => {
  const n = a.r === 'great' ? 7 : a.r === 'hit' ? 4 : 2;
  const out: Clip[] = [];
  const R = rng(cue.id * 11 + 1);
  const cols = [0xff6a3d, 0x4ad0ff, 0xffd23a, 0x9dff6a, 0xff8ad8];
  let base: [number, number] = [W / 2, H / 2];
  out.push(
    clip(cue.m, 0.02, {
      mount: () => {
        base = screenAt(k, 'caneloHead');
      },
      update: () => undefined,
    }),
  );
  for (let i = 0; i < n; i++) {
    const an = (i / n) * Math.PI * 2 + R() * 0.4;
    const dd = 260 + R() * 380;
    const r = 40 + R() * 40;
    const col = cols[i % cols.length];
    const seed = cue.id * 13 + i;
    let inner: Clip | null = null;
    out.push(
      clip(cue.m + i * 0.03, Math.max(0.1, k.score.mCut - cue.m - i * 0.03), {
        mount: () => {
          inner = stainClip(k, cue.m + i * 0.03, base[0] + Math.cos(an) * dd, base[1] + Math.sin(an) * dd * 0.6, r, col, seed);
          inner.mount?.(k);
        },
        update: (lt) => inner?.update(lt, k),
        unmount: () => {
          inner?.unmount?.(k);
          inner = null;
        },
      }),
    );
  }
  out.push(pose(k, cue, 'canelo', a.r === 'miss' ? 'trip' : 'twirl', 1));
  return out;
};

// ------------------------------------------------------------------ show FX
/** symmetric confetti: paper squares falling in mirrored pairs (screen space) */
const confetti2: VerbFn = (k, a, cue) => {
  const n = Math.max(6, Math.round(num(a, 'n', 40) * k.density * 0.5));
  const R = rng(cue.id * 7 + 4);
  const ps = Array.from({ length: n }, () => ({ x: R() * 900, vy: 260 + R() * 260, sw: R() * 6, c: [CREAM, RED, TEAL, GOLD][Math.floor(R() * 4)], s: 12 + R() * 12, delay: R() * 0.6 }));
  const d = 2.6;
  let g: Graphics | null = null;
  return clip(cue.m, d, {
    mount: () => {
      g = new Graphics();
      k.layers.screen.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      g.clear();
      const t = st12(lt);
      const v = k.view;
      for (const p of ps) {
        const tt = t - p.delay;
        if (tt < 0) continue;
        const y = v.y - 30 + p.vy * tt;
        const flip = Math.abs(Math.cos(tt * 8 + p.sw));
        both((sx) => {
          const x = sx(AXIS - 40 - p.x) + Math.sin(tt * 3 + p.sw) * 30 * (sx(0) === 0 ? 1 : -1);
          g!.rect(x - p.s / 2, y - (p.s * flip) / 2, p.s, p.s * flip + 1).fill(p.c).stroke({ width: 2, color: INK });
        });
      }
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};
/** twin fireworks (mirrored): line rays, a ring of dots, on the strongest kicks of the plan */
const fireworks: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 1.4);
  let g: Graphics | null = null;
  const R = rng(cue.id * 3 + 1);
  const y = 120 + R() * 160;
  const dx = 380 + R() * 260;
  return clip(cue.m, d, {
    mount: () => {
      g = new Graphics();
      k.layers.wfx.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      g.clear();
      const t = st12(lt);
      const u = ease('out', Math.min(1, t / 0.5));
      const fade = t > d * 0.6 ? 1 - (t - d * 0.6) / (d * 0.4) : 1;
      both((sx) => {
        const cx = sx(AXIS - dx);
        for (let i = 0; i < 12; i++) {
          const an = (i / 12) * Math.PI * 2;
          const r0 = 30 + 160 * u;
          const r1 = r0 + 60 * (1 - u * 0.5);
          g!.moveTo(cx + Math.cos(an) * r0, y + Math.sin(an) * r0 + t * 40).lineTo(cx + Math.cos(an) * r1, y + Math.sin(an) * r1 + t * 40).stroke({ width: 7, color: i % 2 ? RED : PAPER, alpha: fade, cap: 'round' });
          g!.circle(cx + Math.cos(an + 0.26) * (r1 + 24), y + Math.sin(an + 0.26) * (r1 + 24) + t * 60, 7).fill({ color: GOLD, alpha: fade });
        }
      });
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};
/** ¡ORDEN!: a giant glove + stamp slams the middle of the screen; everything snaps back into line */
const order: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 1.2);
  let g: Graphics | null = null;
  return clip(cue.m - 0.25, d + 0.25, {
    z: 5,
    mount: () => {
      g = new Graphics();
      k.layers.screen.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      g.clear();
      const t = lt - 0.25;
      const y = t < 0 ? -400 + (H * 0.62 + 400) * ease('in', (t + 0.25) / 0.25) : t < 0.3 ? H * 0.62 : H * 0.62 - (t - 0.3) * 1400;
      drawRotStamp(g, W / 2, y, 2.2, 0);
      if (t >= 0 && t < 0.25) g.poly(starPts(W / 2, H * 0.62, 700, 420, 14, 0)).stroke({ width: 12, color: INK, alpha: 1 - t / 0.25 });
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};

// ------------------------------------------------------------------ the weird final
/** a chord swells: a thin mirror line grows down the axis and a perfect ring opens around it (perfection, drawn) */
const swell: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 2.2);
  const i = num(a, 'i', 0);
  let g: Graphics | null = null;
  return clip(cue.m, d, {
    mount: () => {
      g = new Graphics();
      k.layers.screen.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      g.clear();
      // the swell peaks ~0.5 s after the attack (measured): the world breathes in, perfectly
      const sw = lt < 0.5 ? ease('inOut', lt / 0.5) : Math.max(0, 1 - (lt - 0.5) / 1.4);
      k.cam.punch(0.02 * sw);
      const v = k.view;
      const len = (v.h * (i + 1)) / 3;
      g.moveTo(W / 2, v.y).lineTo(W / 2, v.y + len * ease('out', Math.min(1, lt / 0.7))).stroke({ width: 3, color: GOLD, alpha: 0.8 });
      const r = 120 + 900 * ease('out', Math.min(1, lt / 1.6));
      g.circle(W / 2, H * 0.48, r).stroke({ width: 4, color: PAPER, alpha: 0.6 * (1 - lt / d) });
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};
/** the crooked chord: the film tears along the axis and burns open — the true colors come through */
const tearOpen: VerbFn = (k, a, cue) => {
  const r = String(a.r ?? 'hit');
  const speed = r === 'great' ? 1 : r === 'hit' ? 0.8 : 0.6;
  const d = Math.max(0.1, k.score.mCut - cue.m + 0.1);
  return clip(cue.m, d, {
    update: (lt) => {
      const st = S(k);
      const tear = Math.min(1, lt / 0.28);
      const burn = Math.min(0.62, 0.62 * ease('out', Math.min(1, (lt * speed) / 2.2)));
      st.film1({ tear, burn });
      st.wantPose('canelo', { name: r === 'great' ? 'attack' : 'surprise', lt });
    },
  });
};
/** the cold open: the frozen battle, stamped CORREGIDO on the first kick (the film already turned it black-and-white) */
const coldOpen: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 3.3);
  const tex = k.text.get('CORREGIDO', POSTER(150, RED, PAPER));
  let c: Container | null = null;
  return clip(cue.m, d, {
    z: 20,
    mount: () => {
      c = new Container();
      c.zIndex = 20;
      const v = k.view;
      if (k.snapshot) {
        const s = new Sprite(k.snapshot);
        s.position.set(v.x, v.y);
        s.width = v.w;
        s.height = v.h;
        c.addChild(s);
      } else {
        // standalone (DEV): a plain stage-grey frame
        c.addChild(new Graphics().rect(v.x, v.y, v.w, v.h).fill(0x6a625a));
      }
      const seal = new Container();
      const w = tex.width + 90;
      const h = tex.height + 56;
      seal.addChild(new Graphics().roundRect(-w / 2, -h / 2, w, h, 16).stroke({ width: 16, color: RED }).roundRect(-w / 2 + 20, -h / 2 + 20, w - 40, h - 40, 10).stroke({ width: 6, color: RED }));
      const s = new Sprite(tex);
      s.anchor.set(0.5);
      seal.addChild(s);
      seal.position.set(W / 2, H / 2);
      seal.label = 'seal';
      c.addChild(seal);
      k.layers.panels.addChild(c);
    },
    update: (lt) => {
      if (!c) return;
      k.fullFrame = true;
      const seal = c.getChildByLabel('seal');
      if (seal) seal.scale.set(lt < 0.08 ? 2.4 - lt * 17 : 1);
      // the frame hops on the kicks even frozen (the beat owns everything now)
      const kick = k.env('kick', cue.m + lt, 0.09);
      c.scale.set(1 + 0.02 * kick);
      c.pivot.set((W / 2) * 0.02 * kick, (H / 2) * 0.02 * kick);
    },
    unmount: () => {
      c?.destroy({ children: true });
      c = null;
    },
  });
};
/** the cosmetic rhythm grade: a circus ticket stamped in the corner */
const grade: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 2);
  const texs = ['S', 'A', 'B', 'C'].map((g) => k.text.get(g, POSTER(150, RED, PAPER)));
  const lab = k.text.get('RITMO', SMALL(36, INK, PAPER));
  let c: Container | null = null;
  return clip(cue.m, d, {
    z: 9,
    mount: () => {
      let sum = 0;
      let n = 0;
      for (const p of k.score.prompts) {
        if (p.optional || p.type === 'choice') continue;
        const j = k.judged(p.id);
        sum += j?.r === 'great' ? 1 : j?.r === 'hit' ? 0.6 : 0;
        n++;
      }
      const pct = n ? sum / n : 1;
      const gi = pct >= 0.92 ? 0 : pct >= 0.75 ? 1 : pct >= 0.5 ? 2 : 3;
      c = new Container();
      const t = new Graphics();
      // a ticket: notched corners, a perforation
      t.poly([-170, -120, 170, -120, 170, -90, 150, -70, 150, 70, 170, 90, 170, 120, -170, 120, -170, 90, -150, 70, -150, -70, -170, -90]).fill(CREAM).stroke({ width: 7, color: INK });
      for (let y = -100; y <= 100; y += 20) t.circle(-90, y, 4).fill(INK);
      const big = new Sprite(texs[gi]);
      big.anchor.set(0.5);
      big.position.set(40, 0);
      const l = new Sprite(lab);
      l.anchor.set(0.5);
      l.rotation = -Math.PI / 2;
      l.position.set(-125, 0);
      c.addChild(t, big, l);
      c.rotation = -0.06;
      k.layers.ui.addChild(c);
    },
    update: (lt) => {
      if (!c) return;
      const v = k.view;
      c.position.set(v.x + v.w - 250, v.y + v.h - 200);
      const st = Math.floor(lt * 12);
      c.scale.set(st === 0 ? 1.5 : st === 1 ? 0.92 : 1);
      c.alpha = lt > d - 0.2 ? Math.max(0, (d - lt) / 0.2) : 1;
    },
    unmount: () => {
      c?.destroy({ children: true });
      c = null;
    },
  });
};

export const CIRCUS_VERBS: Record<string, VerbFn> = {
  cartel,
  stain,
  pose: poseVerb,
  fall,
  dust,
  run,
  signs,
  correct,
  sello,
  bigStamp,
  megaStamp,
  batAway,
  crookedSeal,
  lineStep,
  stare,
  knock,
  baton,
  organ,
  windUp,
  release,
  confetti2,
  fireworks,
  order,
  swell,
  tearOpen,
  coldOpen,
  grade,
};
