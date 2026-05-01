Because `load_skill_instructions` only loads skills that are already registered in this session’s **Available Skills** list, and `stream-topic-inventory` isn’t in that registry. The file exists on disk at `~/.agents/skills/stream-topic-inventory/skill.md`, but the running DotAgents process hasn’t refreshed/imported it, so the loader returns `Skill ... not found`.

Blocker: skill registry refresh, not the skill file itself.
Next safe action: restart/refresh DotAgents so the session rebuilds its skills list, then try loading it again.