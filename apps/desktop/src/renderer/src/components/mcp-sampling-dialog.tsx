import { useState, useEffect } from "react"
import { toast } from "sonner"
import { rendererHandlers, tipcClient } from "@renderer/lib/tipc-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Button } from "./ui/button"
import type { SamplingRequest } from "../../../shared/types"

function getActionErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim()
  if (typeof error === "string" && error.trim()) return error.trim()
  return fallback
}

export default function McpSamplingDialog() {
  const [request, setRequest] = useState<SamplingRequest | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const unlisten = rendererHandlers["mcp:sampling-request"].listen(
      (samplingRequest: SamplingRequest) => {
        setRequest(samplingRequest)
        setIsOpen(true)
      }
    )
    return unlisten
  }, [])

  const handleResponse = async (approved: boolean) => {
    if (!request || isSubmitting) return

    const currentRequest = request
    const action = approved ? "approve" : "decline"
    setIsSubmitting(true)

    try {
      const resolved = await tipcClient.resolveSampling({
        requestId: currentRequest.requestId,
        approved,
      })

      if (!resolved) {
        setIsOpen(false)
        setRequest(null)
        toast.error("This request is no longer pending.")
        return
      }

      setIsOpen(false)
      setRequest(null)
    } catch (error) {
      console.error(`[MCP Sampling] Failed to ${action} request:`, error)
      toast.error(
        `Failed to ${action} request. ${getActionErrorMessage(error, "Please try again.")}`,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!request) return null

  const messageCount = request.messages.length
  const hasSystemPrompt = !!request.systemPrompt
  const modelHints = request.modelPreferences?.hints
    ?.map((h) => h.name)
    .filter(Boolean)

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) {
          void handleResponse(false)
        }
      }}
    >
      <DialogContent className="max-w-[min(32rem,calc(100vw-2rem))]">
        <DialogHeader>
          <DialogTitle>Sampling Request</DialogTitle>
          <DialogDescription className="break-words [overflow-wrap:anywhere]">
            <span className="font-medium text-foreground [overflow-wrap:anywhere]">
              {request.serverName}
            </span>{" "}
            is requesting to use your AI model
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-md border bg-muted/50 p-3 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <span className="text-muted-foreground">Messages:</span>
              <span className="font-medium break-words [overflow-wrap:anywhere]">{messageCount}</span>
            </div>
            {hasSystemPrompt && (
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="text-muted-foreground">System prompt:</span>
                <span className="font-medium text-green-600 break-words [overflow-wrap:anywhere]">
                  Present
                </span>
              </div>
            )}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <span className="text-muted-foreground">Max tokens:</span>
              <span className="font-medium break-words [overflow-wrap:anywhere]">
                {request.maxTokens}
              </span>
            </div>
            {request.temperature !== undefined && (
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="text-muted-foreground">Temperature:</span>
                <span className="font-medium break-words [overflow-wrap:anywhere]">
                  {request.temperature}
                </span>
              </div>
            )}
          </div>

          {modelHints && modelHints.length > 0 && (
            <div className="rounded-md border bg-muted/50 p-3">
              <div className="text-muted-foreground mb-1">Model preferences:</div>
              <div className="flex flex-wrap gap-1.5">
                {modelHints.map((hint, i) => (
                  <span
                    key={i}
                    className="inline-flex max-w-full items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary break-words [overflow-wrap:anywhere]"
                  >
                    {hint}
                  </span>
                ))}
              </div>
            </div>
          )}

          {request.modelPreferences && (
            <div className="rounded-md border bg-muted/50 p-3 space-y-1">
              {request.modelPreferences.costPriority !== undefined && (
                <div className="flex flex-wrap items-start justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">Cost priority:</span>
                  <span className="break-words [overflow-wrap:anywhere]">
                    {request.modelPreferences.costPriority}
                  </span>
                </div>
              )}
              {request.modelPreferences.speedPriority !== undefined && (
                <div className="flex flex-wrap items-start justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">Speed priority:</span>
                  <span className="break-words [overflow-wrap:anywhere]">
                    {request.modelPreferences.speedPriority}
                  </span>
                </div>
              )}
              {request.modelPreferences.intelligencePriority !== undefined && (
                <div className="flex flex-wrap items-start justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">Intelligence priority:</span>
                  <span className="break-words [overflow-wrap:anywhere]">
                    {request.modelPreferences.intelligencePriority}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => void handleResponse(false)} disabled={isSubmitting}>
            Decline
          </Button>
          <Button onClick={() => void handleResponse(true)} disabled={isSubmitting}>
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

