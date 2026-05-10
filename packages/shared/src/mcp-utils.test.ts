import { describe, expect, it } from 'vitest'
import {
  buildMcpServerConfigFromDraft,
  countEnabledMcpTools,
  EMPTY_MCP_SERVER_CONFIG_DRAFT,
  filterMcpToolSourceGroups,
  filterMcpTools,
  getCollapsedMcpNames,
  getExpandedMcpNames,
  groupMcpToolsBySource,
  MCP_TRANSPORT_OPTIONS,
  inferTransportType,
  formatMcpKeyValueDraft,
  isReservedMcpServerName,
  mergeImportedMcpServers,
  normalizeMcpConfig,
  partitionMcpServersByReservedName,
  parseMcpKeyValueDraft,
  removeMcpServerConfig,
  removeMcpServerFromList,
  renameMcpServerConfig,
  restoreMcpToolEnabledStatesInList,
  getMcpServerNamesInList,
  getMcpToolSourceNamesInList,
  setMcpServerRuntimeEnabledInList,
  setMcpSourceToolsEnabledInList,
  setMcpToolEnabledInList,
  setMcpToolsEnabledByNameInList,
  upsertMcpServerConfig,
  type MCPConfig,
  type MCPConfigLike,
} from './mcp-utils'

describe('MCP transport options', () => {
  it('describes shared MCP transport labels and values', () => {
    expect(MCP_TRANSPORT_OPTIONS).toEqual([
      { value: 'stdio', label: 'stdio' },
      { value: 'streamableHttp', label: 'HTTP' },
      { value: 'websocket', label: 'websocket' },
    ])
  })
})

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

describe('MCP tool list helpers', () => {
  const tools = [
    { name: 'read_file', sourceName: 'filesystem', enabled: true },
    { name: 'write_file', sourceName: 'filesystem', enabled: false },
    { name: 'search', sourceName: 'web', enabled: false },
  ]

  it('updates a single tool enabled state by name', () => {
    const updated = setMcpToolEnabledInList(tools, 'write_file', true)

    expect(updated.map((tool) => [tool.name, tool.enabled])).toEqual([
      ['read_file', true],
      ['write_file', true],
      ['search', false],
    ])
    expect(countEnabledMcpTools(updated)).toBe(2)
  })

  it('updates every tool for a source', () => {
    const updated = setMcpSourceToolsEnabledInList(tools, 'filesystem', false)

    expect(updated.map((tool) => [tool.name, tool.enabled])).toEqual([
      ['read_file', false],
      ['write_file', false],
      ['search', false],
    ])
    expect(countEnabledMcpTools(updated)).toBe(0)
  })

  it('groups tools by source while preserving tool order', () => {
    expect(groupMcpToolsBySource(tools)).toEqual({
      filesystem: [
        { name: 'read_file', sourceName: 'filesystem', enabled: true },
        { name: 'write_file', sourceName: 'filesystem', enabled: false },
      ],
      web: [
        { name: 'search', sourceName: 'web', enabled: false },
      ],
    })
  })

  it('updates a selected set of tools by name', () => {
    const updated = setMcpToolsEnabledByNameInList(tools, ['write_file', 'search'], true)

    expect(updated.map((tool) => [tool.name, tool.enabled])).toEqual([
      ['read_file', true],
      ['write_file', true],
      ['search', true],
    ])
    expect(countEnabledMcpTools(updated)).toBe(3)
  })

  it('restores selected tool enabled states from an original-state map', () => {
    const updated = setMcpToolsEnabledByNameInList(tools, ['read_file', 'write_file'], false)
    const restored = restoreMcpToolEnabledStatesInList(updated, new Map([
      ['read_file', true],
      ['write_file', false],
    ]))

    expect(restored.map((tool) => [tool.name, tool.enabled])).toEqual([
      ['read_file', true],
      ['write_file', false],
      ['search', false],
    ])
  })

  it('filters tools by search query, enabled state, and server visibility', () => {
    const detailedTools = [
      {
        name: 'read_file',
        description: 'Read workspace files',
        enabled: true,
        serverEnabled: true,
      },
      {
        name: 'write_file',
        description: 'Write workspace files',
        enabled: false,
        serverEnabled: true,
      },
      {
        name: 'remote_search',
        description: 'Search remote docs',
        enabled: true,
        serverEnabled: false,
      },
      {
        name: 'shell',
        description: null,
        enabled: true,
        serverEnabled: true,
      },
    ]

    expect(filterMcpTools(detailedTools, { searchQuery: ' workspace ' }).map((tool) => tool.name)).toEqual([
      'read_file',
      'write_file',
    ])
    expect(filterMcpTools(detailedTools, {
      searchQuery: 'WRITE',
      showDisabledTools: false,
    }).map((tool) => tool.name)).toEqual([])
    expect(filterMcpTools(detailedTools, {
      requireEnabledServer: true,
    }).map((tool) => tool.name)).toEqual([
      'read_file',
      'write_file',
      'shell',
    ])
  })

  it('filters grouped tools by selected source and tool criteria', () => {
    const groupedTools = groupMcpToolsBySource([
      { name: 'read_file', description: 'Read workspace files', sourceName: 'filesystem', enabled: true },
      { name: 'write_file', description: 'Write workspace files', sourceName: 'filesystem', enabled: false },
      { name: 'search', description: 'Search docs', sourceName: 'web', enabled: true },
    ])

    expect(filterMcpToolSourceGroups(groupedTools, {
      selectedSource: 'filesystem',
      searchQuery: 'workspace',
      showDisabledTools: false,
    })).toEqual({
      filesystem: [
        { name: 'read_file', description: 'Read workspace files', sourceName: 'filesystem', enabled: true },
      ],
    })
    expect(filterMcpToolSourceGroups(groupedTools, { selectedSource: 'all' })).toEqual(groupedTools)
  })

  it('derives source names and expanded/collapsed names in stable order', () => {
    const tools = [
      { name: 'read_file', sourceName: 'filesystem' },
      { name: 'write_file', sourceName: 'filesystem' },
      { name: 'search', sourceName: 'web' },
      { name: 'shell', sourceName: 'runtime' },
    ]

    const sourceNames = getMcpToolSourceNamesInList(tools)

    expect(sourceNames).toEqual(['filesystem', 'web', 'runtime'])
    expect(getExpandedMcpNames(sourceNames, ['web'])).toEqual(['filesystem', 'runtime'])
    expect(getCollapsedMcpNames(sourceNames, new Set(['filesystem', 'runtime']))).toEqual(['web'])
    expect(getCollapsedMcpNames(sourceNames, ['filesystem'])).toEqual(['web', 'runtime'])
  })
})

