/**
 * F19 · PH «Lo que se derrama, se termina» (H84) — a GUSTAVE DORÉ wood engraving with fog running between the lines.
 * The grey Caperucita with a wolf-shaped hole; the prints cross the gutter and the engraving «enters» from them; the
 * forest of burin lines; Garbancito trembling under a mushroom; the Wolf in nightcap and grandmother's gown (his painting;
 * engraved), all teeth; nobody can reach (the gutter is in the way); La Mano walks out of the fog — the only figure
 * without hatching, white paper — and writes FIN on the Wolf: he looks at the letters and comes apart into loose
 * engraving lines, feet to ears, into the fog. Total silence from the F. Her beam wraps Garbancito like a blanket;
 * Brecha looks up at the tear and drops her can. HARD CUT to the Library's watercolour: «¡LUZ!» — the page of
 * another Canelo who didn't come back; his flame drops and is slow to return; «Ese también es un borrador.»;
 * «Es otro Canelo, gordo. De otra caja.» Guion: historia-v2/guiones/acto-3/h84-finales-perdidos.md (F19-1…F19-15).
 * The FIN falls on someone who is neither a ghost nor her friend; she says nothing about herself [TEMP-P3].
 */
import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { FilmSet, FrameInfo, SceneCtx, SetModule } from '../../../stage';
import { engrave } from '../../../styles/libros';
import { Beam, BookFrame, env, filmDuck, flame, FLAME, garbancito, glowSprite, kitTex, lanternAt, LB, luzOf, bob, manoFigure, Printed, rnd, seg, sm, STAND, tailTip, word, wob, prewarm } from '../kit';
import { sceneTimeline } from '../../../timeline';

/** total silence from the F of the FIN (film time) to the end — «la música se corta en la F» */
function finSilence(ctx: SceneCtx): (m: number) => boolean {
  const sp = sceneTimeline(ctx.film).scenes.find((x) => x.id === 'fin');
  const at = (sp?.start ?? 1e9) + 1.0;
  const duck = filmDuck(ctx, 'film-f19-fin');
  return (m) => {
    const on = m >= at;
    duck.set(on);
    return on;
  };
}

const WARM = 0xffc27a;
const PAPER = 0xf0e8d6;

/** an engraved plate from a tonal drawing (grey values), mounted as a frozen plane */
function plate(ctx: SceneCtx, draw: (g: Graphics) => void, z: number, o: { angle?: number; spacing?: number; cross?: number; name?: string; seed?: number } = {}) {
  const g = new Graphics();
  draw(g);
  const r = engrave(ctx.baker, g, { res: 1, ...o });
  const sp = new Sprite(r.tex);
  sp.position.set(r.x, r.y);
  ctx.plane(sp, { z });
  return sp;
}
const grey = (v: number) => {
  const c = Math.round(Math.max(0, Math.min(1, v)) * 255);
  return (c << 16) | (c << 8) | c;
};

/** the forest: far trees (light), the moon, the clearing, near trunks (dark) — three engraved planes */
function forest(ctx: SceneCtx, o: { moon?: [number, number]; clearing?: number; seed?: number } = {}) {
  const [mx, my] = o.moon ?? [1320, 230];
  const s = o.seed ?? 1;
  plate(
    ctx,
    (g) => {
      g.rect(-500, -400, 2920, 1700).fill(grey(0.35));
      // the moonlit sky: a lighter hole around the moon
      for (let i = 6; i > 0; i--) g.circle(mx, my, 90 + i * 70).fill(grey(0.35 + (6 - i) * 0.07));
      g.circle(mx, my, 92).fill(grey(0.97));
      for (let i = 0; i < 14; i++) {
        const x = -400 + i * 200 + rnd(i + s) * 80;
        const h = 500 + rnd(i * 3 + s) * 300;
        g.poly([x - 30, 900, x + 30, 900, x + 12, 900 - h, x - 12, 900 - h]).fill(grey(0.42));
        g.ellipse(x, 900 - h, 120, 160).fill(grey(0.4));
      }
      g.rect(-500, 820, 2920, 600).fill(grey(0.5));
    },
    3200,
    { angle: 0.1, spacing: 5, cross: 0.7, name: `far${s}`, seed: s },
  );
  plate(
    ctx,
    (g) => {
      // the clearing floor: a pale pool of moonlight on the ground
      g.ellipse(o.clearing ?? 760, 900, 760, 120).fill(grey(0.78));
      g.rect(-500, 940, 2920, 500).fill(grey(0.4));
      for (let i = 0; i < 8; i++) {
        const x = -300 + i * 380 + rnd(i * 7 + s) * 120;
        g.poly([x - 70, 1200, x + 70, 1200, x + 34, -300, x - 34, -300]).fill(grey(0.2));
        g.ellipse(x, -120, 300, 220).fill(grey(0.16));
        // roots
        g.poly([x - 70, 1000, x - 180, 1060, x - 60, 1030]).fill(grey(0.2)).poly([x + 70, 1000, x + 190, 1050, x + 60, 1030]).fill(grey(0.2));
      }
    },
    1700,
    { angle: 1.45, spacing: 4.2, cross: 0.55, name: `mid${s}`, seed: s + 2 },
  );
}

