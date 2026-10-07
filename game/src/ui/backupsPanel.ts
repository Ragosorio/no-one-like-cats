/**
 * Ajustes › RESPALDOS: copy your island as a code, paste one from another device, or go back to the
 * automatic copies (taken before every update, every few minutes, and before "borrar partida").
 */
import { Container, Graphics } from 'pixi.js';
import { Modal, toast } from './modal';
import { Button, txt, poster } from './widgets';
import { C, F } from './theme';
import { G } from '../state/game';
import { exportSave, importSave, listBackups, restoreBackup } from '../core/save';

function label(key: string, version: number) {
  if (key.endsWith('-prev')) return 'Copia automática (hace unos minutos)';
  if (key.endsWith('-borrada')) return 'La última partida que borraste';
  if (key.endsWith('-undo')) return 'Antes de tu última restauración';
  if (key.includes('-broken-')) return 'Una partida que no se pudo abrir';
  return `Antes de la actualización (versión ${version} de partida)`;
}

function reloadInto() {
  G.saveLocked = true;
  window.setTimeout(() => location.reload(), 500);
}

export function openBackups() {
  const m = new Modal('RESPALDOS', 1180, 780, { band: C.mint, bandText: C.ink, subtitle: 'TU ISLA NO SE PIERDE' });
  const W2 = m.innerW;
  const b = m.body;
  const intro = txt('Antes de cada actualización guardamos una copia de tu partida. También puedes copiarla como texto y pegarla en otro navegador o en la app instalada.', {
    fontFamily: F.ui,
    fontWeight: '700',
    fontSize: 19,
    fill: C.ink,
    wordWrap: true,
    wordWrapWidth: W2,
    lineHeight: 26,
  });
  b.addChild(intro);
  const copy = new Button('COPIAR MI PARTIDA', async () => {
    G.save();
    const code = exportSave();
    if (!code) return toast('No hay partida que copiar', { color: C.pink });
    try {
      await navigator.clipboard.writeText(code);
      toast('Partida copiada', { icon: 'star', sub: `${Math.round(code.length / 1024)} KB de texto. Guárdalo donde quieras.` });
    } catch {
      window.prompt('Copia este texto (es tu partida):', code);
    }
  }, { w: 340, h: 66, size: 28, color: C.yellow });
  copy.position.set(0, intro.height + 22);
  const paste = new Button('PEGAR UNA PARTIDA', () => {
    const code = window.prompt('Pega aquí el texto de tu partida. La actual se guarda como respaldo.');
    if (!code) return;
    if (!importSave(code)) return toast('Ese texto no es una partida', { color: C.pink, sub: 'Revisa que lo copiaste completo.' });
    toast('Partida cargada', { icon: 'star', sub: 'Reiniciando…' });
    reloadInto();
  }, { w: 340, h: 66, size: 28, color: C.paper });
  paste.position.set(360, intro.height + 22);
  b.addChild(copy, paste);

  const head = poster('COPIAS AUTOMÁTICAS', 32, C.ink);
  head.position.set(0, copy.y + 96);
  b.addChild(head);
  const list = new Container();
  list.position.set(0, head.y + 50);
  b.addChild(list);
  const items = listBackups();
  if (!items.length) {
    list.addChild(txt('Todavía no hay copias. Aparecen solas cuando llega una actualización.', { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.ink }));
  }
  items.slice(0, 5).forEach((it, i) => {
    const row = new Container();
    row.y = i * 78;
    const when = it.savedAt ? new Date(it.savedAt).toLocaleString('es') : '¿?';
    const t = txt(`${label(it.key, it.version)}\n${when}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 17, fill: C.ink, lineHeight: 24 });
    t.position.set(16, 10);
    row.addChild(new Graphics().rect(0, 0, W2, 68).fill(i % 2 ? C.paper : C.linen).stroke({ width: 2, color: C.ink, alignment: 1 }), t);
    const go = new Button('RECUPERAR', () => {
      if (!window.confirm('¿Volver a esta copia? Tu partida actual se guarda como respaldo por si te arrepientes.')) return;
      G.save();
      if (!restoreBackup(it.key)) return toast('No se pudo leer esa copia', { color: C.pink });
      toast('Copia recuperada', { icon: 'star', sub: 'Reiniciando…' });
      reloadInto();
    }, { w: 200, h: 52, size: 24, color: C.mint });
    go.position.set(W2 - 212, 8);
    row.addChild(go);
    list.addChild(row);
  });
  m.open();
  return m;
}
