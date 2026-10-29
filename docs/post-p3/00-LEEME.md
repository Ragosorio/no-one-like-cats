# Después de la Parte III · el lote de gatos del Casino y el Podio

> ## ⚠️ SPOILERS DE LA PARTE III
> Esta carpeta habla del final: Luzterna murió, el faro arde naranja con el fuego de Canelo y la Parte IV queda abierta. Ningún gato de este lote es ella, una variante suya o una promesa de que vuelve.
> Agente DISEÑO, 2026-10-28. Solo diseño: no se tocó el código del juego, no hay commits y no se generó ninguna imagen.

## Qué pidió el dueño (2026-10-28)

> «crea nuevos gatos que se desbloquean al terminar la parte tres en el casino con los juegos y asi, que los nuevos gatos sean multidimensionales (cuando tengan referencia externa, al menos unos 30 y que sean super currados, de anime, literatura, caricaturas, no te limites), unos 20 miticos, 10 legendarios, y que todos se pongan pues ahi despues de la parte tres, ademas de nuevos heroicos cuando se termine la parte tres»

Ampliaciones posteriores del dueño, por el coordinador: Multidimensionales «pueden ser 50 si quieres pero tienen que ser diferentes, icónicos» (y luego ~60), con su lista obligatoria; **Mia Khalifa queda fuera** (su fama viene de contenido adulto) y en su lugar entra **Sabrina Carpenter**.

## Tanda 2 (2026-10-29, agente DISEÑO-2)

El dueño pidió: «haz otros 25 multidimensionales con más referencias de otras cosas más diferentes». Todo está en **`05-tanda-2.md`**.
- **Qué entra:**
  - Leyendas: Sombrerón, Cadejo y Llorona.
  - Mitos: Quetzalcóatl y Bastet.
  - Historia: Cleopatra, Napoleón y Leonardo.
  - Museo, ciencia y clásica: La joven de la perla, Newton y Mozart.
  - Anime y píxel: Sailor Moon, Tanjiro, Tetris y Lara Croft.
  - Cine y series: Mi pobre angelito, Legalmente rubia, un capitán pirata, Doc y Jesse.
  - Betty la fea, El principito, Arjona, Shakira y Jordan.
- **Reserva:** 6 de los 25 se promovieron (mismos ids) y quedan 10 de reserva.
- **Dónde salen:** solo de las 4 mesas grandes. Las vitrinas se quedan en 8 y el balance no cambia.
- **Cómo regenerarla:** con `generar.py`. **`--arte` ahora solo toca las entradas de la tanda 2** y conserva las correcciones de arte hechas a mano. `--arte-todo` es el modo viejo: no usarlo.

## El lote en números

| Rareza | Cuántos | De dónde |
|---|---|---|
| **Multidimensional** (referencias) | **60** titulares + **16** de reserva | Casino: las 4 mesas grandes y las vitrinas de las otras 7 |
| **Mítico** (originales) | **20** | Casino: dos por mesa |
| **Legendario** (originales) | **10** | Casino, uno por mesa («Leyendas de la Casa») |
| **Heroico** (originales) | **8** | Podio: los 8 retos de la **Copa Fuera de la Caja**, anclados a tu liga |

**Los 60 Multidimensionales:**
- **30 pedidos por el dueño:** Hannah Montana, Juego de gemelas, ¿Y dónde están las rubias?, Hermione, Luna Lovegood, Once (Stranger Things), Breaking Bad, Merlina, María Antonieta, Romeo Santos, el Buki, Post Malone, XXXTentacion, Sabrina Carpenter, Daft Punk, LMFAO, The Weeknd, Messi, Cristiano Ronaldo, Mbappé, Lamine Yamal, Pistas de Blue, Mr. Peabody, Doctor Doom, Iron Man, Capitán América, Superman, Shrek, Gru y un Minion.
- **30 del diseño:**
  - 10 de anime y manga;
  - 6 clásicos de dominio público;
  - 4 latinoamericanos (Chapulín, Chavo, Mafalda, Condorito);
  - 4 caricaturas globales;
  - Wolverine y 3 videojuegos;
  - Michi-Wan y Don Gatoleone.
- **Los 4 huecos MD dormidos del catálogo v2:** Michi-Wan y El Michito del Barril entran como titulares, Bastet entra a la reserva y Lince queda fuera (Nintendo).

Cada Multidimensional trae:
- referencia y medio;
- 3–5 rasgos icónicos;
- riesgo de moderación y plan B;
- un **universo para su revelación**: toma de pantalla de 2,2 s y palabra de remate;
- un **poder** con mecánica propia, distinto de los 25 que ya existen y de los demás del lote, con los números listos para `battle/multidim.ts`.

