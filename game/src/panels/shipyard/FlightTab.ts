/**
 * VUELO tab (Parte II · Oleada 2): the KIT DE VUELO from Corona Celeste turns YOUR ship into an aerobarco — same id,
 * name, crew, layout and history; it just floats. Required for sky battles (app/oleada2Flow skyPreflight).
 *   - the blueprint card: the active ship with (or without) its balloon and propellers
 *   - INSTALAR on the active ship (the first one is the mechanic's gift; another ship costs a little)
 *   - 3 levels (global, like Mk): Kit de Vuelo · Estabilizadores · Ancla de Nube
 * State and rules: state/sys/rupturasO2.ts. The tab only exists once the kit was offered (H43).
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../ui/theme';
import { txt, Button } from '../../ui/widgets';
import { fmt } from '../../core/format';
import { sfx } from '../../core/audio';
import { toast } from '../../ui/modal';
import { sparkles } from '../../fx/juice';
import { G } from '../../state/game';
import { shipName } from '../../state/sys/ship';
import { KIT_LEVELS, canInstall, canUpgradeKit, flightKitLevel, hasFlightKit, installCost, installFlightKit, kitShips, kitUpgradeCost, upgradeFlightKit } from '../../state/sys/rupturasO2';
import { KIT_TOAST } from '../../ui/story/rupturasScriptO2';
import { label, resChip, stamp } from '../campaign/common';

const INK = C.ink;
const BLUE = 0x13224a;
const CHALK = 0xe9f0ff;
const BRASS = 0xf0b44c;

/** the code-drawn aerobarco: hull silhouette + balloon + propellers (blueprint style). `on` = the kit is installed */
export function aerobarcoArt(w: number, h: number, on: boolean, t = 0): Graphics {
  return drawAerobarco(new Graphics(), w, h, on, t);
}
/** draw the aerobarco into `g` (cleared first): one Graphics redrawn on twos, never a new one per frame */
export function drawAerobarco(g: Graphics, w: number, h: number, on: boolean, t = 0): Graphics {
  g.clear();
  const cx = w / 2;
  const deckY = h * 0.72;
  const hw = w * 0.34;
  // blueprint grid
  g.rect(0, 0, w, h).fill(BLUE);
  for (let x = 0; x <= w; x += 24) g.moveTo(x, 0).lineTo(x, h).stroke({ width: 1, color: CHALK, alpha: 0.12 });
  for (let y = 0; y <= h; y += 24) g.moveTo(0, y).lineTo(w, y).stroke({ width: 1, color: CHALK, alpha: 0.12 });
  // clouds under it (it floats)
  for (let i = 0; i < 5; i++) g.ellipse(cx - w * 0.38 + i * w * 0.19, h - 14, 46, 16).fill({ color: CHALK, alpha: 0.18 });
  const bob = on ? Math.sin(t * 2) * 4 : 0;
  // hull
  const keel = Math.min(46, h - deckY - 10);
  g.poly([cx - hw, deckY + bob, cx + hw, deckY + bob, cx + hw * 0.78, deckY + keel + bob, cx - hw * 0.82, deckY + keel + bob]).fill({ color: CHALK, alpha: 0.12 }).stroke({ width: 3, color: CHALK });
  g.moveTo(cx - hw * 0.6, deckY + 22 + bob).lineTo(cx + hw * 0.6, deckY + 22 + bob).stroke({ width: 1.5, color: CHALK, alpha: 0.6 });
  // mast
  g.moveTo(cx, deckY + bob).lineTo(cx, deckY - h * 0.28 + bob).stroke({ width: 3, color: CHALK });
  const env = { y: deckY - h * 0.48 + bob, rx: hw * 0.92, ry: h * 0.16 };
  const dash = !on;
  const stroke = (gg: Graphics) => gg.stroke({ width: 3, color: on ? BRASS : CHALK, alpha: dash ? 0.55 : 1 });
  // balloon envelope + ribs
  if (on) g.ellipse(cx, env.y, env.rx, env.ry).fill({ color: BRASS, alpha: 0.45 });
  stroke(g.ellipse(cx, env.y, env.rx, env.ry));
  for (const k of [-0.5, 0, 0.5]) stroke(g.moveTo(cx + env.rx * k, env.y - env.ry * Math.sqrt(1 - k * k)).quadraticCurveTo(cx + env.rx * k * 1.2, env.y, cx + env.rx * k, env.y + env.ry * Math.sqrt(1 - k * k)));
  // ropes
  for (const k of [-0.7, -0.25, 0.25, 0.7]) g.moveTo(cx + env.rx * k * 0.95, env.y + env.ry * 0.7).lineTo(cx + hw * k * 0.9, deckY + bob).stroke({ width: 1.5, color: CHALK, alpha: on ? 0.9 : 0.45 });
  // side propellers
  for (const sgn of [-1, 1]) {
    const px = cx + sgn * (hw + 22);
    const py = deckY + 14 + bob;
    stroke(g.moveTo(cx + sgn * hw, py).lineTo(px, py));
    const a = on ? t * 9 * sgn : 0.4;
    for (const d of [0, Math.PI]) stroke(g.moveTo(px, py).lineTo(px + Math.cos(a + d) * 6, py + Math.sin(a + d) * 22));
    g.circle(px, py, 4).fill(on ? BRASS : CHALK);
  }
  // tail fin
  stroke(g.poly([cx - hw - 4, deckY - 6 + bob, cx - hw - 34, deckY - 30 + bob, cx - hw - 34, deckY + 22 + bob]));
  return g;
}

