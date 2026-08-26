# 10 · Plan maestro: el Tagalog propio de WorldSpeak

> Curso `/worldspeak/tagalog/`. Método Pimsleur (repetición, anticipación,
> construcción hacia atrás, repaso espaciado), **de español a Tagalog**, sin
> pasar por inglés. Objetivo: que desde la primera semana puedas **mantener una
> conversación real en Tondo**: preguntar, entender lo que te contestan, decir
> a dónde vas, cuánto cuesta, y conocer a la persona que tienes delante (cómo
> está, dónde duerme, si la cuidan, si es feliz, qué sueña).
>
> El Pimsleur original queda intacto en `/tagalog-pimsleur/`. Comparten hub,
> cuenta y player, nada más.

Estado: plan aprobado para ejecutar en fases. Este documento es la fuente de
verdad; se actualiza al cerrar cada fase.

---

## 1 · EL PRINCIPIO: PRIMERO LAS HERRAMIENTAS, LUEGO EL VOCABULARIO

Pimsleur enseña frases. Aquí enseñamos **las piezas con las que se construyen
todas las frases** y las ponemos a funcionar desde el minuto uno:

1. **Los pronombres** (ako, ka, ko, mo, siya, kami, tayo…): con ellos y una
   palabra ya dices "yo quiero", "tú dónde", "mi casa".
2. **Las palabras de preguntar** (Ano/Anong, Sino, Saan, Kailan, Bakit, Paano,
   Ilan, Magkano, Taga saan) y las **tres recetas** para montar cualquier
   pregunta (`ba`, `ano ang + cosa + mo`, `interrogativa + ka + verbo`).
3. **Entender las respuestas típicas**: oo/opo, hindi, konti lang, hindi ko
   alam, malapit lang, sige, wala, marunong…
4. **Sobrevivir**: quiero ir a, cuánto cuesta, ¿entiendes inglés?, ¿hablas
   Tagalog? → konti lang, repite por favor, cómo se dice.

Con eso (Nivel 1, ocho lecciones) ya conversas. Después viene conocer a la
persona, los niños de la calle, el corazón, y el día a día.

---

## 2 · CONTENIDO MODULAR + CLIPS CACHEADOS

La unidad mínima es el **ítem**: frase o palabra en Tagalog con su español, su
literal, su nota, su pill (categoría) y sus etiquetas de gramática. Una lección
es una **receta**: bloques que referencian ítems. Un **compilador** convierte
receta + duración objetivo en la secuencia exacta de cues (quién dice qué,
cuánta pausa), y de ahí salen MP3 y transcripción.

```
content/items.json  ──┐
content/tables.json   ├─►  compile_lesson.py  ──►  scripts/lesson-NN.json (cues)
content/scenes.json   │         ▲                         │
content/recipes/*.json┘   duración objetivo               ▼
                                          synth.py (caché) → assemble.py → MP3 + transcripts
```

Por qué importa:

- **Cada frase se sintetiza UNA vez** (caché por hash de texto+voz). Un repaso o
  una lección a medida que reutiliza frases grabadas **cuesta cero caracteres**.
- **Una receta, tres duraciones**: el compilador ajusta repeticiones y bloques.
- **El alumno se monta su lección**: pills + gramática + duración → receta al vuelo.
- **Transcripción exacta y gratis** (ya funciona así en `assemble.py`).
- **El narrador habla por plantillas**, no por LLM en cada pasada: mismo estilo
  siempre, sin coste. El LLM ayuda a redactar ítems y diálogos **una vez**, y se
  revisan a mano con lo que sabemos de Tondo.

---

## 3 · DURACIÓN: 15 MINUTOS, CON MODOS

| Modo | Duración | Qué es |
|---|---|---|
| **Lección** | ~15 min | Diálogo + 5–7 ítems nuevos + repaso de anteriores + conversación guiada |
| **Repaso** | ~5 min | Solo anticipación ("¿cómo se dice…?") de ítems ya vistos |
| **Inmersión** | ~30 min | Dos lecciones seguidas + escena larga |
| **A medida** | 5–30 min | El alumno elige pills, gramática, duración y modo |

Decisión: **15 minutos por lección.** Digerible, dos al día si apetece.

### Estructura de una lección de 15 min

