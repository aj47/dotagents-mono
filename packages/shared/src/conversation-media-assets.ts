import { assertSafeConversationId } from './conversation-id';
import { hexToRgba } from './colors';
import { REMOTE_SERVER_API_BUILDERS } from './remote-server-api';

export const CONVERSATION_VIDEO_ASSET_HOST = 'conversation-video';
export const CONVERSATION_VIDEO_ASSETS_DIR_NAME = '_videos';
export const CONVERSATION_IMAGE_ASSET_HOST = 'conversation-image';
export const CONVERSATION_IMAGE_ASSETS_DIR_NAME = '_images';

const CONVERSATION_VIDEO_ASSET_URL_REGEX = /^assets:\/\/conversation-video\/([^/]+)\/([^/?#]+)(?:[?#].*)?$/i;
const CONVERSATION_IMAGE_ASSET_URL_REGEX = /^assets:\/\/conversation-image\/([^/]+)\/([^/?#]+)(?:[?#].*)?$/i;
const VIDEO_EXTENSION_REGEX = /\.(?:mp4|m4v|webm|mov|ogv)(?:[?#].*)?$/i;
const SAFE_VIDEO_ASSET_FILE_REGEX = /^[a-f0-9]{16,64}\.(?:mp4|m4v|webm|mov|ogv)$/u;
const SAFE_IMAGE_ASSET_FILE_REGEX = /^[a-f0-9]{16,64}\.(?:png|apng|gif|jpe?g|webp|bmp|avif)$/u;
const MARKDOWN_DATA_IMAGE_URL_REGEX =
  /^data:image\/(?:png|apng|gif|jpe?g|webp|bmp|avif)(?:;|,)/i;
const RECORDING_ASSET_URL_REGEX = /^assets:\/\/recording\//i;

const VIDEO_MIME_BY_EXTENSION: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.ogv': 'video/ogg',
};

const VIDEO_EXTENSION_BY_MIME_SUBTYPE: Record<string, string> = {
  mp4: 'mp4',
  m4v: 'm4v',
  webm: 'webm',
  quicktime: 'mov',
  ogg: 'ogv',
};

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  '.png': 'image/png',
  '.apng': 'image/apng',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.avif': 'image/avif',
};

const CHAT_IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  ...IMAGE_MIME_BY_EXTENSION,
  '.svg': 'image/svg+xml',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
};

const IMAGE_EXTENSION_BY_MIME_SUBTYPE: Record<string, string> = {
  png: 'png',
  apng: 'apng',
  gif: 'gif',
  jpeg: 'jpg',
  jpg: 'jpg',
  webp: 'webp',
  bmp: 'bmp',
  avif: 'avif',
};

const DATA_IMAGE_BASE64_PREFIX_REGEX = /^data:image\/[a-z0-9.+-]+;base64,/i;
const DATA_IMAGE_URL_REGEX = /^data:(image\/[a-z0-9.+-]+);base64,([\s\S]+)$/i;
const DATA_IMAGE_MARKDOWN_REFERENCE_REGEX =
  /!\[([^\]]*)\]\((data:image\/[a-z0-9.+-]+;base64,[^)]+)\)/gi;
const CONVERSATION_IMAGE_MARKDOWN_REFERENCE_REGEX =
  /!\[([^\]]*)\]\((data:image\/[a-z0-9.+-]+;base64,[^)]+|assets:\/\/conversation-image\/[^)]+)\)/gi;
const MARKDOWN_IMAGE_REFERENCE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/gi;
const MARKDOWN_LINK_REFERENCE_REGEX = /(^|[^!])\[([^\]]*)\]\(([^)]+)\)/gi;
const MARKDOWN_MEDIA_IMAGE_URL_REGEX = /^(?:data:image\/|https?:\/\/|assets:\/\/conversation-image\/)/i;

export const MAX_RESPOND_TO_USER_IMAGES = 4;
export const MAX_RESPOND_TO_USER_VIDEOS = 2;
export const MAX_RESPOND_TO_USER_IMAGE_FILE_BYTES = 8 * 1024 * 1024;
export const MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES = 12 * 1024 * 1024;
export const MAX_RESPOND_TO_USER_VIDEO_FILE_BYTES = 250 * 1024 * 1024;
export const MAX_RESPOND_TO_USER_TOTAL_VIDEO_BYTES = 500 * 1024 * 1024;
export const MAX_RESPOND_TO_USER_RESPONSE_CONTENT_BYTES = 12 * 1024 * 1024;
export const MAX_CHAT_IMAGE_ATTACHMENTS = 4;
export const MAX_CHAT_IMAGE_FILE_BYTES = 4 * 1024 * 1024;
export const MAX_CHAT_TOTAL_EMBEDDED_IMAGE_BYTES = 900 * 1024;

export const CHAT_IMAGE_ATTACHMENT_PRESENTATION = {
  titles: {
    limitReached: 'Image limit reached',
    budgetReached: 'Image budget reached',
    skipped: 'Some images were skipped',
    tooLarge: 'Image too large',
    unsupportedFormat: 'Unsupported image format',
    pickerError: 'Image picker error',
  },
  errors: {
    attachFailed: 'Failed to attach image.',
    pickerFailed: 'Unable to select images right now.',
  },
  composerPreview: {
    removeTitle: 'Remove image',
  },
} as const;

export const CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION = {
  desktop: {
    composerPreview: {
      overlayRowClassName: 'flex w-full gap-2 overflow-x-auto pb-1',
      tileRowClassName: 'flex w-full gap-1.5 overflow-x-auto pb-1',
      overlayPreviewClassName: 'relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border',
      tilePreviewClassName: 'relative h-12 w-12 shrink-0 overflow-hidden rounded border border-border',
      imageClassName: 'h-full w-full object-cover',
      removeButtonClassName: 'absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white',
      overlayRemoveIconClassName: 'h-3 w-3',
      tileRemoveIconClassName: 'h-2.5 w-2.5',
    },
  },
  mobile: {
    row: {
      paddingHorizontal: 'sm',
      paddingTop: 'xs',
      paddingBottom: 2,
      gap: 'xs',
      showsHorizontalScrollIndicator: false,
    },
    preview: {
      size: 56,
      borderRadius: 'md',
      borderWidth: 1,
      borderColorToken: 'border',
      backgroundColorToken: 'muted',
      overflow: 'hidden',
      position: 'relative',
    },
    previewImage: {
      width: '100%',
      height: '100%',
    },
    removeButton: {
      accessibilityRole: 'button',
      position: 'absolute',
      top: 4,
      right: 4,
      size: 18,
      borderRadius: 9,
      backgroundColor: '#000000',
      backgroundAlpha: 0.7,
      pressedOpacity: 0.8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeIcon: {
      name: 'close',
      color: '#FFFFFF',
      size: 13,
    },
  },
} as const;

export interface ChatImageAttachmentMobileRemoveIconState {
  name: typeof CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.removeIcon.name;
  size: number;
  color: string;
}

export type ChatImageAttachmentMobileSurfaceColorToken =
  | typeof CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.preview.borderColorToken
  | typeof CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.preview.backgroundColorToken;

export type ChatImageAttachmentMobileSurfaceColorPalette =
  Readonly<Record<ChatImageAttachmentMobileSurfaceColorToken, string>>;

export interface ChatImageAttachmentMobileSurfaceColors {
  preview: {
    borderColor: string;
    backgroundColor: string;
  };
  removeButton: {
    backgroundColor: string;
  };
}

export interface ChatImageAttachmentMobileRenderStateInput {
  colors: ChatImageAttachmentMobileSurfaceColorPalette;
}

export interface ChatImageAttachmentMobileRenderState {
  copy: typeof CHAT_IMAGE_ATTACHMENT_PRESENTATION;
  surface: typeof CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile;
  colors: ChatImageAttachmentMobileSurfaceColors;
  removeButton: {
    accessibilityRole: typeof CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.removeButton.accessibilityRole;
    accessibilityLabel: typeof CHAT_IMAGE_ATTACHMENT_PRESENTATION.composerPreview.removeTitle;
    pressedOpacity: typeof CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.removeButton.pressedOpacity;
  };
  removeIcon: ChatImageAttachmentMobileRemoveIconState;
}

export interface ChatImageAttachmentDesktopComposerPreviewRenderState {
  copy: typeof CHAT_IMAGE_ATTACHMENT_PRESENTATION;
  surface: typeof CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.desktop.composerPreview;
  removeButton: {
    title: typeof CHAT_IMAGE_ATTACHMENT_PRESENTATION.composerPreview.removeTitle;
  };
}

export interface ChatImageAttachmentMobileAlertState {
  title: string;
  message: string;
}

export type ChatImageAttachmentMobileAlertInput =
  | {
      reason: 'limitReached';
      maxImages?: number;
    }
  | {
      reason: 'budgetReached';
      maxBytes?: number;
    }
  | {
      reason: 'missingData';
      names: readonly string[];
    }
  | {
      reason: 'selectionTooLarge';
      names: readonly string[];
      maxBytes?: number;
    }
  | {
      reason: 'unsupportedFormat';
      names: readonly string[];
    }
  | {
      reason: 'budgetExceeded';
      names: readonly string[];
      maxBytes?: number;
    }
  | {
      reason: 'pickerError';
      error: unknown;
      fallback?: string;
    };

export function getChatImageAttachmentDesktopSurfaceState(): typeof CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.desktop {
  return CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.desktop;
}

export function getChatImageAttachmentMobileSurfaceState(): typeof CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile {
  return CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile;
}

export function getChatImageAttachmentCopyState(): typeof CHAT_IMAGE_ATTACHMENT_PRESENTATION {
  return CHAT_IMAGE_ATTACHMENT_PRESENTATION;
}

export function getChatImageAttachmentMobileRemoveIconState(): ChatImageAttachmentMobileRemoveIconState {
  const removeIcon = CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.removeIcon;

  return {
    name: removeIcon.name,
    size: removeIcon.size,
    color: removeIcon.color,
  };
}

export function getChatImageAttachmentDesktopComposerPreviewRenderState(): ChatImageAttachmentDesktopComposerPreviewRenderState {
  const copy = getChatImageAttachmentCopyState();

  return {
    copy,
    surface: getChatImageAttachmentDesktopSurfaceState().composerPreview,
    removeButton: {
      title: copy.composerPreview.removeTitle,
    },
  };
}

export function getChatImageAttachmentMobileSurfaceColors(
  colors: ChatImageAttachmentMobileSurfaceColorPalette,
): ChatImageAttachmentMobileSurfaceColors {
  const surface = CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile;

  return {
    preview: {
      borderColor: colors[surface.preview.borderColorToken],
      backgroundColor: colors[surface.preview.backgroundColorToken],
    },
    removeButton: {
      backgroundColor: hexToRgba(surface.removeButton.backgroundColor, surface.removeButton.backgroundAlpha),
    },
  };
}

export function getChatImageAttachmentMobileRenderState({
  colors,
}: ChatImageAttachmentMobileRenderStateInput): ChatImageAttachmentMobileRenderState {
  const surface = getChatImageAttachmentMobileSurfaceState();
  const copy = getChatImageAttachmentCopyState();

  return {
    copy,
    surface,
    colors: getChatImageAttachmentMobileSurfaceColors(colors),
    removeButton: {
      accessibilityRole: surface.removeButton.accessibilityRole,
      accessibilityLabel: copy.composerPreview.removeTitle,
      pressedOpacity: surface.removeButton.pressedOpacity,
    },
    removeIcon: getChatImageAttachmentMobileRemoveIconState(),
  };
}

export const CHAT_VIDEO_ATTACHMENT_PRESENTATION = {
  labels: {
    play: 'Play video',
    loading: 'Loading…',
    openExternally: 'Open externally',
    desktopLazyLoadSubtitle: 'Loads only when you click play',
    mobileLazyLoadSubtitle: 'Loads only when you tap play',
  },
  errors: {
    missingCredentials: 'Missing video asset credentials.',
    loadFallback: 'Unable to load this video.',
  },
  glyphs: {
    link: '🔗',
    video: '🎬',
  },
} as const;

export const CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION = {
  desktop: {
    cardClassName: 'not-prose my-3 block overflow-hidden rounded-lg border border-border bg-muted/20',
    videoClassName: 'block max-h-[30rem] w-full bg-black',
    loadButtonClassName: 'flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/40',
    playIconWrapperClassName: 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary',
    playIconClassName: 'h-5 w-5',
    textWrapperClassName: 'min-w-0 flex-1',
    titleClassName: 'block truncate text-sm font-medium text-foreground',
    subtitleClassName: 'block text-xs text-muted-foreground',
  },
  mobile: {
    card: {
      borderWidth: 1,
      borderColorToken: 'border',
      borderRadius: 'lg',
      backgroundColor: {
        dark: '#ffffff',
        darkAlpha: 0.04,
        light: '#000000',
        lightAlpha: 0.03,
      },
      overflow: 'hidden',
      marginBottom: 'sm',
    },
    header: {
      padding: 'sm',
      gap: 2,
    },
    loadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 'sm',
      accessibilityRole: 'button',
      pressedOpacity: 0.72,
      disabledOpacity: 0.65,
    },
    playIconWrapper: {
      size: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColorToken: 'primary',
      backgroundAlpha: 0.09,
    },
    playIcon: {
      name: 'play-circle',
      size: 22,
      colorToken: 'primary',
    },
    textWrapper: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      colorToken: 'foreground',
      fontWeight: '600',
      fontSize: 13,
      numberOfLines: 1,
    },
    subtitle: {
      colorToken: 'mutedForeground',
      fontSize: 11,
      numberOfLines: 1,
    },
    button: {
      marginTop: 'xs',
      alignSelf: 'flex-start',
      borderRadius: 'md',
      backgroundColorToken: 'primary',
      paddingHorizontal: 'sm',
      paddingVertical: 6,
    },
    buttonText: {
      colorToken: 'primaryForeground',
      fontWeight: '700',
      fontSize: 12,
    },
    video: {
      width: '100%',
      height: 220,
      backgroundColor: '#000',
    },
    fallbackLink: {
      accessibilityRole: 'link',
      paddingVertical: 'xs',
      marginBottom: 'sm',
      pressedOpacity: 0.72,
    },
    fallbackLinkText: {
      colorToken: 'primary',
      fontSize: 13,
      textDecorationLine: 'underline',
    },
    externalLink: {
      accessibilityRole: 'link',
      marginTop: 'xs',
      pressedOpacity: 0.72,
    },
    errorText: {
      colorToken: 'destructive',
      fontSize: 11,
      marginTop: 'xs',
    },
  },
} as const;

