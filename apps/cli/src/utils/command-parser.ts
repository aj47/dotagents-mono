/**
 * Slash command parser for the CLI chat interface.
 *
 * Recognizes commands prefixed with "/" and extracts command name + arguments.
 * Unrecognized slash commands are treated as regular messages.
 */

/** Known slash commands */
export type CommandName = 'new' | 'list' | 'conversations' | 'switch' | 'settings' | 'profiles' | 'mcp' | 'skills' | 'memories' | 'loops' | 'voice' | 'hub' | 'server' | 'acp' | 'diagnostics' | 'sandbox' | 'quit' | 'help';

export interface ParsedCommand {
  type: 'command';
  name: CommandName;
  args: string[];
  raw: string;
}

export interface ParsedMessage {
  type: 'message';
  content: string;
}

export type ParsedInput = ParsedCommand | ParsedMessage;

/** All known command names */
const KNOWN_COMMANDS: Set<string> = new Set([
  'new',
  'list',
  'conversations',
  'switch',
  'settings',
  'profiles',
  'mcp',
  'skills',
  'memories',
  'loops',
  'voice',
  'hub',
  'server',
  'acp',
  'diagnostics',
  'sandbox',
  'quit',
  'help',
]);

/**
 * Parse user input into either a command or a plain message.
 *
 * Commands start with "/" followed by a known command name.
 * Unknown "/foo" inputs are treated as regular messages.
 */
export function parseInput(input: string): ParsedInput {
  const trimmed = input.trim();

  if (!trimmed.startsWith('/')) {
    return { type: 'message', content: trimmed };
  }

  // Split on whitespace: first part is /command, rest are args
  const parts = trimmed.slice(1).split(/\s+/);
  const commandName = parts[0]?.toLowerCase() ?? '';
  const args = parts.slice(1);

  if (!KNOWN_COMMANDS.has(commandName)) {
    // Unknown slash command — treat as regular message
    return { type: 'message', content: trimmed };
  }

  return {
    type: 'command',
    name: commandName as CommandName,
    args,
    raw: trimmed,
  };
}

/**
 * Get help text describing all available commands.
 */
export function getHelpText(): string {
  return [
    'Available commands:',
    '  /new              — Start a new conversation',
    '  /list             — List all conversations',
    '  /conversations    — List all conversations (alias)',
    '  /switch <id>      — Switch to a conversation by ID or number',
    '  /settings         — Open settings panel',
    '  /profiles         — Manage agent profiles',
    '  /mcp              — Manage MCP servers and tools',
    '  /skills           — Manage agent skills',
    '  /memories         — Manage agent memories',
    '  /loops            — Manage repeat tasks',
    '  /voice            — Open voice mode (STT/TTS)',
    '  /hub              — Hub: browse, install, import/export bundles',
    '  /server           — Remote server: start, stop, QR code, OAuth',
    '  /acp              — ACP multi-agent management',
    '  /diagnostics      — System diagnostics, Langfuse, error log',
    '  /sandbox          — Manage sandbox config slots',
    '  /help             — Show this help message',
    '  /quit             — Exit the CLI',
  ].join('\n');
}
