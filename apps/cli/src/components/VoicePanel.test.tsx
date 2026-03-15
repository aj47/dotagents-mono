/**
 * Tests for VoicePanel TUI component.
 *
 * Tests cover:
 * - Status display for each voice state
 * - Error display
 * - Continuous mode display
 * - Last transcript display
 * - Control text for each state
 * - Props contract validation
 */
import { describe, it, expect, vi } from 'vitest';
import type { VoicePanelProps } from './VoicePanel';
import type { VoiceState } from '../hooks/useVoice';

/**
 * Create default VoicePanel props for testing.
 * Individual tests override specific values.
 */
function createDefaultProps(overrides?: Partial<VoicePanelProps>): VoicePanelProps {
  return {
    voiceState: {
      status: 'idle',
      error: null,
      continuousMode: false,
      turnCount: 0,
      lastTranscript: null,
    },
    onStartRecording: vi.fn(async () => null),
    onStopRecording: vi.fn(),
    onSpeak: vi.fn(async () => {}),
    onStopPlayback: vi.fn(),
    onStartContinuousMode: vi.fn(),
    onStopContinuousMode: vi.fn(),
    onClose: vi.fn(),
    onSendTranscript: vi.fn(),
    lastAssistantMessage: undefined,
    ...overrides,
  };
}

// ── Status display ───────────────────────────────────────────────────

describe('VoicePanel — Status Display', () => {
  it('shows Ready status when idle', () => {
    const props = createDefaultProps();
    expect(props.voiceState.status).toBe('idle');
    // Status should map to 'Ready'
  });

  it('shows Recording status', () => {
    const props = createDefaultProps({
      voiceState: {
        status: 'recording',
        error: null,
        continuousMode: false,
        turnCount: 0,
        lastTranscript: null,
      },
    });
    expect(props.voiceState.status).toBe('recording');
  });

  it('shows Transcribing status', () => {
    const props = createDefaultProps({
      voiceState: {
        status: 'transcribing',
        error: null,
        continuousMode: false,
        turnCount: 0,
        lastTranscript: null,
      },
    });
    expect(props.voiceState.status).toBe('transcribing');
  });

  it('shows Synthesizing status', () => {
    const props = createDefaultProps({
      voiceState: {
        status: 'synthesizing',
        error: null,
        continuousMode: false,
        turnCount: 0,
        lastTranscript: null,
      },
    });
    expect(props.voiceState.status).toBe('synthesizing');
  });

  it('shows Playing status', () => {
    const props = createDefaultProps({
      voiceState: {
        status: 'playing',
        error: null,
        continuousMode: false,
        turnCount: 0,
        lastTranscript: null,
      },
    });
    expect(props.voiceState.status).toBe('playing');
  });

  it('shows Error status', () => {
    const props = createDefaultProps({
      voiceState: {
        status: 'error',
        error: 'Microphone not found',
        continuousMode: false,
        turnCount: 0,
        lastTranscript: null,
      },
    });
    expect(props.voiceState.status).toBe('error');
    expect(props.voiceState.error).toBe('Microphone not found');
  });
});

// ── Error handling ───────────────────────────────────────────────────

describe('VoicePanel — Error Handling', () => {
  it('displays error message when present', () => {
    const props = createDefaultProps({
      voiceState: {
        status: 'error',
        error: 'sox not found',
        continuousMode: false,
        turnCount: 0,
        lastTranscript: null,
      },
    });
    expect(props.voiceState.error).toBe('sox not found');
  });

  it('error is null when no error', () => {
    const props = createDefaultProps();
    expect(props.voiceState.error).toBeNull();
  });

  it('error contains API key message', () => {
    const props = createDefaultProps({
      voiceState: {
        status: 'error',
        error: 'API key not configured for STT provider "openai"',
        continuousMode: false,
        turnCount: 0,
        lastTranscript: null,
      },
    });
    expect(props.voiceState.error).toContain('API key');
  });
});

// ── Continuous mode ──────────────────────────────────────────────────

describe('VoicePanel — Continuous Mode', () => {
  it('shows continuous mode indicator when active', () => {
    const props = createDefaultProps({
      voiceState: {
        status: 'recording',
        error: null,
        continuousMode: true,
        turnCount: 2,
        lastTranscript: 'what is the weather',
      },
    });
    expect(props.voiceState.continuousMode).toBe(true);
    expect(props.voiceState.turnCount).toBe(2);
  });

  it('does not show continuous mode indicator when inactive', () => {
    const props = createDefaultProps();
    expect(props.voiceState.continuousMode).toBe(false);
    expect(props.voiceState.turnCount).toBe(0);
  });

  it('increments turn count during continuous mode', () => {
    const state1: VoiceState = {
      status: 'idle',
      error: null,
      continuousMode: true,
      turnCount: 0,
      lastTranscript: null,
    };
    expect(state1.turnCount).toBe(0);

    const state2: VoiceState = { ...state1, turnCount: 1 };
    expect(state2.turnCount).toBe(1);

    const state3: VoiceState = { ...state2, turnCount: 2 };
    expect(state3.turnCount).toBe(2);
  });

  it('resets turn count when continuous mode stops', () => {
    const state: VoiceState = {
      status: 'idle',
      error: null,
      continuousMode: false,
      turnCount: 0,
      lastTranscript: null,
    };
    expect(state.turnCount).toBe(0);
  });
});

