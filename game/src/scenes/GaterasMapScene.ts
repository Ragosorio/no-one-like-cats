/**
 * Parte III · LA CARTA DE LAS CAJAS — the second map (docs/part-iii/05-mapa-y-dimensiones.md §1, 04-guion §7).
 *
 * It reads like the Diario del Mar (scenes/MapScene.ts) — the same grammar of numbered stage nodes along a route, the
 * élite shield at 5, the boss at 9, the frontier ring that pulses, the little boat on it, the route inked when you win,
 * the card with honest odds — but it is LUZTERNA'S NOTEBOOK, not a newspaper chart: sewn pages, pencil, her
 * handwriting in the margins, wax stains, YOUR ISLAND and its faro in the middle (its beam sweeps the pages) and five
 * TEARS with pawprints in a ring around it. Only the Borracha is open (drawn as an old TV: a 90s cartoon in beer amber,
 * donut pink, bottle green and night blue — never yellow skin); the other four boxes are blank sheets with one pawprint
 * and her note «aquí no he llegado».
 *
 * Geometry is data (data/gateras/regiones.json), never code like ZONE_BOX. Nothing here touches content.enemies.
 * First visit (H68): her hand draws the carta, Maneki sweeps in with the keys, you pay (state/sys/gateras.ts buyGatera),
 * the tear is sewn into a gatera and B-1 appears. B-1…B-9 are playable (B-6…B-9 + El Cadenero: MECÁNICAS-IMPL, stand-ins).
 *
 * MANY BOXES (mecanicas-v2/03 §2.4): nothing here names a box. What is drawn comes from scenes/cartaModel.ts (boxes and
 * their LOOK, the nodes of every open box keyed `<dim>:<n>`, the routes, the camera's box); a box's look is a registry
 * (`tv`, `sheet`, `blank`, or registerBoxLook for comic / tesoro / estante / poster); the card and the battle carry the
 * selected `{ dim, node }`.
 */
import { Container, Graphics, Sprite, Text, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { Scene } from '../core/scenes';
import { W, H, game } from '../core/App';
import { C, F } from '../ui/theme';
import { txt, Button } from '../ui/widgets';
import { paperTexture } from '../art/textures';
import { sfx } from '../core/audio';
import { Hud } from '../ui/hud/Hud';
import { toast } from '../ui/modal';
import { say } from '../ui/dialog';
import type { Line } from '../ui/dialog';
import { G } from '../state/game';
import { fmt } from '../core/format';
import { settings } from '../core/settings';
import { boat, drawIsland, islandPoly, vignetteTexture } from '../panels/campaign/chartArt';
import type { Pt } from '../panels/campaign/chartArt';
import { P, stamp, label, killTree, resChip, hash1, tornRect, doubleRule } from '../panels/campaign/common';
import { simulateEstimate, estimateLabel } from '../state/sys/estimate';
import type { Estimate } from '../state/sys/estimate';
import * as GT from '../state/sys/gateras';
import type { DimDef, DimId, GateraNodeDef, GateraStageDef, StageState } from '../state/sys/gateras';
import { buildGateraBattle, gateraBattleDef, gateraLootPreview, gateraPower, shipAdvice, stageLabel, victoryStampOpts } from '../state/sys/gaterasBattles';
import type { GateraBattleDef } from '../state/sys/gaterasBattles';
import { BAR_CONDITIONS } from '../battle/ronda';
import { boxLook, cartaModel, declareLook, firstBox, focusBox, nodeKey, nodePos as modelNodePos, openBoxes } from './cartaModel';
import { playVictoryStamp } from '../ui/victoryStamp';
import { combatPower, combatWeight } from '../state/sys/ship';
import { cajasMemo, startGateraBattle, cajasGoal, paw } from '../app/cajasFlow';
import { audioApi } from '../audio/api';
import { hasTrack } from '../audio/catalog';
import { sparkles, floatText } from '../fx/juice';
import { CONTENT, catName } from '../data/content';
import { P3_CATS, p3NodeHints } from '../state/sys/p3cats';
import type { MissionDef } from '../data/content';
import { CARTA_LINES } from '../ui/story/gaterasScript';
import { cataIntroLine } from '../state/sys/campaign';
/** a box cat is with you (Maneki's shop has something to sell) */
const hasBoxCat = () => P3_CATS.some((d) => G.s.cats.some((c) => c.species === d.id));

// ------------------------------------------------------------------ the notebook's inks
const NB = {
  desk: 0x2b2119,
  paper: 0xf3ead2,
  paperBlank: 0xfaf5e8,
  rule: 0x9db8d9,
  margin: 0xd9786e,
  pencil: 0x55535e,
  pen: 0x2c3e6b,
  thread: 0xb8322e,
  wax: 0xe6cf8e,
  tape: 0xe9e0b8,
} as const;
const BX = { beer: 0xe8a33d, donut: 0xf59ac0, bottle: 0x2e7d4f, night: 0x1b2a4a, nightDeep: 0x0f1830, nightHi: 0x2a3d6e, wood: 0x7a4a2a, woodHi: 0x9a6238, woodLo: 0x5a3520, glass: 0x101a30 } as const;

/** a box's look drawn by another module (comic, tesoro, estante, poster…): (box, open?) → its drawing at d.box */
export type BoxLookBuilder = (d: DimDef, open: boolean) => Container;
const BOX_LOOKS = new Map<string, BoxLookBuilder>();
export function registerBoxLook(id: string, b: BoxLookBuilder) {
  BOX_LOOKS.set(id, b);
  declareLook(id);
}
/** the purchase / opening lines of the first box are the Borracha's beat (b68_carta); a box's suffix (`borracha`) */
const boxSuffix = (dim: DimId) => dim.replace(/^p3d_/, '');
const CHART_TOP = 150;
const CHART_W = 1920;
const CHART_H = 1066;
const ZOOM_IN = 1.5;
/** screen area not covered by the HUD (same as the Diario del Mar) */
const SAFE = { x0: 400, x1: 1610, y0: 110, y1: 950 };

type Kind = GateraStageDef['kind'];

// ------------------------------------------------------------------ a stage node (the Diario del Mar's grammar)
class GNode extends Container {
  g = new Graphics();
  ring = new Graphics();
  num = txt('', { fontFamily: F.poster, fontSize: 24, fill: P.blue });
  state: StageState = 'locked';
  isFrontier = false;
  r: number;
  constructor(
    public def: GateraStageDef | GateraNodeDef,
    /** a stage's kind, or the node's ('desvio', 'actividad', 'encuentro') */
    public kind: string,
    public dim: DimId,
    /** the node id (`3`, `d1`, `a1`) */
    public node: string,
  ) {
    super();
    this.r = kind === 'boss' ? 34 : kind === 'elite' ? 30 : kind === 'actividad' ? 27 : kind === 'desvio' ? 20 : 23;
    this.num.anchor.set(0.5);
    this.addChild(this.ring, this.g, this.num);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = { contains: (x: number, y: number) => x * x + y * y < (this.r + 10) * (this.r + 10) };
    this.on('pointerover', () => {
      gsap.to(this.scale, { x: 1.14, y: 1.14, duration: 0.14, ease: 'back.out(3)' });
      sfx('hover');
    });
    this.on('pointerout', () => gsap.to(this.scale, { x: 1, y: 1, duration: 0.16 }));
  }
  /** the Borracha's TV box: its élite and boss wear Oficial Dona's and El Cadenero's badges */
  get barBox() {
    return GT.dimDef(this.dim).look === 'tv';
  }
  /** the stage number (NaN for a node that isn't a stage) */
  get n() {
    return /^\d+$/.test(this.node) ? Number(this.node) : NaN;
  }
  get key() {
    return nodeKey(this.dim, this.node);
  }
  redraw() {
    const g = this.g.clear();
    const st = this.state;
    const r = this.r;
    const ink = st === 'locked' ? P.blueSoft : P.blue;
    const fill = st === 'cleared' ? P.blue : this.isFrontier ? (this.kind === 'boss' ? C.red : C.pink) : P.aged;
    this.alpha = st === 'locked' ? 0.7 : 1;
    if (this.kind === 'actividad') {
      // La Ronda: a beer mug on a coaster
      g.circle(3, 4, r).fill({ color: C.ink, alpha: 0.85 });
      g.circle(0, 0, r).fill(st === 'locked' ? P.aged : BX.beer).stroke({ width: 4, color: ink });
      g.roundRect(-r * 0.42, -r * 0.4, r * 0.62, r * 0.82, 4).fill(0xffd27a).stroke({ width: 2.5, color: C.ink });
      g.roundRect(-r * 0.46, -r * 0.55, r * 0.7, r * 0.22, 6).fill(0xffffff).stroke({ width: 2, color: C.ink });
      g.arc(r * 0.24, 0, r * 0.2, -Math.PI / 2, Math.PI / 2).stroke({ width: 3, color: C.ink });
      this.num.text = '';
    } else if (this.kind === 'desvio' || this.kind === 'encuentro') {
      // a side door: a smaller dashed ring with a little door
      g.circle(0, 0, r).fill(st === 'cleared' ? P.blue : P.aged);
      const n = 12;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2;
        g.moveTo(Math.cos(a0) * r, Math.sin(a0) * r).arc(0, 0, r, a0, a0 + Math.PI / n);
      }
      g.stroke({ width: 3, color: ink });
      g.roundRect(-r * 0.32, -r * 0.45, r * 0.64, r * 0.9, r * 0.3).fill(st === 'cleared' ? P.aged : BX.wood).stroke({ width: 2, color: C.ink });
      this.num.text = '';
    } else if (this.kind === 'boss') {
      g.circle(3, 4, r).fill({ color: C.ink, alpha: 0.85 });
      g.circle(0, 0, r).fill(st === 'cleared' ? P.blue : this.isFrontier ? C.red : P.aged).stroke({ width: 4, color: ink });
      // the Borracha's boss is El Cadenero's face; another box's, a crown (its boss is in its own card and film)
      if (this.barBox) bouncer(g, r * 0.8, st === 'locked' ? P.agedDark : 0xfff6e0, C.ink);
      else crown(g, r * 0.8, st === 'locked' ? P.agedDark : BX.beer, C.ink);
      this.num.text = '';
    } else if (this.kind === 'elite') {
      const pts = [-r * 0.85, -r * 0.8, r * 0.85, -r * 0.8, r * 0.85, -r * 0.05, 0, r, -r * 0.85, -r * 0.05];
      g.poly(pts.map((v, i) => v + (i % 2 ? 4 : 3))).fill({ color: C.ink, alpha: 0.85 });
      g.poly(pts).fill(fill).stroke({ width: 3.5, color: ink, join: 'round' });
      if (this.barBox) {
        // Oficial Dona's badge: a donut with sprinkles
        g.circle(0, -r * 0.22, r * 0.42).fill(BX.donut).stroke({ width: 2.5, color: C.ink });
        g.circle(0, -r * 0.22, r * 0.15).fill(fill).stroke({ width: 2, color: C.ink });
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + 0.3;
          const x = Math.cos(a) * r * 0.29;
          const y = -r * 0.22 + Math.sin(a) * r * 0.29;
          g.moveTo(x - 2, y - 1).lineTo(x + 2, y + 1).stroke({ width: 2, color: [BX.beer, 0xffffff, BX.bottle][i % 3] });
        }
      } else {
        // another box's élite: a plain five-point star on the shield
        const pts5: number[] = [];
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          const rr = (i % 2 ? 0.17 : 0.4) * r;
          pts5.push(Math.cos(a) * rr, -r * 0.2 + Math.sin(a) * rr);
        }
        g.poly(pts5).fill(0xfff6e0).stroke({ width: 2.5, color: C.ink, join: 'round' });
      }
      this.num.text = '';
    } else {
      if (st === 'locked') {
        g.circle(0, 0, r).fill(P.aged);
        const n = 16;
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * Math.PI * 2;
          g.moveTo(Math.cos(a0) * r, Math.sin(a0) * r).arc(0, 0, r, a0, a0 + Math.PI / n);
        }
        g.stroke({ width: 3, color: ink });
      } else {
        g.circle(3, 4, r).fill({ color: C.ink, alpha: 0.85 });
        g.circle(0, 0, r).fill(fill).stroke({ width: 4, color: ink });
        g.circle(0, 0, r - 6).stroke({ width: 1.2, color: st === 'cleared' ? P.aged : ink, alpha: 0.7 });
      }
      // a line's stage number; a bracket/shelf/tour node's own (`a4` → 4)
      this.num.text = Number.isNaN(this.n) ? this.node.replace(/^\D+/, '') : String(this.n);
      this.num.style.fill = st === 'cleared' ? P.aged : this.isFrontier ? C.ink : ink;
      this.num.y = 1;
    }
    if (st === 'cleared') g.moveTo(r * 0.35, r * 0.55).lineTo(r * 0.6, r * 0.85).lineTo(r * 1.1, r * 0.2).stroke({ width: 5, color: C.red, cap: 'round', join: 'round' });
    this.ring.clear();
    if (this.isFrontier) this.ring.circle(0, 0, r + 9).stroke({ width: 3, color: this.kind === 'boss' ? C.red : C.pinkHot });
  }
}

