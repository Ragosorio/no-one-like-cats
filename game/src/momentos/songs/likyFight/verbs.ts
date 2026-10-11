/**
 * LIKY FIGHT — scene verbs (the score in score.ts calls them by name). Each returns clips; every clip is a pure
 * function of its local time so the Momento can be scrubbed, paused and replayed frame-exact.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { Args, Cue } from '../../types';
import { clip, type Clip, type Kit, type VerbFn } from '../../anime/kit';
import { TOOLKIT_VERBS, palCol } from '../../anime/fx';
import { burstPts, rng, starPts } from '../../anime/draw';
import { lerpColor } from '../../anime/palette';
import { ease } from '../../score';
import type { LikyStage, Who } from './stage';
import { INK } from './ships';

const S = (k: Kit) => k.stage as unknown as LikyStage;
const num = (a: Args, key: string, d: number) => (typeof a[key] === 'number' ? (a[key] as number) : d);
/** run a toolkit verb from inside a scene verb (same cue id → same seeds) */
function tk(name: string, k: Kit, a: Args, cue: Cue, dt = 0): Clip[] {
  const c = TOOLKIT_VERBS[name]?.(k, a, { ...cue, m: cue.m + dt });
  return !c ? [] : Array.isArray(c) ? c : [c];
}
const decay = (lt: number, d: number) => Math.max(0, 1 - lt / d);

/** a pose for `dur` seconds */
function pose(k: Kit, cue: Cue, who: Who, name: string, dur: number, extra: { x?: number; y?: number; rot?: number; s?: number } = {}): Clip {
  return clip(cue.m, dur, { update: (lt) => S(k).wantPose(who, { name, lt, ...extra }) });
}
/** a ship jolt (cartoon bounce / recoil) for `dur` seconds */
function jolt(k: Kit, cue: Cue, ship: 'A' | 'B', dur: number, f: (x: number) => Partial<{ dx: number; dy: number; rot: number; sx: number; sy: number }>, dt = 0): Clip {
  return clip(cue.m + dt, dur, { update: (lt) => S(k).wantJolt(ship, f(lt / dur)) });
}