export function getChatVideoAttachmentMobileSurfaceState(): typeof CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile {
  return CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile;
}

export function getChatVideoAttachmentDesktopSurfaceState(): typeof CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.desktop {
  return CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.desktop;
}

export function getChatVideoAttachmentCopyState(): typeof CHAT_VIDEO_ATTACHMENT_PRESENTATION {
  return CHAT_VIDEO_ATTACHMENT_PRESENTATION;
}

export type ChatVideoAttachmentMobileSurfaceColorToken =
  | typeof CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.card.borderColorToken
  | typeof CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.playIconWrapper.backgroundColorToken
  | typeof CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.playIcon.colorToken
  | typeof CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.title.colorToken
  | typeof CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.subtitle.colorToken
  | typeof CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.button.backgroundColorToken
  | typeof CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.buttonText.colorToken
  | typeof CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.fallbackLinkText.colorToken
  | typeof CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.errorText.colorToken;

export type ChatVideoAttachmentMobileSurfaceColorPalette =
  Readonly<Record<ChatVideoAttachmentMobileSurfaceColorToken, string>>;

export interface ChatVideoAttachmentMobileSurfaceColors {
  card: {
    borderColor: string;
    backgroundColor: string;
  };
  playIconWrapper: {
    backgroundColor: string;
  };
  playIcon: {
    color: string;
  };
  title: {
    color: string;
  };
  subtitle: {
    color: string;
  };
  button: {
    backgroundColor: string;
  };
  buttonText: {
    color: string;
  };
  fallbackLinkText: {
    color: string;
  };
  errorText: {
    color: string;
  };
}

export interface ChatVideoAttachmentDesktopRenderStateInput {
  src: string;
  label?: string;
}

export interface ChatVideoAttachmentDesktopRenderState {
  copy: typeof CHAT_VIDEO_ATTACHMENT_PRESENTATION;
  surface: typeof CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.desktop;
  displayLabel: string;
  subtitle: typeof CHAT_VIDEO_ATTACHMENT_PRESENTATION.labels.desktopLazyLoadSubtitle;
  loadButton: {
    accessibilityLabel: string;
  };
}

export interface ChatVideoAttachmentMobileRenderStateInput {
  sourceUrl: string;
  label?: string;
  colors: ChatVideoAttachmentMobileSurfaceColorPalette;
  isDark?: boolean;
  loading?: boolean;
}

export interface ChatVideoAttachmentMobileRenderState {
  copy: typeof CHAT_VIDEO_ATTACHMENT_PRESENTATION;
  surface: typeof CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile;
  colors: ChatVideoAttachmentMobileSurfaceColors;
  displayLabel: string;
  title: string;
  subtitle: string;
  fallbackLink: {
    accessibilityRole: typeof CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.fallbackLink.accessibilityRole;
    accessibilityLabel: string;
  };
  video: {
    accessibilityLabel: string;
  };
  loadButton: {
    accessibilityRole: typeof CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.loadButton.accessibilityRole;
    accessibilityLabel: string;
    accessibilityState: { busy: boolean };
  };
  externalLink: {
    accessibilityRole: typeof CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.externalLink.accessibilityRole;
    accessibilityLabel: string;
  };
}

type ChatVideoAttachmentMobileSurface =
  typeof CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile;

export type ChatVideoAttachmentMobileStyleSpacingToken =
  | ChatVideoAttachmentMobileSurface['card']['marginBottom']
  | ChatVideoAttachmentMobileSurface['header']['padding']
  | ChatVideoAttachmentMobileSurface['loadButton']['padding']
  | ChatVideoAttachmentMobileSurface['fallbackLink']['paddingVertical']
  | ChatVideoAttachmentMobileSurface['fallbackLink']['marginBottom']
  | ChatVideoAttachmentMobileSurface['externalLink']['marginTop']
  | ChatVideoAttachmentMobileSurface['errorText']['marginTop'];

export type ChatVideoAttachmentMobileStyleRadiusToken =
  ChatVideoAttachmentMobileSurface['card']['borderRadius'];

export interface ChatVideoAttachmentMobileStyleSlotsInput {
  renderState: Pick<ChatVideoAttachmentMobileRenderState, 'surface' | 'colors'>;
  spacing: Readonly<Record<ChatVideoAttachmentMobileStyleSpacingToken, number>>;
  radius: Readonly<Record<ChatVideoAttachmentMobileStyleRadiusToken, number>>;
}

export interface ChatVideoAttachmentMobileStyleSlots {
  card: {
    borderWidth: number;
    borderColor: string;
    borderRadius: number;
    backgroundColor: string;
    overflow: ChatVideoAttachmentMobileSurface['card']['overflow'];
    marginBottom: number;
  };
  header: {
    padding: number;
    gap: number;
  };
  loadButton: {
    flexDirection: ChatVideoAttachmentMobileSurface['loadButton']['flexDirection'];
    alignItems: ChatVideoAttachmentMobileSurface['loadButton']['alignItems'];
    gap: number;
    padding: number;
  };
  loadButtonPressed: {
    opacity: number;
  };
  loadButtonDisabled: {
    opacity: number;
  };
  playIconWrapper: {
    width: number;
    height: number;
    borderRadius: number;
    alignItems: ChatVideoAttachmentMobileSurface['playIconWrapper']['alignItems'];
    justifyContent: ChatVideoAttachmentMobileSurface['playIconWrapper']['justifyContent'];
    backgroundColor: string;
  };
  textWrapper: {
    flex: number;
    minWidth: number;
  };
  title: {
    color: string;
    fontWeight: ChatVideoAttachmentMobileSurface['title']['fontWeight'];
    fontSize: number;
  };
  subtitle: {
    color: string;
    fontSize: number;
  };
  video: {
    width: ChatVideoAttachmentMobileSurface['video']['width'];
    height: number;
    backgroundColor: string;
  };
  fallbackLink: {
    paddingVertical: number;
    marginBottom: number;
  };
  fallbackLinkPressed: {
    opacity: number;
  };
  fallbackLinkText: {
    color: string;
    fontSize: number;
    textDecorationLine: ChatVideoAttachmentMobileSurface['fallbackLinkText']['textDecorationLine'];
  };
  externalLink: {
    marginTop: number;
  };
  externalLinkPressed: {
    opacity: number;
  };
  errorText: {
    color: string;
    fontSize: number;
    marginTop: number;
  };
}

