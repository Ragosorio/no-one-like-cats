/**
 * «DRUNCK» — the set: PSICODELIA DE TABERNA (docs/part-iii/07 §2.3, 04 §3), polished in round 3 (docs/part-iii/13 §3.3).
 *
 *  - THE BAR IS THE STAGE OF MEMORY. Every memory comes OUT of an object of the bar and goes back to it: the camera pushes
 *    into the object and the object opens into the set (mug → the sea of beer, the counter's newspaper → the front
 *    pages, the tally board → the card and the logbook, the window neon → the galleon, the TV → your lighthouse, the
 *    bathroom door → the graffiti, the mug's wet ring → the watercolor, the napkin → the page). The score drives it with
 *    three keys: `in` (the memory), `inP` (0..1, how open the doorway is) and `obj` (which object). The doorway is the
 *    object's quad on screen (the bar scene knows it) growing to the whole frame, while the memory itself grows out of
 *    the object's size; its rim is drawn in the object's color. «Reducir movimiento»: a plain cross-fade instead.
 *  - THE PRESENT is the Borracha's TV cartoon (bar.ts + tv.ts): flat saturated colors, one uniform dark line, soft
 *    scanlines and curvature (CRT, in the post: never in the paint), a rubber-hose bounce on the beat.
 *  - PARTE I is told as animated front pages of the Diario del Mar (sepia engraving), with Canelo cut out in cartoon
 *    jumping from photo to photo. PARTE II in the style of ITS Momentos — the six bakes of the kit — and the bosses'
 *    styles INVADE the bar (the ink, the graffiti) instead of swapping the background.
 *  - PSYCHEDELIA with direction: the glass of the mug bends the bar (bulge), scale changes (a tiny raft in a giant
 *    mug), a hue drift per section, the bottom of the glass as a kaleidoscope, a twist at the filter opening, 1930's
 *    black and white that color breaks out of in a wave. «Reducir movimiento» trades them for fades.
 *
 * Every sound has a purpose (pure functions of the onset tracks): the loose kicks of the intro are hiccups; in the drops
 * each kick pumps the picture and bounces the cartoon; the breaths (no kick) hold still. After the dry cut: silence.
 *
 * Scenes are built ONCE before the clock (scenes*.ts) and only the live ones update; each scene has its own clock (`lt`
 * = seconds since it came on, as the outer scene or as the memory in a doorway). Everything is seekable.
 */
import { ColorMatrixFilter, Container, Filter, Graphics, RenderTexture, Sprite, Texture } from 'pixi.js';
import { CRTFilter } from 'pixi-filters';
import type { Kit, StageApi } from '../../anime/kit';
import { W } from '../../anime/kit';
import { Actor, Studio } from '../../anime/actor';
import type { Palette } from '../../anime/palette';
import { G } from '../../../state/game';
import { catSlug } from '../../../state/sys/forms';
import { catRig } from '../../../art/puppetCore';
import { bakeToon } from '../circusMalus/film';
import { bakeMiniature } from '../whenILose/ink';
import { COMIC_CEL } from '../teOdio/bake';
import { bakePlain as bakeAnimatic } from '../yonoseTodo/paper';
import { CAST, STAND_IN, TV, LW, bakePlain, bakeTv } from './tv';
import { DRUNCK_VERBS } from './verbs';
import { SCENES, type Scn } from './scenes';
import { easeInOut, lerp } from './drawkit';
import { ColorWaveFilter } from './fxlook';
import { CHOICE, PUM } from './score';

/** the bakes this Momento uses (one Studio each) */
export type Look = 'tv' | 'native' | 'sepia' | 'cel' | 'comic' | 'toon' | 'animatic';

