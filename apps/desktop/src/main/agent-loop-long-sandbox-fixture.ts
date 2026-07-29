export const LONG_AGENT_LOOP_SANDBOX_DELAY_MS = 12_500

export const LONG_AGENT_LOOP_REQUIRED_TOOL_SEQUENCE = [
  "list_cases",
  "read_case_file",
  "search_case_notes",
  "read_run_log",
  "summarize_findings",
] as const

export type LongAgentLoopSandboxPacketId = "aurora" | "boreal" | "cedar"

type SandboxCandidate = {
  id: string
  label: string
  caseIds: string[]
  channel: string
  caseFile: string
  runLog: string
}

type SandboxPacket = {
  id: LongAgentLoopSandboxPacketId
  title: string
  winningCandidateId: string
  receipt: string
  hiddenToken: string
  hiddenConstraints: string[]
  candidates: SandboxCandidate[]
}

type SandboxToolResult = {
  content: Array<{ type: "text"; text: string }>
  isError?: boolean
}

export type LongAgentLoopSandboxToolState = {
  calledTools: Set<string>
}

export const longAgentLoopSandboxPackets: Record<LongAgentLoopSandboxPacketId, SandboxPacket> = {
  aurora: {
    id: "aurora",
    title: "Aurora service release packet",
    winningCandidateId: "RC-A17",
    receipt: "FINAL_AUDIT_RECEIPT=AURORA-RC-A17-VEGA",
    hiddenToken: "HIDDEN_CONSTRAINT_TOKEN=AURORA-LOCK-771",
    hiddenConstraints: [
      "Must preserve migration lockfile hash LOCK-AUR-771.",
      "Must include the iad-fallback routing guard.",
      "Must pass the zephyr-green audit lane.",
    ],
    candidates: [
      {
        id: "RC-A17",
        label: "Aurora candidate A17",
        caseIds: ["CASE-AUR-104", "CASE-AUR-118"],
        channel: "canary-ring-2",
        caseFile: [
          "CASE-AUR-104: migration lockfile hash LOCK-AUR-771 is preserved.",
          "CASE-AUR-118: iad-fallback routing guard is enabled for regional failover.",
          "Candidate note: rollout channel canary-ring-2 has no unresolved blocker.",
        ].join("\n"),
        runLog: [
          "run=AUR-2026-05-rc-a17",
          "zephyr-green audit lane: pass",
          "latency budget: 184ms p95",
          "regression pack: pass",
        ].join("\n"),
      },
      {
        id: "RC-A28",
        label: "Aurora candidate A28",
        caseIds: ["CASE-AUR-205"],
        channel: "canary-ring-4",
        caseFile: "CASE-AUR-205: migration lockfile hash changed to LOCK-AUR-778.",
        runLog: "run=AUR-2026-05-rc-a28\nzephyr-green audit lane: fail\nregional failover: skipped",
      },
    ],
  },
  boreal: {
    id: "boreal",
    title: "Boreal worker release packet",
    winningCandidateId: "RC-B42",
    receipt: "FINAL_AUDIT_RECEIPT=BOREAL-RC-B42-NOVA",
    hiddenToken: "HIDDEN_CONSTRAINT_TOKEN=BOREAL-CACHE-314",
    hiddenConstraints: [
      "Must retain cache seed CACHE-BOR-314.",
      "Must prove the oslo-shadow replay finished cleanly.",
      "Must include the atlas-blue signer attestation.",
    ],
    candidates: [
      {
        id: "RC-B42",
        label: "Boreal candidate B42",
        caseIds: ["CASE-BOR-302", "CASE-BOR-319"],
        channel: "worker-ring-1",
        caseFile: [
          "CASE-BOR-302: cache seed CACHE-BOR-314 retained across restart.",
          "CASE-BOR-319: atlas-blue signer attestation is attached.",
          "Candidate note: worker-ring-1 drain completed without orphaned jobs.",
        ].join("\n"),
        runLog: [
          "run=BOR-2026-05-rc-b42",
          "oslo-shadow replay: pass",
          "queue drain: pass",
          "signer attestation: atlas-blue",
        ].join("\n"),
      },
      {
        id: "RC-B31",
        label: "Boreal candidate B31",
        caseIds: ["CASE-BOR-211"],
        channel: "worker-ring-3",
        caseFile: "CASE-BOR-211: cache seed CACHE-BOR-309 retained, not CACHE-BOR-314.",
        runLog: "run=BOR-2026-05-rc-b31\noslo-shadow replay: fail\nsigner attestation: atlas-blue",
      },
    ],
  },
  cedar: {
    id: "cedar",
    title: "Cedar desktop release packet",
    winningCandidateId: "RC-C09",
    receipt: "FINAL_AUDIT_RECEIPT=CEDAR-RC-C09-LUMA",
    hiddenToken: "HIDDEN_CONSTRAINT_TOKEN=CEDAR-PANEL-909",
    hiddenConstraints: [
      "Must keep panel session key PANEL-CED-909 stable while switching sessions.",
      "Must pass the tahoe-silver renderer responsiveness lane.",
      "Must preserve config merge marker MERGE-CED-612.",
    ],
    candidates: [
      {
        id: "RC-C09",
        label: "Cedar candidate C09",
        caseIds: ["CASE-CED-501", "CASE-CED-612"],
        channel: "desktop-ring-0",
        caseFile: [
          "CASE-CED-501: panel session key PANEL-CED-909 remains stable during session switching.",
          "CASE-CED-612: config merge marker MERGE-CED-612 is preserved.",
          "Candidate note: desktop-ring-0 includes the latest history renderer patch.",
        ].join("\n"),
        runLog: [
          "run=CED-2026-05-rc-c09",
          "tahoe-silver renderer responsiveness lane: pass",
          "session switching probe: pass",
          "history placement audit: pass",
        ].join("\n"),
      },
      {
        id: "RC-C15",
        label: "Cedar candidate C15",
        caseIds: ["CASE-CED-518"],
        channel: "desktop-ring-2",
        caseFile: "CASE-CED-518: panel session key PANEL-CED-900 observed during session switching.",
        runLog: "run=CED-2026-05-rc-c15\ntahoe-silver renderer responsiveness lane: pass\nhistory placement audit: fail",
      },
    ],
  },
}

