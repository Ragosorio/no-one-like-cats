/**
 * TOOLKIT VERBS — usable by every Momento's score (docs/part-ii/29 §5.3 lists them with their args).
 *
 * Camera:   punch · shake · roll · whip · aberr
 * Frame:    impact (impact frame: 2-tone + accent, guarded) · flash (guarded, never saturated red)
 * Lines:    speed · focus
 * Shapes:   ring (shockwave) · burst (spiky impact star) · sparkle (4-point stars) · confetti · notes
 * Type:     sfx (onomatopoeia: Anton on a brush slab + misregistered color copy + small katakana)
 * Pulse:    beat (a frame pulse on every beat: strong when there is no sound)
 *
 * Positions: `at: 'name'` (a stage anchor, screen space) · `at: [x, y]` (design box) · `at: () => [x, y]` (live) ·
 * `world: true` → [x, y] are
 * world coordinates (drawn in the camera layer). Durations in seconds unless `beats` is given.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { Args } from '../types';
import { safeFlashColor, SOFT_FLASH_ALPHA } from '../flash';
import { ease } from '../score';
import { W, H, clip, type Clip, type Kit, type VerbFn } from './kit';
import { brushSlab, burstPts, focusLines, rng, speedLines, starPts } from './draw';

const num = (a: Args, k: string, d: number) => (typeof a[k] === 'number' && Number.isFinite(a[k] as number) ? (a[k] as number) : d);
const col = (a: Args, k: string, d: number) => (typeof a[k] === 'number' ? (a[k] as number) : d);
/** a duration: args.dur (s) or args.beats */
export const durOf = (k: Kit, a: Args, d: number) => (typeof a.beats === 'number' ? (a.beats as number) * k.beat : num(a, 'dur', d));

/** screen position of a verb (anchor name, [x, y], or x/y args) */
export function posOf(k: Kit, a: Args, dx = W / 2, dy = H / 2): [number, number] {
  const at = a.at;
  if (typeof at === 'function') return (at as () => [number, number])();
  if (typeof at === 'string') {
    const p = k.stage.anchor?.(at, k);
    if (p) return p;
  }
  if (Array.isArray(at) && at.length === 2) {
    if (a.world) return k.cam.toScreen(at[0] as number, at[1] as number);
    return [at[0] as number, at[1] as number];
  }
  return [num(a, 'x', dx), num(a, 'y', dy)];
}
/** palette color by name ('accent', 'ink'…) or a number */
export function palCol(k: Kit, v: unknown, d: keyof Kit['pal'] = 'accent'): number {
  if (typeof v === 'number') return v;
  const key = (typeof v === 'string' ? v : d) as keyof Kit['pal'];
  const c = k.pal[key];
  return typeof c === 'number' ? c : (k.pal[d] as number);
}
const decay = (lt: number, dur: number) => Math.max(0, 1 - lt / dur);

// ------------------------------------------------------------------ camera
const punch: VerbFn = (k, a, cue) => {
  const z = num(a, 'z', 0.08);
  const d = durOf(k, a, 0.28);
  return clip(cue.m, d, { update: (lt) => k.cam.punch(z * ease('out', 1 - lt / d)) });
};
const shake: VerbFn = (k, a, cue) => {
  const amp = num(a, 'amp', 16);
  const d = durOf(k, a, 0.4);
  const seed = cue.id;
  return clip(cue.m, d, { update: (lt) => k.cam.shake(amp * decay(lt, d) ** 1.5, k.m, seed, num(a, 'freq', 24)) });
};
const roll: VerbFn = (k, a, cue) => {
  const r = num(a, 'r', 0.06);
  const d = durOf(k, a, 0.5);
  const inn = Math.min(d * 0.3, 0.12);
  return clip(cue.m, d, { update: (lt) => k.cam.roll(r * (lt < inn ? ease('out', lt / inn) : 1 - ease('inOut', (lt - inn) / (d - inn)))) });
};
const whip: VerbFn = (k, a, cue) => {
  const dx = num(a, 'dx', -520);
  const dy = num(a, 'dy', 0);
  const d = durOf(k, a, 0.22);
  const c: Clip[] = [clip(cue.m, d, { update: (lt) => k.cam.offset(dx * (1 - ease('expoOut', lt / d)), dy * (1 - ease('expoOut', lt / d))) })];
  if (!k.reduceMotion) c.push(...[speed(k, { dur: d * 0.8, ang: Math.atan2(dy, dx), alpha: 0.9, n: 70, color: 'light' }, cue)].flat().filter(Boolean) as Clip[]);
  return c;
};
const aberr: VerbFn = (k, a, cue) => {
  const amt = num(a, 'amount', 1);
  const d = durOf(k, a, 0.2);
  return clip(cue.m, d, { update: (lt) => (k.fx.aberr = Math.max(k.fx.aberr, amt * decay(lt, d) * (k.reduceMotion ? 0.3 : 1))) });
};

