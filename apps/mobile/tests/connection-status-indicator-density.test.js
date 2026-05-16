const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indicatorSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'ConnectionStatusIndicator.tsx'),
  'utf8'
);

test('uses shared connection status indicator presentation and labels', () => {
  assert.match(indicatorSource, /getConnectionStatusIndicatorMobileSurfaceState/);
  assert.match(indicatorSource, /getConnectionStatusIndicatorMobileRenderState/);
  assert.match(indicatorSource, /const connectionStatusSurface = getConnectionStatusIndicatorMobileSurfaceState\(\)/);
  assert.match(indicatorSource, /const connectionStatusState = useMemo\(/);
  assert.match(indicatorSource, /getConnectionStatusIndicatorMobileRenderState\(\{[\s\S]*?status: state,[\s\S]*?retryCount,[\s\S]*?compact,[\s\S]*?colors: theme\.colors,/);
  assert.match(indicatorSource, /const colorStyles = useMemo\(/);
  assert.match(indicatorSource, /accessibilityLabel=\{connectionStatusState\.accessibilityLabel\}/);
  assert.match(indicatorSource, /connectionStatusState\.shouldRenderPulse/);
  assert.match(indicatorSource, /connectionStatusState\.shouldRenderText/);
  assert.match(indicatorSource, /\{connectionStatusState\.statusText\}/);
  assert.match(indicatorSource, /accessibilityRole=\{connectionStatusState\.accessibilityRole\}/);
  assert.doesNotMatch(indicatorSource, /accessibilityRole="text"/);
  assert.doesNotMatch(indicatorSource, /formatConnectionStatusIndicatorLabel\(state, retryCount\)/);
  assert.doesNotMatch(indicatorSource, /isConnectionStatusIndicatorPulsing\(state\)/);
  assert.doesNotMatch(indicatorSource, /getConnectionStatusIndicatorMobileVisualColors\(state, theme\.colors\)/);
  assert.doesNotMatch(indicatorSource, /getConnectionStatusIndicatorMobileSurfaceColors/);
  assert.doesNotMatch(indicatorSource, /statusColorByStatus\[state\]/);
  assert.doesNotMatch(indicatorSource, /CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION/);
  assert.doesNotMatch(indicatorSource, /case 'connected':[\s\S]*?return '#22c55e'/);
  assert.doesNotMatch(indicatorSource, /case 'failed':[\s\S]*?return '#ef4444'/);
  assert.doesNotMatch(indicatorSource, /Reconnecting \$\{retryCount\}/);
});

test('keeps the compact dot dimensions and text styling shared', () => {
  assert.match(indicatorSource, /flexDirection:\s*connectionStatusSurface\.container\.flexDirection/);
  assert.match(indicatorSource, /alignItems:\s*connectionStatusSurface\.container\.alignItems/);
  assert.match(indicatorSource, /paddingVertical:\s*connectionStatusSurface\.container\.paddingVertical/);
  assert.match(indicatorSource, /paddingHorizontal:\s*connectionStatusSurface\.container\.paddingHorizontal/);
  assert.match(indicatorSource, /paddingVertical:\s*connectionStatusSurface\.container\.compactPaddingVertical/);
  assert.match(indicatorSource, /position:\s*connectionStatusSurface\.dotContainer\.position/);
  assert.match(indicatorSource, /position:\s*connectionStatusSurface\.dot\.position/);
  assert.match(indicatorSource, /width:\s*connectionStatusSurface\.dot\.size/);
  assert.match(indicatorSource, /opacity:\s*connectionStatusSurface\.dot\.pulsingOpacity/);
  assert.match(indicatorSource, /position:\s*connectionStatusSurface\.pulse\.position/);
  assert.match(indicatorSource, /top:\s*connectionStatusSurface\.pulse\.top/);
  assert.match(indicatorSource, /left:\s*connectionStatusSurface\.pulse\.left/);
  assert.match(indicatorSource, /duration:\s*connectionStatusSurface\.pulse\.durationMs/);
  assert.match(indicatorSource, /fontSize:\s*connectionStatusSurface\.text\.fontSize/);
  assert.match(indicatorSource, /fontWeight:\s*connectionStatusSurface\.text\.fontWeight/);
  assert.match(indicatorSource, /backgroundColor:\s*connectionStatusState\.colors\.dot\.backgroundColor/);
  assert.match(indicatorSource, /backgroundColor:\s*connectionStatusState\.colors\.pulse\.backgroundColor/);
  assert.match(indicatorSource, /color:\s*connectionStatusState\.colors\.text\.color/);
  assert.match(indicatorSource, /style=\{\[styles\.text, colorStyles\.text\]\}/);
  assert.match(indicatorSource, /const pulseAnimatedStyle = useMemo\(\(\) => \(\{ opacity: pulseAnim \}\), \[pulseAnim\]\)/);
  assert.match(indicatorSource, /colorStyles\.pulse,[\s\S]*?pulseAnimatedStyle/);
  assert.doesNotMatch(indicatorSource, /theme\.colors\[[^\]]+\]/);
  assert.doesNotMatch(indicatorSource, /theme\.colors\.[A-Za-z]/);
  assert.doesNotMatch(indicatorSource, /\{ backgroundColor: statusColor \}/);
  assert.doesNotMatch(indicatorSource, /\{ backgroundColor: statusColor, opacity: pulseAnim \}/);
  assert.doesNotMatch(indicatorSource, /\{ color: statusTextColor \}/);
  assert.doesNotMatch(indicatorSource, /flexDirection:\s*'row'/);
  assert.doesNotMatch(indicatorSource, /alignItems:\s*'center'/);
  assert.doesNotMatch(indicatorSource, /paddingVertical:\s*4,/);
  assert.doesNotMatch(indicatorSource, /position:\s*'relative'/);
  assert.doesNotMatch(indicatorSource, /position:\s*'absolute'/);
  assert.doesNotMatch(indicatorSource, /width:\s*8,/);
  assert.doesNotMatch(indicatorSource, /opacity:\s*1,/);
  assert.doesNotMatch(indicatorSource, /top:\s*0,/);
  assert.doesNotMatch(indicatorSource, /left:\s*0,/);
  assert.doesNotMatch(indicatorSource, /duration:\s*800,/);
  assert.doesNotMatch(indicatorSource, /fontSize:\s*12,/);
});
