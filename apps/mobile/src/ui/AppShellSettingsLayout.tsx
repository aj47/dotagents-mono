import type { ReactNode } from 'react';
import { useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ScrollViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  APP_SHELL_DIMENSIONS,
  type AppShellSettingsNavItem,
  type AppShellSettingsNavItemId,
} from '@dotagents/shared/app-shell';
import { spacing, radius } from './theme';
import { useTheme } from './ThemeProvider';

type AppShellSettingsLayoutProps = {
  isDesktopLayout: boolean;
  navItems: AppShellSettingsNavItem[];
  activeNavItemId: AppShellSettingsNavItemId;
  onActivateNavItem: (itemId: AppShellSettingsNavItemId) => void;
  children: ReactNode;
  footer?: ReactNode;
  refreshControl?: ScrollViewProps['refreshControl'];
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
};

export function AppShellSettingsLayout({
  isDesktopLayout,
  navItems,
  activeNavItemId,
  onActivateNavItem,
  children,
  footer,
  refreshControl,
  keyboardShouldPersistTaps = 'handled',
}: AppShellSettingsLayoutProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const settingsSectionNavigation = isDesktopLayout ? (
    <View style={styles.desktopSidebar}>
      <Text style={styles.desktopSidebarTitle}>Settings</Text>
      <View style={styles.desktopSidebarList}>
        {navItems.map((item) => {
          const isActive = activeNavItemId === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.desktopSidebarItem,
                isActive && styles.desktopSidebarItemActive,
              ]}
              onPress={() => onActivateNavItem(item.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={item.label}
            >
              <Text
                style={[
                  styles.desktopSidebarItemText,
                  isActive && styles.desktopSidebarItemTextActive,
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  ) : null;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={isDesktopLayout ? styles.desktopBody : styles.mobileBody}>
        {settingsSectionNavigation}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.container,
            isDesktopLayout && styles.desktopContainer,
            { paddingBottom: insets.bottom + spacing['3xl'] + (footer ? 120 : 0) },
          ]}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      </View>

      {footer && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          {footer}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    mobileBody: {
      flex: 1,
    },
    desktopBody: {
      flex: 1,
      flexDirection: 'row',
      minWidth: 0,
    },
    scroll: {
      flex: 1,
      minWidth: 0,
    },
    container: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    desktopContainer: {
      maxWidth: APP_SHELL_DIMENSIONS.desktopContentMaxWidth,
      width: '100%' as const,
      alignSelf: 'stretch',
    },
    desktopSidebar: {
      width: APP_SHELL_DIMENSIONS.desktopSettingsNavWidth,
      flexShrink: 0,
      borderRightWidth: 1,
      borderRightColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.md,
    },
    desktopSidebarTitle: {
      color: theme.colors.mutedForeground,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginBottom: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    desktopSidebarList: {
      gap: 2,
    },
    desktopSidebarItem: {
      minHeight: APP_SHELL_DIMENSIONS.desktopNavItemMinHeight,
      justifyContent: 'center',
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
    },
    desktopSidebarItemActive: {
      backgroundColor: theme.colors.accent,
    },
    desktopSidebarItemText: {
      color: theme.colors.mutedForeground,
      fontSize: 13,
      fontWeight: '600',
    },
    desktopSidebarItemTextActive: {
      color: theme.colors.accentForeground,
    },
    footer: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: -2 },
      elevation: 8,
    },
  });
}
