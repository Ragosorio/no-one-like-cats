/**
 * IslandScene — the "Dragon City" half: an isometric cozy archipelago that feels alive.
 * Home + 8 expansions (paper veil + aspirational prices), habitats with cats and gold buffers,
 * the fishing dock, fixed buildings (Santuario, Puerto, Altar, Mesa, Faro) and the HUD.
 */
import '../island/safety';
import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import gsap from 'gsap';
import { Scene } from '../core/scenes';
import { W, H } from '../core/App';
import { music } from '../core/music';
import { sfx } from '../core/audio';
import { fmt } from '../core/format';
import { C, F } from '../ui/theme';
import { toast } from '../ui/modal';
import { G, Habitat } from '../state/game';
import { EXPANSIONS, MissionDef } from '../data/content';
import { HOME, collect, collectAll, expansionState, harvest, regionsUnlocked, habitatPlots, farmPlots } from '../state/sys/island';
import { checkMissions } from '../state/sys/missions';
import {
  caneloAsleep,
  catLevelScale,
  featureUnlocked,
  habitatAt,
  habitatFull,
  homelessCats,
  hudUnlocks,
  missionActive,
  regionLook,
  wakeCat,
} from '../state/ext/island';
import { preloadCats, elementFx, catTexture } from '../art/catArt';
import { slugOf } from '../art/tint';
import { glowTexture } from '../art/textures';
import { floatText, onomatopoeia, sparkles, flash, Shaker } from '../fx/juice';
import { Particles } from '../fx/particles';
import { goMap } from '../app/flow';
import { openSanctuary } from '../panels/Sanctuary';
import { openShipyard } from '../panels/Shipyard';
import { openAltar } from '../panels/Altar';
import { openCatPanel } from '../panels/CatPanel';
import { openMissions } from '../panels/Missions';
import { openCatdex } from '../panels/Catdex';
import { Hud } from '../ui/hud/Hud';
import { TweenBag } from '../ui/hud/tweenBag';
import { islandPlan, IslandPlan, Spot } from '../island/layout';
import { TerrainView, DROP } from '../island/terrain';
import { SeaView } from '../island/sea';
import { IslandCamera } from '../island/camera';
import { isoToScreen } from '../island/iso';
import { decorArt } from '../island/decorArt';
import { Ambient } from '../island/ambient';
import { sanctuaryParts, portArt, boatArt, altarArt, mesaArt, lighthouseArt, emptyBoxArt, centerOf, plate } from '../island/buildingArt';
import { ClockBubble, TagBubble } from '../island/worldUi';
import { CatActor, Area } from '../island/catActor';
import { PlotView } from '../island/views/PlotView';
import { FarmView } from '../island/views/FarmView';
import { ExpansionView } from '../island/views/ExpansionView';
import type { IslandCtx } from '../island/views/ctx';
import { openHabitatPanel } from '../panels/island/HabitatPanel';
import { openBuildMenu } from '../panels/island/BuildMenu';
import { openDock } from '../panels/island/DockPanel';
import { openExpansionPanel } from '../panels/island/ExpansionPanel';
import { openPopMenu } from '../panels/island/PopMenu';

/** dev: synthesize a tap at logical (1920×1080) coords — used for automated testing */
function devTap(lx: number, ly: number, holdMs = 40) {
  return new Promise<boolean>((res) => {
    const c = document.querySelector('canvas')!;
    const r = c.getBoundingClientRect();
    const s = Math.min(r.width / W, r.height / H);
    const o = { clientX: r.left + (r.width - W * s) / 2 + lx * s, clientY: r.top + (r.height - H * s) / 2 + ly * s, pointerId: 1, isPrimary: true, button: 0, buttons: 1, pointerType: 'mouse', bubbles: true };
    c.dispatchEvent(new PointerEvent('pointerdown', o));
    setTimeout(() => {
      c.dispatchEvent(new PointerEvent('pointerup', { ...o, buttons: 0 }));
      res(true);
    }, holdMs);
  });
}

export class IslandScene extends Scene {
  private sea = new SeaView();
  private worldRoot = new Container();
  private world = new Container();
  private terrain!: TerrainView;
  private ground = new Container();
  private objects = new Container();
  private bubbles = new Container();
  private wfx = new Container();
  private screenFx = new Container();
  private cam!: IslandCamera;
  hud!: Hud;
  private plan: IslandPlan = islandPlan();
  private bag = new TweenBag();
  private ctx!: IslandCtx;
  private plots: PlotView[] = [];
  private farms: FarmView[] = [];
  private expansions: ExpansionView[] = [];
  private cats = new Map<string, CatActor>();
  private parts!: Particles;
  private ambient!: Ambient;
  private shaker!: Shaker;
  private lookSig = '';
  private syncAcc = 0;
  private unsub: (() => void)[] = [];
  // fixed buildings
  private sanctuary!: { c: Container; portal: Container; ready: TagBubble; clock: ClockBubble; top: number };
  private port!: Container;
  private boat!: Container;
  private boatBase = { x: 0, y: 0 };
  private altar!: { c: Container; orbs: Graphics[]; anchor: { x: number; y: number } };
  private mesa!: Container;
  private beam!: Sprite;
  private homeBox!: Container;
  private nameTag: TagBubble | null = null;
  private loadingSlugs = new Set<string>();
  private t = 0;
  private ready = false;

