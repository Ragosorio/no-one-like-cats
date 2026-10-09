/**
 * Everything printed on paper in this region, drawn with canvas 2D at runtime (no raster files):
 * the open book's pages 212–213 (real, readable text when you zoom in), the mask of the line that
 * «someone» keeps writing on the blank half of page 213, page-edge stripes and Canelo's golden page.
 */
import { rng } from '../../engine/core/noise';

const INK = 'rgba(52, 40, 34, 0.86)';
const RUST = 'rgba(138, 52, 36, 0.9)';
const SERIF = '"Playfair Display", Georgia, serif';
const HAND = '"Permanent Marker", "Comic Sans MS", cursive';

/** the Archive's own day-book: dry catalog humor, no saga secrets (those live in the fished pages) */
const SENTENCES = [
  'Inventario del día: cuatro millones de libros y un gato. El gato está encima de los libros.',
  'Se prohíbe correr en la Sala de Lectura. Se prohíbe nadar en la Sala de Lectura. La Sala insiste en inundarse.',
  'El mar no tenía nombre, así que le pusimos número. Las olas protestaron; también se archivaron.',
  'Préstamos vencidos: el capítulo once, una tormenta de mil novecientos doce y el olor a pan de una isla que ya no existe.',
  'Los gatos no se catalogan: se dejan catalogar, que es distinto, y sólo los martes.',
  'Se recuerda al personal que los libros mojados no se exprimen. Se secan. Con paciencia. Y lejos del gato.',
  'Pedimos silencio. El silencio no vino. Se archivó su ausencia en la sección de cosas que faltan.',
  'Página encontrada flotando: sin número, sin autor y con una mancha de pata en la esquina.',
  'Quien encuentre este diario, que lo devuelva seco. Si no se puede seco, que lo devuelva igual.',
  'Todo lo que se olvida viene a dar aquí. Por eso la isla flota: lo olvidado pesa poco.',
  'Se solicita lápiz rojo. Responde al nombre de «el bueno». Recompensa: una sardina.',
  'Registro de visitas: un pato con sombrero. Pidió un libro de piratas, se le dio uno de patos y se fue indignado.',
  'El faro se revisa cada noche. Si alumbra hacia adentro, todo en orden. Si alumbra hacia afuera, que alguien se asome.',
  'Horario de la Sala: siempre. Ruido permitido: nunca. Gatos permitidos: no se les pudo impedir.',
  'Nota del turno de noche: la goma pasó a las tres y cuarto. No dejó nada. Así se sabe que pasó.',
  'Hoy se catalogó una ola. Mañana se catalogará otra igual. Nadie ha podido demostrar que no es la misma.',
  'Queja formal del lector número ocho: «los libros huelen a mar». Respuesta formal: «el mar huele a libros».',
  'Se perdió un párrafo en el pasillo nueve. Si lo ve, no lo lea en voz alta: se asusta.',
];

function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, firstIndent = 0, stopY = Infinity) {
  const words = text.split(' ');
  let line = '';
  let cx = firstIndent;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width + cx > maxW && line) {
      g.fillText(line, x + cx, y);
      y += lh;
      cx = 0;
      line = w;
      if (y > stopY) return y;
    } else line = test;
  }
  if (line) g.fillText(line, x + cx, y);
  return y + lh;
}

function stains(g: CanvasRenderingContext2D, r: () => number, x0: number, x1: number, h: number) {
  // foxing
  for (let i = 0; i < 90; i++) {
    g.fillStyle = `rgba(150, 110, 60, ${0.05 + r() * 0.1})`;
    g.beginPath();
    g.arc(x0 + r() * (x1 - x0), r() * h, 1 + r() * 4, 0, Math.PI * 2);
    g.fill();
  }
  // water rings (it is a drowned book)
  for (let i = 0; i < 3; i++) {
    const cx = x0 + r() * (x1 - x0);
    const cy = r() * h;
    const rad = 60 + r() * 140;
    const gr = g.createRadialGradient(cx, cy, rad * 0.7, cx, cy, rad);
    gr.addColorStop(0, 'rgba(160, 120, 70, 0)');
    gr.addColorStop(0.85, 'rgba(150, 105, 60, 0.12)');
    gr.addColorStop(1, 'rgba(150, 105, 60, 0)');
    g.fillStyle = gr;
    g.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  }
}

