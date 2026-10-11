/**
 * YONOSE TODO — the stage: «ANIMATIC». A pencil storyboard of the finale that warms into watercolor and dries into the
 * game's own paint (docs/part-ii/29 §18).
 *
 * Layers
 *   bg      SKY (paper + the night / dawn, shader) · the stars (pencil asterisks / paint dots, slight parallax) ·
 *           the SET (set.ts, clean color, camera) inside a screen-space wrap that the ANIMATIC filter redraws per pixel
 *           (pencil · watercolor · paint, with two spreading blooms). The cold open's frozen game frame lives in the
 *           same wrap, so the game itself un-paints into pencil.
 *   wfx     (world, over the set, already pencil) the animator's marks, the strokes the pencil tries to make around
 *           the sleeping cat, the far hand's sentence
 *   screen  the storyboard frame + timing strip, the captions, the notes, the paint drops (Wash filter)
 *   panels  the credits (Wash filter) · REGISTRO 000's card
 *   type    «…MENTIRA.» (Wash filter)
 *   ui      «¿Qué escribes?» (the three thumbnails), the prompts
 * Every sound shows (update): kick = the drawing is redrawn (the boil re-seeds) + a camera nudge + the cats bob + the
 * beam brightens; accent = a tick on the strip + a star twinkles + the page's glow; bass = the sea swells by pitch and
 * the sky breathes; keys = a new star in the intro, the frame counter, Canelo's breath, a letter of the far hand.
 */
import { Container, Graphics, Rectangle, Sprite, Text } from 'pixi.js';
import type { Kit, StageApi } from '../../anime/kit';
import type { Palette } from '../../anime/palette';
import { Actor, Studio } from '../../anime/actor';
import { rng } from '../../anime/draw';
import { mToSong } from '../../time';
import type { Onset } from '../../types';
import { G } from '../../../state/game';
import { catSlug } from '../../../state/sys/forms';
import { artSlug } from '../../../art/catArt';
import type { MentiraChoice } from '../../../state/sys/rupturasO4';
import { MENTIRA_REPLY } from '../../../ui/story/rupturasScriptO4';
import historia from '../../../data/rupturas/historia-o4.json';
import { AnimaticFilter, GRAPHITE, PAPER, PaperFilter, SkyFilter, WashFilter, bakePlain } from './paper';
import { IslandSet, SEATS } from './set';
import { VIGNETTES, buildPanel } from './dream';
import { CreditsRoll } from './credits';
import { Frame, HAND, RegistroCard, SERIF, Thumbs, captionSprite } from './ui';
import { sketch, star as starMark } from './pencil';
import { YONOSE_VERBS } from './verbs';
import { finaleBridge } from './bridge';
import { ARRIVE, ASLEEP_T, BAR, BEAT, BIG1, CALOR, CANELO, FAROL, MENTIRA_HOLD, MENTIRA_T, P, PICA, PICK, SEC, SUENOS, VUELTAS, WRITE } from './times';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const pal = (name: string, shade: number, glow: number, accent: number): Palette => ({
  name,
  ink: GRAPHITE,
  shadow: 0x6a6258,
  base: 0xb8ad9c,
  light: PAPER,
  accent,
  accent2: 0x7fa6c9,
  sky: [PAPER],
  sea: [PAPER],
  grade: { shade, glow, sat: 1, tone: 0, vignette: 0 },
});

/** the line the far hand writes on the page's margin (b64_mentira line 7's quote) */
export const BORDER_LINE = 'A nadie le gustan los gatos.';
const WRITE_STYLE = { fontFamily: SERIF, fontStyle: 'italic' as const, fontSize: 24, fill: 0x34487e, letterSpacing: 1 };

type StoryBeat = { id: string; lines: [string, string][] };
const BEATS: StoryBeat[] = ((historia as unknown as { story?: { beats?: StoryBeat[] } }).story?.beats ?? []).filter((b) => b && Array.isArray(b.lines));

function caneloSlug(): string {
  try {
    const c = G.s?.cats?.find((x) => x.species === 'c_canelo');
    if (c) return catSlug(c);
  } catch {
    /* no save */
  }
  return 'canelo_admiral_cat';
}
/** the island's cats: the crew first, then the rest of the island (distinct paintings, never Canelo) */
function crowdSlugs(canelo: string, crew: string[]): string[] {
  const out: string[] = [];
  const add = (s: string | undefined) => {
    if (!s) return;
    const a = artSlug(s);
    if (a && a !== artSlug(canelo) && !out.includes(a)) out.push(a);
  };
  crew.forEach(add);
  try {
    for (const c of G.s?.cats ?? []) {
      if (out.length >= SEATS.length) break;
      if (c.species !== 'c_canelo') add(catSlug(c));
    }
  } catch {
    /* no save */
  }
  for (const s of ['plomito_plumb_cat', 'globito_balloon_cat', 'arcanito_lantern_cat', 'almohadon_pillow_cat', 'arce_autumn_cat', 'archivista_scholar_cat', 'alien_galaxy_cat', 'cascada_upfall_cat']) {
    if (out.length >= SEATS.length) break;
    add(s);
  }
  return out.slice(0, SEATS.length);
}