export const DRUNCK_PALETTES: Record<string, Palette> = {
  /** the present: TV colors, neutral grade (the CRT is its texture) */
  tv: {
    name: 'tv',
    ink: TV.line,
    shadow: TV.nightD,
    base: TV.night,
    light: TV.cream,
    accent: TV.pink,
    accent2: TV.amber,
    sky: [0x151d44, 0x1f2a5c, 0x2f3f86],
    sea: [0x2f3f86, 0x1f2a5c, 0x151d44],
    grade: { shade: TV.line, glow: 0xfff6e0, sat: 1.05, tone: 0, vignette: 0.12 },
  },
  /** the Diario del Mar: sepia engraving */
  diario: {
    name: 'diario',
    ink: 0x2a1a10,
    shadow: 0x6a4a30,
    base: 0xb08a5a,
    light: 0xf1e2c4,
    accent: 0xb0302a,
    accent2: 0x2a1a10,
    sky: [0xe9d8b4, 0xe2cfa6, 0xd9c497],
    sea: [0xc9b080, 0xb09060, 0x8a6c44],
    grade: { shade: 0x2a1a10, glow: 0xfff3dc, sat: 0.9, tone: 0, vignette: 0.3 },
  },
  /** the break: watercolor and pencil (ANIMATIC) */
  acuarela: {
    name: 'acuarela',
    ink: 0x34343c,
    shadow: 0x8a8a96,
    base: 0xc8c0b0,
    light: 0xf4ecdc,
    accent: 0xe07a5a,
    accent2: 0x5a8ac8,
    sky: [0xf4ecdc, 0xece2cc, 0xe2d6bc],
    sea: [0xb8cce0, 0x9ab4d0, 0x7a9cc0],
    grade: { shade: 0x34343c, glow: 0xfffaf0, sat: 1, tone: 0, vignette: 0.15 },
  },
};

/** Canelo as the player has him (his form), else the cozy painting */
function caneloSlug(): string {
  try {
    const c = G.s?.cats?.find((x) => x.species === 'c_canelo');
    if (c) return catSlug(c);
  } catch {
    /* no save */
  }
  return 'canelo_cozy_cat';
}
/** a few of the player's own cats (the island that sleeps and dreams in c33): never Canelo, never a stand-in */
function islandCats(n: number): string[] {
  const out: string[] = [];
  try {
    for (const c of G.s?.cats ?? []) {
      if (c.species === 'c_canelo') continue;
      const s = catSlug(c);
      if (catRig(s) && !out.includes(s)) out.push(s);
      if (out.length >= n) break;
    }
  } catch {
    /* no save */
  }
  for (const s of ['ronron_purr_cat', 'copito_snowball_cat', 'menta_botanical_cat', 'nube_dream_cat']) if (out.length < n && !out.includes(s)) out.push(s);
  return out;
}
export { capiPick } from './drawkit';
const guardRig = (slug: string) => {
  const r = catRig(slug) as { floats?: unknown[] } | undefined;
  if (r && !Array.isArray(r.floats)) r.floats = [];
};

/** one stretch of the score where the scene list doesn't change: the outer scene and the memory in its doorway */
interface Span {
  m: number;
  scn: string;
  inn: string;
}

export class DrunckStage implements StageApi {
  verbs = DRUNCK_VERBS;
  palettes = DRUNCK_PALETTES;
  promptTheme = { ink: TV.line, paper: TV.cream, hot: TV.amberL, body: TV.pinkD, mash: TV.green, dim: 0x9a8fb0, kata: false, font: 'Bangers' };
  props: Record<string, number | string> = {
    pal: 'tv',
    scn: 'bar',
    in: '',
    inP: 0,
    obj: '',
    // the bar's own camera (the listener rule clamps it): x, y, zoom, roll
    'b.x': 815,
    'b.y': 470,
    'b.z': 1.25,
    'b.r': 0,
    can: 'idle',
    blank: 0,
    sweep: 0,
    foamWave: 0,
    raft: 0,
    palm: 0,
    white: 0,
    tug: 0,
    spray: 0,
    free: 0,
    sub: 0,
    bubbles: 0,
    kaleido: 0,
    land: 1,
    slide: 0,
  };
  readonly studios: Record<Look, Studio>;
  readonly slugs = {
    canelo: caneloSlug(),
    admiral: 'canelo_admiral_cat',
    astral: 'canelo_astral_cat',
    baby: 'canelo_cozy_cat',
    espuma: catRig(CAST.espuma) ? CAST.espuma : STAND_IN.espuma,
    luzterna: 'luzterna',
    patito: 'jelly_aquatic_cat',
    bigotes: 'arce_autumn_cat',
    gargola: 'fossilstone_guardian_cat',
    kraken: 'mecha_neon_cat',
    arcanista: 'candy_alchemist_cat',
    estrella: 'regal_cosmic_cat',
    nadie: 'nadie_static_cat',
    biblio: 'bibliotecario_drowned_cat',
    cascada: 'cascada_upfall_cat',
    maneki: 'mochi_bell_cat',
    brecha: 'brecha_crowbar_cat',
    tachon: 'tachon_strikeout_cat',
    bisagra: 'bisagra_hinge_cat',
    island: islandCats(3),
  };
  scenes = new Map<string, Scn>();
  /** the scene stretches (from the score's scn / in keys): each scene's clock is a pure function of m */
  private spans: Span[] = [];
  /** the moments the score says something happens (seekable state) */
  hics: number[] = [];
  portadas: { m: number; n: number }[] = [];
  folios: number[] = [];
  burpAt = Infinity;
  chainAt = Infinity;
  slamAt = Infinity;
  tearAt = Infinity;
  pumM = Infinity;
  // ---- the choice ¿CUÁNTOS? (cosmetic, seekable)
  pick: 3 | 40 | 1000 | null = null;
  pickAt = Infinity;
  choiceOpenM = Infinity;
  choiceDecideM = Infinity;
  // ---- post: the psychedelic hue drift, the TV's CRT, 1930's film that color breaks out of
  private hue = new ColorMatrixFilter();
  private crt: CRTFilter;
  readonly wave = new ColorWaveFilter();
  post: { filters: Filter[]; live: (k: Kit) => boolean };
  /** a fade to cover the cuts when motion is reduced (fades instead of psychedelia) */
  readonly fade = new Graphics();
  private fadeFrom = -1;
  // ---- the doorway (an object of the bar opening into a memory)
  private doorMask = new Graphics();
  private doorRim = new Graphics();
  /** the last beat-step each on-twos scene was drawn at */
  private drawnAt = new Map<string, number>();
  private liveName = '';
  private innerName = '';
  private innerP = 0;
  /** the burp's color wave (set by the feria scene each frame: screen point, radius, amount) */
  waveAt: { x: number; y: number; r: number; amt: number } | null = null;

