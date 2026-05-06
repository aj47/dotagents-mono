import { describe, expect, it } from 'vitest'
import {
  inferTransportType,
  formatMcpKeyValueDraft,
  isReservedMcpServerName,
  mergeImportedMcpServers,
  normalizeMcpConfig,
  parseMcpKeyValueDraft,
  removeMcpServerConfig,
  renameMcpServerConfig,
  upsertMcpServerConfig,
  type MCPConfig,
  type MCPConfigLike,
} from './mcp-utils'

describe('normalizeMcpConfig', () => {
  it('infers streamableHttp when url is present and transport is missing', () => {
    const input: MCPConfigLike = {
      mcpServers: {
        exa: {
          url: 'https://exa.ai/mcp',
        },
      },
    }

    const { normalized, changed } = normalizeMcpConfig(input)

    expect(normalized.mcpServers?.exa.transport).toBe('streamableHttp')
    expect(changed).toBe(true)
  })

  it('preserves explicit transport when provided', () => {
    const input: MCPConfigLike = {
      mcpServers: {
        foo: {
          transport: 'websocket',
          url: 'wss://example.com/mcp',
        },
      },
    }

    const { normalized, changed } = normalizeMcpConfig(input)

    expect(normalized.mcpServers?.foo.transport).toBe('websocket')
    expect(changed).toBe(false)
  })

  it('infers websocket when url uses wss:// protocol and transport is missing', () => {
    const input: MCPConfigLike = {
      mcpServers: {
        wsServer: {
          url: 'wss://example.com/mcp',
        },
      },
    }

    const { normalized, changed } = normalizeMcpConfig(input)

    expect(normalized.mcpServers?.wsServer.transport).toBe('websocket')
    expect(changed).toBe(true)
  })

  it('trims padded urls before inferring transport', () => {
    const input: MCPConfigLike = {
      mcpServers: {
        wsServer: {
          url: '  WSS://example.com/mcp  ',
        },
      },
    }

    const { normalized, changed } = normalizeMcpConfig(input)

    expect(normalized.mcpServers?.wsServer.transport).toBe('websocket')
    expect(changed).toBe(true)
  })

  it('preserves canonical OAuth server configuration while normalizing transport', () => {
    const input: MCPConfig = {
      mcpServers: {
        secure: {
          url: 'https://example.com/mcp',
          oauth: {
            clientId: 'client-id',
            tokens: {
              access_token: 'token',
              token_type: 'Bearer',
            },
            pendingAuth: {
              codeVerifier: 'verifier',
              state: 'state',
            },
          },
        },
      },
    }

    const { normalized, changed } = normalizeMcpConfig(input)

    expect(normalized.mcpServers.secure.transport).toBe('streamableHttp')
    expect(normalized.mcpServers.secure.oauth?.tokens?.access_token).toBe('token')
    expect(changed).toBe(true)
  })
})

describe('inferTransportType', () => {
  it('defaults to stdio when no transport or url is provided', () => {
    expect(inferTransportType({ command: 'cmd' })).toBe('stdio')
  })

  it('defaults to stdio for whitespace-only urls', () => {
    expect(inferTransportType({ url: '   ' })).toBe('stdio')
  })

  it('infers websocket when url starts with ws://', () => {
    expect(inferTransportType({ url: 'ws://localhost:8080' })).toBe('websocket')
  })

  it('infers websocket when url starts with wss://', () => {
    expect(inferTransportType({ url: 'wss://example.com/mcp' })).toBe('websocket')
  })

  it('ignores surrounding whitespace when inferring websocket urls', () => {
    expect(inferTransportType({ url: '  ws://localhost:8080  ' })).toBe('websocket')
  })

  it('infers streamableHttp when url starts with http://', () => {
    expect(inferTransportType({ url: 'http://localhost:8080/mcp' })).toBe('streamableHttp')
  })

  it('infers streamableHttp when url starts with https://', () => {
    expect(inferTransportType({ url: 'https://exa.ai/mcp' })).toBe('streamableHttp')
  })
})

