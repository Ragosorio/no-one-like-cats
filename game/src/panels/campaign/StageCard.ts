/** Map stage card: a newspaper clipping with name, faction, captain, honest odds and expected loot. */
import { Container, Graphics } from 'pixi.js';
import { simulateEstimate, estimateLabel, Estimate } from '../../state/sys/estimate';
import { buildBattle } from '../../state/sys/campaign';
import gsap from 'gsap';
import { C, F } from '../../ui/theme';
import { txt, Button } from '../../ui/widgets';
import { fmt } from '../../core/format';
import { sfx } from '../../core/audio';
import { BAL } from '../../state/econ';
import { G } from '../../state/game';
import { stagePower, winChance, stageInfo } from '../../state/sys/campaign';
import { combatPower, combatWeight } from '../../state/sys/ship';
import {
  FACTION,
  KIND_LABEL,
  PERSONALITY,
  QUICK_ASSAULT_RATIO,
  canQuickAssault,
  lootPreview,
  prettyArchetype,
  stageCaptain,
  stageElements,
  stageKey,
  stageKind,
  stageState,
} from '../../state/ext/campaign';
import { P, killTree, clipping, elName, elNameCap, elementBadge, resChip, stamp, label, doubleRule } from './common';
import { elementFx } from '../../art/catArt';
import { elKey } from './common';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

export class StageCard extends Container {
  readonly cw = 540;
  ch = 0;
  constructor(
    public zone: number,
    public stage: number,
    private o: { onClose: () => void; onQuick: () => void },
  ) {
    super();
    this.build();
    this.eventMode = 'static';
    this.on('pointertap', (e) => e.stopPropagation());
  }

  private build() {
    const z = this.zone;
    const s = this.stage;
    const W0 = this.cw;
    const pad = 28;
    const inner = W0 - pad * 2;
    const content = new Container();
    let y = 22;
    const kind = stageKind(z, s);
    const state = stageState(z, s);
    const sd = stageInfo(z, s);

    // header line
    const tag = label(`ZONA ${ROMAN[z]} · ETAPA ${z}-${s}`, 16, P.blue, { letterSpacing: 2 });
    tag.position.set(pad, y);
    const kc = kind === 'boss' ? C.red : kind === 'elite' ? C.gold : P.blue;
    const kst = stamp(KIND_LABEL[kind], kc, 22, 0.06);
    kst.position.set(W0 - pad - kst.width / 2, y + 12);
    content.addChild(tag, kst);
    y += 30;
    const name = txt((sd?.name ?? 'Pirata').toUpperCase(), { fontFamily: F.poster, fontSize: 48, fill: C.ink, wordWrap: true, wordWrapWidth: inner, lineHeight: 50 });
    name.position.set(pad, y);
    content.addChild(name);
    y += name.height + 2;
    const fac = txt(`${FACTION[z].name} · ${prettyArchetype(z, s)}`, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 18, fill: P.blue, wordWrap: true, wordWrapWidth: inner });
    fac.position.set(pad, y);
    content.addChild(fac);
    y += fac.height + 12;
    const r1 = doubleRule(inner, C.ink, 2);
    r1.position.set(pad, y);
    content.addChild(r1);
    y += 16;

