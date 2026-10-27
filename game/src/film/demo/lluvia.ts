/**
 * DEMO · III «Siempre llueve» (noir realism). One long take in the rain:
 *
 *   0–7 s   the camera cranes down from the rooftops and the HOTEL neon to the street; the rack focus goes from the
 *           neon's building (1800) to the street (1000): the far skyline melts into bokeh, the neon softens to its glow
 *   4–9 s   Canelo walks in from the left into the lamp's cone and stops in the light; his reflection trembles in the
 *           wet asphalt; rain is caught in the cone (brighter streaks), splashes, rings in the puddles, god rays
 *   9.3 s   LIGHTNING: the neon shorts out — and for an instant, at the end of the street, someone with a lantern
 *           (Luzterna: her own painting as a silhouette with a rim of light, eyes lit, the lantern kept in colour)
 *   9.6–    she stays; her lantern lights up BLUE: the only new colour in the mono world (the post's kept hue turns from
 *           the neon's magenta to her blue). Dutch angle, a slow push in. The iris will close on her lantern.
 *
 * Planes: sky (6000) · bolts (5200) · far skyline (3600, dof) · fog (2400) · mid buildings (1800, dof) + the neon (1799,
 * live) · Luzterna (1700) · the street (1000: asphalt, curbs, lamp, cone, reflections under a wet filter, splashes,
 * Canelo) · fence and hydrant in front (560, dof) · drops on the lens (screen).
 */
import { Container, Graphics, Rectangle, Sprite, TilingSprite, type Texture } from 'pixi.js';
import type { FilmSet, Plane, SceneCtx, SetModule } from '../stage';
import { building, flickerAt, LensDrops, makeWet, neon, NR, setWet } from '../styles/noir';
import { Silueta, siluetaKeep } from '../../momentos/songs/drunck/silueta';

const MIRROR = 812;
const LAMP: [number, number] = [612, 300];
const LUZ_AT: [number, number] = [1300, 700];
const STRIKE = 9.3;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const sm = (x: number) => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};

