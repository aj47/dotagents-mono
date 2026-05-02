# Trust and Autonomy Model

## Why this matters

Autonomous systems create a trust problem that traditional productivity tools do not. The system is not just storing user intent; it is acting on it.

The UI therefore needs a visible trust model.

## The trust equation

User trust is shaped by:

- visibility of actions
- clarity of purpose
- quality of outputs
- consistency over time
- ability to interrupt
- correctness of verification
- appropriateness of approvals

## Trust ladders

### Level 0: Fully manual guidance
The user observes each meaningful action and approves frequently.

### Level 1: Visible autonomy
The system can execute short sequences independently while surfacing actions in real time.

### Level 2: Checkpointed autonomy
The system can work through longer sequences but pauses at risk boundaries or output milestones.

### Level 3: Background autonomy
The system can complete scoped work mostly in the background and return for review.

The UI should make it obvious which level a run is using.

## Approval boundaries

The system should require explicit approval before actions that are:

- destructive
- externally visible
- irreversible
- expensive
- privacy-sensitive
- account-affecting

Examples include deleting files, sending messages, publishing content, creating external resources, or changing settings.

## Verification surfaces

Verification should be its own visible section, not a buried sentence.

Potential verification signals include:

- tests passed
- build succeeded
- file diff generated
- screenshot captured
- command output validated
- links accessible
- schema or lint checks passed

## Confidence communication

Confidence should not be fake precision. It should summarize how much the system has validated versus assumed.

A useful confidence model might reflect:

- source quality
- execution success
- output verification
- unresolved ambiguity
- known risk

## Failure handling

When trust conditions weaken, the UI should respond by increasing visibility and reducing autonomy.

That means:

- more explicit blockers
- more user prompts
- less hidden batching
- clearer failure explanations
- easy branch/retry controls

## Principle

Trust is not created by polished language.
Trust is created by visible, inspectable, steerable work.