export class FlightTab extends Container {
  private art = new Container();
  private artG = new Graphics();
  private artAcc = 0;
  private artT = 0;
  private artW = 0;
  private artH = 0;
  private flying = false;
  constructor(
    private w: number,
    private onChange: () => void,
  ) {
    super();
    this.build();
  }

  build() {
    for (const ch of this.removeChildren()) ch.destroy({ children: true });
    this.art = new Container();
    this.artG = new Graphics();
    const w = this.w;
    const ship = G.s.ship.active;
    const on = (this.flying = hasFlightKit(ship));
    const lv = flightKitLevel();
    // ---- header
    const title = txt('KIT DE VUELO', { fontFamily: F.poster, fontSize: 40, fill: INK });
    const sub = label('De Corona Celeste. Tu barco conserva su nombre, sus gatos y su historia: solo aprende a flotar.', 16, INK, { wordWrap: true, wordWrapWidth: w });
    sub.position.set(0, title.height + 4);
    this.addChild(title, sub);
    // ---- blueprint card
    const cardY = sub.y + sub.height + 12;
    this.artW = w;
    this.artH = 210;
    this.art.position.set(0, cardY);
    const clip = new Graphics().rect(0, cardY, w, this.artH).fill(0xffffff);
    this.art.mask = clip;
    this.addChild(this.art, clip);
    this.drawArt();
    const nm = txt(on ? `AEROBARCO ${shipName(ship).toUpperCase()}` : shipName(ship).toUpperCase(), { fontFamily: F.poster, fontSize: 26, fill: on ? BRASS : CHALK });
    nm.position.set(14, cardY + this.artH - nm.height - 10);
    this.addChild(nm);
    if (!on) {
      const st = stamp('NO VUELA', C.pinkHot, 22, -0.08);
      st.position.set(w - 86, cardY + 30);
      this.addChild(st);
    }
    // ---- install
    let y = cardY + this.artH + 14;
    if (!on) {
      const can = canInstall(ship);
      const cost = installCost();
      const b = new Button(`INSTALAR EN EL ${shipName(ship).toUpperCase()}`, () => this.install(b), { w, h: 74, size: 28, color: can.ok ? C.yellow : 0xcfc8b8 });
      b.position.set(0, y);
      this.addChild(b);
      y += 84;
      const note = cost
        ? (() => {
            const c = new Container();
            const a = resChip('gold', fmt(cost.gold), G.s.gold >= cost.gold, 24);
            const s = resChip('scrap', fmt(cost.scrap), G.s.scrap >= cost.scrap, 24);
            s.position.set(a.width + 22, 0);
            c.addChild(a, s);
            return c;
          })()
        : label('GRATIS: regalo de Hélice, la mecánica (el primero).', 17, C.green, { fontWeight: '700' });
      note.position.set(0, y);
      this.addChild(note);
      if (!can.ok && can.why) {
        const why = label(can.why, 15, C.red);
        why.position.set(w - why.width, y + 4);
        this.addChild(why);
      }
      y += 38;
    } else {
      const ok = label('ESTE BARCO VUELA. Lo usas en las batallas del cielo.', 17, C.green, { fontWeight: '700', wordWrap: true, wordWrapWidth: w });
      ok.position.set(0, y);
      this.addChild(ok);
      y += ok.height + 12;
    }
    // ---- levels
    for (const L of KIT_LEVELS) {
      const row = new Container();
      row.position.set(0, y);
      const have = lv >= L.level;
      const next = lv + 1 === L.level && lv > 0;
      const rh = 104;
      row.addChild(new Graphics().rect(0, 0, w, rh).fill(have ? 0xe7f0ff : C.paper).stroke({ width: 3, color: INK }));
      const n = txt(`${L.level} · ${L.name}`, { fontFamily: F.poster, fontSize: 26, fill: have ? 0x3e6fd8 : INK });
      n.position.set(12, 6);
      const d = label(L.what, 15, INK, { wordWrap: true, wordWrapWidth: w - (next ? 200 : 140) });
      d.position.set(12, 40);
      row.addChild(n, d);
      if (have) {
        const st = stamp('ACTIVO', 0x3e6fd8, 18, -0.06);
        st.position.set(w - 62, 26);
        row.addChild(st);
      } else if (next) {
        const c = kitUpgradeCost()!;
        const can = canUpgradeKit();
        const b = new Button('MEJORAR', () => this.upgrade(b), { w: 170, h: 52, size: 26, color: can.ok ? C.green : 0xcfc8b8 });
        b.position.set(w - 182, 10);
        row.addChild(b);
        const chips = new Container();
        const parts: Container[] = [resChip('gold', fmt(c.gold), G.s.gold >= c.gold, 20), resChip('scrap', fmt(c.scrap), G.s.scrap >= c.scrap, 20), resChip('blueprint', fmt(c.blueprint), G.s.blueprint >= c.blueprint, 20), resChip('crystal', `${c.gravity} Gravedad`, (G.s.crystals.gravity ?? 0) >= c.gravity, 20, 0x3e6fd8)];
        let x = 0;
        for (const p of parts) {
          p.position.set(x, 0);
          x += p.width + 12;
          chips.addChild(p);
        }
        chips.position.set(12, rh - 28);
        if (chips.width > w - 24) chips.scale.set((w - 24) / chips.width);
        row.addChild(chips);
        if (!can.ok) {
          const why = label(can.why, 13, C.red);
          why.position.set(w - 182, 66);
          if (why.width > 176) why.scale.set(176 / why.width);
          row.addChild(why);
        }
      } else {
        const lock = label(lv === 0 ? 'Primero instala el kit' : 'Después', 14, 0x8a8170);
        lock.position.set(w - lock.width - 12, 12);
        row.addChild(lock);
      }
      this.addChild(row);
      y += rh + 10;
    }
    // ---- footer
    const flyers = kitShips().map(shipName);
    const foot = label(`${flyers.length ? `Vuelan: ${flyers.join(', ')}.` : 'Ningún barco vuela todavía.'} Sirve para las batallas del cielo: Islas Invertidas y Corona Celeste.`, 14, 0x5a5348, { wordWrap: true, wordWrapWidth: w });
    foot.position.set(0, y);
    this.addChild(foot);
  }