  constructor(readonly k: Kit) {
    const hi = k.quality === 'high';
    this.studios = {
      tv: new Studio(k.renderer, hi, {}, bakeTv),
      native: new Studio(k.renderer, hi, {}, bakePlain),
      sepia: new Studio(k.renderer, false, {}, bakeMiniature),
      cel: new Studio(k.renderer, false, {}),
      comic: new Studio(k.renderer, false, COMIC_CEL),
      toon: new Studio(k.renderer, false, {}, bakeToon),
      animatic: new Studio(k.renderer, false, {}, bakeAnimatic),
    };
    this.crt = new CRTFilter({ curvature: 2.2, lineWidth: 2.4, lineContrast: 0.08, noise: 0.035, noiseSize: 1.4, vignetting: 0.3, vignettingAlpha: 0.5, vignettingBlur: 0.4 });
    this.wave.enabled = false;
    this.post = { filters: [this.hue, this.crt, this.wave], live: () => this.hue.enabled || this.crt.enabled || this.wave.enabled };
  }

  async build(k: Kit) {
    const s = this.slugs;
    for (const x of [s.espuma]) guardRig(x);
    await Promise.all([
      this.studios.tv.loadAll([s.canelo, s.admiral, s.astral, s.baby, s.luzterna, s.maneki, s.bisagra, s.estrella, s.brecha, s.tachon]),
      this.studios.native.loadAll([s.espuma]),
      this.studios.sepia.loadAll([s.canelo, s.patito, s.bigotes, s.gargola, s.kraken, s.arcanista, s.estrella, s.biblio, s.luzterna, s.nadie]),
      this.studios.cel.loadAll([s.canelo, s.cascada]),
      this.studios.comic.loadAll([s.canelo, s.brecha]),
      this.studios.toon.loadAll([s.canelo, s.tachon]),
      this.studios.animatic.loadAll([s.canelo, ...s.island]),
      ...['80px "Bangers"', '80px "Anton"', '40px "Permanent Marker"', '80px "UnifrakturMaguntia"', '700 60px "Playfair Display"', 'italic 700 50px "Playfair Display"', '40px "Dela Gothic One"', '60px "Bebas Neue"', '48px "Rubik Glitch"', '700 40px "Space Grotesk"'].map((f) =>
        document.fonts.load(f).catch(() => undefined),
      ),
    ]);
    // ---- what the score says (seekable state)
    const cues = k.score.cues;
    this.hics = cues.filter((c) => c.act.verb === 'hic').map((c) => c.m);
    this.portadas = cues.filter((c) => c.act.verb === 'portada').map((c) => ({ m: c.m, n: Number(c.act.args.n ?? 0) }));
    this.folios = cues.filter((c) => c.act.verb === 'folio').map((c) => c.m);
    const first = (verb: string) => cues.find((c) => c.act.verb === verb)?.m ?? Infinity;
    this.burpAt = first('burp');
    this.chainAt = first('chainBreak');
    this.tearAt = first('tear');
    this.pumM = k.score.prompts.find((p) => p.id === 'pum')?.m ?? PUM;
    this.choiceOpenM = first('cuantos');
    const ch = cues.find((c) => c.act.verb === 'cuantos');
    this.choiceDecideM = ch ? ch.m + (CHOICE.decide - CHOICE.open) : Infinity;
    // the spans: every change of the outer scene or of the memory in the doorway
    const scnK = k.score.keys.get('scn') ?? [];
    const inK = k.score.keys.get('in') ?? [];
    const times = [...new Set([0, ...scnK.map((x) => x.m), ...inK.map((x) => x.m)])].sort((a, b) => a - b);
    const valAt = (list: { m: number; value: number | string }[], m: number, d: string) => {
      let v = d;
      for (const x of list) if (x.m <= m + 1e-6) v = String(x.value);
      return v;
    };
    this.spans = times.map((m) => ({ m, scn: valAt(scnK, m, String(this.props.scn)), inn: valAt(inK, m, '') }));
    // ---- every scene, built once (before the clock: no texture is made on the beat)
    const L = k.layers;
    for (const [name, make] of Object.entries(SCENES)) {
      const sc = make(this, k);
      sc.root.visible = false;
      L.world.addChildAt(sc.root, 0);
      this.scenes.set(name, sc);
    }
    L.world.addChild(this.doorRim, L.wfx);
    L.world.addChild(this.doorMask);
    this.doorMask.visible = true;

    L.screen.addChildAt(this.fade, 0);
    // DEV: a fixed pick for contact sheets (?pick=3|40|1000)
    if (import.meta.env.DEV && typeof location !== 'undefined') {
      const q = Number(new URLSearchParams(location.search).get('pick'));
      if (q === 3 || q === 40 || q === 1000) this.pick = q;
    }
  }

