# Philosophy

## Reframe the product

DotAgents is not primarily a conversation product.

It is a work delegation and supervision product.

People use DotAgents when they want software to act on their behalf. The interface therefore exists to help users express intent, calibrate autonomy, monitor execution, inspect evidence, and review outcomes.

The UI should not optimize for looking intelligent. It should optimize for making autonomous work legible.

## First-principles beliefs

### 1. The core object is the task, not the message

A message is only one artifact in a larger unit of work.

The true object the user cares about is something more like a run, job, or task:

- a goal was defined
- a plan was formed
- tools or agents acted
- artifacts were produced
- the user may have intervened
- a result was delivered
- trust was either earned or lost

If the interface starts from messages, everything becomes verbose and hard to scan.
If it starts from tasks, the UI can show state, progress, risk, and outcomes more clearly.

### 2. Trust is the product

The hardest problem in agent UX is not generation quality. It is trust calibration.

Users need to know:

- what the system is doing
- whether the system is behaving as expected
- whether important actions are reversible
- when they need to intervene
- whether completion is real or performative

The UI should convert invisible automation into visible, reviewable action.

### 3. Control should feel continuous, not binary

Most products force a bad choice between:

- full manual chat mode
- opaque full autonomy

DotAgents should make autonomy adjustable across a spectrum.

Examples:

- read-only exploration
- ask before tool use
- ask before external side effects
- allow safe actions automatically
- background runs with periodic review

The UI should communicate this spectrum constantly.

### 4. Progress matters more than prose

A wall of assistant text is a poor progress indicator.

Users should be able to understand a running task mostly by looking at:

- current goal
- current step
- recent actions
- pending approvals
- artifacts created
- blockers
- verification status

Text explanations should support the interface, not substitute for it.

### 5. Review is a first-class surface

In agent products, “done” is not enough.

The system must support a review transition:

- what changed?
- what was created?
- what assumptions were made?
- what still needs a human decision?
- how confident is the system?

This means completion should feel closer to reviewing a pull request, a draft, or a bundle of artifacts than reading a chatbot finale.

## The interface should answer five user questions

At every meaningful moment, DotAgents should answer:

### What is happening?
Current task state, active agent, current step, and latest actions.

### Why is it happening?
Goal context, plan context, and the reason a tool/agent/action was chosen.

### What can I do next?
Approve, pause, redirect, clarify, inspect, retry, or accept.

### What could go wrong?
Surface risk, uncertainty, irreversibility, and dependency failures.

### Can I trust this result?
Show evidence, artifacts, verification, and confidence rather than just assertions.

## Mental model shift

The old mental model:

> “I am chatting with an AI assistant.”

The new mental model:

> “I am directing a semi-autonomous work system.”

That shift should influence every screen.

## Product promise

DotAgents should feel like:

- the clarity of a task manager
- the observability of a build system
- the inspectability of a developer tool
- the safety of a good admin panel
- the flexibility of conversational steering

## Units of the system

These should be treated as foundational concepts.

### Unit of work
Task / run

### Unit of progress
Step / action

### Unit of trust
Reviewable execution history + approvals + verification

### Unit of review
Artifact / diff / output bundle

### Unit of memory
Durable preference or operating context

## Non-philosophies

The redesign should not chase:

- “make it feel more like ChatGPT”
- “hide complexity so it feels magical”
- “show chain-of-thought everywhere”
- “make everything agentic by default”
- “maximize time spent in conversation”

## Final thesis

DotAgents should feel less like talking to a bot and more like supervising a capable, fast, inspectable operator.