  private drawArt() {
    if (this.artG.destroyed) this.artG = new Graphics();
    if (this.artG.parent !== this.art) {
      this.art.addChild(this.artG);
      this.art.addChild(new Graphics().rect(0, 0, this.artW, this.artH).stroke({ width: 4, color: INK }));
    }
    drawAerobarco(this.artG, this.artW, this.artH, this.flying, this.artT);
  }

  /** the Astillero's ticker drives the little animation (propellers, bob), on twos (~12 fps) */
  tick(dtMs: number) {
    if (!this.flying || this.destroyed) return;
    this.artT += dtMs / 1000;
    this.artAcc += dtMs;
    if (this.artAcc < 83) return;
    this.artAcc = 0;
    this.drawArt();
  }

  private install(b: Button) {
    const ship = G.s.ship.active;
    if (!installFlightKit(ship)) {
      sfx('error');
      toast(canInstall(ship).why || 'No se pudo instalar', { color: C.pink });
      return;
    }
    G.save();
    sfx('fanfare');
    sparkles(this, b.x + b.width / 2, b.y, BRASS, 24, 260);
    toast(KIT_TOAST.title, { icon: 'star', color: BRASS, sub: KIT_TOAST.sub, dur: 4 });
    this.build();
    gsap.from(this.art, { y: this.art.y + 30, duration: 0.5, ease: 'back.out(2)' });
    this.onChange();
  }

  private upgrade(b: Button) {
    if (!upgradeFlightKit()) {
      sfx('error');
      return;
    }
    G.save();
    sfx('levelup');
    sparkles(this, b.parent!.x + b.x + 80, b.parent!.y + b.y + 20, BRASS, 16, 180);
    this.build();
    this.onChange();
  }
}
