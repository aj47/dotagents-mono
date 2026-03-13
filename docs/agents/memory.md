# Memory

Memory gives your agents persistent context across sessions. When an agent learns something important, it can store it as a memory entry and recall it in future conversations.

---

## What is Agent Memory?

Memories are markdown files stored in `.agents/memories/` that contain context the agent should remember across sessions. Unlike conversation history (which is per-session), memories persist indefinitely and are available to the agent in every interaction.

Use memories for:
- Project-specific context and architecture decisions
- User preferences and working patterns
- Important findings from previous research
- Reference information the agent needs repeatedly

## Memory Format

Memories are stored as markdown files with frontmatter:

```markdown
---
kind: memory
id: project-stack
createdAt: 1709856000
updatedAt: 1709856000
title: Project Technology Stack
content: The project uses React 18, TypeScript 5, and Fastify for the backend
importance: high
tags: architecture, project, stack
keyFindings: ["React 18 with hooks", "TypeScript strict mode", "Fastify REST API", "PostgreSQL database"]
---

## Additional Context

The frontend uses TailwindCSS for styling and Zustand for state management.
The backend follows a service-oriented architecture with dependency injection.
All API endpoints require JWT authentication.
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `kind` | No | Always `memory` |
| `id` | Yes | Unique identifier |
| `createdAt` | No | Unix timestamp |
| `updatedAt` | No | Unix timestamp |
| `title` | Yes | Short descriptive title |
| `content` | Yes | Summary of the memory |
| `importance` | No | `low`, `medium`, `high`, or `critical` |
| `tags` | No | Comma-separated tags for categorization |
| `keyFindings` | No | JSON array of key takeaways |

## Managing Memories

### Via the Desktop UI

1. Navigate to **Memories** in the sidebar
2. View all current memories with their titles and importance levels
3. **Create** new memories with title, content, importance, and tags
4. **Edit** existing memories to update context
5. **Delete** memories that are no longer relevant

### Via the Mobile App

1. Open the **Memory Edit** screen
2. View, create, edit, and delete memories
3. Changes sync with the desktop instance when connected

### Via Files

Create markdown files directly in `~/.agents/memories/`:

```bash
# Create a new memory
cat > ~/.agents/memories/coding-standards.md << 'EOF'
---
kind: memory
id: coding-standards
title: Team Coding Standards
content: Our team follows specific coding standards for TypeScript projects
importance: high
tags: standards, code-quality
keyFindings: ["Use strict TypeScript", "Prefer functional components", "No any types"]
---

## Standards

- All functions must have explicit return types
- Use `const` by default, `let` only when reassignment is needed
- Prefer named exports over default exports
- Maximum file length: 300 lines
EOF
```

### Via the Agent

Ask your agent to save memories during conversation:

> "Remember that our API uses v2 endpoints and requires the X-API-Version header"

The agent can use the memory tool to create and update memory entries.

## How Memories are Used

### Loading

Memories are loaded at agent initialization:

```
~/.agents/memories/       (global memories)
    ↓ merge by ID
./.agents/memories/       (workspace memories, wins on conflict)
    ↓
Agent's available memories
```

### In Context

Memories are included in the agent's system prompt, providing persistent context that shapes every response. High-importance memories get priority when context space is limited.

### Importance Levels

| Level | When to Use |
|-------|-------------|
| **Critical** | Must always be in context (e.g., security constraints) |
| **High** | Important project context (e.g., architecture decisions) |
| **Medium** | Useful but not essential (e.g., preference notes) |
| **Low** | Nice-to-have context (e.g., historical decisions) |

## Two-Layer Storage

Like all `.agents` protocol files, memories support two layers:

### Global (`~/.agents/memories/`)
Personal memories available across all projects. Good for:
- Your coding preferences
- Common tool configurations
- General knowledge the agent should have

### Workspace (`./.agents/memories/`)
Project-specific memories. Good for:
- Project architecture and decisions
- Team conventions
- Domain-specific knowledge

Workspace memories override global memories with the same ID.

## Backup and Recovery

Memories are protected by the `.agents` protocol's resilience features:

- **Atomic writes** — Writes use temp file + rename to prevent corruption
- **Timestamped backups** — Auto-rotated copies in `.agents/.backups/memories/`
- **Auto-recovery** — Corrupted files are automatically restored from backups

---

## Next Steps

- **[Agent Profiles](profiles.md)** — Configure agent behavior
- **[Skills](skills.md)** — Teach agents specialized capabilities
- **[Multi-Agent Delegation](delegation.md)** — Agent-to-agent coordination
