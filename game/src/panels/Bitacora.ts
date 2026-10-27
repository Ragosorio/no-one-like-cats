/**
 * LA BITÁCORA DE LA FARERA — the minimal Bitácora of the Parte III vertical slice (docs/part-iii/03 §3–4, 11 §2 A4).
 *
 *   showMissionCard(layer, m, 'new')    the card when a Parte III story mission appears: PASA · IMPORTA · QUEREMOS · AHÍ
 *   showMissionCard(layer, m, 'done')   …and when it's done: CAMBIÓ, written by hand (+ the prize, small, at the bottom)
 *   showP3Card(id, phase)               the same, for a flow that holds the screen (C: between the bar and the street);
 *                                       marks the card's beat key so the story director never shows it twice
 *   missionCardBlock(m, w)              the card inside MISIONES (instead of Luzterna's signed line)
 *   openBitacora()                      the notebook: the cards of the Parte III missions met so far, in order
 *   playUltimaVez(layer)                «La última vez…» when you come back after 8 h or more (2–3 CAMBIÓ lines)
 *
 * Always the same piece of UI, in her hand (F.brush, blue ink on ruled paper). It never says WHY in terms of prizes:
 * the prize is the last, smallest line. Everything here is presentation; what to show comes from the save
 * (state/sys/gaterasWorld.ts) and the data (data/gateras/historia.json › card).
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { sfx } from '../core/audio';
import { fmt } from '../core/format';
import { settings } from '../core/settings';
import { G } from '../state/game';
import { beatSeen, markBeat } from '../state/ext/story';
import { checkMissions, lastRewards, type MissionReward } from '../state/sys/missions';
import { MISSION_BY_ID, type MissionCard, type MissionDef } from '../data/content';
import { bitacoraEntries, caneloSinLlama, luzternaFallecida, ultimaVez } from '../state/sys/gaterasWorld';
import { llamaLabel, loQueQuedoDue, markQuedo, payPremiosFinal } from '../state/sys/finalState';
import { DEUDA_FALSA } from '../film/films/final/deuda';
import { cardKey } from '../ui/story/gaterasScript';
import { clean } from '../ui/story/text';
import { C, F } from '../ui/theme';
import { poster, txt } from '../ui/widgets';
import { Modal } from '../ui/modal';
import { followView, screenRect } from '../ui/screen';
import { hush } from '../ui/hush';
import { storyLayer } from '../ui/dialog';
import { destroyDeep } from '../ui/story/tweens';
import { markToastAvoid } from '../ui/toastAvoid';

// ------------------------------------------------------------------ the notebook's look
export const PAPER = 0xf6efdc;
export const INK = C.inkBlue;
const RULE = 0x7fa6c9;
const MARGIN = C.red;
export const FIELDS: [keyof MissionCard, string][] = [
  ['pasa', 'PASA'],
  ['importa', 'IMPORTA'],
  ['queremos', 'QUEREMOS'],
  ['ahi', 'AHÍ'],
];

/** what the mission pays, said small (never as the reason) */
export function rewardLine(m: MissionDef, r?: MissionReward | null): string {
  const bits: string[] = [];
  if (r) {
    if (r.gold) bits.push(`+${fmt(r.gold)} oro`);
    if (r.food) bits.push(`+${fmt(r.food)} comida`);
    if (r.gems) bits.push(`+${r.gems} gemas`);
    if (r.orbs) bits.push(`+${r.orbs.n} orbes`);
  } else {
    const gems = Number(m.reward?.gems ?? 0);
    if (m.reward?.std) bits.push('oro y comida');
    if (gems) bits.push(`${gems} gemas`);
  }
  return bits.length ? `${r ? 'Premio' : 'Al final'}: ${bits.join(' · ')}` : '';
}

