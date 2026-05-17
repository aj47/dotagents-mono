const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const chipSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'HandsFreeStatusChip.tsx'),
  'utf8'
);

test('uses shared hands-free status chip colors and surface tokens', () => {
  assert.match(chipSource, /getHandsFreeStatusChipMobileRenderState/);
  assert.match(chipSource, /createHandsFreeStatusChipMobileStyleSlots/);
  assert.match(chipSource, /createHandsFreeStatusChipMobilePropsParts/);
  assert.match(chipSource, /const renderState = useMemo\(/);
  assert.match(chipSource, /getHandsFreeStatusChipMobileRenderState\(\{[\s\S]*?phase,[\s\S]*?label,[\s\S]*?subtitle,[\s\S]*?colors: theme\.colors,/);
  assert.match(chipSource, /const styleSlots = useMemo\(/);
  assert.match(chipSource, /createHandsFreeStatusChipMobileStyleSlots\(\{[\s\S]*?renderState,[\s\S]*?spacing,[\s\S]*?radius,/);
  assert.match(chipSource, /container:\s*\{[\s\S]*?\.\.\.styleSlots\.container/);
  assert.match(chipSource, /label:\s*\{[\s\S]*?\.\.\.styleSlots\.label/);
  assert.match(chipSource, /subtitle:\s*\{[\s\S]*?\.\.\.styleSlots\.subtitle/);
  assert.match(chipSource, /const statusChipParts = createHandsFreeStatusChipMobilePropsParts\(\{[\s\S]*?renderState,[\s\S]*?styles,/);
  assert.match(chipSource, /style=\{statusChipParts\.container\.style\}/);
  assert.match(chipSource, /style=\{statusChipParts\.label\.style\}/);
  assert.match(chipSource, /\{statusChipParts\.label\.text\}/);
  assert.match(chipSource, /\{statusChipParts\.subtitle \? \(/);
  assert.match(chipSource, /style=\{statusChipParts\.subtitle\.style\}/);
  assert.match(chipSource, /numberOfLines=\{statusChipParts\.subtitle\.numberOfLines\}/);
  assert.match(chipSource, /\{statusChipParts\.subtitle\.text\}/);
  assert.doesNotMatch(chipSource, /numberOfLines=\{2\}/);
  assert.doesNotMatch(chipSource, /alignSelf:\s*'flex-start'/);
  assert.doesNotMatch(chipSource, /getHandsFreeComposerMobileSurfaceState/);
  assert.doesNotMatch(chipSource, /getHandsFreeStatusChipMobileColors\(phase, theme\.colors\)/);
  assert.doesNotMatch(chipSource, /function createStyles/);
  assert.doesNotMatch(chipSource, /function createColorStyles/);
  assert.doesNotMatch(chipSource, /function getPhaseColors/);
  assert.doesNotMatch(chipSource, /case 'processing'/);
  assert.doesNotMatch(chipSource, /\{ color: colors\.textColor \}/);
  assert.doesNotMatch(chipSource, /style=\{\[[\s\S]{0,160}\{\s*backgroundColor: colors\.backgroundColor/);
  assert.doesNotMatch(chipSource, /#f59e0b/);
  assert.doesNotMatch(chipSource, /#8b5cf6/);
  assert.doesNotMatch(chipSource, /HANDS_FREE_COMPOSER_PRESENTATION\.surface\.mobile/);
});
