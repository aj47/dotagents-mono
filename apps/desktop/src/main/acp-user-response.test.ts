import test from "node:test"
import assert from "node:assert/strict"

import { deriveAcpUserResponseState, type ConversationHistoryMessage } from "./acp-user-response"

test("ignores respond_to_user messages from previous ACP runs", () => {
  const history: ConversationHistoryMessage[] = [
    { role: "user", content: "Earlier prompt", timestamp: 1 },
    {
      role: "assistant",
      content: "",
      timestamp: 2,
      toolCalls: [{ id: "old", name: "respond_to_user", arguments: { text: "Old answer" } }],
    },
    { role: "user", content: "Fresh follow-up", timestamp: 3 },
  ]

  const state = deriveAcpUserResponseState(history, 3)
  assert.equal(state.userResponse, undefined)
  assert.equal(state.userResponseHistory, undefined)
})

test("tracks only current-run ACP respond_to_user history after the run start index", () => {
  const history: ConversationHistoryMessage[] = [
    { role: "user", content: "Earlier prompt", timestamp: 1 },
    {
      role: "assistant",
      content: "",
      timestamp: 2,
      toolCalls: [{ id: "old", name: "respond_to_user", arguments: { text: "Old answer" } }],
    },
    { role: "user", content: "Fresh follow-up", timestamp: 3 },
    {
      role: "assistant",
      content: "",
      timestamp: 4,
      toolCalls: [{ id: "new-1", name: "dotagents-builtin:respond_to_user", arguments: { text: "First update" } }],
    },
    {
      role: "assistant",
      content: "",
      timestamp: 5,
      toolCalls: [{ id: "new-2", name: "tool: respond_to_user", arguments: { text: "First update" } }],
    },
    {
      role: "assistant",
      content: "",
      timestamp: 6,
      toolCalls: [{ id: "new-3", name: "respond_to_user", arguments: { text: "Final update" } }],
    },
  ]

  const state = deriveAcpUserResponseState(history, 3)
  assert.equal(state.userResponse, "Final update")
  assert.deepEqual(state.userResponseHistory, ["First update"])
})