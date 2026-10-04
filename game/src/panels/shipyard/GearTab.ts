/**
 * EQUIPO tab: Reliquias (pasivas de flota: vitrina de trofeos) + Artefactos (ranuras de ESTE barco)
 * + tipos de escudo + resumen de lo que todo eso hace en batalla (gearBattleMods).
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { sfx } from '../../core/audio';
import { toast } from '../../ui/modal';
import { pop } from '../../fx/juice';
import { G } from '../../state/game';
import { SHIELD_TYPES, SHIELD_UNLOCK_HINT, layoutOf, mk, shieldSlots, shieldUnlocked, shipName } from '../../state/sys/ship';
import {
  ARTIFACTS,
  RELICS,
  artifactShip,
  artifactSlots,
  equipArtifact,
  equippedArtifacts,
  gearBattleMods,
  hasArtifact,
  hasRelic,
  isNewGear,
  markGearSeen,
  syncGear,
  unequipArtifact,
  ARTIFACT_BY_ID,
  GearDef,
} from '../../state/sys/gear';
import { P, label, stamp, clickable } from '../campaign/common';
import { medal } from './art';

export class GearTab extends Container {
  constructor(
    private w: number,
    private onChange: () => void,
  ) {
    super();
    this.build();
  }

  build() {
    for (const ch of this.removeChildren()) ch.destroy({ children: true });
    syncGear();
    const w = this.w;
    const shipId = G.s.ship.active;
    const bridge = layoutOf(shipId).some((m) => m.kind === 'bridge');
    // ---------------- relics
    const h1 = txt('RELIQUIAS', { fontFamily: F.poster, fontSize: 28, fill: C.ink });
    const h1s = label(`pasivas de flota · cuentan en cualquier barco${bridge ? ' · PUENTE DE MANDO: ×1.5' : ' · con Puente de Mando: ×1.5'}`, 12, bridge ? 0x2e8a52 : P.blue);
    h1s.position.set(h1.width + 12, 14);
    this.addChild(h1, h1s);
    const cw = w / 4;
    RELICS.forEach((r, i) => {
      const c = new Container();
      c.position.set((i % 4) * cw, 40 + Math.floor(i / 4) * 124);
      this.addChild(c);
      this.relicCell(c, r, cw);
    });
    // ---------------- artifacts
    const y2 = 300;
    const slots = artifactSlots(shipId);
    const h2 = txt('ARTEFACTOS', { fontFamily: F.poster, fontSize: 28, fill: C.ink });
    h2.position.set(0, y2);
    const h2s = label(slots ? `${shipName(shipId)}: ${slots} ranura${slots > 1 ? 's' : ''} · uno por barco` : `${shipName(shipId)} no tiene ranuras (Merodeador y Bastión sí)`, 12, slots ? P.blue : C.red);
    h2s.position.set(h2.width + 12, y2 + 14);
    this.addChild(h2, h2s);
    const eq = equippedArtifacts(shipId);
    const sy = y2 + 40;
    if (slots) {
      for (let i = 0; i < slots; i++) {
        const c = new Container();
        c.position.set(i * 274, sy);
        const id = eq[i];
        const a = id ? ARTIFACT_BY_ID.get(id) : undefined;
        c.addChild(new Graphics().rect(5, 5, 262, 76).fill(C.ink).rect(0, 0, 262, 76).fill(a ? C.ink : 0xd9cdb8).stroke({ width: 3, color: C.ink }));
        if (!a) {
          const dash = new Graphics();
          for (let x = 8; x < 254; x += 14) dash.moveTo(x, 8).lineTo(x + 7, 8).moveTo(x, 68).lineTo(x + 7, 68);
          dash.stroke({ width: 2, color: 0x9a8f80 });
          const t = label(`RANURA ${i + 1} · toca un artefacto`, 14, 0x6f6a5e);
          t.anchor.set(0.5);
          t.position.set(131, 38);
          c.addChild(dash, t);
        } else {
          const md = medal(a.glyph, a.color, 26);
          md.position.set(38, 38);
          const n = txt(a.name.toUpperCase(), { fontFamily: F.bebas, fontSize: 20, fill: C.paper, letterSpacing: 1 });
          n.position.set(72, 8);
          const e = label(a.effect, 11.5, C.mint, { wordWrap: true, wordWrapWidth: 180, lineHeight: 13 });
          e.position.set(72, 32);
          const x = new Graphics().moveTo(244, 8).lineTo(254, 18).moveTo(254, 8).lineTo(244, 18).stroke({ width: 3, color: C.pink, cap: 'round' });
          c.addChild(md, n, e, x);
          clickable(c, () => {
            unequipArtifact(shipId, a.id);
            sfx('pop');
            G.save();
            this.onChange();
            this.build();
          });
        }
        this.addChild(c);
      }
    } else {
      const box = new Graphics().rect(0, sy, w, 76).fill(0xd9cdb8).stroke({ width: 3, color: C.ink });
      const t = label('Los artefactos van en barcos con ranura. Compra el Merodeador (1), el Bastión (1) o el Bajel Arcano (2).', 13, C.ink, { wordWrap: true, wordWrapWidth: w - 30 });
      t.position.set(14, sy + 16);
      this.addChild(box, t);
    }
    const ay = sy + 92;
    const aw = (w - 20) / 3;
    ARTIFACTS.forEach((a, i) => {
      const c = new Container();
      c.position.set((i % 3) * (aw + 10), ay + Math.floor(i / 3) * 104);
      this.addChild(c);
      this.artifactCell(c, a, aw, slots > 0);
    });
    // ---------------- shields + battle summary
    const by = ay + 214;
    const box = new Graphics().rect(5, by + 5, w, 112).fill(C.ink).rect(0, by, w, 112).fill(0xf6e7bf).stroke({ width: 3, color: C.ink });
    this.addChild(box);
    const mods = gearBattleMods(shipId);
    const parts: string[] = [];
    if (mods.hpMul > 1.0005) parts.push(`+${Math.round((mods.hpMul - 1) * 100)}% vida del barco`);
    if (mods.cannonAtkMul > 1.0005) parts.push(`+${Math.round((mods.cannonAtkMul - 1) * 100)}% andanada`);
    if (mods.catDmgMul > 1.0005) parts.push(`+${Math.round((mods.catDmgMul - 1) * 100)}% daño de gatos`);
    if (mods.ultStart > 0) parts.push(`${Math.round(mods.ultStart * 100)}% de ultimate al zarpar`);
    const st = txt('EN BATALLA CON ESTE BARCO', { fontFamily: F.bebas, fontSize: 18, fill: C.red, letterSpacing: 2 });
    st.position.set(12, by + 6);
    const sum = txt(parts.length ? parts.join(' · ') : 'Nada todavía: vence jefes y cumple misiones para conseguir equipo.', {
      fontFamily: F.ui,
      fontWeight: '700',
      fontSize: 15,
      fill: C.ink,
      wordWrap: true,
      wordWrapWidth: w - 24,
    });
    sum.position.set(12, by + 28);
    this.addChild(st, sum);
    // shield types (only on ships with shield slots)
    const ss = shieldSlots(shipId);
    let sx = 12;
    const sy2 = by + 78;
    const lab = txt(ss ? `ESCUDOS ×${ss}:` : 'ESCUDOS: este barco no tiene', { fontFamily: F.bebas, fontSize: 17, fill: P.blue, letterSpacing: 1 });
    lab.position.set(sx, sy2);
    this.addChild(lab);
    sx += lab.width + 8;
    if (ss)
      for (const t of SHIELD_TYPES) {
        const un = shieldUnlocked(t.id);
        const on = un && t.id === 'burbuja' && mk('shield') >= 1;
        const chip = new Container();
        const tt = txt(t.name.replace('Escudo ', '').toUpperCase(), { fontFamily: F.bebas, fontSize: 15, fill: on ? C.ink : un ? C.ink : 0x8a8478 });
        const cwid = tt.width + 14;
        chip.addChild(new Graphics().roundRect(0, 0, cwid, 22, 4).fill(on ? C.mint : un ? C.paper : 0xd2ccbe).stroke({ width: 2, color: on ? C.ink : 0x8a8478 }));
        tt.position.set(7, 2);
        chip.addChild(tt);
        chip.position.set(sx, sy2);
        sx += cwid + 6;
        clickable(chip, () => {
          sfx(un ? 'click' : 'error');
          toast(`${t.name}: ${un ? t.rule : SHIELD_UNLOCK_HINT[t.id] ?? 'bloqueado'}`, { color: un ? C.mint : C.paper, icon: un ? 'star' : 'lock' });
        });
        this.addChild(chip);
        if (sx > w - 40) break;
      }
    // relics/artifacts seen now
    gsap.delayedCall(1.2, () => markGearSeen([...RELICS, ...ARTIFACTS].map((x) => x.id)));
  }

  private relicCell(c: Container, r: GearDef, w: number) {
    const own = hasRelic(r.id);
    const md = medal(r.glyph, r.color, 30, { locked: !own, ring: own ? C.ink : 0x45455a });
    md.position.set(w / 2, 34);
    c.addChild(md);
    const n = txt(r.name.toUpperCase(), { fontFamily: F.bebas, fontSize: 15, fill: own ? C.ink : 0x8a8478, align: 'center', wordWrap: true, wordWrapWidth: w - 8, lineHeight: 15 });
    n.anchor.set(0.5, 0);
    n.position.set(w / 2, 68);
    c.addChild(n);
    const e = label(own ? r.effect : r.future ? `${r.source} · PRÓXIMAMENTE` : r.source, 10.5, own ? 0x2e8a52 : P.blue, { align: 'center', wordWrap: true, wordWrapWidth: w - 10, lineHeight: 12 });
    e.anchor.set(0.5, 0);
    e.position.set(w / 2, 68 + n.height + 1);
    c.addChild(e);
    if (own && isNewGear(r.id)) {
      const nb = stamp('¡NUEVO!', C.pinkHot, 12, 0.18);
      nb.position.set(w / 2 + 34, 56);
      c.addChild(nb);
      gsap.from(nb.scale, { x: 2, y: 2, duration: 0.25, ease: 'back.out(3)' });
    }
    clickable(c, () => {
      sfx(own ? 'click' : 'error');
      toast(own ? `${r.name}: ${r.effect}` : `${r.name}: ${r.source}`, { icon: own ? 'crown' : 'lock', color: own ? C.yellow : C.paper, sub: r.lore ? `“${r.lore}”` : undefined });
    });
  }

  private artifactCell(c: Container, a: GearDef, w: number, shipHasSlots: boolean) {
    const own = hasArtifact(a.id);
    const shipId = G.s.ship.active;
    const where = own ? artifactShip(a.id) : null;
    const here = where === shipId;
    const fill = !own ? 0xd2ccbe : here ? C.ink : C.paper;
    const fg = !own ? 0x8a8478 : here ? C.paper : C.ink;
    c.addChild(new Graphics().rect(4, 4, w, 94).fill(C.ink).rect(0, 0, w, 94).fill(fill).stroke({ width: here ? 4 : 2.5, color: here ? C.pinkHot : C.ink }));
    const md = medal(a.glyph, a.color, 20, { locked: !own, ring: own ? C.ink : 0x8a8478 });
    md.position.set(26, 28);
    const n = txt(a.name.toUpperCase(), { fontFamily: F.bebas, fontSize: 15, fill: fg, wordWrap: true, wordWrapWidth: w - 56, lineHeight: 15 });
    n.position.set(52, 6);
    const e = label(own ? a.effect : a.source, 10.5, own ? (here ? C.mint : 0x2e8a52) : P.blue, { wordWrap: true, wordWrapWidth: w - 14, lineHeight: 12 });
    e.position.set(8, 54);
    c.addChild(md, n, e);
    if (own) {
      const st = txt(here ? 'EQUIPADO' : where ? `EN ${shipName(where).toUpperCase()}` : 'LIBRE', { fontFamily: F.bebas, fontSize: 13, fill: here ? C.yellow : where ? C.red : 0x2e8a52, letterSpacing: 1 });
      st.position.set(52, 6 + n.height);
      c.addChild(st);
      if (isNewGear(a.id)) {
        const nb = stamp('¡NUEVO!', C.pinkHot, 11, -0.12);
        nb.position.set(w - 34, 82);
        c.addChild(nb);
      }
    }
    clickable(c, () => {
      if (!own) {
        sfx('error');
        toast(`${a.name}: ${a.source}`, { icon: 'lock', color: C.paper });
        return;
      }
      if (!shipHasSlots) {
        sfx('error');
        toast('Este barco no tiene ranuras de artefacto', { color: C.pink, sub: 'Merodeador y Bastión: 1 · Bajel Arcano: 2' });
        return;
      }
      if (here) unequipArtifact(shipId, a.id);
      else {
        equipArtifact(shipId, a.id);
        toast(`${a.name} equipado`, { icon: 'star', sub: a.effect });
      }
      sfx(here ? 'pop' : 'levelup', 1.2);
      pop(c, 0.1);
      G.save();
      this.onChange();
      this.build();
    });
  }
}
