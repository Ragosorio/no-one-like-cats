/**
 * F04 — the silent-film kit: the round vignette, art-déco intertitles, the burnt morning sun, and the places of La
 * Borracha by day (drawn in code, flat greys with hard shadows; the post turns everything into orthochromatic B&W).
 */
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import type { Actor } from '../../../../momentos/anime/actor';
import type { FilmSet, FrameInfo, SceneCtx } from '../../../stage';
import { BAKE_UV } from '../../../bake';
import type { Baker } from '../../../bake';
import { siluetaKeep } from '../../../../momentos/songs/drunck/silueta';
import { TV, TvScreen, kitTex, rnd, seg, sm, word, wrapLines } from '../kit';

/** the film's grey line (rubber-hose cartoon ink) and flat greys of a sunny morning */
export const MU = { ink: 0x161214, d: 0x3a3436, m: 0x77706c, l: 0xb9b2aa, w: 0xeee8de, sky: 0xd8d2c8 } as const;
export const MLW = 6;

// ------------------------------------------------------------------ the round vignette (iris-shaped corners)
const VCACHE = new WeakMap<Baker, Texture>();
function vignetteTex(ctx: SceneCtx): Texture {
  let t = VCACHE.get(ctx.baker);
  if (!t) {
    t = ctx.baker.shade(
      'f04-vig',
      512,
      384,
      `${BAKE_UV}
void main() {
  vec2 uv = bakeUV() - 0.5;
  uv.x *= 1.333;
  float d = length(uv) / 0.62;
  float a = smoothstep(0.78, 1.04, d);
  finalColor = vec4(vec3(0.0), a);
}`,
      {},
      {},
      { res: 1 },
    );
    VCACHE.set(ctx.baker, t);
  }
  return t;
}
/** the 4:3 TV showing an old film: rounded TV corners, faint scanlines + the film's round vignette */
export class SilentScreen extends Container {
  private tv: TvScreen;
  private vig: Sprite;
  constructor(private ctx: SceneCtx) {
    super();
    this.vig = new Sprite(vignetteTex(ctx));
    this.tv = new TvScreen(ctx, { scan: 0.06, glare: 0.04, edge: 0.4 });
    this.addChild(this.vig, this.tv);
  }
  update(f?: FrameInfo) {
    const r = this.tv.rect();
    this.vig.position.set(r.x, r.y);
    this.vig.setSize(r.w, r.h);
    this.tv.update(f);
  }
}

// ------------------------------------------------------------------ intertitles (black card, art-déco frame)
export interface TitleSpec {
  t: number;
  dur: number;
  text: string;
  /** who speaks: a small italic line above («Homiau») */
  who?: string;
  size?: number;
}
/**
 * A silent-film intertitle: it REPLACES the picture (a black card over the 4:3), white Playfair lettering, a double
 * art-déco frame with stepped corners and fans. Built once; `update(lt)` shows whichever is due.
 */
