/**
 * Secret discovered (T3, GDD §7 "secreto revelado"): ink flash, a tilted swiss poster slams in with the
 * secret's name, a cheeky line and the rewards; gems fly to the HUD when you close it.
 * Never blocks for long: click anywhere (after 0.6 s) to continue.
 */
import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../core/App';
import { scenes } from '../core/scenes';
import { C, F } from '../ui/theme';
import { txt, poster, dotGrid } from '../ui/widgets';
import { icon } from '../ui/icons';
import { sfx } from '../core/audio';
import { sparkles, speedLines } from '../fx/juice';
import { halftoneTexture, glowTexture, paperTexture } from '../art/textures';
import { EXPANSIONS, catName } from '../data/content';
import type { SecretReward } from '../state/sys/secrets';
import { iconText } from '../ui/elementIcon';
import { shrineArt, fossilWallArt, forgeArt, bottleArt, iceBlockArt, laterSecretArt } from './landmarks';
import { centerOf } from './buildingArt';

/** the landmark, in its "solved" state, framed inside the poster's pink circle */
function landmarkFor(n: number) {
  switch (n) {
    case 1:
      return shrineArt('done');
    case 2:
      return fossilWallArt(1, false);
    case 3:
      return forgeArt(true);
    case 4:
      return bottleArt(false);
    case 5:
      return iceBlockArt(false);
    default:
      return laterSecretArt(n, true);
  }
}

const KICKER: Record<number, string> = {
  1: 'EL GUARDIÁN SE RINDE',
  2: 'PALEONTOLOGÍA GATUNA',
  3: 'SE PRENDIÓ (LITERAL)',
  4: 'CORREO DEL MAR',
  5: 'DESCONGELADO',
  9: 'HORA DEL TÉ',
  10: 'ACERTIJO OLVIDADO',
  11: 'DULCE HALLAZGO',
  12: 'EL OJO TE VE',
  6: 'SILENCIO EN LA ORQUESTA',
  7: 'ESPEJITO, ESPEJITO',
  8: 'EL FARO ARDE',
};

function unlockLine(u?: string) {
  if (!u) return null;
  const [k, v] = u.split(':');
  if (k === 'weapon') return { text: `Nuevo tipo de arma: ${v === 'mortero' ? 'Mortero de Magma' : v === 'escarcha' ? 'Lanzaescarcha' : v}`, color: C.orange };
  if (k === 'rumor') return { text: `Rumor en el Catdex: ${catName(v) === v ? '???' : catName(v)}`, color: C.lilac };
  if (k === 'shield') return { text: 'Nuevo escudo: Escudo Espejo', color: C.cyan };
  if (k === 'cat') return { text: `Un gato secreto: ${catName(v)}`, color: C.pinkHot };
  return { text: 'Algo cambió en el horizonte…', color: C.yellow };
}