export function getChatVideoAttachmentMobileSurfaceColors(
  colors: ChatVideoAttachmentMobileSurfaceColorPalette,
  input: { isDark?: boolean } = {},
): ChatVideoAttachmentMobileSurfaceColors {
  const surface = CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile;
  const cardBackground = input.isDark
    ? surface.card.backgroundColor.dark
    : surface.card.backgroundColor.light;
  const cardBackgroundAlpha = input.isDark
    ? surface.card.backgroundColor.darkAlpha
    : surface.card.backgroundColor.lightAlpha;

  return {
    card: {
      borderColor: colors[surface.card.borderColorToken],
      backgroundColor: hexToRgba(cardBackground, cardBackgroundAlpha),
    },
    playIconWrapper: {
      backgroundColor: hexToRgba(
        colors[surface.playIconWrapper.backgroundColorToken],
        surface.playIconWrapper.backgroundAlpha,
      ),
    },
    playIcon: {
      color: colors[surface.playIcon.colorToken],
    },
    title: {
      color: colors[surface.title.colorToken],
    },
    subtitle: {
      color: colors[surface.subtitle.colorToken],
    },
    button: {
      backgroundColor: colors[surface.button.backgroundColorToken],
    },
    buttonText: {
      color: colors[surface.buttonText.colorToken],
    },
    fallbackLinkText: {
      color: colors[surface.fallbackLinkText.colorToken],
    },
    errorText: {
      color: colors[surface.errorText.colorToken],
    },
  };
}

export function createChatVideoAttachmentMobileStyleSlots({
  renderState,
  spacing,
  radius,
}: ChatVideoAttachmentMobileStyleSlotsInput): ChatVideoAttachmentMobileStyleSlots {
  const surface = renderState.surface;
  const colors = renderState.colors;

  return {
    card: {
      borderWidth: surface.card.borderWidth,
      borderColor: colors.card.borderColor,
      borderRadius: radius[surface.card.borderRadius],
      backgroundColor: colors.card.backgroundColor,
      overflow: surface.card.overflow,
      marginBottom: spacing[surface.card.marginBottom],
    },
    header: {
      padding: spacing[surface.header.padding],
      gap: surface.header.gap,
    },
    loadButton: {
      flexDirection: surface.loadButton.flexDirection,
      alignItems: surface.loadButton.alignItems,
      gap: surface.loadButton.gap,
      padding: spacing[surface.loadButton.padding],
    },
    loadButtonPressed: {
      opacity: surface.loadButton.pressedOpacity,
    },
    loadButtonDisabled: {
      opacity: surface.loadButton.disabledOpacity,
    },
    playIconWrapper: {
      width: surface.playIconWrapper.size,
      height: surface.playIconWrapper.size,
      borderRadius: surface.playIconWrapper.borderRadius,
      alignItems: surface.playIconWrapper.alignItems,
      justifyContent: surface.playIconWrapper.justifyContent,
      backgroundColor: colors.playIconWrapper.backgroundColor,
    },
    textWrapper: {
      flex: surface.textWrapper.flex,
      minWidth: surface.textWrapper.minWidth,
    },
    title: {
      color: colors.title.color,
      fontWeight: surface.title.fontWeight,
      fontSize: surface.title.fontSize,
    },
    subtitle: {
      color: colors.subtitle.color,
      fontSize: surface.subtitle.fontSize,
    },
    video: {
      width: surface.video.width,
      height: surface.video.height,
      backgroundColor: surface.video.backgroundColor,
    },
    fallbackLink: {
      paddingVertical: spacing[surface.fallbackLink.paddingVertical],
      marginBottom: spacing[surface.fallbackLink.marginBottom],
    },
    fallbackLinkPressed: {
      opacity: surface.fallbackLink.pressedOpacity,
    },
    fallbackLinkText: {
      color: colors.fallbackLinkText.color,
      fontSize: surface.fallbackLinkText.fontSize,
      textDecorationLine: surface.fallbackLinkText.textDecorationLine,
    },
    externalLink: {
      marginTop: spacing[surface.externalLink.marginTop],
    },
    externalLinkPressed: {
      opacity: surface.externalLink.pressedOpacity,
    },
    errorText: {
      color: colors.errorText.color,
      fontSize: surface.errorText.fontSize,
      marginTop: spacing[surface.errorText.marginTop],
    },
  };
}

export function getVideoAttachmentLoadAccessibilityLabel(displayLabel: string): string {
  return `Load video ${displayLabel}`;
}

export function getVideoAttachmentPlayAccessibilityLabel(displayLabel: string): string {
  return `Play video ${displayLabel}`;
}

export function getVideoAttachmentOpenLinkAccessibilityLabel(displayLabel: string): string {
  return `Open video link: ${displayLabel}`;
}

export function getChatVideoAttachmentDesktopRenderState({
  src,
  label,
}: ChatVideoAttachmentDesktopRenderStateInput): ChatVideoAttachmentDesktopRenderState {
  const copy = getChatVideoAttachmentCopyState();
  const displayLabel = getVideoAssetLabel(label, src);

  return {
    copy,
    surface: getChatVideoAttachmentDesktopSurfaceState(),
    displayLabel,
    subtitle: copy.labels.desktopLazyLoadSubtitle,
    loadButton: {
      accessibilityLabel: getVideoAttachmentLoadAccessibilityLabel(displayLabel),
    },
  };
}

export function getChatVideoAttachmentMobileRenderState({
  sourceUrl,
  label,
  colors,
  isDark,
  loading = false,
}: ChatVideoAttachmentMobileRenderStateInput): ChatVideoAttachmentMobileRenderState {
  const copy = getChatVideoAttachmentCopyState();
  const surface = getChatVideoAttachmentMobileSurfaceState();
  const displayLabel = getVideoAssetLabel(label, sourceUrl);

  return {
    copy,
    surface,
    colors: getChatVideoAttachmentMobileSurfaceColors(colors, { isDark }),
    displayLabel,
    title: `${copy.glyphs.video} ${displayLabel}`,
    subtitle: loading ? copy.labels.loading : copy.labels.mobileLazyLoadSubtitle,
    fallbackLink: {
      accessibilityRole: surface.fallbackLink.accessibilityRole,
      accessibilityLabel: getVideoAttachmentOpenLinkAccessibilityLabel(displayLabel),
    },
    video: {
      accessibilityLabel: getVideoAttachmentPlayAccessibilityLabel(displayLabel),
    },
    loadButton: {
      accessibilityRole: surface.loadButton.accessibilityRole,
      accessibilityLabel: getVideoAttachmentLoadAccessibilityLabel(displayLabel),
      accessibilityState: { busy: loading },
    },
    externalLink: {
      accessibilityRole: surface.externalLink.accessibilityRole,
      accessibilityLabel: getVideoAttachmentOpenLinkAccessibilityLabel(displayLabel),
    },
  };
}

export function formatVideoAttachmentRequestFailedMessage(status: number): string {
  return `Video request failed (${status})`;
}

function formatChatImageNameList(names: readonly string[]): string {
  return names.join(', ');
}

function formatChatImageMegabyteLimit(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

export function formatChatImageAttachmentLimitMessage(
  maxImages = MAX_CHAT_IMAGE_ATTACHMENTS,
): string {
  return `You can attach up to ${maxImages} images per message.`;
}

export function formatChatImageBudgetReachedMessage(
  maxBytes = MAX_CHAT_TOTAL_EMBEDDED_IMAGE_BYTES,
): string {
  return `This message already reached the image budget (${formatMediaBytesMb(maxBytes)}).`;
}

export function formatChatImageMissingDataMessage(names: readonly string[]): string {
  return `${formatChatImageNameList(names)} could not be attached. Please try again.`;
}

export function formatChatImageSelectionTooLargeMessage(
  names: readonly string[],
  maxBytes = MAX_CHAT_IMAGE_FILE_BYTES,
): string {
  return `${formatChatImageNameList(names)} exceed the ${formatChatImageMegabyteLimit(maxBytes)} limit.`;
}

export function formatChatImageFileTooLargeMessage(
  fileName: string,
  maxBytes = MAX_CHAT_IMAGE_FILE_BYTES,
): string {
  return `${fileName} is larger than ${formatChatImageMegabyteLimit(maxBytes)}.`;
}

export function formatChatImageUnsupportedFormatMessage(names: readonly string[]): string {
  return `${formatChatImageNameList(names)} could not be attached because the image type could not be determined.`;
}

export function formatChatImageBudgetExceededMessage(
  names: readonly string[],
  maxBytes = MAX_CHAT_TOTAL_EMBEDDED_IMAGE_BYTES,
): string {
  return `${formatChatImageNameList(names)} exceed the per-message image budget (${formatMediaBytesMb(maxBytes)}).`;
}

export function formatChatImageNotImageFileMessage(fileName: string): string {
  return `${fileName} is not an image file.`;
}

export function formatChatImageSlotsRemainingMessage(slotsRemaining: number): string {
  return `Only ${slotsRemaining} image slot(s) remaining for this message.`;
}

export function formatChatImageTryFewerOrSmallerMessage(
  maxBytes = MAX_CHAT_TOTAL_EMBEDDED_IMAGE_BYTES,
): string {
  return `Try fewer or smaller images. Total embedded image budget is ${formatMediaBytesMb(maxBytes)}.`;
}

export function formatChatImageAttachmentErrorMessage(
  error: unknown,
  fallback: string = CHAT_IMAGE_ATTACHMENT_PRESENTATION.errors.attachFailed,
): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === 'string' && error.trim()) return error.trim();
  return fallback;
}

