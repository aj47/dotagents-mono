# Philosophy

## The product is about directed work, not conversation

People do not open `.agents` because they want a beautiful chat transcript. They open it because they want work to happen.

That work may involve conversation, but conversation is only one of several mechanisms involved. The product's real job is to let a human:

- express intent clearly
- delegate execution safely
- monitor progress without cognitive overload
- intervene when needed
- review outputs with confidence
- build trust over time

This means the product should be designed around **work orchestration** rather than **chat consumption**.

## The central user emotion is not delight. It is trust.

Most UI systems optimize first for clarity or delight. In agent products, trust outranks both.

The user is constantly asking:

- Is this doing the right thing?
- Is it still aligned with my goal?
- Is it stuck?
- Is it about to cause damage?
- Can I let it continue?
- Can I trust what it says is done?

Every major surface should reduce one of those anxieties.

## The core promise of `.agents`

`.agents` should make autonomous systems feel:

- legible
- steerable
- interruptible
- reviewable
- progressively trustworthy

Legibility means users can understand what is happening.
Steerability means they can redirect without restarting everything.
Interruptibility means they can stop or pause at any moment.
Reviewability means outputs are inspectable in a structured way.
Progressive trust means the system earns autonomy through transparency and consistent behavior.

## Chat is a tool, not the product container

A common failure mode in AI product design is forcing every state into a linear chat timeline. That causes several problems:

- state gets buried in scrollback
- progress is hard to scan
- approvals and interventions feel bolted on
- artifacts lose their structure
- multi-agent work becomes confusing
- completion is ambiguous

Chat should remain available because it is natural for steering and correction. But it should no longer be the only or primary frame.

## The primary object should be the task / run

A user asks for work. The system performs a run. The run has:

- a goal
- context
- a plan
- live status
- actions taken
- tools used
- approvals needed
- outputs produced
- verification status
- a completion summary

That is the natural object model of the product.

Messages are artifacts attached to a run, not the run itself.

## The user is directing work, not prompting a model

The UI should reflect a shift in mental model.

Old model:

- I type a prompt
- I wait for a response
- I read the answer

New model:

- I define a job
- the system plans and executes
- I monitor and steer
- I review the result
- I either approve, revise, or continue

This is the difference between messaging software and operations software.

## The product must support asymmetric attention

Users will not always watch the system closely. Sometimes they will actively supervise. Sometimes they will glance occasionally. Sometimes they will dispatch work and return later.

The UI should support all three modes:

- **foreground mode** — close supervision, active steering
- **ambient mode** — periodic checks, status scanning
- **background mode** — dispatch now, review later

This means status must be glanceable, interruptions must be explicit, and final review must be easy to resume.

## Review is a first-class product surface

The output of an agent is often not just text. It may be:

- files changed
- commands run
- issues created
- documents drafted
- browser actions taken
- emails prepared
- decisions made
- summaries generated

A system that ends with "Done!" in a chat bubble has not actually solved the review problem.

The redesign should treat review as a structured phase with dedicated UI. This is where trust compounds.

## Good agent UX makes power feel calm

A powerful system should not feel chaotic. It should feel calm because:

- the current state is visible
- the next likely actions are obvious
- the risk points are explicit
- the controls are always nearby
- the history is inspectable
- the handoff from machine work to human review is smooth

Calm is the emotional goal.
