/**
 * EL FINAL · shared props, code-drawn (no raster; new story art is pending the owner — see STAND_INS):
 *   the island (sky / sea / ground / lighthouse / palm) in any light, Canelo's scarf on the ground, the scarf SHE was
 *   knitting (orange, ugly, unfinished), the lantern (whole / cracked / broken), the black strike-through, La Mano's
 *   white hand with its pen-nib claw, the cyan bubble of «te ODIO», the ink ship, and THE RULE IMAGE: a cone of light
 *   that covers the others while her own back stays in shadow (a dark overlay masked by her real silhouette).
 */
import { Container, Graphics, Mesh, Sprite, Text, type Texture } from 'pixi.js';
import type { Actor } from '../../../momentos/anime/actor';
import type { Baker } from '../../bake';
import { BAKE_UV } from '../../bake';
import type { SceneCtx } from '../../stage';
import { STANDINS } from '../../standins';
import { DEUDA_FALSA } from './deuda';

/**
 * The finale's cast (film/standins.ts): the approved paintings since FILM-CAST (2026-10-27) and La Mano's stand-in.
 * The name stays (every finale file reads it).
 */
export const STAND_INS = {
  /** REGISTRO 000 before he chooses fur: his static painting (never nadie_static_cat) */
  cerito: STANDINS.cerito,
  /**
   * Cerito with fur (pearl grey, the zero on his forehead), from F36 on. SAME RIG as the static one: F36 cross-fades
   * the two on one mesh (furOver, below)
   */
  ceritoGato: STANDINS.ceritoFur,
  /** La Mano, the incarnated Puppeteer: STAND-IN (pale, long; her right paw is a white hand with a pen-nib claw, code-drawn) */
  mano: STANDINS.mano,
  /** Homiau (his painting: yellow, the donut) */
  homiau: STANDINS.homiau,
  hipolito: 'hipolito_tavern_cat',
  espuma: 'espuma_bartender_cat',
  grafitera: 'grafitera_spray_cat',
  /** Maneki (his painting: the janitor with the broom) */
  maneki: STANDINS.maneki,
  /** Borrón (no hiccup; «sin dona» in F37 is framing: mano.ts) and Itō (no sword: his painting has none) */
  borron: STANDINS.borron,
  ito: STANDINS.ito,
};

/**
 * Cerito CHOOSES FUR on one body: a second mesh that SHARES the static puppet's geometry (the same rig: the two
 * paintings have the same outline, the same 700×700 space and the same rig — tests/catArtIntegrity.test.ts) and wears
 * the fur painting baked by the same style. It breathes, blinks and turns with the static one, vertex for vertex, so
 * the cross-fade never doubles an ear or an eye. `set(k)`: 0 static … 1 fur. Needs ceritoGato in the set's `cats`.
 */
export function furOver(ctx: SceneCtx, actor: Actor | null): { set(k: number): void } | null {
  const p = actor?.puppet;
  const fur = ctx.still(STAND_INS.ceritoGato);
  if (!actor || !p || !fur) return null;
  const m = new Mesh({ geometry: p.geometry, texture: fur.texture });
  m.scale.copyFrom(p.scale);
  m.position.copyFrom(p.position);
  m.alpha = 0;
  actor.addChild(m);
  fur.destroy();
  return {
    set(k: number) {
      const a = Math.max(0, Math.min(1, k));
      m.alpha = a;
      m.visible = a > 0.001;
      // the static fades under the fur (no grey halo left at the end)
      p.alpha = 1 - sm01(a);
    },
  };
}
const sm01 = (x: number) => x * x * (3 - 2 * x);

export const COL = {
  canelo: 0xd9662a,
  scarf: 0xc8402e,
  knit: 0xff8a2a,
  knitD: 0xc85a14,
  lanternBlue: 0x7fc4ff,
  cyan: 0x58e0ff,
  ink: 0x07060a,
  orange: 0xffa040,
};