export function getChatImageAttachmentMobileAlertState(
  input: ChatImageAttachmentMobileAlertInput,
): ChatImageAttachmentMobileAlertState {
  const copy = CHAT_IMAGE_ATTACHMENT_PRESENTATION;

  switch (input.reason) {
    case 'limitReached':
      return {
        title: copy.titles.limitReached,
        message: formatChatImageAttachmentLimitMessage(input.maxImages),
      };
    case 'budgetReached':
      return {
        title: copy.titles.budgetReached,
        message: formatChatImageBudgetReachedMessage(input.maxBytes),
      };
    case 'missingData':
      return {
        title: copy.titles.skipped,
        message: formatChatImageMissingDataMessage(input.names),
      };
    case 'selectionTooLarge':
      return {
        title: copy.titles.tooLarge,
        message: formatChatImageSelectionTooLargeMessage(input.names, input.maxBytes),
      };
    case 'unsupportedFormat':
      return {
        title: copy.titles.unsupportedFormat,
        message: formatChatImageUnsupportedFormatMessage(input.names),
      };
    case 'budgetExceeded':
      return {
        title: copy.titles.budgetReached,
        message: formatChatImageBudgetExceededMessage(input.names, input.maxBytes),
      };
    case 'pickerError':
      return {
        title: copy.titles.pickerError,
        message: formatChatImageAttachmentErrorMessage(
          input.error,
          input.fallback ?? copy.errors.pickerFailed,
        ),
      };
  }
}

export interface ConversationVideoAssetRef {
  conversationId: string;
  fileName: string;
}

export interface ConversationImageAssetRef {
  conversationId: string;
  fileName: string;
}

export interface ConversationMediaAssetPathAdapter {
  join(...segments: string[]): string;
  resolve(...segments: string[]): string;
  basename(filePath: string): string;
  sep: string;
}

export interface ConversationMediaAssetPathOptions {
  conversationsFolder: string;
  pathAdapter: ConversationMediaAssetPathAdapter;
}

export interface ConversationMediaAssetStoragePlan {
  fileName: string;
  assetDir: string;
  assetPath: string;
  assetUrl: string;
}

export interface ParsedDataImageUrl {
  mimeType: string;
  base64: string;
}

export interface ConversationImageMarkdownReference {
  fullMatch: string;
  altText: string;
  url: string;
  index: number;
}

export interface ConversationImageMarkdownInput {
  url: string;
  altText?: string | null;
  fallbackAltText?: string | null;
}

export interface ChatImageAttachmentMessageInput {
  dataUrl: string;
  name?: string | null;
}

export interface ImageMimeTypeSource {
  mimeType?: string | null;
  fileName?: string | null;
  uri?: string | null;
}

export interface StripMarkdownImageReferencesOptions {
  mediaOnly?: boolean;
}

export interface MaterializeDataImageMarkdownReferencesOptions {
  materializeDataImageUrl(reference: ConversationImageMarkdownReference): string | Promise<string>;
  onMaterializeError?: (error: unknown, reference: ConversationImageMarkdownReference) => void;
}

export interface MarkdownLinkReference {
  fullMatch: string;
  linkMatch: string;
  prefix: string;
  label: string;
  url: string;
  index: number;
  linkIndex: number;
}

export interface MarkdownVideoLinkOptions {
  allowRecordingAssetUrls?: boolean;
}

export type ConversationVideoByteRange =
  | {
      satisfiable: true;
      partial: false;
      contentLength: number;
    }
  | {
      satisfiable: true;
      partial: true;
      start: number;
      end: number;
      contentLength: number;
      contentRange: string;
    }
  | {
      satisfiable: false;
      contentRange: string;
    };

export type ConversationVideoAssetStreamPlan =
  | {
      ok: true;
      statusCode: 200 | 206;
      headers: Record<string, string>;
      range?: { start: number; end: number };
    }
  | {
      ok: false;
      statusCode: 416;
      headers: Record<string, string>;
    };

export type ConversationVideoAssetActionResult<Body = unknown> = {
  statusCode: number;
  body?: Body | { error: string };
  headers?: Record<string, string>;
};

export type ConversationImageAssetActionResult<Body = unknown> = ConversationVideoAssetActionResult<Body>;

export type ConversationVideoAssetActionFile<Body = unknown> = {
  size: number;
  createBody(range?: { start: number; end: number }): Body;
};

export type ConversationImageAssetActionFile<Body = unknown> = ConversationVideoAssetActionFile<Body>;

export interface ConversationVideoAssetActionService<Body = unknown> {
  validateConversationId(conversationId: string): string | null | undefined;
  getVideoAssetFile(
    conversationId: string,
    fileName: string,
  ): Promise<ConversationVideoAssetActionFile<Body> | null | undefined>;
}

export interface ConversationImageAssetActionService<Body = unknown> {
  validateConversationId(conversationId: string): string | null | undefined;
  getImageAssetFile(
    conversationId: string,
    fileName: string,
  ): Promise<ConversationImageAssetActionFile<Body> | null | undefined>;
}

export interface ConversationVideoAssetFileInfo {
  size: number;
  isFile: boolean;
}

export interface ConversationVideoAssetFileSystemAdapter<Body = unknown> {
  getFileInfo(filePath: string): Promise<ConversationVideoAssetFileInfo>;
  createReadBody(filePath: string, range?: { start: number; end: number }): Body;
}

export interface ConversationVideoAssetFileServiceOptions<Body = unknown> {
  validateConversationId(conversationId: string): string | null | undefined;
  resolveVideoAssetPath(conversationId: string, fileName: string): string;
  fileSystem: ConversationVideoAssetFileSystemAdapter<Body>;
}

export interface ConversationImageAssetFileServiceOptions<Body = unknown> {
  validateConversationId(conversationId: string): string | null | undefined;
  resolveImageAssetPath(conversationId: string, fileName: string): string;
  fileSystem: ConversationVideoAssetFileSystemAdapter<Body>;
}

export function createConversationVideoAssetFileService<Body = unknown>(
  options: ConversationVideoAssetFileServiceOptions<Body>,
): ConversationVideoAssetActionService<Body> {
  return {
    validateConversationId: (conversationId) => options.validateConversationId(conversationId),
    getVideoAssetFile: async (conversationId, fileName) => {
      const assetPath = options.resolveVideoAssetPath(conversationId, fileName);
      const fileInfo = await options.fileSystem.getFileInfo(assetPath);
      if (!fileInfo.isFile) return null;
      return {
        size: fileInfo.size,
        createBody: (range) => options.fileSystem.createReadBody(assetPath, range),
      };
    },
  };
}

export function createConversationImageAssetFileService<Body = unknown>(
  options: ConversationImageAssetFileServiceOptions<Body>,
): ConversationImageAssetActionService<Body> {
  return {
    validateConversationId: (conversationId) => options.validateConversationId(conversationId),
    getImageAssetFile: async (conversationId, fileName) => {
      const assetPath = options.resolveImageAssetPath(conversationId, fileName);
      const fileInfo = await options.fileSystem.getFileInfo(assetPath);
      if (!fileInfo.isFile) return null;
      return {
        size: fileInfo.size,
        createBody: () => options.fileSystem.createReadBody(assetPath),
      };
    },
  };
}

export interface ConversationVideoAssetActionDiagnostics {
  logError(source: string, message: string, error: unknown): void;
}

export interface ConversationVideoAssetActionOptions<Body = unknown> {
  service: ConversationVideoAssetActionService<Body>;
  diagnostics?: ConversationVideoAssetActionDiagnostics;
}

export interface ConversationImageAssetActionOptions<Body = unknown> {
  service: ConversationImageAssetActionService<Body>;
  diagnostics?: ConversationVideoAssetActionDiagnostics;
}

export interface ConversationVideoAssetRouteActions<Body = unknown> {
  getConversationVideoAsset(
    id: string | undefined,
    fileName: string | undefined,
    rangeHeader: string | string[] | undefined,
  ): Promise<ConversationVideoAssetActionResult<Body>>;
}

export interface ConversationImageAssetRouteActions<Body = unknown> {
  getConversationImageAsset(
    id: string | undefined,
    fileName: string | undefined,
  ): Promise<ConversationImageAssetActionResult<Body>>;
}

export type RespondToUserLocalAssetResolution = {
  resolvedPath: string;
  fileBytes: number;
};

export type RespondToUserLocalFileInfo = {
  rawPath: string;
  resolvedPath: string;
  isFile: boolean;
  fileBytes: number;
};

export interface RespondToUserLocalPathAdapter {
  cwd(): string;
  isAbsolute(filePath: string): boolean;
  resolve(...segments: string[]): string;
}

export type RespondToUserLocalFileValidation =
  | { success: true }
  | { success: false; error: string };

export type RespondToUserAssetHandlers = {
  storeDataImageUrlAsAsset: (url: string) => Promise<string>;
  resolveImagePath: (rawPath: string) => Promise<RespondToUserLocalAssetResolution>;
  storeImagePathAsAsset: (resolvedPath: string) => Promise<string>;
  resolveVideoPath: (rawPath: string) => Promise<RespondToUserLocalAssetResolution>;
  storeVideoPathAsAsset: (resolvedPath: string) => Promise<string>;
};

export type RespondToUserParsedArgs = {
  success: true;
  text: string;
  imageInputs: unknown[];
  videoInputs: unknown[];
};

export type RespondToUserArgsParseFailure = {
  success: false;
  error: string;
};

export type RespondToUserArgsParseResult =
  | RespondToUserParsedArgs
  | RespondToUserArgsParseFailure;

