import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { HandsFreePhase } from '@dotagents/shared/types';
import {
  getHandsFreeStatusChipMobileRenderState,
  type HandsFreeStatusChipMobileColors,
  type HandsFreeStatusChipMobileRenderState,
} from '@dotagents/shared/hands-free-controller';
import { useTheme } from './ThemeProvider';
import { spacing, radius } from './theme';

type HandsFreeStatusChipProps = {
  phase: HandsFreePhase;
  label: string;
  subtitle?: string;
};

export function HandsFreeStatusChip({ phase, label, subtitle }: HandsFreeStatusChipProps) {
  const { theme } = useTheme();
  const renderState = useMemo(
    () => getHandsFreeStatusChipMobileRenderState({
      phase,
      label,
      subtitle,
      colors: theme.colors,
    }),
    [label, phase, subtitle, theme.colors],
  );
  const styles = useMemo(
    () => createStyles(renderState.surface),
    [renderState.surface],
  );
  const colorStyles = useMemo(
    () => createColorStyles(renderState.colors),
    [renderState.colors],
  );

  return (
    <View
      style={[
        styles.container,
        colorStyles.container,
      ]}
    >
      <Text style={[styles.label, colorStyles.text]}>{renderState.label}</Text>
      {renderState.shouldRenderSubtitle ? (
        <Text style={[styles.subtitle, colorStyles.text]} numberOfLines={renderState.surface.subtitle.numberOfLines}>
          {renderState.subtitle}
        </Text>
      ) : null}
    </View>
  );
}

function createColorStyles(colors: HandsFreeStatusChipMobileColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.backgroundColor,
      borderColor: colors.borderColor,
    },
    text: {
      color: colors.textColor,
    },
  });
}

function createStyles(statusChipSurface: HandsFreeStatusChipMobileRenderState['surface']) {
  return StyleSheet.create({
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
}
