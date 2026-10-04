/** Casino juice: coin fountains, win banners and the T3 jackpot takeover (Le Chat Noir poster). */
import { Container, Graphics, Rectangle, Sprite, Text, Texture, TilingSprite } from 'pixi.js';
import { RGBSplitFilter } from 'pixi-filters';
import gsap from 'gsap';
import { W, H, game } from '../../core/App';
import { F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { icon } from '../../ui/icons';
import { Particles } from '../../fx/particles';
import { flash, onomatopoeia, speedLines, sparkles } from '../../fx/juice';
import { settings } from '../../core/settings';
import { halftoneTexture, paperTexture } from '../../art/textures';
import { CP, chipIcon, ticketIcon } from './kit';
import { csfx } from './sfx';

const texCache = new Map<string, Texture>();
function bake(key: string, make: () => Container, px = 64): Texture {
  const t = texCache.get(key);
  if (t && !t.destroyed) return t;
  const wrap = new Container();
  const n = make();
  n.position.set(px / 2, px / 2);
  wrap.addChild(n);
  const tex = game.pixi.renderer.generateTexture({ target: wrap, frame: new Rectangle(0, 0, px, px), resolution: 2, antialias: true });
  wrap.destroy({ children: true });
  texCache.set(key, tex);
  return tex;
}
export const coinTex = () => bake('coin', () => icon('gold', 52));
export const gemTex = () => bake('gem', () => icon('gem', 48));
export const chipTex = () => bake('chip', () => chipIcon(50));
export const ticketTex = () => bake('ticket', () => ticketIcon(46));
export const fishTex = () => bake('fish', () => icon('food', 46));

export type Loot = 'gold' | 'gems' | 'chips' | 'tickets' | 'food';
function texFor(k: Loot) {
  return k === 'gold' ? coinTex() : k === 'gems' ? gemTex() : k === 'chips' ? chipTex() : k === 'tickets' ? ticketTex() : fishTex();
}

/** coins burst upward from (x,y) and rain down (stepped "on twos") */
export function coinFountain(p: Particles, x: number, y: number, kind: Loot = 'gold', n = 24, power = 1) {
  const count = settings.reduceMotion ? Math.ceil(n / 3) : n;
  p.burst(x, y, {
    count,
    texture: texFor(kind),
    speed: [500 * power, 1100 * power],
    angle: [-Math.PI * 0.85, -Math.PI * 0.15],
    gravity: 1500,
    drag: 0.4,
    life: [1.0, 1.8],
    scale: [0.55, 1],
    endScale: 0.8,
    spin: 8,
  });
}

/** coins fall from the top of the screen across a width */
export function coinRain(p: Particles, kind: Loot = 'gold', n = 60, x0 = 0, x1 = W) {
  const count = settings.reduceMotion ? Math.ceil(n / 4) : n;
  for (let i = 0; i < count; i++) {
    window.setTimeout(() => {
      if (p.destroyed) return;
      p.burst(x0 + Math.random() * (x1 - x0), -40, { count: 1, texture: texFor(kind), speed: [100, 300], angle: [Math.PI * 0.4, Math.PI * 0.6], gravity: 900, drag: 0.2, life: [1.6, 2.4], scale: [0.6, 1.1], endScale: 1, spin: 6 });
    }, i * 28);
  }
}

/** loot sprites arc from a point into a HUD pill (coin sound on each arrival) */
export function flyLoot(layer: Container, kind: Loot, from: { x: number; y: number }, to: { x: number; y: number }, n = 10, onDone?: () => void) {
  const count = settings.reduceMotion ? Math.min(3, n) : n;
  let left = count;
  for (let i = 0; i < count; i++) {
    const s = new Sprite(texFor(kind));
    s.anchor.set(0.5);
    s.scale.set(0.7);
    s.position.set(from.x + (Math.random() - 0.5) * 80, from.y + (Math.random() - 0.5) * 40);
    layer.addChild(s);
    const d = 0.55 + Math.random() * 0.25;
    const delay = i * 0.04;
    gsap.to(s, { x: to.x, duration: d, delay, ease: 'power1.in' });
    gsap.to(s, {
      y: to.y,
      duration: d,
      delay,
      ease: 'back.in(2.2)',
      onComplete: () => {
        s.destroy();
        csfx.coin(1 + Math.random() * 0.3);
        if (--left === 0) onDone?.();
      },
    });
    gsap.to(s.scale, { x: 0.4, y: 0.4, duration: d, delay });
  }
}

/** T2: "¡GRAN PREMIO!" poster slam */
export function winBanner(layer: Container, title: string, sub: string, color: number = CP.yellow): Promise<void> {
  return new Promise((res) => {
    const c = new Container();
    c.position.set(W / 2, H / 2 - 40);
    const burst = new Graphics();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const a2 = a + Math.PI / 24;
      burst.poly([0, 0, Math.cos(a) * 900, Math.sin(a) * 900, Math.cos(a2) * 900, Math.sin(a2) * 900]).fill({ color, alpha: i % 2 ? 0.0 : 0.22 });
    }
    const band = new Graphics().rect(-W, -110, W * 2, 220).fill(CP.ink);
    const band2 = new Graphics().rect(-W, -96, W * 2, 192).fill(color);
    const ht = new TilingSprite({ texture: halftoneTexture(CP.ink, 14, 3), width: W * 2, height: 192 });
    ht.position.set(-W, -96);
    ht.alpha = 0.18;
    const t1 = txt(title, { fontFamily: F.poster, fontSize: 150, fill: CP.ink, letterSpacing: -2 });
    t1.anchor.set(0.5);
    t1.y = -18;
    const g1 = txt(title, { fontFamily: F.poster, fontSize: 150, fill: CP.pink, letterSpacing: -2 });
    g1.anchor.set(0.5);
    g1.position.set(6, -22);
    g1.alpha = 0.7;
    const t2 = txt(sub, { fontFamily: F.ui, fontWeight: '700', fontSize: 34, fill: CP.ink });
    t2.anchor.set(0.5);
    t2.y = 70;
    c.addChild(burst, band, band2, ht, g1, t1, t2);
    c.rotation = -0.05;
    layer.addChild(c);
    burst.alpha = 0;
    gsap.to(burst, { alpha: 1, duration: 0.2 });
    gsap.to(burst, { rotation: 0.6, duration: 2.4, ease: 'none' });
    gsap.from(band.scale, { y: 0, duration: 0.18, ease: 'back.out(3)' });
    gsap.from([band2.scale, ht.scale], { y: 0, duration: 0.22, delay: 0.04, ease: 'back.out(3)' });
    gsap.from([t1, g1], { x: -W, duration: 0.26, delay: 0.08, ease: 'power3.out' });
    gsap.from(t2, { alpha: 0, y: 110, duration: 0.25, delay: 0.25 });
    gsap.to(c, {
      alpha: 0,
      duration: 0.3,
      delay: 1.8,
      onComplete: () => {
        c.destroy({ children: true });
        res();
      },
    });
  });
}

