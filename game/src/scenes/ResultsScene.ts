/**
 * Results (GDD 6.13 · storyboard e): victory = DIARIO DEL MAR front page + loot cascade, Ronroneo stamps
 * flying to their clocks, Momentum, MVP, golden loot. Defeat = NOIR "DERROTA" in blue ink with film grain,
 * loot still ticks up (never "+0") + Boss Analysis. Boss with a new element → T4 discovery → primordial joins.
 */
import { ColorMatrixFilter, Container, Graphics, Sprite, Text, Texture, TilingSprite } from 'pixi.js';
import { ComicFilter } from '../fx/filters';
import { OldFilmFilter } from 'pixi-filters';
import gsap from 'gsap';
import { Scene, scenes } from '../core/scenes';
import { W, H } from '../core/App';
import { C, F } from '../ui/theme';
import { txt, Button, Bar, dotGrid, crosses } from '../ui/widgets';
import { icon, IconKind } from '../ui/icons';
import { halftoneTexture } from '../art/textures';
import { elementFx } from '../art/catArt';
import { slugOf } from '../art/tint';
import { sfx } from '../core/audio';
import { music } from '../core/music';
import { Shaker } from '../fx/juice';
import { goIsland, goMap } from '../app/flow';
import { G } from '../state/game';
import { BAL } from '../state/econ';
import { CAT_BY_ID, CONTENT, ELEMENT_BY_ID, ZONES, catDef, zoneBoss } from '../data/content';
import { frontier, stageInfo, winChance, claimBossCat } from '../state/sys/campaign';
import { crew } from '../state/sys/ship';
import { cat as getCat } from '../state/sys/cats';
import { LastBattle, resonancesWith, stageKind } from '../state/ext/campaign';
import { activeMissions, evalGoal } from '../state/sys/missions';
import { VictoryNews, NewsLootRow } from '../fx/sequences/victoryNews';
import { playElementDiscovery } from '../fx/sequences/elementDiscovery';
import { playCatReveal } from '../fx/sequences/catReveal';
import { P, catPortrait, clipping, doubleRule, elIcon, elKey, ensureCats, label, stamp, tickUp, wait, clearChildren, killTree } from '../panels/campaign/common';
import { openShipyard } from '../panels/Shipyard';

const QUIPS = ['Testigos: «fue precioso».', 'Un pescado que pasaba lo grabó todo.', 'Se reportan sardinas voladoras en la zona.', 'El capitán enemigo pidió a su mamá.', 'Nadie esperaba tanta violencia de tan poquito gato.'];
const CAPTIONS = ['FOTO: un pescado que pasaba por ahí.', 'FOTO: archivo del Diario. El fotógrafo sigue mojado.', 'FOTO: cortesía de una gaviota con cámara.'];
const BIOME: Record<string, string> = { cliff: 'ACANTILADO', volcano: 'VOLCÁN', reef: 'ARRECIFE', storm: 'TORMENTA', library: 'BIBLIOTECA', crater: 'CRÁTER' };

function pick<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

export class ResultsScene extends Scene {
  private shaker!: Shaker;
  private world = new Container();
  private ui = new Container();
  private film: OldFilmFilter | null = null;
  private tl: gsap.core.Timeline | null = null;
  private news: VictoryNews | null = null;
  private buttons = new Container();
  private busy = false;

  constructor(
    private last: LastBattle,
    private photo: Texture | null,
  ) {
    super();
  }

  override async enter() {
    this.addChild(this.world, this.ui);
    this.shaker = new Shaker(this.world, 18, 0.012);
    const species = [...crew().map((u) => getCat(u)?.species ?? 'c_canelo')];
    const mvp = this.last.mvp ? getCat(this.last.mvp) : undefined;
    if (mvp) species.push(mvp.species);
    if (this.last.loot.newCat) species.push(this.last.loot.newCat);
    const sd = stageInfo(this.last.zone, this.last.stage);
    if (sd?.enemyCats) species.push(...sd.enemyCats);
    await ensureCats(species);
    if (this.destroyed) return;
    if (this.last.result.won) this.buildVictory();
    else this.buildDefeat();
    // tap = complete the cascade
    this.eventMode = 'static';
    this.hitArea = { contains: () => true };
    this.on('pointertap', () => this.skip());
  }

  override exit() {
    this.shaker?.destroy();
    this.tl?.kill();
    killTree(this);
    // the battle photo is ours to free
    const ph = this.photo;
    this.photo = null;
    if (ph) window.setTimeout(() => ph.destroy(true), 0);
  }

