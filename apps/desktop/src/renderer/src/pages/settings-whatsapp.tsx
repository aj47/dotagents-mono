import { useCallback, useEffect, useRef, useState } from "react"
import { Control, ControlGroup, ControlLabel } from "@renderer/components/ui/control"
import { Switch } from "@renderer/components/ui/switch"
import { Input } from "@renderer/components/ui/input"
import { Button } from "@renderer/components/ui/button"
import { useConfigQuery, useSaveConfigMutation } from "@renderer/lib/query-client"
import type { Config } from "@shared/types"
import { AlertTriangle, Loader2, CheckCircle2, XCircle, RefreshCw, LogOut, QrCode as QrCodeIcon, EyeOff } from "lucide-react"
import { tipcClient } from "@renderer/lib/tipc-client"
import { QRCodeSVG } from "qrcode.react"

/**
 * Mask a phone number for streamer mode
 * Replaces digits with asterisks while preserving structure
 */
function maskPhoneNumber(phone: string | undefined): string {
  if (!phone) return "***-***-****"
  // Replace all but first 2 and last 2 digits with asterisks
  if (phone.length <= 4) return "****"
  return phone.slice(0, 2) + "*".repeat(phone.length - 4) + phone.slice(-2)
}

const WHATSAPP_ALLOWLIST_SAVE_DEBOUNCE_MS = 400
const WHATSAPP_CONNECTION_ACTIONS_CLASS_NAME = "flex flex-col gap-2 sm:flex-row sm:flex-wrap"
const WHATSAPP_CONNECTION_ACTION_BUTTON_CLASS_NAME = "w-full justify-center sm:w-auto"
const WHATSAPP_QR_FRAME_CLASS_NAME = "w-full max-w-[288px] rounded-lg bg-white p-4 shadow-md"
const WHATSAPP_QR_PLACEHOLDER_CLASS_NAME = "flex aspect-square w-full max-w-[288px] flex-col items-center justify-center rounded-lg bg-muted/50 p-4 shadow-md"
const WHATSAPP_STATUS_BANNER_BASE_CLASS_NAME = "mb-4 flex items-start gap-2 rounded-md border p-3"
const WHATSAPP_STATUS_TEXT_CLASS_NAME = "min-w-0 flex-1 text-sm leading-snug break-words [overflow-wrap:anywhere]"
const WHATSAPP_STATUS_ERROR_CLASS_NAME = "mb-4 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm leading-snug text-red-600 break-words [overflow-wrap:anywhere] dark:text-red-400"

function formatWhatsappAllowFrom(values: string[] | undefined): string {
  return (values || []).join(", ")
}

function parseWhatsappAllowFromDraft(value: string): string[] {
  return value
    .split(",")
    .map(entry => entry.trim())
    .filter(Boolean)
}

interface WhatsAppStatus {
  available: boolean
  connected: boolean
  phoneNumber?: string
  userName?: string
  hasQrCode?: boolean
  qrCode?: string
  hasCredentials?: boolean
  lastError?: string
  error?: string
}

