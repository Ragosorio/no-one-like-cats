/**
 * Catdex (EDITORIAL SUIZO): contador x/54, fila de elementos, cuadrícula de 54 cartas con
 * 4 estados (sellada / silueta / rumor / registrada), filtros, ficha de detalle,
 * pestañas Sets y Grimorio de Sinergias.
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { Modal } from '../ui/modal';
import { C, F } from '../ui/theme';
import { Button, txt, poster, dotGrid, crosses } from '../ui/widgets';
import { sfx } from '../core/audio';
import { fmt } from '../core/format';
import { scenes } from '../core/scenes';
import { CATS, CONTENT, catDef } from '../data/content';
import { G } from '../state/game';
import { BAL } from '../state/econ';
import { dexStatus, setsCompleted, starNeed } from '../state/sys/cats';
import {
  dexCount,
  dexElements,
  dexTotal,
  elColor,
  elEmoji,
  elName,
  hintFor,
  isElementKnown,
  limitationText,
  ownedOf,
  possibleParents,
  printRarity,
  PrintRarity,
  reactionKnown,
  revealInfo,
  roleName,
  traitInfo,
  workerName,
} from '../state/ext/collection';
import { CatCard, rarityColor, rarityName, fitText } from './collection/CatCard';
import { ensureCatArt, portrait } from './collection/art';
import { ScrollBox, chip, elBadge, GlitchText, Tab, clickable, clearChildren, guardModal, destroyTree, killTree } from './collection/ui';
import { playCatReveal } from '../fx/sequences/catReveal';
import { slugOf } from '../art/tint';

type TabId = 'cats' | 'sets' | 'grimorio';

const MW = 1860;
const MH = 1036;
const IW = MW - 56;
const IH = MH - 130;

let current: CatdexView | null = null;

/** Open the Catdex (optionally straight to a species' detail or a tab). */
export async function openCatdex(species?: string, tab: TabId = 'cats') {
  await ensureCatArt();
  if (current && !current.modal.closed) current.modal.close();
  current = new CatdexView(tab);
  if (species) current.showDetail(species, false);
  return current;
}

class CatdexView {
  modal: Modal;
  private header = new Container();
  private page = new Container();
  private detail: Container | null = null;
  private tabs: Record<TabId, Tab>;
  private tab: TabId;
  private elFilter: string | null = null;
  private rarFilter: PrintRarity | 'secret' | null = null;
  private grid?: ScrollBox;
  private list: string[] = [];

  constructor(tab: TabId) {
    this.tab = tab;
    this.modal = new Modal('CATDEX', MW, MH, { subtitle: 'EL PRIMER MAR · REGISTRO OFICIAL DE GATOS QUE NADIE QUIERE' });
    const m = this.modal;
    guardModal(m);
    // swiss decoration behind the body
    const deco = new Container();
    const circle = new Graphics().circle(0, 0, 118).fill(C.pink);
    circle.position.set(150, 196);
    const dg = dotGrid(3, 6, 18, 2.5, C.ink);
    dg.position.set(MW - 90, 128);
    const cr = crosses(C.ink);
    cr.position.set(MW - 190, 250);
    deco.addChild(circle, dg, cr);
    m.panel.addChildAt(deco, 4);
    m.body.addChild(this.header, this.page);
    this.tabs = {
      cats: new Tab('GATOS', () => this.setTab('cats')),
      sets: new Tab('SETS', () => this.setTab('sets')),
      grimorio: new Tab('GRIMORIO', () => this.setTab('grimorio')),
    };
    this.buildHeader();
    this.setTab(tab);
    m.open();
    m.onClose = () => {
      if (current === this) current = null;
    };
  }

