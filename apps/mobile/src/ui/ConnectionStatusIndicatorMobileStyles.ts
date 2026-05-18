import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';
import {
  createConnectionStatusIndicatorMobileStyleSheetSlots,
  getConnectionStatusIndicatorMobileRenderState,
  type ConnectionStatus,
  type ConnectionStatusIndicatorMobileStyleSheetSlots,
} from '@dotagents/shared/session-presentation';

export type ConnectionStatusIndicatorMobileStyleSlotsInput = {
  state: ConnectionStatus;
  retryCount: number;
  compact: boolean;
};

export type ConnectionStatusIndicatorStyles = ConnectionStatusIndicatorMobileStyleSheetSlots;

export type ConnectionStatusIndicatorMobileStyleSlots = {
  connectionStatusState: ReturnType<typeof getConnectionStatusIndicatorMobileRenderState>;
  styles: ConnectionStatusIndicatorStyles;
};

export function useConnectionStatusIndicatorMobileStyleSlots({
  state,
  retryCount,
  compact,
}: ConnectionStatusIndicatorMobileStyleSlotsInput): ConnectionStatusIndicatorMobileStyleSlots {
  const { theme } = useTheme();
  const connectionStatusState = useMemo(
    () => getConnectionStatusIndicatorMobileRenderState({
      status: state,
      retryCount,
      compact,
      colors: theme.colors,
    }),
    [compact, retryCount, state, theme.colors],
  );
  const connectionStatusStyleSheetSlots = useMemo(
    () => createConnectionStatusIndicatorMobileStyleSheetSlots({
      renderState: connectionStatusState,
    }),
    [connectionStatusState],
  );
  const styles = useMemo<ConnectionStatusIndicatorStyles>(
    () => StyleSheet.create({ ...connectionStatusStyleSheetSlots }),
    [connectionStatusStyleSheetSlots],
  );

  const connectionStatusStyleSlots = useMemo<ConnectionStatusIndicatorMobileStyleSlots>(
    () => ({
      connectionStatusState,
      styles,
    }),
    [connectionStatusState, styles],
  );

  return connectionStatusStyleSlots;
}
