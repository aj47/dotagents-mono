import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const helperSource = fs.readFileSync(new URL('./skill-slash-commands.ts', import.meta.url), 'utf8');
const source = fs.readFileSync(new URL('./text-input-panel.tsx', import.meta.url), 'utf8');

test('reuses the shared slash-command helpers in the desktop composer', () => {
  assert.match(helperSource, /export function getSlashCommandState\(text: string, skills: AgentSkill\[]\)/);
  assert.match(helperSource, /export function expandSlashCommandText\(text: string, exactSkill: AgentSkill \| null\)/);
  assert.match(helperSource, /export function replaceSlashCommandSelection\(text: string, skill: AgentSkill\)/);
  assert.match(source, /from "\.\/skill-slash-commands"/);
  assert.doesNotMatch(source, /const normalizeSkillSlashToken =/);
  assert.doesNotMatch(source, /function getSlashCommandState\(/);
});

test('wires desktop composer slash commands to skills query and inline expansion', () => {
  assert.match(source, /const skillsQuery = useQuery<AgentSkill\[]>\(/);
  assert.match(source, /queryKey: \["skills"\]/);
  assert.match(source, /queryFn: \(\) => tipcClient\.getSkills\(\)/);
  assert.match(source, /const currentAgentProfileQuery = useQuery<AgentProfile \| null>\(/);
  assert.match(source, /queryKey: \["current-agent-profile"\]/);
  assert.match(source, /tipcClient\.getCurrentAgentProfile\(\)/);
  assert.match(source, /tipcClient\.getEnabledSkillIdsForProfile\(\{ profileId: effectiveSlashSkillProfileId \}\)/);
  assert.match(source, /return skills\.filter\(\(skill\) => enabledSkillIdSet\.has\(skill\.id\)\)/);
  assert.match(source, /Type `\/` for skills/);
  assert.match(source, /const matchedSlashSkill = slashCommandState\?\.exactSkill \?\? null/);
  assert.match(source, /const expandedText = expandSlashCommandText\(text, matchedSlashSkill\)/);
});

test('renders a slash-command suggestion list and keyboard acceptance path', () => {
  assert.match(source, /aria-label="Skill slash command suggestions"/);
  assert.match(source, /if \(slashCommandState\?\.shouldShowSuggestions && selectedSlashSkill\)/);
  assert.match(source, /if \(\(e\.key === "Tab" \|\| e\.key === "Enter"\) && !e\.shiftKey\)/);
  assert.match(source, /onClick=\{\(\) => handleSelectSlashSkill\(skill\)\}/);
  assert.match(source, /replaceSlashCommandSelection\(currentText, skill\)/);
  assert.match(source, /Skill: \{matchedSlashSkill\.name\}/);
});
