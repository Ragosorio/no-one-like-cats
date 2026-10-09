/**
 * Ajustes › RESPALDOS (EL BAÚL): your folder of .nocat files, download/open a .nocat, the old copy/paste
 * code, and the history of your island with a summary on every entry (so "the good one" is obvious).
 * Nothing here ever replaces the island without first keeping the current one in the history.
 */
import { Container, Graphics } from 'pixi.js';
import { Modal, toast } from './modal';
import { Button, txt, poster } from './widgets';
import { C, F } from './theme';
import { G } from '../state/game';
import { SAVE_KEY, exportSave, importSave, listBackups, restoreBackup } from '../core/save';
import { chooseFolder, describe, downloadNocat, folderStatus, fromAny, listSnaps, openNocatFile, resumeFolder, snapshot, summarize } from '../core/vault';

const REASON: Record<string, string> = {
  auto: 'automática',
  'al salir': 'al cerrar el juego',
  'antes de borrar': 'antes de borrar / nueva partida',
  'antes de recuperar': 'antes de recuperar otra',
  'antes de pegar': 'antes de pegar otra',
  'antes de abrir un .nocat': 'antes de abrir un .nocat',
  'ventana vieja': 'de una ventana que se quedó atrás',
};
function legacyLabel(key: string, version: number) {
  if (key.endsWith('-prev')) return 'copia rotativa';
  if (key.endsWith('-borrada')) return 'la última partida que borraste';
  if (key.endsWith('-undo')) return 'antes de tu última restauración';
  if (key.includes('-broken-')) return 'una partida que no se pudo abrir';
  return `antes de la actualización (versión ${version})`;
}

function reloadInto() {
  G.saveLocked = true;
  window.setTimeout(() => location.reload(), 500);
}

/** put an envelope (JSON text) on disk as the island, keeping the current one in the history first */
async function replaceWith(envRaw: string, why: string) {
  G.save();
  await snapshot(why);
  G.saveLocked = true;
  try {
    localStorage.setItem(SAVE_KEY, envRaw);
  } catch {
    G.saveLocked = false;
    return toast('No se pudo escribir la partida', { color: C.pink, sub: 'El navegador no deja guardar (¿modo incógnito?).' });
  }
  toast('Isla cargada', { icon: 'star', sub: 'Reiniciando…' });
  window.setTimeout(() => location.reload(), 500);
}

function confirmLoad(envRaw: string, what: string) {
  const sum = summarize(envRaw);
  const cur = summarize(localStorage.getItem(SAVE_KEY) ?? '');
  const msg = `¿Cargar ${what}?\n\nLa que vas a cargar: ${sum ? describe(sum) : '¿?'}\nLa que tienes ahora: ${cur ? describe(cur) : 'ninguna'}${cur && sum && sum.playMin < cur.playMin ? '\n\nOJO: la que vas a cargar tiene MENOS tiempo jugado.' : ''}\n\nTu isla actual se guarda en el historial.`;
  return window.confirm(msg);
}

