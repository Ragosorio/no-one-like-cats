/**
 * CUT-INS & MANGA PANELS (toolkit verbs).
 *
 *  cutin   a slanted band slashes across the screen (from `side`), a character's FACE big inside it over speed / focus
 *          lines in the section's colors, thick ink border + a light inner line; holds, then wipes out. Args: who, side
 *          ('left'|'right'), dur|beats, y, h, tilt, color, lines ('speed'|'focus'|'none'), face (head height / band
 *          height), emote, look, flip, kata (a katakana tag), text (a 1–3 word callout)
 *  panels  a manga page: 2–4 cells slide in one after another (stagger in beats), each a face / a color field with
 *          lines. Args: layout ('v3'|'h2'|'grid4'|'diag3'|'diag2'), cells [{ who?, color?, emote?, flip?, face?, sfx? }],
 *          dur|beats, stagger
 */
import { Container, Graphics, type ColorSource } from 'pixi.js';
import type { CatPuppet } from '../../art/livingCat';
import type { Args } from '../types';
import { ease } from '../score';
import { W, H, clip, type Kit, type VerbFn } from './kit';
import { focusLines, speedLines } from './draw';
import { durOf, palCol, SFX_STYLE, KATA_STYLE } from './fx';

const num = (a: Args, k: string, d: number) => (typeof a[k] === 'number' ? (a[k] as number) : d);

/**
 * who → an actor key the studio knows: '$crew0' / '$crew1' = the player's crew (loaded by the stage), falling back to the
 * story cast; plain names go through the stage's own cast map ('canelo' → his form's slug) when it has one.
 */
export function whoOf(k: Kit, raw: unknown): string {
  const w = String(raw ?? '');
  const crew = (k as Kit & { crewLoaded?: string[] }).crewLoaded ?? [];
  const cast = (k.stage as unknown as { slugs?: Record<string, string> }).slugs ?? {};
  const m = /^\$crew(\d)$/.exec(w);
  if (m) return crew[Number(m[1])] ?? cast[Number(m[1]) === 0 ? 'plomito' : 'globito'] ?? cast.canelo ?? '';
  return cast[w] ?? w;
}

/** a character framed on its head inside a w×h box (local 0,0 = box centre) */
function faceIn(k: Kit, who: string, w: number, h: number, face: number, flip: boolean, fx = 0.5): { c: Container; p: CatPuppet | null } {
  const c = new Container();
  const p = k.studio.puppet(who, { anchorX: 0.5, anchorY: 0.97 });
  if (!p) return { c, p: null };
  const head = p.brain.model?.rig.head ?? [350, 200, 150, 125];
  const hh = (head[3] ?? 125) * 2.3;
  const s = (h * face) / hh;
  p.scale.set(flip ? -s : s, s);
  const hl = p.brain.headLocal() ?? [0, -400];
  // head centre at (fx of the box, 46 % of its height)
  p.position.set(-w / 2 + w * fx - hl[0] * s * (flip ? -1 : 1), -h / 2 + h * 0.5 - hl[1] * s);
  c.addChild(p);
  return { c, p };
}

