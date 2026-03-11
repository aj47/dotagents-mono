interface AgentSelectorHeaderStateOptions {
  currentAgentLabel: string;
  isConnectionConfigured: boolean;
}

export function getAgentSelectorHeaderState({
  currentAgentLabel,
  isConnectionConfigured,
}: AgentSelectorHeaderStateOptions) {
  if (!isConnectionConfigured) {
    return {
      badgeLabel: 'Setup required',
      accessibilityLabel: 'Connection settings required before switching agents.',
      accessibilityHint: 'Opens connection settings so you can finish setup before switching agents.',
      opensAgentSelector: false,
    };
  }

  return {
    badgeLabel: `${currentAgentLabel} ▼`,
    accessibilityLabel: `Current agent: ${currentAgentLabel}. Tap to change.`,
    accessibilityHint: 'Opens agent selection menu',
    opensAgentSelector: true,
  };
}