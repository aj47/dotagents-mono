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
- Kept compact current-time injection (`a7e6f0ae`): prompt tokens dropped to `2134` (-5) by formatting local time as a compact timestamp with timezone; e2e stayed just above floor at `0.652`. This is a tiny low-risk size win, but the margin to the effectiveness floor is narrow.
- Kept runtime-tool list by name only (`3c65ce66`): prompt tokens dropped to `2104` (-30) and live e2e scored `0.730` with zero extra tool calls. Runtime tool descriptions in the system prompt list appear redundant with native tool schemas plus agent-mode prose for this workload.
- Kept compact duplicated agent-mode local memory/config guidance (`cc0896ca`): prompt tokens dropped to `1800` (-304) and live e2e improved to `0.904`. Detailed agent-mode knowledge-notes, past-conversations, DotAgents-config, and config-admin skill prose was redundant with base guidance; a concise reminder preserved resume-prior-work and config-layer semantics.
- Discarded aggressive `STATUS & CONTINUATION TURNS` compression into three bullets: tokens dropped to `1752` (-48) but e2e collapsed to `0.426`, worsening primary to `12952`. This section is behavior-critical; leave the expanded wording intact unless changing only one sentence at a time.
- Kept inline DotAgents runtime tool list (`63647ae6`): prompt tokens dropped to `1794` (-6) and live e2e remained strong at `0.946`. Native schemas and agent-mode prose are sufficient; the prompt list can be compact formatting only.
- Discarded shortening the base `TONE` line: saved only 3 tokens (`1791`) but live e2e collapsed to `0.188`, worsening primary to `24891`. Likely noisy or surprisingly tone-sensitive; the tiny token win is not worth risk. Avoid more base tone/autonomy wording edits.
- Discarded removing the compact agent-mode local memory/config reminder entirely: tokens dropped to `1676` (-118) but e2e collapsed to `0.246`, worsening primary to `21876`. Keep this reminder; if optimizing, preserve all three concepts (durable notes, prior conversations/resume, layered config/config-admin) and trim only one phrase at a time.
- Discarded phrase-level trimming of the compact local memory/config reminder: saved 15 tokens (`1779`) but e2e collapsed to `0.248`, worsening primary to `21879`. Do not further trim this section in this session; keep the exact compact reminder from `cc0896ca`/`63647ae`.
- Discarded omitting the runtime tool names list in agent mode: saved 12 tokens (`1782`) but e2e collapsed to `0.218`, worsening primary to `23382`. Keep the compact inline runtime tool list; it appears to serve as an important availability cue despite native tool schemas.
- Discarded combining the first three base `TOOL USAGE` bullets: saved 27 tokens (`1767`) but e2e collapsed to `0.212`, worsening primary to `23667`. Avoid compressing base TOOL USAGE in this session; the explicit separate bullets may anchor tool behavior or the live variance is too high.
- Reran current champion unchanged: primary stayed `1794` with e2e `0.696`, still above floor but far below the earlier `0.946` keep run. The live benchmark is noisy; require caution for tiny prompt edits and consider confirmation for candidates near the `0.65` floor.
- Discarded removing the base DotAgents config common-file examples bullet: saved 69 tokens (`1725`) but e2e dropped to `0.410`, worsening primary to `13725`. Avoid deleting base config details in this session; they may help skill/config path reasoning.
- Kept dropping seconds from the compact current-time injection (`3ef7c632`): prompt tokens dropped to `1792` (-2) while e2e stayed above floor at `0.698`. Tiny low-risk formatting win; date/hour/minute/timezone are preserved.
- Discarded compressing the inline runtime tools header/separators (`DOTAGENTS TOOLS: a, b` -> `TOOLS: a b`): saved 5 tokens (`1787`) but e2e dropped to `0.454`, worsening primary to `11587`. Keep the proven `DOTAGENTS TOOLS: name, name` availability cue.
