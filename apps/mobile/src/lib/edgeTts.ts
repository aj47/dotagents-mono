import { Platform } from 'react-native';

type EdgeSpeakOptions = {
  voice?: string;
  rate?: number;
  onDone?: () => void;
  onError?: () => void;
  onStopped?: () => void;
};

let currentAudio: HTMLAudioElement | null = null;

export async function speakEdgeTts(text: string, options: EdgeSpeakOptions = {}): Promise<boolean> {
  if (Platform.OS !== 'web') return false;
  if (!text.trim()) return false;

  try {
    const audioBuffer = await synthesizeEdgeTts(text, options.voice ?? 'en-US-AriaNeural', options.rate ?? 1.0);
    stopEdgeTts();

    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) {
        currentAudio = null;
      }
    };

    audio.onended = () => {
      cleanup();
      options.onDone?.();
    };
    audio.onerror = () => {
      cleanup();
      options.onError?.();
    };
    audio.onpause = () => {
      if (!audio.ended) options.onStopped?.();
    };

    await audio.play();
    return true;
  } catch {
    options.onError?.();
    return false;
  }
}

export function stopEdgeTts(): void {
  if (!currentAudio) return;
  currentAudio.pause();
  currentAudio.currentTime = 0;
  currentAudio = null;
}

async function synthesizeEdgeTts(text: string, voice: string, speed: number): Promise<ArrayBuffer> {
  const clampedSpeed = Math.min(2.0, Math.max(0.5, speed));
  const ratePercent = Math.round((clampedSpeed - 1) * 100);
  const rate = `${ratePercent >= 0 ? '+' : ''}${ratePercent}%`;

  const trustedClientToken = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
  const connectionId = globalThis.crypto.randomUUID().replace(/-/g, '');
  const requestId = globalThis.crypto.randomUUID().replace(/-/g, '');
  const timestamp = new Date().toISOString();
  const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${trustedClientToken}&ConnectionId=${connectionId}`;

  const audioChunks: Uint8Array[] = [];

  await new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      const speechConfig = [
        `X-Timestamp:${timestamp}`,
        'Content-Type:application/json; charset=utf-8',
        'Path:speech.config',
        '',
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: {
                  sentenceBoundaryEnabled: 'false',
                  wordBoundaryEnabled: 'false',
                },
                outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
              },
            },
          },
        }),
      ].join('\r\n');

      const ssml = `<speak version='1.0' xml:lang='en-US'><voice name='${escapeXml(voice)}'><prosody rate='${escapeXml(rate)}'>${escapeXml(text)}</prosody></voice></speak>`;
      const ssmlRequest = [
        `X-RequestId:${requestId}`,
        'Content-Type:application/ssml+xml',
        `X-Timestamp:${timestamp}`,
        'Path:ssml',
        '',
        ssml,
      ].join('\r\n');

      ws.send(speechConfig);
      ws.send(ssmlRequest);
    };

    ws.onmessage = async (event) => {
      const data = typeof event.data === 'string' ? event.data : new Uint8Array(await (event.data as Blob).arrayBuffer());
      if (typeof data === 'string') {
        if (data.includes('Path:turn.end')) {
          ws.close();
          resolve();
        }
        return;
      }

      const headerEndIndex = findHeaderBoundary(data);
      if (headerEndIndex < 0) return;
      const headerText = new TextDecoder().decode(data.subarray(0, headerEndIndex));
      if (!headerText.includes('Path:audio')) return;
      const audioData = data.subarray(headerEndIndex + 4);
      if (audioData.length > 0) audioChunks.push(audioData);
    };

    ws.onerror = () => reject(new Error('Edge TTS websocket failed'));
    ws.onclose = () => {
      if (audioChunks.length === 0) reject(new Error('No Edge TTS audio received'));
    };
  });

  const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of audioChunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged.buffer;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function findHeaderBoundary(buffer: Uint8Array): number {
  for (let i = 0; i < buffer.length - 3; i++) {
    if (buffer[i] === 13 && buffer[i + 1] === 10 && buffer[i + 2] === 13 && buffer[i + 3] === 10) {
      return i;
    }
  }
  return -1;
}
