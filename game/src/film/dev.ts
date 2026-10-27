/**
 * DEV tools for films (dev server only).
 *   ?film=demo              play it standalone (the demo can always be skipped)
 *   ?film=demo&seen=1       as if already seen (the skip rule of a replay)
 *   ?film=demo&scrub=1      no clock: window.__film.render(m) draws any instant (contact sheets, captures)
 *   &mq=low|high            force a quality tier
 *   &rm=1 / &rf=1           «Reducir movimiento» / «Reducir destellos» for this session only (not saved)
 *   &invite=0               skip the sound invitation (headless captures of films with music)
 */
import { Graphics } from 'pixi.js';
import { game, W, H } from '../core/App';
import { scenes, Scene } from '../core/scenes';
import { settings } from '../core/settings';

class Blank extends Scene {
  override bleed = 0x000000;
}

export async function devFilm(id: string) {
  const q = new URLSearchParams(location.search);
  if (q.get('rm') === '1') settings.reduceMotion = true;
  if (q.get('rf') === '1') settings.reduceFlashes = true;
  // headless sync tests: open the AudioContext without a gesture (Chrome run with --autoplay-policy=no-user-gesture-required)
  if (q.get('invite') === '0') (await import('../core/audio')).audio.unlock();
  const { playFilm } = await import('./index');
  const sc = new Blank();
  await scenes.go(sc, 'none');
  sc.addChild(new Graphics().rect(-400, -200, W + 800, H + 400).fill(0x000000));
  void game;
  return playFilm(id, { scrub: q.get('scrub') === '1', seen: q.get('seen') === '1', standalone: true, noInvite: q.get('invite') === '0', quality: (q.get('mq') as 'high' | 'low' | null) ?? undefined });
}
