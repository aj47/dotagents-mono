export type TraceHistoryMessage = {
  role: "user" | "assistant" | "tool"
  content: string
  toolCalls?: Array<{ name: string; arguments?: Record<string, unknown> }>
}

export type AutoresearchContinuationCase = {
  caseId: string
  name: string
  sessionId: string
  transcript: string
  expectedHistoryLength: number
  previousHistory: TraceHistoryMessage[]
  response: string
  requiredPromptEvidence: string[]
  forbiddenPromptEvidence?: string[]
  allowCompletionToolInPrompt?: boolean
  requiredResponseEvidence: string[]
  requiredLiveResponseEvidence: string[][]
}

function makeTraceFillerMessages(label: string, count: number): TraceHistoryMessage[] {
  return Array.from({ length: count }, (_, index) => ({
    role: "assistant" as const,
    content: `Older low-signal ${label} note ${index}: background chatter that should not dominate status recovery.`,
  }))
}

function makeApprovalBoundaryHistory(): TraceHistoryMessage[] {
  return [
    { role: "user", content: "I want to start downloading, transcribing and clipping my latest livestream, but ask for my approval before you actually make any changes. You can gather context first." },
    { role: "assistant", content: "I will gather context only and preserve the approval boundary before downloads, transcription, clipping, or file changes. STALE_LONG_CONTEXT_SHOULD_NOT_REPLAY" },
    { role: "assistant", content: "", toolCalls: [{ name: "load_skill_instructions", arguments: { skillId: "batch-processor" } }] },
    { role: "tool", content: "[load_skill_instructions] batch-processor skill loaded. It can download VODs, transcribe, and run clipping after approval." },
    { role: "assistant", content: "", toolCalls: [{ name: "set_session_title", arguments: { title: "Livestream Prep Approval" } }] },
    { role: "tool", content: "[set_session_title] {\"success\":true,\"title\":\"Livestream Prep Approval\"}" },
    { role: "assistant", content: "I need to identify the latest TechFren livestream before proposing any mutating plan." },
    { role: "assistant", content: "", toolCalls: [{ name: "execute_command", arguments: { command: "find ~/.agents/knowledge -maxdepth 3 -type f | grep -Ei 'youtube|livestream|techfren' | head" } }] },
    { role: "tool", content: "[execute_command] {\"success\":true,\"stdout\":\"TechFren notes found\\nlocal project: /Users/ajjoobandi/Development/techfren-recap-remotion\\nno exact latest VOD URL confirmed\"}" },
    { role: "assistant", content: "", toolCalls: [{ name: "execute_command", arguments: { command: "which yt-dlp || true; which ffmpeg || true" } }] },
    { role: "tool", content: "[execute_command] {\"success\":true,\"stdout\":\"/opt/homebrew/bin/yt-dlp\\n/opt/homebrew/bin/ffmpeg\"}" },
    { role: "assistant", content: "Known so far: this is TechFren-related and the local recap project exists. Unknown: the exact latest stream URL." },
    { role: "tool", content: "[execute_command] {\"success\":true,\"stdout\":\"read-only context gathering complete; no downloads, writes, or clipping started\\nnext_safe_action=read notes/conversations to recover exact latest VOD URL before asking for approval to mutate\"}" },
  ]
}

function makeDownloadStatusHistory(): TraceHistoryMessage[] {
  return [
    { role: "user", content: "Download my latest TechFren stream, but preserve the current approval boundary and answer status questions from evidence." },
    { role: "assistant", content: "I will separate confirmed file evidence from setup or attempted commands. STALE_LONG_CONTEXT_SHOULD_NOT_REPLAY" },
    ...makeTraceFillerMessages("download", 60),
    { role: "user", content: "Make sure that we get it in 2K resolution or max resolution." },
    { role: "user", content: "Download at max resolution in the right path. You have permission." },
    { role: "tool", content: "[execute_command] {\"success\":true,\"stdout\":\"created /Users/ajjoobandi/Movies/techfren-latest\\ntotal 0\\nno media files\"}" },
    { role: "tool", content: "[execute_command] {\"success\":false,\"command\":\"yt-dlp --merge-output-format mp4 https://www.youtube.com/watch?v=SKKLEhBNkdk\",\"stderr\":\"ERROR: [youtube] SKKLEhBNkdk: Sign in to confirm you are not a bot\"}" },
    {
      role: "assistant",
      content: "No completed download yet. The folder exists, but there is no media file and the latest blocker is YouTube's sign-in/bot challenge.",
      toolCalls: [{ name: "respond_to_user", arguments: { text: "No completed download yet. The folder exists, but there is no media file and the latest blocker is YouTube's sign-in/bot challenge." } }],
    },
  ]
}

