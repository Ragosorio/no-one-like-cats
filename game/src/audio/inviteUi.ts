/**
 * The invitation card: paper and ink, Canelo with one ear up (it twitches), a lantern's warm glow
 * behind him, one line, two choices. No mention of anything technical — it is a moment in the story.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../core/App';
import { scenes } from '../core/scenes';
import { settings } from '../core/settings';
import { audio, sfx } from '../core/audio';
import { C, F } from '../ui/theme';
import { Button, Panel, txt } from '../ui/widgets';
import { screenRect } from '../ui/screen';
import { acceptSound, declineSound, InviteAnswer } from './invite';

const CINNAMON = 0xc9773d;
const CINNAMON_DARK = 0x9c5527;

/** Canelo's head, listening (ears are separate so the right one can twitch) */
function canelo(): { root: Container; ear: Container; waves: Graphics } {
  const root = new Container();
  const ink = { width: 4, color: C.ink, join: 'round' as const, cap: 'round' as const };
  const earL = new Graphics().poly([-78, -40, -60, -118, -18, -62]).fill(CINNAMON).stroke(ink);
  earL.poly([-66, -52, -58, -98, -34, -64]).fill(C.pink);
  const ear = new Container();
  const earR = new Graphics().poly([0, 0, 20, -82, 58, -22]).fill(CINNAMON).stroke(ink);
  earR.poly([12, -10, 22, -60, 44, -22]).fill(C.pink);
  ear.addChild(earR);
  ear.position.set(20, -62);
  ear.pivot.set(10, 0);
  const head = new Graphics();
  head.ellipse(0, 0, 96, 80).fill(CINNAMON).stroke(ink);
  // a stripe or two (canela)
  head.moveTo(-14, -78).quadraticCurveTo(-8, -58, -18, -44).stroke({ width: 6, color: CINNAMON_DARK, cap: 'round' });
  head.moveTo(10, -79).quadraticCurveTo(14, -60, 6, -46).stroke({ width: 6, color: CINNAMON_DARK, cap: 'round' });
  // closed, content eyes
  head.moveTo(-50, 2).quadraticCurveTo(-36, -10, -22, 2).stroke(ink);
  head.moveTo(22, 2).quadraticCurveTo(36, -10, 50, 2).stroke(ink);
  // nose + mouth
  head.poly([-8, 20, 8, 20, 0, 30]).fill(C.pinkHot).stroke({ width: 3, color: C.ink, join: 'round' });
  head.moveTo(0, 30).quadraticCurveTo(-8, 42, -18, 38).stroke({ width: 3, color: C.ink, cap: 'round' });
  head.moveTo(0, 30).quadraticCurveTo(8, 42, 18, 38).stroke({ width: 3, color: C.ink, cap: 'round' });
  // whiskers
  for (const s of [-1, 1])
    for (let i = 0; i < 3; i++)
      head
        .moveTo(s * 42, 24 + i * 9)
        .lineTo(s * (120 + i * 6), 14 + i * 16)
        .stroke({ width: 2, color: C.ink, cap: 'round' });
  // what he hears: three arcs by the raised ear
  const waves = new Graphics();
  for (let i = 0; i < 3; i++) waves.arc(96, -96, 26 + i * 18, -1.1, 0.3).stroke({ width: 4, color: C.ink, cap: 'round', alpha: 1 - i * 0.25 });
  root.addChild(earL, ear, head, waves);
  return { root, ear, waves };
}

let open: Promise<InviteAnswer> | null = null;

