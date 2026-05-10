---
sidebar_position: 3
sidebar_label: "Knowledge & Notes"
---

# Knowledge & Notes

Knowledge gives your agents durable, local context across sessions. In the `.agents` protocol, the mixed-content container is `knowledge`, markdown artifacts are `notes`, and the small runtime-injected subset are `working notes`.

---

## What are Knowledge Notes?

Notes are markdown files stored in `.agents/knowledge/<slug>/<slug>.md`. Unlike conversation history (which is per-session), notes persist as local files and can be shared, versioned, and searched like the rest of your project.

Use notes for:
- Project-specific context and architecture decisions
- User preferences and working patterns
- Important findings from previous research
- Reference information the agent needs repeatedly

The note folder can also contain related assets such as images, PDFs, and other files. No fixed `assets/` subfolder is required.

## Canonical Note Layout

```text
.agents/
└── knowledge/
    └── project-stack/
        ├── project-stack.md
        ├── architecture-diagram.png
        └── api-contract.pdf
```

## Note Format

Notes are stored as markdown files with simple frontmatter. This is `key: value` metadata, **not full YAML**:

```markdown
---
kind: note
id: project-stack
title: Project Technology Stack
context: auto
updatedAt: 1709856000
tags: architecture, project, stack
summary: React 18, TypeScript 5, Fastify backend, PostgreSQL.
---

## Additional Context

The frontend uses TailwindCSS for styling and Zustand for state management.
The backend follows a service-oriented architecture with dependency injection.
All API endpoints require JWT authentication.
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `kind` | Yes | Always `note` |
| `id` | Yes | Unique identifier |
| `title` | Yes | Short descriptive title |
| `context` | Yes | `auto` or `search-only` |
| `updatedAt` | Yes | Unix timestamp |
| `summary` | No | Compact runtime summary |
| `createdAt` | No | Unix timestamp |
| `references` | No | Related paths or external refs |
| `tags` | No | Comma-separated tags or JSON array |

## Working Notes and Runtime Selection

Runtime behavior is determined explicitly by `context`:

| `context` | Behavior |
|----------|----------|
| `auto` | Eligible for automatic runtime injection as a working note |
| `search-only` | Not injected by default; available via search/retrieval |

Most notes should use `context: search-only`. Reserve `context: auto` for a tiny curated subset of high-signal working notes.

## Managing Notes

### Via Files

Create note folders directly in `~/.agents/knowledge/` or `./.agents/knowledge/`:

```bash
mkdir -p ~/.agents/knowledge/coding-standards

cat > ~/.agents/knowledge/coding-standards/coding-standards.md << 'EOF'
---
kind: note
id: coding-standards
title: Team Coding Standards
context: search-only
updatedAt: 1709856000
tags: standards, code-quality
summary: Core TypeScript standards for the team.
---

## Standards

- All functions must have explicit return types
- Use `const` by default, `let` only when reassignment is needed
- Prefer named exports over default exports
- Maximum file length: 300 lines
EOF
```

### Via the Agent

Ask your agent to create or update notes as normal files:

> "Create a knowledge note for our API versioning rules and make it search-only."

Direct file editing is the default write path for notes.

## How Notes are Used

### Loading

Notes are layered the same way as the rest of `.agents`:

```
~/.agents/knowledge/       (global notes)
    ↓ merge by ID
./.agents/knowledge/       (workspace notes, wins on conflict)
    ↓
Agent's available knowledge
```

### In Context

Only notes with `context: auto` are eligible for automatic runtime injection. Search-only notes remain discoverable through file search and semantic retrieval without being injected into every session.

## Two-Layer Storage

Like all `.agents` protocol files, knowledge supports two layers:

### Global (`~/.agents/knowledge/`)

Personal notes available across all projects. Good for:
- Your coding preferences
- Common tool configurations
- General knowledge the agent should have

### Workspace (`./.agents/knowledge/`)

Project-specific notes. Good for:
- Project architecture and decisions
- Team conventions
- Domain-specific knowledge

Workspace notes override global notes with the same ID.

## Backup and Recovery

Knowledge notes are protected by the `.agents` protocol's resilience features:

- **Atomic writes** — Writes use temp file + rename to prevent corruption
- **Timestamped backups** — Auto-rotated copies in `.agents/.backups/knowledge/`
- **Auto-recovery** — Corrupted files are automatically restored from backups

> Older docs or integrations may still use `memory` wording, but the protocol model documents `knowledge`, `notes`, and `working notes` as canonical.

---

## Next Steps

- **[Agents](profiles)** — Configure agent behavior
- **[Skills](skills)** — Teach agents specialized capabilities
- **[The .agents Protocol](/concepts/dot-agents-protocol)** — See the filesystem model and examples
- **[Multi-Agent Delegation](delegation)** — Agent-to-agent coordination