  override enter() {
    music.play('island');
    // layers
    const hitBg = new Graphics().rect(-20000, -20000, 40000, 40000).fill({ color: 0, alpha: 0.001 });
    this.world.addChild(hitBg);
    this.addChild(this.sea, this.worldRoot, this.screenFx);
    this.worldRoot.addChild(this.world);
    const rb = Object.fromEntries(this.plan.regions.map((r) => [r.id, r.biome]));
    this.terrain = new TerrainView(this.plan.tiles, rb);
    this.objects.sortableChildren = true;
    this.parts = new Particles();
    this.world.addChild(this.terrain, this.ground, this.objects, this.wfx, this.bubbles, this.parts);
    this.cam = new IslandCamera(this.world, this.worldRoot);
    this.cam.onChange = () => this.sea.follow(this.world.x, this.world.y, this.cam.zoom);
    this.shaker = new Shaker(this.worldRoot, 14, 0.01);
    this.setBounds();
    this.ambient = new Ambient(this.plan.tiles, this.cam.bounds, this.bag);
    this.world.addChild(this.ambient);
    const home = this.plan.plans.get(HOME)!;
    const hc = isoToScreen(home.center.gx, home.center.gy);
    this.cam.lookAt(hc.x - 230, hc.y + 30, false, 0.7);
    this.ctx = {
      ground: this.ground,
      objects: this.objects,
      bubbles: this.bubbles,
      wfx: this.wfx,
      cam: this.cam,
      bag: this.bag,
      tapOk: () => !this.cam.wasDrag,
    };
    // HUD
    this.hud = new Hud({ mode: 'island', onGoal: (m) => this.goToGoal(m), onCollectAll: () => this.collectAllFx() });
    this.addChildAt(this.hud, this.children.indexOf(this.screenFx));
    // static world
    this.buildDecor();
    this.buildFixed();
    this.buildPlots();
    this.redrawTerrain(true);
    // cats (textures first)
    const slugs = [...new Set([...G.s.cats.map((c) => slugOf(c.species)), 'canelo_cozy_cat', 'margarita_daisy_cat'])];
    preloadCats(slugs).then(() => {
      if (this.destroyed) return;
      this.ready = true;
      this.syncAll();
    });
    // events
    this.unsub.push(
      G.on('timerDone', (t) => {
        if (t.kind === 'expansion') this.expansionCleared(Number(t.ref));
        if (t.kind === 'build') this.buildDone(t.ref);
        if (t.kind === 'habitat_upgrade') this.upgradeDone(t.ref);
        this.syncAll();
      }),
      G.on('catAdded', () => this.syncAll()),
      G.on('res', (r) => {
        if (r.key === 'gold') this.plots.forEach((p) => p.refreshPrice());
      }),
      G.on('catLevel', () => this.syncCats()),
    );
    (globalThis as unknown as { __island: IslandScene }).__island = this;
    (globalThis as unknown as { __islandDev: unknown }).__islandDev = { openHabitatPanel, openBuildMenu, openDock, openExpansionPanel, openMissions, openCatPanel, tapL: devTap, gsap, step: (n = 20) => {
      for (let i = 0; i < n; i++) this.update(0.05);
    } };
  }

  override exit() {
    this.unsub.forEach((f) => f());
    this.bag.killAll();
    this.cam.destroy();
    this.shaker.destroy();
    for (const c of this.cats.values()) c.destroy();
    this.cats.clear();
    gsap.killTweensOf(this.wfx.children);
  }

  // ================================================================== world construction
  private setBounds() {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const t of this.plan.tiles.values()) {
      const p = isoToScreen(t.gx, t.gy);
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    this.cam.bounds = { minX: minX + 200, maxX: maxX - 200, minY: minY + 100, maxY: maxY - 60 };
  }