| Bloque | Min | Qué pasa |
|---|---|---|
| `intro` | 0.5 | Narrador sitúa la escena. Diálogo completo (nativos). |
| `explain` | 0.5 | Narrador: de qué va, qué vas a poder hacer al terminar. |
| `recall_prev` | 1.5 | 3–4 ítems de lecciones anteriores: pregunta → pausa → respuesta nativa. |
| `teach` × 5–7 | 7–8 | Por ítem: significado + literal → nativo → construcción hacia atrás → 2 repeticiones → anticipación ×2. Cada 2 ítems, recupera 1 anterior. |
| `grammar_pill` | 1 | UNA micro-regla con 2 ejemplos nativos ("ka nunca va al principio"). |
| `listen` | 1 | **Entender**: el nativo dice una respuesta típica, pausa, el narrador la traduce. Entrena el oído, no solo la boca. |
| `guided` | 2 | Conversación guiada: el narrador plantea, el alumno produce, el nativo confirma. |
| `review` | 1.5 | Todos los ítems nuevos, anticipación una vez. |
| `outro` | 0.5 | Diálogo completo otra vez. "Ingat!" |

Pausas (segundos tras el cue): sílaba 1,2 · frase corta 2,5 · larga 3,5 ·
anticipación 4 · explicación 0,4.

---

## 4 · PILLS Y ETIQUETAS

| Pill | Icono | De qué va |
|---|---|---|
| `preguntar` | ❓ | Ano/Anong, Sino, Saan, Kailan, Bakit, Paano, Ilan, Magkano, Taga saan, ba |
| `entender` | 👂 | Respuestas típicas: oo/opo, hindi, konti lang, hindi ko alam, sige, wala, malapit, marunong |
| `presentarse` | 👋 | Kumusta, Ako si, Anong pangalan mo, de dónde, un placer |
| `cortesia` | 🙏 | po/opo, salamat, pasensya, Ingat, Tara, sandali lang, walang anuman |
| `moverse` | 🧭 | Quiero ir a, cómo voy a, derecha/izquierda/recto, jeepney, para po, lejos/cerca |
| `mercado` | 🛒 | Cuánto cuesta, dame, caro/barato, números, pesos |
| `ninos` | 🧒 | Niños solos en la calle: qué haces aquí, dónde están tus padres, dónde duermes, escuela, chinelas, ven |
| `corazon` | ❤️ | Feliz/triste, te cuidan, te quieren, sueños, qué quieres ser, miedo |
| `familia` | 👨‍👩‍👧 | nanay, tatay, kuya, ate, cuántos sois, dónde viven |
| `casa` | 🏠 | Dónde vives, dónde está tu casa, dónde duermes |
| `trabajo` | 🔧 | De qué trabajas, negosyo, sueldo, sin trabajo |
| `comida` | 🍚 | Ya has comido, comamos, arroz, agua, helado, karinderya, sisig |
| `tiempo` | ⏰ | Hoy, mañana, esta noche, ayer, horas, días |
| `fe` | ✝️ | Oración, parroquia, misa, Ama Namin |
| `salud` | 🩺 | Visita a enfermos, receta, dolor, medicina |
| `social` | 🎉 | Guapo/guapa, nos vemos mañana, cantar, pre! |
| `peligro` | 🚨 | Drogas, cuidado, ayuda, seguro, policía |

Etiquetas de gramática: `pronombre`, `particula`, `interrogativo`, `verbo-um`,
`verbo-mag`, `verbo-ma`, `conector`, `numero`, `prestamo-es`, `nasa`, `gusto`.

---

## 5 · LAS TABLAS (sección "Tablas", audio por celda, PDF descargable)

De la guía "Tagalog para Tondo", mejoradas. Cada celda es un ítem: se toca y suena.

