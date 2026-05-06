export type PromptTool = {
  name: string;
  description?: string;
  inputSchema?: any;
};

export type PromptKnowledgeNoteLike = {
  id: string;
  title: string;
  context?: string;
  summary?: string;
  body: string;
};

export function normalizePromptNoteText(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>#]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncatePromptNoteText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

export function formatWorkingNotesForPrompt(
  notes: PromptKnowledgeNoteLike[],
  maxNotes: number = 6,
): string {
  if (!notes || notes.length === 0) return '';

  return notes
    .filter((note) => note.context === 'auto')
    .slice(0, maxNotes)
    .map((note) => {
      const summary = truncatePromptNoteText(normalizePromptNoteText(note.summary ?? ''), 180);
      const body = truncatePromptNoteText(normalizePromptNoteText(note.body), 140);
      const fallback = body ? `${note.title}: ${body}` : note.title;
      return `- [${note.id}] ${summary || fallback}`;
    })
    .join('\n');
}

export function getEffectiveSystemPrompt(
  defaultSystemPrompt: string,
  customSystemPrompt?: string,
): string {
  if (customSystemPrompt && customSystemPrompt.trim()) {
    return customSystemPrompt.trim();
  }
  return defaultSystemPrompt;
}

export function formatPromptNow(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  const getPart = (type: Intl.DateTimeFormatPartTypes): string => {
    const value = parts.find((part) => part.type === type)?.value;
    if (!value) throw new Error(`Missing ${type} while formatting prompt timestamp`);
    return value;
  };

  return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}`;
}

export function hasPromptTool(tools: PromptTool[], toolName: string): boolean {
  return tools.some((tool) => tool.name === toolName);
}

export function getToolDiscoveryPromptAddition(availableTools: PromptTool[]): string {
  const hasListServerTools = hasPromptTool(availableTools, 'list_server_tools');
  const hasGetToolSchema = hasPromptTool(availableTools, 'get_tool_schema');

  if (hasListServerTools && hasGetToolSchema) {
    return 'To discover tools: use list_server_tools(serverName) to inspect MCP tools from a real server, or get_tool_schema(toolName) for full parameter details on any available tool.';
  }

  if (hasListServerTools) {
    return 'To discover MCP tools from a real server, use list_server_tools(serverName).';
  }

  if (hasGetToolSchema) {
    return 'To inspect exact parameters for an available tool, use get_tool_schema(toolName).';
  }

  return '';
}

export function getAgentModeAdditions(availableTools: PromptTool[]): string {
  const hasRespondToUser = hasPromptTool(availableTools, 'respond_to_user');
  const hasMarkWorkComplete = hasPromptTool(availableTools, 'mark_work_complete');
  const hasExecuteCommand = hasPromptTool(availableTools, 'execute_command');
  const hasLoadSkillInstructions = hasPromptTool(availableTools, 'load_skill_instructions');
  const hasReadMoreContext = hasPromptTool(availableTools, 'read_more_context');

  const sections = [
    'AGENT MODE: You can see tool results and make follow-up tool calls. Continue calling tools until the task is completely resolved.',
    `STATUS & CONTINUATION TURNS:
- When the current user message is asking for status, current state, what happened, why something failed, or the next safe step, answer from existing conversation evidence whenever it is sufficient
- Do not resume the broader original task or start exploratory work just because tools are available
- If more evidence is necessary, make at most one narrow read-only probe before responding
- If an approval boundary is active, mention it explicitly in the status answer and do not offer mutating next actions except as pending approval
- In the response, state what is known, what is unknown, the latest blocker, and the next safe action while preserving any active approval boundary`,
  ];

  if (hasRespondToUser) {
    sections.push(`RESPONDING TO USER:
- Normal assistant text is valid user-facing output for ordinary chat, simple questions, and final answers
- Use respond_to_user when you specifically need explicit voice/messaging delivery semantics or need to attach images/videos
- On voice interfaces this will be spoken aloud; on messaging channels (mobile, WhatsApp) it will be sent as a message
- Write respond_to_user content naturally and conversationally
- Markdown is allowed when useful (for example links or image captions)
- To send images, use respond_to_user.images with either URL/data URL entries or local file paths`);
  } else {
    sections.push(`RESPONDING TO USER:
- No direct user-response tool is available in this run. Put the final user-facing answer in normal assistant text.`);
  }

  if (hasLoadSkillInstructions) {
    sections.push(`SKILLS:
- Skills are optional modules listed below; before using one, call load_skill_instructions(skillId) at most once per session, reuse successful loads, and retry only after failure or explicit reload request.
- If a skill exists on disk but cannot load, diagnose runtime skills-registry/refresh first; recommend refresh/restart/import before recreating or rewriting it.
- Do not infer a skill's contents from name/description.`);
  }

  if (hasRespondToUser && hasMarkWorkComplete) {
    sections.push(`COMPLETION SIGNAL:
- When all requested work is fully complete, a normal assistant text final answer is valid and may be the only response
- For tool-driven work where an explicit completion signal is useful, call mark_work_complete with a concise internal completion summary after delivering the final answer
- If you use respond_to_user for the final answer, do not duplicate that same answer in plain assistant text
- Do not send a second recap or post-completion summary unless the user explicitly asked for one
- Do not call mark_work_complete while work is still in progress or partially done`);
  } else if (hasRespondToUser) {
    sections.push(`COMPLETION SIGNAL:
- When all requested work is fully complete, provide the final user-facing response in normal assistant text or via respond_to_user when explicit delivery semantics are needed.
- There is no separate completion tool in this run, so do not continue looping after that final response.`);
  } else if (hasMarkWorkComplete) {
    sections.push(`COMPLETION SIGNAL:
- When all requested work is fully complete, provide the complete final user-facing answer in normal assistant text first. For tool-driven work, you may then call mark_work_complete with a concise internal completion summary.
- Do not send a second recap or post-completion summary unless the user explicitly asked for one.
- Do not call mark_work_complete while work is still in progress or partially done.`);
  } else {
    sections.push(`COMPLETION SIGNAL:
- When all requested work is fully complete, provide the complete final user-facing answer in normal assistant text and stop.`);
  }

  if (hasExecuteCommand) {
    sections.push(`AGENT FILE & COMMAND EXECUTION:
- Use execute_command for shell/file automation. Infer package manager from lockfiles (pnpm-lock.yaml, package-lock.json, yarn.lock, bun.lock*) and do not default to npm against another lockfile.
- For planning/status/context, prefer read-only probes (git status, ls, find, rg, sed/head/tail/cat). Do not run install/test/build/lint/typecheck unless asked or validating your code changes.
- Before reading large files, check size (wc -l) and read targeted ranges with sed/head/tail; avoid cat on large files. Output over 10K chars is truncated.`);
  }

  if (hasReadMoreContext) {
    sections.push(`COMPACTED CONTEXT:
- If a prior message says it was truncated or summarized and shows a "Context ref: ctx_...", use read_more_context to inspect the original source
- Prefer read_more_context(mode: "overview") first, then search/window reads for the exact detail you need
- Avoid pulling large heads/tails unless a narrower search or window is insufficient`);
  }

  sections.push(`LOCAL MEMORY & CONFIG:
- Durable notes live in ~/.agents/knowledge/ and ./.agents/knowledge/; edit note/config files directly and keep context:auto rare
- Prior conversations live under <appData>/<appId>/conversations/; infer the appId/path, search index.json then conv_*.json, and recover state before asking when the user wants to resume prior work
- DotAgents config is layered ~/.agents/ plus workspace ./.agents/ when DOTAGENTS_WORKSPACE_DIR is set; for unfamiliar config edits, load dotagents-config-admin if available`);

  return `\n\n${sections.join('\n\n')}`;
}

