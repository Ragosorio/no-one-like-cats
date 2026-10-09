/**
 * El Podio — lobby: the league ladder (5 rivals, the last one is the champion), your cat vs the rival
 * (both alive on the stage), their 4 power cards, element matchup, cross-mode bonuses, cat picker and ¡A PELEAR!
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../core/App';
import { C, F, RARITY } from '../ui/theme';
import { txt, Button } from '../ui/widgets';
import { elementIcon } from '../ui/elementIcon';
import { BattleCat } from '../art/catArt';
import { applyCatTint } from '../art/tint';
import { sfx } from '../core/audio';
import { fmt } from '../core/format';
import { G, OwnedCat } from '../state/game';
import { catPortrait, ensureCats } from '../panels/campaign/common';
import { catDef, ELEMENT_BY_ID } from '../data/content';
import PB from '../data/podio.json';
import { PowerDef, SLOT_LABEL, SLOT_UNLOCK, powerLevels, powersOf } from './powers';
import { effMult } from './engine';
import { elColor } from './fx';
import { podioCatMods } from './mods';
import { RivalDef } from './ladder';
import {
  DuelOutlook,
  catBeat,
  catPodioPower,
  championPrize,
  duelOutlook,
  isReplay,
  nextPrize,
  peekCat,
  peekLevel,
  league,
  levelCap,
  nextCapLevel,
  pendingFor,
  ps,
  reachable,
  rivalAt,
  settleBank,
  suggestCats,
  xpNeed,
} from '../state/sys/podio';

export interface LobbyOpts {
  onFight: (uid: string, lg: number, bout: number) => void;
  onExit: () => void;
  /** open on this rival (a past league being browsed); default: your frontier */
  lg?: number;
  bout?: number;
  /** the browsed league changed (the scene repaints the arena) */
  onBrowse?: (r: RivalDef) => void;
}

const DM = PB.stats.display_mul;

/** best multiplier of any of `atk` elements against `def` elements */
export function matchup(atk: string[], def: string[]) {
  return Math.max(...atk.map((e) => effMult(e, def)));
}

function panel(w: number, h: number, color: number = C.paper) {
  return new Graphics()
    .rect(10, 10, w, h)
    .fill(C.ink)
    .rect(0, 0, w, h)
    .fill(color)
    .stroke({ width: 4, color: C.ink, alignment: 1 });
}

function starRow(n: number, s = 9) {
  const g = new Graphics();
  for (let i = 0; i < n; i++) {
    const pts: number[] = [];
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? s * 0.42 : s;
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      pts.push(i * s * 2.2 + Math.cos(a) * r, Math.sin(a) * r);
    }
    g.poly(pts).fill(C.yellow).stroke({ width: 2, color: C.ink });
  }
  return g;
}

export class Lobby extends Container {
  private selUid = '';
  private lg = 1;
  private bout = 0;
  private page = 0;
  private body = new Container();
  private cats: BattleCat[] = [];

  constructor(private o: LobbyOpts) {
    super();
    const p = ps();
    this.lg = p.league;
    this.bout = p.bout;
    if (o.lg !== undefined && o.bout !== undefined && reachable(o.lg, o.bout)) {
      this.lg = o.lg;
      this.bout = o.bout;
    }
    const owned = G.s.cats;
    const r = rivalAt(this.lg, this.bout);
    this.selUid = owned.some((c) => c.uid === p.pick) ? p.pick : suggestCats(r)[0]?.uid ?? owned[0]?.uid ?? '';
    this.addChild(this.body);
    this.build();
  }

  get rival(): RivalDef {
    return rivalAt(this.lg, this.bout);
  }
  get cat(): OwnedCat | undefined {
    return G.s.cats.find((c) => c.uid === this.selUid);
  }

  private build() {
    for (const c of this.cats) gsap.killTweensOf(c);
    this.cats = [];
    for (const ch of this.body.removeChildren()) {
      gsap.killTweensOf(ch);
      ch.destroy({ children: true });
    }
    const r = this.rival;
    const cat = this.cat;
    if (cat) settleBank(cat);
    this.buildTop();
    this.buildLadder();
    if (cat) this.buildMine(cat, r);
    this.buildRival(r);
    this.buildStage(cat, r);
    this.buildPicker(r);
  }

