/**
 * te ODIO — the set's verbs (in the world: ships, actors, paint, the hand, the rifts) + this Momento's TYPE and FRAME
 * verbs (it never uses the toolkit's NEÓN CEL onomatopoeia, cut-ins or impact frames):
 *
 *  tag        a word in this Momento's lettering: a sprayed TAG, a STENCIL word, a COMIC caption, a GLITCH word
 *  slam       the stencil impact: the whole frame slammed into 3 sprayed tones (guarded like an impact frame)
 *  glitch     a burst of broken signal (datamosh, tracking, chroma, snow)
 *  pow        a comic starburst balloon (the box's own onomatopoeia)
 *  spray      an overspray cloud · pose · wallTag / gridBreak / gridFix (score markers the stage reads, + their FX)
 *  bomb · bat · splatHit          the paint-can barrage (verse)
 *  neonTag · shield               Grafitera's NEON TAG! against Luzterna's lantern (hold)
 *  leapOver · clash · dodge · shove   Brecha boards us (verse2)
 *  handDraw · eraseTag · boxClose · crowbar   the hand that draws the boxes (chorus3 → climax)
 *  riftShot · riftRing            the rifts (drop): a shot that enters one comes out of the other, the other side's
 *  grade      the rhythm grade, sprayed
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { Args, Cue } from '../../types';
import { clip, W, H, type Clip, type Kit, type VerbFn } from '../../anime/kit';
import { ease } from '../../score';
import { rng } from '../../anime/draw';
import { palCol, posOf, durOf } from '../../anime/fx';
import { safeFlashColor } from '../../flash';
import { COMIC_INK, FLUO, INK, PRINT, WALL, drips, splat, sprayLine, starburst, type WordKind } from './spray';
import { drawHand } from './art';
import type { TeStage, Who } from './stage';

export const S = (k: Kit) => k.stage as unknown as TeStage;
/** a stable 1..97 seed from a word (pre-baked branch words must hit the same cache key when they fire) */
export const textSeed = (t: string) => ([...t].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7) >>> 0) % 97 + 1;
export const num = (a: Args, key: string, d: number) => (typeof a[key] === 'number' && Number.isFinite(a[key] as number) ? (a[key] as number) : d);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
/** verbs → one clip list */
export const flatC = (...xs: (Clip | Clip[] | void | null)[]): Clip[] => xs.flatMap((x) => (x ? (Array.isArray(x) ? x : [x]) : []));
const st12 = (t: number) => Math.floor(t * 12) / 12;

// ------------------------------------------------------------------ type
/**
 * TAG: a baked word (SprayBook) that sprays in on twos (scale 1.15 → 1, a puff of overspray), holds with a slight
 * jitter, and either drips away or gets torn off. `reveal`: letters appear one by one over `reveal` seconds.
 */
const tag: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 0.9);
  const text = String(a.text ?? '¡PSST!');
  const kind = (a.kind as WordKind) ?? 'tag';
  const size = num(a, 'size', 120);
  const p = k.palFor(cue);
  const color = typeof a.color === 'number' ? (a.color as number) : (p[(a.color as 'accent') ?? 'accent'] as number);
  const halo = typeof a.halo === 'number' ? (a.halo as number) : color;
  const ink = typeof a.ink === 'number' ? (a.ink as number) : kind === 'comic' ? COMIC_INK : INK;
  // a branch word's seed can't depend on the cue id (the dry run that pre-bakes it has id −1, the judged cue another):
  // a seed from the text keeps the pre-baked texture a cache hit on the very frame the hit lands
  const o = { kind, size, color, ink, halo, seed: cue.source === 'branch' || cue.id <= 0 ? textSeed(text) : (cue.id % 97) + 1 };
  const book = S(k).book;
  const reveal = num(a, 'reveal', 0);
  // bake now (score cues: at build; branches: in the dry run)
  const letters = reveal > 0 ? [...text] : [];
  if (reveal > 0) letters.forEach((_, i) => book.get(text.slice(0, i + 1), o));
  else book.get(text, o);
  let c: Container | null = null;
  let sp: Sprite | null = null;
  let lastN = -1;
  return clip(cue.m, d, {
    z: 6,
    mount: () => {
      c = new Container();
      sp = book.sprite(reveal > 0 ? text.slice(0, 1) : text, o, reveal > 0 ? 0 : 0.5, 0.5);
      c.addChild(sp);
      c.rotation = num(a, 'rot', kind === 'stencil' ? 0 : -0.06);
      (a.layer === 'panels' ? k.layers.panels : k.layers.type).addChild(c);
      if (a.layer === 'panels') c.zIndex = 12;
    },
    update: (lt) => {
      if (!c || !sp) return;
      let [x, y] = posOf(k, a);
      const sc = num(a, 'scatter', 0);
      if (sc > 0) {
        const R = rng(cue.id * 7 + 11);
        x += (R() - 0.5) * 2 * sc;
        y += (R() - 0.5) * sc;
      }
      if (reveal > 0) {
        const n = Math.min(letters.length, 1 + Math.floor((lt / reveal) * letters.length));
        if (n !== lastN) {
          lastN = n;
          sp.texture = book.get(text.slice(0, n), o);
        }
        // anchor the full word's centre: the first letters sit where they will be
        const full = book.get(text, o);
        sp.position.set(-full.width / 2, 0);
      }
      const s = lt < 1 / 12 ? 1.15 : lt < 2 / 12 ? 0.97 : 1;
      const out = num(a, 'out', 0.12);
      const gone = lt > d - out ? (lt - (d - out)) / out : 0;
      const jit = !k.reduceMotion && st12(lt) * 12 > 2 ? ((Math.floor(lt * 12) % 2) - 0.5) * 2 : 0;
      c.position.set(x + jit, y + gone * 30);
      c.scale.set(s * num(a, 'scale', 1));
      c.alpha = 1 - gone;
    },
    unmount: () => {
      c?.destroy({ children: true });
      c = sp = null;
    },
  });
};

