/**
 * Living cats: the MAI SVG painting drawn on a deformable mesh, driven by a per-cat rig
 * (landmarks/regions authored in MAI: `MAI SVG/exports/game-rigs/<slug>.rig.json`, compacted
 * into data/catRigs.json). No cut-out parts: the painting bends like a Live2D-lite puppet.
 *
 * Layers of motion (all additive, all on the same mesh):
 * - face: blinks, ear twitches, head tilt/bob/turn (look), emotes (happy/hurt/surprise/sleepy/attack)
 * - body: lean (shear over the feet), crouch (squash toward the feet), walk cycle, sleep, wind
 * - extras: tail sway, bobbing detached props (crystals, wisps, steam, lantern…)
 * - idle acts the cat starts on its own: look around, yawn, groom, stretch, tail flick
 *
 * Coordinates: rigs live in the painting's MAI viewBox (700×700 unless the rig says `size`).
 * The mesh is built in that space minus the anchor, so `scale = size / ART` works like a Sprite.
 */
import { Mesh, MeshGeometry, Point, Sprite, Texture, Ticker } from 'pixi.js';
import { PuppetBrain, type ActSet, type CatAct, type CatEmote } from './puppetCore';

export { ART, catRig } from './puppetCore';
export type { CatRig, CatEmote, CatAct, ActSet } from './puppetCore';

/** anything the old code treated as "the cat sprite" */
export type CatView = Sprite | CatPuppet;

const tmpP = new Point();
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export interface PuppetOptions {
  anchorX?: number;
  anchorY?: number;
  /** deformation rate (house style animates on twos-ish) */
  fps?: number;
  /** spontaneous acts this puppet may start on its own */
  acts?: ActSet;
}

/**
 * Drop-in replacement for the cat Sprite: same tint/filters/texture/scale/anchor semantics,
 * plus acting. Owners drive posture with `lean/crouch/look/walk/wind/sleeping` and react with `emote()`.
 * The acting itself lives in the renderer-agnostic `PuppetBrain` (art/puppetCore.ts); this class only
 * owns the Pixi mesh, the ticker hookup, look-at in global coordinates and the full-detail request.
 */
export class CatPuppet extends Mesh {
  /** like Sprite.anchor (fraction of the painting); `set` re-centers the mesh */
  readonly anchor: { x: number; y: number; set: (x: number, y?: number) => void };
  readonly brain: PuppetBrain;
  readonly W: number;
  readonly H: number;
  /** called once when the puppet is drawn big enough to deserve the full-detail art */
  onWantDetail: (() => void) | null = null;
  private detailAsked = false;
  private sizeCheck = 0;
  private lookTarget: { x: number; y: number } | null = null;

  set lean(v: number) {
    this.brain.lean = v;
  }
  set crouch(v: number) {
    this.brain.crouch = v;
  }
  set look(v: number) {
    this.brain.look = v;
  }
  set walk(v: number) {
    this.brain.walk = v;
  }
  set sleeping(v: boolean) {
    this.brain.sleeping = v;
  }
  set wind(v: number) {
    this.brain.wind = v;
  }
  get energy() {
    return this.brain.energy;
  }
  set energy(v: number) {
    this.brain.energy = v;
  }
  get acts() {
    return this.brain.acts;
  }
  set acts(v: ActSet) {
    this.brain.acts = v;
  }
  get model() {
    return this.brain.model;
  }

  constructor(
    texture: Texture,
    public slug: string,
    o: PuppetOptions = {},
  ) {
    const brain = new PuppetBrain(slug, o);
    super({ geometry: new MeshGeometry({ positions: brain.pos, uvs: brain.uvs, indices: brain.indices }), texture });
    this.brain = brain;
    this.W = brain.W;
    this.H = brain.H;
    this.anchor = {
      get x() {
        return brain.anchor.x;
      },
      get y() {
        return brain.anchor.y;
      },
      set: (x: number, y = x) => {
        if (brain.setAnchor(x, y)) this.geometry.getBuffer('aPosition').update();
      },
    };
    Ticker.shared.add(this.tick, this);
  }

  /** react: happy = tail wag + ears perk, hurt = squeeze eyes + ears back, attack = lunge */
  emote(kind: CatEmote, strength = 1) {
    this.brain.emote(kind, strength);
  }
  /** start a spontaneous act now (look around, yawn, groom, stretch, tail flick) */
  doAct(kind: CatAct) {
    this.brain.doAct(kind);
  }
  /** force a blink right now */
  blink() {
    this.brain.blink();
  }
  /** turn the head toward a global point (null = stop) */
  lookAt(global: { x: number; y: number } | null) {
    this.lookTarget = global ? { x: global.x, y: global.y } : null;
  }

  private tick(tk: Ticker) {
    if (this.destroyed) return;
    const dt = Math.min(0.1, tk.deltaMS / 1000);
    this.checkDetail(dt);
    const h = this.lookTarget && this.brain.headLocal();
    if (this.lookTarget && h) {
      tmpP.set(this.lookTarget.x, this.lookTarget.y);
      const p = this.toLocal(tmpP);
      const dx = p.x - h[0];
      const near = Math.hypot(dx, p.y - h[1]) < this.W * 2.2;
      this.brain.look = near ? clamp(dx / (this.W * 0.6), -1, 1) : 0;
    }
    if (this.brain.tick(dt)) this.geometry.getBuffer('aPosition').update();
  }

  /** request the full-detail art the first time we are drawn big on screen */
  private checkDetail(dt: number) {
    if (this.detailAsked || !this.onWantDetail) return;
    this.sizeCheck -= dt;
    if (this.sizeCheck > 0) return;
    this.sizeCheck = 0.5;
    if (!this.visible || !this.parent) return;
    const m = this.getGlobalTransform(undefined, false);
    const px = Math.hypot(m.a, m.b) * this.W * (globalThis.devicePixelRatio || 1);
    if (px > 640) {
      this.detailAsked = true;
      this.onWantDetail();
    }
  }

  override destroy(options?: Parameters<Mesh['destroy']>[0]) {
    Ticker.shared.remove(this.tick, this);
    const g = this.geometry;
    super.destroy(options);
    g?.destroy(true); // per-puppet vertex buffers (uvs/indices arrays are shared but only referenced)
  }
}