  // ------------------------------------------------------------------ top bar
  private buildTop() {
    const back = new Button('← ISLA', () => this.o.onExit(), { w: 190, h: 64, color: C.paper, size: 30 });
    back.position.set(30, 26);
    this.body.addChild(back);
    const p = ps();
    const rec = txt(`RÉCORD  ${p.stats.wins} G · ${p.stats.losses} P`, { fontFamily: F.bebas, fontSize: 26, fill: C.paper, letterSpacing: 2, stroke: { color: C.ink, width: 5 } });
    rec.anchor.set(1, 0);
    rec.position.set(W - 34, 30);
    const lg = txt(league(p.league).name, { fontFamily: F.poster, fontSize: 34, fill: league(p.league).color, stroke: { color: C.ink, width: 7, join: 'round' } });
    lg.anchor.set(1, 0);
    lg.position.set(W - 34, 58);
    this.body.addChild(rec, lg);
    // the next Heroico / Divino a VACÍO champion pays (the chase, always in sight)
    const np = nextPrize();
    if (np) {
      const d = catDef(np.species);
      const rr = RARITY[d.rarity];
      const t = txt(`PRÓXIMO PREMIO: ${d.name.toUpperCase()} (${rr.name}) · CAMPEÓN DE ${league(np.league).name}`, { fontFamily: F.bebas, fontSize: 18, fill: C.paper, letterSpacing: 1 });
      const bg = new Graphics().rect(-12, -3, t.width + 24, t.height + 6).fill(rr.color).stroke({ width: 3, color: C.ink });
      const tag = new Container();
      tag.addChild(bg, t);
      tag.position.set(W - 34 - t.width - 12, 6);
      this.body.addChild(tag);
    }
  }

  // ------------------------------------------------------------------ league browser
  /** go to another league (rematches): its first rival THIS cat hasn't beaten, else the champion */
  private browse(lg: number, bout?: number) {
    const p = ps();
    lg = Math.max(1, Math.min(p.league, lg));
    if (bout === undefined) {
      const uid = this.selUid;
      const open: number[] = [];
      for (let b = 0; b < PB.ladder.bouts_per_league; b++) if (reachable(lg, b) && !catBeat(uid, lg, b)) open.push(b);
      bout = open[0] ?? (lg === p.league ? p.bout : PB.ladder.bouts_per_league - 1);
    }
    if (!reachable(lg, bout)) return;
    const changed = lg !== this.lg;
    this.lg = lg;
    this.bout = bout;
    const sp = [0, 1, 2, 3, 4].map((i) => rivalAt(lg, i).species);
    void ensureCats(sp).then(() => {
      if (this.destroyed) return;
      if (changed) this.o.onBrowse?.(this.rival);
      this.build();
    });
  }

  private arrow(dir: -1 | 1, enabled: boolean, label: string) {
    const b = new Container();
    const w = 44;
    const h = 92;
    const g = new Graphics()
      .rect(5, 5, w, h)
      .fill(C.ink)
      .rect(0, 0, w, h)
      .fill(enabled ? C.yellow : C.paperDark)
      .stroke({ width: 4, color: C.ink, alignment: 1 });
    const tri = new Graphics()
      .poly(dir < 0 ? [w * 0.66, h * 0.3, w * 0.3, h * 0.5, w * 0.66, h * 0.7] : [w * 0.34, h * 0.3, w * 0.7, h * 0.5, w * 0.34, h * 0.7])
      .fill(enabled ? C.ink : C.plum);
    b.addChild(g, tri);
    const t = txt(label, { fontFamily: F.bebas, fontSize: 18, fill: enabled ? C.paper : C.plum, letterSpacing: 1, stroke: { color: C.ink, width: 4 } });
    t.anchor.set(0.5, 0);
    t.position.set(w / 2, h + 6);
    b.addChild(t);
    if (!enabled) b.alpha = 0.55;
    else {
      b.eventMode = 'static';
      b.cursor = 'pointer';
      b.on('pointertap', () => {
        sfx('click');
        this.browse(this.lg + dir);
      });
    }
    return b;
  }