  // ------------------------------------------------------------ header
  private buildHeader() {
    const h = this.header;
    clearChildren(h);
    const n = dexCount();
    const big = poster(String(n), 150, C.ink, { letterSpacing: -4 });
    big.position.set(-6, -48);
    const tot = poster(`/${dexTotal()}`, 72, C.pinkHot);
    tot.position.set(big.x + big.width + 4, 34);
    const lab = txt('ESPECIES REGISTRADAS', { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.ink, letterSpacing: 3 });
    lab.position.set(2, 140);
    h.addChild(big, tot, lab);
    const bonus = txt(`+${n * 2}% ORO GLOBAL POR TU COLECCIÓN`, { fontFamily: F.ui, fontWeight: '700', fontSize: 13, fill: C.pinkHot, letterSpacing: 1 });
    bonus.position.set(2, 160);
    h.addChild(bonus);

    // element row
    const ex = 380;
    const el = txt('ELEMENTOS', { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: C.ink, letterSpacing: 4 });
    el.position.set(ex, 2);
    h.addChild(el);
    dexElements().forEach((e, i) => {
      const x = ex + 34 + i * 92;
      const y = 70;
      if (isElementKnown(e.id)) {
        const b = elBadge(e.id, 32);
        b.position.set(x, y);
        const nm = txt(e.name.toUpperCase(), { fontFamily: F.ui, fontWeight: '700', fontSize: 12, fill: C.ink, letterSpacing: 1 });
        nm.anchor.set(0.5, 0);
        nm.position.set(x, y + 40);
        h.addChild(b, nm);
      } else {
        const d = new Graphics().circle(x, y, 32).fill(C.ink).stroke({ width: 3, color: C.ink });
        const g = new GlitchText('???', { fontFamily: F.glitch, fontSize: 24, fill: C.paper }, 3);
        g.position.set(x, y);
        const nm = txt('¿?', { fontFamily: F.ui, fontWeight: '700', fontSize: 12, fill: 0x8a8070 });
        nm.anchor.set(0.5, 0);
        nm.position.set(x, y + 40);
        h.addChild(d, g, nm);
      }
    });

    // tabs + counts
    const counts: Record<TabId, string> = {
      cats: `${n}/${dexTotal()}`,
      sets: `${setsCompleted().length}/${CONTENT.catdexSets.length}`,
      grimorio: `${(CONTENT as unknown as { reactions: { id: string; name: string }[] }).reactions.filter((r) => reactionKnown(r)).length}/12`,
    };
    let tx = 1130;
    (['cats', 'sets', 'grimorio'] as TabId[]).forEach((id) => {
      const t = this.tabs[id];
      t.position.set(tx, 18);
      const c = chip(counts[id], { bg: C.ink, fg: C.paper, size: 14 });
      c.position.set(tx, 92);
      h.addChild(t, c);
      tx += t.width + 46;
    });
    for (const id of Object.keys(this.tabs) as TabId[]) this.tabs[id].active = id === this.tab;
  }

  private setTab(t: TabId) {
    this.tab = t;
    for (const id of Object.keys(this.tabs) as TabId[]) this.tabs[id].active = id === t;
    this.closeDetail(false);
    clearChildren(this.page);
    this.grid = undefined;
    if (t === 'cats') this.buildCats();
    else if (t === 'sets') this.buildSets();
    else this.buildGrimorio();
    this.page.alpha = 0;
    gsap.to(this.page, { alpha: 1, duration: 0.2 });
  }

