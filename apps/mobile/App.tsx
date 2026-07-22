import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from './src/screens/SettingsScreen';
import ChatScreen from './src/screens/ChatScreen';
import SessionListScreen from './src/screens/SessionListScreen';
import ConnectionSettingsScreen from './src/screens/ConnectionSettingsScreen';
import OperationsScreen from './src/screens/OperationsScreen';
import AgentEditScreen from './src/screens/AgentEditScreen';
import KnowledgeNoteEditScreen from './src/screens/KnowledgeNoteEditScreen';
import LoopEditScreen from './src/screens/LoopEditScreen';
import SkillEditScreen from './src/screens/SkillEditScreen';
import { AppConfig, ConfigContext, useConfig, saveConfig } from './src/store/config';
import { SessionContext, useSessions } from './src/store/sessions';
import { MessageQueueContext, useMessageQueue } from './src/store/message-queue';
import { ConnectionManagerContext, useConnectionManagerProvider } from './src/store/connectionManager';
import { TunnelConnectionContext, useTunnelConnectionProvider } from './src/store/tunnelConnection';
import { ProfileContext, useProfileProvider } from './src/store/profile';
import { usePushNotifications, NotificationData, clearNotifications, clearServerBadge } from './src/lib/pushNotifications';
import { SettingsApiClient } from './src/lib/settingsApi';
import { pickPreferredWebGoogleVoice } from './src/lib/ttsVoices';
import {
  View,
  Image,
  Text,
  StyleSheet,
  AppState,
  AppStateStatus,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { ThemeProvider, useTheme } from './src/ui/ThemeProvider';
import type { Theme } from './src/ui/theme';
import { ConnectionStatusIndicator } from './src/ui/ConnectionStatusIndicator';
import { parseConnectionQrCode } from './src/screens/connection-settings-qr';
import {
  APP_SHELL_DIMENSIONS,
  APP_SHELL_PRIMARY_NAV_ITEMS,
  APP_SHELL_PRODUCT_LABEL,
  getMobilePrimaryNavItemId,
  resolveAppShellLayout,
  shouldHideMobileStackHeaderForDesktopShell,
  type AppShellPrimaryNavItem,
  type AppShellPrimaryNavItemId,
} from './src/ui/appShell';
import * as Linking from 'expo-linking';
import * as Speech from 'expo-speech';
import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { MentraProvider } from './src/mentra/MentraProvider';


const dotagentsIcon = require('./assets/dotagents-icon.png');
const darkSpinner = require('./assets/loading-spinner.gif');
const lightSpinner = require('./assets/light-spinner.gif');
const SESSION_SYNC_POLL_INTERVAL_MS = 15000;
const NOTIFICATION_SYNC_RETRY_DELAY_MS = 500;

const Stack = createNativeStackNavigator();

function parseDeepLink(url: string | null) {
  if (!url) return null;
  try {
    if (Platform.OS === 'web') {
      const parsedWebUrl = new URL(url);
      const baseUrl = parsedWebUrl.searchParams.get('baseUrl') || undefined;
      const apiKey = parsedWebUrl.searchParams.get('apiKey') || undefined;
      const model = parsedWebUrl.searchParams.get('model') || undefined;
      if (baseUrl || apiKey || model) {
        return { baseUrl, apiKey, model };
      }
    }

    return parseConnectionQrCode(url);
  } catch (e) {
    console.warn('Failed to parse deep link:', e);
  }
  return null;
}

function Navigation() {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const cfg = useConfig();
  const sessionStore = useSessions();
  const messageQueueStore = useMessageQueue();
  const navigationRef = useNavigationContainerRef();
  const isNavigationReady = useRef(false);
  const [iconFontsReady, setIconFontsReady] = useState(() => Font.isLoaded('ionicons'));
  const [currentRouteName, setCurrentRouteName] = useState('Sessions');
  const [selectedPrimaryNavItemId, setSelectedPrimaryNavItemId] =
    useState<AppShellPrimaryNavItemId | null>(null);
  const navigationStyles = useMemo(() => createNavigationStyles(theme), [theme]);
  const appShellLayout = resolveAppShellLayout(width);
  const isDesktopShell = appShellLayout === 'desktop';
  const activePrimaryNavItemId =
    currentRouteName === 'Settings' && selectedPrimaryNavItemId
      ? selectedPrimaryNavItemId
      : getMobilePrimaryNavItemId(currentRouteName);

  useEffect(() => {
    if (iconFontsReady) {
      return;
    }

    let mounted = true;
    Ionicons.loadFont()
      .catch((error) => {
        console.warn('[App] Failed to load Ionicons font:', error);
      })
      .finally(() => {
        if (mounted) {
          setIconFontsReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [iconFontsReady]);

  // Initialize tunnel connection manager for persistence and auto-reconnection
  const tunnelConnection = useTunnelConnectionProvider();

  // Initialize push notifications
  const pushNotifications = usePushNotifications();

  // Create connection manager config from app config
  const clientConfig = useMemo(() => ({
    baseUrl: cfg.config.baseUrl,
    apiKey: cfg.config.apiKey,
    model: cfg.config.model,
    recoveryConfig: {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      heartbeatIntervalMs: 30000,
    },
  }), [cfg.config.baseUrl, cfg.config.apiKey, cfg.config.model]);

  // Initialize connection manager with client config
  const connectionManager = useConnectionManagerProvider(clientConfig);

  // Initialize profile provider to track current profile from server
  const profileProvider = useProfileProvider(cfg.config.baseUrl, cfg.config.apiKey);

  // Create navigation theme that matches our theme
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.foreground,
      border: theme.colors.border,
      primary: theme.colors.primary,
    },
  };

  // Handle deep links
  useEffect(() => {
    if (!cfg.ready) return;

    const handleUrl = async (url: string | null) => {
      const params = parseDeepLink(url);
      if (params) {
        const newConfig = {
          ...cfg.config,
          ...(params.baseUrl && { baseUrl: params.baseUrl }),
          ...(params.apiKey && { apiKey: params.apiKey }),
          ...(params.model && { model: params.model }),
        };
        cfg.setConfig(newConfig);
        await saveConfig(newConfig);
        if (newConfig.baseUrl && newConfig.apiKey) {
          void tunnelConnection.connect(newConfig.baseUrl, newConfig.apiKey);
        } else {
          void tunnelConnection.disconnect();
        }
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history?.replaceState) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    };

    // Handle initial URL (app opened via deep link)
    Linking.getInitialURL().then(handleUrl);

    // Handle URL when app is already open
    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => subscription.remove();
  }, [cfg.ready]);

  // On Expo web in Chrome, default to the built-in free Google voice when available.
  useEffect(() => {
    if (!cfg.ready || Platform.OS !== 'web' || cfg.config.ttsVoiceId) {
      return;
    }

    let cancelled = false;

    const applyPreferredWebVoice = async () => {
      if (cancelled || cfg.config.ttsVoiceId) {
        return;
      }

      try {
        const availableVoices = await Speech.getAvailableVoicesAsync();
        const preferredVoice = pickPreferredWebGoogleVoice(availableVoices);
        if (!preferredVoice || cancelled) {
          return;
        }

        let nextConfig: AppConfig | null = null;
        cfg.setConfig((prev) => {
          if (prev.ttsVoiceId) {
            return prev;
          }
          nextConfig = {
            ...prev,
            ttsVoiceId: preferredVoice.identifier,
          };
          return nextConfig;
        });

        if (nextConfig) {
          await saveConfig(nextConfig);
        }
      } catch (error) {
        console.warn('[TTS] Failed to auto-select a Chrome Google voice:', error);
      }
    };

    const speechSynthesisApi = (globalThis as any).speechSynthesis;
    const handleVoicesChanged = () => {
      void applyPreferredWebVoice();
    };

    void applyPreferredWebVoice();
    speechSynthesisApi?.addEventListener?.('voiceschanged', handleVoicesChanged);

    return () => {
      cancelled = true;
      speechSynthesisApi?.removeEventListener?.('voiceschanged', handleVoicesChanged);
    };
  }, [cfg.ready, cfg.config.ttsVoiceId, cfg.setConfig]);

  const syncSessionsForNotificationTap = useCallback(async () => {
    if (!cfg.config.baseUrl || !cfg.config.apiKey) return;

    const client = new SettingsApiClient(cfg.config.baseUrl, cfg.config.apiKey);
    const result = await sessionStore.syncWithServer(client);
    if (result.errors.includes('Sync already in progress')) {
      await new Promise(resolve => setTimeout(resolve, NOTIFICATION_SYNC_RETRY_DELAY_MS));
      await sessionStore.syncWithServer(client);
    }
  }, [cfg.config.baseUrl, cfg.config.apiKey, sessionStore]);

  // Handle notification taps for deep linking to conversations
  const handleNotificationTap = useCallback(async (data: NotificationData) => {
    console.log('[App] Notification tapped:', data);
    if (!isNavigationReady.current) {
      console.log('[App] Navigation not ready, skipping notification navigation');
      return;
    }

    if (data.type === 'message' && (data.sessionId || data.conversationId)) {
      const findTargetSessionId = (): string | null => {
        if (
          typeof data.sessionId === 'string' &&
          sessionStore.sessions.some(session => session.id === data.sessionId)
        ) {
          return data.sessionId;
        }

        if (typeof data.conversationId === 'string') {
          const session = sessionStore.findSessionByServerConversationId(data.conversationId);
          return session?.id ?? null;
        }

        return null;
      };

      let targetSessionId = findTargetSessionId();
      if (!targetSessionId && data.conversationId) {
        await syncSessionsForNotificationTap().catch((error) => {
          console.warn('[App] Notification session sync failed:', error);
        });
        targetSessionId = findTargetSessionId();
      }

      if (targetSessionId) {
        sessionStore.setCurrentSession(targetSessionId);
        navigationRef.navigate('Chat' as never);
      } else {
        // No matching session found - navigate to sessions list
        navigationRef.navigate('Sessions' as never);
      }
    } else if (data.type === 'message') {
      // Navigate to sessions list if no specific session
      navigationRef.navigate('Sessions' as never);
    }
  }, [navigationRef, sessionStore, syncSessionsForNotificationTap]);

  const refreshCurrentRouteName = useCallback(() => {
    const routeName = navigationRef.getCurrentRoute()?.name;
    const nextRouteName = routeName || 'Sessions';
    setCurrentRouteName(nextRouteName);
    if (nextRouteName !== 'Settings') {
      setSelectedPrimaryNavItemId(null);
    }
  }, [navigationRef]);

  const handleDesktopNewChat = useCallback(() => {
    sessionStore.createNewSession();
    (navigationRef as any).navigate('Chat');
    setCurrentRouteName('Chat');
    setSelectedPrimaryNavItemId(null);
  }, [sessionStore, navigationRef]);

  const navigatePrimaryShellItem = useCallback((item: AppShellPrimaryNavItem) => {
    if (!isNavigationReady.current) return;
    setSelectedPrimaryNavItemId(item.id);
    (navigationRef as any).navigate(item.mobileRouteName, item.mobileRouteParams);
    setCurrentRouteName(item.mobileRouteName);
  }, [navigationRef]);

  const desktopShellRail = isDesktopShell ? (
    <View style={navigationStyles.desktopShellRail}>
      <View style={navigationStyles.desktopShellBrand}>
        <Image source={dotagentsIcon} style={navigationStyles.desktopShellLogo} resizeMode="contain" />
        <View style={navigationStyles.desktopShellBrandText}>
          <Text style={navigationStyles.desktopShellTitle}>{APP_SHELL_PRODUCT_LABEL}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleDesktopNewChat}
        style={navigationStyles.desktopShellNewChatButton}
        accessibilityRole="button"
        accessibilityLabel="New chat"
        accessibilityHint="Creates and opens a new chat."
      >
        <Text style={navigationStyles.desktopShellNewChatButtonText}>+ New Chat</Text>
      </TouchableOpacity>

      <View style={navigationStyles.desktopShellNav}>
        {APP_SHELL_PRIMARY_NAV_ITEMS.map((item) => {
          const isActive = activePrimaryNavItemId === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => navigatePrimaryShellItem(item)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: isActive }}
              style={[
                navigationStyles.desktopShellNavItem,
                isActive && navigationStyles.desktopShellNavItemActive,
              ]}
            >
              <Text
                style={[
                  navigationStyles.desktopShellNavText,
                  isActive && navigationStyles.desktopShellNavTextActive,
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={navigationStyles.desktopShellFooter}>
        <ConnectionStatusIndicator
          state={tunnelConnection.connectionInfo.state}
          retryCount={tunnelConnection.connectionInfo.retryCount}
          compact
        />
      </View>
    </View>
  ) : null;

  const compactShellPrimaryNav = !isDesktopShell ? (
    <View
      style={navigationStyles.compactShellPrimaryNav}
      accessibilityRole="tablist"
      accessibilityLabel="Primary navigation"
    >
      {APP_SHELL_PRIMARY_NAV_ITEMS.map((item) => {
        const isActive = activePrimaryNavItemId === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => navigatePrimaryShellItem(item)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={item.label}
            style={[
              navigationStyles.compactShellPrimaryNavItem,
              isActive && navigationStyles.compactShellPrimaryNavItemActive,
            ]}
          >
            <Text
              style={[
                navigationStyles.compactShellPrimaryNavText,
                isActive && navigationStyles.compactShellPrimaryNavTextActive,
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  ) : null;

  // Set up notification tap handler
  useEffect(() => {
    pushNotifications.setOnNotificationTap(handleNotificationTap);
    return () => pushNotifications.setOnNotificationTap(null);
  }, [handleNotificationTap, pushNotifications]);

  // Keep the desktop-side token registration fresh when the paired desktop URL changes.
  useEffect(() => {
    if (!cfg.ready || !pushNotifications.isSupported || !pushNotifications.isRegistered) return;
    if (!cfg.config.baseUrl || !cfg.config.apiKey) return;

    pushNotifications.register(cfg.config.baseUrl, cfg.config.apiKey).catch((error) => {
      console.warn('[App] Failed to refresh push registration:', error);
    });
  }, [
    cfg.ready,
    cfg.config.baseUrl,
    cfg.config.apiKey,
    pushNotifications.isSupported,
    pushNotifications.isRegistered,
    pushNotifications.register,
  ]);

  // Clear notifications when app becomes active (including from background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && cfg.ready) {
        // Clear badge when user opens the app or brings it to foreground
        clearNotifications();
        // Also clear badge count on server if connected
        if (cfg.config.baseUrl && cfg.config.apiKey) {
          clearServerBadge(cfg.config.baseUrl, cfg.config.apiKey).catch((err) => {
            console.warn('[App] Failed to clear server badge count:', err);
          });
        }
      }
    };

    // Also clear immediately if app is already active and config is ready
    if (cfg.ready) {
      clearNotifications();
      if (cfg.config.baseUrl && cfg.config.apiKey) {
        clearServerBadge(cfg.config.baseUrl, cfg.config.apiKey).catch((err) => {
          console.warn('[App] Failed to clear server badge count:', err);
        });
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [cfg.ready, cfg.config.baseUrl, cfg.config.apiKey]);

  // Auto-sync sessions with desktop server
  useEffect(() => {
    if (!cfg.ready || !sessionStore.ready) return;
    if (!cfg.config.baseUrl || !cfg.config.apiKey) return;

    const client = new SettingsApiClient(cfg.config.baseUrl, cfg.config.apiKey);
    let appState: AppStateStatus = AppState.currentState;
    let pollIntervalId: ReturnType<typeof setInterval> | null = null;
    let isSyncInFlight = false;
    let isCancelled = false;

    const runSync = async (source: 'initial' | 'foreground' | 'poll') => {
      if (isCancelled || isSyncInFlight) return;
      isSyncInFlight = true;
      try {
        const result = await sessionStore.syncWithServer(client);
        const actionableErrors = result.errors.filter((error) => error !== 'Sync already in progress');
        if (actionableErrors.length > 0 && source !== 'poll') {
          console.warn(`[App] ${source} session sync had errors:`, actionableErrors.join('; '));
        }
      } catch (err) {
        if (source !== 'poll') {
          console.warn(`[App] ${source} session sync failed:`, err);
        }
      } finally {
        isSyncInFlight = false;
      }
    };

    const stopPolling = () => {
      if (pollIntervalId) {
        clearInterval(pollIntervalId);
        pollIntervalId = null;
      }
    };

    const startPolling = () => {
      if (pollIntervalId) return;
      pollIntervalId = setInterval(() => {
        if (appState === 'active') {
          void runSync('poll');
        }
      }, SESSION_SYNC_POLL_INTERVAL_MS);
    };

    // Sync immediately, then keep polling while app is active.
    void runSync('initial');
    if (appState === 'active') {
      startPolling();
    }

    // Sync when app returns to foreground
    const handleAppStateForSync = (nextAppState: AppStateStatus) => {
      appState = nextAppState;
      if (nextAppState === 'active') {
        void runSync('foreground');
        startPolling();
      } else {
        stopPolling();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateForSync);
    return () => {
      isCancelled = true;
      stopPolling();
      subscription.remove();
    };
  }, [cfg.ready, cfg.config.baseUrl, cfg.config.apiKey, sessionStore.ready, sessionStore.syncWithServer]);

  if (!iconFontsReady || !cfg.ready || !sessionStore.ready) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Image
          source={isDark ? darkSpinner : lightSpinner}
          style={styles.spinner}
          resizeMode="contain"
        />
        <Text style={[styles.loadingText, { color: theme.colors.mutedForeground }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <ConfigContext.Provider value={cfg}>
      <MentraProvider>
        <ProfileContext.Provider value={profileProvider}>
        <SessionContext.Provider value={sessionStore}>
          <MessageQueueContext.Provider value={messageQueueStore}>
            <ConnectionManagerContext.Provider value={connectionManager}>
              <TunnelConnectionContext.Provider value={tunnelConnection}>
                <NavigationContainer
                  ref={navigationRef}
                  theme={navTheme}
                  onReady={() => {
                    isNavigationReady.current = true;
                    refreshCurrentRouteName();
                  }}
                  onStateChange={refreshCurrentRouteName}
                >
                  <View style={isDesktopShell ? navigationStyles.desktopShell : navigationStyles.mobileShell}>
                    {desktopShellRail}
                    <View style={isDesktopShell ? navigationStyles.desktopShellContent : navigationStyles.mobileShellContent}>
                      <Stack.Navigator
                        initialRouteName="Sessions"
                        screenOptions={({ route }) => ({
                          headerShown: !isDesktopShell || !shouldHideMobileStackHeaderForDesktopShell(route.name),
                          headerTitleStyle: { ...theme.typography.h2 },
                          headerStyle: { backgroundColor: theme.colors.card },
                          headerTintColor: theme.colors.foreground,
                          contentStyle: { backgroundColor: theme.colors.background },
                          headerRight: () => (
                            <ConnectionStatusIndicator
                              state={tunnelConnection.connectionInfo.state}
                              retryCount={tunnelConnection.connectionInfo.retryCount}
                              compact
                            />
                          ),
                        })}
                      >
                        <Stack.Screen
                          name="Settings"
                          component={SettingsScreen}
                          options={({ navigation }) => ({
                            title: 'DotAgents',
                            presentation: 'modal',
                            headerLeft: () => (
                              <TouchableOpacity
                                onPress={() => {
                                  if (navigation.canGoBack()) {
                                    navigation.goBack();
                                    return;
                                  }

                                  navigation.navigate('Sessions');
                                }}
                                accessibilityRole="button"
                                accessibilityLabel="Close settings"
                                style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                              >
                                <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
                                  Close
                                </Text>
                              </TouchableOpacity>
                            ),
                          })}
                        />
                        <Stack.Screen
                          name="ConnectionSettings"
                          component={ConnectionSettingsScreen}
                          options={{ title: 'Connection' }}
                        />
                        <Stack.Screen
                          name="Operations"
                          component={OperationsScreen}
                          options={{ title: 'Operations' }}
                        />
                        <Stack.Screen
                          name="Sessions"
                          component={SessionListScreen}
                          options={{ title: 'Chats' }}
                        />
                        <Stack.Screen name="Chat" component={ChatScreen} />
                        <Stack.Screen
                          name="AgentEdit"
                          component={AgentEditScreen}
                          options={{ title: 'Agent' }}
                        />
                        <Stack.Screen
                          name="KnowledgeNoteEdit"
                          component={KnowledgeNoteEditScreen}
                          options={{ title: 'Note' }}
                        />
                        <Stack.Screen
                          name="LoopEdit"
                          component={LoopEditScreen}
                          options={{ title: 'Loop' }}
                        />
                        <Stack.Screen
                          name="SkillEdit"
                          component={SkillEditScreen}
                          options={{ title: 'Skill' }}
                        />
                      </Stack.Navigator>
                    </View>
                    {compactShellPrimaryNav}
                  </View>
                </NavigationContainer>
              </TunnelConnectionContext.Provider>
            </ConnectionManagerContext.Provider>
          </MessageQueueContext.Provider>
        </SessionContext.Provider>
        </ProfileContext.Provider>
      </MentraProvider>
    </ConfigContext.Provider>
  );
}

function Root() {
  return <Navigation />;
}

function StatusBarWrapper() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

function createNavigationStyles(theme: Theme) {
  return StyleSheet.create({
    mobileShell: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    mobileShellContent: {
      flex: 1,
      minWidth: 0,
    },
    compactShellPrimaryNav: {
      minHeight: APP_SHELL_DIMENSIONS.compactPrimaryNavHeight,
      flexDirection: 'row',
      gap: 4,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    compactShellPrimaryNavItem: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 6,
      paddingHorizontal: 4,
      paddingVertical: 6,
    },
    compactShellPrimaryNavItemActive: {
      backgroundColor: theme.colors.accent,
    },
    compactShellPrimaryNavText: {
      maxWidth: '100%',
      color: theme.colors.mutedForeground,
      fontSize: 10,
      fontWeight: '600',
    },
    compactShellPrimaryNavTextActive: {
      color: theme.colors.accentForeground,
    },
    desktopShell: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
    },
    desktopShellRail: {
      width: APP_SHELL_DIMENSIONS.desktopRailWidth,
      flexShrink: 0,
      borderRightWidth: 1,
      borderRightColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      paddingHorizontal: APP_SHELL_DIMENSIONS.desktopRailHorizontalPadding,
      paddingTop: 14,
      paddingBottom: APP_SHELL_DIMENSIONS.desktopRailVerticalPadding,
    },
    desktopShellBrand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 6,
      paddingBottom: 14,
    },
    desktopShellLogo: {
      width: 26,
      height: 26,
      borderRadius: 7,
    },
    desktopShellBrandText: {
      flex: 1,
      minWidth: 0,
    },
    desktopShellTitle: {
      color: theme.colors.foreground,
      fontSize: 14,
      fontWeight: '700',
    },
    desktopShellNewChatButton: {
      marginBottom: 10,
      backgroundColor: theme.colors.accent,
      borderRadius: 6,
      paddingVertical: 8,
      paddingHorizontal: 10,
      alignItems: 'center',
    },
    desktopShellNewChatButtonText: {
      color: theme.colors.accentForeground,
      fontSize: 13,
      fontWeight: '600',
    },
    desktopShellNav: {
      gap: 4,
    },
    desktopShellNavItem: {
      minHeight: APP_SHELL_DIMENSIONS.desktopNavItemMinHeight,
      justifyContent: 'center',
      borderRadius: 6,
      paddingHorizontal: 10,
    },
    desktopShellNavItemActive: {
      backgroundColor: theme.colors.accent,
    },
    desktopShellNavText: {
      color: theme.colors.mutedForeground,
      fontSize: 13,
      fontWeight: '600',
    },
    desktopShellNavTextActive: {
      color: theme.colors.accentForeground,
    },
    desktopShellFooter: {
      marginTop: 'auto',
      paddingHorizontal: 6,
      paddingTop: 12,
    },
    desktopShellContent: {
      flex: 1,
      minWidth: 0,
      backgroundColor: theme.colors.background,
    },
  });
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 48,
    height: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBarWrapper />
        <Root />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
