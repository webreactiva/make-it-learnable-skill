/* make-it-learnable runtime.
   21 primitives as custom elements, light DOM, zero dependencies.
   Content lives in the markup; this file only adds behaviour. */
(() => {
'use strict';

const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
const ids = s => (s || '').split(/[\s,]+/).filter(Boolean);
const norm = s => (s || '').trim().toLowerCase();
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const def = (name, cls) => { if (!customElements.get(name)) customElements.define(name, cls); };
const emit = (node, type, detail) => node.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));

/* ══ Strings ══════════════════════════════════════════════════════
   Every user-facing string the runtime generates, in one place, so a
   lesson body never has to fight a literal buried in a widget. */
const STRINGS = {
  en: {
    kind: { prediction:'Predict first', choose:'Choose', spot:'Find it', classify:'Sort these',
            arrange:'Put in order', explain:'In your own words', estimate:'Estimate' },
    verdict: { right:'✓ Correct', wrong:'✗ Not quite', partial:'◐ Partly there', open:'· Compare with the reference' },
    check:'Check', checked:'Checked', reveal:'Reveal', goal:'Goal —',
    pts:'pts', answeredOf:(a,t)=>`${a} of ${t} answered`,
    confQ:'How confident are you?', confLow:'Guessing', confHigh:'Certain',
    confWrongSure:'You were confident and it did not hold — that usually means a rule you trust has an edge you have not met yet. Worth rereading the explanation slowly.',
    confRightUnsure:'You got it but did not trust it. The reasoning above is the part to lock in.',
    classifyHint:'Pick an item, then pick the group it belongs to.',
    anatomyHint:'Pick a part to inspect it.',
    checkpointTitle:'By now you should be able to explain',
    confirmed:(n,t)=>`${n} of ${t} confirmed`,
    keyIdeas:'Key ideas a good answer touches', reference:'Reference answer',
    you:'you', actual:'actual',
    estimateLine:(y,a,u)=>`Your estimate: ${y}${u} · Actual: ${a}${u}`,
    expected:'You expected', actualLabel:'What actually happens', gap:'The gap',
    finishEyebrow:'End of the lesson', finishTitle:'You made it to the end',
    correct:'correct', points:'points', checksCorrect:'checks correct',
    bestStreak:'best streak', checkpoints:'checkpoints',
    badgesEmpty:'Badges appear as you work through the checks.',
    revisit:'Worth revisiting', revisitNone:'Nothing — you got every check.',
    nextUp:'Where to go next', toTop:'Back to the top', again:'Start over',
    readPartial:(a,t)=>`<p>You have answered ${a} of ${t} checks. Come back when you have done the rest — the summary sharpens as you go.</p>`,
    readSure:n=>`<p><b>${n} answer${n>1?'s were':' was'} wrong while you felt sure.</b> That combination is the valuable one: it points at a rule you trust that has an edge you had not met. Those are listed below.</p>`,
    readCalibrated:'<p><b>Your confidence tracked your accuracy.</b> Knowing which parts you are unsure about is most of what "understanding a topic" means in practice.</p>',
    readDone:'<p>You worked through every check. The list below is what is worth a second pass.</p>',
    inARow:n=>`🔥 ${n} in a row`,
    tExplored:'explored the model', tCorrect:'correct', tCommitted:'you committed to an answer', tCheck:'checkpoint confirmed',
    aPrev:'Previous step', aNext:'Next step', aUp:'Move up', aDown:'Move down', aBlank:'blank',
    badges: {
      committed:['Committed','You answered every single check instead of scrolling past them.'],
      streak:['On a roll','Three correct in a row.'],
      calibrated:['Calibrated','Your confidence matched your accuracy three times — you know what you know.'],
      handsOn:['Hands on','You changed the model instead of just reading about it.'],
      consolidated:['Consolidated','You confirmed every checkpoint.'],
      clean:['Clean run','Every check correct.']
    },
    bestSoFar:n=>`best ${n.toLocaleString()}`, newBest:n=>`new best · beat ${n.toLocaleString()}`,
    run:'Run', reset:'Reset', labIdle:'Run a variant to see its output here.',
    labTimeout:'Stopped after 2 seconds.'
  },
  es: {
    kind: { prediction:'Predice primero', choose:'Elige', spot:'Encuéntralo', classify:'Clasifica',
            arrange:'Ordena la secuencia', explain:'Con tus palabras', estimate:'Estima' },
    verdict: { right:'✓ Correcto', wrong:'✗ No exactamente', partial:'◐ Parte bien', open:'· Compara con la referencia' },
    check:'Comprobar', checked:'Comprobado', reveal:'Mostrar', goal:'Objetivo —',
    pts:'pts', answeredOf:(a,t)=>`${a} de ${t} respondidos`,
    confQ:'¿Cómo de seguro estás?', confLow:'A ciegas', confHigh:'Convencido',
    confWrongSure:'Estabas convencido y no se sostuvo — eso suele significar que una regla en la que confías tiene un caso límite que no habías visto. Merece releer la explicación despacio.',
    confRightUnsure:'Acertaste pero no te fiabas. El razonamiento de arriba es lo que hay que fijar.',
    classifyHint:'Elige un elemento y luego el grupo al que pertenece.',
    anatomyHint:'Elige una parte para inspeccionarla.',
    checkpointTitle:'A estas alturas deberías poder explicar',
    confirmed:(n,t)=>`${n} de ${t} confirmados`,
    keyIdeas:'Ideas clave que toca una buena respuesta', reference:'Respuesta de referencia',
    you:'tú', actual:'real',
    estimateLine:(y,a,u)=>`Tu estimación: ${y}${u} · Real: ${a}${u}`,
    expected:'Esperabas', actualLabel:'Lo que ocurre de verdad', gap:'La diferencia',
    finishEyebrow:'Fin de la lección', finishTitle:'Llegaste al final',
    correct:'correctas', points:'puntos', checksCorrect:'checks correctos',
    bestStreak:'mejor racha', checkpoints:'checkpoints',
    badgesEmpty:'Las insignias aparecen a medida que trabajas los checks.',
    revisit:'Merece una segunda pasada', revisitNone:'Nada — acertaste todos los checks.',
    nextUp:'Por dónde seguir', toTop:'Volver arriba', again:'Empezar de nuevo',
    readPartial:(a,t)=>`<p>Has respondido ${a} de ${t} checks. Vuelve cuando termines — el resumen se afina sobre la marcha.</p>`,
    readSure:n=>`<p><b>${n} respuesta${n>1?'s estaban':' estaba'} mal mientras te sentías seguro.</b> Esa combinación es la valiosa: señala una regla en la que confías con un borde que no habías visto. Están listadas abajo.</p>`,
    readCalibrated:'<p><b>Tu confianza siguió a tu acierto.</b> Saber de qué partes no estás seguro es casi toda la definición práctica de "entender un tema".</p>',
    readDone:'<p>Trabajaste todos los checks. La lista de abajo es lo que merece otra pasada.</p>',
    inARow:n=>`🔥 ${n} seguidas`,
    tExplored:'exploraste el modelo', tCorrect:'correcto', tCommitted:'te comprometiste con una respuesta', tCheck:'checkpoint confirmado',
    aPrev:'Paso anterior', aNext:'Paso siguiente', aUp:'Subir', aDown:'Bajar', aBlank:'en blanco',
    badges: {
      committed:['Comprometido','Respondiste todos los checks en vez de pasar de largo.'],
      streak:['En racha','Tres correctas seguidas.'],
      calibrated:['Calibrado','Tu confianza igualó a tu acierto tres veces — sabes lo que sabes.'],
      handsOn:['Manos a la obra','Cambiaste el modelo en vez de solo leer sobre él.'],
      consolidated:['Consolidado','Confirmaste todos los checkpoints.'],
      clean:['Sin fallos','Todos los checks correctos.']
    },
    bestSoFar:n=>`récord ${n.toLocaleString()}`, newBest:n=>`¡récord! · antes ${n.toLocaleString()}`,
    run:'Ejecutar', reset:'Reiniciar', labIdle:'Ejecuta una variante para ver su salida aquí.',
    labTimeout:'Detenido después de 2 segundos.'
  }
};
const T = STRINGS[(document.documentElement.lang || 'en').slice(0, 2).toLowerCase()] || STRINGS.en;
// `en` and `es` ship. <html lang> picks the block (build_lesson.py --lang writes it);
// a missing key falls back per-key only if you wire it — keep the blocks complete.


/* ══ Game ═════════════════════════════════════════════════════════
   Explorable explanations are normally defined *against* gamification:
   the interactivity is the reward, and a points layer bolted on top
   turns "science communication with interactivity" into "a game with
   some science in it". So this scoring deliberately pays for the three
   things that actually make an explanation work — committing to an
   answer before seeing it, being honest about how sure you were, and
   touching the model yourself — and never pays for clicking around.
   It is a mirror of engagement, not a leaderboard.
   ponytail: the run is in-memory. A reload restarts the lesson, which
   is what a reload should mean — only BestRun survives it. */
const BADGES = T.badges;

/* ══ personal best ════════════════════════════════════════════════
   A lesson is one file people re-open, so the only state worth keeping
   between visits is the run to beat. localStorage is the only place that
   survives that on file://, and every access is guarded: private windows
   and some file:// contexts throw on the accessor itself. Keyed by title
   because all file:// pages share one origin. */
const BestRun = {
  key: 'ml:best:' + (document.title || 'lesson').slice(0, 90),
  read() { try { return JSON.parse(localStorage.getItem(this.key)) || null; } catch { return null; } },
  write(v) { try { localStorage.setItem(this.key, JSON.stringify(v)); } catch {} },
};

