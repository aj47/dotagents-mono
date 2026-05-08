# Prism Modularization Remaining Work

Status as of 2026-05-08: not complete.

Objective: make the Electron app a UI wrapper over shared server capabilities, and make the mobile app capable of everything desktop can do except native-only behavior such as global hotkeys and dictation.

## Completed In This Branch Recently

- Shared repeat task edit helpers and schedule draft helpers.
- Shared session set membership helpers.
- Shared model option search filtering.
- Shared MCP tool filtering, source grouping, and grouped source filtering.
- Shared prompt library search filtering, command item building, and slash command input parsing.
- Desktop renderer code now consumes the shared helpers for several prompt, repeat task, model, and MCP UI paths.

## Remaining Work

- Build a real desktop-to-mobile parity matrix from code, not assumptions. For each desktop feature, record whether mobile has UI, shared API access, tests, and any native-only exclusion.
- Continue moving desktop main-process business logic into shared server modules where the capability is not Electron-specific.
- Replace desktop-only IPC assumptions with shared clients/contracts that mobile can call through the same server surface.
- Audit renderer imports and shared package dependency direction after each migration to avoid `src/main` leakage and circular imports.
- Expand mobile UI coverage for capabilities that already have shared APIs but no mobile entry point.
- Add or update tests that prove shared behavior works outside Electron, then keep focused desktop and mobile typechecks green.

## Suggested Next Slices

- Convert another MCP config/tool manager derivation to shared utilities where the same logic is needed by mobile.
- Audit prompt library and slash command parity on mobile after the recent shared prompt helper work.
- Pick one desktop capability that still depends on main-process-only state, extract the server-facing logic, then wire desktop back through the shared contract.
