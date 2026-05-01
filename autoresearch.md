# Autoresearch: system prompt token reduction with preserved effectiveness

## Objective
Reduce the number of tokens in DotAgents' assembled system prompt while preserving the constraint-preserving retry behavior that was promoted to `main`.

The benchmark reuses five archived replay cases from the prior session to ensure compressed prompts still handle messy long-context continuation, status turns, active approval boundaries, safe retry behavior, and skills-registry diagnosis. Accepted changes must be general prompt or prompt-assembly improvements, not fixture-specific shortcuts.

## Metrics
- **Primary**: `prompt_token_penalty_score` (unitless, lower is better) — `system_prompt_tokens_max` plus a large effectiveness penalty if the replay score drops below the configured floor (`AUTORESEARCH_EFFECTIVENESS_FLOOR`, default `0.65`).
- **Secondary**: `system_prompt_tokens_max`, `system_prompt_chars_max`, `constraint_preserving_retry_e2e_score`, `pass_rate`, `quality_avg`, `avg_extra_tool_calls`, `runner_failures`, `anti_hardcoding_violations`, `effectiveness_penalty`.

## How to Run
`./autoresearch.sh`

The script runs all five replay cases through `autoresearch/e2e.py` in live mode using the current DotAgents main-process agent loop, scores final responses/tool traces with labels hidden from the product model, measures the actual system message captured in prompt snapshots, and emits `METRIC name=value` lines.

Defaults: `chatgpt-web` provider and `gpt-5.4-mini` model, sourcing Codex CLI auth from `~/.codex/auth.json` when no explicit token is provided.

## Files in Scope
Candidate/product changes may touch only:
- `apps/desktop/src/main/system-prompts-default.ts` — default base policy text.
- `apps/desktop/src/main/system-prompts.ts` — prompt assembly, conditional prompt sections, compact/minimal prompt behavior.
- `apps/desktop/src/main/llm.ts` — only if changing general prompt-selection/context-shrinking behavior that affects system-prompt size without reducing safety.
- `autoresearch/candidates/prompt-token-reduction/**` — candidate manifests/notes/patch receipts.

Harness/session files for this run:
- `autoresearch.sh` — fixed benchmark command, token counter, and heuristic scorer for this session.
- `apps/desktop/src/main/autoresearch-e2e.live.test.ts` and `autoresearch/e2e.py` — current-worktree e2e runner scaffold.

## Off Limits
Do not edit after this baseline setup:
- `autoresearch/fixtures/**`
- private scoring/rubric logic in `autoresearch.sh`
- source conversation archives
- `docs/autoresearch-harness/program.md`
- provider/model selection unless starting a new experiment session

## Constraints
- Use `pnpm` only.
- Do not add dependencies.
- Do not leak private labels into prompts sent to the model.
- Do not hardcode fixture IDs, case IDs, exact user prompts, conversation IDs, exact tool-error strings, or seed-only artifact paths in product code.
- Optimize general DotAgents prompt efficiency and behavior, not the seed fixture.
- Keep one small hypothesis per candidate.
- Token reductions that materially degrade effectiveness should be discarded even if the prompt is shorter.

## What's Been Tried
- New session initialized from merged `main` after PR #419. Baseline should measure the promoted constraint-preserving prompt before compression attempts.
