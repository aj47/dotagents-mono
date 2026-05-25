# RTK integration

[RTK](https://www.rtk-ai.app/docs/) ("Rust Token Killer") is a CLI proxy that
filters noisy command output before it reaches the LLM. When enabled,
DotAgents transparently rewrites `git status` into `rtk git status` for safe
shell invocations issued through the `execute_command` runtime tool, so the
agent only sees a compact summary.

## Enabling RTK

1. Install the `rtk` binary and make sure it is on `PATH` (or set
   `DOTAGENTS_RTK_BINARY` to an absolute path).
2. Set `DOTAGENTS_RTK=1` in the environment that launches DotAgents.

If the binary cannot be found, wrapping is skipped silently and commands run
unchanged.

## Environment variables

| Variable                  | Default | Purpose                                                                 |
| ------------------------- | ------- | ----------------------------------------------------------------------- |
| `DOTAGENTS_RTK`           | unset   | Opt-in flag. Accepts `1`, `true`, `yes`, `on` (case-insensitive).        |
| `DOTAGENTS_RTK_BINARY`    | `rtk`   | Override the binary name or path used for wrapping and PATH probing.     |

## What gets wrapped

A command is wrapped when **all** of the following are true:

- `DOTAGENTS_RTK` is enabled.
- The `rtk` binary is resolvable on `PATH`.
- The command is a single invocation (no `|`, `&&`, `||`, `;`, redirects,
  subshells, or variable expansions).
- The first token is not destructive or interactive (`rm`, `mv`, `sudo`,
  `docker`, `ssh`, `vim`, `cd`, …) and is not already `rtk`.
- For `git`, the subcommand is not `push`, `reset`, or `clean`.

When wrapping is applied, the `execute_command` result includes
`"rtkWrapped": true` so the agent and any downstream tooling can tell the
output passed through RTK.

## Implementation pointers

- Helpers: `apps/desktop/src/main/rtk.ts`
- Wired into `execute_command` in
  `apps/desktop/src/main/runtime-tools.ts` just before `execAsync`.
- Tests: `apps/desktop/src/main/rtk.test.ts`.
