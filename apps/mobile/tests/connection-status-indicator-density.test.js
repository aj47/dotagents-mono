const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indicatorSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'ConnectionStatusIndicator.tsx'),
  'utf8'
);

test('uses shared connection status indicator presentation and labels', () => {
  assert.match(indicatorSource, /from '@dotagents\/shared\/session-presentation';/);
  assert.match(indicatorSource, /createConnectionStatusIndicatorMobilePropsParts/);
  assert.match(indicatorSource, /createConnectionStatusIndicatorMobileStyleSlots/);
  assert.match(indicatorSource, /getConnectionStatusIndicatorMobileRenderState/);
  assert.match(indicatorSource, /type ConnectionStatusIndicatorMobilePropsParts,/);
  assert.match(indicatorSource, /type ConnectionStatusIndicatorStyles = \{[\s\S]*?container: StyleProp<ViewStyle>;[\s\S]*?dotPulse: StyleProp<ViewStyle>;[\s\S]*?text: StyleProp<TextStyle>;[\s\S]*?\};/);
  assert.match(indicatorSource, /type ConnectionStatusPulseAnimatedStyle = \{[\s\S]*?opacity: Animated\.Value;[\s\S]*?\};/);
  assert.match(indicatorSource, /type ConnectionStatusIndicatorParts =\s+ConnectionStatusIndicatorMobilePropsParts<[\s\S]*?ConnectionStatusIndicatorStyles,[\s\S]*?ConnectionStatusPulseAnimatedStyle/);
  assert.match(indicatorSource, /const connectionStatusState = useMemo\(/);
  assert.match(indicatorSource, /getConnectionStatusIndicatorMobileRenderState\(\{[\s\S]*?status: state,[\s\S]*?retryCount,[\s\S]*?compact,[\s\S]*?colors: theme\.colors,/);
  assert.match(indicatorSource, /const connectionStatusAnimation = connectionStatusState\.animation;/);
  assert.match(indicatorSource, /createConnectionStatusIndicatorMobileStyleSlots\(\{[\s\S]*?renderState: connectionStatusState,/);
  assert.match(indicatorSource, /const connectionStatusParts = useMemo\(\s+\(\): ConnectionStatusIndicatorParts => createConnectionStatusIndicatorMobilePropsParts\(\{[\s\S]*?renderState: connectionStatusState,[\s\S]*?styles,[\s\S]*?pulseAnimatedStyle,[\s\S]*?compact,/);
  assert.match(indicatorSource, /<View\s+\{\.\.\.connectionStatusParts\.container\.props\}>/);
  assert.match(indicatorSource, /connectionStatusParts\.pulse/);
  assert.match(indicatorSource, /connectionStatusParts\.text/);
  assert.match(indicatorSource, /\{connectionStatusParts\.text\.text\}/);
  assert.doesNotMatch(indicatorSource, /accessibilityLabel=\{connectionStatusParts\.container\.accessibilityLabel\}/);
  assert.doesNotMatch(indicatorSource, /accessibilityRole=\{connectionStatusParts\.container\.accessibilityRole\}/);
  assert.doesNotMatch(indicatorSource, /accessibilityRole="text"/);
  assert.doesNotMatch(indicatorSource, /formatConnectionStatusIndicatorLabel\(state, retryCount\)/);
  assert.doesNotMatch(indicatorSource, /isConnectionStatusIndicatorPulsing\(state\)/);
  assert.doesNotMatch(indicatorSource, /getConnectionStatusIndicatorMobileVisualColors\(state, theme\.colors\)/);
  assert.doesNotMatch(indicatorSource, /getConnectionStatusIndicatorMobileSurfaceState/);
  assert.doesNotMatch(indicatorSource, /getConnectionStatusIndicatorMobileSurfaceColors/);
  assert.doesNotMatch(indicatorSource, /type ConnectionStatusIndicatorMobileRenderState/);
  assert.doesNotMatch(indicatorSource, /const colorStyles = useMemo\(/);
  assert.doesNotMatch(indicatorSource, /function createStyles/);
  assert.doesNotMatch(indicatorSource, /from '@dotagents\/shared\/connection-recovery';/);
  assert.doesNotMatch(indicatorSource, /statusColorByStatus\[state\]/);
  assert.doesNotMatch(indicatorSource, /CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION/);
  assert.doesNotMatch(indicatorSource, /case 'connected':[\s\S]*?return '#22c55e'/);
  assert.doesNotMatch(indicatorSource, /case 'failed':[\s\S]*?return '#ef4444'/);
  assert.doesNotMatch(indicatorSource, /Reconnecting \$\{retryCount\}/);
});

test('keeps the compact dot dimensions and text styling shared', () => {
  assert.match(indicatorSource, /\.\.\.connectionStatusStyleSlots\.container/);
  assert.match(indicatorSource, /\.\.\.connectionStatusStyleSlots\.containerCompact/);
  assert.match(indicatorSource, /\.\.\.connectionStatusStyleSlots\.dotContainer/);
  assert.match(indicatorSource, /\.\.\.connectionStatusStyleSlots\.dot/);
  assert.match(indicatorSource, /\.\.\.connectionStatusStyleSlots\.dotPulsing/);
  assert.match(indicatorSource, /\.\.\.connectionStatusStyleSlots\.dotPulse/);
  assert.match(indicatorSource, /\.\.\.connectionStatusStyleSlots\.dotColor/);
  assert.match(indicatorSource, /\.\.\.connectionStatusStyleSlots\.pulseColor/);
  assert.match(indicatorSource, /\.\.\.connectionStatusStyleSlots\.text/);
  assert.match(indicatorSource, /\.\.\.connectionStatusStyleSlots\.textColor/);
  assert.match(indicatorSource, /const styles = useMemo<ConnectionStatusIndicatorStyles>\(/);
  assert.match(indicatorSource, /duration:\s*connectionStatusAnimation\.durationMs/);
  assert.match(indicatorSource, /useNativeDriver:\s*connectionStatusAnimation\.useNativeDriver/);
  assert.match(indicatorSource, /const pulseAnimatedStyle = useMemo<ConnectionStatusPulseAnimatedStyle>\(\(\) => \(\{ opacity: pulseAnim \}\), \[pulseAnim\]\)/);
  assert.match(indicatorSource, /<Text\s+\{\.\.\.connectionStatusParts\.text\.props\}>/);
  assert.match(indicatorSource, /<Animated\.View\s+\{\.\.\.connectionStatusParts\.pulse\.props\} \/>/);
  assert.doesNotMatch(indicatorSource, /style=\{connectionStatusParts\.(container|dotContainer|dot|pulse|text)\.style\}/);
  assert.doesNotMatch(indicatorSource, /theme\.colors\[[^\]]+\]/);
  assert.doesNotMatch(indicatorSource, /theme\.colors\.[A-Za-z]/);
  assert.doesNotMatch(indicatorSource, /\{ backgroundColor: statusColor \}/);
  assert.doesNotMatch(indicatorSource, /\{ backgroundColor: statusColor, opacity: pulseAnim \}/);
  assert.doesNotMatch(indicatorSource, /\{ color: statusTextColor \}/);
  assert.doesNotMatch(indicatorSource, /duration:\s*800,/);
  assert.doesNotMatch(indicatorSource, /useNativeDriver:\s*true/);
  assert.doesNotMatch(indicatorSource, /flexDirection:\s*'row'/);
  assert.doesNotMatch(indicatorSource, /alignItems:\s*'center'/);
  assert.doesNotMatch(indicatorSource, /paddingVertical:\s*4,/);
  assert.doesNotMatch(indicatorSource, /position:\s*'relative'/);
  assert.doesNotMatch(indicatorSource, /position:\s*'absolute'/);
  assert.doesNotMatch(indicatorSource, /width:\s*8,/);
  assert.doesNotMatch(indicatorSource, /opacity:\s*1,/);
  assert.doesNotMatch(indicatorSource, /top:\s*0,/);
  assert.doesNotMatch(indicatorSource, /left:\s*0,/);
  assert.doesNotMatch(indicatorSource, /fontSize:\s*12,/);
});
