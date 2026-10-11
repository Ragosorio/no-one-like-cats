/**
 * FONOTECA (Parte II): the songs the sea has been leaving you. A record shelf on paper.
 *
 *  left   every song of the catalog: unlocked ones with their sleeve, hidden ones as «???» + a hint
 *  right  the big sleeve with its record (spins while it plays), where you got it, versions,
 *         favorite, «Música de la isla», and the player: shuffle · prev · play/pause · next · repeat,
 *         a progress bar you can seek, and the music volume (same as Ajustes › MÚSICA)
 *
 * Playback goes through the director's «listen» (src/audio/director.ts): while this panel plays
 * something it wins; closing the panel gives the music back to the island/scene (crossfade).
 */
import { Container, FederatedPointerEvent, Graphics, Text, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { Modal } from '../ui/modal';
import { C, F } from '../ui/theme';
import { Button, poster, txt } from '../ui/widgets';
import { sfx } from '../core/audio';
import { settings, saveSettings } from '../core/settings';
import { applyAudioSettings, Slider, Toggle } from './Settings';
import { ScrollBox, chip, guardModal } from './collection/ui';
import { catalog, resolveTrack, versionsOf, type Track } from '../audio/catalog';
import { drawCover, drawVinyl } from '../audio/cover';
import { director, player } from '../audio/engine';
import { songOf } from '../audio/musicSave';
import {
  isFavorite,
  isUnlocked,
  islandTrack,
  musicExt,
  setIslandTrack,
  setLast,
  setPrefs,
  songUnlocked,
  toggleFavorite,
  unlockInfo,
  unlockedRefs,
} from '../audio/fonoteca';

const MW = 1680;
const MH = 940;
const LIST_W = 560;
const RX = LIST_W + 44;

let current: FonotecaView | null = null;

export function openFonoteca() {
  if (current && !current.modal.closed) return current.modal;
  current = new FonotecaView();
  return current.modal;
}
/** a new unlock arrived while the panel is open */
export function refreshFonoteca() {
  if (current && !current.modal.closed) current.rebuild();
}

/** the engine is installed at boot (main.ts), so this costs nothing extra */
const E = { director, player };

const fmtTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
};
const fmtDate = (at: number) => {
  if (!at) return '';
  try {
    return new Date(at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
};

// ------------------------------------------------------------------ small drawn icons
type IconKind = 'play' | 'pause' | 'next' | 'prev' | 'shuffle' | 'repeat' | 'repeat1' | 'heart' | 'heartOff';
function drawIcon(g: Graphics, k: IconKind, s: number, color: number = C.ink) {
  const st = { width: Math.max(2, s / 9), color, cap: 'round' as const, join: 'round' as const };
  const h = s / 2;
  switch (k) {
    case 'play':
      g.poly([-h * 0.55, -h * 0.75, h * 0.8, 0, -h * 0.55, h * 0.75]).fill(color);
      break;
    case 'pause':
      g.rect(-h * 0.6, -h * 0.7, h * 0.42, h * 1.4).fill(color).rect(h * 0.18, -h * 0.7, h * 0.42, h * 1.4).fill(color);
      break;
    case 'next':
      g.poly([-h * 0.7, -h * 0.6, h * 0.3, 0, -h * 0.7, h * 0.6]).fill(color).rect(h * 0.35, -h * 0.6, h * 0.25, h * 1.2).fill(color);
      break;
    case 'prev':
      g.poly([h * 0.7, -h * 0.6, -h * 0.3, 0, h * 0.7, h * 0.6]).fill(color).rect(-h * 0.6, -h * 0.6, h * 0.25, h * 1.2).fill(color);
      break;
    case 'shuffle':
      g.moveTo(-h * 0.8, -h * 0.45).bezierCurveTo(-h * 0.1, -h * 0.45, h * 0.1, h * 0.45, h * 0.7, h * 0.45).stroke(st);
      g.moveTo(-h * 0.8, h * 0.45).bezierCurveTo(-h * 0.1, h * 0.45, h * 0.1, -h * 0.45, h * 0.7, -h * 0.45).stroke(st);
      g.poly([h * 0.55, -h * 0.7, h * 0.9, -h * 0.45, h * 0.55, -h * 0.2]).fill(color);
      g.poly([h * 0.55, h * 0.2, h * 0.9, h * 0.45, h * 0.55, h * 0.7]).fill(color);
      break;
    case 'repeat':
    case 'repeat1':
      g.roundRect(-h * 0.75, -h * 0.45, h * 1.5, h * 0.9, h * 0.35).stroke(st);
      g.poly([h * 0.1, -h * 0.75, h * 0.42, -h * 0.45, h * 0.1, -h * 0.15]).fill(color);
      if (k === 'repeat1') g.circle(0, 0, h * 0.28).fill(color);
      break;
    case 'heart':
    case 'heartOff': {
      const r = h * 0.62;
      g.moveTo(0, r * 0.95)
        .bezierCurveTo(-r * 1.5, -r * 0.1, -r * 0.65, -r * 1.2, 0, -r * 0.4)
        .bezierCurveTo(r * 0.65, -r * 1.2, r * 1.5, -r * 0.1, 0, r * 0.95);
      if (k === 'heart') g.fill(C.pinkHot).stroke({ ...st, color: C.ink });
      else g.stroke(st);
      break;
    }
  }
}

/** square poster icon button (block shadow, like every button in the game) */
class IconBtn extends Container {
  private face = new Container();
  private bg = new Graphics();
  private ic = new Graphics();
  constructor(
    private size: number,
    private kind: IconKind,
    private onTap: () => void,
    private color: number = C.paper,
  ) {
    super();
    this.addChild(new Graphics().rect(5, 5, size, size).fill(C.ink), this.face);
    this.face.addChild(this.bg, this.ic);
    this.ic.position.set(size / 2, size / 2);
    this.draw();
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerover', () => gsap.to(this.face, { x: -3, y: -3, duration: 0.12 }));
    this.on('pointerout', () => gsap.to(this.face, { x: 0, y: 0, duration: 0.15 }));
    this.on('pointerdown', () => gsap.to(this.face, { x: 4, y: 4, duration: 0.05 }));
    this.on('pointerup', () => gsap.to(this.face, { x: -3, y: -3, duration: 0.12, ease: 'back.out(3)' }));
    this.on('pointertap', () => this.onTap());
  }
  set(kind: IconKind, color = this.color) {
    this.kind = kind;
    this.color = color;
    this.draw();
  }
  private draw() {
    this.bg.clear().rect(0, 0, this.size, this.size).fill(this.color).stroke({ width: 4, color: C.ink, alignment: 1 });
    this.ic.clear();
    drawIcon(this.ic, this.kind, this.size * 0.5);
  }
  override destroy(o?: Parameters<Container['destroy']>[0]) {
    gsap.killTweensOf(this.face);
    super.destroy(o);
  }
}

/** progress bar with seek (click or drag) */
class SeekBar extends Container {
  private fill = new Graphics();
  private knob = new Graphics();
  private dragging = false;
  value = 0;
  constructor(
    private w: number,
    private onSeek: (k: number) => void,
  ) {
    super();
    const track = new Graphics().rect(0, 10, w, 16).fill(C.paperDark).stroke({ width: 3, color: C.ink, alignment: 1 });
    this.knob.rect(-7, 0, 14, 36).fill(C.ink);
    this.addChild(track, this.fill, this.knob);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = { contains: (x: number, y: number) => x >= -8 && x <= w + 8 && y >= -8 && y <= 44 };
    this.on('pointerdown', (e) => {
      this.dragging = true;
      this.drag(e);
    });
    this.on('globalpointermove', (e) => {
      if (this.dragging) this.drag(e);
    });
    const stop = () => {
      if (!this.dragging) return;
      this.dragging = false;
      this.onSeek(this.value);
    };
    this.on('pointerup', stop);
    this.on('pointerupoutside', stop);
    this.set(0);
  }
  get busy() {
    return this.dragging;
  }
  private drag(e: FederatedPointerEvent) {
    this.set(Math.max(0, Math.min(1, e.getLocalPosition(this).x / this.w)));
  }
  set(k: number) {
    this.value = k;
    this.fill.clear().rect(0, 10, this.w * k, 16).fill(C.pinkHot).stroke({ width: 3, color: C.ink, alignment: 1 });
    this.knob.x = this.w * k;
  }
}

// ------------------------------------------------------------------ the view
class FonotecaView {
  modal: Modal;
  private list = new ScrollBox(LIST_W, MH - 150);
  private right = new Container();
  private sel: string | null = null;
  private selRef: string | null = null;
  /** ref the panel is playing through the director (null = not ours) */
  private playing: string | null = null;
  private vinyl: Container | null = null;
  private seek: SeekBar | null = null;
  private tNow: Text | null = null;
  private tDur: Text | null = null;
  private playBtn: IconBtn | null = null;
  private eqs: { ref: string; bars: Graphics[] }[] = [];
  private tick = () => this.update();
  private order: string[] = [];

  constructor() {
    this.modal = new Modal('FONOTECA', MW, MH, { subtitle: 'LO QUE EL MAR TE HA IDO CANTANDO' });
    const m = this.modal;
    guardModal(m, () => Ticker.shared.remove(this.tick));
    m.body.addChild(this.list, this.right);
    this.right.position.set(RX, 0);
    const ext = musicExt();
    const first = catalog().find((t) => songUnlocked(t.id));
    this.sel = (ext.last && songUnlocked(songOf(ext.last)) ? songOf(ext.last) : first?.id) ?? catalog()[0]?.id ?? null;
    this.selRef = ext.last && songOf(ext.last) === this.sel && isUnlocked(ext.last) ? ext.last : this.sel ? (unlockedRefs(this.sel)[0] ?? null) : null;
    // already listening (panel reopened while a song from here still plays)?
    const l = E.director.listening;
    if (l) {
      this.playing = l;
      this.sel = songOf(l);
      this.selRef = l;
    }
    this.rebuild();
    Ticker.shared.add(this.tick);
    m.onClose = () => {
      Ticker.shared.remove(this.tick);
      if (current === this) current = null;
      // the music goes back to the island / scene
      if (this.playing) E.director.stopListening(1.6);
    };
    m.open();
  }

  rebuild() {
    this.buildList();
    this.buildRight();
  }

  // ---------------------------------------------------------------- list
  private buildList() {
    const L = this.list;
    for (const c of L.content.removeChildren()) c.destroy({ children: true });
    this.eqs = [];
    const tracks = catalog();
    if (!tracks.length) {
      const t = txt('Todavía no suena nada por aquí.\nEl mar está afinando.', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 26, fill: C.ink, lineHeight: 36 });
      t.position.set(8, 20);
      L.content.addChild(t);
      L.setContentHeight(120);
      return;
    }
    const RH = 112;
    tracks.forEach((tr, i) => {
      const open = songUnlocked(tr.id);
      const row = new Container();
      row.position.set(0, i * (RH + 12));
      const selected = tr.id === this.sel;
      const bg = new Graphics()
        .rect(5, 5, LIST_W - 18, RH)
        .fill(C.ink)
        .rect(0, 0, LIST_W - 18, RH)
        .fill(selected ? C.yellow : open ? C.paper : C.paperDark)
        .stroke({ width: 4, color: C.ink, alignment: 1 });
      const cov = drawCover(open ? tr : null, 84, { locked: !open });
      cov.position.set(14, 14);
      row.addChild(bg, cov);
      const tx = 116;
      const tw = LIST_W - 18 - tx - 60;
      const name = poster(open ? tr.title : '???', 34, C.ink);
      name.position.set(tx, 10);
      if (name.width > tw) name.scale.set(tw / name.width);
      const info = open ? unlockInfo(unlockedRefs(tr.id)[0] ?? tr.id) : null;
      const n = unlockedRefs(tr.id).length;
      const total = versionsOf(tr).length;
      const sub = open
        ? `${info?.source ? info.source : 'En tu colección'}${total > 1 ? ` · ${n}/${total} versiones` : ''}`
        : (tr.hint ?? 'Se encuentra en la Parte II');
      const st = txt(sub, { fontFamily: open ? F.ui : F.serif, fontStyle: open ? 'normal' : 'italic', fontWeight: open ? '700' : '400', fontSize: 17, fill: C.ink, wordWrap: true, wordWrapWidth: tw, lineHeight: 21 });
      st.alpha = open ? 0.75 : 0.7;
      st.position.set(tx + 2, 56);
      if (st.height > 46) st.scale.set(46 / st.height);
      row.addChild(name, st);
      if (open && isFavorite(tr.id)) {
        const h = new Graphics();
        drawIcon(h, 'heart', 26);
        h.position.set(LIST_W - 18 - 30, 26);
        row.addChild(h);
      }
      if (open) {
        // a tiny equalizer while this song plays from here
        const eq = new Container();
        const bars: Graphics[] = [];
        for (let k = 0; k < 3; k++) {
          const b = new Graphics().rect(0, -20, 6, 20).fill(C.pinkHot);
          b.position.set(k * 9, 0);
          bars.push(b);
          eq.addChild(b);
        }
        eq.position.set(LIST_W - 18 - 44, RH - 18);
        eq.visible = false;
        row.addChild(eq);
        this.eqs.push({ ref: tr.id, bars });
      }
      row.eventMode = 'static';
      row.cursor = 'pointer';
      row.on('pointertap', () => {
        if (L.wasDrag) return;
        sfx('paper');
        this.sel = tr.id;
        if (open) {
          const refs = unlockedRefs(tr.id);
          this.selRef = refs.includes(this.selRef ?? '') ? this.selRef : refs[0];
          void this.play(this.selRef!);
        } else this.selRef = null;
        this.rebuild();
      });
      L.content.addChild(row);
    });
    L.setContentHeight(tracks.length * (RH + 12));
  }

  // ---------------------------------------------------------------- right side
  private buildRight() {
    const R = this.right;
    gsap.killTweensOf(this.vinyl);
    for (const c of R.removeChildren()) c.destroy({ children: true });
    this.vinyl = null;
    this.seek = null;
    this.playBtn = null;
    const RW = MW - 56 - RX;
    // the collection counter, bottom-right (like the Catdex's big number)
    const all = catalog();
    const have = all.filter((t) => songUnlocked(t.id)).length;
    const big = poster(`${have}`, 96, C.ink, { letterSpacing: -3 });
    const tot = poster(`/${all.length}`, 48, C.pinkHot);
    const cap = txt('CANCIONES EN TU FONOTECA', { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: C.ink, letterSpacing: 3 });
    const IH = MH - 130;
    cap.anchor.set(1, 1);
    cap.position.set(RW, IH - 4);
    tot.anchor.set(1, 1);
    tot.position.set(RW, cap.y - cap.height - 2);
    big.anchor.set(1, 1);
    big.position.set(tot.x - tot.width - 2, tot.y + 12);
    R.addChild(big, tot, cap);
    const tr = this.sel ? (catalog().find((t) => t.id === this.sel) ?? null) : null;
    const open = !!tr && songUnlocked(tr.id);
    // sleeve + record
    const SL = 300;
    const vin = drawVinyl(open ? tr : null, SL * 0.46);
    vin.position.set(SL / 2 + (this.playing && tr && songOf(this.playing) === tr.id ? 120 : 70), SL / 2 + 6);
    const sleeve = drawCover(open ? tr : null, SL, { locked: !open });
    const shadow = new Graphics().rect(10, 10, SL, SL).fill(C.ink);
    R.addChild(vin, shadow, sleeve);
    this.vinyl = vin;
    const IX = SL + 170;
    const IW = RW - IX;
    if (!tr) {
      const t = txt('El mar todavía no te ha cantado nada.', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 30, fill: C.ink, wordWrap: true, wordWrapWidth: IW });
      t.position.set(IX, 20);
      R.addChild(t);
      return;
    }
    const kick = txt(open ? (this.playing && songOf(this.playing) === tr.id ? 'AHORA SUENA' : 'EN TU COLECCIÓN') : 'CANCIÓN OCULTA', { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.pinkHot, letterSpacing: 5 });
    kick.position.set(IX, 0);
    const title = poster(open ? tr.title : '???', 58, C.ink);
    title.position.set(IX, 18);
    if (title.width > IW) title.scale.set(IW / title.width);
    R.addChild(kick, title);
    let y = 100;
    if (!open) {
      const h = txt(tr.hint ?? 'Se encuentra en la Parte II.', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 26, fill: C.ink, wordWrap: true, wordWrapWidth: IW, lineHeight: 34 });
      h.position.set(IX, y);
      R.addChild(h);
      return;
    }
    const ref = this.selRef ?? tr.id;
    const info = unlockInfo(ref) ?? unlockInfo(unlockedRefs(tr.id)[0] ?? tr.id);
    const where = txt(info?.source ? `Obtenida en: ${info.source}` : 'En tu colección', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 22, fill: C.ink, wordWrap: true, wordWrapWidth: IW });
    where.position.set(IX, y);
    if (where.height > 60) where.scale.set(60 / where.height);
    R.addChild(where);
    y += where.height + 4;
    const meta = [fmtDate(info?.at ?? 0), tr.bpm ? `${Math.round(tr.bpm)} BPM` : '', tr.key, ...tr.moods.slice(0, 3)].filter(Boolean).join('  ·  ');
    if (meta) {
      const mt = txt(meta, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink });
      mt.alpha = 0.6;
      if (mt.width > IW) mt.scale.set(IW / mt.width);
      mt.position.set(IX, y);
      R.addChild(mt);
      y += 26;
    }
    // versions
    y += 4;
    const vl = txt('VERSIONES', { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: C.ink, letterSpacing: 4 });
    vl.position.set(IX, y);
    R.addChild(vl);
    y += 24;
    let vx = IX;
    let vy = y;
    for (const v of versionsOf(tr)) {
      const have = isUnlocked(v.ref);
      const on = have && v.ref === ref;
      const c = chip(have ? v.label : '???', { bg: on ? C.pinkHot : have ? C.paper : C.paperDark, fg: on ? C.paper : C.ink, size: 17, pad: 12, border: C.ink });
      if (vx + c.width > IX + IW) {
        vx = IX;
        vy += 40;
      }
      c.position.set(vx, vy);
      vx += c.width + 10;
      if (have) {
        c.eventMode = 'static';
        c.cursor = 'pointer';
        c.on('pointertap', () => {
          sfx('click');
          this.selRef = v.ref;
          void this.play(v.ref);
          this.buildRight();
        });
      } else c.alpha = 0.6;
      R.addChild(c);
    }
    y = vy + 46;
    // favorite + island music
    const fav = new IconBtn(56, isFavorite(tr.id) ? 'heart' : 'heartOff', () => {
      const now = toggleFavorite(tr.id);
      sfx(now ? 'pop' : 'click');
      this.rebuild();
    });
    fav.position.set(IX, y);
    const favT = txt(isFavorite(tr.id) ? 'FAVORITA' : 'MARCAR COMO FAVORITA', { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.ink, letterSpacing: 2 });
    favT.position.set(IX + 72, y + 18);
    R.addChild(fav, favT);
    y += 70;
    const isl = islandTrack();
    const mine = isl === ref;
    const il = poster('MÚSICA DE LA ISLA', 28, C.ink);
    il.position.set(IX, y);
    const ils = txt(mine ? 'Esta versión suena en tu isla.' : isl ? `Ahora suena: ${resolveTrack(isl)?.title ?? isl}` : 'La isla elige sola.', {
      fontFamily: F.ui,
      fontWeight: '700',
      fontSize: 15,
      fill: C.ink,
      wordWrap: true,
      wordWrapWidth: IW - 150,
    });
    ils.alpha = 0.7;
    ils.position.set(IX + 2, y + 36);
    const tg = new Toggle(mine, (v) => {
      setIslandTrack(v ? ref : null);
      this.buildRight();
    });
    tg.position.set(IX + IW - 132, y);
    const note = txt('Las escenas importantes igual mandan.', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 15, fill: C.ink });
    note.alpha = 0.6;
    note.position.set(IX + 2, ils.y + ils.height + 2);
    R.addChild(il, ils, tg, note);
    y = note.y + note.height;

    // transport: full width, under the sleeve AND the info column (whichever ends lower)
    const TY = Math.max(SL + 40, y + 30);
    const sb = new SeekBar(RW, (k) => void this.seekTo(k));
    sb.position.set(0, TY);
    this.seek = sb;
    const tNow = txt('0:00', { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.ink });
    tNow.position.set(0, TY + 42);
    const tDur = txt(fmtTime(resolveTrack(ref)?.durationSec ?? 0), { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.ink });
    tDur.anchor.set(1, 0);
    tDur.position.set(RW, TY + 42);
    this.tNow = tNow;
    this.tDur = tDur;
    R.addChild(sb, tNow, tDur);
    const BY = TY + 84;
    const ext = musicExt();
    const shuffle = new IconBtn(64, 'shuffle', () => {
      setPrefs({ shuffle: !musicExt().prefs.shuffle });
      sfx('click');
      this.order = [];
      this.buildRight();
    }, ext.prefs.shuffle ? C.mint : C.paper);
    const prev = new IconBtn(64, 'prev', () => void this.step(-1));
    const play = new IconBtn(84, this.isPlayingHere() ? 'pause' : 'play', () => void this.toggle(), C.pinkHot);
    const next = new IconBtn(64, 'next', () => void this.step(1));
    const rep = ext.prefs.repeat;
    const repeat = new IconBtn(64, rep === 'one' ? 'repeat1' : 'repeat', () => {
      const r = musicExt().prefs.repeat;
      setPrefs({ repeat: r === 'all' ? 'one' : r === 'one' ? 'off' : 'all' });
      sfx('click');
      // a song already playing picks up the new loop mode on its next start
      this.buildRight();
    }, rep === 'off' ? C.paper : C.mint);
    shuffle.position.set(0, BY + 10);
    prev.position.set(84, BY + 10);
    play.position.set(168, BY);
    next.position.set(272, BY + 10);
    repeat.position.set(356, BY + 10);
    this.playBtn = play;
    R.addChild(shuffle, prev, play, next, repeat);
    const repL = txt(rep === 'one' ? 'REPETIR ESTA' : rep === 'all' ? 'REPETIR TODAS' : 'SIN REPETIR', { fontFamily: F.ui, fontWeight: '700', fontSize: 13, fill: C.ink, letterSpacing: 1 });
    repL.anchor.set(0.5, 0);
    repL.position.set(356 + 32, BY + 84);
    repL.alpha = 0.7;
    R.addChild(repL);
    // volume = the music bus (same slider as Ajustes)
    const vx0 = 470;
    const vol = poster('VOLUMEN', 26, C.ink);
    vol.position.set(vx0, BY + 22);
    const sl = new Slider(Math.max(140, RW - vx0 - 140 - 90), settings.vol.music, (v) => {
      settings.vol.music = v;
      applyAudioSettings();
      saveSettings();
    });
    sl.position.set(vx0 + 132, BY + 18);
    R.addChild(vol, sl);
  }

  private isPlayingHere() {
    return !!this.playing && !this.pausedNow();
  }
  private pausedFlag = false;
  private pausedNow() {
    return this.pausedFlag;
  }

  /** the playable refs in list order (shuffled when asked): one per song — its selected/first version */
  private queue(): string[] {
    const refs = catalog()
      .filter((t) => songUnlocked(t.id))
      .map((t) => (t.id === this.sel && this.selRef ? this.selRef : unlockedRefs(t.id)[0]))
      .filter((r): r is string => !!r);
    if (!musicExt().prefs.shuffle) return refs;
    if (this.order.length !== refs.length || !refs.every((r) => this.order.includes(r))) {
      this.order = [...refs].sort(() => Math.random() - 0.5);
    }
    return this.order;
  }

  private async play(ref: string) {
    const e = E;
    if (this.modal.closed) return;
    this.playing = ref;
    this.pausedFlag = false;
    setLast(ref);
    const rep = musicExt().prefs.repeat;
    e.director.listen(ref, { loop: rep === 'one', onEnd: () => void this.step(1, true) });
  }
  private async toggle() {
    const e = E;
    if (this.modal.closed) return;
    const ref = this.selRef;
    if (!ref) return;
    if (this.playing && e.director.listening && songOf(this.playing) === songOf(ref) && this.playing === ref) {
      if (this.pausedFlag) {
        e.player.resume();
        this.pausedFlag = false;
      } else {
        e.player.pause();
        this.pausedFlag = true;
      }
      sfx('click');
      this.playBtn?.set(this.pausedFlag ? 'play' : 'pause', C.pinkHot);
      return;
    }
    await this.play(ref);
    this.rebuild();
  }
  private async step(dir: number, auto = false) {
    const q = this.queue();
    if (!q.length) return;
    const cur = this.playing ?? this.selRef ?? q[0];
    let i = q.indexOf(cur);
    if (i < 0) i = q.findIndex((r) => songOf(r) === songOf(cur));
    let n = i + dir;
    if (n >= q.length || n < 0) {
      if (auto && musicExt().prefs.repeat === 'off') {
        // the end of the list: the island takes the music back
        const e = E;
        this.playing = null;
        e.director.stopListening(2);
        this.rebuild();
        return;
      }
      n = (n + q.length) % q.length;
    }
    const ref = q[n];
    this.sel = songOf(ref);
    this.selRef = ref;
    if (!auto) sfx('paper');
    await this.play(ref);
    if (!this.modal.closed) this.rebuild();
  }
  private async seekTo(k: number) {
    const e = E;
    const d = e.player.cur;
    if (!d || !this.playing || e.director.listening !== this.playing) return;
    e.player.seek(k * (d.duration || 0));
  }

  /** per frame: progress, the record's spin, the equalizer */
  private update() {
    if (this.modal.closed) return;
    {
      const e = E;
      const d = e.player.cur;
      const mine = !!this.playing && e.director.listening === this.playing && !!d && d.ref.ref === this.playing;
      const here = mine && this.selRef === this.playing;
      const dur = d?.duration || 0;
      const pos = here && d ? d.position() : 0;
      if (this.seek && !this.seek.busy) this.seek.set(here && dur ? Math.min(1, pos / dur) : 0);
      if (this.tNow) this.tNow.text = fmtTime(pos);
      if (this.tDur && here && dur) this.tDur.text = fmtTime(dur);
      const spinning = here && !this.pausedFlag && !settings.reduceMotion;
      if (this.vinyl && spinning) this.vinyl.rotation += Ticker.shared.deltaMS * 0.0035;
      const t = performance.now() / 1000;
      for (const q of this.eqs) {
        const on = mine && songOf(this.playing!) === q.ref && !this.pausedFlag;
        const eq = q.bars[0].parent;
        if (eq) eq.visible = on;
        if (on) q.bars.forEach((b, i) => (b.scale.y = 0.35 + 0.65 * Math.abs(Math.sin(t * (3 + i * 1.7) + i))));
      }
    }
  }
}

export type { Track };
