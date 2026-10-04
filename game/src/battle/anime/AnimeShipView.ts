/**
 * AnimeShipView — drop-in replacement for ShipView.
 *
 * The ship is painted ONCE as a continuous cartoon illustration (Canvas2D → texture). Each logical cell
 * is a MeshSimple that shows its own irregular polygon of that texture; polygon vertices are shared with
 * the neighbours (deterministic jitter per lattice corner/edge) so the intact ship has no visible grid,
 * and a broken cell leaves a jagged, inked rip with splinters. Behind the pieces sits a dark interior
 * plate (ribs/beams) shown through holes. Flying debris and sinking chunks ARE those same pieces.
 *
 * Damage cracks/scorch/char are painted into the canvas (source-atop → only over the art) and re-uploaded
 * once per frame when dirty. Status effects, sails/flags/foam/smoke animate on twos (12 fps).
 */
import { CanvasSource, Container, Graphics, MeshSimple, Sprite, Texture, earcut } from 'pixi.js';
import gsap from 'gsap';
import { CELL, Cell, ModuleInst, ShipModel } from '../ship';
import { glowTexture, sparkTexture } from '../../art/textures';
import { ShipStyle, ShipStyleId, getStyle } from './styles';
import { buildLayout, Lattice, ShipLayout } from './layout';
import { makeTarget, paintShip, paintInterior, setPaintModel, PaintTarget, PaintInfo, localXf } from './paint';
import { sailFrames, flagFrames, puffTexture, shardTexture, drawBarrel, drawOrb, SailFrames } from './decorArt';
import { CellStatusFx, statusTint, hasAnyStatus } from './statusFx';
import { addDebris } from './debris';
import { Pt, hash, shash, css, clamp, reparentKeep, mix } from './util';

export type { ShipStyleId } from './styles';

export interface AnimeShipOptions {
  /** local y of the sea surface (BattleScene: rows*CELL - 70) */
  waterLocalY?: number;
  /** texture resolution (device px per logical px). default 2 */
  resolution?: number;
}

interface Piece {
  cell: Cell;
  gx: number;
  gy: number;
  ring: Pt[];
  cx: number;
  cy: number;
  root: Container;
  mesh: MeshSimple;
  edge: Graphics | null;
  interior: MeshSimple;
  fx: CellStatusFx | null;
  dmgLevel: number;
  lastHp: number;
  charred: boolean;
  coverage: number;
  isWood: boolean;
}

interface SailInst {
  sprite: Sprite;
  frames: SailFrames;
  torn: SailFrames;
  phase: number;
  isTorn: boolean;
}

interface ModDecor {
  m: ModuleInst;
  root: Container;
  anchor: Cell | null;
  broken: boolean;
  sails: SailInst[];
  flag?: { sprite: Sprite; frames: SailFrames; phase: number; limp: boolean };
  barrel?: Graphics;
  barrelLen?: number;
  glow?: Sprite;
  glowBase?: number;
  orb?: Graphics;
  orbR?: number;
  ring?: Graphics;
  stopSmoke?: () => void;
  sparks?: boolean;
  /** ship-space local point for smoke */
  smokePt: Pt;
}

interface Puff {
  s: Sprite;
  vx: number;
  vy: number;
  life: number;
  max: number;
  s0: number;
  grow: number;
  a0: number;
}

interface Emitter {
  x: number;
  y: number;
  rate: number;
  acc: number;
  tint: number;
  scale: number;
  until: number;
  anchor: Cell | null;
  dead: boolean;
}

const DMG_LEVELS = [0.18, 0.45, 0.72];

export class AnimeShipView extends Container {
  readonly style: ShipStyle;
  readonly layout: ShipLayout;
  readonly lattice: Lattice;
  /** rotates/pushes around the waterline centre (visual only) */
  readonly body = new Container();
  readonly backLayer = new Container();
  readonly interiorLayer = new Container();
  readonly hullLayer = new Container();
  readonly foamG = new Graphics();
  readonly moduleLayer = new Container();
  /** BattleScene puts the cats here */
  readonly decor = new Container();
  readonly statusLayer = new Container();
  readonly smokeLayer = new Container();
  baseY = 0;
  waterLocalY: number;
  /** hits on cells automatically rock the hull (set false if BattleScene calls hitReact itself) */
  autoReact = true;

  private art: PaintTarget;
  private artTex: Texture;
  private interiorTex: Texture;
  /** white silhouette of the art (1x) for hit flashes */
  private flashTex!: Texture;
  private alphaMask: Uint8Array;
  private info: PaintInfo;
  private pieces = new Map<Cell, Piece>();
  private grid: (Piece | null)[][];
  private initialCount: number;
  private lost: { x: number }[] = [];
  private mods = new Map<number, ModDecor>();
  private interiorMeshes = new Map<number, MeshSimple>();
  private rigG = new Graphics();
  private bowsprit: Container | null = null;
  private bowAnchor: Cell | null = null;
  private puffs: Puff[] = [];
  private emitters: Emitter[] = [];
  private dirty = false;
  private foamDirty = true;
  private foamSpan: [number, number] | null = null;
  private t = Math.random() * 10;
  private stepAcc = 0;
  private frame = 0;
  private spring = { rot: 0, rotV: 0, x: 0, xV: 0, y: 0, yV: 0, sq: 0, sqV: 0 };
  private listCur = 0;
  private listTarget = 0;
  private sinkCur = 0;
  private sinkTarget = 0;
  private damageOverride: number | null = null;
  private pivotX: number;
  private kick = { x: 0, y: 0, a: 0 };

  constructor(public model: ShipModel, public flip: boolean, style: ShipStyleId = 'pirate', opts: AnimeShipOptions = {}) {
    super();
    this.style = getStyle(style);
    this.waterLocalY = opts.waterLocalY ?? model.rows * CELL - 70;
    const R = opts.resolution ?? 2;
    this.layout = buildLayout(model, flip, this.waterLocalY);
    this.lattice = new Lattice(this.layout);
    const L = this.layout;

    // --- bake illustration + interior
    setPaintModel(model);
    this.art = makeTarget(L, R);
    this.info = paintShip(this.art, L, model, this.style, this.waterLocalY);
    const interior = makeTarget(L, R);
    paintInterior(interior, L, this.style);
    this.artTex = new Texture({ source: new CanvasSource({ resource: this.art.canvas, resolution: R }) });
    this.interiorTex = new Texture({ source: new CanvasSource({ resource: interior.canvas, resolution: R }) });
    this.alphaMask = this.buildAlphaMask();

    // --- layers
    this.pivotX = L.wPx / 2;
    this.body.pivot.set(this.pivotX, this.waterLocalY);
    this.body.position.set(this.pivotX, this.waterLocalY);
    this.addChild(this.body);
    this.body.addChild(this.backLayer, this.interiorLayer, this.hullLayer, this.foamG, this.moduleLayer, this.decor, this.statusLayer, this.smokeLayer);
    this.backLayer.addChild(this.rigG);

    // --- pieces
    this.grid = model.grid.map((r) => r.map(() => null));
    for (const c of model.cells()) this.addPiece(c);
    this.initialCount = this.pieces.size;

    // --- decor
    for (const m of model.modules) this.addModuleDecor(m);
    this.addBowsprit();
    this.drawRigging();
    this.stepAnims();
  }

  // ================================================================ public API (ShipView-compatible)

  /** local px of cell top-left */
  cellPos(x: number, y: number) {
    const lx = this.flip ? (this.model.cols - 1 - x) * CELL : x * CELL;
    return { x: lx, y: y * CELL };
  }

  /** local px -> grid coords */
  toGrid(lx: number, ly: number) {
    let gx = Math.floor(lx / CELL);
    if (this.flip) gx = this.model.cols - 1 - gx;
    return { x: gx, y: Math.floor(ly / CELL) };
  }

  /** logical hull size (sails/smoke don't inflate it) */
  override get width() {
    return this.model.cols * CELL * Math.abs(this.scale.x);
  }
  override set width(v: number) {
    super.width = v;
  }
  override get height() {
    return this.model.rows * CELL * Math.abs(this.scale.y);
  }
  override set height(v: number) {
    super.height = v;
  }

