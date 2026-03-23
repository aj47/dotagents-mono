import type { Config } from "./types"

type ConfigRecord = Record<string, unknown>

const LOCAL_ONLY_TOP_LEVEL_KEYS = [
  "openaiApiKey",
  "groqApiKey",
  "geminiApiKey",
  "remoteServerApiKey",
  "langfuseSecretKey",
  "pushNotificationTokens",
] as const

const LOCAL_ONLY_MCP_SERVER_KEYS = ["env", "headers", "oauth"] as const

function isRecordObject(value: unknown): value is ConfigRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function hasDefinedValue(value: unknown): boolean {
  return value !== undefined
}

function hasMeaningfulLocalOnlyValue(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (isRecordObject(value)) return Object.keys(value).length > 0
  return value !== undefined && value !== null
}

function pickLocalOnlyValue(
  primaryValue: unknown,
  secondaryValue: unknown,
  preferPrimary: boolean,
): unknown {
  const preferredValue = preferPrimary ? primaryValue : secondaryValue
  const fallbackValue = preferPrimary ? secondaryValue : primaryValue

  if (hasMeaningfulLocalOnlyValue(preferredValue)) return preferredValue
  if (hasMeaningfulLocalOnlyValue(fallbackValue)) return fallbackValue
  if (hasDefinedValue(preferredValue)) return preferredValue
  if (hasDefinedValue(fallbackValue)) return fallbackValue
  return undefined
}

function mergeModelPresets(
  primaryValue: unknown,
  secondaryValue: unknown,
  preferPrimaryLocalOnly: boolean,
): unknown {
  if (!Array.isArray(primaryValue)) return secondaryValue
  if (!Array.isArray(secondaryValue)) {
    return primaryValue.map((preset) => {
      if (!isRecordObject(preset)) return preset
      const { apiKey, ...rest } = preset
      const mergedApiKey = pickLocalOnlyValue(apiKey, undefined, preferPrimaryLocalOnly)
      return mergedApiKey === undefined ? rest : { ...rest, apiKey: mergedApiKey }
    })
  }

  const secondaryById = new Map<string, ConfigRecord>()
  for (const preset of secondaryValue) {
    if (!isRecordObject(preset) || typeof preset.id !== "string") continue
    secondaryById.set(preset.id, preset)
  }

  return primaryValue.map((preset) => {
    if (!isRecordObject(preset) || typeof preset.id !== "string") return preset

    const secondaryPreset = secondaryById.get(preset.id)
    const mergedPreset = secondaryPreset ? { ...secondaryPreset, ...preset } : { ...preset }
    const mergedApiKey = pickLocalOnlyValue(
      preset.apiKey,
      secondaryPreset?.apiKey,
      preferPrimaryLocalOnly,
    )

    if (mergedApiKey === undefined) {
      delete mergedPreset.apiKey
    } else {
      mergedPreset.apiKey = mergedApiKey
    }

    return mergedPreset
  })
}

