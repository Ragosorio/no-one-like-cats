/**
 * WHEN I LOSE — scene verbs (score.ts calls them by name). Every clip is a pure function of its local time (scrub,
 * pause, replay are frame-exact). Ink and gold are drawn as MATTER (blots, droplets, leaf) in the world, so the ink
 * filter keeps them true in both arts; the words live on the type layer (never inked): brush, serif, Fraktur.
 */
import { Container, Graphics, Sprite, type TextStyleOptions } from 'pixi.js';
import type { Args, Cue } from '../../types';
import { clip, W, H, type Clip, type Kit, type VerbFn } from '../../anime/kit';
import { rng, vnoise } from '../../anime/draw';
import { lerpColor } from '../../anime/palette';
import { ease } from '../../score';
import type { WilStage, Who } from './stage';
import { C, WATER } from './set';
import { LOOK } from './ink';

const S = (k: Kit) => k.stage as unknown as WilStage;
const num = (a: Args, key: string, d: number) => (typeof a[key] === 'number' ? (a[key] as number) : d);
const str = (a: Args, key: string, d: string) => (typeof a[key] === 'string' ? (a[key] as string) : d);
const durOf = (k: Kit, a: Args, d: number) => (typeof a.beats === 'number' ? (a.beats as number) * k.beat : num(a, 'dur', d));
const INK = LOOK.ink;

/** a named world point (live) */
export function wpos(k: Kit, at: unknown): [number, number] {
  const s = S(k);
  if (Array.isArray(at) && at.length === 2) return [at[0] as number, at[1] as number];
  switch (at) {
    case 'A':
      return s.world('A', 60, -160);
    case 'B':
      return s.world('B', -60, -240);
    case 'Bhull':
      return s.world('B', -120, -120);
    case 'Ahull':
      return s.world('A', 120, -100);
    case 'book':
      return s.bookAt();
    case 'lantern':
      return s.lanternAt();
    case 'mid':
      return [(s.A.x + s.B.x) / 2, WATER - 40];
    case 'water':
      return [W / 2, WATER + 20];
    default:
      if (typeof at === 'string' && at in s.actors) return s.head(at as Who);
      return [W / 2, H / 2];
  }
}

// ------------------------------------------------------------------ type (never inked)
export const BRUSH = (size: number, fill: number, stroke?: number): TextStyleOptions => ({ fontFamily: 'Permanent Marker', fontSize: size, fill, letterSpacing: size * 0.04, ...(stroke !== undefined ? { stroke: { color: stroke, width: Math.max(4, size * 0.08), join: 'round' as const } } : {}) });
export const SERIF = (size: number, fill: number, stroke: number): TextStyleOptions => ({ fontFamily: 'Playfair Display', fontStyle: 'italic', fontWeight: '700', fontSize: size, fill, stroke: { color: stroke, width: Math.max(3, size * 0.06), join: 'round' } });
export const FRAKTUR = (size: number, fill: number, stroke: number): TextStyleOptions => ({ fontFamily: 'UnifrakturMaguntia', fontSize: size, fill, stroke: { color: stroke, width: Math.max(3, size * 0.05), join: 'round' } });

function wordStyle(a: Args): TextStyleOptions {
  const size = num(a, 'size', 110);
  const font = str(a, 'font', 'brush');
  const gold = !!a.gold;
  if (font === 'serif') return SERIF(size, typeof a.color === 'number' ? a.color : gold ? 0xf2cf6a : LOOK.paper, typeof a.stroke === 'number' ? a.stroke : gold ? 0x3a2410 : INK);
  if (font === 'fraktur') return FRAKTUR(size, gold ? 0xf2cf6a : INK, gold ? 0x3a2410 : LOOK.paper);
  // gold brush words carry an umber outline: they land on cream sails and gilt shelves and must read on anything
  return gold ? BRUSH(size, 0xf2cf6a, 0x3a2410) : BRUSH(size, typeof a.color === 'number' ? a.color : INK);
}
/** the words a score will ask for (the runner calls prewarm) */
export function warmWords(k: Kit, verb: string, a: Args) {
  if ((verb === 'word' || verb === 'shhh') && (a.text || verb === 'shhh')) k.text.get(String(a.text ?? 'SHHH'), wordStyle(verb === 'shhh' ? { size: num(a, 'size', 230), font: 'brush' } : a));
  if (verb === 'seal') k.text.get(String(a.text ?? '静'), SERIF(num(a, 'size', 70) * 0.42, 0xfff3e0, 0x7a140a));
  if (verb === 'shhh' && a.seal !== false) k.text.get('静', SERIF(96 * 0.42, 0xfff3e0, 0x7a140a));
}

/**
 * A WORD on the type layer: brushed in left to right (a mask sweeps), held, then it dries and fades. Brush (Permanent
 * Marker, ink or gold), serif italic (Playfair) or Fraktur (the manuscript). A wet ink bleed sits under brush words.
 */
