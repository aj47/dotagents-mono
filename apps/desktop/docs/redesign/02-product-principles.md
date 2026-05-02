# Product Principles

## Primary design principles

### 1. Task-first, chat-second
The main screen should orient around the active task/run. Chat should remain available for steering and clarification, but should not dominate the whole experience.

### 2. Legibility over cleverness
The system should make actions, progress, and state obvious. The interface should prefer clear labels, explicit statuses, and direct controls over novelty.

### 3. Show state transitions clearly
Agent systems move through phases: queued, planning, running, waiting, blocked, completed, failed, verifying. These states should be visible and meaningful.

### 4. Every autonomous action should leave evidence
If the system searched, clicked, edited, emailed, or executed, there should be a visible record the user can inspect.

### 5. Interruptibility everywhere
Users should be able to stop, pause, redirect, or take over without feeling like they broke the system.

### 6. Review before celebration
Completion UI should foreground artifacts, diffs, and verification before polished assistant copy.

### 7. Progressive trust
Start with more visibility and more approvals. As trust grows, the user can loosen controls. The UI should support this progression.

### 8. Human intervention is success, not failure
The product should normalize handoffs, clarifications, and corrections. Users should not feel punished for steering the system.

### 9. Multiple time horizons must coexist
The product needs to support:

- immediate command-and-response tasks
- medium-length interactive runs
- long-running background work
- recurring loops and automation

### 10. The system should feel calm under activity
Even when many agents are running, the UI should remain structured, scannable, and quiet.

## Product non-goals

### 1. Do not optimize for endless transcript reading
Long, undifferentiated chat logs create cognitive overload.

### 2. Do not bury important controls in settings
Approval mode, stop, verify, and intervention should be near live work.

### 3. Do not make the user infer system state from prose
A sentence is not a status model.

### 4. Do not confuse aesthetic polish with trust
Beautiful gradients do not compensate for poor inspectability.

### 5. Do not force one mental model onto every task
Quick asks, coding runs, browser automation, scheduled loops, and multi-agent orchestration are different behaviors and should feel appropriately different.

## Experience pillars

### Direct work
Users can state a goal and launch work quickly.

### Watch work
Users can see what is happening without reading everything.

### Shape work
Users can adjust path and autonomy while work is live.

### Review work
Users can inspect evidence and outcomes before accepting.

### Resume work
Users can come back later and understand state immediately.
