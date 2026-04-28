import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from './ThemeProvider';
import { spacing, radius } from './theme';
import { VideoAttachmentCard } from './VideoAttachmentCard';
import { splitMarkdownContent } from './markdownParts';

interface MarkdownRendererProps {
  content: string;
  assetBaseUrl?: string;
  assetAuthToken?: string;
}

const ThinkSection: React.FC<{
  content: string;
  markdownStyles: any;
  styles: any;
}> = ({ content, markdownStyles, styles }) => {
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
          <Markdown style={markdownStyles}>{content}</Markdown>
        </View>
      )}
    </View>
  );
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
              styles={thinkStyles}
            />
          );
        }

        if (!part.content?.trim()) return null;
        return (
          <Markdown key={`markdown-${index}`} style={markdownStyles}>
            {part.content}
          </Markdown>
        );
      })}
    </View>
  );
};

export default MarkdownRenderer;

