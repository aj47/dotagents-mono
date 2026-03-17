# Open Questions

## Product questions

1. Should Home and Tasks be separate surfaces or one combined task hub?
2. What is the exact difference between a task, run, conversation, and session in the product model?
3. Should one task be able to contain multiple runs natively?
4. How should background automations appear alongside user-triggered tasks?
5. What is the right default autonomy mode for first-time users?

## UX questions

1. How much of the transcript should remain visible by default?
2. What is the best visual distinction between events and chat messages?
3. How should multi-agent activity be summarized without becoming noisy?
4. When a task is waiting on a user, should the whole layout reconfigure to emphasize the blocker?
5. What is the cleanest mobile pattern for left/center/right rail information?

## Data model questions

1. Do current conversation/session primitives map cleanly to a task-run abstraction?
2. What event schema is needed to power a structured activity stream?
3. What is the artifact model across file outputs, browser captures, messages, and summaries?
4. How should verification state be stored and replayed?

## Research prompts

- Watch users attempt to answer “what is the agent doing right now?” in current UI.
- Measure time-to-understanding for active task state.
- Compare transcript-first versus task-first prototypes.
- Test whether users trust completion more when shown evidence before summary prose.
- Test how many live events users can tolerate before a right rail becomes noisy.

## Decision principle

When uncertain, choose the option that improves task legibility and trust calibration over chat familiarity.
