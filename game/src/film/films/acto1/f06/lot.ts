/**
 * F06 EM%EN «Cuadra 8» — the shared pieces of every scene:
 *
 *   Lot        the karaoke turning into a parking lot (La Cuadra 8 spilling into the Borracha): asphalt patches on the
 *              carpet, a square painted on the ground, the ring of neighbours, the sodium lamp, the exit door
 *   Cast       the leads as puppets (driven only while their scene shows): Canelo, EMIAU (his painting), Luzterna,
 *              Hipólito asleep on a plastic chair, Oficial Dona, Doña Espuma, Homiau (the kit's, his painting)
 *   Crowd      the neighbours as stills that nod on the kick (cheap), Grafitera and Borrón among them, and EMIAU's
 *              crew from La Cuadra 8: Bocina and Scratch
 *   VhsHud     REC ●, the date «NOV 14 2:47 AM», tracking bands, the snow, the 4:3 TV
 *   Lyrics     the bars written on screen: big words that drop on the kick and the snare (onsets of the song)
 *   Wash       the washed-out tape over the colours, with a hole that grows from Canelo (the colour comes back)
 */
import { Container, Graphics, Sprite, TilingSprite, type Texture } from 'pixi.js';
import type { FrameInfo, SceneCtx } from '../../../stage';
import type { Actor } from '../../../../momentos/anime/actor';
import { sceneTimeline } from '../../../timeline';
import { Beam, Drive, HOMIAU, Homiau, TV, TvScreen, box, flame, kitTex, lanternAt, luzOf, outBack, rnd, seg, sm, tailTip, word, type LuzRig } from '../kit';
import { STANDINS } from '../../../standins';
import onsetsJson from '../../../../data/music/beatmaps/emen.onsets.json';

/** one bar of EM%EN (103 BPM) and bar n's start (bar 1 at 0) */
export const BAR = 240 / 103;
export const T = (c: number) => (c - 1) * BAR;
export const EMIAU = STANDINS.emiau;
/** EMIAU's crew (La Cuadra 8), in the ring of neighbours */
export const BOCINA = STANDINS.bocina;
export const SCRATCH = STANDINS.scratch;
export { HOMIAU };
/** the neighbours (STAND-INS: existing species, chosen NOT orange so the crowd never reads as a wall of Canelos) */
export const CROWD = ['nube_dream_cat', 'almohadon_pillow_cat', 'sonambulo_sleepwalker_cat', 'escarcha_frost_cat', 'burbujas_fizz_cat', 'cometin_stardust_cat'];
export const GRAFITERA = 'grafitera_spray_cat';
export const BORRON = STANDINS.borron;
export const HIPO = 'hipolito_tavern_cat';
export const ESPUMA = 'espuma_bartender_cat';
export const DONA = 'dona_police_cat';
export const SODIUM = 0xff9a3c;

/** the film time where this scene starts (for absolute bar timing inside a set) */
export const sceneStart = (ctx: SceneCtx) => sceneTimeline(ctx.film).scenes[ctx.index]?.start ?? 0;

