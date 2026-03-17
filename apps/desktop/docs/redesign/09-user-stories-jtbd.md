# User Stories and Jobs To Be Done

## Primary job to be done

When I delegate meaningful work to an autonomous system, help me understand and control execution without forcing me to micromanage every step.

## Core user stories

### Starting work
As a user, I want to describe a task quickly and launch it with the right autonomy level so I can get moving without configuration overhead.

### Monitoring work
As a user, I want to see the current state and latest actions at a glance so I do not need to read the full transcript.

### Intervening
As a user, I want to pause, redirect, or clarify the task mid-run so I can correct course without starting over.

### Reviewing results
As a user, I want to inspect artifacts and verification before accepting completion so I can trust the output.

### Resuming later
As a user, I want to reopen a task and instantly understand where it stands so I can pick up without context reconstruction.

### Running in background
As a user, I want long-running tasks to continue without monopolizing the foreground while still alerting me when I need to act.

## Scenario types

### Quick ask
A short task with minimal side effects. Fast launch, compact view, immediate output.

### Deep work session
A longer task requiring many steps, tools, and possibly multiple agents. Needs plan visibility and interruption controls.

### External action workflow
Tasks like posting, emailing, or browser automation. Needs approvals, login handling, and strong review.

### Ongoing automation
Recurring or scheduled work. Needs confidence, summary, and low-noise monitoring.

## JTBD forces

### Push away from current state
- transcript overload
- unclear progress
- uncertainty about what agent is doing
- hard to tell when system really needs input

### Pull toward new solution
- crisp task visibility
- better trust
- easier intervention
- stronger sense of control

### Habit friction
- users may default to chat expectations
- users may ignore review unless surfaced well

### Anxiety factors
- fear of unwanted side effects
- fear of silent failure
- fear of fake completion

## Implication

The redesign should reduce uncertainty faster than it increases learning cost.