// ------------------------------------------------------------------ frame
/**
 * IMPACT FRAME: the whole frame turns 2-tone (ink / paper + the accent on what was saturated), optionally inverted,
 * for ~3 frames. Guarded: over 3 per second (or with «Reducir destellos») it becomes a frame of focus lines instead.
 */
const impact: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 0.07);
  let grant: 'full' | 'soft' | 'none' = 'soft';
  const out: Clip[] = [
    clip(cue.m, d, {
      mount: () => (grant = k.guard.request(cue.m, 'impact')),
      update: () => {
        if (grant !== 'full') return;
        k.fx.impact = 1;
        k.fx.invert = !!a.invert;
        k.fx.impactAccent = safeFlashColor(palCol(k, a.accent, 'accent'));
      },
    }),
  ];
  if (a.lines !== false) out.push(...([focus(k, { dur: d + 0.12, inner: num(a, 'inner', 300), color: a.invert ? 'light' : 'ink', alpha: 1, at: a.at, n: 110, thick: 2 }, cue)].flat().filter(Boolean) as Clip[]));
  out.push(clip(cue.m, d + 0.1, { update: (lt) => k.cam.punch(0.05 * decay(lt, d + 0.1)) }));
  return out;
};
const flash: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 0.16);
  const amt = num(a, 'amount', 0.7);
  const color = safeFlashColor(palCol(k, a.color, 'light'));
  let grant: 'full' | 'soft' | 'none' = 'soft';
  return clip(cue.m, d, {
    mount: () => (grant = amt > SOFT_FLASH_ALPHA ? k.guard.request(cue.m, 'flash') : 'soft'),
    update: (lt) => {
      const peak = grant === 'full' ? amt : Math.min(amt, SOFT_FLASH_ALPHA);
      const v = peak * decay(lt, d) ** 2;
      if (v > k.fx.flash) {
        k.fx.flash = v;
        k.fx.flashColor = color;
      }
    },
  });
};