1. **Pronombres** ang/ng/sa (ako·ko·akin … sila·nila·kanila) + ikaw vs ka + kami vs tayo.
2. **Partículas mágicas**: ang, ng, sa, mga, ba, si, po, na, pa, may, wala, mag-, -ng de enlace.
3. **Preguntas**: las 9 interrogativas + las 3 recetas + anong/sinong.
4. **Respuestas que vas a oír**: oo/opo, hindi, konti lang, hindi ko alam, sige, wala, malapit/malayo, marunong/hindi marunong, okay lang, siguro.
5. **Verbos** raíz → pasado → presente → futuro → imperativo (kain, inom, punta, uwi, kanta, tulog, trabaho, aral, tingin, kita, tanong, bili, tulong, laro, dasal). Familias -um-/mag-/ma-. Foco -in.
6. **Conectores y "estar"**: at, o, pero, kasi, din/rin, tapos, kaya, kung, lang, siguro · nasa/nasaan/nandito/nandoon/wala.
7. **Familia**.
8. **Números y dinero** (1–1000 + números en español para precios + magkano/mahal/mura/nga po).
9. **Direcciones**.
10. **Tiempo** (ngayon, bukas, kahapon, mamaya, ngayong gabi, umaga/tanghali/hapon/gabi, días, horas).
11. **Préstamos del español** (trabaho, presyo, negosyo, sweldo, siguro=quizás, pasensya, disiplina, paborito, reseta, direkta, seguro, pantalon, tsinelas, pre…).
12. **Sentimientos**: masaya, malungkot, gutom, uhaw, pagod, takot, galit, mahal kita, okay lang.
13. **Chuleta de oro**: las 10 frases de Tondo.

---

## 6 · CURRÍCULO: 30 LECCIONES EN 5 NIVELES

### Nivel 1 · Kit de conversación (L01–L08) ❓
Al acabar: preguntas, entiendes las respuestas básicas y sobrevives en la calle.

| L | Título | Ítems clave | Gramática | Entender |
|---|---|---|---|---|
| 01 | Hola, ¿cómo estás? ¿Cómo te llamas? | Kumusta (po)?, Mabuti naman, Magandang umaga/tanghali/hapon/gabi, Ako si…, Anong pangalan mo?, Salamat po, Ingat ka | anong = ano ang · po | Mabuti naman · Ako si Juan · Okay lang |
| 02 | ¿Hablas Tagalog? | Marunong ka bang mag-Tagalog?, Konti lang, Marunong ka bang mag-Ingles?, Hindi, Oo/Opo, Naiintindihan mo ba? | ba = pregunta sí/no | Marunong · Hindi marunong · Konti lang · Hindi ko alam |
| 03 | Yo, tú, mi, tu | ako, ikaw/ka, ko, mo, siya, bahay ko, pangalan mo, Ikaw? (¿y tú?), Ako rin | ang vs ng · ka nunca al principio | Ako rin · Ikaw din |
| 04 | ¿Dónde? ¿Quién? ¿Qué? | Saan?, Sino?, Ano?, Saan ka nakatira?, Sino siya?, Ano ito?, dito/diyan/doon | receta 3: interrogativa + ka + verbo | Nakatira ako sa… · Kaibigan ko · Malapit lang |
| 05 | Quiero… Quiero ir a… | Gusto ko ng…, Gusto mo ba?, Ayaw ko, Gusto kong pumunta sa…, Paano pumunta sa…?, Saan ang…?, Malayo ba?, Dumiretso, Kumanan, Kumaliwa, Para po | gusto ko + ng / gusto kong + verbo | Malayo · Malapit lang · Doon · Dumiretso ka lang |
| 06 | ¿Cuánto cuesta? | Magkano po ito?, Mahal!, Mura, números 1–10, bente/singkwenta/syento, Isang … nga po, Pahingi po ng… | números ES para precios | Bente pesos po · Wala · Meron |
| 07 | ¿Cuándo? ¿Por qué? ¿Cuántos? | Kailan?, Bakit?, Ilan?, Kasi…, Ngayon, Bukas, Kahapon, Mamaya, Ilan kayo? | kasi · na/pa | Bukas · Mamaya · Kasi gutom ako |
| 08 | Repaso: tu primera conversación | nosotros/vosotros/ellos (kami/tayo/kayo/sila), Sige, Tara, Sandali lang, Pasensya na po, Ano sa Tagalog ang…?, Ulitin mo po | kami vs tayo | conversación completa de 12 líneas |

