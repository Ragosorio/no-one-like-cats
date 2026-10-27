/**
 * F23 · PC No wey «El expediente» (H87, closes the Correctors' battle) — complete, + the bridge into DISTOR.
 * ONE-COLOUR INK NOIR (ink and wash, cold greys): the only colour is her lantern's warm cone. The Correctors read the
 * CREW's dossier: each charge drops as a white typewritten card pasted over the noir, the memory inside it in the same
 * noir with her light as the only colour, and «Culpable.» in her hand. Five charges are hers, things of THIS adventure
 * (H67, H73, H78, H85, H82) [Q6]; the sixth falls on CANELO («ROMPER EL REINICIO»; he writes «Culpable.» himself) and
 * from c45 they stand side by side at the front of the line [S3]. La Mano raises her paw at c33 and lowers it on the
 * late kick (c33,35): «La luz no se deja apagar. Entonces, los ojos.» + a drawn eye, and she looks at CANELO [Q1, R5].
 * The dossier sinks open on Canelo's card: the stamp «SENTENCIA: LOS OJOS» falls on his photo [R5]. It is the crew's
 * trial and Canelo's sentence — not her apotheosis: no halo, no rays from above, nothing about her body.
 * Screen: the open book until c29, when her light burns the gutter and the picture goes full bleed.
 * The tail (segue to no_wey.puente at c65): DISTOR's 808 creeps in under the last note; a puddle's reflection of
 * «NO, WEY.» flickers with interference; a broken monitor on another page: Esquirla watching; off; black.
 * Guion: historia-v2/guiones/acto-3/h87-no-wey.md (N1–N42). Bars: c1 = 0 s, 74 BPM (kit nw()).
 */
import { Container, Graphics, Sprite, TilingSprite, type Texture } from 'pixi.js';
import type { FilmSet, FrameInfo, SceneCtx, SetModule } from '../../../stage';
import type { PostLook } from '../../../post';
import { Beam, BookFrame, env, esquirlaFigure, flame, FLAME, glowSprite, kitTex, LB, luzOf, bob, lanternAt, manoFigure, nw, NW_BEAT, Printed, rnd, seg, sm, StaticKitten, STAND, tailTip, word, wob, inkLine, partial, manoHand, prewarm } from '../kit';
import { CARGOS, EXPEDIENTE, RENUNCIA, SENTENCIA } from '../textos';
import { STANDINS } from '../../../standins';

const WARM = 0xffb860;
const PAPER = 0xf4f1ea;
const INK = 0x0a0a0c;
/** bar → song seconds (c1 = 0) */
const c = nw;
/** the clap beats of c9–17 (beats 2 and 4 of each bar) */
const CLAPS: number[] = [];
for (let b = 9; b < 17; b++) CLAPS.push(c(b) + NW_BEAT, c(b) + NW_BEAT * 3);

/** a white ship of the Correctors (plan-perfect, numbered), its cannon on a pivot */
class WhiteShip extends Container {
  readonly hull = new Graphics();
  readonly cannon = new Graphics();
  readonly muzzle: [number, number];
  constructor(s: number) {
    super();
    const h = this.hull;
    h.poly([-150 * s, 0, 150 * s, 0, 120 * s, 50 * s, -120 * s, 50 * s]).fill(0xf2f2f0).stroke({ width: 3, color: 0x6a6e76 });
    h.rect(-4 * s, -200 * s, 8 * s, 200 * s).fill(0xd8dadc);
    h.poly([4 * s, -190 * s, 110 * s, -60 * s, 4 * s, -40 * s]).fill(0xfafaf8).stroke({ width: 2, color: 0x8a8e96 });
    h.poly([-4 * s, -170 * s, -90 * s, -60 * s, -4 * s, -50 * s]).fill(0xfafaf8).stroke({ width: 2, color: 0x8a8e96 });
    this.cannon.roundRect(0, -8 * s, 70 * s, 16 * s, 6 * s).fill(0xe8e8e6).stroke({ width: 2, color: 0x6a6e76 });
    this.cannon.position.set(-100 * s, -6 * s);
    this.muzzle = [-100 * s, -6 * s];
    this.addChild(h, this.cannon);
  }
}