  /** Damage cracks / statuses for a cell that is still standing. */
  refreshCell(c: Cell) {
    const p = this.pieces.get(c);
    if (!p) return;
    const dmg = 1 - c.hp / Math.max(1, c.maxHp);
    let lvl = 0;
    for (const th of DMG_LEVELS) if (dmg >= th) lvl++;
    if (c.hp < p.lastHp - 0.5) {
      this.hitFlash(p, Math.min(1, (p.lastHp - c.hp) / c.maxHp + 0.3));
      this.queueKick(p.cx, p.cy, 0.12);
    }
    p.lastHp = c.hp;
    while (p.dmgLevel < lvl) {
      p.dmgLevel++;
      this.paintDamage(p, p.dmgLevel);
    }
    // statuses
    if (c.status.burning && !p.charred) {
      p.charred = true;
      this.paintChar(p);
    }
    if (hasAnyStatus(c.status)) {
      if (!p.fx) {
        p.fx = new CellStatusFx(hash(c.x, c.y, 99) * 1000, this.style.ink, p.coverage);
        p.fx.position.set(p.cx, p.cy);
        this.statusLayer.addChild(p.fx);
      }
      p.fx.set(c.status);
      p.fx.step(this.frame, this.t);
    } else if (p.fx) {
      p.fx.destroy({ children: true });
      p.fx = null;
    }
    p.mesh.tint = statusTint(c.status);
  }

  /** Remove the visual of a destroyed cell: its piece of the illustration shatters and flies. */
  knockOff(c: Cell, debrisLayer: Container, worldPos: { x: number; y: number }, impulse = 1) {
    const p = this.pieces.get(c);
    if (!p) return;
    const attached = this.removePiece(p);
    const waterY = this.waterInLayer(debrisLayer);
    const frags = this.fragment(p);
    const cw0 = debrisLayer.toLocal(this.hullLayer.toGlobal({ x: p.cx, y: p.cy }));
    // push away from the ship's centre when the caller passes the cell centre itself
    const shipC = debrisLayer.toLocal(this.body.toGlobal({ x: this.pivotX, y: this.waterLocalY }));
    for (let i = 0; i < frags.length; i++) {
      const f = frags[i];
      this.hullLayer.addChild(f);
      if (i === 0) for (const a of attached) reparentKeep(a, f);
      reparentKeep(f, debrisLayer);
      let dx = cw0.x - worldPos.x;
      let dy = cw0.y - worldPos.y;
      if (Math.hypot(dx, dy) < 6) {
        dx = cw0.x - shipC.x;
        dy = -40;
      }
      const d = Math.hypot(dx, dy) || 1;
      // radial shatter of the fragments around their own piece centre
      const rx = f.x - cw0.x;
      const ry = f.y - cw0.y;
      const rd = Math.hypot(rx, ry) || 1;
      const sp = (160 + Math.random() * 240) * impulse;
      const shatter = 150 * Math.max(0.5, impulse);
      addDebris({
        obj: f,
        kind: 'chunk',
        vx: (dx / d) * sp + (rx / rd) * shatter + (Math.random() - 0.5) * 80 * impulse,
        vy: Math.min(-80, (dy / d) * sp) + (ry / rd) * shatter * 0.6 - (200 + Math.random() * 220) * impulse,
        vr: (Math.random() - 0.5) * 12,
        g: 1500,
        waterY,
        floats: p.isWood && Math.random() < 0.65,
        onSplash: (x) => this.splash(debrisLayer, x, waterY, 0.6),
      });
    }
    p.root.destroy({ children: true });
    // splinters + dust in the debris layer
    this.burstSplinters(debrisLayer, cw0.x, cw0.y, waterY, impulse, worldPos);
    this.queueKick(p.cx, p.cy, 0.3 * impulse);
  }

  /** Detach a whole chunk and let it sink as one rigid group of illustration pieces. */
  sinkChunk(chunk: Cell[], debrisLayer: Container, onSplash?: (x: number) => void) {
    const ps = chunk.map((c) => this.pieces.get(c)).filter((p): p is Piece => !!p);
    if (!ps.length) return;
    const attached: Container[] = [];
    for (const p of ps) this.detach(p);
    for (const p of ps) attached.push(...this.afterRemove(p));
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of ps) {
      minX = Math.min(minX, p.cx - CELL / 2);
      maxX = Math.max(maxX, p.cx + CELL / 2);
      minY = Math.min(minY, p.cy - CELL / 2);
      maxY = Math.max(maxY, p.cy + CELL / 2);
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const group = new Container();
    group.pivot.set(cx, cy);
    group.position.set(cx, cy);
    this.hullLayer.addChild(group);
    for (const p of ps) group.addChild(p.root);
    for (const a of attached) reparentKeep(a, group);
    // ink the rip line on the chunk side too
    const rip = new Graphics();
    for (const p of ps) this.drawRipEdges(p, rip, true);
    group.addChild(rip);
    reparentKeep(group, debrisLayer);
    const waterY = this.waterInLayer(debrisLayer);
    const dir = cx > this.pivotX ? 1 : -1;
    const big = ps.length > 3;
    addDebris({
      obj: group,
      kind: 'chunk',
      vx: dir * (30 + Math.random() * 50),
      vy: -90 - Math.random() * 60,
      vr: dir * (0.5 + Math.random() * 0.7) * (big ? 0.7 : 1.4),
      g: big ? 650 : 900,
      waterY: waterY + (maxY - minY) * 0.25,
      floats: false,
      big: true,
      onSplash: (x) => {
        this.splash(debrisLayer, x, waterY, big ? 1.6 : 1);
        onSplash?.(x);
      },
    });
    // dust & splinters where it tore off
    const cw = debrisLayer.toLocal(this.hullLayer.toGlobal({ x: cx, y: maxY }));
    this.burstSplinters(debrisLayer, cw.x, cw.y, waterY, 0.8, { x: cw.x, y: cw.y + 40 });
    this.hitReact(this.toGlobal({ x: cx, y: cy }).x, this.toGlobal({ x: cx, y: cy }).y, 0.5, true);
  }

  /** Swap decor of dead modules to their broken versions (bent cannon, torn sails, dead core…). */
  updateModuleDecor() {
    for (const d of this.mods.values()) {
      if (d.broken || d.m.alive) continue;
      this.breakDecor(d);
    }
  }

  /** Per-frame: bobbing, springs, stepped animations, deferred texture upload. */
  bob(dt: number) {
    this.t += dt;
    if (this.kick.a > 0) {
      this.reactLocal(this.kick.x, this.kick.y, Math.min(1.1, this.kick.a), true);
      this.kick.a = 0;
    }
    const s = this.spring;
    // springs (semi-implicit Euler)
    const k = Math.min(dt, 1 / 30);
    s.rotV += (-90 * s.rot - 7 * s.rotV) * k;
    s.rot += s.rotV * k;
    s.xV += (-38 * s.x - 6 * s.xV) * k;
    s.x += s.xV * k;
    s.yV += (-70 * s.y - 8 * s.yV) * k;
    s.y += s.yV * k;
    s.sqV += (-260 * s.sq - 13 * s.sqV) * k;
    s.sq += s.sqV * k;
    this.listCur += (this.listTarget - this.listCur) * Math.min(1, dt * 1.5);
    this.sinkCur += (this.sinkTarget - this.sinkCur) * Math.min(1, dt * 1.2);
    const t = this.t;
    this.y = this.baseY + Math.sin(t * 1.4) * 5 + this.sinkCur;
    this.body.rotation = Math.sin(t * 0.9) * 0.014 + Math.sin(t * 2.3 + 1) * 0.004 + this.listCur + s.rot;
    this.body.position.set(this.pivotX + s.x, this.waterLocalY + s.y);
    this.body.scale.set(1 + s.sq * 0.035, 1 - s.sq * 0.035);
    // foam stays on the true water line despite the bob
    this.foamG.y = -(Math.sin(t * 1.4) * 5) * 0.6;
    // 60fps glows
    for (const d of this.mods.values()) {
      if (d.glow && !d.broken) d.glow.alpha = (d.glowBase ?? 0.7) * (0.75 + 0.25 * Math.sin(t * 3 + d.m.id));
    }
    this.stepAcc += dt;
    if (this.stepAcc >= 1 / 12) {
      const st = this.stepAcc;
      this.stepAcc = 0;
      this.frame++;
      this.stepAnims(st);
    }
    if (this.dirty) {
      this.dirty = false;
      this.artTex.source.update();
    }
  }

  // ================================================================ extra API

  /** Impact reaction: the hull rolls/pushes away from the hit with a spring, nearby pieces jolt. */
  hitReact(worldX: number, worldY: number, strength = 1, quiet = false) {
    const lp = this.body.toLocal({ x: worldX, y: worldY });
    this.reactLocal(lp.x, lp.y, strength, quiet);
  }

