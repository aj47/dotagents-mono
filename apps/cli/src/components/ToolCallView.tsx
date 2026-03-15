import type { ToolCallInfo } from '../types/chat';

/**
 * ToolCallView — displays a tool call with a spinner while executing.
 *
 * Shows the tool name with a spinning indicator during execution,
 * then delegates to ToolResultView or ToolErrorView when complete.
 */
export interface ToolCallViewProps {
  toolCall: ToolCallInfo;
}

/** Spinner frames for the in-progress animation */
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/**
 * Get the current spinner frame based on the current time.
 * This provides a static frame per render — the parent should
 * re-render periodically (e.g., via useSpinner hook) for animation.
 */
export function getSpinnerFrame(tick: number = 0): string {
  return SPINNER_FRAMES[tick % SPINNER_FRAMES.length];
}

/**
 * Format tool arguments for display as a compact single-line summary.
 */
export function formatToolArgs(args: Record<string, unknown>): string {
  const entries = Object.entries(args);
  if (entries.length === 0) return '';
  const parts = entries.map(([key, value]) => {
    const valStr = typeof value === 'string'
      ? value.length > 40 ? `"${value.slice(0, 37)}..."` : `"${value}"`
      : JSON.stringify(value);
    return `${key}: ${valStr}`;
  });
  const summary = parts.join(', ');
  return summary.length > 80 ? summary.slice(0, 77) + '...' : summary;
}

export function ToolCallView({ toolCall }: ToolCallViewProps) {
  const isRunning = toolCall.status === 'running' || toolCall.status === 'pending';

  if (toolCall.status === 'error') {
    return (
      <box flexDirection="column" width="100%" marginY={0} paddingLeft={2}>
        <text fg="#f7768e">
          ✗ {toolCall.toolName} — <strong>Error</strong>
        </text>
        {toolCall.error && (
          <box paddingLeft={2}>
            <text fg="#f7768e" wrapMode="word">{toolCall.error}</text>
          </box>
        )}
      </box>
    );
  }

  if (toolCall.status === 'completed') {
    return (
      <box flexDirection="column" width="100%" marginY={0} paddingLeft={2}>
        <text fg="#9ece6a">
          ✓ {toolCall.toolName}
        </text>
        {toolCall.result && (
          <box paddingLeft={2}>
            <text fg="#565f89" wrapMode="word">
              {toolCall.result.length > 200
                ? toolCall.result.slice(0, 197) + '...'
                : toolCall.result}
            </text>
          </box>
        )}
      </box>
    );
  }

  // Running / pending state — show spinner
  return (
    <box flexDirection="column" width="100%" marginY={0} paddingLeft={2}>
      <text fg="#e0af68">
        ⠋ {toolCall.toolName}...
      </text>
      {Object.keys(toolCall.args).length > 0 && (
        <box paddingLeft={2}>
          <text fg="#565f89">{formatToolArgs(toolCall.args)}</text>
        </box>
      )}
    </box>
  );
}
