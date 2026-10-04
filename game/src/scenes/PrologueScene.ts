/**
 * Beat b00 — "EN ALGÚN MOMENTO DEL FUTURO…" (NEÓN GLITCH + MANGA TINTA).
 * Arca Celestial + Astra Prima ★6 vs the Leviatán that covers the sky. Luzterna: "mantén… y suelta".
 * Hold & release → STELLAR DECREE: STARFALL (anime cut-in, meteor, impact frames, hitstop, shake) →
 * the giant ship splits in THREE comic panels → newspaper "¡EXTRA! ¡EXTRA!" → "MUCHO ANTES…".
 * Short (≈30–45 s with reading), spectacular and skippable at any time.
 */
import { Container, Graphics, Rectangle, Sprite, Text, Texture, TilingSprite } from 'pixi.js';
import { GlitchFilter, GlowFilter, OutlineFilter, RGBSplitFilter, ShockwaveFilter } from 'pixi-filters';
import gsap from 'gsap';
import { Scene } from '../core/scenes';
import { W, H, game } from '../core/App';
import { sfx } from '../core/audio';
import { music } from '../core/music';
import { settings } from '../core/settings';
import { C, F } from '../ui/theme';
import { poster, txt } from '../ui/widgets';
import { BattleCat, catTexture, preloadCats } from '../art/catArt';
import { glowTexture, halftoneTexture, paperTexture, sparkTexture } from '../art/textures';
import { ComicFilter, InkFilter, SilhouetteFilter } from '../fx/filters';
import { Shaker, flash, onomatopoeia, sparkles, speedLines } from '../fx/juice';
import { ShipModel, ShipBlueprint, CELL } from '../battle/ship';
import { AnimeShipView, ANIME_BLUEPRINTS } from '../battle/anime';
import { cancelDialogs, newspaper, say } from '../ui/dialog';
import { preloadStoryArt } from '../ui/story/portrait';
import { BEAT_BY_ID } from '../data/content';
import { clean } from '../ui/story/text';
import { destroyDeep, killTweensDeep } from '../ui/story/tweens';

const WATER_Y = 800;
const ARCA_WATER = 872;

/** the Leviatán: a galleon-shaped monster, 30x14 cells (rendered at x2) */
const LEVIATHAN: ShipBlueprint = {
  cols: 30,
  rows: 14,
  hull: [
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    'IIII..........................',
    'IIIII...................IIII..',
    'IIIIII.................IIIII..',
    'IIIIIIIIIIIIIIIIIIIIIIIIIIIIII',
    'IIIIIIIIIIIIIIIIIIIIIIIIIIIIII',
    'WWWIIWWWWWWWIIWWWWWWWWIIWWWWWW',
    '.WWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    '..WWWWWWWWWWWWWWWWWWWWWWWWWWW.',
    '....WWWWWWWWWWWWWWWWWWWWWWW...',
  ],
  modules: [
    { kind: 'mast', x: 8, y: 1, w: 1, h: 7 },
    { kind: 'mast', x: 15, y: 0, w: 1, h: 8 },
    { kind: 'mast', x: 22, y: 2, w: 1, h: 6 },
    { kind: 'catroom', x: 0, y: 3, w: 2, h: 2, slot: 0 },
    { kind: 'catroom', x: 11, y: 6, w: 2, h: 2, slot: 1 },
    { kind: 'catroom', x: 18, y: 6, w: 2, h: 2, slot: 2 },
    { kind: 'cannon', x: 26, y: 5, w: 2, h: 1 },
    { kind: 'cannon', x: 3, y: 4, w: 2, h: 1 },
    { kind: 'core', x: 14, y: 10, w: 2, h: 2 },
    { kind: 'powder', x: 24, y: 11, w: 1, h: 1 },
    { kind: 'engine', x: 3, y: 11, w: 2, h: 1 },
  ],
};

const realWait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
/** game-time wait (follows gsap's global timeScale, so the whole sequence can be slowed for debugging) */
const wait = (ms: number) => new Promise<void>((r) => gsap.delayedCall(ms / 1000, () => r()));

function gradientTexture(stops: [number, string][], w: number, h: number): Texture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 0, h);
  for (const [o, col] of stops) grd.addColorStop(o, col);
  g.fillStyle = grd;
  g.fillRect(0, 0, w, h);
  return Texture.from(c);
}

export class PrologueScene extends Scene {
  private sky = new Container();
  /** camera container (position/pivot/scale) */
  private world = new Container();
  /** shake wrapper (Shaker owns its pivot) */
  private shakeBox = new Container();
  private fxLayer = new Container();
  private ui = new Container();
  private impactBg = new Graphics();
  private shaker!: Shaker;
  private levi!: AnimeShipView;
  private leviRoot = new Container();
  private arca!: AnimeShipView;
  private astra!: BattleCat;
  private halo = new Container();
  private eyes: Container[] = [];
  private waves = new Graphics();
  private reflections = new Container();
  private seaOver!: Sprite;
  private stars: Sprite[] = [];
  private t = 0;
  private acc = 0;
  private skipped = false;
  private finished = false;
  private cam = { x: W / 2, y: H / 2, s: 1 };
  private glitch?: GlitchFilter;
  private rgb?: RGBSplitFilter;

  constructor(private onDone: () => void) {
    super();
  }

  override async enter() {
    music.play('tension');
    const black = new Graphics().rect(0, 0, W, H).fill(C.chaos);
    this.addChild(black);
    const loading = poster('…', 60, C.cyan);
    loading.anchor.set(0.5);
    loading.position.set(W / 2, H / 2);
    this.addChild(loading);
    await Promise.all([preloadCats(['regal_cosmic_cat']), preloadStoryArt()]);
    loading.destroy();
    if (this.destroyed) return;
    this.build();
    this.addSkip();
    (globalThis as unknown as { __prologue: unknown }).__prologue = this;
    void this.run();
  }

