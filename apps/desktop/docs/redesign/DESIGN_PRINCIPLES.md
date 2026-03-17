# Design Principles

## 1. Progress over prose

Prefer showing:

- plan state
- active step
- action history
- tool usage
- blockers
- approvals
- artifacts
- diffs
- verification results

before showing long assistant narration.

If a paragraph can become a status label, checklist item, card, or diff, it probably should.

## 2. Task-first, chat-second

The default screen should orient around the current run, not the transcript.

Chat remains essential for:

- initial instruction
- follow-up guidance
- corrections
- clarifications
- nuanced discussion

But the transcript should not be forced to carry every other kind of state.

## 3. Interruptibility everywhere

Every active run should support:

- pause
- stop
- redirect
- reprioritize
- approve / deny
- continue later

Interruptibility should feel native, not like an emergency escape hatch.

## 4. Trust through visible action

Users trust systems more when they can inspect what happened.

Expose:

- tool calls
- command summaries
- file paths touched
- websites visited
- approval gates crossed
- verification outcomes

Do not require users to read a dense transcript to infer behavior.

## 5. Human review is part of done

A task is not truly complete when the model stops generating. A task is complete when the output has reached an appropriate review state.

Examples:

- code has a readable diff
- an email is ready to send
- a document draft is ready to edit
- research is summarized with sources
- browser automation succeeded with a verifiable outcome

## 6. Progressive disclosure of complexity

New users should be able to accomplish simple work quickly.
Power users should be able to inspect the full machinery.

This suggests a layered interface:

- simple summary by default
- expandable detail for actions and logs
- expert views for traces, raw tool events, and advanced controls

## 7. Preserve momentum

The UI should minimize dead ends and context resets.

The system should always make it obvious how to:

- continue the current task
- branch the task
n- refine the result
- resume from interruption
- rerun with adjustments

## 8. Make risk explicit

Risk should be visible before damage occurs.

Highlight:

- destructive tool usage
- external side effects
- low confidence areas
- blocked authentication
- ambiguous intent
- stale context

## 9. Support multiple attention levels

The interface should work for:

- deep supervision
- quick glances
- later review

Status cards, notifications, and concise summaries are necessary because users will not always read linearly.

## 10. Artifacts matter more than narration

Whenever possible, elevate concrete outputs above explanatory text.

Examples:

- file diff over "I edited the file"
- command result over "I ran a command"
- created issue card over "I opened an issue"
- source list over "I researched the topic"