/** El Cadenero (the box's boss): a bouncer's face with dark glasses and a chain */
function bouncer(g: Graphics, r: number, fill: number, ink: number) {
  g.circle(0, 0, r * 0.62).fill(fill).stroke({ width: 3, color: ink });
  g.poly([-r * 0.5, -r * 0.3, -r * 0.62, -r * 0.82, -r * 0.18, -r * 0.52]).fill(fill).stroke({ width: 2.5, color: ink, join: 'round' });
  g.poly([r * 0.5, -r * 0.3, r * 0.62, -r * 0.82, r * 0.18, -r * 0.52]).fill(fill).stroke({ width: 2.5, color: ink, join: 'round' });
  g.roundRect(-r * 0.5, -r * 0.16, r * 0.44, r * 0.24, 4).fill(ink);
  g.roundRect(r * 0.06, -r * 0.16, r * 0.44, r * 0.24, 4).fill(ink);
  g.moveTo(-r * 0.06, -r * 0.08).lineTo(r * 0.06, -r * 0.08).stroke({ width: 3, color: ink });
  g.moveTo(-r * 0.2, r * 0.3).lineTo(r * 0.2, r * 0.3).stroke({ width: 3, color: ink, cap: 'round' });
  for (let i = 0; i < 5; i++) g.circle(-r * 0.4 + i * r * 0.2, r * 0.66, r * 0.09).stroke({ width: 2.5, color: BX.beer });
}

/** a box's boss that isn't El Cadenero: a three-point crown */
function crown(g: Graphics, r: number, fill: number, ink: number) {
  g.poly([-r * 0.6, r * 0.38, -r * 0.6, -r * 0.3, -r * 0.3, r * 0.02, 0, -r * 0.5, r * 0.3, r * 0.02, r * 0.6, -r * 0.3, r * 0.6, r * 0.38]).fill(fill).stroke({ width: 3, color: ink, join: 'round' });
  for (const x of [-0.6, 0, 0.6]) g.circle(x * r, (x ? -0.3 : -0.5) * r - r * 0.1, r * 0.09).fill(0xfff6e0).stroke({ width: 2, color: ink });
  g.moveTo(-r * 0.6, r * 0.2).lineTo(r * 0.6, r * 0.2).stroke({ width: 2.5, color: ink });
}

/** her handwriting (Permanent Marker, pen blue on paper; light on the TV) */
function hand(text: string, size = 22, color: number = NB.pen, rot = 0): Text {
  const t = txt(text, { fontFamily: F.brush, fontSize: size, fill: color });
  t.anchor.set(0.5);
  t.rotation = rot;
  return t;
}

const flat = (pts: Pt[]) => pts.flatMap((p) => [p[0], p[1]]);

// ================================================================== the scene
export class GaterasMapScene extends Scene {
  private chart = new Container();
  private pages = new Container();
  private beamPivot = new Container();
  private beam = new Graphics();
  private regionsLayer = new Container();
  private tearsLayer = new Container();
  private routeG = new Graphics();
  private routeAnim = new Graphics();
  private nodesLayer = new Container();
  private notesLayer = new Container();
  private overlay = new Container();
  private nodes = new Map<string, GNode>();
  /** the box the camera, the marker and the music follow */
  private focus: DimId = firstBox();
  /** the stage whose card is open */
  private selected: { dim: DimId; node: string } | null = null;
  private marker = new Container();
  private markerBase: Pt = [0, 0];
  private markerMoving = false;
  private hud!: Hud;
  private card: GateraCard | null = null;
  private tv: Container | null = null;
  private tvRoll: Graphics | null = null;
  private tvScreen: { x: number; y: number; w: number; h: number } | null = null;
  private tears = new Map<string, Container>();
  private t = 0;
  private cued = false;
  private busy = false;
  private huellasText: Text | null = null;
  /** Parte III · Maneki's Tienda de la Caja (orbs of the box cats you have): shown once one of them is with you */
  private manekiBtn: Button | null = null;
  private offView: (() => void) | null = null;

  constructor() {
    super();
    this.bleed = NB.desk;
  }
  /** app/story.ts where(): beats written `onlyOn: 'cajas'` (b69_manana b/c, A) play here when it's calm */
  readonly storyStage = 'cajas';

  override enter() {
    const desk = new TilingSprite({ texture: paperTexture(NB.desk, 512, 2.2), width: W, height: H });
    const blocker = new Graphics().rect(-4000, -4000, 8000 + W, 8000 + H).fill({ color: 0xffffff, alpha: 0.001 });
    blocker.eventMode = 'static';
    this.setupPan(blocker);
    this.chart.eventMode = 'static';
    this.setupPan(this.chart);
    this.addChild(desk, blocker, this.chart);
    this.buildPages();
    this.chart.addChild(this.pages, this.beamPivot, this.tearsLayer, this.regionsLayer, this.routeG, this.routeAnim, this.nodesLayer, this.notesLayer);
    this.buildIsland();
    this.buildBeam();
    this.buildTears();
    this.buildRegions();
    this.buildNotes();
    const b = boat(C.pink);
    this.marker.addChild(b);
    this.chart.addChild(this.marker);
    const vig = new Sprite(vignetteTexture());
    vig.width = W;
    vig.height = H;
    vig.eventMode = 'none';
    vig.alpha = 0.8;
    this.addChild(vig);
    this.buildMasthead();
    this.hud = new Hud({ mode: 'map', onGoal: (m: MissionDef) => this.onGoal(m) });
    this.addChild(this.hud, this.overlay);
    this.focus = focusBox(cajasMemo.dim);
    this.refresh();
    const open = GT.isOpen(this.focus);
    if (open) this.focusRegion(false);
    else this.overview(false);
    window.addEventListener('wheel', this.onWheel, { passive: false });
    this.startMusic();
    void this.arrive();
  }

  override exit() {
    this.offView?.();
    this.offView = null;
    window.removeEventListener('wheel', this.onWheel);
    gsap.killTweensOf(this.cam);
    if (this.cued) audioApi.release(1.2);
    killTree(this);
  }

  // ------------------------------------------------------------------ music: the box's bar (D's drunck.barra) when it exists
  private startMusic() {
    const d = GT.dimDef(this.focus);
    if (!GT.isOpen(d.id) || !d.music) return;
    try {
      if (!hasTrack(d.music)) return;
      audioApi.cue(d.music, { loop: true, fadeIn: 2, quantize: 'bar' });
      this.cued = true;
    } catch (e) {
      console.warn(`[cajas] sin música de ${d.name}`, e);
    }
  }

  // ------------------------------------------------------------------ camera (the Diario del Mar's rules: drag, wheel 1–2, CARTA)
  private cam = { s: 1, x: 0, y: 0 };
  private drag: { sx: number; sy: number; cx: number; cy: number; moved: boolean } | null = null;
  private applyCam() {
    const s = this.cam.s;
    const m = s > 1.05 ? 300 : 12;
    const minX = W - CHART_W * s - m;
    const maxX = m;
    const minY = H - CHART_H * s - m;
    const maxY = 100 - CHART_TOP * s + m;
    this.cam.x = Math.max(Math.min(minX, maxX), Math.min(Math.max(minX, maxX), this.cam.x));
    this.cam.y = Math.max(Math.min(minY, maxY), Math.min(Math.max(minY, maxY), this.cam.y));
    this.chart.scale.set(s);
    this.chart.position.set(this.cam.x, this.cam.y);
  }
  private camFor(cx: number, cy: number, s: number) {
    if (s <= 1.05) return { s, x: 0, y: 0 };
    return { s, x: (SAFE.x0 + SAFE.x1) / 2 - cx * s, y: (SAFE.y0 + SAFE.y1) / 2 - cy * s };
  }
  private focusOn(cx: number, cy: number, animate: boolean, s: number) {
    const t = this.camFor(cx, cy, s);
    if (!animate) {
      Object.assign(this.cam, t);
      this.applyCam();
      return;
    }
    gsap.to(this.cam, { ...t, duration: 0.6, ease: 'power3.inOut', onUpdate: () => this.applyCam() });
  }
  private focusRegion(animate = true, dim: DimId = this.focus) {
    const d = GT.dimDef(dim);
    // a little right of its centre: the pinned missions (left) never cover the screen
    this.focusOn(d.box.x + d.box.w / 2 + 70, d.box.y + d.box.h / 2 - 20, animate, ZOOM_IN);
  }
  private overview(animate = true) {
    this.focusOn(W / 2, H / 2, animate, 1);
  }
  private toggleZoom() {
    this.closeCard();
    if (this.cam.s > 1.05) this.overview();
    else this.focusRegion();
    sfx('paper');
  }
  private setupPan(target: Container) {
    target.on('pointerdown', (e) => {
      this.drag = { sx: e.global.x, sy: e.global.y, cx: this.cam.x, cy: this.cam.y, moved: false };
    });
    target.on('globalpointermove', (e) => {
      if (!this.drag) return;
      const k = 1 / this.worldScale();
      const dx = (e.global.x - this.drag.sx) * k;
      const dy = (e.global.y - this.drag.sy) * k;
      if (!this.drag.moved && Math.hypot(dx, dy) > 8) {
        this.drag.moved = true;
        this.closeCard();
      }
      if (this.drag.moved) {
        gsap.killTweensOf(this.cam);
        this.cam.x = this.drag.cx + dx;
        this.cam.y = this.drag.cy + dy;
        this.applyCam();
      }
    });
    const end = () => {
      const d = this.drag;
      this.drag = null;
      if (d && !d.moved && target !== this.chart) this.closeCard();
    };
    target.on('pointerup', end);
    target.on('pointerupoutside', end);
  }
  private worldScale() {
    let s = 1;
    let p: Container | null = this.parent;
    while (p) {
      s *= p.scale.x;
      p = p.parent;
    }
    return s || 1;
  }
  private onWheel = (e: WheelEvent) => {
    if (this.destroyed) return;
    e.preventDefault();
    const rect = (e.target as HTMLElement).getBoundingClientRect?.();
    if (!rect) return;
    const ws = this.worldScale();
    const root = this.parent?.parent;
    const lx = (e.clientX - rect.left - (root?.x ?? 0)) / ws;
    const ly = (e.clientY - rect.top - (root?.y ?? 0)) / ws;
    const s0 = this.cam.s;
    const s1 = Math.max(1, Math.min(2, s0 * (e.deltaY > 0 ? 0.9 : 1.1)));
    if (s1 === s0) return;
    const wx = (lx - this.cam.x) / s0;
    const wy = (ly - this.cam.y) / s0;
    this.cam.s = s1;
    this.cam.x = lx - wx * s1;
    this.cam.y = ly - wy * s1;
    gsap.killTweensOf(this.cam);
    this.applyCam();
  };

