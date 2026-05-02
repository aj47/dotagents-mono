# Roadmap

## Phase 1: Alignment

Goal: align on product model before visual redesign.

Deliverables:
- finalize terminology in `glossary.md`
- agree that task/run replaces transcript as primary object
- identify current UI surfaces that are transcript-bound
- map existing components to the new model

## Phase 2: Core structural prototype

Goal: prove the new layout and state hierarchy.

Deliverables:
- left rail task list
- center task run workspace
- right rail activity / approvals
- current step card
- artifacts panel
- basic review panel

Success criteria:
- a user can tell what is happening without reading the transcript

## Phase 3: Execution legibility

Goal: make runs feel observable and steerable.

Deliverables:
- compact activity stream
- explicit blocker states
- approval queue
- pause / stop / retry / branch controls
- autonomy level indicator

Success criteria:
- a user can intervene confidently mid-run

## Phase 4: Review-first completion

Goal: make completion feel like inspectable handoff.

Deliverables:
- verification section
- confidence model
- artifact previews
- accept / revise / continue actions

Success criteria:
- users can review results without digging through history

## Phase 5: Task-type specialization

Goal: adapt the same model to different workflows.

Examples:
- code tasks emphasize diffs, files, tests
- research tasks emphasize sources, summaries, citations
- messaging tasks emphasize drafts, recipients, send approvals
- browser tasks emphasize page steps, screenshots, extracted data

## Phase 6: Progressive autonomy controls

Goal: let users tune how much independence agents have.

Deliverables:
- visible autonomy level per run
- approval policies
- risk-sensitive boundaries
- background run support

## Phase 7: Cross-platform consistency

Goal: apply the same mental model to desktop and mobile without copying layout literally.

Desktop can emphasize parallel visibility and density.
Mobile can emphasize current step, blocker state, and review actions.
