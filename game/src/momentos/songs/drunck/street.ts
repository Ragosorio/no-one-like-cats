/**
 * LA ÚLTIMA RONDA — the alley outside (set 'calle' of scenes/CajaScene.ts), split out of bar.ts so the bar (shared with
 * the Momento «Drunck») and the alley (the way home with Luzterna, H67) can be polished separately. Owner: LUZ.
 *
 * CALLE: the bar's facade (the neon «LA ÚLTIMA RONDA», whose last A flickers), a wet alley running right with lamp
 *   posts and puddles, and at the far end a cat flap painted on a wall with a tiny lighthouse drawn next to it.
 *
 * What the walk home (scenes/caja/calle.ts) plays with (all 0..1 unless said):
 *   `bend`        tramo 1: the alley bends in drunk perspective (a wobble filter on the walls and posts only)
 *   `wave`        tramo 2–3: «El piso se mueve» — the street surface waves (`waveAt(x)` tells where); `freeze` holds it
 *                 (her stamp) and `thunk` is the flattening rebound
 *   `rainK`       rain density and speed (1 = the usual downpour; tramo 3 calms it)
 *   `glow`        the painted cat flap lights up, warm (V1–V5: the backlight)
 *   `flap`        the flap swings (V5, he goes through): 0 shut … 1 wide open
 *   `lantern` / `lanternK`  where her blue light is (world x) and how bright (her light dips on «ya me pasó todo»)
 */
import { Container, Filter, GlProgram, Graphics } from 'pixi.js';
import { LW, TV, box } from './tv';
import { CALLE } from './layout';
import { tvText } from './bar';

const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/** the painted cat flap: an arch on the far wall (bigger than a real flap: it has to frame two cats from behind) */
export const GATERA_ART = { w: 280, h: 330 } as const;
/**
 * Where the painted cat flap is (world x): the single source is `CALLE.gatera.x` (layout.ts). It sits at 4060 so the
 * camera can centre the backlit two-shot of V1/V5 without hitting the set's right edge (CALLE.right): at zoom 1.3 the
 * camera can't go past x ≈ 3960. Kept as an export so nothing that imported it breaks.
 */
export const GATERA_X = CALLE.gatera.x;
export const FAR_WALL_X = 3790;

