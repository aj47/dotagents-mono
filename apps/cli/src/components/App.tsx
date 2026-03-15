import { useKeyboard, useTerminalDimensions } from '@opentui/react';
import { useState } from 'react';

/**
 * Root App component for the DotAgents CLI.
 *
 * Renders the main TUI frame with a header, content area,
 * and a status bar at the bottom.
 */
export function App() {
  const { width } = useTerminalDimensions();
  const [exiting, setExiting] = useState(false);

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
        padding={1}
        width="100%"
      >
        <text fg="#7aa2f7">
          <strong>DotAgents CLI</strong>
        </text>
        <text fg="#666"> — Your AI team, one command away</text>
      </box>

      {/* Main content area */}
      <box
        flexGrow={1}
        flexDirection="column"
        border
        borderStyle="single"
        borderColor="#414868"
        padding={1}
        width="100%"
      >
        <text fg="#a9b1d6">Welcome to DotAgents CLI.</text>
        <text fg="#565f89">Type a message to start chatting with your agent.</text>
      </box>

      {/* Status bar */}
      <box width="100%" padding={0}>
        <text fg="#565f89">Press Ctrl+C to exit</text>
      </box>
    </box>
  );
}
