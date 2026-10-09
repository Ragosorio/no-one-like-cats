/**
 * EDIFICIOS: the balance gem sinks (Constructor extra, Ranura de Resonancia, Reloj de arena grande)
 * + links to buildings bought elsewhere (Banco, Muelle, Expansiones, Astillero) — never duplicated.
 */
import { regionRoom } from '../../../island/placement';
import { Container, Graphics, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../../ui/theme';
import { toast } from '../../../ui/modal';
import { icon } from '../../../ui/icons';
import { sfx } from '../../../core/audio';
import { fmt } from '../../../core/format';
import { G } from '../../../state/game';
import { BAL } from '../../../state/econ';
import { bankKl, bankUnlocked } from '../../../state/sys/island';
import { BuildingId, buildingOffer, buyBuilding, buildersNow, isNew, markSeen, nextExpansion, purrCapNow, purrCapWithHourglass } from '../../../state/sys/shop';
import { gemSlotInfo } from '../../../state/sys/resonance';
import type { ShopCtx } from '../ctx';
import { block, Btn, chip, fit, halftoneRect, newSeal, para, t } from '../ui';
import { buying, celebrate } from '../buy';

interface Card {
  key: string;
  title: string;
  kicker: string;
  text: string;
  status: string;
  color: number;
  art: (c: Container) => ((t: number) => void) | void;
  /** gem sink or link */
  buy?: BuildingId;
  link?: { label: string; go: () => void; disabled?: boolean };
  locked?: string;
  owned?: boolean;
}

export function renderBuildings(ctx: ShopCtx) {
  const root = ctx.root;
  const ids = ['bld:builder', 'bld:res_slot', 'bld:hourglass', ...(G.s.kl >= 15 ? ['bld:bank'] : [])];
  const fresh = new Set(ids.filter(isNew));
  markSeen(...ids);
  const S = BAL.gems.sinks;
  const ob = buildingOffer('builder');
  const orr = buildingOffer('res_slot');
  const oh = buildingOffer('hourglass');
  const nx = nextExpansion();
  const go = (fn: () => void) => () => {
    ctx.close();
    fn();
  };
  const cards: Card[] = [
    {
      key: 'bld:builder',
      title: 'CONSTRUCTOR EXTRA',
      kicker: 'OBRAS EN PARALELO',
      text: 'Un gato más con casco: construye y mejora hábitats, limpia expansiones y sube el muelle al mismo tiempo que los demás.',
      status: ob.owned ? `Contratado · ${buildersNow()} constructores` : `Hoy: ${buildersNow()} → ${buildersNow() + 1}`,
      color: C.yellow,
      buy: 'builder',
      owned: ob.owned >= ob.max,
      art: artHelmet,
    },
    {
      key: 'bld:res_slot',
      title: 'RANURA DE RESONANCIA',
      kicker: 'SANTUARIO +1',
      text: 'Un par de cojines más en el Santuario: dos Resonancias a la vez. (Las ranuras 2 y 3 también llegan gratis con expansiones.)',
      status: orr.owned ? `Comprada · ${G.s.resonance.slots} ranuras` : `Hoy: ${G.s.resonance.slots} → ${G.s.resonance.slots + 1}`,
      color: C.lilac,
      buy: 'res_slot',
      owned: gemSlotInfo().left <= 0,
      art: artCushions,
    },
    {
      key: 'bld:hourglass',
      title: 'RELOJ DE ARENA GRANDE',
      kicker: 'RONRONEO +50%',
      text: 'Amplía la reserva de Ronroneo. No genera tiempo: solo te deja guardar más del que ganas jugando.',
      status: oh.owned ? `Instalado · tope ${Math.round(purrCapNow())} min` : `Tope: ${Math.round(purrCapNow())} → ${Math.round(purrCapWithHourglass())} min`,
      color: C.mint,
      buy: 'hourglass',
      owned: oh.owned >= oh.max,
      art: artHourglass,
    },
    {
      key: 'bld:bank',
      title: 'BANCO DEL REINO',
      kicker: 'AUTO-DEPÓSITO',
      text: 'Todo el oro de los hábitats entra solo a tu cartera (aunque estén LLENOS) y sigue cayendo offline hasta 2 h.',
      status: bankUnlocked() ? 'Abierto: ver depósitos' : `Se construye solo en Reino ${bankKl()}`,
      color: C.gold,
      locked: bankUnlocked() ? undefined : `REINO ${bankKl()}`,
      link: { label: 'ABRIR BANCO', go: go(() => void import('../../island/BankPanel').then((m) => m.openBankPanel())), disabled: !bankUnlocked() },
      art: artBank,
    },
    {
      key: 'bld:dock',
      title: 'MUELLE DE PESCA',
      kicker: 'PARCELAS DE PESCA',
      text: `Mejora cada parcela (×${BAL.farms.upgrade.yield_growth} de pescado por nivel). Las parcelas EXTRA de pesca vienen con las expansiones.`,
      status: `${G.s.farms.length} parcela(s) · mejor Nv ${Math.max(1, ...G.s.farms.map((f) => f.level))}`,
      color: 0x7fd8ff,
      link: { label: 'IR AL MUELLE', go: go(() => void import('../../island/DockPanel').then((m) => m.openDock())) },
      art: artDock,
    },
    {
      key: 'bld:exp',
      title: 'EXPANSIONES',
      kicker: 'MÁS ISLA',
      text: nx ? `${nx.e.name}: espacio para ~${regionRoom(nx.e.id)} hábitats más${nx.e.balance.farm_plots ? ` y +${nx.e.balance.farm_plots} de pesca` : ''}. ${nx.e.opensDesign.split(/\.\s/)[0].replace(/\.$/, '')}.` : 'Ya limpiaste todo el archipiélago. Leyenda.',
      status: nx ? (nx.st === 'locked' ? `Reino ${nx.e.balance.kl} · ${fmt(nx.e.balance.cost)} doblones` : nx.st === 'clearing' ? 'Limpiando terreno…' : `${fmt(nx.e.balance.cost)} doblones`) : 'Completo',
      color: 0x8fcf6a,
      link: nx
        ? {
            label: 'VER EXPANSIÓN',
            go: go(() => {
              void import('../../island/ExpansionPanel').then((m) => m.openExpansionPanel(nx.e.n));
              void import('../../../island/hooks').then((h) => h.islandHooks.focusRegion?.(nx.e.n));
            }),
          }
        : undefined,
      art: artIsland,
    },
    {
      key: 'bld:yard',
      title: 'ASTILLERO',
      kicker: 'BARCOS Y MÓDULOS',
      text: 'Barcos nuevos, mejoras Mk, armas y escudos se compran allá, con chatarra y planos de combate.',
      status: `${G.s.ship.owned.length} barco(s) en tu flota`,
      color: C.megaBlue,
      link: { label: 'IR AL ASTILLERO', go: go(() => void import('../../Shipyard').then((m) => m.openShipyard())) },
      art: artShip,
    },
  ];
  const cols = 4;
  const gap = 24;
  const cw = Math.floor((ctx.w - gap * (cols - 1)) / cols);
  const ch = Math.floor((ctx.h - gap - 12) / 2);
  const ticks: ((t: number) => void)[] = [];
  cards.forEach((cd, i) => {
    const card = new Container();
    const face = new Container();
    card.addChild(face);
    card.position.set((i % cols) * (cw + gap), Math.floor(i / cols) * (ch + gap));
    face.addChild(block(cw, ch, C.paper, 8));
    const top = new Graphics().rect(0, 0, cw, 150).fill(cd.color).stroke({ width: 4, color: C.ink, alignment: 1 });
    face.addChild(top);
    const ht = halftoneRect(cw, 150, C.ink, 10, 2, 0.13);
    face.addChild(ht);
    const art = new Container();
    art.position.set(cw / 2, 92);
    face.addChild(art);
    const tk = cd.art(art);
    if (tk) ticks.push(tk);
    const kick = chip(cd.kicker, C.ink, C.paper, 15);
    kick.position.set(14, 12);
    face.addChild(kick);
    const tt = t(cd.title, 32, C.ink, F.poster);
    tt.position.set(16, 158);
    fit(tt, cw - 30);
    face.addChild(tt);
    const tx = para(cd.text, cw - 32, 15);
    tx.position.set(16, 202);
    face.addChild(tx);
    const st = t(cd.status, 16, C.inkBlue, F.ui);
    st.position.set(16, ch - 104);
    fit(st, cw - 30);
    face.addChild(st);
    let btn: Btn;
    if (cd.buy) {
      const o = buildingOffer(cd.buy);
      const ok = G.s.gems >= o.cost;
      btn = new Btn(cd.owned ? 'YA ES TUYO' : 'COMPRAR', (b) => {
        if (buying()) return;
        if (!buyBuilding(cd.buy!)) {
          sfx('error');
          toast(G.s.gems < o.cost ? 'Te faltan Ojos de Gato' : 'Ya lo tienes', { sub: 'Las gemas solo se ganan jugando: jefes, Catdex, hitos y secretos.', color: C.paper });
          return;
        }
        b.disabled = true;
        celebrate(ctx, art, 'gems', o.cost, cd.title, () => ctx.refresh());
      }, { w: cw - 32, h: 60, color: cd.owned ? C.paperDark : C.pinkHot, fg: cd.owned ? C.ink : C.paper, price: cd.owned ? undefined : { cur: 'gems', v: o.cost, ok }, disabled: cd.owned });
      if (cd.owned) {
        const s = chip('INSTALADO', C.green, C.paper, 18);
        s.position.set(cw - s.width - 14, 12);
        s.rotation = 0.05;
        face.addChild(s);
      }
    } else {
      const l = cd.link;
      btn = new Btn(l?.label ?? 'COMPLETO', () => l?.go(), { w: cw - 32, h: 60, color: C.ink, fg: C.paper, disabled: !l || l.disabled });
      if (cd.locked) {
        const s = chip(cd.locked, C.ink, C.yellow, 18);
        const lk = icon('lock', 18);
        lk.position.set(-14, 12);
        s.addChild(lk);
        s.position.set(cw - s.width - 14, 12);
        face.addChild(s);
      }
    }
    btn.position.set(16, ch - 76);
    face.addChild(btn);
    if (fresh.has(cd.key) && !cd.owned && !cd.locked) {
      const seal = newSeal(36);
      seal.position.set(cw - 34, 36);
      face.addChild(seal);
    }
    card.eventMode = 'static';
    card.on('pointerover', () => gsap.to(face, { y: -6, duration: 0.12 }));
    card.on('pointerout', () => gsap.to(face, { y: 0, duration: 0.15 }));
    root.addChild(card);
    gsap.from(face, { y: 40, alpha: 0, duration: 0.3, delay: 0.04 * i, ease: 'back.out(1.6)' });
  });
  // a little poster in the empty 8th slot
  const poster = new Container();
  poster.position.set(3 * (cw + gap), ch + gap);
  const pb = new Graphics().rect(0, 0, cw, ch).stroke({ width: 3, color: C.ink, alpha: 0.35 });
  poster.addChild(pb);
  const big = t('SE\nCONSTRUYE\nCON GATOS.', 54, C.ink, F.poster, { lineHeight: 52 });
  big.position.set(20, 24);
  big.alpha = 0.9;
  poster.addChild(big);
  // the decorative circle sits up in the corner, clear of the small print
  const pc = new Graphics().circle(cw - 70, ch - 170, 60).fill(C.pink);
  poster.addChildAt(pc, 0);
  const nt = para(`Constructor extra: ${S.builder.cost} · ranura de Resonancia: ${S.resonance_slot.cost} · reloj de Ronroneo: ${S.purr_cap_plus50.cost} Ojos de Gato. Uno de cada uno. Las gemas solo se ganan jugando.`, cw - 40, 14);
  nt.alpha = 0.7;
  nt.position.set(20, ch - nt.height - 18);
  poster.addChild(nt);
  root.addChild(poster);
  let time = 0;
  const tick = (tk: Ticker) => {
    time += tk.deltaMS / 1000;
    for (const f of ticks) f(time);
  };
  Ticker.shared.add(tick);
  return () => Ticker.shared.remove(tick);
}

// ------------------------------------------------------------------ little arts (centered at 0,0)
const INK = { width: 3, color: C.ink, join: 'round' as const };
function artHelmet(c: Container) {
  const g = new Graphics();
  g.poly([-46, -60, -40, -84, -26, -66]).fill(C.yellow).stroke(INK).poly([46, -60, 40, -84, 26, -66]).fill(C.yellow).stroke(INK);
  g.arc(0, -10, 54, Math.PI, 0).lineTo(54, -10).closePath().fill(C.yellow).stroke(INK);
  g.rect(-66, -14, 132, 14).fill(0xe0a82e).stroke(INK);
  g.rect(-10, -64, 20, 50).fill(0xe0a82e).stroke(INK);
  g.circle(0, -40, 9).fill(C.paper).stroke(INK);
  c.addChild(g);
  const ham = new Graphics().rect(-4, -40, 8, 46).fill(0x8a5a2e).stroke(INK).rect(-18, -48, 36, 14).fill(0x8a95a3).stroke(INK);
  ham.position.set(80, 10);
  c.addChild(ham);
  return (t: number) => (ham.rotation = Math.sin(t * 6) > 0.4 ? -0.6 : 0.1);
}
function artCushions(c: Container) {
  const g = new Graphics();
  for (const x of [-54, 54]) g.roundRect(x - 40, -30, 80, 44, 18).fill(C.pinkHot).stroke(INK).circle(x, -8, 5).fill(C.paper);
  c.addChild(g);
  const h = new Graphics().moveTo(0, -36).bezierCurveTo(-26, -66, -46, -30, 0, -6).bezierCurveTo(46, -30, 26, -66, 0, -36).fill(C.red).stroke(INK);
  c.addChild(h);
  return (t: number) => h.scale.set(1 + Math.max(0, Math.sin(t * 5)) * 0.15);
}
function artHourglass(c: Container) {
  const g = new Graphics();
  g.rect(-44, -76, 88, 12).fill(0x8a5a2e).stroke(INK).rect(-44, 30, 88, 12).fill(0x8a5a2e).stroke(INK);
  g.poly([-34, -64, 34, -64, 4, -18, 34, 30, -34, 30, -4, -18]).fill({ color: 0xffffff, alpha: 0.6 }).stroke(INK);
  c.addChild(g);
  const sand = new Graphics();
  c.addChild(sand);
  return (t: number) => {
    const p = (t * 0.25) % 1;
    sand.clear();
    const top = 40 * (1 - p);
    sand.poly([-26 * (1 - p), -58 + (40 - top), 26 * (1 - p), -58 + (40 - top), 0, -20]).fill(C.yellow);
    sand.poly([-30 * p - 2, 28, 30 * p + 2, 28, 0, 28 - 36 * p]).fill(C.yellow);
    sand.moveTo(0, -20).lineTo(0, 28).stroke({ width: 2, color: C.yellow });
  };
}
function artBank(c: Container) {
  const g = new Graphics();
  g.poly([-70, -40, 0, -78, 70, -40]).fill(C.paper).stroke(INK);
  g.rect(-64, -40, 128, 10).fill(C.paperDark).stroke(INK);
  for (let i = 0; i < 5; i++) g.rect(-56 + i * 26, -30, 12, 56).fill(C.paper).stroke(INK);
  g.rect(-70, 26, 140, 12).fill(C.paperDark).stroke(INK);
  c.addChild(g);
  const coin = icon('gold', 34);
  coin.position.set(0, -54);
  c.addChild(coin);
  return (t: number) => (coin.scale.x = Math.cos(t * 3));
}
function artDock(c: Container) {
  const g = new Graphics();
  g.rect(-80, 10, 160, 30).fill(0x3a7fb1).stroke(INK);
  g.rect(-70, -6, 140, 14).fill(0xb98348).stroke(INK);
  for (const x of [-60, -20, 20, 60]) g.rect(x - 4, -6, 8, 40).fill(0x8a5a2e).stroke(INK);
  c.addChild(g);
  const fish = icon('food', 46);
  c.addChild(fish);
  return (t: number) => {
    const p = (t * 0.7) % 1;
    fish.position.set(-40 + p * 80, 10 - Math.sin(p * Math.PI) * 70);
    fish.rotation = -1 + p * 2;
    fish.visible = p < 0.95;
  };
}
function artIsland(c: Container) {
  const g = new Graphics();
  g.ellipse(0, 20, 90, 30).fill(0x3a7fb1);
  g.poly([-70, 10, 0, -24, 70, 10, 0, 44]).fill(0x8fcf6a).stroke(INK);
  g.poly([-70, 10, 0, 44, 0, 56, -70, 22]).fill(0x8a6a42).stroke(INK);
  g.poly([0, 44, 70, 10, 70, 22, 0, 56]).fill(0x6e5232).stroke(INK);
  g.rect(-4, -70, 5, 70).fill(C.ink);
  c.addChild(g);
  const flag = new Graphics();
  c.addChild(flag);
  return (t: number) => {
    const k = Math.floor(t * 12) / 12;
    flag.clear().poly([1, -70, 40, -64 + Math.sin(k * 6) * 4, 1, -48]).fill(C.pinkHot).stroke(INK);
  };
}
function artShip(c: Container) {
  const s = new Container();
  const g = new Graphics();
  g.poly([-70, 0, 70, 0, 50, 34, -54, 34]).fill(0x8a5a2e).stroke(INK);
  g.rect(-3, -76, 6, 76).fill(C.ink);
  g.poly([4, -72, 54, -20, 4, -16]).fill(C.paper).stroke(INK);
  g.poly([-4, -64, -44, -20, -4, -18]).fill(C.paper).stroke(INK);
  g.circle(-30, 16, 6).fill(C.ink).circle(0, 16, 6).fill(C.ink).circle(30, 16, 6).fill(C.ink);
  s.addChild(g);
  c.addChild(s);
  return (t: number) => {
    s.rotation = Math.sin(t * 1.4) * 0.06;
    s.y = Math.sin(t * 2) * 3;
  };
}
