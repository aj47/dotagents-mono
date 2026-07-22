export function getMentraPhotoCallbackUrl(baseUrl: string, requestId: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
  const parsed = new URL(normalizedBaseUrl);
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host === '::1' || host === '0.0.0.0' || host.startsWith('127.')) {
    throw new Error('Mentra photos require a LAN, VPN, or tunnel desktop URL; localhost is not reachable from the glasses.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Mentra photos require an HTTP or HTTPS paired desktop URL.');
  }
  return `${normalizedBaseUrl}/mentra/photos/${encodeURIComponent(requestId)}`;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return globalThis.btoa(binary);
}