/** the Wolf, code-drawn in grey values then engraved: grandmother's gown with frills, nightcap, long snout, teeth */
function wolf(ctx: SceneCtx): { body: Sprite; head: Sprite; headPivot: [number, number] } {
  const gb = new Graphics();
  // the gown (a looming mass leaning forward), frills at the neck and the cuffs
  gb.poly([-260, 0, 300, 0, 260, -380, 120, -620, -120, -640, -240, -400]).fill(grey(0.82));
  gb.poly([-240, -400, -120, -640, -60, -620, -170, -380]).fill(grey(0.55));
  for (let i = 0; i < 9; i++) gb.circle(-120 + i * 30, -620 + Math.sin(i) * 8, 26).fill(grey(0.95));
  // the arms / paws reaching down (claws)
  gb.poly([180, -420, 360, -200, 390, -160, 330, -170, 150, -360]).fill(grey(0.7));
  for (let i = 0; i < 4; i++) gb.poly([340 + i * 12, -175, 352 + i * 12, -120, 362 + i * 12, -172]).fill(grey(0.15));
  for (let i = 0; i < 5; i++) gb.circle(160 + i * 26, -400 + i * 20, 20).fill(grey(0.95));
  const rb = engrave(ctx.baker, gb, { angle: 1.2, spacing: 3.8, cross: 0.5, name: 'wolf-body', seed: 7 });
  const gh = new Graphics();
  // the head in profile (snout to the right, down), the nightcap with its pom-pom, the eye, the teeth
  gh.poly([-150, 40, -170, -120, -60, -200, 80, -150, 300, -60, 330, 0, 300, 40, 160, 80, 0, 110]).fill(grey(0.45));
  gh.poly([-60, -200, -10, -320, 40, -170]).fill(grey(0.3)).poly([-150, -120, -180, -260, -90, -170]).fill(grey(0.3));
  gh.poly([-200, -90, -120, -260, 60, -230, 120, -150, -40, -150, -150, -60]).fill(grey(0.9));
  gh.circle(150, -170, 40).fill(grey(0.95));
  gh.ellipse(60, -110, 22, 14).fill(grey(1)).circle(66, -110, 8).fill(grey(0));
  // the open jaw
  gh.poly([120, 30, 330, 10, 300, 60, 160, 90]).fill(grey(0.05));
  for (let i = 0; i < 7; i++) gh.poly([140 + i * 26, 22 - i * 2, 152 + i * 26, 48, 164 + i * 26, 20 - i * 2]).fill(grey(1));
  for (let i = 0; i < 6; i++) gh.poly([150 + i * 26, 86 - i * 3, 162 + i * 26, 58, 174 + i * 26, 84 - i * 3]).fill(grey(1));
  gh.circle(330, 0, 16).fill(grey(0.05));
  const rh = engrave(ctx.baker, gh, { angle: 0.5, spacing: 3.4, cross: 0.5, name: 'wolf-head', seed: 9 });
  const body = new Sprite(rb.tex);
  body.position.set(rb.x, rb.y);
  const head = new Sprite(rh.tex);
  head.position.set(rh.x, rh.y);
  return { body, head, headPivot: [rh.x, rh.y] };
}