  // ------------------------------------------------------------ cats grid
  private buildCats() {
    const p = this.page;
    const filters = new Container();
    filters.y = 186;
    p.addChild(filters);
    const mk = (label: string, active: boolean, onTap: () => void, color?: number) => {
      const c = chip(label, { bg: active ? (color ?? C.ink) : C.paper, fg: active ? C.paper : C.ink, size: 16, pad: 10 });
      clickable(c, onTap, { lift: 2 });
      return c;
    };
    let x = 0;
    const lab = txt('ELEMENTO', { fontFamily: F.ui, fontWeight: '700', fontSize: 13, fill: C.ink, letterSpacing: 3 });
    lab.position.set(0, 6);
    filters.addChild(lab);
    x = 96;
    const add = (c: Container) => {
      c.x = x;
      filters.addChild(c);
      x += c.width + 8;
    };
    add(mk('TODOS', this.elFilter === null, () => this.filter(null, this.rarFilter)));
    for (const e of dexElements()) {
      if (!isElementKnown(e.id)) continue;
      add(mk(`${e.emoji} ${e.name.toUpperCase()}`, this.elFilter === e.id, () => this.filter(e.id, this.rarFilter), elColor(e.id) === 0xffd400 ? C.ink : elColor(e.id)));
    }
    x += 26;
    const lab2 = txt('RAREZA', { fontFamily: F.ui, fontWeight: '700', fontSize: 13, fill: C.ink, letterSpacing: 3 });
    lab2.position.set(x, 6);
    filters.addChild(lab2);
    x += 78;
    add(mk('TODAS', this.rarFilter === null, () => this.filter(this.elFilter, null)));
    const rars: (PrintRarity | 'secret')[] = ['common', 'rare', 'epic', 'primordial', 'legendary', 'mythic', 'secret'];
    for (const r of rars) {
      const name = r === 'secret' ? 'SECRETO' : rarityName(r);
      const col = r === 'secret' ? C.violet : r === 'common' ? 0x6d6356 : rarityColor(r);
      add(mk(name, this.rarFilter === r, () => this.filter(this.elFilter, r), col));
    }

    // grid
    const top = 236;
    const grid = new ScrollBox(IW, IH - top, C.ink);
    grid.y = top;
    p.addChild(grid);
    this.grid = grid;
    const cols = 11;
    const cw = 150;
    const ch = 198;
    const gap = (IW - 10 - cols * cw) / (cols - 1);
    this.list = CATS.filter((c) => this.passes(c.id)).map((c) => c.id);
    this.list.forEach((id, i) => {
      const owned = ownedOf(id);
      const card = new CatCard(id, { w: cw, h: ch, stars: owned?.stars, level: owned?.level });
      const holder = new Container();
      holder.addChild(card);
      const col = i % cols;
      const row = Math.floor(i / cols);
      holder.position.set(col * (cw + gap), 12 + row * (ch + 22));
      const num = txt(`Nº${String(CATS.findIndex((c) => c.id === id) + 1).padStart(2, '0')}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 11, fill: 0x7d7264 });
      num.position.set(2, ch + 3);
      holder.addChild(num);
      holder.eventMode = 'static';
      holder.cursor = 'pointer';
      holder.on('pointerover', () => {
        gsap.to(card, { y: -8, rotation: (col % 2 ? 1 : -1) * 0.025, duration: 0.15, ease: 'back.out(2)' });
        sfx('hover');
      });
      holder.on('pointerout', () => gsap.to(card, { y: 0, rotation: 0, duration: 0.18 }));
      holder.on('pointertap', () => {
        if (grid.wasDrag) return;
        sfx('paper');
        this.showDetail(id);
      });
      grid.content.addChild(holder);
      card.alpha = 0;
      gsap.fromTo(card, { alpha: 0, y: 30 }, { alpha: 1, y: 0, duration: 0.3, delay: Math.min(0.6, i * 0.012), ease: 'back.out(1.6)' });
    });
    const rows = Math.ceil(this.list.length / cols);
    grid.setContentHeight(12 + rows * (ch + 22) + 10);
    if (!this.list.length) {
      const e = poster('NADA POR AQUÍ. TODAVÍA.', 60, C.ink);
      e.position.set(40, 60);
      grid.content.addChild(e);
    }
  }

  private passes(id: string) {
    const d = catDef(id);
    const st = dexStatus(id);
    if (this.elFilter && !d.elements.includes(this.elFilter)) return false;
    if (this.rarFilter) {
      if (this.rarFilter === 'secret') return d.secret;
      // rarity filter only matches what the player can know
      if (st === 'unknown' || st === 'silhouette') return false;
      if (printRarity(id) !== this.rarFilter) return false;
    }
    return true;
  }
  private filter(el: string | null, r: PrintRarity | 'secret' | null) {
    this.elFilter = el;
    this.rarFilter = r;
    this.setTab('cats');
  }

  // ------------------------------------------------------------ detail
  showDetail(species: string, animate = true) {
    this.closeDetail(false);
    const d = new DetailSheet(species, {
      onBack: () => this.closeDetail(true),
      onNav: (dir) => {
        const list = this.list.length ? this.list : CATS.map((c) => c.id);
        const i = list.indexOf(species);
        const next = list[(i + dir + list.length) % list.length];
        this.showDetail(next, false);
      },
      onReplay: () => this.replay(species),
      onAltar: (uid) => {
        this.modal.close();
        void import('./Altar').then((m) => m.openAltar(uid));
      },
    });
    this.detail = d;
    this.modal.body.addChild(d);
    if (animate) gsap.from(d, { x: IW + 60, duration: 0.32, ease: 'power3.out' });
  }
  private closeDetail(animate: boolean) {
    const d = this.detail;
    if (!d) return;
    this.detail = null;
    if (!animate) {
      destroyTree(d);
      return;
    }
    sfx('paper');
    killTree(d);
    gsap.to(d, { x: IW + 60, duration: 0.25, ease: 'power2.in', onComplete: () => destroyTree(d) });
  }
  private async replay(species: string) {
    const info = revealInfo(species, true, 0);
    const def = catDef(species);
    await playCatReveal(scenes.overlayLayer, {
      slug: slugOf(species),
      species,
      name: def.name,
      elements: def.elements,
      rarity: info.rarity,
      caption: info.caption,
      subtitle: info.subtitle,
      chips: info.chips,
      serial: CATS.findIndex((c) => c.id === species) + 1,
      replay: true,
    });
  }

  // ------------------------------------------------------------ sets
  private buildSets() {
    const p = this.page;
    const head = txt('COMPLETAR UN SET  →  +10 PRISMA · RONRONEO · UNA REGLA NUEVA PARA SIEMPRE', { fontFamily: F.poster, fontSize: 26, fill: C.ink });
    head.position.set(0, 186);
    p.addChild(head);
    const done = new Set(setsCompleted().map((s) => s.id));
    const colW = (IW - 20) / 2;
    const sh = 100;
    CONTENT.catdexSets.forEach((set, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const c = new Container();
      c.position.set(col * (colW + 20), 236 + row * (sh + 10));
      const complete = done.has(set.id);
      const reg = set.cats.filter((id) => G.s.catdex[id] === 'registered').length;
      const bg = new Graphics()
        .rect(5, 5, colW, sh)
        .fill(C.ink)
        .rect(0, 0, colW, sh)
        .fill(complete ? C.yellow : C.paper)
        .stroke({ width: 3, color: C.ink });
      c.addChild(bg);
      const n = Math.min(7, set.cats.length);
      const sz = n > 5 ? 48 : n > 3 ? 56 : 64;
      const membersW = n * (sz + 6);
      const mx = colW - 112 - membersW;
      const nm = poster(set.name.toUpperCase(), 30, C.ink);
      nm.position.set(16, 4);
      fitText(nm, mx - 30);
      const rule = txt(set.rule, { fontFamily: F.ui, fontSize: 15, fill: C.ink, wordWrap: true, wordWrapWidth: mx - 36, lineHeight: 18 });
      rule.position.set(16, 50);
      c.addChild(nm, rule);
      // members
      set.cats.slice(0, 7).forEach((id, k) => {
        const st = dexStatus(id);
        const x = mx + k * (sz + 6);
        const frame = new Graphics().rect(x, (sh - sz) / 2, sz, sz).fill(st === 'registered' ? 0xffffff : C.paperDark).stroke({ width: 2, color: C.ink });
        c.addChild(frame);
        if (st !== 'unknown') {
          const s = portrait(id, sz * 1.1, st === 'registered' ? 'color' : 'sil');
          s.position.set(x + sz / 2, sh / 2 + 2);
          const mask = new Graphics().rect(x, (sh - sz) / 2, sz, sz).fill(0xffffff);
          s.mask = mask;
          c.addChild(s, mask);
        } else {
          const q = poster('?', sz * 0.6, C.ink);
          q.anchor.set(0.5);
          q.position.set(x + sz / 2, sh / 2);
          c.addChild(q);
        }
      });
      const prog = poster(`${reg}/${set.cats.length}`, 44, complete ? C.ink : reg ? C.pinkHot : 0x9a8f80);
      prog.anchor.set(1, 0.5);
      prog.position.set(colW - 14, sh / 2);
      c.addChild(prog);
      if (complete) {
        const st = chip('COMPLETO', { bg: C.pinkHot, fg: C.paper, size: 18, font: F.poster });
        st.rotation = -0.12;
        st.position.set(colW - 150, -12);
        c.addChild(st);
      }
      p.addChild(c);
      gsap.from(c, { alpha: 0, x: c.x - 30, duration: 0.25, delay: i * 0.03 });
    });
  }

  // ------------------------------------------------------------ grimorio
  private buildGrimorio() {
    const p = this.page;
    const reactions = (CONTENT as unknown as { reactions: { id: string; name: string; effect: string; grimoire: string; axis: string; mult: number }[] }).reactions;
    const known = reactions.filter((r) => reactionKnown(r)).length;
    const head = txt(`GRIMORIO DE SINERGIAS · ${known}/12 — mezcla elementos en batalla y apúntalas aquí`, { fontFamily: F.poster, fontSize: 26, fill: C.ink });
    head.position.set(0, 186);
    p.addChild(head);
    const cols = 4;
    const gw = (IW - 3 * 20) / cols;
    const gh = 206;
    reactions.slice(0, 12).forEach((r, i) => {
      const c = new Container();
      c.position.set((i % cols) * (gw + 20), 236 + Math.floor(i / cols) * (gh + 16));
      const k = reactionKnown(r);
      const bg = new Graphics()
        .rect(6, 6, gw, gh)
        .fill(k ? C.ink : C.pinkHot)
        .rect(0, 0, gw, gh)
        .fill(k ? C.paper : C.ink)
        .stroke({ width: 3, color: C.ink });
      c.addChild(bg);
      if (k) {
        const ax = chip(r.axis.toUpperCase(), { bg: C.ink, fg: C.paper, size: 12 });
        ax.position.set(gw - ax.width - 12, 14);
        let mw = 0;
        if (r.mult > 1) {
          const m = poster(`x${r.mult}`, 34, C.pinkHot);
          m.anchor.set(1, 0);
          m.position.set(gw - ax.width - 22, 2);
          mw = m.width + 10;
          c.addChild(m);
        }
        const nm = poster(r.name.toUpperCase(), 40, C.ink);
        nm.position.set(14, 0);
        fitText(nm, gw - ax.width - 50 - mw);
        const eff = txt(r.effect, { fontFamily: F.ui, fontSize: 14, fill: C.ink, wordWrap: true, wordWrapWidth: gw - 28, lineHeight: 17 });
        eff.position.set(14, 58);
        const q = txt(`“${r.grimoire}”`, { fontFamily: F.serif, fontStyle: 'italic', padding: 4, fontSize: 15, fill: C.ink, wordWrap: true, wordWrapWidth: gw - 40 });
        const qb = new Graphics().rect(0, 0, q.width + 16, q.height + 8).fill(C.yellow).stroke({ width: 2, color: C.ink });
        const qc = new Container();
        qc.addChild(qb, q);
        q.position.set(8, 4);
        qc.position.set(12, gh - q.height - 18);
        qc.rotation = -0.01;
        c.addChild(nm, ax, eff, qc);
      } else {
        const q = poster('?', 130, C.pinkHot);
        q.anchor.set(0.5);
        q.position.set(gw / 2, gh / 2 - 14);
        const t = txt('SINERGIA SIN DESCUBRIR', { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: C.paper, letterSpacing: 3 });
        t.anchor.set(0.5);
        t.position.set(gw / 2, gh - 28);
        const num = txt(String(i + 1).padStart(2, '0'), { fontFamily: F.poster, fontSize: 26, fill: C.paper });
        num.position.set(12, 6);
        c.addChild(q, t, num);
      }
      p.addChild(c);
      gsap.from(c, { alpha: 0, y: c.y + 20, duration: 0.25, delay: i * 0.03 });
    });
  }
}

// ---------------------------------------------------------------- detail sheet
interface DetailHooks {
  onBack: () => void;
  onNav: (dir: 1 | -1) => void;
  onReplay: () => void;
  onAltar: (uid: string) => void;
}

class DetailSheet extends Container {
  constructor(species: string, hooks: DetailHooks) {
    super();
    const def = catDef(species);
    const st = dexStatus(species);
    const known = st === 'registered' || st === 'rumor';
    const rar = printRarity(species);
    const owned = ownedOf(species);
    const idx = CATS.findIndex((c) => c.id === species) + 1;

    const bg = new Graphics().rect(-28, -22, IW + 56, IH + 44).fill(C.paper);
    bg.eventMode = 'static';
    this.addChild(bg);
    const band = new Graphics().rect(-28, -22, 520, IH + 44).fill(st === 'registered' ? rarityBand(rar) : C.ink);
    this.addChild(band);
    const circle = new Graphics().circle(240, 470, 250).fill({ color: st === 'registered' ? C.pink : C.pinkHot, alpha: st === 'registered' ? 0.95 : 0.35 });
    const wm = poster(String(idx).padStart(2, '0'), 560, C.ink, { letterSpacing: -20 });
    wm.alpha = 0.05;
    wm.anchor.set(1, 1);
    wm.position.set(IW + 20, IH + 150);
    const wmMask = new Graphics().rect(-28, -22, IW + 56, IH + 44).fill(0xffffff);
    wm.mask = wmMask;
    this.addChild(circle, wm, wmMask);

    // nav
    const back = new Button('‹ VOLVER', hooks.onBack, { w: 170, h: 54, size: 26, color: C.paper });
    back.position.set(0, 0);
    const prev = new Button('‹', () => hooks.onNav(-1), { w: 54, h: 54, size: 32, color: C.paper });
    prev.position.set(186, 0);
    const next = new Button('›', () => hooks.onNav(1), { w: 54, h: 54, size: 32, color: C.paper });
    next.position.set(252, 0);
    this.addChild(back, prev, next);

    // big card
    const card = new CatCard(species, { w: 400, h: 540, hires: true, stars: owned?.stars, level: owned?.level });
    card.position.set(40, 90);
    card.rotation = -0.025;
    this.addChild(card);
    gsap.from(card, { rotation: -0.2, alpha: 0, duration: 0.35, ease: 'back.out(1.8)' });
    const num = poster(`Nº ${String(idx).padStart(2, '0')} / ${dexTotal()}`, 34, C.paper);
    num.position.set(40, 650);
    const stc = chip(statusLabel(st), { bg: st === 'registered' ? C.green : st === 'rumor' ? C.red : C.ink, fg: C.paper, size: 16, font: F.poster });
    stc.position.set(40, 700);
    this.addChild(num, stc);

    const X = 520;
    const RW = IW - X;
    // name
    const name = poster(known ? def.name.toUpperCase() : '???', 96, C.ink, { letterSpacing: -2 });
    name.position.set(X, -24);
    fitText(name, RW - 300);
    this.addChild(name);
    if (known) {
      const ep = txt(def.epithet, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 30, fill: C.ink, padding: 8 });
      ep.position.set(X + 4, 112);
      this.addChild(ep);
    }
    // chips row
    let cx = X;
    const cy = 162;
    const addChip = (c: Container) => {
      c.position.set(cx, cy);
      this.addChild(c);
      cx += c.width + 10;
    };
    if (known) addChip(chip(rarityName(rar), { bg: rar === 'common' ? 0x6d6356 : rarityColor(rar), fg: rar === 'legendary' ? C.ink : C.paper, size: 18, font: F.poster }));
    for (const e of def.elements) addChip(chip(`${elEmoji(e)} ${elName(e)}`, { bg: elColor(e), fg: e === 'storm' ? C.ink : C.paper, size: 18, font: F.poster }));
    if (st === 'registered') {
      addChip(chip(roleName(def).toUpperCase(), { bg: C.paper, fg: C.ink, size: 18, font: F.poster }));
      const tr = traitInfo(def.trait);
      if (tr) addChip(chip(`RASGO: ${tr.name.toUpperCase()}`, { bg: C.paper, fg: C.ink, size: 18, font: F.poster }));
      const wk = workerName(def.worker);
      if (wk) addChip(chip(`OFICIO: ${wk.toUpperCase()}`, { bg: C.mint, fg: C.ink, size: 18, font: F.poster }));
    }

    const top = 220;
    if (st === 'registered') this.registeredInfo(species, X, top, RW, hooks);
    else if (st === 'rumor') this.rumorInfo(species, X, top, RW);
    else this.lockedInfo(species, st, X, top, RW);
  }

  private section(title: string, body: string, x: number, y: number, w: number, o: { color?: number; italic?: boolean; size?: number } = {}) {
    const t = txt(title, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: o.color ?? C.pinkHot, letterSpacing: 3 });
    t.position.set(x, y);
    const b = txt(body, {
      fontFamily: o.italic ? F.serif : F.ui,
      fontStyle: o.italic ? 'italic' : 'normal',
      padding: o.italic ? 6 : 0,
      fontSize: o.size ?? 20,
      fill: C.ink,
      wordWrap: true,
      wordWrapWidth: w,
      lineHeight: (o.size ?? 20) * 1.3,
    });
    b.position.set(x, y + 20);
    this.addChild(t, b);
    return y + 20 + b.height + 18;
  }

  private registeredInfo(species: string, X: number, top: number, RW: number, hooks: DetailHooks) {
    const def = catDef(species);
    const owned = ownedOf(species);
    const colW = (RW - 40) / 2;
    // stats strip
    const stats: [string, string][] = [
      ['VIDA', String(roleHp(def.role))],
      ['RECARGA', def.combat.recarga ? `${def.combat.recarga} T` : 'CADA TURNO'],
      ['DAÑO', String(def.combat.shot.dmg)],
      ['ORO BASE/S', fmt(goldBase(def.rarity))],
    ];
    const sw = (RW - 30) / 4;
    stats.forEach(([k, v], i) => {
      const x = X + i * (sw + 10);
      const g = new Graphics().rect(x, top, sw, 74).fill(i === 0 ? C.ink : C.paper).stroke({ width: 3, color: C.ink });
      const kt = txt(k, { fontFamily: F.ui, fontWeight: '700', fontSize: 13, fill: i === 0 ? C.paper : C.ink, letterSpacing: 2 });
      kt.position.set(x + 10, top + 6);
      const vt = poster(v, 38, i === 0 ? C.yellow : C.ink);
      vt.position.set(x + 10, top + 20);
      fitText(vt, sw - 20);
      this.addChild(g, kt, vt);
    });
    let yA = top + 98;
    const shot = def.combat.shot;
    const shotLine = [
      shot.projectiles > 1 ? `${shot.projectiles} proyectiles` : null,
      shot.bounces ? `${shot.bounces} rebote${shot.bounces > 1 ? 's' : ''}` : null,
      shot.pierce ? `perfora ${shot.pierce}` : null,
      shot.status ? `${shot.status} ${shot.statusTurns}T` : null,
    ]
      .filter(Boolean)
      .join(' · ');
    yA = this.section(`ATAQUE · ${shot.name.toUpperCase()}`, `${shot.special ?? ''}${shotLine ? `\n${shotLine}` : ''}`, X, yA, colW);
    const ult = def.combat.ultimate;
    yA = this.section(`ULTIMATE · ${ult.name}`, `${ult.effect}${ult.usesPerBattle ? `  (${ult.usesPerBattle}× por batalla)` : ''}`, X, yA, colW, { color: C.red });
    const lim = limitationText(def);
    if (lim) yA = this.section('LIMITACIÓN', lim, X, yA, colW, { color: C.ink });

    let yB = top + 98;
    const XB = X + colW + 40;
    yB = this.section('PASIVA', def.combat.passive, XB, yB, colW);
    yB = this.section('★3', def.combat.star3.replace(/^★3:\s*/, ''), XB, yB, colW, { color: 0xb8862a });
    yB = this.section('★5', def.combat.star5.replace(/^★5:\s*/, ''), XB, yB, colW, { color: 0xb8862a });
    yB = this.section('CÓMO SE OBTIENE', def.obtain.how, XB, yB, colW, { color: C.ink, size: 18 });
    yB = this.section('LORE', def.lore, XB, yB, colW, { italic: true, color: C.ink, size: 22 });

    // owner strip
    const yo = IH - 96;
    if (owned) {
      const need = starNeed(owned);
      const have = G.s.orbs[species] ?? 0;
      const strip = new Graphics().rect(X, yo, colW, 84).fill(C.ink);
      const t1 = poster(`TU ${owned.name.toUpperCase()} · NV ${owned.level}`, 32, C.paper);
      t1.position.set(X + 14, yo + 2);
      fitText(t1, colW - 28);
      const stars = '★'.repeat(owned.stars) + '☆'.repeat(Math.max(0, 6 - owned.stars));
      const t2 = txt(`${stars}   ORBES ${have}/${need}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.yellow, letterSpacing: 1 });
      t2.position.set(X + 14, yo + 50);
      this.addChild(strip, t1, t2);
      const alt = new Button('ALTAR', () => hooks.onAltar(owned.uid), { w: 170, h: 60, size: 28, color: C.yellow });
      alt.position.set(XB, yo + 12);
      this.addChild(alt);
    }
    const rep = new Button('VER REVELACIÓN', hooks.onReplay, { w: 260, h: 60, size: 26, color: C.pink });
    rep.position.set(owned ? XB + 190 : XB, yo + 12);
    this.addChild(rep);
  }