const Game = {
  points: 0, streak: 0, best: 0, right: 0, answered: 0, calibrated: 0, overconfident: 0,
  explored: new Set(), checks: 0, revisit: [], badges: new Set(), _hud: null,
  prev: BestRun.read(), stored: null, beaten: false,  // prev is frozen at load: the run you are racing
  get quizTotal() { return document.querySelectorAll('l-quiz').length; },
  get canTotal() { return document.querySelectorAll('l-can').length; },

  award(n, label) {
    this.points += n;
    this.toast('+' + n, label);
    this.sync();
  },

  badge(id) {
    if (this.badges.has(id) || !BADGES[id]) return;
    this.badges.add(id);
    this.toast('★', BADGES[id][0]);
  },

  /* Touching a live model is worth something once per kind — enough to
     signal "this was the point", not enough to farm. */
  explore(kind) {
    if (this.explored.has(kind)) return;
    this.explored.add(kind);
    this.badge('handsOn');
    this.award(10, T.tExplored);
  },

  quiz(q, res, conf) {
    this.answered++;
    const right = res.verdict === 'right';
    if (right) { this.right++; this.streak++; this.best = Math.max(this.best, this.streak); }
    else this.streak = 0;

    let pts = { right: 100, partial: 45, open: 40, wrong: 10 }[res.verdict] ?? 10;
    if (right && this.streak > 1) pts += Math.min(75, (this.streak - 1) * 15);
    // Predicting before the reveal is the single most valuable move in the format.
    if (q.mode === 'prediction' || q.mode === 'estimate') pts += 15;

    if (conf != null) {
      const honest = (right && conf >= 65) || (!right && conf <= 35);
      if (honest) { this.calibrated++; pts += 25; if (this.calibrated >= 3) this.badge('calibrated'); }
      if (!right && conf >= 70) this.overconfident++;
    }
    if (this.streak >= 3) this.badge('streak');
    if (!right) this.revisit.push({ id: q.id, text: q.querySelector('.ml-quiz-prompt')?.textContent.trim() || q.id, verdict: res.verdict });
    if (this.answered === this.quizTotal) {
      this.badge('committed');
      if (this.right === this.quizTotal) this.badge('clean');
    }
    this.award(pts, right ? T.tCorrect : T.tCommitted);
  },

  can(on) {
    this.checks += on ? 1 : -1;
    if (on) this.award(15, T.tCheck);
    if (this.checks === this.canTotal && this.canTotal) this.badge('consolidated');
    this.sync();
  },

  hud() {
    if (this._hud || !this.quizTotal) return this._hud;
    const h = el('div', 'ml-hud');
    h.innerHTML = '<span class="ml-hud-pts"><b>0</b><i>' + T.pts + '</i></span>'
                + '<span class="ml-hud-sub"></span><span class="ml-hud-best"></span>';
    document.body.append(h);
    return (this._hud = h);
  },

  toast(big, small) {
    const h = this.hud(); if (!h) return;
    const t = el('div', 'ml-toast');
    t.innerHTML = `<b>${big}</b>${small ? `<span>${small}</span>` : ''}`;
    h.append(t);
    setTimeout(() => t.remove(), 2600);
  },

  sync() {
    // Settle the record first: painting before this leaves the HUD one sync behind.
    if (this.points > (this.stored?.points ?? this.prev?.points ?? 0)) {
      if (this.prev && this.points > this.prev.points) this.beaten = true;
      this.stored = { points: this.points, right: this.right, total: this.quizTotal, at: Date.now() };
      BestRun.write(this.stored);
    }
    const h = this.hud();
    if (h) {
      h.querySelector('.ml-hud-pts b').textContent = this.points.toLocaleString();
      h.querySelector('.ml-hud-sub').textContent =
        this.streak >= 2 ? T.inARow(this.streak) : T.answeredOf(this.answered, this.quizTotal);
      h.dataset.streak = this.streak >= 2 ? '1' : '0';
      h.querySelector('.ml-hud-best').textContent = !this.prev ? ''
        : this.beaten ? T.newBest(this.prev.points)
        : T.bestSoFar(this.prev.points);
      h.dataset.beaten = this.beaten ? '1' : '0';
    }
    document.querySelectorAll('l-finish').forEach(f => f.render?.());
  }
};



/* ══ Syntax highlighting ══════════════════════════════════════════
   A lesson about code has to look like code. No library: a lesson is
   a single offline file, and a highlighter is a few dozen lines if
   you scan one combined alternation left to right — first alternative
   wins at each position, which is what makes comments beat strings
   beat keywords without any state machine. */
