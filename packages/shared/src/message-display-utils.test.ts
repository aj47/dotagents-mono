import { describe, it, expect } from 'vitest'
import {
  CHAT_MESSAGE_ACTION_PRESENTATION,
  CHAT_MESSAGE_ACTION_MOBILE_ACTIVE_BUTTON_KIND_BY_SLOT,
  CHAT_MESSAGE_ACTION_MOBILE_BUTTON_KIND_BY_SLOT,
  CHAT_MESSAGE_ACTION_SEQUENCE,
  CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION,
  CHAT_MESSAGE_DISPLAY_PRESENTATION,
  CHAT_MESSAGE_SURFACE_PRESENTATION,
  CHAT_MESSAGE_TONE_PRESENTATION,
  getChatMessageToneDesktopClassName,
  getChatMessageToneMobileColors,
  getChatMessageToneMobileStyleSlot,
  normalizeMessagePreviewText,
  normalizeAssistantResponseForDedupe,
  sanitizeMessageContentForDisplay,
  sanitizeMessageContentForModel,
  sanitizeMessageMediaContentForPreview,
  sanitizeMessagesForModel,
  sanitizeMessageContentForSpeech,
  sanitizeAgentProgressUpdateForDisplay,
  getChatMessageCollapseThreshold,
  getChatMessageCollapsedPreview,
  getChatMessageCollapsedPreviewMobileActionState,
  getChatMessageDesktopSurfaceState,
  getChatMessageMobileContentLayoutState,
  getChatMessageMobileCollapsedPreviewColors,
  getChatMessageMobileCollapsedPreviewState,
  getChatMessageMobileRenderState,
  getChatMessageMobileSurfaceState,
  getChatMessageContentRenderState,
  getChatMessageActionCopyState,
  getChatMessageActionDesktopSurfaceState,
  getChatMessageActionAvailabilityRenderState,
  getChatMessageActionLayoutState,
  getChatMessageActionLayoutRenderState,
  getChatMessageActionSequence,
  getChatMessageVisibleActionSlots,
  getChatMessageActionMobileActiveButtonKindForSlot,
  getChatMessageActionMobileButtonKindForSlot,
  getChatMessageActionMobileButtonColors,
  getChatMessageActionMobileButtonRenderState,
  getChatMessageActionMobileButtonState,
  getChatMessageActionMobileButtonStateForSlot,
  getChatMessageActionMobileButtonStatesBySlot,
  getChatMessageActionMobileIconColors,
  getChatMessageActionMobileRowState,
  getChatMessageActionMobileStyleRenderState,
  getChatMessageActionMobileTurnDurationBadgeColors,
  getChatMessageActionMobileTurnDurationBadgeState,
  getChatMessageCopyLabel,
  getChatMessageCopyActionAccessibilityLabel,
  getChatMessageCopyActionState,
  getChatMessageCopyActionTitle,
  getChatMessageCopyMobileIconState,
  getChatMessageCopyMobileRenderState,
  getChatMessageEffectiveCollapseState,
  findLastChatMessageConversationContentIndex,
  isChatMessageLiveStreamingConversationContent,
  isChatMessageConversationContent,
  isChatMessageRuntimeVariant,
  getChatMessageDisplayRole,
  getChatMessageDisplayTone,
  applyChatDisplayGroupedExpansionInheritance,
  getChatDisplayExpansionState,
  getChatDisplayGroupedExpansionState,
  getChatMessageExpansionActionAccessibilityLabel,
  getChatMessageExpansionActionState,
  getChatMessageExpansionActionTitle,
  getChatMessageExpansionLabel,
  getChatMessageExpansionMobileIconState,
  getChatMessageExpansionMobileRenderState,
  getChatMessageSpeechActionAccessibilityLabel,
  getChatMessageSpeechActionState,
  getChatMessageSpeechLabel,
  getChatMessageSpeechMobileIconState,
  getChatMessageSpeechMobileRenderState,
  hasChatDisplayExpansionState,
  hasChatMessageDisplayContent,
  hasMarkdownMediaPayload,
  setChatDisplayExpansionState,
  shouldShowChatMessageCopyAction,
  shouldShowChatMessageExpansionAction,
  shouldShowChatMessageSpeechAction,
  shouldShowChatMessageTurnDurationBadge,
  shouldCollapseChatMessageContent,
  shouldRenderChatMessageStandaloneActionRow,
  shouldRenderChatMessageSurface,
  stripMarkdownMediaPayloads,
  toggleChatDisplayExpansionState,
} from './message-display-utils'
import type { AgentProgressUpdate } from './agent-progress'

describe('sanitizeMessageContentForDisplay', () => {
  it('returns content unchanged when no inline data images', () => {
    const content = 'Hello, world!'
    expect(sanitizeMessageContentForDisplay(content)).toBe(content)
  })

  it('replaces inline data image with alt text placeholder', () => {
    const content = '![my image](data:image/png;base64,abc123)'
    expect(sanitizeMessageContentForDisplay(content)).toBe('[Image: my image]')
  })

  it('replaces inline data image with no alt text', () => {
    const content = '![](data:image/png;base64,abc123)'
    expect(sanitizeMessageContentForDisplay(content)).toBe('[Image]')
  })

  it('preserves non-data URL markdown images', () => {
    const content = '![alt](https://example.com/image.png)'
    expect(sanitizeMessageContentForDisplay(content)).toBe(content)
  })

  it('handles multiple inline data images', () => {
    const content = '![a](data:image/png;base64,x) text ![b](data:image/jpeg;base64,y)'
    expect(sanitizeMessageContentForDisplay(content)).toBe('[Image: a] text [Image: b]')
  })
})

describe('sanitizeMessageContentForModel', () => {
  it('replaces inline data image payloads while preserving alt placeholders', () => {
    expect(sanitizeMessageContentForModel('Describe ![diagram](data:image/png;base64,abc)')).toBe('Describe [Image: diagram]')
  })

  it('preserves remote markdown images as text for model history replay', () => {
    const content = 'See ![remote](https://example.com/image.png)'
    expect(sanitizeMessageContentForModel(content)).toBe(content)
  })
})

describe('sanitizeMessagesForModel', () => {
  it('returns unchanged message references when no model sanitization is needed', () => {
    const messages = [
      { role: 'user' as const, content: 'hello' },
      { role: 'assistant' as const },
    ]

    const result = sanitizeMessagesForModel(messages)

    expect(result[0]).toBe(messages[0])
    expect(result[1]).toBe(messages[1])
  })

  it('sanitizes only messages containing inline data image payloads', () => {
    const messages = [
      { role: 'user' as const, content: '![pic](data:image/png;base64,abc)', id: '1' },
      { role: 'assistant' as const, content: 'ok', id: '2' },
    ]

    const result = sanitizeMessagesForModel(messages)

    expect(result[0]).toEqual({ role: 'user', content: '[Image: pic]', id: '1' })
    expect(result[0]).not.toBe(messages[0])
    expect(result[1]).toBe(messages[1])
  })
})

describe('sanitizeMessageContentForSpeech', () => {
  it('returns empty/falsy content as-is', () => {
    expect(sanitizeMessageContentForSpeech('')).toBe('')
  })

  it('strips markdown image references (external URLs)', () => {
    const content = 'See this ![photo](https://example.com/pic.png) here'
    expect(sanitizeMessageContentForSpeech(content)).toBe('See this Image: photo here')
  })

  it('strips markdown image references (data URLs)', () => {
    const content = '![diagram](data:image/png;base64,abc)'
    expect(sanitizeMessageContentForSpeech(content)).toBe('Image: diagram')
  })

  it('strips images with no alt text', () => {
    const content = '![](https://example.com/pic.png)'
    expect(sanitizeMessageContentForSpeech(content)).toBe('Image')
  })

  it('strips markdown video links', () => {
    const content = 'Watch [demo](assets://conversation-video/conv_1/abcdef1234567890.mp4) please'
    expect(sanitizeMessageContentForSpeech(content)).toBe('Watch Video: demo please')
  })

  it('preserves recording asset links in speech text', () => {
    const content = 'Review [recording](assets://recording/recording_1/demo.mp4) please'
    expect(sanitizeMessageContentForSpeech(content)).toBe(content)
  })

  it('leaves plain text unchanged', () => {
    const content = 'Just regular text with no images'
    expect(sanitizeMessageContentForSpeech(content)).toBe(content)
  })
})

