# `.dotagents` Bundles

This document captures the **current repo-level `.dotagents` bundle behavior** after the recent trust and inspection work tracked under issue `#25` and its concrete follow-ups `#56` and `#57`.

It is intentionally a **current-state workflow/spec note**, not a promise that every future bundle format detail is frozen.

## What a `.dotagents` bundle is today

In the desktop app today, a `.dotagents` file is a **JSON document** with:

- a `manifest`
- `agentProfiles`
- `mcpServers`
- `skills`
- `repeatTasks`
- `memories`

The desktop app uses the same artifact shape for:

- local bundle export/import
- automatic pre-import backups
- restore-from-backup flows
- Hub publish handoff artifacts

## Current import safety defaults

DotAgents now treats bundle import as a **preview-first, reversible** workflow.

### 1. Automatic pre-import snapshot

Before bundle writes begin, DotAgents creates an automatic backup bundle in:

- `~/.agents/backups/backup-*.dotagents`

Current behavior:

- backups are created before import mutation
- backups are pruned automatically so the folder does not grow without bound
- default safety backups include agent profiles, MCP servers, skills, and repeat tasks
- default safety backups **exclude memories**

### 2. Restore is reachable in-app

Backups are not toast-only anymore. Desktop users can restore them from:

- `Settings -> Capabilities -> Restore Backup`
- `Settings -> Capabilities -> Recent backups`
- `Settings -> Capabilities -> Open Backups Folder`

### 3. Preview before write

Bundle import uses a preview dialog that shows:

- what the bundle contains
- which items conflict with the current config
- the current conflict strategy outcome before import starts

### 4. Safe conflict default

The default conflict behavior is:

- **Skip existing items**

Other supported import-wide strategies remain:

- `overwrite`
- `rename`

### 5. Component and per-item cherry-pick

Import is no longer all-or-nothing.

Users can:

- disable entire component groups
- deselect individual agent profiles, MCP servers, skills, repeat tasks, or memories
- review excluded items directly in the import plan

## Export and sharing defaults

### Local export

Desktop bundle export lets users choose exactly what to include in a local `.dotagents` file.

Current entry points:

- `Settings -> Skills` for bundle import/export in the skills workflow
- `Settings -> Agents` for broader bundle import/export from the agent-management surface

### Public / Hub-oriented export

`Export for Hub` prepares a sanitized bundle plus publish metadata, but it does **not** upload automatically.

Current public-sharing defaults:

- memories are **off by default** for Hub-oriented export
- repeat tasks are **off by default** for Hub-oriented export
- MCP secrets are stripped automatically from exported config
- enabled content is still public once the artifact is shared

Before sharing a Hub install link, the bundle file still needs to be hosted at the chosen artifact URL.

## Inspect before install

The static website now includes a **bundle inspector modal** for featured Hub bundles.

Current behavior:

- users can inspect bundle contents before installing
- install remains a separate `dotagents://install?...` action
- prompts/instructions can be reviewed before trust is granted

This establishes the default trust posture for `.dotagents` sharing:

- inspect first
- preview conflicts before write
- auto-back up before mutation
- restore quickly if needed

## Current desktop surfaces

- `Settings -> Skills` — import/export local bundles
- `Settings -> Agents` — import/export bundles and prepare Hub publish artifacts
- `Settings -> Capabilities` — restore backups, inspect recent backups, open backup folder
- `website/index.html` — inspect featured bundles before installing

## Still intentionally open under issue #25

The umbrella issue still covers larger follow-ups beyond the current trust baseline, including:

- broader community Hub workflows
- richer bundle docs/spec evolution
- deeper restore/import provenance
- future sandbox or profile-slot style import isolation