const word: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 1.4);
  const text = String(a.text ?? '');
  const style = wordStyle(a);
  k.text.get(text, style);
  let c: Container | null = null;
  let sp: Sprite | null = null;
  let mask: Graphics | null = null;
  let bleed: Graphics | null = null;
  const rot = num(a, 'rot', -0.04);
  const R = rng(cue.id);
  return clip(cue.m, d, {
    z: 6,
    mount: () => {
      c = new Container();
      bleed = new Graphics();
      sp = k.text.sprite(text, style);
      mask = new Graphics();
      c.addChild(bleed, sp, mask);
      sp.mask = mask;
      c.rotation = rot;
      k.layers.type.addChild(c);
    },
    update: (lt) => {
      if (!c || !sp || !mask || !bleed) return;
      const p = a.world ? k.cam.toScreen(...wpos(k, a.at)) : Array.isArray(a.at) ? (a.at as [number, number]) : typeof a.at === 'string' ? (k.stage.anchor?.(a.at, k) ?? [W / 2, H / 2]) : [num(a, 'x', W / 2), num(a, 'y', H / 2)];
      c.position.set(p[0] + num(a, 'dx', 0), p[1] + num(a, 'dy', 0));
      const inT = Math.min(0.35, d * 0.3);
      const x = ease('out', Math.min(1, lt / inT));
      const w = sp.width;
      const h = sp.height;
      mask.clear().rect(-w / 2 - 20, -h / 2 - 30, (w + 40) * x, h + 60).fill(0xffffff);
      bleed.clear();
      if (str(a, 'font', 'brush') === 'brush') {
        // the wet bleed under the word: a soft wash that spreads a little (under gold, a deeper umber one — contrast)
        const gold = !!a.gold;
        for (let i = 0; i < 7; i++) bleed.ellipse(-w / 2 + (i + 0.5) * (w / 7), (R() - 0.5) * 10, (w / 7) * (0.8 + 0.3 * x), h * (gold ? 0.46 : 0.36)).fill({ color: gold ? 0x2a170c : INK, alpha: (gold ? 0.42 : 0.09) * x });
      }
      const out = d - 0.3;
      c.alpha = lt > out ? Math.max(0, 1 - (lt - out) / 0.3) : 1;
      c.scale.set(num(a, 'scale', 1) * (1 + 0.02 * Math.sin(lt * 3)));
    },
    unmount: () => {
      c?.destroy({ children: true });
      c = sp = mask = bleed = null;
    },
  });
};

/** «SHHH»: the Bibliotecario's word, brushed huge, with a vermilion seal stamped after it */
const shhh: VerbFn = (k, a, cue) => {
  const out: Clip[] = [word(k, { text: 'SHHH', size: num(a, 'size', 230), font: 'brush', at: a.at ?? [W / 2, H * 0.42], dur: durOf(k, a, 1.6), rot: -0.06, world: a.world }, cue) as Clip];
  if (a.seal !== false) out.push(seal(k, { at: a.sealAt ?? [W / 2 + 260, H * 0.42 + 90], size: 96, text: '静', dur: durOf(k, a, 1.6) - 0.25 }, { ...cue, m: cue.m + 0.25 }) as Clip);
  return out;
};

/** a vermilion SEAL (hanko): stamped (squash, a dust ring), it stays, then lifts */
const seal: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 1.2);
  const size = num(a, 'size', 70);
  const text = String(a.text ?? '静');
  let c: Container | null = null;
  return clip(cue.m, d, {
    z: 7,
    mount: () => {
      c = new Container();
      const g = new Graphics();
      const R = rng(cue.id + 3);
      const s = size;
      g.roundRect(-s / 2, -s / 2, s, s, s * 0.08).fill(C.vermilion);
      // worn stamp: paper showing through
      for (let i = 0; i < 9; i++) g.circle((R() - 0.5) * s * 0.9, (R() - 0.5) * s * 0.9, 1.5 + R() * 4).fill(0xf6e9d2);
      g.rect(-s / 2 + 5, -s / 2 + 5, s - 10, s - 10).stroke({ width: 3, color: 0xf6e9d2 });
      const t = k.text.sprite(text, SERIF(size * 0.42, 0xfff3e0, 0x7a140a));
      c.addChild(g, t);
      c.rotation = (R() - 0.5) * 0.2;
      k.layers.type.addChild(c);
    },
    update: (lt) => {
      if (!c) return;
      const p = Array.isArray(a.at) ? (a.at as [number, number]) : typeof a.at === 'string' ? (k.stage.anchor?.(a.at, k) ?? [W / 2, H / 2]) : [W / 2, H / 2];
      c.position.set(p[0], p[1]);
      const x = Math.min(1, lt / 0.09);
      c.scale.set(lt < 0.09 ? 1.6 - 0.7 * x : 0.9 + 0.1 * Math.min(1, (lt - 0.09) / 0.12));
      c.alpha = lt > d - 0.25 ? Math.max(0, (d - lt) / 0.25) : 1;
    },
    unmount: () => {
      c?.destroy({ children: true });
      c = null;
    },
  });
};

/**
 * INK BURST (world): a blot that blooms with irregular lobes, droplets flung out on arcs, a spray of dots. Gold when
 * `gold` (the filter turns it to leaf). The heaviest hits get r ≥ 400.
 */