## Archivos

| Archivo | Qué es |
|---|---|
| `01-roster.md` | Una ficha por gato (titulares, originales y reserva), agrupados por rareza y por medio. Índice al principio. |
| `02-arte-briefs.md` | Cómo quedó el lote de arte, los style locks nuevos, cómo correr la cola y la tabla de rasgos, riesgo y plan B. |
| `03-obtencion.md` | La economía aprobada: las 4 mesas grandes (`POST_CASINO`), las vitrinas de las otras 7 mesas con sus reglas exactas, la Copa Fuera de la Caja como retos anclados a tu liga (`POST_CHAMPIONS` listo para pegar), los sets del Catdex y lo que sigue abierto (§7). |
| `04-roster.json` | Los 98 gatos con el esquema exacto de `data/gateras/especies.json` (bloque `post` en vez de `p3`), más `reserve` (16), `catdexSets`, `postChampions` y `postCasino`. **Pasa el validador de SISTEMA** (`data/postp3/validate.ts`): 0 problemas en los 98 y en los 16. |
| `fuente/` | La fuente única (`base.py`, `md_*.py`, `reservas.py`, `originales.py`, `textos.py`) y `generar.py`. Todo lo de arriba sale de ahí. |
| `agentes/DISENO.md` | Estado de este agente (para relevos). |

**Fuera del repo** (`~/Desktop/No one - raster (fuera del repo)/arte-nuevo/`), todo agregado y nada sobrescrito:
- 114 entradas nuevas en `manifest.json` con `folder: "lote-post-p3"`; el diff es solo de líneas agregadas. Respaldo en `_respaldos/manifest-antes-lote-post-p3-2026-10-28.json`.
- 114 prompts en `prompts/lote-post-p3/<id>.md`, compilados con `compilar.mjs`. La sección B la extrae `gen.sh` sin problema (probado).
- `lote-post-p3/estilo/`: tres style locks nuevos (CARICATURA, TIRA y ESTADIO).
- `lote-post-p3/COLA.txt`: el orden sugerido para la cola, del riesgo bajo al alto, con la reserva comentada.

## Cómo se regenera

```bash
cd "docs/post-p3/fuente"
python3 generar.py          # 01, 02, 03 (tablas), 04 + validación (ids, nombres, slugs, refs, contrato de SISTEMA)
python3 generar.py --arte   # además: SOLO las entradas de la tanda 2 en el manifest y sus prompts (con lock.sh; conserva las correcciones a mano)
# python3 generar.py --arte-todo  # modo viejo: reescribe las 114 entradas del lote y borra sus corrections_en. NO usarlo.
```

Para cambiar un gato, se edita su ficha en `fuente/` y se regenera; los cuatro documentos y el arte quedan iguales entre sí.

## Decisiones de diseño

1. **Ids nuevos `xp_ / mp_ / lp_ / hp_`.** Varias referencias retoman fichas del catálogo v2 que nunca se generaron (Gomitas, Kagebunyan, Michito del Barril, Michi-Wan…), pero con id nuevo. Así no chocan con sus entradas viejas del manifest (lote w), que siguen intactas.
2. **Dos caminos por gato.** `post.source` es su mesa grande: la plomería ya construida, que el validador acepta hoy. `post.vitrina` es la vitrina de su mesa, aprobada (`03` §4). Los 56 gatos de las siete vitrinas viven en los dos, así que ninguno queda en un callejón sin salida.
3. **Personas reales:**
   - se dibujan como gatos: pelo, tatuajes y ropa van al pelaje y al vestuario;
   - nunca su cara, nunca letras de canciones ni títulos, nunca una frase real o una muletilla registrada (nada de «SIU»);
   - XXXTentacion va como homenaje a su música, sin nada de su muerte ni de su historia legal;
   - Sabrina Carpenter va recatada y dulce, sin nada insinuante;
   - los futbolistas llevan colores y número de selección, nunca escudos, patrocinadores ni marcas. Son los únicos con un glifo permitido (el número); su plan B es sin número.