  // ------------------------------------------------------------------ the notebook: sewn pages, rules, margins, wax
  private buildPages() {
    const L = { x: 22, y: CHART_TOP - 6, w: 938, h: CHART_H - CHART_TOP + 2 };
    const R = { x: 960, y: CHART_TOP - 6, w: 938, h: CHART_H - CHART_TOP + 2 };
    const sh = new Graphics().rect(L.x + 14, L.y + 16, R.x + R.w - L.x, L.h).fill({ color: 0x000000, alpha: 0.45 });
    this.pages.addChild(sh);
    for (const [pg, i] of [
      [L, 0],
      [R, 1],
    ] as const) {
      const c = new Container();
      const base = new Graphics().rect(0, 0, pg.w, pg.h).fill(NB.paper);
      const grain = new TilingSprite({ texture: paperTexture(NB.paper, 512, 1.2), width: pg.w, height: pg.h });
      grain.alpha = 0.85;
      const g = new Graphics();
      // blue rules and the red margin (on the left of each page, like a real notebook)
      for (let y = 58; y < pg.h - 10; y += 34) g.moveTo(0, y).lineTo(pg.w, y);
      g.stroke({ width: 1.3, color: NB.rule, alpha: 0.42 });
      g.moveTo(i === 0 ? 72 : 52, 0)
        .lineTo(i === 0 ? 72 : 52, pg.h)
        .stroke({ width: 1.6, color: NB.margin, alpha: 0.55 });
      // the gutter's shade
      for (let k = 0; k < 10; k++) {
        const x = i === 0 ? pg.w - (k + 1) * 6 : k * 6;
        g.rect(x, 0, 6, pg.h).fill({ color: 0x6b5a3c, alpha: 0.11 - k * 0.011 });
      }
      // a dog-eared corner
      const cx = i === 0 ? 0 : pg.w;
      const dir = i === 0 ? 1 : -1;
      g.poly([cx, pg.h - 46, cx + dir * 46, pg.h, cx, pg.h]).fill(NB.desk);
      g.poly([cx, pg.h - 46, cx + dir * 46, pg.h, cx + dir * 40, pg.h - 40]).fill(0xe2d6b6).stroke({ width: 1.5, color: 0xb9a77c });
      c.addChild(base, grain, g);
      c.position.set(pg.x, pg.y);
      this.pages.addChild(c);
    }
    // the binding: red thread stitches down the gutter (sewn pages)
    const st = new Graphics();
    for (let y = CHART_TOP + 20; y < CHART_H - 20; y += 44) {
      st.moveTo(952, y).lineTo(968, y + 12).stroke({ width: 3, color: NB.thread, cap: 'round' });
      st.circle(952, y, 2.2).fill(0x5a3a2a);
      st.circle(968, y + 12, 2.2).fill(0x5a3a2a);
    }
    st.moveTo(960, CHART_TOP - 6)
      .lineTo(960, CHART_H - 4)
      .stroke({ width: 2, color: 0x8a7a5a, alpha: 0.6 });
    this.pages.addChild(st);
    // candle wax drips (her lamp burned nights over this)
    const wax = new Graphics();
    const drops: [number, number, number][] = [
      [214, 548, 30],
      [1712, 1010, 24],
      [1490, 170, 18],
      [690, 1030, 16],
      [1120, 470, 13],
    ];
    drops.forEach(([x, y, r], k) => {
      const pts = islandPoly(x, y, r, r * 0.8, 400 + k, 16, 0.35);
      wax.poly(flat(pts)).fill({ color: NB.wax, alpha: 0.42 }).stroke({ width: 1.5, color: 0xc9ae66, alpha: 0.5 });
      wax.circle(x - r * 0.25, y - r * 0.2, r * 0.22).fill({ color: 0xffffff, alpha: 0.25 });
    });
    this.pages.addChild(wax);
    // a strip of tape where a loose sheet was added later
    const tape = new Graphics().rect(-46, -14, 92, 28).fill({ color: NB.tape, alpha: 0.7 });
    tape.position.set(1820, 160);
    tape.rotation = 0.6;
    this.pages.addChild(tape);
  }

  // ------------------------------------------------------------------ your island, your faro (and its beam)
  private buildIsland() {
    const I = GT.REG.island;
    const g = new Graphics();
    const pts = islandPoly(I.x, I.y, I.r, I.r * 0.72, 61, 28, 0.2);
    drawIsland(g, pts, I.x, I.y, { land: 0xe8dcb8, ink: NB.pencil, rings: 4 });
    // palms and the little house (pencil)
    for (const [x, y] of [
      [I.x - 54, I.y + 6],
      [I.x - 30, I.y + 26],
    ] as Pt[]) {
      g.moveTo(x, y)
        .quadraticCurveTo(x + 4, y - 18, x + 2, y - 30)
        .stroke({ width: 2.5, color: NB.pencil });
      for (const a of [-2.6, -1.9, -1.2, -0.5]) g.moveTo(x + 2, y - 30).quadraticCurveTo(x + 2 + Math.cos(a) * 10, y - 34 + Math.sin(a) * 6, x + 2 + Math.cos(a) * 18, y - 28 + Math.sin(a) * 12).stroke({ width: 2, color: NB.pencil });
    }
    // the faro: striped tower + lamp room
    const [fx, fy] = I.faro;
    g.poly([fx - 14, fy + 44, fx + 14, fy + 44, fx + 9, fy - 20, fx - 9, fy - 20]).fill(0xfaf5e8).stroke({ width: 2.5, color: NB.pencil, join: 'round' });
    for (let k = 0; k < 3; k++) g.poly([fx - 13 + k * 1.6, fy + 30 - k * 20, fx + 13 - k * 1.6, fy + 30 - k * 20, fx + 12 - k * 1.6, fy + 22 - k * 20, fx - 12 + k * 1.6, fy + 22 - k * 20]).fill(0xd9786e);
    g.rect(fx - 12, fy - 32, 24, 12).fill(0xffe9a8).stroke({ width: 2.5, color: NB.pencil });
    g.poly([fx - 14, fy - 32, fx, fy - 46, fx + 14, fy - 32]).fill(NB.pencil);
    const home = hand('tu isla', 22, NB.pen, -0.06);
    home.position.set(I.x - 4, I.y + I.r * 0.72 + 30);
    const faro = hand('(el faro sí funciona)', 16, NB.pencil, 0.05);
    faro.position.set(fx + 92, fy - 30);
    this.chart.addChild(g);
    this.notesLayer.addChild(home, faro);
  }

  /** the beam: a soft wedge from the lamp that sweeps the whole notebook */
  private buildBeam() {
    const [fx, fy] = GT.REG.island.faro;
    this.beamPivot.position.set(fx, fy - 26);
    const g = this.beam;
    const L = 1500;
    for (let i = 0; i < 4; i++) {
      const a = 0.07 + i * 0.045;
      g.poly([0, 0, Math.cos(-a) * L, Math.sin(-a) * L, Math.cos(a) * L, Math.sin(a) * L]).fill({ color: 0xfff1b8, alpha: 0.075 });
    }
    g.blendMode = 'add';
    this.beamPivot.addChild(g);
    this.beamPivot.eventMode = 'none';
  }

  // ------------------------------------------------------------------ the tears (her ring of routes) and their pawprints
  private buildTears() {
    this.tearsLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.tears.clear();
    const I = GT.REG.island;
    const dims = GT.DIMS;
    // island → Borracha is the gatera Maneki opens; then box → box (Cerito's trail), and the last one comes home
    // a tear has a gatera (a door, or Maneki's lock) when it's the first box, it's open, or the story lets her sell it
    const segs: { id: string; dim: DimId | null; a: Pt; b: Pt; open: boolean; first: boolean; gate: boolean }[] = [];
    for (const d of dims) segs.push({ id: d.id, dim: d.id, a: d.tear[0] as Pt, b: d.tear[1] as Pt, open: GT.isOpen(d.id), first: d.order === 1, gate: d.order === 1 || GT.isOpen(d.id) || GT.storyAllows(d.id) });
    const pop = dims.find((d) => d.home);
    if (pop?.home) segs.push({ id: 'home', dim: null, a: pop.home[0] as Pt, b: pop.home[1] as Pt, open: false, first: false, gate: false });
    void I;
    for (const s of segs) {
      const c = this.tear(s.a, s.b, s.id.length * 13 + s.a[0], s.open, s.first, s.gate ? s.dim : null);
      this.tearsLayer.addChild(c);
      this.tears.set(s.id, c);
    }
  }

