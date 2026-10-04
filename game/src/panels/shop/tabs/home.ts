/** VITRINA: the six animated shop windows (Dragon City concept, Swiss poster execution). */
import { Container, Graphics, Sprite, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { icon } from '../../../ui/icons';
import { G } from '../../../state/game';
import { habitatHouse } from '../../../island/buildingArt';
import { decorArt, DecorArt } from '../../../island/decor/decorArt';
import { catTexture, preloadCats } from '../../../art/catArt';
import { applyCatTint, slugOf } from '../../../art/tint';
import { glowTexture } from '../../../art/textures';
import { catOffers } from '../../../state/sys/shop';
import { storedTotal } from '../../../state/sys/decor';
import type { ShopCtx, ShopPage } from '../ctx';
import { tabNews } from '../news';
import { block, dotCircle, halftoneRect, hoverLift, newSeal, para, sheen, t } from '../ui';

interface Win {
  id: ShopPage;
  title: string;
  sub: string;
  color: number;
  accent: number;
  fg: number;
}

export function renderHome(ctx: ShopCtx) {
  const root = ctx.root;
  const news = tabNews();
  const cols = 3;
  const gap = 26;
  const tw = Math.floor((ctx.w - gap * (cols - 1)) / cols);
  const th = Math.floor((ctx.h - gap - 16) / 2);
  const offers = catOffers().filter((o) => !o.owned).length;
  const wins: Win[] = [
    { id: 'habitats', title: 'HÁBITATS', sub: 'Casas por elemento. Sin casa, no hay oro.', color: C.mint, accent: C.green, fg: C.ink },
    { id: 'edificios', title: 'EDIFICIOS', sub: 'Constructores, ranuras, relojes y más.', color: C.yellow, accent: C.orange, fg: C.ink },
    { id: 'decoracion', title: 'DECORACIÓN', sub: storedTotal() ? `Tienes ${storedTotal()} adorno(s) en el baúl.` : 'Estatuas, neón, piratas… y bonos de set.', color: C.pink, accent: C.pinkHot, fg: C.ink },
    { id: 'orbes', title: 'ORBES', sub: 'Orbes de Alma de tus gatos. Estrellas, ya.', color: C.lilac, accent: C.violet, fg: C.ink },
    { id: 'gatos', title: 'GATOS', sub: offers ? `${offers} común(es) en adopción. Caritos.` : 'Ya adoptaste a todos los comunes.', color: C.orange, accent: C.red, fg: C.ink },
    { id: 'cofres', title: 'COFRES', sub: 'El Portal de Invocación del Casino.', color: C.red, accent: C.inferno, fg: C.paper },
  ];
  const ticks: ((t: number) => void)[] = [];
  wins.forEach((wn, i) => {
    const c = new Container();
    const face = new Container();
    c.addChild(face);
    c.position.set((i % cols) * (tw + gap), Math.floor(i / cols) * (th + gap));
    face.addChild(block(tw, th, wn.color, 10));
    // swiss accent circle + halftone corner
    const circ = dotCircle(th * 0.52, wn.accent, C.ink, 0.22);
    circ.position.set(tw - th * 0.42, th * 0.42);
    const cm = new Graphics().rect(0, 0, tw, th).fill(0xffffff);
    circ.mask = cm;
    face.addChild(circ, cm);
    const ht = halftoneRect(tw * 0.45, th * 0.5, C.ink, 10, 2, 0.12);
    ht.position.set(0, th * 0.5);
    face.addChild(ht);
    // number + coordinates (poster grammar)
    const num = t(`0${i + 1}`, 22, wn.fg, F.bebas, { letterSpacing: 2 });
    num.position.set(20, 14);
    const coord = t(`N 24°${10 + i * 7}′ · TIENDA`, 13, wn.fg, F.ui);
    coord.alpha = 0.7;
    coord.position.set(62, 20);
    face.addChild(num, coord);
    // vignette
    const vig = new Container();
    vig.position.set(tw * 0.75, th * 0.5);
    vig.scale.set(Math.min(1, th / 470));
    face.addChild(vig);
    ticks.push(vignette(wn.id, vig, th));
    // title band
    const band = new Graphics().rect(0, 0, tw * 0.52, 78).fill(C.ink);
    band.position.set(0, th - 150);
    const tt = txt(wn.title, { fontFamily: F.poster, fontSize: 64, fill: wn.id === 'cofres' ? C.yellow : C.paper, letterSpacing: -1 });
    tt.position.set(20, th - 154);
    if (tt.width > tw * 0.52 - 30) tt.scale.set((tw * 0.52 - 30) / tt.width);
    const sub = para(wn.sub, tw * 0.46, 18, wn.fg);
    sub.position.set(20, th - 64);
    face.addChild(band, tt, sub);
    face.addChild(sheen(tw, th, 3.5 + i * 0.4, i * 0.35));
    if ((news[wn.id] ?? 0) > 0) {
      const seal = newSeal(46);
      seal.position.set(tw - 46, 40);
      face.addChild(seal);
    }
    hoverLift(c, face, () => ctx.go(wn.id));
    root.addChild(c);
    gsap.from(face, { y: 40, alpha: 0, duration: 0.3, delay: 0.04 * i, ease: 'back.out(1.8)' });
  });
  let time = 0;
  const tick = (tk: Ticker) => {
    time += tk.deltaMS / 1000;
    for (const f of ticks) f(time);
  };
  Ticker.shared.add(tick);
  return () => Ticker.shared.remove(tick);
}

/** animated little scene per window; returns its tick */
function vignette(id: ShopPage, v: Container, th: number): (t: number) => void {
  const twos = (x: number) => Math.floor(x * 12) / 12;
  switch (id) {
    case 'habitats': {
      const els = G.s.elements.slice(0, 3);
      const houses = els.map((el, i) => {
        const h = habitatHouse(el, Math.min(3, i + 1)).c;
        h.scale.set(1.15 - i * 0.12);
        h.position.set(-120 + i * 110, 40 - i * 30);
        v.addChildAt(h, 0);
        return h;
      });
      return (t) => houses.forEach((h, i) => (h.y = 40 - i * 30 + Math.sin(twos(t) * 2 + i) * 4));
    }
    case 'edificios': {
      const g = new Graphics();
      // crane
      g.rect(40, -190, 12, 200).fill(C.yellow).stroke({ width: 3, color: C.ink });
      for (let y = -180; y < 0; y += 22) g.moveTo(40, y).lineTo(52, y + 18).stroke({ width: 2, color: C.ink });
      g.rect(-110, -196, 200, 12).fill(C.yellow).stroke({ width: 3, color: C.ink });
      g.rect(60, -186, 30, 22).fill(C.ink);
      v.addChild(g);
      const hook = new Container();
      const hg = new Graphics().moveTo(0, 0).lineTo(0, 80).stroke({ width: 2, color: C.ink });
      hg.rect(-26, 80, 52, 40).fill(C.paper).stroke({ width: 3, color: C.ink });
      hg.rect(-18, 88, 36, 6).fill(C.ink).rect(-18, 100, 24, 6).fill(C.ink);
      hook.addChild(hg);
      hook.position.set(-80, -184);
      v.addChild(hook);
      const b = new Graphics();
      b.poly([-150, 40, -90, 70, -90, -20, -150, -50]).fill(0xd9cdb8).stroke({ width: 3, color: C.ink });
      b.poly([-90, 70, -30, 40, -30, -50, -90, -20]).fill(0xb7ad9c).stroke({ width: 3, color: C.ink });
      b.poly([-150, -50, -90, -20, -30, -50, -90, -80]).fill(C.pinkHot).stroke({ width: 3, color: C.ink });
      for (const y of [-6, 26]) b.rect(-80, y, 14, 18).fill(C.yellow).stroke({ width: 2, color: C.ink }).rect(-56, y - 12, 14, 18).fill(C.yellow).stroke({ width: 2, color: C.ink });
      v.addChild(b);
      const gear = icon('scrap', 70);
      gear.position.set(-150, -130);
      v.addChild(gear);
      return (t) => {
        hook.rotation = Math.sin(t * 1.4) * 0.12;
        gear.rotation = twos(t) * 1.5;
      };
    }
    case 'decoracion': {
      const g = new Graphics();
      g.poly([-200, 40, 0, -60, 200, 40, 0, 140]).fill(0x8fcf6a).stroke({ width: 3, color: C.ink });
      g.poly([-200, 40, 0, 140, 0, 160, -200, 60]).fill(0x8a6a42).stroke({ width: 3, color: C.ink });
      g.poly([0, 140, 200, 40, 200, 60, 0, 160]).fill(0x6e5232).stroke({ width: 3, color: C.ink });
      v.addChild(g);
      const arts: DecorArt[] = [];
      const put = (id: string, x: number, y: number, s: number) => {
        const a = decorArt(id);
        a.c.position.set(x, y);
        a.c.scale.set(s);
        v.addChild(a.c);
        arts.push(a);
      };
      put('bandera_pirata', -110, 30, 1.0);
      put('letrero_neon', 100, 34, 0.95);
      put('estatua_canelo', 0, 70, 1.05);
      return (t) => arts.forEach((a) => a.tick?.(t));
    }
    case 'orbes': {
      const tints = [C.violet, C.mint, C.pinkHot, C.yellow];
      const orbs = tints.map((tint, i) => {
        const o = new Container();
        const gl = new Sprite(glowTexture());
        gl.anchor.set(0.5);
        gl.tint = tint;
        gl.alpha = 0.6;
        gl.scale.set(1.5);
        gl.blendMode = 'add';
        const ic = icon('orb', 96 - i * 8, tint);
        o.addChild(gl, ic);
        v.addChild(o);
        return o;
      });
      const pr = new Graphics();
      v.addChildAt(pr, 0);
      return (t) => {
        orbs.forEach((o, i) => {
          const a = t * 1.1 + (i * Math.PI * 2) / orbs.length;
          o.position.set(Math.cos(a) * 150, Math.sin(a) * 60 - 20 + Math.sin(t * 3 + i) * 6);
          o.zIndex = Math.sin(a);
          o.scale.set(0.85 + (Math.sin(a) + 1) * 0.12);
        });
        v.sortableChildren = true;
        pr.clear().ellipse(0, 70, 170, 34).fill({ color: C.ink, alpha: 0.15 });
      };
    }
    case 'gatos': {
      const offer = catOffers().find((o) => !o.owned) ?? catOffers()[0];
      const frame = new Graphics().rect(-120 + 8, -170 + 8, 220, 250).fill(C.ink).rect(-120, -170, 220, 250).fill(C.paper).stroke({ width: 4, color: C.ink });
      v.addChild(frame);
      const holder = new Container();
      v.addChild(holder);
      const slug = slugOf(offer?.def.id ?? 'c_canelo');
      const show = () => {
        if (holder.destroyed) return;
        const sp = new Sprite(catTexture(slug));
        sp.anchor.set(0.5, 0.95);
        sp.scale.set(190 / Math.max(1, sp.texture.width));
        applyCatTint(sp, offer?.def.id ?? 'c_canelo');
        sp.position.set(-10, 70);
        const m = new Graphics().rect(-116, -166, 212, 242).fill(0xffffff);
        sp.mask = m;
        holder.addChild(m, sp);
      };
      void preloadCats([slug]).then(show);
      const tag = new Container();
      const tg = new Graphics().rect(0, 0, 150, 40).fill(C.yellow).stroke({ width: 3, color: C.ink });
      const tt = t('SE ADOPTA', 24, C.ink, F.poster);
      tt.position.set(14, 3);
      tag.addChild(tg, tt);
      tag.position.set(10, 50);
      tag.rotation = -0.12;
      v.addChild(tag);
      return (tm) => {
        holder.y = Math.sin(twos(tm) * 2) * 3;
        tag.rotation = -0.12 + Math.sin(tm * 2) * 0.03;
      };
    }
    case 'cofres': {
      const gl = new Sprite(glowTexture());
      gl.anchor.set(0.5);
      gl.tint = C.yellow;
      gl.alpha = 0.7;
      gl.scale.set(2.4, 2);
      gl.blendMode = 'add';
      gl.position.set(0, -60);
      v.addChild(gl);
      const rays = new Graphics();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        rays.poly([0, 0, Math.cos(a - 0.08) * 260, Math.sin(a - 0.08) * 260, Math.cos(a + 0.08) * 260, Math.sin(a + 0.08) * 260]);
      }
      rays.fill({ color: C.yellow, alpha: 0.22 });
      rays.position.set(0, -60);
      v.addChildAt(rays, 0);
      const chest = decorArt('cofre_tesoro');
      chest.c.scale.set(2);
      chest.c.position.set(0, 40);
      v.addChild(chest.c);
      return (tm) => {
        rays.rotation = tm * 0.25;
        chest.tick?.(tm);
        chest.c.y = 40 + Math.abs(Math.sin(twos(tm) * 2.4)) * -8;
      };
    }
  }
  void th;
  return () => undefined;
}
