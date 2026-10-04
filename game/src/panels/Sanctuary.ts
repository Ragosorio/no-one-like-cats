/**
 * Santuario de Resonancia (ORQUÍDEA REAL): dos cojines, tabla viva de probabilidades
 * exactas, condiciones que faltan, ranuras, trabajos en curso con su reloj verde de dos
 * fases (Resonando 65% / Eclosionando 35%) y ¡REVELAR! → storyboard (a).
 */
import { Container, FederatedPointerEvent, Graphics, Sprite, Text, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { Modal, toast } from '../ui/modal';
import { C, F, RARITY } from '../ui/theme';
import { txt, poster } from '../ui/widgets';
import { sfx } from '../core/audio';
import { fmtDuration, fmtTime } from '../core/format';
import { scenes } from '../core/scenes';
import { glowTexture } from '../art/textures';
import { slugOf } from '../art/tint';
import { catDef } from '../data/content';
import { G, ResonanceJob } from '../state/game';
import { cat as getCat } from '../state/sys/cats';
import { busyCats, freeSlots, oddsFor, reveal, startCopy, startResonance, OddsTable } from '../state/sys/resonance';
import { checkMissions } from '../state/sys/missions';
import {
  elEmoji,
  isTutorialResonance,
  jobView,
  missingDetail,
  parentNames,
  pickerCats,
  printRarity,
  readyJobs,
  revealInfo,
  TUTORIAL_RESONANCE_MS,
  tutorialPair,
} from '../state/ext/collection';
import { ensureCatArt, portrait, variantSprite } from './collection/art';
import { ScrollBox, GlitchText, clearChildren, guardModal, destroyTree } from './collection/ui';
import { fitText, rarityColor, rarityName } from './collection/CatCard';
import { playCatReveal, RevealResult } from '../fx/sequences/catReveal';
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
    const r = await revealJob(job.id);
    if (r) n++;
    if (r === 'catdex') {
      const { openCatdex } = await import('./Catdex');
      await openCatdex(job.result);
      break;
    }
  }
  current?.refreshAll();
  return n;
}

