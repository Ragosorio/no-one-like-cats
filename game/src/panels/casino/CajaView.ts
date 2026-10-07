/** LA CAJA — prize counter: fichas → fixed prizes. "Canje directo, cero suspenso" (you never HAVE to gamble). */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { sfx } from '../../core/audio';
import { CAJA, CHIPS, buyCaja, chips } from '../../state/sys/casino';
import { CP, CButton, block, chipIcon, heading, label, neon, halftone } from './kit';
import { presentPrizes, prizeArt } from './prizes';
import type { CasinoCtx, CasinoView } from './ctx';

const SAMPLE: Record<string, Parameters<typeof prizeArt>[0]> = {
  food: { kind: 'food', n: 1 },
  orbs: { kind: 'orbs', n: 1 },
  prisma: { kind: 'prisma', n: 1 },
  acc: { kind: 'accessory', n: 1, ref: 'chistera' },
  ticket: { kind: 'tickets', n: 1 },
  tickets5: { kind: 'tickets', n: 5 },
  cat: { kind: 'cat', n: 1, ref: 'c_canelo' },
};

export class CajaView extends Container implements CasinoView {
  private grid = new Container();
  private busy = false;
  constructor(private ctx: CasinoCtx) {
    super();
    const t = neon('LA CAJA', 88, CP.yellow);
    t.position.set(370, 100);
    const s = heading('CANJE DIRECTO · CERO SUSPENSO', 32, CP.paper);
    s.position.set(660, 132);
    const how = label(
      `Las fichas se ganan jugando: +${CHIPS.perVictory} por victoria (+${CHIPS.perPerfect} si es perfecta), +${CHIPS.perKl} por nivel de Reino, +${CHIPS.perBoss} por jefe. Los boletos también: 1 cada ${CHIPS.victoriesPerTicket} victorias, ${CHIPS.ticketsPerKl} por nivel y ${CHIPS.ticketsPerBoss} por jefe. No hace falta apostar: aquí las cambias directo.`,
      17,
      CP.softPink,
      { wordWrap: true, wordWrapWidth: 1020, lineHeight: 23 },
    );
    how.position.set(372, 228);
    this.addChild(t, s, how, this.grid);
    this.build();
  }

  private build() {
    for (const c of this.grid.removeChildren()) c.destroy({ children: true });
    const cw = 248;
    const ch = 350;
    CAJA.forEach((it, i) => {
      const c = new Container();
      const x = 372 + (i % 4) * (cw + 14);
      const y = 296 + Math.floor(i / 4) * (ch + 22);
      c.position.set(x, y);
      const afford = chips() >= it.cost;
      const bg = new Graphics();
      bg.rect(8, 8, cw, ch).fill(CP.ink);
      bg.rect(0, 0, cw, ch).fill(CP.paper).stroke({ width: 4, color: CP.ink, alignment: 1 });
      bg.rect(0, 0, cw, 150).fill(it.id === 'cat' ? CP.pink : it.id === 'ticket' || it.id === 'tickets5' ? CP.violet : 0x24132a);
      const ht = halftone(cw, 150, CP.paper, 0.12, 12, 2);
      const art = prizeArt(SAMPLE[it.id] ?? { kind: 'tickets', n: 1 }, 120);
      art.position.set(cw / 2, 78);
      if (it.id === 'cat') {
        // mystery: ink silhouette with a question mark
        art.alpha = 0;
        const q = txt('?', { fontFamily: F.poster, fontSize: 130, fill: CP.ink });
        q.anchor.set(0.5);
        q.position.set(cw / 2, 76);
        c.addChild(bg, ht, q);
      } else c.addChild(bg, ht, art);
      const n = heading(it.name.toUpperCase(), 26, CP.ink);
      if (n.width > cw - 30) n.scale.set((cw - 30) / n.width);
      n.position.set(18, 160);
      const d = label(it.desc, 16, CP.ink, { wordWrap: true, wordWrapWidth: cw - 36, lineHeight: 21 });
      d.position.set(18, 198);
      const btn = new CButton(`${it.cost}`, () => this.buy(it.id, c), { w: cw - 36, h: 64, color: afford ? CP.yellow : CP.paperDark, size: 34, icon: chipIcon(30) });
      btn.position.set(18, ch - 84);
      btn.disabled = !afford;
      c.addChild(n, d, btn);
      this.grid.addChild(c);
    });
  }

  private async buy(id: string, card: Container) {
    if (this.busy || this.ctx.busy) return;
    const cost = CAJA.find((x) => x.id === id)?.cost ?? 0;
    this.ctx.freeze({ chips: -cost });
    const g = buyCaja(id);
    if (!g) {
      this.ctx.unfreeze();
      sfx('error');
      this.ctx.say('poor');
      return;
    }
    this.busy = true;
    this.ctx.setBusy(true);
    gsap.fromTo(card.scale, { x: 1.06, y: 0.94 }, { x: 1, y: 1, duration: 0.4, ease: 'elastic.out(1.2,0.4)' });
    this.ctx.say(g.kind === 'accessory' ? 'accessory' : 'caja');
    this.ctx.chat('caja', 1);
    this.ctx.refresh();
    await presentPrizes(this.ctx, [g], { x: card.x + 165, y: card.y + 180 }, { hold: 1200 });
    this.busy = false;
    this.ctx.setBusy(false);
    if (!this.destroyed) this.build();
  }
}
