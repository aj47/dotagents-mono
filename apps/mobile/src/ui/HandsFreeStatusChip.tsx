import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  createHandsFreeStatusChipMobilePropsParts,
  createHandsFreeStatusChipMobileStyleSlots,
  getHandsFreeStatusChipMobileRenderState,
  type HandsFreePhase,
} from '@dotagents/shared/session-presentation';
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
  const styleSlots = useMemo(
    () => createHandsFreeStatusChipMobileStyleSlots({
      renderState,
      spacing,
      radius,
    }),
    [renderState],
  );
  const styles = useMemo(() => StyleSheet.create({
    container: {
      ...styleSlots.container,
    },
    label: {
      ...styleSlots.label,
    },
    subtitle: {
      ...styleSlots.subtitle,
    },
  }), [styleSlots]);
  const statusChipParts = createHandsFreeStatusChipMobilePropsParts({
    renderState,
    styles,
  });

  return (
    <View style={statusChipParts.container.style}>
      <Text style={statusChipParts.label.style}>{statusChipParts.label.text}</Text>
      {statusChipParts.subtitle ? (
        <Text
          style={statusChipParts.subtitle.style}
          numberOfLines={statusChipParts.subtitle.numberOfLines}
        >
          {statusChipParts.subtitle.text}
        </Text>
      ) : null}
    </View>
  );
}
