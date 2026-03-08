import {
  focusManager,
  QueryClient,
  useMutation,
  useQuery,
} from "@tanstack/react-query"
import type { Config, ModelInfo } from "@shared/types"
import { reportConfigSaveError } from "./config-save-error"
import { tipcClient } from "./tipc-client"

focusManager.setEventListener((handleFocus) => {
  const handler = () => handleFocus()
  window.addEventListener("focus", handler)
  return () => {
    window.removeEventListener("focus", handler)
  }
})

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: "always",
    },
  },
})

// ============================================================================
// Query Hooks
// ============================================================================

export const useMicrophoneStatusQuery = () =>
  useQuery({
    queryKey: ["microphone-status"],
    queryFn: async () => {
      return tipcClient.getMicrophoneStatus()
    },
  })

export const useConfigQuery = () =>
  useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      return tipcClient.getConfig()
    },
  })

export const useConversationHistoryQuery = (enabled: boolean = true) =>
  useQuery({
    queryKey: ["conversation-history"],
    queryFn: async () => {
      const result = await tipcClient.getConversationHistory()
      return result
    },
    enabled,
  })

export const useConversationQuery = (conversationId: string | null) =>
  useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      if (!conversationId) return null
      const result = await tipcClient.loadConversation({ conversationId })
      return result
    },
    enabled: !!conversationId,
  })

export const useMcpServerStatus = () =>
  useQuery({
    queryKey: ["mcp-server-status"],
    queryFn: async () => {
      return tipcClient.getMcpServerStatus()
    },
  })

export const useMcpInitializationStatus = () =>
  useQuery({
    queryKey: ["mcp-initialization-status"],
    queryFn: async () => {
      return tipcClient.getMcpInitializationStatus()
    },
  })

export type AvailableModelsQueryResult = {
  models: ModelInfo[]
  source: "provider" | "fallback"
  fallbackReason?: "missing_api_key" | "provider_error"
  fallbackMessage?: string
}

const AVAILABLE_MODEL_DISCOVERY_CONFIG_KEYS = {
  openai: ["openaiApiKey", "openaiBaseUrl"],
  groq: ["groqApiKey", "groqBaseUrl"],
  gemini: ["geminiApiKey", "geminiBaseUrl"],
} satisfies Record<string, Array<keyof Config>>

function getProvidersWithUpdatedModelDiscoveryConfig(
  previousConfig?: Partial<Config>,
  nextConfig?: Partial<Config>,
) {
  if (!nextConfig) {
    return [] as Array<keyof typeof AVAILABLE_MODEL_DISCOVERY_CONFIG_KEYS>
  }

  return (Object.entries(AVAILABLE_MODEL_DISCOVERY_CONFIG_KEYS) as Array<[
    keyof typeof AVAILABLE_MODEL_DISCOVERY_CONFIG_KEYS,
    Array<keyof Config>,
  ]>).flatMap(([providerId, keys]) =>
    keys.some((key) => previousConfig?.[key] !== nextConfig[key]) ? [providerId] : [],
  )
}