/** a sheet of ruled notebook paper (w × h), with a red margin and a strip of tape on top */
function sheet(w: number, h: number, o: { tape?: boolean; rot?: number } = {}): Container {
  const c = new Container();
  const g = new Graphics();
  g.rect(12, 14, w, h).fill({ color: C.ink, alpha: 0.85 });
  g.rect(0, 0, w, h).fill(PAPER).stroke({ width: 4, color: C.ink, alignment: 1 });
  for (let y = 96; y < h - 16; y += 52) g.moveTo(18, y).lineTo(w - 18, y).stroke({ width: 2, color: RULE, alpha: 0.5 });
  g.moveTo(84, 8).lineTo(84, h - 8).stroke({ width: 2, color: MARGIN, alpha: 0.45 });
  // a drop of candle wax (the Carta's notebook, 05 §1.1)
  g.ellipse(w - 70, h - 46, 22, 14).fill({ color: 0xe9dcb8, alpha: 0.8 });
  c.addChild(g);
  if (o.tape !== false) {
    const t = new Graphics().rect(-70, -18, 140, 36).fill({ color: 0xf3e3a2, alpha: 0.85 });
    t.position.set(w / 2, 0);
    t.rotation = -0.04;
    c.addChild(t);
  }
  c.rotation = o.rot ?? -0.018;
  return c;
}

const label = (s: string, size = 26) => txt(s, { fontFamily: F.bebas, fontSize: size, fill: C.pinkHot, letterSpacing: 3 });
const hand = (s: string, size = 34, width = 600) => txt(clean(s), { fontFamily: F.brush, fontSize: size, fill: INK, wordWrap: true, wordWrapWidth: width, lineHeight: size * 1.35, padding: 8 });
/**
 * ⚠️ Parte III · EL FINAL: after her death the notebook changes hands (08 §6.2; guiones/final). H93's CAMBIÓ is still
 * hers, trembling («SIN LLAMA.»); H94's card she starts that night and the Capi finishes (CAMBIÓ); from H95 on, all of it
 * is the Capi's: another pen (ARTE may swap the face here, one place).
 */
export const CAPI_HAND = { fontFamily: F.serif, fontStyle: 'italic' as const, fill: 0x1d2433, scale: 0.92 };
export type Hand = 'ella' | 'temblando' | 'capi';
export function handOf(missionId: string, field: keyof MissionCard): Hand {
  const n = Number(missionId.slice(1));
  if (!/^H\d+$/.test(missionId) || n < 93) return 'ella';
  if (n === 93) return field === 'cambio' ? 'temblando' : 'ella';
  if (n === 94) return field === 'cambio' ? 'capi' : 'ella';
  return 'capi';
}
/** a field written by the hand that wrote it */
function handFor(who: Hand, s: string, size = 34, width = 600): Text {
  if (who === 'capi') {
    const z = Math.round(size * CAPI_HAND.scale);
    return txt(clean(s), { fontFamily: CAPI_HAND.fontFamily, fontStyle: CAPI_HAND.fontStyle, fontSize: z, fill: CAPI_HAND.fill, wordWrap: true, wordWrapWidth: width, lineHeight: z * 1.4, padding: 8 });
  }
  const t = hand(s, size, width);
  // her hand, trembling: the letters lean and wobble (the rain ran the ink)
  if (who === 'temblando') {
    t.skew.set(0.06, -0.03);
    t.rotation = 0.02;
  }
  return t;
}


/** a line written by hand: revealed left → right by a growing mask (instant with reduced motion). `live` collects
 *  the tween so a tap can finish it at once (progress(1) → the mask goes, the promise resolves) */
function writeIn(t: Text, dur: number, live?: gsap.core.Tween[]): Promise<void> {
  if (settings.reduceMotion || dur <= 0) return Promise.resolve();
  const m = new Graphics().rect(0, -10, 1, t.height + 20).fill(0xffffff);
  m.position.set(t.x, t.y);
  t.parent?.addChild(m);
  t.mask = m;
  const o = { k: 0 };
  let last = 0;
  return new Promise<void>((res) => {
    const tw = gsap.to(o, {
      k: 1,
      duration: dur,
      ease: 'none',
      onUpdate: () => {
        if (m.destroyed) return;
        m.clear().rect(0, -10, Math.max(1, (t.width + 20) * o.k), t.height + 20).fill(0xffffff);
        if (o.k - last > 0.12) {
          last = o.k;
          sfx('tick', 1.4 + Math.random() * 0.3);
        }
      },
      onComplete: () => {
        if (!t.destroyed) t.mask = null;
        if (!m.destroyed) m.destroy();
        res();
      },
    });
    live?.push(tw);
  });
}