/** pages 212 (left) and 213 (right); `blank` = canvas rect left empty for the live writing */
export const OPEN_PAGES = { size: 1536, blank: { x0: 838, x1: 1442, y0: 690, y1: 1290 } };

export function drawOpenPages(g: CanvasRenderingContext2D, W: number, H: number) {
  const r = rng(213);
  const mid = W / 2;
  // paper with aged edges
  g.fillStyle = '#efe4c6';
  g.fillRect(0, 0, W, H);
  for (const [a, b] of [
    [0, mid],
    [mid, W],
  ]) {
    const gr = g.createRadialGradient((a + b) / 2, H / 2, H * 0.25, (a + b) / 2, H / 2, H * 0.75);
    gr.addColorStop(0, 'rgba(255, 250, 235, 0.35)');
    gr.addColorStop(1, 'rgba(170, 130, 80, 0.22)');
    g.fillStyle = gr;
    g.fillRect(a, 0, b - a, H);
  }
  // gutter shadow
  const gu = g.createLinearGradient(mid - 90, 0, mid + 90, 0);
  gu.addColorStop(0, 'rgba(90, 60, 35, 0)');
  gu.addColorStop(0.5, 'rgba(90, 60, 35, 0.32)');
  gu.addColorStop(1, 'rgba(90, 60, 35, 0)');
  g.fillStyle = gu;
  g.fillRect(mid - 90, 0, 180, H);
  // fore-edge and head/tail strips: the stacked page edges seen from above
  const edge = 64;
  g.fillStyle = 'rgba(200, 175, 130, 0.35)';
  g.fillRect(0, 0, edge, H);
  g.fillRect(W - edge, 0, edge, H);
  g.fillRect(0, 0, W, 40);
  g.fillRect(0, H - 40, W, 40);
  g.strokeStyle = 'rgba(150, 120, 80, 0.35)';
  g.lineWidth = 1;
  for (let i = 4; i < edge; i += 5) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, H);
    g.moveTo(W - i, 0);
    g.lineTo(W - i, H);
    g.stroke();
  }
  stains(g, r, 0, W, H);

  g.textBaseline = 'alphabetic';
  // running heads and folios
  g.fillStyle = INK;
  g.font = `italic 600 24px ${SERIF}`;
  g.textAlign = 'center';
  g.fillText('DIARIO DEL ARCHIVO', mid / 2 + 20, 82);
  g.fillText('REGISTRO DE LA SALA', mid + mid / 2 - 20, 82);
  g.font = `600 26px ${SERIF}`;
  g.fillText('— 212 —', mid / 2 + 20, H - 70);
  g.fillText('— 213 —', mid + mid / 2 - 20, H - 70);
  g.textAlign = 'left';

  const order = [...SENTENCES].sort(() => r() - 0.5);
  const lh = 33;
  // ---- page 212: drop cap, two paragraphs, a framed figure
  const L = { x: 100, w: 590 };
  g.fillStyle = 'rgba(120, 40, 30, 0.9)';
  g.font = `700 104px ${SERIF}`;
  g.fillText('E', L.x, 210);
  g.strokeStyle = 'rgba(120, 40, 30, 0.6)';
  g.lineWidth = 2;
  g.strokeRect(L.x - 8, 116, 92, 108);
  g.fillStyle = INK;
  g.font = `23px ${SERIF}`;
  let y = 140;
  y = wrap(g, `n esta isla se guarda lo que el mar olvida. ${order[0]} ${order[1]}`, L.x, y, L.w, lh, 98, 230);
  y = wrap(g, `${order[2]} ${order[3]}`, L.x, y + 8, L.w, lh, 0);
  y = wrap(g, `${order[4]} ${order[5]} ${order[6]}`, L.x, y + 8, L.w, lh, 36);
  y = wrap(g, `${order[7]}`, L.x, y + 8, L.w, lh, 36, 860);
  // figure: the lighthouse on an open book (this island, drawn by someone who saw it from afar)
  const fy = Math.max(y + 20, 900);
  const fx = L.x + 40;
  const fw = L.w - 80;
  const fh = 360;
  g.strokeStyle = 'rgba(52, 40, 34, 0.75)';
  g.lineWidth = 3;
  g.strokeRect(fx, fy, fw, fh);
  g.lineWidth = 2;
  const cx = fx + fw / 2;
  const by = fy + fh - 110;
  // waves
  for (let k = 0; k < 4; k++) {
    g.beginPath();
    for (let x = fx + 12; x < fx + fw - 12; x += 6) g.lineTo(x, by + 40 + k * 16 + Math.sin(x * 0.08 + k) * 4);
    g.stroke();
  }
  // open book
  g.beginPath();
  g.moveTo(cx - 170, by + 30);
  g.quadraticCurveTo(cx - 90, by - 20, cx, by + 10);
  g.quadraticCurveTo(cx + 90, by - 20, cx + 170, by + 30);
  g.lineTo(cx + 160, by + 44);
  g.quadraticCurveTo(cx + 80, by + 4, cx, by + 26);
  g.quadraticCurveTo(cx - 80, by + 4, cx - 160, by + 44);
  g.closePath();
  g.stroke();
  for (let k = 1; k < 6; k++) {
    g.beginPath();
    g.moveTo(cx - 150 + k * 4, by + 26 - k * 3);
    g.quadraticCurveTo(cx - 80, by - 10 + k * 3, cx - 8, by + 16);
    g.moveTo(cx + 150 - k * 4, by + 26 - k * 3);
    g.quadraticCurveTo(cx + 80, by - 10 + k * 3, cx + 8, by + 16);
    g.stroke();
  }
  // lighthouse
  g.beginPath();
  g.moveTo(cx - 18, by + 6);
  g.lineTo(cx - 11, by - 120);
  g.lineTo(cx + 11, by - 120);
  g.lineTo(cx + 18, by + 6);
  g.stroke();
  g.strokeRect(cx - 14, by - 140, 28, 20);
  g.beginPath();
  g.moveTo(cx - 16, by - 140);
  g.lineTo(cx, by - 162);
  g.lineTo(cx + 16, by - 140);
  g.stroke();
  for (const s of [-1, 1]) {
    g.beginPath();
    g.moveTo(cx + s * 14, by - 135);
    g.lineTo(cx + s * 200, by - 175);
    g.moveTo(cx + s * 14, by - 125);
    g.lineTo(cx + s * 200, by - 110);
    g.stroke();
  }
  g.font = `italic 20px ${SERIF}`;
  g.fillText('Fig. 7 — El faro, según quien lo vio de lejos.', fx + 10, fy + fh + 30);
  // margin note on 212, in a hand that is nobody's
  g.save();
  g.translate(48, 470);
  g.rotate(-Math.PI / 2 + 0.06);
  g.fillStyle = RUST;
  g.font = `26px ${HAND}`;
  g.fillText('¿quién escribió esto?', 0, 0);
  g.restore();

  // ---- page 213: text that stops mid-sentence, then the blank half someone is still writing
  const R = { x: mid + 70, w: 590 };
  g.fillStyle = INK;
  g.font = `23px ${SERIF}`;
  y = 140;
  y = wrap(g, `${order[8]} ${order[9]} ${order[10]}`, R.x, y, R.w, lh, 36);
  y = wrap(g, `${order[11]} ${order[12]}`, R.x, y + 8, R.w, lh, 36);
  y = wrap(g, `${order[13]} Y entonces alguien abrió la página en blanco y`, R.x, y + 8, R.w, lh, 36, 640);
  // margin note on 213
  g.save();
  g.translate(W - 250, H - 150);
  g.rotate(-0.08);
  g.fillStyle = RUST;
  g.font = `30px ${HAND}`;
  g.fillText('no la cierren', 0, 0);
  g.fillText('todavía', 40, 36);
  g.restore();
  // a paw print in the corner (someone sat here; someone always sits here)
  g.fillStyle = 'rgba(110, 80, 50, 0.28)';
  const px = mid + 120;
  const py = H - 170;
  g.beginPath();
  g.ellipse(px, py, 26, 22, 0, 0, Math.PI * 2);
  g.fill();
  for (const [dx, dy] of [
    [-30, -30],
    [-10, -44],
    [14, -44],
    [32, -28],
  ]) {
    g.beginPath();
    g.ellipse(px + dx, py + dy, 9, 11, 0, 0, Math.PI * 2);
    g.fill();
  }
}

