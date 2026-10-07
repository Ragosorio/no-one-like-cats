/**
 * GLOSARIO DEL MAR — the "¿QUÉ ES ESTO?" panel (owned by the story module).
 *
 *   openGlossary()                 → index + first entry
 *   openGlossary('estrellas')      → that entry
 *   openGlossary(null, mission)    → the mission (what to do + what it's for) and its terms highlighted
 *
 * Data lives in data/glossary.ts (the same entries the first-appearance beats point to).
 * Everything is available to every save (old or new); entries for things the player hasn't reached
 * yet show as "???" so the glossary never spoils the story.
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { Modal } from '../modal';
import { C, F } from '../theme';
import { txt, poster } from '../widgets';
import { iconText } from '../elementIcon';
import { sfx } from '../../core/audio';
import { G } from '../../state/game';
import { MissionDef } from '../../data/content';
import { GLOSSARY, GLOSS_BY_ID, GlossEntry, GLOSS_GROUPS, glossKnown, missionTerms } from '../../data/glossary';
import { clean } from './text';
import { gtxt } from '../gender';

const MW = 1800;
const MH = 980;
const LIST_W = 830;
const COLS = 3;
const ROW_H = 31;

let current: Modal | null = null;

/** Open the glossary (on top of whatever panel is open). */
export function openGlossary(id?: string | null, mission?: MissionDef) {
  if (current && !current.closed) current.close();
  const related = mission ? missionTerms(mission) : [];
  const first = (id && GLOSS_BY_ID.has(id) ? id : related.find((r) => glossKnown(GLOSS_BY_ID.get(r)!))) ?? GLOSSARY.find((e) => glossKnown(e))!.id;
  const m = new Modal('Glosario del Mar', MW, MH, { band: C.plumInk, bandText: C.yellow, subtitle: 'Lo que Luzterna te explicaría si tuviera paciencia' });
  current = m;
  m.label = 'GLOSARIO';
  const list = new Container();
  const detail = new Container();
  m.body.addChild(list, detail);
  detail.position.set(LIST_W + 36, 0);
  let selected = first;
  const draw = () => {
    for (const ch of list.removeChildren()) ch.destroy({ children: true });
    for (const ch of detail.removeChildren()) ch.destroy({ children: true });
    drawList(list, selected, related, (nid) => {
      selected = nid;
      sfx('click', 1.2);
      draw();
    });
    drawDetail(detail, m.innerW - LIST_W - 36, m.innerH, GLOSS_BY_ID.get(selected)!, mission, related, (nid) => {
      selected = nid;
      sfx('click', 1.2);
      draw();
    });
  };
  draw();
  m.open();
  return m;
}

// ------------------------------------------------------------------ list (two columns, grouped)
function drawList(root: Container, selected: string, related: string[], pick: (id: string) => void) {
  const colW = (LIST_W - 16 * (COLS - 1)) / COLS;
  const maxY = MH - 150;
  let col = 0;
  let y = 0;
  const place = (h: number) => {
    if (y + h > maxY) {
      col++;
      y = 0;
    }
    const at = { x: col * (colW + 16), y };
    y += h;
    return at;
  };
  for (const g of GLOSS_GROUPS) {
    const entries = GLOSSARY.filter((e) => e.group === g.id);
    if (!entries.length) continue;
    if (y > 0 && y + ROW_H * 2 + 6 > maxY) {
      col++;
      y = 0;
    }
    const hp = place(ROW_H + 6);
    const head = txt(g.name, { fontFamily: F.bebas, fontSize: 22, fill: C.pinkHot, letterSpacing: 2 });
    head.position.set(hp.x + 2, hp.y + 6);
    root.addChild(head);
    for (const e of entries) {
      const p = place(ROW_H);
      const known = glossKnown(e);
      const isSel = e.id === selected;
      const isRel = related.includes(e.id);
      const row = new Container();
      const bg = new Graphics();
      if (isSel) bg.rect(0, 0, colW, ROW_H - 3).fill(C.ink);
      else if (isRel) bg.rect(0, 0, colW, ROW_H - 3).fill(C.yellow).stroke({ width: 2, color: C.ink, alignment: 1 });
      else bg.rect(0, 0, colW, ROW_H - 3).fill({ color: C.paperDark, alpha: 0.45 });
      const t = txt(known ? e.term : '???', { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: isSel ? C.yellow : C.ink });
      t.position.set(10, (ROW_H - 3 - t.height) / 2);
      if (t.width > colW - 18) t.scale.set((colW - 18) / t.width);
      if (!known) t.alpha = 0.45;
      row.addChild(bg, t);
      row.position.set(p.x, p.y);
      row.eventMode = 'static';
      row.cursor = 'pointer';
      row.on('pointertap', () => pick(e.id));
      root.addChild(row);
    }
  }
}

// ------------------------------------------------------------------ detail
function body(text: string, w: number, size = 21) {
  return iconText(gtxt(clean(text)), { fontFamily: F.ui, fontSize: size, fill: C.ink, fontWeight: '500' }, { wrap: w, leading: 3 });
}

