/**
 * YONOSE TODO — the Momento's own verbs (clips: pure functions of time, so any instant can be drawn). The toolkit's
 * NEÓN CEL verbs (impact frames, katakana, cut-ins, speed lines) are never used here: this Momento speaks pencil,
 * water and paper.
 *
 *   drop      a drop of watercolor lands and blooms (rings that spread and pool at their edge)
 *   flecks    paint spattered off a brush
 *   note      a handwritten word / number by the animator (¡!, 1·2·3, ¿?)
 *   arc       a motion arc with an arrow (a cat hopping into its seat)
 *   turnFx    the motion swirl of Canelo's turn (clean) or a dizzy scribble (missed)
 *   zzz       Z's rising, one per beat
 *   poke      Luzterna pokes him: motion ticks (and his ear flicks)
 *   flood     the chorus hit: the warmth that was spreading bursts over the whole drawing
 *   caption   the dialogue slug under the panel (the story's own lines, personalized; or Luzterna's reply to the pick)
 *   mentira   «…MENTIRA.» on the climax hit: a huge wet brush word that splashes and runs
 *   coldOpen · frameIn · pickStamp   markers (the stage draws those from the clock)
 */
import { Container, Graphics } from 'pixi.js';
import type { Args, Cue } from '../../types';
import { clip, type Clip, type Kit, type VerbFn } from '../../anime/kit';
import { rng } from '../../anime/draw';

import { arc as arcMark, circle, sketch, zzz as zMark } from './pencil';
import { VIGNETTES } from './dream';
import { GRAPHITE } from './paper';
import { HAND, SANS } from './ui';
import type { YonoseStage } from './stage';

const st = (k: Kit) => k.stage as unknown as YonoseStage;
const num = (a: Args, n: string, d: number) => (typeof a[n] === 'number' ? (a[n] as number) : d);
const durOf = (k: Kit, a: Args, d: number) => (typeof a.beats === 'number' ? (a.beats as number) * k.beat : num(a, 'dur', d));
/** a screen point: an anchor name, [x, y], or the view's centre */
function at(k: Kit, a: Args, dx = 0, dy = 0): [number, number] {
  const v = a.at;
  if (Array.isArray(v)) return [Number(v[0]) + dx, Number(v[1]) + dy];
  if (typeof v === 'string') {
    const p = k.stage.anchor?.(v, k);
    if (p) return [p[0] + dx, p[1] + dy];
  }
  return [k.view.x + k.view.w / 2 + dx, k.view.y + k.view.h / 2 + dy];
}
const WARM = 0xf08a4b;
function colorOf(k: Kit, a: Args): number {
  if (typeof a.color === 'number') return a.color as number;
  if (typeof a.panel === 'number') return VIGNETTES[a.panel as number]?.accent ?? WARM;
  if (a.credit) return st(k).creditAccent() ?? WARM;
  return WARM;
}
const ease3 = (x: number) => 1 - (1 - Math.max(0, Math.min(1, x))) ** 3;

// ------------------------------------------------------------------ water
const drop: VerbFn = (k, a, cue) => {
  const R = num(a, 'r', 160);
  const n = Math.max(1, Math.round(num(a, 'n', 1)));
  const col = colorOf(k, a);
  const seed = cue.id;
  const g = new Graphics();
  return clip(cue.m, 1.9, {
    mount: () => st(k).fxWash.addChild(g),
    update: (lt) => {
      const [x, y] = at(k, a);
      g.clear();
      for (let i = 0; i < n; i++) {
        const l = lt - i * 0.16;
        if (l <= 0) continue;
        const p = ease3(l / 0.9);
        const r = R * (0.25 + 0.75 * p) * (1 - i * 0.18);
        const fade = Math.max(0, 1 - Math.max(0, l - 0.9) / 0.9);
        const ph = seed * 1.37 + i * 2.1;
        const pts: number[] = [];
        for (let j = 0; j < 56; j++) {
          const an = (j / 56) * Math.PI * 2;
          // a soft, lobed edge (low-frequency wobble: water, not a starburst)
          const rr = r * (1 + 0.07 * Math.sin(an * 3 + ph) + 0.05 * Math.sin(an * 5 - ph * 1.7));
          pts.push(x + Math.cos(an) * rr, y + Math.sin(an) * rr * 0.86);
        }
        g.poly(pts).fill({ color: col, alpha: 0.2 * fade * (1 - p * 0.4) });
        g.poly(pts).stroke({ width: 5, color: col, alpha: 0.42 * fade });
      }
    },
    unmount: () => g.removeFromParent(),
  });
};