  private rumorInfo(species: string, X: number, top: number, RW: number) {
    const def = catDef(species);
    const colW = (RW - 40) / 2;
    const stamp = poster('RUMOR', 120, C.red, { stroke: { color: C.paper, width: 8 } });
    stamp.rotation = -0.12;
    stamp.alpha = 0.9;
    stamp.position.set(X + RW - 420, top + 10);
    this.addChild(stamp);
    let y = top + 10;
    y = this.section('POSIBLES PADRES', possibleParents(def), X, y, colW + 120, { size: 20 });
    const minLv = (def.obtain as unknown as { minParentLevel?: number }).minParentLevel;
    const cond = [minLv ? `Ambos padres Nv${minLv}+.` : null, `Resultado ${rarityName(printRarity(species))}: ${resonanceMinutes(def.rarity)} de Resonancia.`].filter(Boolean).join('\n');
    y = this.section('CONDICIONES CONOCIDAS', cond, X, y, colW + 120, { color: C.ink });
    const orbs = G.s.orbs[species] ?? 0;
    if (orbs) y = this.section('ORBES GUARDADOS', `Tienes ${orbs} orbes de ${def.name}. Te esperan en el Altar.`, X, y, colW + 120, { color: 0xb8862a });
    const lore = hintFor(def);
    if (lore) this.section('SE DICE QUE…', lore, X, y, colW + 120, { italic: true, color: C.ink, size: 22 });
    this.lockedStats(X, IH - 210, RW);
  }