/** STENCIL SLAM: the whole frame into 3 sprayed tones for a few frames (guarded: counts as an impact frame) */
const slam: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 0.1);
  let grant: 'full' | 'soft' | 'none' = 'soft';
  const p = k.palFor(cue);
  const mid = safeFlashColor(typeof a.mid === 'number' ? (a.mid as number) : (p[(a.color as 'accent') ?? 'accent'] as number));
  return clip(cue.m, d, {
    mount: () => (grant = k.guard.request(cue.m, 'impact')),
    update: (lt) => {
      const sig = S(k).signal;
      if (grant === 'full') {
        sig.set3('uStMid', mid);
        sig.set3('uStPaper', typeof a.paper === 'number' ? (a.paper as number) : WALL);
        sig.max({ stencil: 1 });
      } else sig.max({ rgb: 2, block: 0.08 });
      k.cam.punch(0.04 * Math.max(0, 1 - lt / (d + 0.1)));
    },
  });
};

/** a burst of BROKEN SIGNAL */
const glitch: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 0.3);
  const amt = num(a, 'amount', 1);
  return clip(cue.m, d, {
    update: (lt) => {
      const x = Math.max(0, 1 - lt / d);
      const e = amt * (a.hold ? 1 : x);
      S(k).signal.max({ block: num(a, 'block', 0.6) * e, rgb: num(a, 'rgb', 4) * e, track: num(a, 'track', 0.5) * e, trackY: num(a, 'trackY', 0.3 + 0.4 * ((cue.id * 0.37) % 1)), noise: num(a, 'noise', 0.2) * e, tear: num(a, 'tear', 0.3) * e, scan: num(a, 'scan', 0.4) * e, blockPx: num(a, 'blockPx', 56) });
    },
  });
};

/** a comic starburst balloon with a word in it (the box's onomatopoeia: clean, black-lined, Bangers) */
const pow: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 0.6);
  const text = String(a.text ?? 'POW!');
  const size = num(a, 'size', 90);
  const fill = typeof a.fill === 'number' ? (a.fill as number) : PRINT.yellow;
  const book = S(k).book;
  const wo = { kind: 'comic' as WordKind, size, color: typeof a.color === 'number' ? (a.color as number) : PRINT.red, ink: COMIC_INK, seed: 3 };
  book.get(text, wo);
  let c: Container | null = null;
  let g: Graphics | null = null;
  let last = -1;
  return clip(cue.m, d, {
    z: 6,
    mount: () => {
      c = new Container();
      g = new Graphics();
      const sp = book.sprite(text, wo);
      sp.rotation = -0.08;
      c.addChild(g, sp);
      k.layers.type.addChild(c);
    },
    update: (lt) => {
      if (!c || !g) return;
      const [x, y] = posOf(k, a);
      const st = Math.floor(lt * 12);
      if (st !== last) {
        last = st;
        g.clear();
        const tex = book.get(text, wo);
        starburst(g, 0, 0, Math.max(tex.width, tex.height) * 0.62, 11, fill, cue.id + st);
      }
      const s = st === 0 ? 1.3 : st === 1 ? 0.94 : 1;
      c.position.set(x, y);
      c.scale.set(s * num(a, 'scale', 1));
      c.alpha = lt > d - 0.08 ? Math.max(0, (d - lt) / 0.08) : 1;
    },
    unmount: () => {
      c?.destroy({ children: true });
      c = g = null;
    },
  });
};

/** an overspray cloud (screen or world) */
const spray: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 0.5);
  const R = rng(cue.id * 5 + 1);
  const n = Math.max(6, Math.round(num(a, 'n', 26) * k.density));
  const spread = num(a, 'spread', 160);
  const parts = Array.from({ length: n }, () => ({ dx: (R() - 0.5) * 2, dy: (R() - 0.5) * 2, r: 2 + R() * 6, s: 0.4 + R() * 0.8 }));
  let g: Graphics | null = null;
  const world = !!a.world;
  return clip(cue.m, d, {
    mount: () => {
      g = new Graphics();
      (world ? k.layers.wfx : k.layers.screen).addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const [x, y] = world && Array.isArray(a.at) ? [a.at[0] as number, a.at[1] as number] : posOf(k, a);
      const col = palCol(k, a.color, 'accent');
      const t = st12(lt) / d;
      g.clear();
      const al = 1 - t;
      g.circle(x, y, spread * (0.3 + t * 0.7)).fill({ color: col, alpha: 0.12 * al });
      g.circle(x, y, spread * (0.18 + t * 0.4)).fill({ color: col, alpha: 0.2 * al });
      for (const p of parts) g.circle(x + p.dx * spread * (0.3 + t) * p.s, y + p.dy * spread * (0.3 + t) * p.s, p.r).fill({ color: col, alpha: al });
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};

/** an actor in a pose for a while */
const pose: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 1);
  const who = String(a.who ?? 'canelo') as Who;
  return clip(cue.m, d, {
    update: (lt) => S(k).wantPose(who, { name: String(a.p ?? 'idle'), lt, x: typeof a.x === 'number' ? (a.x as number) : undefined, y: typeof a.y === 'number' ? (a.y as number) : undefined, flip: typeof a.flip === 'boolean' ? (a.flip as boolean) : undefined }),
  });
};

