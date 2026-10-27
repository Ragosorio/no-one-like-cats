/**
 * F26 · «El mánager» — the sets (see ./index.ts). POP style: the stadium drawn at 2× (vector, live) so the main LED
 * screen fills the frame at fov 1 with crisp type; texts are built in `build`; per frame only small redraws.
 */
import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { POP, PhoneFrame, Spots, pixelText } from '../../../styles/pop';
import { XT_BEAT } from '../music';
import {
  Bitacora,
  Dressed,
  FLAME,
  LedWall,
  PhoneSea,
  RuleBoard,
  SLUG,
  Truss,
  arenaBack,
  beatPulse,
  bob,
  bokeh,
  burst,
  caneloFlame,
  catHead,
  demoOf,
  esquirlaHood,
  flightOf,
  glowAt,
  luzOf,
  lanternAt,
  outBack,
  rnd,
  seg,
  sm,
  springIn,
  stageDeck,
  word,
  world,
  Beam,
} from '../kit';

const W2 = (x: number) => 960 + (x - 960) * 2;
const Y2 = (y: number) => 540 + (y - 540) * 2;
const beatK = (m: number, k = 7) => {
  const p = (m / XT_BEAT) % 1;
  return Math.exp(-p * k);
};

// ------------------------------------------------------------------ 1 · cartel (0–14): the stadium, the poster, the pass
export const cartel: SetModule = {
  cats: [SLUG.manager, SLUG.esquirla],
  build(ctx: SceneCtx): FilmSet {
    const k = ctx.k;
    const tex = (n: string) => ctx.tex(n);
    // ---- the far bowl and the phones (vector, at 2×)
    const far = world(new Container());
    far.addChild(arenaBack({ seed: 26 }));
    const phones = new PhoneSea(ctx, { n: 220, seed: 26 });
    far.addChild(phones);
    ctx.plane(far, { z: 1400 });
    // ---- the stage, the rig, the beams (2×)
    const near = world(new Container());
    near.addChild(stageDeck({ y: 720 }));
    const truss = new Truss(ctx, 60, 1860, 30, { lamps: 9 });
    near.addChild(truss);
    const spots = new Spots(
      tex,
      truss.lamps.slice(1, 8).map(([x, y], i) => ({ x, y, len: 900, half: 120, color: [POP.pink, POP.cyan, POP.yellow, POP.lilac, POP.mint, POP.pink, POP.cyan][i], a: Math.PI / 2 + (i - 3) * 0.12, amp: 0.32, w: 0.9 + i * 0.07, ph: i * 1.3, alpha: 0.32 })),
    );
    near.addChild(spots);
    ctx.plane(near, { z: 1000 });
    // ---- the LED wall (not scaled: its panels are already 2× so the type stays crisp)
    const wall = new LedWall(ctx, { s: 2, dots: 0.42 });
    const wallPlane = new Container();
    wallPlane.addChild(wall);
    ctx.plane(wallPlane, { z: 1000 });

    // ---- the POSTER on the main screen (local 1600 × 900)
    const P = wall.main.content;
    const bg = new Graphics();
    const grad = [0xffc2a8, 0xffa8c8, 0xe8a8ff, 0xc8a8ff, 0xa8b8ff];
    for (let i = 0; i < 30; i++) bg.rect(0, (900 * i) / 30, 1600, 31).fill(grad[Math.min(grad.length - 1, Math.floor((i / 30) * grad.length))]);
    // a sunburst behind the line-up, halftone circles in the corners, an inner frame
    for (let i = 0; i < 24; i++) {
      const a0 = (i / 24) * Math.PI * 2;
      if (i % 2) bg.poly([800, 470, 800 + Math.cos(a0) * 1400, 470 + Math.sin(a0) * 1400, 800 + Math.cos(a0 + 0.13) * 1400, 470 + Math.sin(a0 + 0.13) * 1400]).fill({ color: 0xffffff, alpha: 0.14 });
    }
    for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) {
      bg.circle(40 + x * 34, 40 + y * 34, Math.max(0, 14 - (x + y) * 1.4)).fill({ color: POP.hot, alpha: 0.5 });
      bg.circle(1560 - x * 34, 860 - y * 34, Math.max(0, 14 - (x + y) * 1.4)).fill({ color: POP.violet, alpha: 0.45 });
    }
    bg.roundRect(24, 24, 1552, 852, 18).stroke({ width: 6, color: POP.ink });
    bg.roundRect(40, 40, 1520, 820, 14).stroke({ width: 2, color: POP.ink, alpha: 0.5 });
    P.addChild(bg);
    const head = word(k, 'LA GIRA', { fontFamily: 'Anton', fontSize: 128, fill: POP.ink, letterSpacing: 18 });
    head.position.set(800, 118);
    const headSub = word(k, 'POP · UNA NOCHE · EL ESTADIO QUE NO SE ACABA', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 30, fill: POP.ink, letterSpacing: 6 });
    headSub.position.set(800, 210);
    P.addChild(head, headSub);
    // the line-up: each name in its own type, dropping on the beat
    const names: { c: Container; t: number; y: number }[] = [];
    const add = (sp: Sprite | Container, t: number, y: number) => {
      const c = new Container();
      c.addChild(sp);
      P.addChild(c);
      names.push({ c, t, y });
      return c;
    };
    add(word(k, 'FIRMA', { fontFamily: 'Playfair Display', fontStyle: 'italic', fontWeight: '700', fontSize: 190, fill: POP.gold, stroke: { color: POP.ink, width: 12, join: 'round' }, letterSpacing: 8 }), 2 * 2 * XT_BEAT, 345);
    add(word(k, 'GATO MALO', { fontFamily: 'Bangers', fontSize: 130, fill: POP.hot, stroke: { color: POP.ink, width: 10, join: 'round' }, letterSpacing: 10 }), 3 * 2 * XT_BEAT, 500);
    add(word(k, 'TAILOR SWIFT', { fontFamily: 'Dela Gothic One', fontSize: 92, fill: 0xf2e8ff, stroke: { color: POP.violet, width: 10, join: 'round' }, letterSpacing: 4 }), 4 * 2 * XT_BEAT, 628);
    const em = new Container();
    const emA = word(k, 'EMIAU', { fontFamily: 'Anton', fontSize: 84, fill: 0xffffff, stroke: { color: POP.ink, width: 8, join: 'round' }, letterSpacing: 8 });
    const emB = word(k, '(telonero)', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 40, fill: POP.ink });
    emA.position.set(-80, 0);
    emB.position.set(emA.width / 2 + 20, 12);
    em.addChild(emA, emB);
    add(em, 5 * 2 * XT_BEAT, 735);
    const last = new Container();
    const l1 = word(k, 'y un invitado ', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 44, fill: POP.ink }, 0);
    l1.anchor.set(1, 0.5);
    const l2 = word(k, 'sin forma', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 44, fill: POP.ink }, 0);
    l2.anchor.set(0, 0.5);
    last.addChild(l1, l2);
    last.pivot.set(-(l1.width - l2.width) / 2, 0);
    add(last, 6 * 2 * XT_BEAT, 822);
    // static over «sin forma» (a few pixels of the poster that stop being poster)
    const stat = new TilingSprite({ texture: ctx.tex('pop:static')!, width: l2.width + 30, height: 64 });
    stat.position.set(-15, -32);
    stat.alpha = 0;
    last.addChild(stat);
    const pix = new Graphics();
    P.addChild(pix);
    // ---- the side screens: neon fields + VU bars; the strip: a ticker
    const sides: Graphics[] = [];
    for (const [panel, col] of [
      [wall.left, POP.hot],
      [wall.right, POP.cyan],
    ] as const) {
      const g = new Graphics();
      for (let i = 0; i < 20; i++) g.rect(0, i * 44, 600, 45).fill(i % 2 ? col : POP.violet);
      const pop = word(k, 'POP', { fontFamily: 'Anton', fontSize: 210, fill: 0xffffff, stroke: { color: POP.ink, width: 12 } });
      pop.position.set(300, 260);
      pop.rotation = -Math.PI / 2;
      pop.position.set(300, 440);
      const vu = new Graphics();
      panel.content.addChild(g, pop, vu);
      sides.push(vu);
    }
    const tick = word(k, 'LA GIRA  ·  ESTA NOCHE  ·  EL SHOW MÁS GRANDE DEL ARCHIVO  ·  LA GIRA  ·  ESTA NOCHE  ·  EL SHOW MÁS GRANDE DEL ARCHIVO  ·  ', { fontFamily: 'Anton', fontSize: 72, fill: POP.yellow, letterSpacing: 6 }, 0);
    tick.anchor.set(0, 0.5);
    tick.position.set(0, 64);
    wall.strip.content.addChild(new Graphics().rect(0, 0, 2200, 128).fill(POP.night), tick);

    // ---- the PASS (screen plane): laminated, on a lanyard, spins and stops facing
    const pass = new Container();
    const strap = new Graphics().moveTo(-60, -900).lineTo(-26, -360).moveTo(60, -900).lineTo(26, -360).stroke({ width: 16, color: POP.hot });
    const clip = new Graphics().roundRect(-34, -372, 68, 44, 10).fill(0xc8ccd8).stroke({ width: 4, color: POP.ink });
    const front = new Container();
    const fg = new Graphics();
    fg.roundRect(-220, -330, 440, 640, 28).fill(0xfffbff).stroke({ width: 6, color: POP.ink });
    fg.roundRect(-150, -318, 300, 26, 13).fill({ color: POP.ink, alpha: 0.85 });
    fg.rect(-206, -270, 412, 92).fill(POP.hot);
    fg.rect(-150, -160, 300, 300).fill(0x2a1450);
    for (let i = 0; i < 26; i++) fg.rect(-180 + i * 14, 236, i % 3 ? 6 : 10, 50).fill(POP.ink);
    front.addChild(fg);
    const bs = word(k, 'BACKSTAGE', { fontFamily: 'Anton', fontSize: 64, fill: 0xffffff, letterSpacing: 8 });
    bs.position.set(0, -236);
    const bs2 = word(k, 'LA GIRA · TODO ACCESO', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 22, fill: 0xffffff, letterSpacing: 4 });
    bs2.position.set(0, -194);
    front.addChild(bs, bs2);
    // the photo: El mánager (his painting), framed head and shoulders
    const photo = new Container();
    const pm = new Graphics().rect(-150, -160, 300, 300).fill(0xffffff);
    const ph = new Graphics();
    for (let i = 0; i < 12; i++) ph.rect(-150, -160 + i * 25, 300, 26).fill(i % 2 ? 0x3a1c6a : 0x2a1450);
    photo.addChild(ph);
    // his painting wears his own headset, clipboard, phone and pass (nothing drawn over it)
    const mgr = ctx.actor(SLUG.manager, 520);
    const mgrD = new Dressed(mgr, () => undefined);
    if (mgr) photo.addChild(mgr);
    photo.mask = pm;
    front.addChild(photo, pm);
    const nm = word(k, 'EL MÁNAGER', { fontFamily: 'Anton', fontSize: 58, fill: POP.ink, letterSpacing: 4 });
    nm.position.set(0, 172);
    const nm2 = word(k, 'SIN PASE NO HAY PASO', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 26, fill: POP.hot, letterSpacing: 3 });
    nm2.position.set(0, 214);
    front.addChild(nm, nm2);
    const back = new Graphics();
    back.roundRect(-220, -330, 440, 640, 28).fill(POP.lilac).stroke({ width: 6, color: POP.ink });
    for (let i = 0; i < 18; i++) back.star(-170 + (i % 4) * 110 + (Math.floor(i / 4) % 2) * 55, -260 + Math.floor(i / 4) * 130, 5, 26, 11).fill({ color: 0xffffff, alpha: 0.55 });
    const card = new Container();
    card.addChild(back, front);
    const sheen = new Sprite(ctx.tex('pop:flare')!);
    sheen.anchor.set(0.5);
    sheen.blendMode = 'add';
    sheen.rotation = -1.1;
    sheen.scale.set(1.4, 3);
    sheen.alpha = 0;
    const sheenMask = new Graphics().roundRect(-220, -330, 440, 640, 28).fill(0xffffff);
    sheen.mask = sheenMask;
    card.addChild(sheen, sheenMask);
    pass.addChild(strap, clip, card);
    pass.position.set(1390, 590);
    pass.scale.set(0.82);
    ctx.plane(pass, { z: 0, screen: true });

    // ---- the fan's phone (9:16): Esquirla in the crowd
    const phone = new PhoneFrame(tex, 300, 534, 0);
    const pc = phone.content;
    const pbg = new Graphics();
    for (let i = 0; i < 18; i++) pbg.rect(0, i * 30, 300, 31).fill(i < 7 ? 0x1a0c34 : 0x24104a);
    pbg.roundRect(40, 40, 220, 124, 6).fill(0xffb4d0).stroke({ width: 4, color: 0x0a0614 });
    pbg.rect(70, 70, 160, 20).fill({ color: POP.ink, alpha: 0.6 }).rect(90, 104, 120, 14).fill({ color: POP.ink, alpha: 0.5 });
    pc.addChild(pbg);
    const esq = ctx.actor(SLUG.esquirla, 300);
    const esqD = new Dressed(esq, (h, _b, g) => esquirlaHood(h, g));
    if (esq) pc.addChild(esq);
    const trail = new Graphics();
    pc.addChild(trail);
    const heads = new Graphics();
    for (let i = 0; i < 7; i++) catHead(heads, 10 + i * 48, 500 - (i % 2) * 14, 34);
    heads.fill(0x07040e);
    pc.addChild(heads);
    phone.position.set(70, 250);
    ctx.plane(phone, { z: 0, screen: true });

    const DROP = names.map((n) => n.t);
    return {
      update(lt, f) {
        const rm = f.rm;
        const m = f.m;
        const bk = beatK(m);
        // the bowl: phones twinkle (some), the rig lit, the beams sweep
        phones.update(lt, 0.4, rm);
        truss.light(0.6 + 0.4 * bk);
        spots.update(lt, 0.9, rm);
        // the line-up drops in on its beats (overshoot + a thump)
        names.forEach((n, i) => {
          const p = seg(lt, DROP[i], DROP[i] + 0.32);
          n.c.visible = lt >= DROP[i];
          const y = rm ? n.y : n.y - (1 - outBack(p, 2.2)) * 160;
          n.c.position.set(800, y);
          n.c.alpha = rm ? sm(p * 2) : 1;
          const th = lt >= DROP[i] + 0.3 ? beatK(m, 10) * 0.025 : 0;
          n.c.scale.set(1 + (rm ? 0 : th));
        });
        // «sin forma» stops being poster: static flickers on 12 fps steps from 5.6 s
        const st = Math.floor(lt * 12);
        const on = lt > 5.7 ? (rnd(st) > (lt > 7.4 ? 0.25 : 0.55) ? 1 : 0.15) : 0;
        stat.alpha = on * (ctx.rf ? 0.5 : 0.85);
        stat.tilePosition.set(rnd(st) * 200, rnd(st + 1) * 200);
        l2.alpha = 1 - on * 0.6;
        const px = pix.clear();
        if (lt > 6.4) for (let i = 0; i < 6; i++) if (rnd(st * 7 + i) > 0.5) px.rect(940 + rnd(i * 3 + st) * 220, 790 + rnd(i * 5 + st) * 60, 14, 14).fill(rnd(i + st) > 0.5 ? 0xffffff : POP.ink);
        // the side screens: VU bars on the beat
        sides.forEach((vu, j) => {
          vu.clear();
          for (let i = 0; i < 6; i++) {
            const h = 80 + 300 * Math.abs(Math.sin(m * 3.1 + i * 1.3 + j)) * (0.4 + 0.6 * bk);
            vu.rect(40 + i * 90, 860 - h, 60, h).fill({ color: 0xffffff, alpha: 0.75 });
          }
        });
        tick.position.x = -((lt * 260) % (tick.width / 2));
        // the pass: enters spinning (9.0 → 12.1), stops facing, the light runs across it
        const pIn = seg(lt, 9.0, 12.1);
        pass.visible = lt >= 9.0;
        const ang = rm ? 0 : (1 - (1 - Math.pow(1 - pIn, 3))) * Math.PI * 5;
        const c = Math.cos(ang);
        card.scale.set(Math.max(0.02, Math.abs(c)), 1);
        front.visible = c >= 0;
        back.visible = c < 0;
        pass.alpha = rm ? sm(seg(lt, 9.0, 9.6)) : 1;
        pass.position.set(1390, rm ? 590 : 590 + (1 - sm(seg(lt, 9.0, 10.2))) * 700);
        pass.rotation = rm ? 0 : Math.sin(lt * 1.3) * 0.03 * sm(seg(lt, 12, 13));
        sheen.alpha = lt > 12.1 && lt < 13.4 ? Math.sin(seg(lt, 12.1, 13.4) * Math.PI) * 0.8 : 0;
        sheen.position.set(-320 + seg(lt, 12.1, 13.4) * 640, 0);
        mgr?.pose(lt, 0, 330, {});
        mgrD.follow();
        // the phone: slides in (6.3), Esquirla crosses, glitch pixels behind her, out at 9.2
        const pp = sm(seg(lt, 6.3, 6.8)) * (1 - sm(seg(lt, 8.9, 9.3)));
        phone.visible = pp > 0.01;
        phone.position.set(rm ? 70 : 70 - (1 - pp) * 420, 250);
        phone.alpha = rm ? pp : 1;
        phone.update(lt - 6.3 + 14);
        const ex = -60 + seg(lt, 6.5, 9.0) * 420;
        esq?.pose(lt, ex, 520, {});
        esqD.follow();
        const tr = trail.clear();
        if (phone.visible)
          for (let i = 0; i < 9; i++) {
            const s2 = Math.floor(lt * 12);
            const x = ex - 60 - i * 26 + (rnd(i + s2) - 0.5) * 18;
            const y = 360 + (rnd(i * 3 + s2) - 0.5) * 90;
            tr.rect(x, y, 14 - i, 14 - i).fill(i % 3 === 0 ? 0x5cff8a : i % 3 === 1 ? POP.pink : POP.cyan);
          }
      },
      anchor: (name) => (name === 'subtitle' ? [960, 1000] : null),
    };
  },
};

