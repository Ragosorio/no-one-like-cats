/**
 * Créditos (b25 + Ajustes › CRÉDITOS): a Diario del Mar special edition that rolls upward while your
 * crew walks along the bottom. Personal stats first, then the thanks, how the game was born, the
 * open-source invitation (game + MAI SVG) and where to follow ragosorio. Tap = faster; CERRAR (or the end) closes.
 */
import { Container, Graphics, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { C, F } from '../theme';
import { Button, paperBg, poster, txt } from '../widgets';
import { G } from '../../state/game';
import { catDef } from '../../data/content';
import { fmt } from '../../core/format';
import { livingCat, preloadCats } from '../../art/catArt';
import { ART } from '../../art/livingCat';
import { slugOf } from '../../art/tint';
import { crew } from '../../state/sys/ship';
import { habitatTier } from '../../state/econ';

export const INSTAGRAM = 'https://www.instagram.com/ragosorio';
export const REPO = 'https://github.com/Ragosorio/no-one-like-cats';
export const MAI_REPO = 'https://github.com/Ragosorio/MAI-SVG';

type Block = { kind: 'head' | 'title' | 'sub' | 'body' | 'small' | 'gap' | 'link'; text?: string; url?: string };

function stats(): Block[] {
  const s = G.s;
  const best = [...s.habitats].sort((a, b) => b.tier - a.tier)[0];
  const lastHab = best ? habitatTier(best.tier).name : 'una caja de cartón';
  const mvp = [...s.cats].sort((a, b) => (b.kos ?? 0) - (a.kos ?? 0))[0];
  const mvpName = mvp ? mvp.name || catDef(mvp.species).name : 'tu primer gato';
  const registered = Object.values(s.catdex).filter((v) => v === 'registered').length;
  const moment = mvp?.moments?.length ? mvp.moments[mvp.moments.length - 1] : 'Cuando el pato hizo ¡cuac!';
  return [
    { kind: 'head', text: 'EL DIARIO DEL MAR' },
    { kind: 'sub', text: 'EDICIÓN ESPECIAL: TU CAPÍTULO 1' },
    { kind: 'gap' },
    { kind: 'body', text: `Tu primer hábitat era una caja de cartón. El mejor que tienes hoy es: ${lastHab}.` },
    { kind: 'body', text: `Tu primer gato lanzaba bolas de pelo. Hoy ${mvpName} borra medio barco (${fmt(mvp?.kos ?? 0)} K.O.).` },
    { kind: 'body', text: `Barcos hundidos: ${fmt(s.stats.victories)} · Gatos descubiertos: ${registered}/54 · Oro ganado: ${fmt(s.stats.goldEarned)}` },
    { kind: 'small', text: `Momento favorito: «${moment}»` },
  ];
}

const ROLL: Block[] = [
  { kind: 'gap' },
  { kind: 'title', text: 'NO ONE LIKE CATS' },
  { kind: 'sub', text: 'CAPÍTULO 1 — EL PRIMER MAR' },
  { kind: 'gap' },
  { kind: 'body', text: 'Hecho con todo el corazón por ragosorio. Espero de verdad que te guste.' },
  { kind: 'gap' },
  { kind: 'sub', text: 'GRACIAS' },
  { kind: 'body', text: 'A mi familia, que inspiró este juego.' },
  { kind: 'body', text: 'A mi hermana.' },
  { kind: 'body', text: 'A mi cuñado Manu.' },
  { kind: 'body', text: 'A quienes lo probaron primero y me dijeron la verdad.' },
  { kind: 'body', text: 'A todas las personas a las que les gustan los gatos.' },
  { kind: 'small', text: '(Y a las que no, también: ya llegarán.)' },
  { kind: 'gap' },
  { kind: 'sub', text: 'CÓMO NACIÓ' },
  { kind: 'body', text: 'Quería hacer una herramienta para editar SVG: MAI SVG.' },
  { kind: 'body', text: 'Para probarla necesitaba un proyecto de verdad. ¿Y qué mejor que un videojuego?' },
  { kind: 'body', text: 'La idea fue evolucionando con muchísimas referencias hasta volverse esto.' },
  { kind: 'body', text: 'Por eso aquí no hay imágenes: cada gato es un SVG vivo que respira, parpadea y mueve la cola.' },
  { kind: 'small', text: 'SVG porque carga más rápido, se puede animar y no nos cuesta nada.' },
  { kind: 'gap' },
  { kind: 'sub', text: 'ES DE TODOS' },
  { kind: 'body', text: 'Este juego es gratis. Sin anuncios. Sin compras. Sin trampas.' },
  { kind: 'body', text: 'La misión: hacer el mejor juego posible, gratis. Uno distinto, con aire fresco, que no quiere cobrarte nada. Sobre todo, para divertirse.' },
  { kind: 'body', text: 'El juego y MAI SVG son de código abierto y son para la comunidad.' },
  { kind: 'body', text: 'Aceptamos colaboraciones: cualquier actualización es muy bienvenida. Nuevos gatos, elementos, historias, barcos, arreglos… todo suma.' },
  { kind: 'link', text: 'github.com/Ragosorio/no-one-like-cats', url: REPO },
  { kind: 'link', text: 'MAI SVG: github.com/Ragosorio/MAI-SVG', url: MAI_REPO },
  { kind: 'gap' },
  { kind: 'sub', text: 'SIGUE A RAGOSORIO' },
  { kind: 'body', text: 'En todas sus redes. Ahí salen los gatos nuevos primero.' },
  { kind: 'link', text: 'instagram.com/ragosorio', url: INSTAGRAM },
  { kind: 'gap' },
  { kind: 'gap' },
  { kind: 'title', text: 'GRACIAS POR JUGAR' },
  { kind: 'sub', text: 'Nos vemos en el próximo mar.' },
  { kind: 'gap' },
];

/** plays until it ends or the player closes it */
export async function playCredits(layer: Container, o: { withStats?: boolean } = {}): Promise<void> {
  const crewSlugs = crew()
    .map((u) => G.s.cats.find((c) => c.uid === u)?.species)
    .filter((x): x is string => !!x)
    .map(slugOf)
    .slice(0, 6);
  if (!crewSlugs.length) crewSlugs.push('canelo_cozy_cat', 'jelly_aquatic_cat', 'margarita_daisy_cat');
  await preloadCats(crewSlugs).catch(() => undefined);
  return new Promise((resolve) => {
    const root = new Container();
    root.eventMode = 'static';
    root.hitArea = { contains: () => true };
    layer.addChild(root);
    const bg = paperBg(W, H);
    const col = new Container();
    root.addChild(bg, col);
    // newspaper rules on the sides
    const rules = new Graphics();
    for (const x of [W / 2 - 520, W / 2 + 520]) rules.moveTo(x, 0).lineTo(x, H).stroke({ width: 3, color: C.ink, alpha: 0.6 });
    root.addChild(rules);

    let y = H * 0.85;
    const blocks = o.withStats === false ? ROLL : [...stats(), ...ROLL];
    for (const b of blocks) {
      if (b.kind === 'gap') {
        y += 70;
        continue;
      }
      let node: Container;
      if (b.kind === 'head') node = txt(b.text!, { fontFamily: F.news, fontSize: 92, fill: C.ink });
      else if (b.kind === 'title') node = poster(b.text!, 120, C.ink);
      else if (b.kind === 'sub') node = txt(b.text!, { fontFamily: F.bebas, fontSize: 46, fill: C.red, letterSpacing: 4 });
      else if (b.kind === 'small') node = txt(b.text!, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 26, fill: C.ink, wordWrap: true, wordWrapWidth: 960, align: 'center' });
      else if (b.kind === 'link') {
        const bt = new Button(b.text!, () => window.open(b.url, '_blank', 'noopener'), { w: 560, h: 64, size: 26, color: C.yellow });
        node = bt;
      } else node = txt(b.text!, { fontFamily: F.ui, fontWeight: '700', fontSize: 32, fill: C.ink, wordWrap: true, wordWrapWidth: 960, align: 'center' });
      if (node instanceof Button) node.position.set(W / 2 - 280, y);
      else {
        (node as Container & { anchor?: { set: (x: number, y: number) => void } }).anchor?.set(0.5, 0);
        node.position.set(W / 2, y);
      }
      col.addChild(node);
      y += node.height + 22;
    }
    const total = y;

    // the crew walks along the bottom of the page (the paper "footer")
    const footer = new Graphics().rect(0, H - 170, W, 170).fill({ color: C.paper, alpha: 0.96 }).moveTo(0, H - 170).lineTo(W, H - 170).stroke({ width: 3, color: C.ink });
    root.addChild(footer);
    const walkers: { c: Container; speed: number }[] = [];
    crewSlugs.forEach((slug, i) => {
      const p = livingCat(slug, { anchorX: 0.5, anchorY: 0.94, fps: 12, acts: 'calm' });
      p.walk = 1;
      p.scale.set(-140 / ART, 140 / ART);
      const c = new Container();
      c.addChild(p);
      c.position.set(-120 - i * 230, H - 14);
      root.addChild(c);
      walkers.push({ c, speed: 72 });
    });

    const close = new Button('CERRAR', () => finish(), { w: 200, h: 58, size: 26, color: C.paper });
    close.position.set(W - 240, 30);
    root.addChild(close);

    let fast = false;
    root.on('pointerdown', () => (fast = true));
    root.on('pointerup', () => (fast = false));
    root.on('pointerupoutside', () => (fast = false));
    let scroll = 0;
    let done = false;
    const tick = (tk: Ticker) => {
      const dt = Math.min(0.1, tk.deltaMS / 1000);
      scroll += dt * (fast ? 360 : 70);
      col.y = -Math.min(scroll, Math.max(0, total - H * 0.55));
      for (const w of walkers) {
        w.c.x += w.speed * dt;
        if (w.c.x > W + 140) w.c.x = -140;
      }
      if (!done && scroll > total - H * 0.55 + 400) {
        done = true;
        gsap.fromTo(close.scale, { x: 1.2, y: 1.2 }, { x: 1, y: 1, duration: 0.4, ease: 'back.out(3)' });
      }
    };
    Ticker.shared.add(tick);
    gsap.from(root, { alpha: 0, duration: 0.5 });
    const finish = () => {
      Ticker.shared.remove(tick);
      gsap.to(root, {
        alpha: 0,
        duration: 0.4,
        onComplete: () => {
          root.destroy({ children: true });
          resolve();
        },
      });
    };
  });
}
