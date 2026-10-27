/**
 * F25 · PC DISTOR «Datamosh» (H88, closes Esquirla's battle) — fragment c25 → end. DATAMOSH over the Library's
 * Victorian watercolour: compression blocks, pixels dragged by the previous frame's motion, colours melting from one
 * tale into the next — the spill made picture; the digital eats the drawn. The glitch follows the DISTORTION'S
 * EXPOSURE (strongest when the drums drop out: c25–29, c45–53), not a rise; it breaks on the shift of c65,875.
 *   c25  Esquirla, high on a shelf, grabs Cerito's trail of static with her glitch arm (the open book shows blocks)
 *   c29  the school of magic melts into Sherlock's London (Harry Gatter: «¡Mi capítulo!»); Garbancito begs; «Mejor.»
 *   c39  her lantern held high: where the blue cone touches, the watercolour comes back
 *   c41  Brecha faces Esquirla: «Una caja rota no libera a nadie, Esqui. Lo derrama.» / «Entonces que se derrame todo.»
 *   c45  (map given in H87) Brecha sprays BASTA, the letters hold the glitch like a wall · (no map) Bisagra plants herself
 *        as a door; her light reaches Cerito and his static calms inside the arm
 *   c53  the glitch wins; Esquirla tears the wall open — stage lights and confetti: POP; Canelo's flame drops
 *   c65  a frozen frame of the whole Library (drums only) · c65,875 THE SHIFT: the screen splits in two halves out of
 *        sync — the box splits along the gutter; Cerito slips out of her arm and runs down the gutter to the light;
 *        Esquirla jumps through the tear; half the Disruptors follow
 *   c69  pages fall like snow; Brecha on this side, Esquirla beyond the closing tear; Cerito curls into the beam; the
 *        halves resync, slowly; the tear becomes a seam (a cat-flap to POP)
 * Reduce motion: the split becomes a cross-fade. Reduce flashes: nothing blinks, the blocks glide.
 * Guion: historia-v2/guiones/acto-3/h88-la-ruptura.md (D1–D24). Film time t = (bar − 25) × 2.1429 s.
 */
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import type { FilmSet, FrameInfo, SceneCtx, SetModule } from '../../../stage';
import { BIG_AREA, moshFilter, setMosh } from '../../../styles/libros';
import { Beam, BookFrame, DS_BEAT, env, esquirlaFigure, f25, flame, FLAME, garbancito, glowSprite, lanternAt, LB, luzOf, bob, Printed, rnd, seg, sm, StaticKitten, STAND, tailTip, word, wob, type EsquirlaRig, type LuzRig, prewarm } from '../kit';

const T = f25;
const SHIFT = T(65.875);
const FREEZE = T(65);
const LAG = DS_BEAT * 0.5;
const CY = 0x58f0ff;
const MG = 0xff3ad0;

/** the distortion's exposure (MÚSICA distor.md §2.1): strongest with the drums out, a held page behind the wall */
export function moshAt(t: number): number {
  if (t < T(29)) return 0.71;
  if (t < T(41)) return 0.32 + 0.1 * Math.sin(t * 0.7);
  if (t < T(45)) return 0.5;
  if (t < T(53)) return 0.8;
  if (t < FREEZE) return 1;
  if (t < SHIFT) return 0.6;
  return Math.max(0.04, 0.55 * (1 - seg(t, SHIFT, T(81))));
}

