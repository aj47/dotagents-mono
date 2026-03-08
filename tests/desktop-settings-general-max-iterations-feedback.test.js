const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-general.tsx'),
  'utf8',
)

test('general settings keeps max-iterations edits local until a valid draft can be saved', () => {
  assert.match(settingsSource, /function getMcpMaxIterationsDraft\(config\?: Partial<Config>\)/)
  assert.match(settingsSource, /function getValidMcpMaxIterations\(value: string\): number \| null/)
  assert.match(settingsSource, /function normalizeMcpMaxIterationsDraft\(value: string, fallbackValue = DEFAULT_MCP_MAX_ITERATIONS\)/)
  assert.match(settingsSource, /const \[mcpMaxIterationsDraft, setMcpMaxIterationsDraft\] = useState\(\(\) =>/)
  assert.match(settingsSource, /const mcpMaxIterationsSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> \| null>\(null\)/)
  assert.match(settingsSource, /const scheduleMcpMaxIterationsSave = useCallback\(/)
  assert.match(settingsSource, /const nextValue = getValidMcpMaxIterations\(value\)/)
  assert.match(settingsSource, /if \(nextValue === null \|\| nextValue === currentValue\)/)
  assert.match(settingsSource, /saveConfig\(\{ mcpMaxIterations: nextValue \}\)/)
})

test('general settings max-iterations input now binds to the local draft and normalizes on blur', () => {
  assert.match(settingsSource, /value=\{mcpMaxIterationsDraft\}/)
  assert.match(settingsSource, /setMcpMaxIterationsDraft\(value\)/)
  assert.match(settingsSource, /scheduleMcpMaxIterationsSave\(value\)/)
  assert.match(settingsSource, /onBlur=\{\(e\) => flushMcpMaxIterationsDraft\(e\.currentTarget\.value\)\}/)
  assert.match(settingsSource, /Use 1–50\. Saves after a short pause so you can finish typing a full value\./)
})