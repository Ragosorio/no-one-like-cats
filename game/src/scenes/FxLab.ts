import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { Scene, scenes } from '../core/scenes';
import { W, H } from '../core/App';
import { Button, paperBg, poster, txt } from '../ui/widgets';
import { C, F, RARITY } from '../ui/theme';
import { CATS, ELEMENTS, type CatDef } from '../data/content';
import { livingCat, preloadCats } from '../art/catArt';
import { ART, type CatPuppet } from '../art/livingCat';
import { settings } from '../core/settings';
import { toast } from '../ui/modal';
import type { Pull } from '../state/sys/gacha';

/**
 * Dev scene (?scene=fxlab): the big FX sequences on demand, with any cat.
 * &cat=<slug or species id> picks the starting cat. Nothing here touches the save:
 * every sequence gets hand-made options (the same shape the real callers pass).
 *
 * Sources: src/fx/sequences/{catReveal,elementDiscovery,gachaSummon,starUp,victoryNews}.ts
 */
export class FxLab extends Scene {
  private idx = 0;
  private stage = new Container();
  private puppet: CatPuppet | null = null;
  private info = new Container();
  private busy = false;

  override async enter() {
    this.addChild(paperBg(W, H));
    const title = poster('SECUENCIAS FX', 110, C.ink, { letterSpacing: -2 });
    title.position.set(50, 14);
    const kicker = txt('LABORATORIO · elige un gato y dispara una secuencia · src/fx/sequences/', { fontFamily: F.bebas, fontSize: 30, fill: C.red, letterSpacing: 2 });
    kicker.position.set(56, 140);
    this.addChild(title, kicker);

    const want = new URLSearchParams(location.search).get('cat');
    if (want) {
      const i = CATS.findIndex((c) => c.id === want || c.art.slug === want);
      if (i >= 0) this.idx = i;
    }

    // cat stage (left)
    const box = new Graphics().rect(8, 8, 720, 740).fill(C.ink).rect(0, 0, 720, 740).fill(C.mintLight).stroke({ width: 4, color: C.ink, alignment: 1 });
    box.position.set(56, 196);
    this.stage.position.set(56 + 360, 196 + 640);
    this.info.position.set(56, 196 + 760);
    this.addChild(box, this.stage, this.info);
    const prev = new Button('<', () => this.pick(-1), { w: 90, h: 70, size: 40, color: C.paper });
    const next = new Button('>', () => this.pick(1), { w: 90, h: 70, size: 40, color: C.paper });
    prev.position.set(76, 216);
    next.position.set(56 + 720 - 110, 216);
    this.addChild(prev, next);

    // sequence buttons (right)
    const seqs: [string, string, () => Promise<unknown>][] = [
      ['REVELAR GATO', 'catReveal.ts · gato nuevo (Catdex, gacha, historia)', () => this.reveal({})],
      ['REVELAR DUPLICADO', 'catReveal.ts · versión corta con barra de estrellas', () => this.reveal({ dup: true })],
      ['REVELAR HOLO', 'catReveal.ts · variante holográfica', () => this.reveal({ holo: true })],
      ['ELEMENTO NUEVO', 'elementDiscovery.ts · T4: el mundo se reimprime', () => this.discovery()],
      ['INVOCAR x1', 'gachaSummon.ts · portal + carta', () => this.summon(1)],
      ['INVOCAR x10', 'gachaSummon.ts · 10 cartas, la mejor manda', () => this.summon(10)],
      ['ESTRELLA ★3', 'starUp.ts · subida corta', () => this.starUp(3)],
      ['ESTRELLA ★4', 'starUp.ts · el disparo cambia', () => this.starUp(4)],
      ['ESTRELLA ★5', 'starUp.ts · póster a pantalla completa', () => this.starUp(5)],
      ['PORTADA DE VICTORIA', 'victoryNews.ts · el Diario del Mar', () => this.news()],
    ];
    const x0 = 830;
    seqs.forEach(([label, file, run], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = x0 + col * 520;
      const y = 200 + row * 150;
      const b = new Button(label, () => void this.run(run), { w: 480, h: 76, size: 34, color: [C.yellow, C.pink, C.mint, C.lilac][row % 4] });
      b.position.set(x, y);
      const t = txt(file, { fontFamily: F.ui, fontSize: 17, fill: C.ink });
      t.position.set(x + 4, y + 88);
      this.addChild(b, t);
    });

    const back = new Button('LABORATORIO', () => (location.search = '?scene=dev'), { w: 280, h: 64, size: 28, color: C.paper });
    back.position.set(W - 330, 40);
    this.addChild(back);
    const foot = txt(
      `Movimiento reducido: ${settings.reduceMotion ? 'ACTIVADO (las secuencias usan su versión corta)' : 'apagado'} · las opciones de cada secuencia están en FxLab.ts, igual que las pasa el juego real`,
      { fontFamily: F.ui, fontSize: 18, fill: C.ink },
    );
    foot.position.set(x0, H - 46);
    this.addChild(foot);
    await this.show();
  }