/** a tale plate (full frame, watercolour): the school of magic or Sherlock's London */
function tale(ctx: SceneCtx, which: 'colegio' | 'londres'): Texture {
  const c = new Container();
  const g = new Graphics();
  if (which === 'colegio') {
    g.rect(0, 0, 1920, 1080).fill(0x3a4a6a);
    for (let i = 0; i < 80; i++) g.circle(rnd(i) * 1920, rnd(i + 4) * 500, 1.5 + rnd(i + 2) * 2).fill(0xf0e8c8);
    g.circle(1500, 180, 70).fill(0xf0ead0);
    // the castle: towers with pointed roofs, lit windows, the lake
    g.rect(0, 760, 1920, 320).fill(0x2a3a52);
    for (let i = 0; i < 7; i++) {
      const x = 300 + i * 200;
      const h = 300 + ((i * 97) % 220);
      g.rect(x, 760 - h, 110, h).fill(0x4a4a5a).stroke({ width: 3, color: LB.sepia });
      g.poly([x - 16, 760 - h, x + 55, 760 - h - 150, x + 126, 760 - h]).fill(0x5a3a4a).stroke({ width: 3, color: LB.sepia });
      for (let j = 0; j < 4; j++) g.rect(x + 40, 790 - h + j * 70, 26, 40).fill(0xf0c060);
    }
    // floating candles
    for (let i = 0; i < 12; i++) g.rect(200 + i * 140, 300 + (i % 3) * 40, 10, 40).fill(0xf0e8d8).circle(205 + i * 140, 292 + (i % 3) * 40, 6).fill(0xffc860);
  } else {
    g.rect(0, 0, 1920, 1080).fill(0x8a8a82);
    for (let i = 0; i < 6; i++) g.rect(0, i * 120, 1920, 120).fill({ color: 0xb8b4a8, alpha: 0.1 * i });
    // the clock tower, roofs and chimneys, gas lamps, a deerstalker silhouette in the fog
    g.rect(1300, 160, 180, 700).fill(0x5a5048).stroke({ width: 3, color: LB.sepia });
    g.poly([1280, 160, 1390, 20, 1500, 160]).fill(0x4a4038);
    g.circle(1390, 260, 66).fill(0xe8e0c8).stroke({ width: 4, color: LB.sepia });
    g.moveTo(1390, 260).lineTo(1390, 214).stroke({ width: 4, color: LB.sepia }).moveTo(1390, 260).lineTo(1424, 272).stroke({ width: 4, color: LB.sepia });
    for (let i = 0; i < 9; i++) {
      const x = i * 160;
      g.poly([x, 860, x, 560 - (i % 3) * 40, x + 80, 500 - (i % 3) * 40, x + 160, 560 - (i % 3) * 40, x + 160, 860]).fill(0x6a5a50).stroke({ width: 3, color: LB.sepia });
      g.rect(x + 100, 460 - (i % 3) * 40, 24, 70).fill(0x4a3a32);
    }
    g.rect(0, 860, 1920, 220).fill(0x4a4a46);
    for (const x of [300, 900, 1700]) g.rect(x, 600, 10, 260).fill(0x2a2a2a).circle(x + 5, 590, 22).fill({ color: 0xffd890, alpha: 0.9 });
    g.poly([620, 860, 640, 700, 700, 680, 760, 700, 780, 860]).fill(0x2a2422);
    g.ellipse(700, 670, 60, 20).fill(0x3a3230).poly([650, 670, 700, 620, 750, 670]).fill(0x3a3230);
  }
  c.addChild(g);
  const r = ctx.baker.raster(c, { res: 0.6, frame: undefined });
  return r.tex;
}