export type RespondToUserMaterializedResponse = {
  success: true;
  text: string;
  responseContent: string;
  responseContentBytes: number;
  imageCount: number;
  videoCount: number;
  localImageCount: number;
  localVideoCount: number;
  embeddedImageBytes: number;
  localVideoBytes: number;
};

export type RespondToUserMaterializationFailure = {
  success: false;
  error: string;
};

export type RespondToUserMaterializationResult =
  | RespondToUserMaterializedResponse
  | RespondToUserMaterializationFailure;

export type MarkdownUrlGuardOptions = {
  allowRecordingAssetUrls?: boolean;
};

export function parseConversationVideoAssetUrl(rawUrl: string): ConversationVideoAssetRef | null {
  const match = rawUrl.trim().match(CONVERSATION_VIDEO_ASSET_URL_REGEX);
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

export function parseConversationImageAssetUrl(rawUrl: string): ConversationImageAssetRef | null {
  const match = rawUrl.trim().match(CONVERSATION_IMAGE_ASSET_URL_REGEX);
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

export function isConversationVideoAssetUrl(rawUrl?: string): boolean {
  return !!rawUrl && parseConversationVideoAssetUrl(rawUrl) !== null;
}

export function isConversationImageAssetUrl(rawUrl?: string): boolean {
  return !!rawUrl && parseConversationImageAssetUrl(rawUrl) !== null;
}

export function parseDataImageUrl(rawUrl: string): ParsedDataImageUrl | null {
  const match = rawUrl.trim().match(DATA_IMAGE_URL_REGEX);
  if (!match) return null;

  return {
    mimeType: match[1].toLowerCase(),
    base64: match[2],
  };
}

export function extractConversationImageMarkdownReferences(content: string): ConversationImageMarkdownReference[] {
  return Array.from(content.matchAll(CONVERSATION_IMAGE_MARKDOWN_REFERENCE_REGEX), (match) => ({
    fullMatch: match[0],
    altText: match[1] ?? '',
    url: match[2] ?? '',
    index: match.index ?? 0,
  }));
}

export function extractDataImageMarkdownReferences(content: string): ConversationImageMarkdownReference[] {
  return Array.from(content.matchAll(DATA_IMAGE_MARKDOWN_REFERENCE_REGEX), (match) => ({
    fullMatch: match[0],
    altText: match[1] ?? '',
    url: match[2] ?? '',
    index: match.index ?? 0,
  }));
}

export function extractMarkdownImageReferences(content: string): ConversationImageMarkdownReference[] {
  return Array.from(content.matchAll(MARKDOWN_IMAGE_REFERENCE_REGEX), (match) => ({
    fullMatch: match[0],
    altText: match[1] ?? '',
    url: match[2] ?? '',
    index: match.index ?? 0,
  }));
}

export function isMarkdownMediaImageUrl(rawUrl: string): boolean {
  return MARKDOWN_MEDIA_IMAGE_URL_REGEX.test(rawUrl.trim());
}

export function replaceMarkdownImageReferences(
  content: string,
  replacer: (reference: ConversationImageMarkdownReference) => string,
): string {
  const references = extractMarkdownImageReferences(content);
  if (references.length === 0) return content;

  let nextContent = '';
  let lastIndex = 0;
  for (const reference of references) {
    nextContent += content.slice(lastIndex, reference.index);
    nextContent += replacer(reference);
    lastIndex = reference.index + reference.fullMatch.length;
  }

  return nextContent + content.slice(lastIndex);
}

export async function materializeDataImageMarkdownReferences(
  content: string,
  options: MaterializeDataImageMarkdownReferencesOptions,
): Promise<string> {
  if (!/data:image\//i.test(content)) {
    return content;
  }

  const references = extractDataImageMarkdownReferences(content);
  if (references.length === 0) return content;

  let nextContent = '';
  let lastIndex = 0;
  for (const reference of references) {
    nextContent += content.slice(lastIndex, reference.index);
    try {
      const assetUrl = await options.materializeDataImageUrl(reference);
      nextContent += `![${reference.altText}](${assetUrl})`;
    } catch (error) {
      options.onMaterializeError?.(error, reference);
      nextContent += reference.fullMatch;
    }
    lastIndex = reference.index + reference.fullMatch.length;
  }

  return nextContent + content.slice(lastIndex);
}

export function stripMarkdownImageReferences(
  content: string,
  options: StripMarkdownImageReferencesOptions = {},
): string {
  return replaceMarkdownImageReferences(content, (reference) => {
    if (options.mediaOnly && !isMarkdownMediaImageUrl(reference.url)) {
      return reference.fullMatch;
    }
    return '';
  });
}

export function hasMarkdownMediaImageReference(content: string): boolean {
  return extractMarkdownImageReferences(content).some((reference) => isMarkdownMediaImageUrl(reference.url));
}

export function extractMarkdownLinkReferences(content: string): MarkdownLinkReference[] {
  return Array.from(content.matchAll(MARKDOWN_LINK_REFERENCE_REGEX), (match) => {
    const fullMatch = match[0];
    const prefix = match[1] ?? '';
    return {
      fullMatch,
      linkMatch: fullMatch.slice(prefix.length),
      prefix,
      label: match[2] ?? '',
      url: match[3] ?? '',
      index: match.index ?? 0,
      linkIndex: (match.index ?? 0) + prefix.length,
    };
  });
}

export function isMarkdownVideoLinkUrl(
  rawUrl: string,
  options: MarkdownVideoLinkOptions = {},
): boolean {
  const url = rawUrl.trim();
  return isRenderableVideoUrl(url) || (options.allowRecordingAssetUrls === true && RECORDING_ASSET_URL_REGEX.test(url));
}

export function replaceMarkdownLinkReferences(
  content: string,
  replacer: (reference: MarkdownLinkReference) => string,
): string {
  const references = extractMarkdownLinkReferences(content);
  if (references.length === 0) return content;

  let nextContent = '';
  let lastIndex = 0;
  for (const reference of references) {
    nextContent += content.slice(lastIndex, reference.index);
    nextContent += reference.prefix + replacer(reference);
    lastIndex = reference.index + reference.fullMatch.length;
  }

  return nextContent + content.slice(lastIndex);
}

export function replaceMarkdownVideoLinks(
  content: string,
  replacer: (reference: MarkdownLinkReference) => string,
  options: MarkdownVideoLinkOptions = {},
): string {
  return replaceMarkdownLinkReferences(content, (reference) => {
    return isMarkdownVideoLinkUrl(reference.url, options)
      ? replacer(reference)
      : reference.linkMatch;
  });
}

export function stripMarkdownVideoLinks(
  content: string,
  options: MarkdownVideoLinkOptions = {},
): string {
  return replaceMarkdownVideoLinks(content, () => '', options);
}

export function hasMarkdownVideoLink(
  content: string,
  options: MarkdownVideoLinkOptions = {},
): boolean {
  return extractMarkdownLinkReferences(content).some((reference) => isMarkdownVideoLinkUrl(reference.url, options));
}

export function isRenderableVideoUrl(rawUrl?: string): boolean {
  if (!rawUrl) return false;
  const url = rawUrl.trim();
  const lower = url.toLowerCase();

  if (isConversationVideoAssetUrl(url)) {
    return true;
  }

  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return VIDEO_EXTENSION_REGEX.test(`${parsed.pathname}${parsed.search}${parsed.hash}`);
  } catch {
    return VIDEO_EXTENSION_REGEX.test(lower);
  }
}

export function isAllowedRespondToUserImageUrl(rawUrl: string): boolean {
  const normalized = rawUrl.trim().toLowerCase();
  return (
    normalized.startsWith('https://') ||
    normalized.startsWith('http://') ||
    DATA_IMAGE_BASE64_PREFIX_REGEX.test(normalized)
  );
}

export function isAllowedRespondToUserVideoUrl(rawUrl: string): boolean {
  return isRenderableVideoUrl(rawUrl);
}

export function isAllowedMarkdownLinkUrl(rawUrl?: string, options: MarkdownUrlGuardOptions = {}): boolean {
  if (!rawUrl) return false;

  const url = rawUrl.trim();
  const lower = url.toLowerCase();

  if (
    lower.startsWith('#') ||
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('mailto:') ||
    isConversationVideoAssetUrl(url)
  ) {
    return true;
  }

  return options.allowRecordingAssetUrls === true && RECORDING_ASSET_URL_REGEX.test(url);
}

export function isAllowedMarkdownImageUrl(rawUrl?: string): boolean {
  if (!rawUrl) return false;

  const url = rawUrl.trim();
  const lower = url.toLowerCase();

  return (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    isConversationImageAssetUrl(url) ||
    MARKDOWN_DATA_IMAGE_URL_REGEX.test(url)
  );
}

export function transformMarkdownUrl(
  url: string,
  key?: string,
  options: MarkdownUrlGuardOptions = {},
): string {
  const isImageSrc = key === 'src';
  const isAllowed = isImageSrc
    ? isAllowedMarkdownImageUrl(url)
    : isAllowedMarkdownLinkUrl(url, options);
  return isAllowed ? url : '';
}

export function getConversationImageMimeTypeFromFileName(fileName: string): string | undefined {
  const normalized = fileName.toLowerCase();
  const dotIndex = normalized.lastIndexOf('.');
  const extension = dotIndex >= 0 ? normalized.slice(dotIndex) : '';
  return IMAGE_MIME_BY_EXTENSION[extension];
}

export function inferImageMimeTypeFromSource(source: ImageMimeTypeSource): string | null {
  const mimeType = source.mimeType?.trim().toLowerCase();
  if (mimeType?.startsWith('image/')) {
    return mimeType;
  }

  const pathLike = (source.fileName || source.uri || '').split('?')[0].split('#')[0];
  const extensionMatch = pathLike.match(/\.([a-z0-9]+)$/i);
  if (!extensionMatch) {
    return null;
  }

  return CHAT_IMAGE_MIME_BY_EXTENSION[`.${extensionMatch[1].toLowerCase()}`] || null;
}

export function getConversationImageExtensionForMimeType(mimeType: string): string | undefined {
  const normalized = mimeType.toLowerCase().replace(/^image\//u, '');
  return IMAGE_EXTENSION_BY_MIME_SUBTYPE[normalized];
}

export function getRenderableVideoMimeTypeFromFileName(fileName: string): string | undefined {
  const mimeType = getConversationVideoMimeTypeFromFileName(fileName);
  return mimeType === 'application/octet-stream' ? undefined : mimeType;
}

export function getConversationVideoExtensionForMimeType(mimeType: string): string | undefined {
  const normalized = mimeType.toLowerCase().replace(/^video\//u, '');
  return VIDEO_EXTENSION_BY_MIME_SUBTYPE[normalized];
}

export function escapeMarkdownAltText(value: string): string {
  return value.replace(/[\[\]\\]/g, '').trim();
}

export function buildConversationImageMarkdownReference(input: ConversationImageMarkdownInput): string {
  const fallbackAltText = input.fallbackAltText?.trim() || 'Image';
  const safeAltText = escapeMarkdownAltText(input.altText || fallbackAltText) || fallbackAltText;
  return `![${safeAltText}](${input.url})`;
}

export function buildConversationImageMarkdownMessage(
  text: string,
  images: ConversationImageMarkdownInput[],
): string {
  const trimmedText = text.trim();
  const imageMarkdown = images.map(buildConversationImageMarkdownReference).join('\n\n');
  return [trimmedText, imageMarkdown].filter(Boolean).join('\n\n');
}

export function buildChatImageAttachmentMessage(
  text: string,
  attachments: readonly ChatImageAttachmentMessageInput[],
): string {
  return buildConversationImageMarkdownMessage(
    text,
    attachments.map((attachment, index) => ({
      url: attachment.dataUrl,
      altText: attachment.name,
      fallbackAltText: `Image ${index + 1}`,
    })),
  );
}

export function getDecodedBase64ByteLength(rawBase64: string): number {
  const normalized = rawBase64.replace(/\s+/g, '');
  if (!normalized) {
    return 0;
  }
  const padding = normalized.endsWith('==')
    ? 2
    : normalized.endsWith('=')
      ? 1
      : 0;
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding);
}

export function getDataImageBytesFromUrl(rawUrl: string): number | null {
  const trimmed = rawUrl.trim();
  if (!DATA_IMAGE_BASE64_PREFIX_REGEX.test(trimmed)) {
    return null;
  }
  const commaIndex = trimmed.indexOf(',');
  if (commaIndex < 0 || commaIndex === trimmed.length - 1) {
    return 0;
  }
  const base64Payload = trimmed.slice(commaIndex + 1);
  return getDecodedBase64ByteLength(base64Payload);
}

export function formatMediaBytesMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

export function getUtf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function resolveRespondToUserLocalFilePath(
  rawPath: string,
  pathAdapter: RespondToUserLocalPathAdapter,
): string {
  const trimmed = rawPath.trim();
  return pathAdapter.isAbsolute(trimmed)
    ? trimmed
    : pathAdapter.resolve(pathAdapter.cwd(), trimmed);
}

function getPathBaseName(rawPath: string): string {
  return rawPath.split(/[\\/]+/).filter(Boolean).pop() || rawPath;
}

function maxMegabytes(byteLimit: number): number {
  return Math.round(byteLimit / (1024 * 1024));
}

export function validateRespondToUserImagePath(
  rawPath: string,
  resolvedPath: string,
): RespondToUserLocalFileValidation {
  if (resolvedPath.toLowerCase().endsWith('.svg')) {
    return {
      success: false,
      error: `SVG images are not supported for conversation assets; use a raster image path: ${rawPath}`,
    };
  }

  return { success: true };
}

export function validateRespondToUserImageFile(
  fileInfo: RespondToUserLocalFileInfo,
): RespondToUserLocalFileValidation {
  if (!fileInfo.isFile) {
    return { success: false, error: `Image path is not a file: ${fileInfo.rawPath}` };
  }
  if (fileInfo.fileBytes <= 0) {
    return { success: false, error: `Image file is empty: ${fileInfo.rawPath}` };
  }
  if (fileInfo.fileBytes > MAX_RESPOND_TO_USER_IMAGE_FILE_BYTES) {
    return { success: false, error: `Image file is larger than ${maxMegabytes(MAX_RESPOND_TO_USER_IMAGE_FILE_BYTES)}MB: ${fileInfo.rawPath}` };
  }

  const mimeType = getConversationImageMimeTypeFromFileName(fileInfo.resolvedPath);
  if (!mimeType) {
    return { success: false, error: `Unsupported image extension for path: ${fileInfo.rawPath}` };
  }

  return { success: true };
}

export function validateRespondToUserVideoFile(
  fileInfo: RespondToUserLocalFileInfo,
): RespondToUserLocalFileValidation {
  if (!fileInfo.isFile) {
    return { success: false, error: `Video path is not a file: ${fileInfo.rawPath}` };
  }
  if (fileInfo.fileBytes <= 0) {
    return { success: false, error: `Video file is empty: ${fileInfo.rawPath}` };
  }
  if (fileInfo.fileBytes > MAX_RESPOND_TO_USER_VIDEO_FILE_BYTES) {
    return { success: false, error: `Video file is larger than ${maxMegabytes(MAX_RESPOND_TO_USER_VIDEO_FILE_BYTES)}MB: ${fileInfo.rawPath}` };
  }

  const mimeType = getRenderableVideoMimeTypeFromFileName(fileInfo.resolvedPath);
  if (!mimeType) {
    return { success: false, error: `Unsupported video extension for path: ${fileInfo.rawPath}` };
  }

  return { success: true };
}

export function parseRespondToUserArgs(args: Record<string, unknown>): RespondToUserArgsParseResult {
  const text = typeof args.text === 'string' ? args.text.trim() : '';
  if (args.text !== undefined && typeof args.text !== 'string') {
    return { success: false, error: 'text must be a string if provided' };
  }

  if (args.images !== undefined && !Array.isArray(args.images)) {
    return { success: false, error: 'images must be an array if provided' };
  }

  if (args.videos !== undefined && !Array.isArray(args.videos)) {
    return { success: false, error: 'videos must be an array if provided' };
  }

  const imageInputs = Array.isArray(args.images) ? args.images : [];
  const videoInputs = Array.isArray(args.videos) ? args.videos : [];

  if (imageInputs.length > MAX_RESPOND_TO_USER_IMAGES) {
    return { success: false, error: `You can include up to ${MAX_RESPOND_TO_USER_IMAGES} images.` };
  }

  if (videoInputs.length > MAX_RESPOND_TO_USER_VIDEOS) {
    return { success: false, error: `You can include up to ${MAX_RESPOND_TO_USER_VIDEOS} videos.` };
  }

  return {
    success: true,
    text,
    imageInputs,
    videoInputs,
  };
}

export async function materializeParsedRespondToUserResponse(
  parsedArgs: RespondToUserParsedArgs,
  handlers: RespondToUserAssetHandlers,
): Promise<RespondToUserMaterializationResult> {
  const { text, imageInputs, videoInputs } = parsedArgs;
  const imageMarkdownBlocks: string[] = [];
  const videoMarkdownBlocks: string[] = [];
  let localImageCount = 0;
  let localVideoCount = 0;
  let embeddedImageBytes = 0;
  let localVideoBytes = 0;

  for (let index = 0; index < imageInputs.length; index++) {
    const rawItem = imageInputs[index];
    if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) {
      return { success: false, error: `images[${index}] must be an object` };
    }

    const imageItem = rawItem as Record<string, unknown>;
    const url = typeof imageItem.url === 'string' ? imageItem.url.trim() : '';
    const imagePath = typeof imageItem.path === 'string' ? imageItem.path.trim() : '';
    const preferredAlt = typeof imageItem.alt === 'string' ? imageItem.alt.trim() : '';

    if (!url && !imagePath) {
      return { success: false, error: `images[${index}] must include either url or path` };
    }

    if (url && imagePath) {
      return { success: false, error: `images[${index}] cannot include both url and path` };
    }

    const fallbackAlt = imagePath ? getPathBaseName(imagePath) : `Image ${index + 1}`;
    const safeAlt = escapeMarkdownAltText(preferredAlt || fallbackAlt) || `Image ${index + 1}`;

    if (url) {
      if (!isAllowedRespondToUserImageUrl(url)) {
        return { success: false, error: `images[${index}].url must be http(s) or data:image` };
      }

      const dataImageBytes = getDataImageBytesFromUrl(url);
      if (dataImageBytes !== null) {
        if (dataImageBytes <= 0) {
          return { success: false, error: `images[${index}].url contains an invalid data:image payload` };
        }
        if (dataImageBytes > MAX_RESPOND_TO_USER_IMAGE_FILE_BYTES) {
          return { success: false, error: `images[${index}].url exceeds the ${maxMegabytes(MAX_RESPOND_TO_USER_IMAGE_FILE_BYTES)}MB limit` };
        }
        if (embeddedImageBytes + dataImageBytes > MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES) {
          return { success: false, error: `Total embedded image payload exceeds the ${maxMegabytes(MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES)}MB limit` };
        }
        embeddedImageBytes += dataImageBytes;

        try {
          const assetUrl = await handlers.storeDataImageUrlAsAsset(url);
          imageMarkdownBlocks.push(`![${safeAlt}](${assetUrl})`);
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error
              ? `Failed to store images[${index}].url: ${error.message}`
              : `Failed to store images[${index}].url`,
          };
        }
        continue;
      }

      imageMarkdownBlocks.push(`![${safeAlt}](${url})`);
      continue;
    }

    try {
      const { resolvedPath, fileBytes } = await handlers.resolveImagePath(imagePath);
      if (embeddedImageBytes + fileBytes > MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES) {
        return { success: false, error: `Total embedded image payload exceeds the ${maxMegabytes(MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES)}MB limit` };
      }
      embeddedImageBytes += fileBytes;
      const assetUrl = await handlers.storeImagePathAsAsset(resolvedPath);
      imageMarkdownBlocks.push(`![${safeAlt}](${assetUrl})`);
      localImageCount++;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error
          ? `Failed to load images[${index}].path: ${error.message}`
          : `Failed to load images[${index}].path`,
      };
    }
  }

  for (let index = 0; index < videoInputs.length; index++) {
    const rawItem = videoInputs[index];
    if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) {
      return { success: false, error: `videos[${index}] must be an object` };
    }

    const videoItem = rawItem as Record<string, unknown>;
    const url = typeof videoItem.url === 'string' ? videoItem.url.trim() : '';
    const videoPath = typeof videoItem.path === 'string' ? videoItem.path.trim() : '';
    const preferredLabel = typeof videoItem.label === 'string' ? videoItem.label.trim() : '';

    if (!url && !videoPath) {
      return { success: false, error: `videos[${index}] must include either url or path` };
    }

    if (url && videoPath) {
      return { success: false, error: `videos[${index}] cannot include both url and path` };
    }

    const fallbackLabel = videoPath ? getPathBaseName(videoPath) : `Video ${index + 1}`;
    const safeLabel = escapeMarkdownAltText(preferredLabel || fallbackLabel) || `Video ${index + 1}`;

    if (url) {
      if (!isAllowedRespondToUserVideoUrl(url)) {
        return { success: false, error: `videos[${index}].url must be a valid http(s) video URL (recognized extension: mp4, m4v, webm, mov, ogv) or an assets://conversation-video/ URL` };
      }
      videoMarkdownBlocks.push(`[${safeLabel}](${url})`);
      continue;
    }

    try {
      const { resolvedPath, fileBytes } = await handlers.resolveVideoPath(videoPath);
      if (localVideoBytes + fileBytes > MAX_RESPOND_TO_USER_TOTAL_VIDEO_BYTES) {
        return { success: false, error: `Total local video payload exceeds the ${maxMegabytes(MAX_RESPOND_TO_USER_TOTAL_VIDEO_BYTES)}MB limit` };
      }
      localVideoBytes += fileBytes;
      const assetUrl = await handlers.storeVideoPathAsAsset(resolvedPath);
      videoMarkdownBlocks.push(`[${safeLabel}](${assetUrl})`);
      localVideoCount++;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error
          ? `Failed to load videos[${index}].path: ${error.message}`
          : `Failed to load videos[${index}].path`,
      };
    }
  }

  const imageMarkdown = imageMarkdownBlocks.join('\n\n');
  const videoMarkdown = videoMarkdownBlocks.join('\n\n');
  const responseContent = [text, imageMarkdown, videoMarkdown].filter(Boolean).join('\n\n');
  const responseContentBytes = getUtf8ByteLength(responseContent);

  if (!responseContent.trim()) {
    return { success: false, error: 'respond_to_user requires text, images, and/or videos' };
  }

  if (responseContentBytes > MAX_RESPOND_TO_USER_RESPONSE_CONTENT_BYTES) {
    return { success: false, error: `Response content exceeds the ${maxMegabytes(MAX_RESPOND_TO_USER_RESPONSE_CONTENT_BYTES)}MB limit` };
  }

  return {
    success: true,
    text,
    responseContent,
    responseContentBytes,
    imageCount: imageMarkdownBlocks.length,
    videoCount: videoMarkdownBlocks.length,
    localImageCount,
    localVideoCount,
    embeddedImageBytes,
    localVideoBytes,
  };
}

