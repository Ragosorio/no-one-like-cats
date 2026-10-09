/**
 * CatFilterBar — the one search / filter / sort strip for lists of owned cats.
 *
 *   const bar = new CatFilterBar(420, { cats: G.s.cats, onChange: (q) => redraw(queryCats(q)) });
 *
 * Row 1: a search field (tap it and type: a real DOM input is laid exactly over it, so phones get
 * their keyboard) + a sort button that cycles PODER → NIVEL → RAREZA → …; tap twice on the same
 * sort to flip ↓/↑. Row 2+: one chip per element present among `cats` (+ TODOS), wrapped to the
 * width. Pure presentation: the filtering itself is state/ext/catQuery.ts.
 */
import { Container, Graphics, Text } from 'pixi.js';
import { sfx } from '../core/audio';
import { OwnedCat } from '../state/game';
import { CatQuery, CatSort, elementsAmong, SORT_LABEL } from '../state/ext/catQuery';
import { elementIcon } from './elementIcon';
import { C, F } from './theme';
import { txt } from './widgets';
import { SearchField } from './searchField';

export interface FilterTheme {
  field: number;
  ink: number;
  /** chip / button face when ON */
  on: number;
  onText: number;
  /** chip face when OFF */
  off: number;
  border: number;
}
export const PAPER_THEME: FilterTheme = { field: 0xf6efe2, ink: C.ink, on: C.ink, onText: C.paper, off: C.paper, border: C.ink };

export interface FilterBarOpts {
  cats: OwnedCat[];
  onChange: (q: CatQuery) => void;
  sorts?: CatSort[];
  initial?: CatQuery;
  theme?: FilterTheme;
  placeholder?: string;
}

const ROW = 44;
const CHIP = 38;

export class CatFilterBar extends Container {
  q: CatQuery;
  barHeight = 0;
  private theme: FilterTheme;
  private sorts: CatSort[];
  private sortText!: Text;
  private chips = new Container();

  constructor(
    public bw: number,
    private o: FilterBarOpts,
  ) {
    super();
    this.theme = o.theme ?? PAPER_THEME;
    this.sorts = o.sorts ?? ['power', 'level', 'rarity', 'stars', 'recent', 'name'];
    this.q = { text: '', elements: [], sort: this.sorts[0], ...o.initial };
    this.build();
  }

  /** the cat pool changed (new cat, element discovered): rebuild the chips, keep the query */
  setCats(cats: OwnedCat[]) {
    this.o.cats = cats;
    this.drawChips();
  }

  private changed() {
    this.o.onChange({ ...this.q, elements: [...(this.q.elements ?? [])] });
  }

  private build() {
    const t = this.theme;
    const sortW = 150;
    const fw = this.bw - sortW - 8;
    // search field
    const field = new SearchField(fw, ROW, { field: t.field, ink: t.ink, border: t.border }, (v) => {
      this.q.text = v;
      this.changed();
    }, this.o.placeholder ?? 'Buscar gato…');
    if (this.q.text) field.set(this.q.text);
    this.addChild(field);
    // sort button
    const sb = new Container();
    const sg = new Graphics().rect(3, 3, sortW, ROW).fill(t.border).rect(0, 0, sortW, ROW).fill(t.on).stroke({ width: 2.5, color: t.border, alignment: 1 });
    this.sortText = txt('', { fontFamily: F.bebas, fontSize: 22, fill: t.onText, letterSpacing: 1 });
    this.sortText.anchor.set(0.5);
    this.sortText.position.set(sortW / 2, ROW / 2 + 1);
    sb.addChild(sg, this.sortText);
    sb.position.set(fw + 8, 0);
    sb.eventMode = 'static';
    sb.cursor = 'pointer';
    sb.on('pointertap', () => {
      sfx('tick');
      const i = this.sorts.indexOf(this.q.sort ?? this.sorts[0]);
      if (this.lastSortTap && performance.now() - this.lastSortTap < 900) {
        // a quick second tap flips the direction instead of moving on
        this.q.asc = !this.effectiveAsc();
        this.lastSortTap = 0;
      } else {
        this.q.sort = this.sorts[(i + 1) % this.sorts.length];
        this.q.asc = undefined;
        this.lastSortTap = performance.now();
      }
      this.paintSort();
      this.changed();
    });
    this.addChild(sb);
    this.paintSort();
    this.chips.y = ROW + 8;
    this.addChild(this.chips);
    this.drawChips();
  }
  private lastSortTap = 0;
  private effectiveAsc() {
    return this.q.asc ?? this.q.sort === 'name';
  }
  private paintSort() {
    this.sortText.text = `${SORT_LABEL[this.q.sort ?? 'power']} ${this.effectiveAsc() ? '↑' : '↓'}`;
  }

  private drawChips() {
    const t = this.theme;
    this.chips.removeChildren().forEach((c) => c.destroy({ children: true }));
    const els = elementsAmong(this.o.cats);
    const sel = new Set(this.q.elements ?? []);
    // drop filters for elements that no longer exist in this pool
    this.q.elements = [...sel].filter((e) => els.includes(e));
    let x = 0;
    let y = 0;
    const place = (w: number) => {
      if (x > 0 && x + w > this.bw) {
        x = 0;
        y += CHIP + 6;
      }
      const p = { x, y };
      x += w + 6;
      return p;
    };
    // TODOS
    const all = new Container();
    const allOn = !this.q.elements.length;
    const at = txt('TODOS', { fontFamily: F.bebas, fontSize: 20, fill: allOn ? t.onText : t.ink, letterSpacing: 1 });
    const aw = at.width + 20;
    all.addChild(new Graphics().rect(0, 0, aw, CHIP).fill(allOn ? t.on : t.off).stroke({ width: 2, color: t.border, alignment: 1 }), at);
    at.position.set(10, 8);
    const ap = place(aw);
    all.position.set(ap.x, ap.y);
    all.eventMode = 'static';
    all.cursor = 'pointer';
    all.on('pointertap', () => {
      sfx('tick');
      this.q.elements = [];
      this.drawChips();
      this.changed();
    });
    this.chips.addChild(all);
    for (const el of els) {
      const on = this.q.elements.includes(el);
      const c = new Container();
      const g = new Graphics().rect(0, 0, CHIP, CHIP).fill(on ? t.on : t.off).stroke({ width: on ? 3 : 2, color: t.border, alignment: 1 });
      const ic = elementIcon(el, CHIP - 8);
      ic.anchor?.set?.(0.5);
      ic.position.set(CHIP / 2, CHIP / 2);
      ic.alpha = on || !this.q.elements.length ? 1 : 0.55;
      c.addChild(g, ic);
      const p = place(CHIP);
      c.position.set(p.x, p.y);
      c.eventMode = 'static';
      c.cursor = 'pointer';
      c.on('pointertap', () => {
        sfx('tick');
        const cur = new Set(this.q.elements ?? []);
        if (cur.has(el)) cur.delete(el);
        else cur.add(el);
        this.q.elements = [...cur];
        this.drawChips();
        this.changed();
      });
      this.chips.addChild(c);
    }
    this.barHeight = ROW + 8 + y + CHIP;
  }

}
