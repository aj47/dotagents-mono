Current state: the skill file exists at `~/.agents/skills/stream-topic-inventory/skill.md` and its contents are valid, but this running DotAgents session does **not** have that skill in its injected **Available Skills** list, so `load_skill_instructions` fails with “Skill not found.”

What’s unknown: whether the app’s skill registry just needs a refresh/restart, or whether the skill needs to be imported/registered through the app’s skills service.

Latest blocker: the live session can’t load the skill from filesystem-only evidence.

Next safest action: **do not change any files yet**; first fully restart/reopen DotAgents (or trigger a skills-registry refresh if the app supports it), then try loading the skill again in a fresh session.