// ------------------------------------------------------------------ the parking lot
export function lotBack(ctx: SceneCtx, o: { door?: boolean } = {}): Container {
  const c = new Container();
  const g = new Graphics();
  // the karaoke's back wall (night, a dead neon) turning into the sky of a parking lot
  g.rect(-500, -400, 2920, 900).fill(0x161a36);
  for (let i = 0; i < 30; i++) g.circle(-400 + rnd(i) * 2700, -300 + rnd(i + 4) * 500, 2 + rnd(i + 9) * 2).fill({ color: TV.cream, alpha: 0.6 });
  // the karaoke wall on the left half, the chain-link fence on the right half
  box(g, -500, 120, 1300, 480, 0x3a2a5a, { r: 0, line: false });
  for (let x = -480; x < 800; x += 120) g.rect(x, 140, 6, 460).fill({ color: 0x000000, alpha: 0.15 });
  const neonOff = word(ctx.k, 'KARAOKE', { fontFamily: 'Bangers', fontSize: 90, fill: 0x4a3a6a, stroke: { color: 0x2a1a3a, width: 8 }, letterSpacing: 8 });
  neonOff.position.set(150, 230);
  for (let x = 800; x < 2420; x += 46) {
    g.moveTo(x, 260).lineTo(x + 46, 600).stroke({ width: 3, color: 0x6a7090, alpha: 0.6 });
    g.moveTo(x + 46, 260).lineTo(x, 600).stroke({ width: 3, color: 0x6a7090, alpha: 0.6 });
  }
  g.rect(800, 250, 1620, 10).fill(0x6a7090);
  // the exit door (far right): it will glow when he wants to run
  if (o.door !== false) {
    box(g, 1560, 300, 200, 300, 0x2a2440, { r: 6 });
    g.rect(1580, 320, 160, 260).fill(0x3a3456);
    const s = word(ctx.k, 'SALIDA', { fontFamily: 'Anton', fontSize: 40, fill: 0x7fe08a, letterSpacing: 4 });
    s.position.set(1660, 280);
    c.addChild(s);
  }
  // the floor: carpet with asphalt patches (the Cuadra 8 spilling in), the painted square
  g.rect(-500, 600, 2920, 900).fill(0x5a2a4a);
  for (let i = 0; i < 10; i++) {
    const x = -300 + rnd(i + 20) * 2500;
    const y = 640 + rnd(i + 30) * 500;
    const pts: number[] = [];
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2;
      const r = 120 + rnd(i * 9 + k) * 140;
      pts.push(x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 0.5);
    }
    g.poly(pts).fill(0x2a2a36);
  }
  g.poly([600, 700, 1320, 700, 1560, 1060, 360, 1060]).stroke({ width: 10, color: 0xf3efe6, alpha: 0.85 });
  for (let i = 0; i < 6; i++) g.rect(380 + i * 200, 1000, 90, 10).fill({ color: 0xf3c84a, alpha: 0.7 });
  // the sodium lamp (left)
  g.rect(140, 40, 20, 580).fill(0x2a2a3a).stroke({ width: 4, color: TV.line });
  g.roundRect(100, 30, 150, 34, 12).fill(0x2a2a3a).stroke({ width: 4, color: TV.line });
  c.addChildAt(g, 0);
  c.addChild(neonOff);
  return c;
}

/** the sodium pool of light + the lamp's glow (live: it can go half out) */
export class Sodium extends Container {
  private pool: Sprite;
  private bulb: Sprite;
  constructor(ctx: SceneCtx) {
    super();
    this.pool = new Sprite(kitTex(ctx, 'glow'));
    this.pool.anchor.set(0.5);
    this.pool.position.set(700, 840);
    this.pool.scale.set(8, 3);
    this.pool.tint = SODIUM;
    this.pool.blendMode = 'add';
    this.bulb = new Sprite(kitTex(ctx, 'glow'));
    this.bulb.anchor.set(0.5);
    this.bulb.position.set(175, 64);
    this.bulb.scale.set(1.6);
    this.bulb.tint = SODIUM;
    this.bulb.blendMode = 'add';
    this.addChild(this.pool, this.bulb);
  }
  set(k: number) {
    this.pool.alpha = 0.32 * k;
    this.bulb.alpha = 0.9 * k;
  }
}