/** one complete copy of the Library world (the split needs two, out of sync) */
class World extends Container {
  readonly bg = new Container();
  readonly taleA: Sprite;
  readonly taleB: Sprite;
  readonly esq: EsquirlaRig;
  readonly cer: StaticKitten;
  readonly gar: Container;
  readonly harry: Container;
  readonly brecha: Container | null;
  readonly bisagra: Container | null;
  readonly luz: LuzRig;
  readonly can: Container | null;
  readonly beam: Beam;
  readonly fl = new Graphics();
  readonly basta = new Container();
  readonly bastaLetters: Sprite[] = [];
  readonly tear = new Graphics();
  readonly confetti = new Graphics();
  readonly snow = new Graphics();
  readonly words: Printed[] = [];
  readonly disr: Sprite[] = [];
  private lamp: Sprite;
  constructor(
    private ctx: SceneCtx,
    tA: Texture,
    tB: Texture,
    private withMap: boolean,
  ) {
    super();
    const g = new Graphics();
    // the forbidden section: tall shelves, chains, the high gallery, a ladder
    g.rect(-300, -300, 2520, 1700).fill(0xb8a078);
    for (let i = 0; i < 9; i++) {
      const x = -260 + i * 280;
      g.rect(x, -120, 240, 1000).fill(0x8a6a42).stroke({ width: 3, color: LB.sepia });
      for (let r = 0; r < 6; r++) for (let j = 0; j < 9; j++) g.rect(x + 12 + j * 25, -90 + r * 150, 18, 120).fill([0x8a3a2a, 0x3a5a6a, 0x6a6a3a, 0x9a7a3a, 0x5a3a5a][(i + r * 2 + j) % 5]);
      for (let k = 0; k < 10; k++) g.ellipse(x + 12 + k * 24, 300 + Math.sin(k * 0.6) * 10, 12, 7).stroke({ width: 4, color: 0x5a5a62 });
    }
    g.rect(-300, 380, 2520, 30).fill(0x6a4a2a).stroke({ width: 3, color: LB.sepia });
    g.rect(1180, 380, 14, 520).fill(0x6a4a2a).rect(1270, 380, 14, 520).fill(0x6a4a2a);
    for (let k = 0; k < 9; k++) g.rect(1180, 430 + k * 56, 104, 8).fill(0x6a4a2a);
    g.rect(-300, 900, 2520, 600).fill(0xa08860);
    this.bg.addChild(g);
    // a block of book text printed on the page (the words that leave their lines at the shift)
    for (let i = 0; i < 5; i++) {
      const w = new Printed(ctx.k, 'print', ['Había una vez una caja que', 'guardaba un cuento entero,', 'con su principio y su final,', 'y nadie la abría', 'sin pedir permiso.'][i], { size: 34, fill: LB.sepia });
      w.position.set(140, 470 + i * 50);
      w.update(1, 0.7);
      this.words.push(w);
      this.bg.addChild(w);
    }
    this.addChild(this.bg);
    // the tales (D3–D4): A full frame, then melting into B
    this.taleA = new Sprite(tA);
    this.taleA.setSize(1920, 1080);
    this.taleB = new Sprite(tB);
    this.taleB.setSize(1920, 1080);
    this.addChild(this.taleA, this.taleB);
    // the tear to POP (behind the cast)
    this.addChild(this.tear, this.confetti);
    // the cast
    this.esq = esquirlaFigure(ctx, 300, 'libros');
    this.cer = new StaticKitten(ctx, 110, STAND.cerito);
    this.gar = garbancito(ctx, 60, 'libros').root;
    const h = new Container();
    // Harry Gatter: his painting wears his own round glasses (the stand-in's code-drawn ones are gone)
    const ha = ctx.actorAs('libros', STAND.harry, 300);
    if (ha) h.addChild(ha);
    this.harry = h;
    this.brecha = ctx.actorAs('libros', STAND.brecha, 250);
    this.bisagra = ctx.actorAs('libros', STAND.bisagra, 280);
    this.luz = luzOf(ctx, 290, 'libros');
    this.can = ctx.actorAs('libros', ctx.canelo, 230);
    this.beam = new Beam(ctx);
    this.lamp = glowSprite(ctx, LB.lantern, 1.2);
    for (let i = 0; i < 4; i++) {
      const s = ctx.silhouette(STAND.brecha, 0.5, 1);
      if (s) {
        s.scale.set(140 / s.texture.height);
        s.tint = 0x2a1a2a;
        this.disr.push(s);
      }
    }
    // BASTA (spray) — or Bisagra, a door
    'BASTA'.split('').forEach((ch, i) => {
      const s = word(ctx.k, ch, { fontFamily: 'Bebas Neue', fontSize: 300, fill: 0xd8282a, stroke: { color: 0x2a0806, width: 10 } });
      s.position.set(i * 170, 0);
      this.bastaLetters.push(s);
      this.basta.addChild(s);
    });
    this.basta.position.set(880, 640);
    this.basta.rotation = -0.06;
    for (const s of this.disr) this.addChild(s);
    this.addChild(this.esq.root, this.gar, this.harry, this.cer);
    if (this.brecha) this.addChild(this.brecha);
    if (this.bisagra) this.addChild(this.bisagra);
    if (this.can) this.addChild(this.can);
    if (this.luz.actor) this.addChild(this.luz.actor);
    this.addChild(this.beam, this.lamp, this.fl, this.basta, this.snow);
  }
  /** the whole world at film time t (pure in t) */
  update(t: number, f: FrameInfo) {
    const rm = f.rm;
    const rf = f.rf;
    const ctx = this.ctx;
    const step = Math.floor(t * 12);
    // ---- the tales (c29 → c39): A shows, melts into B (the shader takes B's colours), then B; then back to the Library
    const taleOn = t >= T(29) && t < T(35);
    this.taleA.visible = taleOn && t < T(31.5);
    this.taleB.visible = taleOn && t >= T(31.5);
    // ---- Esquirla on the high shelf (pulled toward the tear later; she jumps at the shift)
    const jump = seg(t, T(67), T(68.6));
    const ex = 1450 + (t > T(57) ? sm(seg(t, T(57), T(59))) * 120 : 0) + jump * 380;
    const ey = 380 - Math.sin(jump * Math.PI) * 160;
    this.esq.root.position.set(ex, ey);
    this.esq.root.visible = jump < 0.98 && !taleOn;
    this.esq.actor?.pose(t, 0, 0, { flip: true });
    // Cerito: tangled in her arm until the shift; then free, down the gutter to the light (D19)
    const free = seg(t, SHIFT + 0.6, T(67.5));
    const held: [number, number] = [ex - 230, ey + 40 + (rm ? 0 : Math.sin(t * 7) * 10)];
    const twist = ctx.k.judged('sueltalo') && t > T(43) && t < SHIFT ? 1.8 : 1;
    const cx = held[0] + (960 - held[0]) * sm(seg(free, 0, 0.4)) + (free > 0.4 ? (-260 * sm(seg(free, 0.4, 1))) : 0);
    const cyy = held[1] + (900 - held[1]) * sm(seg(free, 0, 0.4));
    this.cer.position.set(cx, cyy);
    this.cer.rotation = free > 0 || rm ? 0 : Math.sin(t * 9 * twist) * 0.12 * twist;
    // her light calms him (c49), the free run (c66) into the beam; resting in it at the end
    const calm = t > T(49) ? 0.5 : 0;
    this.cer.update(t, { stare: 0.9, clear: Math.max(calm, free * 0.6), fray: t < T(29) ? 0.4 : 0 });
    this.cer.visible = !taleOn;
    const reach: [number, number] = [held[0] + 230 - ex, held[1] - ey];
    this.esq.reach(rf ? Math.floor(t) : t, free > 0.05 ? [reach[0] + 60, reach[1] - 60] : reach, free > 0.05 ? 1 - free : 1);
    // ---- Garbancito on a low shelf, begging (D5); then on Brecha's side (D22)
    this.gar.visible = !taleOn && t > T(34.5);
    this.gar.position.set(t > T(69) ? 520 : 1120, t > T(69) ? 900 : 380);
    this.gar.scale.set(t > T(69) ? 1.2 : 1);
    // ---- Harry Gatter, half-melted inside the detective page (D4)
    this.harry.visible = taleOn && t > T(32.5);
    this.harry.position.set(1100, 900);
    this.harry.skew.x = rm ? 0 : Math.sin(t * 3) * 0.08;
    // ---- Brecha (or Bisagra) — D8 on the shelf; D11 the wall / the door; D22 on this side
    const bOn = t > T(40.6) && !taleOn;
    if (this.brecha) {
      this.brecha.visible = bOn && (this.withMap || t < T(45) || t > T(69));
      const bx = t < T(45) ? 1160 : t < T(69) ? 760 : 400;
      const by = t < T(45) ? 380 : 900;
      (this.brecha as unknown as { pose: (m: number, x: number, y: number, o?: object) => void }).pose(t, bx, by, { flip: t < T(45) });
    }
    if (this.bisagra) {
      this.bisagra.visible = !this.withMap && t > T(45) && t < T(56);
      (this.bisagra as unknown as { pose: (m: number, x: number, y: number, o?: object) => void }).pose(t, 860, 900, {});
      this.bisagra.scale.set(1.25, 1.25 * (1 - sm(seg(t, T(53), T(55))) * 0.4));
    }
    // BASTA, letter by letter (c45 → c46.5); bigger with the tap; it gives way at c53
    const bastaOn = this.withMap && t > T(45) && t < T(55);
    this.basta.visible = bastaOn && !taleOn;
    const big = ctx.k.judged('basta') ? 1.15 : 1;
    this.bastaLetters.forEach((s, i) => {
      const k = seg(t, T(45) + i * 0.25, T(45) + i * 0.25 + 0.3);
      s.alpha = k * (1 - sm(seg(t, T(53), T(54.5))));
      s.scale.set(big * (rm ? 1 : 0.9 + 0.1 * k), big);
      s.y = t > T(53) ? sm(seg(t, T(53), T(55))) * (60 + i * 30) : 0;
    });
    // ---- Luzterna and Canelo arrive (D7, c39); her light reaches Cerito (D13); she takes him in at the end (D23)
    const lzOn = t > T(38.6) && !taleOn;
    const lzIn = sm(seg(t, T(38.6), T(40.4)));
    const lx = 2100 - lzIn * 1000 - (t > T(69) ? 200 : 0);
    const ly = 620;
    this.luz.actor && (this.luz.actor.visible = lzOn);
    this.luz.actor?.pose(t, lx + bob(t, rm), ly + bob(t + 1, rm, 8), { flip: true });
    const L = lanternAt(this.luz);
    this.lamp.visible = lzOn;
    this.lamp.position.set(L[0], L[1]);
    this.lamp.alpha = 0.6 + (rm ? 0 : 0.05 * wob(t * 6, 2));
    let to: [number, number] = [L[0] - 300, L[1] + 120];
    if (t > T(49) && t < SHIFT) to = [this.cer.x, this.cer.y - 50];
    if (t >= SHIFT) to = [this.cer.x, this.cer.y - 40];
    this.beam.set(L, to, 120, lzOn ? 0.85 : 0);
    if (this.can) {
      this.can.visible = lzOn;
      (this.can as unknown as { pose: (m: number, x: number, y: number, o?: object) => void }).pose(t, lx + 160, 900, { flip: true });
    }
    const tip = tailTip(this.can as never);
    this.fl.clear();
    // D16: the flame drops with the tear (c61 → 65), and stays low
    const drop = sm(seg(t, T(61), T(64)));
    if (tip && lzOn) flame(this.fl, tip[0], tip[1], FLAME.sesenta * (1 - drop * 0.5), t, { rm, line: 0x6a2a0a });
    // ---- the tear to POP (c57 → open; c80 → a seam)
    const open = sm(seg(t, T(57), T(59))) * (1 - sm(seg(t, T(78), T(80.5))));
    const tg = this.tear.clear();
    const cg = this.confetti.clear();
    if (open > 0.01 || t > T(78.5)) {
      const W = 140 * open;
      const pts: number[] = [];
      for (let i = 0; i <= 12; i++) pts.push(1720 + (rnd(i) - 0.5) * 60 - W, 80 + i * 70);
      for (let i = 12; i >= 0; i--) pts.push(1720 + (rnd(i + 5) - 0.5) * 60 + W, 80 + i * 70);
      if (open > 0.01) {
        tg.poly(pts).fill(0x1a0a2a);
        // stage lights through the rip
        tg.poly([1720, 80, 1720 - W * 3, 900, 1720 + W * 3, 900]).fill({ color: 0xff7ad0, alpha: 0.15 * open });
        for (let i = 0; i < 26; i++) {
          const ph = (t * 0.4 + rnd(i)) % 1;
          cg.rect(1720 + (rnd(i * 3) - 0.5) * W * 2.2, 80 + ph * 840, 10, 16).fill([0xff3ad0, 0x58f0ff, 0xfff050, 0xff8a2a][i % 4]);
        }
      }
      // the seam it leaves, with a small cat-flap drawn on it (D24)
      if (t > T(78.5)) {
        const k = seg(t, T(78.5), T(80.5));
        tg.moveTo(1720, 80).lineTo(1720, 920).stroke({ width: 4, color: LB.sepia, alpha: k });
        tg.roundRect(1680, 800, 80, 100, 30).stroke({ width: 4, color: LB.sepia, alpha: k });
      }
    }
    // half the Disruptors follow her through the rip (D20)
    this.disr.forEach((s, i) => {
      const k = seg(t, T(67) + i * 0.3, T(68.8) + i * 0.3);
      s.visible = t > T(62) && k < 1 && !taleOn;
      s.position.set(1300 + i * 70 + k * (1720 - 1300 - i * 70), 900 - Math.sin(k * Math.PI) * 100);
      s.alpha = 1 - sm(seg(k, 0.8, 1));
    });
    // pages fall like snow (c69 →)
    const sg = this.snow.clear();
    if (t > T(69)) {
      const a = sm(seg(t, T(69), T(70)));
      for (let i = 0; i < 40; i++) {
        const ph = ((t - T(69)) * (rm ? 0.05 : 0.09) + rnd(i)) % 1;
        const x = rnd(i * 7) * 1920 + Math.sin(ph * 6 + i) * 40;
        const y = -60 + ph * 1200;
        const r = rm ? 0 : ph * 6 + i;
        const c = Math.cos(r);
        const s2 = Math.sin(r);
        sg.poly([x - 26 * c, y - 26 * s2, x + 26 * s2, y - 18 * c, x + 26 * c, y + 26 * s2, x - 26 * s2, y + 18 * c]).fill({ color: LB.paper, alpha: 0.9 * a });
      }
    }
    // the words leave their lines at the shift
    this.words.forEach((w, i) => {
      const k = sm(seg(t, SHIFT, SHIFT + 1.2)) * (1 - sm(seg(t, T(76), T(81))));
      w.x = 140 + (rm ? 0 : k * (i % 2 ? 60 : -40));
      w.y = 470 + i * 50 + (rm ? 0 : k * (rnd(i) - 0.5) * 70);
      w.rotation = rm ? 0 : k * (rnd(i + 3) - 0.5) * 0.2;
    });
    void step;
    void CY;
    void MG;
  }
}