  override update() {
    if (this.film) this.film.seed = Math.random();
  }

  private skip() {
    if (!this.tl || this.busy) return;
    if (this.tl.progress() < 1) {
      this.tl.progress(1);
      this.news?.complete();
    }
  }

  // ================================================================ VICTORY
  private buildVictory() {
    const L = this.last;
    const z = L.zone;
    const s = L.stage;
    const sd = stageInfo(z, s);
    const kind = stageKind(z, s);
    const mvp = L.mvp ? getCat(L.mvp) : getCat(crew()[0] ?? '');
    const mvpName = (mvp?.name ?? 'Canelo').toUpperCase();
    const enemyFull = sd?.name ?? 'Pirata';
    const enemy = (enemyFull.split('—')[1] ?? enemyFull).trim();
    const shipName = CONTENT.ships.find((x) => x.id === G.s.ship.active)?.name ?? 'Balsa Bigotuda';
    const boss = kind === 'boss' ? zoneBoss(z) : undefined;

    // background: Swiss poster in ink blue
    const bg = new Graphics().rect(0, 0, W, H).fill(C.inkBlue);
    const dots = new TilingSprite({ texture: halftoneTexture(0x000000, 12, 2.4), width: W, height: H });
    dots.alpha = 0.22;
    const circle = new Graphics().circle(0, 0, 470).fill(L.loot.golden ? C.gold : C.pink);
    circle.position.set(1600, 330);
    const dg = dotGrid(3, 6, 20, 3, C.paper);
    dg.position.set(1840, 820);
    const cr = crosses(C.paper);
    cr.position.set(1830, 740);
    this.world.addChild(bg, dots, circle, dg, cr);
    gsap.from(circle.scale, { x: 0, y: 0, duration: 0.5, ease: 'back.out(1.6)' });

    // headline
    const first = !G.s.counters.wins || G.s.counters.wins <= 1;
    let headline: string;
    if (boss) headline = z === 1 ? `${mvpName} LE ROMPE LOS BIGOTES AL CAPITÁN` : `${mvpName} HUNDE A ${boss.name.toUpperCase()}`;
    else if (first) headline = `${mvpName} PARTE BARCO EN TRES`;
    else {
      const opts = [`${mvpName} PARTE BARCO EN TRES`];
      if (L.result.reason === 'core') opts.push(`${mvpName} LE REVIENTA EL NÚCLEO A ${enemy.toUpperCase()}`);
      if (L.result.reason === 'sunk') opts.push(`${mvpName} MANDA A ${enemy.toUpperCase()} A DORMIR CON LOS PECES`);
      if (L.result.reason === 'crew') opts.push(`${mvpName} NOQUEA A TODA LA TRIPULACIÓN ENEMIGA`);
      headline = pick(opts);
    }
    const turns = Math.max(1, L.result.turns || 1);
    const sub = boss
      ? `«${boss.lines.defeat}» — ${boss.name}, minutos antes de hundirse. La tripulación de la ${shipName} celebra con pescado.`
      : `La tripulación de la ${shipName} hunde a «${enemyFull}» en ${turns} ${turns === 1 ? 'turno' : 'turnos'}. ${pick(QUIPS)}`;
    const date = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();

    // loot rows
    const loot = L.loot;
    const rows: NewsLootRow[] = [{ kind: 'gold', label: 'Doblones', value: loot.gold }, { kind: 'scrap', label: 'Chatarra', value: loot.scrap }];
    if (loot.blueprint) rows.push({ kind: 'blueprint', label: 'Planos', value: loot.blueprint });
    if (loot.crystals) rows.push({ kind: 'crystal', label: `Cristales ${elIcon(loot.crystals.el)}`, value: loot.crystals.n, tint: elementFx(elKey(loot.crystals.el)).main });
    if (loot.orbs) {
      const nm = CAT_BY_ID.get(loot.orbs.species)?.name ?? 'gato';
      rows.push({ kind: 'orb', label: `Orbes de ${nm}`, value: loot.orbs.n, tint: elementFx(elKey(CAT_BY_ID.get(loot.orbs.species)?.elements[0] ?? 'fire')).main });
    }
    if (loot.gems) rows.push({ kind: 'gem', label: 'Ojos de Gato', value: loot.gems });

    const news = new VictoryNews({
      headline,
      sub,
      caption: pick(CAPTIONS),
      edition: `AÑO I · Nº ${String(G.s.stats.victories).padStart(4, '0')}`,
      place: `${ZONES[z - 1]?.name.toUpperCase() ?? 'EL MAR'} · ${date}`,
      photo: this.photo,
      mvpSpecies: mvp?.species ?? null,
      rows,
      golden: loot.golden,
      perfect: L.result.perfect,
      momentum: [L.momentumBefore, L.momentumAfter],
    });
    news.position.set(52, 44);
    this.world.addChild(news);
    this.news = news;
    const tl = news.timeline(() => this.shaker.add(0.45));
    this.tl = tl;

    // ---------------- right column
    const x0 = 1262;
    const col = new Container();
    this.ui.addChild(col);
    // MVP
    const mv = new Container();
    mv.position.set(x0, 40);
    const mvT = txt('MVP DE LA JORNADA', { fontFamily: F.bebas, fontSize: 32, fill: C.paper, letterSpacing: 3 });
    mv.addChild(mvT);
    if (mvp) {
      const def = catDef(mvp.species);
      const p = catPortrait(mvp.species, 190, { ring: C.paper });
      p.position.set(100, 150);
      const nm = txt(mvp.name.toUpperCase(), { fontFamily: F.poster, fontSize: 64, fill: C.paper, stroke: { color: C.ink, width: 6 } });
      nm.position.set(212, 48);
      const cry = txt(`«${def.battleForm.cry}»`, { fontFamily: F.comic, fontSize: 32, fill: C.yellow, stroke: { color: C.ink, width: 5 }, wordWrap: true, wordWrapWidth: 400, letterSpacing: 1 });
      cry.position.set(214, 128);
      const info = label(`Nv ${mvp.level} · ${'★'.repeat(mvp.stars)} · ${def.elements.map((e) => elIcon(e)).join(' ')}`, 20, C.paper);
      info.position.set(214, 128 + cry.height + 6);
      mv.addChild(p, nm, cry, info);
      tl.from(p.scale, { x: 0, y: 0, duration: 0.35, ease: 'back.out(2.5)' }, 1.5);
      tl.from([nm, cry, info], { alpha: 0, x: '+=40', duration: 0.3, stagger: 0.06 }, 1.6);
      tl.call(() => sfx('meow'), [], 1.6);
    }
    col.addChild(mv);

    // Ronroneo stamps → clocks
    const pr = new Container();
    pr.position.set(x0, 300);
    const prT = txt(`RONRONEO  +${L.purrMinutes.toFixed(1)} MIN`, { fontFamily: F.poster, fontSize: 44, fill: C.paper });
    pr.addChild(prT);
    col.addChild(pr);
    const applied = L.purrApplied.length ? L.purrApplied.slice(0, 4) : [{ label: 'Reserva de Ronroneo', minutes: L.purrMinutes }];
    const rowsUi: { bar: Bar; val: Text; target: number; from: number; done: boolean }[] = [];
    applied.forEach((a, i) => {
      const r = new Container();
      r.position.set(0, 64 + i * 66);
      const timer = G.s.timers.find((t) => t.label === a.label);
      const after = timer ? 1 - timer.leftMs / Math.max(1, timer.totalMs) : 1;
      const before = timer ? Math.max(0, after - (a.minutes * 60000) / Math.max(1, timer.totalMs)) : a.label.startsWith('Reserva') ? 0.2 : 0.4;
      const ic = icon(timer || !a.label.startsWith('Reserva') ? 'clock' : 'paw', 34, C.paper);
      ic.position.set(18, 22);
      const lt = label(a.label, 20, C.paper);
      lt.position.set(44, 4);
      const val = label(timer ? `${Math.ceil(timer.leftMs / 60000)} min` : a.label.startsWith('Reserva') ? `${G.s.purr.toFixed(1)} min` : '¡LISTO!', 18, C.mint);
      val.anchor.set(1, 0);
      val.position.set(590, 6);
      const bar = new Bar(546, 16, C.green, 0x0d1a2c);
      bar.position.set(44, 34);
      bar.set(before, false);
      r.addChild(ic, lt, val, bar);
      pr.addChild(r);
      rowsUi.push({ bar, val, target: after, from: before, done: !timer && !a.label.startsWith('Reserva') });
      r.alpha = 0;
      tl.to(r, { alpha: 1, duration: 0.2 }, 1.9 + i * 0.1);
    });
    const tStamps = Math.max(2.6, (tl.labels.done ?? 3) - 0.6);
    applied.forEach((a, i) => {
      tl.call(() => this.flyStamp(`−${a.minutes.toFixed(1)} MIN`, rowsUi[i], pr.y + 64 + i * 66 + 20 + 0), [], tStamps + i * 0.22);
    });

    // Momentum
    const mo = new Container();
    mo.position.set(x0, 300 + 64 + applied.length * 66 + 26);
    const moT = txt('MOMENTUM', { fontFamily: F.poster, fontSize: 40, fill: C.paper });
    const moV = txt(`×${L.momentumBefore.toFixed(2)}`, { fontFamily: F.heavy, fontSize: 30, fill: C.yellow });
    moV.anchor.set(1, 0);
    moV.position.set(590, 6);
    const moBar = new Bar(590, 26, C.orange, 0x0d1a2c);
    moBar.position.set(0, 56);
    const maxM = BAL.momentum.max;
    moBar.set((L.momentumBefore - 1) / (maxM - 1), false);
    mo.addChild(moT, moV, moBar);
    col.addChild(mo);
    tl.call(
      () => {
        moBar.set((L.momentumAfter - 1) / (maxM - 1));
        tickUp(moV, L.momentumAfter, { from: L.momentumBefore, prefix: '×', format: (n) => n.toFixed(2), dur: 0.6 });
        sfx('levelup', 1.2);
      },
      [],
      tStamps + applied.length * 0.22 + 0.2,
    );

    // missions advanced by this battle
    const ms = activeMissions().slice(0, 3);
    if (ms.length) {
      const mb = new Container();
      mb.position.set(x0, mo.y + 104);
      const mt = txt('MISIONES', { fontFamily: F.poster, fontSize: 34, fill: C.paper });
      mb.addChild(mt);
      ms.forEach((m, i) => {
        const ev = evalGoal(m);
        const done = ev.cur >= ev.need;
        const r = new Container();
        r.position.set(0, 46 + i * 44);
        const t = label(m.title, 17, done ? C.yellow : C.paper);
        const v = label(done ? '¡LISTA!' : `${Math.min(ev.cur, ev.need)}/${ev.need}`, 16, done ? C.yellow : C.mint);
        v.anchor.set(1, 0);
        v.position.set(590, 0);
        const bar = new Bar(590, 10, done ? C.yellow : C.pink, 0x0d1a2c);
        bar.position.set(0, 24);
        bar.set(Math.min(1, ev.cur / Math.max(1, ev.need)), false);
        r.addChild(t, v, bar);
        mb.addChild(r);
      });
      // keep clear of the buttons
      if (mb.y + mb.height < 800) {
        col.addChild(mb);
        tl.from(mb, { alpha: 0, x: '+=30', duration: 0.3 }, 2.2);
      } else mb.destroy({ children: true });
    }

    // buttons
    this.buildButtons(true);
    this.buttons.alpha = 0;
    const tEnd = tStamps + applied.length * 0.22 + 0.8;
    tl.call(() => this.afterCascade(), [], tEnd);
  }

