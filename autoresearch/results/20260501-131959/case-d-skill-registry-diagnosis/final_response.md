Because `load_skill_instructions` can only load skills that are in this session’s **Available Skills** registry, and `stream-topic-inventory` isn’t there.

What’s known:
- The skill file exists on disk: `~/.agents/skills/stream-topic-inventory/skill.md`
- It parses fine
- But the tool returned: **“Skill 'stream-topic-inventory' not found. Check the Available Skills section in the system prompt”**
- The current skills lock only shows `remotion-best-practices`, so this session wasn’t injected with `stream-topic-inventory`

What’s unknown:
- Whether the app just needs a refresh/restart, or whether the skill needs to be registered/rebuilt into the skills index

Latest blocker:
- The skill is **not present in the session’s loaded skills list**, so I can’t load it from here

Next safe step:
- Refresh/reopen the DotAgents session so it rebuilds the skills registry; after that, I can try loading it again