// ------------------------------------------------------------------ the crowd (stills that nod on the kick)
export interface CrowdOpts {
  /** rows: [y, scale, count, x0, x1] */
  rows?: [number, number, number, number, number][];
  /** extra named faces in the crowd */
  faces?: string[];
  tint?: number;
}
export class Crowd extends Container {
  private heads: { s: Sprite; y: number; ph: number }[] = [];
  constructor(ctx: SceneCtx, o: CrowdOpts = {}) {
    super();
    const rows = o.rows ?? [
      [640, 170, 9, 220, 1700],
      [720, 220, 7, 160, 1760],
    ];
    const faces = o.faces ?? [];
    let n = 0;
    for (const [y, size, count, x0, x1] of rows) {
      for (let i = 0; i < count; i++) {
        const slug = faces[n] ?? CROWD[(n * 5 + i) % CROWD.length];
        n++;
        const s = ctx.still(slug);
        if (!s) continue;
        s.scale.set(((i % 2 ? -1 : 1) * size * (0.9 + rnd(n) * 0.2)) / s.texture.height, (size * (0.9 + rnd(n) * 0.2)) / s.texture.height);
        const x = x0 + ((x1 - x0) * (i + 0.5)) / count + (rnd(n + 3) - 0.5) * 60;
        s.position.set(x, y);
        s.tint = o.tint ?? 0xd8d8e6;
        this.heads.push({ s, y, ph: rnd(n + 7) });
        this.addChild(s);
      }
    }
  }
  /** nod: 0..1 on the kick; turn: lean toward x (−1 left … 1 right); jump: the whole crowd hops */
  update(lt: number, o: { nod?: number; lean?: number; jump?: number; tint?: number } = {}) {
    for (const h of this.heads) {
      const nod = (o.nod ?? 0) * (0.6 + h.ph * 0.4);
      const j = (o.jump ?? 0) * (0.7 + h.ph * 0.6);
      h.s.y = h.y + nod * 10 - j * 60 * Math.abs(Math.sin(lt * 7 + h.ph * 6));
      h.s.rotation = (o.lean ?? 0) * 0.12;
      if (o.tint !== undefined) h.s.tint = o.tint;
    }
  }
}

// ------------------------------------------------------------------ the cast
export class Cast {
  readonly drive = new Drive();
  canelo: Actor | null = null;
  emiau: Actor | null = null;
  luz: LuzRig | null = null;
  hipo: Actor | null = null;
  dona: Actor | null = null;
  espuma: Actor | null = null;
  homiau: Homiau | null = null;
  readonly chain = new Graphics();
  readonly fx = new Graphics();
  readonly lglow: Sprite;
  constructor(
    private ctx: SceneCtx,
    want: { canelo?: number; emiau?: number; luz?: number; hipo?: number; dona?: number; espuma?: number; homiau?: number },
  ) {
    const d = this.drive;
    if (want.canelo) this.canelo = d.add(ctx.actor(ctx.canelo, want.canelo));
    if (want.emiau) this.emiau = d.add(ctx.actor(EMIAU, want.emiau));
    if (want.luz) {
      this.luz = luzOf(ctx, want.luz);
      d.add(this.luz.actor);
    }
    if (want.hipo) {
      this.hipo = d.add(ctx.actor(HIPO, want.hipo));
      if (this.hipo?.puppet) this.hipo.puppet.sleeping = true;
    }
    if (want.dona) this.dona = d.add(ctx.actor(DONA, want.dona));
    if (want.espuma) this.espuma = d.add(ctx.actor(ESPUMA, want.espuma));
    if (want.homiau) {
      this.homiau = new Homiau(ctx);
      this.homiau.scale.set(want.homiau);
      d.add(this.homiau.actor);
    }
    this.lglow = new Sprite(kitTex(ctx, 'glow'));
    this.lglow.anchor.set(0.5);
    this.lglow.tint = TV.lantern;
    this.lglow.blendMode = 'add';
  }
  /**
   * EMIAU's fish-bone chain was his readable trait over the stand-in; his painting wears its own chain now, so this
   * only keeps the layer empty (kept for the callers)
   */
  drawChain() {
    this.chain.clear();
  }
  /** Canelo's flame at his tail tip, size k */
  drawFlame(lt: number, k: number, color?: number) {
    const tip = tailTip(this.canelo);
    if (tip && this.canelo?.visible) flame(this.fx, tip[0], tip[1], k, lt, { rm: this.ctx.rm, scale: Math.abs(this.canelo.scale.y) * 1.4, color });
  }
  /** her lantern's glow (the only blue) */
  lantern(k: number, s = 1) {
    if (!this.luz?.actor) return;
    const [x, y] = lanternAt(this.luz);
    this.lglow.position.set(x, y);
    this.lglow.scale.set(s);
    this.lglow.alpha = k;
  }
}
export { Beam };