// ------------------------------------------------------------------ 2 · regla (14–20): RITMO, shown on a side screen
const FIRE = ['molten_ember_cat', 'magmito_forge_cat'];
export const regla: SetModule = {
  cats: FIRE,
  async build(ctx: SceneCtx): Promise<FilmSet> {
    const k = ctx.k;
    const demo = await demoOf();
    const back = new Graphics();
    for (let i = 0; i < 20; i++) back.rect(-200, -200 + i * 80, 2400, 81).fill(i % 2 ? 0x150a2a : 0x1a0d32);
    ctx.plane(back, { z: 1400 });
    // the screen fills the frame (an LED panel 1760 × 960)
    const tex = (n: string) => ctx.tex(n);
    const { LedPanel } = await import('../../../styles/pop');
    const scr = new LedPanel(tex, 1760, 960, { dots: 0.35, bw: 20 });
    scr.position.set(80, 60);
    const C = scr.content;
    const sbg = new Graphics();
    for (let i = 0; i < 24; i++) sbg.rect(0, i * 40, 1760, 41).fill(i < 12 ? 0x0f1640 : 0x101a4c);
    for (let x = 0; x < 1760; x += 80) sbg.rect(x, 0, 2, 960).fill({ color: 0xffffff, alpha: 0.04 });
    C.addChild(sbg);
    const board = new RuleBoard(demo, [60, 240, 1640, 640], { hullA: 0xffb48a, hullB: 0xb8a0ff });
    C.addChild(board);
    // two cats of the SAME element (fire) on our deck
    const [pa, pb] = board.player;
    const deckY = board.waterY - 70 * board.sc * 2.2;
    const cats = FIRE.map((s) => ctx.still(s));
    const muzz: [number, number][] = [];
    cats.forEach((c, i) => {
      if (!c) return;
      const h = 170;
      c.scale.set(h / (c.texture.height || 700));
      const x = pa + (pb - pa) * (0.32 + i * 0.36);
      c.position.set(x, deckY + 8);
      C.addChild(c);
      muzz.push([x + 40, deckY - h * 0.55]);
    });
    if (muzz.length < 2) muzz.push([pa + 80, deckY - 90], [pb - 80, deckY - 90]);
    const fireTag = new Graphics();
    for (const [x, y] of muzz) fireTag.circle(x - 40, y - 110, 22).fill(0xff7a2a).stroke({ width: 4, color: POP.ink });
    C.addChild(fireTag);
    const t1 = word(k, 'REGLA: RITMO', { fontFamily: 'Anton', fontSize: 96, fill: POP.yellow, stroke: { color: POP.ink, width: 8 }, letterSpacing: 6 });
    t1.position.set(880, 92);
    const t2 = word(k, 'Dispara en el beat.', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 50, fill: 0xffffff });
    t2.position.set(880, 176);
    const ok = word(k, '✔ EN EL BEAT: los dos tiros se juntan en uno (¡SINCRO!)', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 40, fill: 0x9ff5a8, stroke: { color: POP.ink, width: 6 } });
    ok.position.set(880, 910);
    const bad = word(k, '✘ FUERA DEL BEAT: un tiro chico', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 40, fill: 0xff9a9a, stroke: { color: POP.ink, width: 6 } });
    bad.position.set(880, 910);
    const same = word(k, 'dos gatos del mismo elemento', { fontFamily: 'Space Grotesk', fontWeight: '600', fontSize: 30, fill: 0xffd8b0 });
    same.position.set((pa + pb) / 2, deckY - 250);
    const sincro = word(k, '¡SINCRO!', { fontFamily: 'Bangers', fontSize: 120, fill: POP.yellow, stroke: { color: POP.ink, width: 10 }, letterSpacing: 6 });
    C.addChild(t1, t2, ok, bad, same, sincro);
    // the beat: four dots and a ring that pulse on every beat of the music
    const metro = new Graphics();
    C.addChild(metro);
    const fx = new Graphics();
    C.addChild(fx);
    const plane = new Container();
    plane.addChild(scr);
    ctx.plane(plane, { z: 1000 });
    const shot = demo?.shots.find((s) => s.good) ?? demo?.shots[0] ?? null;
    const path = shot ? flightOf(shot) : [];
    // times (film seconds are lt + 14): the off-beat shot between two beats, the on-beat shot ON a beat
    const ON = Math.ceil((14 + 2.95) / XT_BEAT) * XT_BEAT - 14;
    const OFF = Math.floor((14 + 1.2) / XT_BEAT) * XT_BEAT + XT_BEAT * 0.5 - 14;
    const FLY = 0.9;
    return {
      update(lt, f) {
        const rm = f.rm;
        const m = f.m;
        const bk = beatK(m, 6);
        const bi = Math.floor(m / XT_BEAT) % 4;
        const g = metro.clear();
        for (let i = 0; i < 4; i++) g.circle(1500 + i * 52, 104, 16).fill(i === bi ? POP.yellow : 0x3a3a6a).stroke({ width: 3, color: POP.ink });
        g.circle(260, 120, 46 + bk * 22).stroke({ width: 8, color: POP.yellow, alpha: 0.3 + 0.7 * bk });
        g.circle(260, 120, 30).fill(POP.yellow);
        t1.alpha = sm(seg(lt, 0.2, 0.6));
        t2.alpha = sm(seg(lt, 0.5, 0.9));
        same.alpha = sm(seg(lt, 0.8, 1.2));
        const e = fx.clear();
        // 1 · off the beat: one cat, a small shot
        const p1 = seg(lt, OFF, OFF + FLY);
        bad.visible = lt >= OFF + FLY && lt < ON - 0.2;
        if (path.length && lt >= OFF && lt < ON - 0.2) {
          const hd = board.path(e, path, p1, 0xff8a3a, { width: 5, ball: 9, dx: muzz[0][0] - board.P(path[0].x, path[0].y)[0], dy: muzz[0][1] - board.P(path[0].x, path[0].y)[1] });
          if (p1 >= 1) burst(e, hd[0], hd[1], seg(lt, OFF + FLY, OFF + FLY + 0.4), 0xff8a3a, 40);
        }
        // 2 · on the beat: both fire, the two trails meet into one big shot → ¡SINCRO!
        const p2 = seg(lt, ON, ON + FLY);
        ok.visible = lt >= ON + FLY;
        sincro.visible = false;
        if (path.length && lt >= ON) {
          const p0 = board.P(path[0].x, path[0].y);
          const meet = 0.28;
          for (let j = 0; j < 2; j++) {
            const q = Math.min(p2, meet);
            board.path(e, path, q, j ? 0xffc23a : 0xff6a2a, { width: 6, ball: 11, dx: (muzz[j][0] - p0[0]) * (1 - q / meet), dy: (muzz[j][1] - p0[1]) * (1 - q / meet) });
          }
          if (p2 > meet) {
            const big = 12 + 16 * sm(seg(p2, meet, meet + 0.15));
            const hd = board.path(e, path, p2, POP.yellow, { width: 12, ball: big });
            const gl = 1 - Math.abs(Math.sin(lt * 30)) * 0.3;
            e.circle(hd[0], hd[1], big * 1.9).fill({ color: 0xffa040, alpha: 0.35 * gl });
            if (p2 >= 1) {
              const kb = seg(lt, ON + FLY, ON + FLY + 0.6);
              burst(e, hd[0], hd[1], kb, POP.yellow, 140);
              sincro.visible = true;
              sincro.position.set(hd[0] - 60, hd[1] - 170);
              sincro.scale.set(rm ? 1 : 0.6 + 0.4 * outBack(seg(lt, ON + FLY, ON + FLY + 0.25)));
            }
          }
          // the two cats flash on the shot
          if (lt < ON + 0.2) for (const [x, y] of muzz) e.circle(x, y, 30 * (1 - seg(lt, ON, ON + 0.2))).fill({ color: 0xffffff, alpha: 0.8 });
        }
        if (lt >= OFF && lt < OFF + 0.2) e.circle(muzz[0][0], muzz[0][1], 26 * (1 - seg(lt, OFF, OFF + 0.2))).fill({ color: 0xffffff, alpha: 0.8 });
      },
    };
  },
};

