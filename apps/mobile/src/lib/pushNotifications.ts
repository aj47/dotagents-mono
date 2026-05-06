/**
 * Simplified Push Notification Service for DotAgents mobile app.
 * 
 * Consolidated module that handles:
 * - Permission requests
 * - Push token management
 * - Server registration
 * - Notification response handling for deep linking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createExtendedSettingsApiClient } from './settingsApi';

const PUSH_TOKEN_KEY = 'push_token_v2';
const SERVER_REGISTERED_KEY = 'push_server_registered_v2';

// Configure how notifications are handled when the app is in foreground.
// Expo notifications APIs are not fully available on web.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export interface NotificationData {
  type?: 'message' | 'system';
  conversationId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

// ============================================
// Core Functions
// ============================================

/**
 * Check if push notifications are supported (requires physical device)
 */
export function isSupported(): boolean {
  return Platform.OS !== 'web' && Device.isDevice;
}

/**
 * Request notification permissions and configure Android channels
 */
async function requestPermissions(): Promise<boolean> {
  if (!isSupported()) return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return false;

  // Configure Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return true;
}

/**
 * Get Expo push token for this device
 */
async function getPushToken(): Promise<string | null> {
  if (!isSupported()) return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId
    ?? Constants.easConfig?.projectId;

  if (!projectId) {
    console.error('[Push] No EAS projectId configured');
    return null;
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, data);
    return data;
  } catch (error) {
    console.error('[Push] Failed to get token:', error);
    return null;
  }
}

/**
 * Get stored push token
 */
async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(PUSH_TOKEN_KEY);
}

/**
 * Register push token with the desktop server
 */
export async function registerWithServer(baseUrl: string, apiKey: string): Promise<boolean> {
  const granted = await requestPermissions();
  if (!granted) return false;

  const token = await getPushToken();
  if (!token) return false;

  try {
    const client = createExtendedSettingsApiClient(baseUrl, apiKey);
    await client.registerPushToken({
      token,
      type: 'expo',
      platform: Platform.OS as 'ios' | 'android',
    });
    await AsyncStorage.setItem(SERVER_REGISTERED_KEY, 'true');
    console.log('[Push] Registered with server');
    return true;
  } catch (error) {
    console.error('[Push] Registration error:', error);
    return false;
  }
}

/**
 * Unregister push token from the desktop server
 */
export async function unregisterFromServer(baseUrl: string, apiKey: string): Promise<boolean> {
  const token = await getStoredToken();
  if (!token) {
    await AsyncStorage.setItem(SERVER_REGISTERED_KEY, 'false');
    return true;
  }

  try {
    const client = createExtendedSettingsApiClient(baseUrl, apiKey);
    await client.unregisterPushToken(token);
    await AsyncStorage.setItem(SERVER_REGISTERED_KEY, 'false');
    console.log('[Push] Unregistered from server');
    return true;
  } catch (error) {
    console.error('[Push] Unregistration error:', error);
    return false;
  }
}

/**
 * Check if currently registered with server
 */
export async function isRegisteredWithServer(): Promise<boolean> {
  const value = await AsyncStorage.getItem(SERVER_REGISTERED_KEY);
  return value === 'true';
}

/**
 * Clear all notifications and badge (call when app opens)
 */
export async function clearNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.warn('[Push] Failed to clear notifications:', error);
  }
}

/**
 * Clear badge count on the server
 */
export async function clearServerBadge(baseUrl: string, apiKey: string): Promise<void> {
  const token = await getStoredToken();
  if (!token) return;

  try {
    const client = createExtendedSettingsApiClient(baseUrl, apiKey);
    await client.clearPushBadge(token);
  } catch (error) {
    console.warn('[Push] Failed to clear server badge:', error);
  }
}

// ============================================
// React Hook
// ============================================

export interface UsePushNotificationsResult {
  /** Whether push is supported on this device */
  isSupported: boolean;
  /** Current permission status */
  permissionStatus: Notifications.PermissionStatus | null;
  /** Whether registered with server */
  isRegistered: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Register for push notifications */
  register: (baseUrl: string, apiKey: string) => Promise<boolean>;
  /** Unregister from push notifications */
  unregister: (baseUrl: string, apiKey: string) => Promise<boolean>;
  /** Set handler for notification taps (for deep linking) */
  setOnNotificationTap: (handler: ((data: NotificationData) => void) | null) => void;
  /** Clear all notifications */
  clear: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const onTapRef = useRef<((data: NotificationData) => void) | null>(null);
  const pendingDataRef = useRef<NotificationData | null>(null);

  // Initialize state
  useEffect(() => {
    async function init() {
      if (!isSupported()) {
        setPermissionStatus(null);
        setIsRegistered(false);
        setIsLoading(false);
        return;
      }

      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);

      const registered = await isRegisteredWithServer();
      setIsRegistered(registered);

      setIsLoading(false);

      // Check if app was opened via notification tap
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse) {
        const data = lastResponse.notification.request.content.data as NotificationData;
        if (data) pendingDataRef.current = data;
      }
    }
    init();
  }, []);

  // Handle pending notification tap when handler is registered
  useEffect(() => {
    if (pendingDataRef.current && onTapRef.current) {
      const data = pendingDataRef.current;
      pendingDataRef.current = null;
      setTimeout(() => onTapRef.current?.(data), 300);
    }
  });

  // Set up notification tap listener
  useEffect(() => {
    if (!isSupported()) return;
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationData;
      if (data && onTapRef.current) {
        onTapRef.current(data);
      }
    });
    return () => subscription.remove();
  }, []);

  const register = useCallback(async (baseUrl: string, apiKey: string): Promise<boolean> => {
    if (!isSupported()) return false;
    setIsLoading(true);
    const success = await registerWithServer(baseUrl, apiKey);
    if (success) {
      setIsRegistered(true);
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    }
    setIsLoading(false);
    return success;
  }, []);

  const unregister = useCallback(async (baseUrl: string, apiKey: string): Promise<boolean> => {
    if (!isSupported()) {
      setIsRegistered(false);
      return true;
    }
    setIsLoading(true);
    const success = await unregisterFromServer(baseUrl, apiKey);
    if (success) setIsRegistered(false);
    setIsLoading(false);
    return success;
  }, []);

  const setOnNotificationTap = useCallback((handler: ((data: NotificationData) => void) | null) => {
    onTapRef.current = handler;
  }, []);

  const clear = useCallback(async () => {
    await clearNotifications();
  }, []);

  return {
    isSupported: isSupported(),
    permissionStatus,
    isRegistered,
    isLoading,
    register,
    unregister,
    setOnNotificationTap,
    clear,
  };
}
