import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View, type ImageStyle, type StyleProp } from 'react-native';
import Markdown from 'react-native-markdown-display';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import {
  buildConversationImageAssetHttpUrl,
  isAllowedMarkdownImageUrl,
  parseConversationImageAssetUrl,
} from '@dotagents/shared/conversation-media-assets';
import { useTheme } from './ThemeProvider';
import { spacing, radius } from './theme';
import { VideoAttachmentCard } from './VideoAttachmentCard';
import {
  formatMarkdownImageRequestFailedMessage,
  getMarkdownCodeBlockCopyLabel,
  getMarkdownCodeBlockCopyMobileButtonState,
  getMarkdownCodeBlockCopyMobileIconState,
  getMarkdownCodeBlockFeedbackResetDelayMs,
  getMarkdownContentMobileSurfaceRenderState,
  getMarkdownImageFallbackLabel,
  getMarkdownImageInvalidAssetUrlMessage,
  getMarkdownImageLoadErrorFallback,
  getMarkdownImageUnavailableLabel,
  getMarkdownRenderOptions,
  getMarkdownThinkSectionAccessibilityLabel,
  getMarkdownThinkSectionControlState,
  getMarkdownThinkSectionDisplayLabel,
  getMarkdownThinkSectionMobileChevronIconState,
  getMarkdownThinkSectionMobileLeadingIconState,
  getMarkdownThinkSectionMobileSurfaceRenderState,
  isAllowedMarkdownContentLinkUrl,
  splitMarkdownContent,
  type MarkdownContentMobileSurfaceRenderState,
  type MarkdownThinkSectionControlOptions,
  type MarkdownThinkSectionMobileSurfaceRenderState,
} from '@dotagents/shared/markdown-render-parts';
import { SettingsApiClient } from '../lib/settingsApi';
import { resolveMobileFontFamily } from './mobileTypography';

interface MarkdownRendererProps extends MarkdownThinkSectionControlOptions {
  content: string;
  assetBaseUrl?: string;
  assetAuthToken?: string;
}

const codeBlockCopyButtonState = getMarkdownCodeBlockCopyMobileButtonState();
const copiedCodeBlockCopyButtonState = getMarkdownCodeBlockCopyMobileButtonState(true);

const ThinkSection: React.FC<{
  content: string;
  colors: MarkdownThinkSectionMobileSurfaceRenderState['colors'];
  markdownStyles: any;
  markdownRules: any;
  styles: any;
  defaultCollapsed?: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
}> = ({
  content,
  colors,
  markdownStyles,
  markdownRules,
  styles,
  defaultCollapsed = true,
  isCollapsed,
  onToggle,
}) => {
  const [internalCollapsed, setInternalCollapsed] = React.useState(defaultCollapsed);
  const collapsed = isCollapsed ?? internalCollapsed;
  const chevronIcon = getMarkdownThinkSectionMobileChevronIconState(collapsed);
  const thinkIcon = getMarkdownThinkSectionMobileLeadingIconState();
  const handleToggle = React.useCallback(() => {
    if (onToggle) {
      onToggle();
      return;
    }
    setInternalCollapsed(prev => !prev);
  }, [onToggle]);

  return (
    <View style={[styles.container, collapsed ? styles.containerCollapsed : styles.containerExpanded]}>
      <Pressable
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityLabel={getMarkdownThinkSectionAccessibilityLabel(collapsed)}
        accessibilityState={{ expanded: !collapsed }}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
      >
        <Ionicons
          name={chevronIcon.name}
          size={chevronIcon.size}
          color={colors.chevron.color}
        />
        <Ionicons
          name={thinkIcon.name}
          size={thinkIcon.size}
          color={colors.icon.color}
        />
        <Text style={styles.label}>{getMarkdownThinkSectionDisplayLabel(collapsed)}</Text>
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

function getHeaderRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

const resolveMobileMarkdownSpacing = (value: keyof typeof spacing | number) =>
  typeof value === 'number' ? value : spacing[value];

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
    return <Text>{alt || error}</Text>;
  }

  if (!imageSource) {
    return <Text>{getMarkdownImageFallbackLabel(alt)}</Text>;
  }

  return <Image source={imageSource} style={style} resizeMode="contain" accessibilityLabel={alt} />;
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
  const copyLabel = getMarkdownCodeBlockCopyLabel(copied);
  const codeBlockCopyIcon = getMarkdownCodeBlockCopyMobileIconState(copied);
  const codeBlockCopyIconColor = copied
    ? colors.codeBlockCopyIcon.copiedColor
    : colors.codeBlockCopyIcon.color;

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

  return (
    <View style={styles.codeBlockCopyContainer}>
      <Text style={styles.codeBlockCopyText} selectable>
        {codeContent}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copyLabel}
        onPress={handleCopy}
        style={({ pressed }) => [
          styles.codeBlockCopyButton,
          copied && styles.codeBlockCopyButtonCopied,
          pressed && styles.codeBlockCopyButtonPressed,
        ]}
      >
        <Ionicons
          name={codeBlockCopyIcon.name}
          size={codeBlockCopyIcon.size}
          color={codeBlockCopyIconColor}
        />
      </Pressable>
    </View>
  );
};