  /** sandy stepping-stone paths from every home building to a little plaza (cozy structure) */
  private buildPaths() {
    const hp = this.plan.home;
    const home = this.plan.plans.get(HOME)!;
    const occupied = new Set<string>();
    const mark = (s: Spot) => {
      for (let y = Math.floor(s.gy); y < s.gy + s.h; y++) for (let x = Math.floor(s.gx); x < s.gx + s.w; x++) occupied.add(`${x},${y}`);
    };
    [hp.sanctuary, hp.port, hp.altar, hp.mesa, hp.lighthouse, ...home.habitats].forEach(mark);
    // hub = free land tile nearest to the island center
    let hub = { x: Math.round(home.center.gx), y: Math.round(home.center.gy) };
    let bd = Infinity;
    for (const t of home.tiles) {
      const k = `${t.gx},${t.gy}`;
      if (occupied.has(k)) continue;
      const d = Math.hypot(t.gx - home.center.gx, t.gy - home.center.gy);
      if (d < bd) {
        bd = d;
        hub = { x: t.gx, y: t.gy };
      }
    }
    const doors: { x: number; y: number }[] = [
      { x: hp.sanctuary.gx + 1, y: hp.sanctuary.gy + 3 },
      { x: hp.port.gx + 1, y: hp.port.gy - 1 },
      { x: hp.altar.gx + 2, y: hp.altar.gy + 1 },
      { x: hp.mesa.gx - 1, y: hp.mesa.gy + 1 },
      ...home.habitats.map((h) => ({ x: h.gx + 1, y: h.gy + h.h })),
    ];
    const g = new Graphics();
    const stones: { x: number; y: number }[] = [];
    for (const d of doors) {
      // L-shaped walk: along x then along y, in half-tile steps
      let x = d.x;
      let y = d.y;
      const pts: { x: number; y: number }[] = [];
      const stepTo = (tx: number, ty: number) => {
        let guard = 0;
        while ((Math.abs(x - tx) > 0.01 || Math.abs(y - ty) > 0.01) && guard++ < 80) {
          if (Math.abs(x - tx) > 0.01) x += Math.sign(tx - x) * 0.5;
          else y += Math.sign(ty - y) * 0.5;
          pts.push({ x, y });
        }
      };
      stepTo(hub.x, d.y);
      stepTo(hub.x, hub.y);
      for (const p of pts) {
        const k = `${Math.round(p.x)},${Math.round(p.y)}`;
        if (occupied.has(k) || !this.plan.tiles.has(k)) continue;
        if (stones.some((s) => Math.abs(s.x - p.x) < 0.3 && Math.abs(s.y - p.y) < 0.3)) continue;
        stones.push(p);
      }
    }
    for (const st of stones) {
      const p = isoToScreen(st.x, st.y);
      const j = ((st.x * 13 + st.y * 7) % 3) - 1;
      g.ellipse(p.x + j * 4, p.y + 2, 22, 10).fill({ color: 0x8a6a42, alpha: 0.25 });
      g.ellipse(p.x + j * 4, p.y, 20, 9).fill(0xf2e2bd).stroke({ width: 2, color: C.ink, alpha: 0.45 });
    }
    // plaza ring around the hub
    const hc = isoToScreen(hub.x, hub.y);
    g.ellipse(hc.x, hc.y, 70, 34).fill({ color: 0xf2e2bd, alpha: 0.9 }).stroke({ width: 3, color: C.ink, alpha: 0.5 });
    g.ellipse(hc.x, hc.y, 40, 19).stroke({ width: 2, color: C.ink, alpha: 0.25 });
    this.ground.addChild(g);
    this.pathStones = stones;
  }
  private pathStones: { x: number; y: number }[] = [];

  private buildDecor() {
    this.buildPaths();
    for (const p of this.plan.plans.values())
      for (const d of p.decor) {
        if (this.pathStones.some((st) => Math.abs(st.x - d.gx) < 0.7 && Math.abs(st.y - d.gy) < 0.7)) continue;
        const c = decorArt(d.kind, d.v);
        const s = isoToScreen(d.gx, d.gy);
        c.position.set(s.x, s.y);
        c.zIndex = d.gx + d.gy;
        (c as Container & { region?: string }).region = p.def.id;
        c.label = `decor:${p.def.id}`;
        this.objects.addChild(c);
      }
  }

  private place(c: Container, s: Spot, zExtra = 0) {
    const p = isoToScreen(s.gx, s.gy);
    c.position.set(p.x, p.y);
    c.zIndex = s.gx + s.gy + (s.w + s.h) / 2 - 1 + zExtra;
    this.objects.addChild(c);
    return p;
  }

  private clickable(c: Container, onTap: () => void) {
    c.eventMode = 'static';
    c.cursor = 'pointer';
    c.on('pointertap', () => {
      if (this.cam.wasDrag) return;
      gsap.fromTo(c.scale, { x: 1.05, y: 0.95 }, { x: 1, y: 1, duration: 0.4, ease: 'elastic.out(1.2,0.4)' });
      onTap();
    });
  }

