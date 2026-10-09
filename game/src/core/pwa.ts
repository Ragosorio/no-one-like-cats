/**
 * PWA glue: service worker, "install the game" prompt, fullscreen + landscape on phones.
 * - Chrome / Edge / Android: the browser's own install prompt, triggered from our INSTALAR button.
 * - iPhone / iPad (Safari has no prompt): instructions (Compartir → Agregar a inicio).
 * - Installed (standalone / fullscreen display): nothing to offer.
 * - Phone in a browser tab: the first tap asks for fullscreen + landscape lock (best effort).
 */
import { artSwQuery } from '../art/artBase';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

export function isStandalone() {
  return (
    matchMedia('(display-mode: fullscreen)').matches ||
    matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
export function isTouch() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}
export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
export function isPhoneSized() {
  return Math.min(screen.width, screen.height) < 600;
}

/** what the INSTALAR button should do here */
export function installMode(): 'prompt' | 'ios' | null {
  if (isStandalone()) return null;
  if (deferred) return 'prompt';
  if (isIOS()) return 'ios';
  return null;
}
export function onInstallChange(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const ev = deferred;
  deferred = null;
  await ev.prompt();
  const r = await ev.userChoice.catch(() => ({ outcome: 'dismissed' as const }));
  listeners.forEach((f) => f());
  return r.outcome === 'accepted';
}

/** fullscreen + landscape on phones (must run inside a user gesture) */
export async function goFullscreen() {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    await o.lock?.('landscape').catch(() => undefined);
  } catch {
    /* not allowed here (iOS Safari): the rotate hint covers it */
  }
}

export function initPwa() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    listeners.forEach((f) => f());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach((f) => f());
  });
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    // the game boots after `load` already fired (fonts first), so register right away when it did
    // the build id in the URL makes every deploy install a fresh worker (fresh code caches, art cache kept)
    const reg = () => void navigator.serviceWorker.register(`./sw.js?v=${encodeURIComponent(__BUILD_ID__)}${artSwQuery()}`).catch(() => undefined);
    if (document.readyState === 'complete') reg();
    else window.addEventListener('load', reg, { once: true });
  }
  // phones in a browser tab: the first tap goes fullscreen + landscape
  if (isTouch() && isPhoneSized() && !isStandalone()) {
    const once = () => {
      window.removeEventListener('pointerup', once);
      void goFullscreen();
    };
    window.addEventListener('pointerup', once);
  }
}
