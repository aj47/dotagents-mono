import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { VideoView, useVideoPlayer, type VideoSource } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import {
  buildConversationVideoAssetHttpUrl,
  getVideoAssetLabel,
  isRenderableVideoUrl,
  parseConversationVideoAssetUrl,
} from '@dotagents/shared';
import { SettingsApiClient } from '../lib/settingsApi';
import { useTheme } from './ThemeProvider';
import { radius, spacing } from './theme';

export interface VideoAttachmentCardProps {
  sourceUrl: string;
  label?: string;
  assetBaseUrl?: string;
  authToken?: string;
}

function resolveVideoUri(sourceUrl: string, assetBaseUrl?: string): string {
  const remoteAssetUrl = assetBaseUrl
    ? buildConversationVideoAssetHttpUrl(assetBaseUrl, sourceUrl)
    : null;
  return remoteAssetUrl ?? sourceUrl;
}

function getVideoCacheExtension(uri: string): string {
  try {
    const parsed = new URL(uri);
    const match = parsed.pathname.match(/\.(mp4|m4v|webm|mov|ogv)$/i);
    return match?.[1]?.toLowerCase() ?? 'mp4';
  } catch {
    const match = uri.match(/\.(mp4|m4v|webm|mov|ogv)(?:[?#].*)?$/i);
    return match?.[1]?.toLowerCase() ?? 'mp4';
  }
}

function formatVideoAttachmentRequestFailedMessage(status: number): string {
  return `Video request failed (${status})`;
}

function getHeaderRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

export const VideoAttachmentCard: React.FC<VideoAttachmentCardProps> = ({
  sourceUrl,
  label,
  assetBaseUrl,
  authToken,
}) => {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [playbackUri, setPlaybackUri] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const cachedFileRef = useRef<File | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const displayLabel = getVideoAssetLabel(label, sourceUrl);
  const resolvedUri = resolveVideoUri(sourceUrl, assetBaseUrl);
  const conversationAssetRef = useMemo(() => parseConversationVideoAssetUrl(sourceUrl), [sourceUrl]);
  const isConversationAsset = !!conversationAssetRef;
  const assetApiClient = useMemo(
    () => (assetBaseUrl && authToken ? new SettingsApiClient(assetBaseUrl, authToken) : null),
    [assetBaseUrl, authToken],
  );
  const shouldFetchWithAuth = isConversationAsset && !!assetApiClient;
  const canRender = (() => {
    // Asset URLs (assets://) can't be played directly on mobile — they must be
    // resolved to an HTTP URL via buildConversationVideoAssetHttpUrl (which
    // requires assetBaseUrl). If the source is an asset URL and it wasn't
    // resolved, don't show the card. Auth is also required since the desktop
    // remote server rejects unauthenticated /v1/* requests.
    if (isConversationAsset) {
      return resolvedUri !== sourceUrl && !!authToken && isRenderableVideoUrl(resolvedUri);
    }
    return isRenderableVideoUrl(sourceUrl) || isRenderableVideoUrl(resolvedUri);
  })();
  const canOpenExternally = !isConversationAsset;

  const source = useMemo<VideoSource>(() => {
    if (!playbackUri || !canRender) return null;
    return { uri: playbackUri };
  }, [canRender, playbackUri]);

  const player = useVideoPlayer(source, (videoPlayer) => {
    videoPlayer.loop = false;
  });

  useEffect(() => () => {
    if (objectUrlRef.current) {
      try { URL.revokeObjectURL(objectUrlRef.current); } catch {}
      objectUrlRef.current = null;
    }
    if (cachedFileRef.current) {
      try { cachedFileRef.current.delete(); } catch {}
      cachedFileRef.current = null;
    }
  }, []);

  const loadVideo = useCallback(async () => {
    if (playbackUri || loading || !canRender) return;

    setLoading(true);
    setLoadError(null);
    try {
      if (!shouldFetchWithAuth) {
        setPlaybackUri(resolvedUri);
        return;
      }

      if (!assetApiClient || !conversationAssetRef) {
        throw new Error('Missing video asset credentials.');
      }

      if (Platform.OS === 'web') {
        const response = await assetApiClient.getConversationVideoAssetResponse(
          conversationAssetRef.conversationId,
          conversationAssetRef.fileName,
        );
        if (!response.ok) {
          throw new Error(formatVideoAttachmentRequestFailedMessage(response.status));
        }
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        setPlaybackUri(objectUrl);
        return;
      }

      const extension = getVideoCacheExtension(resolvedUri);
      const destination = new File(
        Paths.cache,
        `chat-video-${Date.now()}-${Math.floor(Math.random() * 1e6)}.${extension}`,
      );
      const headers = getHeaderRecord(await assetApiClient.buildRequestHeaders());
      const file = await File.downloadFileAsync(resolvedUri, destination, {
        headers,
        idempotent: true,
      });
      cachedFileRef.current = new File(file.uri);
      setPlaybackUri(file.uri);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load this video.');
    } finally {
      setLoading(false);
    }
  }, [assetApiClient, canRender, conversationAssetRef, loading, playbackUri, resolvedUri, shouldFetchWithAuth]);

  const styles = useMemo(() => StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.lg,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
      overflow: 'hidden',
      marginBottom: spacing.sm,
    },
    header: {
      padding: spacing.sm,
      gap: spacing.xs,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    title: {
      color: theme.colors.foreground,
      fontWeight: '600',
      fontSize: 13,
      flex: 1,
      minWidth: 0,
    },
    subtitle: {
      color: theme.colors.mutedForeground,
      fontSize: 11,
    },
    button: {
      marginTop: spacing.xs,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      borderRadius: radius.md,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
    },
    buttonDisabled: {
      opacity: 0.72,
    },
    buttonText: {
      color: theme.colors.primaryForeground,
      fontWeight: '700',
      fontSize: 12,
    },
    video: {
      width: '100%',
      height: 220,
      backgroundColor: '#000',
    },
    fallbackLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.xs,
      marginBottom: spacing.sm,
    },
    fallbackLinkText: {
      color: theme.colors.primary,
      fontSize: 13,
      textDecorationLine: 'underline',
      flex: 1,
      minWidth: 0,
    },
    errorText: {
      color: theme.colors.destructive,
      fontSize: 11,
      marginTop: spacing.xs,
    },
  }), [isDark, theme]);

  if (!canRender) {
    return (
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Open video link: ${displayLabel}`}
        onPress={() => Linking.openURL(resolvedUri)}
        style={styles.fallbackLink}
      >
        <Ionicons name="link-outline" size={15} color={theme.colors.primary} />
        <Text style={styles.fallbackLinkText} numberOfLines={2}>{displayLabel}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      {playbackUri ? (
        <VideoView
          player={player}
          style={styles.video}
          nativeControls
          contentFit="contain"
          playsInline
          surfaceType={Platform.OS === 'android' ? 'surfaceView' : undefined}
        />
      ) : (
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="videocam-outline" size={16} color={theme.colors.mutedForeground} />
            <Text style={styles.title} numberOfLines={1}>{displayLabel}</Text>
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>Loads only when you tap play</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Play video ${displayLabel}`}
            accessibilityState={{ busy: loading }}
            onPress={loadVideo}
            style={[styles.button, loading && styles.buttonDisabled]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.primaryForeground} />
            ) : (
              <Ionicons name="play" size={14} color={theme.colors.primaryForeground} />
            )}
            <Text style={styles.buttonText}>{loading ? 'Loading...' : 'Play video'}</Text>
          </Pressable>
          {loadError ? (
            <Text style={styles.errorText}>{loadError}</Text>
          ) : null}
          {canOpenExternally ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Open video externally: ${displayLabel}`}
              onPress={() => Linking.openURL(resolvedUri)}
              style={styles.titleRow}
            >
              <Ionicons name="open-outline" size={14} color={theme.colors.mutedForeground} />
              <Text style={styles.subtitle}>Open externally</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
};

export default VideoAttachmentCard;
