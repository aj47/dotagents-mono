const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

function extractBetween(startMarker, endMarker) {
  const start = settingsSource.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing start marker: ${startMarker}`);

  const end = settingsSource.indexOf(endMarker, start);
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`);

  return settingsSource.slice(start, end);
}

test('keeps the mobile Agents subsection free of decorative delete emoji chrome', () => {
  const agentsSection = extractBetween(
    '<CollapsibleSection id="agents" title="Agents">',
    '{/* 4n. Agent Loops */}'
  );

  assert.doesNotMatch(agentsSection, /🗑️/);
  assert.match(agentsSection, /<Text style=\{styles\.agentDeleteButtonText\}>Delete<\/Text>/);
  assert.match(agentsSection, /accessibilityLabel=\{`Delete agent \$\{profile\.displayName\}`\}/);
});

test('keeps mobile Agent Loop actions text-first and explicitly labeled', () => {
  const loopsSection = extractBetween(
    '<CollapsibleSection id="agentLoops" title="Agent Loops">',
    '</>'
  );

  assert.doesNotMatch(loopsSection, /▶ Run|🗑 Delete/);
  assert.match(loopsSection, /<Text style=\{styles\.loopRunActionText\}>Run<\/Text>/);
  assert.match(loopsSection, /<Text style=\{styles\.loopDeleteActionText\}>Delete<\/Text>/);
  assert.match(loopsSection, /accessibilityLabel=\{`Run loop \$\{loop\.name\}`\}/);
  assert.match(loopsSection, /accessibilityLabel=\{`Delete loop \$\{loop\.name\}`\}/);
});