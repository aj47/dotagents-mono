/**
 * VoicePanel — TUI component for voice integration controls.
 *
 * Shows voice status, supports:
 * - Push-to-talk (Enter to record → transcribe)
 * - TTS playback of the last agent response
 * - Continuous voice mode (alternate listen/speak)
 * - Status indicators for recording, transcribing, synthesizing, playing
 */

import { useKeyboard } from '@opentui/react';
import { useCallback } from 'react';
import type { VoiceState } from '../hooks/useVoice';

export interface VoicePanelProps {
  /** Current voice subsystem state */
  voiceState: VoiceState;
  /** Start a single recording session */
  onStartRecording: () => Promise<string | null>;
  /** Stop the current recording */
  onStopRecording: () => void;
  /** Speak the given text */
  onSpeak: (text: string) => Promise<void>;
  /** Stop playback */
  onStopPlayback: () => void;
  /** Start continuous voice mode */
  onStartContinuousMode: (onTranscript: (text: string) => void) => void;
  /** Stop continuous voice mode */
  onStopContinuousMode: () => void;
  /** Close the voice panel */
  onClose: () => void;
  /** Called when a transcript is ready — sends it as a chat message */
  onSendTranscript: (text: string) => void;
  /** Last assistant message for TTS playback */
  lastAssistantMessage?: string;
}

/** Map status to emoji + label for display */
function getStatusDisplay(status: VoiceState['status']): { icon: string; label: string; color: string } {
  switch (status) {
    case 'idle':
      return { icon: '⏸', label: 'Ready', color: '#9ece6a' };
    case 'recording':
      return { icon: '🎙', label: 'Recording...', color: '#f7768e' };
    case 'transcribing':
      return { icon: '⏳', label: 'Transcribing...', color: '#e0af68' };
    case 'synthesizing':
      return { icon: '🔊', label: 'Synthesizing...', color: '#7aa2f7' };
    case 'playing':
      return { icon: '▶', label: 'Playing...', color: '#7aa2f7' };
    case 'error':
      return { icon: '❌', label: 'Error', color: '#f7768e' };
  }
}

export function VoicePanel({
  voiceState,
  onStartRecording,
  onStopRecording,
  onSpeak,
  onStopPlayback,
  onStartContinuousMode,
  onStopContinuousMode,
  onClose,
  onSendTranscript,
  lastAssistantMessage,
}: VoicePanelProps) {
  const { status, error, continuousMode, turnCount, lastTranscript } = voiceState;
  const display = getStatusDisplay(status);

  const handleRecord = useCallback(async () => {
    const transcript = await onStartRecording();
    if (transcript && transcript.trim().length > 0) {
      onSendTranscript(transcript);
    }
  }, [onStartRecording, onSendTranscript]);

  const handleToggleContinuous = useCallback(() => {
    if (continuousMode) {
      onStopContinuousMode();
    } else {
      onStartContinuousMode(onSendTranscript);
    }
  }, [continuousMode, onStartContinuousMode, onStopContinuousMode, onSendTranscript]);

  const handleSpeakLast = useCallback(async () => {
    if (lastAssistantMessage) {
      await onSpeak(lastAssistantMessage);
    }
  }, [lastAssistantMessage, onSpeak]);

  useKeyboard((key) => {
    if (key.name === 'escape') {
      if (continuousMode) {
        onStopContinuousMode();
      }
      onClose();
      return;
    }

    if (key.name === 'return') {
      if (status === 'recording') {
        onStopRecording();
      } else if (status === 'idle') {
        void handleRecord();
      }
      return;
    }

    if (key.name === 's' && status === 'idle' && !continuousMode) {
      void handleSpeakLast();
      return;
    }

    if (key.name === 'c') {
      handleToggleContinuous();
      return;
    }

    if (key.name === 'x') {
      if (status === 'playing') {
        onStopPlayback();
      } else if (status === 'recording') {
        onStopRecording();
      }
    }
  });

  return (
    <box flexDirection="column" width="100%" border borderStyle="rounded" borderColor="#7aa2f7" paddingX={1}>
      {/* Header */}
      <box flexDirection="row" width="100%">
        <text fg="#7aa2f7"><strong>🎤 Voice Mode</strong></text>
        <text fg="#565f89"> — press Escape to close</text>
      </box>

      {/* Status */}
      <box flexDirection="row" width="100%" marginTop={1}>
        <text fg={display.color}>{display.icon} {display.label}</text>
        {continuousMode && (
          <text fg="#e0af68"> | 🔄 Continuous Mode (turn {turnCount})</text>
        )}
      </box>

      {/* Error display */}
      {error && (
        <box width="100%" marginTop={1}>
          <text fg="#f7768e">Error: {error}</text>
        </box>
      )}

      {/* Last transcript */}
      {lastTranscript && (
        <box width="100%" marginTop={1}>
          <text fg="#9ece6a">Last transcript: </text>
          <text fg="#c0caf5">{lastTranscript}</text>
        </box>
      )}

      {/* Controls */}
      <box flexDirection="column" width="100%" marginTop={1}>
        <text fg="#565f89">
          {status === 'idle'
            ? 'Enter — Record  |  s — Speak last response  |  c — Toggle continuous mode  |  Esc — Close'
            : status === 'recording'
              ? 'Enter — Stop recording  |  x — Cancel  |  Esc — Close'
              : status === 'playing'
                ? 'x — Stop playback  |  Esc — Close'
                : 'Esc — Close'}
        </text>
      </box>
    </box>
  );
}
