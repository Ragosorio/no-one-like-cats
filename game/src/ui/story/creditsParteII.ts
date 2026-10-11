/**
 * Créditos de la PARTE II (H65 «Continuará»).
 *
 *   creditsData()        the credits as DATA: the title, Ragosorio as creator and composer of the 6 original songs (their
 *                        titles), the Parte II cast (a cat you haven't met is «???»), the crew, the night's numbers,
 *                        thanks and links. The YONOSE TODO Momento (app/o4Finale.ts playFinale) consumes it.
 *   playCreditsParteII   the FALLBACK roll (cine h65_creditos · Ajustes › VOLVER A VER): a night edition of the Diario
 *                        del Mar rolls up over a sky whose stars still fall upward while your crew walks along the
 *                        bottom, ON THE CLOCK, over YONOSE TODO's 3-layer «Reconstrucción» (a variation: the original
 *                        belongs to the Momento) that gains its bass and its drums as the roll goes. It ends on
 *                        REGISTRO 000's Catdex card: ESTADO «observando» is struck out and «despertando» written by hand
 *                        (`onWake`: the caller persists that), then CONTINUARÁ.
 *
 * Watched to the end: hold = faster; IR AL FINAL runs to the card (the mission is that card). Only a replay closes early.
 */
import { Container, Graphics, Text, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { C, F } from '../theme';
import { Button, poster, txt } from '../widgets';
import { G } from '../../state/game';
import { CATS } from '../../data/content';
import { livingCat, preloadCats } from '../../art/catArt';
import { ART } from '../../art/livingCat';
import { slugOf } from '../../art/tint';
import { crew } from '../../state/sys/ship';
import { catSlug } from '../../state/sys/forms';
import { audioApi } from '../../audio/api';
import { cueBest } from '../../cine/sound';
import { INSTAGRAM, MAI_REPO, REPO } from './credits';
import { InkText } from './o4Tachones';
import { REGISTRO_000 } from './rupturasScript';
import { PARTE_II_TITLE, PARTE_II_WAVES } from './rupturasScriptO4';
import { ecosAwakeCount } from '../../state/sys/ecos';
import especiesO1 from '../../data/rupturas/especies.json';
import especiesO2 from '../../data/rupturas/especies-o2.json';
import especiesO3 from '../../data/rupturas/especies-o3.json';
import especiesO4 from '../../data/rupturas/especies-o4.json';

/** the owner's six original songs (docs/part-ii/18): titles exactly as he wrote them, and their track ids */
export const SONGS: { title: string; id: string }[] = [
  { title: 'CIRCUS MALUS', id: 'circus_malus' },
  { title: 'Hemkade', id: 'hemkade' },
  { title: 'LIKY FIGHT', id: 'liky_fight' },
  { title: 'WHEN I LOSE', id: 'when_i_lose' },
  { title: 'YONOSE TODO', id: 'yonose_todo' },
  { title: 'te ODIO', id: 'te_odio' },
];
export const CREATOR = 'Ragosorio';
/** the Parte II cast in order of appearance (Oleadas 1–4) */
export const PART2_CAST: string[] = [especiesO1, especiesO2, especiesO3, especiesO4].flatMap((j) => ((j as { cats?: { id: string }[] }).cats ?? []).map((c) => c.id));

/** the fallback roll's clock (s): it reaches REGISTRO 000's card, the card wakes, CONTINUARÁ, the end */
export const ROLL_S = 78;
export const T_WAKE = ROLL_S + 3.5;
export const T_END = T_WAKE + 5;
/** the bed: YONOSE TODO «Reconstrucción» keys → + bass → + drums (same grid: switched in place, on the bar) */
export const CREDITS_BEDS = ['yonose_todo.aftermath', 'yonose_todo.aftermath_bajo', 'yonose_todo.aftermath_ritmo'];

export interface CreditsData {
  title: string;
  subtitle: string;
  waves: string;
  creator: string;
  /** the 6 original songs, all composed by the creator */
  songs: { title: string; id: string; composer: string; inFonoteca: boolean }[];
  /** Canelo's name in this save + the voices */
  leads: string[];
  /** every Parte II cat in order of appearance: its name once it's in your Catdex, «???» before */
  cast: { id: string; name: string; known: boolean }[];
  /** your crew right now (art slugs, at most 6) */
  crewSlugs: string[];
  /** the night edition's numbers (this save) */
  stats: string[];
  thanks: string[];
  links: { text: string; url: string }[];
}

/** the Parte II credits as data (the YONOSE TODO Momento reads this; the fallback roll draws it) */
export function creditsData(): CreditsData {
  const s = G.s;
  const unlocked = Object.keys(((s.ext?.music as { unlocked?: Record<string, unknown> } | undefined)?.unlocked ?? {}) as Record<string, unknown>);
  const songOf = (r: string) => r.split('.')[0];
  const canelo = s.cats.find((c) => c.species === 'c_canelo');
  const caneloName = canelo?.name || 'Canelo';
  const islands = Object.keys(s.flags ?? {}).filter((f) => f.startsWith('region_visited:') && s.flags[f]).length;
  const registered = Object.values(s.catdex).filter((v) => v === 'registered').length;
  const songs = SONGS.map((x) => ({ ...x, composer: CREATOR, inFonoteca: unlocked.some((r) => songOf(r) === x.id) }));
  const crewSlugs = crew()
    .map((u) => s.cats.find((c) => c.uid === u))
    .filter((c): c is NonNullable<typeof c> => !!c)
    .map((c) => catSlug(c))
    .slice(0, 6);
  return {
    title: 'NO ONE LIKE CATS',
    subtitle: PARTE_II_TITLE,
    waves: PARTE_II_WAVES,
    creator: CREATOR,
    songs,
    leads: [`${caneloName}, como sí mismo (y como almirante)`, 'Luzterna, desde el faro', 'Tu tripulación, como la mejor tripulación'],
    cast: PART2_CAST.map((id) => {
      const d = CATS.find((c) => c.id === id);
      const known = !!d && !!s.catdex?.[id] && s.catdex[id] !== 'rumor';
      return { id, name: known ? d!.name : '???', known };
    }),
    crewSlugs: crewSlugs.length ? crewSlugs : [slugOf('c_canelo')],
    stats: [
      `Islas que nadie había dibujado y tú pisaste: ${islands}.`,
      `Gatos que recordaron otra vida: ${ecosAwakeCount()}. Gatos en tu Catdex: ${registered}/${CATS.length}.`,
      `Canciones en tu FONOTECA: ${songs.filter((x) => x.inFonoteca).length}/${SONGS.length}.`,
      `Última hora: ${caneloName} sigue dormido encima de una página. Nadie se atreve a moverlo.`,
    ],
    thanks: ['A quien terminó la Parte I y volvió por más.', 'A mi familia.', 'A cada gato que se durmió encima de algo importante.'],
    links: [
      { text: 'github.com/Ragosorio/no-one-like-cats', url: REPO },
      { text: 'MAI SVG: github.com/Ragosorio/MAI-SVG', url: MAI_REPO },
      { text: 'instagram.com/ragosorio', url: INSTAGRAM },
    ],
  };
}

type Block = { kind: 'head' | 'title' | 'sub' | 'body' | 'small' | 'gap' | 'link'; text?: string; url?: string };
/** the roll, top to bottom (pure: data in, blocks out) */
export function creditBlocks(d: CreditsData): Block[] {
  const out: Block[] = [
    { kind: 'head', text: 'EL DIARIO DEL MAR' },
    { kind: 'sub', text: 'EDICIÓN NOCTURNA: LA ERA DE LAS RUPTURAS' },
    { kind: 'gap' },
    ...d.stats.slice(0, 3).map((t): Block => ({ kind: 'body', text: t })),
    { kind: 'small', text: d.stats[3] },
    { kind: 'gap' },
    { kind: 'title', text: d.title },
    { kind: 'sub', text: d.subtitle },
    { kind: 'small', text: d.waves },
    { kind: 'gap' },
    { kind: 'sub', text: 'UN JUEGO DE' },
    { kind: 'title', text: d.creator.toUpperCase() },
    { kind: 'body', text: 'Idea, historia, gatos y código. Hecho con todo el corazón.' },
    { kind: 'gap' },
    { kind: 'sub', text: 'MÚSICA ORIGINAL' },
    { kind: 'body', text: `Seis canciones compuestas por ${d.creator}:` },
    ...d.songs.map((x): Block => ({ kind: 'body', text: `«${x.title}»` })),
    { kind: 'small', text: '(Están todas en tu FONOTECA. Bueno: las que ya encontraste.)' },
    { kind: 'gap' },
    { kind: 'sub', text: 'REPARTO' },
    ...d.leads.map((t): Block => ({ kind: 'body', text: t })),
    { kind: 'gap' },
  ];
  // the cast three per line, like a playbill
  for (let i = 0; i < d.cast.length; i += 3) out.push({ kind: 'small', text: d.cast.slice(i, i + 3).map((c) => c.name).join('  ·  ') });
  out.push({ kind: 'gap' }, { kind: 'sub', text: 'GRACIAS' }, ...d.thanks.map((t): Block => ({ kind: 'body', text: t })), { kind: 'small', text: '(Sabemos que fue a propósito.)' });
  out.push({ kind: 'gap' }, { kind: 'sub', text: 'ES DE TODOS' }, { kind: 'body', text: 'Gratis. Sin anuncios. Sin compras. Sin trampas. De código abierto.' });
  out.push(...d.links.map((l): Block => ({ kind: 'link', text: l.text, url: l.url })), { kind: 'gap' });
  return out;
}

/** the night behind the paper: deep indigo, stars that still fall upward (cheap: one Graphics, redrawn) */
function nightSky(reduce: boolean) {
  const c = new Container();
  const bg = new Graphics();
  const bands = [0x0b0a1f, 0x120f2c, 0x1a1538, 0x221a44, 0x2a1f4c];
  bands.forEach((col, i) => bg.rect(0, (H / bands.length) * i, W, H / bands.length + 2).fill({ color: col }));
  const stars = new Graphics();
  c.addChild(bg, stars);
  const n = reduce ? 40 : 110;
  const pts = Array.from({ length: n }, (_, i) => ({ x: (((i * 7919) % 1000) / 1000) * W, y: (((i * 104729) % 1000) / 1000) * H, r: 1 + (i % 3), v: reduce ? 4 : 10 + (i % 7) * 4 }));
  let t = 0;
  const tick = (tk: Ticker) => {
    const dt = Math.min(0.1, tk.deltaMS / 1000);
    t += dt;
    stars.clear();
    for (const p of pts) {
      p.y -= p.v * dt;
      if (p.y < -10) p.y = H + 10;
      stars.circle(p.x, p.y, p.r).fill({ color: 0xfff6e0, alpha: 0.35 + 0.35 * Math.abs(Math.sin(t * 0.7 + p.x)) });
    }
  };
  Ticker.shared.add(tick);
  return { c, stop: () => Ticker.shared.remove(tick) };
}

/** REGISTRO 000's card as the Catdex shows it (panels/collection/registro000.ts), for the last frame */
function registroCard(): { card: Container; estado: Container } {
  const card = new Container();
  const CW = 760;
  const CH = 470;
  const g = new Graphics().roundRect(-CW / 2, -CH / 2, CW, CH, 14).fill({ color: 0xf3efe6 }).stroke({ width: 5, color: C.ink });
  card.addChild(g);
  const head = txt(`${REGISTRO_000.serial} · ${REGISTRO_000.title}`, { fontFamily: F.bebas, fontSize: 52, fill: C.ink, letterSpacing: 4 }) as Text;
  head.anchor.set(0.5, 0);
  head.position.set(0, -CH / 2 + 26);
  card.addChild(head);
  let y = -CH / 2 + 118;
  let estado = new Container();
  for (const [k, v] of REGISTRO_000.fields) {
    const kt = txt(k, { fontFamily: F.bebas, fontSize: 34, fill: 0x6c6458, letterSpacing: 3 }) as Text;
    kt.position.set(-CW / 2 + 60, y);
    card.addChild(kt);
    if (k === 'ESTADO') {
      estado = new Container();
      estado.position.set(-CW / 2 + 280, y - 6);
      card.addChild(estado);
    } else {
      const vt = txt(v, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 34, fill: C.ink }) as Text;
      vt.position.set(-CW / 2 + 280, y - 2);
      card.addChild(vt);
    }
    y += 70;
  }
  const note = txt(REGISTRO_000.author, { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: 0x8d8678 }) as Text;
  note.anchor.set(0.5, 1);
  note.position.set(0, CH / 2 - 22);
  card.addChild(note);
  return { card, estado };
}

