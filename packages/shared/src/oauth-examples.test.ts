import { describe, expect, it } from 'vitest'
import { OAUTH_MCP_EXAMPLES } from './oauth-examples'

describe('OAUTH_MCP_EXAMPLES', () => {
  it('includes a streamable HTTP Notion OAuth example', () => {
    expect(OAUTH_MCP_EXAMPLES.notion).toMatchObject({
      name: 'Notion',
      config: {
        transport: 'streamableHttp',
        url: 'https://api.notion.com/mcp',
        oauth: {
          scope: 'read write',
          useDiscovery: true,
          useDynamicRegistration: true,
        },
      },
      requiredScopes: ['read', 'write'],
    })
  })

  it('keeps setup instructions and documentation attached to examples', () => {
    expect(OAUTH_MCP_EXAMPLES.notion.setupInstructions.length).toBeGreaterThan(0)
    expect(OAUTH_MCP_EXAMPLES.notion.documentationUrl).toContain('developers.notion.com')
  })
})
