---
name: langfuse-worktree-pr
description: "Use when a Langfuse trace points to a real product bug and you want a small, isolated PR from a dedicated worktree."
---

# Langfuse Worktree PR

## Overview
Use this skill when a Langfuse trace points to a real product bug and the goal is to ship a small, isolated PR from a dedicated worktree.

Default target repo: `~/Development/dotagents-mono`
Default delegated coding agent: `augustus`

## Success Criteria
Success means all of the following happen in one flow:
1. create a fresh worktree from `origin/main`
2. investigate one clearly scoped Langfuse-backed issue
3. implement the smallest solid fix with tests
4. commit only intended files
5. push the branch
6. open the PR
7. write a local status artifact with verdict, tests, commit SHA, branch, and PR URL

## Guardrails
- Never work on the main checkout when a worktree was requested.
- Keep the issue PR-sized. Do not bundle multiple unrelated fixes.
- Prefer a new dedicated branch per issue.
- Treat `.agents/tmp/augustus-status.md` as a local coordination artifact; do not require it to be committed.
- If the delegated run stalls, inspect the worktree directly for diff, commit, branch, PR state, and status artifact before deciding it failed.
- If augustus already produced the code but did not finish the PR flow, complete the last-mile steps directly.

## Recommended Worktree Layout
From repo root:

```bash
mkdir -p .worktrees
git fetch origin main
git worktree add -b fix/<slug> .worktrees/<slug> origin/main
```

Use a descriptive slug such as:
- `langfuse-respond-to-user`
- `augustus-acp-startup`
- `augustus-result-cleanup`

## Status Artifact
Write progress to:

```bash
.worktrees/<slug>/.agents/tmp/augustus-status.md
```

The artifact should include:
- verdict: real bug / not a bug / blocked
- issue summary
- changed files
- test command
- branch name
- commit SHA
- PR URL
- exact blocker if unfinished

This file is for coordination and inspection. It can stay untracked.

## Investigation Workflow
1. Read the Langfuse note or ledger first.
2. Scope a single lead.
3. Inspect the exact code path tied to the trace.
4. Confirm whether it is a real product bug.
5. If real, define the smallest fix and matching regression test.
6. If not real, stop and record why.

## Delegation Prompt Pattern
When delegating to augustus, give a machine-checkable contract.

Required elements:
- exact worktree path
- exact branch name
- exact issue focus
- exact files or subsystem to inspect first
- exact test command or expectation to add one
- requirement to push branch and open PR
- requirement to write/update `.agents/tmp/augustus-status.md`
- explicit instruction to return only PR URL, branch, commit SHA, and test command when successful

## Finalization Workflow
After code exists in the worktree:

```bash
git status --short
pnpm vitest run <targeted-tests>
git add <intended-files>
git commit -m "<message>"
git push -u origin <branch>
gh pr create --repo aj47/dotagents-mono --base main --head <branch> --title "<title>" --body "<body>"
```

Append PR metadata to the local status artifact after PR creation.

## Reliability Checks
Before declaring success, verify all of these:
- `git status --short` is clean except acceptable local artifact files
- remote branch exists
- `gh pr list --head <branch>` or returned PR URL confirms the PR exists
- targeted tests passed
- status artifact contains branch, SHA, and PR URL

## Failure Handling
If augustus stalls or returns noisy reasoning text:
- inspect worktree diff directly
- inspect local status artifact directly
- inspect `git log --oneline -n 5`
- inspect remote branch and PR state
- finish remaining push/PR steps yourself if the implementation is already correct

If no diff exists after a reasonable interval, cancel the run and retry with a tighter prompt.
