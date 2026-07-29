# RTK integration

[RTK](https://github.com/rtk-ai/rtk) ("Rust Token Killer") is a CLI proxy
that filters noisy command output before it reaches the LLM. The `rtk`
binary is **bundled with DotAgents** — no separate install required — and
wrapping is **on by default**. When safe shell commands run through the
`execute_command` runtime tool they are transparently rewritten as
`rtk <command>`, so the agent only sees a compact summary.

## Disabling

Set one of the following in the environment that launches DotAgents to
turn wrapping off entirely:

```
DOTAGENTS_RTK=0
DOTAGENTS_RTK=false
DOTAGENTS_RTK=off
```

## Environment variables

| Variable                  | Default          | Purpose                                                                                       |
| ------------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| `DOTAGENTS_RTK`           | enabled          | Set `0`/`false`/`no`/`off` to disable wrapping.                                               |
| `DOTAGENTS_RTK_BINARY`    | bundled `rtk`    | Override the binary path/name. Useful for testing a locally-installed `rtk` against bundled.  |

## How the binary is bundled

The desktop build calls `apps/desktop/scripts/ensure-rtk-binary.ts` from
the `predev` and `build-rs` hooks. Because RTK does not publish prebuilt
binaries, the script invokes
`cargo install --git https://github.com/rtk-ai/rtk --bin rtk` and copies
the resulting binary into `apps/desktop/resources/bin/rtk[.exe]`. From
there electron-builder bundles it via the existing `extraResources` /
`mac.binaries` config the same way it ships `dotagents-rs`.

If `cargo` is not on `PATH`, the script emits a warning and continues —
the packaged binary is omitted and the runtime falls back to a no-op
(`rtkWrapped` is simply not set). Release CI sets
`DOTAGENTS_RTK_REQUIRED=1` to turn a missing binary into a hard build
failure.

Pin a specific upstream commit/tag at build time via:

```
RTK_GIT_URL=https://github.com/rtk-ai/rtk RTK_GIT_REF=v0.40.0 pnpm build-rs
```

## What gets wrapped

A command is wrapped when **all** of the following are true:

- RTK is not explicitly disabled via `DOTAGENTS_RTK`.
- The `rtk` binary file is present (bundled or overridden via env).
- The command is a single invocation (no `|`, `&&`, `||`, `;`, redirects,
  subshells, or leading `FOO=bar` env assignments).
- The first token is not destructive or interactive (`rm`, `mv`, `sudo`,
  `docker`, `ssh`, `vim`, `cd`, …) and is not already `rtk`.
- For `git`, the subcommand is not `push`, `reset`, or `clean`.

When wrapping is applied, the `execute_command` result includes
`"rtkWrapped": true` so the agent and any downstream tooling can tell the
output passed through RTK.

## Implementation pointers

- Wrapper helpers: `apps/desktop/src/main/rtk.ts`
- Bundled-binary build: `apps/desktop/scripts/ensure-rtk-binary.ts`
- electron-builder config: `apps/desktop/electron-builder.config.cjs`
- Wired into `execute_command` in
  `apps/desktop/src/main/runtime-tools.ts` just before `execAsync`.
- Tests: `apps/desktop/src/main/rtk.test.ts`.
