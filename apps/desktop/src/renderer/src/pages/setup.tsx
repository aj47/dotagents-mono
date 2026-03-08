import { useMicrophoneStatusQuery } from "@renderer/lib/queries"
import { Button } from "@renderer/components/ui/button"
import { tipcClient } from "@renderer/lib/tipc-client"
import { useQuery } from "@tanstack/react-query"

export function Component() {
  const microphoneStatusQuery = useMicrophoneStatusQuery()
  const isAccessibilityGrantedQuery = useQuery({
    queryKey: ["setup-isAccessibilityGranted"],
    queryFn: () => tipcClient.isAccessibilityGranted(),
  })

  // Check if all required permissions are granted
  const microphoneGranted = microphoneStatusQuery.data === "granted"
  const accessibilityGranted = isAccessibilityGrantedQuery.data
  const allPermissionsGranted =
    microphoneGranted && (process.env.IS_MAC ? accessibilityGranted : true)

  return (
    <div className="app-drag-region flex h-dvh overflow-y-auto">
      <div className="mx-auto my-auto w-full max-w-3xl space-y-6 px-6 py-8 sm:px-10 sm:py-10">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            Welcome to {process.env.PRODUCT_NAME}
          </h1>
          <h2 className="mx-auto max-w-2xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400 sm:text-base">
            We need some system permissions before we can run the app
          </h2>
        </div>
        <div className="mx-auto max-w-screen-md">
          <div className="overflow-hidden rounded-xl border bg-background/80 shadow-sm">
            <div className="divide-y">
              {process.env.IS_MAC && (
                <PermissionBlock
                  title="Accessibility Access"
                  description={`We need Accessibility Access to capture keyboard events, so that you can hold Ctrl key to start recording, we don't log or store your keyboard events.`}
                  actionText="Enable in System Settings"
                  actionHandler={() => {
                    tipcClient.requestAccesssbilityAccess()
                  }}
                  enabled={isAccessibilityGrantedQuery.data}
                />
              )}

              <PermissionBlock
                title="Microphone Access"
                description={`We need Microphone Access to record your microphone, recordings are store locally on your computer only.`}
                actionText={
                  microphoneStatusQuery.data === "denied"
                    ? "Enable in System Settings"
                    : "Request Access"
                }
                actionHandler={async () => {
                  const granted = await tipcClient.requestMicrophoneAccess()
                  if (!granted) {
                    tipcClient.openMicrophoneInSystemPreferences()
                  }
                }}
                enabled={microphoneStatusQuery.data === "granted"}
              />
            </div>
          </div>
        </div>

        {/* Show restart instructions when permissions are granted */}
        {allPermissionsGranted && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-950">
            <div className="flex flex-wrap items-center justify-center gap-2 text-green-700 dark:text-green-300">
              <span className="i-mingcute-check-circle-fill text-lg"></span>
              <span className="font-semibold">All permissions granted!</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-green-600 dark:text-green-400 break-words [overflow-wrap:anywhere]">
              Please restart the app to complete the setup and start using{" "}
              {process.env.PRODUCT_NAME}.
            </p>
          </div>
        )}

        <div className="flex items-center justify-center pt-2">
          <Button
            variant={allPermissionsGranted ? "default" : "outline"}
            className={`gap-2 ${allPermissionsGranted ? "animate-pulse bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800" : ""}`}
            onClick={() => {
              tipcClient.restartApp()
            }}
          >
            <span className="i-mingcute-refresh-2-line"></span>
            <span>
              {allPermissionsGranted ? "Restart App Now" : "Restart App"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}

const PermissionBlock = ({
  title,
  description,
  actionHandler,
  actionText,
  enabled,
}: {
  title: React.ReactNode
  description: React.ReactNode
  actionText: string
  actionHandler: () => void
  enabled?: boolean
}) => {
  return (
    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="text-lg font-bold break-words [overflow-wrap:anywhere]">{title}</div>
        <div className="mt-1 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400 break-words [overflow-wrap:anywhere]">
          {description}
        </div>
      </div>
      <div className="flex w-full shrink-0 items-center sm:w-auto sm:justify-end">
        {enabled ? (
          <div className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-green-500/10 px-3 py-2 font-medium text-green-600 dark:bg-green-500/15 dark:text-green-300 sm:w-auto">
            <span className="i-mingcute-check-fill"></span>
            <span>Granted</span>
          </div>
        ) : (
          <Button type="button" onClick={actionHandler} className="w-full sm:w-auto">
            {actionText}
          </Button>
        )}
      </div>
    </div>
  )
}