const cutin: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, k.bar);
  const side = a.side === 'right' ? 1 : -1;
  const h = num(a, 'h', 400);
  const y = num(a, 'y', H / 2);
  const tilt = num(a, 'tilt', -0.1 * side);
  const who = whoOf(k, a.who);
  let root: Container | null = null;
  let inner: Container | null = null;
  let lines: Graphics | null = null;
  let puppet: CatPuppet | null = null;
  let lastSt = -1;
  const bw = k.view.w + 600;
  return clip(cue.m, d, {
    z: num(a, 'z', 3),
    mount: () => {
      root = new Container();
      root.zIndex = 10;
      root.position.set(W / 2, y);
      root.rotation = tilt;
      const band = new Graphics();
      // outer ink, light keyline, then the field
      band.rect(-bw / 2, -h / 2 - 14, bw, h + 28).fill(palCol(k, a.ink, 'ink'));
      band.rect(-bw / 2, -h / 2 - 5, bw, h + 10).fill(palCol(k, a.edge, 'light'));
      band.rect(-bw / 2, -h / 2, bw, h).fill(palCol(k, a.color, 'accent'));
      inner = new Container();
      lines = new Graphics();
      inner.addChild(lines);
      if (who) {
        const f = faceIn(k, who, Math.min(1100, W * 0.6), h, num(a, 'face', 1.05), !!a.flip, side < 0 ? 0.36 : 0.64);
        puppet = f.p;
        inner.addChild(f.c);
        if (puppet && typeof a.emote === 'string') puppet.emote(a.emote as 'happy', 1);
        if (puppet && typeof a.look === 'number') puppet.look = a.look as number;
      }
      const mask = new Graphics().rect(-bw / 2, -h / 2, bw, h).fill(0xffffff);
      inner.mask = mask;
      root.addChild(band, inner, mask);
      if (a.text) {
        const kp = { pal: k.palFor(cue) } as Kit;
        const t = k.text.sprite(String(a.text), SFX_STYLE(num(a, 'textSize', 86), palCol(kp, a.textColor, 'light'), palCol(kp, a.ink, 'ink')));
        t.position.set(side < 0 ? 420 : -420, h / 2 - 40);
        t.rotation = -tilt * 0.5;
        root.addChild(t);
      }
      if (a.kata) {
        const kp = { pal: k.palFor(cue) } as Kit;
        const kt = k.text.sprite(String(a.kata), KATA_STYLE(54, palCol(kp, a.ink, 'ink'), palCol(kp, a.edge, 'light')));
        kt.position.set(side < 0 ? 620 : -620, -h / 2 + 50);
        root.addChild(kt);
      }
      k.layers.panels.addChild(root);
    },
    update: (lt) => {
      if (!root || !inner || !lines) return;
      const inT = Math.min(0.12, d * 0.2);
      const outT = Math.min(0.14, d * 0.2);
      // slash in (stepped on 24 fps for snap), hold with a slow drift, wipe out the other way
      const sIn = lt < inT ? ease('expoOut', Math.floor((lt / inT) * 4) / 4) : 1;
      const sOut = lt > d - outT ? ease('in', (lt - (d - outT)) / outT) : 0;
      root.x = W / 2 + side * (1 - sIn) * (bw * 0.9) - side * sOut * (bw * 0.9);
      const drift = (lt / d) * 30 * -side;
      inner.x = drift;
      root.scale.y = lt < inT ? 0.6 + 0.4 * sIn : 1;
      const st = Math.floor(k.m * 12);
      if (st !== lastSt) {
        lastSt = st;
        lines.clear();
        const lc = palCol(k, a.lineColor, 'light');
        if (a.lines === 'focus') focusLines(lines, side < 0 ? -200 : 200, 0, bw, h * 2, h * 0.55, 70, lc as ColorSource as number, cue.id + st);
        else if (a.lines !== 'none') {
          lines.position.set(0, 0);
          speedLines(lines, bw, h * 1.4, 0, Math.round(46 * k.density), lc as number, cue.id + st, 1.4);
        }
        lines.alpha = 0.55;
      }
    },
    unmount: () => {
      root?.destroy({ children: true });
      root = inner = lines = null;
      puppet = null;
    },
  });
};

function layoutOf(name: string, n: number): number[][] {
  const g = 18; // gutter
  const L = 80;
  const T = 70;
  const R = W - 80;
  const B = H - 70;
  const w = R - L;
  const h = B - T;
  switch (name) {
    case 'h2':
      return [
        [L, T, L + w / 2 - g / 2 + 60, T, L + w / 2 - g / 2 - 60, B, L, B],
        [L + w / 2 + g / 2 + 60, T, R, T, R, B, L + w / 2 + g / 2 - 60, B],
      ];
    case 'v3':
      return [0, 1, 2].map((i) => {
        const y0 = T + (h / 3) * i + (i ? g / 2 : 0);
        const y1 = T + (h / 3) * (i + 1) - (i < 2 ? g / 2 : 0);
        const sk = 40;
        return [L, y0 + sk * (i ? 1 : 0), R, y0 - sk * (i ? 1 : 0), R, y1 - sk * (i < 2 ? 1 : 0), L, y1 + sk * (i < 2 ? 1 : 0)];
      });
    case 'grid4':
      return [
        [L, T, L + w * 0.55 - g / 2, T, L + w * 0.5 - g / 2, T + h / 2 - g / 2, L, T + h / 2 - g / 2],
        [L + w * 0.55 + g / 2, T, R, T, R, T + h / 2 - g / 2, L + w * 0.5 + g / 2, T + h / 2 - g / 2],
        [L, T + h / 2 + g / 2, L + w * 0.45 - g / 2, T + h / 2 + g / 2, L + w * 0.4 - g / 2, B, L, B],
        [L + w * 0.45 + g / 2, T + h / 2 + g / 2, R, T + h / 2 + g / 2, R, B, L + w * 0.4 + g / 2, B],
      ];
    case 'diag2':
      return [
        [L, T, R, T, R, T + h * 0.38, L, T + h * 0.62],
        [L, T + h * 0.62 + g, R, T + h * 0.38 + g, R, B, L, B],
      ];
    case 'diag3':
    default:
      return [
        [L, T, L + w * 0.42, T, L + w * 0.3, B, L, B],
        [L + w * 0.42 + g, T, L + w * 0.74, T, L + w * 0.62, B, L + w * 0.3 + g, B],
        [L + w * 0.74 + g, T, R, T, R, B, L + w * 0.62 + g, B],
      ].slice(0, Math.max(1, n));
  }
}

