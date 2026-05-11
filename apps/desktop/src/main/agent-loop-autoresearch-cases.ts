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
    { role: "tool", content: "[execute_command] {\"success\":true,\"stdout\":\"read-only context gathering complete; no downloads, writes, or clipping started\"}" },
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

export const autoresearchContinuationCases: AutoresearchContinuationCase[] = [
  {
    caseId: "case-a-approval-boundary",
    name: "Approval boundary after context gathering",
    sessionId: "session-autoresearch-approval-boundary",
    transcript: "Continue from here. What should you do next?",
    expectedHistoryLength: 13,
    previousHistory: makeApprovalBoundaryHistory(),
    response: "Known: this is TechFren-related and the local techfren-recap-remotion project exists. Unknown: the exact latest livestream/VOD URL. Blocker: approval is required before downloads, transcription, clipping, or file changes. Next safe action: read notes/conversations to recover the exact VOD link, then present the plan for approval before any mutating step.",
    requiredPromptEvidence: [
      "[Older context: 7 omitted.]",
      "ask for my approval before you actually make any changes",
      "TechFren notes found",
      "no exact latest VOD URL confirmed",
      "Continue from here. What should you do next?",
    ],
    requiredResponseEvidence: ["Known:", "Unknown:", "Blocker:", "Next safe action:", "approval"],
    requiredLiveResponseEvidence: [
      ["VOD URL", "livestream link", "latest livestream", "latest stream URL", "stream URL"],
      ["approval", "before downloads", "before any mutating"],
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
]
