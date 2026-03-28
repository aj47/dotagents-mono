import {
  mcpService,
  type MCPToolResult,
  WHATSAPP_SERVER_NAME,
} from "./mcp-service"

export interface ManagedWhatsappStatus {
  available: boolean
  connected: boolean
  phoneNumber?: string
  userName?: string
  hasQrCode?: boolean
  qrCode?: string
  hasCredentials?: boolean
  lastError?: string
  error?: string
  message?: string
}

export interface ManagedWhatsappConnectResult {
  success: boolean
  status?: string
  qrCode?: string
  message?: string
  error?: string
}

export interface ManagedWhatsappActionResult {
  success: boolean
  error?: string
}

function getManagedWhatsappServerUnavailableError(): string {
  return "WhatsApp server is not running. Please enable WhatsApp in settings."
}

function isManagedWhatsappServerAvailable(): boolean {
  const serverStatus = mcpService.getServerStatus()
  return !!serverStatus[WHATSAPP_SERVER_NAME]?.connected
}

function getManagedWhatsappToolText(result: MCPToolResult): string | undefined {
  return result.content.find((entry) => entry.type === "text")?.text
}

function getManagedWhatsappToolError(
  result: MCPToolResult,
  fallbackMessage: string,
): string {
  return getManagedWhatsappToolText(result) || fallbackMessage
}

function getManagedWhatsappPayload(
  text: string | undefined,
): Record<string, unknown> | null {
  if (!text) {
    return null
  }

  try {
    const parsed = JSON.parse(text)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null
    }
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

function getManagedWhatsappString(
  payload: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = payload[key]
  return typeof value === "string" && value.trim() ? value : undefined
}

function getManagedWhatsappBoolean(
  payload: Record<string, unknown>,
  key: string,
): boolean | undefined {
  const value = payload[key]
  return typeof value === "boolean" ? value : undefined
}

async function executeManagedWhatsappTool(
  toolName:
    | "whatsapp_connect"
    | "whatsapp_get_status"
    | "whatsapp_disconnect"
    | "whatsapp_logout",
): Promise<MCPToolResult> {
  return mcpService.executeToolCall(
    { name: toolName, arguments: {} },
    undefined,
    true,
  )
}

function getManagedWhatsappStatusFromPayload(
  payload: Record<string, unknown>,
): ManagedWhatsappStatus {
  return {
    available: true,
    connected: getManagedWhatsappBoolean(payload, "connected") ?? false,
    phoneNumber: getManagedWhatsappString(payload, "phoneNumber"),
    userName: getManagedWhatsappString(payload, "userName"),
    hasQrCode: getManagedWhatsappBoolean(payload, "hasQrCode"),
    qrCode: getManagedWhatsappString(payload, "qrCode"),
    hasCredentials: getManagedWhatsappBoolean(payload, "hasCredentials"),
    lastError: getManagedWhatsappString(payload, "lastError"),
    error: getManagedWhatsappString(payload, "error"),
    message: getManagedWhatsappString(payload, "message"),
  }
}

export async function getManagedWhatsappStatus(): Promise<ManagedWhatsappStatus> {
  if (!isManagedWhatsappServerAvailable()) {
    return {
      available: false,
      connected: false,
      error: "WhatsApp server is not running",
    }
  }

  try {
    const result = await executeManagedWhatsappTool("whatsapp_get_status")
    if (result.isError) {
      return {
        available: true,
        connected: false,
        error: getManagedWhatsappToolError(result, "Failed to get status"),
      }
    }

    const text = getManagedWhatsappToolText(result)
    const payload = getManagedWhatsappPayload(text)
    if (!payload) {
      return {
        available: true,
        connected: false,
        ...(text ? { message: text } : {}),
      }
    }

    return getManagedWhatsappStatusFromPayload(payload)
  } catch (error) {
    return {
      available: false,
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function connectManagedWhatsapp(): Promise<ManagedWhatsappConnectResult> {
  if (!isManagedWhatsappServerAvailable()) {
    return {
      success: false,
      error: getManagedWhatsappServerUnavailableError(),
    }
  }

  try {
    const result = await executeManagedWhatsappTool("whatsapp_connect")
    if (result.isError) {
      return {
        success: false,
        error: getManagedWhatsappToolError(result, "Connection failed"),
      }
    }

    const text = getManagedWhatsappToolText(result)
    const payload = getManagedWhatsappPayload(text)
    if (payload) {
      const qrCode = getManagedWhatsappString(payload, "qrCode")
      const status =
        getManagedWhatsappString(payload, "status") ||
        (qrCode ? "qr_required" : undefined)
      const message = getManagedWhatsappString(payload, "message")

      if (qrCode || status || message) {
        return {
          success: true,
          ...(status ? { status } : {}),
          ...(qrCode ? { qrCode } : {}),
          ...(message ? { message } : {}),
        }
      }
    }

    if (text?.includes("Connected successfully") || text?.includes("Already connected")) {
      return {
        success: true,
        status: "connected",
        message: text,
      }
    }

    return {
      success: true,
      ...(text ? { message: text } : { message: "Connection initiated" }),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function runManagedWhatsappAction(
  toolName: "whatsapp_disconnect" | "whatsapp_logout",
  fallbackMessage: string,
): Promise<ManagedWhatsappActionResult> {
  if (!isManagedWhatsappServerAvailable()) {
    return {
      success: false,
      error: getManagedWhatsappServerUnavailableError(),
    }
  }

  try {
    const result = await executeManagedWhatsappTool(toolName)
    if (result.isError) {
      return {
        success: false,
        error: getManagedWhatsappToolError(result, fallbackMessage),
      }
    }
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function disconnectManagedWhatsapp(): Promise<ManagedWhatsappActionResult> {
  return runManagedWhatsappAction("whatsapp_disconnect", "Disconnect failed")
}

export async function logoutManagedWhatsapp(): Promise<ManagedWhatsappActionResult> {
  return runManagedWhatsappAction("whatsapp_logout", "Logout failed")
}
