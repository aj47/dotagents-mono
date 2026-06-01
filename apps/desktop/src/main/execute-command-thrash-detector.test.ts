import { describe, expect, it } from "vitest"
import {
  EXECUTE_COMMAND_THRASH_NUDGE_TEXT,
  ExecuteCommandThrashDetector,
  extractExecuteCommandObservation,
} from "./execute-command-thrash-detector"
import type { MCPToolCall, MCPToolResult } from "./mcp-service"

function executeCommandCall(command: string): MCPToolCall {
  return { name: "execute_command", arguments: { command } }
}

function executeCommandSuccess(payload: {
  command: string
  cwd?: string
  stdout?: string
  outputTruncated?: boolean
}): MCPToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          success: true,
          command: payload.command,
          cwd: payload.cwd ?? "/repo",
          stdout: payload.stdout ?? "ok",
          stderr: "",
          ...(payload.outputTruncated ? { outputTruncated: true } : {}),
        }),
      },
    ],
    isError: false,
  }
}

describe("extractExecuteCommandObservation", () => {
  it("returns undefined for non-execute_command tool calls", () => {
    const obs = extractExecuteCommandObservation(
      { name: "read_more_context", arguments: {} },
      executeCommandSuccess({ command: "head foo.txt" }),
    )
    expect(obs).toBeUndefined()
  })

  it("returns undefined when the tool result is an error", () => {
    const errored: MCPToolResult = {
      content: [{ type: "text", text: JSON.stringify({ success: false, error: "boom" }) }],
      isError: true,
    }
    expect(extractExecuteCommandObservation(executeCommandCall("ls"), errored)).toBeUndefined()
  })

  it("flags outputTruncated:true in the structured payload", () => {
    const obs = extractExecuteCommandObservation(
      executeCommandCall("head -n 100000 build/forms.pdf"),
      executeCommandSuccess({
        command: "head -n 100000 build/forms.pdf",
        outputTruncated: true,
      }),
    )
    expect(obs).toEqual(
      expect.objectContaining({
        outputTruncated: true,
        domainKey: expect.stringContaining("forms.pdf"),
      }),
    )
  })

  it("flags the inline [OUTPUT TRUNCATED:...] marker when the flag is missing", () => {
    const obs = extractExecuteCommandObservation(
      executeCommandCall("cat report.json"),
      executeCommandSuccess({
        command: "cat report.json",
        stdout: "start\n\n... [OUTPUT TRUNCATED: 4321 bytes, ~120 lines total. ...] ...\n\nend",
      }),
    )
    expect(obs?.outputTruncated).toBe(true)
  })

  it("returns outputTruncated=false for a normal short success", () => {
    const obs = extractExecuteCommandObservation(
      executeCommandCall("ls"),
      executeCommandSuccess({ command: "ls", stdout: "a\nb\nc" }),
    )
    expect(obs).toEqual({ outputTruncated: false, domainKey: expect.any(String) })
  })

  it("falls back to regex scanning when the payload is not a parseable JSON object", () => {
    const result: MCPToolResult = {
      content: [
        {
          type: "text",
          text: 'free-form text "success": true some prose "outputTruncated": true blah',
        },
      ],
      isError: false,
    }
    const obs = extractExecuteCommandObservation(executeCommandCall("ls"), result)
    expect(obs?.outputTruncated).toBe(true)
  })

  it("derives a domain key from cwd + file basenames in the command", () => {
    const a = extractExecuteCommandObservation(
      executeCommandCall("head -n 200 /tmp/forms/I-130A.pdf"),
      executeCommandSuccess({ command: "head -n 200 /tmp/forms/I-130A.pdf", cwd: "/work" }),
    )
    const b = extractExecuteCommandObservation(
      executeCommandCall("tail -n 50 /tmp/forms/I-130A.pdf"),
      executeCommandSuccess({ command: "tail -n 50 /tmp/forms/I-130A.pdf", cwd: "/work" }),
    )
    expect(a?.domainKey).toBeDefined()
    expect(a?.domainKey).toBe(b?.domainKey)
  })
})