/**
 * The live handwriting on page 213: R = stroke, G = writing order (0..1 over every line). A shader
 * reveals strokes whose order is below the progress, so the line writes itself, letter by letter.
 */
export function drawWriteMask(g: CanvasRenderingContext2D, W: number, H: number) {
  const r = rng(77);
  // background: no stroke (R = 0) and «written last» (G = 1), so anti-aliased edges never show early
  g.fillStyle = 'rgb(0, 255, 0)';
  g.fillRect(0, 0, W, H);
  const lines = 10;
  const lh = H / (lines + 1);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (let i = 0; i < lines; i++) {
    const y0 = lh * (i + 0.9);
    const x0 = i === 0 ? W * 0.12 : 8;
    const x1 = i === lines - 1 ? W * 0.55 : W - 10 - r() * 40;
    const o0 = Math.round((i / lines) * 255);
    const o1 = Math.round(((i + 1) / lines) * 255);
    const gr = g.createLinearGradient(x0, 0, x1, 0);
    gr.addColorStop(0, `rgb(255, ${o0}, 0)`);
    gr.addColorStop(1, `rgb(255, ${o1}, 0)`);
    g.strokeStyle = gr;
    g.lineWidth = 2.6;
    // cursive: loops and words, with gaps between words
    let x = x0;
    while (x < x1) {
      const wl = 30 + r() * 70;
      g.beginPath();
      let t = 0;
      for (let k = 0; x + k < Math.min(x1, x + wl); k += 1.5) {
        t += 0.42 + r() * 0.05;
        const up = Math.sin(t) * (6 + 3 * Math.sin(t * 0.37 + i));
        const loop = Math.cos(t) * 2.4;
        g.lineTo(x + k + loop, y0 - Math.abs(up) - (Math.sin(t * 0.21 + k) > 0.92 ? 9 : 0));
      }
      g.stroke();
      x += wl + 10 + r() * 8;
    }
  }
}