// ------------------------------------------------------------------ the card (blocking)
let cardOpen = false;
/** a mission card is on screen (the story director and the flows wait for it) */
export const missionCardShowing = () => cardOpen;

// warm up the prologue's scenes while H66's card is up (09 §5 C-3: scenes preload during the card). Optional:
// a glob, so this builds before C's flow exists.
const PREFETCH = import.meta.glob('../app/gaterasFlow.ts');
function prefetch(id: string) {
  if (id !== 'H66') return;
  const load = PREFETCH['../app/gaterasFlow.ts'];
  if (load) void load().catch(() => undefined);
}

/**
 * The Bitácora opens to this mission's card. 'new': the four fields, written one after the other. 'done': the four
 * fields faded, the kicker (if any), CAMBIÓ written by hand, the prize small at the bottom. Resolves on a tap
 * (the first tap finishes the writing), Enter, Space or Esc.
 */
export async function showMissionCard(layer: Container, m: MissionDef, phase: 'new' | 'done', o: { reward?: MissionReward | null } = {}): Promise<void> {
  const card = m.card;
  if (!card) return;
  cardOpen = true;
  hush('p3_card', true);
  prefetch(m.id);
  const root = new Container();
  root.label = 'p3MissionCard';
  layer.addChild(root);
  const dim = screenRect({ color: C.ink, alpha: 0.55 });
  dim.eventMode = 'static';
  root.addChild(dim);
  const done = phase === 'done';
  const CW = 980;
  const CH = done ? 700 : 600;
  const page = sheet(CW, CH);
  const holder = new Container();
  holder.addChild(page);
  root.addChild(holder);
  markToastAvoid(holder);
  followView(root, (v) => {
    const k = Math.min(1, (v.w * 0.94) / (CW + 40), (v.h * 0.94) / (CH + 40));
    holder.scale.set(Math.max(0.5, k));
    holder.position.set(v.x + (v.w - CW * holder.scale.x) / 2, v.y + (v.h - CH * holder.scale.y) / 2);
  });
  // header
  const head = txt(handOf(m.id, 'pasa') === 'capi' ? 'BITÁCORA' : 'BITÁCORA DE LA FARERA', { fontFamily: F.bebas, fontSize: 24, fill: INK, letterSpacing: 5 });
  head.alpha = 0.7;
  head.position.set(108, 22);
  const id = txt(m.id, { fontFamily: F.bebas, fontSize: 24, fill: INK, letterSpacing: 3 });
  id.alpha = 0.6;
  id.anchor.set(1, 0);
  id.position.set(CW - 30, 22);
  const title = poster(m.title.toUpperCase(), 54, C.ink);
  title.position.set(106, 44);
  if (title.width > CW - 150) title.scale.set((CW - 150) / title.width);
  page.addChild(head, id, title);
  // the four fields
  const rows: Text[] = [];
  let y = 140;
  for (const [k, l] of FIELDS) {
    const lt = label(l);
    lt.position.set(106, y + 8);
    const vt = handFor(handOf(m.id, k), String(card[k] ?? ''), 34, CW - 330);
    vt.position.set(290, y);
    page.addChild(lt, vt);
    rows.push(vt);
    if (done) {
      lt.alpha = 0.45;
      vt.alpha = 0.45;
    }
    y += Math.max(78, vt.height + 18);
  }
  // CAMBIÓ (done)
  let cambio: Text | null = null;
  if (done) {
    if (card.kicker) {
      const kb = new Container();
      const kt = poster(card.kicker.toUpperCase(), 28, C.ink);
      const kg = new Graphics().rect(-14, -4, kt.width + 28, kt.height + 8).fill(C.yellow).stroke({ width: 3, color: C.ink });
      kb.addChild(kg, kt);
      kb.position.set(106, y + 4);
      kb.rotation = -0.012;
      if (kb.width > CW - 150) kb.scale.set((CW - 150) / kb.width);
      page.addChild(kb);
      y += 58;
    }
    const lt = label('CAMBIÓ', 34);
    lt.position.set(106, y + 10);
    cambio = handFor(handOf(m.id, 'cambio'), card.cambio, 44, CW - 330);
    cambio.position.set(290, y);
    page.addChild(lt, cambio);
    y += Math.max(84, cambio.height + 20);
  }
  // the prize, small, last
  const rl = rewardLine(m, done ? (o.reward ?? lastRewards.get(m.id) ?? null) : null);
  if (rl) {
    const rt = txt(rl, { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.ink });
    rt.alpha = 0.6;
    rt.position.set(106, CH - 48);
    page.addChild(rt);
  }
  const hint = txt('toca para seguir', { fontFamily: F.ui, fontSize: 16, fill: C.ink });
  hint.alpha = 0;
  hint.anchor.set(1, 0);
  hint.position.set(CW - 30, CH - 44);
  page.addChild(hint);

  // in
  sfx('paper');
  if (!settings.reduceMotion) {
    gsap.from(holder, { y: holder.y + 70, alpha: 0, duration: 0.35, ease: 'back.out(1.5)' });
    dim.alpha = 0;
    gsap.to(dim, { alpha: 1, duration: 0.25 });
  }
  let finished = false;
  let skip = false;
  const live: gsap.core.Tween[] = [];
  // the fields not written yet stay hidden until the hand gets there
  const pending = done ? (cambio ? [cambio] : []) : rows;
  if (!settings.reduceMotion) for (const t of pending) t.visible = false;
  const write = async () => {
    await wait(0.35);
    for (const r of pending) {
      r.visible = true;
      if (skip) continue;
      await writeIn(r, done ? Math.min(2, 0.4 + r.text.length * 0.05) : Math.min(1.2, 0.25 + r.text.length * 0.028), live);
    }
    finished = true;
    if (!hint.destroyed) gsap.to(hint, { alpha: 0.6, duration: 0.3 });
  };
  const writing = write();
  await new Promise<void>((res) => {
    const tap = () => {
      if (!finished) {
        // first tap: the hand finishes at once
        skip = true;
        for (const tw of live) tw.progress(1);
        for (const t of pending) t.visible = true;
        return;
      }
      off();
      res();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        tap();
      }
    };
    const off = () => {
      window.removeEventListener('keydown', key);
      dim.off('pointertap', tap);
      holder.off('pointertap', tap);
    };
    root.eventMode = 'static';
    dim.on('pointertap', tap);
    holder.eventMode = 'static';
    holder.on('pointertap', tap);
    window.addEventListener('keydown', key);
  });
  await writing.catch(() => undefined);
  // out
  sfx('click', 1.2);
  await new Promise<void>((res) => {
    if (settings.reduceMotion || root.destroyed) return res();
    gsap.to(root, { alpha: 0, duration: 0.22, onComplete: () => res() });
    window.setTimeout(res, 600);
  });
  destroyDeep(root);
  hush('p3_card', false);
  cardOpen = false;
}
const wait = (s: number) => new Promise<void>((r) => window.setTimeout(r, s * 1000));

