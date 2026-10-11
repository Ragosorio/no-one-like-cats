/**
 * Sea map / stage selection — DIARIO DEL MAR: an engraved nautical chart printed on aged newspaper.
 * 6 zones as islands, 9 stages each along a dotted route (elite shield at 5, boss skull at 9),
 * future zones under "???" fog. Tap a stage → clipping card with honest odds and loot.
 * Parte II: the «MAR DE LAS RUPTURAS» — a sheet glued to the chart's right edge that nobody remembers
 * gluing, with the 3D islands (src/regions) in a fresher, misaligned ink. Only drawn when an island's flag
 * is set (state/sys/rupturas.ts mapRegions); tapping one travels there (app/flow goRegion).
 * Oleada 2: «EL CIELO» — a fold-out sheet slipped UNDER the top of the Mar de las Rupturas and opened
 * upward (the chart grows above the sea), with the sky-layer islands floating on it and a waterspout
 * climbing across the seam. Drawn only when one of its islands' flags is set.
 * Oleada 3: «LO DE ARRIBA» — a strip of night chart (indigo paper, gold ink, stars) whose foot slips under
 * the sky sheet's torn top: what is above the sky. Drawn only with its island's flag (`region:cometa`).
 */
import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js';
import { STORY_BATTLES } from '../state/sys/storyBattles';
import { startStoryBattle } from '../app/storyFlow';
import gsap from 'gsap';
import { Scene } from '../core/scenes';
import { W, H } from '../core/App';
import { C, F } from '../ui/theme';
import { txt, Button } from '../ui/widgets';
import { paperTexture } from '../art/textures';
import { sfx } from '../core/audio';
import { Hud } from '../ui/hud/Hud';
import { ZONES, catName, zoneBoss } from '../data/content';
import { toast } from '../ui/modal';
import { frontier } from '../state/sys/campaign';
import { G } from '../state/game';
import { game } from '../core/App';
import {
  FACTION,
  STAGES_PER_ZONE,
  campaignMemo,
  claimPendingBossCats,
  refreshQuickAssaultFlag,
  stageKey,
  stageKind,
  stageState,
  zoneUnlocked,
} from '../state/ext/campaign';
import { P, elementBadge, hash1, stamp, doubleRule, killTree } from '../panels/campaign/common';
import {
  Pt,
  boat,
  bolt,
  chartFrame,
  cloud,
  column,
  compassRose,
  drawIsland,
  fogTexture,
  islandPoly,
  palm,
  rhumbLines,
  ribs,
  rocks,
  seaSerpent,
  star,
  tower,
  vignetteTexture,
  waves,
  whirl,
  bossEmblem,
  eliteEmblem,
  cliffFace,
  gargoyle,
  waterfall,
  stormCloud,
  tentacle,
  errandPin,
} from '../panels/campaign/chartArt';
import { StageCard } from '../panels/campaign/StageCard';
import { sparkles } from '../fx/juice';
import { screenRect } from '../ui/screen';
import { MapRegion, freshChartIslands, mapRegions, regionForGoal } from '../state/sys/rupturas';
import { beatSeen, markBeat } from '../state/ext/story';
import type { RegionId } from '../regions';
import { MapNight } from '../island/night/mapNight';
import { buildMapO4, mapO4Pos, mapO4Regions } from '../regions/mapO4';

const BOX_W = 600;
const BOX_H = 400;
const ZONE_BOX: Record<number, { x: number; y: number; mirror: boolean }> = {
  1: { x: 40, y: 650, mirror: false },
  2: { x: 660, y: 650, mirror: false },
  3: { x: 1280, y: 650, mirror: false },
  4: { x: 1280, y: 215, mirror: true },
  5: { x: 660, y: 215, mirror: true },
  6: { x: 40, y: 215, mirror: true },
};
const PATTERN: Pt[] = [
  [55, 330],
  [130, 362],
  [210, 328],
  [258, 256],
  [222, 172],
  [292, 108],
  [384, 130],
  [455, 196],
  [538, 248],
];
const ISLAND_C: Pt = [375, 262];
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
const ZOOM_IN = 1.5;
const CHART_TOP = 150;
/** screen area not covered by the HUD (pins left, clocks right, action bar bottom) */
const SAFE = { x0: 400, x1: 1610, y0: 110, y1: 950 };
const FOG_LINES = ['', '', 'Aquí hay gárgolas (dicen)', 'Aquí llueve para arriba', 'Aquí se hunden las bibliotecas', 'Aquí caen estrellas', 'Aquí no hay nada. NADA.'];
/** the chart's drawn width (camera bounds) */
const CHART_W = 1896;
/** Parte II: the glued sheet «MAR DE LAS RUPTURAS» (chart coords: right past the frame, taped over the seam) */
const RS = { x: 1898, y: 168, w: 560, h: 870 };
/** label of the sheets' vertical title strips (also regions/mapO4.ts): the chart's handwritten notes keep off them */
export const SHEET_TAB = 'sheetTab';
/** label of the Parte II islands' name ribbons: the handwritten notes keep off them too */
const ISLE_NAME = 'isleName';
/** the fresher ink of things that «always were there», and its misregistered shadow */
const FRESH = 0x2c4fb8;
const MISREG = 0x8a5cd6;
/** Oleada 2: the fold-out «EL CIELO» sheet, ABOVE the Rupturas sheet (its foot slips under it) */
const SKY_S = { x: RS.x + 16, y: -540, w: 532, h: 734 };
/** the sky sheet's paper and its wash */
const SKY_PAPER = 0xe8eef0;
const SKY_WASH = 0xc9dcef;
const GILT = 0xd99a2b;
/** where each sky island floats on the sky sheet (sheet coords) */
const SKY_ISLE: Partial<Record<RegionId, { p: Pt; land: number; seed: number }>> = {
  corona: { p: [352, 262], land: 0xf6efdc, seed: 23 },
  invertidas: { p: [178, 486], land: 0xdcd2f0, seed: 61 },
};
/** Oleada 3: «LO DE ARRIBA», a night-chart strip above the sky sheet (y is computed: it slips under the sky's top) */
const ASTRAL_S = { x: SKY_S.x + 36, w: 468, h: 372 };
const ASTRAL_PAPER = 0x1d2150;
const ASTRAL_INK = 0xf2dfa8;
/** where each astral island sits on the strip (sheet coords) */
const ASTRAL_ISLE: Partial<Record<RegionId, { p: Pt; seed: number }>> = {
  cometa: { p: [300, 206], seed: 37 },
};
/** where each island sits on the sheet (sheet coords) + its land tint */
const RS_ISLE: Partial<Record<RegionId, { p: Pt; land: number; seed: number }>> = {
  paginas: { p: [276, 318], land: 0xe9ddc2, seed: 41 },
  nacar: { p: [318, 690], land: 0xe4dcf2, seed: 77 },
};

function zonePt(zone: number, p: Pt): Pt {
  const b = ZONE_BOX[zone];
  const x = b.mirror ? BOX_W - p[0] : p[0];
  return [b.x + x, b.y + p[1]];
}
function nodePos(zone: number, stage: number): Pt {
  const base = zonePt(zone, PATTERN[stage - 1]);
  const j = stage === 1 || stage === STAGES_PER_ZONE ? 0 : 12;
  return [base[0] + (hash1(zone * 13 + stage) - 0.5) * j, base[1] + (hash1(zone * 7 + stage * 3) - 0.5) * j];
}

class StageNode extends Container {
  g = new Graphics();
  num = txt('', { fontFamily: F.poster, fontSize: 24, fill: P.blue });
  ring = new Graphics();
  kind: 'normal' | 'elite' | 'boss';
  state: 'cleared' | 'open' | 'locked' = 'locked';
  isFrontier = false;
  r: number;
  constructor(
    public zone: number,
    public stage: number,
  ) {
    super();
    this.kind = stageKind(zone, stage);
    this.r = this.kind === 'boss' ? 36 : this.kind === 'elite' ? 30 : 23;
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
  redraw() {
    const g = this.g.clear();
    const st = this.state;
    const r = this.r;
    const ink = st === 'locked' ? P.blueSoft : P.blue;
    const fill = st === 'cleared' ? P.blue : this.isFrontier ? (this.kind === 'boss' ? C.red : C.pink) : P.aged;
    this.alpha = st === 'locked' ? 0.62 : 1;
    if (this.kind === 'boss') {
      g.circle(3, 4, r).fill({ color: C.ink, alpha: 0.85 });
      g.circle(0, 0, r).fill(st === 'cleared' ? P.blue : this.isFrontier ? C.red : P.aged).stroke({ width: 4, color: ink });
      bossEmblem(g, this.zone, r * 0.78, st === 'cleared' ? P.aged : st === 'locked' ? P.agedDark : 0xfff6e0, C.ink);
      this.num.text = '';
    } else if (this.kind === 'elite') {
      g.poly([-r * 0.85 + 3, -r * 0.8 + 4, r * 0.85 + 3, -r * 0.8 + 4, r * 0.85 + 3, -r * 0.05 + 4, 3, r + 4, -r * 0.85 + 3, -r * 0.05 + 4]).fill({ color: C.ink, alpha: 0.85 });
      eliteEmblem(g, this.zone, r, fill, ink, st === 'cleared' ? C.yellow : this.isFrontier ? C.ink : P.blue);
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
      this.num.text = String(this.stage);
      this.num.style.fill = st === 'cleared' ? P.aged : this.isFrontier ? C.ink : ink;
      this.num.y = 1;
    }
    if (st === 'cleared') {
      // little red check stamp
      g.moveTo(r * 0.35, r * 0.55).lineTo(r * 0.6, r * 0.85).lineTo(r * 1.1, r * 0.2).stroke({ width: 5, color: C.red, cap: 'round', join: 'round' });
    }
    this.ring.clear();
    if (this.isFrontier) this.ring.circle(0, 0, r + 9).stroke({ width: 3, color: this.kind === 'boss' ? C.red : C.pinkHot });
  }
}

export class MapScene extends Scene {
  private chart = new Container();
  private routeG = new Graphics();
  private routeAnim = new Graphics();
  private nodesLayer = new Container();
  private fogLayer = new Container();
  private overlay = new Container();
  private nodes = new Map<string, StageNode>();
  private marker = new Container();
  private markerBase: Pt = [0, 0];
  private hud!: Hud;
  private card: StageCard | null = null;
  private t = 0;
  private fogs = new Map<number, Container>();
  private markerMoving = false;
  /** drawn width of the chart (grows with the Parte II sheet) */
  private chartW = CHART_W;
  /** Parte II islands on the chart (empty without Parte II) */
  private rupturas: MapRegion[] = [];
  /** Oleada 2 sky islands on the «EL CIELO» sheet (empty until one of their flags is set) */
  private cielo: MapRegion[] = [];
  /** Oleada 3 islands on the «LO DE ARRIBA» strip (empty until one of their flags is set) */
  private astral: MapRegion[] = [];
  private astralY = 0;
  /** top of the drawn chart (the sky sheet raises it) */
  private chartTop = CHART_TOP;
  /** last time a drag actually panned (a drag release must not open a 3D island) */
  private pannedAt = -1e9;
  /** the narrative world state on the chart paper (island/night/mapNight.ts; invisible in Part I) */
  private night = new MapNight();

