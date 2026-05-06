import { describe, expect, it } from 'vitest';
import {
  buildConversationVideoAssetStreamPlan,
  buildConversationVideoAssetUrl,
  buildConversationImageAssetUrl,
  buildConversationVideoAssetHttpUrl,
  escapeMarkdownAltText,
  extractConversationImageMarkdownReferences,
  getConversationImageExtensionForMimeType,
  getConversationImageMimeTypeFromFileName,
  getConversationVideoByteRange,
  getConversationVideoExtensionForMimeType,
  getConversationVideoMimeTypeFromFileName,
  getDataImageBytesFromUrl,
  getDecodedBase64ByteLength,
  getRenderableVideoMimeTypeFromFileName,
  getUtf8ByteLength,
  getVideoAssetLabel,
  isAllowedRespondToUserImageUrl,
  isAllowedRespondToUserVideoUrl,
  isAllowedMarkdownImageUrl,
  isAllowedMarkdownLinkUrl,
  isSafeConversationVideoAssetFileName,
  isSafeConversationImageAssetFileName,
  isConversationImageAssetUrl,
  isConversationVideoAssetUrl,
  isRenderableVideoUrl,
  parseRespondToUserArgs,
  materializeRespondToUserResponse,
  MAX_RESPOND_TO_USER_IMAGES,
  MAX_RESPOND_TO_USER_IMAGE_FILE_BYTES,
  MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES,
  MAX_RESPOND_TO_USER_VIDEO_FILE_BYTES,
  parseDataImageUrl,
  parseConversationImageAssetUrl,
  parseConversationVideoAssetUrl,
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

    expect(buildConversationVideoAssetHttpUrl(
      'http://localhost:3210/v1/',
      'assets://conversation-video/conv_1/abcdef1234567890.mp4',
    )).toBe(`http://localhost:3210${getRemoteServerApiRoutePath(assetRoute)}`);
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
    expect(escapeMarkdownAltText(' [demo]\\ ')).toBe('demo');
    expect(MAX_RESPOND_TO_USER_IMAGES).toBe(4);
    expect(MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES).toBe(12 * 1024 * 1024);
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
