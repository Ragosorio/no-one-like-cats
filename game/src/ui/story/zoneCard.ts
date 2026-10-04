/**
 * Zone arrival card (DIARIO DEL MAR · carta náutica): a torn chart sheet slaps onto the map with the
 * zone's name, faction, elements, "here be monsters" motto, what you'll learn and the WANTED boss,
 * plus an engraved vignette of the zone. Tap (or ~9 s) to continue.
 */
import { Container, Graphics, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { sfx } from '../../core/audio';
import { C, F } from '../theme';
import { txt } from '../widgets';
import { elementIcon } from '../elementIcon';
import { halftoneTexture } from '../../art/textures';
import { sparkles } from '../../fx/juice';
import { clean } from './text';
import { destroyDeep, settle } from './tweens';
import { ZONE_CARDS } from './script';
import { P, clipping, doubleRule, stamp } from '../../panels/campaign/common';
import { bossEmblem, cliffFace, compassRose, gargoyle, rocks, stormCloud, tentacle, tower, waterfall, waves, whirl } from '../../panels/campaign/chartArt';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

export async function zoneCard(layer: Container, zone: number): Promise<void> {
  const def = ZONE_CARDS[zone];
  if (!def) return;
  const root = new Container();
  layer.addChild(root);
  const dim = new Graphics().rect(0, 0, W, H).fill({ color: C.ink, alpha: 0.55 });
  dim.eventMode = 'static';
  root.addChild(dim);
  const PW = 1240;
  const PH = 680;
  const card = new Container();
  card.pivot.set(PW / 2, PH / 2);
  card.position.set(W / 2, H / 2 + 10);
  card.rotation = -0.018;
  root.addChild(card);
  card.addChild(clipping(PW, PH, { seed: zone * 9, amp: 6 }));
  const m = 40;
  // masthead
  const kick = txt('¡NUEVA ZONA EN LA CARTA!', { fontFamily: F.poster, fontSize: 34, fill: P.aged, letterSpacing: 2 });
  const kb = new Graphics().rect(0, 0, kick.width + 30, kick.height + 4).fill(C.red);
  kick.position.set(15, 2);
  const kc = new Container();
  kc.addChild(kb, kick);
  kc.position.set(m, 30);
  const folio = txt(`HOJA ${ROMAN[zone]} · CARTA DEL PRIMER MAR · ESCALA: 1 LEGUA GATUNA`, { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: P.blue, letterSpacing: 2 });
  folio.anchor.set(1, 0);
  folio.position.set(PW - m, 42);
  const r0 = doubleRule(PW - m * 2, P.blue, 3);
  r0.position.set(m, 86);
  card.addChild(kc, folio, r0);
  // numeral seal + name
  const seal = new Container();
  const sg = new Graphics().circle(0, 0, 58).fill(P.aged).stroke({ width: 5, color: P.blue }).circle(0, 0, 49).stroke({ width: 1.5, color: P.blue });
  const sn = txt(ROMAN[zone], { fontFamily: F.news, fontSize: 66, fill: P.blue });
  sn.anchor.set(0.5);
  sn.y = 2;
  seal.addChild(sg, sn);
  seal.position.set(m + 60, 170);
  const name = txt(def.name, { fontFamily: F.poster, fontSize: 92, fill: C.ink, letterSpacing: -1 });
  if (name.width > 590) name.scale.set(590 / name.width);
  name.position.set(m + 140, 104);
  const fac = txt(`Territorio de la ${def.faction}`, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 26, fill: P.blue });
  fac.position.set(m + 144, 104 + name.height + 2);
  card.addChild(seal, name, fac);
  def.elements.forEach((el, i) => {
    const b = elementIcon(el, 46);
    b.position.set(m + 150 + fac.width + 34 + i * 54, fac.y + 18);
    card.addChild(b);
  });
  // motto
  const motto = txt(`«${clean(def.motto)}»`, { fontFamily: F.brush, fontSize: 34, fill: C.red });
  motto.position.set(m + 4, 272);
  motto.rotation = -0.02;
  card.addChild(motto);
  // bullets
  const bl = txt('LO QUE TE ESPERA', { fontFamily: F.bebas, fontSize: 28, fill: C.ink, letterSpacing: 3 });
  bl.position.set(m, 336);
  card.addChild(bl);
  def.bullets.forEach((b, i) => {
    const sq = new Graphics().rect(0, 0, 14, 14).fill(def.accent).stroke({ width: 2.5, color: C.ink });
    sq.position.set(m + 2, 384 + i * 44);
    const t = txt(clean(b), { fontFamily: F.ui, fontWeight: '700', fontSize: 23, fill: C.ink, wordWrap: true, wordWrapWidth: 620 });
    t.position.set(m + 28, 376 + i * 44);
    card.addChild(sq, t);
  });
  // wanted boss
  const wb = new Container();
  const wg = new Graphics();
  bossEmblem(wg, zone, 40, P.aged, C.ink);
  wb.addChild(wg);
  const wl = txt('SE BUSCA', { fontFamily: F.poster, fontSize: 22, fill: C.red, letterSpacing: 2 });
  wl.position.set(58, -36);
  const wn = txt(def.boss.toUpperCase(), { fontFamily: F.poster, fontSize: 38, fill: C.ink });
  wn.position.set(58, -12);
  wb.addChild(wl, wn);
  wb.position.set(m + 44, PH - 78);
  card.addChild(wb);
  // vignette window (right)
  const vx = 790;
  const vy = 120;
  const vw = PW - vx - m;
  const vh = PH - vy - 60;
  const vin = new Container();
  vin.position.set(vx, vy);
  const vbg = new Graphics().rect(0, 0, vw, vh).fill(P.sea);
  const hatch = new TilingSprite({ texture: halftoneTexture(P.blue, 11, 1.1), width: vw, height: vh });
  hatch.alpha = 0.12;
  vin.addChild(vbg, hatch);
  const art = new Graphics();
  vin.addChild(art);
  if (zone === 2) {
    cliffFace(art, 10, vh - 40, 190, 230, 3);
    cliffFace(art, vw - 220, vh - 40, 210, 330, 7);
    waterfall(art, vw - 70, vh - 250, 205);
    gargoyle(art, vw - 220 + 210 * 0.45, vh - 40 - 330 * 0.88, 1.5);
    tower(art, 82, vh - 205, 1.2);
    rocks(art, vw / 2 - 10, vh - 36, 1.1);
    for (let i = 0; i < 4; i++) waves(art, 20 + i * 90, vh - 12 + (i % 2) * 6, 70, P.blue, 0.55);
  } else {
    stormCloud(art, vw / 2 - 40, 70, 1.6, P.blue, C.yellow, 90);
    stormCloud(art, vw - 70, 120, 1.1, P.blue, C.yellow, 80);
    whirl(art, vw / 2 - 20, vh - 70, 1.8);
    tentacle(art, 60, vh - 16, 2.4, 1);
    tentacle(art, vw - 60, vh - 12, 2.0, -1);
    tentacle(art, vw / 2 + 40, vh - 10, 1.3, 1);
    for (let i = 0; i < 4; i++) waves(art, 20 + i * 90, vh - 10 + (i % 2) * 6, 70, P.blue, 0.55);
  }
  const rose = compassRose(34);
  rose.position.set(vw - 44, 50);
  rose.alpha = zone === 2 ? 1 : 0;
  vin.addChild(rose);
  const vm = new Graphics().rect(0, 0, vw, vh).fill(0xffffff);
  vin.addChild(vm);
  vin.mask = vm;
  const vframe = new Graphics().rect(vx - 6, vy - 6, vw + 12, vh + 12).stroke({ width: 3, color: P.blue }).rect(vx, vy, vw, vh).stroke({ width: 1.5, color: P.blue });
  card.addChild(vin, vframe);
  const st = stamp(zone === 2 ? 'TERRA FIRMA (Y DURA)' : 'MAR PICADO', def.accent === 0xffd400 ? C.red : 0x2e7a3a, 26, 0.08);
  st.position.set(vx + vw - 150, vy + vh - 26);
  card.addChild(st);
  const hint = txt('toca para zarpar', { fontFamily: F.serif, fontStyle: 'italic', fontSize: 20, fill: P.blue });
  hint.anchor.set(1, 0);
  hint.position.set(PW - m, PH - 46);
  card.addChild(hint);

  // entrance: the sheet slaps down
  sfx('whoosh');
  dim.alpha = 0;
  gsap.to(dim, { alpha: 1, duration: 0.25 });
  card.scale.set(1.6);
  card.alpha = 0;
  gsap.to(card, { alpha: 1, duration: 0.12 });
  gsap.to(card.scale, {
    x: 1,
    y: 1,
    duration: 0.32,
    ease: 'power3.in',
    onComplete: () => {
      sfx('boom', 0.8);
      sfx('paper');
      sparkles(root, W / 2, H / 2, def.accent, 18, 420);
    },
  });
  gsap.from(st.scale, { x: 2.4, y: 2.4, duration: 0.18, delay: 0.7, ease: 'power3.in', onComplete: () => sfx('hit', 1.1) });
  gsap.from(st, { alpha: 0, duration: 0.01, delay: 0.7 });
  gsap.to(hint, { alpha: 0.35, yoyo: true, repeat: -1, duration: 0.7, delay: 1 });

  await settle((res) => {
    let closing = false;
    const close = () => {
      if (closing) return;
      closing = true;
      sfx('paper');
      gsap.killTweensOf(card);
      gsap.killTweensOf(card.scale);
      gsap.to(card, { y: card.y - 60, alpha: 0, rotation: 0.04, duration: 0.3, ease: 'power2.in' });
      gsap.to(dim, { alpha: 0, duration: 0.3, onComplete: res });
    };
    gsap.delayedCall(0.8, () => dim.on('pointertap', close));
    gsap.delayedCall(9, close);
  }, 12000);
  destroyDeep(root);
}