export const useAvailableModelsQuery = (
  providerId: string,
  enabled: boolean = true,
  presetId?: string,
) =>
  useQuery<AvailableModelsQueryResult>({
    queryKey:
      providerId === "openai" && presetId
        ? ["available-models", providerId, presetId]
        : ["available-models", providerId],
    queryFn: async () => {
      return tipcClient.fetchAvailableModels({ providerId })
    },
    enabled: enabled && !!providerId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

type PresetModelOption = {
  id: string
  name: string
}

type PresetModelInfo = {
  id: string
  name: string
  tool_call?: boolean
  reasoning?: boolean
  modalities?: {
    input?: string[]
    output?: string[]
  }
  cost?: {
    input?: number
    output?: number
  }
  limit?: {
    context?: number
    output?: number
  }
}

function getQueryFingerprint(...parts: string[]) {
  const combined = parts.join("\u0000")
  let hash = 0

  for (let index = 0; index < combined.length; index += 1) {
    hash = (hash * 31 + combined.charCodeAt(index)) >>> 0
  }

  return hash.toString(36)
}

export const usePresetAvailableModelsQuery = (
  presetId: string,
  baseUrl: string,
  apiKey: string,
  enabled: boolean = true,
) =>
  useQuery<PresetModelOption[]>({
    queryKey: [
      "preset-available-models",
      presetId,
      getQueryFingerprint(baseUrl, apiKey),
    ],
    queryFn: async () => {
      return tipcClient.fetchModelsForPreset({ baseUrl, apiKey })
    },
    enabled: enabled && !!baseUrl && !!apiKey,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

export const usePresetModelInfoQuery = (
  modelIds: string[],
  enabled: boolean = true,
) =>
  useQuery<Record<string, PresetModelInfo>>({
    queryKey: ["preset-model-info", modelIds],
    queryFn: async () => {
      const infoEntries = await Promise.all(
        modelIds.map(async (modelId) => {
          try {
            const info = await tipcClient.getModelInfo({ modelId })
            return info ? ([modelId, info as PresetModelInfo] as const) : null
          } catch {
            return null
          }
        }),
      )

      return Object.fromEntries(
        infoEntries.filter(
          (entry): entry is readonly [string, PresetModelInfo] => entry !== null,
        ),
      )
    },
    enabled: enabled && modelIds.length > 0,
    staleTime: 30 * 60 * 1000,
    retry: false,
  })

export const useSaveConversationMutation = () =>
  useMutation({
    mutationFn: async ({ conversation }: { conversation: any }) => {
      await tipcClient.saveConversation({ conversation })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation-history"] })
    },
  })

export const useCreateConversationMutation = () =>
  useMutation({
    mutationFn: async ({
      firstMessage,
      role,
    }: {
      firstMessage: string
      role?: "user" | "assistant"
    }) => {
      const result = await tipcClient.createConversation({ firstMessage, role })
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation-history"] })
    },
  })

export const useAddMessageToConversationMutation = () =>
  useMutation({
    mutationFn: async ({
      conversationId,
      content,
      role,
      toolCalls,
      toolResults,
    }: {
      conversationId: string
      content: string
      role: "user" | "assistant" | "tool"
      toolCalls?: Array<{ name: string; arguments: any }>
      toolResults?: Array<{ success: boolean; content: string; error?: string }>
    }) => {
      return tipcClient.addMessageToConversation({
        conversationId,
        content,
        role,
        toolCalls,
        toolResults,
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversation", variables.conversationId],
      })
      queryClient.invalidateQueries({ queryKey: ["conversation-history"] })
    },
  })

export const useDeleteConversationMutation = () =>
  useMutation({
    mutationFn: async (conversationId: string) => {
      return tipcClient.deleteConversation({ conversationId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation-history"] })
    },
  })

export const useDeleteAllConversationsMutation = () =>
  useMutation({
    mutationFn: async () => {
      return tipcClient.deleteAllConversations()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation-history"] })
      queryClient.invalidateQueries({ queryKey: ["conversation"] })
    },
  })

export const useSaveConfigMutation = () =>
  useMutation({
    mutationFn: tipcClient.saveConfig,
    onSuccess(_, variables) {
      const previousConfig = queryClient.getQueryData(["config"]) as Partial<Config> | undefined
      const changedModelProviders = getProvidersWithUpdatedModelDiscoveryConfig(
        previousConfig,
        variables.config as Partial<Config> | undefined,
      )

      queryClient.invalidateQueries({
        queryKey: ["config"],
      })

      changedModelProviders.forEach((providerId) => {
        queryClient.invalidateQueries({
          queryKey: ["available-models", providerId],
        })
      })
    },
    onError: reportConfigSaveError,
  })

export const useUpdateConfigMutation = () =>
  useMutation({
    mutationFn: async ({ config }: { config: any }) => {
      await tipcClient.saveConfig({ config })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] })
    },
    onError: reportConfigSaveError,
  })

export const useLoadMcpConfigFile = () =>
  useMutation({
    mutationFn: async () => {
      return tipcClient.loadMcpConfigFile()
    },
  })

export const useSaveMcpConfigFile = () =>
  useMutation({
    mutationFn: async ({ config }: { config: any }) => {
      await tipcClient.saveMcpConfigFile({ config })
    },
  })

// ============================================================================
// History-themed aliases for better semantic naming
// ============================================================================

export const useHistoryQuery = useConversationHistoryQuery
export const useHistoryItemQuery = useConversationQuery
export const useDeleteHistoryItemMutation = useDeleteConversationMutation
export const useDeleteAllHistoryMutation = useDeleteAllConversationsMutation