export function showSecretReveal(n: number, reward: SecretReward, onClose?: () => void) {
  const e = EXPANSIONS[n - 1];
  const layer = scenes.overlayLayer;
  const root = new Container();
  layer.addChild(root);
  const dim = new Graphics().rect(0, 0, W, H).fill({ color: C.ink, alpha: 0.78 });
  dim.eventMode = 'static';
  root.addChild(dim);
  speedLines(root, W / 2, H / 2, C.paper, 56, 0.6);
  const glow = new Sprite(glowTexture());
  glow.anchor.set(0.5);
  glow.tint = C.yellow;
  glow.alpha = 0.5;
  glow.scale.set(9, 6);
  glow.position.set(W / 2, H / 2);
  root.addChild(glow);
  // poster
  const PW = 1080;
  const PH = 640;
  const card = new Container();
  card.pivot.set(PW / 2, PH / 2);
  card.position.set(W / 2, H / 2);
  root.addChild(card);
  const sh = new Graphics().rect(18, 18, PW, PH).fill(C.ink);
  const paper = new TilingSprite({ texture: paperTexture(C.paper), width: PW, height: PH });
  const ht = new TilingSprite({ texture: halftoneTexture(C.ink, 12, 2.4), width: PW, height: 220 });
  ht.alpha = 0.12;
  ht.y = PH - 220;
  const frame = new Graphics().rect(0, 0, PW, PH).stroke({ width: 6, color: C.ink, alignment: 1 });
  const circle = new Graphics().circle(PW - 200, 210, 170).fill(C.pinkHot);
  card.addChild(sh, paper, circle, ht, frame);
  const dg = dotGrid(4, 6, 20, 3, C.ink);
  dg.position.set(PW - 120, PH - 160);
  card.addChild(dg);
  const kick = txt(`SECRETO · ${e.name.toUpperCase()}`, { fontFamily: F.bebas, fontSize: 30, fill: C.ink, letterSpacing: 6 });
  kick.position.set(54, 40);
  const bar = new Graphics().rect(54, 82, 380, 6).fill(C.ink);
  const big = poster('¡SECRETO!', 150, C.ink, { letterSpacing: -4 });
  big.position.set(46, 80);
  const name = poster(e.secret.name.toUpperCase(), 64, C.pinkHot);
  name.position.set(54, 252);
  if (name.width > PW - 110) name.scale.set((PW - 110) / name.width);
  const art = landmarkFor(n).c;
  const ctr = centerOf(2, 2);
  art.pivot.set(ctr.x, ctr.y - 50);
  art.position.set(PW - 200, 230);
  art.scale.set(1.45);
  const artMask = new Graphics().circle(PW - 200, 210, 166).fill(0xffffff);
  art.mask = artMask;
  card.addChild(artMask, art);
  const sub = new Container();
  const subT = txt(KICKER[n] ?? '', { fontFamily: F.comic, fontSize: 30, fill: C.ink });
  const sbg = new Graphics().rect(6, 6, subT.width + 28, 50).fill(C.ink).rect(0, 0, subT.width + 28, 50).fill(C.yellow).stroke({ width: 4, color: C.ink });
  subT.position.set(14, 8);
  sub.addChild(sbg, subT);
  sub.position.set(PW - 200 - (subT.width + 28) / 2, 360);
  sub.rotation = -0.05;
  const line = iconText(reward.text, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 30, fill: C.ink }, { wrap: PW - 140 });
  line.position.set(56, 340);
  card.addChild(kick, bar, big, name, sub, line);
  // rewards row
  const row = new Container();
  let x = 0;
  const chip = (draw: (c: Container) => number) => {
    const c = new Container();
    const w = draw(c);
    c.x = x;
    row.addChild(c);
    x += w + 18;
  };
  chip((c) => {
    const ic = icon('gem', 46);
    ic.position.set(30, 30);
    const t = txt(`+${reward.gems}`, { fontFamily: F.heavy, fontSize: 36, fill: C.ink });
    t.position.set(60, 8);
    const bg = new Graphics().rect(5, 5, t.x + t.width + 20, 60).fill(C.ink).rect(0, 0, t.x + t.width + 20, 60).fill(C.yellow).stroke({ width: 4, color: C.ink });
    c.addChild(bg, ic, t);
    return t.x + t.width + 20;
  });
  if (reward.orbs) {
    const o = reward.orbs;
    chip((c) => {
      const ic = icon('orb', 44);
      ic.position.set(30, 30);
      const t = txt(`+${o.n} orbes de ${catName(o.species)}`, { fontFamily: F.heavy, fontSize: 26, fill: C.ink });
      t.position.set(60, 14);
      const bg = new Graphics().rect(5, 5, t.x + t.width + 20, 60).fill(C.ink).rect(0, 0, t.x + t.width + 20, 60).fill(C.lilac).stroke({ width: 4, color: C.ink });
      c.addChild(bg, ic, t);
      return t.x + t.width + 20;
    });
  }
  const ul = unlockLine(reward.unlock);
  if (ul)
    chip((c) => {
      const ic = icon('star', 40);
      ic.position.set(28, 30);
      const t = txt(ul.text, { fontFamily: F.heavy, fontSize: 24, fill: C.ink });
      t.position.set(56, 15);
      const bg = new Graphics().rect(5, 5, t.x + t.width + 20, 60).fill(C.ink).rect(0, 0, t.x + t.width + 20, 60).fill(ul.color).stroke({ width: 4, color: C.ink });
      c.addChild(bg, ic, t);
      return t.x + t.width + 20;
    });
  row.position.set(56, PH - 120);
  if (row.width > PW - 110) row.scale.set((PW - 110) / row.width);
  card.addChild(row);
  const hint = txt('CLIC PARA SEGUIR', { fontFamily: F.poster, fontSize: 26, fill: C.paper });
  hint.anchor.set(0.5);
  hint.position.set(W / 2, H - 60);
  root.addChild(hint);
  // T3 timing: flash → slam → sparkle
  sfx('reveal');
  card.rotation = -0.05;
  gsap.fromTo(card.scale, { x: 2.6, y: 2.6 }, { x: 1, y: 1, duration: 0.32, ease: 'back.out(1.8)' });
  gsap.fromTo(card, { alpha: 0 }, { alpha: 1, duration: 0.12 });
  gsap.delayedCall(0.3, () => {
    if (root.destroyed) return;
    sfx('bigboom', 1.2);
    sparkles(root, W / 2, H / 2 - 120, C.yellow, 30, 520);
  });
  gsap.to(hint, { alpha: 0.3, yoyo: true, repeat: -1, duration: 0.6 });
  let closing = false;
  gsap.delayedCall(0.6, () => {
    if (root.destroyed) return;
    dim.once('pointertap', close);
    card.eventMode = 'static';
    card.once('pointertap', close);
  });
  function close() {
    if (closing) return;
    closing = true;
    sfx('paper');
    gsap.killTweensOf(hint);
    gsap.to(card, { y: card.y + 60, alpha: 0, duration: 0.2 });
    gsap.to([dim, glow, hint], {
      alpha: 0,
      duration: 0.22,
      onComplete: () => {
        root.destroy({ children: true });
        onClose?.();
      },
    });
  }
}
