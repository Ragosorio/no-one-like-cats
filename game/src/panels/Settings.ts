/**
 * Ajustes (GDD 6.21): audio, accesibilidad, Tono (Sin filtro / Familiar) and "borrar partida"
 * with double confirmation. Owned by the story module.
 */
import { isCasinoHidden, setCasinoHidden } from '../state/sys/casino';
import { Container, FederatedPointerEvent, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { Modal, toast } from '../ui/modal';
import { C, F } from '../ui/theme';
import { Button, poster, txt } from '../ui/widgets';
import { settings, saveSettings } from '../core/settings';
import { audio, sfx } from '../core/audio';
import { clean } from '../ui/story/text';
import { G } from '../state/game';
import { gtxt } from '../ui/gender';

// The HUD imports this module on every island/map screen, so this also guarantees the story layer
// (beats, Luzterna tips, mission panels) is listening on dev routes like ?scene=island&new=1.
// initStory() is idempotent; the title flow calls it via maybeIntro() too.
void import('../app/story').then((m) => m.initStory()).catch(() => undefined);

/** push settings into the audio engine (safe before the AudioContext exists) */
export function applyAudioSettings() {
  audio.sfxVolume = settings.sfxVolume;
  audio.musicVolume = settings.musicVolume;
  if (audio.ctx) {
    audio.sfxBus.gain.value = settings.sfxVolume;
    audio.musicBus.gain.value = settings.musicVolume;
  }
  audio.setMuted(settings.muted);
}

// ------------------------------------------------------------------ widgets
class Slider extends Container {
  private fill = new Graphics();
  private knob = new Container();
  private dragging = false;
  private valText: Text;
  constructor(
    private w: number,
    private value: number,
    private onChange: (v: number) => void,
  ) {
    super();
    const track = new Graphics().rect(0, 14, w, 20).fill(C.paperDark).stroke({ width: 3, color: C.ink, alignment: 1 });
    const kg = new Graphics().rect(4, 4, 34, 48).fill(C.ink).rect(0, 0, 34, 48).fill(C.yellow).stroke({ width: 3, color: C.ink, alignment: 1 });
    this.knob.addChild(kg);
    this.knob.pivot.set(17, 0);
    this.valText = txt('', { fontFamily: F.poster, fontSize: 30, fill: C.ink });
    this.valText.position.set(w + 24, 6);
    this.addChild(track, this.fill, this.knob, this.valText);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = { contains: (x: number, y: number) => x >= -10 && x <= w + 10 && y >= -6 && y <= 56 };
    this.on('pointerdown', (e) => {
      this.dragging = true;
      this.setFrom(e);
    });
    this.on('globalpointermove', (e) => {
      if (this.dragging) this.setFrom(e);
    });
    const stop = () => {
      if (this.dragging) sfx('tick', 0.8 + this.value);
      this.dragging = false;
    };
    this.on('pointerup', stop);
    this.on('pointerupoutside', stop);
    this.draw();
  }
  private setFrom(e: FederatedPointerEvent) {
    const p = e.getLocalPosition(this);
    const v = Math.max(0, Math.min(1, p.x / this.w));
    if (Math.abs(v - this.value) < 0.005) return;
    this.value = Math.round(v * 100) / 100;
    this.draw();
    this.onChange(this.value);
  }
  private draw() {
    this.fill.clear().rect(0, 14, this.w * this.value, 20).fill(C.pinkHot).stroke({ width: 3, color: C.ink, alignment: 1 });
    this.knob.x = this.w * this.value;
    this.valText.text = `${Math.round(this.value * 100)}%`;
  }
}

class Toggle extends Container {
  private bg = new Graphics();
  private knob = new Graphics();
  private t: Text;
  constructor(
    private on_: boolean,
    private onChange: (v: boolean) => void,
  ) {
    super();
    this.t = poster('', 26, C.ink);
    this.t.anchor.set(0.5);
    this.addChild(this.bg, this.knob, this.t);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointertap', () => {
      this.on_ = !this.on_;
      sfx('click', this.on_ ? 1.2 : 0.9);
      this.draw(true);
      this.onChange(this.on_);
    });
    this.draw(false);
  }
  private draw(anim: boolean) {
    const w = 128;
    const h = 52;
    this.bg.clear().rect(5, 5, w, h).fill(C.ink).rect(0, 0, w, h).fill(this.on_ ? C.pinkHot : C.paperDark).stroke({ width: 3, color: C.ink, alignment: 1 });
    this.knob.clear().rect(0, 0, 50, 42).fill(this.on_ ? C.yellow : C.paper).stroke({ width: 3, color: C.ink, alignment: 1 });
    const kx = this.on_ ? w - 55 : 5;
    if (anim) gsap.to(this.knob, { x: kx, duration: 0.18, ease: 'back.out(2)' });
    else this.knob.x = kx;
    this.knob.y = 5;
    this.t.text = this.on_ ? 'SÍ' : 'NO';
    this.t.position.set(this.on_ ? 38 : w - 38, h / 2 + 1);
  }
}