export class YonoseStage implements StageApi {
  verbs = YONOSE_VERBS;
  props: Record<string, number | string> = {
    pal: 'lapiz',
    'cam.x': 840,
    'cam.y': 470,
    'cam.zoom': 1.06,
    warm: 0,
    warmR: 0,
    night: 1,
    dawn: 0,
    frame: 1,
    pencil: 0,
    thumbs: 0,
    hand: 0,
    card: 0,
    crowd: 0,
  };
  palettes = {
    lapiz: pal('lapiz', 0x3a3640, 0xfffaf0, 0x7fa6c9),
    acuarela: pal('acuarela', 0x2c2a44, 0xfff4e0, 0xf08a4b),
    pintura: pal('pintura', 0x2a2420, 0xfff8ec, 0xf2994a),
  };
  promptTheme = { ink: GRAPHITE, paper: 0xfbf6ea, hot: 0xe0713a, body: 0x5a6f8f, mash: 0xe0605a, dim: 0x8a8278, kata: false, star: false, font: HAND };
  // ---- the paper and the drawing
  private paper = new PaperFilter();
  post = { filters: [this.paper] as import('pixi.js').Filter[] };
  private sky = new Graphics();
  private skyF = new SkyFilter();
  private starsG = new Graphics();
  private wrap = new Container();
  private cam = new Container();
  private anim = new AnimaticFilter();
  /** the cats (and the pencil, the hand) get their own pass: cleaner lines, lighter hatching, same blooms */
  private actWrap = new Container();
  private actCam = new Container();
  private catF = new AnimaticFilter();
  readonly set = new IslandSet();
  private snap: Sprite | null = null;
  // ---- overlays
  private strokes = new Graphics();
  private writeC = new Container();
  private writeText: Sprite | null = null;
  private writeMask = new Graphics();
  private writeW: number[] = [];
  readonly fxWash = new Container();
  private fxWashF = new WashFilter(1.3, 0.8);
  readonly typeWash = new Container();
  private typeWashF = new WashFilter(7.1, 1);
  private frame: Frame;
  private thumbs: Thumbs;
  private credits: CreditsRoll | null = null;
  private registro: RegistroCard;
  // ---- actors
  private studio: Studio;
  private lite: Studio;
  private canelo: Actor | null = null;
  private luz: Actor | null = null;
  private crowd: Actor[] = [];
  private slugs = { canelo: 'canelo_admiral_cat', luz: 'luzterna', crowd: [] as string[] };
  // ---- the dream
  private panels: { root: Container; lit: Container; grey: Container }[] = [];
  // ---- the music, as data
  private kicks: Onset[] = [];
  private accents: Onset[] = [];
  private bass: Onset[] = [];
  private keys: Onset[] = [];
  private starAt: { t: number; x: number; y: number; r: number }[] = [];
  private writeAt: number[] = [];
  private strokeAt: number[] = [];
  private eyesAt: number[] = [];
  // ---- the pick (with no finale bridge: dev / scrub)
  private localPick: MentiraChoice | null = null;
  private pickAt = 0;
  // ---- per frame
  private t = 0;
  private anchors = new Map<string, [number, number]>();
  private lastStarStep = -1;
  private lastStrokeKey = '';
  private emoted = new Set<string>();

  constructor(private k: Kit) {
    this.studio = new Studio(k.renderer, k.quality === 'high', {}, bakePlain);
    this.lite = new Studio(k.renderer, false, {}, bakePlain);
    this.frame = new Frame(k);
    this.thumbs = new Thumbs(k, (id) => this.pick(id));
    this.registro = new RegistroCard(k);
  }