export type Light = 'night' | 'storm' | 'dawn' | 'day' | 'dusk' | 'dark';
const SKY: Record<Light, [number, number, number]> = {
  night: [0x070b1c, 0x13204a, 0x23345e],
  storm: [0x05070b, 0x10151d, 0x1e2630],
  dawn: [0x1a2a52, 0x6a7898, 0xd9c4b0],
  day: [0x6fa0d0, 0x9fc4e2, 0xdfe8ee],
  dusk: [0x23204a, 0x8a4a5a, 0xf0a060],
  dark: [0x020203, 0x05060a, 0x0a0c12],
};
const SEA: Record<Light, [number, number]> = {
  night: [0x15264a, 0x070d1e],
  storm: [0x1a222c, 0x06090d],
  dawn: [0x5a6a86, 0x1c2640],
  day: [0x3f7fb0, 0x1f4a78],
  dusk: [0x6a4a6a, 0x23203f],
  dark: [0x06080e, 0x020304],
};
const hex3 = (h: number) => new Float32Array([((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255]);

/** a painted sky (3-stop gradient + soft clouds), w×h */
export function sky(b: Baker, light: Light, w = 3200, h = 1300, seed = 1): Texture {
  const [a, m, c] = SKY[light];
  return b.shade(
    `fin-sky-${light}-${seed}`,
    w,
    h,
    `${BAKE_UV}
void main() {
  vec2 uv = bakeUV();
  vec3 col = uv.y < 0.6 ? mix(uA, uM, uv.y / 0.6) : mix(uM, uC, (uv.y - 0.6) / 0.4);
  float cl = smoothstep(0.45, 0.85, fbm(vec2(uv.x * 4.0, uv.y * 2.2) + uSeed)) * (1.0 - uv.y * 0.6);
  col = mix(col, col * 1.35 + 0.03, cl * uCloud);
  col += (hash12(uv * uSize) - 0.5) * 0.015;
  finalColor = vec4(col, 1.0);
}`,
    { uA: { value: hex3(a), type: 'vec3<f32>' }, uM: { value: hex3(m), type: 'vec3<f32>' }, uC: { value: hex3(c), type: 'vec3<f32>' }, uSeed: { value: seed * 1.3, type: 'f32' }, uCloud: { value: light === 'storm' ? 0.9 : light === 'day' ? 0.5 : 0.35, type: 'f32' } },
    {},
    { res: 0.5 },
  );
}
/** the sea from the horizon down (gradient + horizontal glints) */
export function sea(b: Baker, light: Light, w = 3600, h = 700, seed = 2): Texture {
  const [a, c] = SEA[light];
  return b.shade(
    `fin-sea-${light}-${seed}`,
    w,
    h,
    `${BAKE_UV}
void main() {
  vec2 uv = bakeUV();
  vec3 col = mix(uA, uC, pow(uv.y, 0.7));
  float g = smoothstep(0.82, 1.0, vnoise(vec2(uv.x * 140.0, uv.y * 30.0) + uSeed)) * (1.0 - uv.y) * 0.25;
  col += g;
  finalColor = vec4(col, 1.0);
}`,
    { uA: { value: hex3(a), type: 'vec3<f32>' }, uC: { value: hex3(c), type: 'vec3<f32>' }, uSeed: { value: seed, type: 'f32' } },
    {},
    { res: 0.5 },
  );
}

/** the island ground (a mound with sand and grass), the palm, the lighthouse; returns the lamp point */
export interface Island {
  node: Container;
  lamp: [number, number];
  /** the top of the palm (where its leaves start) */
  palm: [number, number];
  ground: (x: number) => number;
  /** the lighthouse door / step (for the broken lantern) */
  step: [number, number];
}
export function island(light: Light, o: { x?: number; palmBend?: number } = {}): Island {
  const node = new Container();
  const g = new Graphics();
  const cx = o.x ?? 1150;
  const ground = (x: number) => 860 - 120 * Math.exp(-(((x - cx) / 700) ** 2)) - 10 * Math.sin(x / 70);
  const dim = light === 'night' || light === 'dark' ? 0.55 : light === 'storm' ? 0.45 : light === 'dawn' ? 0.75 : light === 'dusk' ? 0.8 : 1;
  const tone = (c: number) => {
    const r = Math.round(((c >> 16) & 255) * dim);
    const gg = Math.round(((c >> 8) & 255) * dim);
    const bb = Math.round((c & 255) * dim);
    return (r << 16) | (gg << 8) | bb;
  };
  const pts: number[] = [];
  for (let x = -800; x <= 2800; x += 40) pts.push(x, ground(x));
  pts.push(2800, 1400, -800, 1400);
  g.poly(pts).fill(tone(0xc9a874));
  const pts2: number[] = [];
  for (let x = -800; x <= 2800; x += 40) pts2.push(x, ground(x) + 26 + 8 * Math.sin(x / 33));
  pts2.push(2800, 1400, -800, 1400);
  g.poly(pts2).fill(tone(0x6f8a4a));
  // the palm
  const px = cx - 520;
  const py = ground(px);
  const bend = o.palmBend ?? 0;
  g.moveTo(px, py).quadraticCurveTo(px + 30 + bend * 0.5, py - 200, px + 60 + bend, py - 380).stroke({ width: 26, color: tone(0x7a5a3a), cap: 'round' });
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * 0.95 + (i * Math.PI * 0.9) / 6 + bend * 0.004;
    const tx = px + 60 + bend;
    const ty = py - 380;
    g.moveTo(tx, ty)
      .quadraticCurveTo(tx + Math.cos(a) * 120, ty + Math.sin(a) * 120 - 30, tx + Math.cos(a) * 230 + bend * 0.6, ty + Math.sin(a) * 200 + 40)
      .stroke({ width: 16, color: tone(0x3f6a3a), cap: 'round' });
  }
  // the lighthouse
  const lx = cx + 120;
  const ly = ground(lx) + 6;
  const tw = 70;
  const th = 420;
  g.poly([lx - tw, ly, lx + tw, ly, lx + tw * 0.66, ly - th, lx - tw * 0.66, ly - th]).fill(tone(0xeee6d4));
  for (const yy of [0.32, 0.62]) {
    const y0 = ly - th * yy;
    const w0 = tw * (1 - yy * 0.34);
    g.poly([lx - w0, y0, lx + w0, y0, lx + w0 * 0.95, y0 - 46, lx - w0 * 0.95, y0 - 46]).fill(tone(0xc0442e));
  }
  g.rect(lx - tw * 0.8, ly - th - 14, tw * 1.6, 14).fill(tone(0x2a2a30));
  g.rect(lx - tw * 0.5, ly - th - 74, tw, 60).fill(tone(0x3a3a44));
  g.poly([lx - tw * 0.62, ly - th - 74, lx + tw * 0.62, ly - th - 74, lx, ly - th - 120]).fill(tone(0x2a2a30));
  g.roundRect(lx - 22, ly - 74, 44, 74, 18).fill(tone(0x4a3a2a));
  g.rect(lx - 46, ly - 6, 92, 10).fill(tone(0x9a8a74));
  node.addChild(g);
  return { node, lamp: [lx, ly - th - 44], palm: [px + 60 + bend, py - 380], ground, step: [lx + 34, ly - 8] };
}

/** Canelo's scarf lying on the ground (red-orange knit with its fringe) */
export function scarfOnGround(w = 150): Graphics {
  const g = new Graphics();
  g.moveTo(-w / 2, 0).bezierCurveTo(-w / 4, -18, w / 4, 14, w / 2, -6).stroke({ width: 22, color: COL.scarf, cap: 'round' });
  for (let i = 0; i < 6; i++) g.moveTo(-w / 2 + 10 + i * 10, 6).lineTo(-w / 2 + 6 + i * 10, 20).stroke({ width: 3, color: 0xe86a4a });
  for (let i = 0; i < 9; i++) g.moveTo(-w / 2 + 14 + i * 15, -6 + Math.sin(i) * 4).lineTo(-w / 2 + 20 + i * 15, 6 + Math.sin(i) * 4).stroke({ width: 2, color: 0x8a2a1e, alpha: 0.6 });
  return g;
}
/** the scarf she was knitting: orange, ugly, uneven, unfinished — the needle still in it, a loose thread */
export function knitScarf(w = 170): Graphics {
  const g = new Graphics();
  const rows = 5;
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < 12; i++) {
      const x = -w / 2 + i * (w / 12) + (r % 2) * 5;
      const y = -18 + r * 8 + Math.sin(i * 1.7 + r) * 2.5;
      g.moveTo(x, y).lineTo(x + 6, y + 6).lineTo(x + 12, y).stroke({ width: 4, color: r % 2 ? COL.knit : COL.knitD, cap: 'round', join: 'round' });
    }
  }
  // the unfinished end: a needle and a loose orange thread (Canelo's hairs)
  g.moveTo(w / 2 + 2, -26).lineTo(w / 2 + 10, 26).stroke({ width: 3, color: 0xc8c8d0 });
  g.moveTo(w / 2 + 6, 6).bezierCurveTo(w / 2 + 40, 30, w / 2 + 20, 60, w / 2 + 60, 70).stroke({ width: 2, color: COL.knit });
  return g;
}
/** PASADA 7 · «deuda falsa pagada»: the switch lives in ./deuda (a plain module the flow can read) */
export { DEUDA_FALSA };

