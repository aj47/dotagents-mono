import { describe, expect, it } from 'vitest';

import {
  AGENT_RESPONSE_HISTORY_PRESENTATION,
  AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION,
  appendAgentUserResponseEvent,
  clearAgentUserResponseEvents,
  createAgentResponseHistoryMobileStyleSlots,
  createAgentUserResponseStoreState,
  formatAgentResponseHistoryPreviewText,
  formatAgentResponseHistoryTimestamp,
  getAgentResponseHistoryMobileIconState,
  getAgentResponseHistoryMobileAnimationState,
  getAgentResponseHistoryMobileRenderState,
  getAgentResponseHistoryMobileSurfaceColors,
  getAgentResponseHistoryMobileSurfaceRenderState,
  getAgentResponseHistoryMobileSurfaceState,
  getAgentResponseHistoryNewestFadeDurationMs,
  getAgentResponseHistoryNewestInitialOpacity,
  getAgentResponseHistoryNewestTimestamp,
  getAgentResponseHistoryPanelState,
  getAgentResponseHistoryRenderItems,
  getAgentResponseHistorySpeechActionState,
  getAgentResponseHistorySpeechAccessibilityLabel,
  getAgentResponseHistoryTitle,
  getAgentResponseHistoryToggleAccessibilityLabel,
  getAgentResponseHistoryVisibleOpacity,
  getAgentUserResponseEventsForRun,
  getAgentUserResponseHistory,
  getAgentUserResponseText,
  getLatestAgentResponseHistoryEntry,
} from './agent-user-response-store';

