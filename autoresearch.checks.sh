#!/usr/bin/env bash
set -euo pipefail

# Keep deterministic broad agent-loop coverage intact while the live suite is narrowed.
pnpm --filter @dotagents/desktop exec vitest run src/main/llm.respond-to-user-history.test.ts -t 'replays AutoResearch' --reporter=dot
