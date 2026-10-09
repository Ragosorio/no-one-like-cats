/**
 * ELEGIR TRIPULACIÓN — every cat you own, for one ship, with the facts that decide a crew:
 * power, level, stars, elements, its shot / ultimate, where it is (other ship, oficio, expedición)
 * and, when the fight is known, its advantage vs the enemy hull and cats (state/ext/matchup.ts).
 *
 * Cabins on top: tap one to aim at it, then tap a cat card (or tap a card to add / remove).
 * Search, element chips and sort come from the shared CatFilterBar. SUGERIR stays one tap away and
 * says why it picked who it picked. Changes apply live (same setCrew the small picker uses).
 */
import { ColorMatrixFilter, Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { Modal, toast } from '../../ui/modal';
import { C, F, RARITY } from '../../ui/theme';
import { Button, txt } from '../../ui/widgets';
import { sfx } from '../../core/audio';
import { fmt } from '../../core/format';
import { G } from '../../state/game';
import { catDef, ROLE_BY_ID, SHIP_BY_ID } from '../../data/content';
import { crew, crewSize, setCrew } from '../../state/sys/ship';
import { cat as getCat, catPow } from '../../state/sys/cats';
import { catBusy } from '../../state/sys/workforce';
import { CatQuery, queryCats } from '../../state/ext/catQuery';
import { catMatchup, FightContext, Matchup } from '../../state/ext/matchup';
import { CatFilterBar } from '../../ui/catFilterBar';
import { ScrollBox } from '../collection/ui';
import { elementIcon } from '../../ui/elementIcon';
import { P, catPortrait, clearChildren, clickable, label } from './common';

const MW = 1760;
const MH = 1000;
const CARD_W = 400;
const CARD_H = 150;
const GAP = 14;

type Extra = 'free' | 'edge';

/** strongest cats, weighted by their matchup when the fight is known — and the reason, in words */
export function suggestCrew(shipId: string, ctx?: FightContext | null) {
  const n = crewSize(shipId);
  const pool = G.s.cats.filter((c) => !catBusy(c.uid));
  const score = (u: string) => {
    const c = getCat(u)!;
    return catPow(c) * (ctx ? catMatchup(c.species, ctx).score : 1);
  };
  const pick = pool
    .map((c) => c.uid)
    .sort((a, b) => score(b) - score(a))
    .slice(0, n);
  setCrew(shipId, pick);
  let why = 'Los más fuertes al frente.';
  if (ctx) {
    const edge = pick.filter((u) => catMatchup(getCat(u)!.species, ctx).verdict === 'ventaja').length;
    why = ctx.hull
      ? `Los más fuertes, pesando quién le pega mejor al casco de ${ctx.hull.name}${edge ? ` (${edge} con ventaja)` : ''}.`
      : `Los más fuertes, pesando la ventaja de elemento${edge ? ` (${edge} con ventaja)` : ''}.`;
  }
  return why;
}

export function openCrewSelect(shipId: string, ctx: FightContext | null, onChange: () => void) {
  return new CrewSelect(shipId, ctx, onChange);
}

class CrewSelect {
  private m: Modal;
  private selected = -1;
  private cabins = new Container();
  private list: ScrollBox;
  private bar: CatFilterBar;
  private extras = new Set<Extra>();
  private extraBox = new Container();
  private summary = new Container();

  constructor(
    private shipId: string,
    private ctx: FightContext | null,
    private onChange: () => void,
  ) {
    const ship = SHIP_BY_ID.get(shipId)?.name ?? shipId;
    this.m = new Modal('Elegir tripulación', MW, MH, { color: 0xe6dcc6, band: C.oceanNoir, subtitle: `${ship.toUpperCase()} · ${crewSize(shipId)} CAMAROTES` });
    const b = this.m.body;
    b.addChild(this.cabins, this.summary);
    // filters
    this.bar = new CatFilterBar(760, { cats: G.s.cats, onChange: () => this.drawList(), placeholder: 'Buscar por nombre…' });
    this.bar.position.set(0, 236);
    b.addChild(this.bar);
    this.extraBox.position.set(780, 236);
    b.addChild(this.extraBox);
    this.drawExtras();
    const top = 236 + Math.max(this.bar.barHeight, 96) + 12;
    this.list = new ScrollBox(this.m.innerW, this.m.innerH - top - 4, P.blue);
    this.list.position.set(0, top);
    b.addChild(this.list);
    const sug = new Button('SUGERIR', () => {
      const why = suggestCrew(this.shipId, this.ctx);
      this.selected = -1;
      sfx('pop');
      toast('Tripulación sugerida', { icon: 'paw', sub: why });
      this.changed();
    }, { w: 190, h: 52, size: 26, color: C.mint });
    sug.position.set(this.m.innerW - 420, 0);
    const done = new Button('LISTO', () => this.m.close(), { w: 200, h: 52, size: 28, color: C.pinkHot, textColor: C.paper });
    done.position.set(this.m.innerW - 210, 0);
    b.addChild(sug, done);
    this.m.listen(G.on('cat', () => !this.m.closed && this.redraw()));
    this.m.open();
    this.redraw();
  }

  private changed() {
    this.redraw();
    this.onChange();
  }
  private redraw() {
    this.drawCabins();
    this.drawSummary();
    this.drawList();
  }

  // ------------------------------------------------------------ cabins
  private drawCabins() {
    const box = this.cabins;
    clearChildren(box);
    const n = crewSize(this.shipId);
    const cur = crew(this.shipId);
    const hint = label(this.selected >= 0 ? `CAMAROTE ${this.selected + 1}: ahora toca un gato de la lista` : 'Toca un camarote para elegir quién va ahí, o toca gatos para subirlos / bajarlos', 15, P.blue, { letterSpacing: 1 });
    box.addChild(hint);
    const w = Math.min(230, (1100 - (n - 1) * 12) / n);
    const h = 170;
    for (let i = 0; i < n; i++) {
      const c = cur[i] ? getCat(cur[i]) : undefined;
      const s = new Container();
      const sel = this.selected === i;
      s.addChild(new Graphics().rect(5, 5, w, h).fill(C.ink).rect(0, 0, w, h).fill(sel ? C.yellow : c ? C.paper : 0xd9cdb8).stroke({ width: sel ? 5 : 3, color: C.ink }));
      const cab = label(`CAMAROTE ${i + 1}`, 13, P.blue, { letterSpacing: 2 });
      cab.position.set(8, 6);
      s.addChild(cab);
      if (c) {
        const d = catDef(c.species);
        const p = catPortrait(c.species, 92);
        p.position.set(w / 2, 72);
        const nm = txt(c.name.toUpperCase(), { fontFamily: F.poster, fontSize: 22, fill: C.ink });
        nm.anchor.set(0.5, 0);
        nm.position.set(w / 2, 120);
        if (nm.width > w - 12) nm.scale.set((w - 12) / nm.width);
        const lv = label(`Nv ${c.level} · PODER ${fmt(catPow(c))}`, 12, C.ink);
        lv.anchor.set(0.5, 0);
        lv.position.set(w / 2, 146);
        s.addChild(p, nm, lv, new Graphics().rect(0, h - 6, w, 6).fill(RARITY[d.rarity]?.color ?? C.ink));
        if (this.ctx) s.addChild(this.verdictChip(catMatchup(c.species, this.ctx), w - 8, 24, true));
      } else {
        const plus = txt('+', { fontFamily: F.poster, fontSize: 70, fill: sel ? C.ink : P.blueSoft });
        plus.anchor.set(0.5);
        plus.alpha = 0.6;
        plus.position.set(w / 2, h / 2 + 6);
        s.addChild(plus);
      }
      s.position.set(i * (w + 12), 30);
      clickable(s, () => {
        sfx('click');
        if (sel && c) {
          setCrew(this.shipId, cur.filter((u) => u !== c.uid));
          this.selected = -1;
          this.changed();
          return;
        }
        this.selected = sel ? -1 : i;
        this.drawCabins();
      });
      box.addChild(s);
    }
  }

  private drawSummary() {
    const box = this.summary;
    clearChildren(box);
    box.position.set(1130, 66);
    const cur = crew(this.shipId).map((u) => getCat(u)!).filter(Boolean);
    const pow = cur.reduce((a, c) => a + catPow(c), 0);
    const l = label('PODER DE LA TRIPULACIÓN', 13, P.blue, { letterSpacing: 2 });
    const v = txt(fmt(pow), { fontFamily: F.poster, fontSize: 52, fill: P.blue });
    v.y = 16;
    box.addChild(l, v);
    if (this.ctx) {
      const ms = cur.map((c) => catMatchup(c.species, this.ctx!));
      const good = ms.filter((m) => m.verdict === 'ventaja').length;
      const bad = ms.filter((m) => m.verdict === 'desventaja').length;
      const vs = this.ctx.hull ? `Casco enemigo: ${Math.round(this.ctx.hull.share * 100)}% ${this.ctx.hull.name}` : 'Casco enemigo: sin avistar';
      const t = txt(`${vs}\n${good} con ventaja · ${bad} en desventaja`, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink, lineHeight: 20 });
      t.position.set(0, 84);
      box.addChild(t);
    }
  }

  // ------------------------------------------------------------ extra toggles (only free cats / only with advantage)
  private drawExtras() {
    const box = this.extraBox;
    clearChildren(box);
    const opts: [Extra, string][] = [['free', 'SOLO LIBRES']];
    if (this.ctx) opts.push(['edge', 'CON VENTAJA']);
    opts.forEach(([k, t], i) => {
      const on = this.extras.has(k);
      const c = new Container();
      const tt = txt(t, { fontFamily: F.bebas, fontSize: 21, fill: on ? C.paper : C.ink, letterSpacing: 1 });
      const w = tt.width + 24;
      c.addChild(new Graphics().rect(3, 3, w, 44).fill(C.ink).rect(0, 0, w, 44).fill(on ? C.ink : C.paper).stroke({ width: 2.5, color: C.ink, alignment: 1 }), tt);
      tt.position.set(12, 10);
      c.position.set(0, i * 52);
      clickable(c, () => {
        sfx('tick');
        if (on) this.extras.delete(k);
        else this.extras.add(k);
        this.drawExtras();
        this.drawList();
      });
      box.addChild(c);
    });
  }

  // ------------------------------------------------------------ the roster
  private drawList() {
    const sb = this.list;
    const keep = sb.scrollY;
    clearChildren(sb.content);
    const q: CatQuery = { ...this.bar.q };
    let cats = queryCats(q);
    if (this.extras.has('free')) cats = cats.filter((c) => !catBusy(c.uid) && !this.otherShip(c.uid));
    if (this.extras.has('edge') && this.ctx) cats = cats.filter((c) => catMatchup(c.species, this.ctx!).verdict === 'ventaja');
    const per = Math.max(1, Math.floor((sb.bw - 20 + GAP) / (CARD_W + GAP)));
    const cur = crew(this.shipId);
    cats.forEach((c, i) => {
      const card = this.card(c.uid, cur.includes(c.uid));
      card.position.set((i % per) * (CARD_W + GAP), Math.floor(i / per) * (CARD_H + GAP));
      sb.content.addChild(card);
    });
    if (!cats.length) {
      const e = txt('Ningún gato con ese filtro.', { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.ink, fontStyle: 'italic' });
      e.alpha = 0.6;
      e.position.set(10, 10);
      sb.content.addChild(e);
    }
    sb.setContentHeight(Math.ceil(cats.length / per) * (CARD_H + GAP));
    sb.scrollTo?.(keep, false);
  }

  private otherShip(uid: string) {
    for (const [sid, list] of Object.entries(G.s.ship.crew)) if (sid !== this.shipId && G.s.ship.owned.includes(sid) && list.includes(uid)) return sid;
    return null;
  }

  private card(uid: string, inCrew: boolean) {
    const c = getCat(uid)!;
    const d = catDef(c.species);
    const busy = catBusy(uid);
    const other = this.otherShip(uid);
    const card = new Container();
    const face = inCrew ? 0xfff1b8 : C.paper;
    card.addChild(new Graphics().rect(5, 5, CARD_W, CARD_H).fill(C.ink).rect(0, 0, CARD_W, CARD_H).fill(face).stroke({ width: inCrew ? 4 : 2.5, color: inCrew ? C.pinkHot : C.ink }));
    card.addChild(new Graphics().rect(0, 0, 7, CARD_H).fill(RARITY[d.rarity]?.color ?? C.ink));
    const p = catPortrait(c.species, 104, { ring: inCrew ? C.pinkHot : C.ink });
    p.position.set(66, 70);
    if (busy) {
      const gray = new ColorMatrixFilter();
      gray.desaturate();
      p.filters = [gray];
      p.alpha = 0.6;
    }
    card.addChild(p);
    const nm = txt(c.name.toUpperCase(), { fontFamily: F.poster, fontSize: 26, fill: C.ink });
    nm.position.set(126, 6);
    if (nm.width > 186) nm.scale.set(186 / nm.width);
    card.addChild(nm);
    // elements
    d.elements.forEach((e, k) => {
      const ic = elementIcon(e, 24);
      ic.position.set(CARD_W - 20 - k * 27, 20);
      card.addChild(ic);
    });
    const stats = txt(`Nv ${c.level}  ${'★'.repeat(c.stars)}   PODER ${fmt(catPow(c))}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink });
    stats.position.set(126, 40);
    if (stats.width > CARD_W - 136) stats.scale.set((CARD_W - 136) / stats.width);
    const role = ROLE_BY_ID.get(d.role)?.name ?? d.role;
    const shot = txt(`${role.toUpperCase()} · ${d.combat.shot.name}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 13, fill: P.blue });
    shot.position.set(126, 62);
    if (shot.width > CARD_W - 136) shot.scale.set((CARD_W - 136) / shot.width);
    const ult = txt(`ULTI: ${d.combat.ultimate.name}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 12, fill: C.ink });
    ult.alpha = 0.75;
    ult.position.set(126, 80);
    if (ult.width > CARD_W - 136) ult.scale.set((CARD_W - 136) / ult.width);
    card.addChild(stats, shot, ult);
    // status line
    const tags: [string, number][] = [];
    if (inCrew) tags.push(['A BORDO', C.pinkHot]);
    if (busy) tags.push([busy === 'expedition' ? 'DE EXPEDICIÓN' : 'CON OFICIO', C.red]);
    else if (other) tags.push([`EN ${(SHIP_BY_ID.get(other)?.name ?? other).toUpperCase()}`, P.blue]);
    let tx = 126;
    for (const [t, col] of tags) {
      const tt = txt(t, { fontFamily: F.bebas, fontSize: 16, fill: C.paper, letterSpacing: 1 });
      const bg = new Graphics().rect(0, 0, tt.width + 12, 22).fill(col);
      const tc = new Container();
      tc.addChild(bg, tt);
      tt.position.set(6, 2);
      tc.position.set(tx, 99);
      tx += tt.width + 18;
      card.addChild(tc);
    }
    if (this.ctx) {
      const chip = this.verdictChip(catMatchup(c.species, this.ctx), CARD_W - 8, CARD_H - 27, false);
      card.addChild(chip);
    }
    clickable(card, () => {
      if (this.list.wasDrag) return;
      if (busy) {
        sfx('error');
        toast(busy === 'expedition' ? `${c.name} anda de expedición` : `${c.name} está trabajando`, { color: C.paper, sub: busy === 'expedition' ? 'Vuelve cuando termine el viaje' : 'Quítale el oficio en Oficios para que zarpe' });
        gsap.fromTo(card, { x: card.x - 6 }, { x: card.x, duration: 0.3, ease: 'elastic.out(1,0.3)' });
        return;
      }
      this.pick(uid);
    });
    return card;
  }

  /** ▲ VENTAJA ×1.5 contra Madera · ▼ DESVENTAJA … (right-aligned at x) */
  private verdictChip(m: Matchup, x: number, y: number, compact: boolean) {
    const c = new Container();
    const col = m.verdict === 'ventaja' ? 0x2e8a52 : m.verdict === 'desventaja' ? C.red : 0x8a8170;
    const head = m.verdict === 'ventaja' ? '▲ VENTAJA' : m.verdict === 'desventaja' ? '▼ DESVENTAJA' : '= PAREJO';
    const text = compact || !m.notes.length ? head : `${head} · ${m.notes[0]}`;
    const t = txt(text, { fontFamily: F.bebas, fontSize: compact ? 15 : 17, fill: C.paper, letterSpacing: 1 });
    c.addChild(new Graphics().rect(0, 0, t.width + 12, t.height + 2).fill(col), t);
    t.position.set(6, 1);
    c.position.set(x - c.width, y);
    return c;
  }

  private pick(uid: string) {
    const cur = [...crew(this.shipId)];
    const n = crewSize(this.shipId);
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
      // keep walking the cabins: the next empty one (or none)
      const next = cur.length < n ? cur.length : -1;
      this.selected = next;
    } else if (idx >= 0) cur.splice(idx, 1);
    else if (cur.length < n) cur.push(uid);
    else {
      toast('Tripulación completa', { sub: 'Toca un camarote para cambiar a quien va ahí, o baja a alguien primero.', color: C.paper });
      sfx('error');
      return;
    }
    setCrew(this.shipId, cur.filter(Boolean));
    this.changed();
  }
}
