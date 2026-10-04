/**
 * Reparación (GDD 2.9.11): the active ship has a green repair clock. Poster modal with the clock,
 * "Acelerar con Ronroneo", "Zarpar con otro barco" (any owned ship not in repair) or wait.
 */
import { Container, Graphics, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { Modal } from '../../ui/modal';
import { Button, txt, poster, Bar } from '../../ui/widgets';
import { C, F } from '../../ui/theme';
import { icon } from '../../ui/icons';
import { G } from '../../state/game';
import { fmtTime } from '../../core/format';
import { repairTimer, isRepairing } from '../../state/sys/campaign';
import { setActiveShip, shipName } from '../../state/sys/ship';
import { sfx } from '../../core/audio';

export function openRepairGate(): Promise<boolean> {
  return new Promise((resolve) => {
    const m = new Modal('Barco en reparación', 1080, 600, { band: C.inkBlue });
    let done = false;
    const finish = (sail: boolean) => {
      if (done) return;
      done = true;
      Ticker.shared.remove(tick);
      m.onClose = undefined;
      m.close();
      resolve(sail);
    };
    m.onClose = () => {
      if (!done) {
        done = true;
        Ticker.shared.remove(tick);
        resolve(false);
      }
    };
    const b = m.body;
    const ship = G.s.ship.active;
    // blueprint-ish card with a wrench
    const card = new Container();
    const bg = new Graphics().rect(0, 0, 420, 300).fill(0x1f2b4a).stroke({ width: 4, color: C.ink });
    for (let x = 20; x < 420; x += 28) bg.moveTo(x, 0).lineTo(x, 300).stroke({ width: 1, color: 0x3569a3, alpha: 0.5 });
    for (let y = 20; y < 300; y += 28) bg.moveTo(0, y).lineTo(420, y).stroke({ width: 1, color: 0x3569a3, alpha: 0.5 });
    const wrench = new Graphics();
    wrench.roundRect(-14, -90, 28, 150, 10).fill(0xb9b2a0).stroke({ width: 5, color: C.ink });
    wrench.circle(0, -100, 38).fill(0xb9b2a0).stroke({ width: 5, color: C.ink });
    wrench.rect(-14, -146, 28, 40).fill(0x1f2b4a);
    wrench.position.set(210, 170);
    wrench.rotation = 0.6;
    gsap.to(wrench, { rotation: 0.3, duration: 0.35, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    const nm = poster(shipName(ship).toUpperCase(), 40, C.paper);
    nm.position.set(20, 12);
    card.addChild(bg, wrench, nm);
    b.addChild(card);
    const clock = poster('0:00', 110, C.ink);
    clock.position.set(460, -10);
    const lbl = txt('Reloj verde: corre aunque no estés. Las victorias lo aceleran con Ronroneo.', { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.ink, wordWrap: true, wordWrapWidth: 540 });
    lbl.position.set(464, 130);
    const bar = new Bar(540, 26, C.green, C.paperDark);
    bar.position.set(464, 210);
    b.addChild(clock, lbl, bar);
    const purrBtn = new Button('ACELERAR CON RONRONEO', () => {
      const t = repairTimer();
      if (!t) return finish(true);
      const used = G.spendPurrOn(t);
      if (used <= 0) {
        sfx('error');
        return;
      }
      sfx('purr');
      if (!isRepairing()) finish(true);
    }, { w: 540, h: 70, size: 30, color: C.mint });
    purrBtn.position.set(464, 262);
    const ic = icon('clock', 34);
    ic.position.set(30, 35);
    purrBtn.face.addChild(ic);
    b.addChild(purrBtn);
    // other ships
    const others = G.s.ship.owned.filter((s) => s !== ship && !isRepairing(s));
    others.slice(0, 3).forEach((s, i) => {
      const btn = new Button(`ZARPAR CON ${shipName(s).toUpperCase()}`, () => {
        setActiveShip(s);
        finish(true);
      }, { w: 330, h: 64, size: 24, color: C.yellow });
      btn.position.set(i * 344, 360);
      b.addChild(btn);
    });
    if (!others.length) {
      const t = txt('No tienes otro barco libre: espera o acelera con Ronroneo.', { fontFamily: F.ui, fontWeight: '700', fontSize: 20, fill: C.ink });
      t.position.set(0, 378);
      b.addChild(t);
    }
    const wait = new Button('ESPERAR', () => finish(false), { w: 220, h: 64, size: 28, color: C.paper });
    wait.position.set(m.innerW - 220, 360);
    b.addChild(wait);
    const tick = () => {
      const t = repairTimer();
      if (!t) {
        clock.text = '¡LISTO!';
        bar.set(1);
        purrBtn.setText('¡ZARPAR!');
        return;
      }
      clock.text = fmtTime(t.leftMs);
      bar.set(1 - t.leftMs / Math.max(1, t.totalMs));
      purrBtn.disabled = G.s.purr <= 0.01;
    };
    tick();
    Ticker.shared.add(tick);
    m.open();
  });
}
