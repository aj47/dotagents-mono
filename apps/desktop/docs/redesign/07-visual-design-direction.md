# Visual Design Direction

## Desired feel

The interface should feel:

- calm
- operational
- precise
- modern
- trustworthy
- dense enough for power users, but not noisy

This is closer to a high-quality developer tool or control room than a consumer chat app.

## Tone

The visual language should communicate competence over personality.

That means:

- restrained color usage
- strong hierarchy
- clear state badges
- consistent spacing
- minimal decorative chrome
- polished motion for transitions between states

## Information hierarchy

Most important:

- task title
- run state
- current step
- approvals/blockers
- outputs

Secondary:

- explanatory text
- transcript details
- logs

Tertiary:

- branding moments
- empty-state illustration
- decorative accents

## Layout guidance

### Desktop
Prefer a stable three-column layout for active work.

### Tablet
Collapse right rail into a drawer or tab.

### Mobile
Use task summary first, activity second, steering composer pinned.

## Components that matter most

- state badges
- step lists
- activity rows
- artifact cards
- approval cards
- review panels
- control bar
- steering composer

These components should define the design system more than chat bubbles.

## Chat treatment

Chat should look integrated but subordinate.

Suggestions:

- lower visual emphasis than task state
- compact message spacing
- better distinction between user steer messages and system event logs
- avoid giant assistant bubbles dominating the viewport

## Color model

Use color primarily for state and risk, not decoration.

Suggested semantic use:

- neutral: default structure
- blue: active / running
- amber: waiting / approval / caution
- red: blocked / failed / dangerous
- green: verified / accepted

## Motion guidance

Motion should clarify state transitions:

- task moves from queued to running
- approval cards enter prominently
- output shelf updates smoothly
- verification state resolves clearly

Avoid playful motion that undermines seriousness.

## Density guidance

The UI should support high information density without feeling cramped.

That implies:

- compact rows
- good alignment
- strong typography scale
- progressive disclosure for logs and long explanations

## One-line visual brief

Design DotAgents like a trustworthy mission control interface for autonomous software work.
