---
sidebar_position: 3
sidebar_label: "Command Queue"
---

# Multi-Agent Command Queue

A keyboard-driven coordination mode for running multiple agents at once. Cycle through every session through a single adaptive input bar — dispatch new agents, steer running ones, and reply to completed ones without manually switching context.

---

## When to use it

You're running 3+ agents in parallel and want to:

- Dispatch several new tasks back-to-back
- Send mid-run guidance to running agents ("focus on X first")
- Reply to each agent's report in the order they finish

Without the queue, this requires clicking between sessions, hunting for the right composer, and remembering whose turn is next. With the queue, one input bar adapts to whichever session is "in focus" and `Ctrl+]` (`⌘+]` on macOS) advances.

## How to enter

| Method                                    | Where                                          |
| ----------------------------------------- | ---------------------------------------------- |
| **`Ctrl+Shift+K`** (`⌘+Shift+K` on macOS) | From anywhere in the app                       |
| Click the **Layers icon**                 | Sidebar header, next to the New Session button |

The bar appears at the bottom of the main panel and stays visible until you exit.

## The three modes

The bar's label, color, and submit button change based on what the current session needs:

| State                   | Action               | What it does                             |
| ----------------------- | -------------------- | ---------------------------------------- |
| Session not yet created | **Dispatch** (green) | Spawns a new agent with your text        |
| Running / mid-task      | **Steer** (blue)     | Sends a guidance message to a live agent |
| Complete / needs input  | **Reply** (violet)   | Continues the conversation               |

The queue auto-seeds with one entry per active session (sorted: `needs_input` first, then `complete`, then `running`) plus one trailing **Dispatch** slot for new agents. As sessions complete during the session, the queue auto-promotes `steer` → `reply`.

## Keyboard shortcuts

All shortcuts work while the input is focused.

| Shortcut                     | Action                                       |
| ---------------------------- | -------------------------------------------- |
| `Ctrl+Shift+K` / `⌘+Shift+K` | Enter or exit the queue                      |
| `Ctrl+]` / `⌘+]`             | Advance to next entry                        |
| `Ctrl+[` / `⌘+[`             | Go back to previous entry                    |
| `Enter`                      | Submit current message and advance           |
| `Shift+Enter`                | New line in the input                        |
| `Ctrl+N` / `⌘+N`             | Append a new dispatch slot at the end        |
| `Ctrl+S` / `⌘+S`             | Skip current entry (rotate to back of queue) |
| `Esc`                        | Clear input — second press exits the queue   |

## Auto-advance and routing

When you submit:

- The message routes to whatever session the current entry points at
- For `new` entries, the standard session-creation dialog opens, and the queue advances after the new session is dispatched
- The next pending session becomes the focused tile in the sidebar, so the rest of the UI follows along

## Skip vs. Hold

- **Skip** (`Ctrl+S`) rotates the current entry to the end of the queue — you'll see it again after everyone else
- **Exit** (`Esc` on an empty input) drops the queue entirely; sessions are unaffected

Both are safe: nothing is lost. Open the queue again later and any sessions still in need of input will reappear.

## Mobile

The same queue is available in the mobile app via the **Layers button** in the chat list header. Tap to enter; the bar slides up over the chat composer. The session-cycling controls (◀ ▶ ⇥ + ✕) live in the bar's header row.

## Related

- **[Keyboard Shortcuts](../configuration/shortcuts)** — full hotkey reference
- **[Desktop Overview](./overview)** — full desktop feature set
- **[Agent Delegation](../agents/delegation)** — how parent agents spawn subagents (the queue surfaces those too)
