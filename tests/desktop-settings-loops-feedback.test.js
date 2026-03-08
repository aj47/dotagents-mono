const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-loops.tsx'),
  'utf8'
)

test('repeat task settings keep load and fetch-failure states distinct from the empty state', () => {
  assert.match(settingsSource, /const isLoadingLoops = loopsQuery\.isLoading && !loopsQuery\.data/)
  assert.match(settingsSource, /const hasLoopLoadError = loopsQuery\.isError && !loopsQuery\.data/)
  assert.match(settingsSource, /Loading repeat tasks\.\.\./)
  assert.match(settingsSource, /Checking your saved schedules and their latest run details\./)
  assert.match(settingsSource, /Couldn&apos;t load repeat tasks/)
  assert.match(settingsSource, /not showing the empty-state placeholder yet\./)
  assert.match(settingsSource, /getLoopQueryErrorMessage\(loopsQuery\.error\)/)
  assert.match(settingsSource, /void loopsQuery\.refetch\(\)/)
  assert.match(settingsSource, /Retry loading/)
})

test('repeat task empty state still exists for the genuine no-tasks case', () => {
  assert.match(settingsSource, /No repeat tasks configured\. Click &quot;Add Task&quot; to create one\./)
})

test('repeat task settings warn when live runtime status refresh fails after tasks load', () => {
  assert.match(settingsSource, /const hasLoopStatusLoadError = loopStatusesQuery\.isError && loops\.length > 0/)
  assert.match(settingsSource, /const hasCachedLoopStatuses = Array\.isArray\(loopStatusesQuery\.data\) && loopStatusesQuery\.data\.length > 0/)
  assert.match(settingsSource, /Live repeat-task status is temporarily unavailable/)
  assert.match(settingsSource, /last loaded Running \/ Next run details may be stale until status refresh succeeds\./)
  assert.match(settingsSource, /Running \/ Next run details are unavailable until status refresh succeeds\./)
  assert.match(settingsSource, /getLoopQueryErrorMessage\(loopStatusesQuery\.error\)/)
  assert.match(settingsSource, /void loopStatusesQuery\.refetch\(\)/)
  assert.match(settingsSource, /Retry status/)
})

test('repeat task row actions show local pending state and disable conflicting controls while run or toggle requests are in flight', () => {
  assert.match(settingsSource, /const \[pendingActionById, setPendingActionById\] = useState<Record<string, LoopPendingAction>>\(\{\}\)/)
  assert.match(settingsSource, /setPendingAction\(loop\.id, \{ kind: "run" \}\)/)
  assert.match(settingsSource, /setPendingAction\(loop\.id, \{ kind: "toggle", targetEnabled \}\)/)
  assert.match(settingsSource, /const isBusy = isDeleting \|\| isRowActionPending/)
  assert.match(settingsSource, /disabled=\{isBusy\}[\s\S]*handleRunNow\(loop\)/)
  assert.match(settingsSource, /disabled=\{isBusy\}[\s\S]*handleOpenTaskFile\(loop\)/)
  assert.match(settingsSource, /disabled=\{isBusy\}[\s\S]*handleEdit\(loop\)/)
  assert.match(settingsSource, /<Switch[\s\S]*disabled=\{isBusy\}/)
  assert.match(settingsSource, /Loader2 className="h-3\.5 w-3\.5 animate-spin" \/>Running\.\.\./)
  assert.match(settingsSource, /const toggleStatusLabel = pendingAction\?\.kind === "toggle"/)
  assert.match(settingsSource, /"Enabling\.\.\."/)
  assert.match(settingsSource, /"Disabling\.\.\."/)
})

test('repeat task row actions keep retryable inline feedback for run failures and partial enable failures', () => {
  assert.match(settingsSource, /const \[actionFeedbackById, setActionFeedbackById\] = useState<Record<string, LoopActionFeedback>>\(\{\}\)/)
  assert.match(settingsSource, /if \(startResult && !startResult\.success\) \{[\s\S]*saved as enabled, but its schedule could not start yet\. Retry enabling to start it again\./)
  assert.match(settingsSource, /Couldn't run \\\"\$\{loop\.name\}\\\" right now\. It may already be running, or the agent may be temporarily unavailable\./)
  assert.match(settingsSource, /role=\{actionFeedback \? "alert" : "status"\}/)
  assert.match(settingsSource, /Retry run/)
  assert.match(settingsSource, /Retry enable/)
  assert.match(settingsSource, /Retry disable/)
  assert.match(settingsSource, /Dismiss/)
  assert.match(settingsSource, /handleSetEnabled\(loop, actionFeedback\.targetEnabled\)/)
})