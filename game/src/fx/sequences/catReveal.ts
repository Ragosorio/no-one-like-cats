import { ColorMatrixFilter, Container, Graphics, Sprite, Text, TilingSprite } from 'pixi.js';
import { RGBSplitFilter, ShockwaveFilter } from 'pixi-filters';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { C, F, RARITY, Rarity } from '../../ui/theme';
import { txt, poster } from '../../ui/widgets';
import { paperTexture, halftoneTexture, glowTexture } from '../../art/textures';
import { ELEMENT_FX, elementFx, loadCatTexture } from '../../art/catArt';
import { SilhouetteFilter, InkFilter } from '../filters';
import { sfx } from '../../core/audio';
import { Shaker, sparkles, speedLines, onomatopoeia, time } from '../juice';
import { settings } from '../../core/settings';
import { TintSpec } from '../../data/content';
import { variantSprite } from '../../panels/collection/art';
import { printTile, noiseTile, sheenTexture } from '../../panels/collection/printTextures';
import { elEmoji, elName } from '../../state/ext/collection';
import { CatCard } from '../../panels/collection/CatCard';
import { killTree } from '../../panels/collection/ui';

export interface RevealOpts {
  slug: string;
  name: string;
  elements: string[];
  rarity: Rarity;
  caption?: string;
  serial?: number;
  duplicateOrbs?: number;
  /** legacy flat sprite tint */
  tint?: number;
  /** extra line under name (role / ultimate) */
  subtitle?: string;
  /** species id → real variant tint (ColorMatrix + overlay + decal) */
  species?: string;
  /** explicit tint spec (if no species) */
  tintSpec?: TintSpec | null;
  /** role / trait / attack chips (4.2 s) */
  chips?: string[];
  /** mutation name → extra red stamp */
  mutation?: string | null;
  /** catdex counter tick [before, after, total] */
  dex?: [number, number, number];
  /** duplicate star bar */
  dup?: { before: number; after: number; need: number; star: number; missing: number; ready: boolean; minLevel?: number };
  secret?: boolean;
  /** replay from the Catdex (no counters, no buttons) */
  replay?: boolean;
}

export type RevealResult = 'continue' | 'catdex';

const RANK: Record<Rarity, number> = { common: 0, rare: 1, epic: 2, legendary: 3, primordial: 4, mythic: 5 };

function fxOf(el: string) {
  return el === 'storm' ? ELEMENT_FX.electric : elementFx(el);
}

/**
 * Storyboard (a) from research/07: seal cracks → silhouette → element stamps → rarity
 * "reprint" (print quality per rarity, §3.16) → color + name → chips → card flies to the
 * Catdex. Duplicates: 1.4 s short version with the star bar filling.
 * Resolves when the player dismisses it ('catdex' if they pressed "VER EN CATDEX").
 */