const mod: SetModule = {
  cats: ({ canelo }) => [
    { slug: canelo, bake: 'libros' },
    { slug: 'luzterna', bake: 'libros' },
    STAND.cerito,
    { slug: STAND.esquirla, bake: 'libros' },
    { slug: STAND.garbancito, bake: 'libros' },
    { slug: STAND.harry, bake: 'libros' },
    { slug: STAND.brecha, bake: 'libros' },
    { slug: STAND.bisagra, bake: 'libros' },
    STAND.brecha,
  ],
  async build(ctx: SceneCtx): Promise<FilmSet> {
    const withMap = ctx.film.id !== 'f25_bisagra';
    const tA = tale(ctx, 'colegio');
    const tB = tale(ctx, 'londres');
    const host = new Container();
    host.filterArea = BIG_AREA();
    const A = new World(ctx, tA, tB, withMap);
    const B = new World(ctx, tA, tB, withMap);
    const mA = new Graphics();
    const mB = new Graphics();
    // the open book, inside the moshed host: it corrupts with the page, and splits along its gutter at the shift
    const book = new BookFrame(ctx, { head: 'Ex Libris', title: 'La sección prohibida', folio: 302 });
    host.addChild(A, B, mA, mB, book);
    const mosh = moshFilter(tB);
    host.filters = [mosh];
    ctx.plane(host, { z: 1000 });
    // lines (calm, unmoshed: always readable)
    const L = {
      harry: new Printed(ctx.k, 'harry', '¡Mi capítulo!', { size: 60, align: 0.5, plate: LB.paper }),
      gar: new Printed(ctx.k, 'garbancito', '¡Esquirla, para! ¡A mí ya se me perdió el final!', { size: 30, align: 0.5, plate: LB.paper, w: 700 }),
      esq1: new Printed(ctx.k, 'esquirla', 'Mejor. Así nadie te lo escribe.', { size: 50, align: 0.5, plate: 0xf0f0f4, w: 1000 }),
      brecha: new Printed(ctx.k, 'brecha', 'Una caja rota no libera a nadie, Esqui. Lo derrama.', { size: 50, align: 0.5, plate: LB.paper, w: 1100 }),
      esq2: new Printed(ctx.k, 'esquirla', 'Entonces que se derrame todo.', { size: 54, align: 0.5, plate: 0xf0f0f4, w: 1000 }),
    };
    L.harry.position.set(1100, 260);
    L.gar.position.set(1000, 190);
    L.esq1.position.set(1300, 150);
    L.brecha.position.set(900, 150);
    L.esq2.position.set(1300, 150);
    const ui = new Container();
    for (const p of Object.values(L)) ui.addChild(p);
    ctx.plane(ui, { z: 0, screen: true });
    prewarm(ctx, host, ui);
    return {
      update(lt, f) {
        const rm = f.rm;
        const t = lt;
        // the frozen frame (c65 → c65,875): the picture stops on c65; only the drums play
        const tt = t >= FREEZE && t < SHIFT ? FREEZE : t;
        // out of sync from the shift: the right half lives half a beat late, and slips; they resync by c81
        const syncing = 1 - sm(seg(t, T(73), T(81)));
        const split = t >= SHIFT ? syncing : 0;
        const lag = LAG * split;
        A.update(tt, f);
        const showB = split > 0.001;
        B.visible = showB;
        if (showB) B.update(Math.max(0, tt - lag), f);
        const sx = split * (rm ? 0 : 24);
        const sy = split * (rm ? 0 : 36);
        mA.clear();
        mB.clear();
        if (showB && !rm) {
          mA.rect(-400, -400, 1360, 1880).fill(0xffffff);
          mB.rect(960, -400, 1360, 1880).fill(0xffffff);
          A.mask = mA;
          B.mask = mB;
          A.position.set(-sx, 0);
          B.position.set(sx, sy);
          B.alpha = 1;
        } else {
          A.mask = null;
          B.mask = null;
          A.position.set(0, 0);
          B.position.set(0, 0);
          // «Reducir movimiento»: a cross-fade of the two halves instead of the split
          B.alpha = showB ? 0.5 * split : 0;
        }
        book.set({ open: 1, split: split * (rm ? 0 : 60), gutter: 0.55 });
        // the glitch: exposure-driven; her light cleans where it falls; BASTA holds it like a wall
        const Lp = lanternAt(A.luz);
        const lightOn = t > T(39) && t < T(65);
        const wall = A.basta.visible ? 1 : !A.basta.visible && A.bisagra?.visible ? 0.8 : 0;
        setMosh(mosh, {
          t: tt,
          amt: moshAt(t),
          block: t < T(29) ? 22 : 16,
          flow: t >= SHIFT ? [0.2, 1] : [1, 0.25],
          melt: t >= T(29) && t < T(35) ? sm(seg(t, T(29.5), T(31.5))) * (1 - sm(seg(t, T(31.5), T(32.5)))) : 0,
          slide: f.rf,
          px: ctx.k.renderer.width / Math.max(1, ctx.k.view.w),
          clean: lightOn ? [(Lp[0] + (t > T(49) ? A.cer.x : Lp[0] - 300)) / 2, (Lp[1] + (t > T(49) ? A.cer.y : Lp[1] + 120)) / 2, 340, 0.85] : [0, 0, 1, 0],
          wall: [wall ? 860 : 0, wall * 0.85],
        });
        L.harry.update(seg(t, T(33), T(33.5)), env(t, T(33), T(34.6), 0.1, 0.3));
        L.gar.update(seg(t, T(35), T(36.4)), env(t, T(35), T(37.4), 0.1, 0.3));
        L.esq1.update(seg(t, T(37.5), T(38.4)), env(t, T(37.5), T(39.2), 0.1, 0.3), t);
        L.brecha.update(seg(t, T(41), T(42.6)), env(t, T(41), T(43), 0.1, 0.3));
        L.esq2.update(seg(t, T(43), T(43.8)), env(t, T(43), T(45), 0.1, 0.3), t);
      },
      filters: [mosh],
      anchor: (n) => (n === 'cerito' ? [A.cer.x, A.cer.y - 60] : n === 'muro' ? [1100, 640] : null),
    };
  },
};
export default mod;