describe('sanitizeMessageMediaContentForPreview', () => {
  it('collapses whitespace around plain text', () => {
    expect(sanitizeMessageMediaContentForPreview('  hello\n\nworld  ')).toBe('hello world')
  })

  it('replaces markdown images with [Image]', () => {
    expect(sanitizeMessageMediaContentForPreview('See ![pic](https://example.com/img.png) here')).toBe('See [Image] here')
  })

  it('replaces data URL images with [Image]', () => {
    expect(sanitizeMessageMediaContentForPreview('![](data:image/png;base64,abc)')).toBe('[Image]')
  })

  it('replaces markdown video links with [Video]', () => {
    const content = 'Watch [demo](assets://conversation-video/conv_1/abcdef1234567890.mp4) now'
    expect(sanitizeMessageMediaContentForPreview(content)).toBe('Watch [Video] now')
  })

  it('preserves recording asset links in previews', () => {
    const content = 'Review [recording](assets://recording/recording_1/demo.mp4) now'
    expect(sanitizeMessageMediaContentForPreview(content)).toBe(content)
  })
})

describe('getChatMessageCollapsedPreview', () => {
  it('strips markdown heading markers before compact preview sanitization', () => {
    expect(getChatMessageCollapsedPreview('# Release notes\n\nSee ![demo](data:image/png;base64,abc)')).toBe(
      'Release notes See [Image]',
    )
  })

  it('preserves non-heading hashes and normalizes media payloads', () => {
    expect(getChatMessageCollapsedPreview('Use #tag and watch [Demo](assets://conversation-video/conv/demo.mp4)')).toBe(
      'Use #tag and watch [Video]',
    )
  })
})

describe('stripMarkdownMediaPayloads', () => {
  it('removes known markdown image and video payloads while preserving text', () => {
    const content = [
      'Before',
      '![pic](data:image/png;base64,abc)',
      '[clip](assets://conversation-video/conv_1/abcdef1234567890.mp4)',
      '[recording](assets://recording/recording_1/demo.mp4)',
      'After',
    ].join(' ')

    expect(stripMarkdownMediaPayloads(content)).toBe('Before    After')
  })

  it('does not strip arbitrary markdown images by default', () => {
    const content = 'See ![diagram](file://local/path.png) here'
    expect(stripMarkdownMediaPayloads(content)).toBe(content)
  })

  it('can strip any markdown image for response-event fuzzy matching', () => {
    const content = 'See ![diagram](file://local/path.png) here'
    expect(stripMarkdownMediaPayloads(content, { stripAllImages: true })).toBe('See  here')
  })
})

describe('hasMarkdownMediaPayload', () => {
  it('detects known image and video media payloads', () => {
    expect(hasMarkdownMediaPayload('![pic](assets://conversation-image/conv_1/img.png)')).toBe(true)
    expect(hasMarkdownMediaPayload('[clip](assets://recording/recording_1/demo.mp4)')).toBe(true)
    expect(hasMarkdownMediaPayload('[clip](https://example.com/demo.webm?download=1)')).toBe(true)
    expect(hasMarkdownMediaPayload('No media here')).toBe(false)
  })
})

describe('normalizeAssistantResponseForDedupe', () => {
  it('normalizes whitespace for response matching', () => {
    expect(normalizeAssistantResponseForDedupe('  hello\n\nworld  ')).toBe('hello world')
    expect(normalizeAssistantResponseForDedupe(undefined)).toBe('')
  })
})

