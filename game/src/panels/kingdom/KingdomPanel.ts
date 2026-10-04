/**
 * REINO (GDD 2.17 · 6.17) — EDITORIAL SUIZO poster:
 *  · crest with the giant level number on the pink circle + kingdom bar + what the next level gives
 *  · "PRÓXIMO HITO ★" card (or the level / automation you tapped) with anticipation copy
 *  · the road of milestones Reino 1 → 50 (drag / wheel / arrows): past inked + checked, "ESTÁS AQUÍ" boat
 *  · automation cards: ACTIVA (what it does + where it lives), SIGUIENTE (progress), locked (Reino N)
 * Pure reads: G.s.kl / klXp + content.kingdomMilestones + content.automation.
 */
import { Container, FederatedPointerEvent, Graphics, Text, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { Modal } from '../../ui/modal';
import { C, F } from '../../ui/theme';
import { txt, Bar, dotGrid, crosses } from '../../ui/widgets';
import { icon } from '../../ui/icons';
import { halftoneTexture } from '../../art/textures';
import { sfx } from '../../core/audio';
import { G } from '../../state/game';
import { BAL } from '../../state/econ';
import { CONTENT } from '../../data/content';
import { clearChildren, killTree, label, stamp } from '../campaign/common';
import { sparkles } from '../../fx/juice';
import { glyph, GlyphKind } from './glyphs';

interface Milestone {
  kl: number;
  catLevelCap: number;
  unlocks: { text: string; kind: string; changesRules: boolean }[];
}
interface Automation {
  kl: number;
  id: string;
  name: string;
  rule: string;
}

const MS = CONTENT.kingdomMilestones as Milestone[];
const AUTO = (CONTENT.automation as Automation[]).slice().sort((a, b) => a.kl - b.kl);
const CAP = BAL.kingdom.level_cap;

/** short copy (the content rule cites balance keys; this is what the player reads) */
const AUTO_COPY: Record<string, { short: string; text: string; where: string; glyph: GlyphKind }> = {
  asalto_rapido: { short: 'Asalto Rápido', glyph: 'sword', text: 'En etapas ya ganadas con ventaja ×2.5: un botón y la batalla se gana sola en 5 s. Para cuando ya les pegaste y te da flojera.', where: 'Mapa › etapa ganada' },
  boss_analysis: { short: 'Análisis de Jefe', glyph: 'lens', text: 'Cada derrota contra un jefe suma 20%: ves sus fases, su punto débil, sus tiros… y hasta le baja el poder. Perder también es estudiar.', where: 'Tarjeta del jefe' },
  ronroneo_auto: { short: 'Auto-Ronroneo', glyph: 'clock', text: 'El Ronroneo que ganas jugando se aplica solo al reloj fijado con chincheta (o al que esté por terminar). Lo que sobra va a la reserva.', where: 'Columna de relojes › chincheta' },
  collect_all: { short: 'Recolectar todo', glyph: 'coin', text: 'Un botón, todo el oro de la isla. Tus dedos te mandan saludos.', where: 'HUD de la isla' },
  feed_bulk: { short: 'Alimentar hasta Nv X', glyph: 'fish', text: 'Un slider y tus gatos comen hasta el nivel que digas. Sin ¡ÑAM! uno por uno (bueno, sí suenan).', where: 'Panel del gato' },
  crop_repeat: { short: 'Repetir receta', glyph: 'repeat', text: 'Cada parcela vuelve a sembrar su última receta al cosechar. El muelle en piloto automático.', where: 'Muelle › parcela' },
  compra_x10: { short: 'Comprar ×10 / MAX', glyph: 'x10', text: 'Botones ×10 y MAX en mejoras y en alimentar. Sentir la escala. Sentir el poder.', where: 'Mejoras y Alimentar' },
  kingdom_bank: { short: 'Banco del Reino', glyph: 'bank', text: 'El oro de todos los hábitats entra solo a la cartera aunque estén LLENOS. Y sigue cayendo offline hasta 2 h.', where: 'Isla › Banco del Reino' },
  resonance_queue: { short: 'Cola de Resonancia', glyph: 'heart', text: 'Deja 3 parejas en fila: al revelarse una, arranca la siguiente. Romance en cadena.', where: 'Santuario › Cola' },
  auto_harvest: { short: 'Auto-cosecha al Silo', glyph: 'wave', text: 'Mar de Pescados Automático: las cosechas listas se van solitas al Silo.', where: 'Muelle › Silo' },
  workers: { short: 'Gatos trabajadores', glyph: 'wrench', text: 'Oficios: Banquero, Granjero, Constructor, Viajero. Los que trabajan no se suben al barco (sindicato gatuno).', where: 'Panel de Oficios' },
  auto_feed: { short: 'Auto-alimentar', glyph: 'bowl', text: 'Regla por hábitat: «mantener a sus gatos en el tope». La comida se gasta sola.', where: 'Panel del hábitat' },
  auto_expedition: { short: 'Expediciones solas', glyph: 'compass', text: 'Las expediciones se relanzan solas con la misma tripulación y duración.', where: 'Puerto de las Mareas' },
  auto_star: { short: 'Auto-estrellas', glyph: 'star', text: 'Las estrellas se suben solas al juntar orbes, y los módulos nuevos se equipan solos si suben el Poder.', where: 'Altar y Astillero' },
  auto_battle: { short: 'Simulacro', glyph: 'robot', text: 'Auto-batallas en etapas ya ganadas mientras haces otra cosa (70% del botín).', where: 'Mapa' },
  fleet_orders: { short: 'Órdenes de flota', glyph: 'anchor', text: 'El barco que NO estás usando farmea solo la mejor etapa ganada.', where: 'Astillero › flota' },
};

const KIND_GLYPH: Record<string, GlyphKind> = {
  automation: 'gear',
  expansion: 'island',
  habitat: 'house',
  crop: 'fish',
  ship: 'anchor',
  event: 'flame',
  gems: 'gem',
  rule: 'star',
  element: 'bolt',
  story: 'scroll',
};

const QUIPS = [
  'El Reino sube haciendo de todo. Literal. Hasta perder suma.',
  'Cada hito ★ cambia las reglas. Los demás nomás te dan cosas bonitas.',
  'Ya aprendiste a hacerlo a mano. Ahora toma, que lo haga la isla.',
  'Subir de Reino: +Ronroneo, misiones nuevas y tus gatos aguantan un nivel más.',
  'Lo imposible queda anotado aquí. En dos horas vas a decir «ah sí, ese, de una».',
];

const ROAD_STEP = 132;
const ROAD_H = 214;

function msAt(kl: number): Milestone | undefined {
  return MS.find((m) => m.kl === kl);
}
function catCapAt(kl: number) {
  return msAt(kl)?.catLevelCap ?? kl + 5;
}
function isStar(m: Milestone | undefined) {
  return !!m?.unlocks.some((u) => u.changesRules);
}
function nextStar(from: number): Milestone | undefined {
  return MS.find((m) => m.kl > from && isStar(m));
}
function autoCopy(a: Automation) {
  return AUTO_COPY[a.id] ?? { short: a.name, glyph: 'gear' as GlyphKind, text: a.rule.replace(/\(?[^()]*balance\.[\w.]+[^()]*\)?/g, '').trim(), where: '' };
}

export function openKingdomPanel() {
  const m = new Modal('REINO', 1840, 1010, { color: C.paper, band: C.ink, subtitle: '«Ya aprendiste esto; toma, ahora preocúpate por cosas más interesantes»' });
  m.open();
  new KingdomView(m);
}

class KingdomView {
  private detail = new Container();
  private roadView = new Container();
  private track = new Container();
  private roadX = 0;
  private roadMin = 0;
  private drag: { x: number; rx: number; moved: boolean } | null = null;
  private selected: Container | null = null;
  private onWheel = (e: WheelEvent) => {
    if (this.m.closed) return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    this.scrollTo(this.roadX - d * 1.2, false);
  };

  constructor(private m: Modal) {
    const b = m.body;
    b.addChild(this.detail);
    this.buildCrest();
    this.buildRoad();
    this.buildAutomations();
    this.showNext();
    window.addEventListener('wheel', this.onWheel, { passive: true });
    const prev = m.onClose;
    m.onClose = () => {
      window.removeEventListener('wheel', this.onWheel);
      prev?.();
    };
    m.on('destroyed', () => window.removeEventListener('wheel', this.onWheel));
  }

  // ------------------------------------------------------------------ crest (top-left)
  private buildCrest() {
    const b = this.m.body;
    const kl = G.s.kl;
    const c = new Container();
    b.addChild(c);
    // the Swiss pink circle with halftone + giant number
    const r = 146;
    const cx = 160;
    const cy = 150;
    const disc = new Graphics().circle(cx + 8, cy + 9, r).fill(C.ink).circle(cx, cy, r).fill(C.pink).stroke({ width: 5, color: C.ink });
    const dots = new TilingSprite({ texture: halftoneTexture(C.pinkHot, 12, 2.6), width: r * 2, height: r * 2 });
    dots.position.set(cx - r, cy - r);
    dots.alpha = 0.45;
    const dm = new Graphics().circle(cx, cy, r - 4).fill(0xffffff);
    dots.mask = dm;
    const num = txt(String(kl), { fontFamily: F.poster, fontSize: kl >= 10 ? 210 : 250, fill: C.ink, letterSpacing: -8 });
    num.anchor.set(0.5);
    num.position.set(cx, cy + 8);
    const crown = icon('crown', 64);
    crown.position.set(cx, cy - r + 6);
    crown.rotation = -0.12;
    const tag = txt('NIVEL DE REINO', { fontFamily: F.bebas, fontSize: 30, fill: C.paper, letterSpacing: 4 });
    const tagBg = new Graphics().rect(-14, -2, tag.width + 28, tag.height + 2).fill(C.ink);
    const tagC = new Container();
    tagC.addChild(tagBg, tag);
    tagC.position.set(cx - tag.width / 2, cy + r - 26);
    tagC.rotation = 0.03;
    const dg = dotGrid(3, 6, 16, 2.5, C.ink);
    dg.position.set(cx + r + 12, cy - 70);
    c.addChild(disc, dots, dm, num, crown, tagC, dg);
    gsap.from(num.scale, { x: 1.8, y: 1.8, duration: 0.28, ease: 'power3.in', delay: 0.12, onComplete: () => sfx('hit', 0.7) });
    gsap.from(disc.scale, { x: 0.6, y: 0.6, duration: 0.35, ease: 'back.out(2)' });
    disc.pivot.set(cx, cy);
    disc.position.set(cx, cy);

    // bar + what the next level brings
    const x0 = 360;
    const max = kl >= CAP;
    const bt = txt(max ? 'REINO AL MÁXIMO' : `BARRA DEL REINO · ${Math.floor(G.s.klXp * 100)}%`, { fontFamily: F.poster, fontSize: 40, fill: C.ink });
    bt.position.set(x0, 4);
    const bar = new Bar(520, 36, C.pinkHot, C.paperDark);
    bar.position.set(x0, 62);
    bar.set(0, false);
    gsap.delayedCall(0.35, () => !bar.destroyed && bar.set(max ? 1 : G.s.klXp));
    const nx = txt(max ? '50' : String(kl + 1), { fontFamily: F.poster, fontSize: 34, fill: C.ink });
    nx.anchor.set(0, 0.5);
    nx.position.set(x0 + 532, 80);
    c.addChild(bt, bar, nx);
    const lines: string[] = [];
    if (!max) {
      lines.push(`Tope de nivel de gato: ${catCapAt(kl)} → ${catCapAt(kl + 1)} al subir`);
      lines.push(`+${BAL.ronroneo.base_min.level_up} min de Ronroneo · misiones nuevas · presagios`);
      const every = BAL.kingdom.milestone_gems_every;
      const nextGem = Math.ceil((kl + 1) / every) * every;
      lines.push(`Cada ${every} niveles: +${BAL.kingdom.milestone_gems} Ojos de Gato (próximo: Reino ${nextGem})`);
    } else lines.push('Ya no hay más barra. Solo gloria y gatos.');
    lines.forEach((l, i) => {
      const t = label(`• ${l}`, 19, C.ink);
      t.position.set(x0, 116 + i * 30);
      c.addChild(t);
    });
    const q = txt(`«${QUIPS[(kl * 7 + G.s.missions.done.length) % QUIPS.length]}» — Luzterna`, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 19, fill: C.inkBlue, wordWrap: true, wordWrapWidth: 560 });
    q.position.set(x0, 116 + lines.length * 30 + 12);
    c.addChild(q);
  }

  // ------------------------------------------------------------------ detail card (top-right)
  private card(title: string, kicker: string, color: number) {
    clearChildren(this.detail);
    const d = this.detail;
    const x0 = 960;
    const w = 824;
    const h = 292;
    d.position.set(x0, 0);
    const bg = new Graphics().rect(10, 10, w, h).fill(C.ink).rect(0, 0, w, h).fill(color).stroke({ width: 4, color: C.ink });
    const dots = new TilingSprite({ texture: halftoneTexture(C.ink, 14, 1.6), width: 260, height: h - 8 });
    dots.position.set(w - 264, 4);
    dots.alpha = 0.12;
    const k = txt(kicker, { fontFamily: F.bebas, fontSize: 28, fill: C.paper, letterSpacing: 3 });
    const kb = new Graphics().rect(0, 0, k.width + 28, k.height + 2).fill(C.ink);
    k.position.set(14, 0);
    const kc = new Container();
    kc.addChild(kb, k);
    kc.position.set(20, 18);
    const t = txt(title, { fontFamily: F.poster, fontSize: 62, fill: C.ink, letterSpacing: -1 });
    t.position.set(22, 56);
    d.addChild(bg, dots, kc, t);
    gsap.from(d, { alpha: 0, duration: 0.15 });
    gsap.from(d.scale, { x: 0.97, y: 0.97, duration: 0.2, ease: 'back.out(2)' });
    return { y: 56 + t.height + 4, w, h };
  }

  private showNext() {
    const kl = G.s.kl;
    const ns = nextStar(kl);
    if (!ns) {
      this.showLevel(Math.min(CAP, kl));
      return;
    }
    this.showLevel(ns.kl, true);
  }

  private showLevel(kl: number, asNext = false) {
    const ms = msAt(kl);
    const cur = G.s.kl;
    const left = kl - cur;
    const star = isStar(ms);
    const kicker = asNext ? 'PRÓXIMO HITO ★' : left > 0 ? (star ? 'HITO ★ QUE CAMBIA LAS REGLAS' : 'MÁS ADELANTE') : left === 0 ? 'ESTÁS AQUÍ' : 'YA ES TUYO';
    const color = left <= 0 ? C.mint : star ? C.yellow : C.paperDark;
    const { y, w } = this.card(`REINO ${kl}`, kicker, color);
    const d = this.detail;
    // countdown stamp
    const st = left > 0 ? stamp(left === 1 ? '¡EL SIGUIENTE!' : `FALTAN ${left} NIVELES`, C.red, 30, 0.07) : stamp(left === 0 ? 'AHORA' : '✓ DESBLOQUEADO', 0x2e8a52, 30, 0.07);
    st.position.set(w - st.width / 2 - 26, 92);
    d.addChild(st);
    if (left > 0) gsap.fromTo(st.scale, { x: 1.6, y: 1.6 }, { x: 1, y: 1, duration: 0.2, ease: 'power3.in', onComplete: () => sfx('hit', 1.2) });
    const items = ms?.unlocks ?? [];
    let yy = y + 6;
    const capT = label(`Tope de nivel de gato: ${catCapAt(kl)}`, 18, C.inkBlue);
    capT.position.set(24, yy);
    d.addChild(capT);
    yy += 30;
    if (!items.length) {
      const t = txt('Un nivel tranquilo. Aprovecha para alimentar gatos y presumir.', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 22, fill: C.ink });
      t.position.set(24, yy);
      d.addChild(t);
    }
    // rule-changers first; two balanced columns when there are many
    const list = [...items].sort((a, b) => Number(b.changesRules) - Number(a.changesRules)).slice(0, 6);
    const two = list.length > 3;
    const colY = [yy, yy];
    const colW = two ? (w - 70) / 2 : w - 80;
    for (const u of list) {
      const col = two && colY[1] < colY[0] ? 1 : 0;
      const ix = 30 + col * (colW + 22);
      const iy = colY[col];
      const g = glyph(KIND_GLYPH[u.kind] ?? 'dot', 24);
      g.position.set(ix + 12, iy + 12);
      const t = txt(u.text.replace(/^Automatización: /, '').replace(/^Hito: /, ''), {
        fontFamily: F.ui,
        fontWeight: u.changesRules ? '700' : '500',
        fontSize: two ? 17 : 19,
        fill: C.ink,
        wordWrap: true,
        wordWrapWidth: colW - 34,
        lineHeight: two ? 21 : 24,
      });
      t.position.set(ix + 30, iy + 1);
      d.addChild(g, t);
      if (u.changesRules) {
        const s = new Graphics().star(0, 0, 5, 8, 3.4).fill(C.red);
        s.position.set(ix - 10, iy + 12);
        d.addChild(s);
      }
      colY[col] = iy + Math.max(26, t.height) + 8;
    }
    const bottom = Math.max(colY[0], colY[1]);
    if (asNext && left > 0 && bottom < 250) {
      const tease = txt(teaseLine(ms), { fontFamily: F.comic, fontSize: 24, fill: C.red, letterSpacing: 1 });
      tease.position.set(24, Math.max(bottom + 2, 246));
      d.addChild(tease);
    }
  }

  private showAutomation(a: Automation) {
    const cp = autoCopy(a);
    const kl = G.s.kl;
    const owned = kl >= a.kl;
    const nextA = AUTO.find((x) => x.kl > kl);
    const isNext = !owned && nextA?.id === a.id;
    const { y, w } = this.card(cp.short.toUpperCase(), owned ? `AUTOMATIZACIÓN · ACTIVA DESDE REINO ${a.kl}` : `AUTOMATIZACIÓN · REINO ${a.kl}`, owned ? C.mint : isNext ? C.yellow : C.paperDark);
    const d = this.detail;
    const t = txt(cp.text, { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.ink, wordWrap: true, wordWrapWidth: w - 60, lineHeight: 30 });
    t.position.set(24, y + 4);
    d.addChild(t);
    if (cp.where) {
      const wl = label(`${owned ? 'Dónde' : 'Vivirá en'}: ${cp.where}`, 18, C.inkBlue);
      const wy = Math.min(250, y + 12 + t.height);
      wl.position.set(50, wy);
      const pin = glyph('pin', 22);
      pin.position.set(34, wy + 11);
      d.addChild(pin, wl);
    }
    const st = owned ? stamp('ACTIVA', 0x2e8a52, 34, 0.08) : stamp(a.kl - kl === 1 ? '¡EN 1 NIVEL!' : `EN ${a.kl - kl} NIVELES`, C.red, 30, 0.08);
    st.position.set(w - st.width / 2 - 26, 92);
    d.addChild(st);
  }

  // ------------------------------------------------------------------ road of milestones
  private buildRoad() {
    const b = this.m.body;
    const vw = this.m.innerW;
    const y0 = 318;
    const view = this.roadView;
    view.position.set(0, y0);
    const bg = new Graphics().rect(0, 0, vw, ROAD_H).fill(C.linen).stroke({ width: 3, color: C.ink });
    const mask = new Graphics().rect(2, 2, vw - 4, ROAD_H - 4).fill(0xffffff);
    view.addChild(bg, this.track, mask);
    this.track.mask = mask;
    b.addChild(view);
    const title = txt('CAMINO DEL REINO', { fontFamily: F.bebas, fontSize: 26, fill: C.ink, letterSpacing: 4 });
    title.position.set(14, 6);
    view.addChild(title);
    const hint = label('arrastra · rueda · toca un nivel', 14, C.inkBlue, { fontStyle: 'italic' });
    hint.anchor.set(1, 0);
    hint.position.set(vw - 14, 12);
    view.addChild(hint);

    const kl = G.s.kl;
    const tr = this.track;
    const lineY = 110;
    const g = new Graphics();
    tr.addChild(g);
    const x = (k: number) => 120 + (k - 1) * ROAD_STEP;
    // route: inked past, dotted future
    g.moveTo(x(1), lineY).lineTo(x(kl), lineY).stroke({ width: 8, color: C.red, cap: 'round' });
    for (let px = x(kl); px < x(CAP); px += 16) g.circle(px + 8, lineY, 3);
    g.fill(C.ink);
    for (let k = 1; k <= CAP; k++) {
      const ms = msAt(k);
      const star = isStar(ms);
      const node = new Container();
      node.position.set(x(k), lineY);
      const r = star ? 34 : 24;
      const past = k < kl;
      const here = k === kl;
      const ng = new Graphics();
      if (star) ng.star(3, 4, 8, r + 8, r - 2).fill(C.ink).star(0, 0, 8, r + 8, r - 2).fill(past || here ? C.yellow : C.paper).stroke({ width: 3, color: C.ink });
      else ng.circle(3, 4, r).fill(C.ink).circle(0, 0, r).fill(here ? C.pink : past ? C.ink : C.paper).stroke({ width: 3, color: C.ink });
      const n = txt(String(k), { fontFamily: F.poster, fontSize: star ? 30 : 24, fill: past && !star ? C.paper : C.ink });
      n.anchor.set(0.5);
      n.y = 1;
      node.addChild(ng, n);
      if (past) {
        const ck = new Graphics().moveTo(r * 0.3, r * 0.5).lineTo(r * 0.6, r * 0.85).lineTo(r * 1.15, r * 0.15).stroke({ width: 5, color: C.red, cap: 'round', join: 'round' });
        node.addChild(ck);
      }
      // pictogram strip under the node
      const kinds = [...new Set((ms?.unlocks ?? []).map((u) => KIND_GLYPH[u.kind] ?? 'dot'))].slice(0, 3);
      kinds.forEach((kd, i) => {
        const gl = glyph(kd, 20);
        gl.position.set((i - (kinds.length - 1) / 2) * 24, r + 18);
        gl.alpha = past ? 0.55 : 1;
        node.addChild(gl);
      });
      // one-line caption for ★ nodes
      const main = ms?.unlocks.find((u) => u.changesRules) ?? ms?.unlocks[0];
      if (main && (star || k === kl + 1)) {
        const cap = txt(shortText(main.text), { fontFamily: F.ui, fontWeight: '700', fontSize: 13, fill: C.ink, align: 'center', wordWrap: true, wordWrapWidth: ROAD_STEP - 10 });
        cap.anchor.set(0.5, 0);
        cap.position.set(0, r + 34);
        cap.alpha = past ? 0.55 : 1;
        node.addChild(cap);
      }
      node.eventMode = 'static';
      node.cursor = 'pointer';
      node.hitArea = { contains: (px: number, py: number) => px * px + py * py < (r + 18) * (r + 18) };
      node.on('pointertap', () => {
        if (this.drag?.moved) return;
        sfx('paper');
        this.select(node);
        this.showLevel(k);
      });
      node.on('pointerover', () => gsap.to(node.scale, { x: 1.12, y: 1.12, duration: 0.12 }));
      node.on('pointerout', () => gsap.to(node.scale, { x: 1, y: 1, duration: 0.14 }));
      tr.addChild(node);
      if (here) {
        const boat = new Graphics();
        boat.poly([-22, 0, 22, 0, 15, 10, -15, 10]).fill(0x8a5a2e).stroke({ width: 3, color: C.ink, join: 'round' });
        boat.moveTo(0, 0).lineTo(0, -34).stroke({ width: 3, color: C.ink });
        boat.poly([2, -32, 20, -6, 2, -5]).fill(C.pinkHot).stroke({ width: 2.5, color: C.ink, join: 'round' });
        boat.position.set(x(k), lineY - r - 22);
        tr.addChild(boat);
        gsap.to(boat, { y: boat.y - 6, rotation: 0.06, yoyo: true, repeat: -1, duration: 0.9, ease: 'sine.inOut' });
        const yah = stamp('ESTÁS AQUÍ', C.pinkHot, 18, -0.06);
        yah.position.set(x(k) + 92, lineY - r - 40);
        tr.addChild(yah);
      }
    }
    // drag to scroll
    const vwIn = vw;
    this.roadMin = Math.min(0, vwIn - (x(CAP) + 90));
    view.eventMode = 'static';
    view.on('pointerdown', (e: FederatedPointerEvent) => {
      this.drag = { x: e.global.x, rx: this.roadX, moved: false };
    });
    view.on('globalpointermove', (e: FederatedPointerEvent) => {
      if (!this.drag) return;
      const k = 1 / Math.max(0.01, view.worldTransform.a);
      const dx = (e.global.x - this.drag.x) * k;
      if (Math.abs(dx) > 6) this.drag.moved = true;
      if (this.drag.moved) this.scrollTo(this.drag.rx + dx, false);
    });
    const end = () => {
      window.setTimeout(() => (this.drag = null), 0);
    };
    view.on('pointerup', end);
    view.on('pointerupoutside', end);
    // arrows
    const arrow = (dir: -1 | 1) => {
      const a = new Container();
      const ag = new Graphics().circle(3, 4, 26).fill(C.ink).circle(0, 0, 26).fill(C.yellow).stroke({ width: 3, color: C.ink });
      ag.poly(dir < 0 ? [8, -12, -10, 0, 8, 12] : [-8, -12, 10, 0, -8, 12]).fill(C.ink);
      a.addChild(ag);
      a.position.set(dir < 0 ? 34 : vw - 34, ROAD_H - 34);
      a.eventMode = 'static';
      a.cursor = 'pointer';
      a.on('pointertap', (e) => {
        e.stopPropagation();
        sfx('click');
        this.scrollTo(this.roadX - dir * ROAD_STEP * 5, true);
      });
      view.addChild(a);
    };
    arrow(-1);
    arrow(1);
    // start at level 1 and sail to "you are here"
    this.scrollTo(0, false);
    const target = vw / 2 - x(kl);
    gsap.delayedCall(0.25, () => this.scrollTo(target, true, 0.9));
  }

  private scrollTo(x: number, animate: boolean, dur = 0.45) {
    const cl = Math.max(this.roadMin, Math.min(0, x));
    this.roadX = cl;
    if (this.track.destroyed) return;
    if (animate) gsap.to(this.track, { x: cl, duration: dur, ease: 'power3.inOut' });
    else {
      gsap.killTweensOf(this.track);
      this.track.x = cl;
    }
  }

  private select(c: Container) {
    if (this.selected && !this.selected.destroyed) this.selected.getChildByLabel?.('sel')?.destroy();
    const ring = new Graphics().circle(0, 0, 46).stroke({ width: 4, color: C.pinkHot });
    ring.label = 'sel';
    c.addChildAt(ring, 0);
    this.selected = c;
  }

  // ------------------------------------------------------------------ automations
  private buildAutomations() {
    const b = this.m.body;
    const kl = G.s.kl;
    const y0 = 548;
    const owned = AUTO.filter((a) => a.kl <= kl).length;
    const h = txt('AUTOMATIZACIONES', { fontFamily: F.poster, fontSize: 44, fill: C.ink });
    h.position.set(0, y0);
    const cnt = txt(`${owned}/${AUTO.length} ACTIVAS`, { fontFamily: F.bebas, fontSize: 30, fill: C.paper, letterSpacing: 2 });
    const cb = new Graphics().rect(0, 0, cnt.width + 24, cnt.height).fill(C.inkBlue);
    const cc = new Container();
    cnt.position.set(12, 0);
    cc.addChild(cb, cnt);
    cc.position.set(h.width + 18, y0 + 10);
    const sub = txt('Llegan cuando ya hiciste la tarea a mano 10–20 veces. Cada una trae un problema nuevo (y más interesante).', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 18, fill: C.inkBlue });
    sub.position.set(cc.x + cc.width + 18, y0 + 18);
    const cr = crosses(C.ink);
    cr.position.set(this.m.innerW - 50, y0 + 18);
    b.addChild(h, cc, sub, cr);
    const cols = 8;
    const gap = 10;
    const cw = (this.m.innerW - gap * (cols - 1)) / cols;
    const ch = 140;
    const nextA = AUTO.find((a) => a.kl > kl);
    AUTO.forEach((a, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const card = this.autoCard(a, cw, ch, a.kl <= kl, nextA?.id === a.id);
      card.position.set(col * (cw + gap), y0 + 62 + row * (ch + gap));
      b.addChild(card);
      gsap.from(card, { alpha: 0, y: card.y + 24, duration: 0.25, delay: 0.2 + i * 0.03, ease: 'back.out(2)' });
    });
  }

  private autoCard(a: Automation, w: number, h: number, owned: boolean, isNext: boolean): Container {
    const c = new Container();
    const cp = autoCopy(a);
    const kl = G.s.kl;
    const fill = owned ? C.mint : isNext ? C.yellow : C.paperDark;
    const g = new Graphics().rect(5, 6, w, h).fill(C.ink).rect(0, 0, w, h).fill(fill).stroke({ width: 3, color: C.ink });
    c.addChild(g);
    if (!owned && !isNext) {
      const hat = new TilingSprite({ texture: halftoneTexture(C.ink, 9, 1.4), width: w - 6, height: h - 6 });
      hat.position.set(3, 3);
      hat.alpha = 0.13;
      c.addChild(hat);
    }
    // level badge
    const badge = new Graphics().circle(0, 0, 22).fill(owned ? C.ink : C.paper).stroke({ width: 3, color: C.ink });
    badge.position.set(28, 28);
    const bn = txt(`R${a.kl}`, { fontFamily: F.poster, fontSize: 18, fill: owned ? C.mint : C.ink });
    bn.anchor.set(0.5);
    bn.position.copyFrom(badge.position);
    const gl = glyph(cp.glyph, 30);
    gl.position.set(w - 26, 26);
    gl.alpha = owned || isNext ? 1 : 0.45;
    const nm = txt(cp.short.toUpperCase(), { fontFamily: F.poster, fontSize: 22, fill: C.ink, wordWrap: true, wordWrapWidth: w - 24, lineHeight: 24 });
    nm.position.set(12, 56);
    nm.alpha = owned || isNext ? 1 : 0.6;
    c.addChild(badge, bn, gl, nm);
    if (owned) {
      const st = stamp('ACTIVA', 0x2e8a52, 16, -0.08);
      st.position.set(w - st.width / 2 - 10, h - 22);
      c.addChild(st);
    } else if (isNext) {
      const rib = txt('SIGUIENTE', { fontFamily: F.bebas, fontSize: 20, fill: C.paper, letterSpacing: 2 });
      const rb = new Graphics().rect(0, 0, rib.width + 16, rib.height).fill(C.red);
      const rc = new Container();
      rib.position.set(8, 0);
      rc.addChild(rb, rib);
      rc.position.set(56, 16);
      c.addChild(rc);
      const prevKl = [...AUTO].reverse().find((x) => x.kl <= kl)?.kl ?? 1;
      const p = Math.max(0, Math.min(1, (kl - prevKl + G.s.klXp) / Math.max(1, a.kl - prevKl)));
      const bar = new Bar(w - 24, 12, C.red, C.paper);
      bar.position.set(12, h - 22);
      bar.set(0, false);
      gsap.delayedCall(0.7, () => !bar.destroyed && bar.set(p));
      c.addChild(bar);
      gsap.to(c.scale, { x: 1.03, y: 1.03, yoyo: true, repeat: -1, duration: 0.7, ease: 'sine.inOut' });
      c.pivot.set(w / 2, h / 2);
      c.position.set(w / 2, h / 2);
    } else {
      const lk = icon('lock', 22);
      lk.position.set(w - 24, h - 20);
      const lt = label(`Reino ${a.kl}`, 15, C.ink);
      lt.anchor.set(1, 0.5);
      lt.position.set(w - 40, h - 20);
      c.addChild(lk, lt);
    }
    c.eventMode = 'static';
    c.cursor = 'pointer';
    c.on('pointertap', () => {
      sfx('paper');
      this.showAutomation(a);
      if (owned) sparkles(c, w / 2, h / 2, C.paper, 6, 60);
    });
    c.on('pointerover', () => gsap.to(g, { alpha: 0.9, duration: 0.1 }));
    c.on('pointerout', () => gsap.to(g, { alpha: 1, duration: 0.1 }));
    // the pulse sets a pivot: keep the grid position stable for the caller
    if (isNext) {
      const wrap = new Container();
      wrap.addChild(c);
      wrap.on('destroyed', () => killTree(c));
      return wrap;
    }
    return c;
  }
}

function shortText(t: string) {
  return t
    .replace(/^Automatización: /, '')
    .replace(/^Hito: /, '')
    .replace(/^Presagio de Evento Flash: /, 'Flash: ')
    .replace(/\s*\(.*\)\s*$/, '')
    .slice(0, 46);
}

function teaseLine(ms: Milestone | undefined) {
  const u = ms?.unlocks.find((x) => x.changesRules);
  if (!u) return '¡Ya casi!';
  if (u.kind === 'automation') return '«Pronto dejas de dar clic aquí. De nada.»';
  if (u.kind === 'rule') return '«Las reglas cambian. Tus gatos ya lo presienten.»';
  if (u.kind === 'element') return '«Algo brilla en el horizonte… y no es el sol.»';
  return '«Ya merito. Sigue jugando y llega solito.»';
}

/** for tests: `await import('/src/panels/kingdom/KingdomPanel.ts')` */
export const __kingdom = { MS, AUTO, nextStar, Text };
