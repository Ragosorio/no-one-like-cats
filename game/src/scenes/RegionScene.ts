/**
 * Parte II — a 3D region of the Rupturas (Páginas Hundidas, Isla Nácar, the reflection cinematic…).
 *
 * Two stacked canvases: the region's three.js world renders on its own canvas UNDER the game's Pixi
 * canvas, which turns transparent while this scene is up and keeps drawing the HUD (name plate, back
 * button, points of interest, dialogs, toasts). Pointer events land on the Pixi canvas: anything that
 * hits Pixi UI stays there, the rest drives the 3D camera. The 3D engine is lazy-loaded with this
 * scene, so Part I players never download it. Leaving the scene disposes the whole world.
 */
import { Container, Graphics } from 'pixi.js';
import * as THREE from 'three';
import { Scene } from '../core/scenes';
import { game } from '../core/App';
import { Button, txt } from '../ui/widgets';
import { C, F } from '../ui/theme';
import { toast } from '../ui/modal';
import { say } from '../ui/dialog';
import { G } from '../state/game';
import { MISSION_BY_ID, CAT_BY_ID } from '../data/content';
import { settings } from '../core/settings';
import { catLiteUrl } from '../art/catArt';
import { catSlug } from '../state/sys/forms';
import { World3D } from '../engine/world/World3D';
import { TIERS, type Tier } from '../engine/core/perf';
import { rng as seeded } from '../engine/core/noise';
import { activities } from '../regions/life';
import { REGION_INFO, type RegionId } from '../regions';
import type { POI, RegionBuild, RegionCtx, RegionDef } from '../regions/types';

const LOADERS: Record<RegionId, () => Promise<{ region: RegionDef }>> = {
  paginas: () => import('../regions/paginas'),
  nacar: () => import('../regions/nacar'),
  reflejo: () => import('../regions/reflejo'),
};

const RARITY_H: Record<string, number> = { common: 2.4, rare: 2.5, epic: 2.7, legendary: 3.1, mythic: 3.2, heroic: 3.0, divine: 3.3 };
const KIND_COLOR: Record<POI['kind'], number> = { battle: C.red, activity: 0xffd23f, lore: C.paper, exit: C.ink };

/** which 3D quality to start with: the player's choice, or a sane default the auto tier refines */
function startTier(): Tier {
  const q = (settings as unknown as { quality3d?: string }).quality3d;
  return q && (TIERS as string[]).includes(q) ? (q as Tier) : 'alto';
}

export class RegionScene extends Scene {
  private world: World3D | null = null;
  private def: RegionDef | null = null;
  private build: RegionBuild | null = null;
  private canvas3d: HTMLCanvasElement | null = null;
  private hud = new Container();
  private markers = new Map<string, { poi: POI; node: Container }>();
  private loading = txt('', { fontFamily: F.poster, fontSize: 44, fill: C.paper });
  private info: Container | null = null;
  private infoT = 0;
  private gone = false;
  private cine: { t: number; shot: number; done: boolean } | null = null;
  private appZ = '';
  private bgAlpha = 1;
  private describe = new Map<string, { title: string; text: string }>();
  private offResize: (() => void) | null = null;

  constructor(readonly regionId: string) {
    super();
    this.bleed = null;
  }

  enter() {
    this.bgAlpha = game.pixi.renderer.background.alpha;
    game.pixi.renderer.background.alpha = 0;
    const appEl = game.pixi.canvas.parentElement as HTMLElement | null;
    if (appEl) {
      this.appZ = appEl.style.zIndex;
      appEl.style.zIndex = '1';
    }
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:0;display:block;background:#0d110f';
    cv.setAttribute('aria-hidden', 'true');
    document.body.prepend(cv);
    this.canvas3d = cv;
    this.loading.anchor.set(0.5);
    this.loading.position.set(960, 540);
    this.loading.text = 'Zarpando…';
    this.addChild(this.hud, this.loading);
    void this.setup();
  }

  private isUiHit = (clientX: number, clientY: number) => {
    const r = game.pixi.canvas.getBoundingClientRect();
    const hit = game.pixi.renderer.events.rootBoundary.hitTest(clientX - r.left, clientY - r.top);
    return !!hit;
  };