function makeTryItFirstHistory(): TraceHistoryMessage[] {
  return [
    { role: "user", content: "Before downloading anything, try the command first and tell me whether it can see formats." },
    { role: "assistant", content: "Unrelated older conclusion. STALE_LONG_CONTEXT_SHOULD_NOT_REPLAY" },
    ...makeTraceFillerMessages("probe", 98),
    { role: "tool", content: "[execute_command] {\"success\":false,\"stderr\":\"yt-dlp: error: no such option: --js-runtime\"}" },
    { role: "assistant", content: "The installed alias is stale, so I will use uvx with the corrected --js-runtimes flag for a probe only." },
    { role: "user", content: "try it first" },
    { role: "tool", content: "[execute_command] {\"success\":true,\"command\":\"uvx --from yt-dlp[default] yt-dlp --simulate --list-formats --js-runtimes node https://www.youtube.com/watch?v=SKKLEhBNkdk\",\"stdout\":\"format 271 1440p\\nformat 137 1080p\\n[download] Downloading item 1 of 1 skipped by simulation\"}" },
    {
      role: "assistant",
      content: "Test passed: the corrected uvx yt-dlp probe sees 1440p and 1080p formats. No download was started.",
      toolCalls: [{ name: "respond_to_user", arguments: { text: "Test passed: the corrected uvx yt-dlp probe sees 1440p and 1080p formats. No download was started." } }],
    },
  ]
}

function makeSkillRegistryHistory(): TraceHistoryMessage[] {
  return [
    { role: "user", content: "Use the stream-topic-inventory skill for the transcript. The out.txt file should be enough for topic extraction." },
    { role: "assistant", content: "I will check whether the skill is loadable before inferring its workflow. STALE_LONG_CONTEXT_SHOULD_NOT_REPLAY" },
    ...makeTraceFillerMessages("skill", 71),
    { role: "tool", content: "[load_skill_instructions] {\"success\":false,\"error\":\"Skill stream-topic-inventory is not available in the running skills registry\"}" },
    { role: "tool", content: "[execute_command] {\"success\":true,\"stdout\":\"exists on disk: /Users/ajjoobandi/.agents/skills/stream-topic-inventory/SKILL.md\"}" },
    {
      role: "assistant",
      content: "The skill exists on disk, but the running app session does not have it in the live skills registry yet.",
      toolCalls: [{ name: "respond_to_user", arguments: { text: "The skill exists on disk, but the running app session does not have it in the live skills registry yet." } }],
    },
  ]
}

function makeFullLongContextHistory(): TraceHistoryMessage[] {
  const omittedHistory: TraceHistoryMessage[] = [
    { role: "user", content: "I want to start downloading, transcribing and clipping my latest livestream, but ask for approval before changes." },
    ...makeTraceFillerMessages("full-context", 605),
    { role: "user", content: "yeah there should be a text_\"video-title\"/en/out.json and out.txt and out.srt. for the topic extraction out.txt would probably be most efficient. chunk by words" },
    { role: "user", content: "sounds good. make the skill and make sure it fits in and is best practice amongst other skills" },
    { role: "user", content: "i started a new session to try and it didnt find the skill can you see" },
  ]
  const recentHistory: TraceHistoryMessage[] = [
    { role: "tool", content: "[execute_command] {\"success\":true,\"stdout\":\"skillsService active list does not include stream-topic-inventory\"}" },
    { role: "assistant", content: "I will verify whether this is a registry problem or a filesystem problem before answering." },
    { role: "tool", content: "[execute_command] {\"success\":true,\"stdout\":\"filesystem_skill_exists= True\\n/Users/ajjoobandi/.agents/skills/stream-topic-inventory/SKILL.md\"}" },
    {
      role: "assistant",
      content: "",
      toolCalls: [{ name: "respond_to_user", arguments: { text: "The skill exists on disk, but this session's Available Skills list does not include it. load_skill_instructions only checks the in-memory skillsService registry." } }],
    },
    { role: "tool", content: "[respond_to_user] {\"success\":true,\"message\":\"Response recorded for delivery to user.\"}" },
    { role: "assistant", content: "The skill exists on disk and parses fine, but this session's Available Skills list does not include it. Starting a new chat is not enough if the same app process has not refreshed its skill registry." },
  ]
  return [...omittedHistory, ...recentHistory]
}