  // ------------------------------------------------------------------ build
  async build(k: Kit) {
    this.slugs.canelo = caneloSlug();
    let data: import('../../../ui/story/creditsParteII').CreditsData | null = null;
    try {
      data = (await import('../../../ui/story/creditsParteII')).creditsData();
    } catch (e) {
      console.warn('[yonose] credits', e);
    }
    this.slugs.crowd = crowdSlugs(this.slugs.canelo, [...(data?.crewSlugs ?? []), ...k.crew]);
    await Promise.all([this.studio.loadAll([this.slugs.canelo, this.slugs.luz]), this.lite.loadAll(this.slugs.crowd)]);
    const L = k.layers;
    const v = k.view;
    // ---- bg: sky, stars, the set (under the Animatic filter)
    this.sky.rect(v.x, v.y, v.w, v.h).fill(0xffffff);
    this.sky.filters = [this.skyF];
    this.sky.filterArea = new Rectangle(v.x, v.y, v.w, v.h);
    this.wrap.filterArea = new Rectangle(v.x, v.y, v.w, v.h);
    this.wrap.filters = [this.anim];
    // an invisible full-view rect keeps the wrap's frame = the view
    this.wrap.addChild(new Graphics().rect(v.x, v.y, v.w, v.h).fill({ color: 0xffffff, alpha: 0.001 }));
    if (k.snapshot) {
      this.snap = new Sprite(k.snapshot);
      this.snap.position.set(v.x, v.y);
      this.snap.width = v.w;
      this.snap.height = v.h;
      this.wrap.addChild(this.snap);
    }
    this.cam.addChild(this.set.root);
    this.wrap.addChild(this.cam);
    this.actWrap.filterArea = new Rectangle(v.x, v.y, v.w, v.h);
    this.actWrap.filters = [this.catF];
    this.actWrap.addChild(new Graphics().rect(v.x, v.y, v.w, v.h).fill({ color: 0xffffff, alpha: 0.001 }));
    this.actCam.addChild(this.set.actors, this.set.hand, this.set.pencil);
    this.actWrap.addChild(this.actCam);
    this.catF.u.uEdge = new Float32Array([0.3, 0.8]);
    this.catF.u.uHatch = 0.25;
    this.catF.u.uTone = 1;
    L.bg.addChild(this.sky, this.starsG, this.wrap, this.actWrap);
    // ---- actors
    const mk = (studio: Studio, slug: string, size: number, z: number) => {
      if (!studio.has(slug)) return null;
      const a = new Actor(studio, slug, size);
      a.zIndex = z;
      a.visible = false;
      this.set.actors.addChild(a);
      return a;
    };
    this.canelo = mk(this.studio, this.slugs.canelo, 200, 50);
    this.luz = mk(this.studio, this.slugs.luz, 205, 40);
    this.slugs.crowd.forEach((s, i) => {
      const a = mk(this.lite, s, SEATS[i][2], SEATS[i][1]);
      if (a) this.crowd.push(a);
    });
    // ---- the dream panels (in the set: the filter paints them)
    VIGNETTES.forEach((vg) => {
      const p = buildPanel(vg, 230, 150);
      p.root.visible = false;
      this.set.dream.addChild(p.root);
      this.panels.push(p);
    });
    // ---- overlays
    L.wfx.addChild(this.strokes, this.writeC);
    const wt = k.text.sprite(BORDER_LINE, WRITE_STYLE, 0);
    this.writeText = wt;
    for (let i = 0; i <= BORDER_LINE.length; i++) this.writeW.push(i ? k.text.get(BORDER_LINE.slice(0, i), WRITE_STYLE).width : 0);
    this.writeC.addChild(wt, this.writeMask);
    wt.mask = this.writeMask;
    this.writeC.scale.set(0.72);
    this.fxWash.filters = [this.fxWashF];
    this.typeWash.filters = [this.typeWashF];
    L.screen.addChild(this.frame.root, this.fxWash);
    if (data) {
      this.credits = new CreditsRoll(k, data);
      L.panels.addChild(this.credits.root);
    }
    L.panels.addChild(this.registro.root);
    L.type.addChild(this.typeWash);
    L.ui.addChild(this.thumbs.root);
    // ---- the music, as data
    this.kicks = k.onsetList('kick');
    this.accents = k.onsetList('snare');
    this.bass = k.onsetList('bass');
    this.keys = k.onsetList('melody');
    const R = rng(208);
    // a star per keys note in the intro (after the cold open), placed in the sky
    for (const o of this.keys) {
      if (o.t < 2.6 || o.t >= SEC.verse) continue;
      this.starAt.push({ t: o.t, x: v.x + 80 + R() * (v.w - 160), y: v.y + 60 + R() * 380, r: 7 + R() * 9 + o.strength * 6 });
    }
    this.writeAt = this.keys.filter((o) => o.t >= WRITE.from && o.t < WRITE.to).map((o) => o.t);
    this.strokeAt = this.accents.filter((o) => o.t >= SEC.brk && o.t < SEC.naked && o.strength >= 0.4).map((o) => o.t);
    this.eyesAt = this.bass.filter((o) => o.t >= SEC.prechorus && o.t < SEC.climax).map((o) => o.t);
    this.set.drawPage(0.3, 0);
  }

  /** captions are built ahead (a box + a long handwritten line cost ~10 ms to make on a beat) */
  private captions = new Map<string, Container>();
  caption(line: [string, string]): Container {
    const key = line.join('\u0000');
    let c = this.captions.get(key);
    if (!c) this.captions.set(key, (c = captionSprite(this.k, line[0], line[1])));
    return c;
  }

  prewarm(k: Kit) {
    for (const c of k.score.cues) {
      if (c.act.verb !== 'caption') continue;
      const a = c.act.args;
      if (a.reply) for (const p of ['perfecto', 'romper', 'nada'] as MentiraChoice[]) this.caption(['LUZTERNA', MENTIRA_REPLY[p]]);
      else {
        const l = this.storyLine(String(a.beat ?? 'b64_mentira'), typeof a.idx === 'number' ? a.idx : 0);
        if (l) this.caption(l);
      }
    }
    // every caption and note this score can show (no texture is ever created on a beat)
    for (const c of k.score.cues) {
      const a = c.act.args;
      if (c.act.verb === 'note' && typeof a.text === 'string') k.text.get(a.text, { fontFamily: HAND, fontSize: typeof a.size === 'number' ? a.size : 56, fill: GRAPHITE });
    }
    for (const p of k.score.prompts) for (const list of Object.values(p.branches)) for (const a of list ?? []) if (a.verb === 'note' && typeof a.args.text === 'string') k.text.get(a.args.text, { fontFamily: HAND, fontSize: typeof a.args.size === 'number' ? a.args.size : 56, fill: GRAPHITE });
  }