describe('chat message display presentation', () => {
  it('normalizes roles into shared chat display roles', () => {
    expect(getChatMessageDisplayRole('user')).toBe('user')
    expect(getChatMessageDisplayRole('tool')).toBe('tool')
    expect(getChatMessageDisplayRole('assistant')).toBe('assistant')
    expect(getChatMessageDisplayRole('unknown')).toBe('assistant')
  })

  it('classifies runtime assistant variants separately from conversation content', () => {
    expect(isChatMessageRuntimeVariant('delegation')).toBe(true)
    expect(isChatMessageRuntimeVariant('approval')).toBe(true)
    expect(isChatMessageRuntimeVariant('retry')).toBe(true)
    expect(isChatMessageRuntimeVariant('default')).toBe(false)
    expect(isChatMessageRuntimeVariant(undefined)).toBe(false)
    expect(isChatMessageConversationContent({ role: 'assistant' })).toBe(true)
    expect(isChatMessageConversationContent({ role: 'assistant', variant: 'delegation' })).toBe(false)
    expect(isChatMessageConversationContent({ role: 'assistant', variant: 'approval' })).toBe(false)
    expect(isChatMessageConversationContent({ role: 'assistant', variant: 'retry' })).toBe(false)
    expect(isChatMessageConversationContent({ role: 'user' })).toBe(false)
    expect(isChatMessageConversationContent({ role: 'tool' })).toBe(false)
    const mixedMessages = [
      { role: 'assistant', variant: 'delegation', content: 'delegation' },
      { role: 'user', content: 'prompt' },
      { role: 'assistant', content: 'answer' },
      { role: 'assistant', variant: 'retry', content: 'retrying' },
    ]
    expect(findLastChatMessageConversationContentIndex(mixedMessages, (message) => message)).toBe(2)
    expect(findLastChatMessageConversationContentIndex(
      mixedMessages,
      (message) => message,
      (message) => hasChatMessageDisplayContent(message.content),
    )).toBe(2)
    expect(findLastChatMessageConversationContentIndex(
      [{ role: 'assistant', content: '   ' }, { role: 'assistant', variant: 'retry', content: 'retrying' }],
      (message) => message,
      (message) => hasChatMessageDisplayContent(message.content),
    )).toBe(-1)
    expect(hasChatMessageDisplayContent('Visible text')).toBe(true)
    expect(hasChatMessageDisplayContent('   ')).toBe(false)
    expect(shouldRenderChatMessageSurface({ content: 'Visible text', displayToolCallCount: 0 })).toBe(true)
    expect(shouldRenderChatMessageSurface({ content: '   ', displayToolCallCount: 1 })).toBe(true)
    expect(shouldRenderChatMessageSurface({ content: '   ', displayToolCallCount: 0 })).toBe(false)
    expect(isChatMessageLiveStreamingConversationContent({
      isResponding: true,
      messageIndex: 2,
      lastConversationContentMessageIndex: 2,
      message: { role: 'assistant' },
      content: 'Visible text',
      displayToolCallCount: 0,
    })).toBe(true)
    expect(isChatMessageLiveStreamingConversationContent({
      isResponding: true,
      messageIndex: 2,
      lastConversationContentMessageIndex: 2,
      message: { role: 'assistant', variant: 'retry' },
      content: 'Visible text',
      displayToolCallCount: 0,
    })).toBe(false)
    expect(isChatMessageLiveStreamingConversationContent({
      isResponding: true,
      messageIndex: 2,
      lastConversationContentMessageIndex: 2,
      message: { role: 'assistant' },
      content: 'Visible text',
      displayToolCallCount: 1,
    })).toBe(false)
    expect(getChatMessageContentRenderState({
      content: 'Visible text',
      isExpanded: true,
      shouldCollapse: true,
    })).toMatchObject({
      hasDisplayContent: true,
      isCollapsed: false,
      shouldShowExpandedContent: true,
      shouldShowCollapsedTextPreview: false,
      shouldRenderExpandedContent: true,
      shouldRenderCollapsedTextPreview: false,
      speech: {
        isVisible: true,
      },
    })
    expect(getChatMessageContentRenderState({
      content: 'Visible text',
      isExpanded: false,
      shouldCollapse: true,
    })).toMatchObject({
      hasDisplayContent: true,
      isCollapsed: true,
      shouldShowExpandedContent: false,
      shouldShowCollapsedTextPreview: true,
      shouldRenderExpandedContent: false,
      shouldRenderCollapsedTextPreview: true,
      speech: {
        isVisible: true,
      },
    })
    expect(getChatMessageContentRenderState({
      content: 'Visible text',
      isExpanded: false,
      shouldCollapse: true,
      isLiveStreaming: true,
    })).toMatchObject({
      isCollapsed: false,
      shouldRenderExpandedContent: true,
      shouldRenderCollapsedTextPreview: false,
      speech: {
        isVisible: true,
      },
    })
    expect(shouldRenderChatMessageStandaloneActionRow({
      renderState: getChatMessageContentRenderState({
        content: '',
        isExpanded: false,
        shouldCollapse: false,
      }),
      visibleActionCount: 1,
    })).toBe(true)
    expect(shouldRenderChatMessageStandaloneActionRow({
      renderState: getChatMessageContentRenderState({
        content: 'Visible text',
        isExpanded: false,
        shouldCollapse: true,
      }),
      visibleActionCount: 1,
    })).toBe(false)
    expect(shouldRenderChatMessageStandaloneActionRow({
      renderState: getChatMessageContentRenderState({
        content: '',
        isExpanded: false,
        shouldCollapse: false,
      }),
      visibleActionCount: 0,
    })).toBe(false)
    expect(getChatMessageActionLayoutState({
      availability: {
        turnDuration: true,
        speech: false,
        branch: true,
        copy: true,
        expansion: false,
      },
      renderState: getChatMessageContentRenderState({
        content: '',
        isExpanded: false,
        shouldCollapse: false,
      }),
    })).toEqual({
      visibleSlots: ['turnDuration', 'branch', 'copy'],
      shouldRenderActionSlots: true,
      shouldRenderStandaloneRow: true,
    })
    expect(getChatMessageActionLayoutState({
      availability: {
        turnDuration: true,
        speech: false,
        branch: true,
        copy: true,
        expansion: false,
      },
      renderState: getChatMessageContentRenderState({
        content: 'Visible text',
        isExpanded: true,
        shouldCollapse: false,
      }),
    })).toEqual({
      visibleSlots: ['turnDuration', 'branch', 'copy'],
      shouldRenderActionSlots: true,
      shouldRenderStandaloneRow: false,
    })
    expect(getChatMessageActionLayoutState({
      availability: {
        turnDuration: false,
        speech: false,
        branch: false,
        copy: false,
        expansion: false,
      },
      renderState: getChatMessageContentRenderState({
        content: 'Visible text',
        isExpanded: true,
        shouldCollapse: false,
      }),
    })).toEqual({
      visibleSlots: [],
      shouldRenderActionSlots: false,
      shouldRenderStandaloneRow: false,
    })
    expect(getChatMessageActionAvailabilityRenderState({
      turnDuration: true,
      speech: true,
      branch: false,
      copy: true,
      expansion: false,
    })).toEqual({
      turnDuration: {
        canRender: true,
      },
      speech: {
        canRender: true,
      },
      branch: {
        canRender: false,
      },
      copy: {
        canRender: true,
      },
      expansion: {
        canRender: false,
      },
    })
    expect(getChatMessageActionLayoutRenderState({
      availability: getChatMessageActionAvailabilityRenderState({
        turnDuration: true,
        speech: false,
        branch: true,
        copy: true,
        expansion: false,
      }),
      renderState: getChatMessageContentRenderState({
        content: '',
        isExpanded: false,
        shouldCollapse: false,
      }),
    })).toEqual({
      visibleSlots: ['turnDuration', 'branch', 'copy'],
      shouldRenderActionSlots: true,
      shouldRenderStandaloneRow: true,
    })
  })

  it('promotes the final successful assistant message to the final assistant tone', () => {
    expect(getChatMessageDisplayTone({ role: 'assistant', isComplete: true, isLast: true })).toBe('assistant_final')
    expect(getChatMessageDisplayTone({ role: 'assistant', isComplete: true, isLast: true, hasErrors: true })).toBe('assistant')
    expect(getChatMessageDisplayTone({ role: 'user', isComplete: true, isLast: true })).toBe('user')
    expect(getChatMessageDisplayTone({ role: 'tool', isComplete: true, isLast: true })).toBe('tool')
  })

  it('shares desktop-aligned collapse thresholds across chat surfaces', () => {
    expect(getChatMessageCollapseThreshold('plain text')).toBe(100)
    expect(getChatMessageCollapseThreshold('![pic](assets://conversation-image/conv_1/img.png)')).toBe(500)
    expect(shouldCollapseChatMessageContent('x'.repeat(101))).toBe(true)
    expect(shouldCollapseChatMessageContent('x'.repeat(101), true)).toBe(true)
    expect(shouldCollapseChatMessageContent('x'.repeat(100))).toBe(false)
    expect(shouldCollapseChatMessageContent('short', true)).toBe(true)
    expect(getChatMessageEffectiveCollapseState({ content: 'x'.repeat(101) })).toBe(true)
    expect(getChatMessageEffectiveCollapseState({ content: 'short', hasExtras: true })).toBe(true)
    expect(getChatMessageEffectiveCollapseState({ content: 'x'.repeat(101), suppressCollapse: true })).toBe(false)
  })

  it('shares compact chat message action labels', () => {
    expect(CHAT_MESSAGE_ACTION_PRESENTATION.copy.messageLabel).toBe('Copy message')
    expect(getChatMessageActionCopyState()).toBe(CHAT_MESSAGE_ACTION_PRESENTATION)
    expect(CHAT_MESSAGE_ACTION_SEQUENCE).toEqual(['turnDuration', 'speech', 'branch', 'copy', 'expansion'])
    expect(getChatMessageActionSequence()).toBe(CHAT_MESSAGE_ACTION_SEQUENCE)
    expect(getChatMessageVisibleActionSlots({
      turnDuration: true,
      speech: false,
      branch: true,
      copy: true,
      expansion: false,
    })).toEqual(['turnDuration', 'branch', 'copy'])
    expect(getChatMessageCopyLabel('user')).toBe(CHAT_MESSAGE_ACTION_PRESENTATION.copy.promptLabel)
    expect(getChatMessageCopyLabel('assistant')).toBe(CHAT_MESSAGE_ACTION_PRESENTATION.copy.responseLabel)
    expect(getChatMessageCopyLabel('assistant', true)).toBe(CHAT_MESSAGE_ACTION_PRESENTATION.copy.copiedLabel)
    expect(getChatMessageCopyActionState({ role: 'user', content: 'Prompt' })).toEqual({
      canCopy: true,
      label: CHAT_MESSAGE_ACTION_PRESENTATION.copy.promptLabel,
    })
    expect(getChatMessageCopyActionState({ role: 'assistant', content: 'Response', isAssistantComplete: true, isCopied: true })).toEqual({
      canCopy: true,
      label: CHAT_MESSAGE_ACTION_PRESENTATION.copy.copiedLabel,
    })
    expect(getChatMessageCopyActionState({ role: 'assistant', content: 'Response', isAssistantComplete: false })).toEqual({
      canCopy: false,
      label: null,
    })
    expect(getChatMessageCopyActionAccessibilityLabel({ label: CHAT_MESSAGE_ACTION_PRESENTATION.copy.promptLabel })).toBe(CHAT_MESSAGE_ACTION_PRESENTATION.copy.promptLabel)
    expect(getChatMessageCopyActionAccessibilityLabel({ label: null })).toBe(CHAT_MESSAGE_ACTION_PRESENTATION.copy.messageLabel)
    expect(getChatMessageCopyActionTitle({ label: CHAT_MESSAGE_ACTION_PRESENTATION.copy.responseLabel })).toBe(CHAT_MESSAGE_ACTION_PRESENTATION.copy.responseLabel)
    expect(getChatMessageCopyActionTitle({ label: null })).toBe(CHAT_MESSAGE_ACTION_PRESENTATION.copy.messageLabel)
    expect(shouldShowChatMessageCopyAction({ role: 'user', content: 'Prompt' })).toBe(true)
    expect(shouldShowChatMessageCopyAction({ role: 'assistant', content: 'Response', isAssistantComplete: true })).toBe(true)
    expect(shouldShowChatMessageCopyAction({ role: 'assistant', content: 'Response', isAssistantComplete: false })).toBe(false)
    expect(shouldShowChatMessageCopyAction({ role: 'assistant', content: '   ', isAssistantComplete: true })).toBe(false)
    expect(shouldShowChatMessageCopyAction({ role: 'tool', content: 'Tool result', isAssistantComplete: true })).toBe(false)
    expect(shouldShowChatMessageSpeechAction({ role: 'assistant', content: 'Response', ttsEnabled: true })).toBe(true)
    expect(shouldShowChatMessageSpeechAction({ role: 'assistant', content: 'Response', ttsEnabled: false })).toBe(false)
    expect(shouldShowChatMessageSpeechAction({ role: 'assistant', content: 'Response', ttsEnabled: true, isVisible: false })).toBe(false)
    expect(shouldShowChatMessageSpeechAction({ role: 'assistant', content: 'Response', ttsEnabled: true, isThinking: true })).toBe(false)
    expect(shouldShowChatMessageSpeechAction({ role: 'assistant', content: 'Response', ttsEnabled: true, isAssistantThought: true })).toBe(false)
    expect(shouldShowChatMessageSpeechAction({ role: 'assistant', content: 'Response', ttsEnabled: true, isAssistantThought: true, isThoughtEligibleForSpeech: true })).toBe(true)
    expect(shouldShowChatMessageSpeechAction({ role: 'assistant', content: 'Response', ttsEnabled: true, isAssistantEligible: false })).toBe(false)
    expect(shouldShowChatMessageSpeechAction({ role: 'user', content: 'Prompt', ttsEnabled: true })).toBe(false)
    expect(getChatMessageSpeechActionState({ role: 'assistant', content: 'Response', ttsEnabled: true })).toEqual({
      canSpeak: true,
      label: CHAT_MESSAGE_ACTION_PRESENTATION.speech.readAloudLabel,
    })
    expect(getChatMessageSpeechActionState({ role: 'assistant', content: 'Response', ttsEnabled: true, isSpeaking: true })).toEqual({
      canSpeak: true,
      label: CHAT_MESSAGE_ACTION_PRESENTATION.speech.stopReadingLabel,
    })
    expect(getChatMessageSpeechActionState({ role: 'assistant', content: 'Response', ttsEnabled: false })).toEqual({
      canSpeak: false,
      label: null,
    })
    expect(getChatMessageSpeechActionAccessibilityLabel({ label: CHAT_MESSAGE_ACTION_PRESENTATION.speech.stopReadingLabel })).toBe(CHAT_MESSAGE_ACTION_PRESENTATION.speech.stopReadingLabel)
    expect(getChatMessageSpeechActionAccessibilityLabel({ label: null })).toBe(CHAT_MESSAGE_ACTION_PRESENTATION.speech.readAloudLabel)
    expect(shouldShowChatMessageExpansionAction({ shouldCollapse: true })).toBe(true)
    expect(shouldShowChatMessageExpansionAction({ shouldCollapse: true, isToolOnly: true })).toBe(false)
    expect(shouldShowChatMessageExpansionAction({ shouldCollapse: false })).toBe(false)
    expect(getChatMessageExpansionActionState({ shouldCollapse: true, isExpanded: false })).toEqual({
      canToggle: true,
      label: CHAT_MESSAGE_ACTION_PRESENTATION.expansion.showMoreLabel,
      accessibilityLabel: 'Expand message',
      accessibilityHint: CHAT_MESSAGE_ACTION_PRESENTATION.expansion.expandMessageHint,
      accessibilityState: { expanded: false, disabled: false },
      ariaExpanded: false,
      isExpanded: false,
    })
    expect(getChatMessageExpansionActionState({ shouldCollapse: true, isExpanded: true })).toEqual({
      canToggle: true,
      label: CHAT_MESSAGE_ACTION_PRESENTATION.expansion.showLessLabel,
      accessibilityLabel: 'Collapse message',
      accessibilityHint: CHAT_MESSAGE_ACTION_PRESENTATION.expansion.collapseMessageHint,
      accessibilityState: { expanded: true, disabled: false },
      ariaExpanded: true,
      isExpanded: true,
    })
    expect(getChatMessageExpansionActionState({ shouldCollapse: true, isToolOnly: true, isExpanded: true })).toEqual({
      canToggle: false,
      label: null,
      accessibilityLabel: null,
      accessibilityHint: null,
      accessibilityState: { expanded: true, disabled: true },
      ariaExpanded: true,
      isExpanded: true,
    })
    expect(getChatMessageExpansionActionAccessibilityLabel({
      accessibilityLabel: 'Expand message',
      label: CHAT_MESSAGE_ACTION_PRESENTATION.expansion.showMoreLabel,
    })).toBe('Expand message')
    expect(getChatMessageExpansionActionAccessibilityLabel({
      accessibilityLabel: null,
      label: CHAT_MESSAGE_ACTION_PRESENTATION.expansion.showMoreLabel,
    })).toBe(CHAT_MESSAGE_ACTION_PRESENTATION.expansion.showMoreLabel)
    expect(getChatMessageExpansionActionAccessibilityLabel({
      accessibilityLabel: null,
      label: null,
    })).toBe(CHAT_MESSAGE_ACTION_PRESENTATION.expansion.messageName)
    expect(getChatMessageExpansionActionTitle({
      label: CHAT_MESSAGE_ACTION_PRESENTATION.expansion.showMoreLabel,
    })).toBe(CHAT_MESSAGE_ACTION_PRESENTATION.expansion.showMoreLabel)
    expect(getChatMessageExpansionActionTitle({ label: null })).toBe(CHAT_MESSAGE_ACTION_PRESENTATION.expansion.messageName)
    const expansion = { messageA: true, messageB: false }
    expect(hasChatDisplayExpansionState(expansion, 'messageA')).toBe(true)
    expect(hasChatDisplayExpansionState(expansion, 'missing')).toBe(false)
    expect(getChatDisplayExpansionState(expansion, 'messageA')).toBe(true)
    expect(getChatDisplayExpansionState(expansion, 'messageB', true)).toBe(false)
    expect(getChatDisplayExpansionState(expansion, 'missing', true)).toBe(true)
    expect(getChatDisplayExpansionState(expansion, 'missing')).toBe(false)

    const collapsed = setChatDisplayExpansionState(expansion, 'messageA', false)
    const toggledFromDefault = toggleChatDisplayExpansionState(collapsed, 'messageC', true)
    const numeric = toggleChatDisplayExpansionState({ 1: false } as Record<number, boolean>, 1)

    expect(collapsed).toEqual({ messageA: false, messageB: false })
    expect(collapsed).not.toBe(expansion)
    expect(expansion).toEqual({ messageA: true, messageB: false })
    expect(toggledFromDefault).toEqual({ messageA: false, messageB: false, messageC: false })
    expect(numeric[1]).toBe(true)
    expect(getChatDisplayGroupedExpansionState({
      groupState: {},
      groupKey: 'groupA',
      inheritedState: expansion,
      inheritedKey: 'messageA',
    })).toBe(true)
    expect(getChatDisplayGroupedExpansionState({
      groupState: { groupA: false },
      groupKey: 'groupA',
      inheritedState: expansion,
      inheritedKey: 'messageA',
    })).toBe(false)
    expect(getChatDisplayGroupedExpansionState({
      groupState: {},
      groupKey: 'groupB',
      inheritedState: expansion,
      inheritedKey: 'missing',
      defaultExpanded: true,
    })).toBe(true)
    expect(applyChatDisplayGroupedExpansionInheritance({
      groupState: {},
      inheritedState: expansion,
      groups: [
        { groupKey: 'groupA', inheritedKey: 'messageA' },
        { groupKey: 'groupB', inheritedKey: 'messageB' },
      ],
    })).toEqual({ groupA: true })

    const explicitGroup = { groupA: false }
    const inheritedExplicitGroup = applyChatDisplayGroupedExpansionInheritance({
      groupState: explicitGroup,
      inheritedState: expansion,
      groups: [{ groupKey: 'groupA', inheritedKey: 'messageA' }],
    })
    const unchangedGroup = applyChatDisplayGroupedExpansionInheritance({
      groupState: explicitGroup,
      inheritedState: expansion,
      groups: [{ groupKey: 'groupB', inheritedKey: 'missing' }],
    })
    expect(inheritedExplicitGroup).toBe(explicitGroup)
    expect(unchangedGroup).toBe(explicitGroup)
    expect(shouldShowChatMessageTurnDurationBadge({ role: 'user', durationMs: 1200 })).toBe(true)
    expect(shouldShowChatMessageTurnDurationBadge({ role: 'assistant', durationMs: 1200 })).toBe(false)
    expect(shouldShowChatMessageTurnDurationBadge({ role: 'user' })).toBe(false)
    expect(CHAT_MESSAGE_ACTION_PRESENTATION.copy.feedbackResetDelayMs).toBe(2000)
    expect(CHAT_MESSAGE_ACTION_PRESENTATION.copy.copyGlyph).toBe("⧉")
    expect(CHAT_MESSAGE_ACTION_PRESENTATION.copy.copiedGlyph).toBe("✓")
    expect(CHAT_MESSAGE_ACTION_PRESENTATION.copy.mobileIcon).toMatchObject({
      copyName: "copy-outline",
      copiedName: "checkmark-done-outline",
      size: 13,
    })
    expect(getChatMessageCopyMobileIconState(false)).toEqual({
      name: CHAT_MESSAGE_ACTION_PRESENTATION.copy.mobileIcon.copyName,
      size: CHAT_MESSAGE_ACTION_PRESENTATION.copy.mobileIcon.size,
      colorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButtonText.colorToken,
    })
    expect(getChatMessageCopyMobileIconState(true)).toEqual({
      name: CHAT_MESSAGE_ACTION_PRESENTATION.copy.mobileIcon.copiedName,
      size: CHAT_MESSAGE_ACTION_PRESENTATION.copy.mobileIcon.size,
      colorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButtonText.copiedColorToken,
    })
    expect(getChatMessageSpeechLabel(false)).toBe(CHAT_MESSAGE_ACTION_PRESENTATION.speech.readAloudLabel)
    expect(getChatMessageSpeechLabel(true)).toBe(CHAT_MESSAGE_ACTION_PRESENTATION.speech.stopReadingLabel)
    expect(CHAT_MESSAGE_ACTION_PRESENTATION.speech.readAloudGlyph).toBe("🔊")
    expect(CHAT_MESSAGE_ACTION_PRESENTATION.speech.stopReadingGlyph).toBe("⏹")
    expect(CHAT_MESSAGE_ACTION_PRESENTATION.speech.mobileIcon).toMatchObject({
      readAloudName: "volume-high-outline",
      stopReadingName: "stop-circle-outline",
      size: 13,
    })
    expect(getChatMessageSpeechMobileIconState(false)).toEqual({
      name: CHAT_MESSAGE_ACTION_PRESENTATION.speech.mobileIcon.readAloudName,
      size: CHAT_MESSAGE_ACTION_PRESENTATION.speech.mobileIcon.size,
      colorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.inactiveColorToken,
    })
    expect(getChatMessageSpeechMobileIconState(true)).toEqual({
      name: CHAT_MESSAGE_ACTION_PRESENTATION.speech.mobileIcon.stopReadingName,
      size: CHAT_MESSAGE_ACTION_PRESENTATION.speech.mobileIcon.size,
      colorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.activeColorToken,
    })
  })

  it('shares compact chat message action surface tokens', () => {
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.desktop.buttonClassName).toContain('hover:bg-muted/30')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.desktop.activeButtonClassName).toBe('animate-pulse')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.desktop.actionRowClassName).toBe('flex items-center gap-1 flex-shrink-0')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.desktop.turnDurationBadgeClassName).toContain('tabular-nums')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.desktop.turnDurationLiveClassName).toContain('text-amber-600')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.desktop.turnDurationIconClassName).toBe('h-2.5 w-2.5')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.desktop.generatingAudioIconClassName).toContain('animate-spin')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.desktop.playingAudioIconClassName).toBe('h-3 w-3 text-blue-500')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.desktop.branchIconClassName).toContain('hover:opacity-100')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.desktop.copiedIconClassName).toContain('text-green-500')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.desktop.copyIconClassName).toContain('hover:opacity-100')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.desktop.toggleIconClassName).toBe('h-3 w-3')
    expect(getChatMessageActionDesktopSurfaceState()).toBe(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.desktop)
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.row.flexDirection).toBe('row')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.row.alignItems).toBe('center')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.row.justifyContent).toBe('flex-end')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.row.gap).toBe('xs')
    expect(getChatMessageActionMobileRowState()).toEqual({
      flexDirection: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.row.flexDirection,
      alignItems: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.row.alignItems,
      justifyContent: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.row.justifyContent,
      marginTop: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.row.marginTop,
      gap: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.row.gap,
    })
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.accessibilityRole).toBe('button')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.borderRadius).toBe('lg')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.disabledOpacity).toBe(0.65)
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.alignSelf).toBe('flex-start')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.width).toBe(24)
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.inactiveBackgroundColorToken).toBe('mutedForeground')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.activeColorToken).toBe('primary')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.justifyContent).toBe('center')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.pressedOpacity).toBe(0.7)
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.hitSlop).toBe(10)
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.alignSelf).toBe('flex-start')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.hitSlop).toBe(10)
    expect(getChatMessageActionMobileButtonState()).toEqual({
      alignSelf: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.alignSelf,
      width: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.width,
      height: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.height,
      marginTop: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.marginTop,
      borderRadius: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.borderRadius,
      hitSlop: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.hitSlop,
      accessibilityRole: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.accessibilityRole,
      pressedOpacity: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.pressedOpacity,
      disabledOpacity: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.disabledOpacity,
      backgroundColorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.backgroundColorToken,
      backgroundAlpha: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.backgroundAlpha,
      colorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButtonText.colorToken,
      fontSize: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButtonText.fontSize,
      fontWeight: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButtonText.fontWeight,
      alignItems: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.alignItems,
      justifyContent: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.justifyContent,
      flexShrink: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.flexShrink,
    })
    expect(getChatMessageActionMobileButtonState('branch')).toEqual({
      alignSelf: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.alignSelf,
      width: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.width,
      height: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.height,
      marginTop: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.marginTop,
      borderRadius: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.borderRadius,
      hitSlop: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.hitSlop,
      accessibilityRole: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.accessibilityRole,
      pressedOpacity: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.pressedOpacity,
      disabledOpacity: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.disabledOpacity,
      backgroundColorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.branchBackgroundColorToken,
      backgroundAlpha: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.backgroundAlpha,
      colorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButtonText.branchColorToken,
      fontSize: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButtonText.fontSize,
      fontWeight: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButtonText.fontWeight,
      alignItems: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.alignItems,
      justifyContent: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.justifyContent,
      flexShrink: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.flexShrink,
    })
    expect(getChatMessageActionMobileButtonState('copied')).toEqual({
      alignSelf: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.alignSelf,
      width: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.width,
      height: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.height,
      marginTop: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.marginTop,
      borderRadius: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.borderRadius,
      hitSlop: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.hitSlop,
      accessibilityRole: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.accessibilityRole,
      pressedOpacity: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.pressedOpacity,
      disabledOpacity: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.disabledOpacity,
      backgroundColorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.copiedBackgroundColorToken,
      backgroundAlpha: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.backgroundAlpha,
      colorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButtonText.copiedColorToken,
      fontSize: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButtonText.fontSize,
      fontWeight: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButtonText.fontWeight,
      alignItems: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.alignItems,
      justifyContent: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.justifyContent,
      flexShrink: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.flexShrink,
    })
    expect(getChatMessageActionMobileButtonState('speech')).toEqual({
      alignSelf: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.alignSelf,
      width: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.width,
      height: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.height,
      marginTop: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.marginTop,
      borderRadius: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.borderRadius,
      hitSlop: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.hitSlop,
      accessibilityRole: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.accessibilityRole,
      pressedOpacity: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.pressedOpacity,
      disabledOpacity: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.disabledOpacity,
      backgroundColorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.inactiveBackgroundColorToken,
      backgroundAlpha: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.inactiveBackgroundAlpha,
      colorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.inactiveColorToken,
      fontSize: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.fontSize,
      alignItems: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.alignItems,
      justifyContent: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.justifyContent,
      flexShrink: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.flexShrink,
    })
    expect(getChatMessageActionMobileButtonState('speechActive')).toEqual({
      alignSelf: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.alignSelf,
      width: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.width,
      height: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.height,
      marginTop: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.marginTop,
      borderRadius: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.borderRadius,
      hitSlop: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.hitSlop,
      accessibilityRole: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.accessibilityRole,
      pressedOpacity: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.pressedOpacity,
      disabledOpacity: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.button.disabledOpacity,
      backgroundColorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.activeBackgroundColorToken,
      backgroundAlpha: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.activeBackgroundAlpha,
      colorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.activeColorToken,
      fontSize: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.fontSize,
      alignItems: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.alignItems,
      justifyContent: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.justifyContent,
      flexShrink: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.speechButton.flexShrink,
    })
    expect(CHAT_MESSAGE_ACTION_MOBILE_BUTTON_KIND_BY_SLOT).toEqual({
      speech: 'speech',
      branch: 'branch',
      copy: 'standard',
      expansion: 'standard',
    })
    expect(CHAT_MESSAGE_ACTION_MOBILE_ACTIVE_BUTTON_KIND_BY_SLOT).toEqual({
      copy: 'copied',
      speech: 'speechActive',
    })
    expect(getChatMessageActionMobileButtonKindForSlot('speech')).toBe('speech')
    expect(getChatMessageActionMobileButtonKindForSlot('branch')).toBe('branch')
    expect(getChatMessageActionMobileButtonKindForSlot('copy')).toBe('standard')
    expect(getChatMessageActionMobileButtonKindForSlot('expansion')).toBe('standard')
    expect(getChatMessageActionMobileActiveButtonKindForSlot('copy')).toBe('copied')
    expect(getChatMessageActionMobileActiveButtonKindForSlot('speech')).toBe('speechActive')
    expect(getChatMessageActionMobileButtonStateForSlot('speech')).toEqual(
      getChatMessageActionMobileButtonState('speech'),
    )
    expect(getChatMessageActionMobileButtonStateForSlot('branch')).toEqual(
      getChatMessageActionMobileButtonState('branch'),
    )
    expect(getChatMessageActionMobileButtonStateForSlot('copy')).toEqual(
      getChatMessageActionMobileButtonState(),
    )
    expect(getChatMessageActionMobileButtonStateForSlot('expansion')).toEqual(
      getChatMessageActionMobileButtonState(),
    )
    expect(getChatMessageActionMobileButtonStatesBySlot()).toEqual({
      speech: getChatMessageActionMobileButtonStateForSlot('speech'),
      branch: getChatMessageActionMobileButtonStateForSlot('branch'),
      copy: getChatMessageActionMobileButtonStateForSlot('copy'),
      expansion: getChatMessageActionMobileButtonStateForSlot('expansion'),
    })
    const actionButtonRenderStateColors = {
      mutedForeground: '#737373',
      primary: '#2563eb',
      success: '#22c55e',
      warning: '#f59e0b',
    }
    expect(getChatMessageActionMobileButtonColors('standard', actionButtonRenderStateColors)).toEqual({
      backgroundColor: 'rgba(115, 115, 115, 0.08)',
      color: '#737373',
    })
    expect(getChatMessageActionMobileButtonColors('branch', actionButtonRenderStateColors)).toEqual({
      backgroundColor: 'rgba(37, 99, 235, 0.08)',
      color: '#2563eb',
    })
    expect(getChatMessageActionMobileButtonColors('copied', actionButtonRenderStateColors)).toEqual({
      backgroundColor: 'rgba(34, 197, 94, 0.08)',
      color: '#22c55e',
    })
    expect(getChatMessageActionMobileButtonColors('speechActive', actionButtonRenderStateColors)).toEqual({
      backgroundColor: 'rgba(37, 99, 235, 0.15)',
      color: '#2563eb',
    })
    expect(getChatMessageActionMobileButtonRenderState({
      colors: actionButtonRenderStateColors,
    })).toEqual({
      button: getChatMessageActionMobileButtonState(),
      colors: getChatMessageActionMobileButtonColors('standard', actionButtonRenderStateColors),
    })
    expect(getChatMessageActionMobileButtonRenderState({
      kind: 'speechActive',
      colors: actionButtonRenderStateColors,
    })).toEqual({
      button: getChatMessageActionMobileButtonState('speechActive'),
      colors: getChatMessageActionMobileButtonColors('speechActive', actionButtonRenderStateColors),
    })
    expect(getChatMessageActionMobileStyleRenderState({
      colors: actionButtonRenderStateColors,
    })).toEqual({
      row: getChatMessageActionMobileRowState(),
      buttons: {
        standard: getChatMessageActionMobileButtonRenderState({
          colors: actionButtonRenderStateColors,
        }),
        branch: getChatMessageActionMobileButtonRenderState({
          kind: 'branch',
          colors: actionButtonRenderStateColors,
        }),
        copied: getChatMessageActionMobileButtonRenderState({
          kind: 'copied',
          colors: actionButtonRenderStateColors,
        }),
        speech: getChatMessageActionMobileButtonRenderState({
          kind: 'speech',
          colors: actionButtonRenderStateColors,
        }),
        speechActive: getChatMessageActionMobileButtonRenderState({
          kind: 'speechActive',
          colors: actionButtonRenderStateColors,
        }),
      },
      slotButtons: {
        speech: getChatMessageActionMobileButtonRenderState({
          kind: getChatMessageActionMobileButtonKindForSlot('speech'),
          colors: actionButtonRenderStateColors,
        }),
        branch: getChatMessageActionMobileButtonRenderState({
          kind: getChatMessageActionMobileButtonKindForSlot('branch'),
          colors: actionButtonRenderStateColors,
        }),
        copy: getChatMessageActionMobileButtonRenderState({
          kind: getChatMessageActionMobileButtonKindForSlot('copy'),
          colors: actionButtonRenderStateColors,
        }),
        expansion: getChatMessageActionMobileButtonRenderState({
          kind: getChatMessageActionMobileButtonKindForSlot('expansion'),
          colors: actionButtonRenderStateColors,
        }),
      },
      activeSlotButtons: {
        copy: getChatMessageActionMobileButtonRenderState({
          kind: getChatMessageActionMobileActiveButtonKindForSlot('copy'),
          colors: actionButtonRenderStateColors,
        }),
        speech: getChatMessageActionMobileButtonRenderState({
          kind: getChatMessageActionMobileActiveButtonKindForSlot('speech'),
          colors: actionButtonRenderStateColors,
        }),
      },
    })
    expect(getChatMessageActionMobileIconColors(getChatMessageCopyMobileIconState(true), {
      mutedForeground: '#737373',
      primary: '#2563eb',
      success: '#22c55e',
      warning: '#f59e0b',
    })).toEqual({
      color: '#22c55e',
    })
    expect(getChatMessageActionMobileIconColors(getChatMessageSpeechMobileIconState(false), {
      mutedForeground: '#737373',
      primary: '#2563eb',
      success: '#22c55e',
      warning: '#f59e0b',
    })).toEqual({
      color: '#737373',
    })
    const actionColors = {
      mutedForeground: '#737373',
      primary: '#2563eb',
      success: '#22c55e',
      warning: '#f59e0b',
    }
    expect(getChatMessageCopyMobileRenderState({
      role: 'assistant',
      content: 'Response',
      isAssistantComplete: true,
      isCopied: true,
      colors: actionColors,
    })).toEqual({
      canCopy: true,
      label: CHAT_MESSAGE_ACTION_PRESENTATION.copy.copiedLabel,
      accessibilityRole: 'button',
      accessibilityLabel: CHAT_MESSAGE_ACTION_PRESENTATION.copy.copiedLabel,
      icon: {
        name: CHAT_MESSAGE_ACTION_PRESENTATION.copy.mobileIcon.copiedName,
        size: CHAT_MESSAGE_ACTION_PRESENTATION.copy.mobileIcon.size,
        color: '#22c55e',
      },
    })
    expect(getChatMessageSpeechMobileRenderState({
      role: 'assistant',
      content: 'Response',
      ttsEnabled: true,
      isSpeaking: true,
      colors: actionColors,
    })).toEqual({
      canSpeak: true,
      label: CHAT_MESSAGE_ACTION_PRESENTATION.speech.stopReadingLabel,
      accessibilityRole: 'button',
      accessibilityLabel: CHAT_MESSAGE_ACTION_PRESENTATION.speech.stopReadingLabel,
      icon: {
        name: CHAT_MESSAGE_ACTION_PRESENTATION.speech.mobileIcon.stopReadingName,
        size: CHAT_MESSAGE_ACTION_PRESENTATION.speech.mobileIcon.size,
        color: '#2563eb',
      },
    })
    expect(getChatMessageExpansionMobileRenderState({
      shouldCollapse: true,
      isExpanded: false,
      colors: actionColors,
    })).toEqual({
      canToggle: true,
      label: CHAT_MESSAGE_ACTION_PRESENTATION.expansion.showMoreLabel,
      accessibilityRole: 'button',
      accessibilityLabel: 'Expand message',
      accessibilityHint: CHAT_MESSAGE_ACTION_PRESENTATION.expansion.expandMessageHint,
      accessibilityState: { expanded: false, disabled: false },
      ariaExpanded: false,
      isExpanded: false,
      icon: {
        name: CHAT_MESSAGE_ACTION_PRESENTATION.expansion.mobileIcon.collapsedName,
        size: CHAT_MESSAGE_ACTION_PRESENTATION.expansion.mobileIcon.size,
        color: '#737373',
      },
    })
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.backgroundColorToken).toBe('mutedForeground')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.branchBackgroundColorToken).toBe('primary')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.copiedBackgroundColorToken).toBe('success')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButton.flexShrink).toBe(0)
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButtonText.fontWeight).toBe('700')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButtonText.colorToken).toBe('mutedForeground')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.flexDirection).toBe('row')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.alignItems).toBe('center')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.justifyContent).toBe('center')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.numberOfLines).toBe(1)
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.minHeight).toBe(24)
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.fontFamilyByPlatform.ios).toBe('Menlo')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.fontWeight).toBe('700')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.backgroundColorToken).toBe('mutedForeground')
    expect(CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.liveColorToken).toBe('warning')
    expect(getChatMessageActionMobileTurnDurationBadgeState()).toEqual({
      numberOfLines: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.numberOfLines,
      alignSelf: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.alignSelf,
      flexDirection: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.flexDirection,
      minHeight: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.minHeight,
      marginTop: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.marginTop,
      paddingHorizontal: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.paddingHorizontal,
      borderRadius: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.borderRadius,
      backgroundColorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.backgroundColorToken,
      backgroundAlpha: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.backgroundAlpha,
      fontFamilyByPlatform: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.fontFamilyByPlatform,
      gap: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.gap,
      fontSize: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.fontSize,
      lineHeight: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.lineHeight,
      fontWeight: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.fontWeight,
      colorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.colorToken,
      opacity: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.opacity,
      alignItems: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.alignItems,
      justifyContent: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.justifyContent,
      flexShrink: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.flexShrink,
    })
    expect(getChatMessageActionMobileTurnDurationBadgeState({ isLive: true })).toEqual({
      numberOfLines: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.numberOfLines,
      alignSelf: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.alignSelf,
      flexDirection: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.flexDirection,
      minHeight: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.minHeight,
      marginTop: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.marginTop,
      paddingHorizontal: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.paddingHorizontal,
      borderRadius: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.borderRadius,
      backgroundColorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.liveBackgroundColorToken,
      backgroundAlpha: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.liveBackgroundAlpha,
      fontFamilyByPlatform: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.fontFamilyByPlatform,
      gap: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.gap,
      fontSize: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.fontSize,
      lineHeight: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.lineHeight,
      fontWeight: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.fontWeight,
      colorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.liveColorToken,
      opacity: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.liveOpacity,
      alignItems: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.alignItems,
      justifyContent: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.justifyContent,
      flexShrink: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.flexShrink,
    })
    expect(getChatMessageActionMobileTurnDurationBadgeColors({}, {
      mutedForeground: '#737373',
      primary: '#2563eb',
      success: '#22c55e',
      warning: '#f59e0b',
    })).toEqual({
      backgroundColor: 'rgba(115, 115, 115, 0.08)',
      color: '#737373',
    })
    expect(getChatMessageActionMobileTurnDurationBadgeColors({ isLive: true }, {
      mutedForeground: '#737373',
      primary: '#2563eb',
      success: '#22c55e',
      warning: '#f59e0b',
    })).toEqual({
      backgroundColor: 'rgba(245, 158, 11, 0.13)',
      color: '#f59e0b',
    })
  })

  it('shares compact chat message surface classes and mobile layout tokens', () => {
    expect(CHAT_MESSAGE_SURFACE_PRESENTATION.desktop.containerClassName).toContain('rounded-md')
    expect(CHAT_MESSAGE_SURFACE_PRESENTATION.desktop.contentRowClassName).toContain('px-2.5 py-1.5')
    expect(CHAT_MESSAGE_DISPLAY_PRESENTATION.collapsedPreviewLineCount).toBe(2)
    expect(CHAT_MESSAGE_SURFACE_PRESENTATION.desktop.collapsedMarkdownClassName).toBe('line-clamp-2')
    expect(CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.collapsedPreview.numberOfLines).toBe(
      CHAT_MESSAGE_DISPLAY_PRESENTATION.collapsedPreviewLineCount,
    )
    expect(getChatMessageDesktopSurfaceState()).toBe(CHAT_MESSAGE_SURFACE_PRESENTATION.desktop)
    expect(getChatMessageMobileCollapsedPreviewState()).toEqual({
      numberOfLines: CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.collapsedPreview.numberOfLines,
      accessibilityRole: CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.collapsedPreview.accessibilityRole,
      colorToken: CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.collapsedPreview.colorToken,
      fontSize: CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.collapsedPreview.fontSize,
      lineHeight: CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.collapsedPreview.lineHeight,
      flex: CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.collapsedPreview.flex,
      minWidth: CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.collapsedPreview.minWidth,
      pressedOpacity: CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.collapsedPreview.pressedOpacity,
      hitSlop: CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.collapsedPreview.hitSlop,
    })
    expect(getChatMessageMobileCollapsedPreviewColors({
      foreground: '#0f172a',
    })).toEqual({
      text: {
        color: '#0f172a',
      },
    })
    expect(getChatMessageMobileSurfaceState()).toEqual({
      paddingHorizontal: CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.paddingHorizontal,
      paddingVertical: CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.paddingVertical,
      marginBottom: CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.marginBottom,
      width: CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.width,
      borderWidth: CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.borderWidth,
      borderRadius: CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.borderRadius,
    })
    expect(getChatMessageMobileContentLayoutState()).toEqual({
      row: {
        flexDirection: CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.contentRow.flexDirection,
        alignItems: CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.contentRow.alignItems,
        gap: CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.contentRow.gap,
        width: CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.contentRow.width,
      },
      body: {
        flex: CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.contentBody.flex,
        minWidth: CHAT_MESSAGE_SURFACE_PRESENTATION.mobile.contentBody.minWidth,
      },
    })
    const mobileRenderColors = {
      foreground: '#0f172a',
      mutedForeground: '#64748b',
      primary: '#2563eb',
      info: '#3b82f6',
      success: '#22c55e',
      warning: '#f59e0b',
      border: '#f2f2f2',
      muted: '#f5f5f5',
    }
    const collapsedExpansion = getChatMessageExpansionMobileRenderState({
      shouldCollapse: true,
      isExpanded: false,
      colors: mobileRenderColors,
    })
    expect(getChatMessageMobileRenderState({
      role: 'assistant',
      isComplete: true,
      isLast: true,
      hasErrors: false,
      content: '# Title\nBody',
      isExpanded: false,
      shouldCollapse: true,
      colors: mobileRenderColors,
    })).toEqual({
      surface: getChatMessageMobileSurfaceState(),
      contentLayout: getChatMessageMobileContentLayoutState(),
      collapsedPreview: {
        ...getChatMessageMobileCollapsedPreviewState(),
        text: 'Title Body',
      },
      collapsedPreviewAction: getChatMessageCollapsedPreviewMobileActionState({
        expansion: collapsedExpansion,
      }),
      content: getChatMessageContentRenderState({
        content: '# Title\nBody',
        isExpanded: false,
        shouldCollapse: true,
      }),
      expansion: collapsedExpansion,
      tone: 'assistant_final',
      toneStyleSlot: 'assistantFinal',
      colors: {
        collapsedPreview: getChatMessageMobileCollapsedPreviewColors(mobileRenderColors),
        tones: {
          user: getChatMessageToneMobileColors('user', mobileRenderColors),
          assistant: getChatMessageToneMobileColors('assistant', mobileRenderColors),
          assistant_final: getChatMessageToneMobileColors('assistant_final', mobileRenderColors),
          tool: getChatMessageToneMobileColors('tool', mobileRenderColors),
        },
      },
    })
    expect(getChatMessageCollapsedPreviewMobileActionState({
      expansion: getChatMessageExpansionMobileRenderState({
        shouldCollapse: false,
        isExpanded: false,
        colors: mobileRenderColors,
      }),
    })).toEqual({
      canToggle: false,
      disabled: true,
      accessibilityLabel: CHAT_MESSAGE_ACTION_PRESENTATION.expansion.messageName,
      accessibilityHint: undefined,
      accessibilityState: {
        expanded: false,
        disabled: true,
      },
      ariaExpanded: false,
    })
    expect(CHAT_MESSAGE_SURFACE_PRESENTATION.mobile).toMatchObject({
      paddingHorizontal: 'sm',
      paddingVertical: 'xs',
      marginBottom: 'xs',
      width: '100%',
      borderWidth: 'hairline',
      borderRadius: 'md',
      contentRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 'xs',
        width: '100%',
      },
      contentBody: {
        flex: 1,
        minWidth: 0,
      },
      collapsedPreview: {
        numberOfLines: 2,
        accessibilityRole: 'button',
        fontSize: 13,
        lineHeight: 18,
        colorToken: 'foreground',
        flex: 1,
        minWidth: 0,
        pressedOpacity: 0.72,
        hitSlop: 6,
      },
    })
    expect(CHAT_MESSAGE_ACTION_PRESENTATION.expansion.expandedGlyph).toBe('▲')
    expect(CHAT_MESSAGE_ACTION_PRESENTATION.expansion.collapsedGlyph).toBe('▼')
    expect(CHAT_MESSAGE_ACTION_PRESENTATION.expansion.showMoreLabel).toBe('Show more')
    expect(CHAT_MESSAGE_ACTION_PRESENTATION.expansion.showLessLabel).toBe('Show less')
    expect(getChatMessageExpansionLabel(false)).toBe(CHAT_MESSAGE_ACTION_PRESENTATION.expansion.showMoreLabel)
    expect(getChatMessageExpansionLabel(true)).toBe(CHAT_MESSAGE_ACTION_PRESENTATION.expansion.showLessLabel)
    expect(CHAT_MESSAGE_ACTION_PRESENTATION.expansion.mobileIcon).toMatchObject({
      expandedName: 'chevron-up',
      collapsedName: 'chevron-down',
      size: 14,
    })
    expect(getChatMessageExpansionMobileIconState(false)).toEqual({
      name: CHAT_MESSAGE_ACTION_PRESENTATION.expansion.mobileIcon.collapsedName,
      size: CHAT_MESSAGE_ACTION_PRESENTATION.expansion.mobileIcon.size,
      colorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButtonText.colorToken,
    })
    expect(getChatMessageExpansionMobileIconState(true)).toEqual({
      name: CHAT_MESSAGE_ACTION_PRESENTATION.expansion.mobileIcon.expandedName,
      size: CHAT_MESSAGE_ACTION_PRESENTATION.expansion.mobileIcon.size,
      colorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.expansionButtonText.colorToken,
    })
  })

  it('shares desktop classes and mobile color semantics for message tones', () => {
    expect(getChatMessageToneDesktopClassName('assistant_final')).toBe(
      CHAT_MESSAGE_TONE_PRESENTATION.assistant_final.desktopClassName,
    )
    expect(getChatMessageToneDesktopClassName('tool')).toContain('amber')
    expect(getChatMessageToneMobileStyleSlot('user')).toBe('user')
    expect(getChatMessageToneMobileStyleSlot('assistant')).toBe('assistant')
    expect(getChatMessageToneMobileStyleSlot('assistant_final')).toBe('assistantFinal')
    expect(getChatMessageToneMobileStyleSlot('tool')).toBe('tool')

    const colors = {
      info: '#3b82f6',
      success: '#22c55e',
      warning: '#f59e0b',
      border: '#f2f2f2',
      muted: '#f5f5f5',
    }

    expect(getChatMessageToneMobileColors('user', colors)).toEqual({
      borderColor: 'rgba(59, 130, 246, 0.36)',
      backgroundColor: 'rgba(59, 130, 246, 0.08)',
    })
    expect(getChatMessageToneMobileColors('assistant', colors)).toEqual({
      borderColor: 'rgba(242, 242, 242, 0.7)',
      backgroundColor: 'rgba(245, 245, 245, 0.32)',
    })
  })
})

