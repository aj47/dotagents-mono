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
  assert.match(chipSource, /type HandsFreeStatusChipMobileRenderState/);
  assert.match(chipSource, /const renderState = useMemo\(/);
  assert.match(chipSource, /getHandsFreeStatusChipMobileRenderState\(\{[\s\S]*?phase,[\s\S]*?label,[\s\S]*?subtitle,[\s\S]*?colors: theme\.colors,/);
  assert.match(chipSource, /createStyles\(renderState\.surface\)/);
  assert.match(chipSource, /const colorStyles = useMemo\(/);
  assert.match(chipSource, /createColorStyles\(renderState\.colors\)/);
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
  assert.match(chipSource, /renderState\.shouldRenderSubtitle/);
  assert.match(chipSource, /numberOfLines=\{renderState\.surface\.subtitle\.numberOfLines\}/);
  assert.match(chipSource, /\{renderState\.label\}/);
  assert.match(chipSource, /\{renderState\.subtitle\}/);
  assert.doesNotMatch(chipSource, /numberOfLines=\{2\}/);
  assert.doesNotMatch(chipSource, /alignSelf:\s*'flex-start'/);
  assert.doesNotMatch(chipSource, /getHandsFreeComposerMobileSurfaceState/);
  assert.doesNotMatch(chipSource, /getHandsFreeStatusChipMobileColors\(phase, theme\.colors\)/);
  assert.doesNotMatch(chipSource, /function getPhaseColors/);
  assert.doesNotMatch(chipSource, /case 'processing'/);
  assert.doesNotMatch(chipSource, /\{ color: colors\.textColor \}/);
  assert.doesNotMatch(chipSource, /style=\{\[[\s\S]{0,160}\{\s*backgroundColor: colors\.backgroundColor/);
  assert.doesNotMatch(chipSource, /#f59e0b/);
  assert.doesNotMatch(chipSource, /#8b5cf6/);
  assert.doesNotMatch(chipSource, /HANDS_FREE_COMPOSER_PRESENTATION\.surface\.mobile/);
});
