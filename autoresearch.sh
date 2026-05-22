#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

metrics_dir="${SESSION_E2E_METRICS_DIR:-$ROOT_DIR/tmp/autoresearch-session-lifecycle}"
mkdir -p "$metrics_dir"
metrics_file="$metrics_dir/session-lifecycle-$(date +%Y%m%d-%H%M%S)-$$.json"

scenario="${SESSION_E2E_SCENARIO:-original-e2e}"
sessions="${SESSION_E2E_COUNT:-10}"
close_count="${SESSION_E2E_CLOSE_COUNT:-$((sessions / 2))}"
switch_count="${SESSION_E2E_SWITCH_COUNT:-$((sessions * 2))}"
message_repeat="${SESSION_E2E_MESSAGE_REPEAT:-8}"
repeats="$(node -e 'const n = Math.floor(Number(process.argv[1]) || 3); console.log(Math.max(1, n))' "${SESSION_E2E_REPEATS:-3}")"

run_one() {
  local output_file="$1"
  node "$ROOT_DIR/scripts/session-lifecycle-e2e.mjs" \
    --output "$output_file" \
    --scenario "$scenario" \
    --sessions "$sessions" \
    --close-count "$close_count" \
    --switch-count "$switch_count" \
    --message-repeat "$message_repeat"
}

if [ "$repeats" -eq 1 ]; then
  run_one "$metrics_file"
else
  run_files=()
  metrics_base="${metrics_file%.json}"
  for repeat_index in $(seq 1 "$repeats"); do
    run_file="$(printf '%s-run-%02d.json' "$metrics_base" "$repeat_index")"
    run_files+=("$run_file")
    run_one "$run_file"
  done

  node - "$metrics_file" "${run_files[@]}" <<'NODE'
const fs = require('fs')
const [outputPath, ...runPaths] = process.argv.slice(2)
const runs = runPaths.map((runPath) => JSON.parse(fs.readFileSync(runPath, 'utf8')))

const finiteNumbers = (key) => runs
  .map((run) => Number(run[key]))
  .filter((value) => Number.isFinite(value))

const median = (values) => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

const numericKeys = new Set()
for (const run of runs) {
  for (const [key, value] of Object.entries(run)) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      numericKeys.add(key)
    }
  }
}

const aggregate = {
  ...runs[runs.length - 1],
  status: runs.every((run) => run.status === 'pass') ? 'pass' : 'fail',
  repeat_count: runs.length,
  run_files: runPaths,
  run_totals_ms: finiteNumbers('total_ms'),
  runs: runs.map((run, index) => ({
    index: index + 1,
    metrics_file: runPaths[index],
    status: run.status,
    total_ms: run.total_ms,
    ui_ready_ms: run.ui_ready_ms,
    session_create_ms: run.session_create_ms,
    session_first_paint_ms: run.session_first_paint_ms,
    session_focus_ms: run.session_focus_ms,
    switch_latency_ms_total: run.switch_latency_ms_total,
    switch_latency_ms_p95: run.switch_latency_ms_p95,
    close_latency_ms_total: run.close_latency_ms_total,
    close_latency_ms_p95: run.close_latency_ms_p95,
    ui_raf_delay_p95_ms: run.ui_raf_delay_p95_ms,
  })),
}

for (const key of numericKeys) {
  aggregate[key] = median(finiteNumbers(key))
}

fs.writeFileSync(outputPath, `${JSON.stringify(aggregate, null, 2)}\n`)
NODE
fi

