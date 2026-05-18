import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  createHandsFreeStatusChipMobilePropsParts,
  createHandsFreeStatusChipMobileStyleSheetSlots,
  getHandsFreeStatusChipMobileRenderState,
  type HandsFreeStatusChipMobilePropsParts,
  type HandsFreeStatusChipMobileStyleSheetSlots,
  type HandsFreePhase,
} from '@dotagents/shared/session-presentation';
import { useTheme } from './ThemeProvider';
import { spacing, radius } from './theme';

type HandsFreeStatusChipProps = {
  phase: HandsFreePhase;
  label: string;
  subtitle?: string;
};

type HandsFreeStatusChipStyles = HandsFreeStatusChipMobileStyleSheetSlots;

type HandsFreeStatusChipParts =
  HandsFreeStatusChipMobilePropsParts<HandsFreeStatusChipStyles>;

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
  const styleSheetSlots = useMemo(
    () => createHandsFreeStatusChipMobileStyleSheetSlots({
      renderState,
      spacing,
      radius,
    }),
    [renderState],
  );
  const styles = useMemo<HandsFreeStatusChipStyles>(
    () => StyleSheet.create({ ...styleSheetSlots }),
    [styleSheetSlots],
  );
  const statusChipParts: HandsFreeStatusChipParts = createHandsFreeStatusChipMobilePropsParts({
    renderState,
    styles,
  });

  return (
    <View {...statusChipParts.container.props}>
      <Text {...statusChipParts.label.props}>{statusChipParts.label.text}</Text>
      {statusChipParts.subtitle ? (
        <Text {...statusChipParts.subtitle.props}>
          {statusChipParts.subtitle.text}
        </Text>
      ) : null}
    </View>
  );
}