  private queueKick(lx: number, ly: number, a: number) {
    if (!this.autoReact) return;
    const k = this.kick;
    const t = k.a + a;
    k.x = (k.x * k.a + lx * a) / t;
    k.y = (k.y * k.a + ly * a) / t;
    k.a = t;
  }

  private reactLocal(lx: number, ly: number, strength: number, quiet: boolean) {
    const side = clamp((lx - this.pivotX) / (this.layout.wPx / 2), -1, 1);
    const above = ly < this.waterLocalY ? 1 : -0.4;
    const s = this.spring;
    s.rotV += (-side * above * 0.9 - (Math.random() - 0.5) * 0.2) * strength;
    s.xV += (side === 0 ? 0 : -Math.sign(side)) * 120 * strength;
    s.yV += 90 * strength;
    s.sqV += 3 * strength;
    if (quiet) return;
    for (const p of this.pieces.values()) {
      const d = Math.hypot(p.cx - lx, p.cy - ly);
      if (d > 110) continue;
      const a = (1 - d / 110) * 5 * strength;
      const ang = Math.atan2(p.cy - ly, p.cx - lx);
      gsap.fromTo(p.root, { x: p.cx + Math.cos(ang) * a, y: p.cy + Math.sin(ang) * a }, { x: p.cx, y: p.cy, duration: 0.35, ease: 'elastic.out(1.2,0.35)', overwrite: true });
    }
  }

  /** Visual sink/list override (0 = pristine, 1 = wrecked). null = automatic from lost cells. */
  setDamageLevel(f: number | null, list?: number) {
    this.damageOverride = f;
    if (f !== null) {
      this.sinkTarget = f * 16;
      if (list !== undefined) this.listTarget = list;
    } else this.updateList();
  }

  /** Persistent cartoon smoke at a local point. Returns a stop function. */
  smokeAt(lx: number, ly: number, o: { rate?: number; tint?: number; scale?: number; duration?: number; anchor?: Cell } = {}) {
    const e: Emitter = {
      x: lx,
      y: ly,
      rate: o.rate ?? 3,
      acc: 0,
      tint: o.tint ?? 0x6a6470,
      scale: o.scale ?? 0.55,
      until: o.duration ? this.t + o.duration : Infinity,
      anchor: o.anchor ?? null,
      dead: false,
    };
    this.emitters.push(e);
    return () => (e.dead = true);
  }

