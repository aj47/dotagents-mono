import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type StyleProp,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeProvider';
import { spacing, radius } from './theme';
import { VideoAttachmentCard, type VideoAttachmentCardProps } from './VideoAttachmentCard';
import { splitMarkdownContent } from './markdownParts';
import { SettingsApiClient } from '../lib/settingsApi';

export interface MarkdownRendererProps {
  content: string;
  assetBaseUrl?: VideoAttachmentCardProps['assetBaseUrl'];
  assetAuthToken?: VideoAttachmentCardProps['authToken'];
}

type MarkdownPressHandler = () => void | Promise<void>;
type MarkdownDisplayStyles = React.ComponentProps<typeof Markdown>['style'];
type MarkdownDisplayRules = React.ComponentProps<typeof Markdown>['rules'];

type MarkdownImageSource = {
  uri: string;
  headers?: Record<string, string>;
};

const CONVERSATION_IMAGE_ASSET_REGEX = /^assets:\/\/conversation-image\/([^/]+)\/([^/?#]+)(?:[?#].*)?$/i;
const MARKDOWN_IMAGE_COPY = {
  fallbackLabel: 'Image',
  unavailableLabel: 'Image unavailable.',
  invalidAssetUrlMessage: 'Invalid image asset URL.',
  loadErrorFallback: 'Unable to load image.',
} as const;

function parseConversationImageAssetUrl(rawUrl: string): { conversationId: string; fileName: string } | null {
  const match = rawUrl.trim().match(CONVERSATION_IMAGE_ASSET_REGEX);
  if (!match) return null;

  try {
    return {
      conversationId: decodeURIComponent(match[1]),
      fileName: decodeURIComponent(match[2]),
    };
  } catch {
    return null;
  }
}

function buildConversationImageAssetHttpUrl(apiBaseUrl: string, assetUrl: string): string | null {
  const assetRef = parseConversationImageAssetUrl(assetUrl);
  if (!assetRef) return null;

  const base = apiBaseUrl.trim().replace(/\/+$/, '');
  if (!base) return null;

  return `${base}/conversations/${encodeURIComponent(assetRef.conversationId)}/assets/images/${encodeURIComponent(assetRef.fileName)}`;
}

function isAllowedMarkdownImageUrl(rawUrl?: string): boolean {
  if (!rawUrl) return false;
  const url = rawUrl.trim();
  if (parseConversationImageAssetUrl(url)) return true;
  if (url.startsWith('data:image/')) return true;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isAllowedMarkdownContentLinkUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:';
  } catch {
    return false;
  }
}

function getMarkdownImageFallbackLabel(alt?: string): string {
  return alt?.trim() || MARKDOWN_IMAGE_COPY.fallbackLabel;
}

function getHeaderRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

function getMarkdownImageNodeSource(node: any): string {
  return (
    node?.attributes?.src ??
    node?.attrs?.src ??
    node?.src ??
    ''
  );
}

function getMarkdownImageNodeAlt(node: any): string | undefined {
  return (
    node?.attributes?.alt ??
    node?.attrs?.alt ??
    node?.alt ??
    undefined
  );
}

const ThinkSection: React.FC<{
  content: string;
  markdownStyles: MarkdownDisplayStyles;
  markdownRules: MarkdownDisplayRules;
  styles: ReturnType<typeof createThinkStyles>;
  iconColor: string;
}> = ({ content, markdownStyles, markdownRules, styles, iconColor }) => {
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
        <Ionicons name={collapsed ? 'chevron-forward' : 'chevron-down'} size={13} color={iconColor} />
        <Ionicons name="bulb-outline" size={13} color={iconColor} />
        <Text style={styles.label}>{collapsed ? 'Thinking' : 'Hide thinking'}</Text>
      </Pressable>
      {!collapsed && content.trim().length > 0 && (
        <View style={styles.content}>
          <Markdown style={markdownStyles} rules={markdownRules} onLinkPress={isAllowedMarkdownContentLinkUrl}>
            {content}
          </Markdown>
        </View>
      )}
    </View>
  );
};

const createThinkStyles = (isDark: boolean) =>
  StyleSheet.create({
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

const MarkdownImage = React.memo(function MarkdownImage({
  sourceUrl,
  alt,
  assetBaseUrl,
  authToken,
  style,
}: {
  sourceUrl: string;
  alt?: string;
  assetBaseUrl?: string;
  authToken?: string;
  style?: StyleProp<ImageStyle>;
}) {
  const [imageSource, setImageSource] = React.useState<MarkdownImageSource | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const objectUrlRef = React.useRef<string | null>(null);
  const assetRef = React.useMemo(() => parseConversationImageAssetUrl(sourceUrl), [sourceUrl]);
  const imageLabel = getMarkdownImageFallbackLabel(alt);

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

      if (!isAllowedMarkdownImageUrl(sourceUrl)) {
        setImageSource(null);
        setError(`${imageLabel} unavailable.`);
        return;
      }

      if (!assetRef) {
        setImageSource({ uri: sourceUrl });
        return;
      }

      if (!assetBaseUrl || !authToken) {
        setImageSource(null);
        setError(MARKDOWN_IMAGE_COPY.unavailableLabel);
        return;
      }

      const resolvedUri = buildConversationImageAssetHttpUrl(assetBaseUrl, sourceUrl);
      if (!resolvedUri) {
        setImageSource(null);
        setError(MARKDOWN_IMAGE_COPY.invalidAssetUrlMessage);
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

        if (!cancelled) {
          setImageSource({ uri: resolvedUri, headers: getHeaderRecord(await client.buildRequestHeaders()) });
        }
      } catch (caughtError) {
        if (!cancelled) {
          setImageSource(null);
          setError(caughtError instanceof Error ? caughtError.message : MARKDOWN_IMAGE_COPY.loadErrorFallback);
        }
      }
    }

    void loadImage();
    return () => {
      cancelled = true;
      clearObjectUrl();
    };
  }, [assetBaseUrl, assetRef, authToken, imageLabel, sourceUrl]);

  if (!imageSource) {
    return <Text>{error || imageLabel}</Text>;
  }

  return (
    <Image
      source={imageSource}
      style={style}
      resizeMode="contain"
      accessibilityLabel={imageLabel}
    />
  );
});