const GRAMMARS = {
  js: [
    ['comment', /\/\/[^\n]*|\/\*[\s\S]*?\*\//],
    ['str',     /`(?:\\[\s\S]|[^`\\])*`|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|\/(?![*\/])(?:\\.|\[(?:\\.|[^\]\\])*\]|[^\/\\\n])+\/[gimsuy]*/],
    ['key',     /\b(?:const|let|var|function|return|if|else|for|while|do|of|in|new|class|extends|import|from|export|default|async|await|try|catch|finally|throw|switch|case|break|continue|typeof|instanceof|interface|type|enum|implements|public|private|protected|readonly|static|as|satisfies|null|undefined|true|false|this|void|never|unknown|any|string|number|boolean)\b/],
    ['num',     /\b0[xX][0-9a-fA-F]+\b|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/],
    ['fn',      /\b[A-Za-z_$][\w$]*(?=\s*[(<])/],
    ['type',    /\b[A-Z][\w$]*\b/],
    ['punct',   /[{}()[\];,.:?=<>+\-*/%!&|]+/],
  ],
  json: [
    ['prop',    /"(?:\\.|[^"\\])*"(?=\s*:)/],
    ['str',     /"(?:\\.|[^"\\])*"/],
    ['key',     /\b(?:true|false|null)\b/],
    ['num',     /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/],
    ['punct',   /[{}[\],:]/],
  ],
  html: [
    ['comment', /<!--[\s\S]*?-->/],
    ['tag',     /<\/?[A-Za-z][\w-]*/],
    ['str',     /"(?:[^"]*)"|'(?:[^']*)'/],
    ['prop',    /\b[A-Za-z-][\w-]*(?==)/],
    ['punct',   /\/?>/],
  ],
  php: [
    ['comment', /\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\//],
    ['str',     /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/],
    ['key',     /<\?(?:php)?|\?>|\b(?:abstract|and|array|as|bool|break|callable|case|catch|class|clone|const|continue|declare|default|do|echo|else|elseif|enum|extends|final|finally|float|fn|for|foreach|function|global|if|implements|instanceof|insteadof|int|interface|match|mixed|namespace|new|null|or|parent|print|private|protected|public|readonly|return|self|static|string|switch|throw|trait|try|use|var|void|while|yield|true|false)\b/],
    ['prop',    /\$[A-Za-z_]\w*/],
    ['num',     /\b0[xX][0-9a-fA-F]+\b|\b\d+(?:\.\d+)?\b/],
    ['fn',      /\b[A-Za-z_]\w*(?=\s*\()/],
    ['type',    /\b[A-Z]\w*\b/],
    ['punct',   /[{}()[\];,.:?=<>+\-*/%!&|]+/],
  ],
  python: [
    ['comment', /#[^\n]*/],
    ['str',     /(?:[rbfu]{0,2})(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')/],
    ['key',     /\b(?:def|class|return|if|elif|else|for|while|in|not|and|or|is|None|True|False|import|from|as|with|try|except|finally|raise|yield|lambda|global|nonlocal|pass|break|continue|assert|async|await|del|self|cls|match|case)\b/],
    ['num',     /\b0[xXbBoO][0-9a-fA-F_]+\b|\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b/],
    ['fn',      /\b[A-Za-z_]\w*(?=\s*\()/],
    ['type',    /\b[A-Z]\w*\b/],
    ['punct',   /[{}()[\];,.:?=<>+\-*/%!&|@]+/],
  ],
  go: [
    ['comment', /\/\/[^\n]*|\/\*[\s\S]*?\*\//],
    ['str',     /`[^`]*`|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/],
    ['key',     /\b(?:package|import|func|return|if|else|for|range|switch|case|default|break|continue|fallthrough|go|defer|chan|select|type|struct|interface|map|var|const|nil|true|false|error|string|bool|byte|rune|int|int8|int16|int32|int64|uint|uint8|uint32|uint64|float32|float64|make|new|len|cap|append|copy|delete|panic|recover)\b/],
    ['num',     /\b0[xXbBoO][0-9a-fA-F_]+\b|\b\d[\d_]*(?:\.\d+)?\b/],
    ['fn',      /\b[A-Za-z_]\w*(?=\s*\()/],
    ['type',    /\b[A-Z]\w*\b/],
    ['punct',   /[{}()[\];,.:?=<>+\-*/%!&|]+/],
  ],
  rust: [
    ['comment', /\/\/[^\n]*|\/\*[\s\S]*?\*\//],
    ['str',     /r?#*"(?:\\.|[^"\\])*"#*|'(?:\\.|[^'\\])'/],
    ['key',     /\b(?:fn|let|mut|const|static|struct|enum|trait|impl|for|in|if|else|match|while|loop|break|continue|return|pub|use|mod|crate|self|Self|super|where|as|dyn|ref|move|async|await|unsafe|extern|type|box|true|false)\b/],
    ['num',     /\b0[xXbBoO][0-9a-fA-F_]+\b|\b\d[\d_]*(?:\.\d+)?(?:[iuf](?:8|16|32|64|128|size))?\b/],
    ['fn',      /\b[a-z_]\w*(?=\s*[(!])/],
    ['type',    /\b[A-Z]\w*\b|\b(?:i8|i16|i32|i64|u8|u16|u32|u64|usize|isize|f32|f64|bool|str|char)\b/],
    ['punct',   /[{}()[\];,.:?=<>+\-*/%!&|]+/],
  ],
  css: [
    ['comment', /\/\*[\s\S]*?\*\//],
    ['str',     /"[^"\n]*"|'[^'\n]*'/],
    ['key',     /@[\w-]+|!important\b/],
    ['prop',    /[-a-zA-Z]+(?=\s*:)/],
    ['num',     /#[0-9a-fA-F]{3,8}\b|-?\b\d*\.?\d+(?:px|rem|em|ex|ch|%|vh|vw|vmin|vmax|cqw|cqh|s|ms|deg|fr|dpi)?\b/],
    ['fn',      /\b[a-zA-Z-]+(?=\()/],
    ['type',    /[.#][-\w]+|::?[-\w()]+|\[[^\]\n]*\]/],
    ['punct',   /[{}();,>+~*]+/],
  ],
  yaml: [
    ['comment', /#[^\n]*/],
    ['str',     /"(?:\\.|[^"\\\n])*"|'(?:''|[^'\n])*'/],
    ['prop',    /[\w.\/-]+(?=\s*:(?:\s|$))/],
    ['key',     /\b(?:true|false|null|yes|no|on|off)\b|<<|\*\w+|&\w+/],
    ['num',     /\b\d[\d_]*(?:\.\d+)?\b/],
    ['punct',   /^\s*-\s|[:|>]/],
  ],
  sql: [
    ['comment', /--[^\n]*|\/\*[\s\S]*?\*\//],
    ['str',     /'(?:''|[^'])*'/],
    ['key',     /\b(?:select|from|where|insert|into|values|update|set|delete|create|table|view|index|alter|add|drop|join|left|right|inner|outer|full|cross|on|using|as|and|or|not|null|is|in|between|like|exists|group|by|order|asc|desc|having|limit|offset|union|all|distinct|case|when|then|else|end|primary|key|foreign|references|unique|default|constraint|with|returning|begin|commit|rollback|transaction|cascade|int|integer|bigint|varchar|text|boolean|timestamp|date|numeric|json|jsonb)\b/],
    ['fn',      /\b[a-z_]\w*(?=\s*\()/],
    ['num',     /\b\d+(?:\.\d+)?\b/],
    ['punct',   /[();,.*=<>+\-/|]+/],
  ],
  bash: [
    ['comment', /#[^\n]*/],
    ['str',     /"(?:\\.|[^"\\])*"|'[^']*'/],
    ['key',     /\b(?:npm|npx|pnpm|yarn|bun|deno|python3|python|pip|node|php|composer|artisan|go|cargo|rustc|docker|kubectl|make|curl|wget|git|cd|ls|cat|grep|sed|awk|echo|export|source|run|test|if|then|fi|else|for|while|do|done|case|esac|function|return)\b/],
    ['prop',    /(?:^|\s)--?[\w-]+/],
    ['num',     /\b\d+(?:\.\d+)*\b/],
  ],
};
const ALIAS = { ts:'js', tsx:'js', jsx:'js', javascript:'js', typescript:'js', sh:'bash', shell:'bash', console:'bash',
  py:'python', golang:'go', rs:'rust', yml:'yaml', scss:'css', postgres:'sql', postgresql:'sql', mysql:'sql', sqlite:'sql',
  text:null, plain:null };
// SQL keywords are conventionally shouted; yaml anchors a rule per line.
const GRAMMAR_FLAGS = { sql: 'i', yaml: 'm' };
for (const [name, g] of Object.entries(GRAMMARS)) {
  g.re = new RegExp(g.map(([n, r]) => `(?<${n}>${r.source})`).join('|'), 'g' + (GRAMMAR_FLAGS[name] || ''));
}
const escHtml = s => s.replace(/[&<>]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[c]));

function highlight(code, lang) {
  const g = GRAMMARS[ALIAS[lang] !== undefined ? ALIAS[lang] : lang];
  if (!g) return escHtml(code);
  let out = '', last = 0;
  for (const m of code.matchAll(g.re)) {
    out += escHtml(code.slice(last, m.index));
    const kind = Object.keys(m.groups).find(k => m.groups[k] !== undefined);
    out += `<span class="tok-${kind}">${escHtml(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return out + escHtml(code.slice(last));
}

function paintCode(root = document) {
  $$('pre > code[class*="lang-"]', root).forEach(el => {
    // Never touch a block that carries markup of its own — a spot check's
    // <l-region>s live inside one and rewriting innerHTML would delete them.
    if (el.children.length || el.dataset.lit) return;
    const lang = (el.className.match(/lang-([\w-]+)/) || [])[1];
    el.innerHTML = highlight(el.textContent, lang);
    el.dataset.lit = '1';
    el.parentElement.dataset.lang = lang;
  });
}

/* ══ Stage ════════════════════════════════════════════════════════
   The persistent representation. Everything that "controls" something
   (Focus, Reveal, Layer, ScrollStory scenes, Stepper) ends up calling
   stage.apply(). Keeping one entry point is what stops the control
   primitives from each inventing their own way to poke the DOM. */
class Stage extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    const label = this.getAttribute('label');
    if (label) this.prepend(el('div', 'ml-stage-label', label));
    // Parts marked hidden-until-revealed start hidden.
    $$('[data-part][data-reveal="later"]', this).forEach(p => p.setAttribute('data-hidden', ''));
    // …and so do state-dependent ones: no state set yet means nothing matches.
    $$('[data-when]', this).forEach(p => p.setAttribute('data-hidden', ''));
  }
  part(name) { return this.querySelector(`[data-part="${CSS.escape(name)}"]`) || this.querySelector('#' + CSS.escape(name)); }
  /* effects: {state, focus:[], reveal:[], layers:[], step} — omitted keys are left alone. */
  apply(fx = {}) {
    if (fx.state != null) {
      this.dataset.state = fx.state;
      $$('[data-when]', this).forEach(n => n.toggleAttribute('data-hidden', n.dataset.when !== fx.state));
    }
    if (fx.reveal) fx.reveal.forEach(n => this.part(n)?.removeAttribute('data-hidden'));
    if (fx.focus) {
      $$('[data-part][data-focus]', this).forEach(n => n.removeAttribute('data-focus'));
      fx.focus.forEach(n => this.part(n)?.setAttribute('data-focus', ''));
      this.dataset.focusing = fx.focus.length ? '1' : '0';
    }
    if (fx.layers) $$('[data-layer]', this).forEach(n => n.toggleAttribute('data-off', !fx.layers.includes(n.dataset.layer)));
    if (fx.step != null) this.querySelectorAll('l-trace, l-transform, l-flow, l-stepper').forEach(c => c.setStep?.(+fx.step));
    if (fx.fields) this.querySelector('l-state')?.set(fx.fields);
    emit(this, 'stage:change', fx);
  }
}
def('l-stage', Stage);
const stageFor = (node, id) => (id ? document.getElementById(id) : node.closest('l-section, scroll-story, body')?.querySelector('l-stage')) || document.querySelector('l-stage');

/* Read effects declared on any element (scene, step, path…) */
function readFx(node) {
  const fx = {};
  if (node.hasAttribute('state')) fx.state = node.getAttribute('state');
  if (node.hasAttribute('step')) fx.step = node.getAttribute('step');
  const f = ids(node.getAttribute('focus')), r = ids(node.getAttribute('reveal')), l = node.getAttribute('layers');
  $$('l-focus[target]', node).forEach(n => f.push(...ids(n.getAttribute('target'))));
  $$('l-reveal[target]', node).forEach(n => r.push(...ids(n.getAttribute('target'))));
  fx.focus = f;                      // always sent: an empty list clears the previous focus
  if (r.length) fx.reveal = r;
  if (l != null) fx.layers = ids(l);
  return fx;
}

/* ══ ScrollStory ══════════════════════════════════════════════════
   The narrative runtime. Scroll position is already how people move
   through a page, so we read it as narrative time rather than adding
   a second set of controls the reader has to learn. */
/* A sequence of self-contained visual beats: one drawing per panel, a
   sentence for a title, a caption. No scroll machinery, no JS behaviour —
   the drawing carries the argument and the page reads with JS disabled. */
class Panel extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    const t = this.getAttribute('title');
    if (t) { this.removeAttribute('title'); this.prepend(el('h3', 'ml-panel-title', t)); }
  }
}
def('l-panel', Panel);

class ScrollStory extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    this.state = { progress: 0, section: null, scene: null, direction: 'forward', visited: [], locked: false };
    this._lastY = window.scrollY;
    const scenes = $$('l-scene', this);
    // Cumulative reveals: a scene inherits everything earlier scenes revealed,
    // so jumping backwards or deep-linking never shows a half-built diagram.
    let acc = [];
    scenes.forEach(s => { const fx = readFx(s); acc = [...new Set([...acc, ...(fx.reveal || [])])]; s._fx = { ...fx, reveal: acc.slice() }; });

    /* An observer only fires on transitions. Acting on `isIntersecting`
       alone means that when two adjacent scenes overlap the band, the one
       already inside never re-fires — so scrolling back up skipped it and
       the stage stayed on the scene below. Keep the live set instead and
       pick the scene nearest the middle on every callback, including the
       ones where a scene *leaves*. */
    const live = new Set();
    const mostCentred = () => {
      const mid = innerHeight / 2;
      let best = null, bestD = Infinity;
      live.forEach(s => {
        const r = s.getBoundingClientRect(), d = Math.abs((r.top + r.bottom) / 2 - mid);
        if (d < bestD) { bestD = d; best = s; }
      });
      return best;
    };
    const io = new IntersectionObserver(es => {
      es.forEach(e => e.isIntersecting ? live.add(e.target) : live.delete(e.target));
      const s = mostCentred();
      if (s) this.activate(s);
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    scenes.forEach(s => io.observe(s));

    const onScroll = () => {
      const y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
      this.state.direction = y >= this._lastY ? 'forward' : 'backward'; this._lastY = y;
      this.state.progress = h > 0 ? Math.min(1, y / h) : 0;
      emit(this, 'story:progress', this.state);
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    if (scenes.length) this.activate(scenes[0]);
  }
  activate(scene) {
    if (this._active === scene) return;
    this._active?.removeAttribute('data-active');
    this._active = scene; scene.setAttribute('data-active', '');
    this.state.scene = scene.getAttribute('name') || null;
    const sec = scene.closest('l-section')?.id || null;
    if (sec) { this.state.section = sec; if (!this.state.visited.includes(sec)) this.state.visited.push(sec); }
    stageFor(scene, scene.getAttribute('stage'))?.apply(scene._fx || readFx(scene));
    emit(this, 'story:scene', { ...this.state });
  }
}
def('scroll-story', ScrollStory);

/* ══ Section ══════════════════════════════════════════════════════ */
class Section extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    const t = this.getAttribute('title'), g = this.getAttribute('goal');
    if (!t && !g) return;
    const head = el('div', 'ml-sec-head');
    if (this.getAttribute('eyebrow')) head.append(el('p', 'ml-eyebrow', this.getAttribute('eyebrow')));
    if (t) head.append(el('h2', null, t));
    if (g) { const d = el('div', 'ml-goal'); d.innerHTML = `<span><b>${T.goal}</b> ${g}</span>`; head.append(d); }
    this.prepend(head);
  }
}
def('l-section', Section);

/* ══ Focus / Reveal (standalone) ══════════════════════════════════
   Inside a scene these are read declaratively by readFx. Outside one
   they work on their own so a primitive is never scroll-only. */
class Focus extends HTMLElement {
  connectedCallback() {
    if (this._init || this.closest('l-scene')) return; this._init = true;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) stageFor(this, this.getAttribute('stage'))?.apply({ focus: ids(this.getAttribute('target')) });
    }), { rootMargin: '-40% 0px -40% 0px' });
    io.observe(this);
  }
}
def('l-focus', Focus);

class Reveal extends HTMLElement {
  connectedCallback() {
    if (this._init || (this.closest('l-scene') && this.hasAttribute('target'))) return; this._init = true;
    const trig = this.getAttribute('trigger') || 'click';
    if (trig !== 'click') return;                       // scroll/step reveals are driven by scenes and steppers
    const box = el('div'); while (this.firstChild) box.append(this.firstChild);
    box.hidden = true;
    const btn = el('button', 'ml-reveal-btn', this.getAttribute('label') || T.reveal);
    btn.type = 'button';
    btn.onclick = () => { box.hidden = false; btn.remove(); emit(this, 'reveal:open'); };
    this.append(btn, box);
  }
}
def('l-reveal', Reveal);

/* ══ Layer ════════════════════════════════════════════════════════ */
class Layer extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    const stage = () => stageFor(this, this.getAttribute('stage'));
    const names = ids(this.getAttribute('layers'));
    const on = new Set(ids(this.getAttribute('default') ?? names[0]));
    const sync = () => stage()?.apply({ layers: [...on] });
    names.forEach(n => {
      const lab = el('label'); const cb = el('input'); cb.type = 'checkbox'; cb.checked = on.has(n);
      cb.onchange = () => { cb.checked ? on.add(n) : on.delete(n); sync(); };
      lab.append(cb, document.createTextNode(this.getAttribute('label-' + n) || n));
      this.append(lab);
    });
    requestAnimationFrame(sync);
  }
}
def('l-layer', Layer);

/* ══ Stepper ══════════════════════════════════════════════════════ */
class Stepper extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    this.steps = $$(':scope > l-step', this);
    const bar = el('div', 'ml-stepbar');
    const prev = el('button', null, '‹'), next = el('button', null, '›');
    prev.type = next.type = 'button';
    prev.setAttribute('aria-label', T.aPrev); next.setAttribute('aria-label', T.aNext);
    this.count = el('span', 'ml-count');
    this.dots = el('div', 'ml-dots');
    this.steps.forEach(() => this.dots.append(el('i')));
    bar.append(prev, next, this.count, this.dots);
    this.prepend(bar);
    prev.onclick = () => this.setStep(this.i - 1);
    next.onclick = () => this.setStep(this.i + 1);
    this._prev = prev; this._next = next;
    this.setStep(+(this.getAttribute('start') || 0));
  }
  setStep(i) {
    if (!this.steps?.length) return;
    this.i = Math.max(0, Math.min(this.steps.length - 1, i));
    this.steps.forEach((s, k) => s.toggleAttribute('data-active', k === this.i));
    [...this.dots.children].forEach((d, k) => d.toggleAttribute('data-on', k === this.i));
    this.count.textContent = `${this.i + 1}/${this.steps.length}`;
    this._prev.disabled = this.i === 0; this._next.disabled = this.i === this.steps.length - 1;
    const st = this.steps[this.i];
    stageFor(this, this.getAttribute('stage'))?.apply(readFx(st));
    emit(this, 'step:change', { index: this.i });
  }
}
def('l-stepper', Stepper);

/* ══ Anatomy ══════════════════════════════════════════════════════ */
class Anatomy extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    const parts = $$(':scope > l-part', this);
    const body = el('div', 'ml-anat-body');
    const detail = el('div', 'ml-anat-detail');
    detail.innerHTML = `<p class="ml-empty">${this.getAttribute('hint') || T.anatomyHint}</p>`;
    parts.forEach(p => {
      const note = p.querySelector('l-note');
      const label = p.getAttribute('label') || (note ? p.childNodes[0]?.textContent : p.textContent) || '';
      const holder = el('l-part'); holder.textContent = label.trim();
      holder.tabIndex = 0; holder.setAttribute('role', 'button');
      const show = () => {
        $$('l-part', body).forEach(n => n.removeAttribute('data-active'));
        holder.setAttribute('data-active', '');
        detail.innerHTML = `<h4>${label.trim()}</h4>` + (note ? note.innerHTML : '');
      };
      holder.onclick = show;
      holder.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); } };
      body.append(holder); p.remove();
    });
    this.append(body, detail);
  }
}
def('l-anatomy', Anatomy);

/* ══ Compare ══════════════════════════════════════════════════════ */
class Compare extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    const rows = $$(':scope > l-criterion', this);
    const heads = $$(':scope > l-column', this).map(c => c.textContent.trim());
    if (!rows.length) return;
    const chips = el('div', 'ml-crit');
    const table = el('table');
    const thead = el('thead'), tr = el('tr');
    tr.append(el('th', null, this.getAttribute('label') || ''));
    heads.forEach(h => tr.append(el('th', null, h)));
    thead.append(tr); table.append(thead);
    const tbody = el('tbody');
    rows.forEach(r => {
      const row = el('tr'); row.dataset.crit = r.getAttribute('name') || '';
      row.append(el('th', null, r.getAttribute('name') || ''));
      $$('l-cell', r).forEach(c => { const td = el('td'); td.innerHTML = c.innerHTML; row.append(td); });
      tbody.append(row);
      const chip = el('button', 'ml-chip', r.getAttribute('name') || '');
      chip.type = 'button'; chip.setAttribute('aria-pressed', 'false');
      chip.onclick = () => {
        const on = chip.getAttribute('aria-pressed') === 'true';
        $$('.ml-chip', chips).forEach(c => c.setAttribute('aria-pressed', 'false'));
        $$('tr[data-dim]', tbody).forEach(t => t.removeAttribute('data-dim'));
        if (!on) { chip.setAttribute('aria-pressed', 'true'); row.setAttribute('data-dim', ''); }
      };
      chips.append(chip);
    });
    table.append(tbody);
    $$(':scope > l-criterion, :scope > l-column', this).forEach(n => n.remove());
    if (rows.length > 1) this.append(chips);
    this.append(table);
  }
}
def('l-compare', Compare);

/* ══ Transform ════════════════════════════════════════════════════ */
class Transform extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    this.phases = $$(':scope > l-phase', this);
    this.phases.forEach((p, i) => {
      const name = p.getAttribute('name') || '';
      const inner = p.innerHTML;
      p.innerHTML = `<div class="ml-phase-name">${name}</div>` + (inner.trim() ? `<div class="ml-phase-body">${inner}</div>` : '');
      if (i < this.phases.length - 1) p.after(el('span', 'ml-arrow', '→'));
    });
  }
  setStep(i) { this.phases?.forEach((p, k) => p.toggleAttribute('data-active', k === i)); }
}
def('l-transform', Transform);

/* ══ Flow ═════════════════════════════════════════════════════════
   Nodes are laid out by CSS grid; edges are drawn as SVG between the
   real boxes, so a change in wording never breaks the arrows. */
class Flow extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    const nodes = $$(':scope > l-node', this);
    const edges = $$(':scope > l-edge', this).map(e => ({
      from: e.getAttribute('from'), to: e.getAttribute('to'),
      label: e.getAttribute('label') || '', layer: e.getAttribute('layer') || null, node: e
    }));
    edges.forEach(e => e.node.remove());
    const grid = el('div', 'ml-flow-grid');
    grid.style.gridTemplateColumns = `repeat(${this.getAttribute('cols') || Math.min(nodes.length, 3)}, minmax(0,1fr))`;
    nodes.forEach(n => { if (n.getAttribute('col')) n.style.gridColumn = n.getAttribute('col'); if (n.getAttribute('row')) n.style.gridRow = n.getAttribute('row'); grid.append(n); });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'ml-flow-svg');
    svg.innerHTML = `<defs><marker id="ml-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>`;
    svg.style.color = 'var(--ml-line-strong)';
    const labels = svg.cloneNode(false);          // labels paint above the nodes
    labels.setAttribute('class', 'ml-flow-svg ml-flow-labels');
    this.append(svg, grid, labels);
    this._svg = svg; this._labels = labels; this._edges = edges;
    const draw = () => this.draw();
    new ResizeObserver(draw).observe(this);
    this.closest('l-stage')?.addEventListener('stage:change', () => requestAnimationFrame(draw));
    requestAnimationFrame(draw);
  }
  draw() {
    const svg = this._svg; if (!svg) return;
    $$('path.ml-edge', svg).forEach(n => n.remove());
    this._labels.innerHTML = '';
    const box = this.getBoundingClientRect();
    const at = id => { const n = this.querySelector(`l-node#${CSS.escape(id)}`); if (!n) return null; const r = n.getBoundingClientRect(); return { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height }; };
    const hidden = id => this.querySelector(`l-node#${CSS.escape(id)}`)?.hasAttribute('data-hidden');
    this._edges.forEach(e => {
      if (hidden(e.from) || hidden(e.to)) return;
      const a = at(e.from), b = at(e.to); if (!a || !b) return;
      const vertical = Math.abs((b.y + b.h / 2) - (a.y + a.h / 2)) > Math.abs((b.x + b.w / 2) - (a.x + a.w / 2));
      const p1 = vertical ? { x: a.x + a.w / 2, y: b.y > a.y ? a.y + a.h : a.y } : { x: b.x > a.x ? a.x + a.w : a.x, y: a.y + a.h / 2 };
      const p2 = vertical ? { x: b.x + b.w / 2, y: b.y > a.y ? b.y : b.y + b.h } : { x: b.x > a.x ? b.x : b.x + b.w, y: b.y + b.h / 2 };
      const mid = vertical ? `C ${p1.x} ${(p1.y + p2.y) / 2}, ${p2.x} ${(p1.y + p2.y) / 2},` : `C ${(p1.x + p2.x) / 2} ${p1.y}, ${(p1.x + p2.x) / 2} ${p2.y},`;
      const path = document.createElementNS(svg.namespaceURI, 'path');
      path.setAttribute('class', 'ml-edge');
      path.setAttribute('d', `M ${p1.x} ${p1.y} ${mid} ${p2.x} ${p2.y}`);
      path.dataset.id = `${e.from}->${e.to}`;
      if (e.layer) path.dataset.layer = e.layer;
      svg.append(path);
      e.path = path;
      if (e.label) {
        const m = path.getPointAtLength(path.getTotalLength() / 2);
        const t = document.createElementNS(svg.namespaceURI, 'text');
        t.setAttribute('class', 'ml-edge-label');
        t.setAttribute('x', m.x); t.setAttribute('y', m.y - 9);
        t.textContent = e.label; this._labels.append(t);
        // A short horizontal hop leaves less gap than the label needs, and the
        // label would sit right on top of the node's own text. Drop it clear
        // of both boxes instead of letting them collide.
        if (!vertical) {
          const gap = Math.abs(p2.x - p1.x);
          if (t.getComputedTextLength() > gap - 10) t.setAttribute('y', Math.max(a.y + a.h, b.y + b.h) + 17);
        }
        const bounds = t.getBBox(), bg = document.createElementNS(svg.namespaceURI, 'rect');
        bg.setAttribute('class', 'ml-edge-label-bg'); bg.setAttribute('rx', '6');
        bg.setAttribute('x', bounds.x - 7); bg.setAttribute('y', bounds.y - 4);
        bg.setAttribute('width', bounds.width + 14); bg.setAttribute('height', bounds.height + 8);
        this._labels.insertBefore(bg, t);
      }
    });
  }
  /* Send a packet along an edge — Flow explains activity, not just structure. */
  play(from, to) {
    const e = this._edges?.find(x => x.from === from && x.to === to); if (!e?.path) return;
    e.path.dataset.on = '';
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = document.createElementNS(this._svg.namespaceURI, 'circle');
    c.setAttribute('class', 'ml-packet'); c.setAttribute('r', '4'); this._svg.append(c);
    const len = e.path.getTotalLength(); const t0 = performance.now(); const dur = 800;
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur); const p = e.path.getPointAtLength(len * k);
      c.setAttribute('cx', p.x); c.setAttribute('cy', p.y);
      k < 1 ? requestAnimationFrame(tick) : c.remove();
    };
    requestAnimationFrame(tick);
  }
  setStep(i) { const e = this._edges?.[i]; if (e) this.play(e.from, e.to); }
}
def('l-flow', Flow);

/* ══ Trace ════════════════════════════════════════════════════════ */
class Trace extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    this.steps = $$(':scope > l-tstep', this);
    const list = el('div', 'ml-trace-list');
    this.detail = el('div', 'ml-trace-detail');
    this.steps.forEach((s, i) => {
      s.tabIndex = 0; s.setAttribute('role', 'button');
      s.onclick = () => this.setStep(i);
      s.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.setStep(i); } };
      list.append(s);
    });
    this.append(list, this.detail);
    this.setStep(this.hasAttribute('start') ? +this.getAttribute('start') : 0);
  }
  setStep(i) {
    if (!this.steps?.length) return;
    this.i = Math.max(0, Math.min(this.steps.length - 1, i));
    this.steps.forEach((s, k) => { s.toggleAttribute('data-active', k === this.i); s.toggleAttribute('data-past', k < this.i); });
    const s = this.steps[this.i];
    this.detail.textContent = s.getAttribute('detail') || '';
    const st = stageFor(this, this.getAttribute('stage'));
    if (st && st !== this.closest('l-stage')) st.apply(readFx(s)); else this.closest('l-stage')?.apply(readFx(s));
    emit(this, 'trace:step', { index: this.i });
  }
}
def('l-trace', Trace);

/* ══ State ════════════════════════════════════════════════════════ */
class StateBox extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    const name = this.getAttribute('name');
    if (name) this.prepend(el('div', 'ml-state-head', name));
    $$(':scope > l-field', this).forEach(f => {
      const k = f.getAttribute('key'), v = f.getAttribute('value') ?? f.textContent.trim();
      f.innerHTML = `<span class="ml-k">${k}</span><span class="ml-v">${v}</span>`;
    });
  }
  set(obj) {
    Object.entries(obj || {}).forEach(([k, v]) => {
      const f = this.querySelector(`l-field[key="${CSS.escape(k)}"]`); if (!f) return;
      const cur = f.querySelector('.ml-v'); if (cur.textContent === String(v)) return;
      cur.textContent = v; f.removeAttribute('data-changed'); void f.offsetWidth; f.setAttribute('data-changed', '');
    });
  }
}
def('l-state', StateBox);

/* ══ WhatIf ═══════════════════════════════════════════════════════
   Variables in, expressions out. The model is deliberately naive —
   the point is letting the reader feel a causal relationship, not
   simulating the system faithfully. */
const SAFE_MATH = new Set(['abs','ceil','floor','max','min','pow','round','sqrt']);
function safeExpression(expr, names) {
  if (!expr || expr.length > 500 || !/^[\w\s.+\-*/%(),<>=!&|?:]+$/.test(expr)) return false;
  const props = [...expr.matchAll(/\.\s*([A-Za-z_]\w*)/g)].map(m => m[1]);
  if (props.some(p => !SAFE_MATH.has(p))) return false;
  const bare = expr.replace(/\.\s*\w+/g, '');
  const allowed = new Set([...names, 'Math', 'true', 'false', 'null']);
  const words = bare.match(/[A-Za-z_]\w*/g) || [];
  return words.every(w => allowed.has(w)) && (!words.includes('Math') || /\bMath\s*\./.test(expr));
}
function evaluateExpression(expr, values) {
  const tokenRe = /\s*(?:(\d+(?:\.\d+)?)|([A-Za-z_]\w*)|(===|!==|==|!=|<=|>=|&&|\|\||\*\*|[()+\-*/%,.?:<>!]))/gy;
  const tokens = [];
  let pos = 0, match;
  while (pos < expr.length) {
    tokenRe.lastIndex = pos; match = tokenRe.exec(expr);
    if (!match) throw new Error('Invalid expression');
    tokens.push(match[1] !== undefined ? ['number', +match[1]] : match[2] !== undefined ? ['name', match[2]] : ['op', match[3]]);
    pos = tokenRe.lastIndex;
  }
  let i = 0;
  const peek = value => tokens[i]?.[1] === value;
  const take = value => { if (!peek(value)) throw new Error(`Expected ${value}`); return tokens[i++]; };
  const primary = () => {
    const token = tokens[i++];
    if (!token) throw new Error('Unexpected end of expression');
    if (token[0] === 'number') return token[1];
    if (token[1] === '(') { const value = conditional(); take(')'); return value; }
    if (token[0] !== 'name') throw new Error('Expected a value');
    if (token[1] === 'true') return true;
    if (token[1] === 'false') return false;
    if (token[1] === 'null') return null;
    if (token[1] === 'Math') {
      take('.'); const method = tokens[i++];
      if (method?.[0] !== 'name' || !SAFE_MATH.has(method[1])) throw new Error('Unsafe Math helper');
      take('('); const args = [];
      if (!peek(')')) { do { args.push(conditional()); } while (peek(',') && take(',')); }
      take(')'); return Math[method[1]](...args);
    }
    if (!(token[1] in values)) throw new Error(`Unknown variable ${token[1]}`);
    return values[token[1]];
  };
  const unary = () => peek('!') ? (take('!'), !unary()) : peek('-') ? (take('-'), -unary()) : peek('+') ? (take('+'), +unary()) : primary();
  const power = () => { let left = unary(); if (peek('**')) { take('**'); left **= power(); } return left; };
  const chain = (next, ops) => () => {
    let left = next();
    while (ops.includes(tokens[i]?.[1])) {
      const op = tokens[i++][1], right = next();
      left = op === '*' ? left * right : op === '/' ? left / right : op === '%' ? left % right
        : op === '+' ? left + right : op === '-' ? left - right
        : op === '<' ? left < right : op === '<=' ? left <= right : op === '>' ? left > right : op === '>=' ? left >= right
        : op === '==' ? left == right : op === '!=' ? left != right : op === '===' ? left === right : left !== right;
    }
    return left;
  };
  const multiply = chain(power, ['*','/','%']);
  const add = chain(multiply, ['+','-']);
  const compare = chain(add, ['<','<=','>','>=']);
  const equal = chain(compare, ['==','!=','===','!==']);
  const and = () => { let left = equal(); while (peek('&&')) { take('&&'); const right = equal(); left = left && right; } return left; };
  const or = () => { let left = and(); while (peek('||')) { take('||'); const right = and(); left = left || right; } return left; };
  function conditional() { const test = or(); if (!peek('?')) return test; take('?'); const yes = conditional(); take(':'); const no = conditional(); return test ? yes : no; }
  const result = conditional();
  if (i !== tokens.length) throw new Error('Unexpected token');
  return result;
}
class WhatIf extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    if (this.hasAttribute('inline')) return this.inline();
    const vars = $$(':scope > l-var', this), outs = $$(':scope > l-out', this);
    const left = el('div'), right = el('div', 'ml-outs');
    this.vals = {};
    vars.forEach(v => {
      const name = v.getAttribute('name'), label = v.getAttribute('label') || name;
      const type = v.getAttribute('type') || 'range';
      const top = el('div', 'ml-var-top');
      const read = el('span', 'ml-var-val');
      top.append(el('span', null, label), read);
      let input;
      if (type === 'range') {
        input = el('input'); input.type = 'range';
        input.min = v.getAttribute('min') || 0; input.max = v.getAttribute('max') || 100;
        input.step = v.getAttribute('step') || 1; input.value = v.getAttribute('value') || input.min;
        this.vals[name] = +input.value;
        input.oninput = () => { this.vals[name] = +input.value; read.textContent = input.value + (v.getAttribute('unit') || ''); this.recalc(); };
        read.textContent = input.value + (v.getAttribute('unit') || '');
      } else if (type === 'toggle') {
        input = el('input'); input.type = 'checkbox'; input.checked = v.hasAttribute('value');
        this.vals[name] = input.checked;
        input.onchange = () => { this.vals[name] = input.checked; read.textContent = input.checked ? 'on' : 'off'; this.recalc(); };
        read.textContent = input.checked ? 'on' : 'off';
      } else {
        input = el('select');
        ids(v.getAttribute('options')).forEach(o => { const op = el('option', null, o); op.value = o; input.append(op); });
        this.vals[name] = input.value; read.textContent = '';
        input.onchange = () => { this.vals[name] = input.value; this.recalc(); };
      }
      v.innerHTML = ''; v.append(top, input); left.append(v);
    });
    outs.forEach(o => {
      o.innerHTML = `<span>${o.getAttribute('label') || o.getAttribute('name')}</span><span class="ml-out-v">—</span>`;
      right.append(o);
    });
    this.append(left, right);
    this.outs = outs; this.recalc();
  }
  /* Reactive-document form: vars and outs live inside the prose itself, so the
     sentence the reader is reading is the same thing they are manipulating. */
  inline() {
    this.vals = {};
    this.outs = $$('l-out', this);
    $$('l-var', this).forEach(v => {
      const name = v.getAttribute('name');
      const min = +(v.getAttribute('min') ?? 0), max = +(v.getAttribute('max') ?? 100);
      const step = +(v.getAttribute('step') || 1), unit = v.getAttribute('unit') || '';
      let val = +(v.getAttribute('value') ?? min);
      this.vals[name] = val;
      v.textContent = val + unit;
      v.tabIndex = 0; v.setAttribute('role', 'slider'); v.setAttribute('aria-label', v.getAttribute('label') || name);
      v.setAttribute('aria-valuemin', min); v.setAttribute('aria-valuemax', max);
      const set = n => {
        val = Math.max(min, Math.min(max, Math.round(n / step) * step));
        val = Math.round(val * 1e6) / 1e6;
        this.vals[name] = val; v.textContent = val + unit;
        v.setAttribute('aria-valuenow', val);
        this.recalc(); Game.explore('tangle');
      };
      let dragging = false, x0 = 0, v0 = 0;
      v.addEventListener('pointerdown', e => { dragging = true; x0 = e.clientX; v0 = val; v.setPointerCapture(e.pointerId); e.preventDefault(); });
      v.addEventListener('pointermove', e => { if (dragging) set(v0 + (e.clientX - x0) / 3 * step); });
      v.addEventListener('pointerup', e => { dragging = false; v.releasePointerCapture(e.pointerId); });
      v.addEventListener('keydown', e => {
        const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
        if (d) { e.preventDefault(); set(val + d * step * (e.shiftKey ? 10 : 1)); }
      });
    });
    this.recalc();
  }
  recalc() {
    const keys = Object.keys(this.vals), vals = keys.map(k => this.vals[k]);
    this.outs.forEach(o => {
      const expr = o.getAttribute('expr'); if (!expr) return;
      let v;
      try {
        if (!safeExpression(expr, keys)) throw new Error('Unsafe expression');
        v = evaluateExpression(expr, Object.fromEntries(keys.map((key, i) => [key, vals[i]])));
      }
      catch { v = '—'; }
      if (typeof v === 'number') v = Math.round(v * 100) / 100;
      const slot = o.querySelector('.ml-out-v');
      if (slot) slot.textContent = v + (o.getAttribute('unit') || '');
      else o.textContent = v + (o.getAttribute('unit') || '');
      const good = o.getAttribute('good');
      if (good) o.dataset.tone = (good === 'low' ? v <= +o.getAttribute('threshold') : v >= +o.getAttribute('threshold')) ? 'good' : 'bad';
    });
    emit(this, 'whatif:change', this.vals);
    if (this._touched) Game.explore('whatif'); this._touched = true;
  }
}
def('l-whatif', WhatIf);

