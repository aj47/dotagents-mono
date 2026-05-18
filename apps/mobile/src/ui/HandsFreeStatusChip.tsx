import { useMemo } from 'react';
import { View, Text, StyleSheet, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import {
  createHandsFreeStatusChipMobilePropsParts,
  createHandsFreeStatusChipMobileStyleSlots,
  getHandsFreeStatusChipMobileRenderState,
  type HandsFreeStatusChipMobilePropsParts,
  type HandsFreeStatusChipMobileStylesLike,
  type HandsFreePhase,
} from '@dotagents/shared/session-presentation';
import { useTheme } from './ThemeProvider';
import { spacing, radius } from './theme';

type HandsFreeStatusChipProps = {
  phase: HandsFreePhase;
  label: string;
  subtitle?: string;
};

type HandsFreeStatusChipStyles =
  HandsFreeStatusChipMobileStylesLike<
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>
  >;

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
  const styleSlots = useMemo(
    () => createHandsFreeStatusChipMobileStyleSlots({
      renderState,
      spacing,
      radius,
    }),
    [renderState],
  );
  const styles = useMemo<HandsFreeStatusChipStyles>(() => StyleSheet.create({
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