export function createLongAgentLoopSandboxToolState(): LongAgentLoopSandboxToolState {
  return { calledTools: new Set<string>() }
}

export function getLongAgentLoopSandboxPacket(packetId: string): SandboxPacket {
  const packet = longAgentLoopSandboxPackets[packetId as LongAgentLoopSandboxPacketId]
  if (!packet) {
    throw new Error(`Unknown long agent-loop sandbox packet: ${packetId}`)
  }
  return packet
}

export function getLongAgentLoopSandboxToolDefinitions() {
  return [
    {
      name: "list_cases",
      description: "List release candidates and visible case IDs in the sandbox packet.",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "read_case_file",
      description: "Read the visible case file for one release candidate.",
      inputSchema: {
        type: "object",
        properties: {
          candidateId: { type: "string", description: "Candidate ID such as RC-A17." },
        },
        required: ["candidateId"],
      },
    },
    {
      name: "search_case_notes",
      description: "Search hidden packet notes for release constraints.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query for hidden release constraints." },
        },
        required: ["query"],
      },
    },
    {
      name: "read_run_log",
      description: "Read the synthetic run log for one release candidate.",
      inputSchema: {
        type: "object",
        properties: {
          candidateId: { type: "string", description: "Candidate ID such as RC-A17." },
        },
        required: ["candidateId"],
      },
    },
    {
      name: "summarize_findings",
      description: "Summarize whether one candidate satisfies the hidden constraints.",
      inputSchema: {
        type: "object",
        properties: {
          candidateId: { type: "string", description: "Candidate ID to summarize." },
          evidence: { type: "string", description: "Short evidence collected from prior tool calls." },
        },
        required: ["candidateId", "evidence"],
      },
    },
    {
      name: "write_final_audit",
      description: "Write the final sandbox audit and return the receipt for the correct candidate.",
      inputSchema: {
        type: "object",
        properties: {
          candidateId: { type: "string", description: "Candidate ID selected as the release candidate." },
          rationale: { type: "string", description: "Evidence-based rationale with case IDs." },
        },
        required: ["candidateId", "rationale"],
      },
    },
  ] as const
}

function makeTextResult(payload: unknown, isError = false): SandboxToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    isError,
  }
}

function findCandidate(packet: SandboxPacket, candidateId: unknown): SandboxCandidate | undefined {
  if (typeof candidateId !== "string") return undefined
  return packet.candidates.find((candidate) => candidate.id.toLowerCase() === candidateId.toLowerCase())
}

function missingPrerequisiteTools(state: LongAgentLoopSandboxToolState): string[] {
  return LONG_AGENT_LOOP_REQUIRED_TOOL_SEQUENCE.filter((toolName) => !state.calledTools.has(toolName))
}

