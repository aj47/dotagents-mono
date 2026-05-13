import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { HandsFreePhase } from '@dotagents/shared/types';
import {
  getHandsFreeComposerMobileSurfaceState,
  getHandsFreeStatusChipMobileColors,
} from '@dotagents/shared/hands-free-controller';
import { useTheme } from './ThemeProvider';
import { spacing, radius } from './theme';

type HandsFreeStatusChipProps = {
  phase: HandsFreePhase;
  label: string;
  subtitle?: string;
};

const statusChipSurface = getHandsFreeComposerMobileSurfaceState().statusChip;

export function HandsFreeStatusChip({ phase, label, subtitle }: HandsFreeStatusChipProps) {
  const { theme } = useTheme();
  const colors = useMemo(
    () => getHandsFreeStatusChipMobileColors(phase, theme.colors),
    [phase, theme.colors],
  );
  const colorStyles = useMemo(
    () => StyleSheet.create({
      container: {
        backgroundColor: colors.backgroundColor,
        borderColor: colors.borderColor,
      },
      text: {
        color: colors.textColor,
      },
    }),
    [colors],
  );

  return (
    <View
      style={[
        styles.container,
        colorStyles.container,
      ]}
    >
      <Text style={[styles.label, colorStyles.text]}>{label}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, colorStyles.text]} numberOfLines={statusChipSurface.subtitle.numberOfLines}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius[statusChipSurface.borderRadius],
    borderWidth: statusChipSurface.borderWidth,
    paddingHorizontal: spacing[statusChipSurface.paddingHorizontal],
    paddingVertical: spacing[statusChipSurface.paddingVertical],
    alignSelf: statusChipSurface.alignSelf,
    maxWidth: statusChipSurface.maxWidth,
  },
  label: {
    fontSize: statusChipSurface.label.fontSize,
    fontWeight: statusChipSurface.label.fontWeight,
  },
  subtitle: {
    fontSize: statusChipSurface.subtitle.fontSize,
    marginTop: statusChipSurface.subtitle.marginTop,
    opacity: statusChipSurface.subtitle.opacity,
  },
});
