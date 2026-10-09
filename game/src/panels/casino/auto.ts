/**
 * PILOTO AUTOMÁTICO (casino agent): auto-play for the Tragamichis, the Ruleta and the Portal.
 *   - start / stop from the left column; Space also stops it.
 *   - speeds x1 · x2 · x10 (x10 = results-first: every banner is skipped but each result stays readable).
 *   - ETERNO (button next to the speeds): the 20-second overheating session (panels/casino/eterno.ts).
 *   - plays "until you stop" by default: a prize never ends the run. Optional stop conditions (saved in the game):
 *     big win, legendary+, new cat, balance below X% of the start (on by default), after N rounds.
 *     Running out of money always stops it. Every round is paid.
 * One runner, one widget: the CasinoScene owns it; views only implement `AutoHost`.
 * Nothing is allocated per round here (the label texts are reused).
 */
import { Container, Graphics, Text } from 'pixi.js';
import { Modal } from '../../ui/modal';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { sfx } from '../../core/audio';
import { AUTO_SPEEDS, AutoPrefs, AutoSpeed, AutoSpeedChoice, autoPrefs } from '../../state/sys/casino';
import { CP, CButton, Seg, clickable, heading, label } from './kit';
import type { CasinoCtx } from './ctx';

export interface AutoOutcome {
  /** false = the bet couldn't be paid (no balance) → the run stops */
  ok: boolean;
  /** big win (slot x5+ / jackpot / pleno / epic+ cat) */
  big?: boolean;
  /** legendary or better */
  legend?: boolean;
  /** a cat you didn't have */
  newCat?: boolean;
}
export interface AutoHost {
  /** one round at this speed (pays, plays the result, resolves when it can go again) */
  autoStep(speed: AutoSpeed): Promise<AutoOutcome>;
  /** balance of the currency being bet (for "stop if it drops below X%") */
  autoBalance(): number;
  /** "TRAGAMICHIS · 30 FICHAS" */
  autoName(): string;
  /** the run ended (rebuild anything skipped while it ran) */
  onAutoStop?(): void;
}

export const SPEEDS: { v: AutoSpeedChoice; label: string }[] = AUTO_SPEEDS.map((v) => ({ v, label: `x${v}` }));
/** pause between rounds (ms): x10 still leaves the result on screen for a beat */
export function gapFor(speed: AutoSpeed) {
  return speed <= 1 ? 450 : speed <= 2 ? 200 : speed <= 10 ? 160 : Math.max(16, 1600 / speed);
}

export type StopReason = 'user' | 'rounds' | 'floor' | 'poor' | 'big' | 'legend' | 'new' | 'gone';
export const STOP_TEXT: Record<StopReason, string> = {
  user: 'Piloto automático apagado.',
  rounds: 'Listo: se acabaron las tiradas que pediste.',
  floor: 'Paré: tu saldo bajó del límite que pusiste.',
  poor: 'Paré: ya no alcanza para otra apuesta.',
  big: '¡Paré porque te salió algo GORDO!',
  legend: '¡Paré: salió un LEGENDARIO (o mejor)!',
  new: '¡Paré: gato nuevo para tu colección!',
  gone: 'Piloto automático apagado.',
};

export class AutoPanel extends Container {
  running = false;
  private stopping = false;
  private count = 0;
  private startBal = 0;
  private btn: CButton;
  private seg: Seg<AutoSpeedChoice>;
  private eternoBtn: CButton;
  private status: Text;
  private gear = new Container();
  private dimmed = false;

