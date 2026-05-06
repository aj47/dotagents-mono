import { describe, expect, it } from 'vitest'

import {
  DEFAULT_WHATSAPP_AUTO_REPLY,
  DEFAULT_WHATSAPP_ENABLED,
  DEFAULT_WHATSAPP_LOG_MESSAGES,
  type WhatsAppIntegrationConfig,
} from './whatsapp-config'

function assertType<T>(_value: T): void {
  // Compile-time assertion only.
}

describe('whatsapp config contracts', () => {
  it('exposes shared WhatsApp integration defaults', () => {
    expect(DEFAULT_WHATSAPP_ENABLED).toBe(false)
    expect(DEFAULT_WHATSAPP_AUTO_REPLY).toBe(false)
    expect(DEFAULT_WHATSAPP_LOG_MESSAGES).toBe(false)
  })

  it('exposes the persisted WhatsApp integration config contract', () => {
    const config: WhatsAppIntegrationConfig = {
      whatsappEnabled: true,
      whatsappAllowFrom: ['15551234567'],
      whatsappOperatorAllowFrom: ['15557654321'],
      whatsappAutoReply: true,
      whatsappLogMessages: false,
    }

    assertType<WhatsAppIntegrationConfig>(config)
    expect(config.whatsappAllowFrom).toEqual(['15551234567'])
  })
})
