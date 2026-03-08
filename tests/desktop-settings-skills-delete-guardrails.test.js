const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-skills.tsx'),
  'utf8'
);

test('skill deletion uses recoverable dialog flows and handles false single-delete results', () => {
  assert.match(source, /const \[deleteConfirmSkill, setDeleteConfirmSkill\] = useState<AgentSkill \| null>\(null\)/);
  assert.match(source, /const \[deleteSkillError, setDeleteSkillError\] = useState<string \| null>\(null\)/);
  assert.match(source, /const deleted = await deleteSkillMutation\.mutateAsync\(skill\.id\)/);
  assert.match(source, /throw new Error\(`Couldn't delete "\$\{skill\.name\}" yet\./);
  assert.match(source, /This removes the skill from your available library\. This action cannot be undone\./);
  assert.match(source, /\{deleteSkillError \? "Retry delete skill" : "Delete skill"\}/);
  assert.doesNotMatch(source, /confirm\(`Are you sure you want to delete the skill /);
});

test('bulk skill deletion keeps failed items selected for retry instead of clearing selection', () => {
  assert.match(source, /const failedIds = new Set\(failedResults\.map\(\(result\) => result\.id\)\)/);
  assert.match(source, /setSelectedSkillIds\(failedIds\)/);
  assert.match(source, /They stay selected so you can retry\./);
  assert.match(source, /\{bulkDeleteError[\s\S]*"Retry delete selected"/);
  assert.doesNotMatch(source, /confirm\(`Are you sure you want to delete \$\{count\} skill\(s\)\?`\)/);
});