function drawDetail(root: Container, w: number, h: number, e: GlossEntry, mission: MissionDef | undefined, related: string[], pick: (id: string) => void) {
  let y = 0;
  // the mission this was opened from: what to do + what it's for
  if (mission) {
    const box = new Container();
    const k = txt('ESTA MISIÓN', { fontFamily: F.bebas, fontSize: 20, fill: C.pinkHot, letterSpacing: 2 });
    k.position.set(18, 10);
    const t = poster(mission.title, 34, C.ink);
    t.position.set(18, 32);
    if (t.width > w - 40) t.scale.set((w - 40) / t.width);
    const g = body(mission.goal.text, w - 40, 19);
    g.position.set(18, 80);
    let by = 80 + g.height + 6;
    box.addChild(k, t, g);
    if (mission.why) {
      const wl = txt('PARA QUÉ', { fontFamily: F.bebas, fontSize: 19, fill: C.ink, letterSpacing: 2 });
      wl.position.set(18, by);
      const wb = body(mission.why, w - 40, 19);
      wb.position.set(18, by + 22);
      box.addChild(wl, wb);
      by += 22 + wb.height + 4;
    }
    const bg = new Graphics().rect(6, 6, w, by + 12).fill(C.ink).rect(0, 0, w, by + 12).fill(C.yellow).stroke({ width: 3, color: C.ink, alignment: 1 });
    box.addChildAt(bg, 0);
    root.addChild(box);
    y += by + 34;
    // other terms of this mission
    if (related.length > 1) {
      let x = 0;
      const lab = txt('TÉRMINOS:', { fontFamily: F.bebas, fontSize: 20, fill: C.ink, letterSpacing: 1 });
      lab.position.set(0, y + 6);
      root.addChild(lab);
      x = lab.width + 10;
      for (const rid of related) {
        const re = GLOSS_BY_ID.get(rid);
        if (!re || !glossKnown(re)) continue;
        const chip = new Container();
        const ct = txt(re.term, { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: rid === e.id ? C.yellow : C.ink });
        ct.position.set(10, 5);
        const cb = new Graphics().rect(0, 0, ct.width + 20, 30).fill(rid === e.id ? C.ink : C.paper).stroke({ width: 2, color: C.ink, alignment: 1 });
        chip.addChild(cb, ct);
        if (x + cb.width > w) {
          x = lab.width + 10;
          y += 36;
        }
        chip.position.set(x, y);
        chip.eventMode = 'static';
        chip.cursor = 'pointer';
        chip.on('pointertap', () => pick(rid));
        root.addChild(chip);
        x += cb.width + 8;
      }
      y += 48;
    }
  }
  if (!glossKnown(e)) {
    const t = poster('???', 64, C.ink);
    t.position.set(0, y);
    const b = body('Todavía no llegas aquí. Cuando lo veas en tu isla o en el mar, Luzterna te lo explica (y esta página se llena sola).', w - 20);
    b.position.set(0, y + 90);
    root.addChild(t, b);
    return;
  }
  const term = poster(e.term.toUpperCase(), 58, C.ink);
  term.position.set(0, y - 6);
  if (term.width > w) term.scale.set(w / term.width);
  root.addChild(term);
  y += 76;
  const room = h - y;
  const size = room < 430 ? 18 : room < 560 ? 19 : 21;
  const blocks: [string, string][] = [
    ['QUÉ ES', e.what],
    ['PARA QUÉ SIRVE', e.why],
    ['CÓMO SE USA', e.how],
  ];
  for (const [lab, text] of blocks) {
    if (!text) continue;
    const l = txt(lab, { fontFamily: F.bebas, fontSize: 22, fill: C.pinkHot, letterSpacing: 2 });
    l.position.set(0, y);
    const b = body(text, w - 10, size);
    b.position.set(0, y + 26);
    root.addChild(l, b);
    y += 26 + b.height + 14;
  }
  if (e.where) {
    const wt = txt(`DÓNDE: ${clean(e.where)}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 17, fill: C.paper, wordWrap: true, wordWrapWidth: w - 40 });
    wt.position.set(14, y + 7);
    const wb = new Graphics().rect(0, y, Math.min(w, wt.width + 28), wt.height + 14).fill(C.inkBlue);
    root.addChild(wb, wt);
    y += wt.height + 28;
  }
  if (e.quip && y < h - 40) {
    const q = txt(`«${gtxt(clean(e.quip))}» — Luzterna`, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 19, fill: C.plum, wordWrap: true, wordWrapWidth: w - 10 });
    q.position.set(0, y + 4);
    root.addChild(q);
  }
  gsap.from(root, { alpha: 0, duration: 0.15 });
}

/** small "¿QUÉ ES ESTO?" tag button (mission cards, panels). `compact` = a square "?" for tight cards. */
export function whatIsThisButton(onTap: () => void, o: { compact?: boolean; color?: number; label?: string } = {}) {
  const b = new Container();
  const g = new Graphics();
  let t: Text;
  if (o.compact) {
    g.rect(3, 3, 30, 30).fill(C.ink).rect(0, 0, 30, 30).fill(o.color ?? C.yellow).stroke({ width: 2.5, color: C.ink, alignment: 1 });
    t = poster('?', 24, C.ink, { letterSpacing: 0 });
    t.anchor.set(0.5);
    t.position.set(15, 15);
  } else {
    t = txt(o.label ?? '¿QUÉ ES ESTO?', { fontFamily: F.bebas, fontSize: 20, fill: C.ink, letterSpacing: 1 });
    t.position.set(10, 4);
    const bw = t.width + 20;
    g.rect(3, 3, bw, 30).fill(C.ink).rect(0, 0, bw, 30).fill(o.color ?? C.yellow).stroke({ width: 2.5, color: C.ink, alignment: 1 });
  }
  b.addChild(g, t);
  b.eventMode = 'static';
  b.cursor = 'pointer';
  b.on('pointerdown', (e) => e.stopPropagation());
  b.on('pointertap', (e) => {
    e.stopPropagation();
    sfx('click', 1.3);
    gsap.fromTo(b.scale, { x: 1.2, y: 1.2 }, { x: 1, y: 1, duration: 0.25, ease: 'back.out(3)' });
    onTap();
  });
  return b;
}

/** a mission's own glossary entry point */
export function openMissionHelp(m: MissionDef) {
  return openGlossary(null, m);
}

void G;
