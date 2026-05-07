import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View, type ImageStyle, type StyleProp } from 'react-native';
import Markdown from 'react-native-markdown-display';
import {
  buildConversationImageAssetHttpUrl,
  isAllowedMarkdownImageUrl,
  isAllowedMarkdownLinkUrl,
  parseConversationImageAssetUrl,
} from '@dotagents/shared/conversation-media-assets';
import { useTheme } from './ThemeProvider';
import { spacing, radius } from './theme';
import { VideoAttachmentCard } from './VideoAttachmentCard';
import { splitMarkdownContent } from '@dotagents/shared/markdown-render-parts';
import { SettingsApiClient } from '../lib/settingsApi';

interface MarkdownRendererProps {
  content: string;
  assetBaseUrl?: string;
  assetAuthToken?: string;
}

const ThinkSection: React.FC<{
  content: string;
  markdownStyles: any;
  markdownRules: any;
  styles: any;
}> = ({ content, markdownStyles, markdownRules, styles }) => {
  const [collapsed, setCollapsed] = React.useState(true);

  return (
    <View style={[styles.container, collapsed ? styles.containerCollapsed : styles.containerExpanded]}>
      <Pressable
        onPress={() => setCollapsed(prev => !prev)}
        accessibilityRole="button"
        accessibilityLabel={collapsed ? 'Show thinking' : 'Hide thinking'}
        accessibilityState={{ expanded: !collapsed }}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
      >
        <Text style={styles.chevron}>{collapsed ? '▶' : '▼'}</Text>
        <Text style={styles.icon}>🧠</Text>
        <Text style={styles.label}>{collapsed ? 'Thinking' : 'Hide thinking'}</Text>
      </Pressable>
      {!collapsed && content.trim().length > 0 && (
        <View style={styles.content}>
          <Markdown style={markdownStyles} rules={markdownRules} onLinkPress={isAllowedMarkdownLinkUrl}>
            {content}
          </Markdown>
        </View>
      )}
    </View>
  );
};

function getHeaderRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

const MarkdownImage: React.FC<{
  sourceUrl: string;
  alt?: string;
  assetBaseUrl?: string;
  authToken?: string;
  style?: StyleProp<ImageStyle>;
}> = ({ sourceUrl, alt, assetBaseUrl, authToken, style }) => {
  const [imageSource, setImageSource] = React.useState<{ uri: string; headers?: Record<string, string> } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const objectUrlRef = React.useRef<string | null>(null);
  const assetRef = React.useMemo(() => parseConversationImageAssetUrl(sourceUrl), [sourceUrl]);

  React.useEffect(() => {
    let cancelled = false;

    const clearObjectUrl = () => {
      if (objectUrlRef.current) {
        try { URL.revokeObjectURL(objectUrlRef.current); } catch {}
        objectUrlRef.current = null;
      }
    };

    async function loadImage() {
      clearObjectUrl();
      setError(null);

      if (!assetRef) {
        setImageSource({ uri: sourceUrl });
        return;
      }

      if (!assetBaseUrl || !authToken) {
        setImageSource(null);
        setError('Image unavailable.');
        return;
      }

      try {
        const client = new SettingsApiClient(assetBaseUrl, authToken);

        if (Platform.OS === 'web') {
          const response = await client.getConversationImageAssetResponse(assetRef.conversationId, assetRef.fileName);
          if (!response.ok) {
            throw new Error(`Image request failed (${response.status})`);
          }
          const objectUrl = URL.createObjectURL(await response.blob());
          if (cancelled) {
            URL.revokeObjectURL(objectUrl);
            return;
          }
          objectUrlRef.current = objectUrl;
          setImageSource({ uri: objectUrl });
          return;
        }

        const resolvedUri = buildConversationImageAssetHttpUrl(assetBaseUrl, sourceUrl);
        if (!resolvedUri) {
          throw new Error('Invalid image asset URL.');
        }
        const headers = getHeaderRecord(await client.buildRequestHeaders());
        if (!cancelled) setImageSource({ uri: resolvedUri, headers });
      } catch (caughtError) {
        if (!cancelled) {
          setImageSource(null);
          setError(caughtError instanceof Error ? caughtError.message : 'Unable to load image.');
        }
      }
    }

    loadImage();
    return () => {
      cancelled = true;
      clearObjectUrl();
    };
  }, [assetBaseUrl, assetRef, authToken, sourceUrl]);

  if (error) {
    return <Text>{alt || error}</Text>;
  }

  if (!imageSource) {
    return <Text>{alt || 'Image'}</Text>;
  }

  return <Image source={imageSource} style={style} resizeMode="contain" accessibilityLabel={alt} />;
};