export async function materializeRespondToUserResponse(
  args: Record<string, unknown>,
  handlers: RespondToUserAssetHandlers,
): Promise<RespondToUserMaterializationResult> {
  const parsedArgs = parseRespondToUserArgs(args);
  if (parsedArgs.success === false) {
    return parsedArgs;
  }

  return materializeParsedRespondToUserResponse(parsedArgs, handlers);
}

export function getVideoAssetLabel(label: string | undefined, rawUrl: string): string {
  const trimmed = label?.trim();
  if (trimmed) return trimmed;

  const assetRef = parseConversationVideoAssetUrl(rawUrl);
  if (assetRef) return assetRef.fileName;

  try {
    const parsed = new URL(rawUrl);
    const fileName = parsed.pathname.split('/').filter(Boolean).pop();
    return decodeURIComponent(fileName || 'Video');
  } catch {
    return rawUrl.split('/').filter(Boolean).pop() || 'Video';
  }
}

export function buildConversationVideoAssetHttpUrl(apiBaseUrl: string, assetUrl: string): string | null {
  const assetRef = parseConversationVideoAssetUrl(assetUrl);
  if (!assetRef) return null;

  const base = apiBaseUrl.trim().replace(/\/+$/, '');
  if (!base) return null;

  return `${base}${REMOTE_SERVER_API_BUILDERS.conversationVideoAsset(assetRef.conversationId, assetRef.fileName)}`;
}

