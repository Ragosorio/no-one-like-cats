/**
 * H02 "¿Cómo se llama?" — poster prompt to rename the first cat.
 * Text entry uses an invisible DOM <input> laid over the Pixi name plate (IME/accents/paste for free);
 * Pixi draws the text and caret so it looks like the rest of the poster UI.
 */
import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js';
import { OutlineFilter } from 'pixi-filters';
import gsap from 'gsap';
import { W, H, game } from '../../core/App';
import { sfx } from '../../core/audio';
import { C, F } from '../theme';
import { Button, dotGrid, poster, txt } from '../widgets';
import { catTexture, livingCat, preloadCats } from '../../art/catArt';
import { halftoneTexture, paperTexture } from '../../art/textures';
import { onomatopoeia, sparkles } from '../../fx/juice';
import { clean } from './text';
import { LuzternaPortrait, preloadStoryArt } from './portrait';
import { destroyDeep } from './tweens';

const SUGGEST = ['Michi', 'Don Gato', 'Pelusa', 'Tostada', 'Sr. Bigotes', 'Nacho'];

export interface NamePromptOpts {
  current: string;
  /** cat art on the left (default) or Luzterna */
  slug?: string | null;
  title1: string;
  title2: string;
  sub: string;
  tag: string;
  suggestions: string[];
  ok: string;
  keep: string;
  /** shout when it's settled (default ¡NAME!) */
  shout?: (name: string) => string;
}

/** H02: rename the first cat */
export async function promptCatName(layer: Container, current: string, slug = 'canelo_cozy_cat'): Promise<string> {
  return promptName(layer, {
    current,
    slug,
    title1: '¿CÓMO SE',
    title2: 'LLAMA?',
    sub: "Tu primer gato. Tu primer error de nombre. Si le pones 'Michi' no te juzgo. Mucho.",
    tag: 'MISIÓN H02 · ACTO DE BAUTIZO OFICIAL',
    suggestions: SUGGEST,
    ok: 'ASÍ SE LLAMA',
    keep: `DEJAR "${current.toUpperCase()}"`,
  });
}