async function revealJob(jobId: string): Promise<RevealResult | null> {
  const res = reveal(jobId);
  if (!res) return null;
  checkMissions();
  const species = res.job.result;
  const def = catDef(species);
  const info = revealInfo(species, res.isNew, res.orbs, res.job.mutation);
  return playCatReveal(scenes.overlayLayer, {
    slug: slugOf(species),
    species,
    name: def.name,
    elements: def.elements,
    rarity: info.rarity,
    caption: info.caption,
    subtitle: info.subtitle,
    chips: info.chips,
    mutation: info.mutation,
    serial: G.s.resonance.total,
    duplicateOrbs: res.isNew ? undefined : res.orbs,
    dup: info.dup,
    dex: res.isNew ? info.dex : undefined,
    secret: def.secret,
  });
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
  private infoLine!: Text;
  private tutBanner = new Container();
  private missingBox = new Container();
  private oddsBox = new Container();
  private jobsBox = new Container();
  private jobRows: { job: ResonanceJob; ring: Graphics; label: Text; dot: Graphics; btn?: Container }[] = [];
  private purrChip = new Container();
  private acc = 0;
  private offs: (() => void)[] = [];
  private busyStart = false;

  constructor() {
    const m = (this.modal = new Modal('', MW, MH, { color: P.plum, band: P.ink, bandText: P.goldHi }));
    guardModal(m, () => this.portal?.stop());
    this.decorate();
    const title = serif('Santuario de Resonancia', 54, P.goldHi, { italic: true, bold: true });
    title.position.set(30, 8);
    const sub = ui('PROCESO SAGRADO · Y PRIVADO · MUY PRIVADO', 16, P.lilac);
    sub.position.set(title.x + title.width + 28, 36);
    m.panel.addChild(title, sub);

    this.buildList();
    this.buildCenter();
    this.buildRight();
    // tutorial: suggest Canelo + Brote
    const tp = tutorialPair();
    if (tp) this.sel = [tp[0], tp[1]];
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
      G.on('catAdded', () => !this.modal.closed && this.refreshList()),
    );
    m.onClose = () => {
      Ticker.shared.remove(this.tick, this);
      this.offs.forEach((f) => f());
      this.portal.destroyed || this.portal.stop();
      if (current === this) current = null;
    };
  }

  // ------------------------------------------------------------ decoration (art nouveau)
  private decorate() {
    const d = new Container();
    const g = new Graphics();
    // vignette blocks
    g.rect(14, 100, MW - 28, MH - 114).stroke({ width: 2, color: P.gold, alpha: 0.7 });
    g.rect(22, 108, MW - 44, MH - 130).stroke({ width: 1, color: P.gold, alpha: 0.4 });
    // central arch behind cushions
    const cx = 28 + 460 + 360;
    const top = 150;
    for (const [w, a] of [
      [700, 0.55],
      [660, 0.3],
    ] as const) {
      g.moveTo(cx - w / 2, 640).lineTo(cx - w / 2, top + w / 2).arc(cx, top + w / 2, w / 2, Math.PI, 0).lineTo(cx + w / 2, 640);
      g.stroke({ width: 2, color: P.gold, alpha: a });
    }
    g.circle(cx - 350, 640, 6).fill(P.gold).circle(cx + 350, 640, 6).fill(P.gold);
    // whiplash corners
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
    // stars
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
    const s = ui('toca uno para sentarlo en un cojín', 14, P.lilac, false);
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
    rows.forEach(({ cat, def, busy }, i) => {
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
      const nm = serif(cat.name, 24, P.linen, { bold: true });
      nm.position.set(92, 8);
      fitText(nm, 210);
      const pr = printRarity(cat.species);
      const line = ui(`Nv ${cat.level}  ·  ${def.elements.map((e) => elEmoji(e)).join('')}`, 15, P.lilac);
      line.position.set(94, 46);
      const rc = ui(rarityName(pr), 12, pr === 'common' ? P.lilac : rarityColor(pr) === C.ink ? P.goldHi : rarityColor(pr));
      rc.position.set(94 + line.width + 12, 49);
      r.addChild(nm, line, rc);
      if (busy) {
        const tag = ui('RESONANDO', 13, P.ink);
        const tb = new Graphics().roundRect(0, 0, tag.width + 14, 22, 4).fill(P.mint);
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
      r.eventMode = 'static';
      r.cursor = busy ? 'not-allowed' : 'pointer';
      r.on('pointerover', () => !busy && gsap.to(r, { x: 6, duration: 0.12 }));
      r.on('pointerout', () => gsap.to(r, { x: 0, duration: 0.12 }));
      if (!busy) {
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
        if (busy) {
          sfx('error');
          toast(`${cat.name} está ocupado resonando`, { color: P.lilac });
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
    const X = 460;
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
    btn.position.set(X + 360 - 230, 520);
    const sh = new Graphics().roundRect(6, 8, 460, 96, 16).fill(P.ink);
    this.startBg = new Graphics();
    const label = poster('¡A RESONAR!', 54, P.ink);
    label.anchor.set(0.5);
    label.position.set(230, 46);
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
    this.infoLine = ui('', 17, P.lilac);
    this.infoLine.anchor.set(0.5, 0);
    this.infoLine.position.set(X + 360, 630);
    b.addChild(this.infoLine, this.tutBanner);
    this.missingBox.position.set(X, 680);
    b.addChild(this.missingBox);
  }

  private drawStartBtn(enabled: boolean) {
    this.startBg
      .clear()
      .roundRect(0, 0, 460, 96, 16)
      .fill(enabled ? P.goldHi : P.orchid)
      .stroke({ width: 4, color: P.ink })
      .roundRect(8, 8, 444, 80, 10)
      .stroke({ width: 1.5, color: P.ink, alpha: 0.6 });
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
      // medallion
      const med = new Graphics().circle(0, 52, 22).fill(P.gold).stroke({ width: 3, color: P.ink });
      const n = serif(i === 0 ? 'I' : 'II', 22, P.ink, { bold: true });
      n.anchor.set(0.5);
      n.position.set(0, 51);
      c.addChild(med, n);
      if (cat) {
        const v = variantSprite(cat.species, 250);
        v.root.position.set(0, -110);
        c.addChild(v.root);
        this.cushionCats[i] = v.root;
        if (animate) gsap.from(v.root, { y: -180, alpha: 0, duration: 0.35, ease: 'bounce.out' });
        const def = catDef(cat.species);
        const nm = serif(cat.name, 30, P.linen, { bold: true });
        nm.anchor.set(0.5, 0);
        nm.position.set(0, 82);
        const line = ui(`Nv ${cat.level}  ·  ${def.elements.map((e) => elEmoji(e)).join(' ')}  ·  ${rarityName(printRarity(cat.species))}`, 15, P.lilac);
        line.anchor.set(0.5, 0);
        line.position.set(0, 122);
        c.addChild(nm, line);
      } else {
        this.cushionCats[i] = null;
        const ghost = new Graphics().circle(0, -100, 70).stroke({ width: 3, color: P.lilac, alpha: 0.7 });
        for (let k = 0; k < 16; k++) if (k % 2) ghost.arc(0, -100, 70, (k / 16) * Math.PI * 2, ((k + 1) / 16) * Math.PI * 2);
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
    this.drawStartBtn(both && slots > 0);
    // info line
    let info = `RANURAS LIBRES ${Math.max(0, slots)}/${G.s.resonance.slots}`;
    if (both) {
      const t = oddsFor(this.sel[0]!, this.sel[1]!);
      const time = isTutorialResonance() ? fmtTime(TUTORIAL_RESONANCE_MS) : t.timeRange[0] === t.timeRange[1] ? fmtDuration(t.timeRange[0]) : `${fmtDuration(t.timeRange[0])} – ${fmtDuration(t.timeRange[1])}`;
      info = `⏳ ${time}   ·   ${info}`;
    }
    if (G.s.resonance.pity > 0) info += `   ·   RACHA SIN ÉPICO ${G.s.resonance.pity} (+${G.s.resonance.pity}% ÉPICO)`;
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
      this.tutBanner.position.set(460 + 360 - t.width / 2, 36);
    }
  }

  // ------------------------------------------------------------ right: odds + jobs
  private buildRight() {
    const b = this.modal.body;
    const X = 1210;
    const h = serif('Tabla viva', 34, P.goldHi, { italic: true, bold: true });
    h.position.set(X, -10);
    const c = ui('PROBABILIDADES EXACTAS · SIN LETRA CHIQUITA', 13, P.lilac);
    c.position.set(X + h.width + 16, 8);
    b.addChild(h, c);
    this.oddsBox.position.set(X, 46);
    b.addChild(this.oddsBox);
    const jh = serif('En curso', 30, P.goldHi, { italic: true, bold: true });
    jh.position.set(X, 590);
    b.addChild(jh);
    this.purrChip.position.set(X + 160, 598);
    b.addChild(this.purrChip);
    this.jobsBox.position.set(X, 640);
    b.addChild(this.jobsBox);
  }

  private refreshOdds() {
    const box = this.oddsBox;
    clearChildren(box);
    const W2 = IW - 1210;
    const H2 = 530;
    const card = new Graphics()
      .roundRect(6, 6, W2, H2, 12)
      .fill(P.ink)
      .roundRect(0, 0, W2, H2, 12)
      .fill(P.linen)
      .stroke({ width: 3, color: P.gold })
      .roundRect(7, 7, W2 - 14, H2 - 14, 8)
      .stroke({ width: 1, color: P.gold, alpha: 0.8 });
    box.addChild(card);
    clearChildren(this.missingBox);
    if (!this.sel[0] || !this.sel[1]) {
      const q = serif('?', 220, P.lilac, { italic: true, bold: true });
      q.anchor.set(0.5);
      q.position.set(W2 / 2, H2 / 2 - 40);
      const t = serif('Sienta a dos gatos en los cojines\ny el destino te enseñará sus cartas.', 26, P.plum, { italic: true });
      t.style.align = 'center';
      t.anchor.set(0.5);
      t.position.set(W2 / 2, H2 / 2 + 110);
      box.addChild(q, t);
      this.drawMissing(null);
      return;
    }
    const table = oddsFor(this.sel[0], this.sel[1]);
    // header
    const hy = 16;
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
    box.addChild(new Graphics().rect(16, hy + 22, W2 - 32, 2).fill(P.plum));
    const rows = table.rows;
    const rowH = Math.min(62, Math.floor((H2 - 60) / Math.max(1, rows.length)));
    const maxPct = Math.max(...rows.map((r) => r.pct));
    rows.forEach((r, i) => {
      const y = hy + 30 + i * rowH;
      const rr = new Container();
      rr.y = y;
      const known = r.species ? !!G.s.catdex[r.species] : false;
      const registered = r.species ? G.s.catdex[r.species] === 'registered' : false;
      const pr = r.species ? printRarity(r.species) : 'mythic';
      const col = r.species ? (pr === 'common' ? 0x6d6356 : rarityColor(pr) === C.ink ? P.ink : rarityColor(pr)) : C.violet;
      // bar
      const bw = ((W2 - 40) * r.pct) / maxPct;
      rr.addChild(new Graphics().rect(16, 2, bw, rowH - 4).fill({ color: col, alpha: 0.16 }));
      if (r.species) {
        const s = portrait(r.species, rowH * 1.1, registered ? 'color' : 'sil');
        s.position.set(18 + rowH * 0.5, rowH / 2 + 1);
        const nx = 26 + rowH;
        rr.addChild(s);
        const nm = ui(known ? catDef(r.species).name : '???', Math.min(23, rowH * 0.5), P.ink);
        nm.position.set(nx, rowH / 2 - nm.height / 2);
        rr.addChild(nm);
        if (!known) {
          const els = ui(catDef(r.species).elements.map((e) => elEmoji(e)).join(''), Math.min(15, rowH * 0.4), P.ink, false);
          els.position.set(nx + nm.width + 10, rowH / 2 - els.height / 2);
          rr.addChild(els);
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
      const pct = poster(`${r.pct.toFixed(2)}%`, Math.min(32, rowH * 0.62), P.ink);
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
    const w = 720;
    const h = IH - 680;
    box.addChild(new Graphics().roundRect(0, 0, w, h, 12).fill({ color: P.ink, alpha: 0.6 }).stroke({ width: 2, color: P.gold, alpha: 0.8 }));
    const t = serif('Condiciones que faltan', 26, P.goldHi, { italic: true, bold: true });
    t.position.set(18, 8);
    box.addChild(t);
    if (!table) {
      const s = ui('Primero elige a los padres.', 17, P.lilac, false);
      s.position.set(20, 52);
      box.addChild(s);
      return;
    }
    const list = table.missing.map((m) => missingDetail(m, this.sel[0]!, this.sel[1]!));
    if (!list.length) {
      const s = serif('Nada te falta. Que decida el destino.', 22, P.mint, { italic: true });
      s.position.set(20, 54);
      box.addChild(s);
      return;
    }
    const maxRows = Math.floor((h - 56) / 26);
    list.slice(0, maxRows).forEach((m, i) => {
      const x = new Graphics().circle(28, 64 + i * 26, 8).fill(C.red);
      const l = ui(m, 15, P.linen, false);
      l.position.set(46, 54 + i * 26);
      fitText(l, w - 60);
      box.addChild(x, l);
    });
    if (list.length > maxRows) {
      const more = ui(`…y ${list.length - maxRows} más`, 14, P.lilac);
      more.position.set(w - 140, 14);
      box.addChild(more);
    }
  }

  refreshJobs() {
    const box = this.jobsBox;
    clearChildren(box);
    this.jobRows = [];
    clearChildren(this.purrChip);
    const pc = ui(`RONRONEO EN RESERVA: ${Math.floor(G.s.purr)} MIN`, 14, P.ink);
    const pb = new Graphics().roundRect(0, 0, pc.width + 16, 26, 13).fill(P.mint).stroke({ width: 2, color: P.ink });
    pc.position.set(8, 4);
    this.purrChip.addChild(pb, pc);
    const W2 = IW - 1210;
    const jobs = G.s.resonance.jobs;
    const slots = Math.max(G.s.resonance.slots, jobs.length);
    const rh = Math.min(84, Math.floor((IH - 640) / Math.max(1, slots)) - 6);
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
      const nm = serif(`${an} + ${bn}`, 22, P.linen, { bold: true });
      nm.position.set(rh + 16, 8);
      fitText(nm, W2 - rh - 220);
      const label = ui('', 15, P.mint);
      label.position.set(rh + 18, rh - 30);
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
      this.jobRows.push({ job, ring, label, dot, btn });
      this.drawJob(this.jobRows[this.jobRows.length - 1], cx, cy, rh);
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
    // phase split tick
    const a = -Math.PI / 2 + Math.PI * 2 * 0.65;
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
    const job = G.s.resonance.jobs.find((j) => j.id === jobId);
    const r = await revealJob(jobId);
    this.refreshAll();
    if (r === 'catdex' && job) {
      this.modal.close();
      const { openCatdex } = await import('./Catdex');
      await openCatdex(job.result);
    }
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
      sfx('error');
      toast('No hay ranuras libres', { sub: 'Revela o espera la Resonancia en curso.', color: P.lilac });
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
    // cats spiral into the portal
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
      this.refreshAll();
      this.caption(copy);
    });
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
    c.position.set(460 + 360, 120);
    this.modal.body.addChild(c);
    gsap.from(c.scale, { x: 0.6, y: 0.6, duration: 0.3, ease: 'back.out(2)' });
    gsap.to(c, { alpha: 0, y: 100, delay: 4.2, duration: 0.4, onComplete: () => destroyTree(c) });
  }

  refreshAll() {
    if (this.modal.closed) return;
    // drop cats that became busy
    const busy = busyCats();
    this.sel = this.sel.map((u) => (u && !busy.has(u) && getCat(u) ? u : null)) as [string | null, string | null];
    this.refreshList();
    this.refreshCushions();
    this.refreshOdds();
    this.refreshJobs();
  }

  private tick(t: Ticker) {
    if (this.modal.closed) return;
    this.portal.update(t.deltaMS / 1000);
    this.acc += t.deltaMS;
    if (this.acc < 250) return;
    this.acc = 0;
    for (const r of this.jobRows) {
      const rh = Math.min(84, Math.floor((IH - 640) / Math.max(1, Math.max(G.s.resonance.slots, G.s.resonance.jobs.length))) - 6);
      this.drawJob(r, rh / 2 + 6, rh / 2, rh);
    }
    // portal color = rarity color once any job is hatching (honest hint)
    const hatching = G.s.resonance.jobs.map((j) => jobView(j)).find((v) => v.phase !== 'resonando');
    this.portal.tintTo(hatching ? RARITY[printRarity(hatching.job.result)].color : null);
  }
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