// ------------------------------------------------------------------ markers the stage reads (+ their FX)
/** a wall tag appears (the stage draws it from now on): a puff of overspray where it lands */
const wallTag: VerbFn = (k, a, cue) => {
  const p = S(k).wallTagAt(cue.m);
  return p ? spray(k, { n: 16, spread: 110, dur: 0.45, color: p.color, at: [p.x, p.y] }, cue) : null;
};
const gridBreak: VerbFn = (k, a, cue) => {
  const i = num(a, 'i', 0);
  const v = k.view;
  const at: [number, number] = i === 0 ? [v.x + v.w * 0.33, v.y + v.h * 0.4] : i === 1 ? [v.x + v.w * 0.715, v.y + v.h * 0.6] : i === 2 ? [v.x + v.w * 0.17, v.y + v.h * 0.29] : [v.x + 120, v.y + 90];
  return flatC(pow(k, { text: a.text ?? 'KRAK!', at, size: 70, dur: 0.5, fill: PRINT.paper }, cue), glitch(k, { dur: 0.12, amount: 0.5 }, cue));
};
const gridFix: VerbFn = (k, a, cue) => {
  // the pencil redraws the border: a quick light stroke along it
  const i = num(a, 'i', 0);
  const v = k.view;
  const line: [number, number, number, number] = i === 0 ? [v.x + v.w * 0.34, v.y, v.x + v.w * 0.31, v.y + v.h] : i === 1 ? [v.x + v.w * 0.7, v.y, v.x + v.w * 0.73, v.y + v.h] : [v.x, v.y + v.h * 0.3, v.x + v.w * 0.335, v.y + v.h * 0.27];
  let g: Graphics | null = null;
  const d = 0.35;
  return clip(cue.m, d, {
    mount: () => {
      g = new Graphics();
      k.layers.screen.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const x = clamp01(lt / 0.2);
      g.clear();
      const ex = line[0] + (line[2] - line[0]) * x;
      const ey = line[1] + (line[3] - line[1]) * x;
      g.moveTo(line[0], line[1]).lineTo(ex, ey).stroke({ width: 16, color: 0xbff3ff, alpha: 0.5 * (1 - lt / d) });
      g.moveTo(line[0], line[1]).lineTo(ex, ey).stroke({ width: 5, color: 0xffffff });
      g.circle(ex, ey, 10).fill(0xffffff);
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};

// ------------------------------------------------------------------ the barrage (verse)
/** a spray can thrown from la Lata to our hull (arc), its fuse sparking; gone when the prompt was batted */
export function canG(g: Graphics, x: number, y: number, r: number, rot: number, col: number, ink: number) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const P = (px: number, py: number) => [x + px * c - py * s, y + px * s + py * c];
  const body = [...P(-r * 0.5, -r), ...P(r * 0.5, -r), ...P(r * 0.5, r), ...P(-r * 0.5, r)];
  g.poly(body).fill(0xd8dbe2).stroke({ width: 5, color: ink, join: 'round' });
  g.poly([...P(-r * 0.5, -r * 0.3), ...P(r * 0.5, -r * 0.3), ...P(r * 0.5, r * 0.4), ...P(-r * 0.5, r * 0.4)]).fill(col);
  g.poly([...P(-r * 0.3, -r), ...P(r * 0.3, -r), ...P(r * 0.15, -r * 1.35), ...P(-r * 0.15, -r * 1.35)]).fill(ink);
}
const bomb: VerbFn = (k, a, cue) => {
  const flight = num(a, 'flight', 1);
  const i = num(a, 'i', 0);
  const prompt = typeof a.prompt === 'string' ? (a.prompt as string) : '';
  const col = [FLUO.pink, FLUO.green, FLUO.cyan, FLUO.orange][i % 4];
  let g: Graphics | null = null;
  return clip(cue.m - flight, flight + 0.02, {
    mount: () => {
      g = new Graphics();
      k.layers.wfx.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const st = S(k);
      g.clear();
      const j = prompt ? k.judged(prompt) : null;
      if (j && j.r !== 'miss' && k.m >= j.at - 0.01) return;
      const t = clamp01(st12(lt) / flight);
      const [x0, y0] = a.catch ? st.head('grafitera') : st.B.world(-200, -200);
      const [x1, y1] = a.catch ? st.head('canelo') : st.A.world(140 - (i % 3) * 90, -110 - (i % 2) * 40);
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * 260;
      const art = st.artAt(x, y);
      const ink = art === 'comic' ? COMIC_INK : INK;
      // trail: overspray (street) / speed ticks (comic)
      if (art === 'street') for (let q = 1; q < 6; q++) g.circle(x + q * 26, y + q * 6 - Math.cos(t * Math.PI) * q * 10, 10 - q).fill({ color: col, alpha: 0.4 - q * 0.06 });
      else for (let q = 1; q < 4; q++) g.moveTo(x + q * 30, y - 14 + q * 4).lineTo(x + q * 30 + 22, y - 14 + q * 4).stroke({ width: 4, color: COMIC_INK });
      canG(g, x, y, 22, -t * 9, art === 'comic' ? PRINT.magenta : col, ink);
      // fuse spark
      const sp = 6 + 4 * Math.sin(lt * 60);
      g.circle(x, y - 34, sp).fill(0xffe600).circle(x, y - 34, sp * 0.4).fill(0xffffff);
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};
/** the can goes back where it came from: Canelo's swing, the can flies to la Lata and pops as a comic POW sticker */
const bat: VerbFn = (k, a, cue) => {
  const great = !!a.great;
  const i = num(a, 'i', 0);
  const st = () => S(k);
  const fl = 0.55;
  let g: Graphics | null = null;
  const out: Clip[] = [
    clip(cue.m, 0.5, { update: (lt) => st().wantPose('canelo', { name: 'swing', lt }) }),
    clip(cue.m, fl, {
      mount: () => {
        g = new Graphics();
        k.layers.wfx.addChild(g);
      },
      update: (lt) => {
        if (!g) return;
        g.clear();
        const s = st();
        const [x0, y0] = s.A.world(140 - (i % 3) * 90, -110 - (i % 2) * 40);
        const [x1, y1] = great ? s.B.world(-60 + (i % 3) * 80, -70) : [x0 + 500, y0 - 700];
        const t = clamp01(st12(lt) / fl);
        const x = x0 + (x1 - x0) * t;
        const y = y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * 120;
        const art = s.artAt(x, y);
        for (let q = 1; q < 5; q++) g.circle(x - q * 30, y + q * 8, 9 - q).fill({ color: art === 'comic' ? 0xffffff : FLUO.yellow, alpha: 0.6 - q * 0.1 });
        canG(g, x, y, 22, t * 12, art === 'comic' ? PRINT.cyan : FLUO.yellow, art === 'comic' ? COMIC_INK : INK);
      },
      unmount: () => {
        g?.destroy();
        g = null;
      },
    }),
  ];
  const at = () => {
    const [x, y] = st().B.world(-60 + (i % 3) * 80, -70);
    return k.cam.toScreen(x, y);
  };
  if (great) {
    out.push(clip(cue.m + fl, 0.02, { mount: () => st().addPatch({ ship: 'B', m: cue.m + fl, x: -60 + (i % 3) * 80, y: -70, kind: 'pow', color: PRINT.yellow, seed: cue.id }) }));
    out.push(...flatC(pow(k, { text: '¡POW!', at, size: 84, dur: 0.6 }, { ...cue, m: cue.m + fl } as Cue)));
    out.push(clip(cue.m + fl, 0.4, { update: (lt) => st().wantJolt('B', { dx: -26 * (1 - lt / 0.4), rot: -0.04 * (1 - lt / 0.4) }) }));
  }
  out.push(...flatC(tag(k, { text: great ? '¡TOC!' : 'toc', kind: 'comic', size: great ? 90 : 60, color: PRINT.yellow, at: 'canelo', dur: 0.45 }, cue)));
  return out;
};
/** the can hits our hull: a splat that stays, the ship jolts, Canelo gets knocked */
const splatHit: VerbFn = (k, a, cue) => {
  const i = num(a, 'i', 0);
  const col = [FLUO.pink, FLUO.green, FLUO.cyan, FLUO.orange][i % 4];
  return [
    clip(cue.m, 0.02, { mount: () => S(k).addPatch({ ship: 'A', m: cue.m, x: 140 - (i % 3) * 90, y: -100 - (i % 2) * 30, kind: 'splat', color: col, seed: cue.id }) }),
    clip(cue.m, 0.5, {
      update: (lt) => {
        S(k).wantJolt('A', { dx: -22 * (1 - lt / 0.5), dy: 10 * (1 - lt / 0.5), rot: 0.04 * (1 - lt / 0.5) });
        S(k).wantPose('canelo', { name: 'hit', lt });
      },
    }),
    ...flatC(spray(k, { world: true, at: S(k).A.world(140 - (i % 3) * 90, -100), n: 30, spread: 140, color: col, dur: 0.5 }, cue)),
    ...flatC(tag(k, { text: '¡SPLAT!', kind: 'tag', size: 96, color: col, at: 'shipA', dur: 0.6 }, cue)),
  ].filter(Boolean) as Clip[];
};

// ------------------------------------------------------------------ NEON TAG! vs the lantern (hold)
/** Grafitera paints a giant tag across the sky toward us (the hold's wind-up; reads the prompt live) */
const neonTag: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 4);
  const prompt = String(a.prompt ?? 'escudo');
  let g: Graphics | null = null;
  return clip(cue.m, d, {
    mount: () => {
      g = new Graphics();
      k.layers.wfx.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const s = S(k);
      g.clear();
      s.wantPose('grafitera', { name: 'spray', lt });
      // the tag's stroke grows along a wavy line from her can toward our ship
      const [x0, y0] = s.head('grafitera');
      const [x1, y1] = s.A.world(60, -300);
      const t = clamp01(st12(lt) / d);
      const pts: number[] = [];
      const n = Math.max(2, Math.round(24 * t));
      for (let j = 0; j <= n; j++) {
        const u = (j / 24) * 1;
        pts.push(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u - Math.sin(u * Math.PI * 3) * 140 - 220 * Math.sin(u * Math.PI));
      }
      // a giant wildstyle stroke: fat green body, pink core, overspray clouds riding it
      sprayLine(g, pts, 70, FLUO.green, 77 + Math.floor(lt * 12), { speck: 1.6 });
      sprayLine(g, pts, 26, FLUO.pink, 78, { speck: 0.4, core: 1 });
      sprayLine(g, pts, 8, 0xffffff, 79, { speck: 0, core: 1, alpha: 0.9 });
      if (pts.length >= 4) {
        const ex = pts[pts.length - 2];
        const ey = pts[pts.length - 1];
        g.circle(ex, ey, 120).fill({ color: FLUO.green, alpha: 0.12 });
        g.circle(ex, ey, 60).fill({ color: FLUO.green, alpha: 0.2 });
      }
      // the lantern charging while the player holds
      const ps = k.prompt(prompt);
      if (ps?.from !== undefined && ps.to === undefined) {
        const held = clamp01((k.m - ps.from) / Math.max(0.5, ps.p.mEnd - ps.p.m));
        const [lx, ly] = s.head('luzterna');
        g.circle(lx, ly + 30, 60 + 220 * held).fill({ color: FLUO.cyan, alpha: 0.12 }).stroke({ width: 6, color: 0xffffff, alpha: 0.7 });
        g.circle(lx, ly + 30, 30 + 40 * held).fill({ color: 0xfff3b0, alpha: 0.6 });
        s.wantPose('luzterna', { name: 'brace', lt });
      }
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};
const shield: VerbFn = (k, a, cue) => {
  const r = String(a.r ?? 'miss');
  const d = 1.4;
  let g: Graphics | null = null;
  const out: Clip[] = [
    clip(cue.m, d, {
      mount: () => {
        g = new Graphics();
        k.layers.wfx.addChild(g);
      },
      update: (lt) => {
        if (!g) return;
        const s = S(k);
        g.clear();
        const [cx, cy] = s.A.world(0, -260);
        const x = lt / d;
        if (r === 'great') {
          // a lantern bubble swallows the ship: the tag splashes off it, back toward them
          const rr = 420 * ease('outBack', clamp01(lt / 0.25));
          g.ellipse(cx, cy, rr * 1.15, rr * 0.75).fill({ color: FLUO.cyan, alpha: 0.12 * (1 - x) }).stroke({ width: 10, color: 0xffffff, alpha: 1 - x });
          g.ellipse(cx, cy, rr * 1.15 - 18, rr * 0.75 - 14).stroke({ width: 4, color: FLUO.cyan, alpha: 1 - x });
        } else if (r === 'hit') {
          const rr = 330;
          g.ellipse(cx, cy, rr * 1.1, rr * 0.7).stroke({ width: 8, color: 0xffffff, alpha: (1 - x) * (Math.floor(lt * 16) % 2 ? 1 : 0.4) });
        }
        s.wantPose('luzterna', { name: r === 'miss' ? 'sad' : 'point', lt });
      },
      unmount: () => {
        g?.destroy();
        g = null;
      },
    }),
  ];
  if (r === 'great') {
    out.push(...flatC(tag(k, { text: '¡REBOTE!', kind: 'comic', size: 110, color: PRINT.yellow, at: 'shipA', dur: 0.9 }, cue), pow(k, { text: '¡FWOOM!', at: 'luzterna', size: 70, dur: 0.6 }, cue)));
    out.push(clip(cue.m + 0.4, 0.02, { mount: () => S(k).addPatch({ ship: 'B', m: cue.m + 0.4, x: 120, y: -60, kind: 'splat', color: FLUO.green, seed: cue.id + 5 }) }));
  } else if (r === 'hit') out.push(...flatC(tag(k, { text: 'casi…', kind: 'marker', size: 70, color: 0xffffff, at: 'shipA', dur: 0.7 }, cue)));
  else {
    out.push(clip(cue.m, 0.02, { mount: () => S(k).addPatch({ ship: 'A', m: cue.m, x: -40, y: -80, kind: 'splat', color: FLUO.green, seed: cue.id + 9 }) }));
    out.push(...flatC(tag(k, { text: 'NEON TAG!', kind: 'tag', size: 130, color: FLUO.green, at: 'shipA', dur: 1.1 }, cue)));
    out.push(clip(cue.m, 0.6, { update: (lt) => S(k).wantJolt('A', { dx: -30 * (1 - lt / 0.6), rot: 0.05 * (1 - lt / 0.6) }) }));
  }
  return out;
};

// ------------------------------------------------------------------ Brecha boards us (verse2)
/** Brecha's leap from la Lata onto our deck (or back): an arc with her crowbar out */
const leapOver: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 0.9);
  const back = !!a.back;
  return clip(cue.m, d, {
    update: (lt) => {
      const s = S(k);
      const t = ease('inOut', clamp01(lt / d));
      const [x0, y0] = back ? s.A.world(300, -132) : s.B.world(40, -444);
      const [x1, y1] = back ? s.B.world(-160, -146) : s.A.world(300, -132);
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * 340;
      s.wantPose('brecha', { name: 'fly', lt, x, y, rot: back ? -t * Math.PI * 2 : (1 - t) * Math.PI + t * Math.PI * 2, flip: true });
    },
  });
};
/** paw vs crowbar on the deck: the winner of the beat */
const clash: VerbFn = (k, a, cue) => {
  const win = !!a.win;
  const small = !!a.small;
  const d = 0.5;
  const at = () => {
    const s = S(k);
    const [x, y] = s.A.world(165, -260);
    return k.cam.toScreen(x, y);
  };
  const out: Clip[] = [
    clip(cue.m, d, {
      update: (lt) => {
        const s = S(k);
        s.wantPose('canelo', { name: win ? 'push' : 'hit', lt });
        s.wantPose('brecha', { name: win ? 'hit' : 'push', lt, flip: true });
        s.wantJolt('A', { dy: 8 * (1 - lt / d), rot: (win ? -0.02 : 0.03) * (1 - lt / d) });
      },
    }),
  ];
  if (win && !small) out.push(...flatC(pow(k, { text: a.text ?? '¡KLANG!', at, size: 80, dur: 0.45 }, cue), slam(k, { dur: 0.07, color: 'accent' }, cue)));
  else if (win) out.push(...flatC(pow(k, { text: 'tink', at, size: 54, dur: 0.4, fill: PRINT.paper }, cue)));
  else out.push(...flatC(tag(k, { text: '¡AU!', kind: 'tag', size: 90, color: FLUO.orange, at, dur: 0.5 }, cue), spray(k, { at, color: FLUO.orange, n: 16, spread: 90, dur: 0.4 }, cue)));
  return out;
};
const dodge: VerbFn = (k, a, cue) => {
  const left = a.side === 'left';
  const d = 0.9;
  const out: Clip[] = [
    clip(cue.m, d, {
      update: (lt) => {
        const s = S(k);
        const x = clamp01(lt / d);
        const [hx, hy] = s.home('canelo');
        if (left) s.wantPose('canelo', { name: 'brace', lt, x: hx - 40, y: hy + 20 });
        else s.wantPose('canelo', { name: 'cheer', lt, x: hx + 10, y: hy - Math.sin(x * Math.PI) * 220 });
        s.wantPose('brecha', { name: 'swing', lt: lt * 0.8, flip: true });
      },
    }),
  ];
  out.push(...flatC(tag(k, { text: left ? '¡ABAJO!' : '¡ARRIBA!', kind: 'comic', size: 90, color: PRINT.yellow, at: 'canelo', dur: 0.7 }, cue), pow(k, { text: 'WHOOSH', at: 'brecha', size: 56, dur: 0.5, fill: PRINT.paper }, cue)));
  return out;
};
/** the mash result: Canelo shoves Brecha back to her ship (great), she backflips away (hit) or leaves laughing (miss) */
const shove: VerbFn = (k, a, cue) => {
  const r = String(a.r ?? 'miss');
  const out: Clip[] = [...flatC(leapOver(k, { back: true, dur: r === 'great' ? 0.7 : 1.0 }, cue))];
  if (r === 'great') out.push(...flatC(pow(k, { text: '¡FUERA!', at: 'canelo', size: 100, dur: 0.8 }, cue), slam(k, { dur: 0.08 }, cue)));
  else if (r === 'hit') out.push(...flatC(tag(k, { text: '¡HOP!', kind: 'tag', size: 90, color: FLUO.pink, at: 'brecha', dur: 0.6 }, cue)));
  else out.push(...flatC(tag(k, { text: '¡JA JA!', kind: 'tag', size: 100, color: FLUO.pink, at: 'brecha', dur: 0.9 }, cue), clip(cue.m, 0.02, { mount: () => S(k).addPatch({ ship: 'A', m: cue.m, x: 200, y: -60, kind: 'splat', color: FLUO.pink, seed: cue.id + 2 }) })));
  out.push(clip(cue.m, 0.8, { update: (lt) => S(k).wantPose('canelo', { name: r === 'miss' ? 'hit' : 'push', lt }) }));
  return out;
};

// ------------------------------------------------------------------ the hand that draws the boxes (chorus3 → climax)
/**
 * The hand of light crosses the sky drawing: a pencil line that REDRAWS the world clean (the score keys `style` toward
 * comic behind it); eraser crumbs where it passes over a tag. Path: from (x0, y0) to (x1, y1) in screen space.
 */
const handDraw: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 2);
  let g: Graphics | null = null;
  let hand: Graphics | null = null;
  return clip(cue.m, d, {
    z: 3,
    mount: () => {
      g = new Graphics();
      hand = drawHand(new Graphics(), num(a, 's', 0.9), 'light', FLUO.cyan);
      k.layers.screen.addChild(g, hand);
    },
    update: (lt) => {
      if (!g || !hand) return;
      const t = ease('sineInOut', clamp01(lt / d));
      const x0 = num(a, 'x0', W + 200);
      const y0 = num(a, 'y0', 200);
      const x1 = num(a, 'x1', -200);
      const y1 = num(a, 'y1', 700);
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI * 4) * 40;
      hand.position.set(x, y);
      hand.alpha = Math.min(1, lt / 0.2, (d - lt) / 0.2);
      g.clear();
      // the pencil line behind it (light), wobbly like a hand
      const n = 30;
      const pts: number[] = [];
      for (let j = 0; j <= n * t; j++) {
        const u = j / n;
        pts.push(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + Math.sin(u * Math.PI * 4) * 40);
      }
      pts.push(x, y);
      if (pts.length >= 4) {
        g.moveTo(pts[0], pts[1]);
        for (let j = 2; j < pts.length; j += 2) g.lineTo(pts[j], pts[j + 1]);
        g.stroke({ width: 22, color: FLUO.cyan, alpha: 0.25 * hand.alpha });
        g.moveTo(pts[0], pts[1]);
        for (let j = 2; j < pts.length; j += 2) g.lineTo(pts[j], pts[j + 1]);
        g.stroke({ width: 6, color: 0xffffff, alpha: hand.alpha });
      }
      // eraser crumbs falling off (on twos)
      const R = rng(Math.floor(lt * 12) + cue.id);
      for (let j = 0; j < 8; j++) g.circle(x + 240 * (num(a, 's', 0.9)) + (R() - 0.5) * 60, y - 380 * num(a, 's', 0.9) + R() * 160, 3 + R() * 4).fill({ color: 0xff8fb8, alpha: 0.8 });
    },
    unmount: () => {
      g?.destroy();
      hand?.destroy();
      g = hand = null;
    },
  });
};
/** the player's tag against the eraser: sprayed on the beat; great survives (glows), hit is half rubbed out, miss is gone */
const eraseTag: VerbFn = (k, a, cue) => {
  const r = String(a.r ?? 'miss');
  const word = String(a.word ?? '¡NO!');
  const at = posOf(k, a, W / 2, H * 0.4);
  const col = typeof a.color === 'number' ? (a.color as number) : FLUO.pink;
  const d = 1.6;
  const book = S(k).book;
  const o = { kind: 'tag' as WordKind, size: 150, color: col, halo: col, seed: textSeed(word) };
  book.get(word, o);
  let c: Container | null = null;
  let sp: Sprite | null = null;
  let mask: Graphics | null = null;
  let crumbs: Graphics | null = null;
  return clip(cue.m, d, {
    z: 5,
    mount: () => {
      c = new Container();
      sp = book.sprite(word, o);
      mask = new Graphics();
      crumbs = new Graphics();
      c.addChild(sp, mask, crumbs);
      sp.mask = mask;
      c.position.set(at[0], at[1]);
      c.rotation = -0.08;
      k.layers.type.addChild(c);
    },
    update: (lt) => {
      if (!c || !sp || !mask || !crumbs) return;
      const tex = sp.texture;
      const w = tex.width;
      const h = tex.height;
      // the eraser sweeps from 0.45 s (hit: half, miss: all)
      const er = r === 'great' ? 0 : clamp01((lt - 0.45) / 0.5) * (r === 'hit' ? 0.5 : 1);
      mask.clear();
      mask.rect(-w / 2 + w * er, -h / 2, w * (1 - er) + 2, h).fill(0xffffff);
      crumbs.clear();
      if (er > 0 && er < 1) {
        const R = rng(Math.floor(lt * 12));
        for (let j = 0; j < 10; j++) crumbs.circle(-w / 2 + w * er + (R() - 0.5) * 40, -h / 2 + R() * h, 3 + R() * 5).fill({ color: 0xff8fb8, alpha: 0.85 });
      }
      const s = lt < 1 / 12 ? 1.18 : lt < 2 / 12 ? 0.96 : 1;
      const glow = r === 'great' && lt > 0.45 ? 1 + 0.04 * Math.sin(lt * 30) : 1;
      c.scale.set(s * glow);
      c.alpha = lt > d - 0.15 ? Math.max(0, (d - lt) / 0.15) : 1;
    },
    unmount: () => {
      c?.destroy({ children: true });
      c = sp = mask = crumbs = null;
    },
  });
};
/** the box closing in: four pencil lines draw a frame that shrinks toward the centre (predrop) */
const boxClose: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 4);
  let g: Graphics | null = null;
  return clip(cue.m, d, {
    z: 4,
    mount: () => {
      g = new Graphics();
      k.layers.screen.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const v = k.view;
      const t = clamp01(lt / d);
      // each side is drawn on a beat (4 sides), then the frame tightens step by step
      const sides = Math.min(4, 1 + Math.floor((lt / k.beat) % 8));
      const inset = 40 + 260 * ease('in', Math.floor(t * 8) / 8);
      const x0 = v.x + inset * 1.6;
      const y0 = v.y + inset;
      const x1 = v.x + v.w - inset * 1.6;
      const y1 = v.y + v.h - inset;
      g.clear();
      // outside the box: dimmed
      g.rect(v.x - 50, v.y - 50, v.w + 100, v.h + 100).fill({ color: 0x0a1428, alpha: 0.35 * t });
      g.rect(x0, y0, x1 - x0, y1 - y0).cut();
      const seg: [number, number, number, number][] = [
        [x0, y0, x1, y0],
        [x1, y0, x1, y1],
        [x1, y1, x0, y1],
        [x0, y1, x0, y0],
      ];
      for (let i = 0; i < sides; i++) {
        const [a0, b0, a1, b1] = seg[i];
        g.moveTo(a0, b0).lineTo(a1, b1).stroke({ width: 26, color: FLUO.cyan, alpha: 0.25 });
        g.moveTo(a0, b0).lineTo(a1, b1).stroke({ width: 8, color: 0xffffff });
      }
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};
/** the crowbar against the closing box (hold-release into the climax) */
const crowbar: VerbFn = (k, a, cue) => {
  const power = num(a, 'power', 1);
  const clumsy = !!a.clumsy;
  const out: Clip[] = [];
  out.push(...flatC(slam(k, { dur: 0.08, color: 'accent' }, cue), glitch(k, { dur: 0.5, amount: clumsy ? 0.5 : 1 }, cue), tag(k, { text: clumsy ? 'crac…' : '¡CRAC!', kind: clumsy ? 'marker' : 'stencil', size: clumsy ? 90 : 190, color: FLUO.pink, x: W / 2, y: H * 0.42, dur: 0.9 }, cue)));
  out.push(clip(cue.m, 0.6, { update: (lt) => k.cam.shake(28 * power * (1 - lt / 0.6), k.m, cue.id, 26) }));
  return out;
};

// ------------------------------------------------------------------ the rifts (drop)
/** a ring where a rift opens */
const riftRing: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 0.6);
  let g: Graphics | null = null;
  const which = a.which === 'B' ? 'riftB' : 'riftA';
  return clip(cue.m, d, {
    mount: () => {
      g = new Graphics();
      k.layers.screen.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const f = S(k).front;
      const r = which === 'riftA' ? f.riftA : f.riftB;
      const x = lt / d;
      g.clear();
      const rr = Math.max(40, r[2]) * (1 + 0.6 * ease('expoOut', x));
      g.ellipse(r[0], r[1], rr * 0.62, rr).stroke({ width: 18 * (1 - x), color: FLUO.green, alpha: 1 - x });
      g.ellipse(r[0], r[1], rr * 0.5, rr * 0.82).stroke({ width: 6 * (1 - x), color: 0xffffff, alpha: 1 - x });
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};
/**
 * A shot through the rifts: our paint ball enters rift A and comes out of rift B — in the OTHER art and the other
 * side's color (the glitch phase's rule: what crosses changes owner). great = it flies on into la Lata; miss = it turns
 * around at us.
 */
const riftShot: VerbFn = (k, a, cue) => {
  const r = String(a.r ?? 'miss');
  const fl = 0.7;
  let g: Graphics | null = null;
  const out: Clip[] = [
    clip(cue.m - 0.5, fl + 0.5, {
      mount: () => {
        g = new Graphics();
        k.layers.screen.addChild(g);
      },
      update: (lt) => {
        if (!g) return;
        const s = S(k);
        const f = s.front;
        g.clear();
        const [ax, ay] = k.cam.toScreen(...s.A.world(200, -200));
        const t = lt - 0.5;
        let x: number;
        let y: number;
        let col: number;
        if (t < 0) {
          const u = clamp01(lt / 0.5);
          x = ax + (f.riftA[0] - ax) * u;
          y = ay + (f.riftA[1] - ay) * u;
          col = FLUO.cyan;
        } else {
          const u = clamp01(t / fl);
          const [tx, ty] = r === 'miss' ? [ax, ay] : k.cam.toScreen(...s.B.world(0, -80));
          x = f.riftB[0] + (tx - f.riftB[0]) * u;
          y = f.riftB[1] + (ty - f.riftB[1]) * u - Math.sin(u * Math.PI) * 80;
          col = FLUO.pink;
        }
        const comic = !s.isStreet(x, y);
        if (comic) {
          for (let q = 1; q < 4; q++) g.circle(x - (t < 0 ? -1 : 1) * q * 34, y + q * 6, 30 - q * 6).fill({ color: 0xffffff, alpha: 0.8 }).stroke({ width: 4, color: COMIC_INK, alpha: 0.8 });
          g.circle(x, y, 40).fill(col === FLUO.cyan ? PRINT.cyan : PRINT.magenta).stroke({ width: 7, color: COMIC_INK });
          g.circle(x - 12, y - 12, 10).fill(0xffffff);
        } else {
          for (let q = 1; q < 6; q++) g.circle(x - (t < 0 ? -1 : 1) * q * 26, y + q * 5, 26 - q * 3).fill({ color: col, alpha: 0.35 - q * 0.05 });
          g.circle(x, y, 70).fill({ color: col, alpha: 0.16 });
          g.circle(x, y, 38).fill(col);
          g.circle(x, y, 16).fill(0xffffff);
        }
      },
      unmount: () => {
        g?.destroy();
        g = null;
      },
    }),
  ];
  const land = { ...cue, m: cue.m + fl } as Cue;
  if (r === 'great') {
    out.push(...flatC(pow(k, { text: '¡ZAS!', at: 'shipB', size: 100, dur: 0.6 }, land), slam(k, { dur: 0.07, color: 'accent2' }, land)));
    out.push(clip(cue.m + fl, 0.02, { mount: () => S(k).addPatch({ ship: 'B', m: cue.m + fl, x: -100 + num(a, 'i', 0) * 70, y: -90, kind: 'splat', color: FLUO.pink, seed: cue.id + 3 }) }));
  } else if (r === 'hit') out.push(...flatC(pow(k, { text: 'POP', at: 'shipB', size: 64, dur: 0.45, fill: PRINT.paper }, land)));
  else {
    out.push(...flatC(tag(k, { text: '¡¿EH?!', kind: 'tag', size: 100, color: FLUO.pink, at: 'canelo', dur: 0.7 }, land)));
    out.push(clip(cue.m + fl, 0.5, { update: (lt) => S(k).wantPose('canelo', { name: 'hit', lt }) }));
  }
  return out;
};

// ------------------------------------------------------------------ the grade, sprayed
const GRADE_O = { kind: 'tag' as WordKind, size: 200, color: FLUO.yellow, halo: FLUO.pink, seed: 9 };
const RITMO_O = { kind: 'stencil' as WordKind, size: 54, color: WALL, halo: FLUO.cyan, seed: 4 };
const grade: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 2);
  // every possible grade baked now: the grade is only known when it mounts
  for (const g of ['S', 'A', 'B', 'C']) S(k).book.get(g, GRADE_O);
  S(k).book.get('RITMO', RITMO_O);
  let c: Container | null = null;
  return clip(cue.m, d, {
    z: 8,
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
      const sp = S(k).book.sprite(g, GRADE_O);
      const lab = S(k).book.sprite('RITMO', RITMO_O);
      lab.position.set(0, 120);
      c.addChild(sp, lab);
      c.position.set(k.view.x + k.view.w - 220, k.view.y + 220);
      c.rotation = -0.12;
      k.layers.type.addChild(c);
    },
    update: (lt) => {
      if (!c) return;
      c.scale.set(lt < 1 / 12 ? 1.2 : 1);
      c.alpha = lt > d - 0.2 ? Math.max(0, (d - lt) / 0.2) : 1;
    },
    unmount: () => {
      c?.destroy({ children: true });
      c = null;
    },
  });
};


