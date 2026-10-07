/**
 * IslandScene — the "Dragon City" half: an isometric cozy archipelago that feels alive.
 * Home + 8 expansions (paper veil + aspirational prices), habitats with cats and gold buffers,
 * the fishing dock, fixed buildings (Santuario, Puerto, Altar, Mesa, Faro) and the HUD.
 */
import '../island/safety';
import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import gsap from 'gsap';
import { Scene, scenes } from '../core/scenes';

/** a modal / story / reveal is on screen (don't start a new celebration under it) */
function scenesOverlayBusy() {
  return scenes.overlayLayer.children.some((c) => c.visible && c.children.length > 0);
}
import { W, H } from '../core/App';
import { music } from '../core/music';
import { sfx } from '../core/audio';
import { fmt } from '../core/format';
import { C, F } from '../ui/theme';
import { toast } from '../ui/modal';
import { G, Habitat } from '../state/game';
import { EXPANSIONS, MissionDef } from '../data/content';
import { HOME, collectHabitat, collectAllBoth, expansionState, harvest, regionsUnlocked, habitatPlots, farmPlots, islandBus, bankUnlocked, bankKl, bankState, habitatRate, freeHabitatPlot } from '../state/sys/island';
import { secretInfo } from '../state/sys/secrets';
import { expeditions, readyExpeditions, expeditionsUnlocked, resonanceQueue } from '../state/sys/workforce';
import { SecretView } from '../island/views/SecretView';
import { bankArt, bankLotArt, pierArt } from '../island/landmarks';
import { showSecretReveal } from '../island/secretReveal';
import { setIslandHooks } from '../island/hooks';
import { takeDuelOutcome, startIslandDuel, specialExists } from '../island/duel';
import { openBankPanel } from '../panels/island/BankPanel';
import { openPort } from '../panels/island/PortPanel';
import { openWorkers } from '../panels/island/WorkersPanel';
import { openHomeless } from '../panels/island/HomelessPanel';
import { Modal } from '../ui/modal';
import { Button, txt } from '../ui/widgets';
import { icon } from '../ui/icons';
import { SPECIALS } from '../state/sys/campaign';
import { crew } from '../state/sys/ship';
import { catPortrait } from '../panels/island/ui';
import type { SecretReward } from '../state/sys/secrets';
import { checkMissions } from '../state/sys/missions';
import {
  caneloAsleep,
  catLevelScale,
  ctaVisible,
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
import { STORY_BATTLES } from '../state/sys/storyBattles';
import { startStoryBattle } from '../app/storyFlow';
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
import { mountDecor } from '../island/decor/DecorLayer';

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
  // M2
  private secrets: SecretView[] = [];
  private bank!: { lot: Container; built: Container; plate: Container; slot: { x: number; y: number }; pos: { x: number; y: number } };
  private pier: { c: Container; boat: Container; home: { x: number; y: number }; region: string; tag: TagBubble; clock: ClockBubble; plate: Container; top: { x: number; y: number } } | null = null;
  private homelessTags = new Map<string, TagBubble>();
  private queueChip!: TagBubble;
  private bankFlowT = 1;
  private plaqueOff = new Map<number, { x: number; y: number }>();
  private revealing = false;
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
      this.afterReady();
    });
    setIslandHooks({
      focusRegion: (n) => this.focusRegion(n),
      focusBuilding: (id) => this.focusBuilding(id),
      buildOnFreePlot: (el) => this.buildOnFreePlot(el),
      hud: () => (this.destroyed ? null : this.hud),
      sync: () => this.syncAll(),
    });
    // Tienda (agente tienda): shop decorations + placement mode
    this.unsub.push(mountDecor({ world: this.world, objects: this.objects, bubbles: this.bubbles, wfx: this.wfx, cam: this.cam, plan: this.plan, hud: () => (this.destroyed ? null : this.hud), look: (r) => this.look(r), sync: () => this.syncAll() }));
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
      islandBus.on('autoHarvest', (p) => this.autoHarvestFx(p.farm, p.food)),
    );
    (globalThis as unknown as { __island: IslandScene }).__island = this;
    (globalThis as unknown as { __islandDev: unknown }).__islandDev = { openHabitatPanel, openBuildMenu, openDock, openExpansionPanel, openMissions, openCatPanel, tapL: devTap, gsap, step: (n = 20) => {
      for (let i = 0; i < n; i++) this.update(0.05);
    } };
  }

  override exit() {
    setIslandHooks(null);
    this.unsub.forEach((f) => f());
    for (const sv of this.secrets) sv.destroy();
    for (const t of this.homelessTags.values()) t.destroy({ children: true });
    this.homelessTags.clear();
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
    [hp.sanctuary, hp.port, hp.altar, hp.mesa, hp.lighthouse, hp.bank, ...home.habitats].forEach(mark);
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
      { x: hp.bank.gx + 2, y: hp.bank.gy + 1 },
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
    // ---- Banco del Reino (KL15): fenced lot before, neoclassical bank after
    {
      const lot = bankLotArt(bankKl());
      const ba = bankArt();
      const bpos = this.place(lot, hp.bank);
      this.place(ba.c, hp.bank);
      const bp = plate('BANCO DEL REINO', 0xdfe9d2, 18);
      const bc = centerOf(2, 2);
      bp.position.set(bpos.x + bc.x, bpos.y + bc.y + 30);
      this.bubbles.addChild(bp);
      this.clickable(lot, () => openBankPanel());
      this.clickable(ba.c, () => openBankPanel());
      this.bank = { lot, built: ba.c, plate: bp, slot: { x: bpos.x + ba.slot.x, y: bpos.y + ba.slot.y }, pos: bpos };
    }
    // Resonance queue (KL18) chip next to the Santuario clock
    this.queueChip = new TagBubble('COLA 0', { color: C.lilac, size: 20 });
    this.queueChip.position.set(spos.x + ctr.x - 120, spos.y + sp.top + 50);
    this.queueChip.visible = false;
    this.bubbles.addChild(this.queueChip);
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
      if (p.secret && p.def.n)
        this.secrets.push(
          new SecretView(p.def.n, p.secret, this.ctx, {
            reveal: (n, r, at) => this.secretFound(n, r, at),
            battle: (n, id) => this.confirmDuel(n, id),
            shake: (k) => this.shaker.add(k),
          }),
        );
      if (p.pier) this.buildPier(p.def.id, p.pier);
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
    for (const sv of this.secrets) {
      const reg = this.plan.regions.find((r) => r.n === sv.n)?.id ?? '';
      sv.sync(unlocked.has(reg));
    }
    if (this.pier) {
      const open = unlocked.has(this.pier.region);
      this.pier.c.visible = this.pier.boat.visible = this.pier.plate.visible = open;
    }
    const bk = bankUnlocked();
    this.bank.lot.visible = !bk && G.s.kl >= bankKl() - 6;
    this.bank.built.visible = bk;
    this.bank.plate.visible = bk;
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
    // red "¡SIN CASA!" tag over each homeless cat (tap = the fix)
    for (const [uid, t] of this.homelessTags)
      if (!homeless.some((c) => c.uid === uid) || !this.cats.has(uid)) {
        t.destroy({ children: true });
        this.homelessTags.delete(uid);
      }
    for (const c of homeless) {
      if (this.homelessTags.has(c.uid) || !this.cats.has(c.uid) || caneloAsleep(c) || !ctaVisible('build')) continue;
      const t = new TagBubble('¡SIN CASA!', { color: C.red, textColor: C.paper, size: 20 });
      t.eventMode = 'static';
      t.cursor = 'pointer';
      t.on('pointertap', () => {
        if (!this.cam.wasDrag) openHomeless(c.uid);
      });
      this.bubbles.addChild(t);
      t.pop();
      this.homelessTags.set(c.uid, t);
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
    if (!c.habitat) openHomeless(uid);
    else openCatPanel(uid);
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
    if (!h.busy && !recent && !v.coins.empty && v.coins.visible) {
      this.collectFx(h, v);
      this.lastCollect.set(h.id, now);
      return;
    }
    openHabitatPanel(h.id);
  }

  /** storyboard (h) for one habitat: bounce, "+N", coins fly to the counter (T0) */
  private collectFx(h: Habitat, v: PlotView, delay = 0) {
    const got = collectHabitat(h);
    const amount = got.gold;
    if (amount <= 0 && got.food <= 0) return 0;
    checkMissions();
    this.bounce(v);
    const from = v.bubbleGlobal();
    const lp = this.wfx.toLocal(from);
    if (amount > 0) {
      floatText(this.wfx, lp.x - (got.food ? 40 : 0), lp.y - 60, `+${fmt(amount)}`, { color: C.yellow, size: 40 * (1 + 0.12 * Math.log10(amount + 1)), rise: 80 });
      this.hud.flyTo('gold', from, amount, { delay });
    }
    if (got.food > 0) {
      floatText(this.wfx, lp.x + (amount ? 50 : 0), lp.y - 40, `+${fmt(got.food)}`, { color: 0x7fd8ff, size: 38, rise: 80 });
      this.hud.flyTo('food', from, got.food, { delay: delay + 0.08 });
    }
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
    const list = G.s.habitats.filter((h) => {
      const v = this.plots.find((p) => p.region === h.region && p.plot === h.plot);
      return Math.floor(h.buffer) > 0 || (v && !v.coins.empty);
    });
    if (!list.length) {
      sfx('error');
      toast('Nada que recolectar… todavía', { color: C.paper });
      return;
    }
    const target = this.hud.target('gold') ?? { x: W, y: 0 };
    const items = list
      .map((h) => ({ h, v: this.plots.find((p) => p.region === h.region && p.plot === h.plot)!, amt: Math.floor(h.buffer), fish: Math.floor(((G.s.ext?.fish as Record<string, number> | undefined)?.[h.id]) ?? 0) }))
      .filter((i) => i.v)
      .map((i) => ({ ...i, g: i.v.bubbleGlobal() }))
      .sort((a, b) => Math.hypot(a.g.x - target.x, a.g.y - target.y) - Math.hypot(b.g.x - target.x, b.g.y - target.y));
    const got = collectAllBoth();
    const total = got.gold;
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
          if (it.amt > 0) floatText(this.wfx, lp.x, lp.y - 30, `+${fmt(it.amt)}`, { color: C.yellow, size: 38, rise: 70 });
          if (it.fish > 0) floatText(this.wfx, lp.x + 40, lp.y - 10, `+${fmt(it.fish)}`, { color: 0x7fd8ff, size: 32, rise: 70 });
        }),
      );
      if (it.amt > 0) this.hud.flyTo('gold', it.g, it.amt, { delay: delay + 0.15, count: Math.max(3, Math.min(8, Math.round(2 * Math.log10(it.amt + 1)))) });
      if (it.fish > 0) this.hud.flyTo('food', it.g, it.fish, { delay: delay + 0.22, count: Math.max(2, Math.min(5, Math.round(1.5 * Math.log10(it.fish + 1)))) });
      d += step;
      step = Math.max(0.04, step * 0.88);
    }
    // T1 banner
    const tg = this.screenFx.toLocal(target);
    this.bag.add(
      gsap.delayedCall(0.9 + d, () => {
        if (total > 0) floatText(this.screenFx, tg.x - 40, tg.y + 90, `+${fmt(total)}`, { color: C.yellow, size: 64, rise: 40, dur: 1.2, rot: -0.06 });
        const ft = this.hud.target('food');
        if (got.food > 0 && ft) {
          const fl = this.screenFx.toLocal(ft);
          floatText(this.screenFx, fl.x - 20, fl.y + 90, `+${fmt(got.food)}`, { color: 0x7fd8ff, size: 54, rise: 40, dur: 1.2, rot: 0.05 });
        }
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
    if (G.s.momentum > 1.01) floatText(this.wfx, c.x, c.y - 200, '¡BONUS DE COSECHA!', { size: 24, color: C.orange, font: F.ui, rise: 40 });
    this.syncAll();
  }

  private portMenu() {
    const p = isoToScreen(this.plan.home.port.gx + 1, this.plan.home.port.gy + 1);
    const g = this.world.toGlobal({ x: p.x, y: p.y - 140 });
    const items = [
      { label: 'ASTILLERO', color: C.paper as number, onTap: () => openShipyard() },
      { label: '¡ZARPAR!', color: C.pinkHot as number, textColor: C.paper as number, onTap: () => goMap() },
    ];
    if (expeditionsUnlocked()) items.splice(1, 0, { label: 'EXPEDICIONES', color: C.mint as number, onTap: () => openPort() });
    openPopMenu(g, 'PUERTO', items);
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


  // ================================================================== M2: bank, pier, secrets, duels
  private afterReady() {
    // a duel just ended (Santuario Sellado): celebrate or console
    const d = takeDuelOutcome();
    if (d) {
      const n = d.n ?? 1;
      const sv = this.secrets.find((x) => x.n === n);
      if (sv) this.cam.lookAt(sv.top.x, sv.top.y + 120, false, 0.85);
      this.bag.add(
        gsap.delayedCall(0.9, () => {
          if (d.won && d.reward) this.secretFound(n, d.reward, sv ? { x: sv.top.x, y: sv.top.y + 80 } : null);
          else if (!d.won) toast('El guardián sigue en pie', { sub: 'Sube de nivel a tu tripulación (o cambia de gatos) y vuelve a intentarlo. Sin castigo.', color: C.paper, dur: 3.2 });
        }),
      );
    }
  }

  focusBuilding(id: 'bank' | 'pier' | 'sanctuary' | 'port') {
    const hp = this.plan.home;
    if (id === 'bank') return this.focusSpot(hp.bank, 0.95);
    if (id === 'sanctuary') return this.focusSpot(hp.sanctuary, 0.85);
    if (id === 'port') return this.focusSpot(hp.port, 0.9);
    if (id === 'pier' && this.pier) this.cam.lookAt(this.pier.top.x, this.pier.top.y + 140, true, 0.85);
  }

  /** "Construir" from the Sin casa panel: first free plot, camera there, build menu */
  buildOnFreePlot(_el?: string) {
    const free = freeHabitatPlot();
    const v = free ? this.plots.find((p) => p.region === free.region && p.plot === free.plot && p.active && !p.habitat) : this.plots.find((p) => p.active && !p.habitat);
    if (!v) return false;
    this.focusSpot(v.spot);
    this.bag.add(gsap.delayedCall(0.6, () => openBuildMenu(v.region, v.plot)));
    return true;
  }

  private buildPier(region: string, spot: Spot) {
    const front: 'x' | 'y' = this.plan.tiles.has(`${spot.gx},${spot.gy + spot.h}`) ? 'x' : 'y';
    const pa = pierArt(front);
    const pos = this.place(pa.c, spot);
    pa.boat.position.set(pos.x + pa.boatHome.x, pos.y + pa.boatHome.y);
    pa.boat.zIndex = pa.c.zIndex + 2;
    this.objects.addChild(pa.boat);
    const tag = new TagBubble('¡VOLVIERON!', { color: C.yellow, size: 22, icon: 'scrap' });
    const clock = new ClockBubble(24);
    const top = { x: pos.x + centerOf(2, 2).x, y: pos.y + pa.top };
    tag.position.set(top.x, top.y);
    clock.position.set(top.x, top.y + 20);
    const pl = plate('EXPEDICIONES', 0xeae6ee, 18);
    pl.position.set(top.x, pos.y + centerOf(2, 2).y + 34);
    this.bubbles.addChild(tag, clock, pl);
    tag.eventMode = 'static';
    tag.cursor = 'pointer';
    tag.on('pointertap', () => !this.cam.wasDrag && openPort());
    this.clickable(pa.c, () => openPort());
    this.clickable(pa.boat, () => openPort());
    this.pier = { c: pa.c, boat: pa.boat, home: { x: pa.boat.x, y: pa.boat.y }, region, tag, clock, plate: pl, top };
  }

  private updatePier(dt: number) {
    const p = this.pier;
    if (!p || !p.c.visible) {
      if (p) p.tag.visible = p.clock.visible = false;
      return;
    }
    const running = expeditions().filter((x) => !x.ready);
    const ready = readyExpeditions().length > 0;
    p.tag.visible = ready;
    p.tag.tick(dt);
    const t = running.map((x) => G.timer(x.timerId)).filter((x): x is NonNullable<typeof x> => !!x).sort((a, b) => a.leftMs - b.leftMs)[0];
    p.clock.visible = !!t && !ready;
    if (t) p.clock.set(t.leftMs, t.totalMs);
    // the boat sails off while everyone's away and comes back when they're done
    const away = running.length > 0 && !ready;
    const tx = away ? p.home.x + 420 : p.home.x;
    const ty = away ? p.home.y + 210 : p.home.y;
    p.boat.x += (tx - p.boat.x) * Math.min(1, dt * 1.2);
    p.boat.y += (ty - p.boat.y) * Math.min(1, dt * 1.2) + Math.sin(this.t * 1.8) * 0.15;
    p.boat.alpha = away ? Math.max(0, 1 - Math.hypot(p.boat.x - p.home.x, p.boat.y - p.home.y) / 380) : Math.min(1, p.boat.alpha + dt * 2);
    p.boat.rotation = Math.sin(this.t * 1.3) * 0.03;
  }

  /** KL15: coins trickle from each producing habitat to the bank ("automation you can see") */
  private updateBank(dt: number) {
    if (!bankUnlocked() || !this.ready) return;
    const b = bankState();
    if (!b.opened && !this.revealing && !this.blockingUi()) {
      b.opened = true;
      this.bankReveal();
      return;
    }
    this.bankFlowT -= dt;
    if (this.bankFlowT > 0) return;
    this.bankFlowT = 0.9;
    const prod = G.s.habitats.filter((h) => habitatRate(h) > 0);
    if (!prod.length) return;
    const h = prod[Math.floor(Math.random() * prod.length)];
    const v = this.plots.find((q) => q.region === h.region && q.plot === h.plot);
    if (!v || !v.active) return;
    const from = isoToScreen(v.spot.gx + 0.5, v.spot.gy + 0.5);
    const to = this.bank.slot;
    const coin = icon('gold', 30);
    coin.position.set(from.x, from.y - 60);
    this.wfx.addChild(coin);
    const o = { k: 0 };
    const peak = Math.min(from.y, to.y) - 160;
    this.bag.to(o, {
      k: 1,
      duration: 1.1,
      ease: 'power1.inOut',
      onUpdate: () => {
        const k = o.k;
        coin.x = from.x + (to.x - from.x) * k;
        coin.y = (1 - k) * (1 - k) * (from.y - 60) + 2 * (1 - k) * k * peak + k * k * to.y;
        coin.scale.set(1 - k * 0.3);
      },
      onComplete: () => {
        coin.destroy({ children: true });
        const bs = bankState();
        if (bs.pending >= 1) {
          floatText(this.wfx, to.x, to.y - 20, `+${fmt(bs.pending)}`, { color: C.yellow, size: 30, rise: 50, dur: 0.9 });
          bs.pending = 0;
        }
        this.bag.fromTo(this.bank.built.scale, { x: 1.03, y: 0.97 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
      },
    });
  }

  private blockingUi() {
    return scenesOverlayBusy();
  }

  private bankReveal() {
    this.revealing = true;
    const p = isoToScreen(this.plan.home.bank.gx + 0.5, this.plan.home.bank.gy + 0.5);
    this.cam.lookAt(p.x, p.y - 40, true, 0.95);
    this.bag.add(
      gsap.delayedCall(0.8, () => {
        sfx('bigboom');
        this.shaker.add(0.4);
        flash(this.screenFx, C.paper, 0.5, 0.35);
        onomatopoeia(this.wfx, p.x, p.y - 200, '¡BANCO ABIERTO!', { size: 96, color: C.yellow, dur: 1.6 });
        this.parts.burst(p.x, p.y - 80, { count: 40, tint: [C.yellow, 0xb8862a, C.paper], speed: [300, 800], gravity: 1100, life: [0.6, 1.2] });
        sfx('fanfare');
        toast('¡BANCO DEL REINO!', { icon: 'gold', sub: 'El oro de tus hábitats entra solo a la cartera. Adiós "LLENO". Hola siesta.', dur: 4, color: 0xdfe9d2 });
        this.revealing = false;
      }),
    );
  }

  /** a secret was found (T3): camera, burst, poster card; then the land shows its new state */
  private secretFound(n: number, reward: SecretReward, at: { x: number; y: number } | null) {
    checkMissions();
    this.revealing = true;
    if (at) {
      this.parts.burst(at.x, at.y, { count: 36, tint: [C.yellow, C.paper, C.pinkHot], speed: [250, 700], gravity: 900, life: [0.6, 1.2] });
      sparkles(this.wfx, at.x, at.y - 40, C.yellow, 18, 200);
    }
    this.shaker.add(0.3);
    this.bag.add(
      gsap.delayedCall(0.45, () =>
        showSecretReveal(n, reward, () => {
          this.revealing = false;
          const g = this.hud.target('gems');
          if (g && at) this.hud.flyTo('gems', this.wfx.toGlobal(at), reward.gems, { count: Math.min(6, reward.gems * 2) });
          this.syncAll();
        }),
      ),
    );
  }

  /** battle secret: a Duelo de Gatos card (who, rules, power) → the duel */
  private async confirmDuel(n: number, battleId: string) {
    const exists = await specialExists(battleId);
    if (this.destroyed) return;
    if (!exists) {
      toast('Algo duerme aquí…', { sub: 'Todavía no despierta. (Próximamente)', color: C.paper });
      return;
    }
    const sp = SPECIALS[battleId];
    await preloadCats([...sp.enemyCats.map((x) => slugOf(x)), ...crew().map((u) => slugOf(G.s.cats.find((c) => c.uid === u)?.species ?? 'c_canelo'))]);
    if (this.destroyed) return;
    const m = new Modal('Duelo de Gatos', 1240, 660, { band: 0x1f4a2a, subtitle: secretInfo(n).name });
    // the guardian vs your first two crew cats
    const foe = { uid: 'foe', species: sp.enemyCats[0], name: sp.captain, level: 5, bites: 0, stars: 1, habitat: null, trait: '', mutation: null, bornAtMs: 0, moments: [] };
    const fp = catPortrait(foe, 190);
    fp.position.set(0, 0);
    const vs = txt('VS', { fontFamily: F.comic, fontSize: 80, fill: C.yellow, stroke: { color: C.ink, width: 10, join: 'round' } });
    vs.anchor.set(0.5);
    vs.position.set(270, 100);
    m.body.addChild(fp, vs);
    crew()
      .slice(0, 2)
      .forEach((u, i) => {
        const c = G.s.cats.find((x) => x.uid === u);
        if (!c) return;
        const p = catPortrait(c, 140);
        p.position.set(350 + i * 160, 26);
        m.body.addChild(p);
      });
    const who = txt(sp.captain.toUpperCase(), { fontFamily: F.poster, fontSize: 60, fill: 0x1f4a2a });
    who.position.set(690, -4);
    const line = txt(`"${sp.line}"`, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 26, fill: C.ink, wordWrap: true, wordWrapWidth: m.innerW - 700 });
    line.position.set(690, 80);
    const rules = txt('1 contra 1 en balsas · van tus 2 primeros gatos de la tripulación · gana quien deje K.O. al otro. Si pierdes no pasa nada: vuelves cuando quieras.', { fontFamily: F.ui, fontWeight: '700', fontSize: 19, fill: C.ink, wordWrap: true, wordWrapWidth: m.innerW - 20 });
    rules.position.set(0, 260);
    const prize = txt('PREMIO: 2 Ojos de Gato + una pista para el Catdex', { fontFamily: F.bebas, fontSize: 28, fill: C.pinkHot, letterSpacing: 2 });
    prize.position.set(0, 330);
    m.body.addChild(prize);
    const go = new Button('¡AL DUELO!', () => {
      m.close();
      void startIslandDuel(battleId, n);
    }, { w: 330, h: 84, size: 44, color: C.pinkHot, textColor: C.paper });
    go.position.set(m.innerW - 340, m.innerH - 100);
    const later = new Button('LUEGO', () => m.close(), { w: 200, h: 84, size: 36, color: C.paper });
    later.position.set(m.innerW - 560, m.innerH - 100);
    m.body.addChild(who, line, rules, go, later);
    m.open();
  }

  /** KL21 Mar de Pescados Automático: a ready pen empties itself into the Silo */
  private autoHarvestFx(farmId: string, food: number) {
    const v = this.farms.find((f) => f.farm?.id === farmId);
    if (!v || !v.active) return;
    const c = v.center;
    v.splashRing(c.x, c.y);
    floatText(this.wfx, c.x, c.y - 110, `+${fmt(food)}`, { color: 0x7fd8ff, size: 34, rise: 60 });
    floatText(this.wfx, c.x, c.y - 70, 'AUTO', { color: C.paper, size: 20, font: F.bebas, rise: 40, dur: 0.8 });
    // automatic income stays in the world (splash + float); the HUD number just rolls — no coin
    // rain + icon pop every few seconds (playtest: the fish pill never stopped flickering)
    this.syncAll();
  }

  /** world labels (expansion plaques) slide out from under the HUD, tethered to their island */
  private keepPlaquesVisible() {
    const z = this.cam.zoom;
    const L = 440;
    const R = W - 320;
    const T = 196;
    const B = H - 150;
    for (const e of this.expansions) {
      const pl = e.plaque;
      let tx = 0;
      let ty = 0;
      if (pl.visible) {
        const l = this.hud.toLocal(this.world.toGlobal(e.anchor));
        const pw = Math.max(260, pl.width) * z;
        const ph = Math.max(150, pl.height) * z;
        if (l.x > -pw && l.x < W + pw && l.y > -60 && l.y < H + ph) {
          let dx = 0;
          let dy = 0;
          if (l.x - pw / 2 < L) dx = L - (l.x - pw / 2);
          if (l.x + pw / 2 + dx > R) dx = R - (l.x + pw / 2);
          if (l.y - ph < T) dy = T - (l.y - ph);
          if (l.y + dy > B) dy = B - l.y;
          tx = dx / z;
          ty = dy / z;
          const m = Math.hypot(tx, ty);
          const max = 340;
          if (m > max) {
            tx *= max / m;
            ty *= max / m;
          }
        }
      }
      const cur = this.plaqueOff.get(e.n) ?? { x: 0, y: 0 };
      cur.x += (tx - cur.x) * 0.25;
      cur.y += (ty - cur.y) * 0.25;
      this.plaqueOff.set(e.n, cur);
      e.setPlaqueOffset(cur.x, cur.y);
    }
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
      case 'clear_expansion': {
        const n = Number(g.n ?? 1);
        this.focusRegion(n);
        return;
      }
      case 'expansion_secret': {
        const n = Number(g.n ?? 1);
        const sv = this.secrets.find((x) => x.n === n);
        if (sv && sv.active) {
          this.cam.lookAt(sv.top.x, sv.top.y + 120, true, 0.95);
          this.pointAt(sv.top.x, sv.top.y + 20);
        } else this.focusRegion(n);
        return;
      }
      case 'assign_worker':
        openWorkers();
        return;
      case 'expedition_complete':
        if (expeditionsUnlocked()) {
          this.focusBuilding('pier');
          this.bag.add(gsap.delayedCall(0.6, () => openPort()));
        } else this.focusRegion(4);
        return;
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
      case 'damage_pct':
      case 'win_battle':
        if (typeof g.battle === 'string' && g.battle in STORY_BATTLES) {
          void startStoryBattle(g.battle);
          return;
        }
        if (g.battle === 'duel_guardian_bosque') {
          const sv = this.secrets.find((x) => x.n === 1);
          if (sv?.active) {
            this.cam.lookAt(sv.top.x, sv.top.y + 120, true, 0.95);
            this.pointAt(sv.top.x, sv.top.y + 20);
          } else this.focusRegion(1);
          return;
        }
        goMap();
        return;
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
        } else if (g.feature === 'crop_repeat' || g.feature === 'auto_harvest') openDock();
        else if (g.feature === 'resonance_queue') openSanctuary();
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
    for (const sv of this.secrets) sv.update(dt);
    this.updatePier(dt);
    this.updateBank(dt);
    this.keepPlaquesVisible();
    for (const [uid, t] of this.homelessTags) {
      const a = this.cats.get(uid);
      if (!a) continue;
      t.position.set(a.x, a.y - 196);
      t.tick(dt);
    }
    const q = resonanceQueue().length;
    this.queueChip.visible = q > 0;
    if (q > 0) {
      const txtNode = this.queueChip.caption;
      const want = `COLA ${q}`;
      if (txtNode.text !== want) txtNode.text = want;
      this.queueChip.tick(dt);
    }
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