  // ------------------------------------------------------------------ story text
  storyLine(beat: string, idx: number): [string, string] | null {
    const br = finaleBridge();
    let l: [string, string] | undefined;
    try {
      l = br?.lines?.(beat, [idx])?.[0];
    } catch {
      l = undefined;
    }
    l ??= BEATS.find((b) => b.id === beat)?.lines?.[idx];
    if (!l) return null;
    const who = l[0] === 'CAPTION' ? '' : l[0];
    return [who, l[1]];
  }
  replyLine(): [string, string] | null {
    const p = this.currentPick() ?? 'nada';
    return ['LUZTERNA', MENTIRA_REPLY[p]];
  }

  // ------------------------------------------------------------------ the pick
  currentPick(): MentiraChoice | null {
    return finaleBridge()?.pick ?? this.localPick;
  }
  private pick(id: MentiraChoice) {
    const t = this.t;
    if (t < PICK.open - 0.5 || t > PICK.decide + 0.2 || this.currentPick()) return;
    const br = finaleBridge();
    if (br) {
      if (!br.choose(id, t)) return;
    } else this.localPick = id;
    this.pickAt = t;
  }

  // ------------------------------------------------------------------ per frame
  update(k: Kit, m: number) {
    const t = mToSong(k.score.segments, m).t;
    this.t = t;
    finaleBridge()?.advance(t);
    if (!this.currentPick() && t >= PICK.decide && t < PICK.close + BAR) {
      // nobody picked: «nada» (the stage's own record, for the drawing)
      this.localPick = 'nada';
      this.pickAt = PICK.decide;
    }
    if (t < PICK.open - 1) {
      this.localPick = null;
    }
    const kick = k.env('kick', t, 0.09);
    const acc = k.env('snare', t, 0.07, 0.4);
    const bassE = k.env('bass', t, 0.45);
    const keysE = k.env('melody', t, 0.22);
    const perc = k.env('perc', t, 0.06);
    // the drawing redraws on twos, and on every kick
    const lk = k.last('kick', t, 0.3);
    const boil = (Math.floor(t * 12) % 3) + (lk ? (lk.i % 7) * 3 : 0);
    const warm = k.num('warm', 0);
    // the camera: a nudge on the kick, a sway on the bass
    k.cam.punch(0.007 * kick * (warm < 1.5 ? 1 : 0.6));
    k.cam.offset(0, -3 * bassE);
    // ---- the set
    this.set.drawSea(Math.floor(t * 12), bassE, t);
    const beamOn = smooth(bar(4), bar(5), t);
    this.set.drawBeam(Math.floor(t * 12), 0.16 + 0.32 * Math.sin((t / (2 * BAR)) * Math.PI * 2), beamOn, kick);
    const pageGlow = 0.25 + 0.5 * keysE + 0.3 * acc;
    if (Math.floor(t * 12) !== this.lastPageStep) {
      this.lastPageStep = Math.floor(t * 12);
      this.set.drawPage(pageGlow, 0);
    }
    this.updatePencil(t);
    this.updateHand(k, t);
    this.updateActors(k, t, kick, keysE);
    this.updateDream(k, t, kick);
    this.updateStrokes(t);
    // ---- the cold open: the game's frame un-paints, then the drawn set takes its place
    if (this.snap) {
      this.snap.visible = t < 3.2;
      this.snap.alpha = 1 - smooth(1.6, 3.0, t);
    }
    this.cam.alpha = this.snap ? smooth(1.0, 2.6, t) : 1;
    // ---- the blooms (screen design px, relative to the view)
    const v = k.view;
    const toV = (p: [number, number]): [number, number] => [p[0] - v.x, p[1] - v.y];
    const s = this.skyF.u;
    // A: Luzterna's lantern (the first speck of color) — its size depends on how it was lit
    const fj = k.judged('farol');
    const lantR = t < FAROL ? 0 : (fj?.r === 'great' ? 230 : fj?.r === 'hit' ? 170 : 120) * smooth(FAROL, FAROL + (fj?.r === 'miss' || !fj ? 1.2 : 0.5), t);
    const lantP = this.anchors.get('lantern') ?? [v.x + v.w * 0.66, v.y + v.h * 0.4];
    const lv = toV(lantP);
    const lantAmt = (1 - clamp01(warm) * 0.85) * (t >= FAROL ? 1 : 0);
    const zoom = k.num('cam.zoom', 1);
    // (only the drawing takes the lantern's color, never the sky: a speck, not a stain)
    this.catF.set4('uBloomA', lv[0], lv[1], lantR * 0.62 * zoom * (1 + 0.12 * keysE), lantAmt);
    this.anim.set4('uBloomA', 0, 0, 0, 0);
    this.skyF.set4('uBloomA', 0, 0, 0, 0);
    // B: the cold open (color drains to the lamp) · Canelo's warmth (break → chorus) · the cats breathing in (prechorus)
    let bR = 0;
    let bAmt = 0;
    let bP: [number, number] = [v.x + v.w / 2, v.y + v.h / 2];
    if (t < 1.6 && this.snap) {
      bP = this.anchors.get('lamp') ?? bP;
      // on the opening hit the color starts draining toward the lamp; 1.5 s later the game is a pencil sketch
      bR = 2600 * (1 - smooth(0, 1.5, t)) ** 1.7;
      bAmt = 2;
    } else if (t >= CALOR - 0.2 && t < SEC.chorus + 3 * BEAT + 0.05) {
      bP = this.anchors.get('canelo') ?? bP;
      const pr = k.prompt('calor');
      // (prompt times are momento time: k.m)
      const holding = pr && pr.from !== undefined && pr.to === undefined ? clamp01((k.m - pr.from) / (SEC.chorus - CALOR)) : pr?.to !== undefined && pr.from !== undefined ? clamp01((pr.to - pr.from) / (SEC.chorus - CALOR)) : 0;
      bR = Math.max(lerp(30, 230, smooth(CALOR, SEC.chorus, t)) + 160 * holding * (1 + 0.15 * keysE), k.num('warmR', 0));
      bAmt = 1;
    } else if (t >= MENTIRA_HOLD - 0.2 && t < SEC.climax) {
      bP = this.anchors.get('page') ?? bP;
      const pr = k.prompt('mentira');
      const holding = pr && pr.from !== undefined && pr.to === undefined ? clamp01((k.m - pr.from) / (SEC.climax - MENTIRA_HOLD)) : 0;
      bR = lerp(40, 240, smooth(MENTIRA_HOLD, SEC.climax, t)) + 180 * holding;
      bAmt = 0.4;
    }
    const bv = toV(bP);
    for (const f of [this.anim, this.catF]) f.set4('uBloomB', bv[0], bv[1], bR, bAmt);
    // the sky only takes the flood (a night wash creeping into a pencil sky reads as a stain)
    if (t >= SEC.chorus && t < SEC.chorus + 3 * BEAT + 0.05) this.skyF.set4('uBloomB', bv[0], bv[1], bR, bAmt);
    else this.skyF.set4('uBloomB', 0, 0, 0, 0);
    const blue = 0.35 * (1 - smooth(1, bar(8), t)) * (1 - clamp01(warm));
    for (const f of [this.anim, this.catF]) {
      f.u.uWarm = warm;
      f.u.uBoil = boil;
      f.u.uBlue = blue;
    }
    s.uWarm = warm;
    s.uBoil = boil;
    s.uNight = k.num('night', 1) * (1 - 0.15 * bassE);
    s.uDawn = k.num('dawn', 0);
    const px = k.renderer.resolution * (k.renderer.screen.width / Math.max(1, v.w));
    for (const f of [this.anim, this.catF]) {
      f.u.uPx = (k.quality === 'high' ? 1 : Math.min(1, 1 / k.renderer.resolution)) * px;
      f.resolution = k.quality === 'high' ? k.renderer.resolution : Math.min(1, k.renderer.resolution);
      f.view(v.w, v.h);
    }
    this.skyF.view(v.w, v.h);
    this.paper.view(v.w, v.h);
    this.paper.u.uGrain = 0.085 - 0.03 * clamp01(warm - 1);
    this.fxWashF.u.uPx = px;
    this.typeWashF.u.uPx = px;
    // the horizon on screen (the sky's pencil hatching stops there)
    s.uHorizon = Math.max(60, k.cam.toScreen(960, P.horizon)[1] - v.y);
    // ---- stars (screen, light parallax): pencil asterisks that become paint dots
    this.drawStars(k, t, perc, acc, warm);
    // ---- the storyboard furniture
    const keysPassed = this.countBefore(this.keys, t);
    this.frame.update(t, k.num('frame', 1) * (1 - smooth(1.2, 1.9, warm)), keysPassed + 1, this.kicks, this.accents, this.bass);
    this.thumbs.update(t, k.num('thumbs', 0), this.currentPick(), this.pickAt, kick);
    this.credits?.update(t, kick, bassE);
    this.registro.update(t, k.num('card', 0));
  }
  private lastPageStep = -1;

