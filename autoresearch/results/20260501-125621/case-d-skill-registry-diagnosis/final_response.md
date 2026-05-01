Because `load_skill_instructions` only loads skills that are already registered in this session’s **Available Skills** list, and `stream-topic-inventory` isn’t in that registry right now.

What’s known:
- The file exists at `~/.agents/skills/stream-topic-inventory/skill.md`.
- The session’s skill registry/lock only shows `remotion-best-practices`.
- The tool error explicitly says the skill is not found in Available Skills.

So the blocker isn’t the file content — it’s that the running DotAgents session hasn’t picked up the new skill. The safe next step is a full app restart/reload of the skills registry, then retry `load_skill_instructions`.