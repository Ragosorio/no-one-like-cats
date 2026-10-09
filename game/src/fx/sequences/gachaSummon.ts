/**
 * Gacha summon (casino agent) — the portal IS the presentation:
 *  1. ink portal opens (rune ring, halftone core, CMYK ghosts) · "INVOCANDO…"
 *  2. RARITY TRANSFORMATION of the machine, by the best result (honest telegraph: the pull is already decided):
 *       épico      → pink surge, runes go hot pink, a short shake
 *       legendario → GOLD MACHINE: rings re-ink in gold, white-gold core, crown rays, cracks, heavy shake, fanfare
 *       holo       → gold machine + rainbow foil slices + RGB split
 *       mítico     → CRIMSON SINGULARITY: black core full of stars, red rings, glitch slices, the screen inverts
 *     "¡SE ESCAPÓ!": a legendary silhouette climbs out of the portal and runs away (it leaves a RASTRO).
 *  3. every cat worth it (épico+ or new) gets the full Pokémon-style cat reveal STRAIGHT out of the portal —
 *     no card flip first. Each one gets a beam in its own tier colour before its reveal.
 *  4. the haul: all cards dealt FACE UP (nothing to flip), then CONTINUAR (auto-play closes it by itself).
 * Speeds (auto-play): x1 full · x2 compressed · x10 / ETERNO never call this (GachaView shows the results strip).
 */
import { Container, Graphics, Rectangle, Text, TilingSprite } from 'pixi.js';
import { RGBSplitFilter } from 'pixi-filters';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { halftoneTexture } from '../../art/textures';
import { settings } from '../../core/settings';
import { sfx } from '../../core/audio';
import { Shaker, flash, onomatopoeia, sparkles, speedLines } from '../juice';
import { Particles } from '../particles';
import type { Pull, Banner, Tier } from '../../state/sys/gacha';
import { TIER_ORDER } from '../../state/sys/gacha';
import { catDef } from '../../data/content';
import { catArt, catRank, prizeCard, RevealPlan, revealCats, TIER_COL } from '../../panels/casino/prizes';
import { CP, killDeep } from '../../panels/casino/kit';
import { csfx } from '../../panels/casino/sfx';
import { holoSheen } from './gachaHolo';
import { screenRect } from '../../ui/screen';

const PX = W / 2;
const PY = 470;
const GOLD = 0xffc94a;
const MYTHIC = 0xff3b1f;

export interface SummonOpts {
  /** 1 = manual / x1 · 2 · 4 */
  speed?: number;
  /** auto-play: never wait for CONTINUAR */
  auto?: boolean;
  /** which cats get the full reveal (default: épico+ or new) */
  reveal?: RevealPlan;
  onEvent?: (ev: 'epic' | 'legend' | 'holo' | 'mythic' | 'meh' | 'escape' | 'first') => void;
}

const rank = (t: Tier) => TIER_ORDER.indexOf(t);