const BEND_VERT = `in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;
vec4 filterVertexPosition(void) {
  vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
  return vec4(position, 0.0, 1.0);
}
vec2 filterTextureCoord(void) { return aPosition * (uOutputFrame.zw * uInputSize.zw); }
void main(void) { gl_Position = filterVertexPosition(); vTextureCoord = filterTextureCoord(); }`;
/** drunk perspective: horizontal lines sag and bulge, verticals lean with a slow sway (only the walls and posts) */
const BEND_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uInputClamp;
uniform float uAmp;
uniform float uTime;
void main() {
  vec2 span = uOutputFrame.zw * uInputSize.zw;
  vec2 p = vTextureCoord / span;
  float a = uAmp;
  vec2 c = p - 0.5;
  vec2 d;
  d.x = sin(p.y * 2.6 + uTime * 1.1) * 0.022 * a + c.x * c.y * 0.10 * a * sin(uTime * 0.7);
  d.y = sin(p.x * 5.0 + uTime * 1.6) * 0.016 * a + c.x * c.x * 0.09 * a * sin(uTime * 0.9 + 1.0);
  vec2 uv = (p + d) * span;
  finalColor = texture(uTexture, clamp(uv, uInputClamp.xy, uInputClamp.zw));
}`;

// ================================================================== THE ALLEY
export class StreetSet {
  readonly root = new Container();
  readonly back = new Container();
  readonly cast = new Container();
  readonly front = new Container();
  readonly fx = new Container();
  private rainG = new Graphics();
  private signG = new Container();
  private signA = new Container();
  private puddles = new Graphics();
  private doorG = new Graphics();
  private glowG = new Graphics();
  private glowStatic = new Graphics();
  private flapG = new Graphics();
  private streetFlat = new Graphics();
  private streetWave = new Graphics();
  private bendF: Filter | null = null;
  /** the door: 0 shut … 1 kicked open */
  door = 0;
  /** the last A of the sign: lit (1) or out (0) */
  signOn = 1;
  /** Luzterna's lantern light coming down the alley: world x (null = none) and its brightness */
  lantern: number | null = null;
  lanternK = 1;
  bend = 0;
  wave = 0;
  /** her stamp: the waves freeze at this time (null = moving) */
  freeze: number | null = null;
  /** the flattening rebound after the stamp (0..1, decays) */
  thunk = 0;
  rainK = 1;
  glow = 0;
  flap = 0;
  private waveT = 0;
  private lastT = 0;

  constructor() {
    this.root.addChild(this.back, this.cast, this.front, this.fx);
    this.drawBack();
  }

  /** the street surface height at world x (0 = flat ground; negative = up) */
  waveAt(x: number) {
    const a = this.wave * 34;
    if (a < 0.01) return 0;
    return Math.sin(x * 0.0062 - this.waveT * 3.1) * a + Math.sin(x * 0.0021 + this.waveT * 1.3) * a * 0.45;
  }

  private drawBack() {
    const b = this.back;
    const { left, right, ground } = CALLE;
    const g = new Graphics();
    // the night sky between the buildings, flat bands
    g.rect(left, -400, right - left, 500).fill(0x10163a);
    g.rect(left, 100, right - left, 200).fill(0x161f4a);
    for (let i = 0; i < 40; i++) g.circle(left + rnd(i) * (right - left), -380 + rnd(i + 7) * 420, 3 + rnd(i + 3) * 3).fill(TV.cream);
    // far buildings (flat silhouettes with lit windows)
    for (let i = 0; i < 26; i++) {
      const x = left + i * 230;
      const h = 380 + rnd(i) * 300;
      g.rect(x, ground - h - 120, 210, h).fill(i % 2 ? 0x1b2552 : 0x202c60);
      for (let j = 0; j < 6; j++) if (rnd(i * 11 + j) > 0.55) g.rect(x + 24 + (j % 3) * 60, ground - h - 80 + Math.floor(j / 3) * 90, 28, 40).fill(TV.amberL);
    }
    // the alley's near wall: brick, from the bar to the end
    g.rect(left, 120, right - left, ground - 120).fill(TV.brick);
    for (let row = 0; row < 26; row++) {
      const y = 140 + row * 30;
      if (y > ground - 20) break;
      for (let x = left + (row % 2) * 40; x < right; x += 80) if (rnd(row * 101 + x) > 0.82) g.rect(x + 4, y + 4, 70, 22).fill(TV.brickD);
      g.moveTo(left, y).lineTo(right, y).stroke({ width: 2, color: TV.brickD });
    }
    // the bar's facade: dark wood, a lit window, the door
    box(g, 60, 220, 900, ground - 220, TV.woodD, { r: 0 });
    box(g, 120, 420, 260, 300, TV.amber, { r: 6 });
    g.rect(120, 560, 260, 8).fill(TV.line).rect(246, 420, 8, 300).fill(TV.line);
    b.addChild(g);
    // the patrons' silhouettes in the window (the bar is full of noise)
    const sil = new Graphics();
    for (let i = 0; i < 3; i++) {
      const x = 160 + i * 80;
      sil.ellipse(x, 690, 34, 50).fill(TV.amberD);
      sil.circle(x, 630, 26).fill(TV.amberD);
      sil.poly([x - 22, 616, x - 14, 590, x - 4, 612]).fill(TV.amberD);
      sil.poly([x + 4, 612, x + 14, 590, x + 22, 616]).fill(TV.amberD);
    }
    b.addChild(sil, this.doorG);
    // the neon sign «LA ÚLTIMA RONDA» over the door (its last A flickers)
    const plate = new Graphics();
    box(plate, 170, 196, 700, 150, 0x2a1838, { shadow: TV.line });
    const main = tvText('LA ÚLTIMA ROND', 84, 0xffe1f0, { stroke: TV.neonPink, strokeW: 10, spacing: 4 });
    main.anchor.set(0, 0.5);
    main.position.set(205, 272);
    const a = tvText('A', 84, 0xffe1f0, { stroke: TV.neonPink, strokeW: 10, spacing: 4 });
    a.anchor.set(0, 0.5);
    a.position.set(205 + main.width - 4, 272);
    const aOff = tvText('A', 84, 0x4a2a44, { stroke: 0x2a1838, strokeW: 10, spacing: 4 });
    aOff.anchor.set(0, 0.5);
    aOff.position.set(a.x, a.y);
    this.signA.addChild(aOff, a);
    this.signG.addChild(plate, main, this.signA);
    b.addChild(this.signG);
    // lamp posts (Canelo leans on them), a trash can, the far wall with the painted cat flap and a tiny lighthouse
    const fr = new Graphics();
    for (const x of CALLE.posts) {
      fr.rect(x - 12, 280, 24, ground - 280).fill(TV.nightL).stroke({ width: LW, color: TV.line });
      fr.roundRect(x - 40, 250, 80, 44, 10).fill(TV.nightD).stroke({ width: LW, color: TV.line });
      fr.ellipse(x, 296, 30, 12).fill(TV.amberL);
      fr.poly([x - 170, ground, x - 28, 300, x + 28, 300, x + 170, ground]).fill({ color: TV.amberL, alpha: 0.12 });
    }
    box(fr, 1800, ground - 150, 120, 150, 0x5a6a7a, { shadow: TV.line, r: 10 });
    fr.roundRect(1790, ground - 168, 140, 26, 8).fill(0x6e8090).stroke({ width: LW, color: TV.line });
    // the far wall (end of the alley)
    box(fr, FAR_WALL_X, 120, right - FAR_WALL_X, ground - 120, 0x8a3a30, { r: 0 });
    for (let row = 0; row < 26; row++) {
      const y = 150 + row * 34;
      if (y > ground - 20) break;
      fr.moveTo(FAR_WALL_X + 4, y).lineTo(right - 4, y).stroke({ width: 2, color: 0x6e2c26 });
    }
    b.addChild(fr);
    // the painted gatera: an arch with a flap, and next to it a tiny lighthouse drawn in chalk; its warm light (glowG)
    // sits between the wall and the arch so the cats in front get a real backlight
    this.glowG.blendMode = 'add';
    const gsx = GATERA_X + 10;
    const gsy = ground - 300;
    const gs = this.glowStatic;
    const lerpC = (a: number, b2: number, q: number) => {
      const r = Math.round(((a >> 16) & 255) + (((b2 >> 16) & 255) - ((a >> 16) & 255)) * q);
      const gg = Math.round(((a >> 8) & 255) + (((b2 >> 8) & 255) - ((a >> 8) & 255)) * q);
      const bb = Math.round((a & 255) + ((b2 & 255) - (a & 255)) * q);
      return (r << 16) | (gg << 8) | bb;
    };
    for (let i = 0; i < 28; i++) {
      const q = i / 27;
      const r = 860 - q * 800;
      gs.ellipse(0, 0, r, r * 0.86).fill({ color: lerpC(0xff7a30, 0xfff2d8, q), alpha: 0.055 });
    }
    gs.ellipse(0, ground + 30 - gsy, 660, 84).fill({ color: 0xffc070, alpha: 0.28 });
    gs.position.set(gsx, gsy);
    gs.blendMode = 'add';
    gs.visible = false;
    b.addChild(gs, this.glowG);
    const gt = new Graphics();
    const gx = GATERA_X;
    const { w, h } = GATERA_ART;
    gt.roundRect(gx - w / 2, ground - h, w, h, w / 2).fill(0x1a1430).stroke({ width: LW, color: TV.line });
    gt.roundRect(gx - w / 2 + 22, ground - h + 22, w - 44, h - 22, w / 2 - 22).stroke({ width: 4, color: TV.cream });
    const lx = gx + w / 2 + 70;
    gt.moveTo(lx, ground - 24).lineTo(lx - 12, ground - 230).lineTo(lx + 54, ground - 230).lineTo(lx + 42, ground - 24).closePath().stroke({ width: 4, color: TV.cream });
    gt.moveTo(lx - 18, ground - 230).lineTo(lx + 21, ground - 270).lineTo(lx + 60, ground - 230).stroke({ width: 4, color: TV.cream });
    gt.moveTo(lx + 21, ground - 250).lineTo(lx + 150, ground - 310).stroke({ width: 3, color: TV.amberL });
    gt.moveTo(lx + 21, ground - 250).lineTo(lx + 150, ground - 196).stroke({ width: 3, color: TV.amberL });
    b.addChild(gt, this.flapG);
    // the wet street (flat; while it waves a live copy draws instead)
    const st = this.streetFlat;
    st.rect(left, ground, right - left, 400).fill(0x2a2f4a);
    st.moveTo(left, ground).lineTo(right, ground).stroke({ width: LW, color: TV.line });
    for (let i = 0; i < 30; i++) st.rect(left + i * 200 + 40, ground + 60 + (i % 3) * 40, 90, 6).fill(0x353b5c);
    this.front.addChild(st, this.streetWave, this.puddles);
    this.front.addChild(this.rainG);
  }

  update(t: number) {
    const dt = clamp(t - this.lastT, 0, 0.1);
    this.lastT = t;
    if (this.freeze === null) this.waveT += dt;
    this.thunk = Math.max(0, this.thunk - dt * 1.8);
    // the last A: dies for a few frames, comes back (the TV-cartoon flicker), or is held by the cine
    const flick = this.signOn >= 1 ? (Math.sin(t * 3.1) + Math.sin(t * 11.3) > 1.55 ? 0 : 1) : this.signOn;
    this.signA.children[1].alpha = flick;
    // the door (kicked open: it swings and the bar's amber spills out)
    const d = this.doorG;
    d.clear();
    const { x, y } = CALLE.door;
    d.rect(x - 110, y - 330, 220, 330).fill(this.door > 0.05 ? TV.amberL : 0x2a1838).stroke({ width: LW, color: TV.line });
    const w = 220 * (1 - this.door * 0.85);
    box(d, x - 110, y - 330, w, 330, TV.green, { r: 2 });
    if (w > 60) d.circle(x - 110 + w - 26, y - 160, 12).fill(TV.amberL).stroke({ width: 4, color: TV.line });
    if (this.door > 0.05) d.poly([x - 110, y, x + 110, y, x + 260, y + 160, x - 260, y + 160]).fill({ color: TV.amberL, alpha: 0.25 * this.door });
    this.updateGatera(t);
    this.updateStreet(t, flick);
    this.updateBend(t);
    // rain across the alley (calmer when rainK drops; drops near her lantern catch its blue)
    const r = this.rainG;
    r.clear();
    const n = Math.round(120 * clamp(this.rainK, 0, 1));
    const lan = this.lantern;
    for (let i = 0; i < n; i++) {
      const sp = (1100 + rnd(i) * 600) * (0.55 + 0.45 * this.rainK);
      const x0 = CALLE.left + rnd(i + 50) * (CALLE.right - CALLE.left);
      const yy = ((rnd(i + 99) * 1100 + t * sp) % 1150) - 120;
      const xx = x0 - yy * 0.2;
      const near = lan !== null ? clamp(1 - Math.hypot(xx - lan, yy - (CALLE.ground - 330)) / 420, 0, 1) * this.lanternK : 0;
      r.moveTo(xx, yy).lineTo(xx - 10, yy + 40).stroke({ width: 4, color: near > 0.2 ? TV.lantern : TV.rain, alpha: 0.7 * (0.6 + 0.4 * this.rainK) + near * 0.3 });
    }
  }

  /** the cat flap's warm light (the backlight of V1–V5) and its swinging flap */
  private updateGatera(t: number) {
    const g = this.glowG;
    g.clear();
    const gx = GATERA_X;
    const { ground } = CALLE;
    const { w, h } = GATERA_ART;
    const k = clamp(this.glow, 0, 1);
    // the wall around the flap lights up (additive, drawn once: a smooth falloff of thin rings): the cats in front
    // stand against a warm, bright wall
    const gs = this.glowStatic;
    gs.visible = k > 0.01;
    if (gs.visible) {
      gs.alpha = k;
      gs.scale.set(1 + 0.03 * Math.sin(t * 2.3));
    }
    const f = this.flapG;
    f.clear();
    // the arch's inside: dark → a warm, lit doorway (someone left the light on at home)
    if (k > 0.01) {
      f.roundRect(gx - w / 2 + 22, ground - h + 22, w - 44, h - 22, w / 2 - 22).fill({ color: 0xffe2a0, alpha: 0.85 * k });
      f.roundRect(gx - w / 2 + 50, ground - h + 60, w - 100, h - 60, w / 2 - 50).fill({ color: 0xfff6e0, alpha: 0.7 * k });
    }
    // the flap itself: a door that swings up and in (seen as a squashing panel); lit from behind it glows amber
    const op = clamp(this.flap, 0, 1);
    const fh = (h - 120) * (1 - 0.85 * op);
    const fw = w - 90;
    const top = ground - h + 100;
    const lit = clamp(k * 1.4, 0, 1);
    f.roundRect(gx - fw / 2, top, fw, fh, 18).fill({ color: lit > 0.3 ? 0xffc46a : 0x2a2140, alpha: lit > 0.3 ? 0.55 : 0.95 }).stroke({ width: 4, color: lit > 0.3 ? 0xfff0d0 : TV.cream });
    if (fh > 40) f.circle(gx, top + fh - 24, 8).fill(TV.amberL);
  }

  /** the street: flat, or waving («El piso se mueve»), puddles riding it; her blue in the puddles */
  private updateStreet(t: number, flick: number) {
    const { left, right, ground } = CALLE;
    const waving = this.wave > 0.005 || this.thunk > 0.005;
    this.streetFlat.visible = !waving;
    const s = this.streetWave;
    s.clear();
    if (waving) {
      const pts: number[] = [];
      const step = 60;
      for (let x = left; x <= right + step; x += step) pts.push(x, ground + this.waveAt(x) + Math.sin(x * 0.01 + t * 30) * this.thunk * 10);
      const poly = [...pts, right + step, ground + 420, left, ground + 420];
      s.poly(poly).fill(0x2a2f4a);
      s.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) s.lineTo(pts[i], pts[i + 1]);
      s.stroke({ width: LW, color: TV.line });
      for (let i = 0; i < 30; i++) {
        const x = left + i * 200 + 40;
        s.rect(x, ground + 60 + (i % 3) * 40 + this.waveAt(x + 45) * 0.8, 90, 6).fill(0x353b5c);
      }
    }
    const p = this.puddles;
    p.clear();
    const lan = this.lantern;
    for (const [i, px] of [700, 1600, 2500, 3300, 4000].entries()) {
      const py = CALLE.ground + 60 + (i % 2) * 30 + this.waveAt(px) * 0.9;
      p.ellipse(px, py, 160, 26).fill(0x3a4470);
      if (px < 1400) p.ellipse(px - 30, py, 70, 8).fill({ color: TV.neonPink, alpha: 0.6 * flick });
      if (lan !== null && Math.abs(lan - px) < 600) p.ellipse(lan - (lan - px) * 0.3, py + 4, 60, 8).fill({ color: TV.lantern, alpha: 0.8 * this.lanternK * (1 - Math.abs(lan - px) / 600) });
    }
  }

  /** tramo 1: the drunk bend (a filter on the walls only: the cats and the street stay crisp) */
  private updateBend(t: number) {
    const on = this.bend > 0.01;
    if (on && !this.bendF) {
      this.bendF = new Filter({
        glProgram: GlProgram.from({ vertex: BEND_VERT, fragment: BEND_FRAG, name: 'calle-bend' }),
        resources: { u: { uAmp: { value: 0, type: 'f32' }, uTime: { value: 0, type: 'f32' } } },
      });
    }
    if (this.bendF) {
      const u = this.bendF.resources.u.uniforms as { uAmp: number; uTime: number };
      u.uAmp = clamp(this.bend, 0, 1);
      u.uTime = t;
    }
    const want = on && this.bendF ? [this.bendF] : [];
    if ((this.back.filters?.length ?? 0) !== want.length) this.back.filters = want;
  }

  destroy() {
    this.back.filters = [];
    this.bendF?.destroy();
    this.bendF = null;
    this.root.destroy({ children: true });
  }
}
