---
sidebar_position: 3
sidebar_label: "Apps & Packages"
---

# Apps & Packages

This is the contributor map for every tracked app, package, server surface, and shipped support area in the monorepo.

---

## Workspace Packages

The pnpm workspace is defined in `pnpm-workspace.yaml`:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

`docs-site` is a separate Docusaurus package outside that workspace glob. Use `pnpm --dir docs-site ...` for docs-site commands.

## Apps

| Path | Runtime | Owns | Main commands |
|------|---------|------|---------------|
| `apps/desktop` | Electron, React, Rust helper binary | Desktop UI, main-process agent runtime, MCP/ACP/acpx, remote server, integrations, updater, release packaging | `pnpm --filter @dotagents/desktop dev`, `pnpm --filter @dotagents/desktop build`, `pnpm --filter @dotagents/desktop test:run` |
| `apps/mobile` | Expo, React Native, React Native Web | iOS/Android/web mobile client, voice UX, QR pairing, remote API client, operator dashboard | `pnpm --filter @dotagents/mobile start`, `pnpm --filter @dotagents/mobile web`, `pnpm --filter @dotagents/mobile test` |
| `apps/promo-studio` | Tracked media output only | Demo and marketing renders used by launch/website assets | No package script currently; add a README if source project files are added |

## Desktop App Boundaries

| Path | Purpose | Notes |
|------|---------|-------|
| `apps/desktop/src/main` | Electron main process, local agent runtime, MCP/ACP, remote server, persistence, integrations | Renderer code must not import from here. Reuse singleton services instead of constructing ad hoc instances. |
| `apps/desktop/src/renderer/src` | React renderer app, routes, settings, sessions, panel UI | Talks to the main process through preload/TIPC. Use renderer aliases such as `@renderer/*` or `~/*`. |
| `apps/desktop/src/preload` | Secure IPC bridge exposed to renderer | Keep this boundary narrow and typed. |
| `apps/desktop/src/shared` | Desktop-only types shared by main/preload/renderer | Cross-app contracts belong in `packages/shared`. |
| `apps/desktop/dotagents-rs` | Rust native keyboard/input helper | Built by `pnpm --filter @dotagents/desktop build-rs`. |
| `apps/desktop/scripts` | Desktop build, release, Rust, perf, and install helpers | Prefer package scripts over calling internals directly. |

## Desktop Server Surfaces

| Surface | Source | Documentation |
|---------|--------|---------------|
| Remote HTTP API | `apps/desktop/src/main/remote-server.ts` | [Remote API Reference](/reference/api) |
| Mobile pairing | `apps/desktop/src/main/remote-server.ts`, `apps/mobile/src/screens/ConnectionSettingsScreen.tsx` | [Remote Server & Mobile Pairing](/desktop/remote-server) |
| ACP-injected MCP runtime transport | `apps/desktop/src/main/remote-server.ts`, `apps/desktop/src/main/acpx/` | [Remote API Reference](/reference/api), [Architecture Deep Dive](architecture) |
| Operator dashboard endpoints | `apps/desktop/src/main/remote-server.ts`, `apps/mobile/src/screens/OperationsScreen.tsx` | [Remote API Reference](/reference/api), [Mobile App](/mobile/overview) |
| Cloudflare Tunnel controls | `apps/desktop/src/main/cloudflare-tunnel.ts` | [Remote Server & Mobile Pairing](/desktop/remote-server), [Settings Reference](/configuration/settings) |
| Discord operator commands | `apps/desktop/src/main/discord-service.ts` | [Discord Integration](/tools/discord) |
| WhatsApp operator commands | `packages/mcp-whatsapp/src/index.ts` | [WhatsApp Integration](/tools/whatsapp) |

## Mobile App Boundaries

| Path | Purpose |
|------|---------|
| `apps/mobile/App.tsx` | Navigation, providers, deep links, notification routing, app-level sync |
| `apps/mobile/src/screens` | User-facing screens: chat, sessions, split chat, settings, connection, operations, agent editing, knowledge notes, loops |
| `apps/mobile/src/lib` | Remote API clients, OpenAI-compatible chat client, sync, connection/tunnel recovery, push, TTS, voice helpers |
| `apps/mobile/src/lib/voice` | Speech recognition, hands-free controller, phrase matching |
| `apps/mobile/src/store` | AsyncStorage-backed config, sessions, profiles, queue, connection state |
| `apps/mobile/src/ui` | Reusable mobile UI components and markdown/theme rendering |
| `apps/mobile/android` | Native Android project generated for development builds |
| `apps/mobile/tests` | Node-based mobile utility tests |

Native iOS/Android devices require a development build for `expo-speech-recognition`; Expo Go is not enough.

## Packages

| Path | Package | Owns | Main commands |
|------|---------|------|---------------|
| `packages/core` | `@dotagents/core` | Platform-agnostic config/runtime primitives, service interfaces, `.agents` file helpers, testing mocks | `pnpm --filter @dotagents/core build`, `pnpm --filter @dotagents/core test`, `pnpm --filter @dotagents/core typecheck` |
| `packages/shared` | `@dotagents/shared` | Cross-app API contracts, message/session/progress types, providers, colors, language/STT/TTS helpers | `pnpm --filter @dotagents/shared build`, `pnpm --filter @dotagents/shared test`, `pnpm --filter @dotagents/shared typecheck` |
| `packages/mcp-whatsapp` | `@dotagents/mcp-whatsapp` | Standalone WhatsApp MCP server, WhatsApp session/auth, `/ops` bridge to DotAgents operator endpoints | `pnpm --filter @dotagents/mcp-whatsapp build`, `pnpm --filter @dotagents/mcp-whatsapp typecheck` |

If you change `packages/shared`, run `pnpm build:shared` before `pnpm dev`.

## Docs, Website, Scripts, and Tests

| Path | Owns | Commands |
|------|------|----------|
| `docs-site` | Docusaurus documentation site | `pnpm --dir docs-site start`, `pnpm --dir docs-site build`, `pnpm --dir docs-site typecheck` |
| `website` | Static marketing site for dotagents.app | `cd website && python3 -m http.server 4321` |
| `scripts` | Root install, release, migration, Linux smoke, docs coverage helpers | Use the documented root/package scripts first |
| `tests` | Repo-level integration tests | `pnpm test` or package-specific test commands |

## Validation

For docs coverage work:

```bash
pnpm docs:coverage
pnpm --dir docs-site build
```

For code changes:

```bash
pnpm typecheck
pnpm test
```

Use narrower package commands when the change is scoped.
