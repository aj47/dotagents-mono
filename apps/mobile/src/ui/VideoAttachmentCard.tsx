import React, { useMemo, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
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

export const VideoAttachmentCard: React.FC<VideoAttachmentCardProps> = ({
  sourceUrl,
  label,
  assetBaseUrl,
  authToken,
}) => {
  const { theme, isDark } = useTheme();
  const [loaded, setLoaded] = useState(false);
  const displayLabel = getVideoAssetLabel(label, sourceUrl);
  const resolvedUri = resolveVideoUri(sourceUrl, assetBaseUrl);
  const canRender = (() => {
    // Asset URLs (assets://) can't be played directly on mobile — they must be
    // resolved to an HTTP URL via buildConversationVideoAssetHttpUrl (which
    // requires assetBaseUrl). If the source is an asset URL and it wasn't
    // resolved, don't show the card. Auth is also required since the desktop
    // remote server rejects unauthenticated /v1/* requests.
    if (isConversationVideoAssetUrl(sourceUrl)) {
      return resolvedUri !== sourceUrl && !!authToken && isRenderableVideoUrl(resolvedUri);
    }
    return isRenderableVideoUrl(sourceUrl) || isRenderableVideoUrl(resolvedUri);
  })();
  const canOpenExternally = !authToken || resolvedUri === sourceUrl;

  const source = useMemo<VideoSource>(() => {
    if (!loaded || !canRender) return null;
    // Only attach auth headers for conversation video asset URLs to avoid
    // leaking the desktop API key to third-party hosts.
    const headers = (authToken && isConversationVideoAssetUrl(sourceUrl))
      ? { Authorization: `Bearer ${authToken}` }
      : undefined;
    return headers ? { uri: resolvedUri, headers } : { uri: resolvedUri };
  }, [authToken, canRender, loaded, resolvedUri, sourceUrl]);

  const player = useVideoPlayer(source, (videoPlayer) => {
    videoPlayer.loop = false;
  });

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
  }), [isDark, theme]);

  if (!canRender) {
    return (
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Open video link: ${displayLabel}`}
        onPress={() => Linking.openURL(sourceUrl)}
        style={styles.fallbackLink}
      >
        <Text style={styles.fallbackLinkText}>🔗 {displayLabel}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      {loaded ? (
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
            onPress={() => setLoaded(true)}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Play video</Text>
          </Pressable>
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