/** a mushroom (engraved) with Garbancito under it */
function mushroom(ctx: SceneCtx): Sprite {
  const g = new Graphics();
  g.poly([-40, 0, 40, 0, 26, -150, -26, -150]).fill(grey(0.9));
  g.ellipse(0, -160, 170, 80).fill(grey(0.6));
  for (let i = 0; i < 6; i++) g.circle(-110 + i * 44, -190 + (i % 2) * 20, 16).fill(grey(0.95));
  const r = engrave(ctx.baker, g, { angle: 0.2, spacing: 3.6, name: 'seta', seed: 4 });
  const sp = new Sprite(r.tex);
  sp.anchor.set(0, 0);
  sp.position.set(r.x, r.y);
  return sp;
}

/** fog wisps drifting out of the gutter (the fog leaves the book's fold) */
class Wisps extends Container {
  private ws: Sprite[] = [];
  constructor(ctx: SceneCtx, n = 10) {
    super();
    for (let i = 0; i < n; i++) {
      const s = new Sprite(kitTex(ctx, 'wisp'));
      s.anchor.set(0.5);
      s.tint = 0xe8e4dc;
      this.ws.push(s);
      this.addChild(s);
    }
  }
  update(lt: number, rm: boolean, amt = 1) {
    this.ws.forEach((s, i) => {
      const side = i % 2 ? 1 : -1;
      const ph = (lt * (rm ? 0.03 : 0.06) + rnd(i)) % 1;
      s.position.set(960 + side * ph * 1100, 300 + rnd(i * 3) * 700 + Math.sin(lt * 0.4 + i) * 20);
      s.scale.set(1.6 + ph * 2.2, 1.2 + ph);
      s.alpha = amt * 0.32 * Math.sin(ph * Math.PI);
    });
  }
}

const mod: SetModule = {
  cats: ({ canelo, scene }) => {
    if (scene === 'libro') return [];
    if (scene === 'grito' || scene === 'borrador') return [{ slug: canelo, bake: 'libros' }, { slug: 'luzterna', bake: 'libros' }, { slug: STAND.caneloEco, bake: 'libros' }, { slug: STAND.mano, bake: 'libros' }];
    return [STAND.garbancito, STAND.brecha, 'luzterna', canelo, STAND.lobo, { slug: STAND.mano, bake: 'tecnico' }];
  },
  async build(ctx: SceneCtx): Promise<FilmSet> {
    switch (ctx.scene.id) {
      case 'libro':
        return libro(ctx);
      case 'grito':
      case 'borrador':
        return grito(ctx, ctx.scene.id === 'borrador');
      default:
        return bosque(ctx);
    }
  },
};
export default mod;