const flecks: VerbFn = (k, a, cue) => {
  const n = Math.round(num(a, 'n', 12) * k.density + 2);
  const spread = num(a, 'spread', 200);
  const col = colorOf(k, a);
  const R = rng(cue.id * 13 + 5);
  const parts = Array.from({ length: n }, () => ({ an: R() * Math.PI * 2, v: spread * (0.6 + R() * 0.9), r: 4 + R() * 9, k: R() }));
  const g = new Graphics();
  return clip(cue.m, 1.2, {
    mount: () => st(k).fxWash.addChild(g),
    update: (lt) => {
      const [x, y] = at(k, a);
      g.clear();
      const f = Math.max(0, 1 - lt / 1.2);
      for (const p of parts) {
        const d = p.v * ease3(lt / 0.5);
        const px = x + Math.cos(p.an) * d;
        const py = y + Math.sin(p.an) * d * 0.8 + 300 * lt * lt;
        g.circle(px, py, p.r * (1 - lt * 0.3)).fill({ color: p.k < 0.3 ? 0xfff2d0 : col, alpha: 0.75 * f });
      }
    },
    unmount: () => g.removeFromParent(),
  });
};

// ------------------------------------------------------------------ the animator's pencil
const NOTE_STYLE = (size: number) => ({ fontFamily: HAND, fontSize: size, fill: GRAPHITE });
const note: VerbFn = (k, a, cue) => {
  const text = String(a.text ?? '¡!');
  const size = num(a, 'size', 56);
  const sp = k.text.sprite(text, NOTE_STYLE(size), 0.5);
  return clip(cue.m, durOf(k, a, 1.3), {
    mount: () => k.layers.screen.addChild(sp),
    update: (lt) => {
      const [x, y] = at(k, a, num(a, 'dx', 0), num(a, 'dy', -80));
      const pop = lt < 0.12 ? 0.6 + (lt / 0.12) * 0.55 : 1.15 - Math.min(0.15, (lt - 0.12) * 0.6);
      sp.position.set(x, y - lt * 28);
      sp.scale.set(pop);
      sp.rotation = -0.06 + Math.sin(cue.id) * 0.05;
      sp.alpha = Math.max(0, 1 - Math.max(0, lt - 0.8) / 0.5);
    },
    unmount: () => sp.removeFromParent(),
  });
};

/** a motion arc into a cat's seat (world, over the set) */
const arc: VerbFn = (k, a, cue) => {
  const who = String(a.who ?? 'gato0');
  const g = new Graphics();
  return clip(cue.m - 0.45, 1.6, {
    mount: () => k.layers.wfx.addChild(g),
    update: (lt) => {
      const path = st(k).hopPath(who);
      g.clear();
      if (!path) return;
      const [ax, ay, bx, by] = path;
      const p = Math.min(1, lt / 0.45);
      const ex = ax + (bx - ax) * p;
      const ey = ay + (by - ay) * p - Math.sin(p * Math.PI) * 120;
      arcMark(g, ax, ay - 30, ex, ey - 30, -60 * p, { seed: Math.floor(lt * 12) % 3, width: 3, alpha: 0.75 * Math.max(0, 1 - Math.max(0, lt - 0.9) / 0.7) });
    },
    unmount: () => g.removeFromParent(),
  });
};