  override enter() {
    // ---------- paper & chart
    const paper = new TilingSprite({ texture: paperTexture(P.aged, 512, 1.5), width: W, height: H });
    const blocker = screenRect({ color: 0xffffff, alpha: 0.001 });
    blocker.eventMode = 'static';
    this.setupPan(blocker);
    this.chart.eventMode = 'static';
    this.setupPan(this.chart);
    this.addChild(paper, blocker, this.chart);
    this.buildChart();
    this.chart.addChild(this.routeG, this.routeAnim, this.nodesLayer, this.fogLayer);
    this.buildNodes();
    this.buildErrandPins();
    this.buildFog();
    this.drawRoutes();
    // the sky sheet goes first: the Rupturas sheet is glued OVER its foot; the astral strip slips UNDER the sky's top
    const underSky = this.chart.children.length;
    // Parte II: the islands whose fresh ink the player hasn't seen yet (before the sheets mark them as seen)
    const fresh = freshChartIslands();
    this.buildCielo();
    this.buildRupturas();
    this.buildSeam();
    this.buildAstral(underSky);
    buildMapO4(this);
    // vignette on top of the chart
    const vig = new Sprite(vignetteTexture());
    vig.width = W;
    vig.height = H;
    vig.eventMode = 'none';
    this.addChild(vig);
    // Parte II: the chart is read under the story's light (night wash, printed stars, the sky's seam)
    this.addChild(this.night);
    // its handwritten notes stay on the screen but never write over a sheet's vertical title strip or an island's name
    const tabs: Container[] = [];
    const findTabs = (o: Container) => {
      if (o.label === SHEET_TAB || o.label === ISLE_NAME) tabs.push(o);
      else for (const c of o.children) findTabs(c);
    };
    findTabs(this.chart);
    this.night.avoid = () => tabs;
    this.buildMasthead();
    // marker
    const b = boat(C.pink);
    this.marker.addChild(b);
    this.chart.addChild(this.marker);
    this.hud = new Hud({
      mode: 'map',
      // story battles (Heraldo, Grieta, Barco del Vacío, Patito…) launch straight from their mission
      onGoal: (m) => {
        const g = m.goal as { battle?: unknown; type?: string };
        // Parte II: landing, Canelo's page, Nácar's beam puzzle… happen on a 3D island: go there
        const reg = regionForGoal(m.goal);
        if (reg) void import('../app/flow').then((fl) => fl.goRegion(reg));
        else if (typeof g.battle === 'string' && g.battle in STORY_BATTLES) void startStoryBattle(g.battle);
        else if (g.type === 'void_fragments') void import('../ui/fragmentsPanel').then((f) => f.openFragments());
        // «Continuará»: the ending plays on the island
        else if (g.type === 'watch') void import('../app/flow').then((fl) => fl.goIsland()).then(() => import('../app/story')).then((st) => st.playChapterEnding(m.id));
        // Parte II · Oleada 2: H43 the kit (the chart glides to «EL CIELO», then the Astillero › VUELO) · H48 home to the faro
        else if (g.type === 'use_feature' && ['kit_vuelo', 'linterna'].includes(String((m.goal as { feature?: unknown }).feature))) void import('../app/oleada2Flow').then((o) => o.chartFeature(String((m.goal as { feature?: unknown }).feature)));
        // «Gana una batalla en los Acantilados…»: you're already on the chart → glide to that zone (IR used to reopen
        // MISIONES, whose IR reopened MISIONES)
        else if (typeof (m.goal as { zone?: unknown }).zone === 'number') this.focusZone((m.goal as unknown as { zone: number }).zone);
        else void import('../panels/Missions').then((x) => x.openMissions());
      },
    });
    this.addChild(this.hud, this.overlay);

    refreshQuickAssaultFlag();
    for (const sp of claimPendingBossCats()) toast(`¡${catName(sp)} se unió a tu isla!`, { icon: 'paw', sub: 'Un primordial no se queda esperando' });
    this.refresh();
    const f = frontier();
    const focus = campaignMemo.justUnlocked ? Number(campaignMemo.justCleared?.split('-')[0] ?? f.zone) : f.zone;
    // Parte II: while the story waits on one of its islands, the chart opens there (not after a campaign win)
    const calling = campaignMemo.justCleared ? undefined : [...this.rupturas, ...this.cielo, ...this.astral, ...mapO4Regions()].find((r) => r.call);
    if (calling) this.focusIsle(calling.id, false);
    else this.focusZone(focus, false);
    window.addEventListener('wheel', this.onWheel, { passive: false });
    this.introAnim();
    this.showFreshIslands(fresh, calling?.id);
  }

  override exit() {
    this.offView?.();
    this.offView = null;
    window.removeEventListener('wheel', this.onWheel);
    gsap.killTweensOf(this.cam);
    killTree(this);
  }

  // ------------------------------------------------------------------ camera (zoom/pan over the chart)
  private cam = { s: ZOOM_IN, x: 0, y: 0 };
  private drag: { sx: number; sy: number; cx: number; cy: number; moved: boolean } | null = null;

  private applyCam() {
    const s = this.cam.s;
    // allow panning past the chart edges when zoomed so every zone can reach the safe area
    const m = s > 1.05 ? 300 : 12;
    const minX = W - this.chartW * s - m;
    const maxX = -24 * s + m;
    const minY = H - 1066 * s - m;
    const maxY = 100 - this.chartTop * s + m;
    this.cam.x = Math.max(Math.min(minX, maxX), Math.min(Math.max(minX, maxX), this.cam.x));
    this.cam.y = Math.max(Math.min(minY, maxY), Math.min(Math.max(minY, maxY), this.cam.y));
    this.chart.scale.set(s);
    this.chart.position.set(this.cam.x, this.cam.y);
  }

  private camFor(cx: number, cy: number, s: number) {
    if (s <= 1.05) return { s, x: 0, y: 0 };
    return { s, x: (SAFE.x0 + SAFE.x1) / 2 - cx * s, y: (SAFE.y0 + SAFE.y1) / 2 - cy * s };
  }

