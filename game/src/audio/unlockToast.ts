/**
 * «NUEVA CANCIÓN EN LA FONOTECA»: a record slides out of its sleeve and spins on a paper card
 * (top-right, non-blocking, ~4.5 s). Once per song (fonoteca.ts › toasted). A new VERSION of a song
 * already in the collection gets the regular toast instead.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, game } from '../core/App';
import { scenes } from '../core/scenes';
import { settings } from '../core/settings';
import { C, F } from '../ui/theme';
import { poster, txt } from '../ui/widgets';
import { toast } from '../ui/modal';
import { followView } from '../ui/screen';
import { overlaps, toastAvoidRects } from '../ui/toastAvoid';
import { drawCover, drawVinyl } from './cover';
import { resolveTrack, trackById } from './catalog';
import type { UnlockEvent } from './fonoteca';
import { versionsToast } from './versionsToast';
import { hushed } from '../ui/hush';

const queue: UnlockEvent[] = [];
let showing = false;

export function prettyId(id: string) {
  return id.replace(/[._-]+/g, ' ').trim().toUpperCase();
}

// new VERSIONS that arrive together (a save loading, a Momento's unlocks) make ONE toast, not a pile of them
const versions: string[] = [];
let versionsT: ReturnType<typeof setTimeout> | null = null;
const VERSIONS_WINDOW_MS = 700;
function flushVersions() {
  versionsT = null;
  const titles = versions.splice(0);
  if (!titles.length) return;
  const t = versionsToast(titles);
  toast(t.text, { icon: 'star', sub: t.sub, color: C.mint, dur: titles.length > 1 ? 3.4 : undefined });
}

export function showUnlock(e: UnlockEvent) {
  const track = trackById(e.song);
  if (!e.firstOfSong) {
    const r = resolveTrack(e.ref);
    const title = r?.title ?? prettyId(e.ref);
    if (!versions.includes(title)) versions.push(title);
    if (versionsT) clearTimeout(versionsT);
    versionsT = setTimeout(flushVersions, VERSIONS_WINDOW_MS);
    return;
  }
  queue.push(e);
  if (!showing) next();
  void track;
}

/** the record card's corner is covered by something being read (an open panel, a dialog): wait for it (≤ 15 s) */
function cornerBusy(): boolean {
  const v = game.view;
  const zone = { x: v.x + v.w - 40 - 620, y: v.y + 168, w: 620, h: 178 };
  return toastAvoidRects(scenes.fxLayer).some((r) => overlaps(zone, r));
}
function next(waited = 0) {
  // a scene is holding the screen (a cine, a Momento, the Parte III bar and alley): the record card waits for it to end
  // (≤ 10 min, a safety net only: holds are always released) instead of landing on top of the story (QA-PORCION:
  // «NUEVA CANCIÓN» over the bar's scene B · QA-PULIDO: over Luzterna's «DERECHO» in the alley, past the old 3 min)
  if (queue.length && ((waited < 15000 && cornerBusy()) || (waited < 600000 && hushed()))) {
    showing = true;
    window.setTimeout(() => next(waited + 500), 500);
    return;
  }
  const e = queue.shift();
  if (!e) {
    showing = false;
    return;
  }
  showing = true;
  const track = trackById(e.song);
  const title = track?.title ?? prettyId(e.song);
  const layer = scenes.fxLayer;
  const root = new Container();
  root.label = 'fonotecaUnlock';
  const CW = 620;
  const CH = 170;
  const card = new Container();
  const shadow = new Graphics().rect(8, 8, CW, CH).fill(C.ink);
  const bg = new Graphics().rect(0, 0, CW, CH).fill(C.paper).stroke({ width: 4, color: C.ink, alignment: 1 });
  card.addChild(shadow, bg);
  // the record lives under the sleeve and slides out to the right of it
  const SL = 128;
  const vinyl = drawVinyl(track, SL * 0.46);
  vinyl.position.set(20 + SL / 2, CH / 2);
  const sleeve = drawCover(track, SL);
  sleeve.position.set(20, (CH - SL) / 2);
  card.addChild(vinyl, sleeve);
  const tx = 20 + SL + 78;
  const tag = txt('NUEVA CANCIÓN EN LA FONOTECA', { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: C.pinkHot, letterSpacing: 3 });
  tag.position.set(tx, 22);
  const name = poster(title, 46, C.ink);
  name.position.set(tx, 42);
  const maxW = CW - tx - 22;
  if (name.width > maxW) name.scale.set(maxW / name.width);
  const src = txt(e.source ? `Obtenida en: ${e.source}` : 'Ya suena en tu colección.', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 19, fill: C.ink, wordWrap: true, wordWrapWidth: maxW });
  src.position.set(tx, 108);
  if (src.height > 50) src.scale.set(50 / src.height);
  card.addChild(tag, name, src);
  card.pivot.set(CW, 0);
  card.rotation = -0.012;
  root.addChild(card);
  layer.addChild(root);
  // top-right corner of the REAL screen
  followView(root, (v) => {
    root.position.set(v.x + v.w - 40, v.y + 168); // under the resource pills
  });
  void W;
  const calm = settings.reduceMotion;
  const tl = gsap.timeline({
    onComplete: () => {
      gsap.killTweensOf(vinyl);
      root.destroy({ children: true });
      next();
    },
  });
  tl.from(card, { x: CW + 80, duration: calm ? 0.2 : 0.45, ease: 'back.out(1.6)' });
  tl.to(vinyl, { x: 20 + SL / 2 + 62, duration: calm ? 0.2 : 0.6, ease: 'power2.out' }, calm ? 0.2 : 0.35);
  if (!calm) gsap.to(vinyl, { rotation: Math.PI * 2 * 5, duration: 5, ease: 'none' });
  tl.from([tag, name, src], { alpha: 0, x: '+=20', duration: 0.3, stagger: 0.08 }, 0.3);
  tl.to(card, { x: CW + 80, alpha: 0, duration: 0.35, ease: 'power2.in' }, calm ? 3.6 : 4.4);
}