/** a typewritten CHARGE card (white) with a memory window and room for «Culpable.» */
class Ficha extends Container {
  readonly memory = new Container();
  readonly win: [number, number, number, number];
  private typed: Printed;
  readonly guilty: Printed;
  constructor(ctx: SceneCtx, text: string, guilty: string, o: { who?: 'luz' | 'canelo'; noWindow?: boolean } = {}) {
    super();
    const W = 760;
    const H = o.noWindow ? 200 : 560;
    const g = new Graphics();
    g.rect(-W / 2 + 10, -H / 2 + 14, W, H).fill({ color: 0x000000, alpha: 0.45 });
    g.rect(-W / 2, -H / 2, W, H).fill(PAPER).stroke({ width: 2, color: 0x9a9a9a });
    // the card's printed lines and the punched corner
    g.rect(-W / 2 + 24, -H / 2 + 108, W - 48, 2).fill({ color: 0x9aa4b4, alpha: 0.8 });
    g.circle(W / 2 - 30, -H / 2 + 30, 10).fill(0x2a2a2a);
    this.addChild(g);
    this.typed = new Printed(ctx.k, 'typed', text, { size: 30, w: W - 60, fill: 0x1a1a1a });
    this.typed.position.set(-W / 2 + 28, -H / 2 + 22);
    this.addChild(this.typed);
    this.win = [-W / 2 + 30, -H / 2 + 124, W - 60, 300];
    const frame = new Graphics();
    if (!o.noWindow) frame.rect(this.win[0], this.win[1], this.win[2], this.win[3]).fill(0x101012);
    const mask = new Graphics().rect(this.win[0], this.win[1], this.win[2], this.win[3]).fill(0xffffff);
    this.memory.mask = mask;
    this.addChild(frame, this.memory, mask);
    this.guilty = new Printed(ctx.k, o.who === 'canelo' ? 'canelo' : 'luz', guilty, { size: o.who === 'canelo' ? 62 : guilty.length > 14 ? 44 : 58, w: W - 60, fill: o.who === 'canelo' ? 0x2a1a0e : LB.pen });
    this.guilty.position.set(-W / 2 + 40, H / 2 - 104);
    this.guilty.rotation = -0.03;
    this.addChild(this.guilty);
  }
  /** t = seconds since the card fell; type for `typeDur`, the hand at `handAt` (relative), out at `out` */
  private baseY: number | null = null;
  update(t: number, o: { typeDur?: number; handAt: number; out: number; rm?: boolean }) {
    this.baseY ??= this.y;
    const fall = sm(t / 0.35);
    this.visible = t > 0 && t < o.out + 0.4;
    if (!this.visible) return;
    const leave = sm(seg(t, o.out, o.out + 0.35));
    this.alpha = Math.min(fall, 1 - leave);
    this.y = this.baseY + (o.rm ? 0 : -(1 - fall) * 160 + leave * 120);
    this.rotation = o.rm ? -0.02 : -0.02 + (1 - fall) * 0.12;
    this.typed.update(seg(t, 0.3, 0.3 + (o.typeDur ?? 1.6)));
    this.guilty.update(seg(t, o.handAt, o.handAt + 0.7));
  }
}

const CREW = [STAND.hipolito, STAND.murciegato, STAND.aranya, STANDINS.ito, STANDINS.borron];

const mod: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', STAND.cerito, ...CREW, { slug: STAND.mano, bake: 'tinta' }, { slug: STAND.esquirla, bake: 'senal' }, { slug: 'canelo_cozy_cat', bake: 'tinta' }],
  async build(ctx: SceneCtx): Promise<FilmSet> {
    return muelle(ctx);
  },
};
export default mod;