const createThinkStyles = (renderState: MarkdownThinkSectionMobileSurfaceRenderState) => {
  const thinkSectionSurface = renderState.surface;
  const colors = renderState.colors;

  return StyleSheet.create({
    container: {
      overflow: thinkSectionSurface.container.overflow,
      borderRadius: radius[thinkSectionSurface.container.borderRadius],
      borderWidth: thinkSectionSurface.container.borderWidth,
      marginVertical: resolveMobileMarkdownSpacing(thinkSectionSurface.container.collapsedMarginVertical),
    },
    containerCollapsed: {
      borderColor: colors.collapsedContainer.borderColor,
      backgroundColor: colors.collapsedContainer.backgroundColor,
    },
    containerExpanded: {
      borderColor: colors.expandedContainer.borderColor,
      backgroundColor: colors.expandedContainer.backgroundColor,
      marginVertical: resolveMobileMarkdownSpacing(thinkSectionSurface.container.expandedMarginVertical),
    },
    header: {
      minHeight: thinkSectionSurface.header.minHeight,
      flexDirection: thinkSectionSurface.header.flexDirection,
      alignItems: thinkSectionSurface.header.alignItems,
      gap: thinkSectionSurface.header.gap,
      paddingHorizontal: spacing[thinkSectionSurface.header.paddingHorizontal],
      paddingVertical: thinkSectionSurface.header.paddingVertical,
    },
    headerPressed: {
      opacity: thinkSectionSurface.header.pressedOpacity,
    },
    label: {
      color: colors.label.color,
      fontSize: thinkSectionSurface.label.fontSize,
      fontWeight: thinkSectionSurface.label.fontWeight,
      flex: thinkSectionSurface.label.flex,
    },
    content: {
      paddingHorizontal: spacing[thinkSectionSurface.content.paddingHorizontal],
      paddingBottom: spacing[thinkSectionSurface.content.paddingBottom],
    },
  });
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
  const markdownContentSurface = markdownContentRenderState.surface;
  const markdownContentColors = markdownContentRenderState.colors;
  const thinkSectionRenderState = React.useMemo(
    () => getMarkdownThinkSectionMobileSurfaceRenderState({ isDark }),
    [isDark],
  );
  const thinkSectionColors = thinkSectionRenderState.colors;
  const thinkStyles = React.useMemo(
    () => createThinkStyles(thinkSectionRenderState),
    [thinkSectionRenderState],
  );

  // Compact markdown styles matching desktop's tight layout
  const markdownStyles = StyleSheet.create({
    body: {
      color: markdownContentColors.body.color,
      fontSize: markdownContentSurface.body.fontSize,
      lineHeight: markdownContentSurface.body.lineHeight,
    },
    heading1: {
      color: markdownContentColors.heading1.color,
      fontSize: markdownContentSurface.heading1.fontSize,
      fontWeight: markdownContentSurface.heading1.fontWeight,
      marginTop: spacing[markdownContentSurface.heading1.marginTop],
      marginBottom: markdownContentSurface.heading1.marginBottom,
    },
    heading2: {
      color: markdownContentColors.heading2.color,
      fontSize: markdownContentSurface.heading2.fontSize,
      fontWeight: markdownContentSurface.heading2.fontWeight,
      marginTop: spacing[markdownContentSurface.heading2.marginTop],
      marginBottom: markdownContentSurface.heading2.marginBottom,
    },
    heading3: {
      color: markdownContentColors.heading3.color,
      fontSize: markdownContentSurface.heading3.fontSize,
      fontWeight: markdownContentSurface.heading3.fontWeight,
      marginTop: markdownContentSurface.heading3.marginTop,
      marginBottom: markdownContentSurface.heading3.marginBottom,
    },
    paragraph: {
      color: markdownContentColors.paragraph.color,
      marginBottom: spacing[markdownContentSurface.paragraph.marginBottom],
      lineHeight: markdownContentSurface.paragraph.lineHeight,
    },
    strong: {
      fontWeight: markdownContentSurface.strong.fontWeight,
    },
    em: {
      fontStyle: markdownContentSurface.emphasis.fontStyle,
    },
    s: {
      textDecorationLine: markdownContentSurface.strikethrough.textDecorationLine,
    },
    bullet_list: {
      marginBottom: spacing[markdownContentSurface.list.marginBottom],
    },
    ordered_list: {
      marginBottom: spacing[markdownContentSurface.list.marginBottom],
    },
    list_item: {
      marginBottom: markdownContentSurface.list.itemMarginBottom,
    },
    bullet_list_icon: {
      color: markdownContentColors.list.iconColor,
      marginRight: markdownContentSurface.list.iconMarginRight,
    },
    ordered_list_icon: {
      color: markdownContentColors.list.iconColor,
      marginRight: markdownContentSurface.list.iconMarginRight,
    },
    code_inline: {
      backgroundColor: markdownContentColors.inlineCode.backgroundColor,
      color: markdownContentColors.inlineCode.color,
      fontFamily: resolveMobileFontFamily(markdownContentSurface.inlineCode.fontFamilyByPlatform),
      fontSize: markdownContentSurface.inlineCode.fontSize,
      paddingHorizontal: markdownContentSurface.inlineCode.paddingHorizontal,
      paddingVertical: markdownContentSurface.inlineCode.paddingVertical,
      borderRadius: radius[markdownContentSurface.inlineCode.borderRadius],
    },
    code_block: {
      backgroundColor: markdownContentColors.codeBlock.backgroundColor,
      color: markdownContentColors.codeBlock.color,
      fontFamily: resolveMobileFontFamily(markdownContentSurface.codeBlock.fontFamilyByPlatform),
      fontSize: markdownContentSurface.codeBlock.fontSize,
      padding: spacing[markdownContentSurface.codeBlock.padding],
      borderRadius: radius[markdownContentSurface.codeBlock.borderRadius],
      marginBottom: spacing[markdownContentSurface.codeBlock.marginBottom],
      overflow: markdownContentSurface.codeBlock.overflow,
    },
    fence: {
      backgroundColor: markdownContentColors.codeBlock.backgroundColor,
      color: markdownContentColors.codeBlock.color,
      fontFamily: resolveMobileFontFamily(markdownContentSurface.codeBlock.fontFamilyByPlatform),
      fontSize: markdownContentSurface.codeBlock.fontSize,
      padding: spacing[markdownContentSurface.codeBlock.padding],
      borderRadius: radius[markdownContentSurface.codeBlock.borderRadius],
      marginBottom: spacing[markdownContentSurface.codeBlock.marginBottom],
      overflow: markdownContentSurface.codeBlock.overflow,
    },
    codeBlockCopyContainer: {
      position: 'relative',
      marginBottom: spacing[markdownContentSurface.codeBlock.marginBottom],
    },
    codeBlockCopyText: {
      backgroundColor: markdownContentColors.codeBlock.backgroundColor,
      color: markdownContentColors.codeBlock.color,
      fontFamily: resolveMobileFontFamily(markdownContentSurface.codeBlock.fontFamilyByPlatform),
      fontSize: markdownContentSurface.codeBlock.fontSize,
      padding: spacing[markdownContentSurface.codeBlock.padding],
      paddingRight: markdownContentSurface.codeBlock.copyPaddingRight,
      borderRadius: radius[markdownContentSurface.codeBlock.borderRadius],
      overflow: markdownContentSurface.codeBlock.overflow,
    },
    codeBlockCopyButton: {
      position: codeBlockCopyButtonState.position,
      top: codeBlockCopyButtonState.top,
      right: codeBlockCopyButtonState.right,
      width: codeBlockCopyButtonState.size,
      height: codeBlockCopyButtonState.size,
      borderRadius: radius[codeBlockCopyButtonState.borderRadius],
      borderWidth: codeBlockCopyButtonState.borderWidth,
      borderColor: markdownContentColors.codeBlockCopyButton.borderColor,
      backgroundColor: markdownContentColors.codeBlockCopyButton.backgroundColor,
      alignItems: codeBlockCopyButtonState.alignItems,
      justifyContent: codeBlockCopyButtonState.justifyContent,
    },
    codeBlockCopyButtonCopied: {
      borderColor: markdownContentColors.codeBlockCopyButton.copiedBorderColor,
      backgroundColor: markdownContentColors.codeBlockCopyButton.copiedBackgroundColor,
    },
    codeBlockCopyButtonPressed: {
      opacity: codeBlockCopyButtonState.pressedOpacity,
    },
    blockquote: {
      backgroundColor: markdownContentColors.blockquote.backgroundColor,
      borderLeftWidth: markdownContentSurface.blockquote.borderLeftWidth,
      borderLeftColor: markdownContentColors.blockquote.borderLeftColor,
      paddingLeft: spacing[markdownContentSurface.blockquote.paddingLeft],
      paddingVertical: markdownContentSurface.blockquote.paddingVertical,
      marginBottom: spacing[markdownContentSurface.blockquote.marginBottom],
    },
    link: {
      color: markdownContentColors.link.color,
      textDecorationLine: markdownContentSurface.link.textDecorationLine,
    },
    image: {
      width: markdownContentSurface.image.width,
      minHeight: markdownContentSurface.image.minHeight,
      maxHeight: markdownContentSurface.image.maxHeight,
      borderRadius: radius[markdownContentSurface.image.borderRadius],
      marginBottom: spacing[markdownContentSurface.image.marginBottom],
      backgroundColor: markdownContentColors.image.backgroundColor,
    },
    table: {
      borderWidth: markdownContentSurface.table.borderWidth,
      borderColor: markdownContentColors.table.borderColor,
      borderRadius: radius[markdownContentSurface.table.borderRadius],
      marginBottom: spacing[markdownContentSurface.table.marginBottom],
    },
    thead: {
      backgroundColor: markdownContentColors.tableHead.backgroundColor,
    },
    th: {
      padding: spacing[markdownContentSurface.tableCell.padding],
      fontWeight: markdownContentSurface.tableCell.headerFontWeight,
      borderBottomWidth: markdownContentSurface.tableCell.borderBottomWidth,
      borderColor: markdownContentColors.tableCell.borderColor,
      fontSize: markdownContentSurface.tableCell.fontSize,
    },
    tr: {
      borderBottomWidth: markdownContentSurface.tableCell.borderBottomWidth,
      borderColor: markdownContentColors.tableCell.borderColor,
    },
    td: {
      padding: spacing[markdownContentSurface.tableCell.padding],
      fontSize: markdownContentSurface.tableCell.fontSize,
    },
    hr: {
      backgroundColor: markdownContentColors.horizontalRule.backgroundColor,
      height: markdownContentSurface.horizontalRule.height,
      marginVertical: spacing[markdownContentSurface.horizontalRule.marginVertical],
    },
  });

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
          style={markdownStyles.image}
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
              colors={thinkSectionColors}
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