/** the pane that paid for Canelo: the right one of the two, black, a soot bloom and a cold glint (a scar, not a crack) */
export function spentPane(s = 1, broken = false): Graphics {
  const g = new Graphics();
  g.roundRect(1 * s, -43 * s, 16 * s, 51 * s, 2 * s).fill({ color: 0x07080c, alpha: 0.96 });
  g.ellipse(9 * s, -30 * s, 6 * s, 9 * s).fill({ color: 0x2a2620, alpha: 0.55 });
  g.ellipse(7 * s, -36 * s, 3 * s, 4 * s).fill({ color: 0x45403a, alpha: 0.4 });
  g.moveTo(14 * s, -40 * s).lineTo(14 * s, -28 * s).stroke({ width: 1.2 * s, color: 0xb8c4d8, alpha: broken ? 0.35 : 0.55 });
  return g;
}

/**
 * her lantern: brass cage, glass, flame; `broken` = cracked glass, bent cage, no flame. `spent` (pasada 7, only when
 * DEUDA_FALSA): the right pane is black — whole, the flame shows only through the left one; broken, the clear glass is
 * gone (a few shards on the cage) and the black pane is all that is left in the frame.
 */
export function lantern(broken = false, s = 1, spent = false): Container {
  const c = new Container();
  const g = new Graphics();
  const paid = spent && DEUDA_FALSA;
  if (!(broken && paid)) g.roundRect(-18 * s, -44 * s, 36 * s, 54 * s, 6 * s).fill({ color: broken ? 0x2a3440 : 0x9fd8ff, alpha: broken ? 0.7 : 0.55 });
  g.rect(-22 * s, -50 * s, 44 * s, 8 * s).fill(0x8a6a2a).rect(-22 * s, 8 * s, 44 * s, 8 * s).fill(0x8a6a2a);
  g.moveTo(0, -50 * s).quadraticCurveTo(-16 * s, -70 * s, 0, -78 * s).quadraticCurveTo(16 * s, -70 * s, 0, -50 * s).stroke({ width: 3 * s, color: 0x8a6a2a });
  for (const x of [-18, 0, 18]) g.moveTo(x * s, -44 * s).lineTo((x + (broken && x === 18 ? 6 : 0)) * s, 8 * s).stroke({ width: 2.5 * s, color: 0x6a4a1a });
  if (broken && paid) {
    // the clear pane fell: only shards stuck to the cage
    g.poly([-18 * s, -44 * s, -10 * s, -44 * s, -16 * s, -34 * s]).fill({ color: 0x9fd8ff, alpha: 0.4 });
    g.poly([-18 * s, 8 * s, -8 * s, 8 * s, -17 * s, -2 * s]).fill({ color: 0x9fd8ff, alpha: 0.35 });
  } else if (broken) {
    g.moveTo(-10 * s, -38 * s).lineTo(2 * s, -20 * s).lineTo(-6 * s, -4 * s).stroke({ width: 1.5 * s, color: 0xe8f0ff, alpha: 0.8 });
    g.moveTo(8 * s, -40 * s).lineTo(4 * s, -24 * s).lineTo(14 * s, -12 * s).stroke({ width: 1.5 * s, color: 0xe8f0ff, alpha: 0.8 });
  } else g.ellipse(0, -18 * s, 6 * s, 12 * s).fill(0xe8f6ff);
  c.addChild(g);
  if (paid) c.addChild(spentPane(s, broken));
  return c;
}
/** a thick ink stroke along points (ragged: several offset passes) — the strike-through */
export function inkStroke(g: Graphics, pts: [number, number][], w = 26, color: number = COL.ink, alpha = 1, seed = 1) {
  let s = seed * 9301;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let pass = 0; pass < 4; pass++) {
    const off = (pass - 1.5) * w * 0.18;
    g.moveTo(pts[0][0] + off, pts[0][1] - off);
    for (const p of pts.slice(1)) g.lineTo(p[0] + off + (r() - 0.5) * 4, p[1] - off + (r() - 0.5) * 4);
    g.stroke({ width: w * (0.55 + 0.15 * pass), color, alpha: alpha * (pass === 0 ? 0.5 : 0.85), cap: 'round', join: 'round' });
  }
}
/** points of a stroke drawn up to fraction p (for strokes that draw themselves) */
export function partial(pts: [number, number][], p: number): [number, number][] {
  if (p >= 1) return pts;
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = lens[lens.length - 1] * Math.max(0, p);
  const out: [number, number][] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (lens[i] <= L) out.push(pts[i]);
    else {
      const k = (L - lens[i - 1]) / Math.max(1e-6, lens[i] - lens[i - 1]);
      out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k]);
      break;
    }
  }
  return out;
}
/** La Mano's white hand with the pen-nib claw (code-drawn; she is pale and long) */
export function manoHand(s = 1): Graphics {
  const g = new Graphics();
  g.roundRect(-30 * s, -20 * s, 60 * s, 46 * s, 18 * s).fill(0xf4f2ee);
  for (let i = 0; i < 4; i++) g.roundRect((-28 + i * 15) * s, -54 * s, 12 * s, 40 * s, 6 * s).fill(0xf4f2ee);
  g.roundRect(26 * s, -10 * s, 26 * s, 12 * s, 6 * s).fill(0xf4f2ee);
  // the nib
  g.poly([-24 * s, -54 * s, -16 * s, -92 * s, -8 * s, -54 * s]).fill(0x1a1a22);
  g.moveTo(-16 * s, -88 * s).lineTo(-16 * s, -60 * s).stroke({ width: 1.5 * s, color: 0xd0d0d8 });
  g.roundRect(-30 * s, -20 * s, 60 * s, 46 * s, 18 * s).stroke({ width: 2 * s, color: 0xb8b4c0 });
  return g;
}
/** the ink ship: a black hull that shines wet, masts without sails */
export function inkShip(s = 1): Graphics {
  const g = new Graphics();
  g.poly([-260 * s, 0, 260 * s, 0, 200 * s, 70 * s, -210 * s, 70 * s]).fill(0x050508);
  g.poly([-240 * s, 4 * s, 240 * s, 4 * s, 230 * s, 14 * s, -232 * s, 14 * s]).fill({ color: 0x5a6a8a, alpha: 0.5 });
  for (const x of [-120, 20, 150]) g.rect(x * s, -320 * s, 10 * s, 320 * s).fill(0x050508);
  for (const x of [-120, 20, 150]) g.rect((x - 70) * s, -250 * s, 150 * s, 6 * s).fill(0x050508);
  g.moveTo(-260 * s, 0).lineTo(-330 * s, -40 * s).stroke({ width: 6 * s, color: 0x050508 });
  return g;
}
/** the cyan bubble of «te ODIO» (same shape, same cyan as Part II) */
export function bubble(r: number): Graphics {
  const g = new Graphics();
  g.circle(0, 0, r).fill({ color: COL.cyan, alpha: 0.12 });
  g.circle(0, 0, r).stroke({ width: 8, color: COL.cyan, alpha: 0.85 });
  g.circle(0, 0, r - 14).stroke({ width: 3, color: 0xd8faff, alpha: 0.6 });
  g.arc(0, 0, r - 30, -2.4, -1.6).stroke({ width: 10, color: 0xffffff, alpha: 0.45, cap: 'round' });
  return g;
}

