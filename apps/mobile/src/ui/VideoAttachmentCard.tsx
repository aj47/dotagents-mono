import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import { VideoView, useVideoPlayer, type VideoSource } from 'expo-video';
import {
  buildConversationVideoAssetHttpUrl,
  getChatVideoAttachmentMobileRenderState,
  formatVideoAttachmentRequestFailedMessage,
  isRenderableVideoUrl,
  parseConversationVideoAssetUrl,
} from '@dotagents/shared/conversation-media-assets';
import { SettingsApiClient } from '../lib/settingsApi';
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
  const videoAttachmentRenderState = useMemo(
    () => getChatVideoAttachmentMobileRenderState({
      sourceUrl,
      label,
      colors: theme.colors,
      isDark,
      loading,
    }),
    [isDark, label, loading, sourceUrl, theme.colors],
  );
  const videoAttachmentCopy = videoAttachmentRenderState.copy;
  const videoAttachmentSurface = videoAttachmentRenderState.surface;
  const videoAttachmentSurfaceColors = videoAttachmentRenderState.colors;
  const displayLabel = videoAttachmentRenderState.displayLabel;
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
        throw new Error(videoAttachmentCopy.errors.missingCredentials);
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
      setLoadError(
        error instanceof Error
          ? error.message
          : videoAttachmentCopy.errors.loadFallback,
      );
    } finally {
      setLoading(false);
    }
  }, [assetApiClient, canRender, conversationAssetRef, loading, playbackUri, resolvedUri, shouldFetchWithAuth, videoAttachmentCopy]);

  const styles = useMemo(() => StyleSheet.create({
    card: {
      borderWidth: videoAttachmentSurface.card.borderWidth,
      borderColor: videoAttachmentSurfaceColors.card.borderColor,
      borderRadius: radius[videoAttachmentSurface.card.borderRadius],
      backgroundColor: videoAttachmentSurfaceColors.card.backgroundColor,
      overflow: videoAttachmentSurface.card.overflow,
      marginBottom: spacing[videoAttachmentSurface.card.marginBottom],
    },
    header: {
      padding: spacing[videoAttachmentSurface.header.padding],
      gap: videoAttachmentSurface.header.gap,
    },
    loadButton: {
      flexDirection: videoAttachmentSurface.loadButton.flexDirection,
      alignItems: videoAttachmentSurface.loadButton.alignItems,
      gap: videoAttachmentSurface.loadButton.gap,
      padding: spacing[videoAttachmentSurface.loadButton.padding],
    },
    loadButtonPressed: {
      opacity: videoAttachmentSurface.loadButton.pressedOpacity,
    },
    loadButtonDisabled: {
      opacity: videoAttachmentSurface.loadButton.disabledOpacity,
    },
    playIconWrapper: {
      width: videoAttachmentSurface.playIconWrapper.size,
      height: videoAttachmentSurface.playIconWrapper.size,
      borderRadius: videoAttachmentSurface.playIconWrapper.borderRadius,
      alignItems: videoAttachmentSurface.playIconWrapper.alignItems,
      justifyContent: videoAttachmentSurface.playIconWrapper.justifyContent,
      backgroundColor: videoAttachmentSurfaceColors.playIconWrapper.backgroundColor,
    },
    textWrapper: {
      flex: videoAttachmentSurface.textWrapper.flex,
      minWidth: videoAttachmentSurface.textWrapper.minWidth,
    },
    title: {
      color: videoAttachmentSurfaceColors.title.color,
      fontWeight: videoAttachmentSurface.title.fontWeight,
      fontSize: videoAttachmentSurface.title.fontSize,
    },
    subtitle: {
      color: videoAttachmentSurfaceColors.subtitle.color,
      fontSize: videoAttachmentSurface.subtitle.fontSize,
    },
    video: {
      width: videoAttachmentSurface.video.width,
      height: videoAttachmentSurface.video.height,
      backgroundColor: videoAttachmentSurface.video.backgroundColor,
    },
    fallbackLink: {
      paddingVertical: spacing[videoAttachmentSurface.fallbackLink.paddingVertical],
      marginBottom: spacing[videoAttachmentSurface.fallbackLink.marginBottom],
    },
    fallbackLinkPressed: {
      opacity: videoAttachmentSurface.fallbackLink.pressedOpacity,
    },
    fallbackLinkText: {
      color: videoAttachmentSurfaceColors.fallbackLinkText.color,
      fontSize: videoAttachmentSurface.fallbackLinkText.fontSize,
      textDecorationLine: videoAttachmentSurface.fallbackLinkText.textDecorationLine,
    },
    externalLink: {
      marginTop: spacing[videoAttachmentSurface.externalLink.marginTop],
    },
    externalLinkPressed: {
      opacity: videoAttachmentSurface.externalLink.pressedOpacity,
    },
    errorText: {
      color: videoAttachmentSurfaceColors.errorText.color,
      fontSize: videoAttachmentSurface.errorText.fontSize,
      marginTop: spacing[videoAttachmentSurface.errorText.marginTop],
    },
  }), [videoAttachmentSurfaceColors]);

  if (!canRender) {
    return (
      <Pressable
        accessibilityRole={videoAttachmentRenderState.fallbackLink.accessibilityRole}
        accessibilityLabel={videoAttachmentRenderState.fallbackLink.accessibilityLabel}
        onPress={() => Linking.openURL(resolvedUri)}
        style={({ pressed }) => [styles.fallbackLink, pressed && styles.fallbackLinkPressed]}
      >
        <Text style={styles.fallbackLinkText}>
          {videoAttachmentCopy.glyphs.link} {displayLabel}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      {playbackUri ? (
        <VideoView
          accessibilityLabel={videoAttachmentRenderState.video.accessibilityLabel}
          player={player}
          style={styles.video}
          nativeControls
          contentFit="contain"
          playsInline
          surfaceType={Platform.OS === 'android' ? 'surfaceView' : undefined}
        />
      ) : (
        <View style={styles.header}>
          <Pressable
            accessibilityRole={videoAttachmentRenderState.loadButton.accessibilityRole}
            accessibilityLabel={videoAttachmentRenderState.loadButton.accessibilityLabel}
            accessibilityState={videoAttachmentRenderState.loadButton.accessibilityState}
            onPress={loadVideo}
            style={({ pressed }) => [
              styles.loadButton,
              pressed && styles.loadButtonPressed,
              loading && styles.loadButtonDisabled,
            ]}
            disabled={loading}
          >
            <View style={styles.playIconWrapper}>
              {loading ? (
                <ActivityIndicator size="small" color={videoAttachmentSurfaceColors.playIcon.color} />
              ) : (
                <Ionicons
                  name={videoAttachmentSurface.playIcon.name}
                  size={videoAttachmentSurface.playIcon.size}
                  color={videoAttachmentSurfaceColors.playIcon.color}
                />
              )}
            </View>
            <View style={styles.textWrapper}>
              <Text style={styles.title} numberOfLines={videoAttachmentSurface.title.numberOfLines}>
                {videoAttachmentRenderState.title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={videoAttachmentSurface.subtitle.numberOfLines}>
                {videoAttachmentRenderState.subtitle}
              </Text>
            </View>
          </Pressable>
          {loadError ? (
            <Text style={styles.errorText}>{loadError}</Text>
          ) : null}
          {canOpenExternally ? (
            <Pressable
              accessibilityRole={videoAttachmentRenderState.externalLink.accessibilityRole}
              accessibilityLabel={videoAttachmentRenderState.externalLink.accessibilityLabel}
              onPress={() => Linking.openURL(resolvedUri)}
              style={({ pressed }) => pressed && styles.externalLinkPressed}
            >
              <Text style={[styles.subtitle, styles.externalLink]}>
                {videoAttachmentCopy.labels.openExternally}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
};

export default VideoAttachmentCard;