  private flyStamp(text: string, row: { bar: Bar; val: Text; target: number; from: number; done: boolean } | undefined, targetY: number) {
    if (!row || !this.news) return;
    const st = stamp(text, C.mint, 26, -0.1);
    const from = this.toLocal(this.news.headlineGlobal());
    st.position.set(from.x + 300 + Math.random() * 200, from.y + 60);
    this.ui.addChild(st);
    sfx('paper');
    gsap.to(st, {
      x: 1262 + 470,
      y: targetY,
      rotation: 0.1,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: () => {
        sfx('hit', 1.3);
        sfx('tick', 1.8);
        row.bar.set(row.target);
        if (row.target >= 0.999 && row.done) row.val.text = '¡LISTO!';
        gsap.to(st, { alpha: 0, duration: 0.25, delay: 0.15, onComplete: () => st.destroy({ children: true }) });
      },
    });
    gsap.to(st.scale, { x: 0.7, y: 0.7, duration: 0.5 });
  }

  private async afterCascade() {
    const L = this.last;
    if (L.loot.newElement && !this.busy) {
      this.busy = true;
      await wait(500);
      await this.elementSequence();
      this.busy = false;
    }
    gsap.to(this.buttons, { alpha: 1, duration: 0.3 });
    gsap.from(this.buttons, { y: this.buttons.y + 40, duration: 0.35, ease: 'back.out(2)' });
  }