/** F19-1: the grey Caperucita, a wolf-shaped hole; prints cross the gutter */
function libro(ctx: SceneCtx): FilmSet {
  const bg = new Container();
  const g = new Graphics();
  g.rect(-200, -200, 2320, 1480).fill(0xd8d4cc);
  // the left page: a grey storybook plate (forest, the grandmother's house, the girl) with the wolf's hole
  g.rect(200, 180, 640, 700).fill(0xbcb8b0);
  g.poly([520, 380, 640, 300, 760, 380, 760, 560, 520, 560]).fill(0xa8a49c).rect(610, 470, 50, 90).fill(0x8a8680);
  for (let i = 0; i < 5; i++) g.circle(260 + i * 120, 300 + (i % 2) * 40, 70).fill(0x9a968e);
  g.circle(320, 690, 28).fill(0x8a8680).poly([290, 720, 350, 720, 360, 820, 280, 820]).fill(0x9a2a2a);
  // the hole: paper where the wolf should be
  g.poly([420, 840, 470, 640, 540, 600, 640, 620, 700, 700, 680, 840]).fill(0xf4f0e6).stroke({ width: 3, color: 0x6a665e });
  // the right page: printed text
  for (let i = 0; i < 12; i++) g.rect(1100, 220 + i * 56, 620 - (i % 4 === 3 ? 240 : 0), 8).fill({ color: 0x5a564e, alpha: 0.4 });
  bg.addChild(g);
  const foot = word(ctx.k, 'EL LOBO: (no está)', { fontFamily: 'Playfair Display', fontStyle: 'italic', fontSize: 30, fill: 0x4a463e });
  foot.position.set(520, 930);
  bg.addChild(foot);
  ctx.plane(bg, { z: 1000, bake: 'static' });
  const prints = new Graphics();
  ctx.plane(prints, { z: 1000 });
  const book = new BookFrame(ctx, { head: 'Caperucita', title: 'Finales perdidos', folio: 64 });
  ctx.plane(book, { z: 0, screen: true });
  const P: [number, number][] = [];
  for (let i = 0; i < 12; i++) P.push([600 + i * 105, 780 - Math.sin(i * 0.5) * 60 + (i % 2) * 34]);
  const silenceAt = finSilence(ctx);
  prewarm(ctx, prints, book);
  return {
    update(lt, f) {
      silenceAt(f.m);
      const g2 = prints.clear();
      const n = Math.floor(seg(lt, 0.8, 5.0) * P.length);
      for (let i = 0; i < n; i++) {
        const [x, y] = P[i];
        g2.ellipse(x, y, 16, 12).fill(0x2a2620);
        for (let j = 0; j < 4; j++) g2.ellipse(x - 15 + j * 10, y - 18 - (j === 1 || j === 2 ? 4 : 0), 5, 6).fill(0x2a2620);
      }
      book.set({ open: 1, gutter: 0.55 });
    },
    anchor: (n) => (n === 'prints' ? [1500, 760] : null),
  };
}