// ------------------------------------------------------------------ the mash: paw vs crowbar, live
/** while the player mashes: Canelo and Brecha push against each other; the clash point slides with the taps */
const pushLive: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 4);
  const id = String(a.prompt ?? 'empuja');
  let g: Graphics | null = null;
  return clip(cue.m, d, {
    mount: () => {
      g = new Graphics();
      k.layers.wfx.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const s = S(k);
      const ps = k.prompt(id);
      const need = ps?.p.spec.need ?? [10, 20];
      const won = clamp01((ps?.taps ?? 0) / need[1]);
      const fair = clamp01(lt / d);
      // how far Canelo is winning (−1 = Brecha pushes him to the stern, +1 = he pushes her to the rail)
      const bal = (won - fair * 0.75) * 2;
      const [cx, cy] = s.A.world(150 + bal * 60, -250);
      s.wantPose('canelo', { name: 'push', lt, ...(() => { const [hx, hy] = s.home('canelo'); return { x: hx + bal * 60 - 30, y: hy }; })() });
      s.wantPose('brecha', { name: 'push', lt, x: cx + 130, y: cy + 118, flip: true });
      g.clear();
      const R = rng(Math.floor(lt * 12) + cue.id);
      // sparks where paw meets crowbar (on twos), more with every tap
      const n = 4 + Math.min(10, ps?.taps ?? 0);
      for (let j = 0; j < n; j++) {
        const an = R() * Math.PI * 2;
        const rr = 30 + R() * 90;
        g.moveTo(cx + Math.cos(an) * 16, cy + Math.sin(an) * 16).lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr).stroke({ width: 4, color: j % 2 ? FLUO.cyan : 0xffffff });
      }
      g.circle(cx, cy, 22 + 6 * Math.sin(lt * 40)).fill({ color: 0xffffff, alpha: 0.85 });
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};

// ------------------------------------------------------------------ the crack (break / build)
/** tune the broken tape: the picture clears for a moment (the crack shot reads it) */
const tune: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 1);
  return [
    clip(cue.m, d, { mount: () => S(k).tunes.push([cue.m, cue.m + d]), update: () => undefined }),
    ...flatC(tag(k, { text: 'SEÑAL', kind: 'glitch', size: 80, x: 960, y: 960, dur: Math.min(0.7, d), color: 0x9effd9 }, cue)),
  ];
};
/** ¿ABRIR?: left = Canelo grabs the crowbar too · right = he and Luzterna push the crack shut — it opens anyway */
const open: VerbFn = (k, a, cue) => {
  const left = a.side === 'left';
  return [
    clip(cue.m, 3, { mount: () => (S(k).openWith = { m: cue.m, left }), update: () => undefined }),
    ...flatC(tag(k, { text: left ? '¡JUNTOS!' : '¡NO!', kind: left ? 'tag' : 'comic', size: 150, x: left ? 640 : 1280, y: 300, dur: 1.2, color: left ? FLUO.orange : PRINT.yellow }, cue)),
  ];
};
/** the wall shatters (hold-release into the drop): stencil shards fly out, the picture reassembles from macro-blocks */
const shatter: VerbFn = (k, a, cue) => {
  const power = num(a, 'power', 1);
  const clumsy = !!a.clumsy;
  const d = clumsy ? 1.0 : 0.7;
  const R = rng(cue.id + 5);
  const shards = Array.from({ length: Math.round(26 * (0.6 + 0.4 * k.density)) }, () => {
    const an = R() * Math.PI * 2;
    return { an, sp: (900 + R() * 1400) * power, r: 60 + R() * 140, rot: (R() - 0.5) * 8, pts: Array.from({ length: 5 }, (_, j) => [Math.cos((j / 5) * Math.PI * 2 + R() * 0.6) * (0.6 + R() * 0.5), Math.sin((j / 5) * Math.PI * 2 + R() * 0.6) * (0.6 + R() * 0.5)]), x0: 960 + Math.cos(an) * R() * 300, y0: 540 + Math.sin(an) * R() * 200, c: [0x17151b, 0x2c2933, 0x1f1d24][Math.floor(R() * 3)] };
  });
  let g: Graphics | null = null;
  const out: Clip[] = [
    clip(cue.m, d, {
      z: 4,
      mount: () => {
        g = new Graphics();
        g.zIndex = 15;
        k.layers.panels.addChild(g);
      },
      update: (lt) => {
        if (!g) return;
        g.clear();
        const t = st12(lt);
        for (const s of shards) {
          const x = s.x0 + Math.cos(s.an) * s.sp * t;
          const y = s.y0 + Math.sin(s.an) * s.sp * t + 900 * t * t;
          const c = Math.cos(s.rot * t);
          const sn = Math.sin(s.rot * t);
          const pts = s.pts.flatMap(([px, py]) => [x + (px * c - py * sn) * s.r, y + (px * sn + py * c) * s.r]);
          g.poly(pts).fill(s.c).stroke({ width: 4, color: 0x9effd9, alpha: 0.7 });
        }
      },
      unmount: () => {
        g?.destroy();
        g = null;
      },
    }),
    clip(cue.m, 1.6, { update: (lt) => S(k).signal.max({ block: Math.max(0, 1 - lt / 1.6) * (clumsy ? 0.9 : 0.7), blockPx: 64, rgb: 6 * Math.max(0, 1 - lt / 0.8) }) }),
  ];
  out.push(...flatC(slam(k, { dur: 0.08, color: 'accent' }, cue), tag(k, { text: clumsy ? 'uy…' : '¡CRASH!', kind: clumsy ? 'marker' : 'stencil', size: clumsy ? 100 : 230, x: 960, y: 420, dur: 1.0, color: FLUO.green, halo: FLUO.green }, cue)));
  out.push(clip(cue.m, 0.7, { update: (lt) => k.cam.shake(30 * power * (1 - lt / 0.7), k.m, cue.id, 24) }));
  return out;
};

export const TE_VERBS: Record<string, VerbFn> = {
  pushLive,
  tune,
  open,
  shatter,
  tag,
  slam,
  glitch,
  pow,
  spray,
  pose,
  wallTag,
  gridBreak,
  gridFix,
  bomb,
  bat,
  splatHit,
  neonTag,
  shield,
  leapOver,
  clash,
  dodge,
  shove,
  handDraw,
  eraseTag,
  boxClose,
  crowbar,
  riftRing,
  riftShot,
  grade,
};