// ------------------------------------------------------------------ the tape: HUD, tracking, snow
export class VhsHud extends Container {
  readonly tv: TvScreen;
  private rec: Container;
  private dot: Graphics;
  private date: Sprite;
  private track: TilingSprite;
  private snow: TilingSprite;
  private stop: Sprite;
  constructor(private ctx: SceneCtx) {
    super();
    this.track = new TilingSprite({ texture: (ctx.tex('vh:track') as Texture) ?? kitTex(ctx, 'static'), width: 2200, height: 140 });
    this.track.alpha = 0;
    this.track.blendMode = 'add';
    this.snow = new TilingSprite({ texture: (ctx.tex('vh:snow') as Texture) ?? kitTex(ctx, 'static'), width: 2200, height: 1300 });
    this.snow.alpha = 0;
    this.snow.position.set(-140, -110);
    this.rec = new Container();
    this.dot = new Graphics().circle(0, 0, 16).fill(0xff3030);
    const rt = word(ctx.k, 'REC', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 40, fill: 0xf2f2f2, letterSpacing: 4, stroke: { color: 0x000000, width: 4 } }, 0);
    rt.anchor.set(0, 0.5);
    rt.position.set(30, 0);
    this.rec.addChild(this.dot, rt);
    this.date = word(ctx.k, 'NOV 14  2:47 AM', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 40, fill: 0xf8f0c0, letterSpacing: 3, stroke: { color: 0x000000, width: 4 } }, 1);
    this.date.anchor.set(1, 0.5);
    this.stop = word(ctx.k, '■ STOP', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 44, fill: 0xf2f2f2, letterSpacing: 4, stroke: { color: 0x000000, width: 4 } }, 0);
    this.stop.anchor.set(0, 0.5);
    this.stop.visible = false;
    this.tv = new TvScreen(ctx, { scan: 0.12 });
    this.addChild(this.snow, this.track, this.rec, this.date, this.stop, this.tv);
  }
  /**
   * rec 0..1 (the REC bug shows), track: a tracking band rolling up (0..1 strength), snow (0..1), stopped (REC → STOP)
   */
  update(lt: number, f: FrameInfo | undefined, o: { rec?: number; track?: number; snow?: number; stopped?: boolean; hudA?: number } = {}) {
    const r = this.tv.rect();
    const rec = o.rec ?? 1;
    this.rec.position.set(r.x + 70, r.y + 70);
    this.rec.alpha = rec * (o.hudA ?? 1);
    this.dot.visible = !o.stopped && (this.ctx.rf ? true : Math.floor(lt * 1.6) % 2 === 0);
    this.date.position.set(r.x + r.w - 60, r.y + r.h - 64);
    this.date.alpha = rec * (o.hudA ?? 1);
    this.stop.visible = !!o.stopped;
    this.stop.position.set(r.x + 70, r.y + 70);
    if (o.stopped) this.rec.alpha = 0;
    const tr = o.track ?? 0;
    this.track.alpha = tr * (this.ctx.rf ? 0.35 : 0.7);
    this.track.position.set(r.x - 100, r.y + r.h - ((lt * 520) % (r.h + 200)));
    this.track.tilePosition.x = Math.floor(lt * 12) * 37;
    const sn = o.snow ?? 0;
    this.snow.alpha = sn * (this.ctx.rf ? 0.5 : 1);
    if (sn > 0) this.snow.tilePosition.set(rnd(Math.floor(lt * 24)) * 400, rnd(Math.floor(lt * 24) + 1) * 400);
    this.tv.update(f);
  }
}

