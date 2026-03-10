import { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Modal, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppConfig, saveConfig, useConfigContext } from '../store/config';
import { useTheme } from '../ui/ThemeProvider';
import { spacing, radius } from '../ui/theme';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Linking from 'expo-linking';
import { checkServerConnection } from '../lib/connectionRecovery';
import { useTunnelConnection } from '../store/tunnelConnection';
import {
  createButtonAccessibilityLabel,
  createMinimumTouchTargetStyle,
  createTextInputAccessibilityLabel,
} from '../lib/accessibility';

const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';

type ParsedQrConfig = { baseUrl?: string; apiKey?: string; model?: string };

function parseQRCode(data: string): ParsedQrConfig | null {
  try {
    const parsed = Linking.parse(data);
    // Handle dotagents://config?baseUrl=...&apiKey=...&model=...
    if (parsed.scheme === 'dotagents' && (parsed.path === 'config' || parsed.hostname === 'config')) {
      const { baseUrl, apiKey, model } = parsed.queryParams || {};
      if (baseUrl || apiKey || model) {
        return {
          baseUrl: typeof baseUrl === 'string' ? baseUrl : undefined,
          apiKey: typeof apiKey === 'string' ? apiKey : undefined,
          model: typeof model === 'string' ? model : undefined,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse QR code:', e);
  }
  return null;
}

export default function ConnectionSettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { config, setConfig, ready } = useConfigContext();
  const [draft, setDraft] = useState<AppConfig>(config);
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualConfigLink, setManualConfigLink] = useState('');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const { connect: tunnelConnect, disconnect: tunnelDisconnect } = useTunnelConnection();

  const styles = useMemo(() => createStyles(theme), [theme]);

  const closeScanner = useCallback(() => {
    setShowScanner(false);
    setScanned(false);
    setManualConfigLink('');
    setScannerError(null);
  }, []);

  const applyParsedQrConfig = useCallback((params: ParsedQrConfig) => {
    setDraft(prev => ({
      ...prev,
      ...(params.baseUrl && { baseUrl: params.baseUrl }),
      ...(params.apiKey && { apiKey: params.apiKey }),
      ...(params.model && { model: params.model }),
    }));
    closeScanner();
  }, [closeScanner]);

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

    // Default to OpenAI URL if baseUrl is empty
    if (!normalizedDraft.baseUrl) {
      normalizedDraft.baseUrl = DEFAULT_OPENAI_BASE_URL;
    }

    const hasCustomUrl = normalizedDraft.baseUrl && normalizedDraft.baseUrl.replace(/\/+$/, '') !== DEFAULT_OPENAI_BASE_URL;
    const hasApiKey = normalizedDraft.apiKey && normalizedDraft.apiKey.length > 0;

    // On first-time setup, do not silently save a disconnected default config.
    if (!isConnected && !hasApiKey) {
      setConnectionError('Enter an API key or scan a DotAgents QR code before saving');
      return;
    }

    // Require API key when using a custom server URL
    if (hasCustomUrl && !hasApiKey) {
      setConnectionError('API Key is required when using a custom server URL');
      return;
    }

    // Validate: if API key is set, base URL must also be set
    if (hasApiKey && !normalizedDraft.baseUrl) {
      setConnectionError('Base URL is required when an API key is provided');
      return;
    }

    // Only check connection if we have both a custom URL and API key
    if (hasApiKey && normalizedDraft.baseUrl) {
      setIsCheckingConnection(true);

      try {
        const result = await checkServerConnection(
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
    }

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

  const handleScanQR = async () => {
    setScanned(false);
    setManualConfigLink('');
    setScannerError(null);

    if (Platform.OS === 'web') {
      setShowScanner(true);
      return;
    }

    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        return;
      }
    }
    setShowScanner(true);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    const params = parseQRCode(data);
    if (params) {
      applyParsedQrConfig(params);
    } else {
      setScannerError('Invalid QR code format. Scan the DotAgents desktop QR code or paste the copied deep link instead.');
      // Invalid QR code, allow scanning again
      setTimeout(() => setScanned(false), 2000);
    }
  };

  const handleApplyManualConfigLink = useCallback(() => {
    const params = parseQRCode(manualConfigLink.trim());
    if (params) {
      applyParsedQrConfig(params);
      return;
    }
    setScannerError('Paste the full dotagents://config deep link copied from DotAgents desktop.');
  }, [applyParsedQrConfig, manualConfigLink]);

  const resetBaseUrl = () => {
    setDraft(prev => ({ ...prev, baseUrl: DEFAULT_OPENAI_BASE_URL }));
  };

  // Connection status indicator
  const isConnected = Boolean(config.baseUrl && config.apiKey);

  if (!ready) return null;

  return (
    <>
      <ScrollView
        style={{ backgroundColor: theme.colors.background }}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.md }]}
      >
        {/* Connection Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, isConnected ? styles.statusConnected : styles.statusDisconnected]} />
            <Text style={styles.statusText}>
              {isConnected ? 'Connected' : 'Not connected'}
            </Text>
          </View>
          {isConnected && (
            <Text style={styles.statusUrl} numberOfLines={1}>
              {config.baseUrl}
            </Text>
          )}
        </View>

        {connectionError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{connectionError}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.scanButton} onPress={handleScanQR} accessibilityRole="button" accessibilityLabel="Scan QR Code">
          <Text style={styles.scanButtonText}>{Platform.OS === 'web' ? 'Scan QR Code or Paste Link' : 'Scan QR Code'}</Text>
        </TouchableOpacity>
        <Text style={styles.helperText}>
          {Platform.OS === 'web'
            ? 'Use the desktop QR code to connect. On web, you can also paste the copied desktop deep link if camera scanning is unavailable.'
            : 'Scan the QR code from your DotAgents desktop app to connect'}
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
          accessibilityHint="Enter your API key used to connect to your model provider"
          autoCapitalize='none'
          secureTextEntry={!showApiKey}
        />

        <View style={styles.labelRow}>
          <Text style={styles.label}>Base URL</Text>
          <TouchableOpacity
            onPress={resetBaseUrl}
            style={styles.inlineActionButton}
            accessibilityRole="button"
            accessibilityLabel={createButtonAccessibilityLabel('Reset base URL to default')}
            accessibilityHint="Restores the default OpenAI-compatible base URL"
          >
            <Text style={styles.resetText}>Reset to default</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          value={draft.baseUrl}
          onChangeText={(t) => setDraft({ ...draft, baseUrl: t })}
          placeholder='https://api.openai.com/v1'
          placeholderTextColor={theme.colors.mutedForeground}
          accessibilityLabel={createTextInputAccessibilityLabel('Base URL')}
          accessibilityHint="Enter the base URL for your OpenAI-compatible server"
          autoCapitalize='none'
        />

        <TouchableOpacity
          style={[styles.primaryButton, isCheckingConnection && styles.primaryButtonDisabled]}
          onPress={onSave}
          disabled={isCheckingConnection}
          accessibilityRole="button"
          accessibilityLabel={isCheckingConnection ? 'Testing connection' : 'Test & Save'}
        >
          {isCheckingConnection ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={theme.colors.primaryForeground} size="small" />
              <Text style={styles.primaryButtonText}>  Testing connection...</Text>
            </View>
          ) : (
            <Text style={styles.primaryButtonText}>Test & Save</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showScanner} animationType="slide" onRequestClose={closeScanner}>
        {Platform.OS === 'web' ? (
          <ScrollView
            style={styles.scannerFallbackScreen}
            contentContainerStyle={[styles.scannerFallbackContent, { paddingBottom: insets.bottom + spacing.lg }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.scannerFallbackCard}>
              <Text style={styles.scannerFallbackTitle}>Paste the desktop deep link</Text>
              <Text style={styles.scannerFallbackBody}>
                Expo Web cannot reliably use the QR camera in every browser. In DotAgents desktop, open Remote Server, choose Copy Deep Link, then paste it here to fill your Base URL and API key.
              </Text>
              <Text style={styles.label}>Desktop deep link</Text>
              <TextInput
                style={styles.scannerFallbackInput}
                value={manualConfigLink}
                onChangeText={(value) => {
                  setManualConfigLink(value);
                  if (scannerError) {
                    setScannerError(null);
                  }
                }}
                placeholder="dotagents://config?baseUrl=...&apiKey=..."
                placeholderTextColor={theme.colors.mutedForeground}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel={createTextInputAccessibilityLabel('Desktop connection deep link')}
                accessibilityHint="Paste the DotAgents desktop deep link to auto-fill the connection fields"
              />
              {scannerError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{scannerError}</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleApplyManualConfigLink}
                accessibilityRole="button"
                accessibilityLabel="Apply desktop deep link"
              >
                <Text style={styles.primaryButtonText}>Apply Link</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.fallbackCloseButton}
                onPress={closeScanner}
                accessibilityRole="button"
                accessibilityLabel="Close QR scanner"
              >
                <Text style={styles.fallbackCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
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
              {scannerError && <Text style={styles.scannerSubtext}>{scannerError}</Text>}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeScanner}
              accessibilityRole="button"
              accessibilityLabel="Close QR scanner"
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
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
      ...createMinimumTouchTargetStyle({
        minSize: 44,
        horizontalPadding: spacing.md,
        verticalPadding: spacing.sm,
        horizontalMargin: 0,
      }),
      backgroundColor: theme.colors.secondary,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
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
    scannerSubtext: {
      color: '#fff',
      fontSize: 13,
      lineHeight: 18,
      marginTop: spacing.sm,
      marginHorizontal: spacing.xl,
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
    scannerFallbackScreen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scannerFallbackContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: spacing.lg,
    },
    scannerFallbackCard: {
      backgroundColor: theme.colors.card,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.lg,
      gap: spacing.md,
    },
    scannerFallbackTitle: {
      ...theme.typography.h2,
      color: theme.colors.foreground,
    },
    scannerFallbackBody: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.mutedForeground,
    },
    scannerFallbackInput: {
      ...theme.input,
      minHeight: 120,
      paddingTop: spacing.md,
      textAlignVertical: 'top',
    },
    fallbackCloseButton: {
      ...createMinimumTouchTargetStyle({
        minSize: 44,
        horizontalPadding: spacing.md,
        verticalPadding: spacing.sm,
        horizontalMargin: 0,
      }),
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fallbackCloseButtonText: {
      color: theme.colors.foreground,
      fontSize: 16,
      fontWeight: '500',
    },
  });
}