/* ══ Sandbox ══════════════════════════════════════════════════════
   Learner code runs in a sandboxed iframe with no same-origin access,
   so nothing they paste can touch the lesson or its stored progress. */
class Sandbox extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    const src = (this.textContent || '').replace(/^\n/, '').replace(/\s+$/, '');
    this.innerHTML = '';
    const ta = el('textarea'); ta.value = src; ta.spellcheck = false;
    ta.rows = Math.min(20, Math.max(4, src.split('\n').length + 1));
    const bar = el('div', 'ml-sb-bar');
    const run = el('button', 'ml-btn ml-btn-primary', this.getAttribute('run-label') || T.run);
    const reset = el('button', 'ml-btn', T.reset);
    run.type = reset.type = 'button';
    const out = el('pre', 'ml-sb-out'); out.textContent = '';
    bar.append(run, reset);
    this.append(ta, bar, out);
    reset.onclick = () => { ta.value = src; out.textContent = ''; };
    run.onclick = () => {
      out.textContent = ''; Game.explore('sandbox');
      const frame = el('iframe');
      frame.setAttribute('sandbox', 'allow-scripts');
      frame.style.display = 'none';
      const bytes = new TextEncoder().encode(ta.value);
      let binary = ''; bytes.forEach(byte => { binary += String.fromCharCode(byte); });
      const encoded = btoa(binary);
      frame.srcdoc = `<script>
        const send=(k,a)=>parent.postMessage({k,a:a.map(x=>{try{return typeof x==='object'?JSON.stringify(x):String(x)}catch{return String(x)}})},'*');
        console.log=(...a)=>send('log',a); console.error=(...a)=>send('err',a); console.warn=(...a)=>send('log',a);
        addEventListener('error',e=>send('err',[e.message]));
        const raw=atob('${encoded}'), bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
        const runner=document.createElement('script');
        runner.textContent='try{\\n'+new TextDecoder().decode(bytes)+'\\n}catch(e){send("err",[e.message])}\\nsend("done",[])';
        document.documentElement.append(runner);
      <\/script>`;
      const onMsg = e => {
        if (e.source !== frame.contentWindow) return;
        const { k, a } = e.data || {};
        if (k === 'done') { removeEventListener('message', onMsg); setTimeout(() => frame.remove(), 100); return; }
        const line = el('div', k === 'err' ? 'ml-err' : null, a.join(' '));
        out.append(line);
      };
      addEventListener('message', onMsg);
      document.body.append(frame);
      setTimeout(() => { removeEventListener('message', onMsg); frame.remove(); }, 4000);
    };
  }
}
def('l-sandbox', Sandbox);