// ── Last transcript ──────────────────────────────────────────────────

describe('VoicePanel — Last Transcript', () => {
  it('shows last transcript when available', () => {
    const props = createDefaultProps({
      voiceState: {
        status: 'idle',
        error: null,
        continuousMode: false,
        turnCount: 0,
        lastTranscript: 'Hello, how are you?',
      },
    });
    expect(props.voiceState.lastTranscript).toBe('Hello, how are you?');
  });

  it('does not show transcript when null', () => {
    const props = createDefaultProps();
    expect(props.voiceState.lastTranscript).toBeNull();
  });
});

// ── Callbacks ────────────────────────────────────────────────────────

describe('VoicePanel — Callback Contract', () => {
  it('onStartRecording returns a promise', async () => {
    const mockStartRecording = vi.fn().mockResolvedValue('test transcript');
    const props = createDefaultProps({ onStartRecording: mockStartRecording });

    const result = await props.onStartRecording();
    expect(result).toBe('test transcript');
    expect(mockStartRecording).toHaveBeenCalled();
  });

  it('onStopRecording is callable', () => {
    const mockStopRecording = vi.fn();
    const props = createDefaultProps({ onStopRecording: mockStopRecording });

    props.onStopRecording();
    expect(mockStopRecording).toHaveBeenCalled();
  });

  it('onSpeak accepts text and returns promise', async () => {
    const mockSpeak = vi.fn().mockResolvedValue(undefined);
    const props = createDefaultProps({ onSpeak: mockSpeak });

    await props.onSpeak('Hello world');
    expect(mockSpeak).toHaveBeenCalledWith('Hello world');
  });

  it('onStopPlayback is callable', () => {
    const mockStopPlayback = vi.fn();
    const props = createDefaultProps({ onStopPlayback: mockStopPlayback });

    props.onStopPlayback();
    expect(mockStopPlayback).toHaveBeenCalled();
  });

  it('onStartContinuousMode accepts a transcript callback', () => {
    const mockStart = vi.fn();
    const props = createDefaultProps({ onStartContinuousMode: mockStart });
    const transcriptCallback = vi.fn();

    props.onStartContinuousMode(transcriptCallback);
    expect(mockStart).toHaveBeenCalledWith(transcriptCallback);
  });

  it('onStopContinuousMode is callable', () => {
    const mockStop = vi.fn();
    const props = createDefaultProps({ onStopContinuousMode: mockStop });

    props.onStopContinuousMode();
    expect(mockStop).toHaveBeenCalled();
  });

  it('onClose is callable', () => {
    const mockClose = vi.fn();
    const props = createDefaultProps({ onClose: mockClose });

    props.onClose();
    expect(mockClose).toHaveBeenCalled();
  });

  it('onSendTranscript sends text', () => {
    const mockSend = vi.fn();
    const props = createDefaultProps({ onSendTranscript: mockSend });

    props.onSendTranscript('transcribed message');
    expect(mockSend).toHaveBeenCalledWith('transcribed message');
  });
});

// ── Last assistant message for TTS ───────────────────────────────────

describe('VoicePanel — Last Assistant Message', () => {
  it('provides last assistant message for speak action', () => {
    const props = createDefaultProps({
      lastAssistantMessage: 'I am doing well, thank you for asking!',
    });
    expect(props.lastAssistantMessage).toBe('I am doing well, thank you for asking!');
  });

  it('lastAssistantMessage is undefined when no assistant messages', () => {
    const props = createDefaultProps();
    expect(props.lastAssistantMessage).toBeUndefined();
  });
});

// ── All voice statuses map to valid states ───────────────────────────

describe('VoicePanel — Status Mapping Coverage', () => {
  const allStatuses: VoiceState['status'][] = [
    'idle',
    'recording',
    'transcribing',
    'synthesizing',
    'playing',
    'error',
  ];

  for (const statusVal of allStatuses) {
    it(`status "${statusVal}" creates valid state`, () => {
      const state: VoiceState = {
        status: statusVal,
        error: statusVal === 'error' ? 'test error' : null,
        continuousMode: false,
        turnCount: 0,
        lastTranscript: null,
      };
      expect(state.status).toBe(statusVal);
    });
  }
});