function makeHarnessAgentContextCorrectionHistory(): TraceHistoryMessage[] {
  return [
    {
      role: "user",
      content: "can you gather some of our context to answer what is harness engineering in less than 10 dot points and give them to me also find the comparison we made to prompt and context engineering",
    },
    {
      role: "assistant",
      content: "I will gather local workshop context and online validation before tightening the prompt/context/harness comparison.",
    },
    ...makeTraceFillerMessages("harness-context", 82),
    {
      role: "tool",
      content: "[exa:web_search_advanced_exa] [summarized]\nLearned that reliable production agents are framed as a systems/harness problem, not a prompt problem. NVIDIA Elements separates Prompt Engineering = single-call wording/few-shot, Context Engineering = curated runtime context, and Harness Engineering = full system design. The summarized evidence says an agent harness wraps the LLM with tools, memory, constraints, and feedback loops.",
    },
    {
      role: "assistant",
      content: "Yes - the claims are directionally right, but I'd tighten the framing. Harness engineering is designing the system around an LLM - tools, context, state, constraints, evals, logs, and feedback loops - so agent work becomes repeatable and improvable, not just prompted.",
    },
    {
      role: "user",
      content: "ok this is good. i need to make concise distilled dotpoints i can refer to as i make the video and run the workshop can we start that document. what are the first 10 points",
    },
    {
      role: "assistant",
      content: [
        "- **Harness engineering = designing the repeatable system around the model**, not just writing a better prompt.",
        "- **Context engineering** asks: \"What information, files, tools, and instructions should the model see at runtime?\"",
        "- **Harness engineering** asks: \"What surrounding system makes the model's work reliable across attempts?\"",
        "- Final line: **Prompt engineering improves the request. Context engineering improves what the model sees. Harness engineering improves the loop.**",
      ].join("\n"),
    },
    {
      role: "assistant",
      content: "A later internal completion summary said: \"Validated harness engineering framing against online research and provided revised concise bullets with prompt/context comparison.\" That summary is not a user-facing answer to the next correction.",
    },
  ]
}

function makePriorConversationsBeforeUnavailableHistory(): TraceHistoryMessage[] {
  return [
    {
      role: "user",
      content: "what did we decide about the workshop title?",
    },
    {
      role: "assistant",
      content: "I will check local project memory before answering.",
    },
    ...makeTraceFillerMessages("workshop-title", 64),
    {
      role: "assistant",
      content: "",
      toolCalls: [{
        name: "execute_command",
        arguments: {
          command: "rg -n \"workshop title|title decision|harness workshop\" ~/.agents/knowledge ~/Documents/harness-workshop-notes",
        },
      }],
    },
    {
      role: "tool",
      content: "[execute_command] {\"success\":true,\"stdout\":\"/Users/ajjoobandi/Documents/harness-workshop-notes/harness-engineering-distilled.md:1:# Harness Engineering - Distilled Workshop Notes\\n\",\"stderr\":\"\"}",
    },
    {
      role: "assistant",
      content: "",
      toolCalls: [{
        name: "execute_command",
        arguments: {
          command: "find ~/Documents -maxdepth 4 -type f \\( -iname '*workshop*' -o -iname '*harness*' \\) | head -50",
        },
      }],
    },
    {
      role: "tool",
      content: "[execute_command] {\"success\":true,\"stdout\":\"/Users/ajjoobandi/Documents/harness-workshop-notes/harness-engineering-distilled.md\\n/Users/ajjoobandi/Desktop/harness-workshop-materials/README.md\\n\",\"stderr\":\"\"}",
    },
    {
      role: "assistant",
      content: "I do not see a clear prior decision about the workshop title in the knowledge notes or workshop files I checked, so I don't have that decided title available.",
    },
  ]
}

