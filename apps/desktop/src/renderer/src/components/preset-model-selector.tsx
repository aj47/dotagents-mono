import { useState, useEffect, useRef } from "react"
import { Label } from "./ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import {
  AlertCircle,
  RefreshCw,
  Wrench,
  Brain,
  Image,
  Search,
} from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  usePresetAvailableModelsQuery,
  usePresetModelInfoQuery,
} from "@renderer/lib/queries"

/** Local type matching models.dev service response */
interface ModelsDevModel {
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

interface PresetModelSelectorProps {
  presetId: string
  baseUrl: string
  apiKey: string
  value?: string
  onValueChange: (value: string) => void
  label: string
  placeholder?: string
  disabled?: boolean
}

/** Format price in a compact way */
function formatPrice(price: number | undefined): string | null {
  if (price === undefined || price === null) return null
  if (price === 0) return "Free"
  if (price < 0.01) return `$${price.toFixed(4)}`
  if (price < 1) return `$${price.toFixed(2)}`
  return `$${price.toFixed(2)}`
}

/** Format context window size in a compact way */
function formatContextSize(context: number | undefined): string | null {
  if (!context) return null
  if (context >= 1000000) return `${(context / 1000000).toFixed(1)}M ctx`
  if (context >= 1000) return `${Math.round(context / 1000)}K ctx`
  return `${context} ctx`
}

export function PresetModelSelector({
  presetId,
  baseUrl,
  apiKey,
  value,
  onValueChange,
  label,
  placeholder = "Select a model",
  disabled = false,
}: PresetModelSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const hasCredentials = !!baseUrl && !!apiKey
  const modelsQuery = usePresetAvailableModelsQuery(
    presetId,
    baseUrl,
    apiKey,
    hasCredentials,
  )
  const models = modelsQuery.data || []
  const modelsDevInfoQuery = usePresetModelInfoQuery(
    models.map((model) => model.id),
    models.length > 0,
  )
  const modelsDevData = (modelsDevInfoQuery.data || {}) as Record<
    string,
    ModelsDevModel
  >
  const errorMessage =
    modelsQuery.error instanceof Error
      ? modelsQuery.error.message
      : modelsQuery.error
        ? "Failed to fetch models"
        : null
  const isLoading = modelsQuery.isLoading
  const isRefreshing = modelsQuery.isFetching

  const fetchModels = async () => {
    if (!hasCredentials) {
      return
    }

    await modelsQuery.refetch()
  }

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("")
      return
    }