/**
 * For a flow that holds the screen (C's bar → street): show this card now, unless it was already shown, and mark it
 * so the story director doesn't show it again. Safe to call twice; resolves at once for a mission without a card.
 */
export async function showP3Card(id: string, phase: 'new' | 'done'): Promise<void> {
  const key = cardKey(id, phase);
  const m = MISSION_BY_ID.get(id);
  if (!m?.card || beatSeen(key)) return;
  // a goal just met (G.count) completes on the next mission check: do it now, so CAMBIÓ shows the real prize
  if (phase === 'done') checkMissions();
  markBeat(key);
  G.save();
  await showMissionCard(storyLayer(), m, phase);
}

// ------------------------------------------------------------------ inside MISIONES
/** the card as a block inside a mission's entry (MISIONES): her four fields, and CAMBIÓ once it's done */
export function missionCardBlock(m: MissionDef, w: number, done = false): Container {
  const c = new Container();
  const card = m.card;
  if (!card) return c;
  const bg = new Graphics();
  c.addChild(bg);
  let y = 10;
  const fields: [string, string, keyof MissionCard][] = FIELDS.map(([k, l]) => [l, String(card[k] ?? ''), k]);
  if (done) fields.push(['CAMBIÓ', card.cambio, 'cambio']);
  for (const [l, v, k] of fields) {
    const lt = txt(l, { fontFamily: F.bebas, fontSize: 15, fill: C.pinkHot, letterSpacing: 2 });
    lt.position.set(12, y + 3);
    const capi = handOf(m.id, k) === 'capi';
    const vt = txt(clean(v), capi ? { fontFamily: CAPI_HAND.fontFamily, fontStyle: CAPI_HAND.fontStyle, fontSize: 16, fill: CAPI_HAND.fill, wordWrap: true, wordWrapWidth: w - 112, lineHeight: 22, padding: 6 } : { fontFamily: F.brush, fontSize: 17, fill: INK, wordWrap: true, wordWrapWidth: w - 112, lineHeight: 22, padding: 6 });
    vt.position.set(96, y);
    c.addChild(lt, vt);
    y += Math.max(26, vt.height + 4);
  }
  y += 6;
  bg.rect(0, 0, w, y).fill(PAPER).stroke({ width: 2.5, color: C.ink });
  bg.moveTo(88, 4).lineTo(88, y - 4).stroke({ width: 1.5, color: MARGIN, alpha: 0.4 });
  return c;
}

