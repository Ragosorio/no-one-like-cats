/**
 * Small story effects performed from stage directions (e.g. b09 "El cielo se oscurece un segundo").
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { sfx } from '../../core/audio';
import { music } from '../../core/music';
import { settings } from '../../core/settings';
import { C } from '../theme';
import { glowTexture } from '../../art/textures';
import { destroyDeep } from './tweens';
import { screenRect } from '../screen';

/** Distraxia passes overhead: the screen darkens, eyes in the fog, the music cuts. */
export function darkSky(layer: Container, ms = 1600): Promise<void> {
  return new Promise((resolve) => {
    const root = new Container();
    root.label = 'darkSky';
    layer.addChild(root);
    const shade = screenRect(0x0b0714);
    shade.alpha = 0;
    root.addChild(shade);
    const fog = new Container();
    for (let i = 0; i < 8; i++) {
      const g = new Sprite(glowTexture());
      g.anchor.set(0.5);
      g.tint = i % 2 ? C.violet : C.plum;
      g.scale.set(8 + Math.random() * 6);
      g.position.set(Math.random() * W, Math.random() * H * 0.7);
      g.alpha = 0.5;
      fog.addChild(g);
    }
    fog.alpha = 0;
    root.addChild(fog);
    const eyes = new Container();
    for (let i = 0; i < 12; i++) {
      const r = 18 + Math.random() * 28;
      const e = new Graphics();
      e.ellipse(0, 0, r, r * 0.42).fill(0xf4e9ff).stroke({ width: 3, color: C.ink });
      e.circle(0, 0, r * 0.3).fill(C.violet);
      e.ellipse(0, 0, r * 0.07, r * 0.26).fill(C.ink);
      e.position.set(80 + Math.random() * (W - 160), 60 + Math.random() * (H * 0.6));
      e.scale.y = 0.05;
      eyes.addChild(e);
    }
    root.addChild(eyes);
    music.play('silence');
    sfx('sting');
    const t = ms / 1000;
    const tl = gsap.timeline({
      onComplete: () => {
        destroyDeep(root);
        music.play('island');
        resolve();
      },
    });
    tl.to(shade, { alpha: settings.reduceFlashes ? 0.55 : 0.78, duration: 0.35 }, 0)
      .to(fog, { alpha: 1, duration: 0.5 }, 0.1)
      .to(fog, { x: 140, duration: t + 0.6, ease: 'none' }, 0);
    eyes.children.forEach((e, i) => {
      tl.to(e.scale, { y: 1, duration: 0.12 }, 0.3 + i * 0.05).to(e.scale, { y: 0.05, duration: 0.1 }, t - 0.2 + i * 0.02);
    });
    tl.to([shade, fog], { alpha: 0, duration: 0.5 }, t);
  });
}
