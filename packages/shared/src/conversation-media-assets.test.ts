import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildConversationVideoAssetStreamPlan,
  buildConversationVideoAssetUrl,
  buildConversationImageAssetHttpUrl,
  buildConversationImageAssetStoragePlan,
  buildConversationImageAssetUrl,
  buildChatImageAttachmentMessage,
  buildConversationImageMarkdownMessage,
  buildConversationImageMarkdownReference,
  buildConversationVideoAssetHttpUrl,
  buildConversationVideoAssetStoragePlan,
  CHAT_IMAGE_ATTACHMENT_PRESENTATION,
  CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION,
  CHAT_VIDEO_ATTACHMENT_PRESENTATION,
  CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION,
  createConversationImageAssetFileService,
  createConversationImageAssetRouteActions,
  createConversationVideoAssetFileService,
  createConversationVideoAssetRouteActions,
  escapeMarkdownAltText,
  extractConversationImageMarkdownReferences,
  extractDataImageMarkdownReferences,
  extractMarkdownImageReferences,
  extractMarkdownLinkReferences,
  getConversationImageExtensionForMimeType,
  getConversationImageAssetDir,
  getConversationImageAssetPath,
  getConversationImageAssetsRoot,
  getConversationImageMimeTypeFromFileName,
  getConversationVideoByteRange,
  getConversationVideoAssetAction,
  getConversationVideoAssetDir,
  getConversationVideoAssetPath,
  getConversationVideoAssetsRoot,
  getConversationVideoExtensionForMimeType,
  getConversationVideoMimeTypeFromFileName,
  getDataImageBytesFromUrl,
  getDecodedBase64ByteLength,
  formatChatImageAttachmentErrorMessage,
  formatChatImageAttachmentLimitMessage,
  formatChatImageBudgetExceededMessage,
  formatChatImageBudgetReachedMessage,
  formatChatImageFileTooLargeMessage,
  formatChatImageMissingDataMessage,
  formatChatImageNotImageFileMessage,
  formatChatImageSelectionTooLargeMessage,
  formatChatImageSlotsRemainingMessage,
  formatChatImageTryFewerOrSmallerMessage,
  formatChatImageUnsupportedFormatMessage,
  getChatImageAttachmentCopyState,
  getChatImageAttachmentDesktopSurfaceState,
  getChatImageAttachmentMobileAlertState,
  getChatImageAttachmentMobileRenderState,
  getChatImageAttachmentMobileSurfaceColors,
  getChatImageAttachmentMobileSurfaceState,
  getChatImageAttachmentMobileRemoveIconState,
  getChatVideoAttachmentCopyState,
  getChatVideoAttachmentDesktopSurfaceState,
  getChatVideoAttachmentMobileSurfaceColors,
  getChatVideoAttachmentMobileSurfaceState,
  getRenderableVideoMimeTypeFromFileName,
  getUtf8ByteLength,
  formatMediaBytesMb,
  getVideoAttachmentLoadAccessibilityLabel,
  getVideoAttachmentOpenLinkAccessibilityLabel,
  getVideoAttachmentPlayAccessibilityLabel,
  getVideoAssetLabel,
  formatVideoAttachmentRequestFailedMessage,
  hasMarkdownMediaImageReference,
  hasMarkdownVideoLink,
  inferImageMimeTypeFromSource,
  isAllowedRespondToUserImageUrl,
  isAllowedRespondToUserVideoUrl,
  isAllowedMarkdownImageUrl,
  isAllowedMarkdownLinkUrl,
  isMarkdownMediaImageUrl,
  isMarkdownVideoLinkUrl,
  isSafeConversationVideoAssetFileName,
  isSafeConversationImageAssetFileName,
  isConversationImageAssetUrl,
  isConversationVideoAssetUrl,
  isRenderableVideoUrl,
  materializeDataImageMarkdownReferences,
  parseRespondToUserArgs,
  materializeRespondToUserResponse,
  MAX_CHAT_IMAGE_ATTACHMENTS,
  MAX_CHAT_IMAGE_FILE_BYTES,
  MAX_CHAT_TOTAL_EMBEDDED_IMAGE_BYTES,
  MAX_RESPOND_TO_USER_IMAGES,
  MAX_RESPOND_TO_USER_IMAGE_FILE_BYTES,
  MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES,
  MAX_RESPOND_TO_USER_VIDEO_FILE_BYTES,
  parseDataImageUrl,
  parseConversationImageAssetUrl,
  parseConversationVideoAssetUrl,
  replaceMarkdownImageReferences,
  replaceMarkdownVideoLinks,
  resolveRespondToUserLocalFilePath,
  stripMarkdownImageReferences,
  stripMarkdownVideoLinks,
  transformMarkdownUrl,
  type RespondToUserAssetHandlers,
  validateRespondToUserImageFile,
  validateRespondToUserImagePath,
  validateRespondToUserVideoFile,
} from './conversation-media-assets';
import {
  REMOTE_SERVER_API_BUILDERS,
  getRemoteServerApiRoutePath,
} from './remote-server-api';

