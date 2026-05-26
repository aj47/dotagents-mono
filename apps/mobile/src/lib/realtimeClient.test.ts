import { describe, expect, it } from 'vitest';
import { buildRealtimeWebSocketUrl } from './realtimeClient';

describe('buildRealtimeWebSocketUrl', () => {
  it('keeps paired DotAgents desktop /v1 base URLs', () => {
    expect(buildRealtimeWebSocketUrl('https://desktop.example.com/v1', 'gpt-realtime-mini'))
      .toBe('wss://desktop.example.com/v1/realtime?model=gpt-realtime-mini');
  });

  it('normalizes local http remote-server URLs', () => {
    expect(buildRealtimeWebSocketUrl('http://192.168.1.10:3210/v1/', 'model name'))
      .toBe('ws://192.168.1.10:3210/v1/realtime?model=model%20name');
  });
});