// ------------------------------------------------------------------ the notebook
/** LA BITÁCORA: the cards of the Parte III missions met so far (the last four, in story order) */
export function openBitacora(): Modal {
  const m = new Modal('Bitácora', 1560, 900, { band: INK, bandText: PAPER, subtitle: luzternaFallecida() ? 'Su cuaderno. Ahora lo escribes tú' : 'El cuaderno de la farera' });
  m.label = 'Bitácora';
  // ⚠️ EL FINAL: Canelo's ficha («CANELO · SIN LLAMA» the night of H94, in her hand; «CANELO · LLAMA 30 %» after)
  const fl = llamaLabel();
  if (fl) {
    const f = handFor(caneloSinLlama() ? 'ella' : 'capi', `CANELO · ${fl}`, 22, 600);
    f.anchor.set(1, 0);
    f.position.set(m.innerW - 10, m.innerH - 30);
    m.body.addChild(f);
    // pasada 7 (deuda falsa pagada): from the dawn of H94, under it, in HER hand — it stays after her death, like «SIN
    // LLAMA»: what she wrote down that morning (h94-sin-llama.md A4b)
    if (DEUDA_FALSA && !caneloSinLlama() && (beatSeen('b94_amanecer') || luzternaFallecida() || G.s.missions.done.includes('H94'))) {
      const d = handFor('ella', 'Me debe un vidrio.', 20, 600);
      d.anchor.set(1, 0);
      d.position.set(m.innerW - 10, m.innerH - 30 + f.height - 4);
      m.body.addChild(d);
      f.position.y -= d.height - 2;
      d.position.y = f.position.y + f.height - 4;
    }
  }
  // «Lo que quedó» (h96-el-recado.md): the first time the notebook opens after «Continuará», a sheet comes loose from
  // behind the map — her hidden list and the little envelope; the finale's prizes arrive here, in silence
  if (loQueQuedoDue()) {
    markQuedo();
    payPremiosFinal();
    G.save();
    void import('../ui/story/finalUi').then((u) => u.loQueQuedo());
  }
  const entries = bitacoraEntries();
  const shown = entries.slice(-4);
  const colW = (m.innerW - 40) / 2;
  if (!shown.length) {
    const t = hand('Todavía no escribo nada. Ya habrá.', 40, m.innerW - 80);
    t.position.set(40, 60);
    m.body.addChild(t);
  }
  shown.forEach((e, i) => {
    const x = (i % 2) * (colW + 40);
    const y = Math.floor(i / 2) * 380;
    const p = sheet(colW, 350, { tape: false, rot: i % 2 ? 0.008 : -0.01 });
    p.position.set(x, y);
    const ti = poster(e.mission.title.toUpperCase(), 34, C.ink);
    ti.position.set(100, 20);
    if (ti.width > colW - 130) ti.scale.set((colW - 130) / ti.width);
    p.addChild(ti);
    const blk = missionCardBlock(e.mission, colW - 120, e.done);
    blk.position.set(96, 70);
    p.addChild(blk);
    if (!e.done) {
      const st = txt('EN CURSO', { fontFamily: F.bebas, fontSize: 18, fill: C.pinkHot, letterSpacing: 3 });
      st.anchor.set(1, 0);
      st.position.set(colW - 24, 26);
      p.addChild(st);
    }
    m.body.addChild(p);
  });
  if (entries.length > shown.length) {
    const more = txt(`(${entries.length - shown.length} páginas antes)`, { fontFamily: F.brush, fontSize: 22, fill: INK });
    more.alpha = 0.7;
    more.position.set(0, m.innerH - 30);
    m.body.addChild(more);
  }
  m.open();
  return m;
}