describe('MCP server list helpers', () => {
  const servers = [
    { name: 'filesystem', enabled: true, runtimeEnabled: true, configDisabled: false, toolCount: 2 },
    { name: 'disabled-config', enabled: false, runtimeEnabled: false, configDisabled: true, toolCount: 1 },
  ]

  it('updates runtime enablement while respecting config-disabled servers', () => {
    expect(setMcpServerRuntimeEnabledInList(servers, 'filesystem', false)).toEqual([
      { name: 'filesystem', enabled: false, runtimeEnabled: false, configDisabled: false, toolCount: 2 },
      { name: 'disabled-config', enabled: false, runtimeEnabled: false, configDisabled: true, toolCount: 1 },
    ])

    expect(setMcpServerRuntimeEnabledInList(servers, 'disabled-config', true)).toEqual([
      { name: 'filesystem', enabled: true, runtimeEnabled: true, configDisabled: false, toolCount: 2 },
      { name: 'disabled-config', enabled: false, runtimeEnabled: true, configDisabled: true, toolCount: 1 },
    ])
  })

  it('removes servers and extracts names for editor validation', () => {
    expect(removeMcpServerFromList(servers, 'filesystem')).toEqual([
      { name: 'disabled-config', enabled: false, runtimeEnabled: false, configDisabled: true, toolCount: 1 },
    ])
    expect(getMcpServerNamesInList(servers)).toEqual(['filesystem', 'disabled-config'])
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

describe('MCP server config draft helpers', () => {
  it('builds stdio server configs from shared drafts', () => {
    expect(buildMcpServerConfigFromDraft({
      ...EMPTY_MCP_SERVER_CONFIG_DRAFT,
      name: 'github',
      command: 'npx',
      args: '-y\n@modelcontextprotocol/server-github',
      env: 'GITHUB_TOKEN=secret',
      timeout: '12.8',
      disabled: true,
    })).toEqual({
      ok: true,
      name: 'github',
      config: {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_TOKEN: 'secret' },
        timeout: 12,
        disabled: true,
      },
    })
  })

  it('builds remote OAuth server configs from shared drafts', () => {
    expect(buildMcpServerConfigFromDraft({
      ...EMPTY_MCP_SERVER_CONFIG_DRAFT,
      name: 'linear',
      transport: 'streamableHttp',
      url: 'https://mcp.example.com/mcp',
      headers: 'Authorization=Bearer token',
      oauthEnabled: true,
      oauthScope: 'read write',
      oauthClientId: 'client-1',
      oauthUseDiscovery: false,
      oauthUseDynamicRegistration: true,
    })).toEqual({
      ok: true,
      name: 'linear',
      config: {
        transport: 'streamableHttp',
        url: 'https://mcp.example.com/mcp',
        headers: { Authorization: 'Bearer token' },
        oauth: {
          scope: 'read write',
          clientId: 'client-1',
          useDiscovery: false,
          useDynamicRegistration: true,
        },
      },
    })
  })

  it('builds desktop shell-command drafts without component-local config parsing', () => {
    expect(buildMcpServerConfigFromDraft({
      ...EMPTY_MCP_SERVER_CONFIG_DRAFT,
      name: 'desktop',
      command: 'npx -y "@modelcontextprotocol/server desktop"',
    }, {
      commandDraftMode: 'shell-command',
      includeEmptyStdioArgs: true,
    })).toEqual({
      ok: true,
      name: 'desktop',
      config: {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server desktop'],
      },
    })
  })

  it('preserves desktop remote env and OAuth metadata when requested', () => {
    expect(buildMcpServerConfigFromDraft({
      ...EMPTY_MCP_SERVER_CONFIG_DRAFT,
      name: 'linear',
      transport: 'streamableHttp',
      url: 'https://mcp.example.com/mcp',
      env: 'REMOTE_ENV=1',
      headers: 'Authorization=Bearer token',
      oauthEnabled: true,
      oauthScope: 'read write',
      oauthClientId: 'client-2',
      oauthUseDiscovery: false,
      oauthUseDynamicRegistration: true,
      oauthConfig: {
        clientSecret: 'secret',
        tokens: {
          access_token: 'access',
          token_type: 'Bearer',
        },
      },
    }, {
      includeRemoteEnv: true,
      headerTransports: ['streamableHttp'],
    })).toEqual({
      ok: true,
      name: 'linear',
      config: {
        transport: 'streamableHttp',
        url: 'https://mcp.example.com/mcp',
        env: { REMOTE_ENV: '1' },
        headers: { Authorization: 'Bearer token' },
        oauth: {
          clientSecret: 'secret',
          tokens: {
            access_token: 'access',
            token_type: 'Bearer',
          },
          scope: 'read write',
          clientId: 'client-2',
          useDiscovery: false,
          useDynamicRegistration: true,
        },
      },
    })
  })

  it('validates shared MCP server config drafts before saving', () => {
    expect(buildMcpServerConfigFromDraft(EMPTY_MCP_SERVER_CONFIG_DRAFT)).toEqual({
      ok: false,
      error: 'MCP server name is required',
    })
    expect(buildMcpServerConfigFromDraft({
      ...EMPTY_MCP_SERVER_CONFIG_DRAFT,
      name: 'DotAgents-Runtime-Tools',
      command: 'runtime',
    }, { reservedServerNames: ['dotagents-runtime-tools'] })).toEqual({
      ok: false,
      error: 'MCP server name "DotAgents-Runtime-Tools" is reserved',
    })
    expect(buildMcpServerConfigFromDraft({
      ...EMPTY_MCP_SERVER_CONFIG_DRAFT,
      name: 'github',
      command: 'npx',
    }, { existingServerNames: ['github'] })).toEqual({
      ok: false,
      error: 'MCP server "github" already exists',
    })
    expect(buildMcpServerConfigFromDraft({
      ...EMPTY_MCP_SERVER_CONFIG_DRAFT,
      name: 'remote',
      transport: 'websocket',
      url: 'not a url',
    })).toEqual({
      ok: false,
      error: 'MCP server URL is invalid',
    })
    expect(buildMcpServerConfigFromDraft({
      ...EMPTY_MCP_SERVER_CONFIG_DRAFT,
      name: 'remote',
      transport: 'websocket',
      url: 'wss://example.com/mcp',
      headers: 'Authorization',
    })).toEqual({
      ok: false,
      error: 'Header entries must use KEY=value',
    })
  })
})

describe('MCP server config mutations', () => {
  it('detects reserved server names case-insensitively', () => {
    expect(isReservedMcpServerName(' DOTAGENTS-RUNTIME-TOOLS ', ['dotagents-runtime-tools'])).toBe(true)
    expect(isReservedMcpServerName('github', ['dotagents-runtime-tools'])).toBe(false)
  })

  it('partitions server configs by reserved names', () => {
    const result = partitionMcpServersByReservedName({
      github: { command: 'github-mcp' },
      'DotAgents-Runtime-Tools': { command: 'reserved' },
      filesystem: { command: 'filesystem-mcp' },
    }, ['dotagents-runtime-tools'])

    expect(result.hiddenServerNames).toEqual(['DotAgents-Runtime-Tools'])
    expect(result.visibleServers).toEqual({
      github: { command: 'github-mcp' },
      filesystem: { command: 'filesystem-mcp' },
    })
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
