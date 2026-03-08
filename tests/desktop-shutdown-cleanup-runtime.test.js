const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

async function loadShutdownCleanupModule() {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'shutdown-cleanup.ts')
  ).href

  return import(moduleUrl)
}

test('runShutdownCleanup keeps later cleanup tasks running when one task fails', async () => {
  const { runShutdownCleanup } = await loadShutdownCleanupModule()
  const completed = []
  const taskErrors = []
  const timeoutErrors = []

  await runShutdownCleanup({
    tasks: [
      {
        label: 'first cleanup',
        run: async () => {
          completed.push('first')
        },
      },
      {
        label: 'broken cleanup',
        run: async () => {
          completed.push('broken')
          throw new Error('boom')
        },
      },
      {
        label: 'final cleanup',
        run: async () => {
          completed.push('final')
        },
      },
    ],
    timeoutMs: 100,
    timeoutMessage: 'cleanup timed out',
    onTaskError: (label, error) => {
      taskErrors.push({ label, message: error instanceof Error ? error.message : String(error) })
    },
    onTimeoutError: (error) => {
      timeoutErrors.push(error)
    },
  })

  assert.deepEqual(completed, ['first', 'broken', 'final'])
  assert.deepEqual(taskErrors, [{ label: 'broken cleanup', message: 'boom' }])
  assert.equal(timeoutErrors.length, 0)
})

test('runShutdownCleanup reports timeout through onTimeoutError without throwing', async () => {
  const { runShutdownCleanup } = await loadShutdownCleanupModule()
  const timeoutErrors = []
  let returned = false

  await runShutdownCleanup({
    tasks: [
      {
        label: 'stalled cleanup',
        run: () => new Promise(() => {}),
      },
    ],
    timeoutMs: 10,
    timeoutMessage: 'cleanup timed out',
    onTaskError: () => {
      throw new Error('unexpected task error callback')
    },
    onTimeoutError: (error) => {
      timeoutErrors.push(error instanceof Error ? error.message : String(error))
    },
  })
  returned = true

  assert.equal(returned, true)
  assert.deepEqual(timeoutErrors, ['cleanup timed out'])
})