describe('agent-user-response-store', () => {
  it('centralizes response history panel copy and mobile surface tokens', () => {
    expect(AGENT_RESPONSE_HISTORY_PRESENTATION.title).toBe('Agent Responses');
    expect(AGENT_RESPONSE_HISTORY_PRESENTATION.animation.newestFadeDurationMs).toBe(300);
    expect(AGENT_RESPONSE_HISTORY_PRESENTATION.animation.newestInitialOpacity).toBe(0);
    expect(AGENT_RESPONSE_HISTORY_PRESENTATION.animation.visibleOpacity).toBe(1);
    expect(getAgentResponseHistoryTitle()).toBe('Agent Responses');
    expect(getAgentResponseHistoryNewestFadeDurationMs()).toBe(300);
    expect(getAgentResponseHistoryNewestInitialOpacity()).toBe(0);
    expect(getAgentResponseHistoryVisibleOpacity()).toBe(1);
    expect(getAgentResponseHistoryMobileAnimationState()).toEqual({
      newestInitialOpacity: 0,
      visibleOpacity: 1,
      newestFadeDurationMs: 300,
    });
    expect(AGENT_RESPONSE_HISTORY_PRESENTATION.mobileIcon.headerName).toBe('chatbubbles-outline');
    expect(AGENT_RESPONSE_HISTORY_PRESENTATION.mobileIcon.expandName).toBe('chevron-down');
    expect(AGENT_RESPONSE_HISTORY_PRESENTATION.mobileIcon.collapseName).toBe('chevron-up');
    expect(AGENT_RESPONSE_HISTORY_PRESENTATION.mobileIcon.speakName).toBe('volume-medium');
    expect(AGENT_RESPONSE_HISTORY_PRESENTATION.mobileIcon.stopName).toBe('stop-circle');
    expect(getAgentResponseHistoryMobileIconState()).toBe(AGENT_RESPONSE_HISTORY_PRESENTATION.mobileIcon);
    expect(getAgentResponseHistoryMobileSurfaceState()).toBe(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile);
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.container.borderRadius).toBe('md');
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.container.backgroundColorToken).toBe('muted');
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.container.backgroundAlpha).toBe(0.19);
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.container.borderColorToken).toBe('border');
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.container.overflow).toBe('hidden');
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.header.accessibilityRole).toBe('button');
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.header.pressedOpacity).toBe(0.78);
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.header.flexDirection).toBe('row');
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.header.alignItems).toBe('center');
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.header.justifyContent).toBe('space-between');
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.header.leftFlexDirection).toBe('row');
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.header.leftAlignItems).toBe('center');
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.header.iconSize).toBe(16);
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.header.iconColorToken).toBe('mutedForeground');
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.header.titleColorToken).toBe('foreground');
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.header.backgroundAlpha).toBe(0.31);
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.badge.backgroundColorToken).toBe('primary');
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.badge.alignItems).toBe('center');
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.badge.justifyContent).toBe('center');
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.badge.textColorToken).toBe('primaryForeground');
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.list.maxHeight).toBe(300);
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.list.separatorColorToken).toBe('border');
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.item.headerFlexDirection).toBe('row');
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.item.headerAlignItems).toBe('center');
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.item.headerJustifyContent).toBe('space-between');
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.item.speakButtonAccessibilityRole).toBe('button');
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.item.speakButtonPressedOpacity).toBe(0.78);
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.item.activeSpeakIconColorToken).toBe('primary');
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.collapsedPreview.previewNumberOfLines).toBe(2);
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.collapsedPreview.backgroundAlpha).toBe(0.19);
    expect(AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.collapsedPreview.previewColorToken).toBe('foreground');
    const responseHistoryPalette = {
      border: '#d4d4d4',
      foreground: '#171717',
      muted: '#e5e5e5',
      mutedForeground: '#737373',
      primary: '#2563eb',
      primaryForeground: '#ffffff',
    };
    const responseHistorySurfaceColors = {
      container: {
        borderColor: '#d4d4d4',
        backgroundColor: 'rgba(229, 229, 229, 0.19)',
      },
      header: {
        borderBottomColor: '#d4d4d4',
        backgroundColor: 'rgba(229, 229, 229, 0.31)',
        iconColor: '#737373',
        toggleIconColor: '#737373',
        titleColor: '#171717',
      },
      badge: {
        backgroundColor: '#2563eb',
        textColor: '#ffffff',
      },
      list: {
        separatorColor: '#d4d4d4',
      },
      collapsedPreview: {
        backgroundColor: 'rgba(229, 229, 229, 0.19)',
        timestampColor: '#737373',
        previewColor: '#171717',
      },
      item: {
        timestampColor: '#737373',
        speakIconColor: '#737373',
        activeSpeakIconColor: '#2563eb',
      },
    };
    expect(getAgentResponseHistoryMobileSurfaceColors(responseHistoryPalette)).toEqual(responseHistorySurfaceColors);
    expect(getAgentResponseHistoryMobileSurfaceRenderState({
      colors: responseHistoryPalette,
    })).toEqual({
      surface: AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile,
      colors: responseHistorySurfaceColors,
    });
    const responseHistoryStyleSlots = createAgentResponseHistoryMobileStyleSlots({
      renderState: getAgentResponseHistoryMobileRenderState({
        responses: [{ text: 'Hello from the agent', timestamp: 1000 }],
        colors: responseHistoryPalette,
        isCollapsed: false,
      }),
      spacing: {
        sm: 8,
      },
      radius: {
        md: 8,
      },
    });
    expect(responseHistoryStyleSlots.container).toEqual({
      borderRadius: 8,
      borderWidth: AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.container.borderWidth,
      borderColor: '#d4d4d4',
      backgroundColor: 'rgba(229, 229, 229, 0.19)',
      overflow: AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.container.overflow,
      marginHorizontal: 8,
      marginBottom: 8,
    });
    expect(responseHistoryStyleSlots.header).toMatchObject({
      flexDirection: AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.header.flexDirection,
      alignItems: AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.header.alignItems,
      justifyContent: AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.header.justifyContent,
      borderBottomWidth: AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.header.expandedBorderBottomWidth,
      borderBottomColor: '#d4d4d4',
      backgroundColor: 'rgba(229, 229, 229, 0.31)',
    });
    expect(responseHistoryStyleSlots.badgeText).toEqual({
      fontSize: AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.badge.fontSize,
      fontWeight: AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.badge.fontWeight,
      color: '#ffffff',
    });
    expect(responseHistoryStyleSlots.separator).toEqual({
      height: AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.list.separatorHeight,
      backgroundColor: '#d4d4d4',
    });
    expect(responseHistoryStyleSlots.collapsedPreviewText).toEqual({
      fontSize: AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.collapsedPreview.previewFontSize,
      lineHeight: AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.collapsedPreview.previewLineHeight,
      color: '#171717',
    });
    expect(AGENT_RESPONSE_HISTORY_PRESENTATION.preview.maxLength).toBe(110);
    expect(getAgentResponseHistoryToggleAccessibilityLabel(true)).toBe('Show agent responses');
    expect(getAgentResponseHistoryToggleAccessibilityLabel(false)).toBe('Hide agent responses');
    expect(getAgentResponseHistorySpeechAccessibilityLabel(false)).toBe('Speak this response');
    expect(getAgentResponseHistorySpeechAccessibilityLabel(true)).toBe('Stop speaking');
    expect(getAgentResponseHistorySpeechActionState({
      isSpeaking: false,
      colors: responseHistorySurfaceColors.item,
    })).toEqual({
      accessibilityLabel: 'Speak this response',
      icon: {
        name: 'volume-medium',
        color: '#737373',
      },
    });
    expect(getAgentResponseHistorySpeechActionState({
      isSpeaking: true,
      colors: responseHistorySurfaceColors.item,
    })).toEqual({
      accessibilityLabel: 'Stop speaking',
      icon: {
        name: 'stop-circle',
        color: '#2563eb',
      },
    });
  });

  it('formats collapsed response history previews from the latest response', () => {
    const responses = [
      { text: 'Earlier response', timestamp: 1000 },
      {
        text: 'Latest response\n\n![chart](data:image/png;base64,abc)\n\n[clip](assets://conversation-video/conv/demo.mp4)',
        timestamp: 2000,
      },
    ];

    expect(getLatestAgentResponseHistoryEntry(responses)).toBe(responses[1]);
    expect(formatAgentResponseHistoryPreviewText(responses[1].text, 48)).toBe('Latest response [Image] [Video]');
    expect(formatAgentResponseHistoryPreviewText('x'.repeat(60), 12)).toBe('xxxxxxxxxxx…');
    expect(formatAgentResponseHistoryPreviewText('', 12)).toBe('Response with media');
    expect(formatAgentResponseHistoryTimestamp(0)).toMatch(/\d{1,2}:\d{2}:\d{2}/);
  });

  it('builds newest-first response history render items for mobile panels', () => {
    const responses = [
      { id: 'first', text: 'Earlier response', timestamp: 1000 },
      { id: 'second', text: 'Latest response', timestamp: 2000 },
    ];

    expect(getAgentResponseHistoryNewestTimestamp([])).toBeNull();
    expect(getAgentResponseHistoryNewestTimestamp(responses)).toBe(2000);
    expect(getAgentResponseHistoryRenderItems(responses, { animateNewest: true })).toEqual([
      {
        entry: responses[1],
        originalIndex: 1,
        displayIndex: 0,
        key: 'second',
        isNewest: true,
        shouldRenderSeparator: false,
        timestampLabel: expect.stringMatching(/\d{1,2}:\d{2}:\d{2}/),
      },
      {
        entry: responses[0],
        originalIndex: 0,
        displayIndex: 1,
        key: 'first',
        isNewest: false,
        shouldRenderSeparator: true,
        timestampLabel: expect.stringMatching(/\d{1,2}:\d{2}:\d{2}/),
      },
    ]);
    expect(getAgentResponseHistoryRenderItems([{ text: 'No id', timestamp: 3000 }])).toMatchObject([
      {
        originalIndex: 0,
        displayIndex: 0,
        key: '3000-0',
        isNewest: false,
        shouldRenderSeparator: false,
        timestampLabel: expect.stringMatching(/\d{1,2}:\d{2}:\d{2}/),
      },
    ]);
  });

  it('builds collapsed and expanded response history panel state from shared presentation', () => {
    const responses = [
      { id: 'first', text: 'Earlier response', timestamp: 1000 },
      {
        id: 'second',
        text: 'Latest response\n\n![chart](data:image/png;base64,abc)',
        timestamp: 2000,
      },
    ];

    expect(getAgentResponseHistoryPanelState(responses, {
      isCollapsed: true,
      animateNewest: true,
    })).toMatchObject({
      title: 'Agent Responses',
      responseCount: 2,
      countLabel: '2',
      isExpanded: false,
      toggleAccessibilityLabel: 'Show agent responses',
      toggleAccessibilityState: { expanded: false },
      toggleIconName: 'chevron-down',
      headerBorderBottomWidth: 0,
      latestResponse: responses[1],
      collapsedPreview: {
        shouldRender: true,
        timestampLabel: expect.stringMatching(/\d{1,2}:\d{2}:\d{2}/),
        text: 'Latest response [Image]',
      },
      items: [
        expect.objectContaining({
          entry: responses[1],
          originalIndex: 1,
          displayIndex: 0,
          key: 'second',
          isNewest: true,
        }),
        expect.objectContaining({
          entry: responses[0],
          originalIndex: 0,
          displayIndex: 1,
          key: 'first',
          isNewest: false,
        }),
      ],
    });
    expect(getAgentResponseHistoryPanelState(responses, { isCollapsed: false })).toMatchObject({
      isExpanded: true,
      toggleAccessibilityLabel: 'Hide agent responses',
      toggleAccessibilityState: { expanded: true },
      toggleIconName: 'chevron-up',
      headerBorderBottomWidth: 1,
      collapsedPreview: {
        shouldRender: false,
      },
    });
    expect(getAgentResponseHistoryMobileRenderState({
      responses,
      colors: {
        border: '#d4d4d4',
        foreground: '#171717',
        muted: '#e5e5e5',
        mutedForeground: '#737373',
        primary: '#2563eb',
        primaryForeground: '#ffffff',
      },
      isCollapsed: true,
      animateNewest: true,
      speakingIndex: 1,
    })).toMatchObject({
      shouldRender: true,
      shouldRenderList: false,
      panel: {
        title: 'Agent Responses',
        isExpanded: false,
        toggleIconName: 'chevron-down',
        items: expect.arrayContaining([
          expect.objectContaining({
            entry: responses[1],
            isNewest: true,
          }),
        ]),
      },
      items: [
        expect.objectContaining({
          entry: responses[1],
          originalIndex: 1,
          isNewest: true,
          speechActionState: {
            accessibilityLabel: 'Stop speaking',
            icon: {
              name: 'stop-circle',
              color: '#2563eb',
            },
          },
        }),
        expect.objectContaining({
          entry: responses[0],
          originalIndex: 0,
          speechActionState: {
            accessibilityLabel: 'Speak this response',
            icon: {
              name: 'volume-medium',
              color: '#737373',
            },
          },
        }),
      ],
      surface: AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile,
      colors: {
        container: {
          borderColor: '#d4d4d4',
          backgroundColor: 'rgba(229, 229, 229, 0.19)',
        },
      },
      icons: AGENT_RESPONSE_HISTORY_PRESENTATION.mobileIcon,
      animation: {
        newestInitialOpacity: 0,
        visibleOpacity: 1,
        newestFadeDurationMs: 300,
      },
    });
    expect(getAgentResponseHistoryMobileRenderState({
      responses,
      colors: {
        border: '#d4d4d4',
        foreground: '#171717',
        muted: '#e5e5e5',
        mutedForeground: '#737373',
        primary: '#2563eb',
        primaryForeground: '#ffffff',
      },
      isCollapsed: false,
    })).toMatchObject({
      shouldRender: true,
      shouldRenderList: true,
      panel: {
        isExpanded: true,
      },
    });
    expect(getAgentResponseHistoryMobileRenderState({
      responses: [],
      colors: {
        border: '#d4d4d4',
        foreground: '#171717',
        muted: '#e5e5e5',
        mutedForeground: '#737373',
        primary: '#2563eb',
        primaryForeground: '#ffffff',
      },
      isCollapsed: false,
    })).toMatchObject({
      shouldRender: false,
      shouldRenderList: false,
      items: [],
      panel: {
        responseCount: 0,
        isExpanded: true,
      },
    });
  });

  it('preserves duplicate response text as distinct ordered events for one run', () => {
    const store = createAgentUserResponseStoreState();
    const first = appendAgentUserResponseEvent(store, {
      sessionId: 'session-1',
      runId: 7,
      text: 'Same response',
      timestamp: 1000,
    });
    const second = appendAgentUserResponseEvent(store, {
      sessionId: 'session-1',
      runId: 7,
      text: 'Same response',
      timestamp: 2000,
    });

    expect(second).not.toEqual(first);
    expect(getAgentUserResponseEventsForRun(store, 'session-1', 7).map((event) => ({
      text: event.text,
      ordinal: event.ordinal,
    }))).toEqual([
      { text: 'Same response', ordinal: 1 },
      { text: 'Same response', ordinal: 2 },
    ]);
  });

  it('tracks ordinals independently per session and run', () => {
    const store = createAgentUserResponseStoreState();
    appendAgentUserResponseEvent(store, { sessionId: 'session-1', runId: 1, text: 'Run one', timestamp: 1000 });
    appendAgentUserResponseEvent(store, { sessionId: 'session-1', runId: 2, text: 'Run two', timestamp: 1001 });
    appendAgentUserResponseEvent(store, { sessionId: 'session-2', runId: 1, text: 'Other session', timestamp: 1002 });
    appendAgentUserResponseEvent(store, { sessionId: 'session-1', runId: 1, text: 'Run one again', timestamp: 1003 });

    expect(getAgentUserResponseEventsForRun(store, 'session-1', 1).map((event) => event.ordinal)).toEqual([1, 2]);
    expect(getAgentUserResponseEventsForRun(store, 'session-1', 2).map((event) => event.ordinal)).toEqual([1]);
    expect(getAgentUserResponseEventsForRun(store, 'session-2', 1).map((event) => event.ordinal)).toEqual([1]);
  });

  it('returns latest response text and prior response history for a run', () => {
    const store = createAgentUserResponseStoreState();
    appendAgentUserResponseEvent(store, { sessionId: 'session-1', runId: 3, text: 'First', timestamp: 1000 });
    appendAgentUserResponseEvent(store, { sessionId: 'session-1', runId: 3, text: 'Second', timestamp: 1001 });
    appendAgentUserResponseEvent(store, { sessionId: 'session-1', runId: 3, text: 'Final', timestamp: 1002 });

    expect(getAgentUserResponseText(store, 'session-1', 3)).toBe('Final');
    expect(getAgentUserResponseHistory(store, 'session-1', 3)).toEqual(['First', 'Second']);
  });

  it('clears one session without disturbing another session', () => {
    const store = createAgentUserResponseStoreState();
    appendAgentUserResponseEvent(store, { sessionId: 'session-1', runId: 1, text: 'Cleared', timestamp: 1000 });
    appendAgentUserResponseEvent(store, { sessionId: 'session-2', runId: 1, text: 'Kept', timestamp: 1001 });

    expect(clearAgentUserResponseEvents(store, 'session-1')).toBe(1);
    expect(getAgentUserResponseEventsForRun(store, 'session-1', 1)).toEqual([]);
    expect(getAgentUserResponseText(store, 'session-2', 1)).toBe('Kept');

    appendAgentUserResponseEvent(store, { sessionId: 'session-1', runId: 1, text: 'Reset ordinal', timestamp: 1002 });
    expect(getAgentUserResponseEventsForRun(store, 'session-1', 1).map((event) => event.ordinal)).toEqual([1]);
  });
});