/** the engraved forest: the trail, the Wolf, the clearing, La Mano, the FIN, Garbancito, Brecha */
function bosque(ctx: SceneCtx): FilmSet {
  const rm = ctx.rm;
  const id = ctx.scene.id;
  forest(ctx, { moon: id === 'lobo' ? [1100, 300] : [1340, 220], clearing: id === 'huellas' ? 1500 : 760, seed: id === 'huellas' ? 3 : 1 });
  const st = new Container();
  // Garbancito under his mushroom (the clearing)
  const sx = id === 'huellas' ? 1520 : id === 'lobo' ? 640 : 700;
  const seta = mushroom(ctx);
  const sc = id === 'lobo' ? 1.5 : 1;
  seta.scale.set(sc);
  seta.position.set(sx - 0, 900);
  const gar = garbancito(ctx, id === 'lobo' ? 110 : 70);
  const prints = new Graphics();
  if (id === 'huellas')
    for (let i = 0; i < 14; i++) {
      const x = 260 + i * 92;
      const y = 930 + (i % 2) * 26 + Math.sin(i * 0.7) * 10;
      prints.ellipse(x, y, 20, 11).fill(0x14100e);
      for (let j = 0; j < 4; j++) prints.ellipse(x - 18 + j * 12, y - 16 - (j === 1 || j === 2 ? 4 : 0), 5, 6).fill(0x14100e);
    }
  st.addChild(prints, gar.root, seta);
  // the Wolf: his painting (grandmother's lace bonnet and gown, the claws) engraved by the style's bake, facing
  // Garbancito; the code-drawn wolf only stands in if it isn't loaded
  const lobo = ctx.actor(STAND.lobo, 860);
  const wolfC = new Container();
  const headC = new Container();
  if (lobo) {
    lobo.scale.x = -1;
    wolfC.addChild(lobo);
  } else {
    const W = wolf(ctx);
    headC.addChild(W.head);
    wolfC.addChild(W.body, headC);
    headC.position.set(0, -600);
  }
  wolfC.position.set(id === 'lobo' ? 980 : 1020, 960);
  wolfC.scale.set(id === 'lobo' ? 0.98 : 0.85);
  const unravelMask = new Graphics();
  wolfC.mask = unravelMask;
  const strands = new Graphics();
  st.addChild(wolfC, unravelMask, strands);
  // Brecha, Luzterna, Canelo, La Mano (white paper: the technical bake has no hatching)
  const brecha = ctx.actor(STAND.brecha, 230);
  const luz = luzOf(ctx, 260);
  const can = ctx.actor(ctx.canelo, 210);
  const mano = manoFigure(ctx, 330, { bake: 'tecnico', tint: 0xffffff });
  const beam = new Beam(ctx, WARM);
  const lamp = glowSprite(ctx, WARM, 1.2);
  const fl = new Graphics();
  const can2 = new Graphics();
  for (const a of [brecha, can]) if (a) st.addChild(a);
  if (luz.actor) st.addChild(luz.actor);
  st.addChild(mano.root, beam, lamp, fl, can2);
  // the FIN, written with her claw on the gown (warm letters that glow)
  const fin = new Printed(ctx.k, 'mano', 'FIN', { size: 120, fill: 0x2a1408, align: 0.5 });
  const finGlow = glowSprite(ctx, WARM, 2.4);
  st.addChild(finGlow, fin);
  ctx.plane(st, { z: 1000 });
  // fog between the planes, wisps out of the gutter
  const wisps = new Wisps(ctx, 12);
  ctx.plane(wisps, { z: 900 });
  // printed lines
  const grr = word(ctx.k, '¡GRRR!', { fontFamily: 'UnifrakturMaguntia', fontSize: 170, fill: 0x14100e, stroke: { color: PAPER, width: 8 } });
  grr.position.set(1400, 260);
  const garba = new Printed(ctx.k, 'brecha', '¡GARBA!', { size: 70, plate: PAPER, align: 0.5 });
  garba.position.set(320, 420);
  const margin = new Printed(ctx.k, 'mano', 'Lo que se derrama, se termina.', { size: 54, align: 0.5, plate: PAPER, w: 1200 });
  margin.position.set(960, 900);
  const book = new BookFrame(ctx, { head: 'Caperucita', title: 'Finales perdidos', folio: 65 });
  const ui = new Container();
  ui.addChild(grr, garba, margin, book);
  ctx.plane(ui, { z: 0, screen: true });
  const silenceAt = finSilence(ctx);
  prewarm(ctx, st, wisps, ui);
  // F (the claw starts the F) in the 'fin' scene's local time
  const FIN_AT = 1.0;
  return {
    update(lt, f: FrameInfo) {
      const step = Math.floor(lt * 12);
      // who is where, per shot
      let wolfOn = id !== 'huellas';
      let mOn = false;
      let mx = 1500;
      let my = 960;
      let lx = 1500;
      let ly = 640;
      let beamTo: [number, number] | null = null;
      let beamA = 0;
      let unravel = 0;
      let finP = 0;
      let finA = 0;
      let headDown = 0;
      let bx = -200;
      if (id === 'huellas') {
        // Garbancito trembles under the mushroom at the end of the trail
        gar.root.position.set(sx + 10 + (rm ? 0 : Math.sin(lt * 40) * 1.5), 900);
      } else if (id === 'lobo') {
        gar.root.position.set(sx + 10 + (rm ? 0 : Math.sin(lt * 46) * 2), 900);
        headDown = 0.12 * sm(seg(lt, 0, 2.5));
      } else if (id === 'general') {
        gar.root.position.set(sx + 10 + (rm ? 0 : Math.sin(lt * 46) * 1.6), 900);
        bx = -200 + sm(seg(lt, 0.2, 3.6)) * 420;
        lx = 1700 - sm(seg(lt, 0.4, 3.0)) * 380;
      } else if (id === 'mano') {
        // the fog opens; she walks between the lines, unhurried
        gar.root.position.set(sx + 10, 900);
        mOn = true;
        mx = 1880 - sm(seg(lt, 0.3, 5.8)) * 520;
        lx = 1700;
        bx = 240;
      } else if (id === 'fin') {
        gar.root.position.set(sx + 10, 900);
        mOn = true;
        mx = 1360;
        lx = 1720;
        bx = 240;
        finP = seg(lt, FIN_AT, FIN_AT + 1.4);
        finA = finP > 0 ? 1 - sm(seg(lt, 4.6, 5.8)) : 0;
        headDown = 0.3 * sm(seg(lt, 2.4, 3.2));
        unravel = sm(seg(lt, 3.0, 6.0));
      } else if (id === 'garbancito') {
        wolfOn = false;
        gar.root.position.set(sx + 10, 900);
        lx = 1180;
        beamTo = [sx, 820];
        beamA = env(lt, 0.4, 9, 0.8, 0.6);
        bx = sm(seg(lt, 5.0, 6.4)) * 300;
      } else if (id === 'va') {
        wolfOn = false;
        mOn = true;
        mx = 1360 + sm(seg(lt, 0, 3)) * 520;
        gar.root.position.set(sx + 10, 900);
        lx = 1180;
      } else if (id === 'margen') {
        gar.root.position.set(sx + 10, 900);
        mOn = true;
        mx = 1360;
        lx = 1720;
        bx = 240;
      }
      silenceAt(f.m);
      wolfC.visible = wolfOn;
      headC.rotation = headDown;
      // he leans over the letters (his head goes down with the whole hunch)
      if (lobo) lobo.rotation = -headDown * 0.35;
      // the unravel: the wolf is cut away from the feet up; loose lines fly off at the edge into the fog
      const um = unravelMask.clear();
      const cut = 960 - unravel * 900;
      um.rect(0, -400, 1920, cut + 400).fill(0xffffff);
      const sg = strands.clear();
      if (unravel > 0 && unravel < 1) {
        for (let i = 0; i < 70; i++) {
          const ph = (unravel * 3 + rnd(i)) % 1;
          const x0 = wolfC.x - 260 + rnd(i * 3) * 560;
          const y0 = cut + ph * 160 * (rm ? 0.4 : 1);
          const dx = (rnd(i * 5) - 0.5) * 140 * ph;
          const dy = -60 * ph;
          sg.moveTo(x0 + dx, y0 + dy).lineTo(x0 + dx + 30 + rnd(i) * 40, y0 + dy + (rnd(i + 1) - 0.5) * 30).stroke({ width: 2.5, color: 0x14100e, alpha: (1 - ph) * 0.9 });
        }
      }
      if (unravel >= 1) wolfC.visible = false;
      // La Mano: white paper among the lines; her claw writes the FIN
      mano.root.visible = mOn;
      mano.actor?.pose(lt, 0, 0, { flip: true });
      mano.root.position.set(mx, my);
      mano.hand.rotation = id === 'fin' && finP > 0 && finP < 1 ? Math.sin(lt * 20) * 0.15 : 0;
      fin.position.set(wolfC.x + 40, wolfC.y - 380 * wolfC.scale.y);
      fin.update(finP, finA);
      finGlow.position.set(fin.x, fin.y + 60);
      finGlow.alpha = finA * 0.8 * (rm ? 1 : 0.85 + 0.15 * wob(lt * 5, 1));
      // Brecha runs in from the page edge (and kneels later)
      if (brecha) {
        brecha.visible = id === 'general' || id === 'mano' || id === 'fin' || id === 'garbancito';
        brecha.pose(lt, bx, 960, { sy: id === 'garbancito' ? 1 - sm(seg(lt, 5.0, 6.0)) * 0.12 : 1 });
        if (brecha.puppet) brecha.puppet.brain.walk = id === 'general' && lt < 3.6 ? 1 : 0;
      }
      // Luzterna and Canelo arrive from the right (the gutter in the way); later her beam wraps Garbancito
      const showLC = id !== 'huellas' && id !== 'lobo';
      luz.actor && (luz.actor.visible = showLC);
      luz.actor?.pose(lt, lx + bob(lt, rm), ly + bob(lt + 1, rm, 8), { flip: true });
      if (can) {
        can.visible = showLC;
        can.pose(lt, lx + 170, 960, { flip: true });
      }
      const L = lanternAt(luz);
      lamp.visible = showLC;
      lamp.position.set(L[0], L[1]);
      lamp.alpha = 0.55 * (rm ? 1 : 0.9 + 0.1 * wob(lt * 6, 2));
      beam.set(L, beamTo ?? [L[0] - 200, L[1] + 100], 120, showLC ? beamA : 0);
      fl.clear();
      const tip = tailTip(can);
      if (tip && showLC) flame(fl, tip[0], tip[1], FLAME.normal * 0.8, lt, { rm, color: 0xffb060, core: 0xfff0c0 });
      // the can falls and rolls (garbancito shot)
      const cg = can2.clear();
      if (id === 'garbancito' && lt > 5.6) {
        const k = seg(lt, 5.6, 7.4);
        const x = bx + 40 + k * 260;
        cg.roundRect(x - 16, 940 - 40 * Math.sin(Math.min(1, k * 3) * Math.PI) * (1 - k), 32, 52, 6).fill(0xc8322a).stroke({ width: 3, color: 0x14100e });
      }
      grr.visible = id === 'lobo';
      grr.alpha = env(lt, 0.8, 4.6, 0.1, 0.4);
      grr.scale.set(rm ? 1 : 1 + 0.25 * Math.exp(-(lt - 0.8) * 5) * (lt > 0.8 ? 1 : 0));
      garba.update(seg(lt, 1.6, 2.0), id === 'general' ? env(lt, 1.5, 4.2, 0.1, 0.3) : 0);
      margin.update(seg(lt, 0.5, 2.6), id === 'margen' ? env(lt, 0.4, 4.2, 0.2, 0.3) : 0);
      wisps.update(lt, rm, id === 'mano' ? 1 - 0.6 * sm(seg(lt, 0, 3)) : 1);
      book.set({ open: 1, gutter: id === 'general' ? 0.9 : 0.55 });
      void step;
    },
    destroy() {
      filmDuck(ctx, 'film-f19-fin').release();
    },
  };
}