  private buildFixed() {
    const hp = this.plan.home;
    // ---- Santuario
    const sp = sanctuaryParts(3, 3);
    const spos = this.place(sp.c, hp.sanctuary);
    const ready = new TagBubble('¡LISTA!', { icon: 'star', color: C.pinkHot, textColor: C.paper, size: 26 });
    const clock = new ClockBubble(28);
    const ctr = centerOf(3, 3);
    ready.position.set(spos.x + ctr.x, spos.y + sp.top + 10);
    clock.position.set(spos.x + ctr.x + 110, spos.y + sp.top + 40);
    const sl = plate('SANTUARIO', C.lilac, 22);
    sl.position.set(spos.x + ctr.x, spos.y + ctr.y + 34);
    this.bubbles.addChild(ready, clock, sl);
    this.sanctuary = { c: sp.c, portal: sp.portal, ready, clock, top: sp.top };
    this.clickable(sp.c, () => openSanctuary());
    // ---- Puerto + Balsa
    const facing: 'x' | 'y' = hp.boat.gy > hp.port.gy + 2 ? 'y' : 'x';
    const pa = portArt(facing, 3, 3);
    const ppos = this.place(pa.c, hp.port);
    this.port = pa.c;
    const pl = plate('PUERTO', C.paper, 22);
    const pctr = centerOf(3, 3);
    pl.position.set(ppos.x + pctr.x, ppos.y + pctr.y + 38);
    this.bubbles.addChild(pl);
    this.clickable(pa.c, () => this.portMenu());
    this.boat = boatArt();
    const bc = isoToScreen(hp.boat.gx + 0.5, hp.boat.gy + 0.5);
    this.boatBase = { x: bc.x, y: bc.y + DROP };
    this.boat.position.set(this.boatBase.x, this.boatBase.y);
    this.boat.zIndex = hp.boat.gx + hp.boat.gy + 2;
    if (facing === 'x') this.boat.scale.x = -1;
    this.objects.addChild(this.boat);
    this.clickable(this.boat, () => this.portMenu());
    // ---- Altar (appears with altar_almas)
    const al = altarArt();
    const apos = this.place(al.c, hp.altar);
    const orbs: Graphics[] = [];
    for (let i = 0; i < 3; i++) {
      const g = new Graphics().circle(0, 0, 9).fill([C.violet, C.mint, C.pinkHot][i]).stroke({ width: 2.5, color: C.ink });
      g.circle(-3, -3, 3).fill({ color: 0xffffff, alpha: 0.6 });
      al.c.addChild(g);
      orbs.push(g);
    }
    this.altar = { c: al.c, orbs, anchor: al.orbAnchor };
    const alp = plate('ALTAR DE ALMAS', C.lilac, 18);
    alp.position.set(apos.x + centerOf(2, 2).x, apos.y + centerOf(2, 2).y + 30);
    alp.label = 'altarPlate';
    this.bubbles.addChild(alp);
    this.clickable(al.c, () => openAltar());
    // ---- Mesa del Gato (after boss 1)
    this.mesa = mesaArt();
    this.place(this.mesa, hp.mesa);
    this.clickable(this.mesa, () => {
      sfx('sting');
      toast('MESA DEL GATO: Próximamente', { sub: 'Cat’s Gambit abre muy pronto. Ve juntando valor.', color: 0xffd7d0 });
    });
    // ---- Faro
    const lh = lighthouseArt();
    const lpos = this.place(lh.c, hp.lighthouse);
    this.beam = new Sprite(glowTexture());
    this.beam.anchor.set(0.5);
    this.beam.tint = C.yellow;
    this.beam.alpha = 0.55;
    this.beam.scale.set(1.2, 0.8);
    this.beam.position.set(lpos.x + lh.lamp.x, lpos.y + lh.lamp.y);
    this.beam.blendMode = 'add';
    this.wfx.addChild(this.beam);
    this.clickable(lh.c, () => {
      sfx('pop', 0.8);
      floatText(this.wfx, lpos.x, lpos.y - 200, 'El faro mira al Primer Mar…', { size: 26, color: C.paper, font: F.ui, rise: 50, dur: 1.6 });
    });
    // homeless box
    this.homeBox = emptyBoxArt();
    this.objects.addChild(this.homeBox);
    this.homeBox.visible = false;
  }

  private buildPlots() {
    for (const p of this.plan.plans.values()) {
      p.habitats.forEach((s, i) => this.plots.push(new PlotView(p.def.id, i, s, this.ctx, (v) => this.onPlotTap(v))));
      p.farms.forEach((s) => this.farms.push(new FarmView(s, this.ctx, (v) => this.onFarmTap(v))));
      if (p.def.id !== HOME) this.expansions.push(new ExpansionView(p, this.ctx, (n) => openExpansionPanel(n, () => this.focusRegion(n))));
    }
    // farm views map to state farms by (region, plot index)
  }

  /** regions whose reveal is held back until the T2 celebration (land colors in with the flash) */
  private revealHold = new Set<string>();
  private look = (r: string) => (this.revealHold.has(r) ? 'clearing' : regionLook(r));

  private redrawTerrain(force = false) {
    const sig = this.plan.regions.map((r) => this.look(r.id)).join(',');
    if (!force && sig === this.lookSig) return;
    this.lookSig = sig;
    this.terrain.redraw(this.look);
    this.terrain.drawBridges(this.plan.regions, this.look);
    // decor only on open regions (veiled land is blank paper)
    for (const c of this.objects.children) {
      if (!c.label?.startsWith('decor:')) continue;
      const reg = c.label.slice(6);
      c.visible = this.look(reg) === 'open';
    }
  }

  // ================================================================== sync with state
  private syncAll() {
    this.redrawTerrain();
    const unlocked = new Set(regionsUnlocked().filter((r) => !this.revealHold.has(r)));
    for (const v of this.plots) {
      const active = unlocked.has(v.region) && v.plot < habitatPlots(v.region);
      v.sync(active, active ? habitatAt(v.region, v.plot) : null);
    }
    // farms: state farms are (region, plot)
    for (const p of this.plan.plans.values()) {
      const views = this.farms.filter((f) => p.farms.includes(f.spot));
      views.forEach((v, i) => {
        const active = unlocked.has(p.def.id) && i < farmPlots(p.def.id);
        const f = G.s.farms.find((x) => x.region === p.def.id && x.plot === i) ?? null;
        v.sync(active, f);
      });
    }
    for (const e of this.expansions) e.sync(expansionState(e.n));
    // fixed building visibility
    const u = hudUnlocks();
    this.altar.c.visible = u.altar;
    const ap = this.bubbles.children.find((c) => c.label === 'altarPlate');
    if (ap) ap.visible = u.altar;
    this.mesa.visible = u.mesa;
    this.syncCats();
  }