/**
 * T3 JACKPOT (storyboard j): the screen turns into a "Le Chat Noir" poster — ink flood, yellow halo,
 * giant black cat, stacked JACKPOT type with misregistration + RGB split, coin rain. Tap to continue.
 */
export function jackpotTakeover(layer: Container, _p: Particles | null, o: { title?: string; sub: string; loot?: Loot }): Promise<void> {
  return new Promise((res) => {
    const root = new Container();
    layer.addChild(root);
    const p = new Particles();
    csfx.jackpot();
    flash(layer, CP.yellow, 0.9, 0.35);
    const ink = new Graphics().rect(0, 0, W, H).fill(CP.ink);
    const paper = new TilingSprite({ texture: paperTexture(0xf0e2c8), width: W, height: H });
    paper.alpha = 0;
    const dots = new TilingSprite({ texture: halftoneTexture(CP.pink, 16, 3.4), width: W, height: H });
    dots.alpha = 0.0;
    root.addChild(ink, paper, dots);
    // halo
    const halo = new Container();
    halo.position.set(W * 0.34, H * 0.56);
    const hg = new Graphics();
    hg.circle(0, 0, 330).fill(CP.yellow).stroke({ width: 10, color: CP.ink });
    hg.circle(0, 0, 280).stroke({ width: 5, color: 0xe0a020 });
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      hg.moveTo(Math.cos(a) * 345, Math.sin(a) * 345).lineTo(Math.cos(a) * 420, Math.sin(a) * 420).stroke({ width: 10, color: CP.yellow, cap: 'round' });
    }
    halo.addChild(hg);
    // giant cat (Steinlen-ish)
    const cat = new Graphics();
    cat.moveTo(-180, 360).bezierCurveTo(-240, 120, -120, 20, -70, 10).lineTo(80, 10).bezierCurveTo(150, 40, 230, 160, 190, 360).closePath().fill(CP.ink);
    cat.moveTo(160, 330).bezierCurveTo(420, 260, 330, 20, 220, -10).stroke({ width: 40, color: CP.ink, cap: 'round' });
    cat.poly([-150, -80, -170, -300, -40, -170]).fill(CP.ink);
    cat.poly([150, -80, 170, -300, 40, -170]).fill(CP.ink);
    cat.ellipse(0, -80, 170, 135).fill(CP.ink);
    cat.poly([-138, -120, -146, -250, -70, -165]).fill(CP.pink);
    cat.poly([138, -120, 146, -250, 70, -165]).fill(CP.pink);
    for (const sx of [-1, 1]) {
      cat.ellipse(sx * 64, -95, 40, 30).fill(CP.yellow);
      cat.ellipse(sx * 64, -95, 10, 28).fill(CP.ink);
      for (let k = -1; k <= 1; k++) cat.moveTo(sx * 80, -40 + k * 18).lineTo(sx * 250, -60 + k * 36).stroke({ width: 5, color: 0xf0e2c8, cap: 'round' });
    }
    cat.poly([-18, -50, 18, -50, 0, -30]).fill(CP.pink);
    cat.position.set(0, 40);
    halo.addChild(cat);
    root.addChild(halo);
    // type stack
    const tt = new Container();
    tt.position.set(W * 0.7, H * 0.42);
    const word = o.title ?? 'JACKPOT';
    const mk = (col: number, dx: number, dy: number, a: number) => {
      const t = txt(word, { fontFamily: F.poster, fontSize: 250, fill: col, letterSpacing: -6 });
      t.anchor.set(0.5);
      t.position.set(dx, dy);
      t.alpha = a;
      return t;
    };
    const tA = mk(CP.cyan, -10, 6, 0.85);
    const tB = mk(CP.pink, 10, -6, 0.85);
    const tC = mk(CP.red, 0, 0, 1);
    tt.addChild(tA, tB, tC);
    if (tC.width > 980) tt.scale.set(980 / tC.width);
    const kick = txt('CASINO EL GATO NEGRO · TOURNÉE DU MULTIVERS', { fontFamily: F.ui, fontWeight: '700', fontSize: 26, fill: CP.ink, letterSpacing: 4 });
    kick.anchor.set(0.5);
    kick.position.set(W * 0.7, H * 0.42 - 180);
    const sub = txt(o.sub, { fontFamily: F.poster, fontSize: 64, fill: CP.ink, align: 'center', wordWrap: true, wordWrapWidth: 900 });
    sub.anchor.set(0.5, 0);
    sub.position.set(W * 0.7, H * 0.42 + 150);
    const tap = txt('TOCA PARA COBRAR', { fontFamily: F.poster, fontSize: 34, fill: CP.paper });
    const tapBg = new Graphics();
    const tapC = new Container();
    tapC.addChild(tapBg, tap);
    tap.position.set(22, 8);
    tapBg.rect(6, 6, tap.width + 44, 60).fill(CP.ink).rect(0, 0, tap.width + 44, 60).fill(CP.pink).stroke({ width: 4, color: CP.ink });
    tapC.position.set(W * 0.7 - (tap.width + 44) / 2, H - 140);
    tapC.alpha = 0;
    root.addChild(tt, kick, sub, tapC, p);
    let rgb: RGBSplitFilter | null = null;
    if (!settings.reduceFlashes && !settings.reduceMotion) {
      rgb = new RGBSplitFilter({ red: { x: -14, y: 0 }, green: { x: 0, y: 8 }, blue: { x: 14, y: -6 } });
      tt.filters = [rgb];
    }
    // timeline
    halo.scale.set(0);
    tt.scale.x *= 1;
    const s0 = tt.scale.x;
    tt.scale.set(s0 * 3);
    tt.alpha = 0;
    kick.alpha = 0;
    sub.alpha = 0;
    const tl = gsap.timeline();
    tl.to(paper, { alpha: 1, duration: 0.25 }, 0.1)
      .to(dots, { alpha: 0.1, duration: 0.3 }, 0.2)
      .to(halo.scale, { x: 1, y: 1, duration: 0.55, ease: 'back.out(1.6)' }, 0.15)
      .to(tt, { alpha: 1, duration: 0.1 }, 0.45)
      .to(tt.scale, { x: s0, y: s0, duration: 0.3, ease: 'power4.in' }, 0.45)
      .add(() => {
        speedLines(root, W * 0.7, H * 0.42, CP.ink, 56, 0.7);
        flash(root, 0xffffff, 0.7, 0.25);
        onomatopoeia(root, W * 0.86, H * 0.2, '¡CHA-CHING!', { size: 110, color: CP.yellow });
        coinRain(p, o.loot ?? 'gold', 90);
        sparkles(root, W * 0.34, H * 0.4, CP.yellow, 24, 380);
      }, 0.76)
      .to(kick, { alpha: 1, duration: 0.2 }, 0.8)
      .to(sub, { alpha: 1, duration: 0.25 }, 0.95)
      .to(tapC, { alpha: 1, duration: 0.3 }, 1.6);
    gsap.to(hg, { rotation: Math.PI * 2, duration: 18, ease: 'none', repeat: -1 });
    let fr = 0;
    const iv = window.setInterval(() => {
      fr++;
      if (rgb) {
        const k = fr % 3 === 0 ? 1 : 0.4;
        rgb.red = { x: -14 * k, y: 0 };
        rgb.blue = { x: 14 * k, y: -6 * k };
      }
      cat.y = 40 + (fr % 2 ? -3 : 3);
      dots.tilePosition.x += 2;
    }, 1000 / 12);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.clearInterval(iv);
      tl.kill();
      gsap.killTweensOf(hg);
      gsap.to(root, {
        alpha: 0,
        duration: 0.3,
        onComplete: () => {
          root.destroy({ children: true });
          res();
        },
      });
    };
    root.eventMode = 'static';
    root.hitArea = new Rectangle(0, 0, W, H);
    window.setTimeout(() => root.on('pointertap', finish), 900);
    window.setTimeout(finish, 9000);
  });
}

/** quick ink "stamp" text that slams onto a spot */
export function stamp(layer: Container, x: number, y: number, word: string, color: number = CP.pink, size = 64, rot = -0.12): Text {
  const t = txt(word, { fontFamily: F.poster, fontSize: size, fill: color, stroke: { color: CP.ink, width: size / 8, join: 'round' }, letterSpacing: 1 });
  t.anchor.set(0.5);
  t.position.set(x, y);
  t.rotation = rot;
  t.scale.set(2.2);
  t.alpha = 0;
  layer.addChild(t);
  gsap.to(t, { alpha: 1, duration: 0.08 });
  gsap.to(t.scale, { x: 1, y: 1, duration: 0.22, ease: 'back.out(2.5)' });
  return t;
}

export { Sprite };