function section(title: string, w: number) {
  const c = new Container();
  const t = txt(title, { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.paper, letterSpacing: 5 });
  t.position.set(12, 5);
  c.addChild(new Graphics().rect(0, 0, t.width + 24, 34).fill(C.ink), t, new Graphics().rect(0, 33, w, 3).fill(C.ink));
  return c;
}

function rowLabel(main: string, sub?: string) {
  const c = new Container();
  const m = poster(main, 32, C.ink);
  c.addChild(m);
  if (sub) {
    const s = txt(sub, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink });
    s.alpha = 0.7;
    s.position.set(2, 40);
    c.addChild(s);
  }
  return c;
}

// ------------------------------------------------------------------ panel
let open_: Modal | null = null;

export function openSettings(..._args: unknown[]) {
  if (open_ && !open_.closed) return open_;
  applyAudioSettings();
  const m = new Modal('AJUSTES', 1240, 880, { subtitle: 'tinta, papel y gatos' });
  open_ = m;
  const b = m.body;
  const colW = 540;
  // ---------------- audio
  const sa = section('AUDIO', colW);
  b.addChild(sa);
  let y = 54;
  const lMusic = rowLabel('MÚSICA');
  lMusic.position.set(0, y);
  const sMusic = new Slider(300, settings.musicVolume, (v) => {
    settings.musicVolume = v;
    applyAudioSettings();
    saveSettings();
  });
  sMusic.position.set(170, y - 4);
  b.addChild(lMusic, sMusic);
  y += 72;
  const lSfx = rowLabel('EFECTOS');
  lSfx.position.set(0, y);
  const sSfx = new Slider(300, settings.sfxVolume, (v) => {
    settings.sfxVolume = v;
    applyAudioSettings();
    saveSettings();
    sfx('coin');
  });
  sSfx.position.set(170, y - 4);
  b.addChild(lSfx, sSfx);
  y += 72;
  const lMute = rowLabel('SILENCIAR TODO', 'para jugar en la oficina (no te vimos)');
  lMute.position.set(0, y);
  const tMute = new Toggle(settings.muted, (v) => {
    settings.muted = v;
    applyAudioSettings();
    saveSettings();
  });
  tMute.position.set(colW - 140, y);
  b.addChild(lMute, tMute);
  y += 100;
  // ---------------- accessibility
  const sx = section('ACCESIBILIDAD', colW);
  sx.position.set(0, y);
  b.addChild(sx);
  y += 54;
  const lMot = rowLabel('REDUCIR MOVIMIENTO', 'menos sacudida, cortes anime más cortos');
  lMot.position.set(0, y);
  const tMot = new Toggle(settings.reduceMotion, (v) => {
    settings.reduceMotion = v;
    saveSettings();
  });
  tMot.position.set(colW - 140, y);
  b.addChild(lMot, tMot);
  y += 86;
  const lFl = rowLabel('REDUCIR DESTELLOS', 'flashes suaves, sin cuadros de impacto');
  lFl.position.set(0, y);
  const tFl = new Toggle(settings.reduceFlashes, (v) => {
    settings.reduceFlashes = v;
    saveSettings();
  });
  tFl.position.set(colW - 140, y);
  b.addChild(lFl, tFl);
  y += 86;
  const lCas = rowLabel('OCULTAR CASINO', 'sin mesa, sin fichas, sin tentaciones');
  lCas.position.set(0, y);
  const tCas = new Toggle(isCasinoHidden(), (v) => setCasinoHidden(v));
  tCas.position.set(colW - 140, y);
  b.addChild(lCas, tCas);
  y += 100;

  // ---------------- player profile (name + gender)
  const sp = section('TU PERFIL', colW);
  sp.position.set(0, y);
  b.addChild(sp);
  y += 54;
  const prof = new Container();
  prof.position.set(0, y);
  b.addChild(prof);
  const drawProfile = () => {
    prof.removeChildren().forEach((c) => c.destroy({ children: true }));
    const p = G.s.player;
    const gName = p?.gender === 'm' ? 'CHICO' : p?.gender === 'f' ? 'CHICA' : 'MISTERIO TOTAL';
    const card = new Container();
    const nm = poster((p?.name ?? 'SIN NOMBRE').toUpperCase(), 40, C.ink);
    nm.position.set(16, 6);
    const gt = txt(p ? `${gName} · Luzterna te dice «${gtxt('{g:capitán|capitana|capi}')}»` : 'Luzterna todavía no sabe cómo te llamas', { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink });
    gt.position.set(18, 56);
    const cw = colW - 200;
    card.addChild(new Graphics().rect(5, 5, cw, 86).fill(C.ink).rect(0, 0, cw, 86).fill(C.yellow).stroke({ width: 3, color: C.ink, alignment: 1 }), nm, gt);
    if (nm.width > cw - 30) nm.scale.set((cw - 30) / nm.width);
    const edit = new Button('CAMBIAR', async () => {
      m.close();
      const story = await import('../ui/dialog');
      const { askPlayerProfile } = await import('../ui/story/profile');
      await askPlayerProfile(story.storyLayer(), { fromSettings: true });
      G.emit('changed', undefined);
    }, { w: 180, h: 64, size: 28, color: C.paper });
    edit.position.set(colW - 180, 12);
    prof.addChild(card, edit);
  };
  drawProfile();

  // ---------------- tone
  const X2 = colW + 64;
  const W2 = m.innerW - X2;
  const st = section('TONO', W2);
  st.position.set(X2, 0);
  b.addChild(st);
  const seg = new Container();
  seg.position.set(X2, 54);
  b.addChild(seg);
  const preview = new Container();
  preview.position.set(X2, 140);
  b.addChild(preview);
  const drawTone = () => {
    seg.removeChildren().forEach((c) => c.destroy({ children: true }));
    const opts: [string, boolean][] = [
      ['SIN FILTRO', true],
      ['FAMILIAR', false],
    ];
    opts.forEach(([label, val], i) => {
      const on = settings.sinFiltro === val;
      const bw = W2 / 2 - 6;
      const btn = new Container();
      btn.addChild(new Graphics().rect(5, 5, bw, 62).fill(C.ink).rect(0, 0, bw, 62).fill(on ? (val ? C.pinkHot : C.mint) : C.paper).stroke({ width: 4, color: C.ink, alignment: 1 }));
      const t = poster(label, 36, C.ink);
      t.anchor.set(0.5);
      t.position.set(bw / 2, 31);
      btn.addChild(t);
      btn.position.set(i * (bw + 12), on ? 0 : 4);
      btn.eventMode = 'static';
      btn.cursor = 'pointer';
      btn.on('pointertap', () => {
        if (settings.sinFiltro === val) return;
        settings.sinFiltro = val;
        saveSettings();
        sfx(val ? 'glitch' : 'pop');
        drawTone();
      });
      seg.addChild(btn);
    });
    preview.removeChildren().forEach((c) => c.destroy({ children: true }));
    const raw = '¡¿QUÉ PUTAS?! ¡Eso no es un escudo normal!';
    const raw2 = 'Puedes esperar… o ir a romperle la madre a alguien mientras tanto.';
    const card = new Container();
    const lines = txt(`LUZTERNA: ${clean(raw)}\nLUZTERNA: ${clean(raw2)}`, {
      fontFamily: F.ui,
      fontWeight: '700',
      fontSize: 21,
      fill: C.ink,
      wordWrap: true,
      wordWrapWidth: W2 - 40,
      lineHeight: 29,
    });
    lines.position.set(18, 14);
    card.addChild(new Graphics().rect(6, 6, W2, lines.height + 30).fill(C.ink).rect(0, 0, W2, lines.height + 30).fill(C.yellow).stroke({ width: 4, color: C.ink, alignment: 1 }), lines);
    const cap = txt(settings.sinFiltro ? 'Nivel de groserías: 100%. Casuales, de compas. Nunca contra ti.' : 'Nivel de groserías: 0%. Mismo chiste, otro vocabulario.', {
      fontFamily: F.serif,
      fontStyle: 'italic',
      fontSize: 18,
      fill: C.ink,
    });
    cap.position.set(2, lines.height + 46);
    preview.addChild(card, cap);
  };
  drawTone();

  // ---------------- danger zone
  const sd = section('PARTIDA', W2);
  sd.position.set(X2, 360);
  b.addChild(sd);
  const zone = new Container();
  zone.position.set(X2, 414);
  b.addChild(zone);
  const step0 = () => {
    zone.removeChildren().forEach((c) => c.destroy({ children: true }));
    const info = txt('Tu isla se guarda sola cada 10 segundos. Y al cerrar. Y cuando parpadeas.', { fontFamily: F.ui, fontWeight: '700', fontSize: 17, fill: C.ink, wordWrap: true, wordWrapWidth: W2 });
    zone.addChild(info);
    const replay = new Button('VER PRÓLOGO', () => {
      m.close();
      void import('../app/story').then((s) => s.replayPrologue());
    }, { w: 250, h: 64, size: 28, color: C.paper });
    replay.position.set(0, 52);
    const del = new Button('BORRAR PARTIDA', () => step1(), { w: 270, h: 64, size: 28, color: C.red, textColor: C.paper });
    del.position.set(W2 - 280, 52);
    zone.addChild(replay, del);
  };
  const step1 = () => {
    zone.removeChildren().forEach((c) => c.destroy({ children: true }));
    const warn = new Container();
    const wt = txt('¿Borrar TODO? Gatos, isla, barco, Catdex… Luzterna se queda (ya está muerta, no le afecta).', {
      fontFamily: F.ui,
      fontWeight: '700',
      fontSize: 19,
      fill: C.paper,
      wordWrap: true,
      wordWrapWidth: W2 - 36,
    });
    wt.position.set(18, 12);
    warn.addChild(new Graphics().rect(0, 0, W2, wt.height + 24).fill(C.red).stroke({ width: 4, color: C.ink, alignment: 1 }), wt);
    zone.addChild(warn);
    const yes = new Button('SÍ, BORRAR', () => step2(), { w: 230, h: 60, size: 28, color: C.yellow });
    yes.position.set(0, wt.height + 40);
    const no = new Button('NO, ¡MIS GATOS!', () => step0(), { w: 260, h: 60, size: 28, color: C.paper });
    no.position.set(W2 - 270, wt.height + 40);
    zone.addChild(yes, no);
    sfx('alarm');
    gsap.from(warn, { x: -12, duration: 0.3, ease: 'elastic.out(1,0.3)' });
  };
  const step2 = () => {
    zone.removeChildren().forEach((c) => c.destroy({ children: true }));
    const big = poster('¿DE VERDAD DE VERDAD?', 52, C.red);
    zone.addChild(big);
    const sub = txt('No hay vuelta atrás. Ni con gemas. Ni llorando.', { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.ink });
    sub.position.set(2, 66);
    zone.addChild(sub);
    // buttons swap sides on purpose (no accidental double click)
    const cancel = new Button('CANCELAR', () => step0(), { w: 220, h: 60, size: 28, color: C.mint });
    cancel.position.set(0, 104);
    const fin = new Button('BORRAR PARA SIEMPRE', () => wipe(), { w: 330, h: 60, size: 26, color: C.ink, textColor: C.paper });
    fin.position.set(W2 - 340, 104);
    zone.addChild(cancel, fin);
    sfx('sting');
  };
  const wipe = async () => {
    sfx('bigboom');
    m.close();
    const story = await import('../app/story');
    await story.wipeSaveAndRestart();
    toast('Partida borrada. Los gatos ni se dieron cuenta.', { color: C.paper });
  };
  step0();

  const foot = txt('NO ONE LIKE CATS · Capítulo 1 · sin anuncios · sin tarjetazo · sin energía · "espera o sigue jugando"', {
    fontFamily: F.ui,
    fontWeight: '700',
    fontSize: 15,
    fill: C.ink,
  });
  foot.alpha = 0.6;
  foot.position.set(0, m.innerH - 24);
  b.addChild(foot);
  m.open();
  return m;
}