function mergeMcpConfig(
  primaryValue: unknown,
  secondaryValue: unknown,
  preferPrimaryLocalOnly: boolean,
): unknown {
  if (!isRecordObject(primaryValue)) return secondaryValue
  if (!isRecordObject(secondaryValue)) {
    const primaryCopy = { ...primaryValue }
    if (isRecordObject(primaryValue.mcpServers)) {
      const mergedServers: ConfigRecord = {}
      for (const [serverName, serverConfig] of Object.entries(primaryValue.mcpServers)) {
        if (!isRecordObject(serverConfig)) {
          mergedServers[serverName] = serverConfig
          continue
        }

        const nextServer = { ...serverConfig }
        for (const key of LOCAL_ONLY_MCP_SERVER_KEYS) {
          const mergedValue = pickLocalOnlyValue(serverConfig[key], undefined, preferPrimaryLocalOnly)
          if (mergedValue === undefined) {
            delete nextServer[key]
          } else {
            nextServer[key] = mergedValue
          }
        }
        mergedServers[serverName] = nextServer
      }
      primaryCopy.mcpServers = mergedServers
    }
    return primaryCopy
  }

  const mergedConfig: ConfigRecord = { ...secondaryValue, ...primaryValue }
  if (!isRecordObject(primaryValue.mcpServers)) return mergedConfig

  const secondaryServers = isRecordObject(secondaryValue.mcpServers)
    ? secondaryValue.mcpServers
    : {}

  const mergedServers: ConfigRecord = {}
  for (const [serverName, serverConfig] of Object.entries(primaryValue.mcpServers)) {
    const secondaryServer = isRecordObject(secondaryServers[serverName])
      ? secondaryServers[serverName]
      : undefined

    if (!isRecordObject(serverConfig)) {
      mergedServers[serverName] = serverConfig
      continue
    }

    const nextServer: ConfigRecord = secondaryServer
      ? { ...secondaryServer, ...serverConfig }
      : { ...serverConfig }

    for (const key of LOCAL_ONLY_MCP_SERVER_KEYS) {
      const mergedValue = pickLocalOnlyValue(
        serverConfig[key],
        secondaryServer?.[key],
        preferPrimaryLocalOnly,
      )
      if (mergedValue === undefined) {
        delete nextServer[key]
      } else {
        nextServer[key] = mergedValue
      }
    }

    mergedServers[serverName] = nextServer
  }

  mergedConfig.mcpServers = mergedServers
  return mergedConfig
}

function mergeAcpAgents(
  primaryValue: unknown,
  secondaryValue: unknown,
  preferPrimaryLocalOnly: boolean,
): unknown {
  if (!Array.isArray(primaryValue)) return secondaryValue
  if (!Array.isArray(secondaryValue)) {
    return primaryValue.map((agent) => {
      if (!isRecordObject(agent) || !isRecordObject(agent.connection)) return agent
      const nextAgent = { ...agent }
      const nextConnection = { ...agent.connection }
      const mergedEnv = pickLocalOnlyValue(agent.connection.env, undefined, preferPrimaryLocalOnly)
      if (mergedEnv === undefined) {
        delete nextConnection.env
      } else {
        nextConnection.env = mergedEnv
      }
      nextAgent.connection = nextConnection
      return nextAgent
    })
  }

  const secondaryByName = new Map<string, ConfigRecord>()
  for (const agent of secondaryValue) {
    if (!isRecordObject(agent) || typeof agent.name !== "string") continue
    secondaryByName.set(agent.name, agent)
  }

  return primaryValue.map((agent) => {
    if (!isRecordObject(agent) || typeof agent.name !== "string") return agent

    const secondaryAgent = secondaryByName.get(agent.name)
    const nextAgent: ConfigRecord = secondaryAgent ? { ...secondaryAgent, ...agent } : { ...agent }

    if (!isRecordObject(agent.connection)) return nextAgent

    const secondaryConnection = secondaryAgent && isRecordObject(secondaryAgent.connection)
      ? secondaryAgent.connection
      : undefined
    const nextConnection: ConfigRecord = secondaryConnection
      ? { ...secondaryConnection, ...agent.connection }
      : { ...agent.connection }

    const mergedEnv = pickLocalOnlyValue(
      agent.connection.env,
      secondaryConnection?.env,
      preferPrimaryLocalOnly,
    )

    if (mergedEnv === undefined) {
      delete nextConnection.env
    } else {
      nextConnection.env = mergedEnv
    }

    nextAgent.connection = nextConnection
    return nextAgent
  })
}

