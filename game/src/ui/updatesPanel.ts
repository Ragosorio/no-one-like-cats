/**
 * NOVEDADES panel: the update notes a save hasn't seen yet + what the retro patches did to THIS save.
 * Opened once after loading an old save (app/story.ts › maybeIntro) and any time from Ajustes.
 */
import { Container, Graphics } from 'pixi.js';
import { Modal } from './modal';
import { Button, txt, poster } from './widgets';
import { C, F } from './theme';
import { G } from '../state/game';
import { UPDATES, UPDATE_IDS, UpdateNote, UpdateTag } from '../data/updates';
import { patchNotes } from '../state/patches';
import { ScrollBox } from '../panels/collection/ui';

const TAG_COLOR: Record<UpdateTag, number> = { NUEVO: C.mint, ARREGLO: C.yellow, CAMBIO: C.paper, BALANCE: C.pink };

export function unseenUpdates(): UpdateNote[] {
  const seen = new Set(G.s.updatesSeen ?? []);
  return UPDATES.filter((u) => !seen.has(u.id));
}

export function markUpdatesSeen() {
  G.s.updatesSeen = [...UPDATE_IDS];
}

/** something to tell this save? (unseen notes, or patches that touched it this session) */
export function hasNews() {
  return unseenUpdates().length > 0 || patchNotes.length > 0 || G.loadInfo.recovered;
}

/** resolves when closed. `all` = the full history (Ajustes) instead of only what's new */
export function openUpdates(all = false): Promise<void> {
  const notes = all ? UPDATES : unseenUpdates();
  const personal = all ? [] : [...patchNotes];
  if (!all && G.loadInfo.recovered) personal.unshift('Tu partida se había dañado (pasa si el navegador se cierra a medio guardar). La recuperamos de la copia de hace unos minutos.');
  patchNotes.length = 0;
  markUpdatesSeen();
  G.save();
  const m = new Modal('NOVEDADES', 1320, 860, { band: C.pink, bandText: C.ink, subtitle: notes[0] ? notes[0].title.toUpperCase() : 'TODO AL DÍA' });
  const W2 = m.innerW;
  const box = new ScrollBox(W2, m.innerH - 92);
  m.body.addChild(box);
  let y = 0;
  const put = (c: Container, gap = 14) => {
    c.y = y;
    box.content.addChild(c);
    y += c.height + gap;
  };
  if (personal.length) {
    const sec = new Container();
    const head = poster('EN TU PARTIDA', 34, C.ink);
    sec.addChild(head);
    let yy = head.height + 6;
    for (const p of personal) {
      const t = txt(p, { fontFamily: F.ui, fontWeight: '700', fontSize: 20, fill: C.ink, wordWrap: true, wordWrapWidth: W2 - 60, lineHeight: 27 });
      t.position.set(22, yy + 10);
      const bg = new Graphics().rect(0, yy, W2 - 20, t.height + 20).fill(C.yellow).stroke({ width: 3, color: C.ink, alignment: 1 });
      sec.addChild(bg, t);
      yy += t.height + 32;
    }
    put(sec, 24);
  }
  for (const n of notes) {
    const sec = new Container();
    const head = poster(n.title.toUpperCase(), 36, C.ink);
    const date = txt(n.date, { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.ink });
    date.alpha = 0.6;
    date.position.set(head.width + 18, 16);
    sec.addChild(head, date);
    const lz = txt(`LUZTERNA: ${n.luzterna}`, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 20, fill: C.ink, wordWrap: true, wordWrapWidth: W2 - 40 });
    lz.position.set(0, head.height + 4);
    sec.addChild(lz);
    let yy = lz.y + lz.height + 14;
    for (const it of n.items) {
      const tag = new Container();
      const tt = txt(it.tag, { fontFamily: F.poster, fontSize: 18, fill: C.ink, letterSpacing: 1 });
      tt.position.set(8, 2);
      tag.addChild(new Graphics().rect(0, 0, 120, tt.height + 4).fill(TAG_COLOR[it.tag]).stroke({ width: 2, color: C.ink, alignment: 1 }), tt);
      tag.position.set(0, yy + 2);
      const t = txt(it.text, { fontFamily: F.ui, fontWeight: '700', fontSize: 19, fill: C.ink, wordWrap: true, wordWrapWidth: W2 - 170, lineHeight: 26 });
      t.position.set(136, yy);
      sec.addChild(tag, t);
      yy += Math.max(t.height, 30) + 12;
    }
    put(sec, 30);
  }
  if (!notes.length && !personal.length) put(txt('Nada nuevo por aquí. Los gatos siguen igual de raros.', { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.ink }));
  box.setContentHeight(y);
  const ok = new Button('¡A JUGAR!', () => m.close(), { w: 260, h: 68, size: 32, color: C.mint });
  ok.position.set(W2 - 270, m.innerH - 78);
  m.body.addChild(ok);
  m.open();
  return new Promise((res) => (m.onClose = () => res()));
}