  private async setup() {
    const id = this.regionId as RegionId;
    const loader = LOADERS[id];
    if (!loader) {
      this.loading.text = 'Esa isla no existe (todavía).';
      return;
    }
    const { region } = await loader();
    if (this.gone || !this.canvas3d) return;
    this.def = region;
    this.loading.text = `Zarpando hacia ${region.name}…`;
    const cam = region.camera;
    const world = new World3D({
      canvas: this.canvas3d,
      input: game.pixi.canvas,
      isUiHit: this.isUiHit,
      tier: startTier(),
      autoQuality: true,
      reducedMotion: settings.reduceMotion,
      half: region.half,
      height: region.height,
      paint: region.paint,
      walkable: (x, z) => region.walkable(x, z),
      skyKeys: region.skyKeys,
      rupture: region.rupture,
      fog: region.fog,
      camera: { target: new THREE.Vector3(...cam.target), yaw: cam.yaw, pitch: cam.pitch, dist: cam.dist, minDist: cam.minDist, maxDist: cam.maxDist, bound: cam.bound },
      onTierDrop: (t) => toast(`Calidad 3D: ${t.toUpperCase()}`, { sub: 'La bajé para que todo vaya fluido.', dur: 2.5 }),
    });
    this.world = world;
    const onResize = () => world.resize();
    addEventListener('resize', onResize);
    this.offResize = () => removeEventListener('resize', onResize);
    world.hour = region.hour ?? this.realHour();
    world.setWeather(region.weather ?? this.todaysWeather());
    this.spots = this.spotsFor(region, world);
    world.enableLife(activities(this.spots));
    world.rig.onClick = (x, y) => this.pick(x, y);

    const ctx: RegionCtx = {
      world,
      three: THREE,
      rng: seeded(hash(region.id)),
      say: (lines) => say(lines),
      toast: (text, sub) => toast(text, { sub, dur: 3.2 }),
      feature: (name) => G.count(`feature_${name}`),
      flag: (f) => G.flag(f),
      has: (f) => G.has(f),
      activeStory: () => G.s.missions.active.find((m) => MISSION_BY_ID.get(m)?.chain === 'historia') ?? null,
      missionDone: (m) => G.s.missions.done.includes(m),
      describe: this.describe,
      floatText: (p, text) => this.floatAt(p, text),
    };
    this.build = await region.build(ctx);
    if (this.gone) {
      // left while the region was still building: its own resources would otherwise leak
      this.build.dispose?.();
      return;
    }
    if (!region.cinematic) await this.addVisitors(region);
    this.syncHomes();
    world.warmup();
    this.removeChild(this.loading);
    if (region.cinematic) this.startCinematic(region);
    else {
      this.drawHud(region);
      G.count(`feature_region_${region.id}`);
      if (!G.has(`region_visited:${region.id}`)) G.flag(`region_visited:${region.id}`);
    }
  }

  private realHour() {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  }

  /** the day's weather is the same all day (seeded by the date): mostly clear, sometimes rain */
  private todaysWeather(): 'despejado' | 'lluvia' | 'tormenta' {
    const d = new Date();
    const r = seeded(d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate())();
    return r < 0.06 ? 'tormenta' : r < 0.24 ? 'lluvia' : 'despejado';
  }

  /**
   * Where the region's cats belong: every resident's home (filled as they arrive, so wandering and
   * naps return there instead of drifting across the island), the shoreline (marched from the
   * center outward, for swimmers) and shelters (homes + the arrival beach).
   */
  private spots: ReturnType<RegionScene['spotsFor']> | null = null;
  private homesFor = 0;
  private spotsFor(region: RegionDef, w: World3D) {
    const a = new THREE.Vector3(...region.arrival);
    const shore: THREE.Vector3[] = [];
    for (let k = 0; k < 32; k++) {
      const ang = (k / 32) * Math.PI * 2;
      let last: THREE.Vector3 | null = null;
      for (let d = 4; d < region.half; d += 0.8) {
        const x = Math.cos(ang) * d;
        const z = Math.sin(ang) * d;
        if (region.walkable(x, z)) last = new THREE.Vector3(x, w.heightAt(x, z), z);
        else if (last && w.heightAt(x, z) < 0.2) break;
      }
      if (last) shore.push(last);
    }
    return { home: {} as Record<string, THREE.Vector3>, shelters: [a.clone()], shore: shore.length ? shore : [a.clone()], iceCenter: a.clone(), cosmic: a.clone(), lava: a.clone() };
  }
  /** every resident (region locals and visitors) gets a home it returns to */
  private syncHomes() {
    const sp = this.spots;
    const w = this.world;
    if (!sp || !w) return;
    for (const [id, r] of w.residents) {
      if (sp.home[id]) continue;
      sp.home[id] = r.opts.home.clone();
      if (sp.shelters.length < 12) sp.shelters.push(r.opts.home.clone());
    }
  }

