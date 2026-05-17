import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View, type ImageStyle, type StyleProp } from 'react-native';
import Markdown from 'react-native-markdown-display';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import {
  buildConversationImageAssetHttpUrl,
  createMarkdownCodeBlockCopyMobilePropsParts,
  createMarkdownContentMobileStyleSlots,
  createMarkdownThinkSectionMobilePropsParts,
  createMarkdownThinkSectionMobileStyleSlots,
  formatMarkdownImageRequestFailedMessage,
  getMarkdownCodeBlockFeedbackResetDelayMs,
  getMarkdownCodeBlockCopyMobileRenderState,
  getMarkdownContentMobileSurfaceRenderState,
  getMarkdownImageFallbackLabel,
  getMarkdownImageInvalidAssetUrlMessage,
  getMarkdownImageLoadErrorFallback,
  getMarkdownImageUnavailableLabel,
  getMarkdownRenderOptions,
  getMarkdownThinkSectionControlState,
  getMarkdownThinkSectionMobileSurfaceRenderState,
  isAllowedMarkdownImageUrl,
  isAllowedMarkdownContentLinkUrl,
  parseConversationImageAssetUrl,
  splitMarkdownContent,
  type MarkdownContentMobileSurfaceRenderState,
  type MarkdownThinkSectionControlOptions,
  type MarkdownThinkSectionMobileSurfaceRenderState,
} from '@dotagents/shared/session-presentation';
import { useTheme } from './ThemeProvider';
import { spacing, radius } from './theme';
import { VideoAttachmentCard } from './VideoAttachmentCard';
import { SettingsApiClient } from '../lib/settingsApi';

interface MarkdownRendererProps extends MarkdownThinkSectionControlOptions {
  content: string;
  assetBaseUrl?: string;
  assetAuthToken?: string;
}

