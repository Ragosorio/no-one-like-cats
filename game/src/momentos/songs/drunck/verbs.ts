/**
 * «DRUNCK» — the Momento's own verbs (docs/part-iii/04 §3). TV-cartoon type and balloons, the OYENTE's balloon, the
 * PHYSICAL transitions (foam → sea, beer → ink, neon sign → galleon, a page turning) and the three-way choice
 * «¿CUÁNTOS?». Words are baked in the verb body (before the clock), never on the beat. Markers the stage reads from the
 * score (hic, portada, folio, burp, chainBreak, tear, silence) draw nothing themselves, or only a flourish.
 */
import { Container, Graphics, Rectangle, Sprite, type TextStyleOptions } from 'pixi.js';
import { clip, type Clip, type Kit, type VerbFn, W, H } from '../../anime/kit';
import type { Cue } from '../../types';
import { TV, LW } from './tv';

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOut = (x: number) => 1 - (1 - clamp01(x)) ** 3;
const pop = (lt: number, inT = 0.14) => {
  const x = clamp01(lt / inT);
  return x < 1 ? 0.6 + 0.55 * Math.sin(x * Math.PI * 0.75) : 1;
};
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
type DrunckLike = { choose(n: 3 | 40 | 1000, m: number): void; pickAtM(m: number): 3 | 40 | 1000 | null; choiceDecideM: number };
const stageOf = (k: Kit) => k.stage as unknown as DrunckLike;

/** the screen point of an anchor (or a fixed point) */
function where(k: Kit, a: unknown, fallback: [number, number]): [number, number] {
  if (Array.isArray(a)) return [Number(a[0]), Number(a[1])];
  if (typeof a === 'string') return k.stage.anchor?.(a, k) ?? fallback;
  return fallback;
}

// ------------------------------------------------------------------ type
const BALLOON: TextStyleOptions = { fontFamily: 'Bangers', fontSize: 62, fill: TV.line, letterSpacing: 2, align: 'center', wordWrap: true, wordWrapWidth: 640 };
const BALLOON_QUIET: TextStyleOptions = { fontFamily: 'Permanent Marker', fontSize: 50, fill: TV.line, align: 'center', wordWrap: true, wordWrapWidth: 600 };
/** the OYENTE's typefaces — another one each time (the joke of 04 §0; the same family list as ui/dialog.ts) */
export const OYENTE_TYPES: TextStyleOptions[] = [
  { fontFamily: 'UnifrakturMaguntia', fontSize: 64, fill: TV.line },
  { fontFamily: 'Rubik Glitch', fontSize: 56, fill: TV.line },
  { fontFamily: 'Playfair Display', fontStyle: 'italic', fontWeight: '700', fontSize: 58, fill: TV.line },
  { fontFamily: 'Bebas Neue', fontSize: 70, fill: TV.line, letterSpacing: 4 },
];

