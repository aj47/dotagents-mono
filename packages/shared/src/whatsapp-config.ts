export const DEFAULT_WHATSAPP_ENABLED = false
export const DEFAULT_WHATSAPP_AUTO_REPLY = false
export const DEFAULT_WHATSAPP_LOG_MESSAGES = false

export interface WhatsAppIntegrationConfig {
  whatsappEnabled?: boolean
  whatsappAllowFrom?: string[]
  whatsappOperatorAllowFrom?: string[]
  whatsappAutoReply?: boolean
  whatsappLogMessages?: boolean
}
