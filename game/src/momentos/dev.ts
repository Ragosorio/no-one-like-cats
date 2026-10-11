/**
 * DEV tools for Momentos (dev server only).
 *   ?momento=liky_fight            play it standalone (first-time rules: unskippable, pausable)
 *   ?momento=liky_fight&replay=1   replay rules (pause menu has SALIR)
 *   ?momento=liky_fight&auto=great|hit|miss|none   autoplay inputs (QA)
 *   ?momento=liky_fight&scrub=1    no clock: window.__momento.render(m) draws any instant (contact sheets)
 *   ?momento=lab                   the cel treatment lab (paintings before / after)
 *   &mq=low|high                   force a quality tier
 */
import { Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { game, W, H } from '../core/App';
import { scenes, Scene } from '../core/scenes';
import { loadCatTexture, onCatArt, requestCatSvg, artSlug } from '../art/catArt';
import { bakeCel } from './anime/shaders';

class Blank extends Scene {
  override bleed = 0x0b0716;
}

async function fullTex(slug: string): Promise<Texture> {
  const lite = await loadCatTexture(slug);
  requestCatSvg(slug);
  return new Promise<Texture>((res) => {
    let done = false;
    // onCatArt may call back synchronously (already loaded): `off` is not assigned yet then
    let off: (() => void) | null = null;
    off = onCatArt(slug, (t) => {
      if (done) return;
      done = true;
      queueMicrotask(() => off?.());
      res(t);
    });
    if (done) off();
    setTimeout(() => {
      if (done) return;
      done = true;
      off?.();
      res(lite);
    }, 8000);
  });
}

export async function celLab() {
  const sc = new Blank();
  await scenes.go(sc, 'none');
  const bg = new Graphics().rect(-400, -200, W + 800, H + 400).fill(0x2c0f66);
  sc.addChild(bg);
  const slugs = (new URLSearchParams(location.search).get('cats') ?? 'canelo_cozy_cat,cascada_upfall_cat,lantern_spirit_cat').split(',');
  const col = W / slugs.length;
  const out: Record<string, unknown> = {};
  const qq = new URLSearchParams(location.search);
  const num = (k: string) => (qq.get(k) !== null ? Number(qq.get(k)) : undefined);
  const variants = (qq.get('v') ?? '').split(';').filter(Boolean).map((v) => Object.fromEntries(v.split(',').map((kv) => [kv.split('=')[0], Number(kv.split('=')[1])])));
  if (variants.length) {
    // one cat, several parameter sets side by side, zoomed on the top half (the face)
    const slug = artSlug(slugs[0]);
    const tex = await fullTex(slug);
    const cw = W / (variants.length + 1);
    const all = [null, ...variants];
    all.forEach((v, i) => {
      const t2 = v ? bakeCel(game.pixi.renderer, tex, v).tex : tex;
      const sp = new Sprite(t2);
      const sc2 = (cw - 10) / (tex.width * 0.62);
      sp.scale.set(sc2);
      sp.position.set(i * cw + 5 - tex.width * 0.19 * sc2, 10 - tex.height * 0.02 * sc2);
      const mask = new Graphics().rect(i * cw + 5, 0, cw - 10, H).fill(0xffffff);
      sp.mask = mask;
      const t = new Text({ text: v ? JSON.stringify(v) : 'original', style: { fontFamily: 'Space Grotesk', fontSize: 14, fill: 0xffffff } });
      t.position.set(i * cw + 8, H - 30);
      sc.addChild(sp, mask, t);
    });
    return out;
  }
  for (let i = 0; i < slugs.length; i++) {
    const slug = artSlug(slugs[i]);
    const tex = await fullTex(slug);
    const { tex: cel } = bakeCel(game.pixi.renderer, tex, { radius: num('r'), levels: num('lv'), edge: num('edge'), line: num('line'), sat: num('sat') });
    const a = new Sprite(tex);
    const b = new Sprite(cel);
    const s = Math.min((col - 20) / tex.width, (H / 2 - 40) / tex.height);
    a.scale.set(s);
    b.scale.set(s);
    a.position.set(i * col + 10, 20);
    b.position.set(i * col + 10, H / 2 + 10);
    const t = new Text({ text: slug, style: { fontFamily: 'Space Grotesk', fontSize: 18, fill: 0xffffff } });
    t.position.set(i * col + 12, H / 2 - 18);
    sc.addChild(a, b, t);
    out[slug] = { w: tex.width, h: tex.height, res: tex.source.resolution };
  }
  (window as unknown as { __celLab: unknown }).__celLab = out;
  return out;
}

export async function devMomento(id: string) {
  if (id === 'lab') return celLab();
  const q = new URLSearchParams(location.search);
  const { playMomento } = await import('./index');
  const sc = new Blank();
  await scenes.go(sc, 'none');
  const backdrop = new Container();
  backdrop.addChild(new Graphics().rect(-400, -200, W + 800, H + 400).fill(0x1a1030));
  sc.addChild(backdrop);
  const auto = q.get('auto') as 'great' | 'hit' | 'miss' | 'none' | null;
  return playMomento(id, {
    replay: q.get('replay') === '1',
    autoplay: auto ?? undefined,
    scrub: q.get('scrub') === '1',
    quality: (q.get('mq') as 'high' | 'low' | null) ?? undefined,
    standalone: true,
  });
}