  focusZone(z: number, animate = true, s = ZOOM_IN) {
    const b = ZONE_BOX[z] ?? ZONE_BOX[1];
    this.focusOn(b.x + BOX_W / 2, b.y + BOX_H / 2 + 6, animate, s);
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

  private toggleZoom() {
    this.closeCard();
    if (this.cam.s > 1.05) this.focusOn(W / 2, H / 2, true, 1);
    else {
      const f = frontier();
      this.focusZone(f.zone, true);
    }
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
        this.pannedAt = performance.now();
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

  /** root scale (logical → screen) */
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
    // pointer in logical coords
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

  // ------------------------------------------------------------------ chart art
  private buildChart() {
    const g = new Graphics();
    // rhumb lines from the compass
    const cx = 1795;
    const cy = 300;
    rhumbLines(g, cx, cy, 2400);
    rhumbLines(g, 330, 640, 900);
    this.chart.addChild(g);
    this.chart.addChild(chartFrame(24, CHART_TOP, W - 48, H - CHART_TOP - 14));
    // scattered engraved waves
    const wg = new Graphics();
    for (let i = 0; i < 90; i++) {
      const x = 60 + hash1(i * 3.1) * (W - 160);
      const y = 210 + hash1(i * 7.7) * (H - 260);
      wg.moveTo(0, 0);
      waves(wg, x, y, 30 + hash1(i) * 40, P.blue, 0.28);
    }
    this.chart.addChild(wg);
    // zones
    for (let z = 1; z <= ZONES.length; z++) this.buildZone(z);
    // inter-zone lanes are part of routes; compass rose
    const rose = compassRose(62);
    rose.position.set(cx, cy);
    this.chart.addChild(rose);
    // scale bar
    const sb = new Graphics();
    const sx = 1560;
    const sy = 1036;
    for (let i = 0; i < 5; i++) sb.rect(sx + i * 46, sy, 46, 8).fill(i % 2 ? P.aged : P.blue).stroke({ width: 1.5, color: P.blue });
    this.chart.addChild(sb);
    const sl = txt('LEGUAS GATUNAS  0 · 10 · 20 · 30', { fontFamily: F.serif, fontSize: 14, fill: P.blue, fontStyle: 'italic' });
    sl.position.set(sx, sy - 22);
    this.chart.addChild(sl);
  }

  private buildZone(z: number) {
    const b = ZONE_BOX[z];
    const unlocked = zoneUnlocked(z);
    const layer = new Container();
    const g = new Graphics();
    const [icx, icy] = zonePt(z, ISLAND_C);
    const seed = z * 11;
    const land = [0xe1cfa5, 0xcfc4ad, 0xd6cdb6, 0xd8c8b0, 0xc9bfd0, 0xd9d4de][z - 1];
    const main = z === 3 ? islandPoly(icx + 10, icy + 6, 64, 44, seed) : islandPoly(icx, icy, 84, 60, seed);
    drawIsland(g, main, z === 3 ? icx + 10 : icx, z === 3 ? icy + 6 : icy, { land });
    const islets: [Pt, number, number][] = [
      [zonePt(z, [118, 232]), 30, 20],
      [zonePt(z, [470, 352]), 36, 20],
    ];
    for (const [[x, y], rx, ry] of islets) drawIsland(g, islandPoly(x, y, rx, ry, seed + x), x, y, { land, rings: 3 });
    // zone vignettes
    const d = new Graphics();
    const dir = b.mirror ? -1 : 1;
    const [fx, fy] = zonePt(z, [470, 362]);
    switch (z) {
      case 1:
        palm(d, icx - 26, icy + 6, 1.2);
        palm(d, icx + 8, icy - 4, 1);
        palm(d, icx + 38, icy + 14, 0.9);
        seaSerpent(d, b.x + (b.mirror ? 70 : 300), b.y + 372, 0.8);
        break;
      case 2: {
        // the Acantilados: stratified cliff faces on the island's south shore, a stone fort on top,
        // a waterfall and — on its own crag by the boss — the sleeping Gárgola
        cliffFace(d, icx - 78, icy + 48, 66, 50, 3);
        cliffFace(d, icx - 10, icy + 54, 82, 70, 5);
        waterfall(d, icx + 46, icy + 2, 50);
        tower(d, icx - 36, icy + 2, 1.1);
        // the Gárgola sleeps on the island's crag
        cliffFace(d, icx - 4, icy + 4, 44, 52, 11, P.blue, 0xbfb291);
        gargoyle(d, icx + 16, icy - 46, 0.9);
        rocks(d, icx + 52, icy + 16, 0.9);
        rocks(d, fx - 4, fy + 2, 0.8);
        const [cx2, cy2] = zonePt(z, [150, 250]);
        rocks(d, cx2, cy2, 0.9);
        break;
      }
      case 3: {
        // Mar de Tormentas: permanent storm over a small island, tentacles around the boss, whirlpool
        palm(d, icx + 20, icy + 16, 0.9);
        palm(d, icx + 44, icy + 20, 0.7);
        stormCloud(d, icx - 10, icy - 66, 1.25, P.blue, C.yellow, 60);
        stormCloud(d, b.x + 470, b.y + 92, 0.9, P.blue, -1, 50);
        const [tx, ty] = zonePt(z, [586, 380]);
        tentacle(d, tx, ty, 1.05, -1);
        const [tx2, ty2] = zonePt(z, [452, 384]);
        tentacle(d, tx2, ty2, 0.8, 1);
        const [tx3, ty3] = zonePt(z, [380, 392]);
        tentacle(d, tx3, ty3, 0.55, -1);
        whirl(d, b.x + (b.mirror ? 120 : 330), b.y + 380, 1.2);
        bolt(d, b.x + 120, b.y + 120, 0.7);
        break;
      }
      case 4:
        column(d, icx - 30, icy + 18, 42, false);
        column(d, icx - 6, icy + 14, 52, true);
        column(d, icx + 20, icy + 18, 36, true);
        column(d, fx, fy + 8, 26, true);
        break;
      case 5:
        for (let i = 0; i < 14; i++) star(d, b.x + 40 + hash1(i * 5 + z) * 520, b.y + 30 + hash1(i * 9 + z) * 340, 4 + hash1(i) * 6);
        d.circle(icx, icy - 4, 22).fill(P.blue).stroke({ width: 3, color: P.blue });
        d.circle(icx + 9 * dir, icy - 10, 18).fill(land);
        break;
      case 6:
        ribs(d, icx - 6, icy + 16, 0.9);
        cloud(d, fx, fy - 10, 0.8, P.aged, P.blueSoft);
        break;
    }
    layer.addChild(g, d);
    // zone label (top-left of the box): the roman numeral lives in its own round seal (fixed width, so
    // the Fraktur glyph can never run into the name, whatever the font metrics say)
    const lab = new Container();
    const seal = new Graphics().circle(26, 27, 25).fill(P.aged).stroke({ width: 3, color: P.blue }).circle(26, 27, 20).stroke({ width: 1, color: P.blue });
    const rn = txt(`${ROMAN[z]}`, { fontFamily: F.news, fontSize: 30, fill: P.blue });
    rn.anchor.set(0.5);
    rn.position.set(26, 28);
    if (rn.width > 34) rn.scale.set(34 / rn.width);
    const nm = txt(unlocked ? ZONES[z - 1].name.toUpperCase() : '???', { fontFamily: F.poster, fontSize: 30, fill: P.blue, letterSpacing: 1 });
    nm.position.set(62, 2);
    const fac = txt(unlocked ? FACTION[z].name : 'Aguas sin cartografiar', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 16, fill: P.blue });
    fac.position.set(64, 38);
    lab.addChild(seal, rn, nm, fac);
    if (unlocked) {
      ZONES[z - 1].elements.forEach((el, i) => {
        const eb = elementBadge(el, 26);
        eb.position.set(Math.max(64 + fac.width, 62 + nm.width) + 26 + i * 30, 30);
        lab.addChild(eb);
      });
      // the boss's name under its node, engraved
      const boss = zoneBoss(z);
      if (boss) {
        const [bx, by] = nodePos(z, STAGES_PER_ZONE);
        // engraved name ribbon (legible over the vignette art)
        const beaten = stageState(z, STAGES_PER_ZONE) === 'cleared';
        const rib = new Container();
        const bn = txt(boss.name, { fontFamily: F.brush, fontSize: 16, fill: beaten ? P.blueSoft : C.red });
        bn.anchor.set(0.5);
        const rw = bn.width + 30;
        const rg = new Graphics()
          .poly([-rw / 2 - 12, -2, -rw / 2, -13, rw / 2, -13, rw / 2 + 12, -2, rw / 2, 13, -rw / 2, 13])
          .fill(P.aged)
          .stroke({ width: 2, color: P.blue, join: 'round' });
        rib.addChild(rg, bn);
        if (beaten) rib.addChild(new Graphics().moveTo(-rw / 2 + 6, 1).lineTo(rw / 2 - 6, 0).stroke({ width: 2.5, color: C.red }));
        rib.position.set(bx, by + 54);
        rib.rotation = -0.03;
        layer.addChild(rib);
      }
    }
    lab.position.set(b.x + 12, b.y + 6);
    layer.addChild(lab);
    this.chart.addChild(layer);
  }

  private buildFog() {
    // a zone unlocked by the boss we just beat keeps its fog for a moment so it can lift on screen
    const ju = campaignMemo.justUnlocked;
    const fresh = ju && ju.endsWith('-1') ? Number(ju.split('-')[0]) : 0;
    for (let z = 1; z <= ZONES.length; z++) {
      if (zoneUnlocked(z) && z !== fresh) continue;
      const b = ZONE_BOX[z];
      const f = new Container();
      const fog = new Sprite(fogTexture(z * 7));
      fog.position.set(b.x - 20, b.y - 20);
      fog.width = BOX_W + 40;
      fog.height = BOX_H + 40;
      fog.alpha = 0.78;
      f.addChild(fog);
      const base = new Graphics().roundRect(b.x + 40, b.y + 50, BOX_W - 80, BOX_H - 90, 140).fill({ color: 0xf3ead6, alpha: 0.3 });
      f.addChildAt(base, 0);
      const ink = new Graphics();
      const cl: Pt[] = z % 2
        ? [
            [130, 120],
            [500, 330],
          ]
        : [
            [470, 110],
            [100, 340],
          ];
      cl.forEach(([x, y], i) => cloud(ink, b.x + (b.mirror ? BOX_W - x : x), b.y + y, 1.15 - i * 0.08, 0xf6efe0, P.blueSoft));
      // what hides in the fog (anticipation): a faint landmark silhouette
      const ghost = new Graphics();
      if (z === 2) gargoyle(ghost, b.x + 470, b.y + 300, 1.6, P.blueSoft, P.blueSoft);
      else if (z === 3) {
        tentacle(ghost, b.x + 470, b.y + 330, 1.3, -1, P.blueSoft, 0xe6dccb);
        tentacle(ghost, b.x + 120, b.y + 330, 1, 1, P.blueSoft, 0xe6dccb);
      }
      ghost.alpha = 0.45;
      f.addChildAt(ghost, 1);
      const q = txt('???', { fontFamily: F.news, fontSize: 120, fill: P.blue });
      q.anchor.set(0.5);
      q.position.set(b.x + BOX_W / 2, b.y + BOX_H / 2 - 18);
      const tl = txt(FOG_LINES[z] ?? 'TERRA INCOGNITA', { fontFamily: F.brush, fontSize: 24, fill: P.blue });
      tl.anchor.set(0.5);
      tl.position.set(b.x + BOX_W / 2, b.y + BOX_H / 2 + 52);
      const s = txt(`Vence al Jefe ${z - 1} para disipar la niebla`, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 19, fill: P.blue });
      s.anchor.set(0.5);
      s.position.set(b.x + BOX_W / 2, b.y + BOX_H / 2 + 82);
      f.addChild(ink, q, tl, s);
      f.eventMode = 'static'; // swallow clicks on hidden water
      f.on('pointertap', () => {
        sfx('error');
        gsap.fromTo(q, { rotation: -0.06 }, { rotation: 0, duration: 0.4, ease: 'elastic.out(1,0.3)' });
      });
      this.fogLayer.addChild(f);
      this.fogs.set(z, f);
    }
  }

  private buildMasthead() {
    const band = new Container();
    const bg = new TilingSprite({ texture: paperTexture(P.aged, 512, 1.5), width: W, height: 100 });
    let rule = doubleRule(W, C.ink, 3);
    rule.position.set(0, 98);
    const cx = 790;
    const title = txt('Diario del Mar', { fontFamily: F.news, fontSize: 62, fill: C.ink });
    title.anchor.set(0.5, 0);
    title.position.set(cx, 4);
    const line = txt(`Nº ${String(G.s.stats.victories + G.s.stats.defeats + 1).padStart(4, '0')} · CARTA DEL PRIMER MAR · 2 DOBLONES`, { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: C.ink, letterSpacing: 2 });
    line.anchor.set(0.5, 0);
    line.position.set(cx, 74);
    band.addChild(bg, rule, title, line);
    band.eventMode = 'static'; // the header doesn't pan the chart
    this.addChild(band);
    // zoom toggle (bottom-right, clear of the HUD action bar)
    const zoom = new Button('CARTA', () => this.toggleZoom(), { w: 190, h: 64, size: 30, color: P.aged });
    zoom.position.set(W - 24 - 196, H - 24 - 70);
    const rose = compassRose(14, C.ink);
    rose.position.set(30, 33);
    zoom.face.addChild(rose);
    zoom.caption.x += 14;
    this.addChild(zoom);
    // ENCARGOS (errand board, owned by combat: dynamic import keeps the map independent of it)
    const err = new Button('ENCARGOS', () => void this.openErrandBoard(), { w: 190, h: 64, size: 30, color: C.yellow });
    err.position.set(W - 24 - 196, H - 24 - 70 - 84);
    const pin = new Graphics();
    errandPin(pin, 0.62, P.aged);
    pin.position.set(26, 34);
    err.face.addChild(pin);
    err.caption.x += 14;
    const open = this.errandsOpen();
    if (open > 0) {
      const badge = new Container();
      const bg2 = new Graphics().circle(0, 0, 17).fill(C.red).stroke({ width: 3, color: C.ink });
      const bt = txt(String(open), { fontFamily: F.poster, fontSize: 22, fill: C.paper });
      bt.anchor.set(0.5);
      badge.addChild(bg2, bt);
      badge.position.set(186, 2);
      err.face.addChild(badge);
      gsap.to(badge.scale, { x: 1.18, y: 1.18, yoyo: true, repeat: -1, duration: 0.5, ease: 'sine.inOut' });
    }
    this.addChild(err);
    // a window that isn't 16:9: the band spans the whole screen and stays on top, the buttons keep to the corner
    // (the band used to end short on wide screens and float mid-screen on 4:3, with the chart showing above it)
    const layout = (v: { x: number; y: number; w: number; h: number }) => {
      band.position.set(v.x, v.y);
      bg.width = v.w;
      rule.destroy();
      rule = doubleRule(v.w, C.ink, 3);
      rule.position.set(0, 98);
      band.addChildAt(rule, 1);
      title.x = cx - v.x;
      line.x = cx - v.x;
      zoom.position.set(v.x + v.w - 24 - 196, v.y + v.h - 24 - 70);
      err.position.set(v.x + v.w - 24 - 196, v.y + v.h - 24 - 70 - 84);
    };
    layout(game.view);
    this.offView = game.onView(layout);
  }
  private offView: (() => void) | null = null;

