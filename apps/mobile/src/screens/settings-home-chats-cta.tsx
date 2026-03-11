import React from 'react';
import { Text, TouchableOpacity, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

export function getSettingsHomeChatsCtaContent(isConnected: boolean) {
  return {
    label: isConnected ? 'Go to Chats' : 'Open Chats',
    hint: isConnected
      ? 'Opens your chat list.'
      : 'Opens saved chats even while disconnected. Connect first to send new messages.',
    helperText: isConnected
      ? null
      : 'Review saved chats while disconnected. Connect before sending new messages.',
  };
}

type SettingsHomeChatsCtaProps = {
  isConnected: boolean;
  onOpenChats: () => void;
  buttonStyle: StyleProp<ViewStyle>;
  buttonTextStyle: StyleProp<TextStyle>;
  helperTextStyle: StyleProp<TextStyle>;
};

export function SettingsHomeChatsCta({
  isConnected,
  onOpenChats,
  buttonStyle,
  buttonTextStyle,
  helperTextStyle,
}: SettingsHomeChatsCtaProps) {
  const { label, hint, helperText } = getSettingsHomeChatsCtaContent(isConnected);

  return (
    <>
      <TouchableOpacity
        style={buttonStyle}
        onPress={onOpenChats}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={hint}
      >
        <Text style={buttonTextStyle}>{label}</Text>
      </TouchableOpacity>
      {helperText ? <Text style={helperTextStyle}>{helperText}</Text> : null}
    </>
  );
}