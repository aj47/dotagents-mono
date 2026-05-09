# @dotagents/shared

Cross-app types, API contracts, constants, and utilities shared by DotAgents desktop, mobile, and package code.

This package is the right place for data shapes and helpers that need to be consumed by more than one app. It should stay dependency-light and avoid Electron, React Native, and renderer-only assumptions.

## What Belongs Here

- API contract types in `api-types.ts`.
- Agent progress, session, conversation, and message types.
- Provider/model metadata and STT/TTS utilities.
- Shared display helpers for markdown/messages/tool activity.
- Connection recovery utilities used by remote clients.
- Design constants that must match across apps, such as colors and languages.

## What Does Not Belong Here

- Desktop-only shared types. Use `apps/desktop/src/shared/types.ts`.
- Main-process services or renderer components.
- Mobile screens, stores, or native integrations.
- Code that requires Electron, Node-only filesystem access, or React Native APIs.

## Commands

Run from the repo root:

```bash
pnpm --filter @dotagents/shared build
pnpm --filter @dotagents/shared typecheck
pnpm --filter @dotagents/shared test
```

If you change this package before running the desktop app, rebuild it first:

```bash
pnpm build:shared
```

## Import Boundary

Consumers should import through the package entry point:

```ts
import type { AgentProgressUpdate, ModelsResponse } from "@dotagents/shared"
import { normalizeApiBaseUrl } from "@dotagents/shared"
```

Do not copy shared API types into mobile or desktop clients. Add them here and re-export them from `src/index.ts`.

## Related Docs

- [Remote API Reference](../../docs-site/docs/reference/api.md)
- [Architecture Deep Dive](../../docs-site/docs/development/architecture.md)
- [Docs Coverage](../../docs-site/docs/development/docs-coverage.md)