/** Canelo's turn: a neat motion ellipse (clean) or a scribbled spiral over his head (dizzy) */
const turnFx: VerbFn = (k, a, cue) => {
  const g = new Graphics();
  const dizzy = !!a.dizzy;
  const clean = !!a.clean;
  return clip(cue.m, 1.1, {
    mount: () => k.layers.wfx.addChild(g),
    update: (lt) => {
      const c = st(k).caneloWorld();
      g.clear();
      if (!c) return;
      const [x, y, h] = c;
      const f = Math.max(0, 1 - Math.max(0, lt - 0.6) / 0.5);
      const step = Math.floor(lt * 12) % 3;
      if (dizzy) {
        const pts: number[] = [];
        for (let i = 0; i < 30; i++) {
          const an = i * 0.55 + lt * 6;
          const r = 8 + i * 1.2;
          pts.push(x + Math.cos(an) * r * 1.6, y - h * 1.05 + Math.sin(an) * r * 0.6);
        }
        sketch(g, pts, { seed: step, width: 2.2, alpha: 0.8 * f, passes: 1 });
      } else {
        circle(g, x, y - h * 0.45, h * 0.75, h * 0.22, { seed: step, width: clean ? 3 : 2.2, alpha: (clean ? 0.85 : 0.6) * f, turns: Math.min(1.1, lt * 2.2) });
        if (clean) for (let i = 0; i < 3; i++) sketch(g, [x - h * 0.9 - i * 12, y - h * (0.2 + i * 0.18), x - h * 1.15 - i * 12, y - h * (0.2 + i * 0.18)], { seed: step + i, width: 2, alpha: 0.6 * f, passes: 1 });
      }
    },
    unmount: () => g.removeFromParent(),
  });
};

const zzz: VerbFn = (k, a, cue) => {
  const g = new Graphics();
  const dur = durOf(k, a, 6);
  return clip(cue.m, dur, {
    mount: () => k.layers.wfx.addChild(g),
    update: (lt) => {
      const c = st(k).caneloWorld();
      g.clear();
      if (!c) return;
      const [x, y, h] = c;
      const step = Math.floor(lt * 12) % 3;
      for (let i = 0; i < 3; i++) {
        const l = (lt / k.beat - i * 1.3) % 4;
        if (l < 0) continue;
        const s = 14 + l * 7;
        const fade = Math.max(0, 1 - l / 4) * Math.max(0, Math.min(1, (dur - lt) / 1));
        zMark(g, x + h * 0.35 + l * 22, y - h * 0.9 - l * 34, s, { seed: step + i, width: 2.4, alpha: 0.75 * fade });
      }
    },
    unmount: () => g.removeFromParent(),
  });
};

const poke: VerbFn = (k, a, cue) => {
  const g = new Graphics();
  return clip(cue.m, 0.9, {
    mount: () => k.layers.wfx.addChild(g),
    update: (lt) => {
      const c = st(k).caneloWorld();
      g.clear();
      if (!c) return;
      const [x, y, h] = c;
      const f = Math.max(0, 1 - lt / 0.9);
      const step = Math.floor(lt * 12) % 3;
      for (let i = 0; i < 3; i++) sketch(g, [x + h * 0.9 + i * 6, y - h * (0.3 + i * 0.15), x + h * 1.2 + i * 8, y - h * (0.38 + i * 0.18)], { seed: step + i, width: 2, alpha: 0.7 * f, passes: 1 });
      if (a.good) for (let i = 0; i < 2; i++) sketch(g, [x - h * 0.25 + i * 16, y - h * 0.95, x - h * 0.3 + i * 18, y - h * 1.12], { seed: step + i + 4, width: 2, alpha: 0.75 * f, passes: 1 });
    },
    unmount: () => g.removeFromParent(),
  });
};

const flood: VerbFn = (k, a, cue) => {
  const out: Clip[] = [];
  const big = !!a.great;
  const late = !!a.late;
  const c: Cue = { ...cue };
  for (let i = 0; i < (big ? 3 : late ? 1 : 2); i++) {
    const x = drop(k, { at: 'canelo', r: (big ? 520 : 380) * (1 - i * 0.18), n: 2, color: [0xf08a4b, 0xffc94a, 0xe0607a][i] }, { ...c, id: cue.id * 3 + i, m: cue.m + i * 0.12 });
    if (x) out.push(x as Clip);
  }
  const f = flecks(k, { at: 'canelo', n: big ? 30 : 16, spread: big ? 620 : 420, color: 0xf08a4b }, cue);
  if (f) out.push(f as Clip);
  return out;
};

