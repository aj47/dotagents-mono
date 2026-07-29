# AGENTS.md

Gotchas for AI coding agents in this repo. Inspect nearby files for subsystem-specific details.

## Core

- Use `pnpm` only; this repo has `pnpm-lock.yaml`, not npm/yarn locks.
- If you change `packages/shared`, run `pnpm build:shared` before `pnpm dev`.
- Prefer existing app-specific wiring over new abstractions, and check dependency direction before adding imports to avoid cycles.
- This is a greenfield project; do not preserve backwards compatibility unless explicitly requested.

## Boundaries

- Main and renderer are separate TypeScript builds. Desktop is Electron-first, so renderer changes are not fully validated by a plain browser.
- Renderer must not import from `src/main/`. Move shared code to `apps/desktop/src/shared/` or `packages/shared/`.
- Use existing aliases instead of deep relatives: renderer `@renderer/*` or `~/*`; desktop shared `@shared/*`.
- Desktop-only shared types live in `apps/desktop/src/shared/types.ts`; cross-app/package types live in `packages/shared/src/types.ts`; avoid legacy types except in migration code.
- Main-process services usually use exported singletons. Use `agentSessionStateManager` for session state and clean up in `finally`.
- Mobile UI can often be debugged with Expo web, but native-only features still need native/dev builds.

## Product/UI

- Say “agent”, not “persona”; there are no end-user profiles, only config / `.agents` settings.
- Every multiline UI surface should collapse to one line. Render readable JSON inline; collapse logs, payloads, and tool results by default when they exceed 2 lines.
- Tool-result UI should stay compact and dependency-light; built-in tool definition schemas should not create circular imports.

## Config and Tooling

- `.agents` is layered: global `~/.agents/` plus optional workspace `.agents/`; workspace wins on conflicts.
- Config merge is shallow by key, while agents/tasks/skills/memories merge by ID. Frontmatter is simple `key: value`, not full YAML.
- Do not hardcode sanitized MCP tool names; internal mapping handles provider-safe renaming.

## Electron

- Use `WINDOWS.get(...)` for window lookup and null-check panel access; the panel window is special-cased.

## Commands

Dev: `pnpm dev`; shared: `pnpm build:shared`; mobile web: `pnpm --filter @dotagents/mobile web`; checks: `pnpm test`, `pnpm typecheck`, `pnpm lint`.