export class Intertitles extends Container {
  private cards: { c: Container; s: TitleSpec }[] = [];
  constructor(ctx: SceneCtx, specs: TitleSpec[], o: { color?: number; ink?: number; plate?: number } = {}) {
    super();
    for (const s of specs) {
      const c = new Container();
      const g = new Graphics();
      g.rect(0, -300, 1920, 1680).fill(o.plate ?? 0x0b0a09);
      // the frame: two rules and stepped corners with little fans
      const x0 = 330;
      const y0 = 150;
      const w = 1260;
      const h = 780;
      const col = o.color ?? 0xe8dfca;
      g.rect(x0, y0, w, h).stroke({ width: 4, color: col });
      g.rect(x0 + 18, y0 + 18, w - 36, h - 36).stroke({ width: 1.5, color: col, alpha: 0.8 });
      for (const [cx, cy, sx, sy] of [
        [x0, y0, 1, 1],
        [x0 + w, y0, -1, 1],
        [x0, y0 + h, 1, -1],
        [x0 + w, y0 + h, -1, -1],
      ] as const) {
        for (let i = 0; i < 3; i++) g.rect(cx + sx * (30 + i * 16) - (sx < 0 ? 12 : 0), cy + sy * 30 - (sy < 0 ? 4 : 0), 12, 4).fill(col);
        for (let i = 0; i < 5; i++) {
          const a = (i / 4) * (Math.PI / 2);
          g.moveTo(cx + sx * 22, cy + sy * 22).lineTo(cx + sx * (22 + Math.cos(a) * 60), cy + sy * (22 + Math.sin(a) * 60)).stroke({ width: 2, color: col, alpha: 0.85 });
        }
      }
      // a small diamond rule above and below the text
      for (const yy of [y0 + 110, y0 + h - 110]) {
        g.moveTo(960 - 220, yy).lineTo(960 - 24, yy).stroke({ width: 2, color: col });
        g.moveTo(960 + 24, yy).lineTo(960 + 220, yy).stroke({ width: 2, color: col });
        g.poly([960, yy - 12, 972, yy, 960, yy + 12, 948, yy]).fill(col);
      }
      c.addChild(g);
      const size = s.size ?? (s.text.length > 40 ? 64 : s.text.length > 22 ? 76 : 92);
      const style = { fontFamily: 'Playfair Display', fontWeight: '700' as const, fontSize: size, fill: o.ink ?? 0xf3ecdc, align: 'center' as const, wordWrap: true, wordWrapWidth: 1040, lineHeight: size * 1.22, letterSpacing: 1 };
      const lines = wrapLines(s.text, style);
      const top = 540 - (lines.length * size * 1.22) / 2 + (s.who ? 26 : 0);
      lines.forEach((ln, i) => {
        const sp = word(ctx.k, ln, { ...style, wordWrap: false });
        sp.anchor.set(0.5, 0);
        sp.position.set(960, top + i * size * 1.22);
        c.addChild(sp);
      });
      if (s.who) {
        const wsp = word(ctx.k, `— ${s.who} —`, { fontFamily: 'Playfair Display', fontStyle: 'italic', fontSize: 38, fill: 0xbfb49c, letterSpacing: 2 });
        wsp.position.set(960, top - 40);
        c.addChild(wsp);
      }
      c.visible = false;
      this.addChild(c);
      this.cards.push({ c, s });
    }
  }
  /** whether a card covers the picture now */
  update(lt: number): boolean {
    let on = false;
    for (const { c, s } of this.cards) {
      const v = lt >= s.t && lt < s.t + s.dur;
      c.visible = v;
      if (v) {
        // a hard cut in (like a splice), a tiny jitter of the gate on twos
        const st = Math.floor(lt * 12);
        c.position.set(0, (rnd(st) - 0.5) * 3);
        on = true;
      }
    }
    return on;
  }
}

/** the look of every F04 scene: projector flicker capped with «Reducir destellos» (≤ 0.15) */
export const silentLook = (ctx: SceneCtx, extra: Record<string, number> = {}): FilmSet['look'] => () => ({ ...(ctx.rf ? { flicker: 0.12 } : {}), ...extra });

// ------------------------------------------------------------------ the burnt morning sun
/** a white sun with hard rays (the post's halation burns it) */
export function sun(ctx: SceneCtx, x: number, y: number, r = 90): Container {
  const c = new Container();
  const glow = new Sprite(kitTex(ctx, 'glow'));
  glow.anchor.set(0.5);
  glow.scale.set((r * 6) / 256);
  glow.blendMode = 'add';
  glow.alpha = 0.8;
  const g = new Graphics();
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    g.poly([Math.cos(a - 0.08) * r * 1.15, Math.sin(a - 0.08) * r * 1.15, Math.cos(a) * r * 1.9, Math.sin(a) * r * 1.9, Math.cos(a + 0.08) * r * 1.15, Math.sin(a + 0.08) * r * 1.15]).fill(MU.w);
  }
  g.circle(0, 0, r).fill(0xffffff).stroke({ width: MLW, color: MU.ink });
  c.addChild(glow, g);
  c.position.set(x, y);
  return c;
}

// ------------------------------------------------------------------ Luzterna without her painted lantern (it got away)
/**
 * A mask that hides the lantern of her painting (siluetaKeep region), so a code lantern can roll away and come back.
 * It is a child of the actor: it moves with her. `on` = hide the painted lantern.
 */
