/**
 * H85 · PH «La oscuridad» (escena B + C1–C3) — HER BRAVEST SCENE, told with light and its absence. The Library's
 * watercolour in the dark, only her blue lantern lit; Canelo faints (eyes closed, the flame almost nothing); La Mano's
 * shadow grows on the far wall: the light gives them away. She looks at the lantern, at the shadow, at Canelo and
 * Cerito — and TURNS IT OFF, for the first time. Black with the paper's texture (never more than 1.5 s without a point
 * of reference); a rim of moon on her silhouette, trembling (her fear of the dark, confessed in H78: fear, not weakness);
 * Cerito frays without the light. Then the crew's eyes light up, two by two, and make her a runway; two eyes drag Canelo
 * by the cape; La Mano's pale outline passes a metre away and doesn't see them. A door, moonlight on a sea of pages: she
 * lights the lantern again (a wave of blue); Cerito calms; a tiny ridiculous bow of thanks. The crane of light; the ship;
 * «Luz… ¿ya llegamos?» / «Ya, gordo. Duérmete.» Nothing physical about her: she floats, carries with the beam, trembles
 * because she is afraid. Guion: historia-v2/guiones/acto-3/h85-la-ficha-original.md (B1–B13, C1–C3).
 */
import { Container, Graphics, Sprite, TilingSprite, type Texture } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { Beam, env, flame, FLAME, glowSprite, kitTex, lanternAt, LB, luzOf, bob, manoFigure, Printed, rnd, seg, sm, StaticKitten, STAND, tailTip, wob, type LuzRig, prewarm } from '../kit';

const NIGHT = 0x1a2030;
const EYE_Y = 0xf2d24a;
const EYE_G = 0x9ae86a;

/** a pair of cat eyes in the dark: almond shapes with a slit, a soft glow (fade in with «Reducir destellos») */
class Eyes extends Container {
  private g = new Graphics();
  private glow: Sprite;
  constructor(ctx: SceneCtx, color: number, size = 1) {
    super();
    this.glow = glowSprite(ctx, color, 0.55 * size);
    this.glow.alpha = 0.5;
    const s = size;
    for (const dx of [-26 * s, 26 * s]) {
      this.g.ellipse(dx, 0, 15 * s, 10 * s).fill(color);
      this.g.ellipse(dx, 0, 3 * s, 9 * s).fill(0x0a0a0a);
    }
    this.addChild(this.glow, this.g);
  }
  /** on 0..1; blink = 0..1 (closed) */
  set(on: number, blink = 0) {
    this.visible = on > 0.01;
    this.alpha = on;
    this.g.scale.y = 1 - blink * 0.9;
  }
}

/** the black of the lantern off: paper texture in the dark (never a dead black screen) */
function blackPaper(ctx: SceneCtx): Container {
  const c = new Container();
  c.addChild(new Graphics().rect(-400, -400, 2720, 1880).fill(0x07080b));
  const t = ctx.tex('lb:paper');
  if (t) {
    const ts = new TilingSprite({ texture: t, width: 2720, height: 1880 });
    ts.position.set(-400, -400);
    ts.tint = 0x2a2c34;
    ts.alpha = 0.55;
    c.addChild(ts);
  }
  return c;
}
/** the side corridor in the dark (watercolour flats in night tones) */
function corridor(ctx: SceneCtx): Container {
  const c = new Container();
  const g = new Graphics();
  g.rect(-400, -400, 2720, 1880).fill(0x0e1118);
  for (let i = 0; i < 10; i++) {
    const x = -360 + i * 270;
    g.rect(x, -200, 230, 1040).fill(0x161b26).stroke({ width: 3, color: 0x0a0c12 });
    for (let r = 0; r < 6; r++) for (let j = 0; j < 8; j++) g.rect(x + 14 + j * 26, -170 + r * 160, 20, 130).fill([0x1e2432, 0x232a3a, 0x1a2030][(i + r + j) % 3]);
  }
  g.rect(-400, 840, 2720, 700).fill(0x141824);
  // the far wall where her shadow will grow
  g.rect(1300, 120, 520, 720).fill(0x1c2230);
  c.addChild(g);
  return c;
}
/** a moon rim on a silhouette: a pale copy behind, offset, then black on top */
function rimFigure(ctx: SceneCtx, slug: string, size: number): { root: Container; set(lt: number, tremble: number, rim: number): void } {
  const root = new Container();
  const rim = ctx.silhouette(slug, 0.5, 0.97);
  const body = ctx.silhouette(slug, 0.5, 0.97);
  if (rim && body) {
    const k = size / body.texture.height;
    rim.scale.set(k);
    body.scale.set(k);
    rim.tint = 0xc8d8f4;
    body.tint = 0x050608;
    root.addChild(rim, body);
  }
  return {
    root,
    set(lt, tremble, rimA) {
      const st = Math.floor(lt * 14);
      if (rim) {
        rim.alpha = rimA;
        rim.position.set(-9 + (rnd(st) - 0.5) * tremble, -7 + (rnd(st + 3) - 0.5) * tremble);
      }
      if (body) body.position.set((rnd(st + 7) - 0.5) * tremble * 0.6, (rnd(st + 9) - 0.5) * tremble * 0.6);
    },
  };
}

