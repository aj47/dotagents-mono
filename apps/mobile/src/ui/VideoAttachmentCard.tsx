import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import { VideoView, useVideoPlayer, type VideoSource } from 'expo-video';
import {
  buildConversationVideoAssetHttpUrl,
  createChatVideoAttachmentMobilePropsParts,
  createChatVideoAttachmentMobileStyleSlots,
  getChatVideoAttachmentMobileRenderState,
  formatVideoAttachmentRequestFailedMessage,
  isRenderableVideoUrl,
  parseConversationVideoAssetUrl,
} from '@dotagents/shared/session-presentation';
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
  const videoAttachmentStyleSlots = useMemo(
    () => createChatVideoAttachmentMobileStyleSlots({
      renderState: videoAttachmentRenderState,
      spacing,
      radius,
    }),
    [videoAttachmentRenderState],
  );
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
  const openVideo = useCallback(() => {
    void Linking.openURL(resolvedUri);
  }, [resolvedUri]);

  const styles = useMemo(() => StyleSheet.create({
    card: {
      ...videoAttachmentStyleSlots.card,
    },
    header: {
      ...videoAttachmentStyleSlots.header,
    },
    loadButton: {
      ...videoAttachmentStyleSlots.loadButton,
    },
    loadButtonPressed: {
      ...videoAttachmentStyleSlots.loadButtonPressed,
    },
    loadButtonDisabled: {
      ...videoAttachmentStyleSlots.loadButtonDisabled,
    },
    playIconWrapper: {
      ...videoAttachmentStyleSlots.playIconWrapper,
    },
    textWrapper: {
      ...videoAttachmentStyleSlots.textWrapper,
    },
    title: {
      ...videoAttachmentStyleSlots.title,
    },
    subtitle: {
      ...videoAttachmentStyleSlots.subtitle,
    },
    video: {
      ...videoAttachmentStyleSlots.video,
    },
    fallbackLink: {
      ...videoAttachmentStyleSlots.fallbackLink,
    },
    fallbackLinkPressed: {
      ...videoAttachmentStyleSlots.fallbackLinkPressed,
    },
    fallbackLinkText: {
      ...videoAttachmentStyleSlots.fallbackLinkText,
    },
    externalLink: {
      ...videoAttachmentStyleSlots.externalLink,
    },
    externalLinkPressed: {
      ...videoAttachmentStyleSlots.externalLinkPressed,
    },
    errorText: {
      ...videoAttachmentStyleSlots.errorText,
    },
  }), [videoAttachmentStyleSlots]);
  const videoAttachmentParts = createChatVideoAttachmentMobilePropsParts({
    renderState: videoAttachmentRenderState,
    styles,
    isLoading: loading,
    canOpenExternally,
    loadError,
    onLoadVideo: loadVideo,
    onOpenVideo: openVideo,
  });

  if (!canRender) {
    const fallbackLink = videoAttachmentParts.fallbackLink;

    return (
      <Pressable
        {...fallbackLink.props}
      >
        <Text {...fallbackLink.text.props}>
          {fallbackLink.text.text}
        </Text>
      </Pressable>
    );
  }

  return (
    <View {...videoAttachmentParts.card.props}>
      {playbackUri ? (
        <VideoView
          {...videoAttachmentParts.video.props}
          player={player}
          nativeControls
          contentFit="contain"
          playsInline
          surfaceType={Platform.OS === 'android' ? 'surfaceView' : undefined}
        />
      ) : (
        <View {...videoAttachmentParts.header.props}>
          <Pressable
            {...videoAttachmentParts.loadButton.props}
          >
            <View {...videoAttachmentParts.playIconWrapper.props}>
              {videoAttachmentParts.loadingIndicator.shouldRender ? (
                <ActivityIndicator {...videoAttachmentParts.loadingIndicator.props} />
              ) : (
                <Ionicons
                  {...videoAttachmentParts.playIcon.props}
                />
              )}
            </View>
            <View {...videoAttachmentParts.textWrapper.props}>
              <Text {...videoAttachmentParts.title.props}>
                {videoAttachmentParts.title.text}
              </Text>
              <Text {...videoAttachmentParts.subtitle.props}>
                {videoAttachmentParts.subtitle.text}
              </Text>
            </View>
          </Pressable>
          {videoAttachmentParts.error.shouldRender ? (
            <Text {...videoAttachmentParts.error.props}>{videoAttachmentParts.error.text}</Text>
          ) : null}
          {videoAttachmentParts.externalLink.shouldRender ? (
            <Pressable
              {...videoAttachmentParts.externalLink.pressable.props}
            >
              <Text {...videoAttachmentParts.externalLink.label.props}>
                {videoAttachmentParts.externalLink.label.text}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
};

export default VideoAttachmentCard;
