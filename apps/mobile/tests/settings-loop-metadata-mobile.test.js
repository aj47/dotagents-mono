const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('formats loop intervals into readable mobile labels', () => {
  assert.match(settingsSource, /function formatLoopIntervalLabel\(minutes: number\): string/);
  assert.match(settingsSource, /minutes === 1440\) return 'Daily'/);
  assert.match(settingsSource, /minutes === 10080\) return 'Weekly'/);
  assert.match(settingsSource, /minutes < 60\) return `Every \$\{minutes\} min`/);
  assert.match(settingsSource, /formatLoopIntervalLabel\(loop\.intervalMinutes\)/);
});

test('shortens last-run metadata to hour and minute precision', () => {
  assert.match(settingsSource, /function formatLoopLastRunLabel\(timestamp: number\): string/);
  assert.match(settingsSource, /minute: '2-digit'/);
  assert.match(settingsSource, /formatLoopLastRunLabel\(loop\.lastRunAt\)/);
});

test('prioritizes compact loop schedule metadata over prompt preview on mobile', () => {
  assert.match(
    settingsSource,
    /<Text style=\{styles\.serverMeta\} numberOfLines=\{2\}>[\s\S]*?formatLoopIntervalLabel\(loop\.intervalMinutes\)[\s\S]*?<\/Text>[\s\S]*?<Text style=\{styles\.loopPromptPreview\} numberOfLines=\{1\}>\{loop\.prompt\}<\/Text>/
  );
  assert.match(settingsSource, /loopPromptPreview:\s*\{[\s\S]*?fontSize: 11,[\s\S]*?lineHeight: 15,/);
});

test('surfaces run-on-startup state directly in compact loop metadata', () => {
  assert.match(settingsSource, /loop\.runOnStartup \? \([\s\S]*?<Text style=\{styles\.loopStartupMeta\}>Run on startup<\/Text>[\s\S]*?\) : null/);
  assert.match(settingsSource, /loopStartupMeta:\s*\{[\s\S]*?color: theme\.colors\.primary,[\s\S]*?fontWeight: '600',/);
});

test('surfaces loop runtime state with a compact status badge on mobile', () => {
  assert.match(settingsSource, /function getLoopStatusLabel\(loop: Loop\): 'Running' \| 'Active' \| 'Paused'/);
  assert.match(settingsSource, /if \(loop\.isRunning\) return 'Running';/);
  assert.match(settingsSource, /return loop\.enabled \? 'Active' : 'Paused';/);
  assert.match(settingsSource, /const loopStatusLabel = getLoopStatusLabel\(loop\);/);
  assert.match(settingsSource, /styles\.loopStateBadge[\s\S]*?\{loopStatusLabel\}/);
  assert.match(settingsSource, /loopStateBadgeActive:\s*\{[\s\S]*?borderColor: theme\.colors\.primary,[\s\S]*?backgroundColor: theme\.colors\.primary \+ '12',/);
  assert.match(settingsSource, /loopStateBadgePaused:\s*\{[\s\S]*?backgroundColor: theme\.colors\.secondary,/);
});