import type {
  OperatorActionResponse,
  OperatorWhatsAppIntegrationSummary,
} from "@dotagents/shared/api-types"
import { tipcClient } from "@renderer/lib/tipc-client"

export type DesktopWhatsAppStatus = Partial<OperatorWhatsAppIntegrationSummary> & {
  available: boolean
  connected: boolean
  error?: string
  hasQrCode?: boolean
  message?: string
  phoneNumber?: string
  qrCode?: string
  userName?: string
}

export type DesktopWhatsAppActionResult = Pick<OperatorActionResponse, "success" | "error"> & {
  message?: string
  qrCode?: string
  status?: string
}

export const desktopWhatsAppClient = {
  getStatus(): Promise<DesktopWhatsAppStatus> {
    return tipcClient.whatsappGetStatus() as Promise<DesktopWhatsAppStatus>
  },

  connect(): Promise<DesktopWhatsAppActionResult> {
    return tipcClient.whatsappConnect() as Promise<DesktopWhatsAppActionResult>
  },

  disconnect(): Promise<DesktopWhatsAppActionResult> {
    return tipcClient.whatsappDisconnect() as Promise<DesktopWhatsAppActionResult>
  },

  logout(): Promise<DesktopWhatsAppActionResult> {
    return tipcClient.whatsappLogout() as Promise<DesktopWhatsAppActionResult>
  },
}