/** a small noir memory composition inside a card window (built once) */
function memoryOf(ctx: SceneCtx, which: number, win: [number, number, number, number]): { root: Container; update: (t: number, f: FrameInfo) => void; look?: (t: number) => Partial<PostLook> | null } {
  const root = new Container();
  const [x0, y0, w, h] = win;
  const bg = new Graphics();
  const cx = x0 + w / 2;
  const floor = y0 + h - 30;
  const beam = new Beam(ctx, WARM);
  if (which === 1) {
    // H67: the street of La Última Ronda; she lifts him by the scarf like a leash, he zigzags
    bg.rect(x0, y0, w, h).fill(0x1a1a1e);
    bg.rect(x0 + 30, y0 + 20, 220, 200).fill(0x2a2a30).rect(x0 + 60, y0 + 40, 160, 40).fill(0x4a4a50);
    bg.rect(x0, floor, w, 40).fill(0x2a2a2e);
    root.addChild(bg);
    const sign = word(ctx.k, 'LA ÚLTIMA RONDA', { fontFamily: 'Bebas Neue', fontSize: 26, fill: 0xd8d8d8, letterSpacing: 3 });
    sign.position.set(x0 + 140, y0 + 60);
    root.addChild(sign);
    const can = ctx.actor(ctx.canelo, 150);
    const luz = luzOf(ctx, 170);
    const scarf = new Graphics();
    if (can) root.addChild(can);
    if (luz.actor) root.addChild(luz.actor);
    root.addChild(scarf, beam);
    return {
      root,
      update(t, f) {
        const zig = f.rm ? 0 : Math.sin(t * 3) * 30;
        can?.pose(t, cx - 60 + zig, floor + 10, { rot: f.rm ? 0 : Math.sin(t * 3) * 0.12 });
        luz.actor?.pose(t, cx + 150, y0 + 170 + bob(t, f.rm, 6), { flip: true });
        const L = lanternAt(luz);
        const sg = scarf.clear();
        inkLine(sg, [L, [cx - 60 + zig + 20, floor - 90]], { width: 5, color: 0xc8c8c8, amp: 3 });
        beam.set(L, [cx - 60 + zig, floor - 60], 60, 0.7);
      },
    };
  }
  if (which === 2) {
    // H73: the parking lot of La Cuadra 8; a ring of cats; her beam falls on Canelo in the middle
    bg.rect(x0, y0, w, h).fill(0x141418);
    for (let i = 0; i < 6; i++) bg.rect(x0 + 20 + i * 120, floor - 6, 60, 6).fill(0x5a5a5e);
    root.addChild(bg);
    for (let i = 0; i < 9; i++) {
      const sil = ctx.silhouette(CREW[i % CREW.length], 0.5, 1);
      if (sil) {
        sil.scale.set(70 / sil.texture.height);
        sil.tint = 0x2a2a30;
        sil.position.set(x0 + 40 + i * 80, floor + (i % 2) * 10);
        root.addChild(sil);
      }
    }
    const can = ctx.actor(ctx.canelo, 140);
    if (can) root.addChild(can);
    root.addChild(beam);
    return {
      root,
      update(t) {
        can?.pose(t, cx, floor, {});
        beam.set([cx + 260, y0 - 20], [cx, floor - 60], 70, 0.8);
      },
    };
  }
  if (which === 3) {
    // H78: the night on your island; Cerito comes to the beam for the first time and his static calms — the first
    // colour that is not hers comes into the card (his pearl grey)
    bg.rect(x0, y0, w, h).fill(0x101418);
    bg.rect(x0, floor, w, 40).fill(0x1a1e24);
    for (let i = 0; i < 30; i++) bg.circle(x0 + rnd(i) * w, y0 + rnd(i + 3) * h * 0.5, 1.5).fill(0xd8d8d8);
    root.addChild(bg);
    const cer = new StaticKitten(ctx, 120, STAND.cerito);
    const luz = luzOf(ctx, 170);
    root.addChild(cer);
    if (luz.actor) root.addChild(luz.actor);
    root.addChild(beam);
    return {
      root,
      update(t, f) {
        luz.actor?.pose(t, cx + 170, y0 + 160 + bob(t, f.rm, 6), { flip: true });
        const near = sm(seg(t, 0.2, 2.6));
        cer.position.set(cx - 200 + near * 170, floor);
        cer.update(t, { stare: 0.8, clear: sm(seg(t, 1.4, 3.0)) * 0.8, tint: 0xb4c4ec });
        beam.set(lanternAt(luz), [cer.x, floor - 50], 70, 0.75);
      },
      look: (t) => ({ accHue2: 0.62, accW2: 0.1 * sm(seg(t, 1.2, 2.4)) }),
    };
  }
  if (which === 4) {
    // H85: the card almost black — only the eyes
    bg.rect(x0, y0, w, h).fill(0x050506);
    root.addChild(bg);
    const eyes = new Graphics();
    root.addChild(eyes);
    return {
      root,
      update(t, f) {
        const g = eyes.clear();
        for (let i = 0; i < 7; i++) {
          const on = f.rf ? sm(seg(t, 0.2 + i * 0.25, 0.6 + i * 0.25)) : t > 0.2 + i * 0.25 ? 1 : 0;
          if (on <= 0) continue;
          const ex = x0 + 70 + rnd(i * 3) * (w - 140);
          const ey = y0 + 80 + rnd(i * 7) * (h - 160);
          for (const dx of [-14, 14]) g.ellipse(ex + dx, ey, 9, 6).fill({ color: 0xffb040, alpha: on }).ellipse(ex + dx, ey, 2, 5).fill(0x050506);
        }
      },
    };
  }
  if (which === 5) {
    // H82: the lantern between La Mano's white hand and Cerito's paw
    bg.rect(x0, y0, w, h).fill(0x18181c);
    root.addChild(bg);
    const hand = manoHand(1.4);
    hand.position.set(x0 + 150, y0 + 180);
    hand.rotation = 1.2;
    const lamp = new Graphics();
    lamp.roundRect(-24, -60, 48, 72, 8).fill({ color: 0xffe0a0, alpha: 0.8 }).rect(-30, -70, 60, 10).fill(0x8a6a2a).rect(-30, 12, 60, 10).fill(0x8a6a2a);
    lamp.position.set(cx, y0 + 170);
    const glow = glowSprite(ctx, WARM, 1.4);
    glow.position.set(cx, y0 + 150);
    const paw = new Graphics();
    paw.ellipse(0, 0, 40, 32).fill(0xc8ccd8);
    for (let i = 0; i < 4; i++) paw.ellipse(-30 + i * 20, -34, 10, 12).fill(0xc8ccd8);
    paw.position.set(x0 + w - 150, y0 + 200);
    root.addChild(glow, hand, lamp, paw);
    return { root, update: () => undefined };
  }
  // 6 · H66: the Borracha's morning that didn't reset — the bar at dawn, the clock past the hour, Canelo looking
  bg.rect(x0, y0, w, h).fill(0x202024);
  bg.circle(x0 + w - 120, y0 + 90, 50).fill(0xd8d8d8);
  bg.rect(x0 + 40, y0 + 60, 300, 210).fill(0x2e2e34);
  bg.circle(x0 + 190, y0 + 110, 34).fill(0xe8e8e8).stroke({ width: 3, color: 0x101010 });
  bg.moveTo(x0 + 190, y0 + 110).lineTo(x0 + 190, y0 + 86).stroke({ width: 3, color: 0x101010 }).moveTo(x0 + 190, y0 + 110).lineTo(x0 + 210, y0 + 118).stroke({ width: 3, color: 0x101010 });
  bg.rect(x0, floor, w, 40).fill(0x2a2a2e);
  root.addChild(bg);
  const can = ctx.actor(ctx.canelo, 150);
  if (can) root.addChild(can);
  return {
    root,
    update(t) {
      can?.pose(t, cx + 120, floor, { flip: true });
    },
  };
}

