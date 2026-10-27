# MUSICA — Parte III, etapa de diseño

- **Qué estoy haciendo**: nada en curso. La inspección de Soundtrap está terminada y espera respuesta del dueño.
- **Hecho** (2026-10-13):
  - `docs/part-iii/investigacion/soundtrap.md`: los 5 proyectos con secciones «Observado / Medido / Inferido», una tabla
    resumen, bloqueos y lo que falta para sincronizar un Momento.
  - Enlaces → títulos reales:
    1. J5GouBnxTdOJG07JMfwyPA → «Drunck (hardstyle)»: 165 bpm, Bbm, 4/4, c1→c49 = 1:09,8, 11 pistas de audio.
    2. znsBGFR4ROiFqNhco6Ax6g → «No wey (way, hiphop dark)»: 74 bpm, F#m, c1→c70,125 = 3:44,2, 9 pistas.
    3. b5_MXIbcTkaXy4jKU82AnQ → «Daria (hiphop deep)»: 134 bpm, Cm, c1→c81 = 2:23,3, 6 pistas.
    4. 4riizrbWSWW-vrEfs3O8aw → «xti es amor, (jazz)»: 140 bpm, F#, c1→c115 = 3:15,4, 7 pistas.
    5. fGRASEj8SdSwqi2aZkxTvg → «SADIE (piano and distorsion)»: 50 bpm, Dm, c1→c37 = 2:52,8, 8 pistas, sin batería.
  - Ninguno es una canción de la Parte II.
  - Medición de señal (antes del fader y de los efectos) hecha en Drunck y SADIE.
  - Comprobado que los 5 proyectos siguen en la misma versión y fecha de última edición que al abrirlos.
- **Falta**:
  1. Que el dueño diga qué otros dos nombres mencionó, para saber cuáles de No wey, Daria y xti son.
  2. Que el dueño exporte la mezcla (WAV/MP3) de la canción elegida, para generar los onsets con `onsets.py`
     (docs/part-ii/29 §6.1).
  3. Con el archivo exportado: confirmar el bombo de Drunck (compases 16, 32 y 48), la cola de reverb y la distorsión
     de SADIE en c29–33.
- **Cómo retomar**: en la página del estudio, `performance.getEntriesByType('resource')` contiene las URLs de
  `api/projectsnapshots/<id>/data/latest` (XHR) y `api/project/getProject1`. Un GET a esa URL exacta (con sus parámetros)
  devuelve el JSON, con strings anidados que hay que parsear de forma recursiva. Las regiones están en
  `tracks[*].audio_regions|note_regions` (`start_beat`, `length`, en tiempos). Las notas están en
  `user-assets/blob2/<id>/<server_id>.not` («tiempo,altura,vel,dur»). Medición: parche de
  `AudioBufferSourceNode.prototype.start` más ScriptProcessor hacia una ganancia 0.
  Trampas:
  - El estudio tarda 30–60 s en cargar cuando la pestaña está oculta.
  - Si se cierra la última pestaña del grupo, el grupo desaparece y la pestaña nueva queda huérfana. Quedó una
    «Nueva pestaña» vacía sin cerrar.
  - Reproducir no crea versión nueva (comprobado).
- **Última actualización**: 2026-10-13, al cerrar la tarea.