  /** a ragged slit in the paper from a to b, with pawprints; `open` = sewn into a gatera (red stitches + the little door) */
  private tear(a: Pt, b: Pt, seed: number, open: boolean, first: boolean, gate: DimId | null = null): Container {
    const c = new Container();
    const g = new Graphics();
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const n = Math.max(6, Math.round(len / 12));
    const top: number[] = [];
    const bot: number[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const w = Math.sin(t * Math.PI) * (first ? 16 : 11) + 2;
      const j1 = (hash1(seed + i * 3.1) - 0.5) * 7;
      const j2 = (hash1(seed + i * 5.7) - 0.5) * 7;
      const x = a[0] + dx * t;
      const y = a[1] + dy * t;
      top.push(x + nx * (w / 2 + j1), y + ny * (w / 2 + j1));
      bot.unshift(x - nx * (w / 2 + j2), y - ny * (w / 2 + j2));
    }
    const poly = [...top, ...bot];
    // the desk under the paper shows through; a pale curl on the torn lips
    g.poly(poly).fill(first ? 0x1a120c : 0x3a2c20);
    g.poly(top.concat(top.slice(-2))).stroke({ width: 2, color: 0xffffff, alpha: 0.6 });
    g.poly(poly).stroke({ width: 1.5, color: 0x8a7a5a, alpha: 0.8 });
    c.addChild(g);
    // pawprints walking along it (Cerito's trail): faint on the boxes she hasn't reached
    const pg = new Graphics();
    const steps = Math.max(3, Math.round(len / 34));
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const side = i % 2 ? 1 : -1;
      const x = a[0] + dx * t + nx * side * (first ? 26 : 22);
      const y = a[1] + dy * t + ny * side * (first ? 26 : 22);
      paw(pg, x, y, 0.62, NB.pencil, first ? 0.75 : 0.3);
    }
    c.addChild(pg);
    if (gate) {
      const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (open) {
        // sewn: red stitches across, and the gatera itself
        const sg = new Graphics();
        for (let i = 1; i < n; i += 2) {
          const t = i / n;
          const x = a[0] + dx * t;
          const y = a[1] + dy * t;
          sg.moveTo(x - nx * 14 - dx / len * 4, y - ny * 14 - dy / len * 4)
            .lineTo(x + nx * 14 + dx / len * 4, y + ny * 14 + dy / len * 4)
            .stroke({ width: 3, color: NB.thread, cap: 'round' });
        }
        sg.label = 'stitches';
        c.addChild(sg);
        const door = new Graphics();
        door.roundRect(-20, -26, 40, 46, 16).fill(BX.wood).stroke({ width: 3, color: C.ink });
        door.roundRect(-13, -18, 26, 32, 11).fill(BX.night).stroke({ width: 2, color: C.ink });
        door.rect(-12, -4, 24, 18).fill(BX.beer).stroke({ width: 2, color: C.ink });
        paw(door, 0, 4, 0.45, C.ink, 0.9);
        door.position.set(mid[0], mid[1]);
        door.label = 'gateraDoor';
        c.addChild(door);
      } else {
        // closed: Maneki's padlock on it (tap it: she sells the key)
        const lock = new Container();
        const lg = new Graphics();
        lg.arc(0, -12, 12, Math.PI, 0).stroke({ width: 6, color: 0x8a8f9a });
        lg.roundRect(-18, -12, 36, 30, 6).fill(0xd4a549).stroke({ width: 3, color: C.ink });
        lg.circle(0, 0, 4).fill(C.ink);
        lg.rect(-1.5, 0, 3, 9).fill(C.ink);
        lock.addChild(lg);
        lock.position.set(mid[0], mid[1]);
        lock.label = 'gateraLock';
        lock.eventMode = 'static';
        lock.cursor = 'pointer';
        lock.hitArea = { contains: (x: number, y: number) => x * x + y * y < 44 * 44 };
        lock.on('pointertap', (e) => {
          e.stopPropagation();
          void this.openPurchase(gate);
        });
        gsap.to(lock, { rotation: 0.12, yoyo: true, repeat: -1, duration: 0.6, ease: 'sine.inOut' });
        c.addChild(lock);
      }
    }
    return c;
  }

  // ------------------------------------------------------------------ the boxes
  private buildRegions() {
    this.regionsLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.tv = null;
    this.tvRoll = null;
    this.tvScreen = null;
    for (const d of GT.DIMS) this.regionsLayer.addChild(this.buildBox(d));
    this.buildNodes();
  }

  /** the LOOK registry (cartaModel.boxLook): the TV, a registered look, her open sheet, or the blank sheet */
  private buildBox(d: DimDef): Container {
    const open = GT.isOpen(d.id);
    const look = boxLook(d, open);
    if (look === 'tv') return this.buildTV(d, open);
    const extra = BOX_LOOKS.get(look);
    if (extra) return extra(d, open);
    if (look === 'sheet') return this.openSheet(d);
    return this.blankSheet(d);
  }

  /** an OPEN box with no look of its own yet: her sheet, a window in the box's palette where its route is drawn */
  private openSheet(d: DimDef): Container {
    const c = new Container();
    c.label = `sheet:${d.id}`;
    const { x, y, w, h } = d.box;
    const s = d.screen!;
    // the window wears the box's first palette color (its data), her pen blue without one
    const first = Object.values(d.palette ?? {})[0];
    const bg = first ? Number.parseInt(first.replace('#', ''), 16) : NB.pen;
    const g = new Graphics();
    const pts = tornRect(w, h, d.order * 7, 5, 18).map((v, i) => v + (i % 2 ? y : x));
    g.poly(pts.map((v) => v + 6)).fill({ color: 0x000000, alpha: 0.14 });
    g.poly(pts).fill(NB.paperBlank).stroke({ width: 1.5, color: 0xcfc3a3 });
    g.roundRect(s.x - 8, s.y - 8, s.w + 16, s.h + 16, 18).fill(C.ink);
    g.roundRect(s.x, s.y, s.w, s.h, 14).fill(bg);
    for (let yy = s.y + 12; yy < s.y + s.h; yy += 26) g.moveTo(s.x + 8, yy).lineTo(s.x + s.w - 8, yy).stroke({ width: 1, color: 0xffffff, alpha: 0.08 });
    const tape = new Graphics().rect(-150, -18, 300, 36).fill({ color: NB.tape, alpha: 0.9 });
    tape.position.set(x + w / 2, y - 2);
    const nm = hand(`${d.name} · ${d.sub}`, 22, NB.pen, -0.02);
    nm.position.set(tape.x, tape.y);
    c.addChild(g, tape, nm);
    return c;
  }

  /** a box she hasn't reached: a blank sheet taped on, one pawprint, her note */
  private blankSheet(d: DimDef): Container {
    const c = new Container();
    const { x, y, w, h } = d.box;
    const pts = tornRect(w, h, d.order * 7, 5, 18);
    const g = new Graphics();
    g.poly(pts.map((v, i) => v + (i % 2 ? 6 : 6))).fill({ color: 0x000000, alpha: 0.12 });
    g.poly(pts).fill(NB.paperBlank).stroke({ width: 1.5, color: 0xcfc3a3 });
    // a box she will draw one day: just the pencil guide of an open box in perspective
    const bx = w * 0.3;
    const by = h * 0.36;
    const bw = w * 0.4;
    const bh = h * 0.34;
    g.rect(bx, by, bw, bh).stroke({ width: 1.2, color: NB.pencil, alpha: 0.22 });
    g.poly([bx, by, bx + 30, by - 26, bx + bw + 30, by - 26, bx + bw, by]).stroke({ width: 1.2, color: NB.pencil, alpha: 0.22 });
    g.poly([bx + bw, by, bx + bw + 30, by - 26, bx + bw + 30, by + bh - 26, bx + bw, by + bh]).stroke({ width: 1.2, color: NB.pencil, alpha: 0.22 });
    paw(g, w / 2, h / 2 + 8, 1.6, NB.pencil, 0.55);
    // two strips of tape
    const t1 = new Graphics().rect(-38, -11, 76, 22).fill({ color: NB.tape, alpha: 0.75 });
    t1.position.set(26, 8);
    t1.rotation = -0.7;
    const t2 = new Graphics().rect(-38, -11, 76, 22).fill({ color: NB.tape, alpha: 0.75 });
    t2.position.set(w - 24, h - 10);
    t2.rotation = -0.6;
    const note = hand('aquí no he llegado', 26, NB.pen, (hash1(d.order) - 0.5) * 0.12);
    note.position.set(w / 2, h * 0.78);
    const q = hand('?', 40, NB.pencil, 0.1);
    q.alpha = 0.45;
    q.position.set(w * 0.82, h * 0.26);
    c.addChild(g, t1, t2, note, q);
    c.position.set(x, y);
    c.eventMode = 'static';
    c.cursor = 'pointer';
    c.on('pointertap', (e) => {
      e.stopPropagation();
      sfx('error');
      gsap.fromTo(c, { x: x - 5 }, { x, duration: 0.35, ease: 'elastic.out(1,0.3)' });
      toast('Aquí no he llegado', { color: NB.paper, sub: 'Luzterna sigue el rastro con las huellas de la caja anterior.' });
    });
    return c;
  }

  /** La Borracha: an old TV in perspective (an open box), its screen a 90s cartoon night */
  private buildTV(d: DimDef, on: boolean): Container {
    const c = new Container();
    c.label = 'tv';
    const { x, y, w, h } = d.box;
    const s = d.screen!;
    this.tvScreen = s;
    const g = new Graphics();
    const dz = 36;
    // shadow, side and top faces (perspective), the front cabinet
    g.roundRect(x + 14, y + 18, w - 30, h - 20, 26).fill({ color: 0x000000, alpha: 0.28 });
    g.poly([x + w - 40, y + 4, x + w - 40 + dz, y + 4 - dz, x + w - 40 + dz, y + h - 46 - dz, x + w - 40, y + h - 46]).fill(BX.woodLo).stroke({ width: 3, color: C.ink, join: 'round' });
    g.poly([x + 8, y + 4, x + 8 + dz, y + 4 - dz, x + w - 40 + dz, y + 4 - dz, x + w - 40, y + 4]).fill(BX.woodHi).stroke({ width: 3, color: C.ink, join: 'round' });
    g.roundRect(x, y, w - 40, h - 46, 22).fill(BX.wood).stroke({ width: 4, color: C.ink });
    // wood grain
    for (let i = 0; i < 9; i++) {
      const gy = y + 20 + i * ((h - 80) / 9);
      g.moveTo(x + 12, gy)
        .bezierCurveTo(x + w * 0.3, gy + 6, x + w * 0.6, gy - 6, x + w - 56, gy + 3)
        .stroke({ width: 1.2, color: BX.woodLo, alpha: 0.55 });
    }
    // legs
    g.poly([x + 40, y + h - 48, x + 58, y + h - 48, x + 48, y + h - 6, x + 34, y + h - 6]).fill(BX.woodLo).stroke({ width: 3, color: C.ink, join: 'round' });
    g.poly([x + w - 120, y + h - 48, x + w - 102, y + h - 48, x + w - 96, y + h - 6, x + w - 110, y + h - 6]).fill(BX.woodLo).stroke({ width: 3, color: C.ink, join: 'round' });
    // rabbit-ear antennas from the top face
    const ax = x + w * 0.46 + dz / 2;
    const ay = y + 4 - dz / 2;
    g.ellipse(ax, ay, 26, 9).fill(0x3a3f52).stroke({ width: 2.5, color: C.ink });
    g.moveTo(ax - 6, ay).lineTo(ax - 70, ay - 96).stroke({ width: 3, color: 0x9aa0b0 });
    g.moveTo(ax + 6, ay).lineTo(ax + 64, ay - 104).stroke({ width: 3, color: 0x9aa0b0 });
    g.circle(ax - 70, ay - 96, 6).fill(BX.donut).stroke({ width: 2, color: C.ink });
    g.circle(ax + 64, ay - 104, 6).fill(BX.beer).stroke({ width: 2, color: C.ink });
    // the control panel: knobs, grille, a little plate
    const px = s.x + s.w + 18;
    const pw = x + w - 40 - px - 16;
    g.roundRect(px, s.y, pw, s.h, 10).fill(0x4a2e1a).stroke({ width: 2.5, color: C.ink });
    for (const [k, col] of [
      [0, BX.beer],
      [1, BX.donut],
    ] as const) {
      const kx = px + pw / 2;
      const ky = s.y + 46 + k * 78;
      g.circle(kx, ky, 24).fill(col).stroke({ width: 3, color: C.ink });
      g.circle(kx, ky, 15).fill({ color: 0xffffff, alpha: 0.18 });
      g.moveTo(kx, ky).lineTo(kx + Math.cos(-1.1 + k) * 18, ky + Math.sin(-1.1 + k) * 18).stroke({ width: 3, color: C.ink, cap: 'round' });
    }
    for (let i = 0; i < 7; i++) g.moveTo(px + 12, s.y + 200 + i * 12).lineTo(px + pw - 12, s.y + 200 + i * 12).stroke({ width: 3, color: 0x2b1d12, cap: 'round' });
    g.circle(px + pw / 2, s.y + s.h - 22, 6).fill(on ? BX.bottle : 0x444444).stroke({ width: 2, color: C.ink });
    // the bezel and the CRT glass
    g.roundRect(s.x - 12, s.y - 12, s.w + 24, s.h + 24, 30).fill(0x231a14).stroke({ width: 3, color: C.ink });
    c.addChild(g);
    const screen = new Container();
    const mask = new Graphics().roundRect(s.x, s.y, s.w, s.h, 26).fill(0xffffff);
    screen.mask = mask;
    c.addChild(screen, mask);
    if (on) {
      screen.addChild(this.nightCartoon(s));
      const roll = new Graphics().rect(s.x, 0, s.w, 26).fill({ color: 0xffffff, alpha: 0.05 });
      roll.y = s.y;
      screen.addChild(roll);
      this.tvRoll = roll;
    } else {
      // off: a dead grey glass with a little static, and her note
      const off = new Graphics().rect(s.x, s.y, s.w, s.h).fill(0x3a3d44);
      for (let i = 0; i < 260; i++) off.rect(s.x + hash1(i * 3.3) * s.w, s.y + hash1(i * 7.1) * s.h, 2, 2).fill({ color: 0xffffff, alpha: 0.12 + hash1(i) * 0.2 });
      screen.addChild(off);
      const t = hand('huele a cerveza', 30, 0xf3ead2, -0.05);
      t.position.set(s.x + s.w / 2, s.y + s.h / 2);
      screen.addChild(t);
    }
    // scanlines + glare over everything on the glass
    const fx = new Graphics();
    for (let yy = s.y; yy < s.y + s.h; yy += 4) fx.rect(s.x, yy, s.w, 1.2).fill({ color: 0x000000, alpha: 0.12 });
    fx.ellipse(s.x + s.w * 0.28, s.y + s.h * 0.18, s.w * 0.3, s.h * 0.12).fill({ color: 0xffffff, alpha: 0.07 });
    fx.eventMode = 'none';
    screen.addChild(fx);
    const glassEdge = new Graphics().roundRect(s.x, s.y, s.w, s.h, 26).stroke({ width: 4, color: 0x0b0806 });
    c.addChild(glassEdge);
    // the box's name, on a strip of masking tape across the top (her label)
    const tape = new Graphics().rect(-150, -18, 300, 36).fill({ color: NB.tape, alpha: 0.9 });
    tape.position.set(x + (w - 40) / 2, y - 2);
    tape.rotation = -0.02;
    const nm = hand(on ? `${d.name} · ${d.sub}` : 'la de la cerveza', 22, NB.pen, -0.02);
    nm.position.set(tape.x, tape.y);
    c.addChild(tape, nm);
    this.tv = c;
    return c;
  }

  /** the cartoon on the screen: night street, bar windows, a donut sign, a bottle sign, a moon (never yellow skin) */
  private nightCartoon(s: { x: number; y: number; w: number; h: number }): Container {
    const c = new Container();
    const g = new Graphics();
    const bands = [BX.nightDeep, 0x142142, 0x1b2a4a, 0x223460, BX.nightHi];
    bands.forEach((col, i) => g.rect(s.x, s.y + (i * s.h * 0.62) / bands.length, s.w, (s.h * 0.62) / bands.length + 1).fill(col));
    g.rect(s.x, s.y + s.h * 0.62, s.w, s.h * 0.38).fill(0x16223e);
    // stars
    for (let i = 0; i < 22; i++) {
      const sx = s.x + hash1(i * 4.7) * s.w;
      const sy = s.y + hash1(i * 9.1) * s.h * 0.4;
      const r = 1.2 + hash1(i) * 2;
      g.star(sx, sy, 4, r * 2, r * 0.6).fill({ color: 0xfff1c8, alpha: 0.85 });
    }
    // the moon (a slice of lemon)
    const mx = s.x + s.w * 0.6;
    const my = s.y + s.h * 0.1;
    g.circle(mx, my, 24).fill(0xffe9b8);
    g.circle(mx - 9, my - 5, 21).fill(0x142142);
    // buildings: dark blocks with amber windows, along the street
    const blocks: [number, number, number][] = [
      [0.0, 0.42, 0.14],
      [0.13, 0.5, 0.12],
      [0.24, 0.38, 0.16],
      [0.39, 0.46, 0.13],
      [0.51, 0.34, 0.15],
      [0.65, 0.44, 0.12],
      [0.76, 0.4, 0.14],
      [0.89, 0.48, 0.12],
    ];
    blocks.forEach(([bx0, top, bw], i) => {
      const bx = s.x + bx0 * s.w;
      const by = s.y + top * s.h;
      const ww = bw * s.w;
      const hh = s.y + s.h * 0.66 - by;
      g.rect(bx, by, ww, hh).fill(i % 2 ? 0x101a30 : 0x0d1526).stroke({ width: 2, color: 0x070b14 });
      for (let wy = by + 10; wy < by + hh - 14; wy += 22)
        for (let wx = bx + 8; wx < bx + ww - 12; wx += 18) {
          const lit = hash1(i * 31 + wx * 0.7 + wy * 1.3) > 0.42;
          g.rect(wx, wy, 9, 11).fill(lit ? 0xffc06a : 0x1d2846);
        }
    });
    // the donut sign (La Donería)
    const dx = s.x + s.w * 0.13;
    const dy = s.y + s.h * 0.45;
    g.circle(dx, dy, 34).fill({ color: BX.donut, alpha: 0.18 });
    g.circle(dx, dy, 22).stroke({ width: 11, color: BX.donut });
    g.circle(dx, dy, 22).stroke({ width: 2, color: 0xffd0e2 });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      g.moveTo(dx + Math.cos(a) * 20, dy + Math.sin(a) * 20)
        .lineTo(dx + Math.cos(a + 0.2) * 24, dy + Math.sin(a + 0.2) * 24)
        .stroke({ width: 2.5, color: [0xffffff, BX.beer, 0x7fd8ff][i % 3] });
    }
    // the bottle sign (el callejón)
    const ox = s.x + s.w * 0.57;
    const oy = s.y + s.h * 0.48;
    g.roundRect(ox - 11, oy - 8, 22, 40, 6).fill(BX.bottle).stroke({ width: 2.5, color: 0x0b2a18 });
    g.rect(ox - 4, oy - 22, 8, 16).fill(BX.bottle).stroke({ width: 2, color: 0x0b2a18 });
    g.rect(ox - 6, oy + 4, 12, 12).fill(0xf3ead2);
    g.rect(ox - 7, oy - 4, 4, 26).fill({ color: 0xffffff, alpha: 0.35 });
    // street: lamps with their cones of beer-colored light, puddles
    for (const lx of [0.08, 0.46, 0.9]) {
      const X = s.x + lx * s.w;
      const Y0 = s.y + s.h * 0.66;
      g.poly([X, Y0 - 50, X - 46, s.y + s.h, X + 46, s.y + s.h]).fill({ color: 0xffc06a, alpha: 0.1 });
      g.moveTo(X, s.y + s.h).lineTo(X, Y0 - 50).stroke({ width: 4, color: 0x0b1222 });
      g.circle(X, Y0 - 52, 6).fill(0xffe0a8);
    }
    g.ellipse(s.x + s.w * 0.3, s.y + s.h * 0.9, 50, 7).fill({ color: 0x2a3d6e, alpha: 0.9 });
    g.ellipse(s.x + s.w * 0.72, s.y + s.h * 0.95, 40, 6).fill({ color: 0x2a3d6e, alpha: 0.9 });
    c.addChild(g);
    // the bar's neon
    const neon = txt('LA ÚLTIMA RONDA', { fontFamily: F.comic, fontSize: 22, fill: BX.beer, stroke: { color: 0x3a1e0a, width: 4 }, letterSpacing: 2 });
    neon.anchor.set(0.5);
    neon.position.set(s.x + s.w * 0.64, s.y + s.h * 0.7);
    neon.rotation = -0.03;
    c.addChild(neon);
    return c;
  }

  // ------------------------------------------------------------------ nodes & routes (inside the screen)
  private buildNodes() {
    this.nodesLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.nodes.clear();
    const boxes = openBoxes();
    if (!boxes.length) {
      this.marker.visible = false;
      this.routeG.clear();
      return;
    }
    this.marker.visible = true;
    for (const m of cartaModel().nodes) {
      const d = GT.dimDef(m.dim);
      const n = new GNode(m.def, m.kind, m.dim, m.node);
      n.position.set(m.pos[0], m.pos[1]);
      n.on('pointertap', (e) => {
        e.stopPropagation();
        void this.select(n);
      });
      this.nodesLayer.addChild(n);
      this.nodes.set(n.key, n);
      const note = m.def.note;
      if (note && d.screen) {
        const s = d.screen;
        const t = hand(note.text, 17, 0xf3ead2, note.rot ?? 0);
        t.alpha = 0.92;
        t.position.set(s.x + note.at[0] * s.w, s.y + note.at[1] * s.h);
        this.nodesLayer.addChild(t);
      }
    }
    void modelNodePos;
  }
  private curvePts(a: Pt, b: Pt, bend: number, t1 = 1): Pt[] {
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const cx = mx + (-dy / len) * bend;
    const cy = my + (dx / len) * bend;
    const n = Math.max(8, Math.round(len / 4));
    const pts: Pt[] = [];
    for (let i = 0; i <= n * t1; i++) {
      const t = i / n;
      pts.push([(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * cx + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * cy + t * t * b[1]]);
    }
    return pts;
  }
  private strokeRoute(g: Graphics, pts: Pt[], cleared: boolean, rA: number, rB: number, end: Pt) {
    let acc = 0;
    const start = pts[0];
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const dA = Math.hypot(x1 - start[0], y1 - start[1]);
      const dB = Math.hypot(x1 - end[0], y1 - end[1]);
      acc += Math.hypot(x1 - x0, y1 - y0);
      if (dA < rA + 6 || dB < rB + 6) continue;
      if (cleared) {
        if (acc % 18 < 11) g.moveTo(x0, y0).lineTo(x1, y1);
      } else if (acc % 12 < 4) g.circle(x1, y1, 2.4);
    }
    if (cleared) g.stroke({ width: 4.5, color: 0xff3b55, cap: 'round' });
    else g.fill({ color: 0xf3ead2, alpha: 0.8 });
  }
  /** every open box's route (cartaModel); `skip` = the node key whose incoming segment is being inked */
  private drawRoutes(skip: string | null = null) {
    const g = this.routeG.clear();
    for (const r of cartaModel().routes) {
      const b = this.nodes.get(nodeKey(r.dim, r.to));
      const rb = (b?.r ?? 23) + 5;
      this.strokeRoute(g, this.curvePts(r.a, r.b, r.bend), r.cleared && nodeKey(r.dim, r.to) !== skip, r.side ? 24 : 30, rb, r.b);
    }
  }

  private refresh() {
    if (this.manekiBtn && !this.manekiBtn.destroyed) this.manekiBtn.visible = hasBoxCat();
    // a node appeared (La Ronda revealed the detour) or went away: rebuild them from the model
    const model = cartaModel();
    if (model.nodes.length !== this.nodes.size || model.nodes.some((m) => !this.nodes.has(m.key))) this.buildNodes();
    const byKey = new Map(model.nodes.map((m) => [m.key, m]));
    const fr = new Map<DimId, number | null>();
    for (const n of this.nodes.values()) {
      if (!fr.has(n.dim)) fr.set(n.dim, GT.frontierOf(n.dim));
      const m = byKey.get(n.key);
      n.state = m?.state ?? 'locked';
      n.isFrontier = !!m?.frontier;
      n.redraw();
    }
    // the little boat sits at the focused box's frontier (else its last won stage)
    const f = fr.get(this.focus) ?? GT.frontierOf(this.focus);
    // (a box that isn't a line has no stage numbers: its first open node, else its last won one)
    const line = GT.shapeOf(this.focus) === 'line';
    const fn = (f ? this.nodes.get(nodeKey(this.focus, f)) : null) ?? (line ? null : [...this.nodes.values()].find((n) => n.dim === this.focus && n.isFrontier));
    const last = fn ?? [...this.nodes.values()].filter((n) => n.dim === this.focus && (!line || !Number.isNaN(n.n)) && n.state === 'cleared').pop() ?? null;
    if (last && !this.markerMoving) this.placeMarker(last.x, last.y - last.r - 18);
    this.drawRoutes();
    if (this.huellasText) this.huellasText.text = `HUELLAS DE 000 · ${GT.huellas()}`;
  }
  private placeMarker(x: number, y: number) {
    this.markerBase = [x + 34, y + 10];
    this.marker.position.set(this.markerBase[0], this.markerBase[1]);
  }

  // ------------------------------------------------------------------ notes in the margins (her handwriting)
  private buildNotes() {
    this.boxNotes(false);
    if (GT.seenG('maneki_note')) this.manekiNote(false);
    // her page number
    const pn = hand('— 1 —', 18, NB.pencil);
    pn.position.set(1810, 1040);
    this.notesLayer.addChild(pn);
  }
  /** her notes on an open box (closed, the dead TV already says it smells of beer) */
  private boxNotes(animate: boolean, only: DimId | null = null) {
    for (const d of GT.DIMS) {
      if (!GT.isOpen(d.id) || (only && d.id !== only)) continue;
      for (const nt of d.notes ?? []) {
        const t = hand(nt.text, 20, NB.pen, nt.rot ?? 0);
        t.position.set(nt.at[0], nt.at[1]);
        this.notesLayer.addChild(t);
        if (animate && !settings.reduceMotion) gsap.from(t, { alpha: 0, duration: 1, delay: 0.6 });
      }
    }
  }
  /** M5: her note about paying a janitor with keys, by the gatera */
  private manekiNote(animate: boolean) {
    const t = hand(`«${wrap2(cartaLines(CARTA_LINES.nota)[0]?.[1] ?? '')}»`, 18, NB.pen, -0.05);
    t.position.set(812, 852);
    this.notesLayer.addChild(t);
    if (animate && !settings.reduceMotion) {
      t.alpha = 0;
      gsap.to(t, { alpha: 1, duration: 1.2, ease: 'power1.out' });
    }
  }

  // ------------------------------------------------------------------ masthead + buttons
  private buildMasthead() {
    const band = new Container();
    const bg = new TilingSprite({ texture: paperTexture(NB.paper, 512, 1.3), width: W, height: 100 });
    let rule = doubleRule(W, NB.pen, 2);
    rule.position.set(0, 98);
    const cx = 790;
    const title = txt('La Carta de las Cajas', { fontFamily: F.brush, fontSize: 54, fill: NB.pen });
    title.anchor.set(0.5, 0);
    title.position.set(cx, 2);
    const line = txt('CUADERNO DE FARERA · CAPITANA LUZTERNA · HOJA 1', { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: NB.pencil, letterSpacing: 2 });
    line.anchor.set(0.5, 0);
    line.position.set(cx, 74);
    band.addChild(bg, rule, title, line);
    band.eventMode = 'static';
    this.addChild(band);
    // the huellas you carry (they open the next box, with Maneki)
    const hb = new Container();
    const hg = new Graphics().roundRect(0, 0, 330, 52, 10).fill(NB.paper).stroke({ width: 3, color: C.ink });
    paw(hg, 30, 28, 1, C.ink);
    const ht = txt(`HUELLAS DE 000 · ${GT.huellas()}`, { fontFamily: F.poster, fontSize: 26, fill: C.ink });
    ht.position.set(56, 9);
    this.huellasText = ht;
    hb.addChild(hg, ht);
    hb.eventMode = 'static';
    hb.cursor = 'pointer';
    hb.on('pointertap', () => toast(`Huellas de 000: ${GT.huellas()}`, { color: NB.paper, sub: 'Cada etapa que ganas por primera vez deja 3; el jefe de una caja, 10. Con ellas Luzterna dibuja dónde sigue el rastro.' }));
    this.addChild(hb);
    const zoom = new Button('CARTA', () => this.toggleZoom(), { w: 190, h: 64, size: 30, color: NB.paper });
    const diario = new Button('DIARIO DEL MAR', () => void import('../app/flow').then((f) => f.goMap()), { w: 190, h: 64, size: 22, color: P.aged });
    // her notebook's other half: the mission cards met so far (A's panel)
    const bit = new Button('BITÁCORA', () => void import('../panels/Bitacora').then((b) => b.openBitacora()), { w: 190, h: 64, size: 28, color: 0xf6efdc });
    this.addChild(zoom, diario, bit);
    // Parte III: Maneki sells orbs of the box cats you have (panels/TiendaCaja.ts), at the shop's own price
    const maneki = new Button('MANEKI', () => void import('../panels/TiendaCaja').then((t) => t.openTiendaCaja()), { w: 190, h: 64, size: 28, color: 0xf2c230 });
    maneki.visible = hasBoxCat();
    this.manekiBtn = maneki;
    this.addChild(maneki);
    const layout = (v: { x: number; y: number; w: number; h: number }) => {
      band.position.set(v.x, v.y);
      bg.width = v.w;
      rule.destroy();
      rule = doubleRule(v.w, NB.pen, 2);
      rule.position.set(0, 98);
      band.addChildAt(rule, 1);
      title.x = cx - v.x;
      line.x = cx - v.x;
      zoom.position.set(v.x + v.w - 24 - 196, v.y + v.h - 24 - 70);
      diario.position.set(v.x + v.w - 24 - 196, v.y + v.h - 24 - 70 - 84);
      bit.position.set(v.x + v.w - 24 - 196, v.y + v.h - 24 - 70 - 168);
      // above the huellas chip: the bottom row is the island's HUD on narrow views
      maneki.position.set(v.x + v.w - 24 - 196, v.y + v.h - 24 - 70 - 168 - 70 - 84);
      hb.position.set(v.x + v.w - 24 - 336, v.y + v.h - 24 - 70 - 168 - 70);
    };
    layout(game.view);
    this.offView = game.onView(layout);
  }

  private onGoal(m: MissionDef) {
    if (cajasGoal(m.goal as never)) {
      // already here: the pin's IR just points at what to do (the goal's box: its battle, or its gatera feature)
      const g = m.goal as { battle?: unknown; feature?: unknown };
      const fromFeature = /^p3_gatera_([a-z]+)$/.exec(String(g.feature ?? ''))?.[1];
      const dim = GT.parseBattleId(String(g.battle ?? ''))?.dim ?? (fromFeature && GT.DIM_IDS.includes(`p3d_${fromFeature}` as DimId) ? (`p3d_${fromFeature}` as DimId) : this.focus);
      if (!GT.isOpen(dim)) void this.openPurchase(dim);
      else {
        this.focus = dim;
        this.focusRegion();
      }
      return;
    }
    void import('../panels/Missions').then((x) => x.openMissions());
  }

  // ------------------------------------------------------------------ arriving: the first visit, or the route after a battle
  private async arrive() {
    if (this.busy) return;
    this.busy = true;
    try {
      this.popIn();
      if (!GT.seenG('carta_intro') && GT.cartaAvailable() && !GT.isOpen(firstBox())) await this.firstVisit();
      else if (cajasMemo.dim && cajasMemo.loot) await this.afterBattle();
    } finally {
      this.busy = false;
    }
  }

  private popIn() {
    let i = 0;
    for (const n of this.nodes.values()) {
      const s = n.scale.x;
      gsap.fromTo(n.scale, { x: s * 0.45, y: s * 0.45 }, { x: s, y: s, duration: 0.3, delay: 0.15 + i * 0.03, ease: 'back.out(2.5)' });
      gsap.from(n, { alpha: 0, duration: 0.2, delay: 0.15 + i++ * 0.03 });
    }
  }

  /** M1–M5 (04-guion §7): her hand draws the carta, Maneki sweeps in with the keys, the price */
  private async firstVisit() {
    // M1 is Luzterna at the faro (A plays it on the island); here her hand draws the carta (M2) and Maneki sweeps in (M3–M4)
    await this.drawOn();
    await say(cartaLines(CARTA_LINES.dibuja));
    await this.manekiSweeps();
    await say(cartaLines(CARTA_LINES.maneki));
    GT.markSeenG('carta_intro');
    G.save();
    await this.openPurchase(firstBox());
  }

  /** her hand draws it: the island, the faro, then each tear and each blank sheet, one after another */
  private drawOn(): Promise<void> {
    if (settings.reduceMotion) return Promise.resolve();
    const items: Container[] = [...this.tearsLayer.children, ...this.regionsLayer.children] as Container[];
    const pencil = new Graphics();
    pencil.poly([0, 0, 10, -6, 74, -70, 64, -80, 0, -16]).fill(0xe8a33d).stroke({ width: 2.5, color: C.ink, join: 'round' });
    pencil.poly([0, 0, 10, -6, 0, -16]).fill(0x55535e);
    pencil.rect(62, -84, 14, 14).fill(0xf59ac0).stroke({ width: 2, color: C.ink });
    this.chart.addChild(pencil);
    for (const it of items) it.alpha = 0;
    this.notesLayer.alpha = 0;
    const I = GT.REG.island;
    pencil.position.set(I.x, I.y);
    return new Promise((res) => {
      const tl = gsap.timeline({
        onComplete: () => {
          pencil.destroy();
          res();
        },
      });
      for (const it of items) {
        const b = it.getLocalBounds();
        const cx = it.x + b.x + b.width / 2;
        const cy = it.y + b.y + b.height / 2;
        tl.to(pencil, { x: cx, y: cy, duration: 0.32, ease: 'power2.inOut', onStart: () => sfx('paper') });
        tl.to(it, { alpha: 1, duration: 0.28 }, '<0.12');
      }
      tl.to(this.notesLayer, { alpha: 1, duration: 0.5 });
      tl.to(pencil, { alpha: 0, duration: 0.3 });
    });
  }

  /** M3: a little bell, and a broom's dust crossing the page */
  private manekiSweeps(): Promise<void> {
    sfx('meow', 1.3);
    if (settings.reduceMotion) return Promise.resolve();
    const dust = new Container();
    this.chart.addChild(dust);
    return new Promise((res) => {
      const p = { x: 120 };
      gsap.to(p, {
        x: 1800,
        duration: 1.6,
        ease: 'sine.inOut',
        onUpdate: () => sparkles(dust, p.x, 1020 + Math.sin(p.x * 0.02) * 10, 0xe6cf8e, 2, 40),
        onComplete: () => {
          gsap.to(dust, { alpha: 0, duration: 0.6, onComplete: () => dust.destroy({ children: true }) });
          res();
        },
      });
    });
  }

  /** M5: Maneki's key tag — the price (15 min of your island's income), PAGAR / LUEGO */
  private openPurchase(dim: DimId): Promise<void> {
    this.closeCard();
    const old = this.overlay.getChildByLabel('manekiTag');
    old?.destroy({ children: true });
    return new Promise((resolve) => {
      const tag = new Container();
      tag.label = 'manekiTag';
      const w = 620;
      const h = 430;
      const g = new Graphics();
      g.roundRect(10, 12, w, h, 24).fill({ color: C.ink, alpha: 0.85 });
      g.roundRect(0, 0, w, h, 24).fill(0xfbf1d6).stroke({ width: 4, color: C.ink });
      g.circle(w / 2, 34, 16).fill(0xd4a549).stroke({ width: 3, color: C.ink });
      g.circle(w / 2, 34, 6).fill(C.ink);
      tag.addChild(g);
      const cost = GT.gateraPrice(dim);
      const title = txt(GT.dimDef(dim).gatera ?? `LA GATERA: ${GT.dimDef(dim).name}`, { fontFamily: F.poster, fontSize: 40, fill: C.ink });
      title.anchor.set(0.5, 0);
      title.position.set(w / 2, 62);
      const sub = txt('Maneki tiene la llave. «La escoba no se paga sola.»', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 19, fill: P.blue, wordWrap: true, wordWrapWidth: w - 60, align: 'center' });
      sub.anchor.set(0.5, 0);
      sub.position.set(w / 2, 114);
      const price = resChip('gold', fmt(cost.gold), true, 40);
      price.position.set(w / 2 - price.width / 2, 168);
      const why = label(`Son unos ${Math.round(GT.dimDef(dim).price.secs / 60)} minutos de lo que gana tu isla (nunca menos de ${fmt(GT.dimDef(dim).price.floor)}). Tienes ${fmt(G.s.gold)}.`, 16, C.ink, { wordWrap: true, wordWrapWidth: w - 70, align: 'center' });
      why.anchor.set(0.5, 0);
      why.position.set(w / 2, 232);
      tag.addChild(title, sub, price, why);
      const can = G.s.gold >= cost.gold && GT.storyAllows(dim);
      const close = (paid: boolean) => {
        gsap.to(tag, {
          alpha: 0,
          duration: 0.15,
          onComplete: () => {
            tag.destroy({ children: true });
            if (paid) void this.gateraOpens(dim).then(resolve);
            else resolve();
          },
        });
      };
      const pay = new Button(can ? 'PAGAR' : GT.storyAllows(dim) ? `TE FALTAN ${fmt(cost.gold - G.s.gold)}` : 'AÚN NO', () => {
        const r = GT.buyGatera(dim);
        if (!r.ok) {
          sfx('error');
          toast(r.why === 'gold' ? 'No te alcanza todavía' : 'Maneki todavía no abre esta', { sub: r.why === 'gold' ? 'Tu isla junta el oro sola mientras juegas. Vuelve en un rato.' : 'La historia todavía no llega aquí.' });
          return;
        }
        sfx('coin');
        close(true);
      }, { w: 300, h: 76, size: can ? 40 : 24, color: can ? C.pink : P.agedDark, disabled: !can });
      // Button's origin is its top-left: the pair (300 + 20 + 200) is centered on the tag
      pay.position.set((w - 520) / 2, h - 104);
      const later = new Button('LUEGO', () => close(false), { w: 200, h: 76, size: 32, color: P.aged });
      later.position.set((w - 520) / 2 + 300 + 20, h - 104);
      tag.addChild(pay, later);
      tag.position.set((W - w) / 2, (H - h) / 2 + 40);
      tag.eventMode = 'static';
      this.overlay.addChild(tag);
      if (!settings.reduceMotion) {
        tag.pivot.set(w / 2, 0);
        tag.x += w / 2;
        gsap.from(tag, { rotation: 0.25, y: tag.y - 120, alpha: 0, duration: 0.45, ease: 'back.out(1.6)' });
      }
    });
  }

  /** M5–M6: paid. Her margin note, the tear sewn into a gatera, the TV comes on, B-1 appears, her line */
  private async gateraOpens(dim: DimId) {
    const isFirst = dim === firstBox();
    if (isFirst) {
      GT.markSeenG('maneki_note');
      this.manekiNote(true);
    }
    // left the Carta mid-animation (ISLA, DIARIO DEL MAR): the box is bought; nothing more to draw (QA-FINAL)
    const gone = () => {
      if (!this.destroyed) return false;
      GT.markSeenG(`gatera_${boxSuffix(dim)}`);
      return true;
    };
    await wait(500);
    if (gone()) return;
    // the tear gets sewn
    this.buildTears();
    const first = this.tears.get(dim);
    const stitches = first?.getChildByLabel('stitches');
    const door = first?.getChildByLabel('gateraDoor');
    if (stitches && !settings.reduceMotion) {
      stitches.alpha = 0;
      gsap.to(stitches, { alpha: 1, duration: 0.8 });
    }
    if (door && !settings.reduceMotion) gsap.from(door.scale, { x: 0, y: 0, duration: 0.45, ease: 'back.out(2.5)', delay: 0.6 });
    sfx('reveal');
    await wait(900);
    if (gone()) return;
    // the box comes on (a TV switching on: a white line opens into the picture)
    this.focus = dim;
    this.focusRegion(true);
    await wait(500);
    if (gone()) return;
    this.buildRegions();
    this.boxNotes(true, dim);
    this.refresh();
    if (this.tv && this.tvScreen && boxLook(GT.dimDef(dim)) === 'tv' && !settings.reduceMotion) {
      const s = this.tvScreen;
      const flash = new Graphics().rect(s.x, s.y + s.h / 2 - 2, s.w, 4).fill(0xffffff);
      this.chart.addChild(flash);
      gsap.fromTo(flash.scale, { y: 1 }, { y: 30, duration: 0.25 });
      gsap.to(flash, { alpha: 0, duration: 0.4, delay: 0.2, onComplete: () => flash.destroy() });
      flash.pivot.set(0, s.y + s.h / 2);
      flash.y = s.y + s.h / 2;
    }
    this.popIn();
    const b1 = this.nodes.get(nodeKey(dim, GT.stagesOf(dim)[0]?.n ?? GT.nodesOf(dim)[0]?.id ?? 1));
    if (b1) {
      sparkles(this.chart, b1.x, b1.y, C.pinkHot, 12, 90);
      const st = stamp('¡NUEVA CAJA!', C.red, 26, -0.1);
      st.position.set(b1.x + 60, b1.y - 60);
      this.chart.addChild(st);
      gsap.to(st, { alpha: 0, delay: 2.4, duration: 0.5, onComplete: () => st.destroy({ children: true }) });
    }
    this.startMusic();
    await wait(800);
    if (gone()) return;
    // her line is the first box's (A's beat b68_carta); a later box's opening is NARRATIVA's (no line invented here)
    if (isFirst) await say(cartaLines(CARTA_LINES.gatera));
    GT.markSeenG(`gatera_${boxSuffix(dim)}`);
    G.save();
  }

  /** back from a battle: the route inks to the new stage (the Diario del Mar's grammar) + loot + her scene lines */
  private async afterBattle() {
    const m = { ...cajasMemo };
    Object.assign(cajasMemo, { dim: null, cleared: null, opened: null, loot: null, n: null });
    const loot = m.loot!;
    const dim = m.dim!;
    const node = m.node ?? String(m.n);
    if (!loot.won) {
      toast('Esta vez no…', { icon: 'clock', sub: `+${fmt(loot.gold)} oro. La caja sigue aquí: ajusta la tripulación y vuelve.`, dur: 3.5 });
      return;
    }
    const bits = [`+${fmt(loot.gold)} oro`, `+${loot.scrap} chatarra`];
    if (loot.huellas) bits.push(`+${loot.huellas} huellas de 000`);
    // Parte III: the orbs a box cat got from this win (a repeat's seeded orbs, La Ronda's), on the repeat toast
    for (const o of loot.p3?.orbs ?? []) bits.push(`+${o.n} orbes de ${catName(o.species)}`);
    // a FIRST win: the stamp slams on the page + what's new (02 §5.3); a repeat: the toast, as before
    // (a box cat that joins on a repeat — a rescue — gets the stamp too: «¡… SE UNE!» first)
    if (loot.first || loot.ronda || loot.p3?.cats.length) await playVictoryStamp(this.overlay, victoryStampOpts(dim, node, loot, fmt));
    else toast(`${stageLabel(dim, node)} · ${gateraBattleDef(dim, node)?.name ?? ''}`, { icon: 'star', color: BX.beer, sub: bits.join(' · '), dur: 4 });
    // left the Carta during the stamp or the inking (ISLA, DIARIO DEL MAR): nothing more to draw (QA-FINAL)
    if (this.destroyed) return;
    if (m.cleared) await this.inkRoute(dim, m.cleared, m.opened);
    else this.refresh();
    if (this.destroyed) return;
    // a locale of La Ronda floats from the activity's node; anything else from its own
    const from = GT.rondaOf(dim)?.locales.some((l) => l.id === node) ? GT.rondaOf(dim)!.node : node;
    if (loot.ronda?.revealed || loot.openedNode) {
      for (const nd of this.nodes.values()) if (nd.dim === dim && nd.kind === 'desvio' && nd.state === 'open') sparkles(this.chart, nd.x, nd.y, C.pinkHot, 10, 70);
    }
    if (loot.huellas) {
      const nd = this.nodes.get(nodeKey(dim, from));
      if (nd) floatText(this.chart, nd.x, nd.y - 70, `+${loot.huellas} HUELLAS`, { size: 30, color: BX.beer, font: F.poster, rise: 60, dur: 1.8 });
    }
    // the end of what is drawn so far (the next stage isn't playable in this build)
    if (m.cleared && GT.stageOf(dim, m.cleared + 1) && !GT.stageOf(dim, m.cleared + 1)!.playable) {
      await wait(400);
      toast('Hasta aquí dibujó Luzterna', { color: NB.paper, sub: 'Lo que sigue está en lápiz: el rastro continúa en la historia.', dur: 4.5 });
    }
  }

  private inkRoute(dim: DimId, from: number, to: number | null): Promise<void> {
    const a = this.nodes.get(nodeKey(dim, from));
    const b = to ? this.nodes.get(nodeKey(dim, to)) : null;
    this.refresh();
    if (!a || !b || settings.reduceMotion) return Promise.resolve();
    this.markerMoving = true;
    this.drawRoutes(b.key);
    this.placeMarker(a.x, a.y - a.r - 18);
    const prev = b.state;
    b.state = 'locked';
    b.isFrontier = false;
    b.redraw();
    const pr = { t: 0 };
    return new Promise((res) => {
      gsap.to(pr, {
        t: 1,
        duration: 1.1,
        delay: 0.6,
        ease: 'power2.inOut',
        onStart: () => sfx('whoosh'),
        onUpdate: () => {
          if (this.destroyed) return;
          const pts = this.curvePts([a.x, a.y], [b.x, b.y], ((from - 1) % 2 ? 1 : -1) * 14, pr.t);
          this.routeAnim.clear();
          this.strokeRoute(this.routeAnim, pts, true, a.r + 6, -100, [b.x, b.y]);
          const last = pts[pts.length - 1];
          this.marker.position.set(last[0] + 34, last[1] - 30);
        },
        onComplete: () => {
          this.markerMoving = false;
          if (this.destroyed) return res();
          this.routeAnim.clear();
          b.state = prev;
          this.refresh();
          sfx('pop');
          sparkles(this.chart, b.x, b.y, C.pinkHot, 12, 90);
          gsap.fromTo(b.scale, { x: 1.8, y: 1.8 }, { x: 1, y: 1, duration: 0.4, ease: 'back.out(3)' });
          const st = stamp('¡NUEVA ETAPA!', C.red, 26, -0.1);
          st.position.set(b.x, b.y + b.r + 30);
          this.chart.addChild(st);
          gsap.from(st.scale, { x: 2.2, y: 2.2, duration: 0.18, ease: 'power3.in', onComplete: () => sfx('hit', 0.8) });
          gsap.to(st, { alpha: 0, delay: 2.4, duration: 0.5, onComplete: () => st.destroy({ children: true }) });
          res();
        },
      });
    });
  }

  // ------------------------------------------------------------------ selection: the stage card
  private async select(n: GNode) {
    if (this.busy) return;
    sfx('paper');
    this.closeCard();
    if (n.state === 'locked') gsap.fromTo(n, { x: n.x - 6 }, { x: n.x, duration: 0.35, ease: 'elastic.out(1,0.3)' });
    // the route's scenes (before B-1, after B-2, before B-5) are A's beat b69_manana: its director plays them here
    // La Ronda's node plays its NEXT locale; any other node plays itself
    const node = n.kind === 'actividad' ? GT.nextRondaLocale(n.dim) : n.node;
    const def = node ? gateraBattleDef(n.dim, node) : undefined;
    if (!node || !def) return;
    this.selected = { dim: n.dim, node };
    const card = new GateraCard(n.dim, node, def, n.state, { onClose: () => this.closeCard(), onSail: () => this.sail() });
    const gp = this.toLocal(n.getGlobalPosition());
    const rr = n.r * this.cam.s;
    const right = gp.x < W / 2;
    const cx = right ? gp.x + rr + 26 : gp.x - rr - 26 - card.cw;
    const cy = Math.max(110, Math.min(H - card.ch - 20, gp.y - card.ch / 2));
    card.position.set(Math.max(12, Math.min(W - card.cw - 12, cx)), cy);
    this.overlay.addChild(card);
    card.show();
    this.card = card;
    const hl = new Graphics().circle(0, 0, n.r + 16).stroke({ width: 4, color: C.pinkHot });
    hl.position.set(n.x, n.y);
    this.chart.addChild(hl);
    card.on('destroyed', () => hl.destroy());
  }
  private closeCard() {
    if (!this.card) return;
    this.selected = null;
    const c = this.card;
    this.card = null;
    c.hide();
  }
  /** ZARPAR on the selected stage ({ dim, node }) */
  private sail() {
    const sel = this.selected;
    this.closeCard();
    if (sel) void startGateraBattle(sel.dim, /^\d+$/.test(sel.node) ? Number(sel.node) : sel.node);
  }

  private modelCheck = 0;
  override update(dt: number) {
    this.t += dt;
    this.hud?.update(dt);
    // the story can reveal a node while you're here (an Acto I encounter when its mission arrives): redraw then
    this.modelCheck += dt;
    if (this.modelCheck > 1.5 && !this.markerMoving && !this.busy) {
      this.modelCheck = 0;
      const model = cartaModel();
      const keys = model.nodes.map((m) => m.key);
      if (keys.length !== this.nodes.size || keys.some((k) => !this.nodes.has(k))) {
        this.refresh();
        this.popIn();
      } else if (model.nodes.some((m) => this.nodes.get(m.key)!.state !== m.state || this.nodes.get(m.key)!.isFrontier !== !!m.frontier)) {
        // a node opened while you're here (a mission done by a scene on the Carta: L-6 and L-7 wait for H84 / H86):
        // redraw the states, or its card keeps saying BLOQUEADA until you leave and come back (QA-FINAL)
        this.refresh();
      }
    }
    const step = Math.floor(this.t * 12) / 12;
    // the faro's beam sweeps the notebook (a full turn every ~14 s)
    if (!settings.reduceMotion) this.beamPivot.rotation = this.t * 0.45;
    for (const n of this.nodes.values()) {
      if (!n.isFrontier) continue;
      n.ring.scale.set(1 + 0.12 * (0.5 + 0.5 * Math.sin(step * 5)));
      n.ring.alpha = 0.5 + 0.5 * Math.cos(step * 5);
    }
    if (!this.markerMoving) {
      this.marker.position.y = this.markerBase[1] + Math.sin(step * 2.4) * 3;
      this.marker.rotation = Math.sin(step * 1.7) * 0.06;
    }
    // the CRT's rolling bar
    if (this.tvRoll && !this.tvRoll.destroyed && this.tvScreen && !settings.reduceMotion) {
      const s = this.tvScreen;
      this.tvRoll.y = s.y + ((this.t * 40) % (s.h + 26)) - 26;
    }
  }
}