  constructor(
    private ctx: CasinoCtx,
    private host: () => AutoHost | null,
    private onStop: (reason: StopReason, rounds: number) => void,
    private onEterno: () => void,
  ) {
    super();
    const head = label('PILOTO AUTOMÁTICO', 13, CP.yellow, { letterSpacing: 2 });
    this.status = label('', 13, CP.softPink, { letterSpacing: 1 });
    this.status.anchor.set(1, 0);
    this.status.position.set(286, 0);
    this.seg = new Seg<AutoSpeedChoice>(
      SPEEDS.map((s) => ({ v: s.v, label: s.label })),
      autoPrefs().speed,
      (v) => {
        autoPrefs().speed = v;
        this.ctx.say(v === 10 ? 'autoTurbo' : 'autoSpeed', 0.6);
      },
      { w: 50, h: 40, size: 22, gap: 5, color: CP.yellow },
    );
    this.seg.position.set(0, 22);
    // ETERNO: not a speed, a session (hot button)
    const flame = new Graphics();
    flame.moveTo(0, 12).bezierCurveTo(-9, 4, -6, -6, 0, -14).bezierCurveTo(2, -6, 9, -4, 7, 4).bezierCurveTo(6, 10, 3, 12, 0, 12).fill(CP.yellow).stroke({ width: 2, color: CP.ink });
    this.eternoBtn = new CButton('ETERNO', () => this.onEterno(), { w: 120, h: 40, color: 0xff3b1f, fg: CP.paper, size: 22, icon: flame });
    this.eternoBtn.position.set(166, 22);
    this.btn = new CButton('AUTO', () => this.toggle(), { w: 206, h: 54, color: CP.cyan, size: 30, sub: 'TIRA POR TI' });
    this.btn.position.set(0, 70);
    // gear (stop conditions)
    const gg = new Graphics();
    gg.rect(5, 5, 68, 54).fill(CP.ink).rect(0, 0, 68, 54).fill(CP.paperDark).stroke({ width: 3, color: CP.ink, alignment: 1 });
    const cx = 34;
    const cy = 27;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      gg.rect(cx + Math.cos(a) * 13 - 4, cy + Math.sin(a) * 13 - 4, 8, 8).fill(CP.ink);
    }
    gg.circle(cx, cy, 13).fill(CP.ink).circle(cx, cy, 5).fill(CP.paperDark);
    this.gear.addChild(gg);
    this.gear.position.set(218, 70);
    clickable(this.gear, () => openAutoRules());
    this.addChild(head, this.status, this.seg, this.eternoBtn, this.btn, this.gear);
    this.refresh();
  }

  /** an ETERNO session owns the table */
  eterno = false;
  /** the current tab supports auto-play? */
  setAvailable(ok: boolean) {
    this.dimmed = !ok;
    this.alpha = ok ? 1 : 0.4;
    this.btn.disabled = !ok;
    this.eternoBtn.disabled = !ok;
    if (!ok && this.running) this.stop('gone');
    this.refresh();
  }

  toggle() {
    if (this.running) this.stop('user');
    else this.start();
  }

  start() {
    const h = this.host();
    if (!h || this.running || this.dimmed || this.ctx.busy) {
      sfx('error');
      return;
    }
    this.running = true;
    this.stopping = false;
    this.count = 0;
    this.startBal = h.autoBalance();
    this.ctx.setBusy(true);
    this.ctx.say('autoStart', 0.9);
    this.refresh();
    void this.loop();
  }

  stop(reason: StopReason) {
    if (!this.running) return;
    this.running = false;
    this.stopping = true;
    this.pendingReason = reason;
    this.refresh();
  }
  private pendingReason: StopReason = 'user';

  private async loop() {
    const p = autoPrefs();
    try {
      while (this.running) {
        const h = this.host();
        if (!h) {
          this.stop('gone');
          break;
        }
        if (p.rounds && this.count >= p.rounds) {
          this.stop('rounds');
          break;
        }
        if (p.floorPct && h.autoBalance() < (this.startBal * p.floorPct) / 100) {
          this.stop('floor');
          break;
        }
        const out = await h.autoStep(p.speed);
        if (!out.ok) {
          this.stop('poor');
          break;
        }
        this.count++;
        this.refresh();
        if (this.running) {
          if (p.stopLegend && out.legend) this.stop('legend');
          else if (p.stopNew && out.newCat) this.stop('new');
          else if (p.stopBig && out.big) this.stop('big');
        }
        if (!this.running) break;
        await wait(gapFor(p.speed));
      }
    } catch (e) {
      console.warn('[casino] auto-play stopped', e);
    }
    this.stopping = false;
    this.running = false;
    if (!this.destroyed) {
      this.host()?.onAutoStop?.();
      this.ctx.setBusy(false);
      this.refresh();
      this.onStop(this.pendingReason, this.count);
    }
  }

  refresh() {
    if (this.destroyed) return;
    const p = autoPrefs();
    if (this.seg.value !== p.speed) this.seg.set(p.speed);
    if (this.running) {
      this.btn.draw(CP.pink);
      this.btn.setText('PARAR', p.rounds ? `${this.count} DE ${p.rounds}` : `${this.count} TIRADAS`);
      this.status.text = 'EN MARCHA';
    } else if (this.stopping) {
      this.btn.draw(CP.paperDark);
      this.btn.setText('PARANDO…', `${this.count} TIRADAS`);
      this.status.text = '';
    } else {
      this.btn.draw(CP.cyan);
      this.btn.setText('AUTO', this.eterno ? 'ETERNO EN CURSO' : this.dimmed ? 'AQUÍ NO HAY AUTO' : p.rounds ? `${p.rounds} TIRADAS` : 'HASTA QUE PARES');
      this.status.text = '';
    }
  }
}

