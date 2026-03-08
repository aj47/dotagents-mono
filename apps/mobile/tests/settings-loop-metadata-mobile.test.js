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

test('keeps loop activity context visible in the collapsed Agent Loops header on mobile', () => {
  assert.match(settingsSource, /const agentLoopsSectionSummary = useMemo\(\(\) => \{/);
  assert.match(settingsSource, /if \(isLoadingLoops\) return 'Loading loops…';/);
  assert.match(settingsSource, /if \(loops\.length === 0\) return 'No loops';/);
  assert.match(settingsSource, /const runningLoopCount = loops\.filter\(\(loop\) => loop\.isRunning\)\.length;/);
  assert.match(settingsSource, /const pausedLoopCount = loops\.filter\(\(loop\) => !loop\.enabled\)\.length;/);
  assert.match(settingsSource, /const activeLoopCount = loops\.filter\(\(loop\) => loop\.enabled && !loop\.isRunning\)\.length;/);
  assert.match(settingsSource, /if \(runningLoopCount > 0\) \{[\s\S]*?summaryParts\.push\(`\$\{runningLoopCount\} running`\);/);
  assert.match(settingsSource, /if \(activeLoopCount > 0\) \{[\s\S]*?summaryParts\.push\(`\$\{activeLoopCount\} active`\);/);
  assert.match(settingsSource, /if \(pausedLoopCount > 0\) \{[\s\S]*?summaryParts\.push\(`\$\{pausedLoopCount\} paused`\);/);
  assert.match(settingsSource, /<CollapsibleSection[\s\S]*?id="agentLoops"[\s\S]*?summary=\{agentLoopsSectionSummary\}/);
});

test('keeps long loop names stable when the runtime badge is present', () => {
  assert.match(settingsSource, /<Text[\s\S]*?style=\{\[styles\.serverName, styles\.loopRowName\]\}[\s\S]*?numberOfLines=\{2\}[\s\S]*?ellipsizeMode="tail"[\s\S]*?\{loop\.name\}/);
  assert.match(settingsSource, /loopRowName:\s*\{[\s\S]*?flexGrow:\s*1,[\s\S]*?minWidth:\s*0/);
  assert.match(settingsSource, /loopStateBadge:\s*\{[\s\S]*?paddingHorizontal:\s*6,[\s\S]*?paddingVertical:\s*2,[\s\S]*?flexShrink:\s*0/);
});