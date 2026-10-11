/**
 * PROMPTS — the on-beat inputs, drawn in the Momentos style (never the game's paper UI).
 *
 * Every prompt appears ONE BAR before its beat (spec.lead) at its anchor (default: low centre), with an approach ring
 * that closes exactly on the beat. Shapes: tap = disc · hold = disc + a fill arc to `until` · mash = a fat pulsing
 * button with a gauge · choice = two arrow plates. The first prompt of each kind carries its verb («TOCA», «MANTÉN»,
 * «¡DALE!», «◀ ▶»); later ones only their 1–3 word label if the score gives one. Judgements pop a short splash:
 * ¡PERFECTO! / ¡BIEN! / a small grey «…» (a miss never shouts). Optional (bonus) prompts are dashed and smaller.
 * With no sound the rings also pulse on every beat (the picture carries the rhythm).
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { MomentoCore, PromptState } from '../core';
import type { Judgement } from '../types';
import { GREAT_S, HIT_S } from '../score';
import { W, H, type Kit } from './kit';
import { KATA_STYLE, SFX_STYLE } from './fx';
import { starPts } from './draw';

const DEFAULT_AT: [number, number] = [W / 2, H - 175];
const VERB: Record<string, string> = { tap: 'TOCA', hold: 'MANTÉN', mash: '¡DALE!', choice: '◀  ▶' };
const KEYHINT: Record<string, string> = { tap: 'ESPACIO · CLIC', hold: 'MANTÉN ESPACIO', mash: 'ESPACIO MUCHAS VECES', choice: '← → · TOCA UN LADO' };
/**
 * The prompt colors. A stage may restyle them (StageApi.promptTheme, retro-compatible: NEÓN CEL's are the default) —
 * WHEN I LOSE draws them in ink, paper and gold.
 */
export interface PromptTheme {
  ink: number;
  paper: number;
  hot: number;
  body: number;
  mash: number;
  dim: number;
  /** the small katakana under ¡PERFECTO! */
  kata: boolean;
  /** (optional) false = no starburst behind ¡PERFECTO! (YONOSE TODO: just the handwritten word) */
  star?: boolean;
  /** (optional) the judgement words' font (default: the toolkit's poster type) */
  font?: string;
}
export const NEON_PROMPTS: PromptTheme = { ink: 0x120b2e, paper: 0xfff8ec, hot: 0xffe14a, body: 0x3b1a6b, mash: 0xff2e88, dim: 0x9a92b0, kata: true };
/** the live theme (one Momento plays at a time; set when its prompt layer is built) */
let T: PromptTheme = NEON_PROMPTS;
const HINT_STYLE = () => ({ fontFamily: 'Space Grotesk', fontWeight: '700' as const, fontSize: 22, fill: T.paper, stroke: { color: T.ink, width: 6 }, letterSpacing: 3 });

interface View {
  s: PromptState;
  c: Container;
  g: Graphics;
  label: Sprite | null;
  hint: Sprite | null;
  pulse: number;
}
interface Splash {
  c: Container;
  t0: number;
}

export class PromptUI {
  private views = new Map<string, View>();
  private splashes: Splash[] = [];
  private taught = new Set<string>();
  constructor(
    private k: Kit,
    private core: MomentoCore,
  ) {
    T = { ...NEON_PROMPTS, ...(k.stage?.promptTheme ?? {}) };
    // bake every label, hint and splash now: a word textured on the frame its prompt appears costs 50–150 ms
    for (const p of k.score.prompts) {
      const text = p.spec.label ?? VERB[p.type];
      if (text) k.text.get(text, SFX_STYLE(p.type === 'mash' ? 40 : 28, T.paper, T.ink));
    }
    for (const hint of Object.values(KEYHINT)) k.text.get(hint, HINT_STYLE());
    k.text.get('¡PERFECTO!', SFX_STYLE(46, T.paper, T.ink));
    k.text.get('¡BIEN!', SFX_STYLE(40, T.hot, T.ink));
    k.text.get('…', SFX_STYLE(44, T.dim, T.ink));
    if (T.kata) k.text.get('最高', KATA_STYLE(30, T.ink, T.paper));
    if (T.font) for (const [w, sz, f] of [['¡PERFECTO!', 46, T.hot], ['¡BIEN!', 40, T.hot], ['…', 44, T.dim]] as const) k.text.get(w, { fontFamily: T.font, fontSize: sz, fill: f, stroke: { color: T.paper, width: 6 } });
  }

