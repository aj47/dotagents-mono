const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'HandsFreeStatusChip.tsx'),
  'utf8'
);

test('keeps the mobile hands-free chip as a compact colored label', () => {
  assert.match(source, /accessibilityLabel=\{subtitle \? `\$\{label\}\. \$\{subtitle\}` : label\}/);
  assert.match(source, /<Text style=\{\[styles\.label, \{ color: colors\.textColor \}\]\} numberOfLines=\{1\}>/);
  assert.match(source, /<Text style=\{\[styles\.subtitle, \{ color: colors\.textColor \}\]\} numberOfLines=\{2\}>/);
  assert.doesNotMatch(source, /styles\.labelRow/);
  assert.doesNotMatch(source, /styles\.statusDot/);
});
