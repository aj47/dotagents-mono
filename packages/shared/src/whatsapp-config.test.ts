import { describe, expect, it } from 'vitest'

import type { WhatsAppIntegrationConfig } from './whatsapp-config'

function assertType<T>(_value: T): void {
  // Compile-time assertion only.
}

describe('whatsapp config contracts', () => {
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