// ------------------------------------------------------------------ «La última vez…»
/** the notebook opens by itself: the last 2–3 CAMBIÓ lines. Closes on a tap (or Enter / Esc). */
export async function playUltimaVez(layer: Container = storyLayer()): Promise<void> {
  const lines = ultimaVez();
  if (!lines.length) return;
  hush('p3_card', true);
  const root = new Container();
  root.label = 'p3UltimaVez';
  layer.addChild(root);
  const dim = screenRect({ color: C.ink, alpha: 0.4 });
  dim.eventMode = 'static';
  root.addChild(dim);
  const PW = 860;
  const PH = 150 + lines.length * 74;
  const page = sheet(PW, PH, { rot: 0.012 });
  root.addChild(page);
  markToastAvoid(page);
  followView(root, (v) => page.position.set(v.x + (v.w - PW) / 2, v.y + Math.max(40, (v.h - PH) / 2 - 60)));
  const t = hand('La última vez…', 46, PW - 140);
  t.position.set(106, 26);
  page.addChild(t);
  const rows: Text[] = [];
  lines.forEach((l, i) => {
    const r = hand(`— ${l}`, 32, PW - 150);
    r.position.set(116, 104 + i * 74);
    page.addChild(r);
    rows.push(r);
  });
  sfx('paper');
  if (!settings.reduceMotion) gsap.from(page, { y: page.y - 50, alpha: 0, duration: 0.3, ease: 'back.out(1.6)' });
  void (async () => {
    // closed before the pen finished: the rows are already gone
    for (const r of rows) {
      if (r.destroyed) break;
      await writeIn(r, Math.min(1.4, 0.3 + r.text.length * 0.03));
    }
  })();
  await new Promise<void>((res) => {
    const close = () => {
      window.removeEventListener('keydown', key);
      res();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') close();
    };
    dim.on('pointertap', close);
    page.eventMode = 'static';
    page.on('pointertap', close);
    window.addEventListener('keydown', key);
  });
  sfx('click', 1.2);
  destroyDeep(root);
  hush('p3_card', false);
}

/** dev / console: __bitacora.card('H66', 'new') */
(globalThis as unknown as { __bitacora: unknown }).__bitacora = {
  card: (id: string, phase: 'new' | 'done' = 'new') => {
    const m = MISSION_BY_ID.get(id);
    return m ? showMissionCard(storyLayer(), m, phase) : null;
  },
  open: () => openBitacora(),
  ultima: () => playUltimaVez(),
};