describe('conversation video asset utilities', () => {
  it('parses conversation video asset urls', () => {
    expect(parseConversationVideoAssetUrl('assets://conversation-video/conv_1/abcdef1234567890.mp4')).toEqual({
      conversationId: 'conv_1',
      fileName: 'abcdef1234567890.mp4',
    });
  });

  it('parses conversation image asset urls', () => {
    expect(parseConversationImageAssetUrl('assets://conversation-image/conv%201/abcdef1234567890.png?preview=1')).toEqual({
      conversationId: 'conv 1',
      fileName: 'abcdef1234567890.png',
    });
    expect(parseConversationImageAssetUrl('assets://conversation-image/%E0%A4%A/abcdef1234567890.png')).toBeNull();
    expect(parseConversationImageAssetUrl('assets://conversation-video/conv_1/abcdef1234567890.mp4')).toBeNull();
  });

  it('detects renderable video urls', () => {
    expect(isRenderableVideoUrl('assets://conversation-video/conv_1/abcdef1234567890.mp4')).toBe(true);
    expect(isRenderableVideoUrl('assets://recording/recording_1/demo.mp4')).toBe(false);
    expect(isRenderableVideoUrl('https://example.com/demo.webm?download=1')).toBe(true);
    expect(isRenderableVideoUrl('https://example.com/demo.png')).toBe(false);
  });

  it('builds authenticated remote asset urls from api base url', () => {
    const assetRoute = REMOTE_SERVER_API_BUILDERS.conversationVideoAsset('conv_1', 'abcdef1234567890.mp4');
    const imageAssetRoute = REMOTE_SERVER_API_BUILDERS.conversationImageAsset('conv_1', 'abcdef1234567890.png');

    expect(buildConversationVideoAssetHttpUrl(
      'http://localhost:3210/v1/',
      'assets://conversation-video/conv_1/abcdef1234567890.mp4',
    )).toBe(`http://localhost:3210${getRemoteServerApiRoutePath(assetRoute)}`);
    expect(buildConversationImageAssetHttpUrl(
      'http://localhost:3210/v1/',
      'assets://conversation-image/conv_1/abcdef1234567890.png',
    )).toBe(`http://localhost:3210${getRemoteServerApiRoutePath(imageAssetRoute)}`);
  });

  it('detects conversation video asset urls', () => {
    expect(isConversationVideoAssetUrl('assets://conversation-video/conv_1/abcdef1234567890.mp4')).toBe(true);
    expect(isConversationVideoAssetUrl('assets://recording/recording_1/demo.mp4')).toBe(false);
    expect(isConversationVideoAssetUrl('https://example.com/demo.mp4')).toBe(false);
    expect(isConversationVideoAssetUrl(undefined)).toBe(false);
  });

  it('detects conversation image asset urls', () => {
    expect(isConversationImageAssetUrl('assets://conversation-image/conv_1/abcdef1234567890.png')).toBe(true);
    expect(isConversationImageAssetUrl('assets://conversation-video/conv_1/abcdef1234567890.mp4')).toBe(false);
    expect(isConversationImageAssetUrl('https://example.com/image.png')).toBe(false);
    expect(isConversationImageAssetUrl(undefined)).toBe(false);
  });

  it('uses link text before filename for labels', () => {
    expect(getVideoAssetLabel('Demo clip', 'assets://conversation-video/conv_1/abcdef1234567890.mp4')).toBe('Demo clip');
    expect(getVideoAssetLabel('', 'assets://conversation-video/conv_1/abcdef1234567890.mp4')).toBe('abcdef1234567890.mp4');
  });

  it('centralizes chat video attachment copy and surface tokens', () => {
    expect(CHAT_VIDEO_ATTACHMENT_PRESENTATION.labels.play).toBe('Play video');
    expect(CHAT_VIDEO_ATTACHMENT_PRESENTATION.labels.loading).toBe('Loading…');
    expect(CHAT_VIDEO_ATTACHMENT_PRESENTATION.labels.desktopLazyLoadSubtitle).toBe('Loads only when you click play');
    expect(CHAT_VIDEO_ATTACHMENT_PRESENTATION.labels.mobileLazyLoadSubtitle).toBe('Loads only when you tap play');
    expect(CHAT_VIDEO_ATTACHMENT_PRESENTATION.errors.missingCredentials).toBe('Missing video asset credentials.');
    expect(CHAT_VIDEO_ATTACHMENT_PRESENTATION.errors.loadFallback).toBe('Unable to load this video.');
    expect(getChatVideoAttachmentCopyState()).toBe(CHAT_VIDEO_ATTACHMENT_PRESENTATION);
    expect(getChatVideoAttachmentDesktopSurfaceState()).toBe(CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.desktop);
    expect(CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.desktop.videoClassName).toContain('bg-black');
    expect(getChatVideoAttachmentMobileSurfaceState()).toBe(CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile);
    expect(CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.card.borderColorToken).toBe('border');
    expect(CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.card.backgroundColor.dark).toBe('#ffffff');
    expect(CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.card.backgroundColor.darkAlpha).toBe(0.04);
    expect(CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.card.backgroundColor.light).toBe('#000000');
    expect(CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.card.backgroundColor.lightAlpha).toBe(0.03);
    expect(CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.loadButton.flexDirection).toBe('row');
    expect(CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.playIconWrapper.alignItems).toBe('center');
    expect(CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.playIconWrapper.justifyContent).toBe('center');
    expect(CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.playIconWrapper.backgroundAlpha).toBe(0.09);
    expect(CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.playIcon.name).toBe('play-circle');
    expect(CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION.mobile.video.height).toBe(220);
    expect(getChatVideoAttachmentMobileSurfaceColors({
      border: '#d4d4d4',
      destructive: '#dc2626',
      foreground: '#171717',
      mutedForeground: '#737373',
      primary: '#2563eb',
      primaryForeground: '#ffffff',
    }, { isDark: true })).toEqual({
      card: {
        borderColor: '#d4d4d4',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
      },
      playIconWrapper: {
        backgroundColor: 'rgba(37, 99, 235, 0.09)',
      },
      playIcon: {
        color: '#2563eb',
      },
      title: {
        color: '#171717',
      },
      subtitle: {
        color: '#737373',
      },
      button: {
        backgroundColor: '#2563eb',
      },
      buttonText: {
        color: '#ffffff',
      },
      fallbackLinkText: {
        color: '#2563eb',
      },
      errorText: {
        color: '#dc2626',
      },
    });
    expect(getChatVideoAttachmentMobileSurfaceColors({
      border: '#d4d4d4',
      destructive: '#dc2626',
      foreground: '#171717',
      mutedForeground: '#737373',
      primary: '#2563eb',
      primaryForeground: '#ffffff',
    }).card.backgroundColor).toBe('rgba(0, 0, 0, 0.03)');
    expect(getVideoAttachmentLoadAccessibilityLabel('Demo clip')).toBe('Load video Demo clip');
    expect(getVideoAttachmentPlayAccessibilityLabel('Demo clip')).toBe('Play video Demo clip');
    expect(getVideoAttachmentOpenLinkAccessibilityLabel('Demo clip')).toBe('Open video link: Demo clip');
    expect(formatVideoAttachmentRequestFailedMessage(404)).toBe('Video request failed (404)');
  });

  it('builds asset urls and validates persisted video asset filenames', () => {
    expect(buildConversationVideoAssetUrl('conv_1', 'abcdef1234567890.mp4'))
      .toBe('assets://conversation-video/conv_1/abcdef1234567890.mp4');
    expect(isSafeConversationVideoAssetFileName('abcdef1234567890.webm')).toBe(true);
    expect(isSafeConversationVideoAssetFileName('../abcdef1234567890.webm')).toBe(false);
    expect(isSafeConversationVideoAssetFileName('not-a-hash.webm')).toBe(false);
    expect(isSafeConversationVideoAssetFileName('abcdef1234567890.png')).toBe(false);
  });

  it('builds image asset urls and validates persisted image asset filenames', () => {
    expect(buildConversationImageAssetUrl('conv 1', 'abcdef1234567890.png'))
      .toBe('assets://conversation-image/conv%201/abcdef1234567890.png');
    expect(isSafeConversationImageAssetFileName('abcdef1234567890.png')).toBe(true);
    expect(isSafeConversationImageAssetFileName('abcdef1234567890.jpeg')).toBe(true);
    expect(isSafeConversationImageAssetFileName('abcdef1234567890.avif')).toBe(true);
    expect(isSafeConversationImageAssetFileName('../abcdef1234567890.png')).toBe(false);
    expect(isSafeConversationImageAssetFileName('not-a-hash.png')).toBe(false);
    expect(isSafeConversationImageAssetFileName('abcdef1234567890.svg')).toBe(false);
  });

  it('resolves persisted media asset paths through a host path adapter', () => {
    const pathOptions = {
      conversationsFolder: '/var/dotagents/conversations',
      pathAdapter: path.posix,
    };

    expect(getConversationImageAssetsRoot(pathOptions)).toBe('/var/dotagents/conversations/_images');
    expect(getConversationVideoAssetsRoot(pathOptions)).toBe('/var/dotagents/conversations/_videos');
    expect(getConversationImageAssetDir('conv_1', pathOptions)).toBe('/var/dotagents/conversations/_images/conv_1');
    expect(getConversationVideoAssetDir('conv_1', pathOptions)).toBe('/var/dotagents/conversations/_videos/conv_1');
    expect(getConversationImageAssetPath('conv_1', 'abcdef1234567890.png', pathOptions))
      .toBe('/var/dotagents/conversations/_images/conv_1/abcdef1234567890.png');
    expect(getConversationVideoAssetPath('conv_1', 'abcdef1234567890.mp4', pathOptions))
      .toBe('/var/dotagents/conversations/_videos/conv_1/abcdef1234567890.mp4');

    expect(() => getConversationImageAssetDir('../secret', pathOptions))
      .toThrow('Invalid conversation ID: path traversal characters not allowed');
    expect(() => getConversationImageAssetPath('conv_1', '../abcdef1234567890.png', pathOptions))
      .toThrow('Invalid conversation image asset filename');
    expect(() => getConversationVideoAssetPath('conv_1', 'abcdef1234567890.png', pathOptions))
      .toThrow('Invalid conversation video asset filename');
  });

  it('builds storage plans for persisted media assets from content hashes', () => {
    const pathOptions = {
      conversationsFolder: '/var/dotagents/conversations',
      pathAdapter: path.posix,
    };

    expect(buildConversationImageAssetStoragePlan(
      'conv_1',
      'ABCDEF1234567890',
      'image/jpeg',
      pathOptions,
    )).toEqual({
      fileName: 'abcdef1234567890.jpg',
      assetDir: '/var/dotagents/conversations/_images/conv_1',
      assetPath: '/var/dotagents/conversations/_images/conv_1/abcdef1234567890.jpg',
      assetUrl: 'assets://conversation-image/conv_1/abcdef1234567890.jpg',
    });

    expect(buildConversationVideoAssetStoragePlan(
      'conv_1',
      'abcdef1234567890',
      'video/webm',
      pathOptions,
    )).toEqual({
      fileName: 'abcdef1234567890.webm',
      assetDir: '/var/dotagents/conversations/_videos/conv_1',
      assetPath: '/var/dotagents/conversations/_videos/conv_1/abcdef1234567890.webm',
      assetUrl: 'assets://conversation-video/conv_1/abcdef1234567890.webm',
    });

    expect(buildConversationImageAssetStoragePlan('conv_1', 'not-a-hash', 'image/png', pathOptions)).toBeNull();
    expect(buildConversationVideoAssetStoragePlan('conv_1', 'abcdef1234567890', 'video/x-msvideo', pathOptions))
      .toBeNull();
  });

  it('resolves video MIME types from filenames', () => {
    expect(getConversationVideoMimeTypeFromFileName('abcdef1234567890.mp4')).toBe('video/mp4');
    expect(getConversationVideoMimeTypeFromFileName('abcdef1234567890.m4v')).toBe('video/mp4');
    expect(getConversationVideoMimeTypeFromFileName('abcdef1234567890.webm')).toBe('video/webm');
    expect(getConversationVideoMimeTypeFromFileName('abcdef1234567890.mov')).toBe('video/quicktime');
    expect(getConversationVideoMimeTypeFromFileName('abcdef1234567890.ogv')).toBe('video/ogg');
    expect(getConversationVideoMimeTypeFromFileName('abcdef1234567890.unknown')).toBe('application/octet-stream');
    expect(getRenderableVideoMimeTypeFromFileName('abcdef1234567890.mp4')).toBe('video/mp4');
    expect(getRenderableVideoMimeTypeFromFileName('abcdef1234567890.unknown')).toBeUndefined();
    expect(getConversationVideoExtensionForMimeType('video/mp4')).toBe('mp4');
    expect(getConversationVideoExtensionForMimeType('video/quicktime')).toBe('mov');
    expect(getConversationVideoExtensionForMimeType('video/x-msvideo')).toBeUndefined();
  });

  it('resolves respond_to_user image MIME types from filenames', () => {
    expect(getConversationImageMimeTypeFromFileName('/tmp/demo.PNG')).toBe('image/png');
    expect(getConversationImageMimeTypeFromFileName('demo.apng')).toBe('image/apng');
    expect(getConversationImageMimeTypeFromFileName('demo.jpeg')).toBe('image/jpeg');
    expect(getConversationImageMimeTypeFromFileName('demo.avif')).toBe('image/avif');
    expect(getConversationImageMimeTypeFromFileName('demo.svg')).toBeUndefined();
    expect(getConversationImageExtensionForMimeType('image/jpeg')).toBe('jpg');
    expect(getConversationImageExtensionForMimeType('image/avif')).toBe('avif');
    expect(getConversationImageExtensionForMimeType('image/svg+xml')).toBeUndefined();
  });

  it('infers chat image MIME types from picker metadata and paths', () => {
    expect(inferImageMimeTypeFromSource({ mimeType: ' Image/PNG ' })).toBe('image/png');
    expect(inferImageMimeTypeFromSource({ fileName: 'photo.HEIC' })).toBe('image/heic');
    expect(inferImageMimeTypeFromSource({ uri: 'file:///tmp/capture.webp?size=preview' })).toBe('image/webp');
    expect(inferImageMimeTypeFromSource({ mimeType: 'application/json', fileName: 'demo.svg' })).toBe('image/svg+xml');
    expect(inferImageMimeTypeFromSource({ fileName: 'demo.txt' })).toBeNull();
  });

  it('validates respond_to_user media urls', () => {
    expect(isAllowedRespondToUserImageUrl('https://example.com/image.svg')).toBe(true);
    expect(isAllowedRespondToUserImageUrl('data:image/png;base64,AAAA')).toBe(true);
    expect(isAllowedRespondToUserImageUrl('file:///tmp/image.png')).toBe(false);
    expect(isAllowedRespondToUserVideoUrl('assets://conversation-video/conv_1/abcdef1234567890.mp4')).toBe(true);
    expect(isAllowedRespondToUserVideoUrl('https://example.com/demo.mp4')).toBe(true);
    expect(isAllowedRespondToUserVideoUrl('https://example.com/demo.png')).toBe(false);
  });

  it('validates markdown link urls', () => {
    expect(isAllowedMarkdownLinkUrl('https://dotagents.app/docs')).toBe(true);
    expect(isAllowedMarkdownLinkUrl('mailto:hello@dotagents.app')).toBe(true);
    expect(isAllowedMarkdownLinkUrl('#usage')).toBe(true);
    expect(isAllowedMarkdownLinkUrl('assets://conversation-video/conv_1/abcdef1234567890.mp4')).toBe(true);
    expect(isAllowedMarkdownLinkUrl('assets://recording/recording_1/demo.mp4')).toBe(false);
    expect(isAllowedMarkdownLinkUrl('assets://recording/recording_1/demo.mp4', { allowRecordingAssetUrls: true })).toBe(true);
    expect(isAllowedMarkdownLinkUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedMarkdownLinkUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('validates markdown image urls and transforms blocked urls', () => {
    expect(isAllowedMarkdownImageUrl('https://example.com/image.png')).toBe(true);
    expect(isAllowedMarkdownImageUrl('data:image/png;base64,AAAA')).toBe(true);
    expect(isAllowedMarkdownImageUrl('data:image/jpeg;base64,BBBB')).toBe(true);
    expect(isAllowedMarkdownImageUrl('assets://conversation-image/conv_1/abcd1234abcd1234.png')).toBe(true);
    expect(isAllowedMarkdownImageUrl('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
    expect(isAllowedMarkdownImageUrl('assets://file?path=/tmp/secret.png')).toBe(false);
    expect(isAllowedMarkdownImageUrl('javascript:alert(1)')).toBe(false);
    expect(transformMarkdownUrl('javascript:alert(1)', 'href')).toBe('');
    expect(transformMarkdownUrl('data:image/svg+xml;base64,PHN2Zz4=', 'src')).toBe('');
    expect(transformMarkdownUrl('data:image/webp;base64,UklGRg==', 'src')).toBe(
      'data:image/webp;base64,UklGRg==',
    );
  });

  it('measures respond_to_user payload sizes and escapes labels', () => {
    expect(parseDataImageUrl('data:image/PNG;base64,AAAA')).toEqual({
      mimeType: 'image/png',
      base64: 'AAAA',
    });
    expect(parseDataImageUrl(' data:image/jpeg;base64,AA==\n ')).toEqual({
      mimeType: 'image/jpeg',
      base64: 'AA==',
    });
    expect(parseDataImageUrl('https://example.com/image.png')).toBeNull();
    expect(getDecodedBase64ByteLength('AAAA')).toBe(3);
    expect(getDecodedBase64ByteLength('AA==')).toBe(1);
    expect(getDataImageBytesFromUrl('data:image/png;base64,AAAA')).toBe(3);
    expect(getDataImageBytesFromUrl('https://example.com/image.png')).toBeNull();
    expect(getUtf8ByteLength('hello')).toBe(5);
    expect(formatMediaBytesMb(900 * 1024)).toBe('0.88MB');
    expect(escapeMarkdownAltText(' [demo]\\ ')).toBe('demo');
    expect(MAX_CHAT_IMAGE_ATTACHMENTS).toBe(4);
    expect(MAX_CHAT_IMAGE_FILE_BYTES).toBe(4 * 1024 * 1024);
    expect(MAX_CHAT_TOTAL_EMBEDDED_IMAGE_BYTES).toBe(900 * 1024);
    expect(MAX_RESPOND_TO_USER_IMAGES).toBe(4);
    expect(MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES).toBe(12 * 1024 * 1024);
  });

  it('centralizes chat image attachment feedback copy', () => {
    expect(CHAT_IMAGE_ATTACHMENT_PRESENTATION.titles.limitReached).toBe('Image limit reached');
    expect(CHAT_IMAGE_ATTACHMENT_PRESENTATION.composerPreview.removeTitle).toBe('Remove image');
    expect(getChatImageAttachmentCopyState()).toBe(CHAT_IMAGE_ATTACHMENT_PRESENTATION);
    expect(getChatImageAttachmentDesktopSurfaceState()).toBe(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.desktop);
    expect(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.desktop.composerPreview.overlayRowClassName).toContain('gap-2');
    expect(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.desktop.composerPreview.tileRowClassName).toContain('gap-1.5');
    expect(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.desktop.composerPreview.overlayPreviewClassName).toContain('h-14 w-14');
    expect(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.desktop.composerPreview.tilePreviewClassName).toContain('h-12 w-12');
    expect(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.desktop.composerPreview.removeButtonClassName).toContain('bg-black/70');
    expect(getChatImageAttachmentMobileSurfaceState()).toBe(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile);
    expect(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.row.showsHorizontalScrollIndicator).toBe(false);
    expect(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.preview.size).toBe(56);
    expect(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.preview.borderColorToken).toBe('border');
    expect(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.preview.backgroundColorToken).toBe('muted');
    expect(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.preview.overflow).toBe('hidden');
    expect(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.preview.position).toBe('relative');
    expect(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.previewImage.width).toBe('100%');
    expect(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.previewImage.height).toBe('100%');
    expect(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.removeButton.position).toBe('absolute');
    expect(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.removeButton.accessibilityRole).toBe('button');
    expect(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.removeButton.backgroundAlpha).toBe(0.7);
    expect(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.removeButton.pressedOpacity).toBe(0.8);
    expect(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.removeButton.alignItems).toBe('center');
    expect(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.removeButton.justifyContent).toBe('center');
    expect(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.removeIcon.name).toBe('close');
    expect(CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.removeIcon.size).toBe(13);
    expect(getChatImageAttachmentMobileRemoveIconState()).toEqual({
      name: CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.removeIcon.name,
      size: CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.removeIcon.size,
      color: CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.removeIcon.color,
    });
    expect(getChatImageAttachmentMobileSurfaceColors({
      border: '#d4d4d4',
      muted: '#e5e5e5',
    })).toEqual({
      preview: {
        borderColor: '#d4d4d4',
        backgroundColor: '#e5e5e5',
      },
      removeButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      },
    });
    expect(getChatImageAttachmentMobileRenderState({
      colors: {
        border: '#d4d4d4',
        muted: '#e5e5e5',
      },
    })).toEqual({
      copy: CHAT_IMAGE_ATTACHMENT_PRESENTATION,
      surface: CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile,
      colors: getChatImageAttachmentMobileSurfaceColors({
        border: '#d4d4d4',
        muted: '#e5e5e5',
      }),
      removeButton: {
        accessibilityRole: CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.removeButton.accessibilityRole,
        accessibilityLabel: CHAT_IMAGE_ATTACHMENT_PRESENTATION.composerPreview.removeTitle,
        pressedOpacity: CHAT_IMAGE_ATTACHMENT_SURFACE_PRESENTATION.mobile.removeButton.pressedOpacity,
      },
      removeIcon: getChatImageAttachmentMobileRemoveIconState(),
    });
    expect(getChatImageAttachmentMobileAlertState({ reason: 'limitReached' })).toEqual({
      title: 'Image limit reached',
      message: 'You can attach up to 4 images per message.',
    });
    expect(getChatImageAttachmentMobileAlertState({ reason: 'budgetReached' })).toEqual({
      title: 'Image budget reached',
      message: 'This message already reached the image budget (0.88MB).',
    });
    expect(getChatImageAttachmentMobileAlertState({
      reason: 'missingData',
      names: ['one.png'],
    })).toEqual({
      title: 'Some images were skipped',
      message: 'one.png could not be attached. Please try again.',
    });
    expect(getChatImageAttachmentMobileAlertState({
      reason: 'selectionTooLarge',
      names: ['large.png'],
    })).toEqual({
      title: 'Image too large',
      message: 'large.png exceed the 4MB limit.',
    });
    expect(getChatImageAttachmentMobileAlertState({
      reason: 'unsupportedFormat',
      names: ['unknown.heic'],
    })).toEqual({
      title: 'Unsupported image format',
      message: 'unknown.heic could not be attached because the image type could not be determined.',
    });
    expect(getChatImageAttachmentMobileAlertState({
      reason: 'budgetExceeded',
      names: ['budget.png'],
    })).toEqual({
      title: 'Image budget reached',
      message: 'budget.png exceed the per-message image budget (0.88MB).',
    });
    expect(getChatImageAttachmentMobileAlertState({
      reason: 'pickerError',
      error: new Error('No access'),
    })).toEqual({
      title: 'Image picker error',
      message: 'No access',
    });
    expect(getChatImageAttachmentMobileAlertState({
      reason: 'pickerError',
      error: null,
    })).toEqual({
      title: 'Image picker error',
      message: 'Unable to select images right now.',
    });
    expect(formatChatImageAttachmentLimitMessage()).toBe('You can attach up to 4 images per message.');
    expect(formatChatImageBudgetReachedMessage()).toBe('This message already reached the image budget (0.88MB).');
    expect(formatChatImageMissingDataMessage(['one.png'])).toBe('one.png could not be attached. Please try again.');
    expect(formatChatImageSelectionTooLargeMessage(['large.png'])).toBe('large.png exceed the 4MB limit.');
    expect(formatChatImageFileTooLargeMessage('large.png')).toBe('large.png is larger than 4MB.');
    expect(formatChatImageUnsupportedFormatMessage(['unknown.heic'])).toBe(
      'unknown.heic could not be attached because the image type could not be determined.',
    );
    expect(formatChatImageBudgetExceededMessage(['budget.png'])).toBe(
      'budget.png exceed the per-message image budget (0.88MB).',
    );
    expect(formatChatImageNotImageFileMessage('notes.txt')).toBe('notes.txt is not an image file.');
    expect(formatChatImageSlotsRemainingMessage(2)).toBe('Only 2 image slot(s) remaining for this message.');
    expect(formatChatImageTryFewerOrSmallerMessage()).toBe(
      'Try fewer or smaller images. Total embedded image budget is 0.88MB.',
    );
    expect(formatChatImageAttachmentErrorMessage(new Error('No access'))).toBe('No access');
    expect(formatChatImageAttachmentErrorMessage(null)).toBe('Failed to attach image.');
  });

  it('builds markdown image references with escaped alt text', () => {
    expect(buildConversationImageMarkdownReference({
      url: 'data:image/png;base64,AAAA',
      altText: ' [demo]\\ ',
    })).toBe('![demo](data:image/png;base64,AAAA)');

    expect(buildConversationImageMarkdownReference({
      url: 'data:image/png;base64,BBBB',
      altText: '',
      fallbackAltText: 'Screen [selection]',
    })).toBe('![Screen selection](data:image/png;base64,BBBB)');
  });

  it('appends markdown image references to text messages', () => {
    expect(buildConversationImageMarkdownMessage('  Describe this  ', [
      {
        url: 'data:image/png;base64,AAAA',
        altText: 'First',
        fallbackAltText: 'Image 1',
      },
      {
        url: 'data:image/jpeg;base64,BBBB',
        fallbackAltText: 'Image 2',
      },
    ])).toBe('Describe this\n\n![First](data:image/png;base64,AAAA)\n\n![Image 2](data:image/jpeg;base64,BBBB)');

    expect(buildConversationImageMarkdownMessage('', [
      {
        url: 'data:image/png;base64,AAAA',
        fallbackAltText: 'Only image',
      },
    ])).toBe('![Only image](data:image/png;base64,AAAA)');

    expect(buildChatImageAttachmentMessage('  Describe this  ', [
      {
        dataUrl: 'data:image/png;base64,AAAA',
        name: 'First',
      },
      {
        dataUrl: 'data:image/jpeg;base64,BBBB',
      },
    ])).toBe('Describe this\n\n![First](data:image/png;base64,AAAA)\n\n![Image 2](data:image/jpeg;base64,BBBB)');
  });

  it('extracts markdown conversation image references for model adapters', () => {
    const content = [
      'Before ![inline](data:image/png;base64,AAAA) middle',
      '![asset](assets://conversation-image/conv_1/abcdef1234567890.png)',
      '![remote](https://example.com/image.png)',
    ].join('\n');

    const refs = extractConversationImageMarkdownReferences(content);
    expect(refs).toEqual([
      {
        fullMatch: '![inline](data:image/png;base64,AAAA)',
        altText: 'inline',
        url: 'data:image/png;base64,AAAA',
        index: content.indexOf('![inline]'),
      },
      {
        fullMatch: '![asset](assets://conversation-image/conv_1/abcdef1234567890.png)',
        altText: 'asset',
        url: 'assets://conversation-image/conv_1/abcdef1234567890.png',
        index: content.indexOf('![asset]'),
      },
    ]);
  });

  it('extracts markdown data image references without matching asset urls', () => {
    const content = [
      'Before ![inline](data:image/png;base64,AAAA) middle',
      '![multiline](data:image/jpeg;base64,AA==\nBB==)',
      '![asset](assets://conversation-image/conv_1/abcdef1234567890.png)',
    ].join('\n');

    const refs = extractDataImageMarkdownReferences(content);
    expect(refs).toEqual([
      {
        fullMatch: '![inline](data:image/png;base64,AAAA)',
        altText: 'inline',
        url: 'data:image/png;base64,AAAA',
        index: content.indexOf('![inline]'),
      },
      {
        fullMatch: '![multiline](data:image/jpeg;base64,AA==\nBB==)',
        altText: 'multiline',
        url: 'data:image/jpeg;base64,AA==\nBB==',
        index: content.indexOf('![multiline]'),
      },
    ]);
  });

  it('materializes markdown data image references with an adapter while preserving failed replacements', async () => {
    const errors: unknown[] = [];
    const content = [
      'A ![one](data:image/png;base64,AAAA) B',
      '![two](data:image/gif;base64,BBBB) C',
      '![asset](assets://conversation-image/conv_1/abcdef1234567890.png)',
    ].join(' ');

    await expect(materializeDataImageMarkdownReferences('plain text', {
      materializeDataImageUrl: () => {
        throw new Error('should not run');
      },
    })).resolves.toBe('plain text');

    await expect(materializeDataImageMarkdownReferences(content, {
      materializeDataImageUrl: (reference) => {
        if (reference.altText === 'two') {
          throw new Error('store failed');
        }
        return `assets://conversation-image/conv_1/${reference.altText}.png`;
      },
      onMaterializeError: (error) => errors.push(error),
    })).resolves.toBe([
      'A ![one](assets://conversation-image/conv_1/one.png) B',
      '![two](data:image/gif;base64,BBBB) C',
      '![asset](assets://conversation-image/conv_1/abcdef1234567890.png)',
    ].join(' '));

    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(Error);
  });

  it('extracts and rewrites generic markdown image references', () => {
    const content = [
      'Before ![inline](data:image/png;base64,AAAA)',
      '![remote](https://example.com/image.png)',
      '![local](file://private/image.png) after',
    ].join(' ');

    expect(extractMarkdownImageReferences(content)).toEqual([
      {
        fullMatch: '![inline](data:image/png;base64,AAAA)',
        altText: 'inline',
        url: 'data:image/png;base64,AAAA',
        index: content.indexOf('![inline]'),
      },
      {
        fullMatch: '![remote](https://example.com/image.png)',
        altText: 'remote',
        url: 'https://example.com/image.png',
        index: content.indexOf('![remote]'),
      },
      {
        fullMatch: '![local](file://private/image.png)',
        altText: 'local',
        url: 'file://private/image.png',
        index: content.indexOf('![local]'),
      },
    ]);

    expect(replaceMarkdownImageReferences(content, (reference) => `[${reference.altText || 'image'}]`))
      .toBe('Before [inline] [remote] [local] after');
    expect(stripMarkdownImageReferences(content, { mediaOnly: true }))
      .toBe('Before   ![local](file://private/image.png) after');
    expect(stripMarkdownImageReferences(content)).toBe('Before    after');
  });

  it('detects markdown media image urls', () => {
    expect(isMarkdownMediaImageUrl('data:image/png;base64,AAAA')).toBe(true);
    expect(isMarkdownMediaImageUrl('https://example.com/image.png')).toBe(true);
    expect(isMarkdownMediaImageUrl('assets://conversation-image/conv_1/image.png')).toBe(true);
    expect(isMarkdownMediaImageUrl('file://private/image.png')).toBe(false);
    expect(hasMarkdownMediaImageReference('See ![pic](assets://conversation-image/conv_1/image.png)')).toBe(true);
    expect(hasMarkdownMediaImageReference('See ![pic](file://private/image.png)')).toBe(false);
  });

  it('extracts and rewrites markdown video links without matching image links', () => {
    const content = [
      'Watch [clip](assets://conversation-video/conv_1/demo.mp4)',
      'or [remote](https://example.com/demo.webm?download=1).',
      'Keep ![poster](https://example.com/poster.png)',
      'and [recording](assets://recording/recording_1/demo.mp4).',
    ].join(' ');

    expect(extractMarkdownLinkReferences(content)).toEqual([
      {
        fullMatch: ' [clip](assets://conversation-video/conv_1/demo.mp4)',
        linkMatch: '[clip](assets://conversation-video/conv_1/demo.mp4)',
        prefix: ' ',
        label: 'clip',
        url: 'assets://conversation-video/conv_1/demo.mp4',
        index: content.indexOf(' [clip]'),
        linkIndex: content.indexOf('[clip]'),
      },
      {
        fullMatch: ' [remote](https://example.com/demo.webm?download=1)',
        linkMatch: '[remote](https://example.com/demo.webm?download=1)',
        prefix: ' ',
        label: 'remote',
        url: 'https://example.com/demo.webm?download=1',
        index: content.indexOf(' [remote]'),
        linkIndex: content.indexOf('[remote]'),
      },
      {
        fullMatch: ' [recording](assets://recording/recording_1/demo.mp4)',
        linkMatch: '[recording](assets://recording/recording_1/demo.mp4)',
        prefix: ' ',
        label: 'recording',
        url: 'assets://recording/recording_1/demo.mp4',
        index: content.indexOf(' [recording]'),
        linkIndex: content.indexOf('[recording]'),
      },
    ]);

    expect(isMarkdownVideoLinkUrl('assets://conversation-video/conv_1/demo.mp4')).toBe(true);
    expect(isMarkdownVideoLinkUrl('https://example.com/demo.webm?download=1')).toBe(true);
    expect(isMarkdownVideoLinkUrl('assets://recording/recording_1/demo.mp4')).toBe(false);
    expect(isMarkdownVideoLinkUrl('assets://recording/recording_1/demo.mp4', { allowRecordingAssetUrls: true })).toBe(true);
    expect(hasMarkdownVideoLink(content)).toBe(true);
    expect(replaceMarkdownVideoLinks(content, (reference) => `[Video: ${reference.label}]`))
      .toBe('Watch [Video: clip] or [Video: remote]. Keep ![poster](https://example.com/poster.png) and [recording](assets://recording/recording_1/demo.mp4).');
    expect(stripMarkdownVideoLinks(content, { allowRecordingAssetUrls: true }))
      .toBe('Watch  or . Keep ![poster](https://example.com/poster.png) and .');
  });

  it('parses respond_to_user top-level args once for callers that need media counts', () => {
    expect(parseRespondToUserArgs({
      text: '  Ready  ',
      images: [{ url: 'https://example.com/preview.png' }],
      videos: [{ url: 'https://example.com/demo.mp4' }],
    })).toEqual({
      success: true,
      text: 'Ready',
      imageInputs: [{ url: 'https://example.com/preview.png' }],
      videoInputs: [{ url: 'https://example.com/demo.mp4' }],
    });
    expect(parseRespondToUserArgs({
      images: Array.from({ length: MAX_RESPOND_TO_USER_IMAGES + 1 }, () => ({ url: 'https://example.com/preview.png' })),
    })).toEqual({
      success: false,
      error: `You can include up to ${MAX_RESPOND_TO_USER_IMAGES} images.`,
    });
    expect(parseRespondToUserArgs({
      videos: 'https://example.com/demo.mp4',
    })).toEqual({
      success: false,
      error: 'videos must be an array if provided',
    });
  });

  it('materializes respond_to_user text with remote image and video urls', async () => {
    const handlers = createRespondToUserHandlers();

    await expect(materializeRespondToUserResponse({
      text: 'Ready',
      images: [{ url: 'https://example.com/preview.png', alt: '[Preview]\\' }],
      videos: [{ url: 'https://example.com/demo.mp4', label: 'Demo clip' }],
    }, handlers)).resolves.toEqual({
      success: true,
      text: 'Ready',
      responseContent: 'Ready\n\n![Preview](https://example.com/preview.png)\n\n[Demo clip](https://example.com/demo.mp4)',
      responseContentBytes: 93,
      imageCount: 1,
      videoCount: 1,
      localImageCount: 0,
      localVideoCount: 0,
      embeddedImageBytes: 0,
      localVideoBytes: 0,
    });
  });

  it('materializes respond_to_user data images and local media through injected handlers', async () => {
    const calls: string[] = [];
    const handlers = createRespondToUserHandlers({
      storeDataImageUrlAsAsset: async () => {
        calls.push('store-data-image');
        return 'assets://conversation-image/conv/data.png';
      },
      resolveImagePath: async (rawPath) => {
        calls.push(`resolve-image:${rawPath}`);
        return { resolvedPath: '/resolved/local.png', fileBytes: 4 };
      },
      storeImagePathAsAsset: async (resolvedPath) => {
        calls.push(`store-image:${resolvedPath}`);
        return 'assets://conversation-image/conv/local.png';
      },
      resolveVideoPath: async (rawPath) => {
        calls.push(`resolve-video:${rawPath}`);
        return { resolvedPath: '/resolved/local.mp4', fileBytes: 9 };
      },
      storeVideoPathAsAsset: async (resolvedPath) => {
        calls.push(`store-video:${resolvedPath}`);
        return 'assets://conversation-video/conv/local.mp4';
      },
    });

    const result = await materializeRespondToUserResponse({
      images: [
        { url: 'data:image/png;base64,AAAA' },
        { path: '/tmp/local.png' },
      ],
      videos: [{ path: '/tmp/local.mp4' }],
    }, handlers);

    expect(result).toEqual({
      success: true,
      text: '',
      responseContent: '![Image 1](assets://conversation-image/conv/data.png)\n\n![local.png](assets://conversation-image/conv/local.png)\n\n[local.mp4](assets://conversation-video/conv/local.mp4)',
      responseContentBytes: 168,
      imageCount: 2,
      videoCount: 1,
      localImageCount: 1,
      localVideoCount: 1,
      embeddedImageBytes: 7,
      localVideoBytes: 9,
    });
    expect(calls).toEqual([
      'store-data-image',
      'resolve-image:/tmp/local.png',
      'store-image:/resolved/local.png',
      'resolve-video:/tmp/local.mp4',
      'store-video:/resolved/local.mp4',
    ]);
  });

  it('returns respond_to_user validation failures before materializing assets', async () => {
    const handlers = createRespondToUserHandlers({
      resolveImagePath: async () => {
        throw new Error('should not resolve');
      },
    });

    await expect(materializeRespondToUserResponse({
      images: [{ url: 'https://example.com/preview.png', path: '/tmp/preview.png' }],
    }, handlers)).resolves.toEqual({
      success: false,
      error: 'images[0] cannot include both url and path',
    });

    await expect(materializeRespondToUserResponse({
      text: '',
    }, handlers)).resolves.toEqual({
      success: false,
      error: 'respond_to_user requires text, images, and/or videos',
    });
  });

  it('validates respond_to_user local image files from injected file metadata', () => {
    const pathAdapter = {
      cwd: () => '/workspace',
      isAbsolute: path.posix.isAbsolute,
      resolve: path.posix.resolve,
    };

    expect(resolveRespondToUserLocalFilePath(' ./assets/image.png ', pathAdapter))
      .toBe('/workspace/assets/image.png');
    expect(resolveRespondToUserLocalFilePath('/tmp/preview.png', pathAdapter))
      .toBe('/tmp/preview.png');

    expect(validateRespondToUserImagePath('/tmp/preview.svg', '/tmp/preview.svg')).toEqual({
      success: false,
      error: 'SVG images are not supported for conversation assets; use a raster image path: /tmp/preview.svg',
    });
    expect(validateRespondToUserImageFile({
      rawPath: '/tmp/preview.png',
      resolvedPath: '/tmp/preview.png',
      isFile: false,
      fileBytes: 4,
    })).toEqual({
      success: false,
      error: 'Image path is not a file: /tmp/preview.png',
    });
    expect(validateRespondToUserImageFile({
      rawPath: '/tmp/preview.png',
      resolvedPath: '/tmp/preview.png',
      isFile: true,
      fileBytes: MAX_RESPOND_TO_USER_IMAGE_FILE_BYTES + 1,
    })).toEqual({
      success: false,
      error: 'Image file is larger than 8MB: /tmp/preview.png',
    });
    expect(validateRespondToUserImageFile({
      rawPath: '/tmp/preview.png',
      resolvedPath: '/tmp/preview.png',
      isFile: true,
      fileBytes: 4,
    })).toEqual({ success: true });
  });

  it('validates respond_to_user local video files from injected file metadata', () => {
    expect(validateRespondToUserVideoFile({
      rawPath: '/tmp/demo.mp4',
      resolvedPath: '/tmp/demo.mp4',
      isFile: true,
      fileBytes: MAX_RESPOND_TO_USER_VIDEO_FILE_BYTES + 1,
    })).toEqual({
      success: false,
      error: 'Video file is larger than 250MB: /tmp/demo.mp4',
    });
    expect(validateRespondToUserVideoFile({
      rawPath: '/tmp/demo.png',
      resolvedPath: '/tmp/demo.png',
      isFile: true,
      fileBytes: 4,
    })).toEqual({
      success: false,
      error: 'Unsupported video extension for path: /tmp/demo.png',
    });
    expect(validateRespondToUserVideoFile({
      rawPath: '/tmp/demo.mp4',
      resolvedPath: '/tmp/demo.mp4',
      isFile: true,
      fileBytes: 4,
    })).toEqual({ success: true });
  });

  it('parses HTTP byte ranges for video streaming', () => {
    expect(getConversationVideoByteRange(undefined, 1000)).toEqual({
      satisfiable: true,
      partial: false,
      contentLength: 1000,
    });
    expect(getConversationVideoByteRange('bytes=10-19', 1000)).toEqual({
      satisfiable: true,
      partial: true,
      start: 10,
      end: 19,
      contentLength: 10,
      contentRange: 'bytes 10-19/1000',
    });
    expect(getConversationVideoByteRange('bytes=990-', 1000)).toEqual({
      satisfiable: true,
      partial: true,
      start: 990,
      end: 999,
      contentLength: 10,
      contentRange: 'bytes 990-999/1000',
    });
    expect(getConversationVideoByteRange('bytes=-25', 1000)).toEqual({
      satisfiable: true,
      partial: true,
      start: 975,
      end: 999,
      contentLength: 25,
      contentRange: 'bytes 975-999/1000',
    });
    expect(getConversationVideoByteRange('bytes=999-2000', 1000)).toEqual({
      satisfiable: true,
      partial: true,
      start: 999,
      end: 999,
      contentLength: 1,
      contentRange: 'bytes 999-999/1000',
    });
    expect(getConversationVideoByteRange(['bytes=0-4'], 1000)).toEqual({
      satisfiable: true,
      partial: true,
      start: 0,
      end: 4,
      contentLength: 5,
      contentRange: 'bytes 0-4/1000',
    });
  });

  it('rejects unsatisfiable HTTP byte ranges', () => {
    expect(getConversationVideoByteRange('items=1-2', 1000)).toEqual({
      satisfiable: false,
      contentRange: 'bytes */1000',
    });
    expect(getConversationVideoByteRange('bytes=-', 1000)).toEqual({
      satisfiable: false,
      contentRange: 'bytes */1000',
    });
    expect(getConversationVideoByteRange('bytes=1000-1001', 1000)).toEqual({
      satisfiable: false,
      contentRange: 'bytes */1000',
    });
    expect(getConversationVideoByteRange('bytes=10-1', 1000)).toEqual({
      satisfiable: false,
      contentRange: 'bytes */1000',
    });
  });

  it('builds reusable video stream response plans for full and partial content', () => {
    expect(buildConversationVideoAssetStreamPlan('abcdef1234567890.mp4', undefined, 1000)).toEqual({
      ok: true,
      statusCode: 200,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Type': 'video/mp4',
        'Content-Length': '1000',
      },
    });

    expect(buildConversationVideoAssetStreamPlan('abcdef1234567890.webm', 'bytes=10-19', 1000)).toEqual({
      ok: true,
      statusCode: 206,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Type': 'video/webm',
        'Content-Length': '10',
        'Content-Range': 'bytes 10-19/1000',
      },
      range: { start: 10, end: 19 },
    });
  });

  it('builds reusable video stream response plans for unsatisfiable ranges', () => {
    expect(buildConversationVideoAssetStreamPlan('abcdef1234567890.mp4', 'bytes=1000-1001', 1000)).toEqual({
      ok: false,
      statusCode: 416,
      headers: { 'Content-Range': 'bytes */1000' },
    });
  });

  it('builds reusable video asset action responses through an injected file service', async () => {
    const bodyRanges: Array<{ start: number; end: number } | undefined> = [];
    const options = {
      service: {
        validateConversationId: () => null,
        getVideoAssetFile: async () => ({
          size: 1000,
          createBody: (range?: { start: number; end: number }) => {
            bodyRanges.push(range);
            return range ? `stream:${range.start}-${range.end}` : 'stream:full';
          },
        }),
      },
    };

    await expect(getConversationVideoAssetAction(
      'conv-1',
      'abcdef1234567890.mp4',
      undefined,
      options,
    )).resolves.toEqual({
      statusCode: 200,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Type': 'video/mp4',
        'Content-Length': '1000',
      },
      body: 'stream:full',
    });

    await expect(getConversationVideoAssetAction(
      'conv-1',
      'abcdef1234567890.webm',
      'bytes=10-19',
      options,
    )).resolves.toEqual({
      statusCode: 206,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Type': 'video/webm',
        'Content-Length': '10',
        'Content-Range': 'bytes 10-19/1000',
      },
      body: 'stream:10-19',
    });

    expect(bodyRanges).toEqual([undefined, { start: 10, end: 19 }]);
  });

  it('creates reusable video asset file services from filesystem adapters', async () => {
    const fileInfoByPath = new Map<string, { size: number; isFile: boolean }>([
      ['/assets/conv-1/abcdef1234567890.mp4', { size: 1000, isFile: true }],
      ['/assets/conv-1/abcdef1234567890.webm', { size: 1000, isFile: false }],
    ]);
    const readCalls: Array<{ filePath: string; range?: { start: number; end: number } }> = [];
    const service = createConversationVideoAssetFileService({
      validateConversationId: () => null,
      resolveVideoAssetPath: (conversationId, fileName) => `/assets/${conversationId}/${fileName}`,
      fileSystem: {
        getFileInfo: async (filePath) => fileInfoByPath.get(filePath) ?? { size: 0, isFile: false },
        createReadBody: (filePath, range) => {
          readCalls.push({ filePath, range });
          return range ? `stream:${range.start}-${range.end}` : 'stream:full';
        },
      },
    });

    expect(service.validateConversationId('conv-1')).toBeNull();
    const assetFile = await service.getVideoAssetFile('conv-1', 'abcdef1234567890.mp4');
    expect(assetFile?.size).toBe(1000);
    expect(assetFile?.createBody({ start: 10, end: 19 })).toBe('stream:10-19');
    await expect(service.getVideoAssetFile('conv-1', 'abcdef1234567890.webm')).resolves.toBeNull();
    expect(readCalls).toEqual([{
      filePath: '/assets/conv-1/abcdef1234567890.mp4',
      range: { start: 10, end: 19 },
    }]);
  });

  it('creates reusable image asset file services from filesystem adapters', async () => {
    const fileInfoByPath = new Map<string, { size: number; isFile: boolean }>([
      ['/assets/conv-1/abcdef1234567890.png', { size: 500, isFile: true }],
      ['/assets/conv-1/abcdef1234567890.webp', { size: 500, isFile: false }],
    ]);
    const readCalls: string[] = [];
    const service = createConversationImageAssetFileService({
      validateConversationId: () => null,
      resolveImageAssetPath: (conversationId, fileName) => `/assets/${conversationId}/${fileName}`,
      fileSystem: {
        getFileInfo: async (filePath) => fileInfoByPath.get(filePath) ?? { size: 0, isFile: false },
        createReadBody: (filePath) => {
          readCalls.push(filePath);
          return 'image-bytes';
        },
      },
    });

    expect(service.validateConversationId('conv-1')).toBeNull();
    const assetFile = await service.getImageAssetFile('conv-1', 'abcdef1234567890.png');
    expect(assetFile?.size).toBe(500);
    expect(assetFile?.createBody()).toBe('image-bytes');
    await expect(service.getImageAssetFile('conv-1', 'abcdef1234567890.webp')).resolves.toBeNull();
    expect(readCalls).toEqual(['/assets/conv-1/abcdef1234567890.png']);
  });

  it('creates reusable image asset route actions through an injected file service', async () => {
    const routeActions = createConversationImageAssetRouteActions({
      service: {
        validateConversationId: () => null,
        getImageAssetFile: async () => ({
          size: 500,
          createBody: () => 'image-bytes',
        }),
      },
    });

    await expect(routeActions.getConversationImageAsset(
      'conv-1',
      'abcdef1234567890.png',
    )).resolves.toEqual({
      statusCode: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': '500',
      },
      body: 'image-bytes',
    });
  });

  it('creates reusable video asset route actions through an injected file service', async () => {
    const bodyRanges: Array<{ start: number; end: number } | undefined> = [];
    const routeActions = createConversationVideoAssetRouteActions({
      service: {
        validateConversationId: () => null,
        getVideoAssetFile: async () => ({
          size: 1000,
          createBody: (range?: { start: number; end: number }) => {
            bodyRanges.push(range);
            return range ? `stream:${range.start}-${range.end}` : 'stream:full';
          },
        }),
      },
    });

    await expect(routeActions.getConversationVideoAsset(
      'conv-1',
      'abcdef1234567890.webm',
      'bytes=10-19',
    )).resolves.toEqual({
      statusCode: 206,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Type': 'video/webm',
        'Content-Length': '10',
        'Content-Range': 'bytes 10-19/1000',
      },
      body: 'stream:10-19',
    });

    expect(bodyRanges).toEqual([{ start: 10, end: 19 }]);
  });

  it('builds video asset action errors for invalid ids, invalid files, missing files, and ranges', async () => {
    await expect(getConversationVideoAssetAction(
      'bad id',
      'abcdef1234567890.mp4',
      undefined,
      {
        service: {
          validateConversationId: () => 'Invalid conversation id',
          getVideoAssetFile: async () => {
            throw new Error('should not resolve files for invalid ids');
          },
        },
      },
    )).resolves.toEqual({
      statusCode: 400,
      body: { error: 'Invalid conversation id' },
    });

    await expect(getConversationVideoAssetAction(
      'conv-1',
      '../bad.mp4',
      undefined,
      {
        service: {
          validateConversationId: () => null,
          getVideoAssetFile: async () => {
            throw new Error('Invalid conversation video asset filename');
          },
        },
      },
    )).resolves.toEqual({
      statusCode: 400,
      body: { error: 'Invalid conversation video asset filename' },
    });

    await expect(getConversationVideoAssetAction(
      'conv-1',
      'abcdef1234567890.mp4',
      undefined,
      {
        service: {
          validateConversationId: () => null,
          getVideoAssetFile: async () => null,
        },
      },
    )).resolves.toEqual({
      statusCode: 404,
      body: { error: 'Video asset not found' },
    });

    await expect(getConversationVideoAssetAction(
      'conv-1',
      'abcdef1234567890.mp4',
      'bytes=1000-1001',
      {
        service: {
          validateConversationId: () => null,
          getVideoAssetFile: async () => ({
            size: 1000,
            createBody: () => 'unused',
          }),
        },
      },
    )).resolves.toEqual({
      statusCode: 416,
      headers: { 'Content-Range': 'bytes */1000' },
    });
  });
});

function createRespondToUserHandlers(
  overrides: Partial<RespondToUserAssetHandlers> = {},
): RespondToUserAssetHandlers {
  return {
    storeDataImageUrlAsAsset: async () => 'assets://conversation-image/conv/data.png',
    resolveImagePath: async (rawPath) => ({ resolvedPath: rawPath, fileBytes: 1 }),
    storeImagePathAsAsset: async (resolvedPath) => `assets://conversation-image/conv/${resolvedPath.split('/').pop() || 'local.png'}`,
    resolveVideoPath: async (rawPath) => ({ resolvedPath: rawPath, fileBytes: 1 }),
    storeVideoPathAsAsset: async (resolvedPath) => `assets://conversation-video/conv/${resolvedPath.split('/').pop() || 'local.mp4'}`,
    ...overrides,
  };
}
