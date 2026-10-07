import { Container, FederatedPointerEvent, Graphics, Sprite, Ticker, TilingSprite, ColorMatrixFilter } from 'pixi.js';
import { isTouch } from '../core/pwa';
import gsap from 'gsap';
import { Scene, scenes } from '../core/scenes';
import { W, H, game } from '../core/App';
import { Sea } from '../battle/sea';
import { CELL } from '../battle/ship';
import { AnimeShipView } from '../battle/anime';
import type { ShipStyleId } from '../battle/anime';
import { playTransform } from '../battle/fx/transform';
import { applyCatTint } from '../art/tint';
import { CAT_BY_ID, BOSSES } from '../data/content';
import { Battle, BattleEvent, SideSetup, ShotPath, VictoryReason, INK_RUNE } from '../battle/sim';
import type { BossConfig, StageRules, Well } from '../battle/sim';
import { decide, aimCannon, aimFrom, AiProfile } from '../battle/ai';
import { summonShooters } from '../battle/bossLate';
import { WardFx, PortalFx, InkCatFx, WellFx, GravityFx, StarTellFx, SeaIceFx, FogEyeFx, CoreMarker, wizardDecal } from '../battle/boss/lateRigs';
import { preUlt, atUlt, UltMarks, UltCtx } from '../battle/ultFx';
import { MatchupPanel, effLabel } from '../battle/ui/matchup';
import { makeBattle, enemyProfile, volleySigma, aiSeed, volleyAim, WATER_Y as SIM_WATER_Y } from '../battle/autoplay';
import { CatStatusView, playKO, playOverboard } from '../battle/catFx';
import { SkyLife } from '../battle/sky';
import { CatState, ShotDef } from '../battle/types';
import { Particles } from '../fx/particles';
import { Shaker, flash, onomatopoeia, floatText, time, speedLines, sparkles } from '../fx/juice';
import { sfx } from '../core/audio';
import { C, F } from '../ui/theme';
import { txt, poster } from '../ui/widgets';
import { iconText } from '../ui/elementIcon';
import { BattleCat, elementFx, preloadCats } from '../art/catArt';
import { dotTexture, glowTexture, halftoneTexture } from '../art/textures';
import { CrewCard, BattleTopBar, RuleStrip } from '../battle/hud';
import { LabelLanes, reactionPlate, tagLabel, REACTION_INFO } from '../battle/labels';
import { GargoyleWings, ThroatFx, KrakenRig, BubbleFx, RainFx } from '../battle/boss/rigs';
import { koRank } from '../state/sys/ranks';
import { settings } from '../core/settings';
import { fmt } from '../core/format';
import { G } from '../state/game';

export const WATER_Y = SIM_WATER_Y;

export interface BattleResult {
  won: boolean;
  reason: VictoryReason | null;
  turns: number;
  modulesDestroyed: number;
  damageDealt: number;
  catsLost: number;
  perfect: boolean;
  /** uid of the player cat that dealt the most damage */
  mvp?: string;
  /** K.O. credited per player cat uid (modules destroyed + cats knocked out) → ranks */
  kos?: Record<string, number>;
  /** fraction of the player's structure lost (repair clock) */
  hullLost?: number;
  /** elemental reactions that happened in this battle (unique, in order) — newspaper headlines */
  reactions?: string[];
  /** fraction of the ENEMY structure destroyed (story battles grade on it: Barco del Vacío) */
  enemyHullLost?: number;
}

export interface BattleIntro {
  kind: 'boss' | 'elite' | 'errand';
  /** small stamp: "JEFE 2", "ÉLITE", "ENCARGO" */
  tag: string;
  title: string;
  subtitle?: string;
  /** rule lines (may contain {fire}/{storm}… element tokens) */
  lines: string[];
  color: number;
  /** cat art for the portrait */
  slug?: string;
}

export interface BattleSpec {
  player: Omit<SideSetup, 'origin' | 'flip'>;
  enemy: Omit<SideSetup, 'origin' | 'flip'>;
  playerName: string;
  enemyName: string;
  captain?: string;
  captainLine?: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'boss';
  palette?: { skyTop: number; skyBottom: number; sea: number; seaDark: number };
  seed?: number;
  /** shown numbers = internal × displayMul (numbers grow with progress; TTK stays) */
  displayMul?: number;
  playerStyle?: ShipStyleId;
  enemyStyle?: ShipStyleId;
  meta?: {
    zone: number;
    stage: number;
    key: string;
    boss: boolean;
    ep: number;
    sp: number;
    weaponMk?: number;
    /** Mk of the enemy ship's weapons (same accuracy rule as yours) */
    enemyWeaponMk?: number;
    /** hidden stage knobs, shown in the pre-battle why + the REFORZADO chip */
    tune?: { hull: number; crewHp: number; dmg: number; stage: number };
    enemyLevel?: number;
    special?: string;
    errand?: string;
    gearNotes?: string[];
    conductionBonus?: number;
    previewBonus?: number;
    noPreview?: boolean;
  };
  mode?: 'siege' | 'duel';
  /** AI personality from content (afinador, demoledor, elementalista…) */
  personality?: string;
  boss?: BossConfig;
  rules?: StageRules;
  intro?: BattleIntro;
  /** sudden-death turn (default 10, 0 = off) */
  suddenDeath?: number;
  onEnd: (r: BattleResult) => void;
}

const ONO: Record<string, [string, number]> = {
  fire: ['¡FWOOSH!', C.orange],
  water: ['¡SPLASH!', C.cyan],
  electric: ['¡ZZZAP!', C.yellow],
  earth: ['¡KRAK!', 0xe0b77a],
  ice: ['¡CRASH!', 0xc6f0e4],
  wind: ['¡FWOOM!', 0xc6f0e4],
  nature: ['¡CRUNCH!', 0xd4f27a],
  magic: ['¡ZING!', 0xff7ab8],
  spirit: ['¡BUUU!', 0xffffff],
  cosmic: ['¡VWOOM!', 0x00e5ff],
  void: ['¡...!', 0xff2e88],
  neutral: ['¡BOOM!', C.yellow],
};

const PHASE_NOTE: Record<string, string[]> = {
  'arcanist:2': ['TELETRANSPORTE: PORTALES', 'Lo que entra por un portal sale por el otro… y CAMBIA DE DUEÑO. Los fantasmas punteados: donde se abren el próximo turno'],
  'arcanist:3': ['¡GRIMORIO ABIERTO!', 'Gatos de tinta: son de papel ({fire} x2) y disparan runas. Su núcleo recibe x1.2 (x1.5 el turno después de invocar)'],
  'star:2': ['INGRAVIDEZ: GRAVEDAD x0.55', 'Todo flota más (tus tiros también). Sus escombros caen sobre TI. Cada 3 turnos carga Lluvia de Estrellas'],
  'star:3': ['¡ABAJO ES ARRIBA!', 'Sobre su barco la gravedad está invertida: tira recto o bájale el arco'],
  'leviathan:2': ['CASCO DE AGUA VIVA', 'Se sumerge: solo {storm} rayo y torpedos le pegan. Cada 3 turnos sale a respirar: ¡el Espiráculo! {water} Agua y ráfagas congelan el mar y lo atrapan'],
  'leviathan:3': ['EL MAR SE TRAGA TODO', 'Distraxia borra 1 módulo tuyo por turno: pégale a su ojo para que parpadee. ¡Tus ultimates al 100%!'],
  'gargoyle:2': ['LLUEVE: TODO QUEDA MOJADO CADA TURNO', 'Lo Mojado conduce {storm} y apaga {fire}'],
  'gargoyle:3': ['¡LA GÁRGOLA VUELA! SU BARCO YA NO DISPARA', 'Derríbala: es un blanco volador'],
  'kraken:2': ['NUEVA MECÁNICA: ESCUDOS', 'La burbuja anula 1 impacto por turno. Rómpela con {storm} (Sobrecarga) o con disparos múltiples'],
  'kraken:3': ['INMERSIÓN', 'Cada 2 turnos se hunde: bajo el agua solo le pegan {storm} y torpedos {water}'],
  'sardina:3': ['¡FUEGO A DISCRECIÓN!', 'Dispara dos veces por turno'],
};

type Chip = { text: string; color: number; ink?: number; hot?: boolean };

export class BattleScene extends Scene {
  sim!: Battle;
  camRoot = new Container();
  world = new Container();
  /** world-space fx layer (zooms with the camera) */
  wfx = new Container();
  sky!: SkyLife;
  statusViews = new Map<string, CatStatusView>();
  cam = { x: W / 2, y: H / 2, z: 1, tx: W / 2, ty: H / 2, tz: 1 };
  follow: Container | null = null;
  /** world bbox the camera must keep visible while following a projectile (target ship) */
  followBox: { x: number; y: number; w: number; h: number } | null = null;
  sinking = new Set<Container>();
  shownExposed = new Set<string>();
  bossPhase = 1;
  phaseQueue: number[] = [];
  /** where this turn's cat shot landed (volley target) */
  volleyTarget: { x: number; y: number } | null = null;
  /** elevation (rad) of the last player shot, for the 'lobbed shot' mission */
  lastElevation = 0;
  sea!: Sea;
  ships: AnimeShipView[] = [];
  catViews = new Map<string, BattleCat>();
  debris = new Container();
  fxp = new Particles();
  aimG = new Graphics();
  /** ghost of your previous shot (dotted) + its numbers: so you can repeat it or correct it */
  lastAimG = new Graphics();
  aimReadout = txt('', { fontFamily: F.poster, fontSize: 30, fill: C.paper, stroke: { color: C.ink, width: 6, join: 'round' } });
  lastShot: { angle: number; power: number; pts: { x: number; y: number }[]; shooter: string } | null = null;
  ui = new Container();
  overlay = new Container();
  shaker = new Shaker(this.world);
  top!: BattleTopBar;
  ruleE!: RuleStrip;
  ruleP!: RuleStrip;
  cards: CrewCard[] = [];
  selected: string = '';
  ultArmed = false;
  phase: 'intro' | 'aim' | 'flight' | 'enemy' | 'end' = 'intro';
  dragging = false;
  dragStart = { x: 0, y: 0 };
  aim = { angle: -0.7, power: 850 };
  aiMemory = new Map<string, number>();
  stats = { modulesDestroyed: 0, damageDealt: 0, catsLost: 0 };
  dmgBy = new Map<string, number>();
  /** damage dealt to us by each enemy cat (vengativo) */
  dmgFrom = new Map<string, number>();
  kos: Record<string, number> = {};
  /** the cat that shot this turn (the volley's K.O. count for it) */
  turnShooter = '';
  fast = false;
  /** extra cat shots left this turn (Gorrión turn 1) */
  shotsLeft = 0;
  labels = new LabelLanes();
  prof!: AiProfile;
  // boss rigs
  wings: GargoyleWings | null = null;
  throat: ThroatFx | null = null;
  kraken: KrakenRig | null = null;
  bubbles: (BubbleFx | null)[] = [null, null];
  rain: RainFx | null = null;
  flyer: { cat: BattleCat; x: number; y: number } | null = null;
  // bosses 4–6 + ultimates
  ward: WardFx | null = null;
  portalFx: PortalFx | null = null;
  inks = new Map<number, InkCatFx>();
  wellFx = new Map<Well, WellFx>();
  gravityFx: GravityFx | null = null;
  starTell: StarTellFx | null = null;
  seaIce: SeaIceFx | null = null;
  fogEye: FogEyeFx | null = null;
  coreMarker: CoreMarker | null = null;
  ultMarks = new UltMarks();
  matchup = new MatchupPanel();
  private healAcc = 0;
  private wetDeckShown = false;
  private t = 0;
  private ruleSig = '';
  private shipsLayer!: Container;
  private pierceAcc = 0;
  private reactions: string[] = [];
  private infoAt = new Map<string, number>();
  private lastOno = 0;

  constructor(public spec: BattleSpec) {
    super();
  }

  /** format a damage number for display (scaled by progress) */
  show(n: number) {
    return fmt(n * (this.spec.displayMul ?? 1));
  }

