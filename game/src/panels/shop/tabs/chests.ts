/** COFRES: a shop window that links to the Casino's Gacha (Portal de Invocación). No logic duplicated. */
import { Container, Graphics, Sprite, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../../ui/theme';
import { toast } from '../../../ui/modal';
import { icon } from '../../../ui/icons';
import { glowTexture } from '../../../art/textures';
import { G } from '../../../state/game';
import { decorArt } from '../../../island/decor/decorArt';
import { markSeen } from '../../../state/sys/shop';
import type { ShopCtx } from '../ctx';
import { block, Btn, chip, dotCircle, para, t } from '../ui';

async function casino(fn: 'openGacha' | 'openCasino') {
  try {
    const m = await import('../../casino/open');
    m[fn]();
  } catch {
    toast('El Casino abre muy pronto', { sub: 'Están puliendo las fichas.', color: C.paper });
  }
}

export function renderChests(ctx: ShopCtx) {
  const root = ctx.root;
  markSeen('chest:gacha');
  const w = ctx.w;
  const h = ctx.h - 6;
  root.addChild(block(w, h, C.inferno, 10));
  const circ = dotCircle(420, C.red, C.pinkHot, 0.35);
  circ.position.set(w * 0.3, h * 0.55);
  const cm = new Graphics().rect(0, 0, w, h).fill(0xffffff);
  circ.mask = cm;
  root.addChild(circ, cm);
  // rays + chest
  const stage = new Container();
  stage.position.set(w * 0.3, h * 0.58);
  root.addChild(stage);
  const rays = new Graphics();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    rays.poly([0, 0, Math.cos(a - 0.07) * 700, Math.sin(a - 0.07) * 700, Math.cos(a + 0.07) * 700, Math.sin(a + 0.07) * 700]);
  }
  rays.fill({ color: C.yellow, alpha: 0.16 });
  const rm = new Graphics().rect(-w * 0.3, -h * 0.58, w, h).fill(0xffffff);
  rays.mask = rm;
  stage.addChild(rays, rm);
  const gl = new Sprite(glowTexture());
  gl.anchor.set(0.5);
  gl.tint = C.yellow;
  gl.alpha = 0.8;
  gl.scale.set(4, 3.2);
  gl.blendMode = 'add';
  gl.position.set(0, -120);
  stage.addChild(gl);
  const chest = decorArt('cofre_tesoro');
  chest.c.scale.set(3.6);
  stage.addChild(chest.c);
  const capsules: Container[] = [];
  [C.pinkHot, C.cyan, C.yellow, C.violet, C.mint].forEach((col, i) => {
    const c = new Container();
    const g = new Graphics();
    g.roundRect(-18, -30, 36, 60, 18).fill(col).stroke({ width: 3, color: C.ink });
    g.rect(-18, -2, 36, 32).fill(C.paper).stroke({ width: 3, color: C.ink });
    g.roundRect(-18, -30, 36, 60, 18).stroke({ width: 3, color: C.ink });
    g.ellipse(-6, -16, 5, 9).fill({ color: 0xffffff, alpha: 0.5 });
    c.addChild(g);
    c.scale.set(1.5);
    stage.addChild(c);
    capsules.push(c);
    void i;
  });
  // copy
  const x0 = w * 0.58;
  const kick = chip('CASINO «EL GATO NEGRO»', C.yellow, C.ink, 20);
  kick.position.set(x0, 30);
  root.addChild(kick);
  const tt = t('PORTAL DE\nINVOCACIÓN', 100, C.paper, F.poster, { lineHeight: 104 });
  tt.position.set(x0, 70);
  root.addChild(tt);
  const p = para(
    'Los cofres de la tienda viven en el Casino: estandartes con probabilidades visibles y lástima garantizada. Gatos, variantes HOLO y accesorios. Se paga con Boletos (del casino) u Ojos de Gato. Nada de dinero real.',
    w - x0 - 40,
    21,
    C.paper,
  );
  p.position.set(x0, tt.y + tt.height + 18);
  root.addChild(p);
  const tickets = G.s.casino?.tickets ?? 0;
  const tk = new Container();
  const tb = new Graphics().rect(0, 0, 330, 70).fill(C.paper).stroke({ width: 3, color: C.ink });
  const ti = icon('chip', 46);
  ti.position.set(38, 35);
  const tv = t(`${tickets} BOLETO${tickets === 1 ? '' : 'S'}`, 34, C.ink, F.poster);
  tv.position.set(70, 8);
  tk.addChild(tb, ti, tv);
  const gi = new Container();
  const gb = new Graphics().rect(0, 0, 250, 70).fill(C.paper).stroke({ width: 3, color: C.ink });
  const gic = icon('gem', 40);
  gic.position.set(36, 35);
  const gv = t(`${G.s.gems}`, 34, C.ink, F.poster);
  gv.position.set(66, 8);
  gi.addChild(gb, gic, gv);
  tk.position.set(x0, p.y + p.height + 26);
  gi.position.set(x0 + 350, p.y + p.height + 26);
  root.addChild(tk, gi);
  const b1 = new Btn('ABRIR EL PORTAL', () => {
    ctx.close();
    void casino('openGacha');
  }, { w: w - x0 - 40, h: 90, color: C.yellow, fg: C.ink, size: 46 });
  b1.position.set(x0, h - 210);
  const b2 = new Btn('IR AL CASINO', () => {
    ctx.close();
    void casino('openCasino');
  }, { w: w - x0 - 40, h: 64, color: C.paper, fg: C.ink, size: 30 });
  b2.position.set(x0, h - 104);
  root.addChild(b1, b2);
  gsap.to(b1.face.scale, { x: 1.02, y: 1.02, duration: 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  let time = 0;
  const tick = (tkr: Ticker) => {
    time += tkr.deltaMS / 1000;
    rays.rotation = time * 0.18;
    gl.alpha = 0.7 + Math.sin(time * 2.4) * 0.12;
    chest.tick?.(time);
    capsules.forEach((c, i) => {
      const a = time * 0.8 + (i * Math.PI * 2) / capsules.length;
      c.position.set(Math.cos(a) * 290, -150 + Math.sin(a) * 70);
      c.rotation = Math.sin(time * 2 + i) * 0.4;
      c.zIndex = Math.sin(a);
    });
    stage.sortableChildren = true;
  };
  Ticker.shared.add(tick);
  return () => Ticker.shared.remove(tick);
}
