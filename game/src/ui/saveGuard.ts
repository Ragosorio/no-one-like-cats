/**
 * The save guard's face: when this window must NOT save (another window holds the island, or the
 * save on disk is ahead of this one), a red banner says so and offers the only safe move: reload
 * with the newest island. Also wires the writer lock and .nocat files opened from the desktop.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { game } from '../core/App';
import { scenes } from '../core/scenes';
import { G } from '../state/game';
import { C, F } from './theme';
import { txt } from './widgets';
import { onLaunchFile, snapshot, startVault, summarize, describe } from '../core/vault';
import { SAVE_KEY } from '../core/save';

let banner: Container | null = null;
function showBanner(title: string, sub: string) {
  banner?.destroy({ children: true });
  const c = new Container();
  const t1 = txt(title, { fontFamily: F.poster, fontSize: 26, fill: C.paper });
  const t2 = txt(sub, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.paper, wordWrap: true, wordWrapWidth: 640 });
  t1.position.set(16, 8);
  t2.position.set(16, 42);
  const w = Math.max(t1.width, t2.width) + 34;
  const h = 52 + t2.height;
  c.addChild(new Graphics().rect(6, 6, w, h).fill(C.ink).rect(0, 0, w, h).fill(C.red).stroke({ width: 4, color: C.ink }), t1, t2);
  c.eventMode = 'static';
  c.cursor = 'pointer';
  c.on('pointertap', () => location.reload());
  const v = game.view;
  c.position.set(v.x + v.w / 2 - w / 2, v.y + 90);
  scenes.fxLayer.addChild(c);
  gsap.from(c, { y: c.y - 160, duration: 0.4, ease: 'back.out(1.7)' });
  banner = c;
}

export function initSaveGuard() {
  // 1) one writer: the first window holds the lock; any other one plays read-only until it gets it
  const locks = (navigator as Navigator & { locks?: LockManager }).locks;
  if (locks) {
    void locks.request('nolc-save-writer', { ifAvailable: true }, (lock) => {
      if (lock) return new Promise<void>(() => undefined); // held for the life of this window
      G.otherWindow = true;
      showBanner('TU ISLA ESTÁ ABIERTA EN OTRA VENTANA', 'Esta ventana NO guarda (para no pisar tu progreso). Cierra la otra, o toca aquí para recargar con la isla más nueva.');
      // when the other window closes, take over with a fresh copy of the island
      void locks.request('nolc-save-writer', () => {
        location.reload();
        return new Promise<void>(() => undefined);
      });
      return undefined;
    });
  }
  // 2) the disk is ahead of this window (an old tab woke up): stop and say so
  G.on('stale', () => {
    void snapshot('ventana vieja', JSON.stringify({ version: G.s.v, savedAt: Date.now(), state: G.s }));
    showBanner('HAY UNA VERSIÓN MÁS NUEVA DE TU ISLA', 'Esta ventana se quedó atrás y dejó de guardar para no borrar tu progreso. Toca aquí para recargar.');
  });
  // 3) history + your folder + "please don't evict my storage"
  startVault(() => G.loaded && G.s.cats.length > 0 && !G.otherWindow && !G.staleWindow);
  // 4) double-clicking a .nocat (installed app): offer to load it (the current island goes to the history first)
  onLaunchFile((env) => {
    const sum = summarize(env);
    if (!sum) return;
    if (!window.confirm(`¿Abrir esta isla?\n${describe(sum)}\n\nTu isla actual se guarda en el historial de RESPALDOS.`)) return;
    void snapshot('antes de abrir un .nocat').then(() => {
      G.saveLocked = true;
      localStorage.setItem(SAVE_KEY, env);
      location.reload();
    });
  });
}