  // ---------------------------------------------------------------- helpers for the scenes
  /** an actor from a studio (null if the painting couldn't load) */
  actor(look: Look, slug: string, size: number): Actor | null {
    const st = this.studios[look];
    if (!st.has(slug)) return null;
    guardRig(slug);
    return new Actor(st, slug, size);
  }
  still(look: Look, slug: string, ax = 0.5, ay = 0.97): Sprite | null {
    return this.studios[look].still(slug, ax, ay);
  }
  silhouette(look: Look, slug: string, ax = 0.5, ay = 0.97): Sprite | null {
    return this.studios[look].silhouette(slug, ax, ay);
  }
  /** the last hiccup at or before m (seconds since it, Infinity = none) */
  sinceHic(m: number) {
    let last = -Infinity;
    for (const t of this.hics) if (t <= m + 1e-6) last = t;
    return m - last;
  }
  /** the cartoon's bounce: 0 on the kick, up between (rubber hose); 0 in the breaths and after the cut */
  bounce(k: Kit, m: number) {
    if (m >= this.pumM) return 0;
    return k.env('kick', m, 0.11, 0.3);
  }
  /** a string key's current value and when it was set (for gestures: 'can' → ['point', 24.1]) */
  keyAt(k: Kit, name: string, m: number, d = ''): [string, number] {
    let v = d;
    let at = -Infinity;
    for (const x of k.score.keys.get(name) ?? []) {
      if (x.m > m + 1e-6) break;
      v = String(x.value);
      at = x.m;
    }
    return [v, at];
  }
  /** the choice as seen at m (seekable): the pick once it was made, the default 40 after the decision */
  pickAtM(m: number): 3 | 40 | 1000 | null {
    if (m < this.choiceOpenM) return null;
    if (this.pick !== null && (this.pickAt <= m || this.pickAt === Infinity)) return this.pick;
    return m >= this.choiceDecideM ? 40 : null;
  }
  choose(n: 3 | 40 | 1000, m: number) {
    if (m < this.choiceOpenM || m > this.choiceDecideM) return;
    if (this.pick !== null && this.pickAt <= m) return;
    this.pick = n;
    this.pickAt = m;
  }
  /** the span at m */
  private spanAt(m: number): Span {
    let cur = this.spans[0] ?? { m: 0, scn: 'bar', inn: '' };
    for (const s of this.spans) if (s.m <= m + 1e-6) cur = s;
    return cur;
  }
  /** when scene `name` came on (it has been on continuously, as the outer scene or the memory, since then) */
  onSince(name: string, m: number): number {
    let i = -1;
    for (let j = 0; j < this.spans.length; j++) if (this.spans[j].m <= m + 1e-6) i = j;
    if (i < 0) return 0;
    let start = this.spans[i].m;
    for (let j = i; j >= 0; j--) {
      const s = this.spans[j];
      if (s.scn !== name && s.inn !== name) break;
      start = s.m;
    }
    return start;
  }
  /** the scene that is on at m and when it came on (outer scene) */
  sceneAt(_k: Kit, m: number): { name: string; m0: number } {
    const s = this.spanAt(m);
    return { name: s.scn, m0: this.onSince(s.scn, m) };
  }
  /** the live scene the anchors come from (the memory once its doorway is mostly open) */
  private anchorScene(): Scn | null {
    if (this.innerName && this.innerP > 0.6) return this.scenes.get(this.innerName) ?? null;
    return this.scenes.get(this.liveName) ?? null;
  }

