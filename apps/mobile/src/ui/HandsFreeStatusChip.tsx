import { View, Text, StyleSheet } from 'react-native';
import type { HandsFreePhase } from '@dotagents/shared';
import { useTheme } from './ThemeProvider';
import { spacing, radius } from './theme';

type HandsFreeStatusChipProps = {
  phase: HandsFreePhase;
  label: string;
  subtitle?: string;
};

function getPhaseColors(phase: HandsFreePhase, colors: ReturnType<typeof useTheme>['theme']['colors']) {
  switch (phase) {
    case 'sleeping':
      return { backgroundColor: colors.secondary, borderColor: colors.border, textColor: colors.foreground };
    case 'waking':
    case 'listening':
      return { backgroundColor: colors.primary, borderColor: colors.primary, textColor: colors.primaryForeground };
    case 'processing':
      return { backgroundColor: '#f59e0b', borderColor: '#f59e0b', textColor: '#111827' };
    case 'speaking':
      return { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', textColor: '#ffffff' };
    case 'paused':
      return { backgroundColor: colors.muted, borderColor: colors.border, textColor: colors.foreground };
    case 'error':
      return { backgroundColor: colors.destructive, borderColor: colors.destructive, textColor: colors.primaryForeground };
    default:
      return { backgroundColor: colors.secondary, borderColor: colors.border, textColor: colors.foreground };
  }
}

export function HandsFreeStatusChip({ phase, label, subtitle }: HandsFreeStatusChipProps) {
  const { theme } = useTheme();
  const colors = getPhaseColors(phase, theme.colors);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
        },
      ]}
    >
      <Text style={[styles.label, { color: colors.textColor }]}>{label}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textColor }]} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.92,
  },
});