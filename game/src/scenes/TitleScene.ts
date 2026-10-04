import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js';
import { GlitchFilter, OutlineFilter, RGBSplitFilter } from 'pixi-filters';
import gsap from 'gsap';
import { Scene } from '../core/scenes';
import { W, H } from '../core/App';
import { C, F } from '../ui/theme';
import { Button, dotGrid, crosses, poster, txt } from '../ui/widgets';
import { paperTexture, halftoneTexture } from '../art/textures';
import { catTexture, preloadCats } from '../art/catArt';
import { ComicFilter, InkFilter } from '../fx/filters';
import { sfx, audio } from '../core/audio';
import { music } from '../core/music';
import { onomatopoeia } from '../fx/juice';

/**
 * Title: a Swiss-poster / multiverse collage. Each panel shows a cat printed in a different
 * "dimension" (comic, manga ink, glitch, risograph) — the game's identity in one screen.
 */
export class TitleScene extends Scene {
  constructor(
    private onPlay: () => void,
    private hasSave: boolean,
    private onNew?: () => void,
  ) {
    super();
  }

  override async enter() {
    const panels: [string, 'comic' | 'ink' | 'glitch' | 'riso'][] = [
      ['molten_ember_cat', 'comic'],
      ['lantern_spirit_cat', 'ink'],
      ['neon_glitch_cat', 'glitch'],
      ['canelo_cozy_cat', 'riso'],
    ];
    await preloadCats(panels.map((p) => p[0]));
    const bg = new TilingSprite({ texture: paperTexture(C.paper), width: W, height: H });
    this.addChild(bg);
    const pinkBlock = new Graphics().rect(0, 0, 640, H).fill(C.pink);
    pinkBlock.position.set(W - 640, 0);
    const circle = new Graphics().circle(0, 0, 360).fill(C.pinkHot);
    circle.alpha = 0.9;
    circle.position.set(W - 560, H - 300);
    this.addChild(pinkBlock, circle);

    // collage panels (multiverse)
    const panelLayer = new Container();
    this.addChild(panelLayer);
    const rects = [
      { x: W - 760, y: 120, w: 360, h: 430, r: -0.04 },
      { x: W - 410, y: 70, w: 340, h: 380, r: 0.05 },
      { x: W - 700, y: 560, w: 330, h: 380, r: 0.03 },
      { x: W - 380, y: 470, w: 330, h: 420, r: -0.05 },
    ];
    panels.forEach(([slug, style], i) => {
      const r = rects[i];
      const p = new Container();
      const frame = new Graphics();
      const fill = style === 'ink' ? 0xf4eee3 : style === 'glitch' ? C.chaos : style === 'riso' ? C.mint : C.yellow;
      frame.rect(8, 8, r.w, r.h).fill(C.ink).rect(0, 0, r.w, r.h).fill(fill).stroke({ width: 6, color: C.ink });
      p.addChild(frame);
      if (style !== 'ink') {
        const dots = new TilingSprite({ texture: halftoneTexture(style === 'glitch' ? C.violet : C.ink, 12, 2.5), width: r.w, height: r.h });
        dots.alpha = 0.2;
        p.addChild(dots);
      }
      const s = new Sprite(catTexture(slug));
      s.anchor.set(0.5);
      s.scale.set((r.h * 0.95) / s.texture.height);
      s.position.set(r.w / 2, r.h / 2 + 10);
      const filters = [];
      if (style === 'comic') filters.push(new ComicFilter({ levels: 5, dot: 5, shadow: C.inferno }), new OutlineFilter({ thickness: 5, color: C.ink }));
      if (style === 'ink') filters.push(new InkFilter({ threshold: 0.45 }));
      if (style === 'glitch') filters.push(new RGBSplitFilter({ red: { x: -6, y: 0 }, green: { x: 0, y: 0 }, blue: { x: 6, y: 2 } }), new GlitchFilter({ slices: 6, offset: 18, fillMode: 0, seed: 0.3 }));
      if (style === 'riso') filters.push(new ComicFilter({ levels: 3, dot: 6, sat: 0.6, shadow: C.plum }));
      s.filters = filters;
      const mask = new Graphics().rect(0, 0, r.w, r.h).fill(0xffffff);
      s.mask = mask;
      p.addChild(mask, s);
      const tag = txt(['DIMENSIÓN INFERNO', 'DIMENSIÓN TINTA', 'DIMENSIÓN GLITCH', 'DIMENSIÓN COZY'][i], { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: style === 'glitch' ? C.cyan : C.ink });
      tag.position.set(12, r.h - 26);
      p.addChild(tag);
      p.position.set(r.x, r.y);
      p.rotation = r.r;
      panelLayer.addChild(p);
      gsap.from(p, { y: r.y + 900, rotation: r.r + (i % 2 ? 0.4 : -0.4), duration: 0.7, delay: 0.25 + i * 0.12, ease: 'back.out(1.3)' });
      if (style === 'glitch') {
        const gf = filters[1] as GlitchFilter;
        window.setInterval(() => {
          if (this.destroyed) return;
          gf.seed = Math.random();
          gf.offset = Math.random() < 0.3 ? 30 : 6;
        }, 160);
      }
    });

    // title type
    const t1 = poster('NO ONE', 250, C.ink, { letterSpacing: -6 });
    const t2 = poster('LIKE CATS', 250, C.ink, { letterSpacing: -6 });
    t1.position.set(70, 70);
    t2.position.set(70, 290);
    const meta = txt('CAPÍTULO 1 — EL PRIMER MAR', { fontFamily: F.ui, fontWeight: '700', fontSize: 26, fill: C.pinkHot });
    meta.position.set(78, 50);
    const tag = txt('CUTE CATS.\nTERRIBLE CONSEQUENCES.', { fontFamily: F.poster, fontSize: 52, fill: C.ink, lineHeight: 56 });
    tag.position.set(78, 640);
    const coords = txt('47.4979° N · 19.0402° E · ISLA SIN NOMBRE', { fontFamily: F.ui, fontSize: 18, fill: C.ink });
    coords.position.set(78, 30);
    const dg = dotGrid(3, 6, 20, 3);
    dg.position.set(1060, 660);
    const cr = crosses();
    cr.position.set(1000, 120);
    this.addChild(t1, t2, meta, tag, coords, dg, cr);
    const rgb = new RGBSplitFilter({ red: { x: -14, y: 0 }, green: { x: 0, y: 8 }, blue: { x: 14, y: -4 } });
    t1.filters = [rgb];
    t2.filters = [rgb];
    gsap.to([rgb.red, rgb.blue], { x: 0, y: 0, duration: 0.9, delay: 0.2, ease: 'power3.out' });
    gsap.to(rgb.green, { y: 0, duration: 0.9, delay: 0.2 });
    gsap.from([t1, t2], { x: -900, duration: 0.5, stagger: 0.1, ease: 'power4.out' });

    const play = new Button(this.hasSave ? 'CONTINUAR' : 'JUGAR', () => this.go(), { w: 360, h: 100, size: 58, color: C.yellow });
    play.position.set(78, 820);
    this.addChild(play);
    gsap.from(play, { y: 1200, duration: 0.5, delay: 0.6, ease: 'back.out(1.6)' });
    if (this.hasSave && this.onNew) {
      const nw = new Button('NUEVA PARTIDA', () => this.onNew?.(), { w: 280, h: 70, size: 30, color: C.paper });
      nw.position.set(470, 836);
      this.addChild(nw);
    }
    const gear = new Button('AJUSTES', async () => (await import('../panels/Settings')).openSettings(), { w: 220, h: 60, size: 26, color: C.paper });
    gear.position.set(W - 260, H - 90);
    this.addChild(gear);
    const foot = txt('sin anuncios · sin tarjetazo · sin energía · “espera o sigue jugando”', { fontFamily: F.ui, fontSize: 18, fill: C.ink });
    foot.position.set(78, H - 60);
    this.addChild(foot);
  }

  private going = false;
  private go() {
    if (this.going) return;
    this.going = true;
    audio.unlock();
    sfx('bigboom');
    onomatopoeia(this, W / 2, H / 2, '¡MIAU!', { size: 260, color: C.yellow, dur: 1 });
    window.setTimeout(() => this.onPlay(), 450);
  }

  override exit() {
    music.play('island');
  }
}
