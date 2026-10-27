/**
 * F29 — the arcade (c39–45, style 'pixel': the cats baked as 8-bit sprites) and the stadium coming back by halves
 * (c45–49, pop + a pixel filter on the lower half).
 */
import { Container, Graphics } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { POP, filterHost, pixelFilter, pixelSet, pixelText } from '../../../styles/pop';
import { NG, NG_BAR, NG_BEAT } from '../music';
import { Beam, GlassCube, SLUG, StaticKitten, glitchArm, lanternAt, luzOf, rnd, seg, sm, stadium } from '../kit';
import { beatEnv, esquirlaOf, firmaOf } from './cast';
import { CUBE } from './a';
import { motto } from './screens';

const B = 48; // one block of the level
/** a level block (with the dark sprite edge) */
function block(g: Graphics, x: number, y: number, col: number, top?: number) {
  g.rect(x, y, B, B).fill(col);
  g.rect(x, y, B, 6).fill(top ?? 0xffffff);
  g.rect(x, y + B - 6, B, 6).fill(0x000000);
  g.rect(x + B - 6, y, 6, B).fill({ color: 0x000000, alpha: 0.5 });
}

// ------------------------------------------------------------------ c39–45 · arcade: the level
/** Comecroquetas (his painting: the round yellow arcade cat, the wedge mouth, the croquettes) */
const COMECROQUETAS = 'comecroquetas_pellet_cat';
export const arcade: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', SLUG.hipo, SLUG.emiau, COMECROQUETAS],
  build(ctx: SceneCtx): FilmSet {
    // the sky and the far stadium as pixels
    const sky = new Graphics();
    sky.rect(-200, -200, 2400, 1500).fill(0x0a0a2e);
    for (let i = 0; i < 90; i++) sky.rect(Math.floor(rnd(i) * 48) * 48 - 200, Math.floor(rnd(i + 5) * 14) * 24 - 100, 8, 8).fill(i % 6 ? 0x6a6aa8 : 0xffffff);
    for (let i = 0; i < 14; i++) {
      const h = 160 + Math.floor(rnd(i + 30) * 6) * 40;
      sky.rect(-200 + i * 180, 760 - h, 170, h).fill(0x161648);
      for (let y = 760 - h + 24; y < 740; y += 32) for (let x = -184 + i * 180; x < -40 + i * 180; x += 32) if (rnd(x * 3 + y) > 0.55) sky.rect(x, y, 12, 12).fill([POP.pink, POP.cyan, POP.yellow][Math.floor(rnd(x + y) * 3)]);
    }
    ctx.plane(sky, { z: 1500, bake: 'static' });
    // the level (it scrolls): ground with gaps, floating platforms, the buffet's croquettes, the cube at the end
    const level = new Container();
    const lg = new Graphics();
    const LEN = 5200;
    for (let x = -200; x < LEN; x += B) {
      const gap = (x > 1400 && x < 1540) || (x > 2700 && x < 2850);
      if (gap) continue;
      block(lg, x, 900, 0xc0602a, 0xff9a5a);
      block(lg, x, 948, 0x8a3a1a, 0xc0602a);
      block(lg, x, 996, 0x8a3a1a, 0xc0602a);
    }
    const plats: [number, number, number][] = [
      [1300, 720, 6],
      [2000, 640, 5],
      [2600, 720, 6],
      [3300, 600, 5],
      [3900, 520, 4],
      [4500, 440, 6],
    ];
    for (const [x0, y, n] of plats) for (let i = 0; i < n; i++) block(lg, x0 + i * B, y, 0x2a8a5a, 0x9ff5a8);
    level.addChild(lg);
    const crumbs: Graphics[] = [];
    for (let i = 0; i < 12; i++) {
      const c = new Graphics().rect(-12, -12, 24, 24).fill(0xc87a3a).rect(-12, -12, 24, 6).fill(0xe8a45a).rect(-6, -18, 12, 6).fill(0xc87a3a);
      c.position.set(500 + i * 70, 870);
      level.addChild(c);
      crumbs.push(c);
    }
    // the cube on the last platform
    const cube = new GlassCube(ctx, 220);
    cube.position.set(4500 + 3 * B, 440);
    level.addChild(cube);
    ctx.plane(level, { z: 1000 });
    // Comecroquetas: his painting (the code-drawn round sprite only if it isn't loaded), facing the croquettes
    const pac = new Graphics();
    const PAC_H = 210;
    const pacP = ctx.still(COMECROQUETAS);
    if (pacP) pacP.scale.set(-PAC_H / pacP.texture.height, PAC_H / pacP.texture.height);
    level.addChild(pac);
    if (pacP) level.addChild(pacP);
    // our ship (pixel blocks + a sail)
    const ship = new Graphics();
    for (let i = 0; i < 8; i++) block(ship, -4 * B + i * B, 0, 0xffc2a8, 0xffe8d8);
    for (let i = 1; i < 7; i++) block(ship, -4 * B + i * B, B, 0xd88a6a, 0xffc2a8);
    ship.rect(-6, -320, 12, 320).fill(0x6a4a2a);
    for (let r = 0; r < 5; r++) ship.rect(-r * 30 - 10, -300 + r * 56, r * 30 + 10 + 120 - r * 10, 50).fill(0xfff6e0);
    level.addChild(ship);
    const cast = new Container();
    const can = ctx.actor(ctx.canelo, 230);
    const hip = ctx.actor(SLUG.hipo, 250);
    const em = ctx.actor(SLUG.emiau, 240);
    const lz = luzOf(ctx, 250);
    for (const a of [hip, em, can, lz.actor]) if (a) cast.addChild(a);
    const fx = new Graphics();
    cast.addChild(fx);
    level.addChild(cast);
    // Esquirla's glitch arm (from the top right of the screen toward the cube)
    const arm = new Graphics();
    level.addChild(arm);
    // the HUD (pixel): never a lives counter
    const hud = new Graphics();
    pixelText(hud, 'NIVEL: LA GIRA', 70, 60, 6, 0xffffff, { shadow: 0x000000 });
    pixelText(hud, 'PREMIO: CERITO', 1850, 60, 6, POP.cyan, { align: 'right', shadow: 0x000000 });
    const hp = new Container();
    hp.addChild(hud);
    ctx.plane(hp, { z: 0, screen: true });
    const zz = new Graphics();
    level.addChild(zz);
    const C41 = NG(41) - NG(39);
    return {
      update(lt, f) {
        const rm = f.rm;
        const m = f.m;
        // the level scrolls from c41 (the crew advances); until then the ship enters and Comecroquetas eats
        const scroll = sm(seg(lt, C41, NG(45) - NG(39))) * 3500;
        level.position.set(-scroll, 0);
        // Comecroquetas: rolls right, the mouth open/closed on twos, eating the croquettes he passes
        const px = 380 + seg(lt, 0, C41 + 2) * 1200;
        const open = Math.floor(lt * 8) % 2 === 0 ? 0.6 : 0.08;
        const p = pac.clear();
        if (pacP) {
          // the chomp on the arcade's eighths: a squash on every other step
          pacP.position.set(px - 40, 900);
          pacP.scale.y = (PAC_H / pacP.texture.height) * (open > 0.3 ? 1 : 0.9);
        } else {
          p.moveTo(px, 830).arc(px, 830, 60, open, Math.PI * 2 - open).lineTo(px, 830).fill(0xffe14a).stroke({ width: 6, color: 0x000000 });
          p.poly([px - 44, 790, px - 34, 744, px - 12, 776]).fill(0xffe14a).stroke({ width: 5, color: 0x000000 });
          p.poly([px + 6, 772, px + 26, 740, px + 34, 786]).fill(0xffe14a).stroke({ width: 5, color: 0x000000 });
          p.rect(px - 6, 798, 12, 12).fill(0x000000);
        }
        crumbs.forEach((c) => (c.visible = c.x > px + 20));
        // the ship enters the level (c39 + 0.6) and stops
        const sx = -500 + sm(seg(lt, 0.4, 2.4)) * 900;
        ship.position.set(sx, 804);
        // the crew: Canelo stays behind, tired, leaning on the ship (c39–41); then they advance with the scroll
        const lean = lt < C41 + 0.5;
        can?.pose(lt, lean ? sx - 230 : 400 + scroll, 900, { rot: lean ? 0.14 : 0, step: Math.floor(lt * 8) });
        if (can?.puppet) can.puppet.crouch = lean ? 0.35 : 0;
        const fxg = fx.clear();
        // his flame, as pixels: small
        if (can) {
          const k = lean ? 0.42 : 0.7;
          const tx = can.x + (lean ? 60 : 70);
          const ty = can.y - 150;
          const s = Math.round(4 + 6 * k);
          fxg.rect(tx - s * 2, ty - s * 2, s * 4, s * 4).fill(0xff8a1e).rect(tx - s, ty - s * 3, s * 2, s * 2).fill(0xffe27a);
        }
        // Luzterna, floating over the ship: her light is the POWER-UP (a blue gem that pulses)
        const lxp = lean ? sx + 60 : 700 + scroll;
        lz.actor?.pose(lt, lxp, 620 + Math.round(Math.sin(lt * 3) * 2) * 8, { step: Math.floor(lt * 8) });
        const [lx, ly] = lanternAt(lz);
        const pu = 0.6 + 0.4 * beatEnv(m, 6);
        fxg.rect(lx - 20, ly - 20, 40, 40).fill({ color: 0x9fd8ff, alpha: pu }).rect(lx - 36, ly - 4, 72, 8).fill({ color: 0xffffff, alpha: pu * 0.6 }).rect(lx - 4, ly - 36, 8, 72).fill({ color: 0xffffff, alpha: pu * 0.6 });
        // Hipólito jumps the platforms ASLEEP (arcs on every two beats), «Z» floats over him
        const hopT = (lt - C41) / (NG_BEAT * 2);
        const hx = lt < C41 ? sx - 40 : 560 + scroll + (hopT % 1) * 0;
        const hy = lt < C41 ? 900 : 900 - Math.abs(Math.sin(hopT * Math.PI)) * 220 * (rm ? 0.4 : 1);
        hip?.pose(lt, hx, hy, { step: Math.floor(lt * 8) });
        if (hip?.puppet) hip.puppet.sleeping = true;
        const z = zz.clear();
        if (hip) pixelText(z, 'Z', hip.x + 70, hip.y - 300 - ((lt * 30) % 40), 6, 0xffffff);
        // EMIAU fires on the beat (pixel shots flying right)
        em?.pose(lt, lt < C41 ? sx + 140 : 860 + scroll, 900, { step: ctx.k.beatStep(m) });
        if (lt > C41) {
          const bi = Math.floor(m / NG_BEAT);
          for (let i = 0; i < 4; i++) {
            const t = (m - (bi - i) * NG_BEAT) / NG_BEAT;
            const x = 960 + scroll + t * 420;
            fxg.rect(x, 760 - (i % 2) * 20, 28, 14).fill(POP.pink).rect(x + 28, 760 - (i % 2) * 20, 10, 14).fill(0xffffff);
          }
        }
        // Esquirla's arm reaches for the cube (from c41)
        const a = arm.clear();
        const reach = sm(seg(lt, C41 + 0.5, NG(45) - NG(39)));
        if (reach > 0) glitchArm(a, cube.x + 700, -100, cube.x + 40, cube.y - 120, reach, Math.floor(lt * 12), 34);
        cube.update(lt, { stare: 0.9 });
      },
    };
  },
};

