/**
 * TIENDA (agente tienda) — CONTRATO: `openShop(tab?)`.
 * Concepto de Dragon City (Hábitats · Edificios · Adornos · Orbes · Gatos · Cofres) en EDITORIAL SUIZO:
 * papel, tinta, círculo rosa, halftone, sellos ¡NUEVO!, escaparates animados y compras con ¡KA-CHING!.
 * Precios y reglas: state/sys/shop.ts y state/sys/decor.ts. Colocación en la isla: island/decor/DecorLayer.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { Modal } from '../../ui/modal';
import { C, F } from '../../ui/theme';
import { txt, Counter } from '../../ui/widgets';
import { icon } from '../../ui/icons';
import { sfx } from '../../core/audio';
import { G } from '../../state/game';
import { clearTree, killTree, newSeal } from './ui';
import { tabNews } from './news';
import { renderHome } from './tabs/home';
import { renderHabitats } from './tabs/habitats';
import { renderBuildings } from './tabs/buildings';
import { renderDecor } from './tabs/decor';
import { renderOrbs } from './tabs/orbs';
import { renderCats } from './tabs/cats';
import { renderChests } from './tabs/chests';

import type { ShopCtx, ShopPage, ShopTab } from './ctx';
import { TABS } from './ctx';
export type { ShopTab, ShopPage, ShopCtx } from './ctx';

let current: ShopView | null = null;

export function openShop(tab?: ShopTab, focus?: string): void {
  if (current && !current.m.closed) {
    current.go(tab ?? 'home', focus);
    return;
  }
  current = new ShopView(tab ?? 'home', focus);
}

const QUIPS = [
  'Todo se paga jugando. Cero billetes reales, cero trampas.',
  'Precios honestos: suben con tu isla, nunca con tu cara de urgencia.',
  'Aquí no se fía. Ni a Canelo. Sobre todo a Canelo.',
  'Si cabe en la isla, se vende. Si no, compra una expansión.',
];

class ShopView implements ShopCtx {
  m: Modal;
  root = new Container();
  w: number;
  h: number;
  page: ShopPage = 'home';
  focus?: string;
  private tabBar = new Container();
  private cleanup: (() => void) | void = undefined;
  private unsub: (() => void)[] = [];
  private gold!: Counter;
  private gems!: Counter;
  private goldIc!: Container;
  private gemsIc!: Container;

  constructor(page: ShopPage, focus?: string) {
    const m = new Modal('TIENDA', 1840, 1010, { color: C.paper, band: C.ink, subtitle: QUIPS[(G.s.kl + G.s.cats.length) % QUIPS.length] });
    this.m = m;
    this.w = m.innerW;
    this.h = m.innerH - 92;
    this.buildWallet();
    m.body.addChild(this.tabBar);
    this.root.position.set(0, 96);
    m.body.addChild(this.root);
    // content frame line under the tabs
    const orig = m.close.bind(m);
    m.close = () => {
      if (m.closed) return;
      this.teardown();
      killTree(m.body);
      orig();
    };
    m.open();
    this.go(page, focus);
  }

  private buildWallet() {
    const band = this.m.panel;
    const mk = (cur: 'gold' | 'gems', x: number) => {
      const c = new Container();
      const bg = new Graphics().rect(0, 0, 210, 54).fill(C.paper).stroke({ width: 3, color: C.ink });
      const ic = icon(cur === 'gold' ? 'gold' : 'gem', 38);
      ic.position.set(30, 27);
      const ctr = new Counter({ fontFamily: F.heavy, fontSize: 26, fill: C.ink });
      ctr.position.set(56, 9);
      ctr.set(cur === 'gold' ? G.s.gold : G.s.gems, false);
      c.addChild(bg, ic, ctr);
      c.position.set(x, 16);
      band.addChild(c);
      return { ctr, ic };
    };
    const a = mk('gold', this.m.w - 560);
    const b = mk('gems', this.m.w - 330);
    this.gold = a.ctr;
    this.goldIc = a.ic;
    this.gems = b.ctr;
    this.gemsIc = b.ic;
    this.unsub.push(
      G.on('res', (r) => {
        if (this.m.closed) return;
        if (r.key === 'gold') this.gold.set(G.s.gold);
        if (r.key === 'gems') this.gems.set(G.s.gems);
        if (r.key === 'gold' || r.key === 'gems') {
          const ic = r.key === 'gold' ? this.goldIc : this.gemsIc;
          gsap.fromTo(ic.scale, { x: 1.35, y: 1.35 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
        }
      }),
    );
  }

  walletAt(cur: 'gold' | 'gems') {
    return (cur === 'gold' ? this.goldIc : this.gemsIc).getGlobalPosition();
  }

  private drawTabs() {
    clearTree(this.tabBar);
    const n = TABS.length;
    const gap = 10;
    const tw = Math.floor((this.w - gap * (n - 1)) / n);
    const news = tabNews();
    TABS.forEach((tb, i) => {
      const on = tb.id === this.page;
      const c = new Container();
      const face = new Container();
      const h = on ? 74 : 62;
      const bg = new Graphics();
      if (!on) bg.rect(5, 5, tw, h).fill(C.ink);
      bg.rect(0, 0, tw, h).fill(on ? tb.color : C.paperDark).stroke({ width: 4, color: C.ink, alignment: 1 });
      if (on) bg.rect(4, h - 4, tw - 8, 12).fill(tb.color);
      const lt = txt(tb.label, { fontFamily: F.poster, fontSize: on ? 34 : 30, fill: on ? tb.fg : C.ink, letterSpacing: 1 });
      lt.anchor.set(0.5);
      lt.position.set(tw / 2, h / 2 + 1);
      if (lt.width > tw - 18) lt.scale.set((tw - 18) / lt.width);
      face.addChild(bg, lt);
      c.addChild(face);
      c.position.set(i * (tw + gap), on ? 0 : 12);
      if (!on && (news[tb.id] ?? 0) > 0) {
        const seal = newSeal(24, String(news[tb.id]));
        seal.position.set(tw - 10, 6);
        face.addChild(seal);
      }
      c.eventMode = 'static';
      c.cursor = on ? 'default' : 'pointer';
      if (!on) {
        c.on('pointerover', () => gsap.to(face, { y: -5, duration: 0.1 }));
        c.on('pointerout', () => gsap.to(face, { y: 0, duration: 0.12 }));
        c.on('pointertap', () => {
          sfx('paper');
          this.go(tb.id);
        });
      }
      this.tabBar.addChild(c);
    });
    // the content sheet: a rule in the active tab color joins tab ↔ content
    const rule = new Graphics().rect(0, 82, this.w, 6).fill(C.ink);
    this.tabBar.addChildAt(rule, 0);
  }

  go(page: ShopPage, focus?: string) {
    if (this.m.closed) return;
    this.page = page;
    this.focus = focus;
    this.render();
  }
  refresh(focus?: string) {
    if (focus !== undefined) this.focus = focus;
    this.render(false);
  }

  private render(anim = true) {
    if (typeof this.cleanup === 'function') this.cleanup();
    this.cleanup = undefined;
    clearTree(this.root);
    this.drawTabs();
    const fn = {
      home: renderHome,
      habitats: renderHabitats,
      edificios: renderBuildings,
      decoracion: renderDecor,
      orbes: renderOrbs,
      gatos: renderCats,
      cofres: renderChests,
    }[this.page];
    this.cleanup = fn(this);
    if (anim) {
      this.root.alpha = 0;
      gsap.to(this.root, { alpha: 1, duration: 0.18 });
      gsap.fromTo(this.root, { y: 120 }, { y: 96, duration: 0.25, ease: 'back.out(1.6)' });
    }
  }

  close() {
    this.m.close();
  }

  private teardown() {
    if (typeof this.cleanup === 'function') this.cleanup();
    this.cleanup = undefined;
    this.unsub.forEach((f) => f());
    this.unsub = [];
    if (current === this) current = null;
  }
}