  // ---------------------------------------------------------------- per frame
  update(k: Kit, m: number) {
    const span = this.spanAt(m);
    const name = span.scn;
    const inner = span.inn && span.inn !== name ? span.inn : '';
    const p = inner ? Math.max(0, Math.min(1, k.num('inP', 0))) : 0;
    const want = new Set<string>([name]);
    if (inner && p > 0.001) want.add(inner);
    // the outer scene can sleep under a fully open doorway (nobody sees it)
    const covered = inner && p >= 0.999;
    if (covered) want.delete(name);
    for (const [n, sc] of this.scenes) sc.root.visible = want.has(n);
    if (name !== this.liveName && k.reduceMotion) this.fadeFrom = this.onSince(name, m);
    this.liveName = name;
    this.innerName = inner;
    this.innerP = p;
    const after = m >= this.pumM;
    // the drops' kicks pump the picture (never in the breaths: the onsets aren't there; never after the cut)
    if (!after) k.cam.punch(0.012 * k.env('kick', m, 0.09, 0.4));
    const outer = this.scenes.get(name) ?? null;
    if (outer && !covered && this.due(name, outer, k, m)) outer.update(k, m, m - this.onSince(name, m));
    // ---- the doorway: the object of the bar opens into the memory (the mask is cleared whenever no doorway uses it:
    // a mask nobody wears would draw as a white shape)
    this.doorRim.clear();
    this.doorMask.clear();
    const inn = inner ? this.scenes.get(inner) ?? null : null;
    if (inn) {
      inn.root.mask = null;
      inn.root.position.set(0, 0);
      inn.root.scale.set(1);
      inn.root.alpha = 1;
      if (p > 0.001) {
        if (this.due(inner, inn, k, m)) inn.update(k, m, m - this.onSince(inner, m));
        if (!covered) this.door(k, outer, inn, k.str('obj', ''), p, m);
      }
    }
    for (const [n, sc] of this.scenes) {
      if (n === inner) continue;
      if (sc.root.mask) sc.root.mask = null;
      if (sc.root.scale.x !== 1 || sc.root.x !== 0 || sc.root.y !== 0 || sc.root.alpha !== 1) {
        sc.root.position.set(0, 0);
        sc.root.scale.set(1);
        sc.root.alpha = 1;
      }
    }
    // ---- post: CRT on the TV present; 1930's film (until the burp's color wave has filled the frame); the hue drift
    const tvLike = name === 'bar' || name === 'pint';
    this.crt.enabled = tvLike && k.quality === 'high' && !inner;
    if (this.crt.enabled) {
      this.crt.time = m * 6;
      this.crt.seed = (Math.floor(m * 24) % 97) / 97;
    }
    const w = name === 'feria' ? this.waveAt : null;
    this.wave.enabled = !!w && w.amt > 0.001;
    if (w && this.wave.enabled) {
      const v = k.view;
      this.wave.set((w.x - v.x) / v.w, (w.y - v.y) / v.h, w.r, w.amt, v.w / v.h);
    }
    const psy = !k.reduceMotion && !after && (name === 'neon' || name === 'cometa' || name === 'espiral' || (name === 'pagina' && k.num('kaleido', 0) > 0.05));
    this.hue.enabled = psy;
    if (psy) {
      // rotation of hue inside the section's palette: a slow drift and a step on every bar
      const bar = Math.floor(m / k.bar);
      const deg = name === 'espiral' ? (m - this.onSince(name, m)) * 220 : Math.sin(m * 0.9) * 14 + ((bar % 4) - 1.5) * 6;
      this.hue.hue(deg, false);
    }
    // ---- reduce motion: every cut is a short fade through the line color (no hue, no kaleidoscope, no spiral)
    const v = k.view;
    this.fade.clear();
    if (k.reduceMotion && this.fadeFrom >= 0) {
      const a = 1 - Math.min(1, (m - this.fadeFrom) / 0.3);
      if (a > 0.01) this.fade.rect(v.x, v.y, v.w, v.h).fill({ color: TV.line, alpha: a * 0.85 });
    }
  }