  // ================================================================ build
  private build() {
    // sky (screen space, behind the camera)
    const sky = new Sprite(
      gradientTexture(
        [
          [0, '#07060c'],
          [0.45, '#1a0f2e'],
          [0.78, '#3a1747'],
          [1, '#5c1f4f'],
        ],
        8,
        512,
      ),
    );
    sky.width = W;
    sky.height = H;
    this.sky.addChild(sky);
    const neb = (x: number, y: number, s: number, tint: number, a: number) => {
      const g = new Sprite(glowTexture());
      g.anchor.set(0.5);
      g.position.set(x, y);
      g.scale.set(s);
      g.tint = tint;
      g.alpha = a;
      g.blendMode = 'add';
      this.sky.addChild(g);
      return g;
    };
    neb(380, 260, 9, C.pinkHot, 0.22);
    neb(1500, 180, 12, C.violet, 0.28);
    neb(1000, 640, 14, C.cyan, 0.1);
    const starG = new Graphics();
    for (let i = 0; i < 220; i++) starG.circle(Math.random() * W, Math.random() * 760, Math.random() < 0.9 ? 1.2 : 2.2).fill({ color: 0xffffff, alpha: 0.3 + Math.random() * 0.6 });
    this.sky.addChild(starG);
    for (let i = 0; i < 26; i++) {
      const s = new Sprite(sparkTexture());
      s.anchor.set(0.5);
      s.position.set(Math.random() * W, Math.random() * 700);
      s.scale.set(0.12 + Math.random() * 0.25);
      s.tint = Math.random() < 0.5 ? C.cyan : 0xffd7f0;
      s.blendMode = 'add';
      this.stars.push(s);
      this.sky.addChild(s);
    }
    // neon scanlines (NEÓN GLITCH)
    const scan = new Graphics();
    for (let y = 0; y < H; y += 4) scan.rect(0, y, W, 1).fill({ color: 0x000000, alpha: 0.18 });
    this.shakeBox.addChild(this.world);
    this.addChild(this.sky, this.impactBg, this.shakeBox, this.fxLayer, this.ui);
    this.impactBg.visible = false;

    // ---------------------------------------------------------- world
    // far fog behind the Leviatán (Distraxia)
    const fog = new Container();
    for (let i = 0; i < 9; i++) {
      const g = new Sprite(glowTexture());
      g.anchor.set(0.5);
      g.position.set(1100 + i * 260, 200 + Math.sin(i * 1.7) * 160);
      g.scale.set(7 + (i % 3) * 2);
      g.tint = i % 2 ? C.violet : C.plum;
      g.alpha = 0.32;
      fog.addChild(g);
      gsap.to(g, { x: g.x + 60, alpha: 0.18, duration: 3 + i * 0.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    }
    this.world.addChild(fog);
    // a huge neon moon behind it (Swiss circle) so the silhouette reads
    const moon = new Container();
    const mg = new Sprite(glowTexture());
    mg.anchor.set(0.5);
    mg.tint = C.pinkHot;
    mg.alpha = 0.55;
    mg.scale.set(13);
    mg.blendMode = 'add';
    const disc = new Graphics().circle(0, 0, 430).fill(C.pinkHot);
    disc.alpha = 0.92;
    const dots = new TilingSprite({ texture: halftoneTexture(0x8a1050, 14, 4), width: 880, height: 880 });
    dots.position.set(-440, -440);
    dots.alpha = 0.45;
    const dm = new Graphics().circle(0, 0, 430).fill(0xffffff);
    dots.mask = dm;
    const rings = new Graphics().circle(0, 0, 470).stroke({ width: 4, color: C.cyan, alpha: 0.7 }).circle(0, 0, 520).stroke({ width: 2, color: C.cyan, alpha: 0.35 });
    moon.addChild(mg, disc, dots, dm, rings);
    moon.position.set(1780, 260);
    this.world.addChild(moon);

    // the Leviatán
    const lm = new ShipModel(LEVIATHAN, 1);
    this.levi = new AnimeShipView(lm, true, 'pirate', { resolution: 1.5 });
    const ls = 2.7;
    this.levi.scale.set(ls);
    this.levi.position.set(1010, WATER_Y - this.levi.waterLocalY * ls);
    this.levi.baseY = this.levi.y;
    this.levi.tint = 0x7d6c9e;
    this.leviRoot.addChild(this.levi);
    this.world.addChild(this.leviRoot);
    // Distraxia's eyes in the rigging
    for (let i = 0; i < 9; i++) {
      const e = this.makeEye(26 + Math.random() * 26);
      e.position.set(1150 + Math.random() * 2600, -200 + Math.random() * 700);
      this.leviRoot.addChild(e);
      this.eyes.push(e);
    }
    // sea (world space, very wide so the camera can zoom out)
    const seaTex = gradientTexture(
      [
        [0, '#2a1c49'],
        [0.12, '#172b35'],
        [1, '#05080a'],
      ],
      8,
      512,
    );
    const sea = new Sprite(seaTex);
    sea.position.set(-2500, WATER_Y - 6);
    sea.width = 8000;
    sea.height = 2400;
    this.world.addChildAt(sea, 1);
    // translucent water over the Leviatán's keel (sunk pieces vanish behind it)
    this.seaOver = new Sprite(seaTex);
    this.seaOver.position.set(-2500, WATER_Y + 4);
    this.seaOver.width = 8000;
    this.seaOver.height = 2400;
    this.seaOver.alpha = 0.88;
    this.world.addChild(this.seaOver);
    // neon reflections
    for (let i = 0; i < 60; i++) {
      const r = new Graphics().rect(0, 0, 40 + Math.random() * 160, 3).fill({ color: Math.random() < 0.5 ? C.pinkHot : C.cyan, alpha: 0.25 + Math.random() * 0.35 });
      r.position.set(-600 + Math.random() * 4200, WATER_Y + 14 + Math.pow(Math.random(), 1.6) * 280);
      this.reflections.addChild(r);
    }
    this.reflections.blendMode = 'add';
    this.world.addChild(this.reflections);

    // Arca Celestial
    const am = new ShipModel(ANIME_BLUEPRINTS.celestial, 1);
    this.arca = new AnimeShipView(am, false, 'cosmic');
    const as = 1;
    this.arca.scale.set(as);
    this.arca.position.set(30, ARCA_WATER - this.arca.waterLocalY * as);
    this.arca.baseY = this.arca.y;
    const aura = new Sprite(glowTexture());
    aura.anchor.set(0.5);
    aura.tint = C.cyan;
    aura.alpha = 0.35;
    aura.blendMode = 'add';
    aura.scale.set(7, 4);
    aura.position.set(390, ARCA_WATER - 160);
    this.world.addChild(aura, this.arca);
    // Astra Prima ★6 on the forecastle
    this.astra = new BattleCat('regal_cosmic_cat', 'cosmic', 300, false);
    this.astra.comic.strength = 0.35;
    const deckY = ARCA_WATER - (this.arca.waterLocalY - 6 * CELL) * as;
    this.astra.position.set(470, deckY + 6);
    const back = new Sprite(glowTexture());
    back.anchor.set(0.5);
    back.tint = C.cyan;
    back.blendMode = 'add';
    back.alpha = 0.75;
    back.scale.set(4.2, 4.8);
    back.position.set(470, deckY - 150);
    const back2 = new Sprite(glowTexture());
    back2.anchor.set(0.5);
    back2.tint = 0xffffff;
    back2.blendMode = 'add';
    back2.alpha = 0.5;
    back2.scale.set(2.2, 2.8);
    back2.position.set(470, deckY - 150);
    gsap.to([back, back2], { alpha: '-=0.2', duration: 1.1, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    this.buildHalo();
    this.halo.position.set(-10, -300 * 0.97);
    this.astra.addChild(this.halo);
    this.world.addChild(back, back2, this.astra);
    const tag = new Container();
    const tt = txt('ASTRA PRIMA', { fontFamily: F.poster, fontSize: 30, fill: C.cyan });
    const ts = txt('★★★★★★  FORMA ASCENDIDA', { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: C.yellow, letterSpacing: 2 });
    ts.position.set(0, 34);
    const tw = Math.max(tt.width, ts.width) + 24;
    tag.addChild(new Graphics().rect(0, 0, tw, 62).fill({ color: C.chaos, alpha: 0.85 }).stroke({ width: 2, color: C.cyan }), tt, ts);
    tt.position.set(12, 2);
    ts.position.set(12, 38);
    tag.position.set(600, deckY - 280);
    tag.alpha = 0;
    tag.label = 'astraTag';
    this.world.addChild(tag);
    // foreground waves
    this.world.addChild(this.waves);

    this.shaker = new Shaker(this.shakeBox, 34, 0.035);
    this.applyCam();
  }

  private makeEye(r: number) {
    const c = new Container();
    const glow = new Sprite(glowTexture());
    glow.anchor.set(0.5);
    glow.tint = C.violet;
    glow.scale.set(r / 22);
    glow.alpha = 0.7;
    const g = new Graphics();
    g.ellipse(0, 0, r, r * 0.45).fill(0xf4e9ff).stroke({ width: 3, color: C.ink });
    g.circle(0, 0, r * 0.32).fill(C.violet);
    g.ellipse(0, 0, r * 0.08, r * 0.28).fill(C.ink);
    c.addChild(glow, g);
    c.alpha = 0;
    const blink = () => {
      if (this.destroyed || c.destroyed) return;
      gsap
        .timeline({ onComplete: () => gsap.delayedCall(1 + Math.random() * 3, blink) })
        .to(c, { alpha: 0.95, duration: 0.4 })
        .to(g.scale, { y: 0.1, duration: 0.08, delay: 1 + Math.random() * 1.5 })
        .to(g.scale, { y: 1, duration: 0.1 })
        .to(c, { alpha: 0, duration: 0.6, delay: 0.5 + Math.random() });
    };
    gsap.delayedCall(Math.random() * 3, blink);
    return c;
  }

  private buildHalo() {
    const ring = new Graphics().ellipse(0, 0, 120, 34).stroke({ width: 5, color: C.yellow }).ellipse(0, 0, 132, 40).stroke({ width: 2, color: C.cyan, alpha: 0.7 });
    ring.filters = [new GlowFilter({ distance: 12, outerStrength: 2.5, color: C.yellow, quality: 0.2 })];
    this.halo.addChild(ring);
    const starsC = new Container();
    for (let i = 0; i < 6; i++) {
      const s = new Graphics().star(0, 0, 5, 16, 7).fill(C.yellow).stroke({ width: 2, color: C.ink });
      starsC.addChild(s);
    }
    this.halo.addChild(starsC);
    this.halo.label = 'halo';
    (this.halo as Container & { stars?: Container }).stars = starsC;
  }

  private addSkip() {
    const b = new Container();
    const g = new Graphics().rect(5, 5, 250, 56).fill(C.pinkHot).rect(0, 0, 250, 56).fill(C.chaos).stroke({ width: 3, color: C.cyan, alignment: 1 });
    const t = poster('SALTAR PRÓLOGO »', 30, C.cyan);
    t.anchor.set(0.5);
    t.position.set(125, 28);
    b.addChild(g, t);
    b.position.set(W - 290, 30);
    b.eventMode = 'static';
    b.cursor = 'pointer';
    b.on('pointertap', (e) => {
      e.stopPropagation();
      sfx('click');
      this.skip();
    });
    b.alpha = 0.75;
    b.label = 'skip';
    this.addChild(b);
    gsap.from(b, { alpha: 0, delay: 1.2, duration: 0.4 });
  }

  // ================================================================ camera
  private applyCam() {
    this.world.position.set(W / 2, H / 2);
    this.world.pivot.set(this.cam.x, this.cam.y);
    this.world.scale.set(this.cam.s);
  }
  private camTo(x: number, y: number, s: number, dur: number, ease = 'power2.inOut') {
    return new Promise<void>((res) => gsap.to(this.cam, { x, y, s, duration: dur, ease, onUpdate: () => this.applyCam(), onComplete: res }));
  }

  // ================================================================ per-frame
  override update(dt: number) {
    if (!this.levi || this.finished) return;
    this.t += dt;
    this.levi.bob(dt);
    this.arca.bob(dt);
    for (const s of this.stars) s.alpha = 0.4 + 0.6 * Math.abs(Math.sin(this.t * 1.7 + s.x));
    this.reflections.x = Math.sin(this.t * 0.6) * 30;
    const st = (this.halo as Container & { stars?: Container }).stars;
    if (st) {
      st.children.forEach((s, i) => {
        const a = this.t * 1.2 + (i / 6) * Math.PI * 2;
        s.position.set(Math.cos(a) * 126, Math.sin(a) * 38);
        s.zIndex = Math.sin(a) > 0 ? 1 : -1;
        s.scale.set(0.8 + 0.25 * Math.sin(a));
      });
    }
    this.acc += dt;
    if (this.acc >= 1 / 12) {
      this.acc = 0;
      this.drawWaves();
    }
  }

  private drawWaves() {
    const g = this.waves;
    g.clear();
    for (let k = 0; k < 3; k++) {
      const y0 = WATER_Y + 40 + k * 70;
      g.moveTo(-1500, y0);
      for (let x = -1500; x <= 5200; x += 60) g.lineTo(x, y0 + Math.sin(x * 0.012 + this.t * (1.5 + k * 0.4) + k) * (6 + k * 3));
      g.stroke({ width: 3 - k * 0.6, color: k === 0 ? C.cyan : C.pinkHot, alpha: 0.35 - k * 0.08 });
    }
  }

  // ================================================================ sequence
  private async run() {
    try {
      await this.caption();
      if (this.skipped) return;
      await this.reveal();
      if (this.skipped) return;
      await this.holdAndRelease();
      if (this.skipped) return;
      await this.cutIn();
      if (this.skipped) return;
      await this.starfall();
      if (this.skipped) return;
      const photo = await this.splitInThree();
      if (this.skipped) return;
      music.play('silence');
      await newspaper(this.beatLine('PERIÓDICO', '¡EXTRA! ¡EXTRA! UN GATO PARTE UN BARCO EN TRES'), {
        photo,
        layer: this.ui,
        footer: 'FOTO: Astra Prima, que según testigos "ni se despeinó". El barco no quiso declarar. Estaba ocupado hundiéndose.',
        issue: 'EDICIÓN EXTRAORDINARIA  ·  EN ALGÚN MOMENTO DEL FUTURO  ·  PRECIO: UNA SARDINA',
      });
      if (this.skipped) return;
      await this.muchoAntes();
      this.finish();
    } catch (e) {
      console.warn('[prologue]', e);
      this.finish();
    }
  }

  private beatLine(sp: string, fallback: string) {
    const b = BEAT_BY_ID.get('b00_prologo');
    return b?.lines.find((l) => l[0] === sp)?.[1] ?? fallback;
  }

  private skip() {
    if (this.skipped || this.finished) return;
    this.skipped = true;
    cancelDialogs();
    this.finish();
  }

  private finish() {
    if (this.finished) return;
    this.finished = true;
    this.shaker?.destroy();
    this.onDone();
  }

  // 1 · caption "EN ALGÚN MOMENTO DEL FUTURO…"
  private async caption() {
    const layer = new Container();
    const bg = new Graphics().rect(0, 0, W, H).fill(C.chaos);
    layer.addChild(bg);
    const scan = new TilingSprite({ texture: halftoneTexture(C.violet, 8, 1.6), width: W, height: H });
    scan.alpha = 0.12;
    layer.addChild(scan);
    const text = this.beatLine('CAPTION', 'EN ALGÚN MOMENTO DEL FUTURO…');
    const t = txt('', { fontFamily: F.poster, fontSize: 118, fill: C.paper, letterSpacing: 2 });
    t.anchor.set(0.5);
    t.position.set(W / 2, H / 2 - 20);
    this.rgb = new RGBSplitFilter({ red: { x: -6, y: 0 }, green: { x: 0, y: 2 }, blue: { x: 6, y: -2 } });
    this.glitch = new GlitchFilter({ slices: 7, offset: 40, fillMode: 1, seed: 0.5 });
    t.filters = [this.rgb];
    const small = txt('CAPÍTULO ∞  ·  NO ONE LIKE CATS', { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.cyan, letterSpacing: 8 });
    small.anchor.set(0.5);
    small.position.set(W / 2, H / 2 + 80);
    small.alpha = 0;
    const bar = new Graphics().rect(-420, 0, 840, 4).fill(C.pinkHot);
    bar.position.set(W / 2, H / 2 + 50);
    bar.scale.x = 0;
    layer.addChild(t, small, bar);
    this.ui.addChild(layer);
    sfx('glitch');
    const burst = async (ms: number) => {
      if (!this.glitch || !this.rgb) return;
      this.glitch.seed = Math.random();
      t.filters = [this.rgb, this.glitch];
      this.rgb.red = { x: -18, y: 0 };
      this.rgb.blue = { x: 18, y: -3 };
      await wait(ms);
      t.filters = [this.rgb];
      this.rgb.red = { x: -6, y: 0 };
      this.rgb.blue = { x: 6, y: -2 };
    };
    const full = clean(text);
    for (let i = 1; i <= full.length && !this.skipped; i++) {
      t.text = full.slice(0, i);
      if (i % 2) sfx('tick', 0.6 + Math.random() * 0.5);
      if (i % 7 === 0) void burst(60);
      await wait(45);
    }
    gsap.to(small, { alpha: 1, duration: 0.4 });
    gsap.to(bar.scale, { x: 1, duration: 0.5, ease: 'power3.out' });
    await wait(500);
    await burst(90);
    await wait(600);
    sfx('glitch');
    await burst(140);
    destroyDeep(layer);
  }

  // 2 · reveal the scale of the thing, then Luzterna
  private async reveal() {
    this.cam = { x: W / 2 + 1150, y: H / 2 - 140, s: 1.05 };
    this.applyCam();
    flash(this.fxLayer, C.cyan, 0.5, 0.4);
    this.worldGlitch(260);
    sfx('sting');
    const bigCap = poster('EL LEVIATÁN', 150, C.paper, { letterSpacing: -2, stroke: { color: C.ink, width: 10, join: 'round' } });
    bigCap.alpha = 0;
    bigCap.position.set(90, 110);
    const sub = txt('TAMAÑO: SÍ', { fontFamily: F.ui, fontWeight: '700', fontSize: 28, fill: C.ink, letterSpacing: 6 });
    const subBg = new Graphics().rect(0, 0, 260, 44).fill(C.pinkHot).stroke({ width: 3, color: C.ink });
    sub.position.set(14, 6);
    const subC = new Container();
    subC.addChild(subBg, sub);
    subBg.width = sub.width + 28;
    subC.position.set(96, 300);
    subC.alpha = 0;
    sub.alpha = 0;
    this.ui.addChild(bigCap, subC);
    gsap.to(bigCap, { alpha: 1, duration: 0.3, delay: 0.3 });
    gsap.from(bigCap, { x: -300, duration: 0.4, delay: 0.3, ease: 'power4.out' });
    gsap.to(subC, { alpha: 1, duration: 0.2, delay: 0.7 });
    gsap.to([bigCap, subC], { alpha: 0, duration: 0.3, delay: 2.6 });
    await this.camTo(W / 2 + 20, H / 2 - 30, 1, 3.2, 'power2.inOut');
    destroyDeep(bigCap);
    destroyDeep(subC);
    if (this.skipped) return;
    const tag = this.world.getChildByLabel('astraTag');
    if (tag) gsap.to(tag, { alpha: 1, duration: 0.4 });
    sfx('shield');
    const line = this.beatLine('LUZTERNA', '¿Ves esa cosa enorme? Sí, esa. La que tapa el cielo. Bueno: mantén… y suelta.');
    await say([['LUZTERNA', line]], { dim: 0.12, skippable: false, layer: this.ui, position: 'top' });
  }

  private worldGlitch(ms: number) {
    if (settings.reduceFlashes) return;
    const r = new RGBSplitFilter({ red: { x: -14, y: 0 }, green: { x: 0, y: 6 }, blue: { x: 14, y: -4 } });
    const gl = new GlitchFilter({ slices: 10, offset: 40, fillMode: 0, seed: Math.random() });
    this.world.filters = [r, gl];
    this.sky.filters = [r];
    sfx('glitch');
    window.setTimeout(() => {
      if (this.destroyed) return;
      this.world.filters = [];
      this.sky.filters = [];
    }, ms);
  }

  // 3 · hold… and release
  private holdAndRelease(): Promise<void> {
    return new Promise((resolve) => {
      const ui = new Container();
      this.ui.addChild(ui);
      const dark = new Graphics().rect(0, 0, W, H).fill(C.ink);
      dark.alpha = 0;
      this.fxLayer.addChild(dark);
      const cx = W / 2 + 120;
      const cy = H - 270;
      const R = 112;
      const ring = new Graphics();
      const btn = new Container();
      btn.position.set(cx, cy);
      const core = new Graphics().circle(0, 0, R - 16).fill({ color: C.chaos, alpha: 0.85 }).stroke({ width: 4, color: C.cyan });
      const mouse = new Graphics()
        .roundRect(-18, -28, 36, 56, 18)
        .stroke({ width: 4, color: C.paper })
        .moveTo(0, -28)
        .lineTo(0, -6)
        .stroke({ width: 4, color: C.paper })
        .roundRect(-16, -26, 15, 18, 6)
        .fill(C.pinkHot);
      const label = poster('MANTÉN…', 84, C.paper, { stroke: { color: C.ink, width: 8 }, letterSpacing: 2 });
      label.anchor.set(0.5);
      label.position.set(0, -R - 70);
      const label2 = poster('…Y SUELTA', 44, C.cyan, { stroke: { color: C.ink, width: 6 } });
      label2.anchor.set(0.5);
      label2.position.set(0, R + 40);
      const ticks = new Graphics();
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        const r0 = R + 18;
        const r1 = R + (i % 3 === 0 ? 34 : 26);
        ticks.moveTo(Math.cos(a) * r0, Math.sin(a) * r0).lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      }
      ticks.stroke({ width: 3, color: C.pinkHot, alpha: 0.9 });
      const hint = txt('CLIC SOSTENIDO  ·  O BARRA ESPACIADORA', { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.paper, letterSpacing: 3 });
      hint.anchor.set(0.5);
      hint.position.set(0, R + 80);
      hint.alpha = 0.7;
      btn.addChild(ticks, ring, core, mouse, label, label2, hint);
      gsap.to(ticks, { rotation: Math.PI * 2, duration: 6, repeat: -1, ease: 'none' });
      ui.addChild(btn);
      gsap.from(btn.scale, { x: 0, y: 0, duration: 0.4, ease: 'back.out(2.5)' });
      const pulse = gsap.to(core.scale, { x: 1.08, y: 1.08, duration: 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut' });

      let charge = 0;
      let holding = false;
      let fired = false;
      let fullAt = 0;
      let chargeSfx = 0;
      let idle = 0;
      const hit = new Graphics().rect(0, 0, W, H).fill({ color: 0xffffff, alpha: 0.001 });
      hit.eventMode = 'static';
      hit.cursor = 'pointer';
      ui.addChildAt(hit, 0);
      const down = () => {
        if (fired) return;
        holding = true;
        idle = 0;
        sfx('charge');
        chargeSfx = 0;
      };
      const up = () => {
        if (!holding || fired) return;
        holding = false;
        if (charge >= 0.3) fire();
        else {
          sfx('error');
          label.text = '¡MANTÉN!';
          gsap.fromTo(btn, { x: cx - 12 }, { x: cx, duration: 0.4, ease: 'elastic.out(1,0.3)' });
        }
      };
      hit.on('pointerdown', down);
      hit.on('pointerup', up);
      hit.on('pointerupoutside', up);
      const kd = (e: KeyboardEvent) => {
        if (e.key === ' ' && !e.repeat) {
          e.preventDefault();
          down();
        }
      };
      const ku = (e: KeyboardEvent) => {
        if (e.key === ' ') up();
      };
      window.addEventListener('keydown', kd);
      window.addEventListener('keyup', ku);
      const parts = new Container();
      this.world.addChild(parts);
      const astraPos = { x: this.astra.x, y: this.astra.y - 140 };
      let last = performance.now();
      const tick = () => {
        // real time (not gsap's lag-smoothed delta) so a hitch never makes the charge feel sticky
        const now = performance.now();
        const dt = Math.min(0.25, (now - last) / 1000);
        last = now;
        if (this.skipped) return cleanup();
        if (holding) {
          charge = Math.min(1, charge + dt / 1.35);
          chargeSfx += dt;
          if (chargeSfx > 0.12) {
            chargeSfx = 0;
            sfx('tick', 0.8 + charge * 1.6);
          }
          // converging motes
          for (let k = 0; k < 2; k++) {
            const p = new Sprite(sparkTexture());
            p.anchor.set(0.5);
            p.tint = Math.random() < 0.5 ? C.cyan : C.yellow;
            p.blendMode = 'add';
            const a = Math.random() * Math.PI * 2;
            const r = 300 + Math.random() * 260;
            p.position.set(astraPos.x + Math.cos(a) * r, astraPos.y + Math.sin(a) * r);
            p.scale.set(0.25 + Math.random() * 0.3);
            parts.addChild(p);
            gsap.to(p, { x: astraPos.x, y: astraPos.y, alpha: 0.2, duration: 0.45, ease: 'power2.in', onComplete: () => p.destroy() });
          }
          this.shaker.add(dt * 0.25 * charge);
          if (charge >= 1) {
            fullAt += dt;
            label.text = '¡SUELTA!';
            label.style.fill = C.yellow;
            if (fullAt > 2.6) {
              holding = false;
              fire();
            }
          } else label.text = 'MANTÉN…';
        } else if (!fired) {
          charge = Math.max(0, charge - dt * 0.8);
          idle += dt;
          if (idle > 7) {
            idle = 0;
            gsap.fromTo(btn.scale, { x: 1.25, y: 1.25 }, { x: 1, y: 1, duration: 0.5, ease: 'elastic.out(1,0.4)' });
            sfx('pop');
          }
        }
        dark.alpha = charge * 0.42;
        this.cam.s = 1 + charge * 0.14;
        this.cam.x = W / 2 + 20 - charge * 320;
        this.cam.y = H / 2 - 30 + charge * 60;
        this.applyCam();
        this.astra.aura.scale.set(1 + charge * 1.2);
        ring.clear();
        ring.circle(0, 0, R).stroke({ width: 14, color: C.ink, alpha: 0.6 });
        if (charge > 0.001) {
          ring.moveTo(0, -R);
          ring.arc(0, 0, R, -Math.PI / 2, -Math.PI / 2 + charge * Math.PI * 2);
          ring.stroke({ width: 14, color: charge >= 1 ? C.yellow : C.cyan, cap: 'round' });
        }
      };
      gsap.ticker.add(tick);
      const cleanup = () => {
        gsap.ticker.remove(tick);
        window.removeEventListener('keydown', kd);
        window.removeEventListener('keyup', ku);
        pulse.kill();
        gsap.to(ui, { alpha: 0, duration: 0.15, onComplete: () => destroyDeep(ui) });
        gsap.to(dark, { alpha: 0, duration: 0.3, onComplete: () => dark.destroy() });
        gsap.delayedCall(0.6, () => destroyDeep(parts));
        resolve();
      };
      const fire = () => {
        if (fired) return;
        fired = true;
        gsap.to(this.astra.aura.scale, { x: 1.2, y: 1.2, duration: 0.6, delay: 0.3 });
        sfx('crit');
        sfx('zap');
        flash(this.fxLayer, C.white, 0.9, 0.2);
        cleanup();
      };
    });
  }

  // 4 · anime cut-in: STELLAR DECREE: STARFALL
  private async cutIn() {
    const L = new Container();
    this.ui.addChild(L);
    const black = new Graphics().rect(0, 0, W, H).fill(C.ink);
    L.addChild(black);
    // slanted band (wrapped so it can open from the middle)
    const bandWrap = new Container();
    bandWrap.pivot.set(W / 2, H / 2);
    bandWrap.position.set(W / 2, H / 2);
    const band = new Container();
    const bandMask = new Graphics().poly([0, 330, W, 210, W, 760, 0, 880]).fill(0xffffff);
    const bandBg = new Sprite(
      gradientTexture(
        [
          [0, '#ff2e88'],
          [0.5, '#8a5cff'],
          [1, '#00e5ff'],
        ],
        8,
        256,
      ),
    );
    bandBg.width = W;
    bandBg.height = H;
    const lines = new Graphics();
    for (let i = 0; i < 70; i++) {
      const y = 200 + Math.random() * 700;
      const len = 300 + Math.random() * 900;
      const x = Math.random() * W;
      lines.rect(x, y, len, 2 + Math.random() * 5).fill({ color: 0xffffff, alpha: 0.25 + Math.random() * 0.5 });
    }
    const dots = new TilingSprite({ texture: halftoneTexture(C.ink, 14, 3.5), width: W, height: H });
    dots.alpha = 0.25;
    const cat = new Sprite(catTexture('regal_cosmic_cat'));
    cat.anchor.set(0.5, 0.42);
    cat.scale.set(1180 / cat.texture.height);
    cat.position.set(W * 0.27, H / 2 + 60);
    cat.filters = [
      new ComicFilter({ levels: 5, dot: 6, sat: 1.4, strength: 0.9, shadow: 0x231626 }),
      new OutlineFilter({ thickness: 9, color: C.ink, quality: 0.25 }),
      new GlowFilter({ distance: 26, outerStrength: 3, color: C.cyan, quality: 0.2 }),
    ];
    band.addChild(bandBg, lines, dots, cat, bandMask);
    band.mask = bandMask;
    const edge = new Graphics()
      .moveTo(0, 330)
      .lineTo(W, 210)
      .stroke({ width: 12, color: C.paper })
      .moveTo(0, 880)
      .lineTo(W, 760)
      .stroke({ width: 12, color: C.paper });
    bandWrap.addChild(band, edge);
    L.addChild(bandWrap);
    // type
    const kanji = txt('星\nの\n勅\n令', { fontFamily: F.heavy, fontSize: 104, fill: C.paper, stroke: { color: C.ink, width: 10 }, lineHeight: 108, align: 'center' });
    kanji.anchor.set(0.5);
    kanji.position.set(W - 96, H / 2 - 20);
    const k1 = txt('STELLAR DECREE:', { fontFamily: F.poster, fontSize: 76, fill: C.paper, stroke: { color: C.ink, width: 8 }, letterSpacing: 2 });
    k1.position.set(W * 0.47, 238);
    const k2 = txt('STARFALL!', { fontFamily: F.comic, fontSize: 200, fill: C.yellow, stroke: { color: C.ink, width: 16, join: 'round' }, letterSpacing: 4 });
    k2.anchor.set(0.5);
    k2.position.set(W * 0.67, 460);
    if (k2.width > 860) k2.scale.set(860 / k2.width);
    const k2s = k2.scale.x;
    const rgb = new RGBSplitFilter({ red: { x: -10, y: 0 }, green: { x: 0, y: 0 }, blue: { x: 10, y: 0 } });
    k2.filters = [rgb];
    const tagC = new Container();
    const tag = txt('ASTRA PRIMA ★6 — EMPERATRIZ ESTELAR', { fontFamily: F.ui, fontWeight: '700', fontSize: 24, fill: C.paper, letterSpacing: 4 });
    tag.position.set(16, 8);
    tagC.addChild(new Graphics().rect(0, 0, tag.width + 32, 44).fill(C.ink), tag);
    tagC.position.set(W * 0.67 - (tag.width + 32) / 2, 600);
    L.addChild(kanji, k1, k2, tagC);
    sfx('whoosh');
    sfx('charge');
    const reduce = settings.reduceMotion;
    const tl = gsap.timeline();
    tl.from(bandWrap.scale, { y: 0, duration: 0.18, ease: 'power4.out' }, 0)
      .from(cat, { x: -600, duration: 0.35, ease: 'power4.out' }, 0.05)
      .to(cat, { x: '+=70', duration: 1.4, ease: 'none' }, 0.4)
      .to(lines, { x: -500, duration: 1.8, ease: 'none' }, 0)
      .from(kanji, { y: H + 400, duration: 0.3, ease: 'power4.out' }, 0.15)
      .from(k1, { x: W + 200, duration: 0.25, ease: 'power4.out' }, 0.35)
      .fromTo(k2.scale, { x: 3 * k2s, y: 3 * k2s }, { x: k2s, y: k2s, duration: 0.2, ease: 'power4.in' }, 0.55)
      .from(k2, { alpha: 0, duration: 0.05 }, 0.55)
      .call(() => {
        sfx('crit');
        speedLines(L, W * 0.67, 460, C.paper, 40, 0.5);
      }, [], 0.75)
      .to(rgb.red, { x: 0, duration: 0.5 }, 0.75)
      .to(rgb.blue, { x: 0, duration: 0.5 }, 0.75)
      .from(tagC, { alpha: 0, x: '+=60', duration: 0.25 }, 0.9);
    await wait(reduce ? 1100 : 1750);
    tl.kill();
    // shatter out
    sfx('glitch');
    await new Promise<void>((res) => gsap.to(bandWrap.scale, { y: 0, duration: 0.12, ease: 'power3.in', onComplete: res }));
    destroyDeep(L);
    flash(this.fxLayer, C.white, 1, 0.25);
  }

  // 5 · meteor + impact frames + hitstop + shake
  private async starfall() {
    // wide shot, slightly zoomed out so we see the Leviatán
    this.cam = { x: W / 2 + 260, y: H / 2 - 80, s: 0.86 };
    this.applyCam();
    const impact = { x: 1640, y: 470 };
    // a star forms above Astra and shoots up
    const seed = new Sprite(glowTexture());
    seed.anchor.set(0.5);
    seed.tint = C.yellow;
    seed.blendMode = 'add';
    seed.position.set(this.astra.x, this.astra.y - 330);
    seed.scale.set(0.2);
    this.world.addChild(seed);
    sfx('reveal');
    await new Promise<void>((res) =>
      gsap
        .timeline({ onComplete: res })
        .to(seed.scale, { x: 2.4, y: 2.4, duration: 0.35, ease: 'back.out(2)' })
        .to(seed, { y: -900, duration: 0.25, ease: 'power3.in' })
        .call(() => sfx('whoosh')),
    );
    seed.destroy();
    if (this.skipped) return;
    // the meteor
    const met = new Container();
    const glow = new Sprite(glowTexture());
    glow.anchor.set(0.5);
    glow.tint = C.cyan;
    glow.blendMode = 'add';
    glow.scale.set(11);
    const core = new Graphics().circle(0, 0, 150).fill(0xfff6d8).stroke({ width: 10, color: C.yellow });
    core.filters = [new GlowFilter({ distance: 30, outerStrength: 4, color: C.pinkHot, quality: 0.2 })];
    const star = new Graphics().star(0, 0, 6, 210, 70).fill({ color: 0xffffff, alpha: 0.8 });
    star.blendMode = 'add';
    met.addChild(glow, star, core);
    const trail = new Graphics();
    trail.blendMode = 'add';
    this.world.addChild(trail, met);
    // starts at the top-left corner of the frame so the whole dive reads
    const start = { x: this.cam.x - (W / 2) / this.cam.s - 200, y: this.cam.y - (H / 2) / this.cam.s - 250 };
    met.position.set(start.x, start.y);
    const dir = { x: impact.x - start.x, y: impact.y - start.y };
    const dl = Math.hypot(dir.x, dir.y);
    const nx = dir.x / dl;
    const ny = dir.y / dl;
    const drawTrail = () => {
      trail.clear();
      const L2 = 1300;
      const px = -ny;
      const py = nx;
      const layers: [number, number, number][] = [
        [170, C.pinkHot, 0.35],
        [110, C.cyan, 0.5],
        [55, 0xffffff, 0.85],
      ];
      for (const [w, col, a] of layers) {
        trail
          .poly([met.x + px * w, met.y + py * w, met.x - px * w, met.y - py * w, met.x - nx * L2, met.y - ny * L2])
          .fill({ color: col, alpha: a });
      }
      star.rotation += 0.3;
    };
    this.shaker.add(0.3);
    const sl = new Container();
    sl.alpha = 0.45;
    this.fxLayer.addChild(sl);
    speedLines(sl, (impact.x - this.cam.x) * this.cam.s + W / 2, (impact.y - this.cam.y) * this.cam.s + H / 2, C.paper, 44, 0.8);
    gsap.delayedCall(1.4, () => destroyDeep(sl));
    await new Promise<void>((res) =>
      gsap.to(met, {
        x: impact.x,
        y: impact.y,
        duration: 0.75,
        ease: 'power2.in',
        onUpdate: () => {
          drawTrail();
          this.shaker.add(0.03);
        },
        onComplete: res,
      }),
    );
    // IMPACT
    trail.destroy();
    destroyDeep(met);
    if (this.skipped) return;
    sfx('bigboom');
    sfx('crit');
    const frames = !settings.reduceFlashes;
    if (frames) {
      // frame A: white page, black silhouettes
      this.impactBg.clear().rect(0, 0, W, H).fill(0xffffff);
      this.impactBg.visible = true;
      this.sky.visible = false;
      this.world.filters = [new SilhouetteFilter(C.ink, 1)];
      await realWait(80);
      // frame B: manga negative
      this.impactBg.clear().rect(0, 0, W, H).fill(C.ink);
      this.world.filters = [new InkFilter({ threshold: 0.35, invert: true })];
      await realWait(80);
      // frame C: black + white starburst
      this.world.visible = false;
      const burst = new Graphics();
      const sx = (impact.x - this.cam.x) * this.cam.s + W / 2;
      const sy = (impact.y - this.cam.y) * this.cam.s + H / 2;
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2;
        const r1 = i % 2 ? 900 : 1600;
        burst.poly([sx, sy, sx + Math.cos(a - 0.05) * r1, sy + Math.sin(a - 0.05) * r1, sx + Math.cos(a + 0.05) * r1, sy + Math.sin(a + 0.05) * r1]).fill(0xffffff);
      }
      this.fxLayer.addChild(burst);
      await realWait(80);
      burst.destroy();
      this.world.visible = true;
      this.world.filters = [];
      this.impactBg.visible = false;
      this.sky.visible = true;
    }
    // shockwave + flash + hitstop + shake
    const sw = new ShockwaveFilter({
      center: { x: (impact.x - this.cam.x) * this.cam.s + W / 2, y: (impact.y - this.cam.y) * this.cam.s + H / 2 },
      amplitude: 42,
      wavelength: 220,
      brightness: 1.4,
      radius: -1,
      speed: 1400,
      time: 0,
    });
    this.filters = [sw];
    const swt = { t: 0 };
    gsap.to(swt, {
      t: 1.4,
      duration: 1.4,
      ease: 'none',
      onUpdate: () => (sw.time = swt.t),
      onComplete: () => {
        if (!this.destroyed) this.filters = [];
      },
    });
    flash(this.fxLayer, 0xfff3d0, 0.95, 0.5);
    this.shaker.add(1);
    onomatopoeia(this.fxLayer, W / 2 + 200, H / 2 - 150, '¡¡DOOOOM!!', { size: 230, color: C.yellow, dur: 1.4 });
    onomatopoeia(this.fxLayer, W / 2 - 360, H / 2 + 160, 'ドーン', { size: 130, color: C.pinkHot, font: F.heavy, dur: 1.2 });
    sparkles(this.fxLayer, W / 2 + 200, H / 2 - 100, C.yellow, 24, 520);
    // fire + smoke where it hit
    const fireG = new Sprite(glowTexture());
    fireG.anchor.set(0.5);
    fireG.tint = C.orange;
    fireG.blendMode = 'add';
    fireG.scale.set(10);
    fireG.position.set(impact.x, impact.y);
    fireG.label = 'impactFire';
    this.leviRoot.addChild(fireG);
    gsap.to(fireG, { alpha: 0.5, duration: 0.3, yoyo: true, repeat: -1 });
    this.levi.smokeAt?.((impact.x - this.levi.x) / 2, (impact.y - this.levi.y) / 2, { rate: 30, tint: 0x2a1c49, scale: 2.5, duration: 6 });
    // hitstop (game-time freeze; real-time wait)
    gsap.globalTimeline.timeScale(0.03);
    await realWait(settings.reduceMotion ? 60 : 150);
    gsap.globalTimeline.timeScale(1);
    await wait(700);
  }

  // 6 · the ship splits in THREE comic panels
  private async splitInThree(): Promise<Texture | undefined> {
    // frame the whole Leviatán
    const ls = this.levi.scale.x;
    const shipW = LEVIATHAN.cols * CELL;
    await this.camTo(this.levi.x + (shipW * ls) / 2 + 40, 250, 0.52, 0.5, 'power3.out');
    if (this.skipped) return undefined;
    const r = this.leviRoot;
    const fire = r.getChildByLabel('impactFire');
    if (fire) gsap.to(fire, { alpha: 0, duration: 0.4 });
    // the comic gutters (screen space) decide where the ship breaks
    const gx = [W * 0.355, W * 0.655];
    const slant = 90;
    const sy = (WATER_Y - 260 - this.cam.y) * this.cam.s + H / 2;
    const cutX = gx.map((g) => this.cam.x + (g + slant - 2 * slant * (sy / H) - W / 2) / this.cam.s);
    const pieces: Container[] = [];
    try {
      // snapshot the ship through an identity wrapper so texture (0,0) = leviRoot-space bounds.x/y
      const idx = r.getChildIndex(this.levi);
      const wrap = new Container();
      wrap.addChild(this.levi);
      const lb = wrap.getLocalBounds();
      const bounds = new Rectangle(lb.x, lb.y, lb.width, lb.height);
      const tex = game.pixi.renderer.generateTexture({ target: wrap, frame: bounds, resolution: 0.8 });
      r.addChildAt(this.levi, idx);
      wrap.destroy();
      const top = bounds.y - 50;
      const bot = bounds.y + bounds.height + 50;
      const jag = (x0: number) => {
        const pts: number[] = [];
        for (let y = top; y <= bot; y += 80) pts.push(x0 + (Math.random() - 0.5) * 70, y);
        pts[pts.length - 1] = bot;
        return pts;
      };
      const c1 = jag(cutX[0]);
      const c2 = jag(cutX[1]);
      const rev = (pts: number[]) => {
        const out: number[] = [];
        for (let i = pts.length - 2; i >= 0; i -= 2) out.push(pts[i], pts[i + 1]);
        return out;
      };
      const L0 = bounds.x - 50;
      const R0 = bounds.x + bounds.width + 50;
      const polys = [[L0, top, ...c1, L0, bot], [...c1, ...rev(c2)], [...c2, R0, bot, R0, top]];
      const centers = [(bounds.x + cutX[0]) / 2, (cutX[0] + cutX[1]) / 2, (cutX[1] + bounds.x + bounds.width) / 2];
      polys.forEach((poly, i) => {
        const piece = new Container();
        const sp = new Sprite(tex);
        sp.position.set(bounds.x, bounds.y);
        const m = new Graphics().poly(poly).fill(0xffffff);
        sp.mask = m;
        piece.addChild(sp, m);
        piece.pivot.set(centers[i], WATER_Y);
        piece.position.set(centers[i], WATER_Y);
        pieces.push(piece);
      });
      this.levi.visible = false;
      pieces.forEach((p, i) => r.addChildAt(p, idx + i));
    } catch (e) {
      console.warn('[prologue] snapshot failed', e);
    }
    // glowing cracks first
    const cracks = new Graphics();
    if (pieces.length) {
      for (const cx of cutX) {
        cracks.moveTo(cx, this.levi.y - 300);
        for (let y = this.levi.y - 200; y <= WATER_Y + 40; y += 70) cracks.lineTo(cx + (Math.random() - 0.5) * 80, y);
      }
      cracks.stroke({ width: 18, color: C.cyan, alpha: 0.95 });
      cracks.blendMode = 'add';
      r.addChild(cracks);
      sfx('zap');
      sfx('freeze');
      await wait(280);
    }
    // comic page: 3 slanted panels with gutters
    const page = new Container();
    this.fxLayer.addChild(page);
    const polysScreen = [
      [0, 0, gx[0] + slant, 0, gx[0] - slant, H, 0, H],
      [gx[0] + slant, 0, gx[1] + slant, 0, gx[1] - slant, H, gx[0] - slant, H],
      [gx[1] + slant, 0, W, 0, W, H, gx[1] - slant, H],
    ];
    const tints = [C.pinkHot, C.orange, C.cyan];
    const words = ['¡CRA—', '—AAA—', '—ACK!!'];
    for (let i = 0; i < 3; i++) {
      const tintL = new Container();
      const m = new Graphics().poly(polysScreen[i]).fill(0xffffff);
      const col = new Graphics().rect(0, 0, W, H).fill(tints[i]);
      col.alpha = 0.32;
      col.blendMode = 'multiply';
      const ht = new TilingSprite({ texture: halftoneTexture(tints[i], 12, 3), width: W, height: H });
      ht.alpha = 0.28;
      tintL.addChild(col, ht, m);
      tintL.mask = m;
      tintL.alpha = 0;
      page.addChild(tintL);
      gsap.to(tintL, { alpha: 1, duration: 0.08, delay: i * 0.22 });
    }
    const gut = new Graphics();
    for (const x of gx) {
      gut.poly([x + slant - 16, 0, x + slant + 16, 0, x - slant + 16, H, x - slant - 16, H]).fill(C.paper);
      gut.moveTo(x + slant - 16, 0).lineTo(x - slant - 16, H).stroke({ width: 6, color: C.ink });
      gut.moveTo(x + slant + 16, 0).lineTo(x - slant + 16, H).stroke({ width: 6, color: C.ink });
    }
    gut.rect(0, 0, W, H).stroke({ width: 28, color: C.paper, alignment: 1 }).rect(14, 14, W - 28, H - 28).stroke({ width: 6, color: C.ink });
    page.addChild(gut);
    gsap.from(gut, { alpha: 0, duration: 0.1 });
    sfx('hit', 0.6);
    for (let i = 0; i < 3; i++) {
      const x = i === 0 ? gx[0] * 0.48 : i === 1 ? (gx[0] + gx[1]) / 2 : (gx[1] + W) / 2 + 20;
      gsap.delayedCall(0.15 + i * 0.3, () => {
        if (this.destroyed) return;
        sfx('boom', 1.2 - i * 0.15);
        this.shaker.add(0.35);
        onomatopoeia(page, x, 220 + i * 40, words[i], { size: 120, color: [C.yellow, C.paper, C.yellow][i], dur: 2.6 });
      });
    }
    // separate
    gsap.to(cracks, { alpha: 0, duration: 0.6, delay: 0.3 });
    const [a, b, c] = pieces;
    if (a && b && c) {
      const dur = 2.6;
      gsap.to(a, { rotation: -0.42, x: a.x - 160, y: a.y + 220, duration: dur, ease: 'power2.in', delay: 0.2 });
      gsap.to(b, { rotation: 0.08, y: b.y + 520, duration: dur, ease: 'power2.in', delay: 0.35 });
      gsap.to(c, { rotation: 0.46, x: c.x + 180, y: c.y + 260, duration: dur, ease: 'power2.in', delay: 0.5 });
      for (const p of pieces) {
        gsap.delayedCall(0.6 + Math.random() * 0.6, () => {
          if (this.destroyed) return;
          sfx('splash');
          this.splash(p.x, WATER_Y);
        });
      }
    }
    await wait(1700);
    if (this.skipped) return undefined;
    // the newspaper photo: snapshot of the whole stage
    let photo: Texture | undefined;
    try {
      photo = game.pixi.renderer.generateTexture({ target: this, frame: new Rectangle(0, 0, W, H), resolution: 0.5 });
    } catch {
      photo = undefined;
    }
    await wait(700);
    return photo;
  }

  private splash(x: number, y: number) {
    for (let i = 0; i < 14; i++) {
      const d = new Graphics().circle(0, 0, 10 + Math.random() * 18).fill(i % 3 ? 0xd8f6ff : C.cyan).stroke({ width: 3, color: C.ink });
      d.position.set(x + (Math.random() - 0.5) * 300, y);
      this.world.addChild(d);
      gsap.to(d, { y: y - 120 - Math.random() * 260, duration: 0.45, ease: 'power2.out', yoyo: true, repeat: 1 });
      gsap.to(d, { x: d.x + (Math.random() - 0.5) * 200, alpha: 0, duration: 0.9, onComplete: () => d.destroy() });
    }
  }

  // 7 · "MUCHO ANTES…"
  private async muchoAntes() {
    const L = new Container();
    this.ui.addChild(L);
    const bg = new TilingSprite({ texture: paperTexture(C.paper), width: W, height: H });
    L.addChild(bg);
    const circle = new Graphics().circle(W / 2 + 420, H / 2 + 40, 300).fill(C.pink);
    L.addChild(circle);
    const capTxt = clean(this.beatLine('CAPTION', 'MUCHO ANTES…').replace('EN ALGÚN MOMENTO DEL FUTURO…', 'MUCHO ANTES…'));
    const lines = BEAT_BY_ID.get('b00_prologo')?.lines.filter((l) => l[0] === 'CAPTION') ?? [];
    const text = clean(lines[lines.length - 1]?.[1] ?? capTxt);
    const t = poster('', 210, C.ink, { letterSpacing: -6 });
    t.position.set(110, H / 2 - 170);
    L.addChild(t);
    // a tiny raft with a palm and a box with a sleeping cat (COZY ISLA sketch)
    const raft = new Container();
    const g = new Graphics();
    g.ellipse(0, 40, 300, 26).fill({ color: C.megaBlue, alpha: 0.35 });
    for (let i = 0; i < 7; i++) g.roundRect(-210 + i * 60, 0, 56, 30, 8).fill(0xc58a4a).stroke({ width: 4, color: C.ink });
    g.moveTo(-140, 0).bezierCurveTo(-150, -120, -110, -200, -90, -260).stroke({ width: 14, color: 0x8a5a2b });
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k - 2) * 0.55;
      g.moveTo(-90, -260).quadraticCurveTo(-90 + Math.cos(a) * 80, -300 + Math.sin(a) * 40, -90 + Math.cos(a) * 150, -260 + Math.sin(a) * 60 + 50).stroke({ width: 12, color: C.green, cap: 'round' });
    }
    g.rect(20, -96, 170, 96).fill(0xc9995e).stroke({ width: 5, color: C.ink });
    g.poly([20, -96, 50, -130, 160, -130, 190, -96]).fill(0xb38450).stroke({ width: 5, color: C.ink });
    raft.addChild(g);
    const cat = new Sprite(catTexture('canelo_cozy_cat'));
    cat.anchor.set(0.5, 0.9);
    cat.scale.set(150 / cat.texture.height);
    cat.position.set(105, -82);
    const lid = new Graphics().rect(20, -60, 170, 60).fill(0xc9995e).stroke({ width: 5, color: C.ink });
    raft.addChild(cat, lid);
    const z = txt('Zzz', { fontFamily: F.brush, fontSize: 54, fill: C.ink });
    z.position.set(170, -210);
    raft.addChild(z);
    raft.position.set(W / 2 + 420, H / 2 + 190);
    L.addChild(raft);
    gsap.to(z, { y: z.y - 20, alpha: 0.4, duration: 1, yoyo: true, repeat: -1 });
    gsap.to(raft, { y: raft.y - 10, rotation: 0.02, duration: 1.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    sfx('paper');
    gsap.from(L, { alpha: 0, duration: 0.3 });
    for (let i = 1; i <= text.length && !this.skipped; i++) {
      t.text = text.slice(0, i);
      sfx('tick', 0.8);
      await wait(70);
    }
    sfx('purr');
    await wait(1700);
  }

  override exit() {
    this.finished = true;
    this.shaker?.destroy();
    gsap.globalTimeline.timeScale(1);
    gsap.killTweensOf(this.cam);
    killTweensDeep(this);
    this.filters = [];
  }
}