/* ══ Lab ══════════════════════════════════════════════════════════
   Author-written variants run in a disposable Worker. They cannot touch the
   lesson DOM, and a hard timeout stops accidental infinite loops. */
class LabRun extends HTMLElement {
  connectedCallback() { this._code = (this.textContent || '').replace(/^\n/, '').replace(/\s+$/, ''); }
  get code() { return this._code ?? ''; }
}
class Lab extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    // Capture label + code BEFORE clearing: define order means l-run may not
    // be upgraded yet, and innerHTML='' would drop the children for good.
    const runs = $$('l-run', this).map((r, i) => ({
      label: r.getAttribute('label') || `${T.run} ${i + 1}`,
      runLabel: r.getAttribute('run-label'),
      code: (r.textContent || '').replace(/^\n/, '').replace(/\s+$/, '')
    }));
    if (!runs.length) return;
    this.innerHTML = '';
    const out = el('pre', 'ml-lab-out'); out.textContent = T.labIdle;
    runs.forEach((r, i) => {
      const wrap = el('div', 'ml-lab-variant');
      const head = el('div', 'ml-lab-head');
      const codeEl = el('pre', 'ml-lab-code');
      const codeTag = el('code', 'lang-js'); codeTag.textContent = r.code;
      codeEl.append(codeTag);
      const btn = el('button', 'ml-btn ml-btn-primary ml-lab-btn', r.runLabel || T.run);
      btn.type = 'button';
      head.append(el('span', 'ml-lab-label', r.label), btn);
      wrap.append(head, codeEl);
      this.append(wrap);
      btn.onclick = () => {
        Game.explore('lab');
        out.textContent = '';
        out.append(el('div', 'ml-lab-mark', '▸ ' + r.label));
        const workerCode = `
          const fmt=x=>{try{return typeof x==='object'?JSON.stringify(x):String(x)}catch{return String(x)}};
          const send=(kind,args=[])=>postMessage({kind,text:args.map(fmt).join(' ')});
          console.log=(...a)=>send('log',a); console.warn=(...a)=>send('warn',a); console.error=(...a)=>send('error',a);
          (async()=>{try{\n${r.code}\n}catch(error){send('error',[error?.message||error])}finally{send('done')}})();`;
        const url = URL.createObjectURL(new Blob([workerCode], { type: 'text/javascript' }));
        const worker = new Worker(url);
        const finish = () => { worker.terminate(); URL.revokeObjectURL(url); };
        const timer = setTimeout(() => { out.append(el('div', 'ml-err', T.labTimeout || 'Stopped after 2 seconds.')); finish(); }, 2000);
        worker.onmessage = e => {
          const { kind, text } = e.data || {};
          if (kind === 'done') { clearTimeout(timer); finish(); return; }
          out.append(el('div', kind === 'error' ? 'ml-err' : kind === 'warn' ? 'ml-warn' : null, text));
        };
        worker.onerror = e => { clearTimeout(timer); out.append(el('div', 'ml-err', e.message)); finish(); };
      };
    });
    this.append(out);
    paintCode(this);
  }
}
def('l-lab', Lab); def('l-run', LabRun);

