# Migration Plan

## Strategy

Do not attempt a full rewrite all at once. The current product already contains useful primitives: sessions, active agent state, progress displays, summaries, sidebars, and settings surfaces. The redesign should reuse these where possible while changing the information hierarchy and default layout.

## Phase 1 — Document the new mental model

Deliverables:

- philosophy docs
- object model alignment
- agreed run states
- wireframes
- terminology cleanup

Outcome:
A shared language for design and engineering.

## Phase 2 — Introduce task-centric framing without breaking existing flows

Potential changes:

- rename key UI labels from session/chat-oriented terms to task/run-oriented terms where appropriate
- add a run summary header above the current transcript/progress view
- add explicit current step and review state surfaces
- add structured artifacts panel

Outcome:
Users begin to experience the product as work execution rather than pure chat.

## Phase 3 — Split workspace into distinct sections

Potential changes:

- create stable tabs or panels for Overview, Activity, Artifacts, Chat, Verification
- move approvals out of transcript-only rendering
- create a persistent steering input separate from scrollback

Outcome:
Execution and review states become easier to scan and control.

## Phase 4 — Rebuild multi-session view into work queue

Potential changes:

- replace session-gallery feeling with grouped work states
- add statuses like awaiting approval, needs review, blocked
- improve summary cards for each run

Outcome:
The overview becomes an operations surface instead of a chat collection.

## Phase 5 — Make review a first-class completion state

Potential changes:

- add review-ready completion cards
- expose verification summary and artifacts prominently
- add explicit approve / revise / continue controls

Outcome:
"Done" becomes a real handoff instead of a terminal message.

## Phase 6 — Tighten terminology and defaults

Potential changes:

- align copy across desktop and mobile where relevant
- make task/run views the default starting point
- relegate transcript to a secondary tab or panel

Outcome:
The product communicates its true model clearly and consistently.

## Suggested implementation checkpoints

- confirm which existing store concepts already map to task/run/step states
- audit current components that can be repurposed for overview cards, activity feeds, and artifact panels
- identify where completion, approval, and verification data currently live
- define any missing state required to support review-first completion

## Risks

### Risk: Over-rotating away from chat
Mitigation: preserve chat as a first-class secondary surface.

### Risk: Too much complexity for simple use cases
Mitigation: default to a clean overview with progressive disclosure.

### Risk: Data model mismatch
Mitigation: align terminology and internal state incrementally before deep UI rewrites.

### Risk: Cross-platform inconsistency
Mitigation: document which patterns should later carry to mobile and which remain desktop-specific.
