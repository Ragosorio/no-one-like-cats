/**
 * Parte II · Oleada 4 — how the battle screen SHOWS the O4 rules (pure presentation; the rules live in battle/suenos.ts
 * and battle/umbral.ts and never read anything from here).
 *
 *   o4Chips(sim)            RuleStrip chips [enemy strip, your strip]: the dream now and when it changes; CORRECCIÓN,
 *                           TACHÓN (your crossed-out element, hot), VIENTO LOCO, CAOS, LA MANO, EN SERIO
 *   o4Banner(overlay, sim, e)  the banner of the sim events `boss:'sueno'` (a new dream) and `boss:'umbral'` (the
 *                           Correctores' rules / an Umbral phase): a slanted band with the shout and one line under it.
 *                           Non-blocking (the turn goes on while it reads), gentle with Reducir movimiento.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import type { Battle, BattleEvent } from '../sim';
import { dreamChips, dreamInfo, dreamState } from '../suenos';
import { umChips, umRules } from '../umbral';
import { currentFase, fasesState } from '../fases';
import { iconText } from '../../ui/elementIcon';
import { poster } from '../../ui/widgets';
import { C, F } from '../../ui/theme';
import { W, H } from '../../core/App';
import { settings } from '../../core/settings';
import { sfx } from '../../core/audio';

type Chip = { text: string; color: number; ink?: number; hot?: boolean };
export function o4Chips(sim: Battle): [Chip[], Chip[]] {
  const [ue, up] = umChips(sim);
  return [[...dreamChips(sim), ...ue], up];
}

let live: Container | null = null;
export function o4Banner(overlay: Container, sim: Battle, e: Extract<BattleEvent, { k: 'boss' }>) {
  let kicker = '';
  let title = '';
  let line = '';
  let color: number = C.yellow;
  if (e.what === 'sueno') {
    const v = dreamState(sim);
    if (!v?.rule) return;
    const info = dreamInfo(v.rule, (sim.cfg.rules?.dream?.el as string) ?? 'fire');
    kicker = (e.n ?? 0) === 0 ? 'EL MAR SUEÑA…' : 'EL SUEÑO CAMBIA…';
    title = info.name;
    line = info.line;
    color = info.color;
  } else {
    const r = umRules(sim);
    const f = currentFase(sim);
    const fs = fasesState(sim);
    if (f && fs && fs.count > 1) {
      kicker = `FASE ${fs.idx + 1}/${fs.count} · ${f.name.toUpperCase()}`;
      title = r?.name ?? f.name.toUpperCase();
      line = f.telegraph ?? r?.line ?? '';
    } else {
      kicker = 'REGLAS DE LOS CORRECTORES';
      title = r?.name ?? '';
      line = [r?.correct ? `CORRECCIÓN: reparan ${r.correct.cells} celdas por turno.` : '', r?.tachon ? `TACHÓN: tu mejor elemento del turno pega ×${r.tachon.mul} el siguiente.` : ''].filter(Boolean).join(' ');
    }
    color = 0xf4f4f0;
  }
  if (!title) return;
  if (live && !live.destroyed) live.destroy({ children: true });
  const rm = settings.reduceMotion;
  const band = new Container();
  const g = new Graphics().rect(-300, -70, W + 600, 140).fill(C.ink).stroke({ width: 6, color });
  g.rotation = -0.04;
  const k = poster(kicker, 34, color, { stroke: { color: C.ink, width: 6 } });
  k.anchor.set(0.5);
  k.position.set(W / 2, -92);
  const t = poster(title, 80, color, { stroke: { color: C.ink, width: 10 } });
  t.anchor.set(0.5);
  t.position.set(W / 2, 0);
  t.rotation = -0.04;
  if (t.width > W - 120) t.scale.set((W - 120) / t.width);
  band.addChild(g, k, t);
  if (line) {
    const body = iconText(line, { fontFamily: F.ui, fontWeight: '700', fontSize: 28, fill: C.paper }, { wrap: 1100 });
    const bw = body.width + 48;
    const bg = new Graphics().roundRect(-bw / 2, 0, bw, body.height + 24, 14).fill({ color: C.ink, alpha: 0.88 });
    body.position.set(-body.width / 2, 12);
    const card = new Container();
    card.addChild(bg, body);
    card.position.set(W / 2, 84);
    band.addChild(card);
  }
  g.position.set(0, 0);
  band.position.set(0, H / 2 - 170);
  overlay.addChild(band);
  live = band;
  sfx('sting');
  if (!rm) {
    gsap.from(g.scale, { x: 0, duration: 0.22, ease: 'power3.out' });
    gsap.from(t.scale, { x: t.scale.x * 1.8, y: t.scale.y * 1.8, duration: 0.25, ease: 'back.out(2)' });
  } else gsap.from(band, { alpha: 0, duration: 0.25 });
  gsap.to(band, {
    alpha: 0,
    delay: 2.6,
    duration: 0.35,
    onComplete: () => {
      if (!band.destroyed) band.destroy({ children: true });
      if (live === band) live = null;
    },
  });
}
