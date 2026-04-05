import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Modal, TouchableOpacity, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppConfig, saveConfig, useConfigContext } from '../store/config';
import { useTheme } from '../ui/ThemeProvider';
import { spacing, radius } from '../ui/theme';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Linking from 'expo-linking';
import { checkDotAgentsServerConnection } from '../lib/connectionRecovery';
import { useTunnelConnection } from '../store/tunnelConnection';
import {
  createButtonAccessibilityLabel,
  createMinimumTouchTargetStyle,
  createTextInputAccessibilityLabel,
} from '../lib/accessibility';
import { resolveQrScannerActivation } from './connection-settings-qr';

function parseQRCode(data: string): { baseUrl?: string; apiKey?: string } | null {
  try {
    const parsed = Linking.parse(data);
    // Handle dotagents://config?baseUrl=...&apiKey=...
    if (parsed.scheme === 'dotagents' && (parsed.path === 'config' || parsed.hostname === 'config')) {
      const { baseUrl, apiKey } = parsed.queryParams || {};
      if (baseUrl || apiKey) {
        return {
          baseUrl: typeof baseUrl === 'string' ? baseUrl : undefined,
          apiKey: typeof apiKey === 'string' ? apiKey : undefined,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse QR code:', e);
  }
  return null;
}

export default function ConnectionSettingsScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { config, setConfig, ready } = useConfigContext();
  const [draft, setDraft] = useState<AppConfig>(config);
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const { connect: tunnelConnect, disconnect: tunnelDisconnect, connectionInfo } = useTunnelConnection();
  const autoOpenScannerHandledRef = useRef(false);

  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    setDraft(config);
  }, [ready, config]);

  // Clear connection error when draft changes
  useEffect(() => {
    if (connectionError) {
      setConnectionError(null);
    }
  }, [draft.baseUrl, draft.apiKey]);

  const onSave = async () => {
    let normalizedDraft = {
      ...draft,
      baseUrl: draft.baseUrl?.trim?.() ?? '',
      apiKey: draft.apiKey?.trim?.() ?? '',
    };

    // Clear any previous error
    setConnectionError(null);

    if (!normalizedDraft.baseUrl || !normalizedDraft.apiKey) {
      setConnectionError('Scan a DotAgents QR code or enter both a DotAgents server URL and API key before saving.');
      return;
    }

    setIsCheckingConnection(true);

    try {
      const result = await checkDotAgentsServerConnection(
        normalizedDraft.baseUrl,
        normalizedDraft.apiKey,
        10000
      );

      if (!result.success) {
        setConnectionError(result.error || 'Connection failed');
        setIsCheckingConnection(false);
        return;
      }

      if (result.normalizedUrl) {
        normalizedDraft = {
          ...normalizedDraft,
          baseUrl: result.normalizedUrl,
        };
      }

      console.log('[ConnectionSettings] Connection check successful:', result);
    } catch (error: any) {
      console.error('[ConnectionSettings] Connection check error:', error);
      setConnectionError(error.message || 'Connection check failed');
      setIsCheckingConnection(false);
      return;
    }

    setIsCheckingConnection(false);

    // Connection successful, proceed
    setConfig(normalizedDraft);
    await saveConfig(normalizedDraft);

    // Connect tunnel for persistence
    if (normalizedDraft.baseUrl && normalizedDraft.apiKey) {
      tunnelConnect(normalizedDraft.baseUrl, normalizedDraft.apiKey).catch((error) => {
        console.warn('[ConnectionSettings] Tunnel connect failed (non-blocking):', error);
      });
    } else {
      tunnelDisconnect().catch((error) => {
        console.warn('[ConnectionSettings] Tunnel disconnect failed (non-blocking):', error);
      });
    }

    navigation.goBack();
  };

  const handleScanQR = useCallback(async () => {
    setConnectionError(null);

    const qrPermissionError = await resolveQrScannerActivation({
      hasPermission: permission?.granted === true,
      isWeb: Platform.OS === 'web',
      requestPermission,
    });

    if (qrPermissionError) {
      setConnectionError(qrPermissionError);
      return;
    }

    setScanned(false);
    setShowScanner(true);
  }, [permission?.granted, requestPermission]);

  useEffect(() => {
    if (!route?.params?.openScanner) {
      autoOpenScannerHandledRef.current = false;
      return;
    }

    if (autoOpenScannerHandledRef.current) {
      return;
    }

    autoOpenScannerHandledRef.current = true;
    void handleScanQR();
    navigation.setParams({ openScanner: undefined });
  }, [handleScanQR, navigation, route?.params?.openScanner]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    const params = parseQRCode(data);
    if (params) {
      setDraft(prev => ({
        ...prev,
        ...(params.baseUrl && { baseUrl: params.baseUrl }),
        ...(params.apiKey && { apiKey: params.apiKey }),
      }));
      setShowScanner(false);
    } else {
      // Invalid QR code, allow scanning again
      setTimeout(() => setScanned(false), 2000);
    }
  };

  const isConnected = connectionInfo.state === 'connected';
  const statusTitle = connectionInfo.state === 'connecting' || connectionInfo.state === 'reconnecting'
    ? 'Connecting to DotAgents'
    : connectionInfo.state === 'failed'
      ? 'Connection failed'
      : isConnected
        ? 'Connected to DotAgents'
        : 'Not connected';
  const statusUrl = connectionInfo.baseUrl || config.baseUrl;

  if (!ready) return null;

  return (
    <>
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.md }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Connection Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, isConnected ? styles.statusConnected : styles.statusDisconnected]} />
            <Text style={styles.statusText}>
              {statusTitle}
            </Text>
          </View>
          {!!statusUrl && (
            <Text style={styles.statusUrl} numberOfLines={1}>
              {statusUrl}
            </Text>
          )}
        </View>

        {connectionError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{connectionError}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.scanButton} onPress={handleScanQR} accessibilityRole="button" accessibilityLabel="Scan QR Code">
          <Text style={styles.scanButtonText}>Scan QR Code</Text>
        </TouchableOpacity>
        <Text style={styles.helperText}>
          Scan the QR code from your DotAgents desktop app to pair this device.
        </Text>

        <View style={styles.labelRow}>
          <Text style={styles.label}>API Key</Text>
          <TouchableOpacity
            onPress={() => setShowApiKey(!showApiKey)}
            style={styles.inlineActionButton}
            accessibilityRole="button"
            accessibilityLabel={createButtonAccessibilityLabel(showApiKey ? 'Hide API key' : 'Show API key')}
            accessibilityHint={showApiKey ? 'Hides your API key characters' : 'Reveals your API key characters'}
          >
            <Text style={styles.resetText}>{showApiKey ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          value={draft.apiKey}
          onChangeText={(t) => setDraft({ ...draft, apiKey: t })}
          placeholder="sk-..."
          placeholderTextColor={theme.colors.mutedForeground}
          accessibilityLabel={createTextInputAccessibilityLabel('API key')}
          accessibilityHint="Enter the API key for your DotAgents server"
          autoCapitalize='none'
          secureTextEntry={!showApiKey}
        />

        <Text style={styles.label}>DotAgents Server URL</Text>
        <TextInput
          style={styles.input}
          value={draft.baseUrl}
          onChangeText={(t) => setDraft({ ...draft, baseUrl: t })}
          placeholder='https://your-server.example.com/v1'
          placeholderTextColor={theme.colors.mutedForeground}
          accessibilityLabel={createTextInputAccessibilityLabel('DotAgents server URL')}
          accessibilityHint="Enter the base URL for your DotAgents server"
          autoCapitalize='none'
        />
        <Text style={styles.helperText}>
          Use this if you are connecting to a DotAgents server directly instead of scanning a QR code.
        </Text>

        <TouchableOpacity
          style={[styles.primaryButton, isCheckingConnection && styles.primaryButtonDisabled]}
          onPress={onSave}
          disabled={isCheckingConnection}
          accessibilityRole="button"
          accessibilityLabel={isCheckingConnection ? 'Testing DotAgents connection' : 'Test and save DotAgents connection'}
        >
          {isCheckingConnection ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={theme.colors.primaryForeground} size="small" />
              <Text style={styles.primaryButtonText}>  Testing DotAgents connection...</Text>
            </View>
          ) : (
            <Text style={styles.primaryButtonText}>Test & Save</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>

      <Modal visible={showScanner} animationType="slide" onRequestClose={() => setShowScanner(false)}>
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleBarCodeScanned}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
            <Text style={styles.scannerText}>
              {scanned ? 'Invalid QR code format' : 'Scan a DotAgents QR code'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowScanner(false)}
            accessibilityRole="button"
            accessibilityLabel="Close QR scanner"
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    statusCard: {
      backgroundColor: theme.colors.card,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    statusConnected: {
      backgroundColor: '#22c55e',
    },
    statusDisconnected: {
      backgroundColor: '#ef4444',
    },
    statusText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.foreground,
    },
    statusUrl: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
      marginTop: spacing.xs,
    },
    label: {
      ...theme.typography.label,
      marginTop: spacing.sm,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    inlineActionButton: {
      ...createMinimumTouchTargetStyle({
        minSize: 44,
        horizontalPadding: spacing.sm,
        verticalPadding: spacing.xs,
        horizontalMargin: 0,
      }),
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resetText: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    helperText: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
      marginTop: -spacing.xs,
    },
    input: {
      ...theme.input,
    },
    scanButton: {
      backgroundColor: theme.colors.secondary,
      padding: spacing.md,
      borderRadius: radius.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    scanButtonText: {
      color: theme.colors.foreground,
      fontSize: 16,
      fontWeight: '500',
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      padding: spacing.md,
      borderRadius: radius.lg,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    primaryButtonDisabled: {
      opacity: 0.7,
    },
    primaryButtonText: {
      color: theme.colors.primaryForeground,
      fontSize: 16,
      fontWeight: '600',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorContainer: {
      backgroundColor: theme.colors.destructive + '20',
      borderWidth: 1,
      borderColor: theme.colors.destructive,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    errorText: {
      color: theme.colors.destructive,
      fontSize: 14,
      textAlign: 'center',
    },
    scannerContainer: {
      flex: 1,
      backgroundColor: '#000',
    },
    camera: {
      flex: 1,
    },
    scannerOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scannerFrame: {
      width: 250,
      height: 250,
      borderWidth: 2,
      borderColor: '#fff',
      borderRadius: radius.xl,
      backgroundColor: 'transparent',
    },
    scannerText: {
      color: '#fff',
      fontSize: 16,
      marginTop: 20,
      textAlign: 'center',
    },
    closeButton: {
      position: 'absolute',
      top: 60,
      right: 20,
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: 12,
      borderRadius: radius.lg,
    },
    closeButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