  private async elementSequence() {
    const L = this.last;
    const el = L.loot.newElement!;
    const def = ELEMENT_BY_ID.get(el) as (ReturnType<typeof ELEMENT_BY_ID.get> & { habitatBiome?: string }) | undefined;
    const stamps: string[] = [];
    const biome = def?.habitatBiome;
    stamps.push(`NUEVO HÁBITAT: ${biome ? BIOME[biome] ?? biome.toUpperCase() : (def?.name ?? el).toUpperCase()}`);
    const zu = L.loot.unlocks.find((u) => u.startsWith('zone:'));
    if (zu) {
      const zn = Number(zu.split(':')[1]);
      stamps.push(`NUEVA ZONA: ${ZONES[zn - 1]?.name.toUpperCase() ?? '???'}`);
    }
    await playElementDiscovery(scenes.fxLayer, {
      element: el,
      world: this,
      primordialSlug: L.loot.newCat ? slugOf(L.loot.newCat) : undefined,
      known: G.s.elements,
      resonances: resonancesWith(el),
      stamps,
    });
    if (L.loot.newCat) {
      const sp = L.loot.newCat;
      const r = claimBossCat(sp);
      const cd = catDef(sp);
      music.play('island');
      await playCatReveal(scenes.fxLayer, {
        slug: cd.art.slug,
        name: r.cat?.name ?? cd.name,
        elements: cd.elements,
        rarity: cd.primordial ? 'primordial' : cd.rarity,
        species: sp,
        caption: cd.lore,
        subtitle: `${cd.epithet} · ${cd.battleForm.cry}`,
      });
      G.save();
    } else music.play('island');
  }