const mod: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna'],
  build(ctx: SceneCtx): FilmSet {
    const b = ctx.baker;
    const k = ctx.k;
    const hi = ctx.quality === 'high';
    // ---- sky
    const sky = new Container();
    const clouds = new TilingSprite({ texture: ctx.tex('nr:clouds') as Texture, width: 3600, height: 900 });
    clouds.position.set(-840, -420);
    clouds.tileScale.set(1.6, 1.1);
    const moonGlow = new Sprite(ctx.tex('nr:halo'));
    moonGlow.anchor.set(0.5);
    moonGlow.position.set(1500, -40);
    moonGlow.scale.set(3);
    moonGlow.alpha = 0.12;
    moonGlow.blendMode = 'add';
    sky.addChild(new Graphics().rect(-900, -600, 3720, 1800).fill(0x05060a), clouds, moonGlow);
    ctx.plane(sky, { z: 6000 });

    // ---- far skyline (bokeh when out of focus)
    const far = new Graphics();
    let x = -700;
    let i = 0;
    while (x < 2700) {
      const w = 110 + ((i * 53) % 140);
      const top = 300 + ((i * 97) % 170);
      building(far, x, top, w, 760 - top, { seed: 100 + i, color: 0x10141c, lit: 0.12, cols: Math.max(2, Math.floor(w / 40)), rows: Math.floor((760 - top) / 42) });
      x += w + 8;
      i++;
    }
    ctx.plane(far, { z: 3600, bake: 'dof', blur: 10, dof: 2600 });

    // ---- mid buildings: left block, right block with the HOTEL neon; the street recedes between them
    const mid = new Graphics();
    building(mid, -520, 40, 980, 900, { seed: 7, color: NR.wall, lit: 0.22, escape: true, blinds: true, cols: 9, rows: 9 });
    building(mid, 1440, -60, 1100, 1000, { seed: 9, color: 0x1d232d, lit: 0.18, escape: true, blinds: true, cols: 10, rows: 10 });
    // the far end of the street: a low wall and a gap of darkness where she will stand
    mid.rect(460, 560, 980, 200).fill(0x0d1016);
    building(mid, 470, 470, 330, 290, { seed: 13, color: 0x151a22, lit: 0.3, cols: 4, rows: 3 });
    building(mid, 1090, 430, 350, 330, { seed: 15, color: 0x151a22, lit: 0.25, cols: 4, rows: 3 });
    const midPlane = ctx.plane(mid, { z: 1800, bake: 'dof', blur: 12, dof: 2400 });
    const sign = neon(b, k.text, 'HOTEL', { size: 92, color: NR.neon, vertical: true });
    sign.root.position.set(1530, 250);
    const signBox = new Graphics().roundRect(1478, -10, 104, 530, 10).fill(0x0b0d12).roundRect(1478, -10, 104, 530, 10).stroke({ width: 3, color: 0x2a303a });
    const signNode = new Container();
    signNode.addChild(signBox, sign.root);
    const signPlane = ctx.plane(signNode, { z: 1799 });

    // ---- Luzterna at the end of the street (a silhouette from her own painting)
    const luzNode = new Container();
    const luz = ctx.actor('luzterna', 170);
    let sil: Silueta | null = null;
    const blue = new Sprite(ctx.tex('nr:halo'));
    blue.anchor.set(0.5);
    blue.blendMode = 'add';
    blue.tint = NR.blue;
    let lanternLocal: [number, number] = [-40, -90];
    if (luz?.puppet) {
      luzNode.addChild(luz);
      const p = luz.puppet;
      const keep = siluetaKeep('luzterna');
      sil = new Silueta(p, { body: 0x141822, light: { dir: [0, 0], color: 0xdfe8ff, width: 3 }, eyes: 'glow', eyeColor: 0xbfe0ff, keep, keepGlow: 1 });
      sil.set(1, 0);
      const r = keep?.[0];
      if (r) lanternLocal = [(r[0] - p.anchor.x * p.W) * p.scale.x, (r[1] - p.anchor.y * p.H) * p.scale.y];
    }
    luzNode.addChild(blue);
    const luzPlane = ctx.plane(luzNode, { z: 1700 });

    // ---- the street
    const street = new Container();
    const ground = new Graphics();
    const vp: [number, number] = [960, 640];
    // asphalt in bands (darker far), sidewalks, curbs converging to the vanishing point
    for (let j = 0; j < 20; j++) {
      const y0 = 700 + j * 24;
      ground.rect(-900, y0, 3720, 25).fill(j < 4 ? 0x12161d : j < 10 ? 0x181d25 : 0x1e242d);
    }
    ground.poly([-900, 1180, vp[0] - 140, 700, vp[0] - 110, 700, -560, 1180]).fill(0x1a1f27);
    ground.poly([2820, 1180, vp[0] + 140, 700, vp[0] + 110, 700, 2480, 1180]).fill(0x1a1f27);
    ground.moveTo(-560, 1180).lineTo(vp[0] - 110, 700).stroke({ width: 4, color: 0x2c333e });
    ground.moveTo(2480, 1180).lineTo(vp[0] + 110, 700).stroke({ width: 4, color: 0x2c333e });
    // puddles (a touch lighter: they mirror the sky)
    for (const [px, py, rx, ry] of [
      [700, 900, 230, 30],
      [1180, 980, 300, 40],
      [380, 1040, 260, 36],
      [1500, 860, 180, 22],
    ])
      ground.ellipse(px, py, rx, ry).fill({ color: 0x2c3442, alpha: 0.9 });
    // the lamp post
    const post = new Graphics()
      .rect(LAMP[0] - 9, LAMP[1], 18, 900 - LAMP[1])
      .fill(0x07080b)
      .rect(LAMP[0] - 22, 880, 44, 26)
      .fill(0x07080b)
      .moveTo(LAMP[0], LAMP[1] + 10)
      .lineTo(LAMP[0] + 70, LAMP[1] - 20)
      .stroke({ width: 8, color: 0x07080b })
      .roundRect(LAMP[0] + 40, LAMP[1] - 26, 70, 22, 6)
      .fill(0x07080b);
    const staticStreet = new Container();
    staticStreet.addChild(ground, post);
    // reflections: mirrored lights, stretched and trembling (one full-screen wet pass)
    const refl = new Container();
    const reflHalo = (x0: number, y0: number, base: number, tint: number, sc: number, a: number) => {
      const sp = new Sprite(ctx.tex('nr:halo'));
      sp.anchor.set(0.5);
      sp.blendMode = 'add';
      sp.tint = tint;
      sp.position.set(x0, base + (base - y0) * 0.55);
      sp.scale.set(sc * 0.7, sc * 1.6);
      sp.alpha = a;
      refl.addChild(sp);
      return sp;
    };
    const rNeon = reflHalo(1530, 250, 760, NR.neon, 1.7, 0.9);
    const rLamp = reflHalo(LAMP[0] + 75, 560, 905, NR.sodium, 1.2, 0.5);
    const rLuz = reflHalo(LUZ_AT[0] - 30, 640, 760, NR.blue, 0.7, 0);
    const winRefl: Sprite[] = [];
    for (let j = 0; j < 10; j++) winRefl.push(reflHalo(200 + j * 190 + ((j * 37) % 60), 420 + ((j * 53) % 160), 760, NR.window, 0.4, 0.28));
    const caneloRefl = ctx.still(ctx.canelo, 0.5, 0.03);
    if (caneloRefl) {
      caneloRefl.scale.set(250 / (caneloRefl.texture.height || 700), (-250 / (caneloRefl.texture.height || 700)) * 0.9);
      caneloRefl.alpha = 0.32;
      refl.addChild(caneloRefl);
    }
    const wet = makeWet();
    refl.filterArea = new Rectangle(-4000, -4000, 9920, 9080);
    refl.filters = [wet];
    // the lamp's light: cone, pool on the ground, the bulb's halo
    const cone = new Sprite(ctx.tex('nr:cone'));
    cone.anchor.set(0.5, 0);
    cone.position.set(LAMP[0] + 75, LAMP[1] - 6);
    cone.scale.set(1.25, 0.82);
    cone.blendMode = 'add';
    cone.alpha = 0.55;
    const pool = new Sprite(ctx.tex('nr:halo'));
    pool.anchor.set(0.5);
    pool.position.set(LAMP[0] + 80, 905);
    pool.scale.set(2.6, 0.55);
    pool.blendMode = 'add';
    pool.tint = NR.sodium;
    pool.alpha = 0.45;
    const bulb = new Sprite(ctx.tex('nr:halo'));
    bulb.anchor.set(0.5);
    bulb.position.set(LAMP[0] + 75, LAMP[1] - 8);
    bulb.scale.set(0.9);
    bulb.blendMode = 'add';
    bulb.tint = 0xffe2b8;
    const rainFx = ctx.weather('rain');
    const canelo = ctx.actor(ctx.canelo, 250);
    street.addChild(staticStreet, refl, pool);
    if (rainFx?.ground) street.addChild(rainFx.ground);
    if (canelo) street.addChild(canelo);
    street.addChild(cone, bulb);
    const rays = ctx.weather('rays');
    if (rays) street.addChildAt(rays.node, 2);
    const streetPlane = ctx.plane(street, { z: 1000 });

    // ---- in front: a railing and a hydrant (out of focus)
    const fg = new Graphics();
    for (let j = 0; j < 9; j++) fg.rect(-220 + j * 52, 820, 12, 330).fill(0x050608);
    fg.rect(-240, 830, 480, 14).fill(0x050608).rect(-240, 1000, 480, 12).fill(0x050608);
    fg.roundRect(1700, 900, 110, 220, 30).fill(0x07080b).rect(1680, 960, 150, 30).fill(0x07080b).circle(1755, 900, 46).fill(0x07080b);
    ctx.plane(fg, { z: 560, bake: 'dof', blur: 18, dof: 520 });

    // ---- drops on the lens (screen)
    const drops = new LensDrops(ctx.tex('nr:halo'), hi ? 16 : 9, 9);
    ctx.plane(drops.root, { z: 0, screen: true });

    // where things are on screen this frame (for the rain light, the iris, the lens dirt)
    const at = { lamp: [LAMP[0] + 75, LAMP[1]] as [number, number], lantern: [1300, 600] as [number, number] };
    const fogFx = ctx.weather('fog');
    void fogFx;
    const walkX = (lt: number) => (lt < 4 ? -200 : lt < 9 ? -200 + ((lt - 4) / 5) * 880 - Math.sin(((lt - 4) / 5) * Math.PI) * 10 : 680);
    return {
      update(lt, f) {
        // the neon: buzzing, softened by the rack focus (the tube fades, the glow stays), dead after the strike
        const blurMid = (midPlane as Plane).x.blur;
        const alive = lt < STRIKE ? 1 : lt < STRIKE + 0.5 ? (Math.floor(lt * 20) % 2 ? 0.2 : 0.8) : 0.04;
        const fl = flickerAt(lt, 2) * alive;
        sign.tube.alpha = fl * (1 - blurMid * 0.85);
        sign.glow.alpha = fl * (0.75 + blurMid * 0.25);
        rNeon.alpha = 0.9 * fl;
        // Canelo walks into the light, stops, looks to the end of the street after the strike
        if (canelo) {
          const wx = walkX(lt);
          const walking = lt > 4 && lt < 9;
          const bob = walking && !f.rm ? Math.abs(Math.sin(lt * 7)) * 5 : 0;
          canelo.pose(lt, wx, 905 - bob, { flip: true });
          if (canelo.puppet) {
            canelo.puppet.walk = walking ? 1 : 0;
            canelo.puppet.look = lt > STRIKE + 0.3 ? 0.9 : 0.1;
          }
          if (caneloRefl) {
            caneloRefl.position.set(wx, 910 + bob);
            caneloRefl.scale.x = -Math.abs(caneloRefl.scale.x);
          }
        }
        // Luzterna: hidden in the dark until the strike, then a silhouette whose lantern lights up blue
        const seen = lt >= STRIKE ? 1 : 0;
        const lantern = sm((lt - STRIKE - 0.4) / 1.2);
        luzNode.alpha = seen ? Math.max(f.lit, 0.35 + 0.65 * lantern) : 0;
        if (luz) luz.pose(lt, LUZ_AT[0], LUZ_AT[1], {});
        blue.position.set(LUZ_AT[0] + lanternLocal[0], LUZ_AT[1] + lanternLocal[1]);
        blue.scale.set(0.3 + lantern * 0.22 + Math.sin(lt * 2.1) * 0.02);
        blue.alpha = lantern * 0.9;
        rLuz.alpha = lantern * 0.5;
        sil?.update(0);
        // the lamp hums
        const hum = 0.92 + 0.08 * Math.sin(lt * 50) * Math.sin(lt * 1.3);
        cone.alpha = 0.5 * hum;
        bulb.alpha = 0.95 * hum;
        rLamp.alpha = 0.5 * hum;
        for (const [j, w] of winRefl.entries()) w.alpha = 0.26 + 0.05 * Math.sin(lt * 0.7 + j);
        setWet(wet, lt, f.rm ? 0.4 : 1, 40, k.renderer.resolution);
        // screen points this frame
        at.lamp = f.toScreen(streetPlane, [LAMP[0] + 75, LAMP[1]]);
        at.lantern = f.toScreen(luzPlane, [LUZ_AT[0] + lanternLocal[0], LUZ_AT[1] + lanternLocal[1]]);
        drops.update(lt, 0.7, (dx, dy) => (Math.hypot(dx - at.lamp[0], dy - at.lamp[1]) < 420 ? NR.sodium : 0xb8c4d8), f.rm);
        void signPlane;
      },
      light(sx, sy) {
        // rain caught in the cone under the lamp (screen space)
        const [lx, ly] = at.lamp;
        const dy = sy - ly;
        if (dy < 0) return Math.max(0, 1 - Math.hypot(sx - lx, sy - ly) / 120) * 0.6;
        const half = 30 + dy * 0.62;
        const inside = 1 - clamp01((Math.abs(sx - lx) - half * 0.6) / (half * 0.4));
        return inside * clamp01(1 - dy / 700);
      },
      look(lt) {
        // after the strike the neon's magenta dies and HER blue becomes the kept colour
        const kblue = sm((lt - STRIKE - 0.4) / 1.4);
        return kblue > 0 ? { accHue: kblue > 0.5 ? 0.6 : 0.93, accW: 0.06 + 0.04 * kblue, warm: -0.06 * kblue } : null;
      },
      anchor(name) {
        if (name === 'lantern') return at.lantern;
        return null;
      },
      dirtAt: () => [clamp01(at.lamp[0] / 1920), clamp01(at.lamp[1] / 1080)],
      filters: [wet],
      destroy() {
        sil?.destroy();
      },
    };
  },
};
export default mod;