  private lockedInfo(species: string, st: string, X: number, top: number, RW: number) {
    const def = catDef(species);
    let y = top + 10;
    if (st === 'silhouette') {
      y = this.section('LO QUE SABES', 'Conoces sus elementos. Nada más. Ni su nombre, ni su cara, ni sus intenciones.', X, y, RW - 200, { size: 22 });
      y = this.section('CÓMO PODRÍA SALIR', possibleParents(def), X, y, RW - 200, { color: C.ink });
    } else if (def.secret) {
      const g = new GlitchText('ARCHIVO SELLADO', { fontFamily: F.glitch, fontSize: 64, fill: C.ink }, 5);
      g.position.set(X + 300, y + 40);
      this.addChild(g);
      y += 110;
      const h = hintFor(def);
      if (h) y = this.section('PISTA', h, X, y, RW - 200, { italic: true, size: 26, color: C.violet });
    } else {
      const missing = def.elements.filter((e) => !isElementKnown(e));
      y = this.section(
        'SIN DESCUBRIR',
        `Necesitas descubrir ${missing.map((e) => `${elEmoji(e)} ${elName(e)}`).join(' y ')} para ver siquiera su silueta.`,
        X,
        y,
        RW - 200,
        { size: 22 },
      );
    }
    this.lockedStats(X, IH - 210, RW);
  }

