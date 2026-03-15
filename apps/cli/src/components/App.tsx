import { useKeyboard, useTerminalDimensions } from '@opentui/react';
import { useState } from 'react';
import { ChatView } from './ChatView';
import { useChat } from '../hooks/useChat';

/**
 * Root App component for the DotAgents CLI.
 *
 * Renders the main TUI frame with a header, the chat interface,
 * and a status bar at the bottom.
 */
export function App() {
  const { width } = useTerminalDimensions();
  const [exiting, setExiting] = useState(false);
  const { messages, status, error, sendMessage } = useChat();

  useKeyboard((key) => {
    if (key.ctrl && key.name === 'c') {
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
        <text fg="#666"> — Your AI team, one command away</text>
      </box>

      {/* Chat interface */}
      <ChatView
        messages={messages}
        status={status}
        error={error}
        onSendMessage={sendMessage}
      />

      {/* Status bar */}
      <box width="100%" paddingX={1}>
        <text fg="#565f89">Press Ctrl+C to exit</text>
      </box>
    </box>
  );
}