  /** Muzzle flash + recoil on the first alive cannon (or the given module). */
  fireCannon(moduleId?: number) {
    const d = [...this.mods.values()].find((x) => x.m.kind === 'cannon' && !x.broken && (moduleId === undefined || x.m.id === moduleId));
    if (!d || !d.barrel) return;
    const b = d.barrel;
    gsap.fromTo(b, { x: -10 }, { x: 0, duration: 0.45, ease: 'elastic.out(1,0.4)' });
    const len = d.barrelLen ?? 52;
    const flash = new Graphics();
    const ray = (r0: number, r1: number, n: number, col: number) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const a2 = a + Math.PI / n;
        if (i === 0) flash.moveTo(Math.cos(a) * r1, Math.sin(a) * r1 * 0.7);
        else flash.lineTo(Math.cos(a) * r1, Math.sin(a) * r1 * 0.7);
        flash.lineTo(Math.cos(a2) * r0, Math.sin(a2) * r0 * 0.7);
      }
      flash.closePath().fill(col).stroke({ width: 2.5, color: this.style.ink, join: 'miter' });
    };
    ray(10, 26, 8, 0xffc94a);
    ray(5, 13, 6, 0xfff2a8);
    flash.position.set(len + 14, 0);
    b.addChild(flash);
    gsap.to(flash.scale, { x: 1.4, y: 1.4, duration: 0.1 });
    gsap.to(flash, { alpha: 0, duration: 0.12, delay: 0.06, onComplete: () => flash.destroy() });
    const mp = this.moduleLayer.toLocal(b.toGlobal({ x: len + 6, y: 0 }));
    for (let i = 0; i < 4; i++) this.spawnPuff(mp.x, mp.y, { tint: 0xd8d2dc, scale: 0.35 + Math.random() * 0.3, vx: (this.flip ? -1 : 1) * (40 + Math.random() * 60), vy: -20 - Math.random() * 30, life: 0.8 + Math.random() * 0.5 });
  }

  /** local position of the first alive cannon muzzle */
  muzzleLocal() {
    const d = [...this.mods.values()].find((x) => x.m.kind === 'cannon' && !x.broken);
    if (!d?.barrel) return null;
    return this.toLocal(d.barrel.toGlobal({ x: (d.barrelLen ?? 52) + 4, y: 0 }));
  }

  override destroy(options?: Parameters<Container['destroy']>[0]) {
    const a = this.artTex;
    const b = this.interiorTex;
    super.destroy(options ?? { children: true });
    // debris may still be flying with our texture
    const c = this.flashTex;
    window.setTimeout(() => {
      a.destroy(true);
      b.destroy(true);
      c.destroy(true);
    }, 8000);
  }

  // ================================================================ pieces

  private uvs(pts: Pt[]) {
    const T = this.art;
    const out = new Float32Array(pts.length * 2);
    pts.forEach((p, i) => {
      out[i * 2] = (p[0] + T.padX) / T.texW;
      out[i * 2 + 1] = (p[1] + T.padT) / T.texH;
    });
    return out;
  }

  private makeMesh(tex: Texture, pts: Pt[]) {
    const flat = pts.flat();
    const idx = earcut(flat);
    return new MeshSimple({ texture: tex, vertices: new Float32Array(flat), uvs: this.uvs(pts), indices: new Uint32Array(idx) });
  }

  private addPiece(c: Cell) {
    const ring = this.lattice.ring(c.x, c.y);
    const p0 = this.cellPos(c.x, c.y);
    const cx = p0.x + CELL / 2;
    const cy = p0.y + CELL / 2;
    const root = new Container();
    root.pivot.set(cx, cy);
    root.position.set(cx, cy);
    const mesh = this.makeMesh(this.artTex, ring);
    root.addChild(mesh);
    this.hullLayer.addChild(root);
    const interior = this.makeMesh(this.interiorTex, ring);
    interior.visible = false;
    this.interiorLayer.addChild(interior);
    this.interiorMeshes.set(c.y * 1000 + c.x, interior);
    // coverage
    let on = 0;
    let n = 0;
    for (let y = 3; y < CELL; y += 6)
      for (let x = 3; x < CELL; x += 6) {
        n++;
        if (this.alphaAt(p0.x + x, p0.y + y) > 128) on++;
      }
    const mi = this.layout.moduleAt[c.y][c.x];
    const p: Piece = {
      cell: c,
      gx: c.x,
      gy: c.y,
      ring,
      cx,
      cy,
      root,
      mesh,
      edge: null,
      interior,
      fx: null,
      dmgLevel: 0,
      lastHp: c.hp,
      charred: false,
      coverage: on / n,
      isWood: c.material === 'wood' || c.material === 'bone',
    };
    void mi;
    this.pieces.set(c, p);
    this.grid[c.y][c.x] = p;
  }

  private alive(x: number, y: number) {
    return !!this.grid[y]?.[x];
  }

  /** returns decor containers anchored to this piece (caller re-parents them) */
  private removePiece(p: Piece): Container[] {
    this.detach(p);
    return this.afterRemove(p);
  }

  private detach(p: Piece) {
    this.pieces.delete(p.cell);
    this.grid[p.gy][p.gx] = null;
  }

  private afterRemove(p: Piece): Container[] {
    p.fx?.destroy({ children: true });
    p.fx = null;
    p.mesh.tint = 0xffffff;
    gsap.killTweensOf(p.root);
    p.root.position.set(p.cx, p.cy);
    this.lost.push({ x: p.cx });
    // neighbours get inked rips; holes show the interior
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const n = this.grid[p.gy + dy]?.[p.gx + dx];
      if (n) {
        if (!n.edge) {
          n.edge = new Graphics();
          n.root.addChild(n.edge);
        }
        this.drawRip(n, -dx, -dy, n.edge);
      }
    }
    this.refreshInterior(p.gx, p.gy);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) this.refreshInterior(p.gx + dx, p.gy + dy);
    // emitters
    for (const e of this.emitters) if (e.anchor === p.cell) e.dead = true;
    // decor riding on this piece
    const out: Container[] = [];
    for (const [id, d] of this.mods) {
      if (d.anchor === p.cell) {
        d.stopSmoke?.();
        out.push(d.root);
        this.mods.delete(id);
        if (d.m.kind === 'mast') this.drawRigging();
      }
    }
    if (this.bowAnchor === p.cell && this.bowsprit) {
      out.push(this.bowsprit);
      this.bowsprit = null;
      this.drawRigging();
    }
    this.foamDirty = true;
    if (this.damageOverride === null) this.updateList();
    return out;
  }

  private refreshInterior(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.model.cols || y >= this.model.rows) return;
    if (this.grid[y][x]) return;
    // find the interior mesh of that (destroyed) cell
    const mesh = this.interiorMeshes.get(y * 1000 + x);
    if (!mesh) return;
    const l = this.alive(x - 1, y), r = this.alive(x + 1, y), u = this.alive(x, y - 1), d = this.alive(x, y + 1);
    const cnt = +l + +r + +u + +d;
    const show = (l && r) || (u && d) || cnt >= 3;
    if (show !== mesh.visible) {
      if (show) mesh.alpha = 0;
      mesh.visible = true;
      gsap.to(mesh, { alpha: show ? 1 : 0, duration: 0.25, overwrite: true, onComplete: () => void (mesh.visible = show) });
    }
  }


  /** ink + splinters along the edge of piece n facing direction (dx,dy) (toward the hole) */
  private drawRip(n: Piece, dx: number, dy: number, g: Graphics) {
    const pts = this.lattice.sharedEdge(n.gx, n.gy, dx, dy);
    // direction in local space
    const ldx = this.flip ? -dx : dx;
    const runs = this.opaqueRuns(pts, -ldx * 3, -dy * 3);
    const st = this.style;
    for (const run of runs) {
      if (run.length < 2) continue;
      g.moveTo(run[0][0], run[0][1]);
      for (const q of run.slice(1)) g.lineTo(q[0], q[1]);
      g.stroke({ width: 3.6, color: st.ink, join: 'round', cap: 'round' });
      // splinters poking into the hole
      for (let i = 1; i < run.length - 1; i += 2) {
        const q = run[i];
        const h = hash(Math.round(q[0]), Math.round(q[1]), 3);
        if (h < 0.35) continue;
        const len = 5 + h * 7;
        const wv = 2.5 + h * 2;
        const tx = q[0] + ldx * len + (h - 0.5) * 4;
        const ty = q[1] + dy * len + (h - 0.5) * 4;
        const px = -dy;
        const py = ldx;
        g.moveTo(q[0] - px * wv, q[1] - py * wv).lineTo(tx, ty).lineTo(q[0] + px * wv, q[1] + py * wv).closePath();
        g.fill(n.isWood ? mix(st.wood.light, st.hull.light, 0.3) : st.metal.light).stroke({ width: 1.5, color: st.ink, join: 'round' });
      }
      // light chipped highlight just inside the rip
      g.moveTo(run[0][0] - ldx * 3, run[0][1] - dy * 3);
      for (const q of run.slice(1)) g.lineTo(q[0] - ldx * 3, q[1] - dy * 3);
      g.stroke({ width: 1.3, color: 0xffffff, alpha: 0.35 });
    }
  }

  /** inked rip on all of p's edges that faced still-standing neighbours (for sinking chunks) */
  private drawRipEdges(p: Piece, g: Graphics, _chunk: boolean) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      if (!this.alive(p.gx + dx, p.gy + dy)) continue;
      const pts = this.lattice.sharedEdge(p.gx, p.gy, dx, dy);
      const ldx = this.flip ? -dx : dx;
      for (const run of this.opaqueRuns(pts, -ldx * 3, -dy * 3)) {
        if (run.length < 2) continue;
        g.moveTo(run[0][0], run[0][1]);
        for (const q of run.slice(1)) g.lineTo(q[0], q[1]);
        g.stroke({ width: 3.6, color: this.style.ink, join: 'round', cap: 'round' });
      }
    }
  }

  /** split a polyline into the runs that lie over opaque art (sampled slightly inside) */
  private opaqueRuns(pts: Pt[], ox: number, oy: number): Pt[][] {
    const runs: Pt[][] = [];
    let cur: Pt[] = [];
    for (const q of pts) {
      if (this.alphaAt(q[0] + ox, q[1] + oy) > 100) cur.push(q);
      else {
        if (cur.length) runs.push(cur);
        cur = [];
      }
    }
    if (cur.length) runs.push(cur);
    return runs;
  }

  /** break a piece into 1–3 fan fragments, each a mesh of the same texture with inked cut lines */
  private fragment(p: Piece): Container[] {
    const ring = p.ring;
    const n = ring.length;
    const k = p.coverage < 0.3 ? 1 : 2 + (hash(p.gx, p.gy, 71) > 0.45 ? 1 : 0);
    const out: Container[] = [];
    if (k === 1) {
      const c = new Container();
      c.pivot.set(p.cx, p.cy);
      c.position.set(p.cx, p.cy);
      const mesh = this.makeMesh(this.artTex, ring);
      mesh.tint = p.mesh.tint;
      c.addChild(mesh);
      if (p.edge) c.addChild(p.edge);
      out.push(c);
      return out;
    }
    const ctr: Pt = [p.cx + shash(p.gx, p.gy, 5) * 6, p.cy + shash(p.gx, p.gy, 6) * 6];
    const start = Math.floor(hash(p.gx, p.gy, 8) * n);
    const cuts: number[] = [];
    for (let i = 0; i < k; i++) cuts.push((((start + Math.round((i * n) / k + shash(p.gx, p.gy, 9 + i) * 2)) % n) + n) % n);
    for (let i = 0; i < k; i++) {
      const a = cuts[i];
      const b = cuts[(i + 1) % k];
      const poly: Pt[] = [ctr];
      let j = a;
      let guard = 0;
      while (guard++ < n + 1) {
        poly.push(ring[j]);
        if (j === b) break;
        j = (j + 1) % n;
      }
      if (poly.length < 3) continue;
      let mx = 0, my = 0;
      for (const q of poly) ((mx += q[0]), (my += q[1]));
      mx /= poly.length;
      my /= poly.length;
      const c = new Container();
      c.pivot.set(mx, my);
      c.position.set(mx, my);
      const mesh = this.makeMesh(this.artTex, poly);
      c.addChild(mesh);
      const ink = new Graphics();
      for (const end of [ring[a], ring[b]]) {
        const seg: Pt[] = [];
        for (let s = 0; s <= 4; s++) {
          const t = s / 4;
          seg.push([ctr[0] + (end[0] - ctr[0]) * t + (s % 2 ? 1.5 : -1.5), ctr[1] + (end[1] - ctr[1]) * t]);
        }
        for (const run of this.opaqueRuns(seg, 0, 0)) {
          if (run.length < 2) continue;
          ink.moveTo(run[0][0], run[0][1]);
          for (const q of run.slice(1)) ink.lineTo(q[0], q[1]);
          ink.stroke({ width: 2.8, color: this.style.ink, join: 'round', cap: 'round' });
        }
      }
      c.addChild(ink);
      if (i === 0 && p.edge) c.addChild(p.edge);
      out.push(c);
    }
    return out;
  }

  private buildAlphaMask(): Uint8Array {
    const T = this.art;
    const w = Math.ceil(T.texW);
    const h = Math.ceil(T.texH);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true })!;
    g.drawImage(T.canvas, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data;
    const out = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) out[i] = d[i * 4 + 3];
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, h);
    this.flashTex = new Texture({ source: new CanvasSource({ resource: c, resolution: 1 }) });
    return out;
  }

  private alphaAt(lx: number, ly: number) {
    const T = this.art;
    const x = Math.round(lx + T.padX);
    const y = Math.round(ly + T.padT);
    const w = Math.ceil(T.texW);
    if (x < 0 || y < 0 || x >= w || y >= Math.ceil(T.texH)) return 0;
    return this.alphaMask[y * w + x];
  }

  private waterInLayer(layer: Container) {
    return layer.toLocal(this.body.toGlobal({ x: this.pivotX, y: this.waterLocalY })).y;
  }

  private updateList() {
    if (!this.initialCount) return;
    let m = 0;
    for (const l of this.lost) m += (l.x - this.pivotX) / this.pivotX;
    this.listTarget = clamp((m / this.initialCount) * 0.35, -0.05, 0.05);
    this.sinkTarget = (this.lost.length / this.initialCount) * 14;
  }

  // ================================================================ damage painting

  private withPieceClip(p: Piece, fn: (g: CanvasRenderingContext2D) => void) {
    const g = this.art.ctx;
    g.save();
    localXf(g, this.art);
    g.beginPath();
    p.ring.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])));
    g.closePath();
    g.clip();
    g.globalCompositeOperation = 'source-atop';
    fn(g);
    g.restore();
    this.dirty = true;
  }

  private paintDamage(p: Piece, level: number) {
    const st = this.style;
    const seed = p.gx * 31 + p.gy * 17 + level * 7;
    const rnd = (k: number) => hash(seed, k, 3);
    this.withPieceClip(p, (g) => {
      g.lineJoin = 'round';
      g.lineCap = 'round';
      const crack = (k: number, len: number) => {
        // start near the cell border, walk inward
        const a0 = rnd(k) * Math.PI * 2;
        let x = p.cx + Math.cos(a0) * 19;
        let y = p.cy + Math.sin(a0) * 19;
        let ang = a0 + Math.PI + (rnd(k + 1) - 0.5) * 0.8;
        const pts: Pt[] = [[x, y]];
        const segs = 4;
        for (let i = 0; i < segs; i++) {
          ang += (rnd(k + 2 + i) - 0.5) * 1.1;
          const sl = len / segs;
          x += Math.cos(ang) * sl;
          y += Math.sin(ang) * sl;
          pts.push([x, y]);
        }
        // tapered ink
        for (let i = 0; i < pts.length - 1; i++) {
          g.beginPath();
          g.moveTo(pts[i][0], pts[i][1]);
          g.lineTo(pts[i + 1][0], pts[i + 1][1]);
          g.strokeStyle = css(st.ink);
          g.lineWidth = 3.2 * (1 - i / pts.length) + 0.6;
          g.stroke();
        }
        // chipped highlight
        g.beginPath();
        pts.forEach((q, i) => (i ? g.lineTo(q[0] + 1.4, q[1] + 1.6) : g.moveTo(q[0] + 1.4, q[1] + 1.6)));
        g.strokeStyle = 'rgba(255,255,255,0.45)';
        g.lineWidth = 1;
        g.stroke();
        // branch
        const mid = pts[2];
        g.beginPath();
        g.moveTo(mid[0], mid[1]);
        g.lineTo(mid[0] + Math.cos(ang + 1.2) * len * 0.3, mid[1] + Math.sin(ang + 1.2) * len * 0.3);
        g.strokeStyle = css(st.ink);
        g.lineWidth = 1.6;
        g.stroke();
      };
      if (level === 1) crack(10, 22 + rnd(9) * 8);
      if (level === 2) {
        crack(20, 26);
        // soot
        const sx = p.cx + (rnd(30) - 0.5) * 14;
        const sy = p.cy + (rnd(31) - 0.5) * 14;
        const grd = g.createRadialGradient(sx, sy, 2, sx, sy, 20);
        grd.addColorStop(0, css(0x120a08, 0.55));
        grd.addColorStop(1, css(0x120a08, 0));
        g.fillStyle = grd;
        g.fillRect(sx - 22, sy - 22, 44, 44);
        // dents / nail holes
        for (let i = 0; i < 2; i++) {
          const dx = p.cx + (rnd(40 + i) - 0.5) * 26;
          const dy = p.cy + (rnd(50 + i) - 0.5) * 26;
          g.beginPath();
          g.arc(dx, dy, 2.6, 0, Math.PI * 2);
          g.fillStyle = css(st.interior.base);
          g.fill();
          g.beginPath();
          g.arc(dx + 0.8, dy + 0.8, 3.4, Math.PI * 0.1, Math.PI * 0.9);
          g.strokeStyle = 'rgba(255,255,255,0.5)';
          g.lineWidth = 1;
          g.stroke();
        }
      }
      if (level === 3) {
        // punched hole showing the interior
        const hx = p.cx + (rnd(60) - 0.5) * 10;
        const hy = p.cy + (rnd(61) - 0.5) * 10;
        const pts: Pt[] = [];
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2;
          const r = (7 + rnd(70 + i) * 6) * (i % 2 ? 0.7 : 1);
          pts.push([hx + Math.cos(a) * r, hy + Math.sin(a) * r]);
        }
        g.beginPath();
        pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])));
        g.closePath();
        g.fillStyle = css(st.interior.base);
        g.fill();
        g.save();
        g.clip();
        g.fillStyle = css(st.interior.rib);
        g.fillRect(hx - 2, hy - 14, 5, 28);
        g.restore();
        g.strokeStyle = css(st.ink);
        g.lineWidth = 2.6;
        g.stroke();
        // splinter chips around the hole
        g.fillStyle = css(p.isWood ? st.wood.light : st.metal.light);
        for (let i = 0; i < pts.length; i += 2) {
          const q = pts[i];
          const a = Math.atan2(q[1] - hy, q[0] - hx);
          g.beginPath();
          g.moveTo(q[0] + Math.cos(a + 0.5) * 3, q[1] + Math.sin(a + 0.5) * 3);
          g.lineTo(q[0] - Math.cos(a) * 5, q[1] - Math.sin(a) * 5);
          g.lineTo(q[0] + Math.cos(a - 0.5) * 3, q[1] + Math.sin(a - 0.5) * 3);
          g.closePath();
          g.fill();
          g.strokeStyle = css(st.ink);
          g.lineWidth = 1;
          g.stroke();
        }
        crack(80, 18);
      }
    });
  }

  private paintChar(p: Piece) {
    const seed = p.gx * 13 + p.gy * 29;
    this.withPieceClip(p, (g) => {
      for (let i = 0; i < 5; i++) {
        const x = p.cx + shash(seed, i, 1) * 18;
        const y = p.cy + shash(seed, i, 2) * 16 + 4;
        const r = 7 + hash(seed, i, 3) * 9;
        const grd = g.createRadialGradient(x, y, 1, x, y, r);
        grd.addColorStop(0, css(0x0d0705, 0.7));
        grd.addColorStop(0.7, css(0x1d0e08, 0.35));
        grd.addColorStop(1, css(0x1d0e08, 0));
        g.fillStyle = grd;
        g.fillRect(x - r, y - r, r * 2, r * 2);
      }
      g.fillStyle = css(0xff6a1a, 0.9);
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.arc(p.cx + shash(seed, i, 7) * 16, p.cy + shash(seed, i, 8) * 14, 1.2, 0, Math.PI * 2);
        g.fill();
      }
    });
  }

  private paintScorchRect(x: number, y: number, w: number, h: number) {
    const g = this.art.ctx;
    g.save();
    localXf(g, this.art);
    g.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 6; i++) {
      const sx = x + hash(i, x, 1) * w;
      const sy = y + hash(i, y, 2) * h;
      const r = 14 + hash(i, w, 3) * 18;
      const grd = g.createRadialGradient(sx, sy, 1, sx, sy, r);
      grd.addColorStop(0, css(0x0d0705, 0.6));
      grd.addColorStop(1, css(0x0d0705, 0));
      g.fillStyle = grd;
      g.fillRect(sx - r, sy - r, r * 2, r * 2);
    }
    g.restore();
    this.dirty = true;
  }

  private hitFlash(p: Piece, strength: number) {
    const f = this.makeMesh(this.flashTex, p.ring);
    f.alpha = 0.9;
    p.root.addChild(f);
    gsap.to(f, { alpha: 0, duration: 0.16, delay: 0.05, onComplete: () => f.destroy() });
    const ang = Math.random() * Math.PI * 2;
    const a = 3 + strength * 3;
    gsap.fromTo(p.root, { x: p.cx + Math.cos(ang) * a, y: p.cy + Math.sin(ang) * a }, { x: p.cx, y: p.cy, duration: 0.3, ease: 'elastic.out(1.2,0.3)', overwrite: true });
  }

  // ================================================================ module decor

  /** ship-space → local */
  private L(sx: number, sy: number): Pt {
    return [this.lattice.lx(sx), sy];
  }

  private decorRoot(sx: number, sy: number) {
    const c = new Container();
    const [x, y] = this.L(sx, sy);
    c.position.set(x, y);
    c.scale.x = this.flip ? -1 : 1;
    return c;
  }

  private cellAt(x: number, y: number) {
    return this.model.get(x, y);
  }

  private addModuleDecor(m: ModuleInst) {
    const st = this.style;
    const mi = this.layout.modules[m.id];
    const X = m.x * CELL;
    const Y = m.y * CELL;
    const Wd = m.w * CELL;
    const Hd = m.h * CELL;
    const cx = X + Wd / 2;
    const cy = Y + Hd / 2;
    let root: Container;
    let anchor: Cell | null = this.cellAt(m.x + Math.floor((m.w - 1) / 2), m.y + Math.floor((m.h - 1) / 2));
    const d: ModDecor = { m, root: null as unknown as Container, anchor, broken: false, sails: [], smokePt: this.L(cx, Y + 8) };
    switch (m.kind) {
      case 'mast': {
        root = this.decorRoot(cx, Y);
        anchor = this.cellAt(m.x, m.y);
        const top = 4;
        const twoSails = m.h >= 5;
        const mk = (yy: number, w: number, h: number, ph: number) => {
          const frames = sailFrames(st, w, h, false, 16);
          const torn = sailFrames(st, w, h, true, 8);
          const s = new Sprite(frames.frames[0]);
          s.anchor.set(frames.ax / frames.frames[0].width, frames.ay / frames.frames[0].height);
          s.y = yy;
          root.addChild(s);
          d.sails.push({ sprite: s, frames, torn, phase: ph, isTorn: false });
        };
        if (twoSails) {
          const tw = Math.round(Math.min(150, Hd * 0.62));
          const th = Math.round(Hd * 0.2);
          mk(top + 38, tw, th, 3);
          const mainY = top + 38 + th + 16;
          mk(mainY, Math.round(Math.min(180, Hd * 0.86)), Math.round(Hd - mainY - 30), 0);
        } else {
          const mainY = top + 38;
          mk(mainY, Math.round(Math.min(170, Math.max(110, Hd * 0.86))), Math.round(Hd - mainY - 28), 0);
        }
        // flag on a little pole above the crow's nest
        const pole = new Graphics();
        pole.rect(-1.5, -26, 3, 30).fill(st.wood.base).stroke({ width: 1.6, color: st.ink });
        pole.circle(0, -27, 3).fill(st.trim.base).stroke({ width: 1.4, color: st.ink });
        root.addChildAt(pole, 0);
        const ff = flagFrames(st, 8);
        const fs = new Sprite(ff.frames[0]);
        fs.anchor.set(ff.ax / ff.frames[0].width, ff.ay / ff.frames[0].height);
        fs.position.set(-1, -25);
        root.addChild(fs);
        d.flag = { sprite: fs, frames: ff, phase: m.id * 3, limp: false };
        d.smokePt = this.L(cx, Y + Hd - 10);
        break;
      }
      case 'cannon': {
        if (mi.embedded) {
          const px = X + Wd - CELL / 2;
          root = this.decorRoot(px, cy);
          anchor = this.cellAt(m.x + m.w - 1, m.y);
          d.barrelLen = 30;
        } else {
          root = this.decorRoot(X + 22, Y + Hd - 19);
          anchor = this.cellAt(m.x, m.y + m.h - 1);
          d.barrelLen = Math.min(64, Wd - 18);
        }
        const b = new Graphics();
        drawBarrel(b, st, false, d.barrelLen);
        b.rotation = mi.embedded ? 0 : -0.12;
        root.addChild(b);
        d.barrel = b;
        const glow = new Sprite(glowTexture());
        glow.anchor.set(0.5);
        glow.tint = st.muzzle;
        glow.blendMode = 'add';
        glow.scale.set(0.32);
        glow.position.set(d.barrelLen + 3, 0);
        b.addChild(glow);
        d.glow = glow;
        d.glowBase = 0.8;
        d.smokePt = this.L(X + 30, Y + Hd - 24);
        break;
      }
      case 'core': {
        const R = mi.embedded ? Math.min(Wd, Hd) * 0.4 : Math.min(Wd, Hd) * 0.36;
        const oy = mi.embedded ? cy : cy - 4;
        root = this.decorRoot(cx, oy);
        const glow = new Sprite(glowTexture());
        glow.anchor.set(0.5);
        glow.tint = st.core.glow;
        glow.blendMode = 'add';
        glow.scale.set((R * 2.6) / 128);
        root.addChild(glow);
        const orb = new Graphics();
        drawOrb(orb, st, R - 11, false, 0);
        root.addChild(orb);
        d.glow = glow;
        d.glowBase = 0.85;
        d.orb = orb;
        d.orbR = R - 11;
        d.smokePt = this.L(cx, oy - R * 0.4);
        break;
      }
      case 'catroom': {
        root = this.decorRoot(cx, mi.embedded ? Y + 22 : Y + 34);
        const glow = new Sprite(glowTexture());
        glow.anchor.set(0.5);
        glow.tint = st.window.glow;
        glow.blendMode = 'add';
        glow.scale.set(mi.embedded ? 0.55 : 0.45);
        glow.alpha = 0.5;
        root.addChild(glow);
        if (!mi.embedded) {
          const lg = new Sprite(glowTexture());
          lg.anchor.set(0.5);
          lg.tint = st.window.glow;
          lg.blendMode = 'add';
          lg.scale.set(0.22);
          lg.position.set(Wd / 2 - 4, -34 + 20 + 15);
          root.addChild(lg);
        }
        d.glow = glow;
        d.glowBase = 0.45;
        d.smokePt = this.L(cx, Y + 10);
        break;
      }
      case 'shield': {
        root = this.decorRoot(cx, mi.embedded ? cy : Y + Hd - 10);
        const glow = new Sprite(glowTexture());
        glow.anchor.set(0.5);
        glow.tint = 0x00e5ff;
        glow.blendMode = 'add';
        glow.scale.set(0.6);
        root.addChild(glow);
        const ring = new Graphics();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ring.circle(Math.cos(a) * 16, Math.sin(a) * 16 * 0.5, 2.2).fill(0xbff8ff).stroke({ width: 1.2, color: st.ink });
        }
        root.addChild(ring);
        d.glow = glow;
        d.glowBase = 0.7;
        d.ring = ring;
        break;
      }
      case 'engine': {
        const hx = X + Math.min(Wd, 40) / 2 + 2;
        root = this.decorRoot(hx, Y + (mi.embedded ? 4 : 10) + (Hd - (mi.embedded ? 8 : 2)) / 2);
        const glow = new Sprite(glowTexture());
        glow.anchor.set(0.5);
        glow.tint = 0xff8a1a;
        glow.blendMode = 'add';
        glow.scale.set(0.45);
        root.addChild(glow);
        d.glow = glow;
        d.glowBase = 0.75;
        d.smokePt = mi.embedded ? this.L(hx, Y) : this.L(X + Wd - 14, Y - 10);
        if (!mi.embedded) d.stopSmoke = this.smokeAt(d.smokePt[0], d.smokePt[1], { rate: 1.6, tint: 0xd8d2dc, scale: 0.32, anchor: anchor ?? undefined });
        break;
      }
      case 'arcane': {
        root = this.decorRoot(cx, mi.embedded ? cy : cy - 4);
        const glow = new Sprite(glowTexture());
        glow.anchor.set(0.5);
        glow.tint = 0x8a5cff;
        glow.blendMode = 'add';
        glow.scale.set(0.6);
        root.addChild(glow);
        const ring = new Graphics();
        const r = Math.min(Wd, Hd) * 0.28;
        ring.circle(0, 0, r).stroke({ width: 1.6, color: 0xd9c6ff });
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ring.moveTo(Math.cos(a) * r, Math.sin(a) * r).lineTo(Math.cos(a + 0.4) * r * 0.6, Math.sin(a + 0.4) * r * 0.6).stroke({ width: 1.6, color: 0xd9c6ff });
        }
        ring.star(0, 0, 4, 6, 2.5).fill(0xffffff);
        root.addChild(ring);
        d.glow = glow;
        d.glowBase = 0.75;
        d.ring = ring;
        break;
      }
      case 'powder':
      default: {
        root = this.decorRoot(cx, cy);
        d.smokePt = this.L(cx, Y);
        break;
      }
    }
    d.root = root;
    d.anchor = anchor;
    this.moduleLayer.addChild(root);
    this.mods.set(m.id, d);
  }

  private addBowsprit() {
    const st = this.style;
    const [bx, by] = this.info.bow;
    // anchor: the bow-most alive cell at that height
    const gy = Math.max(0, Math.min(this.model.rows - 1, Math.floor((by + 6) / CELL)));
    let anchor: Cell | null = null;
    for (let x = this.model.cols - 1; x >= 0; x--) {
      const c = this.model.get(x, gy) ?? this.model.get(x, gy + 1);
      if (c) {
        anchor = c;
        break;
      }
    }
    if (!anchor) return;
    const root = this.decorRoot(bx - 14, by + 4);
    const g = new Graphics();
    const len = 62;
    const a = -0.32;
    const tx = Math.cos(a) * len;
    const ty = Math.sin(a) * len;
    g.moveTo(0, 3).lineTo(tx, ty).stroke({ width: 8, color: st.ink, cap: 'round' });
    g.moveTo(0, 3).lineTo(tx, ty).stroke({ width: 4.5, color: st.wood.base, cap: 'round' });
    g.moveTo(4, 1).lineTo(tx - 2, ty - 1.5).stroke({ width: 1.4, color: st.wood.light, cap: 'round' });
    g.circle(tx, ty, 3.6).fill(st.neon[0] ?? st.trim.base).stroke({ width: 1.8, color: st.ink });
    root.addChild(g);
    this.backLayer.addChild(root);
    this.bowsprit = root;
    this.bowAnchor = anchor;
  }

  private drawRigging() {
    const g = this.rigG;
    g.clear();
    const st = this.style;
    const masts = [...this.mods.values()].filter((d) => d.m.kind === 'mast' && !d.broken).sort((a, b) => a.m.x - b.m.x);
    const L = this.layout;
    const top = (d: ModDecor) => this.L((d.m.x + 0.5) * CELL, d.m.y * CELL + 18);
    const pts: [Pt, Pt][] = [];
    const sternX = L.minX + 8;
    const sternY = L.topY[Math.round(sternX)];
    if (masts.length && !Number.isNaN(sternY)) pts.push([top(masts[0]), this.L(sternX, sternY - 8)]);
    for (let i = 0; i < masts.length - 1; i++) pts.push([top(masts[i]), top(masts[i + 1])]);
    if (masts.length && this.bowsprit) {
      const bx = this.info.bow[0] - 14 + Math.cos(-0.32) * 62;
      const by = this.info.bow[1] + 4 + Math.sin(-0.32) * 62;
      pts.push([top(masts[masts.length - 1]), this.L(bx, by)]);
    }
    for (const [a, b] of pts) {
      g.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke({ width: 2, color: st.ink, alpha: 0.85 });
    }
    // shrouds (ladder lines) from each mast top down to the deck
    for (const d of masts) {
      const [x, y] = top(d);
      const deckY = (d.m.y + d.m.h) * CELL - 4;
      for (const off of [-26, 26]) g.moveTo(x, y + 14).lineTo(x + off, deckY).stroke({ width: 1.4, color: st.ink, alpha: 0.7 });
    }
  }

  private breakDecor(d: ModDecor) {
    d.broken = true;
    const st = this.style;
    const m = d.m;
    const [sx, sy] = d.smokePt;
    this.paintScorchRect(this.cellPos(this.flip ? m.x + m.w - 1 : m.x, m.y).x - 6, m.y * CELL - 6, m.w * CELL + 12, m.h * CELL + 12);
    const heavy = m.kind === 'core' || m.kind === 'powder' || m.kind === 'engine';
    d.stopSmoke?.();
    d.stopSmoke = this.smokeAt(sx, sy, { rate: heavy ? 5 : 3, tint: heavy ? 0x3a3440 : 0x5e5864, scale: heavy ? 0.7 : 0.5, anchor: d.anchor ?? undefined });
    this.sparkBurst(sx, sy, m.kind === 'core' ? st.core.base : 0xffc94a, m.kind === 'core' ? 14 : 8);
    if (d.glow) gsap.to(d.glow, { alpha: 0, duration: 0.4 });
    switch (m.kind) {
      case 'mast': {
        for (const s of d.sails) {
          s.isTorn = true;
          s.sprite.texture = s.torn.frames[0];
          const dir = hash(m.id, 3) > 0.5 ? 1 : -1;
          gsap.to(s.sprite, { y: s.sprite.y + 22, rotation: dir * 0.28, duration: 0.7, ease: 'bounce.out' });
          // a scrap tears off and flutters down
          const scrap = new Sprite(s.torn.frames[1 % s.torn.frames.length]);
          scrap.anchor.set(0.5);
          scrap.scale.set(0.35);
          const gp = this.smokeLayer.toLocal(s.sprite.toGlobal({ x: 0, y: 40 }));
          scrap.position.copyFrom(gp);
          this.smokeLayer.addChild(scrap);
          const fall = this.waterLocalY - gp.y;
          gsap.to(scrap, { y: gp.y + fall, duration: 1.8, ease: 'power1.in' });
          gsap.to(scrap, { x: gp.x + (this.flip ? 60 : -60), rotation: 2.5, duration: 1.8, ease: 'sine.inOut' });
          gsap.to(scrap, { alpha: 0, duration: 0.4, delay: 1.6, onComplete: () => scrap.destroy() });
        }
        if (d.flag) {
          d.flag.limp = true;
          gsap.to(d.flag.sprite, { rotation: 1.25, duration: 0.6, ease: 'bounce.out' });
        }
        this.drawRigging();
        break;
      }
      case 'cannon': {
        if (d.barrel) {
          drawBarrel(d.barrel, st, true, d.barrelLen);
          gsap.fromTo(d.barrel, { rotation: -0.5 }, { rotation: 0.18, duration: 0.6, ease: 'bounce.out' });
        }
        break;
      }
      case 'core': {
        if (d.orb) {
          drawOrb(d.orb, st, d.orbR ?? 18, true);
          gsap.fromTo(d.orb.scale, { x: 1.3, y: 1.3 }, { x: 1, y: 1, duration: 0.4, ease: 'back.out(3)' });
        }
        d.sparks = true;
        break;
      }
      case 'shield':
      case 'arcane': {
        if (d.ring) gsap.to(d.ring, { alpha: 0.25, duration: 0.4 });
        break;
      }
      case 'powder': {
        this.sparkBurst(sx, sy + 20, 0xff6a1a, 16);
        break;
      }
    }
  }

  // ================================================================ fx helpers

  private spawnPuff(x: number, y: number, o: { tint?: number; scale?: number; vx?: number; vy?: number; life?: number; grow?: number; alpha?: number } = {}) {
    if (this.puffs.length > 110) return;
    const s = new Sprite(puffTexture());
    s.anchor.set(0.5);
    s.position.set(x, y);
    s.tint = o.tint ?? 0x8a8490;
    const sc = o.scale ?? 0.5;
    s.scale.set(sc * (this.flip ? -1 : 1), sc);
    s.rotation = (Math.random() - 0.5) * 0.6;
    s.alpha = o.alpha ?? 1;
    this.smokeLayer.addChild(s);
    const life = o.life ?? 1.6 + Math.random() * 0.8;
    this.puffs.push({ s, vx: o.vx ?? (Math.random() - 0.5) * 16 - 10, vy: o.vy ?? -38 - Math.random() * 26, life, max: life, s0: sc, grow: o.grow ?? 1.4, a0: s.alpha });
  }

  private sparkBurst(x: number, y: number, color: number, n: number) {
    for (let i = 0; i < n; i++) {
      const s = new Sprite(sparkTexture());
      s.anchor.set(0.5);
      s.tint = color;
      s.blendMode = 'add';
      s.position.set(x, y);
      s.scale.set(0.2 + Math.random() * 0.25);
      this.smokeLayer.addChild(s);
      const a = Math.random() * Math.PI * 2;
      const r = 30 + Math.random() * 60;
      gsap.to(s, { x: x + Math.cos(a) * r, y: y + Math.sin(a) * r - 20, rotation: 3, duration: 0.5 + Math.random() * 0.3, ease: 'power2.out' });
      gsap.to(s, { alpha: 0, duration: 0.25, delay: 0.4, onComplete: () => s.destroy() });
    }
  }

  private burstSplinters(layer: Container, x: number, y: number, waterY: number, impulse: number, from: { x: number; y: number }) {
    const st = this.style;
    const n = Math.round(4 + impulse * 5);
    for (let i = 0; i < n; i++) {
      const s = new Sprite(shardTexture());
      s.anchor.set(0.5);
      s.tint = [st.wood.light, st.hull.light, st.hull.base, st.trim.base][i % 4];
      s.scale.set(0.5 + Math.random() * 0.6);
      s.position.set(x, y);
      s.rotation = Math.random() * Math.PI * 2;
      layer.addChild(s);
      const a = Math.atan2(y - from.y, x - from.x) + (Math.random() - 0.5) * 2.2;
      const sp = (220 + Math.random() * 380) * Math.max(0.5, impulse);
      addDebris({ obj: s, kind: 'shard', vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 200, vr: (Math.random() - 0.5) * 20, g: 1500, waterY, life: 1.2, stepped: true });
    }
    for (let i = 0; i < 3; i++) {
      const s = new Sprite(puffTexture());
      s.anchor.set(0.5);
      s.tint = mix(st.wood.light, 0xdddddd, 0.5);
      s.scale.set(0.3 + Math.random() * 0.25);
      s.position.set(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20);
      layer.addChild(s);
      addDebris({ obj: s, kind: 'puff', vx: (Math.random() - 0.5) * 80, vy: -30 - Math.random() * 40, vr: (Math.random() - 0.5) * 2, g: 0, waterY, life: 0.6 + Math.random() * 0.4, grow: 1.1, stepped: true });
    }
  }

  private splash(layer: Container, x: number, waterY: number, size: number) {
    const n = Math.round(8 * size + 3);
    for (let i = 0; i < n; i++) {
      const g = new Graphics();
      const r = 1.6 + Math.random() * 2.2 * Math.sqrt(size);
      g.ellipse(0, 0, r + 1.3, r * 1.5 + 1.3).fill(this.style.ink).ellipse(0, 0, r, r * 1.5).fill(i % 3 ? 0xffffff : 0x9fe0ff);
      g.position.set(x + (Math.random() - 0.5) * 14 * size, waterY);
      layer.addChild(g);
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const sp = (180 + Math.random() * 260) * Math.sqrt(size);
      addDebris({ obj: g, kind: 'drop', vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vr: 0, g: 1300, waterY: waterY + 2, stepped: true });
    }
    // crown ring
    const ring = new Graphics();
    ring.ellipse(0, 0, 16 * size, 4 * size).stroke({ width: 3, color: 0xffffff });
    ring.position.set(x, waterY);
    layer.addChild(ring);
    gsap.to(ring.scale, { x: 2.2, y: 1.6, duration: 0.5, ease: 'power2.out' });
    gsap.to(ring, { alpha: 0, duration: 0.5, onComplete: () => ring.destroy() });
  }

  // ================================================================ stepped animation (12 fps)

  private stepAnims(dt = 1 / 12) {
    const f = this.frame;
    const t = this.t;
    // sails & flags
    for (const d of this.mods.values()) {
      for (const s of d.sails) {
        const fr = s.isTorn ? s.torn : s.frames;
        const idx = s.isTorn ? Math.floor((f + s.phase) / 3) % fr.frames.length : (f + s.phase) % fr.frames.length;
        s.sprite.texture = fr.frames[idx];
      }
      if (d.flag) {
        const fl = d.flag;
        fl.sprite.texture = fl.frames.frames[fl.limp ? Math.floor(f / 4) % 2 : (f + fl.phase) % fl.frames.frames.length];
      }
      if (d.orb && !d.broken) drawOrb(d.orb, this.style, d.orbR ?? 18, false, f * 0.55);
      if (d.ring) d.ring.rotation = d.m.kind === 'arcane' ? f * 0.12 : 0;
      if (d.ring && d.m.kind === 'shield') d.ring.y = Math.sin(f * 0.5) * 2;
      if (d.sparks && hash(f, d.m.id) < 0.3) this.sparkBurst(d.smokePt[0] + (Math.random() - 0.5) * 20, d.smokePt[1] + 10, this.style.core.base, 2);
    }
    // statuses
    for (const p of this.pieces.values()) {
      if (!p.fx) continue;
      p.fx.step(f, t);
      if (p.fx.burning && hash(f, p.gx, p.gy) < 0.12) this.spawnPuff(p.cx + (Math.random() - 0.5) * 10, p.cy - 22, { tint: 0x3d3640, scale: 0.28, life: 1.2 });
      if (p.fx.kinds.has('steam') && hash(f, p.gx, p.gy + 50) < 0.15) this.spawnPuff(p.cx, p.cy - 10, { tint: 0xffffff, scale: 0.3, life: 1 });
    }
    // wisps from badly damaged cells
    if (f % 3 === 0) {
      for (const p of this.pieces.values()) {
        if (p.dmgLevel >= 3 && hash(f, p.gx * 7, p.gy) < 0.08) this.spawnPuff(p.cx, p.cy - 8, { tint: 0x7a7480, scale: 0.22, life: 1.1 });
      }
    }
    // emitters
    for (let i = this.emitters.length - 1; i >= 0; i--) {
      const e = this.emitters[i];
      if (e.dead || t > e.until) {
        this.emitters.splice(i, 1);
        continue;
      }
      e.acc += dt * e.rate;
      while (e.acc >= 1) {
        e.acc -= 1;
        this.spawnPuff(e.x + (Math.random() - 0.5) * 12, e.y, { tint: e.tint, scale: e.scale * (0.7 + Math.random() * 0.6) });
      }
    }
    // puffs (stepped motion = anime smoke)
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const p = this.puffs[i];
      p.life -= dt;
      if (p.life <= 0) {
        p.s.destroy();
        this.puffs.splice(i, 1);
        continue;
      }
      p.s.x += p.vx * dt;
      p.s.y += p.vy * dt;
      p.vy *= 1 - 0.4 * dt;
      const k = 1 - p.life / p.max;
      const sc = p.s0 * (1 + k * p.grow);
      p.s.scale.set(sc * Math.sign(p.s.scale.x || 1), sc);
      p.s.alpha = p.a0 * Math.min(1, (p.life / p.max) * 2);
    }
    this.drawFoam(f);
  }

  private computeFoamSpan(): [number, number] | null {
    const row = Math.floor(this.waterLocalY / CELL);
    let lo = Infinity;
    let hi = -Infinity;
    for (const r of [row, row + 1]) {
      if (r < 0 || r >= this.model.rows) continue;
      for (let x = 0; x < this.model.cols; x++) {
        if (!this.grid[r][x]) continue;
        const p = this.cellPos(x, r);
        lo = Math.min(lo, p.x);
        hi = Math.max(hi, p.x + CELL);
      }
    }
    if (lo === Infinity) return null;
    // tighten to the painted hull
    const y = Math.round(this.waterLocalY);
    while (lo < hi && this.alphaAt(lo, y) < 100) lo += 2;
    while (hi > lo && this.alphaAt(hi, y) < 100) hi -= 2;
    return hi - lo > 10 ? [lo, hi] : null;
  }

  private drawFoam(f: number) {
    if (this.foamDirty) {
      this.foamDirty = false;
      this.foamSpan = this.computeFoamSpan();
    }
    const g = this.foamG;
    g.clear();
    const span = this.foamSpan;
    if (!span) return;
    const [lo, hi] = span;
    const y = this.waterLocalY + 3;
    const ink = this.style.ink;
    const bowRight = !this.flip;
    const blobs: [number, number, number][] = [];
    for (let x = lo - 8; x <= hi + 8; x += 10) {
      const r = 4.2 + hash(Math.round(x), f % 6, 1) * 3.4;
      blobs.push([x, y + Math.sin(x * 0.2 + f * 0.9) * 1.4, r]);
    }
    // bow wave
    const bx = bowRight ? hi + 4 : lo - 4;
    const s = bowRight ? 1 : -1;
    const lift = Math.sin(f * 0.8) * 2;
    blobs.push([bx, y - 6 + lift, 8], [bx + s * 9, y - 1, 7], [bx - s * 6, y - 13 + lift, 5.5], [bx + s * 16, y + 2, 5]);
    // stern wake
    const wx = bowRight ? lo - 6 : hi + 6;
    for (let i = 1; i <= 4; i++) blobs.push([wx - s * i * 11, y + 2 + Math.sin(f * 0.7 + i) * 1.5, 5.5 - i * 0.9]);
    for (const [x, yy, r] of blobs) g.circle(x, yy, r + 2.2);
    g.fill(ink);
    for (const [x, yy, r] of blobs) g.circle(x, yy, r);
    g.fill(0xffffff);
    for (const [x, yy, r] of blobs) if (r > 5) g.circle(x + r * 0.25, yy + r * 0.3, r * 0.45);
    g.fill(0xbfe8ff);
    // spray dashes at the bow
    if (f % 2 === 0) {
      g.moveTo(bx + s * 10, y - 16).lineTo(bx + s * 18, y - 24).stroke({ width: 2.4, color: 0xffffff, cap: 'round' });
      g.moveTo(bx + s * 4, y - 20).lineTo(bx + s * 7, y - 29).stroke({ width: 2, color: 0xffffff, cap: 'round' });
    }
  }
}
