import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { splitContentByMarkdownVideos } from '@dotagents/shared';
import { useTheme } from './ThemeProvider';
import { spacing, radius } from './theme';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
}) => {
  const { theme, isDark } = useTheme();

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
    videoBlock: {
      marginBottom: spacing.xs,
    },
    videoCaption: {
      color: theme.colors.mutedForeground,
      fontSize: 11,
      lineHeight: 16,
      marginTop: 4,
    },
    videoFallback: {
      minHeight: 140,
      maxHeight: 320,
      borderRadius: radius.md,
      backgroundColor: theme.colors.muted,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.md,
    },
    videoFallbackLabel: {
      color: theme.colors.foreground,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '700',
      marginBottom: 4,
    },
    videoFallbackMeta: {
      color: theme.colors.mutedForeground,
      fontSize: 11,
      lineHeight: 16,
      textAlign: 'center',
    },
  });

  const segments = splitContentByMarkdownVideos(content);

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === 'markdown') {
          if (!segment.content) {
            return null;
          }
          return (
            <Markdown key={`markdown-${index}`} style={markdownStyles}>
              {segment.content}
            </Markdown>
          );
        }

        return (
          <View key={`video-${index}`} style={markdownStyles.videoBlock}>
            {Platform.OS === 'web' ? (
              // React Native Web supports rendering intrinsic media elements.
              // @ts-ignore - intrinsic video elements are web-only here.
              <video
                src={segment.url}
                controls
                playsInline
                preload="metadata"
                style={{
                  width: '100%',
                  minHeight: 140,
                  maxHeight: 320,
                  borderRadius: radius.md,
                  backgroundColor: theme.colors.muted,
                } as any}
              />
            ) : (
              <View style={markdownStyles.videoFallback}>
                <Text style={markdownStyles.videoFallbackLabel}>Video attachment</Text>
                <Text style={markdownStyles.videoFallbackMeta}>
                  {segment.label || 'Play this video on web or keep it in the transcript as an attachment.'}
                </Text>
              </View>
            )}
            {!!segment.label && (
              <Text style={markdownStyles.videoCaption}>{segment.label}</Text>
            )}
          </View>
        );
      })}
    </>
  );
};

export default MarkdownRenderer;
