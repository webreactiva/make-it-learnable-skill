/* lesson-core — the logic every lesson shares, with no DOM and no styling.
   Inline it into the lesson's script unchanged. It decides nothing about how
   the page looks or how it is built; the lesson's own code calls it and
   renders the results however it likes.

     LessonCore.evaluate(expr, values)   → number | boolean | null; throws if unsafe
     LessonCore.createScore({ key, checks, statements, onAward, onBadge, onChange })
     LessonCore.guard(name, fn)          → runs fn; on error logs it and returns undefined
*/
(function () {
  'use strict';

  /* ── WhatIf expressions ───────────────────────────────────────────
     A small parser instead of eval: the security policy forbids eval, and an
     expression must not be able to reach anything but its own variables. */
  const SAFE_MATH = new Set(['abs', 'ceil', 'floor', 'max', 'min', 'pow', 'round', 'sqrt', 'sin', 'cos', 'tan']);

  function evaluate(expr, values) {
    if (typeof expr !== 'string' || !expr || expr.length > 500) throw new Error('Invalid expression');
    const tokenRe = /\s*(?:(\d+(?:\.\d+)?)|([A-Za-z_]\w*)|(===|!==|==|!=|<=|>=|&&|\|\||\*\*|[()+\-*/%,.?:<>!]))/gy;
    const tokens = [];
    let pos = 0;
    while (pos < expr.length) {
      tokenRe.lastIndex = pos;
      const m = tokenRe.exec(expr);
      if (!m) {
        if (/^\s*$/.test(expr.slice(pos))) break;
        throw new Error('Invalid expression');
      }
      tokens.push(m[1] !== undefined ? ['number', +m[1]] : m[2] !== undefined ? ['name', m[2]] : ['op', m[3]]);
      pos = tokenRe.lastIndex;
    }
    let i = 0;
    const peek = v => tokens[i] && tokens[i][1] === v;
    const take = v => { if (!peek(v)) throw new Error('Expected ' + v); return tokens[i++]; };
    const primary = () => {
      const t = tokens[i++];
      if (!t) throw new Error('Unexpected end of expression');
      if (t[0] === 'number') return t[1];
      if (t[1] === '(') { const v = conditional(); take(')'); return v; }
      if (t[0] !== 'name') throw new Error('Expected a value');
      if (t[1] === 'true') return true;
      if (t[1] === 'false') return false;
      if (t[1] === 'null') return null;
      const call = name => {
        if (!SAFE_MATH.has(name)) throw new Error('Unsafe Math helper');
        take('(');
        const args = [];
        if (!peek(')')) { do { args.push(conditional()); } while (peek(',') && take(',')); }
        take(')');
        return Math[name](...args);
      };
      if (t[1] === 'Math') {
        take('.');
        if (peek('PI')) { i++; return Math.PI; }
        const fn = tokens[i++];
        if (!fn || fn[0] !== 'name') throw new Error('Unsafe Math helper');
        return call(fn[1]);
      }
      if (Object.prototype.hasOwnProperty.call(values, t[1])) return values[t[1]];
      /* Authors often drop the Math. prefix; accept it for the same helpers. */
      if (t[1] === 'PI') return Math.PI;
      if (SAFE_MATH.has(t[1]) && peek('(')) return call(t[1]);
      throw new Error('Unknown variable ' + t[1]);
    };
    const unary = () => peek('!') ? (take('!'), !unary()) : peek('-') ? (take('-'), -unary()) : peek('+') ? (take('+'), +unary()) : primary();
    const power = () => { let l = unary(); if (peek('**')) { take('**'); l = l ** power(); } return l; };
    const chain = (next, ops) => () => {
      let l = next();
      while (tokens[i] && ops.includes(tokens[i][1])) {
        const op = tokens[i++][1], r = next();
        l = op === '*' ? l * r : op === '/' ? l / r : op === '%' ? l % r
          : op === '+' ? l + r : op === '-' ? l - r
          : op === '<' ? l < r : op === '<=' ? l <= r : op === '>' ? l > r : op === '>=' ? l >= r
          : op === '==' ? l == r : op === '!=' ? l != r : op === '===' ? l === r : l !== r;
      }
      return l;
    };
    const multiply = chain(power, ['*', '/', '%']);
    const add = chain(multiply, ['+', '-']);
    const compare = chain(add, ['<', '<=', '>', '>=']);
    const equal = chain(compare, ['==', '!=', '===', '!==']);
    const and = () => { let l = equal(); while (peek('&&')) { take('&&'); const r = equal(); l = l && r; } return l; };
    const or = () => { let l = and(); while (peek('||')) { take('||'); const r = and(); l = l || r; } return l; };
    function conditional() { const t = or(); if (!peek('?')) return t; take('?'); const y = conditional(); take(':'); const n = conditional(); return t ? y : n; }
    const result = conditional();
    if (i !== tokens.length) throw new Error('Unexpected token');
    return typeof result === 'number' ? Math.round(result * 100) / 100 : result;
  }

  /* ── Scoring ──────────────────────────────────────────────────────
     Pays for committing before the reveal, honest confidence and touching the
     model — never for clicking around. The run is in memory; only the best
     total survives a reload, in localStorage, every access guarded. */
  function createScore(opts) {
    const o = opts || {};
    const checks = o.checks || 0, statements = o.statements || 0;
    const key = 'lesson:best:' + String(o.key || 'lesson').slice(0, 90);
    const noop = () => {};
    const onAward = o.onAward || noop, onBadge = o.onBadge || noop, onChange = o.onChange || noop;
    const read = () => { try { return JSON.parse(localStorage.getItem(key)) || null; } catch (e) { return null; } };
    const write = v => { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} };

    const s = {
      points: 0, streak: 0, bestStreak: 0, right: 0, answered: 0, calibrated: 0, overconfident: 0,
      confirmed: 0, revisit: [], badges: [], previousBest: read(), beaten: false,
      checks, statements,
    };
    const explored = new Set(), paidStatements = new Set();
    let stored = null;

    const badge = id => { if (!s.badges.includes(id)) { s.badges.push(id); onBadge(id); } };
    const sync = () => {
      const record = stored ? stored.points : s.previousBest ? s.previousBest.points : 0;
      if (s.points > record) {
        if (s.previousBest && s.points > s.previousBest.points) s.beaten = true;
        stored = { points: s.points, right: s.right, total: checks, at: Date.now() };
        write(stored);
      }
      onChange(api.state());
    };
    const award = (n, reason) => { s.points += n; onAward(n, reason); sync(); };

    const api = {
      /* verdict: 'right' | 'partial' | 'open' | 'wrong'; confidence: 0–100 or null */
      answer({ id, prompt, mode, verdict, confidence }) {
        s.answered++;
        const right = verdict === 'right';
        if (right) { s.right++; s.streak++; s.bestStreak = Math.max(s.bestStreak, s.streak); } else s.streak = 0;
        let pts = { right: 100, partial: 45, open: 40, wrong: 10 }[verdict];
        if (pts === undefined) pts = 10;
        if (right && s.streak > 1) pts += Math.min(75, (s.streak - 1) * 15);
        if (mode === 'prediction' || mode === 'estimate') pts += 15;
        if (confidence != null) {
          if ((right && confidence >= 65) || (!right && confidence <= 35)) {
            s.calibrated++; pts += 25;
            if (s.calibrated >= 3) badge('calibrated');
          }
          if (!right && confidence >= 70) s.overconfident++;
        }
        if (s.streak >= 3) badge('streak');
        if (!right) s.revisit.push({ id, prompt, verdict });
        if (checks && s.answered === checks) { badge('committed'); if (s.right === checks) badge('clean'); }
        award(pts, right ? 'correct' : 'committed');
        /* The note the check shows under its feedback, if any. */
        return confidence == null ? null
          : !right && confidence >= 70 ? 'confidentWrong'
          : right && confidence <= 30 ? 'rightUnsure' : null;
      },
      /* kind: 'inline-whatif' | 'panel-whatif' | 'sandbox' | 'lab' — pays once per kind */
      explore(kind) {
        if (explored.has(kind)) return;
        explored.add(kind); badge('handsOn'); award(10, 'explored');
      },
      /* statementId: any stable id for the checkpoint statement */
      checkpoint(statementId, on) {
        s.confirmed += on ? 1 : -1;
        if (on && !paidStatements.has(statementId)) { paidStatements.add(statementId); award(15, 'checkpoint'); }
        if (statements && s.confirmed === statements) badge('consolidated');
        sync();
      },
      /* Which of the ending's four readings to show. */
      reading() {
        if (s.answered < checks || !checks) return 'partial';
        if (s.overconfident) return 'overconfident';
        if (s.calibrated >= 3) return 'calibrated';
        return 'done';
      },
      /* Includes reading, so code that only holds the state can still pick the ending's line. */
      state() { return Object.assign(JSON.parse(JSON.stringify(s)), { reading: api.reading() }); },
    };
    return api;
  }

  /* One failing component must not take the rest of the lesson down with it. */
  function guard(name, fn) {
    try { return fn(); } catch (e) { console.error('[' + name + ']', e); }
  }

  const LessonCore = { evaluate, createScore, guard };
  if (typeof module !== 'undefined' && module.exports) module.exports = LessonCore;
  else window.LessonCore = LessonCore;
})();
