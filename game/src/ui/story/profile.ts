/**
 * Player profile (name + gender) — asked by Luzterna when she wakes you up (new game), on load for old
 * saves without a profile, and from Ajustes › TU PERFIL. Saved in G.s.player = { name, gender }.
 *
 *   CHICO → 'm' · CHICA → 'f' · PREFIERO NO DECIR → "No mames, wey." → "¿perro o perra?"
 *   → PERRO 'm' · PERRA 'f' · SIGO SIN DECIR 'x' (neutral language from then on).
 */
import { Container, Graphics, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { sfx } from '../../core/audio';
import { C, F } from '../theme';
import { Button, dotGrid, poster, txt } from '../widgets';
import { halftoneTexture, paperTexture } from '../../art/textures';
import { onomatopoeia, sparkles } from '../../fx/juice';
import { G } from '../../state/game';
import { say, Line } from '../dialog';
import { gtxt } from '../gender';
import { clean } from './text';
import { LuzternaPortrait, preloadStoryArt } from './portrait';
import { promptName } from './nameCat';
import { destroyDeep } from './tweens';

type Gender = 'm' | 'f' | 'x';

export interface ChoiceOpt<T> {
  label: string;
  value: T;
  color: number;
  text?: number;
}

/** Swiss poster with a big two-line question and 2–3 chunky answers. */
export async function choicePrompt<T>(layer: Container, o: { title1: string; title2: string; sub: string; tag: string; options: ChoiceOpt<T>[] }): Promise<T> {
  await preloadStoryArt();
  return new Promise((resolve) => {
    const root = new Container();
    layer.addChild(root);
    const dim = new Graphics().rect(0, 0, W, H).fill({ color: C.ink, alpha: 0.65 });
    dim.eventMode = 'static';
    root.addChild(dim);
    const PW = 1180;
    const PH = 640;
    const panel = new Container();
    panel.position.set((W - PW) / 2, (H - PH) / 2 + 10);
    root.addChild(panel);
    panel.addChild(new Graphics().rect(16, 16, PW, PH).fill(C.ink));
    panel.addChild(new TilingSprite({ texture: paperTexture(C.paper), width: PW, height: PH }));
    panel.addChild(new Graphics().rect(0, 0, PW, PH).stroke({ width: 6, color: C.ink, alignment: 1 }));
    const circle = new Graphics().circle(0, 0, 200).fill(C.yellow);
    circle.position.set(PW - 230, 250);
    const dots = new TilingSprite({ texture: halftoneTexture(C.orange, 12, 3), width: 320, height: 220 });
    dots.alpha = 0.35;
    dots.position.set(PW - 360, 30);
    const block = new Graphics().rect(0, 0, 70, PH).fill(C.ink);
    const dg = dotGrid(3, 6, 18, 3);
    dg.position.set(110, PH - 140);
    panel.addChild(circle, dots, block, dg);
    const v = txt(o.tag, { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.paper, letterSpacing: 3 });
    v.rotation = -Math.PI / 2;
    v.position.set(24, PH - 30);
    panel.addChild(v);
    const t1 = poster(o.title1, 112, C.ink, { letterSpacing: -3 });
    const t2 = poster(o.title2, 112, C.pinkHot, { letterSpacing: -3 });
    t1.position.set(110, 30);
    t2.position.set(110, 132);
    const sub = txt(clean(o.sub), { fontFamily: F.ui, fontWeight: '700', fontSize: 24, fill: C.ink, wordWrap: true, wordWrapWidth: 720, lineHeight: 32 });
    sub.position.set(116, 270);
    panel.addChild(t1, t2, sub);
    const lz = new LuzternaPortrait(380, 0.92);
    lz.position.set(PW - 170, PH - 20);
    lz.scale.x = -1;
    panel.addChild(lz);
    const n = o.options.length;
    const bw = n >= 3 ? 290 : 360;
    const gap = 26;
    let done = false;
    o.options.forEach((op, i) => {
      const b = new Button(op.label, () => {
        if (done) return;
        done = true;
        sfx('levelup');
        sparkles(root, panel.x + b.x + bw / 2, panel.y + b.y + 46, op.color, 16, 200);
        gsap.to(panel, {
          y: panel.y - 40,
          alpha: 0,
          delay: 0.35,
          duration: 0.28,
          ease: 'power2.in',
          onComplete: () => destroyDeep(root),
        });
        gsap.to(dim, { alpha: 0, delay: 0.4, duration: 0.2 });
        root.eventMode = 'none';
        resolve(op.value);
      }, { w: bw, h: 96, size: op.label.length > 12 ? 30 : 42, color: op.color, textColor: op.text ?? C.ink });
      b.position.set(116 + i * (bw + gap), PH - 150);
      panel.addChild(b);
      gsap.from(b, { y: b.y + 40, alpha: 0, duration: 0.25, delay: 0.15 + i * 0.07, ease: 'back.out(2)' });
    });
    sfx('paper');
    gsap.from(panel, { y: panel.y + 80, alpha: 0, duration: 0.32, ease: 'back.out(1.5)' });
    dim.alpha = 0;
    gsap.to(dim, { alpha: 1, duration: 0.2 });
  });
}

const NAMES = ['Capi', 'Ale', 'Sam', 'Nico', 'Dani', 'Fer'];

/**
 * Ask name + gender. `intro` = Luzterna lines before the poster (skippable flows pass []).
 * Resolves after G.s.player is saved.
 */
export async function askPlayerProfile(layer: Container, o: { intro?: Line[]; fromSettings?: boolean; guard?: () => boolean } = {}): Promise<{ name: string; gender: Gender } | null> {
  const prev = G.s.player;
  // the story asks only on the island: if the screen changed (battle, results…) stop and ask another time
  const ok = () => !o.guard || o.guard();
  if (!ok()) return null;
  if (o.intro?.length) await say(o.intro, { dim: 0.3 });
  if (!ok()) return null;
  const name = (
    await promptName(layer, {
      current: prev?.name ?? '',
      slug: null,
      title1: '¿CÓMO TE',
      title2: 'LLAMAS?',
      sub: 'Para el acta del Diario del Mar. Y para gritarlo bien fuerte cuando hagas algo épico. O muy tonto.',
      tag: 'REGISTRO DE TRIPULACIÓN · FOLIO 001',
      suggestions: NAMES,
      ok: 'ASÍ ME LLAMO',
      keep: prev?.name ? `SEGUIR COMO "${prev.name.toUpperCase().slice(0, 10)}"` : 'CAPI ESTÁ BIEN',
      shout: (n) => (n.length <= 8 ? `¡${n.toUpperCase()}!` : '¡A BORDO!'),
    })
  ).slice(0, 14) || 'Capi';
  if (!ok()) return null;
  await say([['LUZTERNA', `${name}. Me gusta. Suena a alguien que ya se cayó de una balsa al menos una vez.`]], { dim: 0.25 });
  if (!ok()) return null;
  let gender = await choicePrompt<Gender | 'skip'>(layer, {
    title1: '¿ERES CHICO',
    title2: 'O CHICA?',
    sub: 'Es para hablarte bonito. Bueno, para hablarte. Lo de bonito ya veremos.',
    tag: 'REGISTRO DE TRIPULACIÓN · CASILLA 2',
    options: [
      { label: 'CHICO', value: 'm', color: C.megaBlue, text: C.paper },
      { label: 'CHICA', value: 'f', color: C.pinkHot, text: C.ink },
      { label: 'PREFIERO NO DECIR', value: 'skip', color: C.mint },
    ],
  });
  if (gender === 'skip') {
    if (!ok()) return null;
    await say(
      [
        ['LUZTERNA', 'No mames, wey.'],
        ['LUZTERNA', 'Perdón, se me salió lo mexicano. Es que lo visité ayer.'],
        ['LUZTERNA', 'En fin, dilo: ¿perro o perra?'],
      ],
      { dim: 0.3 },
    );
    gender = await choicePrompt<Gender>(layer, {
      title1: '¿PERRO',
      title2: 'O PERRA?',
      sub: 'Última oportunidad. (Mentira, en Ajustes lo puedes cambiar cuando quieras.)',
      tag: 'REGISTRO DE TRIPULACIÓN · CASILLA 2 (OTRA VEZ)',
      options: [
        { label: 'PERRO', value: 'm', color: C.megaBlue, text: C.paper },
        { label: 'PERRA', value: 'f', color: C.pinkHot },
        { label: 'SIGO SIN DECIR', value: 'x', color: C.paper },
      ],
    });
    if (gender === 'x') await say([['LUZTERNA', 'Va, misterio total. Me caes bien.']], { dim: 0.25 });
  }
  const g = gender as Gender;
  G.s.player = { name, gender: g };
  G.save();
  const welcome = o.fromSettings
    ? gtxt('Listo, {name}. Anotad{g:o|a|e} otra vez en el acta. Con tinta, que es para siempre. Bueno, hasta que lo cambies.')
    : gtxt('Mucho gusto, {name}. Bienvenid{g:o|a|e} a bordo. Capitana fantasma, gatos dormidos y cero sueldo. Lo de siempre.');
  await say([['LUZTERNA', welcome]], { dim: 0.25 });
  onomatopoeia(layer, W / 2, H / 2 - 120, g === 'x' ? '¡MISTERIO!' : '¡A BORDO!', { size: 120, color: C.yellow, dur: 1 });
  return { name, gender: g };
}