/** Poster name entry (cats, the player…). Resolves with the trimmed name (or `current`). */
export async function promptName(layer: Container, o: NamePromptOpts): Promise<string> {
  const current = o.current;
  const slug = o.slug ?? null;
  await Promise.all([slug ? preloadCats([slug]) : Promise.resolve(), preloadStoryArt()]);
  return new Promise((resolve) => {
    const root = new Container();
    layer.addChild(root);
    const dim = new Graphics().rect(0, 0, W, H).fill({ color: C.ink, alpha: 0.65 });
    dim.eventMode = 'static';
    root.addChild(dim);

    const PW = 1180;
    const PH = 720;
    const panel = new Container();
    panel.position.set((W - PW) / 2, (H - PH) / 2 + 10);
    root.addChild(panel);
    panel.addChild(new Graphics().rect(16, 16, PW, PH).fill(C.ink));
    panel.addChild(new TilingSprite({ texture: paperTexture(C.paper), width: PW, height: PH }));
    panel.addChild(new Graphics().rect(0, 0, PW, PH).stroke({ width: 6, color: C.ink, alignment: 1 }));
    // swiss blocks
    const circle = new Graphics().circle(0, 0, 250).fill(C.pink);
    circle.position.set(300, 420);
    const block = new Graphics().rect(0, 0, 70, PH).fill(C.ink);
    const dots = new TilingSprite({ texture: halftoneTexture(C.pinkHot, 12, 3), width: 300, height: 200 });
    dots.alpha = 0.3;
    dots.position.set(110, 470);
    const dg = dotGrid(3, 6, 18, 3);
    dg.position.set(PW - 90, 40);
    panel.addChild(block, circle, dots, dg);
    const v = txt(o.tag, { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.paper, letterSpacing: 3 });
    v.rotation = -Math.PI / 2;
    v.position.set(24, PH - 30);
    panel.addChild(v);
    // cat (or Luzterna, big)
    let cat: Container;
    if (slug) {
      const sp = livingCat(slug);
      sp.anchor.set(0.5, 0.92);
      sp.scale.set(420 / sp.texture.height);
      sp.position.set(300, 640);
      sp.filters = [new OutlineFilter({ thickness: 5, color: C.ink, quality: 0.25 })];
      cat = sp;
    } else {
      const lzBig = new LuzternaPortrait(560, 0.95);
      lzBig.position.set(300, 700);
      cat = lzBig;
    }
    panel.addChild(cat);
    gsap.to(cat.scale, { y: cat.scale.y * 0.985, x: cat.scale.x * 1.01, duration: 0.9, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    // title
    const t = poster(o.title1, 120, C.ink, { letterSpacing: -3 });
    const t2 = poster(o.title2, 120, C.pinkHot, { letterSpacing: -3 });
    t.position.set(560, 26);
    t2.position.set(560, 134);
    panel.addChild(t, t2);
    const sub = txt(clean(o.sub), {
      fontFamily: F.ui,
      fontWeight: '700',
      fontSize: 22,
      fill: C.ink,
      wordWrap: true,
      wordWrapWidth: 560,
    });
    sub.position.set(566, 270);
    panel.addChild(sub);
    // name plate
    const plate = new Container();
    const pw = 540;
    const ph = 96;
    plate.addChild(new Graphics().rect(8, 8, pw, ph).fill(C.ink).rect(0, 0, pw, ph).fill(C.yellow).stroke({ width: 5, color: C.ink, alignment: 1 }));
    const label = txt('NOMBRE', { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: C.ink, letterSpacing: 3 });
    label.position.set(16, 6);
    const nameT = poster(current, 60, C.ink);
    nameT.position.set(18, 18);
    const caret = new Graphics().rect(0, 0, 6, 54).fill(C.pinkHot);
    caret.y = 26;
    plate.addChild(label, nameT, caret);
    plate.position.set(566, 352);
    plate.eventMode = 'static';
    plate.cursor = 'text';
    panel.addChild(plate);
    gsap.to(caret, { alpha: 0, duration: 0.45, yoyo: true, repeat: -1, ease: 'steps(1)' });
    // suggestions
    const chips = new Container();
    let cx = 0;
    let cy = 0;
    for (const s of o.suggestions) {
      const chip = new Container();
      const ct = txt(s, { fontFamily: F.ui, fontWeight: '700', fontSize: 20, fill: C.ink });
      ct.position.set(14, 7);
      const w = ct.width + 28;
      chip.addChild(new Graphics().rect(0, 0, w, 38).fill(C.paper).stroke({ width: 3, color: C.ink, alignment: 1 }), ct);
      if (cx + w > 560) {
        cx = 0;
        cy += 48;
      }
      chip.position.set(cx, cy);
      cx += w + 10;
      chip.eventMode = 'static';
      chip.cursor = 'pointer';
      chip.on('pointertap', (e) => {
        e.stopPropagation();
        sfx('click');
        input.value = s;
        sync();
        input.focus();
      });
      chips.addChild(chip);
    }
    chips.position.set(566, 476);
    panel.addChild(chips);
    // buttons
    const ok = new Button(o.ok, () => finish(input.value), { w: 320, h: 84, size: 40, color: C.yellow });
    ok.position.set(566, PH - 124);
    const keep = new Button(o.keep, () => finish(current), { w: 250, h: 70, size: o.keep.length > 14 ? 22 : 26, color: C.paper });
    keep.position.set(906, PH - 110);
    panel.addChild(ok, keep);
    // tiny Luzterna peeking (when the big art is a cat)
    if (slug) {
      const lz = new LuzternaPortrait(260, 0.9);
      lz.position.set(PW + 60, 300);
      lz.scale.x = -1;
      panel.addChild(lz);
    }

    // DOM input
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 14;
    input.value = current;
    input.autocomplete = 'off';
    input.spellcheck = false;
    Object.assign(input.style, {
      position: 'fixed',
      opacity: '0',
      border: '0',
      padding: '0',
      background: 'transparent',
      color: 'transparent',
      caretColor: 'transparent',
      zIndex: '10',
      fontSize: '16px',
    } as CSSStyleDeclaration);
    document.body.appendChild(input);
    const placeInput = () => {
      const r = game.pixi.canvas.getBoundingClientRect();
      const s = game.scale;
      const gx = panel.x + plate.x;
      const gy = panel.y + plate.y;
      input.style.left = `${r.left + game.root.x + gx * s}px`;
      input.style.top = `${r.top + game.root.y + gy * s}px`;
      input.style.width = `${pw * s}px`;
      input.style.height = `${ph * s}px`;
    };
    placeInput();
    window.addEventListener('resize', placeInput);
    const sync = () => {
      const val = input.value.slice(0, 14);
      nameT.text = val || ' ';
      caret.x = 18 + (val ? nameT.width : 0) + 4;
      sfx('tick', 1 + Math.random() * 0.4);
    };
    input.addEventListener('input', sync);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') finish(input.value);
      else if (e.key === 'Escape') finish(current);
    };
    input.addEventListener('keydown', onKey);
    plate.on('pointertap', () => input.focus());
    dim.on('pointertap', () => input.focus());
    caret.x = 18 + nameT.width + 4;
    window.setTimeout(() => {
      input.focus();
      input.select();
    }, 60);
    // when the whole text is selected (first focus) show it highlighted
    const selHi = new Graphics().rect(14, 20, 10, 64).fill({ color: C.pinkHot, alpha: 0.25 });
    plate.addChildAt(selHi, 1);
    const selTick = () => {
      const all = document.activeElement === input && input.selectionStart === 0 && input.selectionEnd === input.value.length && input.value.length > 0;
      selHi.visible = all;
      if (all) selHi.clear().rect(14, 20, nameT.width + 10, 64).fill({ color: C.pinkHot, alpha: 0.3 });
    };
    gsap.ticker.add(selTick);

    sfx('paper');
    gsap.from(panel, { y: panel.y + 80, alpha: 0, duration: 0.32, ease: 'back.out(1.5)' });
    dim.alpha = 0;
    gsap.to(dim, { alpha: 1, duration: 0.2 });

    let done = false;
    function finish(name: string) {
      if (done) return;
      done = true;
      const final = name.trim() || current;
      gsap.ticker.remove(selTick);
      window.removeEventListener('resize', placeInput);
      input.removeEventListener('input', sync);
      input.removeEventListener('keydown', onKey);
      input.blur();
      input.remove();
      nameT.text = final;
      caret.visible = false;
      sfx('levelup');
      sparkles(root, panel.x + plate.x + pw / 2, panel.y + plate.y + ph / 2, C.yellow, 16, 220);
      onomatopoeia(root, panel.x + 300, panel.y + 220, o.shout ? o.shout(final) : final.length <= 8 ? `¡${final.toUpperCase()}!` : '¡BAUTIZADO!', { size: 110, color: C.yellow, dur: 1.1 });
      gsap.to(panel, {
        y: panel.y - 40,
        alpha: 0,
        delay: 0.9,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          gsap.killTweensOf(caret);
          gsap.killTweensOf(cat.scale);
          destroyDeep(root);
        },
      });
      gsap.to(dim, { alpha: 0, delay: 0.95, duration: 0.25 });
      // the name applies right away; the poster finishes its exit on its own
      root.eventMode = 'none';
      resolve(final);
    }
  });
}