  private buildButtons(won: boolean) {
    const b = this.buttons;
    clearChildren(b);
    const f = frontier();
    const L = this.last;
    const same = f.zone === L.zone && f.stage === L.stage;
    const x0 = 1262;
    const y0 = 818;
    const nextLabel = won ? (same ? 'REPETIR' : `SIGUIENTE  ${f.zone}-${f.stage}`) : 'REINTENTAR';
    const next = new Button(nextLabel, () => this.openPre(won ? f.zone : L.zone, won ? f.stage : L.stage), { w: 618, h: 104, size: 54, color: C.pink });
    next.position.set(x0, y0);
    const rep = new Button('REPETIR', () => this.openPre(L.zone, L.stage), { w: 194, h: 76, size: 30, color: C.paper });
    rep.position.set(x0, y0 + 128);
    const map = new Button('MAPA', () => void goMap(), { w: 194, h: 76, size: 30, color: C.mint });
    map.position.set(x0 + 212, y0 + 128);
    const isl = new Button('ISLA', () => void goIsland(), { w: 194, h: 76, size: 30, color: C.yellow });
    isl.position.set(x0 + 424, y0 + 128);
    b.addChild(next, map, isl);
    if (won && !same) b.addChild(rep);
    else {
      const yard = new Button('ASTILLERO', () => openShipyard(), { w: 194, h: 76, size: 28, color: C.paper });
      yard.position.set(x0, y0 + 128);
      b.addChild(yard);
    }
    this.ui.addChild(b);
  }

  private async openPre(zone: number, stage: number) {
    if (this.busy) return;
    const { openPreBattle } = await import('../panels/campaign/PreBattle');
    openPreBattle(zone, stage);
  }