export function lanternHole(a: Actor | null): (on: boolean) => void {
  const p = a?.puppet;
  const r = siluetaKeep('luzterna')?.[0];
  if (!a || !p || !r) return () => undefined;
  const m = new Graphics();
  const s = p.scale.x;
  const ax = p.anchor.x * p.W;
  const ay = p.anchor.y * p.H;
  m.rect((-ax - 40) * s, (-ay - 40) * s, (p.W + 80) * s, (p.H + 80) * s).fill(0xffffff);
  m.ellipse((r[0] - ax) * s, (r[1] - ay) * s, r[2] * 1.15 * s, r[3] * 1.12 * s).cut();
  a.addChild(m);
  m.visible = false;
  return (on: boolean) => {
    m.visible = on;
    p.mask = on ? m : null;
  };
}
/** the code lantern (grey: an iron frame, a glowing glass), centre-bottom at 0,0; `glow` 0..1 */
export class Lantern extends Container {
  readonly light: Sprite;
  constructor(ctx: SceneCtx, s = 1) {
    super();
    const g = new Graphics();
    g.roundRect(-34, -110, 68, 96, 14).fill({ color: 0xf6f3ea, alpha: 0.95 }).stroke({ width: MLW, color: MU.ink });
    g.rect(-44, -18, 88, 18).fill(MU.d).stroke({ width: 5, color: MU.ink });
    g.rect(-40, -126, 80, 18).fill(MU.d).stroke({ width: 5, color: MU.ink });
    g.moveTo(-22, -126).quadraticCurveTo(0, -176, 22, -126).stroke({ width: 7, color: MU.ink });
    g.moveTo(-34, -64).lineTo(34, -64).stroke({ width: 4, color: MU.m });
    this.light = new Sprite(kitTex(ctx, 'glow'));
    this.light.anchor.set(0.5);
    this.light.position.set(0, -62);
    this.light.blendMode = 'add';
    this.light.tint = TV.lantern;
    this.addChild(this.light, g);
    this.scale.set(s);
  }
  glow(k: number) {
    this.light.scale.set(0.9 + k * 0.6);
    this.light.alpha = 0.4 + k * 0.6;
  }
}

/** a grey paw (rubber-hose: a soft arm ending in a round mitt with three toes), for mimes and offers */
export function paw(g: Graphics, x: number, y: number, rot: number, s = 1, fill: number = MU.l) {
  const c = Math.cos(rot);
  const n = Math.sin(rot);
  const P = (u: number, v: number): [number, number] => [x + (u * c - v * n) * s, y + (u * n + v * c) * s];
  const arm: number[] = [];
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * Math.PI;
    arm.push(...P(-130 + Math.cos(a + Math.PI) * 0, Math.sin(a) * 26));
  }
  g.poly([...P(-130, -26), ...P(10, -26), ...P(10, 26), ...P(-130, 26)]).fill(fill).stroke({ width: MLW, color: MU.ink, join: 'round' });
  const [mx, my] = P(30, 0);
  g.circle(mx, my, 40 * s).fill(fill).stroke({ width: MLW, color: MU.ink });
  for (const dv of [-22, 0, 22]) {
    const [tx, ty] = P(62, dv);
    g.circle(tx, ty, 13 * s).fill(fill).stroke({ width: 4, color: MU.ink });
  }
  const [bx, by] = P(24, 0);
  g.ellipse(bx, by, 14 * s, 12 * s).fill(MU.m);
  void arm;
}
/** a hand-drawn knitted scarf lying on the floor, centre x, y (a crumpled S with stripes and fringe) */
export function scarfOnFloor(g: Graphics, x: number, y: number, s = 1, fill: number = MU.l, stripe: number = MU.m) {
  const P = (u: number, v: number): [number, number] => [x + u * s, y + v * s];
  const pts: [number, number][] = [];
  for (let i = 0; i <= 20; i++) {
    const u = -240 + i * 24;
    pts.push(P(u, Math.sin(i * 0.55) * 26 - 10));
  }
  // the band (thick polyline as quads)
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    g.poly([ax, ay - 24 * s, bx, by - 24 * s, bx, by + 24 * s, ax, ay + 24 * s]).fill(i % 3 === 0 ? stripe : fill);
  }
  g.moveTo(pts[0][0], pts[0][1] - 24 * s);
  for (const [px, py] of pts) g.lineTo(px, py - 24 * s);
  g.stroke({ width: MLW, color: MU.ink });
  g.moveTo(pts[0][0], pts[0][1] + 24 * s);
  for (const [px, py] of pts) g.lineTo(px, py + 24 * s);
  g.stroke({ width: MLW, color: MU.ink });
  // the fringe at both ends
  for (const [ex, ey, d] of [
    [pts[0][0], pts[0][1], -1],
    [pts[pts.length - 1][0], pts[pts.length - 1][1], 1],
  ] as const) {
    for (let j = -2; j <= 2; j++) g.moveTo(ex, ey + j * 9 * s).lineTo(ex + d * 30 * s, ey + j * 11 * s + 6).stroke({ width: 4, color: MU.ink });
  }
}
export { sm, seg, rnd };

/**
 * An optional tap that landed (hit / great). DEV only: `&hit=<id>` forces it, so a contact sheet (scrub, no taps) can
 * show the tapped branch too.
 */
export function tapped(ctx: SceneCtx, id: string): boolean {
  const j = ctx.k.judged(id);
  if (j && (j.r === 'great' || j.r === 'hit')) return true;
  if (import.meta.env.DEV && typeof location !== 'undefined') return (new URLSearchParams(location.search).get('hit') ?? '').split(',').includes(id);
  return false;
}
