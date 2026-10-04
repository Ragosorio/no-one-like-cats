/**
 * "Mientras no estabas…" — DIARIO DEL MAR front page shown when coming back (GDD 2.20 / 6.20).
 */
import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { sfx } from '../../core/audio';
import { fmt, fmtDuration } from '../../core/format';
import { C, F } from '../theme';
import { Button, Counter, poster, txt } from '../widgets';
import { icon } from '../icons';
import { paperTexture, halftoneTexture } from '../../art/textures';
import { catTexture, preloadCats } from '../../art/catArt';
import { InkFilter } from '../../fx/filters';
import { sparkles } from '../../fx/juice';
import type { OfflineSummary } from '../../state/ext/story';
import { clean, loadingTip, sysMsg, tone } from './text';
import { LuzternaPortrait, preloadStoryArt } from './portrait';
import { destroyDeep } from './tweens';

export async function offlineReport(layer: Container, s: OfflineSummary, opts: { canCollectAll: boolean; onCollectAll?: () => number }): Promise<void> {
  await Promise.all([preloadCats(['canelo_cozy_cat']), preloadStoryArt()]);
  return new Promise((resolve) => {
    const root = new Container();
    root.label = 'offlineReport';
    layer.addChild(root);
    const dim = new Graphics().rect(0, 0, W, H).fill({ color: C.ink, alpha: 0.7 });
    dim.eventMode = 'static';
    root.addChild(dim);
    const PW = 1500;
    const PH = 940;
    const page = new Container();
    page.pivot.set(PW / 2, PH / 2);
    page.position.set(W / 2, H / 2 + 6);
    page.rotation = -0.012;
    root.addChild(page);
    page.addChild(new Graphics().rect(16, 16, PW, PH).fill({ color: 0x000000, alpha: 0.5 }));
    page.addChild(new TilingSprite({ texture: paperTexture(0xe9dfc8, 512, 1.4), width: PW, height: PH }));
    page.addChild(new Graphics().rect(0, 0, PW, PH).stroke({ width: 3, color: C.ink, alpha: 0.7 }));
    // masthead
    const mast = txt('El Diario del Mar', { fontFamily: F.news, fontSize: 96, fill: C.ink });
    mast.anchor.set(0.5, 0);
    mast.position.set(PW / 2, 18);
    const rule = new Graphics().rect(40, 132, PW - 80, 5).fill(C.ink).rect(40, 142, PW - 80, 2).fill(C.ink).rect(40, 176, PW - 80, 2).fill(C.ink);
    const date = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
    const issue = txt(`EDICIÓN DE TU REGRESO  ·  ${date}  ·  AUSENCIA: ${fmtDuration(s.ms).toUpperCase()}  ·  PRECIO: UNA SARDINA`, {
      fontFamily: F.ui,
      fontWeight: '700',
      fontSize: 17,
      fill: C.ink,
      letterSpacing: 2,
    });
    issue.anchor.set(0.5, 0);
    issue.position.set(PW / 2, 150);
    page.addChild(mast, rule, issue);
    const head = poster('MIENTRAS NO ESTABAS…', 124, C.ink, { letterSpacing: -3 });
    head.anchor.set(0.5, 0);
    head.position.set(PW / 2, 186);
    page.addChild(head);
    page.addChild(new Graphics().rect(40, 330, PW - 80, 3).fill(C.ink));

    // left column: gold produced (lead story)
    const lead = new Container();
    lead.position.set(40, 348);
    page.addChild(lead);
    const k1 = txt('ECONOMÍA', { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.red, letterSpacing: 4 });
    const h1 = poster('TUS GATOS PRODUJERON', 44, C.ink);
    h1.position.set(0, 22);
    const gi = icon('gold', 78);
    gi.position.set(44, 126);
    const goldCtr = new Counter({ fontFamily: F.poster, fontSize: 104, fill: C.ink, letterSpacing: -2 }, '', fmt);
    goldCtr.position.set(96, 64);
    const h1b = poster('DOBLONES', 40, C.ink);
    h1b.position.set(0, 186);
    const body1 = txt(clean('"Nomás por existir", declaró una fuente cercana a los cojines. Los Doblones esperan en los hábitats.'), {
      fontFamily: F.serif,
      fontSize: 20,
      fill: C.ink,
      wordWrap: true,
      wordWrapWidth: 560,
      lineHeight: 26,
    });
    body1.position.set(0, 236);
    lead.addChild(k1, h1, gi, goldCtr, h1b, body1);

    // photo of a sleeping Canelo
    const ph = new Container();
    ph.position.set(40, 630);
    const phW = 560;
    const phH = 210;
    ph.addChild(new Graphics().rect(0, 0, phW, phH).fill(0xd8ceb8).stroke({ width: 3, color: C.ink }));
    const dots = new TilingSprite({ texture: halftoneTexture(C.ink, 9, 2.2), width: phW, height: phH });
    dots.alpha = 0.15;
    ph.addChild(dots);
    const cat = new Sprite(catTexture('canelo_cozy_cat'));
    cat.anchor.set(0.5);
    cat.scale.set(300 / cat.texture.height);
    cat.position.set(phW / 2, phH / 2 + 40);
    cat.rotation = -0.25;
    cat.filters = [new InkFilter({ threshold: 0.42, paper: 0xe9dfc8 })];
    const m = new Graphics().rect(0, 0, phW, phH).fill(0xffffff);
    cat.mask = m;
    ph.addChild(m, cat);
    const zz = txt('Zzz…', { fontFamily: F.brush, fontSize: 40, fill: C.ink });
    zz.position.set(phW - 140, 20);
    ph.addChild(zz);
    const pcap = txt('FOTO: el sospechoso, minutos después del incidente del vaso.', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 16, fill: C.ink });
    pcap.position.set(0, phH + 6);
    ph.addChild(pcap);
    page.addChild(ph);

    // right columns: short news
    const colX = 660;
    const colW = PW - colX - 40;
    page.addChild(new Graphics().rect(colX - 22, 348, 2, PH - 348 - 130).fill(C.ink));
    const items: { kick: string; title: string; body: string; ic?: 'food' | 'clock' | 'orb' | 'gem' }[] = [];
    items.push(
      s.crops > 0
        ? { kick: 'MUELLE', title: `${s.crops} COSECHA${s.crops > 1 ? 'S' : ''} LISTA${s.crops > 1 ? 'S' : ''}`, body: 'Huele a pescado. En el buen sentido. Ve por ellas.', ic: 'food' }
        : { kick: 'MUELLE', title: 'SIN NOVEDAD EN EL MUELLE', body: 'Las sardinas siguen siendo sardinas. Siembra antes de irte la próxima.', ic: 'food' },
    );
    if (s.resonances.length) {
      const r = s.resonances[0];
      items.push({
        kick: 'SANTUARIO',
        title: s.resonances.length > 1 ? `${s.resonances.length} RESONANCIAS LISTAS` : 'RESONANCIA LISTA',
        body: tone(`${r.a} y ${r.b} volvieron de hacer quién sabe qué… y trajeron a alguien.`, `${r.a} y ${r.b} volvieron de hacer quién sabe qué chingaderas… y trajeron a alguien.`),
        ic: 'orb',
      });
    } else if (s.running) {
      items.push({ kick: 'OBRAS', title: `${s.running} RELOJ${s.running > 1 ? 'ES' : ''} VERDE${s.running > 1 ? 'S' : ''} EN MARCHA`, body: 'Siguen bajando solos. O juega y bajan más rápido.', ic: 'clock' });
    }
    items.push({
      kick: 'SUCESOS',
      title: `TIRARON ${s.glasses} VASO${s.glasses > 1 ? 'S' : ''}`,
      body: tone('Ningún vaso sobrevivió. Los gatos niegan todo.', 'Ningún vaso sobrevivió. Los gatos niegan todo, los cabrones.'),
    });
    let y = 348;
    for (const it of items) {
      const k = txt(it.kick, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.red, letterSpacing: 4 });
      k.position.set(colX, y);
      let tx = colX;
      if (it.ic) {
        const ic = icon(it.ic, 40);
        ic.position.set(colX + 20, y + 46);
        page.addChild(ic);
        tx = colX + 52;
      }
      const t = poster(it.title, 44, C.ink);
      t.position.set(tx, y + 18);
      if (t.width > colW - (tx - colX)) t.scale.set((colW - (tx - colX)) / t.width);
      const b = txt(clean(it.body), { fontFamily: F.serif, fontSize: 20, fill: C.ink, wordWrap: true, wordWrapWidth: colW, lineHeight: 25 });
      b.position.set(colX, y + 74);
      page.addChild(k, t, b);
      y += 74 + b.height + 22;
      page.addChild(new Graphics().rect(colX, y - 10, colW, 1.5).fill({ color: C.ink, alpha: 0.6 }));
    }
    // tip of the day
    const tipK = txt('TIP DEL DÍA', { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.red, letterSpacing: 4 });
    tipK.position.set(colX, y);
    const tipT = txt(loadingTip(), { fontFamily: F.serif, fontStyle: 'italic', fontSize: 20, fill: C.ink, wordWrap: true, wordWrapWidth: colW, lineHeight: 25 });
    tipT.position.set(colX, y + 22);
    if (y + 22 + tipT.height < PH - 140) page.addChild(tipK, tipT);

    // Luzterna + buttons
    const lz = new LuzternaPortrait(250, 0.9);
    lz.position.set(PW - 140, PH + 40);
    const say = txt(sysMsg('regreso_jugador', { oro: fmt(s.gold), v: s.glasses }), {
      fontFamily: F.ui,
      fontWeight: '700',
      fontSize: 21,
      fill: C.ink,
      wordWrap: true,
      wordWrapWidth: 520,
    });
    const sb = new Container();
    say.position.set(16, 10);
    sb.addChild(new Graphics().rect(6, 6, say.width + 32, say.height + 20).fill(C.ink).rect(0, 0, say.width + 32, say.height + 20).fill(C.yellow).stroke({ width: 4, color: C.ink, alignment: 1 }), say);
    sb.position.set(PW - 300 - say.width, PH - 150 - say.height);
    const go = new Button(opts.canCollectAll ? 'RECOLECTAR TODO' : '¡A LA ISLA!', () => close(true), { w: 340, h: 84, size: 40, color: C.yellow });
    go.position.set(PW / 2 - 170 - (opts.canCollectAll ? 130 : 0), PH - 108);
    page.addChild(sb, lz, go);
    if (opts.canCollectAll) {
      const later = new Button('LUEGO', () => close(false), { w: 200, h: 70, size: 30, color: C.paper });
      later.position.set(PW / 2 + 70 + 40, PH - 100);
      page.addChild(later);
    }

    // in
    sfx('whoosh');
    page.scale.set(0.2);
    page.alpha = 0;
    gsap
      .timeline()
      .to(page, { alpha: 1, duration: 0.15 }, 0)
      .to(page.scale, { x: 1, y: 1, duration: 0.5, ease: 'back.out(1.4)' }, 0)
      .call(() => sfx('paper'))
      .call(() => {
        goldCtr.set(s.gold);
        sfx('coin');
        sparkles(root, W / 2 - PW / 2 + 160, H / 2 - PH / 2 + 480, C.yellow, 14, 200);
      }, [], 0.6);

    let closed = false;
    function close(collect: boolean) {
      if (closed) return;
      closed = true;
      if (collect && opts.canCollectAll && opts.onCollectAll) {
        const n = opts.onCollectAll();
        if (n > 0) sfx('coin', 1.2);
      }
      gsap.to(page, { y: page.y + 60, alpha: 0, duration: 0.25, ease: 'power2.in' });
      gsap.to(dim, {
        alpha: 0,
        duration: 0.3,
        onComplete: () => {
          destroyDeep(root);
          resolve();
        },
      });
    }
  });
}
