// node --test tests/
const test = require('node:test');
const assert = require('node:assert');
const { evaluate, createScore } = require('../skills/make-it-learnable/assets/lesson-core.js');

test('evaluate computes with declared variables and safe helpers', () => {
  assert.strictEqual(evaluate('hit/100*2 + (1-hit/100)*90', { hit: 80 }), 19.6);
  assert.strictEqual(evaluate('(Math.pow(1/(1-d/100),2)-1)*100', { d: 3.3 }), 6.94);
  assert.strictEqual(evaluate('x > 3 ? 1 : 0 ', { x: 5 }), 1);
});

test('evaluate rejects anything outside the grammar', () => {
  for (const bad of ['alert(1)', 'Math.exp(1)', 'y + 1', 'constructor', 'x["a"]', 'this.x'])
    assert.throws(() => evaluate(bad, { x: 1 }), bad);
});

test('score follows the contract', () => {
  const awards = [];
  const s = createScore({ key: 't' + Math.random(), checks: 2, statements: 1, onAward: (n, r) => awards.push([n, r]) });
  // wrong prediction at 90% confidence: 10 + 15, overconfident, note fires
  assert.strictEqual(s.answer({ id: 'q1', prompt: 'p', mode: 'prediction', verdict: 'wrong', confidence: 90 }), 'confidentWrong');
  // right choose at 80%: 100 + 25 calibrated
  s.answer({ id: 'q2', prompt: 'p', mode: 'choose', verdict: 'right', confidence: 80 });
  s.explore('lab'); s.explore('lab');
  s.checkpoint('a', true); s.checkpoint('a', false); s.checkpoint('a', true);
  assert.deepStrictEqual(awards, [[25, 'committed'], [125, 'correct'], [10, 'explored'], [15, 'checkpoint']]);
  const st = s.state();
  assert.strictEqual(st.points, 175);
  assert.strictEqual(st.overconfident, 1);
  assert.deepStrictEqual(st.revisit.map(r => r.id), ['q1']);
  assert.deepStrictEqual(st.badges.sort(), ['committed', 'consolidated', 'handsOn']);
  assert.strictEqual(s.reading(), 'overconfident');
  assert.strictEqual(s.state().reading, 'overconfident');
});

test('evaluate supports trigonometry in radians and PI', () => {
  assert.strictEqual(evaluate('Math.sin(a*Math.PI/180)', { a: 30 }), 0.5);
  assert.strictEqual(evaluate('Math.cos(0) + Math.tan(0)', {}), 1);
  assert.throws(() => evaluate('Math.E', {}));
});

test('evaluate accepts helpers without the Math. prefix, but not unknown names', () => {
  assert.strictEqual(evaluate('sin(a * PI / 180)', { a: 90 }), 1);
  assert.throws(() => evaluate('exp(1)', {}));
  assert.strictEqual(evaluate('sin', { sin: 3 }), 3);   // a declared variable wins
});

test('guard isolates a failing component', () => {
  const { guard } = require('../skills/make-it-learnable/assets/lesson-core.js');
  const orig = console.error; console.error = () => {};
  try { assert.strictEqual(guard('x', () => { throw new Error('boom'); }), undefined); }
  finally { console.error = orig; }
  assert.strictEqual(guard('y', () => 2), 2);
});