  private habitatArea(h: Habitat): Area | null {
    const v = this.plots.find((p) => p.region === h.region && p.plot === h.plot);
    return v ? v.catArea() : null;
  }

  private homelessArea(): Area {
    // near the first free plot in home (Brote waits next to the empty plot with a box)
    const free = this.plots.find((p) => p.active && !p.habitat);
    const s = free?.spot ?? this.plan.home.mesa;
    return { x0: s.gx + s.w - 1.5, y0: s.gy + s.h - 1.25, w: 0.7, h: 0.5 };
  }

  private syncCats() {
    if (!this.ready) return;
    const seen = new Set<string>();
    const homeless = homelessCats();
    const ha = this.homelessArea();
    for (const c of G.s.cats) {
      seen.add(c.uid);
      const h = c.habitat ? G.s.habitats.find((x) => x.id === c.habitat) : null;
      const area = (h && this.habitatArea(h)) || ha;
      let a = this.cats.get(c.uid);
      if (!a) {
        // new cat (e.g. from the Sanctuary): load its painting first, never show a white box
        const slug = slugOf(c.species);
        if (catTexture(slug) === Texture.WHITE) {
          if (!this.loadingSlugs.has(slug)) {
            this.loadingSlugs.add(slug);
            preloadCats([slug]).then(() => {
              this.loadingSlugs.delete(slug);
              if (!this.destroyed) this.syncCats();
            });
          }
          continue;
        }
        a = new CatActor(c.uid, c.species, area, this.wfx);
        this.objects.addChild(a);
        this.cats.set(c.uid, a);
        a.on('pointertap', () => {
          if (this.cam.wasDrag) return;
          this.onCatTap(c.uid);
        });
        (a as CatActor & { habId?: string | null }).habId = c.habitat;
      }
      const prevHab = (a as CatActor & { habId?: string | null }).habId;
      if (prevHab !== c.habitat) {
        (a as CatActor & { habId?: string | null }).habId = c.habitat;
        a.setArea(area, true);
        if (c.habitat) {
          a.happy();
          const p = isoToScreen(a.gx, a.gy);
          floatText(this.wfx, p.x, p.y - 120, '¡MI CASA!', { size: 34, color: C.mint });
        }
      } else if (!h) a.area = ha;
      a.setLevel(c.level, catLevelScale(c.level));
      const mood = caneloAsleep(c) ? 'boxsleep' : h && habitatFull(h) ? 'sleep' : !h ? 'sad' : 'roam';
      a.setMood(mood);
    }
    for (const [uid, a] of this.cats)
      if (!seen.has(uid)) {
        a.destroy();
        this.cats.delete(uid);
      }
    // empty box next to homeless cats
    this.homeBox.visible = homeless.length > 0;
    if (homeless.length) {
      const p = isoToScreen(ha.x0 + 0.9, ha.y0 - 0.2);
      this.homeBox.position.set(p.x, p.y);
      this.homeBox.zIndex = ha.x0 + ha.y0 + 0.7;
    }
  }

  // ================================================================== taps
  private onCatTap(uid: string) {
    const c = G.s.cats.find((x) => x.uid === uid);
    const a = this.cats.get(uid);
    if (!c || !a) return;
    if (caneloAsleep(c)) {
      wakeCat(c);
      a.wake();
      sfx('meow', 1.1);
      onomatopoeia(this.wfx, a.x, a.y - 150, '¡MIAU!', { size: 92, color: C.yellow });
      sparkles(this.wfx, a.x, a.y - 60, C.yellow, 12, 120);
      this.syncCats();
      return;
    }
    sfx('meow', 0.9 + Math.random() * 0.3);
    a.happy();
    openCatPanel(uid);
  }

  private lastCollect = new Map<string, number>();
  private onPlotTap(v: PlotView) {
    const h = v.habitat;
    if (!h) {
      openBuildMenu(v.region, v.plot);
      return;
    }
    const now = performance.now();
    const recent = now - (this.lastCollect.get(h.id) ?? 0) < 1400;
    if (!h.busy && h.buffer >= 1 && !recent) {
      this.collectFx(h, v);
      this.lastCollect.set(h.id, now);
      return;
    }
    openHabitatPanel(h.id);
  }

  /** storyboard (h) for one habitat: bounce, "+N", coins fly to the counter (T0) */
  private collectFx(h: Habitat, v: PlotView, delay = 0) {
    const amount = collect(h);
    if (amount <= 0) return 0;
    checkMissions();
    this.bounce(v);
    const from = v.bubbleGlobal();
    const lp = this.wfx.toLocal(from);
    floatText(this.wfx, lp.x, lp.y - 30, `+${fmt(amount)}`, { color: C.yellow, size: 40 * (1 + 0.12 * Math.log10(amount + 1)), rise: 80 });
    this.hud.flyTo('gold', from, amount, { delay });
    // the sleeping cat wakes up when the buffer empties
    this.syncCats();
    return amount;
  }