/**
 * THE RULE, SHOWN: her light covers the others; her own back stays in shadow. A translucent cone from the lantern down
 * to the ground (the others inside it), and a dark overlay over HER outside the cone, masked by her real silhouette —
 * the exact line where the light ends crosses her body. `update(apex, base L/R, alpha)` each frame.
 */
export class RuleCone {
  readonly root = new Container();
  readonly cone = new Graphics();
  readonly shade = new Graphics();
  private mask: Sprite | null;
  constructor(silhouette: Sprite | null) {
    this.mask = silhouette;
    this.root.addChild(this.cone);
    if (silhouette) {
      silhouette.renderable = true;
      this.root.addChild(silhouette, this.shade);
      this.shade.mask = silhouette;
    }
  }
  /** place the mask like the puppet (same anchor, position, scale) */
  follow(x: number, y: number, sx: number, sy: number) {
    if (!this.mask) return;
    this.mask.position.set(x, y);
    this.mask.scale.set(sx, sy);
  }
  /** apex = the lantern; the cone spreads to [x0, x1] on the ground y; `side` = which side of the edge is shadow */
  draw(apex: [number, number], x0: number, x1: number, ground: number, alpha: number, shadowFromX: number, color: number = COL.lanternBlue, shadeAlpha = 1) {
    const c = this.cone;
    c.clear();
    if (alpha <= 0.001) {
      this.shade.clear();
      return;
    }
    c.poly([apex[0], apex[1], x1, ground, x0, ground]).fill({ color, alpha: 0.16 * alpha });
    c.poly([apex[0], apex[1], x1 - (x1 - x0) * 0.2, ground, x0 + (x1 - x0) * 0.2, ground]).fill({ color, alpha: 0.12 * alpha });
    c.ellipse((x0 + x1) / 2, ground, (x1 - x0) / 2, 26).fill({ color, alpha: 0.22 * alpha });
    // the edge of the light: a hard line from the apex down past her
    c.moveTo(apex[0], apex[1]).lineTo(x1, ground).stroke({ width: 3, color, alpha: 0.5 * alpha });
    // her back in shadow: everything on the far side of the edge, inside her silhouette
    const s = this.shade;
    s.clear();
    const dx = x1 - apex[0];
    const dy = ground - apex[1];
    const far = 3000;
    if (shadeAlpha > 0.001) s.poly([apex[0], apex[1] - far * 0.1, apex[0] + dx * 4, apex[1] + dy * 4, shadowFromX + far, apex[1] + far, shadowFromX + far, apex[1] - far]).fill({ color: 0x05060c, alpha: 0.78 * alpha * shadeAlpha });
  }
}

