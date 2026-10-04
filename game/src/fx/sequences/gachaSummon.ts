/**
 * Gacha summon (casino agent) — T2/T3 by best rarity:
 *  1. ink portal opens (rune ring, halftone core, CMYK ghosts) · "INVOCANDO…" glitch
 *  2. a beam in the colour of the BEST tier shoots up (honest telegraph: the pull is already decided)
 *  3. cards fly out face-down (1 big or 2×5), flip one by one (tap = flip now, "REVELAR TODO")
 *  4. epic+: stamp + sparkles · legendary: gold rays + shake · holo: rainbow beam + glitch slices + RGB split
 * Resolves when the player presses CONTINUAR. Cat reveals (storyboard a) are played by the caller afterwards.
 */
import { Container, Graphics, Rectangle, Text, TilingSprite } from 'pixi.js';
import { RGBSplitFilter } from 'pixi-filters';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { halftoneTexture } from '../../art/textures';
import { settings } from '../../core/settings';
import { Shaker, flash, onomatopoeia, sparkles, speedLines } from '../juice';
import { Particles } from '../particles';
import type { Pull, Banner, Tier } from '../../state/sys/gacha';
import { TIER_ORDER } from '../../state/sys/gacha';
import { prizeCard, TIER_COL } from '../../panels/casino/prizes';
import { CP } from '../../panels/casino/kit';
import { csfx } from '../../panels/casino/sfx';
import { holoSheen } from './gachaHolo';

const PX = W / 2;
const PY = 470;

function cardBack(w: number, h: number, accent: number, tier: Tier): Container {
  const c = new Container();
  const g = new Graphics();
  g.rect(8, 8, w, h).fill(CP.ink);
  g.rect(0, 0, w, h).fill(0x1a0f1f).stroke({ width: 4, color: CP.ink, alignment: 1 });
  g.rect(10, 10, w - 20, h - 20).stroke({ width: 3, color: accent });
  const ht = new TilingSprite({ texture: halftoneTexture(accent, 12, 2.4), width: w - 28, height: h - 28 });
  ht.position.set(14, 14);
  ht.alpha = 0.25;
  c.addChild(g, ht);
  // Chat Noir emblem
  const e = new Graphics();
  const r = Math.min(w, h) * 0.22;
  e.circle(0, 0, r * 1.25).fill(CP.yellow).stroke({ width: 4, color: CP.ink });
  e.poly([-r * 0.8, -r * 0.05, -r * 0.85, -r * 1.0, -r * 0.25, -r * 0.55]).fill(CP.ink);
  e.poly([r * 0.8, -r * 0.05, r * 0.85, -r * 1.0, r * 0.25, -r * 0.55]).fill(CP.ink);
  e.ellipse(0, 0, r * 0.85, r * 0.68).fill(CP.ink);
  e.ellipse(-r * 0.32, -r * 0.05, r * 0.16, r * 0.12).fill(CP.yellow).ellipse(r * 0.32, -r * 0.05, r * 0.16, r * 0.12).fill(CP.yellow);
  e.position.set(w / 2, h / 2 - 10);
  c.addChild(e);
  const t = txt('NO ONE LIKE CATS', { fontFamily: F.poster, fontSize: Math.max(14, w * 0.085), fill: CP.paper, letterSpacing: 2 });
  t.anchor.set(0.5);
  t.position.set(w / 2, h - 30);
  c.addChild(t);
  // rarity edge glow (rare+): the outcome is already decided; this only builds the moment
  const rank = TIER_ORDER.indexOf(tier);
  if (rank >= 1) {
    const glow = new Graphics();
    for (let i = 0; i < 3; i++) glow.rect(-6 - i * 5, -6 - i * 5, w + 12 + i * 10, h + 12 + i * 10).stroke({ width: 4, color: TIER_COL[tier], alpha: 0.5 - i * 0.14 });
    c.addChildAt(glow, 0);
    gsap.to(glow, { alpha: 0.35, duration: 0.35, yoyo: true, repeat: -1 });
  }
  return c;
}