const createThinkStyles = (theme: ReturnType<typeof useTheme>['theme'], isDark: boolean) => StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: radius.md,
    borderWidth: 1,
    marginVertical: 2,
  },
  containerCollapsed: {
    borderColor: isDark ? 'rgba(251,191,36,0.28)' : 'rgba(245,158,11,0.35)',
    backgroundColor: isDark ? 'rgba(146,64,14,0.12)' : 'rgba(254,243,199,0.45)',
  },
  containerExpanded: {
    borderColor: isDark ? 'rgba(251,191,36,0.45)' : 'rgba(245,158,11,0.5)',
    backgroundColor: isDark ? 'rgba(146,64,14,0.18)' : 'rgba(254,243,199,0.65)',
    marginVertical: spacing.xs,
  },
  header: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  headerPressed: {
    opacity: 0.7,
  },
  chevron: {
    color: isDark ? '#fbbf24' : '#d97706',
    fontSize: 10,
  },
  icon: {
    fontSize: 12,
  },
  label: {
    color: isDark ? '#fde68a' : '#92400e',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
});

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  assetBaseUrl,
  assetAuthToken,
}) => {
  const { theme, isDark } = useTheme();
  const thinkStyles = createThinkStyles(theme, isDark);

  // Compact markdown styles matching desktop's tight layout
  const markdownStyles = StyleSheet.create({
    body: {
      color: theme.colors.foreground,
      fontSize: 13,
      lineHeight: 18,
    },
    heading1: {
      color: theme.colors.foreground,
      fontSize: 16,
      fontWeight: '700',
      marginTop: spacing.xs,
      marginBottom: 2,
    },
    heading2: {
      color: theme.colors.foreground,
      fontSize: 15,
      fontWeight: '600',
      marginTop: spacing.xs,
      marginBottom: 2,
    },
    heading3: {
      color: theme.colors.foreground,
      fontSize: 14,
      fontWeight: '600',
      marginTop: 2,
      marginBottom: 1,
    },
    paragraph: {
      color: theme.colors.foreground,
      marginBottom: spacing.xs,
      lineHeight: 18,
    },
    strong: {
      fontWeight: '700',
    },
    em: {
      fontStyle: 'italic',
    },
    s: {
      textDecorationLine: 'line-through',
    },
    bullet_list: {
      marginBottom: spacing.xs,
    },
    ordered_list: {
      marginBottom: spacing.xs,
    },
    list_item: {
      marginBottom: 1,
    },
    bullet_list_icon: {
      color: theme.colors.mutedForeground,
      marginRight: 2,
    },
    ordered_list_icon: {
      color: theme.colors.mutedForeground,
      marginRight: 2,
    },
    code_inline: {
      backgroundColor: theme.colors.muted,
      color: theme.colors.primary,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 11,
      paddingHorizontal: 3,
      paddingVertical: 1,
      borderRadius: radius.sm,
    },
    code_block: {
      backgroundColor: theme.colors.muted,
      color: theme.colors.foreground,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 10,
      padding: spacing.xs,
      borderRadius: radius.sm,
      marginBottom: spacing.xs,
      overflow: 'hidden',
    },
    fence: {
      backgroundColor: theme.colors.muted,
      color: theme.colors.foreground,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 10,
      padding: spacing.xs,
      borderRadius: radius.sm,
      marginBottom: spacing.xs,
      overflow: 'hidden',
    },
    blockquote: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      borderLeftWidth: 2,
      borderLeftColor: theme.colors.primary,
      paddingLeft: spacing.sm,
      paddingVertical: 2,
      marginBottom: spacing.xs,
    },
    link: {
      color: theme.colors.primary,
      textDecorationLine: 'underline',
    },
    image: {
      width: '100%',
      minHeight: 140,
      maxHeight: 320,
      borderRadius: radius.md,
      marginBottom: spacing.xs,
      backgroundColor: theme.colors.muted,
    },
    table: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.sm,
      marginBottom: spacing.xs,
    },
    thead: {
      backgroundColor: theme.colors.muted,
    },
    th: {
      padding: spacing.xs,
      fontWeight: '600',
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
      fontSize: 11,
    },
    tr: {
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
    },
    td: {
      padding: spacing.xs,
      fontSize: 11,
    },
    hr: {
      backgroundColor: theme.colors.border,
      height: 1,
      marginVertical: spacing.xs,
    },
  });

  const parts = splitMarkdownContent(content);
  const markdownRules = React.useMemo(() => ({
    image: (node: any) => {
      const src = String(node.attributes?.src || '');
      const alt = typeof node.attributes?.alt === 'string' ? node.attributes.alt : undefined;
      if (!src) return null;
      if (!isAllowedMarkdownImageUrl(src)) {
        return <Text key={node.key}>{alt || 'Image'}</Text>;
      }
      return (
        <MarkdownImage
          key={node.key}
          sourceUrl={src}
          alt={alt}
          assetBaseUrl={assetBaseUrl}
          authToken={assetAuthToken}
          style={markdownStyles.image}
        />
      );
    },
  }), [assetAuthToken, assetBaseUrl, markdownStyles.image]);

  return (
    <View>
      {parts.map((part, index) => {
        if (part.type === 'video') {
          return (
            <VideoAttachmentCard
              key={`video-${index}-${part.url}`}
              sourceUrl={part.url}
              label={part.label}
              assetBaseUrl={assetBaseUrl}
              authToken={assetAuthToken}
            />
          );
        }

        if (part.type === 'think') {
          return (
            <ThinkSection
              key={`think-${index}`}
              content={part.content}
              markdownStyles={markdownStyles}
              markdownRules={markdownRules}
              styles={thinkStyles}
            />
          );
        }

        if (!part.content?.trim()) return null;
        return (
          <Markdown
            key={`markdown-${index}`}
            style={markdownStyles}
            rules={markdownRules}
            onLinkPress={isAllowedMarkdownLinkUrl}
          >
            {part.content}
          </Markdown>
        );
      })}
    </View>
  );
};

export default MarkdownRenderer;
