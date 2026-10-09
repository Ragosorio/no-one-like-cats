/**
 * El Podio — results: poster card with the verdict stamp, loot rows that tick up one by one
 * (Doblones, Pescaditos, Ojos de Gato, orbes de ESE gato, Ronroneo split vault/relojes),
 * the podio XP bar (level-ups, power-ups, new powers, cap warning) and the league promotion.
 */
import { Container, Graphics, Text, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../core/App';
import { C, F, RARITY } from '../ui/theme';
import { catDef } from '../data/content';
import { txt, Button } from '../ui/widgets';
import { icon, IconKind } from '../ui/icons';
import { sfx } from '../core/audio';
import { fmt } from '../core/format';
import { halftoneTexture } from '../art/textures';
import { sparkles } from '../fx/juice';
import { catPortrait, tickUp } from '../panels/campaign/common';
import { G, OwnedCat } from '../state/game';
import { PodioLoot, league, xpNeed, nextCapLevel } from '../state/sys/podio';
import { SLOT_LABEL, powersOf } from './powers';
import { LOSS_QUIPS, WIN_QUIPS, pick } from './lines';
import PB from '../data/podio.json';

export interface ResultsOpts {
  onNext: () => void;
  onLobby: () => void;
  onIsland: () => void;
}

export class PodioResults extends Container {
  private tl: gsap.core.Timeline;
  constructor(loot: PodioLoot, cat: OwnedCat, rivalName: string, o: ResultsOpts) {
    super();
    const won = loot.won;
    const dim = new Graphics().rect(-400, -200, W + 800, H + 400).fill({ color: won ? C.inkBlue : 0x0b0d14, alpha: 0.78 });
    dim.eventMode = 'static';
    this.addChild(dim);
    const dots = new TilingSprite({ texture: halftoneTexture(0x000000, 12, 2.4), width: W, height: H });
    dots.alpha = 0.25;
    this.addChild(dots);
    // ---- the poster card
    const card = new Container();
    const cw = 1180;
    const ch = 820;
    card.addChild(new Graphics().rect(14, 14, cw, ch).fill(C.ink).rect(0, 0, cw, ch).fill(C.paper).stroke({ width: 6, color: C.ink, alignment: 1 }));
    const band = new Graphics().rect(0, 0, cw, 150).fill(won ? C.pinkHot : C.inkBlue);
    card.addChild(band);
    const title = txt(won ? (loot.firstChampion ? '¡CAMPEÓN!' : '¡VICTORIA!') : 'DERROTA', { fontFamily: F.poster, fontSize: 110, fill: C.paper, stroke: { color: C.ink, width: 12, join: 'round' }, letterSpacing: 4 });
    title.anchor.set(0, 0.5);
    title.position.set(40, 80);
    const sub = txt(won ? `${cat.name.toUpperCase()} venció a ${rivalName}` : `${rivalName} se llevó este round`, { fontFamily: F.bebas, fontSize: 30, fill: C.paper, letterSpacing: 2 });
    sub.anchor.set(1, 0.5);
    sub.position.set(cw - 34, 112);
    const quip = txt(pick(won ? WIN_QUIPS : LOSS_QUIPS), { fontFamily: F.ui, fontStyle: 'italic', fontSize: 20, fill: C.paper });
    quip.anchor.set(1, 0.5);
    quip.position.set(cw - 34, 62);
    if (quip.width > 520) quip.scale.set(520 / quip.width);
    card.addChild(title, sub, quip);
    // ---- portrait of the cat
    const por = catPortrait(cat.species, 200);
    por.position.set(160, 330);
    card.addChild(por);
    const nm = txt(cat.name.toUpperCase(), { fontFamily: F.poster, fontSize: 40, fill: C.ink });
    nm.anchor.set(0.5, 0);
    nm.position.set(160, 440);
    card.addChild(nm);
    // ---- loot rows
    const rows: { k: IconKind; label: string; value: number; suffix?: string; note?: string; color?: number }[] = [];
    rows.push({ k: 'gold', label: 'DOBLONES', value: loot.gold });
    rows.push({ k: 'food', label: 'PESCADITOS', value: loot.food });
    if (loot.gems) rows.push({ k: 'gem', label: 'OJOS DE GATO', value: loot.gems, color: C.green });
    if (loot.orbs) rows.push({ k: 'orb', label: `ORBES DE ${cat.name.toUpperCase()}`, value: loot.orbs.n, color: C.violet });
    rows.push({ k: 'clock', label: 'RONRONEO', value: Math.round(loot.purr.total * 10) / 10, suffix: ' min', note: purrNote(loot.purr), color: C.pinkHot });
    const lx = 330;
    let ly = 190;
    this.tl = gsap.timeline({ delay: 0.25 });
    const tl = this.tl;
    rows.forEach((r, i) => {
      const row = new Container();
      row.addChild(new Graphics().rect(0, 0, 800, 72).fill(i % 2 ? C.linen : C.paperDark).stroke({ width: 2, color: C.ink }));
      const ic = icon(r.k, 46);
      ic.position.set(40, 36);
      const lt = txt(r.label, { fontFamily: F.bebas, fontSize: 30, fill: C.ink, letterSpacing: 2 });
      lt.position.set(80, r.note ? 4 : 18);
      row.addChild(ic, lt);
      if (r.note) {
        const nt = txt(r.note, { fontFamily: F.ui, fontWeight: '700', fontSize: 17, fill: C.plum });
        nt.position.set(80, 42);
        row.addChild(nt);
      }
      const val: Text = txt('+0', { fontFamily: F.poster, fontSize: 44, fill: r.color ?? C.ink });
      val.anchor.set(1, 0.5);
      val.position.set(780, 36);
      row.addChild(val);
      row.position.set(lx, ly);
      ly += 80;
      row.alpha = 0;
      card.addChild(row);
      tl.to(row, { alpha: 1, duration: 0.12 }, i * 0.32)
        .from(row, { x: lx + 60, duration: 0.25, ease: 'back.out(2)' }, i * 0.32)
        .call(() => {
          sfx(r.k === 'gem' ? 'gem' : r.k === 'clock' ? 'purr' : 'coin', 1 + i * 0.08);
          tickUp(val, r.value, { prefix: '+', suffix: r.suffix, format: r.suffix ? (n) => (Math.round(n * 10) / 10).toString() : fmt });
        }, [], i * 0.32 + 0.1);
    });
    // ---- podio XP bar
    const xp = loot.xp;
    const xpY = ly + 14;
    const xpBox = new Container();
    xpBox.position.set(lx, xpY);
    const xpl = txt(`XP DE PODIO  +${xp.gained}`, { fontFamily: F.bebas, fontSize: 30, fill: C.ink, letterSpacing: 2 });
    const lvT = txt(`PODIO NV ${xp.before}`, { fontFamily: F.poster, fontSize: 34, fill: C.pinkHot });
    lvT.anchor.set(1, 0);
    lvT.position.set(800, -6);
    const barBg = new Graphics().rect(0, 40, 800, 26).fill(C.paperDark).stroke({ width: 3, color: C.ink, alignment: 1 });
    const bar = new Graphics();
    xpBox.addChild(xpl, lvT, barBg, bar);
    card.addChild(xpBox);
    xpBox.alpha = 0;
    const drawBar = (p: number) => bar.clear().rect(0, 40, 800 * Math.max(0, Math.min(1, p)), 26).fill(C.pinkHot);
    drawBar(xp.xpBefore / xpNeed(xp.before));
    const t0 = rows.length * 0.32 + 0.3;
    tl.to(xpBox, { alpha: 1, duration: 0.2 }, t0);
    // animate through each level gained
    let at = t0 + 0.25;
    const ups = xp.after - xp.before;
    for (let l = xp.before; l < xp.after; l++) {
      const prog = { p: l === xp.before ? xp.xpBefore / xpNeed(l) : 0 };
      tl.to(prog, { p: 1, duration: 0.45, ease: 'power2.in', onUpdate: () => drawBar(prog.p) }, at);
      const lvNow = l + 1;
      tl.call(() => {
        lvT.text = `PODIO NV ${lvNow}`;
        sfx('levelup');
        sparkles(card, lx + 700, xpY + 20, C.yellow, 14, 140);
        gsap.fromTo(lvT.scale, { x: 1.6, y: 1.6 }, { x: 1, y: 1, duration: 0.4, ease: 'back.out(3)' });
        drawBar(0);
      }, [], at + 0.46);
      at += 0.6;
    }
    const finalP = xp.after >= PB.levels.max ? 1 : xp.xpAfter / xpNeed(xp.after);
    const prog2 = { p: ups ? 0 : xp.xpBefore / xpNeed(xp.before) };
    tl.to(prog2, { p: finalP, duration: 0.5, ease: 'power2.out', onUpdate: () => drawBar(prog2.p) }, at);
    at += 0.55;
    // power-ups / unlocks / cap
    const notes: [string, number][] = [];
    const pw = powersOf(cat.species);
    for (const s of xp.unlocked) notes.push([`¡NUEVO PODER! ${SLOT_LABEL[s]}: ${pw[s].name}`, C.red]);
    for (const s of xp.powerUps) notes.push([`${SLOT_LABEL[s]} sube de nivel: ${pw[s].name}`, C.inkBlue]);
    if (won && loot.kind === 'first') notes.push([`1ª VICTORIA DE ${cat.name.toUpperCase()} CONTRA ESTE RIVAL: XP COMPLETA${loot.catchup > 1.01 ? ` · x${loot.catchup.toFixed(1)} POR IR ATRÁS` : ''}`, C.pinkHot]);
    else if (won && loot.catchup > 1.01) notes.push([`PONERSE AL DÍA: XP x${loot.catchup.toFixed(1)} (va atrás de tu mejor gato del Podio)`, C.pinkHot]);
    if (xp.toBank > 0) notes.push([`+${fmt(xp.toBank)} XP GUARDADA: entra sola cuando ${cat.name} suba su tope en la isla.`, C.plum]);
    else if (xp.capped) notes.push([`TOPE: alimenta a ${cat.name} hasta NV ${nextCapLevel(cat)} (o súbelo de estrella) para que siga creciendo aquí.`, C.plum]);
    if (loot.leagueUp) notes.unshift([`¡ASCIENDES A ${league(loot.league + 1).name}!`, C.pinkHot]);
    if (loot.prize) {
      const pd = catDef(loot.prize.species);
      notes.unshift([`PREMIO DEL CAMPEÓN: ${pd.name.toUpperCase()} (${RARITY[pd.rarity].name})${loot.prize.isNew ? ' SE UNE A TU ISLA' : ` · +${loot.prize.orbs} ORBES`}`, RARITY[pd.rarity].color]);
    }
    notes.slice(0, 3).forEach(([s, col], i) => {
      const t = txt(s, { fontFamily: F.poster, fontSize: 24, fill: col });
      t.position.set(lx, xpY + 84 + i * 34);
      if (t.width > 800) t.scale.set(800 / t.width);
      t.alpha = 0;
      card.addChild(t);
      tl.to(t, { alpha: 1, duration: 0.15 }, at + i * 0.25).from(t.scale, { x: 1.3, y: 1.3, duration: 0.3, ease: 'back.out(3)' }, at + i * 0.25);
    });
    // ---- stamp
    const stamp = new Container();
    const sg = new Graphics().roundRect(-170, -62, 340, 124, 16).stroke({ width: 10, color: won ? C.red : C.inkBlue });
    const stt = txt(won ? (loot.kind === 'repeat' ? 'REVANCHA' : loot.kind === 'first' ? '¡1ª VEZ!' : 'GANADO') : 'NOQUEADO', { fontFamily: F.poster, fontSize: 64, fill: won ? C.red : C.inkBlue, letterSpacing: 4 });
    stt.anchor.set(0.5);
    stamp.addChild(sg, stt);
    stamp.position.set(170, 640);
    stamp.scale.set(0.82);
    stamp.rotation = -0.18;
    stamp.alpha = 0;
    card.addChild(stamp);
    tl.to(stamp, { alpha: 0.9, duration: 0.05 }, 0.5).from(stamp.scale, { x: 2.2, y: 2.2, duration: 0.25, ease: 'power4.in' }, 0.5).call(() => sfx('boom', 1.3), [], 0.75);
    // ---- buttons
    const by = ch + 40;
    const next = new Button(won ? 'SIGUIENTE RIVAL' : 'REVANCHA', () => o.onNext(), { w: 400, h: 92, color: C.pinkHot, textColor: C.paper, size: 40 });
    const lobby = new Button('EL PODIO', () => o.onLobby(), { w: 300, h: 92, color: C.paper, size: 38 });
    const isl = new Button('ISLA', () => o.onIsland(), { w: 220, h: 92, color: C.yellow, size: 38 });
    next.position.set(cw - 400, by);
    lobby.position.set(cw - 400 - 330, by);
    isl.position.set(cw - 400 - 330 - 250, by);
    card.addChild(next, lobby, isl);
    card.position.set((W - cw) / 2, 50);
    this.addChild(card);
    card.alpha = 0;
    gsap.to(card, { alpha: 1, duration: 0.2 });
    gsap.from(card, { y: 120, duration: 0.45, ease: 'back.out(1.5)' });
    if (won) window.setTimeout(() => !this.destroyed && sfx('fanfare'), 200);
    else window.setTimeout(() => !this.destroyed && sfx('sting'), 200);
    // tap anywhere on the dim → skip to the end of the cascade
    dim.on('pointertap', () => tl.progress(1));
    void G;
  }

  override destroy(o?: Parameters<Container['destroy']>[0]) {
    this.tl.kill();
    const kill = (c: Container) => {
      gsap.killTweensOf(c);
      gsap.killTweensOf(c.scale);
      for (const ch of c.children) kill(ch as Container);
    };
    kill(this);
    super.destroy(o);
  }
}

function purrNote(p: PodioLoot['purr']) {
  const parts = [`${fmtMin(p.vault)} a tu bóveda`, `${fmtMin(p.timers)} a tus relojes`];
  if (p.gold > 0.05) parts.push(`${fmtMin(p.gold)} a oro (bóveda llena)`);
  return parts.join(' · ');
}

function fmtMin(m: number) {
  if (m <= 0) return '0 min';
  if (m < 1) return `${Math.round(m * 60)} s`;
  return `${Math.round(m * 10) / 10} min`;
}
