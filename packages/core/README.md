# @dotagents/core

Platform-agnostic DotAgents runtime and configuration primitives.

This package is the shared runtime extraction point for code that should not depend on Electron, React, or mobile APIs. It currently owns dependency-injected service interfaces, config/state primitives, `.agents` file parsing, safe file writes, and test doubles.

## What Belongs Here

- Service interfaces for platform capabilities:
  - `PathResolver`
  - `ProgressEmitter`
  - `UserInteraction`
  - `NotificationService`
- `ServiceContainer` and `ServiceTokens` for dependency injection.
- Core config/state helpers that are not desktop-only.
- `.agents` protocol file helpers for:
  - frontmatter
  - modular config
  - agent profiles
  - skills
  - knowledge notes
  - tasks
  - safe file writes
- Mock services for tests.

## What Does Not Belong Here

- Electron main-process services.
- Renderer UI code or React components.
- Mobile-only code.
- Desktop-only shared types from `apps/desktop/src/shared/types.ts`.
- Cross-app data contracts that belong in `@dotagents/shared`.

## Commands

Run from the repo root:

```bash
pnpm --filter @dotagents/core build
pnpm --filter @dotagents/core typecheck
pnpm --filter @dotagents/core test
```

## Import Boundary

Consumers should import through the package entry point:

```ts
import { ServiceContainer, loadMergedAgentsConfig } from "@dotagents/core"
```

Avoid deep imports unless you are working inside the package or migrating code.

## Related Docs

- [Architecture Deep Dive](../../docs-site/docs/development/architecture.md)
- [.agents Protocol](../../docs-site/docs/concepts/dot-agents-protocol.md)
- [Docs Coverage](../../docs-site/docs/development/docs-coverage.md)