### Nivel 2 · Conocer a una persona (L09–L14) 🏠
| 09 | ¿Dónde vives? ¿Dónde está tu casa? | Saan ang bahay mo?, Nasaan ka?, Nasa bahay ako, Nandito/Nandoon, Wala siya dito | nasa/nasaan vs saan |
| 10 | La familia | May pamilya ka ba?, Nanay, Tatay, Kapatid, Kuya/Ate, Ilan kayo sa pamilya?, Anak | may / wala |
| 11 | ¿Cuántos años tienes? | Ilang taon ka na?, …taon na ako, Bata pa siya, Matanda na | -ng de enlace |
| 12 | ¿De qué trabajas? | Anong trabaho mo?, Drayber, Nagtitinda, Walang trabaho, Negosyo, Sweldo | préstamos del español |
| 13 | ¿Ya has comido? | Kumain ka na ba?, Kumain na po ako, Hindi pa, Kain tayo!, Gutom ka ba?, Uhaw | na / pa |
| 14 | Un placer, nos vemos | Ikinagagalak kitang makilala, Kumusta ka? Mabuti naman, Kita tayo bukas, Maganda/Pogi ka, Pre!, Kanta ka! | predicado primero |

### Nivel 3 · Niños en la calle (L15–L20) 🧒
| 15 | ¿Qué haces aquí solo? | Anong ginagawa mo dito?, Mag-isa ka ba?, Nasaan ang nanay at tatay mo?, Halika dito | verbo -um- presente |
| 16 | ¿Dónde duermes? | Saan ka natutulog?, Sa kalye, Sa bahay ng lola ko, Bakit hindi ka umuuwi?, Umuwi ka na | umuwi |
| 17 | ¿Te cuidan? | Inaalagaan ka ba nila?, Sinasaktan ka ba?, Pinapalo ka ba?, Okay ka lang ba?, Huwag kang matakot | -in (foco objeto) |
| 18 | Escuela y chinelas | Nag-aaral ka ba?, Saan ka nag-aaral?, May tsinelas ka ba?, May pantalon ka ba?, Wala akong pera | mag-/nag- |
| 19 | ¿Pides dinero? | Namamalimos ka ba?, Nanghihingi ka ba ng pera?, Kanino?, Sino ang kasama mo?, Ingat ka | sino / kanino |
| 20 | Vamos a comer juntos | Gusto mo bang kumain?, Kain tayo, Gusto mo ng ice cream?, Tubig, Kanin, Busog na | gusto |

### Nivel 4 · El corazón (L21–L25) ❤️
| 21 | ¿Estás feliz? | Masaya ka ba?, Malungkot ka ba?, Bakit?, Okay lang, Takot ka ba?, Pagod | sentimientos |
| 22 | ¿Te quieren? | Mahal ka ba ng nanay mo?, Mahal mo ba sila?, Mahal kita, Mabait ba sila sa iyo? | ng agente |
| 23 | Sueños | Ano ang pangarap mo?, Anong gusto mong maging paglaki mo?, Doktor, Guro, Pulis, Kaya mo iyan | maging |
| 24 | Drogas y peligro | May droga ba dito?, Gumagamit ka ba?, Delikado, Ingat, Huwag, Tulong! | huwag |
| 25 | Rezamos juntos | Gusto mo bang magdasal?, Magdasal tayo, Ama Namin línea a línea, Diyos, Simbahan, Misa | magdasal |

### Nivel 5 · Día a día (L26–L30) 🛒
| 26 | Karinderya | Ano po ang ulam ngayon?, Sisig, Pancit, Adobo, Kanin, Inumin, Masarap! | comida |
| 27 | Jeepney | Sa Divisoria po!, Para po!, Bayad po, Kanto, Kalye, Simbahan, Palengke | imperativos |
| 28 | Visita a un enfermo | May sakit ka ba?, Masakit ang…, Gamot, Reseta, Doktor, Magpagaling ka | salud |
| 29 | Conectar frases | pero, kasi, din/rin, tapos, kaya, kung, siguro (=quizás), lang | conectores |
| 30 | Verbos: el motor | kain/kumain/kumakain/kakain, inom, punta, tulog, trabaho, aral | aspecto verbal |

**Lecturas**: 10 audios de 5 min de pronunciación (vocales, ng, h, corte
glotal, acento, préstamos leídos).

**Sensibilidad (Niveles 3 y 4)**: cada lección incluye una nota del narrador
sobre cómo y cuándo preguntar (con confianza, voz suave, a su altura), registro
cariñoso (anak, iho/iha) y revisión humana antes de grabar.

---

## 7 · LA APP DEL CURSO (diseño Duolingo, interactivo)