// ------------------------------------------------------------------ 3 · camerino (20–27): through the mirror
export const camerino: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', SLUG.hipo],
  build(ctx: SceneCtx): FilmSet {
    const k = ctx.k;
    // the dressing room behind them (pastel stripes, a rack of glittery clothes, a door with a star)
    const room = new Container();
    const g = new Graphics();
    for (let i = 0; i < 26; i++) g.rect(-200 + i * 96, -200, 97, 1500).fill(i % 2 ? 0xf6c8e0 : 0xeab8d6);
    g.rect(-200, 820, 2400, 500).fill(0x6a3a7a);
    g.rect(-200, 812, 2400, 14).fill(0x3a1c4a);
    // the rack
    g.rect(1380, 300, 520, 12).fill(0x8a8aa0);
    for (let i = 0; i < 8; i++) {
      const x = 1400 + i * 62;
      g.moveTo(x + 20, 312).lineTo(x + 20, 330).stroke({ width: 3, color: 0x8a8aa0 });
      g.poly([x, 330, x + 40, 330, x + 54, 560, x - 14, 560]).fill([POP.hot, POP.cyan, POP.gold, POP.lilac][i % 4]).stroke({ width: 4, color: POP.ink });
      for (let j = 0; j < 6; j++) g.circle(x + 6 + ((j * 13) % 40), 360 + j * 32, 4).fill({ color: 0xffffff, alpha: 0.7 });
    }
    // the door with a star
    g.rect(80, 150, 300, 670).fill(0x9a6ab8).stroke({ width: 6, color: POP.ink });
    g.star(230, 330, 5, 70, 30).fill(POP.gold).stroke({ width: 5, color: POP.ink });
    g.circle(350, 500, 10).fill(POP.gold);
    room.addChild(g);
    const roomP = ctx.plane(room, { z: 1500, bake: 'dof', blur: 6, dof: 1200 });
    void roomP;
    // the cast stands close to the mirror (to us); the counter is in the foreground
    const cast = new Container();
    const hipo = ctx.actor(SLUG.hipo, 540);
    const can = ctx.actor(ctx.canelo, 380);
    const luz = luzOf(ctx, 430);
    // the quiff his hair becomes (a pompadour on his head, drawn on his rig; it grows from nothing)
    const quiffD = new Dressed(hipo, (h, _b, g) => {
      const x = g.head.x;
      const y = g.head.y - g.head.ry * 0.78;
      const rx = g.head.rx;
      h.moveTo(x - rx * 0.85, y + rx * 0.1)
        .bezierCurveTo(x - rx * 0.9, y - rx * 0.75, x + rx * 0.2, y - rx * 1.25, x + rx * 1.15, y - rx * 0.62)
        .bezierCurveTo(x + rx * 1.3, y - rx * 0.5, x + rx * 1.05, y - rx * 0.22, x + rx * 0.82, y - rx * 0.32)
        .bezierCurveTo(x + rx * 0.5, y - rx * 0.45, x + rx * 0.6, y - rx * 0.05, x + rx * 0.8, y + rx * 0.12)
        .closePath()
        .fill(0x5a5a68)
        .stroke({ width: 6, color: POP.ink, join: 'round' });
      h.moveTo(x - rx * 0.55, y - rx * 0.1).bezierCurveTo(x - rx * 0.5, y - rx * 0.6, x + rx * 0.3, y - rx * 0.95, x + rx * 0.95, y - rx * 0.6).stroke({ width: 7, color: 0xb8b8c8, cap: 'round' });
      h.moveTo(x - rx * 0.2, y - rx * 0.05).bezierCurveTo(x - rx * 0.1, y - rx * 0.42, x + rx * 0.4, y - rx * 0.6, x + rx * 0.7, y - rx * 0.45).stroke({ width: 4, color: 0x8a8a98, cap: 'round' });
      h.pivot.set(x, y + rx * 0.1);
      h.position.set(x, y + rx * 0.1);
    });
    const stool = new Graphics().rect(190, 900, 200, 26).fill(0x3a1c4a).rect(212, 926, 18, 120).fill(0x3a1c4a).rect(350, 926, 18, 120).fill(0x3a1c4a);
    cast.addChild(stool);
    if (hipo) cast.addChild(hipo);
    if (can) cast.addChild(can);
    const fl = new Graphics();
    cast.addChild(fl);
    if (luz.actor) cast.addChild(luz.actor);
    const beam = new Beam(ctx);
    cast.addChild(beam);
    ctx.plane(cast, { z: 1000 });
    // the makeup counter in front (brushes, a lipstick, a bowl of fish crackers)
    const counter = new Graphics();
    counter.rect(-200, 985, 2400, 140).fill(0xf6e6ee).stroke({ width: 6, color: POP.ink });
    counter.rect(-200, 985, 2400, 16).fill(0xffffff);
    counter.roundRect(560, 925, 70, 70, 10).fill(POP.cyan).stroke({ width: 5, color: POP.ink });
    for (let i = 0; i < 4; i++) counter.moveTo(575 + i * 14, 930).lineTo(565 + i * 18, 860).stroke({ width: 7, color: [POP.hot, POP.gold, POP.lilac, POP.mint][i], cap: 'round' });
    counter.roundRect(1180, 940, 26, 52, 6).fill(0x2a2a36).roundRect(1184, 912, 18, 30, 6).fill(POP.red);
    counter.ellipse(1520, 975, 120, 30).fill(0xffd27a).stroke({ width: 5, color: POP.ink });
    for (let i = 0; i < 9; i++) counter.ellipse(1440 + i * 20, 958 - (i % 2) * 8, 16, 7).fill(0xe8902a).stroke({ width: 2, color: POP.ink });
    ctx.plane(counter, { z: 800 });
    // the mirror's frame: bulbs all around the screen (we are the mirror)
    const frame = new Container();
    const fr = new Graphics();
    fr.rect(-40, -40, 2000, 110).fill(0xf2e8ee).rect(-40, 1010, 2000, 110).fill(0xf2e8ee).rect(-40, -40, 110, 1160).fill(0xf2e8ee).rect(1850, -40, 110, 1160).fill(0xf2e8ee);
    fr.rect(70, 70, 1780, 940).stroke({ width: 6, color: 0xb8a8b8 });
    const bulbs: { s: Sprite | null; x: number; y: number }[] = [];
    const bp: [number, number][] = [];
    for (let x = 160; x < 1800; x += 160) bp.push([x, 18], [x, 1062]);
    for (let y = 150; y < 1000; y += 140) bp.push([18, y], [1902, y]);
    for (const [x, y] of bp) {
      fr.circle(x, y, 26).fill(0xfff6d8).stroke({ width: 4, color: 0xc8b8a0 });
      const s = glowAt(ctx, x, y, 0.55, 0xffe2a8, 0.55);
      bulbs.push({ s, x, y });
    }
    frame.addChild(fr, ...bulbs.map((b) => b.s).filter((s): s is Sprite => !!s));
    ctx.plane(frame, { z: 0, screen: true });
    return {
      update(lt, f) {
        const rm = f.rm;
        // Hipólito centre, Luzterna floats right, Canelo at the left corner
        hipo?.pose(lt, 930, 1080, {});
        if (hipo?.puppet) hipo.puppet.look = lt > 2.2 ? 0.3 : 0;
        const ly = 520 + bob(lt, rm);
        luz.actor?.pose(lt, 1400, ly + 360, { flip: true });
        // her beam combs their heads: over Hipólito (0.6–2.8), then everyone (4.4–6.6)
        const [lx, ly2] = lanternAt(luz);
        const sweep = lt < 3.2 ? seg(lt, 0.6, 2.8) : seg(lt, 4.4, 6.6);
        const on = (lt > 0.5 && lt < 3.2) || (lt > 4.3 && lt < 6.8);
        const tx0 = lt < 3.2 ? 900 + Math.sin(sweep * Math.PI * 3) * 80 : 760 + sweep * 380;
        const ty0 = lt < 3.2 ? 560 : 600 + Math.sin(sweep * Math.PI * 4) * 30;
        beam.set([lx, ly2], [tx0, ty0], 80, on ? 0.75 : 0);
        // the quiff grows where the beam passed
        const qk = springIn(seg(lt, 1.2, 2.4));
        quiffD.onHead.visible = qk > 0.01;
        quiffD.onHead.scale.set(Math.max(0.01, qk));
        quiffD.follow();
        if (hipo && lt > 2.4 && lt < 2.5) hipo.emote('happy');
        // Canelo: excited with them, then he sits a moment in the corner (flame small) and gets up again
        const sitting = lt > 4.6 && lt < 6.1;
        const cx = lt < 6.1 ? 300 : 300 + sm(seg(lt, 6.1, 7)) * 240;
        can?.pose(lt, cx, sitting ? 915 : 1040, { flip: false });
        if (can?.puppet) {
          can.puppet.crouch = sitting ? 0.6 : 0;
          can.puppet.walk = lt > 6.1 ? 1 : 0;
        }
        fl.clear();
        caneloFlame(fl, can, sitting ? FLAME.chica : FLAME.act4, lt, rm);
        // the bulbs breathe a little
        bulbs.forEach((b, i) => {
          if (b.s) b.s.alpha = 0.45 + 0.12 * Math.sin(lt * 2 + i);
        });
        void k;
      },
    };
  },
};

// ------------------------------------------------------------------ 4 · riesgo (27–32.5): the logbook, in her hand
export const riesgo: SetModule = {
  build(ctx: SceneCtx): FilmSet {
    const bg = bokeh(ctx, { colors: [0xffe2a8, POP.pink, 0xfff0d8, POP.lilac], seed: 9, base: 0x3a1c4a, n: 50 });
    ctx.plane(bg, { z: 1400, bake: 'static' });
    const bit = new Bitacora(ctx, 'Que nos saquen de la gira antes del show. El gordo dice que «sería una tragedia». Lo dice por el bufé.', { size: 48, w: 1240 });
    ctx.plane(bit, { z: 0, screen: true });
    return {
      update(lt, f) {
        bit.update(lt, f.rm);
      },
    };
  },
};
