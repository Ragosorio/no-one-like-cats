/**
 * PARTE III · EL FINAL — the battle's two story pieces (⚠️ SPOILERS; historia-v2/guiones/final/h94-sin-llama.md):
 *
 *   mountDarkness(scene)   «A oscuras»: the fight in black — only the pairs of eyes of YOUR cats (and the flashes) show
 *   miraPrompt(scene, o)   the single input «MIRA» over Canelo on turn 3; if nobody taps, he looks by himself (4 s)
 *
 * Presentation only: the rules (no defeat, the end) are the sim's (`rules.undying`, `retreat`) and BattleScene's
 * (`spec.final`). No text says «protégela», «sálvala» or «aguanta» (final/00-indice §2.5).
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { settings } from '../../core/settings';
import { C } from '../../ui/theme';
import { Button } from '../../ui/widgets';
import { W } from '../../core/App';

/** what these pieces need from BattleScene (kept narrow: the scene stays the owner of everything) */
export interface FinalFxHost {
  world: Container;
  overlay: Container;
  catViews: Map<string, Container>;
  sim: { sides: { cats: { def: { uid: string; species?: string }; ko?: boolean }[] }[] };
}

/** the dark over the world (under the UI): your cats' eyes blink in it; a cannon flash lifts it for an instant */
export function mountDarkness(host: FinalFxHost): { update(dt: number): void; flash(): void; destroy(): void } {
  const root = new Container();
  root.label = 'finalDarkness';
  const dark = new Graphics().rect(-3000, -3000, W + 6000, 9000).fill(0x020306);
  dark.alpha = 0.9;
  const eyes = new Graphics();
  root.addChild(dark, eyes);
  host.world.addChild(root);
  let t = 0;
  let lift = 0;
  const own = () => host.sim.sides[0].cats.filter((c) => !c.ko).map((c) => host.catViews.get(c.def.uid)).filter((v): v is Container => !!v && !v.destroyed);
  return {
    update(dt: number) {
      t += dt;
      lift = Math.max(0, lift - dt * 1.8);
      dark.alpha = 0.9 - lift * 0.45;
      eyes.clear();
      own().forEach((v, i) => {
        const p = host.world.toLocal(v.getGlobalPosition());
        // each pair blinks on its own clock (never all at once: they are cats, not lights)
        const blink = Math.sin(t * 0.9 + i * 2.3) > 0.97 ? 0.15 : 1;
        const y = p.y - 70;
        eyes.ellipse(p.x - 11, y, 6, 6 * blink).fill({ color: 0xffd84a, alpha: 0.95 });
        eyes.ellipse(p.x + 11, y, 6, 6 * blink).fill({ color: 0xffd84a, alpha: 0.95 });
        eyes.circle(p.x - 11, y, 14).fill({ color: 0xffd84a, alpha: 0.12 });
        eyes.circle(p.x + 11, y, 14).fill({ color: 0xffd84a, alpha: 0.12 });
      });
    },
    flash() {
      lift = settings.reduceFlashes ? 0.35 : 1;
    },
    destroy() {
      root.destroy({ children: true });
    },
  };
}

/** «MIRA» over Canelo (the first cat of the save, or the crew's first): resolves on the tap or after `auto` seconds */
export function miraPrompt(host: FinalFxHost, o: { auto?: number; label?: string; canelo?: string | null } = {}): Promise<'tap' | 'auto'> {
  return new Promise((resolve) => {
    const uid = o.canelo && host.catViews.has(o.canelo) ? o.canelo : host.sim.sides[0].cats[0]?.def.uid;
    const v = uid ? host.catViews.get(uid) : undefined;
    const at = v && !v.destroyed ? host.overlay.toLocal(v.getGlobalPosition()) : { x: W / 2, y: 420 };
    let done = false;
    const end = (how: 'tap' | 'auto') => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      gsap.to(b, { alpha: 0, duration: 0.3, onComplete: () => b.destroy({ children: true }) });
      resolve(how);
    };
    const b = new Button(o.label ?? 'MIRA', () => end('tap'), { w: 220, h: 84, size: 46, color: 0xffd84a, textColor: C.ink });
    b.position.set(Math.max(20, Math.min(W - 240, at.x - 110)), Math.max(60, at.y - 230));
    host.overlay.addChild(b);
    if (!settings.reduceMotion) gsap.fromTo(b.scale, { x: 0.6, y: 0.6 }, { x: 1, y: 1, duration: 0.35, ease: 'back.out(2)' });
    const timer = setTimeout(() => end('auto'), (o.auto ?? 4) * 1000);
  });
}