function getMarkdownCodeContent(node: any): string {
  if (typeof node?.content === 'string') return node.content.replace(/\n$/, '');
  if (typeof node?.literal === 'string') return node.literal.replace(/\n$/, '');
  if (Array.isArray(node?.children)) {
    return node.children.map(getMarkdownCodeContent).join('').replace(/\n$/, '');
  }
  return '';
}

const MarkdownCodeBlock = React.memo(function MarkdownCodeBlock({
  node,
  styles,
  copyIconColor,
  copiedIconColor,
}: {
  node: any;
  styles: ReturnType<typeof createCodeCopyStyles>;
  copyIconColor: string;
  copiedIconColor: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const codeContent = React.useMemo(() => getMarkdownCodeContent(node), [node]);

  React.useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  const handleCopy = React.useCallback<MarkdownPressHandler>(async () => {
    if (!codeContent) return;
    await Clipboard.setStringAsync(codeContent);
    setCopied(true);
  }, [codeContent]);

  return (
    <View style={styles.codeBlock}>
      <Text selectable style={styles.codeBlockText}>{codeContent}</Text>
      <Pressable
        onPress={handleCopy}
        accessibilityRole="button"
        accessibilityLabel={copied ? 'Code copied' : 'Copy code'}
        style={({ pressed }) => [
          styles.codeBlockCopyButton,
          copied && styles.codeBlockCopyButtonCopied,
          pressed && styles.codeBlockCopyButtonPressed,
        ]}
      >
        <Ionicons
          name={copied ? 'checkmark' : 'copy-outline'}
          size={14}
          color={copied ? copiedIconColor : copyIconColor}
        />
      </Pressable>
    </View>
  );
});

const createCodeCopyStyles = (
  theme: ReturnType<typeof useTheme>['theme'],
  isDark: boolean,
) => StyleSheet.create({
  codeBlock: {
    position: 'relative',
    backgroundColor: theme.colors.muted,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  codeBlockText: {
    color: theme.colors.foreground,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10,
    lineHeight: 15,
    padding: spacing.xs,
    paddingRight: 36,
  },
  codeBlockCopyButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)',
    backgroundColor: isDark ? 'rgba(0,0,0,0.32)' : 'rgba(255,255,255,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBlockCopyButtonPressed: {
    opacity: 0.72,
  },
  codeBlockCopyButtonCopied: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
});

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  assetBaseUrl,
  assetAuthToken,
}) => {
  const { theme, isDark } = useTheme();
  const thinkStyles = React.useMemo(() => createThinkStyles(isDark), [isDark]);
  const codeCopyStyles = React.useMemo(() => createCodeCopyStyles(theme, isDark), [isDark, theme]);
  const thinkIconColor = isDark ? '#fbbf24' : '#d97706';

  const markdownStyles = React.useMemo(() => StyleSheet.create({
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
      paddingRight: 36,
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
      paddingRight: 36,
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
  }), [isDark, theme]);

  const markdownRules = React.useMemo<MarkdownDisplayRules>(() => ({
    image: (node: any) => (
      <MarkdownImage
        key={node.key}
        sourceUrl={getMarkdownImageNodeSource(node)}
        alt={getMarkdownImageNodeAlt(node)}
        assetBaseUrl={assetBaseUrl}
        authToken={assetAuthToken}
        style={markdownStyles.image as StyleProp<ImageStyle>}
      />
    ),
    code_block: (node: any) => (
      <MarkdownCodeBlock
        key={node.key}
        node={node}
        styles={codeCopyStyles}
        copyIconColor={theme.colors.mutedForeground}
        copiedIconColor={theme.colors.primary}
      />
    ),
    fence: (node: any) => (
      <MarkdownCodeBlock
        key={node.key}
        node={node}
        styles={codeCopyStyles}
        copyIconColor={theme.colors.mutedForeground}
        copiedIconColor={theme.colors.primary}
      />
    ),
  }), [
    assetAuthToken,
    assetBaseUrl,
    codeCopyStyles,
    markdownStyles.image,
    theme.colors.mutedForeground,
    theme.colors.primary,
  ]);

  const parts = splitMarkdownContent(content);

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
              iconColor={thinkIconColor}
            />
          );
        }

        if (!part.content?.trim()) return null;
        return (
          <Markdown
            key={`markdown-${index}`}
            style={markdownStyles}
            rules={markdownRules}
            onLinkPress={isAllowedMarkdownContentLinkUrl}
          >
            {part.content}
          </Markdown>
        );
      })}
    </View>
  );
};

export default MarkdownRenderer;
