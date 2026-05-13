const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const chipSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'HandsFreeStatusChip.tsx'),
  'utf8'
);

test('uses shared hands-free status chip colors and surface tokens', () => {
  assert.match(chipSource, /getHandsFreeComposerMobileSurfaceState/);
  assert.match(chipSource, /const statusChipSurface = getHandsFreeComposerMobileSurfaceState\(\)\.statusChip/);
  assert.match(chipSource, /getHandsFreeStatusChipMobileColors\(phase, theme\.colors\)/);
  assert.match(chipSource, /const colorStyles = useMemo\(/);
  assert.match(chipSource, /backgroundColor:\s*colors\.backgroundColor/);
  assert.match(chipSource, /borderColor:\s*colors\.borderColor/);
  assert.match(chipSource, /color:\s*colors\.textColor/);
  assert.match(chipSource, /style=\{\[styles\.label, colorStyles\.text\]\}/);
  assert.match(chipSource, /style=\{\[styles\.subtitle, colorStyles\.text\]\}/);
  assert.match(chipSource, /borderRadius:\s*radius\[statusChipSurface\.borderRadius\]/);
  assert.match(chipSource, /paddingHorizontal:\s*spacing\[statusChipSurface\.paddingHorizontal\]/);
  assert.match(chipSource, /alignSelf:\s*statusChipSurface\.alignSelf/);
  assert.match(chipSource, /fontSize:\s*statusChipSurface\.label\.fontSize/);
  assert.match(chipSource, /opacity:\s*statusChipSurface\.subtitle\.opacity/);
  assert.match(chipSource, /numberOfLines=\{statusChipSurface\.subtitle\.numberOfLines\}/);
  assert.doesNotMatch(chipSource, /numberOfLines=\{2\}/);
  assert.doesNotMatch(chipSource, /alignSelf:\s*'flex-start'/);
  assert.doesNotMatch(chipSource, /function getPhaseColors/);
  assert.doesNotMatch(chipSource, /case 'processing'/);
  assert.doesNotMatch(chipSource, /\{ color: colors\.textColor \}/);
  assert.doesNotMatch(chipSource, /style=\{\[[\s\S]{0,160}\{\s*backgroundColor: colors\.backgroundColor/);
  assert.doesNotMatch(chipSource, /#f59e0b/);
  assert.doesNotMatch(chipSource, /#8b5cf6/);
  assert.doesNotMatch(chipSource, /HANDS_FREE_COMPOSER_PRESENTATION\.surface\.mobile/);
});
