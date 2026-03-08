import { useState, useEffect } from "react"
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
import { Input } from "./ui/input"
import { Switch } from "./ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { Label } from "./ui/label"
import type {
  ElicitationRequest,
  ElicitationFormRequest,
  ElicitationUrlRequest,
  ElicitationFormSchema,
  ElicitationFormField,
} from "../../../shared/types"

type FormValues = Record<string, string | number | boolean>

function McpElicitationDialog() {
  const [request, setRequest] = useState<ElicitationRequest | null>(null)
  const [formValues, setFormValues] = useState<FormValues>({})
  const [isOpen, setIsOpen] = useState(false)
  const [responseErrorMessage, setResponseErrorMessage] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<"accept" | "decline" | "cancel" | null>(null)
  const [isRequestUnavailable, setIsRequestUnavailable] = useState(false)

  const closeDialog = () => {
    setIsOpen(false)
    setRequest(null)
    setFormValues({})
    setResponseErrorMessage(null)
    setPendingAction(null)
    setIsRequestUnavailable(false)
  }

  // Listen for elicitation requests
  useEffect(() => {
    const unlisten = rendererHandlers["mcp:elicitation-request"].listen(
      (req: ElicitationRequest) => {
        setResponseErrorMessage(null)
        setPendingAction(null)
        setIsRequestUnavailable(false)
        setRequest(req)
        // Initialize form values with defaults
        if (req.mode === "form") {
          const formReq = req as ElicitationFormRequest
          const initialValues: FormValues = {}
          for (const [key, field] of Object.entries(formReq.requestedSchema.properties)) {
            if (field.default !== undefined) {
              initialValues[key] = field.default
            } else if (field.type === "boolean") {
              initialValues[key] = false
            } else if (field.type === "number") {
              initialValues[key] = 0
            } else {
              initialValues[key] = ""
            }
          }
          setFormValues(initialValues)
        }
        setIsOpen(true)
      }
    )
    return unlisten
  }, [])

  // Listen for elicitation complete (for URL mode auto-close)
  useEffect(() => {
    const unlisten = rendererHandlers["mcp:elicitation-complete"].listen(
      (data: { elicitationId: string; requestId: string }) => {
        if (request && request.requestId === data.requestId) {
          closeDialog()
        }
      }
    )
    return unlisten
  }, [request])

  const handleAction = async (action: "accept" | "decline" | "cancel") => {
    if (!request || pendingAction) return

    const activeRequest = request
    const content = action === "accept" && activeRequest.mode === "form" ? formValues : undefined
    setResponseErrorMessage(null)
    setPendingAction(action)

    try {
      const resolved = await tipcClient.resolveElicitation({
        requestId: activeRequest.requestId,
        action,
        content,
      })

      if (!resolved) {
        setIsRequestUnavailable(true)
        setResponseErrorMessage(
          activeRequest.mode === "form"
            ? "This request is no longer waiting for a response. Your draft is still visible here so you can review it before closing."
            : "This request is no longer waiting for a response. You can close this dialog.",
        )
        return
      }

      closeDialog()
    } catch (error) {
      console.error("Failed to resolve elicitation:", error)
      setResponseErrorMessage(
        action === "accept"
          ? "Couldn't submit your response yet. Your draft is still open, so you can try again."
          : "Couldn't update this request yet. It is still open, so you can try again.",
      )
    } finally {
      setPendingAction(null)
    }
  }

  const handleOpenUrl = () => {
    if (request?.mode === "url") {
      window.open((request as ElicitationUrlRequest).url, "_blank")
    }
  }

  const renderFormField = (key: string, field: ElicitationFormSchema["properties"][string]) => {
    const value = formValues[key]
    const label = field.title || key

    if (field.type === "boolean") {
      return (
        <div key={key} className="flex items-center justify-between py-2">
          <div>
            <Label htmlFor={key}>{label}</Label>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
          <Switch
            id={key}
            checked={Boolean(value)}
            onCheckedChange={(checked) => setFormValues((prev) => ({ ...prev, [key]: checked }))}
          />
        </div>
      )
    }

    if (field.type === "enum" && field.enum) {
      return (
        <div key={key} className="space-y-2 py-2">
          <Label htmlFor={key}>{label}</Label>
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
          <Select
            value={String(value)}
            onValueChange={(v) => setFormValues((prev) => ({ ...prev, [key]: v }))}
          >
            <SelectTrigger id={key}>
              <SelectValue placeholder={`Select ${label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.enum.map((opt, idx) => (
                <SelectItem key={opt} value={opt}>
                  {field.enumNames?.[idx] || opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    // Default: text/number input
    return (
      <div key={key} className="space-y-2 py-2">
        <Label htmlFor={key}>{label}</Label>
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
        <Input
          id={key}
          type={field.type === "number" ? "number" : "text"}
          value={String(value ?? "")}
          onChange={(e) => {
            const v = field.type === "number" ? Number(e.target.value) : e.target.value
            setFormValues((prev) => ({ ...prev, [key]: v }))
          }}
          placeholder={field.format ? `Enter ${field.format}` : undefined}
        />
      </div>
    )
  }

  if (!request) return null

  const isFormMode = request.mode === "form"
  const formRequest = isFormMode ? (request as ElicitationFormRequest) : null
  const urlRequest = !isFormMode ? (request as ElicitationUrlRequest) : null
  const isSubmitting = pendingAction !== null

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (open) return
        if (isRequestUnavailable) {
          closeDialog()
          return
        }
        void handleAction("cancel")
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request from {request.serverName}</DialogTitle>
          <DialogDescription>{request.message}</DialogDescription>
        </DialogHeader>

        {responseErrorMessage && (
          <p role="alert" aria-live="polite" className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {responseErrorMessage}
          </p>
        )}

        {isFormMode && formRequest && (
          <div className="max-h-[60vh] overflow-y-auto">
            {Object.entries(formRequest.requestedSchema.properties).map(([key, field]) =>
              renderFormField(key, field)
            )}
          </div>
        )}

        {!isFormMode && urlRequest && (
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Please complete the required action in your browser. The dialog will close
              automatically when the action is complete.
            </p>
            <Button variant="outline" onClick={handleOpenUrl} className="w-full">
              Open URL Again
            </Button>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {isRequestUnavailable ? (
            <Button onClick={closeDialog}>Close</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => void handleAction("cancel")} disabled={isSubmitting}>
                {pendingAction === "cancel" ? "Canceling..." : "Cancel"}
              </Button>
              <Button variant="outline" onClick={() => void handleAction("decline")} disabled={isSubmitting}>
                {pendingAction === "decline" ? "Declining..." : "Decline"}
              </Button>
              <Button onClick={() => void handleAction("accept")} disabled={isSubmitting}>
                {pendingAction === "accept" ? "Accepting..." : "Accept"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default McpElicitationDialog