export function Component() {
  const configQuery = useConfigQuery()
  const saveConfigMutation = useSaveConfigMutation()

  const cfg = configQuery.data as Config | undefined
  const cfgRef = useRef<Config | undefined>(cfg)

  // WhatsApp connection state
  const [status, setStatus] = useState<WhatsAppStatus | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [allowFromDraft, setAllowFromDraft] = useState(() => formatWhatsappAllowFrom(cfg?.whatsappAllowFrom))
  const allowFromSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    cfgRef.current = cfg
  }, [cfg])

  const saveConfig = useCallback(
    (partial: Partial<Config>) => {
      const currentConfig = cfgRef.current
      if (!currentConfig) return
      saveConfigMutation.mutate({ config: { ...currentConfig, ...partial } })
    },
    [saveConfigMutation],
  )

  const flushAllowFromSave = useCallback((draft: string) => {
    if (allowFromSaveTimeoutRef.current) {
      clearTimeout(allowFromSaveTimeoutRef.current)
      allowFromSaveTimeoutRef.current = null
    }

    saveConfig({ whatsappAllowFrom: parseWhatsappAllowFromDraft(draft) })
  }, [saveConfig])

  const scheduleAllowFromSave = useCallback((draft: string) => {
    if (allowFromSaveTimeoutRef.current) {
      clearTimeout(allowFromSaveTimeoutRef.current)
    }

    allowFromSaveTimeoutRef.current = setTimeout(() => {
      allowFromSaveTimeoutRef.current = null
      saveConfig({ whatsappAllowFrom: parseWhatsappAllowFromDraft(draft) })
    }, WHATSAPP_ALLOWLIST_SAVE_DEBOUNCE_MS)
  }, [saveConfig])

  useEffect(() => {
    setAllowFromDraft(formatWhatsappAllowFrom(cfg?.whatsappAllowFrom))
  }, [cfg?.whatsappAllowFrom])

  useEffect(() => {
    return () => {
      if (allowFromSaveTimeoutRef.current) {
        clearTimeout(allowFromSaveTimeoutRef.current)
      }
    }
  }, [])

  // Fetch WhatsApp status periodically
  const fetchStatus = useCallback(async (): Promise<void> => {
    try {
      const result = await tipcClient.whatsappGetStatus()
      setStatus(result as WhatsAppStatus)
      setStatusError(null)

      // Store QR code data if available
      if (result.qrCode) {
        setQrCodeData(result.qrCode)
      } else {
        setQrCodeData(null)
      }
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : String(error))
    }
  }, [])

  // Poll for status when enabled
  useEffect(() => {
    if (!cfg?.whatsappEnabled) {
      return undefined
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 3000) // Poll every 3 seconds
    return () => clearInterval(interval)
  }, [cfg?.whatsappEnabled, fetchStatus])

  const handleConnect = async () => {
    setIsConnecting(true)
    setStatusError(null)
    try {
      const result = await tipcClient.whatsappConnect()
      if (!result.success) {
        setStatusError(result.error || "Failed to connect")
      } else if (result.qrCode) {
        setQrCodeData(result.qrCode)
      }
      // Refresh status
      await fetchStatus()
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      const result = await tipcClient.whatsappDisconnect()
      if (!result.success) {
        setStatusError(result.error || "Failed to disconnect")
      }
      await fetchStatus()
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : String(error))
    }
  }

  const handleLogout = async () => {
    try {
      const result = await tipcClient.whatsappLogout()
      if (!result.success) {
        setStatusError(result.error || "Failed to logout")
      } else {
        setQrCodeData(null)
      }
      await fetchStatus()
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : String(error))
    }
  }

  if (!cfg) return null

  const enabled = cfg.whatsappEnabled ?? false
  const remoteServerEnabled = cfg.remoteServerEnabled ?? false
  const hasApiKey = !!cfg.remoteServerApiKey
  const streamerMode = cfg.streamerModeEnabled ?? false

  return (
    <div className="modern-panel h-full overflow-y-auto overflow-x-hidden px-6 py-4">
      <div className="grid gap-4">
        <ControlGroup
          title="WhatsApp Integration"
          endDescription={(
            <div className="break-words whitespace-normal">
              Connect your WhatsApp account to send and receive messages through DotAgents.
              Messages from allowed phone numbers can trigger the AI agent and receive automatic replies.
            </div>
          )}
        >
          {/* Warning if remote server is not enabled */}
          {!remoteServerEnabled && (
            <div className="mx-3 mb-2 flex items-start gap-2 rounded-md bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <strong>Remote Server Required:</strong> WhatsApp auto-reply requires the Remote Server to be enabled.
                <a href="/settings/remote-server" className="underline ml-1">Enable it here</a>.
              </div>
            </div>
          )}

          {remoteServerEnabled && !hasApiKey && (
            <div className="mx-3 mb-2 flex items-start gap-2 rounded-md bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <strong>API Key Required:</strong> Generate an API key in Remote Server settings for WhatsApp to work.
                <a href="/settings/remote-server" className="underline ml-1">Configure it here</a>.
              </div>
            </div>
          )}

          <Control label="Enable WhatsApp" className="px-3">
            <Switch
              checked={enabled}
              onCheckedChange={(value) => {
                saveConfig({ whatsappEnabled: value })
              }}
            />
          </Control>
        </ControlGroup>

        {/* Connection Status & QR Code */}
        {enabled && (
          <ControlGroup
            title="Connection"
            endDescription="Connect your WhatsApp account by scanning the QR code"
          >
            <div className="px-3 py-2">
              {/* Streamer mode indicator */}
              {streamerMode && (
                <div className="mb-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <EyeOff className="h-3.5 w-3.5" />
                  <span>Streamer Mode: Phone numbers and QR codes are hidden</span>
                </div>
              )}

              {/* Status display */}
              <div>
                {status?.connected ? (
                  <div
                    className={`${WHATSAPP_STATUS_BANNER_BASE_CLASS_NAME} border-green-500/20 bg-green-500/5`}
                    role="status"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                    <span className={`${WHATSAPP_STATUS_TEXT_CLASS_NAME} text-green-600 dark:text-green-400`}>
                      Connected as {streamerMode ? "****" : (status.userName || "Unknown")} ({streamerMode ? maskPhoneNumber(status.phoneNumber) : status.phoneNumber})
                    </span>
                  </div>
                ) : status?.available ? (
                  <div
                    className={`${WHATSAPP_STATUS_BANNER_BASE_CLASS_NAME} border-border/60 bg-muted/40`}
                    role="status"
                  >
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    <span className={`${WHATSAPP_STATUS_TEXT_CLASS_NAME} text-muted-foreground`}>Not connected</span>
                  </div>
                ) : (
                  <div
                    className={`${WHATSAPP_STATUS_BANNER_BASE_CLASS_NAME} border-amber-500/20 bg-amber-500/10`}
                    role="status"
                  >
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                    <span className={`${WHATSAPP_STATUS_TEXT_CLASS_NAME} text-amber-600 dark:text-amber-400`}>
                      {status?.error || "WhatsApp server not available"}
                    </span>
                  </div>
                )}
              </div>

              {/* Error display */}
              {statusError && (
                <div
                  className={WHATSAPP_STATUS_ERROR_CLASS_NAME}
                  role="alert"
                >
                  {statusError}
                </div>
              )}

              {/* QR Code display */}
              {qrCodeData && !status?.connected && (
                <div className="mb-4 flex flex-col items-center">
                  {streamerMode ? (
                    <div className={WHATSAPP_QR_PLACEHOLDER_CLASS_NAME}>
                      <EyeOff className="h-12 w-12 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground text-center">QR Code hidden<br />Streamer Mode is active</span>
                    </div>
                  ) : (
                    <div className={WHATSAPP_QR_FRAME_CLASS_NAME}>
                      <QRCodeSVG
                        value={qrCodeData}
                        size={256}
                        className="h-auto w-full max-w-full"
                      />
                    </div>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground text-center">
                    Open WhatsApp on your phone → Settings → Linked Devices → Scan this QR code
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className={WHATSAPP_CONNECTION_ACTIONS_CLASS_NAME}>
                {!status?.connected ? (
                  <Button
                    onClick={handleConnect}
                    disabled={isConnecting || !status?.available}
                    variant="default"
                    size="sm"
                    className={WHATSAPP_CONNECTION_ACTION_BUTTON_CLASS_NAME}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <QrCodeIcon className="h-4 w-4 mr-2" />
                        {status?.hasCredentials ? "Reconnect" : "Connect with QR Code"}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleDisconnect}
                    variant="outline"
                    size="sm"
                    className={WHATSAPP_CONNECTION_ACTION_BUTTON_CLASS_NAME}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                )}

                <Button
                  onClick={fetchStatus}
                  variant="ghost"
                  size="sm"
                  className={WHATSAPP_CONNECTION_ACTION_BUTTON_CLASS_NAME}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>

                {(status?.connected || status?.hasCredentials) && (
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className={WHATSAPP_CONNECTION_ACTION_BUTTON_CLASS_NAME + " text-red-600"}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                )}
              </div>
            </div>
          </ControlGroup>
        )}

        {/* Settings */}
        {enabled && (
          <ControlGroup title="Settings">
            <Control
              label={<ControlLabel label="Allowed Senders" tooltip="Only messages from these senders will be processed. Accepts phone numbers (E.164) or WhatsApp LIDs. Leave empty to allow all (not recommended)." />}
              className="px-3 [&>div:first-child]:sm:max-w-[30%] [&>div:last-child]:sm:max-w-[70%]"
            >
              <div className="flex w-full min-w-0 flex-col items-start gap-1.5 text-left sm:max-w-[360px]">
                <Input
                  type={streamerMode ? "password" : "text"}
                  value={allowFromDraft}
                  onChange={(e) => {
                    const nextDraft = e.currentTarget.value
                    setAllowFromDraft(nextDraft)
                    scheduleAllowFromSave(nextDraft)
                  }}
                  onBlur={(e) => flushAllowFromSave(e.currentTarget.value)}
                  placeholder={streamerMode ? "••••••••••" : "+14155551234, 98389177934034"}
                  className="w-full min-w-0"
                />
                <div className="text-xs text-muted-foreground break-words [overflow-wrap:anywhere]">
                  <p>Enter phone numbers or LIDs separated by commas. Phone numbers can include formatting like +, spaces, or punctuation.</p>
                  <details className="mt-1 cursor-pointer break-words [overflow-wrap:anywhere]">
                    <summary className="text-blue-600 dark:text-blue-400 hover:underline break-words [overflow-wrap:anywhere]">
                      ℹ️ What are LIDs? How do I find them?
                    </summary>
                    <div className="mt-2 space-y-2 rounded-md bg-muted/50 p-2 break-words [overflow-wrap:anywhere]">
                      <p>
                        <strong>LIDs (Linked IDs)</strong> are WhatsApp's privacy-focused identifiers that replace phone numbers in some cases.
                      </p>
                      <p>
                        <strong>To find a sender's LID:</strong>
                      </p>
                      <ol className="ml-2 list-inside list-decimal space-y-1 break-words [overflow-wrap:anywhere]">
                        <li>Enable "Log Message Content" below</li>
                        <li>Have the person send you a message</li>
                        <li>Check the logs - blocked messages show the LID to add</li>
                        <li>Copy the LID number and add it here</li>
                      </ol>
                      <p className="text-amber-600 dark:text-amber-400 break-words [overflow-wrap:anywhere]">
                        💡 Tip: Phone numbers still work for many contacts. Try the phone number first, then use LID if messages are blocked.
                      </p>
                    </div>
                  </details>
                </div>
                {(!cfg.whatsappAllowFrom || cfg.whatsappAllowFrom.length === 0) && (
                  <div className="text-xs text-amber-600 dark:text-amber-400 break-words [overflow-wrap:anywhere]">
                    ⚠️ No allowlist set - all incoming messages will be accepted
                  </div>
                )}
              </div>
            </Control>

            <Control
              label={<ControlLabel label="Auto-Reply" tooltip="Automatically send agent responses back to WhatsApp. Requires Remote Server to be enabled." />}
              className="px-3"
            >
              <div className="flex w-full min-w-0 flex-col items-start gap-1 sm:max-w-[360px]">
                <div className="flex w-full items-center justify-start sm:justify-end">
                  <Switch
                    checked={cfg.whatsappAutoReply ?? false}
                    onCheckedChange={(value) => {
                      saveConfig({ whatsappAutoReply: value })
                    }}
                    disabled={
                      // Only disable when trying to enable without prerequisites
                      // Always allow turning OFF (unchecking) so users can opt out
                      !(cfg.whatsappAutoReply ?? false) && (!remoteServerEnabled || !hasApiKey)
                    }
                  />
                </div>
                {cfg.whatsappAutoReply && remoteServerEnabled && hasApiKey && (
                  <div className="text-xs text-green-600 dark:text-green-400 break-words [overflow-wrap:anywhere]">
                    ✓ Auto-reply enabled - incoming messages will be processed and replied to
                  </div>
                )}
                {cfg.whatsappAutoReply && (!remoteServerEnabled || !hasApiKey) && (
                  <div className="text-xs text-amber-600 dark:text-amber-400 break-words [overflow-wrap:anywhere]">
                    ⚠️ Auto-reply is enabled but Remote Server or API key is missing
                  </div>
                )}
              </div>
            </Control>

            <Control
              label={<ControlLabel label="Log Message Content" tooltip="Log the content of WhatsApp messages. Disable for privacy." />}
              className="px-3"
            >
              <div className="flex w-full min-w-0 flex-col items-start gap-1 sm:max-w-[360px]">
                <div className="flex w-full items-center justify-start sm:justify-end">
                  <Switch
                    checked={cfg.whatsappLogMessages ?? false}
                    onCheckedChange={(value) => {
                      saveConfig({ whatsappLogMessages: value })
                    }}
                  />
                </div>
                <div className="text-xs text-muted-foreground break-words [overflow-wrap:anywhere]">
                  When enabled, message content will appear in logs. Disable for privacy.
                </div>
              </div>
            </Control>
          </ControlGroup>
        )}
      </div>
    </div>
  )
}

