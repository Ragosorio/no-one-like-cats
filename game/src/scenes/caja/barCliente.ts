/**
 * LA ÚLTIMA RONDA — A1, the patron thrown out of the bar (docs/part-iii/04 §2 A1; 13 §2.2: never a generic figure in
 * place of a character). A REAL painting through the Borracha's TV lens: Guijarro (`guijarro_pebble_cat`), a common cat
 * of this box's own roster (data/gateras/regiones.json) — not a story character, never Hipólito (the listener stays
 * hidden), Doña Espuma or Oficial Dona.
 *
 * The gag, ~2.6 s: the door bursts, he FLIES out spinning (stretched along the arc) → lands with a big SQUASH and a
 * puff of dust → a DIZZY beat (stars orbit his head, he sways, half-lidded) → he shakes it off, gets up → walks back in
 * and the door swallows him. «Reducir movimiento»: no spin, a short hop and a fade.
 */
import { Container, Graphics } from 'pixi.js';
import type { Studio } from '../../momentos/anime/actor';
import type { CatPuppet } from '../../art/livingCat';
import { CALLE } from '../../momentos/songs/drunck/layout';
import { TV } from '../../momentos/songs/drunck/tv';
import { star } from './barKit';
import { PATRON } from './barPrecarga';

/** the patron's painting (loaded through the TV lens with the house cats; rasterized early: barPrecarga.ts) */
export { PATRON };
/** the whole gag (s) */
export const PATRON_DUR = 2.6;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const smooth = (k: number) => {
  const x = clamp(k, 0, 1);
  return x * x * (3 - 2 * x);
};

/** the patron's pose at `k` seconds into the gag (pure: tests read it) */
export function patronPose(k: number, gentle = false): { x: number; y: number; rot: number; sx: number; sy: number; alpha: number; face: 1 | -1; dizzy: number; walk: number; door: number } {
  const x0 = CALLE.door.x + 40;
  const land = x0 + 500;
  const g = CALLE.ground;
  // 0–0.6: out of the door, spinning along the arc, stretched by the speed
  if (k < 0.6) {
    const q = k / 0.6;
    return { x: lerp(x0, land, q), y: g - Math.sin(q * Math.PI) * 240, rot: gentle ? 0 : q * Math.PI * 4, sx: 0.88, sy: 1.14, alpha: 1, face: 1, dizzy: 0, walk: 0, door: 1 };
  }
  // 0.6–0.85: lands — a big squash, a bounce
  if (k < 0.85) {
    const q = (k - 0.6) / 0.25;
    const s = Math.sin(q * Math.PI);
    return { x: land + q * 30, y: g - Math.abs(Math.sin(q * Math.PI * 1.5)) * 24 * (1 - q), rot: 0, sx: 1 + 0.38 * s, sy: 1 - 0.42 * s, alpha: 1, face: 1, dizzy: q, walk: 0, door: 1 - q };
  }
  // 0.85–1.6: dizzy — he sways on the spot, stars around his head
  if (k < 1.6) {
    const q = (k - 0.85) / 0.75;
    return { x: land + 30, y: g, rot: (gentle ? 0.04 : 0.16) * Math.sin(k * 11) * (1 - q * 0.5), sx: 1, sy: 1 - 0.05 * Math.abs(Math.sin(k * 11)), alpha: 1, face: 1, dizzy: 1, walk: 0, door: 0 };
  }
  // 1.6–1.85: shakes it off (a quick crouch → up)
  if (k < 1.85) {
    const q = (k - 1.6) / 0.25;
    return { x: land + 30, y: g, rot: 0.05 * Math.sin(q * Math.PI * 4), sx: 1 + 0.12 * Math.sin(q * Math.PI), sy: 1 - 0.14 * Math.sin(q * Math.PI), alpha: 1, face: -1, dizzy: 1 - q, walk: 0, door: 0 };
  }
  // 1.85–2.6: walks back in; the door opens for him and swallows him
  const q = clamp((k - 1.85) / 0.75, 0, 1);
  return { x: lerp(land + 30, x0, smooth(q)), y: g, rot: 0.04 * Math.sin(k * 14), sx: 1, sy: 1, alpha: 1 - clamp((q - 0.75) / 0.25, 0, 1), face: -1, dizzy: 0, walk: 1, door: clamp((q - 0.45) / 0.3, 0, 1) * (1 - clamp((q - 0.92) / 0.08, 0, 1)) };
}

export class PatronGag {
  readonly root = new Container();
  private body = new Container();
  private fx = new Graphics();
  private puppet: CatPuppet | null;
  private sc = 1;
  constructor(
    studio: Studio,
    readonly t0: number,
    private readonly gentle: boolean,
  ) {
    this.puppet = studio.puppet(PATRON);
    if (this.puppet) {
      const [, h] = studio.size(PATRON);
      this.sc = 300 / h;
      this.puppet.scale.set(this.sc);
      this.puppet.emote('surprise', 1);
      this.body.addChild(this.puppet);
    }
    this.root.addChild(this.fx, this.body);
  }
  get alive() {
    return !!this.puppet;
  }
  /** per frame; returns the door's opening (0..1) while he uses it, or null when the gag is over */
  update(t: number): number | null {
    const k = t - this.t0;
    if (k > PATRON_DUR) return null;
    const p = patronPose(k, this.gentle);
    // he turns about his middle (the spin, the sway); the painting faces left: flip to face where he goes
    this.body.pivot.set(0, -150);
    this.body.position.set(p.x, p.y - 150 * p.sy);
    this.body.rotation = p.rot;
    this.body.scale.set(p.sx * (p.face > 0 ? -1 : 1), p.sy);
    this.root.alpha = p.alpha;
    const pz = this.puppet;
    if (pz) {
      pz.walk = p.walk;
      pz.sleeping = p.dizzy > 0.6 && k < 1.6;
    }
    // the dust when he lands, the stars of the dizzy beat
    const g = this.fx;
    g.clear();
    const land = k - 0.6;
    if (land > 0 && land < 0.5) {
      const q = land / 0.5;
      for (let i = 0; i < 7; i++) {
        const a = Math.PI + (i / 6) * Math.PI;
        g.circle(p.x + Math.cos(a) * (60 + 120 * q), CALLE.ground - 10 + Math.sin(a) * 30 * q, 26 * (1 - q) + 6).fill({ color: 0xc9b8d8, alpha: 0.8 * (1 - q) }).stroke({ width: 3, color: TV.line, alpha: 0.6 * (1 - q) });
      }
    }
    if (p.dizzy > 0.05) {
      const hx = p.x;
      const hy = CALLE.ground - 270;
      for (let i = 0; i < 3; i++) {
        const a = k * (this.gentle ? 2 : 7) + (i / 3) * Math.PI * 2;
        star(g, hx + Math.cos(a) * 70, hy + Math.sin(a) * 18, 20 * p.dizzy, TV.amberL, p.dizzy);
      }
    }
    // a soft shadow on the wet street
    const air = clamp((CALLE.ground - p.y) / 240, 0, 1);
    g.ellipse(p.x, CALLE.ground + 6, 90 * (1 - air * 0.5) * p.sx, 14).fill({ color: TV.line, alpha: 0.28 * p.alpha });
    return p.door;
  }
  destroy() {
    this.root.destroy({ children: true });
  }
}
