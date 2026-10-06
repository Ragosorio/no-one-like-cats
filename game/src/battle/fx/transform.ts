import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js';
import { RGBSplitFilter } from 'pixi-filters';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { C, F } from '../../ui/theme';
import { txt, poster } from '../../ui/widgets';
import { BattleCat, catTexture, elementFx } from '../../art/catArt';
import { applyCatTint } from '../../art/tint';
import { halftoneTexture } from '../../art/textures';
import { InkFilter } from '../../fx/filters';
import { sfx } from '../../core/audio';
import { speedLines } from '../../fx/juice';
import { settings } from '../../core/settings';

export interface TransformInput {
  slug: string;
  species: string;
  name: string;
  element: string;
  formName: string;
  cry: string;
}

const seen = new Set<string>();

/**
 * Storyboard (b): cozy → Battle Form. Full (≈2.2 s) the first time per session per cat,
 * short (≈0.9 s) afterwards. Click skips.
 */
export function playTransform(layer: Container, i: TransformInput): Promise<void> {
  const short = seen.has(i.species) || settings.reduceMotion;
  seen.add(i.species);
  return new Promise((resolve) => {
    const root = new Container();
    layer.addChild(root);
    const fx = elementFx(i.element === 'storm' ? 'electric' : i.element);
    const dim = new Graphics().rect(0, 0, W, H).fill(C.ink);
    root.addChild(dim);
    const tl = gsap.timeline({ onComplete: done });
    let finished = false;
    function done() {
      if (finished) return;
      finished = true;
      gsap.to(root, { alpha: 0, duration: 0.2, onComplete: () => (root.destroy({ children: true }), resolve()) });
    }
    root.eventMode = 'static';
    root.hitArea = { contains: () => true };
    root.on('pointertap', () => tl.timeScale(6));

    // --- eyes vignette (crop of the upper part of the painting)
    const eyes = new Container();
    const band = new Graphics().rect(0, 0, W, 300).fill(C.paper);
    const mask = new Graphics().rect(0, 0, W, 300).fill(0xffffff);
    const face = new Sprite(catTexture(i.slug));
    applyCatTint(face, i.species);
    face.anchor.set(0.5, 0.18);
    face.scale.set(2.6);
    face.position.set(W / 2, 0);
    face.mask = mask;
    const dots = new TilingSprite({ texture: halftoneTexture(fx.dark, 10, 2.2), width: W, height: 300 });
    dots.alpha = 0.25;
    eyes.addChild(band, face, dots, mask);
    eyes.position.set(0, H / 2 - 150);
    eyes.scale.y = 0;
    root.addChild(eyes);

    // --- battle form pose
    const pose = new Container();
    const block = new Graphics().rect(-W, -260, W * 3, 520).fill(fx.main);
    block.rotation = -0.1;
    const bc = new BattleCat(i.slug, i.element === 'storm' ? 'electric' : i.element, 560, false);
    applyCatTint(bc.sprite, i.species);
    bc.position.set(-380, 300);
    const ink = new InkFilter({ threshold: 0.48, ink: C.ink, paper: fx.main });
    const prev = [...(bc.sprite.filters ?? [])];
    bc.sprite.filters = [ink];
    const cartel = new Container();
    const cg = new Graphics().rect(-60, -420, 120, 840).fill(C.ink);
    const ct = poster(i.formName.toUpperCase(), 64, C.paper, { letterSpacing: 2 });
    ct.anchor.set(0.5);
    ct.rotation = -Math.PI / 2;
    cartel.addChild(cg, ct);
    cartel.position.set(420, 0);
    cartel.rotation = 0.08;
    const bubble = new Container();
    const bt = txt(i.cry, { fontFamily: F.comic, fontSize: 64, fill: C.ink, stroke: { color: C.paper, width: 6 } });
    bt.anchor.set(0.5);
    const bb = new Graphics().roundRect(-bt.width / 2 - 30, -bt.height / 2 - 20, bt.width + 60, bt.height + 40, 30).fill(C.paper).stroke({ width: 6, color: C.ink });
    bubble.addChild(bb, bt);
    bubble.position.set(60, -250);
    bubble.rotation = -0.06;
    pose.addChild(block, bc, cartel, bubble);
    pose.position.set(W / 2, H / 2);
    pose.visible = false;
    root.addChild(pose);

    const t0 = short ? 0 : 0.1;
    if (!short) {
      tl.call(() => sfx('charge'), [], 0);
      tl.to(eyes.scale, { y: 1, duration: 0.18, ease: 'power3.out' }, t0);
      tl.fromTo(face, { y: -40 }, { y: 0, duration: 0.5, ease: 'steps(4)' }, t0 + 0.1);
      tl.call(() => sfx('whoosh', 1.6), [], t0 + 0.45);
    }
    const tFlash = short ? 0.05 : 0.75;
    tl.call(
      () => {
        sfx('glitch');
        sfx('crit');
        eyes.visible = false;
        pose.visible = true;
        if (!settings.reduceMotion) {
          const rgb = new RGBSplitFilter({ red: { x: -14, y: 0 }, green: { x: 0, y: 8 }, blue: { x: 14, y: -6 } });
          root.filters = [rgb];
          gsap.to([rgb.red, rgb.blue], { x: 0, y: 0, duration: 0.4 });
          gsap.to(rgb.green, { y: 0, duration: 0.4, onComplete: () => (root.filters = []) });
          speedLines(root, W / 2, H / 2, C.ink, 56, 0.8);
        }
      },
      [],
      tFlash,
    );
    tl.from(block.scale, { x: 0, duration: 0.15, ease: 'power3.out' }, tFlash);
    tl.from(bc, { x: -900, duration: 0.2, ease: 'power3.out' }, tFlash);
    // the transformation lands: crouch on arrival, then a full-body roar
    tl.call(() => { bc.sprite.crouch = 0.9; bc.sprite.lean = 0.5; }, [], tFlash);
    tl.call(() => { bc.sprite.crouch = -0.35; bc.sprite.lean = -0.2; bc.sprite.emote('attack', 1.4); bc.sprite.emote('surprise'); }, [], tFlash + 0.22);
    tl.call(() => { bc.sprite.crouch = 0; bc.sprite.lean = 0; bc.sprite.emote('happy', 0.8); }, [], tFlash + 0.55);
    tl.call(() => (bc.sprite.filters = prev), [], tFlash + (short ? 0.12 : 0.3));
    tl.from(cartel, { y: -900, duration: 0.2, ease: 'back.out(1.6)' }, tFlash + 0.1);
    tl.from(bubble.scale, { x: 0, y: 0, duration: 0.2, ease: 'back.out(3)', onStart: () => sfx('meow', 0.8) }, tFlash + 0.2);
    tl.to({}, { duration: short ? 0.45 : 1.0 }, tFlash + 0.3);
  });
}