// ------------------------------------------------------------------ c45–49 · mitad: half pixels, half neon; her light pushes the arm
export const mitad: SetModule = {
  cats: ({ canelo }) => [SLUG.firma, SLUG.esquirla, SLUG.cerito, 'luzterna', canelo, SLUG.hipo],
  build(ctx: SceneCtx): FilmSet {
    const px = pixelFilter();
    const host = filterHost([px]);
    const st = stadium(ctx, { seed: 45, into: host });
    ctx.plane(host, { z: 1000 });
    const eq = esquirlaOf(ctx, 1500);
    st.wall.main.content.addChild(new Graphics().rect(0, 0, 1600, 900).fill(0x101018));
    if (eq.actor) st.wall.main.content.addChild(eq.actor);
    for (const p of [st.wall.left, st.wall.right]) p.content.addChild(new Graphics().rect(0, 0, 600, 880).fill(0x2a1450));
    st.wall.strip.content.addChild(motto(2200, 128));
    // the cube on its platform, the arm, the crew arriving, Firma by her trapdoor
    const plat = new Graphics().rect(CUBE[0] - 120, CUBE[1] + 2, 240, 20).fill(0x8a8aa0).rect(CUBE[0] - 110, CUBE[1] + 22, 12, 120).fill(0x6a6a7a).rect(CUBE[0] + 98, CUBE[1] + 22, 12, 120).fill(0x6a6a7a);
    st.stage.addChild(plat);
    const cube = new GlassCube(ctx, 140);
    cube.position.set(CUBE[0], CUBE[1]);
    st.stage.addChild(cube);
    const fm = firmaOf(ctx, 190);
    if (fm.actor) st.stage.addChild(fm.actor);
    const can = ctx.actor(ctx.canelo, 120);
    const hip = ctx.actor(SLUG.hipo, 130);
    const lz = luzOf(ctx, 140);
    for (const a of [can, hip, lz.actor]) if (a) st.stage.addChild(a);
    const arm = new Graphics();
    st.stage.addChild(arm);
    const beam = new Beam(ctx);
    st.stage.addChild(beam);
    return {
      filters: [px],
      update(lt, f) {
        const rm = f.rm;
        const m = f.m;
        const e = beatEnv(m, 9);
        st.update(lt, { rm, phones: 0.5, beams: 0.6 + 0.3 * e, lamps: 0.7 });
        // c45: the stadium comes back HALF — from all pixels to the lower half in 0.4 s
        pixelSet(px, 1 - 0.5 * sm(seg(lt, 0, 0.4)), 12, 4);
        eq.actor?.pose(lt, 820, 1560, {});
        eq.follow();
        fm.actor?.pose(lt, 820, 750, { rot: 0.03 });
        fm.follow();
        // the crew walks to the cube's platform
        const go = sm(seg(lt, 0.6, NG_BAR * 3.2));
        can?.pose(lt, 300 + go * 760, 760, {});
        hip?.pose(lt, 220 + go * 740, 760, {});
        if (can?.puppet) can.puppet.walk = go > 0 && go < 1 ? 1 : 0;
        if (hip?.puppet) hip.puppet.walk = go > 0 && go < 1 ? 1 : 0;
        lz.actor?.pose(lt, 420 + go * 740, 620 + Math.sin(lt * 1.7) * 6, {});
        // the arm reaches in from the top, her beam pushes it back (from c46)
        const push = sm(seg(lt, NG_BAR * 0.6, NG_BAR * 1.8));
        const reach = 0.9 - push * 0.75;
        glitchArm(arm.clear(), CUBE[0] + 420, 120, CUBE[0] + 20, CUBE[1] - 120, Math.max(0.05, reach), Math.floor(lt * 12), 16);
        const [lx, ly] = lanternAt(lz);
        beam.set([lx, ly], [CUBE[0] + 60 + push * 120, CUBE[1] - 160 - push * 40], 60, 0.25 + 0.6 * push);
        cube.update(lt, { stare: 0.9 });
      },
    };
  },
};
void StaticKitten;