const ThinkSection: React.FC<{
  content: string;
  renderState: MarkdownThinkSectionMobileSurfaceRenderState;
  markdownStyles: any;
  markdownRules: any;
  styles: any;
  defaultCollapsed?: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
}> = ({
  content,
  renderState,
  markdownStyles,
  markdownRules,
  styles,
  defaultCollapsed = true,
  isCollapsed,
  onToggle,
}) => {
  const [internalCollapsed, setInternalCollapsed] = React.useState(defaultCollapsed);
  const collapsed = isCollapsed ?? internalCollapsed;
  const handleToggle = React.useCallback(() => {
    if (onToggle) {
      onToggle();
      return;
    }
    setInternalCollapsed(prev => !prev);
  }, [onToggle]);
  const thinkSectionParts = createMarkdownThinkSectionMobilePropsParts({
    renderState,
    styles,
    content,
    isCollapsed: collapsed,
    onToggle: handleToggle,
  });

  return (
    <View {...thinkSectionParts.container.props}>
      <Pressable
        {...thinkSectionParts.header.props}
      >
        <Ionicons
          {...thinkSectionParts.chevronIcon.props}
        />
        <Ionicons
          {...thinkSectionParts.leadingIcon.props}
        />
        <Text {...thinkSectionParts.label.props}>{thinkSectionParts.label.text}</Text>
      </Pressable>
      {thinkSectionParts.content.shouldRender && (
        <View {...thinkSectionParts.content.props}>
          <Markdown style={markdownStyles} rules={markdownRules} onLinkPress={isAllowedMarkdownContentLinkUrl}>
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

      if (!assetRef) {
        setImageSource({ uri: sourceUrl });
        return;
      }

      if (!assetBaseUrl || !authToken) {
        setImageSource(null);
        setError(getMarkdownImageUnavailableLabel());
        return;
      }

      try {
        const client = new SettingsApiClient(assetBaseUrl, authToken);

        if (Platform.OS === 'web') {
          const response = await client.getConversationImageAssetResponse(assetRef.conversationId, assetRef.fileName);
          if (!response.ok) {
            throw new Error(formatMarkdownImageRequestFailedMessage(response.status));
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
          throw new Error(getMarkdownImageInvalidAssetUrlMessage());
        }
        const headers = getHeaderRecord(await client.buildRequestHeaders());
        if (!cancelled) setImageSource({ uri: resolvedUri, headers });
      } catch (caughtError) {
        if (!cancelled) {
          setImageSource(null);
          setError(caughtError instanceof Error ? caughtError.message : getMarkdownImageLoadErrorFallback());
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
    return <Text>{alt ? imageLabel : error}</Text>;
  }

  if (!imageSource) {
    return <Text>{imageLabel}</Text>;
  }

  return <Image source={imageSource} style={style} resizeMode="contain" accessibilityLabel={imageLabel} />;
};

function getMarkdownCodeContent(node: any): string {
  if (typeof node?.content === 'string') return node.content.replace(/\n$/, '');
  if (typeof node?.literal === 'string') return node.literal.replace(/\n$/, '');
  if (Array.isArray(node?.children)) {
    return node.children.map(getMarkdownCodeContent).join('').replace(/\n$/, '');
  }
  return '';
}

const MarkdownCodeBlock: React.FC<{
  node: any;
  styles: any;
  colors: MarkdownContentMobileSurfaceRenderState['colors'];
}> = ({ node, styles, colors }) => {
  const [copied, setCopied] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const codeContent = getMarkdownCodeContent(node);
  const codeBlockCopyRenderState = getMarkdownCodeBlockCopyMobileRenderState({
    isCopied: copied,
    colors,
  });

  React.useEffect(() => () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const handleCopy = React.useCallback(async () => {
    if (!codeContent) return;
    try {
      await Clipboard.setStringAsync(codeContent);
      setCopied(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(
        () => setCopied(false),
        getMarkdownCodeBlockFeedbackResetDelayMs(),
      );
    } catch {
      // Clipboard failures should not disturb markdown reading.
    }
  }, [codeContent]);
  const codeBlockCopyParts = createMarkdownCodeBlockCopyMobilePropsParts({
    renderState: codeBlockCopyRenderState,
    styles,
    codeContent,
    isCopied: copied,
    onCopy: handleCopy,
  });

  return (
    <View {...codeBlockCopyParts.container.props}>
      <Text {...codeBlockCopyParts.text.props}>
        {codeBlockCopyParts.text.text}
      </Text>
      <Pressable
        {...codeBlockCopyParts.button.props}
      >
        <Ionicons
          {...codeBlockCopyParts.button.icon.props}
        />
      </Pressable>
    </View>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  assetBaseUrl,
  assetAuthToken,
  getThinkKey,
  isThinkExpanded,
  onToggleThink,
}) => {
  const { theme, isDark } = useTheme();
  const markdownContentRenderState = React.useMemo(
    () => getMarkdownContentMobileSurfaceRenderState({
      colors: theme.colors,
      isDark,
    }),
    [isDark, theme.colors],
  );
  const markdownContentColors = markdownContentRenderState.colors;
  const markdownContentStyleSlots = React.useMemo(
    () => createMarkdownContentMobileStyleSlots({
      renderState: markdownContentRenderState,
      spacing,
      radius,
      platform: Platform.OS,
    }),
    [markdownContentRenderState],
  );
  const markdownStyles = React.useMemo(
    () => StyleSheet.create(markdownContentStyleSlots),
    [markdownContentStyleSlots],
  );
  const thinkSectionRenderState = React.useMemo(
    () => getMarkdownThinkSectionMobileSurfaceRenderState({ isDark }),
    [isDark],
  );
  const thinkSectionStyleSlots = React.useMemo(
    () => createMarkdownThinkSectionMobileStyleSlots({
      renderState: thinkSectionRenderState,
      spacing,
      radius,
    }),
    [thinkSectionRenderState],
  );
  const thinkStyles = React.useMemo(
    () => StyleSheet.create(thinkSectionStyleSlots),
    [thinkSectionStyleSlots],
  );

  const parts = splitMarkdownContent(content, getMarkdownRenderOptions());
  const markdownRules = React.useMemo(() => ({
    code_block: (node: any) => (
      <MarkdownCodeBlock
        key={node.key}
        node={node}
        styles={markdownStyles}
        colors={markdownContentColors}
      />
    ),
    fence: (node: any) => (
      <MarkdownCodeBlock
        key={node.key}
        node={node}
        styles={markdownStyles}
        colors={markdownContentColors}
      />
    ),
    image: (node: any) => {
      const src = String(node.attributes?.src || '');
      const alt = typeof node.attributes?.alt === 'string' ? node.attributes.alt : undefined;
      if (!src) return null;
      if (!isAllowedMarkdownImageUrl(src)) {
        return <Text key={node.key}>{getMarkdownImageFallbackLabel(alt)}</Text>;
      }
      return (
        <MarkdownImage
          key={node.key}
          sourceUrl={src}
          alt={alt}
          assetBaseUrl={assetBaseUrl}
          authToken={assetAuthToken}
          style={markdownStyles.image as StyleProp<ImageStyle>}
        />
      );
    },
  }), [assetAuthToken, assetBaseUrl, markdownContentColors, markdownStyles]);

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
          const thinkControl = getMarkdownThinkSectionControlState(part.content, index, {
            getThinkKey,
            isThinkExpanded,
            onToggleThink,
          });
          return (
            <ThinkSection
              key={thinkControl.key}
              content={part.content}
              renderState={thinkSectionRenderState}
              markdownStyles={markdownStyles}
              markdownRules={markdownRules}
              styles={thinkStyles}
              defaultCollapsed={true}
              {...(thinkControl.isControlled ? {
                isCollapsed: thinkControl.isCollapsed,
                onToggle: thinkControl.onToggle,
              } : {})}
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