export function mergeConfigWithLocalOnlyPreference(
  primaryConfig: Partial<Config>,
  secondaryConfig: Partial<Config>,
  options: { preferPrimaryLocalOnly: boolean },
): Partial<Config> {
  const merged: Partial<Config> = { ...secondaryConfig, ...primaryConfig }

  for (const key of LOCAL_ONLY_TOP_LEVEL_KEYS) {
    const mergedValue = pickLocalOnlyValue(
      (primaryConfig as ConfigRecord)[key],
      (secondaryConfig as ConfigRecord)[key],
      options.preferPrimaryLocalOnly,
    )

    if (mergedValue === undefined) {
      delete (merged as ConfigRecord)[key]
    } else {
      ;(merged as ConfigRecord)[key] = mergedValue
    }
  }

  const modelPresets = mergeModelPresets(
    primaryConfig.modelPresets,
    secondaryConfig.modelPresets,
    options.preferPrimaryLocalOnly,
  )
  if (modelPresets === undefined) {
    delete (merged as ConfigRecord).modelPresets
  } else {
    merged.modelPresets = modelPresets as Config["modelPresets"]
  }

  const mcpConfig = mergeMcpConfig(
    primaryConfig.mcpConfig,
    secondaryConfig.mcpConfig,
    options.preferPrimaryLocalOnly,
  )
  if (mcpConfig === undefined) {
    delete (merged as ConfigRecord).mcpConfig
  } else {
    merged.mcpConfig = mcpConfig as Config["mcpConfig"]
  }

  const acpAgents = mergeAcpAgents(
    primaryConfig.acpAgents,
    secondaryConfig.acpAgents,
    options.preferPrimaryLocalOnly,
  )
  if (acpAgents === undefined) {
    delete (merged as ConfigRecord).acpAgents
  } else {
    merged.acpAgents = acpAgents as Config["acpAgents"]
  }

  return merged
}

export function createShareableConfig(config: Partial<Config>): Partial<Config> {
  const shareableConfig: Partial<Config> = { ...config }

  for (const key of LOCAL_ONLY_TOP_LEVEL_KEYS) {
    delete (shareableConfig as ConfigRecord)[key]
  }

  if (Array.isArray(shareableConfig.modelPresets)) {
    shareableConfig.modelPresets = shareableConfig.modelPresets.map((preset) => {
      if (!isRecordObject(preset)) return preset
      const { apiKey, ...rest } = preset
      return rest
    }) as Config["modelPresets"]
  }

  if (isRecordObject(shareableConfig.mcpConfig) && isRecordObject(shareableConfig.mcpConfig.mcpServers)) {
    const nextServers: ConfigRecord = {}
    for (const [serverName, serverConfig] of Object.entries(shareableConfig.mcpConfig.mcpServers)) {
      if (!isRecordObject(serverConfig)) {
        nextServers[serverName] = serverConfig
        continue
      }

      const { env, headers, oauth, ...rest } = serverConfig
      nextServers[serverName] = rest
    }

    shareableConfig.mcpConfig = {
      ...shareableConfig.mcpConfig,
      mcpServers: nextServers,
    }
  }

  if (Array.isArray(shareableConfig.acpAgents)) {
    shareableConfig.acpAgents = shareableConfig.acpAgents.map((agent) => {
      if (!isRecordObject(agent) || !isRecordObject(agent.connection)) return agent
      const { env, ...connection } = agent.connection
      return {
        ...agent,
        connection,
      }
    }) as Config["acpAgents"]
  }

  return shareableConfig
}

export function hasLocalOnlyConfigValues(config: Partial<Config>): boolean {
  for (const key of LOCAL_ONLY_TOP_LEVEL_KEYS) {
    if ((config as ConfigRecord)[key] !== undefined) return true
  }

  if (Array.isArray(config.modelPresets)) {
    for (const preset of config.modelPresets) {
      if (isRecordObject(preset) && Object.prototype.hasOwnProperty.call(preset, "apiKey")) {
        return true
      }
    }
  }

  if (isRecordObject(config.mcpConfig) && isRecordObject(config.mcpConfig.mcpServers)) {
    for (const serverConfig of Object.values(config.mcpConfig.mcpServers)) {
      if (!isRecordObject(serverConfig)) continue
      for (const key of LOCAL_ONLY_MCP_SERVER_KEYS) {
        if (serverConfig[key] !== undefined) return true
      }
    }
  }

  if (Array.isArray(config.acpAgents)) {
    for (const agent of config.acpAgents) {
      if (isRecordObject(agent) && isRecordObject(agent.connection) && agent.connection.env !== undefined) {
        return true
      }
    }
  }

  return false
}
