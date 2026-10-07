/**
 * Sea map / stage selection — DIARIO DEL MAR: an engraved nautical chart printed on aged newspaper.
 * 6 zones as islands, 9 stages each along a dotted route (elite shield at 5, boss skull at 9),
 * future zones under "???" fog. Tap a stage → clipping card with honest odds and loot.
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

  override enter() {
    // ---------- paper & chart
    const paper = new TilingSprite({ texture: paperTexture(P.aged, 512, 1.5), width: W, height: H });
    const blocker = new Graphics().rect(0, 0, W, H).fill({ color: 0xffffff, alpha: 0.001 });
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
    // vignette on top of the chart
    const vig = new Sprite(vignetteTexture());
    vig.width = W;
    vig.height = H;
    vig.eventMode = 'none';
    this.addChild(vig);
    this.buildMasthead();
    // marker
    const b = boat(C.pink);
    this.marker.addChild(b);
    this.chart.addChild(this.marker);
    this.hud = new Hud({
      mode: 'map',
      // story battles (Heraldo, Grieta, Barco del Vacío, Patito…) launch straight from their mission
      onGoal: (m) => {
        const g = m.goal as { battle?: unknown };
        if (typeof g.battle === 'string' && g.battle in STORY_BATTLES) void startStoryBattle(g.battle);
        else void import('../panels/Missions').then((x) => x.openMissions());
      },
    });
    this.addChild(this.hud, this.overlay);

    refreshQuickAssaultFlag();
    for (const sp of claimPendingBossCats()) toast(`¡${catName(sp)} se unió a tu isla!`, { icon: 'paw', sub: 'Un primordial no se queda esperando' });
    this.refresh();
    const f = frontier();
    const focus = campaignMemo.justUnlocked ? Number(campaignMemo.justCleared?.split('-')[0] ?? f.zone) : f.zone;
    this.focusZone(focus, false);
    window.addEventListener('wheel', this.onWheel, { passive: false });
    this.introAnim();
  }

  override exit() {
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
    const minX = W - 1896 * s - m;
    const maxX = -24 * s + m;
    const minY = H - 1066 * s - m;
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
    const rule = doubleRule(W, C.ink, 3);
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