  private bounce(v: PlotView) {
    for (const c of [v.back, v.front]) this.bag.fromTo(c.scale, { x: 1.04, y: 0.94 }, { x: 1, y: 1, duration: 0.45, ease: 'elastic.out(1.2,0.4)' });
  }

  /** storyboard (h) "Recolectar todo" (T1): one cascade, ordered by distance to the counter */
  private collectAllFx() {
    if (!featureUnlocked('collect_all')) return;
    const list = G.s.habitats.filter((h) => Math.floor(h.buffer) > 0);
    if (!list.length) {
      sfx('error');
      toast('Nada que recolectar… todavía', { color: C.paper });
      return;
    }
    const target = this.hud.target('gold') ?? { x: W, y: 0 };
    const items = list
      .map((h) => ({ h, v: this.plots.find((p) => p.region === h.region && p.plot === h.plot)!, amt: Math.floor(h.buffer) }))
      .filter((i) => i.v)
      .map((i) => ({ ...i, g: i.v.bubbleGlobal() }))
      .sort((a, b) => Math.hypot(a.g.x - target.x, a.g.y - target.y) - Math.hypot(b.g.x - target.x, b.g.y - target.y));
    const total = collectAll();
    G.count('feature_collect_all');
    checkMissions();
    sfx('coin', 2);
    let d = 0;
    let step = 0.06;
    for (const it of items) {
      const delay = d;
      this.bag.add(
        gsap.delayedCall(delay, () => {
          this.bounce(it.v);
          const lp = this.wfx.toLocal(it.g);
          floatText(this.wfx, lp.x, lp.y - 30, `+${fmt(it.amt)}`, { color: C.yellow, size: 38, rise: 70 });
        }),
      );
      this.hud.flyTo('gold', it.g, it.amt, { delay: delay + 0.15, count: Math.max(3, Math.min(8, Math.round(2 * Math.log10(it.amt + 1)))) });
      d += step;
      step = Math.max(0.04, step * 0.88);
    }
    // T1 banner
    const tg = this.screenFx.toLocal(target);
    this.bag.add(
      gsap.delayedCall(0.9 + d, () => {
        floatText(this.screenFx, tg.x - 40, tg.y + 90, `+${fmt(total)}`, { color: C.yellow, size: 64, rise: 40, dur: 1.2, rot: -0.06 });
        sfx('levelup', 1.4);
      }),
    );
    this.syncCats();
  }

  private onFarmTap(v: FarmView) {
    const f = v.farm;
    if (!f) return;
    if (f.ready && !f.busy) {
      this.harvestFx(v);
      return;
    }
    openDock(f.id);
  }

  /** cosecha (T1): ¡SPLASH! + pescaditos que vuelan al contador */
  harvestFx(v: FarmView) {
    const f = v.farm!;
    const food = harvest(f);
    if (food <= 0) return;
    checkMissions();
    const c = v.center;
    sfx('splash');
    onomatopoeia(this.wfx, c.x, c.y - 90, '¡SPLASH!', { size: 80, color: 0x7fd8ff });
    v.splashRing(c.x, c.y);
    this.parts.burst(c.x, c.y - 10, { count: 22, tint: [0xffffff, 0x7fd8ff, 0xa7e8d7], speed: [200, 480], angle: [-Math.PI * 0.95, -Math.PI * 0.05], gravity: 1100, scale: [0.25, 0.6], life: [0.5, 0.9] });
    floatText(this.wfx, c.x, c.y - 150, `+${fmt(food)}`, { color: 0x7fd8ff, size: 44 });
    const gp = this.wfx.toGlobal({ x: c.x, y: c.y - 30 });
    this.hud.flyTo('food', gp, food);
    if (G.s.momentum > 1.01) floatText(this.wfx, c.x, c.y - 200, '🔥 BONUS DE COSECHA', { size: 24, color: C.orange, font: F.ui, rise: 40 });
    this.syncAll();
  }

  private portMenu() {
    const p = isoToScreen(this.plan.home.port.gx + 1, this.plan.home.port.gy + 1);
    const g = this.world.toGlobal({ x: p.x, y: p.y - 140 });
    openPopMenu(g, 'PUERTO', [
      { label: 'ASTILLERO', color: C.paper, onTap: () => openShipyard() },
      { label: '¡ZARPAR!', color: C.pinkHot, textColor: C.paper, onTap: () => goMap() },
    ]);
  }

