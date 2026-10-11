/**
 * TALLER COMETA (Parte II · Oleada 3, Puerto Cometa): Escafandra's shop. State and rules: state/sys/rupturasO3.ts.
 *   - the KIT ASTRAL: your aerobarco becomes a NAVE ASTRAL (same id, name, crew, layout and history). The first one is
 *     Escafandra's gift (H50); another ship costs gold + scrap + fuel; 3 global levels (Kit Astral · Escudo de Cometa ·
 *     Velas Solares)
 *   - COMBUSTIBLE ASTRAL: the tank (gauge), the refinery's pace (offline too, up to the tank) and a pack for gold
 * Open it with openCometaShop() — from the H50 arrival (app/oleada3Flow), the void preflight, the pinned mission's IR or
 * a Puerto Cometa POI (regions/cometa.ts can call it: `import('../panels/CometaShop').then((m) => m.openCometaShop())`).
 */
import { Container, Graphics, Text, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../ui/theme';
import { txt, Button } from '../ui/widgets';
import { Modal, toast } from '../ui/modal';
import { fmt } from '../core/format';
import { sfx } from '../core/audio';
import { sparkles } from '../fx/juice';
import { G } from '../state/game';
import { shipName } from '../state/sys/ship';
import { hasFlightKit } from '../state/sys/rupturasO2';
import {
  ASTRAL_LEVELS,
  FUEL_PACK,
  FUEL_PROD,
  astralInstallCost,
  astralKitLevel,
  astralShips,
  astralUpgradeCost,
  buyFuel,
  canBuyFuel,
  canInstallAstral,
  canUpgradeAstral,
  fuel,
  fuelPackCost,
  hasAstralKit,
  installAstralKit,
  nextFuelIn,
  tankCap,
  tripCost,
  upgradeAstralKit,
} from '../state/sys/rupturasO3';
import { ASTRAL_TOAST } from '../ui/story/rupturasScriptO3';
import { label, resChip, stamp } from './campaign/common';

const INK = C.ink;
const NIGHT = 0x0b0f2c;
const CHROME = 0xc0c8d8;
const CYAN = 0x9fe8ff;
const PINK = 0xff7ab8;
const FUEL = 0x7fd8ff;

/** the code-drawn nave astral: your hull + fins, boosters and a glass dome (retro-future blueprint). on = kit installed */
export function drawNaveAstral(g: Graphics, w: number, h: number, on: boolean, t = 0): Graphics {
  g.clear();
  g.rect(0, 0, w, h).fill(NIGHT);
  // stars + scanlines
  for (let i = 0; i < 40; i++) g.circle((i * 97) % w, (i * 53) % (h - 20), i % 5 ? 1.2 : 2).fill({ color: 0xe9f0ff, alpha: 0.6 });
  for (let y = 0; y < h; y += 6) g.rect(0, y, w, 1).fill({ color: CYAN, alpha: 0.05 });
  const cx = w / 2;
  const bob = on ? Math.sin(t * 2.2) * 5 : 0;
  const deckY = h * 0.62 + bob;
  const hw = w * 0.3;
  const line = (gg: Graphics, col = on ? CHROME : CYAN, a = on ? 1 : 0.55) => gg.stroke({ width: 3, color: col, alpha: a });
  // hull (still your ship's silhouette)
  g.poly([cx - hw, deckY, cx + hw, deckY, cx + hw * 0.8, deckY + 42, cx - hw * 0.84, deckY + 42]).fill({ color: on ? 0x3a4466 : CYAN, alpha: on ? 1 : 0.1 });
  line(g.poly([cx - hw, deckY, cx + hw, deckY, cx + hw * 0.8, deckY + 42, cx - hw * 0.84, deckY + 42]));
  // glass dome (the bridge) and a little mast with a neon beacon
  const dr = Math.min(hw * 0.22, h * 0.24);
  if (on) g.moveTo(cx + hw * 0.25 - dr, deckY).arc(cx + hw * 0.25, deckY, dr, Math.PI, 0).fill({ color: CYAN, alpha: 0.25 });
  line(g.moveTo(cx + hw * 0.25 - dr, deckY).arc(cx + hw * 0.25, deckY, dr, Math.PI, 0));
  line(g.moveTo(cx - hw * 0.2, deckY).lineTo(cx - hw * 0.2, deckY - h * 0.38));
  g.circle(cx - hw * 0.2, deckY - h * 0.38, 6).fill({ color: on ? PINK : CYAN, alpha: on ? 0.6 + 0.4 * Math.abs(Math.sin(t * 3)) : 0.5 });
  // fins
  line(g.poly([cx - hw - 4, deckY + 6, cx - hw - 40, deckY - 34, cx - hw - 30, deckY + 30]));
  line(g.poly([cx + hw * 0.4, deckY + 42, cx + hw * 0.25, deckY + 74, cx + hw * 0.05, deckY + 42]));
  // boosters + exhaust
  for (const sgn of [-1, 1]) {
    const by = deckY + 26 + sgn * 0;
    const bx = cx - hw - 10;
    line(g.roundRect(bx - 46, by - 10 + sgn * 14, 46, 20, 9));
    if (on) {
      const len = 30 + Math.sin(t * 18 + sgn) * 8;
      g.poly([bx - 46, by - 7 + sgn * 14, bx - 46 - len, by + sgn * 14, bx - 46, by + 7 + sgn * 14]).fill({ color: PINK, alpha: 0.85 });
    }
  }
  // neon trim
  if (on) g.moveTo(cx - hw * 0.8, deckY + 22).lineTo(cx + hw * 0.76, deckY + 22).stroke({ width: 3, color: PINK, alpha: 0.9 });
  return g;
}

let open: CometaShop | null = null;
/** open the Taller Cometa (one at a time). Resolves when it closes. */
export function openCometaShop(): Promise<void> {
  if (open && !open.m.closed) return open.done;
  open = new CometaShop();
  return open.done;
}

class CometaShop {
  m: Modal;
  done: Promise<void>;
  private left = new Container();
  private right = new Container();
  private art = new Graphics();
  private on = false;
  private t = 0;
  private acc = 0;
  private gauge = new Graphics();
  private fuelText: Text | null = null;
  private nextText: Text | null = null;
  private sig = '';

  constructor() {
    this.m = new Modal('Taller Cometa', 1500, 830, { band: NIGHT, bandText: CYAN, subtitle: 'Escafandra cobra en Combustible Astral' });
    this.done = new Promise((res) => {
      this.m.onClose = () => {
        Ticker.shared.remove(this.tick, this);
        res();
      };
    });
    this.m.body.addChild(this.left, this.right);
    this.right.position.set(900, 0);
    this.build();
    Ticker.shared.add(this.tick, this);
    this.m.open();
  }

  private state() {
    return [fuel(), tankCap(), astralKitLevel(), astralShips().join(','), G.s.ship.active, Math.floor(G.s.gold), G.s.scrap, G.s.blueprint].join('|');
  }

  private build() {
    this.sig = this.state();
    for (const c of [this.left, this.right]) for (const ch of c.removeChildren()) ch.destroy({ children: true });
    this.art = new Graphics();
    this.gauge = new Graphics();
    this.buildKit();
    this.buildFuel();
  }

  private buildKit() {
    const L = this.left;
    const w = 860;
    const ship = G.s.ship.active;
    const on = (this.on = hasAstralKit(ship));
    const lv = astralKitLevel();
    const title = txt('KIT ASTRAL', { fontFamily: F.poster, fontSize: 40, fill: INK });
    const sub = label('Tu aerobarco aprende a navegar el vacío. Sigue siendo tu barco: mismo nombre, mismos gatos, misma historia.', 16, INK, { wordWrap: true, wordWrapWidth: w });
    sub.position.set(0, title.height + 2);
    L.addChild(title, sub);
    const cardY = sub.y + sub.height + 10;
    const ch = 190;
    this.art.position.set(0, cardY);
    drawNaveAstral(this.art, w, ch, on, this.t);
    L.addChild(this.art, new Graphics().rect(0, cardY, w, ch).stroke({ width: 4, color: INK }));
    const nm = txt(on ? `NAVE ASTRAL ${shipName(ship).toUpperCase()}` : shipName(ship).toUpperCase(), { fontFamily: F.poster, fontSize: 26, fill: on ? PINK : CYAN });
    nm.position.set(w - nm.width - 14, cardY + ch - nm.height - 8);
    L.addChild(nm);
    if (!on) {
      const st = stamp(hasFlightKit(ship) ? 'NO AGUANTA EL VACÍO' : 'NI SIQUIERA VUELA', C.pinkHot, 20, -0.06);
      st.position.set(w - 150, cardY + 30);
      L.addChild(st);
    }
    let y = cardY + ch + 12;
    if (!on) {
      const can = canInstallAstral(ship);
      const cost = astralInstallCost();
      const b = new Button(`CONVERTIR EL ${shipName(ship).toUpperCase()}`, () => this.install(b), { w, h: 70, size: 28, color: can.ok ? C.yellow : 0xcfc8b8 });
      b.position.set(0, y);
      L.addChild(b);
      y += 80;
      let note: Container;
      if (cost) {
        note = new Container();
        const parts = [resChip('gold', fmt(cost.gold), G.s.gold >= cost.gold, 24), resChip('scrap', fmt(cost.scrap), G.s.scrap >= cost.scrap, 24), resChip('flame', `${cost.fuel} combustible`, fuel() >= cost.fuel, 24, FUEL)];
        let x = 0;
        for (const p of parts) {
          p.position.set(x, 0);
          x += p.width + 22;
          note.addChild(p);
        }
      } else note = label('GRATIS: el primero va por la casa (Escafandra).', 17, C.green, { fontWeight: '700' });
      note.position.set(0, y);
      L.addChild(note);
      if (!can.ok && can.why) {
        const why = label(can.why, 15, C.red);
        why.position.set(w - why.width, y + 4);
        L.addChild(why);
      }
      y += 36;
    } else {
      const ok = label(`ESTA NAVE AGUANTA EL VACÍO. Cada viaje a una batalla astral cuesta ${tripCost()} de combustible.`, 17, C.green, { fontWeight: '700', wordWrap: true, wordWrapWidth: w });
      ok.position.set(0, y);
      L.addChild(ok);
      y += ok.height + 10;
    }
    for (const def of ASTRAL_LEVELS) {
      const row = new Container();
      row.position.set(0, y);
      const have = lv >= def.level;
      const next = lv + 1 === def.level && lv > 0;
      const rh = 100;
      row.addChild(new Graphics().rect(0, 0, w, rh).fill(have ? 0xe8f7ff : C.paper).stroke({ width: 3, color: INK }));
      const n = txt(`${def.level} · ${def.name}`, { fontFamily: F.poster, fontSize: 26, fill: have ? 0x3569a3 : INK });
      n.position.set(12, 6);
      const d = label(def.what, 15, INK, { wordWrap: true, wordWrapWidth: w - (next ? 200 : 140) });
      d.position.set(12, 40);
      row.addChild(n, d);
      if (have) {
        const st = stamp('ACTIVO', 0x3569a3, 18, -0.06);
        st.position.set(w - 62, 26);
        row.addChild(st);
      } else if (next) {
        const c = astralUpgradeCost()!;
        const can = canUpgradeAstral();
        const b = new Button('MEJORAR', () => this.upgrade(b), { w: 170, h: 50, size: 26, color: can.ok ? C.green : 0xcfc8b8 });
        b.position.set(w - 182, 8);
        row.addChild(b);
        const chips = new Container();
        const parts: Container[] = [resChip('gold', fmt(c.gold), G.s.gold >= c.gold, 20), resChip('scrap', fmt(c.scrap), G.s.scrap >= c.scrap, 20)];
        if (c.blueprint) parts.push(resChip('blueprint', fmt(c.blueprint), G.s.blueprint >= c.blueprint, 20));
        parts.push(resChip('flame', `${c.fuel} combustible`, fuel() >= c.fuel, 20, FUEL));
        let x = 0;
        for (const p of parts) {
          p.position.set(x, 0);
          x += p.width + 12;
          chips.addChild(p);
        }
        chips.position.set(12, rh - 28);
        if (chips.width > w - 210) chips.scale.set((w - 210) / chips.width);
        row.addChild(chips);
        if (!can.ok) {
          const why = label(can.why, 13, C.red);
          why.position.set(w - 182, 64);
          if (why.width > 176) why.scale.set(176 / why.width);
          row.addChild(why);
        }
      } else {
        const lock = label(lv === 0 ? 'Primero convierte tu barco' : 'Después', 14, 0x8a8170);
        lock.position.set(w - lock.width - 12, 12);
        row.addChild(lock);
      }
      L.addChild(row);
      y += rh + 8;
    }
    const naves = astralShips().map(shipName);
    const foot = label(`${naves.length ? `Naves astrales: ${naves.join(', ')}.` : 'Ninguna nave astral todavía.'} Necesitas una para las batallas en el vacío.`, 14, 0x5a5348, { wordWrap: true, wordWrapWidth: w });
    foot.position.set(0, y);
    L.addChild(foot);
  }

  private buildFuel() {
    const R = this.right;
    const w = 520;
    const title = txt('COMBUSTIBLE ASTRAL', { fontFamily: F.poster, fontSize: 40, fill: INK });
    R.addChild(title);
    const sub = label('Se refina aquí, en Puerto Cometa. Sin prisas: se llena solo, aunque no juegues.', 16, INK, { wordWrap: true, wordWrapWidth: w });
    sub.position.set(0, title.height + 2);
    R.addChild(sub);
    const gy = sub.y + sub.height + 16;
    this.gauge.position.set(0, gy);
    R.addChild(this.gauge);
    this.drawGauge();
    this.fuelText = txt('', { fontFamily: F.poster, fontSize: 44, fill: INK });
    this.fuelText.position.set(150, gy + 10);
    this.nextText = label('', 17, 0x3569a3, { fontWeight: '700', wordWrap: true, wordWrapWidth: w - 150 });
    this.nextText.position.set(150, gy + 70);
    R.addChild(this.fuelText, this.nextText);
    this.updateFuelTexts();
    const rate = label(`La refinería: +${FUEL_PROD.per} cada ${Math.round(FUEL_PROD.everyMs / 60000)} min (${Math.round((60 / (FUEL_PROD.everyMs / 60000)) * FUEL_PROD.per)} por hora). Tanque: ${tankCap()}.`, 15, INK, { wordWrap: true, wordWrapWidth: w - 150 });
    rate.position.set(150, gy + 130);
    R.addChild(rate);
    let y = gy + 300;
    const can = canBuyFuel();
    const b = new Button(`COMPRAR ${FUEL_PACK.n}`, () => this.buy(b), { w, h: 70, size: 30, color: can.ok ? C.yellow : 0xcfc8b8 });
    b.position.set(0, y);
    R.addChild(b);
    y += 80;
    const price = resChip('gold', fmt(fuelPackCost()), G.s.gold >= fuelPackCost(), 24);
    price.position.set(0, y);
    R.addChild(price);
    if (!can.ok && can.why) {
      const why = label(can.why, 15, C.red);
      why.position.set(w - why.width, y + 4);
      R.addChild(why);
    }
    y += 50;
    const trip = label(`Un viaje al vacío (una batalla astral) cuesta ${tripCost()}. Si te falta, Escafandra te vende o, en el peor de los casos, te fía: nunca te quedas varado.`, 15, 0x5a5348, { wordWrap: true, wordWrapWidth: w });
    trip.position.set(0, y);
    R.addChild(trip);
    y += trip.height + 12;
    const risk = label('Ojo: el Combustible Astral es un recurso blando. En el Modo ETERNO del casino también se apuesta (como el oro).', 14, C.red, { wordWrap: true, wordWrapWidth: w });
    risk.position.set(0, y);
    R.addChild(risk);
  }

  private drawGauge() {
    const g = this.gauge;
    g.clear();
    const gw = 120;
    const gh = 260;
    const f = fuel();
    const cap = tankCap();
    const k = Math.max(0, Math.min(1, f / cap));
    g.roundRect(6, 6, gw, gh, 22).fill(INK);
    g.roundRect(0, 0, gw, gh, 22).fill(NIGHT).stroke({ width: 4, color: INK });
    const lh = (gh - 16) * k;
    if (lh > 0) g.roundRect(8, gh - 8 - lh, gw - 16, lh, 14).fill(FUEL);
    // bubbles + level marks
    for (let i = 1; i < 4; i++) g.moveTo(gw - 26, (gh / 4) * i).lineTo(gw - 8, (gh / 4) * i).stroke({ width: 3, color: CHROME });
    if (lh > 20) for (let i = 0; i < 4; i++) g.circle(24 + ((i * 29 + this.t * 30) % (gw - 48)), gh - 14 - ((i * 37 + this.t * 50) % Math.max(10, lh - 10)), 4).fill({ color: 0xffffff, alpha: 0.6 });
    if (f > cap) g.roundRect(0, 0, gw, 20, 10).fill(PINK);
  }

  private updateFuelTexts() {
    const f = fuel();
    if (this.fuelText && !this.fuelText.destroyed) this.fuelText.text = `${f} / ${tankCap()}`;
    if (this.nextText && !this.nextText.destroyed) {
      const n = nextFuelIn();
      if (n === null) this.nextText.text = f >= tankCap() ? 'TANQUE LLENO' : 'La refinería empieza cuando llegas a Puerto Cometa.';
      else {
        const s = Math.ceil(n / 1000);
        this.nextText.text = `Siguiente unidad en ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      }
    }
  }

  private tick(t: Ticker) {
    if (this.m.closed) return;
    this.t += t.deltaMS / 1000;
    this.acc += t.deltaMS;
    if (this.acc < 250) return;
    this.acc = 0;
    if (this.state() !== this.sig) {
      this.build();
      return;
    }
    if (!this.art.destroyed) drawNaveAstral(this.art, 860, 190, this.on, this.t);
    if (!this.gauge.destroyed) this.drawGauge();
    this.updateFuelTexts();
  }

  private install(b: Button) {
    const ship = G.s.ship.active;
    if (!installAstralKit(ship)) {
      sfx('error');
      toast(canInstallAstral(ship).why || 'No se pudo convertir', { color: C.pink });
      return;
    }
    G.save();
    sfx('fanfare');
    sparkles(this.left, b.x + b.width / 2, b.y, PINK, 24, 260);
    toast(ASTRAL_TOAST.title, { icon: 'star', color: PINK, sub: ASTRAL_TOAST.sub, dur: 4 });
    this.build();
    gsap.from(this.art, { y: this.art.y + 30, duration: 0.5, ease: 'back.out(2)' });
  }

  private upgrade(b: Button) {
    if (!upgradeAstralKit()) {
      sfx('error');
      return;
    }
    G.save();
    sfx('levelup');
    sparkles(this.left, b.parent!.x + b.x + 80, b.parent!.y + b.y + 20, CYAN, 16, 180);
    this.build();
  }

  private buy(b: Button) {
    if (!buyFuel()) {
      sfx('error');
      toast(canBuyFuel().why || 'No se pudo', { color: C.pink });
      return;
    }
    G.save();
    sfx('coin');
    sparkles(this.right, b.x + b.width / 2, b.y, FUEL, 14, 160);
    this.build();
  }
}

(globalThis as unknown as { __cometa: unknown }).__cometa = { openCometaShop };