  // ================================================================ DEFEAT
  private buildDefeat() {
    const L = this.last;
    const z = L.zone;
    const s = L.stage;
    const sd = stageInfo(z, s);
    const kind = stageKind(z, s);
    const boss = kind === 'boss' ? zoneBoss(z) : undefined;
    // noir background + grain
    const g = new Graphics();
    for (let i = 0; i < 16; i++) g.rect(0, (i * H) / 16, W, H / 16 + 1).fill(lerp(0x0d110f, 0x1c3a51, i / 15));
    const dots = new TilingSprite({ texture: halftoneTexture(0x000000, 10, 2), width: W, height: H });
    dots.alpha = 0.3;
    this.world.addChild(g, dots);
    this.film = new OldFilmFilter({ sepia: 0, noise: 0.22, noiseSize: 1.2, scratch: 0.6, scratchDensity: 0.4, vignetting: 0.32, vignettingAlpha: 0.9 });
    this.world.filters = [this.film];

    // paper slab
    const slab = new Container();
    const sw = 1120;
    const sh = 930;
    const paper = clipping(sw, sh, { color: 0xdcd6c6, seed: 9, amp: 6 });
    slab.addChild(paper);
    const mast = txt('Diario del Mar', { fontFamily: F.news, fontSize: 70, fill: P.blue });
    mast.anchor.set(0.5, 0);
    mast.position.set(sw / 2, 18);
    const ed = label('EDICIÓN DE LUTO · SE ACEPTAN PAÑUELOS', 15, P.blue, { letterSpacing: 3 });
    ed.anchor.set(0.5, 0);
    ed.position.set(sw / 2, 104);
    const r1 = doubleRule(sw - 80, P.blue, 3);
    r1.position.set(40, 130);
    const big = txt('DERROTA', { fontFamily: F.poster, fontSize: 290, fill: P.blue, letterSpacing: -6 });
    big.anchor.set(0.5, 0);
    big.position.set(sw / 2, 130);
    const copy = txt(pick(CONTENT.story.defeatCopy), { fontFamily: F.serif, fontStyle: 'italic', fontSize: 32, fill: C.ink, wordWrap: true, wordWrapWidth: sw - 100, align: 'center' });
    copy.anchor.set(0.5, 0);
    copy.position.set(sw / 2, 480);
    slab.addChild(mast, ed, r1, big, copy);
    let y = 480 + copy.height + 16;
    if (boss?.lines.win) {
      const q = txt(`«${boss.lines.win}» — ${boss.name}`, { fontFamily: F.comic, fontSize: 28, fill: C.red, wordWrap: true, wordWrapWidth: sw - 120, align: 'center', letterSpacing: 1 });
      q.anchor.set(0.5, 0);
      q.position.set(sw / 2, y);
      slab.addChild(q);
      y += q.height + 14;
    }
    // what you DO take home
    const box = new Container();
    box.position.set(60, Math.max(y + 6, 640));
    const bt = txt('LO QUE SÍ TE LLEVAS', { fontFamily: F.poster, fontSize: 36, fill: C.ink });
    box.addChild(bt);
    const loot = L.loot;
    const items: { kind: IconKind; label: string; v: number; tint?: number }[] = [
      { kind: 'gold', label: 'Doblones', v: loot.gold },
      { kind: 'scrap', label: 'Chatarra', v: loot.scrap },
    ];
    if (loot.orbs) {
      const d = CAT_BY_ID.get(loot.orbs.species);
      items.push({ kind: 'orb', label: `Orbes de ${d?.name ?? 'gato'} (ficha: Rumor)`, v: loot.orbs.n, tint: elementFx(elKey(d?.elements[0] ?? 'water')).main });
    }
    const tl = gsap.timeline();
    this.tl = tl;
    tl.from(slab, { y: slab.y - 40, alpha: 0, duration: 0.4, ease: 'power2.out' }, 0);
    tl.from(big.scale, { x: 1.3, y: 1.3, duration: 0.3, ease: 'power3.in' }, 0.25);
    tl.call(() => {
      sfx('sting');
      this.shaker.add(0.3);
    }, [], 0.5);
    items.forEach((it, i) => {
      const r = new Container();
      r.position.set(i * 330, 52);
      const ic = icon(it.kind, 44, it.tint);
      ic.position.set(22, 26);
      const v = txt('+0', { fontFamily: F.heavy, fontSize: 36, fill: C.ink });
      v.position.set(52, 4);
      const l = label(it.label, 15, C.ink, { wordWrap: true, wordWrapWidth: 270 });
      l.position.set(52, 50);
      r.addChild(ic, v, l);
      r.alpha = 0;
      box.addChild(r);
      tl.call(() => {
        r.alpha = 1;
        sfx('coin', 0.9 + i * 0.1);
        tickUp(v, it.v, { prefix: '+', dur: 0.6, onTick: (p) => sfx('tick', 1 + p * 0.4) });
      }, [], 0.9 + i * 0.3);
    });
    slab.addChild(box);
    // "foto del naufragio": the battle frame in blue halftone
    if (this.photo) {
      const pw = 380;
      const phh = 214;
      const pc = new Container();
      pc.position.set(sw - pw - 50, sh - phh - 60);
      pc.rotation = 0.02;
      const fr = new Graphics().rect(-8, -8, pw + 16, phh + 16).fill(P.blue);
      const inner = new Container();
      const sp = new Sprite(this.photo);
      const k = Math.max(pw / sp.width, phh / sp.height) * 1.1;
      sp.scale.set(k);
      sp.position.set((pw - sp.width) / 2, (phh - sp.height) / 2);
      inner.addChild(sp);
      const m = new Graphics().rect(0, 0, pw, phh).fill(0xffffff);
      inner.mask = m;
      const gray = new ColorMatrixFilter();
      gray.desaturate();
      inner.filters = [gray, new ComicFilter({ dot: 4, levels: 3, sat: 0, shadow: P.blue, strength: 1 })];
      const cap = label('FOTO: el naufragio. Nadie lloró (mucho).', 14, P.blue, { fontStyle: 'italic' });
      cap.position.set(0, phh + 12);
      pc.addChild(fr, inner, m, cap);
      slab.addChild(pc);
      tl.from(pc, { alpha: 0, y: pc.y + 30, duration: 0.4 }, 1.2);
    }
    slab.position.set(70, 70);
    slab.rotation = -0.012;
    this.world.addChild(slab);

    // right column: boss analysis + tips
    const x0 = 1262;
    let ry = 60;
    if (boss) {
      const an = new Container();
      an.position.set(x0, ry);
      const t = txt('ANÁLISIS DEL JEFE', { fontFamily: F.poster, fontSize: 48, fill: C.paper });
      const pct = txt(`${Math.round(L.analysisBefore * 100)}%`, { fontFamily: F.heavy, fontSize: 40, fill: C.yellow });
      pct.anchor.set(1, 0);
      pct.position.set(618, 4);
      const bar = new Bar(618, 30, C.yellow, 0x0d1a2c);
      bar.position.set(0, 66);
      bar.set(L.analysisBefore, false);
      an.addChild(t, pct, bar);
      const tiers: [number, string][] = [
        [0.2, 'Ves la vida de sus fases'],
        [0.4, 'Punto débil revelado'],
        [0.6, 'Telegrafía sus tiros 1 turno antes'],
      ];
      tiers.forEach(([th, txtT], i) => {
        const ok = L.analysisAfter >= th - 1e-6;
        const row = label(`${ok ? '✔' : '○'}  ${Math.round(th * 100)}% · ${txtT}`, 20, ok ? C.mint : 0x8a95a3);
        row.position.set(0, 110 + i * 32);
        an.addChild(row);
      });
      const red = label(`Su poder baja −${Math.round(25 * Math.min(1, L.analysisAfter))}% gracias al Análisis`, 20, C.paper);
      red.position.set(0, 110 + tiers.length * 32 + 6);
      an.addChild(red);
      this.ui.addChild(an);
      tl.call(() => {
        bar.set(L.analysisAfter);
        tickUp(pct, Math.round(L.analysisAfter * 100), { from: Math.round(L.analysisBefore * 100), suffix: '%', dur: 0.7 });
        sfx('levelup', 0.8);
      }, [], 1.6);
      ry += 300;
    }
    const tips = new Container();
    tips.position.set(x0, ry);
    const tt = txt('CONSEJOS DEL CONTRAMAESTRE', { fontFamily: F.poster, fontSize: 36, fill: C.paper });
    tips.addChild(tt);
    const est = Math.round(winChance(z, s) * 100);
    const lines = [`• Estimación actual: ${est}% (${sd?.name ?? ''}).`, '• Mejora Armas y Casco en el Astillero: es Poder puro.', '• Alimenta a tus gatos: cada ¡ÑAM! cuenta.', '• Lee el viento antes de soltar el tiro.'];
    lines.forEach((l, i) => {
      const t = label(l, 20, C.paper, { wordWrap: true, wordWrapWidth: 610 });
      t.position.set(0, 52 + i * 40);
      tips.addChild(t);
    });
    this.ui.addChild(tips);
    tl.from(tips, { alpha: 0, x: '+=40', duration: 0.3 }, 1.2);
    this.buildButtons(false);
    tl.from(this.buttons, { alpha: 0, y: '+=40', duration: 0.3 }, 1.8);
  }
}

function lerp(a: number, b: number, t: number) {
  const ar = (a >> 16) & 255,
    ag = (a >> 8) & 255,
    ab = a & 255;
  const br = (b >> 16) & 255,
    bg = (b >> 8) & 255,
    bb = b & 255;
  return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t);
}