const panels: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, k.bar * 2);
  const cells = (Array.isArray(a.cells) ? a.cells : []) as Args[];
  const polys = layoutOf(String(a.layout ?? 'diag3'), cells.length);
  const stagger = num(a, 'stagger', 1) * k.beat;
  let root: Container | null = null;
  const parts: { c: Container; lines: Graphics; poly: number[]; t0: number; cell: Args; last: number; dir: number }[] = [];
  return clip(cue.m, d, {
    z: num(a, 'z', 2),
    mount: () => {
      root = new Container();
      root.zIndex = 5;
      // the page: an ink field behind the cells (gutters read as ink)
      const page = new Graphics().rect(k.view.x - 20, k.view.y - 20, k.view.w + 40, k.view.h + 40).fill(palCol(k, a.page, 'ink'));
      root.addChild(page);
      cells.forEach((cell, i) => {
        const poly = polys[i % polys.length];
        const xs = poly.filter((_, j) => j % 2 === 0);
        const ys = poly.filter((_, j) => j % 2 === 1);
        const bx = (Math.min(...xs) + Math.max(...xs)) / 2;
        const by = (Math.min(...ys) + Math.max(...ys)) / 2;
        const bw = Math.max(...xs) - Math.min(...xs);
        const bh = Math.max(...ys) - Math.min(...ys);
        const c = new Container();
        const fill = new Graphics().poly(poly).fill(palCol(k, cell.color, i % 2 ? 'accent2' : 'accent'));
        const lines = new Graphics();
        const content = new Container();
        content.addChild(lines);
        if (typeof cell.who === 'string') {
          const f = faceIn(k, whoOf(k, cell.who), bw, bh, num(cell, 'face', 1.15), !!cell.flip, 0.5);
          f.c.position.set(bx, by);
          content.addChild(f.c);
          if (f.p && typeof cell.emote === 'string') f.p.emote(cell.emote as 'happy', 1);
        }
        if (typeof cell.sfx === 'string') {
          const kp = { pal: k.palFor(cue) } as Kit;
          const t = k.text.sprite(cell.sfx, SFX_STYLE(num(cell, 'size', 90), palCol(kp, cell.sfxColor, 'light'), palCol(kp, 'ink')));
          t.position.set(bx + bw * 0.18, by + bh * 0.28);
          t.rotation = -0.1;
          content.addChild(t);
        }
        const mask = new Graphics().poly(poly).fill(0xffffff);
        content.mask = mask;
        const border = new Graphics().poly(poly).stroke({ width: 10, color: palCol(k, 'light'), alignment: 0.5 });
        c.addChild(fill, content, mask, border);
        root!.addChild(c);
        parts.push({ c, lines, poly, t0: i * stagger, cell, last: -1, dir: i % 2 ? 1 : -1 });
      });
      k.layers.panels.addChild(root);
    },
    update: (lt) => {
      if (!root) return;
      const outT = 0.12;
      for (const p of parts) {
        const x = lt - p.t0;
        p.c.visible = x >= 0;
        if (x < 0) continue;
        const sIn = x < 0.1 ? ease('expoOut', Math.floor((x / 0.1) * 3) / 3) : 1;
        p.c.x = p.dir * (1 - sIn) * 500;
        p.c.alpha = sIn;
        const st = Math.floor(k.m * 12);
        if (st !== p.last) {
          p.last = st;
          p.lines.clear();
          const xs = p.poly.filter((_, j) => j % 2 === 0);
          const ys = p.poly.filter((_, j) => j % 2 === 1);
          const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
          const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
          focusLines(p.lines, cx, cy, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 140, 48, palCol(k, p.cell.lineColor, 'light'), cue.id * 3 + st + p.t0 * 100);
          p.lines.alpha = 0.5;
        }
      }
      root.alpha = lt > d - outT ? Math.max(0, (d - lt) / outT) : 1;
      // the page itself shows only while a cell does (it's the gutter ink)
      (root.children[0] as Graphics).alpha = Math.min(1, lt / 0.06);
    },
    unmount: () => {
      root?.destroy({ children: true });
      root = null;
      parts.length = 0;
    },
  });
};

export const PANEL_VERBS: Record<string, VerbFn> = { cutin, panels };