  // ------------------------------------------------------------------ ladder
  private buildLadder() {
    const p = ps();
    const n = PB.ladder.bouts_per_league;
    const c = new Container();
    const gap = 128;
    const line = new Graphics().moveTo(0, 0).lineTo(gap * (n - 1), 0).stroke({ width: 8, color: C.ink });
    c.addChild(line);
    const uid = this.selUid;
    for (let i = 0; i < n; i++) {
      const rv = rivalAt(this.lg, i);
      const beaten = isReplay(this.lg, i);
      const current = this.lg === p.league && i === p.bout;
      const mine = catBeat(uid, this.lg, i);
      const sel = i === this.bout;
      const champ = i === n - 1;
      const size = champ ? 96 : 80;
      const node = new Container();
      const por = catPortrait(rv.species, size, { ring: sel ? C.yellow : C.ink, grayscale: false });
      node.addChild(por);
      if (!beaten && !current) {
        const veil = new Graphics().circle(0, 0, size / 2).fill({ color: C.ink, alpha: 0.6 });
        const q = txt('?', { fontFamily: F.poster, fontSize: 44, fill: C.paper });
        q.anchor.set(0.5);
        node.addChild(veil, q);
      }
      if (mine) {
        // THIS cat already beat it
        const tick = new Graphics().circle(size / 2 - 8, -size / 2 + 8, 16).fill(C.green).stroke({ width: 3, color: C.ink });
        tick.moveTo(size / 2 - 16, -size / 2 + 8).lineTo(size / 2 - 10, -size / 2 + 14).lineTo(size / 2, -size / 2 + 2).stroke({ width: 4, color: C.paper });
        node.addChild(tick);
      } else if (beaten || current) {
        // first win still pending for this cat: full XP + orbs
        const tag = new Container();
        const tt = txt('+XP', { fontFamily: F.bebas, fontSize: 18, fill: C.paper, letterSpacing: 1 });
        tt.anchor.set(0.5);
        const tg = new Graphics().roundRect(-tt.width / 2 - 7, -12, tt.width + 14, 24, 6).fill(C.pinkHot).stroke({ width: 3, color: C.ink });
        tag.addChild(tg, tt);
        tag.position.set(size / 2 - 6, -size / 2 + 6);
        tag.rotation = 0.12;
        node.addChild(tag);
      }
      if (champ) {
        const crown = new Graphics().poly([-26, -size / 2 - 4, -26, -size / 2 - 30, -13, -size / 2 - 16, 0, -size / 2 - 34, 13, -size / 2 - 16, 26, -size / 2 - 30, 26, -size / 2 - 4]).fill(C.yellow).stroke({ width: 3, color: C.ink });
        node.addChild(crown);
      }
      const lab = txt(champ ? 'CAMPEÓN' : `RIVAL ${i + 1}`, { fontFamily: F.bebas, fontSize: 22, fill: sel ? C.yellow : C.paper, letterSpacing: 2, stroke: { color: C.ink, width: 5 } });
      lab.anchor.set(0.5, 0);
      lab.y = size / 2 + 6;
      node.addChild(lab);
      // a VACÍO champion pays a Heroico / Divino the first time
      const prize = champ ? championPrize(this.lg) : null;
      if (prize && !p.champions.includes(this.lg)) {
        const rr = RARITY[catDef(prize).rarity];
        const pt = txt(`PREMIO: ${rr.name}`, { fontFamily: F.bebas, fontSize: 18, fill: C.paper, letterSpacing: 1 });
        pt.anchor.set(0.5, 0);
        pt.y = size / 2 + 34;
        const pb = new Graphics().rect(-pt.width / 2 - 8, size / 2 + 32, pt.width + 16, pt.height + 4).fill(rr.color).stroke({ width: 2, color: C.ink });
        node.addChild(pb, pt);
      }
      node.x = i * gap;
      if (beaten || current) {
        node.eventMode = 'static';
        node.cursor = 'pointer';
        node.on('pointertap', () => {
          sfx('click');
          this.bout = i;
          this.build();
        });
      }
      if (sel) gsap.to(node.scale, { x: 1.08, y: 1.08, duration: 0.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      c.addChild(node);
    }
    // ◀ ▶ league browser: every past league can be rematched (catch-up for cats obtained later)
    if (this.lg > 1) {
      const prev = this.arrow(-1, true, `LIGA ${this.lg - 1}`);
      prev.position.set(-gap / 2 - 35, -46);
      c.addChild(prev);
    }
    if (this.lg < p.league) {
      const next = this.arrow(1, true, `LIGA ${this.lg + 1}`);
      next.position.set(gap * (n - 1) + gap / 2 + 2, -46);
      c.addChild(next);
    }
    c.position.set(W / 2 - (gap * (n - 1)) / 2, 168);
    this.body.addChild(c);
  }

  // ------------------------------------------------------------------ your cat
  private buildMine(cat: OwnedCat, r: RivalDef) {
    const def = catDef(cat.species);
    const st = peekCat(cat.uid);
    const cap = levelCap(cat);
    const pw = 560;
    const c = new Container();
    c.addChild(panel(pw, 610));
    const head = new Graphics().rect(0, 0, pw, 46).fill(C.ink);
    const ht = txt('TU GATO', { fontFamily: F.bebas, fontSize: 28, fill: C.yellow, letterSpacing: 4 });
    ht.position.set(18, 8);
    c.addChild(head, ht);
    const name = txt(cat.name.toUpperCase(), { fontFamily: F.poster, fontSize: 46, fill: C.ink });
    name.position.set(18, 52);
    if (name.width > 330) name.scale.set(330 / name.width);
    const rr = RARITY[def.rarity];
    const meta = txt(`NV ${cat.level} · ${rr.name}`, { fontFamily: F.bebas, fontSize: 26, fill: rr.color, letterSpacing: 1 });
    meta.position.set(18, 104);
    const sr = starRow(cat.stars);
    sr.position.set(34 + meta.width, 118);
    c.addChild(name, meta, sr);
    let ex = pw - 26;
    for (const el of [...def.elements].reverse()) {
      const b = elementIcon(el, 44);
      b.position.set(ex, 82);
      c.addChild(b);
      ex -= 50;
    }
    // podio level + xp
    const pl = txt(`PODIO NV ${st.lvl}`, { fontFamily: F.poster, fontSize: 32, fill: C.pinkHot });
    pl.position.set(18, 140);
    const need = xpNeed(st.lvl);
    const bar = new Graphics().rect(0, 0, 300, 20).fill(C.paperDark).stroke({ width: 3, color: C.ink, alignment: 1 });
    const max = st.lvl >= PB.levels.max;
    bar.rect(0, 0, 300 * (max ? 1 : Math.min(1, st.xp / need)), 20).fill(C.pinkHot);
    bar.position.set(pw - 318, 152);
    const xt = txt(max ? 'MAESTRO DEL PODIO' : `${st.xp} / ${need} XP`, { fontFamily: F.bebas, fontSize: 18, fill: C.ink, letterSpacing: 1 });
    xt.anchor.set(0.5);
    xt.position.set(pw - 168, 162);
    c.addChild(pl, bar, xt);
    const bank = st.bank ?? 0;
    const capT = txt(
      bank > 0
        ? `TOPE: sube a ${cat.name} a NV ${nextCapLevel(cat)} en la isla (o una estrella). Tiene ${fmt(bank)} XP GUARDADA que entra sola al subir el tope.`
        : st.lvl >= cap && !max
          ? `TOPE ALCANZADO: sube a ${cat.name} a NV ${nextCapLevel(cat)} en la isla (o una estrella) para seguir creciendo.`
          : `Tope actual: Podio NV ${cap} (sube con el nivel y las estrellas del gato).`,
      { fontFamily: F.ui, fontSize: 17, fill: st.lvl >= cap && !max ? C.red : C.plum, wordWrap: true, wordWrapWidth: pw - 36, fontWeight: '700' },
    );
    capT.position.set(18, 180);
    if (capT.height > 44) capT.scale.set(44 / capT.height);
    c.addChild(capT);
    // 4 powers
    const lv = powerLevels(st.lvl);
    this.powerRows(c, powersOf(cat.species), lv, 226, pw);
    // cross-mode bonus
    const m = podioCatMods(cat);
    const pct = (v: number) => `+${Math.round(v * 100)}%`;
    const bonus = st.lvl > 1 || lv[3] > 0 ? `FUERA DEL PODIO: ${pct(m.dmgMul - 1)} daño y ${pct(m.ultStart)} ulti inicial en el barco · ${pct(m.goldMul - 1)} oro en la isla` : 'FUERA DEL PODIO: cada nivel de Podio le da más daño en el barco y más oro en la isla.';
    const bt = txt(bonus, { fontFamily: F.ui, fontWeight: '700', fontSize: 17, fill: C.inkBlue, wordWrap: true, wordWrapWidth: pw - 36 });
    bt.position.set(18, 560);
    c.addChild(bt);
    c.position.set(30, 118);
    this.body.addChild(c);
    void r;
  }

  private powerRows(c: Container, powers: PowerDef[], lv: number[], y0: number, pw: number, compact = false) {
    const rowH = compact ? 62 : 82;
    powers.forEach((p, i) => {
      const y = y0 + i * rowH;
      const f = elColor(p.element);
      const locked = lv[i] <= 0;
      const row = new Graphics().rect(14, y, pw - 28, rowH - 8).fill(locked ? C.paperDark : C.linen).stroke({ width: 2, color: C.ink });
      const tag = new Graphics().rect(14, y, 92, rowH - 8).fill(p.ult ? C.ink : f.main).stroke({ width: 2, color: C.ink });
      const tl = txt(SLOT_LABEL[i], { fontFamily: F.bebas, fontSize: 22, fill: p.ult ? C.yellow : C.paper, letterSpacing: 1, stroke: { color: C.ink, width: 4 } });
      tl.anchor.set(0.5);
      tl.position.set(60, y + (rowH - 8) / 2 - (compact ? 0 : 10));
      c.addChild(row, tag, tl);
      if (!compact) {
        const badge = elementIcon(p.element, 26);
        badge.position.set(60, y + 52);
        c.addChild(badge);
      }
      const nm = txt(p.name, { fontFamily: F.poster, fontSize: compact ? 22 : 24, fill: locked ? C.plum : C.ink });
      nm.position.set(118, y + 4);
      if (nm.width > pw - 250) nm.scale.set((pw - 250) / nm.width);
      c.addChild(nm);
      const lvT = txt(locked ? `PODIO ${SLOT_UNLOCK[i]}` : `NV ${lv[i]}`, { fontFamily: F.bebas, fontSize: 22, fill: locked ? C.plum : C.pinkHot, letterSpacing: 1 });
      lvT.anchor.set(1, 0);
      lvT.position.set(pw - 24, y + 6);
      c.addChild(lvT);
      if (!compact) {
        const d = txt(p.desc, { fontFamily: F.ui, fontSize: 15, fill: C.ink, wordWrap: true, wordWrapWidth: pw - 150 });
        d.position.set(118, y + 36);
        if (d.height > 40) d.scale.set(40 / d.height);
        c.addChild(d);
      }
    });
  }

  // ------------------------------------------------------------------ rival
  private buildRival(r: RivalDef) {
    const pw = 560;
    const c = new Container();
    const cat = this.cat;
    const out = cat ? duelOutlook(cat, this.lg, this.bout) : null;
    const kind = out?.kind ?? (isReplay(this.lg, this.bout) ? 'repeat' : 'frontier');
    c.addChild(panel(pw, 610, r.champion ? 0xfff0c8 : C.paper));
    const head = new Graphics().rect(0, 0, pw, 46).fill(kind === 'first' ? C.pinkHot : r.champion ? C.red : C.ink);
    const who = cat ? cat.name.toUpperCase() : 'TU GATO';
    const title =
      kind === 'first'
        ? `${r.champion ? 'CAMPEÓN' : `RIVAL ${this.bout + 1}`} · PRIMERA VEZ DE ${who}`
        : kind === 'repeat'
          ? `${r.champion ? 'CAMPEÓN' : `RIVAL ${this.bout + 1}`} · REVANCHA`
          : r.champion
            ? 'CAMPEÓN DE LA LIGA'
            : `RIVAL ${this.bout + 1} DE ${PB.ladder.bouts_per_league}`;
    const ht = txt(title, { fontFamily: F.bebas, fontSize: 28, fill: C.yellow, letterSpacing: 3, stroke: { color: C.ink, width: 4 } });
    ht.position.set(18, 8);
    if (ht.width > pw - 36) ht.scale.set((pw - 36) / ht.width);
    c.addChild(head, ht);
    const tr = txt(r.trainer, { fontFamily: F.bebas, fontSize: 24, fill: C.plum, letterSpacing: 2 });
    tr.position.set(18, 52);
    const name = txt(r.def.name.toUpperCase(), { fontFamily: F.poster, fontSize: 44, fill: C.ink });
    name.position.set(18, 76);
    if (name.width > 330) name.scale.set(330 / name.width);
    const rr = RARITY[r.def.rarity];
    const meta = txt(`NV ${r.level} · ${rr.name} · PODIO ${r.podioLvl}`, { fontFamily: F.bebas, fontSize: 24, fill: rr.color, letterSpacing: 1 });
    meta.position.set(18, 126);
    const sr = starRow(r.stars);
    sr.position.set(34 + meta.width, 139);
    c.addChild(tr, name, meta, sr);
    let ex = pw - 26;
    for (const el of [...r.def.elements].reverse()) {
      const b = elementIcon(el, 44);
      b.position.set(ex, 82);
      c.addChild(b);
      ex -= 50;
    }
    const taunt = txt(`«${r.taunt}»`, { fontFamily: F.ui, fontStyle: 'italic', fontSize: 18, fill: C.ink, wordWrap: true, wordWrapWidth: pw - 36 });
    taunt.position.set(18, 166);
    c.addChild(taunt);
    const pwT = txt(`PODER ${fmt(Math.round(r.power * DM))}`, { fontFamily: F.poster, fontSize: 26, fill: C.red });
    pwT.anchor.set(1, 0);
    pwT.position.set(pw - 22, 130);
    c.addChild(pwT);
    this.powerRows(c, powersOf(r.species), powerLevels(r.podioLvl), 226, pw);
    // what a win gives THIS cat (first time for it vs repeat), exactly what applyDuel will pay
    const box = new Graphics().rect(14, 550, pw - 28, 50).fill(kind === 'first' ? 0xffe3ef : kind === 'repeat' ? C.paperDark : C.linen).stroke({ width: 2, color: C.ink });
    c.addChild(box);
    const pt = txt(out && cat ? rewardLine(out, cat, this.lg) : '', { fontFamily: F.ui, fontWeight: '700', fontSize: 17, fill: C.inkBlue, wordWrap: true, wordWrapWidth: pw - 52, lineHeight: 19 });
    pt.position.set(26, 554);
    if (pt.height > 42) pt.scale.set(42 / pt.height);
    c.addChild(pt);
    c.position.set(W - 30 - pw, 118);
    this.body.addChild(c);
  }

  // ------------------------------------------------------------------ the two cats + VS
  private buildStage(cat: OwnedCat | undefined, r: RivalDef) {
    const c = new Container();
    const mk = (species: string, el: string, x: number, flip: boolean) => {
      const def = catDef(species);
      const bc = new BattleCat(def.art.slug, el === 'storm' ? 'storm' : el, 250, flip);
      applyCatTint(bc.sprite, species);
      bc.position.set(x, 610);
      c.addChild(bc);
      this.cats.push(bc);
      return bc;
    };
    if (cat) mk(cat.species, catDef(cat.species).elements[0], 790, false);
    mk(r.species, r.def.elements[0], 1130, true);
    const vs = txt('VS', { fontFamily: F.comic, fontSize: 110, fill: C.yellow, stroke: { color: C.ink, width: 14, join: 'round' } });
    vs.anchor.set(0.5);
    vs.position.set(W / 2, 470);
    vs.rotation = -0.08;
    c.addChild(vs);
    gsap.to(vs.scale, { x: 1.1, y: 1.1, duration: 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    if (cat) {
      const def = catDef(cat.species);
      const atk = matchup(def.elements, r.def.elements);
      const dfn = matchup(r.def.elements, def.elements);
      const lab = atk > 1.01 && dfn <= 1.01 ? ['¡VENTAJA TUYA!', C.green] : dfn > 1.01 && atk <= 1.01 ? ['DESVENTAJA', C.red] : atk > 1.01 && dfn > 1.01 ? ['¡A MUERTE! (LOS DOS PEGAN DOBLE)', C.orange] : ['PAREJO', C.paper];
      const mt = txt(lab[0] as string, { fontFamily: F.poster, fontSize: 34, fill: lab[1] as number, stroke: { color: C.ink, width: 7, join: 'round' } });
      mt.anchor.set(0.5);
      mt.position.set(W / 2, 680);
      const sub = txt(`Tus ataques x${atk.toFixed(2).replace(/\.?0+$/, '')} · los suyos x${dfn.toFixed(2).replace(/\.?0+$/, '')}`, { fontFamily: F.bebas, fontSize: 24, fill: C.paper, letterSpacing: 1, stroke: { color: C.ink, width: 5 } });
      sub.anchor.set(0.5);
      sub.position.set(W / 2, 716);
      c.addChild(mt, sub);
      const myPow = txt(`PODER ${fmt(Math.round(catPodioPower(cat) * DM))}`, { fontFamily: F.poster, fontSize: 28, fill: C.paper, stroke: { color: C.ink, width: 6 } });
      myPow.anchor.set(0.5);
      myPow.position.set(790, 650);
      c.addChild(myPow);
    }
    this.body.addChild(c);
  }

  // ------------------------------------------------------------------ cat picker + fight
  private buildPicker(r: RivalDef) {
    const list = suggestCats(r);
    const per = 8;
    const pages = Math.max(1, Math.ceil(list.length / per));
    this.page = Math.min(this.page, pages - 1);
    const c = new Container();
    const bg = new Graphics().rect(0, 0, 1460, 196).fill({ color: C.ink, alpha: 0.82 }).stroke({ width: 4, color: C.ink });
    c.addChild(bg);
    const t = txt('ELIGE A TU GATO · los primeros tienen ventaja contra este rival', { fontFamily: F.bebas, fontSize: 22, fill: C.paper, letterSpacing: 2 });
    t.position.set(16, 6);
    c.addChild(t);
    const sel = this.cat;
    if (sel) {
      const p = ps();
      const past = pendingFor(sel.uid).filter((x) => isReplay(x.lg, x.bout));
      const label = past.length
        ? `${sel.name.toUpperCase()}: ${past.length} RIVAL${past.length > 1 ? 'ES' : ''} SIN VENCER (XP COMPLETA)  ·  IR AL PRIMERO ›`
        : `${sel.name.toUpperCase()} YA LE GANÓ A TODOS LOS DE ATRÁS  ·  IR A TU LIGA ›`;
      const chip = new Container();
      const ct = txt(label, { fontFamily: F.bebas, fontSize: 20, fill: past.length ? C.paper : C.ink, letterSpacing: 1 });
      ct.position.set(10, 1);
      const maxW = 1460 - t.width - 60;
      if (ct.width > maxW - 20) ct.scale.set((maxW - 20) / ct.width);
      chip.addChild(new Graphics().rect(0, 0, ct.width + 20, 26).fill(past.length ? C.pinkHot : C.yellow).stroke({ width: 2, color: C.paper }), ct);
      chip.position.set(1460 - 12 - ct.width - 20, 5);
      chip.eventMode = 'static';
      chip.cursor = 'pointer';
      chip.on('pointertap', () => {
        sfx('click');
        const to = past[0] ?? { lg: p.league, bout: p.bout };
        this.browse(to.lg, to.bout);
      });
      c.addChild(chip);
    }
    list.slice(this.page * per, this.page * per + per).forEach((cat, i) => {
      const def = catDef(cat.species);
      const card = new Container();
      const sel = cat.uid === this.selUid;
      const g = new Graphics().rect(0, 0, 160, 150).fill(sel ? C.yellow : C.paper).stroke({ width: sel ? 6 : 3, color: sel ? C.pinkHot : C.ink, alignment: 1 });
      card.addChild(g);
      const por = catPortrait(cat.species, 76);
      por.position.set(48, 50);
      card.addChild(por);
      const nm = txt(cat.name.toUpperCase(), { fontFamily: F.bebas, fontSize: 22, fill: C.ink });
      nm.position.set(8, 96);
      if (nm.width > 144) nm.scale.set(144 / nm.width);
      const lv = txt(`NV ${cat.level} · P${peekLevel(cat.uid)}`, { fontFamily: F.bebas, fontSize: 20, fill: C.plum });
      lv.position.set(8, 120);
      card.addChild(nm, lv);
      def.elements.forEach((el, k) => {
        const b = elementIcon(el, 26);
        b.position.set(136, 20 + k * 28);
        card.addChild(b);
      });
      if (!catBeat(cat.uid, this.lg, this.bout)) {
        // this cat has never beaten this rival: full XP + orbs
        const tag = new Container();
        const tt = txt('+XP', { fontFamily: F.bebas, fontSize: 18, fill: C.paper, letterSpacing: 1 });
        tt.anchor.set(0.5);
        tag.addChild(new Graphics().roundRect(-tt.width / 2 - 6, -11, tt.width + 12, 22, 5).fill(C.pinkHot).stroke({ width: 2, color: C.ink }), tt);
        tag.position.set(26, 16);
        tag.rotation = -0.12;
        card.addChild(tag);
      }
      const adv = matchup(def.elements, r.def.elements);
      const weak = matchup(r.def.elements, def.elements);
      if (adv > 1.01 || weak > 1.01) {
        const up = adv > 1.01;
        const tri = new Graphics().poly(up ? [0, 14, 10, 0, 20, 14] : [0, 0, 10, 14, 20, 0]).fill(up ? C.green : C.red).stroke({ width: 2, color: C.ink });
        tri.position.set(98, 64);
        card.addChild(tri);
      }
      card.position.set(16 + i * 172, 36);
      card.eventMode = 'static';
      card.cursor = 'pointer';
      card.on('pointertap', () => {
        sfx('click');
        this.selUid = cat.uid;
        ps().pick = cat.uid;
        this.build();
      });
      c.addChild(card);
    });
    if (pages > 1) {
      const nx = new Button(`${this.page + 1}/${pages} ›`, () => {
        this.page = (this.page + 1) % pages;
        this.build();
      }, { w: 92, h: 150, size: 26, color: C.paper });
      nx.position.set(1460 - 104, 36);
      c.addChild(nx);
    }
    c.position.set(30, H - 216);
    this.body.addChild(c);
    // fight button
    const cat = this.cat;
    const fight = new Button('¡A PELEAR!', () => {
      if (!cat) return;
      ps().pick = cat.uid;
      this.o.onFight(cat.uid, this.lg, this.bout);
    }, { w: 360, h: 150, color: C.pinkHot, textColor: C.paper, size: 58, disabled: !cat });
    fight.position.set(W - 30 - 370, H - 206);
    gsap.to(fight.face, { y: -4, duration: 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    this.body.addChild(fight);
  }

  override destroy(o?: Parameters<Container['destroy']>[0]) {
    const kill = (c: Container) => {
      gsap.killTweensOf(c);
      gsap.killTweensOf(c.scale);
      for (const ch of c.children) kill(ch as Container);
    };
    kill(this);
    super.destroy(o);
  }
}

/** the "if you win" line of the rival card: exactly what applyDuel pays this cat */
function rewardLine(o: DuelOutlook, cat: OwnedCat, lg: number): string {
  const name = cat.name;
  const mult = o.catchup > 1.01 ? ` (x${o.catchup.toFixed(1)} por ir atrás)` : '';
  const orbs = o.orbs ? `${o.orbs} orbe${o.orbs > 1 ? 's' : ''} de ${name}` : 'sin orbes (liga vieja)';
  const cap = o.capped ? (o.keepXp ? ' En su tope: la XP se guarda.' : ' En su tope: no sube.') : '';
  if (o.kind === 'frontier') {
    if (o.firstChampion) {
      const pz = o.prize ? `¡${catDef(o.prize).name.toUpperCase()} (${RARITY[catDef(o.prize).rarity].name}) A TU ISLA! ` : '';
      return `SI GANAS: ${pz}Botín x2, ${o.gems} Ojos de Gato, ${o.orbs} orbes, +${o.xp} XP y subes de liga.`;
    }
    return `SI GANAS: +${o.xp} XP de Podio${mult}, ${orbs}, Doblones, Pescaditos y Ronroneo. Avanzas en la liga.${cap}`;
  }
  const done = o.champion && championPrize(lg) ? ' Su premio ya es tuyo.' : '';
  if (o.kind === 'first') return `SI GANAS: XP COMPLETA +${o.xp}${mult}, ${orbs} y oro de revancha.${cap ? '' : ' Una vez por gato.'}${done}${cap}`;
  return `SI GANAS: +${o.xp} XP de revancha${mult}, ${orbs} y poco oro. Un gato que no le ha ganado sacaría XP completa.${cap}`;
}

void ELEMENT_BY_ID;
void Text;