export function playSummon(layer: Container, pulls: Pull[], b: Banner, o: SummonOpts = {}): Promise<void> {
  const speed = Math.max(1, o.speed ?? 1);
  const k = 1 / speed;
  return new Promise((resolve) => {
    const root = new Container();
    layer.addChild(root);
    const shaker = new Shaker(root, 26, 0.02);
    const particles = new Particles();
    const best = pulls.reduce((m, p) => Math.max(m, rank(p.tier)), 0);
    const bestTier = TIER_ORDER[best];
    const mythic = bestTier === 'mythic';
    const golden = best >= 3;
    const escaped = best < 3 ? pulls.find((p) => p.escaped)?.escaped : undefined;
    const reduce = settings.reduceMotion;
    const timers: number[] = [];
    const later = (fn: () => void, t: number) => timers.push(window.setTimeout(() => !root.destroyed && fn(), t));
    // --- dim + halftone
    const dim = screenRect(CP.night);
    dim.alpha = 0;
    const tint = screenRect(mythic ? 0x2a0006 : GOLD);
    tint.alpha = 0;
    const dots = new TilingSprite({ texture: halftoneTexture(b.accent, 18, 2.6), width: W, height: H });
    dots.alpha = 0;
    root.addChild(dim, tint, dots);
    root.eventMode = 'static';
    root.hitArea = new Rectangle(0, 0, W, H);
    gsap.to(dim, { alpha: 0.94, duration: 0.25 * k });
    gsap.to(dots, { alpha: 0.08, duration: 0.4 * k });
    // --- portal (the machine)
    const portal = new Container();
    portal.position.set(PX, PY);
    const ringA = new Graphics();
    const ringB = new Graphics();
    const core = new Graphics();
    const drawMachine = (ring: number, inner: number, coreCol: number, ghostA: number, ghostB: number) => {
      ringA.clear();
      const pts: number[] = [];
      const n = 48;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const rr = 250 + (i % 2 ? 26 : -8) + Math.sin(i * 7.3) * 6;
        pts.push(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ringA.poly(pts).fill(CP.ink);
      ringA.circle(0, 0, 232).fill(ring);
      ringA.circle(0, 0, 210).fill(inner);
      core.clear().circle(0, 0, 205).fill(coreCol);
      ringB.clear();
      ringB.circle(8, -5, 240).stroke({ width: 6, color: ghostA, alpha: 0.7 });
      ringB.circle(-8, 5, 240).stroke({ width: 6, color: ghostB, alpha: 0.7 });
    };
    drawMachine(b.accent, CP.ink, 0x0a050c, CP.cyan, CP.pink);
    const coreDots = new TilingSprite({ texture: halftoneTexture(b.accent2, 14, 3), width: 420, height: 420 });
    coreDots.anchor.set(0.5);
    coreDots.alpha = 0.35;
    const coreMask = new Graphics().circle(0, 0, 205).fill(0xffffff);
    coreDots.mask = coreMask;
    const runes = new Container();
    const word = ' NO ONE LIKE CATS · MULTIVERSO · EL GATO NEGRO ·';
    const runeTxt: Text[] = [];
    [...word].forEach((ch, i) => {
      const a = (i / word.length) * Math.PI * 2;
      const t = txt(ch, { fontFamily: F.poster, fontSize: 22, fill: CP.paper });
      t.anchor.set(0.5);
      t.position.set(Math.cos(a) * 221, Math.sin(a) * 221);
      t.rotation = a + Math.PI / 2;
      runes.addChild(t);
      runeTxt.push(t);
    });
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
    const drawBurst = (col: number, alpha: number) => {
      burst.clear();
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        const a2 = a + Math.PI / 20;
        burst.poly([0, 0, Math.cos(a) * 1300, Math.sin(a) * 1300, Math.cos(a2) * 1300, Math.sin(a2) * 1300]).fill({ color: col, alpha });
      }
    };
    drawBurst(b.accent, 0.1);
    burst.position.set(PX, PY);
    root.addChild(burst);
    gsap.to(burst, { rotation: Math.PI, duration: 20, ease: 'none' });
    const cracks = new Graphics();
    portal.addChild(ringB, dashes, ringA, core, coreMask, coreDots, swirl, runes, cracks);
    portal.scale.set(0);
    root.addChild(portal);
    gsap.to(swirl, { rotation: Math.PI * 6, duration: 4 * k, ease: 'power1.in' });
    gsap.to(dashes, { rotation: Math.PI * 2, duration: 6, ease: 'none', repeat: -1 });
    // energy motes sucked into the portal
    for (let i = 0; i < (reduce || speed > 1 ? 10 : 46); i++) {
      const m = new Graphics().circle(0, 0, 3 + Math.random() * 5).fill([b.accent, b.accent2, CP.paper][i % 3]);
      const a = Math.random() * Math.PI * 2;
      const r = 420 + Math.random() * 520;
      m.position.set(PX + Math.cos(a) * r, PY + Math.sin(a) * r);
      root.addChild(m);
      gsap.to(m, { x: PX, y: PY, duration: (0.6 + Math.random() * 0.6) * k, delay: Math.random() * 0.5 * k, ease: 'power3.in', onComplete: () => m.destroy() });
    }
    const title = txt('INVOCANDO…', { fontFamily: F.glitch, fontSize: 64, fill: CP.paper });
    title.anchor.set(0.5);
    title.position.set(PX, PY + 320);
    title.alpha = 0;
    root.addChild(title, particles);
    csfx.portal();
    gsap.to(portal.scale, { x: 1, y: 1, duration: 0.7 * k, ease: 'back.out(1.5)' });
    gsap.to(runes, { rotation: Math.PI * 2, duration: 9, ease: 'none', repeat: -1 });
    gsap.to(ringA, { rotation: -Math.PI * 2, duration: 14, ease: 'none', repeat: -1 });
    gsap.to(title, { alpha: 1, duration: 0.2, delay: 0.3 * k });
    let fr = 0;
    const iv = window.setInterval(() => {
      if (root.destroyed) return;
      fr++;
      coreDots.tilePosition.y += 3;
      title.x = PX + (fr % 5 === 0 ? (Math.random() - 0.5) * 18 : 0);
      ringB.rotation = fr % 2 ? 0.02 : -0.02;
    }, 1000 / 12);

    // the layer can be destroyed under us (leaving the casino mid-summon): stop every loop, never touch it again
    root.once('destroyed', () => {
      window.clearInterval(iv);
      for (const t of timers) window.clearTimeout(t);
      shaker.destroy();
    });

    let phase = 0;
    let skipPortal = () => {};
    root.on('pointertap', () => {
      if (phase === 0) skipPortal();
      else if (phase === 3) close();
    });

    // ---------------------------------------------------------------- 2. the machine transforms
    const transform = (): Promise<void> =>
      new Promise((res) => {
        phase = 1;
        if (best >= 2) {
          // charge-up: the machine shakes and the core pulses before it changes skin
          sfx('drumroll');
          shaker.add(0.15 + best * 0.08);
          gsap.fromTo(core.scale, { x: 1, y: 1 }, { x: 1.08, y: 1.08, duration: 0.12 * k, yoyo: true, repeat: golden ? 5 : 2 });
        }
        const tChange = best >= 2 ? (golden ? 900 : 450) * k : 0;
        later(() => {
          if (mythic) {
            drawMachine(MYTHIC, 0x14000a, 0x050006, MYTHIC, CP.cyan);
            drawBurst(MYTHIC, 0.16);
            gsap.to(tint, { alpha: 0.22, duration: 0.3 * k });
            for (const t of runeTxt) t.style.fill = MYTHIC;
            // stars in the singularity
            const stars = new Graphics();
            for (let i = 0; i < 60; i++) stars.circle((Math.random() - 0.5) * 360, (Math.random() - 0.5) * 360, Math.random() * 2.6 + 0.6).fill({ color: 0xffffff, alpha: 0.4 + Math.random() * 0.6 });
            stars.mask = coreMask;
            portal.addChildAt(stars, portal.getChildIndex(coreDots) + 1);
            gsap.to(stars, { rotation: Math.PI * 2, duration: 12, ease: 'none', repeat: -1 });
            if (!settings.reduceFlashes) {
              root.filters = [new RGBSplitFilter({ red: { x: -22, y: 0 }, green: { x: 0, y: 12 }, blue: { x: 22, y: -10 } })];
              later(() => (root.filters = []), 700 * k);
            }
            glitchSlices([MYTHIC, CP.ink, 0xffffff]);
          } else if (golden) {
            drawMachine(GOLD, 0x3a2400, 0xfff3c4, GOLD, 0xffffff);
            drawBurst(GOLD, 0.18);
            gsap.to(tint, { alpha: 0.12, duration: 0.3 * k });
            for (const t of runeTxt) t.style.fill = CP.ink;
            coreDots.texture = halftoneTexture(GOLD, 14, 3);
            if (bestTier === 'holo') {
              const s = holoSheen(440, 440, 0.9);
              s.position.set(-220, -220);
              s.mask = coreMask;
              portal.addChildAt(s, portal.getChildIndex(coreDots) + 1);
              glitchSlices([CP.pink, CP.cyan, CP.yellow]);
            }
          } else if (best >= 2) {
            drawMachine(CP.pink, CP.ink, 0x1a0412, CP.pink, CP.cyan);
            for (const t of runeTxt) t.style.fill = CP.pink;
          }
          if (golden) {
            // cracks across the machine + crown rays
            cracks.clear();
            for (let i = 0; i < 7; i++) {
              let a = Math.random() * Math.PI * 2;
              let r = 60;
              cracks.moveTo(Math.cos(a) * r, Math.sin(a) * r);
              for (let j = 0; j < 4; j++) {
                a += (Math.random() - 0.5) * 0.5;
                r += 40 + Math.random() * 30;
                cracks.lineTo(Math.cos(a) * r, Math.sin(a) * r);
              }
            }
            cracks.stroke({ width: 4, color: mythic ? MYTHIC : 0xffffff, alpha: 0.9 });
            shaker.add(0.6);
            sfx('boom', mythic ? 0.7 : 1);
            if (!reduce) speedLines(root, PX, PY, CP.ink, 60, 0.6 * k);
            flash(root, mythic ? MYTHIC : GOLD, 0.8, 0.35);
            onomatopoeia(root, PX + 330, PY - 220, mythic ? '¡¿MÍTICO?!' : bestTier === 'holo' ? '¡¿QUÉEE?!' : '¡DORADO!', { size: 120, color: mythic ? MYTHIC : bestTier === 'holo' ? CP.cyan : CP.yellow, dur: 1.2 * k + 0.3 });
          } else if (best >= 2) {
            flash(root, CP.pink, 0.45, 0.3);
            shaker.add(0.25);
          }
          if (pulls.some((p) => p.firstLegend)) {
            const st = stamp(root, PX - 300, PY + 250, 'SUERTE DE PRINCIPIANTE', CP.cyan, 46, -0.08);
            later(() => gsap.to(st, { alpha: 0, duration: 0.3 }), 1600 * k);
            o.onEvent?.('first');
          }
          csfx.beam(Math.min(4, best));
          particles.burst(PX, PY, { count: speed > 1 ? 20 : 30 + best * 15, tint: [TIER_COL[bestTier], 0xffffff], speed: [300, 900], life: [0.5, 1.2], gravity: 300, scale: [0.3, 0.9] });
          gsap.to(title, { alpha: 0, duration: 0.2 });
          later(res, (golden ? 650 : best >= 2 ? 350 : 150) * k);
        }, tChange);
      });

    const glitchSlices = (cols: number[]) => {
      const slices = new Container();
      for (let i = 0; i < 9; i++) {
        const s = new Graphics().rect(0, 0, W, 20 + Math.random() * 60).fill({ color: cols[i % cols.length], alpha: 0.35 });
        s.y = Math.random() * H;
        s.x = (Math.random() - 0.5) * 200;
        slices.addChild(s);
      }
      root.addChild(slices);
      gsap.to(slices, { alpha: 0, duration: 0.5 * k, delay: 0.35 * k, onComplete: () => slices.destroy({ children: true }) });
    };

    // ---------------------------------------------------------------- ¡SE ESCAPÓ! (candy)
    const escape = (): Promise<void> =>
      new Promise((res) => {
        if (!escaped) return res();
        o.onEvent?.('escape');
        const def = catDef(escaped);
        const sil = catArt(escaped, 380);
        sil.position.set(PX, PY + 40);
        sil.alpha = 0;
        root.addChild(sil);
        // golden silhouette (tinted dark first, then a gold rim flash)
        const glow = new Graphics().circle(0, 0, 230).fill({ color: GOLD, alpha: 0.35 });
        glow.position.set(PX, PY);
        root.addChildAt(glow, root.getChildIndex(sil));
        sfx('drumroll');
        gsap.to(sil, { alpha: 1, y: PY - 40, duration: 0.35 * k, ease: 'back.out(2)' });
        later(() => {
          sfx('whoosh');
          gsap.to(sil, { x: W + 300, y: PY - 220, rotation: 0.4, duration: 0.55 * k, ease: 'power3.in' });
          gsap.to(glow, { alpha: 0, duration: 0.4 * k });
          const s1 = stamp(root, PX, PY - 260, '¡SE ESCAPÓ UN LEGENDARIO!', GOLD, 64, -0.06);
          const s2 = stamp(root, PX, PY + 300, `${def.name.toUpperCase()} DEJÓ RASTRO · RACHA CALIENTE`, CP.cyan, 38, 0.04);
          shaker.add(0.3);
          later(() => {
            gsap.to([s1, s2], { alpha: 0, duration: 0.3 });
            res();
          }, 1500 * k);
        }, 700 * k);
      });

    // ---------------------------------------------------------------- 3. reveals straight from the portal
    const plan: RevealPlan = o.reveal ?? { only: (g) => !!g.isNew || !!g.upgraded || catRank(g) >= 2 };
    const revealList = pulls.filter((p) => p.got.kind === 'cat' && (plan.only ? plan.only(p.got) : true));
    const reveals = async () => {
      phase = 2;
      revealList.sort((a, c) => catRank(a.got) - catRank(c.got));
      for (const p of revealList) {
        if (root.destroyed) return;
        // a beam in this cat's tier colour shoots out of the machine…
        const col = TIER_COL[p.got.tier === 'mythic' ? 'mythic' : p.got.holo ? 'holo' : (p.got.tier ?? 'rare')] ?? GOLD;
        const bm = new Graphics();
        const bw = 160 + catRank(p.got) * 40;
        for (let i = 0; i < 5; i++) bm.rect(-bw / 2 + i * (bw / 10), -H, bw - i * (bw / 5), H).fill({ color: i === 4 ? 0xffffff : col, alpha: 0.25 + i * 0.12 });
        bm.position.set(PX, PY);
        bm.scale.x = 0;
        root.addChild(bm);
        gsap.to(bm.scale, { x: 1, duration: 0.18 * k, ease: 'power3.out' });
        csfx.beam(Math.min(4, catRank(p.got)));
        flash(root, col, 0.7, 0.3);
        await wait(320 * k);
        gsap.to(bm, { alpha: 0, duration: 0.3, onComplete: () => bm.destroy() });
        // …and the cat comes out of it (the collection's full reveal, no card first)
        await revealCats(layer, [p.got], { ...plan, only: () => true });
      }
    };

    // ---------------------------------------------------------------- 4. the haul, face up
    const haul = () => {
      phase = 3;
      gsap.to(portal, { alpha: 0.2, duration: 0.4 * k });
      gsap.to(portal.scale, { x: 1.5, y: 1.5, duration: 0.5 * k, ease: 'power2.out' });
      const n = pulls.length;
      const big = n === 1;
      const cw = big ? 380 : 196;
      const ch = big ? 520 : 270;
      const gapX = 26;
      const gapY = 30;
      const cols = big ? 1 : 5;
      const rows = Math.ceil(n / cols);
      const gx0 = PX - (cols * cw + (cols - 1) * gapX) / 2;
      pulls.forEach((p, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const c = prizeCard(p.got, cw, ch);
        c.pivot.set(cw / 2, ch / 2);
        c.position.set(PX, PY);
        c.scale.set(0.05);
        c.rotation = (Math.random() - 0.5) * 2;
        root.addChild(c);
        const tx = gx0 + col * (cw + gapX) + cw / 2;
        const ty = 150 + row * (ch + gapY) + ch / 2 + (rows === 1 && !big ? 150 : 0);
        const r = rank(p.tier);
        gsap.to(c, { x: tx, y: ty, rotation: (Math.random() - 0.5) * 0.06, duration: 0.42 * k, delay: i * 0.06 * k, ease: 'back.out(1.4)', onStart: () => csfx.cardFly() });
        gsap.to(c.scale, { x: 1, y: 1, duration: 0.42 * k, delay: i * 0.06 * k, ease: 'back.out(1.6)' });
        if (r >= 1) {
          const glow = new Graphics();
          for (let j = 0; j < 3; j++) glow.rect(-6 - j * 5, -6 - j * 5, cw + 12 + j * 10, ch + 12 + j * 10).stroke({ width: 4, color: TIER_COL[p.tier], alpha: 0.5 - j * 0.14 });
          c.addChildAt(glow, 0);
        }
        later(
          () => {
            sparkles(root, tx, ty, TIER_COL[p.tier], 4 + r * 3, 80 + r * 30);
            if (r >= 2) onomatopoeia(root, tx, ty - ch / 2 - 10, p.tier === 'mythic' ? '¡MÍTICO!' : p.tier === 'holo' ? '¡HOLO!' : p.tier === 'legendary' ? '¡LEGENDARIO!' : '¡ÉPICO!', { size: big ? 90 : 52, color: TIER_COL[p.tier], dur: 0.9 * k + 0.2 });
            if (p.pity) stamp(root, tx, ty + ch / 2 - 18, p.pity === 'mythic' ? 'GARANTÍA MÍTICA' : p.pity === 'legendary' ? 'GARANTÍA' : 'GARANTÍA ÉPICA', CP.cyan, big ? 34 : 22, 0.06);
            if (p.tier === 'holo' || p.got.holo) {
              const s = holoSheen(cw - 8, ch - 8, 0.8);
              s.position.set(tx - cw / 2 + 4, ty - ch / 2 + 4);
              root.addChild(s);
            }
          },
          (420 + i * 60) * k,
        );
      });
      const mx = best;
      const ev = mythic ? 'mythic' : pulls.some((p) => p.tier === 'holo') ? 'holo' : mx >= 3 ? 'legend' : mx >= 2 ? 'epic' : 'meh';
      if (!(ev === 'meh' && escaped)) o.onEvent?.(ev);
      if (o.auto) {
        later(close, (n === 1 ? 900 : 1500) * k + 300);
        return;
      }
      const btn = new Container();
      const t = txt('CONTINUAR', { fontFamily: F.poster, fontSize: 40, fill: CP.ink });
      const bg = new Graphics().rect(8, 8, t.width + 60, 70).fill(CP.ink).rect(0, 0, t.width + 60, 70).fill(CP.yellow).stroke({ width: 4, color: CP.ink });
      t.position.set(30, 9);
      btn.addChild(bg, t);
      btn.position.set(PX - (t.width + 60) / 2, H - 120);
      btn.eventMode = 'static';
      btn.cursor = 'pointer';
      btn.on('pointertap', (e) => {
        e.stopPropagation();
        close();
      });
      root.addChild(btn);
      gsap.from(btn, { y: H, duration: 0.3, delay: 0.3, ease: 'back.out(2)' });
    };

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      phase = 5;
      window.clearInterval(iv);
      gsap.to(root, {
        alpha: 0,
        duration: 0.25 * k,
        onComplete: () => {
          for (const t of timers) window.clearTimeout(t);
          shaker.destroy();
          killDeep(root);
          root.destroy({ children: true });
          resolve();
        },
      });
    };

    const run = async () => {
      await transform();
      await escape();
      await reveals();
      if (!root.destroyed) haul();
    };
    let started = false;
    const go = () => {
      if (started) return;
      started = true;
      gsap.killTweensOf(portal.scale);
      portal.scale.set(1);
      void run();
    };
    skipPortal = go;
    later(go, 1250 * k);
  });
}

/** quick ink stamp (local copy: fx/ can't depend on panels/casino/fx.ts' layers) */
function stamp(layer: Container, x: number, y: number, word: string, color: number, size: number, rot: number): Text {
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

function wait(ms: number) {
  return new Promise<void>((r) => window.setTimeout(r, ms));
}
