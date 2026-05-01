Current state:
- The skill file exists on disk: `~/.agents/skills/stream-topic-inventory/skill.md`.
- The file content is valid and the skill parses.
- This session’s loaded/available skills registry does **not** include `stream-topic-inventory`, so `load_skill_instructions` fails even though the file is present.
- No livestream download/transcription/clipping changes have been made.

Latest blocker:
- The app’s skill registry appears stale and hasn’t refreshed from the filesystem.

Next safest action:
- Restart/reopen DotAgents and start a fresh session so the skills registry reloads.
- After that, try loading the skill again before doing any work.
- Per your approval boundary, I will not make any download/transcription/clipping changes until you approve them.