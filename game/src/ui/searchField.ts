/**
 * SearchField — a poster-style text field drawn in Pixi; tapping it lays a real DOM <input> exactly
 * over it (phones get their keyboard, IME/accents just work) and `onChange` fires as you type
 * (debounced). Escape / Enter / tapping elsewhere close the input; the Pixi text keeps the query.
 */
import { Container, Graphics, Text } from 'pixi.js';
import { game } from '../core/App';
import { F } from './theme';
import { txt } from './widgets';

export interface SearchFieldStyle {
  field: number;
  ink: number;
  border: number;
}

export class SearchField extends Container {
  value = '';
  private labelText: Text;
  private input: HTMLInputElement | null = null;
  private debounce = 0;
  constructor(
    public fw: number,
    public fh: number,
    private style: SearchFieldStyle,
    private onChange: (v: string) => void,
    private placeholder = 'Buscar gato…',
  ) {
    super();
    const t = style;
    const fg = new Graphics().rect(3, 3, fw, fh).fill(t.border).rect(0, 0, fw, fh).fill(t.field).stroke({ width: 2.5, color: t.border, alignment: 1 });
    const r = fh * 0.2;
    const cy = fh * 0.45;
    const lens = new Graphics()
      .circle(22, cy, r)
      .stroke({ width: 3, color: t.ink })
      .moveTo(22 + r * 0.75, cy + r * 0.75)
      .lineTo(22 + r * 1.55, cy + r * 1.55)
      .stroke({ width: 3.5, color: t.ink, cap: 'round' });
    this.labelText = txt('', { fontFamily: F.ui, fontWeight: '700', fontSize: Math.round(fh * 0.43), fill: t.ink });
    this.labelText.anchor.set(0, 0.5);
    this.labelText.position.set(46, fh / 2);
    const clear = txt('×', { fontFamily: F.poster, fontSize: Math.round(fh * 0.64), fill: t.ink });
    clear.anchor.set(0.5);
    clear.position.set(fw - 20, fh / 2);
    clear.eventMode = 'static';
    clear.cursor = 'pointer';
    clear.on('pointertap', (e) => {
      e.stopPropagation();
      if (this.input) this.input.value = '';
      this.set('');
    });
    this.addChild(fg, lens, this.labelText, clear);
    this.eventMode = 'static';
    this.cursor = 'text';
    this.on('pointertap', () => this.open());
    this.paint();
    this.once('destroyed', () => this.close());
  }

  private paint() {
    const empty = !this.value;
    this.labelText.text = empty ? this.placeholder : this.value;
    this.labelText.alpha = empty ? 0.45 : 1;
    const max = this.fw - 80;
    this.labelText.scale.set(this.labelText.width > max ? max / (this.labelText.width / this.labelText.scale.x) : 1);
  }
  /** show a query without firing onChange (restoring a screen) */
  setValue(v: string) {
    this.value = v;
    this.paint();
  }
  /** set the query from code (fires onChange, debounced) */
  set(v: string) {
    this.value = v;
    this.paint();
    window.clearTimeout(this.debounce);
    this.debounce = window.setTimeout(() => !this.destroyed && this.onChange(this.value), 110);
  }

  open() {
    if (this.input) {
      this.input.focus({ preventScroll: true });
      return;
    }
    const canvas = game.pixi.canvas as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const p = this.getGlobalPosition();
    const k = this.worldTransform.a;
    const el = document.createElement('input');
    el.type = 'text';
    el.value = this.value;
    el.placeholder = this.placeholder;
    el.autocomplete = 'off';
    el.spellcheck = false;
    Object.assign(el.style, {
      position: 'fixed',
      left: `${rect.left + p.x + 42 * k}px`,
      top: `${rect.top + p.y + 2 * k}px`,
      width: `${(this.fw - 80) * k}px`,
      height: `${(this.fh - 4) * k}px`,
      font: `700 ${Math.round(this.fh * 0.43 * k)}px "Space Grotesk", sans-serif`,
      background: 'transparent',
      color: '#' + this.style.ink.toString(16).padStart(6, '0'),
      border: 'none',
      outline: 'none',
      padding: '0',
      zIndex: '50',
    } as CSSStyleDeclaration);
    document.body.appendChild(el);
    this.input = el;
    this.labelText.visible = false;
    setTimeout(() => el.focus({ preventScroll: true }), 20);
    el.addEventListener('input', () => this.set(el.value));
    el.addEventListener('keydown', (e) => {
      e.stopPropagation(); // Escape must not close the panel while typing
      if (e.key === 'Enter' || e.key === 'Escape') el.blur();
    });
    el.addEventListener('blur', () => this.close());
  }
  close() {
    if (!this.input) return;
    const el = this.input;
    this.input = null;
    el.remove();
    if (!this.labelText.destroyed) {
      this.labelText.visible = true;
      this.paint();
    }
  }
}
