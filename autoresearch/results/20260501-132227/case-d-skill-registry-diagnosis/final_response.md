Because `load_skill_instructions` can only load skills that are registered in this session’s **Available Skills** list. The skill file exists on disk, but this chat session was started before the skill registry picked it up, so the tool returns “not found.”

In short: **file exists, session registry doesn’t**. A full app/session reload is needed for the skill to become loadable.