  private countBefore(l: Onset[], t: number) {
    let lo = 0;
    let hi = l.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (l[mid].t <= t) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  private drawStars(k: Kit, t: number, perc: number, acc: number, warm: number) {
    const step = Math.floor(t * 12);
    const tw = Math.round((perc + acc) * 4);
    const key = step * 16 + tw;
    if (key === this.lastStarStep) return;
    this.lastStarStep = key;
    const g = this.starsG;
    g.clear();
    const fade = 1 - smooth(SEC.outro, SEC.outro + 4 * BAR, t);
    if (fade <= 0) return;
    const n = this.starAt.filter((s) => s.t <= t).length;
    const px = -(k.num('cam.x', 960) - 960) * 0.25;
    const py = -(k.num('cam.y', 540) - 540) * 0.25;
    const pen = clamp01(1 - warm);
    for (let i = 0; i < n; i++) {
      const s = this.starAt[i];
      const born = clamp01((t - s.t) / 0.25);
      const twinkle = 1 + 0.35 * ((i * 7 + step) % 5 === 0 ? perc + acc : 0);
      const r = s.r * born * twinkle;
      if (pen > 0.02) starMark(g, s.x + px, s.y + py, r, { seed: i * 3 + (step % 3), width: 2, alpha: 0.75 * pen * fade });
      if (pen < 0.98) g.circle(s.x + px, s.y + py, r * 0.35).fill({ color: 0xfff1c8, alpha: (1 - pen) * 0.9 * fade });
    }
  }

  // ---- the giant pencil (the player's): it comes down toward the page, tries to write around him, lifts away
  private updatePencil(t: number) {
    const p = this.k.num('pencil', 0);
    const g = this.set.pencil;
    g.visible = p > 0.005;
    if (!g.visible) return;
    let tx = lerp(1780, 1050, p);
    let ty = lerp(-480, 690, p);
    if (t >= SEC.brk && t < SEC.naked + BEAT) {
      // writing: the tip follows the line it is trying to draw around the sleeping cat
      const end = this.strokeEnd(t);
      if (end) {
        tx = lerp(tx, end[0], 0.85);
        ty = lerp(ty, end[1] - 4, 0.85);
      }
    }
    g.position.set(tx, ty);
  }

  // ---- the far hand writing on the margin (break2)
  private updateHand(k: Kit, t: number) {
    const a = k.num('hand', 0);
    const h = this.set.hand;
    const letters = t >= WRITE.from ? Math.min(BORDER_LINE.length, this.writeAt.filter((x) => x <= t).length) : 0;
    // the sentence: written letter by letter, then washed away by «…Mentira»
    const show = t >= WRITE.from && t < MENTIRA_T + 2.4;
    this.writeC.visible = show;
    const [mx, my] = P.margin;
    const x0 = mx - 60;
    if (show && this.writeText) {
      this.writeC.position.set(x0, my - 8);
      const wGone = smooth(MENTIRA_T, MENTIRA_T + 2.2, t);
      this.writeC.alpha = 1 - wGone;
      this.writeText.y = wGone * 30;
      const shown = t >= SEC.prechorus ? BORDER_LINE.length : letters;
      const wpx = this.writeW[shown] ?? 0;
      this.writeMask.clear().rect(-4, -10, wpx + 6, 60).fill(0xffffff);
    }
    h.visible = a > 0.01;
    if (!h.visible) return;
    const wpx = (this.writeW[letters] ?? 0) * 0.72;
    h.alpha = a;
    h.position.set(x0 + wpx + 2 + (1 - a) * 260, my + 6 - (1 - a) * 260 + Math.sin(t * 9) * 1.5);
  }

  // ---- the strokes the pencil makes around the sleeping cat (one per rim accent)
  private strokePath: number[] = (() => {
    const [cx, cy] = P.page;
    const pts: number[] = [cx - 150, cy + 12];
    for (let i = 0; i <= 14; i++) {
      const an = Math.PI + (i / 14) * Math.PI;
      pts.push(cx + Math.cos(an) * 118, cy - 6 + Math.sin(an) * 52);
    }
    pts.push(cx + 150, cy + 10);
    return pts;
  })();
  private strokeEnd(t: number): [number, number] | null {
    const n = this.strokeAt.filter((x) => x <= t).length;
    if (!n) return [this.strokePath[0], this.strokePath[1]];
    const seg = Math.min(this.strokePath.length / 2 - 1, n * 2);
    return [this.strokePath[seg * 2], this.strokePath[seg * 2 + 1]];
  }
  private updateStrokes(t: number) {
    const on = t >= SEC.brk && t < SEC.chorus + BAR;
    const n = on ? this.strokeAt.filter((x) => x <= t).length : 0;
    const fade = 1 - smooth(SEC.chorus, SEC.chorus + BAR, t);
    const key = `${n}|${Math.floor(t * 12) % 3}|${Math.round(fade * 10)}`;
    if (key === this.lastStrokeKey) return;
    this.lastStrokeKey = key;
    const g = this.strokes;
    g.clear();
    if (!n) return;
    const seg = Math.min(this.strokePath.length / 2 - 1, n * 2);
    sketch(g, this.strokePath.slice(0, seg * 2 + 2), { seed: Math.floor(t * 12) % 3, width: 2.6, alpha: 0.8 * fade, passes: 2, wob: 1.2 });
  }

  // ---- the cats
  private updateActors(k: Kit, t: number, kick: number, keysE: number) {
    const step = k.beatStep(t);
    // CANELO: walks in (#20), hops onto the page, three turns, lies down, sleeps (breathing on the keys)
    const c = this.canelo;
    if (c) {
      c.visible = t >= CANELO.walk - 0.1;
      if (c.visible) {
        const [px, py] = P.page;
        let x = px;
        let y = py - 4;
        let sx = 1;
        let sy = 1;
        let rot = 0;
        if (t < CANELO.onPage) {
          const w = smooth(CANELO.walk, CANELO.onPage, t);
          x = lerp(560, px - 40, w);
          y = this.set.topAt(x) + 6 - Math.abs(Math.sin(t * Math.PI * 1.5)) * 10;
          const hop = smooth(CANELO.onPage - 0.4, CANELO.onPage, t);
          y -= Math.sin(hop * Math.PI) * 60;
        }
        for (const vt of VUELTAS) {
          if (t >= vt && t < vt + BEAT) {
            const ph = (t - vt) / BEAT;
            const j = k.judged(`vuelta${VUELTAS.indexOf(vt)}`);
            sx = Math.cos(ph * Math.PI * 2);
            if (Math.abs(sx) < 0.2) sx = sx < 0 ? -0.2 : 0.2;
            if (j?.r === 'miss') rot = Math.sin(ph * Math.PI * 4) * 0.12;
            y -= Math.sin(ph * Math.PI) * (j?.r === 'great' ? 26 : 12);
          }
        }
        const lie = smooth(ASLEEP_T - 0.3, ASLEEP_T + 0.4, t);
        sy = lerp(sy, 0.64, lie);
        sx = lerp(sx, 1.2, lie);
        y = lerp(y, py + 4, lie);
        if (t >= ASLEEP_T) sy *= 1 + 0.035 * keysE + 0.012 * Math.sin(t * 2.4);
        // pokes: the ear flicks (a tiny jolt) on Luzterna's pokes
        for (const pt of PICA) if (t >= pt && t < pt + 0.25) rot += 0.03 * Math.sin((t - pt) * 40);
        c.pose(t, x, y, { sx, sy, rot, step, flip: true });
        if (c.puppet) c.puppet.sleeping = t >= ASLEEP_T;
      }
    }
    // LUZTERNA: with her lantern by the page (from #2), lifts it on the tap, leans in to poke him
    const l = this.luz;
    if (l) {
      l.visible = t >= bar(2);
      if (l.visible) {
        const [lx, ly] = P.luz;
        const inn = smooth(bar(2), bar(3), t);
        let x = lerp(lx + 260, lx, inn);
        const lift = smooth(FAROL - 0.15, FAROL + 0.2, t) * (1 - smooth(SEC.verse, SEC.verse + BAR, t));
        let rot = -0.06 * lift;
        for (const pt of PICA) {
          const p = smooth(pt - 0.3, pt, t) * (1 - smooth(pt + 0.2, pt + 0.8, t));
          x -= 60 * p;
          rot -= 0.18 * p;
        }
        const bob = -kick * 6;
        l.pose(t, x, ly + bob - lift * 24, { rot, step, flip: true });
      }
    }
    // THE ISLAND'S CATS: hop in on the verse kicks; doze off in the break; one eye opens per bass note (prechorus);
    // all awake on «Mentira»
    const awake = this.eyesAt.filter((x) => x <= t).length;
    this.crowd.forEach((a, i) => {
      const [sx0, sy0] = SEATS[i];
      const at = ARRIVE[i] ?? ARRIVE[ARRIVE.length - 1];
      a.visible = t >= at - 0.45;
      if (!a.visible) return;
      let x = sx0;
      let y = sy0;
      if (t < at) {
        const p = clamp01((t - (at - 0.45)) / 0.45);
        const fromX = sx0 + (sx0 < 960 ? -320 : 320);
        x = lerp(fromX, sx0, p);
        y = lerp(sy0 + 160, sy0, p) - Math.sin(p * Math.PI) * 130;
      }
      const look = t >= BIG1 && t < BIG1 + 2 * BAR ? -6 : 0;
      y += -kick * (6 + (i % 3) * 2) + look;
      const sq = t >= at && t < at + 0.2 ? 1 - 0.12 * Math.sin(((t - at) / 0.2) * Math.PI) : 1;
      a.pose(t, x, y, { sx: sq * (1 + 0.1 * Math.sin(((t - at) / 0.2) * Math.PI) * (t < at + 0.2 && t >= at ? 1 : 0)), sy: 2 - sq, step, flip: x > 960 });
      if (a.puppet) {
        const doze = t >= SEC.naked + i * 0.4 && t < SEC.climax;
        const opened = t >= SEC.prechorus && i < awake;
        a.puppet.sleeping = doze && !opened;
      }
      // on «Mentira» everyone reacts once
      const key = `m${i}`;
      if (t >= MENTIRA_T && t < MENTIRA_T + 0.5 && !this.emoted.has(key)) {
        this.emoted.add(key);
        a.emote('happy');
      }
      if (t < MENTIRA_T - 1) this.emoted.delete(key);
    });
  }

  // ---- the dream: one panel per two bars rises from Canelo into the sky; it lights up (or stays grey) on its tap
  private updateDream(k: Kit, t: number, kick: number) {
    const [cx, cy] = P.page;
    this.panels.forEach((p, i) => {
      const tap = SUENOS[i];
      const t0 = tap - BAR;
      const on = t >= t0 && t < SEC.break2 + 2 * BAR;
      p.root.visible = on;
      if (!on) return;
      const rise = smooth(t0, tap, t);
      const slotX = 330 + i * 252;
      const slotY = 150 + (i % 2) * 120;
      const away = smooth(SEC.break2, SEC.break2 + 2 * BAR, t);
      p.root.position.set(lerp(cx, slotX, rise), lerp(cy - 120, slotY, rise) - away * 300 - kick * 6 + Math.sin(t * 1.3 + i) * 6);
      p.root.scale.set(lerp(0.2, 1, rise) * (1 + 0.04 * (t >= tap && t < tap + 0.3 ? 1 - (t - tap) / 0.3 : 0)));
      p.root.rotation = Math.sin(t * 0.8 + i * 1.7) * 0.05;
      p.root.alpha = 1 - away;
      const j = k.judged(`sueno${i}`);
      const lit = j ? (j.r === 'great' ? 1 : j.r === 'hit' ? 0.8 : 0) : 0;
      p.lit.alpha = t >= tap ? lit * smooth(tap, tap + 0.25, t) : 0;
    });
  }

  // ------------------------------------------------------------------ after the clips: the camera on the set + anchors
  late(k: Kit) {
    k.cam.apply(this.cam);
    k.cam.apply(this.actCam);
    const S = (x: number, y: number) => k.cam.toScreen(x, y);
    const a = this.anchors;
    a.clear();
    a.set('lamp', S(P.lamp[0], P.lamp[1]));
    a.set('page', S(P.page[0], P.page[1]));
    const lz = this.luz;
    const lzX = lz ? lz.x : P.luz[0];
    const lzY = lz ? lz.y : P.luz[1];
    a.set('luz', S(lzX, lzY - 300));
    a.set('lantern', S(lzX - 40, lzY - 190));
    const c = this.canelo;
    // (prompts sit above his head, and never under the captions' corner)
    const cs = S(c ? c.x : P.page[0], (c ? c.y : P.page[1]) - 150);
    a.set('canelo', [cs[0], Math.max(k.view.y + 340, cs[1] - 120)]);
    this.crowd.forEach((g, i) => a.set(`gato${i}`, S(SEATS[i][0], SEATS[i][1] - SEATS[i][2] - 40)));
    for (let i = this.crowd.length; i < SEATS.length; i++) a.set(`gato${i}`, S(SEATS[i][0], SEATS[i][1] - 160));
    a.set('crowd', S(960, 840));
    this.panels.forEach((p, i) => a.set(`sueno${i}`, S(p.root.x, p.root.y)));
    const cc = this.credits?.corner();
    if (cc) a.set('credit', cc);
    else a.set('credit', [k.view.x + k.view.w - 600, k.view.y + 200]);
  }
  anchor(name: string): [number, number] | null {
    return this.anchors.get(name) ?? null;
  }

  // ------------------------------------------------------------------ helpers for the verbs
  creditAccent(): number | null {
    return this.credits?.active?.accent ?? null;
  }
  /** a crowd cat's hop: [fromX, fromY, seatX, seatY] (world) */
  hopPath(who: string): [number, number, number, number] | null {
    const i = Number(who.replace(/\D/g, ''));
    const s = SEATS[i];
    if (!s) return null;
    return [s[0] + (s[0] < 960 ? -320 : 320), s[1] + 160, s[0], s[1]];
  }
  /** Canelo's feet (world) and his height */
  caneloWorld(): [number, number, number] | null {
    const c = this.canelo;
    if (!c || !c.visible) return [P.page[0], P.page[1], 140];
    return [c.x, c.y, 140 * c.scale.y];
  }

  destroy() {
    this.thumbs.destroy();
    for (const c of this.captions.values()) c.destroy({ children: true });
    this.captions.clear();
    this.credits?.destroy();
    for (const f of [this.paper, this.skyF, this.anim, this.catF, this.fxWashF, this.typeWashF]) f.destroy();
    // the paintings may still be bound to the last frame's shaders: free them two frames later (like the runner)
    const studios = [this.studio, this.lite];
    let n = 0;
    const later = () => {
      if (++n < 3) return void requestAnimationFrame(later);
      for (const s of studios) s.dispose();
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(later);
    else for (const s of studios) s.dispose();
    this.writeText = null;
    void Text;
  }
}

const bar = (n: number, beat = 0) => n * BAR + beat * BEAT;

export default function createStage(k: Kit): StageApi {
  return new YonoseStage(k);
}
