const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('lets reconnect and retry banner copy wrap to two lines instead of truncating immediately', () => {
  assert.match(screenSource, /connectionState\.lastError && \([\s\S]*?<Text style=\{styles\.connectionBannerSubtext\} numberOfLines=\{2\}>[\s\S]*?\{connectionState\.lastError\}[\s\S]*?<\/Text>/);
  assert.match(screenSource, /<Text style=\{styles\.connectionBannerSubtext\} numberOfLines=\{2\}>[\s\S]*?Tap retry to try again[\s\S]*?<\/Text>/);
});

test('uses a wrap-safe banner layout with a minimum-width-safe text lane', () => {
  assert.match(screenSource, /connectionBannerContent:\s*\{[\s\S]*?alignItems:\s*'flex-start',[\s\S]*?flexWrap:\s*'wrap',[\s\S]*?gap:\s*spacing\.sm,/);
  assert.match(screenSource, /connectionBannerTextContainer:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0,/);
});

test('keeps the retry action comfortably tappable without forcing the banner into a rigid single row', () => {
  assert.match(screenSource, /const retryBannerButtonTouchTarget = createMinimumTouchTargetStyle\(\{[\s\S]*?horizontalPadding:\s*spacing\.md,[\s\S]*?verticalPadding:\s*spacing\.xs,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\);/);
  assert.match(screenSource, /retryButton:\s*\{[\s\S]*?\.\.\.retryBannerButtonTouchTarget,[\s\S]*?marginLeft:\s*'auto',/);
});

