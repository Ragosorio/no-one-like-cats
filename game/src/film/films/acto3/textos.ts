/**
 * ACTO III — the words of the briefings that the rules care about (pure; tests/filmActo3.test.ts reads them).
 * LO QUE ARRIESGAMOS is written in HER hand and never names her; from Act III it says Canelo's danger in full
 * (historia-v2/03-peliculas.md §0.3, guiones/acto-3/00-indice.md §3.4).
 */
export const RIESGO = {
  f18: 'Que nos cosa a un cuento ajeno. (Yo no quiero salir en uno de princesas.) Y el gordo: cada libro que cruzamos le baja la llama, y se cansa cada vez más rápido.',
  f20: 'La ficha. Y salir antes de que se caiga todo. Si Cerito rompe esta caja, el gordo no aguanta.',
  f22: 'Que me corrijan la decisión. (Y los muelles.) Y el gordo: si Cerito rompe otra caja, no aguanta.',
  f22big: 'Esta batalla la mando YO.',
  f24: 'Cerito. Si lo usa de llave, se rompen todas las cajas a la vez. Y el gordo con ellas: no aguanta otra caja rota.',
} as const;
/** the six charges of the dossier (F23): five hers, of this adventure (Q6), the sixth Canelo's (S3) */
export const CARGOS = [
  { n: 1, de: 'H67', quien: 'luz', texto: 'CARGO 1: SACAR A UN GATO DE DONDE QUERÍA ESTAR.', culpable: 'Culpable.' },
  { n: 2, de: 'H73', quien: 'luz', texto: 'CARGO 2: ILUMINAR A QUIEN QUERÍA ESCONDERSE.', culpable: 'Culpable.' },
  { n: 3, de: 'H78', quien: 'luz', texto: 'CARGO 3: PONERLE NOMBRE A LO QUE NO TIENE FORMA.', culpable: 'Culpable. Se llama Cerito.' },
  { n: 4, de: 'H85', quien: 'luz', texto: 'CARGO 4: APAGAR LA LUZ PARA ESCONDER UN ERROR.', culpable: 'Culpable. Y lo vuelvo a hacer.' },
  { n: 5, de: 'H82', quien: 'luz', texto: 'CARGO 5: NEGARSE A UNA AUTORA.', culpable: 'Culpable.' },
  { n: 6, de: 'H66', quien: 'canelo', texto: 'CARGO 6: ROMPER EL REINICIO.', culpable: 'Culpable.' },
] as const;
export const EXPEDIENTE = 'EXPEDIENTE: LA FARERA Y SU TRIPULACIÓN. ERRORES: 6.';
export const SENTENCIA = 'SENTENCIA: LOS OJOS';
/** La Mano gives up on the light, aloud (Q1), at c33,3495 */
export const RENUNCIA = 'La luz no se deja apagar. Entonces, los ojos.';
