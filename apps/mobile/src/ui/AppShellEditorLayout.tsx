import type { ReactNode } from 'react';
import { useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  APP_SHELL_DIMENSIONS,
  resolveAppShellLayout,
} from '@dotagents/shared/app-shell';
import { spacing } from './theme';
import { useTheme } from './ThemeProvider';

type AppShellEditorLayoutProps = {
  title: string;
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
};

export function AppShellEditorLayout({
  title,
  children,
  contentContainerStyle,
  keyboardShouldPersistTaps = 'handled',
}: AppShellEditorLayoutProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isDesktopEditorLayout = resolveAppShellLayout(width) === 'desktop';

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.container,
          isDesktopEditorLayout && styles.desktopEditorContainer,
          contentContainerStyle,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      >
        {isDesktopEditorLayout && (
          <View style={styles.desktopEditorHeader}>
            <Text style={styles.desktopEditorTitle}>{title}</Text>
          </View>
        )}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    container: {
      padding: spacing.lg,
    },
    desktopEditorContainer: {
      maxWidth: APP_SHELL_DIMENSIONS.desktopContentMaxWidth,
      width: '100%' as const,
      alignSelf: 'center',
    },
    desktopEditorHeader: {
      paddingBottom: spacing.md,
      marginBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    desktopEditorTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.foreground,
    },
  });
}