  // ------------------------------------------------------------------ Parte II: MAR DE LAS RUPTURAS
  /** chart coords of a Parte II island (the sheet's tilt is tiny: ignored) */
  private islePos(id: RegionId): Pt {
    const o4 = mapO4Pos(id);
    if (o4) return o4;
    const ap = ASTRAL_ISLE[id]?.p;
    if (ap) return [ASTRAL_S.x + ap[0], this.astralY + ap[1]];
    const sp = SKY_ISLE[id]?.p;
    if (sp) return [SKY_S.x + sp[0], SKY_S.y + sp[1]];
    const p = RS_ISLE[id]?.p ?? [RS.w / 2, RS.h / 2];
    return [RS.x + p[0], RS.y + p[1]];
  }

  /**
   * New islands on the chart (hotfix 2026-10-10): the chart glides to the sheet where the first one is drawn and rings
   * every new one for a few seconds; their fresh ink is then «seen» (the O4 sheet has no ink of its own: marked here).
   */
  private showFreshIslands(fresh: RegionId[], calling?: RegionId) {
    const drawn = new Set<string>([...this.rupturas, ...this.cielo, ...this.astral, ...mapO4Regions()].map((r) => r.id));
    const ids = fresh.filter((id) => drawn.has(id));
    if (!ids.length) return;
    for (const id of ids) {
      if (!beatSeen(`carta_${id}`)) markBeat(`carta_${id}`);
      const [x, y] = this.islePos(id);
      const ring = new Graphics().circle(0, 0, 96).stroke({ width: 7, color: C.red, alpha: 0.9 }).circle(0, 0, 112).stroke({ width: 3, color: C.ink, alpha: 0.5 });
      ring.position.set(x, y);
      ring.eventMode = 'none';
      this.chart.addChild(ring);
      gsap.fromTo(ring.scale, { x: 1.25, y: 1.25 }, { x: 0.92, y: 0.92, duration: 0.7, yoyo: true, repeat: 7, ease: 'sine.inOut' });
      gsap.to(ring, { alpha: 0, delay: 5.6, duration: 0.6, onComplete: () => ring.destroy() });
    }
    G.save();
    const first = ids.includes(calling as RegionId) ? (calling as RegionId) : ids[0];
    gsap.delayedCall(0.7, () => {
      if (!this.destroyed) this.focusIsle(first, true);
    });
  }

  focusIsle(id: RegionId, animate = true, s = ZOOM_IN) {
    const [x, y] = this.islePos(id);
    this.focusOn(x, y, animate, s);
  }