  // ================================================================== state events → juice
  private buildDone(hid: string) {
    const h = G.s.habitats.find((x) => x.id === hid);
    if (!h) return;
    const v = this.plots.find((p) => p.region === h.region && p.plot === h.plot);
    if (!v) return;
    const p = isoToScreen(v.spot.gx + 1, v.spot.gy + 1);
    sfx('fanfare');
    onomatopoeia(this.wfx, p.x, p.y - 130, '¡LISTO!', { size: 90, color: elementFx(h.element).accent });
    this.parts.burst(p.x, p.y - 40, { count: 26, tint: [elementFx(h.element).main, C.yellow, C.paper], speed: [250, 600], gravity: 900, life: [0.6, 1.1] });
    this.shaker.add(0.18);
  }
  private upgradeDone(hid: string) {
    const h = G.s.habitats.find((x) => x.id === hid);
    if (!h) return;
    const v = this.plots.find((p) => p.region === h.region && p.plot === h.plot);
    if (!v) return;
    const p = isoToScreen(v.spot.gx + 1, v.spot.gy + 1);
    sfx('levelup');
    onomatopoeia(this.wfx, p.x, p.y - 150, '¡MEJORADO!', { size: 80, color: C.yellow });
    sparkles(this.wfx, p.x, p.y - 80, C.yellow, 16, 160);
    toast(`¡${v.tierName().toUpperCase()}!`, { sub: 'Tu hábitat subió de nivel: más oro, más búfer.', icon: 'gold' });
  }
  private expansionCleared(n: number) {
    const e = this.expansions.find((x) => x.n === n);
    if (!e) return;
    this.cam.lookAt(e.center.x, e.center.y, true, Math.max(this.cam.zoom, 0.72));
    // finished before anyone saw the helmet kittens? play a quick rock-breaking montage first
    const quick = !e.sawClearing();
    if (quick) e.quickClear(1.3);
    this.revealHold.add(e.plan.def.id);
    this.bag.add(
      gsap.delayedCall(quick ? 1.7 : 0.5, () => {
        this.revealHold.delete(e.plan.def.id);
        this.syncAll();
        sfx('bigboom');
        this.shaker.add(0.5);
        flash(this.screenFx, C.paper, 0.6, 0.4);
        onomatopoeia(this.wfx, e.center.x, e.center.y - 160, '¡TIERRA NUEVA!', { size: 110, color: C.yellow, dur: 1.6 });
        this.parts.burst(e.center.x, e.center.y - 40, { count: 50, tint: [0x8f8778, 0xa59d8c, C.yellow, C.paper], speed: [300, 900], gravity: 1200, scale: [0.4, 1], life: [0.6, 1.3] });
        const ex = EXPANSIONS[n - 1];
        toast(`¡${ex.name.toUpperCase()} LIMPIO!`, { sub: `+${ex.balance.hab_plots} parcelas de hábitat${ex.balance.farm_plots ? ` · +${ex.balance.farm_plots} de pesca` : ''}. ${ex.opensDesign.split('.')[0]}.`, color: C.mint, dur: 3.5 });
        sfx('fanfare');
      }),
    );
  }

  // ================================================================== camera helpers / goals
  focusRegion(n: number) {
    const e = this.expansions.find((x) => x.n === n);
    if (e) this.cam.lookAt(e.center.x, e.center.y + 60, true, 0.7);
  }
  private focusSpot(s: Spot, zoom = 0.95) {
    const p = isoToScreen(s.gx + s.w / 2 - 0.5, s.gy + s.h / 2 - 0.5);
    this.cam.lookAt(p.x, p.y - 40, true, zoom);
  }
  private pointAt(x: number, y: number) {
    const arrow = new Container();
    const g = new Graphics().poly([-22, -60, 22, -60, 22, -30, 40, -30, 0, 10, -40, -30, -22, -30]).fill(C.pinkHot).stroke({ width: 4, color: C.ink });
    arrow.addChild(g);
    arrow.position.set(x, y - 40);
    this.bubbles.addChild(arrow);
    this.bag.to(arrow, { y: y - 70, duration: 0.35, yoyo: true, repeat: 5, ease: 'sine.inOut', onComplete: () => arrow.destroy() });
  }

