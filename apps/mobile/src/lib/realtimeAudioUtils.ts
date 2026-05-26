const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function normalizeBase64(value: string): string {
  return value.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
}

export function base64ToUint8Array(value: string): Uint8Array {
  const normalized = normalizeBase64(value);
  const atobFn = (globalThis as any).atob;
  if (typeof atobFn === 'function') {
    const binary = atobFn(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  const cleaned = normalized.replace(/=+$/, '');
  const output: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < cleaned.length; i += 1) {
    const valueIndex = BASE64_ALPHABET.indexOf(cleaned[i]);
    if (valueIndex < 0) continue;
    buffer = (buffer << 6) | valueIndex;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output.push((buffer >> bits) & 0xff);
    }
  }

  return new Uint8Array(output);
}

export function concatenateUint8Arrays(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  chunks.forEach((chunk) => {
    combined.set(chunk, offset);
    offset += chunk.length;
  });
  return combined;
}

function writeAscii(target: Uint8Array, offset: number, value: string): void {
  for (let i = 0; i < value.length; i += 1) {
    target[offset + i] = value.charCodeAt(i);
  }
}

function writeUint16LE(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >> 8) & 0xff;
}

function writeUint32LE(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >> 8) & 0xff;
  target[offset + 2] = (value >> 16) & 0xff;
  target[offset + 3] = (value >> 24) & 0xff;
}

export function createPcm16WavFile(
  pcmData: Uint8Array,
  options: { sampleRate?: number; channels?: number } = {},
): Uint8Array {
  const sampleRate = options.sampleRate ?? 24000;
  const channels = options.channels ?? 1;
  const bitsPerSample = 16;
  const headerSize = 44;
  const wav = new Uint8Array(headerSize + pcmData.length);
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);

  writeAscii(wav, 0, 'RIFF');
  writeUint32LE(wav, 4, 36 + pcmData.length);
  writeAscii(wav, 8, 'WAVE');
  writeAscii(wav, 12, 'fmt ');
  writeUint32LE(wav, 16, 16);
  writeUint16LE(wav, 20, 1);
  writeUint16LE(wav, 22, channels);
  writeUint32LE(wav, 24, sampleRate);
  writeUint32LE(wav, 28, byteRate);
  writeUint16LE(wav, 32, blockAlign);
  writeUint16LE(wav, 34, bitsPerSample);
  writeAscii(wav, 36, 'data');
  writeUint32LE(wav, 40, pcmData.length);
  wav.set(pcmData, headerSize);

  return wav;
}