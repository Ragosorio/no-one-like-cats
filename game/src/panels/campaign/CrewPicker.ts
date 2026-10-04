/**
 * Crew editor shared by Pre-batalla and the Shipyard: cabin slots + roster of your cats.
 * Tap a cabin then a cat (or tap a cat to add/remove). "Sugerir" = strongest cats.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { C, F, RARITY } from '../../ui/theme';
import { txt, Button } from '../../ui/widgets';
import { sfx } from '../../core/audio';
import { G } from '../../state/game';
import { catDef } from '../../data/content';
import { autoCrew, crew, crewSize, setCrew } from '../../state/sys/ship';
import { cat as getCat, catPow } from '../../state/sys/cats';
import { P, catPortrait, clickable, elIcon, label, clearChildren } from './common';
import { toast } from '../../ui/modal';

export interface CrewPickerOpts {
  width: number;
  /** cabin card height */
  slotH?: number;
  /** roster portrait size */
  rosterSize?: number;
  rosterRows?: number;
  dark?: boolean;
  onChange?: () => void;
}

export class CrewPicker extends Container {
  private selected = -1;
  constructor(
    public shipId: string,
    private o: CrewPickerOpts,
  ) {
    super();
    this.rebuild();
  }

  setShip(id: string) {
    this.shipId = id;
    this.selected = -1;
    this.rebuild();
  }

