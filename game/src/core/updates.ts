/**
 * "Hay una versión nueva": a tab (or installed app) left open for hours keeps playing an old build.
 * We poll `version.json` (written by vite.config.ts) every few minutes and whenever the game comes back
 * to the foreground. When the deployed build differs from ours, a small banner offers to update:
 * it saves first, then reloads — the save loader migrates and patches the island (state/migrate.ts,
 * state/patches.ts), and the NOVEDADES panel tells the player what changed.
 *
 * It never reloads on its own while you're playing. It only auto-updates on the title screen.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { BUILD_ID, G } from '../state/game';
import { game } from './App';
import { scenes } from './scenes';
import { C, F } from '../ui/theme';
import { txt } from '../ui/widgets';

const POLL_MS = 10 * 60_000;
let latest: string | null = null;
let banner: Container | null = null;
let lastPoll = 0;

async function fetchLatest(): Promise<string | null> {
  try {
    const res = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const j = (await res.json()) as { build?: string };
    return typeof j.build === 'string' ? j.build : null;
  } catch {
    return null; // offline: keep playing what we have
  }
}

export async function checkForUpdate(): Promise<boolean> {
  if (BUILD_ID === 'dev') return false;
  lastPoll = Date.now();
  const b = await fetchLatest();
  if (!b || b === BUILD_ID) return false;
  latest = b;
  showBanner();
  return true;
}

/** save, let the new service worker take over, reload */
export async function applyUpdate() {
  if (G.s.cats.length) G.save();
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    await reg?.update();
  } catch {
    /* no worker: a plain reload is enough (index.html is network-first) */
  }
  location.reload();
}

function showBanner() {
  if (banner && !banner.destroyed) return;
  // no island loaded yet (title screen): nobody is mid-anything, just update
  if (!G.s.cats.length) {
    void applyUpdate();
    return;
  }
  const c = new Container();
  const t1 = txt('¡ACTUALIZACIÓN LISTA!', { fontFamily: F.poster, fontSize: 26, fill: C.ink });
  const t2 = txt('Tu partida se guarda antes. Toca para actualizar.', { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink });
  t1.position.set(16, 8);
  t2.position.set(16, 42);
  const w = Math.max(t1.width, t2.width) + 34;
  const bg = new Graphics().rect(6, 6, w, 72).fill(C.ink).rect(0, 0, w, 72).fill(C.mint).stroke({ width: 4, color: C.ink });
  const x = txt('×', { fontFamily: F.poster, fontSize: 30, fill: C.ink });
  x.position.set(w - 26, 2);
  x.eventMode = 'static';
  x.cursor = 'pointer';
  x.on('pointertap', (e) => {
    e.stopPropagation();
    c.destroy({ children: true });
    banner = null;
  });
  c.addChild(bg, t1, t2, x);
  c.eventMode = 'static';
  c.cursor = 'pointer';
  c.on('pointertap', () => void applyUpdate());
  const place = () => {
    const v = game.view;
    c.position.set(v.x + v.w / 2 - w / 2, v.y + v.h - 110);
  };
  place();
  scenes.fxLayer.addChild(c);
  gsap.from(c, { y: c.y + 120, duration: 0.4, ease: 'back.out(1.7)' });
  banner = c;
}

export function initUpdates() {
  // this tab runs older code than the save on disk (saves are blocked meanwhile): offer the reload
  G.afterLoad.push(() => {
    if (G.newerSave) window.setTimeout(showBanner, 1500);
  });
  if (BUILD_ID === 'dev') return;
  window.setInterval(() => void checkForUpdate(), POLL_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - lastPoll > 60_000) void checkForUpdate();
  });
  // a new service worker took control (another tab updated): we're on old code now
  navigator.serviceWorker?.addEventListener('controllerchange', () => void checkForUpdate());
  window.setTimeout(() => void checkForUpdate(), 15_000);
}

export function latestBuild() {
  return latest;
}