/** M2–M6 of the Carta: the lines of A's beat b68_carta (data/gateras/historia.json), with the 04-guion text as a fallback */
const CARTA_FALLBACK: Line[] = [
  ['LUZTERNA', 'Si mi gato cruza cajas y algo lo sigue, yo necesito una carta. Era farera. Mi trabajo era que nadie se perdiera.'],
  ['LUZTERNA', 'Cinco rasgaduras. Huellitas en todas. Solo una huele a cerveza.'],
  ['MANEKI', 'Ay, perdón. Costumbre. ¿Van a cruzar? Las gateras tienen cerradura, y yo tengo las llaves. Barrí cajas mucho tiempo.'],
  ['MANEKI', 'La de la cerveza se las abro barata. La escoba no se paga sola.'],
  ['LUZTERNA', 'Le pagamos a una conserje con llaves. Esto ya es un negocio.'],
  ['LUZTERNA', 'Cada vez que ganes ahí, junta sus huellas. Con suficientes, le sigo el rastro y te dibujo el siguiente pedazo.'],
];
function cartaLines(idx: number[]): Line[] {
  const beat = (CONTENT.story?.beats ?? []).find((b) => b.id === 'b68_carta') as { lines?: Line[] } | undefined;
  const src = beat?.lines?.length ? beat.lines : CARTA_FALLBACK;
  return idx.map((i) => src[i] ?? CARTA_FALLBACK[i]).filter((l): l is Line => !!l);
}
/** a margin note in two lines (at the word nearest the middle) */
function wrap2(t: string) {
  if (t.length < 28) return t;
  const mid = t.length / 2;
  let best = -1;
  for (let i = 0; i < t.length; i++) if (t[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return best < 0 ? t : `${t.slice(0, best)}\n${t.slice(best + 1)}`;
}

function wait(ms: number) {
  return new Promise<void>((r) => window.setTimeout(r, ms));
}

// ================================================================== the stage card (an index card from her notebook)
const KIND_LABEL: Record<Kind, string> = { normal: 'NORMAL', elite: 'ÉLITE', boss: 'JEFE' };
/** the stamp of a node that isn't a stage */
const NODE_LABEL: Record<string, string> = { desvio: 'DESVÍO', actividad: 'RONDA', encuentro: 'ENCUENTRO' };

class GateraCard extends Container {
  readonly cw = 540;
  ch = 0;
  constructor(
    private dim: DimId,
    /** the battle node (`3`, `d1`, a locale `r2`) */
    private node: string,
    private def: GateraBattleDef,
    private state: StageState,
    private o: { onClose: () => void; onSail: () => void },
  ) {
    super();
    this.build();
    this.eventMode = 'static';
    this.on('pointertap', (e) => e.stopPropagation());
  }

  private build() {
    const d = this.def;
    const W0 = this.cw;
    const pad = 28;
    const inner = W0 - pad * 2;
    const content = new Container();
    let y = 22;
    const tag = label(`${GT.dimDef(this.dim).name} · ${stageLabel(this.dim, this.node)}`, 16, NB.pen, { letterSpacing: 2 });
    tag.position.set(pad, y);
    const kc = d.kind === 'boss' ? C.red : d.kind === 'elite' ? 0xc0628a : NB.pen;
    const nodeKind = GT.isRondaLocale(this.dim, this.node) ? 'actividad' : GT.nodeOf(this.dim, this.node)?.kind;
    const kst = stamp(nodeKind && NODE_LABEL[nodeKind] ? NODE_LABEL[nodeKind] : KIND_LABEL[d.kind], kc, 22, 0.06);
    kst.position.set(W0 - pad - kst.width / 2, y + 12);
    content.addChild(tag, kst);
    y += 30;
    const name = txt(d.name.toUpperCase(), { fontFamily: F.poster, fontSize: 46, fill: C.ink, wordWrap: true, wordWrapWidth: inner - 60, lineHeight: 48 });
    name.position.set(pad, y);
    content.addChild(name);
    y += name.height + 4;
    if (!d.playable) {
      const lk = stamp('BLOQUEADA', NB.pen, 30, -0.05);
      lk.position.set(W0 / 2, y + 34);
      const why = label('Hasta aquí dibujó Luzterna. El rastro sigue cuando la historia llegue aquí.', 16, NB.pen, { wordWrap: true, wordWrapWidth: inner, align: 'center' });
      why.anchor.set(0.5, 0);
      why.position.set(W0 / 2, y + 70);
      content.addChild(lk, why);
      y += 70 + why.height + 20;
      this.finish(content, y);
      return;
    }
    const r1 = doubleRule(inner, NB.pen, 2);
    r1.position.set(pad, y);
    content.addChild(r1);
    y += 14;
    // captain + line
    const capL = label('AL MANDO', 13, NB.pen, { letterSpacing: 2 });
    capL.position.set(pad, y);
    const capN = txt(d.captainName ?? '', { fontFamily: F.poster, fontSize: 24, fill: C.ink, wordWrap: true, wordWrapWidth: inner });
    capN.position.set(pad, y + 16);
    content.addChild(capL, capN);
    y += 16 + capN.height + 4;
    if (d.line) {
      const q = txt(`«${d.line}»`, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 17, fill: NB.pen, wordWrap: true, wordWrapWidth: inner });
      q.position.set(pad, y);
      content.addChild(q);
      y += q.height + 6;
    }
    // the rule, in her words
    const rules: string[] = [];
    const m = d.mareo;
    if (m) {
      rules.push(`MAREO ±${m.sway}°: la guía se balancea; suelta en el centro`);
      if (m.donas) rules.push(m.donas.n > 1 ? `${m.donas.n} DONAS en su cubierta: si les das, se cura` : 'Una DONA en su cubierta: si le das, se cura él');
      if (m.botellas) rules.push(`BOTELLAS: le llueven a tu barco cada ${m.botellas.every} turnos`);
      if (m.ultSlow) rules.push('KARAOKE: su ulti tarda un turno más');
    }
    // the box's power on its élite (a cataclysm that scales with YOUR hull)
    if (d.cata) rules.push(cataIntroLine({ ...d.cata, side: 1, by: GT.dimDef(this.dim).name }));
    // the bar's conditions (La Ronda, the detours): the battle is lost when they break
    for (const c of d.conditions ?? []) rules.unshift(c === 'ultimaYNosVamos' && d.turns ? `LA ÚLTIMA Y NOS VAMOS: gana en ${d.turns} turnos` : BAR_CONDITIONS[c].line);
    if (GT.isRondaLocale(this.dim, this.node) && d.teach) rules.unshift(`${d.teach.toUpperCase()} · RONDAS TERMINADAS: ${GT.rondaProgress(this.dim).round}`);
    if (d.reward?.startsWith('rescate_')) rules.push(`RESCATE: ${d.reward.slice(8).replace(/_/g, ' ').toUpperCase()} (cuando llegue su pintura)`);
    // Parte III · the box cats: a captain who stays, a new cat, a rescue, the activity's / a repeat's orbs (state/sys/p3cats.ts)
    for (const h of p3NodeHints(this.dim, this.node, { won: !gateraLootPreview(this.dim, this.node).frontier, ronda: GT.isRondaLocale(this.dim, this.node) })) rules.push(h);
    for (const r of rules) {
      const t = txt(`• ${r}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.red, wordWrap: true, wordWrapWidth: inner });
      t.position.set(pad, y);
      content.addChild(t);
      y += t.height + 2;
    }
    y += 10;
    // power vs power + the honest estimate (the same sim the battle is)
    let ep = 0;
    try {
      ep = gateraPower(this.dim, this.node);
    } catch {
      ep = 0;
    }
    const sp = combatPower();
    const box = new Graphics().rect(pad, y, inner, 132).fill({ color: NB.pen, alpha: 0.06 }).stroke({ width: 2, color: NB.pen });
    content.addChild(box);
    const l1 = label('PODER ENEMIGO', 13, NB.pen, { letterSpacing: 2 });
    l1.position.set(pad + 16, y + 10);
    const v1 = txt(fmt(ep), { fontFamily: F.poster, fontSize: 44, fill: C.red });
    v1.position.set(pad + 16, y + 26);
    const l2 = label(combatWeight() !== 1 ? `TU PODER DE COMBATE (x${combatWeight()})` : 'TU PODER', 13, NB.pen, { letterSpacing: 2 });
    l2.anchor.set(1, 0);
    l2.position.set(W0 - pad - 16, y + 10);
    const v2 = txt(fmt(sp), { fontFamily: F.poster, fontSize: 44, fill: NB.pen });
    v2.anchor.set(1, 0);
    v2.position.set(W0 - pad - 16, y + 26);
    const vs = txt('VS', { fontFamily: F.brush, fontSize: 34, fill: C.ink });
    vs.anchor.set(0.5, 0);
    vs.position.set(W0 / 2, y + 28);
    content.addChild(l1, v1, l2, v2, vs);
    const share = sp / Math.max(1, sp + ep);
    const bar = new Graphics();
    const bx = pad + 16;
    const bw = inner - 32;
    bar.rect(bx, y + 84, bw, 14).fill(C.red).rect(bx + bw * (1 - share), y + 84, bw * share, 14).fill(NB.pen).rect(bx, y + 84, bw, 14).stroke({ width: 2, color: C.ink });
    content.addChild(bar);
    const estHolder = new Container();
    content.addChild(estHolder);
    const ey = y + 118;
    let advised = false;
    const drawEst = (e: Estimate) => {
      if (estHolder.destroyed) return;
      estHolder.removeChildren().forEach((c) => c.destroy({ children: true }));
      const p = e.p ?? 0.5;
      const st = stamp(`ESTIMACIÓN ${estimateLabel(e)}`, e.p === null ? NB.pen : p >= 0.7 ? 0x2e8a52 : p >= 0.45 ? 0xb8701e : C.red, 24, -0.04);
      st.position.set(W0 - pad - st.width / 2 - 6, ey);
      estHolder.addChild(st);
      // «Con el Bastión: 82 %»: once the estimate is done, another ship you own that simulates 15+ points better
      if (!advised && e.p !== null && e.done >= e.total) {
        advised = true;
        void shipAdvice(this.dim, this.node, e.p)
          .then((a) => {
            if (!a || estHolder.destroyed) return;
            const t = label(`CON EL ${a.name.toUpperCase()}: ${Math.round(a.p * 100)} %`, 15, 0x2e8a52, { letterSpacing: 1 });
            t.position.set(pad + 16, ey - 8);
            estHolder.addChild(t);
          })
          .catch(() => undefined);
      }
    };
    if (this.state !== 'locked') void simulateEstimate(GT.gateraBattleId(this.dim, this.node), () => buildGateraBattle(this.dim, this.node, () => undefined), drawEst).catch(() => undefined);
    y += 132 + 18;
    // loot: gold like the Diario del Mar (×0.7 on a repeat) + the huellas of a first win
    const lp = gateraLootPreview(this.dim, this.node);
    const first = lp.frontier;
    const lt = label(first ? 'BOTÍN' : 'BOTÍN (YA GANADA ×0.7)', 13, NB.pen, { letterSpacing: 2 });
    lt.position.set(pad, y);
    content.addChild(lt);
    y += 22;
    const chips: Container[] = [resChip('gold', `≈${fmt(lp.gold)}`), resChip('scrap', `${lp.scrap}`)];
    if (lp.huellas > 0) {
      const hc = new Container();
      const hg = new Graphics().roundRect(0, 0, 196, 30, 8).fill(NB.paper).stroke({ width: 2, color: C.ink });
      paw(hg, 18, 16, 0.7, C.ink);
      const ht = txt(`+${lp.huellas} HUELLAS DE 000`, { fontFamily: F.poster, fontSize: 18, fill: C.ink });
      ht.position.set(34, 4);
      hc.addChild(hg, ht);
      chips.push(hc);
    }
    let cx = pad;
    for (const c of chips) {
      c.position.set(cx, y);
      content.addChild(c);
      cx += c.width + 22;
    }
    y += 46;
    if (this.state === 'locked') {
      const lk = stamp('BLOQUEADA', NB.pen, 30, -0.05);
      lk.position.set(W0 / 2, y + 30);
      const why = label(GT.isOpen(this.dim) ? 'Gana la etapa anterior para entrar aquí.' : 'La gatera sigue cerrada: Maneki tiene la llave.', 15, NB.pen);
      why.anchor.set(0.5, 0);
      why.position.set(W0 / 2, y + 62);
      content.addChild(lk, why);
      y += 100;
    } else {
      const go = new Button('¡A LA CAJA!', () => this.o.onSail(), { w: inner - 210, h: 76, size: 38, color: d.kind === 'elite' ? BX.donut : C.pink });
      go.position.set(pad, y);
      const crewB = new Button('TRIPULACIÓN', () => void this.crew(), { w: 196, h: 76, size: 24, color: P.aged });
      crewB.position.set(pad + inner - 196, y);
      content.addChild(go, crewB);
      y += 90;
    }
    this.finish(content, y);
  }

  private async crew() {
    const [{ openCrewSelect }, { hullOf }] = await Promise.all([import('../panels/campaign/CrewSelect'), import('../state/ext/matchup')]);
    let ctx = null;
    try {
      const spec = buildGateraBattle(this.dim, this.node, () => undefined);
      ctx = { enemyElements: spec.enemy.cats.flatMap((c) => c.elements), hull: hullOf(spec.enemy.blueprint) };
    } catch {
      ctx = null;
    }
    this.o.onClose();
    openCrewSelect(G.s.ship.active, ctx, () => undefined);
  }

  private finish(content: Container, y: number) {
    y += 14;
    this.ch = y;
    const W0 = this.cw;
    // an index card: cream, blue rules, a red margin, a torn top
    const bg = new Graphics();
    const pts = tornRect(W0, y, this.def.n * 13 + 5, 4, 16);
    bg.poly(pts.map((v, i) => v + (i % 2 ? 10 : 10))).fill({ color: C.ink, alpha: 0.85 });
    bg.poly(pts).fill(NB.paper).stroke({ width: 2, color: 0xb9a77c });
    for (let ly = 44; ly < y - 8; ly += 28) bg.moveTo(6, ly).lineTo(W0 - 6, ly);
    bg.stroke({ width: 1, color: NB.rule, alpha: 0.35 });
    bg.moveTo(18, 4).lineTo(18, y - 4).stroke({ width: 1.4, color: NB.margin, alpha: 0.6 });
    const x = new Container();
    const xg = new Graphics().circle(0, 0, 20).fill(C.ink);
    const xt = txt('×', { fontFamily: F.ui, fontWeight: '700', fontSize: 30, fill: P.aged });
    xt.anchor.set(0.5, 0.55);
    x.addChild(xg, xt);
    x.position.set(W0 - 8, 8);
    x.eventMode = 'static';
    x.cursor = 'pointer';
    x.on('pointertap', () => {
      sfx('click');
      this.o.onClose();
    });
    this.addChild(bg, content, x);
  }

  show() {
    this.pivot.set(this.cw / 2, this.ch / 2);
    this.x += this.cw / 2;
    this.y += this.ch / 2;
    this.rotation = (Math.random() - 0.5) * 0.03;
    gsap.from(this.scale, { x: 0.85, y: 0.85, duration: 0.22, ease: 'back.out(2.2)' });
    gsap.from(this, { alpha: 0, duration: 0.15 });
  }
  hide() {
    gsap.to(this, {
      alpha: 0,
      duration: 0.14,
      onComplete: () => {
        killTree(this);
        this.destroy({ children: true });
      },
    });
  }
}
