const FALLBACK_SWITCH_LABEL = 'Setting toggle';
const FALLBACK_SERVER_LABEL = 'Enable MCP server';

const normalizeLabel = (label: string): string => {
  const trimmed = label.trim();
  return trimmed.length > 0 ? trimmed : '';
};

export const createSwitchAccessibilityLabel = (settingName: string): string => {
  const normalizedName = normalizeLabel(settingName);
  if (!normalizedName) {
    return FALLBACK_SWITCH_LABEL;
  }
  return `${normalizedName} toggle`;
};

export const createMcpServerSwitchAccessibilityLabel = (serverName: string): string => {
  const normalizedServerName = normalizeLabel(serverName);
  if (!normalizedServerName) {
    return FALLBACK_SERVER_LABEL;
  }
  return `Enable ${normalizedServerName} MCP server`;
};

