# agents.md

Concise gotchas for AI coding agents working in this repo.

## Core gotchas

- **Use `pnpm` only.** This repo uses `pnpm-lock.yaml`; do not use npm or yarn.
- **If you change `packages/shared`, run `pnpm build:shared` before `pnpm dev`.**
- **Prefer existing patterns over new abstractions.** This codebase has a lot of app-specific wiring.
- **Avoid circular imports.** Check dependency direction before adding imports, especially around main-process services and tool code.

## Imports and process boundaries

- **Main and renderer are separate TypeScript builds.** Do not treat them as one runtime.
- **The desktop app is Electron-first, not a normal website.** It has a renderer bundle, but desktop features depend on Electron/main-process APIs, so do not assume changes can be validated in a plain browser.
- **Renderer must not import from `src/main/`.** Move shared code to `apps/desktop/src/shared/` or `packages/shared/` if both sides need it.
- **Aliases matter:**
  - renderer: `@renderer/*` or `~/*`
  - main + renderer shared desktop code: `@shared/*`
- **Do not add ugly deep relative imports** when an existing alias already fits.

## Debugging / local dev gotchas

- **For mobile debugging, Expo web is available.** You can often debug mobile UI/logic quickly in the browser before switching to a device/simulator.
- **Use `pnpm --filter @dotagents/mobile web`** to run the mobile app with Expo web.
- **Do not confuse Expo web support with full native parity.** Some native-only features still require `expo run:ios` / `expo run:android` or a development build.

## Types

- **Desktop-only shared types belong in `apps/desktop/src/shared/types.ts`.**
- **Cross-app/package types belong in `packages/shared/src/types.ts`.**
- **Legacy types still exist for migration.** Do not use them for new work unless you are touching migration code.

## Naming and concepts

- **Say “agent”, not “persona”.** Use `agent` in user-facing copy, comments, and new code.
- **There are no user profiles in the end-user model.** Global settings live in config / `.agents` files.

## Services and state

- **Main-process services typically use the singleton pattern.** Reuse the exported singleton; do not `new` service instances ad hoc.
- **Use `agentSessionStateManager` for session state.** Avoid writing new logic against raw global `state.*` flags.
- **Always clean up session state in `finally` paths** to avoid leaks.

## `.agents` config gotchas

- **`.agents` is layered:** global `~/.agents/` plus optional workspace `.agents/`; workspace wins on conflicts.
- **Config merge is shallow by key.** Be careful when changing nested config objects.
- **Agents / tasks / skills / memories merge by ID.** Matching workspace IDs override global ones.
- **Frontmatter is simple `key: value`, not full YAML.** Don’t assume YAML features are supported.

## MCP / tooling gotchas

- **Do not hardcode sanitized MCP tool names.** Internal mapping handles provider-safe renaming.
- **Built-in tool definition schemas should stay dependency-light** to avoid circular import problems.
- **Tool-result UI should stay compact.** Render JSON values inline where readable, and make any tool/result payload that would take more than 2 lines collapsible by default.

## Window / Electron gotchas

- **Use `WINDOWS.get(...)` for window lookup.** Do not assume the panel window exists.
- **Null-check panel window access.** Panel-specific resize/behavior is special-cased.

## Practical commands

- Dev: `pnpm dev`
- Shared package only: `pnpm build:shared`
- Mobile (Expo web): `pnpm --filter @dotagents/mobile web`
- Tests: `pnpm test`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`

If you need a step-by-step implementation guide for a subsystem, inspect the nearby files first instead of expanding this document.