// ------------------------------------------------------------------ stop-condition settings (saved in the game)
export function openAutoRules() {
  const m = new Modal('Piloto automático', 1320, 800, { subtitle: 'TÚ PONES LAS REGLAS · SE GUARDAN' });
  const b = m.body;
  const p = autoPrefs();
  const T = (s: string, size = 22, fill: number = C.ink) => txt(s, { fontFamily: F.ui, fontWeight: '700', fontSize: size, fill, wordWrap: true, wordWrapWidth: 1080, lineHeight: size + 6 });
  let y = 0;
  const row = (title: string, sub: string, ctrl: Container) => {
    const t = heading(title, 34, C.ink);
    t.position.set(0, y);
    const s = T(sub, 16, C.inkBlue);
    s.style.wordWrapWidth = 600;
    s.position.set(0, y + 40);
    ctrl.position.set(660, y + 6);
    b.addChild(t, s, ctrl);
    y += 96;
  };
  const toggle = (key: keyof Pick<AutoPrefs, 'stopBig' | 'stopLegend' | 'stopNew'>) =>
    new Seg<boolean>(
      [
        { v: true, label: 'SÍ' },
        { v: false, label: 'NO' },
      ],
      p[key],
      (v) => (p[key] = v),
      { w: 120, h: 50, size: 26, color: CP.yellow, gap: 8 },
    );
  row(
    'TIRADAS POR RONDA',
    'SIN FIN = juega hasta que lo pares tú (cada tirada se paga).',
    new Seg<number>(
      [10, 25, 50, 100, 0].map((n) => ({ v: n, label: n ? String(n) : 'SIN FIN' })),
      p.rounds,
      (v) => (p.rounds = v),
      { w: 104, h: 50, size: 24, color: CP.cyan, gap: 8 },
    ),
  );
  row(
    'PARAR SI MI SALDO BAJA DE',
    'Porcentaje de lo que tenías al darle AUTO (en la moneda que apuestas).',
    new Seg<number>(
      [0, 25, 50, 75].map((n) => ({ v: n, label: n ? `${n}%` : 'NUNCA' })),
      p.floorPct,
      (v) => (p.floorPct = v),
      { w: 120, h: 50, size: 24, color: CP.pink, gap: 8 },
    ),
  );
  row('PARAR EN PREMIO GORDO', 'Apagado: un premio se celebra y sigue jugando. Prendido: x5 o más, jackpot, pleno o un gato.', toggle('stopBig'));
  row('PARAR EN LEGENDARIO', 'Legendario, HOLO o mítico (Portal y gatos de la Tragamichis).', toggle('stopLegend'));
  row('PARAR EN GATO NUEVO', 'Cualquier gato que todavía no tenías.', toggle('stopNew'));
  const n = T(
    'Velocidades: x1 juega todo · x2 acelera · x10 va rapidísimo pero cada resultado se ve (solo se detiene a enseñarte gatos legendarios nuevos). Si te quedas sin saldo, se para solo. Espacio también lo para. ETERNO no es una velocidad: es una sesión de 20 segundos con 50/50 final (te pide confirmación).',
    17,
    C.ink,
  );
  n.position.set(0, y + 4);
  b.addChild(n);
  m.open();
  return m;
}

function wait(ms: number) {
  return new Promise<void>((r) => window.setTimeout(r, ms));
}
export type { Text };
