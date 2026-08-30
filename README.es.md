<img src="skills/make-it-learnable/assets/logo.svg" alt="" width="96" height="96">

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

Requisitos: **Python 3** (solo librería estándar) y un navegador con `:has()` en CSS —
Chrome 105+, Safari 15.4+, Firefox 121+. El runtime son custom elements y CSS a pelo;
no hay nada que compilar ni nada que instalar con `npm`.

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

A partir de ahí el agente lee el material, decide qué primitivas le encajan, escribe
el cuerpo de la lección y la construye en un único `.html`. El contenido sale en el
idioma de tu fuente; los textos propios del runtime (botones, veredictos, la tarjeta
final) siguen en inglés.

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

Un fichero `.html`, unos 110 KB, que respeta el tema del sistema, es accesible por
teclado y se imprime bien.

Una lección son **secciones**, cada una con su objetivo declarado, envueltas en un
**scroll-story** que convierte la posición del scroll en tiempo narrativo. Un
**escenario** (`l-stage`) sostiene una única representación persistente — un diagrama,
una traza, un trozo de estado — y las escenas la transforman según se avanza, en vez
de meter una imagen nueva cada vez. Las **comprobaciones** interrumpen en el momento
justo, y una tarjeta **final** cierra la lección diciendo qué merece un repaso.

### El vocabulario

Veinte primitivas, agrupadas por lo que hacen — más el runtime `scroll-story` en el
que viven (con sus escenas `l-scene`) y la tarjeta `l-finish` que cierra la lección.
Una buena lección usa **entre cuatro y siete**: elegir el puñado correcto es el
verdadero acto de criterio, y usar más es ruido, no exhaustividad.

| Familia | Primitivas |
|---|---|
| Estructura | `l-section` · `l-stack` · `l-split` · `l-stage` |
| Narrativa | `l-stepper` · `l-branch` — dentro del runtime `scroll-story` y sus escenas `l-scene` |
| Atención | `l-focus` · `l-reveal` · `l-layer` · `l-anatomy` · `l-compare` |
| Comportamiento | `l-transform` · `l-flow` · `l-trace` · `l-state` |
| Experimento | `l-whatif` (panel o documento reactivo) · `l-sandbox` |
| Aprendizaje | `l-quiz` · `l-contrast` · `l-checkpoint` — y `l-finish` para terminar |

Contrato de marcado completo: [`references/primitives.md`](skills/make-it-learnable/references/primitives.md).

### Las comprobaciones

Siete mecánicas. Lo único que cambia es la *acción* de quien lee; el armazón que la
rodea — situación → acción → evaluación → feedback — es siempre el mismo.

| Mecánica | Qué te dice |
|---|---|
| `prediction` | ¿Su modelo mental produce la salida correcta? |
| `spot` | ¿Reconoce el concepto en material real? |
| `classify` | ¿Distingue dos cosas que se confunden? |
| `arrange` | ¿Entiende el proceso? (con `low`/`high` sirve para ordenar por magnitud) |
| `explain` | ¿Sabe *generar* la explicación, no solo reconocerla? |
| `estimate` | ¿Tiene bien calibrado el orden de magnitud? |
| `choose` | ¿Es de verdad una elección entre opciones con nombre? |

Añade `confidence` y quien lee califica cómo de seguro estaba. El caso valioso es
**seguro y equivocado** — una creencia en la que confía activamente y que no se
sostiene — y el final lo señala con nombre y apellidos. Detalles:
[`references/quiz-modes.md`](skills/make-it-learnable/references/quiz-modes.md).

## Escribirlas a mano

No hace falta el agente. Escribe un fragmento de cuerpo y constrúyelo:

```html
<div class="ml-shell">
  <header class="ml-hero">
    <p class="ml-eyebrow">Fundamentos de backend · 12 min</p>
    <h1>Por qué hay una caché delante de tu base de datos</h1>
  </header>

  <scroll-story>
    <l-section id="predice" title="Antes de arreglarlo" goal="Mójate con un número">
      <l-quiz mode="prediction" answer="b" confidence>
        <l-prompt>La misma página se pide 1.000 veces. ¿Cuántas consultas a la BD?</l-prompt>
        <l-option value="a">Una — las bases de datos cachean consultas repetidas</l-option>
        <l-option value="b">1.000 veces</l-option>
        <l-actual>1.000 veces.</l-actual>
        <l-miss for="a">Las bases de datos sí mantienen páginas en memoria, así que la
        consulta va más rápida. Pero "consulta más rápida" no es "ninguna consulta".</l-miss>
        <l-why><p>La base de datos no tiene ni idea de que la respuesta que acaba de
        calcular se va a volver a pedir. Ese es el hueco que llena una caché — no
        velocidad, <b>repetición</b>.</p></l-why>
      </l-quiz>
    </l-section>
  </scroll-story>

  <l-finish title="Esto es cachear, en serio"></l-finish>
</div>
```

```bash
python3 skills/make-it-learnable/scripts/build_lesson.py lesson-body.html -o lesson.html \
  --title "…" --desc "…" --lang es
```

El script de build se niega a publicar referencias cruzadas rotas — un `focus` que
apunta a algo que no existe, un quiz sin respuesta, un `l-out` con una variable no
declarada — porque esas cosas fallan *en silencio* en el navegador: la página se
sigue viendo, simplemente deja de enseñar. Los avisos (una comprobación sin
`<l-why>`, una sección sin objetivo) son consejos que conviene hacer caso.

Comprobar sin construir:

```bash
python3 skills/make-it-learnable/scripts/build_lesson.py lesson-body.html --check-only
```

## Ejemplos

[`examples/gallery.html`](examples/gallery.html) — **no es una lección**, es el
vocabulario entero en una página: las 20 primitivas, las 7 mecánicas de comprobación,
todas las variantes, rellenadas con contenido sobre LLMs para que las demos digan algo
real. Ábrelo directamente y úsalo para consultar. Su fuente legible está en
[`skills/make-it-learnable/examples/gallery-body.html`](skills/make-it-learnable/examples/gallery-body.html);
los otros `*-body.html` que hay al lado son lecciones completas que el agente lee como
modelos.

## Cómo está montado el proyecto

```
skills/make-it-learnable/      la skill empaquetada — lo único que se distribuye
  SKILL.md                     el flujo + qué primitivas encajan con qué material
  references/authoring.md      cómo pasar de una fuente cualquiera a una lección
  references/primitives.md     contrato de marcado de las 20 primitivas
  references/quiz-modes.md     las 7 mecánicas de comprobación
  assets/runtime.{css,js}      el runtime — nunca se toca al escribir una lección
  assets/logo.svg              la marca
  assets/favicon.svg           la marca a 32, incrustada en cada build
  scripts/build_lesson.py      ensambla y valida
  examples/*-body.html         fuentes legibles que lee el agente
package-skill.sh               genera make-it-learnable.zip para distribuir
make-it-learnable.zip          el artefacto que le pasas a otra persona (ignorado por git)
examples/                      lecciones construidas, ábrelas en el navegador
assets/                        las capturas de este README
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
  "seguro y equivocado". La puntuación vive en memoria: recargar reinicia la lección,
  que es lo que debería significar recargar.

## Límites

- Los navegadores bloquean `l-sandbox` en `file://`. Sírvelo por HTTP
  (`python3 -m http.server`) para enseñarlo, o déjalo fuera de un fichero que la gente
  vaya a abrir en local.
- La puntuación no persiste. No hay backend, y no lo va a haber.
- Una lección es tan honesta como su fuente. La regla más dura de la skill es
  *construir desde la fuente, no desde la memoria* — una lección afirma cosas con
  seguridad y no le da a quien lee ninguna forma de comprobarlas, así que una
  invención plausible hace más daño aquí que en un texto normal.

---

Hecho con 🧡 por [webreactiva.com](https://webreactiva.com)