/** cel smoke: puffs that swell, rise and pinch out, on twos (world space) */
function smoke(k: Kit, cue: Cue, at: () => [number, number], o: { n?: number; r?: number; dur?: number; dt?: number; color?: number } = {}): Clip {
  const n = Math.max(2, Math.round((o.n ?? 5) * k.density));
  const R = rng(cue.id * 5 + 1);
  const ps = Array.from({ length: n }, () => ({ dx: (R() - 0.5) * 120, dy: (R() - 0.5) * 50, r: (o.r ?? 46) * (0.6 + R() * 0.7), vy: -40 - R() * 90, vx: (R() - 0.5) * 60 }));
  const d = o.dur ?? 1.1;
  let g: Graphics | null = null;
  let p0: [number, number] = [0, 0];
  return clip(cue.m + (o.dt ?? 0), d, {
    z: 1,
    mount: () => {
      g = new Graphics();
      k.layers.wfx.addChild(g);
      p0 = at();
    },
    update: (lt) => {
      if (!g) return;
      const t = Math.floor(lt * 12) / 12;
      const x = t / d;
      g.clear();
      const base = o.color ?? lerpColor(0xf4eee6, k.pal.light, 0.3);
      const shade = lerpColor(base, k.pal.shadow, 0.45);
      for (const p of ps) {
        const r = p.r * (0.5 + ease('out', Math.min(1, x * 2.2)) * 0.9) * (x > 0.6 ? 1 - (x - 0.6) / 0.4 : 1);
        if (r <= 1) continue;
        const cx = p0[0] + p.dx + p.vx * t;
        const cy = p0[1] + p.dy + p.vy * t;
        g.circle(cx, cy, r + 5).fill(k.pal.ink);
        g.circle(cx, cy, r).fill(base);
        g.circle(cx + r * 0.18, cy + r * 0.22, r * 0.7).fill(shade);
      }
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
}
/** wood splinters flying off a hit (closed-form, seekable) */
function splinters(k: Kit, cue: Cue, at: () => [number, number], dt = 0, n = 12): Clip {
  const R = rng(cue.id * 11 + 7);
  const ps = Array.from({ length: Math.max(3, Math.round(n * k.density)) }, () => ({ vx: (R() - 0.5) * 900, vy: -300 - R() * 700, spin: (R() - 0.5) * 30, L: 14 + R() * 26 }));
  let g: Graphics | null = null;
  let p: [number, number] = [0, 0];
  return clip(cue.m + dt, 0.9, {
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
      for (const s of ps) {
        const x = p[0] + s.vx * t;
        const y = p[1] + s.vy * t + 1500 * t * t;
        const a = s.spin * t;
        const dx = Math.cos(a) * s.L;
        const dy = Math.sin(a) * s.L;
        g.poly([x - dx, y - dy, x + dx, y + dy, x + dx * 0.6 + 4, y + dy * 0.6 + 4]).fill(0xc8955a).stroke({ width: 2.5, color: k.pal.ink });
      }
      g.alpha = lt > 0.7 ? (0.9 - lt) / 0.2 : 1;
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
}
/** a hit that leaves a mark on a hull: the scar (stays), splinters, a squash-and-stretch jolt */
function scarHit(k: Kit, cue: Cue, ship: 'A' | 'B', at: () => [number, number], r: number, dt = 0): Clip[] {
  return [
    clip(cue.m + dt, 0.05, {
      mount: () => {
        const [x, y] = at();
        S(k).addScar(ship, cue.m + dt, x, y, r, cue.id * 13 + Math.round(dt * 1000));
      },
    }),
    splinters(k, cue, at, dt),
    jolt(k, cue, ship, 0.42, (x) => ({ sx: 1 + 0.07 * Math.sin(x * Math.PI * 3) * (1 - x), sy: 1 - 0.09 * Math.sin(x * Math.PI * 3) * (1 - x) }), dt),
  ];
}
/** a world-space spiky explosion (cel) */
function boom(k: Kit, cue: Cue, at: () => [number, number], r = 120, dt = 0): Clip[] {
  let g: Graphics | null = null;
  let p: [number, number] = [0, 0];
  const d = 0.26;
  return [
    clip(cue.m + dt, d, {
      z: 3,
      mount: () => {
        g = new Graphics();
        k.layers.wfx.addChild(g);
        p = at();
      },
      update: (lt) => {
        if (!g) return;
        const st = Math.floor(lt * 24);
        const s = [0.6, 1, 1.18, 1.1, 0.95, 0.8, 0.6][Math.min(6, st)];
        g.clear();
        g.poly(burstPts(p[0], p[1], r * s * 1.08, 10, 0.4, cue.id + st)).fill(k.pal.ink);
        g.poly(burstPts(p[0], p[1], r * s, 10, 0.4, cue.id + st)).fill(0xffe14a);
        g.poly(burstPts(p[0], p[1], r * s * 0.66, 8, 0.35, cue.id + st + 3)).fill(0xff6a1a);
        g.poly(burstPts(p[0], p[1], r * s * 0.3, 6, 0.3, cue.id + st + 7)).fill(0xffffff);
      },
      unmount: () => {
        g?.destroy();
        g = null;
      },
    }),
    smoke(k, cue, at, { dt: dt + 0.12, n: 5, r: r * 0.42, dur: 1.1 }),
  ];
}
/** a little screen-space sfx that follows a world point */
function sfxAt(k: Kit, cue: Cue, world: () => [number, number], a: Args, dt = 0): Clip[] {
  return tk('sfx', k, { ...a, at: () => k.cam.toScreen(...world()) }, cue, dt);
}

// ------------------------------------------------------------------ the cold open
/** the frozen battle (already graded by the post filter) splits along a diagonal slash and slides away */
const coldCut: VerbFn = (k, a, cue) => {
  const d = num(a, 'dur', 0.75);
  let root: Container | null = null;
  const halves: { c: Container; dir: number }[] = [];
  let slash: Graphics | null = null;
  return clip(cue.m, d, {
    z: 20,
    mount: () => {
      root = new Container();
      root.zIndex = 20;
      const v = k.view;
      // diagonal through the centre, from lower-left to upper-right
      const p1 = [v.x - 200, v.y + v.h + 200];
      const p2 = [v.x + v.w + 200, v.y - 200];
      const polyA = [p1[0], p1[1], p2[0], p2[1], v.x - 400, v.y - 400];
      const polyB = [p1[0], p1[1], p2[0], p2[1], v.x + v.w + 400, v.y + v.h + 400];
      for (const [poly, dir] of [
        [polyA, -1],
        [polyB, 1],
      ] as const) {
        const c = new Container();
        if (k.snapshot) {
          const sp = new Sprite(k.snapshot);
          sp.position.set(v.x, v.y);
          sp.width = v.w;
          sp.height = v.h;
          c.addChild(sp);
        } else c.addChild(new Graphics().rect(v.x - 300, v.y - 300, v.w + 600, v.h + 600).fill(0x0b0716));
        const mask = new Graphics().poly(poly as number[]).fill(0xffffff);
        c.addChild(mask);
        (c.children[0] as Container).mask = mask;
        root.addChild(c);
        halves.push({ c, dir });
      }
      slash = new Graphics();
      root.addChild(slash);
      k.layers.panels.addChild(root);
    },
    update: (lt) => {
      if (!root || !slash) return;
      const cut = 0.06;
      const x = lt < cut ? 0 : ease('expoOut', (lt - cut) / (d - cut));
      // perpendicular to the slash: (1, 1)/√2
      for (const h of halves) h.c.position.set(h.dir * x * 1100, h.dir * x * 1100);
      slash.clear();
      const v = k.view;
      const grow = Math.min(1, lt / cut);
      const ax = v.x - 100;
      const ay = v.y + v.h + 100;
      const bx = ax + (v.w + 200) * grow;
      const by = ay - (v.h + 200) * grow;
      const w = lt < cut ? 18 : Math.max(0, 18 * (1 - (lt - cut) / 0.2));
      if (w > 0.5) {
        slash.moveTo(ax, ay).lineTo(bx, by).stroke({ width: w * 2.4, color: palCol(k, 'accent') });
        slash.moveTo(ax, ay).lineTo(bx, by).stroke({ width: w, color: 0xffffff });
      }
    },
    unmount: () => {
      root?.destroy({ children: true });
      root = slash = null;
      halves.length = 0;
    },
  });
};

// ------------------------------------------------------------------ the party wakes up
const LIGHT_SPOTS: [number, number][] = [
  [-150, -330],
  [-60, -385],
  [-30, -62],
  [-262, -272],
  [-160, -420],
  [180, -430],
  [160, -375],
  [23, -640],
  [-232, -240],
];
const lightUp: VerbFn = (k, a, cue) => {
  const i = Math.round(num(a, 'i', 0));
  const at = () => S(k).world('B', ...LIGHT_SPOTS[((i % 9) + 9) % 9]);
  const p = at();
  return [
    ...tk('ring', k, { world: true, at: p, r0: 10, r1: 120, width: 14, dur: 0.3, color: 'accent', color2: 'light' }, cue),
    ...tk('sparkle', k, { world: true, at: p, n: 5, r: 22, spread: 70, dur: 0.45, color: 'light' }, cue),
    ...tk('punch', k, { z: 0.018, dur: 0.18 }, cue),
  ];
};
const fiesta: VerbFn = (k, a, cue) => {
  const late = !!a.late;
  const out: Clip[] = [clip(cue.m, 0.05, { mount: () => S(k).fiesta(cue.m, late) })];
  const dt = late ? 0.3 : 0;
  for (const sx of [-262, 256]) {
    const p = S(k).world('B', sx, -290);
    out.push(...tk('confetti', k, { world: true, at: p, n: a.big ? 70 : 40, vy: -1100, spread: 700, dur: 2.2 }, { ...cue, id: cue.id + sx }, dt));
  }
  out.push(...tk('notes', k, { world: true, at: S(k).world('B', 160, -260), n: 5, dur: 1.6 }, cue, dt));
  out.push(...tk('flash', k, { amount: a.big ? 0.55 : 0.3, color: 'accent', dur: 0.2 }, cue, dt));
  return out;
};

// ------------------------------------------------------------------ the lift-off
const splash: VerbFn = (k, a, cue) => {
  const p = Array.isArray(a.at) ? (a.at as [number, number]) : S(k).world('B', num(a, 'dx', 0), 0);
  const n = Math.round(num(a, 'n', 26) * k.density);
  const R = rng(cue.id * 3 + 11);
  const drops = Array.from({ length: n }, () => ({ vx: (R() - 0.5) * 900, vy: -500 - R() * 900, r: 6 + R() * 12 }));
  const d = num(a, 'dur', 1.2);
  let g: Graphics | null = null;
  return [
    clip(cue.m, d, {
      z: 2,
      mount: () => {
        g = new Graphics();
        k.layers.wfx.addChild(g);
      },
      update: (lt) => {
        if (!g) return;
        const t = Math.floor(lt * 24) / 24;
        g.clear();
        const c = lerpColor(k.pal.light, k.pal.accent2, 0.3);
        // the crown: rounded water tongues rising then falling back
        const cr = Math.sin(Math.min(1, t / 0.55) * Math.PI);
        if (cr > 0.02) {
          for (let i = -3; i <= 3; i++) {
            const x = p[0] + i * 46;
            const hh = (150 - Math.abs(i) * 28) * cr;
            const w = 30 - Math.abs(i) * 3;
            g.roundRect(x - w / 2 - 5, p[1] - hh - 5, w + 10, hh + 15, w / 2 + 5).fill(k.pal.ink);
            g.roundRect(x - w / 2, p[1] - hh, w, hh + 8, w / 2).fill(c);
            g.circle(x, p[1] - hh - 10, w * 0.45).fill(0xffffff);
          }
          g.ellipse(p[0], p[1] + 4, 190, 22).fill(0xffffff).stroke({ width: 4, color: k.pal.ink });
        }
        for (const dr of drops) {
          const x = p[0] + dr.vx * t;
          const y = p[1] + dr.vy * t + 1600 * t * t;
          if (y > p[1] + 40) continue;
          g.circle(x, y, dr.r + 3).fill(k.pal.ink).circle(x, y, dr.r).fill(c);
        }
      },
      unmount: () => {
        g?.destroy();
        g = null;
      },
    }),
    ...tk('ring', k, { world: true, at: p, r0: 40, r1: num(a, 'ring', 260), width: 16, dur: 0.5, color: 'light', color2: 'accent2' }, cue),
  ];
};

// ------------------------------------------------------------------ cannons & balls
const cannonSwing: VerbFn = (k, a, cue) => {
  const i = Math.round(num(a, 'i', 0));
  const p = () => S(k).world('B', -205 + i * 160, -108);
  return [jolt(k, cue, 'B', 0.25, (x) => ({ dx: 8 * (1 - x), rot: 0.012 * (1 - x) })), ...sfxAt(k, cue, () => [p()[0], p()[1] - 120], { text: 'CLANK', size: 54, kata: 'ガチャ', dur: 0.4, back: false, color: 'light' })];
};
function muzzleFlash(k: Kit, cue: Cue, at: () => [number, number], dt = 0, ang = Math.PI): Clip {
  let g: Graphics | null = null;
  let p: [number, number] = [0, 0];
  return clip(cue.m + dt, 0.12, {
    z: 3,
    mount: () => {
      g = new Graphics();
      k.layers.wfx.addChild(g);
      p = at();
    },
    update: (lt) => {
      if (!g) return;
      const st = Math.floor(lt * 30);
      g.clear();
      const s = [1, 1.25, 0.8, 0.5][Math.min(3, st)];
      const cx = p[0] + Math.cos(ang) * 30 * s;
      const cy = p[1] + Math.sin(ang) * 30 * s;
      g.poly(starPts(cx, cy, 80 * s, 26 * s, 7, ang)).fill(k.pal.ink);
      g.poly(starPts(cx, cy, 66 * s, 22 * s, 7, ang)).fill(0xffe14a);
      g.poly(starPts(cx, cy, 34 * s, 12 * s, 5, ang + 0.3)).fill(0xffffff);
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
}
const broadside: VerbFn = (k, a, cue) => {
  const out: Clip[] = [];
  for (let i = 0; i < 3; i++) {
    const at = () => S(k).world('B', ...S(k).B.muzzle(i));
    const dt = i * 0.05;
    out.push(muzzleFlash(k, cue, at, dt), smoke(k, { ...cue, id: cue.id + i }, at, { dt: dt + 0.04, n: 4, r: 40, dur: 1.2 }));
  }
  out.push(jolt(k, cue, 'B', 0.5, (x) => ({ dx: 22 * (1 - x) ** 2, rot: 0.03 * (1 - x) ** 2 })));
  out.push(...tk('shake', k, { amp: 16, dur: 0.45 }, cue));
  return out;
};
/**
 * A cannonball: from a cannon of `from` to a target, landing exactly at `cue.m + flight`.
 *   to: 'hull0'|'hull1'|'hull2' (our hull; with `prompt` it sticks there fizzing until the prompt is judged) ·
 *       'sea' (splashes beside us) · 'B' (their hull) · 'miss' (sails past behind us)
 */
const ball: VerbFn = (k, a, cue) => {
  const from = a.from === 'A' ? 'A' : 'B';
  const i = Math.round(num(a, 'i', 0));
  const flight = num(a, 'flight', 2) * k.beat;
  const to = String(a.to ?? 'sea');
  const prompt = typeof a.prompt === 'string' ? a.prompt : null;
  const t0 = cue.m - flight;
  const hullI = /^hull(\d)$/.exec(to);
  const target = (): [number, number] => {
    const st = S(k);
    if (hullI) return st.hullSpot(Number(hullI[1]));
    if (to === 'B') return st.world('B', -60 + i * 40, -230);
    if (to === 'miss') return st.world('A', -500, -520 - i * 40);
    const p = st.shipPos('A');
    return [p.x + 380 + i * 60, p.y + 8];
  };
  let g: Graphics | null = null;
  let p0: [number, number] = [0, 0];
  const apex = num(a, 'apex', 260);
  const out: Clip[] = [];
  const stickFor = prompt ? 0.15 : 0;
  out.push(
    clip(t0, flight + stickFor, {
      z: 2,
      mount: () => {
        g = new Graphics();
        k.layers.wfx.addChild(g);
        p0 = from === 'B' ? S(k).world('B', ...S(k).B.muzzle(i)) : S(k).world('A', ...S(k).A.muzzle(i));
      },
      update: (lt) => {
        if (!g) return;
        g.clear();
        const x = Math.min(1, lt / flight);
        if (prompt && lt >= flight) {
          const j = k.judged(prompt);
          if (j && j.r !== 'miss') return; // batted away: the deflect takes the ball
        }
        const p1 = target();
        const pos = (u: number): [number, number] => [p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u - Math.sin(u * Math.PI) * apex];
        const [bx, by] = pos(x);
        // the prompt rides its cannonball (screen point just under it)
        if (prompt && lt < flight + 0.15) {
          const sp = k.cam.toScreen(bx, by);
          k.setAnchor(prompt, [sp[0], sp[1] + 90]);
        }
        // motion smear: 3 trailing ghosts
        for (let s = 3; s >= 1; s--) {
          const [gx, gy] = pos(Math.max(0, x - s * 0.035));
          g.circle(gx, gy, 16 - s * 2).fill({ color: k.pal.light, alpha: 0.5 - s * 0.12 });
        }
        g.circle(bx, by, 21).fill(k.pal.ink);
        g.circle(bx, by, 16).fill(0x2a2440);
        g.circle(bx - 5, by - 6, 5).fill({ color: 0xffffff, alpha: 0.7 });
        if (lt >= flight) {
          // stuck on the hull: the fuse fizzes (cartoon beat before the boom)
          const st = Math.floor(lt * 30);
          g.poly(starPts(bx + 10, by - 22, 12 + (st % 2) * 6, 4, 5, st)).fill(0xffe14a);
        }
      },
      unmount: () => {
        g?.destroy();
        g = null;
      },
    }),
  );
  if (from === 'B' && a.flash !== false) out.push(muzzleFlash(k, { ...cue, m: t0 }, () => S(k).world('B', ...S(k).B.muzzle(i))), smoke(k, { ...cue, m: t0 }, () => S(k).world('B', ...S(k).B.muzzle(i)), { n: 3, r: 34, dur: 0.9 }));
  if (from === 'A' && a.flash !== false) out.push(muzzleFlash(k, { ...cue, m: t0 }, () => S(k).world('A', ...S(k).A.muzzle(i)), 0, 0));
  if (to === 'sea') out.push(...(splash(k, { at: target(), n: 18, dur: 0.9 }, cue) as Clip[]));
  if (to === 'B') out.push(...boom(k, cue, target, 100), splinters(k, cue, target), jolt(k, cue, 'B', 0.4, (x) => ({ rot: -0.04 * (1 - x), dy: 10 * (1 - x), sx: 1 + 0.05 * (1 - x), sy: 1 - 0.06 * (1 - x) })));
  return out;
};

/** Canelo bats the ball back on the beat: a fire smear swing, (great) an impact frame, the ball returns to their hull */
const deflect: VerbFn = (k, a, cue) => {
  const i = Math.round(num(a, 'i', 0));
  const great = a.great !== false;
  const out: Clip[] = [pose(k, cue, 'canelo', great ? 'swing' : 'parry', 0.55)];
  // the fire smear: a crescent sweeping around his paw, on 24 fps for 4 frames
  let g: Graphics | null = null;
  out.push(
    clip(cue.m - 0.02, 0.2, {
      z: 4,
      mount: () => {
        g = new Graphics();
        k.layers.wfx.addChild(g);
      },
      update: (lt) => {
        if (!g) return;
        const st = Math.min(4, Math.floor(lt * 24));
        const [hx, hy] = S(k).head('canelo');
        const cx = hx + 40;
        const cy = hy + 40;
        const r = great ? 170 : 120;
        g.clear();
        const a0 = -2.4 + st * 0.35;
        const a1 = a0 + 2.0;
        const band = (rr: number, w: number, c: number) => {
          const pts: number[] = [];
          for (let j = 0; j <= 14; j++) {
            const t = a0 + ((a1 - a0) * j) / 14;
            const ww = w * Math.sin((j / 14) * Math.PI);
            pts.push(cx + Math.cos(t) * (rr + ww), cy + Math.sin(t) * (rr + ww));
          }
          for (let j = 14; j >= 0; j--) {
            const t = a0 + ((a1 - a0) * j) / 14;
            pts.push(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr);
          }
          g!.poly(pts).fill(c);
        };
        band(r - 10, great ? 70 : 44, k.pal.ink);
        band(r, great ? 54 : 34, 0xff6a1a);
        band(r + 12, great ? 30 : 18, 0xffe14a);
        band(r + 22, 10, 0xffffff);
        g.alpha = st >= 4 ? 0 : 1;
      },
      unmount: () => {
        g?.destroy();
        g = null;
      },
    }),
  );
  // the ball goes back where it came from
  let bg: Graphics | null = null;
  let p0: [number, number] = [0, 0];
  const back = 0.34;
  const upAndAway = !great;
  out.push(
    clip(cue.m, back, {
      z: 2,
      mount: () => {
        bg = new Graphics();
        k.layers.wfx.addChild(bg);
        p0 = S(k).hullSpot(i);
      },
      update: (lt) => {
        if (!bg) return;
        const x = ease('out', lt / back);
        const p1: [number, number] = upAndAway ? [p0[0] + 300, p0[1] - 900] : S(k).world('B', -60 + i * 50, -240);
        const bx = p0[0] + (p1[0] - p0[0]) * x;
        const by = p0[1] + (p1[1] - p0[1]) * x - Math.sin(x * Math.PI) * 80;
        bg.clear();
        // a hot streak behind it
        const tx = p0[0] + (p1[0] - p0[0]) * Math.max(0, x - 0.25);
        const ty = p0[1] + (p1[1] - p0[1]) * Math.max(0, x - 0.25);
        bg.moveTo(tx, ty).lineTo(bx, by).stroke({ width: 22, color: 0xff6a1a, alpha: 0.85 });
        bg.moveTo(tx, ty).lineTo(bx, by).stroke({ width: 8, color: 0xffffff });
        bg.circle(bx, by, 20).fill(k.pal.ink).circle(bx, by, 15).fill(0xff9a3d);
      },
      unmount: () => {
        bg?.destroy();
        bg = null;
      },
    }),
  );
  out.push(...tk('ring', k, { world: true, at: S(k).hullSpot(i), r0: 20, r1: great ? 260 : 160, width: great ? 22 : 14, dur: 0.3 }, cue));
  out.push(...tk('sfx', k, { text: great ? '¡ZAS!' : '¡TOC!', kata: great ? 'バシッ' : 'コン', at: () => { const p = k.stage.anchor?.('canelo', k) ?? [700, 400]; return [p[0] + 260, p[1] - 40] as [number, number]; }, size: great ? 130 : 90, dur: 0.55, rot: -0.12 }, cue));
  if (great) {
    out.push(...tk('impact', k, { dur: 0.07, invert: (cue.id % 2) === 0, at: 'canelo', inner: 260 }, cue));
    out.push(...boom(k, { ...cue, id: cue.id + 9 }, () => S(k).world('B', -60 + i * 50, -240), 110, back));
    out.push(...scarHit(k, { ...cue, id: cue.id + 9 }, 'B', () => S(k).world('B', -60 + i * 50, -110), 28, back));
    out.push(jolt(k, cue, 'B', 0.5, (x) => ({ rot: -0.05 * (1 - x) ** 2, dy: 14 * (1 - x) }), back));
    out.push(...tk('sfx', k, { text: '¡BAM!', kata: 'ドン', at: 'cascada', size: 96, dur: 0.5, rot: 0.1, back: false }, cue, back));
  } else out.push(...tk('punch', k, { z: 0.03, dur: 0.2 }, cue));
  return out;
};
/** a miss: the ball blows up on OUR hull — cartoon bounce, Canelo sees stars */
const hullHit: VerbFn = (k, a, cue) => {
  const i = Math.round(num(a, 'i', 0));
  const at = () => S(k).hullSpot(i);
  const out: Clip[] = [...boom(k, cue, at, 130), ...scarHit(k, cue, 'A', at, 30)];
  out.push(jolt(k, cue, 'A', 0.75, (x) => ({ dy: -Math.abs(Math.sin(x * Math.PI * 2.2)) * 46 * (1 - x), sx: 1 + 0.08 * Math.sin(x * 20) * (1 - x), sy: 1 - 0.1 * Math.sin(x * 20) * (1 - x), rot: 0.06 * Math.sin(x * 14) * (1 - x) })));
  out.push(pose(k, cue, 'canelo', 'dizzy', 1.2));
  out.push(...tk('shake', k, { amp: 14, dur: 0.4 }, cue));
  out.push(...tk('sfx', k, { text: '¡BOOM!', kata: 'ドカン', at: `hull${i}`, size: 100, dur: 0.5, rot: 0.08 }, cue));
  // stars circling his head
  let g: Graphics | null = null;
  out.push(
    clip(cue.m + 0.1, 1.1, {
      z: 4,
      mount: () => {
        g = new Graphics();
        k.layers.wfx.addChild(g);
      },
      update: (lt) => {
        if (!g) return;
        const [hx, hy] = S(k).head('canelo');
        const st = Math.floor(lt * 12) / 12;
        g.clear();
        for (let j = 0; j < 3; j++) {
          const ang = st * 7 + (j * Math.PI * 2) / 3;
          g.poly(starPts(hx + Math.cos(ang) * 70, hy - 90 + Math.sin(ang) * 20, 16, 7, 5, ang)).fill(0xffe14a).stroke({ width: 3, color: INK });
        }
      },
      unmount: () => {
        g?.destroy();
        g = null;
      },
    }),
  );
  return out;
};

// ------------------------------------------------------------------ brace (hold) results at the drop
const brace: VerbFn = (k, a, cue) => {
  const r = String(a.r ?? 'great');
  const out: Clip[] = [];
  if (r === 'miss') {
    out.push(jolt(k, cue, 'A', 1.0, (x) => ({ rot: 0.16 * Math.sin(x * 12) * (1 - x), dy: -60 * Math.abs(Math.sin(x * Math.PI * 2)) * (1 - x) })));
    out.push(pose(k, cue, 'canelo', 'trip', 0.9), pose(k, { ...cue, m: cue.m + 0.9 }, 'canelo', 'dizzy', 0.8));
    out.push(...tk('sfx', k, { text: '¡WAAA!', kata: 'ワー', at: 'canelo', size: 100, dur: 0.7 }, cue));
    return out;
  }
  // the shield: a hex-bubble that flares as the broadside lands on it
  let g: Graphics | null = null;
  const d = 1.1;
  out.push(
    clip(cue.m, d, {
      z: 3,
      mount: () => {
        g = new Graphics();
        k.layers.wfx.addChild(g);
      },
      update: (lt) => {
        if (!g) return;
        const p = S(k).shipPos('A');
        const x = lt / d;
        const s = ease('outBack', Math.min(1, lt / 0.15));
        g.clear();
        const rx = 430 * s;
        const ry = 330 * s;
        const cy = p.y - 220;
        g.ellipse(p.x, cy, rx + 8, ry + 8).stroke({ width: r === 'great' ? 14 : 8, color: k.pal.ink, alpha: 1 - x });
        g.ellipse(p.x, cy, rx, ry).fill({ color: k.pal.accent2, alpha: 0.18 * (1 - x) }).stroke({ width: r === 'great' ? 8 : 4, color: 0xffffff, alpha: 1 - x });
        for (let j = 0; j < 9; j++) {
          const ang = -Math.PI + (j / 8) * Math.PI;
          g.poly(starPts(p.x + Math.cos(ang) * rx * 0.86, cy + Math.sin(ang) * ry * 0.86, 22, 19, 3, 0)).stroke({ width: 3, color: 0xffffff, alpha: 0.6 * (1 - x) });
        }
      },
      unmount: () => {
        g?.destroy();
        g = null;
      },
    }),
  );
  out.push(pose(k, cue, 'canelo', r === 'great' ? 'cool' : 'brace', 1.2));
  for (let j = 0; j < 3; j++) out.push(...tk('burst', k, { world: true, at: S(k).world('A', 300 - j * 40, -380 - j * 60), r: 70, dur: 0.18 }, { ...cue, id: cue.id + j }, 0.06 * j));
  out.push(...tk('sfx', k, { text: r === 'great' ? '¡FIRMES!' : '¡UF!', kata: 'ガード', at: 'shipA', size: 110, dur: 0.7 }, cue));
  return out;
};

// ------------------------------------------------------------------ the break: she recovers
const recover: VerbFn = (k, a, cue) => {
  const d = num(a, 'dur', 2.2);
  return [pose(k, cue, 'cascada', 'recover', d), smoke(k, cue, () => S(k).world('B', -80, -300), { n: 6, r: 50, dur: 2.2, color: lerpColor(0xd8d2e0, k.pal.shadow, 0.25) }), smoke(k, { ...cue, id: cue.id + 1 }, () => S(k).world('B', 160, -230), { n: 4, r: 40, dur: 2, dt: 0.4 })];
};
const posed: VerbFn = (k, a, cue) => [pose(k, cue, String(a.who ?? 'cascada') as Who, String(a.p ?? 'dance'), (typeof a.beats === 'number' ? (a.beats as number) * k.beat : num(a, 'dur', 1)))];
const wink: VerbFn = (k, a, cue) => {
  const p = S(k).head('cascada');
  return [...tk('sparkle', k, { world: true, at: [p[0] - 30, p[1] - 20], n: 3, r: 34, spread: 30, dur: 0.5, color: 'light' }, cue)];
};
const throwConfetti: VerbFn = (k, a, cue) => {
  const p = S(k).world('A', 150, -330);
  return [...tk('confetti', k, { world: true, at: p, vx: 900, vy: -700, spread: 300, n: 34, dur: 1.4, g: 900 }, cue), ...tk('sfx', k, { text: '¡TOMA!', at: [420, 700], size: 80, dur: 0.5, back: false }, cue)];
};
/** the coconut: dropped (bounces on the deck) or tossed (out of frame) */
const coconut: VerbFn = (k, a, cue) => {
  const toss = a.toss === true;
  const d = toss ? 1.4 : 1.3;
  let g: Graphics | null = null;
  return [
    clip(cue.m, d, {
      z: 2,
      mount: () => {
        g = new Graphics();
        k.layers.wfx.addChild(g);
      },
      update: (lt) => {
        if (!g) return;
        const [hx, hy] = S(k).head('cascada');
        const t = Math.floor(lt * 24) / 24;
        let x = hx - 60;
        let y = hy + 10;
        let rot = 0;
        if (toss) {
          x += -700 * t;
          y += -600 * t + 900 * t * t;
          rot = t * 10;
        } else {
          const deck = S(k).world('B', -60, -150)[1] - 30;
          const fall = y + 1400 * t * t;
          y = Math.min(fall, deck - Math.abs(Math.sin(Math.max(0, t - 0.3) * 9)) * 70 * Math.max(0, 1 - t));
          x += 80 * t;
          rot = t * 5;
        }
        g.clear();
        g.circle(x, y, 32).fill(k.pal.ink).circle(x, y, 26).fill(0x7a4a2a).ellipse(x + Math.cos(rot) * 8, y - 14, 16, 6).fill(0xfff1e0);
        g.moveTo(x, y - 14).lineTo(x + Math.cos(rot - 1) * 40, y - 14 + Math.sin(rot - 1) * 40).stroke({ width: 5, color: 0x2fd4e0 });
      },
      unmount: () => {
        g?.destroy();
        g = null;
      },
    }),
    ...(toss ? [] : tk('sfx', k, { text: 'BONK', kata: 'ポコッ', at: 'cascada', size: 70, dur: 0.4, back: false }, cue, 0.32)),
  ];
};

// ------------------------------------------------------------------ the sky chase
/** puffs off the propellers while the balloon fills */
const kitPuffs: VerbFn = (k, a, cue) => [smoke(k, cue, () => S(k).world('A', -330, -80), { n: 5, r: 38, dur: num(a, 'dur', 1.6), color: k.pal.light })];
/** fireballs from our ship (mash result): n of them, staggered 1/8 beat, all hitting their hull */
const volley: VerbFn = (k, a, cue) => {
  const n = Math.max(1, Math.round(num(a, 'n', 5)));
  const out: Clip[] = [];
  const step = k.beat / 4;
  for (let j = 0; j < n; j++) {
    const m0 = cue.m + j * step;
    const fly = 0.38;
    let g: Graphics | null = null;
    let p0: [number, number] = [0, 0];
    const R = rng(cue.id * 31 + j);
    const off = (R() - 0.5) * 160;
    out.push(
      clip(m0, fly, {
        z: 3,
        mount: () => {
          g = new Graphics();
          k.layers.wfx.addChild(g);
          p0 = S(k).world('A', ...S(k).A.muzzle(j % 2));
        },
        update: (lt) => {
          if (!g) return;
          const x = lt / fly;
          const p1 = S(k).world('B', -40 + off, a.weak ? -40 : -120 + off * 0.3);
          const fx = p0[0] + (p1[0] - p0[0]) * x;
          const fy = p0[1] + (p1[1] - p0[1]) * x - Math.sin(x * Math.PI) * 60;
          const ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
          g.clear();
          // a Promare-ish flame: stacked triangles, longest behind
          const s = a.big ? 1.3 : a.weak ? 0.7 : 1;
          const tri = (len: number, w: number, c: number) => {
            const bx = fx - Math.cos(ang) * len;
            const by = fy - Math.sin(ang) * len;
            g!.poly([fx + Math.cos(ang) * 22 * s, fy + Math.sin(ang) * 22 * s, bx - Math.sin(ang) * w, by + Math.cos(ang) * w, bx + Math.sin(ang) * w, by - Math.cos(ang) * w]).fill(c);
          };
          tri(170 * s, 34 * s, k.pal.ink);
          tri(150 * s, 26 * s, 0xff3d7f);
          tri(110 * s, 18 * s, 0xff8a1f);
          tri(60 * s, 10 * s, 0xffe14a);
          g.circle(fx, fy, 14 * s).fill(0xffffff);
        },
        unmount: () => {
          g?.destroy();
          g = null;
        },
      }),
    );
    out.push(...boom(k, { ...cue, id: cue.id + j * 7 }, () => S(k).world('B', -40 + off, a.weak ? -40 : -120 + off * 0.3), a.weak ? 60 : 105, j * step + fly));
    if (j % 2 === 0 && !a.weak) out.push(...scarHit(k, { ...cue, id: cue.id + j * 7 }, 'B', () => S(k).world('B', -40 + off, -100), 24, j * step + fly));
  }
  out.push(jolt(k, cue, 'B', n * step + 0.8, (x) => ({ dy: 10 * Math.sin(x * 30) * (1 - x), rot: 0.02 * Math.sin(x * 24) * (1 - x) }), 0.38));
  out.push(...tk('shake', k, { amp: a.big ? 20 : 10, dur: n * step + 0.5 }, cue, 0.38));
  return out;
};
/** the choice: bank up through a cloud (left) or dive under her hull (right) */
const dodge: VerbFn = (k, a, cue) => {
  const up = a.side !== 'right';
  const d = num(a, 'dur', 1.8);
  const out: Clip[] = [jolt(k, cue, 'A', d, (x) => ({ dy: (up ? -1 : 1) * 260 * Math.sin(x * Math.PI), rot: (up ? -0.18 : 0.18) * Math.sin(x * Math.PI * 2) }))];
  out.push(...tk('speed', k, { dur: d * 0.7, ang: up ? -0.5 : 0.5, n: 60, alpha: 0.7, color: 'light' }, cue));
  out.push(smoke(k, cue, () => S(k).world('A', 0, up ? -560 : 60), { n: 9, r: 90, dur: 1.4, color: 0xffffff, dt: d * 0.35 }));
  out.push(...tk('sfx', k, { text: up ? '¡ARRIBA!' : '¡ABAJO!', kata: up ? 'ウエ' : 'シタ', at: 'shipA', size: 90, dur: 0.6 }, cue, d * 0.3));
  return out;
};

// ------------------------------------------------------------------ the finale
/** Canelo leaps across on a fire trail and lands on their deck */
const leap: VerbFn = (k, a, cue) => {
  const power = num(a, 'power', 1);
  const clumsy = !!a.clumsy;
  const back = !!a.back;
  const d = 0.75;
  const out: Clip[] = [];
  let p0: [number, number] = [0, 0];
  let trail: Graphics | null = null;
  const posAt = (x: number): [number, number] => {
    const p1 = back ? S(k).world('A', 150, -150) : S(k).world('B', 20, -150);
    return [p0[0] + (p1[0] - p0[0]) * x, p0[1] + (p1[1] - p0[1]) * x - Math.sin(x * Math.PI) * 420 * power];
  };
  out.push(
    clip(cue.m, d, {
      z: 3,
      mount: () => {
        p0 = back ? S(k).world('B', 20, -150) : S(k).world('A', 150, -150);
        trail = new Graphics();
        k.layers.wfx.addChildAt(trail, 0);
      },
      update: (lt) => {
        const x = ease('inOut', lt / d);
        const [fx, fy] = posAt(x);
        S(k).wantPose('fly', { name: 'fly', lt, x: fx, y: fy, rot: (x - 0.5) * 0.9, s: 1 + 0.15 * Math.sin(x * Math.PI) });
        if (!trail) return;
        trail.clear();
        // the fire trail: segments behind him, fattest near him
        for (let j = 1; j <= 10; j++) {
          const u = Math.max(0, x - j * 0.035);
          const [tx, ty] = posAt(u);
          const r = (36 - j * 3) * power;
          if (r <= 2) continue;
          trail.circle(tx, ty - 100, r + 6).fill(k.pal.ink);
          trail.circle(tx, ty - 100, r).fill(j < 4 ? 0xffe14a : j < 7 ? 0xff8a1f : 0xff3d7f);
        }
      },
      unmount: () => {
        trail?.destroy();
        trail = null;
      },
    }),
  );
  // the landing (back home: the deck Canelo stands on again)
  if (!back) out.push(clip(cue.m + d, 0.6, { update: (lt) => S(k).wantPose('fly', { name: clumsy ? 'splat' : 'land', lt, x: S(k).world('B', 20, -150)[0], y: S(k).world('B', 20, -150)[1] }) }));
  else out.push(clip(cue.m + d, 0.4, { update: (lt) => S(k).wantPose('canelo', { name: 'land', lt }) }));
  out.push(jolt(k, cue, back ? 'A' : 'B', 0.5, (x) => ({ dy: 22 * (1 - x), sy: 1 - 0.05 * (1 - x) }), d));
  out.push(...tk('ring', k, { world: true, at: back ? S(k).world('A', 150, -160) : S(k).world('B', 20, -160), r0: 30, r1: 360, width: 20, dur: 0.4 }, cue, d));
  if (!back) out.push(...tk('sfx', k, { text: clumsy ? '¡PLAF!' : '¡AQUÍ ESTOY!', kata: clumsy ? 'ベチャ' : 'ドン', at: 'cascada', size: clumsy ? 90 : 84, dur: 0.6 }, cue, d));
  out.push(...tk('speed', k, { dur: d, ang: -0.35, n: 70, alpha: 0.8, color: 'light' }, cue));
  if (power >= 1) out.push(...tk('impact', k, { dur: 0.07, at: 'cascada' }, cue, d));
  return out;
};
/** the cartoon fight cloud on their deck (both of them inside it) */
const fightCloud: VerbFn = (k, a, cue) => {
  const d = (typeof a.beats === 'number' ? (a.beats as number) * k.beat : num(a, 'dur', 10));
  let g: Graphics | null = null;
  const R = rng(cue.id + 3);
  const puffs = Array.from({ length: 11 }, (_, i) => ({ a: (i / 11) * Math.PI * 2, r: 150 + R() * 70, s: 70 + R() * 50 }));
  const bits = ['★', '!', '#', '@', '?'];
  return [
    clip(cue.m, d, {
      update: (lt) => {
        S(k).wantPose('cascada', { name: 'hidden', lt });
        const [cx, cy] = S(k).cloudPos();
        S(k).wantPose('fly', { name: 'hidden', lt, x: cx, y: cy });
      },
    }),
    clip(cue.m, d, {
      z: 3,
      mount: () => {
        g = new Graphics();
        k.layers.wfx.addChild(g);
      },
      update: (lt) => {
        if (!g) return;
        const st = Math.floor(lt * 12);
        const [cx, cy] = S(k).cloudPos();
        g.clear();
        const grow = ease('outBack', Math.min(1, lt / 0.2)) * (lt > d - 0.2 ? Math.max(0, (d - lt) / 0.2) : 1);
        for (const p of puffs) {
          const j = ((st * 7 + p.a * 10) % 3) - 1;
          const x = cx + Math.cos(p.a) * p.r * 0.8 * grow + j * 8;
          const y = cy + Math.sin(p.a) * p.r * 0.5 * grow;
          g.circle(x, y, p.s * grow + 7).fill(k.pal.ink);
        }
        for (const p of puffs) {
          const j = ((st * 7 + p.a * 10) % 3) - 1;
          const x = cx + Math.cos(p.a) * p.r * 0.8 * grow + j * 8;
          const y = cy + Math.sin(p.a) * p.r * 0.5 * grow;
          g.circle(x, y, p.s * grow).fill(lerpColor(k.pal.light, k.pal.base, 0.15));
          g.circle(x + p.s * 0.2, y + p.s * 0.25, p.s * 0.6 * grow).fill(lerpColor(k.pal.light, k.pal.shadow, 0.35));
        }
        // a paw / a tail / stars poking out, changing every other frame
        const Rs = rng(st);
        for (let i = 0; i < 3; i++) {
          const ang = Rs() * Math.PI * 2;
          const x = cx + Math.cos(ang) * 230 * grow;
          const y = cy + Math.sin(ang) * 130 * grow;
          g.poly(starPts(x, y, 20, 8, 5, Rs())).fill(0xffe14a).stroke({ width: 3, color: INK });
        }
        void bits;
      },
      unmount: () => {
        g?.destroy();
        g = null;
      },
    }),
  ];
};
/** a punch out of the cloud: win → toward her side with an impact; lose → a bonk on Canelo's side */
const clash: VerbFn = (k, a, cue) => {
  const win = a.win !== false;
  const small = !!a.small;
  const dir = win ? 1 : -1;
  const d = 0.32;
  let g: Graphics | null = null;
  const out: Clip[] = [
    clip(cue.m, d, {
      z: 4,
      mount: () => {
        g = new Graphics();
        k.layers.wfx.addChild(g);
      },
      update: (lt) => {
        if (!g) return;
        const [cx, cy] = S(k).cloudPos();
        const st = Math.min(3, Math.floor(lt * 24));
        const reach = [120, 230, 250, 240][st] * (small ? 0.8 : 1);
        const x = cx + dir * reach;
        const y = cy - 30 + (cue.id % 3) * 30 - 30;
        g.clear();
        // the arm (a fat stroke) + a mitten paw
        g.moveTo(cx + dir * 60, y + 10).lineTo(x, y).stroke({ width: 46, color: k.pal.ink });
        g.moveTo(cx + dir * 60, y + 10).lineTo(x, y).stroke({ width: 32, color: win ? 0xff8a1f : 0x8fb7e8 });
        g.circle(x + dir * 18, y, 44).fill(k.pal.ink).circle(x + dir * 18, y, 36).fill(win ? 0xffb05a : 0xbcd6ff);
        for (let j = -1; j <= 1; j++) g.moveTo(x + dir * 30, y + j * 14).lineTo(x + dir * 48, y + j * 14).stroke({ width: 4, color: INK });
        g.alpha = lt > d - 0.08 ? (d - lt) / 0.08 : 1;
      },
      unmount: () => {
        g?.destroy();
        g = null;
      },
    }),
  ];
  const hitAt = (): [number, number] => {
    const [cx, cy] = S(k).cloudPos();
    return [cx + dir * 290, cy - 30];
  };
  out.push(...tk('burst', k, { world: true, at: hitAt(), r: small ? 80 : 120, dur: 0.2 }, cue, 0.06));
  out.push(...tk('sfx', k, { text: win ? '¡POW!' : '¡BONK!', kata: win ? 'バン' : 'ゴン', at: () => k.cam.toScreen(...hitAt()).map((v, i) => v + (i ? -90 : dir * 40)) as [number, number], size: small ? 90 : 120, dur: 0.45, rot: win ? -0.1 : 0.12 }, cue, 0.04));
  if (win && !small) out.push(...tk('impact', k, { dur: 0.06, invert: cue.id % 2 === 1, at: 'cloud', inner: 220 }, cue, 0.05));
  out.push(...tk('shake', k, { amp: win ? 14 : 8, dur: 0.3 }, cue, 0.05));
  return out;
};
/** back to back on her deck, the party at full blast */
const finale: VerbFn = (k, a, cue) => {
  const d = (typeof a.beats === 'number' ? (a.beats as number) * k.beat : num(a, 'dur', 4));
  return [
    clip(cue.m, d, {
      update: (lt) => {
        const [x, y] = S(k).world('B', 70, -150);
        S(k).wantPose('fly', { name: 'hero', lt, x, y, s: 1.05 });
        S(k).wantPose('cascada', { name: 'hero', lt });
      },
    }),
    ...tk('confetti', k, { world: true, at: S(k).world('B', 0, -700), vy: -200, spread: 1400, n: 80, dur: d, g: 500 }, cue),
    ...tk('sparkle', k, { at: 'cascada', n: 8, r: 34, spread: 260, dur: 1.2 }, cue),
  ];
};
/** the cosmetic rhythm grade, stamped in a corner during the final pose */
const gradeStamp: VerbFn = (k, a, cue) => {
  const d = num(a, 'dur', 2.2);
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
      const g = pct >= 0.92 ? 'S' : pct >= 0.75 ? 'A' : pct >= 0.5 ? 'B' : 'C';
      c = new Container();
      const slab = new Graphics().poly([-150, -100, 170, -120, 150, 110, -170, 100]).fill(k.pal.ink).poly([-138, -88, 158, -106, 138, 98, -156, 88]).fill(k.pal.accent);
      const big = k.text.sprite(g, { fontFamily: 'Anton', fontSize: 170, fill: 0xffffff, stroke: { color: k.pal.ink, width: 14 } });
      big.position.set(40, 0);
      const lab = k.text.sprite('RITMO', { fontFamily: 'Anton', fontSize: 44, fill: k.pal.ink, letterSpacing: 4 });
      lab.position.set(-80, -10);
      lab.rotation = -Math.PI / 2;
      const kt = k.text.sprite('リズム', { fontFamily: 'Dela Gothic One', fontSize: 30, fill: 0xffffff, stroke: { color: k.pal.ink, width: 6 } });
      kt.position.set(110, -110);
      c.addChild(slab, big, lab, kt);
      c.rotation = -0.08;
      k.layers.ui.addChild(c);
    },
    update: (lt) => {
      if (!c) return;
      const v = k.view;
      c.position.set(v.x + v.w - 250, v.y + v.h - 210);
      const st = Math.floor(lt * 12);
      c.scale.set(st === 0 ? 1.6 : st === 1 ? 0.9 : 1);
      c.alpha = lt > d - 0.2 ? Math.max(0, (d - lt) / 0.2) : 1;
    },
    unmount: () => {
      c?.destroy({ children: true });
      c = null;
    },
  });
};
/** the speakers blast: sound-wave rings + notes */
const blast: VerbFn = (k, a, cue) => {
  const out: Clip[] = [];
  for (const sx of [-262, 256]) {
    const p = S(k).world('B', sx, -215);
    for (let j = 0; j < 3; j++) out.push(...tk('ring', k, { world: true, at: p, r0: 30, r1: 520, width: 24, dur: 0.5, color: 'accent', color2: 'accent2' }, { ...cue, id: cue.id + sx + j }, j * 0.08));
  }
  out.push(...tk('notes', k, { world: true, at: S(k).world('B', 0, -320), n: 8, dur: 1.2 }, cue));
  out.push(...tk('shake', k, { amp: 18, dur: 0.5 }, cue));
  return out;
};

/**
 * The live charge while a HOLD / MASH prompt is being played: Canelo braces and an aura grows with what the player
 * is doing right now (held fraction / taps) — the input shows on screen before its result does.
 */
const charge: VerbFn = (k, a, cue) => {
  const id = String(a.prompt ?? '');
  const d = typeof a.beats === 'number' ? (a.beats as number) * k.beat : num(a, 'dur', 4);
  const fire = a.look !== 'shield';
  let g: Graphics | null = null;
  return clip(cue.m, d, {
    z: 2,
    mount: () => {
      g = new Graphics();
      k.layers.wfx.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      g.clear();
      const st = k.prompt(id);
      if (!st) return;
      let amt = 0;
      if (st.p.type === 'mash') amt = Math.min(1, st.taps / (st.p.spec.need?.[1] ?? 12));
      else if (st.from !== undefined && st.to === undefined && !st.done) amt = Math.min(1, (k.m - st.from) / Math.max(0.2, st.p.mEnd - st.from));
      else if (st.done && st.result !== 'miss') amt = Math.max(0, 1 - (k.m - st.p.mEnd) / 0.3);
      if (amt <= 0.01) return;
      S(k).wantPose('canelo', { name: 'brace', lt });
      const [hx, hy] = S(k).head('canelo');
      const cy = hy + 60;
      const step = Math.floor(k.m * 12);
      const n = 12;
      const R = 120 + 90 * amt;
      if (fire) {
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * Math.PI * 2 + step * 0.21;
          const L = (60 + 80 * amt) * (0.7 + 0.3 * ((i + step) % 3) / 2);
          const bx = hx + Math.cos(ang) * R * 0.6;
          const by = cy + Math.sin(ang) * R * 0.75;
          const tx = bx + Math.cos(ang - 0.5) * L;
          const ty = by + Math.sin(ang - 0.5) * L - 30;
          g.poly([bx - Math.sin(ang) * 16, by + Math.cos(ang) * 16, tx, ty, bx + Math.sin(ang) * 16, by - Math.cos(ang) * 16]).fill(i % 3 === 0 ? 0xffe14a : i % 3 === 1 ? 0xff8a1f : 0xff3d7f);
        }
      } else {
        g.ellipse(hx, cy, R * 1.3, R).stroke({ width: 10 + 10 * amt, color: k.pal.ink, alpha: 0.8 });
        g.ellipse(hx, cy, R * 1.3, R).stroke({ width: 4 + 6 * amt, color: 0xffffff });
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2 + step * 0.1;
          g.poly(starPts(hx + Math.cos(ang) * R * 1.3, cy + Math.sin(ang) * R, 14, 12, 6, 0)).fill({ color: k.pal.accent2, alpha: 0.7 });
        }
      }
      k.cam.shake(3 + 7 * amt, k.m, 5, 30);
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};

/** the disco ball turns into a cannon: it swells, beams converge into it, and it fires a beam at us (guarded flash) */
const discoCharge: VerbFn = (k, a, cue) => {
  const d = typeof a.beats === 'number' ? (a.beats as number) * k.beat : num(a, 'dur', 3);
  let g: Graphics | null = null;
  const out: Clip[] = [
    clip(cue.m, d + 0.35, {
      z: 3,
      mount: () => {
        g = new Graphics();
        k.layers.wfx.addChild(g);
      },
      update: (lt) => {
        if (!g) return;
        const [cx, cy] = S(k).world('B', 23, -640);
        const x = Math.min(1, lt / d);
        const r = 26 + 70 * ease('in', x);
        const st = Math.floor(lt * 12);
        g.clear();
        // converging beams
        if (lt < d) {
          for (let i = 0; i < 10; i++) {
            const ang = (i / 10) * Math.PI * 2 + st * 0.2;
            const L = 900 * (1 - x) + r;
            g.moveTo(cx + Math.cos(ang) * L, cy + Math.sin(ang) * L).lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r).stroke({ width: 6 + 10 * x, color: i % 2 ? k.pal.accent : k.pal.accent2, alpha: 0.35 + 0.5 * x });
          }
        } else {
          // the shot: a fat beam toward our ship
          const [tx, ty] = S(k).world('A', 120, -260);
          const w = 70 * (1 - (lt - d) / 0.35);
          const ang = Math.atan2(ty - cy, tx - cx);
          const nx = -Math.sin(ang);
          const ny = Math.cos(ang);
          g.poly([cx + nx * w, cy + ny * w, tx + nx * w * 0.6, ty + ny * w * 0.6, tx - nx * w * 0.6, ty - ny * w * 0.6, cx - nx * w, cy - ny * w]).fill({ color: k.pal.accent, alpha: 0.85 });
          g.poly([cx + nx * w * 0.4, cy + ny * w * 0.4, tx + nx * w * 0.25, ty + ny * w * 0.25, tx - nx * w * 0.25, ty - ny * w * 0.25, cx - nx * w * 0.4, cy - ny * w * 0.4]).fill(0xffffff);
        }
        // the ball itself: mirror tiles + a glare
        g.circle(cx, cy, r + 8).fill(k.pal.ink).circle(cx, cy, r).fill(0xdfe9ff);
        for (let j = -3; j <= 3; j++) g.moveTo(cx - r, cy + (j * r) / 4).lineTo(cx + r, cy + (j * r) / 4).stroke({ width: 2, color: 0x7f86b8 });
        for (let j = -3; j <= 3; j++) g.moveTo(cx + (j * r) / 4, cy - r).lineTo(cx + (j * r) / 4, cy + r).stroke({ width: 2, color: 0x7f86b8 });
        g.poly(starPts(cx - r * 0.35, cy - r * 0.35, r * 0.5, r * 0.1, 4, st * 0.3)).fill(0xffffff);
      },
      unmount: () => {
        g?.destroy();
        g = null;
      },
    }),
  ];
  out.push(...tk('flash', k, { amount: 0.5, color: 'accent', dur: 0.2 }, cue, d));
  out.push(...tk('shake', k, { amp: 22, dur: 0.5 }, cue, d));
  return out;
};
/** our counterattack: a fireball launched ON the beat from our cannons, landing on their hull (or fizzling) */
const counter: VerbFn = (k, a, cue) => {
  const r = String(a.r ?? 'great');
  const fly = 0.3;
  let g: Graphics | null = null;
  let p0: [number, number] = [0, 0];
  const R = rng(cue.id + 5);
  const off = (R() - 0.5) * 140;
  const tgt = (): [number, number] => (r === 'miss' ? [p0[0] + 520, S(k).shipPos('A').y + 400] : S(k).world('B', -60 + off, -150));
  const out: Clip[] = [
    clip(cue.m, fly, {
      z: 3,
      mount: () => {
        g = new Graphics();
        k.layers.wfx.addChild(g);
        p0 = S(k).world('A', ...S(k).A.muzzle(cue.id % 2));
      },
      update: (lt) => {
        if (!g) return;
        const x = lt / fly;
        const p1 = tgt();
        const fx = p0[0] + (p1[0] - p0[0]) * x;
        const fy = p0[1] + (p1[1] - p0[1]) * x - Math.sin(x * Math.PI) * 80;
        const ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
        const sc = r === 'great' ? 1.3 : r === 'hit' ? 1 : 0.6;
        g.clear();
        for (const [L, w, c] of [
          [170, 34, k.pal.ink],
          [150, 26, 0xff3d7f],
          [110, 18, 0xff8a1f],
          [60, 10, 0xffe14a],
        ] as const) {
          const bx = fx - Math.cos(ang) * L * sc;
          const by = fy - Math.sin(ang) * L * sc;
          g.poly([fx + Math.cos(ang) * 22 * sc, fy + Math.sin(ang) * 22 * sc, bx - Math.sin(ang) * w * sc, by + Math.cos(ang) * w * sc, bx + Math.sin(ang) * w * sc, by - Math.cos(ang) * w * sc]).fill(c);
        }
        g.circle(fx, fy, 14 * sc).fill(0xffffff);
      },
      unmount: () => {
        g?.destroy();
        g = null;
      },
    }),
    muzzleFlash(k, cue, () => p0, 0, 0),
  ];
  if (r !== 'miss') {
    out.push(...boom(k, { ...cue, id: cue.id + 3 }, tgt, r === 'great' ? 125 : 90, fly));
    out.push(...scarHit(k, { ...cue, id: cue.id + 3 }, 'B', () => S(k).world('B', -60 + off, -110), r === 'great' ? 30 : 22, fly));
  } else out.push(...tk('sfx', k, { text: '¿…?', at: 'shipA', size: 70, dur: 0.5, back: false }, cue, fly));
  return out;
};
/** fireworks over the sky (world space): rockets up, then rings of rays in the palette — closed form */
const fireworks: VerbFn = (k, a, cue) => {
  const n = Math.max(1, Math.round(num(a, 'n', 5) * k.density));
  const d = num(a, 'dur', 1.6);
  const R = rng(cue.id * 7 + 1);
  const cx = num(a, 'x', 960);
  const fw = Array.from({ length: n }, (_, i) => ({ x: cx + (R() - 0.5) * 1600, y: -200 - R() * 700, t0: (i / n) * d * 0.4, c: [k.pal.accent, k.pal.accent2, 0xffe14a, 0xffffff][i % 4], rays: 10 + Math.floor(R() * 6) }));
  let g: Graphics | null = null;
  return clip(cue.m, d, {
    z: 2,
    mount: () => {
      g = new Graphics();
      k.layers.wfx.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      g.clear();
      const base = S(k).shipPos('B').y;
      for (const f of fw) {
        const t = lt - f.t0;
        if (t < 0) continue;
        const up = 0.35;
        if (t < up) {
          const y = base - 100 + (f.y - (base - 100)) * (t / up);
          g.moveTo(f.x, y).lineTo(f.x, y + 60).stroke({ width: 5, color: 0xffe14a });
          continue;
        }
        const x = (t - up) / (d - f.t0 - up);
        if (x > 1) continue;
        const rr = 40 + 220 * ease('out', x);
        for (let j = 0; j < f.rays; j++) {
          const ang = (j / f.rays) * Math.PI * 2;
          const r0 = rr * 0.55;
          g.moveTo(f.x + Math.cos(ang) * r0, f.y + Math.sin(ang) * r0 + x * 40).lineTo(f.x + Math.cos(ang) * rr, f.y + Math.sin(ang) * rr + x * 60).stroke({ width: 7 * (1 - x) + 1, color: f.c, alpha: 1 - x * 0.7 });
          g.poly(starPts(f.x + Math.cos(ang) * rr, f.y + Math.sin(ang) * rr + x * 60, 10 * (1 - x) + 2, 3, 4, ang)).fill(0xffffff);
        }
      }
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};

export const LIKY_VERBS: Record<string, VerbFn> = {
  discoCharge,
  counter,
  fireworks,
  charge,
  coldCut,
  lightUp,
  fiesta,
  splash,
  cannonSwing,
  broadside,
  ball,
  deflect,
  hullHit,
  brace,
  recover,
  pose: posed,
  wink,
  throwConfetti,
  coconut,
  kitPuffs,
  volley,
  dodge,
  leap,
  fightCloud,
  clash,
  finale,
  grade: gradeStamp,
  blast,
};