describe('MCP key/value draft helpers', () => {
  it('formats server env and header records as newline-separated draft text', () => {
    expect(formatMcpKeyValueDraft({
      API_KEY: 'secret',
      'X-Feature': 'enabled',
    })).toBe('API_KEY=secret\nX-Feature=enabled')
    expect(formatMcpKeyValueDraft()).toBe('')
  })

  it('parses KEY=value draft text while preserving equals signs in values', () => {
    expect(parseMcpKeyValueDraft('API_KEY=secret\nTOKEN=a=b=c', 'Environment')).toEqual({
      value: {
        API_KEY: 'secret',
        TOKEN: 'a=b=c',
      },
    })
  })

  it('ignores blank lines and trims keys and values', () => {
    expect(parseMcpKeyValueDraft('\n API_KEY = secret \n\n', 'Environment')).toEqual({
      value: {
        API_KEY: 'secret',
      },
    })
  })

  it('returns a labeled error for malformed draft lines', () => {
    expect(parseMcpKeyValueDraft('API_KEY', 'Environment')).toEqual({
      value: {},
      error: 'Environment entries must use KEY=value',
    })
    expect(parseMcpKeyValueDraft('=secret', 'Header')).toEqual({
      value: {},
      error: 'Header entries must use KEY=value',
    })
  })
})

describe('MCP server config mutations', () => {
  it('detects reserved server names case-insensitively', () => {
    expect(isReservedMcpServerName(' DOTAGENTS-RUNTIME-TOOLS ', ['dotagents-runtime-tools'])).toBe(true)
    expect(isReservedMcpServerName('github', ['dotagents-runtime-tools'])).toBe(false)
  })

  it('upserts, renames, and removes MCP server configs without mutating input', () => {
    const input: MCPConfig = {
      mcpServers: {
        github: { command: 'github-mcp' },
      },
    }
    const filesystemConfig: MCPConfig['mcpServers'][string] = { command: 'filesystem-mcp' }
    const disabledFilesystemConfig: MCPConfig['mcpServers'][string] = { command: 'filesystem-mcp', disabled: true }

    const withFilesystem = upsertMcpServerConfig(input, 'filesystem', filesystemConfig)
    const renamed = renameMcpServerConfig(withFilesystem, 'filesystem', 'local-files', disabledFilesystemConfig)
    const removed = removeMcpServerConfig(renamed, 'github')

    expect(input.mcpServers).toEqual({ github: { command: 'github-mcp' } })
    expect(withFilesystem.mcpServers.filesystem.command).toBe('filesystem-mcp')
    expect(renamed.mcpServers.filesystem).toBeUndefined()
    expect(renamed.mcpServers['local-files'].disabled).toBe(true)
    expect(removed.mcpServers.github).toBeUndefined()
    expect(removed.mcpServers['local-files'].command).toBe('filesystem-mcp')
  })

  it('merges imported MCP servers and reports skipped reserved names', () => {
    const current: MCPConfig = {
      mcpServers: {
        github: { command: 'old-github' },
      },
    }
    const imported: MCPConfig = {
      mcpServers: {
        github: { command: 'new-github' },
        'DotAgents-Runtime-Tools': { command: 'reserved' },
        filesystem: { command: 'filesystem-mcp' },
      },
    }

    const result = mergeImportedMcpServers(current, imported, {
      reservedServerNames: ['dotagents-runtime-tools'],
    })

    expect(result.importedCount).toBe(2)
    expect(result.skippedReservedServerNames).toEqual(['DotAgents-Runtime-Tools'])
    expect(result.config.mcpServers.github.command).toBe('new-github')
    expect(result.config.mcpServers.filesystem.command).toBe('filesystem-mcp')
    expect(result.config.mcpServers['DotAgents-Runtime-Tools']).toBeUndefined()
  })
})