  private at(s: PromptState): [number, number] {
    const a = s.p.spec.anchor;
    if (Array.isArray(a)) return a;
    if (typeof a === 'string') return this.k.stage.anchor?.(a, this.k) ?? DEFAULT_AT;
    return DEFAULT_AT;
  }

  update(m: number) {
    const k = this.k;
    const vis = new Set<string>();
    for (const s of this.core.visible(m)) {
      if (s.done) continue;
      vis.add(s.p.id);
      let v = this.views.get(s.p.id);
      if (!v) v = this.create(s);
      // anchors are live: a prompt rides its cannonball / its character across the shot
      const [ax, ay] = this.at(s);
      v.c.position.set(ax, ay);
      // under a full-frame shot a prompt shows only if that shot placed it (else it would float over the wrong picture)
      const anc = s.p.spec.anchor;
      v.c.visible = !this.k.fullFrame || (typeof anc === 'string' && this.k.anchorOwned(anc)) || Array.isArray(anc) || anc === undefined;
      this.draw(v, m);
    }
    for (const [id, v] of this.views) {
      if (vis.has(id)) continue;
      v.c.destroy({ children: true });
      this.views.delete(id);
    }
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const sp = this.splashes[i];
      const lt = k.m - sp.t0;
      if (lt > 0.55 || lt < -0.1) {
        sp.c.destroy({ children: true });
        this.splashes.splice(i, 1);
        continue;
      }
      const st = Math.floor(lt * 12);
      sp.c.scale.set(st === 0 ? 1.3 : st === 1 ? 0.95 : 1);
      sp.c.alpha = lt > 0.4 ? (0.55 - lt) / 0.15 : 1;
      sp.c.y += 0.4;
    }
  }

  private create(s: PromptState): View {
    const k = this.k;
    const c = new Container();
    const g = new Graphics();
    c.addChild(g);
    const [x, y] = this.at(s);
    c.position.set(x, y);
    let label: Sprite | null = null;
    let hint: Sprite | null = null;
    const first = !this.taught.has(s.p.type);
    const text = s.p.spec.label ?? (first || s.p.type === 'mash' || s.p.type === 'choice' ? VERB[s.p.type] : '');
    if (text) {
      label = k.text.sprite(text, SFX_STYLE(s.p.type === 'mash' ? 40 : 28, T.paper, T.ink));
      label.y = s.p.type === 'choice' ? 0 : -78;
      c.addChild(label);
    }
    if (first && !s.p.optional) {
      this.taught.add(s.p.type);
      hint = k.text.sprite(KEYHINT[s.p.type], HINT_STYLE());
      hint.y = 84;
      c.addChild(hint);
    }
    k.layers.ui.addChild(c);
    const v: View = { s, c, g, label, hint, pulse: 0 };
    this.views.set(s.p.id, v);
    return v;
  }

  private draw(v: View, m: number) {
    const { s, g } = v;
    const p = s.p;
    const k = this.k;
    g.clear();
    const lead = Math.max(0.2, p.m - p.mShow);
    const toBeat = p.m - m;
    const appear = Math.min(1, (m - p.mShow) / 0.12);
    v.c.alpha = appear;
    const opt = p.optional;
    const R = opt ? 30 : 40;
    // the beat pulse (always a little; strong without sound)
    const beatPh = ((m % k.beat) + k.beat) % k.beat;
    const pulse = (k.silent ? 1 : 0.35) * Math.max(0, 1 - beatPh / (k.beat * 0.35));
    if (p.type === 'choice') {
      const open = m >= p.mShow && m <= p.mEnd;
      for (const side of [-1, 1] as const) {
        const chosen = (s.choice === 'left' && side < 0) || (s.choice === 'right' && side > 0);
        const cx = side * 170;
        const fill = chosen ? T.hot : open ? T.paper : T.dim;
        g.poly([cx - side * 70, -70, cx + side * 60, 0, cx - side * 70, 70]).fill(T.ink);
        g.poly([cx - side * 52, -48, cx + side * 36, 0, cx - side * 52, 48]).fill(fill);
      }
      // the decision ring closes on the decision beat
      const x = Math.max(0, Math.min(1, (p.mEnd - m) / Math.max(0.2, p.mEnd - p.mShow)));
      g.circle(0, 0, 40 + 120 * x).stroke({ width: 8, color: T.hot, alpha: 0.9 });
      return;
    }
    // approach ring → target disc
    const x = Math.max(0, Math.min(1, toBeat / lead));
    const ringR = R + 110 * x;
    if (toBeat > -HIT_S) {
      g.circle(0, 0, ringR + 4).stroke({ width: 9, color: T.ink, alpha: 0.85 });
      g.circle(0, 0, ringR).stroke({ width: 5, color: Math.abs(toBeat) <= GREAT_S ? 0xffffff : T.hot });
    }
    // the target
    const hot = Math.abs(toBeat) <= HIT_S;
    g.circle(0, 0, R + 7).fill(T.ink);
    if (opt) for (let i = 0; i < 12; i += 2) g.arc(0, 0, R + 4, (i / 12) * Math.PI * 2, ((i + 1) / 12) * Math.PI * 2).stroke({ width: 6, color: T.paper });
    g.circle(0, 0, R * (1 + pulse * 0.12)).fill(hot ? T.hot : p.type === 'mash' ? T.mash : T.body);
    g.poly(starPts(0, 0, R * 0.42, R * 0.2, 4, Math.PI / 4)).fill({ color: T.paper, alpha: v.label ? 0 : 0.9 });
    // hold: an arc that fills from the press to `until`
    if (p.type === 'hold' && s.from !== undefined) {
      const f = Math.max(0, Math.min(1, (m - s.from) / Math.max(0.1, p.mEnd - s.from)));
      g.arc(0, 0, R + 18, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2).stroke({ width: 10, color: T.hot });
      if (p.spec.release) {
        const y = Math.max(0, Math.min(1, (p.mEnd - m) / k.bar));
        g.circle(0, 0, R + 30 + 120 * y).stroke({ width: 6, color: 0xffffff, alpha: 0.8 });
      }
    }
    if (p.type === 'hold' && s.from === undefined && m > p.m) {
      g.arc(0, 0, R + 26, -Math.PI / 2, Math.PI * 1.5).stroke({ width: 6, color: 0xffffff, alpha: 0.35 });
    }
    // mash: a gauge + the button jumps on every tap
    if (p.type === 'mash') {
      const need = p.spec.need ?? [6, 12];
      const f = Math.min(1, s.taps / need[1]);
      g.arc(0, 0, R + 20, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2).stroke({ width: 12, color: f >= 1 ? 0xffffff : T.hot });
      v.pulse = Math.max(0, v.pulse - k.dt * 8);
      v.c.scale.set(1 + v.pulse * 0.18);
    }
  }

  /** a press landed on a prompt (mash pulse) */
  pressed(s: PromptState | null) {
    if (!s) return;
    const v = this.views.get(s.p.id);
    if (v && s.p.type === 'mash') v.pulse = 1;
  }

  /** a judgement: the splash */
  judged(s: PromptState, r: Judgement, at: number) {
    const k = this.k;
    if (r === 'left' || r === 'right') return;
    if (s.p.optional && r === 'miss') return;
    const c = new Container();
    const [x, y] = this.at(s);
    // under the ring (the action and its onomatopoeia own the space above)
    c.position.set(x, y + 100);
    const word = (text: string, size: number, fill: number) => (T.font ? k.text.sprite(text, { fontFamily: T.font, fontSize: size, fill, stroke: { color: T.paper, width: 6 } }) : k.text.sprite(text, SFX_STYLE(size, fill, T.ink)));
    if (r === 'great' && T.star === false) c.addChild(word('¡PERFECTO!', 46, T.hot));
    else if (r === 'great') {
      const g = new Graphics().poly(starPts(0, 0, 120, 60, 8, 0.2)).fill(T.ink).poly(starPts(0, 0, 100, 52, 8, 0.2)).fill(T.hot);
      c.addChild(g, k.text.sprite('¡PERFECTO!', SFX_STYLE(46, T.paper, T.ink)));
      g.scale.set(0.78);
      if (T.kata) {
        const kt = k.text.sprite('最高', KATA_STYLE(30, T.ink, T.paper));
        kt.position.set(130, -40);
        c.addChild(kt);
      }
    } else if (r === 'hit') c.addChild(word('¡BIEN!', 40, T.hot));
    else {
      const t = word('…', 44, T.dim);
      c.addChild(t);
    }
    k.layers.ui.addChild(c);
    this.splashes.push({ c, t0: at });
  }

  dispose() {
    for (const v of this.views.values()) v.c.destroy({ children: true });
    for (const s of this.splashes) s.c.destroy({ children: true });
    this.views.clear();
    this.splashes = [];
  }
}
