/**
 * Storyboard (g) "Subir estrella" (research/07), juice proportional to the star:
 *   ★2  T2 2.6 s — orbs fly in, 3 anticipation pulses, the star lands like a rubber stamp
 *       (¡TUNK!), odometer stats, the unlocked-effect card flips.
 *   ★3  T2+ 2.9 s — + element burst and "¡EFECTO SECUNDARIO!" tag.
 *   ★4  T3 3.8 s — + the element's DIMENSION tears in: a letterbox mini-clip of the new attack.
 *   ★5  T3 full screen ~5 s — the screen shatters into the element dimension: giant painting,
 *       five stars slam in, "MAESTRÍA" poster and the mastery passive.
 *   ★6  T4 — ★5 with the palette inverted, halo and crown (Forma Ascendida).
 */
import { ColorMatrixFilter, Container, Graphics, Sprite, Text, Ticker, TilingSprite } from 'pixi.js';
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
import { variantSprite } from '../../panels/collection/art';
import { dimensionBackground, dimensionOf, projectileArt, trailBit, Dimension } from '../../panels/collection/dimension';

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
  shotCry?: string;
  /** main element → dimension of the ★4/★5 beats */
  element?: string;
  mutation?: string | null;
  /** all active star perks after the upgrade (shown on the ★5 poster) */
  perkLines?: string[];
}

const PENTA = [1, 1.125, 1.25, 1.5, 1.68, 2, 2.25, 2.5, 3, 3.37];