    requestAnimationFrame(() => {
      searchInputRef.current?.focus()
    })
  }, [isOpen])

  // Keep search focus stable while typing; Radix can move focus during content reflow.
  useEffect(() => {
    if (!isOpen) return

    requestAnimationFrame(() => {
      if (
        searchInputRef.current &&
        document.activeElement !== searchInputRef.current
      ) {
        searchInputRef.current.focus()
      }
    })
  }, [searchQuery, isOpen])

  const isBlockingLoad = isLoading && models.length === 0
  const hasError = !!errorMessage && models.length === 0
  const refreshError = !!errorMessage && models.length > 0
  const missingCredentialsMessage = !baseUrl && !apiKey
    ? "Add a base URL and API key to load models for this preset."
    : !baseUrl
      ? "Add a base URL to load models for this preset."
      : "Add an API key to load models for this preset."
  const missingCredentialsPlaceholder = !baseUrl && !apiKey
    ? "Add base URL and API key first"
    : !baseUrl
      ? "Add base URL first"
      : "Add API key first"

  /** Get models.dev info for a specific model */
  const getModelInfo = (modelId: string): ModelsDevModel | undefined => {
    return modelsDevData[modelId]
  }

  const filteredModels = models.filter((model) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    const info = getModelInfo(model.id)
    return (
      model.id.toLowerCase().includes(query) ||
      model.name.toLowerCase().includes(query) ||
      info?.name?.toLowerCase().includes(query)
    )
  })

  const selectedDisplayValue = (() => {
    if (!value) return undefined

    const selectedModel = models.find((model) => model.id === value)
    if (!selectedModel) return value

    const selectedInfo = getModelInfo(selectedModel.id)
    const selectedInputPrice = formatPrice(selectedInfo?.cost?.input)
    const selectedOutputPrice = formatPrice(selectedInfo?.cost?.output)
    const selectedContextSize = formatContextSize(selectedInfo?.limit?.context)

    const metaParts: string[] = []
    if (selectedInputPrice && selectedOutputPrice) {
      metaParts.push(`${selectedInputPrice}/${selectedOutputPrice}/M`)
    }
    if (selectedContextSize) {
      metaParts.push(selectedContextSize)
    }

    if (metaParts.length === 0) return selectedModel.name
    return `${selectedModel.name} • ${metaParts.join(" • ")}`
  })()

  const helperText = (() => {
    if (!hasCredentials) return missingCredentialsMessage
    if (isBlockingLoad) return "Loading models from this preset..."
    if (refreshError) {
      return "Couldn't refresh models. Showing the last successful model list."
    }
    if (hasError) {
      return "Couldn't load models for this preset. Check the base URL and API key, then retry."
    }
    if (models.length === 0) {
      return "No models were returned for this preset. Verify the endpoint supports model discovery, then refresh."
    }
    if (searchQuery.trim()) {
      return `${filteredModels.length} of ${models.length} models match "${searchQuery}"`
    }
    return `${models.length} model${models.length !== 1 ? "s" : ""} available for this preset`
  })()

  /** Render model item with pricing and capabilities */
  const renderModelItem = (model: { id: string; name: string }) => {
    const info = getModelInfo(model.id)
    const inputPrice = formatPrice(info?.cost?.input)
    const outputPrice = formatPrice(info?.cost?.output)
    const contextSize = formatContextSize(info?.limit?.context)

    const hasToolCall = info?.tool_call
    const hasReasoning = info?.reasoning
    const hasVision = info?.modalities?.input?.includes("image")

    return (
      <SelectItem key={model.id} value={model.id}>
        <div className="flex w-full min-w-0 items-center gap-2 py-0.5">
          <span className="truncate">{model.name}</span>
          {/* Capability indicators */}
          <div className="flex shrink-0 items-center gap-1">
            {hasToolCall && (
              <span title="Tool calling">
                <Wrench className="h-3 w-3 text-blue-500" />
              </span>
            )}
            {hasReasoning && (
              <span title="Reasoning">
                <Brain className="h-3 w-3 text-purple-500" />
              </span>
            )}
            {hasVision && (
              <span title="Vision">
                <Image className="h-3 w-3 text-green-500" />
              </span>
            )}
          </div>
          {/* Pricing and context info */}
          {(inputPrice || contextSize) && (
            <div className="text-muted-foreground ml-auto flex shrink-0 items-center gap-2 text-xs">
              {inputPrice && outputPrice && (
                <span className="whitespace-nowrap">
                  {inputPrice}/{outputPrice}/M
                </span>
              )}
              {contextSize && (
                <span className="whitespace-nowrap">{contextSize}</span>
              )}
            </div>
          )}
        </div>
      </SelectItem>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void fetchModels()
          }}
          disabled={isRefreshing || disabled || !hasCredentials}
          className="h-6 px-2 text-xs"
          aria-label="Refresh available models"
          title={isRefreshing ? "Refreshing available models" : "Refresh available models"}
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Select
        value={value || ""}
        onValueChange={onValueChange}
        onOpenChange={setIsOpen}
        disabled={disabled || isBlockingLoad || !hasCredentials}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={
              isBlockingLoad
                ? "Loading models..."
                : !hasCredentials
                  ? missingCredentialsPlaceholder
                  : hasError
                    ? "Couldn't load models"
                    : models.length === 0
                      ? "No models returned"
                    : placeholder
            }
          >
            {selectedDisplayValue}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          className="max-h-[300px]"
          onCloseAutoFocus={(e) => e.preventDefault()}
          header={
            <div
              className="flex items-center gap-2 border-b px-3 py-2"
              onMouseDown={(e) => e.preventDefault()}
            >
              <Search className="text-muted-foreground h-4 w-4 shrink-0" />
              <Input
                ref={searchInputRef}
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => {
                  e.stopPropagation()
                  setSearchQuery(e.target.value)
                }}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                    e.preventDefault()
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="h-auto border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          }
        >
          {isBlockingLoad && (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-4 text-sm">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading models...
            </div>
          )}
          {filteredModels.map((model) => renderModelItem(model))}
          {models.length > 0 &&
            filteredModels.length === 0 &&
            searchQuery.trim() && (
              <div className="text-muted-foreground flex items-center justify-center py-4 text-sm">
                No models match "{searchQuery}"
              </div>
            )}
          {models.length === 0 && !isBlockingLoad && (
            <div className="flex flex-col items-center justify-center gap-1 px-4 py-4 text-center text-sm">
              {hasError ? (
                <>
                  <div className="flex items-center justify-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>Couldn't load models for this preset.</span>
                  </div>
                  <p className="text-xs text-destructive/80">
                    Check the base URL and API key, then refresh.
                  </p>
                </>
              ) : (
                <>
                  <div className="text-muted-foreground flex items-center justify-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>No models were returned for this preset.</span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Verify the endpoint supports model discovery, then refresh.
                  </p>
                </>
              )}
            </div>
          )}
        </SelectContent>
      </Select>

      <p
        className={`text-xs ${hasError || refreshError ? "text-destructive" : "text-muted-foreground"}`}
      >
        {helperText}
      </p>
    </div>
  )
}