/* ══ Contrast ═════════════════════════════════════════════════════
   expected → actual → why. Useful after a quiz, but also after a
   simulation, a benchmark or a design decision. */
class Contrast extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    this.render(
      this.getAttribute('expected') ?? this.querySelector('l-expected')?.innerHTML ?? '—',
      this.getAttribute('actual') ?? this.querySelector('l-actual')?.innerHTML ?? '—',
      this.querySelector('l-why')?.innerHTML ?? this.getAttribute('why') ?? ''
    );
  }
  render(expected, actual, why) {
    const labels = [this.getAttribute('expected-label') || T.expected, this.getAttribute('actual-label') || T.actualLabel];
    this.innerHTML =
      `<div class="ml-c-cell" data-tone="expected"><div class="ml-c-label">${labels[0]}</div><div>${expected}</div></div>` +
      `<div class="ml-c-cell" data-tone="actual"><div class="ml-c-label">${labels[1]}</div><div>${actual}</div></div>` +
      (why ? `<div class="ml-c-why"><div class="ml-c-label">${T.gap}</div><div>${why}</div></div>` : '');
  }
}
def('l-contrast', Contrast);

/* ══ Checkpoint ═══════════════════════════════════════════════════ */
class Checkpoint extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    const items = $$(':scope > l-can', this);
    if (!this.querySelector('h3')) this.prepend(el('h3', null, this.getAttribute('title') || T.checkpointTitle));
    const meter = el('div', 'ml-check-meter');
    const upd = () => { const n = items.filter(i => i.hasAttribute('data-done')).length; meter.textContent = T.confirmed(n, items.length); };
    items.forEach(i => {
      i.tabIndex = 0; i.setAttribute('role', 'checkbox'); i.setAttribute('aria-checked', 'false');
      const flip = () => { i.toggleAttribute('data-done'); i.setAttribute('aria-checked', i.hasAttribute('data-done')); Game.can(i.hasAttribute('data-done')); upd(); };
      i.onclick = flip;
      i.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } };
    });
    this.append(meter); upd();
  }
}
def('l-checkpoint', Checkpoint);

/* ══ Branch ═══════════════════════════════════════════════════════ */
class Branch extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    const paths = $$(':scope > l-path', this);
    const q = this.getAttribute('question');
    if (q) this.prepend(el('div', 'ml-branch-q', q));
    const row = el('div', 'ml-branch-choices');
    paths.forEach(p => {
      const b = el('button', 'ml-btn', p.getAttribute('label') || p.getAttribute('name'));
      b.type = 'button';
      b.onclick = () => {
        paths.forEach(x => x.removeAttribute('data-active'));
        $$('.ml-btn', row).forEach(x => x.classList.remove('ml-btn-primary'));
        p.setAttribute('data-active', ''); b.classList.add('ml-btn-primary');
        emit(this, 'branch:pick', { name: p.getAttribute('name') });
      };
      row.append(b);
    });
    const qEl = this.querySelector('.ml-branch-q');
    qEl ? qEl.after(row) : this.prepend(row);
    if (this.getAttribute('rejoin')) this.append(el('div', 'ml-rejoin', this.getAttribute('rejoin')));
  }
}
def('l-branch', Branch);

/* ══ Quiz ═════════════════════════════════════════════════════════
   One shell — situation → action → evaluation → feedback — and a
   swappable interaction widget. The mode changes what the learner
   does, never the surrounding structure. */