export async function playCatReveal(layer: Container, o: RevealOpts): Promise<RevealResult> {
  await loadCatTexture(o.slug).catch(() => undefined);
  return new Promise((resolve) => {
    const root = new Container();
    layer.addChild(root);
    const shaker = new Shaker(root, 22, 0.02);
    const fxCol = fxOf(o.elements[0] ?? 'fire');
    const rar = RARITY[o.rarity];
    const rank = RANK[o.rarity];
    const high = rank >= 3;
    const t4 = o.rarity === 'mythic' || o.rarity === 'primordial' || !!o.secret;
    const dup = o.duplicateOrbs !== undefined;
    const reduce = settings.reduceMotion;
    const extra = t4 && !dup ? 0.6 : 0;
    /** legendary / mythic / primordial reprint the stage dark */
    const darkStage = o.rarity === 'legendary' || o.rarity === 'mythic' || o.rarity === 'primordial';

    // --- Swiss poster stage
    const stage = new Container();
    const bg = new TilingSprite({ texture: paperTexture(C.paper), width: W, height: H });
    const print = new TilingSprite({ texture: printTile('common'), width: W, height: H });
    print.alpha = 0;
    const dots = new TilingSprite({ texture: halftoneTexture(C.ink, 12, 2), width: W, height: H });
    dots.alpha = 0.06;
    stage.addChild(bg, print, dots);
    const CY = H / 2 - 10;
    const circle = new Graphics().circle(0, 0, 300).fill(C.pink);
    circle.position.set(W / 2, CY);
    const blockA = new Graphics().rect(0, 0, 360, H).fill(C.ink);
    blockA.position.set(-360, 0);
    const blockB = new Graphics().rect(0, 0, 300, H).fill(fxCol.main);
    blockB.position.set(W, 0);
    const serial = txt(`RESONANCIA Nº ${String(o.serial ?? 1).padStart(3, '0')}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.ink });
    serial.position.set(390, 40);
    const coords = txt('47.4979° N · NO ONE LIKE CATS', { fontFamily: F.ui, fontSize: 18, fill: C.pinkHot });
    coords.position.set(390, 70);
    const bigRarity = poster(rar.name, 300, rar.color === C.ink ? fxCol.main : rar.color, { letterSpacing: -6 });
    bigRarity.anchor.set(0.5);
    bigRarity.position.set(W / 2, CY);
    if (bigRarity.width < 1400) bigRarity.scale.set(1400 / bigRarity.width);
    bigRarity.alpha = 0;
    const rays = new Graphics();
    rays.position.set(W / 2, CY);
    rays.alpha = 0;
    const frameG = new Graphics();
    root.addChild(stage, blockA, blockB, bigRarity, rays, circle, frameG, serial, coords);

    // --- Seal (the "egg")
    const seal = new Container();
    const sealG = new Graphics();
    sealG.circle(0, 0, 120).fill(C.paper).stroke({ width: 8, color: C.ink });
    sealG.star(0, 0, 8, 96, 60).fill(C.ink);
    sealG.circle(0, 0, 38).fill(C.pinkHot).stroke({ width: 6, color: C.ink });
    const leaks = new Graphics();
    const cracks = new Graphics();
    seal.addChild(leaks, sealG, cracks);
    const krackle = new Container();
    for (let i = 0; i < 9; i++) {
      const d = new Graphics().circle(0, 0, 6 + (i % 3) * 3).fill(C.ink);
      const a = (i / 9) * Math.PI * 2;
      d.position.set(Math.cos(a) * 170, Math.sin(a) * 170);
      krackle.addChild(d);
    }
    seal.addChild(krackle);
    seal.position.set(W / 2, CY);
    root.addChild(seal);

    // --- Cat (real variant: tint + overlay + decal)
    const size = 520;
    const variant = variantSprite(o.species ?? '', size, { slug: o.slug, tint: o.species ? undefined : (o.tintSpec ?? null) });
    const catNode = variant.root;
    if (!o.species) {
      // legacy: plain painting + optional flat tint
      variant.sprite.tint = o.tint ?? 0xffffff;
      variant.sprite.filters = [];
    }
    catNode.position.set(W / 2, CY - 10);
    const sil = new SilhouetteFilter(C.ink, dup ? 0 : 1);
    catNode.filters = [sil];
    catNode.visible = false;
    const glow = new Sprite(glowTexture());
    glow.anchor.set(0.5);
    glow.scale.set(7);
    glow.tint = fxCol.main;
    glow.alpha = 0;
    glow.position.copyFrom(catNode.position);
    root.addChild(glow, catNode);
    const baseScale = catNode.scale.x;

    const stampLayer = new Container();
    root.addChild(stampLayer);
    const nameLayer = new Container();
    root.addChild(nameLayer);
    const uiLayer = new Container();
    root.addChild(uiLayer);

    let skipped = false;
    let canSkip = false;
    const skipBtn = txt('SALTAR ›', { fontFamily: F.poster, fontSize: 30, fill: C.ink });
    skipBtn.position.set(W - 170, H - 70);
    skipBtn.alpha = 0;
    root.addChild(skipBtn);

    // catdex slot (top-right)
    let dexText: Text | null = null;
    const dexSlot = new Container();
    if (o.dex && !o.replay) {
      const box = new Graphics().rect(6, 6, 270, 104).fill(C.ink).rect(0, 0, 270, 104).fill(C.paper).stroke({ width: 4, color: C.ink });
      const lab = txt('CATDEX', { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.ink, letterSpacing: 4 });
      lab.position.set(16, 10);
      dexText = poster(`${o.dex[0]}/${o.dex[2]}`, 64, C.ink);
      dexText.position.set(16, 22);
      dexSlot.addChild(box, lab, dexText);
      dexSlot.position.set(W - 330, 36);
      dexSlot.alpha = 0;
      root.addChild(dexSlot);
    }

    const tl = gsap.timeline();

    // pre: cut
    sfx('paper');
    tl.to(blockA, { x: 0, duration: 0.25, ease: 'power3.out' }, 0.05);
    tl.to(blockB, { x: W - 300, duration: 0.25, ease: 'power3.out' }, 0.1);
    tl.from(circle.scale, { x: 0, y: 0, duration: 0.35, ease: 'back.out(2)' }, 0.05);
    tl.from(seal.scale, { x: 0.2, y: 0.2, duration: 0.35, ease: 'back.out(3)' }, 0.12);
    tl.to(dexSlot, { alpha: 1, duration: 0.3 }, 0.3);
    tl.to(krackle, { rotation: Math.PI * 6, duration: 1.3, ease: 'power2.in' }, 0);

    // seal shakes + cracks (420–1300); light leaks stronger the rarer it is
    const tBreak = dup ? 0.45 : 1.3;
    let crackN = 0;
    const addCrack = (i: number) => {
      crackN++;
      sfx('tick', 1 + i * 0.25);
      sfx('hit', 1.2 + i * 0.15);
      const a = Math.random() * Math.PI * 2;
      cracks
        .moveTo(0, 0)
        .lineTo(Math.cos(a) * 60, Math.sin(a) * 60)
        .lineTo(Math.cos(a + 0.3) * 120, Math.sin(a + 0.3) * 120)
        .stroke({ width: 6, color: 0xffffff });
      const len = 260 + rank * 90;
      const w = 0.08 + rank * 0.02;
      leaks
        .poly([0, 0, Math.cos(a + 0.15 - w) * len, Math.sin(a + 0.15 - w) * len, Math.cos(a + 0.15 + w) * len, Math.sin(a + 0.15 + w) * len])
        .fill({ color: 0xffffff, alpha: 0.25 + rank * 0.12 });
      shaker.add(0.15 + i * 0.08);
      gsap.fromTo(dots, { alpha: 0.16 }, { alpha: 0.06, duration: 0.25 });
    };
    if (!dup) {
      [0.65, 0.9, 1.15].forEach((t, i) => tl.call(() => addCrack(i), [], t));
      const jit = { a: 0 };
      tl.to(
        jit,
        {
          a: 1,
          duration: 0.9,
          ease: 'none',
          onUpdate: () => {
            if (seal.destroyed) return;
            const amp = 2 + jit.a * 8;
            if (Math.random() < 0.5) seal.position.set(W / 2 + (Math.random() - 0.5) * amp, CY + (Math.random() - 0.5) * amp);
          },
        },
        0.42,
      );
      tl.call(() => sfx('charge'), [], 0.45);
      // agency: tapping the seal speeds up the break
      seal.eventMode = 'static';
      seal.cursor = 'pointer';
      seal.on('pointertap', (e) => {
        e.stopPropagation();
        if (tl.time() >= tBreak || tl.time() < 0.4) return;
        addCrack(crackN);
        tl.seek(Math.min(tBreak - 0.01, tl.time() + 0.3));
      });
    }

    // break (1300)
    tl.call(
      () => {
        sfx('boom');
        sfx('glitch');
        if (!reduce && !dup) time.hitstop(100);
        shaker.add(reduce ? 0.1 : dup ? 0.2 : 0.45);
        seal.visible = false;
        catNode.visible = true;
        canSkip = true;
        gsap.to(skipBtn, { alpha: 0.7, duration: 0.3 });
        if (!reduce) {
          const ink = new InkFilter({ threshold: 0.5, invert: true });
          catNode.filters = [ink];
          bg.tint = C.ink;
          window.setTimeout(() => {
            if (catNode.destroyed) return;
            catNode.filters = [sil];
            bg.tint = 0xffffff;
          }, 70);
          const sw = new ShockwaveFilter({ center: { x: W / 2, y: H / 2 }, amplitude: 30, wavelength: 160, speed: 900, radius: -1, brightness: 1.1 });
          root.filters = [sw];
          gsap.to(sw, { time: 0.6, duration: 0.6, ease: 'none', onComplete: () => (root.filters = []) });
          speedLines(root, W / 2, CY, C.ink, 56, 0.6);
        }
        for (let i = 0; i < 10; i++) {
          const p = new Graphics().poly([0, 0, 30, 8, 12, 36]).fill(i % 2 ? C.paper : C.ink).stroke({ width: 3, color: C.ink });
          p.position.set(W / 2, CY);
          root.addChild(p);
          const a = (i / 10) * Math.PI * 2;
          gsap.to(p, { x: W / 2 + Math.cos(a) * 700, y: H / 2 + Math.sin(a) * 500 + 200, rotation: 6, alpha: 0, duration: 0.9, ease: 'power2.out', onComplete: () => p.destroy() });
        }
      },
      [],
      tBreak,
    );
    // silhouette squash & stretch (sy 0.6 → 1.15 → 1.0)
    tl.fromTo(catNode.scale, { x: baseScale * 1.25, y: baseScale * 0.6 }, { x: baseScale * 0.95, y: baseScale * 1.15, duration: 0.12, ease: 'power2.out' }, tBreak + 0.02);
    tl.to(catNode.scale, { x: baseScale, y: baseScale, duration: 0.4, ease: 'elastic.out(1.1,0.45)' }, tBreak + 0.14);

    // element stamps (2000–2600) + color bars sweeping
    const tEl = dup ? 0.6 : 2.0;
    o.elements.forEach((el, i) => {
      tl.call(
        () => {
          const f = fxOf(el);
          const bar = new Graphics().rect(0, 0, W * 1.4, 120).fill({ color: f.main, alpha: 0.85 });
          bar.position.set(-W * 1.5, 160 + i * 300);
          bar.skew.x = -0.3;
          stage.addChild(bar);
          gsap.to(bar, { x: -W * 0.2, duration: 0.25, ease: 'power3.out' });
          gsap.to(bar, { alpha: 0.18, duration: 0.6, delay: 0.3 });
          const stamp = new Container();
          const g = new Graphics().circle(0, 0, 62).fill(f.main).stroke({ width: 6, color: C.ink });
          const ic = txt(elEmoji(el), { fontSize: 60 });
          ic.anchor.set(0.5);
          const nm = txt(elName(el), { fontFamily: F.poster, fontSize: 26, fill: C.ink });
          nm.anchor.set(0.5);
          nm.y = 88;
          const plate = new Graphics().rect(-nm.width / 2 - 8, 88 - nm.height / 2 - 1, nm.width + 16, nm.height + 2).fill(C.paper).stroke({ width: 3, color: C.ink });
          // ink splash
          const splash = new Graphics();
          for (let k = 0; k < 7; k++) {
            const a = Math.random() * Math.PI * 2;
            const r = 70 + Math.random() * 30;
            splash.circle(Math.cos(a) * r, Math.sin(a) * r, 4 + Math.random() * 8).fill(C.ink);
          }
          stamp.addChild(splash, g, ic, plate, nm);
          const x = W / 2 - 430 - (i % 2) * 40;
          const y = H / 2 - 230 + i * 190;
          stamp.position.set(x, y);
          stamp.rotation = (Math.random() - 0.5) * 0.28;
          stampLayer.addChild(stamp);
          gsap.fromTo(stamp.scale, { x: 2, y: 2 }, { x: 1, y: 1, duration: 0.14, ease: 'back.out(3)' });
          sparkles(stampLayer, x, y, f.accent, 8, 110);
          sfx('hit', 0.9 + i * 0.2);
          shaker.add(0.1);
          sil.color = f.dark;
        },
        [],
        tEl + i * 0.2,
      );
    });

    // rarity reprint (2600–3300)
    const tR = (dup ? 0.8 : 2.6) + (o.rarity === 'mythic' && !dup ? 0.25 : 0);
    // (mythic: the extra 250 ms before tR are left in total silence)
    const FW = 600;
    const FH = 660;
    const frameColor = o.rarity === 'common' ? C.ink : o.rarity === 'rare' ? C.megaBlue : o.rarity === 'epic' ? C.pinkHot : o.rarity === 'legendary' ? 0xd9b25e : o.rarity === 'primordial' ? fxCol.main : C.cyan;
    const drawFrame = (k: number) => {
      if (frameG.destroyed) return;
      const per = 2 * (FW + FH);
      const len = per * k;
      const x0 = W / 2 - FW / 2;
      const y0 = CY - FH / 2;
      const pts: [number, number][] = [
        [x0, y0],
        [x0 + FW, y0],
        [x0 + FW, y0 + FH],
        [x0, y0 + FH],
        [x0, y0],
      ];
      frameG.clear();
      const draw = (dx: number, dy: number, color: number, width: number, alpha = 1) => {
        let rem = len;
        frameG.moveTo(pts[0][0] + dx, pts[0][1] + dy);
        for (let i = 1; i < pts.length && rem > 0; i++) {
          const [ax, ay] = pts[i - 1];
          const [bx, by] = pts[i];
          const seg = Math.hypot(bx - ax, by - ay);
          const f = Math.min(1, rem / seg);
          frameG.lineTo(ax + (bx - ax) * f + dx, ay + (by - ay) * f + dy);
          rem -= seg;
        }
        frameG.stroke({ width, color, alpha });
      };
      if (o.rarity === 'rare') draw(5, 4, 0xff5fa2, 14, 0.8);
      if (o.rarity === 'epic') {
        draw(-7, 5, C.cyan, 16, 0.85);
        draw(7, -5, C.yellow, 16, 0.85);
      }
      if (o.rarity === 'mythic') {
        draw(-6, 0, C.pinkHot, 14, 0.9);
        draw(6, 0, C.yellow, 14, 0.9);
      }
      draw(0, 0, frameColor, o.rarity === 'common' ? 6 : 14);
    };
    tl.call(
      () => {
        bigRarity.alpha = rank === 0 ? 0.3 : rank === 1 ? 0.6 : 1;
        gsap.from(bigRarity.scale, { x: 1.4, y: 1.4, duration: 0.3, ease: 'power3.out' });
        circle.tint = o.rarity === 'primordial' ? 0x111111 : rar.color === C.ink ? C.pinkHot : 0xffffff;
        // bell per level (pentatonic up)
        const steps = [1, 1.125, 1.25, 1.5, 1.68, 2];
        for (let i = 0; i <= Math.min(rank, 5); i++) window.setTimeout(() => sfx('tick', steps[i] * 1.5), i * 70);
        sfx(high ? 'fanfare' : 'reveal');
        const kf = { k: 0 };
        gsap.to(kf, { k: 1, duration: 0.45, ease: 'power2.inOut', onUpdate: () => drawFrame(kf.k) });
        switch (o.rarity) {
          case 'common':
            print.texture = printTile('common');
            gsap.to(print, { alpha: 0.12, duration: 0.3 });
            break;
          case 'rare':
            print.texture = printTile('rare');
            gsap.to(print, { alpha: 0.32, duration: 0.3 });
            if (!reduce) speedLines(root, W / 2, CY, C.megaBlue, 40, 0.5);
            break;
          case 'epic': {
            print.texture = printTile('epic');
            gsap.to(print, { alpha: 0.45, duration: 0.25 });
            if (!reduce) {
              shaker.add(0.4);
              const ink = new InkFilter({ threshold: 0.5, invert: true });
              const prev = [...(catNode.filters ?? [])];
              catNode.filters = [ink];
              window.setTimeout(() => !catNode.destroyed && (catNode.filters = prev), 70);
            }
            break;
          }
          case 'legendary': {
            bg.tint = 0x3a2a3c;
            dots.alpha = 0.12;
            rays.clear();
            for (let i = 0; i < 24; i++) {
              const a = (i / 24) * Math.PI * 2;
              rays.poly([0, 0, Math.cos(a - 0.05) * 1400, Math.sin(a - 0.05) * 1400, Math.cos(a + 0.05) * 1400, Math.sin(a + 0.05) * 1400]).fill({ color: 0xffd77a, alpha: i % 2 ? 0.18 : 0.32 });
            }
            gsap.to(rays, { alpha: 1, duration: 0.3 });
            gsap.to(rays, { rotation: 0.6, duration: 6, ease: 'none' });
            if (!reduce) time.slowmo(0.5, 300);
            foilSweep(root, 0xfff4c8);
            break;
          }
          case 'mythic': {
            print.texture = printTile('mythic');
            gsap.to(print, { alpha: 0.55, duration: 0.2 });
            bg.tint = 0x231626;
            const cm = new ColorMatrixFilter();
            stage.filters = [cm];
            const hue = { h: 0 };
            gsap.to(hue, { h: 720, duration: 4, ease: 'none', onUpdate: () => cm.hue(hue.h, false) });
            glitchBurst(root, 0.7);
            foilSweep(root, 0x9ff7ff);
            if (!reduce) shaker.add(0.5);
            break;
          }
          case 'primordial': {
            bg.tint = 0x0b0b0d;
            const n = new TilingSprite({ texture: noiseTile(), width: W, height: H });
            n.tint = fxCol.main;
            n.alpha = 0.25;
            n.blendMode = 'add';
            stage.addChild(n);
            const iv = window.setInterval(() => {
              if (n.destroyed) return window.clearInterval(iv);
              n.tilePosition.set(Math.random() * 128, Math.random() * 128);
            }, 1000 / 12);
            gsap.to(glow, { alpha: 0.9, duration: 0.4 });
            if (!reduce) shaker.add(0.45);
            break;
          }
        }
        if (darkStage) {
          serial.style.fill = C.paper;
          coords.style.fill = C.yellow;
        }
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

    // fill color (3300–4200): halftone-ish dissolve + name letter by letter
    const tN = (dup ? 1.0 : 3.3) + extra;
    if (!dup) tl.to(sil, { mix: 0, duration: 0.35, ease: 'power2.out' }, tN);
    tl.call(
      () => {
        sfx('meow');
        sparkles(root, W / 2, H / 2 - 120, rar.glow, 16, 260);
        const nmBox = new Container();
        nmBox.position.set(W / 2, H - 168);
        const style = { fontFamily: F.poster, fontSize: 110, letterSpacing: -1 } as const;
        const gA = poster('', 110, C.cyan, style);
        const gB = poster('', 110, C.pinkHot, style);
        const nm = poster('', 110, darkStage ? C.paper : C.ink, { stroke: { color: darkStage ? C.ink : C.paper, width: 10, join: 'round' } });
        for (const t of [gA, gB, nm]) t.anchor.set(0.5);
        gA.alpha = 0.8;
        gB.alpha = 0.8;
        nmBox.addChild(gA, gB, nm);
        nameLayer.addChild(nmBox);
        const full = o.name.toUpperCase();
        const letters = { n: 0, off: 8 };
        gsap.to(letters, {
          n: full.length,
          off: 0,
          duration: Math.max(0.2, full.length * 0.03),
          ease: 'none',
          onUpdate: () => {
            if (nm.destroyed) return;
            const s = full.slice(0, Math.ceil(letters.n));
            nm.text = s;
            gA.text = s;
            gB.text = s;
            gA.x = -letters.off;
            gB.x = letters.off;
            gA.y = letters.off * 0.4;
          },
          onComplete: () => {
            if (nm.destroyed) return;
            gA.alpha = 0;
            gB.alpha = 0;
          },
        });
        gsap.from(nmBox.scale, { x: 0.5, y: 0.5, duration: 0.35, ease: 'back.out(3)' });
        if (o.subtitle) {
          const st = txt(o.subtitle, { fontFamily: F.ui, fontWeight: '700', fontSize: 26, fill: darkStage ? C.paper : C.ink });
          st.anchor.set(0.5);
          st.position.set(W / 2, H - 92);
          if (st.width > 1100) st.scale.set(1100 / st.width);
          nameLayer.addChild(st);
        }
        if (o.caption) {
          const cap = new Container();
          const ct = txt(o.caption, { fontFamily: F.comic, fontSize: 30, fill: C.ink, wordWrap: true, wordWrapWidth: 520 });
          const box = new Graphics().rect(-14, -10, ct.width + 28, ct.height + 20).fill(C.yellow).stroke({ width: 4, color: C.ink });
          cap.addChild(box, ct);
          cap.position.set(W - 640, o.dex && !o.replay ? 190 : 130);
          cap.rotation = -0.03;
          nameLayer.addChild(cap);
          gsap.from(cap, { alpha: 0, x: cap.x + 60, duration: 0.3 });
        }
        if (dup) duplicateBits();
      },
      [],
      tN + 0.2,
    );

    // chips + mutation + card flies to its catdex slot (4200–4600)
    const tC = (dup ? 1.15 : 4.2) + extra;
    if (!dup)
      tl.call(
        () => {
          (o.chips ?? []).forEach((c, i) => {
            const ch = new Container();
            const t = txt(c, { fontFamily: F.poster, fontSize: 24, fill: C.paper, letterSpacing: 1 });
            const g = new Graphics().rect(0, 0, t.width + 22, t.height + 6).fill(i === 0 ? C.ink : i === 1 ? C.megaBlue : C.pinkHot).stroke({ width: 3, color: C.ink });
            t.position.set(11, 3);
            ch.addChild(g, t);
            ch.position.set(W / 2 + 330, CY - 150 + i * 58);
            ch.rotation = 0.03 * (i - 1);
            nameLayer.addChild(ch);
            gsap.from(ch, { x: ch.x + 80, alpha: 0, duration: 0.18, delay: i * 0.06, ease: 'back.out(2)' });
          });
          if (o.mutation) {
            const m = poster(`MUTACIÓN · ${o.mutation.toUpperCase()}`, 54, C.paper, { stroke: { color: C.ink, width: 8 } });
            const box = new Graphics().rect(-m.width / 2 - 16, -m.height / 2 - 4, m.width + 32, m.height + 8).fill(C.red).stroke({ width: 5, color: C.ink });
            m.anchor.set(0.5);
            const mc = new Container();
            mc.addChild(box, m);
            mc.position.set(W / 2 - 200, H / 2 + 260);
            mc.rotation = -0.1;
            nameLayer.addChild(mc);
            gsap.fromTo(mc.scale, { x: 2.4, y: 2.4 }, { x: 1, y: 1, duration: 0.16, ease: 'back.out(3)' });
            sfx('boom', 1.3);
            shaker.add(0.3);
          }
          if (o.dex && dexText && !o.replay) flyToDex();
        },
        [],
        tC,
      );

    const tDone = (dup ? 1.4 : 4.6) + extra;
    const hint = txt('CLIC PARA CONTINUAR', { fontFamily: F.poster, fontSize: 28, fill: darkStage ? C.paper : C.ink });
    hint.anchor.set(0.5);
    hint.position.set(W / 2, H - 38);
    hint.alpha = 0;
    root.addChild(hint);
    tl.to(hint, { alpha: 1, duration: 0.3, yoyo: true, repeat: -1 }, tDone);

    let finished = false;
    let result: RevealResult = 'continue';
    tl.call(
      () => {
        finished = true;
        skipBtn.visible = false;
        if (!o.replay && !dup) {
          const btn = new Container();
          const t = txt('VER EN CATDEX ›', { fontFamily: F.poster, fontSize: 30, fill: C.ink });
          const g = new Graphics().rect(6, 6, t.width + 36, t.height + 14).fill(C.ink).rect(0, 0, t.width + 36, t.height + 14).fill(C.pink).stroke({ width: 4, color: C.ink });
          t.position.set(18, 7);
          btn.addChild(g, t);
          btn.position.set(W - btn.width - 60, H - 100);
          btn.eventMode = 'static';
          btn.cursor = 'pointer';
          btn.on('pointertap', (e) => {
            e.stopPropagation();
            result = 'catdex';
            finish();
          });
          uiLayer.addChild(btn);
          gsap.from(btn, { alpha: 0, y: btn.y + 30, duration: 0.25, ease: 'back.out(2)' });
        }
      },
      [],
      tDone,
    );

    function duplicateBits() {
      const d = poster(`DUPLICADO · +${o.duplicateOrbs} ORBES`, 54, C.pinkHot, { stroke: { color: C.ink, width: 8 } });
      d.anchor.set(0.5);
      d.rotation = -0.12;
      d.position.set(W / 2 + 560, CY - 10);
      nameLayer.addChild(d);
      gsap.from(d.scale, { x: 2, y: 2, duration: 0.15, ease: 'back.out(3)' });
      sfx('gem');
      const info = o.dup;
      if (!info || !info.need) return;
      // star bar
      const bw = 420;
      const bar = new Container();
      const bx0 = W / 2 + 340;
      const by0 = CY + 70;
      bar.position.set(bx0, by0);
      const back = new Graphics().rect(6, 6, bw, 44).fill(C.ink).rect(0, 0, bw, 44).fill(C.paperDark).stroke({ width: 4, color: C.ink });
      const fill = new Graphics().rect(0, 0, bw, 44).fill(C.yellow);
      fill.scale.x = Math.min(1, info.before / info.need);
      const lab = txt(`ORBES ${info.before}/${info.need} → ★${info.star}`, { fontFamily: F.poster, fontSize: 28, fill: C.ink });
      lab.anchor.set(0.5);
      lab.position.set(bw / 2, 22);
      const star = new Graphics().star(bw + 36, 22, 5, 26, 11).fill(C.yellow).stroke({ width: 4, color: C.ink });
      bar.addChild(back, fill, lab, star);
      nameLayer.addChild(bar);
      gsap.from(bar, { alpha: 0, y: bar.y + 30, duration: 0.2 });
      // orbs fly into the bar
      const n = Math.min(16, Math.max(6, o.duplicateOrbs ?? 8));
      for (let i = 0; i < n; i++) {
        const orb = new Graphics().circle(0, 0, 12).fill(C.violet).stroke({ width: 3, color: C.ink });
        orb.circle(-4, -4, 3).fill(0xffffff);
        orb.position.set(W / 2 + (Math.random() - 0.5) * 200, H / 2 + (Math.random() - 0.5) * 200);
        nameLayer.addChild(orb);
        const tx = bx0 + bw * Math.min(1, info.after / info.need);
        gsap.to(orb, {
          x: tx,
          y: by0 + 22,
          duration: 0.35,
          delay: i * 0.03,
          ease: 'power2.in',
          onComplete: () => {
            sfx('coin', 1 + i * 0.06);
            orb.destroy();
          },
        });
      }
      const counter = { v: info.before };
      gsap.to(counter, {
        v: Math.min(info.after, info.need * 9),
        duration: 0.45,
        delay: 0.25,
        onUpdate: () => {
          if (!lab.destroyed) lab.text = `ORBES ${Math.round(counter.v)}/${info.need} → ★${info.star}`;
        },
      });
      gsap.to(fill.scale, { x: Math.min(1, info.after / info.need), duration: 0.45, delay: 0.25, ease: 'back.out(1.6)' });
      gsap.delayedCall(0.75, () => {
        if (root.destroyed) return;
        const enough = info.after >= info.need;
        const say = !enough
          ? `TE FALTAN ${info.need - info.after} PARA ★${info.star}`
          : info.ready
            ? `¡ME FALTABAN ${info.missing}! ¡YA PUEDES SUBIR ★${info.star}!`
            : `¡ME FALTABAN ${info.missing}! (AHORA: NV ${info.minLevel ?? '?'})`;
        onomatopoeia(nameLayer, bx0 + bw / 2, by0 + 110, say, { size: 40, color: enough ? C.yellow : C.paper, dur: 3.2 });
        if (enough) gsap.to(star.scale, { x: 1.3, y: 1.3, yoyo: true, repeat: 3, duration: 0.15 });
      });
    }

    function flyToDex() {
      const card = new Container();
      if (o.species) card.addChild(new CatCard(o.species, { w: 180, h: 240, status: 'registered', live: false }));
      else {
        card.addChild(new Graphics().rect(0, 0, 180, 240).fill(C.paper).stroke({ width: 5, color: C.ink }));
        const c2 = variantSprite('', 170, { slug: o.slug, tint: o.tintSpec ?? null }).root;
        c2.position.set(90, 110);
        card.addChild(c2);
      }
      card.pivot.set(90, 120);
      card.position.set(W / 2, CY);
      root.addChild(card);
      const tx = W - 330 + 135;
      const ty = 36 + 52;
      gsap
        .timeline()
        .to(card, { x: tx, y: ty, rotation: 0.3, duration: 0.38, ease: 'power2.in' })
        .to(card.scale, { x: 0.25, y: 0.25, duration: 0.38, ease: 'power2.in' }, 0)
        .call(() => {
          if (root.destroyed) return;
          card.destroy({ children: true });
          sfx('tick', 1.5);
          sfx('pop');
          if (dexText && o.dex) {
            dexText.text = `${o.dex[1]}/${o.dex[2]}`;
            gsap.fromTo(dexText.scale, { x: 1.5, y: 1.5 }, { x: 1, y: 1, duration: 0.35, ease: 'back.out(3)' });
            dexText.style.fill = C.pinkHot;
          }
          gsap.fromTo(dexSlot, { rotation: -0.06 }, { rotation: 0, duration: 0.4, ease: 'elastic.out(1.2,0.4)' });
        });
    }

    let closing = false;
    function finish() {
      if (closing) return;
      closing = true;
      sfx('paper');
      tl.kill();
      gsap.to(root, {
        alpha: 0,
        duration: 0.25,
        onComplete: () => {
          shaker.destroy();
          killTree(root);
          root.destroy({ children: true });
          resolve(result);
        },
      });
    }

    root.eventMode = 'static';
    root.hitArea = { contains: () => true };
    root.on('pointertap', () => {
      if (!finished) {
        if (!canSkip || skipped) return;
        skipped = true;
        tl.timeScale(6);
        return;
      }
      finish();
    });
  });
}

/** foil sheen sweeping across the whole screen */
function foilSweep(layer: Container, tint: number) {
  const s = new Sprite(sheenTexture());
  s.anchor.set(0.5);
  s.width = 700;
  s.height = H * 2.4;
  s.rotation = 0.45;
  s.tint = tint;
  s.blendMode = 'add';
  s.position.set(-400, H / 2);
  layer.addChild(s);
  gsap.to(s, { x: W + 400, duration: 0.8, ease: 'power2.inOut', onComplete: () => s.destroy() });
}

/** horizontal glitch bars flickering for `dur` seconds */
function glitchBurst(layer: Container, dur: number) {
  if (settings.reduceMotion) return;
  const g = new Graphics();
  layer.addChild(g);
  let n = 0;
  const iv = window.setInterval(() => {
    if (g.destroyed) return window.clearInterval(iv);
    g.clear();
    if (++n > dur * 24) {
      window.clearInterval(iv);
      g.destroy();
      return;
    }
    for (let i = 0; i < 6; i++) {
      const y = Math.random() * H;
      g.rect(Math.random() * W * 0.4, y, W * (0.2 + Math.random() * 0.6), 4 + Math.random() * 22).fill({ color: i % 2 ? C.cyan : C.pinkHot, alpha: 0.55 });
    }
  }, 1000 / 24);
}
