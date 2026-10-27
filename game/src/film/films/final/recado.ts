/**
 * F39 · PH «El recado» · créditos · «Continuará» (H96, R1–R13). The game's own painting, no filters: day, then dusk.
 * Canelo, with both scarves, at the foot of the dark lighthouse by the broken lantern. The Part I note in her hand, and
 * under it in grey what she said that night. DÍSELO (a gate, no clock). The Bitácora says it. He buries his face in her
 * scarf; puts the broken lantern on the shelf; climbs; lights the lighthouse with his own small flame — ORANGE, not
 * hers; the beam sweeps toward the island; he sleeps on the page with Cerito. The credits over the Carta de las Cajas she
 * drew (her margin notes, the boxes she did not finish, in pencil). Black. The Capi's hand writes «Continuará.» Silence.
 */
import { Container, Graphics, Sprite, Text } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../stage';
import { beamFan, COL, homeSet, knitScarf, lantern, STAND_INS } from './props';
import { parchment } from '../../styles/davinci';
import { CONTINUAR } from './timing';

const sm = (x: number) => {
  const k = Math.max(0, Math.min(1, x));
  return k * k * (3 - 2 * k);
};

const mod: SetModule = {
  cats: ({ canelo }) => [canelo, STAND_INS.ceritoGato],
  build(ctx: SceneCtx): FilmSet {
    const id = ctx.scene.id;
    if (id === 'creditos' || id === 'continuara') return carta(ctx, id === 'continuara');
    return isla(ctx, id);
  },
};
export default mod;

function isla(ctx: SceneCtx, id: string): FilmSet {
  const light = id === 'faro' ? 'dusk' : 'day';
  const isl = homeSet(ctx, light, { x: 1000 });
  const st = new Container();
  const gy = (x: number) => isl.ground(x) + 4;
  const step = isl.step;
  const can = ctx.actor(ctx.canelo, 200);
  const cer = ctx.actor(STAND_INS.ceritoGato, 110);
  const knit = knitScarf(110);
  const broken = lantern(true, 0.9, true);
  const shelf = new Graphics().rect(step[0] - 120, step[1] - 150, 90, 8).fill(0x6a4a2a);
  const glow = new Graphics();
  const page = new Graphics().poly([980, gy(980) - 6, 1240, gy(1240) - 10, 1250, gy(1250) + 30, 970, gy(970) + 34]).fill(0xf6f0e2);
  const fan = beamFan(COL.orange, 1700, 0.08);
  fan.position.set(...isl.lamp);
  fan.visible = false;
  st.addChild(shelf, page, fan, glow, broken);
  if (cer) st.addChild(cer);
  if (can) st.addChild(can);
  st.addChild(knit);
  ctx.plane(st, { z: 1000 });
  // the old note (R2): her hand, the Part I text, and in grey what she said that night
  const note = new Container();
  const paper = new Graphics().roundRect(0, 0, 900, 300, 10).fill(0xf0e2c0).roundRect(0, 0, 900, 300, 10).stroke({ width: 2, color: 0xb89a6a });
  const t1 = new Text({ text: '…Si algo me pasa, Capi, dile a Canelo\nque su bufanda siempre me pareció horrible.\nCon cariño.', style: { fontFamily: 'Permanent Marker', fontSize: 34, fill: 0x2a2a4a, lineHeight: 46 } });
  t1.position.set(34, 28);
  const t2 = new Text({ text: 'Te lo pidió hace mucho. Antes del Primer Mar.', style: { fontFamily: 'Space Grotesk', fontSize: 20, fill: 0x6a6050 } });
  t2.position.set(34, 186);
  const t3 = new Text({ text: 'Gordo… tu bufanda… siempre me… …me pareció horrible.', style: { fontFamily: 'Permanent Marker', fontSize: 24, fill: 0x8a8a90 } });
  t3.position.set(34, 236);
  note.addChild(paper, t1, t2, t3);
  note.position.set(510, 150);
  note.alpha = 0;
  const ui = new Container();
  ui.addChild(note);
  ctx.plane(ui, { z: 0, screen: true });
  return {
    update(lt, f) {
      // R1–R2 / R5 (buries his face, lies down) / R6 (the lantern to the shelf) / R7–R10 (climbs, lights, sleeps)
      const sit: [number, number] = [step[0] - 150, gy(step[0] - 150)];
      let cx = sit[0];
      let cy = sit[1];
      let rot = 0;
      if (id === 'diselo') {
        const bury = sm((lt - 5) / 2) * (1 - sm((lt - 11) / 1.5));
        rot = -bury * 0.25;
        const shelfGo = sm((lt - 13) / 4);
        cx = sit[0] + shelfGo * 40;
        broken.position.set(step[0] + (step[0] - 75 - step[0]) * shelfGo, step[1] - 2 + (step[1] - 154 - (step[1] - 2)) * shelfGo);
      } else broken.position.set(id === 'faro' ? step[0] - 75 : step[0], id === 'faro' ? step[1] - 154 : step[1] - 2);
      if (id === 'faro') {
        // he climbs (we only see the lamp take his light), then sleeps on the page with Cerito
        const top = lt < 9;
        if (top) {
          cx = isl.lamp[0];
          cy = isl.lamp[1] + 60;
        } else {
          cx = 1100;
          cy = gy(1100);
          rot = 0;
        }
        const lit = sm((lt - 4) / 1.5);
        glow.clear();
        if (lit > 0) glow.circle(isl.lamp[0], isl.lamp[1], 60 + 30 * lit).fill({ color: COL.orange, alpha: 0.5 * lit });
        fan.visible = lt > 9;
        fan.rotation = Math.PI * 0.62 + Math.sin(lt * (f.rm ? 0.12 : 0.35)) * 0.4;
        fan.scale.set(0.4 + 0.6 * Math.abs(Math.cos(lt * 0.18)), 1);
        if (can?.puppet) can.puppet.sleeping = lt > 16;
        if (cer) {
          cer.visible = lt > 14;
          cer.pose(lt, 1190, gy(1190), { flip: true });
          if (cer.puppet) cer.puppet.sleeping = true;
        }
      } else if (cer) cer.visible = false;
      if (can) {
        can.visible = !(id === 'faro' && lt < 9 && lt > 1);
        can.pose(lt, cx, cy, { flip: false, rot });
      }
      knit.position.set(cx - 10, cy - 120);
      knit.scale.set(0.7);
      knit.visible = !!can?.visible;
      note.alpha = id === 'dia' ? sm((lt - 6) / 0.8) : 0;
    },
  };
}

