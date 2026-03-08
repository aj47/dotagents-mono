const FALLBACK_SWITCH_LABEL = 'Setting toggle';
const FALLBACK_SERVER_LABEL = 'Enable MCP server';
const FALLBACK_BUTTON_LABEL = 'Action button';
const FALLBACK_INPUT_LABEL = 'Input field';
const FALLBACK_DISCLOSURE_LABEL = 'details';
const FALLBACK_VOICE_STATUS = 'Voice input ready.';
const MIC_CONTROL_LABEL = 'Voice input microphone button';
const WEB_SHORTCUT_HINT = 'Use Shift+Enter or Ctrl/Cmd+Enter to send.';
const DEFAULT_TOUCH_TARGET_SIZE = 44;
const DEFAULT_TOUCH_TARGET_PADDING = 6;
const DEFAULT_TOUCH_TARGET_GAP = 2;
const MAX_VOICE_ANNOUNCEMENT_TRANSCRIPT_CHARS = 140;

const normalizeLabel = (label: string): string => {
  const trimmed = label.trim();
  return trimmed.length > 0 ? trimmed : '';
};

export const createSwitchAccessibilityLabel = (settingName: string): string => {
  const normalizedName = normalizeLabel(settingName);
  if (!normalizedName) {
    return FALLBACK_SWITCH_LABEL;
  }
  return `${normalizedName} toggle`;
};

export const createMcpServerSwitchAccessibilityLabel = (serverName: string): string => {
  const normalizedServerName = normalizeLabel(serverName);
  if (!normalizedServerName) {
    return FALLBACK_SERVER_LABEL;
  }
  return `Enable ${normalizedServerName} MCP server`;
};

export const createButtonAccessibilityLabel = (actionName: string): string => {
  const normalizedName = normalizeLabel(actionName);
  if (!normalizedName) {
    return FALLBACK_BUTTON_LABEL;
  }
  return `${normalizedName} button`;
};

export const createTextInputAccessibilityLabel = (fieldName: string): string => {
  const normalizedName = normalizeLabel(fieldName);
  if (!normalizedName) {
    return FALLBACK_INPUT_LABEL;
  }
  return `${normalizedName} input`;
};

export const createMicControlAccessibilityLabel = (): string => MIC_CONTROL_LABEL;

export const createMicControlAccessibilityHint = ({
  handsFree,
  listening,
  willCancel,
}: {
  handsFree: boolean;
  listening: boolean;
  willCancel: boolean;
}): string => {
  if (handsFree) {
    if (listening) {
      return 'Voice input is active. Double tap to stop recording.';
    }
    return 'Double tap to start voice input. Double tap again to stop recording.';
  }

  if (listening) {
    if (willCancel) {
      return 'Voice input is active. Release to insert dictated text for editing.';
    }
    return 'Voice input is active. Release to send your dictated message.';
  }

  return 'Press and hold to dictate your message. Release to send.';
};

export const createChatComposerAccessibilityHint = ({
  handsFree,
  listening,
  isWeb = false,
}: {
  handsFree: boolean;
  listening: boolean;
  isWeb?: boolean;
}): string => {
  const baseHint = listening
    ? 'Voice listening is active. Dictated text appears in this message field.'
    : handsFree
      ? 'Type your message or tap the mic to dictate. Hands-free mode can send dictated speech automatically.'
      : 'Type your message or hold the mic to dictate before sending.';

  if (!isWeb) {
    return baseHint;
  }

  return `${baseHint} ${WEB_SHORTCUT_HINT}`;
};

export const createExpandCollapseAccessibilityLabel = (
  targetName: string,
  isExpanded: boolean,
): string => {
  const normalizedName = normalizeLabel(targetName);
  const safeName = normalizedName || FALLBACK_DISCLOSURE_LABEL;
  return `${isExpanded ? 'Collapse' : 'Expand'} ${safeName}`;
};

const normalizeVoiceTranscriptForAnnouncement = (text: string): string => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }
  if (normalized.length <= MAX_VOICE_ANNOUNCEMENT_TRANSCRIPT_CHARS) {
    return normalized;
  }
  return `${normalized.slice(0, MAX_VOICE_ANNOUNCEMENT_TRANSCRIPT_CHARS - 3).trimEnd()}...`;
};

export const createVoiceInputLiveRegionAnnouncement = ({
  listening,
  handsFree,
  willCancel,
  voiceError,
  liveTranscript,
  sttPreview,
}: {
  listening: boolean;
  handsFree: boolean;
  willCancel: boolean;
  voiceError?: string;
  liveTranscript?: string;
  sttPreview?: string;
}): string => {
  const transcriptForAnnouncement = normalizeVoiceTranscriptForAnnouncement(
    liveTranscript || sttPreview || '',
  );
  const voiceErrorAnnouncement = normalizeVoiceTranscriptForAnnouncement(voiceError || '');

  if (listening) {
    const releaseInstruction = handsFree
      ? 'Tap mic again to stop.'
      : willCancel
        ? 'Release to edit your message.'
        : 'Release to send your message.';

    if (transcriptForAnnouncement) {
      return `Voice listening active. ${releaseInstruction} Transcript: ${transcriptForAnnouncement}`;
    }

    return `Voice listening active. ${releaseInstruction}`;
  }

  if (voiceErrorAnnouncement) {
    return `Voice input error. ${voiceErrorAnnouncement}`;
  }

  if (transcriptForAnnouncement) {
    return `Voice input captured. Transcript: ${transcriptForAnnouncement}`;
  }

  return FALLBACK_VOICE_STATUS;
};

export const createMinimumTouchTargetStyle = ({
  minSize = DEFAULT_TOUCH_TARGET_SIZE,
  horizontalPadding = DEFAULT_TOUCH_TARGET_PADDING,
  verticalPadding = DEFAULT_TOUCH_TARGET_PADDING,
  horizontalMargin = DEFAULT_TOUCH_TARGET_GAP,
}: {
  minSize?: number;
  horizontalPadding?: number;
  verticalPadding?: number;
  horizontalMargin?: number;
} = {}) => ({
  minWidth: minSize,
  minHeight: minSize,
  paddingHorizontal: horizontalPadding,
  paddingVertical: verticalPadding,
  marginHorizontal: horizontalMargin,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
});

