/**
 * Asalto Rápido (GDD 2.9.1): an already-won stage with SP/EP ≥ 2.5 resolves in ~5 s with a
 * three-panel comic summary + loot tick-up. Applies the result as a victory.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { scenes } from '../../core/scenes';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { sfx } from '../../core/audio';
import { fmt } from '../../core/format';
import { onomatopoeia, sparkles, speedLines } from '../../fx/juice';
import { resolveBattle } from '../../state/ext/campaign';
import { stageInfo } from '../../state/sys/campaign';
import { P, elKey, killTree, resChip, tickUp } from './common';
import { elementFx } from '../../art/catArt';
import { boat } from './chartArt';
import type { IconKind } from '../../ui/icons';
import type { BattleResult } from '../../scenes/BattleScene';

export function playQuickAssault(zone: number, stage: number): Promise<void> {
  return new Promise((resolve) => {
    const r: BattleResult = { won: true, reason: 'core', turns: 3, modulesDestroyed: 4, damageDealt: 0, catsLost: 0, perfect: false };
    const last = resolveBattle(zone, stage, r, { quick: true });
    const loot = last.loot;
    const root = new Container();
    scenes.overlayLayer.addChild(root);
    const dim = new Graphics().rect(0, 0, W, H).fill({ color: C.ink, alpha: 0.72 });
    root.addChild(dim);
    const pw = 1380;
    const ph = 640;
    const px = (W - pw) / 2;
    const py = (H - ph) / 2;
    const panel = new Container();
    panel.position.set(px, py);
    const bg = new Graphics().rect(14, 14, pw, ph).fill(C.ink).rect(0, 0, pw, ph).fill(C.paper).stroke({ width: 5, color: C.ink });
    const band = new Graphics().rect(0, 0, pw, 80).fill(C.yellow).stroke({ width: 5, color: C.ink });
    const title = txt(`ASALTO RÁPIDO · ${zone}-${stage}`, { fontFamily: F.poster, fontSize: 56, fill: C.ink });
    title.position.set(26, 6);
    const sub = txt((stageInfo(zone, stage)?.name ?? '').toUpperCase(), { fontFamily: F.bebas, fontSize: 30, fill: C.ink });
    sub.anchor.set(1, 0);
    sub.position.set(pw - 26, 26);
    panel.addChild(bg, band, title, sub);
    root.addChild(panel);
    gsap.from(panel, { y: py + 80, alpha: 0, duration: 0.25, ease: 'back.out(1.8)' });

    // three comic frames
    const fw = 420;
    const fh = 300;
    const frames: Container[] = [];
    const captions = ['¡A TODA VELA!', '¡BOOM!', '¡HUNDIDO!'];
    const colors = [C.mint, C.orange, C.megaBlue];
    for (let i = 0; i < 3; i++) {
      const f = new Container();
      const fx = 30 + i * (fw + 25);
      f.position.set(fx, 106);
      const fb = new Graphics().rect(0, 0, fw, fh).fill(colors[i]).stroke({ width: 5, color: C.ink });
      const mask = new Graphics().rect(0, 0, fw, fh).fill(0xffffff);
      const inner = new Container();
      inner.mask = mask;
      f.addChild(fb, inner, mask);
      const cap = new Container();
      const ct = txt(captions[i], { fontFamily: F.comic, fontSize: 30, fill: C.ink, letterSpacing: 1 });
      const cb = new Graphics().rect(-10, -4, ct.width + 20, ct.height + 8).fill(C.yellow).stroke({ width: 3, color: C.ink });
      cap.addChild(cb, ct);
      cap.position.set(16, 14);
      f.addChild(cap);
      f.alpha = 0;
      panel.addChild(f);
      frames.push(f);
      (f as Container & { inner: Container }).inner = inner;
    }
    const inner = (i: number) => (frames[i] as Container & { inner: Container }).inner;

    // loot row
    const lootRow = new Container();
    lootRow.position.set(40, 450);
    panel.addChild(lootRow);
    const items: { kind: IconKind; value: number; label?: string; tint?: number }[] = [{ kind: 'gold', value: loot.gold }, { kind: 'scrap', value: loot.scrap }];
    if (loot.crystals) items.push({ kind: 'crystal', value: loot.crystals.n, tint: elementFx(elKey(loot.crystals.el)).main });
    if (loot.blueprint) items.push({ kind: 'blueprint', value: loot.blueprint });
    if (loot.orbs) items.push({ kind: 'orb', value: loot.orbs.n });
    if (loot.gems) items.push({ kind: 'gem', value: loot.gems });
    const lt = txt('BOTÍN', { fontFamily: F.poster, fontSize: 40, fill: C.ink });
    lootRow.addChild(lt);
    const purr = txt(last.purrMinutes > 0 ? `+${last.purrMinutes.toFixed(1)} min de Ronroneo` : '', { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: P.blue });
    purr.position.set(0, 120);
    purr.alpha = 0;
    lootRow.addChild(purr);

    const tl = gsap.timeline();
    // frame 1: your boat sails in
    tl.call(() => {
      frames[0].alpha = 1;
      sfx('whoosh');
      const b = boat(C.pink);
      b.scale.set(2.2);
      b.position.set(-80, 220);
      inner(0).addChild(b);
      gsap.to(b, { x: 230, duration: 0.6, ease: 'power3.out' });
      speedLines(frames[0], fw / 2, fh / 2, C.ink, 30, 0.5);
      gsap.from(frames[0].scale, { x: 1.1, y: 1.1, duration: 0.2 });
    }, [], 0.15);
    // frame 2: explosion
    tl.call(() => {
      frames[1].alpha = 1;
      sfx('bigboom');
      const e = new Graphics().star(fw / 2, fh / 2 + 20, 14, 130, 70).fill(C.yellow).stroke({ width: 5, color: C.ink });
      e.pivot.set(fw / 2, fh / 2 + 20);
      e.position.set(fw / 2, fh / 2 + 20);
      inner(1).addChild(e);
      gsap.from(e.scale, { x: 0.2, y: 0.2, duration: 0.25, ease: 'back.out(3)' });
      gsap.to(e, { rotation: 0.3, duration: 1.2 });
      onomatopoeia(frames[1], fw / 2, fh / 2 + 10, '¡KABOOM!', { size: 70, color: C.paper });
      gsap.fromTo(panel, { x: px - 10 }, { x: px, duration: 0.35, ease: 'elastic.out(1,0.3)' });
    }, [], 0.85);
    // frame 3: sinking bubbles
    tl.call(() => {
      frames[2].alpha = 1;
      sfx('splash');
      const g = new Graphics();
      g.rect(0, 200, fw, 100).fill(0x172b35);
      for (let i = 0; i < 12; i++) g.circle(60 + Math.random() * 300, 120 + Math.random() * 130, 6 + Math.random() * 14).stroke({ width: 3, color: C.paper });
      inner(2).addChild(g);
      gsap.from(g, { y: 40, duration: 0.6, ease: 'power2.out' });
      const glu = txt('glu… glu…', { fontFamily: F.brush, fontSize: 40, fill: C.paper });
      glu.position.set(200, 70);
      inner(2).addChild(glu);
    }, [], 1.5);
    // loot tick-ups (each step a bit faster)
    let x = 150;
    let dly = 2.1;
    let step = 0.32;
    items.forEach((it, i) => {
      tl.call(() => {
        const chip = resChip(it.kind, '0', true, 46, it.tint);
        chip.position.set(x, 0);
        lootRow.addChild(chip);
        const t = chip.children[1] as ReturnType<typeof txt>;
        tickUp(t, it.value, { suffix: it.label ? ` ${it.label}` : '', dur: 0.5, onTick: (p) => sfx('tick', 1 + p * 0.5) });
        gsap.from(chip.scale, { x: 1.6, y: 1.6, duration: 0.2, ease: 'back.out(3)' });
        sfx('coin', 1 + i * 0.08);
        x += 60 + Math.max(90, fmt(it.value).length * 30 + (it.label ? 40 : 0));
      }, [], dly);
      dly += step;
      step *= 0.87;
    });
    tl.call(() => {
      gsap.to(purr, { alpha: 1, duration: 0.3 });
      sparkles(panel, pw - 200, 480, C.yellow, 14, 140);
      sfx('fanfare');
      const st = txt('¡VICTORIA!', { fontFamily: F.poster, fontSize: 90, fill: C.pinkHot, stroke: { color: C.ink, width: 8 } });
      st.anchor.set(0.5);
      st.rotation = -0.08;
      st.position.set(pw - 230, 560);
      panel.addChild(st);
      gsap.from(st.scale, { x: 2.5, y: 2.5, duration: 0.2, ease: 'power3.in' });
    }, [], dly + 0.1);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      tl.kill();
      gsap.to(root, {
        alpha: 0,
        duration: 0.25,
        onComplete: () => {
          killTree(root);
          root.destroy({ children: true });
          resolve();
        },
      });
    };
    tl.call(finish, [], 5);
    root.eventMode = 'static';
    root.on('pointertap', () => {
      if (tl.time() < 4) tl.timeScale(4);
      else finish();
    });
  });
}