describe('normalizeMessagePreviewText', () => {
  it('normalizes whitespace in plain preview text', () => {
    expect(normalizeMessagePreviewText('  Hello\n\nworld  ')).toBe('Hello world')
  })

  it('prefers prose outside closed think tags', () => {
    expect(normalizeMessagePreviewText('<think>reasoning</think>\n\nFinal answer')).toBe('Final answer')
  })

  it('falls back to thought text for open or thought-only tags', () => {
    expect(normalizeMessagePreviewText('<think>still reasoning')).toBe('still reasoning')
    expect(normalizeMessagePreviewText('<think>only thought</think>')).toBe('only thought')
  })
})

describe('sanitizeAgentProgressUpdateForDisplay', () => {
  const baseUpdate: AgentProgressUpdate = {
    sessionId: 'test',
    currentIteration: 0,
    maxIterations: 1,
    steps: [],
    isComplete: false,
  }

  it('returns same reference when no sanitization needed', () => {
    const update: AgentProgressUpdate = {
      ...baseUpdate,
      conversationHistory: [{ role: 'user', content: 'hi' }],
    }
    const result = sanitizeAgentProgressUpdateForDisplay(update)
    expect(result).toBe(update)
  })

  it('returns new object with sanitized history', () => {
    const update: AgentProgressUpdate = {
      ...baseUpdate,
      conversationHistory: [
        { role: 'assistant', content: 'Here: ![pic](data:image/png;base64,x)' },
        { role: 'user', content: 'plain text' },
      ],
    }
    const result = sanitizeAgentProgressUpdateForDisplay(update)
    expect(result).not.toBe(update)
    expect(result.conversationHistory![0].content).toBe('Here: [Image: pic]')
    expect(result.conversationHistory![1].content).toBe('plain text')
    expect(result.sessionId).toBe('test')
  })

  it('sanitizes display-only history content', () => {
    const update: AgentProgressUpdate = {
      ...baseUpdate,
      conversationHistory: [
        {
          role: 'assistant',
          content: 'Stored answer',
          displayContent: '<think>reasoning</think>\n\n![pic](data:image/png;base64,x)',
        },
      ],
    }

    const result = sanitizeAgentProgressUpdateForDisplay(update)

    expect(result.conversationHistory![0].content).toBe('Stored answer')
    expect(result.conversationHistory![0].displayContent).toBe('<think>reasoning</think>\n\n[Image: pic]')
  })
})
