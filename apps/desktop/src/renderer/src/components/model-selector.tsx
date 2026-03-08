import { useState, useEffect, useRef } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select"
import { Label } from "@renderer/components/ui/label"
import { Input } from "@renderer/components/ui/input"
import { useAvailableModelsQuery, useConfigQuery } from "@renderer/lib/query-client"
import { AlertCircle, RefreshCw, Search, Edit3 } from "lucide-react"
import { Button } from "@renderer/components/ui/button"
import { logUI, logFocus, logStateChange, logRender } from "@renderer/lib/debug"
import { DEFAULT_MODEL_PRESET_ID } from "@shared/index"

interface ModelSelectorProps {
  providerId: string
  value?: string
  onValueChange: (value: string) => void
  label?: string
  placeholder?: string
  className?: string
  disabled?: boolean
}

const PROVIDER_NAMES: Record<string, string> = {
  openai: "OpenAI",
  groq: "Groq",
  gemini: "Gemini",
}

export function ModelSelector({
  providerId,
  value,
  onValueChange,
  label,
  placeholder,
  className,
  disabled = false,
}: ModelSelectorProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [useCustomInput, setUseCustomInput] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const customInputRef = useRef<HTMLInputElement>(null)

  const configQuery = useConfigQuery()
  const providerName = PROVIDER_NAMES[providerId] || providerId
  const currentPresetId = providerId === "openai"
    ? configQuery.data?.currentModelPresetId || DEFAULT_MODEL_PRESET_ID
    : undefined

  const modelsQuery = useAvailableModelsQuery(providerId, !!providerId, currentPresetId)
  const modelsResult = modelsQuery.data
  const isLoading = modelsQuery.isLoading || isRefreshing
  const hasError = modelsQuery.isError && !modelsResult
  const usingFallbackModels = modelsResult?.source === "fallback"
  const fallbackReason = modelsResult?.fallbackReason
  const allModels = modelsResult?.models || []

  useEffect(() => {
    logRender('ModelSelector', 'mount/update', {
      providerId,
      value,
      isOpen,
      searchQuery,
      modelsCount: allModels.length
    })
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await modelsQuery.refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  // Auto-detect if current value is a custom model (not in list)
  useEffect(() => {
    if (value && allModels.length > 0 && !useCustomInput) {
      const isInList = allModels.some(model => model.id === value)
      if (!isInList) {
        setUseCustomInput(true)
        logUI('[ModelSelector] Detected custom model:', value)
      }
    }
  }, [value, allModels, useCustomInput])

  useEffect(() => {
    if (!value && allModels.length > 0 && !useCustomInput) {
      logUI('[ModelSelector] Auto-selecting first model:', allModels[0].id)
      onValueChange(allModels[0].id)
    }
  }, [value, allModels, onValueChange, useCustomInput])

  useEffect(() => {
    if (!isOpen) {
      logStateChange('ModelSelector', 'isOpen', true, false)
      logUI('[ModelSelector] Dropdown closed, clearing search query')
      setSearchQuery("")
    } else {
      logStateChange('ModelSelector', 'isOpen', false, true)
      logUI('[ModelSelector] Dropdown opened, focusing search input')
      requestAnimationFrame(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
          logFocus('ModelSelector.searchInput', 'focus', { delayed: true })
        }
      })
    }
  }, [isOpen])

  // Ensure the search input retains focus while typing (some Radix focus management can steal it)
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        if (
          searchInputRef.current &&
          document.activeElement !== searchInputRef.current
        ) {
          logUI('[ModelSelector] Refocusing search input after query change')
          searchInputRef.current.focus()
        }
      })
    }
  }, [searchQuery, isOpen])

  // Filter models based on search query
  const filteredModels = allModels.filter((model) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      model.id.toLowerCase().includes(query) ||
      model.name.toLowerCase().includes(query) ||
      (model.description && model.description.toLowerCase().includes(query))
    )
  })

  const handleToggleCustom = () => {
    if (useCustomInput) {
      // Switching back to dropdown - select first model if available
      setUseCustomInput(false)
      if (allModels.length > 0) {
        onValueChange(allModels[0].id)
      }
    } else {
      // Switching to custom input
      setUseCustomInput(true)
      requestAnimationFrame(() => customInputRef.current?.focus())
    }
  }

  const helperText = (() => {
    if (useCustomInput) {
      if (usingFallbackModels) {
        return `Enter the exact ${providerName} model ID from your provider. The discovered list is currently using fallback suggestions.`
      }

      return `Enter any model name supported by ${providerName}.`
    }

    if (isLoading) {
      return `Loading ${providerName} model suggestions...`
    }

    if (hasError) {
      return `Couldn't load ${providerName} model suggestions. Retry or switch to a custom model name.`
    }

    if (usingFallbackModels) {
      if (fallbackReason === "missing_api_key") {
        return `${providerName} API key is missing, so this list is showing fallback suggestions. Add the key above or switch to a custom model name.`
      }

      return `Couldn't verify ${providerName} models from the configured endpoint. Showing fallback suggestions instead; refresh after fixing credentials, or switch to a custom model name.`
    }

    if (allModels.length === 0) {
      return `No ${providerName} models were returned. Switch to a custom model name if your provider supports manual model IDs.`
    }

    if (searchQuery.trim()) {
      return `${filteredModels.length} of ${allModels.length} ${providerName} models match "${searchQuery}"`
    }

    return `${allModels.length} verified ${providerName} model${allModels.length !== 1 ? "s" : ""} available`
  })()

  const helperTextToneClass = hasError
    ? "text-destructive"
    : usingFallbackModels
      ? "text-amber-600 dark:text-amber-400"
      : "text-muted-foreground"

  const selectPlaceholder = isLoading
    ? `Loading ${providerName} models...`
    : hasError
      ? "Couldn't load models"
      : usingFallbackModels
        ? "Select a fallback model"
        : allModels.length === 0
          ? `No ${providerName} models returned`
          : placeholder || "Select a model"

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">{label}</Label>
            {!useCustomInput && usingFallbackModels && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                Fallback suggestions
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleCustom}
              disabled={disabled}
              className="h-6 px-2 text-xs flex-shrink-0"
              aria-label={useCustomInput ? "Switch to model list" : "Use custom model name"}
              title={useCustomInput ? "Switch to model list" : "Use custom model name"}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            {!useCustomInput && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading || disabled}
                className="h-6 px-2 text-xs flex-shrink-0"
                aria-label="Refresh available models"
                title={isLoading ? "Refreshing available models" : "Refresh available models"}
              >
                <RefreshCw
                  className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            )}
          </div>
        </div>
      )}

      {useCustomInput ? (
        <Input
          ref={customInputRef}
          value={value || ""}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="Enter custom model name (e.g., gpt-4o, claude-3-opus)"
          disabled={disabled}
          className="w-full"
          maxLength={100}
        />
      ) : (
      <Select
        value={value}
        onValueChange={(newValue) => {
          logUI('[ModelSelector] Select onValueChange:', newValue)
          onValueChange(newValue)
        }}
        disabled={disabled || isLoading || allModels.length === 0}
        open={isOpen}
        onOpenChange={(open) => {
          logUI('[ModelSelector] Select onOpenChange:', open)
          setIsOpen(open)
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={selectPlaceholder} />
        </SelectTrigger>
        <SelectContent
          className="w-[300px]"
          onCloseAutoFocus={(e) => {
            // Prevent Radix from moving focus back to the trigger; we'll manage it
            e.preventDefault()
          }}
          header={
            <div
              className="flex items-center gap-2 border-b px-3 py-2"
              onMouseDown={(e) => e.preventDefault()}
            >
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => {
                  const newValue = e.target.value
                  logStateChange('ModelSelector', 'searchQuery', searchQuery, newValue)
                  logUI('[ModelSelector] Search input onChange, activeElement:', document.activeElement?.tagName)
                  e.stopPropagation()
                  setSearchQuery(newValue)
                }}
                onKeyDown={(e) => {
                  logUI('[ModelSelector] Search input onKeyDown:', e.key, 'activeElement:', document.activeElement?.tagName)
                  e.stopPropagation()
                  if (e.key === "Escape") {
                    logUI('[ModelSelector] Escape pressed, closing dropdown')
                    setIsOpen(false)
                  } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                    logUI('[ModelSelector] Arrow key pressed:', e.key)
                    e.preventDefault()
                  }
                }}
                onFocus={(e) => {
                  e.stopPropagation()
                  logFocus('ModelSelector.searchInput', 'focus', {
                    relatedTarget: e.relatedTarget?.tagName,
                    activeElement: document.activeElement?.tagName
                  })
                }}
                onBlur={(e) => {
                  e.stopPropagation()
                  logFocus('ModelSelector.searchInput', 'blur', {
                    relatedTarget: e.relatedTarget?.tagName,
                    activeElement: document.activeElement?.tagName
                  })
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="h-auto border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          }
        >
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <span className="text-sm text-muted-foreground">
                  Loading {providerName} models...
                </span>
              </div>
            )}

            {hasError && (
              <div className="flex flex-col items-center justify-center gap-1 px-4 py-8 text-center text-destructive">
                <div className="flex items-center justify-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Couldn't load model suggestions.</span>
                </div>
                <p className="text-xs text-destructive/80">
                  Retry or switch to a custom model name.
                </p>
              </div>
            )}

            {!isLoading && !hasError && allModels.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-1 px-4 py-8 text-center text-sm">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>No models available</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Switch to a custom model name if your provider supports manual model IDs.
                </p>
              </div>
            )}

            {!isLoading &&
              !hasError &&
              filteredModels.length === 0 &&
              searchQuery.trim() && (
                <div className="flex items-center justify-center py-8">
                  <span className="text-sm text-muted-foreground">
                    No models match "{searchQuery}"
                  </span>
                </div>
              )}

            {filteredModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex w-full min-w-0 items-center gap-2">
                  <span className="truncate">{model.name}</span>
                  {model.supportsTranscription && (
                    <span className="shrink-0 rounded-full bg-green-500/20 px-1.5 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                      STT
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      )}

      <p className={`text-xs ${helperTextToneClass}`}>
        {helperText}
      </p>
    </div>
  )
}

interface ProviderModelSelectorProps {
  providerId: string
  mcpModel?: string
  transcriptModel?: string
  onMcpModelChange: (value: string) => void
  onTranscriptModelChange: (value: string) => void
  showMcpModel?: boolean
  showTranscriptModel?: boolean
  disabled?: boolean
}

export function ProviderModelSelector({
  providerId,
  mcpModel,
  transcriptModel,
  onMcpModelChange,
  onTranscriptModelChange,
  showMcpModel = true,
  showTranscriptModel = true,
  disabled = false,
}: ProviderModelSelectorProps) {
  const providerName = PROVIDER_NAMES[providerId] || providerId

  return (
    <div className="space-y-4">
      {showMcpModel && (
        <ModelSelector
          providerId={providerId}
          value={mcpModel}
          onValueChange={onMcpModelChange}
          label={`${providerName} Model (Agent/MCP Tools)`}
          placeholder="Select model for tool calling"
          disabled={disabled}
        />
      )}

      {showTranscriptModel && (
        <ModelSelector
          providerId={providerId}
          value={transcriptModel}
          onValueChange={onTranscriptModelChange}
          label={`${providerName} Model (Transcript Processing)`}
          placeholder="Select model for transcript processing"
          disabled={disabled}
        />
      )}

      {!showMcpModel && !showTranscriptModel && (
        <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
          This provider is not currently selected for any functions. Configure
          provider selection above to use {providerName} models.
        </div>
      )}
    </div>
  )
}
