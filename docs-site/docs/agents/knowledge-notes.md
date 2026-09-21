---
sidebar_position: 3
sidebar_label: "Knowledge & Concepts"
---

# Knowledge & Concepts

Knowledge gives your agents durable, local context across sessions. `.agents/knowledge/` is the home for [OKF (Open Knowledge Format)](https://github.com/GoogleCloudPlatform/open-knowledge-format) v0.2 knowledge bundles — the agreed-upon standard for representing knowledge as markdown + frontmatter. The `.agents` protocol doesn't invent its own knowledge format; it tells producers where to put their OKF bundle.

In OKF's domain language, the artifacts in a bundle are **concepts**. Each concept is a single unit of knowledge: a markdown document with YAML frontmatter.

---

## What are Concepts?

Concepts are markdown files stored in `.agents/knowledge/<slug>/<slug>.md`. Unlike conversation history (which is per-session), concepts persist as local files and can be shared, versioned, and searched like the rest of your project.

Use concepts for:
- Project-specific context and architecture decisions
- User preferences and working patterns
- Important findings from previous research
- Reference information the agent needs repeatedly

## Canonical Bundle Layout

```text
.agents/
└── knowledge/
    ├── index.md                  # Bundle listing (OKF §3.1, §8, §12)
    ├── log.md                    # Update history (OKF §3.1, §9)
    ├── references/               # Non-markdown assets (OKF §6.3)
    │   ├── architecture-diagram.png
    │   └── api-contract.pdf
    └── project-stack/
        └── project-stack.md      # Concept document
```

## Concept Format

Every concept is a markdown document with YAML frontmatter. The only always-required field is `type` (OKF §4.1):

```markdown
---
type: Reference
title: Project Technology Stack
description: React 18, TypeScript 5, Fastify backend, PostgreSQL.
context: auto
generated: { by: human:you, at: 2026-09-21T02:00:00Z }
tags: [architecture, project, stack]
---

## Additional Context

The frontend uses TailwindCSS for styling and Zustand for state management.
The backend follows a service-oriented architecture with dependency injection.
All API endpoints require JWT authentication.
```

### The dotagents-specific fields

Everything not listed here is defined by the OKF v0.2 spec — the trust/provenance/lifecycle fields (`sources`, `generated`, `verified`, `stale_after`, `status`), the actor convention, cross-linking, `index.md`/`log.md` structure, and the conformance bar. The `.agents` protocol adds exactly one thing:

| Field | Description |
|-------|-------------|
| `context` | `auto` or `search-only`. The dotagents-defined runtime-injection semantic, expressed as an OKF extension key — OKF declines to specify serving or query infrastructure, so this field decides which concepts are eligible for automatic injection. |

Field mappings from the legacy notes format: `updatedAt` (Unix epoch) → OKF's `generated.at` (ISO 8601 UTC); `summary` → OKF's recommended `description`. The remaining legacy fields (`kind`, `id`, `title`, `tags`) are OKF extension keys, which consumers must preserve and never reject.

Nested YAML is allowed for the OKF trust/provenance fields (`generated`, `verified`, `sources`, etc.) as OKF defines them — the exception to the protocol's "simple key:value, not full YAML" rule. Plain scalar fields stay simple.

### Assets

Non-markdown assets live under the `references/` convention (OKF §6.3): the file is mirrored into the bundle as a first-class artifact, and a concept points at it via `resource:` (the underlying asset the concept describes) or `sources[].resource` (provenance — the concept was extracted from that file). The concept body carries the curated knowledge; the asset is the evidence.

### Linking concepts

Concepts relate through ordinary markdown links, bundle-relative absolute form recommended (OKF §6.1). Consumers must tolerate broken links.

## Working Concepts and Runtime Selection

Runtime behavior is determined explicitly by `context`:

| `context` | Behavior |
|----------|----------|
| `auto` | Eligible for automatic runtime injection as a working concept |
| `search-only` | Not injected by default; available via search/retrieval |

Most concepts should use `context: search-only`. Reserve `context: auto` for a tiny curated subset of high-signal working concepts.

## Managing Concepts

### Via Files

Create concept folders directly in `~/.agents/knowledge/` or `./.agents/knowledge/`:

```bash
mkdir -p ~/.agents/knowledge/coding-standards

cat > ~/.agents/knowledge/coding-standards/coding-standards.md << 'EOF'
---
type: Reference
title: Team Coding Standards
description: Core TypeScript standards for the team.
context: search-only
generated: { by: human:you, at: 2026-09-21T02:00:00Z }
tags: [standards, code-quality]
---

## Standards

- All functions must have explicit return types
- Use `const` by default, `let` only when reassignment is needed
- Prefer named exports over default exports
- Maximum file length: 300 lines
EOF
```

### Via the Agent

Ask your agent to create or update concepts as normal files:

> "Create a knowledge concept for our API versioning rules and make it search-only."

Direct file editing is the default write path for concepts.

## How Concepts are Used

### Loading

Concepts are layered the same way as the rest of `.agents`:

```
~/.agents/knowledge/       (global concepts)
    ↓ merge by ID
./.agents/knowledge/       (workspace concepts, wins on conflict)
    ↓
Agent's available knowledge
```

### In Context

Only concepts with `context: auto` are eligible for automatic runtime injection. Search-only concepts remain discoverable through file search and semantic retrieval without being injected into every session.

## Two-Layer Storage

Like all `.agents` protocol files, knowledge supports two layers:

### Global (`~/.agents/knowledge/`)

Personal concepts available across all projects. Good for:
- Your coding preferences
- Common tool configurations
- General knowledge the agent should have

### Workspace (`./.agents/knowledge/`)

Project-specific concepts. Good for:
- Project architecture and decisions
- Team conventions
- Domain-specific knowledge

Workspace concepts override global concepts with the same ID.

## Backup and Recovery

Knowledge concepts are protected by the `.agents` protocol's resilience features:

- **Atomic writes** — Writes use temp file + rename to prevent corruption
- **Timestamped backups** — Auto-rotated copies in `.agents/.backups/knowledge/`
- **Auto-recovery** — Corrupted files are automatically restored from backups

---

## Next Steps

- **[Agents](profiles)** — Configure agent behavior
- **[Skills](skills)** — Teach agents specialized capabilities
- **[The .agents Protocol](/concepts/dot-agents-protocol)** — See the filesystem model and examples
- **[Multi-Agent Delegation](delegation)** — Agent-to-agent coordination
