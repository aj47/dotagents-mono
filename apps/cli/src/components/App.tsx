import { useKeyboard, useTerminalDimensions } from '@opentui/react';
import { useState, useCallback } from 'react';
import { ChatView } from './ChatView';
import { ConversationListView } from './ConversationListView';
import { SettingsPanel } from './SettingsPanel';
import { useChat } from '../hooks/useChat';
import { useConversationManager } from '../hooks/useConversationManager';
import { useMcpService } from '../hooks/useMcpService';
import { useSettings } from '../hooks/useSettings';
import { parseInput, getHelpText } from '../utils/command-parser';
import type { ChatMessage } from '../types/chat';

/**
 * Root App component for the DotAgents CLI.
 *
 * Renders the main TUI frame with a header, the chat interface,
 * and a status bar at the bottom. Integrates conversation management
 * commands (/new, /list, /switch) with the chat interface.
 *
 * Initializes MCP servers at startup and provides tools to the chat hook.
 */
export function App() {
  const { width } = useTerminalDimensions();
  const [exiting, setExiting] = useState(false);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);

  // Initialize MCP service — loads servers from .agents config
  const mcp = useMcpService();

  // Settings panel state
  const settings = useSettings();

  const conversationManager = useConversationManager();
  const {
    messages,
    status,
    error,
    pendingApproval,
    sendMessage,
    setMessages,
    approveToolCall,
    denyToolCall,
    cancelStreaming,
  } = useChat({
    onMessageSaved: conversationManager.saveMessage,
    tools: mcp.tools,
  });

  /**
   * Handle user input: either a slash command or a chat message.
   */
  const handleInput = useCallback(
    async (input: string) => {
      const parsed = parseInput(input);

      if (parsed.type === 'message') {
        // Dismiss conversation list if showing
        conversationManager.dismissConversationList();
        setSystemMessage(null);
        sendMessage(parsed.content);
        return;
      }

      // Handle commands
      switch (parsed.name) {
        case 'new': {
          await conversationManager.createNewConversation();
          setMessages([]);
          setSystemMessage('✓ New conversation started.');
          break;
        }

        case 'list':
        case 'conversations': {
          await conversationManager.listConversations();
          setSystemMessage(null);
          break;
        }

        case 'switch': {
          if (parsed.args.length === 0) {
            setSystemMessage('⚠ Usage: /switch <id> or /switch <number>');
            break;
          }
          try {
            const loadedMessages = await conversationManager.switchConversation(
              parsed.args[0],
            );
            setMessages(loadedMessages);
            setSystemMessage(
              `✓ Switched to conversation: ${conversationManager.currentConversationTitle ?? conversationManager.currentConversationId}`,
            );
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to switch conversation';
            setSystemMessage(`⚠ ${errMsg}`);
          }
          break;
        }

        case 'settings': {
          conversationManager.dismissConversationList();
          setSystemMessage(null);
          settings.open();
          break;
        }

        case 'help': {
          setSystemMessage(getHelpText());
          conversationManager.dismissConversationList();
          break;
        }

        case 'quit': {
          setExiting(true);
          setTimeout(() => process.exit(0), 100);
          break;
        }
      }
    },
    [sendMessage, setMessages, conversationManager, settings],
  );

  useKeyboard((key) => {
    if (key.ctrl && key.name === 'c') {
      // If currently streaming, cancel the stream first
      if (status === 'streaming' || status === 'awaiting_approval') {
        cancelStreaming();
        return;
      }
      // Otherwise, exit
      setExiting(true);
      // Allow a brief moment for cleanup then exit
      setTimeout(() => process.exit(0), 100);
    }
  });

  if (exiting) {
    return (
      <box flexDirection="column" width={width}>
        <text fg="#999">Exiting DotAgents CLI...</text>
      </box>
    );
  }

  // Build title with current conversation info
  const titleSuffix = conversationManager.currentConversationTitle
    ? ` — ${conversationManager.currentConversationTitle}`
    : ' — Your AI team, one command away';

  // Build MCP status indicator
  const mcpStatusText =
    mcp.status === 'initializing'
      ? ' ⠋ Loading MCP servers...'
      : mcp.status === 'ready' && mcp.tools.length > 0
        ? ` [${mcp.tools.length} tools]`
        : '';

  return (
    <box flexDirection="column" width={width} flexGrow={1}>
      {/* Header */}
      <box
        border
        borderStyle="single"
        borderColor="#7aa2f7"
        paddingX={1}
        width="100%"
      >
        <text fg="#7aa2f7">
          <strong>DotAgents CLI</strong>
        </text>
        <text fg="#666">{titleSuffix}</text>
        <text fg="#565f89">{mcpStatusText}</text>
      </box>

      {/* MCP warnings */}
      {mcp.warnings.length > 0 && (
        <box width="100%" paddingX={1}>
          {mcp.warnings.map((w, i) => (
            <text key={`mcp-warn-${i}`} fg="#e0af68">⚠ MCP: {w}</text>
          ))}
        </box>
      )}

      {/* System message (command feedback) */}
      {systemMessage && (
        <box width="100%" paddingX={1}>
          <text fg="#9ece6a">{systemMessage}</text>
        </box>
      )}

      {/* Conversation list overlay */}
      {conversationManager.showingConversationList && !settings.isOpen && (
        <ConversationListView
          conversations={conversationManager.conversations}
          currentConversationId={conversationManager.currentConversationId}
        />
      )}

      {/* Settings panel overlay */}
      {settings.isOpen && (
        <SettingsPanel
          activeCategory={settings.activeCategory}
          onCategoryChange={settings.setActiveCategory}
          onNextCategory={settings.nextCategory}
          onPrevCategory={settings.prevCategory}
          onClose={settings.close}
          presets={settings.presets}
          onSetApiKey={settings.setProviderApiKey}
          onClearApiKey={settings.clearProviderApiKey}
          currentPresetId={settings.currentPresetId}
          onSelectPreset={settings.selectPreset}
          ttsConfig={settings.ttsConfig}
          onUpdateTts={settings.updateTtsConfig}
          sttConfig={settings.sttConfig}
          onUpdateStt={settings.updateSttConfig}
          systemPrompt={settings.systemPrompt}
          onSetSystemPrompt={settings.setSystemPrompt}
        />
      )}

      {/* Chat interface (hidden when settings are open) */}
      {!settings.isOpen && (
        <ChatView
          messages={messages}
          status={status}
          error={error}
          pendingApproval={pendingApproval}
          onSendMessage={handleInput}
          onApprove={approveToolCall}
          onDeny={denyToolCall}
        />
      )}

      {/* Status bar */}
      <box width="100%" paddingX={1}>
        <text fg="#565f89">
          {settings.isOpen
            ? 'Settings • Escape to close • Tab/←/→ to switch categories'
            : (
              <>
                {conversationManager.currentConversationId
                  ? `[${conversationManager.currentConversationId}] `
                  : ''}
                {status === 'streaming'
                  ? 'Ctrl+C to cancel • '
                  : ''}
                Press Ctrl+C or /quit to exit • /help for commands
              </>
            )}
        </text>
      </box>
    </box>
  );
}
