#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

start_ms="$(node -e 'process.stdout.write(String(Date.now()))')"
metrics_dir="${AGENT_LOOP_METRICS_DIR:-$ROOT_DIR/tmp/autoresearch-agent-loop}"
mkdir -p "$metrics_dir"
metrics_file="$metrics_dir/live-agent-loop-$(date +%Y%m%d-%H%M%S)-$$.jsonl"

# The live runner defaults LIVE_AGENT_LOOP_E2E=1; the optional extra LLM judge is strict-mode only.
AGENT_LOOP_METRICS_FILE="$metrics_file" \
  pnpm --filter @dotagents/desktop test:agent-loop-live -- --reporter=dot

end_ms="$(node -e 'process.stdout.write(String(Date.now()))')"
e2e_seconds="$(node -e 'console.log(((Number(process.argv[2])-Number(process.argv[1]))/1000).toFixed(3))' "$start_ms" "$end_ms")"

ui_metrics_file=""
if [[ "${RUN_UI_SMOKE:-1}" == "1" ]]; then
  ui_metrics_file="$metrics_dir/ui-smoke-$(date +%Y%m%d-%H%M%S)-$$.json"
  if [[ -x "$ROOT_DIR/scripts/ui-responsiveness-smoke.mjs" ]]; then
    node "$ROOT_DIR/scripts/ui-responsiveness-smoke.mjs" --output "$ui_metrics_file"
  else
    node -e 'const fs=require("fs"); fs.writeFileSync(process.argv[1], JSON.stringify({ skipped: true, ui_ready_ms: 0, ui_input_latency_ms: 0, ui_long_task_count: 0 }))' "$ui_metrics_file"
  fi
fi

eval "$(node - "$metrics_file" "$ui_metrics_file" <<'NODE'
const fs = require('fs')
const [metricsPath, uiPath] = process.argv.slice(2)
const rows = fs.existsSync(metricsPath)
  ? fs.readFileSync(metricsPath, 'utf8').split(/\n+/).filter(Boolean).map((line) => JSON.parse(line))
  : []
const sum = (name) => rows.reduce((total, row) => total + (Number(row[name]) || 0), 0)
const max = (name) => rows.reduce((value, row) => Math.max(value, Number(row[name]) || 0), 0)
const countStatus = (status) => rows.filter((row) => row.status === status).length
let ui = { ui_ready_ms: 0, ui_input_latency_ms: 0, ui_long_task_count: 0 }
if (uiPath && fs.existsSync(uiPath)) {
  try {
    const parsed = JSON.parse(fs.readFileSync(uiPath, 'utf8'))
    ui = {
      ui_ready_ms: Number(parsed.ui_ready_ms || parsed.readyMs || 0),
      ui_input_latency_ms: Number(parsed.ui_input_latency_ms || parsed.inputLatencyMs || 0),
      ui_long_task_count: Number(parsed.ui_long_task_count || parsed.longTaskCount || 0),
    }
  } catch {}
}
const values = {
  live_case_count: rows.length,
  live_pass_count: countStatus('pass'),
  live_fail_count: countStatus('fail'),
  live_duration_ms_total: sum('durationMs'),
  live_duration_ms_max: max('durationMs'),
  llm_calls_total: sum('llmCalls'),
  verifier_calls_total: sum('verifierCalls'),
  llm_judge_calls_total: sum('llmJudgeCalls'),
  tool_calls_total: sum('toolCallsTotal'),
  ui_ready_ms: ui.ui_ready_ms,
  ui_input_latency_ms: ui.ui_input_latency_ms,
  ui_long_task_count: ui.ui_long_task_count,
}
for (const [key, value] of Object.entries(values)) {
  console.log(`${key}=${Number.isFinite(value) ? value : 0}`)
}
NODE
)"

printf 'METRIC e2e_seconds=%s\n' "$e2e_seconds"
printf 'METRIC live_case_count=%s\n' "$live_case_count"
printf 'METRIC live_pass_count=%s\n' "$live_pass_count"
printf 'METRIC live_fail_count=%s\n' "$live_fail_count"
printf 'METRIC live_duration_ms_total=%s\n' "$live_duration_ms_total"
printf 'METRIC live_duration_ms_max=%s\n' "$live_duration_ms_max"
printf 'METRIC llm_calls_total=%s\n' "$llm_calls_total"
printf 'METRIC verifier_calls_total=%s\n' "$verifier_calls_total"
printf 'METRIC llm_judge_calls_total=%s\n' "$llm_judge_calls_total"
printf 'METRIC tool_calls_total=%s\n' "$tool_calls_total"
printf 'METRIC ui_ready_ms=%s\n' "$ui_ready_ms"
printf 'METRIC ui_input_latency_ms=%s\n' "$ui_input_latency_ms"
printf 'METRIC ui_long_task_count=%s\n' "$ui_long_task_count"
printf 'metrics_file=%s\n' "$metrics_file"
[[ -z "$ui_metrics_file" ]] || printf 'ui_metrics_file=%s\n' "$ui_metrics_file"
