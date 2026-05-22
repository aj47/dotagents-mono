#!/usr/bin/env bash
set -euo pipefail

pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/active-agents-sidebar.layout.test.ts src/renderer/src/pages/sessions.in-app-actions.test.ts src/renderer/src/stores/agent-store.test.ts
pnpm --filter @dotagents/desktop typecheck