export function playStarUp(layer: Container, o: StarUpOpts): Promise<void> {
  return new Promise((resolve) => {
    const root = new Container();
    layer.addChild(root);
    const shaker = new Shaker(root, 18, 0.015);
    const reduce = settings.reduceMotion;
    const star = o.toStars;
    const dim = dimensionOf(o.element ?? 'fire');
    const full = star >= 5; // T3 full-screen takeover (★6: T4)
    const clip = star === 4;
    const tEnd = full ? 5.1 : clip ? 3.8 : star === 3 ? 2.9 : 2.6;
    const tickers: ((t: Ticker) => void)[] = [];
    const addTicker = (f: (t: Ticker) => void) => {
      tickers.push(f);
      Ticker.shared.add(f);
    };

    // ------------------------------------------------------------ editorial stage
    const stage = new Container();
    root.addChild(stage);
    const dim0 = new Graphics().rect(0, 0, W, H).fill(C.ink);
    const dots = new TilingSprite({ texture: halftoneTexture(C.paper, 14, 1.6), width: W, height: H });
    dots.alpha = 0.05;
    const cx = W / 2 - 300;
    const cy = H / 2 + 20;
    const circle = new Graphics().circle(cx, cy, 330).fill(C.red);
    const block = new Graphics().rect(0, 0, 220, H).fill(star >= 3 ? dim.accent : C.yellow);
    block.position.set(W - 220, 0);
    const title = poster(`ALTAR DE ALMAS · ★${star}`, 40, C.paper);
    title.position.set(60, 40);
    stage.addChild(dim0, dots, block, circle, title);

    // card
    const cardHolder = new Container();
    cardHolder.position.set(cx, cy);
    const glow = new Sprite(glowTexture());
    glow.anchor.set(0.5);
    glow.scale.set(6);
    glow.alpha = 0;
    glow.blendMode = 'add';
    const card = new CatCard(o.species, { w: 380, h: 510, hires: true, level: o.level, status: 'registered', mutation: o.mutation });
    card.pivot.set(190, 255);
    const flash = new SilhouetteFilter(0xffffff, 0);
    card.filters = [flash];
    cardHolder.addChild(glow, card);
    stage.addChild(cardHolder);

    // star slots
    const starRow = new Container();
    starRow.position.set(cx, cy - 320);
    const slotW = 64;
    const maxStars = 6;
    const sx0 = -((maxStars - 1) * slotW) / 2;
    for (let i = 0; i < maxStars; i++) {
      const g = new Graphics().star(sx0 + i * slotW, 0, 5, 26, 11);
      if (i < o.fromStars) g.fill(C.yellow).stroke({ width: 4, color: C.ink });
      else g.stroke({ width: 3, color: C.paper, alpha: i === star - 1 ? 0.9 : 0.25 });
      starRow.addChild(g);
    }
    stage.addChild(starRow);

    // orb bar (own orbs violet, prisma cyan)
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
      const pt = txt(`+${o.prismaUsed} PRISMA`, { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.cyan });
      pt.position.set(bw + 14, 8);
      bar.addChild(pt);
    }
    stage.addChild(bar);

    // right side info (appears after impact)
    const info = new Container();
    info.position.set(W / 2 + 120, 230);
    info.alpha = 0;
    stage.addChild(info);

    const tl = gsap.timeline();
    tl.from(circle.scale, { x: 0, y: 0, duration: 0.3, ease: 'back.out(2)' }, 0);
    tl.from(cardHolder, { y: cy + 200, alpha: 0, duration: 0.3, ease: 'back.out(1.6)' }, 0);
    tl.from(block, { x: W, duration: 0.25, ease: 'power3.out' }, 0.05);

    // 0–800: orbs fly in (30 ms stagger) with pentatonic pings; prisma orbs are cyan diamonds
    const n = Math.max(10, Math.min(20, Math.round(o.need / 3)));
    const prismaK = o.prismaUsed / Math.max(1, o.need);
    const src = { x: 140, y: H - 120 };
    const inv = new Graphics().circle(src.x, src.y, 46).fill(C.violet).stroke({ width: 4, color: C.paper });
    const invT = txt('ORBES', { fontFamily: F.poster, fontSize: 22, fill: C.paper });
    invT.anchor.set(0.5);
    invT.position.set(src.x, src.y + 66);
    stage.addChild(inv, invT);
    for (let i = 0; i < n; i++) {
      tl.call(
        () => {
          const isPrisma = i >= n * (1 - prismaK);
          const orb = new Graphics();
          if (isPrisma) orb.poly([0, -15, 12, 0, 0, 15, -12, 0]).fill(C.cyan).stroke({ width: 3, color: C.paper });
          else orb.circle(0, 0, 13).fill(C.violet).stroke({ width: 3, color: C.paper }).circle(-4, -4, 3.5).fill(0xffffff);
          orb.position.set(src.x, src.y);
          stage.addChild(orb);
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
              orb.rotation = isPrisma ? t * 6 : 0;
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
    if (!reduce) tl.call(() => speedLines(stage, cx, cy, star >= 4 ? dim.hi : C.paper, 36 + star * 4, 0.5), [], 0.85);
    let t = 0.8;
    [0.3, 0.2, 0.12].forEach((d, i) => {
      tl.to(card.scale, { x: 1.08, y: 1.08, duration: d / 2, ease: 'power2.out' }, t);
      tl.to(card.scale, { x: 1, y: 1, duration: d / 2, ease: 'power2.in' }, t + d / 2);
      tl.to(glow, { alpha: 0.25 + i * 0.25, duration: d }, t);
      tl.to(flash, { mix: 0.15 + i * 0.2, duration: d }, t);
      t += d;
    });

    // 1300: impact — the new star lands like a rubber stamp
    const tImp = 1.3;
    tl.call(
      () => {
        if (!reduce) time.hitstop(star >= 4 ? 110 : 80);
        sfx('boom', 1.2);
        sfx('levelup');
        shaker.add(0.25 + (star >= 4 ? 0.15 : 0) + (star >= 5 ? 0.15 : 0));
        flash.mix = 1;
        gsap.to(flash, { mix: 0, duration: 0.3 });
        gsap.to(glow, { alpha: 0.35, duration: 0.5 });
        const slot = star - 1;
        const sxs = cx + sx0 + slot * slotW;
        const sys = cy - 320;
        const st = new Graphics().star(0, 0, 5, 26, 11).fill(C.yellow).stroke({ width: 4, color: C.ink });
        st.position.set(sxs, sys);
        st.rotation = -0.14;
        stage.addChild(st);
        gsap.fromTo(st.scale, { x: 3.2, y: 3.2 }, { x: 1, y: 1, duration: 0.14, ease: 'power3.in' });
        const splash = new Graphics();
        for (let k = 0; k < 9; k++) {
          const a = Math.random() * Math.PI * 2;
          const r = 34 + Math.random() * 26;
          splash.circle(sxs + Math.cos(a) * r, sys + Math.sin(a) * r, 3 + Math.random() * 6).fill(C.paper);
        }
        stage.addChildAt(splash, stage.children.indexOf(st));
        sparkles(stage, sxs, sys, C.yellow, 14, 140);
        onomatopoeia(stage, cx + 300, cy + 30, '¡TUNK!', { size: 110, color: C.yellow, dur: 1.2 });
        // rubber stamp on the card's top-right corner (never over the name plate)
        const stamp = poster(`★${star}`, 128, C.yellow, { stroke: { color: C.ink, width: 12 } });
        stamp.anchor.set(0.5);
        stamp.position.set(cx + 170, cy - 200);
        stamp.rotation = -0.14;
        stage.addChild(stamp);
        gsap.fromTo(stamp.scale, { x: 2.4, y: 2.4 }, { x: 1, y: 1, duration: 0.14, ease: 'power3.in' });
        if (star >= 3) elementBurst(stage, cx, cy, dim, star, stage.children.indexOf(cardHolder));
      },
      [],
      tImp,
    );

    // 1500–2600: stats odometer + effect card flip (editorial info)
    if (!full)
      tl.call(
        () => {
          info.alpha = 1;
          const h = poster('¡SUBIÓ DE ESTRELLA!', 64, C.paper);
          info.addChild(h);
          gsap.from(h, { x: 60, alpha: 0, duration: 0.2 });
          const nm = txt(`${o.name.toUpperCase()} · ★${o.fromStars} → ★${star}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.yellow, letterSpacing: 2 });
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
          const ec = flipCard(o.unlockTitle, o.unlockText, star, 580, 170);
          ec.position.set(4 + 290, 150 + o.stats.length * 104 + 110);
          info.addChild(ec);
          if (star === 3) {
            const tag = tagBanner('¡EFECTO SECUNDARIO!', dim.accent, C.ink, 40);
            tag.pivot.set(tag.width / 2, tag.height / 2);
            tag.position.set(ec.x + 150, ec.y - 108);
            tag.rotation = -0.05;
            info.addChild(tag);
            gsap.fromTo(tag.scale, { x: 1.8, y: 1.8 }, { x: 1, y: 1, duration: 0.16, delay: 0.6, ease: 'back.out(3)' });
            gsap.from(tag, { alpha: 0, duration: 0.05, delay: 0.6 });
          }
        },
        [],
        1.5,
      );

    // ★4: the dimension tears in — letterbox mini-clip of the new attack
    if (clip) tl.call(() => attackClip(), [], 2.55);

    // ★5/★6: full-screen mastery takeover
    if (full) tl.call(() => masteryTakeover(), [], 1.55);

    const hint = txt('CLIC PARA CONTINUAR', { fontFamily: F.poster, fontSize: 28, fill: C.paper, stroke: { color: C.ink, width: 6 } });
    hint.anchor.set(0.5);
    hint.position.set(W / 2, H - 18);
    hint.alpha = 0;
    root.addChild(hint);
    tl.call(() => root.addChild(hint), [], tEnd - 0.01);
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
          for (const f of tickers) Ticker.shared.remove(f);
          shaker.destroy();
          killTree(root);
          root.destroy({ children: true });
          resolve();
        },
      });
    });

    // ================================================================ ★4 clip
    function attackClip() {
      if (root.destroyed) return;
      sfx('sting');
      const BH = 224;
      const by = H - BH - 30;
      const band = new Container();
      band.position.set(0, by);
      const bg = dimensionBackground(dim, W, BH, 41);
      const m = new Graphics().rect(0, 0, W, BH).fill(0xffffff);
      bg.mask = m;
      const frame = new Graphics().rect(0, 0, W, BH).stroke({ width: 8, color: C.ink }).rect(0, -6, W, 6).fill(dim.hi).rect(0, BH, W, 6).fill(dim.hi);
      band.addChild(bg, m, frame);
      root.addChild(band);
      gsap.from(band, { x: -W, duration: 0.22, ease: 'power3.out' });
      shaker.add(0.2);
      // cat portrait (left) shoots
      const shooter = variantSprite(o.species, 230, { mutation: o.mutation }).root;
      shooter.position.set(170, BH / 2 + 14);
      band.addChild(shooter);
      gsap.from(shooter, { x: -100, duration: 0.25, ease: 'back.out(2)' });
      // dummy target (right): plank stack
      const target = new Container();
      target.position.set(W - 330, BH / 2 + 14);
      const tg = new Graphics();
      for (let k = 0; k < 4; k++) tg.rect(-64, -84 + k * 42, 128, 38).fill(0x9a6334).stroke({ width: 4, color: C.ink });
      target.addChild(tg);
      band.addChild(target);
      const word = dim.sound[Math.floor(Math.random() * dim.sound.length)];
      const label = txt(`★4 · ${(o.shotName ?? 'ATAQUE').toUpperCase()} — VERSIÓN NUEVA`, { fontFamily: dim.font, fontSize: 40, fill: dim.ink, stroke: { color: C.ink, width: 6, join: 'round' } });
      label.position.set(330, 14);
      if (label.width > W - 800) label.scale.set((W - 800) / label.width);
      band.addChild(label);
      gsap.from(label, { alpha: 0, x: 420, duration: 0.2, delay: 0.1 });
      // projectile
      const proj = projectileArt(o.element ?? 'fire', 30, true);
      proj.position.set(330, BH / 2);
      proj.visible = false;
      band.addChild(proj);
      const p = { t: 0 };
      const x0 = 300;
      const x1 = W - 330;
      gsap.delayedCall(0.3, () => {
        if (proj.destroyed) return;
        proj.visible = true;
        sfx('shoot');
        if (o.shotCry) onomatopoeia(band, 640, BH - 46, o.shotCry.toUpperCase(), { size: 44, color: dim.hi, font: dim.font, dur: 1 });
        let acc = 0;
        const trail = (tk: Ticker) => {
          if (proj.destroyed || !proj.visible) return;
          acc += tk.deltaMS;
          if (acc < 22) return;
          acc = 0;
          const b = trailBit(o.element ?? 'fire', true);
          b.position.copyFrom(proj.position);
          band.addChildAt(b, band.children.indexOf(proj));
          gsap.to(b, { alpha: 0, y: b.y + (Math.random() - 0.5) * 30, duration: 0.4, onComplete: () => b.destroy() });
        };
        addTicker(trail);
        gsap.to(p, {
          t: 1,
          duration: 0.55,
          ease: 'power1.in',
          onUpdate: () => {
            if (proj.destroyed) return;
            proj.x = x0 + (x1 - x0) * p.t;
            proj.y = BH / 2 + 10 - Math.sin(p.t * Math.PI) * 70;
            proj.rotation = Math.cos(p.t * Math.PI) * -0.5;
          },
          onComplete: () => {
            if (proj.destroyed) return;
            proj.visible = false;
            sfx('bigboom');
            if (!reduce) time.hitstop(70);
            shaker.add(0.45);
            // planks fly
            tg.visible = false;
            for (let k = 0; k < 8; k++) {
              const pc = new Graphics().rect(-30, -10, 60, 20).fill(0x9a6334).stroke({ width: 3, color: C.ink });
              pc.position.set(target.x, target.y - 40 + k * 10);
              band.addChild(pc);
              const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
              gsap.to(pc, { x: pc.x + Math.cos(a) * 260, y: pc.y + Math.sin(a) * 200 + 160, rotation: 4 + Math.random() * 4, alpha: 0, duration: 0.8, ease: 'power2.out', onComplete: () => pc.destroy() });
            }
            const ring = new Graphics().circle(0, 0, 60).stroke({ width: 14, color: dim.hi });
            ring.position.copyFrom(target.position);
            band.addChild(ring);
            gsap.to(ring.scale, { x: 3.2, y: 3.2, duration: 0.4, ease: 'power2.out' });
            gsap.to(ring, { alpha: 0, duration: 0.4, onComplete: () => ring.destroy() });
            sparkles(band, target.x, target.y, dim.hi, 18, 200);
            onomatopoeia(band, target.x - 40, target.y - 40, word, { size: 120, color: dim.accent, font: dim.font, dur: 1.2 });
            // stamp
            const b = tagBanner('¡SU ATAQUE CAMBIÓ!', C.yellow, C.ink, 64);
            b.pivot.set(b.width / 2 - 20, b.height / 2 - 6);
            b.position.set(W / 2 + 40, by + BH / 2 + 16);
            b.rotation = -0.04;
            root.addChild(b);
            gsap.fromTo(b.scale, { x: 1.8, y: 1.8 }, { x: 1, y: 1, duration: 0.16, ease: 'back.out(3)' });
          },
        });
      });
    }

    // ================================================================ ★5 / ★6 takeover
    function masteryTakeover() {
      if (root.destroyed) return;
      const ascended = star >= 6;
      sfx('glitch');
      sfx('fanfare');
      const take = new Container();
      root.addChild(take);
      // shatter: the editorial stage breaks into shards that fly away
      const shards = new Container();
      root.addChild(shards);
      const pts: [number, number][] = [];
      for (let i = 0; i < 18; i++) pts.push([Math.random() * W, Math.random() * H]);
      for (let i = 0; i < 26; i++) {
        const a = pts[Math.floor(Math.random() * pts.length)];
        const b = [a[0] + (Math.random() - 0.5) * 520, a[1] + (Math.random() - 0.5) * 420];
        const c = [a[0] + (Math.random() - 0.5) * 520, a[1] + (Math.random() - 0.5) * 420];
        const g = new Graphics().poly([a[0], a[1], b[0], b[1], c[0], c[1]]).fill(i % 3 === 0 ? C.paper : i % 3 === 1 ? C.red : C.ink).stroke({ width: 3, color: 0xffffff, alpha: 0.9 });
        shards.addChild(g);
        const cxs = (a[0] + b[0] + c[0]) / 3;
        const cys = (a[1] + b[1] + c[1]) / 3;
        g.pivot.set(cxs, cys);
        g.position.set(cxs, cys);
        gsap.to(g, { x: cxs + (cxs - W / 2) * 1.4, y: cys + (cys - H / 2) * 1.4 + 300, rotation: (Math.random() - 0.5) * 6, alpha: 0, duration: 0.7, ease: 'power2.in', onComplete: () => g.destroy() });
      }
      stage.visible = false;
      shaker.add(0.6);
      if (!reduce) time.hitstop(90);

      // the dimension
      const bg = dimensionBackground(dim, W, H, 77 + star);
      take.addChild(bg);
      if (ascended) {
        const inv = new ColorMatrixFilter();
        inv.negative(false);
        bg.filters = [inv];
      }
      // layout: painting left, poster column right
      const AX = 560;
      const AY = 650;
      const RX = 1060;
      const RW = 800;
      // rotating rays
      const rays = new Graphics();
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        rays.poly([0, 0, Math.cos(a - 0.06) * 1700, Math.sin(a - 0.06) * 1700, Math.cos(a + 0.06) * 1700, Math.sin(a + 0.06) * 1700]).fill({ color: dim.hi, alpha: i % 2 ? 0.1 : 0.22 });
      }
      rays.position.set(AX, AY);
      take.addChild(rays);
      gsap.to(rays, { rotation: 0.9, duration: 6, ease: 'none' });
      // giant word (background of the right column)
      const word = txt(dim.word, { fontFamily: F.heavy, fontSize: 400, fill: dim.accent, stroke: { color: C.ink, width: 14, join: 'round' } });
      word.anchor.set(0.5);
      word.position.set(W - 230, H / 2 + 40);
      word.alpha = 0.32;
      take.addChild(word);
      gsap.from(word, { y: H / 2 + 340, alpha: 0, duration: 0.5, ease: 'power3.out', delay: 0.1 });
      // mastery title
      const mt = txt(ascended ? 'FORMA ASCENDIDA' : 'MAESTRÍA', { fontFamily: F.poster, fontSize: 200, fill: dim.ink, letterSpacing: -4, stroke: { color: C.ink, width: 12, join: 'round' } });
      mt.position.set(60, 18);
      if (mt.width > 940) mt.scale.set(940 / mt.width);
      take.addChild(mt);
      gsap.from(mt, { x: -500, duration: 0.35, ease: 'power4.out', delay: 0.05 });
      const dn = txt(`★${star} · DIMENSIÓN ${dim.name}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: dim.hi, letterSpacing: 6, stroke: { color: C.ink, width: 5 } });
      dn.position.set(68, 18 + mt.height + 2);
      take.addChild(dn);
      // the painting, huge
      const glow2 = new Sprite(glowTexture());
      glow2.anchor.set(0.5);
      glow2.tint = ascended ? 0xffffff : dim.hi;
      glow2.scale.set(10);
      glow2.alpha = 0.55;
      glow2.blendMode = 'add';
      glow2.position.set(AX, AY);
      take.addChild(glow2);
      if (ascended) {
        const halo = new Graphics().ellipse(0, 0, 220, 50).stroke({ width: 14, color: 0xfff4c8 }).ellipse(0, 0, 220, 50).stroke({ width: 4, color: C.ink, alpha: 0.5 });
        halo.position.set(AX, AY - 330);
        take.addChild(halo);
        gsap.to(halo, { y: halo.y - 14, yoyo: true, repeat: -1, duration: 0.9, ease: 'sine.inOut' });
      }
      const art = variantSprite(o.species, 760, { mutation: o.mutation }).root;
      art.position.set(AX, AY);
      take.addChild(art);
      const s0 = art.scale.x;
      gsap.fromTo(art, { x: AX - 500, y: H + 300 }, { x: AX, y: AY, duration: 0.42, ease: 'power3.out', delay: 0.15 });
      gsap.fromTo(art.scale, { x: s0 * 0.7, y: s0 * 1.3 }, { x: s0, y: s0, duration: 0.6, ease: 'elastic.out(1,0.45)', delay: 0.5 });
      if (!reduce) gsap.delayedCall(0.2, () => !take.destroyed && speedLines(take, AX, AY, dim.hi, 60, 0.6));
      // stars slam in, one by one (right column, top)
      const starC = new Container();
      starC.position.set(RX + 50, 120);
      take.addChild(starC);
      for (let i = 0; i < star; i++) {
        gsap.delayedCall(0.75 + i * 0.13, () => {
          if (starC.destroyed) return;
          const sx = i * 112;
          const sg = new Graphics().star(sx, 0, 5, 48, 20).fill(C.yellow).stroke({ width: 7, color: C.ink });
          starC.addChild(sg);
          sg.pivot.set(sx, 0);
          sg.position.set(sx, 0);
          sg.rotation = (Math.random() - 0.5) * 0.3;
          gsap.fromTo(sg.scale, { x: 3, y: 3 }, { x: 1, y: 1, duration: 0.12, ease: 'power3.in' });
          sfx('coin', PENTA[i + 2]);
          shaker.add(0.12);
          sparkles(take, RX + 50 + sx, 120, C.yellow, 6, 80);
        });
      }
      // name + passive card + stats (right column)
      gsap.delayedCall(1.55, () => {
        if (take.destroyed) return;
        sfx('boom', 0.9);
        shaker.add(0.3);
        const nm = txt(o.name.toUpperCase(), { fontFamily: F.poster, fontSize: 130, fill: C.paper, stroke: { color: C.ink, width: 12, join: 'round' } });
        nm.position.set(RX, 180);
        if (nm.width > RW) nm.scale.set(RW / nm.width);
        take.addChild(nm);
        gsap.from(nm, { x: RX + 120, alpha: 0, duration: 0.2, ease: 'power3.out' });
        const pc = flipCard(o.unlockTitle, o.unlockText, star, RW, 200, 26);
        pc.position.set(RX + RW / 2, 450);
        take.addChild(pc);
        const sb = new Container();
        sb.position.set(RX, 580);
        const lines = o.perkLines ?? [];
        const boxH = 120 + lines.length * 46;
        sb.addChild(new Graphics().rect(8, 8, RW, boxH).fill(C.ink).rect(0, 0, RW, boxH).fill({ color: C.ink, alpha: 0.9 }).stroke({ width: 4, color: dim.hi }));
        o.stats.forEach((st, i) => {
          const d = st.digits ?? 1;
          const k = txt(st.label, { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: dim.hi, letterSpacing: 3 });
          k.position.set(24 + i * 400, 14);
          const v = txt(`${st.from.toFixed(d)} → ${st.to.toFixed(d)}`, { fontFamily: F.poster, fontSize: 50, fill: C.paper });
          v.position.set(24 + i * 400, 36);
          if (v.width > 370) v.scale.set(370 / v.width);
          sb.addChild(k, v);
        });
        lines.forEach((l, i) => {
          const tt = txt(l, { fontFamily: F.ui, fontWeight: '700', fontSize: 20, fill: C.ink });
          if (tt.width > RW - 70) tt.scale.set((RW - 70) / tt.width);
          const bgc = new Graphics().rect(-10, -4, tt.width + 20, tt.height + 8).fill(i === lines.length - 1 ? C.yellow : i % 2 ? C.mint : C.paper).stroke({ width: 3, color: C.ink });
          const row = new Container();
          row.addChild(bgc, tt);
          row.position.set(34, 116 + i * 46);
          row.rotation = (i % 2 ? 1 : -1) * 0.008;
          sb.addChild(row);
          gsap.from(row, { x: 110, alpha: 0, duration: 0.2, delay: 0.25 + i * 0.1 });
        });
        take.addChild(sb);
        gsap.from(sb, { alpha: 0, y: 620, duration: 0.25 });
      });
    }
  });
}

// ---------------------------------------------------------------- pieces
/** flip card: front = stars, back = the unlocked effect (centered at 0,0) */
function flipCard(title: string, text: string, star: number, cw: number, ch: number, size = 20) {
  const ec = new Container();
  const front = new Graphics().rect(-cw / 2 + 6, -ch / 2 + 6, cw, ch).fill(C.pinkHot).rect(-cw / 2, -ch / 2, cw, ch).fill(C.paper).stroke({ width: 4, color: C.ink });
  const ft = poster('★'.repeat(star), 64, C.ink);
  ft.anchor.set(0.5);
  const faceA = new Container();
  faceA.addChild(front, ft);
  const backG = new Graphics().rect(-cw / 2 + 6, -ch / 2 + 6, cw, ch).fill(C.ink).rect(-cw / 2, -ch / 2, cw, ch).fill(star >= 5 ? 0xffd77a : C.yellow).stroke({ width: 4, color: C.ink });
  const bt = poster(title.toUpperCase(), 32, C.ink);
  bt.position.set(-cw / 2 + 18, -ch / 2 + 6);
  if (bt.width > cw - 36) bt.scale.set((cw - 36) / bt.width);
  const fs = text.length < 40 ? Math.round(size * 1.5) : text.length < 80 ? Math.round(size * 1.2) : size;
  const bx = txt(text, { fontFamily: F.ui, fontWeight: '700', fontSize: fs, fill: C.ink, wordWrap: true, wordWrapWidth: cw - 36, lineHeight: fs * 1.25 });
  bx.position.set(-cw / 2 + 18, -ch / 2 + 54);
  if (bx.height > ch - 64) bx.scale.set((ch - 64) / bx.height);
  const faceB = new Container();
  faceB.addChild(backG, bt, bx);
  faceB.visible = false;
  ec.addChild(faceA, faceB);
  ec.rotation = -0.02;
  gsap.from(ec, { alpha: 0, duration: 0.2 });
  gsap
    .timeline({ delay: 0.45 })
    .to(ec.scale, {
      x: 0,
      duration: 0.14,
      ease: 'power2.in',
      onComplete: () => {
        if (faceA.destroyed) return;
        faceA.visible = false;
        faceB.visible = true;
        sfx('paper');
      },
    })
    .to(ec.scale, { x: 1, duration: 0.18, ease: 'back.out(2)' });
  return ec;
}

function tagBanner(text: string, bg: number, fg: number, size = 44): Container {
  const b = new Container();
  const t1: Text = poster(text, size, fg);
  const g = new Graphics().rect(-20, -6, t1.width + 40, t1.height + 12).fill(bg).stroke({ width: 5, color: C.ink });
  b.addChild(g, t1);
  return b;
}

/** element-colored burst behind the card (★3+) */
function elementBurst(layer: Container, x: number, y: number, dim: Dimension, star: number, at: number) {
  const g = new Graphics();
  const n = 14 + star * 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r1 = 220;
    const r2 = 420 + (i % 2) * 120;
    g.poly([x + Math.cos(a - 0.05) * r1, y + Math.sin(a - 0.05) * r1, x + Math.cos(a) * r2, y + Math.sin(a) * r2, x + Math.cos(a + 0.05) * r1, y + Math.sin(a + 0.05) * r1]).fill(i % 2 ? dim.accent : dim.hi);
  }
  layer.addChildAt(g, Math.max(0, at));
  g.alpha = 0.9;
  gsap.from(g.scale, { x: 0.4, y: 0.4, duration: 0.25, ease: 'back.out(2)' });
  g.pivot.set(x, y);
  g.position.set(x, y);
  gsap.to(g, { rotation: 0.4, duration: 2.4, ease: 'power1.out' });
  gsap.to(g, { alpha: 0.35, duration: 1.2, delay: 0.3 });
  sparkles(layer, x, y, dim.hi, 18, 300);
}
