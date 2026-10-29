/**
 * «PARECE QUE EL CASINO LOGRÓ CONECTAR MÁS CAJAS» — the one-time notice of the MULTIVERSO DESBORDADO banner (owner
 * 2026-10-29: «le decimos al usuario que al parecer el casino logró conectar más cajas para quitarnos un poco la tristeza de
 * luzterna (así como chiste y risa)»). ⚠️ Spoilers of the Parte III: it only exists after it (postP3Unlocked).
 *
 * Its words and its flag live in state/sys/multiversoAviso.ts. Who speaks: MADAME NOIR, the croupier — the casino's own
 * voice (the host and the bubble of CasinoScene). Luzterna is only MENTIONED: she doesn't appear and doesn't speak. Shown
 * the first time a player past the Parte III opens the casino or the Portal after this update; the save remembers it (flag
 * `multiverso_aviso`), set the moment it shows.
 */
import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { sfx } from '../../core/audio';
import { settings } from '../../core/settings';
import { F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { screenRect } from '../../ui/screen';
import { multiversoPool } from '../../state/sys/postp3';
import { AVISO_LINES, AVISO_WHO, markAvisoSeen } from '../../state/sys/multiversoAviso';
import { CP, CButton, Host, block, heading, label } from './kit';
import { MD, MD_DIMS, MD_GLOW_COL, mdGem, mdStripe } from './mdLook';
import { catArt } from './prizes';

export interface AvisoOpts {
  /** «¡A VER ESAS CAJAS!»: open the Portal on the MULTIVERSO banner */
  onGo: () => void;
  /** read a line aloud (the casino's VOZ), if it's on */
  speak?: (text: string) => void;
}

/**
 * The notice over the whole casino: Madame Noir, her lines one by one (tap = finish / next), three Multidimensionals of the
 * banner and two buttons. Resolves when it closes. Marks the flag (and saves) the moment it opens.
 */
export function showMultiversoAviso(layer: Container, o: AvisoOpts): Promise<void> {
  markAvisoSeen();
  return new Promise((resolve) => {
    const reduce = settings.reduceMotion;
    const root = new Container();
    root.eventMode = 'static';
    root.hitArea = new Rectangle(0, 0, W, H);
    layer.addChild(root);
    const dim = screenRect(0x05080a);
    dim.alpha = 0;
    root.addChild(dim);
    gsap.to(dim, { alpha: 0.86, duration: 0.25 });
    // the panel
    const PW = 1360;
    const PH = 720;
    const px = (W - PW) / 2;
    const py = (H - PH) / 2 - 10;
    const panel = new Container();
    panel.position.set(px, py);
    root.addChild(panel);
    const bg = new Graphics();
    bg.rect(12, 12, PW, PH).fill(CP.ink);
    bg.rect(0, 0, PW, PH).fill(0x0b2226).stroke({ width: 6, color: CP.ink, alignment: 1 });
    // the Multiverse's tunnel of boxes behind Madame Noir
    const tun = new Graphics();
    for (let i = 8; i >= 1; i--) {
      const r = 30 + i * 30;
      const a = i * 0.24;
      const pts: number[] = [];
      for (let j = 0; j < 4; j++) pts.push(Math.cos(a + (j * Math.PI) / 2) * r, Math.sin(a + (j * Math.PI) / 2) * r);
      tun.poly(pts).fill({ color: i % 2 ? 0x0e2f35 : 0x123a41 }).stroke({ width: 5, color: MD_DIMS[i % MD_DIMS.length], alpha: 0.85 });
    }
    tun.position.set(250, 330);
    const tunMask = new Graphics().rect(0, 0, PW, PH).fill(0xffffff);
    tun.mask = tunMask;
    mdStripe(bg, 0, PH - 16, PW, 16);
    bg.rect(0, 0, PW, 70).fill(MD).stroke({ width: 6, color: CP.ink, alignment: 1 });
    panel.addChild(bg, tunMask, tun);
    if (!reduce) gsap.to(tun, { rotation: Math.PI * 2, duration: 36, ease: 'none', repeat: -1 });
    const title = heading('AVISO DE LA CASA', 48, CP.ink);
    title.position.set(30, 6);
    const gem = mdGem(44);
    gem.position.set(PW - 40, 35);
    const sub = label('DESPUÉS DE LA PARTE III · SOLO UNA VEZ', 15, CP.ink, { letterSpacing: 2 });
    sub.anchor.set(1, 0.5);
    sub.position.set(PW - 80, 35);
    panel.addChild(title, gem, sub);
    // Madame Noir
    const host = new Host(330);
    host.position.set(250, 360);
    const plate = new Container();
    plate.addChild(block(290, 44, CP.pink, { off: 5, border: 3 }));
    const pt = heading('MADAME NOIR · CRUPIER', 24, CP.ink);
    pt.position.set(14, 6);
    plate.addChild(pt);
    plate.position.set(105, 560);
    panel.addChild(host, plate);
    gsap.from(host, { y: 420, alpha: 0, duration: 0.45, ease: 'back.out(1.6)' });
    // the balloon
    const bw = 830;
    const bx = 470;
    const by = 104;
    const balloon = new Graphics();
    const body = txt('', { fontFamily: F.ui, fontWeight: '700', fontSize: 31, fill: CP.ink, wordWrap: true, wordWrapWidth: bw - 60, lineHeight: 41 });
    body.position.set(bx + 30, by + 34);
    const who = txt(AVISO_WHO, { fontFamily: F.poster, fontSize: 22, fill: CP.paper, letterSpacing: 1 });
    const whoBg = new Graphics();
    const step = label('', 15, 0x1f2b4a, { letterSpacing: 2 });
    panel.addChild(balloon, whoBg, who, body, step);
    const drawBalloon = (h: number) => {
      balloon.clear();
      balloon.rect(bx + 9, by + 9, bw, h).fill(CP.ink);
      balloon.rect(bx, by, bw, h).fill(CP.paper).stroke({ width: 5, color: CP.ink, alignment: 1 });
      // the tail towards Madame Noir (left)
      balloon.poly([bx + 4, by + h * 0.42, bx - 54, by + h * 0.62, bx + 4, by + h * 0.7]).fill(CP.paper).stroke({ width: 5, color: CP.ink, join: 'round' });
      balloon.rect(bx, by + h * 0.42 + 4, 8, h * 0.28 - 8).fill(CP.paper);
      who.position.set(bx + 18, by - 16);
      whoBg.clear().rect(bx + 10, by - 22, who.width + 18, 32).fill(MD_GLOW_COL).stroke({ width: 3, color: CP.ink });
      step.position.set(bx + bw - 30 - step.width, by + h - 30);
    };
    // three Multidimensionals of the banner under the balloon (their SVG paintings)
    const strip = new Container();
    const pool = [...multiversoPool()].sort((a, b) => Number(!!b.post?.star) - Number(!!a.post?.star) || a.id.localeCompare(b.id));
    pool.slice(0, 3).forEach((d, i) => {
      const a = catArt(d.id, 170);
      a.position.set(bx + 120 + i * 190, 500);
      strip.addChild(a);
      if (!reduce) gsap.to(a, { y: a.y - 10, duration: 1.5 + i * 0.3, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    });
    panel.addChild(strip);
    // buttons
    let done = false;
    const close = (go: boolean) => {
      if (done) return;
      done = true;
      sfx(go ? 'fanfare' : 'click');
      gsap.to(root, {
        alpha: 0,
        duration: 0.25,
        onComplete: () => {
          gsap.killTweensOf(tun);
          for (const ch of strip.children) gsap.killTweensOf(ch);
          tw?.kill();
          root.destroy({ children: true });
          if (go) o.onGo();
          resolve();
        },
      });
    };
    const goBtn = new CButton('¡A VER ESAS CAJAS!', () => close(true), { w: 420, h: 84, color: MD_GLOW_COL, size: 34, sub: 'ABRE EL PORTAL MULTIVERSO DESBORDADO' });
    goBtn.position.set(PW - 30 - 420, PH - 120);
    const later = new CButton('AHORITA NO', () => close(false), { w: 230, h: 84, color: CP.paperDark, size: 30 });
    later.position.set(PW - 30 - 420 - 250, PH - 120);
    goBtn.alpha = 0.35;
    panel.addChild(later, goBtn);
    // the lines, one at a time (tap the panel: finish the line, then the next one)
    let i = -1;
    let tw: gsap.core.Tween | null = null;
    let typing = false;
    const show = (k: number) => {
      i = k;
      const full = AVISO_LINES[k];
      body.text = full;
      const h = Math.max(200, body.height + 90);
      body.text = '';
      step.text = k < AVISO_LINES.length - 1 ? `${k + 1}/${AVISO_LINES.length} · TOCA PARA SEGUIR ›` : `${k + 1}/${AVISO_LINES.length}`;
      drawBalloon(h);
      host.talk(Math.min(4200, 700 + full.length * 45));
      o.speak?.(full);
      tw?.kill();
      typing = true;
      const c = { n: 0 };
      tw = gsap.to(c, {
        n: full.length,
        duration: reduce ? 0.01 : Math.min(2.2, 0.028 * full.length),
        ease: 'none',
        onUpdate: () => {
          if (!body.destroyed) body.text = full.slice(0, Math.floor(c.n));
        },
        onComplete: () => {
          typing = false;
          if (k === AVISO_LINES.length - 1 && !goBtn.destroyed) gsap.to(goBtn, { alpha: 1, duration: 0.25 });
        },
      });
      sfx('click');
    };
    const advance = () => {
      if (done) return;
      if (typing) {
        tw?.progress(1);
        return;
      }
      if (i < AVISO_LINES.length - 1) show(i + 1);
    };
    root.on('pointertap', advance);
    gsap.from(panel, { y: py + 60, alpha: 0, duration: 0.35, ease: 'back.out(1.5)', onComplete: () => show(0) });
    if (!reduce) gsap.fromTo(gem.scale, { x: 1, y: 1 }, { x: 1.18, y: 1.18, duration: 0.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    root.once('destroyed', () => {
      tw?.kill();
      gsap.killTweensOf(gem.scale);
      gsap.killTweensOf(tun);
    });
  });
}
export type { Text };
export { avisoDue } from '../../state/sys/multiversoAviso';
