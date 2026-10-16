<img src="assets/logo.svg" alt="" width="96" height="96">

# make-it-learnable

*[Read this in English](README.md)*

**Convierte cualquier material en una lección interactiva que se sostiene sola.**
Apúntalo a un documento, un repo, una función, un paper, una URL o una explicación a
medio hacer, y te devuelve un único fichero HTML: una narrativa guiada por scroll
sobre un diagrama que se transforma, comprobaciones que obligan a mojarse antes de ver
la respuesta, y un final que te dice por dónde volver.

Sin build, sin dependencias, sin red. Abres el fichero, lo mandas por correo, lo
metes en un USB. Dentro de cinco años seguirá funcionando.

El formato es una [explicación explorable](https://en.wikipedia.org/wiki/Explorable_explanation)
— un modelo interactivo de un concepto sostenido por la prosa, donde quien lee dice
qué espera que pase y luego ve cómo la realidad le lleva la contraria. No es un slide
deck con un test pegado al final.

---

## Instalación

**Pruébala primero en un proyecto.** Adjunta `make-it-learnable.zip` y díselo a tu
agente en lenguaje normal:

```
Instala esta skill en este proyecto para poder usarla @make-it-learnable.zip
```

Te la deja dentro del proyecto — `.claude/skills/` en Claude Code, `.agents/skills/` en
otros agentes — y ya la tienes disponible en el siguiente mensaje.

**O lo haces tú**, desde la raíz del proyecto:

```bash
unzip make-it-learnable.zip -d .claude/skills/   # Claude Code
unzip make-it-learnable.zip -d .agents/skills/   # otros agentes
```

Cuando un par de lecciones te hayan convencido, instálala para todos los proyectos:
copia esa misma carpeta `make-it-learnable/` en `~/.claude/skills/` (o
`~/.agents/skills/`). Si te has clonado el repo, la carpeta a copiar es
`skills/make-it-learnable/`.

Requisitos: un agente que pueda escribir archivos y un navegador actual para abrir el
resultado. La skill no trae código que instalar: ni runtime, ni script de build, nada
que compilar ni nada que instalar con `npm`.

## Cómo se usa

Escribe `/make-it-learnable` — sin espacio en el nombre — y detrás, lo que quieras
convertir en lección:

```
/make-it-learnable https://es.wikipedia.org/wiki/Teorema_CAP
/make-it-learnable docs/arquitectura.md
/make-it-learnable src/scheduler.ts — para alguien que acaba de entrar en backend
/make-it-learnable este repo entero, para quien se incorpora el lunes
/make-it-learnable por qué el consenso Raft necesita un líder
```

En ese hueco cabe cualquier cosa: **una URL** (un artículo de Wikipedia, un post, un
RFC), **un fichero**, **una carpeta o la base de código entera**, **un paper o una
transcripción**, o simplemente **un tema** contado con palabras. Si además dices para
quién es, ajusta el nivel a esa persona. Sin ningún argumento te pregunta: no tiene
tema por defecto, y adivinarlo te costaría una lección entera tirada.

A partir de ahí el agente lee el material, decide qué componentes le encajan, escribe
un **blueprint** de la lección, lo revisa y construye a partir de él un único `.html`.
Un idioma que pidas explícitamente tiene prioridad; después manda el idioma de tu
petición y, por último, el de la fuente. Los textos de la interfaz están especificados
en español e inglés, y nunca se entrega una página con mezcla de idiomas.

## Qué pinta tiene

Un escenario que se queda quieto mientras la prosa avanza — el diagrama se transforma
en vez de ser sustituido por otro:

![Una escena guiada por scroll: el pipeline Prompt → Tokenizador → Modelo → Logits a la izquierda con el nodo Logits resaltado, y la narración al lado](assets/scroll-story.png)

Ese mismo escenario también se puede conducir a mano, paso a paso, viendo cómo cambia
el estado por debajo:

![Un stepper en el paso 2 de 3 conduciendo un escenario, con una tabla de estado del runtime: tokens de entrada, generados y posiciones de caché KV](assets/stepper-stage.png)

Comprobaciones que obligan a mojarse *antes* de la respuesta, con confianza incluida
— para que el "seguro y equivocado" se vea, en vez de pasar desapercibido:

![Una comprobación de predicción ya respondida: la opción elegida en rojo, la correcta en verde, un deslizador de confianza, la comparación entre lo que esperabas y lo que pasa de verdad, y una insignia de +25 por mojarte](assets/check.png)

Y esa es una de siete mecánicas. Ordenar un proceso, reconocer un concepto en código
real y estimar un orden de magnitud son preguntas distintas, y fallan de otra manera.

## Qué construye

Un único `.html`, que respeta el tema claro/oscuro, se usa con teclado y se imprime bien.

Una lección se compone de **secciones**, cada una con un objetivo declarado. Un
**escenario** (stage) sostiene una representación persistente —un diagrama, una traza,
un trozo de estado— y las escenas de una **historia** la transforman a medida que el
lector hace scroll, en vez de cambiar de dibujo cada vez. Las **comprobaciones**
interrumpen en el momento justo y una tarjeta de **cierre** termina la lección diciendo
qué repasar.

### Cómo funciona la skill: blueprint + contratos

La skill **no contiene marcado, ni hoja de estilos, ni script**. A cambio le da al
agente dos cosas:

- **Un formato de blueprint** ([`references/blueprint.md`](skills/make-it-learnable/references/blueprint.md))
  — un plan en YAML de la lección que nombra cada componente, en orden, con todas sus
  entradas: enunciados, respuestas, errores típicos, explicaciones, partes del
  escenario, efectos, fuentes. Ahí se comprueban las referencias cruzadas, antes de
  que exista código.
- **Contratos de componente** ([`components.md`](skills/make-it-learnable/references/components.md),
  [`checks.md`](skills/make-it-learnable/references/checks.md),
  [`runtime.md`](skills/make-it-learnable/references/runtime.md)) — para cada pieza,
  para qué sirve, qué recibe, cómo se comporta (números, umbrales, textos, teclado) y
  qué tiene que cumplirse al entregarla.

El agente escribe la página a su manera a partir de esas dos cosas. Dos lecciones
pueden no parecerse en nada por dentro y tienen que comportarse igual por fuera.

### El vocabulario

Los componentes, agrupados por lo que hacen. Dos son modos narrativos y eliges uno por
tramo de la lección: `Story` mantiene un objeto en pantalla y lo transforma escena a
escena; `Panels` encadena dibujos a todo el ancho con una frase encima de cada uno.
Una buena lección usa **entre cuatro y siete**: elegir el puñado correcto es el acto de
criterio principal, y usar más es ruido, no exhaustividad.

| Familia | Componentes |
|---|---|
| Estructura | `Section` · `Stack` · `Split` · `Stage` · `Drawing` |
| Narrativa | `Story` + `Scene` · `Panels` · `Stepper` · `Branch` |
| Atención | `Focus` · `Reveal` · `Layers` · `Anatomy` · `Compare` |
| Comportamiento | `Transform` · `Flow` · `Trace` · `StateBox` |
| Experimento | `WhatIf` (panel o documento reactivo) · `Sandbox` · `Lab` |
| Aprendizaje | `Check` · `Contrast` · `Checkpoint` — y `Finish` para cerrar |

### Las comprobaciones

Siete mecánicas. Solo cambia la *acción* del lector; el armazón —situación → acción →
evaluación → feedback— es siempre el mismo.

| Mecánica | Qué te dice |
|---|---|
| `prediction` | ¿Su modelo mental produce el resultado correcto? |
| `spot` | ¿Reconoce el concepto en material real? |
| `classify` | ¿Distingue dos cosas que se confunden? |
| `arrange` | ¿Entiende el proceso? (con `low`/`high` se convierte en ranking) |
| `explain` | ¿Sabe *generar* la explicación, no solo reconocerla? |
| `estimate` | ¿Tiene bien el sentido de la escala? |
| `choose` | ¿Es de verdad una elección entre opciones con nombre? |

Con `confidence` el lector indica cómo de seguro estaba. El caso valioso es **seguro y
equivocado** —una creencia en la que confía y que no se sostiene— y el cierre lo señala
por su nombre. Detalles: [`references/checks.md`](skills/make-it-learnable/references/checks.md).

## La implementación de referencia

[`reference-implementation/`](reference-implementation/) es el runtime HTML del que se
sacaron los contratos: custom elements, una hoja de estilos, un builder que valida y
ensambla el cuerpo de una lección, y dos cuerpos de ejemplo. **No forma parte de la
skill** ni se distribuye con ella: vive en este repo como referencia de comportamiento
y para escribir lecciones a mano:

```bash
python3 reference-implementation/scripts/build_lesson.py \
  reference-implementation/examples/cache-body.html -o leccion.html \
  --title "…" --desc "…" --lang es \
  --source "Título de la fuente|https://example.com/fuente"
```

Su contrato de marcado está en [`reference-implementation/docs/`](reference-implementation/docs/).
`python3 -m unittest discover -s tests` ejecuta los tests del builder.

## Ejemplos

[`examples/gallery.html`](examples/gallery.html) — **no es una lección**, es el
vocabulario completo en una página: cada componente, las 7 mecánicas de comprobación y
cada variante, con contenido sobre LLMs para que las demos digan algo real. Ábrelo
directamente y úsalo para consultar. Se construyó con la implementación de referencia.

## Cómo está montado el proyecto

```
skills/make-it-learnable/      la skill empaquetada — lo único que se distribuye
  SKILL.md                     flujo + qué componentes encajan con qué material
  references/authoring.md      cómo pasar de cualquier fuente a una lección
  references/blueprint.md      el formato de blueprint + una lección completa de ejemplo
  references/components.md     un contrato de comportamiento por componente
  references/checks.md         las 7 mecánicas de comprobación y el feedback
  references/runtime.md        envoltorio de la página, interfaz, puntos, cierre, paleta
  references/visuals.md        cuándo dibujar en vez de tirar de un widget
  assets/favicon.svg           la marca a 32, incrustada en cada lección
reference-implementation/      el runtime HTML + builder que describen los contratos
tests/                         tests del builder de referencia
package-skill.sh               genera make-it-learnable.zip para distribuir
make-it-learnable.zip          el artefacto que le pasas a otra persona (ignorado en git)
examples/                      lecciones construidas, ábrelas en el navegador
assets/                        el logo y las capturas de este README
```

## Decisiones de diseño

- **Paleta: Fiery Ocean**, asignada por función y no por gusto. Trae dos rojos, y una
  lección no se puede permitir que *resaltado* y *incorrecto* sean el mismo color —
  así que el carmesí profundo es identidad, el azul océano es interacción, el rojo
  vivo significa incorrecto y nada más, y el verde significa correcto. Todos los pares
  de texto están comprobados en contraste.
- **Sin webfonts.** Una pila de fuentes del sistema que aterriza en algo real en cada
  plataforma (Avenir Next, Segoe UI Variable, Ubuntu, Roboto) y nunca acaba cayendo en
  Arial. Un enlace a Google Fonts rompería la única promesa que hace el formato.
- **Los puntos son un espejo, no el objetivo.** La puntuación paga por mojarse antes
  de ver la respuesta, por ser honesto con la confianza y por tocar el modelo — nunca
  por hacer clics. Las explicaciones explorables se definen normalmente *en contra* de
  la gamificación; esto mantiene una capa muy fina solo porque hace visible el caso de
  "seguro y equivocado". La partida vive en memoria: recargar reinicia la lección, que
  es lo que debería significar recargar. Lo único que sobrevive es el **récord
  personal**, en `localStorage`, para que volver a abrir el fichero dé una marca contra
  la que competir en vez de una hoja en blanco.

## Pruebas de la skill con distintos modelos

La skill se probó dándosela, sin nada más de este repo, a otros modelos y
abriendo lo que construyeron. Cada fila es una lección generada desde cero.
Temas: *las estaciones* (a partir de un texto corto, para estudiantes de
bachillerato que creen que se deben a la distancia de la Tierra al Sol), *el
DNS*, *el event loop de JavaScript*, *el handshake de HTTPS* y *la caché de
tokens*. Entre ronda y ronda se corrigió la skill allí donde un modelo fallaba,
así que cada ronda prueba una skill más reciente.

### opencode, en tmux

Los tokens y el coste salen de la base de datos de sesiones de opencode
(`~/.local/share/opencode/opencode.db`). El coste es la estimación de opencode a
precio de lista; las ejecuciones fueron en realidad por una suscripción de
Ollama Cloud (tarifa plana). El tiempo es de reloj, del primer prompt al último
mensaje, incluidas las esperas hasta un empujón.

| Ronda — qué cambió en la skill | Modelo | Tema | Entrada | Lectura de caché | Salida | Coste est. | Tiempo | Resultado |
|---|---|---|---:|---:|---:|---:|---:|---|
| 1 — primera spec, aún dictaba el aspecto | Kimi K3 | estaciones | 163.589 | 3.526.768 | 80.924 | 2,76 $ | 16 min | la mejor de la ronda, pero idéntica a la referencia |
| 1 | GLM 5.3 | estaciones | 452.570 | 8.096.576 | 166.437 | 3,47 $ | 36 min | necesitó varios empujones para dejar de planificar |
| 1 | DeepSeek V4 Pro | estaciones | 155.835 | 337.515 | 45.101 | 0,20 $ | 5 min | `TypeError` al cargar |
| 1 | MiniMax M3 | estaciones | 88.718 | 1.383.096 | 63.639 | 0,37 $ | 6 min | usó `Function`/`eval` |
| 1 | Qwen 3.5 397B | estaciones | 0 | 0 | 0 | — | — | no arrancó; descartado |
| 2 — sin diseño, el color como significado | GLM 5.3 | estaciones | 63.308 | 258.560 | 33.132 | 0,30 $ | 6 min | atascado planificando; parado |
| 2 | DeepSeek V4 Pro | estaciones | 110.882 | 1.642.700 | 47.569 | 0,20 $ | 5 min | aspecto propio; faltaba una clave de texto (`undefined` en el marcador) |
| 2 | MiniMax M3 | estaciones | 202.989 | 23.539.313 | 113.828 | 3,22 $ | 30 min | el escenario se iba con el scroll y la Tierra saltaba |
| 3 — `Picture`, `Analogy`, `pose` | Muse Spark 1.3 (OpenCode Zen) | estaciones | 0 | 0 | 0 | — | — | sin saldo en la cuenta |
| 3 | Muse Spark Open | estaciones | 97.707 | 698.048 | 30.115 | 0,36 $ | 4 min | escenario fijo, pero cuatro Tierras en vez de una que se mueve |
| 4 — esqueletos de layout | Muse Spark Open | estaciones | 99.479 | 1.266.656 | 34.260 | 0,46 $ | 4 min | datos en `<template>`: rompió todos los checks siguientes |
| 5 — misma skill, el prompt *pide* big pictures | Muse Spark Open | DNS | 105.712 | 879.360 | 39.769 | 0,43 $ | 8 min | primer `pose` de verdad: el paquete viaja de servidor en servidor |
| 6 — la skill exige big pictures, prompt neutro | Muse Spark Open | DNS | 92.913 | 481.344 | 27.162 | 0,30 $ | 3 min | visual sin ayuda del prompt; consola limpia |
| 6 | DeepSeek V4 Pro | event loop | 234.719 | 2.445.298 | 91.713 | 0,39 $ | 20 min | se paró antes de escribir el HTML; un empujón |
| 6 | MiniMax M3 | HTTPS | 106.546 | 9.942.737 | 59.814 | 1,40 $ | 10 min | escenario y escenas más bajos que la pantalla |

Kimi K3 tiene además dos sesiones abortadas de pocos segundos (≈74k de entrada,
1k de salida) que no aparecen. Ningún proveedor informó de tokens de razonamiento.

### Subagentes de Claude

Lanzados desde Claude Code con la herramienta `Agent`, con la orden de leer solo
la skill. Los tokens se suman desde la transcripción de cada subagente.

| Cuándo | Modelo | Tema | Entrada | Escritura de caché | Lectura de caché | Salida | Llamadas | Tiempo | Resultado |
|---|---|---|---:|---:|---:|---:|---:|---:|---|
| Antes de la ronda 1 | Opus 5.5 | estaciones | 34 | 136.683 | 1.687.250 | 37.701 | 16 | 8 min | primera prueba de que la skill se sostiene sola |
| Ronda 2 | Haiku 5.5 | estaciones | 40 | 181.353 | 2.633.690 | 74.941 | 19 | 10 min | aspecto propio, consola limpia |
| Ronda 2 | Sonnet 5.5 | estaciones | 34 | 161.382 | 1.564.496 | 45.159 | 17 | 9 min | story ancha, pero panels en 3 columnas |
| Ronda 6 (skill final) | Sonnet 5.5 | estaciones | 40 | 214.800 | 2.567.365 | 1.902¹ | 20 | 13 min | el mejor resultado: una Tierra que recorre la órbita, todo limpio |
| Ronda 6 (skill final) | Sonnet 5.5 | caché de tokens | 68 | 209.885 | 5.132.561 | 35.573 | 34 | 11 min | fuentes consultadas en la web; limpia en escritorio y móvil |
| v1.0.0 | Sonnet 5.5 | ventana de contexto de los agentes | 76 | 209.547 | 5.455.590 | 821¹ | 38 | 10 min | fuentes propias (docs de Anthropic, *Lost in the Middle*); limpia en escritorio y móvil |
| v1.0.0 | Sonnet 5.5 | deuda cognitiva del developer con IA | 62 | 229.322 | 5.037.828 | 1.588¹ | 31 | 11 min | construida con contenido de Web Reactiva (búsqueda MCP + blog); limpia en escritorio y móvil |

¹ Las transcripciones se quedan cortas en la salida de estas ejecuciones: cada una
escribió una página de 80–90 KB, que son decenas de miles de tokens de salida.

**Qué dicen los números.** Una lección cuesta más o menos 100–250k tokens de
entrada nueva y 30–110k de salida, sea cual sea el modelo; lo que se dispara es
la lectura de caché, que crece con cada vuelta extra que un modelo da releyendo
su propio contexto (los 23,5 M de MiniMax en la ronda 2 son un modelo dando
vueltas, no una lección más grande). Las ejecuciones buenas más baratas fueron
las que escribieron primero el blueprint y luego la página de una vez.

## Límites

- Los navegadores bloquean `Sandbox` en `file://`. Sírvelo por HTTP
  (`python3 -m http.server`) para enseñarlo, o déjalo fuera de un fichero que la gente
  vaya a abrir en local.
- Nada sale del navegador. El récord personal vive en `localStorage`, indexado por el
  título de la lección — privado de quien lee, en su máquina, y se va si borra los datos
  del sitio. No hay backend, y no lo va a haber.
- Una lección es tan honesta como su fuente. La regla más dura de la skill es
  *construir desde la fuente, no desde la memoria* — una lección afirma cosas con
  seguridad y no le da a quien lee ninguna forma de comprobarlas, así que una
  invención plausible hace más daño aquí que en un texto normal.

---

Hecho con 🧡 por [webreactiva.com](https://webreactiva.com)
