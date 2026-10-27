/**
 * F28 · «Firma» — the sets (see ./index.ts).
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { LedPanel, POP, Spots, pixelText } from '../../../styles/pop';
import { NG_BEAT } from '../music';
import {
  Beam,
  Bitacora,
  Dressed,
  FLAME,
  GlassCube,
  RuleBoard,
  SLUG,
  StaticKitten,
  bob,
  bokeh,
  burst,
  caneloFlame,
  demoOf,
  flightCases,
  flightOf,
  glowAt,
  lanternAt,
  luzOf,
  outBack,
  rnd,
  seg,
  signature,
  sm,
  stadium,
  word,
} from '../kit';

const beatK = (m: number, k = 7) => Math.exp(-((m / NG_BEAT) % 1) * k);
const dress = (ctx: SceneCtx, slug: string, size: number) => {
  const a = ctx.actor(slug, size);
  return new Dressed(a, (_h, b, g) => signature(b, g));
};

// ------------------------------------------------------------------ the magazine cover (built into a container w × h)
function cover(ctx: SceneCtx, W: number, H: number): { root: Container; firma: Dressed; sheen: Sprite } {
  const k = ctx.k;
  const root = new Container();
  const g = new Graphics();
  // coated paper: cream to gold, a soft studio sweep behind her
  for (let i = 0; i < 30; i++) g.rect(0, (H * i) / 30, W, H / 30 + 1).fill(i < 16 ? 0xfbf1dc : 0xf3dcae);
  g.ellipse(W * 0.5, H * 0.62, W * 0.42, H * 0.5).fill({ color: 0xffffff, alpha: 0.55 });
  root.addChild(g);
  const firma = dress(ctx, SLUG.firma, H * 0.92);
  if (firma.actor) root.addChild(firma.actor);
  // the masthead (embossed: a shadow and a highlight under the letters)
  const mast = 'GATÍSIMA';
  const ms = { fontFamily: 'Playfair Display', fontWeight: '700' as const, fontSize: H * 0.2, letterSpacing: H * 0.012 };
  const sh = word(k, mast, { ...ms, fill: 0x8a6a2a });
  sh.position.set(W / 2 + 5, H * 0.13 + 6);
  sh.alpha = 0.45;
  const hl = word(k, mast, { ...ms, fill: 0xffffff });
  hl.position.set(W / 2 - 2, H * 0.13 - 2);
  const mt = word(k, mast, { ...ms, fill: 0xc8102e });
  mt.position.set(W / 2, H * 0.13);
  root.addChild(sh, hl, mt);
  const iss = word(k, 'EDICIÓN DE GIRA · LA NOCHE DE LAS ESTRELLAS', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: H * 0.026, fill: 0x3a2108, letterSpacing: 4 });
  iss.position.set(W / 2, H * 0.245);
  root.addChild(iss);
  // the headline (Anton, white with an ink edge: it sits over her)
  const h1 = word(k, 'FIRMA:', { fontFamily: 'Anton', fontSize: H * 0.13, fill: 0xffffff, stroke: { color: 0x2a1408, width: H * 0.012, join: 'round' }, letterSpacing: 6 }, 0);
  h1.anchor.set(0, 0.5);
  h1.position.set(W * 0.05, H * 0.42);
  const h2 = word(k, '«EL SHOW MÁS GRANDE', { fontFamily: 'Anton', fontSize: H * 0.075, fill: POP.gold, stroke: { color: 0x2a1408, width: H * 0.01, join: 'round' } }, 0);
  h2.anchor.set(0, 0.5);
  h2.position.set(W * 0.05, H * 0.53);
  const h3 = word(k, 'DEL ARCHIVO»', { fontFamily: 'Anton', fontSize: H * 0.075, fill: POP.gold, stroke: { color: 0x2a1408, width: H * 0.01, join: 'round' } }, 0);
  h3.anchor.set(0, 0.5);
  h3.position.set(W * 0.05, H * 0.61);
  const strap = new Graphics().rect(0, H * 0.86, W, H * 0.1).fill(0xc8102e);
  const s1 = word(k, 'ESTA NOCHE · ESCENARIO PRINCIPAL', { fontFamily: 'Anton', fontSize: H * 0.055, fill: 0xffffff, letterSpacing: 8 });
  s1.position.set(W / 2, H * 0.91);
  const side = word(k, 'Un show sin estrella es un ensayo', { fontFamily: 'Playfair Display', fontStyle: 'italic', fontWeight: '700', fontSize: H * 0.034, fill: 0x3a2108, wordWrap: true, wordWrapWidth: W * 0.24, align: 'right' }, 0);
  side.anchor.set(1, 0.5);
  side.position.set(W * 0.96, H * 0.45);
  const bar = new Graphics();
  for (let i = 0; i < 22; i++) bar.rect(W * 0.86 + i * 4, H * 0.7, i % 3 ? 2 : 3, H * 0.1).fill(0x1a0b2e);
  bar.rect(W * 0.85, H * 0.69, W * 0.12, H * 0.13).stroke({ width: 2, color: 0x1a0b2e });
  root.addChild(h1, h2, h3, strap, s1, side, bar);
  const sheen = new Sprite(ctx.tex('pop:flare')!);
  sheen.anchor.set(0.5);
  sheen.blendMode = 'add';
  sheen.rotation = -1.0;
  sheen.scale.set(W / 300, 6);
  sheen.alpha = 0;
  root.addChild(sheen);
  return { root, firma, sheen };
}

// ------------------------------------------------------------------ 1 · portada (0–4.4)
export const portada: SetModule = {
  cats: [SLUG.firma],
  build(ctx: SceneCtx): FilmSet {
    const st = stadium(ctx, { seed: 28 });
    const main = st.wall.main;
    const cv = cover(ctx, 1600, 900);
    main.content.addChild(cv.root);
    // the side screens: the cover's colours; the strip: ESTA NOCHE
    for (const p of [st.wall.left, st.wall.right]) p.content.addChild(new Graphics().rect(0, 0, 600, 880).fill(0xc8102e), Object.assign(word(ctx.k, 'GATÍSIMA', { fontFamily: 'Playfair Display', fontWeight: '700', fontSize: 120, fill: 0xffffff }), { x: 300, y: 440, rotation: -Math.PI / 2 }));
    const tk = word(ctx.k, 'ESTA NOCHE  ·  ESCENARIO PRINCIPAL  ·  ESTA NOCHE  ·  ESCENARIO PRINCIPAL  ·  ', { fontFamily: 'Anton', fontSize: 72, fill: POP.gold, letterSpacing: 6 }, 0);
    tk.anchor.set(0, 0.5);
    tk.position.set(0, 64);
    st.wall.strip.content.addChild(new Graphics().rect(0, 0, 2200, 128).fill(0x1a0b2e), tk);
    const flash = new Graphics().rect(0, 0, 1600, 900).fill(0xffffff);
    main.content.addChild(flash);
    return {
      update(lt, f) {
        const rm = f.rm;
        st.update(lt, { rm, phones: 0.45 });
        // the cover lands at 0.55 s: from big and tilted to its place, a white flash on the impact
        const p = seg(lt, 0.2, 0.55);
        cv.root.scale.set(rm ? 1 : 1 + (1 - sm(p)) * 0.6);
        cv.root.rotation = rm ? 0 : (1 - sm(p)) * -0.12;
        cv.root.pivot.set(800, 450);
        cv.root.position.set(800, 450);
        cv.root.alpha = rm ? sm(seg(lt, 0, 0.5)) : lt < 0.2 ? 0 : 1;
        flash.alpha = Math.max(0, 1 - seg(lt, 0.55, 0.9)) * (lt >= 0.55 ? (ctx.rf ? 0.25 : 0.8) : 0);
        cv.firma.actor?.pose(lt, 1040, 900, {});
        cv.firma.follow();
        cv.sheen.alpha = lt > 1.2 && lt < 2.6 ? Math.sin(seg(lt, 1.2, 2.6) * Math.PI) * 0.7 : 0;
        cv.sheen.position.set(-200 + seg(lt, 1.2, 2.6) * 2000, 450);
        tk.position.x = -((lt * 240) % (tk.width / 2));
      },
    };
  },
};

// ------------------------------------------------------------------ 2 · teaser (3.9–13.9): cuts on the beat
export const teaser: SetModule = {
  cats: [SLUG.cerito],
  build(ctx: SceneCtx): FilmSet {
    const k = ctx.k;
    const tex = (n: string) => ctx.tex(n);
    const T0 = 3.9;
    // the stage in the dark (haze, a floor line), the rig's lamps along the top
    const back = new Graphics();
    for (let i = 0; i < 24; i++) back.rect(-200, -100 + i * 60, 2400, 61).fill(i < 15 ? 0x07040e : 0x120a22);
    back.rect(-200, 820, 2400, 400).fill(0x1a1030);
    back.rect(-200, 816, 2400, 6).fill(POP.pink);
    ctx.plane(back, { z: 1300 });
    // the empty stadium beyond (a few far lights) and the stage edge with monitors, in the haze
    const far = new Container();
    const fg0 = new Graphics();
    for (let i = 0; i < 9; i++) fg0.rect(-200 + i * 280, 760 - (i % 3) * 30, 200, 60 + (i % 3) * 30).fill(0x0c0818);
    far.addChild(fg0);
    for (let i = 0; i < 14; i++) {
      const gl = glowAt(ctx, -100 + i * 160, 600 + (i % 3) * 50, 0.25 + (i % 4) * 0.08, [POP.pink, POP.cyan, 0xffffff][i % 3], 0.3);
      if (gl) far.addChild(gl);
    }
    ctx.plane(far, { z: 1250, bake: 'dof', blur: 10, dof: 600 });
    const edge = new Graphics();
    for (const x of [300, 700, 1220, 1620]) edge.poly([x - 70, 1000, x + 70, 1000, x + 50, 950, x - 50, 950]).fill(0x0c0818).stroke({ width: 2, color: 0x2a2040 });
    edge.rect(-200, 996, 2400, 10).fill(POP.pink);
    ctx.plane(edge, { z: 900 });
    const lamps: [number, number][] = [
      [520, 110],
      [960, 90],
      [1400, 110],
    ];
    const spots = new Spots(tex, lamps.map(([x, y], i) => ({ x, y, len: 900, half: 190, color: [0xfff0d8, 0xffffff, 0xfff0d8][i], a: Math.PI / 2 + (i - 1) * 0.28, amp: 0, alpha: 0.6 })));
    const lampG = new Graphics();
    for (const [x, y] of lamps) lampG.roundRect(x - 40, y - 50, 80, 60, 10).fill(0x1a1a24).stroke({ width: 3, color: 0x4a4a5a });
    const flares: Sprite[] = lamps.map(([x, y]) => {
      const s = new Sprite(ctx.tex('pop:flare')!);
      s.anchor.set(0.5);
      s.blendMode = 'add';
      s.position.set(x, y + 10);
      s.scale.set(3.4, 1.4);
      s.tint = 0x9fd8ff;
      return s;
    });
    const rig = new Container();
    rig.addChild(spots, lampG, ...flares);
    ctx.plane(rig, { z: 1000 });
    // Cerito (a stain of static) walking into the brightest light
    const cer = new StaticKitten(ctx, 200);
    const cube = new GlassCube(ctx, 340);
    const cubeC = new Container();
    cubeC.addChild(cube);
    const stageC = new Container();
    stageC.addChild(cer, cubeC);
    ctx.plane(stageC, { z: 1000 });
    // the close-up of the cube (shot E): big
    const big = new GlassCube(ctx, 760);
    const bigC = new Container();
    bigC.addChild(big);
    ctx.plane(bigC, { z: 1000 });
    const title = word(k, 'EL INVITADO SIN FORMA', { fontFamily: 'Bebas Neue', fontSize: 96, fill: 0xffffff, letterSpacing: 30 });
    title.position.set(960, 170);
    const tl2 = word(k, 'ESTA NOCHE', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 30, fill: POP.pink, letterSpacing: 14 });
    tl2.position.set(960, 240);
    const titleC = new Container();
    titleC.addChild(title, tl2);
    ctx.plane(titleC, { z: 0, screen: true });
    const slam = new Graphics().rect(-200, -200, 2400, 1500).fill(0xffffff);
    ctx.plane(slam, { z: 0, screen: true });
    // the teaser's own marks: a corner credit and a running timecode (a music video, not the show yet)
    const ui = new Container();
    const cred = word(k, 'GATÍSIMA PRESENTA', { fontFamily: 'Bebas Neue', fontSize: 34, fill: 0xffffff, letterSpacing: 12 }, 0);
    cred.anchor.set(0, 0.5);
    cred.position.set(140, 300);
    const tc = new Graphics();
    ui.addChild(cred, tc);
    ctx.plane(ui, { z: 0, screen: true });
    let lastTc = -1;
    return {
      update(lt, f) {
        const rm = f.rm;
        const m = f.m;
        // shots: A dark → one lamp · B three lamps · C Cerito walks into the light · D the cube comes down · E close-up
        const A = 5.333 - T0;
        const B = 6.667 - T0;
        const C = 8.0 - T0;
        const D = 9.333 - T0;
        const shot = lt < A ? 0 : lt < B ? 1 : lt < C ? 2 : lt < D ? 3 : 4;
        const lampOn = (i: number) => (shot === 0 ? (i === 1 && lt > 0.15 ? 1 : 0) : shot === 1 ? (i === 1 || lt > A + 0.33 * (i === 0 ? 1 : 2) ? 1 : 0) : shot < 4 ? 1 : 0);
        spots.update(lt, 1, rm, (i) => Math.PI / 2 + (i - 1) * (shot >= 2 ? 0.08 : 0.28));
        spots.beams.forEach((b, i) => {
          const on = lampOn(i);
          b.sp.alpha = on * (shot >= 2 && i === 1 ? 0.8 : 0.55);
          b.sp.visible = on > 0;
          if (b.lamp) b.lamp.visible = on > 0;
        });
        flares.forEach((s, i) => {
          s.visible = lampOn(i) > 0 && shot < 4;
          s.alpha = ctx.rf ? 0.35 : 0.85 * (0.75 + 0.25 * beatK(m));
          s.scale.set(3.4 + beatK(m) * 1.2, 1.4);
        });
        rig.visible = shot < 4;
        back.visible = true;
        // C: Cerito trots toward the centre beam; D: the cube drops on him (slam on the beat at 9.0)
        // (visible from shot B, off-frame: the warm pass draws it before the clock — no first-use stall in shot C)
        cer.visible = shot === 1 || shot === 2;
        cer.position.set(shot === 1 ? -500 : 260 + sm(seg(lt, C - 1.3, C)) * 640, 830);
        cer.update(lt, { stare: 0.9 });
        cubeC.visible = shot === 3;
        const slamT = 9.0 - T0;
        const drop = sm(seg(lt, C, slamT));
        cube.position.set(960, rm ? 830 : -420 + drop * 1250);
        cube.update(lt, { stare: 0.9, shine: 0.45 });
        slam.alpha = lt >= slamT && lt < slamT + 0.25 && !rm ? (1 - seg(lt, slamT, slamT + 0.25)) * (ctx.rf ? 0.2 : 0.6) : 0;
        // E: the cube up close, Cerito leaning on the glass, the static trembling; the title tracks in at 10.67
        bigC.visible = shot === 4;
        big.position.set(960 + (rm ? 0 : Math.sin(lt * 1.1) * 8), 1060);
        big.update(lt, { stare: 1, shine: 0.3 + 0.2 * Math.sin(lt * 2) });
        big.cerito.position.set(140, -10);
        big.cerito.rotation = -0.06;
        const tIn = seg(lt, 10.667 - T0, 10.667 - T0 + 0.8);
        titleC.visible = shot === 4 && lt > 10.667 - T0;
        title.alpha = sm(tIn);
        title.scale.set(rm ? 1 : 1.25 - 0.25 * sm(tIn), 1);
        tl2.alpha = sm(seg(lt, 10.667 - T0 + 0.6, 10.667 - T0 + 1.2));
        cred.alpha = shot < 4 ? 0.8 : 0;
        const fr = Math.floor(m * 24);
        if (fr !== lastTc) {
          lastTc = fr;
          const ss = Math.floor(m);
          const txt = `00:00:${String(ss).padStart(2, '0')}:${String(fr % 24).padStart(2, '0')}`;
          const g = tc.clear();
          pixelText(g, txt, 1780, 790, 3, 0xffffff, { align: 'right' });
        }
        // the beat cuts: a one-frame white hit on each cut
        const cutAt = [A, B, C, D].find((x) => lt >= x && lt < x + 0.05);
        if (cutAt !== undefined && !rm) slam.alpha = Math.max(slam.alpha, ctx.rf ? 0.1 : 0.3);
      },
    };
  },
};

// ------------------------------------------------------------------ 3 · pose (13.5–19.7): the rule, on a stage screen
export const pose: SetModule = {
  cats: [SLUG.firma],
  async build(ctx: SceneCtx): Promise<FilmSet> {
    const k = ctx.k;
    const demo = await demoOf();
    const back = new Graphics();
    for (let i = 0; i < 20; i++) back.rect(-200, -200 + i * 80, 2400, 81).fill(i % 2 ? 0x150a2a : 0x1a0d32);
    ctx.plane(back, { z: 1400 });
    const scr = new LedPanel((n) => ctx.tex(n), 1760, 960, { dots: 0.35, bw: 20 });
    scr.position.set(80, 60);
    const C = scr.content;
    const sbg = new Graphics();
    for (let i = 0; i < 24; i++) sbg.rect(0, i * 40, 1760, 41).fill(i < 12 ? 0x2a0f2a : 0x341238);
    C.addChild(sbg);
    const board = new RuleBoard(demo, [60, 250, 1640, 620], { hullA: 0xffc2a8, hullB: 0xf4dca0, water: 0x3a2ad8 });
    C.addChild(board);
    // her ship is a stage: footlights along the deck
    const [ea, eb] = board.enemy;
    const deckY = board.waterY - 70 * board.sc * 2.2;
    const lights = new Graphics();
    for (let x = ea + 30; x < eb - 20; x += 34) lights.circle(x, deckY + 6, 7).fill(POP.yellow);
    C.addChild(lights);
    const firma = dress(ctx, SLUG.firma, 300);
    if (firma.actor) C.addChild(firma.actor);
    const shield = new Graphics();
    C.addChild(shield);
    const fx = new Graphics();
    C.addChild(fx);
    const flash = new Graphics().rect(0, 0, 1760, 960).fill(0xffffff);
    C.addChild(flash);
    const t1 = word(k, 'REGLA: POSE DE PORTADA', { fontFamily: 'Anton', fontSize: 86, fill: POP.gold, stroke: { color: POP.ink, width: 8 }, letterSpacing: 5 });
    t1.position.set(880, 90);
    const t2 = word(k, 'Cada golpe, una pose. Cada pose, un escudo.', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 46, fill: 0xffffff });
    t2.position.set(880, 170);
    const l1 = word(k, '1 golpe → 1 pose → 1 escudo', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 40, fill: 0xffe08a, stroke: { color: POP.ink, width: 6 } });
    l1.position.set(880, 905);
    const l2 = word(k, 'Con escudo, el tiro rebota', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 40, fill: 0xff9a9a, stroke: { color: POP.ink, width: 6 } });
    l2.position.set(880, 905);
    const l3 = word(k, 'El escudo dura un turno: pégale cuando ya no lo tiene', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 40, fill: 0x9ff5a8, stroke: { color: POP.ink, width: 6 } });
    l3.position.set(880, 905);
    const turn = word(k, 'TURNO SIGUIENTE', { fontFamily: 'Bangers', fontSize: 70, fill: 0xffffff, stroke: { color: POP.ink, width: 8 }, letterSpacing: 6 });
    turn.position.set(880, 330);
    const click = word(k, '¡CLIC!', { fontFamily: 'Bangers', fontSize: 80, fill: 0xffffff, stroke: { color: POP.ink, width: 8 } });
    C.addChild(t1, t2, l1, l2, l3, turn, click);
    const plane = new Container();
    plane.addChild(scr);
    ctx.plane(plane, { z: 1000 });
    const path = demo?.shots[0] ? flightOf(demo.shots[0]) : [];
    const fx0 = (ea + eb) / 2 + 20;
    const HIT1 = 1.35;
    const HIT2 = 3.0;
    const TURN = 3.55;
    const HIT3 = 5.1;
    const FLY = 0.85;
    return {
      update(lt, f) {
        const rm = f.rm;
        t1.alpha = sm(seg(lt, 0.15, 0.5));
        t2.alpha = sm(seg(lt, 0.4, 0.8));
        const e = fx.clear();
        // the three shots (the same real flight): 1 hits · 2 bounces off the shield · 3 hits after the turn
        const shotAt = (t0: number, col: number) => {
          if (!path.length || lt < t0 - FLY) return null;
          const p = seg(lt, t0 - FLY, t0);
          return board.path(e, path, p, col, { width: 6, ball: 12 });
        };
        let hit: [number, number] | null = null;
        if (lt < HIT2 - FLY) hit = shotAt(HIT1, 0xff8a3a);
        else if (lt < HIT3 - FLY) {
          const h = shotAt(HIT2, 0xff8a3a);
          if (h && lt >= HIT2) {
            // the bounce: back up and away in an arc
            const q = seg(lt, HIT2, HIT2 + 0.6);
            e.circle(h[0] - q * 220, h[1] - Math.sin(q * Math.PI) * 180 + q * 120, 12).fill({ color: 0xff8a3a, alpha: 1 - q });
          }
        } else hit = shotAt(HIT3, 0xff8a3a);
        // her pose: on each hit she snaps to a cover pose — a squash, a turn to camera, a camera flash
        const poseAt = (t0: number) => lt >= t0 && lt < t0 + 0.7;
        const posing = poseAt(HIT1) || poseAt(HIT3);
        const pk = posing ? outBack(seg(lt, lt < HIT3 ? HIT1 : HIT3, (lt < HIT3 ? HIT1 : HIT3) + 0.3), 3) : 0;
        firma.actor?.pose(lt, fx0, deckY + 10, { sx: 1 + pk * 0.08, sy: 1 - pk * 0.04, rot: posing ? -0.08 * pk : 0, flip: true });
        firma.follow();
        const fl = posing ? 1 - seg(lt, lt < HIT3 ? HIT1 : HIT3, (lt < HIT3 ? HIT1 : HIT3) + 0.35) : 0;
        flash.alpha = fl * (ctx.rf ? 0.12 : 0.55);
        click.visible = posing;
        click.position.set(fx0 + 120, deckY - 330);
        click.scale.set(rm ? 1 : 0.7 + pk * 0.3);
        if (hit && (poseAt(HIT1) || poseAt(HIT3))) burst(e, hit[0], hit[1], seg(lt, lt < HIT3 ? HIT1 : HIT3, (lt < HIT3 ? HIT1 : HIT3) + 0.5), 0xffa040, 70);
        // the shield: from the first pose until the turn passes; again after the third hit
        const on1 = lt >= HIT1 + 0.15 && lt < TURN + 0.5;
        const on3 = lt >= HIT3 + 0.15;
        const sk = on1 ? sm(seg(lt, HIT1 + 0.15, HIT1 + 0.45)) * (1 - sm(seg(lt, TURN, TURN + 0.5))) : on3 ? sm(seg(lt, HIT3 + 0.15, HIT3 + 0.45)) : 0;
        const s = shield.clear();
        if (sk > 0.01) {
          const cx = (ea + eb) / 2;
          const cy = deckY - 60;
          const r = (eb - ea) * 0.62;
          const hitFlash = lt >= HIT2 && lt < HIT2 + 0.3 ? 1 - seg(lt, HIT2, HIT2 + 0.3) : 0;
          s.ellipse(cx, cy, r, r * 0.72).fill({ color: 0xbfefff, alpha: (0.14 + hitFlash * 0.3) * sk }).stroke({ width: 6, color: 0xffffff, alpha: 0.85 * sk });
          for (let i = 0; i < 6; i++) {
            const a = i * 1.047 + lt * 0.6 * (rm ? 0.3 : 1);
            s.star(cx + Math.cos(a) * r * 0.86, cy + Math.sin(a) * r * 0.6, 4, 16 * sk, 6 * sk).fill({ color: 0xffffff, alpha: 0.9 * sk });
          }
        }
        l1.visible = lt >= HIT1 + 0.2 && lt < HIT2;
        l2.visible = lt >= HIT2 && lt < TURN + 0.6;
        l3.visible = lt >= TURN + 0.6;
        turn.visible = lt >= TURN - 0.1 && lt < TURN + 0.9;
        turn.alpha = sm(seg(lt, TURN - 0.1, TURN + 0.15)) * (1 - sm(seg(lt, TURN + 0.6, TURN + 0.9)));
      },
    };
  },
};

// ------------------------------------------------------------------ 4 · cuenta (19.7–23.7): 3 · 2 · 1… frozen on 1
export const cuenta: SetModule = {
  build(ctx: SceneCtx): FilmSet {
    const k = ctx.k;
    const st = stadium(ctx, { seed: 29 });
    const nums: Sprite[][] = [[], [], []];
    const mk = (n: string, size: number) => word(k, n, { fontFamily: 'Anton', fontSize: size, fill: 0xffffff, stroke: { color: POP.hot, width: size * 0.05, join: 'round' } });
    const T0 = 19.7;
    const at = [20.0, 21.333, 22.667];
    ['3', '2', '1'].forEach((n, i) => {
      const a = mk(n, 760);
      a.position.set(800, 470);
      st.wall.main.content.addChild(a);
      const b = mk(n, 420);
      b.position.set(300, 440);
      st.wall.left.content.addChild(b);
      const c = mk(n, 420);
      c.position.set(300, 440);
      st.wall.right.content.addChild(c);
      nums[i].push(a, b, c);
    });
    const tk = word(k, 'EL SHOW EMPIEZA EN  ·  EL SHOW EMPIEZA EN  ·  EL SHOW EMPIEZA EN  ·  ', { fontFamily: 'Anton', fontSize: 72, fill: POP.yellow, letterSpacing: 6 }, 0);
    tk.anchor.set(0, 0.5);
    tk.position.set(0, 64);
    st.wall.strip.content.addChild(new Graphics().rect(0, 0, 2200, 128).fill(POP.night), tk);
    for (const p of [st.wall.left, st.wall.main, st.wall.right]) p.content.addChildAt(new Graphics().rect(0, 0, 1600, 900).fill(0x24104a), 0);
    return {
      update(lt, f) {
        const rm = f.rm;
        const m = lt + T0;
        st.update(lt, { rm, phones: 0.55, aim: (i) => Math.PI / 2 + (i - 3) * 0.04 });
        const cur = m < at[1] ? 0 : m < at[2] ? 1 : 2;
        nums.forEach((arr, i) =>
          arr.forEach((s) => {
            s.visible = i === cur && m >= at[0] - 0.05;
            const p = seg(m, at[i], at[i] + 0.25);
            s.scale.set(rm ? 1 : 1.3 - 0.3 * outBack(p));
            // frozen on «1»: a little LED flicker, it never reaches zero
            s.alpha = i === 2 && m > at[2] + 0.6 ? (rnd(Math.floor(m * 12)) > 0.15 ? 1 : 0.6) : 1;
          }),
        );
        tk.position.x = -((lt * 240) % (tk.width / 2));
      },
    };
  },
};

// ------------------------------------------------------------------ 5 · staff (23.7–28.7): backstage, STAFF caps
function capOn(ctx: SceneCtx, d: Dressed, backwards: boolean) {
  const g = d.geo;
  if (!g) return null;
  const cap = new Container();
  const c = new Graphics();
  const h = g.head;
  // the dome over the top of the head, the bill to one side (+x = forward of the painting's facing)
  c.moveTo(-h.rx * 0.95, 0).quadraticCurveTo(-h.rx * 0.9, -h.ry * 1.1, 0, -h.ry * 1.15).quadraticCurveTo(h.rx * 0.9, -h.ry * 1.1, h.rx * 0.95, 0).closePath().fill(0x1e2a5a).stroke({ width: 5, color: POP.ink });
  c.ellipse(h.rx * 0.95, 4, h.rx * 0.75, h.ry * 0.16).fill(0x16204a).stroke({ width: 5, color: POP.ink });
  c.circle(0, -h.ry * 1.12, 6).fill(0x16204a);
  const t = word(ctx.k, 'STAFF', { fontFamily: 'Anton', fontSize: Math.max(18, h.ry * 0.42), fill: 0xffffff, letterSpacing: 2 });
  t.position.set(-h.rx * 0.05, -h.ry * 0.5);
  cap.addChild(c, t);
  cap.position.set(h.x, h.y - h.ry * 0.55);
  cap.scale.x = backwards ? -1 : 1;
  d.headC.addChild(cap);
  return cap;
}
export const staff: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', SLUG.hipo],
  build(ctx: SceneCtx): FilmSet {
    // backstage under white work lights: a black curtain, cables, a ladder, the glow of the show behind
    const back = new Graphics();
    back.rect(-200, -200, 2400, 1400).fill(0x15131c);
    for (let i = 0; i < 30; i++) back.rect(-200 + i * 80, -200, 40, 1100).fill({ color: 0x000000, alpha: 0.25 });
    back.rect(-200, 860, 2400, 400).fill(0x22202a);
    for (let i = 0; i < 6; i++) back.moveTo(-200, 900 + i * 22).bezierCurveTo(500, 870 + i * 30, 1200, 960 - i * 10, 2200, 910 + i * 18).stroke({ width: 7, color: 0x0a090e });
    back.rect(1500, 120, 14, 760).fill(0x8a8a96).rect(1640, 120, 14, 760).fill(0x8a8a96);
    for (let y = 160; y < 860; y += 70) back.rect(1500, y, 154, 10).fill(0x8a8a96);
    ctx.plane(back, { z: 1500, bake: 'static' });
    const showGlow = new Container();
    const sg1 = glowAt(ctx, 1900, 300, 5, POP.pink, 0.35);
    const sg2 = glowAt(ctx, 1950, 700, 4, POP.cyan, 0.3);
    if (sg1) showGlow.addChild(sg1);
    if (sg2) showGlow.addChild(sg2);
    ctx.plane(showGlow, { z: 1400 });
    const cast = new Container();
    const hipoA = ctx.actor(SLUG.hipo, 470);
    const canA = ctx.actor(ctx.canelo, 400);
    const hipo = new Dressed(hipoA, () => undefined);
    const can = new Dressed(canA, () => undefined);
    const hcap = capOn(ctx, hipo, true);
    capOn(ctx, can, false);
    const luz = luzOf(ctx, 400);
    if (canA) cast.addChild(canA);
    if (hipoA) cast.addChild(hipoA);
    const fl = new Graphics();
    cast.addChild(fl);
    if (luz.actor) cast.addChild(luz.actor);
    const beam = new Beam(ctx);
    cast.addChild(beam);
    ctx.plane(cast, { z: 1000 });
    const cases = flightCases({ x: -120, y: 1180, scale: 0.95, n: 3 });
    const cases2 = flightCases({ x: 1420, y: 1200, scale: 0.85, n: 3 });
    const cc = new Container();
    cc.addChild(cases, cases2);
    ctx.plane(cc, { z: 820 });
    const work = glowAt(ctx, 900, -60, 7, 0xf4f8ff, 0.18);
    const wl = new Container();
    if (work) wl.addChild(work);
    ctx.plane(wl, { z: 0, screen: true });
    return {
      update(lt, f) {
        const rm = f.rm;
        // they laugh low at the costume (a bounce), Luzterna turns Hipólito's cap round with her beam
        const laugh = lt < 1.6 ? Math.abs(Math.sin(lt * 9)) * (1 - seg(lt, 1, 1.6)) : 0;
        hipoA?.pose(lt, 1060, 1070 - laugh * 10 * (rm ? 0 : 1), {});
        hipo.follow();
        const ly = 520 + bob(lt, rm);
        luz.actor?.pose(lt, 1420, ly + 400, { flip: true });
        const [lx, ly2] = lanternAt(luz);
        const turning = seg(lt, 1.4, 2.3);
        if (hcap) hcap.scale.x = Math.cos((1 - sm(turning)) * Math.PI) * (rm ? 1 : 1);
        if (hcap && rm) hcap.scale.x = lt < 1.85 ? -1 : 1;
        const [hx, hy] = hipoA ? hipoA.head() : [0, 0];
        beam.set([lx, ly2], [1060 + hx, 1070 + hy - 80], 60, lt > 1.1 && lt < 2.6 ? 0.8 : 0);
        // Canelo, in the same shot: a yawn, his flame small, he rubs his eyes and goes on
        canA?.pose(lt, 640, 1075 - laugh * 8 * (rm ? 0 : 1), {});
        can.follow();
        if (canA && lt > 2.8 && lt < 2.9) canA.emote('sleepy');
        if (canA?.puppet) canA.puppet.look = lt > 3.8 ? 0.2 : 0;
        fl.clear();
        caneloFlame(fl, canA, lt > 2.6 ? FLAME.chica : FLAME.act4, lt, rm);
      },
    };
  },
};

// ------------------------------------------------------------------ 6 · riesgo (28.7–34.7)
export const riesgo: SetModule = {
  build(ctx: SceneCtx): FilmSet {
    const bg = bokeh(ctx, { colors: [0xf4f8ff, POP.pink, POP.cyan, 0xfff0d8], seed: 28, base: 0x15131c, n: 50 });
    ctx.plane(bg, { z: 1400, bake: 'static' });
    const bit = new Bitacora(ctx, 'Cerito. Y el gordo: cada caja que se rompe le baja la llama.', { size: 50, w: 1200 });
    ctx.plane(bit, { z: 0, screen: true });
    return {
      update(lt, f) {
        bit.update(lt, f.rm);
      },
    };
  },
};
