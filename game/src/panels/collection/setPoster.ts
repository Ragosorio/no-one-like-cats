/**
 * Catdex set completed (GDD 2.7 · juice T3): a typographic poster — the member cards slam in
 * one by one, "¡SET COMPLETO!", the rewards (+Prisma, Ronroneo) and the NEW RULE card.
 */
import { Container, Graphics, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { C, F } from '../../ui/theme';
import { txt, poster } from '../../ui/widgets';
import { sfx } from '../../core/audio';
import { settings } from '../../core/settings';
import { halftoneTexture, paperTexture } from '../../art/textures';
import { catDef } from '../../data/content';
import { BAL } from '../../state/econ';
import { Shaker, onomatopoeia, sparkles, speedLines, time } from '../../fx/juice';
import { CatCard } from './CatCard';
import { ensureCatArt } from './art';
import { killTree, prismaGem } from './ui';
import { dimensionOf } from './dimension';

export interface SetPosterInfo {
  id: string;
  name: string;
  cats: string[];
  rule: string;
}

const PENTA = [1, 1.125, 1.25, 1.5, 1.68, 2, 2.25, 2.5];

export async function playSetPoster(layer: Container, set: SetPosterInfo): Promise<void> {
  await ensureCatArt();
  return new Promise((resolve) => {
    const root = new Container();
    layer.addChild(root);
    const shaker = new Shaker(root, 20, 0.015);
    const reduce = settings.reduceMotion;
    const el = catDef(set.cats[0]).elements[0];
    const dim = dimensionOf(el);
    const bg = new TilingSprite({ texture: paperTexture(C.paper), width: W, height: H });
    const dots = new TilingSprite({ texture: halftoneTexture(C.ink, 12, 2), width: W, height: H });
    dots.alpha = 0.07;
    const circle = new Graphics().circle(W - 360, 330, 300).fill(C.pink);
    const band = new Graphics().rect(0, 0, W, 210).fill(C.ink);
    const stripe = new Graphics().rect(0, 210, W, 26).fill(dim.accent);
    root.addChild(bg, dots, circle, band, stripe);
    const kicker = txt('CATDEX · SET COMPLETO', { fontFamily: F.ui, fontWeight: '700', fontSize: 24, fill: C.yellow, letterSpacing: 8 });
    kicker.position.set(70, 26);
    const title = poster(set.name.toUpperCase(), 130, C.paper, { letterSpacing: -2 });
    title.position.set(64, 54);
    if (title.width > W - 140) title.scale.set((W - 140) / title.width);
    root.addChild(kicker, title);
    const tl = gsap.timeline();
    tl.from(band, { y: -240, duration: 0.25, ease: 'power3.out' }, 0);
    tl.from(stripe.scale, { x: 0, duration: 0.3, ease: 'power3.out' }, 0.1);
    tl.from(title, { x: -800, duration: 0.3, ease: 'power4.out' }, 0.12);
    tl.from(circle.scale, { x: 0, y: 0, duration: 0.35, ease: 'back.out(2)' }, 0.1);
    sfx('paper');

    // member cards slam in
    const n = set.cats.length;
    const cw = n > 5 ? 190 : n > 3 ? 230 : 290;
    const ch = Math.round(cw * 1.33);
    const gap = 26;
    const totalW = n * cw + (n - 1) * gap;
    const x0 = Math.max(60, (W - 760 - totalW) / 2 + 40);
    const cy = 290;
    set.cats.forEach((id, i) => {
      const card = new CatCard(id, { w: cw, h: ch, status: 'registered' });
      card.pivot.set(cw / 2, ch / 2);
      card.position.set(x0 + i * (cw + gap) + cw / 2, cy + ch / 2);
      card.rotation = (i % 2 ? 1 : -1) * 0.04;
      card.alpha = 0;
      root.addChild(card);
      tl.call(
        () => {
          if (card.destroyed) return;
          card.alpha = 1;
          gsap.fromTo(card.scale, { x: 2, y: 2 }, { x: 1, y: 1, duration: 0.14, ease: 'power3.in' });
          sfx('hit', PENTA[i % PENTA.length]);
          sfx('coin', PENTA[i % PENTA.length] * 1.5);
          shaker.add(0.15);
          sparkles(root, card.x, card.y, dim.hi, 8, 140);
        },
        [],
        0.45 + i * 0.16,
      );
    });
    const tAll = 0.45 + n * 0.16 + 0.1;
    // ticker tape at the bottom
    const tape = new Container();
    tape.position.set(0, H - 130);
    const tg = new Graphics().rect(0, 0, W, 64).fill(dim.accent).rect(0, 0, W, 64).stroke({ width: 5, color: C.ink });
    tape.addChild(tg);
    const line = new Container();
    const unit = `SET COMPLETO · ${set.name.toUpperCase()} · REGLA NUEVA · `;
    let lx = 0;
    while (lx < W * 2.2) {
      const t = txt(unit, { fontFamily: F.poster, fontSize: 40, fill: C.paper, stroke: { color: C.ink, width: 6, join: 'round' } });
      t.position.set(lx, 8);
      line.addChild(t);
      lx += t.width;
    }
    tape.addChild(line);
    tape.rotation = -0.012;
    root.addChild(tape);
    gsap.from(tape, { x: -W, duration: 0.3, ease: 'power3.out', delay: 0.2 });
    gsap.to(line, { x: -lx / 2, duration: 14, ease: 'none', repeat: -1 });
    // big stamp
    tl.call(
      () => {
        if (root.destroyed) return;
        if (!reduce) time.hitstop(90);
        sfx('fanfare');
        sfx('boom', 1.1);
        shaker.add(0.45);
        if (!reduce) speedLines(root, W / 2, cy + ch / 2, C.ink, 48, 0.5);
        const st = poster('¡SET COMPLETO!', 120, C.yellow, { stroke: { color: C.ink, width: 14, join: 'round' } });
        st.anchor.set(0.5);
        st.position.set(x0 + totalW / 2, cy + ch + 40);
        st.rotation = -0.06;
        root.addChild(st);
        gsap.fromTo(st.scale, { x: 2.6, y: 2.6 }, { x: 1, y: 1, duration: 0.16, ease: 'power3.in' });
        onomatopoeia(root, W - 360, 300, '¡COMBO!', { size: 120, color: dim.accent, dur: 1.4 });
      },
      [],
      tAll,
    );
    // rewards + rule
    tl.call(
      () => {
        if (root.destroyed) return;
        const rx = W - 700;
        const ry = 300;
        const rw = 620;
        const rc = new Container();
        rc.position.set(rx, ry);
        const head = txt('PREMIO', { fontFamily: F.ui, fontWeight: '700', fontSize: 20, fill: C.ink, letterSpacing: 6 });
        rc.addChild(head);
        const chipRow = (node: Container, label: string, y: number, bgc: number) => {
          const t = poster(label, 44, C.ink);
          const g = new Graphics().rect(6, 6, rw, 70).fill(C.ink).rect(0, 0, rw, 70).fill(bgc).stroke({ width: 4, color: C.ink });
          node.position.set(42, 35);
          t.position.set(84, 8);
          const c = new Container();
          c.addChild(g, node, t);
          c.position.set(0, y);
          rc.addChild(c);
          gsap.from(c, { x: 80, alpha: 0, duration: 0.2, delay: y / 600 });
          return c;
        };
        chipRow(prismaGem(40), `+${BAL.orbs.prisma_from_catdex_set} PRISMA`, 32, C.mint);
        const purr = new Graphics().circle(0, 0, 18).fill(C.mint).stroke({ width: 3, color: C.ink });
        purr.moveTo(-8, 4).bezierCurveTo(-4, -8, 4, -8, 8, 4).stroke({ width: 3, color: C.ink, cap: 'round' });
        chipRow(purr, `+${BAL.ronroneo.base_min.catdex_set} MIN DE RONRONEO`, 116, C.paper);
        // rule card
        const rt = txt('REGLA NUEVA · PARA SIEMPRE', { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.paper, letterSpacing: 4 });
        const rb = txt(set.rule, { fontFamily: F.poster, fontSize: 36, fill: C.paper, wordWrap: true, wordWrapWidth: rw - 40, lineHeight: 42 });
        const rh = rb.height + 70;
        const g = new Graphics().rect(8, 8, rw, rh).fill(dim.accent).rect(0, 0, rw, rh).fill(C.ink).stroke({ width: 4, color: C.ink });
        rt.position.set(20, 12);
        rb.position.set(20, 44);
        const rule = new Container();
        rule.addChild(g, rt, rb);
        rule.position.set(0, 214);
        rule.rotation = -0.015;
        rc.addChild(rule);
        gsap.fromTo(rule.scale, { x: 1.4, y: 1.4 }, { x: 1, y: 1, duration: 0.18, delay: 0.35, ease: 'back.out(3)' });
        gsap.from(rule, { alpha: 0, duration: 0.05, delay: 0.35 });
        gsap.delayedCall(0.35, () => !root.destroyed && sfx('sting'));
        root.addChild(rc);
      },
      [],
      tAll + 0.35,
    );
    const tEnd = tAll + 1.2;
    const hint = txt('CLIC PARA CONTINUAR', { fontFamily: F.poster, fontSize: 28, fill: C.ink });
    hint.anchor.set(0.5);
    hint.position.set(W / 2, H - 36);
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

/** play every pending set poster (state/sys/cats takeSetCelebrations) */
export async function playPendingSets(layer: Container, sets: SetPosterInfo[]) {
  for (const s of sets) await playSetPoster(layer, s);
}
