/**
 * Storyboard (g) "Subir estrella" (research/07): orbs fly into the card, anticipation
 * pulses, the new star lands like a rubber stamp, stats roll on an odometer and the
 * unlocked-effect card flips. 2.6 s (★2–3, T2) · 3.2 s (★4–5, T3) · ★6 adds a longer stinger.
 */
import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { C, F } from '../../ui/theme';
import { txt, poster } from '../../ui/widgets';
import { sfx } from '../../core/audio';
import { settings } from '../../core/settings';
import { glowTexture, halftoneTexture } from '../../art/textures';
import { SilhouetteFilter } from '../filters';
import { Shaker, onomatopoeia, sparkles, speedLines, time } from '../juice';
import { CatCard } from '../../panels/collection/CatCard';
import { Odometer, killTree } from '../../panels/collection/ui';

export interface StarUpOpts {
  species: string;
  name: string;
  level: number;
  fromStars: number;
  toStars: number;
  ownBefore: number;
  need: number;
  prismaUsed: number;
  stats: { label: string; from: number; to: number; digits?: number }[];
  unlockTitle: string;
  unlockText: string;
  /** shot name for the ★4 "attack changed" stinger */
  shotName?: string;
}

const PENTA = [1, 1.125, 1.25, 1.5, 1.68, 2, 2.25, 2.5, 3, 3.37];