/** position in a «Reconstrucción» file for a track time (they loop 2.1–34.1 s, 12 bars, on the same grid) */
const bedPos = (tt: number) => (tt < 34.1 ? tt : 2.1 + ((tt - 2.1) % 32));
/** start the bed (layer 0, or the plain keys / the intro loop when the layers aren't there): the ref, null = none */
function bedStart(): string | null {
  return cueBest([CREDITS_BEDS[0], 'yonose_todo.ambient', 'yonose_todo.menu_loop'], { fadeIn: 2.5, loop: true, quantize: 'now' });
}
/** the next layer, in place, on the next bar (doc 23: the three files share the grid) */
function bedLayer(n: number) {
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    off();
    const tt = audioApi.trackTime();
    cueBest([CREDITS_BEDS[n]], { fadeIn: 0.8, loop: true, quantize: 'now', ...(tt !== null ? { at: bedPos(tt) } : {}) });
  };
  const off = audioApi.on('bar', go);
  window.setTimeout(go, 3000);
}

/**
 * The fallback roll. Resolves after CONTINUARÁ (or CERRAR). `onWake` fires once when REGISTRO 000 wakes (persist it
 * there). `music: false` = the caller handles audio (tests, a Momento that only borrows the picture).
 */
export async function playCreditsParteII(layer: Container, o: { onWake?: () => void; music?: boolean; reduceMotion?: boolean; replay?: boolean } = {}): Promise<void> {
  const d = creditsData();
  await preloadCats(d.crewSlugs).catch(() => undefined);
  // the bed: if the finale's scene already started one, it carries on; else it starts here
  const music = o.music !== false;
  let layerOn = -1;
  if (music) {
    const cur = audioApi.currentTrack() ?? '';
    if (CREDITS_BEDS.includes(cur)) layerOn = CREDITS_BEDS.indexOf(cur);
    else {
      const ref = bedStart();
      layerOn = ref === null ? -1 : ref === CREDITS_BEDS[0] ? 0 : 2;
    }
  }

  return new Promise((resolve) => {
    const root = new Container();
    root.eventMode = 'static';
    root.hitArea = { contains: () => true };
    layer.addChild(root);
    const sky = nightSky(!!o.reduceMotion);
    root.addChild(sky.c);
    // the paper column (a newspaper strip on the night)
    const COLW = 1120;
    const strip = new Graphics().rect(W / 2 - COLW / 2, 0, COLW, H).fill({ color: C.paper, alpha: 0.95 });
    for (const x of [W / 2 - COLW / 2 + 30, W / 2 + COLW / 2 - 30]) strip.moveTo(x, 0).lineTo(x, H).stroke({ width: 3, color: C.ink, alpha: 0.55 });
    root.addChild(strip);
    const col = new Container();
    root.addChild(col);

    let y = H * 0.85;
    for (const b of creditBlocks(d)) {
      if (b.kind === 'gap') {
        y += 70;
        continue;
      }
      let node: Container;
      if (b.kind === 'head') node = txt(b.text!, { fontFamily: F.news, fontSize: 88, fill: C.ink });
      else if (b.kind === 'title') node = poster(b.text!, 116, C.ink);
      else if (b.kind === 'sub') node = txt(b.text!, { fontFamily: F.bebas, fontSize: 44, fill: C.red, letterSpacing: 4, wordWrap: true, wordWrapWidth: 960, align: 'center' });
      else if (b.kind === 'small') node = txt(b.text!, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 26, fill: C.ink, wordWrap: true, wordWrapWidth: 960, align: 'center' });
      else if (b.kind === 'link') node = new Button(b.text!, () => window.open(b.url, '_blank', 'noopener'), { w: 560, h: 64, size: 26, color: C.yellow });
      else node = txt(b.text!, { fontFamily: F.ui, fontWeight: '700', fontSize: 32, fill: C.ink, wordWrap: true, wordWrapWidth: 960, align: 'center' });
      if (node instanceof Button) node.position.set(W / 2 - 280, y);
      else {
        (node as Container & { anchor?: { set: (x: number, y: number) => void } }).anchor?.set(0.5, 0);
        node.position.set(W / 2, y);
      }
      col.addChild(node);
      y += node.height + 22;
    }
    // the last thing on the page: REGISTRO 000's card, held a little above the middle (CONTINUARÁ goes under it)
    const { card, estado } = registroCard();
    const cardY = y + 360;
    card.position.set(W / 2, cardY);
    col.addChild(card);
    const CARD_AT = H / 2 - 70;
    const scrollEnd = cardY - CARD_AT;
    const estadoInk = new InkText('observando', { size: 40, width: 420, align: 'left', font: F.serif, color: C.ink, strike: 0xc8102e });
    estado.addChild(estadoInk);
    void estadoInk.play({ speed: 99 });
    estadoInk.finish();

    // the crew walks along the bottom (the paper footer)
    const footer = new Graphics().rect(0, H - 170, W, 170).fill({ color: 0x15122e, alpha: 0.96 }).moveTo(0, H - 170).lineTo(W, H - 170).stroke({ width: 3, color: 0xe8e0ff, alpha: 0.5 });
    root.addChild(footer);
    const walkers: Container[] = [];
    d.crewSlugs.forEach((slug, i) => {
      const p = livingCat(slug, { anchorX: 0.5, anchorY: 0.94, fps: 12, acts: 'calm' });
      p.walk = 1;
      p.scale.set(-140 / ART, 140 / ART);
      const c = new Container();
      c.addChild(p);
      c.position.set(-120 - i * 230, H - 14);
      root.addChild(c);
      walkers.push(c);
    });

    let woke = false;
    let toEnd = false;
    // below the cine's letterbox (the bars cover the top ~60 px)
    const close = new Button(o.replay ? 'CERRAR' : 'IR AL FINAL', () => (woke || o.replay ? finish() : (toEnd = true)), { w: 220, h: 58, size: 26, color: C.paper });
    close.position.set(W - 260, 84);
    root.addChild(close);

    let fast = false;
    root.on('pointerdown', () => (fast = true));
    root.on('pointerup', () => (fast = false));
    root.on('pointerupoutside', () => (fast = false));

    // the clock of the roll (s): runs ×4 while held, and jumps to the card with IR AL FINAL
    let t = 0;
    let ended = false;
    let wakeAt = Infinity;
    const wake = () => {
      if (woke) return;
      woke = true;
      if (!o.replay) close.setText('CERRAR');
      audioApi.stinger('registro_000_despertando'); // the cell slips into the arc's (recipe fallback: registro_000)
      // «observando» gets struck out and «despertando» written by hand
      estadoInk.destroy();
      const ink = new InkText('~~observando~~ despertando', { size: 40, width: 460, align: 'left', font: F.serif, color: C.ink, strike: 0xc8102e });
      estado.addChild(ink);
      void ink.play({ speed: 3, reduceMotion: o.reduceMotion });
      if (!o.reduceMotion) gsap.fromTo(card.scale, { x: 1, y: 1 }, { x: 1.03, y: 1.03, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut' });
      o.onWake?.();
    };
    const theEnd = () => {
      if (ended) return;
      ended = true;
      const fin = poster('CONTINUARÁ', 120, 0xfff6e0, { stroke: { color: 0x15122e, width: 10 } });
      fin.anchor.set(0.5);
      fin.position.set(W / 2, H - 170 - 80);
      root.addChild(fin);
      gsap.from(fin, { alpha: 0, duration: 1.2 });
      gsap.fromTo(close.scale, { x: 1.2, y: 1.2 }, { x: 1, y: 1, duration: 0.4, ease: 'back.out(3)' });
      window.setTimeout(() => finish(), 7000);
    };

    const tick = (tk: Ticker) => {
      const dt = Math.min(0.1, tk.deltaMS / 1000);
      if (toEnd && t < ROLL_S) t = Math.min(ROLL_S, t + dt * 30);
      else t += dt * (fast && t < ROLL_S ? 4 : 1);
      col.y = -Math.min(scrollEnd, (t / ROLL_S) * scrollEnd);
      // the bed gains its bass at a third, its drums at two thirds
      if (music && layerOn >= 0 && layerOn < 2 && t >= ((layerOn + 1) * ROLL_S) / 3) {
        layerOn++;
        bedLayer(layerOn);
      }
      if (t >= ROLL_S && wakeAt === Infinity) wakeAt = t + 3.5;
      if (!woke && t >= wakeAt) wake();
      if (!ended && t >= wakeAt + 5) theEnd();
      for (const w of walkers) {
        w.x += 72 * dt;
        if (w.x > W + 140) w.x = -140;
      }
    };
    Ticker.shared.add(tick);
    gsap.from(root, { alpha: 0, duration: 0.8 });
    let closing = false;
    const finish = () => {
      if (closing) return;
      closing = true;
      // only a replay can close before the card wakes (the story's credits always reach it)
      if (!woke && !o.replay) wake();
      Ticker.shared.remove(tick);
      sky.stop();
      gsap.to(root, {
        alpha: 0,
        duration: 0.6,
        onComplete: () => {
          root.destroy({ children: true });
          resolve();
        },
      });
    };
  });
}