  /** Canelo always comes ashore (in his active form) with two of your strongest cats */
  private async addVisitors(region: RegionDef) {
    const w = this.world!;
    const mine = [...G.s.cats];
    const canelo = mine.find((c) => c.species === 'c_canelo');
    const crew = mine.filter((c) => c !== canelo).sort((p, q) => (q.stars ?? 0) - (p.stars ?? 0) || (q.level ?? 0) - (p.level ?? 0)).slice(0, 2);
    const visitors = [canelo, ...crew].filter((c): c is NonNullable<typeof c> => !!c);
    const base = new THREE.Vector3(...region.arrival);
    await Promise.all(
      visitors.map(async (c, i) => {
        const def = CAT_BY_ID.get(c.species);
        if (!def) return;
        const slug = catSlug(c);
        const home = base.clone().add(new THREE.Vector3(Math.cos(i * 2.1) * 2.5, 0, Math.sin(i * 2.1) * 2.5));
        home.y = w.heightAt(home.x, home.z);
        const id = `visit_${c.uid}`;
        const tags = [...def.elements];
        if (c.species === 'c_canelo') tags.push('canelo');
        await w.addResident({ id, name: c.name || def.name, slug, url: catLiteUrl(slug), height: c.species === 'c_canelo' ? 2.6 : RARITY_H[def.rarity] ?? 2.5, home, tags, traits: { playful: 0.6, curious: 0.8 } });
        this.describe.set(id, { title: c.name || def.name, text: c.species === 'c_canelo' ? 'Tu gato. Vino porque había comida. Él dice que vino a protegerte.' : 'Tu tripulación. Bajó a estirar las patas.' });
      }),
    );
  }

  // ------------------------------------------------------------------ HUD
  private drawHud(region: RegionDef) {
    const v = game.view;
    const plate = new Container();
    const name = txt(region.name.toUpperCase(), { fontFamily: F.poster, fontSize: 40, fill: C.ink });
    const sub = txt(region.subtitle, { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.ink });
    sub.y = 46;
    const bw = Math.max(name.width, sub.width) + 40;
    const bg = new Graphics().roundRect(-20, -14, bw, 92, 14).fill({ color: C.paper, alpha: 0.94 }).stroke({ width: 3, color: C.ink });
    plate.addChild(bg, name, sub);
    plate.position.set(v.x + 40, v.y + 34);
    const back = new Button('VOLVER A LA CARTA', () => void import('../app/flow').then((f) => f.goMap()), { w: 320, h: 64, size: 24, color: C.paper });
    back.position.set(v.x + v.w - 360, v.y + 30);
    this.hud.addChild(plate, back);
    for (const poi of this.build?.pois ?? []) this.addMarker(poi);
    if (region.battleSpot) this.addMarker(this.battlePoi(region));
  }

  /** the generic story-battle marker: shows when the active story mission fights here */
  private battlePoi(region: RegionDef): POI {
    const battleNow = () => {
      for (const m of G.s.missions.active) {
        const def = MISSION_BY_ID.get(m);
        const b = (def?.goal as { battle?: string } | undefined)?.battle;
        if (b && REGION_INFO[region.id].battles.includes(b) && (region.battleGate?.(b) ?? true)) return b;
      }
      return null;
    };
    return {
      id: 'battle',
      pos: new THREE.Vector3(...region.battleSpot!),
      label: '¡A PELEAR!',
      kind: 'battle',
      visible: () => !!battleNow(),
      onTap: async () => {
        const b = battleNow();
        if (!b) return;
        const { startStoryBattle } = await import('../app/storyFlow');
        await startStoryBattle(b);
      },
    };
  }

  private addMarker(poi: POI) {
    const node = new Container();
    const label = txt(poi.label, { fontFamily: F.poster, fontSize: 26, fill: poi.kind === 'exit' ? C.paper : C.ink });
    label.anchor.set(0.5);
    const w = label.width + 36;
    const col = KIND_COLOR[poi.kind];
    const g = new Graphics()
      .roundRect(-w / 2 + 4, -22 + 5, w, 44, 22)
      .fill({ color: C.ink, alpha: 0.85 })
      .roundRect(-w / 2, -22, w, 44, 22)
      .fill(col)
      .stroke({ width: 3, color: C.ink })
      .moveTo(-10, 22)
      .lineTo(0, 36)
      .lineTo(10, 22)
      .fill(col);
    node.addChild(g, label);
    node.eventMode = 'static';
    node.cursor = 'pointer';
    node.on('pointertap', () => void poi.onTap());
    node.visible = false;
    this.hud.addChild(node);
    this.markers.set(poi.id, { poi, node });
  }

