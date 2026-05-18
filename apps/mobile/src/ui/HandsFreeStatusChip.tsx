import { View, Text } from 'react-native';
import {
  createHandsFreeStatusChipMobilePropsParts,
  type HandsFreeStatusChipMobilePropsParts,
  type HandsFreeStatusChipMobileStyleSheetSlots,
  type HandsFreePhase,
} from '@dotagents/shared/session-presentation';
import { useChatRuntimeHandsFreeStatusChipMobileStyleSlots } from './ChatRuntimeMobileStyles';

type HandsFreeStatusChipProps = {
  phase: HandsFreePhase;
  label: string;
  subtitle?: string;
};

type HandsFreeStatusChipStyles = HandsFreeStatusChipMobileStyleSheetSlots;

type HandsFreeStatusChipParts =
  HandsFreeStatusChipMobilePropsParts<HandsFreeStatusChipStyles>;

export function HandsFreeStatusChip({ phase, label, subtitle }: HandsFreeStatusChipProps) {
  const {
    handsFreeStatusChipRenderState,
    handsFreeStatusChipStyles,
  } = useChatRuntimeHandsFreeStatusChipMobileStyleSlots({
    phase,
    label,
    subtitle,
  });
  const statusChipParts: HandsFreeStatusChipParts = createHandsFreeStatusChipMobilePropsParts({
    renderState: handsFreeStatusChipRenderState,
    styles: handsFreeStatusChipStyles,
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
