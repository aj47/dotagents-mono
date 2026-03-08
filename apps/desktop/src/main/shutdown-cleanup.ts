export type ShutdownCleanupTask = {
  label: string
  run: () => Promise<void> | void
}

type RunShutdownCleanupOptions = {
  tasks: readonly ShutdownCleanupTask[]
  timeoutMs: number
  timeoutMessage: string
  onTaskError: (label: string, error: unknown) => void
  onTimeoutError: (error: unknown) => void
}

export async function runShutdownCleanup({
  tasks,
  timeoutMs,
  timeoutMessage,
  onTaskError,
  onTimeoutError,
}: RunShutdownCleanupOptions): Promise<void> {
  const cleanupPromise = Promise.all(
    tasks.map(async ({ label, run }) => {
      try {
        await run()
      } catch (error) {
        onTaskError(label, error)
      }
    })
  )

  let timeoutId: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      cleanupPromise,
      new Promise<void>((_, reject) => {
        const id = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
        timeoutId = id

        // unref() ensures this timer won't keep the event loop alive
        // if cleanup finishes quickly (only available in Node.js)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (id && typeof (id as any).unref === "function") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(id as any).unref()
        }
      }),
    ])
  } catch (error) {
    onTimeoutError(error)
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
  }
}