  rebuild() {
    clearChildren(this);
    const W0 = this.o.width;
    const sub = this.o.dark ? C.mint : P.blue;
    const shipId = this.shipId;
    const n = crewSize(shipId);
    const cur = crew(shipId);
    const slotH = this.o.slotH ?? 200;
    const cl = label(`TRIPULACIÓN (${cur.length}/${n}) — toca un camarote y luego un gato`, 14, sub, { letterSpacing: 1 });
    this.addChild(cl);
    const sug = new Button('SUGERIR', () => {
      setCrew(shipId, []);
      autoCrew(shipId);
      this.selected = -1;
      sfx('pop');
      this.changed();
      toast('Tripulación sugerida: los más fuertes al frente', { icon: 'paw' });
    }, { w: 160, h: 42, size: 22, color: C.mint });
    sug.position.set(W0 - 166, -14);
    this.addChild(sug);
    const y = 36;
    const slotW = Math.min(196, (W0 - (n - 1) * 12) / n);
    for (let i = 0; i < n; i++) {
      const uid = cur[i];
      const c = uid ? getCat(uid) : undefined;
      const slot = new Container();
      const sel = this.selected === i;
      const fill = sel ? C.yellow : c ? C.paper : this.o.dark ? 0x2a3a5a : 0xd9cdb8;
      const bg = new Graphics().rect(5, 5, slotW, slotH).fill(C.ink).rect(0, 0, slotW, slotH).fill(fill).stroke({ width: sel ? 5 : 3, color: C.ink });
      slot.addChild(bg);
      const cab = label(`CAMAROTE ${i + 1}`, 11, c || sel ? P.blue : sub, { letterSpacing: 2 });
      cab.position.set(8, 6);
      slot.addChild(cab);
      if (c) {
        const d0 = catDef(c.species);
        const ps = Math.min(slotH * 0.5, slotW - 36);
        const p = catPortrait(c.species, ps);
        p.position.set(slotW / 2, 24 + ps / 2 + 4);
        const nm = txt(c.name.toUpperCase(), { fontFamily: F.poster, fontSize: 22, fill: C.ink });
        nm.anchor.set(0.5, 0);
        nm.position.set(slotW / 2, 30 + ps + 2);
        if (nm.width > slotW - 10) nm.scale.set((slotW - 10) / nm.width);
        const info = label(`Nv ${c.level} · ${'★'.repeat(c.stars)} ${elIcon(d0.elements[0])}`, 13, C.ink);
        info.anchor.set(0.5, 0);
        info.position.set(slotW / 2, nm.y + 26);
        const rc = new Graphics().rect(0, slotH - 7, slotW, 7).fill(RARITY[d0.rarity]?.color ?? C.ink);
        slot.addChild(p, nm, info, rc);
      } else {
        const plus = txt('+', { fontFamily: F.poster, fontSize: 70, fill: sel ? C.ink : sub });
        plus.anchor.set(0.5);
        plus.position.set(slotW / 2, slotH / 2);
        plus.alpha = 0.6;
        slot.addChild(plus);
      }
      slot.position.set(i * (slotW + 12), y);
      clickable(slot, () => {
        sfx('click');
        if (this.selected === i && c) {
          setCrew(shipId, cur.filter((u) => u !== c.uid));
          this.selected = -1;
          this.changed();
        } else {
          this.selected = i;
          this.rebuild();
        }
      });
      this.addChild(slot);
    }
    // roster
    let ry = y + slotH + 22;
    const rl = label('TUS GATOS', 14, sub, { letterSpacing: 3 });
    rl.position.set(0, ry);
    this.addChild(rl);
    ry += 22;
    const size = this.o.rosterSize ?? 70;
    const per = Math.max(1, Math.floor((W0 + 16) / (size + 16)));
    const rows = this.o.rosterRows ?? 2;
    const cats = [...G.s.cats].sort((a, b) => catPow(b) - catPow(a));
    const busyElsewhere = new Set<string>();
    for (const [sid, list] of Object.entries(G.s.ship.crew)) if (sid !== shipId) for (const u of list) busyElsewhere.add(u);
    cats.slice(0, per * rows).forEach((c, i) => {
      const cc = new Container();
      const inCrew = cur.includes(c.uid);
      const p = catPortrait(c.species, size, { ring: inCrew ? C.pinkHot : C.ink });
      p.position.set(size / 2, size / 2);
      cc.addChild(p);
      const lv = label(`Nv${c.level}`, 12, C.paper);
      const lb = new Graphics().roundRect(-4, -2, lv.width + 8, lv.height + 4, 4).fill(C.ink);
      const lvc = new Container();
      lvc.addChild(lb, lv);
      lvc.position.set(2, size - 14);
      cc.addChild(lvc);
      if (inCrew) {
        const ck = new Graphics().circle(size - 8, 8, 12).fill(C.pinkHot).stroke({ width: 3, color: C.ink });
        ck.moveTo(size - 14, 8).lineTo(size - 9, 13).lineTo(size - 2, 3).stroke({ width: 3, color: C.ink });
        cc.addChild(ck);
      } else if (busyElsewhere.has(c.uid)) {
        const b = label('OTRO BARCO', 10, C.paper);
        const bb = new Graphics().rect(-3, -1, b.width + 6, b.height + 2).fill(P.blue);
        const bc = new Container();
        bc.addChild(bb, b);
        bc.position.set(size - b.width - 2, 2);
        cc.addChild(bc);
      }
      cc.position.set((i % per) * (size + 16), ry + Math.floor(i / per) * (size + 12));
      clickable(cc, () => this.pick(c.uid));
      cc.on('pointerover', () => gsap.to(cc.scale, { x: 1.08, y: 1.08, duration: 0.12 }));
      cc.on('pointerout', () => gsap.to(cc.scale, { x: 1, y: 1, duration: 0.12 }));
      this.addChild(cc);
    });
    if (cats.length > per * rows) {
      const more = label(`+${cats.length - per * rows} gatos más (los más fuertes primero)`, 14, sub);
      more.position.set(0, ry + rows * (size + 12));
      this.addChild(more);
    }
  }

  private pick(uid: string) {
    const shipId = this.shipId;
    const cur = [...crew(shipId)];
    const n = crewSize(shipId);
    const idx = cur.indexOf(uid);
    sfx('pop');
    if (this.selected >= 0) {
      const s = this.selected;
      if (idx >= 0) {
        const other = cur[s];
        cur[s] = uid;
        if (other) cur[idx] = other;
        else cur.splice(idx, 1);
      } else if (s < cur.length) cur[s] = uid;
      else cur.push(uid);
      this.selected = -1;
    } else if (idx >= 0) cur.splice(idx, 1);
    else if (cur.length < n) cur.push(uid);
    else {
      let wi = 0;
      for (let i = 1; i < cur.length; i++) if (catPow(getCat(cur[i])!) < catPow(getCat(cur[wi])!)) wi = i;
      cur[wi] = uid;
    }
    setCrew(shipId, cur.filter(Boolean));
    this.changed();
  }

  private changed() {
    this.rebuild();
    this.o.onChange?.();
  }
}
