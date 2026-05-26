import { base64ToUint8Array } from './realtimeAudioUtils';

export type RealtimeConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'responding' | 'error';

export type RealtimeClientOptions = {
  baseUrl: string;
  apiKey: string;
  model: string;
  voice?: string;
  instructions?: string;
  onStatus?: (status: RealtimeConnectionStatus) => void;
  onTextDelta?: (delta: string) => void;
  onAudioDelta?: (chunk: Uint8Array) => void;
  onAudioDone?: () => void;
  onResponseDone?: () => void;
  onError?: (message: string) => void;
  onLog?: (message: string, detail?: unknown) => void;
};

const DEFAULT_REALTIME_INSTRUCTIONS = 'You are a concise hands-free voice assistant. Keep replies short, natural, and useful for spoken conversation.';

export function buildRealtimeWebSocketUrl(baseUrl: string, model: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  const withoutV1 = trimmed.endsWith('/v1') ? trimmed.slice(0, -3) : trimmed;
  const wsBase = withoutV1
    .replace(/^https:/i, 'wss:')
    .replace(/^http:/i, 'ws:');
  return `${wsBase}/v1/realtime?model=${encodeURIComponent(model)}`;
}

export class RealtimeTextAudioClient {
  private options: RealtimeClientOptions;
  private ws: WebSocket | null = null;
  private closedByClient = false;

  constructor(options: RealtimeClientOptions) {
    this.options = options;
  }

  connect(): Promise<void> {
    if (!this.options.apiKey.trim()) {
      return Promise.reject(new Error('DotAgents desktop pairing token is required for Realtime.'));
    }
    if (!this.options.baseUrl.trim()) {
      return Promise.reject(new Error('DotAgents desktop base URL is required for Realtime.'));
    }

    this.disconnect();
    this.closedByClient = false;
    this.options.onStatus?.('connecting');

    return new Promise((resolve, reject) => {
      const url = buildRealtimeWebSocketUrl(this.options.baseUrl, this.options.model);
      this.options.onLog?.('Connecting to Realtime WebSocket.', { url: url.replace(/api_key=[^&]+/i, 'api_key=redacted') });

      const SocketCtor = WebSocket as any;
      const ws: WebSocket = new SocketCtor(url, undefined, {
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          'OpenAI-Beta': 'realtime=v1',
        },
      });
      this.ws = ws;

      let settled = false;
      const settleResolve = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      const settleReject = (error: Error) => {
        if (settled) return;
        settled = true;
        reject(error);
      };

      ws.onopen = () => {
        this.options.onStatus?.('connected');
        this.sendSessionUpdate();
        settleResolve();
      };
      ws.onerror = (event: any) => {
        const message = event?.message || 'Realtime WebSocket error.';
        this.options.onStatus?.('error');
        this.options.onError?.(message);
        settleReject(new Error(message));
      };
      ws.onclose = (event: any) => {
        if (this.ws === ws) this.ws = null;
        if (!this.closedByClient) {
          const message = event?.reason || `Realtime WebSocket closed (${event?.code ?? 'unknown'}).`;
          this.options.onStatus?.('error');
          this.options.onError?.(message);
          settleReject(new Error(message));
          return;
        }
        this.options.onStatus?.('disconnected');
      };
      ws.onmessage = (event: WebSocketMessageEvent) => {
        this.handleMessage(event.data);
      };
    });
  }

  disconnect(): void {
    const ws = this.ws;
    this.ws = null;
    this.closedByClient = true;
    if (!ws) return;
    try { ws.close(); } catch {}
    this.options.onStatus?.('disconnected');
  }

  sendUserText(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;
    this.ensureOpen();

    this.sendJson({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: trimmed }],
      },
    });
    this.sendJson({
      type: 'response.create',
      response: {
        modalities: ['text', 'audio'],
        voice: this.options.voice ?? 'alloy',
        instructions: this.options.instructions ?? DEFAULT_REALTIME_INSTRUCTIONS,
      },
    });
    this.options.onStatus?.('responding');
  }

  private sendSessionUpdate(): void {
    this.sendJson({
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: this.options.instructions ?? DEFAULT_REALTIME_INSTRUCTIONS,
        voice: this.options.voice ?? 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        turn_detection: null,
      },
    });
  }

  private sendJson(payload: unknown): void {
    this.ensureOpen();
    this.ws?.send(JSON.stringify(payload));
  }

  private ensureOpen(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Realtime WebSocket is not connected.');
    }
  }

  private handleMessage(data: unknown): void {
    if (typeof data !== 'string') return;
    let event: any;
    try {
      event = JSON.parse(data);
    } catch {
      return;
    }

    const type = String(event?.type || '');
    if (type === 'error' || event?.error) {
      const message = event?.error?.message || event?.message || 'Realtime API error.';
      this.options.onStatus?.('error');
      this.options.onError?.(message);
      return;
    }

    if ((type.endsWith('.audio.delta') || type.endsWith('.output_audio.delta')) && typeof event.delta === 'string') {
      this.options.onAudioDelta?.(base64ToUint8Array(event.delta));
      return;
    }
    if (type.endsWith('.audio.done') || type.endsWith('.output_audio.done')) {
      this.options.onAudioDone?.();
      return;
    }
    if ((type.includes('text.delta') || type.includes('transcript.delta')) && typeof event.delta === 'string') {
      this.options.onTextDelta?.(event.delta);
      return;
    }
    if (type === 'response.done') {
      this.options.onStatus?.('connected');
      this.options.onResponseDone?.();
      return;
    }

    this.options.onLog?.('Realtime event received.', { type });
  }
}