export function buildConversationImageAssetHttpUrl(apiBaseUrl: string, assetUrl: string): string | null {
  const assetRef = parseConversationImageAssetUrl(assetUrl);
  if (!assetRef) return null;

  const base = apiBaseUrl.trim().replace(/\/+$/, '');
  if (!base) return null;

  return `${base}${REMOTE_SERVER_API_BUILDERS.conversationImageAsset(assetRef.conversationId, assetRef.fileName)}`;
}

export function buildConversationVideoAssetUrl(conversationId: string, fileName: string): string {
  return `assets://${CONVERSATION_VIDEO_ASSET_HOST}/${encodeURIComponent(conversationId)}/${encodeURIComponent(fileName)}`;
}

export function buildConversationImageAssetUrl(conversationId: string, fileName: string): string {
  return `assets://${CONVERSATION_IMAGE_ASSET_HOST}/${encodeURIComponent(conversationId)}/${encodeURIComponent(fileName)}`;
}

function isResolvedChildPath(root: string, resolvedPath: string, sep: string): boolean {
  const normalizedRoot = root.endsWith(sep) ? root : `${root}${sep}`;
  return resolvedPath.startsWith(normalizedRoot);
}

function getConversationMediaAssetsRoot(
  options: ConversationMediaAssetPathOptions,
  assetDirName: string,
): string {
  return options.pathAdapter.join(options.conversationsFolder, assetDirName);
}

function getConversationMediaAssetDir(
  conversationId: string,
  options: ConversationMediaAssetPathOptions,
  assetDirName: string,
  assetType: 'image' | 'video',
): string {
  assertSafeConversationId(conversationId);
  const root = options.pathAdapter.resolve(getConversationMediaAssetsRoot(options, assetDirName));
  const resolved = options.pathAdapter.resolve(root, conversationId);
  if (!isResolvedChildPath(root, resolved, options.pathAdapter.sep)) {
    throw new Error(`Invalid conversation ${assetType} asset directory`);
  }
  return resolved;
}

function getConversationMediaAssetPath(
  conversationId: string,
  fileName: string,
  options: ConversationMediaAssetPathOptions,
  assetDirName: string,
  assetType: 'image' | 'video',
  isSafeFileName: (fileName: string) => boolean,
): string {
  assertSafeConversationId(conversationId);
  if (options.pathAdapter.basename(fileName) !== fileName || !isSafeFileName(fileName)) {
    throw new Error(`Invalid conversation ${assetType} asset filename`);
  }

  const dir = getConversationMediaAssetDir(conversationId, options, assetDirName, assetType);
  const resolved = options.pathAdapter.resolve(dir, fileName);
  if (!isResolvedChildPath(dir, resolved, options.pathAdapter.sep)) {
    throw new Error(`Invalid conversation ${assetType} asset path`);
  }
  return resolved;
}

export function getConversationImageAssetsRoot(options: ConversationMediaAssetPathOptions): string {
  return getConversationMediaAssetsRoot(options, CONVERSATION_IMAGE_ASSETS_DIR_NAME);
}

export function getConversationImageAssetDir(
  conversationId: string,
  options: ConversationMediaAssetPathOptions,
): string {
  return getConversationMediaAssetDir(
    conversationId,
    options,
    CONVERSATION_IMAGE_ASSETS_DIR_NAME,
    'image',
  );
}

export function getConversationImageAssetPath(
  conversationId: string,
  fileName: string,
  options: ConversationMediaAssetPathOptions,
): string {
  return getConversationMediaAssetPath(
    conversationId,
    fileName,
    options,
    CONVERSATION_IMAGE_ASSETS_DIR_NAME,
    'image',
    isSafeConversationImageAssetFileName,
  );
}

export function getConversationVideoAssetsRoot(options: ConversationMediaAssetPathOptions): string {
  return getConversationMediaAssetsRoot(options, CONVERSATION_VIDEO_ASSETS_DIR_NAME);
}

export function getConversationVideoAssetDir(
  conversationId: string,
  options: ConversationMediaAssetPathOptions,
): string {
  return getConversationMediaAssetDir(
    conversationId,
    options,
    CONVERSATION_VIDEO_ASSETS_DIR_NAME,
    'video',
  );
}

export function getConversationVideoAssetPath(
  conversationId: string,
  fileName: string,
  options: ConversationMediaAssetPathOptions,
): string {
  return getConversationMediaAssetPath(
    conversationId,
    fileName,
    options,
    CONVERSATION_VIDEO_ASSETS_DIR_NAME,
    'video',
    isSafeConversationVideoAssetFileName,
  );
}

function buildConversationMediaAssetStoragePlan(
  conversationId: string,
  contentHash: string,
  extension: string | undefined,
  options: ConversationMediaAssetPathOptions,
  buildAssetUrl: (conversationId: string, fileName: string) => string,
  getAssetDir: (conversationId: string, options: ConversationMediaAssetPathOptions) => string,
  getAssetPath: (conversationId: string, fileName: string, options: ConversationMediaAssetPathOptions) => string,
  isSafeFileName: (fileName: string) => boolean,
): ConversationMediaAssetStoragePlan | null {
  if (!extension) return null;

  const normalizedHash = contentHash.trim().toLowerCase();
  const fileName = `${normalizedHash}.${extension}`;
  if (!isSafeFileName(fileName)) return null;

  return {
    fileName,
    assetDir: getAssetDir(conversationId, options),
    assetPath: getAssetPath(conversationId, fileName, options),
    assetUrl: buildAssetUrl(conversationId, fileName),
  };
}

