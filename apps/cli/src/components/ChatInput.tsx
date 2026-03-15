import { useState, useCallback, useRef } from 'react';
import { useKeyboard } from '@opentui/react';

/**
 * ChatInput — single-line message input component for the CLI chat.
 *
 * Renders a prompt indicator (>) and an input field.
 * Submits on Enter; rejects empty/whitespace-only messages.
 * Can be disabled during streaming.
 */
export interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export function ChatInput({ onSubmit, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('');
  const valueRef = useRef(value);
  valueRef.current = value;

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  // Use keyboard handler to detect Enter for submission
  useKeyboard((key) => {
    if (key.name === 'return' && !disabled) {
      const trimmed = valueRef.current.trim();
      if (trimmed.length === 0) return;
      onSubmit(trimmed);
      setValue('');
    }
  });

  return (
    <box flexDirection="row" width="100%" gap={1}>
      <text fg={disabled ? '#565f89' : '#7aa2f7'}>
        <strong>{'> '}</strong>
      </text>
      <input
        flexGrow={1}
        value={value}
        onChange={handleChange}
        placeholder={placeholder ?? 'Type a message...'}
        textColor={disabled ? '#565f89' : '#a9b1d6'}
        focused={!disabled}
      />
    </box>
  );
}