export function playStarUp(layer: Container, o: StarUpOpts): Promise<void> {
  return new Promise((resolve) => {
    const root = new Container();
    layer.addChild(root);
    const shaker = new Shaker(root, 18, 0.015);
    const reduce = settings.reduceMotion;
    const big = o.toStars >= 4;
    const tEnd = big ? 3.2 : 2.6;

    const dim = new Graphics().rect(0, 0, W, H).fill(C.ink);
    const dots = new TilingSprite({ texture: halftoneTexture(C.paper, 14, 1.6), width: W, height: H });
    dots.alpha = 0.05;
    const cx = W / 2 - 300;
    const cy = H / 2 + 20;
    const circle = new Graphics().circle(cx, cy, 330).fill(C.red);
    const block = new Graphics().rect(0, 0, 220, H).fill(C.yellow);
    block.position.set(W - 220, 0);
    const title = poster(`ALTAR DE ALMAS · ★${o.toStars}`, 40, C.paper);
    title.position.set(60, 40);
    root.addChild(dim, dots, block, circle, title);

    // card
    const cardHolder = new Container();
    cardHolder.position.set(cx, cy);
    const glow = new Sprite(glowTexture());
    glow.anchor.set(0.5);
    glow.scale.set(6);
    glow.alpha = 0;
    glow.blendMode = 'add';
    const card = new CatCard(o.species, { w: 380, h: 510, hires: true, level: o.level, status: 'registered' });
    card.pivot.set(190, 255);
    const flash = new SilhouetteFilter(0xffffff, 0);
    card.filters = [flash];
    cardHolder.addChild(glow, card);
    root.addChild(cardHolder);

    // star slots
    const starRow = new Container();
    starRow.position.set(cx, cy - 320);
    const slotW = 64;
    const maxStars = 6;
    const sx0 = -((maxStars - 1) * slotW) / 2;
    for (let i = 0; i < maxStars; i++) {
      const g = new Graphics().star(sx0 + i * slotW, 0, 5, 26, 11);
      if (i < o.fromStars) g.fill(C.yellow).stroke({ width: 4, color: C.ink });
      else g.stroke({ width: 3, color: C.paper, alpha: i === o.toStars - 1 ? 0.9 : 0.25 });
      starRow.addChild(g);
    }
    root.addChild(starRow);

    // orb bar
    const bar = new Container();
    bar.position.set(cx - 240, cy + 290);
    const bw = 480;
    const back = new Graphics().rect(5, 5, bw, 40).fill(0x000000).rect(0, 0, bw, 40).fill(0x3a2f3a).stroke({ width: 3, color: C.paper });
    const fill = new Graphics().rect(0, 0, bw, 40).fill(C.violet);
    fill.scale.x = Math.min(1, o.ownBefore / Math.max(1, o.need));
    const lab = txt(`ORBES ${Math.min(o.ownBefore, o.need)}/${o.need}`, { fontFamily: F.poster, fontSize: 26, fill: C.paper });
    lab.anchor.set(0.5);
    lab.position.set(bw / 2, 20);
    bar.addChild(back, fill, lab);
    if (o.prismaUsed > 0) {
      const pt = txt(`+${o.prismaUsed} PRISMA`, { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.cyan });
      pt.position.set(bw + 14, 10);
      bar.addChild(pt);
    }
    root.addChild(bar);

    // right side info (appears after impact)
    const info = new Container();
    info.position.set(W / 2 + 120, 230);
    info.alpha = 0;
    root.addChild(info);

    const tl = gsap.timeline();
    tl.from(circle.scale, { x: 0, y: 0, duration: 0.3, ease: 'back.out(2)' }, 0);
    tl.from(cardHolder, { y: cy + 200, alpha: 0, duration: 0.3, ease: 'back.out(1.6)' }, 0);
    tl.from(block, { x: W, duration: 0.25, ease: 'power3.out' }, 0.05);

    // 0–800: orbs fly in (30 ms stagger) with pentatonic pings
    const n = Math.max(10, Math.min(20, Math.round(o.need / 3)));
    const src = { x: 140, y: H - 120 };
    const inv = new Graphics().circle(src.x, src.y, 46).fill(C.violet).stroke({ width: 4, color: C.paper });
    const invT = txt('ORBES', { fontFamily: F.poster, fontSize: 22, fill: C.paper });
    invT.anchor.set(0.5);
    invT.position.set(src.x, src.y + 66);
    root.addChild(inv, invT);
    for (let i = 0; i < n; i++) {
      tl.call(
        () => {
          const orb = new Graphics().circle(0, 0, 13).fill(i % 4 === 3 && o.prismaUsed ? C.cyan : C.violet).stroke({ width: 3, color: C.paper });
          orb.circle(-4, -4, 3.5).fill(0xffffff);
          orb.position.set(src.x, src.y);
          root.addChild(orb);
          const mx = (src.x + cx) / 2 + (Math.random() - 0.5) * 200;
          const my = Math.min(src.y, cy) - 220 - Math.random() * 120;
          const p = { t: 0 };
          gsap.to(p, {
            t: 1,
            duration: 0.42,
            ease: 'power2.in',
            onUpdate: () => {
              if (orb.destroyed) return;
              const t = p.t;
              orb.x = (1 - t) * (1 - t) * src.x + 2 * (1 - t) * t * mx + t * t * cx;
              orb.y = (1 - t) * (1 - t) * src.y + 2 * (1 - t) * t * my + t * t * cy;
              orb.scale.set(1 - t * 0.5);
            },
            onComplete: () => {
              if (root.destroyed) return;
              orb.destroy();
              sfx('coin', PENTA[i % PENTA.length]);
              const k = Math.min(1, (o.ownBefore + ((o.need - o.ownBefore) * (i + 1)) / n) / o.need);
              gsap.to(fill.scale, { x: k, duration: 0.12, ease: 'back.out(2)' });
              lab.text = `ORBES ${Math.round(Math.min(o.need, o.ownBefore + ((o.need - o.ownBefore) * (i + 1)) / n))}/${o.need}`;
              gsap.fromTo(card.scale, { x: 1.03, y: 1.03 }, { x: 1, y: 1, duration: 0.1 });
            },
          });
        },
        [],
        0.15 + i * 0.03,
      );
    }
    tl.to(fill.scale, { x: 1.06, duration: 0.08, ease: 'power2.out' }, 0.8);
    tl.to(fill.scale, { x: 1, duration: 0.2, ease: 'back.out(3)' }, 0.88);

    // 800–1300: anticipation pulses (300/200/120 ms), growing white glow
    tl.call(() => sfx('charge'), [], 0.8);
    if (!reduce) tl.call(() => speedLines(root, cx, cy, C.paper, 36, 0.5), [], 0.85);
    let t = 0.8;
    [0.3, 0.2, 0.12].forEach((d, i) => {
      tl.to(card.scale, { x: 1.08, y: 1.08, duration: d / 2, ease: 'power2.out' }, t);
      tl.to(card.scale, { x: 1, y: 1, duration: d / 2, ease: 'power2.in' }, t + d / 2);
      tl.to(glow, { alpha: 0.25 + i * 0.25, duration: d }, t);
      tl.to(flash, { mix: 0.15 + i * 0.2, duration: d }, t);
      t += d;
    });

    // 1300: impact
    const tImp = 1.3;
    tl.call(
      () => {
        if (!reduce) time.hitstop(80);
        sfx('boom', 1.2);
        sfx('levelup');
        shaker.add(0.25 + (big ? 0.15 : 0));
        flash.mix = 1;
        gsap.to(flash, { mix: 0, duration: 0.3 });
        gsap.to(glow, { alpha: 0.35, duration: 0.5 });
        const slot = o.toStars - 1;
        const sxs = cx + sx0 + slot * slotW;
        const sys = cy - 320;
        const st = new Graphics().star(0, 0, 5, 26, 11).fill(C.yellow).stroke({ width: 4, color: C.ink });
        st.position.set(sxs, sys);
        st.rotation = -0.14;
        root.addChild(st);
        gsap.fromTo(st.scale, { x: 3.2, y: 3.2 }, { x: 1, y: 1, duration: 0.14, ease: 'power3.in' });
        const splash = new Graphics();
        for (let k = 0; k < 9; k++) {
          const a = Math.random() * Math.PI * 2;
          const r = 34 + Math.random() * 26;
          splash.circle(sxs + Math.cos(a) * r, sys + Math.sin(a) * r, 3 + Math.random() * 6).fill(C.paper);
        }
        root.addChildAt(splash, root.children.indexOf(st));
        sparkles(root, sxs, sys, C.yellow, 14, 140);
        onomatopoeia(root, cx + 220, cy - 160, '¡TUNK!', { size: 110, color: C.yellow, dur: 1.2 });
        // big stamp on the card
        const stamp = poster(`★${o.toStars}`, 150, C.yellow, { stroke: { color: C.ink, width: 12 } });
        stamp.anchor.set(0.5);
        stamp.position.set(cx + 130, cy + 150);
        stamp.rotation = -0.14;
        root.addChild(stamp);
        gsap.fromTo(stamp.scale, { x: 2.4, y: 2.4 }, { x: 1, y: 1, duration: 0.14, ease: 'power3.in' });
      },
      [],
      tImp,
    );

    // 1500–2600: stats odometer + effect card flip
    tl.call(
      () => {
        info.alpha = 1;
        const h = poster('¡SUBIÓ DE ESTRELLA!', 64, C.paper);
        info.addChild(h);
        gsap.from(h, { x: 60, alpha: 0, duration: 0.2 });
        const nm = txt(`${o.name.toUpperCase()} · ★${o.fromStars} → ★${o.toStars}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.yellow, letterSpacing: 2 });
        nm.position.set(4, 96);
        info.addChild(nm);
        o.stats.forEach((s, i) => {
          const y = 150 + i * 104;
          const k = txt(s.label, { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.paper, letterSpacing: 3 });
          k.position.set(4, y);
          const d = s.digits ?? 1;
          const od = new Odometer({ fontFamily: F.poster, fontSize: 52, fill: C.paper });
          od.position.set(4, y + 22);
          info.addChild(k, od);
          gsap.delayedCall(i * 0.12, () => {
            if (od.destroyed) return;
            od.set(s.from.toFixed(d), s.to.toFixed(d), 0.05, 0.6);
            sfx('tick', 1.2 + i * 0.2);
          });
          const plus = poster(`+${(s.to - s.from).toFixed(d)}`, 40, C.mint);
          plus.position.set(270, y + 34);
          info.addChild(plus);
          gsap.from(plus, { alpha: 0, x: 240, duration: 0.25, delay: 0.4 + i * 0.12 });
        });
        // effect card (flip)
        const ec = new Container();
        ec.position.set(4 + 290, 150 + o.stats.length * 104 + 110);
        const cw = 580;
        const ch = 170;
        const front = new Graphics().rect(-cw / 2 + 6, -ch / 2 + 6, cw, ch).fill(C.pinkHot).rect(-cw / 2, -ch / 2, cw, ch).fill(C.paper).stroke({ width: 4, color: C.ink });
        const ft = poster('★'.repeat(o.toStars), 64, C.ink);
        ft.anchor.set(0.5);
        const faceA = new Container();
        faceA.addChild(front, ft);
        const backG = new Graphics().rect(-cw / 2 + 6, -ch / 2 + 6, cw, ch).fill(C.ink).rect(-cw / 2, -ch / 2, cw, ch).fill(C.yellow).stroke({ width: 4, color: C.ink });
        const bt = poster(o.unlockTitle.toUpperCase(), 32, C.ink);
        bt.position.set(-cw / 2 + 18, -ch / 2 + 6);
        const bx = txt(o.unlockText, { fontFamily: F.ui, fontWeight: '700', fontSize: 20, fill: C.ink, wordWrap: true, wordWrapWidth: cw - 36, lineHeight: 25 });
        bx.position.set(-cw / 2 + 18, -ch / 2 + 54);
        const faceB = new Container();
        faceB.addChild(backG, bt, bx);
        faceB.visible = false;
        ec.addChild(faceA, faceB);
        ec.rotation = -0.02;
        info.addChild(ec);
        gsap.from(ec, { alpha: 0, y: ec.y + 40, duration: 0.2 });
        gsap
          .timeline({ delay: 0.45 })
          .to(ec.scale, { x: 0, duration: 0.14, ease: 'power2.in', onComplete: () => { if (faceA.destroyed) return; faceA.visible = false; faceB.visible = true; sfx('paper'); } })
          .to(ec.scale, { x: 1, duration: 0.18, ease: 'back.out(2)' });
      },
      [],
      1.5,
    );

    // ★4+: the attack changed (stinger)
    if (big)
      tl.call(
        () => {
          sfx('sting');
          const b = new Container();
          const t1 = poster(o.toStars >= 6 ? '¡FORMA ASCENDIDA!' : o.toStars === 4 ? '¡SU ATAQUE CAMBIÓ!' : '¡PASIVA DE MAESTRÍA!', 72, C.ink);
          const g = new Graphics().rect(-24, -8, t1.width + 48, t1.height + 16).fill(C.yellow).stroke({ width: 6, color: C.ink });
          b.addChild(g, t1);
          b.position.set(W / 2 - b.width / 2, H - 200);
          b.rotation = -0.04;
          root.addChild(b);
          gsap.fromTo(b.scale, { x: 1.8, y: 1.8 }, { x: 1, y: 1, duration: 0.16, ease: 'back.out(3)' });
          if (o.shotName && o.toStars === 4) {
            const s = txt(o.shotName.toUpperCase() + ' — NUEVA VERSIÓN', { fontFamily: F.comic, fontSize: 34, fill: C.paper });
            s.position.set(b.x + 10, b.y + 100);
            root.addChild(s);
          }
          if (!reduce) speedLines(root, W / 2, H - 160, C.yellow, 40, 0.5);
          shaker.add(0.3);
        },
        [],
        2.6,
      );

    const hint = txt('CLIC PARA CONTINUAR', { fontFamily: F.poster, fontSize: 28, fill: C.paper });
    hint.anchor.set(0.5);
    hint.position.set(W / 2, H - 46);
    hint.alpha = 0;
    root.addChild(hint);
    tl.to(hint, { alpha: 1, duration: 0.3, yoyo: true, repeat: -1 }, tEnd);
    let finished = false;
    tl.call(() => (finished = true), [], tEnd);
    let skipped = false;
    root.eventMode = 'static';
    root.hitArea = { contains: () => true };
    root.on('pointertap', () => {
      if (!finished) {
        if (skipped) return;
        skipped = true;
        tl.timeScale(5);
        return;
      }
      sfx('paper');
      tl.kill();
      gsap.to(root, {
        alpha: 0,
        duration: 0.25,
        onComplete: () => {
          shaker.destroy();
          killTree(root);
          root.destroy({ children: true });
          resolve();
        },
      });
    });
  });
}
