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
- Baseline (`6afc8599`): `prompt_token_penalty_score=11772`, `system_prompt_tokens_max=2472`, `system_prompt_chars_max=11900`, `constraint_preserving_retry_e2e_score=0.464`, `effectiveness_penalty=9300`. The merged constraint-preserving prompt is token-heavy and the live e2e score remains noisy; compression candidates must reduce tokens without materially worsening e2e effectiveness and should ideally recover above the 0.65 floor.
- Discarded broad base-prompt compression of knowledge notes, past conversations, and DotAgents config into one local-memory/config section: tokens dropped to `2200` (-11%) but e2e score fell to `0.402`, worsening primary metric to `14600`. Preserve concrete retrieval/config details for now; try lower-risk duplicated agent-mode sections next.
- Kept compact agent-mode `RESPONDING TO USER` guidance (`61f6fefc`): prompt tokens dropped to `2417` (-55) and live e2e score improved to `0.694`, clearing the effectiveness floor and improving primary metric to `2417`. The e2e gain may include live-model variance, but the token reduction is isolated/low-risk.
- Kept compact common `COMPLETION SIGNAL` branch: prompt tokens dropped further to `2392` (-25 from prior best), live e2e stayed above the effectiveness floor at `0.656`, and primary improved to `2392`. This preserves final-answer-before-mark-complete ordering while removing formatting/duplicate wording.
- Kept compact `SKILLS` guidance (`f246432e`): prompt tokens dropped to `2359` (-33) while e2e stayed above floor at `0.678` and extra tool calls improved. The shorter wording still preserves one-load-per-session, refresh-before-recreate, and no-guessing behavior.
- Kept compact `execute_command` shell/file-operation guidance (`f16da5da`): prompt tokens dropped to `2139` (-220) while e2e stayed above floor at `0.656`. Removed verbose write/list/create/run examples while preserving package-manager inference, read-only status probes, no unrequested install/test/build/lint/typecheck, and ranged large-file reading.
- Discarded broad base `SHELL COMMANDS & FILE OPERATIONS` + `FILE READING` compression: tokens dropped to `1956` (-183) but e2e fell to `0.442`, worsening primary to `12356`. Keep the base shell/file detail for now; if revisiting, remove only one redundant sentence at a time and preserve concrete examples.