export function buildConversationImageAssetStoragePlan(
  conversationId: string,
  contentHash: string,
  mimeType: string,
  options: ConversationMediaAssetPathOptions,
): ConversationMediaAssetStoragePlan | null {
  return buildConversationMediaAssetStoragePlan(
    conversationId,
    contentHash,
    getConversationImageExtensionForMimeType(mimeType),
    options,
    buildConversationImageAssetUrl,
    getConversationImageAssetDir,
    getConversationImageAssetPath,
    isSafeConversationImageAssetFileName,
  );
}

export function buildConversationVideoAssetStoragePlan(
  conversationId: string,
  contentHash: string,
  mimeType: string,
  options: ConversationMediaAssetPathOptions,
): ConversationMediaAssetStoragePlan | null {
  return buildConversationMediaAssetStoragePlan(
    conversationId,
    contentHash,
    getConversationVideoExtensionForMimeType(mimeType),
    options,
    buildConversationVideoAssetUrl,
    getConversationVideoAssetDir,
    getConversationVideoAssetPath,
    isSafeConversationVideoAssetFileName,
  );
}

export function isSafeConversationVideoAssetFileName(fileName: string): boolean {
  return SAFE_VIDEO_ASSET_FILE_REGEX.test(fileName);
}

export function isSafeConversationImageAssetFileName(fileName: string): boolean {
  return SAFE_IMAGE_ASSET_FILE_REGEX.test(fileName);
}

export function getConversationVideoMimeTypeFromFileName(fileName: string): string {
  const normalized = fileName.toLowerCase();
  const dotIndex = normalized.lastIndexOf('.');
  const extension = dotIndex >= 0 ? normalized.slice(dotIndex) : '';
  return VIDEO_MIME_BY_EXTENSION[extension] ?? 'application/octet-stream';
}

export function getConversationVideoByteRange(
  rangeHeader: string | string[] | undefined,
  totalSize: number,
): ConversationVideoByteRange {
  const size = Number.isFinite(totalSize) ? Math.max(0, Math.floor(totalSize)) : 0;
  const header = Array.isArray(rangeHeader) ? rangeHeader[0] : rangeHeader;

  if (!header) {
    return {
      satisfiable: true,
      partial: false,
      contentLength: size,
    };
  }

  const unsatisfiable = (): ConversationVideoByteRange => ({
    satisfiable: false,
    contentRange: `bytes */${size}`,
  });

  const match = header.match(/^bytes=(\d*)-(\d*)$/);
  if (!match || (!match[1] && !match[2]) || size <= 0) {
    return unsatisfiable();
  }

  const suffixLength = !match[1] && match[2] ? Number.parseInt(match[2], 10) : null;
  const start = suffixLength !== null
    ? Math.max(size - suffixLength, 0)
    : Number.parseInt(match[1], 10);
  const end = suffixLength !== null
    ? size - 1
    : match[2] ? Number.parseInt(match[2], 10) : size - 1;

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= size) {
    return unsatisfiable();
  }

  const boundedEnd = Math.min(end, size - 1);
  const contentLength = boundedEnd - start + 1;

  return {
    satisfiable: true,
    partial: true,
    start,
    end: boundedEnd,
    contentLength,
    contentRange: `bytes ${start}-${boundedEnd}/${size}`,
  };
}

export function buildConversationVideoAssetStreamPlan(
  fileName: string,
  rangeHeader: string | string[] | undefined,
  totalSize: number,
): ConversationVideoAssetStreamPlan {
  const contentType = getConversationVideoMimeTypeFromFileName(fileName);
  const range = getConversationVideoByteRange(rangeHeader, totalSize);
  if (range.satisfiable === false) {
    return {
      ok: false,
      statusCode: 416,
      headers: { 'Content-Range': range.contentRange },
    };
  }

  const headers: Record<string, string> = {
    'Accept-Ranges': 'bytes',
    'Content-Type': contentType,
    'Content-Length': String(range.contentLength),
  };

  if (!range.partial) {
    return {
      ok: true,
      statusCode: 200,
      headers,
    };
  }

  headers['Content-Range'] = range.contentRange;
  return {
    ok: true,
    statusCode: 206,
    headers,
    range: { start: range.start, end: range.end },
  };
}

function buildConversationVideoAssetActionError<Body = unknown>(
  statusCode: number,
  message: string,
  headers?: Record<string, string>,
): ConversationVideoAssetActionResult<Body> {
  return {
    statusCode,
    body: { error: message },
    ...(headers ? { headers } : {}),
  };
}

function getConversationVideoAssetActionErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function isMissingConversationVideoAssetError(error: unknown): boolean {
  return !!error
    && typeof error === 'object'
    && 'code' in error
    && (error as { code?: unknown }).code === 'ENOENT';
}

function buildConversationImageAssetActionError<Body = unknown>(
  statusCode: number,
  message: string,
): ConversationImageAssetActionResult<Body> {
  return {
    statusCode,
    body: { error: message },
  };
}

export async function getConversationImageAssetAction<Body = unknown>(
  id: string | undefined,
  fileName: string | undefined,
  options: ConversationImageAssetActionOptions<Body>,
): Promise<ConversationImageAssetActionResult<Body>> {
  try {
    const conversationId = id ?? '';
    const assetFileName = fileName ?? '';

    const conversationIdError = options.service.validateConversationId(conversationId);
    if (conversationIdError) {
      return buildConversationImageAssetActionError(400, conversationIdError);
    }

    let assetFile: ConversationImageAssetActionFile<Body> | null | undefined;
    try {
      assetFile = await options.service.getImageAssetFile(conversationId, assetFileName);
    } catch (caughtError) {
      if (isMissingConversationVideoAssetError(caughtError)) {
        return buildConversationImageAssetActionError(404, 'Image asset not found');
      }
      const errorMessage = getConversationVideoAssetActionErrorMessage(caughtError, 'Invalid image asset');
      if (errorMessage.startsWith('Invalid ')) {
        return buildConversationImageAssetActionError(400, errorMessage);
      }
      options.diagnostics?.logError('conversation-media-assets', 'Failed to stream conversation image asset', caughtError);
      return buildConversationImageAssetActionError(500, errorMessage);
    }

    if (!assetFile || assetFile.size <= 0) {
      return buildConversationImageAssetActionError(404, 'Image asset not found');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': getConversationImageMimeTypeFromFileName(assetFileName) ?? 'application/octet-stream',
        'Content-Length': String(assetFile.size),
      },
      body: assetFile.createBody(),
    };
  } catch (caughtError) {
    if (isMissingConversationVideoAssetError(caughtError)) {
      return buildConversationImageAssetActionError(404, 'Image asset not found');
    }
    options.diagnostics?.logError('conversation-media-assets', 'Failed to stream conversation image asset', caughtError);
    return buildConversationImageAssetActionError(
      500,
      getConversationVideoAssetActionErrorMessage(caughtError, 'Failed to stream image asset'),
    );
  }
}

export async function getConversationVideoAssetAction<Body = unknown>(
  id: string | undefined,
  fileName: string | undefined,
  rangeHeader: string | string[] | undefined,
  options: ConversationVideoAssetActionOptions<Body>,
): Promise<ConversationVideoAssetActionResult<Body>> {
  try {
    const conversationId = id ?? '';
    const assetFileName = fileName ?? '';

    const conversationIdError = options.service.validateConversationId(conversationId);
    if (conversationIdError) {
      return buildConversationVideoAssetActionError(400, conversationIdError);
    }

    let assetFile: ConversationVideoAssetActionFile<Body> | null | undefined;
    try {
      assetFile = await options.service.getVideoAssetFile(conversationId, assetFileName);
    } catch (caughtError) {
      if (isMissingConversationVideoAssetError(caughtError)) {
        return buildConversationVideoAssetActionError(404, 'Video asset not found');
      }
      const errorMessage = getConversationVideoAssetActionErrorMessage(caughtError, 'Invalid video asset');
      if (errorMessage.startsWith('Invalid ')) {
        return buildConversationVideoAssetActionError(400, errorMessage);
      }
      options.diagnostics?.logError('conversation-media-assets', 'Failed to stream conversation video asset', caughtError);
      return buildConversationVideoAssetActionError(500, errorMessage);
    }

    if (!assetFile || assetFile.size <= 0) {
      return buildConversationVideoAssetActionError(404, 'Video asset not found');
    }

    const streamPlan = buildConversationVideoAssetStreamPlan(assetFileName, rangeHeader, assetFile.size);
    if (!streamPlan.ok) {
      return {
        statusCode: streamPlan.statusCode,
        headers: streamPlan.headers,
      };
    }

    return {
      statusCode: streamPlan.statusCode,
      headers: streamPlan.headers,
      body: assetFile.createBody(streamPlan.range),
    };
  } catch (caughtError) {
    if (isMissingConversationVideoAssetError(caughtError)) {
      return buildConversationVideoAssetActionError(404, 'Video asset not found');
    }
    options.diagnostics?.logError('conversation-media-assets', 'Failed to stream conversation video asset', caughtError);
    return buildConversationVideoAssetActionError(
      500,
      getConversationVideoAssetActionErrorMessage(caughtError, 'Failed to stream video asset'),
    );
  }
}

export function createConversationVideoAssetRouteActions<Body = unknown>(
  options: ConversationVideoAssetActionOptions<Body>,
): ConversationVideoAssetRouteActions<Body> {
  return {
    getConversationVideoAsset: (id, fileName, rangeHeader) =>
      getConversationVideoAssetAction(id, fileName, rangeHeader, options),
  };
}

export function createConversationImageAssetRouteActions<Body = unknown>(
  options: ConversationImageAssetActionOptions<Body>,
): ConversationImageAssetRouteActions<Body> {
  return {
    getConversationImageAsset: (id, fileName) =>
      getConversationImageAssetAction(id, fileName, options),
  };
}