const KIND_LABEL = T.kind;

class Quiz extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    const mode = this.mode = this.getAttribute('mode') || 'choose';
    if (!this.id) this.id = 'ml-q' + (++Quiz.n);

    const promptEl = this.querySelector('l-prompt');
    const situation = this.querySelector('l-situation');
    this.whyEl = this.querySelector('l-why');
    this.actualEl = this.querySelector('l-actual');

    const head = el('div');
    head.append(el('div', 'ml-quiz-kind', this.getAttribute('kind-label') || KIND_LABEL[mode] || T.check));
    if (promptEl) { const p = el('div', 'ml-quiz-prompt'); p.innerHTML = promptEl.innerHTML; promptEl.replaceWith(p); head.append(p); }
    this.prepend(head);

    this.body = el('div', 'ml-quiz-body');
    if (situation) { situation.after(this.body); } else { this.append(this.body); }

    // Build the interaction widget for this mode.
    this.widget = (WIDGETS[mode] || WIDGETS.choose)(this);

    this.actions = el('div', 'ml-quiz-actions');
    this.submit = el('button', 'ml-btn ml-btn-primary', this.getAttribute('submit-label') || T.check);
    this.submit.type = 'button'; this.submit.disabled = !this._ready;
    this.submit.onclick = () => this.check();
    this.actions.append(this.submit);
    this.append(this.actions);

    if (this.hasAttribute('confidence')) this.addConfidence();
    this.feedback = el('div', 'ml-feedback'); this.feedback.hidden = true;
    this.append(this.feedback);
    if (this.actualEl) this.actualEl.hidden = true;
    $$('l-miss', this).forEach(m => m.hidden = true);
    if (this.whyEl) this.whyEl.hidden = true;
  }

  ready(ok = true) { this._ready = ok; if (this.submit) this.submit.disabled = !ok; }

  addConfidence() {
    const box = el('div', 'ml-conf');
    box.append(el('div', 'ml-conf-label', T.confQ));
    const r = el('input'); r.type = 'range'; r.min = 0; r.max = 100; r.value = 50; r.step = 1;
    const ends = el('div', 'ml-conf-ends');
    ends.append(el('span', null, T.confLow), el('span', null, T.confHigh));
    box.append(r, ends); this.actions.before(box); this._conf = r;
  }

  /* Evaluation is delegated to the widget; the shell only decides how
     to narrate the result, which is the part that must feel consistent. */
  check() {
    if (this.hasAttribute('data-answered')) return;
    const res = this.widget.evaluate();
    this.setAttribute('data-answered', '');
    this.submit.disabled = true; this.submit.textContent = T.checked;

    const v = el('div', 'ml-verdict');
    v.dataset.v = res.verdict;
    v.textContent = T.verdict[res.verdict];
    this.feedback.append(v);

    // Prediction/debug: show the gap explicitly rather than a bare right/wrong.
    if (this.actualEl || res.contrast) {
      const c = document.createElement('l-contrast');
      this.feedback.append(c);
      c.render(res.said ?? '—', this.actualEl?.innerHTML ?? res.contrast?.actual ?? '—', '');
      this.actualEl && (this.actualEl.hidden = true);
    }
    if (res.extra) this.feedback.append(res.extra);

    // A misconception note beats a generic "wrong": it names the model the learner is running.
    const miss = res.picked != null ? this.querySelector(`l-miss[for="${CSS.escape(String(res.picked))}"]`) : null;
    if (miss && res.verdict !== 'right') { const m = el('div', 'ml-misconception'); m.innerHTML = miss.innerHTML; this.feedback.append(m); }
    $$('l-miss', this).forEach(m => m.hidden = true);

    if (this.whyEl) { this.whyEl.hidden = false; const w = el('div'); w.innerHTML = this.whyEl.innerHTML; this.feedback.append(w); this.whyEl.remove(); }

    if (this._conf) {
      const c = +this._conf.value, right = res.verdict === 'right';
      const note = !right && c >= 70
        ? T.confWrongSure
        : right && c <= 30 ? T.confRightUnsure : null;
      if (note) { const n = el('div', 'ml-misconception'); n.textContent = note; this.feedback.append(n); }
      this._conf.disabled = true;
    }

    this.feedback.hidden = false;
    const conf = this._conf ? +this._conf.value : null;
    Game.quiz(this, res, conf);
    emit(this, 'quiz:answered', { id: this.id, verdict: res.verdict, confidence: conf });
  }
}
Quiz.n = 0;

/* ── widgets ─────────────────────────────────────────────────────
   Each returns { evaluate() -> {verdict, picked?, said?, extra?} }. */
const WIDGETS = {};

/* choose · prediction · diagnose · estimate-with-options · counterexample-with-options */
WIDGETS.choose = q => {
  const opts = $$('l-option', q);
  const letters = 'ABCDEFGH';
  const answers = new Set(ids(q.getAttribute('answer')).map(norm));
  const multi = answers.size > 1;
  const picked = new Set();
  opts.forEach((o, i) => {
    const val = norm(o.getAttribute('value') || letters[i]);
    o.dataset.letter = letters[i];
    o.tabIndex = 0; o.setAttribute('role', multi ? 'checkbox' : 'radio');
    const pick = () => {
      if (q.hasAttribute('data-answered')) return;
      if (!multi) { opts.forEach(x => x.removeAttribute('data-picked')); picked.clear(); }
      o.toggleAttribute('data-picked');
      o.hasAttribute('data-picked') ? picked.add(val) : picked.delete(val);
      q.ready(picked.size > 0);
    };
    o.onclick = pick;
    o.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } };
    q.body.append(o);
  });
  return {
    evaluate() {
      opts.forEach((o, i) => {
        const val = norm(o.getAttribute('value') || letters[i]);
        if (answers.has(val)) o.setAttribute('data-correct', '');
        else if (picked.has(val)) o.setAttribute('data-wrong', '');
      });
      const hit = [...picked].filter(p => answers.has(p)).length;
      const verdict = hit === answers.size && picked.size === answers.size ? 'right' : hit ? 'partial' : 'wrong';
      const said = opts.filter(o => o.hasAttribute('data-picked')).map(o => o.textContent.trim()).join(', ');
      return { verdict, picked: [...picked][0], said };
    }
  };
};

/* spot — click the region where the concept lives */
WIDGETS.spot = q => {
  const regions = $$('l-region', q);
  const answers = new Set(ids(q.getAttribute('answer')));
  const picked = new Set();
  regions.forEach(r => {
    r.tabIndex = 0; r.setAttribute('role', 'button');
    const pick = () => {
      if (q.hasAttribute('data-answered')) return;
      r.toggleAttribute('data-picked');
      r.hasAttribute('data-picked') ? picked.add(r.id) : picked.delete(r.id);
      q.ready(picked.size > 0);
    };
    r.onclick = pick;
    r.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } };
  });
  return {
    evaluate() {
      regions.forEach(r => {
        if (answers.has(r.id)) r.setAttribute('data-correct', '');
        else if (picked.has(r.id)) r.setAttribute('data-wrong', '');
        r.removeAttribute('data-picked');
      });
      const hit = [...picked].filter(p => answers.has(p)).length;
      return {
        verdict: hit === answers.size && picked.size === answers.size ? 'right' : hit ? 'partial' : 'wrong',
        // Report the pick so <l-miss for="region-id"> fires. Only for a single
        // pick: several regions at once name no one misconception.
        picked: picked.size === 1 ? [...picked][0] : null,
      };
    }
  };
};

/* classify — click an item, then the bucket it belongs to.
   ponytail: click-to-place, not HTML5 drag-and-drop — touch and
   keyboard work for free and it is a third of the code. */
WIDGETS.classify = q => {
  const buckets = $$('l-bucket', q);
  const items = [];
  buckets.forEach(b => $$('l-item', b).forEach(i => { items.push({ label: i.textContent.trim(), home: b.getAttribute('name') }); i.remove(); }));
  const pool = el('div', 'ml-pool');
  const row = el('div', 'ml-buckets');
  let sel = null;
  const place = (tok, target) => { target.append(tok); q.ready(!$$('.ml-token', pool).length); };
  shuffle(items.slice()).forEach(it => {
    const tok = el('button', 'ml-token', it.label);
    tok.type = 'button'; tok.dataset.home = it.home;
    tok.onclick = () => {
      if (q.hasAttribute('data-answered')) return;
      const same = sel === tok;
      sel?.removeAttribute('data-sel');
      sel = same ? null : tok;
      if (sel) sel.setAttribute('data-sel', '');
      // Arm the destinations so it is obvious where the picked item can go.
      $$('.ml-bucket, .ml-pool', q).forEach(b => b.toggleAttribute('data-armed', !!sel));
    };
    pool.append(tok);
  });
  buckets.forEach(b => {
    const box = el('div', 'ml-bucket');
    box.dataset.name = b.getAttribute('name');
    box.append(el('div', 'ml-bucket-name', b.getAttribute('name')));
    box.onclick = () => {
      if (!sel || q.hasAttribute('data-answered')) return;
      sel.removeAttribute('data-sel'); place(sel, box); sel = null;
      $$('.ml-bucket, .ml-pool', q).forEach(b => b.removeAttribute('data-armed'));
    };
    row.append(box); b.remove();
  });
  pool.onclick = e => {
    if (e.target !== pool || !sel) return;
    sel.removeAttribute('data-sel'); place(sel, pool); sel = null;
    $$('.ml-bucket, .ml-pool', q).forEach(b => b.removeAttribute('data-armed'));
  };
  q.body.append(el('p', null, T.classifyHint), pool, row);
  q.body.querySelector('p').style.cssText = 'font-size:.85rem;color:var(--ml-muted);margin-bottom:.6rem';
  return {
    evaluate() {
      let ok = 0;
      $$('.ml-bucket', row).forEach(box => $$('.ml-token', box).forEach(t => {
        const good = t.dataset.home === box.dataset.name;
        t.setAttribute(good ? 'data-correct' : 'data-wrong', ''); if (good) ok++;
      }));
      return { verdict: ok === items.length ? 'right' : ok ? 'partial' : 'wrong' };
    }
  };
};

/* arrange — document order is the correct order; the runtime shuffles.
   Rows move by relocating the node, not by re-rendering the list: rebuilding
   the DOM on every click threw focus back to <body>, which made a second
   keyboard move impossible and lost your place with a mouse too. */