4. **Superhéroes** (riesgo alto): cada uno trae un disfraz casero o alternativo como plan B desde el primer intento, con emblema felino propio (diamante con huella, círculo azul con huella, escudo de anillos con huella).
5. **Duos en una carta:** Daft Punk y LMFAO son **un gato por carta**. El compañero aparece en el universo de la revelación y en el poder (el casco dorado bajo el brazo, «el compañero que ya viene»), porque el rig es de un solo gato.
6. **Parejas que combinan:** Grrrú + Miaunion (el poder de cada uno mejora si el otro está), Hermiaune y Luna con Harry Gatter (set) y Heisenmiau + Pinkmiau (reserva). Piden código en `multidim.ts` (`03` §7).
7. **Los originales viven en el mundo después de la Parte III.** Los legendarios son leyendas del Casino del Gato Negro (uno por mesa). Los míticos combinan la casa con lo que dejaron las cajas al derramarse. Cuatro de ellos forman el set «Lo que Quedó Después»: Brasa Naranja (una chispa del faro naranja), Vigilia (los ojos de los gatos en la oscuridad), Tinta Gris (la tinta que ya no puede tachar: solo subraya) y Grafito (el lápiz del «Continuará»). Los Heroicos son los campeones que cada caja manda al Podio.

## Decisiones del dueño (2026-10-28, «dale con tus recomendaciones, las 4»)

1. **`POST_CASINO`** queda con los números de DISEÑO: Portal 0.5 / 3, Tragamichis 0.4 / 4, La Caja 0.6 / 2 y Eterno 0.75 / 2 (`03` §3).
2. **Vitrinas en las otras 7 mesas** (Plinko, Dados, Mayor o Menor, Bingo, Rasca, Cajas y Ruleta), con sus reglas exactas en `03` §4.
3. **La Copa son retos anclados a tu liga**, no ligas fijas (`03` §5).
4. **Merlina pasa a «Michiércoles»** (`xp_michiercoles`) y **ya no tiene la mano mascota**, que se parecía a La Mano. Su nuevo detalle es un **violonchelo** negro parado junto a ella: se lee a 64 px y no le tapa la cara. La ficha vieja `xp_miaurlina` salió del manifest y su prompt quedó en `arte-nuevo/_respaldos/2026-10-28-lote-post-p3-retirados/`.

## Preguntas para el dueño (siguen abiertas)

1. **Reglas de los sets.** Seis llevan «Propuesta» y son balance (`03` §6); las demás son solo colección.
2. **Nombres con apellido real.** «Gatistiano Ronaldo» y «Lamiau Yamal» llevan el apellido en el nombre felino (como «Tailor Swift», que ya pasó el filtro). Si la herramienta se pone estricta, las alternativas son «CR-Miau» y «Lamiau».
3. **¿Se construye el estandarte propio «Multiverso Desbordado»** y los combos de pareja (`03` §7)?

## Estado

**2026-10-29: publicado en vivo.** Los 98 gatos, con arte, rig y animación, entran al juego junto con las 60 revelaciones, sus cartas y sus 60 poderes. El arte va fijo al sitio 1 (nolc-arte-2).
- **Antes de subir:** QA-POST pasó (`agentes/QA-POST.md`). `tsc` limpio, 1382 pruebas, `verify-missions` 78 OK.
- **Cambios de contenido por decisión del dueño:**
  - Heisenmiau sostiene un matraz con líquido azul, sin la bolsita de cristales, y sus textos hablan de caramelos y química;
  - La Vencidas toma una malteada de fresa («Malteadazo»);
  - el remate de Kagebunyan es «¡MIL CLONES, MIL MIAUS!»;
  - los gritos y ultis que copiaban muletillas tal cual se reescribieron con giro (regla 01 §«La frase célebre»).
- **Segunda tanda posible:** los 16 de reserva (Pinkmiau, Ricardo Garjona…) y más comedias juveniles, si el dueño la pide.

**2026-10-29 (tarde): segunda publicación.** Entran juntos:
- **Tanda 2:** 25 Multidimensionales más (`05-tanda-2.md`), con arte, poderes (PODERES-3) y universos (J/K/L).
- **Casino (SISTEMA-2):** el botín del Modo Eterno suelta boletos y más; el banner MULTIVERSO DESBORDADO con el aviso de Madame Noir; el Multidimensional sale con su propio color.
- **5 islas nuevas** (ISLAS-POST).
- **Pantalla:** Muelle de Pesca con tarjetas grandes y revelaciones a pantalla completa (UI-FIX).
- **Parte III:** sin pantalla de carga y con sus canciones ♪ en Volver a ver (P3-CINE).

QA-POST ronda 2 pasó. Antes de subir se reescribieron las líneas que copiaban frases de película casi tal cual: Pobre Gatito, Felinamente, Pinkmiau, Miausagi y Doc Miauwn.
