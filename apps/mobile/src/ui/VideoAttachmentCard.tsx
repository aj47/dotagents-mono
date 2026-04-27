import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { VideoView, useVideoPlayer, type VideoSource } from 'expo-video';
import {
  buildConversationVideoAssetHttpUrl,
  getVideoAssetLabel,
  isConversationVideoAssetUrl,
  isRenderableVideoUrl,
} from '@dotagents/shared';
import { useTheme } from './ThemeProvider';
import { radius, spacing } from './theme';

interface VideoAttachmentCardProps {
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
  const isConversationAsset = isConversationVideoAssetUrl(sourceUrl);
  const shouldFetchWithAuth = isConversationAsset && !!authToken;
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

      const headers = { Authorization: `Bearer ${authToken}` };
      if (Platform.OS === 'web') {
        const response = await fetch(resolvedUri, { headers });
        if (!response.ok) {
          throw new Error(`Video request failed (${response.status})`);
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
  }, [authToken, canRender, loading, playbackUri, resolvedUri, shouldFetchWithAuth]);

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
      gap: 2,
    },
    title: {
      color: theme.colors.foreground,
      fontWeight: '600',
      fontSize: 13,
    },
    subtitle: {
      color: theme.colors.mutedForeground,
      fontSize: 11,
    },
    button: {
      marginTop: spacing.xs,
      alignSelf: 'flex-start',
      borderRadius: radius.md,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
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
      paddingVertical: spacing.xs,
      marginBottom: spacing.sm,
    },
    fallbackLinkText: {
      color: theme.colors.primary,
      fontSize: 13,
      textDecorationLine: 'underline',
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
        <Text style={styles.fallbackLinkText}>🔗 {displayLabel}</Text>
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
          <Text style={styles.title} numberOfLines={1}>🎬 {displayLabel}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>Loads only when you tap play</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Play video ${displayLabel}`}
            accessibilityState={{ busy: loading }}
            onPress={loadVideo}
            style={styles.button}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Loading…' : 'Play video'}</Text>
          </Pressable>
          {loadError ? (
            <Text style={styles.errorText}>{loadError}</Text>
          ) : null}
          {canOpenExternally ? (
            <Pressable onPress={() => Linking.openURL(resolvedUri)}>
              <Text style={[styles.subtitle, { marginTop: spacing.xs }]}>Open externally</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
};

export default VideoAttachmentCard;