describe("ExecuteCommandThrashDetector", () => {
  it("does not thrash on a single truncated execute_command", () => {
    const detector = new ExecuteCommandThrashDetector()
    detector.record({ outputTruncated: true, domainKey: "/repo::a" })
    expect(detector.evaluate()).toEqual(
      expect.objectContaining({ thrashing: false, truncatedCount: 1 }),
    )
  })

  it("triggers the synthesize nudge after 3 truncated execute_command results", () => {
    const detector = new ExecuteCommandThrashDetector()
    detector.recordBatch([
      { outputTruncated: true, domainKey: "/repo::a" },
      { outputTruncated: true, domainKey: "/repo::b" },
      { outputTruncated: true, domainKey: "/repo::c" },
    ])
    const evaluation = detector.evaluate()
    expect(evaluation.thrashing).toBe(true)
    expect(evaluation.reason).toBe("truncated")
    expect(evaluation.message).toBe(EXECUTE_COMMAND_THRASH_NUDGE_TEXT)
  })

  it("triggers the nudge for repeated inspection of the same domain even without truncation", () => {
    const detector = new ExecuteCommandThrashDetector()
    const sameKey = "/work::i-130a.pdf"
    for (let i = 0; i < 5; i++) {
      detector.record({ outputTruncated: false, domainKey: sameKey })
    }
    const evaluation = detector.evaluate()
    expect(evaluation.thrashing).toBe(true)
    expect(evaluation.reason).toBe("domain-overlap")
    expect(evaluation.domainCount).toBeGreaterThanOrEqual(5)
  })

  it("does not thrash when 2 truncated results are interleaved with successful narrow commands", () => {
    const detector = new ExecuteCommandThrashDetector()
    detector.recordBatch([
      { outputTruncated: true, domainKey: "/repo::a" },
      { outputTruncated: false, domainKey: "/repo::b" },
      { outputTruncated: true, domainKey: "/repo::c" },
      { outputTruncated: false, domainKey: "/repo::d" },
    ])
    expect(detector.evaluate().thrashing).toBe(false)
  })

  it("does not thrash on a diverse sequence of narrow, non-truncated commands", () => {
    const detector = new ExecuteCommandThrashDetector()
    for (let i = 0; i < 6; i++) {
      detector.record({ outputTruncated: false, domainKey: `/repo::file-${i}` })
    }
    expect(detector.evaluate().thrashing).toBe(false)
  })

  it("clears its window after markNudged so it doesn't double-fire next iteration", () => {
    const detector = new ExecuteCommandThrashDetector()
    detector.recordBatch([
      { outputTruncated: true, domainKey: "/repo::a" },
      { outputTruncated: true, domainKey: "/repo::b" },
      { outputTruncated: true, domainKey: "/repo::c" },
    ])
    expect(detector.evaluate().thrashing).toBe(true)
    detector.markNudged(7)
    expect(detector.wasNudgedAtIteration(7)).toBe(true)
    expect(detector.evaluate().thrashing).toBe(false)

    detector.record({ outputTruncated: true, domainKey: "/repo::d" })
    expect(detector.evaluate().thrashing).toBe(false)
  })

  it("ages old observations out of the window so historic thrash does not pin the nudge", () => {
    const detector = new ExecuteCommandThrashDetector()
    detector.recordBatch([
      { outputTruncated: true, domainKey: "/repo::a" },
      { outputTruncated: true, domainKey: "/repo::b" },
      { outputTruncated: true, domainKey: "/repo::c" },
    ])
    expect(detector.evaluate().thrashing).toBe(true)
    detector.markNudged(1)

    // After the nudge resets the window, a long stretch of productive narrow
    // commands should keep the detector quiet.
    for (let i = 0; i < 8; i++) {
      detector.record({ outputTruncated: false, domainKey: `/repo::next-${i}` })
    }
    expect(detector.evaluate().thrashing).toBe(false)
  })
})