  private lockedStats(X: number, y: number, RW: number) {
    const sw = (RW - 30) / 4;
    ['VIDA', 'RECARGA', 'DAÑO', 'ORO BASE/S'].forEach((k, i) => {
      const x = X + i * (sw + 10);
      const g = new Graphics().rect(x, y, sw, 74).fill(C.paperDark).stroke({ width: 3, color: C.ink });
      const kt = txt(k, { fontFamily: F.ui, fontWeight: '700', fontSize: 13, fill: C.ink, letterSpacing: 2 });
      kt.position.set(x + 10, y + 6);
      const vt = poster('???', 38, 0x8a8070);
      vt.position.set(x + 10, y + 20);
      this.addChild(g, kt, vt);
    });
    const t: Text = txt('Regístralo para leer su ficha completa.', { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.ink });
    t.position.set(X, y + 90);
    this.addChild(t);
  }
}

function statusLabel(st: string) {
  return st === 'registered' ? 'REGISTRADO' : st === 'rumor' ? 'RUMOR' : st === 'silhouette' ? '??? · SILUETA' : 'SELLADO';
}
function rarityBand(r: PrintRarity) {
  switch (r) {
    case 'common':
      return 0x3a332c;
    case 'rare':
      return C.megaBlue;
    case 'epic':
      return C.pinkHot;
    case 'legendary':
      return 0x8a6a32;
    case 'mythic':
      return C.violet;
    default:
      return C.ink;
  }
}
function roleHp(role: string) {
  return (CONTENT.roles.find((r) => r.id === role)?.hp ?? 100) as number;
}
function goldBase(r: string) {
  return (BAL.rarities.gold_base_per_s as Record<string, number>)[r] ?? 0.5;
}
function resonanceMinutes(r: string) {
  const s = (BAL.rarities.resonance_time_s as Record<string, number>)[r] ?? BAL.rarities.resonance_time_s.legendary;
  return `${Math.round(s / 60)} min`;
}