/** Canelo's balloon: 1–4 words on the strong beat, its tail toward him; `quiet` = the softer, handwritten ones */
const globo: VerbFn = (k, a, cue) => {
  const quiet = !!a.quiet;
  const tex = k.text.get(String(a.text ?? ''), quiet ? BALLOON_QUIET : BALLOON);
  // a balloon never outlives its scene (a TV cut takes it away)
  const nextCut = (k.score.keys.get('scn') ?? []).find((x) => x.m > cue.m + 0.05)?.m ?? Infinity;
  const dur = Math.max(0.3, Math.min(typeof a.dur === 'number' ? a.dur : k.bar * 0.75, nextCut - cue.m - 0.02));
  let root: Container | null = null;
  let g: Graphics | null = null;
  return clip(cue.m, dur, {
    mount: (kk) => {
      root = new Container();
      g = new Graphics();
      const s = new Sprite(tex);
      s.anchor.set(0.5);
      root.addChild(g, s);
      kk.layers.type.addChild(root);
    },
    update: (lt, kk) => {
      if (!root || !g) return;
      const [ax0, ay0] = where(kk, a.at ?? 'caneloHead', [1250, 380]);
      const v = kk.view;
      const w = tex.width + 70;
      const h = tex.height + 44;
      // where he is (an anchor off the frame — his arm reaching in from outside — still points the tail his way)
      const ax = Math.max(v.x + 60, Math.min(v.x + v.w - 60, ax0));
      const ay = Math.max(v.y + 60, Math.min(v.y + v.h - 60, ay0));
      // above-left of his head (he looks right: the OYENTE's side stays free); no room above → beside it, on the left,
      // so the balloon never sits on his face
      let x = Math.max(v.x + w / 2 + 30, Math.min(ax - 120, v.x + v.w - w / 2 - 420));
      let y = ay - 230;
      if (y - h / 2 < v.y + 24) {
        y = ay - 60;
        x = Math.max(v.x + w / 2 + 30, Math.min(ax - w / 2 - 170, v.x + v.w - w / 2 - 420));
      }
      // `pos`: the balloon sits in a chosen calm spot (the front pages' margin: never over a headline); `left`: left
      // of his head (a prompt owns the space above it)
      if (Array.isArray(a.pos)) {
        x = Number(a.pos[0]);
        y = Number(a.pos[1]);
      } else if (a.left) {
        x = Math.max(v.x + w / 2 + 30, ax - w / 2 - 200);
        y = ay - 140;
      }
      x = Math.max(v.x + w / 2 + 30, Math.min(v.x + v.w - w / 2 - 30, x));
      y = Math.max(v.y + h / 2 + 24, Math.min(v.y + v.h - h / 2 - 24, y));
      g.clear();
      g.roundRect(-w / 2 + 8, -h / 2 + 8, w, h, h / 2).fill(TV.line);
      g.roundRect(-w / 2, -h / 2, w, h, h / 2).fill(quiet ? 0xfdf3dc : TV.white).stroke({ width: LW, color: TV.line });
      const tx = Math.max(-w / 2 + 30, Math.min(w / 2 - 30, ax - x));
      const px = Math.max(-w / 2 - 160, Math.min(w / 2 + 160, ax - x - 30));
      const py = Math.max(h / 2 + 24, Math.min(150, ay - y - 40));
      g.poly([tx - 22, h / 2 - 4, tx + 22, h / 2 - 4, px, py]).fill(quiet ? 0xfdf3dc : TV.white);
      g.moveTo(tx - 22, h / 2).lineTo(px, py).lineTo(tx + 22, h / 2).stroke({ width: LW, color: TV.line, join: 'round' });
      root.position.set(x, y);
      const out = clamp01((lt - (dur - 0.12)) / 0.12);
      root.scale.set(pop(lt) * (1 - out * 0.2));
      root.alpha = 1 - out;
    },
    unmount: () => {
      root?.destroy({ children: true });
      root = null;
      g = null;
    },
  });
};

/** the OYENTE: a round balloon from the RIGHT edge, no name, no portrait, another typeface every time */
const oyente: VerbFn = (k, a, cue) => {
  const n = k.score.cues.filter((c) => c.act.verb === 'oyente' && c.m < cue.m - 1e-6).length;
  const tex = k.text.get(String(a.text ?? '¿Y luego?'), OYENTE_TYPES[n % OYENTE_TYPES.length]);
  const nextCut = (k.score.keys.get('scn') ?? []).find((x) => x.m > cue.m + 0.05)?.m ?? Infinity;
  const dur = Math.max(0.4, Math.min(k.bar * 0.85, nextCut - cue.m - 0.02));
  let root: Container | null = null;
  return clip(cue.m, dur, {
    mount: (kk) => {
      root = new Container();
      const g = new Graphics();
      const w = Math.max(360, tex.width + 90);
      const h = tex.height + 70;
      g.ellipse(0, 0, w / 2, h / 2).fill(TV.white).stroke({ width: LW, color: TV.line });
      // the tail leaves through the right edge of the screen (whoever says it is out there)
      g.poly([w / 2 - 40, -10, w / 2 + 600, 30, w / 2 - 30, 24]).fill(TV.white);
      g.moveTo(w / 2 - 40, -12).lineTo(w / 2 + 600, 30).lineTo(w / 2 - 28, 26).stroke({ width: LW, color: TV.line, join: 'round' });
      const s = new Sprite(tex);
      s.anchor.set(0.5);
      root.addChild(g, s);
      kk.layers.type.addChild(root);
    },
    update: (lt, kk) => {
      if (!root) return;
      const v = kk.view;
      root.position.set(v.x + v.w - 300 + (1 - easeOut(lt / 0.16)) * 260, v.y + 300);
      root.alpha = 1 - clamp01((lt - (dur - 0.1)) / 0.1);
    },
    unmount: () => {
      root?.destroy({ children: true });
      root = null;
    },
  });
};