const CREW = [STAND.hipolito, STAND.murciegato, STAND.aranya];
const mod: SetModule = {
  cats: ({ canelo }) => [{ slug: canelo, bake: 'libros' }, { slug: 'luzterna', bake: 'libros' }, 'luzterna', STAND.cerito, ...CREW.map((s) => ({ slug: s, bake: 'libros' })), { slug: STAND.mano, bake: 'libros' }],
  async build(ctx: SceneCtx): Promise<FilmSet> {
    const id = ctx.scene.id;
    if (id === 'negro' || id === 'ojos') return dark(ctx, id === 'ojos');
    if (id === 'grua' || id === 'barco') return ship(ctx, id === 'barco');
    return lit(ctx);
  },
};
export default mod;

/** pasillo · sombra · decide · apaga · puerta · reverencia: the corridor in the dark with her lantern (or the door) */
function lit(ctx: SceneCtx): FilmSet {
  const rm = ctx.rm;
  const id = ctx.scene.id;
  const outside = id === 'puerta' || id === 'reverencia';
  if (outside) {
    // the door to the outside: moonlight on a sea of pages
    const g = new Graphics();
    g.rect(-400, -400, 2720, 1880).fill(0x07080b);
    g.rect(-400, -400, 2720, 900).fill(0x1c2a44);
    g.circle(1500, 200, 80).fill(0xe8eef8);
    g.rect(-400, 500, 2720, 1000).fill(0x2a3448);
    for (let i = 0; i < 40; i++) g.poly([-300 + (i % 10) * 260 + Math.floor(i / 10) * 60, 560 + Math.floor(i / 10) * 120, -160 + (i % 10) * 260 + Math.floor(i / 10) * 60, 540 + Math.floor(i / 10) * 120, -120 + (i % 10) * 260, 600 + Math.floor(i / 10) * 120]).fill({ color: 0xc8d0dc, alpha: 0.35 });
    if (id === 'puerta') g.rect(-400, -400, 640, 1880).fill(0x07080b).rect(1680, -400, 1040, 1880).fill(0x07080b);
    ctx.plane(g, { z: 1300, bake: 'static' });
  } else ctx.plane(corridor(ctx), { z: 1300, bake: 'static' });
  const st = new Container();
  // La Mano's shadow on the far wall (it grows: she comes toward the light)
  const shadow = new Graphics();
  shadow.poly([0, 0, 60, -40, 70, -220, 40, -300, 70, -360, 20, -390, -20, -360, -10, -300, -40, -220, -30, -40]).fill({ color: 0x000000, alpha: 0.75 });
  shadow.position.set(1560, 840);
  st.addChild(shadow);
  // the light pool of the lantern on the floor and the wall (its own "lighting": an additive blue)
  const pool = glowSprite(ctx, LB.lantern, 6);
  pool.alpha = 0.35;
  st.addChild(pool);
  const can = ctx.actorAs('libros', ctx.canelo, 250);
  const cer = new StaticKitten(ctx, 130, STAND.cerito);
  const luz = luzOf(ctx, id === 'decide' ? 520 : 290, 'libros');
  const beam = new Beam(ctx);
  const fl = new Graphics();
  const lamp = glowSprite(ctx, LB.lantern, 1.2);
  const crew = CREW.map((s) => ctx.actorAs('libros', s, s === STAND.hipolito ? 260 : 220));
  if (outside) for (const c of crew) if (c) st.addChild(c);
  if (can) st.addChild(can);
  st.addChild(cer);
  if (luz.actor) st.addChild(luz.actor);
  st.addChild(beam, lamp, fl);
  ctx.plane(st, { z: 1000 });
  // dust falling from the collapse
  const dust = new Graphics();
  ctx.plane(dust, { z: 900 });
  // the dark that falls when the lantern goes out (and lifts when it comes back)
  const dark = new Graphics().rect(-400, -400, 2720, 1880).fill(0x050608);
  ctx.plane(dark, { z: 0, screen: true });
  const gordo = new Printed(ctx.k, 'luz', '¿Gordo?', { size: 64, align: 0.5, plate: LB.paper });
  gordo.position.set(1180, 300);
  ctx.plane(gordo, { z: 0, screen: true });
  prewarm(ctx, st, dust, gordo, dark);
  return {
    update(lt) {
      // where everybody is, per shot
      let lx = 1200;
      let ly = 600;
      let canX = 800;
      let lampOn = 1;
      let look = 0;
      if (id === 'pasillo') {
        // they come out of the collapse (from the left); he collapses at 2.6
        canX = 500 + sm(seg(lt, 0, 2.4)) * 300;
        lx = 380 + sm(seg(lt, 0, 2.6)) * 700;
      } else if (id === 'sombra') {
        lx = 1080;
      } else if (id === 'decide') {
        lx = 1180;
        ly = 760;
        // she looks: at the lantern (down), at the shadow (right), at them (left)
        look = lt < 1.6 ? 0 : lt < 3.2 ? 0.9 : -0.9;
      } else if (id === 'apaga') {
        lx = 960;
        ly = 700;
        // the flame shrinks to a point and goes out (B5)
        lampOn = 1 - sm(seg(lt, 0.8, 2.2));
      } else if (id === 'puerta') {
        lx = 960;
        ly = 640;
        canX = 760;
        // the lantern comes back on (a wave)
        lampOn = sm(seg(lt, 1.4, 2.4));
      } else if (id === 'reverencia') {
        lx = 980;
        ly = 600;
        canX = 520;
      }
      const fallen = id !== 'pasillo' || lt > 2.6;
      can?.pose(lt, canX, 940, { rot: fallen ? (id === 'reverencia' || id === 'puerta' ? -1.45 : -1.5) * (id === 'pasillo' ? sm(seg(lt, 2.6, 3.2)) : 1) : 0 });
      if (can?.puppet) can.puppet.brain.sleeping = fallen;
      cer.position.set(canX + 150, 950);
      cer.update(lt, { stare: 0.8, fray: id === 'puerta' ? 1 - sm(seg(lt, 2.4, 5.0)) : 0 });
      const tremble = id === 'decide' ? (rm ? 0.5 : 1.5) : 0;
      luz.actor?.pose(lt, lx + bob(lt, rm) + (rnd(Math.floor(lt * 14)) - 0.5) * tremble, ly + bob(lt + 1, rm, 8), { flip: id !== 'pasillo' });
      if (luz.actor?.puppet) luz.actor.puppet.brain.look = look;
      if (id === 'reverencia' && luz.actor) {
        // the tiny ridiculous bow (5.0 → 7.0)
        const bow = Math.sin(seg(lt, 5.0, 7.0) * Math.PI);
        luz.actor.rotation = (rm ? 0.5 : 1) * bow * 0.45;
      }
      const L = lanternAt(luz);
      lamp.position.set(L[0], L[1]);
      lamp.alpha = lampOn * (rm ? 0.6 : 0.55 + 0.05 * wob(lt * 6, 2));
      lamp.scale.set(1.2 * Math.max(0.05, lampOn));
      pool.position.set(L[0], 860);
      pool.alpha = 0.35 * lampOn;
      pool.scale.set(6 * (id === 'puerta' ? 0.4 + lampOn * 0.8 : 1));
      // the beam nudges him (B2), later nothing
      const nudge = id === 'pasillo' ? env(lt, 4.4, 9.8, 0.4, 0.5) : 0;
      beam.set(L, [canX, 900], 80, nudge * 0.85 * lampOn);
      const tip = tailTip(can);
      fl.clear();
      if (tip) flame(fl, tip[0], tip[1], id === 'pasillo' && lt < 2.6 ? FLAME.baja : FLAME.minima, lt, { rm, line: 0x6a2a0a });
      // her shadow grows on the far wall (sombra / decide)
      const grow = id === 'sombra' ? sm(seg(lt, 0.2, 5.0)) : id === 'decide' ? 1 : id === 'pasillo' ? 0 : 1;
      shadow.visible = !outside && (id === 'sombra' || id === 'decide' || id === 'apaga');
      shadow.scale.set(0.6 + grow * 0.9);
      shadow.alpha = lampOn;
      for (const [i, c] of crew.entries()) {
        if (!c) continue;
        c.visible = outside;
        c.pose(lt, 1280 + i * 190, 960, { flip: true });
      }
      const dg = dust.clear();
      if (id === 'pasillo')
        for (let i = 0; i < 40; i++) {
          const ph = (lt * 0.15 + rnd(i)) % 1;
          dg.circle(200 + rnd(i * 3) * 1500, -60 + ph * 1100, 2 + rnd(i) * 2).fill({ color: 0xa8b0c0, alpha: 0.4 * (1 - ph) });
        }
      gordo.update(seg(lt, 5.4, 6.0), id === 'pasillo' ? env(lt, 5.3, 9.6, 0.1, 0.4) : 0);
      dark.alpha = id === 'apaga' || id === 'puerta' ? (1 - lampOn) * (id === 'puerta' ? 0.75 : 0.9) : 0;
      dark.visible = dark.alpha > 0.003;
    },
    anchor: (n) => (n === 'lantern' ? lanternAt(luz) : null),
  };
}