function makeInitialConversationReviewPathHistory(): TraceHistoryMessage[] {
  return [
    {
      role: "user",
      content: [
        "Review recent DotAgents conversations and promote only durable, high-confidence updates into knowledge.",
        "",
        "## Inputs",
        "- Recent conversation files from the DotAgents conversations store",
        "- `~/.agents/knowledge`",
        "- Existing task/skill inventory when deciding whether repeated work justifies a new artifact",
        "",
        "## Required windows",
        "- Search conversations updated in the last 4 hours first",
        "- If no durable candidates appear, search the last 24 hours",
        "- If still empty, search the last 7 days before reporting a no-op",
      ].join("\n"),
    },
    {
      role: "assistant",
      content: "I will inspect the recent DotAgents conversations windows and only promote durable updates.",
    },
    ...makeTraceFillerMessages("conversation-review-path", 58),
    {
      role: "assistant",
      content: "",
      toolCalls: [{
        name: "execute_command",
        arguments: {
          command: "bash -lc 'set -e\nAPPDIR=\"$HOME/.config/dotagents/conversations\"\nif [ ! -d \"$APPDIR\" ]; then APPDIR=\"$HOME/Library/Application Support/dotagents/conversations\"; fi\nif [ ! -d \"$APPDIR\" ]; then APPDIR=\"$HOME/.config/app.dotagents/conversations\"; fi\nprintf \"APPDIR=%s\\n\" \"$APPDIR\"\nls -la \"$APPDIR\" | sed -n \"1,20p\"'",
        },
      }],
    },
    {
      role: "tool",
      content: "[execute_command] {\"success\":true,\"stdout\":\"APPDIR=/Users/ajjoobandi/Library/Application Support/dotagents/conversations\\ntotal 0\\ndrwxr-xr-x   2 ajjoobandi  staff    64 May  1 18:01 .\\ndrwx------  12 ajjoobandi  staff   384 May  1 18:01 ..\\n\",\"stderr\":\"\"}",
    },
    {
      role: "assistant",
      content: "",
      toolCalls: [{
        name: "execute_command",
        arguments: {
          command: "python3 - <<'PY'\nimport os, glob, time\napp=os.path.expanduser('~/Library/Application Support/dotagents/conversations')\nnow=time.time()\nfor hrs in (4,24,168):\n    cutoff=now-hrs*3600\n    files=[p for p in glob.glob(app+'/conv_*.json') if os.path.getmtime(p)>=cutoff]\n    print('WINDOW',hrs,'count=',len(files))\nPY",
        },
      }],
    },
    {
      role: "tool",
      content: "[execute_command] {\"success\":true,\"stdout\":\"WINDOW 4 count=0\\nWINDOW 24 count=0\\nWINDOW 168 count=0\\n\",\"stderr\":\"\"}",
    },
    {
      role: "assistant",
      content: "",
      toolCalls: [{
        name: "execute_command",
        arguments: {
          command: "sed -n '1,220p' \"$HOME/.agents/tasks/conversation-to-knowledge-review/task.md\"; tail -n 40 \"$HOME/.agents/knowledge/systems/agent-autonomy/agent-autonomy.md\"",
        },
      }],
    },
    {
      role: "tool",
      content: "[execute_command] {\"success\":true,\"stdout\":\"Inputs: Recent conversation files from the DotAgents conversations store. Process: inspect 4h, then 24h, then 7d conversation windows before recording a no-op. Knowledge tail: prior audit used ~/Library/Application Support/app.dotagents/conversations and current conv_1777651483484_3p1ax883c.json.\\n\",\"stderr\":\"\"}",
    },
    {
      role: "assistant",
      content: "No-op. I searched the required 4h, 24h, and 7d windows in ~/Library/Application Support/dotagents/conversations, found zero conversations in each bounded window, and therefore promoted nothing.",
    },
  ]
}