  /**
   * The sheet glued to the chart's right edge: fresher paper, a torn edge, tape over the seam, and the
   * islands that «always were there» in a fresher ink printed slightly out of register. Nothing at all
   * without Parte II (no island flag set): the chart stays exactly as it was.
   */
  private buildRupturas() {
    this.rupturas = mapRegions().filter((r) => !!RS_ISLE[r.id]);
    if (!this.rupturas.length) return;
    this.chartW = RS.x + RS.w + 24;
    const sheet = new Container();
    sheet.position.set(RS.x, RS.y);
    // printed slightly out of square: somebody glued it in a hurry
    sheet.rotation = 0.009;
    const { w, h } = RS;
    // torn right edge (the left one is glued under the tape)
    const shape: number[] = [0, 0];
    const n = 44;
    for (let i = 0; i <= n; i++) shape.push(w - 10 + (hash1(i * 7.31) - 0.5) * 16 + (i % 2 ? 3 : -2), (i / n) * h);
    shape.push(0, h);
    const shadow = new Graphics().poly(shape).fill({ color: C.ink, alpha: 0.2 });
    shadow.position.set(8, 10);
    const base = new Graphics().poly(shape).fill(0xf2e9d2);
    const tex = new TilingSprite({ texture: paperTexture(0xf2e9d2, 512, 1.2), width: w + 20, height: h });
    const mask = new Graphics().poly(shape).fill(0xffffff);
    tex.mask = mask;
    const edge = new Graphics().poly(shape).stroke({ width: 1.5, color: P.agedEdge, alpha: 0.7 });
    sheet.addChild(shadow, base, tex, mask, edge);
    // its own frame, in the fresh ink
    const fr = new Graphics();
    fr.rect(36, 16, w - 66, h - 32).stroke({ width: 3, color: FRESH });
    fr.rect(44, 24, w - 82, h - 48).stroke({ width: 1.2, color: FRESH, alpha: 0.8 });
    for (let i = 1; i < 4; i++) fr.moveTo(44, (h / 4) * i).lineTo(w - 38, (h / 4) * i);
    fr.stroke({ width: 1, color: FRESH, alpha: 0.12 });
    const wg = new Graphics();
    for (let i = 0; i < 16; i++) waves(wg, 60 + hash1(i * 4.7 + 3) * (w - 160), 170 + hash1(i * 9.1 + 5) * (h - 260), 26 + hash1(i) * 30, FRESH, 0.22);
    sheet.addChild(fr, wg);
    // title (and its misregistered ghost)
    const ttl = (fill: number) => txt('Mar de las Rupturas', { fontFamily: F.news, fontSize: 44, fill });
    const ghost = ttl(MISREG);
    ghost.anchor.set(0.5, 0);
    ghost.alpha = 0.35;
    ghost.position.set(w / 2 + 4 + 2.5, 44 - 2);
    const title = ttl(FRESH);
    title.anchor.set(0.5, 0);
    title.position.set(w / 2 + 4, 44);
    const sub = txt('Hoja añadida · nadie recuerda haberla pegado', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 15, fill: FRESH });
    sub.anchor.set(0.5, 0);
    sub.position.set(w / 2 + 4, 102);
    sheet.addChild(ghost, title, sub);
    // the Archive's correction: the old print says there's nothing here; fresh ink disagrees
    const old = txt('Mar abierto. Aquí no hay nada.', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 17, fill: P.blue });
    old.anchor.set(0.5);
    old.position.set(w / 2 + 4, 482);
    old.alpha = 0.8;
    const strike = new Graphics()
      .moveTo(-old.width / 2 - 6, 2)
      .lineTo(old.width / 2 + 6, -3)
      .stroke({ width: 2.5, color: FRESH, cap: 'round' });
    strike.position.copyFrom(old.position);
    const fix = txt('Siempre estuvo aquí.', { fontFamily: F.brush, fontSize: 21, fill: FRESH });
    fix.anchor.set(0.5);
    fix.rotation = -0.05;
    fix.position.set(w / 2 + 22, 514);
    sheet.addChild(old, strike, fix);
    // the strip you can see from the whole-chart view (CARTA): what's beyond, and that you can drag there
    const tab = txt('MAR DE LAS RUPTURAS', { fontFamily: F.poster, fontSize: 17, fill: FRESH, letterSpacing: 3 });
    tab.anchor.set(0.5);
    tab.rotation = -Math.PI / 2;
    tab.position.set(18, h / 2 - 20);
    tab.label = SHEET_TAB;
    const arrow = new Graphics().poly([-6, -9, 7, 0, -6, 9]).fill(FRESH);
    arrow.position.set(16, h / 2 + 100);
    sheet.addChild(tab, arrow);
    gsap.to(arrow, { x: 21, yoyo: true, repeat: -1, duration: 0.6, ease: 'sine.inOut' });
    // the islands
    for (const r of this.rupturas) sheet.addChild(this.ruptureIsle(r));
    // tape over the seam, glued to the old chart
    const tape = new Container();
    for (const [ty, rot] of [
      [70, -0.22],
      [h - 36, 0.18],
    ] as const) {
      const t = new Graphics().rect(-34, -13, 68, 26).fill({ color: 0xf6e6a8, alpha: 0.6 }).stroke({ width: 1, color: P.agedEdge, alpha: 0.4 });
      t.position.set(2, ty);
      t.rotation = rot;
      tape.addChild(t);
    }
    sheet.addChild(tape);
    this.chart.addChild(sheet);
  }

  /** one island of the sheet: fresh ink out of register, its name, a red «!» when the story waits there */
  private ruptureIsle(r: MapRegion): Container {
    const def = RS_ISLE[r.id]!;
    const [cx, cy] = def.p;
    const c = new Container();
    c.position.set(cx, cy);
    const g = new Graphics();
    const poly = islandPoly(0, 0, r.id === 'nacar' ? 70 : 92, r.id === 'nacar' ? 62 : 56, def.seed);
    // the misregistered print: the same coast a hair off, in another ink
    const reg = new Graphics();
    drawIsland(reg, poly, 0, 0, { land: def.land, ink: MISREG, rings: 2, hatch: false });
    reg.position.set(3.5, -2.5);
    reg.alpha = 0.35;
    drawIsland(g, poly, 0, 0, { land: def.land, ink: FRESH, rings: 4 });
    const d = new Graphics();
    if (r.id === 'paginas') {
      // drifting pages and an open book washed ashore
      for (let i = 0; i < 6; i++) {
        const px = (hash1(i * 3.3 + 1) - 0.5) * 120;
        const py = (hash1(i * 5.7 + 2) - 0.5) * 70;
        const a = (hash1(i * 2.1) - 0.5) * 0.9;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        const pt = (x: number, y: number) => [px + x * ca - y * sa, py + x * sa + y * ca];
        d.poly([...pt(-9, -12), ...pt(9, -12), ...pt(9, 12), ...pt(-9, 12)]).fill(0xfbf6e8).stroke({ width: 1.6, color: FRESH });
        d.moveTo(...(pt(-5, -5) as [number, number])).lineTo(...(pt(5, -5) as [number, number]));
        d.moveTo(...(pt(-5, 1) as [number, number])).lineTo(...(pt(5, 1) as [number, number]));
        d.stroke({ width: 1, color: FRESH, alpha: 0.7 });
      }
      d.poly([-30, 6, 0, 14, 0, -10, -30, -16]).fill(0xfbf6e8).stroke({ width: 2.2, color: FRESH, join: 'round' });
      d.poly([30, 6, 0, 14, 0, -10, 30, -16]).fill(0xf3ead2).stroke({ width: 2.2, color: FRESH, join: 'round' });
    } else {
      // the nacre mountain: facets that catch the light
      d.poly([-46, 26, -12, -52, 8, 26]).fill(0xf4efff).stroke({ width: 2.4, color: FRESH, join: 'round' });
      d.poly([-12, -52, 8, 26, 40, 26, 14, -24]).fill(0xd9ccf5).stroke({ width: 2.4, color: FRESH, join: 'round' });
      d.moveTo(-12, -52).lineTo(-20, 26).stroke({ width: 1.2, color: FRESH, alpha: 0.6 });
      d.moveTo(-60, -40).lineTo(-26, -20).moveTo(-62, -30).lineTo(-28, -12).stroke({ width: 1.5, color: 0xd99a2b, alpha: 0.8 });
    }
    c.addChild(reg, g, d);
    this.isleChrome(c, r, (r.id === 'nacar' ? 62 : 56) + 34, [r.id === 'nacar' ? 62 : 82, -50]);
    return c;
  }

  /**
   * What every Parte II island on the chart has: its name on a ribbon (fresh ink), a red «!» pin when the
   * story waits there, hover/tap (travel to the 3D island) and, the first time, the ink soaking in.
   */
  private isleChrome(c: Container, r: MapRegion, ribbonY: number, pinAt: Pt, hit: [number, number] = [130, 110]) {
    const nm = txt(r.name, { fontFamily: F.brush, fontSize: 17, fill: FRESH });
    nm.anchor.set(0.5);
    const rw = nm.width + 28;
    const rib = new Container();
    rib.addChild(
      new Graphics()
        .poly([-rw / 2 - 12, -2, -rw / 2, -13, rw / 2, -13, rw / 2 + 12, -2, rw / 2, 13, -rw / 2, 13])
        .fill(0xf7f0dc)
        .stroke({ width: 2, color: FRESH, join: 'round' }),
      nm,
    );
    rib.position.set(0, ribbonY);
    rib.rotation = -0.025;
    rib.label = ISLE_NAME;
    c.addChild(rib);
    // the story waits here: a red pin that bobs (like an open errand)
    if (r.call) {
      const pin = new Container();
      const pg = new Graphics().circle(0, 0, 17).fill(C.red).stroke({ width: 3, color: C.ink });
      const ex = txt('!', { fontFamily: F.poster, fontSize: 26, fill: C.paper });
      ex.anchor.set(0.5);
      pin.addChild(pg, ex);
      pin.position.set(pinAt[0], pinAt[1]);
      c.addChild(pin);
      gsap.to(pin.scale, { x: 1.18, y: 1.18, yoyo: true, repeat: -1, duration: 0.5, ease: 'sine.inOut' });
    }
    c.eventMode = 'static';
    c.cursor = 'pointer';
    // the island's oval, and its name ribbon too (La Isla que Nadie Recuerda hangs its ribbon below the oval: tapping
    // the name did nothing)
    c.hitArea = {
      contains: (x: number, y: number) =>
        (x * x) / (hit[0] * hit[0]) + (y * y) / (hit[1] * hit[1]) < 1 || (Math.abs(x) <= rw / 2 + 12 && Math.abs(y - ribbonY) <= 16),
    };
    c.on('pointerover', () => {
      gsap.to(c.scale, { x: 1.06, y: 1.06, duration: 0.14, ease: 'back.out(3)' });
      sfx('hover');
    });
    c.on('pointerout', () => gsap.to(c.scale, { x: 1, y: 1, duration: 0.16 }));
    c.on('pointertap', (e) => {
      e.stopPropagation();
      if (performance.now() - this.pannedAt < 250) return;
      this.closeCard();
      sfx('paper');
      gsap.fromTo(c.scale, { x: 0.94, y: 0.94 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
      void import('../app/flow').then((fl) => fl.goRegion(r.id));
    });
    // first time on the chart: the fresh ink soaks in
    const seenKey = `carta_${r.id}`;
    if (!beatSeen(seenKey)) {
      markBeat(seenKey);
      G.save();
      gsap.from(c, { alpha: 0, duration: 1.1, delay: 0.5, ease: 'power2.in' });
      gsap.from(c.scale, { x: 1.3, y: 1.3, duration: 1.1, delay: 0.5, ease: 'power3.out' });
      gsap.delayedCall(1.4, () => {
        if (c.destroyed) return;
        sfx('reveal');
        sparkles(c, 0, 0, FRESH, 18, 150);
        const st = stamp('¡NUEVA ISLA!', C.red, 24, -0.1);
        st.position.set(0, -92);
        c.addChild(st);
        gsap.from(st.scale, { x: 2.2, y: 2.2, duration: 0.18, ease: 'power3.in' });
        gsap.to(st, { alpha: 0, delay: 2.6, duration: 0.5, onComplete: () => st.destroy({ children: true }) });
      });
    }
  }

  // ------------------------------------------------------------------ Oleada 2: EL CIELO
  /**
   * The fold-out sheet ABOVE the sea: paler, bluer paper opened upward from under the Rupturas sheet (a
   * crease near its foot), a sky wash, an altitude scale «en gatos apilados», engraved clouds and wind,
   * and the sky-layer islands floating in fresh ink — their undersides hanging, their clouds below.
   * Nothing at all until one of its islands' flags is set: the chart stays exactly as it was.
   */
  private buildCielo() {
    this.cielo = mapRegions().filter((r) => !!SKY_ISLE[r.id]);
    if (!this.cielo.length) return;
    this.chartW = Math.max(this.chartW, SKY_S.x + SKY_S.w + 24);
    this.chartTop = SKY_S.y - 30;
    const { w, h } = SKY_S;
    const sheet = new Container();
    sheet.position.set(SKY_S.x, SKY_S.y);
    sheet.rotation = -0.011;
    // torn top edge (the sheet's foot is straight: it slips under the sea's sheet)
    const shape: number[] = [];
    const n = 40;
    for (let i = 0; i <= n; i++) shape.push((i / n) * w, 8 + (hash1(i * 5.13 + 2) - 0.5) * 14 + (i % 2 ? 2 : -2));
    shape.push(w, h, 0, h);
    const shadow = new Graphics().poly(shape).fill({ color: C.ink, alpha: 0.18 });
    shadow.position.set(-8, 8);
    const base = new Graphics().poly(shape).fill(SKY_PAPER);
    const tex = new TilingSprite({ texture: paperTexture(SKY_PAPER, 512, 1.1), width: w + 20, height: h });
    const mask = new Graphics().poly(shape).fill(0xffffff);
    tex.mask = mask;
    // the sky wash: deeper at the top, fading into the paper toward the sea
    const wash = new Graphics();
    for (let i = 0; i < 14; i++) wash.rect(0, i * (h * 0.055), w, h * 0.055 + 1).fill({ color: SKY_WASH, alpha: 0.42 * (1 - i / 14) });
    const washMask = new Graphics().poly(shape).fill(0xffffff);
    wash.mask = washMask;
    const edge = new Graphics().poly(shape).stroke({ width: 1.5, color: P.agedEdge, alpha: 0.7 });
    // the fold: it was folded twice to fit in the book (creases + a slightly darker panel)
    const fold = new Graphics();
    for (const fy of [h * 0.36, h * 0.72]) {
      fold.rect(0, fy, w, 10).fill({ color: C.ink, alpha: 0.05 });
      fold.moveTo(0, fy).lineTo(w, fy + 2).stroke({ width: 1.2, color: P.agedEdge, alpha: 0.55 });
      fold.moveTo(0, fy + 1.5).lineTo(w, fy + 3.5).stroke({ width: 1, color: 0xffffff, alpha: 0.5 });
    }
    sheet.addChild(shadow, base, tex, mask, wash, washMask, fold, edge);
    // its frame in the fresh ink, and the altitude scale up the left margin
    const fr = new Graphics();
    fr.rect(36, 30, w - 66, h - 62).stroke({ width: 3, color: FRESH });
    fr.rect(44, 38, w - 82, h - 78).stroke({ width: 1.2, color: FRESH, alpha: 0.8 });
    sheet.addChild(fr);
    const alt = new Graphics();
    const ay0 = h - 60;
    const ay1 = 130;
    alt.moveTo(60, ay0).lineTo(60, ay1).stroke({ width: 1.6, color: FRESH, alpha: 0.8 });
    for (let i = 0; i <= 8; i++) {
      const y = ay0 - ((ay0 - ay1) * i) / 8;
      alt.moveTo(60, y).lineTo(i % 2 ? 66 : 72, y).stroke({ width: 1.4, color: FRESH, alpha: 0.8 });
    }
    alt.poly([54, ay1 + 2, 60, ay1 - 10, 66, ay1 + 2]).fill(FRESH);
    sheet.addChild(alt);
    const altL = txt('ALTITUD · en gatos apilados', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 13, fill: FRESH });
    altL.anchor.set(0.5);
    altL.rotation = -Math.PI / 2;
    altL.position.set(84, (ay0 + ay1) / 2 + 40);
    altL.alpha = 0.85;
    sheet.addChild(altL);
    for (const [k, lab] of [
      [0, '0'],
      [4, '200'],
      [8, '400'],
    ] as const) {
      const t = txt(lab, { fontFamily: F.serif, fontSize: 12, fill: FRESH });
      t.anchor.set(1, 0.5);
      t.position.set(52, ay0 - ((ay0 - ay1) * k) / 8);
      sheet.addChild(t);
    }
    // engraved clouds and wind
    const cg = new Graphics();
    for (const [cx, cy, sc] of [
      [150, 210, 0.9],
      [470, 150, 0.6],
      [330, 420, 0.7],
    ] as const)
      cloud(cg, cx, cy, sc, 0xf6f8f8, FRESH);
    sheet.addChild(cg);
    const wg = new Graphics();
    for (let i = 0; i < 9; i++) {
      const x = 110 + hash1(i * 3.7 + 1) * (w - 220);
      const y = 140 + hash1(i * 6.1 + 4) * (h - 260);
      const L = 40 + hash1(i * 1.9) * 50;
      wg.moveTo(x, y);
      for (let k = 1; k <= 8; k++) wg.lineTo(x + (L * k) / 8, y + Math.sin(k * 0.9 + i) * 3);
      wg.stroke({ width: 1.3, color: FRESH, alpha: 0.35 });
      wg.poly([x + L, y - 3, x + L + 7, y + Math.sin(8 * 0.9 + i) * 3, x + L, y + 5]).fill({ color: FRESH, alpha: 0.35 });
    }
    sheet.addChild(wg);
    // title (and its misregistered ghost)
    const ttl = (fill: number) => txt('El Cielo', { fontFamily: F.news, fontSize: 48, fill });
    const ghost = ttl(MISREG);
    ghost.anchor.set(0.5, 0);
    ghost.alpha = 0.35;
    ghost.position.set(w / 2 + 14 + 2.5, 50 - 2);
    const title = ttl(FRESH);
    title.anchor.set(0.5, 0);
    title.position.set(w / 2 + 14, 50);
    const sub = txt('Hoja desplegable · lo que hay encima del mar (no se moja)', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 14, fill: FRESH });
    sub.anchor.set(0.5, 0);
    sub.position.set(w / 2 + 14, 110);
    sheet.addChild(ghost, title, sub);
    // the islands
    for (const r of this.cielo) sheet.addChild(this.skyIsle(r));
    // the strip that peeks over the sea's sheet when the chart is zoomed out: what's up there
    const tab = txt('▲ EL CIELO ▲', { fontFamily: F.poster, fontSize: 17, fill: FRESH, letterSpacing: 3 });
    tab.anchor.set(0.5);
    tab.position.set(160, h - 50);
    sheet.addChild(tab);
    gsap.to(tab, { y: h - 56, yoyo: true, repeat: -1, duration: 0.7, ease: 'sine.inOut' });
    this.chart.addChild(sheet);
  }

  /** one sky island: floating land with its upside-down mountain, clouds under it, its vignette */
  private skyIsle(r: MapRegion): Container {
    const def = SKY_ISLE[r.id]!;
    const c = new Container();
    c.position.set(def.p[0], def.p[1]);
    const rx = r.id === 'corona' ? 84 : 70;
    const ry = r.id === 'corona' ? 34 : 30;
    const poly = islandPoly(0, 0, rx, ry, def.seed, 28, 0.14);
    // the hanging mountain under it (hatched), then the land on top
    const under = new Graphics();
    const lo = poly.filter(([, y]) => y >= -2).sort((a, b) => a[0] - b[0]);
    const depth = r.id === 'corona' ? 70 : 92;
    const tipX = r.id === 'corona' ? 4 : -10;
    const conePts: number[] = [];
    for (const [x, y] of lo) conePts.push(x, y);
    conePts.push(tipX + 10, depth * 0.72, tipX, depth, tipX - 12, depth * 0.66);
    under.poly(conePts).fill(r.id === 'corona' ? 0xf1e8d4 : 0xcbbfe6).stroke({ width: 2.6, color: FRESH, join: 'round' });
    for (let i = 0; i < 9; i++) {
      const x0 = -rx * 0.8 + (i * rx * 1.6) / 8;
      under.moveTo(x0, ry * 0.4).lineTo(tipX + (x0 - tipX) * 0.25, depth * 0.85).stroke({ width: 1, color: FRESH, alpha: 0.35 });
    }
    // roots / chains dangling
    for (let i = 0; i < 4; i++) {
      const x = -rx * 0.5 + i * rx * 0.33;
      under.moveTo(x, ry * 0.6 + 6).bezierCurveTo(x + 5, ry + 22, x - 4, ry + 38, x + 2, ry + 52).stroke({ width: 1.4, color: r.id === 'corona' ? GILT : FRESH, alpha: 0.7 });
    }
    const reg = new Graphics();
    drawIsland(reg, poly, 0, 0, { land: def.land, ink: MISREG, rings: 0, hatch: false });
    reg.position.set(3.5, -2.5);
    reg.alpha = 0.35;
    const g = new Graphics();
    drawIsland(g, poly, 0, 0, { land: def.land, ink: FRESH, rings: 0, hatch: false });
    const cl = new Graphics();
    cloud(cl, -rx * 0.55, ry + 30, 0.85, 0xf8fafa, FRESH);
    cloud(cl, rx * 0.6, ry + 22, 0.7, 0xf8fafa, FRESH);
    const d = new Graphics();
    if (r.id === 'corona') {
      // the white-gold city: symmetric towers, domes, a crown floating over the middle one
      const tw = (x: number, hgt: number, wd: number) => {
        d.rect(x - wd / 2, -hgt, wd, hgt).fill(0xfffcf2).stroke({ width: 2, color: FRESH });
        d.moveTo(x - wd / 2, -hgt * 0.55).lineTo(x + wd / 2, -hgt * 0.55).stroke({ width: 1.4, color: GILT });
        d.arc(x, -hgt, wd / 2, Math.PI, 0).fill(0xf2cf6e).stroke({ width: 1.8, color: FRESH });
      };
      tw(-46, 26, 12);
      tw(46, 26, 12);
      tw(-22, 38, 12);
      tw(22, 38, 12);
      tw(0, 62, 15);
      d.rect(-60, -10, 120, 12).fill(0xfffcf2).stroke({ width: 2, color: FRESH });
      for (let i = 0; i < 9; i++) d.rect(-56 + i * 14, -10, 4, 10).fill({ color: GILT, alpha: 0.8 });
      // the crown
      const cy = -84;
      d.poly([-12, cy + 8, -12, cy - 4, -6, cy + 2, 0, cy - 8, 6, cy + 2, 12, cy - 4, 12, cy + 8]).fill(0xf2cf6e).stroke({ width: 2, color: FRESH, join: 'round' });
      d.ellipse(0, cy + 4, 20, 5).stroke({ width: 1.2, color: GILT, alpha: 0.8 });
      // a little airship
      d.ellipse(80, -56, 18, 7).fill(0xfffcf2).stroke({ width: 1.8, color: FRESH });
      d.rect(74, -48, 12, 5).fill(GILT).stroke({ width: 1.2, color: FRESH });
    } else {
      // trees standing on it… and an upside-down islet hanging over it, its trees pointing down,
      // with water falling UP (wavy lines with arrowheads)
      for (const [x, s] of [
        [-34, 1],
        [-12, 0.8],
        [26, 0.9],
      ] as const) {
        d.moveTo(x, 0).lineTo(x, -16 * s).stroke({ width: 2, color: FRESH });
        d.circle(x, -22 * s, 9 * s).fill(0xffb2cf).stroke({ width: 1.8, color: FRESH });
      }
      const ix = 18;
      const iy = -78;
      d.poly([ix - 34, iy, ix + 34, iy, ix + 6, iy - 40]).fill(0xcbbfe6).stroke({ width: 2.2, color: FRESH, join: 'round' });
      d.ellipse(ix, iy, 34, 7).fill(0xdcd2f0).stroke({ width: 2, color: FRESH });
      for (const x of [-18, 2, 20]) {
        d.moveTo(ix + x, iy + 4).lineTo(ix + x, iy + 16).stroke({ width: 1.6, color: FRESH });
        d.circle(ix + x, iy + 21, 6).fill(0x9fe6cf).stroke({ width: 1.4, color: FRESH });
      }
      for (const x of [-44, 54]) {
        d.moveTo(x, 4);
        for (let k = 1; k <= 8; k++) d.lineTo(x + Math.sin(k * 1.4) * 3, 4 - k * 9);
        d.stroke({ width: 2, color: 0x3a9ec4 });
        d.poly([x - 5, -64, x, -74, x + 5, -64]).fill(0x3a9ec4);
      }
    }
    c.addChild(cl, under, reg, g, d);
    this.isleChrome(c, r, r.id === 'corona' ? 112 : 128, [rx * 0.95, -40], [rx + 40, 110]);
    return c;
  }

  // ------------------------------------------------------------------ Oleada 3: LO DE ARRIBA
  /**
   * A strip of NIGHT CHART above the sky: indigo paper printed in gold ink — stars, a nebula wash, a
   * constellation shaped like a cat, a ringed planet — with the astral islands on it (Puerto Cometa: a
   * comet chip with its tail streaming off the paper). Its foot slips under the sky sheet's torn top
   * (or, without the sky sheet, under the Rupturas sheet's top). Nothing at all without its flags.
   */
  private buildAstral(at: number) {
    this.astral = mapRegions().filter((r) => !!ASTRAL_ISLE[r.id]);
    if (!this.astral.length) return;
    const { w, h } = ASTRAL_S;
    const y0 = this.cielo.length ? SKY_S.y - h + 52 : RS.y - h + 34;
    this.astralY = y0;
    this.chartW = Math.max(this.chartW, ASTRAL_S.x + w + 24);
    this.chartTop = Math.min(this.chartTop, y0 - 30);
    const sheet = new Container();
    sheet.position.set(ASTRAL_S.x, y0);
    sheet.rotation = 0.014;
    // torn top edge; a straight foot (it goes under the sheet below)
    const shape: number[] = [];
    const n = 36;
    for (let i = 0; i <= n; i++) shape.push((i / n) * w, 8 + (hash1(i * 3.71 + 9) - 0.5) * 14 + (i % 2 ? 2 : -2));
    shape.push(w, h, 0, h);
    const shadow = new Graphics().poly(shape).fill({ color: C.ink, alpha: 0.22 });
    shadow.position.set(7, 8);
    const base = new Graphics().poly(shape).fill(ASTRAL_PAPER);
    const tex = new TilingSprite({ texture: paperTexture(ASTRAL_PAPER, 512, 0.7), width: w + 20, height: h });
    const mask = new Graphics().poly(shape).fill(0xffffff);
    tex.mask = mask;
    // a nebula wash (pink / violet / teal, very soft)
    const neb = new Graphics();
    for (let i = 0; i < 9; i++) {
      const nx = 90 + hash1(i * 5.3 + 1) * (w - 180);
      const ny = 70 + hash1(i * 7.9 + 2) * (h - 170);
      neb.ellipse(nx, ny, 70 + hash1(i * 2.2) * 80, 26 + hash1(i * 3.1) * 30).fill({ color: [0xff5fa8, 0x7a4dff, 0x3fd0d0][i % 3], alpha: 0.07 });
    }
    const nebMask = new Graphics().poly(shape).fill(0xffffff);
    neb.mask = nebMask;
    const edge = new Graphics().poly(shape).stroke({ width: 1.5, color: 0x0c0e26, alpha: 0.8 });
    sheet.addChild(shadow, base, tex, mask, neb, nebMask, edge);
    // the stars (printed in gold and white), a few four-pointed ones
    const st = new Graphics();
    for (let i = 0; i < 90; i++) {
      const sx = 40 + hash1(i * 1.37 + 4) * (w - 80);
      const sy = 30 + hash1(i * 2.71 + 6) * (h - 90);
      st.circle(sx, sy, 0.7 + hash1(i * 4.1) * 1.6).fill({ color: i % 4 ? 0xffffff : ASTRAL_INK, alpha: 0.55 + hash1(i * 9.3) * 0.45 });
    }
    for (let i = 0; i < 9; i++) star(st, 50 + hash1(i * 6.7 + 2) * (w - 100), 40 + hash1(i * 8.3 + 1) * (h - 110), 5 + hash1(i) * 4, ASTRAL_INK);
    // a constellation shaped like a cat sitting (thin gold lines, dots on the stars)
    const cat: Pt[] = [
      [70, 150], [78, 120], [92, 136], [104, 120], [110, 150], [118, 196], [96, 214], [66, 210], [56, 182], [70, 150],
    ];
    st.moveTo(cat[0][0], cat[0][1]);
    for (const [cx, cy] of cat.slice(1)) st.lineTo(cx, cy);
    st.moveTo(118, 196).bezierCurveTo(146, 200, 150, 170, 136, 160).stroke({ width: 1.2, color: ASTRAL_INK, alpha: 0.7 });
    for (const [cx, cy] of cat) st.circle(cx, cy, 2.4).fill(ASTRAL_INK);
    // a little ringed planet in the corner
    st.circle(w - 74, 132, 15).fill(0xe9a07a).stroke({ width: 1.6, color: ASTRAL_INK });
    st.moveTo(w - 87, 128).lineTo(w - 61, 128).stroke({ width: 1.2, color: 0xb76a5a, alpha: 0.8 });
    st.ellipse(w - 74, 134, 28, 7).stroke({ width: 2, color: ASTRAL_INK });
    sheet.addChild(st);
    // its frame, in gold
    const fr = new Graphics();
    fr.rect(30, 26, w - 60, h - 86).stroke({ width: 2.6, color: ASTRAL_INK });
    fr.rect(37, 33, w - 74, h - 100).stroke({ width: 1, color: ASTRAL_INK, alpha: 0.7 });
    sheet.addChild(fr);
    // title (and its misregistered ghost)
    const ttl = (fill: number) => txt('Lo de Arriba', { fontFamily: F.news, fontSize: 40, fill });
    const ghost = ttl(0xff5fa8);
    ghost.anchor.set(0.5, 0);
    ghost.alpha = 0.4;
    ghost.position.set(w / 2 + 2.5, 40 - 2);
    const title = ttl(ASTRAL_INK);
    title.anchor.set(0.5, 0);
    title.position.set(w / 2, 40);
    const sub = txt('Carta estelar · aquí se acaba el aire (traiga el suyo)', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 13, fill: ASTRAL_INK });
    sub.anchor.set(0.5, 0);
    sub.position.set(w / 2, 90);
    sheet.addChild(ghost, title, sub);
    for (const r of this.astral) sheet.addChild(this.astralIsle(r));
    // the strip that peeks out over the sky sheet: what's up there
    const tab = txt('▲ LO DE ARRIBA ▲', { fontFamily: F.poster, fontSize: 15, fill: ASTRAL_INK, letterSpacing: 3 });
    tab.anchor.set(0.5);
    tab.position.set(118, h - 82);
    sheet.addChild(tab);
    gsap.to(tab, { y: h - 87, yoyo: true, repeat: -1, duration: 0.7, ease: 'sine.inOut' });
    this.chart.addChildAt(sheet, Math.min(at, this.chart.children.length));
    // tape over the seam (on top of both sheets)
    const tape = new Container();
    for (const [tx, rot] of [
      [ASTRAL_S.x + 60, 0.2],
      [ASTRAL_S.x + w - 70, -0.16],
    ] as const) {
      const t = new Graphics().rect(-30, -12, 60, 24).fill({ color: 0xf6e6a8, alpha: 0.6 }).stroke({ width: 1, color: P.agedEdge, alpha: 0.4 });
      t.position.set(tx, y0 + h - 44);
      t.rotation = rot;
      tape.addChild(t);
    }
    this.chart.addChild(tape);
  }

  /** an astral island: a comet chip with its tail streaming off across the strip, a gantry and a tiny rocket */
  private astralIsle(r: MapRegion): Container {
    const def = ASTRAL_ISLE[r.id]!;
    const c = new Container();
    c.position.set(def.p[0], def.p[1]);
    const g = new Graphics();
    // the tail: fanned strokes off to the upper left, fading
    for (let i = 0; i < 7; i++) {
      const k = i / 6;
      g.moveTo(-34, -6 + i * 3)
        .bezierCurveTo(-90, -30 + i * 8, -150, -40 + i * 14, -210 - i * 6, -70 + i * 18)
        .stroke({ width: 3.2 - k * 1.8, color: i % 2 ? 0x8fe8ff : 0xff8fd0, alpha: 0.85 - k * 0.45, cap: 'round' });
    }
    // the chip (and its misregistered print)
    const poly = islandPoly(0, 0, 58, 30, def.seed, 22, 0.3);
    const reg = new Graphics();
    drawIsland(reg, poly, 0, 0, { land: 0x5a5296, ink: 0xff5fa8, rings: 0, hatch: false });
    reg.position.set(3.5, -2.5);
    reg.alpha = 0.35;
    const land = new Graphics();
    drawIsland(land, poly, 0, 0, { land: 0x8d86c4, ink: ASTRAL_INK, rings: 0, hatch: false });
    // jagged underside
    const lo = poly.filter(([, y]) => y >= -2).sort((a, b) => a[0] - b[0]);
    const pts: number[] = [];
    for (const [x, y] of lo) pts.push(x, y);
    pts.push(20, 42, 6, 64, -10, 40, -30, 50);
    const under = new Graphics().poly(pts).fill(0x3b3670).stroke({ width: 2.2, color: ASTRAL_INK, join: 'round' });
    const d = new Graphics();
    // the crater's crystal (cyan) and a little gantry (gold) with a hull in it
    d.poly([-6, -2, -2, -22, 2, -2]).fill(0x8ff1ff).stroke({ width: 1.4, color: ASTRAL_INK });
    d.rect(18, -22, 26, 18).stroke({ width: 1.6, color: 0xf2b632 });
    d.moveTo(18, -13).lineTo(44, -13).stroke({ width: 1, color: 0xf2b632 });
    d.ellipse(31, -8, 11, 3.5).fill(0xc9d2e0).stroke({ width: 1.2, color: ASTRAL_INK });
    // the launch rail and its rocket
    d.moveTo(-26, -4).quadraticCurveTo(-44, -6, -52, -26).stroke({ width: 2, color: 0xc9d2e0 });
    d.poly([-30, -10, -22, -6, -30, -2]).fill(0xe8574d);
    d.circle(-27, -6, 2.2).fill(0xf1e7d0);
    c.addChild(g, under, reg, land, d);
    this.isleChrome(c, r, 74, [62, -40], [96, 80]);
    return c;
  }

  /**
   * Where the two sheets meet: tape over the seam, and a waterspout that comes up from under the sea's
   * sheet and climbs into the sky (drawn on the sky's foot, so it never covers the sea's title).
   */
  private buildSeam() {
    if (!this.cielo.length || !this.rupturas.length) return;
    const seam = new Container();
    const sx = SKY_S.x + 448;
    const yb = RS.y - 2;
    const yt = SKY_S.y + SKY_S.h - 300;
    const g = new Graphics();
    whirl(g, sx, yb - 6, 0.7, FRESH);
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = yb - 10 - (yb - 10 - yt) * t;
      const rw = 5 + 24 * Math.pow(t, 1.5);
      const x = sx + Math.sin(t * 5) * 5 * (1 - t);
      g.ellipse(x, y, rw, rw * 0.28).stroke({ width: 1.5, color: FRESH, alpha: 0.45 + 0.4 * (1 - t) });
    }
    g.moveTo(sx - 5, yb - 10).bezierCurveTo(sx - 8, yb - 110, sx - 26, yt + 70, sx - 29, yt).stroke({ width: 2, color: FRESH, alpha: 0.8 });
    g.moveTo(sx + 5, yb - 10).bezierCurveTo(sx + 8, yb - 110, sx + 26, yt + 70, sx + 29, yt).stroke({ width: 2, color: FRESH, alpha: 0.8 });
    g.poly([sx - 7, yt - 4, sx, yt - 18, sx + 7, yt - 4]).fill(FRESH);
    seam.addChild(g);
    const lab = txt('Tromba · solo de subida', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 14, fill: FRESH });
    lab.anchor.set(1, 0.5);
    lab.rotation = -0.04;
    lab.position.set(sx - 36, yb - 44);
    seam.addChild(lab);
    // tape over the seam, sky sheet to sea sheet
    for (const [tx, rot] of [
      [RS.x + 70, 0.16],
      [RS.x + 300, -0.12],
    ] as const) {
      const t = new Graphics().rect(-34, -13, 68, 26).fill({ color: 0xf6e6a8, alpha: 0.6 }).stroke({ width: 1, color: P.agedEdge, alpha: 0.4 });
      t.position.set(tx, RS.y + 4);
      t.rotation = rot;
      seam.addChild(t);
    }
    this.chart.addChild(seam);
  }

  // ------------------------------------------------------------------ errands (Encargos)
  private errandList() {
    const out: { id: string; zone: number; after: number; name: string; state: 'locked' | 'open' | 'done' }[] = [];
    for (let z = 1; z <= ZONES.length; z++) {
      if (!zoneUnlocked(z)) continue;
      const list = (ZONES[z - 1] as unknown as { errands?: { id: string; afterStage: number; name: string }[] }).errands ?? [];
      for (const e of list) {
        const done = !!G.s.errands?.done.includes(e.id) || G.has(`errand_done_${e.id}`);
        const open = stageState(z, e.afterStage) === 'cleared';
        out.push({ id: e.id, zone: z, after: e.afterStage, name: e.name, state: done ? 'done' : open ? 'open' : 'locked' });
      }
    }
    return out;
  }
  private errandsOpen() {
    return this.errandList().filter((e) => e.state === 'open').length;
  }
  private async openErrandBoard() {
    this.closeCard();
    try {
      const m = await import('../panels/Errands');
      m.openErrands();
    } catch (e) {
      console.warn('[map] errands board unavailable', e);
      toast('Tablero de Encargos: próximamente', { color: C.yellow });
    }
  }
  private buildErrandPins() {
    for (const e of this.errandList()) {
      const [nx, ny] = nodePos(e.zone, e.after);
      const pinC = new Container();
      const g = new Graphics();
      errandPin(g, 1, e.state === 'locked' ? P.agedDark : P.aged, e.state === 'locked' ? P.blueSoft : C.ink, e.state === 'done' ? P.blue : C.red);
      pinC.addChild(g);
      if (e.state === 'done') {
        const ck = new Graphics().moveTo(-8, 6).lineTo(-2, 13).lineTo(11, -4).stroke({ width: 5, color: C.red, cap: 'round', join: 'round' });
        pinC.addChild(ck);
      } else if (e.state === 'open') {
        const ex = txt('!', { fontFamily: F.poster, fontSize: 26, fill: C.red });
        ex.anchor.set(0.5);
        ex.position.set(16, -22);
        pinC.addChild(ex);
        gsap.to(pinC, { rotation: 0.12, yoyo: true, repeat: -1, duration: 0.45, ease: 'sine.inOut' });
      }
      const lb = txt(e.name, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 13, fill: e.state === 'locked' ? P.blueSoft : C.ink });
      lb.anchor.set(0.5, 0);
      lb.position.set(0, 22);
      pinC.addChild(lb);
      pinC.alpha = e.state === 'locked' ? 0.6 : 1;
      // tuck the poster inside the route loop (towards the island), clear of the neighbouring nodes
      const [icx, icy] = zonePt(e.zone, ISLAND_C);
      const dl = Math.hypot(icx - nx, icy - ny) || 1;
      pinC.position.set(nx + ((icx - nx) / dl) * 54, ny + ((icy - ny) / dl) * 54);
      pinC.eventMode = 'static';
      pinC.cursor = 'pointer';
      pinC.hitArea = { contains: (x: number, y: number) => x > -22 && x < 22 && y > -26 && y < 34 };
      pinC.on('pointertap', (ev) => {
        ev.stopPropagation();
        sfx('paper');
        if (e.state === 'locked') {
          toast(`Encargo «${e.name}»`, { color: P.aged, sub: `Gana la etapa ${e.zone}-${e.after} para abrirlo` });
          gsap.fromTo(pinC, { x: pinC.x - 6 }, { x: pinC.x, duration: 0.35, ease: 'elastic.out(1,0.3)' });
          return;
        }
        void this.openErrandBoard();
      });
      this.nodesLayer.addChild(pinC);
    }
  }

  // ------------------------------------------------------------------ nodes & routes
  private buildNodes() {
    for (let z = 1; z <= ZONES.length; z++) {
      if (!zoneUnlocked(z)) continue;
      for (let s = 1; s <= STAGES_PER_ZONE; s++) {
        const n = new StageNode(z, s);
        const [x, y] = nodePos(z, s);
        n.position.set(x, y);
        n.on('pointertap', (e) => {
          e.stopPropagation();
          this.select(n);
        });
        this.nodesLayer.addChild(n);
        this.nodes.set(stageKey(z, s), n);
      }
    }
  }

  /** all route segments [from, to] in order, including inter-zone lanes */
  private segments(): { a: Pt; b: Pt; cleared: boolean; key: string; bend: number }[] {
    const out: { a: Pt; b: Pt; cleared: boolean; key: string; bend: number }[] = [];
    for (let z = 1; z <= ZONES.length; z++) {
      for (let s = 1; s <= STAGES_PER_ZONE; s++) {
        let to: [number, number] | null = null;
        if (s < STAGES_PER_ZONE) to = [z, s + 1];
        else if (z < ZONES.length) to = [z + 1, 1];
        if (!to) continue;
        const cleared = stageState(z, s) === 'cleared';
        out.push({ a: nodePos(z, s), b: nodePos(to[0], to[1]), cleared, key: stageKey(to[0], to[1]), bend: s === STAGES_PER_ZONE ? 40 : (s % 2 ? 1 : -1) * 14 });
      }
    }
    return out;
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
    if (cleared) g.stroke({ width: 4.5, color: C.red, cap: 'round' });
    else g.fill(P.blue);
  }

  private drawRoutes(skipKey: string | null = null) {
    const g = this.routeG.clear();
    for (const sgm of this.segments()) {
      const [bz, bs] = sgm.key.split('-').map(Number);
      if (!zoneUnlocked(bz) && sgm.bend !== 40) continue;
      const pts = this.curvePts(sgm.a, sgm.b, sgm.bend);
      const ra = 30;
      const rb = bs === STAGES_PER_ZONE ? 40 : bs === 5 ? 34 : 28;
      const cleared = sgm.cleared && sgm.key !== skipKey;
      this.strokeRoute(g, pts, cleared, ra, rb, sgm.b);
    }
  }

  private refresh() {
    const f = frontier();
    const fKey = stageKey(f.zone, f.stage);
    for (const n of this.nodes.values()) {
      n.state = stageState(n.zone, n.stage);
      n.isFrontier = stageKey(n.zone, n.stage) === fKey && n.state !== 'cleared';
      n.redraw();
    }
    const fn = this.nodes.get(fKey);
    if (fn && !this.markerMoving) this.placeMarker(fn.x, fn.y - fn.r - 18);
    this.drawRoutes();
  }

  private placeMarker(x: number, y: number) {
    this.markerBase = [x + 34, y + 10];
    this.marker.position.set(this.markerBase[0], this.markerBase[1]);
  }

  private introAnim() {
    const jc = campaignMemo.justCleared;
    const ju = campaignMemo.justUnlocked;
    campaignMemo.justCleared = null;
    campaignMemo.justUnlocked = null;
    // nodes pop in with a stagger
    let i = 0;
    // (never from scale 0: a node must stay clickable even while it pops in)
    for (const n of this.nodes.values()) {
      const s = n.scale.x;
      gsap.fromTo(n.scale, { x: s * 0.45, y: s * 0.45 }, { x: s, y: s, duration: 0.3, delay: 0.15 + i * 0.012, ease: 'back.out(2.5)' });
      gsap.from(n, { alpha: 0, duration: 0.2, delay: 0.15 + i++ * 0.012 });
    }
    if (!jc || !ju) return;
    const a = this.nodes.get(jc);
    const b = this.nodes.get(ju);
    if (!a || !b) return;
    // animate the route being inked from the cleared node to the new one, the boat sails along
    this.markerMoving = true;
    this.drawRoutes(ju);
    const [bz, bs] = ju.split('-').map(Number);
    const bend = bs === 1 && bz > 1 ? 40 : (a.stage % 2 ? 1 : -1) * 14;
    this.placeMarker(a.x, a.y - a.r - 18);
    const pr = { t: 0 };
    const prevState = b.state;
    b.state = 'locked';
    b.isFrontier = false;
    b.redraw();
    gsap.to(pr, {
      t: 1,
      duration: 1.1,
      delay: 0.7,
      ease: 'power2.inOut',
      onStart: () => {
        sfx('whoosh');
        if (bz !== a.zone) this.focusZone(bz, true);
      },
      onUpdate: () => {
        const pts = this.curvePts([a.x, a.y], [b.x, b.y], bend, pr.t);
        this.routeAnim.clear();
        this.strokeRoute(this.routeAnim, pts, true, a.r + 6, -100, [b.x, b.y]);
        const last = pts[pts.length - 1];
        this.marker.position.set(last[0] + 34, last[1] - 30);
      },
      onComplete: () => {
        this.markerMoving = false;
        this.routeAnim.clear();
        b.state = prevState;
        this.refresh();
        sfx('pop');
        sparkles(this.chart, b.x, b.y, C.pinkHot, 12, 90);
        gsap.fromTo(b.scale, { x: 1.8, y: 1.8 }, { x: 1, y: 1, duration: 0.4, ease: 'back.out(3)' });
        const st = stamp(bs === 1 ? '¡NUEVA ZONA!' : '¡NUEVA ETAPA!', C.red, 26, -0.1);
        st.position.set(b.x, b.y + b.r + 30);
        this.chart.addChild(st);
        gsap.from(st.scale, { x: 2.2, y: 2.2, duration: 0.18, ease: 'power3.in', onComplete: () => sfx('hit', 0.8) });
        gsap.to(st, { alpha: 0, delay: 2.4, duration: 0.5, onComplete: () => st.destroy({ children: true }) });
        // a fog that should no longer exist (boss just beaten)
        const fog = this.fogs.get(bz);
        if (fog && zoneUnlocked(bz)) {
          sfx('reveal');
          const b0 = ZONE_BOX[bz];
          sparkles(this.chart, b0.x + BOX_W / 2, b0.y + BOX_H / 2, C.paper, 24, 260);
          fog.pivot.set(b0.x + BOX_W / 2, b0.y + BOX_H / 2);
          fog.position.set(b0.x + BOX_W / 2, b0.y + BOX_H / 2);
          gsap.to(fog.scale, { x: 1.25, y: 1.25, duration: 1.3, ease: 'power2.out' });
          gsap.to(fog, { alpha: 0, duration: 1.3, ease: 'power2.in', onComplete: () => fog.destroy({ children: true }) });
          this.fogs.delete(bz);
        }
      },
    });
  }

  // ------------------------------------------------------------------ selection
  private select(n: StageNode) {
    sfx('paper');
    this.closeCard();
    if (n.state === 'locked') {
      gsap.fromTo(n, { x: n.x - 6 }, { x: n.x, duration: 0.35, ease: 'elastic.out(1,0.3)' });
    }
    const card = new StageCard(n.zone, n.stage, {
      onClose: () => this.closeCard(),
      onQuick: async () => {
        this.closeCard();
        const { playQuickAssault } = await import('../panels/campaign/QuickAssault');
        await playQuickAssault(n.zone, n.stage);
        this.refresh();
      },
    });
    const gp = this.toLocal(n.getGlobalPosition());
    const rr = n.r * this.cam.s;
    const right = gp.x < W / 2;
    const cx = right ? gp.x + rr + 26 : gp.x - rr - 26 - card.cw;
    const cy = Math.max(110, Math.min(H - card.ch - 20, gp.y - card.ch / 2));
    card.position.set(Math.max(12, Math.min(W - card.cw - 12, cx)), cy);
    this.overlay.addChild(card);
    card.show();
    this.card = card;
    for (const m of this.nodes.values()) m.ring.alpha = m === n ? 1 : 0.6;
    // highlight ring
    const hl = new Graphics().circle(0, 0, n.r + 16).stroke({ width: 4, color: C.pinkHot });
    hl.position.set(n.x, n.y);
    this.chart.addChild(hl);
    card.on('destroyed', () => hl.destroy());
  }

  private closeCard() {
    if (!this.card) return;
    const c = this.card;
    this.card = null;
    c.hide();
  }

  override update(dt: number) {
    this.t += dt;
    this.hud?.update(dt);
    this.night.update(dt);
    // frontier pulse (on twos)
    const step = Math.floor(this.t * 12) / 12;
    for (const n of this.nodes.values()) {
      if (n.isFrontier) {
        n.ring.scale.set(1 + 0.12 * (0.5 + 0.5 * Math.sin(step * 5)));
        n.ring.alpha = 0.5 + 0.5 * Math.cos(step * 5);
      }
    }
    if (!this.markerMoving) {
      this.marker.position.y = this.markerBase[1] + Math.sin(step * 2.4) * 3;
      this.marker.rotation = Math.sin(step * 1.7) * 0.06;
    }
  }
}