eval "$(node - "$metrics_file" <<'NODE'
const fs = require('fs')
const metricsPath = process.argv[2]
const parsed = fs.existsSync(metricsPath) ? JSON.parse(fs.readFileSync(metricsPath, 'utf8')) : {}
const number = (name) => {
  const value = Number(parsed[name])
  return Number.isFinite(value) ? value : 0
}
const values = {
  session_lifecycle_ms: number('total_ms'),
  session_count: number('session_count'),
  use_case_count: number('use_case_count'),
  running_session_count: number('running_session_count'),
  target_close_count: number('target_close_count'),
  target_switch_count: number('target_switch_count'),
  closed_count: number('closed_count'),
  remaining_count: number('remaining_count'),
  ui_ready_ms: number('ui_ready_ms'),
  session_create_ms: number('session_create_ms'),
  session_first_paint_ms: number('session_first_paint_ms'),
  session_focus_ms: number('session_focus_ms'),
  switch_latency_ms_p50: number('switch_latency_ms_p50'),
  switch_latency_ms_p95: number('switch_latency_ms_p95'),
  switch_latency_ms_max: number('switch_latency_ms_max'),
  switch_latency_ms_total: number('switch_latency_ms_total'),
  close_latency_ms_p50: number('close_latency_ms_p50'),
  close_latency_ms_p95: number('close_latency_ms_p95'),
  close_latency_ms_max: number('close_latency_ms_max'),
  close_latency_ms_total: number('close_latency_ms_total'),
  ui_input_latency_ms: number('ui_input_latency_ms'),
  ui_raf_delay_p95_ms: number('ui_raf_delay_p95_ms'),
  ui_raf_delay_ms: number('ui_raf_delay_ms'),
  ui_long_task_count: number('ui_long_task_count'),
  dom_nodes_after_create: number('dom_nodes_after_create'),
  dom_nodes_final: number('dom_nodes_final'),
}
for (const [key, value] of Object.entries(values)) {
  console.log(`${key}=${value}`)
}
NODE
)"

printf 'METRIC session_lifecycle_ms=%s\n' "$session_lifecycle_ms"
printf 'METRIC session_count=%s\n' "$session_count"
printf 'METRIC use_case_count=%s\n' "$use_case_count"
printf 'METRIC running_session_count=%s\n' "$running_session_count"
printf 'METRIC target_close_count=%s\n' "$target_close_count"
printf 'METRIC target_switch_count=%s\n' "$target_switch_count"
printf 'METRIC closed_count=%s\n' "$closed_count"
printf 'METRIC remaining_count=%s\n' "$remaining_count"
printf 'METRIC ui_ready_ms=%s\n' "$ui_ready_ms"
printf 'METRIC session_create_ms=%s\n' "$session_create_ms"
printf 'METRIC session_first_paint_ms=%s\n' "$session_first_paint_ms"
printf 'METRIC session_focus_ms=%s\n' "$session_focus_ms"
printf 'METRIC switch_latency_ms_p50=%s\n' "$switch_latency_ms_p50"
printf 'METRIC switch_latency_ms_p95=%s\n' "$switch_latency_ms_p95"
printf 'METRIC switch_latency_ms_max=%s\n' "$switch_latency_ms_max"
printf 'METRIC switch_latency_ms_total=%s\n' "$switch_latency_ms_total"
printf 'METRIC close_latency_ms_p50=%s\n' "$close_latency_ms_p50"
printf 'METRIC close_latency_ms_p95=%s\n' "$close_latency_ms_p95"
printf 'METRIC close_latency_ms_max=%s\n' "$close_latency_ms_max"
printf 'METRIC close_latency_ms_total=%s\n' "$close_latency_ms_total"
printf 'METRIC ui_input_latency_ms=%s\n' "$ui_input_latency_ms"
printf 'METRIC ui_raf_delay_p95_ms=%s\n' "$ui_raf_delay_p95_ms"
printf 'METRIC ui_raf_delay_ms=%s\n' "$ui_raf_delay_ms"
printf 'METRIC ui_long_task_count=%s\n' "$ui_long_task_count"
printf 'METRIC dom_nodes_after_create=%s\n' "$dom_nodes_after_create"
printf 'METRIC dom_nodes_final=%s\n' "$dom_nodes_final"
printf 'metrics_file=%s\n' "$metrics_file"