  /** "IR" on a pinned mission */
  private goToGoal(m: MissionDef) {
    const g = m.goal as Record<string, unknown> & { type: string };
    switch (g.type) {
      case 'tap_cat': {
        const c = G.s.cats.find((x) => x.species === 'c_canelo') ?? G.s.cats[0];
        const a = c && this.cats.get(c.uid);
        if (a) {
          this.cam.lookAt(a.x, a.y - 60, true, 1.05);
          this.pointAt(a.x, a.y - 150);
        }
        return;
      }
      case 'name_cat': {
        const c = G.s.cats.find((x) => x.species === 'c_canelo') ?? G.s.cats[0];
        if (c) openCatPanel(c.uid);
        return;
      }
      case 'collect_gold': {
        const v = this.plots.find((p) => p.habitat && p.habitat.cats.length) ?? this.plots[0];
        this.focusSpot(v.spot);
        this.pointAt(v.coins.parent!.x + v.coins.x, v.coins.parent!.y + v.coins.y - 60);
        return;
      }
      case 'harvest_food':
      case 'harvest':
      case 'plant': {
        const f = this.farms.find((x) => x.active);
        if (f) {
          this.cam.lookAt(f.center.x, f.center.y - 60, true, 0.95);
          this.pointAt(f.center.x, f.center.y - 110);
        }
        if (f?.farm && !f.farm.ready) this.bag.add(gsap.delayedCall(0.6, () => openDock(f.farm!.id)));
        return;
      }
      case 'cat_level': {
        const c = [...G.s.cats].sort((a, b) => b.level - a.level)[0];
        if (c) openCatPanel(c.uid);
        return;
      }
      case 'build_habitat': {
        const v = this.plots.find((p) => p.active && !p.habitat);
        if (v) {
          this.focusSpot(v.spot);
          this.bag.add(gsap.delayedCall(0.7, () => openBuildMenu(v.region, v.plot)));
        } else toast('No hay parcelas libres', { sub: 'Compra una expansión para tener más.' });
        return;
      }
      case 'upgrade_habitat': {
        const v = this.plots.find((p) => p.habitat && !p.habitat.busy);
        if (v?.habitat) openHabitatPanel(v.habitat.id);
        return;
      }
      case 'buy_expansion':
      case 'clear_expansion':
      case 'expansion_secret': {
        const n = Number(g.n ?? 1);
        this.focusRegion(n);
        return;
      }
      case 'resonance_start':
      case 'resonance_hatch':
      case 'resonance_parallel':
        this.focusSpot(this.plan.home.sanctuary, 0.85);
        this.bag.add(gsap.delayedCall(0.6, () => openSanctuary()));
        return;
      case 'species_owned':
      case 'catdex_set':
        openCatdex();
        return;
      case 'orbs_of_species':
      case 'star_up':
        if (hudUnlocks().altar) openAltar();
        else openMissions();
        return;
      case 'win_battle':
      case 'defeat_boss':
      case 'stages_cleared':
      case 'destroy_module_arc':
      case 'destroy_module':
      case 'use_ultimate':
      case 'win_by':
      case 'win_perfect':
      case 'quick_assault':
        goMap();
        return;
      case 'ship_upgrade':
      case 'own_ship':
      case 'crew_full':
      case 'edit_layout':
        openShipyard();
        return;
      case 'use_feature': {
        if (g.feature === 'collect_all') this.collectAllFx();
        else if (g.feature === 'feed_bulk') {
          const c = [...G.s.cats].sort((a, b) => b.level - a.level)[0];
          if (c) openCatPanel(c.uid);
        } else if (g.feature === 'crop_repeat') openDock();
        else openMissions();
        return;
      }
      case 'reach_kl':
      default:
        openMissions();
    }
  }

  // ================================================================== update
  override update(dt: number) {
    this.t += dt;
    this.sea.tick(dt);
    this.terrain.tick(dt);
    this.hud.update(dt);
    this.syncAcc += dt;
    if (this.syncAcc > 0.3) {
      this.syncAcc = 0;
      this.syncAll();
    }
    for (const p of this.plots) p.update(dt);
    for (const f of this.farms) f.update(dt);
    for (const e of this.expansions) e.update(dt);
    for (const c of this.cats.values()) c.update(dt);
    this.ambient.update(dt);
    // onboarding: Canelo asks for a name while H02 is active
    const wantsName = missionActive('H02');
    if (wantsName && !this.nameTag) {
      this.nameTag = new TagBubble('¿Y mi nombre?', { color: C.paper, size: 22 });
      this.bubbles.addChild(this.nameTag);
      this.nameTag.pop();
    }
    if (this.nameTag) {
      const cn = G.s.cats.find((c) => c.species === 'c_canelo');
      const a = cn && this.cats.get(cn.uid);
      this.nameTag.visible = wantsName && !!a;
      if (a) this.nameTag.position.set(a.x, a.y - 120);
      this.nameTag.tick(dt);
      if (!wantsName) {
        this.nameTag.destroy({ children: true });
        this.nameTag = null;
      }
    }
    // fixed buildings
    const jobs = G.s.resonance.jobs;
    const readyJob = jobs.some((j) => j.ready);
    this.sanctuary.ready.visible = readyJob;
    this.sanctuary.ready.tick(dt);
    const rt = G.s.timers.filter((t) => t.kind === 'resonance').sort((a, b) => a.leftMs - b.leftMs)[0];
    this.sanctuary.clock.visible = !!rt;
    if (rt) this.sanctuary.clock.set(rt.leftMs, rt.totalMs);
    const ring = this.sanctuary.portal.children.find((c) => c.label === 'ring');
    if (ring) ring.rotation += dt * (rt ? 2.4 : 0.6);
    this.sanctuary.portal.scale.set(1 + Math.sin(this.t * 2) * (rt ? 0.06 : 0.02));
    // boat bob on twos
    const tw = Math.floor(this.t * 12) / 12;
    this.boat.y = this.boatBase.y + Math.sin(tw * 1.8) * 3;
    this.boat.rotation = Math.sin(tw * 1.3) * 0.02;
    // altar orbs orbit
    if (this.altar.c.visible)
      this.altar.orbs.forEach((o, i) => {
        const a = tw * 1.6 + (i * Math.PI * 2) / 3;
        o.position.set(this.altar.anchor.x + Math.cos(a) * 30, this.altar.anchor.y + Math.sin(a) * 10 + Math.sin(tw * 3 + i) * 4);
      });
    // lighthouse beam sweep
    const pulse = Math.max(0, Math.sin(this.t * 2.2));
    this.beam.alpha = 0.25 + pulse * 0.6;
    this.beam.scale.set(1 + pulse * 0.6, 0.7 + pulse * 0.3);
  }
}