export function partitionPromptTools(tools: PromptTool[]): {
  externalTools: PromptTool[];
  runtimeTools: PromptTool[];
} {
  return {
    externalTools: tools.filter((tool) => tool.name.includes(':')),
    runtimeTools: tools.filter((tool) => !tool.name.includes(':')),
  };
}

export function getServerSummaries(tools: PromptTool[]): Array<{
  serverName: string;
  toolCount: number;
  toolNames: string[];
}> {
  const serverMap = new Map<string, string[]>();

  for (const tool of tools) {
    const separatorIndex = tool.name.indexOf(':');
    if (separatorIndex === -1) continue;
    const serverName = tool.name.slice(0, separatorIndex);
    const toolName = tool.name.slice(separatorIndex + 1);
    if (!serverMap.has(serverName)) {
      serverMap.set(serverName, []);
    }
    serverMap.get(serverName)!.push(toolName);
  }

  return Array.from(serverMap.entries()).map(([serverName, toolNames]) => ({
    serverName,
    toolCount: toolNames.length,
    toolNames,
  }));
}

export function formatLightweightMcpToolInfo(tools: PromptTool[]): string {
  const serverSummaries = getServerSummaries(tools);

  return serverSummaries
    .map((server) => {
      const toolList = server.toolNames.join(', ');
      return `- ${server.serverName} (${server.toolCount} tools): ${toolList}`;
    })
    .join('\n');
}

export function formatRuntimeToolInfo(tools: PromptTool[]): string {
  return tools.map((tool) => tool.name).join(', ');
}

export function formatFullPromptToolInfo(tools: PromptTool[]): string {
  return tools
    .map((tool) => {
      let info = `- ${tool.name}: ${tool.description ?? ''}`;
      if (tool.inputSchema?.properties) {
        const params = Object.entries(tool.inputSchema.properties)
          .map(([key, schema]: [string, any]) => {
            const type = schema.type || 'any';
            const required = tool.inputSchema.required?.includes(key)
              ? ' (required)'
              : '';
            return `${key}: ${type}${required}`;
          })
          .join(', ');
        if (params) {
          info += `\n  Parameters: {${params}}`;
        }
      }
      return info;
    })
    .join('\n');
}

export function formatMinimalPromptToolList(tools: PromptTool[]): string {
  return tools
    .map((tool) => {
      const keys = tool.inputSchema?.properties
        ? Object.keys(tool.inputSchema.properties)
        : [];
      const params = keys.join(', ');
      return params ? `- ${tool.name}(${params})` : `- ${tool.name}()`;
    })
    .join('\n');
}
