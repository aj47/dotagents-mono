import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./text-input-panel.tsx', import.meta.url), 'utf8');

test('wires desktop composer slash commands to skills query and inline expansion', () => {
  assert.match(source, /const skillsQuery = useQuery<AgentSkill\[]>\(/);
  assert.match(source, /queryKey: \["skills"\]/);
  assert.match(source, /queryFn: \(\) => tipcClient\.getSkills\(\)/);
  assert.match(source, /Type `\/` for skills/);
  assert.match(source, /const matchedSlashSkill = slashCommandState\?\.exactSkill \?\? null/);
  assert.match(source, /return `\$\{exactSkill\.instructions\.trim\(\)\}\\n\\nUser request:\\n\$\{trailingText\}`/);
});

test('renders a slash-command suggestion list and keyboard acceptance path', () => {
  assert.match(source, /aria-label="Skill slash command suggestions"/);
  assert.match(source, /if \(slashCommandState\?\.shouldShowSuggestions && selectedSlashSkill\)/);
  assert.match(source, /if \(\(e\.key === "Tab" \|\| e\.key === "Enter"\) && !e\.shiftKey\)/);
  assert.match(source, /onClick=\{\(\) => handleSelectSlashSkill\(skill\)\}/);
  assert.match(source, /Skill: \{matchedSlashSkill\.name\}/);
});