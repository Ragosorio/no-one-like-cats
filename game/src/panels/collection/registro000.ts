/**
 * REGISTRO 000 — the Catdex card nobody wrote (Parte II · Oleada 1, H32; docs/part-ii/05 §5.3).
 * It sits BEFORE Nº01 once H31 is done. It is NOT a species: no CATS entry, no count, no filters,
 * no catQuery. Static and glitch only; opening it emits `feature_registro000` (Catdex.ts calls
 * openRegistro000). Texts: ui/story/rupturasScript.ts.
 */
import { Container, Graphics, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../ui/theme';
import { Button, poster, txt } from '../../ui/widgets';
import { G } from '../../state/game';
import { folioRevealed } from '../../state/sys/rupturas';
import { REGISTRO_000 } from '../../ui/story/rupturasScript';
import { GlitchText, chip } from './ui';
import { fitText } from './CatCard';

/** TV static over a rect (redrawn on twos; stops with its card) */
class Static extends Graphics {
  private acc = 0;
  constructor(
    private w: number,
    private h: number,
    private bars = 26,
  ) {
    super();
    this.draw();
    Ticker.shared.add(this.tick, this);
  }
  private draw() {
    this.clear();
    for (let i = 0; i < this.bars; i++) {
      const y = Math.random() * this.h;
      const bh = 1 + Math.random() * 4;
      const x = Math.random() * this.w * 0.4;
      this.rect(x, y, Math.min(this.w - x, this.w * (0.3 + Math.random() * 0.7)), bh).fill({ color: Math.random() < 0.15 ? C.cyan : C.paper, alpha: 0.05 + Math.random() * 0.22 });
    }
  }
  private tick(t: Ticker) {
    this.acc += t.deltaMS;
    if (this.acc < 1000 / 12) return;
    this.acc = 0;
    this.draw();
  }
  override destroy(o?: Parameters<Graphics['destroy']>[0]) {
    Ticker.shared.remove(this.tick, this);
    super.destroy(o);
  }
}

function staticPanel(w: number, h: number, big: boolean) {
  const c = new Container();
  c.addChild(new Graphics().rect(0, 0, w, h).fill(0x0b0a0c).stroke({ width: big ? 6 : 3, color: C.ink, alignment: 1 }));
  const s = new Static(w, h, big ? 70 : 26);
  c.addChild(s);
  // the cat that isn't there: a silhouette made of static (never a real painting)
  const sil = new Graphics();
  const cx = w / 2;
  const cy = h * 0.5;
  const r = Math.min(w, h) * 0.22;
  sil.ellipse(cx, cy + r * 0.5, r * 0.95, r * 0.75).fill({ color: C.paper, alpha: 0.07 });
  sil.circle(cx, cy - r * 0.45, r * 0.55).fill({ color: C.paper, alpha: 0.07 });
  sil.poly([cx - r * 0.5, cy - r * 0.75, cx - r * 0.3, cy - r * 1.25, cx - r * 0.12, cy - r * 0.85]).fill({ color: C.paper, alpha: 0.07 });
  sil.poly([cx + r * 0.5, cy - r * 0.75, cx + r * 0.3, cy - r * 1.25, cx + r * 0.12, cy - r * 0.85]).fill({ color: C.paper, alpha: 0.07 });
  c.addChild(sil);
  gsap.to(sil, { alpha: 0.25, duration: 0.09, repeat: -1, yoyo: true, repeatDelay: 2.4, ease: 'steps(1)' });
  const g = new GlitchText('000', { fontFamily: F.glitch, fontSize: big ? 150 : 52, fill: C.paper }, big ? 6 : 3);
  g.position.set(cx, h * (big ? 0.42 : 0.44));
  c.addChild(g);
  return c;
}

/** the grid card (same size as a CatCard) */
export function registroCard(w: number, h: number) {
  const c = new Container();
  c.addChild(new Graphics().rect(5, 5, w, h).fill(C.pinkHot));
  c.addChild(staticPanel(w, h, false));
  const lab = txt(REGISTRO_000.title, { fontFamily: F.ui, fontWeight: '700', fontSize: 13, fill: C.paper, letterSpacing: 2 });
  lab.anchor.set(0.5, 1);
  lab.position.set(w / 2, h - 12);
  fitText(lab, w - 16);
  const st = txt('OBSERVANDO', { fontFamily: F.ui, fontWeight: '700', fontSize: 10, fill: C.pinkHot, letterSpacing: 2 });
  st.anchor.set(0.5, 0);
  st.position.set(w / 2, 10);
  c.addChild(lab, st);
  gsap.to(st, { alpha: 0.2, duration: 0.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  return c;
}

/** the detail sheet (replaces the species sheet while open) */
export class Registro000Sheet extends Container {
  constructor(W: number, H: number, onBack: () => void) {
    super();
    const bg = new Graphics().rect(-28, -22, W + 56, H + 44).fill(C.paper);
    bg.eventMode = 'static';
    this.addChild(bg);
    this.addChild(new Graphics().rect(-28, -22, 520, H + 44).fill(0x0b0a0c));
    const noise = new Static(520, H + 44, 90);
    noise.position.set(-28, -22);
    this.addChild(noise);
    const back = new Button('‹ VOLVER', onBack, { w: 170, h: 54, size: 26, color: C.paper });
    this.addChild(back);

    const card = staticPanel(400, 540, true);
    card.position.set(40, 90);
    card.rotation = -0.025;
    this.addChild(card);
    gsap.from(card, { rotation: -0.2, alpha: 0, duration: 0.35, ease: 'back.out(1.8)' });
    const num = poster(`${REGISTRO_000.serial} / ???`, 34, C.paper);
    num.position.set(40, 650);
    const stc = chip('OBSERVANDO', { bg: C.pinkHot, fg: C.ink, size: 16, font: F.poster });
    stc.position.set(40, 700);
    this.addChild(num, stc);
    gsap.to(stc, { alpha: 0.35, duration: 0.7, repeat: -1, yoyo: true, ease: 'sine.inOut' });

    const X = 520;
    const RW = W - X;
    const name = new GlitchText(REGISTRO_000.title, { fontFamily: F.poster, fontSize: 96, fill: C.ink }, 4);
    name.position.set(X + 260, 30);
    this.addChild(name);
    const author = txt(REGISTRO_000.author, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 28, fill: C.ink, padding: 8 });
    author.position.set(X + 4, 104);
    this.addChild(author);

    // the four fields (05 §5.3): desconocida · ninguno · no aplicable · observando
    REGISTRO_000.fields.forEach(([k, v], i) => {
      const y = 176 + i * 100;
      const row = new Graphics().rect(X, y, RW - 40, 88).fill(i % 2 ? C.paper : 0xe4dacb).stroke({ width: 3, color: C.ink, alignment: 1 });
      const kt = txt(k, { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.ink, letterSpacing: 4 });
      kt.position.set(X + 20, y + 10);
      const vt = poster(v.toUpperCase(), 38, i === 3 ? C.pinkHot : C.ink);
      vt.position.set(X + 20, y + 30);
      fitText(vt, RW - 120);
      this.addChild(row, kt, vt);
      if (i === 3) {
        const dot = new Graphics().circle(0, 0, 10).fill(C.pinkHot).stroke({ width: 3, color: C.ink });
        dot.position.set(X + RW - 80, y + 44);
        this.addChild(dot);
        gsap.to(dot, { alpha: 0.15, duration: 0.5, repeat: -1, yoyo: true, ease: 'steps(1)' });
      }
    });
    const notes = [REGISTRO_000.note];
    // secret 12 («El Capítulo 2 ya sabe que existes»): it was already watching
    if (G.has('story:capitulo2')) notes.push(REGISTRO_000.watching);
    const note = txt(notes.join('\n'), { fontFamily: F.serif, fontStyle: 'italic', fontSize: 24, fill: C.ink, wordWrap: true, wordWrapWidth: RW - 80, lineHeight: 32, padding: 6 });
    note.position.set(X + 4, 590);
    this.addChild(note);
    // the static word of the Barco del Vacío, readable at last (H32)
    if (folioRevealed()) {
      const stamp = new Container();
      const t = poster(REGISTRO_000.stamp, 84, C.pinkHot, { letterSpacing: 6 });
      t.anchor.set(0.5);
      const fr = new Graphics().rect(-t.width / 2 - 18, -t.height / 2 - 4, t.width + 36, t.height + 8).stroke({ width: 6, color: C.pinkHot });
      stamp.addChild(fr, t);
      stamp.position.set(X + RW - 220, 730);
      stamp.rotation = -0.12;
      stamp.alpha = 0.85;
      this.addChild(stamp);
      gsap.from(stamp, { rotation: -0.6, alpha: 0, duration: 0.3, delay: 0.25, ease: 'back.out(2)' });
    }
  }
}