export function openBackups() {
  const m = new Modal('RESPALDOS', 1320, 900, { band: C.mint, bandText: C.ink, subtitle: 'TU ISLA NO SE PIERDE' });
  const W2 = m.innerW;
  const b = m.body;
  let y = 0;

  // ---------------- your folder
  const folder = new Container();
  b.addChild(folder);
  const drawFolder = async () => {
    folder.removeChildren().forEach((c) => c.destroy({ children: true }));
    const st = await folderStatus();
    if (m.closed) return;
    const on = st.kind === 'on';
    folder.addChild(new Graphics().rect(0, 0, W2, 112).fill(on ? 0xdff5e6 : C.linen).stroke({ width: 3, color: C.ink, alignment: 1 }));
    const head = poster(on ? 'TU CARPETA: GUARDANDO' : st.kind === 'paused' ? 'TU CARPETA: EN PAUSA' : 'GUARDA TU ISLA EN UNA CARPETA', 28, on ? C.green : C.ink);
    head.position.set(16, 10);
    const text =
      st.kind === 'unsupported'
        ? 'Este navegador no deja guardar en carpetas. Usa DESCARGAR .nocat de vez en cuando (en Chrome o Edge se hace solo).'
        : st.kind === 'none'
          ? 'Elige una carpeta (ej. Documentos) y el juego deja ahí NoOneLikeCats.nocat y una copia por día. Son archivos tuyos: borrar el navegador no los toca.'
          : st.kind === 'paused'
            ? `«${st.name}»: el navegador pide permiso otra vez después de reiniciarse. Toca REACTIVAR.`
            : `«${st.name}» · última copia ${st.lastAt ? new Date(st.lastAt).toLocaleString('es') : 'ahora'} · cada 5 min y al cerrar el juego.`;
    const t = txt(text, { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.ink, wordWrap: true, wordWrapWidth: W2 - 330, lineHeight: 21 });
    t.position.set(16, 50);
    folder.addChild(head, t);
    if (st.kind !== 'unsupported') {
      const btn = new Button(st.kind === 'none' ? 'ELEGIR CARPETA' : st.kind === 'paused' ? 'REACTIVAR' : 'CAMBIAR', async () => {
        G.save();
        const ok = st.kind === 'paused' ? await resumeFolder() : await chooseFolder();
        if (ok) toast('Respaldo en carpeta activo', { icon: 'star', sub: 'NoOneLikeCats.nocat + una copia por día.' });
        void drawFolder();
      }, { w: 280, h: 66, size: 26, color: on ? C.paper : C.yellow });
      btn.position.set(W2 - 296, 23);
      folder.addChild(btn);
    }
  };
  void drawFolder();
  y += 130;

  // ---------------- files and codes
  const row = [
    new Button('DESCARGAR .nocat', () => {
      G.save();
      if (!downloadNocat()) return toast('No hay partida que guardar', { color: C.pink });
      toast('Isla descargada', { icon: 'star', sub: 'Guárdala donde quieras. Se abre con ABRIR .nocat.' });
    }, { w: 300, h: 62, size: 24, color: C.yellow }),
    new Button('ABRIR .nocat', async () => {
      const env = await openNocatFile();
      if (!env) return toast('Ese archivo no es una isla', { color: C.pink });
      if (confirmLoad(env, 'esta isla')) await replaceWith(env, 'antes de abrir un .nocat');
    }, { w: 300, h: 62, size: 24, color: C.paper }),
    new Button('COPIAR CÓDIGO', async () => {
      G.save();
      const code = exportSave();
      if (!code) return toast('No hay partida que copiar', { color: C.pink });
      try {
        await navigator.clipboard.writeText(code);
        toast('Código copiado', { icon: 'star', sub: 'Pégalo en un lugar seguro: es tu isla entera.' });
      } catch {
        window.prompt('Copia este texto (es tu isla):', code);
      }
    }, { w: 300, h: 62, size: 24, color: C.paper }),
    new Button('PEGAR CÓDIGO', async () => {
      const code = window.prompt('Pega aquí el código (o el contenido de un .nocat).');
      if (!code) return;
      const env = fromAny(code);
      if (!env) return toast('Ese texto no es una isla', { color: C.pink, sub: 'Revisa que lo copiaste completo.' });
      if (!confirmLoad(env, 'esa isla')) return;
      G.save();
      await snapshot('antes de pegar');
      if (!importSave(btoa(unescape(encodeURIComponent(env))))) return toast('No se pudo cargar', { color: C.pink });
      toast('Isla cargada', { icon: 'star', sub: 'Reiniciando…' });
      reloadInto();
    }, { w: 300, h: 62, size: 24, color: C.paper }),
  ];
  const gap = (W2 - row.length * 300) / (row.length - 1);
  row.forEach((btn, i) => {
    btn.position.set(i * (300 + gap), y);
    b.addChild(btn);
  });
  y += 90;

  // ---------------- history
  const head = poster('HISTORIAL DE TU ISLA', 32, C.ink);
  head.position.set(0, y);
  const hint = txt('La más nueva arriba. Recuperar guarda primero la que tienes ahora.', { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink });
  hint.alpha = 0.7;
  hint.position.set(head.width + 18, y + 12);
  b.addChild(head, hint);
  y += 50;
  const list = new Container();
  list.position.set(0, y);
  b.addChild(list);
  const rowsRoom = Math.floor((m.innerH - y) / 70);
  void (async () => {
    type Item = { savedAt: number; label: string; sum: ReturnType<typeof summarize>; restore: () => void };
    const items: Item[] = [];
    for (const s of await listSnaps())
      items.push({
        savedAt: s.sum.savedAt,
        label: REASON[s.reason] ?? s.reason,
        sum: s.sum,
        restore: () => {
          if (confirmLoad(s.raw, 'esta copia')) void replaceWith(s.raw, 'antes de recuperar');
        },
      });
    for (const it of listBackups()) {
      const raw = localStorage.getItem(it.key) ?? '';
      if (items.some((x) => x.savedAt === it.savedAt)) continue;
      items.push({
        savedAt: it.savedAt,
        label: legacyLabel(it.key, it.version),
        sum: summarize(raw),
        restore: () => {
          if (!confirmLoad(raw, 'esta copia')) return;
          G.save();
          void snapshot('antes de recuperar').then(() => {
            if (!restoreBackup(it.key)) return toast('No se pudo leer esa copia', { color: C.pink });
            toast('Copia recuperada', { icon: 'star', sub: 'Reiniciando…' });
            reloadInto();
          });
        },
      });
    }
    if (m.closed) return;
    items.sort((a, c) => c.savedAt - a.savedAt);
    if (!items.length) {
      list.addChild(txt('Todavía no hay copias: la primera aparece al minuto de jugar.', { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.ink }));
      return;
    }
    const most = Math.max(...items.map((x) => x.sum?.playMin ?? 0));
    items.slice(0, rowsRoom).forEach((it, i) => {
      const r = new Container();
      r.y = i * 70;
      const best = (it.sum?.playMin ?? -1) === most;
      r.addChild(new Graphics().rect(0, 0, W2, 62).fill(best ? 0xfff2b8 : i % 2 ? C.paper : C.linen).stroke({ width: 2, color: C.ink, alignment: 1 }));
      const when = it.savedAt ? new Date(it.savedAt).toLocaleString('es') : '¿?';
      const t1 = txt(`${when} · ${it.label}${best ? '  ★ LA MÁS JUGADA' : ''}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink });
      t1.alpha = 0.75;
      t1.position.set(14, 6);
      const t2 = txt(it.sum ? describe(it.sum) : 'copia sin resumen', { fontFamily: F.poster, fontSize: 22, fill: C.ink });
      t2.position.set(14, 28);
      const go = new Button('RECUPERAR', () => it.restore(), { w: 190, h: 48, size: 22, color: C.mint });
      go.position.set(W2 - 202, 7);
      r.addChild(t1, t2, go);
      list.addChild(r);
    });
  })();
  m.open();
  return m;
}
