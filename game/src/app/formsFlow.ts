/**
 * FORMS on screen: when a form unlocks (its flag, e.g. `forma:canelo_almirante` from mission H38) the
 * cat reveal plays with the form's painting, then the toast «¡Canelo Almirante! Cámbialo en su ficha.».
 *
 * - Pending = unlocked and not revealed yet (state/sys/forms.ts), derived from the flags: a live unlock
 *   and an old save that already holds the flag get it the same way, once, on any load.
 * - It waits for a calm moment: island or map, no panel, no dialog, no story panel / cinematic, and
 *   ~2.5 s of quiet so the story's own mission panel and beats go first. Never over a battle.
 * - It grants nothing (the mission paid its reward): replaying it can never pay twice.
 */
import { Container } from 'pixi.js';
import { scenes } from '../core/scenes';
import { H, W } from '../core/App';
import { G } from '../state/game';
import { Modal, toast } from '../ui/modal';
import { dialogActive, storyLayer } from '../ui/dialog';
import { catDef } from '../data/content';
import { applyForm, type FormDef } from '../data/rupturas/formas';
import { formOwner, formRevealsPending, markFormRevealed } from '../state/sys/forms';

/** continuous calm before a reveal starts (lets the story's mission panel + beats play first) */
const CALM_MS = 2500;

let inited = false;
let busy = false;
let calmSince = 0;
let IslandCls: (new (...a: never[]) => unknown) | null = null;
let MapCls: (new (...a: never[]) => unknown) | null = null;

/** install the watcher (idempotent) */
export function initForms() {
  if (inited) return;
  inited = true;
  void import('../scenes/IslandScene').then((m) => (IslandCls = m.IslandScene as never)).catch(() => undefined);
  void import('../scenes/MapScene').then((m) => (MapCls = m.MapScene as never)).catch(() => undefined);
  window.setInterval(() => {
    if (busy) return;
    void pump().catch((e) => console.warn('[forms]', e));
  }, 500);
}

function where(): 'island' | 'map' | 'other' {
  const c = scenes.current;
  if (!c) return 'other';
  const n = c.constructor.name;
  if ((IslandCls && c instanceof IslandCls) || n === 'IslandScene') return 'island';
  if ((MapCls && c instanceof MapCls) || n === 'MapScene') return 'map';
  return 'other';
}

/** nothing else on screen: no panel, no dialog, no story panel, no full-screen sequence, no transition */
function calm(): boolean {
  const w = where();
  if (w !== 'island' && w !== 'map') return false;
  if ((scenes as unknown as { busy?: boolean }).busy || dialogActive()) return false;
  const sl = storyLayer();
  if (sl.children.some((ch) => ch.visible && !ch.destroyed)) return false;
  for (const ch of scenes.overlayLayer.children) {
    if (ch === sl || !ch.visible || ch.destroyed) continue;
    if (ch instanceof Modal && ch.closed) continue;
    return false;
  }
  for (const ch of scenes.fxLayer.children as Container[]) {
    if (!ch.visible || ch.destroyed) continue;
    const b = ch.getBounds();
    if (b.width >= W * 0.9 && b.height >= H * 0.8) return false;
  }
  return true;
}

async function pump() {
  if (!G.s.cats.length) return;
  const pending = formRevealsPending();
  if (!pending.length || !calm()) {
    calmSince = 0;
    return;
  }
  const now = performance.now();
  if (!calmSince) {
    calmSince = now;
    return;
  }
  if (now - calmSince < CALM_MS) return;
  busy = true;
  try {
    await revealForm(pending[0]);
  } finally {
    busy = false;
    calmSince = 0;
  }
}

/** the reveal + toast for one form (also callable from dev tools: `__forms.reveal('canelo_almirante')`) */
export async function revealForm(f: FormDef) {
  // marked first: a crash or a reload mid-sequence never loops it (and it pays nothing anyway)
  markFormRevealed(f.id);
  G.save();
  const def = applyForm(catDef(f.species), f.id);
  const owner = formOwner(f);
  const who = owner && owner.name !== catDef(f.species).name ? `${owner.name}, ` : '';
  const { playCatReveal } = await import('../fx/sequences/catReveal');
  await playCatReveal(scenes.fxLayer, {
    slug: f.slug,
    name: f.name,
    elements: def.elements,
    rarity: def.rarity,
    species: f.species,
    kicker: 'EVOLUCIÓN · FORMA NUEVA',
    caption: f.caption,
    subtitle: `${who}${f.epithet} · ${def.battleForm.cry}`,
    chips: f.chips,
    replay: true,
  });
  toast(`¡${f.name}! Cámbialo en su ficha.`, { icon: 'paw', sub: 'Toca al gato › FORMA. Es gratis y el de siempre no se pierde.', dur: 4 });
}

(globalThis as unknown as { __forms: unknown }).__forms = {
  reveal: (id: string) => {
    const f = formRevealsPending().find((x) => x.id === id);
    return f ? revealForm(f) : null;
  },
};
