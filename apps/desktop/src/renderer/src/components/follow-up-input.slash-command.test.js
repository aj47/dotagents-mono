import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const helperSource = fs.readFileSync(new URL('./skill-slash-commands.ts', import.meta.url), 'utf8');
const overlaySource = fs.readFileSync(new URL('./overlay-follow-up-input.tsx', import.meta.url), 'utf8');
const tileSource = fs.readFileSync(new URL('./tile-follow-up-input.tsx', import.meta.url), 'utf8');

test('shares slash-command expansion helpers for follow-up composers', () => {
  assert.match(helperSource, /export function getSlashCommandState\(text: string, skills: AgentSkill\[]\)/);
  assert.match(helperSource, /export function expandSlashCommandText\(text: string, exactSkill: AgentSkill \| null\)/);
  assert.match(helperSource, /return `\$\{exactSkill\.instructions\.trim\(\)\}\\n\\nUser request:\\n\$\{trailingText\}`/);
  assert.match(helperSource, /export function replaceSlashCommandSelection\(text: string, skill: AgentSkill\)/);
});

test('wires overlay follow-up input to skill slash suggestions and inline expansion', () => {
  assert.match(overlaySource, /const skillsQuery = useQuery<AgentSkill\[]>\(/);
  assert.match(overlaySource, /const matchedSlashSkill = slashCommandState\?\.exactSkill \?\? null/);
  assert.match(overlaySource, /const selectedSlashSkill = slashCommandState\?\.suggestions\[selectedSlashSkillIndex\] \?\? null/);
  assert.match(overlaySource, /const expandedText = expandSlashCommandText\(text, matchedSlashSkill\)/);
  assert.match(overlaySource, /replaceSlashCommandSelection\(currentText, skill\)/);
  assert.match(overlaySource, /aria-label="Skill slash command suggestions"/);
  assert.match(overlaySource, /Skill: \{matchedSlashSkill\.name\}/);
  assert.match(overlaySource, /if \(slashCommandState\?\.shouldShowSuggestions && selectedSlashSkill\)/);
  assert.match(overlaySource, /if \(\(e\.key === "Tab" \|\| e\.key === "Enter"\) && !e\.shiftKey\)/);
});

test('wires tile follow-up input to the same slash-command UX', () => {
  assert.match(tileSource, /const skillsQuery = useQuery<AgentSkill\[]>\(/);
  assert.match(tileSource, /const matchedSlashSkill = slashCommandState\?\.exactSkill \?\? null/);
  assert.match(tileSource, /const selectedSlashSkill = slashCommandState\?\.suggestions\[selectedSlashSkillIndex\] \?\? null/);
  assert.match(tileSource, /const expandedText = expandSlashCommandText\(text, matchedSlashSkill\)/);
  assert.match(tileSource, /replaceSlashCommandSelection\(currentText, skill\)/);
  assert.match(tileSource, /aria-label="Skill slash command suggestions"/);
  assert.match(tileSource, /Skill: \{matchedSlashSkill\.name\}/);
  assert.match(tileSource, /if \(slashCommandState\?\.shouldShowSuggestions && selectedSlashSkill\)/);
  assert.match(tileSource, /if \(\(e\.key === "Tab" \|\| e\.key === "Enter"\) && !e\.shiftKey\)/);
});