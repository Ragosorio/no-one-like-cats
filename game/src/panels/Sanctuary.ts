/**
 * Santuario de Resonancia (ORQUÍDEA REAL): dos cojines, tabla viva de probabilidades
 * exactas (insignias SVG, sellos ¡NUEVO!), probabilidad de mutación (KL20), condiciones que
 * faltan, ranuras (+1 con gemas), Cola de Resonancia (KL18), trabajos en curso con su reloj
 * verde de dos fases, ¡REVELAR! → storyboard (a), REPETIR CRUCE e historial, y una franja de
 * progreso (Resonancias · Catdex · racha) que celebra cada revelación sin bloquear.
 */
import { Container, FederatedPointerEvent, Graphics, Sprite, Text, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { Modal, toast } from '../ui/modal';
import { C, F, RARITY } from '../ui/theme';
import { txt, poster } from '../ui/widgets';
import { icon } from '../ui/icons';
import { sfx } from '../core/audio';
import { fmtDuration, fmtTime } from '../core/format';
import { scenes } from '../core/scenes';
import { glowTexture } from '../art/textures';
import { slugOf } from '../art/tint';
import { catDef, CONTENT } from '../data/content';
import { G, ResonanceJob } from '../state/game';
import { BAL, discoveryGems } from '../state/econ';
import { cat as getCat, collState, resolveMutationChoice, takeSetCelebrations, checkSets, mutationDef } from '../state/sys/cats';
import {
  busyCats,
  buyGemSlot,
  freeSlots,
  gemSlotInfo,
  mutationOdds,
  MUTATION_RULES,
  oddsFor,
  queuedCats,
  queueKl,
  queueUnlocked,
  reveal,
  startCopy,
  startResonance,
  OddsTable,
} from '../state/sys/resonance';
import { checkMissions } from '../state/sys/missions';
import {
  dequeuePair,
  dexCount,
  dexTotal,
  enqueuePair,
  isTutorialResonance,
  jobView,
  missingDetail,
  mutationLook,
  mutationShort,
  parentNames,
  pickerCats,
  printRarity,
  queueCap,
  readyJobs,
  repeatCross,
  repeatExplain,
  revealInfo,
  TUTORIAL_RESONANCE_MS,
  tutorialPair,
} from '../state/ext/collection';
import { resonanceQueue } from '../state/sys/workforce';
import { ensureCatArt, portrait, variantSprite } from './collection/art';
import { ScrollBox, GlitchText, clearChildren, guardModal, destroyTree, elIcons, dnaIcon, killTree } from './collection/ui';
import { fitText, rarityColor, rarityName } from './collection/CatCard';
import { playCatReveal, RevealResult } from '../fx/sequences/catReveal';
import { playPendingSets } from './collection/setPoster';
import { elementIcon } from '../ui/elementIcon';
import { floatText, sparkles, speedLines } from '../fx/juice';

// ORQUÍDEA REAL palette
const P = {
  ink: 0x231626,
  plum: 0x5c3d5b,
  orchid: 0x8f6b93,
  lilac: 0xb7a4c7,
  gold: 0xb89558,
  goldHi: 0xf0d78a,
  mint: 0xa7e8d7,
  linen: 0xeae1d3,
};

const MW = 1880;
const MH = 1036;
const IW = MW - 56;
const IH = MH - 130;
const RX = 1210;
const RW = IW - RX;
const CX = 460;

function serif(text: string, size: number, fill: number = P.goldHi, o: { italic?: boolean; bold?: boolean } = {}) {
  return txt(text, { fontFamily: F.serif, fontSize: size, fill, fontStyle: o.italic ? 'italic' : 'normal', fontWeight: o.bold ? '700' : '400', padding: o.italic ? Math.ceil(size * 0.2) : 0 });
}
function ui(text: string, size: number, fill: number = P.linen, bold = true) {
  return txt(text, { fontFamily: F.ui, fontSize: size, fill, fontWeight: bold ? '700' : '400' });
}

let current: SanctuaryView | null = null;

/** Open the Resonance Sanctuary. */
export async function openSanctuary() {
  await ensureCatArt();
  if (current && !current.modal.closed) return current;
  current = new SanctuaryView();
  return current;
}

/** Reveal every finished resonance in sequence (for other screens). Returns how many. */
export async function revealReady(): Promise<number> {
  await ensureCatArt();
  let n = 0;
  for (const job of [...readyJobs()]) {
    const r = await revealJob(job.id, false);
    if (r) n++;
    if (r?.res === 'catdex') {
      const { openCatdex } = await import('./Catdex');
      await openCatdex(job.result);
      break;
    }
  }
  current?.refreshAll();
  return n;
}

interface RevealDone {
  res: RevealResult;
  species: string;
  isNew: boolean;
  orbs: number;
  a: string;
  b: string;
  mutChoice?: string;
  rarity: string;
}

async function revealJob(jobId: string, offerRepeat: boolean): Promise<RevealDone | null> {
  const r = reveal(jobId);
  if (!r) return null;
  checkMissions();
  const species = r.job.result;
  const def = catDef(species);
  const info = revealInfo(species, r.isNew, r.orbs, r.job.mutation, r.trait);
  const [an, bn] = [getCat(r.job.a)?.name ?? '', getCat(r.job.b)?.name ?? ''];
  const res = await playCatReveal(scenes.overlayLayer, {
    slug: slugOf(species),
    species,
    name: def.name,
    elements: def.elements,
    rarity: info.rarity,
    caption: r.mutChoice ? '¡Duplicado… pero MUTADO! Ahora decides: orbes o mutación.' : info.caption,
    subtitle: info.subtitle,
    chips: info.chips,
    mutationId: r.job.mutation,
    serial: G.s.resonance.total,
    duplicateOrbs: r.isNew ? undefined : r.orbs,
    dup: r.mutChoice ? undefined : info.dup,
    duplicateLabel: r.mutChoice ? 'DUPLICADO · ¿ORBES O MUTACIÓN?' : undefined,
    dex: r.isNew ? info.dex : undefined,
    secret: def.secret,
    offerRepeat: offerRepeat && an && bn ? `Repetir cruce: ${an} + ${bn}` : undefined,
  });
  // set posters (T3) right after the reveal that completed them
  checkSets();
  const sets = takeSetCelebrations();
  if (sets.length) await playPendingSets(scenes.overlayLayer, sets);
  return { res, species, isNew: r.isNew, orbs: r.orbs, a: r.job.a, b: r.job.b, mutChoice: r.mutChoice, rarity: r.job.rarity };
}

class SanctuaryView {
  modal: Modal;
  private sel: [string | null, string | null] = [null, null];
  private listBox!: ScrollBox;
  private cushions: Container[] = [];
  private cushionCats: (Container | null)[] = [null, null];
  private portal!: Portal;
  private startBtn!: Container;
  private startBg!: Graphics;
  private startLabel!: Text;
  private infoLine!: Text;
  private tutBanner = new Container();
  private mutBox = new Container();
  private missingBox = new Container();
  private historyBox = new Container();
  private oddsBox = new Container();
  private jobsBox = new Container();
  private queueBox = new Container();
  private headStrip = new Container();
  private jobRows: { job: ResonanceJob; ring: Graphics; label: Text; dot: Graphics; btn?: Container; rh: number }[] = [];
  private purrChip = new Container();
  private slotChip = new Container();
  private acc = 0;
  private offs: (() => void)[] = [];
  private busyStart = false;
  private lastJobCount = -1;
  private revealing = false;
  // header strip live refs
  private hsRes!: Text;
  private hsDex!: Text;
  private hsDexBar!: Graphics;
  private hsPity!: Container;

  constructor() {
    const m = (this.modal = new Modal('', MW, MH, { color: P.plum, band: P.ink, bandText: P.goldHi }));
    m.label = 'SANTUARIO DE RESONANCIA'; // the title is drawn below; story/glossary read this
    guardModal(m, () => this.portal?.stop());
    this.decorate();
    const title = serif('Santuario de Resonancia', 54, P.goldHi, { italic: true, bold: true });
    title.position.set(30, 8);
    const sub = ui('PROCESO SAGRADO · Y PRIVADO · MUY PRIVADO', 14, P.lilac);
    sub.position.set(34, 70);
    sub.alpha = 0.85;
    m.panel.addChild(title, sub);
    this.headStrip.position.set(title.x + title.width + 40, 12);
    m.panel.addChild(this.headStrip);
    this.buildHeadStrip();

    this.buildList();
    this.buildCenter();
    this.buildRight();
    // tutorial: suggest Canelo + Brote
    const tp = tutorialPair();
    if (tp) this.sel = [tp[0], tp[1]];
    checkSets();
    this.refreshAll();
    m.open();
    Ticker.shared.add(this.tick, this);
    this.offs.push(
      G.on('timerDone', (t) => {
        if (t.kind === 'resonance' && !this.modal.closed) {
          sfx('reveal');
          this.refreshJobs();
          this.refreshList();
        }
      }),
      G.on('catAdded', () => !this.modal.closed && !this.revealing && this.refreshList()),
    );
    m.onClose = () => {
      Ticker.shared.remove(this.tick, this);
      this.offs.forEach((f) => f());
      this.portal.destroyed || this.portal.stop();
      if (current === this) current = null;
    };
    // pending decisions/posters from earlier sessions
    window.setTimeout(() => void this.resumePending(), 450);
  }

  private async resumePending() {
    if (this.modal.closed) return;
    const sets = takeSetCelebrations();
    if (sets.length) await playPendingSets(scenes.overlayLayer, sets);
    const mc = collState().mutChoices[0];
    if (mc && !this.modal.closed) await this.mutationChoice(mc.id);
  }

  // ------------------------------------------------------------ header progress strip
  private buildHeadStrip() {
    const h = this.headStrip;
    clearChildren(h);
    let x = 0;
    const block = (label: string, w: number) => {
      const c = new Container();
      c.position.set(x, 0);
      const g = new Graphics().roundRect(0, 0, w, 62, 8).fill({ color: P.plum, alpha: 0.65 }).stroke({ width: 1.5, color: P.gold, alpha: 0.8 });
      const l = ui(label, 11, P.lilac);
      l.position.set(12, 6);
      c.addChild(g, l);
      h.addChild(c);
      x += w + 12;
      return c;
    };
    const b1 = block('RESONANCIAS', 150);
    this.hsRes = serif(String(G.s.resonance.total), 34, P.goldHi, { bold: true });
    this.hsRes.position.set(12, 20);
    b1.addChild(this.hsRes);
    const b2 = block('CATDEX', 250);
    this.hsDex = serif(`${dexCount()}/${dexTotal()}`, 30, P.goldHi, { bold: true });
    this.hsDex.position.set(12, 22);
    this.hsDexBar = new Graphics();
    this.hsDexBar.position.set(110, 36);
    b2.addChild(this.hsDex, this.hsDexBar);
    this.drawDexBar(dexCount());
    const b3 = block('RACHA SIN ÉPICO', 270);
    this.hsPity = new Container();
    this.hsPity.position.set(12, 26);
    b3.addChild(this.hsPity);
    this.drawPity();
  }
  private drawDexBar(n: number) {
    const w = 126;
    this.hsDexBar
      .clear()
      .roundRect(0, 0, w, 14, 7)
      .fill(P.ink)
      .roundRect(0, 0, Math.max(6, (w * n) / dexTotal()), 14, 7)
      .fill(P.mint)
      .roundRect(0, 0, w, 14, 7)
      .stroke({ width: 1.5, color: P.gold });
  }
  private drawPity() {
    const c = this.hsPity;
    clearChildren(c);
    const cap = BAL.resonance.pity.cap;
    const p = G.s.resonance.pity;
    const shown = Math.min(cap, 15);
    for (let i = 0; i < shown; i++) {
      const g = new Graphics().roundRect(i * 11, 0, 8, 18, 2).fill(i < p ? (i >= 10 ? C.pinkHot : P.goldHi) : { color: P.ink, alpha: 0.8 });
      c.addChild(g);
    }
    const t = ui(p ? `+${p * BAL.resonance.pity.epic_bonus_per_miss}% ÉPICO` : 'LIMPIA', 12, p ? P.goldHi : P.lilac);
    t.position.set(shown * 11 + 6, 2);
    c.addChild(t);
  }

  // ------------------------------------------------------------ decoration (art nouveau)
  private decorate() {
    const d = new Container();
    const g = new Graphics();
    g.rect(14, 100, MW - 28, MH - 114).stroke({ width: 2, color: P.gold, alpha: 0.7 });
    g.rect(22, 108, MW - 44, MH - 130).stroke({ width: 1, color: P.gold, alpha: 0.4 });
    const cx = 28 + CX + 360;
    const top = 150;
    for (const [w, a] of [
      [700, 0.55],
      [660, 0.3],
    ] as const) {
      g.moveTo(cx - w / 2, 640).lineTo(cx - w / 2, top + w / 2).arc(cx, top + w / 2, w / 2, Math.PI, 0).lineTo(cx + w / 2, 640);
      g.stroke({ width: 2, color: P.gold, alpha: a });
    }
    g.circle(cx - 350, 640, 6).fill(P.gold).circle(cx + 350, 640, 6).fill(P.gold);
    const whip = (x: number, y: number, sx: number, sy: number) => {
      g.moveTo(x, y)
        .bezierCurveTo(x + 120 * sx, y + 10 * sy, x + 40 * sx, y + 120 * sy, x + 160 * sx, y + 150 * sy)
        .stroke({ width: 2, color: P.gold, alpha: 0.6 });
      g.circle(x + 160 * sx, y + 150 * sy, 4).fill(P.gold);
    };
    whip(30, 112, 1, 1);
    whip(MW - 30, 112, -1, 1);
    whip(30, MH - 22, 1, -1);
    whip(MW - 30, MH - 22, -1, -1);
    for (let i = 0; i < 26; i++) {
      const x = 40 + Math.random() * (MW - 80);
      const y = 120 + Math.random() * (MH - 160);
      const s = 3 + Math.random() * 6;
      g.star(x, y, 4, s, s * 0.3).fill({ color: i % 3 ? P.lilac : P.goldHi, alpha: 0.35 + Math.random() * 0.4 });
    }
    const glow = new Sprite(glowTexture());
    glow.anchor.set(0.5);
    glow.tint = P.orchid;
    glow.alpha = 0.55;
    glow.scale.set(6.5);
    glow.position.set(cx, 380);
    d.addChild(glow, g);
    this.modal.panel.addChildAt(d, 3);
  }

  // ------------------------------------------------------------ left: cat list
  private buildList() {
    const b = this.modal.body;
    const h = serif('Tus gatos', 34, P.goldHi, { italic: true, bold: true });
    h.position.set(0, -10);
    const s = ui('toca uno (o arrástralo) para sentarlo en un cojín', 14, P.lilac, false);
    s.position.set(2, 36);
    b.addChild(h, s);
    this.listBox = new ScrollBox(430, IH - 70, P.gold);
    this.listBox.y = 66;
    b.addChild(this.listBox);
  }

  refreshList() {
    const box = this.listBox;
    clearChildren(box.content);
    const rows = pickerCats();
    rows.forEach(({ cat, def, busy, queued }, i) => {
      const r = new Container();
      r.y = i * 92;
      const seat = this.sel.indexOf(cat.uid);
      const g = new Graphics()
        .roundRect(0, 0, 418, 84, 10)
        .fill({ color: P.ink, alpha: seat >= 0 ? 0.95 : 0.55 })
        .stroke({ width: seat >= 0 ? 3 : 1.5, color: seat >= 0 ? P.goldHi : P.gold, alpha: seat >= 0 ? 1 : 0.6 });
      r.addChild(g);
      const ring = new Graphics().circle(46, 42, 34).fill(P.linen).stroke({ width: 3, color: P.gold });
      const pm = new Graphics().circle(46, 42, 32).fill(0xffffff);
      const pt = portrait(cat.species, 84, 'color');
      pt.position.set(46, 48);
      pt.mask = pm;
      r.addChild(ring, pt, pm);
      if (cat.mutation) {
        const d = dnaIcon(22, mutationLook(cat.mutation)?.color ?? C.pinkHot);
        d.position.set(74, 66);
        r.addChild(d);
      }
      const nm = serif(cat.name, 24, P.linen, { bold: true });
      nm.position.set(92, 8);
      fitText(nm, 210);
      const pr = printRarity(cat.species);
      const line = ui(`Nv ${cat.level}`, 15, P.lilac);
      line.position.set(94, 47);
      const els = elIcons(def.elements, 20, 3);
      els.position.set(94 + line.width + 10, 57);
      const rc = ui(rarityName(pr), 12, pr === 'common' ? P.lilac : rarityColor(pr) === C.ink ? P.goldHi : rarityColor(pr));
      rc.position.set(els.x + els.width + 10, 50);
      r.addChild(nm, line, els, rc);
      if (busy || queued) {
        const tag = ui(busy ? 'RESONANDO' : 'EN COLA', 13, P.ink);
        const tb = new Graphics().roundRect(0, 0, tag.width + 14, 22, 4).fill(busy ? P.mint : P.goldHi);
        const tc = new Container();
        tc.addChild(tb, tag);
        tag.position.set(7, 2);
        tc.position.set(418 - tc.width - 10, 10);
        r.addChild(tc);
        r.alpha = 0.45;
      } else if (seat >= 0) {
        const med = new Graphics().circle(388, 42, 20).fill(P.gold).stroke({ width: 2, color: P.ink });
        const n = serif(seat === 0 ? 'I' : 'II', 20, P.ink, { bold: true });
        n.anchor.set(0.5);
        n.position.set(388, 41);
        r.addChild(med, n);
      }
      const locked = busy || queued;
      r.eventMode = 'static';
      r.cursor = locked ? 'not-allowed' : 'pointer';
      r.on('pointerover', () => !locked && gsap.to(r, { x: 6, duration: 0.12 }));
      r.on('pointerout', () => gsap.to(r, { x: 0, duration: 0.12 }));
      if (!locked) {
        r.on('pointerdown', (e: FederatedPointerEvent) => this.dragStart(cat.uid, e));
        r.on('globalpointermove', (e: FederatedPointerEvent) => this.dragMove(cat.uid, e));
        r.on('pointerup', (e: FederatedPointerEvent) => this.dragEnd(cat.uid, e));
        r.on('pointerupoutside', (e: FederatedPointerEvent) => this.dragEnd(cat.uid, e));
      }
      r.on('pointertap', () => {
        if (box.wasDrag || this.dragConsumed) {
          this.dragConsumed = false;
          return;
        }
        if (locked) {
          sfx('error');
          toast(busy ? `${cat.name} está ocupado resonando` : `${cat.name} está apartado en la Cola`, { color: P.lilac });
          return;
        }
        this.pick(cat.uid);
      });
      box.content.addChild(r);
    });
    box.setContentHeight(rows.length * 92);
  }

  // ------------------------------------------------------------ drag a cat onto a cushion
  private drag: { uid: string; sx: number; sy: number; ghost: Container | null } | null = null;
  private dragConsumed = false;
  private dragStart(uid: string, e: FederatedPointerEvent) {
    this.drag = { uid, sx: e.global.x, sy: e.global.y, ghost: null };
  }
  private dragMove(uid: string, e: FederatedPointerEvent) {
    const d = this.drag;
    if (!d || d.uid !== uid || this.modal.closed) return;
    const k = this.modal.body.worldTransform.a || 1;
    const dx = (e.global.x - d.sx) / k;
    const dy = (e.global.y - d.sy) / k;
    if (!d.ghost) {
      if (Math.abs(dx) < 18 || Math.abs(dx) < Math.abs(dy)) return;
      const c = getCat(uid);
      if (!c) return;
      const g = new Container();
      const halo = new Graphics().circle(0, 0, 74).fill({ color: P.goldHi, alpha: 0.25 }).stroke({ width: 3, color: P.goldHi });
      const p = portrait(c.species, 150, 'color');
      g.addChild(halo, p);
      this.modal.body.addChild(g);
      d.ghost = g;
      sfx('pop', 1.3);
      gsap.from(g.scale, { x: 0.4, y: 0.4, duration: 0.15, ease: 'back.out(2)' });
    }
    const lp = this.modal.body.toLocal(e.global);
    d.ghost.position.set(lp.x, lp.y);
    d.ghost.rotation = Math.max(-0.3, Math.min(0.3, dx * 0.0008));
    this.cushions.forEach((cu, i) => (cu.alpha = this.overCushion(e) === i ? 1 : 0.75));
  }
  private overCushion(e: FederatedPointerEvent) {
    for (let i = 0; i < this.cushions.length; i++) {
      const lp = this.cushions[i].toLocal(e.global);
      if (Math.abs(lp.x) < 150 && lp.y > -270 && lp.y < 80) return i;
    }
    return -1;
  }
  private dragEnd(uid: string, e: FederatedPointerEvent) {
    const d = this.drag;
    this.drag = null;
    if (!d || d.uid !== uid || !d.ghost) return;
    this.dragConsumed = true;
    window.setTimeout(() => (this.dragConsumed = false), 0);
    this.cushions.forEach((cu) => (cu.alpha = 1));
    const target = this.overCushion(e);
    destroyTree(d.ghost);
    if (target < 0 || this.modal.closed) {
      sfx('paper');
      return;
    }
    const other = this.sel.indexOf(uid);
    if (other >= 0) this.sel[other] = null;
    this.sel[target] = uid;
    sfx('pop', 1 + target * 0.2);
    this.refreshList();
    this.refreshCushions(true);
    this.refreshOdds();
  }

  private pick(uid: string) {
    const i = this.sel.indexOf(uid);
    if (i >= 0) {
      this.sel[i] = null;
      sfx('paper');
    } else {
      const slot = this.sel[0] === null ? 0 : this.sel[1] === null ? 1 : 1;
      this.sel[slot] = uid;
      sfx('pop', 1 + slot * 0.2);
    }
    this.refreshList();
    this.refreshCushions(true);
    this.refreshOdds();
  }

  // ------------------------------------------------------------ center: cushions + portal
  private buildCenter() {
    const b = this.modal.body;
    const X = CX;
    const h = serif('Los cojines', 34, P.goldHi, { italic: true, bold: true });
    h.anchor.set(0.5, 0);
    h.position.set(X + 360, -10);
    b.addChild(h);
    this.portal = new Portal();
    this.portal.position.set(X + 360, 250);
    b.addChild(this.portal);
    for (let i = 0; i < 2; i++) {
      const c = new Container();
      c.position.set(X + (i === 0 ? 120 : 600), 360);
      c.eventMode = 'static';
      c.cursor = 'pointer';
      c.on('pointertap', () => {
        if (this.sel[i]) {
          this.sel[i] = null;
          sfx('paper');
          this.refreshList();
          this.refreshCushions(true);
          this.refreshOdds();
        }
      });
      b.addChild(c);
      this.cushions.push(c);
    }
    // start button
    const btn = new Container();
    btn.position.set(X + 360 - 230, 510);
    const sh = new Graphics().roundRect(6, 8, 460, 92, 16).fill(P.ink);
    this.startBg = new Graphics();
    const label = poster('¡A RESONAR!', 52, P.ink);
    label.anchor.set(0.5);
    label.position.set(230, 44);
    this.startLabel = label;
    const face = new Container();
    face.addChild(this.startBg, label);
    btn.addChild(sh, face);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerover', () => gsap.to(face, { y: -3, duration: 0.1 }));
    btn.on('pointerout', () => gsap.to(face, { y: 0, duration: 0.1 }));
    btn.on('pointerdown', () => gsap.to(face, { y: 5, duration: 0.05 }));
    btn.on('pointerup', () => gsap.to(face, { y: 0, duration: 0.15, ease: 'back.out(3)' }));
    btn.on('pointertap', () => this.start());
    this.startBtn = btn;
    b.addChild(btn);
    this.infoLine = ui('', 16, P.lilac);
    this.infoLine.anchor.set(0.5, 0);
    this.infoLine.position.set(X + 360, 614);
    b.addChild(this.infoLine, this.tutBanner);
    this.mutBox.position.set(X, 646);
    b.addChild(this.mutBox);
    this.missingBox.position.set(X, 700);
    b.addChild(this.missingBox);
    this.historyBox.position.set(X + 380, 700);
    b.addChild(this.historyBox);
  }

  private drawStartBtn(enabled: boolean, queueMode: boolean) {
    this.startBg
      .clear()
      .roundRect(0, 0, 460, 92, 16)
      .fill(enabled ? (queueMode ? P.mint : P.goldHi) : P.orchid)
      .stroke({ width: 4, color: P.ink })
      .roundRect(8, 8, 444, 76, 10)
      .stroke({ width: 1.5, color: P.ink, alpha: 0.6 });
    this.startLabel.text = queueMode ? `¡A LA COLA! (${resonanceQueue().length}/${queueCap()})` : '¡A RESONAR!';
    this.startLabel.scale.set(1);
    fitText(this.startLabel, 420);
    this.startBtn.alpha = enabled ? 1 : 0.6;
    this.startBtn.cursor = enabled ? 'pointer' : 'not-allowed';
  }

  private refreshCushions(animate = false) {
    this.cushions.forEach((c, i) => {
      clearChildren(c);
      const uid = this.sel[i];
      const cat = uid ? getCat(uid) : undefined;
      const cushion = drawCushion(i === 0 ? P.orchid : 0x6f9f94);
      c.addChild(cushion);
      const med = new Graphics().circle(0, 52, 22).fill(P.gold).stroke({ width: 3, color: P.ink });
      const n = serif(i === 0 ? 'I' : 'II', 22, P.ink, { bold: true });
      n.anchor.set(0.5);
      n.position.set(0, 51);
      c.addChild(med, n);
      if (cat) {
        const v = variantSprite(cat.species, 250, { mutation: cat.mutation });
        v.root.position.set(0, -110);
        c.addChild(v.root);
        this.cushionCats[i] = v.root;
        if (animate) gsap.from(v.root, { y: -180, alpha: 0, duration: 0.35, ease: 'bounce.out' });
        const def = catDef(cat.species);
        const nm = serif(cat.name, 30, P.linen, { bold: true });
        nm.anchor.set(0.5, 0);
        nm.position.set(0, 82);
        const lv = ui(`Nv ${cat.level}`, 15, P.lilac);
        const els = elIcons(def.elements, 20, 3);
        const rn = ui(rarityName(printRarity(cat.species)), 15, P.lilac);
        const tw = lv.width + 12 + els.width + 12 + rn.width;
        lv.position.set(-tw / 2, 122);
        els.position.set(-tw / 2 + lv.width + 12, 132);
        rn.position.set(els.x + els.width + 12, 122);
        c.addChild(nm, lv, els, rn);
      } else {
        this.cushionCats[i] = null;
        const ghost = new Graphics().circle(0, -100, 70).stroke({ width: 3, color: P.lilac, alpha: 0.7 });
        const plus = serif('+', 80, P.lilac);
        plus.anchor.set(0.5);
        plus.position.set(0, -104);
        const t = serif('elige un gato', 24, P.lilac, { italic: true });
        t.anchor.set(0.5, 0);
        t.position.set(0, 86);
        c.addChild(ghost, plus, t);
      }
    });
    const both = !!(this.sel[0] && this.sel[1]);
    this.portal.charged = both;
    const slots = freeSlots();
    const queueMode = slots <= 0 && queueUnlocked();
    const qRoom = resonanceQueue().length < queueCap();
    this.drawStartBtn(both && (slots > 0 || (queueMode && qRoom)), queueMode);
    // info line
    let info = `RANURAS LIBRES ${Math.max(0, slots)}/${G.s.resonance.slots}`;
    if (both) {
      const t = oddsFor(this.sel[0]!, this.sel[1]!);
      const time = isTutorialResonance() ? fmtTime(TUTORIAL_RESONANCE_MS) : t.timeRange[0] === t.timeRange[1] ? fmtDuration(t.timeRange[0]) : `${fmtDuration(t.timeRange[0])} – ${fmtDuration(t.timeRange[1])}`;
      info = `TIEMPO ${time}   ·   ${info}`;
    }
    if (queueUnlocked()) info += `   ·   COLA ${resonanceQueue().length}/${queueCap()}`;
    this.infoLine.text = info;
    // tutorial banner
    clearChildren(this.tutBanner);
    if (isTutorialResonance()) {
      const t = ui('PRIMERA RESONANCIA · RESULTADO GARANTIZADO: RARO · 1:30', 16, P.ink);
      const g = new Graphics()
        .poly([-16, 0, t.width + 16, 0, t.width + 4, 14, t.width + 16, 28, -16, 28, -4, 14])
        .fill(P.mint)
        .stroke({ width: 2, color: P.ink });
      t.position.set(0, 4);
      this.tutBanner.addChild(g, t);
      this.tutBanner.position.set(CX + 360 - t.width / 2, 36);
    }
    this.drawMutation();
  }

  /** mutation odds strip (KL20) */
  private drawMutation() {
    const box = this.mutBox;
    clearChildren(box);
    const w = 720;
    const g = new Graphics().roundRect(0, 0, w, 44, 10).fill({ color: P.ink, alpha: 0.6 }).stroke({ width: 1.5, color: P.gold, alpha: 0.7 });
    box.addChild(g);
    const d = dnaIcon(26, C.pinkHot);
    d.position.set(24, 22);
    box.addChild(d);
    const unlockedAny = G.s.kl >= MUTATION_RULES.kl || G.has('luna_resonancia');
    // onboarding: don't show a locked concept before the first boss (GDD: ≤3 new concepts)
    box.visible = unlockedAny || G.s.campaign.bossesDefeated >= 1;
    if (!unlockedAny) {
      const t = ui(`MUTACIONES: se desbloquean en el Reino ${MUTATION_RULES.kl}. Tus gatos aún son… normales.`, 15, P.lilac, false);
      t.position.set(48, 12);
      box.addChild(t);
      box.alpha = 0.75;
      return;
    }
    box.alpha = 1;
    if (!this.sel[0] || !this.sel[1]) {
      const t = ui(`MUTACIÓN ${Math.round(MUTATION_RULES.chance * 100)}% por Resonancia · x${MUTATION_RULES.sameHabitatMult} si los padres viven en el mismo hábitat`, 15, P.linen, false);
      t.position.set(48, 12);
      fitText(t, w - 60);
      box.addChild(t);
      return;
    }
    const mo = mutationOdds(this.sel[0], this.sel[1]);
    const pct = poster(`${Math.round(mo.chance * 1000) / 10}%`, 30, C.pinkHot);
    pct.position.set(48, 4);
    box.addChild(pct);
    let x = 48 + pct.width + 12;
    const lab = ui(mo.sameHabitat ? 'MUTACIÓN (MISMO HÁBITAT x2)' : 'DE MUTACIÓN', 13, P.lilac);
    lab.position.set(x, 14);
    box.addChild(lab);
    x += lab.width + 14;
    const top = mo.table.slice(0, 2);
    top.forEach((row) => {
      const look = mutationLook(row.mut.id);
      const c = new Container();
      const nm = ui(`${mutationShort(row.mut.id)} ${Math.round(row.p * 100)}%`, 14, P.ink);
      const ic = look?.el ? elementIcon(look.el, 20) : dnaIcon(18, P.ink);
      const bg = new Graphics().roundRect(0, 0, nm.width + 38, 28, 14).fill(look?.color ?? P.mint).stroke({ width: 2, color: P.ink });
      ic.position.set(15, 14);
      nm.position.set(28, 5);
      c.addChild(bg, ic, nm);
      c.position.set(x, 8);
      box.addChild(c);
      x += c.width + 8;
    });
    if (x > w) box.children.slice(1).forEach(() => undefined);
  }

  // ------------------------------------------------------------ right: odds + jobs + queue
  private buildRight() {
    const b = this.modal.body;
    const h = serif('Tabla viva', 34, P.goldHi, { italic: true, bold: true });
    h.position.set(RX, -10);
    const c = ui('PROBABILIDADES EXACTAS · SIN LETRA CHIQUITA', 13, P.lilac);
    c.position.set(RX + h.width + 16, 8);
    b.addChild(h, c);
    this.oddsBox.position.set(RX, 46);
    b.addChild(this.oddsBox);
    const jh = serif('En curso', 30, P.goldHi, { italic: true, bold: true });
    jh.position.set(RX, 556);
    b.addChild(jh);
    this.purrChip.position.set(RX + 150, 564);
    this.slotChip.position.set(RX + RW, 560);
    b.addChild(this.purrChip, this.slotChip);
    this.jobsBox.position.set(RX, 604);
    b.addChild(this.jobsBox, this.queueBox);
  }

  private refreshOdds() {
    const box = this.oddsBox;
    clearChildren(box);
    const W2 = RW;
    const H2 = 496;
    const card = new Graphics()
      .roundRect(6, 6, W2, H2, 12)
      .fill(P.ink)
      .roundRect(0, 0, W2, H2, 12)
      .fill(P.linen)
      .stroke({ width: 3, color: P.gold })
      .roundRect(7, 7, W2 - 14, H2 - 14, 8)
      .stroke({ width: 1, color: P.gold, alpha: 0.8 });
    box.addChild(card);
    if (!this.sel[0] || !this.sel[1]) {
      const q = serif('?', 200, P.lilac, { italic: true, bold: true });
      q.anchor.set(0.5);
      q.position.set(W2 / 2, H2 / 2 - 40);
      const t = serif('Sienta a dos gatos en los cojines\ny el destino te enseñará sus cartas.', 26, P.plum, { italic: true });
      t.style.align = 'center';
      t.anchor.set(0.5);
      t.position.set(W2 / 2, H2 / 2 + 100);
      box.addChild(q, t);
      this.drawMissing(null);
      return;
    }
    const table = oddsFor(this.sel[0], this.sel[1]);
    const hy = 14;
    const hd = [
      ['RESULTADO', 60],
      ['RAREZA', W2 - 250],
      ['%', W2 - 24],
    ] as const;
    hd.forEach(([t, x], i) => {
      const tt = ui(t, 13, P.plum);
      if (i === 2) tt.anchor.set(1, 0);
      tt.position.set(x, hy);
      box.addChild(tt);
    });
    const newCount = table.rows.filter((r) => !r.species || G.s.catdex[r.species] !== 'registered').length;
    if (newCount) {
      const nc = ui(`${newCount} POSIBLE${newCount > 1 ? 'S' : ''} NUEVO${newCount > 1 ? 'S' : ''}`, 12, C.pinkHot);
      nc.position.set(170, hy + 1);
      box.addChild(nc);
    }
    box.addChild(new Graphics().rect(16, hy + 22, W2 - 32, 2).fill(P.plum));
    const rows = table.rows;
    const rowH = Math.min(60, Math.floor((H2 - 56) / Math.max(1, rows.length)));
    const maxPct = Math.max(...rows.map((r) => r.pct));
    rows.forEach((r, i) => {
      const y = hy + 28 + i * rowH;
      const rr = new Container();
      rr.y = y;
      const known = r.species ? !!G.s.catdex[r.species] : false;
      const registered = r.species ? G.s.catdex[r.species] === 'registered' : false;
      const pr = r.species ? printRarity(r.species) : 'mythic';
      const col = r.species ? (pr === 'common' ? 0x6d6356 : rarityColor(pr) === C.ink ? P.ink : rarityColor(pr)) : C.violet;
      const bw = ((W2 - 40) * r.pct) / maxPct;
      rr.addChild(new Graphics().rect(16, 2, bw, rowH - 4).fill({ color: col, alpha: 0.16 }));
      if (r.species) {
        const s = portrait(r.species, rowH * 1.1, registered ? 'color' : 'sil');
        s.position.set(18 + rowH * 0.5, rowH / 2 + 1);
        const nx = 26 + rowH;
        rr.addChild(s);
        const nm = ui(known ? catDef(r.species).name : '???', Math.min(22, rowH * 0.48), P.ink);
        nm.position.set(nx, rowH / 2 - nm.height / 2);
        rr.addChild(nm);
        let ex = nx + nm.width + 8;
        if (!known) {
          const els = elIcons(catDef(r.species).elements, Math.min(20, rowH * 0.42), 2);
          els.position.set(ex, rowH / 2);
          rr.addChild(els);
          ex += els.width + 8;
        }
        if (!registered) {
          const nb = newStamp(Math.min(13, rowH * 0.3));
          nb.position.set(ex + 2, rowH / 2 - nb.height / 2);
          rr.addChild(nb);
        }
        const rc = ui(rarityName(pr), Math.min(13, rowH * 0.36), C.white);
        const rb = new Graphics().roundRect(0, 0, rc.width + 12, rc.height + 4, 3).fill(col);
        const chip = new Container();
        chip.addChild(rb, rc);
        rc.position.set(6, 2);
        chip.position.set(W2 - 250, rowH / 2 - chip.height / 2);
        rr.addChild(chip);
      } else {
        const g = new GlitchText('???', { fontFamily: F.glitch, fontSize: Math.min(26, rowH * 0.55), fill: P.ink }, 2);
        g.position.set(18 + rowH * 0.5, rowH / 2);
        const t = serif('secreto o sin registrar', Math.min(17, rowH * 0.45), P.plum, { italic: true });
        t.position.set(26 + rowH, rowH / 2 - t.height / 2);
        const rc = ui('???', Math.min(13, rowH * 0.36), C.white);
        const rb = new Graphics().roundRect(0, 0, rc.width + 12, rc.height + 4, 3).fill(C.violet);
        const chip = new Container();
        chip.addChild(rb, rc);
        rc.position.set(6, 2);
        chip.position.set(W2 - 250, rowH / 2 - chip.height / 2);
        rr.addChild(g, t, chip);
      }
      const pct = poster(`${r.pct.toFixed(2)}%`, Math.min(30, rowH * 0.6), P.ink);
      pct.anchor.set(1, 0.5);
      pct.position.set(W2 - 22, rowH / 2);
      rr.addChild(pct);
      if (i < rows.length - 1) rr.addChild(new Graphics().rect(16, rowH - 1, W2 - 32, 1).fill({ color: P.plum, alpha: 0.25 }));
      box.addChild(rr);
      gsap.from(rr, { alpha: 0, x: 20, duration: 0.2, delay: i * 0.025 });
    });
    this.drawMissing(table);
  }

  private drawMissing(table: OddsTable | null) {
    const box = this.missingBox;
    clearChildren(box);
    const w = 366;
    const h = IH - 700;
    box.addChild(new Graphics().roundRect(0, 0, w, h, 12).fill({ color: P.ink, alpha: 0.6 }).stroke({ width: 2, color: P.gold, alpha: 0.8 }));
    const t = serif('Condiciones que faltan', 22, P.goldHi, { italic: true, bold: true });
    t.position.set(16, 6);
    box.addChild(t);
    if (!table) {
      const s = ui('Primero elige a los padres.', 15, P.lilac, false);
      s.position.set(18, 46);
      box.addChild(s);
      return;
    }
    const list = table.missing.map((m) => missingDetail(m, this.sel[0]!, this.sel[1]!));
    if (!list.length) {
      const s = serif('Nada te falta. Que decida el destino.', 19, P.mint, { italic: true });
      s.position.set(18, 48);
      fitText(s, w - 30);
      box.addChild(s);
      return;
    }
    let y = 44;
    let shown = 0;
    for (const m of list) {
      const l = txt(m, { fontFamily: F.ui, fontSize: 13, fill: P.linen, wordWrap: true, wordWrapWidth: w - 50, lineHeight: 16 });
      if (y + l.height > h - 8) {
        l.destroy();
        break;
      }
      const x = new Graphics().circle(24, y + 8, 6).fill(C.red);
      l.position.set(38, y);
      box.addChild(x, l);
      y += l.height + 6;
      shown++;
    }
    if (list.length > shown) {
      const more = ui(`+${list.length - shown}`, 13, P.lilac);
      more.position.set(w - 40, 12);
      box.addChild(more);
    }
  }

  /** ÚLTIMOS CRUCES + REPETIR */
  private drawHistory() {
    const box = this.historyBox;
    clearChildren(box);
    const w = 340;
    const h = IH - 700;
    box.addChild(new Graphics().roundRect(0, 0, w, h, 12).fill({ color: P.ink, alpha: 0.6 }).stroke({ width: 2, color: P.gold, alpha: 0.8 }));
    const t = serif('Últimos cruces', 22, P.goldHi, { italic: true, bold: true });
    t.position.set(16, 6);
    box.addChild(t);
    const hist = (collState().history ?? []).filter((x) => getCat(x.a) && getCat(x.b)).slice(0, 3);
    if (!hist.length) {
      const s = ui('Aquí quedan tus parejas para repetirlas con un toque.', 14, P.lilac, false);
      s.style.wordWrap = true;
      s.style.wordWrapWidth = w - 30;
      s.position.set(18, 46);
      box.addChild(s);
      return;
    }
    const busy = busyCats();
    const queued = queuedCats();
    hist.forEach((x, i) => {
      const y = 42 + i * 52;
      const row = new Container();
      row.position.set(12, y);
      const a = getCat(x.a)!;
      const b = getCat(x.b)!;
      for (const [k, c] of [a, b].entries()) {
        const ring = new Graphics().circle(20 + k * 30, 22, 19).fill(P.linen).stroke({ width: 2, color: P.gold });
        const m = new Graphics().circle(20 + k * 30, 22, 17).fill(0xffffff);
        const p = portrait(c.species, 44, 'color');
        p.position.set(20 + k * 30, 25);
        p.mask = m;
        row.addChild(ring, p, m);
      }
      const ar = ui('→', 16, P.lilac);
      ar.position.set(78, 12);
      const rs = new Graphics().circle(112, 22, 19).fill(P.linen).stroke({ width: 2, color: RARITY[printRarity(x.result)].color === C.ink ? P.goldHi : RARITY[printRarity(x.result)].color });
      const rm = new Graphics().circle(112, 22, 17).fill(0xffffff);
      const rp = portrait(x.result, 44, 'color');
      rp.position.set(112, 25);
      rp.mask = rm;
      row.addChild(ar, rs, rp, rm);
      const free = !busy.has(x.a) && !busy.has(x.b) && !queued.has(x.a) && !queued.has(x.b);
      const btn = smallBtn(free ? 'REPETIR' : 'OCUPADOS', free ? P.goldHi : P.orchid, () => this.repeat(x.a, x.b), 150, 40);
      btn.position.set(w - 24 - 150, 2);
      if (!free) btn.alpha = 0.55;
      row.addChild(btn);
      box.addChild(row);
    });
  }

  private repeat(a: string, b: string) {
    const r = repeatCross(a, b);
    if (r.r === 'started' && r.job) {
      checkMissions();
      sfx('whoosh');
      sfx('charge');
      this.portal.burst();
      const A = getCat(a)!;
      const B = getCat(b)!;
      const t = G.timer(r.job.timerId);
      this.caption(startCopy(A.name, B.name, fmtDuration(t?.totalMs ?? 0)));
      this.popTotal();
      this.refreshAll();
      return true;
    }
    if (r.r === 'queued') {
      checkMissions();
      sfx('pop', 1.4);
      toast('Pareja en la Cola', { sub: `Arranca sola cuando se libere una ranura (${resonanceQueue().length}/${queueCap()}).`, color: P.mint });
      this.refreshAll();
      return true;
    }
    sfx('error');
    toast('No se puede repetir', { sub: repeatExplain(r.r), color: P.lilac });
    return false;
  }

  refreshJobs() {
    const box = this.jobsBox;
    clearChildren(box);
    this.jobRows = [];
    clearChildren(this.purrChip);
    const pc = ui(`RONRONEO EN RESERVA: ${Math.floor(G.s.purr)} MIN`, 13, P.ink);
    const pb = new Graphics().roundRect(0, 0, pc.width + 16, 24, 12).fill(P.mint).stroke({ width: 2, color: P.ink });
    pc.position.set(8, 4);
    this.purrChip.addChild(pb, pc);
    // gem slot (balance.gems.sinks.resonance_slot)
    clearChildren(this.slotChip);
    const gs = gemSlotInfo();
    if (gs.left > 0 && G.s.resonance.total > 0 && (G.s.campaign.bossesDefeated >= 1 || G.s.gems >= gs.cost / 2)) {
      const c = new Container();
      const t = ui(`+1 RANURA · ${gs.cost}`, 14, P.ink);
      const gi = icon('gem', 20);
      const w = t.width + 50;
      const g = new Graphics().roundRect(0, 0, w, 32, 8).fill(P.goldHi).stroke({ width: 2, color: P.ink });
      t.position.set(10, 7);
      gi.position.set(t.width + 30, 16);
      c.addChild(g, t, gi);
      c.position.set(-w, 0);
      c.eventMode = 'static';
      c.cursor = 'pointer';
      c.on('pointertap', () => {
        if (buyGemSlot()) {
          sfx('gem');
          sfx('fanfare');
          toast('¡Ranura nueva!', { sub: 'Ahora tus gatos pueden resonar de dos en dos… en paralelo.', color: P.goldHi });
          checkMissions();
          this.refreshAll();
        } else {
          sfx('error');
          toast('Te faltan Ojos de Gato', { sub: `La ranura cuesta ${gs.cost}.`, color: P.lilac });
        }
      });
      this.slotChip.addChild(c);
    }
    const W2 = RW;
    const jobs = G.s.resonance.jobs;
    const slots = Math.max(G.s.resonance.slots, jobs.length);
    const qOn = queueUnlocked();
    const avail = IH - 604 - (qOn ? 96 : 0);
    const rh = Math.max(46, Math.min(80, Math.floor(avail / Math.max(1, slots)) - 6));
    for (let i = 0; i < slots; i++) {
      const job = jobs[i];
      const row = new Container();
      row.y = i * (rh + 6);
      box.addChild(row);
      if (!job) {
        const g = new Graphics().roundRect(0, 0, W2, rh, 10).stroke({ width: 2, color: P.lilac, alpha: 0.6 });
        const t = serif('Ranura libre — los cojines esperan', 20, P.lilac, { italic: true });
        t.position.set(20, rh / 2 - t.height / 2);
        row.addChild(g, t);
        continue;
      }
      const g = new Graphics().roundRect(0, 0, W2, rh, 10).fill({ color: P.ink, alpha: 0.8 }).stroke({ width: 2, color: job.ready ? P.goldHi : P.gold });
      row.addChild(g);
      const cx = rh / 2 + 6;
      const cy = rh / 2;
      const dot = new Graphics();
      const ring = new Graphics();
      row.addChild(dot, ring);
      const [an, bn] = parentNames(job);
      const nm = serif(`${an} + ${bn}`, Math.min(22, rh * 0.32), P.linen, { bold: true });
      nm.position.set(rh + 16, 6);
      fitText(nm, W2 - rh - 220);
      const label = ui('', Math.min(15, rh * 0.22), P.mint);
      label.position.set(rh + 18, rh - Math.min(15, rh * 0.22) - 12);
      row.addChild(nm, label);
      let btn: Container | undefined;
      if (job.ready) {
        btn = smallBtn('¡REVELAR!', P.goldHi, () => this.doReveal(job.id), 180, rh - 20);
        gsap.to(btn.scale, { x: 1.06, y: 1.06, yoyo: true, repeat: -1, duration: 0.45, ease: 'sine.inOut' });
        btn.pivot.set(90, (rh - 20) / 2);
        btn.position.set(W2 - 100, rh / 2);
      } else {
        btn = smallBtn('RONRONEAR', P.mint, () => this.purrOn(job), 180, rh - 20);
        btn.position.set(W2 - 190, 10);
        if (G.s.purr <= 0.01) btn.alpha = 0.45;
      }
      row.addChild(btn);
      this.jobRows.push({ job, ring, label, dot, btn, rh });
      this.drawJob(this.jobRows[this.jobRows.length - 1], cx, cy, rh);
    }
    this.lastJobCount = jobs.length;
    this.drawQueue(slots * (rh + 6));
  }

  /** KL18: queued pairs (each chip removable) */
  private drawQueue(yTop: number) {
    const box = this.queueBox;
    clearChildren(box);
    box.position.set(RX, 604 + yTop + 4);
    const W2 = RW;
    if (!queueUnlocked()) {
      if (G.s.resonance.total > 0 && G.s.campaign.bossesDefeated >= 1) {
        const t = ui(`COLA DE RESONANCIA · se desbloquea en el Reino ${queueKl()}`, 13, P.lilac);
        t.position.set(4, 6);
        t.alpha = 0.7;
        box.addChild(t);
      }
      return;
    }
    const q = resonanceQueue();
    const cap = queueCap();
    const g = new Graphics().roundRect(0, 0, W2, 84, 10).fill({ color: P.ink, alpha: 0.5 }).stroke({ width: 1.5, color: P.gold, alpha: 0.7 });
    const t = ui(`COLA ${q.length}/${cap}`, 13, P.goldHi);
    t.position.set(12, 6);
    const hint = ui(q.length ? 'arrancan solas cuando se libera una ranura' : 'sin ranura libre, el botón de los cojines deja la pareja aquí', 12, P.lilac, false);
    hint.position.set(t.width + 24, 7);
    box.addChild(g, t, hint);
    const cw = Math.min(150, (W2 - 20 - (cap - 1) * 8) / cap);
    for (let i = 0; i < cap; i++) {
      const x = 10 + i * (cw + 8);
      const c = new Container();
      c.position.set(x, 30);
      const p = q[i];
      if (!p) {
        c.addChild(new Graphics().roundRect(0, 0, cw, 46, 8).stroke({ width: 1.5, color: P.lilac, alpha: 0.5 }));
        box.addChild(c);
        continue;
      }
      c.addChild(new Graphics().roundRect(0, 0, cw, 46, 8).fill(P.plum).stroke({ width: 2, color: P.goldHi }));
      [p.a, p.b].forEach((uid, k) => {
        const cat = getCat(uid);
        if (!cat) return;
        const ring = new Graphics().circle(24 + k * 30, 23, 18).fill(P.linen).stroke({ width: 2, color: P.gold });
        const m = new Graphics().circle(24 + k * 30, 23, 16).fill(0xffffff);
        const pt = portrait(cat.species, 42, 'color');
        pt.position.set(24 + k * 30, 26);
        pt.mask = m;
        c.addChild(ring, pt, m);
      });
      const n = serif(String(i + 1), 18, P.goldHi, { bold: true });
      n.position.set(84, 12);
      const x2 = new Container();
      const xb = new Graphics().circle(0, 0, 11).fill(C.red).stroke({ width: 2, color: P.ink });
      xb.moveTo(-4, -4).lineTo(4, 4).moveTo(4, -4).lineTo(-4, 4).stroke({ width: 2.5, color: P.linen, cap: 'round' });
      x2.addChild(xb);
      x2.position.set(cw - 14, 14);
      x2.eventMode = 'static';
      x2.cursor = 'pointer';
      x2.on('pointertap', () => {
        dequeuePair(i);
        sfx('paper');
        this.refreshAll();
      });
      c.addChild(n, x2);
      box.addChild(c);
    }
  }

  private drawJob(r: { job: ResonanceJob; ring: Graphics; label: Text; dot: Graphics }, cx: number, cy: number, rh: number) {
    const jv = jobView(r.job);
    const R = rh / 2 - 10;
    const col = jv.phase === 'resonando' ? P.lilac : RARITY[printRarity(r.job.result)].color === C.ink ? C.pinkHot : RARITY[printRarity(r.job.result)].color;
    r.dot
      .clear()
      .circle(cx, cy, R - 6)
      .fill({ color: col, alpha: jv.phase === 'resonando' ? 0.35 : 0.9 })
      .circle(cx, cy, R)
      .stroke({ width: 6, color: 0x1d3a2b });
    r.ring.clear();
    if (jv.p > 0.001) r.ring.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * jv.p).stroke({ width: 6, color: C.green, cap: 'round' });
    const a = -Math.PI / 2 + Math.PI * 2 * (1 - BAL.resonance.hatch_share_of_time);
    r.ring.moveTo(cx + Math.cos(a) * (R - 5), cy + Math.sin(a) * (R - 5)).lineTo(cx + Math.cos(a) * (R + 5), cy + Math.sin(a) * (R + 5)).stroke({ width: 2, color: P.goldHi });
    r.label.text = jv.phase === 'listo' ? '¡LISTO! ALGO SE MUEVE AHÍ DENTRO…' : `${jv.phase === 'resonando' ? 'RESONANDO' : 'ECLOSIONANDO'} · ${Math.floor(jv.p * 100)}% · ${fmtTime(jv.leftMs)}`;
    r.label.style.fill = jv.phase === 'listo' ? P.goldHi : jv.phase === 'eclosionando' ? col : P.mint;
  }

  private purrOn(job: ResonanceJob) {
    const t = G.timer(job.timerId);
    if (!t) return;
    if (G.s.purr <= 0.01) {
      sfx('error');
      toast('Sin Ronroneo en reserva', { sub: 'Juega (batallas, misiones, gatos nuevos) y se acumula solo.', color: P.mint });
      return;
    }
    const used = G.spendPurrOn(t);
    sfx('purr');
    const row = this.jobRows.find((r) => r.job === job);
    if (row?.btn) {
      const gp = row.btn.getGlobalPosition();
      const lp = scenes.fxLayer.toLocal(gp);
      floatText(scenes.fxLayer, lp.x + 90, lp.y, `-${fmtDuration(used * 60000)}`, { color: P.mint, size: 40 });
      sparkles(scenes.fxLayer, lp.x + 90, lp.y + 20, P.mint, 10, 90);
    }
    this.refreshJobs();
  }

  private async doReveal(jobId: string) {
    if (this.revealing) return;
    this.revealing = true;
    const before = { dex: dexCount(), gems: G.s.gems, purr: G.s.purr, pity: G.s.resonance.pity };
    const job = G.s.resonance.jobs.find((j) => j.id === jobId);
    const r = await revealJob(jobId, true);
    this.revealing = false;
    if (this.modal.closed) return;
    this.refreshAll();
    if (!r) return;
    if (r.mutChoice) await this.mutationChoice(r.mutChoice);
    this.celebrate(r, before);
    if (r.res === 'repeat') {
      this.repeat(r.a, r.b);
    } else if (r.res === 'catdex' && job) {
      this.modal.close();
      const { openCatdex } = await import('./Catdex');
      await openCatdex(job.result);
    }
  }

  /** non-blocking reward flyouts after a reveal: catdex bar, gems, xp, orbs, streak */
  private celebrate(r: RevealDone, before: { dex: number; gems: number; purr: number; pity: number }) {
    if (this.modal.closed) return;
    const panel = this.modal.panel;
    const strip = this.headStrip;
    const from = { x: CX + 28 + 360, y: 108 + 250 };
    const flyChip = (text: string, color: number, to: { x: number; y: number }, delay: number, node?: Container) => {
      const c = new Container();
      const t = ui(text, 18, P.ink);
      const w = t.width + (node ? 48 : 22);
      c.addChild(new Graphics().roundRect(0, 0, w, 32, 16).fill(color).stroke({ width: 2.5, color: P.ink }));
      if (node) {
        node.position.set(18, 16);
        c.addChild(node);
      }
      t.position.set(node ? 36 : 11, 6);
      c.addChild(t);
      c.pivot.set(w / 2, 16);
      c.position.set(from.x, from.y);
      c.alpha = 0;
      panel.addChild(c);
      gsap
        .timeline({ delay })
        .to(c, { alpha: 1, y: from.y - 80, duration: 0.25, ease: 'back.out(2)' })
        .to(c, { x: to.x, y: to.y, duration: 0.55, ease: 'power2.in' }, '+=0.35')
        .to(c.scale, { x: 0.4, y: 0.4, duration: 0.55, ease: 'power2.in' }, '<')
        .call(() => {
          if (c.destroyed) return;
          killTree(c);
          c.destroy({ children: true });
          sfx('coin', 1.3 + delay);
        });
    };
    const sp = (k: number) => ({ x: strip.x + k, y: strip.y + 30 });
    let d = 0.1;
    // resonance counter
    this.hsRes.text = String(G.s.resonance.total);
    if (r.isNew) {
      const gems = G.s.gems - before.gems;
      flyChip(`¡NUEVO EN EL CATDEX! ${dexCount()}/${dexTotal()}`, P.goldHi, sp(162 + 125), d);
      d += 0.18;
      if (gems > 0) flyChip(`+${gems} OJO${gems > 1 ? 'S' : ''} DE GATO`, P.mint, { x: MW - 160, y: 40 }, d, icon('gem', 22));
      d += 0.18;
      gsap.delayedCall(0.95, () => {
        if (this.modal.closed) return;
        const k = { n: before.dex };
        gsap.to(k, {
          n: dexCount(),
          duration: 0.5,
          onUpdate: () => {
            if (this.hsDexBar.destroyed) return;
            this.drawDexBar(k.n);
            this.hsDex.text = `${Math.round(k.n)}/${dexTotal()}`;
          },
        });
        gsap.fromTo(this.hsDex.scale, { x: 1.4, y: 1.4 }, { x: 1, y: 1, duration: 0.35, ease: 'back.out(3)' });
        sparkles(panel, strip.x + 162 + 125, strip.y + 30, P.goldHi, 12, 90);
      });
    } else if (!r.mutChoice) {
      flyChip(`+${r.orbs} ORBES DE ${catDef(r.species).name.toUpperCase()}`, C.violet, { x: from.x, y: from.y + 300 }, d);
      d += 0.18;
    }
    flyChip('+XP DE REINO', P.lilac, { x: 140, y: 20 }, d, icon('crown', 22));
    d += 0.18;
    // streak
    if (G.s.resonance.pity !== before.pity) {
      gsap.delayedCall(1.1, () => {
        if (this.modal.closed) return;
        this.drawPity();
        if (G.s.resonance.pity === 0 && before.pity > 0) {
          floatText(panel, strip.x + 162 + 262 + 120, strip.y + 70, '¡RACHA ROTA!', { color: C.pinkHot, size: 30 });
        }
      });
    }
    const def = CONTENT.catdexSets.filter((s) => s.cats.includes(r.species));
    if (r.isNew && def.length) {
      const set = def[0];
      const have = set.cats.filter((id) => G.s.catdex[id] === 'registered').length;
      if (have < set.cats.length)
        gsap.delayedCall(1.4, () => {
          if (this.modal.closed) return;
          toast(`Set «${set.name}» ${have}/${set.cats.length}`, { sub: `Complétalo: +${BAL.orbs.prisma_from_catdex_set} Prisma y una regla nueva.`, color: P.goldHi, dur: 2.6 });
        });
    }
    void discoveryGems;
  }

  /** duplicate WITH mutation: keep the orbs or transfer the mutation (GDD 2.6 rule 8) */
  private mutationChoice(id: string): Promise<void> {
    return new Promise((resolve) => {
      const mc = collState().mutChoices.find((m) => m.id === id);
      if (!mc || this.modal.closed) return resolve();
      const owned = G.s.cats.filter((c) => c.species === mc.species).sort((a, b) => b.stars - a.stars || b.level - a.level)[0];
      const def = catDef(mc.species);
      const mut = mutationDef(mc.mutation);
      const look = mutationLook(mc.mutation);
      const ov = new Container();
      const dimG = new Graphics().rect(-28, -108, MW, MH).fill({ color: P.ink, alpha: 0.82 });
      dimG.eventMode = 'static';
      ov.addChild(dimG);
      const title = serif('¿Orbes o mutación?', 60, P.goldHi, { italic: true, bold: true });
      title.anchor.set(0.5, 0);
      title.position.set(IW / 2, 10);
      const sub = ui(`Te salió otro ${def.name}… con la mutación ${mutationShort(mc.mutation)}. Solo puedes quedarte con una cosa.`, 18, P.lilac);
      sub.anchor.set(0.5, 0);
      sub.position.set(IW / 2, 96);
      ov.addChild(title, sub);
      const choose = (choice: 'orbs' | 'transfer') => {
        const res = resolveMutationChoice(id, choice);
        sfx(choice === 'transfer' ? 'fanfare' : 'gem');
        checkMissions();
        toast(choice === 'transfer' ? `¡${owned?.name ?? def.name} ahora es ${mutationShort(mc.mutation)}!` : `+${res?.orbs ?? mc.orbs} orbes de ${def.name}`, {
          sub: choice === 'transfer' ? mut?.effect : 'Al Altar con ellos.',
          color: choice === 'transfer' ? look?.color ?? C.pinkHot : C.violet,
          dur: 2.8,
        });
        killTree(ov);
        gsap.to(ov, {
          alpha: 0,
          duration: 0.2,
          onComplete: () => {
            ov.destroy({ children: true });
            this.refreshAll();
            resolve();
          },
        });
      };
      const card = (x: number, kind: 'orbs' | 'transfer') => {
        const c = new Container();
        c.position.set(x, 150);
        const w = 640;
        const h = 640;
        const col = kind === 'orbs' ? C.violet : look?.color ?? C.pinkHot;
        c.addChild(new Graphics().roundRect(10, 10, w, h, 16).fill(0x000000).roundRect(0, 0, w, h, 16).fill(P.linen).stroke({ width: 4, color: P.gold }));
        c.addChild(new Graphics().roundRect(0, 0, w, 90, 16).fill(col));
        const hd = poster(kind === 'orbs' ? 'QUÉDATE LOS ORBES' : 'TRANSFIERE LA MUTACIÓN', 46, C.paper, { stroke: { color: P.ink, width: 6 } });
        hd.anchor.set(0.5, 0);
        hd.position.set(w / 2, 14);
        fitText(hd, w - 40);
        c.addChild(hd);
        if (kind === 'orbs') {
          for (let i = 0; i < 9; i++) {
            const o = new Graphics().circle(0, 0, 26).fill(C.violet).stroke({ width: 4, color: P.ink }).circle(-8, -8, 7).fill(0xffffff);
            o.position.set(w / 2 + Math.cos(i * 0.7) * (60 + i * 14), 300 + Math.sin(i * 0.7) * (40 + i * 8));
            c.addChild(o);
            gsap.to(o, { y: o.y - 10, yoyo: true, repeat: -1, duration: 0.6 + i * 0.05, ease: 'sine.inOut' });
          }
          const big = poster(`+${mc.orbs}`, 120, C.violet, { stroke: { color: P.ink, width: 10 } });
          big.anchor.set(0.5);
          big.position.set(w / 2, 300);
          c.addChild(big);
          const tx = txt(`orbes de ${def.name}. Te acercan a la siguiente estrella en el Altar.`, { fontFamily: F.ui, fontWeight: '700', fontSize: 20, fill: P.ink, wordWrap: true, wordWrapWidth: w - 80, align: 'center' });
          tx.anchor.set(0.5, 0);
          tx.position.set(w / 2, 470);
          c.addChild(tx);
        } else {
          const v = variantSprite(mc.species, 330, { mutation: mc.mutation }).root;
          v.position.set(w / 2, 290);
          c.addChild(v);
          const tx = txt(`${owned?.name ?? def.name} gana ${mut?.name ?? mc.mutation}: ${mut?.effect ?? ''}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 19, fill: P.ink, wordWrap: true, wordWrapWidth: w - 70, align: 'center' });
          tx.anchor.set(0.5, 0);
          tx.position.set(w / 2, 470);
          c.addChild(tx);
          if (owned?.mutation) {
            const warn = ui(`Reemplaza su mutación actual: ${mutationShort(owned.mutation)}`, 15, C.red);
            warn.anchor.set(0.5, 0);
            warn.position.set(w / 2, 470 + tx.height + 8);
            c.addChild(warn);
          }
        }
        const b = smallBtn(kind === 'orbs' ? 'ORBES' : 'MUTACIÓN', kind === 'orbs' ? P.lilac : P.goldHi, () => choose(kind), 300, 64);
        b.position.set(w / 2 - 150, h - 90);
        c.addChild(b);
        ov.addChild(c);
        gsap.from(c, { y: 260, alpha: 0, duration: 0.3, ease: 'back.out(1.6)', delay: kind === 'orbs' ? 0 : 0.08 });
      };
      card(IW / 2 - 680, 'orbs');
      card(IW / 2 + 40, 'transfer');
      const or = serif('o', 70, P.goldHi, { italic: true, bold: true });
      or.anchor.set(0.5);
      or.position.set(IW / 2, 470);
      ov.addChild(or);
      this.modal.body.addChild(ov);
      sfx('sting');
    });
  }

  private start() {
    if (this.busyStart) return;
    const [a, b] = this.sel;
    if (!a || !b) {
      sfx('error');
      toast('Faltan padres', { sub: 'Sienta un gato en cada cojín.', color: P.lilac });
      return;
    }
    if (freeSlots() <= 0) {
      if (queueUnlocked()) {
        if (enqueuePair(a, b)) {
          checkMissions();
          sfx('pop', 1.4);
          toast('¡A la Cola!', { sub: `${getCat(a)?.name} y ${getCat(b)?.name} esperan turno (${resonanceQueue().length}/${queueCap()}).`, color: P.mint });
          this.sel = [null, null];
          this.refreshAll();
        } else {
          sfx('error');
          toast('La Cola está llena', { sub: '3 parejas por ranura. Revela algo y se mueve.', color: P.lilac });
        }
        return;
      }
      sfx('error');
      toast('No hay ranuras libres', { sub: `Revela o espera. La Cola de Resonancia llega en el Reino ${queueKl()}.`, color: P.lilac });
      return;
    }
    const busy = busyCats();
    if (busy.has(a) || busy.has(b)) return;
    const A = getCat(a)!;
    const B = getCat(b)!;
    const job = startResonance(a, b);
    if (!job) {
      sfx('error');
      return;
    }
    checkMissions();
    this.busyStart = true;
    const t = G.timer(job.timerId);
    const copy = startCopy(A.name, B.name, fmtDuration(t?.totalMs ?? 0));
    sfx('whoosh');
    sfx('charge');
    const pp = this.portal.position;
    this.cushionCats.forEach((c, i) => {
      if (!c) return;
      gsap.to(c, { x: pp.x - this.cushions[i].x, y: pp.y - this.cushions[i].y, duration: 0.55, ease: 'power2.in' });
      gsap.to(c.scale, { x: 0.05, y: 0.05, duration: 0.55, ease: 'power2.in' });
      gsap.to(c, { rotation: (i ? -1 : 1) * 6, duration: 0.55, ease: 'power2.in' });
    });
    gsap.delayedCall(0.55, () => {
      this.busyStart = false;
      if (this.modal.closed) return;
      sfx('reveal');
      this.portal.burst();
      const gp = this.portal.getGlobalPosition();
      const lp = scenes.fxLayer.toLocal(gp);
      speedLines(scenes.fxLayer, lp.x, lp.y, P.goldHi, 40, 0.4);
      sparkles(scenes.fxLayer, lp.x, lp.y, P.goldHi, 18, 220);
      this.sel = [null, null];
      this.popTotal();
      this.refreshAll();
      this.caption(copy);
    });
  }

  /** the resonance counter ticks up (feels like progress) */
  private popTotal() {
    if (!this.hsRes || this.hsRes.destroyed) return;
    this.hsRes.text = String(G.s.resonance.total);
    gsap.fromTo(this.hsRes.scale, { x: 1.5, y: 1.5 }, { x: 1, y: 1, duration: 0.4, ease: 'back.out(3)' });
    const gp = this.hsRes.getGlobalPosition();
    const lp = scenes.fxLayer.toLocal(gp);
    floatText(scenes.fxLayer, lp.x + 40, lp.y + 10, '+1', { color: P.goldHi, size: 30 });
    this.drawPity();
  }

  private caption(text: string) {
    const c = new Container();
    const t = serif(text, 26, P.ink, { italic: true, bold: true });
    t.style.wordWrap = true;
    t.style.wordWrapWidth = 620;
    t.style.align = 'center';
    t.anchor.set(0.5);
    const g = new Graphics()
      .roundRect(-t.width / 2 - 24, -t.height / 2 - 14, t.width + 48, t.height + 28, 8)
      .fill(P.linen)
      .stroke({ width: 3, color: P.gold })
      .roundRect(-t.width / 2 - 18, -t.height / 2 - 8, t.width + 36, t.height + 16, 5)
      .stroke({ width: 1, color: P.gold });
    c.addChild(g, t);
    c.position.set(CX + 360, 120);
    this.modal.body.addChild(c);
    gsap.from(c.scale, { x: 0.6, y: 0.6, duration: 0.3, ease: 'back.out(2)' });
    gsap.to(c, { alpha: 0, y: 100, delay: 4.2, duration: 0.4, onComplete: () => destroyTree(c) });
  }

  refreshAll() {
    if (this.modal.closed) return;
    const busy = busyCats();
    const queued = queuedCats();
    this.sel = this.sel.map((u) => (u && !busy.has(u) && !queued.has(u) && getCat(u) ? u : null)) as [string | null, string | null];
    this.refreshList();
    this.refreshCushions();
    this.refreshOdds();
    this.refreshJobs();
    this.drawHistory();
    if (this.hsRes && !this.hsRes.destroyed) {
      this.hsRes.text = String(G.s.resonance.total);
      this.hsDex.text = `${dexCount()}/${dexTotal()}`;
      this.drawDexBar(dexCount());
    }
  }

  private tick(t: Ticker) {
    if (this.modal.closed) return;
    this.portal.update(t.deltaMS / 1000);
    this.acc += t.deltaMS;
    if (this.acc < 250) return;
    this.acc = 0;
    // the queue may have started a job on its own
    if (!this.revealing && G.s.resonance.jobs.length !== this.lastJobCount) {
      this.refreshAll();
      return;
    }
    for (const r of this.jobRows) this.drawJob(r, r.rh / 2 + 6, r.rh / 2, r.rh);
    const hatching = G.s.resonance.jobs.map((j) => jobView(j)).find((v) => v.phase !== 'resonando');
    this.portal.tintTo(hatching ? RARITY[printRarity(hatching.job.result)].color : null);
  }
}

/** pink "¡NUEVO!" stamp for unregistered table rows */
function newStamp(size = 12) {
  const c = new Container();
  const t = txt('¡NUEVO!', { fontFamily: F.poster, fontSize: size, fill: C.paper, letterSpacing: 1 });
  const g = new Graphics().roundRect(0, 0, t.width + 10, t.height + 2, 3).fill(C.pinkHot).stroke({ width: 1.5, color: P.ink });
  t.position.set(5, 1);
  c.addChild(g, t);
  c.rotation = -0.06;
  return c;
}

// ---------------------------------------------------------------- pieces
function smallBtn(text: string, color: number, onTap: () => void, w = 180, h = 56) {
  const c = new Container();
  const sh = new Graphics().roundRect(4, 5, w, h, 10).fill(P.ink);
  const face = new Container();
  const g = new Graphics().roundRect(0, 0, w, h, 10).fill(color).stroke({ width: 3, color: P.ink });
  const t = poster(text, Math.min(30, h * 0.55), P.ink);
  t.anchor.set(0.5);
  t.position.set(w / 2, h / 2);
  fitText(t, w - 16);
  face.addChild(g, t);
  c.addChild(sh, face);
  c.eventMode = 'static';
  c.cursor = 'pointer';
  c.on('pointerover', () => gsap.to(face, { y: -2, duration: 0.1 }));
  c.on('pointerout', () => gsap.to(face, { y: 0, duration: 0.1 }));
  c.on('pointertap', () => {
    sfx('click');
    onTap();
  });
  return c;
}

/** velvet cushion with gold piping, tufts and tassels; centered at (0,0) top surface ~ y=-10 */
function drawCushion(velvet: number) {
  const g = new Graphics();
  const w = 250;
  const h = 96;
  g.ellipse(0, 38, w * 0.56, 22).fill({ color: 0x000000, alpha: 0.35 });
  g.roundRect(-w / 2, -h / 2, w, h, 44).fill(velvet).stroke({ width: 5, color: P.gold });
  g.roundRect(-w / 2 + 14, -h / 2 + 10, w - 28, h * 0.42, 30).fill({ color: 0xffffff, alpha: 0.14 });
  for (const x of [-60, 0, 60]) {
    g.circle(x, 4, 6).fill({ color: 0x000000, alpha: 0.28 });
    g.circle(x, 3, 3).fill(P.goldHi);
  }
  for (const [x, y] of [
    [-w / 2 + 10, -h / 2 + 14],
    [w / 2 - 10, -h / 2 + 14],
    [-w / 2 + 10, h / 2 - 14],
    [w / 2 - 10, h / 2 - 14],
  ]) {
    const s = Math.sign(x);
    g.circle(x, y, 7).fill(P.goldHi).stroke({ width: 2, color: P.ink });
    g.moveTo(x, y + 6)
      .lineTo(x + s * 14, y + 26)
      .moveTo(x + s * 4, y + 6)
      .lineTo(x + s * 20, y + 22)
      .stroke({ width: 3, color: P.gold });
  }
  return g;
}

/** Art-nouveau resonance portal (rosette). */
class Portal extends Container {
  private glow: Sprite;
  private petals = new Graphics();
  private star = new Graphics();
  private rings = new Graphics();
  private core = new Graphics();
  private speed = 0.15;
  private target = 0.15;
  private color: number = P.mint;
  charged = false;
  private stopped = false;
  constructor() {
    super();
    this.glow = new Sprite(glowTexture());
    this.glow.anchor.set(0.5);
    this.glow.scale.set(3.2);
    this.glow.tint = P.mint;
    this.glow.alpha = 0.45;
    this.glow.blendMode = 'add';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const pts: number[] = [];
      for (let k = 0; k <= 16; k++) {
        const t = (k / 16) * Math.PI * 2;
        const ex = Math.cos(t) * 30 + 50;
        const ey = Math.sin(t) * 11;
        pts.push(Math.cos(a) * ex - Math.sin(a) * ey, Math.sin(a) * ex + Math.cos(a) * ey);
      }
      this.petals.poly(pts).fill({ color: i % 2 ? P.orchid : P.lilac, alpha: 0.9 }).stroke({ width: 2, color: P.gold });
    }
    this.star.star(0, 0, 8, 62, 30).stroke({ width: 2.5, color: P.goldHi }).star(0, 0, 8, 40, 22, Math.PI / 8).stroke({ width: 1.5, color: P.gold });
    this.rings.circle(0, 0, 104).stroke({ width: 4, color: P.gold }).circle(0, 0, 92).stroke({ width: 1.5, color: P.gold });
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      this.rings.circle(Math.cos(a) * 98, Math.sin(a) * 98, i % 4 ? 1.8 : 3.2).fill(P.goldHi);
    }
    this.drawCore();
    this.addChild(this.glow, this.rings, this.petals, this.star, this.core);
  }
  private drawCore() {
    this.core.clear().circle(0, 0, 24).fill(this.color).stroke({ width: 3, color: P.gold }).circle(-7, -7, 6).fill({ color: 0xffffff, alpha: 0.6 });
  }
  update(dt: number) {
    if (this.stopped) return;
    this.target = this.charged ? 1.2 : 0.15;
    this.speed += (this.target - this.speed) * Math.min(1, dt * 3);
    this.petals.rotation += dt * this.speed * 0.6;
    this.star.rotation -= dt * this.speed;
    this.rings.rotation += dt * this.speed * 0.15;
    const pulse = this.charged ? 0.6 + Math.sin(performance.now() / 160) * 0.15 : 0.45;
    this.glow.alpha = pulse;
  }
  tintTo(c: number | null) {
    const col = c ?? P.mint;
    if (col === this.color) return;
    this.color = col;
    this.glow.tint = col;
    this.drawCore();
  }
  burst() {
    gsap.fromTo(this.scale, { x: 1.35, y: 1.35 }, { x: 1, y: 1, duration: 0.6, ease: 'elastic.out(1.1,0.4)' });
    gsap.fromTo(this.glow, { alpha: 1 }, { alpha: 0.45, duration: 0.8 });
  }
  stop() {
    this.stopped = true;
  }
}