async function delay(ms: number): Promise<void> {
  if (ms <= 0) return
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function executeLongAgentLoopSandboxTool(
  packetId: LongAgentLoopSandboxPacketId,
  toolName: string,
  args: Record<string, unknown> | undefined,
  options: {
    delayMs?: number
    state?: LongAgentLoopSandboxToolState
  } = {},
): Promise<SandboxToolResult> {
  const packet = getLongAgentLoopSandboxPacket(packetId)
  const state = options.state ?? createLongAgentLoopSandboxToolState()
  const delayMs = options.delayMs ?? LONG_AGENT_LOOP_SANDBOX_DELAY_MS

  await delay(delayMs)

  if (toolName === "write_final_audit") {
    const missingTools = missingPrerequisiteTools(state)
    state.calledTools.add(toolName)
    if (missingTools.length > 0) {
      return makeTextResult({
        ok: false,
        packetId: packet.id,
        error: "Final audit is not available until the discovery tools have been used.",
        missingTools,
      }, true)
    }

    const candidate = findCandidate(packet, args?.candidateId)
    if (!candidate) {
      return makeTextResult({
        ok: false,
        packetId: packet.id,
        error: `Unknown candidate: ${String(args?.candidateId ?? "")}`,
      }, true)
    }

    const isWinner = candidate.id === packet.winningCandidateId
    return makeTextResult({
      ok: isWinner,
      packetId: packet.id,
      selectedCandidateId: candidate.id,
      winningCandidateId: packet.winningCandidateId,
      receipt: isWinner ? packet.receipt : undefined,
      hiddenToken: isWinner ? packet.hiddenToken : undefined,
      caseIds: candidate.caseIds,
      rationaleRequiredInFinalAnswer: isWinner
        ? `Answer with ${packet.receipt}, ${candidate.id}, ${candidate.caseIds.join(", ")}, and ${packet.hiddenToken}.`
        : "Selected candidate does not satisfy all hidden fixture constraints.",
      constraints: isWinner ? packet.hiddenConstraints : undefined,
    }, !isWinner)
  }

  state.calledTools.add(toolName)

  if (toolName === "list_cases") {
    return makeTextResult({
      packetId: packet.id,
      title: packet.title,
      candidates: packet.candidates.map((candidate) => ({
        id: candidate.id,
        label: candidate.label,
        caseIds: candidate.caseIds,
        channel: candidate.channel,
      })),
      nextStep: "Read case files and hidden notes before choosing a release candidate.",
    })
  }

  if (toolName === "read_case_file") {
    const candidate = findCandidate(packet, args?.candidateId)
    if (!candidate) {
      return makeTextResult({ ok: false, error: `Unknown candidate: ${String(args?.candidateId ?? "")}` }, true)
    }
    return makeTextResult({
      packetId: packet.id,
      candidateId: candidate.id,
      caseIds: candidate.caseIds,
      caseFile: candidate.caseFile,
    })
  }

  if (toolName === "search_case_notes") {
    return makeTextResult({
      packetId: packet.id,
      query: String(args?.query ?? ""),
      hiddenToken: packet.hiddenToken,
      hiddenConstraints: packet.hiddenConstraints,
      note: "These constraints are intentionally absent from the user prompt.",
    })
  }

  if (toolName === "read_run_log") {
    const candidate = findCandidate(packet, args?.candidateId)
    if (!candidate) {
      return makeTextResult({ ok: false, error: `Unknown candidate: ${String(args?.candidateId ?? "")}` }, true)
    }
    return makeTextResult({
      packetId: packet.id,
      candidateId: candidate.id,
      runLog: candidate.runLog,
    })
  }

  if (toolName === "summarize_findings") {
    const candidate = findCandidate(packet, args?.candidateId)
    if (!candidate) {
      return makeTextResult({ ok: false, error: `Unknown candidate: ${String(args?.candidateId ?? "")}` }, true)
    }
    const isWinner = candidate.id === packet.winningCandidateId
    return makeTextResult({
      packetId: packet.id,
      candidateId: candidate.id,
      satisfiesHiddenConstraints: isWinner,
      expectedCandidateId: packet.winningCandidateId,
      caseIds: candidate.caseIds,
      hiddenToken: isWinner ? packet.hiddenToken : undefined,
      summary: isWinner
        ? `${candidate.id} satisfies the hidden constraints for ${packet.title}.`
        : `${candidate.id} is missing at least one hidden constraint for ${packet.title}.`,
      evidenceReceived: String(args?.evidence ?? ""),
    })
  }

  state.calledTools.add(toolName)
  return makeTextResult({ ok: false, packetId: packet.id, error: `Unknown sandbox tool: ${toolName}` }, true)
}
