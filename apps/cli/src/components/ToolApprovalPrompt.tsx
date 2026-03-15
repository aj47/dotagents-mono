import { useKeyboard } from '@opentui/react';
import { useCallback, useRef } from 'react';
import type { ToolApprovalInfo } from '../types/chat';
import { formatToolArgs } from './ToolCallView';

/**
 * ToolApprovalPrompt — displays a tool approval prompt with approve/deny keybindings.
 *
 * When `mcpRequireApprovalBeforeToolCall` is enabled, the agent pauses and
 * displays this prompt before executing a tool. The user can press:
 *   Y / Enter — approve execution
 *   N / Escape — deny execution
 */
export interface ToolApprovalPromptProps {
  approval: ToolApprovalInfo;
  onApprove: () => void;
  onDeny: () => void;
}

export function ToolApprovalPrompt({ approval, onApprove, onDeny }: ToolApprovalPromptProps) {
  // Use refs to ensure latest callbacks are called by the keyboard handler
  const onApproveRef = useRef(onApprove);
  onApproveRef.current = onApprove;
  const onDenyRef = useRef(onDeny);
  onDenyRef.current = onDeny;
  // Prevent double-firing
  const respondedRef = useRef(false);

  useKeyboard(
    useCallback((key: { name?: string; raw?: string; ctrl?: boolean }) => {
      if (respondedRef.current) return;
      const raw = key.raw?.toLowerCase() ?? '';
      // Approve: y, Y, or Enter
      if (raw === 'y' || key.name === 'return') {
        respondedRef.current = true;
        onApproveRef.current();
        return;
      }
      // Deny: n, N, or Escape
      if (raw === 'n' || key.name === 'escape') {
        respondedRef.current = true;
        onDenyRef.current();
        return;
      }
    }, []),
  );

  const argsDisplay = formatToolArgs(approval.args);

  return (
    <box
      flexDirection="column"
      width="100%"
      border
      borderStyle="rounded"
      borderColor="#e0af68"
      paddingX={1}
      paddingY={0}
    >
      <text fg="#e0af68">
        <strong>⚠ Tool Approval Required</strong>
      </text>
      <box paddingLeft={2} flexDirection="column">
        <text fg="#c0caf5">
          Tool: <strong>{approval.toolName}</strong>
        </text>
        {argsDisplay.length > 0 && (
          <text fg="#565f89">Args: {argsDisplay}</text>
        )}
        {approval.description && (
          <text fg="#565f89">{approval.description}</text>
        )}
      </box>
      <box marginTop={1}>
        <text fg="#9ece6a">[Y/Enter] Approve</text>
        <text fg="#565f89">  </text>
        <text fg="#f7768e">[N/Esc] Deny</text>
      </box>
    </box>
  );
}
