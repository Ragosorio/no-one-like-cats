/**
 * THE RECURRING CAST of the Parte III films — ONE table for the characters who come back across acts (and their dialog
 * portraits, ui/story/text.ts). Every act's kit reads these entries (acto1/kit CERITO, acto2/kit/cast SLUG, acto3/kit
 * STAND, acto4/kit/cast SLUG, final/props STAND_INS). QA-P3 unified the stand-ins (2026-10-27); FILM-CAST swapped them
 * for the approved paintings the same day (docs/part-iii/agentes/ARTE-INTEG.md, FILM-CAST.md).
 *
 * Never `nadie_static_cat`: that painting is Drunck's REGISTRO 000 memory.
 */
export const STANDINS = {
  /**
   * Cerito / REGISTRO 000 in Acts I–IV: his own painting made of TV static (same alpha and outline as the fur one; the
   * eyes and the zero on his forehead are kept). StaticKitten draws it with live static on top.
   */
  cerito: 'cerito_static_cat',
  /**
   * Cerito once he chooses fur (the finale, from F36 «MIRA»): pearl grey, the ring on his forehead. SAME RIG as the
   * static one (tests/catArtIntegrity.test.ts), so a film can cross-fade the two paintings on one pose.
   */
  ceritoFur: 'cerito_fur_cat',
  /** Itō, the Anime box's Puppeteer: long ink-white cat, paper kimono, red sash. The thread sword is code-drawn */
  ito: 'ito_threads_cat',
  /**
   * Borrón: the round black ink cat with the white hand-print and his donut. The finale's «sin dona» (h95 M8) is a
   * framing matter there (final/mano.ts). Act I's shadow play (F02) uses him too: the cut-out that jumps out of the two
   * hands is HIM («nos escribimos gatos»).
   */
  borron: 'borron_inkblot_cat',
  /** Homiau Gatson: flat yellow, pink donut, overbite with grey stubble, two hairs, white shirt */
  homiau: 'homiau_donut_cat',
  /** Maneki, the janitor of the boxes: calico, red collar and bell, koban coin, broom and a giant key ring */
  maneki: 'maneki_janitor_cat',
  /** EMIAU «Slim Bigotes»: platinum buzz cut, grey hoodie, chain; his crew is Bocina and Scratch */
  emiau: 'emiau_rapper_cat',
  bocina: 'bocina_boombox_cat',
  scratch: 'scratch_dj_cat',
  murciegato: 'murciegato_cowl_cat',
  aranya: 'gatarana_web_cat',
  /** the multiverse variants of Gato Araña */
  aranyaNoir: 'gatarana_noir_cat',
  aranyaBlanca: 'gatarana_blanca_cat',
  aranya2099: 'gatarana_2099_cat',
  // ---- no painting yet: STAND-INS, the same in every film and in the dialog portraits
  /** Esquirla: the glitch cat + code-drawn broken visor / glitch arm / hood (her battles still show s_quizas) */
  esquirla: 'neon_glitch_cat',
  /** La Mano: the strike-through cat, pale, + her white hand with the pen-nib claw (code-drawn) */
  mano: 'tachon_strikeout_cat',
  /** Cruceta: the ink-and-paper cat + ink domino mask and script-paper cape (code-drawn; his battle still shows Supernova) */
  cruceta: 'storybook_ink_cat',
  /** Firma: the cream-and-gold cat + the giant calligraphic signature stroke (code-drawn; her battle still shows Diva) */
  firma: 'aurea_halo_cat',
} as const;