// ------------------------------------------------------------------ the dialogue
const caption: VerbFn = (k, a, cue) => {
  const s = st(k);
  const dur = durOf(k, a, 6);
  let c: Container | null = null;
  return clip(cue.m, dur, {
    mount: () => {
      const line = a.reply ? s.replyLine() : s.storyLine(String(a.beat ?? 'b64_mentira'), num(a, 'idx', 0));
      if (!line) return;
      c = s.caption(line);
      k.layers.screen.addChild(c);
    },
    update: (lt) => {
      if (!c) return;
      const { x, y } = k.view;
      c.position.set(x + 92, y + 96);
      const fin = Math.min(1, lt / 0.35);
      const fout = Math.max(0, Math.min(1, (dur - lt) / 0.5));
      c.alpha = fin * fout;
      c.pivot.y = -8 * (1 - fin);
    },
    unmount: () => {
      c?.removeFromParent();
      c = null;
    },
  });
};

// ------------------------------------------------------------------ «…MENTIRA.»
const mentira: VerbFn = (k, a, cue) => {
  const sleepy = !!a.sleepy;
  const big = !!a.big;
  const s = st(k);
  const word = k.text.sprite(sleepy ? '…mentira.' : '…MENTIRA.', { fontFamily: HAND, fontSize: sleepy ? 190 : 250, fill: 0xd9572b, letterSpacing: 4 }, 0.5);
  const who = k.text.sprite('TUS GATOS, TODOS A LA VEZ', { fontFamily: SANS, fontWeight: '700', fontSize: 26, fill: GRAPHITE, letterSpacing: 6 }, 0.5);
  const c = new Container();
  c.addChild(word, who);
  const out: Clip[] = [
    clip(cue.m, 3.4, {
      mount: () => s.typeWash.addChild(c),
      update: (lt) => {
        const { x, y, w, h } = k.view;
        const pop = lt < 0.1 ? 1.5 - lt * 5 : 1 + Math.max(0, 0.04 - (lt - 0.1) * 0.02);
        c.position.set(x + w / 2, y + h * 0.42 - Math.max(0, lt - 2.2) * 120);
        word.scale.set(pop * (big ? 1.08 : 1));
        word.rotation = -0.05;
        who.position.set(0, -170);
        who.alpha = Math.min(1, lt * 3);
        c.alpha = Math.max(0, 1 - Math.max(0, lt - 2.4) / 1);
      },
      unmount: () => c.removeFromParent(),
    }),
  ];
  const d = drop(k, { at: [k.view.x + k.view.w / 2, k.view.y + k.view.h * 0.44], r: big ? 760 : 560, n: big ? 3 : 2, color: 0xf2994a }, cue);
  if (d) out.push(d as Clip);
  const f = flecks(k, { at: [k.view.x + k.view.w / 2, k.view.y + k.view.h * 0.44], n: big ? 40 : 18, spread: big ? 900 : 560, color: 0xd9572b }, { ...cue, id: cue.id + 1 });
  if (f) out.push(f as Clip);
  if (sleepy) {
    const n = note(k, { at: [k.view.x + k.view.w / 2 + 360, k.view.y + k.view.h * 0.3], text: '(bostezo)', size: 40, dur: 2 }, { ...cue, m: cue.m + 0.5 });
    if (n) out.push(n as Clip);
  }
  // the guard decides whether the full-screen glow is allowed
  // (soft, warm paper white; never red) — a glow on the hit, if the guard allows one now (asked when it mounts)
  if (big) {
    let grant: 'full' | 'soft' | 'none' = 'none';
    out.push(
      clip(cue.m, 0.3, {
        mount: () => (grant = k.guard.request(cue.m, 'flash')),
        update: (lt) => {
          if (grant === 'none') return;
          k.fx.flash = Math.max(k.fx.flash, (grant === 'full' ? 0.3 : 0.18) * (1 - lt / 0.3));
          k.fx.flashColor = 0xfff4dc;
        },
      }),
    );
  }
  return out;
};

const none: VerbFn = () => null;

export const YONOSE_VERBS: Record<string, VerbFn> = { drop, flecks, note, arc, turnFx, zzz, poke, flood, caption, mentira, coldOpen: none, frameIn: none, pickStamp: none };