/** horizontal page lines for the sides of the page block */
export function drawEdgeStripes(g: CanvasRenderingContext2D, W: number, H: number) {
  g.fillStyle = '#efe3c6';
  g.fillRect(0, 0, W, H);
  const r = rng(5);
  for (let y = 0; y < H; y += 3) {
    g.fillStyle = `rgba(150, 120, 80, ${0.12 + r() * 0.22})`;
    g.fillRect(0, y, W, 1);
  }
}

/** Canelo's golden page: the drawing is his Admiral painting, framed like a museum plate */
export function drawGoldenPage(g: CanvasRenderingContext2D, W: number, H: number, img: HTMLImageElement | null) {
  const gr = g.createLinearGradient(0, 0, W, H);
  gr.addColorStop(0, '#fff2bf');
  gr.addColorStop(0.5, '#f5d77a');
  gr.addColorStop(1, '#e9bf55');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#8a5a14';
  g.lineWidth = 8;
  g.strokeRect(14, 14, W - 28, H - 28);
  g.lineWidth = 2;
  g.strokeRect(28, 28, W - 56, H - 56);
  g.fillStyle = '#5a3a0c';
  g.textAlign = 'center';
  g.font = `700 34px ${SERIF}`;
  g.fillText('CANELO,', W / 2, 84);
  g.font = `600 22px ${SERIF}`;
  g.fillText('ALMIRANTE DE LA FLOTA GATUNA', W / 2, 116);
  if (img) {
    const s = Math.min((W - 120) / (img.naturalWidth || 1), (H - 290) / (img.naturalHeight || 1));
    const iw = (img.naturalWidth || 1) * s;
    const ih = (img.naturalHeight || 1) * s;
    g.drawImage(img, (W - iw) / 2, 140 + (H - 290 - ih) / 2, iw, ih);
  }
  g.font = `italic 22px ${SERIF}`;
  g.fillText('Hundió 40 barcos.', W / 2, H - 96);
  g.fillText('Nunca se bajó del timón.', W / 2, H - 66);
  g.textAlign = 'left';
}
