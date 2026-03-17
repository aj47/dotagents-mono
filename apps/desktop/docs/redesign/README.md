# .agents UI Redesign Docs

This folder captures a first-principles redesign direction for the `.agents` desktop product.

The central thesis is simple: `.agents` is not primarily a chat app. It is a system for directing, observing, and reviewing autonomous work. The interface should therefore optimize for trust, control, momentum, and clear human review rather than transcript aesthetics.

## Document map

- `PHILOSOPHY.md` — the foundational worldview behind the redesign
- `DESIGN_PRINCIPLES.md` — non-negotiable product and UI principles
- `PRODUCT_SPEC.md` — proposed product spec for the main experience
- `INFORMATION_ARCHITECTURE.md` — the core objects, surfaces, and hierarchy
- `INTERACTION_MODEL.md` — how users start, steer, interrupt, approve, and review work
- `WIREFRAMES.md` — low-fidelity structural wireframes for primary screens
- `MIGRATION_PLAN.md` — how to move from the current UI to the new model incrementally
- `AGENTS.md` — implementation guidance for contributors working on the redesign

## North star

At any moment, the UI should answer five questions:

1. What is happening?
2. Why is it happening?
3. What can I do next?
4. What could go wrong?
5. Can I trust this result?

## Core shift

The current UI has strong chat DNA. The redesign should be task-native.

That means:

- the primary object becomes the **task / run**, not the message
- the primary feedback becomes **progress and actions**, not prose
- the primary completion state becomes **reviewable output**, not a final chat bubble
- chat remains useful, but as a steering layer rather than the main container for all system state

## Product framing

The product can be thought of as three layers:

- **Intent layer** — what the user wants done
- **Execution layer** — what agents and tools are doing
- **Review layer** — what was produced and whether it is acceptable

A strong redesign should keep these layers distinct enough to be understandable, while still feeling fluid in use.