/** negro · ojos: the black with paper texture; her moon-rimmed silhouette trembling; Cerito fraying; the eyes */
function dark(ctx: SceneCtx, moving: boolean): FilmSet {
  const rm = ctx.rm;
  const rf = ctx.rf;
  ctx.plane(blackPaper(ctx), { z: 1300, bake: 'static' });
  const st = new Container();
  const her = rimFigure(ctx, 'luzterna', 300);
  st.addChild(her.root);
  // Cerito: a faint static outline that comes apart at the edges without the light
  const cer = new StaticKitten(ctx, 130, STAND.cerito);
  st.addChild(cer);
  // the crew's eyes (yellow and green), and the two that take Canelo
  const eyes = Array.from({ length: 10 }, (_, i) => new Eyes(ctx, i % 3 === 1 ? EYE_G : EYE_Y, 0.9 + (i % 2) * 0.2));
  for (const e of eyes) st.addChild(e);
  // La Mano: a pale outline passing a metre away (B10)
  const mano = manoFigure(ctx, 330, { bake: 'libros' });
  mano.root.alpha = 0;
  st.addChild(mano.root);
  // Canelo dragged by the cape: only his dark shape against the paper (barely), and his ember
  const ember = glowSprite(ctx, 0xff8a2a, 0.35);
  st.addChild(ember);
  ctx.plane(st, { z: 1000 });
  prewarm(ctx, st);
  return {
    update(lt) {
      const step = Math.floor(lt * 12);
      // B6: the first second and a half is the blackest (never longer); B7: the rim of moon appears, she trembles
      const rim = moving ? 0.9 : sm(seg(lt, 1.4, 3.0)) * 0.95;
      const tremble = rm ? 1.2 : 4;
      her.set(lt, tremble, rim);
      const hx = moving ? 1260 - sm(seg(lt, 2.0, 12)) * 760 : 1260;
      her.root.position.set(hx + bob(lt, rm, 8), 640 + bob(lt + 1, rm, 6));
      // Cerito frays: he blinks out at the edges (his static is what we see in the dark)
      cer.position.set(moving ? 760 - sm(seg(lt, 2, 12)) * 500 : 760, 950);
      cer.alpha = 0.55;
      cer.update(lt, { stare: 0.5, fray: 0.9 });
      cer.visible = lt > 1.5 || moving;
      // the eyes: two at 6.6, two more at 7.6, then the rest (B8); in «ojos» they line up like runway lights
      eyes.forEach((e, i) => {
        const t0 = moving ? 0 : 6.6 + Math.floor(i / 2) * 0.9;
        const on = rf ? sm(seg(lt, t0, t0 + 0.8)) : seg(lt, t0, t0 + 0.12) > 0 ? 1 : 0;
        const blink = rnd(Math.floor(lt * 0.7) * 13 + i) > 0.86 && !rm ? Math.max(0, 1 - Math.abs(((lt * 0.7) % 1) - 0.5) * 8) : 0;
        if (!moving) {
          // around her, scattered in the dark
          e.position.set(500 + rnd(i * 7) * 1000, 500 + rnd(i * 3) * 380);
        } else {
          // a runway toward the door on the left; two pairs (i 0, 1) go to Canelo and drag him
          const k = i / eyes.length;
          const drift = sm(seg(lt, 0, 12));
          const x = 1500 - k * 1300 - drift * 300;
          const y = 900 - Math.sin(k * Math.PI) * 120;
          if (i < 2) e.position.set(1100 - drift * 700 + i * 70, 860);
          else e.position.set(x, y + (rm ? 0 : Math.sin(lt * 2 + i) * 4));
        }
        e.set(on * (moving ? 1 - sm(seg(lt, 15.0, 17.0)) * 0.3 : 1), blink);
      });
      ember.visible = moving;
      ember.position.set(1060 - sm(seg(lt, 0, 12)) * 700, 900);
      ember.alpha = 0.5 + (rm ? 0 : 0.2 * rnd(step));
      // B10 (8.5 → 15.5 in «ojos»): the pale outline of La Mano passes, slowly, a metre away; doesn't see them
      const pass = moving ? seg(lt, 8.5, 15.5) : 0;
      mano.root.visible = pass > 0 && pass < 1;
      mano.actor?.pose(lt, 0, 0, { flip: true });
      mano.root.position.set(1950 - pass * 1700, 780);
      mano.root.alpha = 0.22 * Math.sin(pass * Math.PI);
      if (mano.actor?.puppet) mano.actor.puppet.tint = 0x9aa4b8;
    },
  };
}