  /** an on-twos scene draws only on a new beat-step (and always on its first frame, or after a seek) */
  private due(name: string, sc: Scn, k: Kit, m: number) {
    if (!sc.twos) return true;
    const stp = k.beatStep(m);
    if (this.drawnAt.get(name) === stp) return false;
    this.drawnAt.set(name, stp);
    return true;
  }

  /**
   * The doorway at progress p: the object's quad (on screen) grows to the whole frame and the memory grows with it out
   * of the object's size; the object's rim outlines the opening, a little drunk wobble on its corners. Reduced motion:
   * the memory cross-fades in, no growing, no rim.
   */
  private door(k: Kit, outer: Scn | null, inn: Scn, obj: string, p: number, m: number) {
    const v = k.view;
    const full = [v.x - 40, v.y - 40, v.x + v.w + 40, v.y - 40, v.x + v.w + 40, v.y + v.h + 40, v.x - 40, v.y + v.h + 40];
    if (k.reduceMotion) {
      inn.root.alpha = p;
      return;
    }
    const q0 = outer?.portal?.(obj, k) ?? [W / 2 - 160, 440, W / 2 + 160, 440, W / 2 + 160, 640, W / 2 - 160, 640];
    const e = easeInOut(p);
    const wob = (1 - e) * e * 4 * 14;
    const Q = q0.map((a, i) => lerp(a, full[i], e) + Math.sin(m * 9 + i * 1.7) * wob);
    // the memory grows out of the object: from its bounding box to the frame
    const xs = [q0[0], q0[2], q0[4], q0[6]];
    const ys = [q0[1], q0[3], q0[5], q0[7]];
    const bw = Math.max(...xs) - Math.min(...xs);
    const bh = Math.max(...ys) - Math.min(...ys);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const s0 = Math.max(0.05, Math.max(bw / 1920, bh / 1080));
    const s = lerp(s0, 1, e);
    inn.root.scale.set(s);
    inn.root.position.set(lerp(cx, W / 2, e) - (W / 2) * s, lerp(cy, 540, e) - 540 * s);
    this.doorMask.clear().poly(Q).fill(0xffffff);
    inn.root.mask = this.doorMask;
    // the rim (the object's own color), thinning as it opens
    const rim = outer?.rim?.(obj) ?? TV.amberL;
    const wdt = lerp(26, 4, e);
    this.doorRim.poly(Q).stroke({ width: wdt + LW * 2, color: TV.line, join: 'round' }).poly(Q).stroke({ width: wdt, color: rim, join: 'round' });
    // the memory is drawn over the bar (the scene roots sit under the rim, in build order)
    const L = k.layers.world;
    if (outer && L.getChildIndex(inn.root) < L.getChildIndex(outer.root)) {
      const a = L.getChildIndex(inn.root);
      const b = L.getChildIndex(outer.root);
      L.swapChildren(L.getChildAt(a), L.getChildAt(b));
    }
  }

  late(k: Kit, m: number) {
    const span = this.spanAt(m);
    this.scenes.get(span.scn)?.late?.(k, m);
  }

  anchor(name: string, k: Kit): [number, number] | null {
    const sc = this.anchorScene();
    // prompts sit ABOVE his head, never on his face (doc 29 §10); balloons and sparks use the head itself
    if (name === 'canelo') {
      const h = sc?.anchor?.('canelo', k);
      if (h) return [Math.max(k.view.x + 160, Math.min(k.view.x + k.view.w - 160, h[0])), Math.max(k.view.y + 150, h[1] - 210)];
    }
    if (name === 'caneloHead') return sc?.anchor?.('canelo', k) ?? [1250, 380];
    const p = sc?.anchor?.(name, k);
    if (p) return p;
    if (name === 'center') return [W / 2, 640];
    if (name === 'page') return [W / 2, 780];
    if (name === 'canelo') return [1250, 360];
    return null;
  }

