/**
 * ARMAS tab: weapon type per cannon slot (sidegrades; power comes from the Armas Mk).
 * Slot chips (hover = highlight on the plan) + one card per weapon type; locked ones are teasers.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { icon } from '../../ui/icons';
import { sfx } from '../../core/audio';
import { toast } from '../../ui/modal';
import { CONTENT } from '../../data/content';
import { CELL } from '../../battle/ship';
import { WEAPON_TYPES, WeaponType } from '../../battle/weapons';
import { G } from '../../state/game';
import { WEAPON_UNLOCK_HINT, cannonCount, setWeapon, shipName, weaponUnlocked, weaponsOf } from '../../state/sys/ship';
import { P, label, stamp, clickable } from '../campaign/common';
import { weaponGlyph } from './art';
import { elementIcon } from '../../ui/elementIcon';
import { pop } from '../../fx/juice';

const SYNERGY = new Map(
  ((CONTENT.modules as { families?: { weapon?: { types?: { id: string; synergy: string }[] } } })?.families?.weapon?.types ?? []).map((t) => [t.id, t.synergy]),
);
const STATUS_ES: Record<string, string> = { burning: 'ARDIENDO', charged: 'CARGADO', wet: 'MOJADO', cursed: 'MALDITO', frozen: 'CONGELADO' };

function stats(w: WeaponType) {
  const parts = [`DAÑO ${w.dmg}`, `RADIO ${(w.shot.radius / CELL).toFixed(1)}`];
  if (w.shot.projectiles && w.shot.projectiles > 1) parts.push(`×${w.shot.projectiles}`);
  if (w.shot.pierce) parts.push(w.shot.pierce > 9 ? 'PERFORA TODO' : `PERFORA ${w.shot.pierce}`);
  for (const s of w.shot.statuses ?? []) parts.push(STATUS_ES[s.id] ?? s.id.toUpperCase());
  if (w.oncePerBattle) parts.push('1/BATALLA');
  return parts.join(' · ');
}

export interface WeaponsOpts {
  w: number;
  h: number;
  slot: number;
  onHover: (slot: number | null) => void;
  onChange: () => void;
}

export class WeaponsTab extends Container {
  slot: number;
  constructor(private o: WeaponsOpts) {
    super();
    this.slot = o.slot;
    this.build();
  }

  select(slot: number) {
    this.slot = slot;
    this.build();
  }

  build() {
    for (const ch of this.removeChildren()) ch.destroy({ children: true });
    const w = this.o.w;
    const shipId = G.s.ship.active;
    const n = cannonCount(shipId);
    const list = weaponsOf(shipId);
    if (this.slot >= n) this.slot = 0;
    const head = label(`RANURAS DE CAÑÓN · ${shipName(shipId).toUpperCase()} (${n})`, 14, P.blue, { letterSpacing: 2 });
    this.addChild(head);
    // slot chips
    const gap = 10;
    const cw = Math.min(150, (w - gap * (n - 1)) / Math.max(1, n));
    for (let i = 0; i < n; i++) {
      const c = new Container();
      c.position.set(i * (cw + gap), 24);
      const sel = i === this.slot;
      c.addChild(new Graphics().rect(5, 5, cw, 92).fill(C.ink).rect(0, 0, cw, 92).fill(sel ? C.yellow : C.paper).stroke({ width: sel ? 5 : 3, color: C.ink }));
      const nb = txt(String(i + 1), { fontFamily: F.poster, fontSize: 22, fill: C.ink });
      nb.position.set(8, 2);
      const gl = weaponGlyph(list[i], 44);
      gl.position.set(cw / 2 + 6, 40);
      const name = WEAPON_TYPES.find((x) => x.id === list[i])?.name ?? 'Cañón';
      const t = txt(name.toUpperCase(), { fontFamily: F.bebas, fontSize: cw < 110 ? 15 : 18, fill: C.ink, align: 'center', wordWrap: true, wordWrapWidth: cw - 8, lineHeight: 16 });
      t.anchor.set(0.5, 0);
      t.position.set(cw / 2, 64);
      c.addChild(nb, gl, t);
      c.on('pointerover', () => this.o.onHover(i));
      c.on('pointerout', () => this.o.onHover(null));
      clickable(c, () => {
        sfx('click');
        this.select(i);
        this.o.onHover(i);
      });
      this.addChild(c);
    }
    const hint = label('Elige ranura → elige arma. Los cañones disparan SOLOS en la andanada; el daño lo pone el Mk de Armas.', 12, P.blue, { wordWrap: true, wordWrapWidth: w });
    hint.position.set(0, 128);
    this.addChild(hint);
    // weapon cards
    const colW = (w - 14) / 2;
    const cardH = 148;
    WEAPON_TYPES.forEach((wt, i) => {
      const c = new Container();
      c.position.set((i % 2) * (colW + 14), 166 + Math.floor(i / 2) * (cardH + 10));
      this.addChild(c);
      this.buildCard(c, wt, colW, cardH, list[this.slot] === wt.id, list.filter((x) => x === wt.id).length);
    });
  }

  private buildCard(c: Container, wt: WeaponType, w: number, h: number, inSlot: boolean, onShip: number) {
    const unlocked = weaponUnlocked(wt.id);
    const fill = !unlocked ? 0x2a2a35 : inSlot ? C.ink : C.paper;
    const fg = !unlocked ? 0x9a9ab0 : inSlot ? C.paper : C.ink;
    c.addChild(new Graphics().rect(5, 5, w, h).fill(C.ink).rect(0, 0, w, h).fill(fill).stroke({ width: inSlot ? 4 : 3, color: inSlot ? C.pinkHot : C.ink }));
    const disc = new Graphics().circle(44, 50, 34).fill(unlocked ? (inSlot ? 0x2a2a35 : 0xe9dcc1) : 0x1f1f28).stroke({ width: 3, color: C.ink });
    const gl = weaponGlyph(wt.id, 52, unlocked ? {} : { mono: 0x45455a });
    gl.position.set(44, 50);
    c.addChild(disc, gl);
    const nm = txt(wt.name.toUpperCase(), { fontFamily: F.poster, fontSize: 21, fill: fg });
    nm.position.set(88, 6);
    c.addChild(nm);
    if (wt.shot.element !== 'neutral') {
      // element badge on the barrel disc (Mortero = fuego, Tesla = tormenta…)
      const eb = elementIcon(wt.shot.element, 26);
      eb.position.set(72, 78);
      if (!unlocked) eb.alpha = 0.35;
      c.addChild(eb);
    }
    if (unlocked) {
      const st = txt(stats(wt), { fontFamily: F.bebas, fontSize: 15, fill: inSlot ? C.yellow : C.red, letterSpacing: 1, wordWrap: true, wordWrapWidth: w - 96 });
      st.position.set(88, 36);
      const d = label(wt.desc, 11.5, fg, { wordWrap: true, wordWrapWidth: w - 96, lineHeight: 13, fontWeight: '700' });
      d.position.set(88, 36 + st.height + 2);
      c.addChild(st, d);
      const syn = SYNERGY.get(wt.id);
      if (syn) {
        const s = label(`SINERGIA: ${syn}`, 10.5, inSlot ? C.mint : P.blue, { wordWrap: true, wordWrapWidth: w - 16, lineHeight: 12 });
        s.position.set(10, h - s.height - 6);
        if (s.y < 92) s.visible = false;
        c.addChild(s);
      }
      if (inSlot) {
        const sp = stamp(`RANURA ${this.slot + 1}`, C.pinkHot, 14, -0.1);
        sp.position.set(44, 96);
        c.addChild(sp);
      } else if (onShip) {
        const t = txt(`×${onShip} a bordo`, { fontFamily: F.bebas, fontSize: 15, fill: P.blue });
        t.anchor.set(1, 0);
        t.position.set(w - 8, 8);
        c.addChild(t);
      }
      clickable(c, () => this.equip(wt, c));
      const baseY = c.y;
      c.on('pointerover', () => !inSlot && gsap.to(c, { y: baseY - 4, duration: 0.1 }));
      c.on('pointerout', () => gsap.to(c, { y: baseY, duration: 0.1 }));
    } else {
      const q = txt('???', { fontFamily: F.glitch, fontSize: 26, fill: 0x6a6a80 });
      q.position.set(88, 34);
      const lk = icon('lock', 20);
      lk.position.set(98, h - 40);
      const hint = label(WEAPON_UNLOCK_HINT[wt.id] ?? 'Bloqueado', 12, C.yellow, { wordWrap: true, wordWrapWidth: w - 120, lineHeight: 14 });
      hint.position.set(112, h - 52);
      c.addChild(q, lk, hint);
      clickable(c, () => {
        sfx('error');
        toast(`${wt.name}: ${WEAPON_UNLOCK_HINT[wt.id] ?? 'bloqueado'}`, { color: C.paper, icon: 'lock' });
      });
    }
  }

  private equip(wt: WeaponType, card: Container) {
    const shipId = G.s.ship.active;
    if (weaponsOf(shipId)[this.slot] === wt.id) return;
    if (!setWeapon(shipId, this.slot, wt.id)) {
      sfx('error');
      return;
    }
    G.save();
    sfx('levelup', 1.3);
    pop(card, 0.12);
    toast(`Cañón ${this.slot + 1}: ${wt.name}`, { icon: 'star', sub: 'Lo verás en la próxima andanada' });
    this.o.onChange();
    this.build();
  }
}