/** TV onomatopoeia: flat color, the uniform line, a starburst behind (`plain`: just the small word) */
const pow: VerbFn = (k, a, cue) => {
  const size = Number(a.size ?? 120);
  const plain = !!a.plain;
  const tex = k.text.get(String(a.text ?? '¡POW!'), {
    fontFamily: plain ? 'Permanent Marker' : 'Bangers',
    fontSize: size,
    fill: plain ? TV.cream : TV.amberL,
    stroke: { color: TV.line, width: Math.max(6, size * 0.09), join: 'round' },
    letterSpacing: 3,
  });
  const dur = Number(a.dur ?? 0.8);
  const rot = (rnd(cue.id) - 0.5) * 0.2;
  let root: Container | null = null;
  return clip(cue.m, dur, {
    mount: (kk) => {
      root = new Container();
      if (!plain) {
        const g = new Graphics();
        const r0 = tex.width * 0.62;
        const pts: number[] = [];
        for (let i = 0; i < 24; i++) {
          const r = i % 2 ? r0 * 0.62 : r0;
          const an = (i / 24) * Math.PI * 2;
          pts.push(Math.cos(an) * r, Math.sin(an) * r * 0.62);
        }
        g.poly(pts).fill(TV.pink).stroke({ width: LW, color: TV.line });
        root.addChild(g);
      }
      const s = new Sprite(tex);
      s.anchor.set(0.5);
      root.addChild(s);
      root.rotation = rot;
      kk.layers.type.addChild(root);
    },
    update: (lt, kk) => {
      if (!root) return;
      const [x, y] = where(kk, a.at, [960, 300]);
      root.position.set(x, y - lt * 30);
      root.scale.set(pop(lt, 0.1));
      root.alpha = 1 - clamp01((lt - dur * 0.7) / (dur * 0.3));
    },
    unmount: () => {
      root?.destroy({ children: true });
      root = null;
    },
  });
};