WIDGETS.arrange = q => {
  const items = $$('l-item', q).map(i => { const t = i.textContent.trim(); i.remove(); return t; });
  if (q.hasAttribute('low') || q.hasAttribute('high')) {
    const ends = el('div', 'ml-rank-ends');
    ends.append(el('span', null, q.getAttribute('low') || ''), el('span', null, q.getAttribute('high') || ''));
    q.body.append(ends);
  }
  const list = el('ol', 'ml-order');
  const order = () => [...list.children].map(li => li.dataset.label);

  const sync = () => [...list.children].forEach((li, i, all) => {
    li.setAttribute('aria-label', `${i + 1}/${all.length} — ${li.dataset.label}`);
    li.querySelector('[data-up]').disabled = i === 0;
    li.querySelector('[data-down]').disabled = i === all.length - 1;
  });

  const move = (li, dir) => {
    if (q.hasAttribute('data-answered')) return;
    const sib = dir < 0 ? li.previousElementSibling : li.nextElementSibling;
    if (!sib) return;
    dir < 0 ? list.insertBefore(li, sib) : list.insertBefore(sib, li);
    sync();
    // At the ends the button you just used becomes disabled, and focusing a
    // disabled button drops focus to <body> — so fall back to its sibling and
    // keep the focus on the row that moved.
    const used = li.querySelector(dir < 0 ? '[data-up]' : '[data-down]');
    (used.disabled ? li.querySelector(dir < 0 ? '[data-down]' : '[data-up]') : used).focus();
  };

  let start = shuffle(items.slice());
  if (items.length > 2 && start.join() === items.join()) start = shuffle(items.slice());
  start.forEach(t => {
    const li = el('li'); li.dataset.label = t;
    li.append(el('span', 'ml-order-label', t));
    const ctrl = el('span', 'ml-move-group');
    const up = el('button', 'ml-move', '↑'), down = el('button', 'ml-move', '↓');
    up.type = down.type = 'button';
    up.dataset.up = ''; down.dataset.down = '';
    up.setAttribute('aria-label', `${T.aUp} — ${t}`);
    down.setAttribute('aria-label', `${T.aDown} — ${t}`);
    up.onclick = () => move(li, -1);
    down.onclick = () => move(li, 1);
    ctrl.append(up, down); li.append(ctrl); list.append(li);
  });
  sync();
  q.body.append(list); q.ready(true);

  return {
    evaluate() {
      const cur = order();
      let ok = 0;
      [...list.children].forEach((li, i) => {
        const good = cur[i] === items[i];
        li.setAttribute(good ? 'data-correct' : 'data-wrong', ''); if (good) ok++;
        $$('button', li).forEach(b => b.disabled = true);
      });
      return { verdict: ok === items.length ? 'right' : ok >= items.length / 2 ? 'partial' : 'wrong' };
    }
  };
};

/* explain — free text checked against key ideas.
   Deliberately not graded strictly: the value is the learner producing
   an explanation and then seeing which pieces they left out. */
WIDGETS.free = q => {
  const keys = $$('l-key', q).map(k => { const o = { match: k.getAttribute('match'), text: k.textContent.trim(), node: k }; k.remove(); return o; });
  const ref = q.querySelector('l-reference');
  const ta = el('textarea', 'ml-free');
  ta.placeholder = q.getAttribute('placeholder') || 'In your own words…';
  ta.oninput = () => q.ready(ta.value.trim().length > 10);
  q.body.append(ta);
  return {
    evaluate() {
      ta.disabled = true;
      const said = ta.value;
      const hits = keys.map(k => ({ ...k, hit: k.match ? new RegExp(k.match, 'i').test(said) : false }));
      const extra = el('div');
      if (keys.length) {
        extra.append(el('div', 'ml-c-label', T.keyIdeas));
        const ul = el('ul', 'ml-keys');
        hits.forEach(h => { const li = el('li'); if (h.hit) li.setAttribute('data-hit', ''); li.append(el('span', null, h.text)); ul.append(li); });
        extra.append(ul);
      }
      if (ref) { const r = el('div'); r.style.marginTop = '.8rem'; r.innerHTML = `<div class="ml-c-label">${T.reference}</div>${ref.innerHTML}`; ref.remove(); extra.append(r); }
      const n = hits.filter(h => h.hit).length;
      return { verdict: !keys.length ? 'open' : n === keys.length ? 'right' : n ? 'partial' : 'open', said, extra };
    }
  };
};
WIDGETS.explain = WIDGETS.free;

/* estimate — slider against a real value, or buckets if options exist */
WIDGETS.estimate = q => {
  if ($$('l-option', q).length) return WIDGETS.choose(q);
  const min = +(q.getAttribute('min') || 0), max = +(q.getAttribute('max') || 100);
  const unit = q.getAttribute('unit') || '', actual = +q.getAttribute('actual');
  const tol = +(q.getAttribute('tolerance') || 0.25);
  const box = el('div', 'ml-est');
  const r = el('input'); r.type = 'range'; r.min = min; r.max = max; r.step = q.getAttribute('step') || 1; r.value = (min + max) / 2;
  const read = el('div', 'ml-est-read');
  const val = el('span'); const upd = () => val.textContent = (+r.value).toLocaleString() + unit;
  read.append(el('span', null, min.toLocaleString() + unit), val, el('span', null, max.toLocaleString() + unit));
  read.style.cssText += ';justify-content:space-between';
  r.oninput = upd; upd(); q.ready(true);
  box.append(r, read); q.body.append(box);
  return {
    evaluate() {
      r.disabled = true;
      const you = +r.value, off = Math.abs(you - actual) / (actual || 1);
      const bar = el('div', 'ml-est-bar');
      const pct = v => `${Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100))}%`;
      const yi = el('i'); yi.dataset.you = ''; yi.style.left = pct(you); yi.append(el('span', null, T.you));
      const ri = el('i'); ri.dataset.real = ''; ri.style.left = pct(actual); ri.append(el('span', null, T.actual));
      bar.append(yi, ri);
      const extra = el('div');
      extra.append(bar, el('p', null, T.estimateLine(you.toLocaleString(), actual.toLocaleString(), unit)));
      extra.querySelector('p').style.cssText = 'font-family:var(--ml-mono);font-size:.85rem;margin-top:1.2rem';
      return { verdict: off <= tol ? 'right' : off <= tol * 2 ? 'partial' : 'wrong', extra, said: you + unit };
    }
  };
};

/* prediction — a choose (or free) that always ends in a contrast */
WIDGETS.prediction = q => ($$('l-option', q).length ? WIDGETS.choose(q) : WIDGETS.free(q));


def('l-quiz', Quiz);   // defined last: upgrading a quiz needs the widget table above

/* ══ Finish ═══════════════════════════════════════════════════════
   The ending is not a scoreboard, it is the last teaching move: what
   you now know, what your confidence pattern says about it, and the
   exact checks worth revisiting. Points are the smallest thing on it. */
class Finish extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    this._next = this.querySelector('l-next')?.innerHTML || '';
    this.querySelector('l-next')?.remove();
    this._title = this.getAttribute('title') || T.finishTitle;
    this.render();
  }
  render() {
    const g = Game, total = g.quizTotal || 1;
    const pct = Math.round((g.right / total) * 100);
    const done = g.answered >= g.quizTotal && g.quizTotal > 0;
    const C = 2 * Math.PI * 42;
    const ring = `<svg viewBox="0 0 100 100" class="ml-ring" aria-hidden="true">
      <circle cx="50" cy="50" r="42" class="ml-ring-bg"/>
      <circle cx="50" cy="50" r="42" class="ml-ring-fg"
        stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - g.right / total)}"/>
      <text x="50" y="50" class="ml-ring-n">${pct}%</text>
      <text x="50" y="64" class="ml-ring-l">${T.correct}</text></svg>`;

    const stat = (n, l) => `<div class="ml-stat"><b>${n}</b><span>${l}</span></div>`;
    const badges = [...g.badges].map(b =>
      `<div class="ml-badge"><b>★ ${BADGES[b][0]}</b><span>${BADGES[b][1]}</span></div>`).join('') ||
      `<p class="ml-empty">${T.badgesEmpty}</p>`;

    // The most useful line on the page: confident and wrong means a belief to fix.
    let read = '';
    if (!done) read = T.readPartial(g.answered, g.quizTotal);
    else if (g.overconfident) read = T.readSure(g.overconfident);
    else if (g.calibrated >= 3) read = T.readCalibrated;
    else read = T.readDone;

    const revisit = g.revisit.length
      ? `<div class="ml-revisit"><div class="ml-c-label">${T.revisit}</div><ul>${g.revisit.map(r =>
          `<li><a href="#${r.id}">${r.text}</a></li>`).join('')}</ul></div>`
      : (done ? `<div class="ml-revisit"><div class="ml-c-label">${T.revisit}</div><p class="ml-empty">${T.revisitNone}</p></div>` : '');

    this.innerHTML = `
      <div class="ml-finish-head">
        <div>
          <p class="ml-eyebrow">${T.finishEyebrow}</p>
          <h2>${this._title}</h2>
          ${read}
        </div>
        ${ring}
      </div>
      <div class="ml-stats">
        ${stat(g.points.toLocaleString(), T.points)}
        ${stat(`${g.right}/${g.quizTotal}`, T.checksCorrect)}
        ${stat(g.best, T.bestStreak)}
        ${stat(`${g.checks}/${g.canTotal || 0}`, T.checkpoints)}
      </div>
      <div class="ml-badges">${badges}</div>
      ${revisit}
      ${this._next ? `<div class="ml-next"><div class="ml-c-label">${T.nextUp}</div>${this._next}</div>` : ''}
      <div class="ml-finish-actions">
        <button class="ml-btn" type="button" data-top>${T.toTop}</button>
        <button class="ml-btn" type="button" data-again>${T.again}</button>
      </div>`;
    this.querySelector('[data-top]').onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
    this.querySelector('[data-again]').onclick = () => location.reload();
  }
}
def('l-finish', Finish);

paintCode();
document.addEventListener('DOMContentLoaded', () => paintCode());
document.addEventListener('quiz:answered', e => paintCode(e.target));
document.addEventListener('reveal:open', e => paintCode(e.target));

/* ══ progress rail ════════════════════════════════════════════════
   Owns its own scroll listener. It used to be written from inside
   ScrollStory, which quietly made <scroll-story> mandatory: a lesson
   without one had a rail stuck at 0% forever. */
if (!document.querySelector('.ml-progress')) {
  const p = el('div', 'ml-progress'), i = el('i'); p.append(i);
  const paint = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    i.style.width = (h > 0 ? Math.min(1, scrollY / h) * 100 : 0) + '%';
  };
  const mount = () => { document.body.prepend(p); paint(); };
  addEventListener('scroll', paint, { passive: true });
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
}
})();