  override async enter() {
    this.bleed = null; // the sea extends past the design box (battle/sea.ts)
    const sp = this.spec;
    this.sim = makeBattle(sp, sp.seed ?? Math.floor(Math.random() * 1e9));
    this.prof = enemyProfile(sp);
    const slugs = [...sp.player.cats, ...sp.enemy.cats].map((c) => c.slug);
    if (sp.intro?.slug) slugs.push(sp.intro.slug);
    await preloadCats(slugs);

    this.sea = new Sea(WATER_Y, sp.palette);
    this.sky = new SkyLife(WATER_Y);
    this.sky.wind = this.sim.wind;
    this.camRoot.addChild(this.world);
    this.addChild(this.camRoot, this.ui, this.overlay);
    const shipsLayer = (this.shipsLayer = new Container());
    this.world.addChild(this.sea, this.sky, shipsLayer, this.debris, this.sea.frontLayer(), this.fxp, this.ultMarks, this.lastAimG, this.lastLabel, this.aimG, this.aimReadout, this.wfx);
    for (let side = 0; side < 2; side++) {
      const s = this.sim.sides[side];
      const style: ShipStyleId = side === 0 ? sp.playerStyle ?? 'pirate' : sp.enemyStyle ?? 'rat';
      const v = new AnimeShipView(s.ship, s.setup.flip, style, { waterLocalY: WATER_Y - s.setup.origin.y });
      v.autoReact = false;
      v.position.set(s.setup.origin.x, s.setup.origin.y);
      v.baseY = v.y;
      shipsLayer.addChild(v);
      this.ships.push(v);
      for (const c of s.cats) {
        const isCap = side === 1 && !!sp.boss && c.def.uid === sp.boss.captain;
        const gargoyle = isCap && sp.boss?.id === 'gargoyle';
        const bc = new BattleCat(c.def.slug, c.def.elements[0] ?? 'fire', CELL * 3.1 * (isCap ? 1.3 : 1), s.setup.flip);
        if (CAT_BY_ID.has(c.def.catId)) applyCatTint(bc.sprite, c.def.catId);
        if (side === 1) {
          // pirate treatment: desaturated enemies (the gargoyle is stone-grey)
          const cm = new ColorMatrixFilter();
          cm.saturate(gargoyle ? -0.85 : -0.35, true);
          if (gargoyle) cm.brightness(0.8, true);
          bc.sprite.filters = [cm, ...(bc.sprite.filters ?? [])];
        }
        const m = s.ship.modules[c.room];
        const p = v.cellPos(s.setup.flip ? m.x + m.w - 1 : m.x, m.y);
        bc.position.set(p.x + CELL, p.y + m.h * CELL + 2);
        v.decor.addChild(bc);
        this.catViews.set(c.def.uid, bc);
        this.statusViews.set(c.def.uid, new CatStatusView(bc));
        if (gargoyle) {
          this.wings = new GargoyleWings(bc.size, s.setup.flip);
          bc.addChildAt(this.wings, 0);
          bc.addChild(this.wings.eyesLayer());
        }
        if (isCap && sp.boss?.id === 'arcanist') bc.addChild(wizardDecal(bc.size, s.setup.flip));
        // a cat is a card: the enemy's copy shows its level, so you know what you're up against
        if (side === 1 && sp.mode !== 'duel') {
          const lv = txt(`Nv ${c.def.level}`, { fontFamily: F.poster, fontSize: 18, fill: C.paper, stroke: { color: C.ink, width: 5 } });
          lv.anchor.set(0.5, 0);
          lv.position.set(bc.x, bc.y + 4);
          v.decor.addChild(lv);
        }
      }
    }
    this.buildBossRigs();
    this.buildHud();
    if (import.meta.env.DEV) (window as unknown as { __battle: BattleScene }).__battle = this;
    this.eventMode = 'static';
    this.hitArea = { contains: () => true };
    this.on('pointerdown', this.down, this);
    this.on('globalpointermove', this.move, this);
    this.on('pointerup', this.up, this);
    this.on('pointerupoutside', this.up, this);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKeyUp);
    await this.intro();
    this.playerTurn();
  }

  private shipBox(side: number) {
    const v = this.ships[side];
    return { x: v.x, y: v.baseY, w: v.width, h: v.height };
  }

  private buildBossRigs() {
    const sp = this.spec;
    const es = this.sim.sides[1];
    const at = () => this.world.getChildIndex(this.debris);
    if (sp.boss?.id === 'gargoyle') {
      const th = es.ship.modules.find((m) => m.tag === 'throat');
      if (th) {
        this.throat = new ThroatFx(th.w * CELL, th.h * CELL);
        const c = this.sim.roomCenter(1, th.id);
        this.throat.position.set(c.x, c.y);
        this.world.addChildAt(this.throat, at());
      }
    }
    if (sp.boss?.id === 'kraken') {
      this.kraken = new KrakenRig(es.parts, WATER_Y, this.shipBox(1));
      this.world.addChildAt(this.kraken, at());
      this.world.addChildAt(this.kraken.back, this.world.getChildIndex(this.shipsLayer));
    }
    for (let side = 0; side < 2; side++) {
      const s = this.sim.sides[side];
      if (s.bubbleKind || (side === 1 && sp.boss?.id === 'kraken')) {
        const b = new BubbleFx(this.shipBox(side), side === 1 && sp.boss?.id === 'kraken' ? 'static' : 'bubble');
        this.world.addChildAt(b, at());
        this.bubbles[side] = b;
        if (s.bubble > 0) b.setOn(true);
      }
    }
    // Pararrayos: a lightning rod on top of the enemy mast
    if (sp.rules?.rod?.includes(1)) {
      const mast = es.ship.modules.find((m) => m.kind === 'mast');
      if (mast) {
        const v = this.ships[1];
        const p = v.cellPos(mast.x, mast.y);
        const rod = new Graphics();
        rod.moveTo(0, 0).lineTo(0, -70).stroke({ width: 9, color: C.ink }).moveTo(0, 0).lineTo(0, -70).stroke({ width: 4, color: 0xb9c4d0 });
        for (let i = 0; i < 3; i++) rod.ellipse(0, -18 - i * 16, 12 - i * 2, 4).fill(0xffd400).stroke({ width: 2, color: C.ink });
        rod.circle(0, -76, 9).fill(0xffe14a).stroke({ width: 3, color: C.ink });
        rod.position.set(p.x + CELL / 2, p.y - 6);
        v.decor.addChild(rod);
        gsap.to(rod, { alpha: 0.75, duration: 0.15, yoyo: true, repeat: -1, ease: 'steps(1)' });
      }
    }
    if (sp.boss?.id === 'gargoyle' || sp.rules?.wetAll) {
      this.rain = new RainFx(W, H);
      this.ui.addChildAt(this.rain, 0);
      if (sp.rules?.wetAll) this.rain.setOn(true);
    }
    // ---- bosses 4–6
    const id = sp.boss?.id;
    if (es.ward) {
      this.ward = new WardFx(this.shipBox(1), es.ward.max);
      this.world.addChildAt(this.ward, at());
    }
    if (id === 'arcanist') {
      this.portalFx = new PortalFx();
      this.world.addChildAt(this.portalFx, at());
      for (const p of es.parts) {
        if (p.kind !== 'ink') continue;
        const f = new InkCatFx(p);
        this.world.addChildAt(f, at());
        this.inks.set(p.id, f);
      }
    }
    if (id === 'star' || id === 'leviathan') {
      this.gravityFx = new GravityFx(W, H);
      this.world.addChildAt(this.gravityFx, this.world.getChildIndex(this.shipsLayer));
    }
    if (id === 'star') {
      this.starTell = new StarTellFx();
      this.world.addChildAt(this.starTell, at());
    }
    if (id === 'leviathan') {
      const b = this.shipBox(1);
      this.seaIce = new SeaIceFx(b.x - 150, b.x + b.w + 60, WATER_Y);
      this.world.addChildAt(this.seaIce, at());
      const fog = es.parts.find((p) => p.kind === 'fog');
      if (fog) {
        this.fogEye = new FogEyeFx(fog);
        this.world.addChildAt(this.fogEye, at());
      }
    }
    if (id === 'leviathan' || id === 'star' || id === 'arcanist') {
      this.coreMarker = new CoreMarker();
      this.world.addChildAt(this.coreMarker, at());
    }
    this.syncLate();
  }

  /** keep the late-boss / ultimate visuals in step with the sim (cheap; called on every refresh) */
  syncLate() {
    const sim = this.sim;
    const B = sim.boss;
    const es = sim.sides[1];
    // wells: module wells, black holes, Abisa's lure
    const wells = sim.wellList();
    for (const [w, fx] of this.wellFx) {
      if (wells.some((k) => k === w || (k.kind === 'well' && w.kind === 'well' && k.x === w.x && k.y === w.y))) continue;
      this.wellFx.delete(w);
      fx.close();
    }
    for (const w of wells) {
      const known = [...this.wellFx.keys()].some((k) => k === w || (k.kind === 'well' && w.kind === 'well' && k.x === w.x && k.y === w.y));
      if (known) continue;
      const fx = new WellFx(w.x, w.y, w.r, w.kind);
      this.world.addChildAt(fx, this.world.getChildIndex(this.debris));
      this.wellFx.set(w, fx);
    }
    this.ward?.setLayers(es.ward?.layers ?? 0);
    this.portalFx?.set(sim.portals, sim.portalNext);
    if (this.gravityFx) {
      const an = sim.field.anti;
      this.gravityFx.mode = an ? 2 : sim.field.gMul !== 1 ? 1 : 0;
      this.gravityFx.anti = an ? { x0: an.x0, x1: an.x1, y0: Math.max(0, an.y0), y1: WATER_Y } : null;
    }
    if (this.starTell && B) {
      const ps = sim.sides[0];
      const targets = B.charging ? B.starTargets.map((x) => ({ x, y: this.topOf(0, x) })) : [];
      const core = es.ship.modules.find((m) => m.kind === 'core' && m.alive);
      this.starTell.set(targets, B.charging && core ? sim.roomCenter(1, core.id) : null);
      void ps;
    }
    if (this.seaIce && B) {
      this.seaIce.level = B.freeze;
      this.seaIce.frozen = B.frozen > 0;
      const c2 = es.ship.modules.find((m) => m.tag === 'core2');
      this.seaIce.spout = B.breathing && c2?.alive ? sim.roomCenter(1, c2.id) : null;
    }
    if (this.fogEye && B) {
      const fog = es.parts.find((p) => p.kind === 'fog');
      if (fog?.active && !this.fogEye.visible) this.fogEye.show();
      const m = B.devour !== null ? sim.roomCenter(0, B.devour) : null;
      this.fogEye.setMark(B.devour !== null && !B.fogHit ? m : null);
    }
    if (this.coreMarker && B) {
      let core = es.ship.modules.find((m) => m.kind === 'core' && m.alive);
      let text = '';
      let hot = false;
      if (B.id === 'leviathan') {
        core = es.ship.modules.find((m) => m.tag === `core${B.phase}` && m.alive);
        const exposed = B.phase !== 2 || B.breathing || B.frozen > 0;
        text = B.phase === 1 ? 'NÚCLEO 1/3: CORAZÓN DE CORAL' : B.phase === 2 ? (exposed ? '¡ESPIRÁCULO EXPUESTO!' : 'NÚCLEO 2/3: ESPIRÁCULO (SUMERGIDO)') : 'NÚCLEO 3/3: EL CORAZÓN HONDO';
        hot = exposed && B.phase === 2;
      } else if (B.id === 'star') {
        text = B.charging ? '¡NÚCLEO-ESTRELLA x2! PÉGALE Y LA CANCELAS' : '';
        hot = B.charging;
        if (!B.charging) core = undefined;
      } else if (B.id === 'arcanist') {
        text = B.phase >= 3 ? (B.grimoire > 0 ? '¡GRIMORIO ABIERTO x1.5!' : 'GRIMORIO x1.2') : '';
        hot = B.grimoire > 0;
        if (B.phase < 3) core = undefined;
      }
      this.coreMarker.set(core && text ? sim.roomCenter(1, core.id) : null, text, hot);
    }
    for (const [id, f] of this.inks) {
      const p = es.parts.find((k) => k.id === id);
      if (p?.alive && p.active && f.dead) f.summon();
    }
    this.ultMarks.setEclipse(sim.sides[0].buffs.blind > 0 || sim.sides[1].buffs.blind > 0);
  }

  /** world y of the top of a ship at world x */
  private topOf(side: number, x: number) {
    const s = this.sim.sides[side];
    for (let gy = 0; gy < s.ship.rows; gy++) {
      const g = this.sim.toGrid(side, x, s.setup.origin.y + gy * CELL + CELL / 2);
      if (s.ship.get(g.x, gy)) return s.setup.origin.y + gy * CELL;
    }
    return WATER_Y - 40;
  }

  override exit() {
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKeyUp);
    this.shaker.destroy();
    this.sky?.destroy();
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.code === 'Space') this.fast = true;
    if (this.phase !== 'aim') return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= this.cards.length) this.select(this.cards[n - 1].cat!.def.uid);
  };
  private onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') this.fast = false;
  };

  // ---------------------------------------------------------------- HUD
  buildHud() {
    this.top = new BattleTopBar(this.spec.playerName, this.spec.enemyName);
    this.ui.addChild(this.top);
    this.top.setWind(this.sim.wind);
    this.ruleE = new RuleStrip(1890, 100);
    this.ruleP = new RuleStrip(650, 100);
    this.ui.addChild(this.ruleE, this.ruleP);
    const s = this.sim.sides[0];
    s.cats.forEach((c, i) => {
      const owned = G.s.cats.find((k) => k.uid === c.def.uid);
      const card = new CrewCard(
        c,
        () => this.select(c.def.uid),
        () => this.armUlt(c),
        { kos: owned?.kos ?? 0 },
      );
      card.position.set(40 + i * 220, H - 172);
      this.ui.addChild(card);
      this.cards.push(card);
    });
    const cannons = this.sim.cannons(0).length;
    const auto = new Container();
    const cg = new Graphics();
    cg.roundRect(0, 6, 34, 14, 6).fill(0x30344a).stroke({ width: 3, color: C.ink });
    cg.circle(8, 22, 6).fill(0x6e3f22).stroke({ width: 2.5, color: C.ink });
    cg.circle(26, 22, 6).fill(0x6e3f22).stroke({ width: 2.5, color: C.ink });
    const at = txt(`CAÑONES AUTOMÁTICOS ×${cannons}\nDisparan solos al final de tu turno`, { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.paper, lineHeight: 20 });
    at.position.set(44, 0);
    auto.addChild(cg, at);
    auto.position.set(40 + s.cats.length * 220 + 10, H - 120);
    this.ui.addChild(auto);
    const hint = txt('ARRASTRA PARA APUNTAR · SUELTA PARA DISPARAR · 1-7 ELIGE GATO · ESPACIO ACELERA', {
      fontFamily: F.ui,
      fontWeight: '700',
      fontSize: 16,
      fill: C.paper,
    });
    hint.position.set(W - hint.width - 30, H - 34);
    this.ui.addChild(hint);
    if (isTouch()) hint.text = 'ARRASTRA PARA APUNTAR · SUELTA PARA DISPARAR · TOCA UNA CARTA PARA ELEGIR GATO';
    // phones / wide screens: the crew cards stick to the real bottom-left corner and grow; the top bar
    // to the real top (never wider than the screen)
    const bottom = new Container();
    const top = new Container();
    for (const c of [...this.cards, auto]) {
      c.position.set(c.x, c.y - H);
      bottom.addChild(c);
    }
    bottom.addChild(this.matchup);
    for (const c of [this.top, this.ruleE, this.ruleP]) {
      c.position.set(c.x - W / 2, c.y);
      top.addChild(c);
    }
    this.ui.addChild(bottom, top);
    const lay = () => {
      const v = game.view;
      const k = Math.max(1, Math.min(1.5, 0.5 / Math.max(0.01, game.scale)));
      bottom.scale.set(k);
      bottom.position.set(v.x, v.y + v.h);
      top.scale.set(Math.min(k, v.w / W));
      top.position.set(v.x + v.w / 2, v.y);
      hint.visible = k === 1;
    };
    lay();
    const off = game.onView(lay);
    this.once('destroyed', () => off());
  }

  refreshCards() {
    if (this.sim) {
      for (let side = 0; side < 2; side++)
        for (const c of this.sim.sides[side].cats) {
          if (!c.exposed || c.ko || c.overboard || this.shownExposed.has(c.def.uid) || this.sim.isFlying(c)) continue;
          this.shownExposed.add(c.def.uid);
          const bc = this.catViews.get(c.def.uid);
          if (!bc || bc.destroyed) continue;
          const y0 = bc.y;
          gsap.timeline().to(bc, { y: y0 - 90, duration: 0.25, ease: 'power2.out' }).to(bc, { y: y0, duration: 0.3, ease: 'bounce.out' });
          gsap.to(bc, { rotation: side === 0 ? -0.4 : 0.4, duration: 0.25, yoyo: true, repeat: 1 });
          const gp = this.wfx.toLocal(bc.getGlobalPosition());
          this.flt(gp.x, gp.y - 170, '¡GATO SUELTO!', { color: C.red, size: 44, font: F.poster, rise: 50, dur: 1.4 });
          sfx('meow', 1.4);
        }
    }
    if (!G.s.flags.first_meter_full && this.sim?.sides[0].cats.some((c) => c.ultCharge >= 1)) G.flag('first_meter_full');
    for (let side = 0; side < 2; side++)
      for (const c of this.sim.sides[side].cats) {
        const sv = this.statusViews.get(c.def.uid);
        if (!sv) continue;
        if (!c.ko) sv.set(c.fx);
        sv.setStun(!c.ko && c.stunned > 0 && c.fx.frozen <= 0);
      }
    for (const c of this.cards) {
      c.draw();
      c.ultBtn.visible = !!c.cat && this.phase === 'aim' && this.sim.canUlt(c.cat) && c.cat.cooldown <= 0;
    }
    this.top.hullA.set(this.sim.cfg.mode === 'duel' ? this.sim.hullPct(0) : this.sim.hullBar(0));
    this.top.hullB.set(this.sim.cfg.mode === 'duel' ? this.sim.hullPct(1) : this.sim.hullBar(1));
    this.top.setWind(this.sim.wind);
    this.top.turn.text = `TURNO ${this.sim.turn}`;
    this.refreshRules();
    this.syncLate();
    this.refreshMatchup();
  }

  /** resistances card above the selected cat (only while aiming) */
  refreshMatchup() {
    const cat = this.phase === 'aim' ? this.sim.sides[0].cats.find((k) => k.def.uid === this.selected) : undefined;
    this.matchup.update(this.sim, cat, cat ? this.currentShot() : undefined);
    // pinned over your own ship (bottom-left): never covers the enemy you're aiming at
    const card = this.cards[0];
    if (card && this.matchup.visible) this.matchup.position.set(card.x - 20, card.y - this.matchup.height - 14);
  }

  /** boss/rule chips under the hull bars */
  refreshRules() {
    if (!this.ruleE) return;
    const b = this.sim.boss;
    const items: Chip[] = [];
    const es = this.sim.sides[1];
    if (b?.id === 'gargoyle') {
      const throat = es.ship.modules.find((m) => m.tag === 'throat');
      if (throat?.alive) items.push({ text: `RONRONEO ${b.purr}/3`, color: b.purr >= 2 ? C.pinkHot : C.mint, hot: b.purr >= 2 });
      items.push({ text: 'PIEL DE PIEDRA', color: 0xb9b2a0 });
      if (b.phase >= 2) items.push({ text: 'LLUVIA', color: C.cyan });
      if (b.flying) items.push({ text: '¡VUELA!', color: C.yellow, hot: true });
    }
    if (b?.id === 'kraken') {
      const n = es.parts.filter((p) => p.kind === 'tentacle' && p.alive).length;
      if (n) items.push({ text: `TENTÁCULOS x${n}`, color: 0xd8a8ee });
      items.push(b.eyeOpen ? { text: '¡OJO ABIERTO!', color: C.yellow, hot: true } : { text: `PICO: ABRE EN ${Math.max(1, b.eyeIn)}`, color: 0x9b5ab8, ink: C.paper });
      if (es.bubble > 0 && es.bubbleKind) items.push({ text: 'BURBUJA', color: C.yellow });
      if (b.submerged) items.push({ text: 'SUMERGIDO', color: C.megaBlue, ink: C.paper, hot: true });
    }
    if (b?.id === 'arcanist') {
      if (es.ward && es.ward.layers > 0) items.push({ text: `ESCUDO ARCANO ${es.ward.layers}/${es.ward.max}`, color: 0xc77dff });
      if (this.sim.portals) items.push({ text: 'PORTALES', color: 0xffb02e });
      const inks = es.parts.filter((p) => p.kind === 'ink' && p.alive && p.active).length;
      if (inks) items.push({ text: `GATOS DE TINTA x${inks}`, color: C.paper });
      if (b.phase >= 3) items.push(b.grimoire > 0 ? { text: 'GRIMORIO ABIERTO x1.5', color: C.yellow, hot: true } : { text: 'GRIMORIO x1.2', color: 0xd8a8ee });
    }
    if (b?.id === 'star') {
      const wells = es.ship.modules.filter((m) => m.tag === 'well' && m.alive).length;
      if (wells) items.push({ text: `POZOS DE GRAVEDAD x${wells}`, color: 0xb9a7ff });
      if (this.sim.field.anti) items.push({ text: 'ABAJO ES ARRIBA', color: 0xc77dff, hot: true });
      else if (this.sim.field.gMul !== 1) items.push({ text: `GRAVEDAD x${this.sim.field.gMul}`, color: 0xe8c45a });
      if (b.charging) items.push({ text: 'LLUVIA DE ESTRELLAS: ¡PÉGALE AL NÚCLEO!', color: C.yellow, hot: true });
      else if (b.phase >= 2) items.push({ text: `LLUVIA EN ${Math.max(1, b.starIn)}`, color: 0xe8c45a });
      if (b.debris > 0) items.push({ text: `ESCOMBROS FLOTANDO x${Math.min(4, b.debris)}`, color: 0xb9b2a0 });
    }
    if (b?.id === 'leviathan') {
      items.push({ text: 'NO SE HUNDE', color: 0x9fb4c8 });
      if (es.ward && es.ward.layers > 0) items.push({ text: `ESCAMAS ARCANAS ${es.ward.layers}/${es.ward.max}`, color: 0xc77dff });
      items.push({ text: `NÚCLEO ${b.phase}/3`, color: C.yellow });
      if (b.submerged) items.push({ text: 'SUMERGIDO', color: C.megaBlue, ink: C.paper, hot: true });
      if (b.breathing) items.push({ text: '¡SALE A RESPIRAR!', color: C.yellow, hot: true });
      if (b.frozen > 0) items.push({ text: 'MAR CONGELADO', color: 0xdff8ff, hot: true });
      else if (b.phase === 2) items.push({ text: `HIELO ${b.freeze}/3`, color: 0x7fd8ff });
      if (b.devour !== null && !b.fogHit) items.push({ text: 'DISTRAXIA: ¡PÉGALE AL OJO!', color: 0xc77dff, hot: true });
    }
    if (this.sim.wells.some((w) => w.kind === 'hole')) items.push({ text: 'AGUJERO NEGRO', color: 0xff7ab8, hot: true });
    if (es.buffs.stone > 0) items.push({ text: `CORAZÓN DE PIEDRA ${es.buffs.stone}`, color: 0xc4bdab });
    if (es.buffs.blind > 0) items.push({ text: `ECLIPSADO ${es.buffs.blind}`, color: 0xff7ab8 });
    if (es.buffs.fin.length) items.push({ text: `FIN x${es.buffs.fin.length}`, color: C.paper });
    const tune = this.spec.meta?.tune;
    if (tune && tune.stage > 1.05) items.push({ text: `REFORZADO x${tune.stage.toFixed(1)}`, color: 0xb9b2a0 });
    if (b?.enraged) items.push({ text: 'ENFURECIDO', color: C.red, ink: C.paper });
    const r = this.spec.rules;
    if (r?.wetDeck?.includes(1)) items.push({ text: 'CUBIERTA MOJADA', color: 0x7fd8ff });
    if (r?.rod?.includes(1)) items.push({ text: es.rodUsed ? 'PARARRAYOS (USADO)' : 'PARARRAYOS', color: es.rodUsed ? 0x8a95a3 : C.yellow });
    if (r?.regrow?.includes(1)) items.push({ text: 'ENREDADERAS', color: 0x7ed957 });
    if (r?.wetAll) items.push({ text: 'DILUVIO', color: C.cyan });
    if (this.sim.turn >= 10 && this.spec.mode !== 'duel') items.push({ text: 'MUERTE SÚBITA', color: C.red, ink: C.paper });
    const pItems: Chip[] = [];
    const ps = this.sim.sides[0];
    if (ps.bubbleKind) pItems.push(ps.bubble > 0 ? { text: `BURBUJA x${ps.bubble}`, color: C.cyan } : { text: 'BURBUJA: RECARGA', color: 0x8a95a3 });
    if (ps.buffs.stone > 0) pItems.push({ text: `CORAZÓN DE PIEDRA ${ps.buffs.stone}`, color: 0xc4bdab });
    if (ps.buffs.blind > 0) pItems.push({ text: `¡ECLIPSE! SIN VISTA PREVIA ${ps.buffs.blind}`, color: 0xff7ab8, hot: true });
    if (ps.buffs.empower > 0) pItems.push({ text: 'PRÓXIMO TIRO x2', color: C.yellow, hot: true });
    if (ps.buffs.fin.length) pItems.push({ text: `FIN x${ps.buffs.fin.length}: ¡TUMBA A SU MERLINA!`, color: C.paper, hot: true });
    if (this.sim.wells.some((w) => w.kind === 'lure' && w.affects === 0)) pItems.push({ text: 'CEBO: TUS TIROS SE VAN AL MAR', color: 0x7fd8ff, hot: true });
    const sig = JSON.stringify([items, pItems]);
    if (sig === this.ruleSig) return;
    this.ruleSig = sig;
    this.ruleE.set(items);
    this.ruleP.set(pItems);
  }

  select(uid: string) {
    if (this.phase !== 'aim') return;
    const sc = this.sim.sides[0].cats.find((k) => k.def.uid === uid);
    if (!sc || sc.ko || sc.cooldown > 0 || sc.stunned > 0) {
      sfx('error');
      return;
    }
    this.selected = uid;
    this.ultArmed = false;
    for (const c of this.cards) c.setSelected(c.cat?.def.uid === uid);
    const bc = this.catViews.get(uid);
    if (bc) {
      gsap.fromTo(bc.scale, { x: 1.15, y: 0.85 }, { x: 1, y: 1, duration: 0.4, ease: 'elastic.out(1.2,0.4)' });
      gsap.fromTo(bc, { y: bc.y - 26 }, { y: bc.y, duration: 0.35, ease: 'bounce.out' });
      bc.sprite.emote('happy');
      sfx('meow', 0.9 + Math.random() * 0.3);
    }
    this.refreshCards();
  }

  /** boss volleys resolved by the sim outside a cat shot (star rain, falling debris): animate them */
  async playQueued() {
    while (this.sim.queued.length) {
      const q = this.sim.queued.shift()!;
      if (!q.paths.length) {
        for (const e of q.events) this.applyEvent(e);
        continue;
      }
      this.turnBanner(q.label, q.side === 1 ? C.pinkHot : C.yellow);
      await wait(this.fast ? 150 : 500);
      await this.animateShot(q.side, 'boss', q.paths, q.events, q.shot);
      await this.checkBossPhase();
    }
  }

  armUlt(c: CatState) {
    if (this.phase !== 'aim' || !this.sim.canUlt(c)) return;
    this.select(c.def.uid);
    this.ultArmed = true;
    sfx('charge');
    const bc = this.catViews.get(c.def.uid);
    if (bc) {
      const wp = this.world.toLocal(bc.getGlobalPosition());
      sparkles(this.world, wp.x, wp.y - 60, elementFx(c.def.elements[0]).accent, 14, 160);
    }
    floatText(this.overlay, 960, 300, `ULTIMATE LISTA: ${c.def.ultimate?.name ?? ''}`, { color: elementFx(c.def.elements[0]).main, size: 50, rise: 30, dur: 1.4 });
    this.refreshMatchup();
  }

  currentShot(): ShotDef {
    const c = this.sim.sides[0].cats.find((k) => k.def.uid === this.selected)!;
    return this.ultArmed && c.def.ultimate ? c.def.ultimate : c.def.shot;
  }

  /** world-space floating text that never piles on other labels */
  flt(x: number, y: number, text: string, o: Parameters<typeof floatText>[4] = {}) {
    const size = o.size ?? 44;
    const w = text.length * size * 0.55;
    // keep the whole label on screen
    const xx = Math.max(w / 2 + 24, Math.min(W - w / 2 - 24, x));
    const yy = this.labels.place(xx, y, w, size * 1.1, ((o.dur ?? 0.9) + 0.2) * 1000);
    return floatText(this.wfx, xx, yy, text, o);
  }

  // ---------------------------------------------------------------- intro
  async intro() {
    const cap = this.sim.sides[0].cats[0];
    const capDef = cap ? CAT_BY_ID.get(cap.def.catId) : undefined;
    if (cap && capDef) {
      await playTransform(this.overlay, {
        slug: cap.def.slug,
        species: capDef.id,
        name: cap.def.name,
        element: capDef.elements[0],
        formName: capDef.battleForm.name,
        cry: capDef.battleForm.cry,
      });
    }
    if (this.spec.intro) await this.introCard(this.spec.intro);
    const banner = new Container();
    const band = new Graphics().rect(-200, -90, W + 400, 180).fill(C.ink);
    band.rotation = -0.06;
    const t = poster('¡A LA BATALLA!', 140, C.yellow, { stroke: { color: C.ink, width: 10 } });
    t.anchor.set(0.5);
    const sub = txt(`${this.spec.playerName.toUpperCase()}  VS  ${this.spec.enemyName.toUpperCase()}`, { fontFamily: F.poster, fontSize: 34, fill: C.paper });
    sub.anchor.set(0.5);
    sub.y = 92;
    banner.addChild(band, t, sub);
    banner.position.set(W / 2, H / 2 - 60);
    this.overlay.addChild(banner);
    sfx('fanfare');
    gsap.from(band.scale, { x: 0, duration: 0.3, ease: 'power3.out' });
    gsap.from(t.scale, { x: 2.4, y: 2.4, duration: 0.25, ease: 'back.out(2)', delay: 0.15 });
    this.shaker.add(0.3);
    // line-up: each cat pops
    let i = 0;
    for (const [, bc] of this.catViews) {
      gsap.fromTo(bc.scale, { x: 0, y: 0 }, { x: 1, y: 1, duration: 0.35, delay: 0.2 + i * 0.12, ease: 'back.out(3)', onStart: () => sfx('pop', 0.8 + i * 0.1) });
      i++;
    }
    if (this.spec.captainLine) this.speech(this.ships[1], this.spec.captain ?? 'Capitán', this.spec.captainLine, 2.8);
    await wait(1500);
    gsap.to(banner, { alpha: 0, y: banner.y - 40, duration: 0.3, onComplete: () => banner.destroy({ children: true }) });
    this.refreshRules();
  }

  /** anime boss / elite / errand presentation: slanted poster band, halftone, portrait, rules */
  async introCard(I: BattleIntro) {
    const layer = new Container();
    this.overlay.addChild(layer);
    const dim = new Graphics().rect(0, 0, W, H).fill({ color: C.ink, alpha: 0.88 });
    const shape = [0, 210, W, 120, W, 820, 0, 910];
    const band = new Graphics().poly(shape).fill(I.color).stroke({ width: 10, color: C.ink });
    const dots = new TilingSprite({ texture: halftoneTexture(0x000000, 14, 3), width: W, height: H });
    dots.alpha = 0.18;
    const bandMask = new Graphics().poly(shape).fill(0xffffff);
    dots.mask = bandMask;
    layer.addChild(dim, band, bandMask, dots);
    if (I.slug) {
      const gar = this.spec.boss?.id === 'gargoyle';
      const bid = this.spec.boss?.id;
      const cat = new BattleCat(I.slug, gar ? 'earth' : bid === 'kraken' ? 'electric' : bid === 'arcanist' ? 'magic' : bid === 'star' ? 'cosmic' : 'fire', 560, true);
      if (bid === 'arcanist') cat.addChild(wizardDecal(560, true));
      const cm = new ColorMatrixFilter();
      cm.saturate(gar ? -0.85 : -0.4, true);
      if (gar) cm.brightness(0.85, true);
      cat.sprite.filters = [cm, ...(cat.sprite.filters ?? [])];
      if (gar) {
        const wg = new GargoyleWings(560, true);
        cat.addChildAt(wg, 0);
        cat.addChild(wg.eyesLayer());
      }
      cat.position.set(W - 400, 900);
      layer.addChild(cat);
      gsap.from(cat, { x: W + 300, duration: 0.35, ease: 'power3.out' });
    }
    if (!I.slug && this.spec.boss?.id === 'leviathan') {
      // EL PRIMER MAR has no captain: Distraxia's eye in the violet fog
      const eye = new Graphics();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        eye.circle(Math.cos(a) * 190, Math.sin(a) * 90, 90 + (i % 3) * 20).fill({ color: 0x6b3d8a, alpha: 0.45 });
      }
      eye.ellipse(0, 0, 170, 100).fill(0xf2d9ff).stroke({ width: 14, color: C.ink });
      eye.circle(0, 0, 62).fill(0x8a2be2);
      eye.ellipse(0, 0, 18, 56).fill(C.ink);
      eye.position.set(W - 420, 560);
      layer.addChild(eye);
      gsap.from(eye.scale, { y: 0.05, duration: 0.4, ease: 'back.out(2)', delay: 0.3 });
    }
    const tag = poster(I.tag, 54, C.paper, { stroke: { color: C.ink, width: 8 } });
    tag.position.set(110, 240);
    const tagBg = new Graphics().rect(96, 244, tag.width + 28, 70).fill(C.red).stroke({ width: 5, color: C.ink });
    const title = poster(I.title.toUpperCase(), I.title.length > 22 ? 104 : 132, C.ink, { stroke: { color: C.paper, width: 10 } });
    title.position.set(100, 320);
    if (title.width > 1300) title.scale.set(1300 / title.width);
    title.rotation = -0.05;
    layer.addChild(tagBg, tag, title);
    if (I.subtitle) {
      const st = txt(I.subtitle, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 40, fill: C.ink });
      st.position.set(110, 320 + title.height + 2);
      layer.addChild(st);
    }
    I.lines.forEach((l, i) => {
      const row = new Container();
      const bg = new Graphics().rect(0, 0, 1180, 54).fill(C.ink);
      const tt = iconText(l, { fontFamily: F.poster, fontSize: 30, fill: i === 0 ? C.yellow : C.paper }, { wrap: 1140 });
      tt.position.set(18, 10);
      row.addChild(bg, tt);
      row.position.set(100, 570 + i * 66);
      layer.addChild(row);
      gsap.from(row, { x: -1300, duration: 0.3, delay: 0.25 + i * 0.12, ease: 'power3.out' });
    });
    sfx('sting');
    sfx('drumroll');
    this.shaker.add(0.4);
    gsap.from(band.scale, { y: 0, duration: 0.25, ease: 'power3.out' });
    gsap.from(title.scale, { x: 2.2, y: 2.2, duration: 0.28, ease: 'back.out(2)', delay: 0.1 });
    let skip = false;
    layer.eventMode = 'static';
    layer.hitArea = { contains: () => true };
    layer.once('pointertap', () => (skip = true));
    const t0 = performance.now();
    while (!skip && performance.now() - t0 < (settings.reduceMotion ? 1600 : 3000)) await wait(80);
    gsap.to(layer, { alpha: 0, duration: 0.25, onComplete: () => layer.destroy({ children: true }) });
  }

  speech(ship: Container, who: string, line: string, dur = 2) {
    const c = new Container();
    const t = txt(line, { fontFamily: F.comic, fontSize: 26, fill: C.ink, wordWrap: true, wordWrapWidth: 380 });
    const n = txt(who.toUpperCase(), { fontFamily: F.poster, fontSize: 18, fill: C.pinkHot });
    n.position.set(0, -26);
    const bg = new Graphics()
      .roundRect(-16, -34, Math.max(t.width, n.width) + 32, t.height + 46, 14)
      .fill(C.paper)
      .stroke({ width: 4, color: C.ink });
    c.addChild(bg, n, t);
    const p = ship.getGlobalPosition();
    const lp = this.overlay.toLocal(p);
    c.position.set(Math.min(W - 460, Math.max(20, lp.x + 40)), Math.max(150, lp.y - 150));
    this.overlay.addChild(c);
    gsap.from(c.scale, { x: 0.3, y: 0.3, duration: 0.25, ease: 'back.out(3)' });
    gsap.to(c, { alpha: 0, delay: dur, duration: 0.3, onComplete: () => c.destroy({ children: true }) });
  }

  // ---------------------------------------------------------------- turns
  async playerTurn(): Promise<void> {
    if (this.sim.winner !== null) return this.finish();
    // a fresh turn: the volley never aims at last turn's (enemy) impact on our own ship
    this.volleyTarget = null;
    const ev = this.sim.startTurn(0);
    await this.playTicks(ev);
    await this.playQueued();
    await this.checkBossPhase();
    if (this.sim.winner !== null) return this.finish();
    this.shotsLeft = this.sim.extraShots(0);
    const avail = this.sim.shooters(0);
    if (!avail.find((c) => c.def.uid === this.selected)) this.selected = avail[0]?.def.uid ?? '';
    // only accept aiming input when someone can actually shoot
    this.phase = avail.length ? 'aim' : 'flight';
    this.aimReadout.visible = false;
    this.drawLastShot(1 / Math.max(0.5, Math.min(1.2, this.cam.z)));
    if (!avail.length) {
      // nobody can shoot: the cannons still fire
      floatText(this.overlay, W / 2, H / 2, 'TUS GATOS ESTÁN FUERA… ¡CAÑONES, FUEGO!', { color: C.paper, size: 46 });
      this.turnShooter = '';
      await wait(700);
      await this.autoVolley(0);
      this.sim.endTurn();
      this.refreshCards();
      if (this.sim.winner !== null) return this.finish();
      return this.enemyTurn();
    }
    for (const c of this.cards) c.setSelected(c.cat?.def.uid === this.selected);
    this.ultArmed = false;
    this.refreshCards();
    this.turnBanner(this.shotsLeft > 0 && this.sim.turn === 1 ? 'TU TURNO · ¡DOBLE DISPARO!' : 'TU TURNO', C.yellow);
  }

  turnBanner(text: string, color: number) {
    const t = poster(text, 64, color, { stroke: { color: C.ink, width: 8 } });
    t.anchor.set(0.5);
    t.position.set(W / 2, 190);
    this.overlay.addChild(t);
    gsap.from(t.scale, { x: 0.3, y: 0.3, duration: 0.2, ease: 'back.out(3)' });
    gsap.to(t, { alpha: 0, delay: 0.9, duration: 0.3, onComplete: () => t.destroy() });
  }

  async enemyTurn(): Promise<void> {
    if (this.sim.winner !== null) return this.finish();
    this.phase = 'enemy';
    this.refreshCards();
    const ev = this.sim.startTurn(1);
    await this.playTicks(ev);
    await this.playQueued();
    await this.checkBossPhase();
    if (this.sim.winner !== null) return this.finish();
    this.turnBanner('TURNO ENEMIGO', C.pinkHot);
    await wait(this.fast ? 300 : 900);
    const shots = 1 + this.sim.extraShots(1);
    this.volleyTarget = null;
    for (let k = 0; k < shots && this.sim.winner === null; k++) {
      const d = decide(this.sim, 1, this.prof, this.aiMemory, aiSeed.cat(this.sim, 1, k), { demolisher: this.spec.rules?.demolisher?.includes(1), dmgBy: this.dmgFrom });
      if (!d) break;
      const cat = this.sim.sides[1].cats.find((c) => c.def.uid === d.shooter);
      const bc = this.catViews.get(d.shooter);
      if (bc && !this.fast && k === 0) {
        const wp = this.world.toLocal(bc.getGlobalPosition());
        this.cam.tx = wp.x;
        this.cam.ty = wp.y - 80;
        this.cam.tz = 1.18;
        gsap.timeline().to(bc.scale, { x: 1.12, y: 0.9, duration: 0.25 }).to(bc.scale, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
        bc.sprite.emote('attack', 0.7);
        sfx('meow', 0.8);
        await wait(650);
      }
      if (d.ult && cat) await this.ultCutIn(cat);
      const res = this.sim.fire(1, d.shooter, d.angle, d.power, d.ult);
      this.volleyTarget = volleyAim(this.volleyTarget, res.events, 1);
      await this.animateShot(1, d.shooter, res.paths, res.events, res.shot);
      await this.checkBossPhase();
    }
    // the Arcanista's ink cats fire their runes
    for (const p of summonShooters(this.sim, 1)) {
      if (this.sim.winner !== null) break;
      const a = aimFrom(this.sim, 1, this.sim.partMuzzle(1, p), INK_RUNE, aiSeed.ink(this.sim, p.id), 3);
      const res = this.sim.fire(1, `part:${p.id}`, a.angle, a.power);
      this.flt(p.x, p.y0 - 70, '¡RUNA DE TINTA!', { color: 0xd8a8ee, size: 28, font: F.poster });
      await this.animateShot(1, 'ink', res.paths, res.events, res.shot, true);
      await this.checkBossPhase();
    }
    if (this.sim.winner === null) await this.autoVolley(1);
    await this.checkBossPhase();
    this.sim.endTurn();
    this.refreshCards();
    if (this.sim.winner !== null) return this.finish();
    this.playerTurn();
  }

  // ---------------------------------------------------------------- input
  down(e: FederatedPointerEvent) {
    if (this.phase !== 'aim') return;
    const p = this.toLocal(e.global);
    if (p.y > H - 200 || p.y < 140) return; // HUD areas
    this.dragging = true;
    this.dragStart = { x: p.x, y: p.y };
  }
  move(e: FederatedPointerEvent) {
    if (!this.dragging || this.phase !== 'aim') return;
    const p = this.toLocal(e.global);
    const dx = this.dragStart.x - p.x;
    const dy = this.dragStart.y - p.y;
    const len = Math.min(300, Math.hypot(dx, dy));
    if (len < 10) return;
    this.aim.angle = Math.atan2(dy, dx);
    this.aim.power = 380 + len * 3.1;
    // the shooter winds up: crouches with the pull and leans back against the shot
    const bc = this.selected ? this.catViews.get(this.selected) : undefined;
    if (bc && !bc.destroyed) {
      const pull = len / 300;
      bc.sprite.crouch = 0.25 + pull * 0.75;
      bc.sprite.lean = -Math.sign(Math.cos(this.aim.angle) || 1) * (bc.flip ? -1 : 1) * pull * 0.6;
    }
    this.drawAim();
  }
  up() {
    if (!this.dragging) return;
    this.dragging = false;
    this.aimReadout.visible = false;
    if (this.phase === 'aim') {
      const o = this.sim.muzzle(0, this.selected);
      const paths = this.sim.buildPaths(this.currentShot(), o, this.aim.angle, this.aim.power, this.sim.wind, 0);
      this.lastShot = { angle: this.aim.angle, power: this.aim.power, pts: paths[0]?.points ?? [], shooter: this.selected };
    }
    const bc = this.selected ? this.catViews.get(this.selected) : undefined;
    if (bc && !bc.destroyed) {
      // release: spring forward past neutral, then settle
      bc.sprite.crouch = -0.3;
      bc.sprite.lean = 0.5 * Math.sign(Math.cos(this.aim.angle) || 1) * (bc.flip ? -1 : 1);
      window.setTimeout(() => {
        if (bc.destroyed) return;
        bc.sprite.crouch = 0;
        bc.sprite.lean = 0;
      }, 260);
    }
    if (this.phase !== 'aim') return;
    this.aimG.clear();
    this.playerFire();
  }

  drawAim() {
    const shot = this.currentShot();
    const o = this.sim.muzzle(0, this.selected);
    const paths = this.sim.buildPaths(shot, o, this.aim.angle, this.aim.power, this.sim.wind, 0);
    const g = this.aimG;
    g.clear();
    const meta = this.spec.meta;
    let frac = (shot.preview ?? 0.4) * this.sim.previewMul(0) * (1 + (meta?.previewBonus ?? 0));
    if (meta?.noPreview) frac = 0.06;
    // Eclipse (theirs or a Noctis): blinded, no preview
    if (this.sim.sides[0].buffs.blind > 0) frac = 0.04;
    const col = elementFx(shot.element === 'neutral' ? 'fire' : shot.element).main;
    // the camera pulls back on big ships: keep the dots the same size on screen
    const k = 1 / Math.max(0.5, Math.min(1.2, this.cam.z));
    for (const p of paths) {
      const n = Math.max(6, Math.floor(p.points.length * Math.min(1, frac)));
      for (let i = 0; i < n; i += 5) {
        const pt = p.points[i];
        const a = 0.35 + 0.65 * (1 - i / n);
        g.circle(pt.x, pt.y, (7 * a + 3) * k).fill({ color: C.ink, alpha: a });
        g.circle(pt.x, pt.y, (4.5 * a + 1.5) * k).fill({ color: i % 10 === 0 ? col : C.paper, alpha: a });
      }
    }
    // power meter near muzzle
    const pw = (this.aim.power - 380) / 930;
    g.rect(o.x - 40 * k, o.y - 70 * k, 80 * k, 12 * k).fill(C.ink);
    g.rect(o.x - 38 * k, o.y - 68 * k, 76 * k * Math.min(1, pw), 8 * k).fill(pw > 0.9 ? C.red : C.yellow);
    // numbers: angle (°, above the horizon) and power (%) — compare with the ghost of your last shot
    const deg = Math.round((-this.aim.angle * 180) / Math.PI);
    const pct = Math.round(Math.max(0, Math.min(1, pw)) * 100);
    const r = this.aimReadout;
    r.visible = true;
    r.text = `${deg}° · ${pct}%`;
    r.scale.set(k);
    r.anchor.set(0.5, 1);
    r.position.set(o.x, o.y - 80 * k);
    this.drawLastShot(k);
  }

  /** dotted ghost of the previous player shot, with its numbers at the end of the arc */
  drawLastShot(k = 1) {
    const g = this.lastAimG;
    g.clear();
    this.lastLabel.visible = false;
    const ls = this.lastShot;
    if (!ls || this.phase !== 'aim' || !ls.pts.length) return;
    for (let i = 0; i < ls.pts.length; i += 8) {
      const pt = ls.pts[i];
      g.circle(pt.x, pt.y, 4.5 * k).fill({ color: C.ink, alpha: 0.45 });
      g.circle(pt.x, pt.y, 2.8 * k).fill({ color: C.yellow, alpha: 0.85 });
    }
    const end = ls.pts[Math.min(ls.pts.length - 1, Math.floor(ls.pts.length * 0.5))];
    const deg = Math.round((-ls.angle * 180) / Math.PI);
    const pct = Math.round(Math.max(0, Math.min(1, (ls.power - 380) / 930)) * 100);
    g.roundRect(end.x - 70 * k, end.y - 44 * k, 140 * k, 30 * k, 8 * k).fill({ color: C.ink, alpha: 0.55 });
    this.lastLabel.visible = true;
    this.lastLabel.text = `ANTERIOR ${deg}° · ${pct}%`;
    this.lastLabel.scale.set(k);
    this.lastLabel.anchor.set(0.5, 0.5);
    this.lastLabel.position.set(end.x, end.y - 29 * k);
  }
  lastLabel = txt('', { fontFamily: F.bebas, fontSize: 22, fill: C.paper });

  async playerFire() {
    if (this.phase !== 'aim') return;
    this.phase = 'flight';
    this.lastAimG.clear();
    this.aimReadout.visible = false;
    this.lastLabel.visible = false;
    const cat = this.sim.sides[0].cats.find((c) => c.def.uid === this.selected);
    const ult = this.ultArmed && !!cat && this.sim.canUlt(cat);
    if (ult && cat) {
      await this.ultCutIn(cat);
      G.count('ultimates');
    }
    this.lastElevation = -this.aim.angle;
    this.turnShooter = this.selected;
    const res = this.sim.fire(0, this.selected, this.aim.angle, this.aim.power, ult);
    this.refreshCards();
    // the volley concentrates on the FIRST hit of this turn (same rule as the headless sim)
    this.volleyTarget = volleyAim(this.volleyTarget, res.events, 0);
    await this.animateShot(0, this.selected, res.paths, res.events, res.shot);
    await this.checkBossPhase();
    // Gorrión: a second cat on turn 1
    if (this.shotsLeft > 0 && this.sim.winner === null) {
      this.shotsLeft--;
      const avail = this.sim.shooters(0);
      if (avail.length) {
        this.phase = 'aim';
        this.selected = avail[0].def.uid;
        for (const c of this.cards) c.setSelected(c.cat?.def.uid === this.selected);
        this.refreshCards();
        this.turnBanner('¡OTRO GATO! (GORRIÓN)', C.mint);
        return;
      }
    }
    if (this.sim.winner === null) await this.autoVolley(0);
    await this.checkBossPhase();
    this.sim.endTurn();
    this.refreshCards();
    this.volleyTarget = null;
    if (this.sim.winner !== null) return this.finish();
    this.enemyTurn();
  }

  // ---------------------------------------------------------------- ultimate cut-in (storyboard d, compact)
  async ultCutIn(c: CatState) {
    const fx = elementFx(c.def.elements[0]);
    const layer = new Container();
    this.overlay.addChild(layer);
    const dim = new Graphics().rect(0, 0, W, H).fill({ color: C.ink, alpha: 0.75 });
    const band = new Graphics().rect(-300, -170, W + 600, 340).fill(fx.main).stroke({ width: 8, color: C.ink });
    band.rotation = -0.12;
    band.position.set(W / 2, H / 2);
    const cat = new BattleCat(c.def.slug, c.def.elements[0], 420, c.side === 1);
    if (c.def.tint !== undefined) cat.sprite.tint = c.def.tint;
    cat.position.set(c.side === 0 ? 520 : W - 520, H / 2 + 200);
    const name = poster(c.def.ultimate?.shout ?? c.def.ultimate?.name ?? 'ULTIMATE', 120, C.paper, { stroke: { color: C.ink, width: 12 } });
    name.anchor.set(0.5);
    name.rotation = -0.12;
    name.position.set(c.side === 0 ? W / 2 + 300 : W / 2 - 300, H / 2 - 20);
    if (name.width > 1100) name.scale.set(1100 / name.width);
    const who = txt(`${c.def.name.toUpperCase()} — BATTLE FORM`, { fontFamily: F.poster, fontSize: 34, fill: C.ink });
    who.anchor.set(0.5);
    who.rotation = -0.12;
    who.position.set(name.x, H / 2 + 90);
    layer.addChild(dim, band, cat, name, who);
    sfx('charge');
    speedLines(layer, W / 2, H / 2, C.ink, 60, 1.1);
    gsap.from(band.scale, { x: 0, duration: 0.18, ease: 'power3.out' });
    gsap.from(cat, { x: c.side === 0 ? -300 : W + 300, duration: 0.25, ease: 'power3.out' });
    gsap.from(name.scale, { x: 3, y: 3, duration: 0.2, delay: 0.2, ease: 'back.out(2)' });
    // the cat acts the shout: slides in leaning, gathers power (crouch + eyes shut), then ROARS
    cat.sprite.lean = 0.6;
    cat.sprite.crouch = 0.9;
    cat.sprite.emote('sleepy', 0.9);
    window.setTimeout(() => {
      if (cat.destroyed) return;
      cat.sprite.lean = -0.25;
      cat.sprite.emote('sleepy', 0);
    }, 240);
    window.setTimeout(() => {
      sfx('crit');
      if (!cat.destroyed) {
        cat.sprite.crouch = -0.4;
        cat.sprite.lean = 0.8;
        cat.sprite.emote('surprise');
        cat.sprite.emote('attack', 1.4);
        cat.impactFrame(140);
        gsap.fromTo(cat.scale, { x: 1.18, y: 0.86 }, { x: 1, y: 1, duration: 0.5, ease: 'elastic.out(1.2,0.35)' });
        window.setTimeout(() => {
          if (cat.destroyed) return;
          cat.sprite.crouch = 0;
          cat.sprite.lean = 0.2;
        }, 300);
      }
      this.shaker.add(0.4);
    }, 420);
    await wait(settings.reduceMotion ? 600 : 1250);
    sfx('whoosh');
    gsap.to(layer, { alpha: 0, duration: 0.2, onComplete: () => layer.destroy({ children: true }) });
  }

  /** dev: jump the boss phase (window.__battle.devPhase(3)) */
  async devPhase(n: 1 | 2 | 3) {
    for (const e of this.sim.forcePhase(n)) this.applyEvent(e);
    await this.checkBossPhase();
    this.refreshCards();
  }

  /** boss phase banners (the sim decides the phase; we present it after the shot) */
  async checkBossPhase() {
    if (!this.phaseQueue.length || this.sim.winner !== null) {
      this.phaseQueue.length = 0;
      return;
    }
    const target = Math.max(...this.phaseQueue);
    this.phaseQueue.length = 0;
    if (target <= this.bossPhase) return;
    this.bossPhase = target;
    const boss = BOSSES.find((b) => b.zone === this.spec.meta?.zone && (b.type === 'zone_boss' || b.type === 'final_boss'));
    const ph = boss?.phases[target - 1];
    const line = target === 2 ? boss?.lines.phase2 : boss?.lines.phase3;
    sfx('sting');
    sfx('alarm');
    this.shaker.add(0.5);
    const band = new Container();
    const g = new Graphics().rect(-300, -80, W + 600, 160).fill(C.red).stroke({ width: 8, color: C.ink });
    g.rotation = -0.05;
    const t = poster(`FASE ${target}: ${(ph?.name ?? '').toUpperCase()}`, 92, C.paper, { stroke: { color: C.ink, width: 10 } });
    t.anchor.set(0.5);
    t.rotation = -0.05;
    band.addChild(g, t);
    band.position.set(W / 2, H / 2 - 160);
    this.overlay.addChild(band);
    const note = PHASE_NOTE[`${this.spec.boss?.id}:${target}`];
    let card: Container | null = null;
    if (note) {
      card = new Container();
      const head = poster(note[0], 44, C.ink);
      const body = iconText(note[1], { fontFamily: F.ui, fontWeight: '700', fontSize: 26, fill: C.paper }, { wrap: 900 });
      const w = Math.max(head.width, body.width) + 60;
      const bg = new Graphics().rect(10, 10, w, 150).fill(C.ink).rect(0, 0, w, 64).fill(C.yellow).stroke({ width: 5, color: C.ink }).rect(0, 64, w, 86).fill(C.ink);
      head.position.set(30, 4);
      body.position.set(30, 80);
      card.addChild(bg, head, body);
      card.position.set(W / 2 - w / 2, H / 2 - 40);
      this.overlay.addChild(card);
      gsap.from(card, { y: card.y + 60, alpha: 0, duration: 0.3, ease: 'back.out(2)', delay: 0.2 });
    }
    gsap.from(g.scale, { x: 0, duration: 0.2, ease: 'power3.out' });
    gsap.from(t.scale, { x: 2, y: 2, duration: 0.25, ease: 'back.out(2)' });
    if (line && boss) this.speech(this.ships[1], boss.name, line, 3);
    await wait(this.fast ? 600 : note ? 2400 : 1400);
    gsap.to(band, { alpha: 0, duration: 0.3, onComplete: () => band.destroy({ children: true }) });
    const cc = card;
    if (cc) gsap.to(cc, { alpha: 0, duration: 0.3, onComplete: () => cc.destroy({ children: true }) });
    this.refreshRules();
  }

  // ---------------------------------------------------------------- automatic cannons
  async autoVolley(side: 0 | 1) {
    const cannons = this.sim.cannons(side);
    if (!cannons.length) return;
    const v = this.ships[side];
    const gp = this.overlay.toLocal(v.getGlobalPosition());
    // the ship's own weapons (not cats): say so, and say what they are (fairness: "was that a stone cat?")
    const wname = (id: number) => {
      const sh = this.sim.cannonShot(side, id);
      return sh.id === 'roca' ? 'MORTERO' : sh.id === 'cannon' || sh.id === 'canon' ? 'CAÑÓN' : sh.name.toUpperCase();
    };
    const names = [...new Set(cannons.map((m) => wname(m.id)))].join(' + ');
    const label = poster(side === 1 ? `ANDANADA DEL BARCO x${cannons.length}: ${names}` : cannons.length > 1 ? `¡ANDANADA x${cannons.length}!` : '¡CAÑONAZO!', side === 1 ? 40 : 54, C.paper, { stroke: { color: C.ink, width: 8 } });
    label.anchor.set(0.5);
    label.rotation = side === 0 ? -0.06 : 0.06;
    label.position.set(gp.x + v.width / 2, Math.max(160, gp.y - 60));
    this.overlay.addChild(label);
    gsap.from(label.scale, { x: 0.2, y: 0.2, duration: 0.18, ease: 'back.out(3)' });
    gsap.to(label, { alpha: 0, delay: 0.9, duration: 0.25, onComplete: () => label.destroy() });
    for (const m of cannons) {
      if (this.sim.winner !== null) break;
      if (!m.alive) continue;
      const a = aimCannon(this.sim, side, m.id, aiSeed.cannon(this.sim, m.id), volleySigma(this.spec, side), this.volleyTarget ?? undefined);
      const res = this.sim.fire(side, 'cannon', a.angle, a.power, false, m.id);
      const mz = this.sim.cannonMuzzle(side, m.id);
      if (side === 1) this.flt(mz.x, mz.y - 50, `${wname(m.id)} DEL BARCO`, { color: 0xb9b2a0, size: 22, font: F.poster, dur: 0.9, rise: 30 });
      this.fxp.burst(mz.x, mz.y, { count: 18, tint: [C.yellow, C.orange, C.paper, 0x8a95a3], speed: [100, 420], gravity: -60, life: [0.2, 0.6], angle: side === 0 ? [-0.6, 0.6] : [Math.PI - 0.6, Math.PI + 0.6] });
      v.fireCannon(m.id);
      await this.animateShot(side, 'cannon', res.paths, res.events, res.shot, true);
      this.refreshCards();
    }
  }

  // ---------------------------------------------------------------- animation of events
  async playTicks(ev: BattleEvent[]) {
    if (!ev.length) return;
    for (const e of ev) this.applyEvent(e);
    const slow = ev.some((e) => e.k === 'boss' && ['grab', 'heal', 'fly', 'submerge', 'surface', 'eyeOpen', 'suddenDeath', 'throw'].includes(e.what));
    await wait(this.fast ? 200 : slow ? 1100 : 450);
    this.refreshCards();
  }

  /** projectile look per trajectory: bolt (rayo), swirl (ráfaga), rock, torpedo, orb… */
  private makeProjectile(shot: ShotDef) {
    const fx = elementFx(shot.element === 'neutral' ? 'fire' : shot.element);
    const g = new Container();
    const glow = new Sprite(glowTexture());
    glow.anchor.set(0.5);
    glow.tint = fx.main;
    glow.scale.set(shot.trajectory === 'beam' ? 0.7 : 0.5);
    const core = new Graphics();
    if (shot.trajectory === 'beam') {
      core.poly([-22, -5, 6, -5, 2, -12, 26, 0, -2, 12, 2, 5, -22, 5]).fill(0xfff6a8).stroke({ width: 4, color: C.ink, join: 'miter' });
    } else if (shot.trajectory === 'gust') {
      for (let i = 0; i < 3; i++) core.arc(0, 0, 10 + i * 7, -1.2 + i * 0.5, 1.4 + i * 0.5).stroke({ width: 5 - i, color: i ? fx.accent : C.ink, cap: 'round' });
      core.circle(0, 0, 7).fill(0xe6fbff).stroke({ width: 3, color: C.ink });
    } else if (shot.id === 'roca' || shot.id === 'mortero') {
      // a SHIP mortar shell (not a cat): iron ball with a lit fuse
      core.circle(0, 0, 13).fill(0x30344a).stroke({ width: 4, color: C.ink });
      core.circle(-4, -4, 4).fill({ color: 0xffffff, alpha: 0.4 });
      core.moveTo(8, -9).lineTo(14, -16).stroke({ width: 3, color: 0x8a7a62 });
      core.circle(15, -17, 4).fill(C.orange);
    } else if (shot.trajectory === 'heavy') {
      core.poly([-14, -8, -4, -15, 10, -12, 16, 0, 9, 13, -6, 14, -15, 4]).fill(0x8a7a62).stroke({ width: 4, color: C.ink, join: 'round' });
    } else if (shot.trajectory === 'meteor' && shot.radius > CELL * 3.4) {
      // STARFALL: the sun itself
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        core.moveTo(Math.cos(a) * 52, Math.sin(a) * 52).lineTo(Math.cos(a) * 92, Math.sin(a) * 92).stroke({ width: 8, color: 0xffd400 });
      }
      core.circle(0, 0, 60).fill(0xfff2c0).stroke({ width: 7, color: C.ink });
      core.circle(0, 0, 38).fill(0xffffff);
      glow.scale.set(2.2);
    } else if (shot.trajectory === 'torpedo') {
      core.roundRect(-18, -7, 36, 14, 7).fill(fx.main).stroke({ width: 4, color: C.ink });
    } else {
      core.circle(0, 0, shot.trajectory === 'meteor' ? 30 : 12).fill(fx.main).stroke({ width: 4, color: C.ink });
    }
    g.addChild(glow, core);
    this.world.addChild(g);
    return { node: g, core, fx };
  }

  /** the set pieces the ultimates stage before their projectiles fly */
  private static PRE_FX = new Set(['sun', 'thunder', 'slash', 'eruption', 'storm', 'stone', 'lure', 'forest', 'flash', 'eclipse']);
  private ultCtx(): UltCtx {
    return {
      sim: this.sim,
      wfx: this.wfx,
      overlay: this.overlay,
      fxp: this.fxp,
      shaker: this.shaker,
      catViews: this.catViews,
      flt: (x, y, text, o) => this.flt(x, y, text, o),
      toOverlay: (x, y) => this.overlay.toLocal(this.world.toGlobal({ x, y })),
      marks: this.ultMarks,
    };
  }

  async animateShot(side: number, shooter: string, paths: ShotPath[], events: BattleEvent[], shot: ShotDef, quick = false): Promise<void> {
    const pre = events.filter((e): e is Extract<BattleEvent, { k: 'ultfx' }> => e.k === 'ultfx' && BattleScene.PRE_FX.has(e.fx));
    for (const e of pre) await preUlt(this.ultCtx(), e);
    if (!paths.length) {
      for (const e of events) if (!pre.includes(e as never)) this.applyEvent(e);
      this.refreshCards();
      return;
    }
    return this.flyShot(side, shooter, paths, events, shot, quick, new Set<BattleEvent>(pre));
  }

  private flyShot(side: number, shooter: string, paths: ShotPath[], events: BattleEvent[], shot: ShotDef, quick: boolean, consumed: Set<BattleEvent>): Promise<void> {
    if (side === 0) {
      const credit = shooter !== 'cannon' ? shooter : this.turnShooter;
      if (shooter !== 'cannon') {
        let d = 0;
        for (const e of events) if (e.k === 'impact' && e.side === 1) d += e.total;
        this.dmgBy.set(shooter, (this.dmgBy.get(shooter) ?? 0) + d);
      }
      if (credit) {
        let k = 0;
        for (const e of events) if ((e.k === 'module' && e.side === 1) || (e.k === 'cat' && e.side === 1 && e.ko)) k++;
        if (k) {
          this.kos[credit] = (this.kos[credit] ?? 0) + k;
          const owned = G.s.cats.find((c) => c.uid === credit);
          this.cards.find((c) => c.cat?.def.uid === credit)?.setKos((owned?.kos ?? 0) + this.kos[credit]);
        }
      }
    } else if (shooter !== 'cannon') {
      for (const e of events) if (e.k === 'cat' && e.side === 0 && e.dmg > 0) this.dmgFrom.set(shooter, (this.dmgFrom.get(shooter) ?? 0) + e.dmg);
    }
    return new Promise((resolve) => {
      const bc = this.catViews.get(shooter);
      if (bc) {
        gsap.timeline().to(bc.scale, { x: 1.2, y: 0.8, duration: 0.08 }).to(bc.scale, { x: 0.9, y: 1.15, duration: 0.06 }).to(bc.scale, { x: 1, y: 1, duration: 0.3, ease: 'elastic.out(1,0.4)' });
        bc.sprite.emote('attack');
      }
      sfx(shot.element === 'electric' ? 'zap' : shot.trajectory === 'gust' ? 'whoosh' : 'shoot', quick ? 1.25 : 1);
      this.shaker.add(quick ? 0.06 : 0.12);
      const o = paths[0].points[0];
      const fx0 = elementFx(shot.element === 'neutral' ? 'fire' : shot.element);
      this.fxp.burst(o.x, o.y, { count: 14, tint: [fx0.main, fx0.accent, C.paper], speed: [80, 380], gravity: 0, life: [0.15, 0.35] });
      const balls = paths.map(() => this.makeProjectile(shot));
      const trail = new Graphics();
      this.world.addChild(trail);
      const hist: { x: number; y: number }[][] = paths.map(() => []);
      if (!quick) {
        this.follow = balls[0].node;
        this.followBox = this.shipBox(side === 0 ? 1 : 0);
        this.cam.tz = 1.16;
      }
      const idx = paths.map(() => 0);
      const done = paths.map(() => false);
      let acc = 0;
      let frame = 0;
      const tick = (t: Ticker) => {
        acc += (t.deltaMS / 1000) * time.scale * (this.fast ? 2.5 : 1) * (quick ? 1.7 : 1);
        const stepDt = 1 / 120;
        frame++;
        while (acc >= stepDt) {
          acc -= stepDt;
          paths.forEach((p, pi) => {
            if (done[pi]) return;
            idx[pi]++;
            const i = idx[pi];
            if (i >= p.points.length) {
              done[pi] = true;
              balls[pi].node.destroy({ children: true });
              // flush remaining events for this path
              for (const e of events)
                if (!consumed.has(e) && 'path' in e && e.path === pi) {
                  consumed.add(e);
                  this.applyEvent(e);
                }
              return;
            }
            const pt = p.points[i];
            const prev = p.points[Math.max(0, i - 1)];
            const b = balls[pi];
            // portal: the projectile vanishes in one ring and comes out of the other — now it's theirs
            if (p.jumps?.includes(i)) {
              this.portalFx?.flash(prev.x, prev.y);
              this.portalFx?.flash(pt.x, pt.y);
              sfx('whoosh', 1.4);
              hist[pi].length = 0;
              const owner = p.owners?.[p.owners.length - 1] ?? side;
              this.flt(pt.x, pt.y - 60, owner === side ? '¡DE VUELTA!' : owner === 0 ? '¡AHORA ES TUYO!' : '¡AHORA ES SUYO!', { color: 0xffb02e, size: 34, font: F.poster });
            }
            b.node.position.set(pt.x, pt.y);
            b.node.rotation = Math.atan2(pt.y - prev.y, pt.x - prev.x);
            if (shot.trajectory === 'gust') b.core.rotation += 0.35;
            hist[pi].push({ x: pt.x, y: pt.y });
            if (hist[pi].length > 14) hist[pi].shift();
            if (i % 3 === 0) this.fxp.burst(pt.x, pt.y, { count: 1, tint: [b.fx.main, b.fx.accent], speed: [0, 30], life: [0.2, 0.4], gravity: 0, scale: [0.35, 0.55], texture: dotTexture() });
            if (p.impacts.includes(i)) {
              for (const e of events)
                if (!consumed.has(e) && 'path' in e && e.path === pi && e.at === i) {
                  consumed.add(e);
                  this.applyEvent(e);
                }
            }
          });
        }
        // trails: jagged krackle bolt for rays, wind streaks for gusts
        trail.clear();
        if (shot.trajectory === 'beam' || shot.trajectory === 'gust') {
          hist.forEach((hs, pi) => {
            if (done[pi] || hs.length < 2) return;
            if (shot.trajectory === 'beam') {
              const jag = (k: number) => (frame % 2 ? 1 : -1) * (k % 2 ? 7 : -7);
              for (const [w, col] of [
                [9, C.ink],
                [4, 0xffe14a],
              ] as const) {
                trail.moveTo(hs[0].x, hs[0].y);
                hs.forEach((h, k) => trail.lineTo(h.x, h.y + jag(k)));
                trail.stroke({ width: w, color: col, join: 'miter' });
              }
              for (let k = 0; k < hs.length; k += 3) trail.circle(hs[k].x + (frame % 3) * 3, hs[k].y - 10, 3).fill(C.ink);
            } else {
              for (let l = -1; l <= 1; l++) {
                trail.moveTo(hs[0].x, hs[0].y + l * 12);
                for (const h of hs) trail.lineTo(h.x, h.y + l * 12 + Math.sin(h.x / 20 + frame * 0.4) * 4);
                trail.stroke({ width: 3, color: 0xe6fbff, alpha: 0.75 });
              }
            }
          });
        }
        if (done.every(Boolean)) {
          Ticker.shared.remove(tick);
          trail.destroy();
          this.follow = null;
          this.followBox = null;
          window.setTimeout(() => {
            if (!this.follow) {
              this.cam.tx = W / 2;
              this.cam.ty = H / 2;
              this.cam.tz = 1;
            }
          }, quick ? 100 : 450);
          for (const e of events) if (!consumed.has(e)) this.applyEvent(e);
          this.refreshCards();
          window.setTimeout(resolve, this.fast || quick ? 200 : 650);
        }
      };
      Ticker.shared.add(tick);
    });
  }

  applyEvent(e: BattleEvent) {
    switch (e.k) {
      case 'cell': {
        const v = this.ships[e.side];
        if (e.destroyed) v.knockOff(e.cell, this.debris, this.sim.cellCenter(e.side, e.cell.x, e.cell.y));
        else v.refreshCell(e.cell);
        if (e.side === 1) this.stats.damageDealt += e.dmg;
        break;
      }
      case 'tick': {
        const v = this.ships[e.side];
        const p = this.sim.cellCenter(e.side, e.cell.x, e.cell.y);
        if (e.destroyed) v.knockOff(e.cell, this.debris, p, 0.4);
        else v.refreshCell(e.cell);
        if (e.status === 'burning') this.fxp.burst(p.x, p.y, { count: 6, tint: [C.orange, C.yellow], speed: [40, 120], gravity: -200, life: [0.3, 0.6] });
        this.flt(p.x, p.y - 20, `-${this.show(e.dmg)}`, { color: e.status === 'burning' ? C.orange : 0x7ed957, size: 26, rise: 40 });
        break;
      }
      case 'spread':
        this.ships[e.side].refreshCell(e.cell);
        break;
      case 'status':
        for (const c of e.cells) this.ships[e.side].refreshCell(c);
        break;
      case 'heal': {
        const v = this.ships[e.side];
        v.refreshCell(e.cell);
        const p = this.sim.cellCenter(e.side, e.cell.x, e.cell.y);
        this.fxp.burst(p.x, p.y, { count: 4, tint: [0x7ed957, 0xd4f27a, C.mint], speed: [30, 90], gravity: -120, life: [0.4, 0.7] });
        const now = performance.now();
        if (now - this.healAcc > 350) {
          this.healAcc = now;
          this.flt(p.x, p.y - 30, `+${this.show(e.amount)}`, { color: 0x7ed957, size: 32, rise: 50 });
        }
        break;
      }
      case 'flood': {
        const v = this.ships[e.side];
        // the ship settles lower as it floods
        gsap.to(v, { baseY: this.sim.sides[e.side].setup.origin.y + e.flood * 70, duration: 0.8, ease: 'power2.out' });
        const p = this.wfx.toLocal(v.getGlobalPosition());
        this.flt(p.x + v.width / 2, WATER_Y - 40, `INUNDACIÓN ${Math.round(e.flood * 100)}%`, { color: C.cyan, size: 36, font: F.poster, rise: 30, dur: 1.4 });
        sfx('splash', 0.7);
        this.fxp.burst(p.x + v.width / 2, WATER_Y, { count: 16, tint: [C.paper, C.megaBlue], angle: [-Math.PI * 0.9, -Math.PI * 0.1], speed: [100, 300] });
        break;
      }
      case 'impact': {
        const [word, col] = ONO[e.element] ?? ONO.neutral;
        const fx = elementFx(e.element === 'neutral' ? 'fire' : e.element);
        const big = e.total > 400;
        if (e.total <= 0) {
          this.fxp.burst(e.x, e.y, { count: 10, tint: [fx.main, C.paper], speed: [100, 300], life: [0.2, 0.4] });
          break;
        }
        // piercing passes (rocks, beams through layers): small puff, their damage joins the final blow's number
        if (e.radius <= 24) {
          this.pierceAcc += e.total;
          this.fxp.burst(e.x, e.y, { count: 12, tint: [fx.main, fx.accent, C.ink], speed: [150, 450], life: [0.25, 0.5], stepped: true });
          sfx('hit', 1.2);
          this.ships[e.side].hitReact(e.x, e.y, 0.3);
          break;
        }
        const shown = e.total + this.pierceAcc;
        this.pierceAcc = 0;
        sfx(e.total > 600 ? 'bigboom' : 'boom');
        if (e.crit) sfx('crit');
        time.hitstop(Math.min(150, 50 + e.total / 12));
        this.shaker.add(Math.min(0.75, 0.15 + e.total / 1500));
        if (big && !settings.reduceFlashes) flash(this.overlay, C.paper, 0.3, 0.12);
        this.fxp.burst(e.x, e.y, { count: big ? 48 : 28, tint: [fx.main, fx.accent, C.ink, C.paper], speed: [200, 850], life: [0.4, 1], scale: [0.4, 1.3], stepped: true });
        // onomatopoeia above the impact, damage number off to the side (lanes keep them apart)
        const oSize = big ? 130 : 96;
        // multi-impact shots (ultimates, volleys): one onomatopoeia per beat, not a tower of them
        const nowO = performance.now();
        if (nowO - this.lastOno > 280) {
          this.lastOno = nowO;
          const oy = this.labels.place(e.x, e.y - 90, word.length * oSize * 0.5, oSize * 0.95, 900);
          onomatopoeia(this.wfx, e.x, oy, word, { color: col, size: oSize });
        }
        const sv = this.ships[e.side];
        sv.hitReact(e.x, e.y, Math.min(1.6, 0.35 + e.total / 500));
        this.cam.z += Math.min(0.08, 0.02 + e.total / 8000);
        const dx = e.side === 1 ? -150 : 150;
        this.flt(e.x + dx, e.y + 10, `-${this.show(shown)}`, { color: e.crit ? C.pinkHot : C.paper, size: e.crit ? 64 : 48, font: F.heavy, rise: 70 });
        if (e.crit) this.flt(e.x + dx, e.y - 60, '¡CRÍTICO!', { color: C.pinkHot, size: 50, rot: -0.2 });
        // element vs material: the same numbers the sim used (×1.5 súper efectivo / ×0.75 resiste)
        const eff = e.mul !== undefined ? effLabel(e.mul, e.mat) : null;
        if (eff && nowO - (this.infoAt.get(eff.text) ?? -1e9) > 900) {
          this.infoAt.set(eff.text, nowO);
          this.flt(e.x + dx, e.y + 70, eff.text, { color: eff.color, size: eff.color === 0xffd400 ? 36 : 30, font: F.poster, rot: -0.06, dur: 1.2 });
        }
        break;
      }
      case 'chunk': {
        if (!e.cells.length) break;
        this.ships[e.side].sinkChunk(e.cells, this.debris, (sx) => {
          sfx('splash');
          this.fxp.burst(sx, WATER_Y, { count: 40, tint: [C.paper, C.megaBlue, 0x7fd8ff], angle: [-Math.PI * 0.95, -Math.PI * 0.05], speed: [300, 850] });
        });
        const p = this.sim.cellCenter(e.side, e.cells[0].x, e.cells[0].y);
        const oy = this.labels.place(p.x, p.y - 160, 300, 100, 900);
        onomatopoeia(this.wfx, p.x, oy, 'CRACK!', { color: C.pinkHot, size: 100 });
        this.shaker.add(0.4);
        sfx('bigboom');
        break;
      }
      case 'cat':
        this.catEvent(e);
        break;
      case 'reaction': {
        if (!this.reactions.includes(e.name)) this.reactions.push(e.name);
        if (!G.s.flags[`reaction_${e.name}`]) {
          G.flag(`reaction_${e.name}`);
          G.count('reactions_discovered');
          this.flt(e.x, e.y - 330, '¡SINERGIA DESCUBIERTA!', { color: C.yellow, size: 44, font: F.poster, rise: 40, dur: 1.6 });
        }
        const info = REACTION_INFO[e.name];
        const px = Math.max(300, Math.min(W - 300, e.x));
        const py = this.labels.place(px, e.y - 230, 520, 120, 1800);
        reactionPlate(this.wfx, px, py, e.name, e.mult);
        if (info) {
          const oy = this.labels.place(e.x + 60, e.y - 60, 300, 90, 900);
          onomatopoeia(this.wfx, e.x + 60, oy, info.ono, { color: info.color, size: 84 });
        }
        sfx(e.name === 'CONDUCCIÓN' || e.name === 'SOBRECARGA' ? 'zap' : e.name === 'VENTISCA' || e.name === 'ESTALLIDO' ? 'freeze' : 'levelup');
        if (e.name === 'CONDUCCIÓN' || e.name === 'SOBRECARGA') {
          if (!settings.reduceFlashes) flash(this.overlay, 0xfff6a8, 0.25, 0.1);
          this.fxp.burst(e.x, e.y, { count: 30, tint: [0xffe14a, 0xffffff, C.cyan], speed: [200, 700], life: [0.2, 0.5], gravity: 0 });
        }
        if (e.name === 'VENTISCA') this.fxp.burst(e.x, e.y, { count: 36, tint: [0xffffff, 0xc6f0e4, 0x7fd8ff], speed: [150, 500], life: [0.4, 0.9], gravity: 80 });
        if (e.name === 'ESTALLIDO') this.fxp.burst(e.x, e.y, { count: 40, tint: [0xffffff, 0xa7e8d7], speed: [300, 900], life: [0.3, 0.7], stepped: true });
        if (e.name === 'AVIVAR') this.fxp.burst(e.x, e.y, { count: 40, tint: [C.orange, C.yellow, C.red], speed: [150, 600], life: [0.4, 0.8], gravity: -250 });
        break;
      }
      case 'module': {
        const v = this.ships[e.side];
        v.updateModuleDecor();
        const m = this.sim.sides[e.side].ship.modules[e.id];
        if (e.side === 1) {
          this.stats.modulesDestroyed++;
          G.count(`destroy_${e.kind}`);
          if (this.phase === 'flight' && this.lastElevation > 0.75) G.count('destroy_module_arc');
        }
        const p = this.sim.cellCenter(e.side, m.x, m.y);
        const label = m.tag === 'throat' ? '¡GARGANTA ROTA!' : m.tag === 'static' ? '¡GENERADOR DE ESTÁTICA ROTO!' : e.kind === 'core' ? '¡NÚCLEO DESTRUIDO!' : '¡MÓDULO DESTRUIDO!';
        this.flt(p.x, p.y - 260, label, { color: e.kind === 'core' ? C.pinkHot : C.yellow, size: e.kind === 'core' ? 70 : 42, font: F.poster, rise: 50, dur: 1.4 });
        if (m.tag === 'throat') this.throat?.kill();
        if (e.kind === 'core') {
          this.shaker.add(1);
          flash(this.overlay, C.white, 0.8, 0.3);
          sfx('bigboom');
        }
        break;
      }
      case 'splash': {
        sfx('splash');
        this.fxp.burst(e.x, WATER_Y, { count: 28, tint: [C.paper, C.megaBlue], angle: [-Math.PI * 0.9, -Math.PI * 0.1], speed: [200, 600] });
        const nowS = performance.now();
        if (nowS - this.lastOno > 280) {
          this.lastOno = nowS;
          const oy = this.labels.place(e.x, WATER_Y - 70, 200, 70, 800);
          onomatopoeia(this.wfx, e.x, oy, '¡PLOP!', { color: C.cyan, size: 64 });
        }
        break;
      }
      case 'shieldHit': {
        sfx('shield');
        const ship = this.ships[e.side];
        const gp = this.wfx.toLocal(ship.getGlobalPosition());
        const bub = new Graphics().ellipse(0, 0, ship.width * 0.62, ship.height * 0.7).stroke({ width: 8, color: C.cyan }).fill({ color: C.cyan, alpha: 0.15 });
        bub.position.set(gp.x + ship.width / 2, gp.y + ship.height / 2);
        this.wfx.addChild(bub);
        gsap.fromTo(bub, { alpha: 1 }, { alpha: 0, duration: 0.5, onComplete: () => bub.destroy() });
        if (e.broken) this.flt(bub.x, bub.y - 200, '¡ESCUDO ROTO!', { color: C.cyan, size: 56 });
        break;
      }
      case 'bubble': {
        const b = this.bubbles[e.side];
        if (e.what === 'up') {
          b?.setOn(true);
          this.refreshRules();
          break;
        }
        if (e.what === 'block' || e.what === 'down') {
          sfx('shield');
          b?.block(e.x, e.y);
          const oy = this.labels.place(e.x, e.y - 80, 260, 90, 900);
          onomatopoeia(this.wfx, e.x, oy, '¡CLANK!', { color: C.cyan, size: 96 });
          this.flt(e.x, e.y + 30, e.side === 0 ? 'BURBUJA: ¡BLOQUEADO!' : 'LA BURBUJA LO ANULA', { color: C.cyan, size: 34, font: F.poster });
          if (e.what === 'down') window.setTimeout(() => b?.setOn(false), 300);
          this.shaker.add(0.2);
        } else {
          sfx('bigboom');
          b?.shatter();
          const oy = this.labels.place(e.x, e.y - 100, 260, 90, 900);
          onomatopoeia(this.wfx, e.x, oy, '¡POP!', { color: C.yellow, size: 110 });
          this.flt(e.x, e.y + 20, '¡BURBUJA REVENTADA!', { color: C.yellow, size: 40, font: F.poster });
        }
        this.refreshRules();
        break;
      }
      case 'part': {
        const p = this.sim.sides[e.side].parts.find((k) => k.id === e.id);
        if (!p || p.kind === 'gargoyle') break;
        const c = this.sim.partCenter(p);
        if (p.kind === 'fog') {
          this.fogEye?.blink();
          sfx('crit');
          break;
        }
        if (p.kind === 'ink') {
          this.inks.get(p.id)?.hurt(e.destroyed);
          this.stats.damageDealt += e.dmg;
          this.flt(c.x + 40, c.y - 40, `-${this.show(e.dmg)}`, { color: C.paper, size: 40, font: F.heavy });
          if (e.destroyed) {
            sfx('splash', 1.3);
            this.flt(c.x, c.y - 110, '¡TINTA DERRAMADA!', { color: 0xd8a8ee, size: 40, font: F.poster, dur: 1.3 });
            this.refreshRules();
          }
          break;
        }
        this.kraken?.hurtTentacle(e.id, e.destroyed);
        this.stats.damageDealt += e.dmg;
        this.flt(c.x + 50, c.y - 40, `-${this.show(e.dmg)}`, { color: 0xd8a8ee, size: 42, font: F.heavy });
        if (e.destroyed) {
          sfx('bigboom');
          this.flt(c.x, c.y - 140, '¡TENTÁCULO CORTADO!', { color: C.yellow, size: 48, font: F.poster, dur: 1.4 });
          this.fxp.burst(c.x, WATER_Y, { count: 40, tint: [C.paper, 0x9b5ab8, 0x7fd8ff], angle: [-Math.PI * 0.95, -Math.PI * 0.05], speed: [300, 800] });
          this.refreshRules();
        }
        break;
      }
      case 'boss':
        this.bossEvent(e);
        break;
      case 'info': {
        // the same tag (PIEL DE PIEDRA, CORRIENTE…) at most every few seconds
        const now = performance.now();
        if (now - (this.infoAt.get(e.text) ?? -1e9) < 3500) break;
        this.infoAt.set(e.text, now);
        const y = this.labels.place(e.x, e.y, e.text.length * 17, 40, 1300);
        tagLabel(this.wfx, e.x, y, e.text, e.color);
        break;
      }
      case 'phase':
        this.phaseQueue.push(e.n);
        break;
      case 'ultfx':
        if (!BattleScene.PRE_FX.has(e.fx)) atUlt(this.ultCtx(), e);
        if (e.fx === 'wellEnd') this.syncLate();
        break;
    }
  }

  private catEvent(e: Extract<BattleEvent, { k: 'cat' }>) {
    const bc = this.catViews.get(e.uid);
    if (!bc || bc.destroyed) return;
    const st = this.statusViews.get(e.uid);
    const gp = this.wfx.toLocal(bc.getGlobalPosition());
    if (e.shield) {
      sfx('shield');
      this.flt(gp.x, gp.y - 120, '¡BLOCK!', { color: C.cyan, size: 48 });
      return;
    }
    if (!e.ko) st?.set(e.fx);
    if (e.dmg > 0) this.flt(gp.x, gp.y - 150, `-${this.show(e.dmg)}`, { color: e.dot ? C.orange : C.red, size: e.dot ? 30 : 40, font: F.heavy });
    if (e.aff && e.aff > 1) this.flt(gp.x, gp.y - 200, `¡SÚPER EFECTIVO! x${e.aff}`, { color: C.yellow, size: 34, font: F.poster, rot: -0.08 });
    else if (e.aff && e.aff < 1) this.flt(gp.x, gp.y - 200, 'poco efectivo…', { color: 0xb9b2a0, size: 28, font: F.comic });
    if (e.stunned && !e.ko) {
      this.flt(gp.x, gp.y - 230, '¡ATURDIDO!', { color: C.yellow, size: 36, font: F.comic });
      st?.setStun(true);
    }
    if (!e.dot && !e.overboard) {
      gsap.fromTo(bc, { x: bc.x + (e.side === 0 ? -14 : 14) }, { x: bc.x, duration: 0.35, ease: 'elastic.out(1,0.3)' });
      bc.sprite.emote('hurt');
      if (e.element === 'electric' && !e.ko) st?.electrocute();
      else bc.impactFrame(90, false);
      if (e.element === 'fire' && e.fx.burning > 0 && !e.ko) this.flt(gp.x, gp.y - 190, '¡AY AY AY!', { color: C.orange, size: 34, rot: 0.15 });
      if (e.fx.frozen > 0 && !e.ko) this.flt(gp.x, gp.y - 190, '¡CONGELADO!', { color: 0xc6f0e4, size: 34 });
      // allies flinch
      for (const [uid, other] of this.catViews) {
        if (uid === e.uid || other.destroyed) continue;
        const oc = this.sim.sides[e.side].cats.find((k) => k.def.uid === uid);
        if (oc && !oc.ko) {
          gsap.fromTo(other.scale, { x: 1.08, y: 0.92 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
          other.sprite.emote('surprise', 0.7);
        }
      }
    }
    if (e.revived) {
      this.flt(gp.x, gp.y - 200, '¡SEGUNDA VIDA!', { color: C.lilac, size: 50 });
      sfx('reveal');
    }
    const splash = (x: number) => this.fxp.burst(x, WATER_Y, { count: 34, tint: [C.paper, C.megaBlue, 0x7fd8ff], angle: [-Math.PI * 0.95, -Math.PI * 0.05], speed: [250, 700] });
    if (e.ko) {
      if (e.side === 0) this.stats.catsLost++;
      st?.set({ burning: 0, shocked: 0, wet: 0, frozen: 0 });
      st?.setStun(false);
      if (this.flyer?.cat === bc) this.flyer = null;
      playKO(bc, this.wfx, this.world, WATER_Y, e.side, splash);
      this.cam.tx = gp.x;
      this.cam.ty = gp.y - 60;
      this.cam.tz = 1.2;
      time.slowmo(0.5, 500);
      window.setTimeout(() => {
        if (!this.follow) {
          this.cam.tx = W / 2;
          this.cam.ty = H / 2;
          this.cam.tz = 1;
        }
      }, 1300);
    } else if (e.overboard) {
      playOverboard(bc, this.wfx, WATER_Y, splash);
    }
  }

  private bossEvent(e: Extract<BattleEvent, { k: 'boss' }>) {
    const x = e.x ?? W / 2;
    const y = e.y ?? H / 2;
    switch (e.what) {
      case 'purr': {
        this.throat?.setPurr(e.n ?? 0);
        this.throat?.pulse(0.8);
        sfx('purr');
        const oy = this.labels.place(x, y - 120, 360, 90, 1000);
        onomatopoeia(this.wfx, x, oy, e.n === 2 ? 'RRRRRRR…' : 'RRRR…', { color: C.mint, size: 80 });
        if (e.n === 2) this.flt(x, y - 210, '¡A LA PRÓXIMA SE CURA! PÉGALE A LA GARGANTA', { color: C.pinkHot, size: 30, font: F.poster, dur: 1.6 });
        break;
      }
      case 'heal': {
        this.throat?.setPurr(0);
        this.throat?.pulse(1.6);
        sfx('purr');
        sfx('reveal');
        const oy = this.labels.place(x, y - 120, 500, 110, 1300);
        onomatopoeia(this.wfx, x, oy, '¡RRRRRRRRR!', { color: 0x7ed957, size: 110 });
        this.flt(x, y - 230, `RONRONEO CURATIVO +${this.show(e.n ?? 0)}`, { color: 0x7ed957, size: 40, font: F.poster, dur: 1.6 });
        break;
      }
      case 'purrStop': {
        this.throat?.setPurr(0);
        sfx('crit');
        this.flt(x, y - 140, '¡RONRONEO INTERRUMPIDO!', { color: C.yellow, size: 44, font: F.poster, dur: 1.4 });
        this.flt(x, y - 200, 'LA GÁRGOLA QUEDA ATURDIDA', { color: C.paper, size: 28, font: F.poster });
        break;
      }
      case 'rain':
        if (this.rain && !this.rain.active) {
          this.rain.setOn(true);
          this.rain.lightning();
          sfx('zap', 0.6);
        } else if (this.rain && Math.random() < 0.35) this.rain.lightning();
        break;
      case 'fly':
        this.startFlight(x, y);
        break;
      case 'perch':
        if (this.flyer) {
          const f = this.flyer;
          f.x = x;
          f.y = y + 60;
          gsap.to(f.cat, { x, duration: 0.7, ease: 'power2.inOut' });
          sfx('whoosh', 0.8);
        }
        break;
      case 'eyeTell':
        this.kraken?.setEye('tell');
        sfx('alarm');
        this.flt(x + 60, y - 120, 'EL PICO SE ABRE EN TU PRÓXIMO TURNO…', { color: C.yellow, size: 32, font: F.poster, dur: 1.6 });
        break;
      case 'eyeOpen':
        this.kraken?.setEye('open');
        sfx('sting');
        this.flt(x + 120, y - 130, '¡EL OJO! ¡DISPÁRALE!', { color: C.yellow, size: 52, font: F.poster, dur: 1.8 });
        this.cam.tx = x;
        this.cam.ty = y - 100;
        this.cam.tz = 1.15;
        window.setTimeout(() => {
          if (!this.follow) {
            this.cam.tx = W / 2;
            this.cam.ty = H / 2;
            this.cam.tz = 1;
          }
        }, 1100);
        break;
      case 'eyeClose':
        this.kraken?.setEye('closed');
        break;
      case 'weak': {
        sfx('crit');
        sfx('bigboom');
        if (!settings.reduceFlashes) flash(this.overlay, C.yellow, 0.5, 0.2);
        this.shaker.add(0.8);
        if (this.kraken) this.kraken.dazed = 2.5;
        const oy = this.labels.place(x, y - 120, 520, 120, 1300);
        onomatopoeia(this.wfx, x, oy, '¡PUNTO DÉBIL!', { color: C.yellow, size: 110 });
        this.flt(x, y - 230, 'DAÑO x2 AL NÚCLEO · KRAKEN ATURDIDO', { color: C.paper, size: 30, font: F.poster, dur: 1.6 });
        break;
      }
      case 'submerge': {
        this.kraken?.setSubmerged(true);
        const v = this.ships[1];
        if (this.spec.boss?.id === 'leviathan') {
          if (this.levDown) break;
          this.levDown = true;
        }
        gsap.to(v, { baseY: v.baseY + (this.spec.boss?.id === 'leviathan' ? 70 : 46), duration: 0.8, ease: 'power2.in' });
        sfx('splash');
        this.fxp.burst(x, WATER_Y, { count: 60, tint: [C.paper, C.megaBlue, 0x7fd8ff], angle: [-Math.PI * 0.95, -Math.PI * 0.05], speed: [300, 900] });
        this.flt(x, y - 260, '¡SE SUMERGE!', { color: C.cyan, size: 60, font: F.poster, dur: 1.6 });
        break;
      }
      case 'surface': {
        if (this.spec.boss?.id === 'leviathan') {
          this.surfaceLeviathan();
          break;
        }
        if (this.kraken?.submerged) {
          this.kraken.setSubmerged(false);
          const v = this.ships[1];
          gsap.to(v, { baseY: v.baseY - 46, duration: 0.6, ease: 'back.out(2)' });
          sfx('splash');
          this.flt(x, y - 260, '¡EMERGE!', { color: C.paper, size: 50, font: F.poster });
        }
        break;
      }
      case 'grab': {
        if (e.part !== undefined) this.kraken?.grab(e.part, x, y);
        sfx('hit');
        this.flt(x, y - 60, '¡ABRAZO!', { color: 0xd8a8ee, size: 40, font: F.comic });
        const m = e.module !== undefined ? this.sim.sides[e.side].ship.modules[e.module] : null;
        if (m && m.kind === 'cannon') this.flt(x, y - 110, 'CAÑÓN ATRAPADO', { color: C.paper, size: 26, font: F.poster });
        break;
      }
      case 'release':
        if (e.part !== undefined) this.kraken?.release(e.part);
        break;
      case 'throw': {
        const bc = e.uid ? this.catViews.get(e.uid) : undefined;
        if (bc && !bc.destroyed) {
          const v = this.ships[e.side];
          const y0 = bc.y;
          const waterLocal = WATER_Y - v.y + 20;
          sfx('meow', 1.5);
          gsap
            .timeline()
            .to(bc, { y: y0 - 140, duration: 0.25, ease: 'power2.out' })
            .to(bc, {
              y: waterLocal,
              duration: 0.35,
              ease: 'power2.in',
              onComplete: () => {
                if (!bc.destroyed) this.fxp.burst(this.wfx.toLocal(bc.getGlobalPosition()).x, WATER_Y, { count: 30, tint: [C.paper, C.megaBlue], angle: [-Math.PI * 0.9, -Math.PI * 0.1], speed: [200, 600] });
              },
            })
            .to(bc, { y: y0, duration: 0.5, delay: 0.5, ease: 'back.out(2)' });
          this.flt(x, y - 140, '¡AL AGUA, GATITO!', { color: C.cyan, size: 40, font: F.comic });
        }
        break;
      }
      case 'enrage':
        sfx('alarm');
        this.flt(x, y - 220, '¡ENFURECIDO! +25% DAÑO', { color: C.red, size: 52, font: F.poster, dur: 1.8 });
        this.shaker.add(0.4);
        break;
      case 'suddenDeath':
        sfx('alarm');
        this.turnBanner('MUERTE SÚBITA: ¡EL MAR SE TRAGA A AMBOS!', C.red);
        break;
      case 'wetDeck':
        if (!this.wetDeckShown) {
          this.wetDeckShown = true;
          this.flt(x, y, 'CUBIERTA SIEMPRE MOJADA', { color: 0x7fd8ff, size: 32, font: F.poster, dur: 1.4 });
        }
        break;
      case 'regrow':
        this.flt(x, y - 40, '¡RETOÑA!', { color: 0x7ed957, size: 34, font: F.comic });
        break;
      case 'staticUp':
        sfx('zap');
        sfx('shield');
        break;
      // ---------------------------------------------------------------- bosses 4–6
      case 'wardUp':
        this.ward?.setLayers(e.n ?? 0);
        sfx('shield');
        break;
      case 'wardHit': {
        sfx('shield');
        this.ward?.hit(x, y);
        const oy = this.labels.place(x, y - 80, 260, 90, 900);
        onomatopoeia(this.wfx, x, oy, '¡KSHIN!', { color: 0xc77dff, size: 90 });
        if (e.amount) this.flt(x - 120, y + 20, `CAPA -${this.show(e.amount)}`, { color: 0xe2b8ff, size: 34, font: F.heavy });
        this.shaker.add(0.15);
        break;
      }
      case 'wardPop': {
        sfx('bigboom');
        this.ward?.pop();
        this.ward?.setLayers(e.n ?? 0);
        const oy = this.labels.place(x, y - 110, 300, 100, 1000);
        onomatopoeia(this.wfx, x, oy, '¡CRASH!', { color: 0xe2b8ff, size: 110 });
        this.flt(x, y + 30, (e.n ?? 0) > 0 ? `¡CAPA ROTA! QUEDAN ${e.n}` : '¡ESCUDO ARCANO DESTRUIDO!', { color: C.yellow, size: 44, font: F.poster, dur: 1.5 });
        this.shaker.add(0.5);
        break;
      }
      case 'reflect':
        sfx('shield');
        this.ward?.hit(x, y);
        this.flt(x, y - 60, '¡ESPEJO! LA RUNA REBOTA', { color: 0xc77dff, size: 40, font: F.poster, dur: 1.4 });
        break;
      case 'portalMove':
        sfx('reveal');
        this.portalFx?.set(this.sim.portals, this.sim.portalNext);
        break;
      case 'inkSummon':
        sfx('splash');
        sfx('reveal');
        this.syncLate();
        this.flt(x, y - 60, '¡TINTA, A MÍ!', { color: C.paper, size: 50, font: F.poster, dur: 1.5 });
        break;
      case 'grimoire':
        if (e.n) {
          sfx('sting');
          this.flt(x, y - 120, 'EL GRIMORIO SE ABRE: x1.5 ESTE TURNO', { color: C.yellow, size: 36, font: F.poster, dur: 1.6 });
        }
        this.syncLate();
        break;
      case 'gravity': {
        sfx('whoosh', 0.6);
        this.syncLate();
        const t = e.n === 2 ? 'TODO PESA MENOS' : e.n === 3 ? '¡ABAJO ES ARRIBA!' : '';
        if (t) this.flt(W / 2, 300, t, { color: 0xe8c45a, size: 60, font: F.poster, dur: 1.6 });
        break;
      }
      case 'starTell':
        sfx('alarm');
        sfx('charge');
        this.syncLate();
        this.flt(x, y - 150, 'CARGA LLUVIA DE ESTRELLAS…', { color: C.yellow, size: 44, font: F.poster, dur: 1.8 });
        this.flt(W * 0.25, 260, 'MIRA LAS MIRAS EN TU BARCO: TIENES UN TURNO', { color: C.paper, size: 30, font: F.poster, dur: 2 });
        break;
      case 'starStop':
        sfx('crit');
        this.syncLate();
        this.flt(x, y - 140, '¡LLUVIA CANCELADA!', { color: C.yellow, size: 56, font: F.poster, dur: 1.6 });
        break;
      case 'freeze':
        sfx('freeze');
        this.syncLate();
        this.flt(x, y - 40, `EL MAR SE ENFRÍA ${e.n ?? 0}/3`, { color: 0xc6f0e4, size: 32, font: F.poster });
        break;
      case 'seaFrozen': {
        sfx('freeze');
        sfx('bigboom');
        this.syncLate();
        const oy = this.labels.place(x, y - 160, 420, 120, 1300);
        onomatopoeia(this.wfx, x, oy, '¡CRIIIC!', { color: 0xdff8ff, size: 120 });
        this.flt(x, y - 250, '¡MAR CONGELADO! ESPIRÁCULO ATRAPADO · TIERRA = ESTALLIDO x2', { color: C.paper, size: 32, font: F.poster, dur: 2 });
        this.surfaceLeviathan();
        break;
      }
      case 'thaw':
        this.syncLate();
        this.flt(x, y - 200, 'EL HIELO SE ROMPE', { color: 0x7fd8ff, size: 40, font: F.poster });
        break;
      case 'breath': {
        sfx('splash');
        this.surfaceLeviathan();
        this.syncLate();
        this.flt(x, y - 160, '¡SALE A RESPIRAR! ¡AL ESPIRÁCULO!', { color: C.yellow, size: 48, font: F.poster, dur: 1.8 });
        this.cam.tx = x;
        this.cam.ty = y - 60;
        this.cam.tz = 1.1;
        window.setTimeout(() => {
          if (!this.follow) {
            this.cam.tx = W / 2;
            this.cam.ty = H / 2;
            this.cam.tz = 1;
          }
        }, 1100);
        break;
      }
      case 'devourTell':
        sfx('sting');
        this.syncLate();
        this.flt(x, y - 140, 'DISTRAXIA TE ESTÁ MIRANDO', { color: 0xc77dff, size: 40, font: F.poster, dur: 1.6 });
        break;
      case 'devour': {
        sfx('bigboom');
        if (!settings.reduceFlashes) flash(this.overlay, 0x2a0040, 0.6, 0.4);
        const oy = this.labels.place(x, y - 120, 360, 110, 1200);
        onomatopoeia(this.wfx, x, oy, 'BORRADO', { color: 0xc77dff, size: 110 });
        this.flt(x, y - 220, 'DISTRAXIA SE COMIÓ UN MÓDULO', { color: C.paper, size: 34, font: F.poster, dur: 1.6 });
        this.shaker.add(0.6);
        break;
      }
      case 'devourStop':
        sfx('crit');
        this.flt(x, y - 140, '¡PARPADEÓ! TU MÓDULO SE SALVA', { color: C.yellow, size: 40, font: F.poster, dur: 1.5 });
        break;
      case 'coreSwitch': {
        sfx('alarm');
        this.syncLate();
        const t = e.n === 2 ? 'DESPIERTA EL ESPIRÁCULO' : e.n === 3 ? 'EL CORAZÓN HONDO DESPIERTA' : '';
        if (t) this.flt(x, y - 140, t, { color: C.yellow, size: 44, font: F.poster, dur: 1.8 });
        break;
      }
      case 'immune': {
        const nowI = performance.now();
        if (nowI - (this.infoAt.get('immune') ?? -1e9) < 3500) break;
        this.infoAt.set('immune', nowI);
        this.flt(x, y, 'NÚCLEO DORMIDO: INMUNE', { color: 0x9fb4c8, size: 28, font: F.poster });
        break;
      }
    }
  }

  /** the Leviatán comes up (breath / frozen) or goes back down */
  private levDown = false;
  private surfaceLeviathan() {
    if (!this.levDown) return;
    this.levDown = false;
    const v = this.ships[1];
    gsap.to(v, { baseY: v.baseY - 70, duration: 0.6, ease: 'back.out(2)' });
  }

  /** phase 3 gargoyle: the boss cat leaves the tower and hovers above the ship */
  private startFlight(x: number, y: number) {
    const uid = this.spec.boss?.captain;
    const bc = uid ? this.catViews.get(uid) : undefined;
    if (!bc || bc.destroyed) return;
    const wp = this.world.toLocal(bc.getGlobalPosition());
    this.world.addChildAt(bc, this.world.getChildIndex(this.debris));
    bc.position.copyFrom(wp);
    if (this.wings) this.wings.flying = true;
    this.flyer = { cat: bc, x, y: y + 60 };
    sfx('whoosh');
    sfx('purr');
    gsap.to(bc, { x, duration: 0.9, ease: 'back.out(1.4)' });
    speedLines(this.wfx, x, y, C.ink, 40, 0.6);
    this.flt(x, y - 160, '¡AHORA VUELO!', { color: C.yellow, size: 54, font: F.poster, dur: 1.4 });
  }

  // ---------------------------------------------------------------- end
  /** storyboard (e): chain explosions accelerating, then the loser's ship sinks tilted */
  async sinkSequence(loser: number) {
    const v = this.ships[loser];
    const cells = this.sim.sides[loser].ship.cells();
    this.cam.tx = v.x + v.width / 2;
    this.cam.ty = v.y + v.height / 2;
    this.cam.tz = 1.1;
    time.slowmo(0.6, 600);
    let delay = 120;
    const n = Math.min(10, cells.length);
    for (let i = 0; i < n; i++) {
      const c = cells[Math.floor(Math.random() * cells.length)];
      const p = this.sim.cellCenter(loser, c.x, c.y);
      window.setTimeout(() => {
        sfx(i === n - 1 ? 'bigboom' : 'boom', 1 + i * 0.06);
        this.fxp.burst(p.x, p.y, { count: 26, tint: [C.orange, C.yellow, C.red, C.ink], speed: [150, 700], life: [0.4, 0.9], scale: [0.5, 1.3], stepped: true });
        this.shaker.add(0.25);
        v.hitReact(p.x, p.y, 0.6);
        if (i % 3 === 0) onomatopoeia(this.wfx, p.x, p.y - 60, ['¡BOOM!', '¡KABOOM!', '¡KRAK!', '¡PUM!'][i % 4], { color: C.yellow, size: 90 });
      }, delay * i);
      delay = Math.max(60, delay - 8);
    }
    await wait(delay * n + 200);
    sfx('splash');
    this.sinking.add(v);
    gsap.to(v, { y: v.y + 520, rotation: loser === 1 ? 0.35 : -0.35, duration: 1.6, ease: 'power2.in' });
    if (loser === 1) {
      if (this.kraken) gsap.to([this.kraken, this.kraken.back], { y: 520, duration: 1.6, ease: 'power2.in' });
      if (this.throat) gsap.to(this.throat, { alpha: 0, duration: 0.6 });
    }
    for (const b of this.bubbles) b?.setOn(false);
    for (let i = 0; i < 4; i++)
      window.setTimeout(() => !v.destroyed && !this.fxp.destroyed && this.fxp.burst(v.x + Math.random() * v.width, WATER_Y, { count: 30, tint: [C.paper, C.megaBlue, 0x7fd8ff], angle: [-Math.PI * 0.95, -Math.PI * 0.05], speed: [250, 750] }), 300 + i * 280);
    onomatopoeia(this.wfx, v.x + v.width / 2, WATER_Y - 160, loser === 1 ? '¡HUNDIDO!' : '¡GLU GLU GLU!', { color: C.paper, size: 120, dur: 1.4 });
    await wait(1500);
    this.cam.tx = W / 2;
    this.cam.ty = H / 2;
    this.cam.tz = 1;
  }

  async finish(): Promise<void> {
    if (this.phase === 'end') return;
    this.phase = 'end';
    this.refreshCards();
    const won = this.sim.winner === 0;
    if (this.spec.boss) {
      const boss = BOSSES.find((b) => b.zone === this.spec.meta?.zone && (b.type === 'zone_boss' || b.type === 'final_boss'));
      const line = won ? boss?.lines.defeat : boss?.lines.win;
      if (line && boss) this.speech(this.ships[1], boss.name, line, 3.2);
    }
    // the last core of the Primer Mar falls: the prologue's blow closes the circle — STARFALL
    if (won && this.spec.boss?.id === 'leviathan') await this.finale();
    this.rain?.setOn(false);
    this.celebrate(won);
    await this.sinkSequence(won ? 1 : 0);
    const layer = new Container();
    this.overlay.addChild(layer);
    const dim = new Graphics().rect(0, 0, W, H).fill({ color: won ? C.paper : C.oceanNoir, alpha: 0.92 });
    const circle = new Graphics().circle(0, 0, 300).fill(won ? C.pink : C.river);
    circle.position.set(W / 2, H / 2);
    const title = poster(won ? '¡VICTORIA!' : 'DERROTA', 220, won ? C.ink : C.paper, { letterSpacing: -4 });
    title.anchor.set(0.5);
    title.position.set(W / 2, H / 2 - 40);
    const reasonTxt =
      this.sim.reason === 'retreat'
        ? 'SE FUE… PERO SE ACUERDA DE TI'
        : this.sim.reason === 'core'
        ? won
          ? 'LE REVENTASTE EL NÚCLEO'
          : 'TE REVENTARON EL NÚCLEO'
        : this.sim.reason === 'crew'
          ? won
            ? 'TRIPULACIÓN ENEMIGA K.O.'
            : 'TUS GATOS ESTÁN K.O.'
          : won
            ? 'BARCO ENEMIGO HUNDIDO'
            : 'TE HUNDIERON, CAPI';
    const sub = txt(reasonTxt, { fontFamily: F.poster, fontSize: 44, fill: won ? C.pinkHot : C.yellow });
    sub.anchor.set(0.5);
    sub.position.set(W / 2, H / 2 + 100);
    const hint = txt('CLIC PARA CONTINUAR', { fontFamily: F.poster, fontSize: 28, fill: won ? C.ink : C.paper });
    hint.anchor.set(0.5);
    hint.position.set(W / 2, H - 80);
    layer.addChild(dim, circle, title, sub, hint);
    // K.O. ranks reached in this battle + repair clock
    const stamps = new Container();
    let sy = 0;
    for (const [uid, n] of Object.entries(this.kos)) {
      const owned = G.s.cats.find((c) => c.uid === uid);
      if (!owned) continue;
      const before = koRank(owned.kos ?? 0);
      const after = koRank((owned.kos ?? 0) + n);
      const up = after.tier > before.tier;
      const line = up ? `${owned.name.toUpperCase()}: ¡RANGO ${after.name.toUpperCase()}! (+2 ORBES)` : `${owned.name.toUpperCase()}: +${n} K.O.`;
      const t = txt(line, { fontFamily: F.poster, fontSize: up ? 30 : 22, fill: up ? C.yellow : won ? C.ink : C.paper, stroke: up ? { color: C.ink, width: 6 } : undefined });
      t.position.set(0, sy);
      sy += t.height + 4;
      stamps.addChild(t);
    }
    const lost = 1 - this.sim.hullPct(0);
    if (this.spec.mode !== 'duel' && (lost > 0.005 || !won)) {
      const secs = Math.round(Math.max(won ? 0 : 30, lost * 100) * 0.6);
      const t = txt(`REPARACIÓN DEL BARCO: ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')} (reloj verde)`, { fontFamily: F.ui, fontWeight: '700', fontSize: 20, fill: won ? C.ink : C.paper });
      t.position.set(0, sy + 10);
      stamps.addChild(t);
    }
    stamps.position.set(60, H - 80 - stamps.height);
    layer.addChild(stamps);
    sfx(won ? 'fanfare' : 'sting');
    gsap.from(circle.scale, { x: 0, y: 0, duration: 0.4, ease: 'back.out(2)' });
    gsap.from(title.scale, { x: 2.5, y: 2.5, duration: 0.3, ease: 'back.out(2)', delay: 0.1 });
    gsap.from(stamps, { x: -500, duration: 0.4, delay: 0.4, ease: 'power3.out' });
    if (won) sparkles(layer, W / 2, H / 2 - 40, C.yellow, 24, 500);
    gsap.to(hint, { alpha: 0.3, yoyo: true, repeat: -1, duration: 0.6 });
    await wait(600);
    layer.eventMode = 'static';
    layer.hitArea = { contains: () => true };
    layer.once('pointertap', () => {
      const result: BattleResult = {
        won,
        reason: this.sim.reason,
        turns: this.sim.turn,
        modulesDestroyed: this.stats.modulesDestroyed,
        damageDealt: this.stats.damageDealt,
        catsLost: this.stats.catsLost,
        perfect: won && this.stats.catsLost === 0,
        mvp: [...this.dmgBy.entries()].sort((a, b) => b[1] - a[1])[0]?.[0],
        kos: { ...this.kos },
        hullLost: this.spec.mode === 'duel' ? 0 : lost,
        reactions: [...this.reactions],
        enemyHullLost: this.spec.mode === 'duel' ? 0 : 1 - this.sim.hullPct(1),
      };
      this.spec.onEnd(result);
    });
  }

  /** EL PRIMER MAR: Astra Prima's STELLAR DECREE: STARFALL, the same shot as the prologue */
  private async finale() {
    const layer = new Container();
    this.overlay.addChild(layer);
    const dim = new Graphics().rect(0, 0, W, H).fill({ color: 0x05030a, alpha: 0.9 });
    layer.addChild(dim);
    const astra = CAT_BY_ID.get('l_astraprima');
    if (astra) {
      await preloadCats([astra.art.slug]).catch(() => undefined);
      const cat = new BattleCat(astra.art.slug, 'cosmic', 520, false);
      cat.position.set(480, H / 2 + 240);
      layer.addChild(cat);
      gsap.from(cat, { x: -300, duration: 0.35, ease: 'power3.out' });
      cat.sprite.emote('attack', 1.4);
    }
    const t = poster('STELLAR DECREE:', 90, C.paper, { stroke: { color: C.ink, width: 10 } });
    t.anchor.set(0.5);
    t.position.set(W / 2 + 280, H / 2 - 120);
    const t2 = poster('STARFALL!', 170, C.yellow, { stroke: { color: C.ink, width: 12 } });
    t2.anchor.set(0.5);
    t2.position.set(W / 2 + 280, H / 2 + 20);
    const k = txt('星の勅令', { fontFamily: F.poster, fontSize: 60, fill: 0x00e5ff });
    k.anchor.set(0.5);
    k.position.set(W / 2 + 280, H / 2 + 150);
    layer.addChild(t, t2, k);
    speedLines(layer, W / 2, H / 2, 0x00e5ff, 70, 1.2);
    sfx('charge');
    gsap.from(t2.scale, { x: 3, y: 3, duration: 0.25, ease: 'back.out(2)', delay: 0.15 });
    await wait(settings.reduceMotion ? 700 : 1500);
    gsap.to(layer, { alpha: 0, duration: 0.25, onComplete: () => layer.destroy({ children: true }) });
    // the star falls on the whale
    const v = this.ships[1];
    const tx = v.x + v.width * 0.5;
    const star = new Graphics();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      star.moveTo(Math.cos(a) * 90, Math.sin(a) * 90).lineTo(Math.cos(a) * 170, Math.sin(a) * 170).stroke({ width: 10, color: 0xfff2c0 });
    }
    star.circle(0, 0, 110).fill(0xfff2c0).stroke({ width: 10, color: C.ink });
    star.circle(0, 0, 70).fill(0xffffff);
    star.position.set(tx + 400, -300);
    this.wfx.addChild(star);
    sfx('whoosh');
    await new Promise<void>((r) => gsap.to(star, { x: tx, y: v.y + v.height * 0.4, rotation: 3, duration: 0.9, ease: 'power2.in', onComplete: () => r() }));
    sfx('bigboom');
    if (!settings.reduceFlashes) flash(this.overlay, 0xffffff, 1, 0.8);
    this.shaker.add(1.2);
    onomatopoeia(this.wfx, tx, v.y - 40, '¡STARFALL!', { color: C.yellow, size: 170, dur: 1.6 });
    this.fxp.burst(tx, v.y + v.height * 0.4, { count: 80, tint: [0xfff2c0, 0x00e5ff, C.yellow, C.ink], speed: [300, 1200], life: [0.5, 1.2], scale: [0.5, 1.5], stepped: true });
    gsap.to(star, { alpha: 0, duration: 0.4, onComplete: () => star.destroy() });
    await wait(900);
  }

  /** end of the fight: the crew that's still standing reacts (party hops / ears down) */
  private celebrate(won: boolean) {
    let i = 0;
    for (const [uid, bc] of this.catViews) {
      const c = this.sim.sides[0].cats.find((k) => k.def.uid === uid);
      if (!c || c.ko || bc.destroyed) continue;
      const k = i++;
      if (won) {
        for (let n = 0; n < 4; n++)
          window.setTimeout(() => {
            if (bc.destroyed) return;
            bc.sprite.emote('happy');
            bc.sprite.crouch = 0.6;
            window.setTimeout(() => !bc.destroyed && (bc.sprite.crouch = -0.3), 90);
            gsap.fromTo(bc, { y: bc.y }, { y: bc.y - 40, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out', onComplete: () => !bc.destroyed && (bc.sprite.crouch = 0) });
          }, k * 140 + n * 520);
      } else {
        bc.sprite.emote('hurt', 0.6);
        bc.sprite.crouch = 0.35;
        bc.sprite.emote('sleepy', 0.8);
      }
    }
  }

  override update(dt: number) {
    this.t += dt;
    for (const v of this.ships) if (!this.sinking.has(v)) v.bob(dt * time.scale);
    // the sea breeze is part of the fight: fur, tails and ears drift with the battle wind
    const wind = this.sim.wind / 70;
    for (const bc of this.catViews.values()) if (!bc.destroyed) bc.sprite.wind = wind * (bc.flip ? -1 : 1);
    if (this.flyer && !this.flyer.cat.destroyed) this.flyer.cat.y = this.flyer.y + Math.sin(this.t * 3) * 12;
    // camera rig: follow the projectile but keep the target ship fully in frame (never cut a ship)
    if (this.follow && !this.follow.destroyed) {
      const fx = this.follow.x;
      const fy = this.follow.y;
      const box = this.followBox;
      if (box) {
        const minX = Math.min(fx - 90, box.x - 50);
        const maxX = Math.max(fx + 90, box.x + box.w + 50);
        const minY = Math.min(fy - 90, box.y - 80);
        const maxY = Math.max(fy + 60, WATER_Y + 70);
        this.cam.tz = Math.max(1, Math.min(1.16, W / Math.max(1, maxX - minX), H / Math.max(1, maxY - minY)));
        this.cam.tx = (minX + maxX) / 2;
        this.cam.ty = (minY + maxY) / 2;
      } else {
        this.cam.tx = fx;
        this.cam.ty = Math.min(fy, WATER_Y - 200);
      }
    }
    const k = 1 - Math.exp(-dt * 4);
    this.cam.x += (this.cam.tx - this.cam.x) * k;
    this.cam.y += (this.cam.ty - this.cam.y) * k;
    this.cam.z += (this.cam.tz - this.cam.z) * (1 - Math.exp(-dt * 5));
    const z = Math.max(1, this.cam.z);
    const hw = W / (2 * z);
    const hh = H / (2 * z);
    const cx = Math.max(hw, Math.min(W - hw, this.cam.x));
    const cy = Math.max(hh, Math.min(H - hh, this.cam.y));
    this.camRoot.scale.set(z);
    this.camRoot.position.set(W / 2 - cx * z, H / 2 - cy * z);
    if (this.sky) this.sky.wind = this.sim?.wind ?? 0;
  }
}

function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export { scenes };