export function inkBurstClip(k: Kit, m: number, seed: number, at: () => [number, number], o: { r?: number; n?: number; dur?: number; gold?: boolean; layer?: Container } = {}): Clip {
  const r = o.r ?? 140;
  const d = o.dur ?? 1.2;
  const R = rng(seed);
  const lobes = Array.from({ length: 11 }, () => 0.6 + R() * 0.7);
  const n = Math.max(6, Math.round((o.n ?? 26) * k.density));
  const drops = Array.from({ length: n }, () => {
    const ang = -Math.PI / 2 + (R() - 0.5) * Math.PI * 1.7;
    const sp = (0.8 + R() * 1.6) * r * 3.2;
    return { vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, s: 4 + R() * 14 * (r / 140) };
  });
  const col = o.gold ? C.goldLight : INK;
  const col2 = o.gold ? C.gold : 0x2a2632;
  let g: Graphics | null = null;
  let p: [number, number] = [0, 0];
  return clip(m, d, {
    z: 2,
    mount: () => {
      g = new Graphics();
      (o.layer ?? k.layers.wfx).addChild(g);
      p = at();
    },
    update: (lt) => {
      if (!g) return;
      const t = Math.floor(lt * 24) / 24;
      const x = t / d;
      g.clear();
      // the splash: a jagged blot (many small lobes), radial streaks flung out, a pale wash halo that spreads
      const grow = ease('expoOut', Math.min(1, t / 0.2));
      const fade = x > 0.55 ? 1 - (x - 0.55) / 0.45 : 1;
      const halo: number[] = [];
      const pts: number[] = [];
      for (let i = 0; i < 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        const lobe = lobes[Math.floor((i / 64) * lobes.length)] * (0.7 + 0.6 * vnoise(i * 1.9, seed)) * (i % 3 === 0 ? 1.18 : 1);
        const rr = r * 0.62 * grow * lobe;
        pts.push(p[0] + Math.cos(a) * rr, p[1] + Math.sin(a) * rr * 0.8);
        const hr = r * (0.8 + 0.5 * x) * grow * (0.85 + 0.3 * vnoise(i * 0.6, seed + 5));
        halo.push(p[0] + Math.cos(a) * hr, p[1] + Math.sin(a) * hr * 0.8);
      }
      g.poly(halo).fill({ color: col2, alpha: 0.22 * fade });
      g.poly(pts).fill({ color: col, alpha: fade });
      for (let i = 0; i < 9; i++) {
        const a = lobes[i] * 7 + i * 0.7;
        const L = r * (0.7 + lobes[i] * 0.6) * grow;
        const w = r * 0.07 * (1 - x * 0.6);
        const c = Math.cos(a);
        const s2 = Math.sin(a);
        g.poly([p[0] - s2 * w, p[1] + c * w * 0.8, p[0] + c * L, p[1] + s2 * L * 0.8, p[0] + s2 * w, p[1] - c * w * 0.8]).fill({ color: col, alpha: fade });
        g.circle(p[0] + c * L * 1.06, p[1] + s2 * L * 0.85, w * 1.3).fill({ color: col, alpha: fade });
      }
      // droplets on arcs (gravity), they splat into small blots
      for (const dp of drops) {
        const dx = p[0] + dp.vx * t * 0.5;
        const dy = p[1] + dp.vy * t * 0.5 + 900 * t * t;
        const s = dp.s * (1 - x * 0.5);
        g.ellipse(dx, dy, s, s * (1 + Math.min(1.5, Math.abs(dp.vy) * t * 0.002))).fill({ color: col, alpha: fade });
      }
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
}
const inkBurst: VerbFn = (k, a, cue) => {
  const at = () => {
    const p = wpos(k, a.at);
    return [p[0] + num(a, 'dx', 0), p[1] + num(a, 'dy', 0)] as [number, number];
  };
  return inkBurstClip(k, cue.m, cue.id * 7 + 1, at, { r: num(a, 'r', 140), n: num(a, 'n', 26), dur: durOf(k, a, 1.2), gold: !!a.gold });
};

/** PAGES BLAST out of a point: spinning, flipping, slowed by the air, then they fall (closed form) */
export function pageBlastClip(k: Kit, m: number, seed: number, at: () => [number, number], o: { n?: number; power?: number; dur?: number; size?: number } = {}): Clip {
  const R = rng(seed);
  const n = Math.max(4, Math.round((o.n ?? 18) * k.density));
  const pw = o.power ?? 1;
  const d = o.dur ?? 2.2;
  const ps = Array.from({ length: n }, () => {
    const ang = R() * Math.PI * 2;
    const sp = (500 + R() * 1100) * pw;
    return { vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp * 0.75 - 200 * pw, spin: (R() - 0.5) * 9, flip: 4 + R() * 10, s: (o.size ?? 30) * (0.7 + R() * 0.8), ph: R() * 6 };
  });
  let g: Graphics | null = null;
  let p: [number, number] = [0, 0];
  return clip(m, d, {
    z: 3,
    mount: () => {
      g = new Graphics();
      k.layers.wfx.addChild(g);
      p = at();
    },
    update: (lt) => {
      if (!g) return;
      const t = Math.floor(lt * 24) / 24;
      g.clear();
      const drag = (1 - Math.exp(-t * 2.4)) / 2.4;
      const fade = t > d - 0.4 ? (d - t) / 0.4 : 1;
      for (const q of ps) {
        const x = p[0] + q.vx * drag + Math.sin(t * 3 + q.ph) * 30 * t;
        const y = p[1] + q.vy * drag + 140 * t * t;
        S(k).page(g, x, y, q.s, q.spin * drag + q.ph, Math.cos(q.flip * t + q.ph), fade);
      }
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
}
const pageBlast: VerbFn = (k, a, cue) => pageBlastClip(k, cue.m, cue.id * 11 + 2, () => wpos(k, a.at), { n: num(a, 'n', 18), power: num(a, 'power', 1), dur: durOf(k, a, 2.2), size: num(a, 'size', 30) });

/** a pose for a while */
const pose: VerbFn = (k, a, cue) => {
  const who = str(a, 'who', 'canelo') as Who;
  const name = str(a, 'name', 'proud');
  return clip(cue.m, durOf(k, a, 1), { update: (lt) => S(k).wantPose(who, { name, lt }) });
};
/** a ship jolt (recoil, a hit) */
const jolt: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 0.5);
  const ship = str(a, 'ship', 'A') as 'A' | 'B';
  const dx = num(a, 'dx', 0);
  const dy = num(a, 'dy', 14);
  const rot = num(a, 'rot', 0.03);
  return clip(cue.m, d, {
    update: (lt) => {
      const x = lt / d;
      const w = Math.sin(x * Math.PI * 2.5) * (1 - x);
      S(k).wantJolt(ship, { dx: dx * w, dy: dy * Math.abs(w), rot: rot * w });
    },
  });
};

/**
 * A CALLIGRAPHY SHOT: a tapered brush stroke flies on an arc from a ship to the other (ink from him, gold from us once
 * the voices are back); a trail of drying ink behind it; on arrival a burst + a jolt. `result` shapes our shots:
 * great = a huge clean stroke · hit = a smaller one · miss = it splutters and falls short.
 */
const stroke: VerbFn = (k, a, cue) => {
  const from = str(a, 'from', 'A') as 'A' | 'B';
  const gold = !!a.gold;
  const res = str(a, 'result', cue.result ?? 'great');
  const fl = durOf(k, a, 0.42);
  const short = res === 'miss';
  const big = res === 'great' ? 1.25 : res === 'hit' ? 0.85 : 0.6;
  const p0 = () => (from === 'A' ? S(k).world('A', 300, -150) : S(k).world('B', -400, -130));
  const p1 = () => {
    const t = from === 'A' ? wpos(k, 'Bhull') : wpos(k, 'Ahull');
    return short ? ([(p0()[0] + t[0]) / 2, WATER + 10] as [number, number]) : t;
  };
  let g: Graphics | null = null;
  let A0: [number, number] = [0, 0];
  let A1: [number, number] = [0, 0];
  const col = gold ? C.goldLight : INK;
  const out: Clip[] = [
    clip(cue.m, fl + 0.5, {
      z: 4,
      mount: () => {
        g = new Graphics();
        k.layers.wfx.addChild(g);
        A0 = p0();
        A1 = p1();
      },
      update: (lt) => {
        if (!g) return;
        g.clear();
        const P = (u: number): [number, number] => [A0[0] + (A1[0] - A0[0]) * u, A0[1] + (A1[1] - A0[1]) * u - Math.sin(u * Math.PI) * (short ? 120 : 260)];
        const head = Math.min(1, lt / fl);
        const tail = Math.max(0, Math.min(1, (lt - 0.12) / fl));
        // the tapered ribbon from tail to head (thick at the head)
        const N = 18;
        const top: number[] = [];
        const bot: number[] = [];
        for (let i = 0; i <= N; i++) {
          const u = tail + ((head - tail) * i) / N;
          const [x, y] = P(u);
          const [x2, y2] = P(Math.min(1, u + 0.01));
          const ang = Math.atan2(y2 - y, x2 - x) + Math.PI / 2;
          const w = (2 + 22 * big * (i / N) ** 1.4) * (1 - Math.max(0, lt - fl) / 0.5);
          top.push(x + Math.cos(ang) * w, y + Math.sin(ang) * w);
          bot.unshift(x - Math.cos(ang) * w, y - Math.sin(ang) * w);
        }
        if (head > tail) g.poly([...top, ...bot]).fill({ color: col, alpha: 1 - Math.max(0, lt - fl) / 0.5 });
        // dry-brush hairs at the head
        if (lt < fl) {
          const [hx, hy] = P(head);
          for (let i = 0; i < 4; i++) g.circle(hx - (A1[0] - A0[0]) * 0.02 * i, hy + (i - 1.5) * 9 * big, 6 * big).fill(col);
        }
      },
      unmount: () => {
        g?.destroy();
        g = null;
      },
    }),
    inkBurstClip(k, cue.m + fl, cue.id * 5 + 9, p1, { r: short ? 70 : 120 * big, n: short ? 10 : 22, gold }),
    jolt(k, { ship: from, dx: from === 'A' ? -16 : 16, dy: 6, rot: from === 'A' ? -0.02 : 0.02, dur: 0.4 }, cue) as Clip,
  ];
  if (!short) out.push(jolt(k, { ship: from === 'A' ? 'B' : 'A', dx: from === 'A' ? 22 * big : -22, dy: 16, rot: from === 'A' ? 0.04 : -0.04, dur: 0.6 }, { ...cue, m: cue.m + fl }) as Clip);
  if (!short && res !== 'hit') out.push(pageBlastClip(k, cue.m + fl, cue.id * 3 + 4, p1, { n: 10, power: 0.6 * big, dur: 1.6, size: 22 }));
  return out;
};

/**
 * HIS WAVE OF INK: a black wall rolls over the water from his ship to ours. great = a white slash splits it in two
 * (paper shows through) · hit = it breaks on the bow · miss = it washes over the deck (Canelo inked, he shakes it off).
 */
const inkWave: VerbFn = (k, a, cue) => {
  const res = str(a, 'result', cue.result ?? 'great');
  const travel = durOf(k, a, 1.4);
  let g: Graphics | null = null;
  const out: Clip[] = [
    clip(cue.m - travel, travel + 0.8, {
      z: 1,
      mount: () => {
        g = new Graphics();
        k.layers.wfx.addChild(g);
      },
      update: (lt) => {
        if (!g) return;
        g.clear();
        const s = S(k);
        const xB = s.B.x - 300;
        const xA = s.A.x + 280;
        const u = Math.min(1, lt / travel);
        const front = xB + (xA - xB) * ease('in', u);
        const after = Math.max(0, lt - travel);
        const h = 120 + 270 * u - (res === 'great' ? 400 * after : res === 'hit' ? 260 * after : 120 * after);
        if (h <= 0) return;
        const st = Math.floor(lt * 12) / 12;
        // a breaking wave in brush (Hokusai's claw, in ink): the back slope rises from his ship, the lip curls toward
        // us, paper streaks follow the slope, foam fingers and spray ahead of the lip
        const back = xB + 200;
        const crest = (i: number) => Math.sin(i * 0.9 + st * 8) * 10;
        const pts: number[] = [back, WATER + 20, back, WATER - 0.35 * h + crest(0)];
        for (let i = 1; i <= 8; i++) {
          const f = i / 8;
          pts.push(back + (front + 0.4 * h - back) * f, WATER - h * (0.35 + 0.65 * Math.pow(f, 1.5)) + crest(i));
        }
        const lip = (fx: number, fy: number) => pts.push(front + fx * h, WATER - fy * h);
        lip(0.15, 1.05);
        lip(-0.1, 0.98);
        lip(-0.25, 0.82);
        lip(-0.22, 0.66);
        lip(-0.1, 0.62);
        lip(0.05, 0.7);
        lip(0.12, 0.55);
        lip(0.08, 0.3);
        lip(-0.05, 0.05);
        pts.push(front - 0.12 * h, WATER + 20);
        g.poly(pts).fill(INK);
        // paper streaks along the slope (the brush lifted)
        for (let j = 1; j <= 4; j++) {
          const sp: number[] = [];
          for (let i = 2; i <= 8; i++) {
            const f = i / 8;
            sp.push(back + (front + 0.4 * h - back) * f, WATER - h * (0.35 + 0.65 * Math.pow(f, 1.5)) + j * 0.17 * h + crest(i) * 0.6);
          }
          for (let i = 0; i < sp.length - 2; i += 2) g.moveTo(sp[i], sp[i + 1]).lineTo(sp[i + 2], sp[i + 3]);
          g.stroke({ width: 7 - j, color: LOOK.paper, alpha: 0.9 });
        }
        // foam fingers on the lip and spray ahead of it
        for (let i = 0; i < 6; i++) {
          const fx = front + (-0.24 + i * 0.07) * h;
          const fy = WATER - (0.84 + 0.04 * Math.sin(i * 2.1 + st * 6)) * h;
          g.circle(fx, fy, 6 + (i % 3) * 3).fill(LOOK.paper);
        }
        for (let i = 0; i < 10; i++) g.circle(front - 0.3 * h - i * 16, WATER - 0.9 * h + ((i * 37) % 50) + u * 40, 5 + (i % 3) * 4).fill(INK);
        // the great: a clean white slash across the wall
        if (res === 'great' && after > 0) {
          const L = 600 * Math.min(1, after / 0.12);
          g.moveTo(xA - 40, WATER - 260).lineTo(xA - 40 + L, WATER - 260 + L * 0.35).stroke({ width: 26 * (1 - after / 0.8), color: LOOK.paper });
        }
      },
      unmount: () => {
        g?.destroy();
        g = null;
      },
    }),
  ];
  if (res === 'miss') {
    out.push(inkBurstClip(k, cue.m, cue.id * 9, () => wpos(k, 'A'), { r: 200, n: 34 }));
    out.push(clip(cue.m, 1.6, { update: (lt) => S(k).wantPose('canelo', { name: 'splat', lt }) }));
    out.push(jolt(k, { ship: 'A', dx: -30, dy: 20, rot: -0.05, dur: 0.8 }, cue) as Clip);
  } else {
    out.push(clip(cue.m, 0.9, { update: (lt) => S(k).wantPose('canelo', { name: res === 'great' ? 'slash' : 'brace', lt }) }));
    out.push(inkBurstClip(k, cue.m, cue.id * 9, () => wpos(k, 'Ahull'), { r: res === 'great' ? 90 : 150, n: 20 }));
  }
  return out;
};

/** a page flung at us (break): great = Canelo slashes it in two · hit = he dodges it · miss = it wraps his face */
const pageShot: VerbFn = (k, a, cue) => {
  const res = str(a, 'result', cue.result ?? 'great');
  const travel = durOf(k, a, 0.55);
  let g: Graphics | null = null;
  const idx = num(a, 'i', 0);
  const out: Clip[] = [
    clip(cue.m - travel, travel + 1.2, {
      z: 4,
      mount: () => {
        g = new Graphics();
        k.layers.wfx.addChild(g);
      },
      update: (lt) => {
        if (!g) return;
        g.clear();
        const s = S(k);
        const [bx, by] = s.world('B', -260, -480 + (idx % 3) * 60);
        const [cx, cy] = s.head('canelo');
        const u = Math.min(1, lt / travel);
        const x = bx + (cx - bx) * u;
        const y = by + (cy - by) * u - Math.sin(u * Math.PI) * 120;
        const after = lt - travel;
        if (after < 0) {
          s.page(g, x, y, 48, lt * 9, Math.cos(lt * 16), 1);
          // the speed of it: three dry-brush streaks behind
          for (let i = 1; i <= 3; i++) g.moveTo(x + i * 40, y - i * 6).lineTo(x + i * 40 + 70, y - i * 6 - 10).stroke({ width: 4, color: INK, alpha: 0.5 / i });
          return;
        }
        if (res === 'great') {
          // two halves fly apart, a white cut line
          const t = after;
          s.page(g, cx - 40 * t * 6, cy - 30 * t * 4 + 300 * t * t, 34, -1.2 - t * 6, 1, Math.max(0, 1 - t));
          s.page(g, cx + 30 * t * 6, cy + 20 * t * 4 + 300 * t * t, 34, 1.4 + t * 7, -1, Math.max(0, 1 - t));
          if (t < 0.18) g.moveTo(cx - 120, cy + 70).lineTo(cx + 120, cy - 70).stroke({ width: 10 * (1 - t / 0.18), color: LOOK.paper });
        } else if (res === 'hit') {
          s.page(g, cx - 60 - after * 500, cy - 80 - after * 200 + 400 * after * after, 44, after * 10, Math.cos(after * 14), Math.max(0, 1 - after));
        } else {
          // it wraps his face for a moment, then he peels it off
          const stick = after < 0.7;
          const t = Math.max(0, after - 0.7);
          s.page(g, cx + (stick ? 0 : -t * 300), cy + (stick ? 0 : t * 120 + 500 * t * t), 56, stick ? 0.1 * Math.sin(after * 30) : t * 6, 1, stick ? 1 : Math.max(0, 1 - t * 2));
        }
      },
      unmount: () => {
        g?.destroy();
        g = null;
      },
    }),
    clip(cue.m, res === 'miss' ? 1.2 : 0.6, { update: (lt) => S(k).wantPose('canelo', { name: res === 'great' ? 'slash' : res === 'hit' ? 'shock' : 'tumble', lt }) }),
  ];
  return out;
};

/** gold leaf blooms on a spot (world): a ragged disc that spreads, sparks, a ring — the filter makes it metal */
const gild: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 1.4);
  const r = num(a, 'r', 120);
  const R = rng(cue.id * 17);
  const lobes = Array.from({ length: 9 }, () => 0.7 + R() * 0.5);
  let g: Graphics | null = null;
  let p: [number, number] = [0, 0];
  const big = str(a, 'result', cue.result ?? 'great');
  const sc = big === 'great' ? 1 : big === 'hit' ? 0.7 : 0.45;
  return clip(cue.m, d, {
    z: 3,
    mount: () => {
      g = new Graphics();
      k.layers.wfx.addChild(g);
      const q = wpos(k, a.at);
      p = [q[0] + num(a, 'dx', 0), q[1] + num(a, 'dy', 0)];
    },
    update: (lt) => {
      if (!g) return;
      g.clear();
      const x = ease('expoOut', Math.min(1, lt / 0.4));
      const fade = lt > d - 0.4 ? (d - lt) / 0.4 : 1;
      const pts: number[] = [];
      for (let i = 0; i < 36; i++) {
        const an = (i / 36) * Math.PI * 2;
        const rr = r * sc * x * lobes[Math.floor((i / 36) * lobes.length)];
        pts.push(p[0] + Math.cos(an) * rr, p[1] + Math.sin(an) * rr);
      }
      g.poly(pts).fill({ color: C.gold, alpha: 0.9 * fade });
      g.circle(p[0], p[1], r * sc * x * 0.5).fill({ color: C.goldLight, alpha: fade });
      g.circle(p[0], p[1], r * sc * (0.6 + lt * 1.4)).stroke({ width: 8, color: C.goldLight, alpha: Math.max(0, 1 - lt / 0.8) });
      if (big === 'great')
        for (let i = 0; i < 10; i++) {
          const an = (i / 10) * Math.PI * 2 + cue.id;
          const L = r * (0.8 + lt * 2.2);
          g.circle(p[0] + Math.cos(an) * L, p[1] + Math.sin(an) * L, 7 * (1 - lt / d)).fill(C.goldLight);
        }
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};

/**
 * ENSŌ: one circle of ink drawn in a single stroke (screen space, type layer) — the frame of a close-up, the
 * signature of a hit. Gold in the illuminated parts.
 */
const enso: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 1.2);
  const r = num(a, 'r', 300);
  const gold = !!a.gold;
  let g: Graphics | null = null;
  const R = rng(cue.id);
  const start = R() * Math.PI * 2;
  return clip(cue.m, d, {
    z: 2,
    mount: () => {
      g = new Graphics();
      k.layers.screen.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      g.clear();
      const p = Array.isArray(a.at) ? (a.at as [number, number]) : typeof a.at === 'string' ? (k.stage.anchor?.(a.at, k) ?? [W / 2, H / 2]) : [W / 2, H / 2];
      const draw = ease('out', Math.min(1, lt / Math.min(0.4, d * 0.4)));
      const fade = lt > d - 0.35 ? (d - lt) / 0.35 : 1;
      const N = 60;
      const span = Math.PI * 1.88 * draw;
      for (let i = 0; i < N; i++) {
        const u = i / N;
        const an = start + span * u;
        const w = 30 * Math.sin(Math.min(1, u * 1.3) * Math.PI) * (0.6 + 0.4 * vnoise(u * 9, cue.id)) + 4;
        const rr = r * (1 + 0.04 * vnoise(u * 5, cue.id + 3));
        g.circle(p[0] + Math.cos(an) * rr, p[1] + Math.sin(an) * rr, w / 2).fill({ color: gold ? C.goldLight : INK, alpha: 0.92 * fade });
      }
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};

/** dry-brush STREAKS across the screen (this style's speed lines), redrawn on twos */
const streaks: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 0.5);
  const ang = num(a, 'ang', 0);
  const n = Math.round(num(a, 'n', 22) * (k.reduceMotion ? 0.5 : 1));
  const gold = !!a.gold;
  let g: Graphics | null = null;
  return clip(cue.m, d, {
    z: 1,
    mount: () => {
      g = new Graphics();
      k.layers.screen.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const st = Math.floor(lt * 12);
      const R = rng(cue.id * 13 + st);
      g.clear();
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      const v = k.view;
      for (let i = 0; i < n; i++) {
        const y = v.y + R() * v.h;
        const x = v.x + R() * v.w;
        const L = 200 + R() * 500;
        const w = 3 + R() * 9;
        for (let j = 0; j < 3; j++) g.moveTo(x, y + j * w * 0.8).lineTo(x + c * L * (1 - j * 0.2), y + j * w * 0.8 + s * L);
        g.stroke({ width: w * 0.45, color: gold ? C.goldLight : INK, alpha: (0.5 + 0.4 * R()) * (1 - lt / d) });
      }
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};

/**
 * A HANGING SCROLL unrolls (panels layer → inked like the world): a portrait of a cat as a miniature inside a brush
 * ensō on parchment, between two rods. Rolls back up at the end.
 */
const scroll: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 3.4);
  const who = str(a, 'who', 'canelo') as Who;
  const side = str(a, 'side', 'left');
  let c: Container | null = null;
  let paper: Graphics | null = null;
  let mask: Graphics | null = null;
  let portrait: Container | null = null;
  const w = 380;
  const h = 760;
  return clip(cue.m, d, {
    mount: () => {
      c = new Container();
      c.zIndex = 4;
      paper = new Graphics();
      paper.rect(-w / 2, 0, w, h).fill(C.parchment).rect(-w / 2 + 18, 18, w - 36, h - 36).stroke({ width: 4, color: C.umber });
      paper.rect(-w / 2 + 30, 30, w - 60, 120).fill(C.lapis);
      // the ensō behind the portrait
      const e = new Graphics();
      for (let i = 0; i < 50; i++) {
        const an = 0.3 + (i / 50) * Math.PI * 1.85;
        e.circle(Math.cos(an) * 130, 380 + Math.sin(an) * 130, 6 + 10 * Math.sin((i / 50) * Math.PI)).fill(INK);
      }
      portrait = new Container();
      const st = S(k).studio.still(S(k).slugs[who] || 'canelo_admiral_cat', 0.5, 0.95);
      if (st) {
        const [, ph] = S(k).studio.size(S(k).slugs[who]);
        st.scale.set(420 / ph);
        st.position.set(0, 600);
        if (who === 'biblio' || who === 'giant') st.scale.x *= -1;
        portrait.addChild(st);
      }
      mask = new Graphics();
      const rods = new Graphics();
      rods.roundRect(-w / 2 - 30, -16, w + 60, 26, 13).fill(C.woodDark);
      rods.circle(-w / 2 - 30, -3, 18).fill(C.gold).circle(w / 2 + 30, -3, 18).fill(C.gold);
      const bottom = new Graphics();
      bottom.roundRect(-w / 2 - 30, -10, w + 60, 26, 13).fill(C.woodDark);
      bottom.circle(-w / 2 - 30, 3, 18).fill(C.gold).circle(w / 2 + 30, 3, 18).fill(C.gold);
      (c as Container & { bottom?: Graphics }).bottom = bottom;
      const body = new Container();
      body.addChild(paper, e, portrait);
      body.mask = mask;
      c.addChild(body, mask, rods, bottom);
      k.layers.panels.addChild(c);
    },
    update: (lt) => {
      if (!c || !mask) return;
      const x = side === 'left' ? 300 : W - 300;
      c.position.set(x, 80);
      const open = lt < 0.6 ? ease('out', lt / 0.6) : lt > d - 0.5 ? ease('inOut', (d - lt) / 0.5) : 1;
      mask.clear().rect(-w / 2, 0, w, h * open).fill(0xffffff);
      const b = (c as Container & { bottom?: Graphics }).bottom;
      if (b) b.y = h * open;
      c.rotation = Math.sin(lt * 1.8) * 0.012;
    },
    unmount: () => {
      c?.destroy({ children: true });
      c = paper = mask = portrait = null;
    },
  });
};

/**
 * THE COLD OPEN: the frozen battle frame sits on the page (panels: the ink front eats it like the world), and on the
 * next bar the page TURNS (a fold sweeps right → left, the back of the page shows) onto the drowned hall.
 */
const coldOpen: VerbFn = (k, a, cue) => {
  const turnAt = num(a, 'turn', k.bar);
  const turn = 0.75;
  let c: Container | null = null;
  let sp: Sprite | null = null;
  let mask: Graphics | null = null;
  let back: Graphics | null = null;
  return clip(cue.m, turnAt + turn, {
    mount: () => {
      c = new Container();
      c.zIndex = 20;
      const v = k.view;
      const base = new Graphics();
      if (k.snapshot) {
        sp = new Sprite(k.snapshot);
        sp.position.set(v.x, v.y);
        sp.width = v.w;
        sp.height = v.h;
      }
      mask = new Graphics();
      back = new Graphics();
      if (sp) {
        c.addChild(sp);
        sp.mask = mask;
        c.addChild(mask);
      }
      c.addChild(base, back);
      k.layers.panels.addChild(c);
    },
    update: (lt) => {
      if (!c || !mask || !back) return;
      const v = k.view;
      const u = lt < turnAt ? 0 : ease('inOut', Math.min(1, (lt - turnAt) / turn));
      const fold = v.x + v.w * (1 - u);
      mask.clear().rect(v.x, v.y, fold - v.x, v.h).fill(0xffffff);
      back.clear();
      if (u > 0 && u < 1) {
        // the back of the turning page (narrower: it curls), a shadow line on the fold
        const bw = (v.w - (fold - v.x)) * 0.5 * (1 - u * 0.5);
        back.poly([fold, v.y, fold - bw, v.y + 30, fold - bw, v.y + v.h - 30, fold, v.y + v.h]).fill(C.parchShade);
        back.rect(fold - 6, v.y, 12, v.h).fill({ color: INK, alpha: 0.35 });
      }
      // while the snapshot is the page, the world under it is hidden (nobody sees it)
      if (k.snapshot && u === 0) k.fullFrame = true;
    },
    unmount: () => {
      c?.destroy({ children: true });
      c = sp = mask = back = null;
    },
  });
};

/**
 * THE DROP (the valley): a single drop of gold-ink swells at the tip of a brush above the page while the player holds;
 * on the release (the climax hit) it falls — the burst is the climax' own verbs. Gold on an empty page.
 */
const drop: VerbFn = (k, a, cue) => {
  const until = num(a, 'until', 8);
  const id = str(a, 'prompt', 'valle');
  let g: Graphics | null = null;
  return clip(cue.m, until + 0.25, {
    z: 3,
    mount: () => {
      g = new Graphics();
      k.layers.screen.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      g.clear();
      const st = k.prompt(id);
      const held = st?.from !== undefined && st.from !== null ? Math.max(0, k.m - (st.from as number)) : 0;
      const grow = Math.min(1, lt / until) * 0.55 + Math.min(1, held / Math.max(0.5, until - 1)) * 0.45;
      const cx = W / 2;
      const top = 330;
      // the page waits: a pale ensō is traced around where the drop will land, slowly, over the whole valley
      const sweep = Math.min(1, lt / until) * Math.PI * 1.82;
      const n = 64;
      const outer: number[] = [];
      const inner: number[] = [];
      for (let i = 0; i <= n; i++) {
        const an = -Math.PI / 2 + 0.3 + (sweep * i) / n;
        const f = i / n;
        // a loaded brush: thick at the start, a dry, thinning tail
        const w = 70 * (0.3 + 0.7 * Math.sin(Math.min(1, f * 1.1 + 0.12) * Math.PI * 0.85)) * (1 - 0.55 * f) * (0.93 + 0.07 * Math.sin(i * 0.9));
        const rr = 300 + Math.sin(i * 0.37) * 5;
        outer.push(cx + Math.cos(an) * (rr + w / 2), 700 + Math.sin(an) * (rr + w / 2));
        inner.unshift(cx + Math.cos(an) * (rr - w / 2), 700 + Math.sin(an) * (rr - w / 2));
      }
      if (sweep > 0.05) g.poly([...outer, ...inner]).fill({ color: INK, alpha: 0.82 });
      // the brush, large and leaning: a bamboo handle with nodes, a ferrule, a soft tuft that tapers to a wet tip
      const sway = Math.sin(lt * 1.3) * 6;
      g.roundRect(cx - 20 + sway, top - 760, 40, 700, 18).fill(0xc9a46a);
      g.roundRect(cx - 20 + sway, top - 760, 12, 700, 6).fill({ color: 0xf0d9a8, alpha: 0.7 });
      for (let i = 0; i < 5; i++) g.rect(cx - 21 + sway, top - 700 + i * 130, 42, 9).fill(0x8a6a3a);
      g.roundRect(cx - 26 + sway, top - 84, 52, 50, 8).fill(C.woodDark);
      g.moveTo(cx - 32 + sway, top - 38).bezierCurveTo(cx - 44, top + 30, cx - 14, top + 100, cx, top + 140).bezierCurveTo(cx + 14, top + 100, cx + 44, top + 30, cx + 32 + sway, top - 38).closePath().fill(0x2a2632);
      g.moveTo(cx - 18, top + 10).bezierCurveTo(cx - 18, top + 70, cx - 6, top + 112, cx, top + 140).bezierCurveTo(cx + 6, top + 112, cx + 18, top + 70, cx + 18, top + 10).closePath().fill(INK);
      const fall = lt > until ? (lt - until) / 0.25 : 0;
      const r = 14 + 46 * grow;
      const y = top + 136 + r * 0.9 + fall * fall * 170;
      g.ellipse(cx, y, r * 0.85, r * (1 + fall * 0.6)).fill(C.goldLight);
      g.ellipse(cx - r * 0.25, y - r * 0.3, r * 0.22, r * 0.3).fill(0xfff6d8);
      g.circle(cx, y, r * 2.4).fill({ color: 0xffd27a, alpha: 0.12 * grow });
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};

/** a burst of gold light from a point (screen, additive): rays + sparks — the voices breaking through */
const bloom: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 2);
  let g: Graphics | null = null;
  const R = rng(cue.id * 3);
  const rays = Array.from({ length: 16 }, () => ({ a: R() * Math.PI * 2, w: 0.04 + R() * 0.08, L: 0.6 + R() * 0.6 }));
  return clip(cue.m, d, {
    z: 2,
    mount: () => {
      g = new Graphics();
      g.blendMode = 'add';
      k.layers.screen.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      g.clear();
      const p = a.world ? k.cam.toScreen(...wpos(k, a.at)) : typeof a.at === 'string' ? (k.stage.anchor?.(a.at, k) ?? [W / 2, H / 2]) : Array.isArray(a.at) ? (a.at as [number, number]) : [W / 2, H / 2];
      const x = ease('expoOut', Math.min(1, lt / 0.5));
      const fade = Math.max(0, 1 - lt / d) ** 1.5;
      const L = 2200 * x;
      for (const r of rays) {
        const a0 = r.a + lt * 0.08;
        g.poly([p[0], p[1], p[0] + Math.cos(a0 - r.w) * L * r.L, p[1] + Math.sin(a0 - r.w) * L * r.L, p[0] + Math.cos(a0 + r.w) * L * r.L, p[1] + Math.sin(a0 + r.w) * L * r.L]).fill({ color: 0xffd98a, alpha: 0.18 * fade });
      }
      g.circle(p[0], p[1], 160 * x + 40).fill({ color: 0xffe2a0, alpha: 0.35 * fade });
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};

/** the silent beat (no sound): the page edge pulses on each beat so the picture carries the pulse */
const pulse: VerbFn = (k, _a, cue) => {
  if (!k.silent) return null;
  let g: Graphics | null = null;
  return clip(cue.m, 0.2, {
    mount: () => {
      g = new Graphics();
      k.layers.screen.addChild(g);
    },
    update: (lt) => {
      if (!g || !k.silent) return;
      const v = k.view;
      g.clear().rect(v.x + 8, v.y + 8, v.w - 16, v.h - 16).stroke({ width: 10, color: INK, alpha: 0.4 * (1 - lt / 0.2) });
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};

/** a heavy hit's signature in this style: the ink impact frame (guarded) + an ink burst + pages + the camera sinks */
const heavy: VerbFn = (k, a, cue) => {
  const at = () => wpos(k, a.at ?? 'book');
  const r = num(a, 'r', 420);
  const gold = !!a.gold;
  let grant: 'full' | 'soft' | 'none' = 'soft';
  const out: Clip[] = [
    inkBurstClip(k, cue.m, cue.id * 19, at, { r, n: 44, dur: 1.8, gold }),
    pageBlastClip(k, cue.m, cue.id * 23, at, { n: 34, power: 1.5, dur: 2.6, size: 34 }),
    clip(cue.m, 0.07, {
      mount: () => {
        grant = k.guard.request(cue.m, 'impact');
      },
      update: () => {
        if (grant !== 'full') return;
        k.fx.impact = 1;
        k.fx.invert = !!a.invert;
        k.fx.impactAccent = gold ? 0xe6b84a : 0xc8321e;
      },
    }),
    clip(cue.m, 1.6, {
      update: (lt) => {
        const sink = lt < 0.2 ? ease('out', lt / 0.2) : Math.exp(-(lt - 0.2) / 0.5);
        k.cam.offset(0, -num(a, 'sink', 120) * sink);
        k.cam.punch(0.1 * Math.exp(-lt / 0.25));
        k.cam.shake(22 * Math.exp(-lt / 0.35), k.m, cue.id, 14);
      },
    }),
  ];
  return out;
};

export const WIL_VERBS: Record<string, VerbFn> = {
  word,
  shhh,
  seal,
  inkBurst,
  pageBlast,
  pose,
  jolt,
  stroke,
  inkWave,
  pageShot,
  gild,
  enso,
  streaks,
  scroll,
  coldOpen,
  drop,
  bloom,
  pulse,
  heavy,
};
export { lerpColor };
