import { describe, expect, it } from 'vitest';
import { INTERNAL_COMPLETION_NUDGE_TEXT } from './mcp-api';
import {
  collectRecentRealUserRequestIndices,
  EMPTY_RESPONSE_FINAL_CONTENT,
  EMPTY_RESPONSE_RETRY_PROMPT,
  EMPTY_RESPONSE_TRUNCATED_RETRY_PROMPT,
  filterEphemeralMessages,
  getEmptyResponseRetryPrompt,
  hasMappedToolResultPrefix,
  hasTruncatedContentInRecentMessages,
  isGeneratedContextSummaryContent,
  isInternalNudgeContent,
  isRealUserRequestContent,
  type ConversationHistoryFilterMessage,
} from './conversation-history-utils';

describe('conversation-history-utils', () => {
  describe('isInternalNudgeContent', () => {
    it('detects garbled tool-call recovery nudges', () => {
      expect(
        isInternalNudgeContent(
          'Your previous response contained text like "[Calling tools: ...]" instead of an actual tool call. Do NOT write tool call names as text.',
        ),
      ).toBe(true);
    });

    it('detects selector-aware garbled tool-call recovery nudges', () => {
      expect(
        isInternalNudgeContent(
          'Your previous response contained text like "[Calling tools: ...]" instead of an actual tool call. Do NOT write tool call names as text. Instead, invoke tools using the structured function-calling interface. The latest successful step already identified @e56; use it in the next tool call if it is still the correct selector. If you cannot call tools, provide your final answer directly.',
        ),
      ).toBe(true);
    });

    it('detects intent-only tool-usage nudges', () => {
      expect(
        isInternalNudgeContent(
          'Your previous response only described the next step instead of actually doing it. Do NOT narrate intended actions like "Let me..." or "I\'ll...". Invoke the next tool call now using the structured function-calling interface.',
        ),
      ).toBe(true);
    });

    it('detects selector-aware intent-only tool-usage nudges', () => {
      expect(
        isInternalNudgeContent(
          'Your previous response only described the next step instead of actually doing it. Do NOT narrate intended actions like "Let me..." or "I\'ll...". Invoke the next tool call now using the structured function-calling interface. You already identified @e45; use it in the tool call if it is the correct selector.',
        ),
      ).toBe(true);
    });

    it('detects verification nudges', () => {
      expect(
        isInternalNudgeContent(
          'Reason: Completion criteria not met.\nMissing items:\n- add the next checklist item\nContinue only the current unresolved request described above. Do not resume older/background tasks unless they are explicitly required to satisfy these missing items.',
        ),
      ).toBe(true);
    });

    it('keeps detecting legacy verification nudges', () => {
      expect(
        isInternalNudgeContent(
          'Reason: Completion criteria not met.\nMissing items:\n- add the next checklist item\nContinue and finish remaining work.',
        ),
      ).toBe(true);
    });

    it('detects the canonical completion nudge by exact match', () => {
      expect(isInternalNudgeContent(INTERNAL_COMPLETION_NUDGE_TEXT)).toBe(true);
    });

    it('does not classify normal user messages as internal nudges', () => {
      expect(isInternalNudgeContent('continue with my tax prep')).toBe(false);
    });
  });

  describe('real user request detection', () => {
    it('distinguishes real requests from tool results, summaries, and internal nudges', () => {
      expect(isRealUserRequestContent('can you open in excalidraw in chrome')).toBe(true);
      expect(isRealUserRequestContent('[execute_command] output')).toBe(false);
      expect(isRealUserRequestContent('TOOL FAILED: execute_command (attempt 1/3)')).toBe(false);
      expect(isRealUserRequestContent('[Archived Background Summary - not the current task]\nold work')).toBe(false);
      expect(isRealUserRequestContent('Reason: incomplete\nMissing items:\n- x\nContinue only the current unresolved request described above.')).toBe(false);
    });

    it('collects the latest real user anchors while skipping tool-like user messages', () => {
      const history = [
        { role: 'user', content: 'old unrelated task' },
        { role: 'user', content: '[execute_command] noisy output' },
        { role: 'assistant', content: 'done' },
        { role: 'user', content: 'open the map in chrome' },
        { role: 'user', content: 'TOOL FAILED: browser_drop' },
        { role: 'user', content: 'can you open in excalidraw in chrome' },
      ];

      expect(collectRecentRealUserRequestIndices(history, 2)).toEqual([3, 5]);
    });

    it('recognizes shared tool and summary markers', () => {
      expect(hasMappedToolResultPrefix('[playwright-extension:browser_snapshot] result')).toBe(true);
      expect(isGeneratedContextSummaryContent('[Session Progress Summary]\nsummary')).toBe(true);
    });
  });

  describe('empty response retry prompts', () => {
    it('exports the repeated-empty-response final content', () => {
      expect(EMPTY_RESPONSE_FINAL_CONTENT).toBe(
        "I encountered repeated empty responses and couldn't complete the task. Please try again.",
      );
    });

    it('uses the default retry prompt when recent context is not truncated', () => {
      expect(getEmptyResponseRetryPrompt([{ role: 'assistant', content: 'No truncation here' }])).toBe(
        EMPTY_RESPONSE_RETRY_PROMPT,
      );
    });

    it('uses the truncated retry prompt when recent context contains truncation markers', () => {
      const messages = [
        { role: 'user', content: 'Earlier normal message' },
        { role: 'tool', content: '[Truncated large output]' },
      ];

      expect(hasTruncatedContentInRecentMessages(messages)).toBe(true);
      expect(getEmptyResponseRetryPrompt(messages)).toBe(EMPTY_RESPONSE_TRUNCATED_RETRY_PROMPT);
    });

    it('ignores truncation markers outside the recent-message window', () => {
      const messages = [
        { role: 'tool', content: '[Truncated old output]' },
        { role: 'assistant', content: 'one' },
        { role: 'assistant', content: 'two' },
        { role: 'assistant', content: 'three' },
      ];

      expect(hasTruncatedContentInRecentMessages(messages)).toBe(false);
      expect(getEmptyResponseRetryPrompt(messages)).toBe(EMPTY_RESPONSE_RETRY_PROMPT);
    });
  });

  describe('filterEphemeralMessages', () => {
    it('removes ephemeral messages from history', () => {
      const history: ConversationHistoryFilterMessage[] = [
        { role: 'user', content: 'Hello', timestamp: 1000 },
        { role: 'assistant', content: 'Hi there', timestamp: 2000 },
        { role: 'user', content: 'Internal nudge', timestamp: 3000, ephemeral: true },
      ];

      const filtered = filterEphemeralMessages(history);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].content).toBe('Hello');
      expect(filtered[1].content).toBe('Hi there');
    });

    it('strips ephemeral field from returned messages', () => {
      const history: ConversationHistoryFilterMessage[] = [
        { role: 'user', content: 'Test', timestamp: 1000, ephemeral: false },
      ];

      const filtered = filterEphemeralMessages(history);

      expect(filtered).toHaveLength(1);
      expect('ephemeral' in filtered[0]).toBe(false);
    });

    it('preserves all non-ephemeral messages', () => {
      const history: ConversationHistoryFilterMessage[] = [
        { role: 'user', content: 'Message 1', timestamp: 1000 },
        { role: 'assistant', content: 'Response 1', timestamp: 2000 },
        { role: 'tool', content: 'Tool result', timestamp: 3000 },
      ];

      const filtered = filterEphemeralMessages(history);

      expect(filtered).toHaveLength(3);
      expect(filtered.map((m) => m.content)).toEqual([
        'Message 1',
        'Response 1',
        'Tool result',
      ]);
    });

    it('preserves toolCalls and toolResults', () => {
      const history: ConversationHistoryFilterMessage[] = [
        {
          role: 'assistant',
          content: 'Calling tool',
          timestamp: 1000,
          toolCalls: [{ name: 'test_tool', arguments: { arg: 'value' } }],
        },
        {
          role: 'tool',
          content: 'Tool output',
          timestamp: 2000,
          toolResults: [{ success: true, content: 'Result' }],
        },
      ];

      const filtered = filterEphemeralMessages(history);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].toolCalls).toEqual([{ name: 'test_tool', arguments: { arg: 'value' } }]);
      expect(filtered[1].toolResults).toEqual([{ success: true, content: 'Result' }]);
    });

    it('handles empty history', () => {
      expect(filterEphemeralMessages([])).toEqual([]);
    });

    it('handles history with only ephemeral messages', () => {
      const history: ConversationHistoryFilterMessage[] = [
        { role: 'user', content: 'Ephemeral 1', timestamp: 1000, ephemeral: true },
        { role: 'user', content: 'Ephemeral 2', timestamp: 2000, ephemeral: true },
      ];

      expect(filterEphemeralMessages(history)).toHaveLength(0);
    });

    it('handles mixed ephemeral and non-ephemeral messages', () => {
      const history: ConversationHistoryFilterMessage[] = [
        { role: 'user', content: 'Real message 1', timestamp: 1000 },
        { role: 'user', content: 'Ephemeral nudge', timestamp: 2000, ephemeral: true },
        { role: 'assistant', content: 'Response', timestamp: 3000 },
        { role: 'user', content: 'Another ephemeral', timestamp: 4000, ephemeral: true },
        { role: 'user', content: 'Real message 2', timestamp: 5000 },
      ];

      const filtered = filterEphemeralMessages(history);

      expect(filtered).toHaveLength(3);
      expect(filtered.map((m) => m.content)).toEqual([
        'Real message 1',
        'Response',
        'Real message 2',
      ]);
    });

    it('preserves message order', () => {
      const history: ConversationHistoryFilterMessage[] = [
        { role: 'user', content: 'First', timestamp: 1000 },
        { role: 'user', content: 'Ephemeral', timestamp: 2000, ephemeral: true },
        { role: 'user', content: 'Second', timestamp: 3000 },
        { role: 'user', content: 'Another ephemeral', timestamp: 4000, ephemeral: true },
        { role: 'user', content: 'Third', timestamp: 5000 },
      ];

      expect(filterEphemeralMessages(history).map((m) => m.content)).toEqual(['First', 'Second', 'Third']);
    });

    it('handles messages with undefined ephemeral field', () => {
      const history: ConversationHistoryFilterMessage[] = [
        { role: 'user', content: 'Message without ephemeral field', timestamp: 1000 },
        { role: 'user', content: 'Message with ephemeral false', timestamp: 2000, ephemeral: false },
      ];

      expect(filterEphemeralMessages(history)).toHaveLength(2);
    });

    it('handles complex toolResults structures', () => {
      const history: ConversationHistoryFilterMessage[] = [
        {
          role: 'tool',
          content: 'Complex result',
          timestamp: 1000,
          toolResults: [
            {
              success: true,
              content: [{ type: 'text', text: 'Result text' }],
            },
          ],
        },
      ];

      expect(filterEphemeralMessages(history)[0].toolResults).toEqual([
        {
          success: true,
          content: [{ type: 'text', text: 'Result text' }],
        },
      ]);
    });
  });

  describe('integration scenarios', () => {
    it('handles internal completion nudge scenario', () => {
      const history: ConversationHistoryFilterMessage[] = [
        { role: 'user', content: 'Please complete this task', timestamp: 1000 },
        { role: 'assistant', content: 'I will help with that', timestamp: 2000 },
        {
          role: 'user',
          content:
            'If all requested work is complete, use respond_to_user to tell the user the result, then call mark_work_complete with a concise summary. Otherwise continue working and call more tools.',
          timestamp: 3000,
          ephemeral: true,
        },
      ];

      const filtered = filterEphemeralMessages(history);

      expect(filtered).toHaveLength(2);
      expect(filtered.every((m) => !('ephemeral' in m))).toBe(true);
    });

    it('handles multiple ephemeral nudges in sequence', () => {
      const history: ConversationHistoryFilterMessage[] = [
        { role: 'user', content: 'Task 1', timestamp: 1000 },
        { role: 'user', content: 'Nudge 1', timestamp: 2000, ephemeral: true },
        { role: 'assistant', content: 'Working on it', timestamp: 3000 },
        { role: 'user', content: 'Nudge 2', timestamp: 4000, ephemeral: true },
        { role: 'assistant', content: 'Done', timestamp: 5000 },
      ];

      const filtered = filterEphemeralMessages(history);

      expect(filtered).toHaveLength(3);
      expect(filtered.map((m) => m.content)).toEqual([
        'Task 1',
        'Working on it',
        'Done',
      ]);
    });

    it('preserves all metadata except ephemeral flag', () => {
      const history: ConversationHistoryFilterMessage[] = [
        {
          role: 'assistant',
          content: 'Response with metadata',
          timestamp: 1000,
          toolCalls: [{ name: 'tool1', arguments: { key: 'value' } }],
          toolResults: [{ success: true, content: 'Success' }],
          ephemeral: false,
        },
      ];

      const filtered = filterEphemeralMessages(history);

      expect(filtered).toHaveLength(1);
      const msg = filtered[0];
      expect(msg.role).toBe('assistant');
      expect(msg.content).toBe('Response with metadata');
      expect(msg.timestamp).toBe(1000);
      expect(msg.toolCalls).toBeDefined();
      expect(msg.toolResults).toBeDefined();
      expect('ephemeral' in msg).toBe(false);
    });
  });
});
