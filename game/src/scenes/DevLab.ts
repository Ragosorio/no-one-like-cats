import { Container, Graphics, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { Scene, scenes } from '../core/scenes';
import { W, H } from '../core/App';
import { Button, paperBg, poster, txt } from '../ui/widgets';
import { C, F } from '../ui/theme';

/**
 * LABORATORIO (?scene=dev, or the LAB button on the title with ?dev=1): one page that lists every
 * developer lab with what it is for and which guide explains it. Labs are harmless (they never touch
 * the save) so they ship in the production build too.
 *
 * Each lab reads its own URL params, so opening one is a plain navigation to `?scene=<id>&...`.
 */
export interface LabEntry {
  /** query string after `?` */
  query: string;
  name: string;
  what: string;
  /** repo path of the guide that explains it */
  doc: string;
  color: number;
}

export const LABS: LabEntry[] = [
  {
    query: 'scene=catlive',
    name: 'GATOS VIVOS',
    what: 'Todos los gatos como marionetas MAI SVG. Click = cambiar emoción. Ideal para probar un gato nuevo.',
    doc: 'docs/guias/agregar-gato.md',
    color: C.yellow,
  },
  {
    query: 'scene=catlive&cat=canelo_cozy_cat&rig=1',
    name: 'RIG DE UN GATO',
    what: 'Un gato en grande con su rig dibujado encima (cabeza, orejas, ojos, cola, flotantes). Cambia &cat=<slug>.',
    doc: 'docs/guias/animaciones.md',
    color: C.mint,
  },
  {
    query: 'scene=fxlab',
    name: 'SECUENCIAS FX',
    what: 'Elige un gato y dispara las secuencias grandes: revelación, elemento nuevo, invocación, estrellas, portada.',
    doc: 'docs/guias/animaciones.md',
    color: C.pink,
  },
  {
    query: 'scene=art',
    name: 'DIMENSIONES',
    what: 'Compara estilos de render (isla, cómic, battle form, tinta manga) y prueba la revelación de un gato.',
    doc: 'docs/guias/animaciones.md',
    color: C.lilac,
  },
  {
    query: 'scene=shiplab',
    name: 'ASTILLERO DE ARTE',
    what: 'Todas las pieles de barco (jugador, enemigos, jefes) en páginas, con tripulación y estados.',
    doc: 'docs/guias/agregar-barco.md',
    color: C.mint,
  },
  {
    query: 'scene=sandbox',
    name: 'ARENA DE DESTRUCCIÓN',
    what: 'Dos barcos y un cañón: arrastra para apuntar y mira cómo se rompen las celdas. Para afinar el golpe.',
    doc: 'docs/guias/agregar-barco.md',
    color: C.orange,
  },
  {
    query: 'scene=battle',
    name: 'BATALLA DE PRUEBA',
    what: 'Una batalla completa con gatos y disparos fijos (src/dev/devBattle.ts). No usa tu partida.',
    doc: 'docs/guias/agregar-barco.md',
    color: C.yellow,
  },
  {
    query: 'scene=islandlab',
    name: 'ISLA DE PRUEBA',
    what: 'Terreno, hábitats por elemento, granjas, santuario y cámara. Para probar el arte de un hábitat.',
    doc: 'docs/guias/agregar-elemento.md',
    color: C.pink,
  },
];

/** dev-server-only helpers (they read test saves from game/test-saves/) */
const DEV_ONLY = [
  '?save=post-boss1 · carga una partida de prueba de game/test-saves/ (solo npm run dev)',
  '?stage=2-9 · entra directo a esa batalla de campaña con tu partida (solo npm run dev)',
  '?speed=4 · el reloj de la economía corre 4 veces más rápido (solo npm run dev)',
  '?realtime=1 · las animaciones siguen el reloj real aunque la pestaña esté en segundo plano (solo npm run dev)',
];

function open(query: string) {
  if (query) location.search = `?${query}`;
  else location.href = location.pathname;
}

export class DevLab extends Scene {
  override enter() {
    this.addChild(paperBg(W, H));
    const title = poster('LABORATORIO', 130, C.ink, { letterSpacing: -2 });
    title.position.set(60, 18);
    const kicker = txt('PARA DESARROLLADORES · NADA DE ESTO TOCA TU PARTIDA', { fontFamily: F.bebas, fontSize: 34, fill: C.red, letterSpacing: 3 });
    kicker.position.set(66, 168);
    this.addChild(title, kicker);

    const back = new Button('VOLVER AL JUEGO', () => open(''), { w: 320, h: 64, size: 28, color: C.paper });
    back.position.set(W - 380, 40);
    this.addChild(back);

    // 2 columns of cards
    const cols = 2;
    const cw = 880;
    const ch = 134;
    const gap = 18;
    const x0 = (W - cols * cw - gap) / 2;
    const y0 = 226;
    LABS.forEach((lab, i) => {
      const card = labCard(lab, cw, ch);
      card.position.set(x0 + (i % cols) * (cw + gap), y0 + Math.floor(i / cols) * (ch + gap));
      this.addChild(card);
      gsap.from(card, { alpha: 0, y: card.y + 40, duration: 0.35, delay: 0.04 * i, ease: 'power2.out' });
    });

    const rows = Math.ceil(LABS.length / cols);
    const yNotes = y0 + rows * (ch + gap) + 6;
    const notes = txt(['ATAJOS DE DESARROLLO', ...DEV_ONLY].join('\n'), { fontFamily: F.ui, fontSize: 19, fill: C.ink, lineHeight: 26 });
    notes.position.set(x0, yNotes);
    const guides = txt('Guías: docs/guias/ (gatos, elementos, historia, barcos, animaciones, arquitectura) · CONTRIBUTING.md', {
      fontFamily: F.ui,
      fontWeight: '700',
      fontSize: 20,
      fill: C.red,
    });
    guides.position.set(x0, H - 44);
    this.addChild(notes, guides);
  }
}

function labCard(lab: LabEntry, w: number, h: number): Container {
  const c = new Container();
  const g = new Graphics();
  g.rect(8, 8, w, h).fill(C.ink);
  g.rect(0, 0, w, h).fill(C.paper).stroke({ width: 4, color: C.ink, alignment: 1 });
  g.rect(0, 0, 22, h).fill(lab.color).stroke({ width: 4, color: C.ink, alignment: 1 });
  const name = poster(lab.name, 44, C.ink);
  name.position.set(42, 8);
  const what = txt(lab.what, { fontFamily: F.ui, fontSize: 19, fill: C.ink, wordWrap: true, wordWrapWidth: w - 280, lineHeight: 24 });
  what.position.set(44, 58);
  const meta = txt(`?${lab.query}  ·  ${lab.doc}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.plum });
  meta.position.set(44, h - 24);
  const go = new Button('ABRIR', () => open(lab.query), { w: 190, h: 64, size: 30, color: lab.color });
  go.position.set(w - 222, (h - 64) / 2 - 6);
  c.addChild(g, name, what, meta, go);
  return c;
}

/**
 * ?dev=1 on the title: a small LAB button in the corner while the title is showing.
 * Lives on the overlay layer so the title scene itself stays untouched.
 */
export function mountDevShortcut(isTitle: () => boolean) {
  const b = new Button('LAB', () => open('scene=dev'), { w: 120, h: 56, size: 26, color: C.mint });
  b.position.set(W - 150, 24);
  scenes.overlayLayer.addChild(b);
  const tick = () => {
    if (b.destroyed) {
      Ticker.shared.remove(tick);
      return;
    }
    b.visible = isTitle();
  };
  Ticker.shared.add(tick);
}
