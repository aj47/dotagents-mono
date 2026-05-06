export type AgentProfilePresetKey = 'auggie' | 'claude-code' | 'codex' | 'opencode';

export type AgentProfilePresetDefinition = {
  displayName: string;
  description: string;
  connectionType: 'acpx';
  connectionCommand: string;
  connectionArgs: string;
  enabled: boolean;
  docsUrl?: string;
  installCommand?: string;
  authHint?: string;
  cwdHint?: string;
  verifyArgs?: string[];
};

export type AgentProfilePresetCandidate = {
  connectionType?: string;
  connectionCommand?: string;
  connectionArgs?: string;
};

export const AGENT_PROFILE_PRESETS: Record<AgentProfilePresetKey, AgentProfilePresetDefinition> = {
  auggie: {
    displayName: 'Auggie (Augment Code)',
    description: "Augment Code's AI coding assistant with native ACP support",
    connectionType: 'acpx',
    connectionCommand: 'auggie',
    connectionArgs: '--acp',
    enabled: true,
    docsUrl: 'https://www.augmentcode.com/',
    cwdHint: 'Point the working directory at the repo you want Auggie to operate in.',
    verifyArgs: ['--help'],
  },
  'claude-code': {
    displayName: 'Claude Code',
    description: "Anthropic's Claude for coding tasks via ACP adapter",
    connectionType: 'acpx',
    connectionCommand: 'claude-code-acp',
    connectionArgs: '',
    enabled: true,
    docsUrl: 'https://github.com/zed-industries/claude-code-acp',
    installCommand: 'npm install -g @zed-industries/claude-code-acp',
    authHint: 'Sign in to Claude Code in your terminal before verifying if this is your first run.',
    cwdHint: 'Use your repo root so Claude Code inherits the right project context.',
    verifyArgs: ['--help'],
  },
  codex: {
    displayName: 'Codex',
    description: 'OpenAI Codex via the official ACP adapter',
    connectionType: 'acpx',
    connectionCommand: 'codex-acp',
    connectionArgs: '',
    enabled: true,
    docsUrl: 'https://github.com/zed-industries/codex-acp',
    installCommand: 'npm install -g @zed-industries/codex-acp',
    authHint: 'Run codex login first, or set CODEX_API_KEY / OPENAI_API_KEY before verifying.',
    cwdHint: 'Set the working directory to the project Codex should inspect and edit.',
    verifyArgs: ['--help'],
  },
  opencode: {
    displayName: 'OpenCode',
    description: "OpenCode's native ACP server for terminal-first agent workflows",
    connectionType: 'acpx',
    connectionCommand: 'opencode',
    connectionArgs: 'acp',
    enabled: true,
    docsUrl: 'https://opencode.ai/docs/acp/',
    installCommand: 'npm install -g opencode-ai',
    authHint: 'OpenCode stores provider auth after you run opencode and complete /connect in the TUI.',
    cwdHint: 'Use your workspace root so opencode acp can load the right project and config.',
    verifyArgs: ['--help'],
  },
};

export function detectAgentProfilePresetKey(
  agent?: AgentProfilePresetCandidate | null,
): AgentProfilePresetKey | undefined {
  if (!agent) return undefined;
  const args = (agent.connectionArgs || '').trim();

  if (agent.connectionType === 'acpx' && agent.connectionCommand === 'auggie' && args === '--acp') return 'auggie';
  if (agent.connectionType === 'acpx' && agent.connectionCommand === 'claude-code-acp') return 'claude-code';
  if (agent.connectionType === 'acpx' && agent.connectionCommand === 'codex-acp') return 'codex';
  if (agent.connectionType === 'acpx' && agent.connectionCommand === 'opencode' && args === 'acp') return 'opencode';

  return undefined;
}