`/worldspeak/tagalog/` con 4 pestañas:

| Pestaña | Qué hay |
|---|---|
| **Ruta** | Camino de lecciones por niveles (círculos grandes: hecha / actual / siguiente), racha, minutos hoy. Toca → player. |
| **Frases** | Pills. Tarjetas con audio, español, literal y nota. Búsqueda. "Marcar difícil". |
| **Tablas** | Las 13 tablas con audio por celda y "Descargar PDF". |
| **A medida** | Pills + gramática + duración (5/15/30) + modo → "Generar" → reproduce en el momento. |

Estética: paleta de la bandera, pero **lúdica**: tipografía redonda grande,
botones con sombra dura (efecto "press"), círculos de progreso, confeti al
completar, tarjetas voltables, micro-interacciones, modo oscuro. Sin
dependencias.

El player actual sigue reproduciendo (barra fija, transcripción sincronizada).
Se le añade: **repetir frase** (loop del segmento), "otra vez" (−5 s) y la
nota del ítem desplegable por segmento.

---

## 8 · FASES

### Fase A · Cimientos de contenido ✅ 2026-08-26
- [x] Plan.
- [x] `content/items.json`: 77 ítems del Nivel 1 (L01–L08) con literal, nota, pill y etiquetas; 19 marcados como respuestas a entender.
- [x] `content/tables.json` (13 tablas, 167 filas) y `content/pills.json`.
- [x] `content/scenes.json` (diálogos L01–L03).
- [x] `content/recipes/lesson-01..03.json`.
- [x] `compile_lesson.py`: receta + duración → cues (plantillas, construcción hacia atrás por sílabas, repaso espaciado cada 2 ítems, bloque «entender», modo review y modo a medida por ids).
- [x] L01–L03 compiladas (143/159/163 cues, ~40–53 clips nativos únicos cada una) + `review-01` y `custom-pronombres-preguntas` como muestra. **Sin audio generado.**
- [ ] Escenas y recetas L04–L08; ítems del Nivel 2 y 3.
- [ ] Calibrar la estimación de minutos con audio real (la primera L01 real dirá si 15 min son ~150 cues o más).

### Fase B · Revisión humana y voces
- [ ] Víctor revisa `items.json` con alguien de la misión (Tagalog, registro, tacto).
- [ ] Fijar voces (¿un tercer nativo joven para las escenas con niños?).
- [ ] Subir plan de ElevenLabs. Generar L01–L08.
- [ ] Textos del censo y notas de Visaya → ítems y escenas nuevas.

### Fase C · App del curso (diseño Duolingo)
- [ ] Ruta / Frases / Tablas. Tarjetas con audio (clips ya existen).
- [ ] Repetir frase y nota por segmento en el player.
- [ ] PDF de las tablas (HTML de impresión → PDF, mejor que el Scroll).
- [ ] Modo oscuro.

### Fase D · A medida (gratis gracias a la caché)
- [ ] Selector y secuenciador de clips en el navegador (Web Audio + MediaSession) con transcripción al vuelo.
- [ ] "Mis lecciones" guardadas en la cuenta.

### Fase E · Producción completa y Bisaya
- [ ] L09–L30 + 10 lecturas.
- [ ] `/bisaya/` con el mismo compilador (solo cambia `items.json`; `eleven_v3` sin `language_code`).
- [ ] Repaso espaciado entre sesiones (ítems difíciles → recetas automáticas).

## 9 · DECISIONES

- Nivel 1 = **herramientas** (pronombres, preguntas, entender respuestas, sobrevivir), no saludos sueltos.
- **15 min** por lección. 5 y 30 por composición.
- Narrador por **plantillas deterministas**; LLM solo para redactar ítems una vez.
- **Ítem = unidad de todo**. Caché de clips = repasos y "a medida" gratis.
- Español → Tagalog. Lo que es igual en español se enseña como regla, no palabra a palabra.
- Niveles 3 y 4 con nota de tacto y revisión humana.
- El Pimsleur no se toca.

## 10 · PENDIENTE DE VÍCTOR

1. Textos del censo y notas de Visaya (PDF, fotos o texto).
2. ¿Voz de niño/joven filipino para el Nivel 3?
3. Revisar `items.json` del Nivel 1 antes de grabar.