/** R11–R13 — her Carta de las Cajas under the credits; then black, and the Capi writes «Continuará.» */
function carta(ctx: SceneCtx, end: boolean): FilmSet {
  const n = new Container();
  const map = new Sprite(parchment(ctx.baker, 2400, 1500, 9));
  map.position.set(-240, -210);
  const g = new Graphics();
  // the boxes she drew (in wax and pencil) and the ones she did not finish (dashed, half-traced)
  const boxes: [number, number, number, number, boolean][] = [
    [260, 220, 220, 160, true],
    [620, 160, 260, 180, true],
    [1000, 260, 200, 150, true],
    [1320, 180, 240, 170, false],
    [420, 560, 240, 170, true],
    [820, 600, 220, 160, false],
    [1200, 560, 260, 180, false],
  ];
  for (const [x, y, w, h, done] of boxes) {
    if (done) g.rect(x, y, w, h).fill({ color: 0xd8a860, alpha: 0.25 }).rect(x, y, w, h).stroke({ width: 4, color: 0x5a3a1a });
    else for (let i = 0; i < 16; i++) if (i % 2 === 0) g.moveTo(x + (w * i) / 16, y).lineTo(x + (w * (i + 1)) / 16, y).stroke({ width: 2, color: 0x6a6a6a, alpha: 0.7 });
  }
  g.moveTo(480, 300).bezierCurveTo(560, 260, 580, 240, 620, 250).stroke({ width: 3, color: 0x8a3a1e });
  const notes = ['aquí vive el gordo', '¿y si hay una caja sin gatos?', 'pendiente: dibujar el bar'].map((s, i) => {
    const t = new Text({ text: s, style: { fontFamily: 'Permanent Marker', fontSize: 26, fill: 0x2a2a4a } });
    t.position.set([300, 1240, 840][i], [410, 400, 790][i]);
    t.rotation = [-0.05, 0.04, -0.02][i];
    return t;
  });
  n.addChild(map, g, ...notes);
  ctx.plane(n, { z: 1000, bake: 'static' });
  // the credits as data, over her map
  const credits = new Container();
  const lines = ['NO ONE LIKE CATS', 'PARTE III', 'FUERA DE LA CAJA', '', 'Las canciones: originales del autor', '', 'A mi familia.'];
  lines.forEach((l, i) => {
    const t = new Text({ text: l, style: { fontFamily: i < 3 ? 'Bebas Neue' : 'Playfair Display', fontStyle: i < 3 ? 'normal' : 'italic', fontSize: i === 0 ? 72 : i < 3 ? 44 : 34, fill: 0xfaf3e2, letterSpacing: i < 3 ? 10 : 0, stroke: { color: 0x2a1a0a, width: 6, join: 'round' } } });
    t.anchor.set(0.5);
    t.position.set(960, 1180 + i * 90);
    credits.addChild(t);
  });
  const ui = new Container();
  const black = new Graphics().rect(-600, -400, 3120, 1880).fill(0x000000);
  // «Continuará.» (R12–R13): the Capi's hand writes it, small, in the bottom margin of HER Carta — the pencil, not her
  // ink; the series' word, whispered (CONTINUAR.T: black, the map comes up dim, the hand writes, it holds, black)
  const cont = new Text({ text: 'Continuará.', style: { fontFamily: 'Playfair Display', fontStyle: 'italic', fontSize: 46, fill: 0x1e1a2e } });
  cont.anchor.set(0, 0.5);
  cont.position.set(CONTINUAR.x, CONTINUAR.y);
  const mask = new Graphics();
  cont.mask = mask;
  const tip = new Graphics().poly([0, 0, 7, -22, 13, -19]).fill(0x2a2a30).poly([0, 0, 3, -8, 6, -7]).fill(0x505058);
  ui.addChild(credits, black, cont, mask, tip);
  ctx.plane(ui, { z: 0, screen: true });
  return {
    update(lt, f) {
      credits.visible = !end;
      credits.position.y = -lt * 52;
      black.visible = end;
      cont.visible = end;
      tip.visible = false;
      mask.clear();
      if (!end) return;
      const C = CONTINUAR;
      // black → her map, dim → (the hand writes) → hold → black
      black.alpha = 1 - (1 - C.dim) * sm((lt - C.mapIn) / C.mapDur) * (1 - sm((lt - C.out) / C.outDur));
      const w = sm((lt - C.write) / C.writeDur);
      const wpx = (cont.width + 10) * w;
      if (w > 0) mask.rect(cont.x - 4, cont.y - 40, wpx, 80).fill(0xffffff);
      cont.alpha = 1 - sm((lt - C.out) / C.outDur);
      // the pencil's point rides the end of the line while it writes (a tiny bob on the letters' rhythm)
      tip.visible = w > 0 && w < 1;
      tip.position.set(cont.x + wpx - 6, cont.y + 14 + (f.rm ? 0 : Math.sin(lt * 26) * 3));
    },
  };
}
