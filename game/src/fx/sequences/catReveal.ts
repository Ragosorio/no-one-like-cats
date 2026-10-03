import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js';
import { RGBSplitFilter, ShockwaveFilter } from 'pixi-filters';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { C, F, RARITY, Rarity } from '../../ui/theme';
import { txt, poster } from '../../ui/widgets';
import { paperTexture, halftoneTexture } from '../../art/textures';
import { catTexture, elementFx } from '../../art/catArt';
import { SilhouetteFilter, InkFilter } from '../filters';
import { sfx } from '../../core/audio';
import { Shaker, sparkles, speedLines } from '../juice';
import { settings } from '../../core/settings';
import { ELEMENT_ICON, ELEMENT_NAME } from '../../data/elementsMeta';

export interface RevealOpts {
  slug: string;
  name: string;
  elements: string[];
  rarity: Rarity;
  caption?: string;
  serial?: number;
  duplicateOrbs?: number;
  tint?: number;
  /** extra line under name (role / attack) */
  subtitle?: string;
}

/**
 * Storyboard (a) from research/07: seal cracks → silhouette → element stamps → rarity print → name.
 * Resolves when the player dismisses it.
 */
export function playCatReveal(layer: Container, o: RevealOpts): Promise<void> {
  return new Promise((resolve) => {
    const root = new Container();
    layer.addChild(root);
    const shaker = new Shaker(root, 22, 0.02);
    const fxCol = elementFx(o.elements[0] ?? 'fire');
    const rar = RARITY[o.rarity];
    const high = o.rarity === 'legendary' || o.rarity === 'mythic' || o.rarity === 'primordial';
    const dup = o.duplicateOrbs !== undefined;

    // --- Swiss poster stage
    const bg = new TilingSprite({ texture: paperTexture(C.paper), width: W, height: H });
    const dots = new TilingSprite({ texture: halftoneTexture(C.ink, 12, 2), width: W, height: H });
    dots.alpha = 0.06;
    const circle = new Graphics().circle(0, 0, 330).fill(C.pink);
    circle.position.set(W / 2, H / 2 + 20);
    const blockA = new Graphics().rect(0, 0, 360, H).fill(C.ink);
    blockA.position.set(-360, 0);
    const blockB = new Graphics().rect(0, 0, 300, H).fill(fxCol.main);
    blockB.position.set(W, 0);
    const serial = txt(`RESONANCIA Nº ${String(o.serial ?? 1).padStart(3, '0')}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.ink });
    serial.position.set(390, 40);
    const coords = txt('47.4979° N · NO ONE LIKE CATS', { fontFamily: F.ui, fontSize: 18, fill: C.pinkHot });
    coords.position.set(390, 70);
    const bigRarity = poster(rar.name, 300, rar.color, { letterSpacing: -6 });
    bigRarity.anchor.set(0.5);
    bigRarity.position.set(W / 2, H / 2);
    bigRarity.alpha = 0;
    root.addChild(bg, dots, blockA, blockB, bigRarity, circle, serial, coords);

    // --- Seal (the "egg")
    const seal = new Container();
    const sealG = new Graphics();
    sealG.circle(0, 0, 120).fill(C.paper).stroke({ width: 8, color: C.ink });
    sealG.star(0, 0, 8, 96, 60).fill(C.ink);
    sealG.circle(0, 0, 38).fill(C.pinkHot).stroke({ width: 6, color: C.ink });
    seal.addChild(sealG);
    const cracks = new Graphics();
    seal.addChild(cracks);
    seal.position.set(W / 2, H / 2 + 20);
    root.addChild(seal);

    // --- Cat
    const cat = new Sprite(catTexture(o.slug));
    cat.anchor.set(0.5, 0.5);
    const size = 560;
    cat.scale.set(size / cat.texture.width);
    cat.position.set(W / 2, H / 2 + 10);
    if (o.tint !== undefined) cat.tint = o.tint;
    const sil = new SilhouetteFilter(C.ink, 1);
    cat.filters = [sil];
    cat.visible = false;
    root.addChild(cat);

    const stampLayer = new Container();
    root.addChild(stampLayer);
    const nameLayer = new Container();
    root.addChild(nameLayer);

    let skipped = false;
    let canSkip = false;
    const skipBtn = txt('SALTAR ›', { fontFamily: F.poster, fontSize: 30, fill: C.ink });
    skipBtn.position.set(W - 170, H - 70);
    skipBtn.alpha = 0;
    root.addChild(skipBtn);

    const tl = gsap.timeline();
    const reduce = settings.reduceMotion;

    // pre: silence/cut
    sfx('paper');
    tl.to(blockA, { x: 0, duration: 0.25, ease: 'power3.out' }, 0.05);
    tl.to(blockB, { x: W - 300, duration: 0.25, ease: 'power3.out' }, 0.1);
    tl.from(circle.scale, { x: 0, y: 0, duration: 0.35, ease: 'back.out(2)' }, 0.05);
    tl.from(seal.scale, { x: 0.2, y: 0.2, duration: 0.35, ease: 'back.out(3)' }, 0.12);

    // seal shakes + cracks (420–1300)
    if (!dup) {
      const crackAt = [0.65, 0.9, 1.15];
      crackAt.forEach((t, i) => {
        tl.call(
          () => {
            sfx('tick', 1 + i * 0.25);
            sfx('hit', 1.2 + i * 0.15);
            const a = Math.random() * Math.PI * 2;
            cracks
              .moveTo(0, 0)
              .lineTo(Math.cos(a) * 60, Math.sin(a) * 60)
              .lineTo(Math.cos(a + 0.3) * 120, Math.sin(a + 0.3) * 120)
              .stroke({ width: 6, color: 0xffffff });
            shaker.add(0.15 + i * 0.08);
          },
          [],
          t,
        );
      });
      // on-twos jitter
      const jit = { a: 0 };
      tl.to(
        jit,
        {
          a: 1,
          duration: 0.9,
          ease: 'none',
          onUpdate: () => {
            const amp = 2 + jit.a * 8;
            if (Math.random() < 0.5) seal.position.set(W / 2 + (Math.random() - 0.5) * amp, H / 2 + 20 + (Math.random() - 0.5) * amp);
          },
        },
        0.42,
      );
      tl.call(() => sfx('charge'), [], 0.45);
    }

    // break (1300)
    const tBreak = dup ? 0.45 : 1.3;
    tl.call(
      () => {
        sfx('boom');
        sfx('glitch');
        shaker.add(reduce ? 0.1 : 0.45);
        seal.visible = false;
        cat.visible = true;
        canSkip = true;
        gsap.to(skipBtn, { alpha: 0.7, duration: 0.3 });
        if (!reduce) {
          // impact frame: inverted ink, 2 frames
          const ink = new InkFilter({ threshold: 0.5, invert: true });
          cat.filters = [ink];
          bg.tint = C.ink;
          window.setTimeout(() => {
            if (cat.destroyed) return;
            cat.filters = [sil];
            bg.tint = 0xffffff;
          }, 70);
          const sw = new ShockwaveFilter({ center: { x: W / 2, y: H / 2 }, amplitude: 30, wavelength: 160, speed: 900, radius: -1, brightness: 1.1 });
          root.filters = [sw];
          gsap.to(sw, { time: 0.6, duration: 0.6, ease: 'none', onComplete: () => (root.filters = []) });
          speedLines(root, W / 2, H / 2 + 20, C.ink, 56, 0.6);
        }
        // pieces of the seal fly off
        for (let i = 0; i < 10; i++) {
          const p = new Graphics().poly([0, 0, 30, 8, 12, 36]).fill(i % 2 ? C.paper : C.ink).stroke({ width: 3, color: C.ink });
          p.position.set(W / 2, H / 2 + 20);
          root.addChild(p);
          const a = (i / 10) * Math.PI * 2;
          gsap.to(p, { x: W / 2 + Math.cos(a) * 700, y: H / 2 + Math.sin(a) * 500 + 200, rotation: 6, alpha: 0, duration: 0.9, ease: 'power2.out', onComplete: () => p.destroy() });
        }
      },
      [],
      tBreak,
    );
    // silhouette squash & stretch on twos
    tl.fromTo(cat.scale, { x: (size / cat.texture.width) * 1.25, y: (size / cat.texture.width) * 0.6 }, { x: size / cat.texture.width, y: size / cat.texture.width, duration: 0.45, ease: 'elastic.out(1.1,0.45)' }, tBreak + 0.02);

    // element stamps (2000–2600)
    const tEl = dup ? 0.6 : 2.0;
    o.elements.forEach((el, i) => {
      tl.call(
        () => {
          const f = elementFx(el);
          const stamp = new Container();
          const g = new Graphics().circle(0, 0, 62).fill(f.main).stroke({ width: 6, color: C.ink });
          const ic = txt(ELEMENT_ICON[el] ?? '?', { fontSize: 60 });
          ic.anchor.set(0.5);
          const nm = txt(ELEMENT_NAME[el] ?? el.toUpperCase(), { fontFamily: F.poster, fontSize: 26, fill: C.ink });
          nm.anchor.set(0.5);
          nm.y = 86;
          stamp.addChild(g, ic, nm);
          const x = W / 2 - 430 - (i % 2) * 40;
          const y = H / 2 - 230 + i * 190;
          stamp.position.set(x, y);
          stamp.rotation = (Math.random() - 0.5) * 0.3;
          stampLayer.addChild(stamp);
          gsap.fromTo(stamp.scale, { x: 2, y: 2 }, { x: 1, y: 1, duration: 0.14, ease: 'back.out(3)' });
          sparkles(stampLayer, x, y, f.accent, 8, 110);
          sfx('hit', 0.9 + i * 0.2);
          shaker.add(0.1);
          // rim light on silhouette
          sil.color = f.dark;
        },
        [],
        tEl + i * 0.2,
      );
    });

    // rarity print (2600–3300)
    const tR = dup ? 0.8 : 2.6;
    tl.call(
      () => {
        sfx(high ? 'fanfare' : 'reveal');
        bigRarity.alpha = 1;
        gsap.from(bigRarity.scale, { x: 1.4, y: 1.4, duration: 0.3, ease: 'power3.out' });
        circle.tint = rar.color === C.ink ? C.pinkHot : 0xffffff;
        if (o.rarity !== 'common' && !reduce) {
          const rgb = new RGBSplitFilter({ red: { x: -10, y: 0 }, green: { x: 0, y: 6 }, blue: { x: 10, y: -4 } });
          bigRarity.filters = [rgb];
          gsap.to(rgb.red, { x: 0, duration: 0.6 });
          gsap.to(rgb.green, { y: 0, duration: 0.6 });
          gsap.to(rgb.blue, { x: 0, y: 0, duration: 0.6 });
        }
        if (high) shaker.add(0.35);
      },
      [],
      tR,
    );

    // fill color (3300–4200)
    const tN = dup ? 1.0 : 3.3;
    tl.to(sil, { mix: 0, duration: 0.35, ease: 'power2.out' }, tN);
    tl.call(
      () => {
        sfx('meow');
        sparkles(root, W / 2, H / 2 - 120, rar.glow, 16, 260);
        const nm = poster(o.name.toUpperCase(), 110, C.ink, { stroke: { color: C.paper, width: 10, join: 'round' } });
        nm.anchor.set(0.5);
        nm.position.set(W / 2, H - 190);
        nameLayer.addChild(nm);
        gsap.from(nm.scale, { x: 0.3, y: 0.3, duration: 0.35, ease: 'back.out(3)' });
        if (o.subtitle) {
          const st = txt(o.subtitle, { fontFamily: F.ui, fontWeight: '700', fontSize: 26, fill: C.ink });
          st.anchor.set(0.5);
          st.position.set(W / 2, H - 120);
          nameLayer.addChild(st);
        }
        if (o.caption) {
          const cap = new Container();
          const ct = txt(o.caption, { fontFamily: F.comic, fontSize: 30, fill: C.ink, wordWrap: true, wordWrapWidth: 520 });
          const box = new Graphics().rect(-14, -10, ct.width + 28, ct.height + 20).fill(C.yellow).stroke({ width: 4, color: C.ink });
          cap.addChild(box, ct);
          cap.position.set(W - 640, 130);
          cap.rotation = -0.03;
          nameLayer.addChild(cap);
          gsap.from(cap, { alpha: 0, x: cap.x + 60, duration: 0.3 });
        }
        if (dup) {
          const d = poster(`DUPLICADO · +${o.duplicateOrbs} ORBES`, 54, C.pinkHot, { stroke: { color: C.ink, width: 8 } });
          d.anchor.set(0.5);
          d.rotation = -0.12;
          d.position.set(W / 2 + 260, H / 2 - 240);
          nameLayer.addChild(d);
          gsap.from(d.scale, { x: 2, y: 2, duration: 0.15, ease: 'back.out(3)' });
          sfx('gem');
        }
      },
      [],
      tN + 0.2,
    );

    const tDone = dup ? 1.4 : 4.6;
    const hint = txt('CLIC PARA CONTINUAR', { fontFamily: F.poster, fontSize: 28, fill: C.ink });
    hint.anchor.set(0.5);
    hint.position.set(W / 2, H - 50);
    hint.alpha = 0;
    root.addChild(hint);
    tl.to(hint, { alpha: 1, duration: 0.3, yoyo: true, repeat: -1 }, tDone);

    let finished = false;
    tl.call(() => (finished = true), [], tDone);

    root.eventMode = 'static';
    root.hitArea = { contains: () => true };
    root.on('pointertap', () => {
      if (!finished) {
        if (!canSkip || skipped) return;
        skipped = true;
        tl.timeScale(6);
        return;
      }
      sfx('paper');
      tl.kill();
      gsap.to(root, {
        alpha: 0,
        duration: 0.25,
        onComplete: () => {
          shaker.destroy();
          root.destroy({ children: true });
          resolve();
        },
      });
    });
  });
}