// ------------------------------------------------------------------ the bars on screen (kinetic type)
type Onsets = { tracks: Record<string, [number, number][]> };
const HITS: number[] = (() => {
  const t = (onsetsJson as unknown as Onsets).tracks;
  return [...(t.kick ?? []), ...(t.snare ?? [])].map((x) => x[0]).sort((a, b) => a - b);
})();
/** n instants inside [t0, t1): the song's own kicks and snares when there are enough, else even steps */
export function hitTimes(t0: number, t1: number, n: number): number[] {
  const inside = HITS.filter((t) => t >= t0 - 0.01 && t < t1 - 0.05);
  if (n <= 0) return [];
  if (inside.length >= n) {
    const out: number[] = [];
    for (let i = 0; i < n; i++) out.push(inside[Math.round((i * (inside.length - 1)) / Math.max(1, n - 1 || 1))] ?? inside[0]);
    out[0] = Math.min(out[0], t0 + 0.02);
    return out.map((t, i) => Math.max(t, i ? out[i - 1] + 0.12 : t));
  }
  return Array.from({ length: n }, (_, i) => t0 + ((t1 - t0) * i) / n);
}
export interface LineSpec {
  /** film times: the line starts / leaves */
  a: number;
  b: number;
  text: string;
  /** who says it (a small tag) */
  who?: string;
  /** 'top' | 'bottom' | 'center' | [x, y] */
  at?: 'top' | 'bottom' | 'center' | [number, number];
  size?: number;
  /** the confession: small, trembling, no shadow drama */
  small?: boolean;
  /** all at once (the remate in the silence) */
  whole?: boolean;
  color?: number;
  /** words drop on the hits (default) or even */
  even?: boolean;
}
interface Built {
  spec: LineSpec;
  root: Container;
  words: { c: Container; t: number }[];
  tag: Container | null;
}
/**
 * The bars of the battle, written on screen. Each word is two sprites (a hard black shadow + the face), dropped in on a
 * kick or a snare of the song, over a calm band of the frame (top or bottom), always above the effects.
 */
export class Lyrics extends Container {
  private lines: Built[] = [];
  constructor(
    private ctx: SceneCtx,
    specs: LineSpec[],
    private t0: number,
  ) {
    super();
    for (const sp of specs) {
      const size = sp.size ?? (sp.small ? 58 : sp.whole ? 140 : 92);
      const font = sp.small ? 'Space Grotesk' : 'Anton';
      const col = sp.color ?? (sp.small ? 0xf2f2f2 : 0xfff6e0);
      const style = { fontFamily: font, fontWeight: (sp.small ? '700' : '400') as '700', fontSize: size, fill: col, letterSpacing: sp.small ? 2 : size * 0.03 };
      const shadow = { ...style, fill: 0x0b0716 };
      const root = new Container();
      const ws = sp.text.split(' ');
      const parts: { c: Container; w: number }[] = [];
      for (const w of ws) {
        const c = new Container();
        const sh = word(ctx.k, w, shadow, 0);
        sh.anchor.set(0, 0.5);
        sh.position.set(size * 0.06, size * 0.07);
        const fg = word(ctx.k, w, { ...style, stroke: { color: 0x0b0716, width: sp.small ? 6 : size * 0.06, join: 'round' } }, 0);
        fg.anchor.set(0, 0.5);
        c.addChild(sh, fg);
        parts.push({ c, w: fg.width });
        root.addChild(c);
      }
      // lay out on one or two lines, max width 1300
      const space = size * 0.28;
      const rowsW: number[][] = [[]];
      let cur = 0;
      parts.forEach((p, i) => {
        if (cur + p.w > 1300 && rowsW[rowsW.length - 1].length) {
          rowsW.push([]);
          cur = 0;
        }
        rowsW[rowsW.length - 1].push(i);
        cur += p.w + space;
      });
      rowsW.forEach((row, ri) => {
        const total = row.reduce((s, i) => s + parts[i].w, 0) + space * (row.length - 1);
        let x = -total / 2;
        for (const i of row) {
          parts[i].c.position.set(x, (ri - (rowsW.length - 1) / 2) * size * 1.08);
          x += parts[i].w + space;
        }
      });
      const times = sp.whole ? ws.map(() => sp.a) : sp.even ? ws.map((_, i) => sp.a + ((sp.b - sp.a) * 0.6 * i) / ws.length) : hitTimes(sp.a, Math.min(sp.b, sp.a + BAR * 1.6), ws.length);
      if (sp.small) {
        let maxW = 0;
        for (const p of parts) maxW = Math.max(maxW, Math.abs(p.c.x) + p.w);
        const hgt = size * 1.08 * rowsW.length + 30;
        const plate = new Graphics().roundRect(-maxW - 40, -hgt / 2 - 6, maxW * 2 + 80, hgt + 12, 20).fill({ color: 0x07050d, alpha: 0.55 });
        root.addChildAt(plate, 0);
      }
      let tag: Container | null = null;
      if (sp.who) {
        tag = new Container();
        const tt = word(ctx.k, sp.who, { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 30, fill: 0x0b0716, letterSpacing: 4 });
        const tg = new Graphics().roundRect(-tt.width / 2 - 14, -22, tt.width + 28, 44, 10).fill(0xffd23a).stroke({ width: 4, color: 0x0b0716 });
        tag.addChild(tg, tt);
        tag.position.set(0, -size * (0.5 + (rowsW.length - 1) * 0.54) - 34);
        root.addChild(tag);
      }
      this.lines.push({ spec: sp, root, words: parts.map((p, i) => ({ c: p.c, t: times[i] })), tag });
      this.addChild(root);
    }
  }
  update(lt: number) {
    const m = this.t0 + lt;
    const rm = this.ctx.rm;
    const r = this.ctx.k.view;
    for (const L of this.lines) {
      const sp = L.spec;
      const on = m >= sp.a - 0.05 && m < sp.b;
      L.root.visible = on;
      if (!on) continue;
      const at = sp.at ?? 'top';
      const [x, y] = Array.isArray(at) ? at : at === 'top' ? [960, r.y + 175] : at === 'bottom' ? [960, r.y + r.h - 190] : [960, 520];
      const out = seg(m, sp.b - 0.22, sp.b);
      L.root.position.set(x, y - (rm ? 0 : out * 30));
      L.root.alpha = 1 - out;
      if (L.tag) L.tag.alpha = sm(seg(m, sp.a, sp.a + 0.2));
      for (const w of L.words) {
        const p = seg(m, w.t, w.t + (sp.whole ? 0.35 : 0.16));
        w.c.visible = m >= w.t - 0.001;
        if (!w.c.visible) continue;
        if (rm) {
          w.c.alpha = sm(p * 1.5);
          w.c.scale.set(1);
          continue;
        }
        w.c.alpha = 1;
        const s = sp.small ? 1 + (1 - p) * 0.3 : 1 + (1 - outBack(p, 2.2)) * 0.9;
        w.c.scale.set(s);
        if (sp.small) {
          // trembling
          const st = Math.floor(m * 12);
          w.c.pivot.set((rnd(st + w.t * 7) - 0.5) * 3, (rnd(st + 3 + w.t * 5) - 0.5) * 3);
        }
      }
    }
  }
}