export function showInvite(): Promise<InviteAnswer> {
  if (open) return open;
  open = new Promise<InviteAnswer>((resolve) => {
    const layer = scenes.fxLayer;
    const root = new Container();
    root.label = 'soundInvite';
    const dim = screenRect({ color: C.ink, alpha: 0.74 });
    dim.eventMode = 'static';
    root.addChild(dim);
    const PW = 1060;
    const PH = 470;
    const card = new Container();
    card.position.set(W / 2, H / 2);
    card.pivot.set(PW / 2, PH / 2);
    card.rotation = -0.008;
    const panel = new Panel(PW, PH, { color: C.paper, offset: 14 });
    card.addChild(panel);
    // the lantern's warm glow behind Canelo
    const glow = new Graphics();
    for (let i = 6; i >= 1; i--) glow.circle(0, 0, 40 + i * 26).fill({ color: C.yellow, alpha: 0.07 });
    glow.position.set(210, 250);
    const { root: cat, ear, waves } = canelo();
    cat.position.set(210, 268);
    cat.scale.set(1.15);
    card.addChild(glow, cat);
    // text column
    const X = 430;
    const TW = PW - X - 50;
    const kicker = txt('UN MOMENTO', { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.pinkHot, letterSpacing: 6 });
    kicker.position.set(X, 54);
    const line = txt('Hay cosas que\nsolo se escuchan.', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 50, fill: C.ink, wordWrap: true, wordWrapWidth: TW, lineHeight: 58 });
    line.position.set(X, 84);
    const sub = txt('Canelo ya paró la oreja.', { fontFamily: F.ui, fontWeight: '700', fontSize: 21, fill: C.ink });
    sub.alpha = 0.8;
    sub.position.set(X, line.y + line.height + 14);
    card.addChild(kicker, line, sub);
    let done = false;
    const finish = (a: InviteAnswer) => {
      if (done) return;
      done = true;
      window.removeEventListener('keydown', onKey);
      gsap.killTweensOf(ear);
      gsap.killTweensOf(waves);
      gsap.killTweensOf(glow.scale);
      gsap.to(card, { y: card.y + 40, alpha: 0, duration: 0.25, ease: 'power2.in' });
      gsap.to(dim, {
        alpha: 0,
        duration: 0.3,
        onComplete: () => {
          root.destroy({ children: true });
          open = null;
          resolve(a);
        },
      });
    };
    const on = new Button(
      'ENCENDER EL SONIDO',
      () => {
        // inside the click: unmute + resume the AudioContext
        acceptSound();
        sfx('purr');
        finish('on');
      },
      { w: 296, h: 70, size: 30, color: C.pinkHot, textColor: C.paper, sound: false },
    );
    // pointerdown is the gesture browsers trust the most: resume there too
    on.on('pointerdown', () => audio.unlock());
    const off = new Button('SEGUIR EN SILENCIO', () => {
      declineSound();
      finish('off');
    }, { w: 270, h: 70, size: 26, color: C.paper, sound: false });
    const by = PH - 138;
    on.position.set(X, by);
    off.position.set(X + 296 + 14, by);
    const foot = txt('Se cambia cuando quieras en Ajustes.', { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink });
    foot.alpha = 0.55;
    foot.position.set(X, by + 86);
    card.addChild(on, off, foot);
    root.addChild(card);
    layer.addChild(root);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        declineSound();
        finish('off');
      }
    };
    window.addEventListener('keydown', onKey);
    // in
    dim.alpha = 0;
    gsap.to(dim, { alpha: 1, duration: 0.35 });
    gsap.from(card, { y: card.y + 50, alpha: 0, duration: 0.45, ease: 'back.out(1.4)' });
    if (!settings.reduceMotion) {
      // the ear: two quick flicks, a pause, again (never in sync with anything)
      const twitch = () => {
        if (done || ear.destroyed) return;
        gsap
          .timeline({ onComplete: () => void gsap.delayedCall(1.4 + Math.random() * 1.8, twitch) })
          .to(ear, { rotation: 0.28, duration: 0.07, ease: 'power2.out' })
          .to(ear, { rotation: -0.05, duration: 0.09 })
          .to(ear, { rotation: 0.2, duration: 0.06 })
          .to(ear, { rotation: 0, duration: 0.18, ease: 'back.out(3)' });
      };
      gsap.delayedCall(0.6, twitch);
      gsap.fromTo(waves, { alpha: 0.15 }, { alpha: 1, duration: 0.9, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      gsap.to(glow.scale, { x: 1.06, y: 1.06, duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    }
  });
  return open;
}