// ------------------------------------------------------------------ lines
/** parallel speed lines over the screen, redrawn on twos (they flicker like drawn lines do) */
export const speed: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 0.5);
  const ang = num(a, 'ang', 0);
  const n = Math.round(num(a, 'n', 60) * k.density);
  const alpha = num(a, 'alpha', 0.85);
  let g: Graphics | null = null;
  let last = -1;
  return clip(cue.m, d, {
    z: num(a, 'z', 0),
    mount: () => {
      g = new Graphics();
      g.position.set(W / 2, H / 2);
      k.layers[(a.layer as 'screen' | 'panels') ?? 'screen'].addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const st = Math.floor(k.m * 12);
      if (st !== last) {
        last = st;
        g.clear();
        speedLines(g, k.view.w + 400, k.view.h + 400, ang, n, palCol(k, a.color, 'light'), cue.id * 31 + st, num(a, 'thick', 1));
      }
      const fadeIn = Math.min(1, lt / 0.05);
      g.alpha = alpha * fadeIn * (lt > d - 0.08 ? (d - lt) / 0.08 : 1) * (k.reduceMotion ? 0.5 : 1);
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};
/** focus (concentration) lines around a point, on twos */
export const focus: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 0.5);
  const n = Math.round(num(a, 'n', 90) * k.density);
  let g: Graphics | null = null;
  let last = -1;
  return clip(cue.m, d, {
    z: num(a, 'z', 0),
    mount: () => {
      g = new Graphics();
      k.layers[(a.layer as 'screen' | 'panels') ?? 'screen'].addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const st = Math.floor(k.m * 12);
      if (st !== last) {
        last = st;
        const [x, y] = posOf(k, a);
        g.clear();
        focusLines(g, x, y, k.view.w + 200, k.view.h + 200, num(a, 'inner', 340) * (1 + 0.04 * (st % 2)), n, palCol(k, a.color, 'ink'), cue.id * 17 + st, num(a, 'thick', 1));
      }
      g.alpha = num(a, 'alpha', 0.9) * Math.min(1, lt / 0.04) * (lt > d - 0.08 ? Math.max(0, (d - lt) / 0.08) : 1);
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};

// ------------------------------------------------------------------ shapes
const ring: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 0.35);
  const r0 = num(a, 'r0', 30);
  const r1 = num(a, 'r1', 260);
  const w0 = num(a, 'width', 26);
  let g: Graphics | null = null;
  const worldSpace = !!a.world;
  return clip(cue.m, d, {
    mount: () => {
      g = new Graphics();
      (worldSpace ? k.layers.wfx : k.layers.screen).addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const x = lt / d;
      const r = r0 + (r1 - r0) * ease('expoOut', x);
      const [px, py] = worldSpace && Array.isArray(a.at) ? [a.at[0] as number, a.at[1] as number] : posOf(k, a);
      g.clear();
      g.circle(px, py, r).stroke({ width: Math.max(1, w0 * (1 - x)), color: palCol(k, a.color, 'light'), alpha: 1 - x * 0.6 });
      if (a.double !== false) g.circle(px, py, r * 0.72).stroke({ width: Math.max(1, w0 * 0.4 * (1 - x)), color: palCol(k, a.color2, 'accent'), alpha: 1 - x });
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};
/** a spiky cel impact star (fill + ink), pops on twos: big → bigger → gone */
const burst: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 0.2);
  const r = num(a, 'r', 120);
  let g: Graphics | null = null;
  let last = -1;
  const worldSpace = !!a.world;
  return clip(cue.m, d, {
    z: 2,
    mount: () => {
      g = new Graphics();
      (worldSpace ? k.layers.wfx : k.layers.screen).addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const st = Math.floor(lt * 24);
      if (st === last) return;
      last = st;
      const [px, py] = worldSpace && Array.isArray(a.at) ? [a.at[0] as number, a.at[1] as number] : posOf(k, a);
      const s = [0.7, 1, 1.15, 1.2, 0.9][Math.min(4, st)] ?? 0.8;
      g.clear();
      const pts = burstPts(px, py, r * s, num(a, 'spikes', 9), 0.45, cue.id + st);
      g.poly(pts).fill(palCol(k, a.ink, 'ink'));
      g.poly(burstPts(px, py, r * s * 0.78, num(a, 'spikes', 9), 0.45, cue.id + st)).fill(palCol(k, a.color, 'light'));
      g.poly(burstPts(px, py, r * s * 0.42, 6, 0.3, cue.id + st + 9)).fill(palCol(k, a.color2, 'accent'));
      g.alpha = lt > d * 0.7 ? 1 - (lt - d * 0.7) / (d * 0.3) : 1;
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};
const sparkle: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 0.5);
  const n = Math.max(1, Math.round(num(a, 'n', 6) * k.density));
  const R = rng(cue.id * 7 + 3);
  const spread = num(a, 'spread', 140);
  const parts = Array.from({ length: n }, () => ({ dx: (R() - 0.5) * 2 * spread, dy: (R() - 0.5) * 2 * spread, r: num(a, 'r', 26) * (0.5 + R()), t0: R() * d * 0.4, rot: R() * Math.PI }));
  let g: Graphics | null = null;
  const worldSpace = !!a.world;
  return clip(cue.m, d, {
    mount: () => {
      g = new Graphics();
      (worldSpace ? k.layers.wfx : k.layers.screen).addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const [px, py] = worldSpace && Array.isArray(a.at) ? [a.at[0] as number, a.at[1] as number] : posOf(k, a);
      g.clear();
      const c = palCol(k, a.color, 'light');
      for (const p of parts) {
        const x = (lt - p.t0) / (d - p.t0);
        if (x < 0 || x > 1) continue;
        const s = Math.sin(x * Math.PI);
        g.poly(starPts(px + p.dx, py + p.dy, p.r * s, p.r * s * 0.18, 4, p.rot)).fill(c);
      }
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};
/** confetti / papel picado bits: closed-form ballistic flight (seekable), tumbling rectangles in the palette */
const confetti: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 1.6);
  const n = Math.max(1, Math.round(num(a, 'n', 40) * k.density));
  const R = rng(cue.id * 13 + 5);
  const vx0 = num(a, 'vx', 0);
  const vy0 = num(a, 'vy', -900);
  const spread = num(a, 'spread', 600);
  const grav = num(a, 'g', 1400);
  const colors = [k.pal.accent, k.pal.accent2, k.pal.light, k.pal.base];
  const parts = Array.from({ length: n }, () => ({
    vx: vx0 + (R() - 0.5) * spread,
    vy: vy0 * (0.6 + R() * 0.6),
    w: 10 + R() * 14,
    h: 6 + R() * 8,
    spin: (R() - 0.5) * 18,
    c: colors[Math.floor(R() * colors.length)],
    drift: R() * 6,
  }));
  let g: Graphics | null = null;
  const worldSpace = !!a.world;
  return clip(cue.m, d, {
    mount: () => {
      g = new Graphics();
      (worldSpace ? k.layers.wfx : k.layers.screen).addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const [px, py] = worldSpace && Array.isArray(a.at) ? [a.at[0] as number, a.at[1] as number] : posOf(k, a);
      g.clear();
      const t = Math.floor(lt * 30) / 30;
      for (const p of parts) {
        const drag = Math.min(t, 0.6);
        const x = px + p.vx * drag + Math.sin(t * 5 + p.drift) * 18;
        const y = py + p.vy * drag + 0.5 * grav * t * t * 0.55;
        const s = Math.abs(Math.cos(t * p.spin));
        g.rect(x - p.w / 2, y - (p.h * s) / 2, p.w, Math.max(1, p.h * s)).fill(p.c);
      }
      g.alpha = lt > d - 0.3 ? Math.max(0, (d - lt) / 0.3) : 1;
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};
const beatPulse: VerbFn = (k, a, cue) => {
  const d = Math.min(0.3, k.beat * 0.6);
  let g: Graphics | null = null;
  // only without sound: then the frame itself carries the beat (with sound it would be noise)
  const strong = k.silent ? num(a, 'strength', 0.6) : 0;
  return clip(cue.m, d, {
    mount: () => {
      g = new Graphics();
      k.layers.screen.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const v = (k.silent ? num(a, 'strength', 0.6) : 0) * decay(lt, d) ** 2;
      void strong;
      g.clear();
      const w = 14 + 26 * v;
      const { x, y, w: vw, h: vh } = k.view;
      const c = palCol(k, a.color, 'accent');
      g.rect(x, y, vw, w).fill({ color: c, alpha: v });
      g.rect(x, y + vh - w, vw, w).fill({ color: c, alpha: v });
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};

// ------------------------------------------------------------------ type
export const SFX_STYLE = (size: number, fill: number, stroke: number) => ({
  fontFamily: 'Anton',
  fontSize: size,
  fill,
  stroke: { color: stroke, width: Math.max(6, size * 0.12), join: 'round' as const },
  letterSpacing: 2,
});
export const KATA_STYLE = (size: number, fill: number, stroke: number) => ({
  fontFamily: 'Dela Gothic One',
  fontSize: size,
  fill,
  stroke: { color: stroke, width: Math.max(4, size * 0.14), join: 'round' as const },
});
/**
 * Bake ahead the type a cue will mount (same styles, same palette as at its instant): a 120 px word costs a texture
 * upload of ~10–40 ms, which landed ON the hit it shouts. The runner calls this for every cue + branch before the clock.
 */
export function warmText(k: Kit, verb: string, a: Args) {
  if (verb === 'sfx') {
    const text = String(a.text ?? '¡PUM!');
    const size = num(a, 'size', 120);
    const fill = palCol(k, a.color, 'light');
    const ink = palCol(k, a.ink, 'ink');
    const acc = palCol(k, a.accent, 'accent');
    k.text.get(text, SFX_STYLE(size, fill, ink));
    k.text.get(text, SFX_STYLE(size, acc, acc));
    if (a.kata) k.text.get(String(a.kata), KATA_STYLE(size * 0.32, ink, fill));
  } else if (verb === 'cutin') {
    if (a.text) k.text.get(String(a.text), SFX_STYLE(num(a, 'textSize', 86), palCol(k, a.textColor, 'light'), palCol(k, a.ink, 'ink')));
    if (a.kata) k.text.get(String(a.kata), KATA_STYLE(54, palCol(k, a.ink, 'ink'), palCol(k, a.edge, 'light')));
  } else if (verb === 'panels' && Array.isArray(a.cells)) {
    for (const cell of a.cells as Args[]) if (typeof cell?.sfx === 'string') k.text.get(cell.sfx, SFX_STYLE(num(cell, 'size', 90), palCol(k, cell.sfxColor, 'light'), palCol(k, 'ink')));
  }
}

/**
 * ONOMATOPOEIA: a big Anton word on a brush slab, a misregistered color copy behind it, a small katakana sub-SFX.
 * Pops on twos (1.35 → 0.92 → 1.0), jitters a little while held, then snaps out.
 */
const sfxText: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 0.7);
  const text = String(a.text ?? '¡PUM!');
  const size = num(a, 'size', 120);
  // the word's colors are fixed at the cue's instant (baked ahead by warmText)
  const kp = { pal: k.palFor(cue) } as Kit;
  const fill = palCol(kp, a.color, 'light');
  const ink = palCol(kp, a.ink, 'ink');
  const acc = palCol(kp, a.accent, 'accent');
  const rot = num(a, 'rot', -0.08);
  // bake now (score cues: at build, before the clock — also the words other verbs shout through tk('sfx'))
  k.text.get(text, SFX_STYLE(size, fill, ink));
  k.text.get(text, SFX_STYLE(size, acc, acc));
  if (a.kata) k.text.get(String(a.kata), KATA_STYLE(size * 0.32, ink, fill));
  let c: Container | null = null;
  return clip(cue.m, d, {
    z: 5,
    mount: () => {
      c = new Container();
      if (a.back !== false) {
        const tex = k.text.get(text, SFX_STYLE(size, fill, ink));
        const slab = new Graphics();
        brushSlab(slab, tex.width * 1.0 + size * 0.4, size * 0.95, palCol(k, a.back, 'accent'), cue.id);
        slab.alpha = 0.95;
        c.addChild(slab);
      }
      const mis = k.text.sprite(text, SFX_STYLE(size, acc, acc));
      mis.position.set(size * 0.06, size * 0.05);
      mis.tint = 0xffffff;
      const main = k.text.sprite(text, SFX_STYLE(size, fill, ink));
      c.addChild(mis, main);
      if (a.kata) {
        const kt = k.text.sprite(String(a.kata), KATA_STYLE(size * 0.32, ink, fill));
        kt.position.set(main.width * 0.42, -size * 0.55);
        kt.rotation = 0.12;
        c.addChild(kt);
      }
      c.rotation = rot;
      k.layers.type.addChild(c);
    },
    update: (lt) => {
      if (!c) return;
      const [x, y] = posOf(k, a);
      const st = Math.floor(lt * 12);
      const s = st === 0 ? 1.35 : st === 1 ? 0.92 : 1;
      const out = lt > d - 0.1 ? 1 + (lt - (d - 0.1)) * 4 : 1;
      const jit = st > 1 && !k.reduceMotion ? ((st % 2) - 0.5) * 3 : 0;
      c.position.set(x + jit, y - jit);
      c.scale.set(s * out * num(a, 'scale', 1));
      c.alpha = lt > d - 0.1 ? Math.max(0, (d - lt) / 0.1) : 1;
    },
    unmount: () => {
      c?.destroy({ children: true });
      c = null;
    },
  });
};

/** music notes rising from a point (party feel) */
const notes: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 1.2);
  const n = Math.max(1, Math.round(num(a, 'n', 4) * k.density));
  const R = rng(cue.id + 99);
  const ps = Array.from({ length: n }, (_, i) => ({ dx: (R() - 0.5) * 160, t0: (i / n) * d * 0.5, s: 0.7 + R() * 0.6, ch: R() < 0.5 ? '♪' : '♫' }));
  let c: Container | null = null;
  const sprites: Sprite[] = [];
  const kp = { pal: k.palFor(cue) } as Kit;
  const style = { fontFamily: 'Dela Gothic One', fontSize: 64, fill: palCol(kp, a.color, 'light'), stroke: { color: palCol(kp, a.ink, 'ink'), width: 8 } };
  for (const ch of ['♪', '♫']) k.text.get(ch, style);
  return clip(cue.m, d, {
    mount: () => {
      c = new Container();
      for (const p of ps) {
        const s = k.text.sprite(p.ch, style);
        sprites.push(s);
        c.addChild(s);
      }
      (a.world ? k.layers.wfx : k.layers.screen).addChild(c);
    },
    update: (lt) => {
      if (!c) return;
      const [px, py] = a.world && Array.isArray(a.at) ? [a.at[0] as number, a.at[1] as number] : posOf(k, a);
      ps.forEach((p, i) => {
        const x = (lt - p.t0) / (d - p.t0);
        const s = sprites[i];
        s.visible = x >= 0 && x <= 1;
        const st = Math.floor(lt * 12) / 12;
        s.position.set(px + p.dx + Math.sin(st * 6 + i) * 20, py - (st - p.t0) * 220);
        s.scale.set(p.s * (x < 0.15 ? x / 0.15 : 1));
        s.alpha = x > 0.7 ? (1 - x) / 0.3 : 1;
      });
    },
    unmount: () => {
      c?.destroy({ children: true });
      c = null;
      sprites.length = 0;
    },
  });
};

export const TOOLKIT_VERBS: Record<string, VerbFn> = {
  punch,
  shake,
  roll,
  whip,
  aberr,
  impact,
  flash,
  speed,
  focus,
  ring,
  burst,
  sparkle,
  confetti,
  sfx: sfxText,
  notes,
  beat: beatPulse,
};