// ------------------------------------------------------------------ the wash (washed tape over the colour, a hole from Canelo)
export class Wash extends Graphics {
  /** k = wash strength (0..1); hole = [x, y, r] in screen px (r grows); soft edge rings */
  private key = '';
  draw(k: number, hole: [number, number, number] | null, color = 0x4a4238) {
    // the same wash as last frame: nothing to rebuild (the hole only moves while it grows)
    const key = `${k.toFixed(3)},${hole ? hole.map((v) => v.toFixed(1)).join(',') : '-'},${color}`;
    if (key === this.key) return;
    this.key = key;
    this.clear();
    if (k <= 0.003) return;
    const ring = (r0: number) => {
      const pts: number[] = [];
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        pts.push(hole![0] + Math.cos(a) * r0, hole![1] + Math.sin(a) * r0 * 0.8);
      }
      return pts;
    };
    if (!hole || hole[2] <= 1) {
      this.rect(-400, -300, 2720, 1700).fill({ color, alpha: k * 0.34 });
      return;
    }
    const steps = 5;
    const soft = Math.max(60, hole[2] * 0.35);
    this.rect(-400, -300, 2720, 1700).fill({ color, alpha: k * 0.34 }).poly(ring(hole[2] + soft)).cut();
    for (let i = 0; i < steps; i++) {
      const r0 = hole[2] + (soft * i) / steps;
      const r1 = hole[2] + (soft * (i + 1)) / steps;
      this.poly(ring(r1)).fill({ color, alpha: k * 0.34 * ((i + 0.5) / steps) }).poly(ring(r0)).cut();
    }
  }
}