function muelle(ctx: SceneCtx): FilmSet {
  const rm = ctx.rm;
  const rf = ctx.rf;
  // ---------------------------------------------------------------- the world (every shot sees the same dock)
  // sky and fog (far, frozen)
  const sky = new Container();
  const sg = new Graphics();
  sg.rect(-800, -600, 3520, 1300).fill(0x16171b);
  for (let i = 0; i < 6; i++) sg.rect(-800, -200 + i * 90, 3520, 90).fill({ color: 0x24262c, alpha: 0.12 * i });
  sky.addChild(sg);
  const wash = ctx.tex('tn:wash');
  if (wash) {
    const ws = new TilingSprite({ texture: wash, width: 3520, height: 1300 });
    ws.position.set(-800, -600);
    ws.alpha = 0.18;
    ws.blendMode = 'multiply';
    sky.addChild(ws);
  }
  ctx.plane(sky, { z: 4200, bake: 'static' });
  // the water: black ink with long reflections
  const water = new Graphics();
  water.rect(-900, 430, 3700, 1100).fill(0x16181d);
  for (let i = 0; i < 40; i++) water.rect(-800 + rnd(i) * 3500, 460 + rnd(i + 2) * 600, 120 + rnd(i + 5) * 400, 3).fill({ color: 0xa8acb4, alpha: 0.25 + rnd(i + 9) * 0.25 });
  ctx.plane(water, { z: 1700, bake: 'static' });
  // the fleet (live: cannons turn, the light greys them)
  const fleetC = new Container();
  const ships: WhiteShip[] = [];
  for (let i = 0; i < 12; i++) {
    const s = new WhiteShip(0.55);
    const row = i < 6 ? 0 : 1;
    s.position.set(1080 + (i % 6) * 190 + row * 95, 420 + row * 70);
    s.scale.set(row ? 1.1 : 0.9);
    ships.push(s);
    fleetC.addChild(s);
  }
  ctx.plane(fleetC, { z: 2200 });
  // the shore and La Mano (far left, in the fog)
  const shore = new Container();
  const shg = new Graphics().poly([-900, 520, 360, 470, 520, 520, -900, 600]).fill(0x1c1d22);
  const mano = manoFigure(ctx, 200, { bake: 'tinta', tint: 0xf4f4f4 });
  mano.root.position.set(160, 500);
  shore.addChild(shg, mano.root);
  ctx.plane(shore, { z: 1900 });
  // the bow (near): deck, rail, her, the crew line, Canelo
  const bow = new Container();
  const dg = new Graphics();
  dg.poly([-500, 1300, 1500, 1300, 1100, 860, 860, 800, -500, 820]).fill(0x24221f).stroke({ width: 4, color: INK });
  for (let i = 0; i < 9; i++) dg.moveTo(-500, 860 + i * 50).lineTo(1300, 840 + i * 56).stroke({ width: 2, color: INK, alpha: 0.7 });
  dg.moveTo(-500, 790).lineTo(860, 770).lineTo(1120, 840).stroke({ width: 12, color: 0x1a1816 });
  bow.addChild(dg);
  const crew = CREW.map((s) => ctx.actor(s, s === STAND.hipolito ? 230 : 190));
  const can = ctx.actor(ctx.canelo, 220);
  const luz = luzOf(ctx, 300);
  const beam = new Beam(ctx, WARM);
  const lamp = glowSprite(ctx, WARM, 1.2);
  const rays = new Graphics();
  const fl = new Graphics();
  const lit = crew.map(() => glowSprite(ctx, WARM, 1.6));
  for (const a of crew) if (a) bow.addChild(a);
  for (const g of lit) bow.addChild(g);
  if (can) bow.addChild(can);
  if (luz.actor) bow.addChild(luz.actor);
  bow.addChild(beam, lamp, rays, fl);
  ctx.plane(bow, { z: 1000 });
  // the light written on the sea (cierre)
  const seaWrite = new Container();
  const letters = ['N', 'O,', 'W', 'E', 'Y.'].map((ch) => new Printed(ctx.k, 'luz', ch, { size: 170, fill: 0xffd9a0 }));
  const lglow = letters.map(() => glowSprite(ctx, WARM, 2.6));
  let lx = 330;
  letters.forEach((l, i) => {
    l.position.set(lx, 470);
    lglow[i].position.set(lx + 70, 580);
    lx += i === 1 ? 320 : 235;
    seaWrite.addChild(lglow[i], l);
  });
  const underline = new Graphics();
  seaWrite.addChild(underline);
  ctx.plane(seaWrite, { z: 1250 });
  // ---------------------------------------------------------------- overlays (screen)
  // shutters of shadow (noir blinds across the frame)
  const blinds = new Graphics();
  for (let i = 0; i < 14; i++) blinds.poly([-200 + i * 170, -100, -110 + i * 170, -100, -420 + i * 170, 1200, -510 + i * 170, 1200]).fill({ color: 0x000000, alpha: 0.32 });
  // the charges
  const cards: { f: Ficha; at: number; hand: number; out: number; mem: ReturnType<typeof memoryOf>; x: number; y: number }[] = [];
  const addCard = (text: string, guilty: string, which: number, at: number, hand: number, out: number, x = 1260, y = 520, who?: 'canelo') => {
    const f = new Ficha(ctx, text, guilty, { who });
    const mem = memoryOf(ctx, which, f.win);
    f.memory.addChild(mem.root);
    cards.push({ f, at, hand, out, mem, x, y });
  };
  // the dossier's title card (N2)
  const title = new Ficha(ctx, EXPEDIENTE, '', { noWindow: true });
  // the six charges (textos.ts CARGOS): when each falls, when her hand answers, when it leaves
  const when: [number, number, number, number?][] = [
    [c(9.25), c(13) - c(9.25), c(17) - c(9.25)],
    [c(19), 4.2, c(21) - c(19)],
    [c(21), c(23) - c(21), c(25) - c(21)],
    [c(29.25), 6.2, c(33) - c(29.25)],
    [c(37), 3.2, c(39) - c(37)],
    [c(39), 4.0, c(41.5) - c(39), 700],
  ];
  CARGOS.forEach((k, i) => addCard(k.texto, k.culpable, k.n, when[i][0], when[i][1], when[i][2], when[i][3] ?? 1260, 520, k.quien === 'canelo' ? 'canelo' : undefined));
  // the margin: La Mano gives up on the light (N20)
  const margin = new Printed(ctx.k, 'mano', RENUNCIA, { size: 48, w: 760, fill: 0xf0f0ee });
  margin.position.set(120, 120);
  const eyeNote = new Graphics();
  eyeNote.ellipse(0, 0, 60, 30).stroke({ width: 4, color: 0xf0f0ee }).ellipse(0, 0, 8, 26).fill(0xf0f0ee);
  eyeNote.position.set(980, 170);
  // «Dale, Luz.» (N26) — he speaks in text
  const dale = new Printed(ctx.k, 'canelo', 'Dale, Luz.', { size: 80, align: 0.5, plate: PAPER });
  dale.position.set(700, 220);
  // placards (N10): mute signs on the white decks
  const placard = new Printed(ctx.k, 'typed', 'UNA LUZ MENOS. UN ERROR MENOS.', { size: 46, align: 0.5, plate: 0xffffff, w: 1400 });
  placard.position.set(1300, 180);
  // the dossier opening on Canelo's card + the stamp (N29)
  const dossier = new Container();
  const dg2 = new Graphics();
  dg2.rect(-420, -300, 840, 600).fill(0xe8e6e0).stroke({ width: 3, color: 0x6a6a6a });
  dg2.rect(-420, -330, 260, 40).fill(0xe8e6e0).stroke({ width: 3, color: 0x6a6a6a });
  dossier.addChild(dg2);
  const photo = ctx.stillAs('tinta', 'canelo_cozy_cat', 0.5, 1);
  if (photo) {
    photo.scale.set(300 / photo.texture.height);
    photo.position.set(-230, 160);
    const pf = new Graphics().rect(-390, -200, 320, 380).stroke({ width: 6, color: 0x2a2a2a });
    dossier.addChild(photo, pf);
  }
  const dtx = new Printed(ctx.k, 'typed', 'SUJETO: EL GATO DE LA BUFANDA\nERRORES: ROMPER EL REINICIO', { size: 28, w: 420, fill: 0x1a1a1a });
  dtx.position.set(-30, -220);
  dossier.addChild(dtx);
  const stamp = new Container();
  const stg = new Graphics().roundRect(-300, -80, 600, 160, 18).stroke({ width: 10, color: 0xc0201a }).roundRect(-282, -62, 564, 124, 10).stroke({ width: 3, color: 0xc0201a });
  const stt = word(ctx.k, SENTENCIA, { fontFamily: 'Bebas Neue', fontSize: 70, fill: 0xc0201a, letterSpacing: 6 });
  stt.position.set(-30, 0);
  const steye = new Graphics().ellipse(230, 0, 40, 20).stroke({ width: 6, color: 0xc0201a }).ellipse(230, 0, 6, 17).fill(0xc0201a);
  stamp.addChild(stg, stt, steye);
  stamp.position.set(-140, 40);
  stamp.rotation = -0.14;
  dossier.addChild(stamp);
  dossier.position.set(960, 540);
  // the tail: the puddle's reflection with interference, the broken monitor with Esquirla
  const puddle = new Container();
  const pg = new Graphics().ellipse(0, 0, 360, 70).fill(0x08090b);
  const refl = new Printed(ctx.k, 'luz', 'NO, WEY.', { size: 70, fill: 0xffd9a0, align: 0.5 });
  refl.scale.y = -0.5;
  refl.position.set(0, 30);
  const bars = new Sprite(ctx.tex('pi:bars') as Texture ?? kitTex(ctx, 'static'));
  bars.anchor.set(0.5);
  bars.setSize(560, 90);
  bars.alpha = 0;
  const pm = new Graphics().ellipse(0, 0, 360, 70).fill(0xffffff);
  refl.mask = pm;
  bars.mask = pm;
  puddle.addChild(pg, refl, bars, pm);
  puddle.position.set(1500, 960);
  const monitor = new Container();
  const mg = new Graphics();
  mg.roundRect(-430, -300, 860, 600, 30).fill(0x1a1a1a).stroke({ width: 10, color: 0x0a0a0a });
  mg.roundRect(-380, -250, 760, 500, 20).fill(0x05060a);
  mg.moveTo(-200, -250).lineTo(-60, -40).lineTo(-180, 120).stroke({ width: 3, color: 0x8a9aa8 });
  const mbars = new Sprite(ctx.tex('pi:bars') as Texture ?? kitTex(ctx, 'static'));
  mbars.position.set(-380, -250);
  mbars.setSize(760, 500);
  mbars.alpha = 0.35;
  const esq = esquirlaFigure(ctx, 640, 'senal');
  esq.root.position.set(0, 430);
  const vis = new Printed(ctx.k, 'luz', 'NO, WEY.', { size: 34, fill: 0xffd9a0, align: 0.5 });
  vis.position.set(-20, -260 + 30);
  const mmask = new Graphics().roundRect(-380, -250, 760, 500, 20).fill(0xffffff);
  const minner = new Container();
  minner.addChild(mbars, esq.root, vis);
  minner.mask = mmask;
  monitor.addChild(mg, minner, mmask);
  monitor.position.set(960, 540);
  const book = new BookFrame(ctx, { head: 'Ex Libris', title: 'El expediente', folio: 340, paper: 0xe6e6e4 });
  // the gutter burning (c29): an ember line down the middle that opens
  const burn = new Graphics();
  const ui = new Container();
  ui.addChild(blinds, puddle);
  for (const k of cards) {
    k.f.position.set(k.x, k.y);
    ui.addChild(k.f);
  }
  title.position.set(1260, 520);
  // the cut to black at DISTOR c5 (after the monitor goes off)
  const black = new Graphics().rect(-400, -400, 2720, 1880).fill(0x000000);
  ui.addChild(title, margin, eyeNote, dale, placard, dossier, monitor, book, burn, black);
  ctx.plane(ui, { z: 0, screen: true });

  prewarm(ctx, bow, fleetC, shore, seaWrite, ui);
  // ---------------------------------------------------------------- choreography (song time m)
  const formTap = () => ctx.k.judged('formense');
  const bounceTap = () => ctx.k.judged('rebota');
  const underTap = () => ctx.k.judged('subraya');
  let lastLook: Partial<PostLook> | null = null;
  return {
    update(lt, f) {
      const m = f.m;
      const step = Math.floor(m * 12);
      // ---- her, at the bow; the crew forms behind her (c25, or c27 without the tap)
      const formAt = formTap() ? c(25) : c(27);
      const form = sm(seg(m, formAt, formAt + 1.6));
      // from c45 the two of them stand side by side at the front [S3]
      const front = sm(seg(m, c(44.6), c(45.2)));
      const LX = 760 - front * 40;
      const LY = 520;
      luz.actor?.pose(m, LX + bob(m, rm, 8), LY + bob(m + 1, rm, 6), {});
      // N3 (c5): she raises her head on the bass
      if (luz.actor?.puppet) luz.actor.puppet.brain.look = m < c(5) ? -0.6 : m < c(45) || m > c(45) + 2 ? 0.4 : -0.8;
      crew.forEach((a, i) => {
        if (!a) return;
        const tx = 520 - i * 120;
        a.pose(m, tx - (1 - form) * 900, 880 + (i % 2) * 20, {});
        a.alpha = Math.max(0.0, form);
      });
      // Canelo: first in the line, then at her side (c45); he shakes his scarf and stands straight (c27–29)
      const cx = 640 + (1 - form) * -900 + front * 300;
      const shake = m > c(27) && m < c(29) && !rm ? Math.sin(m * 26) * 0.05 * env(m, c(27), c(29), 0.2, 0.4) : 0;
      can?.pose(m, cx, 900 - front * 40, { rot: shake });
      if (can?.puppet) can.puppet.brain.look = front > 0.5 && m < c(49) ? -0.7 : 0.2;
      const tip = tailTip(can);
      fl.clear();
      if (tip) flame(fl, tip[0], tip[1], FLAME.sesenta, m, { rm, color: 0xffa040 });
      // ---- her light: low at first (N1), the cone; the searchlight sweep from c29; the final sweep c53
      const L = lanternAt(luz);
      lamp.position.set(L[0], L[1]);
      const raise = sm(seg(m, c(5), c(5) + 1.2));
      lamp.alpha = 0.45 + raise * 0.25 + (rm ? 0 : 0.04 * wob(m * 6, 3));
      let target: [number, number] = [L[0] + 300, L[1] + 260];
      let spread = 90;
      let beamA = 0.35 + raise * 0.3;
      let sweep = -1;
      if (m >= c(29) && m < c(45)) {
        sweep = (m - c(29)) / (c(45) - c(29));
        const sx = 1080 + (rm ? sweep : 0.5 + 0.5 * Math.sin(sweep * Math.PI * 3 - Math.PI / 2)) * 1100;
        target = [sx, 430];
        spread = 160;
        beamA = 0.85;
      } else if (m >= c(53) && m < c(61)) {
        sweep = 1;
        const k = seg(m, c(53), c(55));
        target = [1080 + k * 1100, 440];
        spread = 260;
        beamA = 0.95;
      } else if (m >= c(49) && m < c(53)) {
        // N27: she raises the lantern
        target = [L[0] + 200, L[1] - 160];
        beamA = 0.6;
      } else if (m >= c(61)) {
        // N31: she lowers it and writes with her light on the sea
        target = [L[0] + 500, 640];
        spread = 40;
        beamA = 0.5;
      }
      beam.set(L, target, spread, beamA);
      // ---- the fleet: cannons turn to her (c5–9); greyed by her light (c29–45), they retreat (c53–61)
      const aim = sm(seg(m, c(5), c(8)));
      ships.forEach((s, i) => {
        const dx = L[0] - (s.x + s.muzzle[0] * s.scale.x);
        const dy = L[1] - (s.y + s.muzzle[1] * s.scale.y);
        s.cannon.rotation = aim * (Math.atan2(dy, dx) + Math.PI);
        // the searchlight greys every ship it has touched
        const touched = m >= c(29) && (m >= c(45) || (rm ? sweep * 12 > i : Math.abs(s.x - target[0]) < 200 || (m - c(29)) / (c(45) - c(29)) > 0.25 + i * 0.05));
        const grey = touched ? 1 : 0;
        s.hull.tint = grey ? 0x6a6c70 : 0xffffff;
        s.cannon.tint = s.hull.tint;
        const retreat = sm(seg(m, c(53) + i * 0.3, c(59)));
        s.x = 1080 + (i % 6) * 190 + (i >= 6 ? 95 : 0) + retreat * 900;
        s.alpha = 1 - retreat * 0.7;
        s.rotation = !rm && m > c(13) && m < c(17) && i === 3 ? Math.sin(m * 30) * 0.02 : 0;
      });
      // ---- the rays (c9–17): every clap a white ray hits her light and BOUNCES onto a cat behind her
      const rg = rays.clear();
      const big = bounceTap() ? 1.6 : 1;
      for (let i = 0; i < CLAPS.length; i++) {
        const t0 = CLAPS[i];
        const age = m - t0;
        if (age < 0 || age > 0.45) continue;
        const s = ships[i % ships.length];
        const from: [number, number] = [s.x + s.muzzle[0] * s.scale.x, s.y + s.muzzle[1] * s.scale.y];
        const k = Math.min(1, age / 0.12);
        const a = 1 - sm(seg(age, 0.2, 0.45));
        rg.moveTo(from[0], from[1]).lineTo(from[0] + (L[0] - from[0]) * k, from[1] + (L[1] - from[1]) * k).stroke({ width: 5, color: 0xffffff, alpha: a * (rf ? 0.6 : 1) });
        if (age > 0.12) {
          const tgt = crew[i % crew.length];
          const to: [number, number] = tgt ? [tgt.x, tgt.y - 120] : [300, 760];
          const kb = Math.min(1, (age - 0.12) / 0.12);
          rg.moveTo(L[0], L[1]).lineTo(L[0] + (to[0] - L[0]) * kb, L[1] + (to[1] - L[1]) * kb).stroke({ width: 7 * big, color: WARM, alpha: a });
          rg.circle(L[0], L[1], 20 + age * 120 * big).stroke({ width: 4, color: WARM, alpha: a * 0.7 });
        }
      }
      // the bounced light lands on the cats behind her (they get lit)
      lit.forEach((g, i) => {
        const a = crew[i];
        if (!a) return (g.visible = false);
        g.position.set(a.x, a.y - 100);
        let on = 0;
        for (let j = i; j < CLAPS.length; j += crew.length) on = Math.max(on, env(m, CLAPS[j] + 0.12, CLAPS[j] + 0.9, 0.05, 0.6));
        // c41–45: the cats fire guided by her light
        on = Math.max(on, m > c(41) && m < c(45) ? 0.5 + 0.3 * Math.sin(m * 9 + i) : 0);
        g.alpha = on * 0.6 * form;
        g.visible = g.alpha > 0.01;
      });
      // ---- La Mano on the shore (c33 → ): raises the paw, lowers it on the late kick, writes; looks at Canelo
      const manoOn = env(m, c(32.6), c(37), 0.6, 0.8);
      mano.root.visible = manoOn > 0.01;
      mano.root.alpha = manoOn;
      mano.actor?.pose(m, 0, 0, {});
      const raisePaw = sm(seg(m, c(33), c(33) + 0.5)) * (1 - sm(seg(m, c(33.3495), c(33.3495) + 0.4)));
      mano.hand.rotation = -raisePaw * 1.2;
      mano.hand.y = -200 * 0.42 - raisePaw * 40;
      if (mano.actor?.puppet) mano.actor.puppet.brain.look = m > c(34.2) ? 0.9 : 0.4;
      margin.update(seg(m, c(33.3495) + 0.3, c(33.3495) + 2.6), env(m, c(33.3495) + 0.2, c(37), 0.3, 0.6));
      eyeNote.visible = m > c(33.3495) + 2.4 && m < c(37);
      eyeNote.alpha = sm(seg(m, c(33.3495) + 2.4, c(33.3495) + 3.0)) * (1 - sm(seg(m, c(36.4), c(37))));
      // ---- the cards
      title.update(m - c(3), { typeDur: 3.6, handAt: 99, out: c(5) + 6.4 - c(3), rm });
      for (const k of cards) {
        const t = m - k.at;
        k.f.update(t, { handAt: k.hand, out: k.out, rm });
        if (k.f.visible) k.mem.update(t, f);
      }
      placard.update(seg(m, c(17), c(17) + 1.0), env(m, c(17), c(19), 0.1, 0.4));
      dale.update(seg(m, c(49), c(49) + 0.8), env(m, c(49), c(52), 0.1, 0.4), m);
      // ---- the dossier: opens on Canelo's card, the stamp falls (c57), it sinks page by page (c58–60)
      const dOn = env(m, c(56.5), c(60), 0.4, 0.8);
      dossier.visible = dOn > 0.01;
      dossier.alpha = dOn;
      dossier.y = 540 + sm(seg(m, c(58.5), c(60))) * 500;
      dtx.update(seg(m, c(56.6), c(57)));
      const st = seg(m, c(57), c(57) + 0.3);
      stamp.visible = st > 0;
      stamp.scale.set(rm ? 1 : 1.9 - 0.9 * sm(st) + (st >= 1 ? 0.05 * Math.exp(-(m - c(57) - 0.3) * 8) : 0));
      // ---- the sea writing (c61 → c70): N · O, · W · E · Y. — one letter every two bars, then the underline
      const at = [c(61), c(63), c(65), c(67), c(69)];
      letters.forEach((l, i) => {
        const p = seg(m, at[i], at[i] + 1.4);
        l.update(p, m >= at[i] ? 1 - sm(seg(m, c(70.3) + 4.6, c(70.3) + 6.2)) * 0.6 : 0);
        lglow[i].alpha = (m >= at[i] ? 0.5 : 0) * (1 - sm(seg(m, c(70.3) + 4.6, c(70.3) + 6.2)) * 0.6);
      });
      seaWrite.visible = m >= c(60.8);
      const ug = underline.clear();
      const u = seg(m, c(70), c(70) + 0.9);
      if (u > 0) {
        const w = underTap() ? 10 : 5;
        inkLine(ug, partial([[260, 700], [1480, 690]], u), { width: w, color: 0xffd9a0, amp: 2 });
      }
      // ---- the tail (segue): the 808 creeps in at c69; the reflection flickers (c69,7); the monitor; black
      const tail = m - c(69);
      puddle.visible = tail > 0.6 && tail < 6.6;
      puddle.alpha = sm(seg(tail, 0.6, 1.2));
      refl.update(1, 1);
      const flick = tail > 2.1 ? (rf ? 0.4 + 0.3 * Math.sin(m * 2) : rnd(step) > 0.5 ? 0.85 : 0.15) : 0;
      bars.alpha = flick;
      bars.x = rf ? Math.sin(m) * 20 : (rnd(step + 1) - 0.5) * 80;
      monitor.visible = tail > 4.25 && tail < 8.6;
      monitor.alpha = sm(seg(tail, 4.25, 4.6)) * (1 - sm(seg(tail, 6.4, 6.9)));
      esq.actor?.pose(m, 0, 0, {});
      vis.update(1, 1);
      mbars.alpha = 0.25 + (rf ? 0 : 0.15 * rnd(step + 5));
      // ---- the book (until c29, when her light burns the gutter) and the noir blinds
      const burnK = seg(m, c(29) - 0.2, c(29) + 1.4);
      book.set({ open: 1 - sm(burnK), split: sm(burnK) * 300, gutter: 0.55 });
      const bg = burn.clear();
      if (burnK > 0 && burnK < 1) {
        const w = 6 + burnK * 40;
        for (let y = -20; y < 1100; y += 30) {
          const x = 960 + (rnd(y + step) - 0.5) * (rm ? 4 : 16);
          bg.rect(x - w / 2, y, w, 32).fill({ color: 0xffa040, alpha: 0.9 * (1 - burnK) });
          bg.rect(x - w / 6, y, w / 3, 32).fill({ color: 0xfff0c0, alpha: 1 - burnK });
        }
      }
      // the blinds are heaviest in the quiet sections (intro, the breaks)
      const quiet = m < c(9) || (m >= c(17) && m < c(29)) || (m >= c(45) && m < c(53));
      blinds.alpha = quiet ? 0.9 : 0.45;
      black.alpha = sm(seg(tail, 6.5, 6.8));
      black.visible = black.alpha > 0.003;
      blinds.x = rm ? 0 : (m * 6) % 170;
      // the look of this frame: Cerito's pearl in his card; the red of the stamp; the tail lets colour in
      // the open book's bright margins must not catch the stock's warm halation (one colour: her light)
      lastLook = m < c(29.4) ? { hal: 0.08 } : null;
      for (const k of cards) if (k.f.visible && k.mem.look) lastLook = k.mem.look(m - k.at);
      if (stamp.visible) lastLook = { accHue2: 0.0, accW2: 0.09 };
      if (tail > 2.0) lastLook = { mono: 0.97 - sm(seg(tail, 2.0, 4.4)) * 0.6 };
    },
    look: () => lastLook,
    anchor: (n) => (n === 'lantern' ? lanternAt(luz) : n === 'line' ? [380, 820] : n === 'sea' ? [900, 860] : null),
  };
}