// ------------------------------------------------------------------ quick sets
/** sky + sea + island as planes (static), with an optional dark sheet; returns the island */
export function homeSet(ctx: SceneCtx, light: Light, o: { x?: number; dim?: number; palmBend?: number; skyZ?: number } = {}): Island {
  const b = ctx.baker;
  const far = new Container();
  far.addChild(Object.assign(new Sprite(sky(b, light, 3600, 1200, 3)), { x: -840, y: -500 }));
  ctx.plane(far, { z: o.skyZ ?? 4000, bake: 'static' });
  const mid = new Container();
  mid.addChild(Object.assign(new Sprite(sea(b, light, 4200, 800, 4)), { x: -1140, y: 600 }));
  ctx.plane(mid, { z: 1800, bake: 'static' });
  const isl = island(light, { x: o.x, palmBend: o.palmBend });
  const near = new Container();
  near.addChild(isl.node);
  if (o.dim) near.addChild(new Graphics().rect(-1200, -800, 4320, 2600).fill({ color: 0x03040a, alpha: o.dim }));
  ctx.plane(near, { z: 1000, bake: 'static' });
  return isl;
}
/** a lighthouse beam (a long soft fan) to rotate around the lamp */
export function beamFan(color: number, len = 1400, half = 0.09): Graphics {
  const g = new Graphics();
  for (let i = 0; i < 4; i++) {
    const h = half * (1 - i * 0.22);
    g.poly([0, 0, Math.cos(-h) * len, Math.sin(-h) * len, Math.cos(h) * len, Math.sin(h) * len]).fill({ color, alpha: 0.07 + i * 0.03 });
  }
  g.blendMode = 'add';
  return g;
}
/** a handwritten Bitácora card (her hand or the Capi's): lines appear one by one */
export function bitacoraCard(lines: string[], o: { hand?: 'luz' | 'capi'; w?: number; size?: number } = {}): { root: Container; texts: Text[] } {
  const root = new Container();
  const w = o.w ?? 520;
  const size = o.size ?? 30;
  const h = 70 + lines.length * size * 1.45;
  const g = new Graphics().roundRect(0, 0, w, h, 8).fill(0xf0e6cc).roundRect(0, 0, w, h, 8).stroke({ width: 2, color: 0xb8a67a });
  for (let i = 0; i < lines.length; i++) g.moveTo(24, 58 + i * size * 1.45).lineTo(w - 24, 58 + i * size * 1.45).stroke({ width: 1, color: 0x9ab0c8, alpha: 0.6 });
  root.addChild(g);
  const texts = lines.map((l, i) => {
    const t = new Text({ text: l, style: { fontFamily: o.hand === 'capi' ? 'Playfair Display' : 'Permanent Marker', fontStyle: o.hand === 'capi' ? 'italic' : 'normal', fontSize: size, fill: 0x2a2a4a } });
    t.position.set(26, 22 + i * size * 1.45);
    root.addChild(t);
    return t;
  });
  return { root, texts };
}
/** a painted stand-in face for La Mano: the stand-in cat, pale, with her white hand beside */
export function manoFigure(ctx: SceneCtx, bake: string, size: number): { root: Container; hand: Graphics } {
  const root = new Container();
  const a = ctx.actorAs(bake, STAND_INS.mano, size);
  if (a) {
    a.alpha = 0.95;
    if (a.puppet) a.puppet.tint = 0xe8e4f0;
    root.addChild(a);
  }
  const hand = manoHand(size / 300);
  hand.position.set(size * 0.32, -size * 0.45);
  root.addChild(hand);
  return { root, hand };
}
