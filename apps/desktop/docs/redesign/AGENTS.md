# AGENTS.md — `.agents` UI Redesign Guidance

This file is for contributors implementing or refining the redesign direction documented in this folder.

## Core instruction

Do not treat the desktop app as a chat app with extra panels. Treat it as a workspace for directing and reviewing autonomous work.

## Product truths

- The primary object is the **task / run**, not the message.
- The main user need is **trust**, not transcript beauty.
- The UI should answer: what is happening, why, what next, what risk, can I trust it.
- Review is part of completion.
- Chat is a steering surface, not the sole container for state.

## Implementation bias

When choosing between two designs, prefer the one that makes execution state, artifacts, approvals, or verification more legible.

Prefer:

- summary cards over long explanatory text
- explicit statuses over inferred statuses
- dedicated approval UI over transcript-only approval prompts
- artifact views over narrative descriptions of outputs
- persistent steering controls over requiring scrollback navigation

## Objects to preserve in the UI model

The redesign should make these concepts first-class where possible:

- task
- run
- step
- action
- artifact
- approval
- verification state
- review state

## Anti-patterns to avoid

- burying critical status inside chat bubbles
- using one endless transcript as the only source of truth
- hiding blockers until the user scrolls to find them
- representing completion as only a final assistant message
- making multi-run management feel like browsing old chats

## Preferred top-level workspace model

- left rail: run queue and status groups
- center: focused task workspace
- right rail: live activity, approvals, artifacts, and trust signals

## Current codebase notes

This app already contains useful primitives for sessions, progress, summaries, sidebars, and settings. Reuse existing concepts where they align, but evolve naming and hierarchy toward task-centric semantics.

## Cross-platform reminder

When making changes to the desktop renderer UI, consider whether equivalent patterns should exist in the mobile app at `apps/mobile/src/`.

Patterns most likely to need alignment:

- agent progress display
- completion and review states
- approval prompts
- artifact presentation
- TTS behavior around task updates

Not every desktop layout decision should port directly to mobile, but the mental model should stay coherent.