  private pick(x: number, y: number) {
    const w = this.world;
    if (!w || this.cine) return;
    const hit = w.pickResident(x, y);
    if (!hit) return;
    hit.cat.brain.emote('surprise', 0.5);
    w.rig.follow = () => hit.cat.root.position.clone().add(new THREE.Vector3(0, hit.cat.lift + 1.2, 0));
    w.rig.focus(hit.cat.root.position, 12, 0.32);
    const d = this.describe.get(hit.id);
    if (d) this.showInfo(d.title, d.text);
  }

  private showInfo(title: string, text: string) {
    this.info?.destroy({ children: true });
    const v = game.view;
    const c = new Container();
    const t = txt(title.toUpperCase(), { fontFamily: F.poster, fontSize: 34, fill: C.ink });
    const b = txt(text, { fontFamily: F.ui, fontWeight: '700', fontSize: 20, fill: C.ink, wordWrap: true, wordWrapWidth: 520, lineHeight: 27 });
    b.y = 46;
    const bg = new Graphics().roundRect(-24, -18, 568, b.y + b.height + 40, 16).fill({ color: C.paper, alpha: 0.96 }).stroke({ width: 3, color: C.ink });
    c.addChild(bg, t, b);
    c.position.set(v.x + 40, v.y + v.h - (b.y + b.height + 70));
    this.hud.addChild(c);
    this.info = c;
    this.infoT = 7;
  }

  private floatAt(p: THREE.Vector3, text: string) {
    const w = this.world;
    if (!w) return;
    const s = w.project(p);
    if (!s) return;
    const t = txt(text, { fontFamily: F.poster, fontSize: 30, fill: C.paper, stroke: { color: C.ink, width: 6 } });
    t.anchor.set(0.5);
    const lp = this.toLogical(s.x, s.y);
    t.position.set(lp.x, lp.y);
    this.hud.addChild(t);
    let life = 1.6;
    const tick = (dt: number) => {
      life -= dt;
      t.y -= dt * 40;
      t.alpha = Math.min(1, life);
      if (life <= 0) {
        this.floaters.delete(tick);
        t.destroy();
      }
    };
    this.floaters.add(tick);
  }
  private floaters = new Set<(dt: number) => void>();

  private toLogical(cssX: number, cssY: number) {
    return { x: (cssX - game.root.x) / game.scale, y: (cssY - game.root.y) / game.scale };
  }

  // ------------------------------------------------------------------ cinematic
  private startCinematic(region: RegionDef) {
    const v = game.view;
    const skip = new Button('SALTAR »', () => this.endCinematic(), { w: 200, h: 60, size: 24, color: C.paper });
    skip.position.set(v.x + v.w - 240, v.y + v.h - 100);
    this.hud.addChild(skip);
    this.cine = { t: 0, shot: -1, done: false };
    void region;
  }

  private endCinematic() {
    if (!this.cine || this.cine.done) return;
    this.cine.done = true;
    void import('../app/flow').then((f) => f.goIsland());
  }

  update(dt: number) {
    const w = this.world;
    if (!w) return;
    if (!this.def?.hour && !this.cine) w.hour = this.realHour();
    if (this.cine && this.def?.cinematic && !this.cine.done) {
      const c = this.cine;
      c.t += dt;
      const shots = this.def.cinematic.shots;
      while (c.shot + 1 < shots.length && shots[c.shot + 1].at <= c.t) {
        c.shot++;
        const s = shots[c.shot];
        w.rig.focus(new THREE.Vector3(...s.target), s.dist, s.pitch, s.yaw);
        if (s.cut) w.rig.cut();
        if (s.lines) void say(s.lines);
      }
      if (c.t >= this.def.cinematic.duration) this.endCinematic();
    }
    if (w.residents.size !== this.homesFor) {
      this.homesFor = w.residents.size;
      this.syncHomes();
    }
    w.frame(dt);
    this.build?.update?.(dt, w.time);
    for (const f of this.floaters) f(dt);
    if (this.info && (this.infoT -= dt) <= 0) {
      this.info.destroy({ children: true });
      this.info = null;
    }
    for (const { poi, node } of this.markers.values()) {
      const show = poi.visible();
      const s = show ? w.project(poi.pos) : null;
      node.visible = !!s;
      if (!s) continue;
      const lp = this.toLogical(s.x, s.y);
      node.position.set(lp.x, lp.y - 30 + Math.sin(w.time * 2.4 + lp.x * 0.01) * 6);
    }
  }

  exit() {
    this.gone = true;
    this.offResize?.();
    this.build?.dispose?.();
    this.world?.dispose();
    this.world = null;
    this.canvas3d?.remove();
    this.canvas3d = null;
    game.pixi.renderer.background.alpha = this.bgAlpha;
    const appEl = game.pixi.canvas.parentElement as HTMLElement | null;
    if (appEl) appEl.style.zIndex = this.appZ;
    this.floaters.clear();
  }
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
