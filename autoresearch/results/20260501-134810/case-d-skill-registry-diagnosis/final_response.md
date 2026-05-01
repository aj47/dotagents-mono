Because the loader only accepts skills that are registered in this session’s **Available Skills** list, and `stream-topic-inventory` wasn’t in that list when I tried to load it. The file exists on disk, but the running DotAgents session didn’t refresh its skill registry, so the loader can’t see it yet.

Known: the skill file is valid and present at `~/.agents/skills/stream-topic-inventory/skill.md`.
Unknown: whether the app will pick it up automatically after a restart/reload.
Latest blocker: session-level skill registry is stale.
Next safe action: restart/reopen DotAgents (or refresh the skill registry) and then retry loading the skill.