// ------------------------------------------------------------------ small flourishes
/** a screen-space Graphics clip: draw(g, lt, k) every frame */
function gclip(t0: number, dur: number, layer: 'screen' | 'type' | 'wfx', draw: (g: Graphics, lt: number, k: Kit) => void): Clip {
  let g: Graphics | null = null;
  return clip(t0, dur, {
    mount: (k) => {
      g = new Graphics();
      k.layers[layer].addChild(g);
    },
    update: (lt, k) => {
      if (!g) return;
      g.clear();
      draw(g, lt, k);
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
}

const hicCatch: VerbFn = (k, a, cue) => {
  const tex = k.text.get('¡hic!', { fontFamily: 'Bangers', fontSize: 64, fill: TV.cream, stroke: { color: TV.line, width: 7 } });
  let s: Sprite | null = null;
  return [
    clip(cue.m, 0.6, {
      mount: (kk) => {
        s = new Sprite(tex);
        s.anchor.set(0.5);
        kk.layers.type.addChild(s);
      },
      update: (lt, kk) => {
        if (!s) return;
        const [x, y] = where(kk, 'caneloHead', [1250, 380]);
        s.position.set(x + 120, y - 120 - lt * 90);
        s.scale.set(pop(lt, 0.08));
        s.alpha = 1 - clamp01((lt - 0.4) / 0.2);
      },
      unmount: () => {
        s?.destroy();
        s = null;
      },
    }),
    gclip(cue.m, 0.5, 'type', (g, lt, kk) => {
      const [x, y] = where(kk, 'caneloHead', [1250, 380]);
      for (let i = 0; i < 6; i++) {
        const an = (i / 6) * Math.PI * 2 + Number(a.n ?? 0);
        const r = 40 + 120 * easeOut(lt / 0.5);
        g.star(x + Math.cos(an) * r, y - 60 + Math.sin(an) * r, 5, 12 * (1 - lt / 0.5) + 2, 5).fill(TV.amberL).stroke({ width: 3, color: TV.line });
      }
    }),
  ];
};
const hicMiss: VerbFn = (_k, _a, cue) =>
  gclip(cue.m, 0.6, 'type', (g, lt, kk) => {
    const [x, y] = where(kk, 'caneloHead', [1250, 380]);
    g.circle(x + 100, y - 90 - lt * 40, 14 * (1 - lt)).fill({ color: TV.foam, alpha: 0.8 }).stroke({ width: 3, color: TV.line });
  });

/** inside the mug: a rush of bubbles rising like stars */
const bubbleBurst: VerbFn = (_k, a, cue) =>
  gclip(cue.m, 1.6, 'screen', (g, lt, kk) => {
    const v = kk.view;
    const n = Number(a.n ?? 14) * kk.density;
    for (let i = 0; i < n; i++) {
      const x = v.x + rnd(i + cue.id) * v.w;
      const y = v.y + v.h + 40 - lt * (500 + rnd(i) * 700);
      g.circle(x, y, 8 + rnd(i + 3) * 16).fill({ color: TV.foam, alpha: 0.85 * (1 - lt / 1.6) }).stroke({ width: 3, color: TV.amberD, alpha: 1 - lt / 1.6 });
    }
  });

/**
 * ¡SALUD!: his raised mug clinks against something just past the frame's right edge (whoever he is toasting stays
 * unseen: the listener rule) — a star of foam at the rim, never over his face
 */
const clink: VerbFn = (_k, _a, cue) =>
  gclip(cue.m, 0.7, 'type', (g, lt, kk) => {
    const [x, y] = where(kk, 'clink', [kk.view.x + kk.view.w - 120, 360]);
    const q = clamp01(lt / 0.5);
    g.star(x, y, 10, 40 + 120 * q, 20 + 50 * q).fill({ color: TV.foam, alpha: 1 - q }).stroke({ width: LW, color: TV.line, alpha: 1 - q });
    for (let i = 0; i < 7; i++) {
      const an = -Math.PI / 2 + (i - 3) * 0.35;
      const d = 30 + 220 * easeOut(q);
      g.circle(x + Math.cos(an) * d, y + Math.sin(an) * d + lt * lt * 500, 12 * (1 - q) + 3).fill(TV.foam).stroke({ width: 3, color: TV.line });
    }
  });
/** a wave of foam along the bottom of the screen (on the counter: under the faces) */
const foamWave: VerbFn = (_k, a, cue) =>
  gclip(cue.m, 0.9, 'screen', (g, lt, kk) => {
    const v = kk.view;
    const big = Number(a.big ?? 1);
    const x0 = v.x - 400 + lt * (v.w + 800);
    for (let i = 0; i < 9; i++) {
      const x = x0 - i * 120;
      const r = 60 + 40 * big;
      g.circle(x, v.y + v.h - r * (0.4 + 0.3 * Math.sin(i * 1.3)), r).fill(TV.foam).stroke({ width: LW, color: TV.line });
    }
  });
/** a missed toast: the foam spills down, sad */
const foamSpill: VerbFn = (_k, _a, cue) =>
  gclip(cue.m, 1.1, 'screen', (g, lt, kk) => {
    const v = kk.view;
    for (let i = 0; i < 7; i++) {
      const x = v.x + 260 + i * (v.w - 520) / 6;
      const len = 60 + 260 * easeOut(lt / 1.1) * (0.5 + rnd(i));
      g.roundRect(x - 18, v.y - 20, 36, len, 18).fill(TV.foam).stroke({ width: 4, color: TV.line });
    }
  });
/** c9: the foam BURSTS — out of his mug (the anchor), flying past the frame's edges fast: the face is clear by 0.15 s */
const foamBurst: VerbFn = (_k, a, cue) => {
  const dur = Math.min(0.4, Number(a.dur ?? 0.4));
  return gclip(cue.m, dur, 'screen', (g, lt, kk) => {
    const v = kk.view;
    const [cx, cy] = where(kk, 'clink', [W / 2, H / 2]);
    const q = easeOut(lt / dur);
    for (let i = 0; i < 14; i++) {
      const an = rnd(i) * Math.PI * 2;
      const r0 = 60 + rnd(i + 5) * 120;
      const d = 80 + q * (900 + rnd(i + 9) * 500);
      const x = cx + Math.cos(an) * d;
      const y = cy + Math.sin(an) * d * 0.7;
      const r = r0 * (1 - q * 0.5);
      if (x < v.x - r || x > v.x + v.w + r) continue;
      g.circle(x, y, r).fill(TV.foam).stroke({ width: LW, color: TV.line });
    }
  });
};

/** ¡EXTRA!: the stamp lands — a puff of paper dust around the page (miss: the page stays crooked, no dust) */
const stamp: VerbFn = (_k, a, cue) =>
  Number(a.good ?? 1)
    ? gclip(cue.m, 0.5, 'type', (g, lt) => {
        for (let i = 0; i < 10; i++) {
          const an = (i / 10) * Math.PI * 2;
          const r = 120 + 260 * easeOut(lt / 0.5);
          g.circle(W / 2 + Math.cos(an) * r * 1.6, 600 + Math.sin(an) * r * 0.5, 22 * (1 - lt / 0.5)).fill({ color: 0xe9d8b4, alpha: 0.9 });
        }
      })
    : null;

/** a broken signal: color slices that jump for a few frames (and the post's RGB split on the high tier) */
const glitch: VerbFn = (_k, a, cue) => {
  const dur = Number(a.dur ?? 0.25);
  return gclip(cue.m, dur, 'screen', (g, lt, kk) => {
    // reduced motion: no flickering slices, no RGB split (the cut itself is the fade)
    if (kk.reduceMotion) return;
    kk.fx.aberr = Math.max(kk.fx.aberr, 1 - lt / dur);
    const v = kk.view;
    const st = Math.floor(lt * 24);
    for (let i = 0; i < 7; i++) {
      const y = v.y + rnd(st * 13 + i) * v.h;
      g.rect(v.x, y, v.w, 6 + rnd(i + st) * 30).fill({ color: [TV.neonBlue, TV.neonPink, TV.cream][i % 3], alpha: 0.35 });
    }
  });
};

/** the spilled beer becomes ink: an amber puddle spreads from below, darkens to black, then recedes into sumi-e */
const inkSpill: VerbFn = (_k, a, cue) => {
  const dur = Number(a.dur ?? 0.7);
  return gclip(cue.m - 0.25, dur, 'screen', (g, lt, kk) => {
    const v = kk.view;
    const t = lt / dur;
    const r = (t < 0.45 ? easeOut(t / 0.45) : 1 - easeOut((t - 0.45) / 0.55)) * 1400;
    const col = t < 0.35 ? TV.amber : 0x15131c;
    for (let i = 0; i < 9; i++) {
      const an = (i / 9) * Math.PI * 2;
      g.circle(W / 2 + Math.cos(an) * r * 0.35, v.y + v.h + Math.sin(an) * r * 0.2 - r * 0.3, r * (0.55 + 0.2 * rnd(i))).fill(col);
    }
  });
};

/** a page turns over the screen (a paper card sweeping across, its edge catching the light) */
const pageFlip: VerbFn = (_k, a, cue) => {
  const dur = Number(a.dur ?? 0.35);
  return gclip(cue.m - dur * 0.5, dur, 'screen', (g, lt, kk) => {
    const v = kk.view;
    const q = lt / dur;
    const x = v.x + v.w * (1 - q * 1.2);
    g.poly([x, v.y, x + 260 * (1 - q), v.y + v.h * 0.5, x, v.y + v.h, v.x + v.w + 40, v.y + v.h, v.x + v.w + 40, v.y]).fill({ color: 0xf6efe0, alpha: 1 - q * 0.3 });
    g.moveTo(x, v.y).lineTo(x + 260 * (1 - q), v.y + v.h * 0.5).lineTo(x, v.y + v.h).stroke({ width: LW, color: TV.line });
  });
};

/** c23: the bar's neon sign bends into the party galleon (the same pink tube, another drawing) */
const SIGN = (): [number, number][] => {
  const out: [number, number][] = [];
  for (let i = 0; i < 24; i++) {
    const q = i / 24;
    // the sign's rectangle, walked around
    const p = q * 4;
    const side = Math.floor(p);
    const f = p - side;
    const [x0, y0, x1, y1] = [560, 300, 1360, 520];
    out.push(side === 0 ? [x0 + (x1 - x0) * f, y0] : side === 1 ? [x1, y0 + (y1 - y0) * f] : side === 2 ? [x1 - (x1 - x0) * f, y1] : [x0, y1 - (y1 - y0) * f]);
  }
  return out;
};
const SHIP = (): [number, number][] => {
  const out: [number, number][] = [];
  for (let i = 0; i < 24; i++) {
    const q = i / 24;
    const p = q * 4;
    const side = Math.floor(p);
    const f = p - side;
    // deck line, stern, curved hull, bow
    out.push(side === 0 ? [460 + 1000 * f, 560] : side === 1 ? [1460 - 60 * f, 560 + 160 * f] : side === 2 ? [1400 - 880 * f, 720 + Math.sin(f * Math.PI) * 40] : [520 - 60 * f, 720 - 160 * f]);
  }
  return out;
};
const neonMorph: VerbFn = (_k, a, cue) => {
  const dur = Number(a.dur ?? 0.45);
  const A = SIGN();
  const B = SHIP();
  return gclip(cue.m - 0.15, dur + 0.15, 'screen', (g, lt) => {
    const q = easeOut(lt / (dur + 0.15));
    const pts: number[] = [];
    for (let i = 0; i < A.length; i++) pts.push(A[i][0] + (B[i][0] - A[i][0]) * q, A[i][1] + (B[i][1] - A[i][1]) * q);
    const fade = 1 - clamp01((lt - dur) / 0.15);
    g.poly(pts).stroke({ width: 26, color: TV.neonPink, alpha: 0.35 * fade });
    g.poly(pts).stroke({ width: 8, color: 0xffd0e6, alpha: fade });
  });
};

/** ¡OTRA!: a calico paw (Doña Espuma's) slides a mug INTO the memory (miss: it tips and spills) */
const pawSlide: VerbFn = (_k, a, cue) => {
  const good = Number(a.good ?? 1) > 0;
  return gclip(cue.m - 0.2, 1.2, 'type', (g, lt, kk) => {
    const v = kk.view;
    const q = easeOut(lt / 0.45);
    const x = v.x - 200 + q * 760;
    const y = 760;
    // the mug
    const tilt = good ? 0 : clamp01((lt - 0.45) / 0.3) * 1.2;
    g.roundRect(x - 60 + Math.sin(tilt) * 40, y - 150 + (1 - Math.cos(tilt)) * 60, 120, 160, 12).fill(TV.amber).stroke({ width: LW, color: TV.line });
    g.roundRect(x - 72 + Math.sin(tilt) * 70, y - 170 + (1 - Math.cos(tilt)) * 30, 144, 38, 18).fill(TV.foam).stroke({ width: LW, color: TV.line });
    // the paw (white with orange and black patches) and its arm from the left edge, pulling back once the mug is there
    const back = clamp01((lt - 0.55) / 0.4);
    const px = x - 110 - back * 600;
    g.roundRect(v.x - 300, y - 60, px - v.x + 300, 70, 35).fill(TV.white).stroke({ width: LW, color: TV.line });
    g.ellipse(px, y - 25, 60, 44).fill(TV.white).stroke({ width: LW, color: TV.line });
    g.ellipse(px - 120, y - 30, 40, 22).fill(0xf08a3a);
    g.ellipse(px - 220, y - 22, 34, 20).fill(0x2a2028);
  });
};

/** the burp of 1930: rings of a cartoon burp out of Canelo's mouth */
const burp: VerbFn = (_k, _a, cue) =>
  gclip(cue.m, 0.8, 'type', (g, lt, kk) => {
    const [x, y] = where(kk, 'caneloHead', [960, 420]);
    for (let i = 0; i < 4; i++) {
      const r = 40 + (lt * 600 - i * 70);
      if (r < 10) continue;
      g.ellipse(x + 60, y + 20, r, r * 0.6).stroke({ width: 10 - i * 2, color: 0x9fd39a, alpha: clamp01(1 - lt / 0.8) });
    }
  });
/** the chain snaps: a burst of links */
const chainBreak: VerbFn = (_k, _a, cue) =>
  gclip(cue.m, 0.6, 'type', (g, lt, kk) => {
    const [x, y] = where(kk, 'chain', [960, 500]);
    for (let i = 0; i < 8; i++) {
      const an = (i / 8) * Math.PI * 2;
      const r = 30 + 260 * easeOut(lt / 0.6);
      g.ellipse(x + Math.cos(an) * r, y + Math.sin(an) * r + lt * lt * 600, 18, 10).stroke({ width: 6, color: 0x3a2414 });
    }
  });
/** the eyes blink on every hiccup (a ring flourish) */
const blinkAll: VerbFn = (_k, _a, cue) =>
  gclip(cue.m, 0.5, 'type', (g, lt) => {
    g.circle(W / 2, H / 2, 100 + 900 * easeOut(lt / 0.5)).stroke({ width: 16, color: TV.cream, alpha: 1 - lt / 0.5 });
  });
/** ¡PUM!: the empty mug hits the counter — splinters of foam */
const slam: VerbFn = (_k, a, cue) =>
  Number(a.good ?? 1)
    ? gclip(cue.m, 0.45, 'type', (g, lt, kk) => {
        const [x, y] = where(kk, 'tarro', [1320, 640]);
        for (let i = 0; i < 9; i++) {
          const an = Math.PI + (i / 8) * Math.PI;
          const r = 40 + 200 * easeOut(lt / 0.45);
          g.circle(x + Math.cos(an) * r, y + 60 + Math.sin(an) * r * 0.6, 10 * (1 - lt / 0.45)).fill(TV.foam).stroke({ width: 3, color: TV.line });
        }
      })
    : null;

// ------------------------------------------------------------------ ¿CUÁNTOS? (three answers: 3 · 40 · 1000)
const CHOICE_KEYS: Record<string, 0 | 1 | 2> = { Digit1: 0, Numpad1: 0, ArrowLeft: 0, KeyA: 0, Digit2: 1, Numpad2: 1, ArrowDown: 1, KeyS: 1, Digit3: 2, Numpad3: 2, ArrowRight: 2, KeyD: 2 };
const OPTIONS: (3 | 40 | 1000)[] = [3, 40, 1000];
const cuantos: VerbFn = (k, a, cue) => {
  const until = typeof a.until === 'number' ? a.until : cue.t + 2.5;
  const dur = Math.max(0.5, until - cue.t);
  const title = k.text.get('¿CUÁNTOS?', { fontFamily: 'Bangers', fontSize: 92, fill: TV.amberL, stroke: { color: TV.line, width: 10 }, letterSpacing: 4 });
  const hint = k.text.get('1 · 2 · 3   o toca uno', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 22, fill: TV.cream, stroke: { color: TV.line, width: 6 }, letterSpacing: 3 });
  const nums = OPTIONS.map((n) => k.text.get(n === 1000 ? '1 000' : String(n), { fontFamily: 'Bangers', fontSize: 110, fill: TV.cream, stroke: { color: TV.line, width: 10 }, letterSpacing: 2 }));
  let root: Container | null = null;
  let cards: { c: Container; g: Graphics }[] = [];
  let off: (() => void) | null = null;
  return clip(cue.m, dur, {
    mount: (kk) => {
      root = new Container();
      const t = new Sprite(title);
      t.anchor.set(0.5);
      const h = new Sprite(hint);
      h.anchor.set(0.5);
      root.addChild(t, h);
      cards = OPTIONS.map((n, i) => {
        const c = new Container();
        const g = new Graphics();
        const s = new Sprite(nums[i]);
        s.anchor.set(0.5);
        s.position.set(0, -10);
        c.addChild(g, s);
        c.eventMode = 'static';
        c.cursor = 'pointer';
        c.hitArea = new Rectangle(-150, -110, 300, 220);
        c.on('pointertap', () => stageOf(kk).choose(n, kk.m));
        root!.addChild(c);
        return { c, g };
      });
      const kd = (e: KeyboardEvent) => {
        const i = CHOICE_KEYS[e.code];
        if (i === undefined) return;
        e.stopPropagation();
        stageOf(kk).choose(OPTIONS[i], kk.m);
      };
      window.addEventListener('keydown', kd, true);
      off = () => window.removeEventListener('keydown', kd, true);
      kk.layers.ui.addChild(root);
    },
    update: (lt, kk) => {
      if (!root) return;
      const v = kk.view;
      const cx = v.x + v.w / 2;
      const show = easeOut(lt / 0.2) * (1 - clamp01((lt - (dur - 0.25)) / 0.25));
      root.alpha = show;
      (root.children[0] as Sprite).position.set(cx + 220, v.y + 360);
      (root.children[1] as Sprite).position.set(cx + 220, v.y + 424);
      const pick = stageOf(kk).pickAtM(kk.m);
      cards.forEach(({ c, g }, i) => {
        const n = OPTIONS[i];
        const chosen = pick === n;
        c.position.set(cx + 220 + (i - 1) * 330, v.y + 560 + Math.sin(kk.m * 6 + i) * 6);
        c.scale.set(chosen ? 1.12 : pick ? 0.9 : 1);
        g.clear();
        g.roundRect(-140 + 10, -100 + 10, 280, 200, 26).fill(TV.line);
        g.roundRect(-140, -100, 280, 200, 26).fill(chosen ? TV.pink : [TV.green, TV.night, TV.amberD][i]).stroke({ width: LW, color: chosen ? TV.amberL : TV.line });
        // little boats under the number: one sad one, a fleet, a sea of them
        const boats = i === 0 ? 1 : i === 1 ? 4 : 9;
        for (let b = 0; b < boats; b++) {
          const bx = -100 + (b + 0.5) * (200 / boats);
          g.poly([bx - 12, 62, bx + 12, 62, bx + 8, 74, bx - 8, 74]).fill(TV.cream);
        }
      });
    },
    unmount: () => {
      off?.();
      off = null;
      root?.destroy({ children: true });
      root = null;
      cards = [];
    },
  });
};

/** a marker the stage reads from the score (no drawing of its own) */
const marker: VerbFn = () => null;

export const DRUNCK_VERBS: Record<string, VerbFn> = {
  globo,
  oyente,
  pow,
  hic: marker,
  hicCatch,
  hicMiss,
  bubbleBurst,
  clink,
  foamWave,
  foamSpill,
  foamBurst,
  portada: marker,
  stamp,
  glitch,
  inkSpill,
  pageFlip,
  cuantos,
  neonMorph,
  tear: marker,
  beam: marker,
  pawSlide,
  chainBreak,
  burp,
  blinkAll,
  slam,
  silence: marker,
  folio: marker,
};
export type { Cue };