  private get cat(): CatDef {
    return CATS[this.idx];
  }

  private pick(d: number) {
    if (this.busy) return;
    this.idx = (this.idx + d + CATS.length) % CATS.length;
    void this.show();
  }

  private async show() {
    const cd = this.cat;
    const slug = cd.art.slug;
    await preloadCats([slug]).catch(() => undefined);
    if (this.destroyed || this.cat !== cd) return;
    this.stage.removeChildren().forEach((c) => c.destroy({ children: true }));
    const p = livingCat(slug, { anchorX: 0.5, anchorY: 0.94, fps: 15, detail: true });
    p.scale.set(600 / ART);
    this.stage.addChild(p);
    this.puppet = p;
    gsap.from(p.scale, { x: 0, y: 0, duration: 0.35, ease: 'back.out(2)' });
    this.info.removeChildren().forEach((c) => c.destroy({ children: true }));
    const name = poster(`${cd.name.toUpperCase()} ${cd.epithet}`, 46, C.ink);
    const meta = txt(`${RARITY[this.rarity(cd)].name} · ${cd.elements.join(' + ')} · ${cd.id} · ${slug}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.plum });
    meta.position.set(2, 58);
    if (name.width > 720) name.scale.set(720 / name.width);
    this.info.addChild(name, meta);
  }

  private rarity(cd: CatDef) {
    return cd.primordial ? 'primordial' : cd.rarity;
  }

  private async run(fn: () => Promise<unknown>) {
    if (this.busy) return;
    this.busy = true;
    try {
      await fn();
    } catch (e) {
      console.error(e);
      toast('La secuencia tronó', { color: C.pink, sub: String((e as Error)?.message ?? e).slice(0, 120) });
    } finally {
      this.busy = false;
      this.puppet?.emote('happy');
    }
  }

  private async reveal(o: { dup?: boolean; holo?: boolean }) {
    const cd = this.cat;
    const { playCatReveal } = await import('../fx/sequences/catReveal');
    await playCatReveal(scenes.fxLayer, {
      slug: cd.art.slug,
      name: cd.name,
      elements: cd.elements,
      rarity: this.rarity(cd),
      species: cd.id,
      caption: cd.lore,
      subtitle: `${cd.epithet} · ${cd.battleForm.cry}`,
      holo: o.holo,
      serial: this.idx + 1,
      dex: o.dup ? undefined : [12, 13, CATS.length],
      duplicateOrbs: o.dup ? 6 : undefined,
      dup: o.dup ? { before: 4, after: 10, need: 10, star: 2, missing: 0, ready: true } : undefined,
    });
  }

  private async discovery() {
    const cd = this.cat;
    const el = cd.elements[0] ?? 'fire';
    const { playElementDiscovery } = await import('../fx/sequences/elementDiscovery');
    const known = ELEMENTS.map((e) => e.id).filter((id) => id !== el).slice(0, 4);
    await playElementDiscovery(scenes.fxLayer, {
      element: el,
      world: this,
      primordialSlug: cd.art.slug,
      known,
      resonances: 3,
      stamps: [`NUEVO HÁBITAT: ${el.toUpperCase()}`, 'YA PUEDES CONSTRUIRLO EN LA TIENDA'],
      caption: 'Prueba de laboratorio: nadie salió herido. Bueno, casi nadie.',
    });
  }

  private async summon(n: 1 | 10) {
    const cd = this.cat;
    const [{ playSummon }, { BANNERS }] = await Promise.all([import('../fx/sequences/gachaSummon'), import('../state/sys/gacha')]);
    const tiers: Pull['tier'][] = ['common', 'common', 'rare', 'common', 'rare', 'common', 'epic', 'common', 'rare', 'legendary'];
    const pulls: Pull[] = Array.from({ length: n }, (_, i) => {
      const last = i === n - 1;
      const tier: Pull['tier'] = last ? (cd.rarity === 'legendary' ? 'legendary' : 'epic') : tiers[i];
      const prize = last
        ? { kind: 'cat' as const, n: 1, ref: cd.id, tier }
        : { kind: (i % 2 ? 'gold' : 'food') as 'gold' | 'food', n: 1200 + i * 300, tier };
      return { tier, prize, got: { ...prize, label: last ? cd.name.toUpperCase() : `${prize.n}`, isNew: true }, pity: null, mode: 'normal' as Pull['mode'] };
    });
    await playSummon(scenes.overlayLayer, pulls, BANNERS[0]);
  }

  private async starUp(to: 3 | 4 | 5) {
    const cd = this.cat;
    const { playStarUp } = await import('../fx/sequences/starUp');
    await playStarUp(scenes.overlayLayer, {
      species: cd.id,
      name: cd.name,
      level: 20,
      fromStars: to - 1,
      toStars: to,
      ownBefore: 10,
      need: 10,
      prismaUsed: 0,
      element: cd.elements[0],
      stats: [
        { label: 'PODER', from: 12.4, to: 15.1, digits: 1 },
        { label: 'ORO / S', from: 1.2, to: 1.55, digits: 2 },
      ],
      unlockTitle: `★${to} · LABORATORIO`,
      unlockText: to === 3 ? cd.combat.star3 : to === 5 ? cd.combat.star5 : `${cd.combat.shot.name}: versión nueva`,
      shotName: cd.combat.shot.name,
      shotCry: cd.combat.shot.cry ?? cd.battleForm.cry,
      perkLines: [cd.combat.star3, cd.combat.star5],
    });
  }

  private async news() {
    const cd = this.cat;
    const { VictoryNews } = await import('../fx/sequences/victoryNews');
    await preloadCats([cd.art.slug]).catch(() => undefined);
    const layer = new Container();
    const dim = new Graphics().rect(-W, -H, W * 3, H * 3).fill({ color: C.ink, alpha: 0.7 });
    layer.addChild(dim);
    const news = new VictoryNews({
      headline: `¡${cd.name.toUpperCase()} HUNDE OTRO BARCO!`,
      kicker: '¡EXTRA! ¡EXTRA!',
      sub: `${cd.battleForm.cry} — testigos aseguran que nadie lo vio venir. Ni el barco.`,
      caption: 'Foto de archivo: el laboratorio.',
      edition: 'AÑO I · Nº 0001',
      place: 'LABORATORIO · HOY',
      photo: null,
      mvpSpecies: cd.id,
      rows: [
        { kind: 'gold', label: 'Doblones', value: 4200 },
        { kind: 'scrap', label: 'Chatarra', value: 36 },
        { kind: 'gem', label: 'Ojos de Gato', value: 5 },
      ],
      golden: cd.rarity === 'legendary',
      perfect: true,
      momentum: [2, 3],
    });
    news.position.set((W - news.pageW) / 2, 44);
    layer.addChild(news);
    scenes.overlayLayer.addChild(layer);
    const tl = news.timeline();
    await new Promise<void>((resolve) => {
      layer.eventMode = 'static';
      layer.hitArea = { contains: () => true };
      layer.on('pointertap', () => {
        if (tl.progress() < 1) {
          tl.progress(1);
          news.complete();
          return;
        }
        gsap.to(layer, { alpha: 0, duration: 0.25, onComplete: () => (layer.destroy({ children: true }), resolve()) });
      });
    });
  }
}