/** F19-11…F19-15: the Library again (watercolour): the page of the Echo, the flame, «borrador», her line */
function grito(ctx: SceneCtx, second: boolean): FilmSet {
  const rm = ctx.rm;
  const bg = new Graphics();
  bg.rect(-300, -300, 2520, 1700).fill(0xb8a078);
  for (let i = 0; i < 9; i++) {
    const x = -260 + i * 280;
    bg.rect(x, -100, 240, 940).fill(0x8a6a42).stroke({ width: 3, color: LB.sepia });
    for (let r = 0; r < 6; r++) for (let j = 0; j < 9; j++) bg.rect(x + 12 + j * 25, -80 + r * 150, 18, 120).fill([0x8a3a2a, 0x3a5a6a, 0x6a6a3a, 0x9a7a3a][(i + r + j) % 4]);
  }
  bg.rect(-300, 840, 2520, 600).fill(0xa08860);
  ctx.plane(bg, { z: 1300, bake: 'static' });
  const st = new Container();
  const can = ctx.actorAs('libros', ctx.canelo, second ? 280 : 300);
  const fl = new Graphics();
  // the open book in his paws: the page of the Echo (a Canelo in an admiral's hat), the text, the spilt end
  const bookC = new Container();
  const pg = new Graphics();
  pg.poly([-300, -200, 0, -170, 300, -200, 300, 160, 0, 190, -300, 160]).fill(LB.paper).stroke({ width: 4, color: LB.sepia });
  pg.moveTo(0, -170).lineTo(0, 190).stroke({ width: 3, color: LB.sepiaL });
  bookC.addChild(pg);
  const eco = ctx.stillAs('libros', STAND.caneloEco, 0.5, 1);
  if (eco) {
    eco.scale.set(240 / eco.texture.height);
    eco.position.set(-150, 120);
    bookC.addChild(eco);
  }
  const txt = new Printed(ctx.k, 'print', 'El Canelo de esta caja no volvió. Lo buscaron…', { size: 26, w: 250, fill: LB.sepia });
  txt.position.set(30, -150);
  bookC.addChild(txt);
  // the spilt ink at the end of the page
  const spill = new Graphics();
  spill.ellipse(170, 80, 120, 50).fill({ color: 0x1a1410, alpha: 0.85 });
  for (let i = 0; i < 6; i++) spill.ellipse(150 + i * 26, 110 + i * 12, 16 - i, 40 + i * 6).fill({ color: 0x1a1410, alpha: 0.8 });
  bookC.addChild(spill);
  const luz = luzOf(ctx, 290, 'libros');
  const beam = new Beam(ctx);
  const mano = manoFigure(ctx, 300, { bake: 'libros' });
  if (can) st.addChild(can);
  st.addChild(bookC, fl, mano.root);
  if (luz.actor) st.addChild(luz.actor);
  st.addChild(beam);
  ctx.plane(st, { z: 1000 });
  const scream = new Printed(ctx.k, 'canelo', '¡LUZ!', { size: 160, tremble: 9, align: 0.5 });
  scream.position.set(1240, 260);
  const border = new Printed(ctx.k, 'mano', 'Ese también es un borrador.', { size: 52, align: 0.5, plate: LB.paper, w: 1100 });
  border.position.set(1100, 170);
  const luzLine = new Printed(ctx.k, 'luz', 'Es otro Canelo, gordo. De otra caja.', { size: 56, align: 0.5, plate: LB.paper, w: 1200 });
  luzLine.position.set(960, 940);
  const book = new BookFrame(ctx, { head: 'Ex Libris', title: 'Finales perdidos', folio: 66 });
  const ui = new Container();
  ui.addChild(scream, border, luzLine, book);
  ctx.plane(ui, { z: 0, screen: true });
  const silenceAt = finSilence(ctx);
  prewarm(ctx, st, ui);
  return {
    update(lt, f) {
      silenceAt(f.m);
      const cx = second ? 700 : 760;
      can?.pose(lt, cx, 960, {});
      if (can?.puppet) can.puppet.brain.crouch = 0.25;
      bookC.position.set(cx + 60, 760);
      bookC.scale.set(second ? 0.9 : 1);
      txt.update(1, 1);
      // the flame: it drops when he reads (first shot, 7 → 9 s) and is slow to come back
      const drop = second ? 1 : sm(seg(lt, 7.0, 8.4)) * (1 - 0.35 * sm(seg(lt, 9.5, 12)));
      const tip = tailTip(can);
      fl.clear();
      if (tip) flame(fl, tip[0], tip[1], FLAME.normal * (1 - drop * 0.6), lt, { rm, line: 0x6a2a0a });
      scream.update(seg(lt, 0, 0.3), second ? 0 : env(lt, 0, 2.6, 0.05, 0.5), lt);
      // second shot: La Mano passes behind him (0 → 6), glances at the page; then she floats in and closes the book
      mano.root.visible = second && lt < 6.5;
      mano.actor?.pose(lt, 0, 0, { flip: true });
      mano.root.position.set(1900 - sm(seg(lt, 0, 6)) * 1500, 860);
      mano.root.alpha = second ? 0.92 : 0;
      border.update(seg(lt, 1.4, 3.4), second ? env(lt, 1.3, 6.0, 0.2, 0.4) : 0);
      const lIn = second ? sm(seg(lt, 6.0, 8.0)) : 0;
      luz.actor && (luz.actor.visible = second);
      luz.actor?.pose(lt, 2150 - lIn * 970 + bob(lt, rm), 640 + bob(lt + 1, rm, 8), { flip: true });
      const close = second ? sm(seg(lt, 7.4, 8.6)) : 0;
      pg.scale.x = 1 - close * 0.5;
      bookC.skew.y = -close * 0.1;
      if (eco) eco.alpha = 1 - close;
      txt.alpha = 1 - close;
      spill.alpha = 1 - close;
      beam.set(lanternAt(luz), [bookC.x, bookC.y], 90, second ? env(lt, 6.8, 9.0, 0.3, 0.5) * 0.85 : 0);
      luzLine.update(seg(lt, 8.6, 10.6), second ? env(lt, 8.5, 12, 0.2, 0.4) : 0);
      book.set({ open: 1 });
    },
  };
}