  /**
   * Off the clock: draw EVERY scene once with everything in it shown (the front pages, the stamps, the type), and the
   * post filters once — so no texture upload or shader compile lands on a beat (measured: the first front page cost a
   * 375 ms hitch on the drop without this). Through a throwaway wrapper: Pixi turns the container you render() into a
   * render group for good (doc 29 §14.5).
   */
  prewarm(k: Kit) {
    for (const s of this.scenes.values()) s.prewarm?.(k);
    const rt = RenderTexture.create({ width: k.renderer.screen.width, height: k.renderer.screen.height });
    const draw = (c: Container) => {
      const parent = c.parent;
      const at = parent ? parent.getChildIndex(c) : -1;
      const wrap = new Container();
      try {
        wrap.addChild(c);
        wrap.scale.set(k.renderer.screen.width / 1920);
        k.renderer.render({ container: wrap, target: rt, clear: true });
      } catch (e) {
        console.warn('[drunck] warm', e);
      } finally {
        if (parent) parent.addChildAt(c, at);
        else wrap.removeChild(c);
        wrap.destroy();
      }
    };
    const drawShown = (sc: Scn) => {
      const hidden: Container[] = [];
      const show = (c: Container) => {
        if (!c.visible) {
          hidden.push(c);
          c.visible = true;
        }
        for (const ch of c.children) show(ch as Container);
      };
      show(sc.root);
      // a doorway mask once (the stencil path compiles too)
      sc.root.mask = this.doorMask;
      this.doorMask.clear().rect(200, 200, 800, 500).fill(0xffffff);
      draw(sc.root);
      sc.root.mask = null;
      for (const c of hidden) c.visible = false;
    };
    // 1 · every scene as it will REALLY look, once per stretch it is on (its filters set, its masks drawn, its Graphics
    //     filled): the bar's every mode (the trago's bulge, the ink, the TV, the graffiti…), the mug's refraction lens,
    //     the silhouettes, the fair's film — so no shader compile, texture upload or first geometry lands on the clock
    //     (QA measured a 0.7 s freeze on the cut into the mug without this)
    const m0 = k.m;
    for (const [name, sc] of this.scenes) {
      const starts = this.spans.filter((x, i) => (x.scn === name || x.inn === name) && (i === 0 || (this.spans[i - 1].scn !== name && this.spans[i - 1].inn !== name) || x.inn !== this.spans[i - 1].inn));
      for (const sp of starts.slice(0, 14)) {
        const next = this.spans.find((x) => x.m > sp.m + 1e-6);
        const m = Math.min(sp.m + 0.35, next ? (sp.m + next.m) / 2 : sp.m + 0.35);
        k.m = m;
        try {
          const inner = sp.inn === name;
          if (inner) sc.root.mask = this.doorMask;
          sc.update(k, m, m - this.onSince(name, m));
          const wasV = sc.root.visible;
          sc.root.visible = true;
          draw(sc.root);
          sc.root.visible = wasV;
          sc.root.mask = null;
        } catch (e) {
          console.warn('[drunck] warm', name, e);
        }
      }
      drawShown(sc);
    }
    k.m = m0;
    this.waveAt = null;
    this.drawnAt.clear();
    this.doorMask.clear();
    // the post filters (hue drift, CRT, color wave): compile them now
    const sp = new Sprite(Texture.WHITE);
    sp.setSize(64, 36);
    const was = this.post.filters.map((f) => f.enabled);
    for (const f of this.post.filters) f.enabled = true;
    sp.filters = this.post.filters;
    draw(sp);
    sp.filters = [];
    this.post.filters.forEach((f, i) => (f.enabled = was[i]));
    sp.destroy();
    rt.destroy(true);
  }

  destroy() {
    for (const s of this.scenes.values()) s.destroy?.();
    for (const st of Object.values(this.studios)) st.dispose();
    this.hue.destroy();
    this.crt.destroy();
    this.wave.destroy();
  }
}

export default function createStage(k: Kit): StageApi {
  return new DrunckStage(k);
}
