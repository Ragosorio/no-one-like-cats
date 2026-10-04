/**
 * ACCESORIOS — dress your cats (one accessory per cat, small capped bonuses).
 *   AccessoryView  → the casino tab
 *   openAccessories(catUid?) → same view in a modal, for other panels (e.g. CatPanel) to open
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { sfx } from '../../core/audio';
import { Modal, toast } from '../../ui/modal';
import { G, OwnedCat } from '../../state/game';
import { catDef } from '../../data/content';
import { elementIcon } from '../../ui/elementIcon';
import { sparkles } from '../../fx/juice';
import { ACCESSORIES, ACC_RARITY_NAME, ACC_SLOT_NAME, AccessoryDef, HOLO_BONUS, accessoryMods, bonusText, equip, equippedOn, freeCount, ownedCount, unequip } from '../../state/sys/accessories';
import { CP, CButton, clickable, heading, label, neon } from './kit';
import { drawAccessory } from './accessoryArt';
import { TIER_COL, catArt } from './prizes';
import { holoSheen } from '../../fx/sequences/gachaHolo';
import type { CasinoCtx, CasinoView } from './ctx';

const PER_PAGE = 9;

export class AccessoryView extends Container implements CasinoView {
  private sel: string | null;
  private page = 0;
  private invPage = 0;
  private catsBox = new Container();
  private detail = new Container();
  private inv = new Container();
  constructor(
    private ctx: CasinoCtx | null,
    catUid?: string,
    private ox = 360,
    private oy = 100,
  ) {
    super();
    this.sel = catUid ?? this.sortedCats()[0]?.uid ?? null;
    if (ctx) {
      const t = neon('ACCESORIOS', 84, CP.cyan);
      t.position.set(ox + 6, oy + 4);
      const s = label('Un accesorio por gato. Bonos pequeñitos con tope: estilo primero, poder después.', 18, CP.softPink);
      s.position.set(ox + 12, oy + 112);
      this.addChild(t, s);
    }
    this.addChild(this.catsBox, this.detail, this.inv);
    this.build();
  }

  private build() {
    this.buildCats();
    this.buildDetail();
    this.buildInv();
    this.ctx?.refresh();
  }
  private clear(c: Container) {
    for (const ch of c.removeChildren()) ch.destroy({ children: true });
  }

  private sortedCats(): OwnedCat[] {
    const rank = { mythic: 5, legendary: 4, epic: 3, rare: 2, common: 1 } as Record<string, number>;
    return [...G.s.cats].sort((a, b) => (rank[catDef(b.species).rarity] ?? 0) - (rank[catDef(a.species).rarity] ?? 0) || b.level - a.level);
  }

  private buildCats() {
    this.clear(this.catsBox);
    const list = this.sortedCats();
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    this.page = Math.min(this.page, pages - 1);
    const x0 = this.ox;
    const y0 = this.oy + 150;
    const cw = 150;
    const ch = 176;
    list.slice(this.page * PER_PAGE, this.page * PER_PAGE + PER_PAGE).forEach((cat, i) => {
      const c = new Container();
      c.position.set(x0 + (i % 3) * (cw + 14), y0 + Math.floor(i / 3) * (ch + 14));
      const on = cat.uid === this.sel;
      const def = catDef(cat.species);
      const g = new Graphics();
      if (on) g.rect(6, 6, cw, ch).fill(CP.cyan);
      g.rect(0, 0, cw, ch).fill(on ? CP.paper : 0x24132a).stroke({ width: on ? 4 : 3, color: on ? CP.ink : 0x4a3150, alignment: 1 });
      const art = catArt(cat.species, 150);
      art.position.set(cw / 2, 78);
      const m = new Graphics().rect(3, 3, cw - 6, ch - 46).fill(0xffffff);
      art.mask = m;
      const n = heading(cat.name.toUpperCase(), 22, on ? CP.ink : CP.paper);
      n.position.set(8, ch - 40);
      if (n.width > cw - 16) n.scale.set((cw - 16) / n.width);
      c.addChild(g, m, art, n);
      if (cat.holo) {
        const s = holoSheen(cw - 6, ch - 46, 0.6);
        s.position.set(3, 3);
        c.addChild(s);
      }
      const acc = equippedOn(cat);
      if (acc) {
        const bd = new Container();
        const bg = new Graphics().circle(0, 0, 26).fill(TIER_COL[acc.rarity]).stroke({ width: 3, color: CP.ink });
        bd.addChild(bg, drawAccessory(acc.id, 38));
        bd.position.set(cw - 22, 22);
        c.addChild(bd);
      }
      clickable(c, () => {
        this.sel = cat.uid;
        this.build();
      });
      this.catsBox.addChild(c);
    });
    if (pages > 1) {
      const pg = label(`PÁGINA ${this.page + 1}/${pages}`, 16, CP.paper);
      pg.position.set(x0 + 170, y0 + 3 * (ch + 14) + 14);
      const prev = new CButton('<', () => ((this.page = (this.page + pages - 1) % pages), this.buildCats()), { w: 60, h: 44, color: CP.paper, size: 28 });
      prev.position.set(x0, y0 + 3 * (ch + 14) + 4);
      const next = new CButton('>', () => ((this.page = (this.page + 1) % pages), this.buildCats()), { w: 60, h: 44, color: CP.paper, size: 28 });
      next.position.set(x0 + 80, y0 + 3 * (ch + 14) + 4);
      this.catsBox.addChild(prev, next, pg);
    }
    if (!list.length) {
      const t = label('Todavía no tienes gatos. ¿Cómo llegaste aquí?', 20, CP.paper);
      t.position.set(x0, y0);
      this.catsBox.addChild(t);
    }
  }

  private buildDetail() {
    this.clear(this.detail);
    const cat = G.s.cats.find((c) => c.uid === this.sel);
    const x0 = this.ox + 508;
    const y0 = this.oy + 146;
    const w = 540;
    const h = 330;
    const g = new Graphics();
    g.rect(x0 + 8, y0 + 8, w, h).fill(CP.ink);
    g.rect(x0, y0, w, h).fill(CP.paper).stroke({ width: 4, color: CP.ink, alignment: 1 });
    g.circle(x0 + 150, y0 + 165, 130).fill(CP.cyan);
    this.detail.addChild(g);
    if (!cat) return;
    const def = catDef(cat.species);
    const art = catArt(cat.species, 300);
    art.position.set(x0 + 150, y0 + 170);
    const m = new Graphics().rect(x0 + 4, y0 + 4, 300, h - 8).fill(0xffffff);
    art.mask = m;
    this.detail.addChild(m, art);
    if (cat.holo) {
      const s = holoSheen(296, h - 8, 0.7);
      s.position.set(x0 + 4, y0 + 4);
      this.detail.addChild(s);
    }
    const acc = equippedOn(cat);
    if (acc) {
      const st = new Container();
      const bg = new Graphics().circle(0, 0, 58).fill(TIER_COL[acc.rarity]).stroke({ width: 4, color: CP.ink });
      st.addChild(bg, drawAccessory(acc.id, 84));
      st.position.set(x0 + 262, y0 + 70);
      st.rotation = 0.12;
      this.detail.addChild(st);
    }
    const n = heading(cat.name.toUpperCase(), 44, CP.ink);
    n.position.set(x0 + 316, y0 + 16);
    if (n.width > 210) n.scale.set(210 / n.width);
    this.detail.addChild(n);
    def.elements.forEach((e, i) => {
      const ic = elementIcon(e, 28);
      ic.position.set(x0 + 332 + i * 32, y0 + 82);
      this.detail.addChild(ic);
    });
    const lv = label(`Nv ${cat.level}${cat.holo ? ' · HOLO' : ''}`, 16, CP.ink);
    lv.position.set(x0 + 316 + def.elements.length * 32 + 8, y0 + 72);
    this.detail.addChild(lv);
    const mods = accessoryMods(cat);
    const lines = [
      acc ? `${acc.name}` : 'Sin accesorio',
      acc ? `${ACC_SLOT_NAME[acc.slot]} · ${ACC_RARITY_NAME[acc.rarity]}` : 'Elige uno de tu inventario →',
      acc ? bonusText(acc) : '',
      cat.holo ? `HOLO: +${Math.round(HOLO_BONUS.gold * 100)}% oro · +${Math.round(HOLO_BONUS.pow * 100)}% poder · +${Math.round(HOLO_BONUS.hp * 100)}% vida` : '',
      `TOTAL: oro x${mods.goldMul.toFixed(2)} · poder x${mods.powMul.toFixed(2)} · vida x${mods.hpMul.toFixed(2)}`,
    ].filter(Boolean);
    let ly = y0 + 112;
    lines.forEach((l, i) => {
      const t = txt(l, { fontFamily: i === 0 ? F.poster : F.ui, fontWeight: '700', fontSize: i === 0 ? 28 : 15, fill: i === lines.length - 1 ? CP.pink : CP.ink, wordWrap: true, wordWrapWidth: 214, lineHeight: i === 0 ? 28 : 19 });
      t.position.set(x0 + 316, ly);
      ly += t.height + (i === 0 ? 4 : 6);
      this.detail.addChild(t);
    });
    if (acc) {
      const q = new CButton('QUITAR', () => {
        unequip(cat.uid);
        sfx('paper');
        this.build();
      }, { w: 150, h: 46, color: CP.paperDark, size: 24 });
      q.position.set(x0 + 316, y0 + h - 60);
      this.detail.addChild(q);
    }
  }

  private buildInv() {
    this.clear(this.inv);
    const x0 = this.ox + 508;
    const y0 = this.oy + 500;
    const t = heading('TU INVENTARIO', 34, CP.paper);
    t.position.set(x0, y0);
    this.inv.addChild(t);
    const owned = ACCESSORIES.filter((a) => ownedCount(a.id) > 0);
    if (!owned.length) {
      const e = label('Aún no tienes accesorios. Salen en el COFRE DEL SASTRE (Portal), en La Caja y con 3 ESTAMBRES en la Tragamichis.', 18, CP.softPink, { wordWrap: true, wordWrapWidth: 540, lineHeight: 24 });
      e.position.set(x0, y0 + 50);
      this.inv.addChild(e);
      if (this.ctx) {
        const go = new CButton('IR AL COFRE', () => this.ctx?.go('gacha', 'cofre'), { w: 240, h: 60, color: CP.yellow, size: 30 });
        go.position.set(x0, y0 + 130);
        this.inv.addChild(go);
      }
      return;
    }
    const cw = 128;
    const ch = 172;
    const pages = Math.max(1, Math.ceil(owned.length / 8));
    this.invPage = Math.min(this.invPage, pages - 1);
    owned.slice(this.invPage * 8, this.invPage * 8 + 8).forEach((a, i) => {
      const c = new Container();
      c.position.set(x0 + (i % 4) * (cw + 10), y0 + 48 + Math.floor(i / 4) * (ch + 10));
      this.invCard(c, a, cw, ch);
      this.inv.addChild(c);
    });
    if (pages > 1) {
      const pg = label(`${this.invPage + 1}/${pages}`, 16, CP.paper);
      pg.position.set(x0 + 470, y0 + 12);
      const prev = new CButton('<', () => ((this.invPage = (this.invPage + pages - 1) % pages), this.buildInv()), { w: 44, h: 36, color: CP.paper, size: 24 });
      prev.position.set(x0 + 300, y0 + 2);
      const next = new CButton('>', () => ((this.invPage = (this.invPage + 1) % pages), this.buildInv()), { w: 44, h: 36, color: CP.paper, size: 24 });
      next.position.set(x0 + 360, y0 + 2);
      this.inv.addChild(prev, next, pg);
    }
  }

  private invCard(c: Container, a: AccessoryDef, w: number, h: number) {
    const cat = G.s.cats.find((x) => x.uid === this.sel);
    const worn = cat ? equippedOn(cat)?.id === a.id : false;
    const free = freeCount(a.id);
    const g = new Graphics();
    if (worn) g.rect(5, 5, w, h).fill(CP.cyan);
    g.rect(0, 0, w, h).fill(CP.paper).stroke({ width: worn ? 4 : 3, color: CP.ink, alignment: 1 });
    g.rect(0, 0, w, 24).fill(TIER_COL[a.rarity]).stroke({ width: 3, color: CP.ink, alignment: 1 });
    const r = label(ACC_RARITY_NAME[a.rarity], 12, CP.ink, { letterSpacing: 1 });
    r.position.set(8, 4);
    const art = drawAccessory(a.id, 66);
    art.position.set(w / 2, 62);
    const n = txt(a.name.toUpperCase(), { fontFamily: F.poster, fontSize: 15, fill: CP.ink, align: 'center', wordWrap: true, wordWrapWidth: w - 10, lineHeight: 15 });
    n.anchor.set(0.5, 0);
    n.position.set(w / 2, 98);
    const b = label(`${bonusText(a)}`, 11, 0x1f2b4a, { align: 'center', wordWrap: true, wordWrapWidth: w - 8 });
    b.anchor.set(0.5, 0);
    b.position.set(w / 2, 134);
    const cnt = label(`x${ownedCount(a.id)}${free < ownedCount(a.id) ? ` · ${free} libre${free === 1 ? '' : 's'}` : ''}`, 11, CP.pink);
    cnt.anchor.set(1, 0);
    cnt.position.set(w - 6, 5);
    c.addChild(g, r, cnt, art, n, b);
    clickable(c, () => {
      if (!cat) return;
      if (worn) return;
      if (free <= 0) {
        sfx('error');
        toast('Todas tus copias están en uso. Quítasela a otro gato primero.', { color: CP.paper });
        return;
      }
      if (equip(cat.uid, a.id)) {
        sfx('levelup');
        sparkles(c.parent ?? c, c.x + w / 2, c.y + h / 2, TIER_COL[a.rarity], 12, 120);
        gsap.fromTo(c.scale, { x: 1.12, y: 1.12 }, { x: 1, y: 1, duration: 0.4, ease: 'back.out(3)' });
        this.ctx?.say('accessory');
        this.build();
      }
    });
  }
}

/** open the accessory dresser in a modal (for CatPanel / others) */
export function openAccessories(catUid?: string): Modal {
  const m = new Modal('Accesorios', 1130, 900, { color: CP.night, band: CP.ink, bandText: CP.paper, subtitle: 'UN ACCESORIO POR GATO · BONOS PEQUEÑOS CON TOPE' });
  const v = new AccessoryView(null, catUid, 0, -140);
  m.body.addChild(v);
  return m.open();
}
