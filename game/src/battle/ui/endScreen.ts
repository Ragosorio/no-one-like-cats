/**
 * The battle's last word: ¡VICTORIA! / DERROTA as a comic splash page, not a washed-out overlay.
 *
 *   flash + hit-stop → ink vignette over the REAL screen → comic sunburst (victory) or rain (defeat)
 *   → the title slams in letter by letter (squash, overshoot, settle) → the reason ribbon slides under it
 *   → the MVP pops up from the bottom with a stamp → one card per cat that scored (rank-ups shine)
 *   → confetti that falls once → CONTINUAR.
 *
 * The first tap finishes every animation at once; the next one continues (never blocks a hurried
 * player, never skips what a patient one wants to see). Respects Ajustes › movimiento reducido.
 */
import { Container, FillGradient, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { H, W, game } from '../../core/App';
import { sfx } from '../../core/audio';
import { settings } from '../../core/settings';
import { C, F } from '../../ui/theme';
import { poster, txt } from '../../ui/widgets';
import { followView, screenRect } from '../../ui/screen';
import { catPortrait } from '../../panels/campaign/common';
import { sparkles } from '../../fx/juice';

export interface EndRow {
  name: string;
  /** "+3 K.O." or "¡RANGO PLATA! (+2 ORBES)" */
  text: string;
  big: boolean;
}
export interface EndOpts {
  won: boolean;
  reason: string;
  rows: EndRow[];
  repair: string | null;
  mvp: { species: string; name: string } | null;
}

export function playBattleEnd(layer: Container, o: EndOpts): Promise<void> {
  const calm = settings.reduceMotion;
  const won = o.won;
  const root = new Container();
  layer.addChild(root);
  const tl = gsap.timeline();

  // ---- 1. flash (a single white frame) + the world behind goes to ink
  const flash = screenRect(0xffffff);
  const dim = screenRect({ color: won ? 0x1a0f22 : C.oceanNoir, alpha: won ? 0.62 : 0.8 });
  root.addChild(dim, flash);
  tl.fromTo(dim, { alpha: 0 }, { alpha: 1, duration: 0.25 }, 0);
  tl.fromTo(flash, { alpha: calm ? 0.25 : 0.85 }, { alpha: 0, duration: 0.22, ease: 'power2.out' }, 0);

  // ---- 2. comic sunburst behind the title (victory) / rain streaks (defeat)
  const cx = W / 2;
  const cy = H / 2 - 70;
  const burst = new Container();
  burst.position.set(cx, cy);
  root.addChild(burst);
  if (won) {
    const rays = new Graphics();
    const n = 18;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = a0 + Math.PI / n;
      const r = 1600;
      rays.poly([0, 0, Math.cos(a0) * r, Math.sin(a0) * r, Math.cos(a1) * r, Math.sin(a1) * r]).fill({ color: i % 2 ? C.pink : C.yellow, alpha: 0.35 });
    }
    const disc = new Graphics().circle(0, 0, 250).fill(C.pinkHot).stroke({ width: 10, color: C.ink });
    const disc2 = new Graphics().circle(0, 0, 210).stroke({ width: 4, color: C.yellow, alpha: 0.9 });
    burst.addChild(rays, disc, disc2);
    tl.from(burst.scale, { x: 0.2, y: 0.2, duration: 0.45, ease: 'back.out(1.8)' }, 0.05);
    if (!calm) gsap.to(rays, { rotation: Math.PI * 2, duration: 40, repeat: -1, ease: 'none' });
  } else {
    const rain = new Graphics();
    for (let i = 0; i < 70; i++) {
      const x = (Math.random() - 0.5) * 2400;
      const y = (Math.random() - 0.5) * 1400;
      rain.moveTo(x, y).lineTo(x - 30, y + 110);
    }
    rain.stroke({ width: 2, color: 0x7fb6ff, alpha: 0.35 });
    burst.addChild(rain);
    if (!calm) gsap.to(rain, { y: 60, duration: 0.5, repeat: -1, ease: 'none' });
  }

  // ---- 3. the title, letter by letter: squash in, overshoot, settle (and a printed drop shadow)
  const word = won ? '¡VICTORIA!' : 'DERROTA';
  const size = 200;
  const title = new Container();
  title.position.set(cx, cy);
  root.addChild(title);
  const letters: Text[] = [];
  let x = 0;
  for (const ch of word) {
    const shadow = poster(ch, size, C.ink, { letterSpacing: 0 });
    const t = poster(ch, size, won ? C.paper : C.paper, { letterSpacing: 0, stroke: { color: C.ink, width: 12 } });
    t.anchor.set(0.5, 0.62);
    shadow.anchor.set(0.5, 0.62);
    const w = t.width - 8;
    t.x = x + w / 2;
    shadow.position.set(t.x + 10, 10);
    shadow.alpha = 0.85;
    title.addChild(shadow, t);
    letters.push(t);
    x += w;
  }
  title.pivot.x = x / 2;
  if (title.width > W - 160) title.scale.set((W - 160) / title.width);
  const base = title.scale.x;
  letters.forEach((t, i) => {
    const d = 0.18 + i * (calm ? 0.02 : 0.045);
    tl.from(t, { y: -260, alpha: 0, duration: 0.28, ease: 'power3.in' }, d);
    if (!calm) tl.fromTo(t.scale, { x: 1.35, y: 0.6 }, { x: 1, y: 1, duration: 0.42, ease: 'elastic.out(1.1, 0.45)' }, d + 0.26);
  });
  const landed = 0.18 + letters.length * (calm ? 0.02 : 0.045) + 0.28;
  tl.call(() => sfx(won ? 'fanfare' : 'sting'), [], 0.15);
  if (!calm) {
    tl.fromTo(title.scale, { x: base * 1.08, y: base * 1.08 }, { x: base, y: base, duration: 0.3, ease: 'back.out(3)' }, landed);
    tl.call(() => shake(root, won ? 10 : 6), [], landed);
  }

  // ---- 4. the reason ribbon
  const rib = new Container();
  const rt = poster(o.reason, 42, won ? C.ink : C.paper, { letterSpacing: 1 });
  rt.anchor.set(0.5);
  const rw = rt.width + 90;
  rib.addChild(new Graphics().poly([-rw / 2, -34, rw / 2, -34, rw / 2 - 26, 0, rw / 2, 34, -rw / 2, 34, -rw / 2 + 26, 0]).fill(won ? C.yellow : C.red).stroke({ width: 5, color: C.ink }), rt);
  rib.position.set(cx, cy + 150);
  rib.rotation = -0.03;
  root.addChild(rib);
  tl.from(rib, { x: cx - 900, alpha: 0, duration: 0.35, ease: 'power3.out' }, landed - 0.05);

  // ---- 5. MVP (victory) — the cat that carried the battle pops from the bottom-left
  // a dark floor under the MVP, the cards and CONTINUAR: the battle HUD (cat cards) stays out of the way
  const floor = new Graphics();
  root.addChild(floor);
  followView(floor, (v) =>
    floor.clear().rect(v.x, v.y + v.h - 300, v.w, 300).fill(
      new FillGradient({
        type: 'linear',
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
        colorStops: [
          { offset: 0, color: 'rgba(13,17,15,0)' },
          { offset: 0.35, color: 'rgba(13,17,15,0.82)' },
          { offset: 1, color: 'rgba(13,17,15,0.95)' },
        ],
        textureSpace: 'local',
      }),
    ),
  );
  tl.from(floor, { alpha: 0, duration: 0.3 }, 0.1);
  const bottom = new Container();
  root.addChild(bottom);
  followView(bottom, (v) => (bottom.y = v.y + v.h - H));
  if (o.mvp) {
    const m = new Container();
    const p = catPortrait(o.mvp.species, 230, { ring: won ? C.yellow : C.paper });
    p.position.set(0, 0);
    const st = new Container();
    const stt = poster(won ? 'MVP' : 'DIO TODO', 34, C.ink);
    stt.anchor.set(0.5);
    st.addChild(new Graphics().roundRect(-stt.width / 2 - 14, -24, stt.width + 28, 48, 6).fill(won ? C.yellow : C.paper).stroke({ width: 4, color: C.ink }), stt);
    st.position.set(70, -110);
    st.rotation = 0.12;
    const nm = poster(o.mvp.name.toUpperCase(), 40, C.paper, { stroke: { color: C.ink, width: 8 } });
    nm.anchor.set(0.5, 0);
    nm.position.set(0, 120);
    if (nm.width > 340) nm.scale.set(340 / nm.width);
    m.addChild(p, st, nm);
    m.position.set(220, H - 230);
    bottom.addChild(m);
    tl.from(m, { y: H + 260, duration: 0.45, ease: 'back.out(1.6)' }, landed + 0.05);
    // scale and alpha live on different objects (alpha on the ObservablePoint warned after every battle)
    tl.from(st.scale, { x: 2.4, y: 2.4, duration: 0.25, ease: 'back.out(3)' }, landed + 0.4);
    tl.from(st, { alpha: 0, duration: 0.25 }, landed + 0.4);
    if (!calm && won) tl.to(m, { y: H - 250, yoyo: true, repeat: 3, duration: 0.18, ease: 'sine.inOut' }, landed + 0.5);
  }

  // ---- 6. score cards on the right (one per cat), staggered; rank-ups glow
  const cards = new Container();
  let cy2 = 0;
  const CW = 520;
  for (const r of o.rows.slice(0, 7)) {
    const c = new Container();
    const h = r.big ? 62 : 46;
    c.addChild(new Graphics().rect(5, 5, CW, h).fill(C.ink).rect(0, 0, CW, h).fill(r.big ? C.yellow : C.paper).stroke({ width: 3, color: C.ink, alignment: 1 }));
    const nm = poster(r.name.toUpperCase(), r.big ? 30 : 24, C.ink);
    nm.position.set(14, (h - nm.height) / 2);
    if (nm.width > 230) nm.scale.set(230 / nm.width);
    const tx = txt(r.text, { fontFamily: F.poster, fontSize: r.big ? 26 : 22, fill: r.big ? C.pinkHot : C.ink });
    tx.anchor.set(1, 0.5);
    tx.position.set(CW - 14, h / 2);
    if (tx.width > CW - 260) tx.scale.set((CW - 260) / tx.width);
    c.addChild(nm, tx);
    c.y = cy2;
    cy2 += h + 10;
    cards.addChild(c);
  }
  if (o.repair) {
    const t = txt(o.repair, { fontFamily: F.ui, fontWeight: '700', fontSize: 20, fill: C.paper });
    t.y = cy2 + 4;
    cards.addChild(t);
    cy2 += 34;
  }
  cards.position.set(W - CW - 70, H - 140 - cy2);
  bottom.addChild(cards);
  cards.children.forEach((c, i) => tl.from(c, { x: 700, alpha: 0, duration: 0.3, ease: 'power3.out' }, landed + 0.15 + i * 0.07));

  // ---- 7. confetti, once (victory)
  if (won) {
    const n = calm ? 0 : 70;
    const colors = [C.pink, C.yellow, C.mint, C.cyan, C.paper];
    const v = game.view;
    for (let i = 0; i < n; i++) {
      const g = new Graphics().rect(-7, -4, 14, 8).fill(colors[i % colors.length]);
      g.position.set(v.x + Math.random() * v.w, v.y - 40 - Math.random() * 300);
      g.rotation = Math.random() * Math.PI;
      root.addChild(g);
      tl.to(g, { y: v.y + v.h + 60, x: g.x + (Math.random() - 0.5) * 300, rotation: g.rotation + (Math.random() - 0.5) * 12, duration: 1.8 + Math.random() * 1.4, ease: 'power1.in', onComplete: () => g.destroy() }, landed + Math.random() * 0.5);
    }
    tl.call(() => sparkles(root, cx, cy, C.yellow, calm ? 6 : 22, 520), [], landed);
  }

  // ---- 8. CONTINUAR
  const hint = new Container();
  const ht = poster('TOCA PARA CONTINUAR', 30, C.ink);
  ht.anchor.set(0.5);
  hint.addChild(new Graphics().roundRect(-ht.width / 2 - 22, -28, ht.width + 44, 56, 8).fill(C.paper).stroke({ width: 4, color: C.ink }), ht);
  hint.position.set(cx, H - 70);
  bottom.addChild(hint);
  hint.alpha = 0;
  tl.to(hint, { alpha: 1, duration: 0.25 }, landed + 0.6);
  tl.call(() => void gsap.to(hint.scale, { x: 1.06, y: 1.06, yoyo: true, repeat: -1, duration: 0.55, ease: 'sine.inOut' }), [], landed + 0.9);

  // tap 1: finish everything · tap 2: continue
  return new Promise<void>((resolve) => {
    root.eventMode = 'static';
    root.hitArea = { contains: () => true };
    let ready = false;
    const ok = () => (ready = true);
    tl.call(ok, [], landed + 0.6);
    root.on('pointertap', () => {
      if (!ready || tl.progress() < 1) {
        tl.progress(1);
        ready = true;
        return;
      }
      root.eventMode = 'none';
      resolve();
    });
  });
}

function shake(c: Container, amp: number) {
  const x0 = c.x;
  const y0 = c.y;
  gsap
    .timeline({ onComplete: () => c.position.set(x0, y0) })
    .to(c, { x: x0 + amp, y: y0 - amp * 0.6, duration: 0.04 })
    .to(c, { x: x0 - amp * 0.8, y: y0 + amp * 0.5, duration: 0.05 })
    .to(c, { x: x0 + amp * 0.5, y: y0 - amp * 0.3, duration: 0.05 })
    .to(c, { x: x0, y: y0, duration: 0.06 });
}
