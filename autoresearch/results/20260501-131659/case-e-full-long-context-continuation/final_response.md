Current state: the `stream-topic-inventory` skill file exists and is valid on disk at `~/.agents/skills/stream-topic-inventory/skill.md`, but this session’s loaded skills registry does **not** include it, so `load_skill_instructions` fails with “Skill not found.”

Knowns: no download/transcription/clipping has been started; no files were changed in the livestream workflow.
Unknowns: whether DotAgents will pick up the skill after a restart/reload, or whether the app needs an explicit skills refresh/import step.
Latest blocker: the running app hasn’t recognized the new skill yet.
Next safest action: fully quit and relaunch DotAgents, then start a fresh session and retry loading the skill. If it still isn’t visible, check the app’s skills refresh/import path before doing any livestream processing.