    // captain & personality
    const cap = stageCaptain(z, s);
    const pers = PERSONALITY[cap.personality] ?? { name: cap.personality, line: '' };
    const capL = label('AL MANDO', 13, P.blue, { letterSpacing: 2 });
    capL.position.set(pad, y);
    const capN = txt(cap.name, { fontFamily: F.poster, fontSize: 24, fill: C.ink, wordWrap: true, wordWrapWidth: inner - 150 });
    capN.position.set(pad, y + 16);
    content.addChild(capL, capN);
    // elements on the right
    const els = stageElements(z, s);
    els.forEach((el, i) => {
      const b = elementBadge(el, 40);
      b.position.set(W0 - pad - 20 - (els.length - 1 - i) * 46, y + 26);
      content.addChild(b);
    });
    const elsT = label(els.map((e) => elName(e)).join(' · '), 12, P.blue);
    elsT.anchor.set(1, 0);
    elsT.position.set(W0 - pad, y + 50);
    content.addChild(elsT);
    y += 16 + capN.height + 8;
    const ai = txt(`IA ${pers.name.toUpperCase()} — ${pers.line}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink, wordWrap: true, wordWrapWidth: inner });
    ai.position.set(pad, y);
    content.addChild(ai);
    y += ai.height + 6;
    if (cap.line) {
      const q = txt(`«${cap.line}»`, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 17, fill: P.blue, wordWrap: true, wordWrapWidth: inner });
      q.position.set(pad, y);
      content.addChild(q);
      y += q.height + 6;
    }
    if (sd?.eliteRule) {
      const er = txt(`REGLA: ${sd.eliteRule}`, { fontFamily: F.ui, fontSize: 14, fill: C.red, fontWeight: '700', wordWrap: true, wordWrapWidth: inner });
      er.position.set(pad, y);
      content.addChild(er);
      y += er.height + 6;
    }
    y += 8;

    // power vs power + estimate
    const ep = stagePower(z, s);
    // the Poder the fight scales with (Bastión ×0.9: ship.ts COMBAT_WEIGHT)
    const sp = combatPower();
    const pc = winChance(z, s);
    const box = new Graphics().rect(pad, y, inner, 138).fill({ color: P.blue, alpha: 0.07 }).stroke({ width: 2, color: P.blue });
    content.addChild(box);
    const l1 = label('PODER ENEMIGO', 13, P.blue, { letterSpacing: 2 });
    l1.position.set(pad + 16, y + 10);
    const v1 = txt(fmt(ep), { fontFamily: F.poster, fontSize: 46, fill: C.red });
    v1.position.set(pad + 16, y + 26);
    const l2 = label(combatWeight() !== 1 ? `TU PODER DE COMBATE (x${combatWeight()})` : 'TU PODER', 13, P.blue, { letterSpacing: 2 });
    l2.anchor.set(1, 0);
    l2.position.set(W0 - pad - 16, y + 10);
    const v2 = txt(fmt(sp), { fontFamily: F.poster, fontSize: 46, fill: P.blue });
    v2.anchor.set(1, 0);
    v2.position.set(W0 - pad - 16, y + 26);
    const vs = txt('VS', { fontFamily: F.news, fontSize: 40, fill: C.ink });
    vs.anchor.set(0.5, 0);
    vs.position.set(W0 / 2, y + 26);
    content.addChild(l1, v1, l2, v2, vs);
    // tug bar
    const share = sp / (sp + ep);
    const bar = new Graphics();
    const bx = pad + 16;
    const bw = inner - 32;
    bar.rect(bx, y + 88, bw, 14).fill(C.red).rect(bx + bw * (1 - share), y + 88, bw * share, 14).fill(P.blue).rect(bx, y + 88, bw, 14).stroke({ width: 2, color: C.ink });
    bar.moveTo(bx + bw / 2, y + 84).lineTo(bx + bw / 2, y + 106).stroke({ width: 2, color: C.ink });
    content.addChild(bar);
    const ratio = sp / Math.max(1e-9, ep);
    const rt = label(`Ventaja ×${ratio.toFixed(2)}`, 13, C.ink);
    rt.position.set(bx, y + 110);
    content.addChild(rt);
    // same honest sim as the pre-battle panel (cached per ship/crew/layout)
    const estHolder = new Container();
    content.addChild(estHolder);
    const ey = y + 122;
    const drawEst = (e: Estimate) => {
      if (estHolder.destroyed) return;
      estHolder.removeChildren().forEach((c) => c.destroy({ children: true }));
      const p = e.p ?? pc;
      const st = stamp(`ESTIMACIÓN ${estimateLabel(e)}`, e.p === null ? P.blue : p >= 0.7 ? 0x2e8a52 : p >= 0.45 ? 0xb8701e : C.red, 26, -0.04);
      st.position.set(W0 - pad - st.width / 2 - 6, ey);
      estHolder.addChild(st);
    };
    void simulateEstimate(`${z}-${s}`, () => buildBattle(z, s, () => undefined), drawEst);
    y += 138 + 20;

    // boss analysis
    if (kind === 'boss') {
      const an = G.s.campaign.analysis[stageKey(z, s)] ?? 0;
      const kl = BAL.bosses[z - 1]?.kl ?? 1;
      const at = label(`ANÁLISIS DEL JEFE ${Math.round(an * 100)}% · Reino recomendado ${kl}${G.s.kl >= kl ? ' (listo)' : ` (tienes ${G.s.kl})`}`, 14, an > 0 ? C.red : P.blue);
      at.position.set(pad, y);
      content.addChild(at);
      y += 26;
    }

    // loot preview
    const lp = lootPreview(z, s);
    const lt = label(lp.frontier ? 'BOTÍN PREVISTO' : 'BOTÍN PREVISTO (ETAPA GANADA ×0.7)', 13, P.blue, { letterSpacing: 2 });
    lt.position.set(pad, y);
    content.addChild(lt);
    y += 22;
    const chips: Container[] = [
      resChip('gold', `≈${fmt(lp.gold)}`),
      resChip('scrap', `${lp.scrap}`),
      resChip('crystal', `${lp.crystals.n} ${elNameCap(lp.crystals.el)}`, true, 26, elementFx(elKey(lp.crystals.el)).main),
    ];
    if (lp.blueprintChance > 0) chips.push(resChip('blueprint', lp.blueprintChance >= 1 ? `×${lp.blueprints}` : `${Math.round(lp.blueprintChance * 100)}%`));
    if (lp.gems) chips.push(resChip('gem', `${lp.gems}`));
    let cx = pad;
    for (const c of chips) {
      if (cx + c.width > W0 - pad) {
        cx = pad;
        y += 36;
      }
      c.position.set(cx, y);
      content.addChild(c);
      cx += c.width + 22;
    }
    y += 44;
    if (kind === 'boss' && lp.frontier && z === 1) {
      const nw = label('+ ¿un elemento que nadie ha visto? (rumor de taberna)', 14, C.red, { fontStyle: 'italic' });
      nw.position.set(pad, y - 6);
      content.addChild(nw);
      y += 22;
    }

    // buttons
    if (state === 'locked') {
      const lk = stamp('BLOQUEADA', P.blue, 30, -0.05);
      lk.position.set(W0 / 2, y + 30);
      const why = label('Gana la etapa anterior para zarpar aquí.', 15, P.blue);
      why.anchor.set(0.5, 0);
      why.position.set(W0 / 2, y + 62);
      content.addChild(lk, why);
      y += 100;
    } else {
      const go = new Button('¡ZARPAR!', async () => {
        this.o.onClose();
        const { openPreBattle } = await import('./PreBattle');
        openPreBattle(z, s);
      }, { w: state === 'cleared' ? 230 : inner, h: 76, size: 40, color: kind === 'boss' ? C.red : C.pink, textColor: kind === 'boss' ? C.paper : C.ink });
      go.position.set(pad, y);
      content.addChild(go);
      if (state === 'cleared') {
        const can = canQuickAssault(z, s);
        const qa = new Button('ASALTO RÁPIDO', () => this.o.onQuick(), { w: inner - 250, h: 76, size: 30, color: C.yellow, disabled: !can });
        qa.position.set(pad + 250, y);
        content.addChild(qa);
        y += 88;
        const note = label(can ? 'Gana al instante (5 s) con el botín de la etapa.' : `Asalto Rápido: necesitas ventaja ×${QUICK_ASSAULT_RATIO} (tienes ×${ratio.toFixed(2)}).`, 13, can ? 0x2e8a52 : P.blue);
        note.position.set(pad, y);
        content.addChild(note);
        y += 24;
      } else y += 88;
    }
    y += 14;
    this.ch = y;
    const bg = clipping(W0, y, { seed: z * 10 + s });
    // close X
    const x = new Container();
    const xg = new Graphics().circle(0, 0, 20).fill(C.ink);
    const xt = txt('×', { fontFamily: F.ui, fontWeight: '700', fontSize: 30, fill: P.aged });
    xt.anchor.set(0.5, 0.55);
    x.addChild(xg, xt);
    x.position.set(W0 - 8, 8);
    x.eventMode = 'static';
    x.cursor = 'pointer';
    x.on('pointertap', () => {
      sfx('click');
      this.o.onClose();
    });
    this.addChild(bg, content, x);
  }

  show() {
    this.pivot.set(this.cw / 2, this.ch / 2);
    this.x += this.cw / 2;
    this.y += this.ch / 2;
    this.rotation = (Math.random() - 0.5) * 0.03;
    gsap.from(this.scale, { x: 0.85, y: 0.85, duration: 0.22, ease: 'back.out(2.2)' });
    gsap.from(this, { alpha: 0, duration: 0.15 });
  }

  hide() {
    gsap.to(this, {
      alpha: 0,
      duration: 0.14,
      onComplete: () => {
        killTree(this);
        this.destroy({ children: true });
      },
    });
  }
}