/** grua · barco: the crane of light over a sea of pages; the ship, his blanket, one eye open */
function ship(ctx: SceneCtx, onBoard: boolean): FilmSet {
  const rm = ctx.rm;
  const g = new Graphics();
  g.rect(-400, -400, 2720, 1880).fill(NIGHT);
  g.circle(1520, 180, 70).fill(0xe8eef8);
  for (let i = 0; i < 60; i++) g.circle(rnd(i) * 2400 - 240, rnd(i + 5) * 500 - 200, 1.5 + rnd(i + 2) * 2).fill({ color: 0xe8eef8, alpha: 0.6 });
  g.rect(-400, 560, 2720, 1000).fill(0x2a3448);
  for (let i = 0; i < 40; i++) g.poly([-300 + (i % 10) * 260 + Math.floor(i / 10) * 60, 600 + Math.floor(i / 10) * 120, -160 + (i % 10) * 260, 580 + Math.floor(i / 10) * 120, -120 + (i % 10) * 260, 640 + Math.floor(i / 10) * 120]).fill({ color: 0xc8d0dc, alpha: 0.3 });
  ctx.plane(g, { z: 1400, bake: 'static' });
  const deck = new Graphics();
  if (onBoard) {
    deck.poly([-300, 1200, 2220, 1200, 2220, 820, -300, 860]).fill(0x5a3a22).stroke({ width: 4, color: 0x2a1a0e });
    for (let i = 0; i < 7; i++) deck.moveTo(-300, 880 + i * 46).lineTo(2220, 840 + i * 52).stroke({ width: 2, color: 0x2a1a0e, alpha: 0.6 });
    // his blanket
    deck.roundRect(560, 900, 520, 120, 40).fill(0x8a3a3a).stroke({ width: 4, color: 0x3a1a1a });
    for (let i = 0; i < 6; i++) deck.rect(580 + i * 84, 910, 40, 100).fill({ color: 0xc8a050, alpha: 0.35 });
  } else {
    // the ship far away on the sea of pages
    deck.poly([1500, 700, 1820, 700, 1780, 750, 1540, 750]).fill(0x5a3a22).stroke({ width: 3, color: 0x2a1a0e });
    deck.rect(1655, 520, 8, 180).fill(0x2a1a0e);
    deck.poly([1663, 530, 1760, 640, 1663, 660]).fill(0xd8d0c0);
  }
  ctx.plane(deck, { z: 1100, bake: 'static' });
  const st = new Container();
  const can = ctx.actorAs('libros', ctx.canelo, onBoard ? 280 : 200);
  const cer = new StaticKitten(ctx, onBoard ? 120 : 100, STAND.cerito);
  const luz: LuzRig = luzOf(ctx, onBoard ? 320 : 260, 'libros');
  const beam = new Beam(ctx);
  const fl = new Graphics();
  if (can) st.addChild(can);
  st.addChild(cer);
  if (luz.actor) st.addChild(luz.actor);
  st.addChild(beam, fl);
  ctx.plane(st, { z: 1000 });
  const q = new Printed(ctx.k, 'canelo', 'Luz… ¿ya llegamos?', { size: 50, align: 0.5, fill: 0x6a5a4a, plate: LB.paper });
  q.position.set(820, 300);
  const a = new Printed(ctx.k, 'luz', 'Ya, gordo. Duérmete.', { size: 58, align: 0.5, plate: LB.paper });
  a.position.set(1180, 220);
  const ui = new Container();
  ui.addChild(q, a);
  ctx.plane(ui, { z: 0, screen: true });
  prewarm(ctx, st, ui);
  return {
    update(lt) {
      if (!onBoard) {
        // C1: he floats on her beam over the pages toward the ship; Cerito walks below, following the light
        const k = sm(seg(lt, 0.4, 8.0));
        const cx = 300 + k * 1150;
        const cy = 640 - Math.sin(k * Math.PI) * 120 - (rm ? 0 : Math.sin(lt * 1.6) * 8);
        can?.pose(lt, cx, cy, { rot: -1.4 });
        if (can?.puppet) can.puppet.brain.sleeping = true;
        luz.actor?.pose(lt, cx - 220 + bob(lt, rm), cy - 260 + bob(lt + 1, rm, 8), {});
        cer.position.set(cx + 20, 900);
        cer.update(lt, { stare: 0.7, clear: 0.15 });
        beam.set(lanternAt(luz), [cx, cy - 40], 90, 0.85);
        fl.clear();
        const tip = tailTip(can);
        if (tip) flame(fl, tip[0], tip[1], FLAME.minima, lt, { rm, line: 0x6a2a0a });
        q.update(0, 0);
        a.update(0, 0);
        return;
      }
      // C2–C3: she lays him on his blanket; he opens one eye; she settles his scarf with the beam
      const land = sm(seg(lt, 0.0, 1.6));
      can?.pose(lt, 820, 960 - (1 - land) * 120, { rot: -1.45 });
      if (can?.puppet) can.puppet.brain.sleeping = lt < 3.0 || lt > 9.6;
      luz.actor?.pose(lt, 1260 + bob(lt, rm), 620 + bob(lt + 1, rm, 8), { flip: true });
      cer.position.set(1010, 960);
      cer.update(lt, { stare: 0.5, clear: 0.2 });
      const settle = env(lt, 6.4, 9.0, 0.4, 0.5);
      beam.set(lanternAt(luz), [900, 860], 70, Math.max(1 - land, settle) * 0.85);
      fl.clear();
      const tip = tailTip(can);
      // the flame comes back a little and stays low (60 %: it will never come back whole)
      if (tip) flame(fl, tip[0], tip[1], FLAME.minima + (FLAME.sesenta - FLAME.minima) * sm(seg(lt, 8.0, 11.0)), lt, { rm, line: 0x6a2a0a });
      q.update(seg(lt, 3.2, 4.8), env(lt, 3.1, 7.0, 0.2, 0.4), lt);
      a.update(seg(lt, 6.8, 8.4), env(lt, 6.7, 11.4, 0.2, 0.4));
    },
  };
}

void kitTex;
export type { Texture };