export const autoresearchContinuationCases: AutoresearchContinuationCase[] = [
  {
    caseId: "case-a-approval-boundary",
    name: "Approval boundary after context gathering",
    sessionId: "session-autoresearch-approval-boundary",
    transcript: "Continue from here with a status answer: say the exact latest livestream/VOD URL is still unknown, the next safe action is to read notes/conversations to recover it, and no download/transcription/clipping happens before approval.",
    expectedHistoryLength: 13,
    previousHistory: makeApprovalBoundaryHistory(),
    response: "Known: this is TechFren-related and the local techfren-recap-remotion project exists. Unknown: the exact latest livestream/VOD URL. Blocker: approval is required before downloads, transcription, clipping, or file changes. Next safe action: read notes/conversations to recover the exact VOD link, then present the plan for approval before any mutating step.",
    requiredPromptEvidence: [
      "[Older context: 7 omitted.]",
      "ask for my approval before you actually make any changes",
      "TechFren notes found",
      "no exact latest VOD URL confirmed",
      "next_safe_action=read notes/conversations to recover exact latest VOD URL",
      "Continue from here with a status answer: say the exact latest livestream/VOD URL is still unknown, the next safe action is to read notes/conversations to recover it, and no download/transcription/clipping happens before approval.",
    ],
    requiredResponseEvidence: ["Known:", "Unknown:", "Blocker:", "Next safe action:", "approval"],
    requiredLiveResponseEvidence: [
      ["VOD URL", "livestream link", "latest livestream", "latest stream URL", "stream URL"],
      ["notes/conversations", "notes and conversations", "read notes", "read conversations", "recover the exact VOD link", "recover the exact livestream link"],
      ["approval", "before download", "before downloads", "before downloading", "no downloading", "before transcription", "before clipping", "before any mutating"],
    ],
  },
  {
    caseId: "case-b-did-it-download",
    name: "Did it download?",
    sessionId: "session-autoresearch-did-it-download",
    transcript: "did it dl",
    expectedHistoryLength: 67,
    previousHistory: makeDownloadStatusHistory(),
    response: "Known: the folder exists but contains no media file. Unknown: no successful retry result is present. Latest blocker: YouTube sign-in/bot challenge. Next safe action: retry only after choosing a cookies/browser-session approach.",
    requiredPromptEvidence: [
      "[Older context:",
      "Make sure that we get it in 2K resolution",
      "created /Users/ajjoobandi/Movies/techfren-latest",
      "Sign in to confirm you are not a bot",
      "did it dl",
    ],
    requiredResponseEvidence: ["Known:", "Unknown:", "Latest blocker:", "Next safe action:", "no media file"],
    requiredLiveResponseEvidence: [
      ["didn't download", "did not download", "not download successfully", "no completed download"],
      ["no media file", "no file", "no file was saved", "not saved", "wasn't saved", "empty"],
      ["sign-in", "sign in", "bot challenge", "bot check", "not a bot"],
    ],
  },
  {
    caseId: "case-c-try-it-first-alias",
    name: "Try it first / alias debugging",
    sessionId: "session-autoresearch-try-it-first",
    transcript: "test it",
    expectedHistoryLength: 105,
    previousHistory: makeTryItFirstHistory(),
    response: "The probe passed: corrected uvx yt-dlp saw 1440p and 1080p formats. It was a simulate/list-formats probe, so no download was started.",
    requiredPromptEvidence: [
      "[Older context:",
      "no such option: --js-runtime",
      "try it first",
      "--simulate --list-formats",
      "No download was started",
      "test it",
    ],
    requiredResponseEvidence: ["probe passed", "1440p", "simulate/list-formats", "no download was started"],
    requiredLiveResponseEvidence: [
      ["probe passed", "probe succeeded", "probe works", "saw formats", "found available formats", "test passed"],
      ["1440p"],
      ["no download was started", "no download", "download was not started"],
    ],
  },
  {
    caseId: "case-d-skill-registry-diagnosis",
    name: "Skill registry diagnosis",
    sessionId: "session-autoresearch-skill-registry",
    transcript: "why can't you load the stream-topic-inventory skill?",
    expectedHistoryLength: 76,
    previousHistory: makeSkillRegistryHistory(),
    response: "Because the file exists on disk but the running skills registry does not expose it yet. The next safe step is to refresh/restart the app session so load_skill_instructions can see stream-topic-inventory.",
    requiredPromptEvidence: [
      "[Older context:",
      "out.txt file should be enough",
      "not available in the running skills registry",
      "exists on disk",
      "stream-topic-inventory/SKILL.md",
    ],
    requiredResponseEvidence: ["exists on disk", "running skills registry", "refresh/restart", "load_skill_instructions"],
    requiredLiveResponseEvidence: [
      ["exists on disk"],
      ["registry"],
      ["refresh", "restart", "reload", "index", "cache", "not loaded"],
    ],
  },
  {
    caseId: "case-e-full-long-context-continuation",
    name: "Full long-context continuation",
    sessionId: "session-autoresearch-full-long-context",
    transcript: "Summarize the actual current state and the next safest action.",
    expectedHistoryLength: 615,
    previousHistory: makeFullLongContextHistory(),
    response: "Current state: the stream-topic-inventory skill file exists on disk and parses, but the current app session still does not expose it in the active skills registry. Unknown: whether a refresh path is enough or a full app restart is required. Latest blocker: load_skill_instructions cannot see the skill from the in-memory registry. Next safest action: fully quit/reopen DotAgents, start a new session, and verify the skill appears before using it.",
    requiredPromptEvidence: [
      "[Older context: 609 omitted.]",
      "out.txt and out.srt",
      "i started a new session to try and it didnt find the skill",
      "skillsService active list does not include stream-topic-inventory",
      "filesystem_skill_exists= True",
      "Summarize the actual current state and the next safest action.",
    ],
    requiredResponseEvidence: ["Current state:", "Unknown:", "Latest blocker:", "Next safest action:", "active skills registry"],
    requiredLiveResponseEvidence: [
      ["exists on disk", "filesystem", "on disk"],
      ["registry", "available skills", "load mismatch"],
      ["refresh", "restart", "reload", "quit", "reopen", "new session"],
      ["next safest action", "next safe action"],
    ],
  },
  {
    caseId: "case-f-harness-agent-not-model-correction",
    name: "Harness framing correction after completion summary",
    sessionId: "session-autoresearch-harness-agent-correction",
    transcript: "i think harness engineering is the system around the \"agent\" not the model (similar for context engineering). can you verify or debate",
    expectedHistoryLength: 89,
    previousHistory: makeHarnessAgentContextCorrectionHistory(),
    response: "You are right to tighten it: the more precise workshop framing is that harness engineering is the system around the agent or agentic loop, not just the model. Model is acceptable shorthand for a general audience, but it blurs the layers. Prompt engineering shapes one model call, Context engineering shapes what the model or agent sees at runtime, and Harness engineering shapes the loop around agent work: tools, state, permissions, evals, traces, retries, stop rules, and feedback.",
    requiredPromptEvidence: [
      "Harness engineering = designing the repeatable system around the model",
      "[exa:web_search_advanced_exa] [summarized]",
      "That summary is not a user-facing answer",
      "i think harness engineering is the system around the \"agent\" not the model",
    ],
    requiredResponseEvidence: [
      "You are right",
      "agentic loop",
      "not just the model",
      "Model is acceptable shorthand",
      "Prompt engineering",
      "Context engineering",
      "Harness engineering",
    ],
    forbiddenPromptEvidence: ["STALE_LONG_CONTEXT_SHOULD_NOT_REPLAY"],
    allowCompletionToolInPrompt: true,
    requiredLiveResponseEvidence: [
      ["agent", "agentic loop", "agent loop"],
      ["not just the model", "not the model", "model is shorthand", "model shorthand"],
      ["prompt engineering"],
      ["context engineering"],
      ["harness engineering"],
    ],
  },
  {
    caseId: "case-g-prior-conversations-before-unavailable",
    name: "Prior conversations before saying unavailable",
    sessionId: "session-autoresearch-prior-conversations-unavailable",
    transcript: "you didn't think to look in past conversations? i'm not asking you to do it now, let's just debug the main issue",
    expectedHistoryLength: 71,
    previousHistory: makePriorConversationsBeforeUnavailableHistory(),
    response: "You're right: I should not have concluded the workshop title decision was unavailable after only checking knowledge notes and files. For this kind of local project-memory question, the lookup order should be: check knowledge notes, then search prior conversations, then inspect likely files. If I don't search prior conversations, I should say that explicitly instead of claiming the information is unavailable.",
    requiredPromptEvidence: [
      "what did we decide about the workshop title?",
      "Harness Engineering - Distilled Workshop Notes",
      "I do not see a clear prior decision about the workshop title",
      "you didn't think to look in past conversations?",
    ],
    requiredResponseEvidence: [
      "You're right",
      "knowledge notes",
      "prior conversations",
      "files",
      "unavailable",
    ],
    forbiddenPromptEvidence: ["STALE_LONG_CONTEXT_SHOULD_NOT_REPLAY"],
    allowCompletionToolInPrompt: true,
    requiredLiveResponseEvidence: [
      ["You're right", "you are right", "I should not have concluded", "shouldn't have concluded", "before saying unavailable", "before concluding unavailable", "should have checked", "I missed", "mistake", "premature", "couldn't confirm", "could not confirm", "didn't have a confirmed answer"],
      ["prior conversations", "past conversations", "conversation history", "chat history"],
      ["knowledge notes", "knowledge"],
      ["files", "local files", "Documents"],
      ["unavailable", "don't have it", "do not have it", "can't find it", "cannot find it"],
    ],
  },
  {
    caseId: "case-h-initial-conversation-review-path",
    name: "Initial conversation review must resolve the real store",
    sessionId: "session-autoresearch-initial-conversation-review-path",
    transcript: "debug the main issue: the initial conversation-review query should have checked the real app.dotagents conversations store before reporting zero conversations",
    expectedHistoryLength: 67,
    previousHistory: makeInitialConversationReviewPathHistory(),
    response: "The main issue is the initial conversation-review query itself: it resolved the wrong conversations store. A regression case should prove the agent checks the real app.dotagents app-data store and actual conversation files or index before reporting zero conversations. It should fail if the agent only scans ~/Library/Application Support/dotagents/conversations, sees empty 4h, 24h, and 7d windows, and records a no-op.",
    requiredPromptEvidence: [
      "Review recent DotAgents conversations and promote only durable",
      "Recent conversation files from the DotAgents conversations store",
      "APPDIR=/Users/ajjoobandi/Library/Application Support/dotagents/conversations",
      "WINDOW 4 count=0",
      "prior audit used ~/Library/Application Support/app.dotagents/conversations",
      "No-op. I searched the required 4h, 24h, and 7d windows",
      "debug the main issue: the initial conversation-review query should have checked the real app.dotagents conversations store before reporting zero conversations",
    ],
    requiredResponseEvidence: [
      "initial conversation-review query itself",
      "app.dotagents",
      "zero conversations",
      "4h, 24h, and 7d",
      "no-op",
    ],
    forbiddenPromptEvidence: ["STALE_LONG_CONTEXT_SHOULD_NOT_REPLAY"],
    allowCompletionToolInPrompt: true,
    requiredLiveResponseEvidence: [
      ["initial query", "initial request", "initial conversation-review", "original query"],
      ["conversations store", "conversation files", "conversation index", "index.json", "conv_"],
      ["app.dotagents", "correct app-data path", "real app-data path", "actual app-data path", "right app-data path"],
      ["4h, 24h, and 7d", "4h/24h/7d", "4-hour, 24-hour, and 7-day", "last 4 hours, 24 hours, and 7 days"],
      ["no-op", "zero conversations", "claiming zero", "reporting zero", "before saying zero"],
    ],
  },
]
