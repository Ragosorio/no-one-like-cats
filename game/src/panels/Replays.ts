/**
 * Ajustes › VOLVER A VER — the prologue, then the Parte II scenes this island has already seen, in story order,
 * each one a spoiler-safe title on a paper strip; each part's songs (♪) come after its scenes (app/p3Songs.ts ›
 * replayEntries). Tap → the scene plays again (src/cine/replay.ts): nothing is saved, no prize is paid twice, and the
 * world goes back to whatever the story says when it ends.
 */
import { Container, Graphics } from 'pixi.js';
import { Modal } from '../ui/modal';
import { poster, txt } from '../ui/widgets';
import { C, F } from '../ui/theme';
import { sfx } from '../core/audio';
import { seenScenes, replayScene } from '../cine/replay';
import { G } from '../state/game';
import { ScrollBox } from './collection/ui';
// MOMENTOS MUSICALES already completed (src/momentos): replays can be left from their pause menu
import { seenMomentos } from '../momentos/registry';
import { seenFilms, replayFilm } from '../app/stageIntro';
import { reachedP3Songs, replayEntries } from '../app/p3Songs';
import { asMemory } from '../ui/story/ghost';
import '../momentos/songs';

export function openReplays() {
  // the prologue is always there (it used to be its own button: VER PRÓLOGO); then each part as Part II taught it:
  // its scenes, then its songs (♪). Parte III: the films already watched (app/stageIntro.ts › seenFilms: `film:<id>` in
  // ext.gateras.seen), then its songs — DRUNCK's Momento and the song films (app/p3Songs.ts, P3-CINE)
  const list = replayEntries({
    scenes: seenScenes(),
    momentos: seenMomentos(G.s as unknown as { ext?: Record<string, unknown> }),
    films: seenFilms(),
    songs: reachedP3Songs(),
  });
  const rows = Math.max(1, list.length);
  const ROW = 78;
  const h = Math.min(940, 230 + rows * ROW);
  const m = new Modal('VOLVER A VER', 900, h, { band: C.inkBlue, bandText: C.paper, subtitle: 'escenas que ya viste' });
  const b = m.body;
  const W2 = m.innerW;
  const note = txt('Repetirlas no cambia nada: tu isla sigue donde la dejaste.', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 20, fill: C.ink });
  b.addChild(note);
  if (!list.length) {
    const none = txt('Todavía no hay escenas para repetir.', { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.ink });
    none.position.set(0, 60);
    b.addChild(none);
    return m.open();
  }
  // the whole Parte II is ~40 scenes: past the modal's height the rows scroll (they used to spill below the panel,
  // over the HUD, and the last ones could not be reached)
  const box = new ScrollBox(W2, Math.max(ROW, m.innerH - 48 - 8));
  box.position.set(0, 48);
  b.addChild(box);
  list.forEach((e, i) => {
    const row = new Container();
    row.position.set(0, i * ROW);
    const bg = new Graphics()
      .rect(5, 5, W2 - 5, ROW - 14)
      .fill(C.ink)
      .rect(0, 0, W2 - 5, ROW - 14)
      .fill(i % 2 ? C.paper : C.linen)
      .stroke({ width: 3, color: C.ink, alignment: 1 });
    const n = poster(String(i + 1).padStart(2, '0'), 30, C.pinkHot);
    n.position.set(16, 12);
    const t = poster(e.title.toUpperCase(), 32, C.ink);
    t.position.set(76, 10);
    if (t.width > W2 - 200) t.scale.set((W2 - 200) / t.width);
    const play = new Graphics().poly([0, 0, 26, 15, 0, 30]).fill(C.ink);
    play.position.set(W2 - 56, (ROW - 14) / 2 - 15);
    row.addChild(bg, n, t, play);
    row.eventMode = 'static';
    row.cursor = 'pointer';
    row.on('pointertap', () => {
      if (box.wasDrag) return;
      sfx('click');
      m.close();
      // «Volver a ver» is the one place she may still be seen after her death: a memory (ui/story/ghost.ts)
      void asMemory(async () => {
        if (e.id === '__prologo') await import('../app/story').then((st) => st.replayPrologue());
        // the finale's Momento replays through the finale (its story lines, nothing persisted: app/o4Finale.ts)
        else if (e.id === 'momento:yonose_todo') await import('../app/o4Finale').then((f) => f.playFinale({ replay: true, from: 'mentira' }));
        else if (e.id.startsWith('momento:')) await import('../momentos').then((mo) => mo.playMomento(e.id.slice(8), { replay: true }));
        else if (e.id.startsWith('film:')) await replayFilm(e.id.slice(5));
        else await replayScene(e.id);
      });
    });
    box.content.addChild(row);
  });
  box.setContentHeight(list.length * ROW);
  return m.open();
}
