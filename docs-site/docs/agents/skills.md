---
sidebar_position: 2
sidebar_label: "Skills"
---

# Skills

Skills are portable, reusable agent capabilities defined as instruction files. They extend what your agents know without code changes — and they work across DotAgents, Claude Code, Cursor, and any tool that reads the `.agents/` directory.

---

## What is a Skill?

A skill is a markdown file that teaches an agent how to do something specific. When an agent needs specialized knowledge, it loads the skill's instructions and uses them to complete the task.

Skills are:
- **Portable** — Work across multiple AI tools
- **Composable** — Agents can use multiple skills together
- **Shareable** — Export and import via agent bundles
- **Version-controllable** — Store in git alongside your code

## Skill Format

Skills live in `.agents/skills/<skill-id>/skill.md`:

```markdown
---
kind: skill
id: api-testing
name: API Testing
description: Test REST APIs with structured assertions and reporting
createdAt: 1709856000
updatedAt: 1709856000
source: local
---

# API Testing Skill

## Overview

This skill enables thorough API testing with structured reporting.

## Workflow

1. Analyze the API endpoint specification
2. Generate test cases covering:
   - Happy path (200 responses)
   - Error cases (4xx, 5xx)
   - Edge cases (empty inputs, large payloads)
   - Authentication scenarios
3. Execute tests using available HTTP tools
4. Report results in a structured format

## Output Format

For each test case, report:
- **Endpoint**: Method and URL
- **Status**: Pass/Fail
- **Expected**: What was expected
- **Actual**: What was received
- **Notes**: Any observations

## Best Practices

- Test idempotency for PUT/DELETE operations
- Verify response schemas match documentation
- Check rate limiting behavior
- Validate error message formats
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `kind` | No | Always `skill` |
| `id` | Yes | Unique identifier |
| `name` | Yes | Human-readable name |
| `description` | Yes | Brief description (shown in skill list) |
| `createdAt` | No | Unix timestamp |
| `updatedAt` | No | Unix timestamp |
| `source` | No | `local` (created in DotAgents) or `imported` |
| `filePath` | No | Path to external execution context |

## How Skills are Used

### Discovery

When an agent starts, its system prompt includes a list of available skills:

```
Available Skills:
- api-testing: Test REST APIs with structured assertions and reporting
- document-processing: Create, edit, and analyze .docx files
```

### Loading

When the agent decides to use a skill, it calls `load_skill_instructions` to get the full instructions:

```
Agent → load_skill_instructions("api-testing")
     → Returns full skill.md content
     → Agent uses the instructions to complete the task
```

### Execution

The agent follows the skill's instructions using its available tools and knowledge. Skills don't execute code directly — they provide instructions that the agent interprets and acts on.

## Creating Skills

### Via the UI

1. Go to **Settings > Agents** and select an agent
2. Under Skills, click **Create Skill**
3. Fill in the name and description
4. Write the skill instructions in markdown
5. Save

### Via Files

Create a directory in `.agents/skills/` with a `skill.md` file:

```bash
mkdir -p ~/.agents/skills/my-new-skill
```

Write your skill file at `~/.agents/skills/my-new-skill/skill.md`.

### Via the Skill Creation Skill

DotAgents includes a bundled skill for creating other skills. Ask your agent:

> "Create a new skill for managing Docker containers"

The agent will use the skill creation skill to generate a well-structured skill file.

## Skill Loading

Skills are loaded from the `.agents/skills/` directory:

- Scanned **recursively** up to 8 levels deep
- Loaded from both **global** (`~/.agents/skills/`) and **workspace** (`./.agents/skills/`)
- **Merged by ID** — workspace versions override global versions
- **Cached** for performance

### Loading Order

```
~/.agents/skills/         (global skills)
    ↓ merge by ID
./.agents/skills/         (workspace skills, wins on conflict)
    ↓ filter by agent config
Agent's enabled skills    (final set)
```

## Assigning Skills to Agents

### All Skills (Default)

By default, agents have access to all loaded skills.

### Selective Skills

Restrict which skills an agent can use via the agent's `config.json`:

```json
{
  "skillsConfig": {
    "enabledSkills": ["api-testing", "document-processing"]
  }
}
```

## Bundled Skills

DotAgents ships with built-in skills:

| Skill | Description |
|-------|-------------|
| **Agent Skill Creation** | Guides agents in creating new skill files |
| **Document Processing (DOCX)** | Create, edit, and analyze Word documents |

## Sharing Skills

### With Agent Bundles

When you export an agent bundle, its skills are included. Importing the bundle recreates the skills.

### Manually

Copy the skill directory to another machine's `~/.agents/skills/` or include it in your project's `.agents/skills/` directory and commit to git.

### Via Workspace

Add skills to your project's `.agents/skills/` directory:

```
my-project/
└── .agents/
    └── skills/
        └── project-specific-skill/
            └── skill.md
```

Anyone who clones the repo gets the skills automatically.

---

## Next Steps

- **[Memory](memory)** — Persistent agent context
- **[Agent Profiles](profiles)** — Assign skills to agents
- **[The .agents Protocol](/concepts/dot-agents-protocol)** — Cross-tool compatibility