export function playSummon(layer: Container, pulls: Pull[], b: Banner, onEvent?: (ev: 'epic' | 'legend' | 'holo' | 'meh') => void): Promise<void> {
  return new Promise((resolve) => {
    const root = new Container();
    layer.addChild(root);
    const shaker = new Shaker(root, 26, 0.02);
    const particles = new Particles();
    const best = pulls.reduce((m, p) => Math.max(m, TIER_ORDER.indexOf(p.tier)), 0);
    const bestTier = TIER_ORDER[best];
    const beamCol = TIER_COL[bestTier];
    const reduce = settings.reduceMotion;
    // --- dim + halftone
    const dim = new Graphics().rect(0, 0, W, H).fill(CP.night);
    dim.alpha = 0;
    const dots = new TilingSprite({ texture: halftoneTexture(b.accent, 18, 2.6), width: W, height: H });
    dots.alpha = 0;
    root.addChild(dim, dots);
    root.eventMode = 'static';
    root.hitArea = new Rectangle(0, 0, W, H);
    gsap.to(dim, { alpha: 0.94, duration: 0.25 });
    gsap.to(dots, { alpha: 0.08, duration: 0.4 });
    // --- portal
    const portal = new Container();
    portal.position.set(PX, PY);
    const ringA = new Graphics();
    const ringB = new Graphics();
    const core = new Graphics();
    const jag = (g: Graphics, r: number, col: number, wdt: number) => {
      const pts: number[] = [];
      const n = 48;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const rr = r + (i % 2 ? wdt : -wdt * 0.3) + Math.sin(i * 7.3) * 6;
        pts.push(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      g.poly(pts).fill(col);
    };
    jag(ringA, 250, CP.ink, 26);
    ringA.circle(0, 0, 232).fill(b.accent);
    ringA.circle(0, 0, 210).fill(CP.ink);
    core.circle(0, 0, 205).fill(0x0a050c);
    const coreDots = new TilingSprite({ texture: halftoneTexture(b.accent2, 14, 3), width: 420, height: 420 });
    coreDots.anchor.set(0.5);
    coreDots.alpha = 0.35;
    const coreMask = new Graphics().circle(0, 0, 205).fill(0xffffff);
    coreDots.mask = coreMask;
    ringB.circle(8, -5, 240).stroke({ width: 6, color: CP.cyan, alpha: 0.7 });
    ringB.circle(-8, 5, 240).stroke({ width: 6, color: CP.pink, alpha: 0.7 });
    const runes = new Container();
    const word = ' NO ONE LIKE CATS · MULTIVERSO · EL GATO NEGRO ·';
    [...word].forEach((ch, i) => {
      const a = (i / word.length) * Math.PI * 2;
      const t = txt(ch, { fontFamily: F.poster, fontSize: 22, fill: CP.paper });
      t.anchor.set(0.5);
      t.position.set(Math.cos(a) * 221, Math.sin(a) * 221);
      t.rotation = a + Math.PI / 2;
      runes.addChild(t);
    });
    // swirl arcs + dashed segment ring inside the core
    const swirl = new Graphics();
    for (let i = 0; i < 3; i++) {
      const r = 60 + i * 45;
      swirl.arc(0, 0, r, i * 2, i * 2 + 2.2).stroke({ width: 10 - i * 2, color: [b.accent, b.accent2, CP.paper][i], cap: 'round', alpha: 0.85 });
      swirl.arc(0, 0, r, i * 2 + Math.PI, i * 2 + Math.PI + 1.6).stroke({ width: 8 - i * 2, color: [b.accent2, CP.paper, b.accent][i], cap: 'round', alpha: 0.6 });
    }
    const dashes = new Graphics();
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      dashes.moveTo(Math.cos(a) * 262, Math.sin(a) * 262).lineTo(Math.cos(a + 0.09) * 262, Math.sin(a + 0.09) * 262).stroke({ width: 8, color: i % 3 === 0 ? CP.yellow : b.accent2, cap: 'round' });
    }
    // radial burst behind
    const burst = new Graphics();
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const a2 = a + Math.PI / 20;
      burst.poly([0, 0, Math.cos(a) * 1300, Math.sin(a) * 1300, Math.cos(a2) * 1300, Math.sin(a2) * 1300]).fill({ color: b.accent, alpha: 0.1 });
    }
    burst.position.set(PX, PY);
    root.addChild(burst);
    gsap.to(burst, { rotation: Math.PI, duration: 20, ease: 'none' });
    portal.addChild(ringB, dashes, ringA, core, coreMask, coreDots, swirl, runes);
    portal.scale.set(0);
    root.addChild(portal);
    gsap.to(swirl, { rotation: Math.PI * 6, duration: 4, ease: 'power1.in' });
    gsap.to(dashes, { rotation: Math.PI * 2, duration: 6, ease: 'none', repeat: -1 });
    // energy motes sucked into the portal
    for (let i = 0; i < (reduce ? 10 : 46); i++) {
      const m = new Graphics().circle(0, 0, 3 + Math.random() * 5).fill([b.accent, b.accent2, CP.paper][i % 3]);
      const a = Math.random() * Math.PI * 2;
      const r = 420 + Math.random() * 520;
      m.position.set(PX + Math.cos(a) * r, PY + Math.sin(a) * r);
      root.addChild(m);
      gsap.to(m, { x: PX, y: PY, duration: 0.6 + Math.random() * 0.6, delay: Math.random() * 0.5, ease: 'power3.in', onComplete: () => m.destroy() });
    }
    const title = txt('INVOCANDO…', { fontFamily: F.glitch, fontSize: 64, fill: CP.paper });
    title.anchor.set(0.5);
    title.position.set(PX, PY + 320);
    title.alpha = 0;
    root.addChild(title, particles);
    csfx.portal();
    gsap.to(portal.scale, { x: 1, y: 1, duration: 0.7, ease: 'back.out(1.5)' });
    gsap.to(runes, { rotation: Math.PI * 2, duration: 9, ease: 'none', repeat: -1 });
    gsap.to(ringA, { rotation: -Math.PI * 2, duration: 14, ease: 'none', repeat: -1 });
    gsap.to(title, { alpha: 1, duration: 0.2, delay: 0.3 });
    let fr = 0;
    const iv = window.setInterval(() => {
      fr++;
      coreDots.tilePosition.y += 3;
      title.x = PX + (fr % 5 === 0 ? (Math.random() - 0.5) * 18 : 0);
      ringB.rotation = fr % 2 ? 0.02 : -0.02;
    }, 1000 / 12);
    // skip-able
    let phase = 0;
    let skip = () => {};
    root.on('pointertap', () => skip());

    const cards: { c: Container; back: Container; face: Container | null; p: Pull; shown: boolean; w: number; h: number }[] = [];
    const n = pulls.length;
    const big = n === 1;
    const cw = big ? 380 : 196;
    const ch = big ? 520 : 270;
    const gapX = 26;
    const gapY = 30;
    const cols = big ? 1 : 5;
    const rows = Math.ceil(n / cols);
    const gx0 = PX - (cols * cw + (cols - 1) * gapX) / 2;
    const gy0 = big ? 150 : 150;

    const beam = () => {
      phase = 1;
      csfx.beam(best);
      const bm = new Graphics();
      const bw = 120 + best * 40;
      for (let i = 0; i < 5; i++) bm.rect(-bw / 2 + i * (bw / 10), -H, bw - i * (bw / 5), H).fill({ color: i === 4 ? 0xffffff : beamCol, alpha: 0.25 + i * 0.12 });
      bm.position.set(PX, PY);
      bm.scale.x = 0;
      root.addChildAt(bm, 2);
      gsap.to(bm.scale, { x: 1, duration: 0.18, ease: 'power3.out' });
      gsap.to(bm, { alpha: 0, duration: 0.6, delay: 0.7, onComplete: () => bm.destroy() });
      flash(root, beamCol, best >= 3 ? 0.85 : 0.5, 0.35);
      shaker.add(0.25 + best * 0.12);
      if (best >= 3 && !reduce) speedLines(root, PX, PY, CP.ink, 60, 0.6);
      if (bestTier === 'holo') {
        // glitch slices + RGB split
        const slices = new Container();
        for (let i = 0; i < 9; i++) {
          const s = new Graphics().rect(0, 0, W, 20 + Math.random() * 60).fill({ color: [CP.pink, CP.cyan, CP.yellow][i % 3], alpha: 0.35 });
          s.y = Math.random() * H;
          s.x = (Math.random() - 0.5) * 200;
          slices.addChild(s);
        }
        root.addChild(slices);
        gsap.to(slices, { alpha: 0, duration: 0.5, delay: 0.35, onComplete: () => slices.destroy({ children: true }) });
        if (!settings.reduceFlashes) {
          const rgb = new RGBSplitFilter({ red: { x: -18, y: 0 }, green: { x: 0, y: 10 }, blue: { x: 18, y: -8 } });
          root.filters = [rgb];
          window.setTimeout(() => {
            if (!root.destroyed) root.filters = [];
          }, 600);
        }
        onomatopoeia(root, PX + 330, PY - 220, '¡¿QUÉEE?!', { size: 120, color: CP.cyan });
      } else if (best >= 3) onomatopoeia(root, PX + 330, PY - 220, '¡DORADO!', { size: 110, color: CP.yellow });
      particles.burst(PX, PY, { count: 30 + best * 15, tint: [beamCol, 0xffffff], speed: [300, 900], life: [0.5, 1.2], gravity: 300, scale: [0.3, 0.9] });
      window.setTimeout(dealCards, 650);
    };

    const dealCards = () => {
      if (phase >= 2) return;
      phase = 2;
      gsap.to(title, { alpha: 0, duration: 0.2 });
      gsap.to(portal, { alpha: 0.25, duration: 0.5 });
      gsap.to(portal.scale, { x: 1.6, y: 1.6, duration: 0.6, ease: 'power2.out' });
      pulls.forEach((p, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const c = new Container();
        const back = cardBack(cw, ch, b.accent, p.tier);
        c.addChild(back);
        c.pivot.set(cw / 2, ch / 2);
        c.position.set(PX, PY);
        c.scale.set(0.05);
        c.rotation = (Math.random() - 0.5) * 2;
        root.addChild(c);
        const tx = gx0 + col * (cw + gapX) + cw / 2;
        const ty = gy0 + row * (ch + gapY) + ch / 2 + (rows === 1 && !big ? 150 : 0);
        gsap.to(c, { x: tx, y: ty, rotation: (Math.random() - 0.5) * 0.06, duration: 0.42, delay: i * 0.07, ease: 'back.out(1.4)', onStart: () => csfx.cardFly() });
        gsap.to(c.scale, { x: 1, y: 1, duration: 0.42, delay: i * 0.07, ease: 'back.out(1.6)' });
        const entry = { c, back, face: null as Container | null, p, shown: false, w: cw, h: ch };
        cards.push(entry);
        c.eventMode = 'static';
        c.cursor = 'pointer';
        c.on('pointertap', (e) => {
          e.stopPropagation();
          flip(entry);
        });
      });
      window.setTimeout(autoFlip, 420 + n * 70);
    };

    let flipping = false;
    const flip = (e: (typeof cards)[number], fast = false): Promise<void> => {
      if (e.shown) return Promise.resolve();
      e.shown = true;
      const rank = TIER_ORDER.indexOf(e.p.tier);
      return new Promise((res) => {
        gsap.to(e.c.scale, {
          x: 0,
          duration: fast ? 0.07 : 0.12,
          ease: 'power2.in',
          onComplete: () => {
            if (e.c.destroyed) return res();
            e.back.visible = false;
            gsap.killTweensOf(e.back.children[0] ?? e.back);
            const face = prizeCard(e.p.got, e.w, e.h);
            e.c.addChild(face);
            e.face = face;
            csfx.flip(Math.min(4, rank));
            gsap.to(e.c.scale, { x: 1, duration: fast ? 0.1 : 0.22, ease: 'back.out(2.5)' });
            const x = e.c.x;
            const y = e.c.y;
            sparkles(root, x, y, TIER_COL[e.p.tier], 6 + rank * 4, 90 + rank * 30);
            if (rank >= 2) {
              const word = e.p.tier === 'holo' ? '¡HOLO!' : e.p.tier === 'legendary' ? '¡LEGENDARIO!' : '¡ÉPICO!';
              onomatopoeia(root, x, y - e.h / 2 - 10, word, { size: big ? 90 : 56, color: TIER_COL[e.p.tier] });
              shaker.add(0.12 * rank);
            }
            if (rank >= 3) {
              const rays = new Graphics();
              for (let i = 0; i < 16; i++) {
                const a = (i / 16) * Math.PI * 2;
                const a2 = a + Math.PI / 16;
                rays.poly([0, 0, Math.cos(a) * 420, Math.sin(a) * 420, Math.cos(a2) * 420, Math.sin(a2) * 420]).fill({ color: TIER_COL[e.p.tier], alpha: 0.28 });
              }
              rays.position.set(x, y);
              root.addChildAt(rays, root.getChildIndex(e.c));
              gsap.from(rays.scale, { x: 0, y: 0, duration: 0.35, ease: 'back.out(2)' });
              gsap.to(rays, { rotation: 1.2, duration: 6, ease: 'none' });
              if (e.p.tier === 'holo') {
                const s = holoSheen(e.w + 30, e.h + 30, 1);
                s.position.set(x - e.w / 2 - 15, y - e.h / 2 - 15);
                s.alpha = 0.6;
                root.addChildAt(s, root.getChildIndex(e.c));
              }
            }
            window.setTimeout(res, fast ? 40 : rank >= 3 ? 650 : rank >= 2 ? 300 : 110);
          },
        });
      });
    };

    const autoFlip = async () => {
      if (flipping) return;
      flipping = true;
      phase = 3;
      for (const e of cards) {
        if (root.destroyed) return;
        if (!e.shown) await flip(e, fastAll);
        await wait(fastAll ? 20 : big ? 0 : 90);
      }
      done();
    };
    let fastAll = false;

    const doneBtn = new Container();
    const done = () => {
      if (phase >= 4 || root.destroyed) return;
      phase = 4;
      const ranks = pulls.map((p) => TIER_ORDER.indexOf(p.tier));
      const mx = Math.max(...ranks);
      onEvent?.(pulls.some((p) => p.tier === 'holo') ? 'holo' : mx >= 3 ? 'legend' : mx >= 2 ? 'epic' : 'meh');
      const t = txt('CONTINUAR', { fontFamily: F.poster, fontSize: 40, fill: CP.ink });
      const bg = new Graphics().rect(8, 8, t.width + 60, 70).fill(CP.ink).rect(0, 0, t.width + 60, 70).fill(CP.yellow).stroke({ width: 4, color: CP.ink });
      t.position.set(30, 9);
      doneBtn.addChild(bg, t);
      doneBtn.position.set(PX - (t.width + 60) / 2, H - 120);
      doneBtn.eventMode = 'static';
      doneBtn.cursor = 'pointer';
      doneBtn.on('pointertap', (e) => {
        e.stopPropagation();
        close();
      });
      root.addChild(doneBtn);
      gsap.from(doneBtn, { y: H, duration: 0.3, ease: 'back.out(2)' });
    };

    skip = () => {
      if (phase === 0) {
        gsap.killTweensOf(portal.scale);
        portal.scale.set(1);
        beam();
      } else if (phase === 2 || phase === 3) {
        fastAll = true;
        if (!flipping) autoFlip();
      } else if (phase === 4) close();
    };

    const close = () => {
      if (phase === 5) return;
      phase = 5;
      window.clearInterval(iv);
      gsap.to(root, {
        alpha: 0,
        duration: 0.25,
        onComplete: () => {
          shaker.destroy();
          gsap.killTweensOf(runes);
          gsap.killTweensOf(ringA);
          gsap.killTweensOf(dashes);
          gsap.killTweensOf(burst);
          root.destroy({ children: true });
          resolve();
        },
      });
    };

    window.setTimeout(() => {
      if (phase === 0) beam();
    }, 1250);
  });
}

function wait(ms: number) {
  return new Promise<void>((r) => window.setTimeout(r, ms));
}
export type { Text };
